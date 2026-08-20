import React from "react";
import { BrainCircuit } from "lucide-react";

export type WrongQuestionAiExplanationData = {
  errorReason: string;
  whyItMatters: string;
  correctThinking: string;
  reviewTip: string;
  sourceNotice: string;
};

export function WrongQuestionAiExplanation({ explanation }: { explanation: WrongQuestionAiExplanationData }) {
  return <section className="ai-explanation-card" aria-label="AI 補充解說">
    <div className="ai-explanation-heading"><BrainCircuit size={17}/><strong>AI 補充解說</strong></div>
    <p><b>錯誤原因：</b>{explanation.errorReason}</p>
    <p><b>此題關鍵：</b>{explanation.whyItMatters}</p>
    <p><b>正確思路：</b>{explanation.correctThinking}</p>
    <p><b>複習重點：</b>{explanation.reviewTip}</p>
    <small>{explanation.sourceNotice}</small>
  </section>;
}
