import type { QuizQuestion } from "./quizData";

export type WrongQuestionAiExplanation = {
  errorReason: string;
  whyItMatters: string;
  correctThinking: string;
  reviewTip: string;
  sourceNotice: string;
};

export function buildWrongQuestionAiMessages(question: QuizQuestion, selectedOption?: string) {
  return [
    {
      role: "system" as const,
      content: "你是備考輔導員。只能以使用者提供的官方題庫內容回答，絕不可使用網路、新版軟體知識、外部事實或自行改正官方答案。官方答案、題幹、選項與官方解析皆為固定資料；你的工作只是在不改寫它們的前提下，用繁體中文補充理解方式。避免宣稱官方答案有誤。",
    },
    {
      role: "user" as const,
      content: `請為以下錯題提供簡潔的學習補充。\n\n題號：${question.question_id}\n題幹：${question.question_text}\n選項 A：${question.option_a}\n選項 B：${question.option_b}\n選項 C：${question.option_c}\n選項 D：${question.option_d}\n官方正解：${question.correct_option}\n官方解析：${question.explanation || "官方資料未提供解析。"}\n使用者最近選擇：${selectedOption || "未提供"}\n\n請輸出：錯誤原因（若未提供最近選擇，請說明無法判定個人選項）、此題關鍵、正確思路、複習重點，以及一段說明資料仍以官方題庫為準的提示。`,
    },
  ];
}

export function parseWrongQuestionAiExplanation(content: string): WrongQuestionAiExplanation {
  const parsed = JSON.parse(content) as Partial<WrongQuestionAiExplanation>;
  const required = ["errorReason", "whyItMatters", "correctThinking", "reviewTip", "sourceNotice"] as const;
  for (const key of required) {
    if (typeof parsed[key] !== "string" || !parsed[key].trim()) throw new Error("AI explanation response is incomplete");
  }
  return {
    errorReason: parsed.errorReason!.trim(),
    whyItMatters: parsed.whyItMatters!.trim(),
    correctThinking: parsed.correctThinking!.trim(),
    reviewTip: parsed.reviewTip!.trim(),
    sourceNotice: parsed.sourceNotice!.trim(),
  };
}
