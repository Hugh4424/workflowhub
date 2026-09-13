# plan · workflowhub-mechanism-simplification-t2-20260911

- **Template version**：plan-task.v3

## Quick Read

- **做什么**：把 spec v4 落成可执行实施计划：C9 测试执行面（档位常量值改名 inner/phase/aggregate、test:profile 入口、preflight、receipt 复用）→ C4 审查生命周期（五维身份去重、删预算、review_origin 五态、跨仓健康判死、stalled 映射、T-11 请求身份、通道修复）→ C5 按具名 B/D freshness use-site 做行为闭合，同时正向保护 A/K5 身份与证据绑定、完成写口三项/声明面/CONTEXT delta → C6 收口状态并完成 Tier-C schema/consumer/distribution/registry/clean-install 删除证明 → 任务级守卫基线与三条总账复算。
- **批次纪律**：每批评判不过即停在该批；只跑本批受影响针对性测试；守卫基线由 T0 在当前实现输入 `35a6fb6f` 重测并从 task-store artifact 读回，旧 612/35、10、2 仅为历史；Task I 已于 `9f9d0c44` 合入且 `35a6fb6f` 归档，前置已满足；C5 先合、C6 后合；跨仓动 3rd-review 前必须完成人工确认点（AC-C4-026）。
- **Non-goals**：不新增第五份材料 / public command / 持久化对象 / 状态机；不改 npm test / test:safe / test:exclusive 语义；不做兼容桥、双写、历史字节改写；不跑无范围全量回归（唯一例外 = PRD C4 卡第 3 条批准的 npm run check，写明理由与范围）；不替 3rd-review 仓之外的宿主行为造机制（来源：decision-log §10 明确不做、§16.21 OI-25、PRD 卡 §17 纪律、AGENTS.md 测试硬规则）。
- **怎么用这份计划**：Phase 1-4 对应四批；每个任务的 gate_cmd/expected_exit/oracle/evidence_path 是 build-code 的取证口径；STOP 列是批内停止条件；Rollback and Recovery 的 Engineering Risk Handoff 是不可逆动作的移交清单。

## Technical Context

### Global Constraints

- 四份当前材料是唯一工作真相；本计划只细化 decision-log.md + spec.md，不重新发明需求（decision-log §2 / spec §12）。
- 同文件串行（decision-log §10）：C9 先于 C6 改 stage-runtime；C4 先于 C5 改 review-materials/review-record-route、先于 C6 改 stage-handlers；Task I C3 substrate 已合入，T2 对 task-handle/task-store 只做有界 delta；C5 先于 C6 改 stage-runtime 与 completion-predicates；C6 先于 C7 合 close 主文件。
- 守卫基线：T0 在 `35a6fb6f` 运行 markdownlint、check-task-record-paths、verify-structure，把 raw output/exit/count 写入 `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t0-current-baseline.json`；后续读取变量比较，不硬编码旧 612/35、10、2 或 PRD 554。
- 测试纪律：只跑受影响针对性测试；例外命令必须在执行证据写明理由与范围（AGENTS.md / docs/standard-workflow.md L310）。
- 跨仓：3rd-review 仓（/Users/Hugh/Hugh/Project/3rd-review）的任何写入前必须完成人工确认点（工作树快照比对协议见 AC-C4-026）；被拒则只交本仓消费侧。
- 零延期、零新增控制面；review_origin 按裁定 G 以 K2 行字段落地（字段 ≠ 对象）。

### 运行时与工具基线

- node >= 24；git；vitest（node_modules/.bin/vitest）；3rd-review 仓 node --test。
- HEAD 已含部分前置修复（考古实测）：DEFAULT_MANAGED_TERMINAL_WAIT_MS=1_200_000（simple-review-runner.mjs:37）、review-result.mjs:151-152 已有 stalled 映射、wh-review-cli.mjs:234 已接受 available-with-failures（本任务 A2 修复）；attempt.schema.json:193 group_outcome 枚举仍无 stalled。
- Task I（C0–C3）已由 `9f9d0c44` 合入，材料由 `35a6fb6f` 归档，硬前置已满足。K2 frozen discriminator 为 `record_kind`；用户接受，不改名、不迁移、不兼容、不回填。Task I quality truth 保持 incomplete/unavailable/not_run。

## Code Anchors

- C9：runtime/stage/stage-content-contracts.mjs:57-62（TEST_RUNTIME_PROFILE_NAMES/LIMITS_MS 冻结常量，现值 inner/medium/large）；tools/cli/run-checks.mjs:89-179（parseProfileArgs/profileForExecutor/runProfiledCommand，:115-117 large 兜底 900_000 注释、:140 CI=true 硬要求）；runtime/evidence/canonical-receipt-writer.mjs:299/:340/:776/:730（reusableTestCapture + command_hash）；tools/cli/stage-runtime.mjs:594-597（runPreflight 空实现，调用点 :681）；tools/cli/measure-test-runtime-profile.mjs:217（只接受 inner/medium）；tests/contract/test-runtime-profile.test.mjs:77/:130/:217-222 与 tests/contract/runtime-profile-consumer-readback.test.mjs:88（旧档位名断言）；C9 慢测试 7 文件 = tests/integration/vnext-official-stage-run.test.mjs、tests/e2e/vnext-five-stage-current.test.mjs、tests/integration/vnext-delivery-close.test.mjs、tests/contract/decision-convergence-depth.test.mjs、tests/contract/requirement-convergence-regression.test.mjs、tests/contract/stage-completion.test.mjs、tests/contract/test-runtime-profile.test.mjs。
- C4：runtime/review/review-record-route.mjs:357-378（findReusableReview，去重键 :360-365，reused :900）；runtime/evidence/stage-content-evidence.mjs:312-399（validateReviewBudget，消费点 review-record-route.mjs:896 + stage-handlers.mjs:2338）；runtime/task/material-workspace.mjs:155（buildStageInputPacket，无 skills lens）；review-record-route.mjs:462-484/:1020-1022 与 canonical-review-result.mjs:225/:231（minimum_heterologous）；third-review-host-config.mjs:642-647（sameSourceProfile 现状 = provider===hostProvider 字符串相等，使用点 :695-696）；simple-review-runner.mjs:37/:448-472（DEFAULT_MANAGED_TERMINAL_WAIT_MS/waitForManagedTerminal，注释明确不 cancelManaged）；review-provider-client.mjs:122（managedOutcomes 已含 stalled）；runtime/review/schemas/attempt.schema.json:193（group_outcome 枚举无 stalled）；stage-materials.json:7-52/:58-152、review-materials.mjs:355/:372/:786/:1950、simple-review-runner.mjs:646/:661（四套形似允许名单，MATERIAL_FORBIDDEN）；stage-runtime.mjs:914-922/:1053-1065 与 task-kernel-implementation.mjs:1110/:1138-1139（review_result_ref 现有读点，verify-code 执行端零命中，落点待建 stage-handlers.mjs 集合点）；simple-review-runner.mjs:102/:1001（managedRequestId stableValue 输入，无协议版本）；simple-review-runner.mjs:1254-1279（配对聚合面无 dispatch_state，仅 role_results.red/blue）。
- C5：OI-26 以 consumer/use-site 分类而非旧字面计数为权威。K2 frozen fields 在 `runtime/task/task-store.mjs`，K5 proof bindings 分布于 evidence validators/stage runner，均属 A 类保留；`runtime/evidence/freshness.mjs` 与 `runtime/stage/completion-predicates.mjs` 的 currentness 比较及调用点属 B 类删除；测试/变体 snapshot 属 C 类且不得决定 current status。Task I-retired current-material validation CLI 已由 Task I 删除；其 former output `quality/evidence/S4-slicing/current-tasks-self-check.json` 仍被 `tools/cli/produce-final-current-snapshot.mjs` 消费，T2 必须收掉该 consumer/fixture，不得重建 CLI。CONTEXT 用 semantic lookup，不绑定旧行号。
- C6：quality/verify object 的 exact active closure 由 Phase 4 Files 明列：production writer/reader/import、current-close projection、两个 architecture diagnostics、current-snapshot diagnostic、Runner distribution、architecture registries、active governance docs、具名 contract/integration/e2e tests，以及唯一 golden fixture。每项 owner=T54/T55，按 structured closure/readback 处置；不得用“affected tests/fixtures”开放集合。`runtime/distribution/runner-release.mjs` 当前以全 `runtime/schemas/*.json` glob 发布该 schema；`docs/architecture/repository-inventory.tsv` 当前登记 KEEP，而 move-map/deletion-plan 尚无本项。Tier-C 删除必须同时改显式 distribution closure、registries/inventory/control-plane active docs 和 clean-install tests，归档 refs 不改。Close 已有 `LEGACY_DELIVERY_STEPS` / `UNARCHIVED_PLANNING_STEPS` / `POST_CLEANUP_ARCHIVE_STEPS` 与 `recordCloseActionRow`，D-015 stage-row publication 已有测试；都只作 regression。`stage-outcome-proofs` 保留 K5 readback，但 K2 是 current status authority。

