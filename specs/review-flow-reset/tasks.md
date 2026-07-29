# 任务清单：事实组 2 完整修复与 WorkflowHub 质量恢复

> 基于当前 `spec.md` 和 `plan.md`。本文件是唯一执行清单，也是 Task 完成状态的唯一权威。

- **Input**：`specs/review-flow-reset/spec.md`、`specs/review-flow-reset/plan.md`
- **Status**：Draft
- **Template version**：`plan-task.v3`

## 1. 执行摘要

- **Goal**：在同一任务中完成 T001–T012，再进入真正的 verify-code。
- **Main boundary**：四材料只决定能否继续；正式结构错误 fail-loud；历史记录不自动完成 Task。
- **Main risk**：把去 gate 错误实现成删除真实实现、测试、逐 AC、review 或交接。
- **First executable task**：T001

## 2. Global Constraints

- spec binding：`{"artifact_kind":"spec","ref":"specs/review-flow-reset/spec.md","hash":"b3b3b50f908e4a77d748bf5c83d9235cb8aa02f162b089bf332e97329a43b4a1","id":"REVIEW-FLOW-RESET"}`
- plan binding：`{"artifact_kind":"plan","ref":"specs/review-flow-reset/plan.md","hash":"c9dcb667ad65706e3ea2352c6ec7bca9f7555940980255ae5bdc9f14a06bede0","id":"REVIEW-FLOW-RESET-PLAN"}`
- 每个行为变化先有真实 RED，再做 GREEN；配对任务使用相同 `gate_cmd` 和 oracle。
- 只跑风险相关聚焦测试；不拼最终全量，不重复 provider 审查追 pass。
- `tasks.md` 是唯一完成权威。只有执行者可在全部完成事实核验后勾选；runtime 只认证，不代替勾选。
- accepted、receipt、trace、reopen、generation、audit 只作记录，不能自动改变 Task 状态。
- 文件只用精确路径；不可逆操作单独授权。

## Phase 1：统一身份、结构预检与路径交接

### Goal

三个 official owner 共享一次真实写边界认证，路径卡只作可验证交接。

### Files

- **NEW**：`core/write-boundary-preflight.mjs`
- **MODIFY**：`core/invocation-identity.mjs`、`core/stage-context.mjs`、`core/task-handle.mjs`、`core/stage-runner.mjs`、`core/canonical-receipt-writer.mjs`、`core/task-recovery.mjs`、`core/task-close.mjs`、`scripts/stage-runtime.mjs`、`scripts/task-recovery.mjs`、`scripts/task-close.mjs`、`core/__tests__/invocation-identity.test.mjs`、`core/__tests__/stage-context.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`scripts/__tests__/task-recovery.test.mjs`、`tests/task-close-delivery.test.mjs`
- **DO NOT TOUCH**：`CONSTITUTION.md`、`constitution-checklist.md`、`.git/`

### Tasks

#### T001 — RED：共享写边界与路径卡

- **ID**：T001
- **Phase**：Phase 1：统一身份、结构预检与路径交接
- **goal**：复现三个 official owner 绕过、stale path card 和失败后字节变化。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/review-flow-reset/spec.md","hash":"b3b3b50f908e4a77d748bf5c83d9235cb8aa02f162b089bf332e97329a43b4a1","id":"FR-PREFLIGHT-001"},{"artifact_kind":"plan","ref":"specs/review-flow-reset/plan.md","hash":"c9dcb667ad65706e3ea2352c6ec7bca9f7555940980255ae5bdc9f14a06bede0","id":"T001"}]`
- **输入**：当前 owner 入口、调用身份和路径卡实现。
- **依赖**：N/A — first task
- **并行**：否 — T002 直接消费本 RED。
- **FR**：FR-IDENTITY-001、FR-PATH-001、FR-PREFLIGHT-001、FR-PREFLIGHT-002
- **AC**：AC-01、AC-02、AC-03、AC-04
- **动作**：新增缺 canonical task、错误 Git 顶层、dirty/未提交内容、owner bypass、stale/conflict card 和零 mutation 行为断言。
- **精确文件**：`core/__tests__/invocation-identity.test.mjs`、`core/__tests__/stage-context.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`scripts/__tests__/task-recovery.test.mjs`、`tests/task-close-delivery.test.mjs`
- **boundary**：只改上述测试；不改实现、正式记录或真实 worktree。
- **输出**：OR-WRITE-BOUNDARY 的真实失败。
- **Knowledge**：stage-runtime、task-recovery、task-close 是三个 official owner。
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`npx vitest run core/__tests__/invocation-identity.test.mjs core/__tests__/stage-context.test.mjs core/__tests__/task-kernel-publish.test.mjs scripts/__tests__/task-recovery.test.mjs tests/task-close-delivery.test.mjs`
- **expected_exit**：1
- **oracle**：OR-WRITE-BOUNDARY — 任一 owner 绕过 shared result、子写重复认证、缺来源卡、启动信任 stale 卡或失败改变业务/用户/第三方字节即命中。
- **evidence_path**：`apply/evidence/write-boundary-preflight-red.stdout`、`apply/evidence/write-boundary-preflight-red.stderr`
- **STOP**：失败来自 fixture/setup、无法真实复现，或需修改正式记录才能构造 RED。
- **recovery**：修正最小 fixture 后重跑同一命令。
- **task risk**：旧 E2E 失败掩盖目标 oracle。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增真实 per-invocation dirty/legacy 写边界、stale informational path-card、三个 owner shared preflight、子写复用及失败零 mutation 断言；恢复 build-spec/build-plan/verify-code 既有覆盖。
- **executed_commands**：纯 Phase 1 聚焦 RED exit 1，真实命中 dirty execution 未拒绝与 legacy write boundary 误阻断；修复后五文件验证 117/117、exit 0；`git diff --check` exit 0。
- **evidence_refs**：implementation commit `6419572226b995cac1bcb44eef41a109c78da84f`；本次 Phase 1 RED/GREEN 执行输出；Phase review finding 1–3 及修复后 117/117 输出。
- **covered_ac**：AC-01、AC-02、AC-03、AC-04。
- **review_fact**：独立 Phase review 原 verdict=`revise_required`；3 个 major finding 均已修复并由受影响测试验证；按 single-review 规则未二审、未把 verdict 改写为 pass。旧 canonical task 因 accepted plan/tree 漂移与 closed Phase 无法发布新正式 review，真实记录为 formal unavailable。
- **completed_at**：2026-07-29T09:01:22Z

#### T002 — GREEN：共享 preflight、调用身份与路径交接

- **ID**：T002
- **Phase**：Phase 1：统一身份、结构预检与路径交接
- **goal**：三个 official owner 复用一次 shared preflight，并发布只读来源路径卡。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/review-flow-reset/spec.md","hash":"b3b3b50f908e4a77d748bf5c83d9235cb8aa02f162b089bf332e97329a43b4a1","id":"FR-PREFLIGHT-001"},{"artifact_kind":"plan","ref":"specs/review-flow-reset/plan.md","hash":"c9dcb667ad65706e3ea2352c6ec7bca9f7555940980255ae5bdc9f14a06bede0","id":"T002"}]`
- **输入**：T001 RED。
- **依赖**：T001
- **并行**：否 — 共享 owner 与测试文件。
- **FR**：FR-IDENTITY-001、FR-PATH-001、FR-PREFLIGHT-001、FR-PREFLIGHT-002
- **AC**：AC-01、AC-02、AC-03、AC-04
- **动作**：接通共享 preflight；accept/close append-only 发布来源 ref/hash 路径卡，启动忽略卡中路径。
- **精确文件**：`core/write-boundary-preflight.mjs`、`core/invocation-identity.mjs`、`core/stage-context.mjs`、`core/task-handle.mjs`、`core/stage-runner.mjs`、`core/canonical-receipt-writer.mjs`、`core/task-recovery.mjs`、`core/task-close.mjs`、`scripts/stage-runtime.mjs`、`scripts/task-recovery.mjs`、`scripts/task-close.mjs`、`core/__tests__/invocation-identity.test.mjs`、`core/__tests__/stage-context.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`scripts/__tests__/task-recovery.test.mjs`、`tests/task-close-delivery.test.mjs`
- **boundary**：仅 Phase 1 NEW/MODIFY；不加入质量裁决字段或入口 gate。
- **输出**：共享结构认证和 append-only informational path card。
- **Knowledge**：每个 owner 一次 shared result，owner 内子写复用。
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`npx vitest run core/__tests__/invocation-identity.test.mjs core/__tests__/stage-context.test.mjs core/__tests__/task-kernel-publish.test.mjs scripts/__tests__/task-recovery.test.mjs tests/task-close-delivery.test.mjs`
- **expected_exit**：0
- **oracle**：OR-WRITE-BOUNDARY — 三个 owner 无绕过、失败零 mutation、路径卡有来源且不作启动权威。
- **evidence_path**：`apply/evidence/write-boundary-preflight-green.stdout`、`apply/evidence/write-boundary-preflight-green.stderr`
- **STOP**：需要永久 runner identity、把 path card 当权威、把 preflight 变成进入 gate 或覆盖 dirty 用户字节。
- **recovery**：撤回调用点，保留 T001 RED 和用户文件。
- **task risk**：共享结果生命周期过宽。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：read-only inspect 后在最终 Workspace/CandidateWorkspace 上生成一次 shared write boundary；stage-runtime/recovery/close 子写复用；path-card 绑定真实 source ref/hash 且 informational-only；close 删除 task branch 后只从已认证 no-ff merge 第二父提交恢复 task tip。
- **executed_commands**：`CI=1 npx vitest run core/__tests__/invocation-identity.test.mjs core/__tests__/stage-context.test.mjs core/__tests__/task-kernel-publish.test.mjs scripts/__tests__/task-recovery.test.mjs tests/task-close-delivery.test.mjs` → 117/117、exit 0；生产文件 `node --check` 通过；`git diff --check` exit 0；allowlist 12/12、unexpected=[]。
- **evidence_refs**：implementation commit `6419572226b995cac1bcb44eef41a109c78da84f`；Phase 1 GREEN 输出；独立 review finding 修复记录。
- **covered_ac**：AC-01、AC-02、AC-03、AC-04。
- **review_fact**：同 T001：原 `revise_required` 保留；3 个 finding 已修；无二审；formal review unavailable 原因已如实记录。
- **completed_at**：2026-07-29T09:01:22Z

### Verify

- **Target**：AC-01 至 AC-04
- **gate_cmd**：与 T001/T002 相同。
- **expected_exit**：0
- **evidence_path**：`apply/evidence/write-boundary-preflight-green.stdout`
- **display_cmd**：N/A — gate output is sufficient
- **Oracle**：OR-WRITE-BOUNDARY

### Knowledge

- official owner 清单来自当前 runtime/recovery/close 入口。

### STOP

- 预检阻断四材料进入、需要每条 journal 重跑或触碰用户文件。

### Done

- T001/T002 完成区均真实填写；三个 owner 无绕过且共享一次结果。

### Risks and rollback

- **Risk**：入口遗漏。
- **Prevention**：owner 清单对照测试。
- **Rollback / recovery**：撤回 owner 接入，保留 RED。

## Phase 2：统一正式写边界与 recovery operation

### Goal

三类 recovery operation 共享 registry、锁、CAS、rollback 和 replay。

### Files

- **NEW**：N/A — 复用 recovery core。
- **MODIFY**：`core/task-recovery.mjs`、`core/schemas/workflowhub-recovery-credential.v1.json`、`core/schemas/workflowhub-recovery-generation.v1.json`、`core/task-handle.mjs`、`core/stage-runner.mjs`、`skills/wh-review/scripts/integration-review-subject.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`core/task-kernel-implementation.mjs`、`core/canonical-receipt-writer.mjs`、`core/workspace.mjs`、`core/task-close.mjs`、`scripts/task-recovery.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`core/__tests__/task-recovery.test.mjs`、`core/__tests__/task-handle.test.mjs`、`core/__tests__/workspace-manager.test.mjs`、`scripts/__tests__/task-recovery.test.mjs`、`tests/task-close-delivery.test.mjs`、`tests/terminal-runtime-blockers.test.mjs`
- **DO NOT TOUCH**：历史 recovery bytes、`.git/`

### Tasks

#### T003 — RED：recovery、竞态与 rollback

- **ID**：T003
- **Phase**：Phase 2：统一正式写边界与 recovery operation
- **goal**：复现三类 operation 的 registry/白名单漂移、竞态、rollback 和 replay 缺口。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/review-flow-reset/spec.md","hash":"b3b3b50f908e4a77d748bf5c83d9235cb8aa02f162b089bf332e97329a43b4a1","id":"FR-RECOVERY-001"},{"artifact_kind":"plan","ref":"specs/review-flow-reset/plan.md","hash":"c9dcb667ad65706e3ea2352c6ec7bca9f7555940980255ae5bdc9f14a06bede0","id":"T003"}]`
- **输入**：现有 recovery v1 schema、validator、TaskHandle 和 CLI。
- **依赖**：T002
- **并行**：否 — 依赖 Phase 1 写边界。
- **FR**：FR-PREFLIGHT-001、FR-PREFLIGHT-002、FR-RECOVERY-001、FR-RECOVERY-002、FR-RECOVERY-003
- **AC**：AC-03、AC-04、AC-08、AC-09、AC-10
- **动作**：新增三类 kind parity、旧 v1 兼容、未知 kind、CAS、第三方 pointer、rollback 和 replay 测试。
- **精确文件**：`core/__tests__/task-recovery.test.mjs`、`core/__tests__/task-handle.test.mjs`、`core/__tests__/workspace-manager.test.mjs`、`scripts/__tests__/task-recovery.test.mjs`、`tests/task-close-delivery.test.mjs`、`tests/terminal-runtime-blockers.test.mjs`
- **boundary**：只改测试；不改 recovery/CLI/Workspace 实现，不清理真实工作树。
- **输出**：OR-RECOVERY 的真实失败。
- **Knowledge**：旧 runner-replacement/phase-pointer v1 fixture 必须原字节兼容。
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`npx vitest run core/__tests__/task-recovery.test.mjs core/__tests__/task-handle.test.mjs core/__tests__/workspace-manager.test.mjs scripts/__tests__/task-recovery.test.mjs tests/task-close-delivery.test.mjs tests/terminal-runtime-blockers.test.mjs`
- **expected_exit**：1
- **oracle**：OR-RECOVERY — 三类 whitelist 任一层不一致、旧 v1 失效、未知 kind 未拒绝、replay 不幂等、CAS 半状态或失败修改 worktree 即命中。
- **evidence_path**：`apply/evidence/recovery-operation-contract-red.stdout`、`apply/evidence/recovery-operation-contract-red.stderr`
- **STOP**：RED 依赖真实用户文件、失败来自 setup 或无法隔离第三方变化。
- **recovery**：修正临时 fixture，不触碰正式 task/worktree。
- **task risk**：把 fixture 清理误当 rollback。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增三类 recovery kind registry/schema/JS/TaskHandle/CLI parity、旧 v1 兼容、未知 kind 拒绝、CAS/rollback/replay、dirty-cleanup-rebind 与 normal close effective Workspace 的真实 RED。
- **executed_commands**：纯 Phase 2 RED：`core/task-recovery` 19 项中 3 项按 OR-RECOVERY 失败；补充审查 finding RED 命中缺 credential producer、伪造 authorization、normal close 旧 root。最终精确 6 文件 gate 141/141、exit 0。
- **evidence_refs**：implementation commit `dd51a5a92074d52647b9d6cae569202b21bed7df`；Phase 2 RED/GREEN 输出；一次独立 review 三项 blocking finding 及修复记录。
- **covered_ac**：AC-03、AC-04、AC-08、AC-09、AC-10。
- **review_fact**：独立 Phase review 原 verdict=`revise_required`；3 个 blocking finding 已全部修复，原 verdict 保留；未二审。formal canonical review 因旧 task closed/plan drift unavailable。
- **completed_at**：2026-07-29T10:05:38Z

