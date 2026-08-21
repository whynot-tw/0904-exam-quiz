import { describe, expect, it } from "vitest";
import { filterWrongQuestions, filterWrongQuestionsMissingConcise, getMostRecentWrongQuestion, getOfficialOptionPreview, getPreviousQuestionCursor, getQuestionTextSummary, getSelectedOptionForQuestion, getWrongQuestionForReplay } from "../client/src/lib/wrongQuestionBook";

describe("錯題本介面流程", () => {
  const rows = [{ questionId: "HARDWARE-1", status: "待複習" }, { questionId: "AI-1", status: "已熟悉" }];

  it("依待複習、已熟悉或全部狀態篩選個人錯題紀錄", () => {
    expect(filterWrongQuestions(rows, "待複習")).toEqual([rows[0]]);
    expect(filterWrongQuestions(rows, "已熟悉")).toEqual([rows[1]]);
    expect(filterWrongQuestions(rows, "全部")).toEqual(rows);
  });

  it("只會以錯題紀錄中的題號定位可重新作答的完整題目", () => {
    const questions = [{ id: "HARDWARE-1", text: "硬體題" }, { id: "AI-1", text: "AI 題" }];
    expect(getWrongQuestionForReplay(questions, "AI-1")).toEqual(questions[1]);
    expect(getWrongQuestionForReplay(questions, "MISSING")).toBeUndefined();
  });

  it("以個人錯題最後更新時間挑選最近一題作為續練入口", () => {
    const recent = getMostRecentWrongQuestion([{ questionId: "HARDWARE-1", updatedAt: "2026-08-20T09:00:00.000Z" }, { questionId: "AI-1", updatedAt: "2026-08-21T10:00:00.000Z" }]);
    expect(recent?.questionId).toBe("AI-1");
  });

  it("回到上一題時不會低於第一題，且能復原該題既有作答", () => {
    expect(getPreviousQuestionCursor(0)).toBe(0);
    expect(getPreviousQuestionCursor(3)).toBe(2);
    expect(getSelectedOptionForQuestion([{ questionId: "AI-1", selectedOption: "C" }, { questionId: "HARDWARE-1", selectedOption: "B" }], "AI-1")).toBe("C");
  });

  it("以不改寫官方題幹的方式產生可讀摘要", () => {
    expect(getQuestionTextSummary("  題幹\n內容  ")).toBe("題幹 內容");
    expect(getQuestionTextSummary("ABCDEFGHIJ", 6)).toBe("ABCDEF…");
    expect(getQuestionTextSummary("")).toBe("官方題幹暫時無法顯示。");
  });

  it("可只保留尚未具有精簡解析的錯題", () => {
    expect(filterWrongQuestionsMissingConcise(rows, new Set(["AI-1"]))).toEqual([rows[0]]);
  });

  it("保留官方選項原文並只標示既有官方正解", () => {
    expect(getOfficialOptionPreview({ A: "官方選項 A", B: "官方選項 B", C: "", D: "官方選項 D" }, "B", "D")).toEqual([
      { label: "A", text: "官方選項 A", isCorrect: false, isSelected: false },
      { label: "B", text: "官方選項 B", isCorrect: true, isSelected: false },
      { label: "D", text: "官方選項 D", isCorrect: false, isSelected: true },
    ]);
  });
});
