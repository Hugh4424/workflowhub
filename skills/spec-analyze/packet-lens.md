# spec-analyze packet lens

Mode: `lens-only`. Delivery: `file_only`.

Inspect only `review-packet.v1` planning artifacts. Report consistency, duplication, ambiguity, and under-definition with packet anchors. Missing material is `material_incomplete`.

The packet lens is reused by the four authoring-stage profiles and is the
single stage-end semantic check for those stages. The current WorkflowHub
session supplies the current packet and the existing official stage writer
authenticates the profile result; no external Stage Agent, bridge, session or
stage outcome is required. Each profile consumes
the original requirement, the cohort-specific current material chain, and the evidence
appropriate to the current stage. It compares behavior meaning and observable
evidence, not just IDs, paths, or document presence. Findings are repaired by
the stage that found them; the lens never writes materials, calls providers, or
creates a separate work-permission gate. Its truthful result is part of the
existing stage-end quality fact. The existing stage publication is the sole
writer and atomically publishes the corresponding `quality/facts` and
acceptance evidence; the lens does not create a second store, projection, or
gate.

For post-cohort build-plan, compare the current decision-log verbatim requirement layer and its derived decisions with
`spec.md` (product plus implementation design), every independent
`phases/P<n>.md`, and `phases/index.md`. Require source → FR/AC → Phase/task →
oracle coverage, each Phase's own write set/dependency/test/STOP, and a
bijection between files and index rows. Missing Phase bodies or a duplicated
engineering body in the pointer index are findings or
`material_incomplete`, never a clean result. Pre-cohort plan/tasks remain
historical read-only inputs.

Use a census independently extracted from the current decision-log verbatim
layer as the denominator, not the packet's own `original_requirements` array
or the decision-log's derived index alone. For each source item carry exact
source ref, hash, location, original behavior and strength (quantifier, negation, ordering,
artifact form, failure). Compare the caller's source and coverage rows to
that set before calculating a numerator. Then inspect the actual spec AC and
owned Phase Task/action plus a negative oracle; matching IDs or a caller's
`semantic_match=true` are only bindings. Name the missing or weakened source
and target anchors in each finding. Treat an absent authenticated source as
`material_incomplete`, a weaker/contradictory target as `inconsistent`, and a
meaning that cannot be independently settled as `unknown` requiring semantic
review. Never manufacture a clean result from omitted rows.

The decision-log's `原始需求索引` and packet coverage are mapping claims. Read
the U/V verbatim blocks and explicit atomic rows from current file bytes first;
each extracted unit needs a stable location and a disposition in the index or
a named gap. For every decomposed U atom, compare its action, quantifier,
negation, scope, order and failure condition against the parent U quote; cite
both locations for omissions or reversed meaning. A U parent is not an extra
coverage item when its atoms cover it, and a byte-equivalent V excerpt is an
alias, but preserve both source records for audit. Compare quoted text to its
source location without treating derived commentary as another original
statement. Independent semantic review checks decomposition and target
behavior; unreviewed or ambiguous meaning remains `unknown`. This is a
temporary analysis of current material, not a persistent requirement ledger.

The final build-plan packet must be the post-review, last-revision packet.
Read back the real `spec-analyze` skill outcome and existing quality fact;
check task/stage/snapshot/material/source-hash identity. A declaration in the
step manifest, a review projection, or an old outcome is not execution proof.

The returned plain-language summary from the profile contract always has six fields: `stage_work`,
`requirement_coverage`, `upstream_alignment`, `current_stage_repairs`,
`remaining_risks`, and `next_stage_boundary`. If an input is
missing, report `material_incomplete` instead of guessing. A missing or
`unavailable` analysis is not `pass`; preserve it as an incomplete quality fact
while the current stage repairs or reruns the affected check.
