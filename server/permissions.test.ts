import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(role: "user" | "admin"): TrpcContext {
  const now = new Date();
  return {
    user: { id: 99, openId: `test-${role}`, email: null, name: role, loginMethod: "test", role, createdAt: now, updatedAt: now, lastSignedIn: now },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("admin access rules", () => {
  it("rejects unauthenticated users from question issue reports", async () => {
    const caller = appRouter.createCaller({ user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] });
    await expect(caller.questionIssues.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.questionIssues.toggle({ questionId: "HARDWARE-1" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
  it("rejects normal users from admin question list", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.quiz.adminList({ needsReviewOnly: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows admins to update a known CMS question", async () => {
    const caller = appRouter.createCaller(context("admin"));
    const knownQuestion = (await caller.quiz.adminList({ needsReviewOnly: false })).find(question => question.id === "HARDWARE-1");
    expect(knownQuestion).toBeDefined();
    const result = await caller.quiz.adminUpdate({ questionId: "HARDWARE-1", explanation: knownQuestion!.explanation, correctOption: knownQuestion!.correctOption });
    expect(result.success).toBe(true);
    expect(result.persistedTo).toMatch(/cms-database/);
  }, 20000);

  it("allows admins to persist a known subcategory without changing official answer content", async () => {
    const caller = appRouter.createCaller(context("admin"));
    const knownQuestion = (await caller.quiz.adminList({ needsReviewOnly: false })).find(question => question.id === "HARDWARE-1");
    expect(knownQuestion).toBeDefined();
    const result = await caller.quiz.adminUpdate({ questionId: "HARDWARE-1", subcategory: knownQuestion!.subcategory, subcategoryStatus: knownQuestion!.subcategoryStatus, subcategoryNotes: knownQuestion!.subcategoryNotes });
    expect(result.persistedTo).toBe("cms-database");
  });

  it("allows admins to list only questions pending subcategory review", async () => {
    const caller = appRouter.createCaller(context("admin"));
    const pending = await caller.quiz.adminList({ needsReviewOnly: false, subcategoryReviewOnly: true });
    expect(pending).toHaveLength(234);
    expect(pending.every(question => question.subcategoryStatus === "needs_manual_review")).toBe(true);
  });

  it("persists a reviewed classification and removes it from the pending list", async () => {
    const caller = appRouter.createCaller(context("admin"));
    const pending = await caller.quiz.adminList({ needsReviewOnly: false, subcategoryReviewOnly: true });
    const candidate = pending.find(question => question.source === "HARDWARE")!;
    expect(candidate).toBeDefined();

    try {
      const saved = await caller.quiz.adminUpdate({ questionId: candidate.id, subcategory: "電腦硬體與組裝", subcategoryStatus: "assigned", subcategoryNotes: "測試：已完成人工審核" });
      expect(saved.persistedTo).toBe("cms-database");
      const afterReview = await caller.quiz.adminList({ needsReviewOnly: false, subcategoryReviewOnly: true });
      expect(afterReview.some(question => question.id === candidate.id)).toBe(false);
    } finally {
      await caller.quiz.adminUpdate({ questionId: candidate.id, subcategory: candidate.subcategory, subcategoryStatus: "needs_manual_review", subcategoryNotes: candidate.subcategoryNotes });
    }
  });

  it("allows admins to batch classify pending questions without changing official content", async () => {
    const caller = appRouter.createCaller(context("admin"));
    const pending = await caller.quiz.adminList({ needsReviewOnly: false, subcategoryReviewOnly: true });
    const candidates = pending.filter(question => question.source === "HARDWARE").slice(0, 2);
    expect(candidates).toHaveLength(2);
    try {
      const saved = await caller.quiz.adminBatchUpdateSubcategory({ questionIds: candidates.map(question => question.id), subcategory: "電腦硬體與組裝", subcategoryStatus: "assigned", subcategoryNotes: "測試：批次人工審核" });
      expect(saved).toMatchObject({ success: true, updatedCount: 2, persistedTo: "cms-database" });
      const afterReview = await caller.quiz.adminList({ needsReviewOnly: false, subcategoryReviewOnly: true });
      expect(candidates.every(question => !afterReview.some(row => row.id === question.id))).toBe(true);
    } finally {
      await Promise.all(candidates.map(question => caller.quiz.adminUpdate({ questionId: question.id, subcategory: question.subcategory, subcategoryStatus: "needs_manual_review", subcategoryNotes: question.subcategoryNotes })));
    }
  });

  it("records, restores, summarizes, and exports classification review batches", async () => {
    const caller = appRouter.createCaller(context("admin"));
    const pending = await caller.quiz.adminList({ needsReviewOnly: false, subcategoryReviewOnly: true });
    const candidate = pending.find(question => question.source === "HARDWARE")!;
    const summaryBefore = await caller.quiz.adminReviewSummary();
    const applied = await caller.quiz.adminBatchUpdateSubcategory({ questionIds: [candidate.id], subcategory: "電腦硬體與組裝", subcategoryStatus: "assigned", subcategoryNotes: "測試：可復原批次審核" });
    expect(applied.updatedCount).toBe(1);
    const history = await caller.quiz.adminReviewHistory();
    expect(history.some(batch => batch.id === applied.batchId)).toBe(true);
    const summaryAfterApply = await caller.quiz.adminReviewSummary();
    expect(summaryAfterApply.pending).toBe(summaryBefore.pending - 1);
    const restored = await caller.quiz.adminRestoreReviewBatch({ batchId: applied.batchId });
    expect(restored.restoredCount).toBe(1);
    const summaryAfterRestore = await caller.quiz.adminReviewSummary();
    expect(summaryAfterRestore.pending).toBe(summaryBefore.pending);
    const exported = await caller.quiz.adminExportPending();
    expect(exported).toHaveLength(summaryBefore.pending);
    expect(exported.some(question => question.id === candidate.id)).toBe(true);
  });
});