#### T004 — GREEN：operation registry 与正式写入口

- **ID**：T004
- **Phase**：Phase 2：统一正式写边界与 recovery operation
- **goal**：三类 recovery kind 由同一 registry 和解释器消费且不修改用户内容。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/review-flow-reset/spec.md","hash":"b3b3b50f908e4a77d748bf5c83d9235cb8aa02f162b089bf332e97329a43b4a1","id":"FR-RECOVERY-001"},{"artifact_kind":"plan","ref":"specs/review-flow-reset/plan.md","hash":"c9dcb667ad65706e3ea2352c6ec7bca9f7555940980255ae5bdc9f14a06bede0","id":"T004"}]`
- **输入**：T003 RED。
- **依赖**：T003
- **并行**：否 — 共享 recovery core。
- **FR**：FR-PREFLIGHT-001、FR-PREFLIGHT-002、FR-RECOVERY-001、FR-RECOVERY-002、FR-RECOVERY-003
- **AC**：AC-03、AC-04、AC-08、AC-09、AC-10
- **动作**：扩展 v1 registry/schema/validator/TaskHandle/CLI；dirty-cleanup-rebind 只追加元数据，rollback 排除 worktree。
- **精确文件**：`core/task-recovery.mjs`、`core/schemas/workflowhub-recovery-credential.v1.json`、`core/schemas/workflowhub-recovery-generation.v1.json`、`core/task-handle.mjs`、`core/stage-runner.mjs`、`skills/wh-review/scripts/integration-review-subject.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`core/task-kernel-implementation.mjs`、`core/canonical-receipt-writer.mjs`、`core/workspace.mjs`、`core/task-close.mjs`、`scripts/task-recovery.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`core/__tests__/task-recovery.test.mjs`、`core/__tests__/task-handle.test.mjs`、`core/__tests__/workspace-manager.test.mjs`、`scripts/__tests__/task-recovery.test.mjs`、`tests/task-close-delivery.test.mjs`、`tests/terminal-runtime-blockers.test.mjs`
- **boundary**：保持 schema version v1；不新增 pointer/storage/v2，不执行 Git reset/cleanup。
- **输出**：workflowhub-recovery-operation.v1 三类 operation。
- **Knowledge**：workspace_subject 与其他 subject 互斥。
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`npx vitest run core/__tests__/task-recovery.test.mjs core/__tests__/task-handle.test.mjs core/__tests__/workspace-manager.test.mjs scripts/__tests__/task-recovery.test.mjs tests/task-close-delivery.test.mjs tests/terminal-runtime-blockers.test.mjs`
- **expected_exit**：0
- **oracle**：OR-RECOVERY — parity 完全一致、旧 v1 通过、未知 kind fail-loud、replay 幂等、CAS 零半状态、worktree 不变。
- **evidence_path**：`apply/evidence/recovery-operation-contract-green.stdout`、`apply/evidence/recovery-operation-contract-green.stderr`
- **STOP**：需要第二状态机、未授权删除/reset、弱化正常 close 或覆盖 dirty 用户字节。
- **recovery**：撤回 interpreter 适配和调用点，保留用户文件。
- **task risk**：多个白名单再次漂移。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：正式 CLI 签发/消费 content-addressed recovery credential；authorization 强绑定 purpose、subject hash、旧/新 Workspace、Git identity、artifact refs；normal close 使用 authenticated effective Workspace 并安全 detach 旧脏 worktree，保留用户字节。
- **executed_commands**：最终精确 gate 6/6 files、141/141 tests、exit 0；真实 CLI 17/17；task-close 33/33；4 个 `node --check`、`git diff --check` 通过；allowlist 12 paths、unexpected=[]。
- **evidence_refs**：implementation commit `dd51a5a92074d52647b9d6cae569202b21bed7df`；Phase 2 GREEN 输出；独立 review finding 修复记录。
- **covered_ac**：AC-03、AC-04、AC-08、AC-09、AC-10。
- **review_fact**：原 `revise_required` 保留；credential producer、authorization binding、effective close 三项 blocking finding 已修；按 single-review 规则未二审；formal review unavailable 已如实记录。
- **completed_at**：2026-07-29T10:05:38Z

