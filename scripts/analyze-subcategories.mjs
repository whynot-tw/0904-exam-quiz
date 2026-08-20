import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const questions = JSON.parse(readFileSync(resolve(process.cwd(), "source/questions-parsed.json"), "utf8"));

const rules = [
  { id: "windows", label: "Windows 與桌面作業系統", terms: ["windows", "windows 10", "windows 7", "windows 8", "windows xp", "windows 11", "控制台", "檔案總管", "命令提示字元", "cmd", "ntfs", "fat32", "登錄", "工作管理員", "資源回收筒"] },
  { id: "linux", label: "Linux／Unix 作業系統", terms: ["linux", "ubuntu", "unix", "gnu", "bash", "shell", "chmod", "apt", "fedora", "debian"] },
  { id: "network", label: "網路與通訊", terms: ["tcp", "udp", "ip 位址", "ipv4", "ipv6", "router", "路由器", "網路", "wifi", "wi-fi", "ethernet", "網卡", "http", "dns", "網域"] },
  { id: "storage", label: "儲存裝置與檔案系統", terms: ["ssd", "硬碟", "磁碟", "光碟", "隨身碟", "儲存", "raid", "m.2", "sata"] },
  { id: "hardware", label: "電腦硬體與組裝", terms: ["cpu", "主機板", "記憶體", "ram", "bios", "uefi", "電源供應器", "顯示卡", "散熱", "插槽", "匯流排", "週邊"] },
  { id: "ai-foundation", label: "生成式 AI 與模型基礎", terms: ["生成式", "生成型", "大語言模型", "llm", "chatgpt", "提示", "prompt", "人工智慧", "機器學習", "深度學習"] },
  { id: "ai-tools", label: "AI 工具應用與工作流程", terms: ["copilot", "gemini", "midjourney", "notion ai", "翻譯", "摘要", "圖像生成", "自動化"] },
];

function textOf(question) {
  return [question.question_text, question.option_a, question.option_b, question.option_c, question.option_d].filter(Boolean).join(" ").toLowerCase();
}

const summary = new Map(rules.map(rule => [rule.id, { id: rule.id, label: rule.label, count: 0, examples: [] }]));
const unmatched = [];
const multiMatched = [];

for (const question of questions) {
  const text = textOf(question);
  const matches = rules.filter(rule => rule.terms.some(term => text.includes(term.toLowerCase())));
  if (!matches.length) {
    unmatched.push(question.question_id);
    continue;
  }
  if (matches.length > 1) multiMatched.push({ questionId: question.question_id, matches: matches.map(rule => rule.id) });
  for (const rule of matches) {
    const entry = summary.get(rule.id);
    entry.count += 1;
    if (entry.examples.length < 5) entry.examples.push(question.question_id);
  }
}

const result = {
  input: {
    totalQuestions: questions.length,
    sourceGroups: Object.fromEntries(Object.entries(Object.groupBy(questions, question => question.source_key)).map(([key, rows]) => [key, rows.length])),
    sourceSections: Object.fromEntries(Object.entries(Object.groupBy(questions, question => `${question.source_key}｜${question.source_section}`)).map(([key, rows]) => [key, rows.length])),
  },
  ruleCounts: [...summary.values()],
  unmatchedCount: unmatched.length,
  unmatchedExamples: unmatched.slice(0, 20),
  multiMatchedCount: multiMatched.length,
  multiMatchedExamples: multiMatched.slice(0, 20),
  note: "此結果為題幹與選項文字的關鍵詞覆蓋分析；一題可命中多個候選次分類，尚未寫入 CMS。",
};

process.stdout.write(JSON.stringify(result, null, 2));
