# Build-code P4 Phase Card — T007 RED / T008 GREEN fact close

- **task / phase**: T007 / Phase P4 — 格式宽容、CJK 脱敏与七条红线
- **goal**: 在不新增生产代码或测试字节的前提下，执行当前 plan/tasks 对齐的七文件 targeted gate，建立可证伪的 FORMAT-REDLINES RED；覆盖甲类误杀/错误分类、CJK 脱敏边界、乙类格式抽取，以及丙类七条 fail-closed 红线。
- **authenticated WorkflowHub worktree**: /Users/Hugh/Hugh/Project/workflowhub-workflowhub-cost-baseline-and-blocker-close-20260917
- **branch / HEAD at authentication**: task/workflowhub/workflowhub-cost-baseline-and-blocker-close-20260917 / 160778878912124c292f1beb0e5008299c396743
- **material anchors read**: tasks.md:435-505（P4/T007）；plan.md:715-755（P4 gate）；spec.md:419-445（FR/AC-FORMAT-001~004）；decision-log.md:132-154（七红线与授权边界）
- **current four-material read**: specs/workflowhub-cost-baseline-and-blocker-close-20260917/{decision-log.md,spec.md,plan.md,tasks.md}；material identity is computed with materialRevisionFromValues([["decision-log.md",...],["spec.md",...],["plan.md",...],["tasks.md",...]]), which excludes only tasks.md execution-status blocks via taskExecutionRecordOnly.
- **current material revision**: `revision-465f070487de57f03acfa8cef177ab63f8fdc4edd9ad177cbc043f9e30542ad6`（本次 active GREEN/writeback 后由 TaskKernel canonical resolver 读回；`tasks.md` 执行状态区写回按运行时契约排除）
- **full material SHA-256 at pre-closeout readback**: decision-log.md=22af1df9a210aa8ea6de1b6e1415e14d1b860ddf18d02b07c6bde31667e679b3；spec.md=7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847；plan.md=8b91fd02b8a07ece0daf723b64dc213e9e64b47743e6f493589dfdb214ed01d4；tasks.md=23562f1ccb054c1e008af7c4fb6505be001b436757a6e80245550e21de5a806a

## Exact 7 test files and symbols

All seven files were read before the run. They are read-only evidence inputs for this runner. Existing dirty production/test/material bytes were present at authentication and are not attributed to this Phase Card or its test run.

1. skills/wh-review/scripts/__tests__/material-redaction.test.mjs
   - existing coverage, no new byte in this round: describe("simple review material host-path redaction") at :18; it("redacts host paths from string and JSON materials and keeps the bundle manifest honest") at :19; it("computes the material identity over redacted provider-visible bytes only") at :69.
2. tests/contract/review-materials-contract.test.mjs
   - existing coverage, no new byte in this round: it("redacts local host paths only in the provider-derived view") at :195; adjacent deterministic material/manifest guard it("keeps canonical manifests deterministic and rejects generic AC maps") at :204.
3. skills/wh-review/scripts/__tests__/review-runner.test.mjs
   - existing coverage, no new byte in this round: it("accepts exactly one reviewer JSON object and rejects malformed or oversized output") at :83; it("keeps an invalid evidence anchor from becoming a pass finding") at :162; it("does not treat an unmet reviewer quorum as a semantic pass") at :191; it("rejects malformed, aliased, and build-prd identities before finalization checks") at :225.
4. skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs
   - T007 additions: p4Finding at :1462, runP4Provider at :1473, describe("T007 P4 format tolerance") at :1497; JSONL precedence/all parseable rows it(...) at :1500; unique findings-bearing fence :1517; nested findings and top-level extras :1538; extra top-level keys :1554; first parseable JSON candidate :1567; severity alias it.each(...) at :1579; unknown severity drops only that finding :1593; all-invalid candidates return structured OUTPUT_INVALID with parse error :1606.
5. skills/wh-review/scripts/__tests__/wh-review-cli-bounds.test.mjs
   - existing truncation coverage at :13, :33; T007 additions: test("compactReviewDiff retains implementation and test sections under the truncation budget") at :62; test("compactVerifyCodeMaterials carries both implementation and test coverage into the bounded diff") at :79.
