# Tasks: multica-isolation-recovery-v2

**Input**: frozen spec.md and plan.md  
**Spec SHA-256**: fed12afa8a63299f1e14df2c3ce8f5ff46e33edb4c9cc02d9fe44e5e40d23343  
**Plan SHA-256**: 19767f1c28e1bde7416d86e7a7d8cc909d90e05df01e92b7bb7521c8d6667ad3  
**Tests**: Vitest 2.1.9、markdownlint-cli2、npm test、npm run check  
**Rule**: 每个任务都先取得 RED 或静态缺口证据，再做最小实现；质量 fail/unknown 只记录，结构和权限错误 fail-loud。

## Global Constraints

- WorkflowHub host-independent；Multica 只在 adapters/multica/ 实现 generic adapter port。
- 公开 CLI 不读取 cwd，不接受 cwd/worktree/storage/task path/capability id/任意 JSON file path。
- JSON 仅允许 stdin @- 或 launcher-authorized staging ref；admission 必须早于 assertRuntimeAuthority、bootstrap、payload read、mkdir、lock 和 temp。
- 目标产品仓命令只通过认证 Workspace/CandidateWorkspace；doctor/task/status/release/routing 使用独立 launcher capability。
- stage 只产 tree/blob snapshot；commit、close、repin、switch 各自使用独立 plan/hash-bound confirmation。
- legacy v2/checkpoint/execution/metrics 只读迁移；新 task 只写完整 v1。
- P0 不接生产；P1 结构证据齐全才可提交 P2；质量结果仍由用户裁决。
- 不新增运行依赖，不复制 runtime，不自动 merge/push/archive/cleanup，不增加质量阈值 gate。

## Task Format

每项包含 Action、Files、FR/AC、Depends、Verify、Done。标记 [P] 仅表示在依赖满足后可与同 phase 的不同文件任务并行。

## Phase 0 — Baseline and frozen contracts

### T001 [P] 冻结 baseline 与 legacy fixtures

- Action：记录当前 HEAD、accepted spec hash、现有 v2 attempt/accepted/checkpoint/execution fixtures；新增只读 fixture hash 清单，不搬移原文件。
- Files：tests/fixtures/multica-isolation-recovery-v2/manifest.json NEW；tests/legacy-v2-migration.test.mjs NEW。
- FR/AC：FR-007、FR-035；AC-003、AC-016；NFR-006。
- Depends：无。
- Verify：npx vitest run tests/legacy-v2-migration.test.mjs；初始 RED 必须来自 v1 reader/plan 未实现。
- Done：fixture 含原始 SHA-256，测试证明输入未被重写。

### T002 [P] 建 P0 contract set

- Action：创建 closed-object v1 schemas 与 producer/consumer/exact-version/migration/fixture 索引；拒绝未知字段。
- Files：schemas/cli-input.v1.schema.json、cli-output.v1.schema.json、task-create-input.v1.schema.json、task-manifest.v1.schema.json、source-envelope.v1.schema.json、adapter-envelope.v1.schema.json、task-attempt.v1.schema.json、task-accepted.v1.schema.json、task-snapshot.v1.schema.json、stage-receipt-input.v1.schema.json、stage-run-input.v1.schema.json、human-confirmation-envelope.v1.schema.json、task-commit-plan.v1.schema.json、task-close-plan.v1.schema.json、task-operation.v1.schema.json、release-manifest.v1.schema.json、multica-skills-lock.v1.schema.json、switch-plan.v1.schema.json、contracts/contract-set.2026-07-16.1.json NEW。
- FR/AC：FR-012、FR-016—019、FR-021—025、FR-029—031；AC-003、AC-005、AC-013。
- Depends：无。
- Verify：新增 tests/p0-contract-set.test.mjs，以 Ajv 验证正反 fixtures。
- Done：所有 schema id 完整、version=1.0.0、additionalProperties=false，contract set 无 version range/latest。

### T003 [P] 建副作用前拒绝 RED 矩阵

- Action：对 doctor/task/stage/commit/close/release/routing/status 表驱动注入 --cwd、--worktree、--storage-root、--task-path、任意 --input=/path 和 capability id；快照 storage、runtime authority、Git refs/HEAD/status 与 records。
- Files：tests/public-cli-side-effect-rejection.test.mjs NEW；tests/helpers/side-effect-snapshot.mjs NEW。
- FR/AC：FR-005、FR-017、FR-020；AC-011、AC-021。
- Depends：无。
- Verify：npx vitest run tests/public-cli-side-effect-rejection.test.mjs；spy 证明非法输入未调用 payload reader/bootstrap/doctor/executor。
- Done：仅 @- 和受权 staging ref 能进入下一层；非法输入前后快照逐字节一致且无 lock/temp。

### T004 [P] 建完整流程 RED suites

- Action：为五阶段 lineage、认证确认、snapshot、commit、close、adapter、release、pin/routing 和 P0 production deny 建最小 RED tests。
- Files：tests/stage-lineage-v1.test.mjs、human-confirmation-envelope.test.mjs、task-snapshot.test.mjs、task-commit.test.mjs、task-close-v1.test.mjs、adapter-port.test.mjs、release-manifest.test.mjs、release-routing.test.mjs、p0-production-denial.test.mjs NEW。
- FR/AC：FR-007—015、FR-021—034、FR-038、FR-041；AC-002—015、AC-018—021。
- Depends：T002。
- Verify：npx vitest run 以上文件；失败原因必须是能力缺失，不是 schema/fixture 错。
- Done：每个 AC 至少一项正例和一项越权/漂移/崩溃反例。

