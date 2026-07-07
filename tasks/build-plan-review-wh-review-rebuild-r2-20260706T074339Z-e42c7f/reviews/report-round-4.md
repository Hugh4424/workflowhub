# 审查报告 — build-plan-review-wh-review-rebuild-r2-20260706T074339Z-e42c7f (round 4)

- verdict: revise_required
- provenance: single-context

## Summary

本轮仍未达到可执行/可验证标准。阻断点集中在三处：D2 人工确认 artifact 契约自相矛盾；wh-review 核心 runner 调度链没有落到具体任务/文件；round-state 最小字段集被削减，导致升级/降级与 same-source 追踪无法审计。

## Findings

- [blocking] 位置: specs/wh-review-rebuild/tasks.md:58 | 问题: D2 人工确认 artifact 契约与 spec 冲突。spec 要求该 artifact 是“人工批准后”的记录，至少含 `approved_by`、`approved_at`、`stage`、`total_round`；当前任务却在等待阶段就生成文件，并在 T023a 里按“文件存在即恢复推进”处理。 | 建议: 把等待态与批准态拆开：等待态只落 `post_review_action=await_human_confirmation`；批准后再单独写入 `human-confirmation-{stage}-{total_round}.json`，字段至少包含 `approved_by`、`approved_at`、`stage`、`total_round`；重启恢复逻辑必须在 artifact 缺失时继续停留在确认门。
- [blocking] 位置: specs/wh-review-rebuild/plan.md:172 | 问题: wh-review 核心调度入口没有落到任何具体文件或任务。spec 明确要求 wh-review 负责组装 `{mode, contract, materials}`、调用 `node <runner> --diff=<file> --output=<file>`、处理 timeout / 非零退出 / `--output` 缺失、落盘 `verdict-round-{total_round}.raw.json`、并在失败时裁决 `escalate_to_human`；当前 plan/tasks 只安排了路由记录、轮次状态、报告渲染和 stage 接入，没有给这条主执行链分配实现面。 | 建议: 新增明确的 wh-review 执行入口文件与任务，至少覆盖：runner 发现（`THIRD_REVIEW_RUNNER`）、`--diff/--output` 写入与调用、超时与失败映射、原始 verdict JSON 落盘、Delta Package 构造与 full/incremental/same-source 切换；并为 AC5-3/AC5-4/AC3-2 补独立 verify。
- [blocking] 位置: specs/wh-review-rebuild/plan.md:167 | 问题: round-state 最小字段集被缩窄，丢失 spec 明确定义的 `actual_mode`、`verdict`、`report_path`、`blocking_count`、`fingerprint_repeated`。tasks.md 对 T010/T011/T011a 也只覆盖四字段/五字段，未把这些审计必需字段纳入实现与验证。 | 建议: 把 round-state 的 Goal、Files、Tasks、Verify 全部扩展到 spec §6 的最小字段集，并为 `actual_mode=same-source`、`report_path`、`blocking_count`、`fingerprint_repeated` 增加可执行断言。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：D2 人工确认 artifact 契约与 spec 冲突。spec 要求该 artifact 是“人工批准后”的记录，至少含 `approved_by`、`approved_at`、`stage`、`total_round`；当前任务却在等待阶段就生成文件，并在 T023a 里按“文件存在即恢复推进”处理。
- 必须修复：wh-review 核心调度入口没有落到任何具体文件或任务。spec 明确要求 wh-review 负责组装 `{mode, contract, materials}`、调用 `node <runner> --diff=<file> --output=<file>`、处理 timeout / 非零退出 / `--output` 缺失、落盘 `verdict-round-{total_round}.raw.json`、并在失败时裁决 `escalate_to_human`；当前 plan/tasks 只安排了路由记录、轮次状态、报告渲染和 stage 接入，没有给这条主执行链分配实现面。
- 必须修复：round-state 最小字段集被缩窄，丢失 spec 明确定义的 `actual_mode`、`verdict`、`report_path`、`blocking_count`、`fingerprint_repeated`。tasks.md 对 T010/T011/T011a 也只覆盖四字段/五字段，未把这些审计必需字段纳入实现与验证。

