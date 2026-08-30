export type WrongProgressRow = {
  status: string;
  wrongCount: number;
  updatedAt?: Date | string | number | null;
  category?: string | null;
};

export type WrongProgress = {
  total: number;
  pending: number;
  mastered: number;
  completionRate: number;
  totalWrongCount: number;
  mostWrongCategory: string | null;
  mostWrongCategoryCount: number;
  lastReviewedAt: Date | string | number | null;
};

export function summarizeWrongProgress(rows: WrongProgressRow[]): WrongProgress {
  const categoryCounts = new Map<string, number>();
  let totalWrongCount = 0;
  let pending = 0;
  let mastered = 0;
  let lastReviewedAt: Date | string | number | null = null;

  for (const row of rows) {
    const wrongCount = Number(row.wrongCount) || 0;
    totalWrongCount += wrongCount;
    if (row.status === "已熟悉") mastered += 1;
    else pending += 1;

    const category = row.category?.trim() || "未分類";
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + wrongCount);

    if (row.updatedAt && (!lastReviewedAt || new Date(row.updatedAt).getTime() > new Date(lastReviewedAt).getTime())) {
      lastReviewedAt = row.updatedAt;
    }
  }

  const mostWrongCategoryEntry = Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-TW"))[0];
  return {
    total: rows.length,
    pending,
    mastered,
    completionRate: rows.length ? Math.round((mastered / rows.length) * 100) : 0,
    totalWrongCount,
    mostWrongCategory: mostWrongCategoryEntry?.[0] ?? null,
    mostWrongCategoryCount: mostWrongCategoryEntry?.[1] ?? 0,
    lastReviewedAt,
  };
}
