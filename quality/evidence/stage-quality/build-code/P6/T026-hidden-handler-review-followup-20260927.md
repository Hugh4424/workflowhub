# T026 hidden handler: review follow-up

Captured 2026-09-27T05:18:51Z in authenticated CARD04 worktree, HEAD `ef920f1fbd415fe87d50930359059b661e141acd`. This follows `T026-hidden-handler-20260927.md` without overwriting its raw files. Before this follow-up source edit, `runtime/stage/stage-handlers.mjs` SHA-256 was `555cc654f69b618e623896e89a2fd5ecb76880468f9529958f1c4ed8ffef35a6`. After adding three tests but before source edit, live test SHA-256 was `4c1216594d47402e6b6d5a836094e8992137fad6c0b91d238290376a1e6c2379`.

Independent review found that the handler still launched browser QA before reading the saved test-output bytes/hash, and that its implementation diff reader did not apply the existing strict receipt validator. Three new tests use genuinely published, content-addressed malformed receipts: missing test output, output hash mismatch, and an implementation receipt whose head conflicts with its diff original. `T026-hidden-handler-review-red.{stdout,stderr,exit}.txt` records 3 target failures, exit 1, with browser callback called twice in each case. This is target RED, not setup/import failure.

The bounded handler change reads `tests.output_ref` through `worker.readEvidence` and compares the original bytes with `output_hash` before either browser path. It also calls `validateCanonicalImplementationReceipt` with the current Task ID/tree and the Task evidence reader, then retains the existing real Git diff verification. These added strict checks are applied to the current vNext receipt route; historical route logic was not broadened. No supplied receipts still take the existing continue-working path.

- `T026-hidden-handler-review-green.{stdout,stderr,exit}.txt`: exact three new tests, exit 0, 3 passed, 66 skipped.
- `T026-hidden-handler-review-adjacent-v2.{stdout,stderr,exit}.txt`: seven old/new invalid-receipt negatives plus a valid receipt with fixture-only browser evidence and the no-scenario standalone QA path, exit 0, 9 passed, 60 skipped.
- `T026-hidden-handler-review-pre.{stdout,stderr,exit}.txt`: pre-cohort vNext with no supplied implementation/test receipts, exit 0, 2 passed, 67 skipped.
- Earlier `T026-hidden-handler-adjacent-tier.*` remains 8 passed/2 failed because valid-receipt P11 code launches one extra browser QA per run. This follow-up did not modify that call order, and does not claim those two are green.

Final production SHA-256 `78a6c057b66ce5dae042e902687b85c49c7176bcb4873a3a0d9b323fb86cb107`; final live test SHA-256 `4c1216594d47402e6b6d5a836094e8992137fad6c0b91d238290376a1e6c2379`. Full current handler diff is `T026-hidden-handler-current.diff` (SHA-256 `a60e9f47c58ef251507a10aea84cdaaac01169982566cc8ed499faab3e5477e7`). Per raw file SHA-256 values are in `T026-hidden-handler-review-raw.sha256.txt`. `node --check` and `git diff --check` passed on both changed files. Frozen AC17 oracle bytes, stage-runner, freshness, Task facts, and public CLI were not edited here. No full suite, official run, commit, or push occurred.

Local target result only; independent re-review remains required. P11 real browser work and the two same-source failures remain open.
