import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function publicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("CMS question import", () => {
  it("serves the imported CMS question bank and CMS settings", async () => {
    const caller = appRouter.createCaller(publicContext());
    const result = await caller.quiz.bootstrap();

    expect(result.source).toBe("cms-database");
    expect(result.qa).toEqual({ total: 657, enabled: 649, needsReview: 8 });
    expect(result.settings).toMatchObject({ examDate: "2026-09-04", targetScore: 80, mockQuestionCount: 20, maxWrong: 4 });
    expect(result.questions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "HARDWARE-1", source: "HARDWARE", correctOption: "A", subcategory: "電腦硬體與組裝", subcategoryStatus: "assigned" }),
      expect.objectContaining({ id: "AI-1", source: "AI", subcategory: "AI 工具與生成式 AI", subcategoryStatus: "assigned" }),
      expect.objectContaining({ id: "HARDWARE-5", subcategory: "待確認", subcategoryStatus: "needs_manual_review" }),
    ]));
  });
});
