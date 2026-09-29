# P6/T013 targeted repair, 2026-09-27

## Scope and identity

- Worktree: `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`; branch `task/workflowhub/workflowhub-thin-core-card-04-20260919`; HEAD `ef920f1fbd415fe87d50930359059b661e141acd`; HEAD tree `2a0e21e65488fba4e4507e4491f9edcab8e4585b`.
- Current authorized scope: `specs/workflowhub-thin-core-card-04-20260919/phases/P6.md`, 2026-09-27 T013 amendment. Production change is limited to the post build-code source-census error projection in `runtime/stage/stage-content-contracts.mjs`; test change is limited to the CARD-05 archived fixture root in `tests/contract/post-spec-analyze-original-source.test.mjs`.
- Prior targeted RED is preserved at `T013-current.txt`, SHA-256 `84aa1d95bdfb0eb9d9ef105279142a2dd2de0d5816bb678e0ea279719ec97a06`: 5 failed, 19 passed, exit 1. Original production file SHA-256 `6e37babab8152b78dd7ffb0f87580120b4542b6ae298bc02f33895ef8e470f49`; original adjacent test SHA-256 `dff27f9043cf339d5fb724f799d86a00f2acdc725259410887f6e5f7fb1f334b`. Frozen T013 consumer test was not edited, SHA-256 `add4d7d8d371cbcda53b6a0a1a767b0d874ea283636463db51b8b23207ec1f38`.

## Change and check

- When a census has `status="present"` and an array of entries, each existing `census.errors` item now produces its original error and finding even when the entries array is empty. Empty or invalid census still emits the pre-existing generic incomplete error. The nonempty source, coverage, and semantic checks remain in their existing branch. No stage-end advisory or public entry behavior was changed.
- The adjacent test now reads `specs/archive/workflowhub-thin-core-card-05-20260919/`. Git tracks the decision log, spec, index, and P1 source there; the same six test assertions remain in place. No source fixture bytes were changed.
- Exact original three-file command: `npx vitest run tests/contract/spec-analyze-truthfulness.test.mjs tests/contract/post-phase-official-handler.test.mjs tests/contract/post-spec-analyze-original-source.test.mjs`. Current raw output: `T013-green-targeted-20260927.txt`, SHA-256 `d44d6f137f3ac3cf383d1acf60b2de33ee260dd2e7a1e7023c1b6d51f69be5f0`. Result: 3 files passed; 24 tests passed; exit 0. The frozen consumer test checks distinct named missing-section errors, a real compliant archived decision log without false census complaints, and return shape. The adjacent test checks report-only behavior, physical index mismatch, caller-forged census claims, and empty-census failure.
- `node --check` passed for both changed files; `git diff --check` passed. Current production SHA-256 `365dbf165c4a04c6b72e28d4605839c6f0d552c0b9077d8a6e55d77ce81f7682`; adjacent test SHA-256 `13665f92e313a2fa0b7d30813d1def8df38ae64744a3207f5f9cd7c4701756be`.

## Limit

This is targeted T013 local GREEN, not a P6 or AC-26 completion verdict. The full P6 gate, real CLI journey, current formal stage facts, and independent review are separate. The frozen test's historical ownership comments still describe the old CARD-05 handoff; the current P6 amendment supersedes that ownership for these two precise edits without rewriting the frozen test.
