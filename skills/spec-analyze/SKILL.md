---
name: spec-analyze
description: Report-only final consistency analysis from original requirements to current decision, spec, and cohort-specific plan/Phase materials.
---

# spec-analyze

Mode: `lens-only`. Delivery: `file_only`.

This skill owns the single stage-end semantic check and its quality-fact
contract for the four authoring stages. When a current stage packet is
available, the current WorkflowHub session invokes the profile and the
existing stage publication records its result as a quality fact; when the
packet is unavailable, it records `material_incomplete`/`missing` honestly.
No external Stage Agent, bridge, session packet, or stage-outcome envelope is
required for this check.
`verify-code` is deliberately excluded: it uses the separate `dsh-code-review`
code-review skill. This is one final quality check inside the existing stage
outcome, not a second workflow engine or a work-permission gate:

- `make-decision`: original requirement + `decision-log.md`;
- `build-spec`: the above + `spec.md`;
- `build-plan`: pre-cohort uses the above + `plan.md` + `tasks.md`;
  post-cohort uses the `decision-log.md` verbatim requirement layer, global product and
  implementation `spec.md`, every independent `phases/P<n>.md`, and pure
  pointer `phases/index.md`;
- `build-code`: the above + implementation, tests, and acceptance evidence.

The profile checks actual behavior meaning, state/scenario/boundary coverage,
artifact references, and fresh evidence. IDs and existing files are only
bindings, never proof. Missing input returns `material_incomplete`; semantic
drift or stale evidence returns a finding for repair in the current stage.
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

Read only the current stage packet and frozen skill bundle. For post-cohort
build-plan, its `planning_artifacts` projection must include the decision-log
raw requirement index, `spec.md` product/implementation design and ACs, every
independent Phase file, and the index. Missing required input is
`material_incomplete`, not an empty plan or inferred Phase. The projection is
review input, not a material writer. The current stage publication binds the
result to its snapshot and material revision. Pre-cohort packets keep their
historical `draft_plan`/`draft_tasks` names read-only.

For the final post build-plan analysis, use the current authenticated worktree's
`decision-log.md` **verbatim statement layer** as original-source authority.
Read those bytes independently of `planning_artifacts` and the caller's
`original_requirements`/`coverage` arrays. Preserve each statement's location,
exact text and material revision; split explicit atomic items such as U-002
without dropping qualifiers. Reconcile every extracted unit with the
decision-log's `原始需求索引`, then decision, spec, Phase Task and oracle. The index
is a mapping, not a self-declared denominator. No separate transcript export
or manifest raw inventory is required. Missing verbatim material or an
unmapped unit is `material_incomplete`/a named gap; an undecidable semantic
split remains `unknown`, never silently `consistent`. See `packet-lens.md`.

## Check

1. Derive the source census independently from current decision-log verbatim
   bytes and explicit atomic rows; compare its IDs/locations with the
   decision index and packet's `original_requirements`/`coverage`. A missing
   middle item fails even when the packet says 2/2.
   Then map every source through the decision-log, `spec.md`, and each
   `phases/P<n>.md` to FR/AC, Task, and normal/failure oracle/evidence.
2. Check that all original requirements, FRs, ACs, user-flow/state/boundary/non-goal/deferred facts, and confirmed constraints are represented consistently across decision-log, spec, phase authority, and pointer index. For `make-decision`, separately assess requirement coverage, goal achievement, acceptance clarity, solution convergence, and the plain-language end card. For `build-spec`, compare the spec against the upstream decision-log for invented product direction and record whether Clarify was triggered or explicitly skipped with reason and zero open items.
3. Compare behavior strength, not normalized-string containment: retain
   quantifiers such as every/at least, negation, order, independent physical
   artifact form, failure behavior and scope. A weaker target, misplaced AC,
   empty Task action or oracle that cannot fail gets a source-anchored finding;
   undecidable equivalence remains `unknown` for independent semantic review.
   Find duplication, ambiguity, scope drift, orphan tasks, uncovered FR/ACs,
   missing source refs, and under-defined test strategy.
