import { describe, expect, it } from "vitest";
import { getOfficialV2Explanation } from "./explanationDisplay";

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
});
