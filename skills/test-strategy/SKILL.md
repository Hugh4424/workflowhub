---
kind: sub-skill
name: test-strategy
description: Produce an AC-to-test-route strategy for verify-code from UI impact, risk level, and the L2 report summary.
---

# test-strategy

This skill is invoked as an independent sub-agent by verify-code. It does not
run tests. It writes a machine-checkable routing strategy that maps every
acceptance criterion to the minimum evidence layer that must cover it.

## Input Contract

Required inputs:

- `ui_change`: boolean. `true` means the change has a user-interface surface
  and may require P3 E2E/browser evidence. `false` means P3 can be `skip` when
  lower layers cover the acceptance criteria.
- `risk_level`: one of `low | medium | high`.
- `L2` report summary: concise integration-test summary, including every AC ID
  mentioned by the report and any coverage gaps or failures it found.

Fail loud if any required input is missing or typed incorrectly. Do not infer a
missing `risk_level` or `ui_change` value.

## Output Contract

Write `test-strategy.md` in the current task evidence directory. The file must
use YAML front-matter followed by Markdown notes for human review.

The YAML front-matter must include `ac_routes` as an object:

```yaml
---
ac_routes:
  AC-001: P0
  AC-002: P2
  AC-003: P3
  AC-004: skip
---
```

Route meanings:

- `P0`: unit-level or static contract evidence.
- `P1`: component or focused integration evidence.
- `P2`: end-to-end workflow evidence below browser level.
- `P3`: browser/UI E2E evidence.
- `skip`: explicitly not required for this AC, with a Markdown note explaining
  why.

Valid route values are `P0 | P1 | P2 | P3 | skip`.

## AC ID Parsing Rules

- AC IDs must match regex `^AC-\d+$`.
- Read the authoritative AC list from the task spec.
- Every AC ID in the spec must have exactly one route in `ac_routes`.
- Every key in `ac_routes` must exist in the spec AC list.

Machine-check failure lines are fixed:

- Missing route: `MISSING_ROUTE: {AC_ID} has no route in test-strategy.md`
- Unknown AC: `UNKNOWN_AC: {AC_ID} not found in spec AC list`

The checker must output pass only when all spec AC IDs are routed, no unknown AC
IDs are present, and every route value is in the allowed set.

## Routing Rules

- If `ui_change=true`, route UI-observable or browser-dependent ACs to `P3`.
- If `ui_change=false`, `risk_level=low`, and L2 evidence covers the behavior,
  P3 routes may be `skip`.
- Use `P2` for cross-module behavior that needs workflow-level evidence.
- Use `P1` for focused integration or component boundaries.
- Use `P0` for pure function, schema, parser, or static-contract checks.
- For `risk_level=high`, prefer the highest applicable layer and avoid `skip`
  unless the AC is explicitly out of scope for this change.

## Test Design Anti-Patterns

- **Public behavior only**: route evidence through a real public seam. Do not test private methods, internal call order, or whether a mock exists.
- **Mocks are boundaries, not assertions**: before mocking, identify the real dependency's side effects. Mock only the slow/external boundary, preserve behavior the test relies on, and keep the mock schema complete. If the test asserts mock behavior, change the seam or unmock it.
- **No test-only production API**: never add a production method, flag, endpoint, or export solely for setup/cleanup/assertion. Put it in test utilities. A production lifecycle API is valid only when production owns and uses that lifecycle.
- **Vertical slices**: use one observable behavior → one failing test → minimal implementation → passing evidence. Do not route a horizontal batch of imagined tests before implementation.
- **Independent oracle**: expected values must come from the spec, a worked example, or another independent source; do not restate the implementation in the assertion.

When a proposed route violates one of these rules, do not hide it behind a higher evidence layer. Record the anti-pattern and require the route to use a valid seam.

## Timeout Behavior

If the sub-agent call times out or no `test-strategy.md` can be produced, record
the strategy result as `yellow` with a visible timeout reason. Do not silently
invent routes after a timeout; the verify-code stage must escalate the yellow
fact for human confirmation.

## Sources

- Matt Pocock `tdd`: <https://github.com/mattpocock/skills/blob/66898f60e8c744e269f8ce06c2b2b99ce7660d5f/skills/engineering/tdd/SKILL.md> (MIT). Absorbed public seams, independent behavior, and vertical slices.
- Superpowers `testing-anti-patterns.md`: <https://github.com/obra/superpowers/blob/d884ae04edebef577e82ff7c4e143debd0bbec99/skills/test-driven-development/testing-anti-patterns.md> (MIT). Absorbed mock and test-only production API gates.
