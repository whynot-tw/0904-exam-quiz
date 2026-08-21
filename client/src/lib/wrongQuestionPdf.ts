import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { SITE_MAIN_TITLE, SITE_SUBTITLE } from "@/lib/siteIdentity";

export type WrongQuestionPdfItem = {
  questionId: string;
  text: string;
  options: Record<"A" | "B" | "C" | "D", string>;
  selectedOption: "A" | "B" | "C" | "D" | null;
  officialAnswer: "A" | "B" | "C" | "D";
  officialExplanation: string | null;
  status: "待複習" | "已熟悉";
  wrongCount: number;
  consecutiveCorrect: number;
  updatedAt: Date | string;
  conciseExplanation?: { summary: string; memoryTip: string; generatedAt: Date | string; generationCount: number; feedback: string | null } | null;
};

export type PdfWeaknessSummary = {
  headline: string;
  overallAssessment: string;
  priorityTopics: Array<{ topic: string; evidence: string; advice: string }>;
  reviewPlan: string[];
  sourceNotice: string;
};

export type ConcisePdfSummary = {
  exportedCount: number;
  conciseCount: number;
  unclearCount: number;
  versionCounts: Array<{ generationCount: number; count: number }>;
};

const CJK_FONT_URL = "/manus-storage/wrong-question-pdf-cjk_84f8834c.ttf";
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 44;
const BODY_SIZE = 10;
const LINE_HEIGHT = 16;

export function getWrongQuestionPdfFilename(date = new Date()) {
  const stamp = date.toISOString().slice(0, 10).replaceAll("-", "");
  return `錯題本離線複習_${stamp}.pdf`;
}

export function summarizeConcisePdfItems(items: WrongQuestionPdfItem[]): ConcisePdfSummary {
  const conciseItems = items.flatMap(item => item.conciseExplanation ? [item.conciseExplanation] : []);
  const versionCounts = new Map<number, number>();
  conciseItems.forEach(item => versionCounts.set(item.generationCount, (versionCounts.get(item.generationCount) ?? 0) + 1));
  return { exportedCount: items.length, conciseCount: conciseItems.length, unclearCount: conciseItems.filter(item => item.feedback === "unclear").length, versionCounts: Array.from(versionCounts.entries()).sort(([left], [right]) => left - right).map(([generationCount, count]) => ({ generationCount, count })) };
}

export function buildWrongQuestionPdfOutline(item: WrongQuestionPdfItem) {
  const selected = item.selectedOption ? `${item.selectedOption}：${item.options[item.selectedOption]}` : "尚無可用的最近作答紀錄";
  const answer = `${item.officialAnswer}：${item.options[item.officialAnswer]}`;
  return [
    `題號 ${item.questionId}｜${item.status}｜累計答錯 ${item.wrongCount} 次｜連續答對 ${item.consecutiveCorrect} 次`,
    item.text,
    ...(["A", "B", "C", "D"] as const).map(key => `${key}. ${item.options[key]}`),
    `你的最近作答：${selected}`,
    `官方正解：${answer}`,
    `官方解析：${item.officialExplanation?.trim() || "官方題庫未提供解析。"}`,
    ...(item.conciseExplanation ? [`精簡解析（第 ${item.conciseExplanation.generationCount} 版｜最近產生 ${new Date(item.conciseExplanation.generatedAt).toLocaleString("zh-TW")}）：${item.conciseExplanation.summary}`, `記憶口訣：${item.conciseExplanation.memoryTip}`] : []),
  ];
}

function splitText(font: PDFFont, text: string, size: number, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r/g, "").split("\n")) {
    if (!paragraph) { lines.push(""); continue; }
    let line = "";
    for (const char of Array.from(paragraph)) {
      const proposal = `${line}${char}`;
      if (line && font.widthOfTextAtSize(proposal, size) > maxWidth) { lines.push(line); line = char; }
      else line = proposal;
    }
    if (line) lines.push(line);
  }
  return lines;
}

function drawPageFrame(page: PDFPage, font: PDFFont, pageNumber: number) {
  page.drawText(`${SITE_MAIN_TITLE} ┃ ${SITE_SUBTITLE}`, { x: MARGIN, y: PAGE_HEIGHT - 30, size: 8, font, color: rgb(0.25, 0.38, 0.32) });
  page.drawLine({ start: { x: MARGIN, y: PAGE_HEIGHT - 38 }, end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 38 }, thickness: 0.6, color: rgb(0.78, 0.84, 0.8) });
  page.drawText(`第 ${pageNumber} 頁`, { x: PAGE_WIDTH - MARGIN - 34, y: 25, size: 8, font, color: rgb(0.42, 0.48, 0.45) });
}

