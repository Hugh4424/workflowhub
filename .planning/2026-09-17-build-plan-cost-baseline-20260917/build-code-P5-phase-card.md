# Build-code P5 Phase Card — T009 RED / T010 GREEN fact close

- **task / phase**: T009 / T010 / Phase P5 — 两轨质量事实绑定
- **goal**: 让 direction/detail review quality fact 只绑定各自轨道的 result；缺轨保持 `missing`，不得通过 `evidenceCandidate` 跨轨回退伪造 `recorded`。
- **authenticated WorkflowHub worktree**: `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-cost-baseline-and-blocker-close-20260917`
- **branch / HEAD at authentication**: `task/workflowhub/workflowhub-cost-baseline-and-blocker-close-20260917` / `160778878912124c292f1beb0e5008299c396743`
- **material anchors read**: `tasks.md:574-706`（P5/T009/T010）；`plan.md:773-800`（P5 gate）；`spec.md:451-464`（FR-BINDING-001/002）；`decision-log.md` D-021。
- **current four-material read**: `specs/workflowhub-cost-baseline-and-blocker-close-20260917/{decision-log.md,spec.md,plan.md,tasks.md}`；material identity uses `materialRevisionFromValues` and excludes only `tasks.md` execution-status blocks via `taskExecutionRecordOnly`。
- **current material revision**: `revision-4790a96ad914466faaba42ace4adcc8b4501131144502a7ca42e286abf4dcac4`；T009/T010 status writeback does not change this revision。
- **full material SHA-256 after fact sync**: `decision-log.md=22af1df9a210aa8ea6de1b6e1415e14d1b860ddf18d02b07c6bde31667e679b3`；`spec.md=7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847`；`plan.md=8b91fd02b8a07ece0daf723b64dc213e9e64b47743e6f493589dfdb214ed01d4`；`tasks.md=74ad754f01571097c4a30f4085095d2b5c9fece2ee36a0196a37e35c8a827d3f`。

## Exact implementation and test boundary

- `tests/e2e/vnext-five-stage-current.test.mjs:897-942` — T009 新增两轨绑定目标断言。
- `runtime/stage/stage-runner.mjs:1614-1616` — T010 唯一实现改动；`evidenceCandidate` 在 direction/detail 缺少本轨直接 ref/hash 时停止跨轨回退。
- No other P5 file, config, provider, material, or external repository was changed by this fact closeout。

## Covered acceptance criteria

- `FR-BINDING-001` / `AC-BINDING-001`: direction/detail 各自绑定本轨 result，缺轨不产生错误 `recorded` 事实。
- `FR-BINDING-002` / `AC-BINDING-002`: 同一 review subject 不因跨轨 fallback 产生冲突 current fact。

## Route, testing skill, command, and oracle

- **old route / selected route**: `feature` / `feature`。
- **reroute**: `no`；P5 route advisor `pass`，exit `0`。
- **testing skill**: `backend-testing`，用于本地 targeted Vitest gate；无真实 network/provider。
- **route dry-run**: 首次变量名错误，exit `1`；修正后 exit `0`。这两次是 route/dry-run 事实，不替代 T009/T010 gate。
- **gate_cmd**: `./node_modules/.bin/vitest run tests/e2e/vnext-five-stage-current.test.mjs -t "binds each make-decision review fact" --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`
- **oracle**: `ORACLE-FACT-BINDING`。
- **static checks**: `node --check runtime/stage/stage-runner.mjs` exit `0`；`git diff --check` exit `0`。

## Evidence and execution facts

- **T009 RED**: `quality/tests/output/P5-red.txt`; sha256=`477a8f84869d5fc6c0dbf1f1c76188cb522ad3cfd9ad6c7e27777fb78e11b007`; same gate exit `1`; `1 failed / 28 skipped (29)`; target assertion at `vnext-five-stage-current.test.mjs:921:34`; `setup=0ms`、`environment=0ms`。
- **T010 GREEN**: `quality/tests/output/P5-green.txt`; sha256=`dca82b9f106e491fe7e81e767ad5d49f4a79dcb45d4c96df2c6d5372eb4f8afa`; same gate exit `0`; `1 passed / 28 skipped (29)`; `paired_task=T009`；Oracle observed=`ORACLE-FACT-BINDING`。
- **root cause / fix**: `evidenceCandidate` 的跨轨回退把另一轨 evidence 当成本轨事实；T010 仅在 `runtime/stage/stage-runner.mjs:1614-1616` 对 direction/detail 缺少直接 ref/hash 时返回 `null`。
- **identity**: T009/T010 evidence 绑定 `material_revision=revision-4790a96ad914466faaba42ace4adcc8b4501131144502a7ca42e286abf4dcac4`；GREEN 证据直接绑定 paired task T009。
- **P5 official review**: official review command `exit=0`；CLI `status=recorded`、`reused=false`、`dispatch_state=dispatched`；canonical_status=`unavailable`；terminal_status=`unavailable`；error=`REVIEW_WAIT_EXCEEDED`；wait_ms=`1200000`；broker_cancelled=`false`（未取消）；provider_calls=`0`（selected `kimi/coding`、`codex/luna`）；findings=`[]`；severity=`unavailable`；coverage=`incomplete`；result_ref=`null`；attempt_ref=`quality/reviews/attempts/62b132e5-a709-56a5-ac56-9503891e6e9a/attempt.json`（sha256=`8bf2a5726094762d897a0b0139ac019b43880eb5d4abb80cc61d2dba158b63ec`）；report_ref=`quality/reviews/reports/build-code-simple-62b132e5-a709-56a5-ac56-9503891e6e9a.md`（sha256=`70e07dd09b6594d937d7b0e2db9133df657dcf92b647a36259302bb15325c6a1`）；identity=`request_key:be20b6cbf36d5dbde621d8748e11bb17e446285b56ce1205e8c818574731c611`、`request_id:wh-review-0cd8f2711c7f7cb9047b9d63ae9f9ad35cbd6c7177e1021ffe0539e72fd6ed25`、`runtime_id:fcc64458-87dd-426e-a4c4-001c02758459`、`HEAD:160778878912124c292f1beb0e5008299c396743`、`snapshot_tree:33d1f648a17a47e153e7ab82bf3237cb7297b20e`、`material_id:27a0d9e94278dff9f9b0e59d774bcc5bdd36011ee24e51552897dec2465ef09b`、`material_revision:revision-4790a96ad914466faaba42ace4adcc8b4501131144502a7ca42e286abf4dcac4`。review unavailable/incomplete 不是通过；不重试 provider。

## Boundary, status, and non-goals

- 核心实现、T009 RED、T010 GREEN 和静态检查事实已完成；本 card 不把 P5 写成 completed。
- **P5 status**: `incomplete` / `review unavailable`；official review 已记录为不可用，不能宣称 review pass、Phase complete 或 Stage complete。
- 既有 `unknown` / `unavailable` / `partial` 质量语义原样保留，不回填、不改写为通过；P4 已有 `unavailable` 事实不变。
- 不开始 T011；不跑测试/review，不改 P4 或 T001-P4 其他事实，不改 decision-log/spec/plan，不提交、不关闭。

## STOP and next boundary

- Stop on material identity drift, evidence mismatch, cross-track rebinding, changed-file boundary drift, or any need for new design/config/provider/material edits。
- Next task pointer is `T011 — RED：证据重采、私锁与 DEF-09 净减清理`；本 card 不启动 T011。
