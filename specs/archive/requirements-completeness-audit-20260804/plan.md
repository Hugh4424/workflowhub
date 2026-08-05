# WorkflowHub 需求完整性审计：实施计划

- **当前材料状态**：build-code Phase 1–6 的既有实现已记录；D43/D44 的实现和 focused contract 已完成。当前 scope revision `SR-build-code-20260805-apply-quality` 新增 D45-D49：恢复 spec/plan/tasks 内容合同、适配 AgentHub apply 的高价值闭环、在 build-plan 设计并把分层测试策略写入 tasks.md、让 build-code 只执行策略，并把 scope_revision packet 收敛为 bounded excerpt；不搬 AgentHub 门禁，不改 provider 配置。
- **Template version**：`plan-task.v3`

## 1. 速读卡

- **Goal**：把 WorkflowHub 的需求记录、用户沟通、阶段交接、审查处置、原始需求回放和质量事实边界补成最小闭环。
- **Non-goals**：不实现 PaperBuilder/KnowledgeDigest 业务；不改两个 provider 配置；不新增质量 gate、重试、daemon、第二套 ledger 或 close 控制面。来源：`decision-log.md#D10`、`decision-log.md#D14`。
- **Before**：阶段材料边界、用户沟通所有权、摘要交接和原始需求回放存在缺口；前三阶段审查曾被误当成 pass 门禁；增量审查和 v2 输入契约的修复需要持续回归。
- **After**：用户沟通由主代理执行；三个阶段先展示大白话摘要再等待真实回复；所有 FR/AC 都有任务和检查；每条原始需求/AC 都要求场景、oracle、实际结果、独立锚点和覆盖限制；review verdict/finding/provider 失败保持真实；verify-code 逐项回放 R/F/D；中途临时需求使用同 task 四材料一次性 scope-revision review；未来材料只把 ENOENT 当 missing。
- **Main risk**：宿主只能证明消息投递，不能证明真人阅读；历史错误和 provider unavailable 仍可能存在，只能保留为不完整事实；五份报告的业务实现延期，不在本任务宣称完成。
- **Next step**：按已固化的 tasks.md 测试策略继续受影响的 build-code Task；不重复每 Phase 的 route/blueprint/executor 设计、不重复全文 review 或无关全量回归。

## WorkflowHub Stage Progress

这是 `plan.md` 的阶段进度索引，不是第二份需求账本。`Status` 只表示阶段材料/交接状态，
`quality_status` 表示语义证据质量；两者不能混写成“全部完成”。

| Stage | Status | Work / artifacts | Review / handoff | Next / deferred risk |
| --- | --- | --- | --- | --- |
| make-decision | completed / quality=incomplete | R1-R23、五份报告、D1-D56、decision-log | 历史 Talk/Grill/review 有记录；当前 R3 receipt、完整 Talk payload 和本轮独立证据缺失；handoff=historical-accepted | build-spec；不补未来文件 |
| build-spec | completed / quality=incomplete | FR-001~FR-029、AC-001~AC-031、spec revision | 内容结构已写；当前逐项语义证据和 fresh review resolution unknown；handoff=historical-accepted | build-plan；不在 spec 补需求 |
| build-plan | completed / quality=incomplete | Phase/Task T001~T029、测试策略与文件边界；T025-T029 已完成当前材料收口 | 本轮独立 review、finding 处置和历史质量缺口均保留；质量不作推进 gate | verify-code 已完成事实回放；展示大白话交接，不 close、不宣称 formal accepted |

阶段事实补充：`artifact_refs=decision-log.md,spec.md,plan.md,tasks.md`；
`plain_language_summary=结构和局部合同已补齐，但当前语义验收仍 unknown/incomplete`；
`user_handoff=历史交接已确认，本轮修订尚未取得新的 verify-code 交接`；
`risks_deferred=缺失 canonical quality receipts、逐项 AC replay、独立 review resolution、五份报告业务实现`。

## 当前修订来源映射

| Source IDs | Decision IDs | FR / AC | Plan / Task | Status / handoff |
|---|---|---|---|---|
| R20、INC-046 | D45、D51 | FR-026 / AC-029 | T025、T028 | provisional/incomplete；D51-D56 当前交接未闭合 |
| R13、R17、R20、R23 | D49、D53 | FR-027/028 / AC-030 | T026、T028 | provisional/incomplete；质量不作推进 gate，当前 handoff 独立保留 |
| R2、R5、R11、R16、R23、INC-056 | D54-D56 | FR-029 / AC-031 | T027、T028 | unknown/incomplete；逐项语义证据和用户沟通未闭合 |
| R20、R23、D51-D56、INC-057 | D57 | FR-007、FR-009、FR-026、FR-029 / AC-008、AC-009、AC-029、AC-031 | T028、T029 | current material/recovery fact；原始 findings 保留，verdict 不作 gate |

本表只保存 `decision-log → spec → plan/tasks` 的关系索引；不复制原始需求正文，未有来源
的 plan item 必须回到 make-decision。scope revision 只更新受影响 Phase、Task、测试和直接影响。

## 2. Technical Context and Constraints

Node.js 24、ESM、Vitest；当前四份材料是唯一工作真相，旧 receipt/review/snapshot 只读保留。

### Global Constraints

- 只使用 launcher 提供的 StageContext、TaskKernel 和当前四份材料，不从 cwd、branch、remote 或 runner 路径推导身份。
- 只修改本计划 File Boundary 内的 WorkflowHub 代码、技能、模板和测试；不修改业务项目或共享 provider 配置。
- review、timeout、unavailable、finding、audit gap 是质量事实，不是普通修复和阶段推进 gate；结构、身份、hash、snapshot、写集合错误仍 fail-loud。同一次 make-decision/build-spec/build-plan 阶段运行只做一次异源审查，不因 finding 或 verdict 自动循环到 pass；后续新增材料才按 D19 进入新的增量审查。
- 主代理直接承担 Talk/Grill/Clarify 和阶段摘要交接；非交互研究/审查可使用独立上下文。
- 不创建 successor/predecessor、selector、snapshot lineage、replacement review、reopen、rebind、continuation、恢复控制面或永久双写；完整测试只通过现有 canonical receipt 枚举和同快照校验复用，不新增 latest 控制面。
- build-plan 必须记录每个 Task/Phase/final strategy 的 routing、blueprint、适用测试方法、命令、oracle、evidence 和 coverage limits 到 tasks.md；build-code 只执行并补写结果，这些是质量事实，不是 gate。完整回归只在 verify-code 或明确计划项执行。

## 3. Code Anchors and Reuse

- `runtime/stage/stage-skill-runtime.mjs` 已按 dependency execution 分流；复用它落实 Talk/Grill 主代理所有权，不新增调度器。
- `runtime/evidence/stage-completion-facts.mjs`、`runtime/stage/stage-handlers.mjs` 已是 completion facts 和 user/system view 的共同入口；复用它补摘要字段，不新增 handoff ledger。
- `runtime/review/review-controller.mjs`、`skills/wh-review/scripts/review-materials.mjs` 和 CLI 已承载前三阶段增量 round；复用 runner 生成 delta，不允许 caller 传 round/delta。字符串材料的 manifest hash 由 T013/T014 统一为原始 UTF-8 字节 hash，结构化 map 继续使用稳定 canonical JSON。
- `runtime/review/stage-materials.json` 与 `skills/wh-review/SKILL.md` 是 D17 已合并的 required-map 声明源；本任务只用契约测试和 `npm run check:skill-closure` 验证，不重复修改它们。3rd-review public-output rewrite 属于外部 3rd-review owner，本任务只验证 WorkflowHub 的真实错误码分类。
- `runtime/stage/stage-content-contracts.mjs` 的 plan-task.v3 validator 是 plan/tasks 的结构、DAG、命令、RED/GREEN 和 FR/AC coverage 权威。
- `skills/spec-specify`、`skills/spec-clarify`、`skills/spec-plan`、`skills/spec-tasks` 是可搬运的内容合同和模板；`workflows/build-spec`、`workflows/build-plan` 仍是唯一编排入口。
- `skills/test-routing-advisor`、`skills/testing-system-blueprint` 和三类测试技能是 build-plan 的测试策略设计输入；策略写入 tasks.md 后由 build-code 执行并生成可追溯事实，不创建执行器状态机。
- `skills/requirement-lineage/SKILL.md` 定义 source → decision → artifact → verification 状态；verify-code 复用该语言，不复制原始需求 ledger。

