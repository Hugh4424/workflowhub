# spec-analyze packet lens

Mode: `lens-only`. Delivery: `file_only`.

Inspect only `review-packet.v1` planning artifacts. Report consistency, duplication, ambiguity, and under-definition with packet anchors. Missing material is `material_incomplete`.

The packet lens is reused by five stage-specific profiles. The Stage Agent supplies the current packet and the existing stage-outcome bridge authenticates the profile result. Each profile consumes
the original requirement, the cumulative four-material chain, and the evidence
appropriate to the current stage. It compares behavior meaning and observable
evidence, not just IDs, paths, or document presence. Findings are repaired by
the stage that found them; the lens never writes materials, calls providers, or
acts as a work gate.

The returned plain-language summary from the profile contract always has six fields: `stage_work`,
`requirement_coverage`, `upstream_alignment`, `current_stage_repairs`,
`remaining_risks`, and `next_stage_boundary`. If an input is
missing, report `material_incomplete` instead of guessing.
