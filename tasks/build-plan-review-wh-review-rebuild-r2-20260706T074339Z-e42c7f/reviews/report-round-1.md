# 审查报告 — build-plan-review-wh-review-rebuild-r2-20260706T074339Z-e42c7f (round 1)

- verdict: revise_required
- provenance: single-context

## Summary

第 1 轮发现 5 个阻断项：缺核心 runner 执行任务、轮次状态契约不全、人工确认 artifact 与 spec 冲突、关键验证命令不可执行、报告渲染缺客观验收闭环。

## Findings

- [blocking] 位置: specs/wh-review-rebuild/tasks.md:62 | 问题: FR-THIRDREVIEW-001 的核心执行链没有落成可执行任务。Stage 2 只安排了 3rd-review `SKILL.md` 精简、循环删除、threatAuditor 加固，但没有任何 workflowhub 侧任务实现 canonical runner 调用 `node <runner> --diff=<file> --output=<file>`、超时控制、结果 JSON 解析，或把 `runner` 不存在/非零退出/`--output` 缺失映射为 `escalate_to_human`。这条链路是 spec 里 wh-review 的主职责，不是文档整理。 | 建议: 新增明确任务和验收：在 `skills/wh-review/scripts/` 落一个实际调用 3rd-review runner 的实现，覆盖 `THIRD_REVIEW_RUNNER` 发现、`--diff/--output` 文件约定、timeout、结果 schema 解析、缺失结果时裁决 `escalate_to_human`，并给出可运行 gate_cmd。
- [blocking] 位置: specs/wh-review-rebuild/tasks.md:55 | 问题: 轮次状态任务没有覆盖 spec 的完整状态契约。T010/T011/T011a 只规划了 `heterologous_round`、`same_source_round`、`total_round`、`mode`、`post_review_action`，但 spec 要求轮次状态最小集还包含 `actual_mode`、`verdict`、`report_path`、`blocking_count`、`fingerprint_repeated`，且 AC-D10.1 还要求同源降级时显式记录 `actual_mode=same-source`。按当前任务执行，关键状态不可追踪，升级/恢复/报告回溯都无法机器审计。 | 建议: 补一条专门任务或扩展 T010/T011：把 spec 规定的全部状态字段和同源切换记录纳入实现与验证；同时在 Verify 中增加对 `actual_mode`、`verdict`、`report_path`、`blocking_count`、`fingerprint_repeated`、AC-D10.1 的独立断言。
- [blocking] 位置: specs/wh-review-rebuild/tasks.md:58 | 问题: T011b 把 `human-confirmation-{stage}-{total_round}.json` 设计成“进入等待态时就生成”的等待记录，字段为 `stage/total_round/verdict/awaiting_since`。这与 spec 的人工批准契约正面冲突：该 artifact 应在 human orchestrator 明确批准后落盘，且至少包含 `approved_by`、`approved_at`、`stage`、`total_round`。如果按当前任务执行，orchestrator 会把“待确认记录”误当成“已批准证据”，D2 门恢复逻辑失真。 | 建议: 把等待态与批准态拆开。保留等待信息到 round-state 或单独 pending 记录；`human-confirmation-*.json` 只用于批准后落盘，字段严格对齐 spec，并据此重写 AC8-4 的验证。
- [blocking] 位置: specs/wh-review-rebuild/tasks.md:83 | 问题: 多条关键 gate_cmd 不是可执行真命令，违反可验证性要求。例子包括未解析占位符 `<3rd-review repo>`、`<base>..<head>`，以及未证明存在的 `--test-fixture` flag。这些命令无法在实现阶段直接作为 pass/fail 依据，关键 FR 会落成“看起来有 Verify，实际跑不起来”的假绿。 | 建议: 把所有占位符替换成确定路径/命令；对 cross-repo 校验给出仓库根变量或固定绝对路径来源；删除未证实的 CLI flag，或补充该 CLI 签名锚点与真实 help 来源。必要时拆成 `gate_cmd` 和 `display_cmd`，保证 gate_cmd 可直接运行并保留真实退出码。
- [blocking] 位置: specs/wh-review-rebuild/plan.md:188 | 问题: FR-WHREVIEW-004 的验证链断了。Phase 2 明明声明要实现报告渲染与 `report-index.md`，但 Verify 表没有任何 gate 覆盖报告 6 章结构、章节顺序、Metadata 最小字段、报告命名正则、`report-index.md` 追加行为或固定落盘路径规则。任务有 T012-T014，验收却没有对应客观检查，导致 FR→task→verify 闭环缺失。 | 建议: 在 Phase 2/Stage 2 补专门 Verify：检查报告文件名正则、6 章标题及顺序、每章最小字段、`report-index.md` 追加一行不覆盖历史、报告路径固定落在 `tasks/{task-id}/reports/`。最好配套 `render-review-report.test.mjs` 并在 gate_cmd 中直接运行。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：FR-THIRDREVIEW-001 的核心执行链没有落成可执行任务。Stage 2 只安排了 3rd-review `SKILL.md` 精简、循环删除、threatAuditor 加固，但没有任何 workflowhub 侧任务实现 canonical runner 调用 `node <runner> --diff=<file> --output=<file>`、超时控制、结果 JSON 解析，或把 `runner` 不存在/非零退出/`--output` 缺失映射为 `escalate_to_human`。这条链路是 spec 里 wh-review 的主职责，不是文档整理。
- 必须修复：轮次状态任务没有覆盖 spec 的完整状态契约。T010/T011/T011a 只规划了 `heterologous_round`、`same_source_round`、`total_round`、`mode`、`post_review_action`，但 spec 要求轮次状态最小集还包含 `actual_mode`、`verdict`、`report_path`、`blocking_count`、`fingerprint_repeated`，且 AC-D10.1 还要求同源降级时显式记录 `actual_mode=same-source`。按当前任务执行，关键状态不可追踪，升级/恢复/报告回溯都无法机器审计。
- 必须修复：T011b 把 `human-confirmation-{stage}-{total_round}.json` 设计成“进入等待态时就生成”的等待记录，字段为 `stage/total_round/verdict/awaiting_since`。这与 spec 的人工批准契约正面冲突：该 artifact 应在 human orchestrator 明确批准后落盘，且至少包含 `approved_by`、`approved_at`、`stage`、`total_round`。如果按当前任务执行，orchestrator 会把“待确认记录”误当成“已批准证据”，D2 门恢复逻辑失真。
- 必须修复：多条关键 gate_cmd 不是可执行真命令，违反可验证性要求。例子包括未解析占位符 `<3rd-review repo>`、`<base>..<head>`，以及未证明存在的 `--test-fixture` flag。这些命令无法在实现阶段直接作为 pass/fail 依据，关键 FR 会落成“看起来有 Verify，实际跑不起来”的假绿。
- 必须修复：FR-WHREVIEW-004 的验证链断了。Phase 2 明明声明要实现报告渲染与 `report-index.md`，但 Verify 表没有任何 gate 覆盖报告 6 章结构、章节顺序、Metadata 最小字段、报告命名正则、`report-index.md` 追加行为或固定落盘路径规则。任务有 T012-T014，验收却没有对应客观检查，导致 FR→task→verify 闭环缺失。

