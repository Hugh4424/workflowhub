# 审查报告 — build-spec-wh-review-rebuild-r8-20260706T022154Z-8f7cda (round 4)

- verdict: revise_required
- provenance: single-context

## Summary

round 4 仍有 3 个未关闭阻断：`actual_mode` 落盘契约缺失、`Business Impact Scope` 总表不完整、AC-D1 继续混入已废弃的 stage 参数调用。

## Findings

- [blocking] 位置: specs/wh-review-rebuild/spec.md:390 | 问题: 上一轮阻断项仍未关闭。decision-log 明确要求降级到同源时在报告和日志显式标出 `actual_mode=same-source`，但 spec 的轮次状态最小字段、报告 6 章元数据、AC-D10 仍只要求 `mode`/`verdict`/`report_path`，没有把 3rd-review 返回的 `actual_mode` 设为必达字段。这样进入 planning 后，人工无法从最终记录判断这一轮是否已失去异源性。 | 建议: 把 `actual_mode` 纳入轮次状态最小字段、报告 Metadata 章节和验收标准；至少补一条行为验收，验证降级为同源时报告与日志都显式展示 `actual_mode`。
- [blocking] 位置: specs/wh-review-rebuild/spec.md:444 | 问题: 上一轮阻断项仍未关闭。`Business Impact Scope` 表仍未覆盖已批准的 build-code `§7/§13` 调用语义重写。第 7.4 节描述了该变化，但第 8 章作为业务影响总表没有列入这项既有行为变更，不满足 reviewer contract 对影响范围穷尽性的要求。 | 建议: 在 `Business Impact Scope` 表中补一行，明确 build-code `§7/§13` 当前行为、变更后行为和业务影响；补完后再逐项复查是否还有其他已批准变更未进入该表。
- [blocking] 位置: specs/wh-review-rebuild/spec.md:489 | 问题: 上一轮阻断项仍未关闭。AC-D1 仍要求比较“去掉/加上 stage 参数”的两次 3rd-review 调用结果，但 FR-THIRDREVIEW-001 已明确 `stage` 名称不得传入 3rd-review，引擎也不感知 stage。把非法旧接口继续写进验收，会让 planning 阶段无法设计唯一正确测试口径，并误导实现者恢复被移除的 stage 参数支持。 | 建议: 把 AC-D1 改成只验证新合法契约：wh-review 调用 3rd-review 时不传 stage/round 字段，3rd-review 返回结果中不含 stage 枚举字段，合同路由仅发生在 wh-review 层。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：上一轮阻断项仍未关闭。decision-log 明确要求降级到同源时在报告和日志显式标出 `actual_mode=same-source`，但 spec 的轮次状态最小字段、报告 6 章元数据、AC-D10 仍只要求 `mode`/`verdict`/`report_path`，没有把 3rd-review 返回的 `actual_mode` 设为必达字段。这样进入 planning 后，人工无法从最终记录判断这一轮是否已失去异源性。
- 必须修复：上一轮阻断项仍未关闭。`Business Impact Scope` 表仍未覆盖已批准的 build-code `§7/§13` 调用语义重写。第 7.4 节描述了该变化，但第 8 章作为业务影响总表没有列入这项既有行为变更，不满足 reviewer contract 对影响范围穷尽性的要求。
- 必须修复：上一轮阻断项仍未关闭。AC-D1 仍要求比较“去掉/加上 stage 参数”的两次 3rd-review 调用结果，但 FR-THIRDREVIEW-001 已明确 `stage` 名称不得传入 3rd-review，引擎也不感知 stage。把非法旧接口继续写进验收，会让 planning 阶段无法设计唯一正确测试口径，并误导实现者恢复被移除的 stage 参数支持。