## Solution Design

### C9 执行面（Phase 1）

档位常量值一次性改名：`TEST_RUNTIME_PROFILE_NAMES` 由 `[inner,medium,large]` 改为 `[inner,phase,aggregate]`（stage-content-contracts.mjs:57），`TEST_RUNTIME_PROFILE_LIMITS_MS` 键同步（:58-62，aggregate 上限保持 null）；权限语义 medium→phase（local_ci）、large→aggregate（ci_only）全量跟随（:152/:161/:184-186 与错误文案）；ADR 0027 档位表述同批改写（C9 执行、C7 复核 HANDOFF-T2-001）；旧名零残留 grep 覆盖常量、权限、错误文案、ADR、两个 profile 测试断言（AC-C9-001）。

`run-checks.mjs` 接线：profileForExecutor 的 aggregate 分支 ceiling 语义改写为「契约上限 null + supervisor 兜底 900_000 单列注释」（:109-134），CI=true 硬要求保留（:140）；新增 npm script 入口 `test:profile`（package.json，调 run-checks phase 档；aggregate 仍走 CI 直调）；7 文件命令表 = inner：单文件/分钟级命令组、phase：7 文件拆 ≥2 个命令每组 ≤5 分钟、aggregate：每任务一次（含 vnext-official-stage-run 单独成组，消除同命令启动）；总启动次数不增（AC-C9-002/004）。

receipt 复用与超时保留：canonical-receipt-writer.mjs reusableTestCapture 读取分支增强——超时/中断后已完成部分 receipt.output_ref 可读回（AC-C9-007）；同 command 第二次 capture-tests 回读既有 receipt 不启子进程（现状 :299/:340 已具备，补针对性测试 tests/contract/test-capture-reuse.test.mjs 取证 AC-C9-006）。

preflight：通过 public `stageRuntimeMain(argv = process.argv.slice(2), { services = {}, cwd = process.cwd() } = {})` 注入 services，覆盖命令/路径、provider/host 能力与 packet 体积预算；返回 status:"protocol_invalid" + 非空 diagnostics，≤5 秒；失败不启子进程、不做门禁、可原地重试。不得测试私有 `runPreflight` 或 fallback（AC-C9-008/009）。

C9 开工第 0 步评估 measure-test-runtime-profile.mjs（:217 只接受 inner/medium）可否复用：能复用则接线（改名后接受 phase），不能复用则登记已知重复进 HANDOFF-T2-004（AC-C9-011）。

### C4 审查生命周期（Phase 2）

主仓消费侧（C4 批内完成）：

- canonical dedup identity 固定为五维 `(stage, phase_id, track, review_kind, origin)`；只有五维身份匹配后，才读取既有 `review_result_ref` 作为 readback/reuse target。`review_result_ref` 不是 dedup key；「大改动」判定人 = 主会话（口径 = 跨接口/schema/安全边界/公共契约，误判处置 = 记录并回每 Phase 一次基线）（FR-C4-001）。
- K2 substrate regression + C4 delta：Task I 已冻结 `record_kind`、`review_origin` 五值与 `review_result_ref`，不再创建字段。C4 将真实 review facts 合并/传播到同一 stage 行、避免 stage-end replacement 擦除它们，并让 status/verify 消费；随后删 `validateReviewBudget` 及 `review-record-route.mjs`、`stage-handlers.mjs` 的 imports/callers（FR-C4-002）。
- 复审触发收紧：小修不复审、每 Phase 恰好一次核心审查、focus 复审一次性组装不落盘且恰五项（FR-C4-003/014）。
- dispatch_state 提升到配对聚合面（simple-review-runner.mjs:1254-1279 顶层补字段）（FR-C4-004）。
- packet 组装补 skills/ lens（detail track 必然含 simplicity-guard/plan-ceo-review/review 三 SKILL.md，FR-C4-005）。
- 异源判定按底层模型：sameSourceProfile 比较键改 broker identity.source_id 落到 identity.model（third-review-host-config.mjs:642-647/:695-696，FR-C4-006）。
- review_origin 五态：Task I 的五值枚举/validation 是 regression-only；本批剩余实现仅为真实 facts 传播、同 stage 合并保留与 status 可见（FR-C4-007，字段≠对象）。
- stalled 三处接受：review-provider-client.mjs:122（已是）、review-result.mjs 映射（:151-152 已部分存在，按定稿校准）、attempt.schema.json:193 group_outcome 枚举补 stalled（消费侧归类标签，公开面仍 4 值，FR-C4-009/010）。
- 允许名单收敛为一套（以 stage-materials.json stages.tracks 为唯一强制源），MATERIAL_FORBIDDEN 错误枚举全部合法值（FR-C4-013）。
- Phase review 复用判据 = 具名输入逐项相同（非哈希链）；verify-code 执行端读 review_result_ref（K5 既有结果）并区分结论来源，落点 = stage-handlers.mjs verify 集合点（新增读取分支，非新对象）（FR-C4-015/016）。
- 方向审查输入绑定 decision_revision（decision-log 整文件 sha256）+ OI 逐条 ref/sha256（FR-C4-017/018）。
- T-11：managedRequestId 的 stableValue 输入本地加协议版本（不动 managedPublic exactKeys），同材料 24h TTL 内重跑不产生 REQUEST_ID_CONFLICT；实跑验证一次定性 = 通道验证（只记退出码，不进 sink 不计轮次）（FR-C4-020）。
- 通道修复（FR-C4-012）：normalizeBareRecoveryResult 已接受 available-with-failures（HEAD 含 A2 修复）；补三组 fixtures（单侧失败/双侧部分/provider_results 空）+ 两组五态对照（unavailable vs dispatched_uncollected）可证伪测试，断言不丢已产出 findings、不降级正常 partial（AC-C4-025）。

跨仓 3rd-review（人工确认点之后）：health-runner 判死升级（probe busy 游标未变连续 5 次 → PROCESS_STALLED 诊断 → 发布现有合法 outcome 终态）、broker 内部 outcome 与 failed 枚举、config 拒绝墙钟语义保留、runtime.mjs 非终态回收路径修复（RISK-003）、两份文档（v4-cli-contract ADR、2026-07-12-v3-redesign-design.md:20/:216/:235）加方向修正标注（FR-C4-008/009/011）。跨仓判死逻辑本体由 3rd-review 自证（G-4），本仓只证调用侧映射（AC-C4-009/012）。

### C5 记录失效链（Phase 3，等 C4 改完 review-materials/review-record-route）

