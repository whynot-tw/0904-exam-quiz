import { describe, expect, it } from "vitest";
import { filterWrongQuestions, getWrongQuestionForReplay } from "../client/src/lib/wrongQuestionBook";

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
});
