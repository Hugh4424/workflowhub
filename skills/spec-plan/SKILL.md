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

## Artifact responsibility

`plan.md` is the engineering decision and evidence dossier: verified facts,
code anchors, design trade-offs, file boundary, phases, dependencies, risks,
and verification strategy. It references accepted product IDs instead of
copying their prose. `tasks.md` projects only the execution-ready cards, so do
not duplicate task-level inputs, outputs, commands, or recovery detail here.

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

## Retry and artifact idempotence

The owner is the `spec-plan` Stage Agent and the only consumer is the same
TaskHandle's current `build-plan` stage. On a retry, first compare the existing
`plan.md`'s stable input/reference bindings against these allowed current-input
facts only: the accepted `decision-log.md` decisions and source entries,
`spec.md` and its accepted ref, named `spec-research` facts, the applicable
`CONSTITUTION.md` rules, and the repository facts explicitly referenced by the
plan's inputs or anchors. A plan-affecting formal review finding must be current
in this snapshot and valid, carry its formal `id`, be an actionable finding
with direct or corroborated evidence, and have a matching current
`finding_dispositions` row whose `finding_id` is the same and whose `status` is
`needs_human`; its `next_action` must map the finding to the affected plan row
or binding. The stage owner may provide that mapping; the provider's original
finding text does not have to name the plan row. A `fixed` row means the plan
repair is already recorded; `accepted_risk`, `rejected_invalid`, or an
unrelated finding is not a plan input.

If none of those allowed facts changed, and there is no qualifying finding,
treat the existing plan as the current artifact: do not regenerate, reformat,
reorder, refresh timestamps, or absorb the same facts a second time. Return its
existing hash and no changed file. A `tasks.md` completion or stale plan-hash
binding is a downstream task-projection change, not a reason to rewrite
`plan.md`.

Only an allowed current-input change or a qualifying review finding may change
`plan.md`. Before writing, compare candidate bytes with the existing artifact;
identical bytes must not be rewritten. If a write is needed, preserve the
current plan's provenance and explain which allowed input or `finding_id`
caused it.
If a legitimate plan change does occur, recompute the current snapshot and
stop the ordered stage dispatch; the next attempt must refreeze and use the
current snapshot-bound invocation keys. Do not create a new task, generation,
replacement, lineage, or side-channel record.

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
`STOP`, `Done`, and `Risks and rollback` sections. Keep `Tasks` to IDs and
one-line outcomes; task-card inputs, outputs, gate commands, and failure
handling belong only in `tasks.md`. `N/A` is valid only with a factual
applicability reason.

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

## Constitution and WorkflowHub stage-progress contract

`plan.md` must contain one `## WorkflowHub Stage Progress` section with exactly
one row for each of `make-decision`, `build-spec`, and `build-plan`. Each row
records the material-stage fact, current work or artifact references, review
fact, plain-language handoff state, next step, and deferred risk. This is a
compact index, not a second decision log or a copy of `spec.md`.

Use progression and quality separately. A stage may have a readable artifact
and continue while review is `revise_required`, `unavailable`, or incomplete;
the row must retain that quality fact. Do not write `pass` as a prerequisite for
progress. A stage cannot be called semantically accepted when its per-item
evidence, user handoff, or current review fact is missing.

`make-decision` must not read or require future `spec.md`, `plan.md`, or
`tasks.md`. Its progress row is written only after `plan.md` exists; before
that, the absence is a normal stage fact rather than permission to create future
files.

## Decision-to-plan mapping and scope revision

Each plan decision, Phase, and traceability row carries compact source IDs from
the current spec/decision log (`R*`/report/`INC-*` → `D*` → `FR/AC`). Plan prose
may explain engineering consequences, but it must not introduce a new product
requirement or copy the decision-log narrative. A source ID with no current
FR/AC or a plan item with no source is an unresolved handoff fact.

For a same-task `scope_revision`, update only affected decisions, Phases,
dependencies, tests, and direct-impact rows; retain the old review fact and
record the dedicated scope-revision review result. Do not regenerate an
unchanged plan or repeat an unchanged full review merely because a new Task was
added.
