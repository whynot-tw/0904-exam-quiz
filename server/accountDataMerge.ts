export const ACCOUNT_DATA_MERGE_SCOPES = [
  "attempts",
  "attemptAnswers",
  "wrongQuestions",
  "wrongQuestionConciseExplanations",
  "starredQuestions",
] as const;

export type AccountDataMergeConflictCounts = {
  wrongQuestions: number;
  conciseExplanations: number;
  starredQuestions: number;
};

export function assertNoAccountDataMergeConflicts(conflicts: AccountDataMergeConflictCounts) {
  const conflictingScopes = Object.entries(conflicts)
    .filter(([, count]) => count > 0)
    .map(([scope]) => scope);

  if (conflictingScopes.length) {
    throw new Error(`帳號資料整合前檢查發現重疊資料：${conflictingScopes.join("、")}`);
  }
}
