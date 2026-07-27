---
name: spec-tasks
description: Convert frozen specification and plan content into executable dependency-ordered tasks.
---

# Spec Tasks

Receive frozen `spec.md` and `plan.md` plus one controlled artifact writer from
build-plan. Write only named artifact `tasks.md`; return counts and
FR/task/AC mappings as structured content facts.

Do not locate artifacts, infer task/repository identity, accept root/path/cwd
parameters, or add host-specific tracker conventions. Use the accepted plan's
exact files, anchors, interfaces, Phase order, test commands, and STOP
conditions. Never rediscover or redefine product requirements.

## Required task contract

Use `templates/tasks-template.md`. Every Phase repeats `Goal`, `Files`, `Tasks`,
`Verify`, `Knowledge`, `STOP`, `Done`, and `Risks and rollback`. Every task has
exactly these 13 execution fields:

1. stable ID;
2. action;
3. exact files;
4. input;
5. output;
6. dependency task IDs;
7. parallel status and reason;
8. FR IDs;
9. AC IDs;
10. executable `gate_cmd`;
11. `expected_exit`;
12. observable oracle;
13. task-relative evidence path.

Behavior changes must place a real failing test before implementation and reuse
the same behavioral oracle for GREEN. Do not use text inspection as a substitute
for behavior when a real helper, validator, CLI, or runtime path exists.

## Ordering and coverage

- Every dependency names an existing earlier task unless both tasks are
  explicitly independent parallel work.
- The dependency graph is acyclic.
- `[P]` is allowed only for independent files and inputs.
- Every accepted FR maps to at least one task and AC.
- Every task maps back to valid FR and AC IDs.
- Every planned file change has an owning task; no task may widen a Phase file
  boundary.

Commands must be verified real commands. Do not emit prose as a command,
invent flags, hide a gate exit code in a display pipeline, or prescribe broad
testing by default. Use the narrow accepted command and add only regressions
justified by a named compatibility boundary.

In v2, each task card is authoritative for `Phase`, `goal`, complete
`versioned_refs` (`artifact_kind`/`ref`/`hash`/`id`), `Knowledge`, `boundary`,
`action`, test/acceptance command, `design_state` (`ready` or
`blocked-by-design`), `STOP`, `recovery`, and task risk. Missing or stale
bindings stop execution; they are never repaired by scanning the repository.

`Knowledge` records verified facts needed for execution. It never requires a
fixed path. `None` requires a factual reason. Missing interfaces, failed RED,
an undeclared dependency, a need to weaken tests, or a new architecture choice
triggers the Phase `STOP`.
