import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { attemptAnswers, attempts, starredQuestions } from "../drizzle/schema";

const testUserId = 991999;

function anonymousContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

function authenticatedContext(): TrpcContext {
  const now = new Date();
  return {
    user: { id: testUserId, openId: "starred-question-test", email: null, name: "star-test", loginMethod: "test", role: "user", createdAt: now, updatedAt: now, lastSignedIn: now },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("starredQuestions access rules", () => {
  it("requires login to load the personal starred-question list", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.starredQuestions.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires login to change a personal star marker", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.starredQuestions.toggle({ questionId: "HARDWARE-1" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.starredQuestions.updateReminder({ questionId: "HARDWARE-1", reminderDate: "2026-08-20" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("writes, reads, and removes a personal star marker", async () => {
    const caller = appRouter.createCaller(authenticatedContext());
    const questionId = "HARDWARE-1";
    const existing = await caller.starredQuestions.list();
    if (existing.some(row => row.questionId === questionId)) await caller.starredQuestions.toggle({ questionId });

    try {
      const added = await caller.starredQuestions.toggle({ questionId });
      expect(added).toEqual({ questionId, starred: true });
      await expect(caller.starredQuestions.list()).resolves.toEqual(expect.arrayContaining([
        expect.objectContaining({ questionId }),
      ]));

      await expect(caller.starredQuestions.updateTag({ questionId, tag: "考前必看" })).resolves.toEqual({ questionId, tag: "考前必看" });
      await expect(caller.starredQuestions.list()).resolves.toEqual(expect.arrayContaining([
        expect.objectContaining({ questionId, tag: "考前必看" }),
      ]));
      const today = new Date().toISOString().slice(0, 10);
      await expect(caller.starredQuestions.updateReminder({ questionId, reminderDate: today })).resolves.toEqual({ questionId, reminderDate: today });
      await expect(caller.starredQuestions.list()).resolves.toEqual(expect.arrayContaining([
        expect.objectContaining({ questionId, reminderDate: today }),
      ]));
      await expect(caller.starredQuestions.stats()).resolves.toMatchObject({ total: 1, reviewedCount: 0, completionRate: 0, lastReviewedAt: null, dueCount: 1, upcomingCount: 0 });
    } finally {
      const current = await caller.starredQuestions.list();
      if (current.some(row => row.questionId === questionId)) await caller.starredQuestions.toggle({ questionId });
    }
  }, 15000);

  it("records a starred quiz and updates completion progress with its latest review", async () => {
    const caller = appRouter.createCaller(authenticatedContext());
    const questionId = "HARDWARE-1";
    const db = await getDb();
    if (!db) throw new Error("Test database unavailable");

    await db.delete(attemptAnswers).where(eq(attemptAnswers.userId, testUserId));
    await db.delete(attempts).where(eq(attempts.userId, testUserId));
    await db.delete(starredQuestions).where(eq(starredQuestions.userId, testUserId));

    try {
      await caller.starredQuestions.toggle({ questionId });
      await caller.attempts.complete({
        mode: "starred",
        questionCount: 1,
        answers: [{ questionId, sequenceNo: 0, selectedOption: "A", correctOption: "A", isCorrect: true }],
      });

      await expect(caller.attempts.history()).resolves.toEqual(expect.arrayContaining([
        expect.objectContaining({ mode: "starred", questionCount: 1 }),
      ]));
      await expect(caller.starredQuestions.stats()).resolves.toMatchObject({
        total: 1,
        reviewedCount: 1,
        completionRate: 100,
        lastReviewedAt: expect.any(Date),
      });
    } finally {
      await db.delete(attemptAnswers).where(eq(attemptAnswers.userId, testUserId));
      await db.delete(attempts).where(eq(attempts.userId, testUserId));
      await db.delete(starredQuestions).where(eq(starredQuestions.userId, testUserId));
    }
  }, 20000);
});
