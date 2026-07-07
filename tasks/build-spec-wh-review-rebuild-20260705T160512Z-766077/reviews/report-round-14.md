# 审查报告 — build-spec-wh-review-rebuild-20260705T160512Z-766077 (round 14)

- verdict: revise_required
- provenance: single-context

## Summary

先补齐轮次状态机、报告/状态文件合同、3rd-review 实际接口三项硬规格，再进入 build-plan 和实现。

## Findings

- [blocking] 问题: 审查轮次规则自相矛盾 | 建议: FR-WHREVIEW-003 同时写了“异源审查最多3轮”“第4轮起强制转同源”，两条规则不能同时成立；Known Gap 还补充了第4轮与连续3轮 blocking 升级人工可能并发，说明状态机未定。实现方无法判断第4轮是否存在、何时切换 same-source、何时直接 escalate_to_human。
- [blocking] 问题: 报告与状态落盘合同未定义到可验收程度 | 建议: 多处要求“报告落盘任务目录”“路径可预测”“轮次状态文件存在”，但“任务目录”根路径、固定子路径、文件命名规则、状态文件格式都未定义；同时 6 章报告结构名称在 Known Gaps 中明确未确认，却被 AC4-3/AC-D10 当作验收项。没有这些常量，无法做 deterministic 实现，也无法做机器验收。
- [blocking] 问题: 3rd-review 纯引擎接口没有和实际执行入口对齐 | 建议: FR-THIRDREVIEW-001 把 3rd-review 固定为输入 {mode, contract, materials}、输出 {verdict, findings, actual_mode}，但 OPEN-1 明说 standalone.sh 的实际参数和返回结构与 SKILL.md 不一致，且要求 build-plan 阶段再对齐。该接口正是本次重构的核心边界，不先锁定就无法安全拆分 wh-review 与 3rd-review，也无法设计端到端测试。
- [minor] 问题: 统一收尾与差异化推进门的职责边界不清 | 建议: FR-STAGE-001 要求 5 个 stage 收尾统一调用 human-brief-template，且“禁止各自实现不一致的收尾逻辑”；FR-D2-001 又要求部分 stage 的 pass 必须人工确认、部分可自动推进。需要明确 D2 gate/auto-advance 由 wh-review 负责，还是由各 stage SKILL 收尾分支负责，否则实现时容易再次分叉。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：审查轮次规则自相矛盾
- 必须修复：报告与状态落盘合同未定义到可验收程度
- 必须修复：3rd-review 纯引擎接口没有和实际执行入口对齐

