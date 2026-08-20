import { readFileSync } from "node:fs";
import { join } from "node:path";

export type QuizQuestion = {
  question_id: string;
  source_key: string;
  source_section: string;
  source_question_no: string;
  source_page: number;
  category: string;
  subcategory: string;
  subcategory_status: string;
  subcategory_notes: string;
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

export function updateLocalQuestion(questionId: string, patch: { explanation?: string; correctOption?: string }) {
  const question = getQuizQuestions().find(q => q.question_id === questionId);
  if (!question) return false;
  if (patch.explanation !== undefined) question.explanation = patch.explanation;
  if (patch.correctOption !== undefined) question.correct_option = patch.correctOption;
  question.verified = true;
  question.import_status = "imported";
  return true;
}

export function toClientQuestion(q: QuizQuestion) {
  return {
    id: q.question_id,
    source: q.source_key,
    section: q.source_section,
    number: q.source_question_no,
    page: q.source_page,
    category: q.category,
    subcategory: q.subcategory,
    subcategoryStatus: q.subcategory_status,
    subcategoryNotes: q.subcategory_notes,
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

export function cmsQuestionToQuizQuestion(q: {
  questionId: string; sourceKey: string; sourceSection: string; sourceQuestionNo: string; sourcePage: number | null; category: string | null; subcategory: string | null; subcategoryStatus: string; subcategoryNotes: string | null;
  questionText: string; optionA: string; optionB: string; optionC: string; optionD: string; correctOption: string; explanation: string | null;
  enabled: number; requiresMedia: number; sourceRaw: string | null; sourceUrl: string | null; importStatus: string; verified: number; notes: string | null;
}): QuizQuestion {
  return {
    question_id: q.questionId,
    source_key: q.sourceKey,
    source_section: q.sourceSection,
    source_question_no: q.sourceQuestionNo,
    source_page: q.sourcePage ?? 0,
    category: q.category ?? "",
    subcategory: q.subcategory ?? "待確認",
    subcategory_status: q.subcategoryStatus ?? "pending",
    subcategory_notes: q.subcategoryNotes ?? "",
    question_text: q.questionText,
    option_a: q.optionA,
    option_b: q.optionB,
    option_c: q.optionC,
    option_d: q.optionD,
    correct_option: q.correctOption,
    explanation: q.explanation ?? "",
    enabled: q.enabled === 1,
    requires_media: q.requiresMedia === 1,
    source_raw: q.sourceRaw ?? "",
    source_url: q.sourceUrl ?? "",
    import_status: q.importStatus,
    verified: q.verified === 1,
    notes: q.notes ?? "",
  };
}
