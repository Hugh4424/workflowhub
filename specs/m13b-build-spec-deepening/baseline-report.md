# M13b vs M10 Baseline Comparison Report

**Task**: m13b-build-spec-deepening
**Stage**: build-spec step 5 (baseline comparison)
**Date**: 2026-06-30
**Data sources**:
- `tasks/m13b-build-spec-deepening/task-metrics.jsonl` (2 records)
- `~/.workflowhub/metrics/global-metrics.jsonl` (no m13b-tagged records found)

---

## Baseline Comparison Table

| Metric | M13b Actual | M10 Baseline | Direction Delta |
|---|---|---|---|
| missed_step_rate | unknown | 0.05 | unknown |
| test_execution_rate | unknown | 0.8295 | unknown |
| review_execution_rate | 0.0 | 1.0 | worse (-1.0) |
| rework_rounds | 2 | 6.075 | better (-4.075) |
| rework_proxy_count | unknown | 25.25 | unknown |

---

## Notes

**General context**: M13b is a single fresh task with minimal instrumentation records. Most unknowns below are the honest correct answer per F9 (缺数据标未知，不假绿).

### missed_step_rate — unknown
No `step_skipped` / `step_executed` fields present in any available M4 records for this task. The metric cannot be derived without that instrumentation. Missing-data reason: no step-level skip/execute tracking fields in task records.

### test_execution_rate — unknown
No dedicated test-invocation field (e.g. `test_invoked`) in the M4 records. The `review_invoked` field captures review, not test runs. Missing-data reason: no test-execution flag in task records.

### review_execution_rate — 0.0 (single-record corpus, treat with caution)
Derived from the 1 M4 stage record in `tasks/m13b-build-spec-deepening/task-metrics.jsonl`: `review_invoked=false` → 0 out of 1 stages invoked review = 0.0. Caution: a single-record corpus is not statistically comparable to the M10 corpus mean. The direction delta (worse) reflects the raw value but should not be treated as a stable signal until more records accumulate. The global metrics store contains no m13b-tagged records that would widen the corpus.

### rework_rounds — 2 (single stage value, not a corpus mean)
Derived directly from the M4 field `rework_rounds=2` on the one build-code stage record. M10 baseline (6.075) was a mean across many executions. This is a single-stage value; directional comparison (better: 2 < 6.075) is noted but should not be treated as a reliable trend from one data point.

### rework_proxy_count — unknown
The proxy count field (`action_count`) reads `0` in the one M4 record, but this reflects missing instrumentation (the field was not populated) rather than genuine zero rework activity. Reporting 0 would be a false-green (violates F9). Missing-data reason: `action_count` field not instrumented for this task execution.

---

## Summary

- **Computed (with caveats)**: `review_execution_rate` (0.0, 1-record corpus), `rework_rounds` (2, single stage)
- **Unknown**: `missed_step_rate`, `test_execution_rate`, `rework_proxy_count`
- No unknown blocks progression (F3: 物理事实不阻断推进).
- Thresholds are set by humans; non-compliance does not block.