6. skills/wh-review/scripts/__tests__/simple-contracts.test.mjs
   - T007 guard additions: process/parse outcome registration it(...) at :165; private host path before dispatch :203; caller material keys and runner-owned instructions fail-closed :233; distinct model identities for minimum_heterologous :256; selected provider identity binding :276; submitted-material/real-line evidence anchors :292; submitted bundle material identity :335; non-terminal group and incomplete health member fail-closed :352.
7. tests/contract/review-layering.test.mjs
   - T007 guard additions: production-owned parser/provider-isolated adapter it(...) at :47; host URI rejection :56; mandatory serious-finding evidence fields :71; malformed provider cannot hide behind clean quorum peer :94; completed output ref/provider binding :113.

The three files explicitly marked “no new byte” remain in the seven-file gate because their existing tests are current coverage/negative guards; they were not silently omitted or relabeled as new T007 assertions.

## Acceptance criteria

- **AC-FORMAT-001 / FR-FORMAT-001 — 甲类实现边界**: member-level path overflow does not poison the whole group; safeBrokerError retains the original code and adds cause_code; parse errors are not swallowed by an empty catch; the zero-consumer PHASE_DIFF_MAX_DELIVERY_BYTES is absent; WH_REVIEW_TRUNCATED_SECTION covers every dropped section. Target symbols are the T007 parser/anchor/contract guards above plus the existing seven-file truncation and evidence guards.
- **AC-FORMAT-002 / FR-FORMAT-002 — CJK 脱敏边界**: redactProviderHostPaths tightens LOCAL_HOST_PATH boundaries so CJK text immediately after a host path is retained; host-path detection remains fail-closed and is not changed into warning-only adoption. Existing redaction tests in files 1–2 and T007 host-path guards in files 6–7 are the declared coverage.
- **AC-FORMAT-003 / FR-FORMAT-003 — 乙类格式宽容**: deterministic precedence is JSONL (all parseable rows), then the unique findings-bearing fence, then the first parseable JSON candidate; nested findings/top-level extra keys are accepted; severity aliases normalize; only unknown-severity findings are dropped; all-invalid candidates produce structured OUTPUT_INVALID plus parse error. The T007 simple-review-runner block at :1497-1627 is the direct behavior boundary.
- **AC-FORMAT-004 / FR-FORMAT-004 — 丙类七红线**: format/key tolerance must not weaken any of the seven fail-closed rules below. The seven-file command includes direct T007 guards and the existing negative guards; no manual diff or provider semantic review is claimed by this RED runner.

## Seven fail-closed redlines

1. Private/host paths remain fail-closed; only the blast radius may shrink, never adopt after warning.
2. Every finding must anchor to submitted real material and a real line number.
3. minimum_heterologous / quorum remains enforced.
4. The material allowlist and fixed instruction template remain enforced.
5. Material identity remains bound to the selected provider/selection identity.
6. Envelope/group/member required keys remain required; extra keys may be tolerated, missing required keys must fail.
7. Every non-minor finding still requires evidence_kind, evidence, and root_cause.

## Boundary and non-goals

- RED-only: no production implementation, schema, configuration, provider, confirmation-point, or material-semantic edit.
- No test-file edit by this runner; T007 test patches are pre-existing and read-only inputs.
- Only this Phase Card, the already-existing external raw evidence files, and the T007/T008 execution-status blocks in tasks.md may be written.
- No P1/P2/P3 route or testing reuse/rerun; no second test run.
- The T007 RED runner made no real network/provider, service startup, browser/full regression, review, verify, RED→GREEN aggregate, commit, push, merge, archive, release, or physical cleanup; the later T008 GREEN is recorded below as existing evidence and was not rerun here.
- The result cannot be called a clean RED unless the actual non-zero exit is owned by target assertions rather than command, collection, fixture, setup, or environment failure. Non-target failures remain separately classified and limit the claim.

## Route, concrete testing skill, command, and oracle

