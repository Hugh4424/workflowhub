---
name: plan-design-review
description: Report-only UI design lens for information architecture, states, accessibility, and responsive behavior.
---

# plan-design-review

Source: adapted from the project design review baseline. Mode: `advisory`,
stage-owned, file-only; apply only when build-spec declares UI scope. It runs
before the final wh-review, which only reads its fact and does not duplicate it.

## Check

1. Identify primary user journey, information hierarchy, and interaction states.
2. Check empty, loading, error, and recovery states.
3. Check accessible names, focus order, contrast intent, and keyboard paths.
4. Check responsive constraints and component consistency.
5. Mark missing UI evidence as a packet gap rather than guessing visuals.

## Result

Return UI-specific evidence and findings only when UI scope is present.
