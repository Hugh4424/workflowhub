---
name: verify-code
description: Run a full verification pass against the spec acceptance criteria, produce a final test report and verdict, and run an independent 3rd-review audit before stage-result commit.
---

# verify-code

## Goal

Confirm that the implementation satisfies every acceptance criterion in the spec. Produce a final test report and an explicit pass/fail verdict before the change is considered deliverable.

## Scope boundary: verify-code vs verify-change

**`verify-code`** is this skill — stage 5, test-acceptance. It reads the spec's acceptance criteria and the implementation from `build-code`, runs the test suite, and writes `final-test-report.md` and `test-acceptance/summary.md`.

**`verify-change`** is a different concept — verifying a diff at code-review time (checking whether a proposed change is safe to merge). That is not this skill's responsibility. `verify-code` checks whether the code meets the spec; `verify-change` checks whether the diff is reviewable. If you are asked to "verify the change", confirm which meaning is intended before proceeding.

## What to do

### 1. 阶段开始 trace

Before any other verify-code step, append one JSON line to
`evidence/stage-summary.jsonl`:

```json
{"event":"stage_summary","phase":"start","ts":"<ISO8601>"}
```

Write this inline from this workflow step; there is no separate stage-summary
skill. The exact first-line payload must include `"event":"stage_summary"` and
`"phase":"start"` so the execution trace is machine-checkable.

### 2. 前置读取

**Path resolution (FR-TASKDIR-001)**: Resolve all task-dir paths via `parseTaskDir` — do not hard-code `tasks/{task-id}/`.

```javascript
// AC-16 consumable call — grep: parseTaskDir
import { parseTaskDir } from "./core/task-dir-parser.mjs";
const taskDir = parseTaskDir(); // reads config/workflowhub.yaml task_dir, falls back to ~/Knowledge/workflowhub/
```

Read `{taskDir}/{task-id}/stage-result-build-code.json`, extract `facts.tests.command`. If the command field is missing, surface an explicit error and stop. Do not proceed silently without a test command.

Also read the task spec metadata for `ui_change`, `risk_level`, and
`no_browser_test: true`. The `no_browser_test: true` flag is the only skip-trace
marker that suppresses missing L3 report alarms for non-UI work.

### 3. metrics 开始

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

### 4. fresh 测试执行

Call `node workflows/verify-code/capture.mjs` with the command extracted in step 1. Write the evidence to `{taskDir}/{task-id}/evidence/fresh-capture.json` (path resolved via `parseTaskDir` — see step 1). The capture script records: exit code, git SHA, Test Files line, content hash, timestamp, and command — all durable, externally-verifiable facts.

Treat this run as the L1/L2 evidence source for the follow-up test-strategy
step. Preserve the command output summary and any AC references from the L2
report or fresh capture so they can be passed to the independent strategy
sub-agent.

### 5. 鲜度校验

Call `freshness.mjs` `checkFreshness` to compare the build-code git_sha against current HEAD. If `anomaly_flags` is non-empty, output visible warnings at the skill boundary (FR-FRESH-004). The `stale_sha` anomaly is informational only — it does not block or change the verdict.

Also call the phase-1 freshness expansion (`checkEvidenceFreshness`) with the
phase report, RED report, GREEN report, L2 report, and any available L3 report.
Pass the spec skip flag as `noBrowserTest` (or `skipL3`) when metadata contains
`no_browser_test: true`; in that case freshness records an informational
`intentional_skip` for `l3-iron` and must not add a missing L3 report to
`mtime_violations[]`. It must use the same `git_sha + content_hash` cross-check
semantics as `freshness.mjs` and write/read `mtime_violations[]`. Any violation
in segments 1/2/3/4 or non-skipped `l3-iron` is a D7 red condition.

### 6. test-strategy 子代理与机器核查

After L1/L2 evidence exists and before trace-check or L3, invoke
`skills/test-strategy/SKILL.md` as an independent sub-agent. Provide:

- `ui_change`: boolean from spec metadata or explicit UI acceptance evidence.
- `risk_level`: `low | medium | high` from the task metadata or build-code
  facts.
- L2 report summary: concise fresh-capture/L2 findings, including AC IDs,
  coverage gaps, failures, and skipped items.

The sub-agent must write `test-strategy.md` in the current task evidence
directory. The file must include YAML front-matter with `ac_routes`.

