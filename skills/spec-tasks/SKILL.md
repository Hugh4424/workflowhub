---
name: spec-tasks
description: Render the post-cohort execution index from the sole phase engineering authority.
---

# Spec Tasks

For post-cohort tasks, read the accepted `decision-log.md`, `spec.md`, and the
phase engineering authority produced by `spec-plan`. Write only `tasks.md` as a
pure pointer index. It is not a task-card generator, second engineering body,
execution receipt, progress ledger, or completion authority.

## Authority boundary

- `decision-log.md` owns decisions, source declarations, and confirmed bindings.
- `spec.md` owns product behavior and Appendix A acceptance criteria.
- the phase engineering authority owns every L0/L1/L2 body, task procedure,
  exact file boundary, command, oracle, evidence path, STOP, dependency, and
  rollback decision.
- `tasks.md` may contain only the authority ref, semantic anchor, write set,
  dependency, and real consumer for each phase.

Never copy phase prose, RED/GREEN cards, `gate_cmd`, `expected_exit`, `oracle`,
`evidence_path`, a checklist, or an execution status into the index. A reader
follows the stable authority ref and semantic anchor to consume that information.
If the phase authority is missing or ambiguous, report `unavailable` with its
owner; do not manufacture a second body or a compatibility dual write.

## Rendering rules

1. Emit the template's one execution-index table.
2. Each row maps one phase identifier to one authority ref and semantic anchor.
3. `write set` is the exact declared phase boundary, never a glob or copied
   implementation narrative.
4. `dependency` names only phase IDs; `consumer` names the real downstream
   reader. Missing values use `N/A — reason`.
5. Preserve historical pre-cohort cards as read-only input only; do not convert
   them into active post-cohort output.

Return the rendered row count and any unavailable authority reference. Do not
run commands, create a control object, or write another material.
