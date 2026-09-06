---
language:
- zh
- en
license: cc-by-4.0
task_categories:
- text-classification
tags:
- security
- prompt-injection
- llm
- chinese
size_categories:
- n<1K
configs:
- config_name: default
  data_files:
    - split: direct_injection
      path: data/direct-injection.json
    - split: data_exfiltration
      path: data/data-exfiltration.json
    - split: indirect_injection
      path: data/indirect-injection.json
    - split: tool_abuse
      path: data/tool-abuse.json
    - split: mcp_abuse
      path: data/mcp-abuse.json
---

# prompt-corpus-zh · 中文提示注入攻击语料库

InjectArena / prompt-audit 共享的中文（含中英混合）提示注入攻击语料，按攻击面分 split。

| split | attackSurface | 条数 |
|---|---|---|
| direct_injection | direct-injection | 50 |
| data_exfiltration | data-exfiltration | 15 |
| indirect_injection | indirect-injection | 20 |
| tool_abuse | tool-abuse | 15 |
| mcp_abuse | mcp-poisoning | 16 |

## 字段

- `id`：payload 标识（如 `di-001`）
- `lang`：`zh` / `en` / `mix`
- `mode`：攻击模式（direct-ask / instruction-override / roleplay / authority-forgery / encoding / …）
- `text`：payload 文本
- `source`（可选）：`seed`（初始语料）/ `arena`（靶场真实破阵回流）/ `audit`（审计发现回流）
- `verifiedAt`（可选）：回流条目通过人工闸的日期

## 声明

- 攻击语料仅用于**防御研究与安全评测**（红队语料 / 门禁回归）。数据以 CC-BY-4.0 发布；使用请署名「prompt-corpus-zh 项目」。
- 语料治理见 GitHub 仓库 [SCHEMA-RFC.md](https://github.com/Croesus-K/prompt-corpus-zh/blob/main/SCHEMA-RFC.md)。
