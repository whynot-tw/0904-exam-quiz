import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { WrongQuestionAiExplanation } from "../client/src/components/WrongQuestionAiExplanation";

describe("AI 錯題解析介面", () => {
  it("在成功取得資料後顯示錯誤原因、正確思路、複習重點與官方資料提示", () => {
    const html = renderToStaticMarkup(createElement(WrongQuestionAiExplanation, { explanation: { errorReason: "選項與官方正解不同", whyItMatters: "辨識題幹條件", correctThinking: "依官方解析比對選項", reviewTip: "整理關鍵字", sourceNotice: "本補充以官方題庫為準。" } }));
    expect(html).toContain("錯誤原因：");
    expect(html).toContain("正確思路：");
    expect(html).toContain("複習重點：");
    expect(html).toContain("本補充以官方題庫為準。");
  });
});
