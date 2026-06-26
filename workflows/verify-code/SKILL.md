---
name: verify-code
description: Run a full verification pass against the spec acceptance criteria and produce a final test report and verdict.
---

# verify-code

## Goal

Confirm that the implementation satisfies every acceptance criterion in the spec. Produce a final test report and an explicit pass/fail verdict before the change is considered deliverable.

## Scope boundary: verify-code vs verify-change

**`verify-code`** is this skill — stage 5, test-acceptance. It reads the spec's acceptance criteria and the implementation from `build-code`, runs the test suite, and writes `final-test-report.md` and `test-acceptance/summary.md`.

**`verify-change`** is a different concept — verifying a diff at code-review time (checking whether a proposed change is safe to merge). That is not this skill's responsibility. `verify-code` checks whether the code meets the spec; `verify-change` checks whether the diff is reviewable. If you are asked to "verify the change", confirm which meaning is intended before proceeding.

## What to do

### 1. 前置读取

Read `specs/{task-id}/stage-result-build-code.json`, extract `facts.tests.command`. If the command field is missing, surface an explicit error and stop. Do not proceed silently without a test command.

### 2. metrics 开始

At stage start, call `metrics/collector.mjs` `recordSkeleton`, passing a seed with all 10 core fields:

```json
{
  "execution_id": "<uuid>",
  "skill_or_stage": "verify-code",
  "stage": "verify-code",
  "skill_version": "1.0.0",
  "executed": true,
  "tokens": null,
  "duration_ms": null,
  "rework_rounds": 0,
  "human_intervention": false,
  "friction_ref": null
}
```

These are the M4 record-schema core fields (`execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`). Use `metrics/collector.mjs` — do not hand-write a raw jsonl line with only `skill/stage/event/ts`.

### 3. fresh 测试执行

Call `node workflows/verify-code/capture.mjs` with the command extracted in step 1. Write the evidence to `specs/{task-id}/evidence/fresh-capture.json`. The capture script records: exit code, git SHA, Test Files line, content hash, timestamp, and command — all durable, externally-verifiable facts.

### 4. 鲜度校验

Call `freshness.mjs` `checkFreshness` to compare the build-code git_sha against current HEAD. If `anomaly_flags` is non-empty, output visible warnings at the skill boundary (FR-FRESH-004). The `stale_sha` anomaly is informational only — it does not block or change the verdict.

### 5. 浏览器验收 (SKIP branch)

Determine if the task has UI acceptance items. Check the spec for `ui_change: true` or explicit browser/QA acceptance criteria.

- **No UI items**: SKIP browser acceptance. Record in `missing_items`: `"browser-acceptance: no UI acceptance items"`. Continue to step 6 (FR-BROWSER-002/003).
- **UI items exist**: Invoke `isolated-browser-qa.md` to perform browser-based acceptance verification. Record its results in the evidence bundle.

### 6. 明文停顿 (收尾确认)

List the irreversible actions that will be taken if the user confirms:

- Merge the target branch (e.g., `main`)
- Delete the feature branch

Wait for explicit user confirmation before proceeding (FR-CLOSE-001/003). Do not execute merge or delete without user consent.

### 7. 收尾执行

- **User confirms**: Execute the merge and branch deletion. Set `user_decision=true`.
- **User rejects**: Set `user_decision=false`, terminate the skill, and record the reason in the stage-result (FR-CLOSE-002).

### 8. stage-result 落盘

Call `facts-assembly.mjs` `assembleStageResult` + `writeStageResult`. Write the stage-result to `specs/{task-id}/stage-result-verify-code.json` (FR-PATH-001). The `final-test-report.md` goes to `specs/{task-id}/test/` (FR-PATH-002).

The stage-result record has this structure:

```json
{
  "status": "success",
  "error_code": "",
  "retryable": false,
  "facts": {
    "verdict": "pass",
    "evidence_ref": "<relative path to final-test-report.md>"
  },
  "missing_items": [],
  "user_decision": false,
  "reason": "All acceptance criteria verified and documented."
}
```

### 9. metrics 结束

Call `updateOwnResult` to finalize the metrics record. Metrics write failure only warns — it does not throw (FR-METRICS-002, F3).

## Produce a stage-result

When verification is complete, write a `stage-result` record with:

```json
{
  "status": "success",
  "error_code": "",
  "retryable": false,
  "facts": {
    "verdict": "pass",
    "evidence_ref": "<relative path to final-test-report.md>"
  },
  "missing_items": [],
  "user_decision": false,
  "reason": "All acceptance criteria verified and documented."
}
```

Also record a metrics entry via the collector. Call `recordSkeleton` at stage start and `updateOwnResult` at stage end, passing at minimum:

> **M10 wiring**: After calling `recordSkeleton` and `updateOwnResult`, also call `../../workflows/verify-code/metrics-writer.mjs` `runMetricsWriter({ taskDir, taskId, verdict })` to record task-metrics.jsonl for baseline comparison (FR-COLL-001).

```json
{
  "execution_id": "<uuid>",
  "skill_or_stage": "verify-code",
  "stage": "verify-code",
  "skill_version": "1.0.0",
  "executed": true,
  "tokens": null,
  "duration_ms": null,
  "rework_rounds": 0,
  "human_intervention": false,
  "friction_ref": null
}
```

These are the M4 record-schema core fields (`execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`). Use `metrics/collector.mjs` — do not hand-write a raw jsonl line with only `skill/stage/event/ts`.
