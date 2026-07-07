# 审查报告 — build-spec-wh-review-rebuild-r7-20260706T010959Z-8d54c7 (round 3)

- verdict: revise_required
- provenance: single-context

## Summary

spec 仍未达到可进 planning 的状态。4 个阻断项还在：D4 的 C5/C6 源需求映射错误、任务目录公式未定死、轮次状态模型不足、Business Impact Scope 漏掉 D6 收尾统一变更。

## Findings

- [blocking] 位置: specs/wh-review-rebuild/spec.md:318 | 问题: `FR-INTAKE-001` 把 `decision-log` D4 的 C5/C6 写错了。上游 D4 定的是 C5“方向与上游输入一致”、C6“决策产物格式可机器消费”，当前 spec 却写成“关键假设已记录 / 非目标明确声明”。这是已声明来源的反向失真，源需求追溯不成立。 | 建议: 把 `FR-INTAKE-001` 的 C1-C6 定义逐条改回与 `tasks/wh-review-rebuild/decision-log.md` D4 完全一致，并同步检查 AC9-1、AC9-2 是否仍覆盖正确字段。
- [blocking] 位置: specs/wh-review-rebuild/spec.md:143 | 问题: 任务目录落盘公式仍未定死。spec 一边说 `parseTaskDir()` 返回 `task_tracking_root`，一边用 `ls <task-dir>/<task-id>/reviews/` 验收，但没有明确是否必须经过 `tasks/{task-id}/`，也没定死 report、route-decision、round-state 的相对路径与文件名。实现者无法得到唯一目录契约。 | 建议: 显式写出唯一目录公式：从 `parseTaskDir()` 返回值到 `tasks/{task-id}/...` 的完整相对路径，并把报告、route-decision、轮次状态的固定子目录和文件名一起定死。
- [blocking] 位置: specs/wh-review-rebuild/spec.md:383 | 问题: 轮次状态字段不足以支撑已写状态机。FR-WHREVIEW-003 要求异源最多 3 轮、再转同源、同源再独立最多 3 轮，但状态只存一个 `round_number`，没有异源轮次、同源轮次、总轮次或切换锚点字段，导致何时切同源、何时在同源第 3 轮末强制 `escalate_to_human` 都无法无歧义判定。 | 建议: 补全持久化状态契约，至少增加异源计数、同源计数、总轮次或等价可推导字段，并明确它们与 `mode`、升级人工规则、AC3-* / AC5-4 的对应关系。
- [blocking] 位置: specs/wh-review-rebuild/spec.md:433 | 问题: `Business Impact Scope` 反向覆盖不完整。`decision-log` D6 已确认“5 个 stage 收尾统一调用 `docs/human-brief-template.md`”会改变现有行为，但第 8 章只列了审查触发、pass 推进、合同路由、轮次状态，没有把收尾模板统一这一既有行为变更纳入业务影响范围。 | 建议: 把 D6 对现有收尾行为的影响补进 `Business Impact Scope`，明确哪些 stage 的收尾产物/行为会变化，以及旧收尾逻辑如何被替换。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：`FR-INTAKE-001` 把 `decision-log` D4 的 C5/C6 写错了。上游 D4 定的是 C5“方向与上游输入一致”、C6“决策产物格式可机器消费”，当前 spec 却写成“关键假设已记录 / 非目标明确声明”。这是已声明来源的反向失真，源需求追溯不成立。
- 必须修复：任务目录落盘公式仍未定死。spec 一边说 `parseTaskDir()` 返回 `task_tracking_root`，一边用 `ls <task-dir>/<task-id>/reviews/` 验收，但没有明确是否必须经过 `tasks/{task-id}/`，也没定死 report、route-decision、round-state 的相对路径与文件名。实现者无法得到唯一目录契约。
- 必须修复：轮次状态字段不足以支撑已写状态机。FR-WHREVIEW-003 要求异源最多 3 轮、再转同源、同源再独立最多 3 轮，但状态只存一个 `round_number`，没有异源轮次、同源轮次、总轮次或切换锚点字段，导致何时切同源、何时在同源第 3 轮末强制 `escalate_to_human` 都无法无歧义判定。
- 必须修复：`Business Impact Scope` 反向覆盖不完整。`decision-log` D6 已确认“5 个 stage 收尾统一调用 `docs/human-brief-template.md`”会改变现有行为，但第 8 章只列了审查触发、pass 推进、合同路由、轮次状态，没有把收尾模板统一这一既有行为变更纳入业务影响范围。

