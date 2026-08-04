# Stage atomic-step inventory (P0 contract)

Status: P0 contract inventory only. It freezes the P1–P3 input boundary; it does **not** claim that receipt runtime, aggregation, validation, or V4 review wiring is implemented.

Source of truth for IDs: `workflows/<stage>/steps.json`. `SKILL.md` sections below are legacy-reference mappings. Unknown legacy actions fail closed through `docs/migration-and-fallback.md`.

| Stage | Canonical ID | Manifest step | Legacy section mapping | Conditional behavior to preserve |
|---|---:|---|---|---|
| make-decision | 1 | load-context | S0 背景扎根 | missing task directory or cleaned worktree: fail-loud |
| make-decision | 2 | triage-scope | S0.5 scope-triage | lite/full; lite skips S1/S3 with receipt and journal reason |
| make-decision | 3 | talk-round-1 | S2 talk#1 | ask only when the answer changes direction or research authorization |
| make-decision | 4 | research-inputs | S1 internal + S3 external | unnecessary or unauthorized external research records a skip and continues |
| make-decision | 5 | talk-round-2 | S4 talk#2 | records a direction baseline; never creates a confirmation gate |
| make-decision | 6 | blind-direction-review | S5 direction review | wh-review is the only provider owner; candidate decisions are forbidden material |
| make-decision | 7 | talk-round-3 | S7 talk#3 | consumes blind findings; asks only about a direction-changing unresolved item |
| make-decision | 8 | grill-with-docs | S7 full grill | complete interactive skill in CandidateWorkspace; no lite or read-only substitute |
| make-decision | 9 | write-decision-draft | S7 decision-log draft | records the resolved direction, constraints, risks, and unresolved facts |
| make-decision | 10 | review-decision-detail | S7 detail review | wh-review reviews the draft; quality disagreement remains visible |
| make-decision | 11 | approve-decision | S9 human hard gate | the only make-decision confirmation; bypass is an error |
| make-decision | 12 | publish-decision | S10 | attempt binds post-grill CandidateWorkspace snapshot; accept recaptures it |
| build-spec | 1 | read-decision-log | §0 pre-read | absent/empty input stops; missing/cleaned worktree escalates |
| build-spec | 2 | create-spec-draft | §1.5 ladder + §2 spec-specify | missing spec-specify output stops |
| build-spec | 3 | clarify-spec | §3 clarify + §3.5/3.6 self-check | missing spec stops; high-risk word/self-check findings warn |
| build-spec | 4 | check-constitution | §4 constitution + §5 baseline + §6 F10 | missing required output fails; constitution/baseline/F10 findings warn |
| build-spec | 5 | review-spec | independent review | actionable findings return to affected step; unavailable/unresolved review is recorded and does not add a human gate |
| build-spec | 6 | publish-spec-result | current material result | publish the current spec and quality facts; any checkpoint is audit-only and never blocks ordinary revision or handoff |
| build-plan | 1 | read-current-spec | Step 1 upstream read | missing/cleaned worktree escalates |
| build-plan | 2 | research-plan | in-memory spec-research | no standalone artifact; failure remains visible |
| build-plan | 3 | define-contracts | in-memory contract extraction | relevant contracts fold into plan.md |
| build-plan | 4 | write-plan | Steps 2–3 spec-plan/spec-tasks + Step 7 F10 | missing required section fails; F10 change retries Steps 2–4 |
| build-plan | 5 | validate-plan-task-contract | plan/tasks machine contract | invalid structure fails before review |
| build-plan | 6 | review-plan | Steps 4–6 and Step 8 V4 review | analysis/constitution/baseline findings non-blocking; incomplete packet remains material-incomplete |
| build-plan | 7 | approve-plan | human confirmation | records the user's plan decision; quality facts remain visible without becoming a quality gate |
| build-plan | 8 | publish-plan-result | current material result | publish the current plan and quality facts; explicit confirmation remains a user fact, not a checkpoint work permit |
| build-code | 1 | read-current-task-documents | §0 path + §1 pre-read | four current task documents must be readable |
| build-code | 2 | write-red-tests | TDD RED | record RED evidence or its absence as a quality fact |
| build-code | 3 | implement-change | §2 implement | minimal implementation; missing P-risk is P2 warning |
| build-code | 4 | run-tests | target tests | record exit/output/freshness; test failure is a visible fact |
| build-code | 5 | scan-diff | diff scan | record scope violations; requested scope expansion escalates, accidental drift is repaired |
| build-code | 6 | review-change | independent review | actionable findings return to implementation; unavailable/unresolved review remains visible |
| build-code | 7 | analyze-review-findings | finding disposition | inspect every finding; repair the current Task or record an explicit unresolved risk |
| build-code | 8 | capture-implementation | immutable snapshot | capture evidence without moving a Git ref or requiring phase confirmation |
| build-code | 9 | authenticate-current-task-completion | task completion audit | authenticate current materials without turning audit gaps into a Gate |
| build-code | 10 | publish-code-result | current implementation result | publish implementation, test, AC, and review facts; unavailable or failed review stays visible and never creates a reopen or recovery permit |
| verify-code | 1 | read-current-task-documents | §2 pre-read | read the four current task materials before verification |
| verify-code | 2 | verify-receipts | §5 freshness + §7 trace | stale SHA is info; receipt/trace issue follows D7; intentional no-browser-test is the only L3 skip trace |
| verify-code | 3 | run-verification-tests | §4 fresh tests + §6 strategy + §8 browser | run fresh; required L3 missing/mismatch is D7 red; no UI skips with record |
| verify-code | 4 | assemble-facts | AC coverage + human brief | record every AC result; quality anomalies remain visible for the verify conclusion |
| verify-code | 5 | authenticate-current-task-completion | current task completion audit | authenticate current code, tests, and AC completion without turning audit gaps into a Gate |
| verify-code | 6 | run-verify-quality-review | non-gate quality review | record configured external review after fresh verification evidence; it cannot replace build-code review lineage or authorize close |
| verify-code | 7 | analyze-review-findings | finding disposition | inspect every finding; repair routes to the same current Task and unresolved risk stays visible |
| verify-code | 8 | publish-verification-attempt | verification facts | publish all facts, including failures and unknowns, for the verification-stage decision without replacing build-code review lineage |
| verify-code | 9 | approve-verification | human confirmation | records the user's verification conclusion; failed or unknown ACs remain visible facts and do not create a recovery or reopen permit |
| verify-code | 10 | publish-verification-result | current verification result | publish the current verification facts; close is separately authorized and uses current materials and facts, not a plan-hash gate |

## P0 boundary

P1 may wire these IDs into workflow instructions and receipts. P2 may implement summary carrying and validation. P3 may reconcile requirement lineage and verify the evidence matrix. The finding-disposition step is a quality fact and handoff record, not a quality gate or permission object. Any runtime claim requires its own implementation evidence and tests.
