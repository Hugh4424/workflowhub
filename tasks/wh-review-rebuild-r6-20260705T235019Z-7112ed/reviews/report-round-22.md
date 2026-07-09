# 审查报告 — wh-review-rebuild-r6-20260705T235019Z-7112ed (round 22)

- verdict: revise_required
- provenance: single-context

## Summary

先补齐轮次状态数据模型和所有落盘路径合同，再收紧 §7 的机器校验规则；否则核心验收项不可实现也不可验证。

## Findings

- [blocking] 问题: 轮次状态模型无法支撑“异源/同源独立计数”规则 | 建议: FR-WHREVIEW-003 明确要求同源模式最多 3 轮且“独立计数，不与异源轮次合并”，FR-THIRDREVIEW-001 AC5-4 又要求 wh-review 自行维护独立轮次计数器。但 §6 只定义最小状态字段 `round_number`、`mode`、`verdict`、`report_path`、`blocking_count`、`fingerprint_repeated`，没有任何字段能同时表达异源计数、同源计数和总轮次。按现规格实现后，AC3-3/AC5-4 无法被稳定验证，也无法无歧义判断何时进入同源、何时在同源第 3 轮末强制升级人工。
- [blocking] 问题: 报告与 route-decision 的落盘路径合同未定死，多个验收项无法执行 | 建议: 规格多处要求“任务目录下固定子路径”“路径可预测”“ls <task-dir>/<task-id>/reviews/ 可验证”“route-decision 记录文件可 grep 验证”，但没有定义 task-dir/task-id 的来源、目录结构、文件命名规则、state/report/route-decision 的确切相对路径。AC1-3、AC2-2、AC3-1、AC4-2、AC-D4、AC-D10 都依赖这个路径合同；没有定死路径，测试无法写，人工也无法一致复现。
- [minor] 问题: §7 的机器校验规则过弱，可能放过仍含条件分支的文本 | 建议: FR-THIRDREVIEW-002 说 §7 要删除所有流程步骤和 if/else 逻辑，但示例匹配只列 `^\s*\d+\.` 和 `/\bif\b.*\belse\b/`。这无法覆盖单独出现的 `if`、`else`、中文条件描述（如“若/否则”）、或无编号但仍是步骤化清单的写法，导致“机器可检验规则”与真实目标不等价。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：轮次状态模型无法支撑“异源/同源独立计数”规则
- 必须修复：报告与 route-decision 的落盘路径合同未定死，多个验收项无法执行

