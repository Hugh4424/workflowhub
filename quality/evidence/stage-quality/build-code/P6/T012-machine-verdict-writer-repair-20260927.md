# P6/T012 stage-end analyzer verdict writer repair — 2026-09-27

## Scope

- Authenticated task worktree: `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`; branch `task/workflowhub/workflowhub-thin-core-card-04-20260919`; HEAD `ef920f1fbd415fe87d50930359059b661e141acd`.
- Current P6/T012 amendment and `spec.md` §8 assign only `runtime/stage/stage-runner.mjs` verdict publication and incremental `tests/contract/post-phase-official-handler.test.mjs` assertions. The frozen E2E remains unchanged, SHA-256 `71c357fad6ae2f40d3369971172f9b2380b7251b4f12c17928cab23c69da3c18`.
- Before this edit, the source SHA-256 was observed as `e02b613b5723c08ca1c4bb417aa804f32d5bf60e47fd3fb73d57f774f96128f9`, and the existing contract test SHA-256 was `dca1326fcd5c5de1d4e5894db796cba68c755fa2f25afaeb6f91ffd05f5be7c1`. These were read before mutation, but a contemporaneous worktree snapshot tree and material revision were **not** captured. Do not use this repair as the complete AC18 before/after sample.

## RED → repair → GREEN

- Existing frozen E2E RED: `T012-revised-red.txt` / `.meta.json`, command `npx vitest run tests/e2e/card-04-real-entry-chain-e2e.test.mjs`, 17 tests with 1 AC26 machine-verdict failure. This record predates the present edit.
- New incremental contract assertions were added before source change. `npx vitest run tests/contract/post-phase-official-handler.test.mjs` failed with **5 of 19 tests** on the intended writer values: old `deferred` instead of `incomplete`/`inconsistent`/`unavailable`, and old `passed` instead of `reported` in `evidence_state`. Exit `1`; raw `T012-machine-verdict-contract-red.stdout.txt` (SHA-256 `e65e22a9135204536e42ecadf3b3bff2b14c5f5aa05fa433ea8d8f13ae75c9df`) plus stderr and `.exit.txt` are retained.
- The source now passes only authenticated analyzer verdicts to `summary.actual_outcome` and `subject_fact.evidence_state`. `material_incomplete` maps to acceptance `incomplete`, `inconsistent` and `unavailable` preserve their exact acceptance results. The quality fact remains `missing`, and the stage-end advisory remains nonblocking. Successful `consistent` / post build-plan `reported` retain `pass`. Only this subject may use a bounded acceptance-result override; generic `acceptanceResultForSubjectStatus("missing")` remains `deferred`.
- First post-edit command ran the three specified files and failed **3 of 62 tests** solely because a newly added test overasserted that no unrelated advisory would appear. Raw `T012-machine-verdict-targeted-green.stdout.txt` and `.exit.txt` retain that failure. The test was narrowed to this subject's advisory entry; no production change followed.
- Final command: `npx vitest run tests/contract/post-phase-official-handler.test.mjs tests/deferred-acceptance-semantics.test.mjs tests/contract/acceptance-result-machine-classes.test.mjs`. Exit `0`, **3 files / 64 tests passed**. Raw `T012-machine-verdict-targeted-green2.stdout.txt` SHA-256 `91dde6f5b8e36ccb80d3e310dbbd1d197fbffab497ac17f3e5fc633d0a20784c`; stderr SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; `.exit.txt` is `0`.
- Final source SHA-256 `defe0343739b1df8182a0fba3d281eb98f11d545fb74742ccd87f04935b52e74`; final contract test SHA-256 `21921bba541d5cf9516304ec7235d893580d8e9754062ca6ec3e7bb8fd18ebf1`. `node --check` for both files and `git diff --check` passed.

## Limits

- Contract tests exercise real `runOfficialStage` publication and canonical readback, including absent portable lens, forged verdict, stale material revision, and the unchanged generic missing mapping. They do not prove the full real CLI journey or P5 report producer.
- This is local P6/T012 writer GREEN, pending independent review and current formal task facts. It is **not** an AC26, P6, or whole-card completion claim.
