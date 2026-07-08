# 审查报告 — build-spec-wh-review-rebuild-20260705T160512Z-766077 (round 1)

- verdict: revise_required
- provenance: single-context

## Summary

先补齐审查状态机和 3rd-review 实际接口合同，再进入 build-plan/实现；当前规格不足以无歧义落地。

## Findings

- [blocking] 问题: 审查轮次规则自相矛盾 | 建议: FR-WHREVIEW-003 同时写了“异源审查最多3轮；第4轮起强制转同源”和“连续3轮 blocking 或指纹重复 blocking → 升级人工”。如果异源最多3轮，第4轮根本不该进入；而 Known Gap 里又承认第4轮转同源与3轮后升级人工的优先级未定。当前规则无法实现为单一确定状态机，必须先定清：第4轮是否存在、存在时是同源继续还是直接升级人工、各触发条件优先级是什么。
- [blocking] 问题: 3rd-review 核心接口与现有入口未对齐 | 建议: 规格要求 3rd-review 精简后对外接口固定为 `{mode, contract, materials}` -> `{verdict, findings, actual_mode}`，但未决问题 OPEN-1 明确指出 standalone.sh 的实际参数与返回结构和 SKILL.md 描述不一致，且只说 build-plan 阶段再建 tracking issue。这里不是边角问题，而是 wh-review 调 3rd-review 的主集成面；接口不先定清，无法可靠实现调用、落盘、测试和验收。
- [minor] 问题: “大量 blocking”阈值缺失 | 建议: 升级人工条件依赖“连续3轮出现大量 blocking”，但 GAP-4 明确没有数值阈值。实现方无法稳定计算 `blocking_count` 是否触发升级，验收也无法机械判断。应补成明确规则，例如 `blocking_count >= N` 或按 findings 中 blocking 条目数判定。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：审查轮次规则自相矛盾
- 必须修复：3rd-review 核心接口与现有入口未对齐

