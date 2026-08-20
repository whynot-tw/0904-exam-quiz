export const ADMIN_PENDING_QUICK_FILTERS = [
  { id: "all", label: "全部" },
  { id: "windows", label: "Windows", terms: ["windows"] },
  { id: "linux", label: "Linux", terms: ["linux", "unix"] },
  { id: "network", label: "網路", terms: ["網路", "乙太網", "tcp", "http", "ip", "網際網路"] },
  { id: "hardware", label: "硬體", terms: ["硬碟", "hdd", "ssd", "cpu", "記憶體", "主機板"] },
] as const;

export type AdminPendingQuickFilter = (typeof ADMIN_PENDING_QUICK_FILTERS)[number]["id"];

type SearchableQuestion = { id: string; text: string; subcategory?: string; subcategoryNotes?: string | null; options?: Record<string, string>; explanation?: string | null };

export function filterAdminPendingQuestions<T extends SearchableQuestion>(questions: T[], search: string, quickFilter: AdminPendingQuickFilter): T[] {
  const normalizedSearch = search.trim().toLowerCase();
  const selected = ADMIN_PENDING_QUICK_FILTERS.find(filter => filter.id === quickFilter) ?? ADMIN_PENDING_QUICK_FILTERS[0];
  return questions.filter(question => {
    const haystack = [question.id, question.text, question.subcategory ?? "", question.subcategoryNotes ?? "", question.explanation ?? "", ...Object.values(question.options ?? {})].join(" ").toLowerCase();
    const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);
    const matchesQuickFilter = selected.id === "all" || selected.terms?.some(term => haystack.includes(term));
    return matchesSearch && matchesQuickFilter;
  });
}
