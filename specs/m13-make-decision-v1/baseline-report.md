# M13 基线对照报告

## Metrics 数据源

- `tasks/m13-make-decision-v1/task-metrics.jsonl` — 含 make-decision（recordSkeleton + updateOwnResult）和 build-spec 段记录
- `task-metrics.jsonl`（项目根目录）— 含 verify-code 段记录（2 条）

共 4 条 task-metrics.jsonl 记录，覆盖 make-decision / build-spec / verify-code 三段。

| Metric | M13 Actual | M10 Baseline | Direction Delta |
|---|---|---|---|
| missed_step_rate | unknown | 0.05 | unknown |
| test_execution_rate | unknown | 0.8295 | unknown |
| review_execution_rate | unknown | 1 | unknown |
| rework_rounds | 0（make-decision段）; 2（build-spec段） | 6.075 | better |
| rework_proxy_count | unknown | 25.25 | unknown |

**unknown 原因：** M13 task-metrics.jsonl 不含 journal 事件流（stage_enter/stage_exit/phase_pre_review/checkpoint_request），missed_step_rate / test_execution_rate / review_execution_rate / rework_proxy_count 四项均需从 journal 事件推导，无法计算。rework_rounds 直接来自 task-metrics.jsonl 核心字段。

> 阈值由人工设定，基线仅供参考，不符不阻断推进（F3/Q1）。