## 4. Solution Design

### 4.1 用户沟通和阶段交接

把需要用户回复的技能固定在主代理可见上下文；三个阶段共用 canonical completion summary，用户 view 展示完成内容、产物、范围、风险、延期和下一阶段边界，真实回复前不 handoff。

### 4.2 审查事实和 finding 处置

沿用现有 review result、finding disposition、quality status 和 publication 分离。审查只提供异源意见；`pass`、`revise_required`、`unavailable`、timeout、协议失败都原样保存。已有 pass 且材料变化时，只发送 runner 生成的可读 delta；无法安全比较时明确回退一次 initial full review。

Finding disposition 的最小可绑定字段固定为：`finding_id`、`原始事实/来源`、`后果`、`status`（`fixed`/`rejected_invalid`/`accepted_risk`/`needs_human`）、`next_action`、`evidence_ref`、`owner`、`consumer`、`retain_or_delete`。它写入现有 Task completion area，并由既有 risk-acceptance/missing-items consumer 读取；不新增 resolution schema、response ledger 或第二套 completion 状态机。

### 4.3 原始需求回放和材料读取

decision-log 保持决策索引而非 spec 副本；verify-code 先回放 R1-R23、五份报告需求点和 INC-001~056，再绑定 FR/AC/task/语义证据。材料读取只有 ENOENT 转 missing，其他读取或 provenance 错误直接暴露。

### 4.4 最小交付边界

本任务交付 WorkflowHub 规则、运行时行为和可重复回归；PaperBuilder/KnowledgeDigest 的页面、策略、订单和读者产品只作为后续验收输入，不在本任务实现。

### 4.5 语义证明与中途 scope-revision

结构映射只能证明“有记录”，不能证明“用户结果已经实现”。当前 AC/replay
证据统一要求：具体 scenario、oracle、actual outcome、coverage limit，以及独立
implementation/test anchors；缺失时发布 `unknown/incomplete`，不把任务完成行、聚合
测试或共享 umbrella receipt 当成证明。

中途临时需求不新增 stage。主代理直接和用户沟通，在同一 task 原子更新四份当前材料，
生成 `workflowhub-scope-revision.v1` material，复用现有 wh-review route 做一次专用
审查。专用审查只判断核心目标、四材料一致性和全局影响，不审查代码是否已经通过；结果
仍是质量事实，finding 逐条处置后回受影响的 build-code/verify-code。

### 4.6 内容合同与 build-code apply 测试闭环

`spec-specify`/`spec-clarify`/`spec-plan`/`spec-tasks` 恢复历史上被删除的高价值字段，
但不恢复旧运行时。build-plan 每个 Task/Phase 先用五个测试技能完成高智力测试策略
设计并写入 tasks.md；build-code 再按 Phase Card、RED、已记录命令/oracle、GREEN、
diff/consumer scan、review/finding disposition 和 plain-language handoff 执行。最终
当前快照聚合也是 tasks.md 中提前设计的专门策略，不在 build-code 重新路由。

### 4.7 Decision → spec → plan → tasks 映射

`decision-log.md` 是原始需求、事实、选择、理由和延期的索引；`spec.md` 把每个来源 ID
展开成 FR/AC 和用户场景；`plan.md` 只为这些 FR/AC 设计 Phase、依赖、文件边界和验证；
`tasks.md` 只把 Phase/FR/AC 变成执行卡、命令、oracle、路径和证据。每一级都保留紧凑
`source_refs/decision_refs`，但不复制上一级正文，也不允许下一级新增没有 `R*/F*/INC*/D*`
来源的需求。scope_revision 只更新受影响的关系和直接影响，不重写不变部分。

## 5. File Boundary

### NEW

- `tests/decision-log-content-contract.test.mjs`
- `tests/verify-requirement-replay-contract.test.mjs`
- `tests/review-material-hash-contract.test.mjs`
- `tests/contract/scope-revision-contract.test.mjs`
- `runtime/review/scope-revision-contract.mjs`
- `skills/wh-review/contracts/scope-revision.md`
- `skills/spec-specify/skill-bundle.json`
- `skills/spec-specify/SKILL.md`
- `skills/spec-specify/templates/spec-template.md`
- `skills/spec-clarify/skill-bundle.json`
- `skills/spec-clarify/SKILL.md`
- `skills/spec-plan/skill-bundle.json`
- `skills/spec-plan/SKILL.md`
- `skills/spec-plan/templates/plan-template.md`
- `skills/spec-tasks/skill-bundle.json`
- `skills/spec-tasks/SKILL.md`
- `skills/spec-tasks/templates/tasks-template.md`
- `skills/testing-system-blueprint/SKILL.md`
- `skills/testing-system-blueprint/skill-bundle.json`
- `skills/backend-testing/SKILL.md`
- `skills/backend-testing/skill-bundle.json`
- `skills/frontend-testing/SKILL.md`
- `skills/frontend-testing/skill-bundle.json`
- `skills/fullstack-slice-testing/SKILL.md`
- `skills/fullstack-slice-testing/skill-bundle.json`
- `tests/contract/spec-stage-artifact-closure.test.mjs`
- `tests/contract/build-code-apply-contract.test.mjs`
- `tests/contract/stage-progress-contract.test.mjs`
- `skills/spec-specify/skill-bundle.json`
- `skills/spec-clarify/skill-bundle.json`
- `skills/spec-plan/skill-bundle.json`
- `skills/spec-tasks/skill-bundle.json`

### MODIFY

- `tests/stage-interaction-contract.test.mjs`
- `workflows/make-decision/skill-deps.yaml`
- `workflows/make-decision/SKILL.md`
- `workflows/build-spec/SKILL.md`
- `workflows/build-plan/SKILL.md`
- `tests/stage-completion-facts.test.mjs`
- `runtime/evidence/stage-completion-facts.mjs`
- `runtime/stage/stage-handlers.mjs`
- `runtime/stage/completion-predicates.mjs`
- `runtime/stage/stage-content-contracts.mjs`
- `skills/wh-review/scripts/review-materials.mjs`
- `skills/wh-review/scripts/review-runner.mjs`
- `workflows/build-code/SKILL.md`
- `workflows/verify-code/SKILL.md`
- `skills/wh-review/SKILL.md`
- `tests/contract/stage-completion.test.mjs`
- `tests/stage-risk-acceptance.test.mjs`
- `tests/stage-review-cost-policy.test.mjs`
- `skills/wh-review/scripts/__tests__/review-controller.test.mjs`
- `skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`
- `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- `runtime/review/review-controller.mjs`
- `runtime/review/stage-review-disposition.mjs`
- `tests/contract/review-materials-contract.test.mjs`
- `tests/spec-content-profile.test.mjs`
- `skills/decision-log/SKILL.md`
- `skills/decision-log/templates/decision-log-template.md`
- `workflows/verify-code/SKILL.md`
- `tests/e2e/vnext-five-stage-current.test.mjs`
- `runtime/stage/stage-runner.mjs`
- `tools/cli/stage-runtime.mjs`
- `tests/integration/vnext-official-stage-run.test.mjs`
- `tests/stage-content-host-independence.test.mjs`
- `tests/stage-plan-task-contract-v3.test.mjs`
- `runtime/task/task-handle.mjs`
- `workflows/build-spec/skill-deps.yaml`
- `workflows/build-plan/skill-deps.yaml`
- `workflows/build-plan/steps.json`
- `workflows/build-code/skill-deps.yaml`
- `workflows/build-code/steps.json`
- `skills/test-routing-advisor/SKILL.md`
- `skills/test-routing-advisor/scripts/route.mjs`
- `skills/test-routing-advisor/__tests__/skill-contract.test.mjs`
- `skills/test-routing-advisor/skill-bundle.json`
- `skills/catalog.yaml`
- `skills/reuse-registry.md`
- `workflows/build-spec/SKILL.md`
- `workflows/build-plan/SKILL.md`
- `workflows/build-code/SKILL.md`
- `specs/requirements-completeness-audit-20260804/decision-log.md`
- `specs/requirements-completeness-audit-20260804/spec.md`
- `specs/requirements-completeness-audit-20260804/plan.md`
- `specs/requirements-completeness-audit-20260804/tasks.md`
- `runtime/evidence/canonical-receipt-writer.mjs`
- `runtime/evidence/canonical-evidence-validators.mjs`
- `runtime/task/git-worktree-snapshot.mjs`
- `tests/official-component-receipts.test.mjs`
- `tests/final-cutover-guards.red.test.mjs`
- `specs/requirements-completeness-audit-20260804/decision-log.md`
- `specs/requirements-completeness-audit-20260804/spec.md`
- `specs/requirements-completeness-audit-20260804/plan.md`
- `specs/requirements-completeness-audit-20260804/tasks.md`
- `quality/evidence/verification/requirements-completeness-replay-current.json`

### DO NOT TOUCH

- host WorkflowHub config (`workflowhub/config.json`)
- host 3rd-review config (`3rd-review/config.json`)
- 外部 `3rd-review` source/config；其 public-output rewrite 已由外部 owner 交付，本任务只验证 WorkflowHub 的公开错误码和真实失败事实。
- `runtime/review/stage-materials.json` except where an already accepted D17 contract regression proves a current source change is required
- PaperBuilder、KnowledgeDigest 和其他业务项目目录

## 6. Technical Decisions

### DEC-001 主代理负责用户沟通

- **Selected**：复用现有 stage skill runtime，把 Talk/Grill/Clarify 等用户沟通固定为主代理可见执行。
- **Selected source**：`decision-log.md#D12`、`spec.md#FR-003/FR-004`。
- **Reason**：子代理不能替用户回答、确认或证明用户看过摘要。
- **Impact**：只改变交互技能执行归属，不改变非交互研究和审查的独立上下文。