- OI-26 四类按 behavior/symbol/use-site 处置：A 保留 K2 `record_kind`/row identity 与 K5 immutable proof bindings，B 删除 freshness/currentness comparisons/rejections/rerun triggers，C 测试/变体 snapshot 保留但不得决定 production status，D 无 consumer 项具名删除。材料编辑后有效事实不失效、不重跑。Task I-retired current-material validation CLI 已删，只收掉其 former output consumer；绝不重建。禁止全局 literal-zero gate（FR-C5-001/AC-C5-001）。
- 写口收敛三项：inspectWriteBoundary 只比 task_id + 工作区路径 + 待写字节；第三项真实写入点内存比对（:217 现状已是字节比对，移出 path-card 流程、去掉 snapshot 前置）；新错误文案 write boundary source bytes mismatch；path card 整类删除（persistWriteBoundaryPathCard 落盘分支、createPathCardRecord、PATH_CARD_WRITERS、identity/path-cards 写门、task-close.mjs:243 调用点）（FR-C5-002/003、AC-C5-004/005/009）。
- 声明面四处同批：check-skill-closure.mjs:154 冻结数组改身份三项（task_id/stage/工作区路径）、stage-skill-deps.schema.json:27 const、6 个 skill-deps.yaml、build-prd spec-prd consumer identity（FR-C5-004/005）。
- check-extensibility content-hash 度量原样保留（J-5，C7 表述责任）（FR-C5-006）。
- CONTEXT.md:374-375 判据句改写：不再引用 material revision/snapshot，改为 identity 三项 + facts.jsonl 本阶段行 + 六类具名 ref；只改该一句（FR-C5-009）。
- 去重不再由材料哈希驱动；canonical identity 始终是 `(stage, phase_id, track, review_kind, origin)`。身份匹配后才使用 `review_result_ref` 定位并读回既有结果；禁止把 ref 当作 dedup key（FR-C5-007）。

### C6 收口状态（Phase 4，等 C5 改完 stage-runtime/completion-predicates）

- deriveStatusGroups 四投影与 status_groups 键收掉（stage-runtime.mjs:425-540/:856）；quality/verify.json 连对象收掉（schema 文件、quality-store.mjs publishVerifySummary、task-handle.mjs VERIFY_SUMMARY_WRITERS、task-kernel-implementation.mjs:794/:802-807 读点、projection-replacement.test.mjs:38、task-bootstrap-integrity.test.mjs:62/:69、verify-code-facts.test.mjs:80/:99 等 §17 清单内消费点同步收口）；deriveProductRelease/deriveCurrentProductRelease 及状态机删除（FR-C6-002/AC-C6-001~005）。
- validateRiskCloseQualityReasons 改等值判定：quality_reasons 与 status 根因行登记的具名 ref 集合逐项全等（去重排序），空集仍抛、不等仍抛（core/task-close.mjs:1788-1800）（FR-C6-004）。
- 三入口统一 project+task_id → config resolver → canonical path；--task-path 降受控诊断 override 并记录来源（FR-C6-005）。
- main 前进不冻结 base OID，status 根因行报 stale 带具体来源（FR-C6-006）。
- close 前置检查全部在 commit-delivery 之前（现有 DELIVERY_STEPS 顺序调整 + sidecar/允许清单/远端检查前置核对，不新增 --preflight-only）（FR-C6-007）。
- non_stage 谓词面：谓词遍历集合钉死 STAGES（completion-predicates.mjs 遍历点不改 STAGE_KEYS）；build-prd 只按自己的材料与事实收口（check-skill-closure.mjs:184-193 保留、5 阶段谓词不扩）（FR-C6-008）。
- D-015 stage publication/read/replay 已由 Task I 落地，回归-only；本批只补 stage-reflection/review facts 合并保留，禁止第二 writer/第 17 键/第二行（FR-C6-009/010）。
- planning close 承接 X47：保留 planning.materials[file] sha256 与 prd.md 附件绑定，删除 freshness/currentness rejection；回归锁定 `LEGACY_DELIVERY_STEPS` 5 步、`UNARCHIVED_PLANNING_STEPS` 4 步、`POST_CLEANUP_ARCHIVE_STEPS` 2 步与现有 `recordCloseActionRow` readback/failure visibility（FR-C6-011）。
- current-close-projection.mjs 改写不删：状态域移除 product_release（:11/:237/:246），改按具名 ref 读取路径取事实，文件保留为 task-close 活 reader（task-close.mjs:27/:106/:150/:158/:277），control-plane-inventory.json:13 登记更新（FR-C6-012/AC-C6-016）。
- 三块底座保留并点名 consumer（status_matrix/identity/source_completeness，FR-C6-013/AC-C6-017）；读取来源恰 6 类具名 ref、禁 readdir 决定内容、stage-outcome-proofs 读点保留（stage-runner.mjs:93/:97/:99，FR-C6-003/AC-C6-013/015）。

### 任务级收尾（Phase 5）

守卫基线复核（三条守卫命令，整改前后各一次）；任务级三条总账只读计算（净行数 M4 / 记录文件数 M3 / 无 reader 对象数，consumer=任务Ⅲ C8）；HANDOFF-T2-001~007 登记与治理文本同步清单移交 C7。

## File Boundary

写入面全集 = 各 Phase Files 中 MODIFY/NEW/DELETE 的并集；READ-ONLY CONSUMER 只可读、不可出现在 batch diff。每个文件都有 owning task（精确文件/boundary 引用）。每批开始/结束须把各仓 `BATCH_BASE`/`BATCH_HEAD` 的 full OID、branch 与 repo root 持久化到 task-store evidence；批证明从对应 Phase Files 派生 allowlist，并对 workflowhub 与 3rd-review 独立验证 ancestry/diff，不依赖进程环境变量。tasks.md 的 versioned_refs 为任务生成时的计划修订快照。

### MODIFY

