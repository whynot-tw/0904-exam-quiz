import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const indexHtml = readFileSync(resolve(process.cwd(), "client/index.html"), "utf8");

describe("Open Graph 分享預覽 metadata", () => {
  it("提供品牌化圖片與完整的 Open Graph、Twitter 預覽欄位", () => {
    expect(indexHtml).toContain('property="og:title" content="115 電腦應用與AI工具班┃9/4筆試題庫刷題"');
    expect(indexHtml).toContain('property="og:image" content="https://sep4exam-hugchbpc.manus.space/manus-storage/sep4-exam-og_49fda5b5.png"');
    expect(indexHtml).toContain('property="og:image:width" content="1200"');
    expect(indexHtml).toContain('property="og:image:height" content="675"');
    expect(indexHtml).toContain('property="og:image:alt" content="115 電腦應用與AI工具班｜9/4筆試題庫刷題"');
    expect(indexHtml).toContain('name="twitter:card" content="summary_large_image"');
  });
});