### Verify

- **Target**：AC-08 至 AC-10，并回归 AC-03、AC-04。
- **gate_cmd**：与 T003/T004 相同。
- **expected_exit**：0
- **evidence_path**：`apply/evidence/recovery-operation-contract-green.stdout`
- **display_cmd**：N/A — gate output is sufficient
- **Oracle**：OR-RECOVERY

### Knowledge

- 旧 credential/generation v1 保持原字节语义。

### STOP

- 需要 v2 影子格式、Git cleanup/reset 或覆盖第三方 pointer。

### Done

- T003/T004 完成区真实填写；三类 kind 由同一解释器消费。

### Risks and rollback

- **Risk**：白名单漂移。
- **Prevention**：逐层 parity 测试。
- **Rollback / recovery**：撤回第三种 kind 元数据。

## Phase 3：技能、材料与快照同源

### Goal

provider 前本地材料 fail-loud，五类记录同字节同快照。

### Files

- **NEW**：N/A — 扩展现有测试。
- **MODIFY**：`core/local-skill-resolver.mjs`、`core/capability-doctor.mjs`、`core/stage-skill-runtime.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`core/stage-runner.mjs`、`skills/wh-review/scripts/integration-review-subject.mjs`、`core/receipt-writer.mjs`、`core/canonical-receipt-writer.mjs`、`core/task-kernel-implementation.mjs`、`core/build-spec-receipt-recovery.mjs`、`scripts/stage-runtime.mjs`、`core/__tests__/local-skill-resolver.test.mjs`、`core/__tests__/capability-doctor.test.mjs`、`core/__tests__/stage-skill-runtime.test.mjs`、`core/__tests__/receipt-writer.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`scripts/__tests__/stage-runtime-spec-recovery.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- **DO NOT TOUCH**：`config/review-providers.json`

### Tasks

#### T005 — RED：locator、材料与跨快照

- **ID**：T005
- **Phase**：Phase 3：技能、材料与快照同源
- **goal**：复现 locator、材料、anchor 和五类同源链缺口。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/review-flow-reset/spec.md","hash":"b3b3b50f908e4a77d748bf5c83d9235cb8aa02f162b089bf332e97329a43b4a1","id":"FR-MATERIAL-001"},{"artifact_kind":"plan","ref":"specs/review-flow-reset/plan.md","hash":"c9dcb667ad65706e3ea2352c6ec7bca9f7555940980255ae5bdc9f14a06bede0","id":"T005"}]`
- **输入**：现有 resolver/doctor/material/writer/review runner。
- **依赖**：T004
- **并行**：否 — 依赖 recovery/close 边界。
- **FR**：FR-SKILL-001、FR-MATERIAL-001、FR-ATOMIC-001
- **AC**：AC-05、AC-06、AC-07
- **动作**：新增错 locator、空 input、缺 map、非法/多 anchor、跨字节/快照 receipt/review/attempt/checkpoint 测试。
- **精确文件**：`core/__tests__/local-skill-resolver.test.mjs`、`core/__tests__/capability-doctor.test.mjs`、`core/__tests__/stage-skill-runtime.test.mjs`、`core/__tests__/receipt-writer.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`scripts/__tests__/stage-runtime-spec-recovery.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- **boundary**：只改测试；不改 resolver/material/provider/writer。
- **输出**：OR-LOCAL-BEFORE-PROVIDER RED。
- **Knowledge**：provider_calls=0 仅适用于本地材料/anchor preflight。
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`npx vitest run core/__tests__/local-skill-resolver.test.mjs core/__tests__/capability-doctor.test.mjs core/__tests__/stage-skill-runtime.test.mjs core/__tests__/receipt-writer.test.mjs core/__tests__/task-kernel-publish.test.mjs scripts/__tests__/stage-runtime-spec-recovery.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- **expected_exit**：1
- **oracle**：OR-LOCAL-BEFORE-PROVIDER — 本地错误创建 provider call/attempt、doctor gate 或任一路接受跨字节/快照证据即命中。
- **evidence_path**：`apply/evidence/skill-material-atomicity-red.stdout`、`apply/evidence/skill-material-atomicity-red.stderr`
- **STOP**：失败来自真实 provider/网络、fixture setup 或无法区分本地 preflight。
- **recovery**：修正本地 fixture，禁止调用 provider 追 RED。
- **task risk**：把长锁漂移错误纳入零调用范围。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：构造 locator 原始 ENOENT、doctor 阻断、材料/anchor dispatch 前失败、跨 snapshot 复用、orphan `recover-spec-receipt`、stale base consumer 和旧 invocation replay 的真实 RED。
- **executed_commands**：初始 recovery gate 7/7 fail，真实命中缺 CLI/TaskKernel writer；审查 finding RED 命中 doctor/locator 5 failures 与旧 invocation replay。最终 Phase 3 exact gate 7/7 files、153/153 tests、exit 0。
- **evidence_refs**：implementation commit `1832c4c4f1ab6979e5d6aeb2f0c31b3cbfd52697`；Phase 3 RED/GREEN 输出；一次独立 review 三项 major finding 及修复记录。
- **covered_ac**：AC-05、AC-06、AC-07。
- **review_fact**：独立 Phase review 原 verdict=`revise_required`；doctor gate、双 locator、旧 invocation capability 三项 major finding 已修，原 verdict 保留；未二审；formal canonical review unavailable。
- **completed_at**：2026-07-29T11:00:11Z

#### T006 — GREEN：单源诊断与同快照

- **ID**：T006
- **Phase**：Phase 3：技能、材料与快照同源
- **goal**：resolver/doctor 同源、本地 preflight 先于 provider、五类记录同快照。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/review-flow-reset/spec.md","hash":"b3b3b50f908e4a77d748bf5c83d9235cb8aa02f162b089bf332e97329a43b4a1","id":"FR-MATERIAL-001"},{"artifact_kind":"plan","ref":"specs/review-flow-reset/plan.md","hash":"c9dcb667ad65706e3ea2352c6ec7bca9f7555940980255ae5bdc9f14a06bede0","id":"T006"}]`
- **输入**：T005 RED。
- **依赖**：T005
- **并行**：否 — 共享 resolver/writer/review files。
- **FR**：FR-SKILL-001、FR-MATERIAL-001、FR-ATOMIC-001
- **AC**：AC-05、AC-06、AC-07
- **动作**：统一诊断 schema，doctor warn-only；provider 前验证材料；五类记录拒绝旧字节/快照。
- **精确文件**：`core/local-skill-resolver.mjs`、`core/capability-doctor.mjs`、`core/stage-skill-runtime.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`core/stage-runner.mjs`、`skills/wh-review/scripts/integration-review-subject.mjs`、`core/receipt-writer.mjs`、`core/canonical-receipt-writer.mjs`、`core/task-kernel-implementation.mjs`、`core/build-spec-receipt-recovery.mjs`、`core/stage-handlers.mjs`、`scripts/stage-runtime.mjs`、`core/__tests__/local-skill-resolver.test.mjs`、`core/__tests__/capability-doctor.test.mjs`、`core/__tests__/stage-skill-runtime.test.mjs`、`core/__tests__/receipt-writer.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`scripts/__tests__/stage-runtime-spec-recovery.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- **boundary**：不加 fallback、doctor gate、caller provider 或弱恢复特例。
- **输出**：单源诊断与 artifact/receipt/review/attempt/checkpoint 同源链。
- **Knowledge**：receipt-writer 是 step 原子写入口。
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`npx vitest run core/__tests__/local-skill-resolver.test.mjs core/__tests__/capability-doctor.test.mjs core/__tests__/stage-skill-runtime.test.mjs core/__tests__/receipt-writer.test.mjs core/__tests__/task-kernel-publish.test.mjs scripts/__tests__/stage-runtime-spec-recovery.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- **expected_exit**：0
- **oracle**：OR-LOCAL-BEFORE-PROVIDER — locator 固定诊断、doctor warn-only、本地错误零调用；五类记录拒绝跨字节/快照。
- **evidence_path**：`apply/evidence/skill-material-atomicity-green.stdout`、`apply/evidence/skill-material-atomicity-green.stderr`
- **STOP**：需要 fallback、doctor 启动 gate、provider route 改动或材料错误已调用 provider。
- **recovery**：撤回新增调用，保留 provider/task records。
- **task risk**：同源校验在多个 consumer 漂移。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：统一 resolver/doctor diagnostic，doctor enforcement=`advisory`；本地材料失败零 provider 调用；receipt/review/attempt/checkpoint 同快照；补齐 build-spec receipt recovery CLI、create-only TaskKernel writer、stale-base consumer；用模块私有 WeakMap one-shot owner capability 拒绝 clone/旧 record/错 operation/reuse。
- **executed_commands**：最终 exact gate 7/7 files、153/153 tests、exit 0；5-stage local skill smoke 通过；16 个 `.mjs` `node --check`、`git diff --check`、Phase 3 allowlist 通过。
- **evidence_refs**：implementation commit `1832c4c4f1ab6979e5d6aeb2f0c31b3cbfd52697`；Phase 3 GREEN 输出；独立 review finding 修复记录。
- **covered_ac**：AC-05、AC-06、AC-07。
- **review_fact**：原 `revise_required` 保留；3 个 major finding RED→GREEN；按 single-review 规则未二审；formal review unavailable 已如实记录。
- **completed_at**：2026-07-29T11:00:11Z

