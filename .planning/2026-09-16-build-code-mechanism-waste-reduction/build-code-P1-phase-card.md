# Build-code Phase P1 Card

- Goal: material-only changes preserve an already recorded review fact and do not redispatch; provenance fields remain readable.
- Allowed files: `runtime/evidence/freshness.mjs`, `runtime/review/review-record-route.mjs`, `tests/contract/review-material-change-redispatch.test.mjs`.
- Covered ACs: `AC-REV-001`; supporting `AC-REV-004`, `AC-REV-005` where the current review source remains readable.
- Non-goals: no budget deletion (P2), no verify-code current-snapshot policy rewrite beyond preserving its dedicated guard, no new public command/store/schema, no changes to the four materials.
- Compatibility: preserve authenticated route identity, subject/track/kind scoping, canonical immutable refs, and the special verify-code current snapshot requirement.
- Test route: `feature` / `backend-testing`; T001/T002 use the same targeted Vitest command and oracle. RED must fail only because material-only change currently invalidates/reblocks reuse or changes the recorded fact; setup failures are STOP.
- Stop conditions: fixture cannot hold code snapshot and task identity fixed while changing only review material bytes; any consumer outside the declared files is required; a code-snapshot mismatch is accidentally accepted for verify-code.
- Expected handoff: actual files, RED/GREEN command exits, route decision, AC results, review fact/disposition, and remaining limits recorded in T001/T002 execution areas.

## Execution result

- Route: feature; backend-testing; non_ui. Test routing was selected from the actual changed files (`runtime/review/review-record-route.mjs`, `runtime/evidence/freshness.mjs`, and the contract test), with no live service or browser surface.
- RED: T001 exited 1 at the intended material-only reuse assertion after fixture setup was corrected; evidence is `apply/evidence/T001.stdout`.
- GREEN: T002 exited 0, 2/2 tests passed. The public canonical receipt is `quality/tests/build-code-p1-review-material-change.json` with hash `cdc840a9f66b75f82adb6060e3bd4809ce15d9847f9528f934b3cbe139edf9c4`.
- Adjacent regression: 3 targeted contract files, 17 tests, exit 0; no full regression was run.
- Review: phase review attempt `e5fd7278-fe3f-5678-a472-ffbed58a8d12`; `kimi/coding` produced major finding `F-ae27d7ad04e9`, and `codex/luna` failed with `EVIDENCE_ANCHOR_INVALID`. The finding is `rejected_invalid` because current `spec.md` FR-REV-001/002/003 explicitly preserves ordinary build-code review readability across material and ordinary code-snapshot moves, while only terminal verify-code code review is current-snapshot-bound. Raw review facts remain preserved at the task-store attempt/result/report refs.
- Limit: this phase does not implement P2 budget deletion or the later external-provider, writer, close, and interaction changes.
