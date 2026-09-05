# prompt-corpus-zh

> 中文提示注入攻击语料库 —— 三项目共享的语料资产层。npm 包 + HuggingFace dataset 同步；代码 MIT，数据 CC-BY 4.0。

## 这是什么

InjectArena（攻）与 prompt-audit（守）共用的中文攻击语料的**独立资产化**。目前 `chinese prompt injection` 语料几乎空白，本仓库占住这个位置：

- **一份语料，两个视角**：CI 里是「拦截率基线」的语料源，靶场里是「段位榜」的语料源——飞轮的物理载体
- **版本可锁**：每周快照 + 语义化版本；prompt-audit 锁定版本引用，回归结果可复现
- **schema 治理权独立**（方案 v2 · 治理规则 1）：schema 不归任何一项目所有，变更走 [SCHEMA-RFC.md](SCHEMA-RFC.md) 流程，三项目以 issue / RFC 提变更请求

## 内容来源

| 来源 | 说明 | 条目标记 |
|---|---|---|
| `seed` | InjectArena 初始语料（direct-injection 50 + data-exfiltration 14 + indirect-injection 20 + tool-abuse 14） | 默认 |
| `arena` | 靶场攻方榜真实破阵 payload，每周导出 → 脱敏 → 人工闸 → 入库 | `source: "arena"` + `verifiedAt` |
| `audit` | prompt-audit 扫出的真实投毒工具描述 / system prompt 话术，改写脱敏后入库 | `source: "audit"` + `verifiedAt` |

回流只走公开接口（方案 v2 · 治理规则 2）：攻 → 审走 InjectArena `/api/leaderboard` JSON 导出；审 → 攻走 prompt-audit `--export-corpus` CLI 输出。**人工闸必须保留：宁可少收，不可收毒。**

## 版本策略

- `minor`：只增条目（同攻击面、不改既有条目语义）——消费方可选升级
- `major`：修改或删除既有条目、schema breaking change——回归基线必须重立
- `patch`：纯文档 / 元数据修正，不改 payload 文本

## 路线图

- [ ] M3 前：schema v2 RFC 评审通过（[RFC-0001](docs/rfc/RFC-0001-corpus-schema-v2.md)）
- [ ] M4：从 InjectArena `corpus/*.json` 抽取 seed 语料，发布 npm 首版 + HF dataset 首版
- [ ] M4：`SCHEMA-RFC.md` 流程跑通（首个变更提案走完 review）

## License

- 代码（脚本、schema 文件）：[MIT](LICENSE-CODE)
- 语料数据（`corpus/` 下 JSON 条目）：CC-BY 4.0（发布时附 [LICENSE-DATA](LICENSE-DATA)）