- `/Users/Hugh/Hugh/Project/3rd-review/docs/archive/2026-07-12-v3-redesign-design.md`
- `/Users/Hugh/Hugh/Project/3rd-review/lib/broker.mjs`
- `/Users/Hugh/Hugh/Project/3rd-review/lib/config.mjs`
- `/Users/Hugh/Hugh/Project/3rd-review/lib/health-runner.mjs`
- `/Users/Hugh/Hugh/Project/3rd-review/lib/provider-failure.mjs`
- `/Users/Hugh/Hugh/Project/3rd-review/lib/runtime.mjs`
- `CONTEXT.md`
- `core/__tests__/check-extensibility.test.mjs`
- `core/__tests__/check-skill-closure.test.mjs`
- `core/__tests__/invocation-identity.test.mjs`
- `core/__tests__/run-checks.test.mjs`
- `core/load-config.mjs`
- `core/task-close.mjs`
- `docs/adr/0027-test-feedback-runtime-profile.md`
- `skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs`
- `tests/contract/final-coverage.test.mjs`
- `tests/contract/four-domain-close-status.test.mjs`
- `tests/contract/freshness-removal-preservation.test.mjs`
- `tests/contract/task-bootstrap-integrity.test.mjs`
- `tests/contract/verify-authority-boundary.test.mjs`
- `tests/contract/verify-final-coverage.test.mjs`
- `tests/contract/verify-publication.test.mjs`
- `tests/e2e/vnext-five-stage-current.test.mjs`
- `tests/e2e/ui-e2e-contract-dogfood.test.mjs`
- `tests/fixtures/public-behavior-baseline/v1/candidate.json`
- `tests/integration/minimal-task-storage.test.mjs`
- `tests/integration/stage-outcome-record-row-redirect.test.mjs`
- `tools/architecture/public-behavior-baseline.mjs`
- `tools/architecture/verify-final-coverage.mjs`
- `AGENTS.md`
- `docs/adr/0017-stage-quality-fact-freshness-scope.md`
- `docs/adr/0020-close-five-actions-quality-transcription.md`
- `docs/adr/0029-current-ac-and-close-state.md`
- `docs/adr/0030-mechanism-simplification-deletion-boundary.md`
- `docs/standard-workflow.md`
- `docs/architecture/control-plane-inventory.json`
- `docs/architecture/deletion-plan.json`
- `docs/architecture/move-map.json`
- `docs/architecture/repository-inventory.tsv`
- `package.json`
- `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/reviews/results/`
- `runtime/evidence/canonical-receipt-writer.mjs`
- `runtime/evidence/check-skill-closure.mjs`
- `runtime/evidence/freshness.mjs`
- `runtime/distribution/runner-release.mjs`
- `runtime/evidence/quality-store.mjs`
- `runtime/evidence/stage-content-evidence.mjs`
- `runtime/evidence/write-boundary-preflight.mjs`
- `runtime/review/review-record-route.mjs`
- `runtime/review/schemas/attempt.schema.json`
- `runtime/review/stage-materials.json`
- `runtime/schemas/stage-skill-deps.schema.json`
- `runtime/stage/completion-predicates.mjs`
- `runtime/stage/current-close-projection.mjs`
- `runtime/stage/stage-agent-outcome-adapter.mjs`
- `runtime/stage/stage-content-contracts.mjs`
- `runtime/stage/stage-handlers.mjs`
- `runtime/stage/stage-runner.mjs`
- `runtime/task/material-workspace.mjs`
- `runtime/task/task-handle.mjs`
- `runtime/task/task-kernel-implementation.mjs`
- `runtime/task/task-store.mjs`
- `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`
- `skills/wh-review/scripts/review-materials.mjs`
- `skills/wh-review/scripts/review-provider-client.mjs`
- `skills/wh-review/scripts/review-result.mjs`
- `skills/wh-review/scripts/simple-review-runner.mjs`
- `skills/wh-review/scripts/third-review-host-config.mjs`
- `skills/wh-review/scripts/wh-review-cli.mjs`
- `tests/close/close-contract.test.mjs`
- `tests/close/freshness-consistency.test.mjs`
- `tests/contract/build-prd-review-contract.test.mjs`
- `tests/contract/close-authorization-diagnostics.test.mjs`
- `tests/contract/close-sidecar-and-archive.test.mjs`
- `tests/contract/identity-resolution.test.mjs`
- `tests/contract/per-ac-material-freshness.test.mjs`
- `tests/contract/public-behavior-baseline.test.mjs`
- `tests/contract/review-budget-namespace.test.mjs`
- `tests/contract/review-materials-contract.test.mjs`
- `tests/contract/runtime-profile-consumer-readback.test.mjs`
- `tests/contract/stage-runtime-preflight.test.mjs`
- `tests/contract/status-derivation.test.mjs`
- `tests/contract/test-runtime-profile.test.mjs`
- `tests/contract/verify-architect-acceptance.test.mjs`
- `tests/final-cutover-guards.red.test.mjs`
- `tests/integration/distribution-closure.test.mjs`
- `tests/integration/projection-replacement.test.mjs`
- `tests/integration/runner-clean-install.test.mjs`
- `tests/integration/vnext-delivery-close.test.mjs`
- `tests/integration/vnext-official-stage-run.test.mjs`
- `tests/left-shift/left-shift-suite.test.mjs`
- `tests/review/review-managed-lifecycle.test.mjs`
- `tests/review/review-policy-compatibility.test.mjs`
- `tests/review/review-record-route.test.mjs`
- `tests/stage-risk-acceptance.test.mjs`
- `tests/verify-code-facts.test.mjs`
- `tests/integration/stage-row-publication.test.mjs`
- `tests/integration/stage-row-verify-code.test.mjs`
- `tools/cli/measure-test-runtime-profile.mjs`
- `tests/contract/final-current-snapshot.test.mjs`
- `tools/cli/produce-final-current-snapshot.mjs`
- `tools/cli/run-checks.mjs`
- `tools/cli/stage-runtime.mjs`
- `tools/cli/task-bootstrap.mjs`
- `tools/cli/task-close.mjs`
- `workflows/build-code/skill-deps.yaml`
- `workflows/build-plan/skill-deps.yaml`
- `workflows/build-prd/skill-deps.yaml`
- `workflows/build-spec/skill-deps.yaml`
- `workflows/make-decision/skill-deps.yaml`
- `workflows/verify-code/skill-deps.yaml`

### NEW

- `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p1-c9-handoff.md`
- `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p2-c4-handoff.md`
- `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p3-c5-handoff.md`
- `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p3-ledgers.json`
- `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p4-c6-handoff.md`
- `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p5-flow-boundary.md`
- `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p5-guard-baseline.json`
- `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p5-handoff-ledger.md`
- `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t0-preflight-check.md`
- `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t0-current-baseline.json`
- `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t17-crossrepo-confirmation.md`
- `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t18-crossrepo-tests.log`
- `skills/wh-review/scripts/__tests__/channel-fixtures.test.mjs`
- `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p1-batch-boundary.json`
- `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p2-batch-boundary.json`
- `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p3-batch-boundary.json`
- `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p4-batch-boundary.json`
- `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t32-tier-c-proof.json`
- `tests/contract/current-close-projection-readback.test.mjs`
- `tests/contract/stalled-consumer-delta.test.mjs`
- `tests/contract/tier-c-deletion-boundary.test.mjs`
- `tests/integration/stage-row-merge-freshness-delta.test.mjs`
- `tests/contract/test-capture-reuse.test.mjs`

### DELETE（删除证明：本组各条目带 owner 与恢复策略；build-code 逐条执行删除并以 gate/证据取证，回退走 git 历史）

- `runtime/schemas/quality-verify.v1.json`（Tier-C 连对象删除；owner=T54/T55；同批更新 Runner distribution、move-map/deletion-plan/inventory/current registries 与 focused tests；归档 specs 不改；恢复 = 回退整个 C6 deletion diff，恢复 schema + object graph + distribution/registry，禁止只加回 schema）
- Task I-retired current-material validation CLI（Task I 已删除；owner=T43/T44 regression proof；保持 absent，绝不重建；rollback 仅用于历史恢复分析，不属于 T2 正常恢复路径）
- `identity/path-cards/**`（path card 整类删除；owner=T45/T46；恢复 = git 历史回退）

### EVIDENCE（任务证据区，只读产出物登记）

- 规则：$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/ 下 t*/p* 证据文件由对应任务产出（evidence_path 字段），owner=各任务，consumer=批次取证与任务Ⅲ C8 总账；不属写边界 MODIFY/NEW 集，新增无需重复登记，删除随任务回滚。
- 追加规则：RED/GREEN 对共用 evidence_path 时为追加写（append-only），每条记录含命令、退出码、时间戳、任务 ID；GREEN 不得擦除 RED 的失败态证据。

## Technical Decisions

### DEC-1 档位改名方式

- **Selected**：仓库常量值一次性改到底（inner/phase/aggregate 含权限语义、错误文案、ADR 0027 同批），不做「新名映射旧值」兼容层。
- **理由**：D-003 用户裁定改名到底；映射层就是双写兼容桥，撞「不做兼容桥」。

### DEC-2 aggregate 契约上限

- **Selected**：契约上限保持 null，900,000ms 仅作 supervisor 运行兜底单列注释/登记，CI=true 硬要求保留。
- **理由**：D-003 明确 aggregate 契约上限 null、900,000 只是 CI supervisor 兜底；写死进契约会复现「数字预算」假判据。

### DEC-3 preflight 形态

- **Selected**：preflight 实现为纯校验函数（三类校验、protocol_invalid + 三字段 diagnostics、≤5 秒），不写完成谓词、不改 stage 状态、不阻断其他动作。
- **理由**：FR-C9-005 三条件；做成门禁会撞「不新增 gate」。

### DEC-4 审查预算删除顺序

- **Selected**：先落 review_result_ref 去重替代物（K2 行字段），再删 validateReviewBudget 及两个消费点。
- **理由**：FR-C4-002 顺序硬约束；先删预算会让去重窗口期丢失。

### DEC-5 去重键口径

- **Selected**：统一按 spec FR-C4-001 五维元组 (stage, phase_id, track, review_kind, origin) 实现；origin 承载审查来源归属语义（含 review_scope/subject/material 的归类）；conducted 结果存在即不重派。请求级与结果级同一套键。
- **理由**：spec 是批准口径；PRD C9-AC-5 八字段表述由 spec AC-C9-005 注记承接（C4 批实现、C4 批验收），实现层以 spec 五维为准，避免两套键并存。

### DEC-6 stalled 分层映射

- **Selected**：3rd-review 只产生 PROCESS_STALLED 内部诊断并发布现有合法 outcome（SESSION_MANAGER_LOST 失败组/unavailable）；stalled 仅 wh-review 消费侧归类标签（三处接受）；公开 outcome 仍 4 值。
- **理由**：终态映射 R4-Q2=A + v3 合法 outcome 闭集；HEAD 已有部分映射需校准而非重写。

### DEC-7 review_origin 落地形态

- **Selected**：post-merge 接受 Task I frozen K2：`record_kind: stage | close_action`、exact 16 keys、`review_origin` 五值（第 5 值 `dispatched_uncollected`）与 `review_result_ref`。不改名、不迁移、不兼容、不回填；字段/enum 创建是 regression-only，本批只实现真实 review facts 的 merge/propagation/status visibility。
- **理由**：用户决定 A + merge `9f9d0c44`；字段 ≠ 对象，原始结果留 K5。

