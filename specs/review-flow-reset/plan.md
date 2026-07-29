# 实现计划：事实组 2 完整修复与 WorkflowHub 质量恢复

- **Input**：`specs/review-flow-reset/spec.md`
- **Status**：Draft
- **Template version**：`plan-task.v3`

## 1. 速读卡

- **Goal**：在同一任务内恢复 WorkflowHub 的真实执行、聚焦验证、逐 AC 覆盖和人类交接。
- **Non-goals**：不新增正常确认、provider route、平行状态机、最终全量或重复审查；来源：spec §2。
- **Before**：局部审计缺口会放大为流程死锁，少量记录又可能被误报为完成。
- **After**：四材料只决定能否继续；任务完成只由 tasks.md 的真实执行填写区和同源证据证明。
- **Main risk**：为了消除 gate 而删除实际实现、测试、review 或交接。
- **Next step**：从 T001 RED 开始；任何 setup 失败先修 fixture。

## 2. Technical Context and Constraints

- **Language / runtime**：Node.js ESM、Vitest、Git worktree。
- **Primary dependencies**：现有 TaskHandle/TaskKernel、review-flow、recovery、stage runtime。
- **Storage / state**：任务记录 append-only；用户 worktree 不由通用 rollback 修改。
- **Testing**：每对 RED/GREEN 使用同一聚焦命令和 oracle；超过 120 秒停止。
- **Target environment**：macOS 本地 WorkflowHub。
- **Project type**：AI 开发工作流编排工具。
- **Performance goals**：不新增 provider 调用或最终全量。
- **Scale / scope**：T001–T012 和各 Phase 精确文件边界。
- **Relevant ADR / context**：`CONSTITUTION.md`、`CONTEXT.md`、`docs/adr/0011-authenticated-review-flow-generations.md`。
- **Unresolved facts**：T011 前最终候选完整性仍未知，必须保持进行中。

### Global Constraints

- 四材料可读即可进入或继续；accepted/receipt/review/audit 不作准入证。
- 正式 publication 的身份、hash、顺序和核心结构错误 fail-loud。
- `tasks.md` 是任务完成状态唯一权威；runtime 只读取和认证，不代替执行者勾选。
- 历史 accepted、receipt、review、audit 或旧 GREEN 不自动完成任何 Task。
- 不覆盖历史记录、不删除用户文件、不让 caller 指定 provider/identity。

## 3. Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"CONSTITUTION.md","hash":"a4c63f0c3865fdc2ea83b1f2aea0a824608f65512a27a21e05a58e2d80e16001","id":"CONSTITUTION","version":"1.5.0","clause_count":21}`

### Framework Principles

- [x] F1：核心只传递窄事实，重活留在技能和 producer。
- [x] F2：Task 卡、completion 填写区、review outcome 都是窄契约。
- [x] F3：四材料推进与 publication/完成判据分离。
- [x] F4：review 是建议事实，不成为开始修复的 gate。
- [x] F5：只修复已复现缺口，不预设新 gate。
- [x] F6：执行记录外置且按 invocation 认证。
- [x] F7：只保留三处正常确认，不顺带授权不可逆操作。
- [x] F8：复用现有 kernel/recovery/review authority。
- [x] F9：RED、结构错误、unavailable 和 unknown 均保持真实。
- [x] F10：不为机器校验本身扩建平台。

### Quality Principles

- [x] Q1：质量事实不作准入证，完成质量不降级。
- [x] Q2：推进、publication、完成三个谓词分离。
- [x] Q3：质量裁决仍由独立来源产出。

### Skill Principles

- [x] S1：复用现有技能和模板。
- [x] S2：只做合宪适配。
- [x] S3：使用 main 已合入的最新 v3 template。
- [x] S4：保留统一执行记录。
- [x] S5：Task 卡适合独立执行。
- [x] S6：沿用 AgentHub Phase/Task 结构。
- [x] S7：一阶段一技能、一工作流一目录不变。
- [x] S8：材料不绑定单一宿主。

**Result**：21/21 addressed；无宪法 blocker。

