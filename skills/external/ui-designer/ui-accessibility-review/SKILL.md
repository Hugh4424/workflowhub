---
name: ui-accessibility-review
description: Review a UI design, screenshot, prototype, codebase, or live implementation for WCAG 2.2 AA risks with evidence, severity, remediation, and verification steps. Use for accessibility planning or audit requests; do not claim conformance from screenshots or automated checks alone.
metadata:
  short-description: Evidence-based WCAG 2.2 UI review
---

# UI Accessibility Review

Evaluate accessibility early and at the level supported by the available evidence. Default to WCAG 2.2 Level AA unless the user specifies another standard or jurisdiction.

Authoritative references:

- WCAG 2.2 Recommendation: <https://www.w3.org/TR/WCAG22/>
- WCAG 2.2 Quick Reference: <https://www.w3.org/WAI/WCAG22/quickref/>
- W3C evaluation guidance: <https://www.w3.org/WAI/test-evaluate/>

## Evidence Levels

State the evidence level at the top of the review:

1. **Design intent:** brief, wireframe, screenshot, or Figma. Report design risks and required specifications; do not claim keyboard, semantic, or screen-reader behavior passed.
2. **Static implementation:** source and rendered snapshot. Add semantic and code findings, but mark dynamic and assistive-technology checks unverified.
3. **Interactive implementation:** live UI exercised with keyboard, accessibility tree, zoom/reflow, contrast measurement, motion settings, and relevant automated checks.
4. **Conformance evaluation:** representative scope plus knowledgeable manual evaluation. Do not claim this level unless the sampling and evaluation method justify it.

Automated tools find only a subset of barriers. Never convert an automated score into a conformance claim.

## Review Workflow

1. Define scope: product/platform, pages and states, viewport/input modes, target standard, known assistive technologies, and whether the UI is public or authenticated.
2. Inventory evidence. Separate measured/observed findings from source-only hypotheses and untested requirements.
3. Review the critical tasks across default, loading, empty, error, success, permission, modal, and destructive states.
4. Test what the evidence permits:
   - structure, reading order, labels, alternatives, and relationships;
   - text and non-text contrast, zoom/reflow, orientation, and text spacing;
   - keyboard operation, focus order/visibility/not-obscured, bypass, and escape behavior;
   - pointer gestures, drag alternatives, target size, cancellation, and input modality;
   - forms, errors, help consistency, redundant entry, and accessible authentication;
   - name/role/value and programmatic status messages;
   - flashing, animation, autoplay, time limits, and reduced motion.
5. Record each finding with criterion, evidence, affected users/task, severity, confidence, remediation, and a verification step.
6. Save the report to `.design/<feature-slug>/ACCESSIBILITY_REVIEW.md` when a feature folder exists; otherwise use the requested location or report in chat for a read-only review.

## Important WCAG 2.2 Distinctions

- WCAG 2.2 AA target-size minimum is 24×24 CSS pixels or an allowed spacing exception under 2.5.8. A product may intentionally require 44×44 or 48×48; label that as the product rule, not the WCAG minimum.
- Text contrast is normally 4.5:1, or 3:1 for qualifying large text. UI components and meaningful graphics generally require 3:1 against adjacent colors.
- Visible focus is not enough when sticky headers, dialogs, or overlays obscure the focused component; evaluate 2.4.11 Focus Not Obscured (Minimum).
- Authentication must not depend solely on recalling, transcribing, or solving a cognitive-function test without an accessible alternative under 3.3.8.

## Severity

| Severity | Meaning |
| --- | --- |
| Blocker | Prevents a critical task for an affected user group with no practical workaround |
| High | Causes major task failure, loss of context, or severe disorientation |
| Medium | Creates substantial friction or an unreliable workaround |
| Low | Limited impact or localized inconsistency |

Severity reflects user impact, not WCAG level alone. Keep confidence separate from severity.

## Output Contract

```markdown
# Accessibility Review: [Feature]

## Scope and evidence
- Standard: WCAG 2.2 Level AA
- Evidence level:
- Pages/states/viewports tested:
- Tools and manual methods:
- Not tested:

## Summary
- Blocker / High / Medium / Low counts
- Most affected tasks and user groups
- Conformance statement: not assessed / partial evidence / formal scope

## Findings
| ID | Severity | Criterion | Evidence | User impact | Remediation | Verification | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |

## Passed checks
| Check | Scope | Evidence |
| --- | --- | --- |

## Design requirements not yet testable
- [Requirement and later verification method]

## Residual risk and manual follow-up
- [Screen reader, real-user, platform, or state coverage still needed]
```

Link each failure to the relevant W3C criterion or understanding document. Do not mark a check passed unless it was actually exercised within the stated scope.