### DEC-8 T-11 修复形态

- **Selected**：协议版本进 managedRequestId 的 stableValue 输入（本地计算），不动 managedPublic exactKeys；实跑验证定性 = 通道验证（只记退出码）。
- **理由**：D-009/OI-13/D-023；动信封字段集会 PROTOCOL_INCOMPATIBLE。

### DEC-9 写口字节比对实现

- **Selected**：写口三项核对（task_id/工作区路径/待写字节），第三项在真实写入点内存内比对即将写入字节 vs 已认证来源字节，不符抛 write boundary source bytes mismatch；path card 整类删除。
- **理由**：D-019/裁定 J-3/§16.21 第 10 条；旧 path-card 文案随卡片删除。

### DEC-10 失效链删除分类口径

- **Selected**：post-merge 按 OI-26 四类 behavioral/symbol/use-site closure。A 明确保留 K2 row identity 和 K5 immutable proof bindings；B 删除 freshness/currentness comparisons/rejections/rerun triggers；C 测试/变体 snapshot 保留但不进 current-status authority；D 无 consumer 删除。材料编辑不得使有效事实失效或重跑；禁止 global literal-zero oracle。
- **理由**：用户决定明确收窄 C5；`snapshot_tree` 等字面同时承载身份/历史，按总数清零会误删。

### DEC-11 quality/verify.json 处置

- **Selected**：user reconfirmed：连对象删除（schema + bootstrap/writers/readers + status/close projections），并依 ADR-0030 扩到 Runner distribution 的 explicit data closure、move-map/deletion-plan/repository-inventory/current control-plane registries 与 focused distribution tests；`specs/archive/**` immutable。
- **理由**：用户决定 B 是对 ADR-0030 Tier-C KEEP 的 post-merge amendment；只删 schema 会留下活对象和错误发布契约。恢复必须回退整个 C6 deletion diff，禁止只加回 schema。

### DEC-12 risk_close 替代判据

- **Selected**：quality_reasons 与 status 根因行登记的具名 ref 集合去重排序后逐项全等；空集仍抛、不等仍抛。
- **理由**：裁定 J-7.2；改「非空即可」会放行任意内容。

### DEC-13 close 顺序调整方式

- **Selected**：把 sidecar 发布/merge 预检/允许清单/远端对象检查移到 commit-delivery 之前（复用现有检查函数，调整 DELIVERY_STEPS 调用序），不新增 --preflight-only 命令。
- **理由**：FR-C6-007 禁止新增 public command；复用现有检查 = 零新控制面。

### DEC-14 current-close-projection.mjs 终局

- **Selected**：改写不删——状态域移除 product_release，改按具名 ref 读取路径取事实；文件保留为 task-close 活 reader；control-plane-inventory 登记更新。
- **理由**：D-013/R4-Q4/OI-14；删除文件会连带删活 reader。

## Test Strategy

测试纪律（全部批次）：只跑本批具名受影响清单与任务 gate_cmd；禁止无范围全量回归；唯一例外 = PRD C4 卡第 3 条批准的 npm run check（写明理由与范围）。守卫不劣化比较从 T0 current-baseline artifact 读变量，不使用历史硬编码。

### 场景优先级

P0（每批停止条件）：批内 gate_cmd 全绿 + 批内 AC oracle 取证 + 守卫基线不劣化。P1：跨批接口（C4→C5 的 review-materials、C5→C6 的 stage-runtime/completion-predicates）在下一批开工前复跑上一批 P0。P2：任务级三条总账（Phase 5）+ M4 为负。

### C9 七文件分档命令表（AC-C9-002/004 执行口径）

| 命令组 | 档位 | 预算 | 覆盖文件 | 启动次数 |
| --- | --- | --- | --- | --- |
| A | inner | ≤60,000ms | tests/contract/test-runtime-profile.test.mjs（单文件分钟级） | 1 |
| B | phase | ≤300,000ms | tests/integration/vnext-delivery-close.test.mjs、tests/contract/decision-convergence-depth.test.mjs | 1 |
| C | phase | ≤300,000ms | tests/contract/requirement-convergence-regression.test.mjs、tests/contract/stage-completion.test.mjs | 1 |
| D | aggregate（每任务一次，单独成组） | 契约 null，supervisor 兜底 900,000ms 单列 | tests/integration/vnext-official-stage-run.test.mjs | 1 |
| E | aggregate（每任务一次，单独成组） | 契约 null，supervisor 兜底 900,000ms 单列 | tests/e2e/vnext-five-stage-current.test.mjs | 1 |

这 7 个文件是路由分类输入：除 `tests/contract/test-runtime-profile.test.mjs` 为 **MODIFY** 外，其余 6 个均为 **READ-ONLY CONSUMER**，不得为满足路由表而改测试；若实现确需改其中任一文件，必须先把它加入 Phase 写边界再执行。拆分前 7 文件同命令一次启动（1,717.39s 单次门），超时后按文件逐个重跑（实测 ≥8 次启动）；拆分后 5 组 5 次启动、无跨层混跑。启动次数基准定义 = 「完成任务所需的总启动次数」：拆分前 1 次巨命令 + 超时重跑 ≥8 次 = ≥9；拆分后 5 次 ≤ 9，总启动次数不增（AC-C9-004）。两个 900 秒超时命令分处 D/E 两条独立 aggregate 调用、不再同命令（AC-C9-002 卡级失败判据）；「不同层」字面与两命令均需 aggregate 预算的张力按批准卡级判据落地并登记执行事实。evidence 路径 = $WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p1-c9-batch-green.log + 各 profile evidence JSON。

### 四批测试路由（build-code 执行口径）

- C9 批：`core/__tests__/run-checks.test.mjs` + tests/contract/test-runtime-profile.test.mjs + tests/contract/stage-runtime-preflight.test.mjs + tests/contract/test-capture-reuse.test.mjs（新增）；档位改名断言更新（test-runtime-profile / runtime-profile-consumer-readback）；oracle：AC-C9-001~011。
- C4 批：tests/review/review-record-route.test.mjs + tests/review/review-policy-compatibility.test.mjs + tests/contract/review-materials-contract.test.mjs + tests/review/review-managed-lifecycle.test.mjs + `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` + `skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs` + `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs` + tests/contract/review-budget-namespace.test.mjs + tests/verify-code-facts.test.mjs + tests/contract/verify-architect-acceptance.test.mjs；跨仓 3rd-review node --test test/health-runner.test.mjs test/managed-session-lifecycle.test.mjs test/provider-failure.test.mjs；oracle：AC-C4-001~026。
- C5 批：K2 stage/close-action round-trip、K5 immutable binding、material-edit no-invalidation/no-rerun、freshness symbol/use-site closure、former validator output consumer closure、check-skill-closure 与 write-boundary targeted tests；不运行 global literal-zero grep；oracle：AC-C5-001~010。
- C6 批：具名 targeted matrix，含 distribution-closure、runner-clean-install、`tests/integration/projection-replacement.test.mjs`、status/close/stage-row regressions；不以“九条/十条”脆弱计数作 gate；oracle：AC-C6-001~017。
- 流程边界：AC-FLW-001 按执行事实抽查取证。

### 验收判据权威边界

Canonical AC cards live only in `spec.md` §11. Plan and tasks reference AC IDs and add executable RED/GREEN routes; they do not copy or reinterpret AC prose. This avoids a second mutable acceptance authority.

## Rollback and Recovery

### Engineering Risk Handoff

- **Affected IDs**：T27（跨仓确认门）、T28/T29（跨仓写入）、T38/T39（通道 fixtures 与 OPN-2 收取）、T51/T52 与 T66/T67（C5/C6 批命令矩阵）、T69/T70（守卫基线复核）
- **Trigger**：跨仓写入前无确认记录；守卫基线劣化；批内 gate 红；通道 fixtures 丢 findings 复现
- **Consequence**：跨仓误写不可逆（他人仓库）；基线劣化会污染 M4 与 C8 判据
- **Mitigation or STOP**：T17 确认点未过 = STOP 在 C4 本仓侧；基线劣化 = 停在该批回退本批改动；fixtures 复现丢包 = 回退 normalizeBareRecoveryResult 变更并记录失败事实
- **Handling Stage**：build-code 同批修复；跨仓问题回 3rd-review owner 并按 HANDOFF-T2-003 标 unknown
- **Verification**：确认记录 + 工作树快照比对证据；守卫三条命令整改前后输出；fixtures 测试退出码

