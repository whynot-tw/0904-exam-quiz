import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const questions = JSON.parse(readFileSync(resolve(process.cwd(), "source/questions-parsed.json"), "utf8"));

// 僅依官方 PDF 已解析的題幹與選項文字判定；一題多命中或零命中時不猜測，保留待確認。
const hardwareRules = [
  { id: "windows", label: "Windows 與桌面作業系統", terms: ["windows", "windows 10", "windows 7", "windows 8", "windows xp", "windows 11", "控制台", "檔案總管", "命令提示字元", "cmd", "登錄", "工作管理員", "資源回收筒"] },
  { id: "linux", label: "Linux／Unix 作業系統", terms: ["linux", "ubuntu", "unix", "gnu", "bash", "shell", "chmod", "apt", "fedora", "debian"] },
  { id: "network", label: "網路與通訊", terms: ["tcp", "udp", "ip 位址", "ipv4", "ipv6", "router", "路由器", "網路", "wifi", "wi-fi", "ethernet", "網卡", "http", "dns", "網域"] },
  { id: "storage", label: "儲存裝置與檔案系統", terms: ["ssd", "硬碟", "磁碟", "光碟", "隨身碟", "儲存", "raid", "m.2", "sata", "ntfs", "fat32"] },
  { id: "hardware", label: "電腦硬體與組裝", terms: ["cpu", "主機板", "記憶體", "ram", "bios", "uefi", "電源供應器", "顯示卡", "散熱", "插槽", "匯流排", "週邊"] },
];

function textOf(question) {
  return [question.question_text, question.option_a, question.option_b, question.option_c, question.option_d].filter(Boolean).join(" ").toLowerCase();
}

function classify(question) {
  if (question.source_key === "AI") {
    return { subcategory: "AI 工具與生成式 AI", status: "assigned", notes: "依官方 AI人工智慧工具應用題組歸類。" };
  }
  const text = textOf(question);
  const matches = hardwareRules.filter(rule => rule.terms.some(term => text.includes(term.toLowerCase())));
  if (matches.length === 1) return { subcategory: matches[0].label, status: "assigned", notes: `官方題幹／選項明確命中：${matches[0].id}` };
  if (matches.length > 1) return { subcategory: "待確認", status: "needs_manual_review", notes: `多主題命中：${matches.map(rule => rule.id).join(", ")}` };
  return { subcategory: "待確認", status: "needs_manual_review", notes: "未命中已確認的次分類規則，保留人工判讀。" };
}

const rows = questions.map(question => ({ questionId: question.question_id, ...classify(question) }));
const summary = Object.values(Object.groupBy(rows, row => `${row.status}｜${row.subcategory}`)).map(group => ({ status: group[0].status, subcategory: group[0].subcategory, count: group.length })).sort((a, b) => b.count - a.count || a.subcategory.localeCompare(b.subcategory, "zh-TW"));
const result = { generatedAt: new Date().toISOString(), total: rows.length, summary, rows };
writeFileSync(resolve(process.cwd(), "source/subcategory-classification-manifest.json"), JSON.stringify(result, null, 2));
process.stdout.write(JSON.stringify({ total: result.total, summary }, null, 2));