### Verify

- **Target**：AC-05 至 AC-07
- **gate_cmd**：与 T005/T006 相同。
- **expected_exit**：0
- **evidence_path**：`apply/evidence/skill-material-atomicity-green.stdout`
- **display_cmd**：N/A — gate output is sufficient
- **Oracle**：OR-LOCAL-BEFORE-PROVIDER

### Knowledge

- receipt-writer 是 step 原子写入口。

### STOP

- 需要 fallback、doctor gate 或 provider route 改动。

### Done

- T005/T006 完成区真实填写；五类记录同源。

### Risks and rollback

- **Risk**：零调用边界被扩大。
- **Prevention**：窄 fixture。
- **Rollback / recovery**：撤回新增调用，保留本地审计。

## Phase 4：单核心、attempt-N 与 review-flow reset

### Goal

support 不制造第二核心；step 重试和 review generation 保持单一 authority。

### Files

- **NEW**：`docs/adr/0011-authenticated-review-flow-generations.md`
- **MODIFY**：`core/task-kernel-implementation.mjs`、`core/task-handle.mjs`、`core/audit-aggregator.mjs`、`core/canonical-receipt-writer.mjs`、`core/stage-runner.mjs`、`skills/wh-review/scripts/integration-review-subject.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`core/review-flow-authority.mjs`、`skills/wh-review/scripts/review-controller.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`core/__tests__/task-handle.test.mjs`、`core/__tests__/receipt-writer.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- **DO NOT TOUCH**：`config/review-providers.json`、历史 generation bytes。

### Tasks

#### T007 — RED：核心 publication、attempt 与 review lifecycle

- **ID**：T007
- **Phase**：Phase 4：单核心、attempt-N 与 review-flow reset
- **goal**：复现 support 卡死、核心假绿、caller attempt、consumer 重裁、错误复用和非法 reset。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/review-flow-reset/spec.md","hash":"b3b3b50f908e4a77d748bf5c83d9235cb8aa02f162b089bf332e97329a43b4a1","id":"FR-CORE-001"},{"artifact_kind":"plan","ref":"specs/review-flow-reset/plan.md","hash":"c9dcb667ad65706e3ea2352c6ec7bca9f7555940980255ae5bdc9f14a06bede0","id":"T007"}]`
- **输入**：现有 publication、journal 和 review-flow authority。
- **依赖**：T006
- **并行**：否 — 集成前置 Phase。
- **FR**：FR-CORE-001、FR-ATTEMPT-001、FR-REVIEW-001、FR-REVIEW-002
- **AC**：AC-11、AC-12、AC-13、AC-14、AC-15、AC-16
- **动作**：新增 support missing、结构错误、target attempt-N、canonical consumer、reuse policy 和 reset append-only 测试。
- **精确文件**：`core/__tests__/task-kernel-publish.test.mjs`、`core/__tests__/task-handle.test.mjs`、`core/__tests__/receipt-writer.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- **boundary**：只改测试；不改 publication/journal/review 实现或 provider config。
- **输出**：OR-CORE-REVIEW RED。
- **Knowledge**：producer 是唯一质量语义源。
- **verification_role**：RED
- **paired_task**：T008
- **gate_cmd**：`npx vitest run core/__tests__/task-kernel-publish.test.mjs core/__tests__/task-handle.test.mjs core/__tests__/receipt-writer.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- **expected_exit**：1
- **oracle**：OR-CORE-REVIEW — support 阻断、核心假绿、caller 跳 attempt、consumer 重裁、未变 subject 调 provider 或 reset 改旧链即命中。
- **evidence_path**：`apply/evidence/stage-core-review-flow-red.stdout`、`apply/evidence/stage-core-review-flow-red.stderr`
- **STOP**：RED 依赖真实 provider、失败来自 setup 或需改旧 canonical bytes。
- **recovery**：修正本地 fixture，不调用 provider 追 verdict。
- **task risk**：把 review unavailable 伪装成 pass。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：构造 support missing/伪造、核心 decision 缺失/错绑、caller attempt、target attempt-N、canonical verdict 篡改、policy 变化误复用、非法/缺口 generation reset 的真实 RED。
- **executed_commands**：RED 分别命中 policy-change 错误复用、缺 decision accepted、合法 retry 被 audit 判失败、reset generation gap 静默回退；最终更新后 exact gate 4 files、171/171 tests、exit 0。
- **evidence_refs**：implementation commit `c111509d8c85cb3dd058d45c14a34ae926535d46`；Phase 4 RED/GREEN 输出；一次独立 review 三项 major finding 及修复记录。
- **covered_ac**：AC-11、AC-12、AC-13、AC-14、AC-15、AC-16。
- **review_fact**：独立 Phase review 原 verdict=`revise_required`；decision、retry audit、generation gap 三项 major finding 已修，原 verdict 保留；未二审；formal canonical review unavailable。
- **completed_at**：2026-07-29T11:58:33Z

#### T008 — GREEN：单核心与合法 generation

- **ID**：T008
- **Phase**：Phase 4：单核心、attempt-N 与 review-flow reset
- **goal**：核心错误真失败，step attempt-N 和 review reuse/reset 由单一 authority 派生。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/review-flow-reset/spec.md","hash":"b3b3b50f908e4a77d748bf5c83d9235cb8aa02f162b089bf332e97329a43b4a1","id":"FR-CORE-001"},{"artifact_kind":"plan","ref":"specs/review-flow-reset/plan.md","hash":"c9dcb667ad65706e3ea2352c6ec7bca9f7555940980255ae5bdc9f14a06bede0","id":"T008"}]`
- **输入**：T007 RED。
- **依赖**：T007
- **并行**：否 — 共享 kernel/review files。
- **FR**：FR-CORE-001、FR-ATTEMPT-001、FR-REVIEW-001、FR-REVIEW-002
- **AC**：AC-11、AC-12、AC-13、AC-14、AC-15、AC-16
- **动作**：核心/support 分层；kernel 派生 target attempt-N；consumer 只认证；相同 subject 复用，结构变化 append-only reset。
- **精确文件**：`core/task-kernel-implementation.mjs`、`core/task-handle.mjs`、`core/audit-aggregator.mjs`、`core/canonical-receipt-writer.mjs`、`core/stage-runner.mjs`、`skills/wh-review/scripts/integration-review-subject.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`core/review-flow-authority.mjs`、`skills/wh-review/scripts/review-controller.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`core/__tests__/task-handle.test.mjs`、`core/__tests__/receipt-writer.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`docs/adr/0011-authenticated-review-flow-generations.md`
- **boundary**：不重写旧 generation，不改 provider route/双 track/人工确认，不建平行 review state。
- **输出**：单核心、target attempt-N、canonical outcome 和合法 generation。
- **Knowledge**：每代最多一次 structural full review。
- **verification_role**：GREEN
- **paired_task**：T007
- **gate_cmd**：`npx vitest run core/__tests__/task-kernel-publish.test.mjs core/__tests__/task-handle.test.mjs core/__tests__/receipt-writer.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- **expected_exit**：0
- **oracle**：OR-CORE-REVIEW — support missing 可继续、结构错绑失败、只目标 attempt-N、未变零调用、reset append-only。
- **evidence_path**：`apply/evidence/stage-core-review-flow-green.stdout`、`apply/evidence/stage-core-review-flow-green.stderr`
- **STOP**：需要 consumer 重扫 provider、accepted reset、旧链改写、provider route 或确认变化。
- **recovery**：撤回实现，保留旧 flow bytes 和 T007 RED。
- **task risk**：reset 被用于循环重审。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：核心 decision 必须 canonical ref/hash/bytes 同源，support audit 缺失非 gate；kernel 派生并认证 target attempt-N；consumer 只认证 canonical verdict；policy fingerprint 进入 reuse/lock/request ID；structural resolution 正式触发 append-only generation reset；TaskHandle 窄枚举保证 reset namespace 连续。
- **executed_commands**：最终 exact gate `CI=1 npx vitest run core/__tests__/task-kernel-publish.test.mjs core/__tests__/task-handle.test.mjs core/__tests__/receipt-writer.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs` → 4 files、171/171、exit 0；12 files `node --check`、`git diff --check`、allowlist unexpected=[]。
- **evidence_refs**：implementation commit `c111509d8c85cb3dd058d45c14a34ae926535d46`；Phase 4 GREEN 输出；ADR 0011；独立 review finding 修复记录。
- **covered_ac**：AC-11、AC-12、AC-13、AC-14、AC-15、AC-16。
- **review_fact**：原 `revise_required` 保留；3 个 major RED→GREEN；按 single-review 规则未二审；formal review unavailable 已如实记录。
- **completed_at**：2026-07-29T11:58:33Z

