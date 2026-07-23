# wh-review v2 — specification

## Status

User-approved design baseline, split from the reviewed `wh-review v2` design on 2026-07-22. The user explicitly authorized direct build-code work; this document is a tracked implementation baseline, not a synthetic build-spec receipt.

## Goal

Improve delivery quality with heterogeneous, stage-specific review through compact authority-complete packets, evidence-first finding adjudication, one high-strength structural follow-up at most, and full phase review for build-code.

## Configuration and routing

`~/.config/workflowhub/config.json` owns `wh_review.v2` policy: profile IDs, stage routes, priorities, minimum heterogeneous coverage, and full/rework rules. 3rd-review remains the trusted execution/profile registry. A declared but unresolved/disabled profile, unavailable adapter, invalid model fact, or zero eligible reviewer fails loud. An absent WorkflowHub route falls back to legacy 3rd-review behavior.

- decision direction/detail and build-spec initial: `pi/deepseek`, `claude-code/opus`, `kimi/k3`, `antigravity/flash`, `codex/terra`.
- build-plan and verify-code initial: `claude-code/opus`, `kimi/k3`, `codex/terra`. `opencode/glm` stays out until its real validation passes.
- build-code: exactly `kimi/coding`, `codex/terra`; send the complete pair to 3rd-review, let it attest host-adapter exclusion as `SAME_SOURCE`, require one eligible unique adapter, and record the valid one-reviewer case as `single_external`.
- Same-source exclusion compares adapter, never display name. No silent fallback.

## Packet and stage contracts

Packets carry their stage/track contract, reviewer lenses, a manifest, and a packet plan with inclusion/exclusion reason, authority level, map relation and bytes. Bytes are tracked only. No packet has a fixed byte budget, truncation path, or size-triggered phase split.

- Direction is blind: raw requirement, objective facts, hard constraints, non-goals only; proposal/spec/plan/diff/prior findings are forbidden.
- Detail uses approved direction, draft AC/spec, required context and `simplicity-guard` P0–P3.
- Spec/plan/verify use context/evidence maps with explicit `complete|unknown` state.
- Code covers the whole phase diff, map-selected direct impact surface, reuse/AC maps, snapshot-bound test summary, and directly affected consumers/dependencies/tests. The complete diff is the sole authority for changed code. Context defaults to unmodified direct dependencies; a changed-file exception needs `outside_diff_reason` and may contain only candidate lines outside every unified-diff hunk, or the packet fails loud. Raw test logs are excluded.
- `change-map.json` deterministically binds phase/base/candidate trees, changed files and hunks. Phase/impact maps cover every change; reuse/AC entries name related change IDs and either selected anchors or a concrete no-context reason.

## Build-code contract

Every build-code round reviews the whole current phase subject and direct impact surface for approved AC/non-goals/API/schema/consumer consistency; `simplicity-guard` P0–P3; DRY/KISS/YAGNI/SoC; cognitive load and contextual readability; state ownership/data flow; validation/errors/cancellation/timeouts/retries/idempotency/atomicity/partial-success/concurrency where touched; and current-snapshot success/failure/boundary/consumer/integration evidence.

DRY/KISS/YAGNI/SoC/complexity claims require a concrete consequence. Style preferences and speculative future work are non-gating notes.

## Findings and rounds

WorkflowHub validates evidence and contract anchors, assigns stable host-owned IDs, clusters duplicate findings, and adjudicates them deterministically. Direct evidence can establish blocking/major findings; inferred major findings require two adapters or an objective machine fact. Provider brand, confidence, token count and history never alter a current verdict.

Decision is one round. `full_on_structural_rework` makes build-spec, build-plan and explicit verify diagnostics use the high-strength initial route for the first review and, only when a complete bound ledger explicitly declares structural rework, one additional full review. Both finding sets are quality facts, never stage pass gates and never a review loop. Normal repairs make no second call. An optional response ledger is only external `wh-review-resolution.v1` audit data; it is `verified` when bound or `unverified` when absent/invalid, and never fabricates `fixed` or `pass`; absent/invalid evidence never auto-escalates. Rejected-invalid and accepted-risk entries do not auto-escalate or block. `accepted_risk` is displayed at build-plan/verify human confirmation. A full packet never contains a response ledger. Build-code never takes this path: its existing `full review → rework → fresh full review` behavior remains unchanged.

## Results and acceptance

WorkflowHub stores policy/profile/packet snapshots, source exclusions, coverage, mode and clusters in official review records. Optional response ledgers and their evidence state are external wh-review audit records only. Each provider report includes profile/model/effort/thinking, duration, usage (or unavailability), session/runtime references, findings, root cause and correction direction.

Acceptance includes: configuration and route tests; blind-direction rejection; complete-or-unavailable authority; consumer/test selection for impacted APIs; direct/inferred/invalid/duplicate/overflow coverage; external audit `verified|unverified` handling; one structural full follow-up with ledger-free material; non-gating stage-runtime progression; build-code full-only behavior; no private broker-state reads; and applicable constitution-checklist evidence.
