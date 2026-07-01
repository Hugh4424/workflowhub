# M13a M10 Baseline Comparison Report

**Task**: m13a-moat-skills
**Stage**: build-spec step 5 (baseline comparison)
**Date**: 2026-06-30
**Data sources**:
- `tasks/m13a-moat-skills/task-metrics.jsonl` (1 record)
- `~/.workflowhub/metrics/global-metrics.jsonl` (no m13a-tagged records found beyond the same 1 record)

---

## Baseline Comparison Table

| Metric | M13a Actual | M10 Baseline | Direction Delta |
|---|---|---|---|
| missed_step_rate | unknown | 0.05 | unknown |
| test_execution_rate | unknown | 0.8295 | unknown |
| review_execution_rate | gap | 1.0 | unknown |
| rework_rounds | unknown | 6.075 | unknown |
| rework_proxy_count | gap | 25.25 | unknown |

---

## Notes

### missed_step_rate — unknown

No `step_skipped` / `step_executed` fields present in the single M13a task record. Metric cannot be derived without step-level skip/execute instrumentation.

### test_execution_rate — unknown

No `test_invoked` field in task record. Missing-data reason: test-execution flag not instrumented.

### review_execution_rate — gap (FR-GUARD-004)

`review_invoked` field is absent from the M13a record entirely (unreachable field, not merely null). Per FR-GUARD-004 (M13b `metrics/collector.mjs` 口径): unreachable field marked gap, not 0-filled.

### rework_rounds — unknown

`rework_rounds` field present in record but value is null (not populated at execution time). Cannot compute.

### rework_proxy_count — gap (FR-GUARD-004)

`action_count` field is 0 in the record but is not instrumented (same pattern as M13b: field exists in schema, not written by executor). Cannot derive rework_proxy_count. Per FR-GUARD-004 (M13b `metrics/collector.mjs` 口径): unreachable/uninstrumented field marked gap, not 0-filled.

---

## Data Source Summary

Single task-metrics record from `tasks/m13a-moat-skills/task-metrics.jsonl`; global metrics store confirms same record with no additional m13a entries. All five metrics lack sufficient instrumentation to compute actuals: two fields absent entirely (gap, FR-GUARD-004), two fields null/uninstrumented (unknown), one field schema-missing (unknown). No unknown/gap blocks progression (F3).
