import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("作答頁單一渲染", () => {
  it("只保留一個測驗區段與一個 QuizRunner 實例，避免平板重複顯示", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(source.match(/\{section === "quiz" &&/g)).toHaveLength(1);
    expect(source.match(/<QuizRunner current=\{current\}/g)).toHaveLength(1);
  });
});