### Verify

- **Target**：AC-11 至 AC-16
- **gate_cmd**：与 T007/T008 相同。
- **expected_exit**：0
- **evidence_path**：`apply/evidence/stage-core-review-flow-green.stdout`
- **display_cmd**：N/A — gate output is sufficient
- **Oracle**：OR-CORE-REVIEW

### Knowledge

- reset 扩展现有 TaskKernel/review authority。

### STOP

- accepted reset、旧链改写、caller provider 或新状态机。

### Done

- T007/T008 完成区真实填写；核心错误真失败且 reset 合法。

### Risks and rollback

- **Risk**：reset 成为循环重审入口。
- **Prevention**：每代最多一次 full、旧代拒写。
- **Rollback / recovery**：保留旧 flow bytes 和 RED。

## Phase 5：五阶段流程完成与人类交接

### Goal

clarify、review、摘要、任务状态和来源覆盖均来自当前真实材料。

### Files

- **NEW**：N/A — 扩展现有材料和测试。
- **MODIFY**：`core/stage-context.mjs`、`core/workspace.mjs`、`core/canonical-receipt-writer.mjs`、`core/task-kernel-implementation.mjs`、`contracts/facts-subschema.json`、`core/schemas/task-attempt.v2.schema.json`、`core/schemas/ambiguity-ledger.v2.json`、`core/schemas/stage-completion-facts.v1.json`、`core/stage-content-evidence.mjs`、`core/stage-content-contracts.mjs`、`core/stage-completion-facts.mjs`、`core/stage-handlers.mjs`、`core/stage-runner.mjs`、`skills/wh-review/scripts/integration-review-subject.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`scripts/stage-runtime.mjs`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-spec/steps.json`、`workflows/build-plan/SKILL.md`、`workflows/build-plan/steps.json`、`workflows/build-code/SKILL.md`、`workflows/build-code/steps.json`、`workflows/build-code/phase-evidence.mjs`、`workflows/verify-code/SKILL.md`、`workflows/verify-code/steps.json`、`core/__tests__/stage-context.test.mjs`、`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`、`tests/stage-completion-facts.test.mjs`、`tests/interaction-quality-contract.test.mjs`、`tests/stage-plan-task-contract-v3.test.mjs`、`tests/official-component-receipts.test.mjs`、`tests/build-code-phase-evidence.test.mjs`、`tests/five-stage-facts-v2.test.mjs`、`tests/facts-subschema.test.mjs`、`specs/review-flow-reset/spec.md`、`specs/review-flow-reset/plan.md`、`specs/review-flow-reset/tasks.md`、`skills/spec-tasks/SKILL.md`、`skills/spec-tasks/templates/tasks-template.md`
- **DO NOT TOUCH**：`config/review-providers.json`、历史正式记录。

### Tasks

#### T009 — RED：clarify、review、summary、任务状态与来源覆盖

- **ID**：T009
- **Phase**：Phase 5：五阶段流程完成与人类交接
- **goal**：复现漏组件、漏摘要、来源丢失和未执行 Task 被自动完成。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/review-flow-reset/spec.md","hash":"b3b3b50f908e4a77d748bf5c83d9235cb8aa02f162b089bf332e97329a43b4a1","id":"FR-PROCESS-002"},{"artifact_kind":"plan","ref":"specs/review-flow-reset/plan.md","hash":"c9dcb667ad65706e3ea2352c6ec7bca9f7555940980255ae5bdc9f14a06bede0","id":"T009"}]`
- **输入**：五阶段 Skill、completion facts、当前 spec/plan/tasks。
- **依赖**：T008
- **并行**：否 — 当前材料是权威输入。
- **FR**：FR-PROCESS-001、FR-PROCESS-002、FR-HANDOFF-001、FR-VERIFY-001
- **AC**：AC-17、AC-18、AC-19、AC-20、AC-21
- **动作**：新增 ambiguity/clarify、五阶段 review、组件状态、build-plan 摘要、30 source、Task 完成区和 stale evidence 测试。
- **精确文件**：`core/__tests__/stage-context.test.mjs`、`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`、`tests/stage-completion-facts.test.mjs`、`tests/interaction-quality-contract.test.mjs`、`tests/stage-plan-task-contract-v3.test.mjs`、`tests/official-component-receipts.test.mjs`、`tests/build-code-phase-evidence.test.mjs`、`tests/five-stage-facts-v2.test.mjs`、`tests/facts-subschema.test.mjs`
- **boundary**：只改测试；不改 runtime、Skill、正式 records，不调用 provider。
- **输出**：OR-PROCESS-HANDOFF RED。
- **Knowledge**：tasks.md 是唯一完成状态，runtime 不代替勾选。
- **verification_role**：RED
- **paired_task**：T010
- **gate_cmd**：`npx vitest run core/__tests__/stage-context.test.mjs scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs tests/stage-completion-facts.test.mjs tests/interaction-quality-contract.test.mjs tests/stage-plan-task-contract-v3.test.mjs tests/official-component-receipts.test.mjs tests/build-code-phase-evidence.test.mjs tests/five-stage-facts-v2.test.mjs tests/facts-subschema.test.mjs`
- **expected_exit**：1
- **oracle**：OR-PROCESS-HANDOFF — 漏组件、summary 缺项、来源差集、未勾任务被完成或 accepted 自动改变状态即命中。
- **evidence_path**：`apply/evidence/five-stage-process-handoff-red.stdout`、`apply/evidence/five-stage-process-handoff-red.stderr`
- **STOP**：失败来自格式噪声而非行为、需要真实 provider 或新增人工确认。
- **recovery**：收窄 fixture 到声明组件、任务状态与来源矩阵。
- **task risk**：validator 成为进入/继续 gate。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`["core/__tests__/stage-context.test.mjs","scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs","tests/stage-completion-facts.test.mjs","tests/interaction-quality-contract.test.mjs","tests/stage-plan-task-contract-v3.test.mjs","tests/official-component-receipts.test.mjs","tests/build-code-phase-evidence.test.mjs","tests/five-stage-facts-v2.test.mjs","tests/facts-subschema.test.mjs"]`
- **executed_commands**：`[{"command":"npx vitest run core/__tests__/stage-context.test.mjs scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs tests/stage-completion-facts.test.mjs tests/interaction-quality-contract.test.mjs tests/stage-plan-task-contract-v3.test.mjs tests/official-component-receipts.test.mjs tests/build-code-phase-evidence.test.mjs tests/five-stage-facts-v2.test.mjs tests/facts-subschema.test.mjs","exit_code":1},{"command":"npx vitest run core/__tests__/stage-context.test.mjs scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs tests/stage-completion-facts.test.mjs tests/interaction-quality-contract.test.mjs tests/stage-plan-task-contract-v3.test.mjs tests/official-component-receipts.test.mjs tests/build-code-phase-evidence.test.mjs tests/five-stage-facts-v2.test.mjs tests/facts-subschema.test.mjs","exit_code":0}]`
- **evidence_refs**：`[{"ref":"tests/stage-plan-task-contract-v3.test.mjs","sha256":"24094ec5c9773f261ec83c86086b06f6ec90e8641c2dd8309186dcaa105c9230"},{"ref":"scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs","sha256":"1145e72bff363424f53d2bd8aad64390057fd0ee228ff9c9a6bbbdc9b66689a4"}]`
- **covered_ac**：AC-17、AC-18、AC-19、AC-20、AC-21
- **review_fact**：Phase 5 一次独立审查原 verdict=`revise_required`；2 个 major finding 与 1 个 boundary finding 已修；按 single-review 规则未二审。
- **completed_at**：2026-07-29T14:19:45Z

#### T010 — GREEN：同源完成事实与人类交接

