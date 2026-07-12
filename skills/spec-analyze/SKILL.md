---
name: spec-analyze
description: Report-only packet lens for consistency between supplied specification, plan, and task excerpts.
---

# spec-analyze

Mode: `lens-only`. Delivery: `file_only`.

## Input boundary

Read only `review-packet.v1` and the frozen bundle. Use `planning_artifacts` in the packet for specification, plan, and task excerpts. Do not request additional files or infer material that is absent from the packet.

## Check

1. Map each supplied requirement to an implementation task and objective verification evidence.
2. Find inconsistency, duplication, ambiguity, and under-definition across supplied excerpts.
3. Distinguish packet evidence from reviewer inference.
4. Mark missing source material as `material_incomplete`, not as a semantic finding.
5. Return every finding with supplied artifact anchor, rule, evidence, impact, and focused correction.

## Result

Return a concise `lens-only` result for `skillResults`. This lens evaluates only the packet and does not create artifacts.

## Review semantics

This report-only lens is read-only and 不阻断. Scan categories: inconsistency, duplicate, ambiguity, underdefined, and constitution-alignment. Constitution alignment is record-only, 不阻断.

Each non-summary finding requires `type`, `source_artifact`, `target_artifact`, `fr_or_task_id`, and `line_or_anchor`; any missing field is 无效/non-compliant. With no findings, report “无一致性问题”.

Historical packet anchors can identify `spec.md`, `plan.md`, and `tasks.md`; a supplied anchor may use `specs/{task-id}/cross-artifact-analysis.md` and `facts.analysis_ref`. This lens never creates or updates that artifact.

## Severity and metrics

Severity: CRITICAL violates a core constitution requirement; HIGH identifies conflict or ambiguity; MEDIUM identifies terminology drift or missing coverage; LOW is an improvement suggestion.

Coverage Summary / Metrics: Total Requirements, Total Tasks, Coverage %, Ambiguity Count, Duplication Count, Critical Issues Count.

## Next Actions

Next Actions use severity guidance: resolve CRITICAL before implementation; use remediation for HIGH and MEDIUM; aggregate overflow after the 50 finding limit into a summary.
