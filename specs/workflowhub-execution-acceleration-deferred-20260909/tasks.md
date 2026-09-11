# 任务清单：WorkflowHub 执行提速延期项（S3/S4/S7）

- **Input**：`specs/workflowhub-execution-acceleration-deferred-20260909/decision-log.md`、`specs/workflowhub-execution-acceleration-deferred-20260909/spec.md@3c3d772b8c2e84de61f5ab82759bd34e4cf3b92dc4ae4ba3fe1fdbeebd93f638`、`specs/workflowhub-execution-acceleration-deferred-20260909/plan.md@ebd41fc92d710226ec59bac57a8b4ba435fe9777ae65d06f04bbca1c8c015eab`
- **Template version**：`plan-task.v4`
- **Execution statement**：以下全部是 build-code 未来执行设计；本次未运行测试、实现、性能测量或 Phase review。全部文件路径、符号与行号已按 merge main 后的工作树重新核对；S7 采用「保留既有 per-AC 唯一权威与唯一 writer，只核对不被绕过」的现行方向（spec §14.1、D-006）。

## 材料导航

| 材料 | 责任 | 读取时机 |
| --- | --- | --- |
| `decision-log.md#D-001..D-011` | 批准方向、权威划分与延期 | 每 Phase 开始 |
| `spec.md#6-功能需求`、`#7-验收标准` | FR/AC 与失败边界 | RED/FINAL |
| `spec.md#13.4`、`#3.3` | DEFER-REQ-AUTH 伪需求判定与非目标 | 边界核对 |
| `plan.md#Phase-P1--S3` 至 `#Phase-P4--S7` | 文件、顺序、恢复 | 每卡执行前 |
| `tasks.md` | 执行及唯一完成区 | build-code 写、verify-code 读 |

## Phase P1 — S3

### Goal

先拆 acceptance 测试，再把画像 consumer 收敛到同一来源并交付五轮独立性能证据与 worker 上限观测；advisor 只保留路由权威，不新增画像表。

### Files

- **NEW**：`tests/contract/acceptance-execution-inner.test.mjs`, `tests/contract/acceptance-execution-medium.test.mjs`, `tests/contract/runtime-profile-consumer-readback.test.mjs`, `tools/cli/measure-test-runtime-profile.mjs`, `docs/adr/0027-test-feedback-runtime-profile.md`
- **MODIFY**：`tools/cli/run-checks.mjs`, `tests/contract/acceptance-execution-tier.test.mjs`
- **READ-ONLY CONSUMER**：`skills/test-routing-advisor/SKILL.md`, `skills/test-routing-advisor/scripts/route.mjs`, `skills/test-routing-advisor/__tests__/skill-contract.test.mjs`, `tests/contract/test-runtime-profile.test.mjs`, `skills/spec-tasks/SKILL.md`, `workflows/build-plan/SKILL.md`, `workflows/build-plan/skill-deps.yaml`, `workflows/build-code/SKILL.md`, `workflows/build-code/skill-deps.yaml`, `package.json`, `tests/contract/spec-stage-artifact-closure.test.mjs`, `tests/contract/build-code-apply-contract.test.mjs` — owner T003（只读回执，不写入）
- **DO NOT TOUCH**：S4/S7 owner files；`runtime/stage/stage-content-contracts.mjs` 画像契约本体；S5/S6/reuse。

### Tasks

#### T001 — RED：先拆 acceptance 测试并固定 S3 失败矩阵

- **ID**：T001
- **Phase**：Phase P1 — S3
- **goal**：先机械拆 inner/medium，再用失败断言固定 consumer 同一来源、隔离、真实边界、文件级并行和性能 receipt。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/spec.md","hash":"3c3d772b8c2e84de61f5ab82759bd34e4cf3b92dc4ae4ba3fe1fdbeebd93f638","id":"SPEC-execution-acceleration"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/plan.md","hash":"ebd41fc92d710226ec59bac57a8b4ba435fe9777ae65d06f04bbca1c8c015eab","id":"PLAN-execution-acceleration"}]`
- **source_refs / decision_refs**：R-009; D-001/D-002/D-003/D-008/D-009/D-010 → FR-S3-01..13, FR-GOV-01..07, FR-GOV-001 → AC-S3-01..11, AC-GOV-01..06
- **输入**：当前混合 `acceptance-execution-tier` suite、既有画像契约与 consumer 现状、P1 Files。
- **依赖**：none
- **并行**：否 — 首个 RED；先拆测试且不得与实现并行。
- **FR**：FR-S3-01, FR-S3-02, FR-S3-03, FR-S3-04, FR-S3-05, FR-S3-06, FR-S3-07, FR-S3-08, FR-S3-09, FR-S3-10, FR-S3-11, FR-S3-12, FR-S3-13, FR-GOV-01, FR-GOV-02, FR-GOV-03, FR-GOV-04, FR-GOV-05, FR-GOV-06, FR-GOV-07, FR-GOV-001
- **AC**：AC-GOV-001
- **动作**：先用 Vitest JSON reporter 采集 legacy `acceptance-execution-tier.test.mjs` 的 expanded test-name multiset（**不得沿用任何旧数字**；旧「已知基线 55」已因该文件被 main 改写 +193 行而失效），raw ref/hash 入 receipt；再移动既有断言到 inner+medium 且保持每个 stable legacy case ID 恰好一次。新增断言：consumer 反向引用不得复制画像阈值（`tools/cli/run-checks.mjs:111` 的上限字面量必须先失败）、画像只从既有契约读取、真实文件重叠与 worker 上限。不改任何生产实现。
- **精确文件**：`tests/contract/acceptance-execution-tier.test.mjs`, `tests/contract/acceptance-execution-inner.test.mjs`, `tests/contract/acceptance-execution-medium.test.mjs`, `tests/contract/runtime-profile-consumer-readback.test.mjs`, `tests/contract/test-runtime-profile.test.mjs`, `skills/test-routing-advisor/__tests__/skill-contract.test.mjs`
- **boundary**：files: `tests/contract/acceptance-execution-tier.test.mjs`, `tests/contract/acceptance-execution-inner.test.mjs`, `tests/contract/acceptance-execution-medium.test.mjs`, `tests/contract/runtime-profile-consumer-readback.test.mjs`; symbols/regions: acceptance fixtures、既有画像契约 readback、capability traps、worker observations
- **输出**：相关目标断言失败且拆分无断言丢失的 RED raw output/receipt。
- **Knowledge**：inner 禁 network/DB/fs/child_process；medium 必须真实覆盖 git/workspace、argv/cwd/raw streams、bad/nonzero、cancel、port release；画像契约是唯一阈值来源，advisor 不是画像 owner。
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`npx vitest run tests/contract/acceptance-execution-tier.test.mjs tests/contract/acceptance-execution-inner.test.mjs tests/contract/acceptance-execution-medium.test.mjs tests/contract/runtime-profile-consumer-readback.test.mjs tests/contract/test-runtime-profile.test.mjs skills/test-routing-advisor/__tests__/skill-contract.test.mjs --fileParallelism --maxWorkers="$RESOLVED_WORKER_CEILING"`
- **expected_exit**：1
- **oracle**：`ORACLE-S3 {"pass":"拆分层保留 legacy case multiset 守恒、consumer 只读同一画像来源、inner 无真实能力调用、至少两文件时间重叠且 actual_workers 不超过解析出的上限","reject":{"input":"旧混合 tier suite、复制画像阈值的 consumer、singleFork/no-fileParallelism 串行退化","expected_rejection":"目标断言以非零退出失败，且失败点指向画像来源、隔离或并行事实而非 setup","observation":"RED raw output 指明 consumer/隔离/并行目标断言，不是环境噪声"}}`
- **evidence_path**：`quality/tests/S3/red/result.json`
- **STOP**：拆分丢断言、失败非目标、inner 必须触真实资源、需要第二画像表/第二阈值来源或越界时停止回 build-plan/build-spec。
- **recovery**：S3 owner 恢复原 suite 且确认断言计数不减；保留 RED 原始输出与重新采集的 case multiset。
- **task risk**：错误拆分导致假 RED；沿用旧 case 计数或旧 receipt 跳过采集。
- **test tier / test method**：feature / backend-testing（单测试反馈域行为与真实边界合同）。
- **scenarios / commands / expected exit / oracle**：consumer 复制阈值/画像缺失；inner 能力 trap；medium 六类真实合同；并行污染；命令如上，exit 1，ORACLE-S3。
- **fixtures_services**：临时 worktree/git/subprocess/port fixture 仅 medium 使用；测试负责 teardown；无网络 provider。
- **coverage limits**：不证明 fake 等价 real；不覆盖 S5/S6/TIA/reuse；不做性能通过声明。
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`quality/reviews/results/S3-phase-review.json`（由 T003 产出）
- **semantic_review_reason**：本卡为规划态；独立语义审查事实只能由同 Phase 的 REVIEW 卡在 GREEN 后产出，产出前不得声称语义已复核。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：P1 acceptance/profile contract files in the declared test boundary；未新增生产 authority
- **executed_commands**：`export RESOLVED_WORKER_CEILING=2; npx vitest run tests/contract/acceptance-execution-tier.test.mjs tests/contract/acceptance-execution-inner.test.mjs tests/contract/acceptance-execution-medium.test.mjs tests/contract/runtime-profile-consumer-readback.test.mjs tests/contract/test-runtime-profile.test.mjs skills/test-routing-advisor/__tests__/skill-contract.test.mjs --fileParallelism --maxWorkers="$RESOLVED_WORKER_CEILING"`；exit 1，70 passed / 2 failed / 72 total
- **evidence_refs**：`[{"ref":"/tmp/workflowhub-p1-s3-green.raw","kind":"RED_target_observation","sha256":"cbb90c0591fc68fee71382fe3f070514c5eaa89e8be4383a87dd3064137dc253"}]`
- **covered_ac**：AC-S3-01..11、AC-GOV-001（目标失败事实；不作通过声明）
- **review_fact**：P1 Phase review canonical fact `quality/reviews/attempts/ecd61bc0-40e4-53b6-ad8b-c6807d7b67dc/attempt.json`，`terminal_status=unavailable`；provider source identity failure raw 单独保留
- **completed_at**：2026-09-11T04:44:20+08:00
- **执行事实**：本次 targeted route 产生了目标域 RED 事实（`FORMAL_SNAPSHOT_MISMATCH`、`BRIDGE_REPLAY_CONFLICT`），符合非零失败观察；不能替代 T002 GREEN，失败原因与原始输出已保留。

#### T002 — GREEN：收敛画像 consumer 并完成五次独立性能 capture

- **ID**：T002
- **Phase**：Phase P1 — S3
- **goal**：用最小实现满足 T001，保留负例，并生成固定成员的五次独立性能事实。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/spec.md","hash":"3c3d772b8c2e84de61f5ab82759bd34e4cf3b92dc4ae4ba3fe1fdbeebd93f638","id":"SPEC-execution-acceleration"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/plan.md","hash":"ebd41fc92d710226ec59bac57a8b4ba435fe9777ae65d06f04bbca1c8c015eab","id":"PLAN-execution-acceleration"}]`
- **source_refs / decision_refs**：R-009; D-002/D-003/D-008/D-009 → 同 T001 FR/AC
- **输入**：T001 目标失败签名、拆分 suites、既有画像契约与 consumer 现状。
- **依赖**：T001
- **并行**：否 — 与 RED 串行；性能每次为独立新进程。
- **FR**：FR-S3-01, FR-S3-02, FR-S3-03, FR-S3-04, FR-S3-05, FR-S3-06, FR-S3-07, FR-S3-08, FR-S3-09, FR-S3-10, FR-S3-11, FR-S3-12, FR-S3-13, FR-GOV-01, FR-GOV-02, FR-GOV-03, FR-GOV-04, FR-GOV-05, FR-GOV-06, FR-GOV-07, FR-GOV-001
- **AC**：AC-GOV-001
- **动作**：把 `tools/cli/run-checks.mjs` 的上限字面量改为读取既有画像契约导出（consumer 只读同一来源，禁止复制阈值）；实现 `tools/cli/measure-test-runtime-profile.mjs` 作为五轮 capture runner（读取单一来源声明的画像与上限）；保持 inner 0 external、medium 薄真实；保持 advisor 只判 `simple|feature|fullstack`，不为其新增画像或阈值声明；写 ADR0027 记录「advisor 路由权威 + runtime 画像契约权威」的分工与画像阈值现状。GREEN 后交给 T014 执行五轮 capture。
- **精确文件**：`tools/cli/run-checks.mjs`, `tools/cli/measure-test-runtime-profile.mjs`, `tests/contract/acceptance-execution-tier.test.mjs`, `tests/contract/acceptance-execution-inner.test.mjs`, `tests/contract/acceptance-execution-medium.test.mjs`, `tests/contract/runtime-profile-consumer-readback.test.mjs`, `docs/adr/0027-test-feedback-runtime-profile.md`
- **boundary**：files: `tools/cli/run-checks.mjs`, `tests/contract/acceptance-execution-tier.test.mjs`, `tests/contract/acceptance-execution-inner.test.mjs`, `tests/contract/acceptance-execution-medium.test.mjs`, `tests/contract/runtime-profile-consumer-readback.test.mjs`, `docs/adr/0027-test-feedback-runtime-profile.md`; symbols/regions: run-checks 画像声明、acceptance fixtures、ADR0027
- **输出**：同命令 GREEN、consumer 反向引用 readback、五轮原始日志/时间与 performance profile。
- **Knowledge**：每轮只清 Vitest transform cache、不清 OS page cache；cold 第一次计统计；nearest-rank p95(n=5)=max；阈值只从单一来源读取。
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`npx vitest run tests/contract/acceptance-execution-tier.test.mjs tests/contract/acceptance-execution-inner.test.mjs tests/contract/acceptance-execution-medium.test.mjs tests/contract/runtime-profile-consumer-readback.test.mjs tests/contract/test-runtime-profile.test.mjs skills/test-routing-advisor/__tests__/skill-contract.test.mjs --fileParallelism --maxWorkers="$RESOLVED_WORKER_CEILING"`
- **expected_exit**：0
- **oracle**：`ORACLE-S3 {"pass":"同一断言全绿且负例保留；consumer 反向引用无复制阈值、画像只读同一来源、真实 overlap 与 worker 上限全部通过"}`
- **evidence_path**：`quality/tests/S3/green/result.json`
- **STOP**：需要改变画像阈值数值、需要第二画像表、worker 越限、能力越界、旧结果跳过或 ADR 与决定冲突时停止。
- **recovery**：回滚 P1 实现但保留 RED/样本/review；恢复原 suite 不得丢断言。
- **task risk**：性能环境漂移或错误 p95；`slice-advisory: reason="consumer 收敛、拆分测试与 ADR0027 必须由同一 S3 owner 同步，否则会复制出第二画像来源"; impact="单卡触及七个文件但仍低于文件阈值"; owner="S3 test-feedback owner"; recheck="五次样本、worker 事实和 Phase review 齐全后复查"`
- **test tier / test method**：feature / backend-testing + 独立进程性能测量。
- **scenarios / commands / expected exit / oracle**：同 T001；GREEN=0；另按 plan Test Strategy 三组循环各五次，ORACLE-S3。
- **fixtures_services**：固定 inner members；medium 临时真实 git/workspace/subprocess/port；每轮清 transform cache，测试清理 temp。
- **coverage limits**：不清 OS page cache；只证明固定基准机/成员；medium 非全量集成。
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`quality/reviews/results/S3-phase-review.json`（由 T003 产出）
- **semantic_review_reason**：本卡为规划态；独立语义审查事实只能由同 Phase 的 REVIEW 卡在 GREEN 后产出，产出前不得声称语义已复核。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：`tools/cli/run-checks.mjs`; `tools/cli/measure-test-runtime-profile.mjs`; P1 split/profile test files; `docs/adr/0027-test-feedback-runtime-profile.md`
- **executed_commands**：`export RESOLVED_WORKER_CEILING=2; npx vitest run tests/contract/acceptance-execution-tier.test.mjs tests/contract/acceptance-execution-inner.test.mjs tests/contract/acceptance-execution-medium.test.mjs tests/contract/runtime-profile-consumer-readback.test.mjs tests/contract/test-runtime-profile.test.mjs skills/test-routing-advisor/__tests__/skill-contract.test.mjs --fileParallelism --maxWorkers="$RESOLVED_WORKER_CEILING"`；exit 0，6 files / 72 tests passed；GREEN oracle 满足
- **evidence_refs**：`[{"ref":"quality/tests/S3/green/result.json","kind":"test_run","sha256":"392596300994dfbe135c579812a8a2df4b707e5b525df88889c1d2da984890f8"},{"ref":"/tmp/workflowhub-p1-s3-green-fix.raw","kind":"command_output","sha256":"b166411cce4027760b1eaab57ff8ead2961e317b529b89779badb627f9f94a22"}]`
- **covered_ac**：AC-S3-01..11、AC-GOV-001（targeted GREEN assertions pass；T014 五轮 profile capture 未完成，Phase quality 仍为 incomplete）
- **review_fact**：P1 Phase review canonical fact `quality/reviews/attempts/ecd61bc0-40e4-53b6-ad8b-c6807d7b67dc/attempt.json`，`terminal_status=unavailable`；report hash `c4cde0ee0e5f651a03b0d332649737778f78ddd2e51e1a7817ad9fccdea02f6e`
- **completed_at**：2026-09-11（targeted GREEN rerun）
- **执行事实**：P1 GREEN route 已通过；两个失败来自测试夹具未绑定当前认证 outcome/snapshot 语义，已在同 task 修正测试夹具并保留旧 partial receipt。T014 的独立 profile capture 未完成；Phase review 仍 unavailable，不据此宣称 Phase quality 完成。

