---
name: build-code
description: Implement each task phase by phase using TDD, collecting RED and GREEN evidence for every phase.
---

# build-code

## Goal

Implement the change described by the upstream stage-result. The upstream may be `build-plan` (full path) or `make-decision` directly (slim path — small tasks that skip design and planning). Read the upstream `stage-result` first and consume its `facts` keys to understand scope and constraints.

Each phase follows a strict RED → implement → GREEN cycle. No phase is done without both evidence files.

## What to do

### 1. Read upstream stage-result

Read the `stage-result` produced by the previous stage and extract the relevant `facts`:

- If upstream is **`build-plan`**: read `facts.plan_ref` and `facts.tasks`, then read `tasks.md` for the phase list.
- If upstream is **`make-decision`** (slim path): read `facts.decision` and `facts.scope` — derive implementation work directly from these. `tasks.md` and `plan.md` do not exist on the slim path.

### 2. TDD cycle per phase

For each implementation unit:

1. **Write tests first** — ensure they fail (RED) before writing any implementation code.
2. Collect RED evidence (failing test run output) before writing implementation.
3. Implement the minimum code needed to make the tests pass.
4. Collect GREEN evidence (passing test run output) after implementation.
5. Do not advance to the next unit until the current one is GREEN.

### 3. Record

Record what changed (facts key: `changed`) and the test outcome (facts key: `tests`).

## Produce a stage-result

When all phases are complete, write a `stage-result` record with:

```json
{
  "status": "success",
  "error_code": "",
  "retryable": false,
  "facts": {
    "changed": "<comma-separated list of changed files or modules>",
    "tests": "<number of tests passing, e.g. 42/42>"
  },
  "missing_items": [],
  "user_decision": false,
  "reason": "All phases implemented with RED→GREEN evidence."
}
```

Also record a metrics entry via the collector. Call `recordSkeleton` at stage start and `updateOwnResult` at stage end, passing at minimum:

```json
{
  "execution_id": "<uuid>",
  "skill_or_stage": "build-code",
  "stage": "build-code",
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