## Phase 1 — P0-A trusted launcher and public CLI

### T005 建单一 public CLI admission

- Action：实现 argv allowlist、命令表和最早期 forbidden-field 拒绝；旧 scripts 只作为内部 handler，不再自行解析外部路径。
- Files：bin/workflowhub、core/public-cli.mjs NEW；scripts/stage-runtime.mjs、scripts/task-bootstrap.mjs、scripts/runtime-cutover.mjs MODIFY；package.json MODIFY。
- FR/AC：FR-005、FR-016—018；AC-021。
- Depends：T002、T003、T004；T004 的完整 RED suites 是首个 public CLI 实现不可跳过的入口。
- Verify：npx vitest run tests/public-cli-side-effect-rejection.test.mjs tests/public-cli-contract.test.mjs。
- Done：只有一个 public bin；非法 argv 在 assertRuntimeAuthority/bootstrap 前失败。

### T006 [P] 实现 JSON source 与统一输出 envelope

- Action：JSON 只读 stdin @- 或 launcher-authorized staging ref；实现大小限制、single JSON stdout、稳定 exit code 与 stderr diagnostics。
- Files：core/json-input.mjs、core/cli-envelope.mjs NEW；tests/public-cli-contract.test.mjs NEW。
- FR/AC：FR-017、FR-019、FR-020；AC-011、AC-021。
- Depends：T002。
- Verify：npx vitest run tests/public-cli-contract.test.mjs tests/public-cli-side-effect-rejection.test.mjs。
- Done：ok 不含 error；error 不含 result\_ref；stdout 只有一个可解析 envelope；无 capability 泄漏。

### T007 建 launcher-scoped authorities 与命令分类

- Action：从受信 config、canonical refs、release pin 重建进程内能力；固定 repo\_bound 与 launcher\_bound 分类，不序列化 capability。
- Files：core/launcher-authority.mjs NEW；core/stage-context.mjs、core/storage-root.mjs、core/workspace-runner.mjs MODIFY；docs/contracts/task-context.md MODIFY。
- FR/AC：FR-001、FR-004—006、FR-018；AC-003、AC-021；NFR-005。
- Depends：T005、T006。
- Verify：npx vitest run core/\_\_tests\_\_/stage-context.test.mjs core/\_\_tests\_\_/workspace-runner.test.mjs core/\_\_tests\_\_/task-kernel-security.test.mjs。
- Done：产品仓命令只有 Workspace cwd；doctor/task/status/release/routing 对任意 cwd 输出一致。

### T008 建 canonical repo ref 与 task create lock/pin

- Action：通过受信 repo registry 解析 target repository ref；create lock 内读取 current pointer、doctor exact release、create-only 写 manifest pin；拒绝调用方 release pin/path。
- Files：core/repository-registry.mjs NEW；core/task-handle.mjs、core/task-index.mjs MODIFY；scripts/task-bootstrap.mjs MODIFY；tests/task-release-pin.test.mjs NEW；scripts/\_\_tests\_\_/task-bootstrap.test.mjs MODIFY。
- FR/AC：FR-001—003、FR-005；AC-012、AC-015、AC-021。
- Depends：T002、T007。
- Verify：npx vitest run tests/task-release-pin.test.mjs scripts/\_\_tests\_\_/task-bootstrap.test.mjs。
- Done：task create 只依赖受控 releaseAuthority 接口；fixture 证明 pin 来自接口而非调用方；真实 manifest/doctor/pointer 集成由 T023 完成。

### T009 [P] 实现只读 bootstrap/status/doctor facade

- Action：task bootstrap/status 和 doctor 只返回 canonical refs、next\_action、facts refs；不推动 stage、不返回路径/capability。
- Files：core/task-status.mjs、core/doctor-command.mjs NEW；core/public-cli.mjs MODIFY。
- FR/AC：FR-004—006、FR-016、FR-019；AC-003、AC-011。
- Depends：T006、T007。
- Verify：npx vitest run tests/public-cli-contract.test.mjs core/\_\_tests\_\_/capability-doctor.test.mjs。
- Done：facade 只依赖只读 doctorAuthority/task capability；从任意 cwd 返回同一 canonical 结果；真实 release doctor 由 T021 接入。

## Phase 2 — P0-A five-stage truth and authenticated boundaries

### T010 把新任务 attempt/accepted 收敛到 v1

- Action：TaskKernel 写 v1，校验同 task exact upstream ref/hash 与 future-stage unassigned；v2 writer 关闭，只读 reader 保留。
- Files：core/task-kernel-implementation.mjs、core/task-handle.mjs、core/stage-runner.mjs、core/stage-handlers.mjs MODIFY；core/legacy-record-reader.mjs NEW。
- FR/AC：FR-007、FR-010、FR-011；AC-003；NFR-006。
- Depends：T001、T002、T004、T007；五阶段实现必须先通过 T004 RED gate。
- Verify：npx vitest run tests/stage-lineage-v1.test.mjs core/\_\_tests\_\_/task-kernel-publish.test.mjs tests/five-stage-audit-e2e.test.mjs。
- Done：skip/cross-task/bad hash/forged accepted 在 attempt 或物理副作用前拒绝；v1/v2 不混 lineage。

### T011 [P] 固定 human/automatic acceptance policy

