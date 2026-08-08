---
name: build-plan
description: Turn the current specification into a reviewable implementation plan and executable task list.
version: 3.0.0
---

# Build Plan

## Purpose

Turn the current `spec.md` into a readable `plan.md` and executable `tasks.md`.
The plan must cover scope, phases, dependencies, tests, review, delivery
boundary, risks, and every FR/AC. The task list must be ordered, bounded, and
have a command or observable result for each task.

## Working rule

Use the bundled `spec-plan` and `spec-tasks` content contracts before writing.
`skills/spec-plan/templates/plan-template.md` is the only plan shape and
`skills/spec-tasks/templates/tasks-template.md` is the only task-card shape;
the stage skill remains the orchestrator and no second runtime state is added.

The current four materials are the source of truth:

1. `decision-log.md`
2. `spec.md`
3. `plan.md`
4. `tasks.md`

Read the first two and author the latter two. Revise any current material in
this same task when the work reveals a need. Old accepted records, receipts,
reviews, snapshots, generations, and runner history are read-only
audit records. They never license or block normal planning or implementation.

Do not stop at “there is a task for each FR”. Every task needs an exact file
boundary, STOP condition, command, oracle, evidence path and completion facts.
The final plan must contain a two-way FR↔Task↔AC matrix and a dependency DAG;
unknown interfaces or consumers remain explicit STOP/unknown facts.

Current materials decide whether work can continue. Formal publication still
fails loudly for an invalid current task/workspace/runtime binding, wrong write
set, mismatched content, or false execution identity. Stage completion still
requires real research where needed, deterministic planning checks, independent
review (or real `unavailable`), current user authorization, and handoff; it
does not create a duplicate conversational confirmation for every stage.

## Runtime boundary

Use only the launcher-supplied `StageContext`; use `ctx.kernel` for formal
records and `ctx.artifacts` for the four materials. Do not derive identity or
paths from cwd, Git, branch, issue number, or scans. Do not call `prepare`, pass
`--runner-root`, or copy runner files into the product repository.

Use an OS temporary directory for caller-owned drafts and runtime inputs.
Publish the current reviewed `plan.md` and `tasks.md` via the runtime's artifact,
receipt, and run schemas. The formal runtime sequence remains `run`, `confirm`,
then `authorize` where the runtime explicitly requires those records; the
user's existing authorization is sufficient for ordinary conversational
handoff and no duplicate stage question is created. The current source
snapshot is a provenance fact only, never a prerequisite or work permit.

## Fixed invocation order and outputs

The high-intelligence planning model uses this exact order:

1. `spec-research`: invoke only when there is a real research question that
   could change the plan; otherwise record `skipped` and the reason.
2. `spec-plan`: create the readable plan draft from the frozen decision/spec.
3. `simplicity-guard`: look for deletion, narrowing, or reuse before more
   planning is locked.
4. `plan-eng-review`: check engineering boundaries, dependencies, failure paths,
   rollback and verification of the plan draft.
5. `test-routing-advisor`: preselect `simple`, `feature`, or `fullstack` and
   the expected concrete testing skill separately for every Phase and the final
   full test.
6. `spec-tasks`: turn that design into ordered executable task cards.
7. `spec-analyze`: read the original requirement projection plus
   `decision-log.md`, `spec.md`, `plan.md`, and `tasks.md`; report the complete
   trace and every omission or contradiction.
8. `wh-review`: run one independent advisory review over the frozen plan/tasks.

Build-plan does not invoke `backend-testing`, `frontend-testing`,
`fullstack-slice-testing`, or `testing-system-blueprint`. Those skills need the
real post-implementation changed-file range and are invoked by build-code.
Build-plan still writes the preselected tier, expected skill, scenarios,
commands, oracle, evidence path and limits into plan/tasks so ordinary build-code
does not invent product or test intent.

## Procedure

### v2 review packet assembly

`build-plan` uses the `wh_review.v2` contract. The caller must assemble one
current review packet with `raw_requirement`, `approved_spec`,
`acceptance_criteria`, `draft_plan`, `draft_tasks`, `context_map`, and
`evidence_map` before every `wh-review` call.
The two maps are required caller/runner review material, not optional metadata
or runner state. Initial/full packets deliver them to the provider; an
incremental packet intentionally delivers only the runner-generated
`review_delta` after the current maps pass validation.

- `context_map` selects the current module boundaries, dependencies,
  interfaces, and test conventions that the plan relies on.
- `evidence_map` maps each applicable acceptance criterion to its own current
  evidence anchors; do not reuse one generic anchor for multiple criteria.
- After a plan, task, or upstream material revision, rebuild both maps from the
  same current frozen snapshot and resend them. Do not retry with only the
  planning text fields from the previous call.
- If a map cannot be completed, send the valid `state: unknown` structure with
  `unknown_reason`; never omit it, send `{}`, or invent anchors to get a review.
  A missing or malformed map remains the runner's
  `MATERIAL_INCOMPLETE`/`unavailable` fact.

1. Read current `decision-log.md` and `spec.md`; identify the FRs, ACs,
   constraints, non-goals, risks, and open decisions that affect the plan.
2. Do proportionate `spec-research` only when it can materially change the
   implementation. Keep research as input to the plan, not a new permanent
   artifact; otherwise record why it was skipped.
3. Write current `plan.md` with phases, ownership boundaries, dependencies,
   data/API changes, risks, tests, independent-review scope, and delivery
   boundary. Prefer the simplest design that meets the current requirements.
4. Run `simplicity-guard` once against the plan draft, then `plan-eng-review`
   once against the plan boundary, dependencies, failure paths and verification
   approach. Preserve both advisory facts and apply only findings the main
   agent judges valid.
