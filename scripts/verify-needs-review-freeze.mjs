import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const root = process.cwd();
const sourceQuestions = JSON.parse(fs.readFileSync(path.join(root, "source/questions-parsed.json"), "utf8"))
  .filter(question => question.import_status === "needs_review")
  .sort((a, b) => a.question_id.localeCompare(b.question_id));

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const db = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const [rows] = await db.query(
    "SELECT questionId, questionText, optionA, optionB, optionC, optionD, correctOption, explanation, enabled, importStatus, verified, notes, requiresMedia, sourceRaw FROM questions WHERE importStatus = 'needs_review' ORDER BY questionId",
  );
  const fields = [
    ["questionId", "question_id"], ["questionText", "question_text"], ["optionA", "option_a"], ["optionB", "option_b"],
    ["optionC", "option_c"], ["optionD", "option_d"], ["correctOption", "correct_option"], ["explanation", "explanation"],
    ["enabled", "enabled"], ["importStatus", "import_status"], ["verified", "verified"], ["notes", "notes"],
    ["requiresMedia", "requires_media"], ["sourceRaw", "source_raw"],
  ];
  const cmsById = new Map(rows.map(row => [row.questionId, row]));
  const differences = [];

  for (const source of sourceQuestions) {
    const cms = cmsById.get(source.question_id);
    if (!cms) {
      differences.push({ questionId: source.question_id, issue: "missing_from_cms" });
      continue;
    }
    for (const [cmsKey, sourceKey] of fields) {
      const actual = cms[cmsKey] ?? null;
      const expected = source[sourceKey] ?? null;
      const normalize = value => {
        if (typeof value === "number") return Boolean(value);
        if ((cmsKey === "explanation" || cmsKey === "notes") && (value === null || value === "")) return null;
        return value;
      };
      const normalizedActual = normalize(actual);
      const normalizedExpected = normalize(expected);
      if (normalizedActual !== normalizedExpected) {
        differences.push({ questionId: source.question_id, field: cmsKey, expected: normalizedExpected, actual: normalizedActual });
      }
    }
  }

  const extraCmsIds = rows.filter(row => !sourceQuestions.some(source => source.question_id === row.questionId)).map(row => row.questionId);
  const result = {
    sourceNeedsReviewCount: sourceQuestions.length,
    cmsNeedsReviewCount: rows.length,
    comparedFields: fields.map(([cmsKey]) => cmsKey),
    questionIds: sourceQuestions.map(question => question.question_id),
    extraCmsIds,
    differences,
    passed: sourceQuestions.length === 8 && rows.length === 8 && extraCmsIds.length === 0 && differences.length === 0,
  };
  console.log(JSON.stringify(result, null, 2));
  if (!result.passed) process.exitCode = 1;
} finally {
  db.destroy();
}
