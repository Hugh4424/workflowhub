# T026 hidden handler integration — bounded local evidence

Captured 2026-09-27T05:09:46Z in CARD04 worktree, branch `task/workflowhub/workflowhub-thin-core-card-04-20260919`, HEAD `ef920f1fbd415fe87d50930359059b661e141acd`. The reviewed candidate patch is `T026-ac17-hidden-handler-20260927.diff` (SHA-256 `f7373dce646d94cc8109fa85facfc14af4fd77d749d834d9665385b32853e2c9`). Before this edit, `runtime/stage/stage-handlers.mjs` was clean at SHA-256 `1a47f2e381d4ba7a005f4e5c1897709f801575f26e67c589f027dec15c6a11ef`. The live P11 test file already had other uncommitted work at SHA-256 `7abe3c10def352ce51ce7442b03673dab4defda5a653253b73ce3bebe93c544e` before the two new tests were added. The separate frozen AC17 test and source artifacts were not edited.

The production edit moves the existing implementation and test receipt checks before either browser dispatch. It additionally checks any supplied receipt against the current snapshot and moves existing implementation diff authentication before browser execution. With no supplied receipts, the current vNext path remains runnable and records its missing quality facts.

## Test-first and adjacent results

| Run | Raw files (`.stdout.txt`, `.stderr.txt`, `.exit.txt`) | Result |
| --- | --- | --- |
| New stale-snapshot and semantic-bad-receipt negatives against old source | `T026-hidden-handler-red.*` | exit 1; 2 target failures, 64 skipped. Browser callback was invoked 2 times for stale snapshot and 1 time for bad test receipt. |
| Same two tests after source edit | `T026-hidden-handler-green.*` | exit 0; 2 passed, 64 skipped. Neither invalid input invoked browser callback. |
| P11 v2/v3 actual source/projection tests | `T026-hidden-handler-adjacent-tier.*` | exit 1; 8 passed, 2 failed, 56 skipped. Both failures concern duplicate browser dispatch on valid receipts (one case got 2 calls; two cases got 3). This patch does not alter those existing call sites; they remain P11 same-source integration work, not T026 GREEN. |
| P11 presentation contract | `T026-hidden-handler-adjacent-projection.*` | exit 0; 5 passed. Stderr reported a Vitest WebSocket port warning; target tests passed. |
| Pre cohort vNext, no supplied implementation/test receipts | `T026-hidden-handler-pre-no-receipt.*` | exit 0; 2 passed, 64 skipped. Both the private browser behavior and public stage continuation remain available. Stderr reported a Vitest WebSocket port warning; target tests passed. |

The historical non-vNext Task model cannot be instantiated through the current `createTask` validator; its handler branch still requires both receipts before browser and was not claimed as a new runnable test here. No full suite, official CARD04 stage run, commit, or push occurred.

`node --check` passed for the edited production and test files; `git diff --check` passed on both. Final SHA-256: `runtime/stage/stage-handlers.mjs` `555cc654f69b618e623896e89a2fd5ecb76880468f9529958f1c4ed8ffef35a6`; `tests/contract/acceptance-execution-tier.test.mjs` `3972885b615b174e783188be108e531d8f87fe5386ded59fb905ad853b4bf63b`. Adjacent P11 source inputs at this capture: `runtime/stage/stage-runner.mjs` `627bb7d598579c46618064f31db6f1bdb43a9146fc81de8b3d5727af2e29c44f` and `runtime/evidence/freshness.mjs` `ed4398e124d07f11e6f690690cf31593c5041709f37309d6af8db2d4d0423086`.

Local result only. Independent review is required. Neither a real browser run nor P11 completion is established.
