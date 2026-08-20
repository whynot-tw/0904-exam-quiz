import { describe, expect, it } from "vitest";
import { getEnabledQuestions, getQuizQuestions, toClientQuestion } from "./quizData";

describe("quiz data rules", () => {
  it("keeps needs_review questions out of the enabled practice pool", () => {
    const all = getQuizQuestions();
    const enabled = getEnabledQuestions();
    expect(all.length).toBeGreaterThan(enabled.length);
    expect(enabled.every(question => question.enabled && question.import_status === "imported")).toBe(true);
  });

  it("exposes the official answer and review badge without rewriting the source text", () => {
    const question = getQuizQuestions()[0];
    const client = toClientQuestion(question);
    expect(client.id).toBe(question.question_id);
    expect(client.correctOption).toBe(question.correct_option);
    expect(client.text).toBe(question.question_text);
    expect(client).toHaveProperty("needsReview");
  });
});
