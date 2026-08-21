import { describe, expect, it } from "vitest";
import { buildPdfWeaknessAnalysisMessages, parsePdfWeaknessSummary } from "./wrongQuestionPdfAi";

describe("PDF AI 弱點分析", () => {
  it("只以個人錯題與官方資料建立分析提示，並驗證結構化輸出", () => {
    const messages = buildPdfWeaknessAnalysisMessages([{ questionId: "HARDWARE-1", category: "電腦硬體", subcategory: "網路與通訊", questionText: "測試題幹", officialAnswer: "B", officialExplanation: "官方解析", selectedOption: "A", wrongCount: 2, consecutiveCorrect: 0, status: "待複習" }]);
    expect(messages[0].content).toContain("絕不可使用網路");
    expect(messages[1].content).toContain("官方正解：B");
    expect(messages[1].content).toContain("網路與通訊：1 題");

    const summary = parsePdfWeaknessSummary(JSON.stringify({ headline: "先釐清網路觀念", overallAssessment: "錯題集中於網路與通訊。", priorityTopics: [{ topic: "網路與通訊", evidence: "此範圍有 1 題待複習。", advice: "先依官方解析重做。" }], reviewPlan: ["先閱讀官方解析", "完成一回錯題重刷", "隔日再次複習"], sourceNotice: "本建議僅依官方題庫與個人錯題整理。" }));
    expect(summary.priorityTopics[0]?.topic).toBe("網路與通訊");
    expect(summary.reviewPlan).toHaveLength(3);
  });
});
