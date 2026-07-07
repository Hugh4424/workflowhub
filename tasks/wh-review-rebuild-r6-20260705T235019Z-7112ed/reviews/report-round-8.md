# 审查报告 — wh-review-rebuild-r6-20260705T235019Z-7112ed (round 8)

- verdict: revise_required
- provenance: single-context

## Summary

先统一 3rd-review 单次调用契约，再明确 pass 后推进责任与时序，最后补齐落盘路径和合同字段类型规则。

## Findings

- [blocking] 问题: 3rd-review 调用契约自相矛盾 | 建议: 规格前文把 3rd-review 定义为结构化接口 `输入 {mode, contract, materials}`、`返回 {verdict, findings, actual_mode}`（目标节、UC-6、数据流 §6），但 FR-THIRDREVIEW-001 方案A又要求 wh-review 先把合同与材料装配成“一份完整的纯文本审查包”，3rd-review 不再接收 contract/stage 语义。实现方无法据此确定真实接口形态、日志字段和测试断言。需统一为一种契约，并同步修正 UC-6、§6、AC5-3 等所有引用。
- [blocking] 问题: pass 后推进责任边界未定，D2 门与 auto-advance 不可验证 | 建议: 规格要求 make-decision/build-plan/verify-code 在 `verdict=pass` 时停在人工确认门，build-spec/build-code 自动推进到下一 stage（FR-D2-001、§7.2、AC8-1/2），但没有定义推进动作由谁执行：wh-review、stage SKILL 收尾逻辑、还是外层 orchestrator。与此同时又要求 5 个 stage 收尾统一调用 `docs/human-brief-template.md`。缺少明确时序和责任边界，导致“暂停等待人工”与“自动调用下一阶段”的行为无法稳定实现和验收。
- [minor] 问题: 报告与状态文件落盘路径只给出原则，缺少单一定址规则 | 建议: AC1-3 使用 `<task-dir>/<task-id>/reviews/`，AC4-2 只说“任务目录下固定子路径”，AC-D10 只要求状态文件存在，但没有统一规定报告文件、route-decision 文件、round state 文件的精确路径与命名规则。实现可以各不相同，后续 grep/测试脚本容易分叉。
- [minor] 问题: intake 合同字段类型约束可执行性不足 | 建议: AC9-2 要求 `decision`、`scope.in`、`scope.out`、`open_questions` “存在且值非空字符串”，但同一规格又把 `scope.in/out` 当作范围集合、`open_questions` 当作问题列表来描述。若合同采用数组或对象表达，将与“非空字符串”断言冲突。应把这些字段的允许类型和非空规则定成统一的机器契约。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：3rd-review 调用契约自相矛盾
- 必须修复：pass 后推进责任边界未定，D2 门与 auto-advance 不可验证

