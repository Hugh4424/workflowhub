# P5 Test Strategy

## Applicable route

`backend-testing` for BR `node --test` behavior and candidate landing verification. T033/T034 remain without a safe digest seam; T035–T038 use existing WH route/reuse consumers and targeted Vitest evidence.

## Executed gates

- RED T039: `node --test test/provider-failure.test.mjs` — exit 1.
- GREEN T039/T040: `node --test test/provider-failure.test.mjs` — 3/3, exit 0.
- Supporting BR lifecycle: `node --test test/managed-session-lifecycle.test.mjs` — 19/19, exit 0.
- T041: `node --test test/attachments-protocol.test.mjs test/managed-session-lifecycle.test.mjs test/workflowhub-result-v3.test.mjs` — 79/79, exit 0; current BR live diff is 13 files (5 lib + 8 test), not the original 8-file baseline.
- T035/T036: focused reuse contract — 1/1, exit 0.
- T037/T038: focused preflight route-consumer contract — 1/1, exit 0.

## Limits

T033/T034 remain unverified/unimplemented. T042 final aggregate must not be described as all-AC green while those items remain pending.
