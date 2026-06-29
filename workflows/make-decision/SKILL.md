---
name: make-decision
description: Clarify requirements with the user, then produce a decision log that captures the agreed direction and scope.
---

# make-decision

## Goal

Work with the user to surface the real problem, agree on the narrowest viable scope, and capture every significant choice in the decision log. The output is the single authoritative source for what the change is trying to do and why.

## What to do

This stage inlines the logic of two component skills:

### Phase A — Scope triage (see `skills/scope-triage/SKILL.md` for full detail)

1. Research the current landscape (existing code, docs, constraints) before asking questions.
2. Ask focused questions to pin down: what is broken or missing, who is affected, what the smallest deliverable is, and what the biggest unknowns are.
3. Classify each candidate requirement as **in-scope** or **out-of-scope**:
   - In-scope: directly addresses the stated problem, within the user-confirmed effort boundary.
   - Out-of-scope: speculative, future-looking, or adds cost without fixing the stated problem (YAGNI).
4. Propose a direction in plain language — what will change, why, and what "done" looks like.
5. Wait for the user to confirm the direction before moving on.

### Phase B — Decision log (see `skills/decision-log/SKILL.md` for full detail)

Follow the canonical 7-section structure defined in `skills/decision-log/SKILL.md` exactly:

1. Converge the confirmed direction and scope into a structured decision log file.
2. Write the file to `tasks/<task>/decision-log.md` using the canonical 7 Chinese sections from `skills/decision-log/SKILL.md`:
   1. **原始需求（原文）** — verbatim user requirement text.
   2. **问题与目标** — the core problem being solved and the explicit goal.
   3. **决策记录** — one entry per decision; each entry MUST carry a non-empty `来源证据` field. The chosen direction maps to facts key `decision`.
   4. **假设** — explicit assumptions not stated in the requirement.
   5. **明确不做** — items explicitly excluded, with brief reason each. The in/out boundary maps to facts key `scope`.
   6. **开放问题** — items still ambiguous or awaiting approval.
   7. **验收标准** — acceptance criteria verifiable after implementation.
3. Record the path of this file as facts key `decision_log_path`.

## Produce stage-result

When the stage is complete, write a `stage-result` record with:

```json
{
  "status": "success",
  "error_code": "",
  "retryable": false,
  "facts": {
    "decision": "<one-sentence summary of the agreed direction>",
    "scope": "<brief description of what is in scope and what is explicitly excluded>",
    "decision_log_path": "tasks/<task>/decision-log.md"
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
