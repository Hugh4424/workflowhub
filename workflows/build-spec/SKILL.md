---
name: build-spec
description: Turn the approved product decision into the current feature specification.
version: 4.0.0
---

# Build Spec

## Responsibility

Turn the current `decision-log.md` into the current `spec.md`.

`decision-log.md`, `spec.md`, `plan.md`, and `tasks.md` are the current four
materials and the only current work truth. This stage owns only `spec.md`:

- `decision-log.md` is the upstream authority for product direction.
- An existing `spec.md` is the revision target.
- `plan.md` and `tasks.md` are downstream outputs. Never use them to fill a
  missing decision or let implementation detail redefine the product.

Do not add a new decision, implementation plan, task breakdown, or parallel
authority. If the decision is incomplete, expose the gap instead of guessing.

## Portable dependencies

The Stage Agent reads `workflows/build-spec/skill-deps.yaml` and directly reads
the declared portable skill packages from their `path` and `bundle`. Apply the
relevant content contracts in the same Stage Agent context. Their templates and
checks guide `spec.md`; they do not create another stage or another source of
truth.

A dependency or independent reviewer may be unavailable. Record the real
`unavailable` quality fact and continue drafting or repairing this same task.
Never turn missing quality evidence into `pass`.

## Work

1. Read the current `decision-log.md` and existing `spec.md`, if present.
   Extract the original requirement, confirmed choices, boundaries, non-goals,
   risks, deferred items, and open questions. Preserve every confirmed decision.
2. Research the codebase only when a current interface, data rule, state,
   compatibility boundary, or operational fact is needed to make the product
   behavior precise. Put durable conclusions in `spec.md` as facts, constraints,
   or explicit assumptions; do not create a separate research authority.
3. List every material ambiguity separately. For each one, state whether it can
   change scope, acceptance, interfaces, data, security, or operations.
   Continue all unaffected drafting and repair.
4. When the decision material cannot support a required specification claim,
   write one focused clarification question and return it to `make-decision`.
   Do not run Clarify in this stage or invent the answer.
5. Write `spec.md` directly. Use stable IDs and cover the goal, scope, non-goals,
   user scenarios and states, success and failure behavior, functional
   requirements, acceptance criteria, interfaces/data/operational boundaries,
   assumptions, risks, and deferred work. Every acceptance criterion needs an
   observable pass oracle and failure condition.
6. Check the result against the decision log and Constitution. The specification
   must add no accidental scope, duplicate authority, speculative mechanism, or
   implementation plan.
7. Ask the declared independent review capability to review the current decision
   and specification. Preserve the actual verdict and findings, or the real
   `unavailable` result. Repair valid findings in `spec.md`; explain rejected
   findings and unresolved risks. Review is a quality fact, not permission to
   continue working on the task.

## Completion

The content work is complete when:

- every confirmed decision is represented without adding a new decision;
- every requirement and acceptance criterion has a stable, observable meaning;
- scope, states, success/failure boundaries, non-goals, risks, and assumptions
  are explicit;
- every material ambiguity is resolved by current authority or remains plainly
  identified as an upstream decision gap;
- the independent review result is truthfully recorded as a verdict or
  `unavailable`, with important findings addressed or disclosed.

An upstream decision gap prevents claiming the specification is ready, but does
not freeze investigation or repair in the same task. Missing or unavailable
quality evidence lowers the completion claim; it does not create a new task.

## Stage end

Tell the user in plain language:

- what product behavior the specification defines;
- what is explicitly out of scope;
- the important risks, unknowns, and review result;
- what `build-plan` should do next and what it must not guess.

If a real clarification, scope change, or risk decision remains, name it and
its owning stage. Any user confirmation is human alignment, not a machine work
permit and not authorization to commit, push, merge, archive, or clean up.
