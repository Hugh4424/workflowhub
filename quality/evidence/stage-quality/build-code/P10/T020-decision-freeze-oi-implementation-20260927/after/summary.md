# Decision-freeze current OI after targeted checks

Exact cwd, HEAD, P10 phase/spec/decision material SHA-256, four test SHA-256, two production-file SHA-256, each command, UTC start/end, exit code, and raw-output SHA-256 are in `runs.json`. Raw stdout/stderr is preserved in `command-1.*`, `command-2.*`, and `command-3.*`. These are targeted checks only; no whole P10 or CARD04 result is inferred.

1. `npx vitest run tests/contract/decision-freeze-current-oi.test.mjs`: exit 1. One file collected and ran 26 tests: 25 passed, 1 failed. Remaining failure identity: `accepts a no-status CF with the same current D decision and confirmed OI` at test line 119. Its expected `fact.errors.some(error => error.startsWith("current CF "))` was false, but actual was true. This is an assertion failure after normal collection/execution. The RED command on the pre-patch source had 19 failures; this after run does not establish GREEN.
2. `npx vitest run tests/integration/vnext-official-stage-run.test.mjs -t 'keeps a current OI content failure'`: exit 0. One selected handler test passed; 106 other tests in the same file were skipped by the filter. This proves only the selected malformed-current-OI handler scenario now passes.
3. `npx vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs tests/contract/post-phase-contract.test.mjs`: exit 1. Two files collected and ran 48 tests: 42 passed, 6 failed. `post-phase-contract.test.mjs` was 16/16. `freeze-classification-budget-usage-protocol.test.mjs` was 26/32, with these failures:
   - `publishes handler routing facts and blocks an invalid gap identity`: `REVIEW_EVIDENCE_INVALID`, semantic review result differs from completed provider evidence/aggregation.
   - `accepts a fixed direction change only for the current material revision`: same review authentication error.
   - `AC-REBIND-001 freezes make-decision materials after step 10 and removes the four agent-created sections`: missing `specs/workflowhub-cost-baseline-and-blocker-close-20260917/decision-log.md` in this worktree.
   - `AC-REBIND-003 makes tasks.md execution status the only post-confirmation writable area`: build-plan skill text does not match the asserted sentence.
   - `T014 keeps a handler completion incomplete when the supplied fallback route is wrong`: same review authentication error.
   - `keeps an otherwise valid active fallback incomplete until its continuation is consumed`: same review authentication error.

The third command has no matching pre-patch run in this evidence set, so these six failures have not been attributed as newly introduced or pre-existing. The first command still has one failure. Do not call the implementation, P10, or CARD04 GREEN. No production source, task material, or Task facts was edited during these checks.