- Action：保留 human/auto/human/auto/human；automatic stage 拒 human ref，human stage 缺认证 ref 不 accept；内部 phase 不加人门。
- Files：core/stage-acceptance-policy.mjs、core/stage-runner.mjs、workflows/*/SKILL.md MODIFY；tests/workflow-v2-contract.test.mjs MODIFY。
- FR/AC：FR-008、FR-009、FR-014、FR-015；AC-004。
- Depends：T010。
- Verify：npx vitest run core/\_\_tests\_\_/stage-acceptance-policy.test.mjs tests/workflow-v2-contract.test.mjs tests/stage-lineage-v1.test.mjs。
- Done：策略矩阵只有三个人工边界；rejected/timeout exit 0 且无 accepted。

### T012 实现统一认证 confirmation envelope

- Action：验证 stable human actor、source event、occurred\_at、method/verified\_at、task policy；平台 capability 回读或受信签名；source event create-only 单消费。
- Files：core/human-confirmation.mjs NEW；core/task-kernel-implementation.mjs、core/task-handle.mjs MODIFY；schemas/human-confirmation.v1.schema.json LEGACY READ-ONLY。
- FR/AC：FR-012—015；AC-004—006。
- Depends：T002、T007、T010。
- Verify：npx vitest run tests/human-confirmation-envelope.test.mjs；覆盖伪 actor、Agent 自报、event replay、purpose/decision 错配。
- Done：stage/commit/close 共用 v1 envelope；purpose 与 bound ref/hash 不可交叉；认证 proof 有 canonical ref/hash。

### T013 用纯 task snapshot 替换新 checkpoint

- Action：采集 baseline/tree/diff/blob/status/time，不调用 commit-tree/update-ref；accepted 绑定 snapshot refs/hash。
- Files：core/task-snapshot.mjs NEW；core/git-worktree-snapshot.mjs、core/git-checkpoint.mjs、core/canonical-receipt-writer.mjs、core/task-kernel-implementation.mjs、core/stage-handlers.mjs MODIFY。
- FR/AC：FR-021、FR-023；AC-007、AC-010。
- Depends：T010。
- Verify：npx vitest run tests/task-snapshot.test.mjs tests/stage-ref-invariance.test.mjs；比较阶段前后 git for-each-ref 字节一致。
- Done：新 v1 流程无 commit-tree/update-ref；legacy checkpoint 只能 reader 读取。

### T014 更新五阶段 official CLI e2e

- Action：所有 stage prepare/receipt/run/confirm/accept 走 bin/workflowhub、stdin/staging refs、pinned release 和 v1 snapshot；证明 future stage 不可执行。
- Files：scripts/\_\_tests\_\_/stage-runtime-five-stage-e2e.test.mjs、tests/official-make-decision-cli.test.mjs、tests/stage-orchestrator-v2.test.mjs MODIFY。
- FR/AC：FR-007—020；AC-003、AC-004、AC-007、AC-011、AC-021。
- Depends：T005、T006、T007、T008、T009、T010、T011、T012、T013。
- Verify：npx vitest run 三个文件。
- Done：完整五阶段通过；所有 negative cases 零越权/路径/引用副作用。

## Phase 3 — P0-A commit, close and adapter isolation

### T015 建独立 commit operation

- Action：实现 prepare/confirm/execute/status；plan 绑定 task/release/accepted lineage/parent/tree/diff/target ref/hash；execute lock 内 reread/CAS/verify。
- Files：core/task-commit.mjs NEW；core/public-cli.mjs、core/task-handle.mjs MODIFY；tests/task-commit.test.mjs NEW。
- FR/AC：FR-012、FR-022、FR-023；AC-005、AC-008、AC-011。
- Depends：T004、T012、T013；commit/close 实现必须先通过 T004 RED gate。
- Verify：npx vitest run tests/task-commit.test.mjs；漂移 parent/tree/diff/ref 任一项，旧授权 exit 15 且不创建 commit/ref。
- Done：prepare/confirm 无 Git 副作用；verify exact postcondition 后才 completed。

### T016 收紧 close plan/state machine

- Action：plan 每步冻结 exact pre/post、accepted lineage、release pin；每次 retry 在同一 lock reread；postcondition reconcile、第三状态 invalidation；cleanup 与逻辑完成解耦。
- Files：core/task-close.mjs、core/workspace.mjs、core/public-cli.mjs MODIFY；tests/task-close-v1.test.mjs、tests/terminal-runtime-blockers.test.mjs MODIFY。
- FR/AC：FR-024—028；AC-009—011。
- Depends：T012、T013、T015。
- Verify：npx vitest run tests/task-close-v1.test.mjs tests/terminal-runtime-blockers.test.mjs。
- Done：每个 crash window 不重复副作用；无 final commit 不生成 ancestry；未授权 cleanup 不阻断 closed。

### T017 [P] 定义 generic adapter port

- Action：固定 normalizeSource/authenticateEvent/dispatch/projectStatus 窄接口、版本、canonical envelope；禁止 writer/coverage/audit/metrics import 和平台字段泄漏。
- Files：adapters/port.mjs NEW；schemas/adapter-envelope.v1.schema.json；tests/adapter-port.test.mjs NEW。
- FR/AC：INV-001—004、FR-038；AC-002。
- Depends：T002、T004、T006；adapter 实现必须先通过 T004 RED gate。
- Verify：npx vitest run tests/adapter-port.test.mjs；静态 import scan 与恶意 adapter fixtures。
- Done：adapter 只能通过 public CLI 派发；尝试 accepted write/coverage计算/private field 时失败。

### T018 [P] 迁移 Multica adapter

- Action：把 source normalization 移出 core，增加受信平台 event 回读、stable actor auth、公开 CLI dispatch、状态投影重试；不承担事实裁决。
- Files：adapters/multica/index.mjs NEW；core/multica-source-adapter.mjs LEGACY FORWARDER；tests/source-adapter.test.mjs MODIFY。
- FR/AC：INV-002、INV-004、FR-013、FR-038；AC-002、AC-006。
- Depends：T012、T017。
- Verify：npx vitest run tests/source-adapter.test.mjs tests/adapter-port.test.mjs。
- Done：Multica private fields 不进入 core/records；平台回写失败只记录 dispatch failure。

### T019 [P] 建 offline adapter fixture

- Action：实现同一 port 的无 Multica adapter，提供 canonical source、signed/test capability human event、dispatch 与 status projection。
- Files：adapters/offline-fixture/index.mjs NEW；tests/fixtures/offline-platform.mjs NEW。
- FR/AC：INV-001、FR-038；AC-001、AC-002。
- Depends：T017。
- Verify：npx vitest run tests/adapter-port.test.mjs；offline fixture 完成 source/auth/dispatch/status contract unit test。
- Done：代码和 fixture 无 Multica import/field；可驱动相同 CLI contract。

## Phase 4 — P0-B immutable release and isolated preview

### T020 建无自引用 release scaffold

- Action：实现 deterministic build/doctor scaffold，只用受控 fixture 验证 runtime/skills/adapter/lock artifacts → canonical manifest → external sidecar 顺序；此任务不组装或冻结最终发行。
- Files：scripts/build-release.mjs NEW；package.json MODIFY；schemas/release-manifest.v1.schema.json、schemas/multica-skills-lock.v1.schema.json；tests/release-manifest.test.mjs NEW。
- FR/AC：FR-029、FR-030；AC-013、AC-020。
- Depends：T002、T004、T017；release 实现必须先通过 T004 RED gate。
- Verify：npx vitest run tests/release-manifest.test.mjs tests/release-package.test.mjs。
- Done：fixture manifest 不含自身 hash，sidecar/manifest 不进入 artifact hash；builder/doctor mechanism 可重复执行；最终真实发行由 T035A 构建冻结。

### T021 [P] 扩展 release doctor

- Action：从 release ref 验 sidecar、artifact/六 Skill/adapter/lock hash、runtime exact version 和 contract set；P0 不要求 SBOM/signature。
- Files：core/release-manifest.mjs、core/doctor-command.mjs NEW；core/capability-doctor.mjs MODIFY；core/\_\_tests\_\_/release-doctor.test.mjs NEW。
- FR/AC：FR-031；AC-013。
- Depends：T002、T020。
- Verify：npx vitest run core/\_\_tests\_\_/release-doctor.test.mjs；逐项 mutation 全部 exit 13。
- Done：doctor 只读、不依赖 cwd、不改 routing；未知/范围 version 拒绝。

### T022 [P] 生成六个薄 Multica Skill 包

- Action：只含 SKILL.md/角色 prompt/公开命令模板/schema refs/依赖来源/exact version/hash；禁止 runtime、业务路径、writer、跨 stage 能力。
- Files：adapters/multica/skills/orchestrator/SKILL.md、make-decision/SKILL.md、build-spec/SKILL.md、build-plan/SKILL.md、build-code/SKILL.md、verify-code/SKILL.md NEW；skills/catalog.yaml、THIRD\_PARTY\_NOTICES.md MODIFY。
- FR/AC：FR-029、FR-039；AC-020；NFR-001/002。
- Depends：T005、T017。
- Verify：npx vitest run tests/release-package.test.mjs core/\_\_tests\_\_/check-skill-closure.test.mjs。
- Done：六包静态 closure 通过，零 internal runtime/storage writer/absolute host path。

### T023 建 single routing pointer 与 task pin semantics

- Action：实现 immutable manifest registry、current pointer CAS、approved-compatible rollback lookup；在途 task 只读自身 pin，新 task 读 current。
- Files：core/release-routing.mjs NEW；core/task-handle.mjs、core/public-cli.mjs MODIFY；tests/release-routing.test.mjs、tests/task-release-pin.test.mjs NEW。
- FR/AC：FR-002、FR-032—034；AC-012、AC-014、AC-015、AC-019。
- Depends：T020、T021。
- Verify：npx vitest run tests/release-routing.test.mjs tests/task-release-pin.test.mjs。
- Done：生产 routing 只有一个 manifest hash；CAS conflict 无 completed；无安全 rollback 时 disable。

### T024 [P] 建 privileged repin prepare/execute

- Action：prepare 冻结 old/new manifest、task live state、risk 和 plan hash；独立管理员确认后锁内执行；失败保留旧 pin。
- Files：core/task-repin.mjs NEW；core/public-cli.mjs、scripts/migrate-task-v2.mjs MODIFY；tests/task-release-pin.test.mjs、tests/legacy-v2-migration.test.mjs MODIFY。
- FR/AC：FR-003、FR-015；AC-015、AC-019。
- Depends：T012、T023。
- Verify：npx vitest run tests/task-release-pin.test.mjs tests/legacy-v2-migration.test.mjs。
- Done：普通 adapter/Agent 无 repin capability；drift 使旧授权失效；旧 pin 保留。

### T025 实施 P0 production deny 与 no-pointer fallback

- Action：preview release 强制不可 CAS production；无单 pointer adapter 只能 quiesce new、drain/pause in-flight、整体更新、resume。
- Files：core/production-switch.mjs NEW；core/runtime-mode.mjs MODIFY；tests/p0-production-denial.test.mjs、tests/release-routing.test.mjs MODIFY。
- FR/AC：FR-033、FR-041；AC-014、AC-018。
- Depends：T023。
- Verify：npx vitest run tests/p0-production-denial.test.mjs tests/release-routing.test.mjs。
- Done：P0 switch 在任何 routing/adapter 配置写前拒绝；fallback fixture 无逐项热替换入口。

### T025A 组装并 doctor P0 preview release

- Action：使用真实 runtime 1.0.0、T022 六薄 Skill、T018 Multica adapter 和 exact lock 组装 immutable preview release，运行 T021 doctor 并冻结 preview manifest/sidecar ref/hash；preview 标记必须使 production CAS 拒绝。
- Files：scripts/build-release.mjs、core/release-manifest.mjs、core/doctor-command.mjs MODIFY；tests/release-package.test.mjs、tests/p0-production-denial.test.mjs MODIFY。
- FR/AC：FR-029、FR-030、FR-031、FR-041；AC-013、AC-018、AC-020。
- Depends：T014、T015、T016、T017、T018、T019、T020、T021、T022、T023、T024、T025；preview release 必须包含全部 P0 runtime/CLI/stage/commit/close/adapter/routing/repin 内容。
- Verify：npx vitest run tests/release-manifest.test.mjs tests/release-package.test.mjs core/\_\_tests\_\_/release-doctor.test.mjs tests/p0-production-denial.test.mjs。
- Done：preview manifest/sidecar create-only 冻结且 doctor 通过；release_kind=preview，不能作为 P2 production candidate。

### T026 跑隔离 P0 Canary 与故障注入

- Action：只使用 T025A 已 doctor 的 immutable P0 preview release，在隔离 Multica fixture 连续两次 fresh task/worktree/execution；注入 dispatch、auth crash、stage publish、commit/close、version mismatch、unknown adapter schema 和 provider unavailable。
- Files：scripts/run-isolation-canary.mjs、scripts/run-fault-injection.mjs NEW；tests/isolation-canary.test.mjs NEW。
- FR/AC：FR-020、FR-025—026、FR-031、FR-041；AC-009、AC-011、AC-013、AC-017、AC-018。
- Depends：T014、T015、T016、T017、T018、T019、T020、T021、T022、T023、T024、T025、T025A。
- Verify：npx vitest run tests/isolation-canary.test.mjs；随后分别执行两个 scripts，保存 canonical evidence refs/hash。
- Done：两次 run 不复用任何 identity/state；修复会重置计数；全部 fail/unknown 原样保留并清理临时环境。

## Phase 5 — P1-A canonical execution and components

### T027 冻结 execution-record-envelope.v1

- Action：定义唯一顶层 identity/producer/release/timing/status/facts/metrics/decisions/refs/integrity；旧 contract 标 legacy mapping。
- Files：schemas/execution-record-envelope.v1.schema.json NEW；contracts/execution-record.contract.json MODIFY；tests/execution-envelope-v1.test.mjs NEW。
- FR/AC：FR-035、FR-036；AC-016、AC-017。
- Depends：T002、T004、T023；P1 execution 实现必须先通过 T004 RED gate。
- Verify：npx vitest run tests/execution-envelope-v1.test.mjs tests/execution-record.test.mjs。
- Done：仓库只有一个 canonical writer schema；质量结论不进入 status。

### T028 实现 owner-scoped execution writer

- Action：launcher create skeleton；各 producer 在 task lock/CAS 下只更新 owned fields；integrity hash闭合；崩溃写 interrupted reconciliation。
- Files：core/execution-envelope.mjs NEW；core/public-cli.mjs、core/task-handle.mjs、core/stage-runner.mjs MODIFY。
- FR/AC：FR-035、FR-037；AC-016。
- Depends：T027。
- Verify：npx vitest run tests/execution-envelope-v1.test.mjs；覆盖 owner conflict、stale hash、retry/reconcile。
- Done：无 capability id 持久化；每个 command 都绑定 task/release/producer exact version。

### T029 [P] 收敛最小 metrics 与 gap

- Action：duration、tokens、rework、human intervention、friction 进入唯一 envelope projection；未知值用 gap reason，不写零；写失败 warn-only。
- Files：metrics/collector.mjs、metrics/execution-record.mjs、metrics/record-schema.mjs MODIFY；components/metrics/index.mjs、components/metrics/contract.v1.schema.json NEW。
- FR/AC：FR-036、FR-037；AC-016、AC-017。
- Depends：T027、T028。
- Verify：npx vitest run tests/metrics-smoke.test.mjs tests/metrics-taskhandle-v2.test.mjs tests/execution-envelope-v1.test.mjs。
- Done：旧 metrics 只作 projection；gap 有 reason；collector failure 不阻 stage。

### T030 下沉 requirement ledger 与 coverage

- Action：把计算算法移到 versioned components；core 只验证 identity/version/hash/ref，并通过窄 dispatcher调用。
- Files：components/requirement-ledger/index.mjs、contract.v1.schema.json、components/coverage/index.mjs、contract.v1.schema.json NEW；core/requirement-ledger.mjs LEGACY FORWARDER；core/dispatch-component.mjs MODIFY。
- FR/AC：INV-003、FR-037；AC-017。
- Depends：T027。
- Verify：npx vitest run tests/requirement-lineage.test.mjs tests/component-contracts.test.mjs。
- Done：替换 fixture component 不改 core；quality fail/unknown 仍可解析并记录。

### T031 下沉 audit

- Action：迁移 audit aggregation 到 versioned component；core 保留 envelope/ref/hash validator，不复制算法。
- Files：components/audit/index.mjs、components/audit/contract.v1.schema.json NEW；core/audit-aggregator.mjs、core/receipt-writer.mjs LEGACY FORWARDER；core/dispatch-component.mjs MODIFY。
- FR/AC：INV-003、FR-037；AC-017。
- Depends：T030；先完成共享 core/dispatch-component.mjs 改造，再接入 audit，禁止并行写同一 dispatcher。
- Verify：npx vitest run tests/audit-aggregator.test.mjs tests/audit-p2.test.mjs tests/component-contracts.test.mjs。
- Done：audit component 可替换；缺 evidence 明确 unknown/invalid，不伪 PASS。

### T032 迁移旧 execution/metrics records

- Action：保留旧原文/hash，prepare migration report，新建 v1 refs；不原地改写、不自动接受、不混 lineage。
- Files：scripts/migrate-task-v2.mjs MODIFY；core/legacy-record-reader.mjs；tests/legacy-v2-migration.test.mjs、scripts/\_\_tests\_\_/migrate-task-v2.test.mjs MODIFY。
- FR/AC：FR-003、FR-035；AC-010、AC-016；NFR-006。
- Depends：T024、T027、T028、T029。
- Verify：npx vitest run tests/legacy-v2-migration.test.mjs scripts/\_\_tests\_\_/migrate-task-v2.test.mjs。
- Done：迁移前后 legacy hash 相同；失败旧 pin/data 不变；报告含 needs\_replay。

## Phase 6 — P1-B portability and source decisions

### T034 完成 isolated-browser-qa S3 更新裁决

- Action：严格用 isolated-browser-qa skill 做当日 upstream URL/version/security/替代检查，记录 checked\_at、local hash/delta 和 keep/upgrade/replace decision；不做页面 QA。
- Files：skills/isolated-browser-qa/SKILL.md、skills/catalog.yaml、skills/reuse-registry.md、THIRD\_PARTY\_NOTICES.md MODIFY；canonical decision record runtime-generated。
- FR/AC：FR-039、FR-042；AC-018；S3。
- Depends：T022。
- Verify：npx vitest run tests/skill-provenance-strict.test.mjs tests/reuse-registry.test.mjs。
- Done：来源可解析或明确 unknown；无伪造 canonical URL/commit；local delta 有 hash。

### T035 完成 orchestrator/deployment S6 对标

- Action：固定幂等恢复和 plan-bound deployment approval 的成熟来源、版本、checked\_at、local delta；明确复用/改造/不采用理由。
- Files：skills/catalog.yaml、skills/reuse-registry.md、THIRD\_PARTY\_NOTICES.md MODIFY；docs/research/orchestrator-deployment-comparison.md NEW。
- FR/AC：FR-040、FR-042；AC-018；S6。
- Depends：T034；先完成 skills/catalog.yaml、skills/reuse-registry.md、THIRD\_PARTY\_NOTICES.md 的共享元数据更新，再串行追加 S6 记录。
- Verify：npx vitest run tests/skill-provenance-strict.test.mjs tests/reuse-registry.test.mjs。
- Done：固定来源与版本可复核；不因对标新增第二套 orchestrator/deployer。

### T035A 重建并冻结最终 release

- Action：在 T034/T035 稳定 S3/S6 元数据后，以真实 runtime 1.0.0、六薄 Skill、Multica adapter、exact lock 重跑 build-release 和 doctor，冻结 immutable manifest 与外置 sidecar hash；不得复用 T020 fixture manifest。
- Files：scripts/build-release.mjs、core/release-manifest.mjs、core/doctor-command.mjs、skills/catalog.yaml、skills/reuse-registry.md MODIFY；tests/release-package.test.mjs、core/\_\_tests\_\_/release-doctor.test.mjs MODIFY。
- FR/AC：FR-029、FR-030、FR-031、FR-039、FR-040、FR-042；AC-013、AC-018、AC-020。
- Depends：T018、T020、T021、T022、T025A、T026、T027、T028、T029、T030、T031、T032、T034、T035；最终 release 必须包含 P0 preview/Canary 后确定的代码，以及已收敛的 execution、metrics、components 与 migration 内容。
- Verify：npx vitest run tests/release-manifest.test.mjs tests/release-package.test.mjs core/\_\_tests\_\_/release-doctor.test.mjs；对最终 artifacts/manifest/sidecar 做逐项 hash mutation。
- Done：最终 manifest/sidecar hash create-only 冻结且 doctor 通过；P1 eligibility 与 production fact packet 只引用该 ref/hash。

### T033 跑无 Multica clean-host 五阶段

- Action：在不安装/连接 Multica 的 fixture 中，只用 T035A 最终 release、offline adapter、public CLI 完成 task create、五阶段、status，并读取 canonical results。
- Files：tests/clean-host-e2e.test.mjs NEW；tests/fixtures/clean-host/ NEW。
- FR/AC：FR-038、FR-042；AC-001、AC-002、AC-018；NFR-002。
- Depends：T019、T026、T027、T028、T029、T030、T031、T032、T035A；clean-host 必须使用最终 release ref/hash，禁止使用 T025A preview。
- Verify：npx vitest run tests/clean-host-e2e.test.mjs；静态扫描 core/records 无 Multica field/import。
- Done：同一 adapter contract suite 同时覆盖 Multica/offline；两个结果都有 canonical refs/hash。

### T036 建 P1 structural eligibility

- Action：只验证六类结构证据存在且 schema/ref/hash/identity有效：execution envelope、metrics、component contracts、clean-host、S3、S6；不评价 quality threshold。
- Files：core/production-switch.mjs MODIFY；tests/p1-evidence-eligibility.test.mjs NEW。
- FR/AC：FR-042；AC-017、AC-018。
- Depends：T029、T030、T031、T032、T033、T034、T035、T035A。
- Verify：npx vitest run tests/p1-evidence-eligibility.test.mjs，并校验 eligibility 引用 T035A 的最终 manifest/doctor ref/hash。
- Done：缺任一类 eligibility=false；内容 fail/unknown 仍完整进入 facts，不显示总体 PASS。

## Phase 7 — Pre-switch qualification

### T040 [P] 做 requirement coverage 与 simplicity review

- Action：程序化检查 FR-001—043、AC-001—021 都映射到至少一个 task/test；检查重复机制、平行 writer/CLI/schema 和 YAGNI。
- Files：plan.md、tasks.md 只读；review output 进入 canonical review，不回写 accepted spec。
- FR/AC：FR-001—043；AC-001—021；F1—F10、Q1—Q3、S1—S8。
- Depends：T036；该依赖已传递覆盖全部切换前实现，且不依赖尚未执行的切换任务。
- Verify：coverage=100%；ambiguity/duplicate/critical count 可查询；finding 有 artifact anchor。
- Done：无 unmapped FR/AC；发现变更 spec 边界则开新 task，不静默扩 scope。

### T041 [P] 跑静态边界与 host-independence scans

- Action：扫描 Multica import、absolute host path、forbidden CLI flags、runtime duplication、canonical writer import、commit-tree/update-ref writer 和 capability serialization。
- Files：scripts/check-anti-host.mjs、scripts/check-contract.mjs、scripts/check-extensibility.mjs MODIFY；tests/host-independence.test.mjs NEW。
- FR/AC：INV-001—004、FR-005、FR-018、FR-021、FR-038；AC-001、AC-002、AC-007、AC-020、AC-021。
- Depends：T035A、T036；两者已传递覆盖 runtime、adapter、components、release 和 eligibility 实现。
- Verify：npx vitest run tests/host-independence.test.mjs core/\_\_tests\_\_/check-anti-host.test.mjs core/\_\_tests\_\_/check-contract.test.mjs。
- Done：core 无 Multica；六包无 runtime/writer/path；new stage writer 无 commit-tree/update-ref。

### T042A 跑切换前资格验证并冻结证据

- Action：运行 targeted lanes、npm test、npm run check、git diff --check，冻结 command、exit code、stdout/stderr hash、snapshot tree、T035A final release/doctor ref 和 canonical evidence refs；review evidence 接受 canonical result ref 或 provider unavailable/unknown diagnostic ref，质量 verdict 不作为成功硬门。
- Files：无产品代码；canonical evidence runtime-generated。
- FR/AC：FR-020、FR-035、FR-036、FR-037、FR-038、FR-039、FR-040、FR-041、FR-042、FR-043；AC-001—021；NFR-003/004。
- Depends：T026、T035A、T036、T040、T041，以及独立 review result ref 或 unavailable/unknown diagnostic ref。
- Verify：所有命令原样执行；结构/身份/hash/auth/version/permission 测试必须 green；quality fail/unknown 原样进入 brief。
- Done：切换前 evidence packet 闭合且可回放；review provider unavailable 不伪 PASS也不形成成功硬门；没有该 ref 禁止 T037。

## Phase 8 — P2 exact switch and rollback

### T037 生成不可变 production fact packet

- Action：冻结 implementation snapshot、全部测试、两次 Canary、故障注入、rollback drill、S3/S6、独立 review 原文 refs/hash；不裁剪失败/unknown。
- Files：core/production-switch.mjs MODIFY；tests/production-switch.test.mjs NEW。
- FR/AC：FR-043；AC-017、AC-018。
- Depends：T026、T035A、T036、T042A，以及独立 build-code/verify-code canonical review result ref 或 provider unavailable/unknown diagnostic ref；不要求 review verdict=pass。
- Verify：npx vitest run tests/production-switch.test.mjs；mutation 任一 nested ref/hash 必须失败。
- Done：fact packet 可从 canonical storage完全回放，绑定 T035A final release 与 T042A pre-switch evidence；review unavailable/unknown 原样保留，无作者代填 verdict或成功硬门。

### T038 建 switch plan/confirmation/CAS

- Action：plan 绑定 old/new manifest、live pointer、fact packet、rollback target/hash；用户认证确认 exact plan；CAS 单 pointer并写 observation/completion。
- Files：core/production-switch.mjs、core/release-routing.mjs、core/public-cli.mjs MODIFY；tests/production-switch.test.mjs、tests/p2-switch-recovery.test.mjs NEW。
- FR/AC：FR-032—034、FR-043；AC-014、AC-015、AC-018、AC-019。
- Depends：T012、T023、T037。
- Verify：npx vitest run tests/production-switch.test.mjs tests/p2-switch-recovery.test.mjs。
- Done：内容或 live pointer 变化需重新确认；CAS conflict 无 completed；切换只改一个 pointer。

### T039 观察首个生产 task 并演练安全回滚

- Action：新 task 使用新 pin、在途 task 保持旧 pin；失败停止新任务并只回滚上一 approved compatible manifest；无目标则 disable。
- Files：tests/p2-switch-recovery.test.mjs MODIFY；scripts/run-isolation-canary.mjs MODIFY。
- FR/AC：FR-032—034、FR-043；AC-015、AC-019。
- Depends：T038。
- Verify：npx vitest run tests/p2-switch-recovery.test.mjs；运行首任务/rollback fixture。
- Done：rollback 后 doctor+fresh smoke 有 refs/hash；任何 task/worktree/records 均未删除覆盖。

### T042B 跑切换后观察并冻结结果

- Action：CAS 后运行 doctor、首个 production task smoke、pin invariance、status/projection 和 rollback observation；记录原始 pass/fail/unknown 与 refs/hash，不回写切换前资格包。
- Files：无产品代码；canonical observation runtime-generated。
- FR/AC：FR-032、FR-033、FR-034、FR-043；AC-014、AC-015、AC-017、AC-019。
- Depends：T039。
- Verify：重读 live routing pointer、old/new task pins、首任务 result 和 rollback target；无安全 rollback 时验证入口 disabled。
- Done：切换后 observation 独立闭合；失败触发已授权 rollback/disable，不把失败改写成总体 PASS。

## Exact FR And AC Coverage Index

- FR-001：T007/T008；FR-002：T008/T023；FR-003：T024/T032；FR-004：T007/T009；FR-005：T005/T007；FR-006：T007/T009。
- FR-007：T010/T014；FR-008：T011；FR-009：T011；FR-010：T010；FR-011：T010/T014；FR-012：T012/T015/T016。
- FR-013：T012/T018；FR-014：T011/T012；FR-015：T011/T012/T024；FR-016：T005/T014；FR-017：T005/T006；FR-018：T007。
- FR-019：T006；FR-020：T003/T006/T026；FR-021：T013；FR-022：T015；FR-023：T013/T015；FR-024：T016。
- FR-025：T016；FR-026：T016/T026；FR-027：T016；FR-028：T016；FR-029：T020/T022/T025A/T035A；FR-030：T020/T025A/T035A。
- FR-031：T021/T025A/T035A；FR-032：T023/T038/T039；FR-033：T025/T038；FR-034：T023/T038/T039；FR-035：T027/T028/T032；FR-036：T027/T029。
- FR-037：T028/T029/T030/T031；FR-038：T017/T018/T019/T033；FR-039：T022/T034/T035A；FR-040：T035/T035A；FR-041：T025/T025A/T026；FR-042：T033/T034/T035/T036；FR-043：T042A/T037/T038/T039/T042B。
- AC-001：T019/T033；AC-002：T017/T018/T019/T033；AC-003：T010/T014；AC-004：T011/T012/T014；AC-005：T012/T015/T016；AC-006：T012/T018；AC-007：T013/T014。
- AC-008：T015；AC-009：T016/T026；AC-010：T013/T016/T032；AC-011：T003/T006/T015/T016；AC-012：T008/T023；AC-013：T020/T021/T025A/T035A；AC-014：T023/T025/T038。
- AC-015：T008/T023/T039；AC-016：T027/T028/T029/T032；AC-017：T026/T029/T030/T031/T036/T042A/T037/T042B；AC-018：T025/T025A/T026/T033/T034/T035/T035A/T036/T042A/T037/T038。
- AC-019：T023/T024/T038/T039；AC-020：T022/T041；AC-021：T003/T005/T006/T014/T041。

## Dependencies And Parallelism

- Critical path：T002 → T003/T004 → T005 → T007 → T010 → T012/T013 → T014 → T015/T016 → T020/T021/T023 → T025A → T026 → T027/T028 → T032 → T034 → T035 → T035A → T033 → T036 → T040/T041 → T042A → T037 → T038 → T039 → T042B。
- T017、T019 可在 T012之外独立推进；T018 等 T012。
- T020、T022 可并行；T021 等 T020；T023 等 T020/T021。
- T029 可在 T028 后独立推进；T030 与 T031 共享 core/dispatch-component.mjs，必须按 T030 → T031 串行。
- T034 与 T035 共享 catalog/reuse/notices，必须按 T034 → T035 串行；两者的来源判断仍由独立来源/上下文产出。
- T040、T041 在 T036 后可并行；T042A 汇总二者与独立 review result 或 unavailable/unknown diagnostic，不得由实现者代填 verdict。

## Phase Gates And Stop Conditions

- P0-A 完成：public CLI、五阶段真实性、认证 confirmation、snapshot、commit、close、双 adapter contracts 全部有结构证据；不代表生产资格。
- P0-B 完成：inactive release/doctor/pin/routing 和两次 fresh Canary/fault facts 完整；production CAS 仍被硬拒绝。
- P1 完成：execution、metrics、components、clean-host、S3、S6 六类结构证据全部存在；其内容 fail/unknown 交给用户。
- P2 STOP：没有用户对 exact switch plan/hash 的认证确认，禁止 CAS。
- 任何任务若要求修改 accepted spec、加入 SBOM/signature gate、第二生产 adapter、自动质量 gate 或自动 merge/push/archive，立即停止并开新 task。
