# 实现计划：workflowhub 执行效率修复（B 面+C 面+会话绑定移除+遗漏披露）

- **Input**：`specs/workflowhub-execution-efficiency-20260902/decision-log.md`（D-001~D-008、C-001~C-003）、`specs/workflowhub-execution-efficiency-20260902/spec.md`（FR-001~012、AC-1~7，SHA-256 `e5eb3cd6fc01d62b`）
- **Template version**：`plan-task.v3`
- **Current-material audit**：四材料为本计划唯一工作真相；历史 receipt/review 只读。

## 速读卡

- **Goal**：六个交付面——doctor 存储一致性、writer 来源记录、旧树归档、untracked 捕获点、会话绑定移除（B5a/B5b 原子批）、wh-review 契约守护+调用约定；全部走 RED→GREEN 对，15 张任务卡+1 张聚合卡。
- **Non-goals**：不碰任务 A 领地（stage-runner 失败通道/verify-code 绑定派生/close 授权链/预检器）；不新增公共行为类；不做真异步机制；不迁移旧树数据；不做机器核对注入；不改五阶段骨架；不做 lesson 注入（来源：decision-log 非目标节、D-002/D-005、spec 第 3/9 节）。
- **Deletion boundary**：`tools/host/workflowhub-codex-session-{state,hook,event}.mjs`（T14 原子批内删除，删除条件=身份替代 FR-007 落地且 gate 释放）。
- **Before**：doctor 只回四字段；writer 不记解析来源；旧树无说明；untracked 哈希捕获过早致整轮重跑；会话绑定族在非 Codex 宿主整体失能；wh-review 0 字节无专属语义。
- **After**：doctor 机器可读一致性段+exit 0；task.json 记 write_resolution_source；旧树根 ARCHIVED.md；捕获点入发布事务；身份=显式>派生、冲突/缺失 fail-closed；0字节→contract_failure、partial 永不当 pass、公共边界脱敏；stage 末总结必列遗漏。
- **Main risk**：与任务 A 在 stage-runtime.mjs 同文件不同区（RISK-P-01）；B5b gate 依赖 usability（RISK-P-02，兜底 C-001）。
- **Post-merge baseline**：任务分支已合并 `main` 的 stage-reflection/`preflight`/`reflect`、verify-close、bridge stale-review 校验、snapshot materialization 与 wh-review 本地 bounded timeout；这些行为属于现有基线，当前任务只能兼容并回归，不能覆盖或重复实现。
- **Next step**：先完成本次材料重基线并重新确认 build-plan，再进入 build-code，按 P1（并行 RED）→GREEN→P2→P3→（内容级 gate 释放后）P4→P5 执行；任何越出 File Boundary 的实现立即 STOP。

## Technical Context

### Global Constraints

- **公共行为面**：RUNTIME_BEHAVIORS 七类不变；contract_failure 仅为内部标签（D-005）。
- **fail-closed 不削弱**：verify 的 untracked 重算比对、质量事实缺失保持 missing/unavailable（D-003/D-005）。
- **旧记录只读**：旧任务记录/receipt/review 只读保留；旧树除 ARCHIVED.md 首次创建（豁免）外零写入（C-003）。
- **原子性**：B5b 删除与改写必须同一 git 提交（AC-6 不变量）。
- **铁律文件边界**：不碰 main 已更新的 stage-runner.mjs、task-kernel-implementation.mjs；stage-handlers.mjs 仅 diff 证据捕获点区域；stage-runtime.mjs 仅 doctor 区+会话派生区（D-002），并保留 main 已合入的 `preflight`/`reflect`/stale-session 逻辑。
- **Testing**：Vitest；契约测试 tests/contract/ 与 skills/wh-review/scripts/__tests__/；RED/GREEN 每行为变化成对共用 gate_cmd。
- **Target environment**：本地 CLI+单机文件系统；多宿主（DSH/Codex），不依赖任何宿主会话链。

## Code Anchors

