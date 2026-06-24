---
name: build-spec
description: Turn the agreed direction into a structured spec that is the single source of truth for requirements.
---

# build-spec

## Goal

Translate the decision log from `make-decision` into a full spec. The spec becomes the sole authority that later stages (plan, code, verify) refer to.

## What to do

1. Read the decision log and any existing platform constraints before writing.
2. Cross-check the proposed change against existing architecture documents. Call out any conflict in the spec under "non-goals" or "out of scope".
3. Write a spec with at minimum: core scenarios (Given/When/Then), functional requirements (FR), explicit non-goals, acceptance criteria, and affected areas.
4. Every requirement must have at least one scenario. Every acceptance criterion must be verifiable by hand or by a command.
5. Record the spec location (facts key: `spec_ref`) and a summary of requirements (facts key: `requirements`).

## F10 Anti-over-engineering gate (apply before finalising the spec)

Before writing any new mechanism, validation, CI check, gate, schema, dependency, or automation into the spec, answer all four questions. If you cannot answer all four, exclude it from scope.

1. **What real threat does this defend against?** — Name a specific, observed failure mode (not "it could happen"). If the threat is hypothetical, the mechanism is premature.
2. **Does any existing mechanism already cover it?** — Check what is already in the codebase, config, or workflow before proposing something new. Duplication is waste.
3. **Can it be bypassed, making it security-theatre rather than real protection?** — If yes and the bypass is trivial, the mechanism blocks only honest actors and costs more than it protects.
4. **What is the long-term maintenance cost?** — Every mechanism added here must be maintained across all future changes. If the cost exceeds the benefit, exclude it.

If the answer to question 1 is "none in particular" or the answer to question 4 is "high and ongoing", stop — do not write the mechanism into the spec.

This gate reflects constitution rule F10: automation and validation are added for real benefit, not to make things machine-checkable for its own sake. The cautionary example: a predecessor system chased "everything machine-verifiable" and accumulated ~95,000 lines of gate code with over a dozen recorded deadlocks. Do not repeat that pattern.

## Produce a stage-result

When the stage is complete, write a `stage-result` record with:

```json
{
  "status": "success",
  "error_code": "",
  "retryable": false,
  "facts": {
    "spec_ref": "<relative path to spec.md>",
    "requirements": "<comma-separated list of FR identifiers or one-line summary>"
  },
  "missing_items": [],
  "user_decision": false,
  "reason": "Spec written and cross-checked against platform constraints."
}
```

Also record a metrics entry via the collector. Call `recordSkeleton` at stage start and `updateOwnResult` at stage end, passing at minimum:

```json
{
  "execution_id": "<uuid>",
  "skill_or_stage": "build-spec",
  "stage": "build-spec",
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
