import { describe, expect, it } from "vitest";
import { getStarredQuestionIds } from "../client/src/lib/starred";

describe("starred tag filter", () => {
  const rows = [
    { questionId: "HARDWARE-1", tag: "容易混淆" },
    { questionId: "HARDWARE-2", tag: "考前必看" },
    { questionId: "AI-1", tag: "容易混淆" },
    { questionId: "AI-2", tag: null },
  ];

  it("keeps only questions with the selected star tag", () => {
    expect([...getStarredQuestionIds(rows, "容易混淆")]).toEqual(["HARDWARE-1", "AI-1"]);
  });

  it("keeps every starred question when the all-tags filter is selected", () => {
    expect([...getStarredQuestionIds(rows, "全部")]).toEqual(["HARDWARE-1", "HARDWARE-2", "AI-1", "AI-2"]);
  });
});
