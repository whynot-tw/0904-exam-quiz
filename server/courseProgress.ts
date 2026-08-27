export type CourseCatalogQuestion = {
  id: string;
  source: string;
  label: string;
  enabled: boolean;
  importStatus: string;
};

export type CourseAnswer = {
  questionId: string;
  isCorrect: number | boolean;
  answeredAt?: Date;
};

export type CourseProgress = {
  source: string;
  label: string;
  available: number;
  answered: number;
  answeredQuestions: number;
  correct: number;
  accuracy: number | null;
  completion: number;
  lastAnsweredAt: Date | null;
};

export function summarizeCourseProgress(catalog: CourseCatalogQuestion[], answers: CourseAnswer[]): CourseProgress[] {
  const byQuestionId = new Map(catalog.map(question => [question.id, question]));
  const courses = new Map<string, CourseProgress>();

  for (const question of catalog) {
    if (!question.enabled || question.importStatus !== "imported") continue;
    const current = courses.get(question.source) ?? {
      source: question.source,
      label: question.label,
      available: 0,
      answered: 0,
      answeredQuestions: 0,
      correct: 0,
      accuracy: null,
      completion: 0,
      lastAnsweredAt: null,
    };
    current.available += 1;
    courses.set(question.source, current);
  }

  const completedQuestionIdsByCourse = new Map<string, Set<string>>();
  for (const answer of answers) {
    const question = byQuestionId.get(answer.questionId);
    if (!question || !question.enabled || question.importStatus !== "imported") continue;
    const progress = courses.get(question.source);
    if (!progress) continue;
    progress.answered += 1;
    progress.correct += answer.isCorrect ? 1 : 0;
    if (answer.answeredAt && (!progress.lastAnsweredAt || answer.answeredAt > progress.lastAnsweredAt)) progress.lastAnsweredAt = answer.answeredAt;
    const completedIds = completedQuestionIdsByCourse.get(question.source) ?? new Set<string>();
    completedIds.add(question.id);
    progress.answeredQuestions = completedIds.size;
    completedQuestionIdsByCourse.set(question.source, completedIds);
  }

  return Array.from(courses.values()).sort((a, b) => a.source.localeCompare(b.source)).map(progress => {
    const uniqueCompleted = completedQuestionIdsByCourse.get(progress.source)?.size ?? 0;
    return {
      ...progress,
      accuracy: progress.answered ? Math.round(progress.correct / progress.answered * 100) : null,
      completion: progress.available ? Math.round(uniqueCompleted / progress.available * 100) : 0,
    };
  });
}
