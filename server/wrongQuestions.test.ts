import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { attemptAnswers, attempts, wrongQuestions } from "../drizzle/schema";
import { getDb, getWrongQuestions, recordAttempt } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const learnerId = 99105;

describe("錯題本", () => {
  it("拒絕未登入使用者讀取個人錯題清單", async () => {
    const caller = appRouter.createCaller({ user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] });
    await expect(caller.wrongQuestions.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("自動記錄答錯題目、提供個人清單，並在連續答對兩次後標記為已熟悉", async () => {
    const db = await getDb();
    const questionId = "HARDWARE-1";
    try {
      if (db) {
        await db.delete(attemptAnswers).where(eq(attemptAnswers.userId, learnerId));
        await db.delete(attempts).where(eq(attempts.userId, learnerId));
        await db.delete(wrongQuestions).where(eq(wrongQuestions.userId, learnerId));
      }
      await recordAttempt(learnerId, { mode: "practice", questionCount: 1, answers: [{ questionId, sequenceNo: 0, selectedOption: "A", correctOption: "B", isCorrect: false }] });
      const afterWrong = await getWrongQuestions(learnerId);
      expect(afterWrong).toEqual(expect.arrayContaining([expect.objectContaining({ questionId, wrongCount: 1, consecutiveCorrect: 0, status: "待複習" })]));

      await recordAttempt(learnerId, { mode: "wrong", questionCount: 1, answers: [{ questionId, sequenceNo: 0, selectedOption: "A", correctOption: "A", isCorrect: true }] });
      await recordAttempt(learnerId, { mode: "wrong", questionCount: 1, answers: [{ questionId, sequenceNo: 0, selectedOption: "A", correctOption: "A", isCorrect: true }] });
      const afterReview = await getWrongQuestions(learnerId);
      expect(afterReview).toEqual(expect.arrayContaining([expect.objectContaining({ questionId, consecutiveCorrect: 2, status: "已熟悉" })]));
    } finally {
      if (db) {
        await db.delete(attemptAnswers).where(eq(attemptAnswers.userId, learnerId));
        await db.delete(attempts).where(eq(attempts.userId, learnerId));
        await db.delete(wrongQuestions).where(eq(wrongQuestions.userId, learnerId));
      }
    }
  }, 20000);
});
