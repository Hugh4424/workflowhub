---
name: spec-tasks
description: Project the current plan into compact, dependency-ordered implementation cards.
---

# Spec Tasks

Read the current `decision-log.md`, `spec.md`, and `plan.md`. Write only
`tasks.md`. Product behavior remains in `spec.md`; engineering choices,
boundaries, risks, rollback, and the authoritative mapping remain in `plan.md`.
`tasks.md` remains the sole current material for task-card details.

Use `templates/tasks-template.md`. Generated cards contain real values, not
authoring comments, empty sections, or copied rationale. A task card is an
execution design and a compact current work record; it is not a second runtime
or evidence store.

## Card contract

Each task has one stable heading and one card containing the current v3
structural fields in this order: `ID`, `Phase`, `goal`, `design_state`,
`versioned_refs`, `source_refs / decision_refs`, `输入`, `依赖`, `并行`, `FR`, `AC`, `动作`, `精确文件`,
`boundary`, `输出`, `Knowledge`, `verification_role`, `paired_task`,
`gate_cmd`, `expected_exit`, `oracle`, `evidence_path`, `STOP`, `recovery`,
and `task risk`. Every card also requires its test-design fields: `test tier /
test method`, scenarios, fixtures, and coverage limits. These are facts for
execution, not another authority.

The card ends with one `执行状态填写区（唯一完成权威）` containing `status`,
actual changed files, commands and exits, evidence refs, covered ACs, review
fact, completion time, and human-readable `执行事实`. `执行事实` is one
append-only factual text field: build-code owns execution facts; build-plan or
verify-code may append a clearly labeled planning/human-alignment fact, but no
writer may rewrite `status`, actual changes, commands, evidence, covered ACs,
review fact, or completion time. Only the executor changes `status`
(`pending`, `in_progress`, or `completed`). A completed card
names actual changed files, commands and exits, affected AC results, evidence
references, review facts or truthful unavailable status, and the plain-language
handoff. A status value is descriptive; it does not authorize work, block
repair, or replace test and review evidence.

The checkbox beside `status` is only its synchronized Markdown rendering: it
must agree with `status`, and neither is an independent completion authority.
Neither may be used as a work permission or same-task repair gate.

Do not add workflow summaries, host communication fields, or a second
completion ledger. Keep one current task card representation.

For each phase defined by `plan.md`, `tasks.md` has one required Phase block
before that phase's cards. The block contains exactly `Goal`, `Files`, `Tasks`,
`Verify`, `Knowledge`, `STOP`, `Done`, and `Risks and rollback`. `Files`
restates the owning plan phase boundary for reading only;
`plan.md` remains authoritative, and any mismatch is a STOP back to `plan.md`.
The block summarizes one implementation phase; it is not a new stage, progress
store, or runtime state object.

For a small single-behavior change, project one Phase with one RED/GREEN pair
and one FINAL aggregate card. Keep the required card shape, but use
`N/A — reason` for fields that are truly not applicable. Do not create dummy
cards or phases merely to satisfy the example template; fullstack work may
split into more cards only when the dependency and file boundaries are real.

## Projection rules

- Copy task IDs, dependencies, exact files, and FR/AC mapping from `plan.md`.
- Keep the dependency graph acyclic and explain every serial edge.
- One card owns one behavior or one tightly bounded non-behavior result.
- Parallel cards require independent inputs, dependencies, and files.
- Every current FR and AC appears in at least one card, and every traced card
  maps back to a current source/decision and valid plan row.
- The final aggregate check is one ordinary task card, not a new workflow stage.
  Its `gate_cmd` and oracle identity must match the final current-snapshot
  aggregate strategy's command and oracle; this is one route, not a second authority.

`versioned_refs` are derived from the current `spec.md` and `plan.md`. Full
authoring regeneration recomputes every card. A tasks-only completion write
may refresh only seam-authorized target cards; stale references on non-target
cards remain visible as a finding/error and are never silently rewritten or
used to widen the seam.

The task's `精确文件` boundary is copied byte-for-byte from its plan row and
must be an exact subset of the owning Phase `Files` boundary. Do not copy the
whole Phase boundary into every card. If a required file or interface is
unknown, say so and STOP rather than widening the boundary by guesswork.

## Verification design

Build-plan designs RED/GREEN and does not run commands. For a behavior change:

- RED is a non-zero result caused by the target assertion, not setup failure;
- GREEN uses the same `gate_cmd` and oracle identity, expects `0`, and retains
  the named negative behavior;
- both record a task-relative `evidence_path` and the signal build-code must
  preserve;
- `display_cmd` is optional and never decides the result.

For a non-behavior task, use `role=N/A` with a factual reason, an executable
command, `expected_exit=0`, and a real oracle. Do not use N/A to avoid testing a
behavior change.

Testing-system-blueprint supplies risk dimensions, scenarios, oracle, evidence,
and coverage limits. Test-routing-advisor selects the applicable concrete skill.
Actual `backend-testing`, `frontend-testing`, or `fullstack-slice-testing` runs
belong to build-code, not this design skill.

## Evidence and quality boundary

`tasks.md` records the intended evidence path and later references the facts
actually produced under the task's quality area. It is not a permission to
start or continue work, and it does not copy command
output, a review document, a provider response, or a second progress ledger.

Tests, reviews, research, and history remain honest facts. `unknown`,
`unavailable`, and `incomplete` are valid recorded outcomes; they cannot be
rewritten as success, and they do not prevent same-task repair. Findings are
disposed as `fixed`, `rejected_invalid`, `accepted_risk`, or `needs_human`.

## STOP

STOP when a command is not executable, RED fails during setup, GREEN weakens the
accepted assertion, a dependency is missing, an exact file falls outside the
plan, or implementation requires a new product or architecture decision.
Return to the owning material. Do not create a replacement card or a hidden
state object to bypass the stop condition.