### 批级回滚

批内采用逐任务提交边界：每个 GREEN 完成即 commit（任务级提交点）。批检查点 = 批内第一个任务提交点。批内红 = 非破坏性 revert 检查点到 HEAD 的提交区间（git revert --no-commit 范围提交）；facts.jsonl 行与 RED 失败证据属追加保留区不在 revert 范围；跨仓部分独立成 commit 便于按 git 历史回退；批间接口破坏在下一批 P1 复跑时拦截。

**Tier-C exact deletion proof / recovery**：T54/T55 必须产出结构化 JSON proof，而非 blanket grep。proof 分别断言 schema absence；Phase 4 具名 production writer/reader/import closure；move-map/deletion-plan/repository/control-plane current registry tombstone/removal；Runner release manifest 不含该 schema但包含逐个声明的真实 data dependency；clean install/status 读回；Phase 4 具名 focused tests 与 golden fixture 读回；active ADR/governance prose 已同步；`docs/research/**` 与 `specs/archive/**` 仅作 audit/history 且与 `35a6fb6f` 比较零字节变化。回滚单位是整个 T55/C6 isolated diff：同时恢复 schema、object graph、distribution closure、registries/inventory 与 tests；不得只恢复 schema，也不得通过改写归档引用求 grep 零。

## Implementation Order

五批串行（硬约束见 Dependencies and Parallelism）；每批的 Goal/Files/Tasks/Verify/Knowledge/STOP/Done/Risks and rollback 如下，任务级 gate/oracle/evidence 见 tasks.md。

## Phase 1 · C9 执行面

### Goal

档位改名到底 + test:profile 入口 + 7 文件分档命令表 + preflight + receipt 复用取证 + 复用评估，C9 批 AC 全过。

### Files

- **MODIFY** `core/__tests__/run-checks.test.mjs`
- **MODIFY** `docs/adr/0027-test-feedback-runtime-profile.md`
- **MODIFY** `package.json`
- **MODIFY** `runtime/evidence/canonical-receipt-writer.mjs`
- **MODIFY** `runtime/stage/stage-content-contracts.mjs`
- **MODIFY** `tests/contract/runtime-profile-consumer-readback.test.mjs`
- **MODIFY** `tests/contract/stage-runtime-preflight.test.mjs`
- **MODIFY** `tests/contract/test-runtime-profile.test.mjs`
- **READ-ONLY CONSUMER** `tests/contract/decision-convergence-depth.test.mjs`
- **READ-ONLY CONSUMER** `tests/contract/requirement-convergence-regression.test.mjs`
- **READ-ONLY CONSUMER** `tests/contract/stage-completion.test.mjs`
- **READ-ONLY CONSUMER** `tests/e2e/vnext-five-stage-current.test.mjs`
- **READ-ONLY CONSUMER** `tests/integration/vnext-delivery-close.test.mjs`
- **READ-ONLY CONSUMER** `tests/integration/vnext-official-stage-run.test.mjs`
- **MODIFY** `tools/cli/measure-test-runtime-profile.mjs`
- **MODIFY** `tools/cli/run-checks.mjs`
- **MODIFY** `tools/cli/stage-runtime.mjs`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p1-batch-boundary.json`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p1-c9-handoff.md`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t0-preflight-check.md`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t0-current-baseline.json`
- **NEW** `tests/contract/test-capture-reuse.test.mjs`

### Tasks

T0-T14（执行序：T0 前置核对、T1→T2 改名、T3 评估、T4→T13 实现对、T14 合入；见 tasks.md Phase 1）

### Verify

C9 批 gate 组全绿 + AC-C9-001~011 oracle 取证 + 守卫基线不劣化 + 旧档位名零残留（含 ADR）。

### Knowledge

同文件串行：C9 先于 C6 改 stage-runtime；Task I ancestry/archive 已满足，T0 复核。

### STOP

Task I ancestry gate 失败；或批内任一 gate 红；或守卫劣化；或 test:profile 入口改了现有脚本语义。

### Done

npm run test:profile 真实 phase 调用产出 evidence（ceiling_ms=300,000）；aggregate 本地调用失败（CI-only）；7 文件分档表落 plan 执行证据；preflight 四类负例 ≤5 秒；receipt 复用与超时落盘取证；旧名零残留。

### Risks and rollback

改名漏点（权限/错误文案/ADR）→ 旧名零残留 grep 拦截；preflight 变门禁 → AC-C9-009 三条件反例拦截；回滚 = revert 本批。

## Phase 2 · C4 审查生命周期

### Goal

主仓消费侧十项 + 跨仓判死实现（确认点后）+ T-11 + 通道修复 fixtures，C4 批 AC 全过。

### Files

- **MODIFY** `/Users/Hugh/Hugh/Project/3rd-review/docs/archive/2026-07-12-v3-redesign-design.md`
- **MODIFY** `/Users/Hugh/Hugh/Project/3rd-review/lib/broker.mjs`
- **MODIFY** `/Users/Hugh/Hugh/Project/3rd-review/lib/config.mjs`
- **MODIFY** `/Users/Hugh/Hugh/Project/3rd-review/lib/health-runner.mjs`
- **MODIFY** `/Users/Hugh/Hugh/Project/3rd-review/lib/provider-failure.mjs`
- **MODIFY** `/Users/Hugh/Hugh/Project/3rd-review/lib/runtime.mjs`
- **MODIFY** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/reviews/results/`
- **MODIFY** `runtime/evidence/stage-content-evidence.mjs`
- **MODIFY** `runtime/review/review-record-route.mjs`
- **MODIFY** `runtime/review/schemas/attempt.schema.json`
- **MODIFY** `runtime/review/stage-materials.json`
- **MODIFY** `runtime/stage/stage-handlers.mjs`
- **MODIFY** `runtime/stage/stage-runner.mjs`
- **MODIFY** `runtime/task/material-workspace.mjs`
- **MODIFY** `runtime/task/task-store.mjs`
- **MODIFY** `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **MODIFY** `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`
- **MODIFY** `skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs`
- **MODIFY** `skills/wh-review/scripts/review-materials.mjs`
- **MODIFY** `skills/wh-review/scripts/review-provider-client.mjs`
- **MODIFY** `skills/wh-review/scripts/review-result.mjs`
- **MODIFY** `skills/wh-review/scripts/simple-review-runner.mjs`
- **MODIFY** `skills/wh-review/scripts/third-review-host-config.mjs`
- **MODIFY** `tests/contract/build-prd-review-contract.test.mjs`
- **MODIFY** `tests/contract/review-budget-namespace.test.mjs`
- **NEW** `tests/contract/stalled-consumer-delta.test.mjs`
- **MODIFY** `tests/contract/review-materials-contract.test.mjs`
- **MODIFY** `tests/contract/verify-architect-acceptance.test.mjs`
- **MODIFY** `tests/review/review-managed-lifecycle.test.mjs`
- **MODIFY** `tests/review/review-policy-compatibility.test.mjs`
- **MODIFY** `tests/review/review-record-route.test.mjs`
- **MODIFY** `tests/verify-code-facts.test.mjs`
- **MODIFY** `tests/integration/stage-row-publication.test.mjs`
- **MODIFY** `tests/integration/stage-row-verify-code.test.mjs`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p2-batch-boundary.json`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p2-c4-handoff.md`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t17-crossrepo-confirmation.md`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t18-crossrepo-tests.log`
- **NEW** `skills/wh-review/scripts/__tests__/channel-fixtures.test.mjs`

### Tasks

T15-T42（T27 跨仓确认门为 T28/T29 前置；见 tasks.md Phase 2）

### Verify

