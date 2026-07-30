# 实现计划：WorkflowHub 核心质量流程真实执行与轻量记录

- **Input**：`specs/workflow-quality-recording-simplification/spec.md`
- **Status**：In progress — transparent recovery；T001–T012、T014–T021 complete；make-decision 与 build-spec 已正式接受；T013 等待最终 integration review
- **Template version**：`plan-task.v2`

## 1. 速读卡

- **Goal**：五阶段声明动作真实执行且可核对；四材料可更新；audit 不作 Gate；review 不循环。
- **Non-goals**：不改 talk/grill 业务方法，不造认证平台、第二状态机或新确认点，不自动二审。来源：spec §1、§7。
- **Before**：手写 payload、receipt 或 journal 可被误当成 Skill 已执行，质量步骤与完成声明脱节。
- **After**：真实 `hostInvoke` 产生 invocation fact；统一 reconcile 用真实调用和业务事实判断完成。
- **Main risk**：把“真实执行”误实现为新的开发进入 Gate。
- **Next step**：完成 build-plan 正式审查与确认，再以当前已完成 Phase 证据进入最终 integration review；不重复全量测试或 provider review。

## 2. Technical Context and Constraints

- **Language / runtime**：Node.js ESM；仓库锁定版本的 Vitest；Git worktree。
- **Primary dependencies**：现有 TaskKernel、`stage-skill-runtime`、stage content evidence、`wh-review`。
- **Storage / state**：正式事实 append-only；历史 accepted/review/run 字节只读。
- **Testing**：RED/GREEN 使用同一聚焦命令和 oracle；单 worker；T014 仅一次全量。
- **Target environment**：macOS 本地 WorkflowHub，可由不同宿主提供 `hostInvoke`。
- **Project type**：可搬运的 AI 开发工作流编排工具。
- **Performance goals**：同一 review subject 最多一次 initial provider dispatch；普通修复 provider 调用数为 0。
- **Scale / scope**：五阶段、21 个 Task、3 个窄新 schema 和 1 个窄 invocation writer。
- **Relevant ADR / context**：`CONSTITUTION.md`、`CONTEXT.md`、处理组 3 问题 9/15。
- **Current unresolved fact**：make-decision 与 build-spec 已正式接受；原 `revise_required` review 及其 resolution 均保留。build-spec runtime、completion audit、可恢复 attempt 与 current-revision checkpoint 已完成聚焦验证。当前只剩 build-plan 正式审查/确认、build-code 的 T013 唯一 integration review，以及 verify-code；不得为 provider warning 重跑 review 或改全局配置。

### Global Constraints

- 四材料可读只决定能否继续 build-code/verify-code。
- 正式 identity/binding/publication 结构错误仍在写入前 fail-loud。
- invocation、代码、测试、逐 AC、独立 review 和交接缺失时不得宣称完成。
- audit/support 缺失只披露 `missing/unavailable`，不转换为业务 pass/fail。
- 每个 Phase 的最终 GREEN 候选做一次聚焦独立 review；finding 修复只做 resolution + 聚焦验证，不二审。
- T013 是唯一 integration review，不替代也不重复各 Phase 的首次聚焦 review。
- reviewer verdict 原值保留；修复只追加 resolution 和聚焦证据，不自动二审。
- 不覆盖历史记录，不让 caller 自报 executed，不保存浏览器凭据。

## 3. Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"CONSTITUTION.md","hash":"a4c63f0c3865fdc2ea83b1f2aea0a824608f65512a27a21e05a58e2d80e16001","id":"CONSTITUTION","version":"1.5.0","clause_count":21}`

### Framework Principles

- [x] F1：核心只调度、收窄事实和 reconcile，业务方法留在 Skill。
- [x] F2：invocation、revision、browser evidence 都使用窄契约。
- [x] F3：推进、正式 publication、完成声明分离。
- [x] F4：独立 review 保留，finding 不锁死同任务修复。
- [x] F5：只修已复现漏调、循环 review、材料和证据缺口。
- [x] F6：执行事实写入统一外置记录。
- [x] F7：只保留 make-decision、build-plan、verify-code 三处正常确认。
- [x] F8：复用 TaskKernel、hostInvoke、review flow，不建平行平台。
- [x] F9：missing/unavailable/unknown 如实，不假绿。
- [x] F10：新增 schema 仅覆盖真实漏口，不为机器可校验本身扩建系统。

### Quality Principles

- [x] Q1：质量事实不作进入许可证，完成质量不降级。
- [x] Q2：三种谓词分别认证。
- [x] Q3：最终 integration review 来自独立来源。

### Skill Principles

- [x] S1：复用现有 `isolated-browser-qa`、`wh-review` 和 review-response。
- [x] S2：只做符合当前宪法的窄适配。
- [x] S3：迭代时以仓库当前 bundle 和签名为准。
- [x] S4：invocation 进入统一执行记录和指标底座。
- [x] S5：重测试和独立 review 可在独立上下文执行。
- [x] S6：沿用现有 hostInvoke、review controller 和证据合同。
- [x] S7：五阶段一阶段一技能、一工作流一目录不变。
- [x] S8：不绑定 Codex、Multica 或单一浏览器宿主。

**Result**：21/21 addressed；无需修改宪法或 checklist；无宪法 blocker。

