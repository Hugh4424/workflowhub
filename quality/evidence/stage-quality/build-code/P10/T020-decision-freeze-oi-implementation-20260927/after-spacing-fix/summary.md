# Decision-freeze spacing-fix targeted readback

Exact commands, cwd, HEAD, current P10 phase/spec/decision SHA-256, two test SHA-256, two production SHA-256, UTC times, exit codes, and raw-output hashes are in `runs.json`. Raw stdout and stderr are `command-1.*` and `command-2.*`.

1. `npx vitest run tests/contract/decision-freeze-current-oi.test.mjs`: exit 0, 26/26 passed. The immediately prior after run was 25/26 with the no-status CF/D-decision spacing case failing; that case now passes. This is the exact contract suite, not a broader phase gate.
2. `npx vitest run tests/integration/vnext-official-stage-run.test.mjs -t 'keeps a current OI content failure'`: exit 0, selected real handler case 1/1 passed, 106 skipped by filter. The prior after run also passed this selected case.

No failures occurred in these two target commands. The unrelated adjacent suite previously had 6 failures and was not rerun here. These scoped results do not assert P10 or whole CARD04 completion. No formal source, material, or Task facts was edited during this readback.
