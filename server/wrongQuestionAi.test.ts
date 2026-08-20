import { describe, expect, it } from "vitest";
import { buildWrongQuestionAiMessages, parseWrongQuestionAiExplanation } from "./wrongQuestionAi";
import type { QuizQuestion } from "./quizData";

const officialQuestion: QuizQuestion = {
  question_id: "HARDWARE-1", source_key: "HARDWARE", source_section: "電腦硬體裝修", source_question_no: "1", source_page: 1, category: "電腦硬體裝修", subcategory: "電腦硬體與組裝", subcategory_status: "assigned", subcategory_notes: "", question_text: "官方題幹", option_a: "選項 A", option_b: "選項 B", option_c: "選項 C", option_d: "選項 D", correct_option: "B", explanation: "官方解析", enabled: true, requires_media: false, source_raw: "不應傳給 AI 的原始內容", source_url: "https://example.invalid", import_status: "imported", verified: true, notes: "",
};

describe("錯題 AI 解析保護規則", () => {
  it("只提供官方題目、選項、答案與官方解析，不傳遞原始來源欄位", () => {
    const messages = buildWrongQuestionAiMessages(officialQuestion, "A");
    expect(messages[1].content).toContain("官方正解：B");
    expect(messages[1].content).toContain("官方解析：官方解析");
    expect(messages[1].content).not.toContain(officialQuestion.source_raw);
    expect(messages[0].content).toContain("絕不可使用網路");
  });

  it("只接受完整結構化 AI 補充內容", () => {
    expect(parseWrongQuestionAiExplanation(JSON.stringify({ errorReason: "選項與官方正解不同", whyItMatters: "關鍵", correctThinking: "思路", reviewTip: "重點", sourceNotice: "以官方為準" }))).toEqual({ errorReason: "選項與官方正解不同", whyItMatters: "關鍵", correctThinking: "思路", reviewTip: "重點", sourceNotice: "以官方為準" });
    expect(() => parseWrongQuestionAiExplanation(JSON.stringify({ whyItMatters: "關鍵" }))).toThrow("incomplete");
  });
});
