import type { QuizQuestion } from "./quizData";
import { parseConciseWrongQuestionExplanation } from "./wrongQuestionConciseAi";

export function buildOfficialQuestionConciseAiMessages(question: QuizQuestion) {
  return [
    {
      role: "system" as const,
      content: "你是考試複習助教。只能根據提供的官方題幹、選項、官方正解及官方解析輸出繁體中文 JSON。不可使用外部知識、不可更正、推測或改寫官方答案。輸出必須極精簡：summary 說明判斷關鍵，memoryTip 提供一行記憶口訣或排除法，sourceNotice 固定提醒以官方資料為準。",
    },
    {
      role: "user" as const,
      content: JSON.stringify({
        task: "產生全題共用的精簡複習解析。",
        officialQuestion: question.question_text,
        officialOptions: { A: question.option_a, B: question.option_b, C: question.option_c, D: question.option_d },
        officialAnswer: question.correct_option,
        officialExplanation: question.explanation || "官方資料未提供解析。",
      }),
    },
  ];
}

export { parseConciseWrongQuestionExplanation as parseOfficialQuestionConciseExplanation };