## 4. Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| Project rules | `CONSTITUTION.md`, `constitution-checklist.md` | no change | N/A | 1.5.0 已覆盖三谓词 |
| Workflow contracts | `core/stage-*.mjs`, `workflows/*` | change | T002,T004,T008,T012 | 真实调用与完成核对 |
| Review contracts | `skills/wh-review/scripts/*.mjs` | change | T006 | 去重、resolution、replay |
| Schemas and events | `core/schemas/*.json` | change | T002,T008,T010 | 三个窄事实合同 |
| Runtime configuration | `config/review-providers.json` | no change | N/A | provider route 不变 |
| Knowledge and docs | 当前四材料 | change | T008 | current revision 可追溯 |
| Automation gates | 聚焦 Vitest 与一次 `npm run check` | change | T001-T014 | RED/GREEN 与最终回归 |

## 5. Technical Decisions

### DEC-001 — runtime-owned invocation fact

- **Problem**：声明 Skill 可被手写内容证据或 journal 冒充执行。
- **Options**：caller 自报 / 宿主签名平台 / runtime 在真实 hostInvoke 后写事实。
- **Selected**：extend — 扩展现有 `stage-skill-runtime` 与 TaskKernel 写入窄 invocation fact。
- **Reason**：直接绑定现有真实调用边界，不修改具体 Skill 方法。
- **Consequence / risk**：direct、conditional、reviewer-owned lens 的 owner 必须明确。
- **Fallback**：缺事实保持 incomplete；不倒填历史。

### DEC-002 — 单一 completion reconciler

- **Problem**：steps/deps、内容证据与业务完成分散，步骤打卡可假绿。
- **Options**：每阶段复制判断 / 新 Gate 平台 / 扩展现有 completion facts。
- **Selected**：extend — 用一个 reconciler 消费 steps、deps、invocation 与 business facts。
- **Reason**：一个完成事实源，且不改变进入条件。
- **Consequence / risk**：若混入推进资格，会形成新 Gate。
- **Fallback**：只保留诊断输出，阶段维持 incomplete。

### DEC-003 — 原 verdict 加 append-only resolution

- **Problem**：修复 finding 后强制二审会形成无限 review 循环。
- **Options**：覆盖旧 verdict / 自动 full review / 保留 verdict 并聚焦验证。
- **Selected**：extend — 复用 review flow 的 resolution，普通修复零 provider。
- **Reason**：历史真实、成本可控，不制造 pass。
- **Consequence / risk**：resolution 必须绑定 finding、当前 diff、测试与 AC。
- **Fallback**：无法验证时标 `unverified`，不二审。

### DEC-004 — current material revision

- **Problem**：四材料更新被旧 hash/checkpoint/reopen 机制阻断。
- **Options**：新任务 / reopen 平台 / 当前材料追加轻量 revision。
- **Selected**：extend — 扩展现有 content evidence，记录 parent、files、source 和 hash。
- **Reason**：同任务持续工作，旧版本仍可追溯。
- **Consequence / risk**：需求级修改必须同步来源映射。
- **Fallback**：映射不完整则保持材料 incomplete，不冻结开发。

### DEC-005 — browser evidence schema

- **Problem**：“页面测试通过”无法说明页面、登录态、性能、截图和 cleanup。
- **Options**：自由文本 / 宿主专用格式 / 通用 typed evidence。
- **Selected**：new — 新增 `browser-qa-evidence.v1`，由现有 isolated-browser-qa 产出。
- **Reason**：当前没有同时覆盖全部必需字段的通用事实合同。
- **Consequence / risk**：字段过多可能误变全局 Gate。
- **Fallback**：只对适用 UI AC 启用；非 UI 明确 N/A。
- **F10 real threat**：空泛结论无法复核真实浏览器验收。
- **F10 existing cover**：现有 Skill 有隔离、登录态和 cleanup 指令，但无统一完成事实。
- **F10 bypassable**：是；仅写“页面通过”可绕过。
- **F10 maintenance cost**：一个小 schema、writer allowlist 和聚焦合同测试。
- **F10 disposition**：keep

### DEC-006 — invocation schema

- **Problem**：现有 content evidence 不能证明 Skill 真实被调用。
- **Options**：复用 content kind / journal 扩字段 / 独立窄 invocation schema。
- **Selected**：new — 新增 `stage-skill-invocation.v1` 与窄 writer。
- **Reason**：调用事实和业务内容语义不同，不能继续混用。
- **Consequence / risk**：不得长成第二套运行状态机。
- **Fallback**：只保留 create-only executed/trigger_false/unavailable 三态。
- **F10 real threat**：五阶段声明动作可被跳过并假称完成。
- **F10 existing cover**：现有 `hostInvoke` 可执行，但没有 runtime-owned 完成事实。
- **F10 bypassable**：是；caller 可直接发布 content payload。
- **F10 maintenance cost**：一个 schema、一个窄 writer、现有 runtime 接线。
- **F10 disposition**：keep

### DEC-007 — DEC-004 的 schema 实现选择

- **Problem**：DEC-004 已选择轻量 current revision；本决策只确定其 typed schema 边界。
- **Options**：覆盖文件无历史 / 复用旧 reopen / 轻量 revision。
- **Selected**：new — 新增 `task-material-revision.v1`，只保存 lineage 和来源。
- **Reason**：保留历史但不创建推进许可证。
- **Consequence / risk**：不得演化成 generation/reset Gate。
- **Fallback**：当前文件仍可读；revision 缺失只披露。
- **F10 real threat**：正常需求补充被迫新任务或卡死开发。
- **F10 existing cover**：现有 hash/checkpoint 能追溯，但耦合过重。
- **F10 bypassable**：否；问题是过度阻断。
- **F10 maintenance cost**：一个小 schema 与现有 evidence writer 分支。
- **F10 disposition**：keep

## 6. Solution Design

