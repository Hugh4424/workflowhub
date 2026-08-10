---
name: spec-plan
description: Turn the current decision and specification into a minimal, executable implementation plan.
---

# Spec Plan

Read the current `decision-log.md`, `spec.md`, and verified repository facts.
Write only `plan.md`. Product direction and user-visible behavior remain owned
by the current decision and specification; this skill chooses the smallest
engineering solution and does not reopen either one.

Use `templates/plan-template.md`. The generated document must contain real
content: no authoring comments, empty headings, filler, or unresolved
placeholders. When a conditional section does not apply, write one factual
`N/A — reason` line. The current v3 structure has the 13 named plan sections
(`Quick Read`, `Technical Context`, `Code Anchors`, `Solution Design`, `File
Boundary`, `Technical Decisions`, `Test Strategy`, `Rollback and Recovery`,
`Implementation Order`, `Dependencies and Parallelism`, `Requirement and
Verification Traceability`, `Governance Synchronization Matrix`, and
`Constitution Check`) plus direct `## Phase ...` blocks. Do not wrap phases in a
second `Phases` section or add a progress index.

## Reading and authority

- `decision-log.md` supplies original requirements, decisions, constraints,
  non-goals, risks, and deferred choices.
- `spec.md` supplies user outcomes, flows, states, functional requirements,
  acceptance criteria, and product boundaries.
- `plan.md` supplies engineering choices, exact boundaries, dependencies,
  phases, risks, rollback, and verification design.
- `tasks.md` is the downstream projection of this plan. Do not copy task
  procedures or execution output into the plan.

Facts that are missing, stale, or unavailable remain explicit facts. They do
not justify guessing a product choice. A direction-changing gap is returned to
`make-decision`; unaffected planning and repair continue in the same task.

## Implementation solution: quick-read and technical context

Open the plan with the goal, current behavior, target behavior, non-goals, main
risk, and next action. Then record only the repository facts that affect the
solution: verified code anchors, existing consumers, interface signatures,
data lifecycle, scale, compatibility limits, unresolved assumptions, and
operational constraints.

For every mechanism, make the explicit choice `reuse`, `extend`, or `new`.
Prefer reuse, then a narrow extension. A new mechanism requires a concrete
reason that the existing anchor cannot satisfy the accepted behavior, plus its
consumer, owner, test, and removal condition. Ask the F10 questions: what real
problem it prevents, what already covers that problem, how it can be bypassed,
and what maintenance cost it adds.

## Solution and boundaries

Describe the observable before/after, data flow, module responsibilities,
interfaces, schemas, state transitions, integration points, and compatibility
behavior that matter to implementation. Keep product behavior in `spec.md`;
the plan explains how the accepted behavior will be delivered.

Declare exact file ownership in three lists:

- `NEW`: exact new files, or `N/A — ...`;
- `MODIFY`: exact existing files;
- `DO NOT TOUCH`: exact protected files and the reason.

Wildcards and directory-wide ownership are not valid. Every phase file list is
an exact subset of the global boundary. Every task file list is an exact subset
of its phase boundary.

Record alternatives and trade-offs, including why the selected solution is
simple enough, what complexity it adds, what it deliberately does not solve,
and how it can be rolled back. Do not create another storage or progress
authority for this explanation.

`plan.md` contains no runtime state, execution history, or host communication
fields. Those facts belong to the task's declared quality/evidence area and do
not become a second planning authority.

## Phases and dependencies

Each phase contains exactly these useful handoff fields:

- `Goal`: the observable result;
- `Files`: exact owned files;
- `Tasks`: stable task IDs and one-line outcomes;
- `Verify`: smallest executable commands, expected exits, oracle, and evidence;
- `Knowledge`: facts the next phase must know;
- `STOP`: concrete condition that returns to the owning material;
- `Done`: evidence needed to describe the phase honestly;
- `Risks and rollback`: affected IDs, trigger, consequence, mitigation, and
  smallest reversible action.

Order producers before consumers. Parallel work is valid only when inputs,
dependencies, and file ownership are independent. The dependency graph must be
acyclic and must name the reason for every serial edge.

## Test plan and design

Planning designs tests; it does not run them or claim execution. For each
behavior change, define a RED/GREEN pair with the same executable `gate_cmd`
and stable oracle ID:

- RED expects a non-zero exit caused by the target assertion, not setup failure;
- GREEN expects `0` and keeps named negative behavior protected;
- both identify the observable result, task-relative `evidence_path`, and
  coverage limit;
- `display_cmd`, if useful, is only for reading and never decides the result.

Use the smallest command that proves the behavior. Broader regression is added
only for a named compatibility risk. `gate_cmd` is a test command name, never
a permission to start, continue, or publish work.

Testing-system design records risk dimensions, scenarios, inputs, oracles,
evidence location, and limits. Test-routing selects the applicable concrete
testing skill. Actual execution belongs to `build-code` and its testing skill.

## Task mapping and traceability handoff

Keep one bidirectional map:

`source/decision IDs → FR → AC → phase/task ID → command/oracle/evidence`

Every current FR and AC maps to a task. Every task maps back to valid source,
FR, and AC IDs. An item without a source is an upstream decision gap, not an
invitation to invent scope.

Before handing off, check the four materials for omissions, contradictions,
orphan tasks, boundary widening, missing dependencies, and broken two-way
traceability. The plain-language handoff states what will be built, how it is
split, how it will be tested, what remains unknown, and what `build-code` must
not guess.

## Quality facts

The owning build-plan contract requests one independent findings review of the
current plan and tasks, or records its real `unavailable` result. Preserve
actual findings, transport status, provider/model provenance, and unavailable
facts in the declared quality area. Findings are disposed as `fixed`,
`rejected_invalid`, `accepted_risk`, or `needs_human`; serious unresolved risks
remain visible.
Review, test, research, and evidence facts describe quality and completion
claims; they do not block writing or same-task repair. Do not manufacture a
pass when a review is unavailable or incomplete.

This skill does not run Talk, Clarify, or Grill. It does not create a second
review run, a parallel decision process, a host-specific control layer, or a
new public workflow step.

## STOP conditions

Stop planning and return to the owning material when the command is not
executable, an interface signature is unavailable, a dependency is missing, a
file falls outside the declared boundary, a test would weaken the accepted
assertion, or implementation requires a new product/architecture decision.
