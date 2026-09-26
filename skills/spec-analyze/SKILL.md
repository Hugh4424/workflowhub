---
name: spec-analyze
description: Report-only final consistency analysis from original requirements to current decision, spec, and cohort-specific plan/Phase materials.
---

# spec-analyze

Mode: `lens-only`. Delivery: `file_only`.

This skill owns the stage-end report-only consistency check and its quality-fact
contract for the four authoring stages. The current WorkflowHub session
invokes the profile on its available current materials, and the existing
stage publication records its result as a quality fact. For post build-plan,
packet metadata is optional input: missing metadata does not make readable
current materials incomplete.
No external Stage Agent, bridge, session packet, or stage-outcome envelope is
required for this check.
`verify-code` is deliberately excluded: it uses the separate `Architect-Code-Review`
code-review skill. This is one final quality check inside the existing stage
outcome, not a second workflow engine or a work-permission gate:

- `make-decision`: original requirement + `decision-log.md`;
- `build-spec`: the above + `spec.md`;
- `build-plan`: pre-cohort uses the above + `plan.md` + `tasks.md`;
  post-cohort uses current `decision-log.md`, global product and
  implementation `spec.md`, every independent `phases/P<n>.md`, and pure
  pointer `phases/index.md`;
- `build-code`: the above + implementation, tests, and acceptance evidence.

For post build-plan, the raw requirement layer is the current decision-log statement layer; it is read-only context, not a separate inventory. The runtime reports only material structure, references,
and index agreement in the current decision, spec, Phases, and index. The existing
independent merged review, finding disposition and actual user confirmation
carry the semantic quality judgment. `reported` means the check ran; it never
means semantic consistency or review pass. Other profiles retain their
existing requirement and behavior analysis. Missing required material returns
`material_incomplete`; a missing machine inventory does not.
The analyzer itself does not write any of the four materials, call a provider,
or create a review verdict. The existing stage publication is the sole
publication owner: it atomically writes the authenticated result to the
existing `quality/facts/*.json` and corresponding acceptance evidence under
`quality/evidence/`, using the existing store and writer. `spec-analyze` does
not create a second store, projection, or gate. The current WorkflowHub
session repairs each finding in the current stage and invokes this same
profile again after the real change; the runtime only uses the truthful result
to describe stage quality. `unavailable`, `material_incomplete`, and `inconsistent` are never
`pass`, but they do not prevent same-task repair or invent a new task.

For post-cohort build-plan, `spec.md` owns global implementation design and
each `phases/P<n>.md` is the sole authority for its own engineering delta.
`phases/index.md` is a pure pointer execution index. Reject a duplicate Phase
body, command/oracle/task-card procedure, an active `plan.md`/`tasks.md`
writer or equality path, or a missing/unreferenced Phase. Retain historical
pre-cohort material as read-only input.

## Input boundary

For pre-cohort profiles, read the current stage packet and frozen skill bundle.
For post-cohort build-plan, read the current authenticated worktree's `decision-log.md`,
`spec.md` product/implementation design and ACs, every independent Phase
file, and `phases/index.md`. Missing one of these required materials is
`material_incomplete`, not an empty plan or inferred Phase. A packet projection,
when present, is review input, not a material writer or required source. The
current stage publication binds the result to its snapshot and material
revision. Pre-cohort packets keep their historical `draft_plan`/`draft_tasks`
names read-only.

For the final post build-plan report, check that current required files exist,
their FR/AC and Phase/Task structure is present, references resolve, and the
index points to the Phase authorities. A structural result does not certify
source-requirement coverage or behavior preservation; those questions belong
to the independent merged review and its finding disposition.
Neither a caller-supplied `original_requirements`/`coverage` array nor a
separate raw-requirement inventory is an input or completion condition. See
`packet-lens.md`.

## Check

1. For post build-plan, the runtime checks FR/AC form, Phase/Task references,
   dependencies and index agreement. Report structural gaps with file/section
   anchors. The independent merged review owns requirement omissions and
   preserved-behavior judgments. For other profiles,
   retain their existing original-requirement comparison.
2. For post build-plan, report missing files, sections, required fields and
   broken references; do not describe a structural result of `reported` as
   semantic consistency. For `make-decision`,
   separately assess requirement coverage, goal achievement, acceptance
   clarity, solution convergence, and the plain-language end card. For
   `build-spec`, compare the spec against the upstream decision-log for
   invented product direction and record whether Clarify was triggered or
   explicitly skipped with reason and zero open items.
3. The independent merged review is the owner of behavior-strength judgments
   and source-requirement omissions, including quantifiers, negation, order,
   artifact form, failure and scope. The post report names only structural
   duplication, orphan references and absent test fields.
