# 审查报告 — wh-review-rebuild-r6-20260705T235019Z-7112ed (round 14)

- verdict: revise_required
- provenance: single-context

## Summary

先统一 3rd-review 接口契约、拆分审查状态字段，再补齐所有落盘产物的明确路径规则，之后这份规格才可进入实现。

## Findings

- [blocking] 问题: 审查状态模型把两个独立维度混成一个 `mode` 字段 | 建议: FR-WHREVIEW-003 把 `full`/`incremental`/`same-source` 放进同一个 `mode` 枚举，但前两者描述材料范围，`same-source` 描述审查来源切换，不是同一维度。按当前规格无法表达“同源 + 增量”或“同源 + 全量”等实际状态，AC3-1、AC3-4、AC-D10 也会因此失真，轮次状态文件和裁决逻辑都无法稳定实现。应拆成至少两个字段，例如 `review_scope` 与 `review_source`，再重写相关验收。
- [blocking] 问题: 3rd-review 接口契约与验收条目自相矛盾 | 建议: FR-THIRDREVIEW-001 明确规定方案A下 wh-review 调用 3rd-review 时“禁止传入 stage 路由参数（如 `--checkpoint`）”，3rd-review 完全不感知 stage；但 AC-D1 又要求“对同一审查包，去掉/加上 stage 参数的两次调用返回结果一致”。这要求 3rd-review 仍接受 stage 参数，与前述纯引擎契约冲突。实现方无法判断接口应拒绝该参数、忽略该参数，还是兼容保留。需要统一为单一可执行契约。
- [blocking] 问题: 多处关键落盘产物只说‘固定子路径’，未给出可执行路径合同 | 建议: 报告文件、轮次状态文件、route-decision 记录、Delta Package 都被要求可预测、可 grep、可机器验证，但规格只写“任务目录下固定子路径”或“路径可查”，没有定义具体目录结构、文件名规则、task-dir/task-id 来源。AC1-3、AC2-2、AC3-1、AC3-2、AC4-2、AC-D4、AC-D10 因此无法客观验收，也会让不同实现产生不兼容落盘结构。需要把这些产物路径与命名规则写死。
- [minor] 问题: §7 机器校验规则过弱，不能可靠覆盖‘无条件分支逻辑’目标 | 建议: FR-THIRDREVIEW-002 只举了 `^\s*\d+\.` 和 `/\bif\b.*\belse\b/` 这类模式，抓不到单独出现的 `if`、`else if`、中文条件描述、无编号项目符号等情况。这样即使 §7 仍保留流程/分支语义，也可能通过检查。建议把禁止模式定义完整，或改成正向要求：§7 只允许概念性说明并必须引用 §13。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：审查状态模型把两个独立维度混成一个 `mode` 字段
- 必须修复：3rd-review 接口契约与验收条目自相矛盾
- 必须修复：多处关键落盘产物只说‘固定子路径’，未给出可执行路径合同

