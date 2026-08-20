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
