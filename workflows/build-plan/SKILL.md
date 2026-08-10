---
name: build-plan
description: Turn the approved decision and specification into the current implementation plan and task list.
version: 4.0.0
---

# Build Plan

## Responsibility

Turn the current `decision-log.md` and `spec.md` into the current `plan.md` and
`tasks.md`.

`decision-log.md`, `spec.md`, `plan.md`, and `tasks.md` are the current four
materials and the only current work truth. This stage owns only `plan.md` and
`tasks.md`. It does not change product direction, rewrite the specification, or
execute implementation.

If planning exposes a product or acceptance gap, report the exact gap to the
owning upstream stage. Continue all unaffected research and planning in this
same task; never silently fill the gap from code or old records.

## Portable dependencies

The Stage Agent reads `workflows/build-plan/skill-deps.yaml` and directly reads
the declared portable skill packages from their `path` and `bundle`. Apply the
relevant research, planning, task-design, simplicity, test-routing, analysis,
and review contracts in the same Stage Agent context. They guide the two owned
materials and do not create another runtime or source of truth.

A dependency or independent reviewer may be unavailable. Record the real
`unavailable` quality fact and continue research, planning, or repair in this
same task. Never turn missing quality evidence into `pass`.

## Boundaries

- Do not run Talk, Clarify, or Grill. Product direction belongs to
  `make-decision`.
- When the current decision/spec cannot support a necessary planning choice,
  write one focused question and return it to the owning upstream stage. Never
  invent product intent.
- Do not implement code or execute RED/GREEN. Plan test scenarios, commands,
  expected outcomes, and evidence for `build-code` to execute later.
- Do not add another authority beside the four materials.

## Work

1. Read the current decision, specification, and existing plan/tasks if present.
   Extract every requirement, acceptance criterion, constraint, non-goal, risk,
   deferred item, and unresolved upstream question.
2. Research the codebase in proportion to the implementation risk. Verify reuse
   points, current consumers, ownership boundaries, interfaces, data changes,
   failure paths, test conventions, and rollback options. Put durable conclusions
   in `plan.md` or the owning task card; do not create a separate research
   authority.
3. Choose the simplest implementation that satisfies the current decision and
   specification. Prefer deletion, narrowing, or reuse before adding a new
   mechanism. Keep unknown consumers or interfaces explicit.
4. Write `plan.md` with implementation boundaries, phases, dependencies,
   affected modules or exact files where knowable, data/API changes, failure and
   recovery behavior, rollback, test design, independent-review scope, delivery
   boundary, risks, and deferred work. Trace every decision, FR, and AC to the
   phase that owns it.
5. Write `tasks.md` as an ordered, acyclic set of executable task cards. Each
   card states its objective, requirement/AC coverage, exact file boundary or
   explicit unknown, dependencies, STOP condition, planned checks and commands,
   expected exit and oracle, evidence destination, risks, and completion
   criterion. Each card also has one minimal current status (`pending`,
   `in_progress`, or `completed`) and one execution-facts field; these live in
   `tasks.md` itself and are not a receipt, runtime gate, or second ledger.
   Include one final aggregate verification task.
6. Analyze the four current materials for omissions, contradictions, accidental
   scope, orphan tasks, and missing two-way traceability. Repair the owned
   materials; send product or acceptance changes back to the owning upstream
   stage.
7. Ask the declared independent review capability to review the current plan and
   tasks against the decision and specification. Preserve the actual verdict
   and findings, or the real `unavailable` result. Repair valid findings; explain
   rejected findings and unresolved risks. Review is a quality fact, not
   permission to continue working on the task.

## Completion

The content work is complete when:

- `plan.md` and `tasks.md` cover every current decision, requirement, and AC
  without adding product scope;
- codebase facts, ownership, dependencies, failure paths, rollback, risks, and
  unknowns are explicit enough for implementation;
- tasks are bounded, dependency-ordered, and have checkable completion criteria;
- test work is fully designed but no RED/GREEN execution is claimed;
- the independent review result is truthfully recorded as a verdict or
  `unavailable`, with important findings addressed or disclosed.

An upstream material gap prevents claiming the affected plan is ready, but does
not freeze unaffected planning or same-task repair. Missing or unavailable
quality evidence lowers the completion claim; it does not create a new task.

## Stage end

Tell the user in plain language:

- the chosen implementation approach and why it is the simplest adequate one;
- what `plan.md` and `tasks.md` now cover and what remains out of scope;
- the main dependencies, risks, unknowns, and review result;
- what `build-code` should do next and what it must not guess.

If a real scope, planning, or risk decision remains, name it and its owning
upstream stage. Then obtain the user's actual reply to the plain-language plan
summary before claiming that build-plan itself is accepted or its handoff is
complete. Absence of that reply keeps the build-plan acceptance claim open; it
does not turn confirmation into a machine work permit or block safe same-task
work from the four materials. It is not authorization to commit, push, merge,
archive, or clean up.
