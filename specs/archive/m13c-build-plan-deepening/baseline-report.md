# M13c Baseline Comparison Report

task_id: m13c-build-plan-deepening
generated: 2026-07-01
data_sources:
- global-metrics: ~/.workflowhub/metrics/global-metrics.jsonl (filtered task_id=m13c-build-plan-deepening)
- task-metrics: ~/Knowledge/Projects/workflowhub/tasks/m13c-build-plan-deepening/task-metrics.jsonl
- journal: ~/Knowledge/Projects/workflowhub/tasks/m13c-build-plan-deepening/journal.jsonl
- m10_baseline: specs/archive/m10-baseline-switch/baseline-report.md

## 5-Metric Comparison

| Metric | M13c Actual | M10 Baseline | Direction Delta |
|---|---|---|---|
| missed_step_rate | unknown | 0.05 | unknown |
| test_execution_rate | unknown | 0.83 | unknown |
| review_execution_rate | 0.0 | 1.0 | worse (-1.0) |
| rework_rounds | 1.0 | 6.075 | better (-5.075) |
| rework_proxy_count | unknown | 25.25 | unknown |

## 数据来源说明

### 可计算指标

**review_execution_rate = 0.0**
来源：M4 core field `facts.review_invoked`。task-metrics.jsonl 中 make-decision 和 decision-log 两条记录均为 `review_invoked: false`；build-spec 记录无 facts 字段，不纳入分母。0/2 = 0.0。方向为 worse（低于 M10 baseline=1.0）。

**rework_rounds = 1.0**
来源：M4 core field `rework_rounds` 直接字段。make-decision=1, decision-log=0, build-spec=0，合计 1 轮，单 task 总量 = 1.0。M10 baseline 为 4 task 平均值 6.075。方向为 better（减少 5.075）。

### 不可计算指标（unknown，FR-GUARD-004 禁止零填充）

**missed_step_rate = unknown**
M10 代理方法依赖 journal 事件 `stage_enter`/`stage_exit`。m13c journal.jsonl 采用不同事件 schema（s0_context_loaded、s1_complete 等），无匹配事件，无法用相同方法推导。

**test_execution_rate = unknown**
M10 代理方法依赖 journal 事件 `phase_pre_review`。m13c journal.jsonl 无此事件类型，无法推导。

**rework_proxy_count = unknown**
M10 代理方法依赖 journal 事件 `checkpoint_request` 计数。m13c journal.jsonl 无此事件类型，无法推导。

## 结论

- 5 项指标中 2 项可计算，3 项 unknown（journal schema 不兼容，不零填充）
- rework_rounds 显著改善（1.0 vs baseline 6.075）
- review_execution_rate 为 0.0，低于 baseline 1.0；m13c 各阶段均未触发 review_invoked
- unknown 项需后续统一 journal schema 后方可对照
