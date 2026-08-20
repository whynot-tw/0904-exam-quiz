import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getEnabledQuestions, getQuizQuestions, toClientQuestion } from "./quizData";
import { getUserAttempts, getWrongQuestions, recordAttempt } from "./db";

const answerSchema = z.object({
  questionId: z.string(),
  sequenceNo: z.number().int().nonnegative(),
  selectedOption: z.enum(["A", "B", "C", "D"]),
  correctOption: z.enum(["A", "B", "C", "D"]),
  isCorrect: z.boolean(),
  markedReviewError: z.string().optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  quiz: router({
    bootstrap: publicProcedure.query(() => ({
      settings: { examDate: "2026-09-04", targetScore: 80, mockQuestionCount: 20, maxWrong: 4 },
      questions: getEnabledQuestions().map(toClientQuestion),
      qa: { total: getQuizQuestions().length, enabled: getEnabledQuestions().length, needsReview: getQuizQuestions().filter(q => q.import_status === "needs_review").length },
    })),
    adminList: adminProcedure.input(z.object({ needsReviewOnly: z.boolean().default(false) })).query(({ input }) => {
      const list = input.needsReviewOnly ? getQuizQuestions().filter(q => q.import_status === "needs_review") : getQuizQuestions();
      return list.map(toClientQuestion);
    }),
    adminUpdate: adminProcedure.input(z.object({ questionId: z.string(), explanation: z.string().optional(), correctOption: z.enum(["A", "B", "C", "D"]).optional() })).mutation(({ input }) => ({ success: true, questionId: input.questionId, note: "預覽環境已驗證 admin 權限；正式 Sheet 寫回需由 Apps Script API 執行。" })),
  }),
  attempts: router({
    complete: protectedProcedure.input(z.object({ mode: z.enum(["practice", "mock", "wrong"]), questionCount: z.number().int().positive(), answers: z.array(answerSchema).min(1) })).mutation(({ ctx, input }) => recordAttempt(ctx.user.id, input)),
    history: protectedProcedure.query(({ ctx }) => getUserAttempts(ctx.user.id)),
  }),
  wrongQuestions: router({
    list: protectedProcedure.query(({ ctx }) => getWrongQuestions(ctx.user.id)),
  }),
});

export type AppRouter = typeof appRouter;
