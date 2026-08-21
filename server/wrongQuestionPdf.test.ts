import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { buildWrongQuestionPdfBytes, buildWrongQuestionPdfOutline, getWrongQuestionPdfFilename } from "../client/src/lib/wrongQuestionPdf";

const sample = {
  questionId: "HARDWARE-1",
  text: "請選出正確的硬體敘述。",
  options: { A: "錯誤選項", B: "官方正解", C: "其他選項", D: "其他選項" },
  selectedOption: "A" as const,
  officialAnswer: "B" as const,
  officialExplanation: "此題依官方題庫解析。",
  status: "待複習" as const,
  wrongCount: 2,
  consecutiveCorrect: 0,
  updatedAt: new Date("2026-08-21T00:00:00.000Z"),
};

describe("錯題本 PDF 匯出", () => {
  it("整理使用者作答、官方正解與官方解析，並建立可讀取的中文 PDF", async () => {
    const outline = buildWrongQuestionPdfOutline(sample);
    expect(outline.join("\n")).toContain("你的最近作答：A：錯誤選項");
    expect(outline.join("\n")).toContain("官方正解：B：官方正解");
    expect(outline.join("\n")).toContain("官方解析：此題依官方題庫解析。");
    expect(getWrongQuestionPdfFilename(new Date("2026-08-21T00:00:00.000Z"))).toBe("錯題本離線複習_20260821.pdf");

    const fontBytes = await readFile("/home/ubuntu/webdev-static-assets/wrong-question-pdf-cjk.ttf");
    const pdfBytes = await buildWrongQuestionPdfBytes([sample], fontBytes.buffer.slice(fontBytes.byteOffset, fontBytes.byteOffset + fontBytes.byteLength), {
      headline: "優先複習硬體觀念",
      overallAssessment: "目前錯題集中在官方題庫的硬體範圍。",
      priorityTopics: [{ topic: "電腦硬體與組裝", evidence: "有 1 題待複習。", advice: "先讀官方解析再重做。" }],
      reviewPlan: ["重讀官方解析", "完成錯題重刷", "隔日再次複習"],
      sourceNotice: "本建議僅依官方題庫與個人錯題整理。",
    });
    expect(Array.from(pdfBytes.slice(0, 4))).toEqual([37, 80, 68, 70]);
    const document = await PDFDocument.load(pdfBytes);
    expect(document.getPageCount()).toBeGreaterThanOrEqual(1);
  }, 20000);
});
