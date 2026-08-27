import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const records = JSON.parse(await fs.readFile(process.argv[2] ?? "/home/ubuntu/cms-backup/v2-records.json", "utf8")).records;
const a2 = JSON.parse(await fs.readFile(process.argv[3] ?? "/home/ubuntu/cms-backup/a2-decisions-structured.json", "utf8")).records;
const apply = process.argv.includes("--apply");
const a2Ids = new Set(a2.map(row => row["題號"]));
const expectedA2Ids = new Set(["HARDWARE-9", "HARDWARE-133", "HARDWARE-158", "HARDWARE-163", "HARDWARE-164", "HARDWARE-168", "HARDWARE-131-2", "AI-104"]);
const media = {
  "HARDWARE-158": "/manus-storage/HARDWARE-158_dc40f1b4.png",
  "HARDWARE-163": "/manus-storage/HARDWARE-163_56a2597d.png",
  "HARDWARE-164": "/manus-storage/HARDWARE-164-168_156a9053.png",
  "HARDWARE-168": "/manus-storage/HARDWARE-164-168_156a9053.png",
};
const optionPatches = {
  "HARDWARE-133": { optionA: ";" },
  "HARDWARE-163": { optionC: "負準位觸發" },
  "HARDWARE-168": { optionD: "6 。" },
};
if (records.length !== 649 || a2.length !== 8 || [...a2Ids].some(id => !expectedA2Ids.has(id)) || [...expectedA2Ids].some(id => !a2Ids.has(id))) throw new Error("V2/A2 input set does not match the required 649 + 8 records");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.query("SELECT questionId, correctOption, enabled, requiresMedia, optionA, optionC, optionD FROM questions");
  const cms = new Map(rows.map(row => [row.questionId, row]));
  const missing = records.filter(record => !cms.has(record.questionId));
  const answerMismatches = records.filter(record => cms.has(record.questionId) && record.officialAnswerLetter && record.officialAnswerLetter !== cms.get(record.questionId).correctOption).map(record => ({ questionId: record.questionId, cms: cms.get(record.questionId).correctOption, workbook: record.officialAnswerLetter }));
  const before = { total: rows.length, enabled: rows.filter(row => Number(row.enabled) === 1).length, disabled: rows.filter(row => Number(row.enabled) === 0).length };
  const expectedEnabled = rows.filter(row => !a2Ids.has(row.questionId) && Number(row.enabled) === 1).length + a2.filter(row => row.enabled).length;
  const expectedDisabled = rows.length - expectedEnabled;
  const report = { before, workbookRecords: records.length, a2Records: a2.length, missingInCms: missing.map(row => row.questionId), answerMismatches, expectedAfter: { total: rows.length, enabled: expectedEnabled, disabled: expectedDisabled }, optionPatches, media, safeToWrite: before.total === 657 && records.length === 649 && missing.length === 0 && answerMismatches.length === 0 && expectedEnabled === 656 && expectedDisabled === 1 };
  console.log(JSON.stringify(report, null, 2));
  if (!apply) process.exit(report.safeToWrite ? 0 : 2);
  if (!report.safeToWrite) throw new Error("dry-run gate failed; no writes performed");
  await connection.beginTransaction();
  for (const record of records) {
    const row = cms.get(record.questionId);
    const explanation = [
      record.why ? `【V2｜為什麼】\n${record.why}` : "",
      record.exclude ? `【V2｜排除重點】\n${record.exclude}` : "",
      record.memory ? `【V2｜記憶】\n${record.memory}` : "",
      record.basis ? `【解析依據】\n${record.basis}` : "",
      record.sourceNotice ? `【來源提醒】\n${record.sourceNotice}` : "",
    ].filter(Boolean).join("\n\n");
    const notes = [record.risk ? `V2 風險／備註：${record.risk}` : "", record.sourceNotice ? `V2 來源提醒：${record.sourceNotice}` : ""].filter(Boolean).join("\n");
    await connection.query("UPDATE questions SET subcategory = COALESCE(?, subcategory), explanation = ?, notes = CASE WHEN ? = '' THEN notes ELSE ? END, verified = CASE WHEN ? IN ('可採用', '已重寫', '完成') THEN 1 ELSE verified END WHERE questionId = ?", [record.subcategory, explanation || row.explanation, notes, notes, record.reviewStatus ?? "", record.questionId]);
  }
  for (const decision of a2) {
    const id = decision["題號"];
    const patch = optionPatches[id] ?? {};
    const enabled = decision.enabled ? 1 : 0;
    const requiresMedia = decision.requiresMedia ? 1 : 0;
    const mediaUrl = media[id] ?? null;
    const current = cms.get(id);
    const optionA = patch.optionA ?? current.optionA;
    const optionC = patch.optionC ?? current.optionC;
    const optionD = patch.optionD ?? current.optionD;
    const decisionNotes = decision["Manus 執行"] ?? decision["來源核對"] ?? null;
    await connection.query("UPDATE questions SET enabled = ?, requiresMedia = ?, mediaUrl = ?, optionA = ?, optionC = ?, optionD = ?, verified = 1, notes = ? WHERE questionId = ?", [enabled, requiresMedia, mediaUrl, optionA, optionC, optionD, decisionNotes, id]);
  }
  const [afterRows] = await connection.query("SELECT questionId, correctOption, enabled, requiresMedia, mediaUrl, optionA, optionC, optionD FROM questions");
  const after = { total: afterRows.length, enabled: afterRows.filter(row => Number(row.enabled) === 1).length, disabled: afterRows.filter(row => Number(row.enabled) === 0).length };
  const afterAnswerMismatches = records.filter(record => cms.has(record.questionId) && record.officialAnswerLetter && record.officialAnswerLetter !== cms.get(record.questionId).correctOption).map(record => record.questionId);
  const post = { after, ai104: afterRows.find(row => row.questionId === "AI-104"), a2: afterRows.filter(row => a2Ids.has(row.questionId)), afterAnswerMismatches };
  if (after.total !== 657 || after.enabled !== 656 || after.disabled !== 1 || post.ai104?.enabled !== 0 || afterAnswerMismatches.length !== 0) throw new Error(`post-write gate failed: ${JSON.stringify(post)}`);
  await connection.commit();
  console.log(JSON.stringify({ applied: true, post }, null, 2));
} catch (error) {
  try { await connection.rollback(); } catch {}
  throw error;
} finally {
  await connection.end();
}
