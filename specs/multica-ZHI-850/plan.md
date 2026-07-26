# 实施计划：multica-ZHI-850

**输入**：accepted `spec.md`。  
**范围**：仅新增 Phase 1→Phase 0 的同 snapshot、显式授权、一次性恢复。  
**状态**：冻结草案，待正式审查。

## 目标与硬边界

- 仅当权威 pointer 指向正式 Phase 1、请求与来源为同一 snapshot、历史闭合完整、gate 未使用，且 credential v1 精确包含 `phase_subject.recovery_intent=same-snapshot-phase0-reopen` 时恢复。
- 成功只追加一条 `workflowhub-recovery-generation.v1` 恢复记录；该记录同时是一次性 gate。旧 Phase、review、receipt、attempt、credential 和 archive 内容不修改。pointer 以来源 Phase 1 原始字节为 CAS 条件切到 Phase 0/`awaiting_review`。
- 失败不改变有效 pointer、不消费 gate、不触发 review。并发请求最多一个成功；失败者可区分为 replay 或 pointer conflict。
- 恢复后的 Phase evidence 必须绑定 recovery ref/hash。它使同 tree 的新 review 材料身份不同于旧 Phase 0 review；相同新材料的重复调用复用同一正式 review，不生成第二条恢复或第二份 review 身份。
- changed-snapshot、普通 Phase 推进、现有 reopen、审查路由/provider/profile/material 协议保持不变。
- 不新增公开 endpoint/CLI、通用回滚、跨 snapshot 回退、历史修复、存储系统或新错误封装体系。

## 已执行研究

| 现有事实 | 计划取舍 |
|---|---|
| `core/task-handle.mjs` 的 `writeAtomicAt(... expectedPriorRaw)`、`locks/build-code-phase-evidence.lock`、create-only generation 和 rollback 已提供比较式 pointer 更新与同域串行化。 | 复用现有 lock/CAS/rollback；不引入第二套事务或数据库。补齐恢复记录、gate、pointer 三个边界的确定性故障注入与回滚断言。 |
| `scripts/task-recovery.mjs` 已复用 `assertBaselinePhaseClosure`、`assertBaselineReviewClosure`、receipt/hash/tree 校验，但明确拒绝 same snapshot。 | 保留同一闭合校验，不复制宽松校验；只在 snapshot/intent 分支放行目标状态。 |
| `workflows/build-code/phase-evidence.mjs` 已识别 recovery ref/hash，并把绑定写入 canonical Phase evidence；`wh-review` 以材料身份复用同一结果。 | 用 recovery 绑定强制产生新的材料身份，禁止旧 review 充当 fresh review；重复调用仍幂等。 |
| 当前 `phasePointer()` 在 pointer/gate 提交后继续调用可失败的 Phase evidence 发布；`stage-runtime.mjs` 已公开 `publish-phase-evidence` 并复用同一 producer。 | 保留健康路径的同步 continuation 和现有返回字段；原子提交后 continuation 失败不得把恢复报成失败，而是返回已提交状态及该正式再驱动入口。重试由 recovery ref/hash 保证幂等。 |

外部调研：跳过。无外部 API、版本或市场事实；仓内正式契约足以决定计划。

## 数据、接口与错误契约

### Credential v1

`core/schemas/workflowhub-recovery-credential.v1.json` 与 `validateRecoveryCredential()` 在现有 `phase_subject` 上增加唯一可选字段：

```json
{"recovery_intent":"same-snapshot-phase0-reopen"}
```

- 值按大小写敏感完整字符串匹配；空值、空白、别名、前后缀和其他值全部无效。
- same-snapshot 恢复必须存在 exact intent。
- changed-snapshot credential 可继续缺少该字段；一旦携带 exact intent，必须拒绝进入旧路径。
- 其他 credential 字段、canonical ref/hash、Phase 1→0、receipt 和 allowed-file 规则不变；intent 不能从 CLI、环境变量或自由文本补入。

### 恢复记录、gate 与 pointer

- `identity/recoveries/phase-pointer-0001.json` 继续使用现有 `workflowhub-recovery-generation.v1`，绑定 credential、来源 pointer hash/tree 和恢复后 pointer hash/tree；它是唯一成功恢复记录及权威一次性 gate。
- 恢复前的 pointer archive 只保存旧 pointer 的逐字节副本，不代表成功、不作为 gate，也不修改旧记录。
- 新 pointer 只携带 Phase 0/`awaiting_review`、recovery ref/hash 和既有测试/allowed-files 绑定；后续 canonical Phase evidence 继续使用同一 recovery ref/hash。
- same+exact 健康返回固定为 `recovery_ref`、`recovery_hash`、`phase_id`、`status`、`canonical_phase_evidence_ref`、`next_entry: fresh wh-review`。若原子提交后 evidence continuation 中断，CLI 仍成功返回前四项与 `next_entry: stage-runtime publish-phase-evidence`，不伪报恢复失败；该入口用相同 recovery ref/hash 幂等补齐 evidence。changed+missing 保持现有完整返回逐字兼容。
- 不改 generation schema、不新增第二份 gate、不使用进程内锁作为正确性依据。