## 4. Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| Project rules | `CONSTITUTION.md`, `constitution-checklist.md` | no change | N/A | 当前宪法已覆盖完成模型 |
| Workflow contracts | `core/stage-*.mjs`, `workflows/*/SKILL.md` | change | T002,T006,T008,T010,T012 | 恢复真实执行和交接 |
| Review contracts | `skills/wh-review/scripts/*.mjs` | change | T006,T008,T012 | 同源、复用、reset |
| Schemas and events | recovery v1 schemas、journal | change | T004,T008 | 白名单和 attempt-N |
| Runtime configuration | `config/review-providers.json` | no change | N/A | provider route 不变 |
| Knowledge and docs | `specs/review-flow-reset/*`、tasks template | change | T010 | 唯一执行清单 |
| Automation gates | 聚焦 Vitest 文件 | change | T001–T012 | RED/GREEN 和回归 |

## 5. Technical Decisions

### DEC-001 — 单一写边界预检
- **Problem**：official owner 可能绕过结构认证。
- **Options**：复制校验 / 共享一次结果 / 新 gate 平台。
- **Selected**：extend — 共享一次 preflight result。
- **Reason**：最窄且不阻断四材料进入。
- **Consequence / risk**：owner 清单遗漏会产生绕过。
- **Fallback**：保留 RED，撤回未闭合接入。

### DEC-002 — 复用 recovery registry
- **Problem**：第三种恢复可能只改一层白名单。
- **Options**：ad-hoc 分支 / 扩展 v1 registry / 新 v2 状态机。
- **Selected**：extend — 扩展现有 v1 registry 和全部权威面。
- **Reason**：兼容旧字节且无平行状态机。
- **Consequence / risk**：schema/validator/path/CLI 需保持一致。
- **Fallback**：撤回第三种 kind，不触碰 worktree。

### DEC-003 — tasks.md 唯一完成权威
- **Problem**：历史记录或 runtime 推断会把未执行任务自动标完成。
- **Options**：runtime 自动完成 / 多份状态 / 执行者填写一份清单。
- **Selected**：extend — 在唯一 Task 卡内增加任务级完成填写区。
- **Reason**：一个任务一个核心交付物，状态与证据同处且可读。
- **Consequence / risk**：执行者必须维护实际命令、证据和时间。
- **Fallback**：保持 pending/in_progress，不制造 completed。

## 6. Solution Design

### Overview

Phase 1–4 修复身份、recovery、同源和 review lifecycle。Phase 5 把五阶段实际动作投影为 completion 事实，并把 `tasks.md` 保持为唯一执行状态。Phase 6 对最终候选做差距图、聚焦修复和一次真实 integration review。

runtime 只能读取并认证 Task 卡的完成勾选与填写区是否和实际代码、命令 exit、证据、AC、review 一致。runtime 不得替执行者勾选，也不得因 accepted、receipt 或 review 存在自动完成 Task。

### Module responsibilities

#### Task materials
- **Responsibility**：定义唯一 Phase、Task、DAG、边界和完成填写区。
- **Consumes**：accepted spec、plan、当前执行事实。
- **Produces**：唯一 `tasks.md` 执行清单。
- **Must not decide**：不得从历史记录推断完成。

#### Runtime and kernel
- **Responsibility**：认证身份、结构、hash、状态声明与实际事实一致。
- **Consumes**：当前四材料和正式 producer 事实。
- **Produces**：append-only attempt/accepted/evidence。
- **Must not decide**：不得代替执行者勾选 Task 或重裁 provider。

### Conditional contracts

- **UI**：N/A — 本需求无产品 UI；host-visible 卡片保持大白话。
- **Externally maintained code**：N/A — 不引入外部维护代码。

## 7. Data Model and Lifecycle

Task 完成填写区字段：checkbox、`status`、`actual_changes`、`executed_commands`、`evidence_refs`、`covered_ac`、`review_fact`、`completed_at`。只有 status=completed、checkbox 已勾且其余字段均为真实非占位事实时，Task 才能被认证为完成。pending/in_progress 不允许阶段完成。

## 8. API Contract

