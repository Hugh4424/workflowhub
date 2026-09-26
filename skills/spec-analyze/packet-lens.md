# spec-analyze packet lens

Mode: `lens-only`. Delivery: `file_only`.

Inspect current planning materials and the available packet. For post build-plan, report structural and reference gaps with material anchors. Missing required material is `material_incomplete`.

The packet lens is reused by the four authoring-stage profiles as a
stage-end report-only consistency check. The current WorkflowHub
session supplies the current packet and the existing official stage writer
authenticates the profile result; no external Stage Agent, bridge, session or
stage outcome is required. Each profile consumes
available requirement facts, the cohort-specific current material chain, and the evidence
appropriate to the current stage. For post build-plan, the runtime reports
only current material structure, references and index agreement; the
independent merged review judges requirement omissions and behavior meaning. Findings are repaired by
the stage that found them; the lens never writes materials, calls providers, or
creates a separate work-permission gate. Its truthful result is part of the
existing stage-end quality fact. The existing stage publication is the sole
writer and atomically publishes the corresponding `quality/facts` and
acceptance evidence; the lens does not create a second store, projection, or
gate.

For post-cohort build-plan, read the current authenticated worktree's
`decision-log.md`, `spec.md` (product plus implementation design), every
independent `phases/P<n>.md`, and `phases/index.md`. Report missing files,
sections, FR/AC or Phase/Task fields, broken references and file/index
disagreement. A present ID or a result of `reported` does not prove source
coverage or behavioral equivalence. The independent merged review checks
requirement omissions, quantifiers, negation, order, artifact form and failure
behavior. Missing required material is `material_incomplete`; semantic
uncertainty remains with the independent review. The existing independent merged review,
finding disposition and actual user confirmation carry the semantic quality
judgment. `reported` is an execution status, not semantic consistency or
review pass. This report does not require a machine source census, caller-supplied
`original_requirements`/`coverage` rows, or a separate raw-requirement
inventory. Pre-cohort plan/tasks remain historical read-only inputs.

Run the final post build-plan report after finding disposition and the last
material revision. Read back its existing quality fact and check current
task/stage/snapshot/material identity. A declaration in the step manifest, a
review projection, or an old outcome is not execution proof.

The returned plain-language summary from the profile contract always has six fields: `stage_work`,
`requirement_coverage`, `upstream_alignment`, `current_stage_repairs`,
`remaining_risks`, and `next_stage_boundary`. If an input is
missing, report `material_incomplete` instead of guessing. A missing or
`unavailable` analysis stays visible for same-task repair; the report does not
grant a semantic quality verdict.
