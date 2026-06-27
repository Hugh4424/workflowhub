# M10 字段映射样例 — 5行×7列

对照 agenthub journal 事件与 workflowhub metrics 字段的完整映射。5项流程指标，每项7列。

| metric_name | journal_event | workflowhub_field | formula | polarity | source_type | missing_behavior |
|-------------|--------------|-------------------|---------|----------|-------------|------------------|
| missed_step_rate | stage_enter/stage_exit | executed | 缺 stage_exit 的 stage 数/5 | ↓ better | proxy | null→skip |
| test_execution_rate | phase_pre_review | executed | 有 phase_pre_review 的 phase 数/apply总phase数 | ↑ better | weak_proxy | denominator=0→null |
| review_execution_rate | checkpoint_request | executed | 有 checkpoint_request 的 stage 数/4 | ↑ better | proxy | denominator=0→null |
| rework_rounds | checkpoint_request | rework_rounds | mean(max(0, count-1)) per stage | ↓ better | proxy | no review→0 |
| rework_proxy_count | checkpoint_request | rework_rounds | sum(max(0, count-1)) across stages | ↓ better | weak_proxy | no review→0 |

## 说明

- **source_type**: direct=workflowhub真采集, proxy=agenthub journal推导, weak_proxy=推导存在局限
- **polarity**: ↑ better=值越高越好, ↓ better=值越低越好
- **missing_behavior**: 数据缺失时的处理方式
- 仅 verify-code 段有真采集数据(task-metrics.jsonl)，其余4段为代理推导
