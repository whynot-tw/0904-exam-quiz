import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, attempts, attemptAnswers, questions, reviewNotes, settings, starredQuestions, userLearningSettings, users, wrongQuestions } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = { lastSignedIn: new Date() };
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  if (user.role !== undefined || user.openId === ENV.ownerOpenId) { values.role = user.role ?? "admin"; updateSet.role = values.role; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getCmsQuestions() {
  const db = await getDb();
  return db ? db.select().from(questions).orderBy(asc(questions.sourceKey), asc(questions.sourcePage), asc(questions.questionId)) : [];
}

export async function getCmsSettings() {
  const db = await getDb();
  if (!db) return {} as Record<string, string>;
  const rows = await db.select().from(settings);
  return Object.fromEntries(rows.map(row => [row.key, row.value]));
}

export async function updateCmsQuestion(questionId: string, patch: { explanation?: string; correctOption?: "A" | "B" | "C" | "D" }) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db.select({ id: questions.id }).from(questions).where(eq(questions.questionId, questionId)).limit(1);
  if (!existing[0]) return false;
  const update: { explanation?: string; correctOption?: "A" | "B" | "C" | "D"; verified: number; importStatus: string } = { verified: 1, importStatus: "imported" };
  if (patch.explanation !== undefined) update.explanation = patch.explanation;
  if (patch.correctOption !== undefined) update.correctOption = patch.correctOption;
  await db.update(questions).set(update).where(eq(questions.id, existing[0].id));
  return true;
}

export async function updateCmsQuestionSubcategory(questionId: string, patch: { subcategory?: string; subcategoryStatus?: "assigned" | "needs_manual_review"; subcategoryNotes?: string }) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db.select({ id: questions.id }).from(questions).where(eq(questions.questionId, questionId)).limit(1);
  if (!existing[0]) return false;
  const update: { subcategory?: string; subcategoryStatus?: "assigned" | "needs_manual_review"; subcategoryNotes?: string } = {};
  if (patch.subcategory !== undefined) update.subcategory = patch.subcategory;
  if (patch.subcategoryStatus !== undefined) update.subcategoryStatus = patch.subcategoryStatus;
  if (patch.subcategoryNotes !== undefined) update.subcategoryNotes = patch.subcategoryNotes;
  if (!Object.keys(update).length) return true;
  await db.update(questions).set(update).where(eq(questions.id, existing[0].id));
  return true;
}

export async function getUserAttempts(userId: number) {
  const db = await getDb();
  return db ? db.select().from(attempts).where(eq(attempts.userId, userId)).orderBy(desc(attempts.startedAt)) : [];
}

export async function getUserAnswerRows(userId: number) {
  const db = await getDb();
  return db ? db.select().from(attemptAnswers).where(eq(attemptAnswers.userId, userId)).orderBy(desc(attemptAnswers.answeredAt)) : [];
}

export async function getUserLearningGoal(userId: number) {
  const db = await getDb();
  if (!db) return { targetCompletion: 60 };
  const rows = await db.select().from(userLearningSettings).where(eq(userLearningSettings.userId, userId)).limit(1);
  return rows[0] ?? { targetCompletion: 60 };
}

export async function updateUserLearningGoal(userId: number, targetCompletion: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(userLearningSettings).values({ userId, targetCompletion }).onDuplicateKeyUpdate({ set: { targetCompletion, updatedAt: new Date() } });
  return { targetCompletion };
}

export async function getWrongQuestions(userId: number) {
  const db = await getDb();
  return db ? db.select().from(wrongQuestions).where(eq(wrongQuestions.userId, userId)).orderBy(desc(wrongQuestions.updatedAt)) : [];
}

export async function getStarredQuestions(userId: number) {
  const db = await getDb();
  return db ? db.select().from(starredQuestions).where(eq(starredQuestions.userId, userId)).orderBy(desc(starredQuestions.createdAt)) : [];
}

export async function toggleStarredQuestion(userId: number, questionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.select().from(starredQuestions).where(and(eq(starredQuestions.userId, userId), eq(starredQuestions.questionId, questionId))).limit(1);
  if (existing[0]) {
    await db.delete(starredQuestions).where(eq(starredQuestions.id, existing[0].id));
    return { questionId, starred: false };
  }
  await db.insert(starredQuestions).values({ userId, questionId });
  return { questionId, starred: true };
}

