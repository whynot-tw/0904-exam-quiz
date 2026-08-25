import { describe, expect, it } from "vitest";
import { buildWrongQuestionCsv, escapeCsvValue, getWrongQuestionCsvFilename } from "../client/src/lib/wrongQuestionCsv";

const sample = {
  questionId: "HARDWARE-1",
  text: "請選出正確的硬體敘述。",
  options: { A: "錯誤選項", B: "官方正解", C: "其他選項", D: "=公式開頭的官方選項" },
  selectedOption: "A" as const,
  officialAnswer: "B" as const,
  officialExplanation: "此題依官方題庫解析。",
  status: "待複習" as const,
  wrongCount: 2,
  consecutiveCorrect: 0,
  updatedAt: new Date("2026-08-21T00:00:00.000Z"),
  conciseExplanation: { summary: "先找官方關鍵條件。", memoryTip: "先排除不符選項。", generatedAt: new Date("2026-08-21T01:02:03.000Z"), generationCount: 3, feedback: "unclear" },
};

describe("錯題本 CSV 匯出", () => {
  it("輸出官方內容、個人作答與精簡解析，並保護 CSV 欄位", () => {
    const csv = buildWrongQuestionCsv([sample]);
    expect(csv).toContain('"題號"');
    expect(csv).toContain('"HARDWARE-1"');
    expect(csv).toContain('"A：錯誤選項"');
    expect(csv).toContain('"B：官方正解"');
    expect(csv).toContain('"先找官方關鍵條件。"');
    expect(csv).toContain('"\'=公式開頭的官方選項"');
    expect(escapeCsvValue('含有"引號"')).toBe('"含有""引號"""');
    expect(getWrongQuestionCsvFilename(new Date("2026-08-21T00:00:00.000Z"))).toBe("錯題本離線複習_20260821.csv");
  });
});