Immediately after the sub-agent returns, run a machine check:

1. Read the authoritative spec AC list.
2. Parse `test-strategy.md` YAML front-matter.
3. For every spec AC ID matching `^AC-\d+$`, require a route in `ac_routes`.
4. Require every route value to be `P0`, `P1`, `P2`, `P3`, or `skip`.
5. Require every key in `ac_routes` to exist in the spec AC list.

Failure lines are fixed and must be emitted exactly:

- `MISSING_ROUTE: {AC_ID} has no route in test-strategy.md`
- `UNKNOWN_AC: {AC_ID} not found in spec AC list`

`test-strategy 机器核查失败` is a D7 red trigger. A sub-agent timeout or missing
`test-strategy.md` is yellow and maps to `unknown` unless a separate red
condition is present.

### 7. trace-check 查痕

After test-strategy machine checking and before browser/L3 execution, run
trace-check over `evidence/` and write `trace-check-report.json`.

The trace-check logic must scan each required phase report and check:

1. The report file exists.
2. `exit_code == 0`.
3. `git_sha + content_hash` cross-validation matches the same freshness logic
   used by `freshness.mjs`.
4. The evidence is correlated to this run by either a current journal reference
   or by the `capture.mjs 调用链`.

`trace-check-report.json` must include:

```json
{
  "missing_ac_coverage": [],
  "checked_phases": [],
  "violations": []
}
```

Each violation should carry enough machine-readable detail for D7, including
the AC ID when known, reason, file path, and observed exit code. If spec metadata
contains `no_browser_test: true`, trace-check must record that skip fact and not
add a missing L3 report to `missing_ac_coverage`. Without `no_browser_test:
true`, a missing required L3 report contributes to `missing_ac_coverage`.

### 8. 浏览器验收

Determine if the task has UI acceptance items. Check the spec for `ui_change: true` or explicit browser/QA acceptance criteria.

- **No UI items**: SKIP browser acceptance. Record in `missing_items`: `"browser-acceptance: no UI acceptance items"`. If the spec also contains `no_browser_test: true`, trace-check must treat the missing L3 report as an intentional skip.
- **UI items exist**: Directly invoke the existing isolated-browser-qa skill via `workflows/verify-code/isolated-browser-qa.md`. Do not modify or replace the browser engine. Store screenshots under `evidence/screenshots/` and require the machine-readable report at `l3-e2e-report.json`. The report must include `git_sha` and `flaky_failure`.

After L3 completes, enforce the L3 iron law by reading `l3-e2e-report.json` and
call `freshness.mjs` `checkL3IronLaw` with that report and the current HEAD.
The required operation is: append the returned `segment: "l3-iron"` record into `mtime_violations[]` before the stage-result color decision. If `l3-e2e-report.json` is missing when L3 is required, append `segment: "l3-iron"` with `reason: "missing_report"` to `mtime_violations[]`. Any L3 git_sha mismatch or non-skipped missing L3 report
is a red condition. If `flaky_failure` is `true` and no red condition is
present, classify the result as yellow.

### 9. 明文停顿 (收尾确认)

List the irreversible actions that will be taken if the user confirms:

- Merge the target branch (e.g., `main`)
- Delete the feature branch

Wait for explicit user confirmation before proceeding (FR-CLOSE-001/003). Do not execute merge or delete without user consent.

### 10. 收尾执行

- **User confirms**: Execute the merge and branch deletion. Set `user_decision=true`.
- **User rejects**: Set `user_decision=false`, skip all irreversible operations, continue to step 11 (which will skip 3rd-review) and then step 12 to write the stage-result with the rejection reason (FR-CLOSE-002). Do not exit early.

### 11. 3rd-review 独立审查

After step 10 completes (user confirmed or rejected), and only when `user_decision=true`, invoke the **3rd-review standalone entry** as an independent subagent. Feed it the full `git diff` of all files changed during this verify-code run.

**Dispatch rules:**
- Run in a separate subagent context (independent from the coordinator).
- Pass: changed file list, `worktree_root`, task context, and the path `{taskDir}/{task-id}/reviews/verify-code.md` as the output artifact path.
- Explicitly forbid `git commit` in the subagent instruction.

