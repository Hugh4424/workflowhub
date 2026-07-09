# 审查报告 — build-spec-wh-review-rebuild-20260705T160512Z-766077 (round 13)

- verdict: revise_required
- provenance: single-context

## Summary

先补齐轮次优先级、blocking 阈值、3rd-review 实际接口契约，再进入实现；否则 wh-review 的核心流程不可验证。

## Findings

- [blocking] 问题: 审查轮次规则冲突，无法确定第4轮行为 | 建议: FR-WHREVIEW-003同时写了“异源审查最多3轮；第4轮起强制转同源”和“连续3轮大量 blocking 或指纹重复 blocking → 升级人工”。Known Gaps 也承认两条规则可能同时触发但未定优先级。这个冲突直接决定 wh-review 的裁决与停止条件，当前无法实现确定性逻辑，也无法写稳定测试。
- [blocking] 问题: “大量 blocking”未定义，升级人工条件不可执行 | 建议: FR-WHREVIEW-003把升级条件写成“连续3轮出现大量 blocking”，但 GAP-4 明确承认“大量”没有数值阈值。没有 blocking_count 的阈值，`escalate_to_human` 何时触发无法实现，也无法验收 AC3-3、AC-D10。
- [blocking] 问题: 3rd-review 纯引擎接口与现有调用契约未对齐 | 建议: 规格要求 3rd-review 精简为输入 `{mode, contract, materials}`、输出 `{verdict, findings, actual_mode}`，同时又把 `standalone.sh` 参数/输出不一致列为 OPEN-1 且标记“不阻断”。这不是边角问题，而是核心集成契约。若不先统一 3rd-review 的真实 CLI/API 形态，wh-review 无法稳定调用，FR-THIRDREVIEW-001、NFR-3、AC-D7 都缺少可落地接口。
- [minor] 问题: 6章报告结构未在规格中定稿 | 建议: FR-WHREVIEW-004要求报告“包含6章结构”，Known Gaps 又说明 6 章名称尚未核实、需 build-plan 阶段补定义。建议在规格里直接列出章名或明确占位字段，否则验收只能做存在性检查，不能做内容一致性检查。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：审查轮次规则冲突，无法确定第4轮行为
- 必须修复：“大量 blocking”未定义，升级人工条件不可执行
- 必须修复：3rd-review 纯引擎接口与现有调用契约未对齐

