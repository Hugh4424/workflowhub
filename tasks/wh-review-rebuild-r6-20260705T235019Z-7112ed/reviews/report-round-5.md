# 审查报告 — wh-review-rebuild-r6-20260705T235019Z-7112ed (round 5)

- verdict: revise_required
- provenance: single-context

## Summary

先补齐`same-source`执行契约和所有落盘路径规范，再统一依赖与元数据口径，之后该规格才可进入可实现状态。

## Findings

- [blocking] 问题: 同源审查路径未定义执行主体与调用契约 | 建议: FR-WHREVIEW-003要求第4轮起切到`same-source`，但全文只定义了`wh-review -> 3rd-review`这条纯引擎链路，未说明同源审查由谁执行、是否仍调用`3rd-review`、reviewer来源如何切换、结果结构是否保持`{verdict, findings, actual_mode}`一致。当前数据流图也只有异源路径，没有同源分支。实现时无法判断`same-source`模式的真实执行机制，属于核心流程缺口。
- [blocking] 问题: 关键落盘路径未定死，多个验收项不可验证 | 建议: FR-WHREVIEW-001 AC1-3、FR-WHREVIEW-004 AC4-2、AC-D10都要求报告和状态文件落在“任务目录下固定子路径”且可预测，但规格没有给出唯一、稳定的路径规则，也没有定义`task-dir`/`task-id`来源。结果会直接影响报告渲染、route-decision、轮次状态、Delta Package、fresh-capture等文件的生成与验收，当前验收语句无法被稳定实现或自动化检查。
- [minor] 问题: human-brief-template依赖未闭合 | 建议: Known Gaps明确写明`docs/human-brief-template.md`是否存在尚未确认，但FR-STAGE-001和AC7-1/AC-D6把它作为5个stage统一收尾的硬依赖。建议在规格中把该文件列为前置物并定死不存在时的处理方式，否则实施阶段会临时补规则。
- [minor] 问题: route-decision与报告元数据的版本锚点口径不统一 | 建议: AC2-2允许记录`hash（或版本锚点）`，报告Metadata又要求`contract_hash`。一个地方允许二选一，另一个地方固定要求hash，后续实现和测试口径会分叉。应统一为单一必填字段，或明确版本锚点如何映射到报告字段。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：同源审查路径未定义执行主体与调用契约
- 必须修复：关键落盘路径未定死，多个验收项不可验证