### DEC-002 复用 completion renderer

- **Selected**：扩展现有 canonical completion summary 和 user/system view，加入延期与下一阶段边界。
- **Selected source**：`decision-log.md#D13`、`spec.md#FR-005`。
- **Reason**：已有共同事实入口；新增状态机或阅读证明 API 会违反最小闭环和 Constitution 边界。
- **Impact**：用户看得到交接摘要，但系统不把消息投递冒充真人阅读。

### DEC-003 审查是意见，finding 必须处置

- **Selected**：复用 review result、finding disposition 和现有 quality facts；前三阶段不以 provider pass 作为推进条件。
- **Selected source**：`decision-log.md#D14`、`D16`、`D18`、`D19`；`spec.md#FR-016/FR-019/FR-020`。
- **Reason**：重复全文审查追求 pass 会把质量事实错误地变成流程许可证。
- **Impact**：新增/修改内容只审查增量；严重 finding 仍须修复或由用户明确承担风险，原 verdict 不改写。

### DEC-004 单一需求索引和逐项回放

- **Selected**：decision-log 记录来源和决策关系，verify-code 逐项回放原始 R/F/D 并绑定当前证据。
- **Selected source**：`decision-log.md#D1`、`D2`、`D11`；`spec.md#FR-002/FR-008/FR-013`。
- **Reason**：避免 decision-log 变成 spec 副本，也避免 verify 只凭当前 spec 猜测完成。
- **Impact**：缺证据保持 `unknown/deferred/unavailable`，不冒充通过，也不阻止同 task 修复。

### DEC-005 只对 ENOENT 做未来材料降级

- **Selected**：收窄材料读取错误处理；只有 ENOENT 返回 missing，权限、损坏、hash、snapshot 和 provenance 错误直接失败。
- **Selected source**：`decision-log.md#D7`、`D8`；`spec.md#FR-001/FR-010/FR-011`。
- **Reason**：宽泛 catch 会把真实损坏伪装成尚未进入阶段。
- **Impact**：未来文件缺失仍可正常进入早期阶段，真实数据错误会尽早暴露。

## 7. Test Strategy

- 行为改动先用同一窄命令取得 RED，再用同一命令取得 GREEN；RED/GREEN 共用 oracle、FR/AC 和 gate_cmd。
- 非行为任务只记录当前实现或技能规则的回归，不伪造 RED；其命令必须能观察对应事实。
- 计划检查必须验证 plan/tasks 八段 phase 结构、每个 task 的精确文件和命令、依赖无环、RED/GREEN 成对、FR/AC 双向 coverage。
- 独立 `wh-review` 只审当前 spec/plan/tasks；上一轮 pass 后使用 runner 生成的 delta，审查 unavailable/invalid 真实保留，不重复追求 pass。
- 最终回归分开观察：用户沟通、摘要交接、质量非 gate、审查协议、材料读取、CAS/latest、原始需求回放、配置不变和 Constitution。

## 8. Rollback and Recovery

只撤回本任务当前字节，不删除历史 review、timeout、unavailable、failure、snapshot 或 confirmation。发现需求无法回指 R*/F*/INC*/D*，或未完成交接的 scope-revision 试图直接成为当前 FR/AC，或材料越过 File Boundary、需要新增控制面或 provider 配置时，停止当前任务并回到 make-decision。

### Engineering Risk Handoff

- **PLAN-RISK-001**：宿主只能证明摘要消息投递，不能证明真人阅读。
  - **Affected IDs**：FR-005、AC-005、AC-016。
  - **Trigger**：没有真实用户回复却要声明阶段 handoff 完成。
  - **Consequence**：下一阶段可能读取了用户未看过的摘要。
  - **Mitigation or STOP**：主代理保留 pending/in_progress，不使用旧回复、provider 或 receipt 冒充用户确认。
  - **Handling Stage**：make-decision、build-spec、build-plan。
  - **Verification**：阶段摘要出现在主代理对话，只有真实用户回复后才记录 handoff。
- **PLAN-RISK-002**：`spec-clarify` 技能缺失。
  - **Affected IDs**：FR-003、FR-004、FR-005、AC-004、AC-005。
  - **Trigger**：build-spec 需要用户澄清但技能不可用。
  - **Consequence**：静默跳过会丢失用户回答。
  - **Mitigation or STOP**：主代理直接提问；不可用保持 unknown/deferred，不创建替代技能。
  - **Handling Stage**：build-spec。
  - **Verification**：技能缺失事实仍在延期清单，当前任务不新增替代文件。
- **PLAN-RISK-003**：review 质量事实被误读为推进 gate。
  - **Affected IDs**：FR-007、FR-009、FR-015、FR-016、FR-019、FR-020、AC-008、AC-010、AC-018、AC-019、AC-022、AC-023。
  - **Trigger**：出现 revise_required、timeout、unavailable、协议失败或 serious finding。
  - **Consequence**：同 task 被错误停摆，或缺失被写成 pass。
  - **Mitigation or STOP**：同 task 继续修复；保留 verdict/finding；严重 finding 只走修复或明确风险承担。
  - **Handling Stage**：make-decision、build-spec、build-plan、verify-code。
  - **Verification**：质量状态、推进状态和完成状态分别断言。

## 9. Implementation Order

1. Phase 1：固定用户沟通所有权和三个阶段摘要交接规则。
2. Phase 2：补 canonical completion summary 的用户可见投影。
3. Phase 3：回归质量事实非 gate、finding 处置、公开审查失败和前三阶段增量语义。
4. Phase 4：固定 decision-log 最低索引和 verify 原始需求回放。
5. Phase 5：修正材料读取的 ENOENT/fail-loud 边界，并回归未来材料。
6. Phase 6：回归 CAS/latest、五阶段公共边界、plan-task contract、host independence 和配置不变。
7. Phase 7：完成语义证据和轻量 scope-revision 的已有合同；当前不重复 provider/full-suite。
8. Phase 8：T020 恢复 spec 内容合同 → T021 补 apply 顺序 → T022 调整测试技能为 build-plan 设计输入 → T023 收口 bounded scope_revision → T024 将任务级测试策略固化到 tasks.md 并验证 build-code 只执行。

