---
name: make-decision
description: Clarify a real product direction through Talk, proportionate research, independent review, and user confirmation.
version: 3.0.0
---

# Make Decision

## Purpose

Turn the original requirement into one readable, user-confirmed direction in
`decision-log.md`. This stage exclusively owns user-facing Talk, Clarify,
necessary research, Grill, and the decision log. Downstream stages consume the
result; they do not replay these activities or infer missing decisions.

## Authority

The current task has four working materials:

1. `decision-log.md`
2. `spec.md`
3. `plan.md`
4. `tasks.md`

`make-decision` owns `decision-log.md`. Read the original requirement and any
current materials that already exist. Old accepted records, reviews, execution
records, worktrees, and history are audit facts only; they neither authorize nor
block Talk, drafting, revision, or same-task repair.

Keep three conclusions separate:

- Work may continue while the current requirement and materials can be read.
- A fact write with a wrong task, workspace, runtime, hash, schema, or declared
  write boundary fails loudly for that write.
- Stage completion additionally requires the real decision work and quality
  facts listed below.

A failed fact write never freezes the conversation or material repair. Preserve
the error, fix the binding or content, and continue in the same task.

## Portable dependencies

Use the dependency packages declared in `skill-deps.yaml` directly. Open each
dependency's declared `SKILL.md` and follow it in the current agent context. Do
not route them through a dispatcher, invocation protocol, or auxiliary progress
gate.

- `talk-with-zhipeng`: user-facing Talk and Clarify.
- `grill-with-docs`: challenge the chosen direction against current facts.
- `decision-log`: write the decision record.
- `wh-review`: obtain independent review evidence.

Only the main agent may execute user-facing Talk, Grill, or Clarify. Research
may use an independent agent or search provider, but the main agent presents the
decision and questions to the user.

## Procedure

1. Replay the original requirement. Separate confirmed facts, assumptions,
   direction-changing ambiguity, non-goals, and deferred work. Completion:
   every part of the original requirement is represented or explicitly marked
   unresolved.
2. Run visible Talk and Clarify. Talk must cover both architecture direction and
   product journey or user outcome. Ask only questions whose answers could
   change direction, one at a time when practical. Offer 2-3 meaningful choices
   with plain-language consequences and risks. Do not invent user answers.
   Keep the dependency's candidate queues and question cards in the current
   conversation only. Accept only its minimal `talk`, `clarify`, and
   `decision_updates` result. Completion: `talk` truthfully reports architecture
   and user-outcome coverage, while `clarify.open_direction_changing_questions`
   is `0` after a real reply or because no direction-changing ambiguity exists.
3. Research only when the answer could materially change the direction. Use a
   narrow, non-sensitive question and report only findings that change scope,
   constraints, feasibility, or risk. Otherwise record a short skip reason.
   Completion: every necessary research question has a finding or a truthful
   `unavailable`; unnecessary research has a reason for skipping.
4. Use `grill-with-docs` once the direction is stable. Present its useful
   challenge in plain language: options, consequences, risks, conflicts, and
   disposition. Fold its minimal `grill_summary.decision_updates` and necessary
   CONTEXT/ADR outcome into `decision-log.md`, then discard the session history;
   do not pass Grill facts downstream or store a separate Grill record.
   Completion: every direction-changing challenge is resolved or remains visible
   as an unresolved risk in `decision-log.md`.
5. Use `decision-log` to write `decision-log.md`. For every load-bearing
   decision record the original source, facts and constraints, choice and
   rationale, affected scope, consequences, risks, rejected alternatives,
   non-goals, unresolved items, and deferred work. Completion: the record is
   readable without reconstructing the Talk history and does not claim an
   answer the user did not give.
6. Use `wh-review` directly for independent findings on the current requirement
   and decision. An `unavailable` review is never `pass`; it remains a truthful
   quality fact and does not block same-task work. Review context maps are optional; provide them only when they
   improve the review. Preserve actual provider, model, session, transport status,
   findings, error, and provenance. `MATERIAL_INCOMPLETE`, failure, timeout, and
   `unavailable` remain review facts. Completion: one real independent review
   attempt is recorded or its real unavailability is recorded. A real
   unavailable fact is not a pass and does not make the stage formally complete.
7. Dispose every finding as `fixed`, `rejected_invalid`, `accepted_risk`, or
   `needs_human`. Repair valid findings in this task; reject invalid findings
   with evidence; ask the user before accepting a concrete serious risk. Do not
   repeat an unchanged review merely to manufacture empty findings. Completion: no
   finding is unexplained.
8. Present a short decision card: direction, scope, non-goals, success criteria,
   main risks, review fact, unresolved items, and deferred work. Ask the user to
   accept or reject it and preserve the actual answer. A rejection leads to
   another bounded revision of this same task.

After the user accepts the final current decision, the Stage Agent directly
assembles exactly one immutable interaction aggregate with these fields:

```json
{
  "schema_version": "workflowhub-interaction-aggregate.v1",
  "task_id": "<current task>",
  "stage": "make-decision",
  "snapshot_tree": "<current snapshot tree>",
  "talk": {
    "status": "completed",
    "round_count": 3,
    "architecture_direction_covered": true,
    "user_outcome_covered": true
  },
  "clarify": {
    "status": "resolved",
    "open_direction_changing_questions": 0,
    "resolved_by": "user_reply"
  },
  "decision_ref": "<current decision-log ref>",
  "decision_hash": "<current decision-log hash>"
}
```

Serialize the aggregate once, hash those exact bytes with SHA-256, and write it
directly to `quality/evidence/interactions/<sha256>.json`. The path hash must
match the stored bytes. Bind only the current task, `make-decision` stage,
snapshot, and accepted decision. Do not create a run, revision, latest pointer,
ledger, controlled-writer protocol, per-round record, question-card archive, or
Grill history. If the accepted decision changes before completion, assemble a
new aggregate from the new final decision; never mutate an existing hash path.

## Completion and fact writing

Do not claim this stage complete until Talk and Clarify are resolved, necessary
research ran or has a truthful outcome, Grill ran, `decision-log.md` is current,
independent review findings and transport facts are recorded, every finding has a
disposition, the user explicitly accepted the decision, and the content-addressed
interaction aggregate binds that accepted decision. The aggregate is a completion
fact, not a permit to continue working.

Missing or unavailable quality facts limit only the completion claim. They do
not prevent continued Talk, decision-log revision, or finding repair. Write
current facts only to the task's existing fact and quality stores. If a
structural check rejects a write, report that exact failure; never turn it into
success or create a substitute record.

## Communication and stage end

Use the user's language and plain-language cards. Keep paths, hashes, refs, and
commands in formal records. Before moving to `build-spec`, explain what was
decided, scope and non-goals, remaining risks, deferred work, and what downstream
stages must not guess. Wait for the user's actual reply before handoff; without
that reply keep the stage `in_progress`/`pending` and do not claim completion.

Downstream stages read this summary and the four materials. They must not ask the
user to repeat Talk or Grill, and they need no index of the decision process.
