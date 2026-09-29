# P10/T021 current-case fixture isolation (2026-09-28)

Scope: only `tests/contract/build-code-case-reconciliation.test.mjs` fixture isolation. No production code, Phase material, Task facts, or assertion meaning changed.

## Reproduction

The three pre-existing `ORACLE-P10-CURRENT-CASE` assertions were run individually and after `ORACLE-P10-OFFICIAL-FIXED`, both with the frozen pre-reader (`before-case-reconciliation.mjs` from the preceding handoff) and current reader. All six individual runs passed (exit 0). All six ordered-pair runs had the official test pass, then the selected old assertion fail (exit 1), with expected `missing_current_business_effect` and actual `current_effect_receipt_mismatch`. Raw outputs and exact exits/SHA-256 are `old-*`, `current-*`, and `results.json`; `pre-edit-sha256.txt` records reader and test identities. The baseline reader ran in a separate temporary copy with its own Git repository and the same test file. Initial setup failures from an incomplete temporary copy are preserved as `setup-error-*` and are not treated as product evidence.

Cause: `ORACLE-P10-OFFICIAL-FIXED` published an acceptance fact into the shared `state.task`. The later no-locator assertions read that same Task and encountered this unrelated earlier fact. The same order-dependent failure exists in the frozen reader, so it is a test fixture leak, not a regression introduced by the current reader.

## Change and verification

The official test now creates its own `taskCaseFixture`, captures the same fixed test there, runs the same official stage, and checks the same test and AC assertions. It restores process environment and removes its temporary fixture in `finally`. The three previously failing assertions retain their original source and expectations. `test-only.diff` and `post-edit-sha256.txt` identify the change; the reader SHA-256 is unchanged.

The first `ORACLE-P10-CURRENT-CASE` group run after isolation had 13 passed and 1 failed: the new official fixture lacked the existing `node_modules` Git exclude. `isolated-current-case.*` records this failure. After applying that fixture-only exclude, a single ordered run of the official test and all three previously failing tests passed, 4/4, exit 0; see `isolated-four-targets.*`.

The complete targeted file was then run once with `npx vitest run tests/contract/build-code-case-reconciliation.test.mjs`: exit 0, 57 passed, 0 failed, 1 file passed, duration 525.02 seconds. The exact command, environment, raw stdout/stderr, exit, output hashes, and source/test hashes before and after are saved as `full-file-*`. The source/test hash lists before and after match exactly. The temporary `node_modules` link was removed and the original directory restored by the shell trap.

This says nothing about P10 production receipt writer/reader integration or real business effects. Independent review remains required.