## 10. Dependencies and Parallelism

任务按 T001 → T002 → T003 → T004 → T005 → T006 → T013 → T014 → T007 → T008 → T009 → T010 → T011 → T012 → T015 → T016 → T017 → T018 → T019 → T020 → T021 → T022 → T023 → T024 串行执行。RED 必须先于同一 oracle 的 GREEN；技能、运行时和测试文件存在交叉影响，不并行修改。T005–T008、T011–T012、T017–T024 是事实/契约回归或文档规则任务，不把 provider 结果当作任务许可证；T013/T014、T015/T016 是行为任务的 RED/GREEN 配对。

## 11. Requirement and Verification Traceability

| FR | Task IDs | AC IDs | Phase | Gate / evidence |
|---|---|---|---|---|
| FR-001 | T009,T010 | AC-001,AC-002 | 5 | 当前材料和非 ENOENT 回归 |
| FR-002 | T007 | AC-003,AC-006,AC-013,AC-015,AC-017 | 4 | decision-log 内容契约 |
| FR-003 | T001,T002 | AC-004,AC-005,AC-019 | 1 | 主代理执行配置/规则 |
| FR-004 | T001,T002 | AC-004,AC-005,AC-019 | 1 | Talk/Grill/Clarify 证据契约 |
| FR-005 | T003,T004 | AC-005,AC-016 | 2 | completion user view 与 handoff |
| FR-006 | T007 | AC-003,AC-006,AC-013,AC-015,AC-017 | 4 | D→FR/AC 来源审计 |
| FR-007 | T005 | AC-008,AC-010,AC-022 | 3 | 质量/推进/完成分离 |
| FR-008 | T008 | AC-003,AC-007,AC-013,AC-014,AC-016,AC-020 | 4 | R/F/D replay 证据 |
| FR-009 | T005,T012 | AC-008,AC-009,AC-010,AC-011,AC-014,AC-016,AC-018,AC-021,AC-022,AC-023 | 3,6 | provider/verdict 真实状态 |
| FR-010 | T009,T010 | AC-001,AC-002 | 5 | ENOENT 与非 ENOENT |
| FR-011 | T011 | AC-009,AC-012,AC-014 | 6 | revision/latest CAS |
| FR-012 | T008,T011,T012 | AC-003,AC-007,AC-009,AC-010,AC-011,AC-012,AC-013,AC-014,AC-016,AC-018,AC-020,AC-021,AC-022,AC-023 | 4,6 | 历史/事故只读回放 |
| FR-013 | T007 | AC-003,AC-006,AC-013,AC-015,AC-017 | 4 | 跨项目最低结构 |
| FR-014 | T008,T012 | AC-003,AC-007,AC-009,AC-010,AC-011,AC-014,AC-016,AC-018,AC-020,AC-021,AC-023 | 4,6 | 交付与 formal close 分离 |
| FR-015 | T006 | AC-018,AC-019,AC-021,AC-023 | 3 | 协议失败分类与安全恢复 |
| FR-016 | T001,T002,T006 | AC-004,AC-005,AC-018,AC-019,AC-021,AC-023 | 1,3 | finding 逐条处置 |
| FR-017 | T008 | AC-003,AC-007,AC-013,AC-014,AC-016,AC-020 | 4 | stale material freshness |
| FR-018 | T006,T012 | AC-009,AC-010,AC-011,AC-014,AC-016,AC-018,AC-021,AC-022,AC-023 | 3,6 | v2 map preflight |
| FR-019 | T005,T006,T012 | AC-008,AC-009,AC-010,AC-011,AC-014,AC-016,AC-018,AC-021,AC-022,AC-023 | 3,6 | pass 非推进许可证 |
| FR-020 | T006,T012,T013,T014 | AC-009,AC-010,AC-011,AC-014,AC-016,AC-018,AC-021,AC-022,AC-023 | 3,6 | pass 基线后的增量与材料 hash |
| FR-021 | T017,T018,T019,T023 | AC-024 | 7,8 | 语义证据与同 task scope-revision 专用 review |
| FR-022 | T020,T023 | AC-025 | 8 | spec/plan/tasks 内容 skill/template closure |
| FR-023 | T021,T023 | AC-026 | 8 | build-code apply contract、finding/handoff |
| FR-024 | T022,T023,T024 | AC-027 | 8 | build-plan 设计并写入 tasks.md 的分层策略 |
| FR-025 | T024 | AC-028 | 8 | build-code 只执行任务卡策略并记录实际结果 |
| FR-007 | T029 | AC-008 | 9 | 历史证据缺失不阻断当前事实，非 ENOENT 仍暴露 |
| FR-026 | T025,T028 | AC-029 | 9 | 历史高质量内容 provenance 与当前任务卡回填 |
| FR-027 | T026 | AC-030 | 9 | plan.md 三阶段进度索引与 quality 分离 |
| FR-028 | T026,T028 | AC-030 | 9 | tasks.md 两阶段进度、精确执行路径 |
| FR-029 | T027,T028,T029 | AC-003,AC-007,AC-013,AC-031 | 9 | 原始/新增需求逐项语义状态和 honest completion |

## 12. Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
|---|---|---|---|---|
| 用户沟通所有权 | make-decision deps/skill、interaction test | change | T001,T002 | 主代理直接沟通 |
| 阶段摘要 | completion facts/handler/tests | change | T003,T004 | user view 不丢摘要 |
| review 事实边界 | review tests、stage completion tests | change | T005,T006 | 意见不变成 gate |
| decision-log/verify | decision-log skill/template、verify skill/test | change | T007,T008 | 来源和原始需求回放 |
| 材料读取 | stage-runner、stage-runtime、e2e test | change | T009,T010 | 只有 ENOENT 是 missing |
| CAS/公共边界 | official integration、contract、host tests | no new control plane | T011,T012 | 回归现有 owner |
| provider 配置 | 两个绝对路径配置文件 | no change | T012 | 保持共享项目可用 |
| spec 内容合同 | spec skills/templates、build-spec/build-plan deps | change | T020,T023 | 恢复被删除的高质量字段，不新增第二真相 |
| build-code apply | build-code skill/steps/tasks completion | change | T021,T023 | Phase Card、差异扫描、finding/handoff |
| 分层测试 | build-plan deps、tasks template、routing/blueprint/backend/frontend/fullstack skills、build-code steps | change | T022,T024 | build-plan 设计并固化策略，build-code 执行留痕，非 gate |

## Phase 1：用户沟通所有权和阶段交接

### Goal

固定用户沟通由主代理执行，并在 make-decision/build-spec/build-plan 的阶段技能中明确摘要后等待真实用户回复。

### Files

- **MODIFY**：`tests/stage-interaction-contract.test.mjs`
- **MODIFY**：`workflows/make-decision/skill-deps.yaml`
- **MODIFY**：`workflows/make-decision/SKILL.md`
- **MODIFY**：`workflows/build-spec/SKILL.md`
- **MODIFY**：`workflows/build-plan/SKILL.md`

### Tasks

T001 then T002.

### Verify

`npx vitest run tests/stage-interaction-contract.test.mjs`；T001 expected exit 1，T002 expected exit 0。

### Knowledge

Talk 已需 inline；Grill 曾配置为 independent。现有 runtime 已能分流，缺口是配置和可见交接规则。

### STOP

若需要新增 handoff 状态机、阅读 API、provider 主代理通信或 build-spec 正式人工 gate，回到 D12/D13，不扩大本计划。

### Done

测试能证明沟通技能不走 independent，三个阶段明确摘要—等待用户—再 handoff。

### Risks and rollback

只回滚交互配置、技能文字和契约断言；不得误改非交互研究/审查执行模式。

## Phase 2：阶段摘要 user/system view

### Goal

复用 completion facts 让用户看到做了什么、产物、边界、风险、延期和下一阶段限制。

### Files

