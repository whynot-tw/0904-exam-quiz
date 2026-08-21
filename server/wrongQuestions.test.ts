import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { attemptAnswers, attempts, wrongQuestions } from "../drizzle/schema";
import { getCmsQuestions, getDb, getWrongQuestions, recordAttempt } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const learnerId = 99105;

function learnerContext(): TrpcContext {
  const now = new Date();
  return { user: { id: learnerId, openId: "wrong-book-test-user", email: null, name: "wrong-book-test-user", loginMethod: "test", role: "user", createdAt: now, updatedAt: now, lastSignedIn: now }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

describe("錯題本", () => {
  it("拒絕未登入使用者讀取個人錯題清單", async () => {
    const caller = appRouter.createCaller({ user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] });
    await expect(caller.wrongQuestions.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.wrongQuestions.exportPdfData()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.wrongQuestions.analyzePdfWeakness({ questionIds: ["HARDWARE-1"] })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.wrongQuestions.explain({ questionId: "HARDWARE-1" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
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
      const exportRows = await appRouter.createCaller(learnerContext()).wrongQuestions.exportPdfData();
      expect(exportRows).toEqual(expect.arrayContaining([expect.objectContaining({ questionId, selectedOption: "A", status: "待複習" })]));
      expect(exportRows.find(row => row.questionId === questionId)?.officialAnswer).toBe((await getCmsQuestions()).find(question => question.questionId === questionId)?.correctOption);

      await recordAttempt(learnerId, { mode: "wrong", questionCount: 1, answers: [{ questionId, sequenceNo: 0, selectedOption: "A", correctOption: "A", isCorrect: true }] });
      await recordAttempt(learnerId, { mode: "wrong", questionCount: 1, answers: [{ questionId, sequenceNo: 0, selectedOption: "A", correctOption: "A", isCorrect: true }] });
      const afterReview = await getWrongQuestions(learnerId);
      expect(afterReview).toEqual(expect.arrayContaining([expect.objectContaining({ questionId, consecutiveCorrect: 2, status: "已熟悉" })]));

      const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: "mock-ai", created: 0, model: "gpt-5-mini", choices: [{ index: 0, message: { role: "assistant", content: JSON.stringify({ errorReason: "最近選項與官方正解不同", whyItMatters: "辨識關鍵條件", correctThinking: "依官方答案逐項排除", reviewTip: "先背官方關鍵字", sourceNotice: "本補充以官方題庫內容為準。", headline: "優先複習此範圍", overallAssessment: "目前錯題需要持續複習。", priorityTopics: [{ topic: "電腦硬體與組裝", evidence: "依個人錯題統計。", advice: "依官方解析重做。" }], reviewPlan: ["重讀官方解析", "進行錯題重刷", "隔日再複習"] }) }, finish_reason: "stop" }] }), { status: 200, headers: { "content-type": "application/json" } }));
      const originalFetch = globalThis.fetch;
      vi.stubGlobal("fetch", fetchMock);
      try {
        const weakness = await appRouter.createCaller(learnerContext()).wrongQuestions.analyzePdfWeakness({ questionIds: [questionId] });
        expect(weakness.headline).toBe("優先複習此範圍");
        expect(weakness.priorityTopics[0]?.advice).toBe("依官方解析重做。");
        const ai = await appRouter.createCaller(learnerContext()).wrongQuestions.explain({ questionId });
        const official = (await getCmsQuestions()).find(question => question.questionId === questionId);
        expect(ai.officialAnswer).toBe(official?.correctOption);
        expect(ai.explanation.errorReason).toBe("最近選項與官方正解不同");
        expect(ai.explanation.correctThinking).toBe("依官方答案逐項排除");
        expect(String(fetchMock.mock.calls[0]?.[1]?.body)).toContain("官方正解");
      } finally {
        vi.stubGlobal("fetch", originalFetch);
      }
    } finally {
      if (db) {
        await db.delete(attemptAnswers).where(eq(attemptAnswers.userId, learnerId));
        await db.delete(attempts).where(eq(attempts.userId, learnerId));
        await db.delete(wrongQuestions).where(eq(wrongQuestions.userId, learnerId));
      }
    }
  }, 20000);
});
