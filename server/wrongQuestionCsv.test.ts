import { describe, expect, it } from "vitest";
import { buildWrongQuestionCsv, escapeCsvValue, filterWrongQuestionCsvItems, getWrongQuestionCsvFilename, readWrongQuestionCsvPresets, renameWrongQuestionCsvPreset, serializeWrongQuestionCsvPresets } from "../client/src/lib/wrongQuestionCsv";

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

  it("依勾選欄位、待複習狀態與含邊界的日期區間過濾個人錯題", () => {
    const later = { ...sample, questionId: "HARDWARE-2", status: "已熟悉" as const, updatedAt: new Date("2026-08-22T00:00:00.000Z"), conciseExplanation: null };
    const filtered = filterWrongQuestionCsvItems([sample, later], { status: "待複習", startDate: "2026-08-21", endDate: "2026-08-21" });
    expect(filtered).toEqual([sample]);
    expect(buildWrongQuestionCsv(filtered, ["questionId", "officialAnswer"])).toBe('"題號","官方正解"\r\n"HARDWARE-1","B：官方正解"');
    expect(() => filterWrongQuestionCsvItems([sample], { status: "全部", startDate: "2026-08-22", endDate: "2026-08-21" })).toThrow("起始日期不可晚於結束日期");
  });

  it("保存欄位組合時會保留可用欄位、排除損毀設定，並可依官方分類篩選", () => {
    const classified = { ...sample, courseType: "HARDWARE", courseLabel: "電腦硬體裝修", subcategory: "電腦硬體與組裝" };
    const otherCourse = { ...sample, questionId: "AI-1", courseType: "AI", courseLabel: "AI人工智慧工具應用", subcategory: "AI 工具與生成式 AI" };
    expect(filterWrongQuestionCsvItems([classified, otherCourse], { status: "全部", courseType: "AI", subcategory: "AI 工具與生成式 AI" })).toEqual([otherCourse]);
    const presets = readWrongQuestionCsvPresets(JSON.stringify([{ id: "core", name: "重點欄位", columnKeys: ["questionId", "courseLabel", "unknown"] }, { id: 1, name: "無效", columnKeys: ["questionId"] }]));
    expect(presets).toEqual([{ id: "core", name: "重點欄位", columnKeys: ["questionId", "courseLabel"] }]);
    expect(readWrongQuestionCsvPresets(serializeWrongQuestionCsvPresets(presets))).toEqual(presets);
  });

  it("可重新命名已保存欄位組合，並拒絕空白或重複名稱", () => {
    const presets = [{ id: "core", name: "重點欄位", columnKeys: ["questionId", "courseLabel"] as const }, { id: "review", name: "考前複習", columnKeys: ["questionId"] as const }];
    expect(renameWrongQuestionCsvPreset(presets, "core", "  考前精簡版  ")).toEqual([{ ...presets[0], name: "考前精簡版" }, presets[1]]);
    expect(() => renameWrongQuestionCsvPreset(presets, "core", "")).toThrow("請輸入欄位組合名稱");
    expect(() => renameWrongQuestionCsvPreset(presets, "core", "考前複習")).toThrow("已有相同名稱的欄位組合");
  });
});
