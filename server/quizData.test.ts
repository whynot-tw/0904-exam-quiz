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

  it("recovers an empty question stem only from official raw text and removes embedded explanation from an option", () => {
    const source = getQuizQuestions()[0];
    const client = toClientQuestion({ ...source, question_text: "", source_raw: "(B)10.官方題幹在這裡?(A)選項 A(B)選項 B(C)選項 C(D)選項 D 【解析】官方解析", option_d: "選項 D 【解析】官方解析" });
    expect(client.text).toBe("官方題幹在這裡?");
    expect(client.options.D).toBe("選項 D");
  });
});
