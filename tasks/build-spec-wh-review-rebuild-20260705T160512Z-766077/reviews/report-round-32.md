# 审查报告 — build-spec-wh-review-rebuild-20260705T160512Z-766077 (round 32)

- verdict: revise_required
- provenance: single-context

## Summary

先补齐 wh-review 状态机阈值/优先级和 6 章报告合同，再实现；D2 的挂起语义一并写死。

## Findings

- [blocking] 问题: 审查状态机缺少确定性规则 | 建议: FR-WHREVIEW-003 同时规定“第4轮起强制转同源”和“连续3轮 blocking 或指纹重复 blocking→升级人工”，但 GAP-4/GAP-5 又承认“大量 blocking”阈值未定义、规则优先级未定义。这个缺口直接影响 wh-review 的裁决状态机，无法唯一实现 AC3-3、AC-D10，也无法稳定复现 round 3/4 的行为。
- [blocking] 问题: 报告合同未完整定义却被写入验收标准 | 建议: FR-WHREVIEW-004 / AC4-3 要求报告必须是“6章结构”且结构名称在 SKILL.md 中明确定义，但 Known Gaps 明确写明 6 章名称尚未核实。当前验收标准依赖一个未定合同，render-review-report.mjs 的迁移与验收都缺少可判定基线。
- [minor] 问题: D2 人工确认门的输出语义不够清晰 | 建议: 规格要求 make-decision / build-plan / verify-code 在 pass 路径触发人工确认且不得自动推进，但最终裁决枚举只有 pass / revise_required / escalate_to_human。需要明确“pass 但待人工批准”是通过 stage 层挂起实现，还是需要额外状态字段；否则调用方容易把 pass 误当作可直接推进。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：审查状态机缺少确定性规则
- 必须修复：报告合同未完整定义却被写入验收标准

