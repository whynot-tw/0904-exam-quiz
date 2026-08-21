export type WrongQuestionStatus = "待複習" | "已熟悉" | "全部";

export function filterWrongQuestions<T extends { status: string }>(rows: T[], status: WrongQuestionStatus) {
  return status === "全部" ? rows : rows.filter(row => row.status === status);
}

export function getWrongQuestionForReplay<T extends { id: string }>(questions: T[], questionId: string) {
  return questions.find(question => question.id === questionId);
}

export function getMostRecentWrongQuestion<T extends { updatedAt: Date | string }>(rows: T[]) {
  return [...rows].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())[0];
}

export function getPreviousQuestionCursor(cursor: number) {
  return Math.max(0, cursor - 1);
}

export function getSelectedOptionForQuestion<T extends { questionId: string; selectedOption: string }>(answers: T[], questionId: string) {
  return answers.find(answer => answer.questionId === questionId)?.selectedOption;
}

export function getQuestionTextSummary(questionText: string | null | undefined, limit = 112) {
  const normalized = questionText?.replace(/\s+/g, " ").trim() ?? "";
  if (!normalized) return "官方題幹暫時無法顯示。";
  return normalized.length > limit ? `${normalized.slice(0, limit)}…` : normalized;
}

export function filterWrongQuestionsMissingConcise<T extends { questionId: string }>(rows: T[], conciseQuestionIds: Set<string>) {
  return rows.filter(row => !conciseQuestionIds.has(row.questionId));
}

export function getOfficialOptionPreview(options: unknown, correctOption?: string | null) {
  const labels = ["A", "B", "C", "D"];
  const normalized = Array.isArray(options)
    ? Object.fromEntries(options.map((option, index) => [labels[index], option]))
    : options && typeof options === "object"
      ? options as Record<string, unknown>
      : {};
  return labels.map(label => ({
    label,
    text: typeof normalized[label] === "string" ? normalized[label].trim() : "",
    isCorrect: label === correctOption,
  })).filter(option => option.text);
}
