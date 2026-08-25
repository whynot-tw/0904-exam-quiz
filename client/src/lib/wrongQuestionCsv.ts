import type { WrongQuestionPdfItem } from "./wrongQuestionPdf";

export const WRONG_QUESTION_CSV_COLUMNS = [
  { key: "questionId", label: "題號" },
  { key: "courseLabel", label: "課程類型" },
  { key: "subcategory", label: "次分類" },
  { key: "status", label: "狀態" },
  { key: "wrongCount", label: "累計答錯次數" },
  { key: "consecutiveCorrect", label: "連續答對次數" },
  { key: "updatedAt", label: "最近更新" },
  { key: "text", label: "官方題幹" },
  { key: "optionA", label: "選項 A" },
  { key: "optionB", label: "選項 B" },
  { key: "optionC", label: "選項 C" },
  { key: "optionD", label: "選項 D" },
  { key: "selectedOption", label: "你的最近作答" },
  { key: "officialAnswer", label: "官方正解" },
  { key: "officialExplanation", label: "官方解析" },
  { key: "conciseSummary", label: "精簡判斷重點" },
  { key: "conciseMemoryTip", label: "精簡記憶口訣" },
  { key: "conciseVersion", label: "精簡解析版本" },
  { key: "conciseFeedback", label: "精簡解析回饋" },
] as const;

export type WrongQuestionCsvColumnKey = (typeof WRONG_QUESTION_CSV_COLUMNS)[number]["key"];
export type WrongQuestionCsvStatus = "待複習" | "已熟悉" | "未解析" | "全部";
export type WrongQuestionCsvPreset = { id: string; name: string; columnKeys: WrongQuestionCsvColumnKey[] };

export function getDefaultWrongQuestionCsvColumns() {
  return WRONG_QUESTION_CSV_COLUMNS.map(column => column.key);
}

export function readWrongQuestionCsvPresets(value: string | null): WrongQuestionCsvPreset[] {
  if (!value) return [];
  try {
    const validKeys = new Set<WrongQuestionCsvColumnKey>(getDefaultWrongQuestionCsvColumns());
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item): WrongQuestionCsvPreset[] => {
      if (!item || typeof item.id !== "string" || typeof item.name !== "string") return [];
      const columnKeys = Array.isArray(item.columnKeys) ? item.columnKeys.filter((key: unknown): key is WrongQuestionCsvColumnKey => typeof key === "string" && validKeys.has(key as WrongQuestionCsvColumnKey)) : [];
      return columnKeys.length && item.name.trim() ? [{ id: item.id, name: item.name.trim().slice(0, 32), columnKeys }] : [];
    }).slice(0, 8);
  } catch {
    return [];
  }
}

export function serializeWrongQuestionCsvPresets(presets: WrongQuestionCsvPreset[]) {
  return JSON.stringify(presets.slice(0, 8).map(preset => ({ id: preset.id, name: preset.name.trim().slice(0, 32), columnKeys: preset.columnKeys })));
}

export function getWrongQuestionCsvFilename(date = new Date()) {
  const stamp = date.toISOString().slice(0, 10).replaceAll("-", "");
  return `錯題本離線複習_${stamp}.csv`;
}

export function escapeCsvValue(value: unknown) {
  const normalized = String(value ?? "").replace(/\r\n?/g, "\n");
  const formulaSafe = /^[=+\-@]/.test(normalized) ? `'${normalized}` : normalized;
  return `"${formulaSafe.replaceAll('"', '""')}"`;
}

function getCsvValues(item: WrongQuestionPdfItem): Record<WrongQuestionCsvColumnKey, string | number> {
  return {
    questionId: item.questionId,
    courseLabel: item.courseLabel || item.courseType || "未分類",
    subcategory: item.subcategory || "待確認",
    status: item.status,
    wrongCount: item.wrongCount,
    consecutiveCorrect: item.consecutiveCorrect,
    updatedAt: new Date(item.updatedAt).toLocaleString("zh-TW"),
    text: item.text,
    optionA: item.options.A,
    optionB: item.options.B,
    optionC: item.options.C,
    optionD: item.options.D,
    selectedOption: item.selectedOption ? `${item.selectedOption}：${item.options[item.selectedOption]}` : "尚無可用的最近作答紀錄",
    officialAnswer: `${item.officialAnswer}：${item.options[item.officialAnswer]}`,
    officialExplanation: item.officialExplanation?.trim() || "官方題庫未提供解析。",
    conciseSummary: item.conciseExplanation?.summary || "",
    conciseMemoryTip: item.conciseExplanation?.memoryTip || "",
    conciseVersion: item.conciseExplanation?.generationCount ?? "",
    conciseFeedback: item.conciseExplanation?.feedback || "",
  };
}

export function buildWrongQuestionCsv(items: WrongQuestionPdfItem[], columnKeys = getDefaultWrongQuestionCsvColumns()) {
  const selectedColumns = WRONG_QUESTION_CSV_COLUMNS.filter(column => columnKeys.includes(column.key));
  if (!selectedColumns.length) throw new Error("請至少選擇一個 CSV 欄位");
  const rows = items.map(item => {
    const values = getCsvValues(item);
    return selectedColumns.map(column => escapeCsvValue(values[column.key])).join(",");
  });

  return [selectedColumns.map(column => escapeCsvValue(column.label)).join(","), ...rows].join("\r\n");
}

export function filterWrongQuestionCsvItems(items: WrongQuestionPdfItem[], options: { status: WrongQuestionCsvStatus; startDate?: string; endDate?: string; courseType?: string; subcategory?: string }) {
  const start = options.startDate ? new Date(`${options.startDate}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
  const end = options.endDate ? new Date(`${options.endDate}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
  if (start > end) throw new Error("起始日期不可晚於結束日期");
  return items.filter(item => {
    const statusMatches = options.status === "全部" || (options.status === "未解析" ? !item.conciseExplanation : item.status === options.status);
    const updatedAt = new Date(item.updatedAt).getTime();
    const courseMatches = !options.courseType || item.courseType === options.courseType;
    const subcategoryMatches = !options.subcategory || (item.subcategory || "待確認") === options.subcategory;
    return statusMatches && courseMatches && subcategoryMatches && updatedAt >= start && updatedAt <= end;
  });
}

export function downloadWrongQuestionCsv(items: WrongQuestionPdfItem[], columnKeys = getDefaultWrongQuestionCsvColumns()) {
  if (!items.length) throw new Error("目前沒有可匯出的錯題");
  const blob = new Blob(["\uFEFF", buildWrongQuestionCsv(items, columnKeys)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = getWrongQuestionCsvFilename();
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
