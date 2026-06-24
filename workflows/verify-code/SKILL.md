---
name: verify-code
description: Run a full verification pass against the spec acceptance criteria and produce a final test report and verdict.
---

# verify-code

## Goal

Confirm that the implementation satisfies every acceptance criterion in the spec. Produce a final test report and an explicit pass/fail verdict before the change is considered deliverable.

## Scope boundary: verify-code vs verify-change

**`verify-code`** is this skill — stage 5, test-acceptance. It reads the spec's acceptance criteria and the implementation produced by `build-code`, runs the test suite, and writes `final-test-report.md` and `test-acceptance/summary.md`.

**`verify-change`** is a different concept — it refers to verifying a diff at code-review time (e.g. checking whether a proposed change is safe to merge). That is not this skill's responsibility. Do not conflate the two: `verify-code` checks whether the code meets the spec, not whether the diff is reviewable. If you are asked to "verify the change", confirm which meaning is intended before proceeding.

## What to do

1. Read the spec acceptance criteria (chapter 10 or equivalent) and the test designs from each phase in tasks.md.
2. Execute each acceptance criterion in order — do not skip any.
3. Run the full test suite and record the outcome.
4. Produce `final-test-report.md`: one row per criterion, result (pass/fail), and evidence (command output, screenshot, or log snippet).
5. Write `test-acceptance/summary.md` with an overall verdict and any outstanding issues.
6. If any criterion fails, document it clearly — do not mark the stage as success while failures remain.
7. Record the overall verdict (facts key: `verdict`) and the evidence location (facts key: `evidence_ref`).

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
