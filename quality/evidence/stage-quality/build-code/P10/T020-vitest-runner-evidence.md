# T020 Vitest JSON runner alignment

Scope: only `workflows/build-code/targeted-runner.mjs` and this P10/T020 evidence. The catalog, selector, frozen tests, runtime, and canonical Task facts were not edited by this subtask.

## Change

- Existing Node TAP argv and one-test identity path remain available.
- A selected case with both `execution.machine_command` and `registered_test_ids` must declare the exact literal `npx vitest run <safe target> --reporter=json` command. The runner resolves the installed Vitest CLI from its own module and invokes `process.execPath` with `[vitestCli, "run", target, "--reporter=json"]` and `shell:false`; it never interpolates or executes the catalog string.
- The returned Vitest observations are one row per reporter assertion. File path, nonempty unique full IDs, declared registered IDs, statuses, test/suite totals, reporter success, and child exit must agree. Failed, skipped, pending, todo, empty, wrong target/ID/command, setup error, abort, and timeout cannot produce a completed result.
- Completed observations and execution are explicitly `direct_*` source with `canonical_receipt:false`; this importable seam does not authenticate a Task or write a canonical receipt.

## Verification

Environment and source/test/catalog SHA256, HEAD and HEAD tree, exact final commands, raw stdout/stderr paths and hashes, exits: `T020-vitest-runner-final.meta.json`.

- Initial direct RED: `T020-vitest-runner-RED-observed.txt`, exit 1; actual P8 Vitest file had been sent to Node TAP and yielded `reporter_identity_mismatch`.
- Final real catalog probe: `node quality/evidence/stage-quality/build-code/P10/T020-vitest-runner-probe.mjs`, exit 0. The three active P8 files produced 6+28+15=49 passed runnable IDs, exactly equal to the catalog list. Wrong command, wrong ID, wrong target, failed assertion, skip, zero tests, setup error, and pre-abort all returned unavailable with zero passed observations. Full per-case output: `T020-probe-final.stdout.txt`; stderr: `T020-probe-final.stderr.txt`.
- Frozen Node TAP gate: `npx --no-install vitest run tests/contract/build-code-targeted-runner.test.mjs`, exit 0, 9/9. Raw output: `T020-frozen-final.stdout.txt` and `T020-frozen-final.stderr.txt`.
- `node --check workflows/build-code/targeted-runner.mjs`, exit 0.
- Isolated real timeout: `T020-vitest-timeout-observed.txt`, runner rejected at 30015 ms with zero observations; fixture directory was removed. Direct Vitest JSON raw reporter sample and stderr are `T020-vitest-direct.json` / `T020-vitest-direct.stderr.txt`.

## Limit

P10/T021 `reconcileCases` currently assumes one Node TAP observation per case and cannot consume these 6/28/15 Vitest assertion rows. No fixed launcher, authenticated start snapshot, official capture/receipt, independent business oracle, or real UI/service journey was supplied here. AC-32 remains unproven by this targeted runner verification.
