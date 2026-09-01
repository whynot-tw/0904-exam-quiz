import type { WrongQuestionPdfItem } from "@/lib/wrongQuestionPdf";

type StarredRow = { questionId: string; tag?: string | null; createdAt?: Date | string | null; reminderDate?: string | null };
type Question = { id: string; text: string; options: Record<"A" | "B" | "C" | "D", string>; correctOption: string; explanation?: string | null; courseType?: string; courseLabel?: string; subcategory?: string };
export type StarredQuestionExportItem = WrongQuestionPdfItem & { starredTag: string; starredAt: Date | string | null; reminderDate: string | null };

export function buildStarredQuestionExportItems(starRows: StarredRow[], questions: Question[]): StarredQuestionExportItem[] {
  const questionById = new Map(questions.map(question => [question.id, question]));
  return starRows.map((row): StarredQuestionExportItem | null => {
    const question = questionById.get(row.questionId);
    if (!question) return null;
    const officialAnswer = ["A", "B", "C", "D"].includes(question.correctOption) ? question.correctOption as "A" | "B" | "C" | "D" : "A";
    return { questionId: question.id, text: question.text, options: question.options, selectedOption: null, officialAnswer, officialExplanation: question.explanation ?? null, status: "待複習", wrongCount: 0, consecutiveCorrect: 0, updatedAt: row.createdAt ?? new Date(0), courseType: question.courseType, courseLabel: question.courseLabel, subcategory: question.subcategory, starredTag: row.tag?.trim() || "未分類標籤", starredAt: row.createdAt ?? null, reminderDate: row.reminderDate ?? null };
  }).filter((item): item is StarredQuestionExportItem => Boolean(item));
}

export function buildStarredQuestionCsv(items: StarredQuestionExportItem[]) {
  const escape = (value: unknown) => `"${String(value ?? "").replace(/\r\n?/g, "\n").replaceAll('"', '""')}"`;
  const headers = ["題號", "課程", "次分類", "標籤", "提醒日期", "題幹", "選項A", "選項B", "選項C", "選項D", "官方答案", "官方解析"];
  const rows = items.map(item => [item.questionId, item.courseLabel || item.courseType || "未分類", item.subcategory || "待確認", item.starredTag, item.reminderDate || "", item.text, item.options.A, item.options.B, item.options.C, item.options.D, `${item.officialAnswer}：${item.options[item.officialAnswer]}`, item.officialExplanation || "官方題庫未提供解析。"].map(escape).join(","));
  return [headers.map(escape).join(","), ...rows].join("\r\n");
}

export function downloadStarredQuestionCsv(items: StarredQuestionExportItem[]) {
  if (!items.length) throw new Error("目前沒有可匯出的星號題目");
  const url = URL.createObjectURL(new Blob(["\uFEFF", buildStarredQuestionCsv(items)], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = `星號題庫_${new Date().toISOString().slice(0, 10).replaceAll("-", "")}.csv`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
