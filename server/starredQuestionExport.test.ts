import { describe, expect, it } from "vitest";
import { buildStarredQuestionCsv, buildStarredQuestionExportItems } from "@/lib/starredQuestionExport";

describe("星號題庫匯出", () => {
  it("只整理存在於題庫的星號題，並保留官方答案、解析與個人標籤", () => {
    const items = buildStarredQuestionExportItems([
      { questionId: "AI-1", tag: "考前必看", createdAt: "2026-08-20T00:00:00.000Z", reminderDate: "2026-09-03" },
      { questionId: "MISSING", tag: "不應匯出" },
    ], [{ id: "AI-1", text: "哪一項是 AI？", options: { A: "甲", B: "乙", C: "丙", D: "丁" }, correctOption: "C", explanation: "官方解析內容", courseType: "AI", courseLabel: "人工智慧" }]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ questionId: "AI-1", officialAnswer: "C", starredTag: "考前必看", reminderDate: "2026-09-03", officialExplanation: "官方解析內容" });
    expect(buildStarredQuestionCsv(items)).toContain("AI-1");
    expect(buildStarredQuestionCsv(items)).toContain("官方解析內容");
  });
});