- doctor：tools/cli/stage-runtime.mjs:833-843（JSON 四字段，exit 0/异常非零；main 已增加 `preflight`/`reflect`，不可覆盖）。
- 存储根：runtime/evidence/storage-root.mjs:30-52（env>config>home，launcher-only）；调用方=stage-context.mjs、task-bootstrap.mjs、check-task-record-paths.mjs。
- diff 证据：runtime/evidence/canonical-receipt-writer.mjs:316-325（untracked blob_oid 捕获）；runtime/stage/stage-handlers.mjs:1563-1597（verify 重算比对 fail-closed）。
- 绑定族：`tools/host/workflowhub-codex-session-{state,hook,event}.mjs`；合并后仍由 stage-runtime、task-bootstrap、stage-agent-bridge 的 `session.session_id` 输入面及五份 SKILL.md 消费，T9/T14 需按当前源码重新定位并清零。
- SKILL.md 引用点：main 当前五份文件仍含 `workflowhub-codex-session-event.mjs` 和同一会话段；T14 用内容级 grep/契约测试，不使用旧行号作为唯一证据。
- wh-review broker：review-provider-client.mjs:9、:44-75、:287-288、:316-363（已有 120000ms timeout 与 `PROCESS_TIMEOUT`）；0 字节/非法 JSON 仍是本任务的 `contract_failure` 语义；simple-review-runner.mjs:318-319 对外归一 `REVIEW_EXECUTION_TIMEOUT`；比较键复用既有 `material_fingerprint`。

### Reuse → Extend → New

- 复用：resolveStorageRoot（扩展暴露解析链）、material_fingerprint（重试比较键）、既有隐私守卫（不动）。
- 扩展：doctor JSON 加 storage 段；task.json 加 write_resolution_source；canonical-receipt-writer 发布路径内定点唯一捕获。
- 新增（最小）：tests/ 契约测试与 fixture、docs/operations/old-tree-archive.md（consumer=审计/doctor 对照，删除条件=旧树不存在）、docs/adr/0024-remove-host-session-binding.md（随 B5b 批；0023 已被 main 占用）。不新增 npm 依赖、不新增机制对象。

## Solution Design

### Overview

六个交付面按文件所有权分五个 Phase：P1 存储一致性（stage-runtime doctor 区+storage-root+writer+canonical-receipt-writer+ops）、P2 B5a（stage-runtime 会话派生区+task-bootstrap 绑定调用区）、P3 C 面（wh-review broker+文档）、P4 B5b 原子批（三件套删除+bridge+五份 SKILL.md，gated）、P5 聚合验收。

### doctor 存储一致性（FR-001/FR-002）

resolveStorageRoot 扩展返回解析链细节（三来源实际值+选中来源）；doctor 组装 storage 段与 warnings（漂移/可疑第二根/字段不一致），exit 恒 0；历史 task.json 缺字段显示 unknown。writer（task-bootstrap/stage-context 写入路径）落 write_resolution_source。

### 旧树归档（FR-003）

仓内 docs/operations/old-tree-archive.md 记录标记全文与豁免说明；仓外旧树根一次性创建 ARCHIVED.md（唯一豁免写入），其余零写入。

### diff 证据捕获点（FR-004）

untracked blob_oid 唯一捕获点移入 canonical-receipt-writer 的发布事务路径（OPEN-P-01 在 T7 定点）；stage-handlers 仅捕获点区域适配；verify 重算比对语义不动；历史样例转 fixture。

### 身份移除与算法（FR-005/FR-007）

stage-runtime 删 4 个绑定族导入及派生路径；task-bootstrap 删绑定调用；身份=显式 --project/--task > 认证 worktree（manifest 登记身份）派生；规范化=去空白精确匹配；冲突/缺失/登记损坏=fail-closed；旧 session 字段只读不消费。

### wh-review 契约守护（FR-008~011）

broker 读取 provider 输出处：0字节/非法 JSON→contract_failure 内部标签，原文入任务私有证据区；四公共边界（CLI stdout JSON/canonical result/报告投影/跨任务 quality facts）只含错误码+脱敏消息；partial=available-with-failures 永不当 pass；相同 material_fingerprint 不重试；保留 main 已有 120000ms bounded timeout、`PROCESS_TIMEOUT` 和对外 `REVIEW_EXECUTION_TIMEOUT` 映射，不新增第二套 timeout/进程生命周期机制。wh-review SKILL.md 增后台执行+轮询约定段。

