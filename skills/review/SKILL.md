---
name: review
description: Report-only independent review lens for correctness, scope, evidence, and unresolved risk.
---

# review

Source: adapted from the project review baseline. Mode: `lens-only`.

## Check

1. Separate stated facts from inferences.
2. Compare every material claim with packet evidence.
3. Flag scope drift, missing acceptance evidence, and contradictory artifacts.
4. Prefer a precise finding over a broad quality opinion.
5. Keep contract-external observations minor.

## Evidence axes and visibility

- Review on two independent axes: **Standards** (the change follows applicable engineering rules) and **Spec** (the change implements the approved requirement). Passing one axis never implies the other.
- Classify each material claim as `DIFF-VERIFIABLE`, `CROSS-REPO`, `EXTERNAL-STATE`, or `CONTENT-SHAPE`.
- `CROSS-REPO` requires the referenced contract in the sealed packet; `EXTERNAL-STATE` requires a supplied runtime receipt or human verification; `CONTENT-SHAPE` requires a supplied schema. Missing evidence is unavailable, never pass.
- Every finding names its axis, visibility class, and concrete packet anchor.

## Result

Return file or packet anchors, evidence, consequence, and a focused correction.
