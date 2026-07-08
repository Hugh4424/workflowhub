# 审查报告 — build-spec-wh-review-rebuild-20260705T160512Z-766077 (round 4)

- verdict: revise_required
- provenance: single-context

## Summary

先补齐 3rd-review 固定接口、轮次规则优先级、blocking 阈值、6章报告定义，再进入实现；当前规格不足以支撑稳定开发和客观验收。

## Findings

- [blocking] 问题: 3rd-review 核心接口未定稿，和已知实现不一致 | 建议: FR-THIRDREVIEW-001把 3rd-review 定义为输入 {mode, contract, materials}、输出 {verdict, findings, actual_mode}，但“OPEN-1”又明确 standalone.sh 的实际参数与返回结构尚未对齐。这不是边角问题，是新两层架构的唯一核心接口；接口未冻结，wh-review 无法可靠实现也无法验收。
- [blocking] 问题: 审查轮次控制规则互相打架，无法得出唯一行为 | 建议: 规格同时要求“异源最多3轮；第4轮起强制转同源”和“连续3轮 blocking 或指纹重复 blocking → 升级人工”。当第3轮满足升级条件、或进入第4轮时，两条规则会竞争；Known Gaps 也承认优先级未定义。这会直接导致同一输入下裁决不确定，属于主流程阻断。
- [blocking] 问题: “大量 blocking”没有数值定义，升级人工条件不可执行 | 建议: FR-WHREVIEW-003 把“连续3轮出现大量 blocking”作为升级触发条件，但全文没有给出 blocking_count 的阈值或计算口径。AC3-3、AC-D10 依赖这个条件，当前无法实现稳定判定，也无法写出可复现测试。
- [blocking] 问题: 6章报告结构未定义，报告验收标准不可验证 | 建议: UC-7、FR-WHREVIEW-004、AC4-3 都要求 render-review-report.mjs 产出“6章结构”报告，但 Known Gaps 明确 6 章名称仍需去 agenthub 原实现核实。报告结构既是功能输出也是验收条件，缺少章节定义时无法判断实现是否合格。
- [minor] 问题: D2 人工确认门的落点对象不够清晰 | 建议: 规格一会儿描述为 wh-review 返回裁决后由 stage agent 决定是否推进，一会儿又在 AC8-1 要求“pass 分支代码中不存在自动推进逻辑”。建议明确 D2 约束落在 wh-review 返回契约、stage SKILL 收尾、还是外层 orchestrator，避免责任边界再次混乱。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：3rd-review 核心接口未定稿，和已知实现不一致
- 必须修复：审查轮次控制规则互相打架，无法得出唯一行为
- 必须修复：“大量 blocking”没有数值定义，升级人工条件不可执行
- 必须修复：6章报告结构未定义，报告验收标准不可验证

