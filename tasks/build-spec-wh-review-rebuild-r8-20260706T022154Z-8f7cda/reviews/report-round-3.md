# 审查报告 — build-spec-wh-review-rebuild-r8-20260706T022154Z-8f7cda (round 3)

- verdict: revise_required
- provenance: single-context

## Summary

round 3 相比前轮已修掉目标文件归属和 OPEN-1 表述问题，但还剩 3 个阻断：`actual_mode` 落盘契约缺失、`Business Impact Scope` 不完整、AC-D1 仍与新两层契约冲突。

## Findings

- [blocking] 位置: specs/wh-review-rebuild/spec.md:390 | 问题: spec 只要求落盘/展示 `mode`，没有把 3rd-review 返回的 `actual_mode` 作为报告、状态或日志中的必达字段。decision-log 已明确要求在降级为 `same-source` 时显式标出 `actual_mode=same-source`，否则人工无法判断这轮裁决是否已失去异源性。 | 建议: 把 `actual_mode` 加入轮次状态最小字段、报告 Metadata 章节和相关验收标准；至少验证降级到同源时报告与日志都显式展示 `actual_mode`。
- [blocking] 位置: specs/wh-review-rebuild/spec.md:440 | 问题: `Business Impact Scope` 章不完整。当前表格覆盖了触发方式、pass 路径、合同路由和轮次状态，但漏掉了已批准会改变既有行为的 build-code `§7/§13` 调用语义重写这一项。按 reviewer contract，Business Impact Scope 漏列受影响既有行为不能进入 planning。 | 建议: 在 `Business Impact Scope` 中补齐 build-code `§7/§13` 调用语义变化的现状/变更后行为/影响说明，并重新检查还有没有其他已批准的既有行为变更未列入该章。
- [blocking] 位置: specs/wh-review-rebuild/spec.md:489 | 问题: AC-D1 与 FR-THIRDREVIEW-001 自相矛盾。前文已规定 `stage` 名称不得传入 3rd-review，引擎也不感知 stage；但 AC-D1 仍要求比较“去掉/加上 stage 参数”的两次调用结果。这会把非法调用重新变成验收对象，规划阶段无法据此设计正确测试，甚至可能误导实现者恢复 stage 参数支持。 | 建议: 把 AC-D1 改成只验证合法新契约：wh-review 调用 3rd-review 时不传 stage/round 字段，3rd-review 返回结果中不含 stage 枚举字段，且合同路由仅在 wh-review 层完成。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：spec 只要求落盘/展示 `mode`，没有把 3rd-review 返回的 `actual_mode` 作为报告、状态或日志中的必达字段。decision-log 已明确要求在降级为 `same-source` 时显式标出 `actual_mode=same-source`，否则人工无法判断这轮裁决是否已失去异源性。
- 必须修复：`Business Impact Scope` 章不完整。当前表格覆盖了触发方式、pass 路径、合同路由和轮次状态，但漏掉了已批准会改变既有行为的 build-code `§7/§13` 调用语义重写这一项。按 reviewer contract，Business Impact Scope 漏列受影响既有行为不能进入 planning。
- 必须修复：AC-D1 与 FR-THIRDREVIEW-001 自相矛盾。前文已规定 `stage` 名称不得传入 3rd-review，引擎也不感知 stage；但 AC-D1 仍要求比较“去掉/加上 stage 参数”的两次调用结果。这会把非法调用重新变成验收对象，规划阶段无法据此设计正确测试，甚至可能误导实现者恢复 stage 参数支持。