### Overview

先接通所有五阶段的真实 Skill 调用事实，再让统一 reconciler 区分“能继续工作、能正式写入、能宣称完成”。这两层完成后，review、材料、浏览器证据和 verify-code 只消费同一事实底座。

review controller 持有 canonical head。同 subject 不重复 initial；普通修复追加 resolution 与聚焦证据。四材料使用 current revision，不触发 reopen/reset/full review。浏览器证据只在 UI AC 适用时生效。

### Module responsibilities

#### Stage skill runtime

- **Responsibility**：解析声明、调用 hostInvoke、发布 invocation fact。
- **Consumes**：StageContext、`skill-deps.yaml`、hostInvoke result。
- **Produces**：executed、trigger_false 或 unavailable invocation fact。
- **Must not decide**：代码质量、AC、review verdict 或用户确认。

#### Completion reconciler

- **Responsibility**：对账 steps、deps、invocation 和 business facts。
- **Consumes**：认证 facts 与当前阶段 manifest。
- **Produces**：complete/incomplete/unknown 和缺口列表。
- **Must not decide**：是否允许继续编辑或修复。

#### Review controller

- **Responsibility**：读取 canonical head、去重 initial、验证 resolution/replay。
- **Consumes**：subject、材料、历史结果和 finding response。
- **Produces**：原 verdict、resolution 或真实 unavailable。
- **Must not decide**：阶段 accepted 或业务 pass。

#### Browser QA

- **Responsibility**：记录适用 UI AC 的可定位测试事实。
- **Consumes**：页面、场景、工具、auth 状态、性能、截图、命令和 cleanup。
- **Produces**：`browser-qa-evidence.v1`。
- **Must not decide**：非 UI 任务完成。

### Conditional contracts

- **UI**：仅 UI acceptance 触发；证据含 route、scenario、tool、auth、performance、screenshot、test command/exit、cleanup、snapshot；不可保存 cookie/token。
- **Externally maintained code**：N/A — 不引入外部维护代码或新依赖。

## 7. Data Model and Lifecycle

- Invocation key：`task + stage + run + skill + invocation_key` create-only。
- Invocation status：`executed` 必须有 result；`trigger_false` 必须有 false reason；`unavailable` 必须有真实原因。
- Material revision：`revision_id + parent_revision + changed_files + change_summary + source_refs + hashes`；旧 revision 只读。
- Browser evidence：只绑定当前 snapshot；性能允许 `not_measured/not_applicable + reason`。
- Review：原 result 永久保留；resolution 追加；不得从 resolution 合成新 pass。
- Legacy run：缺 invocation 标 `legacy_unobserved/missing`，可继续修复但不得称 executed。

## 8. API Contract

- 当前签名保持为
  `dispatchStageSkill({ packageRoot, stage, name, triggered, hostInvoke, independentContextAvailable, activeConditions, probes, commands, run })`。
- T002 在其返回值之后追加 runtime-owned invocation fact；若后续收窄签名，
  必须保留现有调用点兼容测试，不得按不存在的接口直接实现。
- completion reconcile 输入认证 manifests/facts，输出 `{status, components, missing, unavailable, audit_gaps}`。
- conditional Skill 未触发时由 public CLI 写入 runtime-owned `trigger=false`、`notInvokedReason` 和当前 `workflow_run_id`；不得伪造 executed。
- build-spec `run` 只审计到 Step 5；exact attempt 发布后由 runtime-owned Step 6 绑定，completion audit 只作耐久记录。崩溃恢复复用同一个未发布 attempt，不新建历史。
- current material revision 通过内容、父 revision 和 hash 校验后进入 checkpoint；build-plan 必须同时保留当前 HEAD 与 accepted spec checkpoint 的 ancestry，同源分叉使用 runtime-owned 双亲 integration base，无关 HEAD 明确拒绝。
- content writer 新增 allowlisted kinds，不接受 caller 提供 task/stage/run/root/producer。
- 不新增 HTTP API；CLI 保持 `stage-runtime` 现有入口，错误使用明确分类。

## 9. File Boundary

> 本节是各 Phase Files 的并集。

### NEW

- `core/stage-skill-invocation.mjs`
- `core/schemas/stage-skill-invocation.v1.json`
- `core/schemas/task-material-revision.v1.json`
- `core/schemas/browser-qa-evidence.v1.json`

### MODIFY

