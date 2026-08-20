import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { cmsQuestionToQuizQuestion, getEnabledQuestions, getQuizQuestions, toClientQuestion, updateLocalQuestion } from "./quizData";
import { getCmsQuestions, getCmsSettings, getStarredQuestions, getStarredQuestionStats, getUserAnswerRows, getUserAttempts, getWrongQuestions, recordAttempt, toggleStarredQuestion, updateCmsQuestion, updateStarredQuestionReminder, updateStarredQuestionTag } from "./db";
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
      const cmsRows = await getCmsQuestions();
      const cmsSettings = await getCmsSettings();
      if (cmsRows.length) {
        const all = cmsRows.map(cmsQuestionToQuizQuestion);
        const enabled = all.filter(question => question.enabled && question.import_status === "imported");
        return { settings: { examDate: cmsSettings.exam_date ?? "2026-09-04", targetScore: Number(cmsSettings.target_score ?? 80), mockQuestionCount: Number(cmsSettings.mock_question_count ?? 20), maxWrong: Number(cmsSettings.max_wrong_for_target ?? 4) }, questions: enabled.map(toClientQuestion), qa: { total: all.length, enabled: enabled.length, needsReview: all.filter(question => question.import_status === "needs_review").length }, source: "cms-database" };
      }
      const remote = await fetchSheetBootstrap().catch(error => { console.warn("[Sheet] bootstrap fallback:", error); return null; });
      const local = getQuizQuestions();
      const questions = remote?.questions?.length ? remote.questions : getEnabledQuestions();
      return { settings: remote?.settings ?? { examDate: "2026-09-04", targetScore: 80, mockQuestionCount: 20, maxWrong: 4 }, questions: questions.map(toClientQuestion), qa: { total: remote?.questions?.length ?? local.length, enabled: questions.length, needsReview: local.filter(q => q.import_status === "needs_review").length }, source: remote ? "google-sheet" : "official-pdf-snapshot" };
    }),
    adminList: adminProcedure.input(z.object({ needsReviewOnly: z.boolean().default(false) })).query(async ({ input }) => { const cmsRows = await getCmsQuestions(); const list = cmsRows.length ? cmsRows.map(cmsQuestionToQuizQuestion) : getQuizQuestions(); return (input.needsReviewOnly ? list.filter(question => question.import_status === "needs_review") : list).map(toClientQuestion); }),
    adminUpdate: adminProcedure.input(z.object({ questionId: z.string(), explanation: z.string().optional(), correctOption: z.enum(["A", "B", "C", "D"]).optional() })).mutation(async ({ input }) => { const cmsUpdated = await updateCmsQuestion(input.questionId, input); if (!cmsUpdated && !updateLocalQuestion(input.questionId, input)) throw new Error("question not found"); updateLocalQuestion(input.questionId, input); const sheet = await updateSheetQuestion(input.questionId, { explanation: input.explanation, correctOption: input.correctOption }); return { success: true, questionId: input.questionId, persistedTo: sheet ? "cms-database+google-sheet" : cmsUpdated ? "cms-database" : "preview-memory" }; }),
  }),
  attempts: router({
    complete: protectedProcedure.input(z.object({ mode: z.enum(["practice", "mock", "wrong", "starred"]), questionCount: z.number().int().positive(), answers: z.array(answerSchema).min(1) })).mutation(async ({ ctx, input }) => { const result = await recordAttempt(ctx.user.id, input); await postSheetAttempt({ attempt: { mode: input.mode, question_count: input.questionCount }, answers: input.answers }).catch(error => console.warn("[Sheet] attempt write fallback:", error)); return result; }),
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
    updateTag: protectedProcedure.input(z.object({ questionId: z.string().min(1), tag: z.string().trim().max(64).nullable() })).mutation(({ ctx, input }) => updateStarredQuestionTag(ctx.user.id, input.questionId, input.tag)),
    updateReminder: protectedProcedure.input(z.object({ questionId: z.string().min(1), reminderDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable() })).mutation(({ ctx, input }) => updateStarredQuestionReminder(ctx.user.id, input.questionId, input.reminderDate)),
    stats: protectedProcedure.query(({ ctx }) => getStarredQuestionStats(ctx.user.id)),
  }),
});

export type AppRouter = typeof appRouter;