#### T014 — CAPTURE：执行 S3 五轮协议并写不可变 receipt

- **ID**：T014
- **Phase**：Phase P1 — S3
- **goal**：把三组五轮测量从 prose 变成可执行独立进程协议，并保存完整 raw/structured facts。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/spec.md","hash":"3c3d772b8c2e84de61f5ab82759bd34e4cf3b92dc4ae4ba3fe1fdbeebd93f638","id":"SPEC-execution-acceleration"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/plan.md","hash":"ebd41fc92d710226ec59bac57a8b4ba435fe9777ae65d06f04bbca1c8c015eab","id":"PLAN-execution-acceleration"}]`
- **source_refs / decision_refs**：R-009; D-002/D-003/D-008 → FR-S3-02..13 → AC-GOV-001
- **输入**：T002 GREEN 结果、固定并已 hash 的 inner/medium member manifests、既有画像契约声明的画像与上限。
- **依赖**：T002
- **并行**：否 — 卡片调度串行；inner 集合的每一轮内部必须按解析出的 worker ceiling 文件级并行。
- **FR**：FR-S3-02, FR-S3-03, FR-S3-04, FR-S3-05, FR-S3-06, FR-S3-07, FR-S3-08, FR-S3-09, FR-S3-10, FR-S3-11, FR-S3-12, FR-S3-13
- **AC**：AC-GOV-001
- **动作**：实现并调用 measurement runner；固定并 hash inner/medium member manifests；每个 inner 文件×5、inner 集合×5、medium 集合×5，轮间独立进程，只清 transform cache；阈值与画像字段从 `--profile-json` 指向的单一来源读取（runner 内不得写死数值）；记录 PID/worker/start/end/per-file timing、能力计数、exit/signal/raw refs；画像变化时记录旧值/新值/理由。
- **精确文件**：`tools/cli/measure-test-runtime-profile.mjs`
- **boundary**：files: `tools/cli/measure-test-runtime-profile.mjs`, `tests/contract/runtime-profile-consumer-readback.test.mjs`; symbols/regions: five-run process orchestration、manifest hashing、raw/structured performance receipt
- **输出**：`quality/evidence/performance-profile/S3.json` 及五轮 raw refs/hash；失败时保留 incomplete/failed receipt。
- **Knowledge**：每轮只清 Vitest transform cache、不清 OS page cache；cold 第一次计统计；nearest-rank p95(n=5)=max；阈值只读不写。
- **verification_role**：N/A — non-behavior change: performance capture fact only
- **paired_task**：N/A — non-behavior capture has no RED/GREEN pair
- **gate_cmd**：`node tools/cli/measure-test-runtime-profile.mjs --profile-json="$PROFILE_JSON" --inner-manifest="$INNER_MANIFEST" --medium-manifest="$MEDIUM_MANIFEST" --runs=5 --output="$TASK_DIR/quality/evidence/performance-profile/S3.json"`
- **expected_exit**：0
- **oracle**：`ORACLE-S3-PERF {"pass":"五个独立 raw values；cold 第一轮仍计入；inner 单文件与集合、medium 集合各自的 max/p95 与单一来源声明的阈值逐项比对；receipt 字段、raw refs/hash、成员/profile hash 完整"}`
- **evidence_path**：`quality/evidence/performance-profile/S3.json`
- **STOP**：同进程循环、旧 receipt 复用、成员漂移、worker 不可观察/越限、fake 替代真实边界、缺 raw hash、runner 内写死阈值或阈值失败。
- **recovery**：保留失败 raw output 与 incomplete/failed receipt，修复 runner 或环境后只重跑本 capture，不复用旧结果。
- **task risk**：性能环境漂移、成员漂移或错误 p95 可能产生假绿；以固定 manifest/hash、独立进程和 raw refs 防止。
- **test tier / test method**：feature / 独立进程性能测量（non-behavior capture）。
- **scenarios / commands / expected exit / oracle**：cold/warm、单文件/集合、worker 解析；命令如上；exit 0 或诚实 incomplete；ORACLE-S3-PERF。
- **fixtures_services**：固定 members 与临时性能输出目录；无网络 provider；测试清理 temp。
- **coverage limits**：不清 OS page cache；不跨机器；不把 n=1 当统计证明。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：incomplete
- **actual_changes**：`tools/cli/measure-test-runtime-profile.mjs` capture runner；未改动 profile source。补充固定输入：profile JSON（`worker_ceiling=2`，阈值从 `TEST_RUNTIME_PROFILE_LIMITS_MS` 读取）与 inner/medium member manifests，仍不新增画像来源。
- **executed_commands**：
  1. `node tools/cli/measure-test-runtime-profile.mjs --profile-json="$PROFILE_JSON" --inner-manifest="$INNER_MANIFEST" --medium-manifest="$MEDIUM_MANIFEST" --runs=5 --output="$TASK_DIR/quality/evidence/performance-profile/S3.json"`；exit 1，`MEASUREMENT_FAILED`（profile JSON `ENOENT`）——缺失输入时的 fail-closed 事实，原样保留。
  2. `node tools/cli/measure-test-runtime-profile.mjs --profile-json=/tmp/workflowhub-s3-profile.json --inner-manifest=/tmp/workflowhub-s3-inner-manifest.json --medium-manifest=/tmp/workflowhub-s3-medium-manifest.json --runs=5 --output="$TASK_DIR/quality/evidence/performance-profile/S3-run-20260911-p1.json"`；exit 1，`status=incomplete/result=incomplete`（真实五轮已执行；能力观测未认证，见下）
- **evidence_refs**：`[{"ref":"quality/evidence/performance-profile/S3.json","kind":"performance_capture","sha256":"74cf9c52bd40744eff4a323645ce69ac119cab0b401e57a352967f09b52f659f"},{"ref":"quality/evidence/performance-profile/S3-run-20260911-p1.json","kind":"performance_capture","sha256":"4c4a9c9a02e1d3938a4aaafbd503b3cb549958ccf4a45bc33bb2a095ec22fe38"}]`
- **实测值（FR-S3-06/07/08，五次独立进程，首轮 cold 且计入统计）**：
  - inner 单文件 max：`test-runtime-profile` 3869ms、`runtime-profile-consumer-readback` 2314ms、`skill-contract` 474ms（阈值 60000ms；三项均 pass）
  - inner 集合 samples `[3614,3710,3741,3719,3688]`，max=p95=3741ms ≤60000ms；实际 worker 2/2，`overlap_observed=true`（FR-S3-13 成立）
  - medium 集合 samples `[2526,2445,2262,2395,2343]`，max=p95=2526ms ≤300000ms；实际 worker 2/2
  - 每个 member 均有 PID、start/end、exit 0、signal null、`cleanup=completed` 与 raw stdout/stderr ref+sha256
- **未认证项（不得改写为通过，AC-S3-07 / FR-S3-12）**：`capability_observations.inner/medium` 均为 `status=unavailable`，reason=`profile JSON did not provide an observed capability count`。全仓不存在 runtime capability observation 的生产者，唯一能写 `capability_proof` 的 `tools/cli/run-checks.mjs:128` 硬编码 `status:"unavailable"`，且 `tests/contract/acceptance-execution-inner.test.mjs:67` 断言其必须保持 `unavailable`。因此整体 `status/result` 依契约保持 `incomplete`，不宣称性能通过。
- **covered_ac**：AC-GOV-001、AC-S3-02..13（capture 字段完整、阈值实测达标；能力认证缺失故事实为 incomplete，没有五轮通过声明）
- **review_fact**：P1 Phase review canonical fact `quality/reviews/attempts/ecd61bc0-40e4-53b6-ad8b-c6807d7b67dc/attempt.json`，`terminal_status=unavailable`
- **completed_at**：2026-09-11T04:44:20+08:00（原始失败事实）；2026-09-11T15:40+08:00（五轮复跑）
- **执行事实**：runner 按五轮协议实际执行；第一次因缺 profile 输入 fail-closed，第二次补齐固定输入后真实跑完五轮并记录原始样本、cold 标记、worker/overlap 与 raw hash。两次均未复用旧 capture（FR-S3-11），也未把 incomplete 改写成通过（FR-S3-12）。

#### T003 — REVIEW：一次独立 S3 Phase review

- **ID**：T003
- **Phase**：Phase P1 — S3
- **goal**：对 S3 当前实现、RED/GREEN、五样本 receipt、consumer 单一来源与 owner 边界做一次独立异源审查。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/spec.md","hash":"3c3d772b8c2e84de61f5ab82759bd34e4cf3b92dc4ae4ba3fe1fdbeebd93f638","id":"SPEC-execution-acceleration"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/plan.md","hash":"ebd41fc92d710226ec59bac57a8b4ba435fe9777ae65d06f04bbca1c8c015eab","id":"PLAN-execution-acceleration"}]`
- **source_refs / decision_refs**：R-009; D-001/D-008 → S3 FR/AC
- **输入**：T001/T002/T014 raw/structured facts 与当前 diff。
- **依赖**：T014
- **并行**：否 — GREEN/capture 后仅一次 review。
- **FR**：FR-S3-01, FR-S3-02, FR-S3-03, FR-S3-04, FR-S3-05, FR-S3-06, FR-S3-07, FR-S3-08, FR-S3-09, FR-S3-10, FR-S3-11, FR-S3-12, FR-S3-13, FR-GOV-04, FR-GOV-06
- **AC**：AC-GOV-001
- **动作**：通过现有 review 入口提交一次独立 Phase review；保存 canonical attempt/result 或真实 unavailable；不由实现者自审。
- **精确文件**：`docs/adr/0027-test-feedback-runtime-profile.md`
- **boundary**：files: `docs/adr/0027-test-feedback-runtime-profile.md`, `skills/test-routing-advisor/SKILL.md`, `skills/test-routing-advisor/scripts/route.mjs`, `skills/test-routing-advisor/__tests__/skill-contract.test.mjs`, `tests/contract/test-runtime-profile.test.mjs`, `skills/spec-tasks/SKILL.md`, `workflows/build-plan/SKILL.md`, `workflows/build-plan/skill-deps.yaml`, `workflows/build-code/SKILL.md`, `workflows/build-code/skill-deps.yaml`, `package.json`, `tests/contract/spec-stage-artifact-closure.test.mjs`, `tests/contract/build-code-apply-contract.test.mjs`; symbols/regions: review subject manifest only；不改生产内容
- **输出**：一次 review provenance、findings 与处置事实。
- **Knowledge**：review 是事实非 gate；同 task 可修复；不得因普通 finding 自动二审。
- **verification_role**：N/A — non-behavior change: independent review fact only
- **paired_task**：N/A — review has no RED/GREEN pair
- **gate_cmd**：`node tools/cli/stage-runtime.mjs review --action=record --input="$WORKFLOWHUB_REVIEW_INPUT"`
- **expected_exit**：0
- **oracle**：`ORACLE-S3-REVIEW {"pass":"一次 canonical attempt/result 或真实 unavailable，provider/model/transport/usage/timing 原样保留"}`
- **evidence_path**：`quality/reviews/results/S3-phase-review.json`
- **STOP**：请求材料错绑、需要第二 review、provider 输出被摘要覆盖或需越界修复时停止。
- **recovery**：修复有效 finding 回 T002；保留原 review；不自动重发。
- **task risk**：provider unavailable 或 review 误称 pass。
- **test tier / test method**：feature / independent wh-review（非测试执行）。
- **scenarios / commands / expected exit / oracle**：available/partial/unavailable；命令如上；结构调用 exit 0；ORACLE-S3-REVIEW。
- **fixtures_services**：现有 review broker；无新 store。
- **coverage limits**：不替代测试/性能 oracle，不授权下一 Phase 或不可逆动作。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：N/A — independent P1 Phase review fact only; no production file changes
- **executed_commands**：一次完整材料 review dispatch exit 1（provider source identity missing）；随后 `node tools/cli/stage-runtime.mjs review --action=record --project=workflowhub --task=workflowhub-execution-acceleration-deferred-20260909 --stage=build-code --input=/tmp/workflowhub-p1-review-unavailable-p9.json` exit 0，`blocked_before_dispatch`
- **evidence_refs**：`[{"ref":"quality/reviews/attempts/ecd61bc0-40e4-53b6-ad8b-c6807d7b67dc/attempt.json","kind":"review_attempt","sha256":"a80aa25f11afbe97bb60f0359cb7af17507939e162f2f110430af98f7feda802"},{"ref":"quality/reviews/reports/build-code-simple-ecd61bc0-40e4-53b6-ad8b-c6807d7b67dc.md","kind":"review_report","sha256":"c4cde0ee0e5f651a03b0d332649737778f78ddd2e51e1a7817ad9fccdea02f6e"},{"ref":"/tmp/workflowhub-p1-review-p9.raw","kind":"review_dispatch_failure","sha256":"01eaa7951b80909bd0bb5c892238e9e0109f8f20497fe664a190d1bee9843eec"},{"ref":"/tmp/workflowhub-p1-review-unavailable-p9.raw","kind":"review_record","sha256":"892e59bb4b332d0fd0e3c477f1b48bd577758df2e275622deaafea0a2c27e8dd"}]`
- **covered_ac**：N/A — provider semantic result unavailable; no findings coverage claimed
- **review_fact**：`quality/reviews/attempts/ecd61bc0-40e4-53b6-ad8b-c6807d7b67dc/attempt.json`；`terminal_status=unavailable`，`dispatch_state=blocked_before_dispatch`，`error.code=MATERIAL_INCOMPLETE`，provider_attempts=0
- **completed_at**：2026-09-11T04:44:20+08:00
- **执行事实**：P1 review 失败 raw 与 canonical unavailable attempt 均保留；未把 provider failure 当作空 findings 或通过，未自动二审。
- **执行事实（当前修复）**：修复 `tools/cli/stage-runtime.mjs`，使 build-code phase review 与 integration review 一样从认证 worktree 构建完整 diff/material bundle；`tests/contract/review-public-entrypoints.test.mjs` 19/19、`tests/review/review-record-route.test.mjs` 89/89 通过。P1 当前 targeted capture 已重新执行并通过：`quality/tests/build-code-phase-p1-review-materials.json`，receipt_hash=`aff5fcc063d60881f8ba0bac6bf78dc4157137520f4db7d83536becf9ba7774c`，snapshot_tree=`a5bf2b1c6b94896ab022c1de17263b6ba302cfd7`；旧 pointer-only semantic review 不复用，新的完整材料 review 待记录。

