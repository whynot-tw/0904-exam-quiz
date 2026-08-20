import { readFileSync } from "node:fs";
import { join } from "node:path";

export type QuizQuestion = {
  question_id: string;
  source_key: string;
  source_section: string;
  source_question_no: string;
  source_page: number;
  category: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string;
  enabled: boolean;
  requires_media: boolean;
  source_raw: string;
  source_url: string;
  import_status: string;
  verified: boolean;
  notes: string;
};

let cache: QuizQuestion[] | undefined;

export function getQuizQuestions(): QuizQuestion[] {
  if (!cache) {
    const file = join(process.cwd(), "server/data/questions-parsed.json");
    cache = JSON.parse(readFileSync(file, "utf8")) as QuizQuestion[];
  }
  return cache;
}

export function getEnabledQuestions() {
  return getQuizQuestions().filter(q => q.enabled && q.import_status === "imported");
}

export function toClientQuestion(q: QuizQuestion) {
  return {
    id: q.question_id,
    source: q.source_key,
    section: q.source_section,
    number: q.source_question_no,
    page: q.source_page,
    category: q.category,
    text: q.question_text,
    options: { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d },
    correctOption: q.correct_option,
    explanation: q.explanation,
    needsReview: q.import_status === "needs_review",
    requiresMedia: q.requires_media,
    enabled: q.enabled,
    notes: q.notes,
  };
}
