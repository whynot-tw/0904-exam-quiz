import mysql from "mysql2/promise";

const model = process.env.OFFICIAL_CONCISE_MODEL || "gpt-5-mini";
const concurrency = Math.max(1, Math.min(Number(process.env.OFFICIAL_CONCISE_CONCURRENCY || 4), 8));
const regenerate = process.env.OFFICIAL_CONCISE_REGENERATE === "1";
const limit = Math.max(0, Number(process.env.OFFICIAL_CONCISE_LIMIT || 0));
const databaseUrl = process.env.DATABASE_URL;
const apiUrl = `${(process.env.BUILT_IN_FORGE_API_URL || "https://forge.manus.im").replace(/\/$/, "")}/v1/chat/completions`;
const apiKey = process.env.BUILT_IN_FORGE_API_KEY;

if (!databaseUrl || !apiKey) throw new Error("DATABASE_URL and BUILT_IN_FORGE_API_KEY are required");

const schema = {
  type: "json_schema",
  json_schema: {
    name: "official_question_concise_note",
    strict: true,
    schema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        memoryTip: { type: "string" },
        sourceNotice: { type: "string" },
      },
      required: ["summary", "memoryTip", "sourceNotice"],
      additionalProperties: false,
    },
  },
};

function messages(question) {
  return [
    { role: "system", content: "你是考試複習助教。只能根據提供的官方題幹、選項、官方正解及官方解析輸出繁體中文 JSON。不可使用外部知識、不可更正、推測或改寫官方答案。輸出必須極精簡：summary 說明判斷關鍵，memoryTip 提供一行記憶口訣或排除法，sourceNotice 固定提醒以官方資料為準。" },
    { role: "user", content: JSON.stringify({ task: "產生全題共用的精簡複習解析。", officialQuestion: question.questionText, officialOptions: { A: question.optionA, B: question.optionB, C: question.optionC, D: question.optionD }, officialAnswer: question.correctOption, officialExplanation: question.explanation || "官方資料未提供解析。" }) },
  ];
}

async function generateOne(connection, question) {
  const response = await fetch(apiUrl, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model, messages: messages(question), max_completion_tokens: 900, response_format: schema }) });
  if (!response.ok) {
    const detail = await response.text();
    if (response.status === 412 && detail.includes("usage exhausted")) {
      const error = new Error("LLM usage is temporarily exhausted");
      error.code = "USAGE_EXHAUSTED";
      throw error;
    }
    throw new Error(`LLM returned ${response.status}: ${detail}`);
  }
  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("LLM response content is empty");
  const note = JSON.parse(content);
  if (![note.summary, note.memoryTip, note.sourceNotice].every(value => typeof value === "string" && value.trim())) throw new Error("LLM response is missing concise fields");
  await connection.execute(
    "INSERT INTO officialQuestionConciseExplanations (questionId, summary, memoryTip, sourceNotice, model, generationCount, generatedAt, updatedAt) VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW()) ON DUPLICATE KEY UPDATE summary = VALUES(summary), memoryTip = VALUES(memoryTip), sourceNotice = VALUES(sourceNotice), model = VALUES(model), generationCount = generationCount + 1, generatedAt = NOW(), updatedAt = NOW()",
    [question.questionId, note.summary.trim(), note.memoryTip.trim(), note.sourceNotice.trim(), model],
  );
}

const connection = await mysql.createConnection(databaseUrl);
try {
  const [questions] = await connection.execute("SELECT questionId, questionText, optionA, optionB, optionC, optionD, correctOption, explanation FROM questions WHERE enabled = 1 ORDER BY id");
  const [existingRows] = await connection.execute("SELECT questionId FROM officialQuestionConciseExplanations");
  const existingIds = new Set(existingRows.map(row => row.questionId));
  const candidates = regenerate ? questions : questions.filter(question => !existingIds.has(question.questionId));
  const pending = limit ? candidates.slice(0, limit) : candidates;
  console.log(`Official concise generation: ${pending.length}/${questions.length} question(s), model=${model}, concurrency=${concurrency}, regenerate=${regenerate}`);
  const failed = [];
  let usageExhausted = false;
  for (let offset = 0; offset < pending.length; offset += concurrency) {
    const batch = pending.slice(offset, offset + concurrency);
    const outcomes = await Promise.all(batch.map(async question => {
      try { await generateOne(connection, question); return { questionId: question.questionId, ok: true }; }
      catch (error) { return { questionId: question.questionId, ok: false, usageExhausted: error && typeof error === "object" && error.code === "USAGE_EXHAUSTED", error: error instanceof Error ? error.message : String(error) }; }
    }));
    for (const outcome of outcomes) if (!outcome.ok) failed.push(outcome);
    if (outcomes.some(outcome => outcome.usageExhausted)) { usageExhausted = true; break; }
    console.log(`Progress ${Math.min(offset + batch.length, pending.length)}/${pending.length}; failed=${failed.length}`);
  }
  if (usageExhausted) {
    console.error("Generation paused because the LLM usage is temporarily exhausted. Re-run this script later; completed rows are preserved and only missing questions will be requested.");
    process.exitCode = 2;
  } else if (failed.length) {
    console.error("Failed question IDs:", failed.map(row => `${row.questionId}: ${row.error}`).join("\n"));
    process.exitCode = 1;
  } else {
    console.log("Official concise generation completed successfully.");
  }
} finally {
  await connection.end();
}
