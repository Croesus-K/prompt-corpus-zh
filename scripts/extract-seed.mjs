#!/usr/bin/env node
/**
 * seed 语料抽取（M4 · 飞轮起点）：
 *   node scripts/extract-seed.mjs <InjectArena 仓库路径>
 *
 * 从 InjectArena 的 corpus/*.json 逐字复制 seed 语料（零变换——变换即漂移），
 * 按本仓库 schema 约束校验后写入 corpus/，并产出 corpus/_meta.json 溯源记录。
 * seed 条目不携带 v2 字段（RFC-0001：source 缺省即 seed）。
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const repo = resolve(process.argv[2] ?? "../InjectArena");
const corpusDir = join(repo, "corpus");
if (!existsSync(corpusDir)) {
  console.error(`找不到语料目录：${corpusDir}`);
  process.exit(1);
}

const SURFACES = new Set([
  "direct-injection", "data-exfiltration", "guarded-prompt",
  "indirect-injection", "tool-abuse", "mcp-poisoning",
]);
const LANGS = new Set(["zh", "en", "mix"]);
const MODES = new Set([
  "direct-ask", "instruction-override", "roleplay", "authority-forgery",
  "encoding", "translation", "hypothetical", "context-switch",
  "completion", "json-exfil", "emotional", "other",
]);

const errors = [];
function check(cond, msg) {
  if (!cond) errors.push(msg);
}

const files = readdirSync(corpusDir).filter((f) => f.endsWith(".json") && f !== "schema.json");
const seenIds = new Set();
const meta = { extractedFrom: null, extractedAt: new Date().toISOString(), files: {} };

for (const f of files) {
  const raw = JSON.parse(readFileSync(join(corpusDir, f), "utf8"));
  check(typeof raw.id === "string" && /^[a-z][a-z0-9-]*$/.test(raw.id), `${f}: id 不合法`);
  check(SURFACES.has(raw.attackSurface), `${f}: attackSurface 未知（${raw.attackSurface}）`);
  check(typeof raw.description === "string" && raw.description.length >= 8, `${f}: description 过短`);
  check(Array.isArray(raw.payloads) && raw.payloads.length > 0, `${f}: payloads 为空`);
  for (const p of raw.payloads ?? []) {
    check(typeof p.id === "string" && /^[a-z]{2,8}-\d{3}$/.test(p.id), `${f}/${p.id}: payload id 不合法`);
    check(!seenIds.has(`${raw.id}:${p.id}`), `${f}/${p.id}: id 重复`);
    seenIds.add(`${raw.id}:${p.id}`);
    check(LANGS.has(p.lang), `${f}/${p.id}: lang 未知（${p.lang}）`);
    check(MODES.has(p.mode), `${f}/${p.id}: mode 未知（${p.mode}）`);
    check(typeof p.text === "string" && p.text.length > 0, `${f}/${p.id}: text 为空`);
    check(p.source === undefined && p.verifiedAt === undefined, `${f}/${p.id}: seed 条目不得携带 v2 字段`);
  }
  meta.files[f] = raw.payloads.length;
}

try {
  meta.extractedFrom = `Croesus-K/InjectArena@${execFileSync("git", ["-C", repo, "rev-parse", "HEAD"], { encoding: "utf8" }).trim()}`;
} catch {
  meta.extractedFrom = "Croesus-K/InjectArena@unknown";
}

if (errors.length > 0) {
  console.error(`校验失败 ${errors.length} 项：`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

// 逐字写入（键序保持上游），零变换
for (const f of files) {
  const raw = JSON.parse(readFileSync(join(corpusDir, f), "utf8"));
  writeFileSync(join("corpus", f), JSON.stringify(raw, null, 2) + "\n", "utf8");
}
writeFileSync(join("corpus", "_meta.json"), JSON.stringify(meta, null, 2) + "\n", "utf8");

const total = Object.values(meta.files).reduce((a, b) => a + b, 0);
console.log(`已抽取 ${files.length} 个语料文件 / ${total} 条 payload（source: ${meta.extractedFrom}）`);