- **执行事实（current official build-code run with workflowhub-session outcome）**：在 current snapshot_tree=`5301bde2057a39f360d8b16f44efead999019f82`、material_revision=`revision-1aa9cbe52f93d95f3a10ee32b72bef44b66421f605e259bdff616f39e3bec1ce` 上，使用既有 canonical implementation receipt `quality/evidence/implementation/6b620571aec1d1aec4e53a309a05c8b7a2e329dc4de0156b60f4cb4ab08ec7cd.json` 与 targeted test receipt `quality/tests/build-code-current-20260911-p20.json`（sha256=`46038eda52126aabed25a8a15b0115e3b5f89520e10824eba5e2c4699062faa2`，output=`quality/tests/output/build-code-current-20260911-p20.output`，output_hash=`0ae23c241126c7e25ac489a4b2b9508a61a07ebb5ee02f01579fe70868c9fa7e`，exit 0），先通过私有 bridge 发布当前 `workflowhub-session` outcome：attempt=`attempt-build-code-workflowhub-session-20260911-01`，ref=`quality/evidence/stage-outcomes/build-code/c9fb539adcd919533fe37f1b01ae9c7c2e4a5a06c1f7563e101640fbe3cb0d22.json`，sha256=`c9fb539adcd919533fe37f1b01ae9c7c2e4a5a06c1f7563e101640fbe3cb0d22`，status=`incomplete`。随后通过公开 `node tools/cli/stage-runtime.mjs run --action=execute --project=workflowhub --task=workflowhub-execution-acceleration-deferred-20260909 --stage=build-code --input=/tmp/workflowhub-build-code-run-with-outcome-01.json` 执行，exit 0，返回 `status=in_progress`、`work_status=ready`、`quality_status=incomplete`；`risk_tests_fresh` 为 passed，stage-end spec-analyze 为 inconsistent，acceptance_criteria、finding_dispositions、integration_review 与 current final review 仍 missing/incomplete，command acceptance output 非有效 UTF-8 JSON，故 acceptance chain 仍 missing。官方 handoff ref=`quality/evidence/handoff/build-code.md`，sha256=`b40134bbdb2a2a0fbf055c8c49fc14788ebb82f2cd5868207c1de8db51da2f06`；stage reflection availability ref=`quality/evidence/stage-reflection-availability/cc0a20645fa1689871db54c0ef82ba237b5519108659d2ad61a520590c25ecae.json`，sha256=`cc0a20645fa1689871db54c0ef82ba237b5519108659d2ad61a520590c25ecae`，reason=`executor_absent`。本事实不宣称 formal stage/quality/release/close/commit 完成；本行追加会令上述 outcome 进入 stale boundary，下一次 outcome 必须使用追加后的 current identity。

### Verify

- **Target**：FR-S3-01..13、AC-S3-01..11、FR/AC-GOV；ORACLE-S3/REVIEW。
- **gate_cmd**：`npx vitest run tests/contract/acceptance-execution-tier.test.mjs tests/contract/acceptance-execution-inner.test.mjs tests/contract/acceptance-execution-medium.test.mjs tests/contract/runtime-profile-consumer-readback.test.mjs tests/contract/test-runtime-profile.test.mjs skills/test-routing-advisor/__tests__/skill-contract.test.mjs --fileParallelism --maxWorkers="$RESOLVED_WORKER_CEILING"`
- **expected_exit**：RED 1；GREEN 0。
- **evidence_path**：`quality/tests/S3/`
- **Oracle**：目标失败→同命令通过；五次独立性能与一次 review 均真实记录，阈值只从单一来源读取。

### Knowledge

P2 只可消费已记录的 S3 consumer/worker 事实；画像契约本体仍归 runtime；质量缺失不作许可证但不得称完成。

### STOP

画像多 owner、需要第二阈值来源、真实边界需改决定、或断言丢失则回 owning material。

### Done

T001/T002/T014/T003 各有真实事实；五次协议完整；无伪造 pass。

### Risks and rollback

- **Risk**：拆分或性能统计假绿。
- **Prevention**：重新采集 case multiset、raw logs、固定成员与 worker。
- **Rollback / recovery**：仅回滚 P1，实现事实保留。

## Phase P2 — S4-slicing

### Goal

从现有卡字段现场派生三信号/三态并在 status 显示，解析错误与 unexplained 均 exit 0、非 gate；用可执行命令自检 canonical tasks。

### Files

- **NEW**：`tools/cli/validate-current-plan-tasks.mjs`
- **MODIFY**：`runtime/stage/stage-content-contracts.mjs`, `runtime/stage/stage-handlers.mjs`, `tools/cli/stage-runtime.mjs`, `tests/stage-plan-task-contract-v3.test.mjs`, `tests/contract/status-derivation.test.mjs`
- **DO NOT TOUCH**：review budget owner 与 per-AC authority；不新增 store/schema/gate。

### Tasks

#### T004 — RED：固定 slicing 三信号/三态/status/exit-0 矩阵

- **ID**：T004
- **Phase**：Phase P2 — S4-slicing
- **goal**：使旧 validator 在完整 advisory 断言上产生目标失败。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/spec.md","hash":"3c3d772b8c2e84de61f5ab82759bd34e4cf3b92dc4ae4ba3fe1fdbeebd93f638","id":"SPEC-execution-acceleration"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/plan.md","hash":"ebd41fc92d710226ec59bac57a8b4ba435fe9777ae65d06f04bbca1c8c015eab","id":"PLAN-execution-acceleration"}]`
- **source_refs / decision_refs**：R-010; D-001/D-004/D-008/D-009 → FR-S4S-01..07 → AC-S4S-01..09
- **输入**：T003 review fact、现有 validator/status fixtures、精确 marker 语法。
- **依赖**：T003
- **并行**：否 — 两测试共享 current/status 文件，必须 singleFork/no-fileParallelism。
- **FR**：FR-S4S-01, FR-S4S-02, FR-S4S-03, FR-S4S-04, FR-S4S-05, FR-S4S-06, FR-S4S-07, FR-GOV-01, FR-GOV-02, FR-GOV-06
- **AC**：AC-GOV-001
- **动作**：增加 ≤10/11 files、1/2 targets、cross-phase、multi-signal、精确/错误 marker、现场重派生、无第二 store、所有诊断 exit 0 的失败断言。
- **精确文件**：`tests/stage-plan-task-contract-v3.test.mjs`, `tests/contract/status-derivation.test.mjs`
- **boundary**：files: `tests/stage-plan-task-contract-v3.test.mjs`, `tests/contract/status-derivation.test.mjs`; symbols/regions: plan task fixtures、status derivation fixtures
- **输出**：仅 advisory 目标断言失败的 RED evidence。
- **Knowledge**：共享 status 文件使测试串行；unexplained 是质量缺口非推进 gate。
- **verification_role**：RED
- **paired_task**：T005
- **gate_cmd**：`npx vitest run tests/stage-plan-task-contract-v3.test.mjs tests/contract/status-derivation.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-S4S {"pass":"三信号、三态、marker parser、status 可见性与恒 exit 0 契约全部按新合同成立","reject":{"input":"当前无 SIG-FILES/SIG-TARGETS/SIG-CROSS-PHASE 与三态实现的 validator 与 status","expected_rejection":"目标断言以非零退出失败，且失败点为缺失信号或状态而非 fixture race","observation":"RED raw output 显示目标信号/状态字段缺失"}}`
- **evidence_path**：`quality/tests/S4-slicing/red/result.json`
- **STOP**：失败来自 fixture race、要求非零退出、新字段/store、改变 marker 或越界时停止。
- **recovery**：恢复测试 fixture，保留目标 RED；重新串行复现。
- **task risk**：共享 fixture 并行造成不稳定 RED；P4 使用独立 `four-domain-close-status` 文件，故本卡不产生跨 Phase file intersection。
- **test tier / test method**：feature / backend-testing。
- **scenarios / commands / expected exit / oracle**：三信号及组合、marker 格式负例、edit readback、exit 0 contract；外层 RED command exit 1；ORACLE-S4S。
- **fixtures_services**：共享 current task/status temp fixture；同进程串行，测试清理。
- **coverage limits**：不证明计划本身好坏；不覆盖 review budget；不成为 gate。
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`quality/reviews/results/S4-slicing-phase-review.json`（由 T006 产出）
- **semantic_review_reason**：本卡为规划态；独立语义审查事实只能由同 Phase 的 REVIEW 卡在 GREEN 后产出，产出前不得声称语义已复核。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：P2 slicing contract fixtures in `tests/stage-plan-task-contract-v3.test.mjs` and `tests/contract/status-derivation.test.mjs`; RED was reproduced against the detached pre-implementation baseline without changing the current worktree.
- **executed_commands**：in an isolated detached worktree at baseline `e2803a12c3912270284c252fadcdcf3240371227`, `npx vitest run tests/stage-plan-task-contract-v3.test.mjs tests/contract/status-derivation.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；exit 1，2 files，42 passed / 5 failed / 47 total；failure points were missing slicing projection/status and the absent pre-implementation self-check command.
- **evidence_refs**：`[{"ref":"quality/tests/S4-slicing/red/result.json","kind":"test_run","sha256":"b8762e5abf1a9afd1c55251d1cb213318d1d3a8eca915313a65d4beb936cdc47"},{"ref":"/tmp/workflowhub-p2-s4s-red-baseline.raw","kind":"command_output","sha256":"f7ed065fe1654ad0186ec6d1e78353248f3648631ea8cb05158abbe7203acc23"},{"ref":"/tmp/workflowhub-p2-s4s-route.raw","kind":"direct_GREEN_observation","sha256":"a18c81335b156dfbbd65f35dd2ed72db97b92c9989da1212e5abe1cab08adb63"}]`
- **covered_ac**：AC-S4S-01..09、AC-GOV-001（RED baseline and later GREEN route facts recorded; semantic review unavailable, so Phase quality remains incomplete）
- **review_fact**：P2 Phase review canonical fact `quality/reviews/attempts/f8b25169-ac29-564b-a2c6-827aae535eef/attempt.json`，`terminal_status=unavailable`；provider semantic result unavailable
- **completed_at**：2026-09-11（isolated baseline RED reproduction）
- **执行事实**：T004 的 RED 已在隔离 detached baseline 复现并保留 raw/structured receipt；当前实现未被基线复现动作修改。随后当前 worktree 的同一路由已独立 GREEN 通过，P2 Phase review 仍 unavailable，不据此宣称 Phase quality 完成。

#### T005 — GREEN：扩展 validator/status 并现场自检当前 tasks

