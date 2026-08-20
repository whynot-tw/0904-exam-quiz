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
  });

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
});
