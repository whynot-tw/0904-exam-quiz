import { describe, expect, it } from "vitest";
import { summarizeCourseProgress } from "./courseProgress";

const catalog = [
  { id: "AI-1", source: "AI", label: "AI人工智慧工具應用", enabled: true, importStatus: "imported" },
  { id: "AI-2", source: "AI", label: "AI人工智慧工具應用", enabled: true, importStatus: "imported" },
  { id: "HARDWARE-1", source: "HARDWARE", label: "電腦硬體裝修", enabled: true, importStatus: "imported" },
  { id: "HARDWARE-2", source: "HARDWARE", label: "電腦硬體裝修", enabled: true, importStatus: "imported" },
  { id: "HARDWARE-9", source: "HARDWARE", label: "電腦硬體裝修", enabled: false, importStatus: "needs_review" },
];

describe("course progress summary", () => {
  it("calculates accuracy from every answer and completion from unique practice-ready questions", () => {
    expect(summarizeCourseProgress(catalog, [
      { questionId: "AI-1", isCorrect: true },
      { questionId: "AI-1", isCorrect: false },
      { questionId: "HARDWARE-1", isCorrect: true },
      { questionId: "HARDWARE-9", isCorrect: true },
    ])).toEqual([
      { source: "AI", label: "AI人工智慧工具應用", available: 2, answered: 2, answeredQuestions: 1, correct: 1, accuracy: 50, completion: 50, lastAnsweredAt: null },
      { source: "HARDWARE", label: "電腦硬體裝修", available: 2, answered: 1, answeredQuestions: 1, correct: 1, accuracy: 100, completion: 50, lastAnsweredAt: null },
    ]);
  });

  it("shows zero completion and no accuracy before a course has any answer records", () => {
    expect(summarizeCourseProgress(catalog, []).map(progress => ({ source: progress.source, accuracy: progress.accuracy, completion: progress.completion }))).toEqual([
      { source: "AI", accuracy: null, completion: 0 },
      { source: "HARDWARE", accuracy: null, completion: 0 },
    ]);
  });

  it("reports unique answered question counts separately from answer attempts", () => {
    const summary = summarizeCourseProgress(catalog, [
      { questionId: "AI-1", isCorrect: true },
      { questionId: "AI-1", isCorrect: true },
      { questionId: "AI-2", isCorrect: false },
    ]);
    expect(summary.find(course => course.source === "AI")).toMatchObject({ answered: 3, answeredQuestions: 2 });
  });

  it("keeps the most recent answer date for each course", () => {
    const older = new Date("2026-08-01T00:00:00.000Z");
    const newer = new Date("2026-08-05T00:00:00.000Z");
    const summary = summarizeCourseProgress(catalog, [
      { questionId: "AI-1", isCorrect: true, answeredAt: older },
      { questionId: "AI-2", isCorrect: false, answeredAt: newer },
    ]);
    expect(summary.find(course => course.source === "AI")).toMatchObject({ lastAnsweredAt: newer });
  });
});
