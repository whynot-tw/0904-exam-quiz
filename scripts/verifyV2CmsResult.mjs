import mysql from "mysql2/promise";
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [counts] = await connection.query("SELECT COUNT(*) AS total, SUM(enabled = 1) AS enabled, SUM(enabled = 0) AS disabled FROM questions");
const [rows] = await connection.query("SELECT questionId, correctOption, enabled, requiresMedia, mediaUrl, optionA, optionC, optionD FROM questions WHERE questionId IN ('HARDWARE-9','HARDWARE-133','HARDWARE-158','HARDWARE-163','HARDWARE-164','HARDWARE-168','HARDWARE-131-2','AI-104') ORDER BY questionId");
await connection.end();
const a2Ids = new Set(['HARDWARE-9','HARDWARE-133','HARDWARE-158','HARDWARE-163','HARDWARE-164','HARDWARE-168','HARDWARE-131-2']);
const expectedMedia = new Map([
  ['HARDWARE-158','/manus-storage/HARDWARE-158_dc40f1b4.png'],
  ['HARDWARE-163','/manus-storage/HARDWARE-163_56a2597d.png'],
  ['HARDWARE-164','/manus-storage/HARDWARE-164-168_156a9053.png'],
  ['HARDWARE-168','/manus-storage/HARDWARE-164-168_156a9053.png'],
]);
const expectedAnswers = { 'HARDWARE-9':'D','HARDWARE-133':'A','HARDWARE-158':'A','HARDWARE-163':'D','HARDWARE-164':'C','HARDWARE-168':'A','HARDWARE-131-2':'B','AI-104':'B' };
const mismatches = rows.flatMap(row => {
  const issues = [];
  if (row.correctOption !== expectedAnswers[row.questionId]) issues.push('correctOption');
  if (row.questionId === 'AI-104' && (Number(row.enabled) !== 0 || Number(row.requiresMedia) !== 0 || row.mediaUrl !== null)) issues.push('AI-104-state');
  if (a2Ids.has(row.questionId) && (Number(row.enabled) !== 1 || Number(row.requiresMedia) !== (expectedMedia.has(row.questionId) ? 1 : 0) || (expectedMedia.get(row.questionId) ?? null) !== row.mediaUrl)) issues.push('A2-media-state');
  return issues.map(issue => ({ questionId: row.questionId, issue, row }));
});
const result = { counts: counts[0], rows, mismatches, safe: Number(counts[0].total) === 657 && Number(counts[0].enabled) === 656 && Number(counts[0].disabled) === 1 && mismatches.length === 0 };
console.log(JSON.stringify(result, null, 2));
if (!result.safe) process.exit(2);
