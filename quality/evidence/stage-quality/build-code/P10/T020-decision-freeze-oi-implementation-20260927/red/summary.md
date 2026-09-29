# Decision-freeze current OI RED evidence

- Run location, HEAD, UTC start/end, commands, all five material/test SHA-256 values, and output SHA-256 values: `runs.json`.
- Both commands were targeted. Neither timed out. No production source, task material, or Task facts was edited by this run.

## Command 1

`npx vitest run tests/contract/decision-freeze-current-oi.test.mjs` exited 1. Vitest collected 26 tests in one file: 19 failed, 7 passed. The failure was in test assertions after collection and execution, not import/setup or zero tests. Full output: `command-1.stdout.txt`, `command-1.stderr.txt`.

The first failing case reads the archived CARD05 decision log. Its expected four-category coverage differs from the current validator output, which omitted `data_states`. This CARD05 archive fixture mismatch must be kept separate from the synthetic current-OI and current-CF negative cases; it is not by itself proof of the new CARD04 defect.

The other failures are directly relevant RED assertions: historical OI text incorrectly fills a missing current category; malformed, duplicate, incomplete, and unsupported current OI records fail to produce the expected `current OI authority` error; missing/ambiguous current CF status fails to produce the expected `current CF` error; and the named D decision/same-OI binding assertion fails. The names and assertion diffs are preserved in the raw output. These are actual failing test assertions, not a green run inferred from exit code alone.

## Command 2

`npx vitest run tests/integration/vnext-official-stage-run.test.mjs -t 'keeps a current OI content failure'` exited 1. Vitest collected 107 tests, ran the one selected case, skipped 106, and failed that case. It created authenticated freeze sources around a malformed current OI YAML record and called the actual `build-plan` handler. The expected warning `decision freeze: current OI authority contains invalid YAML or JSON` was absent: `p3FreezeWarnings(result)` returned `[]` at test line 724. This is an actual handler content-contract RED after successful collection and execution; it is not import/setup, zero-test, or mere identity binding failure. Full output: `command-2.stdout.txt`, `command-2.stderr.txt`.

## Verdict

Target RED is established for the current-OI validator and for the real handler path. The first command also contains the separate CARD05 archive-fixture coverage mismatch; do not count that mismatch as newly introduced CARD04 behavior, and do not call the phase GREEN until all relevant cases are corrected and rerun.