- **MODIFY**：`tests/stage-completion-facts.test.mjs`
- **MODIFY**：`runtime/evidence/stage-completion-facts.mjs`
- **MODIFY**：`runtime/stage/stage-handlers.mjs`

### Tasks

T003 then T004.

### Verify

`npx vitest run tests/stage-completion-facts.test.mjs`；T003 expected exit 1，T004 expected exit 0。

### Knowledge

现有 `confirmation_summary` 和双视图是共同入口；仅补 canonical 字段和投影，不新增状态机。

### STOP

若内部 ref/hash/provider 字段进入用户摘要，或需要 formal confirmation gate，停止并修正方案。

### Done

user/system view 来源一致，用户摘要包含延期和下一阶段边界，内部运行时字段不泄露。

### Risks and rollback

只回滚 renderer/handler 的当前字节，保留历史 completion facts。

## Phase 3：质量事实、finding 和增量审查

### Goal

验证已合并的审查修复：review 不阻塞普通推进，公开协议失败可分类，finding 逐条处置，前三阶段已有 pass 后只审查增量。

### Files

- **MODIFY**：`tests/contract/stage-completion.test.mjs`
- **MODIFY**：`tests/stage-risk-acceptance.test.mjs`
- **MODIFY**：`tests/stage-review-cost-policy.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/review-controller.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- **MODIFY**：`runtime/review/review-controller.mjs`
- **NEW**：`tests/review-material-hash-contract.test.mjs`

### Tasks

T005 then T006 then T013 then T014.

### Verify

`npx vitest run tests/contract/stage-completion.test.mjs tests/stage-risk-acceptance.test.mjs tests/stage-review-cost-policy.test.mjs skills/wh-review/scripts/__tests__/review-controller.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs tests/review-material-hash-contract.test.mjs`；exit 0。

### Knowledge

`review-controller` 已有 runner-generated delta，CLI 已拒绝 caller round/delta；本阶段补覆盖、失败边界，并统一字符串材料的原始字节 hash 与任务 ReferenceBinding 的 hash 基准，不改共享配置。

### STOP

若测试要求 provider pass 才能继续、自动重试、修改配置或把 finding 处置改成新控制面，停止并回到 D14/D18/D19。

### Done

真实 verdict/finding/provider 失败可回放；普通修复可继续；增量安全时不全文重审，不安全时只回退一次 initial full review；review manifest 不再把字符串材料 hash 成 JSON 字符串的 hash。

### Risks and rollback

保留原始 unavailable、invalid、timeout 和 revise_required；不为绿而重写质量事实。

## Phase 4：decision-log 最低结构和 verify replay

### Goal

固定未来 decision-log 的精简索引结构，并让 verify-code 从原始 R/F/D 开始逐项绑定当前证据。

### Files

- **MODIFY**：`skills/decision-log/SKILL.md`
- **MODIFY**：`skills/decision-log/templates/decision-log-template.md`
- **MODIFY**：`workflows/verify-code/SKILL.md`
- **NEW**：`tests/decision-log-content-contract.test.mjs`
- **NEW**：`tests/verify-requirement-replay-contract.test.mjs`

### Tasks

T007 then T008.

### Verify

`npx vitest run tests/decision-log-content-contract.test.mjs tests/verify-requirement-replay-contract.test.mjs && npx --no-install markdownlint-cli2 skills/decision-log/SKILL.md skills/decision-log/templates/decision-log-template.md workflows/verify-code/SKILL.md`；exit 0。

### Knowledge

decision-log 只记录需求点/决策点/来源/处理状态；requirement-lineage 已提供覆盖状态，不新增第二份 ledger。

### STOP

若必须复制详细页面、接口、任务或测试脚本到 decision-log，或把缺证据自动变成 pass，回到 D1/D11/D14。

### Done

删除最低字段会让契约测试失败；verify 明确回放五份报告、INC-001~015 和 `unknown/deferred/unavailable`。

### Risks and rollback

保持索引简洁；只回滚技能、模板和内容契约，不修改历史任务记录。

## Phase 5：未来材料读取和 fail-loud

### Goal

让只有 ENOENT 表示未来材料尚未进入，权限/损坏/其他读取失败保持可见。

### Files

- **MODIFY**：`tests/e2e/vnext-five-stage-current.test.mjs`
- **MODIFY**：`runtime/stage/stage-runner.mjs`
- **MODIFY**：`tools/cli/stage-runtime.mjs`

### Tasks

T009 then T010.

### Verify

`npx vitest run tests/e2e/vnext-five-stage-current.test.mjs`；T009 expected exit 1，T010 expected exit 0。

### Knowledge

当前 make-decision 需要能在只有 decision-log 时运行；宽泛 catch 可能把非 ENOENT 错误伪装成 missing。

### STOP

若修复需要修改 provider 配置、自动重试、legacy close 或未来文件预创建，停止。

### Done

ENOENT 仍为 missing，EACCES/EIO/损坏/hash/snapshot/provenance 错误 fail-loud，未来三个文件不会被创建。

### Risks and rollback

错误收窄必须保留合法未来材料路径；只回滚两个读取入口和对应回归测试。

## Phase 6：CAS、公共边界和最终回归

### Goal

把 revision/latest、五阶段公共运行时、host independence、plan-task contract 和配置不变事实放在最后一次本地回归中验证。

### Files

- **MODIFY**：`tests/integration/vnext-official-stage-run.test.mjs`
- **MODIFY**：`tests/stage-content-host-independence.test.mjs`
- **MODIFY**：`tests/stage-plan-task-contract-v3.test.mjs`
- **MODIFY**：`runtime/task/task-handle.mjs`
- **MODIFY**：`runtime/evidence/canonical-receipt-writer.mjs`
- **MODIFY**：`runtime/evidence/canonical-evidence-validators.mjs`
- **MODIFY**：`runtime/stage/stage-handlers.mjs`
- **MODIFY**：`runtime/stage/stage-runner.mjs`
- **MODIFY**：`runtime/review/stage-review-disposition.mjs`
- **MODIFY**：`skills/wh-review/scripts/review-materials.mjs`
- **MODIFY**：`runtime/task/git-worktree-snapshot.mjs`
- **MODIFY**：`tests/official-component-receipts.test.mjs`
- **MODIFY**：`tests/contract/review-materials-contract.test.mjs`
- **MODIFY**：`tests/stage-risk-acceptance.test.mjs`
- **MODIFY**：`tests/final-cutover-guards.red.test.mjs`
- **MODIFY**：`tests/integration/vnext-official-stage-run.test.mjs`

### Tasks

T011 then T012 then T015 then T016。

### Verify

`npx vitest run tests/integration/vnext-official-stage-run.test.mjs tests/stage-content-host-independence.test.mjs tests/stage-plan-task-contract-v3.test.mjs tests/review-material-hash-contract.test.mjs tests/contract/integration-review-subject.test.mjs && npm run check:skill-closure && npm run check`；exit 0。共享 provider 配置只由 launcher 记录 pre/post hash；路径缺失或变化记录 unknown/incomplete，不作为隐式交付 gate。

### Knowledge

CAS/latest 和公共阶段边界已有 owner；本阶段只补当前需求对应的 coverage，不恢复 accepted projection 或旧控制面。

### STOP

若出现 revision 已写但 latest 未收口、旧历史支撑当前完成、plan/tasks coverage 缺失或 host identity 泄露，停止交付并保留事实。

### Done

当前 plan/tasks contract 完整，CAS/latest、公共边界和整合 subject 脱敏回归通过；最终整合 review 已真实调用并保留 provider 分歧，invalid_anchor 已逐条处置；这些事实仍不等于 formal close。

### Risks and rollback

最终回归失败时只修当前 task 的实现/测试，不删除失败证据，不把 check 绿写成用户确认或 formal close。

## Phase 7：语义闭环与轻量 scope-revision

### Goal

修复“结构闭环被误报为需求完成”的根因，并提供 build-code/verify-code 中途临时需求的同 task 四材料一次性专用审查；不跑完整五阶段，不改 provider 配置，不新增 public stage/control plane。

### Files

- **MODIFY**：`runtime/stage/stage-handlers.mjs`; `runtime/stage/completion-predicates.mjs`; `runtime/stage/stage-content-contracts.mjs`; `skills/wh-review/scripts/review-materials.mjs`; `skills/wh-review/scripts/review-runner.mjs`; `skills/wh-review/SKILL.md`; `workflows/build-code/SKILL.md`; `workflows/verify-code/SKILL.md`。
- **MODIFY**：`tests/contract/review-materials-contract.test.mjs`; `tests/contract/stage-completion.test.mjs`; `tests/spec-content-profile.test.mjs`; `tests/final-cutover-guards.red.test.mjs`。
- **MODIFY**：`specs/requirements-completeness-audit-20260804/decision-log.md`; `specs/requirements-completeness-audit-20260804/spec.md`; `specs/requirements-completeness-audit-20260804/plan.md`; `specs/requirements-completeness-audit-20260804/tasks.md`; `quality/evidence/verification/requirements-completeness-replay-current.json`。
- **NEW**：`runtime/review/scope-revision-contract.mjs`; `skills/wh-review/contracts/scope-revision.md`; `tests/contract/scope-revision-contract.test.mjs`。

### Tasks

T017 then T018 then T019；T017 先固定语义完成判据，T018 再固定 scope-revision review 输入，T019 只刷新当前事实。

### Verify

只运行受影响的 stage/content/review contract、plan-task contract、stage-risk 和 final-cutover focused tests；不重跑 `npm test`，不重复 provider。

### Knowledge

前置阶段的结构检查仍然必要，但不能替代 AC 的场景/oracle 设计和 build-code/verify-code 的实际结果/独立锚点；scope revision 复用现有 review route，不新增控制面。

### STOP

若必须修改 provider 配置、创建 successor/reopen/ledger、新增 public stage，或只能靠旧 receipt/共享 anchor 证明当前需求，停止并保留 incomplete。

### Done

当前实现能把结构完成与语义完成分开；build-spec/build-plan 会提前暴露设计或 plan-task 缺口；合法临时需求能在同 task 生成一次专用 scope-revision packet；纯材料写回不会错误使源码证据失效；T019 当前证据已刷新，但因 full-suite/history/provider/handoff 事实未完成，不宣称整体 close。

### Risks and rollback

旧任务材料可能因缺少真实 completion evidence、独立 anchor 或 Phase 7 结构而降为 unknown/incomplete；只修当前材料/实现和定向测试，不删除旧失败事实，不把它们改写为 pass。

### T017 — 让需求/AC/replay 只能凭语义证据声明完成

- **Files**：`runtime/stage/stage-handlers.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/stage/stage-content-contracts.mjs`、相关 contract tests。
- **Action**：按当前阶段读取材料；build-spec 先检查每个 AC 已声明可观察场景和 oracle/验证规则；plan-task 使用完整结构契约；真实读取 task completion evidence；covered/pass 必须具备 scenario、oracle、actual outcome、coverage limits 和独立 implementation/verification anchors；缺失降为 unknown/incomplete。
- **RED/GREEN**：先用共享 proving anchor、模板化 outcome、伪 hash 负例证明旧规则会误报，再用当前 runtime/contract focused test 证明被拒绝或降级。
- **STOP**：不得把历史任务行、完整测试、provider pass 或共享 receipt 改写成语义完成。

### T018 — 实现四材料 scope-revision 专用 review material

- **Files**：`runtime/review/scope-revision-contract.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/contracts/scope-revision.md`、`skills/wh-review/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`tests/contract/scope-revision-contract.test.mjs`。
- **Action**：允许 build-code/verify-code 以内部 `scope_revision` kind 复用现有 wh-review route；材料包只接受四份当前材料和结构化影响矩阵；专用 prompt/contract 只审核心目标、四材料一致性、全局影响和宪法风险；同一 revision 只审一次，verdict 不作 gate。
- **STOP**：不新增 stage、successor/reopen、ledger、provider/config、scope_revision 状态或自动重审循环；Talk/Clarify/Grill 只能由主代理完成。

