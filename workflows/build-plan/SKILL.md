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

The current four materials are the source of truth:

1. `decision-log.md`
2. `spec.md`
3. `plan.md`
4. `tasks.md`

Read the first two and author the latter two. Revise any current material in
this same task when the work reveals a need. Old accepted records, receipts,
reviews, checkpoints, snapshots, generations, and runner history are read-only
audit records. They never license or block normal planning or implementation.

Current materials decide whether work can continue. Formal publication still
fails loudly for an invalid current task/workspace/runtime binding, wrong write
set, mismatched content, or false execution identity. Stage completion still
requires real research where needed, deterministic planning checks, independent
review (or real `unavailable`), user confirmation, and handoff.

## Runtime boundary

Use only the launcher-supplied `StageContext`; use `ctx.kernel` for formal
records and `ctx.artifacts` for the four materials. Do not derive identity or
paths from cwd, Git, branch, issue number, or scans. Do not call `prepare`, pass
`--runner-root`, or copy runner files into the product repository.

Use an OS temporary directory for caller-owned drafts and runtime inputs.
Publish the current reviewed `plan.md` and `tasks.md` via the runtime's artifact,
receipt, and run schemas. The normal formal sequence is `run`, `confirm`, then
`accept`; confirmation must be a real human answer. A checkpoint produced by
`accept` is an audit fact only, never a prerequisite for later work.

## Procedure

1. Read current `decision-log.md` and `spec.md`; identify the FRs, ACs,
   constraints, non-goals, risks, and open decisions that affect the plan.
2. Do proportionate `spec-research` only when it can materially change the
   implementation. Keep research as input to the plan, not a new permanent
   artifact; otherwise record why it was skipped.
3. Write current `plan.md` with phases, ownership boundaries, dependencies,
   data/API changes, risks, tests, independent-review scope, and delivery
   boundary. Prefer the simplest design that meets the current requirements.
4. Write current `tasks.md`. Each task names the change, affected area,
   dependency, and concrete check or observable outcome. Maintain bidirectional
   FR/AC coverage and an acyclic order.
5. Run deterministic checks over the exact current materials. They must verify
   complete phase/task rows, executable checks, dependency acyclicity, and
   FR/AC coverage. Structural errors stop formal publication until fixed; they
   do not require a new task or historical-record repair.
6. Run one independent `wh-review` over the complete current `spec.md`,
   `plan.md`, and `tasks.md`. `wh-review` alone owns providers and its internal
   lenses. Record the actual verdict and provider availability; never rewrite
   unavailable or failed as pass.
7. Address valid review findings in the same task. Repair, reject invalid
   findings with evidence, or let the user accept a specific risk. Do not add
   process machinery or repeat an unchanged review. After a material change,
   rerun only affected
   checks and the review needed to assess that change.
8. Publish exact final plan/task receipts and the stage attempt through the
   runtime's declared schema. Publication must authenticate current structure;
   audit gaps remain visible but do not block work.
9. Present a short plan summary: scope and non-goals, phases/dependencies,
   FR/AC and check coverage, review facts, risks, and delivery boundary. Get
   explicit user accept or reject, record it with `confirm`, and pass only an
   accepted confirmation to `accept`.

## Review, confirmation, and completion

Independent review is quality evidence, not a general progress gate. An
actionable major or blocking finding needs a real user choice: repair first
(recommended) or accept the stated risk. Risk acceptance preserves the review
verdict and never bypasses structural publication checks or the normal plan
confirmation.

Do not call build-plan complete until the declared planning work, checks,
independent review fact, user confirmation, and handoff are real. Do not treat
the confirmation or checkpoint as authorization to commit, push, merge,
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

## Metrics

Use only the launcher-issued metrics capability. Record entry and exit; metrics
failures are warnings and never proof of completion.
