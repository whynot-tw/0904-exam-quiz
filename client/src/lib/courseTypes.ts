export const ALL_COURSE_TYPES = "all";

export type CourseQuestion = {
  source: string;
  category?: string | null;
  section?: string | null;
};

export type CourseType = {
  id: string;
  label: string;
};

export type CourseProgressForSort = {
  source: string;
  label?: string;
  accuracy: number | null;
  completion: number;
};

export type CourseSort = "default" | "accuracy-asc" | "completion-asc";

export function getCourseTypes(questions: CourseQuestion[]): CourseType[] {
  const bySource = new Map<string, CourseType>();
  for (const question of questions) {
    if (!question.source || bySource.has(question.source)) continue;
    bySource.set(question.source, {
      id: question.source,
      label: question.category?.trim() || question.section?.trim() || question.source,
    });
  }
  return Array.from(bySource.values()).sort((a, b) => a.id.localeCompare(b.id));
}

export function filterQuestionsByCourse<T extends CourseQuestion>(questions: T[], courseType: string): T[] {
  return courseType === ALL_COURSE_TYPES ? questions : questions.filter(question => question.source === courseType);
}

export function excludeAnsweredQuestions<T extends { id: string }>(questions: T[], answeredQuestionIds: Iterable<string>): T[] {
  const answered = new Set(answeredQuestionIds);
  return questions.filter(question => !answered.has(question.id));
}

export function selectSmartPracticeQuestions<T extends { id: string }>(questions: T[], answeredQuestionIds: Iterable<string>, count: number): { questions: T[]; usedFallback: boolean; untestedCount: number } {
  const untested = excludeAnsweredQuestions(questions, answeredQuestionIds);
  const shuffle = (items: T[]) => [...items].sort(() => Math.random() - 0.5);
  const selectedUntested = shuffle(untested).slice(0, Math.min(count, untested.length));
  const selectedIds = new Set(selectedUntested.map(question => question.id));
  const fallback = shuffle(questions.filter(question => !selectedIds.has(question.id))).slice(0, Math.max(count - selectedUntested.length, 0));
  return { questions: [...selectedUntested, ...fallback], usedFallback: fallback.length > 0, untestedCount: untested.length };
}

export function sortCourseTypes(courseTypes: CourseType[], progressRows: CourseProgressForSort[] | undefined, sort: CourseSort): CourseType[] {
  const progressBySource = new Map((progressRows ?? []).map(row => [row.source, row]));
  return [...courseTypes].sort((a, b) => {
    if (sort === "default") return a.id.localeCompare(b.id);
    const left = progressBySource.get(a.id);
    const right = progressBySource.get(b.id);
    if (sort === "completion-asc") {
      const compare = (left?.completion ?? 0) - (right?.completion ?? 0);
      return compare || a.id.localeCompare(b.id);
    }
    const leftAccuracy = left?.accuracy;
    const rightAccuracy = right?.accuracy;
    if (leftAccuracy === null || leftAccuracy === undefined) return rightAccuracy === null || rightAccuracy === undefined ? a.id.localeCompare(b.id) : 1;
    if (rightAccuracy === null || rightAccuracy === undefined) return -1;
    return leftAccuracy - rightAccuracy || a.id.localeCompare(b.id);
  });
}

export function getWeakestCourse<T extends CourseProgressForSort>(progressRows: T[] | undefined): T | null {
  const eligible = (progressRows ?? []).filter(row => row.accuracy !== null && row.accuracy !== undefined);
  if (!eligible.length) return null;
  return [...eligible].sort((left, right) => (left.accuracy! - right.accuracy!) || (left.completion - right.completion) || left.source.localeCompare(right.source))[0];
}
