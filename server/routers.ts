import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { cmsQuestionToQuizQuestion, getEnabledQuestions, getQuizQuestions, toClientQuestion, updateLocalQuestion } from "./quizData";
import { applyCmsQuestionSubcategoryBatch, getClassificationReviewBatches, getClassificationReviewSummary, getCmsQuestions, getCmsQuestionsForAdmin, getCmsSettings, getStarredQuestions, getStarredQuestionStats, getUserAnswerRows, getUserAttempts, getUserLearningGoal, getWrongQuestionConciseExplanations, getWrongQuestions, recordAttempt, restoreCmsQuestionSubcategoryBatch, setWrongQuestionConciseFeedback, toggleStarredQuestion, updateCmsQuestion, updateCmsQuestionSubcategory, updateStarredQuestionReminder, updateStarredQuestionTag, updateUserLearningGoal, upsertWrongQuestionConciseExplanation } from "./db";
import { summarizeCourseProgress } from "./courseProgress";
import { fetchSheetBootstrap, postSheetAttempt, updateSheetQuestion } from "./sheetSync";
import { invokeLLM } from "./_core/llm";
import { buildWrongQuestionAiMessages, parseWrongQuestionAiExplanation } from "./wrongQuestionAi";
import { buildPdfWeaknessAnalysisMessages, parsePdfWeaknessSummary } from "./wrongQuestionPdfAi";
import { buildConciseWrongQuestionAiMessages, parseConciseWrongQuestionExplanation } from "./wrongQuestionConciseAi";
import { TRPCError } from "@trpc/server";

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
    explainAnswer: protectedProcedure.input(z.object({ questionId: z.string().min(1), selectedOption: z.enum(["A", "B", "C", "D"]) })).mutation(async ({ input }) => {
      const cmsRows = await getCmsQuestions();
      const cmsQuestion = cmsRows.find(row => row.questionId === input.questionId);
      const question = cmsQuestion ? cmsQuestionToQuizQuestion(cmsQuestion) : getQuizQuestions().find(row => row.question_id === input.questionId);
      if (!question) throw new TRPCError({ code: "NOT_FOUND", message: "Official question not found" });
      try {
        const response = await invokeLLM({
          model: "gpt-5-mini",
          messages: buildWrongQuestionAiMessages(question, input.selectedOption),
          maxCompletionTokens: 2200,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "answer_feedback_explanation",
              strict: true,
              schema: {
                type: "object",
                properties: { errorReason: { type: "string" }, whyItMatters: { type: "string" }, correctThinking: { type: "string" }, reviewTip: { type: "string" }, sourceNotice: { type: "string" } },
                required: ["errorReason", "whyItMatters", "correctThinking", "reviewTip", "sourceNotice"],
                additionalProperties: false,
              },
            },
          },
        });
        const content = response.choices[0]?.message.content;
        if (typeof content !== "string") throw new Error("AI answer explanation response is empty");
        return { questionId: input.questionId, explanation: parseWrongQuestionAiExplanation(content), officialAnswer: question.correct_option, officialExplanation: question.explanation };
      } catch (error) {
        console.error("[QuizAnswerAI] explanation failed", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI answer explanation is temporarily unavailable" });
      }
    }),
    adminList: adminProcedure.input(z.object({ needsReviewOnly: z.boolean().default(false), subcategoryReviewOnly: z.boolean().default(false) })).query(async ({ input }) => { const cmsRows = await getCmsQuestionsForAdmin(); const list = cmsRows.length ? cmsRows.map(row => cmsQuestionToQuizQuestion({ ...row, sourceRaw: null, sourceUrl: null })) : getQuizQuestions(); const filtered = input.needsReviewOnly ? list.filter(question => question.import_status === "needs_review") : input.subcategoryReviewOnly ? list.filter(question => question.subcategory_status === "needs_manual_review") : list; return filtered.map(toClientQuestion); }),
    adminUpdate: adminProcedure.input(z.object({ questionId: z.string(), explanation: z.string().optional(), correctOption: z.enum(["A", "B", "C", "D"]).optional(), subcategory: z.string().trim().max(80).optional(), subcategoryStatus: z.enum(["assigned", "needs_manual_review"]).optional(), subcategoryNotes: z.string().trim().max(500).optional() })).mutation(async ({ input }) => { const hasOfficialContentPatch = input.explanation !== undefined || input.correctOption !== undefined; const hasSubcategoryPatch = input.subcategory !== undefined || input.subcategoryStatus !== undefined || input.subcategoryNotes !== undefined; const cmsContentUpdated = hasOfficialContentPatch ? await updateCmsQuestion(input.questionId, input) : false; const cmsSubcategoryUpdated = hasSubcategoryPatch ? await updateCmsQuestionSubcategory(input.questionId, input) : false; const localUpdated = hasOfficialContentPatch ? updateLocalQuestion(input.questionId, input) : false; if (!cmsContentUpdated && !cmsSubcategoryUpdated && !localUpdated) throw new Error("question not found"); const sheet = hasOfficialContentPatch ? await updateSheetQuestion(input.questionId, { explanation: input.explanation, correctOption: input.correctOption }) : null; return { success: true, questionId: input.questionId, persistedTo: sheet ? "cms-database+google-sheet" : cmsContentUpdated || cmsSubcategoryUpdated ? "cms-database" : "preview-memory" }; }),
    adminBatchUpdateSubcategory: adminProcedure.input(z.object({ questionIds: z.array(z.string().min(1)).min(1).max(234), subcategory: z.string().trim().min(1).max(80), subcategoryStatus: z.enum(["assigned", "needs_manual_review"]), subcategoryNotes: z.string().trim().max(500).optional() })).mutation(async ({ ctx, input }) => {
      const result = await applyCmsQuestionSubcategoryBatch(ctx.user.id, input.questionIds, input);
      return { success: true, ...result, persistedTo: "cms-database" as const };
    }),
    adminReviewSummary: adminProcedure.query(() => getClassificationReviewSummary()),
    adminReviewHistory: adminProcedure.query(() => getClassificationReviewBatches()),
    adminRestoreReviewBatch: adminProcedure.input(z.object({ batchId: z.number().int().positive() })).mutation(async ({ input }) => ({ success: true, ...(await restoreCmsQuestionSubcategoryBatch(input.batchId)), persistedTo: "cms-database" as const })),
    adminExportPending: adminProcedure.query(async () => {
      const cmsRows = await getCmsQuestionsForAdmin();
      return cmsRows.filter(question => question.subcategoryStatus === "needs_manual_review").map(row => cmsQuestionToQuizQuestion({ ...row, sourceRaw: null, sourceUrl: null })).map(toClientQuestion);
    }),
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
    courseProgress: protectedProcedure.query(async ({ ctx }) => {
      const [answers, cmsRows] = await Promise.all([getUserAnswerRows(ctx.user.id), getCmsQuestions()]);
      const catalog = cmsRows.map(question => ({
        id: question.questionId,
        source: question.sourceKey,
        label: question.category ?? question.sourceSection,
        enabled: question.enabled === 1,
        importStatus: question.importStatus,
      }));
      return summarizeCourseProgress(catalog, answers);
    }),
    subcategoryProgress: protectedProcedure.query(async ({ ctx }) => {
      const [answers, cmsRows] = await Promise.all([getUserAnswerRows(ctx.user.id), getCmsQuestions()]);
      const catalog = cmsRows.map(question => ({
        id: question.questionId,
        source: question.subcategory ?? "待確認",
        label: question.subcategory ?? "待確認",
        enabled: question.enabled === 1,
        importStatus: question.importStatus,
      }));
      return summarizeCourseProgress(catalog, answers);
    }),
    learningGoal: protectedProcedure.query(({ ctx }) => getUserLearningGoal(ctx.user.id)),
    updateLearningGoal: protectedProcedure.input(z.object({ targetCompletion: z.number().int().min(1).max(100) })).mutation(({ ctx, input }) => updateUserLearningGoal(ctx.user.id, input.targetCompletion)),
  }),
  wrongQuestions: router({
    list: protectedProcedure.query(({ ctx }) => getWrongQuestions(ctx.user.id)),
    conciseList: protectedProcedure.query(({ ctx }) => getWrongQuestionConciseExplanations(ctx.user.id)),
    generateConciseBatch: protectedProcedure.mutation(async ({ ctx }) => {
      const [wrongRows, existingRows, answerRows, cmsRows] = await Promise.all([getWrongQuestions(ctx.user.id), getWrongQuestionConciseExplanations(ctx.user.id), getUserAnswerRows(ctx.user.id), getCmsQuestions()]);
      const existingIds = new Set(existingRows.map(row => row.questionId));
      const pendingIds = wrongRows.map(row => row.questionId).filter(questionId => !existingIds.has(questionId)).slice(0, 20);
      const latestAnswerByQuestion = new Map<string, (typeof answerRows)[number]>();
      for (const row of answerRows) if (!latestAnswerByQuestion.has(row.questionId)) latestAnswerByQuestion.set(row.questionId, row);
      const cmsByQuestionId = new Map(cmsRows.map(row => [row.questionId, row]));
      const results = await Promise.all(pendingIds.map(async questionId => {
        const official = cmsByQuestionId.get(questionId);
        if (!official) return { questionId, status: "skipped" as const };
        try {
          const question = cmsQuestionToQuizQuestion(official);
          const response = await invokeLLM({ model: "gpt-5-mini", messages: buildConciseWrongQuestionAiMessages(question, latestAnswerByQuestion.get(questionId)?.selectedOption), maxCompletionTokens: 1200, response_format: { type: "json_schema", json_schema: { name: "concise_wrong_question_note", strict: true, schema: { type: "object", properties: { summary: { type: "string" }, memoryTip: { type: "string" }, sourceNotice: { type: "string" } }, required: ["summary", "memoryTip", "sourceNotice"], additionalProperties: false } } } });
          const content = response.choices[0]?.message.content;
          if (typeof content !== "string") throw new Error("Concise explanation response is empty");
          const concise = parseConciseWrongQuestionExplanation(content);
          await upsertWrongQuestionConciseExplanation(ctx.user.id, { questionId, summary: concise.summary, memoryTip: concise.memoryTip, model: "gpt-5-mini" });
          return { questionId, status: "generated" as const };
        } catch (error) {
          console.error("[ConciseWrongQuestionAI] batch generation failed", questionId, error);
          return { questionId, status: "failed" as const };
        }
      }));
      return { requestedCount: pendingIds.length, generatedCount: results.filter(row => row.status === "generated").length, failedCount: results.filter(row => row.status === "failed").length, skippedCount: results.filter(row => row.status === "skipped").length, remainingCount: Math.max(0, wrongRows.length - existingRows.length - pendingIds.length) };
    }),
    regenerateUnclearConciseBatch: protectedProcedure.mutation(async ({ ctx }) => {
      const [wrongRows, conciseRows, answerRows, cmsRows] = await Promise.all([getWrongQuestions(ctx.user.id), getWrongQuestionConciseExplanations(ctx.user.id), getUserAnswerRows(ctx.user.id), getCmsQuestions()]);
      const ownedQuestionIds = new Set(wrongRows.map(row => row.questionId));
      const unclearIds = conciseRows.filter(row => row.feedback === "unclear" && ownedQuestionIds.has(row.questionId)).map(row => row.questionId).slice(0, 20);
      const latestAnswerByQuestion = new Map<string, (typeof answerRows)[number]>();
      for (const row of answerRows) if (!latestAnswerByQuestion.has(row.questionId)) latestAnswerByQuestion.set(row.questionId, row);
      const cmsByQuestionId = new Map(cmsRows.map(row => [row.questionId, row]));
      const results = await Promise.all(unclearIds.map(async questionId => {
        const official = cmsByQuestionId.get(questionId);
        if (!official) return { questionId, status: "skipped" as const };
        try {
          const response = await invokeLLM({ model: "gpt-5-mini", messages: buildConciseWrongQuestionAiMessages(cmsQuestionToQuizQuestion(official), latestAnswerByQuestion.get(questionId)?.selectedOption, true), maxCompletionTokens: 1200, response_format: { type: "json_schema", json_schema: { name: "concise_wrong_question_note_batch_regenerated", strict: true, schema: { type: "object", properties: { summary: { type: "string" }, memoryTip: { type: "string" }, sourceNotice: { type: "string" } }, required: ["summary", "memoryTip", "sourceNotice"], additionalProperties: false } } } });
          const content = response.choices[0]?.message.content;
          if (typeof content !== "string") throw new Error("Concise batch regeneration response is empty");
          const concise = parseConciseWrongQuestionExplanation(content);
          await upsertWrongQuestionConciseExplanation(ctx.user.id, { questionId, summary: concise.summary, memoryTip: concise.memoryTip, model: "gpt-5-mini", feedback: "unclear", incrementGeneration: true });
          return { questionId, status: "generated" as const };
        } catch (error) {
          console.error("[ConciseWrongQuestionAI] batch regeneration failed", questionId, error);
          return { questionId, status: "failed" as const };
        }
      }));
      return { requestedCount: unclearIds.length, regeneratedCount: results.filter(row => row.status === "generated").length, failedCount: results.filter(row => row.status === "failed").length, skippedCount: results.filter(row => row.status === "skipped").length, remainingUnclearCount: Math.max(0, conciseRows.filter(row => row.feedback === "unclear" && ownedQuestionIds.has(row.questionId)).length - unclearIds.length) };
    }),
    rateConcise: protectedProcedure.input(z.object({ questionId: z.string().min(1), feedback: z.enum(["helpful", "unclear"]) })).mutation(async ({ ctx, input }) => {
      const [wrongRows, answerRows, cmsRows] = await Promise.all([getWrongQuestions(ctx.user.id), getUserAnswerRows(ctx.user.id), getCmsQuestions()]);
      if (!wrongRows.some(row => row.questionId === input.questionId)) throw new TRPCError({ code: "FORBIDDEN", message: "Cannot rate a question outside this user's wrong question book" });
      if (input.feedback === "helpful") return { explanation: await setWrongQuestionConciseFeedback(ctx.user.id, input.questionId, "helpful"), regenerated: false };
      const official = cmsRows.find(row => row.questionId === input.questionId);
      if (!official) throw new TRPCError({ code: "NOT_FOUND", message: "Official question not found" });
      const latestAnswer = answerRows.find(row => row.questionId === input.questionId);
      try {
        const response = await invokeLLM({ model: "gpt-5-mini", messages: buildConciseWrongQuestionAiMessages(cmsQuestionToQuizQuestion(official), latestAnswer?.selectedOption, true), maxCompletionTokens: 1200, response_format: { type: "json_schema", json_schema: { name: "concise_wrong_question_note_regenerated", strict: true, schema: { type: "object", properties: { summary: { type: "string" }, memoryTip: { type: "string" }, sourceNotice: { type: "string" } }, required: ["summary", "memoryTip", "sourceNotice"], additionalProperties: false } } } });
        const content = response.choices[0]?.message.content;
        if (typeof content !== "string") throw new Error("Concise regenerated explanation response is empty");
        const concise = parseConciseWrongQuestionExplanation(content);
        return { explanation: await upsertWrongQuestionConciseExplanation(ctx.user.id, { questionId: input.questionId, summary: concise.summary, memoryTip: concise.memoryTip, model: "gpt-5-mini", feedback: "unclear", incrementGeneration: true }), regenerated: true };
      } catch (error) {
        console.error("[ConciseWrongQuestionAI] regeneration failed", input.questionId, error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Concise AI explanation is temporarily unavailable" });
      }
    }),
    exportPdfData: protectedProcedure.query(async ({ ctx }) => {
      const [userWrongQuestions, answerRows, cmsRows, conciseRows] = await Promise.all([getWrongQuestions(ctx.user.id), getUserAnswerRows(ctx.user.id), getCmsQuestions(), getWrongQuestionConciseExplanations(ctx.user.id)]);
      const latestAnswerByQuestion = new Map<string, (typeof answerRows)[number]>();
      for (const answer of answerRows) if (!latestAnswerByQuestion.has(answer.questionId)) latestAnswerByQuestion.set(answer.questionId, answer);
      const officialByQuestionId = new Map(cmsRows.map(row => [row.questionId, toClientQuestion(cmsQuestionToQuizQuestion(row))]));
      const conciseByQuestionId = new Map(conciseRows.map(row => [row.questionId, row]));
      return userWrongQuestions.flatMap(row => {
        const question = officialByQuestionId.get(row.questionId);
        if (!question) return [];
        const concise = conciseByQuestionId.get(row.questionId);
        return [{
          questionId: row.questionId,
          text: question.text,
          options: question.options,
          selectedOption: (latestAnswerByQuestion.get(row.questionId)?.selectedOption ?? null) as "A" | "B" | "C" | "D" | null,
          officialAnswer: question.correctOption as "A" | "B" | "C" | "D",
          officialExplanation: question.explanation ?? null,
          status: row.status as "待複習" | "已熟悉",
          wrongCount: row.wrongCount,
          consecutiveCorrect: row.consecutiveCorrect,
          updatedAt: row.updatedAt,
          conciseExplanation: concise ? { summary: concise.summary, memoryTip: concise.memoryTip, generatedAt: concise.generatedAt, generationCount: concise.generationCount, feedback: concise.feedback } : null,
        }];
      });
    }),
    analyzePdfWeakness: protectedProcedure.input(z.object({ questionIds: z.array(z.string().min(1)).min(1).max(649) })).mutation(async ({ ctx, input }) => {
      const [userWrongQuestions, answerRows, cmsRows] = await Promise.all([getWrongQuestions(ctx.user.id), getUserAnswerRows(ctx.user.id), getCmsQuestions()]);
      const ownedByQuestionId = new Map(userWrongQuestions.map(row => [row.questionId, row]));
      const selectedQuestionIds = Array.from(new Set(input.questionIds));
      if (selectedQuestionIds.some(questionId => !ownedByQuestionId.has(questionId))) throw new TRPCError({ code: "FORBIDDEN", message: "Cannot analyze questions outside this user's wrong question book" });
      const latestAnswerByQuestion = new Map<string, (typeof answerRows)[number]>();
      for (const answer of answerRows) if (!latestAnswerByQuestion.has(answer.questionId)) latestAnswerByQuestion.set(answer.questionId, answer);
      const cmsByQuestionId = new Map(cmsRows.map(row => [row.questionId, row]));
      const analysisQuestions = selectedQuestionIds.flatMap(questionId => {
        const official = cmsByQuestionId.get(questionId);
        const wrong = ownedByQuestionId.get(questionId);
        if (!official || !wrong) return [];
        return [{ questionId, category: official.category ?? "", subcategory: official.subcategory ?? "待確認", questionText: official.questionText, officialAnswer: official.correctOption, officialExplanation: official.explanation ?? "", selectedOption: latestAnswerByQuestion.get(questionId)?.selectedOption ?? null, wrongCount: wrong.wrongCount, consecutiveCorrect: wrong.consecutiveCorrect, status: wrong.status }];
      }).sort((a, b) => b.wrongCount - a.wrongCount);
      if (!analysisQuestions.length) throw new TRPCError({ code: "NOT_FOUND", message: "No official wrong-question content found" });
      try {
        const response = await invokeLLM({
          model: "gpt-5-mini",
          messages: buildPdfWeaknessAnalysisMessages(analysisQuestions),
          maxCompletionTokens: 2400,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "pdf_weakness_summary",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  headline: { type: "string" },
                  overallAssessment: { type: "string" },
                  priorityTopics: { type: "array", items: { type: "object", properties: { topic: { type: "string" }, evidence: { type: "string" }, advice: { type: "string" } }, required: ["topic", "evidence", "advice"], additionalProperties: false } },
                  reviewPlan: { type: "array", items: { type: "string" } },
                  sourceNotice: { type: "string" },
                },
                required: ["headline", "overallAssessment", "priorityTopics", "reviewPlan", "sourceNotice"],
                additionalProperties: false,
              },
            },
          },
        });
        const content = response.choices[0]?.message.content;
        if (typeof content !== "string") throw new Error("PDF weakness analysis response is empty");
        return parsePdfWeaknessSummary(content);
      } catch (error) {
        console.error("[WrongQuestionPDF] weakness analysis failed", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI weakness analysis is temporarily unavailable" });
      }
    }),
    explain: protectedProcedure.input(z.object({ questionId: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      const [userWrongQuestions, answerRows, cmsRows] = await Promise.all([getWrongQuestions(ctx.user.id), getUserAnswerRows(ctx.user.id), getCmsQuestions()]);
      if (!userWrongQuestions.some(row => row.questionId === input.questionId)) throw new TRPCError({ code: "NOT_FOUND", message: "Wrong question not found for this user" });
      const cmsQuestion = cmsRows.find(row => row.questionId === input.questionId);
      if (!cmsQuestion) throw new TRPCError({ code: "NOT_FOUND", message: "Official question not found" });
      const question = cmsQuestionToQuizQuestion(cmsQuestion);
      const latestAnswer = answerRows.filter(row => row.questionId === input.questionId).sort((a, b) => b.answeredAt.getTime() - a.answeredAt.getTime())[0];
      try {
        const response = await invokeLLM({
          model: "gpt-5-mini",
          messages: buildWrongQuestionAiMessages(question, latestAnswer?.selectedOption),
          maxCompletionTokens: 2200,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "wrong_question_explanation",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  errorReason: { type: "string" },
                  whyItMatters: { type: "string" },
                  correctThinking: { type: "string" },
                  reviewTip: { type: "string" },
                  sourceNotice: { type: "string" },
                },
                required: ["errorReason", "whyItMatters", "correctThinking", "reviewTip", "sourceNotice"],
                additionalProperties: false,
              },
            },
          },
        });
        const content = response.choices[0]?.message.content;
        if (typeof content !== "string") throw new Error("AI explanation response is empty");
        return { questionId: input.questionId, explanation: parseWrongQuestionAiExplanation(content), officialAnswer: question.correct_option, officialExplanation: question.explanation };
      } catch (error) {
        console.error("[WrongQuestionAI] explanation failed", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI explanation is temporarily unavailable" });
      }
    }),
  }),
  starredQuestions: router({
    list: protectedProcedure.query(({ ctx }) => getStarredQuestions(ctx.user.id)),
    toggle: protectedProcedure.input(z.object({ questionId: z.string().min(1) })).mutation(({ ctx, input }) => toggleStarredQuestion(ctx.user.id, input.questionId)),
    updateTag: protectedProcedure.input(z.object({ questionId: z.string().min(1), tag: z.string().trim().max(64).nullable() })).mutation(({ ctx, input }) => updateStarredQuestionTag(ctx.user.id, input.questionId, input.tag)),
    updateReminder: protectedProcedure.input(z.object({ questionId: z.string().min(1), reminderDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable() })).mutation(({ ctx, input }) => updateStarredQuestionReminder(ctx.user.id, input.questionId, input.reminderDate)),
    stats: protectedProcedure.query(({ ctx }) => getStarredQuestionStats(ctx.user.id)),
  }),
});

export type AppRouter = typeof appRouter;
