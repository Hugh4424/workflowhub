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

## Reading contract

Use `templates/tasks-template.md`. A human should scan each task as four short
blocks: identity, traceability, execution, and verification/failure. Generated
Markdown contains no template comments, placeholders, empty headings, empty
tables, or filler. Use `N/A — {task-specific reason}` when a field is genuinely
not applicable.

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
`expected_exit` is `0`, and its executable gate proves the non-behavior result.
Never use N/A to bypass RED/GREEN for a behavior change.

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
