import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { userLearningSettings } from "../drizzle/schema";

const testUserId = 992000;

function anonymousContext(): TrpcContext {
  return { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

function authenticatedContext(): TrpcContext {
  const now = new Date();
  return { user: { id: testUserId, openId: "learning-goal-test", email: null, name: "goal-test", loginMethod: "test", role: "user", createdAt: now, updatedAt: now, lastSignedIn: now }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

describe("personal learning goal", () => {
  it("requires login to read and update a goal", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.attempts.learningGoal()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.attempts.updateLearningGoal({ targetCompletion: 80 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("returns the default goal and persists a valid replacement", async () => {
    const db = await getDb();
    if (!db) throw new Error("Test database unavailable");
    const caller = appRouter.createCaller(authenticatedContext());
    await db.delete(userLearningSettings).where(eq(userLearningSettings.userId, testUserId));
    try {
      await expect(caller.attempts.learningGoal()).resolves.toMatchObject({ targetCompletion: 60 });
      await expect(caller.attempts.updateLearningGoal({ targetCompletion: 80 })).resolves.toEqual({ targetCompletion: 80 });
      await expect(caller.attempts.learningGoal()).resolves.toMatchObject({ targetCompletion: 80 });
    } finally {
      await db.delete(userLearningSettings).where(eq(userLearningSettings.userId, testUserId));
    }
  });
});
