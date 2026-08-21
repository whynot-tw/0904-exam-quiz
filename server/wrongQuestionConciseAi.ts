import type { QuizQuestion } from "./quizData";

export type ConciseWrongQuestionExplanation = {
  summary: string;
  memoryTip: string;
  sourceNotice: string;
};

export function buildConciseWrongQuestionAiMessages(question: QuizQuestion, selectedOption: string | null | undefined, regenerate = false) {
  return [
    {
      role: "system" as const,
      content: "你是考試複習助教。只能根據提供的官方題幹、選項、官方正解及官方解析輸出繁體中文 JSON。不可更正、推測或改寫官方答案。輸出必須極精簡：summary 說明判斷關鍵，memoryTip 提供一行記憶口訣或排除法，sourceNotice 固定提醒以官方資料為準。",
    },
    {
      role: "user" as const,
      content: JSON.stringify({
        task: regenerate ? "使用者認為前次說明不夠清楚，請換成更直接、更容易背誦的表述。" : "產生精簡複習解析。",
        officialQuestion: question.question_text,
        officialOptions: { A: question.option_a, B: question.option_b, C: question.option_c, D: question.option_d },
        officialAnswer: question.correct_option,
        officialExplanation: question.explanation || "官方資料未提供解析。",
        userSelectedOption: selectedOption ?? "無可用作答紀錄",
      }),
    },
  ];
}

export function parseConciseWrongQuestionExplanation(content: string): ConciseWrongQuestionExplanation {
  const parsed = JSON.parse(content) as Partial<ConciseWrongQuestionExplanation>;
  const required = ["summary", "memoryTip", "sourceNotice"] as const;
  for (const key of required) {
    if (typeof parsed[key] !== "string" || !parsed[key].trim()) throw new Error("Concise AI explanation response is incomplete");
  }
  return {
    summary: parsed.summary!.trim(),
    memoryTip: parsed.memoryTip!.trim(),
    sourceNotice: parsed.sourceNotice!.trim(),
  };
}