- `core/stage-skill-runtime.mjs`
- `core/stage-completion-facts.mjs`
- `core/schemas/stage-completion-facts.v1.json`
- `schemas/task-accepted.v2.schema.json`
- `core/audit-aggregator.mjs`
- `core/canonical-receipt-writer.mjs`
- `core/stage-content-contracts.mjs`
- `core/stage-content-evidence.mjs`
- `core/schemas/stage-content-evidence.v1.json`
- `core/stage-handlers.mjs`
- `core/stage-runner.mjs`
- `core/task-kernel-implementation.mjs`
- `core/task-handle.mjs`
- `core/build-spec-receipt-recovery.mjs`
- `core/canonical-receipt-writer.mjs`
- `scripts/stage-runtime.mjs`
- `skills/wh-review/scripts/review-controller.mjs`
- `skills/wh-review/scripts/review-runner.mjs`
- `skills/wh-review/scripts/wh-review-cli.mjs`
- `skills/wh-review/scripts/review-materials.mjs`
- `skills/wh-review/schemas/resolution.schema.json`
- `skills/review-response/SKILL.md`
- `skills/review-response/scripts/validate-response.mjs`
- `skills/isolated-browser-qa/SKILL.md`
- `workflows/make-decision/SKILL.md`
- `workflows/make-decision/skill-deps.yaml`
- `workflows/build-spec/SKILL.md`
- `workflows/build-spec/skill-deps.yaml`
- `workflows/build-plan/SKILL.md`
- `workflows/build-plan/skill-deps.yaml`
- `workflows/build-code/SKILL.md`
- `workflows/build-code/skill-deps.yaml`
- `workflows/verify-code/SKILL.md`
- `workflows/verify-code/skill-deps.yaml`
- `workflows/verify-code/isolated-browser-qa.md`
- `core/__tests__/stage-skill-runtime.test.mjs`
- `scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`
- `scripts/__tests__/stage-runtime-spec-recovery.test.mjs`
- `tests/stage-interaction-contract.test.mjs`
- `tests/stage-completion-facts.test.mjs`
- `tests/audit-aggregator.test.mjs`
- `tests/five-stage-audit-e2e.test.mjs`
- `tests/stage-plan-task-contract-v3.test.mjs`
- `tests/stage-content-continuation.test.mjs`
- `tests/stage-content-evidence.test.mjs`
- `tests/five-stage-facts-v2.test.mjs`
- `tests/official-component-receipts.test.mjs`
- `skills/wh-review/scripts/__tests__/review-controller.test.mjs`
- `skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- `skills/review-response/__tests__/skill-contract.test.mjs`
- `skills/isolated-browser-qa/__tests__/skill-contract.test.mjs`

### DO NOT TOUCH

- `CONSTITUTION.md`
- `constitution-checklist.md`
- `config/review-providers.json`
- `skills/talk-with-zhipeng/SKILL.md`
- `skills/grill-with-docs/SKILL.md`
- `.git/`

## 10. Data Flow and Integration

```text
steps/deps → hostInvoke → invocation fact → component result → reconcile + business facts → completion
```

- **Existing modules / packages / services**：TaskKernel 写事实；stage runtime 编排；wh-review 产出独立 review；Vitest 做聚焦验证。
- **Integration points**：`dispatchStageSkill`、stage content writer、completion facts、review controller、verify-code handler。
- **Compatibility boundaries**：现有 CLI、三处确认、provider route、历史 v1 字节和五阶段目录保持。
- **Fail-loud behavior**：caller identity、错绑 ref/hash/tree、重复 invocation key、replay mismatch 在正式写入前失败。

## 11. Code Anchors and Reuse

### Versioned identity and context projection

- **Spec binding**：`{"artifact_kind":"spec","ref":"specs/workflow-quality-recording-simplification/spec.md","hash":"34a5eae18324875a80a986f4f2e56eb5ae1be74e3705f995f1c86c87079cac6a","id":"WORKFLOW-QUALITY-RECORDING-SIMPLIFICATION"}`
- **read_now**：`core/stage-skill-runtime.mjs`、`core/stage-completion-facts.mjs`、review controller、v3 contract。
- **must_read_before_task**：每 Task 卡列出的 producer、schema、consumer 和测试锚点。
- **Context mode**：Full — 跨五阶段；按 Phase 限制文件和测试。

### Verified anchors

| Anchor | Path and symbol | Current responsibility | Intended use | Forbidden change |
| --- | --- | --- | --- | --- |
| A-001 | `core/stage-skill-runtime.mjs:dispatchStageSkill` | hostInvoke 边界 | extend | 不判业务 pass |
| A-002 | `core/stage-completion-facts.mjs` | completion facts | extend | 不作进入 Gate |
| A-003 | `core/stage-content-evidence.mjs` | typed facts writer | extend | caller 不写身份 |
| A-004 | `skills/wh-review/scripts/review-controller.mjs` | round 选择 | extend | 不覆盖旧 verdict |
| A-005 | `skills/isolated-browser-qa/SKILL.md` | 隔离浏览器 QA | extend | 不保存凭据 |

### Reuse → Extend → New

| Capability | Decision | Existing candidates | Reason |
| --- | --- | --- | --- |
| Skill dispatch | extend | A-001 | 真实 hostInvoke 已存在 |
| Completion | extend | A-002 | 避免第二状态机 |
| Typed publication | extend | A-003 | 复用身份注入 |
| Review lifecycle | extend | A-004 | controller 持有事实 |
| Browser QA | extend | A-005 | 只补统一证据 |
| Invocation fact | new | A-001,A-003 | 内容证据不能证明调用 |

### Existing interface signatures

| Signature ID | Object | Verified current signature/schema | Source anchor |
| --- | --- | --- | --- |
| SIG-001 | `dispatchStageSkill` | 需要显式 `hostInvoke` | A-001 |
| SIG-002 | content evidence writer | runtime 注入 task/stage/run/ref/hash | A-003 |
| SIG-003 | review controller | subject + previous canonical result → round | A-004 |

## 12. Rollback and Recovery

- **Global recovery rule**：保留 spec、历史 records 和用户文件；只回退本任务实现字节。
- **Irreversible boundaries**：commit、push、merge、archive、cleanup 需单独授权。
- **Recovery owner**：各 Task 执行者按卡片 recovery 回退；T015 由正式 stage runtime 追加新 run。

### Engineering Risk Handoff

- **PLAN-RISK-001**：真实调用被误做成进入 Gate
  - **Affected IDs**：FR-INV-001、FR-COMP-002、AC-03、AC-04
  - **Trigger**：缺 invocation 时 build-code/verify-code 无法继续修复。
  - **Consequence**：流程再次死锁。
  - **Mitigation or STOP**：T003/T004 必须证明可继续工作而 completion 保持 incomplete。
  - **Handling Stage**：build-code
  - **Verification**：ORACLE-COMP。
- **PLAN-RISK-002**：review 去重误伤合法不同 subject
  - **Affected IDs**：FR-REV-004、FR-REV-005、AC-06、AC-07
  - **Trigger**：policy 或完整核心材料变化仍复用旧结果。
  - **Consequence**：审查对象错绑。
  - **Mitigation or STOP**：subject 必须绑定 policy、snapshot 与 required material completeness。
  - **Handling Stage**：build-code
  - **Verification**：ORACLE-REVIEW。
- **PLAN-RISK-003**：证据合同膨胀为通用 Gate
  - **Affected IDs**：FR-BQA-003、FR-VER-003、AC-12、AC-14
  - **Trigger**：非 UI 或 audit 缺失直接阻断业务结论。
  - **Consequence**：流程成本增加且违反 F5/F10。
  - **Mitigation or STOP**：N/A 与 disclosure 正反例必须 GREEN。
  - **Handling Stage**：build-code
  - **Verification**：ORACLE-BQA、ORACLE-VERIFY。

## 13. Test Strategy

- **Target**：全部 31 个 FR、18 个 AC、五阶段 always/conditional 调用。
- **gate_cmd**：每对 RED/GREEN 使用 tasks.md 中同一命令；T014 才运行 `npm run check`。
- **expected_exit**：RED 非零且命中目标 oracle；GREEN 为 0。
- **evidence_path**：`apply/evidence/Txxx-*.stdout`、`.stderr` 和 canonical review/result refs。
- **display_cmd**：`git diff --stat && git diff --check`。
- **Oracle ID and result**：ORACLE-INV、COMP、REVIEW、MAT、BQA、VERIFY、RECOVERY。

## 14. Implementation Order

`T001 → T002 → T003 → T004 → {T005→T006, T007→T008, T009→T010}; {T004,T008,T010} → T011; {T006,T008,T010,T011} → T012 → T014 → T016 → T017 → T018 → T019 → T020 → T021 → T015 → T013`。

## Phase 1：真实 invocation

### Goal

真实 hostInvoke 是 executed 的唯一来源。

### Files

- **NEW**：`core/stage-skill-invocation.mjs`、`core/schemas/stage-skill-invocation.v1.json`
- **MODIFY**：`core/stage-skill-runtime.mjs`、`core/task-kernel-implementation.mjs`、`scripts/stage-runtime.mjs`、`workflows/make-decision/skill-deps.yaml`、`workflows/build-spec/skill-deps.yaml`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-code/skill-deps.yaml`、`workflows/verify-code/skill-deps.yaml`、`core/__tests__/stage-skill-runtime.test.mjs`、`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`、`tests/stage-interaction-contract.test.mjs`
- **DO NOT TOUCH**：talk/grill Skill 正文、历史 run。

