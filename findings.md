# Findings

## Established make-decision facts
- Scope: S1 + full S2 + per-AC material-only tolerance.
- Deferred: S3–S7 with owner/trigger/minimum artifact/acceptance.
- UI: non_ui.
- Core principles: read parallel/write serial; main session interaction/dispatch/integration/adjudication only; worker cap 3/hard 6; worker result ≤500 chars + ref + hash.
- Test runtime profile: inner ≤60s no network/DB/filesystem/child process; medium ≤300s localhost only; large CI only. Orthogonal to test tier.
- Review S1: pre-dispatch token/context/health rejection ≤5s and zero provider calls; broker start/status recovery; material-vs-non-material drift; error classification; seam packet handling; ADR 0025 amends only two conflicts.
- per-AC tolerance: tolerate material_revision only; never snapshot_tree, evidence hash, or AC result changes.

## Build-spec / build-plan facts
- Authenticated materials are under `specs/workflowhub-execution-acceleration-20260909/`; direct validators and focused material tests passed at those stages.
- Build-spec quality remains honestly incomplete because decision-freeze reader expects `host_evidence.source_ref|confirmation_ref`, while canonical approval proof stores `host_evidence.ref`.
- Build-plan quality remains honestly incomplete for the same freeze compatibility fact plus advisory projections.
- Authored plan/task gate text contains the stale path `tests/contract/official-component-receipts.test.mjs`; actual file is `tests/official-component-receipts.test.mjs`. Do not rewrite authored materials during build-code; execute the real path and record the discrepancy.

## P1 findings and repairs
- P1 RED initially exposed that `run-checks.mjs` ignored profiled argv/evidence options and ran aggregate checkers. The existing aggregate checker has five unrelated baseline path-classification failures; profiled mode now executes explicit argv without shell concatenation.
- Runtime profile contract now validates inner/medium/large limits, orthogonal tier, permissions, capability proof shape, requested/decision matching, proof refs/hashes for passed proofs, behavior fingerprint shape/equality, and large CI declaration. Unknown/unproven capability remains `unavailable`, never ready/pass.
- Canonical test receipts now carry optional runtime profile, capability proof, behavior fingerprint, duration, runtime_profile_status, and runtime_profile_authenticated. Reuse compares profile/proof/fingerprint. Stage handler facts透传 these fields; stage runner binds receipt↔facts and treats profile-unavailable receipts as unavailable for quality status. Old receipts without profiles remain compatible.
- `run-checks` evidence is create-only under `quality/tests`, includes target argv, duration, explicit `quality_status: unavailable`, `runtime_profile_status: unavailable`, `runtime_profile_authenticated: false`, capability proof status unavailable, and null behavior fingerprints rather than self-asserted equality. Target exit code is preserved independently.
- A wrapper exit 0 therefore means only the target command passed; it does not mean AC-TEST-001 passed. Capability enforcement is not available in this executor and must remain unavailable.

## P1 current evidence
- Focused contract suite: `tests/contract/test-runtime-profile.test.mjs`, `tests/stage-plan-task-contract-v3.test.mjs`, `tests/official-component-receipts.test.mjs`: 86/86 passed.
- Profiled GREEN gate executed with the real receipt path and exit 0. Evidence: `quality/tests/p1-profile.json`; target passed, quality_status unavailable, capability proof unavailable, behavior fingerprint unavailable. This is truthful incomplete quality, not AC-TEST-001 pass.
- Independent P1 re-review initially found three blocking risks: self-asserted fingerprints, hard-coded feature tier, and unavailable proof being confused with pass. Repairs: fingerprints are explicitly unavailable/null; wrapper no longer invents test tier; status/authentication are explicit and downstream pass consumers reject unavailable.
- Remaining P1 review concern to verify: full stage/freshness/close/review consumers beyond stage-runner may still map profile-unavailable exit 0 to pass. Stage handler/runner seam is repaired; broader consumers need targeted audit/tests before P1 closure.

## P3-P6 and verify-code facts
- P3 RED remains immutable at `quality/tests/p3-review.json`. The corrected six-file GREEN gate is `quality/tests/p3-review-green-4.json`: exit 0, 6 files/150 tests; profile status remains `target_passed_profile_unavailable`.
- Architecture review found one valid lifecycle error-classification bug at `skills/wh-review/scripts/review-provider-client.mjs:354`: plain-text managed stderr leaked `SyntaxError` when stdout was not JSON. The managed stderr parse now follows the typed public-run path; affected client/lifecycle tests pass 51/51 and the full P3 gate passes.
- The single verify-code heterologous review attempt `quality/reviews/attempts/2c276658-e4bb-5d98-a273-de38dbb169ea/attempt.json` is canonical `unavailable`; providers emitted RATE_LIMITED/CANCELLED/ATTACHMENT_DELIVERY_UNSUPPORTED terminal facts after the non-terminal route had no callback. No second review dispatch was made.
- The unavailable verify-code Stage Agent outcome is recorded at `quality/evidence/stage-outcomes/verify-code/7936f1c7b91ee85f9db389168df9f29fb33cb420995c5078a68847b9bb4c09ca.json`. Current verify-code predicates remain missing because the dsh code-review result and stage reflection executor are unavailable.
- P4/P5 behavior gates remain 22/22 with repaired archive/read-only-consumer bindings. P6 remains business `incomplete`: no user-selected real task or authenticated host usage/replay ref. Build-code and verify-code are not complete; no close/commit/push/merge/archive/cleanup.

## Build-code execution facts
- Current worktree: `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-execution-acceleration-20260909`; branch `task/workflowhub/workflowhub-execution-acceleration-20260909`.
- Main session is sole writer; read-heavy P1 audits were delegated. No commit/push/merge/close performed.

## P2 governance facts
- RED: governance contract initially failed 2/3 assertions because ADR 0025 did not exist and the approved ADR 0007 wording was not represented in the test; no governance production edit preceded RED.
- GREEN: created `docs/adr/0025-review-dispatch-preflight-boundaries.md`; modified only the approved packet-plan/preflight sentence in ADR 0007 and no-unified-budget sentence in `docs/standard-workflow.md`; preserved runtime-owned public status polling and non-gate semantics.
- P2 targeted contract: 3/3 passed. Profile evidence `quality/tests/p2-governance.json` is target_passed_profile_unavailable with quality_status unavailable because run-checks capability proof is declaration-only.
- Independent P2 review is pending; no P3 work has started.
