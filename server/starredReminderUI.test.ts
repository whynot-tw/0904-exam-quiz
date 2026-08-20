import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StarMetaEditor } from "../client/src/pages/Home";

describe("starred reminder editor", () => {
  it("renders tag and reminder controls for a starred question with saved data", () => {
    const markup = renderToStaticMarkup(createElement(StarMetaEditor, {
      row: { questionId: "HARDWARE-1", tag: "考前必看", reminderDate: "2026-09-04" },
      onSaveTag: () => undefined,
      onSaveReminder: () => undefined,
    }));

    expect(markup).toContain("考前必看");
    expect(markup).toContain("提醒日期");
    expect(markup).toContain("2026-09-04");
    expect(markup).toContain("儲存提醒");
  });
});