### T019 — 当前任务证据回放和定向收口

- **Files**：当前四份材料、当前 verify/build evidence disposition、必要的 focused tests。
- **Action**：把 R1-R23、五份报告需求点、INC-001~056、D1-D56、FR/AC/T 全部重新分类为当前实现、deferred、non-goal、unknown 或 unavailable；只刷新受影响语义证据和 verify projection；复用已有完整 receipt，不重跑 `npm test`，不重复 provider。
- **Oracle**：不存在“所有 Task completed 但原始需求缺 evidence”的假完成；每个 pass 都能指出具体行为和独立证明，每个未知都有原因和延期交接。
- **STOP**：任何 unknown/incomplete 仍保持原样，不执行 close/confirm/authorize。

## Phase 8：恢复内容合同与 apply 测试闭环

### Goal

恢复 spec/plan/tasks 的高质量内容引导，并让 build-plan 为每个 Task/Phase/final 设计分层
测试策略、写入 tasks.md，再由 build-code 按策略执行并保存结果和 coverage limits；不恢复
AgentHub 的门禁或第二控制面。

### Files

- **MODIFY**：`runtime/review/scope-revision-contract.mjs`; `skills/wh-review/contracts/scope-revision.md`; `tests/contract/scope-revision-contract.test.mjs`。
- **MODIFY**：`skills/spec-specify/SKILL.md`; `skills/spec-specify/templates/spec-template.md`; `skills/spec-specify/skill-bundle.json`; `skills/spec-clarify/SKILL.md`; `skills/spec-clarify/skill-bundle.json`; `skills/spec-plan/SKILL.md`; `skills/spec-plan/templates/plan-template.md`; `skills/spec-plan/skill-bundle.json`; `skills/spec-tasks/SKILL.md`; `skills/spec-tasks/templates/tasks-template.md`; `skills/spec-tasks/skill-bundle.json`。
- **MODIFY**：`workflows/build-spec/skill-deps.yaml`; `workflows/build-plan/SKILL.md`; `workflows/build-plan/skill-deps.yaml`; `workflows/build-plan/steps.json`; `workflows/build-code/SKILL.md`; `workflows/build-code/skill-deps.yaml`; `workflows/build-code/steps.json`。
- **MODIFY**：`skills/test-routing-advisor/SKILL.md`; `skills/test-routing-advisor/scripts/route.mjs`; `skills/test-routing-advisor/__tests__/skill-contract.test.mjs`; `skills/test-routing-advisor/skill-bundle.json`; `skills/testing-system-blueprint/SKILL.md`; `skills/testing-system-blueprint/skill-bundle.json`; `skills/backend-testing/SKILL.md`; `skills/backend-testing/skill-bundle.json`; `skills/frontend-testing/SKILL.md`; `skills/frontend-testing/skill-bundle.json`; `skills/fullstack-slice-testing/SKILL.md`; `skills/fullstack-slice-testing/skill-bundle.json`。
- **MODIFY**：`skills/catalog.yaml`; `skills/reuse-registry.md`; `specs/requirements-completeness-audit-20260804/decision-log.md`; `specs/requirements-completeness-audit-20260804/spec.md`; `specs/requirements-completeness-audit-20260804/plan.md`; `specs/requirements-completeness-audit-20260804/tasks.md`; `tests/contract/spec-stage-artifact-closure.test.mjs`; `tests/contract/build-code-apply-contract.test.mjs`。
- **DO NOT TOUCH**：wh-review/3rd-review provider 配置、AgentHub 源仓库、历史 review/receipt/snapshot。

### Tasks

T020 → T021 → T022 → T023 → T024。T020 先恢复内容输入，T021 再补 apply 顺序，T022 把测试路由/blueprint/适用测试方法移到 build-plan 设计，T023 收口 scope_revision，T024 最后把每个任务的可执行策略固化到 tasks.md 并验证 build-code 只执行。

### Verify

运行 `tests/contract/spec-stage-artifact-closure.test.mjs`、`tests/contract/build-code-apply-contract.test.mjs`、`tests/contract/scope-revision-contract.test.mjs`、`tests/contract/review-materials-contract.test.mjs`，并运行 `npm run check:skill-closure`；不运行 `npm test`，不调用 provider。

