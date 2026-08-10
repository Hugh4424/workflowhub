---
name: spec-plan
description: Design a minimal implementation solution and executable test plan from the current specification.
---

# Spec Plan

Read the current `decision-log.md`, `spec.md`, and relevant repository facts.
Write only `plan.md`. The accepted specification owns product behavior; this
skill chooses the smallest engineering solution and does not reopen product
decisions.

Use `templates/plan-template.md`. Generated Markdown has no template comments,
placeholders, empty headings, empty tables, or filler. Keep each meaning in one
place and delete sediment instead of carrying old workflow fields forward.

## Plan contract

`plan.md` contains only:

1. the implementation solution;
2. exact file and interface boundaries;
3. ordered dependencies;
4. the test plan;
5. engineering risks;
6. rollback actions;
7. the task mapping.

Do not add workflow summaries, runtime state, execution history, or host
communication fields. Facts used to choose the solution belong inside the
relevant solution, boundary, dependency, risk, or test entry; do not create a
separate research ledger.

## Implementation solution and boundaries

- Describe the observable before/after and the selected implementation.
- Prefer reuse, then extension, then a new mechanism. Explain a new mechanism
  only when existing code cannot satisfy the accepted behavior.
- Name exact `NEW`, `MODIFY`, and `DO NOT TOUCH` files. No wildcards or
  directory-wide ownership.
- Record changed interfaces, data flow, compatibility limits, and external
  dependencies only when they affect implementation.
- Order producers before consumers. Parallel work is valid only when inputs,
  dependencies, and file ownership are independent.

## Test plan

Build-plan designs RED and GREEN; it does not run commands or require current
execution proof.

For every behavior change, define a paired RED and GREEN with:

- the same executable `gate_cmd` and stable oracle identity;
- explicit `expected_exit` values: RED is non-zero, GREEN is `0`;
- an observable result that distinguishes the target assertion from setup
  failure;
- a task-relative `evidence_path` describing where build-code will record the
  result.

Use the smallest command that proves the behavior. Add broader regression only
for a named compatibility risk. A display command may aid reading but never
decides pass or fail.

## Trace and task mapping

Keep one bidirectional mapping:

`decision/source IDs -> FR -> AC -> task ID -> gate/oracle`

Every accepted FR and AC maps to at least one task. Every task maps back to
valid source, FR, and AC IDs. Each task row names its dependencies and exact
files so `tasks.md` can project the same boundary without inventing scope.

## Risks and rollback

Each risk names its trigger, observable consequence, prevention or stop
condition, and affected IDs. Rollback names the smallest reversible action and
must stay inside the declared file boundary. Missing interfaces, an invalid
test command, boundary widening, or a new product decision stops planning and
returns to the owning material.
