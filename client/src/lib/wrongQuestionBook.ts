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
