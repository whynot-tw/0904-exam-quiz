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
  media_url: string;
  source_raw: string;
  source_url: string;
  import_status: string;
  verified: boolean;
  notes: string;
};

let cache: QuizQuestion[] | undefined;

function recoverQuestionText(question: QuizQuestion) {
  if (question.question_text.trim()) return question.question_text;
  const raw = question.source_raw ?? "";
  const firstOption = raw.indexOf("(A)", 4);
  if (firstOption <= 0) return "";
  return raw.slice(0, firstOption).replace(/^\([A-D]\)\d+\./, "").trim();
}

function stripEmbeddedExplanation(option: string) {
  return option.replace(/\s*【解析】[\s\S]*$/, "").trim();
}

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
    text: recoverQuestionText(q),
    options: { A: stripEmbeddedExplanation(q.option_a), B: stripEmbeddedExplanation(q.option_b), C: stripEmbeddedExplanation(q.option_c), D: stripEmbeddedExplanation(q.option_d) },
    correctOption: q.correct_option,
    explanation: q.explanation,
    needsReview: q.import_status === "needs_review",
    requires_media: q.requires_media,
    requiresMedia: q.requires_media,
    media_url: q.media_url,
    mediaUrl: q.media_url,
    enabled: q.enabled,
    notes: q.notes,
  };
}

export function cmsQuestionToQuizQuestion(q: {
  questionId: string; sourceKey: string; sourceSection: string; sourceQuestionNo: string; sourcePage: number | null; category: string | null; subcategory: string | null; subcategoryStatus: string; subcategoryNotes: string | null;
  questionText: string; optionA: string; optionB: string; optionC: string; optionD: string; correctOption: string; explanation: string | null;
  enabled: number; requiresMedia: number; mediaUrl: string | null; sourceRaw: string | null; sourceUrl: string | null; importStatus: string; verified: number; notes: string | null;
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
    media_url: q.mediaUrl ?? "",
    source_raw: q.sourceRaw ?? "",
    source_url: q.sourceUrl ?? "",
    import_status: q.importStatus,
    verified: q.verified === 1,
    notes: q.notes ?? "",
  };
}