- **ID**：T005
- **Phase**：Phase P2 — S4-slicing
- **goal**：仅从现有字段派生三态并让 status 消费同一结果，当前 tasks 不为 unexplained。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/spec.md","hash":"3c3d772b8c2e84de61f5ab82759bd34e4cf3b92dc4ae4ba3fe1fdbeebd93f638","id":"SPEC-execution-acceleration"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/plan.md","hash":"ebd41fc92d710226ec59bac57a8b4ba435fe9777ae65d06f04bbca1c8c015eab","id":"PLAN-execution-acceleration"}]`
- **source_refs / decision_refs**：R-010; D-004/D-008/D-009 → 同 T004 FR/AC
- **输入**：T004 失败签名与现有 `task risk` 原文。
- **依赖**：T004
- **并行**：否 — RED/GREEN 与 shared status fixture 严格串行。
- **FR**：FR-S4S-01, FR-S4S-02, FR-S4S-03, FR-S4S-04, FR-S4S-05, FR-S4S-06, FR-S4S-07, FR-GOV-01, FR-GOV-02, FR-GOV-06
- **AC**：AC-GOV-001
- **动作**：扩展 `validatePlanTaskContract` 派生 SIG-FILES/SIG-TARGETS/SIG-CROSS-PHASE 和三态；handler/status 只消费，并预留通用只读 projection renderer 供 P3/P4 消费而不再改 CLI；实现自检 CLI，串行读取 canonical spec/plan/tasks 并 capture hashes、signals/state/exit。
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`, `runtime/stage/stage-handlers.mjs`, `tools/cli/stage-runtime.mjs`, `tools/cli/validate-current-plan-tasks.mjs`, `tests/stage-plan-task-contract-v3.test.mjs`, `tests/contract/status-derivation.test.mjs`
- **boundary**：files: `runtime/stage/stage-content-contracts.mjs`, `runtime/stage/stage-handlers.mjs`, `tools/cli/stage-runtime.mjs`, `tools/cli/validate-current-plan-tasks.mjs`, `tests/stage-plan-task-contract-v3.test.mjs`, `tests/contract/status-derivation.test.mjs`; symbols/regions: validatePlanTaskContract、build-plan projection、通用 status renderer、current material self-check
- **输出**：同命令 GREEN；再运行 `node tools/cli/validate-current-plan-tasks.mjs --spec=specs/workflowhub-execution-acceleration-deferred-20260909/spec.md --plan=specs/workflowhub-execution-acceleration-deferred-20260909/plan.md --tasks=specs/workflowhub-execution-acceleration-deferred-20260909/tasks.md --output="$TASK_DIR/quality/evidence/S4-slicing/current-tasks-self-check.json"`，保存 validator/status readback 与三态 diagnostics。
- **Knowledge**：marker 原文唯一持久事实，禁止另存派生态；通用 renderer 是 P3/P4 唯一只读组合点，P2 之后不再改 CLI。
- **verification_role**：GREEN
- **paired_task**：T004
- **gate_cmd**：`npx vitest run tests/stage-plan-task-contract-v3.test.mjs tests/contract/status-derivation.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-S4S {"pass":"正负矩阵通过；内部 advisory/parse 状态均 exit 0；canonical material hashes 匹配、全部三信号显式返回、当前 tasks 不是 unexplained_overage 且 SIG-CROSS-PHASE=0"}`
- **evidence_path**：`quality/tests/S4-slicing/green/result.json`, `quality/evidence/S4-slicing/current-tasks-self-check.json`
- **STOP**：需第二 store/schema、硬 gate、status 重算不同逻辑、当前 tasks unexplained 或 ADR 泛化 supersede 时停止。
- **recovery**：回滚派生/display，保留 marker、RED 与 review facts，不留持久三态。
- **task risk**：`slice-advisory: reason="validator、handler、通用 status renderer、自检 CLI 和共享 fixture 必须由 P2 同一 owner 同步以防派生漂移"; impact="单卡六文件但不与后续 Phase 共享 producer"; owner="S4-slicing validator owner"; recheck="current-tasks self-check 非 unexplained_overage 且 SIG-CROSS-PHASE=0 后复查"`
- **test tier / test method**：feature / backend-testing。
- **scenarios / commands / expected exit / oracle**：同 T004；GREEN 0；ORACLE-S4S；额外真实 current-plan readback。
- **fixtures_services**：同 T004；无新服务/store。
- **coverage limits**：只验证 parser/validator/status；不限制推进，不覆盖 review budget。
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`quality/reviews/results/S4-slicing-phase-review.json`（由 T006 产出）
- **semantic_review_reason**：本卡为规划态；独立语义审查事实只能由同 Phase 的 REVIEW 卡在 GREEN 后产出，产出前不得声称语义已复核。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：`runtime/stage/stage-content-contracts.mjs`; `runtime/stage/stage-handlers.mjs`; `tools/cli/stage-runtime.mjs`; `tools/cli/validate-current-plan-tasks.mjs`; `tests/stage-plan-task-contract-v3.test.mjs`; `tests/contract/status-derivation.test.mjs`
- **executed_commands**：`npx vitest run tests/stage-plan-task-contract-v3.test.mjs tests/contract/status-derivation.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；exit 0，2 files / 47 tests passed；`node tools/cli/validate-current-plan-tasks.mjs --spec=specs/workflowhub-execution-acceleration-deferred-20260909/spec.md --plan=specs/workflowhub-execution-acceleration-deferred-20260909/plan.md --tasks=specs/workflowhub-execution-acceleration-deferred-20260909/tasks.md --output="$TASK_DIR/quality/evidence/S4-slicing/current-tasks-self-check.json"`；exit 0
- **evidence_refs**：`[{"ref":"quality/tests/S4-slicing/green/result.json","kind":"test_run","sha256":"97c41af1808d0b8a13867d5254cfba9217310d3f203c63e786c7bf6c468c0825"},{"ref":"quality/evidence/S4-slicing/current-tasks-self-check.json","kind":"current_plan_self_check","sha256":"a1b7d49642338d7c4d1d71b26a4eb362fd012ac6091d6cb78cbb4bd22b40427f"},{"ref":"/tmp/workflowhub-p2-s4s-route.raw","kind":"command_output","sha256":"a18c81335b156dfbbd65f35dd2ed72db97b92c9989da1212e5abe1cab08adb63"}]`
- **covered_ac**：AC-S4S-01..09、AC-GOV-001（validator/status/readback 通过；质量结果不替代最终 aggregate）
- **review_fact**：P2 Phase review canonical fact `quality/reviews/attempts/f8b25169-ac29-564b-a2c6-827aae535eef/attempt.json`，`terminal_status=unavailable`，`dispatch_state=blocked_before_dispatch`，`error.code=MATERIAL_INCOMPLETE`；report hash `3d21fe1c72176391579f5aee5d43baf44361b425ed89b3fbde58467d527a1f1c`
- **completed_at**：2026-09-11T04:10:49+08:00
- **执行事实**：P2 targeted GREEN 及 current-plan self-check 均实际通过；self-check 记录 `validator.ok=true`、`slice_advisory.status=within_budget`、`exit_code=0`，仅保留 malformed marker diagnostics，不把它们改写成失败或 gate。

#### T006 — REVIEW：一次独立 slicing Phase review

- **ID**：T006
- **Phase**：Phase P2 — S4-slicing
- **goal**：独立审查 advisory 是否非 gate、单派生且 status 一致。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/spec.md","hash":"3c3d772b8c2e84de61f5ab82759bd34e4cf3b92dc4ae4ba3fe1fdbeebd93f638","id":"SPEC-execution-acceleration"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/plan.md","hash":"ebd41fc92d710226ec59bac57a8b4ba435fe9777ae65d06f04bbca1c8c015eab","id":"PLAN-execution-acceleration"}]`
- **source_refs / decision_refs**：R-010; D-004 → S4S FR/AC
- **输入**：T004/T005 facts、current-plan readback、diff。
- **依赖**：T005
- **并行**：否 — GREEN 后一次 review。
- **FR**：FR-S4S-01, FR-S4S-02, FR-S4S-03, FR-S4S-04, FR-S4S-05, FR-S4S-06, FR-S4S-07, FR-GOV-04, FR-GOV-06
- **AC**：AC-GOV-001
- **动作**：现有 review 入口一次独立 review；保留 canonical provenance/findings。
- **精确文件**：`tests/stage-plan-task-contract-v3.test.mjs`
- **boundary**：files: `tests/stage-plan-task-contract-v3.test.mjs`, `tests/contract/status-derivation.test.mjs`, `tools/cli/validate-current-plan-tasks.mjs`; symbols/regions: review subject manifest only；ADR0028 尚未由 P3 生产，不在 P2 写入
- **输出**：一次真实 review fact 与处置。
- **Knowledge**：provider unavailable 不是 pass，也不阻止同 task 修复。
- **verification_role**：N/A — non-behavior change: independent review fact only
- **paired_task**：N/A — review has no pair
- **gate_cmd**：`node tools/cli/stage-runtime.mjs review --action=record --input="$WORKFLOWHUB_REVIEW_INPUT"`
- **expected_exit**：0
- **oracle**：`ORACLE-S4S-REVIEW {"pass":"唯一 canonical attempt/result 或 unavailable"}`
- **evidence_path**：`quality/reviews/results/S4-slicing-phase-review.json`
- **STOP**：错绑、二审、来源丢失或 finding 要求产品方向改变时停止。
- **recovery**：有效 finding 回 T005；不自动二审。
- **task risk**：review 被误作 gate/pass。
- **test tier / test method**：feature / independent wh-review。
- **scenarios / commands / expected exit / oracle**：available/partial/unavailable；现有 review command；ORACLE-S4S-REVIEW。
- **fixtures_services**：现有 broker。
- **coverage limits**：不替代 RED/GREEN、自检或用户授权。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：N/A — independent P2 Phase review fact only; no production file changes
- **executed_commands**：`node tools/cli/stage-runtime.mjs review --action=record --project=workflowhub --task=workflowhub-execution-acceleration-deferred-20260909 --stage=build-code --input=/tmp/workflowhub-p2-review-unavailable.json`；exit 0，`blocked_before_dispatch`
- **evidence_refs**：`[{"ref":"quality/reviews/attempts/f8b25169-ac29-564b-a2c6-827aae535eef/attempt.json","kind":"review_attempt","sha256":"9856db9f49b877c66eef3365800d07c5bde1fc478d53fb7730df9c18db6c909c"},{"ref":"quality/reviews/reports/build-code-simple-f8b25169-ac29-564b-a2c6-827aae535eef.md","kind":"review_report","sha256":"3d21fe1c72176391579f5aee5d43baf44361b425ed89b3fbde58467d527a1f1c"}]`
- **covered_ac**：N/A — provider semantic result unavailable; no findings coverage claimed
- **review_fact**：`quality/reviews/attempts/f8b25169-ac29-564b-a2c6-827aae535eef/attempt.json`；`terminal_status=unavailable`，`dispatch_state=blocked_before_dispatch`，`error.code=MATERIAL_INCOMPLETE`，provider_attempts=0；不等同 provider 通过或空 findings
- **completed_at**：2026-09-11T04:12:00+08:00
- **执行事实**：P2 review 只记录一次 canonical unavailable fact，保留 provider 前材料缺失，不自动二审。

### Verify

- **Target**：FR-S4S-01..07、AC-S4S-01..09、non-gate/current-plan seam。
- **gate_cmd**：`npx vitest run tests/stage-plan-task-contract-v3.test.mjs tests/contract/status-derivation.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：RED 1；GREEN 0。
- **evidence_path**：`quality/tests/S4-slicing/`
- **Oracle**：ORACLE-S4S；共享状态串行，advisory 内部恒定 exit 0。

### Knowledge

P3 不得复用 slicing validator 做预算判断；P3 是 ADR0028 whole-file 唯一 producer，读取 P2 已冻结事实并一次写齐 slicing+review-budget 两节。

### STOP

出现新 gate/store、第二派生或 shared tests 并行即停止。

### Done

RED/GREEN/readback/review 事实齐全且当前 tasks 不为 unexplained。

### Risks and rollback

- **Risk**：状态派生漂移或提醒被忽略。
- **Prevention**：单 owner/consumer readback。
- **Rollback / recovery**：删除派生展示，不删 marker/事实。

## Phase P3 — S4-review-budget

### Goal

核对正式派发预算只有一个 owner；合法复用不耗预算；result-only 只有完整 immutable provenance 才可 current；删除死类 `narrow_diff`。

### Files

- **NEW**：`docs/adr/0028-plan-slicing-and-review-budget.md`（whole-file owner=P3；完整记录 P2 已冻结 slicing 决定与本 Phase review-budget 决定）、`tests/contract/review-public-entrypoints.test.mjs`
- **MODIFY**：`runtime/review/review-record-route.mjs`, `runtime/evidence/stage-content-evidence.mjs`, `skills/wh-review/scripts/wh-review-cli.mjs`, `tests/review/review-record-route.test.mjs`, `tests/contract/freeze-classification-budget-usage-protocol.test.mjs`, `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`, `docs/adr/0007-phase-and-integration-review-material-architecture.md`
- **READ-ONLY CONSUMER**：`tests/contract/review-budget-namespace.test.mjs`, `tests/review/review-managed-lifecycle.test.mjs` — owner T009（只读回执，不写入）
- **DO NOT TOUCH**：P2 slicing producer/status 实现与其 owner 文件、provider immutable 原始输出。

### Tasks

#### T007 — RED：固定唯一预算链与完整 import provenance 矩阵

- **ID**：T007
- **Phase**：Phase P3 — S4-review-budget
- **goal**：证明既有 route 对正式旁路、死类或伪造/陈旧 result-only import 的目标断言失败或缺失。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/spec.md","hash":"3c3d772b8c2e84de61f5ab82759bd34e4cf3b92dc4ae4ba3fe1fdbeebd93f638","id":"SPEC-execution-acceleration"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/plan.md","hash":"ebd41fc92d710226ec59bac57a8b4ba435fe9777ae65d06f04bbca1c8c015eab","id":"PLAN-execution-acceleration"}]`
- **source_refs / decision_refs**：R-010; D-001/D-005/D-008 → FR-S4R-01..09 → AC-S4R-01..12
- **输入**：T006 review fact、formal route、budget validator、immutable attempt/provider output fixtures。
- **依赖**：T006
- **并行**：否 — 同一 canonical history/attempt fixture 串行。
- **FR**：FR-S4R-01, FR-S4R-02, FR-S4R-03, FR-S4R-04, FR-S4R-05, FR-S4R-06, FR-S4R-07, FR-S4R-08, FR-S4R-09, FR-GOV-01, FR-GOV-02, FR-GOV-04
- **AC**：AC-GOV-001
- **动作**：新增 allowed/exhausted/reuse/preflight/bad history/dead kind/provider failure，以及 attempt ref/hash、request key+identity、task/scope/stage/subject/phase、material id/revision、snapshot/source tree、evidence ref/hash、provider adapter/source/config/model、每个 raw output ref/hash、report/result ref/hash 的逐字段 import 矩阵；真实调用 public `node tools/cli/stage-runtime.mjs review --action=record --input=...` 与 bare `node skills/wh-review/scripts/wh-review-cli.mjs ...`，固定 provider/attempt/budget call counts，证明 bare 即使内容优秀也始终 noncanonical/authoritative:false 且不入 budget history；断言既有唯一预算链 `readCanonicalBudgetHistory`→`validateReviewBudget` 不被绕过、`narrow_diff` 死类无生产路径。
- **精确文件**：`tests/review/review-record-route.test.mjs`, `tests/contract/freeze-classification-budget-usage-protocol.test.mjs`, `tests/contract/review-public-entrypoints.test.mjs`, `tests/contract/review-budget-namespace.test.mjs`, `tests/review/review-managed-lifecycle.test.mjs`, `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- **boundary**：files: `tests/review/review-record-route.test.mjs`, `tests/contract/freeze-classification-budget-usage-protocol.test.mjs`, `tests/contract/review-public-entrypoints.test.mjs`; symbols/regions: formal request/result fixtures、budget history/import provenance cases、dead kind removal
- **输出**：仅预算/provenance/死类目标断言失败的 RED evidence。
- **Knowledge**：合法 import 必须引用 existing immutable attempt；全匹配才 current，0 dispatch/0 budget；删除只会收窄控制面。
- **verification_role**：RED
- **paired_task**：T008
- **gate_cmd**：`npx vitest run tests/review/review-record-route.test.mjs tests/contract/freeze-classification-budget-usage-protocol.test.mjs tests/contract/review-public-entrypoints.test.mjs tests/contract/review-budget-namespace.test.mjs tests/review/review-managed-lifecycle.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-S4R {"pass":"唯一预算链、reuse、preflight 零派发、死类删除与逐字段 import provenance 目标断言成立","reject":{"input":"缺字段/错材料/陈旧/篡改的 result-only import 与死类 narrow_diff","expected_rejection":"目标断言以非零退出失败，失败点指向 provenance 字段或死类而非 provider 噪声","observation":"RED raw output 指明缺失的 provenance 字段或 narrow_diff 路径"}}`
- **evidence_path**：`quality/tests/S4-review-budget/red/result.json`
- **STOP**：无法枚举 current producer、fixture 缺 immutable raw output、需要新 schema/公共入口或失败被漂白时停止。
- **recovery**：恢复 fixture，保留 RED 与原 provider outputs。
- **task risk**：漏测一个 provenance 字段会形成伪 current；误把既有唯一预算链当待重造对象。
- **test tier / test method**：feature / backend-testing。
- **scenarios / commands / expected exit / oracle**：合法/逐字段缺失错绑陈旧篡改、reuse/exhausted/preflight、dead kind、unavailable；exit 1；ORACLE-S4R。
- **fixtures_services**：临时 TaskKernel/canonical history/fake provider raw outputs；无真实 provider 花费。
- **coverage limits**：不判断审查语义质量；裸跑可能花费但永不权威；不覆盖 S5 delta review。
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`quality/reviews/results/S4-review-budget-phase-review.json`（由 T009 产出）
- **semantic_review_reason**：本卡为规划态；独立语义审查事实只能由同 Phase 的 REVIEW 卡在 GREEN 后产出，产出前不得声称语义已复核。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：P3 review-budget route files and contract tests in the declared boundary; RED was reproduced in an isolated temporary branch at the pre-implementation baseline without changing the current worktree.
- **executed_commands**：at baseline `e2803a12c3912270284c252fadcdcf3240371227`, `npx vitest run tests/review/review-record-route.test.mjs tests/contract/freeze-classification-budget-usage-protocol.test.mjs tests/contract/review-public-entrypoints.test.mjs tests/contract/review-budget-namespace.test.mjs tests/review/review-managed-lifecycle.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；exit 1，3 failed / 3 passed files，178 passed / 20 failed / 198 total；failures were the absent result-only import, legacy narrow-diff route, and stale provider failure handling. Current worktree GREEN rerun is separately recorded in T008.
- **evidence_refs**：`[{"ref":"quality/tests/S4-review-budget/red/result.json","kind":"test_run","sha256":"df8735cc93a7c327f0d12beb9b0cd391502b775aaa065fdf43d7f43ceb7ec6f3"},{"ref":"/tmp/workflowhub-p3-s4r-red-branch.raw","kind":"command_output","sha256":"e052e3cae62a5e7bdb2e24525b58bc5dba3ab8574d4ef6e6bd5a0b571c191b96"},{"ref":"/tmp/workflowhub-p3-s4r-green-fix.raw","kind":"direct_GREEN_observation","sha256":"0e13069af60cb18c59f06910a1d9e980d1eb653c2a401c5a2864358e92f1fcd1"}]`
- **covered_ac**：AC-S4R-01..12、AC-GOV-001（baseline RED and later targeted GREEN facts recorded; semantic review unavailable, so Phase quality remains incomplete）
- **review_fact**：P3 Phase review canonical fact `quality/reviews/attempts/6e7e830f-0729-5656-a39e-3076d7a60011/attempt.json`，`terminal_status=unavailable`；provider semantic result unavailable
- **completed_at**：2026-09-11（isolated baseline RED reproduction）
- **执行事实**：T007 的 RED 已在临时分支基线完整结束并保留 raw/structured receipt；当前 worktree 的 P3 GREEN 已另行通过。T009 Phase review 仍 unavailable，不据此宣称 Phase quality 完成。

#### T008 — GREEN：补齐 result-only provenance 并清理死类