### B5b 原子批（FR-006/FR-012）

同一 git 提交内：删三件套、bridge 的 session.session_id 改显式参数（无输入如实 unavailable）、保留 main 已加入的 stage-reflection 内容并在五份 SKILL.md 移除"同一会话自动记录"段、session-event 指令且新增遗漏披露段（stage 末总结必列非 completed step/skill 及原因）、ADR 新建为 0024。gate 释放信号=usability 合并且五份文档内容级满足零 session 引用+遗漏披露，或任务取消/14 天无进展（C-001 兜底本任务接管）；仅有文件改动或新增 stage-reflection 不算释放，当前 main 不满足 gate，因此保留完整改写范围。

## File Boundary

### NEW
`tests/contract/doctor-storage-consistency.test.mjs`、`tests/contract/writer-resolution-source.test.mjs`、`tests/contract/diff-evidence-capture-point.test.mjs`、`tests/contract/identity-resolution.test.mjs`、`tests/contract/session-binding-removed.test.mjs`、`skills/wh-review/scripts/__tests__/provider-output-contract.test.mjs`、`tests/fixtures/diff-evidence/historical-untracked-mismatch.json`、`docs/operations/old-tree-archive.md`、`docs/adr/0024-remove-host-session-binding.md`（T14 批内）。