### Knowledge

AgentHub apply 的可吸收内容是 Phase Card、RED/GREEN、风险测试、报告、finding disposition 和 handoff；其 pass/commit/worktree/session/full-suite gate 与 WorkflowHub Constitution 冲突，明确不迁移。

### STOP

如果必须新增 public stage、permit、ledger、provider 配置、强制 commit/full-suite gate，或测试报告不能绑定当前 snapshot，停止并记录 unknown/incomplete。

### Done

四个 spec 内容 skill/template 可由 build-spec/build-plan manifest 解析；build-code manifest 可按真实 scope 选择 blueprint 和适用执行器；每 Phase/最终收口的测试事实可回放；一次专用 scope_revision review 已记录真实 verdict 和 finding disposition。

### Risks and rollback

模板字段增多会增加输入成本；通过单一模板和风险分层控制成本。回滚只删除本轮新增 skill/测试合同和当前材料 revision，不删除历史 provenance 或失败事实。

### T020 — 恢复 spec/plan/tasks 内容合同

- **FR/AC**：FR-022 / AC-025
- **Action**：恢复四个 spec skill、三个模板和 stage inline 依赖；更新 catalog/reuse registry 与 bundle closure；明确不新增第二材料真相。
- **Verify**：spec-stage artifact closure + skill closure。

### T021 — 恢复 build-code apply 顺序和交接

- **FR/AC**：FR-023 / AC-026
- **Action**：补 Phase Card、风险/兼容边界、diff/consumer scan、finding root-cause/disposition 和 Phase/plain-language handoff；steps manifest 补测试证据语义。
- **Verify**：build-code apply contract + steps manifest focused test。

### T022 — 接入 build-plan 测试策略设计技能

- **FR/AC**：FR-024 / AC-027
- **Action**：把五个测试技能接入 build-plan dependency closure，要求其设计结果进入 tasks.md；build-code 不再声明这些设计技能；steps 只要求读取 strategy 并记录执行结果；不重复无关全量。
- **Verify**：skill closure、build-plan/build-code manifest、tasks 模板和测试合同，负测覆盖缺策略字段及 per-Phase 设计循环。

### T023 — scope_revision 全局影响实验和一次专用审查

- **FR/AC**：FR-021、FR-022、FR-023、FR-024 / AC-024、AC-025、AC-026、AC-027
- **Action**：把 R20-R23、D45-D49、FR/AC/T 关系、四材料变化、return stage、main-agent Talk/Clarify/Grill、consumer coverage 和 deferred handoff 写入当前四份材料；用专属 `scope_revision` contract 做缺 consumer/子代理沟通/未更新材料/超长摘录负测，并只创建一次 bounded scope_revision review packet。
- **Verify**：scope-revision validator/packet focused tests；provider review 不调用，状态记录为 `not-invoked-by-scope`，不写成 pass。

### T024 — 把每 Task/Phase/final 测试策略固化到 tasks.md

- **FR/AC**：FR-024、FR-025 / AC-027、AC-028
- **Action**：为每个当前和新增 Task/Phase 写入 `test_strategy_owner`、tier、scenarios、commands、expected exit、oracle、fixtures/services、适用测试方法、browser route、evidence path、coverage limits 和 `build-code` 执行契约；增加专门 final aggregate strategy；把 build-code 的工作循环改为只执行任务卡策略。
- **精确文件**：`skills/spec-tasks/SKILL.md`; `skills/spec-tasks/templates/tasks-template.md`; `workflows/build-plan/SKILL.md`; `workflows/build-plan/skill-deps.yaml`; `workflows/build-plan/steps.json`; `workflows/build-code/SKILL.md`; `workflows/build-code/skill-deps.yaml`; `workflows/build-code/steps.json`; `tests/contract/spec-stage-artifact-closure.test.mjs`; `tests/contract/build-code-apply-contract.test.mjs`; 五个测试 skill；`skills/catalog.yaml`。
- **boundary**：files: 上述路径；symbols/regions: task test_strategy 字段、build-plan design closure、build-code run-tests/publish-code-result evidence。
- **输出**：普通 build-code 模型可以按 tasks.md 的命令/oracle 执行，且策略缺失会显式暴露为 `MATERIAL_INCOMPLETE`。
- **Knowledge**：高智力设计与普通执行分离降低重复成本，但策略质量是上游风险；不恢复 pass/commit/full-suite gate。
- **verification_role**：`N/A — workflow contract`
- **paired_task**：`N/A — non-behavior change`
- **gate_cmd**：`npx vitest run tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/build-code-apply-contract.test.mjs && npm run check:skill-closure`
- **expected_exit**：0
- **oracle**：build-plan 声明五个测试设计技能；tasks template 有完整策略字段；build-code manifest 不含五个设计技能；steps 只要求 strategy/test/result；无 per-Phase route/blueprint/executor 设计循环；无 AgentHub gate。
- **evidence_path**：`quality/tests/task-test-strategy-contract-20260805.json`
- **STOP**：任务卡只有“运行测试”而无命令/oracle/evidence/limits，或执行模型被要求临场选择测试方案。
- **recovery**：只撤回 T024 的 stage/template/skill contract 变化，不删除历史测试失败或审查事实。
- **task risk**：build-plan 策略写得过于笼统，普通模型仍需猜测；focused contract 只能检查字段存在，真实语义由后续 build-code/verify-code 验证。

## Phase 9：内容映射、阶段进度和语义状态修正

### Goal

把本轮新增的测试策略、测试技能使用、前三阶段进度、后两阶段执行路径、scope_revision
和 `decision-log → spec → plan → tasks` 映射固化进恢复后的高质量内容合同，并明确当前
任务哪些只是结构/局部实现、哪些仍未完成语义验收。

### Files

- **MODIFY**：`skills/spec-specify/SKILL.md`; `skills/spec-specify/templates/spec-template.md`; `skills/spec-clarify/SKILL.md`; `skills/spec-plan/SKILL.md`; `skills/spec-plan/templates/plan-template.md`; `skills/spec-tasks/SKILL.md`; `skills/spec-tasks/templates/tasks-template.md`。
- **MODIFY**：`runtime/stage/completion-predicates.mjs`; `runtime/stage/stage-handlers.mjs`; `workflows/verify-code/SKILL.md`; `skills/catalog.yaml`; `skills/spec-specify/skill-bundle.json`; `skills/spec-clarify/skill-bundle.json`; `skills/spec-plan/skill-bundle.json`; `skills/spec-tasks/skill-bundle.json`; `specs/requirements-completeness-audit-20260804/decision-log.md`; `specs/requirements-completeness-audit-20260804/spec.md`; `specs/requirements-completeness-audit-20260804/plan.md`; `specs/requirements-completeness-audit-20260804/tasks.md`。
- **MODIFY**：`tests/contract/spec-stage-artifact-closure.test.mjs`。
- **MODIFY**：`tests/stage-plan-task-contract-v3.test.mjs`。
- **NEW**：`tests/contract/stage-progress-contract.test.mjs`。
- **MODIFY**：`tests/verify-requirement-replay-contract.test.mjs`; `tests/decision-log-content-contract.test.mjs`。
- **MODIFY**：`skills/wh-review/scripts/review-materials.mjs`; `skills/wh-review/SKILL.md`; `tests/contract/review-materials-contract.test.mjs`。
- **DO NOT TOUCH**：wh-review/3rd-review provider 配置、AgentHub 源仓库、历史质量事实。

### Tasks

T025 → T026 → T028 → T029 → T027；T025 先补内容映射和测试策略合同，T026 再补进度/路径派生，
T028 回填当前旧任务卡，T029 收口执行中暴露的历史证据兼容问题，T027 最后做当前原始/新增需求的语义回放和 honest status 收口。

### Verify

运行 `tests/contract/spec-stage-artifact-closure.test.mjs`、
`tests/contract/stage-progress-contract.test.mjs` 和受影响的
`tests/contract/build-code-apply-contract.test.mjs`；不运行无关全量回归、不调用 provider。

### Knowledge

