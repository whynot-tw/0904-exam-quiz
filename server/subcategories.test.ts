import { describe, expect, it } from "vitest";
import { ALL_SUBCATEGORIES, filterQuestionsBySubcategory, getSubcategories, getWeakestSubcategory } from "../client/src/lib/subcategories";

const questions = [
  { id: "HARDWARE-1", source: "HARDWARE", subcategory: "電腦硬體與組裝", subcategoryStatus: "assigned" },
  { id: "HARDWARE-2", source: "HARDWARE", subcategory: "待確認", subcategoryStatus: "needs_manual_review" },
  { id: "AI-1", source: "AI", subcategory: "AI 工具與生成式 AI", subcategoryStatus: "assigned" },
];

describe("subcategory filter", () => {
  it("derives only subcategories available within the selected course", () => {
    expect(getSubcategories(questions, "HARDWARE").map(item => item.label)).toEqual(["待確認", "電腦硬體與組裝"]);
  });

  it("keeps only questions in the selected subcategory or all questions when requested", () => {
    expect(filterQuestionsBySubcategory(questions, "待確認").map(question => question.id)).toEqual(["HARDWARE-2"]);
    expect(filterQuestionsBySubcategory(questions, ALL_SUBCATEGORIES).map(question => question.id)).toEqual(["HARDWARE-1", "HARDWARE-2", "AI-1"]);
  });

  it("finds the lowest-accuracy assigned subcategory while excluding pending classification", () => {
    expect(getWeakestSubcategory([
      { source: "待確認", accuracy: 0, completion: 0 },
      { source: "Linux／Unix 作業系統", accuracy: 40, completion: 30 },
      { source: "Windows 與桌面作業系統", accuracy: 40, completion: 10 },
    ])).toMatchObject({ source: "Windows 與桌面作業系統" });
    expect(getWeakestSubcategory([{ source: "待確認", accuracy: 0, completion: 0 }])).toBeNull();
  });
});
