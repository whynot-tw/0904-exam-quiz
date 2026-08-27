import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const recordsPath = process.argv[2];
const outputPath = process.argv[3];
if (!recordsPath || !outputPath) throw new Error("usage: node dryRunV2CmsCompare.mjs <records.json> <report.json>");
const source = JSON.parse(await fs.readFile(recordsPath, "utf8"));
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await connection.query("SELECT questionId, correctOption, enabled, requiresMedia, questionText, optionA, optionB, optionC, optionD, explanation, sourceRaw, sourceUrl, notes FROM questions");
await connection.end();
const cms = new Map(rows.map(row => [row.questionId, row]));
const workbookIds = new Set(source.records.map(record => record.questionId));
const missingInCms = source.records.filter(record => !cms.has(record.questionId)).map(record => record.questionId);
const missingInWorkbook = rows.filter(row => !workbookIds.has(row.questionId)).map(row => row.questionId);
const answerMismatches = [];
for (const record of source.records) {
  const row = cms.get(record.questionId);
  if (!row) continue;
  const workbookAnswer = record.officialAnswerLetter;
  if (workbookAnswer && workbookAnswer !== row.correctOption) {
    answerMismatches.push({ questionId: record.questionId, cms: row.correctOption, workbook: workbookAnswer, raw: record.officialAnswerRaw });
  }
}
const report = {
  sourceFile: source.sourceFile,
  workbookRecordCount: source.records.length,
  cmsQuestionCount: rows.length,
  cmsEnabledCount: rows.filter(row => Number(row.enabled) === 1).length,
  cmsDisabledCount: rows.filter(row => Number(row.enabled) === 0).length,
  missingInCms,
  missingInWorkbook,
  answerMismatches,
  answerMismatchCount: answerMismatches.length,
  currentAi104: cms.get("AI-104") ? { ...cms.get("AI-104") } : null,
  a2: Object.fromEntries(["HARDWARE-9", "HARDWARE-133", "HARDWARE-158", "HARDWARE-163", "HARDWARE-164", "HARDWARE-168", "HARDWARE-131-2"].map(id => [id, cms.get(id) ? { enabled: cms.get(id).enabled, requiresMedia: cms.get(id).requiresMedia, correctOption: cms.get(id).correctOption, options: [cms.get(id).optionA, cms.get(id).optionB, cms.get(id).optionC, cms.get(id).optionD] } : null])),
  safeToWrite: source.records.length === 649 && rows.length === 657 && missingInCms.length === 0 && missingInWorkbook.length === 8 && answerMismatches.length === 0,
};
await fs.writeFile(outputPath, JSON.stringify(report, null, 2), "utf8");
console.log(JSON.stringify({ outputPath, workbookRecordCount: report.workbookRecordCount, cmsQuestionCount: report.cmsQuestionCount, answerMismatchCount: report.answerMismatchCount, missingInCms: report.missingInCms.length, missingInWorkbook: report.missingInWorkbook.length, safeToWrite: report.safeToWrite }, null, 2));