N/A — 不新增外部 HTTP API。现有 CLI 和 TaskKernel 接口按各 Task 卡边界扩展。

## 9. File Boundary

### NEW
- `core/write-boundary-preflight.mjs`
- `docs/adr/0011-authenticated-review-flow-generations.md`
- `apply/evidence/current-diff-ac-coverage.json`

### MODIFY
- `core/invocation-identity.mjs`
- `core/stage-context.mjs`
- `core/task-handle.mjs`
- `core/stage-runner.mjs`
- `core/canonical-receipt-writer.mjs`
- `core/task-recovery.mjs`
- `core/task-close.mjs`
- `core/task-kernel-implementation.mjs`
- `core/build-spec-receipt-recovery.mjs`
- `core/workspace.mjs`
- `core/local-skill-resolver.mjs`
- `core/capability-doctor.mjs`
- `core/stage-skill-runtime.mjs`
- `core/receipt-writer.mjs`
- `core/audit-aggregator.mjs`
- `core/review-flow-authority.mjs`
- `core/stage-content-evidence.mjs`
- `core/stage-content-contracts.mjs`
- `core/stage-completion-facts.mjs`
- `core/stage-handlers.mjs`
- `core/schemas/workflowhub-recovery-credential.v1.json`
- `core/schemas/workflowhub-recovery-generation.v1.json`
- `core/__tests__/invocation-identity.test.mjs`
- `core/__tests__/stage-context.test.mjs`
- `core/__tests__/task-kernel-publish.test.mjs`
- `core/__tests__/task-recovery.test.mjs`
- `core/__tests__/task-handle.test.mjs`
- `core/__tests__/workspace-manager.test.mjs`
- `core/__tests__/local-skill-resolver.test.mjs`
- `core/__tests__/capability-doctor.test.mjs`
- `core/__tests__/stage-skill-runtime.test.mjs`
- `core/__tests__/receipt-writer.test.mjs`
- `scripts/stage-runtime.mjs`
- `scripts/task-recovery.mjs`
- `scripts/task-close.mjs`
- `scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`
- `scripts/__tests__/stage-runtime-spec-recovery.test.mjs`
- `scripts/__tests__/task-recovery.test.mjs`
- `skills/wh-review/scripts/review-materials.mjs`
- `skills/wh-review/scripts/review-runner.mjs`
- `skills/wh-review/scripts/review-controller.mjs`
- `skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- `skills/spec-tasks/SKILL.md`
- `skills/spec-tasks/templates/tasks-template.md`
- `workflows/make-decision/SKILL.md`
- `workflows/build-spec/SKILL.md`
- `workflows/build-plan/SKILL.md`
- `workflows/build-code/SKILL.md`
- `workflows/build-code/steps.json`
- `workflows/verify-code/SKILL.md`
- `tests/task-close-delivery.test.mjs`
- `tests/terminal-runtime-blockers.test.mjs`
- `tests/stage-completion-facts.test.mjs`
- `tests/interaction-quality-contract.test.mjs`
- `tests/stage-plan-task-contract-v3.test.mjs`
- `specs/review-flow-reset/spec.md`
- `specs/review-flow-reset/plan.md`
- `specs/review-flow-reset/tasks.md`

### DO NOT TOUCH
- `config/review-providers.json`
- 历史 task records/accepted/receipt/review bytes
- `.git/`

## 10. Data Flow and Integration

```text
spec → plan Phase → tasks 唯一 Task 卡 → 执行者填写完成事实 → runtime 只读认证 → stage result
```

- **Existing modules / packages / services**：TaskHandle、TaskKernel、wh-review、recovery core。
- **Integration points**：official owner、review runner、stage handler、Task material validator。
- **Compatibility boundaries**：四材料推进、三处确认、provider route、旧 v1 字节。
- **Fail-loud behavior**：结构错绑或 completed 声明与事实不符时拒绝完成；pending/in_progress 保持可继续修复。

## 11. Code Anchors and Reuse

### Versioned identity and context projection
- **Spec binding**：`{"artifact_kind":"spec","ref":"specs/review-flow-reset/spec.md","hash":"b3b3b50f908e4a77d748bf5c83d9235cb8aa02f162b089bf332e97329a43b4a1","id":"REVIEW-FLOW-RESET"}`
- **read_now**：TaskKernel publication、stage handlers、v3 templates。
- **must_read_before_task**：各 Task 的精确文件和 gate。
- **Context mode**：Full — 跨五阶段但按 Phase 串行。

### Verified anchors

| Anchor | Path and symbol | Current responsibility | Intended use | Forbidden change |
| --- | --- | --- | --- | --- |
| A-001 | `core/task-kernel-implementation.mjs` | publication/review authority | extend | 不造平行 state |
| A-002 | `core/stage-runner.mjs` | official stage boundary | extend | 不把 audit 当入口 gate |
| A-003 | `core/stage-content-contracts.mjs` | plan/task validation | extend | 不生成完成状态 |
| A-004 | `skills/spec-tasks/templates/tasks-template.md` | Task 卡模板 | extend | 不产生第二执行清单 |

### Reuse → Extend → New

| Capability | Decision | Existing candidates | Reason |
| --- | --- | --- | --- |
| publication | extend | TaskKernel | 单一权威 |
| recovery | extend | recovery registry | 兼容旧 v1 |
| completion | extend | tasks v3 + stage completion facts | 不造新状态机 |

### Existing interface signatures

| Signature ID | Object | Verified current signature/schema | Source anchor |
| --- | --- | --- | --- |
| SIG-001 | Task card | v3 unique card + gate/oracle/evidence | A-004 |
| SIG-002 | Stage publication | handler facts → TaskKernel attempt | A-001,A-002 |

## 12. Rollback and Recovery

- **Global recovery rule**：保留 accepted 和历史记录，只恢复当前实现字节。
- **Irreversible boundaries**：commit/push/merge/archive/cleanup 单独授权。
- **Recovery owner**：当前 Task 执行者按卡片 recovery 字段处理。

### Engineering Risk Handoff

- **PLAN-RISK-001**：去 gate 被误实现为去质量工作
  - **Affected IDs**：FR-CORE-001、FR-PROCESS-001、AC-11、AC-12、AC-18
  - **Trigger**：缺实现/测试/AC/review 时仍 completed。
  - **Consequence**：假绿并过早进入 verify-code。
  - **Mitigation or STOP**：T011 复现，T012 只修映射缺口。
  - **Handling Stage**：build-code
  - **Verification**：同一聚焦命令 RED→GREEN。

## 13. Test Strategy

- **Target**：18 FR、21 AC、30 source、12 Task 和任务完成状态。
- **gate_cmd**：见 T001–T012 各 Task 卡；不拼成最终全量。
- **expected_exit**：RED 非零，配对 GREEN 为 0。
- **evidence_path**：`apply/evidence/` 下各 Task 声明路径。
- **display_cmd**：`git diff --stat`
- **Oracle ID and result**：各 Task 的稳定 ORACLE；setup 失败不算 RED。

## 14. Implementation Order

T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011 → T012。producer、schema、consumer 按卡片依赖串行；只在文件和输入完全独立时并行采集。

## Phase 1：统一身份、结构预检与路径交接

### Goal
三个 official owner 共享一次真实写边界认证，路径卡只作可验证交接。
### Files
- **NEW**：`core/write-boundary-preflight.mjs`
- **MODIFY**：`core/invocation-identity.mjs`、`core/stage-context.mjs`、`core/task-handle.mjs`、`core/stage-runner.mjs`、`core/canonical-receipt-writer.mjs`、`core/task-recovery.mjs`、`core/task-close.mjs`、`scripts/stage-runtime.mjs`、`scripts/task-recovery.mjs`、`scripts/task-close.mjs`、`core/__tests__/invocation-identity.test.mjs`、`core/__tests__/stage-context.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`scripts/__tests__/task-recovery.test.mjs`、`tests/task-close-delivery.test.mjs`
- **DO NOT TOUCH**：`CONSTITUTION.md`、`constitution-checklist.md`、`.git/`
### Tasks
- T001 RED；T002 GREEN。详细合同只见 `tasks.md`。
### Verify
- T001/T002 同一 gate；AC-01–04；证据见 `apply/evidence/write-boundary-*`。
### Knowledge
- official owner 清单来自当前 runtime/recovery/close 入口。
### STOP
- 预检阻断四材料进入、需要每条 journal 重跑或触碰用户文件。
### Done
- 三个 owner 无绕过且共享一次结果。
### Risks and rollback
- **Risk**：入口遗漏。
- **Prevention**：owner 清单对照测试。
- **Rollback / recovery**：撤回 owner 接入，保留 RED。

