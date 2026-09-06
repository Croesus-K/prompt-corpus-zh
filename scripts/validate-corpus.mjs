#!/usr/bin/env node
/**
 * 语料校验（每次改动 corpus/ 后跑）：npm run validate
 * 与 extract-seed 的约束一致 + 增查 v2 字段合法性（RFC-0001）。
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

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
const seen = new Set();
const files = readdirSync("corpus").filter((f) => f.endsWith(".json") && f !== "schema.json" && f !== "_meta.json");
let total = 0;

for (const f of files) {
  const c = JSON.parse(readFileSync(join("corpus", f), "utf8"));
  if (!SURFACES.has(c.attackSurface)) errors.push(`${f}: attackSurface 未知`);
  for (const p of c.payloads ?? []) {
    total++;
    const key = `${c.id}:${p.id}`;
    if (seen.has(key)) errors.push(`${f}/${p.id}: id 重复`);
    seen.add(key);
    if (!LANGS.has(p.lang)) errors.push(`${f}/${p.id}: lang 未知`);
    if (!MODES.has(p.mode)) errors.push(`${f}/${p.id}: mode 未知`);
    if (typeof p.text !== "string" || p.text.length === 0) errors.push(`${f}/${p.id}: text 为空`);
    if (p.source !== undefined && !["seed", "arena", "audit"].includes(p.source)) {
      errors.push(`${f}/${p.id}: source 非法（${p.source}）`);
    }
    if ((p.source === "arena" || p.source === "audit") && !/^\d{4}-\d{2}-\d{2}$/.test(p.verifiedAt ?? "")) {
      errors.push(`${f}/${p.id}: source=arena/audit 必须 verifiedAt（ISO 日期）`);
    }
    if (p.source === undefined && p.verifiedAt !== undefined) {
      errors.push(`${f}/${p.id}: 无 source 却带 verifiedAt`);
    }
    if (/(?:sk-[A-Za-z0-9_-]{16,}|ghp_[A-Za-z0-9]{30,}|AKIA[0-9A-Z]{16})/.test(p.text)) {
      errors.push(`${f}/${p.id}: 疑似真实 API key，拒绝入库（宁可少收不可收毒）`);
    }
    if (/FLAG\{(?![^}]*REDACTED)[^}]{4,}\}/.test(p.text)) {
      errors.push(`${f}/${p.id}: 未打码的 FLAG 令牌，拒绝入库`);
    }
  }
}

if (errors.length > 0) {
  console.error(`校验失败 ${errors.length} 项：`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`校验通过：${files.length} 个语料文件 / ${total} 条 payload`);