### Tasks

T001 RED 后执行 T002 GREEN。

### Verify

ORACLE-INV；T001/T002 同一聚焦命令。

### Knowledge

A-001/A-003；reviewer-owned lens 由 wh-review owner 调用。

### STOP

方案需要宿主签名、真人阅读证明或第二状态机。

### Done

五阶段调用可对账，手写 payload 仍为 missing。

### Risks and rollback

风险是 owner 重复 dispatch；回退 writer/runtime 当前字节，保留 RED。

## Phase 2：completion reconcile 与 audit 非 Gate

### Goal

统一完成核对，同时保持审计缺口非阻断。

### Files

- **MODIFY**：`core/stage-completion-facts.mjs`、`core/schemas/stage-completion-facts.v1.json`、`schemas/task-accepted.v2.schema.json`、`core/audit-aggregator.mjs`、`core/canonical-receipt-writer.mjs`、`core/stage-handlers.mjs`、`core/stage-runner.mjs`、`core/task-kernel-implementation.mjs`、`scripts/stage-runtime.mjs`、`tests/stage-completion-facts.test.mjs`、`tests/audit-aggregator.test.mjs`、`tests/five-stage-audit-e2e.test.mjs`
- **DO NOT TOUCH**：阶段进入条件、历史结果。

### Tasks

T003 RED 后执行 T004 GREEN。

### Verify

ORACLE-COMP；业务缺失 incomplete，audit missing 只披露。

### Knowledge

A-002 与宪法 F3/Q2。

### STOP

invocation 或 audit 缺失被用作开发进入 Gate。

### Done

三谓词结果可独立观察。

### Risks and rollback

风险是假绿或新 Gate；回退 reconciler 消费映射。

## Phase 3：review 生命周期与处理组 3

### Goal

一次审查、append-only resolution、同 subject 去重、replay 精确。

### Files

- **MODIFY**：`skills/wh-review/scripts/review-controller.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/schemas/resolution.schema.json`、`skills/review-response/SKILL.md`、`skills/review-response/scripts/validate-response.mjs`、`core/stage-handlers.mjs`、`skills/wh-review/scripts/__tests__/review-controller.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/review-response/__tests__/skill-contract.test.mjs`
- **DO NOT TOUCH**：provider 配置、旧 result 字节。

### Tasks

T005 RED 后执行 T006 GREEN。

### Verify

ORACLE-REVIEW；同 subject provider_calls=1，resolution provider_calls=0。

### Knowledge

A-004；处理组 3 问题 9/15。

### STOP

需要覆盖旧 verdict、自动 full review 或真实网络。

### Done

重复审查、材料预检和 replay 反例全部 GREEN。

### Risks and rollback