5. Run `test-routing-advisor` once for every Phase and once for the final full
   test. It must return a tier and expected concrete testing skill based on the
   planned scope. It does not execute tests.
6. Write current `tasks.md`. Materialize the routing result in every task card:
   exact changed files and FR/AC, tier, scenarios, commands, expected exit,
   oracle, fixtures/services, browser route when relevant, evidence path,
   coverage limits, skip reasons, snapshot binding, and the model/phase that
   owns the strategy. Maintain bidirectional FR/AC coverage and an acyclic
   order.
7. Run `spec-analyze` after `tasks.md` exists. It reads the original requirement
   projection, decision-log, spec, plan and tasks, and checks source-to-AC/test
   coverage, contradictions, user-flow/state boundaries, orphan work and
   accidental scope. It is report-only; the main agent must judge every finding.
8. Treat the recorded task strategy as an execution contract. `build-code`
   consumes it, checks actual changed files, and invokes the concrete testing
   skill after implementation. If the actual range differs, it reruns
   `test-routing-advisor` before selecting the concrete skill. It never invents
   product requirements or acceptance oracles. Put a dedicated final aggregate
   strategy in `tasks.md` during build-plan; missing strategy is
   `MATERIAL_INCOMPLETE`.
9. Run deterministic checks over the exact current materials. They must verify
   complete phase/task rows, executable checks, dependency acyclicity, and
   FR/AC coverage. Structural errors stop formal publication until fixed; they
   do not require a new task or historical-record repair.
10. Run one independent `wh-review` over the complete current `spec.md`,
   `plan.md`, and `tasks.md`. `wh-review` alone owns providers and its internal
   lenses. Record the actual verdict and provider availability; never rewrite
   unavailable or failed as pass.
11. Address valid review findings in the same task. Repair, reject invalid
   findings with evidence, or let the user accept a specific risk. Do not add
   process machinery or repeat an unchanged review. When a prior review was
   `pass`, wh-review uses a runner-generated delta for new or changed plan
   material and its direct impacts, rather than repeating a full review of
   unchanged content. If no safe delta exists, record the fallback full review
   explicitly. Rerun only affected checks and the review needed to assess that
   change.
12. Before handoff, the main agent must inspect every finding and record its
   disposition, evidence, and next action. A finding cannot be silently carried
   into implementation. This disposition is a quality fact, not a hidden gate:
   it keeps unavailable or unresolved quality visible without blocking ordinary
   same-task repair or progression.
   Before handoff, the main agent must present a plain-language disposition
   summary for every finding. Each row names `finding_id`, original fact,
   consequence, `status`, `next_action`, `evidence_ref`, `owner`, `consumer`,
   and `retain_or_delete`; the summary is shown to the user and is not replaced
   by a provider verdict. Record the same rows in the existing Task completion
   area for risk-acceptance/missing-items consumers; do not add a resolution
   ledger.
13. Publish exact final plan/task receipts and the stage attempt through the
   runtime's declared schema. Publication must authenticate current structure;
   audit gaps remain visible but do not block work.

   The two official component receipts are mandatory current-stage inputs, not
   optional commentary: the current receipt returned by the repository-owned
   producer must contain the exact current `plan.md` and `tasks.md`, each with
   its authenticated hash and `build-plan` producer identity. Initial receipts
   may use `quality/evidence/plan.json` and `quality/evidence/tasks.json`; after
   a current-material revision, use the producer's content-addressed current
   refs and never overwrite an older fixed receipt. Pass both current refs to
   the official `run` together with the current review/disposition and
   `stage_skill_dispatch` facts. Do not substitute attachments, comments,
   provider output, or an old receipt. If a receipt producer cannot publish,
   record the precise `unavailable`/`incomplete` fact and keep the same task in
   repair; do not handwrite a receipt or claim completion. An audit-carrier
   gap is disclosed as audit debt and is not by itself a work or progression
   gate; only missing formal completion/handoff facts may keep the next stage
   asleep.
14. Present a short plan summary: scope and non-goals, phases/dependencies,
   FR/AC and check coverage, review facts, risks, and delivery boundary. Reuse
   the user's existing explicit instruction to continue without per-stage
   confirmation. Ask again only if a new product decision, scope change, or
   concrete risk acceptance is required; do not manufacture a stage prompt.

## Review, confirmation, and completion

Independent review is quality evidence, not a general progress gate. An
actionable major or blocking finding needs a real user choice: repair first
(recommended) or accept the stated risk. Risk acceptance preserves the review
verdict and never bypasses structural publication checks or formal runtime
records.

Do not call build-plan complete until the declared planning work, checks,
independent review fact, current authorization, and handoff are real. Do not treat
the confirmation or source snapshot as authorization to commit, push, merge,
archive, or clean up; those actions require separate authorization.

## Communication and handoff

Use concise plain language in the user's language. A research or draft card
states only conclusions that affect the plan. A review card states subject,
actual providers, verdict, important findings, disposition, and next step. A
confirmation card offers 2–3 meaningful choices only where user input is
needed. Keep paths, hashes, refs, and commands in formal records.

Use the runtime-owned completion renderer and `skill-deps.yaml`: every always
component is `executed`; every conditional component is `executed` or
`trigger=false — reason`. Do not create a separate progress state machine.

At the end of this stage, tell the user in plain language what was planned, what
will be delivered, what is out of scope, the main risks and deferred items, and
what `build-code` must not guess. Wait for the user's actual reply before
handoff; without that reply the stage remains `in_progress`/`pending`. A new
scope or serious risk needs an explicit user accept or reject; the existing
authorization covers ordinary continuation only.

## Metrics

Use only the launcher-issued metrics capability. Record entry and exit; metrics
failures are warnings and never proof of completion.
