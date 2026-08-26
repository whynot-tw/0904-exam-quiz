import { describe, expect, it } from "vitest";
import { buildOfficialQuestionConciseAiMessages, parseOfficialQuestionConciseExplanation } from "./officialQuestionConciseAi";

describe("全題官方精簡 AI 解析", () => {
  const question = { question_id: "AI-1", question_text: "官方題幹", option_a: "甲", option_b: "乙", option_c: "丙", option_d: "丁", correct_option: "B", explanation: "官方解析", enabled: true, import_status: "imported" } as any;

  it("只將官方題目、選項、答案與解析交給模型，不帶個人作答資料", () => {
    const messages = buildOfficialQuestionConciseAiMessages(question);
    const input = JSON.parse(messages[1].content as string);
    expect(input).toMatchObject({ officialQuestion: "官方題幹", officialAnswer: "B", officialExplanation: "官方解析" });
    expect(input).not.toHaveProperty("userSelectedOption");
  });

  it("拒絕缺少結構欄位的模型內容", () => {
    expect(() => parseOfficialQuestionConciseExplanation(JSON.stringify({ summary: "重點", memoryTip: "口訣" }))).toThrow("incomplete");
  });
});
