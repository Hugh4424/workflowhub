---
name: spec-analyze
description: Report-only packet lens for consistency between supplied specification, plan, and task excerpts.
---

# spec-analyze

Mode: `lens-only`. Delivery: `file_only`.

## Input boundary

Read only `review-packet.v1` and the frozen bundle. For build-plan, use the generated `planning_artifacts` packet projection. It must include the decision-log `raw_requirement_index`, `approved_spec`, `acceptance_criteria`, `draft_plan`, and `draft_tasks`. This projection is derived review input, not a fifth current material and not a writer. Do not request additional files, locate repository files, or infer material that is absent from the packet.

## Check

1. Map every raw requirement/source ID from decision-log to the decision, spec, plan, task, FR/AC, and objective verification evidence that claims it.
2. Check that all original requirements, FRs, ACs, user-flow/state/boundary/non-goal/deferred facts, and confirmed constraints are represented consistently across decision-log, spec, plan, and tasks.
3. Find inconsistency, duplication, ambiguity, scope drift, orphan tasks, uncovered FR/ACs, missing source refs, and under-defined test strategy.
4. Check every Phase, task, and final aggregate for tier (`simple|feature|fullstack`), concrete testing skill, scenarios, command, expected exit, oracle, fixtures/services, evidence path, coverage limit, and STOP rule.
5. Distinguish packet evidence from reviewer inference. Missing packet input is `material_incomplete`, not a semantic finding.
6. Return every finding with supplied artifact anchor, rule, evidence, impact, focused correction, and `disposition: pending_main_agent_review`. The main agent classifies the finding before declaring the stage complete or handing off; the same task may continue writing and repairing its four materials while findings are being handled.

## Result

Return a concise `lens-only` result for `skillResults`. This lens evaluates only the packet and does not create artifacts.

## Review semantics

This report-only lens is read-only and 不阻断. Scan categories: inconsistency, duplicate, ambiguity, underdefined, and constitution-alignment. Constitution alignment is record-only, 不阻断.

Each non-summary finding requires `type`, `source_artifact`, `target_artifact`, `fr_or_task_id`, `line_or_anchor`, `impact`, `suggested_correction`, and `disposition`; any missing field is 无效/non-compliant. With no findings, report “无一致性问题”.

The frozen packet identifies `spec.md`, `plan.md`, and `tasks.md` by logical name. This lens never locates, creates, or updates an artifact.

## Severity and metrics

Severity: CRITICAL violates a core constitution requirement; HIGH identifies conflict or ambiguity; MEDIUM identifies terminology drift or missing coverage; LOW is an improvement suggestion.

Coverage Summary / Metrics: Total Requirements, Total Tasks, Coverage %, Ambiguity Count, Duplication Count, Critical Issues Count.

## Next Actions

Next Actions use severity guidance: resolve CRITICAL before declaring the stage complete; same-task implementation and repair may continue, but an unresolved CRITICAL must remain visible as a risk and cannot be described as complete. Use remediation for HIGH and MEDIUM; aggregate overflow after the 50 finding limit into a summary.