### 可区分失败

沿用 `recoveryError` 与现有 `RECOVERY_*` 通道。必须映射并测试七类彼此可区分语义：intent 缺失或值错误、intent 用途或 snapshot 错误、pointer/来源失配、历史闭合不完整、replay、CAS conflict、原子持久化失败。优先复用现有 code；无法区分时只增加同一 `RECOVERY_*` 家族的最小内部 code。AC-003 与 AC-004 分别断言错值和错误用途的语义不同；不改变公开 CLI 错误封装。

## 实施顺序

### Phase 1：credential 与恢复分支

**主要文件**：`core/schemas/workflowhub-recovery-credential.v1.json`、`core/task-recovery.mjs`、`scripts/task-recovery.mjs`、对应 core/CLI tests。

1. schema/validator 允许且只允许 exact `recovery_intent`；修正 subject allowed-key 集合，保持旧 changed-snapshot credential 兼容。
2. 在读取权威 pointer、完整闭合和 receipt 后，先计算 same/changed，再建立显式矩阵：same+exact 允许；same+missing 进入 intent 缺失语义；任意错误值进入 intent 错配语义；changed+exact 进入用途错误语义；changed+missing 走原路径。移除既有 snapshot-equality 的无条件提前拒绝，确保三类 intent 语义彼此可区分。
3. 校验 pointer hash、pointer snapshot、credential snapshot、baseline Phase 0 snapshot 和 receipts/tree 的一致性；不信任调用方 Phase/snapshot 派生值。
4. 保持现有正式闭合函数为唯一复用点，并对缺失、hash/ref 失配、未接受、不可读代表用例做 fail-closed 测试。

**覆盖**：FR-001～FR-004、FR-011、FR-012；AC-002～AC-006、AC-013。

### Phase 2：一次性原子提交与并发

**主要文件**：`core/task-handle.mjs`、`core/task-recovery.mjs`、`scripts/task-recovery.mjs`、`core/__tests__/task-recovery.test.mjs`、`scripts/__tests__/task-recovery.test.mjs`。

1. 所有可前置的 credential、closure、receipt/tree、runner identity 与目标 pointer 计算在进入提交前完成。
2. 在 `locks/build-code-phase-evidence.lock` 内重新读取 gate 和 pointer；gate 已存在返回 replay，pointer 原始字节变化返回 conflict。
3. 复用 create-only generation + expected-prior pointer replace。恢复记录/gate/pointer 作为一个可观察提交；任一步失败恢复旧 pointer并移除本次未存在的 generation。archive 若保留，只能是不可达的旧 pointer 副本，不能满足 gate、成功记录或后续推进。
4. 增加仅测试可注入的三个边界：新增 `beforeGenerationCreate` 覆盖恢复记录持久化；复用/命名 gate create 后的 `beforePointerReplace` 覆盖 gate 已生效；复用 `validatePointerReplace` 覆盖 pointer CAS/翻转。hook 不进入 CLI、schema 或生产 input。
5. same-snapshot + exact-intent 在原子提交后继续调用现有 `publishBuildCodePhaseEvidence`：成功时保留 `canonical_phase_evidence_ref` 与 `fresh wh-review` 返回；continuation 异常时捕获为“恢复已提交、evidence 待补齐”的成功返回，并指向现有 `stage-runtime publish-phase-evidence`，不得抛成恢复失败。changed-snapshot + missing-intent 必须逐字保持现有同步 evidence 发布、异常、副作用与返回字段；changed+exact 和 same+missing 在提交前拒绝。重试重新读取权威 pointer/gate。
6. 用可重复 barrier 让两个请求竞争同一 pointer，断言恰好一个成功、一个 replay/conflict、只有一个 generation、一个有效 pointer；另测 pointer 被第三方推进时 CAS 失败。

**覆盖**：FR-005～FR-009、FR-011；AC-001、AC-007、AC-008 的恢复/gate 子集、AC-009、AC-012。AC-008 的单次 fresh review 子集由 Phase 3 关闭。

### Phase 3：fresh Phase 0 review 与流程隔离

**主要文件**：`workflows/build-code/phase-evidence.mjs`、Phase evidence/review tests、CLI e2e tests。

