import { describe, expect, it } from "vitest";
import { summarizeWrongProgress } from "../shared/wrongProgress";

describe("summarizeWrongProgress", () => {
  it("summarizes review status, mistakes, category and latest review", () => {
    const result = summarizeWrongProgress([
      { status: "待複習", wrongCount: 3, category: "電腦硬體裝修", updatedAt: "2026-08-20T10:00:00Z" },
      { status: "已熟悉", wrongCount: 1, category: "電腦硬體裝修", updatedAt: "2026-08-21T10:00:00Z" },
      { status: "待複習", wrongCount: 2, category: "AI人工智慧工具應用", updatedAt: "2026-08-19T10:00:00Z" },
    ]);

    expect(result).toMatchObject({
      total: 3,
      pending: 2,
      mastered: 1,
      completionRate: 33,
      totalWrongCount: 6,
      mostWrongCategory: "電腦硬體裝修",
      mostWrongCategoryCount: 4,
    });
    expect(new Date(result.lastReviewedAt as string).toISOString()).toBe("2026-08-21T10:00:00.000Z");
  });

  it("returns safe empty-state values", () => {
    expect(summarizeWrongProgress([])).toEqual({
      total: 0,
      pending: 0,
      mastered: 0,
      completionRate: 0,
      totalWrongCount: 0,
      mostWrongCategory: null,
      mostWrongCategoryCount: 0,
      lastReviewedAt: null,
    });
  });
});