## Phase 2：统一正式写边界与 recovery operation

### Goal
三类 recovery operation 共享 registry、锁、CAS、rollback 和 replay。
### Files
- **NEW**：N/A — 复用 recovery core。
- **MODIFY**：`core/task-recovery.mjs`、`core/schemas/workflowhub-recovery-credential.v1.json`、`core/schemas/workflowhub-recovery-generation.v1.json`、`core/task-handle.mjs`、`core/stage-runner.mjs`、`core/task-kernel-implementation.mjs`、`core/canonical-receipt-writer.mjs`、`core/workspace.mjs`、`core/task-close.mjs`、`scripts/task-recovery.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`core/__tests__/task-recovery.test.mjs`、`core/__tests__/task-handle.test.mjs`、`core/__tests__/workspace-manager.test.mjs`、`scripts/__tests__/task-recovery.test.mjs`、`tests/task-close-delivery.test.mjs`、`tests/terminal-runtime-blockers.test.mjs`
- **DO NOT TOUCH**：历史 recovery bytes、`.git/`
### Tasks
- T003 RED；T004 GREEN。
### Verify
- AC-08–10；schema/validator/path/CLI parity、竞态、rollback、replay。
### Knowledge
- 旧 credential/generation v1 保持原字节语义。
### STOP
- 需要 v2 影子格式、Git cleanup/reset 或覆盖第三方 pointer。
### Done
- 三类 kind 由同一解释器消费。
### Risks and rollback
- **Risk**：白名单漂移。
- **Prevention**：逐层 parity 测试。
- **Rollback / recovery**：撤回第三种 kind 元数据。

## Phase 3：技能、材料与快照同源

### Goal
provider 前本地材料 fail-loud，五类记录同字节同快照。
### Files
- **NEW**：N/A — 扩展现有测试。
- **MODIFY**：`core/local-skill-resolver.mjs`、`core/capability-doctor.mjs`、`core/stage-skill-runtime.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`core/stage-runner.mjs`、`core/receipt-writer.mjs`、`core/canonical-receipt-writer.mjs`、`core/task-kernel-implementation.mjs`、`core/build-spec-receipt-recovery.mjs`、`core/stage-handlers.mjs`、`scripts/stage-runtime.mjs`、`core/__tests__/local-skill-resolver.test.mjs`、`core/__tests__/capability-doctor.test.mjs`、`core/__tests__/stage-skill-runtime.test.mjs`、`core/__tests__/receipt-writer.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`scripts/__tests__/stage-runtime-spec-recovery.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- **DO NOT TOUCH**：`config/review-providers.json`
### Tasks
- T005 RED；T006 GREEN。
### Verify
- AC-05–07；provider_calls=0 仅限本地材料/anchor 错误。
### Knowledge
- receipt-writer 是 step 原子写入口。
### STOP
- 需要 fallback、doctor gate 或 provider route 改动。
### Done
- artifact/receipt/review/attempt/checkpoint 同源。
### Risks and rollback
- **Risk**：零调用边界被扩大。
- **Prevention**：窄 fixture。
- **Rollback / recovery**：撤回新增调用，保留本地审计。