1. 恢复成功后的 controller 健康路径必须立即调用 `publishBuildCodePhaseEvidence`；中断恢复与显式重试只使用现有 `stage-runtime publish-phase-evidence`。两者都必须携带匹配的 recovery ref/hash；缺失、错误、旧 generation 或 pointer 不匹配时拒绝。
2. canonical Phase evidence 固定包含 recovery ref/hash，并绑定恢复后的 current pointer、同一 snapshot、receipt/tree 和 Phase 0；它的 hash/material identity 必须不同于旧 Phase 0 evidence/review。
3. 新 review 必须产生新的 attempt/result 轨迹；旧 review ref 不能完成新 pointer。对同一新材料重复调用只复用该新 result，不再次恢复、不追加第二份 review 身份。
4. 新 review `revise_required` 或 unavailable 继续现有 Phase 0 失败语义；只允许按当前 Phase review 流程修复/重试，不消费第二次 recovery gate，也不回用旧 result。
5. fresh PASS 后才允许现有 Phase 1 continuation；normal Phase、existing reopen 和 changed-snapshot 夹具保持基线。

**覆盖**：FR-010～FR-012；AC-005、AC-007、AC-008、AC-010、AC-011、AC-013。

### Phase 4：文档、完整回归与审查

**主要文件**：`docs/contracts/task-context.md`、CLI help、相关 e2e/test fixtures。

1. 文档写清 exact intent、same/changed 矩阵、一次性 gate、CAS、fresh review、失败语义及禁止手改记录。
2. 先跑定向 suites：credential/core recovery、CLI recovery、Phase evidence、wh-review material/idempotency、changed-snapshot/normal Phase。
3. 再跑 `npm test` 和 `npm run check`。每个实现 Phase 保留独立测试证据并通过正式 Phase review；全树完成后通过 build-code integration review。

**覆盖**：全部 FR-001～FR-012、AC-001～AC-013。

## 测试策略与夹具

- 精确 intent 表驱动矩阵：missing、empty、case、leading/trailing space、alias、prefix/suffix、arbitrary。
- 历史闭合矩阵：必需 evidence/review/attempt/receipt 的 missing、hash/ref mismatch、not accepted/non-PASS、unreadable。
- 原子故障：record persist、post-gate/pre-pointer、pointer replace；逐项比较 pointer 原始字节、generation 数量、gate、旧历史摘要、review 数量。
- 并发：barrier 放在 lock 前后可控位置；至少两个请求使用同一来源 hash，最终成功数严格为一。
- fresh review：旧/新 evidence hash、material ID、attempt/result ref 均比较；重复新 review 调用必须返回同一 canonical result。
- 回归：旧 changed-snapshot 成功/失败、normal Phase、existing reopen、review route snapshot 与 hotfix 前固定夹具一致；不调用真实外部 provider。

## 回滚与运行说明

- 代码回滚：若尚未发放该 intent credential，可回滚 schema/branch/continuation改动并跑全量回归。
- 数据回滚：成功恢复是 append-only 事实，不提供反向 reset，不删除 generation/archive，不手改 pointer。后续问题按现有 Phase review/recovery 流程处理。
- 停止点：缺少 CAS/lock/rollback、闭合校验不可复用、recovery 绑定不能产生新 review 材料身份，任一成立即阻塞，不扩大 hotfix。

## 要求映射

| 要求 | 实现区 | 验证 |
|---|---|---|
| FR-001～FR-004 | Phase 1 credential/权威状态/闭合 | AC-002～AC-006 |
| FR-005～FR-009 | Phase 2 gate/CAS/rollback/concurrency | AC-001、AC-007～AC-009、AC-012 |
| FR-010 | Phase 3 recovery-bound fresh review | AC-010、AC-011 |
| FR-011 | Phase 1/2 稳定失败语义 | 全部拒绝/故障用例 |
| FR-012 | Phase 1/3/4 路径隔离 | AC-005、AC-013 |

## Constitutional checklist

- [x] 最小改动：复用现有 credential、generation、TaskHandle lock/CAS、Phase evidence、wh-review 幂等。
- [x] 单一事实源：权威 pointer、canonical records、accepted closure；不信任调用方派生状态。
- [x] Append-only：旧记录不改；唯一新 generation 兼作 gate。
- [x] Fail closed：身份、闭合、hash/tree、intent、并发或持久化异常全部拒绝。
- [x] 可证伪：intent、closure、fault、concurrency、fresh review、回归均有确定性测试。
- [x] 审查独立：不改 provider/profile/route；实现 Phase 与全树使用正式审查。

## build-code 输入

accepted `spec.md`、本 `plan.md`、`tasks.md`。执行顺序：T001→T004（契约）→T005～T008（原子提交）→T009～T011（fresh review）→T012（全量证据）。任何停止点触发即回报阻塞。