- **ID**：T010
- **Phase**：Phase 5：五阶段流程完成与人类交接
- **goal**：五阶段组件、摘要、来源和唯一 Task 状态均从真实当前事实产生。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/review-flow-reset/spec.md","hash":"b3b3b50f908e4a77d748bf5c83d9235cb8aa02f162b089bf332e97329a43b4a1","id":"FR-PROCESS-002"},{"artifact_kind":"plan","ref":"specs/review-flow-reset/plan.md","hash":"c9dcb667ad65706e3ea2352c6ec7bca9f7555940980255ae5bdc9f14a06bede0","id":"T010"}]`
- **输入**：T009 RED。
- **依赖**：T009
- **并行**：否 — 共享 completion/runtime/material files。
- **FR**：FR-PROCESS-001、FR-PROCESS-002、FR-HANDOFF-001、FR-VERIFY-001
- **AC**：AC-17、AC-18、AC-19、AC-20、AC-21
- **动作**：闭合 clarify/review/components/summary/source；生成新 tasks template；runtime 只读认证完成区，并支持 review 后只修改对应 Task 填写区的 tasks-only completion seam，由下一 Phase/最终 integration 认证且不重复 Phase review。
- **精确文件**：`core/stage-context.mjs`、`core/workspace.mjs`、`core/canonical-receipt-writer.mjs`、`core/task-kernel-implementation.mjs`、`contracts/facts-subschema.json`、`core/schemas/task-attempt.v2.schema.json`、`core/schemas/ambiguity-ledger.v2.json`、`core/schemas/stage-completion-facts.v1.json`、`core/stage-content-evidence.mjs`、`core/stage-content-contracts.mjs`、`core/stage-completion-facts.mjs`、`core/stage-handlers.mjs`、`core/stage-runner.mjs`、`skills/wh-review/scripts/integration-review-subject.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`scripts/stage-runtime.mjs`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-spec/steps.json`、`workflows/build-plan/SKILL.md`、`workflows/build-plan/steps.json`、`workflows/build-code/SKILL.md`、`workflows/build-code/steps.json`、`workflows/build-code/phase-evidence.mjs`、`workflows/verify-code/SKILL.md`、`workflows/verify-code/steps.json`、`core/__tests__/stage-context.test.mjs`、`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`、`tests/stage-completion-facts.test.mjs`、`tests/interaction-quality-contract.test.mjs`、`tests/stage-plan-task-contract-v3.test.mjs`、`tests/official-component-receipts.test.mjs`、`tests/build-code-phase-evidence.test.mjs`、`tests/five-stage-facts-v2.test.mjs`、`tests/facts-subschema.test.mjs`、`specs/review-flow-reset/spec.md`、`specs/review-flow-reset/plan.md`、`specs/review-flow-reset/tasks.md`、`skills/spec-tasks/SKILL.md`、`skills/spec-tasks/templates/tasks-template.md`
- **boundary**：不新增正常确认，不把 unavailable 写成 pass，不安排全量/provider 重审，不自动勾选 Task。
- **输出**：五阶段同源 completion 和可读 build-plan 交接。
- **Knowledge**：30 source、18 FR、21 AC、12 Task 必须双向闭合。
- **verification_role**：GREEN
- **paired_task**：T009
- **gate_cmd**：`npx vitest run core/__tests__/stage-context.test.mjs scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs tests/stage-completion-facts.test.mjs tests/interaction-quality-contract.test.mjs tests/stage-plan-task-contract-v3.test.mjs tests/official-component-receipts.test.mjs tests/build-code-phase-evidence.test.mjs tests/five-stage-facts-v2.test.mjs tests/facts-subschema.test.mjs`
- **expected_exit**：0
- **oracle**：OR-PROCESS-HANDOFF — 五阶段组件闭合、summary 易懂、30 source 差集为空、Task 状态唯一且不被自动改变；review 后 tasks-only completion 只触及对应填写区、引用同一证据并且不会触发循环重审。
- **evidence_path**：`apply/evidence/five-stage-process-handoff-green.stdout`、`apply/evidence/five-stage-process-handoff-green.stderr`
- **STOP**：需要新增确认、unavailable→pass、support ledger 否定正文、最终全量/provider 重审或第二完成状态。
- **recovery**：回退投影/runtime/template改动，保持 Task in_progress。
- **task risk**：材料 hash 更新后 versioned_refs stale。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`["contracts/facts-subschema.json","core/__tests__/stage-context.test.mjs","core/canonical-receipt-writer.mjs","core/schemas/ambiguity-ledger.v2.json","core/schemas/stage-completion-facts.v1.json","core/stage-completion-facts.mjs","core/stage-content-contracts.mjs","core/stage-context.mjs","core/stage-handlers.mjs","core/stage-runner.mjs","core/task-kernel-implementation.mjs","core/workspace.mjs","scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs","scripts/stage-runtime.mjs","skills/spec-tasks/SKILL.md","skills/spec-tasks/templates/tasks-template.md","skills/wh-review/scripts/integration-review-subject.mjs","skills/wh-review/scripts/review-materials.mjs","tests/build-code-phase-evidence.test.mjs","tests/facts-subschema.test.mjs","tests/five-stage-facts-v2.test.mjs","tests/interaction-quality-contract.test.mjs","tests/official-component-receipts.test.mjs","tests/stage-completion-facts.test.mjs","tests/stage-plan-task-contract-v3.test.mjs","workflows/build-code/SKILL.md","workflows/build-code/phase-evidence.mjs","workflows/build-code/steps.json","workflows/build-plan/SKILL.md","workflows/build-plan/steps.json","workflows/build-spec/SKILL.md","workflows/build-spec/steps.json","workflows/make-decision/SKILL.md","workflows/verify-code/SKILL.md","workflows/verify-code/steps.json"]`
- **executed_commands**：`[{"command":"npx vitest run core/__tests__/stage-context.test.mjs scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs tests/stage-completion-facts.test.mjs tests/interaction-quality-contract.test.mjs tests/stage-plan-task-contract-v3.test.mjs tests/official-component-receipts.test.mjs tests/build-code-phase-evidence.test.mjs tests/five-stage-facts-v2.test.mjs tests/facts-subschema.test.mjs","exit_code":0},{"command":"git diff --check","exit_code":0}]`
- **evidence_refs**：`[{"ref":"workflows/build-code/phase-evidence.mjs","sha256":"63936f0bf8cf36f8c68527ccdb48735d8b673663f38bb4b4d8c53107467f8a5a"},{"ref":"core/stage-handlers.mjs","sha256":"0f8030def37bbf3eda5f3a1254c872401de1cd422235733414ec5c5bf6e0717a"},{"ref":"skills/wh-review/scripts/integration-review-subject.mjs","sha256":"9466c0c1cd437e509b9a8ed727cfce289fcbf7b19feb28cd08faf59f4902bb73"}]`
- **covered_ac**：AC-17、AC-18、AC-19、AC-20、AC-21
- **review_fact**：Phase 5 一次独立审查原 verdict=`revise_required`；seam 已绑定精确 Phase Task IDs 与真实 implementation/test/review refs；completion 已交叉认证 diff、命令/exit、review、AC；boundary 已修正；未二审。
- **completed_at**：2026-07-29T14:19:45Z

### Verify

- **Target**：AC-17 至 AC-21；30 source、18 FR、21 AC、12 Task。
- **gate_cmd**：与 T009/T010 相同。
- **expected_exit**：0
- **evidence_path**：`apply/evidence/five-stage-process-handoff-green.stdout`
- **display_cmd**：N/A — deterministic material facts are the oracle
- **Oracle**：OR-PROCESS-HANDOFF

### Knowledge

- tasks.md 是唯一 Task 状态，runtime 只读认证。

### STOP

- 新增正常确认、摘要补造执行事实或历史记录自动勾选。

### Done

- T009/T010 完成区真实填写；五阶段组件、摘要和来源闭合。

### Risks and rollback

- **Risk**：validator 自己成为推进 gate。
- **Prevention**：只约束 completed 声明，不阻止继续修复。
- **Rollback / recovery**：保持任务 in_progress。

## Phase 6：本轮质量坍塌修复与 build-code 重做

### Goal

对最终候选逐项补齐 21 AC，并真实完成 build-code。

### Files

- **NEW**：`apply/evidence/current-diff-ac-coverage.json`
- **MODIFY**：`core/__tests__/stage-context.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`tests/stage-completion-facts.test.mjs`、`tests/interaction-quality-contract.test.mjs`；生产文件候选白名单固定为 `core/write-boundary-preflight.mjs`、`core/invocation-identity.mjs`、`core/stage-context.mjs`、`core/task-handle.mjs`、`core/stage-runner.mjs`、`skills/wh-review/scripts/integration-review-subject.mjs`、`core/canonical-receipt-writer.mjs`、`core/task-recovery.mjs`、`core/task-close.mjs`、`scripts/stage-runtime.mjs`、`scripts/task-recovery.mjs`、`scripts/task-close.mjs`、`core/schemas/workflowhub-recovery-credential.v1.json`、`core/schemas/workflowhub-recovery-generation.v1.json`、`core/task-kernel-implementation.mjs`、`core/workspace.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`core/local-skill-resolver.mjs`、`core/capability-doctor.mjs`、`core/stage-skill-runtime.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`core/receipt-writer.mjs`、`core/audit-aggregator.mjs`、`core/review-flow-authority.mjs`、`skills/wh-review/scripts/review-controller.mjs`、`core/stage-content-evidence.mjs`、`core/stage-content-contracts.mjs`、`core/stage-completion-facts.mjs`、`core/stage-handlers.mjs`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/build-code/steps.json`、`workflows/verify-code/SKILL.md`、`skills/spec-tasks/SKILL.md`、`skills/spec-tasks/templates/tasks-template.md`；T012 只能启用其中被差距图标为 missing 或 contradicted 的文件。
- **DO NOT TOUCH**：provider config、历史 task records、`.git/`。

