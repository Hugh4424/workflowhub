# 审查报告 — build-spec-wh-review-rebuild-20260705T160512Z-766077 (round 20)

- verdict: revise_required
- provenance: single-context

## Summary

先补齐 3rd-review 唯一接口合同、升级人工判定阈值/优先级、报告结构与落盘路径，再进入实现。

## Findings

- [blocking] 问题: 3rd-review 对外接口没有唯一真源 | 建议: 规格要求 3rd-review 精简为纯引擎并接受/返回 `{mode, contract, materials}` / `{verdict, findings, actual_mode}`，但同一文档又明确 `standalone.sh` 的实际参数和返回结构与 SKILL.md 描述不一致（OPEN-1）。当前没有定义哪个为最终合同，也没有要求在本期内先对齐或废弃旧入口，导致 wh-review 无法据此稳定调用，也无法做机器验收。
- [blocking] 问题: 升级人工规则不可判定 | 建议: FR-WHREVIEW-003 依赖“连续3轮出现大量 blocking”触发 `escalate_to_human`，但“大量”没有数值阈值；Known Gaps 还承认第4轮转同源与升级人工的优先级未定义。结果是同一轮次状态可能出现多种合法解释，AC3-3 和 AC-D10 不能被确定性实现或验证。
- [minor] 问题: 报告合同缺少可验证细节 | 建议: 规格要求渲染 6 章结构报告并落盘固定路径，但 6 章名称和固定子路径都未在规格中给出，只写成后续到 agenthub 原实现核实。实现团队可以补，但当前验收项 AC4-2、AC4-3、AC-D4 会变成主观判断。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：3rd-review 对外接口没有唯一真源
- 必须修复：升级人工规则不可判定

