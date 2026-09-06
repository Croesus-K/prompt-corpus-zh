#!/usr/bin/env node
/**
 * 周回流脚本（M4 · 攻 → 审 管道；治理规则 2：只走公开接口）
 *
 *   node scripts/flywheel-arena.mjs --export <file.json | https://.../api/leaderboard?format=export> [--out candidates/arena-<date>.json]
 *
 * 输入：InjectArena /api/leaderboard?format=export 的 injectarena-export@1 JSON
 * 输出：人工闸候选文件（prompt-corpus-zh/arena-candidates@1）——**不是语料**，
 *       人工闸逐条审过后才允许并入 corpus/（source:"arena" + verifiedAt）。
 *
 * 宁可少收不可收毒：源端已打码 FLAG{REDACTED}，此处再硬查一遍未打码 FLAG 与
 * 真实密钥形状，命中即丢弃该条并在摘要里计数（纵深防御）。
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const exportArg = arg("export");
if (!exportArg) {
  console.error("用法：node scripts/flywheel-arena.mjs --export <file|url> [--out candidates/arena-YYYY-MM-DD.json]");
  process.exit(1);
}

// 1. 取数：URL 走公开接口，文件用于本地演练/测试
let payload;
if (/^https?:\/\//.test(exportArg)) {
  const res = await fetch(exportArg);
  if (!res.ok) {
    console.error(`公开接口返回 ${res.status}：${exportArg}`);
    process.exit(1);
  }
  payload = await res.json();
} else {
  payload = JSON.parse(readFileSync(exportArg, "utf8"));
}
if (payload.format !== "injectarena-export@1" || !Array.isArray(payload.breaches)) {
  console.error("输入不是 injectarena-export@1 导出（请使用 /api/leaderboard?format=export）");
  process.exit(1);
}

// 2. 清洗：未打码 FLAG / 真实密钥形状的 payload 直接丢弃（宁可少收）
const RAW_FLAG = /FLAG\{(?![^}]*REDACTED)[^}]{4,}\}/;
const REAL_KEY = /(?:sk-[A-Za-z0-9_-]{16,}|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,})/;
const dropped = [];
const kept = payload.breaches.filter((b) => {
  const text = b.payloadText ?? "";
  if (RAW_FLAG.test(text)) return (dropped.push({ id: b.levelId, reason: "未打码 FLAG" }), false);
  if (REAL_KEY.test(text)) return (dropped.push({ id: b.levelId, reason: "疑似真实密钥" }), false);
  if (!text.trim()) return (dropped.push({ id: b.levelId, reason: "空 payload" }), false);
  return true;
});

// 3. 按 attackSurface 分组 → RFC-0001 v2 形状的候选条目
function detectLang(text) {
  const cjk = (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  if (cjk === 0) return "en";
  if (latin === 0) return "zh";
  return "mix";
}

const bySurface = new Map();
let seq = 0;
for (const b of kept) {
  const surface = b.attackSurface || "direct-injection";
  if (!bySurface.has(surface)) bySurface.set(surface, []);
  bySurface.get(surface).push({
    id: `ar-${String(++seq).padStart(3, "0")}`,
    lang: detectLang(b.payloadText),
    mode: "other",
    text: b.payloadText,
    source: "arena",
    verifiedAt: null,
    meta: { levelId: b.levelId, player: b.player, chars: b.chars, ts: b.ts },
  });
}

const out = {
  kind: "prompt-corpus-zh/arena-candidates@1",
  status: "pending-review",
  generatedAt: new Date().toISOString(),
  exportedFrom: exportArg,
  sourceExportAt: payload.exportedAt,
  dropped,
  entries: [...bySurface.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([surface, payloads]) => ({
    id: `arena-${surface}`,
    attackSurface: surface,
    description: `靶场真实破阵 payload 回流候选（${payloads.length} 条，人工闸待审）`,
    payloads,
  })),
};

const day = new Date().toISOString().slice(0, 10);
const outPath = arg("out") ?? join("candidates", `arena-${day}.json`);
mkdirSync(outPath.includes("/") ? outPath.slice(0, outPath.lastIndexOf("/")) : ".", { recursive: true });
writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n", "utf8");

console.log(`候选 ${kept.length} 条（丢弃 ${dropped.length}），覆盖 ${bySurface.size} 个攻击面 → ${outPath}`);
console.log("提醒：候选文件不是语料——人工闸逐条审过后才可并入 corpus/（verifiedAt 盖章）");
