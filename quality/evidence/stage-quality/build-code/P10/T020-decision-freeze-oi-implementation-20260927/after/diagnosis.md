# Read-only diagnosis of remaining targeted failures

The exact after-run output and file hashes are in `runs.json` and `command-1.*` to `command-3.*`. This note made no formal source, material, or Task-facts changes.

## Positive no-status CF fixture

The test at `tests/contract/decision-freeze-current-oi.test.mjs:112-123` builds a confirmed `OI-031`, `### D-021` with `- decision: 用户已显式批准 OI-031 的处置。`, and `### CF-5（已由用户裁决）` with `| **用户裁决（当前）** | 用户已**显式批准** OI-031 的处置。 |` plus `| 本修复的落地 | D-021 的决定已更新。 |`; it omits a status row on purpose.

A direct read-only call to `validateDecisionFreeze` with exactly those strings returned these errors: `current CF CF-5 has no verified current disposition`; `freeze approval is not accepted by all three sources`; `approval binding is missing decision_id`; `approval binding is missing material revision`; `approval binding is missing snapshot`; `final confirmation is missing material revision`; `final confirmation is missing snapshot`; `step 11 is missing material revision`; `step 11 is missing snapshot`. Coverage was all four categories and `ok=false`. Only the first error contradicts this test's expected no-status CF disposition; the remaining approval/identity errors are expected by the test.

Parser point: `runtime/stage/stage-content-contracts.mjs:626-640`. Its landing-row regex requires `D-021` then whitespace, `的`, another literal space, then `决定`/`decision`: `/\b(D-\d+)\s+的 (?:decision|决定)/`. The fixture text is `D-021 的决定已更新。` and has no space after `的`. A direct regex check returned `decisionIdMatch=null`; therefore it cannot find `### D-021` and emits the current-CF error. Suggested narrow fix: accept ordinary spacing around `的` while keeping the same D ID, exact confirmed OI, and one-sentence decision binding requirements; rerun the same two exact tests after any edit.

## Six failures in the adjacent suite

Four fail at `verifyReviewChain`/`safeReviewFacts` (`runtime/stage/stage-handlers.mjs:2168`, called at 3777) with `REVIEW_EVIDENCE_INVALID`: `publishes handler routing facts...`, `accepts a fixed direction change...`, `T014 keeps a handler completion incomplete...`, `keeps an otherwise valid active fallback incomplete...`. `safeReviewFacts` runs before `currentDecisionFreeze` in `build-spec` (which follows at line 3785). The current production patch versus the saved before files changes `stage-handlers.mjs` only around lines 168 and 185, and `stage-content-contracts.mjs` only the decision-freeze parser/validator. These four failures therefore occur before the changed freeze path and are not caused by its execution. The fixture supplies a review result/provider aggregation that the existing review verifier rejects. There is no pre-patch run of this adjacent command here, so its historical pass/fail baseline is not claimed.

One failure is independent file absence: `freeze-classification-budget-usage-protocol.test.mjs:299` reads `specs/workflowhub-cost-baseline-and-blocker-close-20260917/decision-log.md`, which does not exist in this worktree. One is independent skill-text drift: line 321 asserts the sentence `确认后唯一可写区是 tasks.md 的执行状态填写区` in `workflows/build-plan/SKILL.md`, but that current file contains no such sentence (and the freeze patch does not change it). The adjacent test file itself is unchanged from HEAD. Do not edit unrelated production code or revive obsolete material merely to force this unrelated suite green.

The handler-specific current-OI case passed after the patch (command 2). The freeze contract suite still has the one fixture/parser mismatch above. Neither result proves P10 or CARD04 completion.
