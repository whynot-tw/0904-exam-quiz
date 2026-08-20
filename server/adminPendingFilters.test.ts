import { describe, expect, it } from "vitest";
import { filterAdminPendingQuestions, getAdminPendingQuickFilterCounts } from "../client/src/lib/adminPendingFilters";

const questions = [
  { id: "HARDWARE-10", text: "Windows 的檔案總管功能", options: { A: "Windows" } },
  { id: "HARDWARE-11", text: "Linux 系統的目錄", options: { A: "/etc" } },
  { id: "HARDWARE-12", text: "TCP/IP 網路設定", options: { A: "網際網路" } },
  { id: "HARDWARE-13", text: "SSD 與主機板", options: { A: "硬碟" } },
];

describe("admin pending classification quick filters", () => {
  it("filters pending questions by Windows and Linux keywords", () => {
    expect(filterAdminPendingQuestions(questions, "", ["windows"]).map(question => question.id)).toEqual(["HARDWARE-10"]);
    expect(filterAdminPendingQuestions(questions, "", ["linux"]).map(question => question.id)).toEqual(["HARDWARE-11"]);
  });

  it("composes a quick filter with manual search text", () => {
    expect(filterAdminPendingQuestions(questions, "目錄", ["linux"]).map(question => question.id)).toEqual(["HARDWARE-11"]);
    expect(filterAdminPendingQuestions(questions, "Windows", ["linux"])).toEqual([]);
  });

  it("supports multiple selected keyword filters and returns badge counts", () => {
    expect(filterAdminPendingQuestions(questions, "", ["windows", "linux"]).map(question => question.id)).toEqual(["HARDWARE-10", "HARDWARE-11"]);
    expect(getAdminPendingQuickFilterCounts(questions)).toMatchObject({ all: 4, windows: 1, linux: 1, network: 1, hardware: 1 });
  });
});
