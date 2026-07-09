# 审查报告 — build-spec-review-20260708T080932Z-56b9c9 (round 1)

- verdict: revise_required
- provenance: single-context

## Summary

需要先修正 flow_profile 校验口径，并补齐 receipt 证据契约后再进入实现。

## Findings

- [blocking] 问题: FR-FLOWPROFILE-001 与 AC2 自相矛盾 | 建议: FR-FLOWPROFILE-001 明确写着“本轮不据此做任何行为分支、不做格式/枚举校验”，但 AC2 又要求“写入其他值应被拒绝，非法枚举值不得静默接受”。这会让 build-code 无法判断本轮到底要不要实现枚举校验。需二选一：要么本轮只记录字段、不验收拒绝非法值；要么把枚举校验纳入本轮实现。
- [blocking] 问题: receipt 真核验缺少可实现证据契约 | 建议: FR-RECEIPT-001/002 要求比对 git diff 与测试执行结果，但规格没有定义证据来源、字段位置、文件路径、命令来源、stage-result 如何关联 diff/test result、无代码变更的合法文档任务如何判定。仅写“需要能取得”不足以实现稳定校验，容易在 build-code 阶段变成拍脑袋实现或误拒合法任务。
- [minor] 问题: task_dir 本轮边界表述重复摇摆 | 建议: 第 2 节非目标说本轮不实现 D5 config.json 接入 task-dir-parser，后文又把 FR-TASKDIR 与 AC4 写成验收项。若本文件是 build-code 输入可以保留，但需明确这些 AC 是 build-code 验收，不是当前 spec 阶段已完成验收，避免后续审查误判。
- [minor] 问题: flow_profile 占位字段风险已识别但决策未收口 | 建议: 未决 6 已指出 flow_profile 没有具体故障根因，只是未来占位。若保留，应在规格里明确保留理由和当前最小实现；若不保留，应等真正行为分支出现再加。当前状态会增加无效字段和验收分歧。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：FR-FLOWPROFILE-001 与 AC2 自相矛盾
- 必须修复：receipt 真核验缺少可实现证据契约