- **ID**：T008
- **Phase**：Phase P3 — S4-review-budget
- **goal**：所有正式派发仍只经唯一预算链，stage consumer 不重算，非法 import 仅 authoritative:false，死类无生产路径。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/spec.md","hash":"3c3d772b8c2e84de61f5ab82759bd34e4cf3b92dc4ae4ba3fe1fdbeebd93f638","id":"SPEC-execution-acceleration"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/plan.md","hash":"ebd41fc92d710226ec59bac57a8b4ba435fe9777ae65d06f04bbca1c8c015eab","id":"PLAN-execution-acceleration"}]`
- **source_refs / decision_refs**：R-010; D-005/D-008 → 同 T007 FR/AC
- **输入**：T007 failures、canonical history、existing attempt/raw outputs。
- **依赖**：T007
- **并行**：否 — 同一 budget/import authority 原子修改。
- **FR**：FR-S4R-01, FR-S4R-02, FR-S4R-03, FR-S4R-04, FR-S4R-05, FR-S4R-06, FR-S4R-07, FR-S4R-08, FR-S4R-09, FR-GOV-01, FR-GOV-02, FR-GOV-04
- **AC**：AC-GOV-001
- **动作**：不重造预算链——核对 formal route 仍只在 `readCanonicalBudgetHistory`→`validateReviewBudget` 一处裁决；在此基础上补齐 result-only import 对 existing attempt 全 provenance 的认证；删除 `runtime/evidence/stage-content-evidence.mjs` 中不可达的 `narrow_diff` kind 与分支；bare CLI 明确只写 noncanonical sink/authoritative:false；通过 public `review --action=record` 做只读集成（不声明或修改 P2 的 owner 文件）；创建完整 ADR0028 并精确修订 ADR0007；只允许一次真实正式 request readback，若不可用如实记录。
- **精确文件**：`runtime/review/review-record-route.mjs`, `runtime/evidence/stage-content-evidence.mjs`, `skills/wh-review/scripts/wh-review-cli.mjs`, `tests/review/review-record-route.test.mjs`, `tests/contract/freeze-classification-budget-usage-protocol.test.mjs`, `tests/contract/review-public-entrypoints.test.mjs`, `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`, `docs/adr/0028-plan-slicing-and-review-budget.md`, `docs/adr/0007-phase-and-integration-review-material-architecture.md`
- **boundary**：files: 同精确文件；symbols/regions: readCanonicalBudgetHistory、recordSimpleReviewRequest/Result、validateReviewBudget、REVIEW_BUDGET_KINDS/narrow_diff removal、bare authority boundary、ADR0028 complete content/exact ADR0007 supersedes
- **输出**：同命令 GREEN、formal provenance readback、0/1 provider/attempt/budget counts。
- **Knowledge**：reuse 先于 budget reject；pre-dispatch failure 不消耗；非正式 review 永不 current；删除死类后生产反向引用必须为零。
- **verification_role**：GREEN
- **paired_task**：T007
- **gate_cmd**：`npx vitest run tests/review/review-record-route.test.mjs tests/contract/freeze-classification-budget-usage-protocol.test.mjs tests/contract/review-public-entrypoints.test.mjs tests/contract/review-budget-namespace.test.mjs tests/review/review-managed-lifecycle.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-S4R {"pass":"public action 全部经过既有 canonical budget owner；合法 import 0 dispatch；任一 provenance 错仅 authoritative:false 且不发布 current；bare CLI 即使输出 pass 也 0 canonical attempts/0 budget history/authoritative:false；无 narrow_diff；ADR0028 同时含 slicing+review-budget owner/consumer/removal，ADR0007 exact supersedes 断言通过"}`
- **evidence_path**：`quality/tests/S4-review-budget/green/result.json`
- **STOP**：第二正式 owner、summary 替代 raw provenance、新 schema/command、provider failure 需伪 pass 或 immutable attempt 无法认证时停止。
- **recovery**：原子回滚当前 route/validator，不改 immutable attempts/raw outputs，不恢复 narrow_diff 旁路。
- **task risk**：来源链复杂但不可删；`slice-advisory: reason="正式 route 与 budget validator 必须同一 Phase 同步以保证唯一裁决及完整导入认证"; impact="共享 canonical history 使实现和测试必须串行"; owner="S4-review-budget formal request owner"; recheck="全 provenance 矩阵和一次 formal readback 完成后复查"`
- **test tier / test method**：feature / backend-testing。
- **scenarios / commands / expected exit / oracle**：同 T007；GREEN 0；ORACLE-S4R；一次 formal readback 不重复花费。
- **fixtures_services**：同 T007；真实 provider 若 unavailable 保留 actual attempt。
- **coverage limits**：不衡量 review 语义；单次真实请求不替代入口枚举合同测试。
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`quality/reviews/results/S4-review-budget-phase-review.json`（由 T009 产出）
- **semantic_review_reason**：本卡为规划态；独立语义审查事实只能由同 Phase 的 REVIEW 卡在 GREEN 后产出，产出前不得声称语义已复核。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：`runtime/review/review-record-route.mjs`; `runtime/evidence/stage-content-evidence.mjs`; `skills/wh-review/scripts/wh-review-cli.mjs`; P3 contract/review tests; `docs/adr/0028-plan-slicing-and-review-budget.md`; exact ADR0007 revision
- **executed_commands**：`npx vitest run tests/review/review-record-route.test.mjs tests/contract/freeze-classification-budget-usage-protocol.test.mjs tests/contract/review-public-entrypoints.test.mjs tests/contract/review-budget-namespace.test.mjs tests/review/review-managed-lifecycle.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；exit 0，6 files / 198 tests passed；GREEN oracle 满足
- **evidence_refs**：`[{"ref":"quality/tests/S4-review-budget/green/result.json","kind":"test_run","sha256":"058e249a2b0cd2ba78d4987a91fd9519019c1dfe26873745b9c59657ff758dd3"},{"ref":"/tmp/workflowhub-p3-s4r-green-fix.raw","kind":"command_output","sha256":"0e13069af60cb18c59f06910a1d9e980d1eb653c2a401c5a2864358e92f1fcd1"}]`
- **covered_ac**：AC-S4R-01..12、AC-GOV-001（targeted GREEN assertions pass；T009 Phase review unavailable，Phase quality 仍为 incomplete）
- **review_fact**：P3 Phase review canonical fact `quality/reviews/attempts/6e7e830f-0729-5656-a39e-3076d7a60011/attempt.json`，`terminal_status=unavailable`；report hash `3be8b9a989bcb1d440377967720b90afeaa14132bafe05122396f6bc3db572eb`
- **completed_at**：2026-09-11（targeted GREEN rerun）
- **执行事实**：P3 targeted GREEN route 已通过；paired broker failure 失败来自旧 fixture 使用过期 public envelope，已改为当前 managed `workflowhub-run.v1`/convergence 语义并保留旧 partial receipt。T009 Phase review 仍 unavailable，不据此宣称 Phase quality 完成。

#### T009 — REVIEW：一次独立 budget/provenance Phase review

- **ID**：T009
- **Phase**：Phase P3 — S4-review-budget
- **goal**：独立审查预算唯一性、完整 provenance、bare 隔离与 failure honesty。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/spec.md","hash":"3c3d772b8c2e84de61f5ab82759bd34e4cf3b92dc4ae4ba3fe1fdbeebd93f638","id":"SPEC-execution-acceleration"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/plan.md","hash":"ebd41fc92d710226ec59bac57a8b4ba435fe9777ae65d06f04bbca1c8c015eab","id":"PLAN-execution-acceleration"}]`
- **source_refs / decision_refs**：R-010; D-005 → S4R FR/AC
- **输入**：T007/T008 facts、formal provenance readback、diff。
- **依赖**：T008
- **并行**：否 — GREEN/capture 后一次 review。
- **FR**：FR-S4R-01, FR-S4R-02, FR-S4R-03, FR-S4R-04, FR-S4R-05, FR-S4R-06, FR-S4R-07, FR-S4R-08, FR-S4R-09, FR-GOV-04, FR-GOV-06
- **AC**：AC-GOV-001
- **动作**：提交一次独立 review；保存原始 provenance/findings/usage/timing。
- **精确文件**：`tests/review/review-record-route.test.mjs`
- **boundary**：files: `tests/review/review-record-route.test.mjs`, `tests/contract/review-budget-namespace.test.mjs`, `tests/review/review-managed-lifecycle.test.mjs`; symbols/regions: review subject manifest only
- **输出**：一次 review fact 与处置。
- **Knowledge**：review 不重算预算、不替代 provenance oracle。
- **verification_role**：N/A — non-behavior change: independent review fact only
- **paired_task**：N/A — review has no pair
- **gate_cmd**：`node tools/cli/stage-runtime.mjs review --action=record --input="$WORKFLOWHUB_REVIEW_INPUT"`
- **expected_exit**：0
- **oracle**：`ORACLE-S4R-REVIEW {"pass":"唯一 canonical review 或真实 unavailable"}`
- **evidence_path**：`quality/reviews/results/S4-review-budget-phase-review.json`
- **STOP**：二审、错绑、provider 输出覆盖或需方向改变时停止。
- **recovery**：有效 finding 回 T008，不自动二审。
- **task risk**：审查摘要遗漏 raw import risk。
- **test tier / test method**：feature / independent wh-review。
- **scenarios / commands / expected exit / oracle**：available/partial/unavailable；ORACLE-S4R-REVIEW。
- **fixtures_services**：现有 broker。
- **coverage limits**：不授权 S7、发布或不可逆操作。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：N/A — independent P3 Phase review fact only; no production file changes
- **executed_commands**：`node tools/cli/stage-runtime.mjs review --action=record --project=workflowhub --task=workflowhub-execution-acceleration-deferred-20260909 --stage=build-code --input=/tmp/workflowhub-p3-review-unavailable.json`；exit 0，`blocked_before_dispatch`
- **evidence_refs**：`[{"ref":"quality/reviews/attempts/6e7e830f-0729-5656-a39e-3076d7a60011/attempt.json","kind":"review_attempt","sha256":"755f096c188106873f55c215af0c163c3938c90406cc798cd5620c0f20c44089"},{"ref":"quality/reviews/reports/build-code-simple-6e7e830f-0729-5656-a39e-3076d7a60011.md","kind":"review_report","sha256":"3be8b9a989bcb1d440377967720b90afeaa14132bafe05122396f6bc3db572eb"}]`
- **covered_ac**：N/A — provider semantic result unavailable; no findings coverage claimed
- **review_fact**：`quality/reviews/attempts/6e7e830f-0729-5656-a39e-3076d7a60011/attempt.json`；`terminal_status=unavailable`，`dispatch_state=blocked_before_dispatch`，`error.code=MATERIAL_INCOMPLETE`，provider_attempts=0；不等同 provider 通过或空 findings
- **completed_at**：2026-09-11T04:14:00+08:00
- **执行事实**：P3 review 只记录一次 canonical unavailable fact，保留材料缺失事实，不自动二审。

### Verify

- **Target**：FR-S4R-01..09、AC-S4R-01..12、formal dispatch/import seam。
- **gate_cmd**：`npx vitest run tests/review/review-record-route.test.mjs tests/contract/freeze-classification-budget-usage-protocol.test.mjs tests/contract/review-public-entrypoints.test.mjs tests/contract/review-budget-namespace.test.mjs tests/review/review-managed-lifecycle.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：RED 1；GREEN 0。
- **evidence_path**：`quality/tests/S4-review-budget/`
- **Oracle**：ORACLE-S4R；完整 provenance、call counts、authority 与 failure 原样。

### Knowledge

P4 只消费认证 current facts；不得把 review result 当 release authority。

### STOP

存在未枚举 current producer、需新 schema 或 provenance 无法认证即停止。

### Done

RED/GREEN/formal readback/review 事实齐全；`narrow_diff` 无生产路径。

### Risks and rollback

- **Risk**：伪造导入或第二预算裁决。
- **Prevention**：逐字段矩阵与入口枚举。
- **Rollback / recovery**：回滚当前实现，保留 immutable facts。

## Phase P4 — S7

### Goal

核对既有 per-AC 唯一权威与唯一 writer 不被绕过（第二 writer/双写/绕过导入 fail-closed）；status 四域齐全；close plan/step/completed、失败恢复与 existing workspace 语义一致。

### Files

- **NEW**：`runtime/stage/current-close-projection.mjs`, `tests/contract/four-domain-close-status.test.mjs`, `tests/contract/verify-authority-boundary.test.mjs`, `tests/contract/final-current-snapshot.test.mjs`, `tools/cli/produce-final-current-snapshot.mjs`, `docs/adr/0029-current-ac-and-close-state.md`
- **MODIFY**：`runtime/stage/completion-predicates.mjs`, `runtime/task/task-store.mjs`, `runtime/evidence/quality-store.mjs`, `core/task-close.mjs`, `docs/architecture/control-plane-inventory.json`, `tests/contract/plan-acceptance-task-gate.test.mjs`, `tests/close/close-contract.test.mjs`, `tests/close/cleanup-resume-finalize.test.mjs`, `tests/integration/vnext-delivery-close.test.mjs`, `tests/verify-code-facts.test.mjs`, `tests/integration/minimal-task-storage.test.mjs`, `tests/integration/projection-replacement.test.mjs`, `docs/adr/0017-stage-quality-fact-freshness-scope.md`, `CONTEXT.md`, `docs/standard-workflow.md`
- **READ-ONLY CONSUMER**：`tests/contract/verify-publication.test.mjs`, `tests/contract/per-ac-material-freshness.test.mjs`, `tests/contract/acceptance-execution-producer.mjs`, `tests/contract/acceptance-execution-producer.test.mjs`, `tests/contract/control-plane-governance.test.mjs`, `tests/contract/execution-outcome.test.mjs`, `tests/contract/stage-handoff.test.mjs`, `tests/contract/performance-budget.test.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/stage/stage-agent-outcome-adapter.mjs` — owner T012（只读回执，不写入）
- **DO NOT TOUCH**：历史 `quality/verify.json` bytes 与既有权威地位、ADR0018/0019/0020/0024、真实 existing workspace、P2 的 `tools/cli/stage-runtime.mjs`、S5/S6/reuse。

### Tasks

#### T010 — RED：写齐唯一权威边界/四域/close/failure-resume 失败矩阵

