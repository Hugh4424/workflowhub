# Findings

## Authoritative inputs

- Handoff source: `quality/evidence/handoff/build-plan.md`。
- Materials: `specs/workflowhub-deferred-closeout-20260919/{decision-log.md,spec.md,plan.md,tasks.md}`。
- Material SHA-256：decision-log `8bf127ea...`; spec `f162961b...`; plan `9c6e1c94...`; tasks 当前值以本次 material revision readback 为准。
- Plan declares P1–P5, T001–T042. T001–T014 execution sections now record completed facts; remaining task sections remain pending.

## Constraints discovered

- `tasks.md` requires one-time `npm ci` in WH worktree before WH gate commands; BR tests run in `/Users/Hugh/Hugh/Project/3rd-review`.
- Cross-repo writes have an explicit T027 confirmation boundary; do not silently bypass it.
- Phase review uses public `review --action=record`; quality facts are evidence, not progression permits.
- Main worktree is dirty with unrelated user changes; preserve it.
- BR `/Users/Hugh/Hugh/Project/3rd-review` was already dirty before P2: 8 pre-existing files, including most prior fixes. No destructive rollback was used.
- P1 material identity is now aligned to BR semantic files: `manifest.json`, `canonical-evidence.json`, `authenticated-evidence.json`, and `review-instructions.md` are excluded; frozen vector `f9094a44095b62c99e78638473289a19b1ff96083cd10b2dd3cecd52cb60ba3a` passes.
- P1 phase review was recorded but unavailable before provider dispatch: `PROTOCOL_INCOMPATIBLE`, managed health provider `kimi/coding` invalid. No findings were emitted; do not rerun unchanged review.
- P2 T003/T004 were already green in the pre-existing BR worktree; no safe RED was manufactured by reverting user changes. Existing mixed-member v3 test and final direct test are the evidence.
- P2 BR changes: remove `secret|data` body tokens; scan structured fields while skipping `output`; preserve provider error code/message with `cause_code`; remove review_mode recovery gate; filter unknown request allowlist extras while rejecting all-unknown candidates as `PROTOCOL_INCOMPATIBLE`.
- P2 targeted direct tests passed after changes: v3 contract/hardening/output-sanitization 27/27; recovery-policy 5/5; broker 36/36; attachments protocol 47/47.
- P2 health-set strictness is located in WH `skills/wh-review/scripts/review-provider-client.mjs:621-627`, not a BR broker health seam. It remains P3 T023/T024 scope; no fabricated BR health line was recorded.
- P3 phase review is recorded but unavailable: attempt `c28e6681-66a6-5ff4-aae2-9b5082b06368`, provider health rejected `kimi/coding`, zero provider attempts/findings.
- P4 phase review is recorded but unavailable: attempt `52191430-c879-56e5-a6c2-3b5e04d3ab7d`, same provider health rejection, zero provider attempts/findings.
- P5 T033/T034 search found digest-related semantic hashes and review projections but no authoritative behavior/governance digest producer, consumer, or history-compatibility definition; material says STOP rather than invent one.
- P5 T035/T036 are now evidenced by the existing `review-record-route.mjs` canonical reuse/request-lock path: blocked quorum results do not re-enter `runRound` for the same fingerprint; no new state machine was added.
- P5 T037/T038 are now evidenced by the existing `runSimpleReview` → `recordSimpleReviewRequest` path: preflight quorum shortfall is recorded as blocked-before-dispatch with zero provider attempts and zero broker calls; no new telemetry/control plane was added.
- P5 T039/T040 changed only BR timeout outward semantics: `PROCESS_TIMEOUT` plus `cause_code=PROVIDER_PRINT_TIMEOUT`; targeted tests pass.
- P5 T041 candidate protocol suite passed 79/79. The current BR live diff is 13 dirty files (5 lib + 8 test), already-dirty and task-added changes remain uncommitted and unmerged.
- T033/T034 now implement the approved minimal digest split: raw-byte governance digest remains the existing `material_digest`; normalized behavior digest is internal and consumed by `integration-review-subject.material_revision.sha256`; no new wire field or history migration.
- T042 initial aggregate failed only on stale wh-review bundle closure metadata; after recomputing the simple-review-runner asset SHA and resolver bundle hash, the narrow portability repair and full aggregate both passed. Preserve the initial failure as provenance.

## Open findings

- `quality_status` remains incomplete because P1 review is unavailable; each phase review must preserve unavailable rather than claim pass.
- P2 phase review is recorded: attempt `db6dca06-b7b1-5083-ac02-9904a8cb6d07`, report `quality/reviews/reports/build-code-simple-db6dca06-b7b1-5083-ac02-9904a8cb6d07.md`, `terminal_status=unavailable`, zero provider attempts, zero findings. Do not retry unchanged provider configuration.
- P3 RED/GREEN facts: dead constant, anchor drop fact, near-miss material fact, health-set relaxation, bounds guard removal, skip ledger, and unknown severity fact all have targeted tests. T021/T022 were already symmetric in current source and were recorded without rollback.
- P3 first portability run failed on stale skill closure hashes after legitimate P3 skill changes; updated `skills/wh-review/skill-bundle.json` asset hashes and `skills/catalog.yaml` resolver hash, then reran the same gate successfully.
- P5 phase review request after T035/T037 reused the same canonical attempt `35741e8e-b9bc-5d41-a35a-5e23355d5434` (`reused=true`); the route identity deliberately excludes material-only changes, and no new provider evidence was claimed.
- T033/T034 remain the material-boundary blocker; T042 is intentionally not executed because its oracle requires all 26 AC to be true. verify-code, main-branch reconciliation, and close remain not started.
