import { describe, expect, it } from "vitest";
import { getOfficialV2Explanation, splitExplanationSections } from "../client/src/lib/explanationDisplay";

describe("official V2 explanation display", () => {
  it("uses the official answer and V2 explanation fields", () => {
    expect(
      getOfficialV2Explanation({
        correctOption: " B ",
        explanation: "V2：先辨識模型的欠擬合特徵。",
      }),
    ).toEqual({
      officialAnswer: "B",
      v2Explanation: "V2：先辨識模型的欠擬合特徵。",
    });
  });

  it("does not fall back to legacy AI or concise explanation fields", () => {
    expect(getOfficialV2Explanation({ correctOption: null, explanation: "" })).toEqual({
      officialAnswer: "—",
      v2Explanation: "官方資料未提供 V2 解析。",
    });
  });

  it("splits semantic V2 markers into readable sections", () => {
    expect(
      splitExplanationSections("【V2｜為什麼】先說明原因。 【V2｜排除重點】再列出排除理由。 【V2｜記憶】最後給記憶句。"),
    ).toEqual([
      { heading: "V2｜為什麼", body: "先說明原因。" },
      { heading: "V2｜排除重點", body: "再列出排除理由。" },
      { heading: "V2｜記憶", body: "最後給記憶句。" },
    ]);
  });

  it("keeps an explanation without semantic markers as one paragraph", () => {
    expect(splitExplanationSections("官方解析內容。第二句仍屬同一段。")).toEqual([
      { body: "官方解析內容。第二句仍屬同一段。" },
    ]);
  });
});
