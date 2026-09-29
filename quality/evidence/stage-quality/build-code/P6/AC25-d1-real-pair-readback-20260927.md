# AC-25 real d1 pair readback — 2026-09-27

**Result: incomplete.** The specified historical pair exists in the authenticated external Task store, but the current canonical history reader rejects its blue member. This is a targeted read-only diagnostic, not an official `verify` run or canonical receipt. No runtime, frozen test, spec, or Task store file was changed.

## Identity and exact run

- Worktree: `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`; HEAD `ef920f1fbd415fe87d50930359059b661e141acd`; HEAD tree `2a0e21e65488fba4e4507e4491f9edcab8e4585b`. The worktree is dirty; HEAD tree alone does not identify working file bytes.
- Task store: `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-04-20260919`. `openTask` returned `projectName=workflowhub`, `taskId=workflowhub-thin-core-card-04-20260919`; both specified member refs were present in its canonical attempt inventory.
- Node `v24.14.0`. Reader source `runtime/review/review-record-route.mjs` SHA-256 `d6363c44b3772b3deddd3d2d7c1272edec8094f8781681e9852fa41489c8ee84`; probe SHA-256 `a8a8f08276b8e76ac909bab0136003c947f0016f303d3bff3f471478d8c850dd`.
- Exact command, from the worktree root: `node quality/evidence/stage-quality/build-code/P6/AC25-d1-real-pair-readback-probe.mjs /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-04-20260919`. One invocation; exit `1`.
- Raw output: [stdout JSON](AC25-d1-real-pair-readback-20260927.stdout.json), SHA-256 `8cb2af6b0740707cf81f849b94e52d7e259d61b8153d94ed54a26137c67f61af`; [stderr](AC25-d1-real-pair-readback-20260927.stderr.txt), empty, SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; [exit file](AC25-d1-real-pair-readback-20260927.exit.txt), value `1`. [Metadata](AC25-d1-real-pair-readback-20260927.meta.json) records these identities and hashes.

The reader function is private. The [probe](AC25-d1-real-pair-readback-probe.mjs) reads the current source, resolves its relative imports to the same repository modules, and exports `readCanonicalReviewHistory` from an in-memory module. Its one diagnostic insertion records the values at the existing report-binding throw and then throws the **unchanged error**. The TaskHandle reads the external records; the probe does not call the public review route or write a new attempt.

## Stored pair and source hashes

All refs below are relative to the external Task store. The raw stdout additionally records byte counts and hashes for five completed provider outputs. The failed Kimi blue provider has no output ref (`RATE_LIMITED`).

| Record | Canonical ref | SHA-256 |
| --- | --- | --- |
| red attempt, `terminal_status=semantic` | `quality/reviews/attempts/5f798a09-caee-5912-ae05-a1cf5ea88968/attempt.json` | `e6cb3e950ec7732b53b6bcb65ed465e3c62671cf9e3d92f182bb81edd156418d` |
| red report | `quality/reviews/reports/make-decision-simple-5f798a09-caee-5912-ae05-a1cf5ea88968.md` | `42012a918340001549059ce2b358a5b9bb7e2c5d6ca5579a8d511e14ace3079d` |
| red published result | `quality/reviews/results/make-decision-simple-5f798a09-caee-5912-ae05-a1cf5ea88968.json` | `aa3575da571b507ade4b441c39f732f9024f09361523ff9ffa97dabc9c88a1c3` |
| blue attempt, `terminal_status=unavailable`, `result_ref=null` | `quality/reviews/attempts/04df852d-39a7-5ae0-a133-06e0b1964d10/attempt.json` | `2d4bc4e67d8b5102ae10fc9fab8390153465c21a34344639f1a860923e269a38` |
| blue report, `semantic_status=available`, `coverage=incomplete` | `quality/reviews/reports/make-decision-simple-04df852d-39a7-5ae0-a133-06e0b1964d10.md` | `1c551564a828ccfbfa796510821eae0c30ed5b785fe4038d80fd9b06543b3e69` |
| pair summary, `semantic_status=available`, `partial=true` | `quality/reviews/reports/make-decision-simple-1a2e192a-6ef7-5780-ac4f-d896b539d28a.md` | `9277302146408799d46998d12382bb1f6c1de32d1a1797b23742e0085edee98d` |

Pair ID: `d1fd1157-3519-4258-88be-a772415f39ca`. Both members say `make-decision`, snapshot tree `0bc7319afc89d7bdb1a715b05da1135aa2b3ab57`, material revision `revision-18e98ae16c58db7539e313139b557c1ffdcb960035f494138625bc2ef24b463e`, subject SHA-256 `74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b`. The pair summary binds red `coverage=satisfied` and blue `coverage=incomplete`.

## Failure and AC boundary

The one readback returned `Error: canonical review report binding is invalid`, annotated with blue attempt ref `quality/reviews/attempts/04df852d-39a7-5ae0-a133-06e0b1964d10/attempt.json`. Diagnostic values at that throw: attempt/report refs and `semantic_status=available` match; stored blue `coverage=incomplete`, prepared blue `coverage=satisfied`. The current reader's `allowHistoricalPartialCoverage` condition is false when scoped to this historical pair's own snapshot tree, so it rebuilds a different coverage value and rejects the record.

The P6/T014 six-test green gate uses a synthetic pair. Its foreign-pair case demonstrates that old records can be skipped without blocking a current request; it does not show this exact historical pair read back. AC-25 also calls for true-damage controls for a missing pair member, missing report ref, and semantic/canonical ref mismatch. The targeted T014 controls cover role binding loss and forged coverage, not that full AC-25 list. Therefore this probe narrows `unknown` to **incomplete**, not `proven` or `unavailable`.

Per `phases/P6.md` T014 and the user overlap ruling, reader implementation and remaining true-damage coverage belong to CARD-05. CARD-04 P6/T014 owns the policy consumer test and risk registration; this evidence does not change that boundary.
