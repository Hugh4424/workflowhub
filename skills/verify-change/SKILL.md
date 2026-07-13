---
name: verify-change
description: Report-only packet lens for light acceptance closure and supplied verification evidence.
---

# verify-change

Mode: `lens-only`. Delivery: `file_only`. Profile: `light`.

## Input boundary

Read only `review-packet.v1` and the frozen bundle. Use `verification_closure`, `test_evidence`, and changed-file entries supplied in the packet. Do not request additional files or infer a successful check from an absent record.

## Check

1. Map each supplied acceptance criterion to fresh evidence.
2. Check completion, reviewer status, and unresolved items in `verification_closure`.
3. Distinguish fresh evidence from historical claims.
4. Mark missing closure material as `material_incomplete`, not as a semantic finding.
5. Return packet anchors, observed impact, and the smallest needed correction.

## Result

Return a concise `lens-only` result for `skillResults`. This lens evaluates only the packet and does not create artifacts.
