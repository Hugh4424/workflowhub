---
name: make-decision
description: Clarify requirements with the user, then produce a decision log that captures the agreed direction and scope.
---

# make-decision

## Goal

Work with the user to surface the real problem, agree on the narrowest viable scope, and capture every significant choice in the decision log. The output is the single authoritative source for what the change is trying to do and why.

## What to do

1. Research the current landscape (existing code, docs, constraints) before asking questions.
2. Ask focused questions to pin down: what is broken or missing, who is affected, what the smallest deliverable is, and what the biggest unknowns are.
3. Propose a direction in plain language — what will change, why, and what "done" looks like.
4. Wait for the user to confirm the direction before moving on.
5. Capture every decision in the decision log (facts key: `decision`). Record the agreed scope (facts key: `scope`).

## Produce stage-result

When the stage is complete, write a `stage-result` record with:

```json
{
  "status": "success",
  "error_code": "",
  "retryable": false,
  "facts": {
    "decision": "<one-sentence summary of the agreed direction>",
    "scope": "<brief description of what is in scope and what is explicitly excluded>"
  },
  "missing_items": [],
  "user_decision": true,
  "reason": "User confirmed direction and scope."
}
```

Also record a metrics entry via the collector. Call `recordSkeleton` at stage start and `updateOwnResult` at stage end, passing at minimum:

```json
{
  "execution_id": "<uuid>",
  "skill_or_stage": "make-decision",
  "stage": "make-decision",
  "skill_version": "1.0.0",
  "executed": true,
  "tokens": null,
  "duration_ms": null,
  "rework_rounds": 0,
  "human_intervention": true,
  "friction_ref": null
}
```

These are the M4 record-schema core fields (`execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`). Use `metrics/collector.mjs` — do not hand-write a raw jsonl line with only `skill/stage/event/ts`.
