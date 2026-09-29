# P10/T020 same-call reconciliation, local evidence

Captured 2026-09-27T03:02:36Z in CARD04 authenticated worktree. Scope: fixed targeted branch of `workflows/build-code/capture.mjs` and `tests/contract/build-code-targeted-capture.test.mjs`. `case-reconciliation.mjs` is called read-only and was not edited by this task.

The canonical writer returns a fresh, non-reused outer receipt with a new run ID. The fixed branch checks the receipt, child pointer, per-target original reporters, Task, source tree, material, catalog and registry before calling the independent case reader in the same invocation. A complete reader result is projected as `execution_freshness=observed_now` for this return value only. The separate reader still reports `current_execution_unverified` and `unknown` freshness for the saved receipt. Missing business effects remain `unavailable`. Invalid case-to-acceptance mappings remain an explicit unavailable readback and are never upgraded to `observed_now`.

## Raw test evidence

- New positive assertion before source edit: `T020-same-call-reconciliation-red.{stdout,stderr,exit}.txt`; exit 1, one assertion failed because `case_reconciliation` was absent, nine skipped.
- Initial positive after source edit: `T020-same-call-reconciliation-green.{stdout,stderr,exit}.txt`; exit 0, one passed, nine skipped.
- Full fixed launcher file before the adjacent correction: `T020-same-call-reconciliation-full-green.{stdout,stderr,exit}.txt`; exit 0, ten passed.
- Adjacent reader tests exposed a narrower regression: `T020-same-call-reconciliation-adjacent.{stdout,stderr,exit}.txt`; exit 1, nine passed, three failed, thirteen skipped. Three invalid mappings caused the fixed branch to throw rather than return an unavailable readback.
- After correcting that branch, positive execution: `T020-same-call-reconciliation-final-positive.{stdout,stderr,exit}.txt`; exit 0, one passed, nine skipped. Three failing adjacent negative cases: `T020-same-call-reconciliation-final-negative.{stdout,stderr,exit}.txt`; exit 0, three passed, twenty-two skipped. The earlier nine adjacent passing cases were not rerun after this narrow rejection-path change.

`node --check` on edited source and test and `git diff --check` on tracked source passed. No full suite or official stage run was performed.

## Final file SHA-256

- `workflows/build-code/capture.mjs`: `659d92c3c766b86303b87461a40a38de2d5ab5eaa1109a35a3e663a40ea83ea4`
- `tests/contract/build-code-targeted-capture.test.mjs`: `2f88e9cd299df9959d838e383f40563b42526f7fd0616ce2cf0d24bd4b4085ec`
- Read-only `workflows/build-code/case-reconciliation.mjs` at this capture: `c922cde636a206e84733d0fbffbe9ba5cdc67d611d3f7471b1322a6d7c95886b`
- Adjacent test at this capture: `ad0cd5ea99d704dd69ba34c4e17ab56625c72c07d6ab606027acc05d6df0952c`

This is local implementation evidence only. P10, AC26 and AC27 require independent review and real business-effect evidence before completion can be claimed.
