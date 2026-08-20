import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, attempts, attemptAnswers, reviewNotes, starredQuestions, users, wrongQuestions } from "../drizzle/schema";
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

export async function getUserAttempts(userId: number) {
  const db = await getDb();
  return db ? db.select().from(attempts).where(eq(attempts.userId, userId)).orderBy(desc(attempts.startedAt)) : [];
}

export async function getUserAnswerRows(userId: number) {
  const db = await getDb();
  return db ? db.select().from(attemptAnswers).where(eq(attemptAnswers.userId, userId)).orderBy(desc(attemptAnswers.answeredAt)) : [];
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
