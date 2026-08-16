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

## Evidence handling

- Missing evidence is unavailable, never pass. Use the supplied packet only.
- A finding may explain the affected review angle in its prose, but must not add
  `axis`, `visibility`, `anchor`, `consequence`, or `correction` output fields.
- Every finding must use only the provider protocol fields:
  `severity`, `path`, optional `line`, `issue`, `root_cause`, `recommendation`,
  `evidence_kind`, and `evidence`.

## Result

Return exactly one JSON object: `{ "findings": [...] }`. Put the packet path
and any line reference in the allowed finding fields. Do not return `verdict`,
`summary`, checklist fields, or a second object.