风险是误复用不同 subject；回退 controller 索引接线，不改历史。

## Phase 4：四材料 current revision

### Goal

四材料和 requirements ledger 同任务可更新且可追溯。

### Files

- **NEW**：`core/schemas/task-material-revision.v1.json`
- **MODIFY**：`core/stage-content-contracts.mjs`、`core/stage-content-evidence.mjs`、`core/schemas/stage-content-evidence.v1.json`、`core/task-kernel-implementation.mjs`、`core/task-handle.mjs`、`core/build-spec-receipt-recovery.mjs`、`core/canonical-receipt-writer.mjs`、`scripts/stage-runtime.mjs`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`tests/stage-plan-task-contract-v3.test.mjs`、`scripts/__tests__/stage-runtime-spec-recovery.test.mjs`、`tests/stage-content-continuation.test.mjs`
- **DO NOT TOUCH**：旧 accepted/hash/checkpoint 字节。

### Tasks

T007 RED 后执行 T008 GREEN。

### Verify

ORACLE-MAT；更新任一材料可继续且 provider_calls=0。

### Knowledge

F3/Q2 与现有 typed writer。

### STOP

引入 reopen/reset/rebind 或第二任务状态机。

### Done

current revision 生效，旧 revision 只读可追溯。

### Risks and rollback

风险是 lineage 变 Gate；回退 revision writer，当前文件不丢。

## Phase 5：浏览器 QA 证据

### Goal

UI 验收有通用、可定位且不泄露凭据的证据。

### Files

- **NEW**：`core/schemas/browser-qa-evidence.v1.json`
- **MODIFY**：`skills/isolated-browser-qa/SKILL.md`、`workflows/verify-code/isolated-browser-qa.md`、`core/stage-content-evidence.mjs`、`core/schemas/stage-content-evidence.v1.json`、`core/task-kernel-implementation.mjs`、`workflows/verify-code/SKILL.md`、`skills/isolated-browser-qa/__tests__/skill-contract.test.mjs`、`tests/stage-content-evidence.test.mjs`、`tests/five-stage-facts-v2.test.mjs`
- **DO NOT TOUCH**：browser profile/cookie/token。

### Tasks

T009 RED 后执行 T010 GREEN。

### Verify

ORACLE-BQA；逐字段反例和非 UI N/A 正例。

### Knowledge

A-005 与现有 cleanup/auth 参考。

### STOP

需要真实登录凭据或把 UI 证据变成全局 Gate。

### Done

页面、场景、工具、auth、性能、截图、命令、cleanup、snapshot 可复核。

### Risks and rollback

风险是 schema 过宽；回退 allowlist，不删除测试证据。

## Phase 6：verify-code 深化与五阶段接线

### Goal

verify-code 完整核对业务事实，五阶段声明调用全部 reconcile。

### Files

