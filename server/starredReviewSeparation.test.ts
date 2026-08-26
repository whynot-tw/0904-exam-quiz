import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("星號複習與錯題本介面分離", () => {
  it("提供獨立星號頁與導覽入口，且錯題本不再渲染星號清單", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    const wrongPanel = source.slice(source.indexOf("function WrongPanel"), source.indexOf("function CsvExportControls"));
    expect(source).toContain('section === "starred"');
    expect(source).toContain('"starred", Star, "星號"');
    expect(source).toContain("function StarredPanel");
    expect(wrongPanel).not.toContain("starred-section");
    expect(wrongPanel).not.toContain("StarMetaEditor");
  });
});
