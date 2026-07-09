# 审查报告 — wh-review-rebuild-r6-20260705T235019Z-7112ed (round 6)

- verdict: revise_required
- provenance: single-context

## Summary

先统一 3rd-review 的唯一输入契约，再把报告 6 章结构的权威来源和最终命名一次性定死。

## Findings

- [blocking] 问题: 3rd-review 输入契约自相矛盾 | 建议: 文档前部把 3rd-review 定义为接收 `{mode, contract, materials}` 的纯引擎（目标、数据流、UC-6、FR-WHREVIEW-001），但 FR-THIRDREVIEW-001 的方案A又要求 wh-review 先把合同和材料装配成“一份完整的纯文本审查包”，并明确 3rd-review 只接收这份单一文本输入。两种接口模型不同，会直接影响 wh-review 装配方式、3rd-review 实现边界、日志/测试断言和独立复用方式，当前无法按一套唯一合同实现。
- [blocking] 问题: 报告 6 章结构已“定死”但同时被标记为待核实 | 建议: FR-WHREVIEW-004 已把 6 个章节名、顺序、语义写成不可更改的硬性要求，并要求在 wh-review SKILL.md 中机器可检验；但 Known Gaps 又写明“render-review-report.mjs 的6章结构名称未在 decision-log 中明确列出，build-plan 阶段需在 agenthub 原实现中核实并在 SKILL.md 中定义”。这导致实现方无法判断应以当前 spec 的章节名为准，还是以后续核实结果为准，验收基线不唯一。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：3rd-review 输入契约自相矛盾
- 必须修复：报告 6 章结构已“定死”但同时被标记为待核实

