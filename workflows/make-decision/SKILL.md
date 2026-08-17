---
name: make-decision
description: Clarify a real product direction through Talk, proportionate research, independent review, and user confirmation.
version: 3.2.0
---

# Make Decision

## Purpose

Turn the original requirement into one readable, user-confirmed direction in
`decision-log.md`. This stage exclusively owns user-facing Talk, necessary
research, Grill, and the decision log. `build-spec` is the only owner of
Clarify; make-decision must not run a second Clarify. Downstream stages consume
the result; they do not replay these activities or infer missing decisions.

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

- `talk-with-zhipeng`: user-facing Talk only; Clarify belongs to build-spec.
- `grill-with-docs`: challenge the chosen direction against current facts.
- `decision-log`: write the decision record.
- `wh-review`: obtain independent review evidence.

Only the main agent may execute user-facing Talk or Grill. Research
may use an independent agent or search provider, but the main agent presents the
decision and questions to the user.

## Procedure

1. Replay the original requirement. Separate confirmed facts, assumptions,
   direction-changing ambiguity, non-goals, and deferred work. Completion:
   every part of the original requirement is represented or explicitly marked
   unresolved.
2. Execute the manifest in order. Every step completion first
   uses the existing make-decision writer to append one update to the same
   `decision-log.md` ref/hash. The update records the step outcome, the actual
   user reply or `no_new_requirement`, and the current/deferred/non-goal/open
   disposition. A write failure stays incomplete with its error; it is never
   replaced by a final aggregate claim or a second log.
3. The Talk flow uses steps 3, 4, 5, and 7: Talk round 1, proportionate
   research input, Talk round 2, then Talk round 3 after direction advice.
   Research is an input to Talk, not a review.
   Research runs only when its answer could materially change direction;
   otherwise record why it was skipped. Do not invent user answers.
   Ask only questions whose answers could change direction. Talk must cover both
   architecture direction and product journey or user outcome. Talk presents a batch of independent
   questions, with each question containing one decision axis, 2-3 meaningful choices,
   and plain-language consequences and risks. Talk groups independent decision axes in one batch;
   each question still contains only one decision axis, while dependent questions move to a later
   batch after the real reply. Use the real
   `ask -> wait/pause -> user reply -> resume -> re-rank` seam; never invent a
   reply. Do not run Clarify here; `build-spec` owns the only Clarify flow.
4. Only after Talk round 2 has resumed and converged, run the direction advice
   review (step 6). It is independent advice, not a `pass` gate. Preserve the
   actual provider, transport status, findings, and provenance; unavailable,
   failure, timeout, and `MATERIAL_INCOMPLETE` remain facts. Dispose each
   finding; do not re-review unchanged material just to manufacture empty
   findings. An unavailable review is never `pass` and never becomes an empty
   findings claim.
5. After direction advice, resume Talk round 3 (step 7) so the user can address
   blind-review findings, contradictions, key assumptions, and remaining risks.
   Only after that, run `grill-with-docs` (step 8). Grill is
   interactive thinking, never review. It may present one batch only when the
   questions are independent frontier questions; dependent questions are split
   and re-ranked. It uses the real `ask -> wait/pause -> user reply -> resume`
   seam and may preserve a partial reply. It must not call wh-review or create
   a review fact. Fold only its minimal `grill_summary.decision_updates` and
   necessary CONTEXT/ADR outcome into `decision-log.md`.
6. Write the decision draft after Grill (step 9), then run the detail advice
   review (step 10). This is also advice-only, not a `pass` gate. The detail
   review must happen after Grill and the draft, never before. Preserve real
   transport and finding facts and stop rather than loop on unchanged material.
7. Present the final plain-language decision card at the approval/publish steps: direction,
   scope, non-goals, success criteria, risks, advice facts, unresolved items,
   and deferred work. Ask for the user's actual confirmation and preserve it.
   A rejection leads to a bounded revision of the same task; it does not create
   a successor task.

The old interaction aggregate still has a compatibility `clarify` slot because
its existing runtime validator is owned by the later build-spec handoff. In
this stage that slot is not a make-decision Clarify execution or confirmation;
P3 must move its active ownership to build-spec without adding a new object.

After the user confirms the final current decision, the Stage Agent directly
assembles exactly one immutable interaction aggregate with these fields. This
aggregate is an existing quality fact consumed by the declared make-decision
detail-review/quality-fact contract; its owner is make-decision. The consumer,
owner, test, and retirement condition are recorded in the existing
`decision-log` catalog entry. It is not one of the four materials, not a status
machine, and not a permission to start or continue work. If it is missing or unavailable, the
formal completion claim stays incomplete while the same task can continue to
repair the decision and its facts.

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
current material context, and user-confirmed decision. The `snapshot_tree`
field binds the current source tree for evidence integrity only; it is not
snapshot lineage, a selector, or a delivery gate. Do not create a run,
revision, latest pointer,
ledger, controlled-writer protocol, per-round record, question-card archive, or
Grill history. If the accepted decision changes before completion, assemble a
new aggregate from the new final decision; never mutate an existing hash path.
Retire this fact only when the named current consumers are removed or replaced
by a separately reviewed constitutional change; do not add a replacement state
object.

## Completion and fact writing

Do not claim this stage complete until Talk is resolved, necessary research ran
or has a truthful outcome, Grill ran, `decision-log.md` is current,
independent review findings and transport facts are recorded, every finding has a
disposition, the user explicitly confirmed the decision, and the content-addressed
interaction aggregate binds that accepted decision. The aggregate is a completion
fact, not a permit to continue working.

Missing or unavailable quality facts limit only the completion claim and do not
prevent continued Talk, drafting, decision-log revision, or finding repair in
the same task. Write
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

## Stage-end consistency

Run `stage-end-spec-analyze` after detail advice and before the user's final
confirmation. Invoke the existing `spec-analyze` skill on the original requirement, the current
`decision-log.md`, the requirements-preparation facts, and all evidence actually
produced in this stage. Check semantic coverage and real outcome evidence, not
IDs, paths, hashes, or document existence alone. Repair any finding in
make-decision before asking for confirmation; do not move it to build-spec. Only
after the user confirms this checked decision may `publish-decision` run. End
with the shared six-part plain-language summary: current stage work,
requirement coverage, upstream alignment, repairs made here, remaining risks,
and the next stage boundary.
