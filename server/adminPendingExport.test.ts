import { describe, expect, it } from "vitest";
import { buildPendingQuestionsCsv } from "../client/src/lib/adminPendingExport";

describe("待確認分類 CSV 匯出", () => {
  it("保留審核所需欄位，並安全跳脫官方題目中的引號", () => {
    const csv = buildPendingQuestionsCsv([{ id: "HARDWARE-9", text: "下列「哪一項」正確？", options: { A: "選項 A", B: "選項 B", C: "選項 C", D: "選項 D" }, correctOption: "B", subcategoryNotes: null, section: "電腦硬體裝修", subcategory: null, subcategoryStatus: "needs_manual_review" }]);
    expect(csv).toContain('"題號"');
    expect(csv).toContain('"HARDWARE-9"');
    expect(csv).toContain('"下列「哪一項」正確？"');
    expect(csv).toContain('"官方題幹未達單一分類信心門檻，保留人工判定。"');
    expect(csv).toContain('"needs_manual_review"');
  });
});
