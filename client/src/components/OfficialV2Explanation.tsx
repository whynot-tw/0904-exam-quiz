import { BookOpenCheck } from "lucide-react";
import { getOfficialV2Explanation, splitExplanationSections, type OfficialV2ExplanationInput } from "@/lib/explanationDisplay";

type Props = OfficialV2ExplanationInput & { compact?: boolean };

export function OfficialV2Explanation({ correctOption, explanation, compact = false }: Props) {
  const { officialAnswer, v2Explanation } = getOfficialV2Explanation({ correctOption, explanation });
  const sections = splitExplanationSections(v2Explanation);

  return (
    <section className={`official-v2-explanation ${compact ? "is-compact" : ""}`} aria-label="官方答案與 V2 解析">
      <div className="official-v2-heading"><BookOpenCheck size={16} /><strong>官方答案＋V2 解析</strong></div>
      <p className="official-v2-answer"><b>官方答案：</b>{officialAnswer}</p>
      <div className="official-v2-sections">
        {sections.map((section, index) => (
          <div className="official-v2-section" key={`${section.heading ?? "text"}-${index}`}>
            {section.heading && <h4>{section.heading}</h4>}
            <p>{section.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