**When `user_decision=false`** (user rejected in step 10): skip 3rd-review entirely. Record `buildReviewFact({ status: "not_executed" })` and proceed directly to step 12 to write the stage-result with `user_decision=false`. Do not exit without writing stage-result.

**Verdict handling** (only reached when `user_decision=true`):

| Verdict | Action |
|---|---|
| `pass` | Proceed to step 12 (stage-result 落盘). |
| `revise_required` | Surface findings to user. Record `missing_items` entry. Do not write stage-result yet. Agent or user fixes the flagged items, then rerun verify checks (steps 4–8) and rerun 3rd-review. After N=2 failed rerun rounds with no resolution, escalate to human and set `needs_human=true`. |
| `escalate_to_human` | Surface findings immediately. Set `needs_human=true`. Do not write stage-result until human confirms resolution path. |

If 3rd-review skill is unavailable or unreachable, downgrade gracefully: record `buildReviewFact({ status: "not_executed" })` with a visible warning in the stage-result. Do not block on unavailability.

Record the review outcome in `facts.review` using `buildReviewFact` from `facts-schema.mjs`:

```js
import { buildReviewFact } from "./facts-schema.mjs";
// review ran:
const reviewFact = buildReviewFact({
  status: "executed",
  source,          // "third_party" | "same_source"
  verdict,         // "pass" | "revise_required" | "escalate_to_human"
  artifactPath: `{taskDir}/{task-id}/reviews/verify-code.md`
});
// review skipped (user_decision=false) or unavailable:
// const reviewFact = buildReviewFact({ status: "not_executed" });
```

Write `reviewFact` into the stage-result under `facts.review` in step 12. Because `assembleStageResult` does not accept `review` as a parameter, explicitly merge it after assembly: `stageResult.facts.review = reviewFact` before calling `writeStageResult`.

### 12. stage-result 落盘

Call `facts-assembly.mjs` `assembleStageResult` + `writeStageResult`. Write the stage-result to `{taskDir}/{task-id}/stage-result-verify-code.json` (FR-PATH-001). The `final-test-report.md` goes to `{taskDir}/{task-id}/test/` (FR-PATH-002). Both paths resolved via `parseTaskDir` — see step 1.

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

D7 color semantics must stay compatible with the current stage-result contract:
use `success|failed|unknown`, not new status enum values. Never write `green`, `yellow`, or `red` to `stage-result.status`.

- all checks pass -> `success`
- yellow condition -> `unknown`
- red condition -> `failed`

The color decision is a machine-hard-condition evaluation only, not an LLM
judgment. Red conditions include any freshness segment `content_hash` mismatch,
L3 git_sha mismatch, non-skipped missing L3 report, `missing_ac_coverage[]`
containing a critical AC, and `test-strategy 机器核查失败`. Yellow conditions
include `flaky_failure=true`, a test-strategy timeout or missing
`test-strategy.md`, or explicitly non-critical missing coverage when no red
condition exists. A browser-acceptance SKIP due to no UI scope in the spec is
not a yellow condition — it is a scope exclusion (recorded in `missing_items`
for traceability only) and does not change the color; if all other checks pass,
the result is `success`. unknown/yellow does not block progression by itself and does
not auto-approve irreversible actions. failed/red escalates for human confirmation and waits; do not automatically continue past a failed/red result.

### 13. metrics 结束

Call `updateOwnResult` to finalize the metrics record, then call `import("./metrics-writer.mjs").then(m => m.runMetricsWriter({ taskDir, taskId, verdict, executionId }))` to record task-metrics.jsonl for M10 baseline comparison. Metrics write failure only warns — it does not throw (FR-METRICS-002, F3).

### 14. 阶段结束 trace

After the stage-result and metrics end steps, append the final JSON line to
`evidence/stage-summary.jsonl`:

```json
{"event":"stage_summary","phase":"end","ts":"<ISO8601>"}
```

Then machine-validate the trace file: `stage_summary 行数必须等于 2`; 第 1 行 `phase` 必须是 `start`，第 2 行 `phase` 必须是 `end`. A count or ordering mismatch is a visible quality fact in the final report.

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

> **M10 wiring**: After calling `recordSkeleton` and `updateOwnResult`, also call `../../workflows/verify-code/metrics-writer.mjs` `runMetricsWriter({ taskDir, taskId, verdict, executionId })` to record task-metrics.jsonl for baseline comparison (FR-COLL-001).

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
