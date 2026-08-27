import { describe, expect, it } from "vitest";
import { cmsQuestionToQuizQuestion, toClientQuestion } from "./quizData";

describe("CMS question media mapping", () => {
  it("preserves official answer and exposes media URL for a media question", () => {
    const question = cmsQuestionToQuizQuestion({
      questionId: "HARDWARE-164",
      sourceKey: "HARDWARE",
      sourceSection: "硬體",
      sourceQuestionNo: "164",
      sourcePage: 10,
      category: "硬體",
      subcategory: "數位邏輯",
      subcategoryStatus: "assigned",
      subcategoryNotes: null,
      questionText: "波形題",
      optionA: "3",
      optionB: "4",
      optionC: "5",
      optionD: "6 。",
      correctOption: "C",
      explanation: "V2 explanation",
      enabled: 1,
      requiresMedia: 1,
      mediaUrl: "/manus-storage/HARDWARE-164-168_156a9053.png",
      sourceRaw: null,
      sourceUrl: "official-pdf-url",
      importStatus: "imported",
      verified: 1,
      notes: null,
    });
    const client = toClientQuestion(question);
    expect(client.correctOption).toBe("C");
    expect(client.requiresMedia).toBe(true);
    expect(client.mediaUrl).toBe("/manus-storage/HARDWARE-164-168_156a9053.png");
    expect(client.options.D).toBe("6 。");
  });

  it("does not require a media URL for AI-104", () => {
    const question = cmsQuestionToQuizQuestion({
      questionId: "AI-104",
      sourceKey: "AI",
      sourceSection: "AI",
      sourceQuestionNo: "104",
      sourcePage: 12,
      category: "AI",
      subcategory: "隱私",
      subcategoryStatus: "assigned",
      subcategoryNotes: null,
      questionText: "透明化數據收集政策",
      optionA: "增加客戶滿意度",
      optionB: "失去客戶信任和面臨法律後果",
      optionC: "增加數據收集效率",
      optionD: "",
      correctOption: "B",
      explanation: "V2 explanation",
      enabled: 0,
      requiresMedia: 0,
      mediaUrl: null,
      sourceRaw: null,
      sourceUrl: "official-pdf-url",
      importStatus: "needs_review",
      verified: 1,
      notes: "non_four_choice",
    });
    const client = toClientQuestion(question);
    expect(client.correctOption).toBe("B");
    expect(client.enabled).toBe(false);
    expect(client.requiresMedia).toBe(false);
    expect(client.mediaUrl).toBe("");
  });
});