export async function updateStarredQuestionTag(userId: number, questionId: string, tag: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.select().from(starredQuestions).where(and(eq(starredQuestions.userId, userId), eq(starredQuestions.questionId, questionId))).limit(1);
  if (!existing[0]) throw new Error("Starred question not found");
  await db.update(starredQuestions).set({ tag }).where(eq(starredQuestions.id, existing[0].id));
  return { questionId, tag };
}

export async function updateStarredQuestionReminder(userId: number, questionId: string, reminderDate: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.select().from(starredQuestions).where(and(eq(starredQuestions.userId, userId), eq(starredQuestions.questionId, questionId))).limit(1);
  if (!existing[0]) throw new Error("Starred question not found");
  await db.update(starredQuestions).set({ reminderDate }).where(eq(starredQuestions.id, existing[0].id));
  return { questionId, reminderDate };
}

export async function getStarredQuestionStats(userId: number) {
  const [stars, answers] = await Promise.all([getStarredQuestions(userId), getUserAnswerRows(userId)]);
  const starIds = new Set(stars.map(star => star.questionId));
  const answerRows = answers.filter(answer => starIds.has(answer.questionId));
  const reviewedQuestionIds = new Set(answerRows.map(answer => answer.questionId));
  const recent = answerRows.reduce<Date | null>((latest, answer) => !latest || answer.answeredAt > latest ? answer.answeredAt : latest, null);
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const dueCount = stars.filter(star => star.reminderDate && star.reminderDate <= today).length;
  const upcomingCount = stars.filter(star => star.reminderDate && star.reminderDate > today && star.reminderDate <= sevenDaysFromNow).length;
  return {
    total: stars.length,
    reviewedCount: reviewedQuestionIds.size,
    completionRate: stars.length ? Math.round(reviewedQuestionIds.size / stars.length * 100) : 0,
    lastReviewedAt: recent,
    dueCount,
    upcomingCount,
  };
}

export async function recordAttempt(userId: number, input: { mode: string; questionCount: number; answers: Array<{ questionId: string; sequenceNo: number; selectedOption: string; correctOption: string; isCorrect: boolean; markedReviewError?: string }> }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const correctCount = input.answers.filter(a => a.isCorrect).length;
  const wrongCount = input.answers.length - correctCount;
  const score = input.questionCount ? Math.round((correctCount / input.questionCount) * 100) : 0;
  const [attempt] = await db.insert(attempts).values({ userId, mode: input.mode, questionCount: input.questionCount, correctCount, wrongCount, score, passed80: score >= 80 ? 1 : 0, completedAt: new Date() });
  const attemptId = Number(attempt.insertId);
  if (input.answers.length) {
    await db.insert(attemptAnswers).values(input.answers.map(a => ({ attemptId, userId, questionId: a.questionId, sequenceNo: a.sequenceNo, selectedOption: a.selectedOption, correctOptionSnapshot: a.correctOption, isCorrect: a.isCorrect ? 1 : 0, markedReviewError: a.markedReviewError ?? null })));
  }
  for (const answer of input.answers) {
    const existing = await db.select().from(wrongQuestions).where(and(eq(wrongQuestions.userId, userId), eq(wrongQuestions.questionId, answer.questionId))).limit(1);
    if (!answer.isCorrect && answer.markedReviewError !== "題目看反") {
      if (existing[0]) await db.update(wrongQuestions).set({ wrongCount: existing[0].wrongCount + 1, consecutiveCorrect: 0, status: "待複習", updatedAt: new Date() }).where(eq(wrongQuestions.id, existing[0].id));
      else await db.insert(wrongQuestions).values({ userId, questionId: answer.questionId, wrongCount: 1, consecutiveCorrect: 0, status: "待複習", migrationStatus: "matched" });
    } else if (answer.isCorrect && existing[0]) {
      const next = existing[0].consecutiveCorrect + 1;
      await db.update(wrongQuestions).set({ consecutiveCorrect: next >= 2 ? 2 : next, status: next >= 2 ? "已熟悉" : "待複習", updatedAt: new Date() }).where(eq(wrongQuestions.id, existing[0].id));
    }
    if (!answer.isCorrect && answer.markedReviewError === "題目看反") {
      await db.insert(reviewNotes).values({ userId, questionId: answer.questionId, noteType: "題目看反", noteText: "使用者標記為閱讀失誤，不列入知識錯題。" });
    }
  }
  return { attemptId, correctCount, wrongCount, score, passed80: score >= 80 };
}
