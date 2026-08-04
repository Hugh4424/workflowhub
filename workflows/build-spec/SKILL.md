---
name: build-spec
description: Draft, clarify, review, and revise the current feature specification.
version: 3.0.0
---

# Build Spec

## Purpose

Turn the current product direction into a clear `spec.md`. Work is driven by
the current four materials:

- `decision-log.md` — current product direction and explicit decisions.
- `spec.md` — the specification being drafted or revised.
- `plan.md` — current implementation approach, when it already exists.
- `tasks.md` — current executable work breakdown, when it already exists.

Old accepted records, receipts, review outputs, and runner history
are read-only audit facts. They never decide whether this task may continue.
Do not create replacement tasks, continuation chains, invalidations, rebinding,
or recovery machinery to revise a current specification.

## Working rules

1. Read the current decision log and any current plan or tasks before editing.
   Preserve locked product decisions. If a current plan or task conflicts with
   the direction, record the mismatch and revise the current materials; do not
   treat old material as authority.
2. Draft or revise `spec.md` directly in the task's current artifact area.
   State goal, scope, non-goals, functional requirements, acceptance criteria,
   interfaces/data/operational boundaries, risks, and assumptions in plain
   language. Each requirement and acceptance criterion needs a stable ID.
3. Keep a short current-material revision note whenever the spec changes: what
   changed, why, and which current materials it affects. Prior revisions remain
   readable audit history. A missing old revision record is disclosed, not a
   reason to stop work.
4. Use the constitution checklist, especially F3, F4, F5, F8, and F10:
   current materials enable progress; review informs quality rather than
   licenses work; add no speculative gates or automation; prefer the simplest
   adequate design. Record a real contradiction or missing information instead
   of hiding it.

## Ambiguity gate

Before calling the specification ready for review, list every material
ambiguity separately. For each one record its source, affected requirement,
and whether it can change scope, acceptance, interfaces, data, security, or
operations.

- A non-material ambiguity may be documented with its factual reason.
- A material ambiguity needs one of: a locked upstream decision, a directly
  derived fact, or a real user decision.
- Ask the user one independent decision axis at a time. Give 2–3 mutually
  exclusive options, mark one recommendation, and wait for the actual reply.
- Do not merge independent decisions into one question or invent an answer.

Unresolved material ambiguity stops a ready-for-review or ready-for-handoff
claim. It does not prohibit continuing to draft, investigate, or repair the
current materials.

## Independent review and revision

1. Once the ambiguity gate is clear, send the exact current `spec.md`, relevant
   current materials, and the ambiguity summary to one independent `wh-review`.
   The review must be genuinely run. If the provider is unavailable, timed out,
   or returned invalid output, record that result honestly as unavailable; it
   is never a pass.
2. Show the real verdict and findings. A finding is input to repair, not a
   lock on further work. Fix valid issues in the current spec; reject an invalid
   finding with a reason; or ask the user to accept a concrete risk when a
   serious issue will remain.
3. Before handoff, the main agent must inspect every finding and record its
   disposition and evidence. Do not move directly to the next stage with an
   unexplained review result. This is a quality fact and handoff record, not a
   hidden gate: unavailable or ordinary findings remain visible without
   blocking continued drafting or repair.
4. After a material spec revision, update the material revision note and rerun
   the ambiguity gate. When a prior review was `pass`, wh-review uses its
   runner-generated delta to inspect only new or changed material and direct
   impacts; it does not repeat a full review of unchanged content. If no safe
   delta exists, request another full review only when the change materially
   alters what the prior review covered; otherwise disclose the remaining
   review scope and record the fallback decision explicitly.
5. Never loop reviews to manufacture a pass or rewrite historical verdicts.

## User confirmation and handoff

Present the final current spec in a short brief: what it delivers, non-goals,
key requirements and acceptance criteria, unresolved risks, and effects on the
current plan/tasks. Ask for user confirmation only when a clarification, scope
change, or risk choice needs their decision. That conversation is not an
automatic acceptance, a new task, or permission for commit, push, merge,
archive, or cleanup.

When the spec is clear, hand off the current materials and the actual review
outcome to `build-plan`. A later material change is handled by revising the
same current materials and repeating only the affected clarification, review,
or handoff work.

## Formal-record boundary

If the runtime writes a formal stage result, let its narrow publication
preflight verify the current task/worktree/runtime identity and required output
shape. A wrong binding or malformed formal result must fail loudly at that
write boundary. Missing audit evidence is recorded as `missing` or
`unavailable`; it must not block drafting or revision, and it must not be
presented as completion.

## Communication

Use the user's language and simple Markdown. Clarification cards contain only
the question, affected scope, options, recommendation, and consequence. Review
cards state the actual reviewer, verdict, important findings, disposition, and
next step. Do not expose raw paths, hashes, receipts, or internal runtime
identifiers in user-facing messages.