### MODIFY
`tools/cli/stage-runtime.mjs`（doctor 区+会话派生区）、`runtime/evidence/storage-root.mjs`、`tools/cli/task-bootstrap.mjs`、`runtime/stage/stage-context.mjs`、`runtime/evidence/canonical-receipt-writer.mjs`、`runtime/stage/stage-handlers.mjs`（仅 diff 证据捕获点区域）、`skills/wh-review/scripts/review-provider-client.mjs`、`skills/wh-review/SKILL.md`、`tools/host/workflowhub-stage-agent-bridge.mjs`（T14 批内）、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`（T14 批内）。

### DELETE
`tools/host/workflowhub-codex-session-state.mjs`、`tools/host/workflowhub-codex-session-hook.mjs`、`tools/host/workflowhub-codex-session-event.mjs`（T14 批内）。

删除证明：a) 消费方清单完整——F-201/F-202 反向引用扫描确认消费者为 stage-runtime、task-bootstrap、stage-agent-bridge 及五份 SKILL.md 文本，全部在本计划 MODIFY 面内（T9 先移除代码消费，T14 同批移除文本消费）；b) 删除条件=身份替代 FR-007 落地且 T8/T9 绿；c) 零残留证明=T13 测试断言全仓引用为零；d) 原子性证明=同一 git 提交内容断言；e) 决策留痕=ADR 0024 随批创建，避免覆盖 main 的 ADR 0023。

### DO NOT TOUCH
runtime/stage/stage-runner.mjs、runtime/task/task-kernel-implementation.mjs、stage-handlers.mjs 捕获点区域外、任务 A 与 usability 任务文件、旧树（豁免除外）。

## Technical Decisions

- doctor 报警=JSON warnings+exit 0（C-002），否决分级/非零退出：宪法"事实不阻断"。复杂度：低。
- 捕获点入发布事务（D-003），否决独立后台进程：不新增进程对象。复杂度：中（发布事务语义手术式）。
- contract_failure=内部标签（D-005），否决第八类公共行为。复杂度：低。
- B5b=单提交原子批（AC-6），否决先删后改：旧指令引用不存在命令会中断。复杂度：低。
- 归档标记=ARCHIVED.md（C-003），否决 config 注记/双写。复杂度：低。

## Test Strategy

- 风险优先级：误报（doctor 对历史任务）>漏报（漂移不报警）>捕获点回归>身份猜测>隐私泄漏。
- 场景与 oracle：每对 RED/GREEN 共用 gate_cmd 与 evidence_path；RED 期望断言失败非零，GREEN 期望 0。
- fixture：历史 untracked mismatch 样例（PaperBuilder lessons payload）入 tests/fixtures/diff-evidence/；provider 五终态用 fake broker 输出（含 lessons 真实 0 字节/invalid 样例）。
- 覆盖限制：non_ui 无浏览器层；不做真异步端到端；真实 provider 调用不进单测。

## Rollback and Recovery

- 全部改动可 git revert；B5b 原子批部分缺失=整体 revert 重排。
- 测试失败回退到对应 RED 卡修正构造；生产改动越界即 STOP 回本卡。

### Engineering Risk Handoff

- **RISK-P-01**（stage-runtime.mjs 与任务 A 同文件）
- **Affected IDs**：T2、T9
- **Trigger**：merge 时与任务 A 冲突不可调和
- **Consequence**：本任务让路，A 优先，相关卡重排
- **Mitigation or STOP**：分区纪律（doctor 区/会话派生区）；冲突即 STOP 回本卡
- **Handling Stage**：build-code
- **Verification**：merge 无冲突+对应测试绿

- **RISK-P-02**（B5b gate 依赖 usability）
- **Affected IDs**：T13、T14、T15
- **Trigger**：usability 未合并且未取消且 14 天无进展
- **Consequence**：B5b 不启动，AC-6 如实记录 gated，或按 C-001 本任务接管
- **Mitigation or STOP**：gate 信号可观察；未释放即 STOP
- **Handling Stage**：build-plan 排期/build-code 执行
- **Verification**：gate 信号记录于任务卡

- **RISK-P-03**（捕获点定点破坏兼容）
- **Affected IDs**：T6、T7
- **Trigger**：发布事务定点破坏既有 receipt 兼容
- **Consequence**：回退捕获点改动，保留 fail-closed 现状并如实记录
- **Mitigation or STOP**：fixture 先行验证；异常即 STOP 回退
- **Handling Stage**：build-code
- **Verification**：T6 fixture 全过

- **RISK-S-04**（承接：provider 身份失效）
- **Affected IDs**：T10、T11、T12
- **Trigger**：grok/pax3.8 身份持续失效
- **Consequence**：异源覆盖降级但 minimum_heterologous=1 满足
- **Mitigation or STOP**：如实保留失败事实；用户择机核查配置（OPEN-007）
- **Handling Stage**：build-code/verify-code
- **Verification**：终态如实记录

## Implementation Order

P1（T1/T3/T5/T6 并行 RED → T2/T4/T7 GREEN）→ P2（T8 RED → T9 GREEN，依赖 T2 同文件分区就绪）→ P3（T10 RED → T11 GREEN，与 P1/P2 全并行；T12 随时）→ P4（gate 释放后 T13 RED → T14 GREEN 原子批）→ P5（T15 聚合）。

## Dependencies and Parallelism

- 并行安全：P1/P2/P3 文件互不重叠（除 stage-runtime 内部分区：T2=doctor 区、T9=会话派生区，故 T9 依赖 T2）；T5/T12 与一切并行。
- 串行硬依赖：每对 GREEN 依赖其 RED；T13 依赖 T9（身份替代落地才可删三件套）；T15 依赖全部 GREEN。

## Requirement and Verification Traceability

| source | FR | AC | tasks | oracle |
| --- | --- | --- | --- | --- |
| D-004/C-002 | FR-001 | AC-1 | T1,T2 | doctor-storage-consistency.test |
| D-004 | FR-002 | AC-1 | T3,T4 | writer-resolution-source.test |
| D-004/C-003 | FR-003 | AC-2 | T5 | shell 标记断言 |
| D-003 | FR-004 | AC-3 | T6,T7 | diff-evidence-capture-point.test+fixture |
| D-007 | FR-005,FR-007 | AC-5 | T8,T9 | identity-resolution.test 六例 |
| D-005 | FR-008,FR-009,FR-010 | AC-4 | T10,T11 | provider-output-contract.test 五终态+脱敏 |
| D-005 | FR-011 | AC-7 | T12 | grep 文本断言 |
| D-006/D-007/C-001 | FR-006,FR-012 | AC-6 | T13,T14 | session-binding-removed.test+提交断言 |
| 全部 | 全部 | 全部 | T15 | npm run test:safe && npm run check |

## 简洁与工程透镜（步骤 5-6 inline，2026-09-03）

- 简洁透镜：无新机制/无新 npm 依赖/无新公共行为；长任务处理=文本约定（T12）非机制；归档=单文件非迁移系统。通过。
- 工程透镜：RED/GREEN 成对共用 gate_cmd 与 oracle 身份；全局 File Boundary 与 Phase Files 双向闭环；B5b 原子批有可观察 gate 信号+单提交不变量+整体回滚；与任务 A 同文件分区写入 STOP 条件。通过。

## Governance Synchronization Matrix

| 文件 | 动作 | 时机 | 依据 |
| --- | --- | --- | --- |
| CONTEXT.md | no-change（make-decision 已判定）；:127/:132 术语残留机械核对 | build-code（DEFER-P-01） | decision-log 文档结果节 |
| docs/adr/00xx-remove-host-session-binding.md | NEW | T14 批内 | decision-log ADR 三判据全真 |
| docs/adr/0012（task-local monitoring） | 退休状态核对标注 | build-code（DEFER-P-01） | M15 退休事实 |
| docs/architecture/move-map.json | 核对三件套删除与新增文件登记 | T14 批内 | AGENTS.md 治理边界 |
| AGENTS.md/CLAUDE.md | no-change（身份/七类行为不变） | — | 本计划不触碰 |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"CONSTITUTION.md","hash":"e400d447d94a68fc629ac05acb23c807e34a5c929a5bd723c91c9b02dfc16732","id":"workflowhub-constitution","version":"1.7.0","clause_count":22}`
- F1 薄核心：改动全部下沉 CLI/skill 层，核心调度零改动 ✓
- F2 窄契约：doctor/wh-review 只扩既有 JSON 段，不暴露内部 ✓
- F3 四材料决定推进：本计划只消费四材料；发布走既有 public run ✓
- F4 质量靠异源审查与人：wh-review 一轮异源建议+finding 处置不锁修复 ✓
- F5 gate 谨慎：B5b gate 有客观释放信号与兜底，非预堆 ✓
- F6 统一外置执行记录：不把旧身份记录当准入；session 字段只读 ✓
- F7 三处确认与不可逆独立授权：build-plan 交接将取用户确认；commit/merge 另行 authorize ✓
- F8 简单优先：全部选更简方案（文本约定>机制、单提交>窗口） ✓
- F9 可证伪不假绿：doctor warnings 可证伪；gated 事实不伪造通过 ✓
- F10 自动化按真实收益：只加有直接故障证据的测试与检查，无新增基建 ✓
- F11 正常执行优先、控制面受限：不新增控制面/计数器/gate ✓
- Q1 质量事实非许可：review/test 仅事实 ✓
- Q2 异源独立上下文：wh-review 保持 broker 异源 ✓
- Q3 人不越权：确认均取真实回复 ✓
- S1 技能独立可调用：wh-review 技能改动保持独立 ✓
- S2 技能可搬运不绑宿主：移除绑定正为此 ✓
- S3 技能窄接口：SKILL.md 改写不新增耦合 ✓
- S4 重活子代理：build-code 测试采集按 AGENTS.md 派工 ✓
- S5 事实如实：unavailable/gated 不伪造 ✓
- S6 最小材料：四材料不变，无第五材料 ✓
- S7 文档随代码：SKILL.md 与 CLI 删除同批 ✓
- S8 不绑单一宿主：删除宿主会话绑定族 ✓

