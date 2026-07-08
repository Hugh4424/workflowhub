# 审查报告 — build-spec-wh-review-rebuild-20260705T160512Z-766077 (round 12)

- verdict: revise_required
- provenance: single-context

## Summary

先补齐 wh-review 状态机优先级和 3rd-review 可执行接口契约，再实现其余条目。

## Findings

- [blocking] 问题: 审查轮次规则互相冲突，无法稳定实现 | 建议: FR-WHREVIEW-003 同时规定“异源最多3轮，第4轮起强制转同源”和“连续3轮 blocking 或指纹重复 blocking → 升级人工”。但没有定义第3轮结束时的裁决优先级，也没有定义“3轮内未 pass 但未满足 blocking 阈值”时是进入第4轮同源还是直接停机。Known Gaps 已承认优先级未明确，这会直接影响状态机、报告内容和自动推进行为，不能留到 build-plan 再补。
- [blocking] 问题: 3rd-review 纯引擎接口与现有执行入口未对齐 | 建议: 规格把 3rd-review 收敛为输入 {mode, contract, materials}、输出 {verdict, findings, actual_mode}，但 OPEN-1 明确指出 standalone.sh 的实际参数、输出结构与 SKILL.md 文档不一致。与此同时 FR-TEST-001 要求本地端到端可跑通。若不先把唯一可执行入口的契约定死，wh-review 无法稳定调用，测试方案也无法形成可验证的通过标准。
- [minor] 问题: “大量 blocking”阈值缺失 | 建议: FR-WHREVIEW-003 用它触发 escalate_to_human，但未给出 blocking_count 的数值阈值或计算口径。当前只能人工解释，机器不可判定。
- [minor] 问题: 报告落盘位置缺少规范路径 | 建议: 多处写“任务目录”“当前任务目录下固定子路径”，但没有给出 canonical 路径规则、命名规则、覆盖/追加策略。实现者可能各自定义，导致 AC1-3、AC4-2、AC-D10 难以一致验收。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：审查轮次规则互相冲突，无法稳定实现
- 必须修复：3rd-review 纯引擎接口与现有执行入口未对齐

