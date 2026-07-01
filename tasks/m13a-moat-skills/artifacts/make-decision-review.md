# M13a 护城河能力内置化 — S5 盲审（异源/Codex 跨引擎审查）

**Review engine**: codex (heterologous, via omc-ask advisor)
**Host detected**: claude-code
**trueCrossEngine**: true
**Round**: 1
**Input**: tasks/m13a-moat-skills/artifacts/s4_decision_direction.md
**Raw output**: /tmp/m13a-hetero-review-raw.json

---

## direction_divergence

**false** — Codex 同意 M13a 只做 D1–D5、暂缓 make-decision 大拆分的方向。但关键契约不够硬，需修订后再进实现。

---

## Findings（恰好 3 条，覆盖方向/框架/范围三角）

### F1 — 方向合理性 (direction)

| 字段 | 值 |
|---|---|
| finding_id | F1-direction |
| severity | blocking |
| summary | intake-decision-review 契约只写"恰好 3 条、带 finding_id"，未规定 3 条必须分别覆盖 direction/framing/scope，也未规定失败时行为。实现时极易只满足数量断言，漏掉三角度审查本质。 |
| recommendation | 把契约写成结构化要求：必须返回且仅返回 direction/framing/scope 三类 findings，每条含 finding_id、severity、issue、recommendation；缺任一类、重复类别、解析失败、3rd-review 失败都必须硬失败并报明确错误。 |
| evidence | s4_decision_direction.md §D3："intake-decision-review 的 3-findings 契约（恰好 3 条、带 finding_id）"——仅数量约束，无结构约束。 |

### F2 — 框架/前提 (framing)

| 字段 | 值 |
|---|---|
| finding_id | F2-framing |
| severity | non_blocking |
| summary | talk-with-zhipeng 计划"core 层直接搬；删 office-hours 的 gbrain context 查询"，但未明确要断言移除所有宿主依赖（multica-agenthub、~/.claude、gbrain、CLAUDE_*），搬入后可能仍有隐性宿主耦合。 |
| recommendation | 新增验收项：搬入后的 skill 不得依赖 multica-agenthub、~/.claude、gbrain、CLAUDE_* 专属能力；必须能在 workflowhub 内独立调用。用 grep 或快照测试覆盖这些禁用引用。 |
| evidence | s4_decision_direction.md D1 表格第一行：仅说"删 office-hours 的 gbrain context 查询"，无系统性宿主依赖清除断言。 |

### F3 — 范围边界 (scope)

| 字段 | 值 |
|---|---|
| finding_id | F3-scope |
| severity | non_blocking |
| summary | grill-with-docs 选"全目录搬"，但验收只检查 skill 文件和 frontmatter，未检查 CONTEXT-FORMAT.md / ADR-FORMAT.md 等被引用文件是否随包存在、引用路径是否改成仓库相对路径。 |
| recommendation | 验收标准加入引用完整性检查：解析 SKILL.md 中的相对引用，确认目标文件存在；禁止保留 ~/.claude 等本机绝对路径。 |
| evidence | s4_decision_direction.md D1 表格第二行 + 验收标准"frontmatter 合规"——无引用完整性断言。 |

---

## 附加 Codex findings（完整原文，非 3-angle 规范格式）

Codex 共产出 6 条 findings（含上述 3 条及以下补充）：

- **F4** (major): TASK_TRACKING_ROOT 未定义未设置/空值/不可写路径时的行为，容易复发落盘语义不一致。建议补充 env 契约（默认值、路径解析规则、不可写时 let it crash、测试覆盖）。
- **F5** (major): reuse-registry 只要求"新增 3 行（去掉 ghost 绝对路径）"，未要求删除已取消的 4 个旧设计项，易造成 agent 误用旧路线。建议明确 registry 最终状态。
- **F6** (minor): 验收标准"frontmatter 合规"无指向具体规范，不同 agent 可能只查 YAML 存在。建议引用 constitution-checklist 或列出必须字段。

---

## 结论

- **direction_divergence**: false（Codex 同意方向）
- **blocking findings**: 1（F1-direction — intake-decision-review 契约结构缺失）
- **non_blocking findings**: 2（F2-framing、F3-scope）
- **建议**: F1 须修订后再进实现；F2/F3 可在 build-code 阶段同步补。

---

*生成时间: 2026-06-30*
*Runner: /Users/Hugh/Hugh/Project/3rd-review/scripts/run-heterologous-review.mjs*
*Raw verdict: /tmp/m13a-hetero-review-raw.json*
