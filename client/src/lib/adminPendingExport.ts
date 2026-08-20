export type PendingExportQuestion = {
  id: string;
  text: string;
  options?: Record<string, string>;
  correctOption: string;
  subcategoryNotes?: string | null;
  section?: string | null;
  subcategory?: string | null;
  subcategoryStatus?: string | null;
};

const quoteCsv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export function buildPendingQuestionsCsv(questions: PendingExportQuestion[]) {
  const header = ["題號", "題幹", "選項 A", "選項 B", "選項 C", "選項 D", "正解", "待確認原因", "課程", "目前次分類", "分類狀態"];
  const rows = questions.map(question => [
    question.id,
    question.text,
    question.options?.A,
    question.options?.B,
    question.options?.C,
    question.options?.D,
    question.correctOption,
    question.subcategoryNotes || "官方題幹未達單一分類信心門檻，保留人工判定。",
    question.section,
    question.subcategory || "待確認",
    question.subcategoryStatus,
  ]);
  return "\uFEFF" + [header, ...rows].map(row => row.map(quoteCsv).join(",")).join("\n");
}
