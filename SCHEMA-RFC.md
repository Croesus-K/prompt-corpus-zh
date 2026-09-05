# SCHEMA-RFC —— corpus schema 治理流程

> 方案 v2 · 治理规则 1 的落地形式。corpus schema 是 InjectArena / prompt-audit / bounty-guard 三项目的共享契约；**谁改 schema 谁就是事实上的中心项目**——本流程从制度上掐断这一点。

## 规则

1. **所有权**：schema 文件归本仓库（`prompt-corpus-zh`）所有，不属于任何一个下游项目。下游项目只是 schema 的消费者与提案者。
2. **评审要求**：schema 变更必须走 RFC，且至少获得**一个非提案方项目**维护者的 review（例如 InjectArena 提的案，需要 prompt-audit 或 bounty-guard 侧的人 review）。
3. **breaking change 走 semver major**，随版本附迁移指南；消费方按锁版本节奏自行跟进，不被强制同频。
4. **回滚**：每个被接受的 RFC 必须自带回滚方案（见模板），rejected / superseded 的 RFC 文件保留存档，不删除。

## 提案模板

新建 `docs/rfc/RFC-XXXX-标题.md`，内容：

```markdown
# RFC-XXXX：<标题>

- 状态：draft | review | accepted | rejected | superseded
- 提案方：<项目/个人>
- 需要 review 的下游项目：<至少一个非提案方项目>
- 目标 semver：<minor | major>

## 背景与动机
<为什么现在改；哪个下游项目的什么诉求拉动了这次变更>

## 变更内容
<字段 / 约束的精确 diff：新增、修改、删除；给出 schema JSON 片段>

## 影响哪些下游项目
| 项目 | 影响 | 需要的配合 |
|---|---|---|

## 迁移方案
<旧数据如何变成新格式；谁来做；多久内完成>

## 回滚方案
<接受后发现问题怎么退回；版本如何标记>

## 用例
<新字段在真实数据里的样子，至少 1 条完整示例>
```

## 当前 RFC 索引

| RFC | 标题 | 状态 | 提案方 |
|---|---|---|---|
| [RFC-0001](docs/rfc/RFC-0001-corpus-schema-v2.md) | corpus schema v2：source / verifiedAt / 版本策略 | draft | prompt-audit（M0 立项方） |
