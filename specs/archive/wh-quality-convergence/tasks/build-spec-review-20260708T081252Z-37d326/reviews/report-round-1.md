# 审查报告 — build-spec-review-20260708T081252Z-37d326 (round 1)

- verdict: revise_required
- provenance: single-context

## Summary

需先消除 flow_profile 校验矛盾，并补齐 receipt 证据来源、格式、绑定关系和边界语义后再进入实现。

## Findings

- [blocking] 问题: FR-FLOWPROFILE-001 与 AC2 自相矛盾 | 建议: FR-FLOWPROFILE-001 明确写着“本轮不据此做任何行为分支、不做格式/枚举校验”，但 AC2 又要求“写入其他值应被拒绝，非法枚举值不得静默接受”。同一轮到底是否校验 flow_profile 没有唯一答案，build-code/verify-code 会按不同条款得出相反实现。
- [blocking] 问题: receipt 真核验缺少可实现证据契约 | 建议: FR-RECEIPT-001/002 要求比对 git diff 与测试执行结果，但规格未定义这些证据从哪里取、格式是什么、如何绑定到具体 stage、空 diff 在纯文档/配置任务中是否一定失败、测试未适用时如何表达。当前只能写出主观校验，无法稳定验收“工作真实发生”。
- [minor] 问题: flow_profile 占位字段仍未给出当前价值 | 建议: 未决 6 已承认 flow_profile 本轮不驱动行为、无特定威胁、也不校验。若保留，应说明当前阶段必须写入它的直接消费方或近期迁移路径；否则更简单方案是等真正接入 full/fast 行为时再加。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：FR-FLOWPROFILE-001 与 AC2 自相矛盾
- 必须修复：receipt 真核验缺少可实现证据契约

