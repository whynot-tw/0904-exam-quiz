export type OfficialV2ExplanationInput = {
  correctOption?: string | null;
  explanation?: string | null;
};

export type ExplanationSection = {
  heading?: string;
  body: string;
};

export function getOfficialV2Explanation(question: OfficialV2ExplanationInput) {
  return {
    officialAnswer: question.correctOption?.trim() || "—",
    v2Explanation: question.explanation?.trim() || "官方資料未提供 V2 解析。",
  };
}

export function splitExplanationSections(explanation: string): ExplanationSection[] {
  const normalized = explanation.trim();
  if (!normalized) return [{ body: "官方資料未提供 V2 解析。" }];

  const marker = /【([^】]+)】/g;
  const matches = Array.from(normalized.matchAll(marker));
  if (!matches.length) return [{ body: normalized }];

  const sections: ExplanationSection[] = [];
  const prefix = normalized.slice(0, matches[0].index ?? 0).trim();
  if (prefix) sections.push({ body: prefix });

  matches.forEach((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? normalized.length;
    const body = normalized.slice(start, end).trim();
    if (body) sections.push({ heading: match[1].trim(), body });
  });

  return sections.length ? sections : [{ body: normalized }];
}
