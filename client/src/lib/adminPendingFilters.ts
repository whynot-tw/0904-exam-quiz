export const ADMIN_PENDING_QUICK_FILTERS = [
  { id: "all", label: "全部" },
  { id: "windows", label: "Windows", terms: ["windows"] },
  { id: "linux", label: "Linux", terms: ["linux", "unix"] },
  { id: "network", label: "網路", terms: ["網路", "乙太網", "tcp", "http", "ip", "網際網路"] },
  { id: "hardware", label: "硬體", terms: ["硬碟", "hdd", "ssd", "cpu", "記憶體", "主機板"] },
] as const;

export type AdminPendingQuickFilter = Exclude<(typeof ADMIN_PENDING_QUICK_FILTERS)[number]["id"], "all">;

type SearchableQuestion = { id: string; text: string; subcategory?: string; subcategoryNotes?: string | null; options?: Record<string, string>; explanation?: string | null };

export function filterAdminPendingQuestions<T extends SearchableQuestion>(questions: T[], search: string, quickFilters: AdminPendingQuickFilter[]): T[] {
  const normalizedSearch = search.trim().toLowerCase();
  const selected = ADMIN_PENDING_QUICK_FILTERS.filter(filter => filter.id !== "all" && quickFilters.includes(filter.id as AdminPendingQuickFilter));
  return questions.filter(question => {
    const haystack = [question.id, question.text, question.subcategory ?? "", question.subcategoryNotes ?? "", question.explanation ?? "", ...Object.values(question.options ?? {})].join(" ").toLowerCase();
    const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);
    const matchesQuickFilter = !selected.length || selected.some(filter => {
      const terms = "terms" in filter ? filter.terms : [];
      return terms.some(term => haystack.includes(term));
    });
    return matchesSearch && matchesQuickFilter;
  });
}

export function getAdminPendingQuickFilterCounts<T extends SearchableQuestion>(questions: T[]): Record<"all" | AdminPendingQuickFilter, number> {
  const counts: Record<string, number> = { all: questions.length };
  for (const filter of ADMIN_PENDING_QUICK_FILTERS) {
    if (filter.id !== "all") counts[filter.id] = filterAdminPendingQuestions(questions, "", [filter.id as AdminPendingQuickFilter]).length;
  }
  return counts as Record<"all" | AdminPendingQuickFilter, number>;
}
