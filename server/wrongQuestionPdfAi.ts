export type PdfWeaknessSummary = {
  headline: string;
  overallAssessment: string;
  priorityTopics: Array<{ topic: string; evidence: string; advice: string }>;
  reviewPlan: string[];
  sourceNotice: string;
};

type PdfWeaknessInput = {
  questionId: string;
  category: string;
  subcategory: string;
  questionText: string;
  officialAnswer: string;
  officialExplanation: string;
  selectedOption: string | null;
  wrongCount: number;
  consecutiveCorrect: number;
  status: string;
};

export function buildPdfWeaknessAnalysisMessages(questions: PdfWeaknessInput[]) {
  const topicCounts = new Map<string, number>();
  for (const question of questions) {
    const topic = question.subcategory || question.category || "待確認";
    topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
  }
  const topicProfile = Array.from(topicCounts.entries()).sort((a, b) => b[1] - a[1]).map(([topic, count]) => `${topic}：${count} 題`).join("；");
  const questionEvidence = questions.slice(0, 30).map(question => `題號：${question.questionId}
類別：${question.category || "未提供"}／${question.subcategory || "待確認"}
題幹：${question.questionText}
使用者最近作答：${question.selectedOption ?? "未提供"}
官方正解：${question.officialAnswer}
官方解析：${question.officialExplanation || "官方題庫未提供解析。"}
累計答錯：${question.wrongCount}；連續答對：${question.consecutiveCorrect}；狀態：${question.status}`).join("\n\n---\n\n");
  return [
    {
      role: "system" as const,
      content: "你是備考輔導員，只能以使用者提供的官方題庫、官方答案、官方解析與個人作答紀錄產生繁體中文複習建議。絕不可使用網路、新版軟體知識、外部事實或自行改正官方答案。不得改寫題幹、選項、官方答案或官方解析；只可歸納錯題分布、學習優先順序與可執行的複習方式。避免醫療、心理或人格判斷。",
    },
    {
      role: "user" as const,
      content: `請為使用者的錯題本撰寫 PDF 首頁「AI 弱點分析總結」。分析題數：${questions.length} 題。\n\n依官方次分類統計：${topicProfile || "尚無分類資料"}\n\n題目與官方資料：\n${questionEvidence}\n\n請輸出：一句鼓勵但務實的總結標題、整體觀察、1 至 3 個優先主題（每個均需說明資料依據及可執行建議）、3 至 5 條具體複習計畫，以及一段「資料以官方題庫為準」提示。不可聲稱官方答案錯誤。`,
    },
  ];
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string" || !value.trim()) throw new Error("PDF weakness summary is incomplete");
  return value.trim().slice(0, maxLength);
}

export function parsePdfWeaknessSummary(content: string): PdfWeaknessSummary {
  const parsed = JSON.parse(content) as Partial<PdfWeaknessSummary>;
  if (!Array.isArray(parsed.priorityTopics) || !parsed.priorityTopics.length || !Array.isArray(parsed.reviewPlan) || !parsed.reviewPlan.length) throw new Error("PDF weakness summary is incomplete");
  return {
    headline: cleanText(parsed.headline, 120),
    overallAssessment: cleanText(parsed.overallAssessment, 500),
    priorityTopics: parsed.priorityTopics.slice(0, 3).map(topic => ({ topic: cleanText(topic?.topic, 100), evidence: cleanText(topic?.evidence, 280), advice: cleanText(topic?.advice, 280) })),
    reviewPlan: parsed.reviewPlan.slice(0, 5).map(plan => cleanText(plan, 220)),
    sourceNotice: cleanText(parsed.sourceNotice, 220),
  };
}