历史高水位内容来自删除前可读提交 `5af7349554cdfbb0bfa5c502484d12c69e620188`，
组合恢复点为 `c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf`；本阶段只加当前 WorkflowHub
扩展，不把历史版本或日志声明当作当前语义证据。

### STOP

如果需要新增第二份需求账本、隐藏质量 gate、provider 配置、全量回归循环，或无法取得
当前 receipt 就要宣称全量完成，停止并记录 `unknown/incomplete`。

### Done

四个内容 skill/template 明确记录来源映射、scope_revision、测试策略和阶段进度；当前
plan/tasks 可显示真实进度与执行路径；语义回放能保留 missing receipt、needs_human、
deferred 和 unavailable，而不把结构完成误报为正式验收。

### Risks and rollback

字段增加会提高模板输入成本；通过只保存 ID/状态/refs、不复制正文控制体积。回滚只撤回
本阶段扩展和派生检查，不删除历史决策、review、失败或延期事实。

### T025 — 固化 decision-log 映射与测试策略合同

- **FR/AC**：FR-024、FR-025、FR-026 / AC-027、AC-028、AC-029
- **Action**：在 spec/plan/tasks 内容 skill/template 中增加 `source_refs/decision_refs`、scope_revision 受影响映射、test strategy、final aggregate、build-code only execute 和内容合同 provenance；同步 bundle/catalog。
- **精确文件**：`skills/spec-specify/SKILL.md`; `skills/spec-specify/templates/spec-template.md`; `skills/spec-specify/skill-bundle.json`; `skills/spec-clarify/SKILL.md`; `skills/spec-clarify/skill-bundle.json`; `skills/spec-plan/SKILL.md`; `skills/spec-plan/templates/plan-template.md`; `skills/spec-plan/skill-bundle.json`; `skills/spec-tasks/SKILL.md`; `skills/spec-tasks/templates/tasks-template.md`; `skills/spec-tasks/skill-bundle.json`; `skills/catalog.yaml`。
- **verification_role**：N/A — non-behavior change: content contract
- **gate_cmd**：`npx vitest run tests/contract/spec-stage-artifact-closure.test.mjs`
- **expected_exit**：0
- **oracle**：所有新增字段存在且不形成第二份材料真相；来源/决策 ID 能回到当前 decision-log；恢复来源可核对。
- **evidence_path**：`quality/tests/spec-content-contract-current-20260805.json`
- **STOP**：只能靠摘要或模板字段存在宣称语义完成时停止。

### T026 — 派生前三阶段进度、后两阶段进度和执行路径

- **FR/AC**：FR-027、FR-028 / AC-030
- **Action**：为 plan/tasks 增加唯一 stage-progress 索引；runtime 读取声明进度但保留 quality 独立状态；增加 exact execution path 和所属 Phase 边界的 focused contract。
- **精确文件**：`runtime/stage/completion-predicates.mjs`; `tests/contract/stage-progress-contract.test.mjs`; 当前 `plan.md`; 当前 `tasks.md`。
- **verification_role**：N/A — non-behavior change: progress projection
- **gate_cmd**：`npx vitest run tests/contract/stage-progress-contract.test.mjs`
- **expected_exit**：0
- **oracle**：缺少任一阶段行、使用 glob、或把 quality status 写成 progression gate 时测试失败；当前表可明确显示 completed/incomplete。
- **evidence_path**：`quality/tests/stage-progress-contract-current-20260805.json`
- **STOP**：不得新增 progress ledger、permit 或用材料存在直接覆盖任务真实状态。

### T028 — 回填当前旧任务卡的内容合同字段

- **FR/AC**：FR-026、FR-028、FR-029 / AC-029、AC-030、AC-031
- **Action**：逐张回填 T001-T024 的 `source_refs/decision_refs`、Workflow stage、精确执行路径、测试策略、coverage limits 和 snapshot/证据状态；历史无法核实的内容保持 unknown/incomplete。
- **精确文件**：当前 `tasks.md`; `tests/contract/spec-stage-artifact-closure.test.mjs`
- **verification_role**：N/A — non-behavior change: task-card contract backfill
- **gate_cmd**：`npx vitest run tests/contract/spec-stage-artifact-closure.test.mjs`
- **expected_exit**：0
- **oracle**：每张当前 Task 都能回到来源和 Phase 文件边界；缺字段、glob、越界路径或第二完成权威时失败。
- **evidence_path**：`quality/tests/current-task-card-contract-20260805.json`
- **STOP**：不能从当前事实核实的字段不得猜测；不得补造 receipt、snapshot 或 provider verdict。

### T029 — 修复历史证据缺失的非门禁兼容和 hash 回退

- **FR/AC**：FR-007、FR-029 / AC-008、AC-031
- **Action**：历史 Task 的 completion evidence 读取只把明确的 ENOENT 记为 `historical evidence unavailable`，不阻断当前实现/测试/AC/审查事实；如果 receipt 只有 bytes，则按 bytes 计算 hash；权限、损坏和其他非 ENOENT 错误继续 fail-loud。补回归断言，确保 audit gap 可读但不成为 gate。
- **精确文件**：`runtime/stage/stage-handlers.mjs`; `tests/stage-plan-task-contract-v3.test.mjs`
- **verification_role**：N/A — non-behavior change: historical evidence compatibility
- **paired_task**：N/A — non-behavior change: no RED/GREEN pair
- **gate_cmd**：`npx vitest run tests/stage-plan-task-contract-v3.test.mjs`
- **expected_exit**：0
- **oracle**：历史 evidence 缺失时返回 `completed` 但带 quality/audit gap；bytes-only evidence 不误报 hash mismatch；非 ENOENT 仍抛出。
- **evidence_path**：`quality/tests/historical-evidence-compatibility-20260805.json`
- **STOP**：不能把历史缺失变成当前 pass，也不能用宽泛 catch 吞掉非 ENOENT 错误。
- **recovery**：只撤回 ENOENT/hash 回退和回归测试，不删除历史缺失事实。
- **task risk**：兼容旧记录时重新引入“历史 receipt 是推进许可证”或吞掉真实读错。

### T027 — 当前原始/新增需求语义状态回放

- **FR/AC**：FR-008、FR-029 / AC-003、AC-007、AC-013、AC-031
- **Action**：逐项回放 R1-R23、14 个报告需求点、INC-001~059、D1-D57、FR/AC/T；当前已捕获 `snapshot_tree=9dc7e78d0172712afa85ad90cfef064d8e149294` 并完成源项枚举，下一步按每项证据写入 honest 状态。把局部合同、缺失 receipt、未调用 review、needs_human、deferred 业务和 handoff unknown 分开，不伪造 pass。
- **精确文件**：当前 `decision-log.md`; `spec.md`; `plan.md`; `tasks.md`; `workflows/verify-code/SKILL.md`; `runtime/stage/stage-handlers.mjs`; 受影响 focused tests。
- **verification_role**：N/A — non-behavior change: semantic audit
- **gate_cmd**：`npx vitest run tests/verify-requirement-replay-contract.test.mjs tests/decision-log-content-contract.test.mjs tests/contract/stage-progress-contract.test.mjs`
- **expected_exit**：0
- **oracle**：每条来源都有 pass/fail/unknown/deferred/unavailable 和原因；缺 canonical receipt 或 needs_human 不能成为全量 accepted。
- **evidence_path**：`quality/evidence/verification/requirements-completeness-replay-current.json`
- **STOP**：当前 evidence 不存在时保持 unknown/incomplete，不执行 close/confirm/authorize。

## Appendix A. Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"CONSTITUTION.md","hash":"a4c63f0c3865fdc2ea83b1f2aea0a824608f65512a27a21e05a58e2d80e16001","id":"CONSTITUTION","version":"1.5.0","clause_count":21}`
- F1、F2、F3、F4、F5、F6、F7、F8、F9、F10 均按当前宪法保留单一当前材料、边界和授权。
- Q1、Q2、Q3 均按当前宪法保留质量事实、完成判据和不可逆授权分离。
- S1、S2、S3、S4、S5、S6、S7、S8 均按当前宪法保留可搬运技能、来源、证据和真实失败。
