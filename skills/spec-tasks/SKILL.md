---
name: spec-tasks
description: Project the current plan into compact dependency-ordered implementation cards.
---

# Spec Tasks

Read the current `decision-log.md`, `spec.md`, and `plan.md`. Write only
`tasks.md`. Product behavior stays in `spec.md`; implementation choices,
boundaries, risks, rollback, and the authoritative task mapping stay in
`plan.md`.

Use `templates/tasks-template.md`. Generated Markdown has no template comments,
placeholders, empty headings, empty tables, filler, or copied rationale. Delete
sediment rather than preserving fields that do not help an implementer execute
the card.

## Card contract

Each task is one heading with a stable task ID followed by only these fields, in
this order:

1. `目标`;
2. `依赖`;
3. `精确文件`;
4. `动作`;
5. `验证`;
6. `证据`;
7. optional `Trace` containing source, FR, and AC IDs;
8. `STOP`;
9. `状态` (`pending`, `in_progress`, or `completed`);
10. `执行事实`.

Do not add workflow summaries, host communication fields, receipts, or a second
completion ledger. The two final fields are the smallest current execution
state needed to choose the next incomplete card. They remain inside the
authoritative `tasks.md` material.

Only the executor changes `状态`. `completed` requires `执行事实` to name the
actual changed files, commands and exits, affected AC results, evidence refs,
review fact or truthful `unavailable`, and handoff. Missing facts keep the card
`pending` or `in_progress`; prose, old receipts, or runtime history cannot mark
it complete.

## Projection rules

- Copy task IDs, dependencies, and exact files from the accepted plan mapping.
- Use exact file paths; no wildcards or directory-wide ownership.
- One card changes one behavior or produces one tightly bounded non-behavior
  result.
- Dependencies name existing earlier cards and form an acyclic graph.
- Parallel cards require independent inputs, dependencies, and files.
- `Trace`, when present, references IDs only. Every accepted FR and AC appears
  in the plan mapping and at least one card; every traced card maps back to valid
  source, FR, and AC IDs.

## Verification design

Build-plan designs RED and GREEN; it does not run their commands.

The `验证` field contains `role`, `paired_task`, executable `gate_cmd`, explicit
`expected_exit`, and a stable observable `oracle`. A behavior change starts with
a RED card before its GREEN card. The pair uses the same command and oracle;
RED expects a non-zero exit caused by the target assertion, and GREEN expects
`0` while named negative behavior remains protected.

The `证据` field contains a task-relative `evidence_path` and the signal that
build-code must record there. It is a design target, never a claim that the
command already ran.

For a non-behavior task, use `role=N/A` with a specific reason, `expected_exit=0`,
and a real command and oracle. Never use N/A to bypass RED/GREEN for a behavior
change.

## STOP

STOP when the command is not executable, RED fails for setup reasons, GREEN
would weaken the accepted assertion, a dependency is missing, an exact file
falls outside the plan boundary, or implementation requires a new product or
architecture decision. Return to the owning material instead of expanding the
card.
