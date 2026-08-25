import type { WrongQuestionPdfItem } from "./wrongQuestionPdf";

const CSV_HEADERS = [
  "題號",
  "狀態",
  "累計答錯次數",
  "連續答對次數",
  "最近更新",
  "官方題幹",
  "選項 A",
  "選項 B",
  "選項 C",
  "選項 D",
  "你的最近作答",
  "官方正解",
  "官方解析",
  "精簡判斷重點",
  "精簡記憶口訣",
  "精簡解析版本",
  "精簡解析回饋",
];

export function getWrongQuestionCsvFilename(date = new Date()) {
  const stamp = date.toISOString().slice(0, 10).replaceAll("-", "");
  return `錯題本離線複習_${stamp}.csv`;
}

export function escapeCsvValue(value: unknown) {
  const normalized = String(value ?? "").replace(/\r\n?/g, "\n");
  const formulaSafe = /^[=+\-@]/.test(normalized) ? `'${normalized}` : normalized;
  return `"${formulaSafe.replaceAll('"', '""')}"`;
}

export function buildWrongQuestionCsv(items: WrongQuestionPdfItem[]) {
  const rows = items.map(item => [
    item.questionId,
    item.status,
    item.wrongCount,
    item.consecutiveCorrect,
    new Date(item.updatedAt).toLocaleString("zh-TW"),
    item.text,
    item.options.A,
    item.options.B,
    item.options.C,
    item.options.D,
    item.selectedOption ? `${item.selectedOption}：${item.options[item.selectedOption]}` : "尚無可用的最近作答紀錄",
    `${item.officialAnswer}：${item.options[item.officialAnswer]}`,
    item.officialExplanation?.trim() || "官方題庫未提供解析。",
    item.conciseExplanation?.summary || "",
    item.conciseExplanation?.memoryTip || "",
    item.conciseExplanation?.generationCount ?? "",
    item.conciseExplanation?.feedback || "",
  ].map(escapeCsvValue).join(","));

  return [CSV_HEADERS.map(escapeCsvValue).join(","), ...rows].join("\r\n");
}

export function downloadWrongQuestionCsv(items: WrongQuestionPdfItem[]) {
  if (!items.length) throw new Error("目前沒有可匯出的錯題");
  const blob = new Blob(["\uFEFF", buildWrongQuestionCsv(items)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = getWrongQuestionCsvFilename();
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