## Phase 4：单核心、attempt-N 与 review-flow reset

### Goal
support 不制造第二核心；step 重试和 review generation 保持单一 authority。
### Files
- **NEW**：`docs/adr/0011-authenticated-review-flow-generations.md`
- **MODIFY**：`core/task-kernel-implementation.mjs`、`core/task-handle.mjs`、`core/audit-aggregator.mjs`、`core/canonical-receipt-writer.mjs`、`core/stage-runner.mjs`、`core/review-flow-authority.mjs`、`skills/wh-review/scripts/review-controller.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`core/__tests__/task-handle.test.mjs`、`core/__tests__/receipt-writer.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- **DO NOT TOUCH**：`config/review-providers.json`、历史 generation bytes。
### Tasks
- T007 RED；T008 GREEN。
### Verify
- AC-11–16；同一聚焦组，不调用真实 provider。
### Knowledge
- reset 扩展现有 TaskKernel/review authority。
### STOP
- accepted reset、旧链改写、caller provider 或新状态机。
### Done
- 核心错误真失败、target attempt-N、复用/reset 合法。
### Risks and rollback
- **Risk**：reset 成为循环重审入口。
- **Prevention**：每代最多一次 full、旧代拒写。
- **Rollback / recovery**：保留旧 flow bytes 和 RED。