### Tasks

#### T011 — RED：当前候选完整性与差距图

- **ID**：T011
- **Phase**：Phase 6：本轮质量坍塌修复与 build-code 重做
- **goal**：为 18 FR、21 AC、12 Task、文件和测试建立当前差距图并复现假完成。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/review-flow-reset/spec.md","hash":"b3b3b50f908e4a77d748bf5c83d9235cb8aa02f162b089bf332e97329a43b4a1","id":"FR-VERIFY-001"},{"artifact_kind":"plan","ref":"specs/review-flow-reset/plan.md","hash":"c9dcb667ad65706e3ea2352c6ec7bca9f7555940980255ae5bdc9f14a06bede0","id":"T011"}]`
- **输入**：T010、当前候选 diff、30 source matrix。
- **依赖**：T010
- **并行**：否 — 必须基于最终 Phase 1–5 候选。
- **FR**：FR-IDENTITY-001、FR-PATH-001、FR-PREFLIGHT-001、FR-PREFLIGHT-002、FR-SKILL-001、FR-MATERIAL-001、FR-ATOMIC-001、FR-RECOVERY-001、FR-RECOVERY-002、FR-RECOVERY-003、FR-CORE-001、FR-ATTEMPT-001、FR-REVIEW-001、FR-REVIEW-002、FR-PROCESS-001、FR-PROCESS-002、FR-HANDOFF-001、FR-VERIFY-001
- **AC**：AC-01、AC-02、AC-03、AC-04、AC-05、AC-06、AC-07、AC-08、AC-09、AC-10、AC-11、AC-12、AC-13、AC-14、AC-15、AC-16、AC-17、AC-18、AC-19、AC-20、AC-21
- **动作**：建立 current-diff-ac-coverage；复现 automatic accepted、verify-only-read、Skill 步骤缺失和 completion evidence 缺失。
- **精确文件**：`apply/evidence/current-diff-ac-coverage.json`、`core/__tests__/stage-context.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`tests/stage-completion-facts.test.mjs`、`tests/interaction-quality-contract.test.mjs`
- **boundary**：只新增/修正差距图和测试；不改生产代码、历史 records、provider config。
- **输出**：OR-QUALITY-COMPLETION RED 和完整差距图。
- **Knowledge**：旧 live attempt、accepted 和局部 GREEN 不是完成证据。
- **verification_role**：RED
- **paired_task**：T012
- **gate_cmd**：`npx vitest run core/__tests__/stage-context.test.mjs core/__tests__/task-kernel-publish.test.mjs tests/stage-completion-facts.test.mjs tests/interaction-quality-contract.test.mjs -t "live_plan_execution|completion evidence|verify-code|current documents"`
- **expected_exit**：1
- **oracle**：OR-QUALITY-COMPLETION — 四材料逐一检查；任一缺失或不可读时未点名报错并停止，或缺核心交付、测试、逐 AC、review/真实 unavailable、交接、Task 完成填写时 accepted/live attempt 仍被报告完成，即命中。
- **evidence_path**：`apply/evidence/quality-completion-red.stdout`、`apply/evidence/quality-completion-red.stderr`、`apply/evidence/current-diff-ac-coverage.json`
- **STOP**：RED 只能靠全量、真实 provider、改历史 bytes 或扩大到未映射文件。
- **recovery**：收窄到当前 diff 和最小 fixture，保留撤回结论。
- **task risk**：差距图在后续共享文件变化后 stale。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — RED task is reviewed with T012 final integration result
- **completed_at**：N/A — not completed

#### T012 — GREEN：修复候选并真正完成 build-code

- **ID**：T012
- **Phase**：Phase 6：本轮质量坍塌修复与 build-code 重做
- **goal**：关闭 T011 的真实缺口并完成 build-code 交接。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/review-flow-reset/spec.md","hash":"b3b3b50f908e4a77d748bf5c83d9235cb8aa02f162b089bf332e97329a43b4a1","id":"FR-VERIFY-001"},{"artifact_kind":"plan","ref":"specs/review-flow-reset/plan.md","hash":"c9dcb667ad65706e3ea2352c6ec7bca9f7555940980255ae5bdc9f14a06bede0","id":"T012"}]`
- **输入**：T011 RED、差距图、T001–T010 当前完成事实。
- **依赖**：T011
- **并行**：否 — 最终收口。
- **FR**：FR-IDENTITY-001、FR-PATH-001、FR-PREFLIGHT-001、FR-PREFLIGHT-002、FR-SKILL-001、FR-MATERIAL-001、FR-ATOMIC-001、FR-RECOVERY-001、FR-RECOVERY-002、FR-RECOVERY-003、FR-CORE-001、FR-ATTEMPT-001、FR-REVIEW-001、FR-REVIEW-002、FR-PROCESS-001、FR-PROCESS-002、FR-HANDOFF-001、FR-VERIFY-001
- **AC**：AC-01、AC-02、AC-03、AC-04、AC-05、AC-06、AC-07、AC-08、AC-09、AC-10、AC-11、AC-12、AC-13、AC-14、AC-15、AC-16、AC-17、AC-18、AC-19、AC-20、AC-21
- **动作**：只修差距图标记的缺口；重跑受影响 GREEN；逐 AC 收口；做一次 integration review；在 build-code 最终收口前认证 T001–T012 的完成填写及其代码、测试、AC、review 证据；输出 build-code 大白话交接，并把同一 `tasks.md` 交给 verify-code 独立复核。
- **精确文件**：`apply/evidence/current-diff-ac-coverage.json`、`core/__tests__/stage-context.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`tests/stage-completion-facts.test.mjs`、`tests/interaction-quality-contract.test.mjs`、`core/write-boundary-preflight.mjs`、`core/invocation-identity.mjs`、`core/stage-context.mjs`、`core/task-handle.mjs`、`core/stage-runner.mjs`、`skills/wh-review/scripts/integration-review-subject.mjs`、`core/canonical-receipt-writer.mjs`、`core/task-recovery.mjs`、`core/task-close.mjs`、`scripts/stage-runtime.mjs`、`scripts/task-recovery.mjs`、`scripts/task-close.mjs`、`core/schemas/workflowhub-recovery-credential.v1.json`、`core/schemas/workflowhub-recovery-generation.v1.json`、`core/task-kernel-implementation.mjs`、`core/workspace.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`core/local-skill-resolver.mjs`、`core/capability-doctor.mjs`、`core/stage-skill-runtime.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`core/receipt-writer.mjs`、`core/audit-aggregator.mjs`、`core/review-flow-authority.mjs`、`skills/wh-review/scripts/review-controller.mjs`、`core/stage-content-evidence.mjs`、`core/stage-content-contracts.mjs`、`core/stage-completion-facts.mjs`、`core/stage-handlers.mjs`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/build-code/steps.json`、`workflows/verify-code/SKILL.md`、`skills/spec-tasks/SKILL.md`、`skills/spec-tasks/templates/tasks-template.md`；生产文件只启用被差距图标为 missing 或 contradicted 的子集，不得加入白名单外文件。
- **boundary**：不改 provider config、历史 records、`.git/`；不建新任务/状态机，不跑全量，不重复 review。
- **输出**：所有适用 AC 的当前证据、一次 integration review 和真实 build-code handoff。
- **Knowledge**：accepted 只表示记录；Task 完成只见本文件。
- **verification_role**：GREEN
- **paired_task**：T011
- **gate_cmd**：`npx vitest run core/__tests__/stage-context.test.mjs core/__tests__/task-kernel-publish.test.mjs tests/stage-completion-facts.test.mjs tests/interaction-quality-contract.test.mjs -t "live_plan_execution|completion evidence|verify-code|current documents"`
- **expected_exit**：0
- **oracle**：OR-QUALITY-COMPLETION — 四材料必须逐一存在且可读，否则点名文件并停止本次进入/继续；四材料齐全即可继续，但只有核心交付、聚焦测试、逐 AC、review/真实 unavailable、交接和 T001–T012 完成区齐全且经 build-code integration 认证才可完成；verify-code 必须对同一完成事实再做独立核对。
- **evidence_path**：`apply/evidence/quality-completion-green.stdout`、`apply/evidence/quality-completion-green.stderr`、`apply/evidence/current-diff-ac-coverage.json`
- **STOP**：需要删改历史、降低完成判据、把 verdict 当 pass、跑全量或重复 provider。
- **recovery**：回退未接受代码到 T011 边界，保留材料和历史记录。
- **task risk**：最终 diff 与证据 snapshot 漂移。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — final integration review not executed
- **completed_at**：N/A — not completed

