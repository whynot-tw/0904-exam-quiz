import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getEnabledQuestions, getQuizQuestions, toClientQuestion, updateLocalQuestion } from "./quizData";
import { getStarredQuestions, getUserAnswerRows, getUserAttempts, getWrongQuestions, recordAttempt, toggleStarredQuestion } from "./db";
import { fetchSheetBootstrap, postSheetAttempt, updateSheetQuestion } from "./sheetSync";

const answerSchema = z.object({ questionId: z.string(), sequenceNo: z.number().int().nonnegative(), selectedOption: z.enum(["A", "B", "C", "D"]), correctOption: z.enum(["A", "B", "C", "D"]), isCorrect: z.boolean(), markedReviewError: z.string().optional() });

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  quiz: router({
    bootstrap: publicProcedure.query(async () => {
      const remote = await fetchSheetBootstrap().catch(error => { console.warn("[Sheet] bootstrap fallback:", error); return null; });
      const local = getQuizQuestions();
      const questions = remote?.questions?.length ? remote.questions : getEnabledQuestions();
      return { settings: remote?.settings ?? { examDate: "2026-09-04", targetScore: 80, mockQuestionCount: 20, maxWrong: 4 }, questions: questions.map(toClientQuestion), qa: { total: remote?.questions?.length ?? local.length, enabled: questions.length, needsReview: local.filter(q => q.import_status === "needs_review").length }, source: remote ? "google-sheet" : "official-pdf-snapshot" };
    }),
    adminList: adminProcedure.input(z.object({ needsReviewOnly: z.boolean().default(false) })).query(({ input }) => { const list = input.needsReviewOnly ? getQuizQuestions().filter(q => q.import_status === "needs_review") : getQuizQuestions(); return list.map(toClientQuestion); }),
    adminUpdate: adminProcedure.input(z.object({ questionId: z.string(), explanation: z.string().optional(), correctOption: z.enum(["A", "B", "C", "D"]).optional() })).mutation(async ({ input }) => { if (!updateLocalQuestion(input.questionId, input)) throw new Error("question not found"); const sheet = await updateSheetQuestion(input.questionId, { explanation: input.explanation, correctOption: input.correctOption }); return { success: true, questionId: input.questionId, persistedTo: sheet ? "google-sheet" : "preview-memory" }; }),
  }),
  attempts: router({
    complete: protectedProcedure.input(z.object({ mode: z.enum(["practice", "mock", "wrong"]), questionCount: z.number().int().positive(), answers: z.array(answerSchema).min(1) })).mutation(async ({ ctx, input }) => { const result = await recordAttempt(ctx.user.id, input); await postSheetAttempt({ attempt: { mode: input.mode, question_count: input.questionCount }, answers: input.answers }).catch(error => console.warn("[Sheet] attempt write fallback:", error)); return result; }),
    history: protectedProcedure.query(({ ctx }) => getUserAttempts(ctx.user.id)),
    stats: protectedProcedure.query(async ({ ctx }) => {
      const rows = await getUserAnswerRows(ctx.user.id);
      const bySubject: Record<string, { answered: number; correct: number; accuracy: number }> = {};
      for (const row of rows) {
        const subject = row.questionId.startsWith("AI") ? "AI" : "電腦硬體";
        bySubject[subject] ??= { answered: 0, correct: 0, accuracy: 0 };
        bySubject[subject].answered += 1;
        bySubject[subject].correct += row.isCorrect ? 1 : 0;
      }
      for (const value of Object.values(bySubject)) value.accuracy = value.answered ? Math.round(value.correct / value.answered * 100) : 0;
      return { totalAnswered: rows.length, totalCorrect: rows.filter(row => row.isCorrect === 1).length, bySubject, answers: rows };
    }),
  }),
  wrongQuestions: router({ list: protectedProcedure.query(({ ctx }) => getWrongQuestions(ctx.user.id)) }),
  starredQuestions: router({
    list: protectedProcedure.query(({ ctx }) => getStarredQuestions(ctx.user.id)),
    toggle: protectedProcedure.input(z.object({ questionId: z.string().min(1) })).mutation(({ ctx, input }) => toggleStarredQuestion(ctx.user.id, input.questionId)),
  }),
});

export type AppRouter = typeof appRouter;