C4 批 gate 组全绿 + AC-C4-001~026 oracle 取证 + 跨仓自证三测试通过 + T-11 通道实跑退出码记录 + 守卫基线不劣化（含批准的 npm run check 例外一次）。

### Knowledge

C4 先于 C5 改 review-materials/review-record-route、先于 C6 改 stage-handlers；K2 `record_kind`/review fields 已冻结，只做 regression + propagation delta。

### STOP

跨仓确认点未过（STOP 在本仓侧继续）；验证 T-11 实跑被计成审查轮次；通道修复复现丢包；出现第二份健康判死实现。

### Done

review_origin 五态可见；预算零命中且替代物可读；stalled 三处接受；异源按底层模型；verify 执行端读 ref 分区结论；跨仓终态判死自证通过；文档标注落地。

### Risks and rollback

跨仓误写 → 确认点协议拦截；T-11 撞 REQUEST_ID_CONFLICT → 停在 T25 修复；回滚 = revert 本批，跨仓侧按 git 历史回退并记录。

## Phase 3 · C5 记录失效链

### Goal

按 OI-26 保留 K2/K5 身份与不可变 proof binding，删除 freshness/currentness comparison/use sites；材料编辑不失效不重跑；保持 predecessor validator absent 并收口 former-output consumer；写口三项/path-card/声明/CONTEXT delta。

### Files

- **MODIFY** `CONTEXT.md`
- **MODIFY** `core/__tests__/check-extensibility.test.mjs`
- **MODIFY** `core/__tests__/check-skill-closure.test.mjs`
- **MODIFY** `core/__tests__/invocation-identity.test.mjs`
- **MODIFY** `runtime/evidence/canonical-receipt-writer.mjs`
- **MODIFY** `runtime/evidence/check-skill-closure.mjs`
- **MODIFY** `runtime/evidence/freshness.mjs`
- **MODIFY** `runtime/evidence/write-boundary-preflight.mjs`
- **MODIFY** `runtime/review/review-record-route.mjs`
- **MODIFY** `runtime/schemas/stage-skill-deps.schema.json`
- **MODIFY** `runtime/stage/completion-predicates.mjs`
- **MODIFY** `runtime/stage/stage-agent-outcome-adapter.mjs`
- **MODIFY** `runtime/stage/stage-handlers.mjs`
- **MODIFY** `runtime/stage/stage-runner.mjs`
- **MODIFY** `runtime/task/task-handle.mjs`
- **MODIFY** `runtime/task/task-kernel-implementation.mjs`
- **MODIFY** `runtime/task/task-store.mjs`
- **MODIFY** `skills/wh-review/scripts/wh-review-cli.mjs`
- **MODIFY** `tests/close/freshness-consistency.test.mjs`
- **MODIFY** `tests/contract/final-current-snapshot.test.mjs`
- **MODIFY** `tests/contract/per-ac-material-freshness.test.mjs`
- **MODIFY** `tests/integration/stage-row-publication.test.mjs`
- **MODIFY** `tests/integration/stage-row-verify-code.test.mjs`
- **MODIFY** `tests/left-shift/left-shift-suite.test.mjs`
- **MODIFY** `tools/cli/produce-final-current-snapshot.mjs`
- **MODIFY** `tools/cli/task-close.mjs`
- **MODIFY** `workflows/build-code/skill-deps.yaml`
- **MODIFY** `workflows/build-plan/skill-deps.yaml`
- **MODIFY** `workflows/build-prd/skill-deps.yaml`
- **MODIFY** `workflows/build-spec/skill-deps.yaml`
- **MODIFY** `workflows/make-decision/skill-deps.yaml`
- **MODIFY** `workflows/verify-code/skill-deps.yaml`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p3-batch-boundary.json`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p3-c5-handoff.md`
- **NEW** `tests/contract/freshness-removal-preservation.test.mjs`

### Tasks

T43-T53（见 tasks.md Phase 3）

### Verify

K2/K5 positive preservation + material-edit no-invalidation/no-rerun + freshness symbol/use-site closure + deleted validator/former-output consumer closure + write-boundary/check-skill-closure targeted tests。

### Knowledge

C4 已改完 review-materials/review-record-route；C3（任务Ⅰ）已改完 task-handle 是本批动 task-handle 的前置；C5 先于 C6 改 stage-runtime/completion-predicates。

### STOP

K2/K5 binding 被删/重绑；材料编辑触发失效/重跑；freshness use site 仍可达；validator 被重建；四类缺一；check-extensibility 判据被换。

### Done

K2/K5 preservation + freshness behavior removal + 字节比对新文案拦 + path card 无生产 consumer + validator/former-output closure + CONTEXT semantic rewrite。

### Risks and rollback

误删身份/完整性面（OI-26 A/K5）→ positive round-trip/readback 拦截；字节比对弱化 → AC-C5-005 负例复跑；回滚 = revert 本批。

## Phase 4 · C6 收口状态

### Goal

投影连对象收掉、等值判定、入口统一、close 顺序、planning close 承接、current-close-projection 改写、三块底座点名；并完成 Tier-C schema absence、具名 production writer/reader/import closure、current registry tombstone/removal、release manifest/clean install、focused tests/fixtures 的结构化证明与完整回滚交接，C6 批 AC 全过。

### Files