export async function buildWrongQuestionPdfBytes(items: WrongQuestionPdfItem[], fontBytes: ArrayBuffer, weaknessSummary?: PdfWeaknessSummary) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes, { subset: true });
  let pageNumber = 0;
  let page: PDFPage | undefined;
  let y = 0;

  const nextPage = () => {
    pageNumber += 1;
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawPageFrame(page, font, pageNumber);
    y = PAGE_HEIGHT - 62;
    return page;
  };
  const drawLines = (text: string, options?: { size?: number; color?: ReturnType<typeof rgb>; gapAfter?: number }) => {
    const size = options?.size ?? BODY_SIZE;
    const color = options?.color ?? rgb(0.1, 0.16, 0.14);
    const lines = splitText(font, text, size, PAGE_WIDTH - MARGIN * 2);
    for (const line of lines) {
      if (y < 56) nextPage();
      const activePage = page ?? nextPage();
      if (line) activePage.drawText(line, { x: MARGIN, y, size, font, color });
      y -= LINE_HEIGHT * (size / BODY_SIZE);
    }
    y -= options?.gapAfter ?? 3;
  };

  const firstPage = nextPage();
  firstPage.drawText("錯題本離線複習", { x: MARGIN, y, size: 22, font, color: rgb(0.08, 0.22, 0.16) });
  y -= 32;
  drawLines(`匯出日期：${new Date().toLocaleDateString("zh-TW")}　共 ${items.length} 題`, { size: 10, color: rgb(0.32, 0.43, 0.38), gapAfter: 12 });
  drawLines("本檔案僅整理你個人的錯題紀錄；題幹、選項、官方正解與官方解析均維持題庫原文。", { size: 9, color: rgb(0.42, 0.48, 0.45), gapAfter: 16 });
  const conciseSummary = summarizeConcisePdfItems(items);
  drawLines("精簡解析摘要", { size: 15, color: rgb(0.28, 0.32, 0.62), gapAfter: 4 });
  if (conciseSummary.conciseCount) {
    drawLines(`本次匯出 ${conciseSummary.exportedCount} 題，其中 ${conciseSummary.conciseCount} 題含精簡解析。`, { size: 9.5, color: rgb(0.24, 0.3, 0.5), gapAfter: 2 });
    drawLines(`版本分布：${conciseSummary.versionCounts.map(item => `第 ${item.generationCount} 版 ${item.count} 題`).join("｜")}`, { size: 9.5, color: rgb(0.24, 0.3, 0.5), gapAfter: 2 });
    drawLines(`標記「不夠清楚」：${conciseSummary.unclearCount} 題`, { size: 9.5, color: rgb(0.52, 0.3, 0.18), gapAfter: 16 });
  } else {
    drawLines("本次匯出範圍尚無已儲存的精簡解析。", { size: 9.5, color: rgb(0.42, 0.48, 0.45), gapAfter: 16 });
  }
  if (weaknessSummary) {
    drawLines("AI 弱點分析總結", { size: 15, color: rgb(0.38, 0.22, 0.52), gapAfter: 5 });
    drawLines(weaknessSummary.headline, { size: 12, color: rgb(0.19, 0.14, 0.29), gapAfter: 5 });
    drawLines(weaknessSummary.overallAssessment, { gapAfter: 9 });
    weaknessSummary.priorityTopics.forEach((topic, index) => {
      drawLines(`${index + 1}. 優先主題：${topic.topic}`, { size: 11, color: rgb(0.32, 0.2, 0.45), gapAfter: 2 });
      drawLines(`資料依據：${topic.evidence}`, { size: 9, color: rgb(0.28, 0.31, 0.29), gapAfter: 1 });
      drawLines(`複習建議：${topic.advice}`, { size: 9, color: rgb(0.14, 0.35, 0.24), gapAfter: 5 });
    });
    drawLines("建議複習計畫", { size: 11, color: rgb(0.32, 0.2, 0.45), gapAfter: 2 });
    weaknessSummary.reviewPlan.forEach((plan, index) => drawLines(`${index + 1}. ${plan}`, { size: 9, gapAfter: 1 }));
    drawLines(weaknessSummary.sourceNotice, { size: 8.5, color: rgb(0.42, 0.48, 0.45), gapAfter: 14 });
  }

  items.forEach((item, index) => {
    if (y < 150) nextPage();
    drawLines(`${index + 1}. ${item.questionId}　${item.status}｜累計答錯 ${item.wrongCount} 次｜連續答對 ${item.consecutiveCorrect} 次`, { size: 12, color: rgb(0.08, 0.32, 0.22), gapAfter: 5 });
    drawLines(`題目：${item.text}`, { gapAfter: 4 });
    (["A", "B", "C", "D"] as const).forEach(option => drawLines(`${option}. ${item.options[option]}`, { gapAfter: 0 }));
    const selected = item.selectedOption ? `${item.selectedOption}：${item.options[item.selectedOption]}` : "尚無可用的最近作答紀錄";
    drawLines(`你的最近作答：${selected}`, { color: rgb(0.58, 0.18, 0.16), gapAfter: 2 });
    drawLines(`官方正解：${item.officialAnswer}：${item.options[item.officialAnswer]}`, { color: rgb(0.06, 0.38, 0.23), gapAfter: 2 });
    drawLines(`官方解析：${item.officialExplanation?.trim() || "官方題庫未提供解析。"}`, { color: rgb(0.18, 0.25, 0.22), gapAfter: 14 });
    if (item.conciseExplanation) {
      const concise = item.conciseExplanation;
      drawLines(`精簡記憶解析｜第 ${concise.generationCount} 版｜最近產生 ${new Date(concise.generatedAt).toLocaleString("zh-TW")}`, { size: 10, color: rgb(0.28, 0.32, 0.62), gapAfter: 2 });
      drawLines(`判斷重點：${concise.summary}`, { color: rgb(0.2, 0.24, 0.48), gapAfter: 2 });
      drawLines(`記憶口訣：${concise.memoryTip}`, { color: rgb(0.2, 0.24, 0.48), gapAfter: 14 });
    }
  });

  return pdf.save();
}

export async function downloadWrongQuestionPdf(items: WrongQuestionPdfItem[], weaknessSummary?: PdfWeaknessSummary) {
  if (!items.length) throw new Error("目前沒有可匯出的錯題");
  const response = await fetch(CJK_FONT_URL);
  if (!response.ok) throw new Error("PDF 中文字型載入失敗");
  const pdfBytes = await buildWrongQuestionPdfBytes(items, await response.arrayBuffer(), weaknessSummary);
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = getWrongQuestionPdfFilename();
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
