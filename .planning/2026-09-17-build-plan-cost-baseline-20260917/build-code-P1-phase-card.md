# Build-code P1 Phase Card — T001 RED

- **task / phase**: T001 / Phase P1 — WorkflowHub 先容忍非终态成员事实与等待复检
- **goal**: 在不改生产实现的前提下，建立可证伪的 WH-CONSUMER RED，覆盖非终态成员读取、终态等待复检、健康事实、broker 重发/不可用复用，以及格式/attempt 兼容边界。
- **authenticated worktree**: `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-cost-baseline-and-blocker-close-20260917`
- **material scope read**: `tasks.md:39-83`; `plan.md:554-610`; `workflows/build-code/skill-deps.yaml:1-20` 的必要声明。

## Exact allowed files and symbols

The builder patch already exists in exactly these five task-declared test files. They are evidence inputs and are **read-only for this runner**; no byte in them may be edited:

1. `tests/review/review-managed-lifecycle.test.mjs`
2. `tests/review/review-record-route.test.mjs`
3. `skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs`
4. `skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`
5. `skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs`

Allowed semantic symbols/regions are only the T001 target assertion regions for these ACs: `AC-WAIT-001`, `AC-WAIT-002`, `AC-HEALTH-003`, `AC-HEALTH-004`, `AC-BROKER-004`, `AC-FORMAT-003`, and `AC-FORMAT-004`. No production symbol is writable in T001 RED. The runner write allowlist is limited to this Phase Card, the explicit Knowledge test output, and the unique T001 execution-status facts in `tasks.md`.

## Covered ACs

- `AC-WAIT-001`
- `AC-WAIT-002`
- `AC-HEALTH-003`
- `AC-HEALTH-004`
- `AC-BROKER-004`
- `AC-FORMAT-003`
- `AC-FORMAT-004`

## Non-goals

- No production implementation or schema edit; no changes to `decision-log.md`, `spec.md`, or `plan.md`.
- No edits to the five builder-patched test files.
- No provider/config/confirmation-point change, network call, real provider, `cancelManaged` call, P2 producer work, review, commit, push, merge, archive, or cleanup.
- No claim of GREEN, full regression coverage, release, or task completion from RED evidence alone.

## Compatibility boundary

This RED is consumer-side and P1-only: it checks the planned tolerance of non-terminal member `status`/`error.code`/`last_progress_at_ms`, terminal recheck/wait behavior, the 20-minute threshold without `cancelManaged`, broker unavailable/reuse facts, extra top-level key tolerance, and attempt `process_outcome`/`parse_outcome` registration. P2 producers and unrelated historical/active control planes remain outside the boundary.

## Pre-designed route and oracle

- **old/planned route**: feature-level targeted local backend Vitest, runtime profile `phase`, no UI/browser, no real network/provider.
- **selected route before actual advisor**: the same backend route unless the one direct `test-routing-advisor` invocation identifies a real changed-file mismatch; record any reroute and reason in the execution facts.
- **concrete testing skill**: exactly one direct `backend-testing` use for the five-test boundary; unavailable remains explicitly unavailable and does not authorize a substitute route beyond the task command.
- **exact command**:

  `./node_modules/.bin/vitest run tests/review/review-managed-lifecycle.test.mjs tests/review/review-record-route.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`

- **expected RED**: exit `1`, subject to actual exit code; failure must come from the T001 target assertions, not environment or fixture setup.
- **oracle**: `ORACLE-WH-CONSUMER {"pass":"WH-CONSUMER 的全部 AC 通过且负例保留","reject":{"input":"当前实现未满足目标行为","expected_rejection":"targeted assertion exits non-zero","observation":"失败来自目标 assertion 而非环境或 fixture setup"}}`.
- **raw evidence**: `quality/tests/output/P1-red.txt`; do not create `P1-red-green.txt`.
- **ceiling**: `300000ms`; deterministic fake CLI/tmpdir only; no real network/provider.

### Route-advisor result (one direct use)

- **actual changed-file boundary**: the five test paths listed above; the pre-existing `.planning/.active_plan` and specs changes are outside this T001 behavior boundary.
- **old route**: `feature` (tasks.md test tier).
- **selected route**: `feature`.
- **reroute**: `no` — the actual boundary is a single backend review behavior domain with no UI, cross-end, database, auth, or deployment seam.
- **advisor result**:

  `{ "routing_tier": "feature", "routing_rationale": "实际 changed_files 仅为五个后端 review 行为 Vitest 文件，属于单一功能域行为变化，无 UI、跨端、数据库、认证或部署链路。", "result": "pass", "ts": "2026-09-17T14:20:56Z" }`

### Backend-testing strategy (one direct use)

