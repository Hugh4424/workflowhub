---
name: build-plan
description: Break the spec into an ordered implementation plan and a task list that developers can execute phase by phase.
---

# build-plan

## Goal

Take the spec from `build-spec` and decompose it into a concrete plan (plan.md) and a sequenced task list (tasks.md). The plan is the bridge between requirements and code.

## What to do

1. Read the spec in full. Read the decision log for any constraints the spec may not capture.
2. Identify all files and modules that will be touched. For deletions or renames, scan for every reference in code, config, tests, and docs.
3. Write `plan.md`: rationale, affected files, implementation order, commit boundaries.
4. Write `tasks.md`: one entry per phase, each with Goal, Files, Tasks, Verify steps.
5. Every task must reference at least one FR from the spec.
6. Check the plan against any list of forbidden files before finalising.
7. Apply the F10 anti-over-engineering gate (see below) before finalising plan.md and tasks.md.
8. Record the plan location (facts key: `plan_ref`) and a summary of tasks (facts key: `tasks`).

## F10 Anti-over-engineering gate (apply before finalising plan.md / tasks.md)

For every new mechanism, validation, CI check, gate, schema, dependency, or automation proposed in the plan, answer all four questions. If you cannot answer all four, remove it from the plan.

1. **What real threat does this defend against?** — Name a specific, observed failure mode. Hypothetical threats do not justify new infrastructure.
2. **Does any existing mechanism already cover it?** — Prefer what already exists. Adding a second mechanism for the same problem doubles the maintenance surface.
3. **Can it be bypassed, making it security-theatre?** — If the bypass is trivial, the mechanism is not protecting anything real.
4. **What is the long-term maintenance cost?** — Every task added to the plan will need to be maintained. If the cost exceeds the benefit, exclude it.

If the answer to question 1 is "none in particular" or the answer to question 4 is "high and ongoing", remove the item from the plan before finalising.

This gate reflects constitution rule F10. The cautionary example is a predecessor system that accumulated ~95,000 lines of gate code pursuing "machine-verifiable everything", spending ~50% of commits fixing the gates themselves — with over a dozen recorded deadlocks and a dedicated "gate-repair toolbox". Plan tasks for real work, not to feed automation for its own sake.

## Produce a stage-result

When the stage is complete, write a `stage-result` record with:

```json
{
  "status": "success",
  "error_code": "",
  "retryable": false,
  "facts": {
    "plan_ref": "<relative path to plan.md>",
    "tasks": "<number of tasks or brief list of phase titles>"
  },
  "missing_items": [],
  "user_decision": false,
  "reason": "Plan and task list produced and self-checked against spec."
}
```

Also record a metrics entry via the collector. Call `recordSkeleton` at stage start and `updateOwnResult` at stage end, passing at minimum:

```json
{
  "execution_id": "<uuid>",
  "skill_or_stage": "build-plan",
  "stage": "build-plan",
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
