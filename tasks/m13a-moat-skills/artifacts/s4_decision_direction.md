# M13a make-decision 护城河能力内置化 — 决策方向草案（talk#2 收敛）

> 基于 talk#1 用户答复 + split-plan Codex 异源审查 + source 路径核实

## D1 — 护城河 skill 数量：6 → 3

talk#1 把"三角度审查拆 3 个 + orchestrator"否决了。最终落地 3 个 in-repo skill：

| skill | 来源 | 改造 |
|---|---|---|
| `skills/talk-with-zhipeng/` | 搬 `multica-agenthub/packages/core/agenthub/skills/talk-with-zhipeng/SKILL.md`（已实现按影响排序问题，不自研） | core 层直接搬；adapter 层路径改成 workflowhub；删 office-hours 的 gbrain context 查询 |
| `skills/grill-with-docs/` | 搬 `~/.claude/skills/grill-with-docs/` 原版（不做 lite） | 全目录搬（含 CONTEXT-FORMAT.md / ADR-FORMAT.md） |
| `skills/intake-decision-review/`（三角度审查） | 拼装单次 3rd-review 调用 | 一个 skill 一次调用，拼装内容让 3rd-review 一次返回方向/框架/范围 3 条 findings，不调 3 次 |

被删除的旧设计：intake-direction-review / intake-framing-challenge / intake-scope-review / intake-review-orchestrator 4 个独立 skill 全部取消，合成上面 1 个。grill-with-docs-lite 取消。

## D2 — make-decision SKILL.md 引用切换

S5 盲审引用切到 `skills/intake-decision-review/`；S7 grill 引用切到 `skills/grill-with-docs/`；talk 各轮引用 `skills/talk-with-zhipeng/`。**不切则新 skill 是死文件** —— 必须同批切。

## D3 — 测试契约（用户要求断言关键字段）

不只测文件存在，要断言：
- intake-decision-review 的 3-findings 契约（恰好 3 条、带 finding_id）
- talk-with-zhipeng 关键字段（按影响排序声明）
- make-decision S5/S7 引用能被测试捕获（grep 断言引用了 in-repo 路径）

## D4 — TASK_TRACKING_ROOT env var

照 build-spec/SKILL.md 模式加入 env 表，S10 decision-log 落盘时读取。

## D5 — talk/S9 用户交互改写成大白话

S2 talk#1 / S4 talk#2 / S9 批准的提问改成高中生能懂，每个选项给推荐项 + 后果。

## 开放问题（唯一，需用户拍板）— make-decision 拆分重构是否并入本轮？

split-plan.md 的 Codex 异源审查明确：**不建议现在按方案全拆**。理由：减少的是可见文本，增加的是跨 skill 隐式契约（debate-gate 字段传递、blind-review→debate 的 finding_id 契约、stage-result 唯一性三处最危险）。Codex 建议路径：先修 7 个历史 bug + 写契约 → 只小步抽 3 个低风险组件（internal-research / external-research / blind-review）→ 不抽 debate-gate、暂缓 ledger-render。

**推荐**：M13a 只做 D1–D5（搬 3 个护城河 skill + 切引用 + 测试 + env + 大白话改写），make-decision 拆分重构另起一个 milestone（按 Codex 的 fix-bug-first 路径走）。把"搬 skill"和"拆 583 行主壳"两件高风险事分开，避免重蹈 M13 假绿覆辙。

## 验收标准（草）
- 3 个 skill 文件存在且 frontmatter 合规
- make-decision S5/S7/talk 引用指向 in-repo 路径，测试可断言
- intake-decision-review 单次调用产出恰好 3 findings
- reuse-registry 新增 3 行（去掉 ghost 绝对路径）
- 全量 npm test green
