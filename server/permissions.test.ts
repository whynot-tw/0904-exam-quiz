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
});
