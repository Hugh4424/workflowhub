---
name: spec-prd
description: Produce one maintainable task-group PRD in two version-bound calls: outline/map, then detail cards.
version: 1.0.0
---

# Spec PRD

`spec-prd` is the **唯一 single writer** and formal content owner for the planning
`prd.md`. `build-prd` only binds inputs, coordinates conditional work, presents
versions, records real replies, and reports facts. It never writes the formal
PRD body. A caller may invoke this skill from `build-prd` or as an independent,
portable call.

## Authority and write boundary

- Consume the current, explicitly confirmed decision and the necessary source
  references. A file name, summary, historical PRD, or model inference cannot
  supply missing product direction.
- The only formal write target is one `specs/<task-id>/prd.md`. No other skill,
  workflow, stage, or parallel worker may write that file. Returned text for an
  independent caller is not a claim that the file was written.
- The PRD is a planning handoff, not a fifth current material: do not write
  `spec.md`, `plan.md`, `tasks.md`, stage state, review verdict, provider fact,
  Git fact, or physical authorization.

## Exactly two internal calls

Run exactly two content calls for a normal planning request. Both calls carry
and compare the same `decision revision` and `source revision`; a mismatch is
an error, not a reason to merge versions.

1. **第一次调用 — outline/map**
   - Read the explicit decision and required sources at one bound revision.
   - Return a draft **大纲** and a **结果导向任务地图**. Organize cards by
     independently verifiable user result, not by technical layer, fixed card
     count, or copied historical wave.
   - Attach every confirmed requirement to a responsible card, an acceptance
     oracle, or an explicitly approved exclusion. Record each card's real
     `consumer`, `oracle`, `owner`, shared definitions, and four dependency
     classes: `准备依赖`, `实现依赖`, `验收依赖`, and `合并依赖`.
   - Stop before detail cards and before the formal `prd.md` write. Show the
     map revision, perform **地图核对**, and wait for a real map confirmation bound to that revision.

2. **第二次调用 — detail cards**
   - Accept only a real response confirming the currently displayed map
     revision. Re-read the current decision/source bindings and verify
     `same revision` before expanding the document.
   - For `ui_applicability=ui`, only after map confirmation run the existing
     conditional UI design chain: display the real design by complete-flow
     all in-scope UI pages, complete-flow groups, states, and viewports; bind the `真实展示版本` and record a no-omissions coverage check. Missing any in-scope page, state, viewport, or coverage evidence keeps the result draft; then
     require `display_before_reply` plus `human_approved`. Only after this coverage and confirmation produce
     detail cards.
   - For `ui_applicability=non_ui`, record the factual non-UI reason and skip
     the UI confirmation path; non-UI planning does not acquire an extra daily
     confirmation or a browser implementation.
   - Expand the same revision into the single formal PRD and write only the
     one `prd.md`. The detailed body contains the shared definitions and
     complete detail cards described by the template.

The order is therefore: same-version decision → outline/result-oriented map →
real map confirmation → only-if-UI conditional design chain → detail cards →
`prd.md`. A map response is never treated as detail-card or final confirmation.

## Post-detail final confirmation

After the second content call has rendered the detailed PRD, display that draft and
ask for one real final confirmation. This is a **post-second-call user gate**, not
a third content call: no third content call occurs for final confirmation. It
must bind the exact displayed draft to all four revisions:
`decision_revision`, `source_revision`, `map_revision`, and `prd_revision` (and
the displayed draft hash when available). A reply is valid only when its
`confirmation_revision` matches each of the four bound revisions (`decision_revision`,
`source_revision`, `map_revision`, and `prd_revision`) and records
`display_before_reply=true` plus `human_approved=true`. When a displayed draft
hash is bound, the confirmation must include the same `displayed_draft_hash`; a
hash mismatch is draft-preserving failure.

