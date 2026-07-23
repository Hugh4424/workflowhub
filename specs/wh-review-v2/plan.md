# wh-review v2 — implementation plan

## Dependency

This worktree consumes `workflowhub-result.v2` from the sibling 3rd-review task. Its public contract must be implemented before WorkflowHub wires the v2 provider client.

## Phase 1 — Configuration and route resolver

- Add `wh_review.v2` schema/config loading and an explicit legacy fallback when the section is absent.
- Resolve declared profile IDs against the trusted 3rd-review registry; persist effective profile snapshot/hash.
- Resolve eligible unique-adapter coverage locally, but send the complete candidate group to 3rd-review once; persist its `SAME_SOURCE` attestations. Fail loud, with behavior tests, for each of: declared but unresolved/disabled profile, unavailable adapter, invalid model fact, and zero eligible reviewer.
- When the configured heterogeneous quorum is not met, keep the attempt `unavailable`, retain every provider diagnostic (including `SAME_SOURCE`), and never aggregate the partial group as pass or revise.
- Implement the exact build-code Kimi/Codex route and `single_external` coverage.

## Phase 2 — Packet planner and contract v2

- Add stage-specific packet plans, manifests and inclusion/exclusion provenance; every packet carries its reviewer lenses.
- Enforce blind direction, context/evidence maps for spec/plan/verify, and full phase/direct impact maps for code.
- Generate `change-map.json` binding phase/base/candidate trees, changed files and hunks; require phase/impact maps to cover every change ID and reuse/AC entries to name change IDs plus selected anchors or a concrete no-context reason.
- For code packets, generate a snapshot-bound test summary and select directly affected consumers/dependencies/tests. Reject missing required authority; changed-file context is allowed only outside every diff hunk with an explicit `outside_diff_reason`; raw test logs are always excluded; never truncate or size-reject a packet. A live review has no WorkflowHub time or token termination cap; liveness is delegated to the 3rd-review supervision contract and must be observed, not budget-terminated.

## Phase 3 — Evidence-first aggregation and ledger

- Implement finding validation, host IDs, clustering, deterministic caps and coverage-aware adjudication: direct evidence can establish blocking/major; inferred major requires two adapters or an objective machine fact; invalid anchors cannot block.
- Add optional append-only response ledger with fixed, rejected-as-invalid, and human accepted-risk states as external audit data; missing or invalid evidence stays explicitly unverified.

## Phase 4 — Controllers, reports and compatibility

- Implement `full_on_structural_rework` routing for spec/plan/explicit verify diagnostics: normal or unverified repair has no second call; only explicitly declared structural repair gets at most one ledger-free full initial-group review. Neither review verdict is a stage gate.
- Surface external accepted-risk audit notices only at build-plan and verify-code human confirmation boundaries; do not add task schema fields or gate on the audit.
- Implement build-code full-review-until-pass/stalled behavior without closure.
- Produce the applicable `constitution-checklist.md` evidence for the changed contracts and record any not-applicable items with a concrete reason; do not treat checklist evidence as a new runtime gate.
- Persist/render v2 records and retain v1 readers. Each provider report keeps profile/model/effort/thinking, duration, usage or explicit unavailable fact, session/runtime references, findings, root cause and correction direction.

## Phase 5 — End-to-end verification and rollout

- Run behavior-level tests mapped to each acceptance rule: configuration and route resolution; all four fail-loud routing conditions; blind-direction rejection; complete-or-unavailable authority; quorum-unavailable diagnostics; code consumer/dependency/test selection; snapshot-bound test summary; change-map and hunk-anchor fail-loud cases; direct/inferred/invalid/duplicate/overflow finding coverage; ledger verified/unverified non-escalation; one ledger-free structural full follow-up; non-gating stage progression; build-code full-only review; no private broker-state reads; no WorkflowHub time/token/byte termination, truncation, or size-triggered split; constitution-checklist evidence; legacy fallback when the WorkflowHub route is absent.
- Enable only profiles with smoke evidence and keep `opencode/glm` disabled.

## Dependency order

`3rd-review public v2 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5`.
