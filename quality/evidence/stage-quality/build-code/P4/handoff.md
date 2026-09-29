# P4/T006 build-code handoff

**Local result:** `buildPostAcceptanceChainRows` is exported and called by `currentPostBuildCodeSpecAnalyze`. The focused frozen gate currently reports 5/5 passed. This is a P4 module result, not AC-18/AC-21 or whole-card acceptance. P5/real CLI/spec-analyze end-to-end consumption remains unproved.

## Implementation and focused evidence

- `runtime/stage/stage-runner.mjs` parses the current spec's four-column `## 来源与决策映射` table and decision-log D headings, carries current-snapshot ref/hash evidence, preserves CARD-05-derived `task_ids`, and discloses unmapped/absent values in `coverage_limits`. `vitest.config.mjs` includes `runtime/**/*.test.mjs`; frozen `runtime/stage/stage-runner.test.mjs` was not edited (SHA-256 `b9e790d61bb556fec620e79678426f401b0ed98f87acf211ac469f8dda47559e`). Sources: `T006-test-route.md`, `T006-include-diff.txt`, `T006-scope.txt`.
- Exact gate `npx vitest run runtime/stage/stage-runner.test.mjs`: initial target RED 5 collected/5 failed, then GREEN 5/5. A temporary `source_ids=[]` negative control gave 1 failed/4 passed; restored code returned 5/5. Sources: `T006-red.txt`, `T006-green.txt`, `T006-negative-control.txt`, `T006-green-after-negative.txt`.
- Real CARD-04 material probe found the original R IDs were outside the validator's U/V census. The bounded correction uses only decision-log `## 原始需求索引` R→U/V edges and census membership: AC-29 emits U-006-01..06; R-010/R-018 lack authenticated edges and are disclosed; R-999 gives empty `source_ids` with a gap. The no-index frozen fixture still emits provisional R and explicitly discloses that this does not certify original source identity. Sources: `T006-real-material-probe.txt`, `T006-source-normalization-red.txt`, `T006-source-normalization-real-probe.txt`, `T006-source-normalization-frozen-green.txt`, `T006-post-clarity-check.txt` (an obsolete wording assertion failed once, then corrected probe exit 0; frozen gate exit 0).

## Official pre-fix facts and later repair

- Official focused verify receipt `quality/tests/card04-P4-L0-official-20260926.json`, raw SHA-256 `a424a7176c6341171eea0aff0c6170790cae5f535c328b7bb55d29e51207e3fe`: same exact gate, exit 0, canonical output `quality/tests/output/card04-P4-L0-official-20260926.output` hash `b2d58d344f4f2161bfdcede0145948a9e2e50ca13643ba963f386e5ec2d0c73c`; snapshot tree `c4987d3e223a2861e735547658730d2bc7a33326`.
- P4 canonical OCR result `quality/reviews/results/build-code-simple-3d13aab6-f60e-535a-a050-12707123d310.json` (raw SHA-256 `396902d36a31e224ab885c709c9e0986ae2ee8b02e660f7f853cd9888dc3cf93`) is bound to that **pre-repair** snapshot tree and has nine findings. It does not review the later array fix or certify final P4 completion.
- F-a2f33615e177 identified silent loss of array-shaped `row.coverage_limits`. A direct probe recorded target RED exit 1 (existing failure text absent; source SHA-256 `9734dabcee733513d5fd0e44c299e3b361cae45f1d007f175f9a34df47895004`). The scoped code now preserves nonempty array entries, trims them, discloses invalid array entries and appends the existing limits. Post-fix source SHA-256 `e02b613b5723c08ca1c4bb417aa804f32d5bf60e47fd3fb73d57f774f96128f9`; direct probe exit 0, frozen gate 5/5 exit 0, syntax and diff check exit 0. Raw refs: `T006-array-limits-red.json`, `T006-array-limits-green.meta.json` and its named stdout/stderr files. **No actual production acceptanceChain run has proved an array-shaped limit reaches this builder**; the fix is a direct function/input-shape check, not an end-to-end result. No post-fix official receipt or second OCR is claimed.

## Finding ownership and limits

| OCR finding | Current disposition boundary |
| --- | --- |
| F-a2f33615e177 | Locally repaired and focused retested after OCR, with the production-array reachability limit above. Formal finding disposition remains with the current build-code owner. |
| F-205df6ef8547 | Real interface contradiction: no original-source index currently allows provisional R in `source_ids` (with disclosure), while the frozen P4 test expects R; indexed real CARD-04 rows emit only authenticated U/V. Changing to empty IDs in the no-index case conflicts with the frozen test/material behavior. Build-plan/frozen-test owner must settle this before a broader identity claim. |
| F-0dc92d92984d | P5/T008 producer and P6/T012 consumer: no authenticated report write from real CLI; remains `not_done/G2`, not a P4 gate failure. |
| F-18b734c3d5ed, F-7c5886e8c82b | P6/T011/T012 oracle path portability and frozen oracle-copy guard; test/material owner. |
| F-2a7ad4ee1d25 | P10 targeted-runner authorization and product behavior; P10/material owner. |
| F-a99590ddd5f1 | P2 frozen baseline assertion/caliber owner; cannot repair by changing P4 source. |
| F-abb55219e4cd | P5 frozen report-test header provenance owner; count comment is stale versus eight current tests. |
| F-c05bd41e4842 | P5/T007 route applicability semantics: N/A/unknown rows currently still carry `hard_requirements=true`; P5 owner must triage. |

P4 Phase card `specs/workflowhub-thin-core-card-04-20260919/phases/P4.md:15,44-45` reserves cross-P2/P3/P5 commands and the real build-code spec-analyze/CLI journey for later integration. The focused function gate, probes, official pre-fix receipt and OCR cannot be summed into an AC pass, report delivery, or whole-card completion. `file_symbol`, implementation/verification anchors, `review_ref`, UI consumer census, and unrelated Phase findings retain their stated owners and coverage limits.
