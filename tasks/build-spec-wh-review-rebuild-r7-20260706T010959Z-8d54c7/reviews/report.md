# 审查报告 — build-spec-wh-review-rebuild-r7-20260706T010959Z-8d54c7 (round 4)

- verdict: escalate_to_human
- provenance: single-context

## Summary

只读 fallback 复核了 `plan-ceo-review` 和 `review` 两个 lens，`plan-design-review` 对本需求不适用。当前 spec 的主阻断仍是任务目录落盘契约未定死，而且这是连续第3轮未关闭的同一问题；按评审合同，本轮必须 `escalate_to_human`。

## Findings

- [blocking] 位置: specs/wh-review-rebuild/spec.md:133 | 问题: 同一阻断问题连续第3轮未关闭：任务目录落盘公式仍未定死。spec 只说复用 `parseTaskDir()` 解析 `task_tracking_root`，但 AC1-3 仍写 `ls <task-dir>/<task-id>/reviews/`，没有明确是否必须落在 `tasks/{task-id}/reviews/`，也没有定死 `report`、`route-decision`、轮次状态文件的统一相对路径和文件名。结果 AC1-3、AC2-2、AC3-1、AC4-2、AC-D4、AC-D10 仍无法按同一目录规则实现和验收。按合同，连续第3轮仍未解决需升级人工。 | 建议: 人工先拍板唯一目录契约，再回写 spec：1. `parseTaskDir()` 返回值是否必须拼成 `tasks/{task-id}/`。2. `reviews/` 下固定文件/文件名清单。3. report、route-decision、round-state 各自的相对路径公式。4. 所有相关 AC 统一改成同一公式，不再混用 `<task-dir>/<task-id>/...` 这种占位写法。
- [important] 位置: specs/wh-review-rebuild/spec.md:313 | 问题: `C1-C6 判据（来源 decision-log D4）` 与权威来源不一致。decision-log D4 的 C5/C6 是“方向与上游输入一致”“决策产物格式可机器消费”，当前 spec 改成了“关键假设已记录”“非目标明确声明”。这会让 intake 合同按错误判据实现。 | 建议: 把 C1-C6 文本逐项对齐 `tasks/wh-review-rebuild/decision-log.md` 的 D4；如果确实要改判据，必须在 spec 里显式标注这是新增规则，并补来源与理由，不要继续标成“来源 decision-log D4”。
- [important] 位置: specs/wh-review-rebuild/spec.md:422 | 问题: 核心调用语义引用失效。这里写“单次调用语义详见§13（FR-REVIEW-ENGINE-001）”，但当前 spec 并不存在 §13，也没有 `FR-REVIEW-ENGINE-001`。实现者会找不到权威段落。 | 建议: 把交叉引用改到现存的 `FR-THIRDREVIEW-001`，或补出真实存在的章节和编号；所有 `§13` 引用一起清掉或统一改正。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：同一阻断问题连续第3轮未关闭：任务目录落盘公式仍未定死。spec 只说复用 `parseTaskDir()` 解析 `task_tracking_root`，但 AC1-3 仍写 `ls <task-dir>/<task-id>/reviews/`，没有明确是否必须落在 `tasks/{task-id}/reviews/`，也没有定死 `report`、`route-decision`、轮次状态文件的统一相对路径和文件名。结果 AC1-3、AC2-2、AC3-1、AC4-2、AC-D4、AC-D10 仍无法按同一目录规则实现和验收。按合同，连续第3轮仍未解决需升级人工。