- **changed files**: the exact five test paths above; no production files.
- **FR/AC**: `FR-WAIT-001`, `FR-WAIT-002`, `FR-HEALTH-003`, `FR-HEALTH-004`, `FR-BROKER-004`, `FR-FORMAT-003`, `FR-FORMAT-004` / the seven covered ACs above.
- **command / expected exit**: the exact Vitest command above / expected RED exit `1`.
- **oracle**: `ORACLE-WH-CONSUMER`; all seven target assertions and retained negative case must pass for the consumer behavior, while the current implementation must reject the target behavior with a non-zero targeted assertion; setup/environment failure is not a valid RED.
- **fixtures/services**: deterministic fake CLI/tmpdir only; no service startup, network, or provider.
- **coverage limits**: only the seven listed FR/AC and their named test seams; no full regression or P2 producer claim.
- **snapshot binding**: authenticated worktree at run time, base `HEAD=160778878912124c292f1beb0e5008299c396743`, with the five listed builder-patched test paths as the actual behavior boundary.
- **current spec_sha256**: `e08b01da771345bf15b2cf68995f5a9aed8ff094fefd75ca9003ffa0acac6ce7`.
- **current material_revision**: `revision-be35bc788fc67f9bd2c0ef9d951b921b59c412e0eab6a34a72269a3c0af656f1` (recomputed from the current four materials; `tasks.md` execution-status bookkeeping excluded by the runtime contract).

## STOP

Stop immediately on command/environment failure, boundary drift, any need for new design or changes to config/provider/confirmation points, relaxation of the seven red lines, or a T001 red-line regression. Preserve the real failure and do not rerun the test. Do not execute review; P1 review is separately delegated.

## Stage-end summary (to complete after the single run)

Record: delivered RED-only fact and exact five-file boundary; the one command and exit code; raw-output path, byte SHA-256, and output readback; each of the seven AC states with evidence anchors; route advisor and `backend-testing` results; review `not executed` by explicit scope; no production change, no test-file edit, no commit, and all remaining unknown/deferred limits. T001 must remain incomplete/pending unless the unique execution-status facts satisfy the task's RED-only completion contract; RED does not authorize T002 GREEN.

## Current P1 result — T002 closeout facts

- **recorded_at**: `2026-09-18T00:39:18+08:00`
- **authenticated worktree**: `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-cost-baseline-and-blocker-close-20260917`
- **current material identity**: `spec_sha256=7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847`; `material_revision=revision-d693aac95e68f5779923e7bce2f93f403f768e8a7b1c48e4e3f060af1593fc0e`
- **T002 result**: `completed` only for the existing implementation and the same targeted GREEN command. This does not mean Phase review, P1, or Stage complete.
- **RED → GREEN command fact**: the exact command in the task card was historically recorded with RED `exit=1` (`P1-red.txt:786-789`, 5 files failed / 42 failed and 142 passed), then GREEN `exit=0` (`P1-green.txt:104-119`, 5 files passed / 184 passed). This closeout worker did not rerun tests or review.
- **implementation boundary**: current T002 diff is in 9 declared files: `runtime/review/review-record-route.mjs`, `runtime/review/schemas/attempt.schema.json`, `skills/wh-review/scripts/review-provider-client.mjs`, `skills/wh-review/scripts/simple-review-runner.mjs`, `tests/review/review-managed-lifecycle.test.mjs`, `tests/review/review-record-route.test.mjs`, `skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs`, `skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`, and `skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs`; declared `skills/wh-review/scripts/review-result.mjs` has no current diff. No closeout-worker code/test bytes were added.
- **evidence**: current canonical RED `quality/tests/output/P1-red.txt` sha256=`97e7c39332b6c7bc9a3cf0670ae98c3420f57b0f06d853c776ffb376efdf3d4f`（790 lines/57314 bytes，结果 `P1-red.txt:786-789`）; GREEN `quality/tests/output/P1-green.txt` sha256=`2c993465ee4347c2eddd08245ffd2db38b9b9ebb090fef580d9c6552403bf1f`; retained failed history `/Users/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-cost-baseline-and-blocker-close-20260917/quality/tests/output/P1-green-pre-repair.txt` sha256=`84579c2edc7af77a8dbabad72e5717161917d1e836870912cee5ec45908a193b`; RED→GREEN summary `quality/tests/output/P1-red-green.txt` sha256=`218b4bd5c2f410c1f591420d2505a32d437fc421bb8457a1845746c8202a48d3`.
- **AC result and limits**: `AC-WAIT-001=PASS`; `AC-WAIT-002=PASS`; `AC-HEALTH-003=PARTIAL` (local consumer proof only; external 3rd-review producer guard not run); `AC-HEALTH-004=PARTIAL` (local immediate-consume proof only; cross-repo agy print-timeout versus healthy-slow producer evidence not run); `AC-BROKER-004=PASS`; `AC-FORMAT-003=PASS` for the targeted v3 client/contract matrix; `AC-FORMAT-004=UNKNOWN` because the required manual seven-redline diff was not run. These are targeted facts, not a full regression or stage outcome.
- **Phase review**: `unavailable`, not pass. Attempt 1 used `/dev/stdin` and ended `EAGAIN` with `adapter=0` and `provider=0`. Attempt 2 was an ordinary JSON official dispatch, ran about 21 minutes, then was stopped; no terminal output and no review refs were produced. No review pass or P1/Stage completion claim is valid.
- **retained history**: `P1-green-pre-repair.txt` remains unchanged as failed history; the `97e7c393…` RED bytes are the current canonical `P1-red.txt`; any copy inside the RED→GREEN aggregate remains provenance only and does not replace the independent current RED/GREEN refs.

## Next task

- **T003 / Phase P2**: 3rd-review health, retry, and public attempt facts. This closeout only records the next task pointer; it does not start T003 or claim P2 execution.
