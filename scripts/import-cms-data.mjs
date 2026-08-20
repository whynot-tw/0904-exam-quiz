import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const root = process.cwd();
const parsedQuestions = JSON.parse(fs.readFileSync(path.join(root, "source/questions-parsed.json"), "utf8"));
const legacyWrong = JSON.parse(fs.readFileSync(path.join(root, "source/legacy-migration-verified.json"), "utf8")).rows;
const manifest = JSON.parse(fs.readFileSync(path.join(root, "source/cms-import-manifest.json"), "utf8"));

const settings = [
  ["exam_date", "2026-09-04", "甄試日期"],
  ["target_score", "80", "最低目標分數"],
  ["mock_question_count", "20", "模擬考題數"],
  ["max_wrong_for_target", "4", "20 題達 80 分最多可錯題數"],
  ["wrong_mastery_consecutive_correct", "2", "錯題連續答對 2 次後改為已熟悉"],
  ["source_hardware_file_id", "1GmP0SCNd9NP8Vvp1sH-NHRYsCzZnlO9S", "試題一_電腦硬體裝修"],
  ["source_hardware_url", "https://drive.google.com/file/d/1GmP0SCNd9NP8Vvp1sH-NHRYsCzZnlO9S/view", "官方參考試題 Source of Truth"],
  ["source_ai_file_id", "1RIbQF_XG0eMP3i0UI9OkvOgq9zxySgyj", "試題二_AI人工智慧工具應用"],
  ["source_ai_url", "https://drive.google.com/file/d/1RIbQF_XG0eMP3i0UI9OkvOgq9zxySgyj/view", "官方參考試題 Source of Truth"],
  ["project_folder_id", "1YV27LhKnGnlER0mnZtmq0Sa3tHxeEfRt", "115_電腦應用與AI工具班_甄試準備"],
  ["webapp_folder_id", "1L7j_va_Mm7LAwnMQZG2TFFGTzwDRRmCh", "05_WebApp"],
  ["cms_import_manifest", JSON.stringify(manifest), "CMS import mapping and source traceability"],
  ["cms_imported_question_count", String(parsedQuestions.length), "Official PDF parsed question records"],
  ["cms_import_enabled_question_count", String(parsedQuestions.filter(question => question.enabled && question.import_status === "imported").length), "Questions available for practice"],
  ["cms_import_needs_review_count", String(parsedQuestions.filter(question => question.import_status === "needs_review").length), "Questions preserved but disabled for review"],
  ["cms_unmatched_review_notes", JSON.stringify([{ noteId: "legacy-reading-001", noteType: "題目看反", noteText: "Linux 重新啟動「何者錯誤」：題目看反，不算知識錯題。", source: "ReviewNotes!A2:G2" }]), "Legacy note without a resolvable questionId"],
];

const officialUrls = {
  HARDWARE: "https://drive.google.com/file/d/1GmP0SCNd9NP8Vvp1sH-NHRYsCzZnlO9S/view",
  AI: "https://drive.google.com/file/d/1RIbQF_XG0eMP3i0UI9OkvOgq9zxySgyj/view",
};

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for CMS import");
const db = await mysql.createConnection(process.env.DATABASE_URL);

try {
  await db.beginTransaction();

  for (let index = 0; index < parsedQuestions.length; index += 100) {
    const chunk = parsedQuestions.slice(index, index + 100);
    const values = chunk.map(question => [
      question.question_id, question.source_key, question.source_section, question.source_question_no,
      question.source_page ?? null, question.category ?? null, question.question_text, question.option_a,
      question.option_b, question.option_c, question.option_d, question.correct_option, question.explanation || null,
      question.enabled ? 1 : 0, question.requires_media ? 1 : 0, question.source_raw || null,
      question.source_url || officialUrls[question.source_key] || null, question.import_status, question.verified ? 1 : 0,
      question.notes || null,
    ]);
    await db.query(
      `INSERT INTO questions (questionId, sourceKey, sourceSection, sourceQuestionNo, sourcePage, category, questionText, optionA, optionB, optionC, optionD, correctOption, explanation, enabled, requiresMedia, sourceRaw, sourceUrl, importStatus, verified, notes)
       VALUES ?
       ON DUPLICATE KEY UPDATE sourceKey=VALUES(sourceKey), sourceSection=VALUES(sourceSection), sourceQuestionNo=VALUES(sourceQuestionNo), sourcePage=VALUES(sourcePage), category=VALUES(category), questionText=VALUES(questionText), optionA=VALUES(optionA), optionB=VALUES(optionB), optionC=VALUES(optionC), optionD=VALUES(optionD), correctOption=VALUES(correctOption), explanation=VALUES(explanation), enabled=VALUES(enabled), requiresMedia=VALUES(requiresMedia), sourceRaw=VALUES(sourceRaw), sourceUrl=VALUES(sourceUrl), importStatus=VALUES(importStatus), verified=VALUES(verified), notes=VALUES(notes)`,
      [values],
    );
  }

  for (const [key, value, notes] of settings) {
    await db.query(
      "INSERT INTO settings (`key`, value, notes) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value=VALUES(value), notes=VALUES(notes)",
      [key, value, notes],
    );
  }

  const [ownerRows] = await db.query("SELECT id FROM users ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, id LIMIT 1");
  const ownerId = ownerRows[0]?.id;
  if (!ownerId) throw new Error("CMS owner user was not found");

  for (const row of legacyWrong.filter(item => item.migration_status === "matched" && item.question_id)) {
    const [existing] = await db.query("SELECT id FROM wrongQuestions WHERE userId = ? AND questionId = ? LIMIT 1", [ownerId, row.question_id]);
    if (existing[0]) {
      await db.query("UPDATE wrongQuestions SET wrongCount = ?, consecutiveCorrect = ?, status = ?, migrationStatus = ?, updatedAt = NOW() WHERE id = ?", [row.wrong_count, row.consecutive_correct, row.status, row.migration_status, existing[0].id]);
    } else {
      await db.query("INSERT INTO wrongQuestions (userId, questionId, wrongCount, consecutiveCorrect, status, migrationStatus) VALUES (?, ?, ?, ?, ?, ?)", [ownerId, row.question_id, row.wrong_count, row.consecutive_correct, row.status, row.migration_status]);
    }
  }

  await db.commit();
  const [[questionCount]] = await db.query("SELECT COUNT(*) AS count FROM questions");
  const [[settingsCount]] = await db.query("SELECT COUNT(*) AS count FROM settings");
  const [[wrongCount]] = await db.query("SELECT COUNT(*) AS count FROM wrongQuestions WHERE userId = ?", [ownerId]);
  console.log(JSON.stringify({ questions: questionCount.count, settings: settingsCount.count, ownerId, wrongQuestions: wrongCount.count, unmatchedReviewNotes: 1, manifest: manifest.version }, null, 2));
} catch (error) {
  await db.rollback();
  throw error;
} finally {
  db.destroy();
}