- **old route**: feature, from the P4 tasks.md / plan.md targeted-test predesign.
- **actual changed-file boundary for routing**: four T007-patched test files only: skills/wh-review/scripts/__tests__/simple-contracts.test.mjs, skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs, skills/wh-review/scripts/__tests__/wh-review-cli-bounds.test.mjs, tests/contract/review-layering.test.mjs. The three no-new-byte files are gate coverage inputs, not new changed files.
- **selected route**: fullstack.
- **reroute**: yes; the one direct advisor classified the actual changed paths as fullstack because they span the skills/ and tests/ top-level roots. This conservative path-boundary result does not claim UI, database, deployment, or network coverage.
- **test-routing-advisor**: used exactly once for this P4 new-behavior Phase, at 2026-09-17T23:12:32.636Z; it did not execute tests or modify the repository. Exact result:

  { "routing_tier":"fullstack","routing_rationale":"skills/wh-review/scripts/__tests__/simple-contracts.test.mjs, skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs, skills/wh-review/scripts/__tests__/wh-review-cli-bounds.test.mjs, tests/contract/review-layering.test.mjs => fullstack 边界","result":"pass","ts":"2026-09-17T23:12:32.636Z" }

- **concrete testing skill**: backend-testing, applied directly exactly once after the actual changed-file boundary was authenticated. It selected a targeted local Vitest run over deterministic tmpdir/fake provider seams; no service or network/provider is required. P1/P2/P3 testing skills/routes were not repeated.
- **declared command, exactly once**:

  ./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/material-redaction.test.mjs tests/contract/review-materials-contract.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli-bounds.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs tests/contract/review-layering.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000

- **expected exit**: 1 for T007 RED; actual exit is authoritative.
- **oracle**: ORACLE-FORMAT-REDLINES {"pass":"FORMAT-REDLINES 的全部 AC 通过且负例保留","reject":{"input":"当前实现未满足目标行为","expected_rejection":"targeted assertion exits non-zero","observation":"失败来自目标 assertion 而非环境或 fixture setup"}}
- **external raw evidence (T007 design target)**: legal current RED is `quality/tests/output/P4-red-clean.txt`; stdout/stderr are combined there. It was obtained during T008 implementation isolation, after which the five T008 production files were restored byte-for-byte. Earlier `P4-red.txt`, `P4-red-contaminated.txt`, and `P4-red-pre-test-fix.txt` remain retained provenance and are not the current legal pairing. Active T008 GREEN is `quality/tests/output/P4-green-findings-fixed.txt`; earlier `P4-green-anchor-protocol.txt` and `P4-green.txt` remain provenance. No `P4-red-green.txt` aggregate exists.
- **snapshot binding**: authenticated HEAD `160778878912124c292f1beb0e5008299c396743` plus current `material_revision=revision-465f070487de57f03acfa8cef177ab63f8fdc4edd9ad177cbc043f9e30542ad6`.
- **coverage limits**: only the seven declared files, their named symbols, AC-FORMAT-001~004, deterministic local fixtures, and retained negative guards. This does not prove production implementation, GREEN, RED→GREEN stability, full regression, manual seven-redline diff completeness, external 3rd-review producer behavior, review quality, release, or task/Phase/Stage completion.

## STOP

Stop and preserve the raw evidence if the exact command cannot run, the output target cannot be safely backed up/published, collection/setup/environment failure replaces target RED, the changed boundary leaves the four T007-patched files or the seven-file command, a config/provider/confirmation-point/material-semantic change is needed, a redline is weakened, P1/P2/P3 route/testing would be rerun, or review/implementation work is requested. Never run a second test. T007 RED does not authorize T008 GREEN or P4/Phase/Stage completion.

## Stage-end summary

The earlier T007 RED captures remain provenance, including the contaminated run. A separate legal current RED, `P4-red-clean.txt`, was obtained during T008 implementation isolation, after which the five T008 production files were restored byte-for-byte. T007 and T008 are complete at their task boundaries; P4 remains incomplete because the official phase review is unavailable/incomplete.

