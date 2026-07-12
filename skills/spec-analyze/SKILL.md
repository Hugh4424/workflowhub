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