A refusal, unanswered response, or `confirmation_revision` mismatch is a real
failure fact: keep the document `draft`, report the concrete gap and affected
scope, and do not treat the draft as approved, complete, published, or ready for
handoff. This applies to both `ui_applicability=ui` and `non_ui`; non-UI skips
only the conditional UI design confirmation chain. Final PRD confirmation is not
a build-plan/build-code entry license, a new formal stage, a delivery action, or
an extra daily confirmation. After a valid final confirmation, spec-prd may
mark the same displayed PRD `final` and remains its only writer.

## Design and Experience source gaps

When a UI planning object lacks `Design.md` or `Experience.md`, first record a
truthful **任务级设计基线** and add a **规范责任卡** (specification-responsibility
card). That card must name a **real consumer** and an **oracle** for bringing the
missing project standard into the task; do not invent a person, task number, or
visual result. If both Design and Experience are missing, keep the document
`draft` and do not finalize it. Missing, stale, conflicting, unavailable, or
unreadable standards remain visible in the affected scope.

## Draft preservation and failure facts

Any failed, **拒绝**, cancelled, **取消**, **未答**, wrong-revision/**错版**, missing-source,
conflicting-source/**冲突**, or invalid shared-reference result must **保持 draft**.
Return the concrete **缺口** and **受影响范围**, including the owner and next
fact needed. In particular:

- an absent mother decision is a `缺母决定` and returns a **具体缺口**;
- a map confirmation from another revision is rejected as `错版`;
- missing or stale shared definitions/dependencies remain `失效共享引用`;
- a UI design that is not returned, is rejected, cancelled, unanswered, or
  has the wrong version cannot be promoted to final; the document **不得定稿**.
- risk acceptance or a prompt acknowledgement cannot replace a real design,
  map confirmation, or final confirmation;
- do not say complete, approved, published, delivered, or ready to start when
  the required fact was not observed.

After a source, design, or shared reference is corrected, re-read the current
materials and redo only the affected map/design/detail scope. Never silently
reuse an old confirmation.

## Independent portable calls

An **独立调用** must receive **显式输入**: confirmed decision content and
revision, required source content/revisions, the caller's requested output
mode, and any real map/design/final confirmation refs it claims. With complete
inputs it returns the same outline/map and detailed PRD content contract and may
return **仅返回正文**. With a missing decision it returns the specific gap and
affected scope. It must **不伪造** WorkflowHub identity, user reply, map or
final confirmation, `写盘`, `发布`, `归档`, provider success, host invocation,
Git result, or `物理授权`.

## Detail-card and handoff contract

Every card is a result-oriented unit and declares:

- result and `consumer`, scope, user flow and state transitions;
- requirement IDs (`FR`) and acceptance criteria (`AC`) with failure判据 and an
  executable `oracle`;
- `准备依赖`, `实现依赖`, `验收依赖`, and `合并依赖`, including shared-resource
  conflicts and integration ownership;
- source and design references with their revision, local risk, and deferred
  technical items;
- a semantic-closure **最小读取集** distinguishing required, conditional, and
  normally-unused references; and
- a copyable **五阶段开工说明** that identifies the current decision/spec/plan/
  tasks inputs for the subsequent standard development task. It does not turn
  the PRD into a fifth material.

Use stable headings/anchors for navigation and cite shared definitions once.
Do not claim token savings without execution evidence.

## Archived maintenance

Classify an archived change by commitment impact. A narrow typo, link, or
clarifying **小修** keeps its **依据** and **影响** in change notes. A
**实质变化** to direction, permission, scope, design behavior, or
acceptance must first show the before/after commitments and obtain **真实确认**;
then record the source revision, affected clauses/cards, and in-flight impact in
`变更说明`. Preserve old decision, confirmation, review, test, and physical
**历史事实**. New tasks read the current PRD and record their accepted source;
existing in-flight tasks retain their own four materials and are **不自动覆盖**.

## Boundary

This portable skill has no product UI, browser implementation, new stage,
`CURRENT_MATERIAL_FILES` entry, public command, second dispatcher, second
writer, review gate, or physical delivery controller. It reuses the existing
conditional UI semantics; it does not copy or replace `workflows/build-spec/**`.