- **raw evidence**: legal current `P4-red-clean.txt`, `526 lines / 24964 bytes`, `sha256=a2f54a7f0db50ca55a9050a24ab89fc009383386e67a55a7b9309f7e023b7449`, summary `P4-red-clean.txt:522-526`; it records `exit_code=1`, `7/7` files, `25 failed | 181 passed (206)`, `setup=0ms`, and `environment=0ms`. Earlier `P4-red.txt` and `P4-red-contaminated.txt` remain identical provenance, `463 lines / 22032 bytes`, `sha256=e1905b9df5480cd82bdf720ba3098ec6143947b66b8b627caed37925f00a8bca`; `P4-red-pre-test-fix.txt` remains retained separately, `536 lines / 25115 bytes`, `sha256=b31ea573c3219eded4dbfc9b78fcf822c8b2446b3c66380200ecefad5551a228`, summary `:532-536`.
- **observed RED facts**: the legal current run reports `Test Files 5 failed | 2 passed (7)` and `Tests 25 failed | 181 passed (206)` (`P4-red-clean.txt:522-525`), with setup/collection/environment failure count `0`; the earlier contaminated and pre-test-fix records remain visible as provenance and are not promoted over the clean RED.
- **T007 test increment**: the current T007 test additions already exist in the authenticated worktree; this closeout did not add or modify test bytes. The legal RED was obtained during T008 implementation isolation, and the five production files were subsequently restored byte-for-byte.
- **AC-FORMAT-001 / 002 / 003 / 004**: the legal current RED is a targeted observation for all four AC under `ORACLE-FORMAT-REDLINES`; the retained contaminated RED history remains provenance and does not replace it.
- **route/testing**: existing facts remain old=`feature`, selected=`fullstack`, reroute=`yes`, one advisor result=`pass`, and one direct `backend-testing` use; this closeout did not rerun either route or tests.
- **review/delivery**: official review command `exit=0`，canonical_status=`unavailable`，terminal_status=`unavailable`，dispatch_state=`dispatched`，error=`EVIDENCE_ANCHOR_INVALID`（provider finding evidence does not anchor to submitted material），provider_calls=`2`（`kimi/coding=failed`、`codex/luna=failed`），findings=`[]`，coverage=`incomplete`，result_ref=`null`，无可接受 canonical findings。review unavailable/coverage incomplete 不是通过；不重试 provider。No commit/push/merge/archive/release/cleanup occurred in this closeout. T007/T008 task completion does not imply P4/Phase/Stage completion or review pass.
- **material binding**: current four-material revision is `revision-465f070487de57f03acfa8cef177ab63f8fdc4edd9ad177cbc043f9e30542ad6`; execution-status bookkeeping in `tasks.md` is excluded by the material contract. The canonical GREEN publication itself was bound before this writeback to `revision-f083e2935e930294f9fd2eb7182cd3ea03f5486bd4e0c53874908a59630449f5`.

## Current closeout addendum — T008

- **recorded_at**: `2026-09-18` (fact-only closeout; no test or review rerun).
- **status boundary**: T008 is `completed` at the task boundary: the five implementation files are landed, the paired legal T007 RED is valid, and the existing targeted GREEN fact is valid. P4 remains incomplete because official review quality is unavailable/incomplete; this does not mean review passed or delivery/close occurred.
- **implementation boundary**: `runtime/review/review-output.mjs`; `skills/wh-review/scripts/review-materials.mjs`; `skills/wh-review/scripts/review-input-bounds.mjs`; `skills/wh-review/scripts/review-provider-client.mjs`; `skills/wh-review/scripts/simple-review-runner.mjs`. Their current file hashes are the five unchanged-before/after hashes recorded in `P4-green.txt:13`; the landed `review-materials.mjs` anchor validator now permits the real repo-relative `__tests__` path while all other fail-closed boundaries remain unchanged; this closeout did not modify those files.
- **GREEN fact**: the active `P4-green-findings-fixed.txt` records the one-time exact seven-file run with `exit_code=0`, `7/7` files passed, `207/207` tests passed, setup/environment/fixture `0`, and Oracle `ORACLE-FORMAT-REDLINES`. Its canonical output sha256 and readback sha256 are both `d9ad1e11d643e268e4bbdb9feb3aedc7c650e340de034c13acd3c538bb21f68c` (`8831 bytes`); source `report.md` sha256=`ab6229db33ccf3b97de3605e7ebb566fdfe06074b88e327dc430045623472388`, `full-output.txt` sha256=`9e5f178a7ea94143542c65ad4bb8d49720c46fd0a9b43824e0f95e1f261f983b`. Earlier `P4-green-anchor-protocol.txt` and `P4-green.txt` remain provenance.
- **retained pre-anchor-fix and pre-repair history**: `P4-green-pre-anchor-fix.txt`, `168 lines / 12901 bytes`, `sha256=0d6ba90a234b7a9f4228713606490246eefbaaeaba5089b1d3f854544dc5dbe7`, remains provenance for the pre-anchor-fix GREEN; `P4-green-pre-repair.txt`, `175 lines / 10795 bytes`, `sha256=d41c2f6fb8900a6c09672cd544e84005636e924504760cb4bf33dd224a7b2f4e`, remains failed history and is not the current GREEN proof.
- **AC boundary**: `P4-red-clean.txt` and active `P4-green-findings-fixed.txt` are the targeted RED/GREEN observations for `AC-FORMAT-001~004` under `ORACLE-FORMAT-REDLINES`; implementation + paired RED/GREEN establish T008 task completion. P4 remains incomplete because phase review quality is `unavailable` with `coverage=incomplete`.
- **review fact**: official review command `exit=0`，canonical_status=`unavailable`，terminal_status=`unavailable`，dispatch_state=`dispatched`，error=`EVIDENCE_ANCHOR_INVALID`（provider finding evidence does not anchor to submitted material），provider_calls=`2`（`kimi/coding=failed`、`codex/luna=failed`），findings=`[]`，coverage=`incomplete`，result_ref=`null`，无可接受 canonical findings。attempt_ref=`quality/reviews/attempts/f4e036cf-7ec2-571f-a961-49245928f44a/attempt.json`（sha256=`193edc4647e2eb013ea0d90a36203c5109e350b8782aad8581470e568b2051ee`）；report_ref=`quality/reviews/reports/build-code-simple-f4e036cf-7ec2-571f-a961-49245928f44a.md`（sha256=`7a8e7b76dc1c89ae950856ffb5d81292a8172963925aea4a747b0aa144535d80`）。identity：`HEAD=160778878912124c292f1beb0e5008299c396743`、`snapshot_tree=d2d3753d530ea072a8ed994d8bbb906a276478d6`、`material_revision=revision-4790a96ad914466faaba42ace4adcc8b4501131144502a7ca42e286abf4dcac4`、`material_id=3320c28c2af55ca63f7dcb345263d282206bffd15a4942c75c5edce0d4e4485c`、`runtime_id=9f5bbad4-c84f-4ecc-ac7c-9c9a6af33d9d`。review unavailable/coverage incomplete 不是通过。
- **next boundary**: preserve the legal RED/GREEN facts and all earlier contaminated RED provenance; do not retry providers or mark/advance/close P4 from this writeback alone. P5 has not started.