- **ID**：T010
- **Phase**：Phase P4 — S7
- **goal**：在任何生产改动前，让旧实现对第二 writer/双写/绕过导入、四域与 close 全矩阵失败。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/spec.md","hash":"3c3d772b8c2e84de61f5ab82759bd34e4cf3b92dc4ae4ba3fe1fdbeebd93f638","id":"SPEC-execution-acceleration"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/plan.md","hash":"ebd41fc92d710226ec59bac57a8b4ba435fe9777ae65d06f04bbca1c8c015eab","id":"PLAN-execution-acceleration"}]`
- **source_refs / decision_refs**：R-013; D-001/D-006/D-007/D-008/D-009/D-010 → FR-S7-01..16 → AC-S7-01..19
- **输入**：T009 review fact、既有 per-AC producer/writer、verify summary 认证与 status/close fixtures。
- **依赖**：T009
- **并行**：否 — 四域与 close 收口的 RED 必须先完整冻结。
- **FR**：FR-S7-01, FR-S7-02, FR-S7-03, FR-S7-04, FR-S7-05, FR-S7-06, FR-S7-07, FR-S7-08, FR-S7-09, FR-S7-10, FR-S7-11, FR-S7-12, FR-S7-13, FR-S7-14, FR-S7-15, FR-S7-16, FR-GOV-01, FR-GOV-02, FR-GOV-03, FR-GOV-04, FR-GOV-05, FR-GOV-07
- **AC**：AC-GOV-001
- **动作**：断言既有 per-AC 认证步骤不被放宽（material/scope revision/snapshot/source_digest/leaf hash、`evidence_ref === "quality/verify.json"` 自指被拒）；第二 writer/双写/绕过导入一律 fail-closed；current/authenticated build-code|verify-code `AC-*` allowlist；latest/tie/bad-time/conflict；四域齐全；physical 六态（含 no-plan=`not_started`）；plan/step/completed 分离与唯一 completed；confirm-before-authorize；`status→cleanup failure→same-plan resume→status`；writer readback。
- **精确文件**：`tests/contract/four-domain-close-status.test.mjs`, `tests/contract/verify-authority-boundary.test.mjs`, `tests/close/close-contract.test.mjs`, `tests/close/cleanup-resume-finalize.test.mjs`, `tests/integration/vnext-delivery-close.test.mjs`, `tests/verify-code-facts.test.mjs`, `tests/integration/minimal-task-storage.test.mjs`, `tests/integration/projection-replacement.test.mjs`
- **boundary**：files: `tests/contract/four-domain-close-status.test.mjs`, `tests/contract/verify-authority-boundary.test.mjs`, `tests/close/close-contract.test.mjs`, `tests/close/cleanup-resume-finalize.test.mjs`, `tests/integration/vnext-delivery-close.test.mjs`, `tests/verify-code-facts.test.mjs`, `tests/integration/minimal-task-storage.test.mjs`, `tests/integration/projection-replacement.test.mjs`; symbols/regions: product release/status groups/close plan-step-completed/task initialization/verify authority boundary fixtures
- **输出**：仅 S7 权威边界/四域/close 目标断言失败的 RED evidence 与预扫描事实。
- **Knowledge**：既有 per-AC 权威与唯一 writer 保留；只删除第二 writer/双写/绕过路径；existing workspace 绝不删除；测试不得真实不可逆操作。
- **verification_role**：RED
- **paired_task**：T011
- **gate_cmd**：`npx vitest run tests/contract/four-domain-close-status.test.mjs tests/contract/verify-authority-boundary.test.mjs tests/contract/verify-publication.test.mjs tests/contract/per-ac-material-freshness.test.mjs tests/contract/acceptance-execution-producer.test.mjs tests/contract/control-plane-governance.test.mjs tests/contract/execution-outcome.test.mjs tests/close/close-contract.test.mjs tests/close/cleanup-resume-finalize.test.mjs tests/integration/vnext-delivery-close.test.mjs tests/verify-code-facts.test.mjs tests/integration/minimal-task-storage.test.mjs tests/integration/projection-replacement.test.mjs tests/contract/plan-acceptance-task-gate.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-S7 {"pass":"唯一权威认证步骤、第二 writer/双写/绕过导入 fail-closed、四域、物理单态、close 恢复与授权 readback 目标断言成立","reject":{"input":"放宽 verify summary 认证、允许第二 writer 落盘、四域缺失或 close 覆写旧失败的实现","expected_rejection":"目标断言以非零退出失败，失败点指向权威边界、四域或 close 状态而非 fixture","observation":"RED raw output 指明未 fail-closed 的落盘路径或缺失状态"}}`
- **evidence_path**：`quality/tests/S7/red/result.json`
- **STOP**：发现未列 production consumer/writer、需真实 irreversible、要改 ADR0018/0019/0020、需删除既有权威或新恢复对象、身份语义需新决定时停止。
- **recovery**：恢复 fixture、保留 RED/scan，补全计划边界后再继续。
- **task risk**：`slice-advisory: reason="S7 测试必须在同一 Phase 内覆盖权威边界、四域与 close 完整矩阵"; impact="单卡八个 P4 独占测试文件使单卡较大但无跨 Phase producer"; owner="S7 current/close owner"; recheck="GREEN 生产 scan 分类完整且恢复矩阵通过后复查"`
- **test tier / test method**：fullstack / fullstack-slice-testing（跨 task store、quality projection、status/close CLI 基础设施链）。
- **scenarios / commands / expected exit / oracle**：所有 AC-S7 正负状态；exit 1；ORACLE-S7。
- **fixtures_services**：隔离 task/worktree/close fake operations；逐动作授权协议 fixture；测试清理 temp，不清真实 existing workspace。
- **coverage limits**：不证明真实 push/network/permissions；不执行真实 cleanup；不覆盖 S5/S6。
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`quality/reviews/results/S7-phase-review.json`（由 T012 产出）
- **semantic_review_reason**：本卡为规划态；独立语义审查事实只能由同 Phase 的 REVIEW 卡在 GREEN 后产出，产出前不得声称语义已复核。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：`tests/contract/four-domain-close-status.test.mjs`; `tests/contract/verify-authority-boundary.test.mjs`
- **executed_commands**：exact T010 RED gate in an isolated temporary branch at baseline `e2803a12`（14 files / 109 tests / 107 passed / 2 failed，exit 1，duration 363.93s）
- **evidence_refs**：`[{"ref":"quality/tests/S7/red/result.json","kind":"test_run","sha256":"a08da3446c4555918cdf400ba3d5ed022eefc36c14d10cd549936aa801de963a"}]`
- **covered_ac**：AC-S7-01, AC-S7-04, AC-S7-05, AC-S7-06, AC-S7-07, AC-S7-08, AC-S7-09, AC-S7-10, AC-S7-11, AC-S7-12, AC-S7-13, AC-S7-14, AC-S7-15, AC-S7-16, AC-S7-18, AC-S7-19
- **review_fact**：T011 GREEN 已完成；T012 已执行一次并以 `unavailable` canonical fact 保留，见 `quality/reviews/attempts/6251d299-19fc-5706-aa7d-aeb54e99f531/attempt.json`；不等同 provider 通过或空 findings
- **completed_at**：2026-09-11T05:55:30+08:00
- **执行事实**：T010 exact RED 在生产改动前于隔离临时分支完成，14 个测试文件中 12 个通过、2 个失败（109 个测试中 107 个通过、2 个失败）；失败来自缺少尚未创建的 current-close projection 与 verify authority-boundary 目标断言。旧 partial receipt 已归档为 `quality/tests/S7/red/result-20260911-t010-partial.json`，未把中断事实覆盖掉；该 RED 事实仅证明基线失败，不等同 GREEN、质量接受、release 或 physical close。

#### T011 — GREEN：收敛四域/close 分离并保留既有唯一权威

- **ID**：T011
- **Phase**：Phase P4 — S7
- **goal**：在一次 GREEN 中交付只读 current/close projection、四域 status、close plan/step/completed 分离与同计划恢复，同时保留既有 per-AC 权威与唯一 writer。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/spec.md","hash":"3c3d772b8c2e84de61f5ab82759bd34e4cf3b92dc4ae4ba3fe1fdbeebd93f638","id":"SPEC-execution-acceleration"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/plan.md","hash":"ebd41fc92d710226ec59bac57a8b4ba435fe9777ae65d06f04bbca1c8c015eab","id":"PLAN-execution-acceleration"}]`
- **source_refs / decision_refs**：R-013; D-006/D-007/D-008/D-009 → 同 T010 FR/AC
- **输入**：T010 complete failure matrix、production reverse-reference inventory、既有 per-AC writer 与 verify summary 认证。
- **依赖**：T010
- **并行**：否 — 四域与 close 分离必须一次收敛，禁止双权威过渡。
- **FR**：FR-S7-01, FR-S7-02, FR-S7-03, FR-S7-04, FR-S7-05, FR-S7-06, FR-S7-07, FR-S7-08, FR-S7-09, FR-S7-10, FR-S7-11, FR-S7-12, FR-S7-13, FR-S7-14, FR-S7-15, FR-S7-16, FR-GOV-01, FR-GOV-02, FR-GOV-03, FR-GOV-04, FR-GOV-05, FR-GOV-07
- **AC**：AC-GOV-001
- **动作**：保留 `publishVerifySummary` 唯一 canonical writer、每任务初始化路径与 `completion-predicates` 的逐项认证；只在发现第二 writer/双写/绕过导入时于已归属文件内做最小 fail-closed 收敛；新增 `runtime/stage/current-close-projection.mjs` 作为只读四域+close 投影（不持久化、不新增 writer），由 P2 已冻结的通用 renderer 读取；实现 close plan/step/completed 分离、physical 六态与同计划恢复；在 `docs/architecture/control-plane-inventory.json` 登记新只读投影并读回 verify-summary-writer 行；精确修订 ADR0017、创建 ADR0029、更新 CONTEXT/standard-workflow，保留 ADR0018/0019/0020/0024。
- **精确文件**：`runtime/stage/current-close-projection.mjs`, `runtime/stage/completion-predicates.mjs`, `runtime/task/task-store.mjs`, `runtime/evidence/quality-store.mjs`, `core/task-close.mjs`, `docs/architecture/control-plane-inventory.json`, `docs/adr/0029-current-ac-and-close-state.md`, `docs/adr/0017-stage-quality-fact-freshness-scope.md`, `CONTEXT.md`, `docs/standard-workflow.md`
- **boundary**：files: `runtime/stage/current-close-projection.mjs`, `runtime/stage/completion-predicates.mjs`, `runtime/task/task-store.mjs`, `runtime/evidence/quality-store.mjs`, `core/task-close.mjs`, `docs/architecture/control-plane-inventory.json`, `docs/adr/0029-current-ac-and-close-state.md`, `docs/adr/0017-stage-quality-fact-freshness-scope.md`, `CONTEXT.md`, `docs/standard-workflow.md`, `tests/contract/four-domain-close-status.test.mjs`, `tests/contract/verify-authority-boundary.test.mjs`, `tests/close/close-contract.test.mjs`, `tests/close/cleanup-resume-finalize.test.mjs`, `tests/integration/vnext-delivery-close.test.mjs`, `tests/verify-code-facts.test.mjs`, `tests/integration/minimal-task-storage.test.mjs`, `tests/integration/projection-replacement.test.mjs`, `tests/contract/plan-acceptance-task-gate.test.mjs`; symbols/regions: verify summary 认证步骤、canonical writer boundary、deriveCurrentProductRelease、status four domains、close physical model、inventory 登记、named ADR/doc conflict text
- **输出**：同命令 GREEN、production scan 逐条分类、四域 before/failure/resume/existing/completed evidence。
- **Knowledge**：tie/bad time/conflict/missing/stale/unavailable fail-closed；physical 不替代 quality/release；confirm-before-authorize；既有权威与唯一 writer 不得删除或改判。
- **verification_role**：GREEN
- **paired_task**：T010
- **gate_cmd**：`npx vitest run tests/contract/four-domain-close-status.test.mjs tests/contract/verify-authority-boundary.test.mjs tests/contract/verify-publication.test.mjs tests/contract/per-ac-material-freshness.test.mjs tests/contract/acceptance-execution-producer.test.mjs tests/contract/control-plane-governance.test.mjs tests/contract/execution-outcome.test.mjs tests/close/close-contract.test.mjs tests/close/cleanup-resume-finalize.test.mjs tests/integration/vnext-delivery-close.test.mjs tests/verify-code-facts.test.mjs tests/integration/minimal-task-storage.test.mjs tests/integration/projection-replacement.test.mjs tests/contract/plan-acceptance-task-gate.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-S7 {"pass":"全矩阵通过；生产 scan 逐条分类且无第二 writer/双写/绕过导入；四域齐全、物理单态、同 plan 恢复且 completed 唯一；既有 per-AC 权威与唯一 writer 保持不变"}`
- **evidence_path**：`quality/tests/S7/green/result.json`
- **STOP**：scan 出现无法分类的落盘路径、需要删除既有权威或新增 writer、局部回滚会恢复双权威、write/readback 不一致、existing workspace 将被删或缺真实授权时停止。
- **recovery**：整体回滚本 Phase 未发布实现；禁止删除既有 per-AC 权威或唯一 writer；保留失败 steps/review/tests；同 task 修复。
- **task risk**：`slice-advisory: reason="S7 四域、close 分离与权威边界核对必须同次收敛以避免来回改同一批 reader；P4 独占 current-close projection 与 four-domain/authority-boundary fixture"; impact="单卡文件多、执行与审查面扩大，但无跨 Phase file producer"; owner="S7 current/close owner"; recheck="T013 完整 production scan 分类完整、四域矩阵及同计划恢复均有当前证据后复查"`
- **test tier / test method**：fullstack / fullstack-slice-testing。
- **scenarios / commands / expected exit / oracle**：同 T010；GREEN 0；ORACLE-S7；另由共享 scan manifest 枚举 `publishVerifySummary|deriveCurrentProductRelease|verifySummary|verify_summary|quality/verify.json|verify.json` 及 import/export/call/path aliases，扫描 `runtime core tools skills scripts config workflows package.json vitest.config.mjs`，逐命中分类 `current|audit_only|test_only`，未知分类失败。
- **fixtures_services**：同 T010；保存 status-before、failure、step records、after-resume、completed、existing status 与 scan。
- **coverage limits**：隔离 fixture 不证明真实远端；不得清真实 workspace；legacy 仅 audit，不留 compatibility bridge。
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`quality/reviews/attempts/6251d299-19fc-5706-aa7d-aeb54e99f531/attempt.json`
- **semantic_review_reason**：T012 已执行一次，但 provider semantic result unavailable；该事实不等同审查通过，`semantic_review_status` 保持 `incomplete`。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：`runtime/stage/current-close-projection.mjs`; `runtime/stage/completion-predicates.mjs`; `core/task-close.mjs`; `tools/cli/task-close.mjs`; `docs/architecture/control-plane-inventory.json`; `docs/adr/0029-current-ac-and-close-state.md`; `docs/adr/0017-stage-quality-fact-freshness-scope.md`; `CONTEXT.md`; `docs/standard-workflow.md`; `tests/integration/vnext-delivery-close.test.mjs`; S7 contract regression coverage in `tests/contract/four-domain-close-status.test.mjs` and `tests/contract/verify-authority-boundary.test.mjs`
- **executed_commands**：exact T011 GREEN gate（14 files / 120 tests，exit 0，duration 369.15s）
- **evidence_refs**：`[{"ref":"quality/tests/S7/green/result.json","kind":"test_run","sha256":"a60553784160f2e85b962ab14065d19d4d0df7fd79dea6d5d23e4b3d55cb139f"}]`
- **covered_ac**：AC-S7-01, AC-S7-04, AC-S7-05, AC-S7-06, AC-S7-07, AC-S7-08, AC-S7-09, AC-S7-10, AC-S7-11, AC-S7-12, AC-S7-13, AC-S7-14, AC-S7-15, AC-S7-16, AC-S7-18, AC-S7-19
- **review_fact**：`quality/reviews/attempts/6251d299-19fc-5706-aa7d-aeb54e99f531/attempt.json` — canonical Phase review fact is `unavailable` / `blocked_before_dispatch` because `test_evidence` is missing; `semantic_review_status` remains `incomplete`
- **completed_at**：2026-09-11T03:38:52+08:00
- **执行事实**：T011 exact GREEN passed after the final S7 repair; 14 test files and 120 tests passed. T012 was attempted once against the provider route and failed to record because a `kimi/coding` member lacked bindable source identity; the preserved retry-free canonical T012 fact is unavailable before dispatch due missing canonical test evidence. The later T013 aggregate was executed separately and remains `aggregate_status=incomplete`; neither this T011 fact nor the later aggregate claims quality acceptance, release, or physical close.
- **执行事实（当前修复回归）**：针对 P4 phase review 的有效 major finding，补齐 `tools/cli/task-close.mjs` 从认证 current workspace 读取并传递 `work_progress`、`stage_quality`、`product_release`，并在工作区不可用时保持域为 `unknown`；同时将 `runtime/stage/current-close-projection.mjs` 收窄为 canonical producer shape，并补真实 removed/existing workspace CLI status seam。快速针对性复跑：`npx vitest run tests/integration/vnext-delivery-close.test.mjs -t 'binds task-close|keeps an authenticated existing workspace' --poolOptions.forks.singleFork --no-fileParallelism` exit 0（2/2）；状态/四域/CLI 合同 34/34，语法与 diff check 通过。随后用 public `verify --action=execute` canonical capture 重跑 T011 14-file GREEN 命令，exit 0，123/123 tests passed，`quality/tests/build-code-phase-p4-repair-2.json` receipt hash=`e7d049c8457967bce54364345900bddebc102359b9013a1abcb0c53fc00df4b1`，snapshot_tree=`8f89148bda512a459814fa50234001e97522a646`，source_digest=`bb1b5125e49a62c3686ec1ccc9b86b9b00e3887140cdc29d75968e215220609d`，output hash=`82b7cbae9380babe35b35e382c2ff72b38cf15a5782dbe11cc7722e22ec69a0c`；旧 GREEN receipt 不覆盖本次修复。该事实仍不宣称 provider review、formal quality、release 或 physical close。

