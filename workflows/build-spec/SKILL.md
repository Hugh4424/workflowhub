---
name: build-spec
description: Turn the current product decision into a complete, testable feature specification.
version: 4.1.0
---

# Build Spec

## Responsibility and authority

Turn the current `decision-log.md` into the current `spec.md`. The four
materials have separate responsibilities and are the only current work authority;
old records are not a replacement authority:

- `decision-log.md` owns original requirements, user choices, reasons, risks,
  non-goals, and deferred direction;
- `spec.md` owns product behavior, flows, states, FR, AC, failure boundaries,
  and product-facing contracts;
- `plan.md` and `tasks.md` are downstream engineering outputs and must not fill
  a missing product decision.

This stage owns only `spec.md`. An existing specification is revised in place;
do not create a parallel specification. If a direction-changing decision is
missing, expose the exact gap to `make-decision` and continue unaffected repair.
The current `spec.md` remains the single revision target; never create a
parallel revision target or infer a replacement from historical records.

## Portable dependencies

Read inline packages declared in `skill-deps.yaml` directly in the same Stage
Agent context. Packages declared `execution: independent` run in their own
independent context and return only findings; do not inline them or route them
through a dispatcher. `spec-specify`, `simplicity-guard`, and `plan-ceo-review`
are inline lenses; conditional design review follows its declared execution.
They do not create extra artifacts, dispatchers, or work prerequisites.

Quality dependencies and the independent review capability may be unavailable.
Preserve the real unavailable/error/transport fact and keep drafting or
repairing this same task. Never turn unavailable into empty findings or a
completion claim, and never make it a reason to stop safe writing.

Review is a quality fact, not a progression gate or permission to continue
working. Missing or unavailable quality evidence lowers the completion claim;
it does not block same-task drafting or repair. An unavailable review is never
`pass`.

## Required specification content

Read the decision log and existing spec before researching. Preserve every
confirmed choice and every explicit non-goal. Research only when a current
interface, data rule, state, compatibility boundary, security condition, or
operational fact is needed to make product behavior precise; durable findings
belong in the relevant spec section, not a second research authority.

The specification must make these items explicit when applicable:

1. quick-read goal, user outcome, scope, urgency, and business impact;
2. non-goals and deferred work, each linked to a current decision/source;
3. user scenarios and journeys, including default, empty, loading, error,
   cancellation, permission, boundary, and race states;
4. state transitions and observable success, failure, recovery, and retry
   behavior;
5. stable IDs for scenarios, product facts, FR, AC, risks, and open questions;
6. functional requirements, each linked to a source, scenario, and AC;
7. acceptance criteria with method, pass oracle, failure condition, evidence
   type, and affected user state;
8. product-boundary interfaces, entities, data lifecycle, and compatibility
   contracts only when they affect what users must observe;
9. assumptions, risks, unknowns, owners, handling stage, and close condition;
10. explicit exclusions and the next-stage handoff.

List every material ambiguity separately with its possible impact on
scope, acceptance, interface, data, security, or operations. Do not guess an
answer from code, old records, or a plan.
Do not run Talk, Clarify, or Grill in this stage, and do not call
`talk-with-zhipeng` or `grill-with-docs`; those activities belong exclusively to
`make-decision`. Do not invent the answer; a direction-changing ambiguity is
identified as an upstream decision gap. Continue all unaffected drafting and
repair while recording the gap plainly.

## Boundaries

Do not add implementation file lists, code symbols, engineering alternatives,
exact test commands, or task steps to `spec.md`; those belong to `plan.md` and
`tasks.md`. Do not duplicate scenario prose in FRs, assumptions outside the
fact section, or exclusions in several sections. Conditional contracts use one
complete applicable subsection or one factual `N/A — reason` line.

The specification must not create a second authority, status projection, or
process summary. Quality facts may be referenced by path and source, but a
review or test result never changes product scope automatically.

## Work sequence

1. Read `decision-log.md` and current `spec.md`; build a source/decision index.
2. Identify every confirmed requirement, choice, boundary, non-goal, risk,
   deferred item, and upstream gap.
3. Research only the current facts needed to make the behavior precise.
4. Draft or revise `spec.md` with stable IDs, flows, states, FR/AC, oracles,
   failure conditions, risks, and explicit exclusions.
5. Cross-check no decision was dropped, no new product scope was invented, and
   every AC is observable.
6. Use the declared independent review capability against the current decision
   and specification. Keep provider/model/transport provenance and findings;
   the review contract returns findings, not a pass/revise permission.
7. Dispose each finding as `fixed`, `rejected_invalid`, `accepted_risk`, or
   `needs_human`. Repair valid findings in this same task and keep unresolved
   risk visible.

## Completion and handoff

Content work is complete when every confirmed decision has a stable product
meaning, every requirement and AC has an oracle and failure condition, flows
and boundaries are explicit, and review facts/finding dispositions are honest.
The build-spec stage is not formally complete while required quality facts are
missing or unavailable; report `incomplete` and keep the same-task repair path
open. Missing or unavailable quality facts lower the completion claim but do
not block continued work: continue drafting or repairing this same task. This
stage does not create a new task to bypass a quality or transport gap.

End with plain language: what behavior `spec.md` defines, what is out of scope,
the important risks and unknowns, review findings/transport facts, and what
`build-plan` should do next without guessing. User confirmation is human
alignment, not a machine work permit; it does not authorize commit, push,
merge, archive, or cleanup.