## Phase P1 — 存储一致性

### Goal
doctor 机器核验+writer 来源记录+旧树归档+捕获点根治。
### Files
**MODIFY** `tools/cli/stage-runtime.mjs`（doctor 区）、`runtime/evidence/storage-root.mjs`、`tools/cli/task-bootstrap.mjs`（writer 来源区）、`runtime/stage/stage-context.mjs`、`runtime/evidence/canonical-receipt-writer.mjs`、`runtime/stage/stage-handlers.mjs`（仅 diff 证据捕获点区域）；**NEW** `tests/contract/doctor-storage-consistency.test.mjs`、`tests/contract/writer-resolution-source.test.mjs`、`tests/contract/diff-evidence-capture-point.test.mjs`、`tests/fixtures/diff-evidence/historical-untracked-mismatch.json`、`docs/operations/old-tree-archive.md`。

### Tasks
T1（RED）、T2（GREEN）、T3（RED）、T4（GREEN）、T5（ops）、T6（RED）、T7（GREEN）
### Verify
各对 gate_cmd RED→GREEN；T5 shell 断言。
### Knowledge
F-203/F-204/F-206/PFACT-01/04/05。
### STOP
需改 stage-runner.mjs 或越出捕获点区域 → 停止回本 Phase。
### Done
AC-1/AC-2/AC-3 证据齐。
### Risks and rollback
与 A 同文件分区纪律；全部可 revert。

