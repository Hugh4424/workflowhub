<!--
  report-template.md — T013 (FR-WHREVIEW-004)

  Static reference skeleton for the wh-review 6-chapter report structure
  (章数=6, decision-log D1 confirmed; chapter names/order/min-info-points
  finalized in spec.md FR-WHREVIEW-004 as this period's acceptance baseline —
  it supersedes agenthub's original render-review-report.mjs chapter set
  wherever they conflict). This file is documentation only: it is NOT read
  at render time by render-review-report.mjs, which builds the same 6
  chapters programmatically. Kept here so a human can see the expected shape
  at a glance, and so AC4-3's "章节名称与顺序" baseline has a single
  human-readable reference alongside the spec text.
-->

## Summary

- verdict: <pass | revise_required | escalate_to_human>
- 轮次 (total_round): <N>
- 模式 (mode): <full | incremental | same-source>

## Blocking Issues

- [<finding_fingerprint>] <file>:<line> (<category>): <issue>
  - 建议：<recommendation>
- （无 blocking finding 时写 "- 无"）

## Minor Issues

- [<finding_fingerprint>] <file>:<line> (<category>): <issue>
- （无 minor finding 时写 "- 无"）

## Pass Items

- <通过项描述>
- （无通过项时写 "- 无"）

## Delta

- 第1轮：（第1轮，无上一轮可对比）
- 第2轮起：<本轮相较上一轮的变更说明>

## Metadata

- task-name: <task-id>
- review_flow_id: <review_flow_id>
- heterologous_round: <N>
- same_source_round: <N>
- total_round: <N>
- mode: <full | incremental | same-source>
- actual_mode: <3rd-review 引擎实际执行模式>
- contract_path: <本轮使用的合同文件路径>
- contract_hash: <合同文件内容哈希>
- timestamp: <ISO 8601 时间戳>
