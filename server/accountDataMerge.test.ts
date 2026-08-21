import { describe, expect, it } from "vitest";
import { ACCOUNT_DATA_MERGE_SCOPES, assertNoAccountDataMergeConflicts } from "./accountDataMerge";

describe("帳號學習資料整合預檢", () => {
  it("只包含使用者指定的作答、錯題／精簡解析與星號標記資料表", () => {
    expect(ACCOUNT_DATA_MERGE_SCOPES).toEqual([
      "attempts",
      "attemptAnswers",
      "wrongQuestions",
      "wrongQuestionConciseExplanations",
      "starredQuestions",
    ]);
  });

  it("重疊數量為零時允許整合，有重疊時要求先處理衝突", () => {
    expect(() => assertNoAccountDataMergeConflicts({ wrongQuestions: 0, conciseExplanations: 0, starredQuestions: 0 })).not.toThrow();
    expect(() => assertNoAccountDataMergeConflicts({ wrongQuestions: 1, conciseExplanations: 0, starredQuestions: 2 })).toThrow("wrongQuestions、starredQuestions");
  });
});
