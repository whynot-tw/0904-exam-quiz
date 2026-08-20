import { getQuizQuestions, QuizQuestion } from "./quizData";

const endpoint = () => process.env.GOOGLE_SHEET_API_URL;

export async function fetchSheetBootstrap() {
  const url = endpoint();
  if (!url) return null;
  const response = await fetch(`${url}?action=bootstrap`, { headers: process.env.GOOGLE_SHEET_API_TOKEN ? { Authorization: `Bearer ${process.env.GOOGLE_SHEET_API_TOKEN}` } : undefined });
  if (!response.ok) throw new Error(`Google Sheet bootstrap failed: ${response.status}`);
  return await response.json() as { settings?: unknown; questions?: QuizQuestion[]; wrongQuestions?: unknown[]; attempts?: unknown[] };
}

export async function postSheetAttempt(payload: unknown) {
  const url = endpoint();
  if (!url) return null;
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (process.env.GOOGLE_SHEET_API_TOKEN) headers.Authorization = `Bearer ${process.env.GOOGLE_SHEET_API_TOKEN}`;
  const response = await fetch(url, { method: "POST", headers, body: JSON.stringify({ action: "completeAttempt", ...(payload as Record<string, unknown>) }) });
  if (!response.ok) throw new Error(`Google Sheet attempt write failed: ${response.status}`);
  return await response.json();
}

export async function updateSheetQuestion(questionId: string, patch: { explanation?: string; correctOption?: string }) {
  const url = endpoint();
  if (!url) return null;
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (process.env.GOOGLE_SHEET_API_TOKEN) headers.Authorization = `Bearer ${process.env.GOOGLE_SHEET_API_TOKEN}`;
  const response = await fetch(url, { method: "POST", headers, body: JSON.stringify({ action: "updateQuestion", question_id: questionId, ...patch }) });
  if (!response.ok) throw new Error(`Google Sheet question update failed: ${response.status}`);
  return await response.json();
}

export function fallbackQuestionCount() { return getQuizQuestions().length; }