### Verify

- **Target**：AC-01 至 AC-21；T001–T012 completion。
- **gate_cmd**：与 T011/T012 相同，随后只重跑受影响 Phase GREEN。
- **expected_exit**：0
- **evidence_path**：`apply/evidence/quality-completion-green.stdout`、`apply/evidence/current-diff-ac-coverage.json`
- **display_cmd**：`git diff --stat`
- **Oracle**：OR-QUALITY-COMPLETION

### Knowledge

- 旧 live attempt 和局部 GREEN 只是线索。

### STOP

- 只能靠全量、重复 provider 或改历史 bytes 得到结论。

### Done

- 21 AC 有当前证据；T001–T012 全部完成区已由 build-code integration 认证，并交给 verify-code 对同一 `tasks.md` 独立复核。

### Risks and rollback

- **Risk**：旧证据 stale。
- **Prevention**：代码、命令、snapshot 变化即刷新受影响组。
- **Rollback / recovery**：保持未完成项和真实状态。

## 3. Dependency Graph

```text
T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011 → T012 → verify-code
```

- 图无环；所有 consumer 在 producer 后执行。
- Phase 内只有输入、依赖和文件完全独立时才可并行采集 RED。

## 4. Requirement and Verification Traceability

| FR | Task IDs | AC IDs | Phase | Gate / evidence |
| --- | --- | --- | --- | --- |
| FR-IDENTITY-001 | T001,T002,T011,T012 | AC-01 | Phase 1,6 | OR-WRITE-BOUNDARY |
| FR-PATH-001 | T001,T002,T011,T012 | AC-02 | Phase 1,6 | OR-WRITE-BOUNDARY |
| FR-PREFLIGHT-001,FR-PREFLIGHT-002 | T001–T004,T011,T012 | AC-03,AC-04 | Phase 1,2,6 | OR-WRITE-BOUNDARY,OR-RECOVERY |
| FR-SKILL-001,FR-MATERIAL-001,FR-ATOMIC-001 | T005,T006,T011,T012 | AC-05,AC-06,AC-07 | Phase 3,6 | OR-LOCAL-BEFORE-PROVIDER |
| FR-RECOVERY-001,FR-RECOVERY-002,FR-RECOVERY-003 | T003,T004,T011,T012 | AC-08,AC-09,AC-10 | Phase 2,6 | OR-RECOVERY |
| FR-CORE-001,FR-ATTEMPT-001 | T007,T008,T011,T012 | AC-11,AC-12,AC-13 | Phase 4,6 | OR-CORE-REVIEW |
| FR-REVIEW-001,FR-REVIEW-002 | T007,T008,T011,T012 | AC-14,AC-15,AC-16 | Phase 4,6 | OR-CORE-REVIEW |
| FR-PROCESS-001,FR-PROCESS-002 | T009,T010,T011,T012 | AC-17,AC-18,AC-21 | Phase 5,6 | OR-PROCESS-HANDOFF |
| FR-HANDOFF-001,FR-VERIFY-001 | T009,T010,T011,T012 | AC-19,AC-20 | Phase 5,6 | OR-PROCESS-HANDOFF,OR-QUALITY-COMPLETION |

## 5. Source Coverage

| Source | SCN | FR | AC | Tasks |
| --- | --- | --- | --- | --- |
| FG2-02 | SCN-001 | FR-IDENTITY-001 | AC-01 | T001,T002,T011,T012 |
| FG2-04 | SCN-002 | FR-PATH-001 | AC-02 | T001,T002,T011,T012 |
| FG2-05 | SCN-001 | FR-PREFLIGHT-001 | AC-03 | T001,T002,T011,T012 |
| FG2-05 | SCN-005 | FR-PREFLIGHT-002 | AC-04 | T001,T002,T011,T012 |
| FG2-11 | SCN-003 | FR-ATOMIC-001 | AC-07 | T005,T006,T011,T012 |
| FG2-14 | SCN-004 | FR-SKILL-001 | AC-05 | T005,T006,T011,T012 |
| FG2-16 | SCN-004 | FR-MATERIAL-001 | AC-06 | T005,T006,T011,T012 |
| FG2-26 | SCN-003 | FR-ATOMIC-001 | AC-07 | T005,T006,T011,T012 |
| FG2-28 | SCN-005 | FR-RECOVERY-002 | AC-09 | T003,T004,T011,T012 |
| FG2-30 | SCN-005 | FR-RECOVERY-001 | AC-08 | T003,T004,T011,T012 |
| FG2-30 | SCN-010 | FR-RECOVERY-003 | AC-10 | T003,T004,T011,T012 |
| MD-D1 | SCN-008 | FR-REVIEW-002 | AC-16 | T007,T008,T011,T012 |
| MD-D2 | SCN-008 | FR-REVIEW-002 | AC-15 | T007,T008,T011,T012 |
| MD-D2 | SCN-008 | FR-REVIEW-002 | AC-16 | T007,T008,T011,T012 |
| MD-D3 | SCN-008 | FR-REVIEW-002 | AC-16 | T007,T008,T011,T012 |
| MD-D4 | SCN-009 | FR-HANDOFF-001 | AC-19 | T009,T010,T011,T012 |
| MD-D5 | SCN-001 | FR-IDENTITY-001 | AC-01 | T001,T002,T011,T012 |
| MD-D5 | SCN-008 | FR-REVIEW-002 | AC-16 | T001,T002,T011,T012 |
| MD-NG1 | SCN-008 | FR-REVIEW-002 | AC-15 | T007,T008,T011,T012 |
| MD-NG2 | SCN-008 | FR-REVIEW-002 | AC-16 | T007,T008,T011,T012 |
| MD-NG3 | SCN-009 | FR-HANDOFF-001 | AC-19 | T009,T010,T011,T012 |
| MD-NG4 | SCN-008 | FR-REVIEW-002 | AC-16 | T007,T008,T011,T012 |
| FLOW-CORE | SCN-006 | FR-CORE-001 | AC-11 | T007,T008,T011,T012 |
| FLOW-CORE | SCN-011 | FR-CORE-001 | AC-12 | T007,T008,T011,T012 |
| FLOW-ATTEMPT | SCN-007 | FR-ATTEMPT-001 | AC-13 | T007,T008,T011,T012 |
| FLOW-OUTCOME | SCN-008 | FR-REVIEW-001 | AC-14 | T007,T008,T011,T012 |
| FLOW-REUSE | SCN-008 | FR-REVIEW-002 | AC-15 | T007,T008,T011,T012 |
| PROC-CLARIFY | SCN-009 | FR-PROCESS-001 | AC-17 | T009,T010,T011,T012 |
| PROC-REVIEW | SCN-008 | FR-REVIEW-001 | AC-14 | T009,T010,T011,T012 |
| PROC-REVIEW | SCN-009 | FR-PROCESS-001 | AC-18 | T009,T010,T011,T012 |
| PROC-SUMMARY | SCN-009 | FR-HANDOFF-001 | AC-19 | T009,T010,T011,T012 |
| PROC-VERIFY | SCN-003 | FR-VERIFY-001 | AC-20 | T009,T010,T011,T012 |
| PROC-VERIFY | SCN-008 | FR-VERIFY-001 | AC-20 | T009,T010,T011,T012 |
| PROC-COVERAGE | SCN-009 | FR-PROCESS-002 | AC-21 | T009,T010,T011,T012 |
| QUALITY-NOGATE | SCN-006 | FR-CORE-001 | AC-11 | T011,T012 |
| QUALITY-NOGATE | SCN-011 | FR-CORE-001 | AC-12 | T011,T012 |
| QUALITY-NOGATE | SCN-011 | FR-PROCESS-001 | AC-18 | T011,T012 |
| QUALITY-REBUILD | SCN-009 | FR-PROCESS-002 | AC-21 | T011,T012 |
| QUALITY-REBUILD | SCN-011 | FR-VERIFY-001 | AC-20 | T011,T012 |
| QUALITY-RETRACT | SCN-008 | FR-REVIEW-001 | AC-14 | T011,T012 |
| QUALITY-RETRACT | SCN-011 | FR-HANDOFF-001 | AC-19 | T011,T012 |

## 6. Final Boundary Check

- [ ] 每个 Phase 八段完整，且 Files 与 plan 逐字一致。
- [ ] 每个 Task 只有一张权威卡，精确文件属于本 Phase NEW/MODIFY。
- [ ] 每个行为变化都有真实 RED → GREEN，命令、oracle 和 evidence 明确。
- [ ] DAG 与 FR/Task/AC/gate 双向闭合。
- [ ] Plan File Boundary 等于所有 Phase NEW/MODIFY 的并集。
- [ ] 每个 Phase NEW/MODIFY 文件至少有一个 owning Task。
- [ ] 每个 Task 的精确文件和 boundary 都是所属 Phase NEW/MODIFY 的子集。
- [ ] 没有 host identity、固定 artifact root、无关项目规则或未声明文件。

## Appendix A. Legacy import

旧 `## Stage N` 只允许只读导入；当前 Phase、唯一 Task 卡、DAG 和完成填写区是唯一权威。
