---
name: scope-triage
description: Classify requirement text into in-scope and out-of-scope items, producing a structured scope verdict for downstream skills.
---

<!-- component skill — physically independent, can be invoked independently by foreman or subagent -->
<!-- source/origin: external-adapted; source path: packages/core/agenthub/skills/scope-triage/SKILL.md -->

# scope-triage

This is a **component skill**. It does NOT produce its own `stage-result`. The calling collector or foreman is responsible for writing all stage-level records. This skill produces only a scope verdict that the caller consumes.

## Goal

Read the incoming requirement text or upstream content and produce a clear scope verdict: which items are in-scope for the current change and which are out-of-scope (deferred or excluded). The verdict is the single authoritative answer to "what are we doing right now vs. not doing."

## Input

- Requirement text, user story, or upstream stage-result content (from `make-decision` or direct user input).

## Output — scope verdict

Return a structured verdict containing:

1. **in-scope** — an explicit list of items included in the current change.
2. **out-of-scope** — an explicit list of items deliberately excluded, with a brief reason for each.
3. **ambiguous** — items that need clarification before they can be placed in either bucket.

If any item is ambiguous, ask ONE focused question per ambiguous item before finalising the verdict. Do not assume.

## What to do

1. Read the input carefully. Identify every distinct deliverable, constraint, and assumption mentioned.
2. For each item, decide: in-scope / out-of-scope / ambiguous.
3. Resolve ambiguous items by asking the user the minimum necessary questions.
4. Output the final scope verdict in the structured form above.
5. Do NOT expand scope beyond what the input explicitly authorises (YAGNI).

## Metric record — caller responsibility

This skill does NOT write its own `stage-result`. The calling collector MUST write ONE independent metric record with `"stage": "scope-triage"` (never `"make-decision"`). Use `metrics/collector.mjs` — do not hand-write a raw jsonl line.

Call `recordSkeleton` at invocation start and `updateOwnResult` at completion, passing at minimum:

```json
{
  "execution_id": "<uuid>",
  "skill_or_stage": "scope-triage",
  "stage": "scope-triage",
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
