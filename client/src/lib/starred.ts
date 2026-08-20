export type StarredQuestionRecord = {
  questionId: string;
  tag: string | null;
};

export function getStarredQuestionIds(rows: StarredQuestionRecord[], tagFilter: string) {
  return new Set(
    rows
      .filter(row => tagFilter === "全部" || row.tag === tagFilter)
      .map(row => row.questionId),
  );
}
