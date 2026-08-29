---
name: spec-clarify
description: Resolve material ambiguity in supplied specification content.
---

# Spec Clarify

Receive the current `spec.md`, accepted upstream decision material, and
controlled named-artifact callbacks from build-spec. Never derive or accept
task, root, repository, or product paths.

Before asking anything, classify every relevant statement as:

1. **Locked upstream decision**: already decided; inherit its wording, option
   meaning, ordering, recommendation, and semantics without renaming or asking
   again.
2. **Upstream unresolved item**: explicitly left for specification.
3. **New ambiguity**: first discovered in the current draft.

Compare the current draft and every candidate option with the locked decisions.
Discard candidates that conflict with a locked decision. If all candidates
conflict, do not show a fake choice: report the upstream/spec contradiction and
the exact completion condition back to build-spec for repair. Do not ask the
user to invent a fourth option.

Identify only unresolved ambiguities that materially change scope, acceptance,
interfaces, data, security, or operations. Put independent axes into one batch;
dependent axes stay out of that batch and are re-ranked after the real answer.
Each question still contains only one decision axis. Never combine output shape,
input transformation, field membership, or another independent concern into one
“complete contract” question.

一张卡可以包含多个互相独立的问题；每题只处理一个决策轴。不要把这些独立问题退化成
逐个单题提问，也不要把有依赖的问题提前塞进同一批。

Use the independent-variation test before publishing a card: if two behaviors
could be chosen separately, they are two decision axes even when they concern
the same field or feature. Options that pair two independently variable
behaviors are forbidden. Split them into separate cards, obtain one real answer,
then reclassify and ask the next axis only if it is still material.

Publishing a batch card ends the current invocation. Return control to the
invoking host immediately and do not publish another batch, revise `spec.md`,
start review, or infer an answer in the same invocation. A later invocation may
continue only after it receives the new real user reply bound to that batch.
Dependent unresolved axes require later visible ask → wait → resume cycles;
posting a dependent card before the first reply is forbidden.

For material decisions, present one plain-language batch card containing only
current status (`spec-clarify`, batch number, current ambiguity count), a group
of independent questions, affected scope, and 2～3 mutually exclusive valid
options per question. State each option's direct consequence and main risk, plus
one recommended option and its reason for each question. 用户直接回答选项编号。
Do not add completed-work, next-step, or generic user-action sections. No
open-ended fill-in questions are allowed. Do not show internal IDs, hashes,
receipts, attempts, or runner details. Keep formal evidence references out of
the question. If upstream already supplied choices or a
recommendation, preserve them exactly instead of creating replacements.

When there is no material ambiguity, record an explicit `trigger=false` outcome
with a reason and zero open direction-changing questions. Never silently skip
Clarify; the absence of ambiguity must be as explicit and reviewable as a real
ask → wait → reply → resume cycle.

## 十个维度（Ten-dimension）completeness check

Before handing a clarified direction to `build-spec`, the main agent checks
these ten dimensions against the original requirement and current facts: user
journey, page/surface scope, data and state transitions, success boundary,
failure boundary, permissions/actors, integrations and external effects,
non-goals, deferred handoff, and acceptance/observable evidence. This is an
index of unresolved decisions, not a second specification. A missing dimension
is recorded as `unknown`, `deferred`, or a real user question; it is never
silently filled in by `build-spec` or a sub-agent.

Talk, Grill, and Clarify are communication work owned by the main agent. A
sub-agent may supply facts or an independent critique, but may not ask the user,
answer for the user, or turn an inferred answer into a confirmed decision.
