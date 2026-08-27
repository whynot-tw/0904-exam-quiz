import { describe, expect, it } from "vitest";
import { ALL_COURSE_TYPES, excludeAnsweredQuestions, filterQuestionsByCourse, getCourseTypes, getWeakestCourse, selectSmartPracticeQuestions, sortCourseTypes } from "../client/src/lib/courseTypes";

const questions = [
  { id: "HARDWARE-1", source: "HARDWARE", category: "電腦硬體裝修" },
  { id: "HARDWARE-2", source: "HARDWARE", category: "電腦硬體裝修" },
  { id: "AI-1", source: "AI", category: "AI人工智慧工具應用" },
];

describe("course type filter", () => {
  it("derives one visible course type per CMS sourceKey using the category label", () => {
    expect(getCourseTypes(questions)).toEqual([
      { id: "AI", label: "AI人工智慧工具應用" },
      { id: "HARDWARE", label: "電腦硬體裝修" },
    ]);
  });

  it("limits the question pool to the selected course type and retains all questions for all courses", () => {
    expect(filterQuestionsByCourse(questions, "HARDWARE").map(question => question.id)).toEqual(["HARDWARE-1", "HARDWARE-2"]);
    expect(filterQuestionsByCourse(questions, ALL_COURSE_TYPES).map(question => question.id)).toEqual(["HARDWARE-1", "HARDWARE-2", "AI-1"]);
  });

  it("excludes only previously answered question ids for a practice pool", () => {
    const source = [...questions];
    expect(excludeAnsweredQuestions(source, ["HARDWARE-1", "UNKNOWN"])).toEqual([questions[1], questions[2]]);
    expect(source).toEqual(questions);
  });

  it("prioritizes untested questions and fills the requested count from the same pool when needed", () => {
    const selection = selectSmartPracticeQuestions(questions, ["HARDWARE-1"], 3);
    expect(selection.questions).toHaveLength(3);
    expect(selection.questions.slice(0, 2).map(question => question.id).sort()).toEqual(["AI-1", "HARDWARE-2"]);
    expect(selection.untestedCount).toBe(2);
    expect(selection.usedFallback).toBe(true);
  });

  it("falls back to the full course pool after every question has been tested", () => {
    const selection = selectSmartPracticeQuestions(questions, questions.map(question => question.id), 2);
    expect(selection.questions).toHaveLength(2);
    expect(selection.untestedCount).toBe(0);
    expect(selection.usedFallback).toBe(true);
  });

  it("sorts courses by lowest accuracy or completion while preserving a stable default order", () => {
    const types = getCourseTypes(questions);
    const progress = [
      { source: "AI", accuracy: 40, completion: 70 },
      { source: "HARDWARE", accuracy: 60, completion: 20 },
    ];
    expect(sortCourseTypes(types, progress, "accuracy-asc").map(type => type.id)).toEqual(["AI", "HARDWARE"]);
    expect(sortCourseTypes(types, progress, "completion-asc").map(type => type.id)).toEqual(["HARDWARE", "AI"]);
  });

  it("chooses the lowest-accuracy course with answer history as the weakest course", () => {
    expect(getWeakestCourse([
      { source: "AI", accuracy: 40, completion: 70 },
      { source: "HARDWARE", accuracy: 60, completion: 20 },
      { source: "UNANSWERED", accuracy: null, completion: 0 },
    ])).toMatchObject({ source: "AI", accuracy: 40 });
    expect(getWeakestCourse([{ source: "UNANSWERED", accuracy: null, completion: 0 }])).toBeNull();
  });
});
