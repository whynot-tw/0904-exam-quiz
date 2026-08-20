export const ALL_SUBCATEGORIES = "all";

export type SubcategoryQuestion = {
  source: string;
  subcategory?: string | null;
  subcategoryStatus?: string | null;
};

export type Subcategory = { id: string; label: string; status: string };
export type SubcategoryProgress = { source: string; label?: string; accuracy: number | null; completion: number };

export function getSubcategories(questions: SubcategoryQuestion[], courseType: string): Subcategory[] {
  const visible = courseType === "all" ? questions : questions.filter(question => question.source === courseType);
  const values = new Map<string, Subcategory>();
  for (const question of visible) {
    const label = question.subcategory?.trim() || "待確認";
    if (!values.has(label)) values.set(label, { id: label, label, status: question.subcategoryStatus ?? "pending" });
  }
  return Array.from(values.values()).sort((a, b) => a.label.localeCompare(b.label, "zh-TW"));
}

export function filterQuestionsBySubcategory<T extends SubcategoryQuestion>(questions: T[], subcategory: string): T[] {
  return subcategory === ALL_SUBCATEGORIES ? questions : questions.filter(question => (question.subcategory?.trim() || "待確認") === subcategory);
}

export function getWeakestSubcategory<T extends SubcategoryProgress>(rows: T[] | undefined, allowedIds?: string[]): T | null {
  const allowed = allowedIds ? new Set(allowedIds) : null;
  const eligible = (rows ?? []).filter(row => row.source !== "待確認" && row.accuracy !== null && (!allowed || allowed.has(row.source)));
  if (!eligible.length) return null;
  return [...eligible].sort((left, right) => (left.accuracy! - right.accuracy!) || (left.completion - right.completion) || left.source.localeCompare(right.source, "zh-TW"))[0];
}