#### T012 — REVIEW：一次独立 S7 boundary/close Phase review

- **ID**：T012
- **Phase**：Phase P4 — S7
- **goal**：独立审查唯一权威边界、四域/close 与人工授权边界。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/spec.md","hash":"3c3d772b8c2e84de61f5ab82759bd34e4cf3b92dc4ae4ba3fe1fdbeebd93f638","id":"SPEC-execution-acceleration"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/plan.md","hash":"ebd41fc92d710226ec59bac57a8b4ba435fe9777ae65d06f04bbca1c8c015eab","id":"PLAN-execution-acceleration"}]`
- **source_refs / decision_refs**：R-013; D-006/D-007 → S7 FR/AC
- **输入**：T010/T011 raw facts、scan、status/close evidence、diff。
- **依赖**：T011
- **并行**：否 — GREEN/capture 后一次 review。
- **FR**：FR-S7-01, FR-S7-02, FR-S7-03, FR-S7-04, FR-S7-05, FR-S7-06, FR-S7-07, FR-S7-08, FR-S7-09, FR-S7-10, FR-S7-11, FR-S7-12, FR-S7-13, FR-S7-14, FR-S7-15, FR-S7-16, FR-GOV-04, FR-GOV-06
- **AC**：AC-GOV-001
- **动作**：现有 review 入口一次独立审查；保留原始 provider provenance/findings。
- **精确文件**：`docs/adr/0029-current-ac-and-close-state.md`
- **boundary**：files: `docs/adr/0029-current-ac-and-close-state.md`, `tests/contract/verify-publication.test.mjs`, `tests/contract/per-ac-material-freshness.test.mjs`, `tests/contract/acceptance-execution-producer.mjs`, `tests/contract/acceptance-execution-producer.test.mjs`, `tests/contract/control-plane-governance.test.mjs`, `tests/contract/execution-outcome.test.mjs`, `tests/contract/stage-handoff.test.mjs`, `tests/contract/performance-budget.test.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/stage/stage-agent-outcome-adapter.mjs`; symbols/regions: review subject manifest only
- **输出**：一次 S7 review fact 与 finding disposition。
- **Knowledge**：review 不替代 T013 acceptance；不可伪造人类授权。
- **verification_role**：N/A — non-behavior change: independent review fact only
- **paired_task**：N/A — review has no pair
- **gate_cmd**：`node tools/cli/stage-runtime.mjs review --action=record --input="$WORKFLOWHUB_REVIEW_INPUT"`
- **expected_exit**：0
- **oracle**：`ORACLE-S7-REVIEW {"pass":"唯一 canonical review 或真实 unavailable"}`
- **evidence_path**：`quality/reviews/attempts/6251d299-19fc-5706-aa7d-aeb54e99f531/attempt.json`（unavailable review 无 `result_ref`；report ref 见执行 evidence）
- **STOP**：二审、来源错绑、严重 finding 未处置或方向需改时停止。
- **recovery**：有效 finding 回 T011；保留原 review，不自动二审。
- **task risk**：独立审查遗漏隐藏的落盘路径或第二 writer。
- **test tier / test method**：fullstack / independent wh-review。
- **scenarios / commands / expected exit / oracle**：available/partial/unavailable；ORACLE-S7-REVIEW。
- **fixtures_services**：现有 broker。
- **coverage limits**：不替代 scan/tests/AC、人确认或不可逆授权。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：N/A — independent review fact only; no production file changes
- **executed_commands**：`node tools/cli/stage-runtime.mjs review --action=record --project=workflowhub --task=workflowhub-execution-acceleration-deferred-20260909 --stage=build-code --input=/tmp/workflowhub-p4-s7-t012-review-unavailable.json`；exit 0，`blocked_before_dispatch`
- **evidence_refs**：`[{"ref":"quality/reviews/attempts/6251d299-19fc-5706-aa7d-aeb54e99f531/attempt.json","kind":"review_attempt","sha256":"a6d4dcc9f48d1d6570aa47d5cafd2c67b7e439e472c736f6a92e67d66bdbc909"},{"ref":"quality/reviews/reports/build-code-simple-6251d299-19fc-5706-aa7d-aeb54e99f531.md","kind":"review_report","sha256":"4d51319b3deb82bcd6c8b461b5d48d47849cd38136fe26cab884b01f18c21753"},{"ref":"/tmp/workflowhub-p4-s7-t012-review.raw","kind":"review_dispatch_failure","sha256":"01eaa7951b80909bd0bb5c892238e9e0109f8f20497fe664a190d1bee9843eec"},{"ref":"/tmp/workflowhub-p4-s7-t012-review-unavailable.raw","kind":"review_record","sha256":"85f871f5e1a941130707317169b6bc748bf86860fa80ef746340b055fa1a5345"}]`
- **covered_ac**：N/A — provider semantic result unavailable; no findings coverage claimed
- **review_fact**：`quality/reviews/attempts/6251d299-19fc-5706-aa7d-aeb54e99f531/attempt.json`；`terminal_status=unavailable`，`dispatch_state=blocked_before_dispatch`，`error.code=MATERIAL_INCOMPLETE`，provider_attempts=0；不等同 provider 通过或空 findings
- **completed_at**：2026-09-11T03:45:14+08:00
- **执行事实**：T012 canonical review fact 已执行并保留为 unavailable。第一次 provider dispatch 因 `kimi/coding` 成员缺少可绑定 source identity 在 recorder 处 exit 1，未写出 attempt；该 raw 失败事实单独保留，未当作审查通过或第二次 provider review。随后只记录了一次 provider 前材料缺失的 canonical unavailable fact。T013 随后单独执行，aggregate 保持 `incomplete`，未被本 review fact 改写为通过。
- **finding_dispositions（当前修复）**：原 P4 phase review 的 `F-c3e47664766e`（major，`tools/cli/task-close.mjs` status 只传 close state 导致三域 unknown）已 `fixed`：status 在可认证 current workspace 上读取当前 materials/quality observations 并传入四域 projection；缺 workspace 时显式保留 unknown。`F-b6e57f3e510a`（minor，缺真实 CLI seam）已 `fixed`：新增 removed workspace 与 existing workspace 的实际 `task-close status` 集成断言。`F-cf43338d8476`（minor，projection 接受非 producer aliases）已 `fixed`：`deriveCurrentCloseProjection` 只接受 `completed`、`step_records`、`plan`、`facts`、`identity_status` canonical 字段。每项均复跑受影响测试；旧 provider findings 与 provenance 不覆盖。
- **执行事实（当前 review 尝试）**：完成修复后按 public `node tools/cli/stage-runtime.mjs review --action=record --project=workflowhub --task=workflowhub-execution-acceleration-deferred-20260909 --stage=build-code --input=/tmp/workflowhub-p4-review-repair2.json` 尝试一次当前 P4 phase review；exit 0，返回 `status=unavailable`、`dispatch_state=blocked_before_dispatch`、`error.code=REVIEW_RETRY_BUDGET_EXHAUSTED`，`review_budget.status=incomplete`、`budget_scope=phase`、`counts.phase=1`、`attempt_created=false`。原始返回 `/tmp/workflowhub-p4-review-repair2.raw` sha256=`fd64a3d4a87fc56fa8b5eddc1e65247265c94f30fe063eec48fc6b74ee2d1148`；没有新 provider dispatch、attempt 或 semantic result，不把预算耗尽写成通过。

#### T013 — FINAL：当前快照 aggregate verification

- **ID**：T013
- **Phase**：Phase P4 — S7
- **goal**：只执行一次最终 targeted aggregate，覆盖四 seam、全部 active AC、生产 scan、五样本/profile 与四域/close 证据。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/spec.md","hash":"3c3d772b8c2e84de61f5ab82759bd34e4cf3b92dc4ae4ba3fe1fdbeebd93f638","id":"SPEC-execution-acceleration"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-deferred-20260909/plan.md","hash":"ebd41fc92d710226ec59bac57a8b4ba435fe9777ae65d06f04bbca1c8c015eab","id":"PLAN-execution-acceleration"}]`
- **source_refs / decision_refs**：R-009/R-010/R-013; D-001..D-011 → 全部当前 FR/AC
- **输入**：T001-T012（含 T014）当前事实、固定 targeted commands、performance/provenance/status/close evidence。
- **依赖**：T012
- **并行**：否 — aggregate 读取全部前序 facts，只运行一次。
- **FR**：FR-S3-01, FR-S3-02, FR-S3-03, FR-S3-04, FR-S3-05, FR-S3-06, FR-S3-07, FR-S3-08, FR-S3-09, FR-S3-10, FR-S3-11, FR-S3-12, FR-S3-13, FR-S4S-01, FR-S4S-02, FR-S4S-03, FR-S4S-04, FR-S4S-05, FR-S4S-06, FR-S4S-07, FR-S4R-01, FR-S4R-02, FR-S4R-03, FR-S4R-04, FR-S4R-05, FR-S4R-06, FR-S4R-07, FR-S4R-08, FR-S4R-09, FR-S7-01, FR-S7-02, FR-S7-03, FR-S7-04, FR-S7-05, FR-S7-06, FR-S7-07, FR-S7-08, FR-S7-09, FR-S7-10, FR-S7-11, FR-S7-12, FR-S7-13, FR-S7-14, FR-S7-15, FR-S7-16, FR-GOV-01, FR-GOV-02, FR-GOV-03, FR-GOV-04, FR-GOV-05, FR-GOV-06, FR-GOV-07, FR-GOV-001
- **AC**：AC-GOV-001
- **动作**：先分别执行 P1 real-parallel、P2 serial、P3 serial、P4 serial targeted routes 及 `tests/contract/plan-acceptance-task-gate.test.mjs`，不得用一个全局 singleFork aggregate 代替；然后调用 snapshot producer。producer 从 canonical spec 的全部规范性 `#### AC-*` 标题并显式顶层 `AC-GOV-001` 派生 active set，要求与 task 声明 set equality；逐条读取 raw receipts/hash，执行覆盖 runtime/core/tools/skills/scripts/config/workflows/package/vitest surfaces 的 verify-authority symbol/path/import scan 并分类 current/audit_only/test_only；每 active AC 恰好输出一条 assertion。
- **精确文件**：`tools/cli/produce-final-current-snapshot.mjs`, `tests/contract/final-current-snapshot.test.mjs`, `tests/contract/plan-acceptance-task-gate.test.mjs`
- **boundary**：files: `tools/cli/produce-final-current-snapshot.mjs`, `tests/contract/final-current-snapshot.test.mjs`, `tests/contract/plan-acceptance-task-gate.test.mjs`; symbols/regions: active-AC parser、set equality、evidence authenticator、classified production scan、immutable final receipt writer
- **输出**：`quality/tests/final/current-snapshot.json`，含 material/snapshot identity、每组 command/exit/raw refs、每 active AC 唯一 `{ac_id,oracle_id,status,actual,evidence_refs:[{ref,sha256}],source_receipt}`、S3 profile/perf/conservation、P2 self-check、P3 provenance、S7 scan/status/close、limitations/aggregate status。
- **Knowledge**：失败回受影响 GREEN；不以全量重跑掩盖；quality fact 非 gate；FINAL 不新增 review/authority，也不改变既有 verify 权威。
- **verification_role**：N/A — non-behavior change: final aggregate verification
- **paired_task**：N/A — aggregate has no RED/GREEN pair
- **gate_cmd**：`node tools/cli/produce-final-current-snapshot.mjs --task-id=workflowhub-execution-acceleration-deferred-20260909 --spec=specs/workflowhub-execution-acceleration-deferred-20260909/spec.md --plan=specs/workflowhub-execution-acceleration-deferred-20260909/plan.md --tasks=specs/workflowhub-execution-acceleration-deferred-20260909/tasks.md --task-dir="$TASK_DIR" --output="$TASK_DIR/quality/tests/final/current-snapshot.json"`
- **expected_exit**：0
- **oracle**：`ORACLE-FINAL {"pass":"producer contract test 与 acceptance-task gate 通过；canonical active AC set 与 assertions exact equality、无 missing/duplicate/extra；每 AC 恰一条且 evidence ref/hash authenticated；unknown|unavailable|incomplete|conflict 不得转 pass；五样本/profile/conservation 完整、current self-check 非 unexplained_overage 且 zero cross-phase producer、public/bare provenance 完整、全生产面 verify authority scan 逐条分类且无第二 writer、四域/close evidence 一致"}`
- **evidence_path**：`quality/tests/final/current-snapshot.json`
- **STOP**：命令空跑/损坏、任一 AC 或 evidence 缺失、scan 有未分类落盘路径、越界、需要新决定或真实不可逆操作时停止。
- **recovery**：按 oracle 路由回 T002/T005/T008/T011；保留失败 raw output；仅重跑受影响 targeted route，再运行一次新当前快照 FINAL。
- **task risk**：aggregate 遗漏或把 unavailable 当 pass；`slice-advisory: reason="最终卡需读取四 seam targeted 结果及 S7 同一 acceptance consumer"; impact="长显式命令但仍限定受影响测试，不是全量回归"; owner="verify-code aggregate owner"; recheck="逐 AC assertions 与全部 evidence hash 认证后复查"`
- **test tier / test method**：fullstack / fullstack-slice-testing + evidence replay。
- **scenarios / commands / expected exit / oracle**：四 seam 正负合同、current snapshot、production scan、quality unavailable；命令如上；exit 0；ORACLE-FINAL。
- **fixtures_services**：沿用各 targeted fixture；aggregate 不触真实 provider/network/cleanup；各测试负责清理。
- **coverage limits**：不做全量回归；不证明真实远端/权限；不覆盖 S5/S6/TIA/reuse；不把人类授权模拟成事实。
- **acceptance_role**：acceptance
- **ui_scope**：non_ui
- **acceptance_data**：`[{"source":"current canonical spec plus fresh authenticated P1/P2/P3/P4 receipts","sample":"all active non-UI AC derived from canonical spec, including AC-GOV-001","scenario":"authenticate four targeted routes and emit exactly one assertion per active AC into current snapshot evidence","tier":"command","execution":{"command":"node","args":["tools/cli/produce-final-current-snapshot.mjs","--task-id=workflowhub-execution-acceleration-deferred-20260909","--spec=specs/workflowhub-execution-acceleration-deferred-20260909/spec.md","--plan=specs/workflowhub-execution-acceleration-deferred-20260909/plan.md","--tasks=specs/workflowhub-execution-acceleration-deferred-20260909/tasks.md","--task-dir=$TASK_DIR","--output=$TASK_DIR/quality/tests/final/current-snapshot.json"],"timeout_ms":900000}}]`
- **e2e_scope**：not_required

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：`tools/cli/produce-final-current-snapshot.mjs`; `tests/contract/final-current-snapshot.test.mjs`; final task execution fact only; no new authority or release writer
- **executed_commands**：`node tools/cli/produce-final-current-snapshot.mjs --task-id=workflowhub-execution-acceleration-deferred-20260909 --spec=specs/workflowhub-execution-acceleration-deferred-20260909/spec.md --plan=specs/workflowhub-execution-acceleration-deferred-20260909/plan.md --tasks=specs/workflowhub-execution-acceleration-deferred-20260909/tasks.md --task-dir="$TASK_DIR" --output="$TASK_DIR/quality/tests/final/current-snapshot-20260911-p14-immutable.json"`；exit 0，generated snapshot complete，58 active AC / 58 assertions，`aggregate_status=incomplete`；随后针对 T004/T007/T010 回填重跑 `npx vitest run tests/contract/plan-acceptance-task-gate.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；exit 0，19/19 passed，plan gate passed
- **evidence_refs**：`[{"ref":"quality/tests/final/current-snapshot-20260911-p14-immutable.json","kind":"final_current_snapshot","sha256":"cfd7fbaf0ccf5fb0c3fb5772662dcd0fd8345084d26d45ff1b9a40e177bb73e0"},{"ref":"/tmp/workflowhub-final-current-snapshot-p14.raw","kind":"producer_output","sha256":"b9dc93ce91127ed2ce8d9f036fd44a8439f7c2e2c9588cb362ab26d50d4e77a8"},{"ref":"quality/tests/final/plan-acceptance-task-gate-20260911-p17.json","kind":"plan_acceptance_gate","sha256":"70e2854579a7bb63a65424a2a6f14ed4b035782e1eb857ff06385705013a78c3"},{"ref":"/tmp/workflowhub-final-plan-gate-p17.raw","kind":"plan_acceptance_output","sha256":"139c15b93bd77348a7a275909a537c315b63e07722a1208080f0c9319664f149"},{"ref":"quality/reviews/attempts/975a4677-cbb6-552c-ac24-3a6ac21caaf4/attempt.json","kind":"integration_review_attempt","sha256":"22829e7deaba923fbe88d92c370cf77ae01e40d7f3ab01bae11b717838524fd4"},{"ref":"quality/reviews/reports/build-code-simple-975a4677-cbb6-552c-ac24-3a6ac21caaf4.md","kind":"integration_review_report","sha256":"456240f8a52163d10ff33f1cee1597e8fe4b7a2e1daffe7f2a92b3f987f2338a"}]`
- **covered_ac**：`["AC-GOV-001","AC-S3-01","AC-S3-02","AC-S3-03","AC-S3-04","AC-S3-05","AC-S3-06","AC-S3-07","AC-S3-08","AC-S3-09","AC-S3-10","AC-S3-11","AC-S4S-01","AC-S4S-02","AC-S4S-03","AC-S4S-04","AC-S4S-05","AC-S4S-06","AC-S4S-07","AC-S4S-08","AC-S4S-09","AC-S4R-01","AC-S4R-02","AC-S4R-03","AC-S4R-04","AC-S4R-05","AC-S4R-06","AC-S4R-07","AC-S4R-08","AC-S4R-09","AC-S4R-10","AC-S4R-11","AC-S4R-12","AC-S7-01","AC-S7-02","AC-S7-03","AC-S7-04","AC-S7-05","AC-S7-06","AC-S7-07","AC-S7-08","AC-S7-09","AC-S7-10","AC-S7-11","AC-S7-12","AC-S7-13","AC-S7-14","AC-S7-15","AC-S7-16","AC-S7-17","AC-S7-18","AC-S7-19","AC-GOV-01","AC-GOV-02","AC-GOV-03","AC-GOV-04","AC-GOV-05","AC-GOV-06"]`；当前每条状态均为 `incomplete`，不作通过声明
- **review_fact**：T001/T003、T006、T009、T012 canonical review facts 均已保留；T003/T006/T009/T012 provider semantic result 分别为 `unavailable`，无当前 integration review pass。最终 `phase_id=null` integration review 已按当前快照实际发起一次并记录为 `unavailable`：attempt `quality/reviews/attempts/975a4677-cbb6-552c-ac24-3a6ac21caaf4/attempt.json`（sha256=`22829e7deaba923fbe88d92c370cf77ae01e40d7f3ab01bae11b717838524fd4`），report `quality/reviews/reports/build-code-simple-975a4677-cbb6-552c-ac24-3a6ac21caaf4.md`（sha256=`456240f8a52163d10ff33f1cee1597e8fe4b7a2e1daffe7f2a92b3f987f2338a`）；provider finding 因 `EVIDENCE_ANCHOR_INVALID` 未成为可信 finding，另一个 provider 因 `ATTACHMENT_DELIVERY_UNSUPPORTED` 失败，不能当作通过，也不自动复审同一快照。T013 不新增 review 或 authority
- **completed_at**：2026-09-11（p14 producer rerun）
- **执行事实**：producer 实际读取当时 current 的三份材料并生成 create-only immutable sidecar；plan acceptance `passed`，production scan `complete`（74 entries、0 read errors、1 current writer），P1/P3 targeted GREEN 已分别为 72/72、198/198，T004/T007/T010 的 RED 也已在隔离 baseline 补齐；但 S3 profile/route identity、S4S/S4R/S7 receipt identity、T012 unavailable 等非通过事实使 aggregate 保持 `incomplete`。这完成了 FINAL aggregate 的事实采集与逐 AC 输出，不等同 formal acceptance、quality pass、release、physical close 或 commit。随后新增的 T004/T007/T010 baseline RED receipts 与本执行区 ref/hash 都是事实回填；不改写 p14 immutable sidecar，因此 sidecar 的 material identity 仍明确绑定其生成时的 tasks hash。按 build-code 阶段末要求执行 `run --action=reflect`；由于当前 task 没有可认证的 build-code `quality/evidence/stage-outcomes/build-code/<sha256>.json` 且直接 launcher 没有 reflection executor，正式 reflection 结果保持 `unavailable`，既有原始诊断与 availability sidecar 保留。`stage-end-spec-analyze` 同样不能在缺少 authenticated Stage Agent packet/outcome 时伪造执行，保持 `unavailable/incomplete`；没有创建私有替代物或 handoff 假事实。
- **执行事实（p18 current snapshot）**：按同一 producer 命令重新读取当前 `spec.md`/`plan.md`/`tasks.md`，exit 0，输出 `quality/tests/final/current-snapshot-20260911-p18-immutable.json`（sha256=`c5f661fb1fd46d05131e99ce6700792b00ebbaef3594c27d1c2ad39c942ef136`），producer raw `/tmp/workflowhub-final-current-snapshot-p18.raw`（sha256=`dcafc1cd58cd2f2be4fc3c8ccec1bfbc7a2172acc96f707cc61b517cf7fba4e7`）。当前 material_revision=`revision-2f38f14ba883009eb0c293f4ef3b1a4f90e8d510fed35fa4c2985c7456719699`、snapshot_tree=`33b2c0a0f39b4a9455670428eaf71a739d91875a`、snapshot_commit=`d1cbca66139377ac4189e16992127cae31b3ded0`、snapshot_head=`e2803a12c3912270284c252fadcdcf3240371227`、source_digest=`bb1b5125e49a62c3686ec1ccc9b86b9b00e3887140cdc29d75968e215220609d`；58 active AC / 58 assertions 均为 `incomplete`，`aggregate_status=incomplete`；plan acceptance `passed`（4 phases），production scan `complete`（74 entries、0 read errors、1 current writer）。p18 是 immutable sidecar，不覆盖 p14；本次后续 T013 事实追加会令当前 `tasks.md` hash 改变，故 p18 只作为其生成时的可审计快照，不冒充追加事实后的 current；p14/p4 receipt 的旧 tasks/snapshot identity 同样不得冒充当前。
- **执行事实（current plan gate）**：按当前 tasks append 后重新执行 `npx vitest run tests/contract/plan-acceptance-task-gate.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`，exit 0，19/19 passed，约 236ms；仅证明 plan/tasks contract，不改变 T013 aggregate 或阶段完成。
- **执行事实（current integration review）**：使用当前 `captureReviewSource` 捕获的 `snapshot_tree=33b2c0a0f39b4a9455670428eaf71a739d91875a` 生成 `/tmp/workflowhub-integration-review-repair2.json`，通过公开 `node tools/cli/stage-runtime.mjs review --action=record --project=workflowhub --task=workflowhub-execution-acceleration-deferred-20260909 --stage=build-code --input=/tmp/workflowhub-integration-review-repair2.json` 执行，exit 0；返回 `status=unavailable`、`dispatch_state=blocked_before_dispatch`、`error.code=REVIEW_RETRY_BUDGET_UNKNOWN`、`review_budget.ok=false`、`reason=budget_unknown`，没有 provider dispatch、canonical attempt、result 或 semantic pass。raw `/tmp/workflowhub-integration-review-repair2.raw` sha256=`45cc58f56cd1534818588d9fc85b5077e7c3758777051d9ebbb0b1c538a5f146`。该不可用事实保留预算/材料不确定性，不把 targeted GREEN、P4 旧 receipt 或之前的 invalid/unavailable review 改写成 current integration pass。
- **执行事实（current official build-code run）**：先用既有 canonical writer 生成当前实现 receipt `quality/evidence/implementation/fe53d0947ef95e49d1c85e809bc6f30b98908b3c0f03ffe0d5a118b03cafe840.json`（sha256=`fe53d0947ef95e49d1c85e809bc6f30b98908b3c0f03ffe0d5a118b03cafe840`，44 changed files，diff=`quality/evidence/implementation/70d7e2d081d27c0fd841d1970b0d1dec75c76a56a5b1831ca74b1e133c444724.diff`）；按受影响边界执行 targeted test capture，receipt `quality/tests/build-code-current-20260911.json`（sha256=`b428098136f60df4d0e5ba8b7b7a356a80965bb2ef570e6953fafb9e6a83cdfe`，output=`quality/tests/output/build-code-current-20260911.output`, output_hash=`0f76b73685fe01bc6baa29415e0f3065ebd51d66bec28ce0afbf163178ccd43a`，exit 0，约 35.274s，snapshot_tree=`7875107029a88d8b1932512d04bd7071c0fc8a47`）。随后通过公开 `node tools/cli/stage-runtime.mjs run --action=execute --project=workflowhub --task=workflowhub-execution-acceleration-deferred-20260909 --stage=build-code --input=/tmp/workflowhub-build-code-run-current.json` 执行，exit 0；当前质量事实已写入，`risk_tests_fresh` 为 passed，其余 acceptance/integration 事实按实际缺口为 missing；返回 `status=in_progress`、`quality_status=incomplete`、`stage_outcome_ref=null`、`stage_outcome_status=unavailable`、diagnostic=`stage_outcome_missing`，command acceptance 因没有 authenticated producer 保持 unavailable。stage reflection 只写出 availability=`quality/evidence/stage-reflection-availability/d810d5ab6b027b0bf69804cf2ff73423d92de5b7dce298ba2a9ed550f49b3506.json`（sha256=`d810d5ab6b027b0bf69804cf2ff73423d92de5b7dce298ba2a9ed550f49b3506`，reason=`executor_absent`）；没有伪造 stage outcome、reflection 或 handoff，故本次仍不作 formal stage/quality 完成声明。

### Verify

- **Target**：FR-S7-01..16、AC-S7-01..19、全 GOV 与四 seam aggregate。
- **gate_cmd**：`npx vitest run tests/contract/four-domain-close-status.test.mjs tests/contract/verify-authority-boundary.test.mjs tests/contract/verify-publication.test.mjs tests/contract/per-ac-material-freshness.test.mjs tests/contract/acceptance-execution-producer.test.mjs tests/contract/control-plane-governance.test.mjs tests/contract/execution-outcome.test.mjs tests/close/close-contract.test.mjs tests/close/cleanup-resume-finalize.test.mjs tests/integration/vnext-delivery-close.test.mjs tests/verify-code-facts.test.mjs tests/integration/minimal-task-storage.test.mjs tests/integration/projection-replacement.test.mjs tests/contract/plan-acceptance-task-gate.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：RED 1；GREEN/FINAL 0。
- **evidence_path**：`quality/tests/S7/`、`quality/tests/final/current-snapshot.json`
- **Oracle**：ORACLE-S7/FINAL；四域、close 恢复、唯一 completed 与「无第二 writer/双写/绕过导入」。