4. Check each independent Phase authority and final aggregate for tier (`simple|feature|fullstack`), concrete testing skill, scenarios, command, expected exit, oracle, fixtures/services, evidence path, coverage limit, and STOP rule. Check `phases/index.md` only for authority ref, semantic anchor, write set, dependency, and consumer; require a bijection with Phase files and exact header agreement.
5. For every `DEFER-*` and `OPEN-*` item visible in the source facts or current excerpts, require a downstream owner, trigger, handoff/consumer, and close/retain condition in `decision-log`-derived facts, `spec`, and the cohort's current engineering authority (pre: `plan.md`/`tasks.md`; post: owning `phases/P<n>.md` and pointer index). Missing any one is a real `deferred_open_handoff_gap` finding; do not invent a task or owner.
6. Distinguish packet evidence from reviewer inference. Missing packet input is `material_incomplete`, not a semantic finding.
7. Return every finding with supplied artifact anchor, rule, evidence, impact, focused correction, and `disposition: pending_main_agent_review`. The main agent repairs valid findings in the current stage, reruns the affected profile, and only then declares the stage complete or hands off; the same task may continue writing and repairing its four materials while findings are being handled.
8. At post build-plan step `final-spec-analyze`, run this profile after finding
   disposition and the last material revision. Verify the actual skill outcome
   and the existing stage-quality fact have the same task, stage, snapshot,
   material revision and source hashes. A manifest/dependency declaration or
   `wh-review` packet alone is not an invocation. Missing execution/publication
   is `unavailable/missing`, not `consistent`; keep same-task repair possible.

## Result

Return a concise `lens-only` result for `skillResults`. This lens evaluates
only the packet and does not create artifacts; the existing stage publication
turns the authenticated result into the current quality facts and acceptance
evidence atomically.

Every successful profile analysis returns this six-part plain-language
summary, generated from current facts:

1. 当前阶段做了什么（`stage_work`）；
2. 原始需求覆盖到什么程度（`requirement_coverage`）；
3. 与上游产物、实际语义和证据是否一致（`upstream_alignment`）；
4. 当前阶段当场修复了什么（`current_stage_repairs`）；
5. 剩余风险、未决和延期（`remaining_risks`）；
6. 下游可以直接消费什么、不能自行猜什么（`next_stage_boundary`）。

发现问题时，当前 stage 先修复，再复查受影响范围；不能把问题静默交给下游。

## Review semantics

This lens is read-only and 不阻断工作. At the end of each of the four
authoring stages it is the only stage-end semantic check, invoked after finding
disposition and the last stage-material revision, immediately before publish or
handoff. `verify-code` does not invoke this lens; it uses `dsh-code-review` for
current implementation review. The current WorkflowHub session records the
returned lens result through the existing stage publication. A manifest entry
or prose declaration that the check happened is not execution evidence. Scan
categories: inconsistency, duplicate, ambiguity,
underdefined, deferred/open handoff, and constitution-alignment. Constitution
alignment is record-only, 不阻断. This lens is not a provider review and does
not create a separate workflow, store, or provider-pass gate. A missing or
`unavailable` analyzer outcome is a non-pass stage-quality fact; a returned
`inconsistent` or `material_incomplete` result remains visible for same-stage
repair and cannot be relabeled as consistent. None of these facts blocks
continued repair in the same task.

Each non-summary finding requires `type`, `source_artifact`, `target_artifact`, `fr_or_task_id`, `line_or_anchor`, `impact`, `suggested_correction`, and `disposition`; any missing field is 无效/non-compliant. With no findings, report “无一致性问题”.

The frozen packet identifies post-cohort `spec.md`, each `phases/P<n>.md`, and
`phases/index.md` by logical name. This lens never locates, creates, or updates
an artifact.

## Severity and metrics

Severity: CRITICAL violates a core constitution requirement; HIGH identifies conflict or ambiguity; MEDIUM identifies terminology drift or missing coverage; LOW is an improvement suggestion.

Coverage Summary / Metrics: Total Requirements, Total Tasks, Coverage %, Ambiguity Count, Duplication Count, Critical Issues Count.

## Next Actions

Next Actions use severity guidance: resolve CRITICAL before declaring the stage complete; same-task implementation and repair may continue, but an unresolved CRITICAL must remain visible as a risk and cannot be described as complete. Use remediation for HIGH and MEDIUM; aggregate overflow after the 50 finding limit into a summary.
