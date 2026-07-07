# 审查报告 — build-spec-wh-review-rebuild-r7-20260706T010959Z-8d54c7 (round 2)

- verdict: revise_required
- provenance: single-context

## Summary

本轮主要问题还在源需求映射和可执行契约层：先对齐 D4 的 C5/C6，定死任务目录公式，补足轮次状态字段，再补全 Business Impact Scope 对 D6 的反向覆盖。

## Findings

- [blocking] 位置: specs/wh-review-rebuild/spec.md:318 | 问题: FR-INTAKE-001 声称“来源 decision-log D4”，但 C5/C6 被写成“关键假设已记录 / 非目标明确声明”。上游 `tasks/wh-review-rebuild/decision-log.md` 的 D4 实际定案是 C5“方向与上游输入一致”、C6“决策产物格式可机器消费”。这是已声明来源的反向失真，属于源需求不实映射。 | 建议: 把 FR-INTAKE-001 的 C1-C6 定义逐条改回与 decision-log D4 完全一致，再同步核对 AC9-1/AC9-2 文案。
- [blocking] 位置: specs/wh-review-rebuild/spec.md:143 | 问题: 任务落盘路径契约仍未定死。规格一边说 `parseTaskDir()` 解析的是 `task_tracking_root`，一边在 AC1-3 用 `ls <task-dir>/<task-id>/reviews/` 验证，却没有明确是否必须经过 `tasks/{task-id}/` 层级，也没有给出 report、route-decision、round state 的统一相对路径。结果是 AC1-3、AC2-2、AC3-1、AC4-2、AC-D4、AC-D10 无法按同一目录规则实现和验收。 | 建议: 在 spec 里显式给出唯一目录公式：从 `parseTaskDir()` 返回值到 `tasks/{task-id}/...` 的完整相对路径，并把 report、route-decision、round state 的文件名/子目录一起定死。
- [blocking] 位置: specs/wh-review-rebuild/spec.md:383 | 问题: 轮次状态模型不足以支撑已写入的状态机。FR-WHREVIEW-003 要求“异源最多 3 轮后转同源”“同源最多 3 轮且独立计数”，但 §6 只保留单一 `round_number`，没有任何字段表达异源轮次、同源轮次、总轮次或当前阶段切换锚点。按现规格实现后，何时切同源、何时在同源第 3 轮末强制升级人工都不可无歧义判定，AC3-* 和 AC5-4 也无法稳定验证。 | 建议: 补全持久化状态契约，至少明确异源计数、同源计数、总轮次或等价可推导字段，并说明它们与 `mode`/裁决规则的对应关系。
- [blocking] 位置: specs/wh-review-rebuild/spec.md:433 | 问题: `Business Impact Scope` 反向覆盖不完整。上游 decision-log 的 D6 已明确“5 个 stage 收尾统一调用 `docs/human-brief-template.md`”，这是对现有行为的变更；但第 8 章只列了审查触发、pass 推进、合同路由、轮次状态，没把收尾模板统一这一既有行为变更纳入影响范围。按 reviewer contract 的反向校验，这类遗漏属于 business impact scope 低估。 | 建议: 把 D6 对现有收尾行为的影响补进 `Business Impact Scope`，明确哪些 stage 收尾产物/行为会变化，以及旧收尾逻辑如何被替换。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：FR-INTAKE-001 声称“来源 decision-log D4”，但 C5/C6 被写成“关键假设已记录 / 非目标明确声明”。上游 `tasks/wh-review-rebuild/decision-log.md` 的 D4 实际定案是 C5“方向与上游输入一致”、C6“决策产物格式可机器消费”。这是已声明来源的反向失真，属于源需求不实映射。
- 必须修复：任务落盘路径契约仍未定死。规格一边说 `parseTaskDir()` 解析的是 `task_tracking_root`，一边在 AC1-3 用 `ls <task-dir>/<task-id>/reviews/` 验证，却没有明确是否必须经过 `tasks/{task-id}/` 层级，也没有给出 report、route-decision、round state 的统一相对路径。结果是 AC1-3、AC2-2、AC3-1、AC4-2、AC-D4、AC-D10 无法按同一目录规则实现和验收。
- 必须修复：轮次状态模型不足以支撑已写入的状态机。FR-WHREVIEW-003 要求“异源最多 3 轮后转同源”“同源最多 3 轮且独立计数”，但 §6 只保留单一 `round_number`，没有任何字段表达异源轮次、同源轮次、总轮次或当前阶段切换锚点。按现规格实现后，何时切同源、何时在同源第 3 轮末强制升级人工都不可无歧义判定，AC3-* 和 AC5-4 也无法稳定验证。
- 必须修复：`Business Impact Scope` 反向覆盖不完整。上游 decision-log 的 D6 已明确“5 个 stage 收尾统一调用 `docs/human-brief-template.md`”，这是对现有行为的变更；但第 8 章只列了审查触发、pass 推进、合同路由、轮次状态，没把收尾模板统一这一既有行为变更纳入影响范围。按 reviewer contract 的反向校验，这类遗漏属于 business impact scope 低估。

