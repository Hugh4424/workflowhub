---
name: spec-plan
description: Generate an executable, readable implementation plan from frozen specification and research content.
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

## Reading contract

Use `templates/plan-template.md`. Write for two readers in this order:

1. a human must understand the problem, intended change, boundary, main risk,
   and next step from the opening quick-read section;
2. an implementation agent must find exact anchors, files, interfaces, tasks,
   gates, recovery, and traceability without searching for a second authority.

Generated Markdown contains no template comments, placeholders, empty headings,
empty tables, or filler such as “待补充”. Use `N/A — {factual reason}` only when a
conditional section does not apply. Keep prose short; use tables only for
comparison or repeated mappings, never for long paragraphs.

## Required plan contract

The generated plan preserves:

1. quick-read goal, non-goals with accepted source refs, observable before/after,
   main risk, and next step;
2. concrete Technical Context, inherited constraints, scale, and unresolved facts;
3. verified Code Anchors and a reuse → extend → new decision for each mechanism;
4. module responsibilities, interfaces, schemas, state transitions, data flow,
   integration points, and compatibility boundaries;
5. exact NEW / MODIFY / DO NOT TOUCH files;
6. alternatives, selected trade-offs, complexity justification, dependencies,
   rollback, recovery, and an engineering risk handoff naming affected IDs,
   trigger, consequence, mitigation or STOP, handling Stage, and verification;
7. ordered implementation Phases and an explicit dependency graph;
8. one authoritative FR → task → AC → gate/evidence traceability table;
9. a governance synchronization matrix derived from the actual change;
10. every current constitution clause from the supplied checklist, bound by
    `ref`, SHA-256 `hash`, `version`, and `clause_count`.

Module, data/state, API, UI, data-flow/integration, and externally
maintained-code contracts are conditional. When applicable, fill their complete
contract. When not applicable, use one factual `N/A — ...` line instead of
retaining an empty subsection or invented architecture.

## Phase and file authority

Each Phase has meaningful `Goal`, `Files`, `Tasks`, `Verify`, `Knowledge`,
`STOP`, `Done`, and `Risks and rollback` sections. `N/A` is valid only with a
factual applicability reason.

`Phase.Files` is the authority for file ownership. Paths are exact; wildcards
and directory-wide ownership are forbidden. The global file view is only the
derived union of Phase files. Downstream `tasks.md` must copy each Phase name
and Files block byte-for-byte; a task's files and boundary must be subsets of
its Phase NEW/MODIFY set.

## Identity and context projection

Every cross-artifact reference is a complete `ReferenceBinding` with
`artifact_kind`, `ref`, SHA-256 `hash`, and stable `id`. The plan references
accepted PFACT/FR/AC identities through the bound spec and must not copy PFACT
prose into a second authoritative section.

Record `read_now` separately from `must_read_before_task`; record Lite/Full or
not-applicable engineering rationale and explicit risk/recovery facts. Missing
or stale bindings stop downstream projection instead of triggering repository
scans.

## Verification design

Behavior changes use a real RED before GREEN. A RED has a non-zero
`expected_exit`; its paired GREEN has `expected_exit: 0` and uses the same
behavioral `gate_cmd` and oracle identity. Every verification target states:

- the FR, AC, or invariant it proves;
- one executable `gate_cmd`;
- `expected_exit`;
- a task-relative `evidence_path`;
- the observable oracle;
- an optional `display_cmd` that never decides pass/fail.

Verify commands and flags against repository facts. Do not emit prose as a
command, let a display pipeline hide the gate exit code, or prescribe broad
testing by default. Select the smallest command that proves the behavior; add
broader regression only for a named compatibility risk.

## Engineering rules

- Prefer an authenticated existing anchor. `new` must explain why reuse and
  extension cannot satisfy the requirement.
- For each new mechanism preserve the F10 questions: real threat, existing
  coverage, bypassability, and long-term maintenance cost.
- Record current signatures for every existing CLI, schema, event, or function
  changed. An unavailable signature is unresolved and triggers STOP.
- A parallel Phase or task is valid only when dependencies, inputs, and file
  ownership are independent.
- Deterministic structure validation cannot be replaced by a provider verdict.
- Keep the plan portable: no host identity, fixed Knowledge path, external
  tracker convention, or repository-specific package rule unless supplied as
  an accepted constraint.