- **MODIFY**：`workflows/make-decision/SKILL.md`、`workflows/make-decision/skill-deps.yaml`、`workflows/build-spec/SKILL.md`、`workflows/build-spec/skill-deps.yaml`、`workflows/build-plan/SKILL.md`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-code/SKILL.md`、`workflows/build-code/skill-deps.yaml`、`workflows/verify-code/SKILL.md`、`workflows/verify-code/skill-deps.yaml`、`core/stage-completion-facts.mjs`、`core/schemas/stage-completion-facts.v1.json`、`core/stage-handlers.mjs`、`core/task-kernel-implementation.mjs`、`core/canonical-receipt-writer.mjs`、`scripts/stage-runtime.mjs`、`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`、`tests/five-stage-facts-v2.test.mjs`、`tests/official-component-receipts.test.mjs`、`tests/stage-completion-facts.test.mjs`
- **DO NOT TOUCH**：确认数量、close 授权、provider route。

### Tasks

T011 RED 后执行 T012 GREEN。

### Verify

ORACLE-VERIFY；每项状态/证据/reason，audit gap 独立。

### Knowledge

Phase 1–5 的 facts 与宪法 Q1/Q2。

### STOP

新增确认点、重复 dispatch lens 或 audit 决定业务结论。

### Done

核心缺失不 complete；audit 缺失不伪造业务 fail/pass；正式 host bridge
能够让 runtime 发起声明组件调用并持久化 invocation/completion，供 T015 使用。

### Risks and rollback

风险是 verify 变重 Gate；回退消费映射，保留明细测试。

## Phase 7：一次审查、一次全量、透明恢复

### Goal

先保存已执行全量的真实结果，再以代码、风险相关聚焦测试和逐 AC 结果判断本任务
完成；全量或审计缺失只如实披露，不作推进 Gate。随后用新正式 run 恢复 lineage；
真实用户确认后按 build-spec→build-plan→build-code 正式推进，并在 fresh test facts
后做唯一 integration review。

### Files

- **MODIFY**：`skills/wh-review/scripts/review-controller.mjs`、`scripts/stage-runtime.mjs`（仅作为 Phase 机器白名单）；T014 全量若只暴露既有基线，可机械修复既有 Markdown 白名单；authenticated smoke 仅修改 `scripts/smoke-local-skill-dispatch.mjs` 及其两个测试；lens-only closure/hash 仅修改 `core/check-skill-closure.mjs`、其测试、`skills/reuse-registry.md`、`skills/review-response/skill-bundle.json`、`skills/spec-tasks/skill-bundle.json`、`skills/isolated-browser-qa/skill-bundle.json`、`skills/catalog.yaml`。全量诊断确认的旧 fixture/断言可仅迁移到本任务已确认的新合同，白名单为 `tests/final-cutover-guards.red.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`tests/m14b-fact-collection.test.mjs`、`tests/stage-orchestrator-v2.test.mjs`、`core/__tests__/task-target-repo-migration.test.mjs`、`core/__tests__/task-runner-root-migration.test.mjs`、`tests/stage-content-publication.test.mjs`、`tests/official-make-decision-cli.test.mjs`、`tests/p0-foundation-contracts.test.mjs`、`scripts/__tests__/runner-replacement-bridge.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`tests/design-stage-skill-order.red.test.mjs`、`tests/stage-review-cost-policy.test.mjs`、`skills/wh-review/scripts/__tests__/review-source-materials.test.mjs`、`tests/workflow-v2-contract.test.mjs`、`tests/stage-risk-acceptance.test.mjs`、`tests/build-code-capture.test.mjs`、`tests/build-code-preflight.red.test.mjs`、`tests/verify-code-capture.test.mjs`、`scripts/__tests__/ci-chain-check.test.mjs`、`tests/terminal-runtime-blockers.test.mjs`、`tests/spec-content-profile.test.mjs`、`tests/per-invocation-doc-contract.test.mjs`、`tests/template-content-quality-retention.test.mjs`；不得恢复旧 accepted/audit Gate、重复 stage lens dispatch 或弱化 runtime。
- **DISCLOSE-ONLY**：`check-task-record-paths` 报出的 14 条旧生产路径治理不属于本任务，不得借 T014 修改生产实现、禁用 checker 或放宽断言。
- **STEP INVENTORY SYNC**：`docs/stage-atomic-step-inventory.md` 仅可同步当前五份 `steps.json` 的 numeric `step_id` + `step_slug` 双向覆盖，不改步骤合同或 runtime。
- **RECOVERY WORKSPACE RED/GREEN**：T016/T017 仅修改 `core/workspace.mjs`、`core/stage-context.mjs`、`scripts/stage-runtime.mjs`、`core/task-kernel-implementation.mjs`、`core/__tests__/workspace-manager.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`scripts/__tests__/stage-runtime-recover-run.test.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`；`skills/wh-review/skill-bundle.json` 与 `skills/catalog.yaml` 仅同步受影响 bundle hash。kernel implementation 仅用于 runtime-owned previous-run CAS，以及同一 current requirements pointer 在新 active make-decision run 内的 runtime-owned Step 2 完成；idempotent 命中必须先验证 ledger 与 coverage ref/hash 的实际内容绑定，不得创建冗余 ledger/revision。active make-decision recovery run 的方向/详情审查继承 recovery workspace；普通 run、accepted run 与显式 prepare 保持原严格语义。不得新增 schema、认证 Gate 或 caller 可选路径。
- **POST-GRILL MATERIAL GREEN（T018）**：仅修改 `core/schemas/interaction-completion.v1.json`、`core/stage-content-evidence.mjs`、`core/task-kernel-implementation.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`tests/stage-content-evidence.test.mjs`、`workflows/make-decision/SKILL.md`；新版 decision receipt 只作为当前材料，不重绑 Step 9。`grill-revalidation` 必须由真实同名 Skill invocation 绑定当前 tree、原 Grill 与 current material revision；Talk 和原 review 不重复，aggregate 未见新 invocation 必须拒绝。不得覆盖旧 evidence、创建 review Gate 或接受 caller 指定 binding。
- **EXECUTE-ONLY（T013–T015）**：`skills/wh-review/scripts/wh-review-cli.mjs`、`scripts/stage-runtime.mjs`；三个收口 Task 不得现场修改实现，finding 必须返回 owning GREEN。
- **DO NOT TOUCH**：旧 run 字节、provider route、Git refs。

### Tasks

T014 保存全量与聚焦事实；T016/T017 先以严格 RED/GREEN 修复 recovery workspace
blocker；T015 再正式恢复 make-decision；T018/T019 在 post-Grill 材料整改后先 RED 再追加真实聚焦复核，
再等待真实用户确认；
确认后继续正式 build-spec/build-plan/build-code，最后由 T013 做唯一 integration review。

### Strategy

普通 `prepare` 继续拒绝非标准状态。只有 `recover-run` 的专用认证路径可接纳 exact、
deterministic、已注册的 task worktree/branch 在当前 HEAD 相对旧 baseline 为 ahead 或
diverged；新 run baseline 取当前 clean recovery HEAD。身份全部由 kernel/workspace
解析，不接受 caller path、branch 或 baseline。进入前精确验证 path、branch、
git-common-dir、无 symlink 和当前完整 HEAD；旧 run 的 previous ref/hash 由 kernel
原样保留。不得改旧 run/历史，不新增 schema、认证 Gate 或宽松 fallback。
独立审查的四项 finding 保留为待聚焦解决：验证 branch reflog origin ancestor 并拒绝
orphan；recovery capability 持续复核 clean 且 dirty 不得写；recover-run 仅允许
make-decision 并在任何写前拒绝 invalid args/stage；同一 expected previous ref/hash
只允许一个新 run，第二次或并发调用由 runtime-owned CAS 拒绝。

### Verify

ORACLE-RECOVERY；旧字节不变，新 run 有真实 invocation facts。T014 不得把失败或
被用户叫停的全量写成通过；A/B/C 聚焦结果、closure/smoke 与逐 AC 事实决定任务
完成，14 条旧 path finding 和未完成全量保持 disclosure-only。

### Knowledge

所有 Phase GREEN、canonical review 与真实用户确认边界。

### STOP

计划二审、同一 tree 无变化重复全量、倒填历史或自动确认。

### Done

一次 review 和最终交付 tree 的全量有真实结果；新 run 等待真实用户确认。

### Risks and rollback

风险是为追 pass 对同一 tree 重跑；停止并如实记录。修复产生新 tree 时必须追加新结果，不覆盖旧事实。

## Phase 8：resolution 完成边界与一次性 revalidation replacement

### Goal

修复 make-decision resolution 已持久化却因 unsupported reset 报失败的问题；代码修复
改变最终 tree 时，保留 `0001` 并只追加一次可追溯 `0002`，不形成 review/revalidation
循环。

### Files

- **MODIFY**：`core/task-kernel-implementation.mjs`、`core/schemas/interaction-completion.v1.json`、`core/stage-content-evidence.mjs`、`workflows/make-decision/SKILL.md`。
- **TEST**：`core/__tests__/task-kernel-publish.test.mjs`、`tests/stage-content-evidence.test.mjs`。
- **MATERIALS**：本任务四材料只记录 D-12、FR-MAT-007、AC-18、T020/T021 和实际证据。
- **DO NOT TOUCH**：旧 review/result/resolution/event、Talk、Grill、`grill-revalidation-0001`、provider route。

### Tasks

T020 先复现 post-write reset error 与第二次 revalidation 被拒；T021 移除 resolution
自动 reset，并实现最多一个 runtime-owned replacement。

### Strategy

resolution 对所有 Stage 只追加记录；显式 reset API 仍只服务用户明确要求的新语义
审查。`0002` 的 supersede、原 Grill、当前材料均由 runtime 派生；`0001` 必须有
精确 executed invocation，当前材料必须是其直接下一版且 tree 不同。`0002` 自己
也必须有真实 invocation；aggregate 只能引用当前 replacement。

### Verify

只运行 resolution/revalidation 聚焦测试；保留 RED exit 1 与 GREEN exit 0。独立审查
检查历史不变、provider_calls=0、无 `0003`。

### Knowledge

D-11、D-12；FR-MAT-006/007；AC-17/18；宪法 Q1/Q2/Q3、F5/F10。

### STOP

吞异常、重写历史、开放无限 replacement、自动 review 或重跑 Talk/provider。

### Done

聚焦测试通过且独立审查无未解决 finding；T021 完成后回到 T015 正式收口。

### Risks and rollback

风险是把一次性恢复扩成通用循环。若 replacement 身份或材料直系关系不成立，立即
fail-loud，并保留所有既有事实。

## 15. Dependencies and Parallelism

- T001→T002→T003→T004 串行。
- T005/T007/T009 的 fixture 准备可在 T004 后并行；各 GREEN 只消费自己的 RED。
- T011 依赖 T004、T008、T010；T012 依赖 T006、T008、T010、T011。
- T014 依赖全部 GREEN；T016 依赖 T014，T017 依赖 T016，T018 依赖 T017 和 T015 已完成的 Step 10，T019 依赖 T018，T020 依赖 T019，T021 依赖 T020，T015 依赖 T021；T013 依赖 T015 后形成的正式
  accepted build-plan/build-code lineage 与 fresh test facts。
- T014、T016、T017、T018、T019、T020、T021、T015、T013 串行；不得并行创建第二正式 run 或在 fresh tests 前 review。

## 16. Requirement and Verification Traceability

| FR | Task IDs | AC IDs | Phase | Gate / evidence |
| --- | --- | --- | --- | --- |
| FR-INV-001..005 | T001,T002,T011,T012,T016,T017,T015 | AC-01,02,03,16 | 1,6,7 | ORACLE-INV/RECOVERY |
| FR-COMP-001..005 | T003,T004,T011,T012,T015 | AC-03,04,13,14,16 | 2,6,7 | ORACLE-COMP/VERIFY |
| FR-REV-001..006 | T005,T006,T013 | AC-05,06,07,08,16 | 3,7 | ORACLE-REVIEW |
| FR-MAT-001..007 | T007,T008,T011,T012,T018,T019,T020,T021 | AC-09,10,16,17,18 | 4,6,7,8 | ORACLE-MAT/POST-GRILL |
| FR-BQA-001..003 | T009,T010,T011,T012 | AC-11,12,16 | 5,6 | ORACLE-BQA |
| FR-VER-001..003 | T011,T012,T013,T014 | AC-13,14,16 | 6,7 | ORACLE-VERIFY |
| FR-REC-001..002 | T011,T012,T016,T017,T015 | AC-15,16 | 6,7 | ORACLE-RECOVERY |

## 17. Phase Status Table

| Phase | Tasks | Depends on | Completion gate | Review |
| --- | --- | --- | --- | --- |
| 1 Invocation | T001,T002 | none | ORACLE-INV GREEN | T013 |
| 2 Completion | T003,T004 | Phase 1 | ORACLE-COMP GREEN | T013 |
| 3 Review | T005,T006 | Phase 2 | ORACLE-REVIEW GREEN | T013 |
| 4 Materials | T007,T008 | Phase 2,3 | ORACLE-MAT GREEN | T013 |
| 5 Browser | T009,T010 | Phase 2 | ORACLE-BQA GREEN | T013 |
| 6 Verify | T011,T012 | Phase 3,4,5 | ORACLE-VERIFY GREEN | T013 |
| 7 Closure | T014,T016,T017,T015,T013 | Phase 6,8 | facts→recovery RED/GREEN→formal recovery→review | T013 only |
| 8 Resolution replacement | T018,T019,T020,T021 | Phase 7 recovery fix | two RED/GREEN pairs before T015 | focused verification only |