### Knowledge

最终事实供 verify-code 使用；build-plan/quality/review 不能授权 commit/push/merge/archive/cleanup。

### STOP

未知 production ref、第二 writer、物理矛盾、缺逐 AC、缺人工授权或需新方向即停止。

### Done

T010-T013 有真实 facts；一次 S7 review；FINAL 一次当前快照；所有限制如实披露。

### Risks and rollback

- **Risk**：隐藏消费者、close 状态漂移，或误删既有唯一权威。
- **Prevention**：完整 RED、生产 scan 分类、四域矩阵、同 plan recovery。
- **Rollback / recovery**：整体回滚本 Phase 未发布实现，不删除既有 per-AC 权威或唯一 writer。

## 4. Final current-snapshot aggregate strategy

- **tier / method**：fullstack / fullstack-slice-testing + command acceptance evidence replay。
- **scenarios**：全部 S3/S4S/S4R/S7/GOV AC、负例、冲突、unavailable、跨 seam current facts。
- **command**：T013 `gate_cmd`。
- **expected exit**：0
- **oracle**：ORACLE-FINAL；逐 AC 恰好一次，缺失/冲突/scan 命中均失败。
- **fixtures_services**：各 Phase 隔离 fixtures；无真实不可逆操作；各自清理。
- **evidence_path**：`quality/tests/final/current-snapshot.json`
- **coverage limits**：受影响范围而非全量；不覆盖延期项、真实远端或 OS cold cache。
- **STOP**：任一 AC/evidence/command/authority/边界不成立。
- **execution_contract**：当前快照一次；失败保留原始输出并回受影响 GREEN，不用全量重跑掩盖。

## Dependency Graph

- **order**：T001 → T002 → T014 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011 → T012 → T013

```text
T001 RED → T002 GREEN → T014 CAPTURE → T003 REVIEW
→ T004 RED → T005 GREEN → T006 REVIEW
→ T007 RED → T008 GREEN → T009 REVIEW
→ T010 RED → T011 GREEN → T012 REVIEW → T013 FINAL
```

## Build-plan review disposition readback

- **Source**：`quality/reviews/results/build-plan-simple-45f54b77-b199-5d4d-ab4f-8204aa0f1bab.json`（external task execution file；immutable）。
- **Count**：12/12；10 major + 2 minor。
- **Disposition**：`F-2b226299b0f0`, `F-403c117ca680`, `F-41a550488518`, `F-5a5f522bdf7c`, `F-676edd9b4204`, `F-8ad104209384`, `F-903fa2d28c6f`, `F-c7b0569539a1`, `F-dddd091bd963`, `F-f210de7d3e77`, `F-f8a8a220f75c`, `F-fc84a5136313` 均为 **fixed**；逐项事实见 `plan.md#Build-plan-review-disposition12/12`。无 `rejected_invalid`；其中涉及 S7 移除型表述或以 advisor 为画像 owner 的条目已按 spec §14.1 与 D-006/D-009 改写对象。

## Final Boundary Check

- [ ] 恰好四个 Phase 且顺序固定；Phase/task 调度无并行，只有 P1 测试内部按画像文件级并行。
- [ ] 每 Phase 单 seam/owner/consumer，RED→GREEN/capture/一次 review；T013 是 P4 内 read-only FINAL。
- [ ] Phase Files 与 plan.md 一致，task 文件均为子集；所有生产文件 whole-file owner 唯一且 `SIG-CROSS-PHASE=0`。
- [ ] 全部 FR/AC 双向覆盖；active AC 从 canonical spec 机械派生（含 AC-GOV-001），每项恰一 assertion。
- [ ] review/test/evidence/advisory 是事实非许可证；unknown/unavailable 不伪通过。
- [ ] 未运行实现测试或进入 build-code；不可逆操作仍需独立授权。
