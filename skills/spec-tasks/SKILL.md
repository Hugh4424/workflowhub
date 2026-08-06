---
name: spec-tasks
description: Convert frozen specification and plan content into readable, executable, dependency-ordered tasks.
---

# Spec Tasks

Receive frozen `spec.md` and `plan.md` plus one controlled artifact writer from
build-plan. Write only named artifact `tasks.md`; return counts and
FR/task/AC mappings as structured content facts.

Do not locate artifacts, infer task/repository identity, accept root/path/cwd
parameters, or add host-specific tracker conventions. Use the accepted plan's
exact files, anchors, interfaces, Phase order, test commands, and STOP
conditions. Never rediscover or redefine product requirements.

## Artifact responsibility

`tasks.md` is a compact executable projection, not a second plan: each card
states its input, output, exact files, boundary, dependency, execution gate,
and failure handling. It references product and engineering decisions instead
of restating their rationale. `spec.md` remains behavior truth and `plan.md`
remains the engineering evidence dossier.

It is also the only Task completion authority. Every card ends with one
`执行状态填写区（唯一完成权威）`. The executor, not the runtime, changes that
area after implementation, focused tests, and Phase review. A completed claim
must include the checked box, `status: completed`, actual changes, commands and
exit codes, non-empty task-relative canonical evidence ref/SHA-256 bindings,
covered ACs, review fact, and completion time. Missing or contradictory fields
remain `pending`/`in_progress`. Accepted records, receipts, traces, reopen
records, generations, and audits never create another completion state.

After review, a tasks-only completion update may change only the corresponding
status area. The next Phase or final integration certifies that seam without
repeating the Phase review. Final build-code certifies all Task rows; verify-code
independently rechecks the same rows against current code, tests, AC evidence,
and review facts.

## Reading contract

Use `templates/tasks-template.md`. Keep AgentHub's short Phase checklist and one
flat task card; do not add five-level identity/traceability/execution headings.
The field order still reads as identity, traceability, execution, then
verification/failure. Generated Markdown contains no template comments,
placeholders, empty headings, empty tables, or filler. Use
`N/A — {task-specific reason}` only when a field is genuinely not applicable.

## One authoritative task card

Do not produce a “13 fields” card plus a second v2 supplement. Each task has one
authoritative card containing:

- **Identity**: stable ID, owning Phase, one observable goal, and
  `design_state` (`ready` or `blocked-by-design`);
- **Traceability**: complete `versioned_refs`
  (`artifact_kind`/`ref`/`hash`/`id`), inputs, dependencies, parallel status and
  reason, FR IDs, and AC IDs;
- **Execution**: one behavior change, exact files, boundary, output, and minimum
  Knowledge;
- **Verification and failure**: verification role and paired task, executable
  `gate_cmd`, `expected_exit`, observable oracle identity/result,
  task-relative evidence path, STOP, recovery, and task risk.
- **Execution status**: the one completion checkbox/status area and its
  authenticated implementation/test/review evidence.

This single card preserves every legacy execution field and every v2 field.
One card changes at most one behavior. Missing or stale bindings stop execution;
they are never repaired by repository scanning.

## Phase and file authority

Every Phase repeats `Goal`, `Files`, `Tasks`, `Verify`, `Knowledge`, `STOP`,
`Done`, and `Risks and rollback`.

Copy the accepted plan's Phase name and Files block byte-for-byte.
`Phase.Files` is the only file authority. A task's exact files and boundary are
subsets of its Phase NEW/MODIFY files. Every planned change has one owning task;
no task may widen the boundary. Paths are exact; wildcards are forbidden.

## Ordering and traceability

- Dependencies name existing earlier tasks.
- The dependency graph is acyclic.
- `[P]` is allowed only when dependencies, inputs, and file ownership are
  independent.
- Every accepted FR maps to at least one task and AC.
- Every task maps back to valid FR and AC IDs.
- `tasks.md` has one authoritative FR → task → AC → gate/evidence table.

PFACT prose remains authoritative only in bound `spec.md`. Tasks reference the
accepted PFACT/FR/AC identities through complete versioned bindings instead of
copying product prose.

## RED / GREEN

A behavior change starts with a real RED task before implementation:

- RED `expected_exit` is any explicit non-zero integer;
- GREEN `expected_exit` is `0`;
- RED and GREEN use the same behavioral `gate_cmd` and oracle identity;
- RED evidence proves the intended assertion failed, not that setup or the
  command itself broke;
- GREEN proves that assertion passes while named negative cases remain guarded.

Use `verification_role: N/A — non-behavior change: {reason}` only for a task
that changes no behavior. Its `paired_task` also uses `N/A — {reason}`, its
`expected_exit` is `0`, and it still provides a real executable `gate_cmd`,
observable `oracle`, and task-relative `evidence_path` proving the
non-behavior result. Never use N/A to bypass RED/GREEN for a behavior change.

Do not use text inspection instead of behavior when a real helper, validator,
CLI, schema, or runtime path exists. A schema/hash validator is a valid minimal
oracle when schema/hash behavior is the target.

Commands must be verified real commands. Do not emit prose as a command, invent
flags, hide a gate exit code in a display pipeline, or prescribe broad testing
by default. `display_cmd` may summarize but never decide pass/fail.

## STOP, Knowledge, and compatibility

`Knowledge` records only verified facts needed for execution and never requires
a fixed path. Missing interfaces, failed RED, an undeclared dependency, a need
to weaken tests, file-boundary widening, or a new architecture choice triggers
STOP.

Legacy `## Stage N` and `(stage:N, depends:...)` syntax is read-only input.
Normalize it once into the current Phase/card/DAG model before validation.
Never publish both legacy and current dependency authorities.

## WorkflowHub execution-progress contract

`tasks.md` must contain one `## WorkflowHub Stage Progress` section with rows
for `build-code` and `verify-code`. The rows distinguish task execution status
from semantic quality status and name the current task/phase IDs, evidence
fact, handoff state, and next action. A completed task row does not make every
acceptance criterion pass.

Every task card records `Workflow stage` and `execution_file_paths`. The paths
are exact, non-glob paths derived from the card's authoritative `精确文件` and
must be a subset of the owning Phase NEW/MODIFY files. They are execution
traceability, not a second file boundary authority. Actual commands, exit
codes, evidence refs, actual outcome, and coverage limits are written in the
single completion area; missing canonical evidence remains `unknown` or
`incomplete`.

The high-intelligence `build-plan` model uses `test-routing-advisor` to choose
`simple|feature|fullstack` and the expected concrete testing skill for every
Phase and the final aggregate. It records scenarios, commands, oracles,
evidence paths and limits in the task cards; it does not invoke the concrete
testing skills or `testing-system-blueprint`.
`build-code` checks the real changed-file range, reroutes when that range
differs, then invokes the applicable `backend-testing`, `frontend-testing`, or
`fullstack-slice-testing` skill and appends facts. It does not invent product
requirements or acceptance oracles, and review/commit/full-suite status is not
a hidden progression gate. `verify-code` independently replays the same
task/AC paths and reports the semantic result.

Every task also carries compact `source_refs` / `decision_refs` inherited from
the plan's FR/AC row. This is a relation index only: product wording remains in
`decision-log.md` and `spec.md`; tasks must not invent a requirement, silently
drop a deferred/non-goal status, or use a task completion checkbox as semantic
proof. A scope-revision task updates only the affected mappings and direct
execution paths, then records the one dedicated review fact.
