# 审查报告 — build-spec-wh-review-rebuild-20260705T160512Z-766077 (round 27)

- verdict: revise_required
- provenance: single-context

## Summary

先补齐 3rd-review 接口基线、轮次状态机优先级、blocking 阈值三项硬规则，再进入实现。

## Findings

- [blocking] 问题: 3rd-review 输入契约与现状不一致但缺少收敛要求 | 建议: 规格把 `3rd-review` 定义为输入 `{mode, contract, materials}`、输出 `{verdict, findings, actual_mode}`，但 `OPEN-1` 明确写了 standalone.sh 的实际参数与 SKILL.md 描述不一致，且只要求 build-plan 阶段建 tracking issue。这个接口差异正处在本期核心路径上，如果不把“以哪个接口为准、何时完成对齐、谁负责改调用方”写成验收项，实施时无法判定 FR-THIRDREVIEW-001 是否完成。
- [blocking] 问题: 审查升级规则存在冲突且缺少可执行优先级 | 建议: FR-WHREVIEW-003 同时规定“异源最多3轮；第4轮起强制转同源”和“连续3轮 blocking 或指纹重复 blocking → 升级人工”。Known Gaps 也承认第4轮规则与连续3轮 blocking 可能同时触发，但仍标为“不阻断”。这不是边角问题，而是核心状态机冲突；如果不先定义优先级和终止条件，轮次状态、自动推进、报告裁决都无法稳定实现和验收。
- [blocking] 问题: “大量 blocking”阈值未定义，导致升级人工不可验证 | 建议: 升级人工条件写成“连续3轮出现大量 blocking”，但 GAP-4 仅说后续再补数值。没有明确阈值、统计口径、按轮还是累计计算、是否只看 blocking severity，就无法实现 AC3-3，也无法判断 `escalate_to_human` 是正确还是误触发。
- [minor] 问题: stage 专属合同数量表述前后不一致 | 建议: 问题陈述写 workflowhub 中“11 份 stage 专属合同从未被使用”，而本期 In-scope 又写“搬迁 5 套 stage 专属合同”，未说明 11 与 5 的关系、筛选原则、剩余 6 份如何处理。建议补一句来源清单和本期只迁哪 5 份，避免实施时误搬或漏搬。
- [minor] 问题: 报告 6 章结构要求不完整 | 建议: 多个验收项要求 render-review-report.mjs 输出“6章结构”，但 Known Gaps 说明 6 章名称尚未核实。当前 AC4-3 只能检查“有 6 章”，不能检查“章名和语义正确”，验收力度偏弱。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：3rd-review 输入契约与现状不一致但缺少收敛要求
- 必须修复：审查升级规则存在冲突且缺少可执行优先级
- 必须修复：“大量 blocking”阈值未定义，导致升级人工不可验证

