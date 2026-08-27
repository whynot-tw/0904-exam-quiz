export type OfficialV2ExplanationInput = {
  correctOption?: string | null;
  explanation?: string | null;
};

export function getOfficialV2Explanation(question: OfficialV2ExplanationInput) {
  return {
    officialAnswer: question.correctOption?.trim() || "—",
    v2Explanation: question.explanation?.trim() || "官方資料未提供 V2 解析。",
  };
}