## Phase P2 — B5a 身份移除

### Goal
会话派生移除+身份算法落地。
### Files
**MODIFY** `tools/cli/stage-runtime.mjs`（会话派生区）、`tools/cli/task-bootstrap.mjs`（绑定调用区）；**NEW** `tests/contract/identity-resolution.test.mjs`。

### Tasks
T8（RED）、T9（GREEN）
### Verify
identity-resolution.test RED→GREEN（六例+outcomes 完整性）。
### Knowledge
PFACT-02/07/08。
### STOP
需保留任何会话派生 → 停止回 make-decision。
### Done
AC-5 证据齐。
### Risks and rollback
旧记录只读；可 revert。

## Phase P3 — C 面契约守护

### Goal
broker 契约守护+调用约定文本。
### Files
**MODIFY** `skills/wh-review/scripts/review-provider-client.mjs`、`skills/wh-review/SKILL.md`；**NEW** `skills/wh-review/scripts/__tests__/provider-output-contract.test.mjs`。

### Tasks
T10（RED）、T11（GREEN）、T12（docs）
### Verify
provider-output-contract.test RED→GREEN；main 已有 `review-provider-client-timeout.test.mjs` 保持绿色；T12 grep 断言。
### Knowledge
PFACT-06；终态矩阵。
### STOP
需改公共 schema、重复实现 timeout 或新增进程生命周期机制 → 停止回本 Phase；main timeout 必须保留并有回归证据。
### Done
AC-4/AC-7 证据齐。
### Risks and rollback
fake 输出用 lessons 真实 payload 校准；可 revert。

## Phase P4 — B5b 原子批（gated）

### Goal
删三件套+bridge 显式输入+五份 SKILL.md 改写，单提交原子交付。
### Files
**MODIFY** `tools/host/workflowhub-stage-agent-bridge.mjs`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`；**NEW** `tests/contract/session-binding-removed.test.mjs`、`docs/adr/0024-remove-host-session-binding.md`。
**DELETE** `tools/host/workflowhub-codex-session-state.mjs`、`tools/host/workflowhub-codex-session-hook.mjs`、`tools/host/workflowhub-codex-session-event.mjs`。

### Tasks
T13（RED）、T14（GREEN 原子批）
### Verify
session-binding-removed.test RED→GREEN+提交内容断言。
### Knowledge
F-201/F-202 引用清单。
### STOP
gate 未释放 → 本 Phase 不启动；只有五份 SKILL.md 内容级无 session 引用且已有遗漏披露段时，才可跳过文档改写；当前 main 不满足，不能只做删除。
### Done
AC-6 证据齐（同提交+零残留）。
### Risks and rollback
部分缺失整体 revert；兜底 C-001。

## Phase P5 — 聚合验收

### Goal
全量回归+全 AC 证据聚合。
### Files
**MODIFY** `tests/contract/doctor-storage-consistency.test.mjs`、`tests/contract/writer-resolution-source.test.mjs`、`tests/contract/diff-evidence-capture-point.test.mjs`、`tests/contract/identity-resolution.test.mjs`、`tests/contract/session-binding-removed.test.mjs`、`skills/wh-review/scripts/__tests__/provider-output-contract.test.mjs`（聚合卡回填证据引用；另回归 main 已有 timeout 测试）。

### Tasks
T15（聚合卡）
### Verify
npm run test:safe && npm run check；另跑 `git diff --check`，若仅命中 main 已带入的 fixture EOF 空行则如实记录，不将其伪装为任务代码通过。
### Knowledge
质量缺失如实。
### STOP
任一 RED/GREEN 未闭合 → 回对应卡。
### Done
全 AC 证据齐（gated 项如实记录）。
### Risks and rollback
B5b 未释放时 AC-6 记 gated 而非通过。
