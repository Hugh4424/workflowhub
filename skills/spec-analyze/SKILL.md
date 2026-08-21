---
name: spec-analyze
description: Report-only packet lens for consistency between supplied specification, plan, and task excerpts.
---

# spec-analyze

Mode: `lens-only`. Delivery: `file_only`.

This skill owns the single stage-end semantic check and its quality-fact
contract for the four authoring stages. The Stage Agent invokes the profile on
the current stage packet, and the runtime authenticates the resulting semantic
packet and validator result inside the existing stage-outcome fact.
`verify-code` is deliberately excluded: it uses the separate `dsh-code-review`
code-review skill. This is one final quality check inside the existing stage
outcome, not a second workflow engine or a work-permission gate:

- `make-decision`: original requirement + `decision-log.md`;
- `build-spec`: the above + `spec.md`;
- `build-plan`: the above + `plan.md` + `tasks.md`;
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
not create a second store, projection, or gate. The Stage Agent repairs each
finding in the current stage and invokes this same profile again after the
real change; the runtime only uses the truthful result to describe stage
quality. `unavailable`, `material_incomplete`, and `inconsistent` are never
`pass`, but they do not prevent same-task repair or invent a new task.

## Input boundary

Read only the stage packet supplied by the Stage Agent and the frozen skill bundle. For build-plan, use the generated `planning_artifacts` packet projection. It must include the decision-log `raw_requirement_index`, `approved_spec`, `acceptance_criteria`, `draft_plan`, and `draft_tasks`; when the existing source index carries them, the projection may also carry derived `DEFER-*`/`OPEN-*` entries. This projection is derived review input, not a fifth current material and not a writer. Do not request additional files, locate repository files, or infer material that is absent from the packet. The current profile also applies the stage-owned material contract: make-decision authenticates the raw-requirement projection, Talk/Clarify/Grill/confirmation facts; build-spec authenticates the structured spec and Clarify result; build-plan authenticates the existing plan/task contract; build-code authenticates the per-AC implementation-to-evidence chain. The stage outcome binds the packet and validator result to the current stage snapshot, material revision, declared analyzer step, and `spec-analyze` skill outcome.

## Check

1. Map every raw requirement/source ID from decision-log to the decision, spec, plan, task, FR/AC, and objective verification evidence that claims it.
2. Check that all original requirements, FRs, ACs, user-flow/state/boundary/non-goal/deferred facts, and confirmed constraints are represented consistently across decision-log, spec, plan, and tasks.
3. Find inconsistency, duplication, ambiguity, scope drift, orphan tasks, uncovered FR/ACs, missing source refs, and under-defined test strategy.
4. Check every Phase, task, and final aggregate for tier (`simple|feature|fullstack`), concrete testing skill, scenarios, command, expected exit, oracle, fixtures/services, evidence path, coverage limit, and STOP rule.
5. For every `DEFER-*` and `OPEN-*` item visible in the source facts or current excerpts, require a downstream owner, trigger, handoff/consumer, and close/retain condition in `decision-log`-derived facts, `spec`, `plan`, and `tasks`. Missing any one is a real `deferred_open_handoff_gap` finding; do not invent a task or owner.
6. Distinguish packet evidence from reviewer inference. Missing packet input is `material_incomplete`, not a semantic finding.
7. Return every finding with supplied artifact anchor, rule, evidence, impact, focused correction, and `disposition: pending_main_agent_review`. The main agent repairs valid findings in the current stage, reruns the affected profile, and only then declares the stage complete or hands off; the same task may continue writing and repairing its four materials while findings are being handled.

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
current implementation review. The Stage Agent records the returned lens
result in the existing stage-outcome evidence, and the existing stage
publication atomically writes the corresponding `quality/facts` and acceptance
evidence. A manifest entry or prose declaration that the check happened is not
execution evidence. Scan categories: inconsistency, duplicate, ambiguity,
underdefined, deferred/open handoff, and constitution-alignment. Constitution
alignment is record-only, 不阻断. This lens is not a provider review and does
not create a separate workflow, store, or provider-pass gate. A missing or
`unavailable` analyzer outcome is a non-pass stage-quality fact; a returned
`inconsistent` or `material_incomplete` result remains visible for same-stage
repair and cannot be relabeled as consistent. None of these facts blocks
continued repair in the same task.

Each non-summary finding requires `type`, `source_artifact`, `target_artifact`, `fr_or_task_id`, `line_or_anchor`, `impact`, `suggested_correction`, and `disposition`; any missing field is 无效/non-compliant. With no findings, report “无一致性问题”.

The frozen packet identifies `spec.md`, `plan.md`, and `tasks.md` by logical name. This lens never locates, creates, or updates an artifact.

## Severity and metrics

Severity: CRITICAL violates a core constitution requirement; HIGH identifies conflict or ambiguity; MEDIUM identifies terminology drift or missing coverage; LOW is an improvement suggestion.

Coverage Summary / Metrics: Total Requirements, Total Tasks, Coverage %, Ambiguity Count, Duplication Count, Critical Issues Count.

## Next Actions

Next Actions use severity guidance: resolve CRITICAL before declaring the stage complete; same-task implementation and repair may continue, but an unresolved CRITICAL must remain visible as a risk and cannot be described as complete. Use remediation for HIGH and MEDIUM; aggregate overflow after the 50 finding limit into a summary.