4. Check each independent Phase authority and final aggregate for tier (`simple|feature|fullstack`), concrete testing skill, scenarios, command, expected exit, oracle, fixtures/services, evidence path, coverage limit, and STOP rule. Check `phases/index.md` only for authority ref, semantic anchor, write set, dependency, and consumer; require a bijection with Phase files and exact header agreement.
5. For pre-cohort profiles, check each visible `DEFER-*` and `OPEN-*` item for
   a downstream owner, trigger, handoff/consumer and close/retain condition.
   For post build-plan, the independent merged review owns this semantic
   handoff check; the structural report must not claim it was performed.
6. Distinguish material evidence from reviewer inference. A missing required
   material is `material_incomplete`, not a semantic finding; for post
   build-plan, a missing packet projection alone is not missing material.
7. Return every finding with supplied artifact anchor, rule, evidence, impact, focused correction, and `disposition: pending_main_agent_review`. The main agent repairs valid findings in the current stage, reruns the affected profile, and only then declares the stage complete or hands off; the same task may continue writing and repairing its four materials while findings are being handled.
8. At post build-plan step `final-spec-analyze`, run this profile after finding
   disposition and the last material revision. Bind its report to the current
   task, stage, snapshot and material revision through the existing stage
   publication. A manifest/dependency declaration or `wh-review` packet alone
   is not an invocation. Missing execution/publication is
   `unavailable/missing`, not `consistent`; keep same-task repair possible.

## Result

Return a concise `lens-only` result for `skillResults`. For post build-plan,
the report reads current materials and records structural observations; the
existing stage publication turns the authenticated result into current quality
facts and acceptance evidence. `reported` is execution status only.

Every successful profile analysis returns this six-part plain-language
summary, generated from current facts:

1. 当前阶段做了什么（`stage_work`）；
2. 当前材料的结构映射范围；post 语义覆盖只引用独立 review（`requirement_coverage`）；
3. 可见的结构引用缺口；post 语义结论只引用独立 review（`upstream_alignment`）；
4. 当前阶段当场修复了什么（`current_stage_repairs`）；
5. 剩余风险、未决和延期（`remaining_risks`）；
6. 下游可以直接消费什么、不能自行猜什么（`next_stage_boundary`）。

发现问题时，当前 stage 先修复，再复查受影响范围；不能把问题静默交给下游。

## Review semantics

This lens is read-only and 不阻断工作. At the end of each of the four
authoring stages it is the stage-end consistency report, invoked after finding
disposition and the last stage-material revision, immediately before publish or
handoff. `verify-code` does not invoke this lens; it uses `Architect-Code-Review` for
current implementation review. The current WorkflowHub session records the
returned lens result through the existing stage publication. A manifest entry
or prose declaration that the check happened is not execution evidence. The
pre-cohort profiles scan inconsistency, duplication, ambiguity, underdefinition,
deferred/open handoff and constitution alignment. Post build-plan reports
structural/reference gaps only; independent review owns semantic categories.
Constitution alignment is record-only, 不阻断. This lens is not a provider review and does
not create a separate workflow, store, or provider-pass gate. A missing or
`unavailable` analyzer outcome is a non-pass stage-quality fact; a returned
`inconsistent` or `material_incomplete` result remains visible for same-stage
repair and cannot be relabeled as consistent. None of these facts blocks
continued repair in the same task.

Each non-summary finding requires `type`, `source_artifact`, `target_artifact`, `fr_or_task_id`, `line_or_anchor`, `impact`, `suggested_correction`, and `disposition`; any missing field is 无效/non-compliant. For post build-plan with no reported gaps, say “未发现结构或引用缺口；需求语义结论见独立审查”, not “semantic consistency passed”.

The current authenticated worktree identifies post-cohort `spec.md`, each
`phases/P<n>.md`, and `phases/index.md` by logical name. This lens never
creates or updates an artifact.

## Severity and metrics

Severity: CRITICAL violates a core constitution requirement; HIGH identifies conflict or ambiguity; MEDIUM identifies terminology drift or missing coverage; LOW is an improvement suggestion.

Coverage Summary / Metrics: Total Requirements, Total Tasks, Coverage %, Ambiguity Count, Duplication Count, Critical Issues Count. For post build-plan, counts and percentages are structural observations, never a semantic coverage verdict.

## Next Actions

Next Actions use severity guidance: resolve CRITICAL before declaring the stage complete; same-task implementation and repair may continue, but an unresolved CRITICAL must remain visible as a risk and cannot be described as complete. Use remediation for HIGH and MEDIUM; aggregate overflow after the 50 finding limit into a summary.
