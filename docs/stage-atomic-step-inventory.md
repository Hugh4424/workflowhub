# Stage atomic-step inventory (P0 contract)

Status: P0 contract inventory only. It freezes the P1–P3 input boundary; it does **not** claim that receipt runtime, aggregation, validation, or V4 review wiring is implemented.

Source of truth for IDs: `workflows/<stage>/steps.json`. `SKILL.md` sections below are legacy-reference mappings. Unknown legacy actions fail closed through `docs/migration-and-fallback.md`.

| Stage | Canonical ID | Manifest step | Legacy section mapping | Conditional behavior to preserve |
|---|---:|---|---|---|
| make-decision | 1 | load-context | S0 背景扎根 | missing task directory or cleaned worktree: fail-loud |
| make-decision | 2 | triage-scope | S0.5 scope-triage | lite/full; lite skips S1/S3 with receipt and journal reason |
| make-decision | 3 | research-inputs | S1 internal + S3 external | S1 all-failed is non-blocking; S3 lite/user-no-search skips; unverified sources or two empty routes block for human |
| make-decision | 4 | clarify-direction | S2 + S4 + S7 talk/grill/draft | wait for user; grill failure records and continues; S7 orchestrator has no skip |
| make-decision | 5 | review-decision | S5 blind review/debate + S6 + S7 review/debate | provider/material diagnostics are not semantic; incomplete labels retry; debate env/path/no-finding may skip |
| make-decision | 6 | approve-decision | S9 human hard gate | wait for explicit approval; change/pause re-enters S9; bypass is error |
| make-decision | 7 | write-decision-log | S10 | missing blocking record or failed persistence/placeholder check fails loud; close writes result and exit receipt |
| build-spec | 1 | read-decision-log | §0 pre-read | absent/empty input stops; missing/cleaned worktree escalates |
| build-spec | 2 | create-spec-draft | §1.5 ladder + §2 spec-specify | missing spec-specify output stops |
| build-spec | 3 | clarify-spec | §3 clarify + §3.5/3.6 self-check | missing spec stops; high-risk word/self-check findings warn |
| build-spec | 4 | check-constitution | §4 constitution + §5 baseline + §6 F10 | missing required output fails; constitution/baseline/F10 findings warn |
| build-spec | 5 | review-spec | §3.7 V4 + §3.8 quality contract | revise_required returns to affected step; incomplete material/transport needs human and emits no result |
| build-spec | 6 | publish-spec-result | §7 auto-advance + §7.5 commit | only semantic pass advances; commit change or record no-change reason; close result/exit receipt |
| build-plan | 1 | read-spec | Step 1 upstream read | missing/cleaned worktree escalates |
| build-plan | 2 | research-plan | Step 0 spec-research | declared skip requires reason; failure escalates but is non-blocking |
| build-plan | 3 | define-contracts | Step 1.5 data-contracts | extraction failure/ambiguity escalates but is non-blocking |
| build-plan | 4 | write-plan | Steps 2–3 spec-plan/spec-tasks + Step 7 F10 | missing required section fails; F10 change retries Steps 2–4 |
| build-plan | 5 | review-plan | Steps 4–6 and Step 8 V4 review | analysis/constitution/baseline findings non-blocking; incomplete packet remains material-incomplete |
| build-plan | 6 | approve-plan | Step 9 human checkpoint | hard gate; wait for human; change/pause re-displays; no stage result |
| build-plan | 7 | publish-plan-result | Step 10/10.5 + result | only approved/rejected persists; commit change or no-change reason; close verifies receipt |
| build-code | 1 | read-plan | §0 path + §1 pre-read | missing worktree root fails fast; common/active validation escalates |
| build-code | 2 | write-red-tests | §2 TDD RED | no RED/GREEN evidence: do not enter next phase |
| build-code | 3 | implement-change | §2 implement | minimal implementation; missing P-risk is P2 warning |
| build-code | 4 | run-green-tests | §2 GREEN + §3 false-green | false-green warns and records; missing GREEN blocks next phase |
| build-code | 5 | scan-diff | §4 diff scan | out-of-scope change stops for explicit human confirmation |
| build-code | 6 | review-change | §7/13 V4 review + §14 revision | transport/packet/cancel are facts; revise_required returns to implementation; escalation needs human |
| build-code | 7 | commit-implementation | §15 phase commit + phase-gate | change commits; no change needs reason; phase-gate failure stops and returns phase |
| build-code | 8 | publish-code-result | §9 + §16 + receipt verify | requires all green, V4 pass, and phase-gate; close writes result/exit receipt |
| verify-code | 1 | read-build-result | §2 pre-read | D7 worktree validation failure fails loud; skip quality/3rd-review/irreversible work and emit escalation result |
| verify-code | 2 | verify-receipts | §5 freshness + §7 trace | stale SHA is info; receipt/trace issue follows D7; intentional no-browser-test is the only L3 skip trace |
| verify-code | 3 | run-verification-tests | §4 fresh tests + §6 strategy + §8 browser | run fresh; required L3 missing/mismatch is D7 red; no UI skips with record |
| verify-code | 4 | assemble-facts | §8.5 AC coverage + §9 brief | record every AC in final-test-report; quality anomaly warns and may need human |
| verify-code | 5 | review-verification | §10 V4/3rd-review | revise_required/escalate produces no merge; N=2 unresolved escalates |
| verify-code | 6 | publish-verification-result | Close + §11 merge gate + §12 | only review pass plus human confirmation may run irreversible steps; any failure stops without auto-retry; every path writes stage result |

## P0 boundary

P1 may wire these IDs into workflow instructions and receipts. P2 may implement summary carrying and validation. P3 may reconcile requirement lineage and verify the evidence matrix. Any runtime claim requires its own implementation evidence and tests.