## Phase 5：五阶段流程完成与人类交接

### Goal
clarify、review、摘要、任务状态和来源覆盖均来自当前真实材料。
### Files
- **NEW**：N/A — 扩展现有材料和测试。
- **MODIFY**：`core/stage-context.mjs`、`core/workspace.mjs`、`core/canonical-receipt-writer.mjs`、`core/schemas/ambiguity-ledger.v2.json`、`core/schemas/stage-completion-facts.v1.json`、`core/stage-content-evidence.mjs`、`core/stage-content-contracts.mjs`、`core/stage-completion-facts.mjs`、`core/stage-handlers.mjs`、`core/stage-runner.mjs`、`scripts/stage-runtime.mjs`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/build-code/steps.json`、`workflows/build-code/phase-evidence.mjs`、`workflows/verify-code/SKILL.md`、`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`、`tests/stage-completion-facts.test.mjs`、`tests/interaction-quality-contract.test.mjs`、`tests/stage-plan-task-contract-v3.test.mjs`、`specs/review-flow-reset/spec.md`、`specs/review-flow-reset/plan.md`、`specs/review-flow-reset/tasks.md`、`skills/spec-tasks/SKILL.md`、`skills/spec-tasks/templates/tasks-template.md`
- **DO NOT TOUCH**：`config/review-providers.json`、历史正式记录。
### Tasks
- T009 RED；T010 GREEN。
### Verify
- AC-17–21；真实 material validator；30 source 双向差集为空；build-code 最终 integration 与 verify-code 分别认证同一 `tasks.md` 的完成填写及其代码、测试、AC、review 证据。
### Knowledge
- tasks.md 是唯一 Task 状态，runtime 只读认证。
- Phase review 绑定 implementation/test tree；review 后的 tasks-only completion 只允许改对应填写区，由下一 Phase/最终 integration 认证，不重复审查。
### STOP
- 新增正常确认、摘要补造执行事实或历史记录自动勾选。
### Done
- 五阶段组件闭合，build-plan 摘要和 Task 状态真实；tasks-only completion seam 不扩大业务 diff、不触发重复 Phase review。
### Risks and rollback
- **Risk**：validator 自己成为推进 gate。
- **Prevention**：只约束 completed 声明，不阻止继续修复。
- **Rollback / recovery**：保持任务 in_progress。

## Phase 6：本轮质量坍塌修复与 build-code 重做

### Goal
对最终候选逐项补齐 21 AC，并真实完成 build-code。
### Files
- **NEW**：`apply/evidence/current-diff-ac-coverage.json`
- **MODIFY**：`core/__tests__/stage-context.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`tests/stage-completion-facts.test.mjs`、`tests/interaction-quality-contract.test.mjs`；生产文件候选白名单固定为 `core/write-boundary-preflight.mjs`、`core/invocation-identity.mjs`、`core/stage-context.mjs`、`core/task-handle.mjs`、`core/stage-runner.mjs`、`core/canonical-receipt-writer.mjs`、`core/task-recovery.mjs`、`core/task-close.mjs`、`scripts/stage-runtime.mjs`、`scripts/task-recovery.mjs`、`scripts/task-close.mjs`、`core/schemas/workflowhub-recovery-credential.v1.json`、`core/schemas/workflowhub-recovery-generation.v1.json`、`core/schemas/ambiguity-ledger.v2.json`、`core/schemas/stage-completion-facts.v1.json`、`core/task-kernel-implementation.mjs`、`core/workspace.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`core/local-skill-resolver.mjs`、`core/capability-doctor.mjs`、`core/stage-skill-runtime.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`core/receipt-writer.mjs`、`core/audit-aggregator.mjs`、`core/review-flow-authority.mjs`、`skills/wh-review/scripts/review-controller.mjs`、`core/stage-content-evidence.mjs`、`core/stage-content-contracts.mjs`、`core/stage-completion-facts.mjs`、`core/stage-handlers.mjs`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/build-code/steps.json`、`workflows/build-code/phase-evidence.mjs`、`workflows/verify-code/SKILL.md`、`skills/spec-tasks/SKILL.md`、`skills/spec-tasks/templates/tasks-template.md`；T012 只能启用其中被差距图标为 missing 或 contradicted 的文件。
- **DO NOT TOUCH**：provider config、历史 task records、`.git/`。
### Tasks
- T011 RED/差距图；T012 GREEN/收口。
### Verify
- 聚焦 quality-completion 组；最终一次 integration review 或真实 unavailable。
### Knowledge
- 旧 live attempt 和局部 GREEN 只是线索。
### STOP
- 只能靠全量、重复 provider 或改历史 bytes 得到结论。
### Done
- 21 AC 有当前证据；build-code 最终 integration 已认证 T001–T012 填写区，verify-code 随后对同一 `tasks.md` 独立复核。
### Risks and rollback
- **Risk**：旧证据 stale。
- **Prevention**：代码、命令、snapshot 变化即刷新受影响组。
- **Rollback / recovery**：保持未完成项和真实状态。

## 15. Dependencies and Parallelism

```text
T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011 → T012 → verify-code
```

- Phase 内只允许互不重叠文件的 RED 采集并行。
- shared kernel/runner 文件串行整合。
- 后续修改共享文件只刷新受影响的早期聚焦 gate。

## 16. Requirement and Verification Traceability

| FR | Task IDs | AC IDs | Phase | Gate / evidence |
| --- | --- | --- | --- | --- |
| FR-IDENTITY-001 | T001,T002,T011,T012 | AC-01 | Phase 1,6 | write-boundary |
| FR-PATH-001 | T001,T002,T011,T012 | AC-02 | Phase 1,6 | path-card |
| FR-PREFLIGHT-001,002 | T001–T004,T011,T012 | AC-03,04 | Phase 1,2,6 | preflight |
| FR-SKILL-001 | T005,T006,T011,T012 | AC-05 | Phase 3,6 | skill-material |
| FR-MATERIAL-001 | T005,T006,T011,T012 | AC-06 | Phase 3,6 | skill-material |
| FR-ATOMIC-001 | T005,T006,T011,T012 | AC-07 | Phase 3,6 | atomicity |
| FR-RECOVERY-001,002,003 | T003,T004,T011,T012 | AC-08,09,10 | Phase 2,6 | recovery |
| FR-CORE-001 | T007,T008,T011,T012 | AC-11,12 | Phase 4,6 | core-review |
| FR-ATTEMPT-001 | T007,T008,T011,T012 | AC-13 | Phase 4,6 | attempt-N |
| FR-REVIEW-001,002 | T007,T008,T011,T012 | AC-14,15,16 | Phase 4,6 | review-flow |
| FR-PROCESS-001,002 | T009,T010,T011,T012 | AC-17,18,21 | Phase 5,6 | process |
| FR-HANDOFF-001 | T009,T010,T011,T012 | AC-19 | Phase 5,6 | handoff |
| FR-VERIFY-001 | T009,T010,T011,T012 | AC-20 | Phase 5,6 | focused verify |

## 17. Source Coverage

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
