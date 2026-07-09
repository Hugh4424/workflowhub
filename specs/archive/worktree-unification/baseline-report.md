# M10 Baseline Comparison Report — worktree-unification
task-id: worktree-unification
stage: build-spec (Step 5)
date: 2026-07-04

---

## Data Sources

- Prior baseline reference: `specs/m13b-build-spec-deepening/baseline-report.md` (M13b build-spec run, 2026-06-30)
- Prior baseline reference: `specs/m13-make-decision-v1/baseline-report.md` (M13 make-decision run)
- Current task: worktree-unification, build-spec stage, fresh run
- task-metrics.jsonl: metrics/collector.mjs recordSkeleton failed (TASK_TRACKING_ROOT unset) → no task-metrics.jsonl records for this run

## M10 Baseline Reference Values (from m13b)

| Metric | M10 Baseline | Source |
|--------|-------------|--------|
| missed_step_rate | 0.05 | m13b/m13 aggregate |
| test_execution_rate | 0.8295 | m13b/m13 aggregate |
| review_execution_rate | 1.0 | m13 aggregate |
| rework_rounds | 6.075 | m13 aggregate |
| rework_proxy_count | 25.25 | m13 aggregate |

## Current Run Actuals

| Metric | worktree-unification Actual | M10 Baseline | Direction Delta |
|--------|---------------------------|-------------|-----------------|
| missed_step_rate | unknown | 0.05 | unknown |
| test_execution_rate | unknown | 0.8295 | unknown |
| review_execution_rate | 0.0 | 1.0 | worse (-1.0) |
| rework_rounds | 0 | 6.075 | better (-6.075) |
| rework_proxy_count | unknown | 25.25 | unknown |

## Notes

**missed_step_rate — unknown**
No `step_skipped` / `step_executed` event fields present in any available M4 records for this run. Metric cannot be derived without step-level instrumentation. Missing-data reason: metrics/collector.mjs failed to initialize (TASK_TRACKING_ROOT unset), no task-metrics.jsonl written. Reporting unknown per F9 (缺数据标未知，不假绿).

**test_execution_rate — unknown**
No dedicated test-invocation field (e.g. `test_invoked`) in M4 records. build-spec stage does not execute tests; test execution is a verify-code concern. Missing-data reason: no test-execution flag in build-spec M4 records. Reporting unknown.

**review_execution_rate — 0.0**
3rd-review was not executed this run (异源引擎不可用，unknown 已记录质量事实契约第3项). review_invoked=false → 0 out of 1 attempted stages. Note: single-record corpus, treat with caution. Reporting 0.0 not as false-green but as accurate observation (F9).

**rework_rounds — 0**
No rework loop occurred in this build-spec run. spec-clarify resolved both Q1/Q2 from codebase evidence without needing human input; no spec revision loop triggered. This is better than M10 baseline of 6.075. Single run, treat with caution.

**rework_proxy_count — unknown**
Fifth metric (named `rework_proxy_count` per SKILL.md requirement). No journal event stream available (no stage_enter/stage_exit/phase_pre_review/checkpoint_request events recorded). Cannot compute without instrumentation. Reporting unknown per F9.

## Summary

- **Computed**: `review_execution_rate` (0.0, 1-record corpus), `rework_rounds` (0, single stage)
- **Unknown**: `missed_step_rate`, `test_execution_rate`, `rework_proxy_count`
- Root cause of unknowns: metrics/collector.mjs failed to initialize (TASK_TRACKING_ROOT env not set → `Cannot read properties of undefined (reading 'taskMetricsPath')`). Friction recorded in quality contract §4.
- **Non-compliance does not block progression** (F3: 物理事实不阻断推进, Q1: 记事实而非阻断).
- **Thresholds set by humans, not by stage.** M10 baseline values are reference points only.

## Append to spec.md

Baseline comparison table appended to: `specs/worktree-unification/spec.md` (quality contract §2, self-check item 5 covers spec↔decision-log alignment rather than M10; this standalone file is the M10 record per SKILL.md §5).
