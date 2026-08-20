import { describe, expect, it } from "vitest";
import { SITE_DISPLAY_NAME, SITE_MAIN_TITLE, SITE_SUBTITLE } from "../client/src/lib/siteIdentity";

describe("網站識別", () => {
  it("以使用者指定的主標、副標與分隔符號產生網站名稱", () => {
    expect(SITE_MAIN_TITLE).toBe("115 電腦應用與AI工具班");
    expect(SITE_SUBTITLE).toBe("9/4筆試題庫刷題");
    expect(SITE_DISPLAY_NAME).toBe("115 電腦應用與AI工具班┃9/4筆試題庫刷題");
  });
});
