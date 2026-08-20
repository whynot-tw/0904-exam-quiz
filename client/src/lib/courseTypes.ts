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
