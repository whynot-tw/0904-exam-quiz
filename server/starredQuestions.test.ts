import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function anonymousContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

function authenticatedContext(): TrpcContext {
  const now = new Date();
  return {
    user: { id: 991999, openId: "starred-question-test", email: null, name: "star-test", loginMethod: "test", role: "user", createdAt: now, updatedAt: now, lastSignedIn: now },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("starredQuestions access rules", () => {
  it("requires login to load the personal starred-question list", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.starredQuestions.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires login to change a personal star marker", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.starredQuestions.toggle({ questionId: "HARDWARE-1" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("writes, reads, and removes a personal star marker", async () => {
    const caller = appRouter.createCaller(authenticatedContext());
    const questionId = "HARDWARE-1";

    const added = await caller.starredQuestions.toggle({ questionId });
    expect(added).toEqual({ questionId, starred: true });
    await expect(caller.starredQuestions.list()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ questionId }),
    ]));

    const removed = await caller.starredQuestions.toggle({ questionId });
    expect(removed).toEqual({ questionId, starred: false });
  });
});
