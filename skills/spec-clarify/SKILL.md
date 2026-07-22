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
interfaces, data, security, or operations. Handle one decision axis at a time;
order multiple axes by dependency and reclassify the remainder after each real
answer. Never combine output shape, input transformation, field membership, or
another independent concern into one “complete contract” question.

Use the independent-variation test before publishing a card: if two behaviors
could be chosen separately, they are two decision axes even when they concern
the same field or feature. Options that pair two independently variable
behaviors are forbidden. Split them into separate cards, obtain one real answer,
then reclassify and ask the next axis only if it is still material.

Publishing a card ends the current invocation. Return control to the invoking
host immediately and do not publish another card, revise `spec.md`, start
review, or infer an answer in the same invocation. A later invocation may
continue only after it receives the new real user reply bound to that card.
Multiple unresolved axes therefore require multiple visible ask → wait → resume
cycles; posting several cards before the first reply is forbidden.

For a material decision, present a plain-language card with 2～3 mutually
exclusive valid options. State what each means, why it is available, its direct
consequence and main risk, plus one recommended option and its reason. No
open-ended fill-in questions are allowed. Do not show internal IDs, hashes,
receipts, attempts, or runner details. Keep formal evidence references out of
the question. If upstream already supplied choices or a
recommendation, preserve them exactly instead of creating replacements.

When locked constraints leave only one valid outcome, apply that outcome as a
derived specification fact and record the reasoning; it is no longer a user
decision. Apply actual confirmed answers to `spec.md` through the supplied
writer. Preserve requirement IDs and append a clarification record containing
the decision axis, its classification and source, the answer, affected
requirements, consequences, risks, and any superseded wording. Unanswered
material ambiguity is reported, never silently defaulted.
