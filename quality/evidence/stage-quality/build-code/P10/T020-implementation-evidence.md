# CARD-04 P10/T020 scoped implementation evidence

- UTC observed: 2026-09-26T12:44:29Z
- CWD: `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`
- HEAD: `ef920f1fbd415fe87d50930359059b661e141acd`
- Scope: `workflows/build-code/case-selection.mjs` and `targeted-runner.mjs`; no runtime, CLI, P8/P9, frozen-test or T021 edits.
- Skill route from actual changed files: `test-routing-advisor` = `feature` (two build-code behavior seams, no frontend/API/schema change); `backend-testing` used for real child process and negative input boundary. This route is a local test choice, not a canonical task fact.

## RED and focused result

Command both times: `npx vitest run tests/contract/build-code-case-selection.test.mjs tests/contract/build-code-targeted-runner.test.mjs`.

| Run | Raw output | Exit | Result |
| --- | --- | ---: | --- |
| Before edit | `T020-red.raw.txt` | 1 | 16 collected, 16 assertion failures; no import/setup error |
| After first edit | `T020-after-implementation.raw.txt` | 1 | 16 collected, 15 passed, 1 failed |
| Final | `T020-final.raw.txt` | 1 | 16 collected, 15 passed, 1 failed |

The remaining `mismatched_snapshot` test mutates only a caller-owned `snapshot_tree` to a different valid Git tree. `selectAffectedCases` has no trusted task/Git/receipt reader to identify that tree as wrong. It intentionally does not infer validity from internal plausibility or reject every changed tree. This is `not_done/G2` for authenticated provenance, not a test pass.

Final frozen test SHA-256: selection `5493e3cbe1b8ca0561486f544aa19024e967a49bad68f71ed18b8c3a192805e5`; runner `27addc4a131f087155034626a8cb4a6e6fd4178a34295bcbbbfe0392ff4e0ec3`. Raw RED SHA-256 `0f5aeeab089b879a8dac906b02c9da6d8f7df3040aaa2e84c6a467766c2c0a55`; final raw SHA-256 `7cca0e3df70ec8edf285eb48ef902761c5ffa40d6cb54045ae34ea7ed1553cfb`.

## Direct boundary probe

Command: `node quality/evidence/stage-quality/build-code/P10/T020-direct-probe.mjs`; exit 0. `T020-direct-probe.raw.txt` records a simulated *P9-shaped* Node TAP inventory with exact registered full ID; deterministic selection and child execution worked. Duplicate inventory identity and mismatch against the inventory's independent snapshot fields rejected. A symlinked test target, missing runner executable, and shell interpolation target rejected without executing the target. This probe does not authenticate the supplied change scope or simulate a canonical P9 receipt.

Syntax command: `node --check workflows/build-code/case-selection.mjs && node --check workflows/build-code/targeted-runner.mjs && node --check quality/evidence/stage-quality/build-code/P10/T020-direct-probe.mjs`; exit 0.

## Product limit

`runTargetedCases` is an importable Node TAP execution seam, not a fixed launcher or official capture consumer. The real P8 catalog currently lists Vitest targets, whereas P9's collector records only literal Node TAP IDs. An actual P8/P9 combination without an exact, independently registered runnable identity rejects as `missing_inventory_identity`; no case is reported passed. Official `runCapture` still needs a trusted fixed-command consumer and canonical per-case cross-check. AC-32 remains unknown/not_done.