- **MODIFY** `AGENTS.md`
- **MODIFY** `CONTEXT.md`
- **MODIFY** `core/load-config.mjs`
- **MODIFY** `core/task-close.mjs`
- **MODIFY** `docs/architecture/control-plane-inventory.json`
- **MODIFY** `docs/architecture/deletion-plan.json`
- **MODIFY** `docs/architecture/move-map.json`
- **MODIFY** `docs/architecture/repository-inventory.tsv`
- **MODIFY** `docs/adr/0017-stage-quality-fact-freshness-scope.md`
- **MODIFY** `docs/adr/0020-close-five-actions-quality-transcription.md`
- **MODIFY** `docs/adr/0029-current-ac-and-close-state.md`
- **MODIFY** `docs/adr/0030-mechanism-simplification-deletion-boundary.md`
- **MODIFY** `docs/standard-workflow.md`
- **MODIFY** `runtime/distribution/runner-release.mjs`
- **MODIFY** `runtime/evidence/quality-store.mjs`
- **MODIFY** `runtime/stage/completion-predicates.mjs`
- **MODIFY** `runtime/stage/current-close-projection.mjs`
- **MODIFY** `runtime/stage/stage-agent-outcome-adapter.mjs`
- **MODIFY** `runtime/stage/stage-handlers.mjs`
- **MODIFY** `runtime/stage/stage-runner.mjs`
- **MODIFY** `runtime/task/task-handle.mjs`
- **MODIFY** `runtime/task/task-kernel-implementation.mjs`
- **MODIFY** `runtime/task/task-store.mjs`
- **MODIFY** `tests/close/close-contract.test.mjs`
- **MODIFY** `tests/contract/close-authorization-diagnostics.test.mjs`
- **MODIFY** `tests/contract/close-sidecar-and-archive.test.mjs`
- **MODIFY** `tests/contract/final-coverage.test.mjs`
- **MODIFY** `tests/contract/final-current-snapshot.test.mjs`
- **MODIFY** `tests/contract/four-domain-close-status.test.mjs`
- **MODIFY** `tests/contract/identity-resolution.test.mjs`
- **MODIFY** `tests/contract/per-ac-material-freshness.test.mjs`
- **MODIFY** `tests/contract/public-behavior-baseline.test.mjs`
- **MODIFY** `tests/contract/status-derivation.test.mjs`
- **MODIFY** `tests/contract/task-bootstrap-integrity.test.mjs`
- **MODIFY** `tests/contract/verify-authority-boundary.test.mjs`
- **MODIFY** `tests/contract/verify-final-coverage.test.mjs`
- **MODIFY** `tests/contract/verify-publication.test.mjs`
- **MODIFY** `tests/e2e/ui-e2e-contract-dogfood.test.mjs`
- **MODIFY** `tests/e2e/vnext-five-stage-current.test.mjs`
- **MODIFY** `tests/final-cutover-guards.red.test.mjs`
- **MODIFY** `tests/fixtures/public-behavior-baseline/v1/candidate.json`
- **MODIFY** `tests/integration/distribution-closure.test.mjs`
- **MODIFY** `tests/integration/projection-replacement.test.mjs`
- **MODIFY** `tests/integration/minimal-task-storage.test.mjs`
- **MODIFY** `tests/integration/runner-clean-install.test.mjs`
- **MODIFY** `tests/integration/stage-outcome-record-row-redirect.test.mjs`
- **MODIFY** `tests/integration/stage-row-publication.test.mjs`
- **MODIFY** `tests/integration/stage-row-verify-code.test.mjs`
- **MODIFY** `tests/integration/vnext-delivery-close.test.mjs`
- **MODIFY** `tests/integration/vnext-official-stage-run.test.mjs`
- **MODIFY** `tests/stage-risk-acceptance.test.mjs`
- **MODIFY** `tests/verify-code-facts.test.mjs`
- **MODIFY** `tools/architecture/public-behavior-baseline.mjs`
- **MODIFY** `tools/architecture/verify-final-coverage.mjs`
- **MODIFY** `tools/cli/produce-final-current-snapshot.mjs`
- **MODIFY** `tools/cli/stage-runtime.mjs`
- **MODIFY** `tools/cli/task-bootstrap.mjs`
- **MODIFY** `tools/cli/task-close.mjs`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p4-batch-boundary.json`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p4-c6-handoff.md`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t32-tier-c-proof.json`
- **NEW** `tests/contract/current-close-projection-readback.test.mjs`
- **NEW** `tests/contract/tier-c-deletion-boundary.test.mjs`
- **NEW** `tests/integration/stage-row-merge-freshness-delta.test.mjs`
- **DELETE** `runtime/schemas/quality-verify.v1.json`
- **READ-ONLY CONSUMER** `docs/research/**`
- **READ-ONLY CONSUMER** `specs/archive/**`

### Tasks

T54-T68（见 tasks.md Phase 4）

### Verify

C6 具名 targeted matrix 全绿（含 distribution/runner/projection replacement 与 D-015/close routes regressions）+ AC-C6-001~017 + dynamic guard comparison。

### Knowledge

C5 已改完 stage-runtime/completion-predicates；C6 先于 C7 合 close 主文件；non_stage 口径按裁定 J-2 只消费不决定。

### STOP

schema 仍存在；任一具名 production writer/reader/import 仍可达；current registry 未进入 tombstone/removal 状态；release manifest/clean install 仍含 deleted schema 或漏真实 data dependency；focused test/fixture readback 失败；archive/research audit refs 被误改；status 读不到 facts.jsonl 新行；重放产生重复行；谓词遍历被改成 STAGE_KEYS；proofs 读点被删。

### Done

Tier-C structured proof 写入 p4 handoff：schema absent、具名 writer/reader/import closure、current registry tombstone/removal、release manifest 与 clean install、focused tests/fixture readback 全过，且完整 rollback unit 已登记；同时 status 输出 = 根因行 + 6 类 ref + 反射行，close precheck 在首个 route 动作前，frozen 5/4/2 arrays 不变，planning close 通过且身份未清空，投影文件保留改写达标，底座 consumer 点名齐。

### Risks and rollback

close 不可逆动作顺序错 → DELIVERY_STEPS 顺序硬校验 + 人工确认；回滚 = revert 本批。

## Phase 5 · 任务级收尾

### Goal

守卫基线复核、三条总账只读计算、HANDOFF 登记移交，任务级判据收口。

### Files

- **READ-ONLY CONSUMER** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/t0-current-baseline.json`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p3-ledgers.json`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p5-flow-boundary.md`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p5-guard-baseline.json`
- **NEW** `$WORKFLOWHUB_TASK_DIR/workflowhub-mechanism-simplification-t2-20260911/quality/tests/p5-handoff-ledger.md`

### Tasks

T69-T74（见 tasks.md Phase 5）

### Verify

三条守卫整改前后一致；M4 为负；记录文件数与无 reader 对象数对基线不劣化。

### Knowledge

四批全部合入后执行；consumer = 任务Ⅲ C8 的 M3/M4。

### STOP

M4 ≥ 0 或守卫劣化 → 回退批次定位赤字批次。

### Done

三条总账记录落 task-store quality/tests；HANDOFF-T2-001~005/007 作为 active handoffs 登记齐，HANDOFF-T2-006 以 superseded/accepted closed 单列。

### Risks and rollback

总账劣化 → 定位到批次回补或回退。

## Dependencies and Parallelism

- 硬串行：任务Ⅰ 合入 → Phase 1 → Phase 2（内含 T17 确认点人工门）→ Phase 3 → Phase 4 → Phase 5。
- 同文件串行（材料级）：见各 Phase Knowledge；跨批同文件修改严禁并行。
- 批内并行：不相交文件的测试更新可并行（如 C4 批 review-result 与 attempt schema 的用例增补）；同文件任务严格按 T 号顺序。
- 外部依赖：3rd-review 仓写入仅在人工确认点之后；Task I K2 字段/enum 已冻结并合入，不再是依赖或工作项。T17/T18 与 T30/T31 将 field creation/enum validation 标为 regression-only，剩余 delta 为 propagation/status visibility/stalled mapping。

## Requirement and Verification Traceability

- spec FR/AC → 任务：见 tasks.md 每任务 FR/AC 字段；全部 50 FR / 71 AC 均有 ≥1 任务承载（T0-T74）。
- 需求 → 批次：R-012→Phase 1、R-013→Phase 2、R-014→Phase 3、R-015→Phase 4、R-001/R-002/R-019→全部（材料纪律与交接）、R-005/R-006→守卫基线+M4、R-007→Phase 2、R-008→Phase 3、R-009→Phase 1、R-010/R-011→Implementation Order。
- 决定链 → 技术决策：DEC-1~3=D-003/D-004、DEC-4=D-010 修订、DEC-5=裁定 I/spec FR-C4-001 五维元组、DEC-6=R4-Q2=母决定 D-030、DEC-7=裁定 G、DEC-8=D-009/OI-13、DEC-9=D-019/J-3、DEC-10=OI-26、DEC-11=D-023①、DEC-12=J-7.2、DEC-13=D-025①、DEC-14=D-013。
- 验证权威唯一：本节的 Test Strategy AC 卡与 spec §11 byte 一致；tasks.md 不另立 AC 文本（只引 id）。

## Governance Synchronization Matrix

- HANDOFF-T2-001（ADR 0027 与治理文本档位同步）：本计划 T3 执行改写、任务Ⅲ C7 复核 → 关闭条件 = 治理文本无旧档位名。
- HANDOFF-T2-002（审查主机制/兜底关系与 review_origin 五态进治理文本）：T16/T19 落地后移交 C7。
- HANDOFF-T2-003（跨仓 unknown 结算与判死自证）：T27 与 T28/T29 的 unknown 出口登记。
- HANDOFF-T2-004（measure 工具已知重复或复用结论）：T1 结论登记。
- HANDOFF-T2-005（U-a~U-h）：Phase 5 随总账移交 C8。
- HANDOFF-T2-006/T2-007（CONTEXT.md 判据句）：T49/T50 改写、任务Ⅲ C7 复核。
- control-plane-inventory.json：T64/T65 同步 current-close-projection 归属。
- 宪法负向条款（C7）：review_origin 字段≠对象区分随 HANDOFF-T2-002 移交。

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"7d028c2919d2ef7749489d4a716be273a0dd986e7ea795a6b052c25a8d5dc12f","id":"CONSTITUTION","version":"1.8.0","clause_count":22}`
- 条款快照（22 条全枚举）：F1、F2、F3、F4、F5、F6、F7、F8、F9、F10、F11、Q1、Q2、Q3、S1、S2、S3、S4、S5、S6、S7、S8。
- 对照结论：本计划只细化四材料、不新增 public command / 持久化对象 / gate（F1-F11 系）；质量事实由独立 wh-review 审查产出、本计划不自审自判（Q1-Q3 系）；记录事实不阻断推进、unknown 不伪造（S1-S8 系）；测试纪律只跑受影响针对性测试（S 系）；推进与不可逆动作经人确认 = T27 跨仓确认点 + build-plan 发布前 confirm（S 系）。逐条明细见 constitution-checklist.md，22 条款全部对照无违例。
