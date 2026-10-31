# 独立读者判定（P9 材料修订重读）

## 1. 三问

**1. 能。** 下一步：build-plan 作者先把本片段交主会话确认（第 151 行「未经真实确认……未确认前不改 P11 或 spec」）；确认后改 P11 的「这一 Phase 怎么验收？」七槽（第 169 行），并在 `spec.md` Appendix A 加 AC-EFFECT-001 的 P1 行（第 171-172 行）。改完在任务根跑材料门禁 `run-checks.mjs --material-root <材料根>`（第 207 行），看退出 0、`errors=0`、`ALL CHECKS PASSED`（第 208 行）。

随后等 P11 审测收口取 A；A 取不到就停、回 build-plan、记 `incomplete`（第 92-93 行）。A/B 放仓外隔离目录（第 95 行）；对 B 在 B 根跑 P11 四文件门禁：`node node_modules/vitest/vitest.mjs run` 四个 `tests/contract/*.test.mjs`（page-audit-doc-contract、acceptance-plan、n11-plan-quality、n11-acceptance-rules，第 209-210 行），看退出 0，加 `--reporter=verbose` 核具名块（第 212 行）。九个判定器见表（第 216-226 行）：ORACLE-C07-TCR 由四文件门禁整体承载；其余八个为 PAGE-AUDIT-DOC、ACCEPT-PLAN、N11-CRITERIA-LOCK、N11-WRITESET-DIFF、N11-ACCEPT-SCOPE、N11-ASSET-FIRST、N11-SKIP-VISIBLE、N11-TIER-MINIMAL，按表逐项核；B 须全绿（第 51、73、108 行）。

语义部分只能人读：判定者只读验收、R-001、A/B、门禁命令与原始输出（不含标签），写「用户应看到什么」「哪类错必须拒绝」「门禁为何区分不了」，再标 A/B（第 112-114 行）；消费者按场景用一次并记录（第 115-117 行）。

**2. 没有。** 以下是材料已裁断、不需我选边的项：
- 「门禁为何区分不了」由判定者答，设计者不再另答（第 54 行）。
- ORACLE-EFFECT-BLIND 只判答卷，不参与 B 全绿；九个 P11 判定器才要求 B 全过（第 229 行）。
- 判定者、红队、第三方、消费者名字未定，owner=主会话（第 39、124-126 行）。
- 是否需用户在场未定，owner=主会话（第 89 行）。
- 消费者字段 unknown，owner=build-plan，核不到停在字段（第 273 行）。
- 任务卡 RED/GREEN 缺口：材料选择保留、不伪造命令（第 187-190、195-196 行）；基线不适用（第 53 行）。

**3. 能。** 依据：提议确认 owner=build-plan 交主会话（第 151 行）；角色名字 owner=主会话（第 39、124-126 行）；用户在场 owner=主会话（第 89 行）；消费者 index unknown，owner=build-plan（第 273 行）；A 取不到停、回 build-plan、记 incomplete（第 92-93 行）；语义判定只能人读（第 41、121 行）。

## 2. 覆盖范围

读了：`phase-fragment.md` 全文（284 行）、`original-need.md`、`reader-instruction.md`。没读：README、旧 verdict、原件目录、`specs/`、git 历史；按指令不核路径、不跑命令。

## 3. 结论

三件都过
