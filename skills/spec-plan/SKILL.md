---
name: spec-plan
description: Generate an executable implementation plan from frozen specification and research content.
---

# Spec Plan

Receive frozen `spec.md`, optional frozen research content, current constitution
content, authenticated repository facts, and one controlled artifact writer from
build-plan. Write only the named artifact `plan.md`.

Do not discover a task, repository, branch, root, or artifact path. Do not add
host-specific tracker identity, fixed directories, or rules copied from an
unrelated repository. The accepted specification remains the authority for
scope and behavior; this skill turns it into an engineering plan and never
re-selects product decisions.

## Required plan contract

Use the bundled `templates/plan-template.md`. The generated plan must contain:

1. summary, goals, non-goals, and observable before/after behavior;
2. concrete Technical Context, constraints, scale, and unresolved facts;
3. a governance synchronization matrix derived from the actual change;
4. verified Code Anchors and a reuse → extend → new decision for each mechanism;
5. module responsibilities, interfaces, schemas, state transitions, and data flow;
6. an exact NEW / MODIFY / DO NOT TOUCH file tree;
7. alternatives, selected trade-offs, complexity justification, dependencies,
   integration points, and rollback/recovery;
8. ordered implementation Phases;
9. bidirectional FR → task → AC traceability;
10. all current constitution clauses, copied from the supplied constitution
    rather than a hard-coded project checklist.

Each Phase must have meaningful `Goal`, `Files`, `Tasks`, `Verify`,
`Knowledge`, `STOP`, `Done`, and `Risks and rollback` sections. `None` is valid
only with a factual applicability reason. Files are exact paths; wildcards and
directory-wide ownership are forbidden.

For the v2 plan-task contract, every cross-artifact reference is a complete
`ReferenceBinding` with `artifact_kind`, `ref`, SHA-256 `hash`, and stable `id`.
The plan may reference accepted spec bindings but must not copy PFACT prose.
Record `read_now` separately from `must_read_before_task`; record Lite/Full or
not-applicable engineering rationale and explicit risk/recovery facts.

Keep accepted artifact bindings explicit so downstream task projection stops on
stale or overwide context instead of discovering extra files.

## Verification design

Behavior changes use a real RED before GREEN. Every verification target states:

- the FR, AC, or invariant it proves;
- one executable `gate_cmd`;
- `expected_exit`;
- a task-relative `evidence_path`;
- an optional `display_cmd` that is never used as the pass/fail oracle.

Verify command existence and flags against repository facts before writing
them. Do not emit prose pretending to be a command, let a display pipeline hide
the gate exit code, or prescribe broad testing by default. Select the smallest
command that proves the Phase behavior and add broader regression only when an
identified compatibility risk requires it.

## Engineering rules

- Prefer an authenticated existing anchor. `new` requires a written reason why
  reuse and extension cannot satisfy the requirement.
- Record current signatures for every existing CLI, schema, event, or function
  that a task changes. If unavailable, mark the fact unresolved and STOP.
- A parallel Phase or task is valid only when dependencies and file ownership
  are independent.
- Deterministic structure validation cannot be replaced by a provider verdict.
- Keep the plan portable: no host identity, fixed Knowledge path, external
  tracker convention, or repository-specific package rule unless supplied as
  an accepted constraint for this task.