## Findings-fixed writeback — 2026-09-18

- **canonical publish**: `quality/tests/output/P4-green-findings-fixed.txt`; create-only via canonical resolver + `TaskKernel.publishCanonicalRecord`; canonical output sha256=`d9ad1e11d643e268e4bbdb9feb3aedc7c650e340de034c13acd3c538bb21f68c`; readback sha256 is identical; `8831 bytes`; no `facts.jsonl`, `index.json`, or `quality/facts/` write.
- **source review retained**: result=`quality/reviews/results/build-code-simple-4578adc4-a530-591b-a0b9-76e9e607f3f9.json` sha256=`67461b156bfe4b39e3efb0749b00213f63322f7d377d5f37b3f3fdeca1d713d5`; attempt=`quality/reviews/attempts/4578adc4-a530-591b-a0b9-76e9e607f3f9/attempt.json` sha256=`bb33c2579e4642cfeff40a21f25c9b77bbe2a860c33d22b19cb6f573cdb5acdc`; report=`quality/reviews/reports/build-code-simple-4578adc4-a530-591b-a0b9-76e9e607f3f9.md` sha256=`e7ef3fc5508a17bce85964ed0881c49da5f2dcbea4e27b5eccb87e6c2c6886b3`; original status=`available`, terminal=`semantic`, dispatch=`dispatched`, coverage=`satisfied` unchanged.
- **dispositions**: `F-2645ad9c7ed8` (`F-2645`) quorum → `skills/wh-review/scripts/simple-review-runner.mjs:1263-1288` + `skills/wh-review/scripts/__tests__/simple-contracts.test.mjs:285` = `fixed`; `F-f188cead048d` (`F-f188`) blocked→failed → `skills/wh-review/scripts/simple-review-runner.mjs:1489-1508` + `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs:1328` = `fixed`; `F-6969c4609ab7` (`F-6969`) private host → `skills/wh-review/scripts/review-provider-client.mjs:853-858` + `skills/wh-review/scripts/__tests__/simple-contracts.test.mjs:233` = `fixed`.
- **review boundary**: this is disposition-only writeback; no test/review rerun. The current/fresh P4 review remains `unavailable` / `EVIDENCE_ANCHOR_INVALID` with `coverage=incomplete`; fresh review is pending. P4 remains `incomplete`; current review closure is not claimed.
