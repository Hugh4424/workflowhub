# 实现计划：WorkflowHub 交付流程保真与精简交付

- **Input**：`decision-log.md@810aa2df`、`spec.md@33682f4d`
- **Template version**：`plan-task.v3`

## Quick Read

- **Goal**：五阶段真实执行已声明步骤、逐阶段检查原始需求与累积产物，问题在当前阶段闭环；provider 故障不丢审查；mini-task 以精简四材料完成独立小功能交付。
- **Non-goals**：不新增第六 stage、第八类 public runtime、第五材料、质量推进 gate、provider 私有生命周期、scope_revision/rebind/continuation/recovery 状态机；source：R-018、R-063、R-069～070、FR-GOV-001。
- **Before**：`steps.json` 和 skill 只声明拓扑，official stage handler 整阶段只执行一次且没有可信 `step_outcomes/skill_outcomes` producer；`spec-analyze` 仅有 build-plan packet；wh-review 只发一次公开请求；没有 mini-task 流程。
- **After**：交互批量协议、五个 stage consistency profile、可信 step/skill facts、三次 fresh review 恢复与 SAME_SOURCE fallback、mini-task 两类 review 和真实 Git 交付全部复用现有四材料、facts、packet、workspace、close 和 monitoring consumer。
- **Main risk**：把“补真实执行证据”误做成第二套 runtime 编排器，或把 same-source/facts 误做质量通过。
- **Next step**：P1 可直接实施；进入第一个真实 consumer T003 前，先取得用户对“把主线 `d84d430` 合入当前任务分支”的明确授权。未授权只阻塞 P2，不重复实现该提交的五文件修复。

## Technical Context

### Global Constraints

- **Verified facts**：任务分支 HEAD=`bc8d78ed`，主线 HEAD=`d84d430c`，两者 merge-base=`bc8d78ed`；主线只比任务分支多已交付 wh-review 修复。`runtime/task/workspace.mjs` 有用户未提交改动，禁止触碰或带入任务。
- **Language / runtime**：Node.js `v24.14.0`；Git `2.39.5`；ES modules；Vitest。
- **Primary dependencies**：复用 `stage-runner`、`stage-handlers`、`stage-content-contracts`、`review-materials`、`TaskHandle`、`ArtifactDir`、`prepareTaskWorkspace`、`task-close`、facts/monitoring；无新增外部依赖。
- **Storage / state**：只使用四材料和现有 `facts.jsonl`、`quality/reviews/`、`quality/tests/`、`quality/evidence/`、`quality/verify.json`；不新增 ledger、permit、latest projection 或关系对象。
- **Testing**：独立 routing=`fullstack`；每 phase 用单一聚焦 Vitest 命令完成 RED/GREEN，最终只运行一次 aggregate；临时 broker/fixture/worktree 由测试清理。
- **Target environment**：本地 macOS、CI Node >=24、现有 3rd-review public broker；host-subagent 不可用时如实记录 fallback unavailable。
- **Scale / scope**：五个 workflow、四个交互/分析 skill、wh-review、一个新 mini-task skill、stage outcome 链、Git close、配置、治理文档和聚焦测试。
- **Unresolved facts**：用户尚未授权把 `d84d430` 合入任务分支；这是 build-code 前置 Git 操作，不改变产品方向。精确 token 历史分布保持 unavailable，仅比较可得 duration/call count。

## Code Anchors

- **Verified anchors**：`runtime/stage/stage-runner.mjs:runOfficialStage` → `runtime/stage/stage-handlers.mjs:officialStageHandler`；`tools/cli/stage-runtime.mjs:stageMonitoringFacts` 消费但当前拿不到可信 outcomes；`skills/wh-review/scripts/review-materials.mjs:buildPlanningArtifacts/buildReviewMaterials`；`runtime/stage/stage-content-contracts.mjs:validateSpecAnalyzeCompleteness`；`tools/cli/task-bootstrap.mjs:bootstrapTask`；`runtime/task/workspace.mjs:prepareTaskWorkspace/openCurrentTaskWorkspace`；`core/task-close.mjs:prepareDeliveryClosePlan/completeDeliveryClosePlan`。
- **Existing interfaces**：七类 public runtime 不变；`runReview` 保持单 immutable attempt；`runtime/review/stage-materials.json` 保持唯一 packet profile authority；`ArtifactDir.writeAtomic` 保持四材料 writer；`appendMonitoringFacts` 保持事实写入口。
- **Read now**：五份 workflow 的 `SKILL.md/steps.json/skill-deps.yaml`、四份材料、`stage-content-contracts.mjs`、wh-review CLI/runner/material/config、task-close、workspace、monitoring consumer 和对应测试。
- **Must read before task**：T003 执行前读合并后 d84d430 五文件；T005 执行前读实际 `task-close` readiness 分支；T007 执行前核对 handler result schema；T010 前读取全部 phase 实际 changed files。
- **Context mode**：Full — 跨 workflow/review/runtime/Git close，边界必须逐文件认证。

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
| --- | --- | --- | --- |
| 五阶段一致性 | extend | `validateSpecAnalyzeCompleteness`、packet projection | 增加 stage profile，不建万能 analyzer；五阶段不再消费时删除扩展 |
| step/skill 结果 | extend | TaskHandle `quality/evidence/`→official handler result→`stageMonitoringFacts` | Stage Agent 是唯一 producer；handler 只认证同 task/stage/snapshot 的 evidence 后透传，不逐 skill 编排 |
| review 恢复 | extend | `runReview` 单 attempt | CLI 组合最多三次 fresh request，不进入 broker 私有 session |
| mini-task | new thin skill | bootstrap/workspace/artifact/review/task-close | 唯一 consumer 是 mini-task；若直接复用普通五阶段成本可接受则删除 |
| A 合并 | reuse | existing task-close + mini-task runner single consumer | task-close 先把 mini branch 合入已冻结的共享目标分支；随后 runner 在认证 A workspace 内用 A 专属 merge 授权执行普通 `git merge <目标 OID>` 并读回，不新增 helper/第二 close |
| monitoring | reuse | existing facts/diagnostics/projector/page | consumer 已足够，不重写页面或第二投影 |

## Solution Design

### Overview

先把交互问题卡和 `spec-analyze` 变成可搬运的 stage-aware 窄合同：每个 profile 只接收“原始需求 + decision-log + 直接上游 + 当前产物/证据”，返回 finding 和六项大白话摘要，不测试代码、不审查专业质量、不决定能否继续。随后 wh-review 复用单 attempt 原语实现三次独立公开请求；材料错误先修不计数，真实 finding 进入当前 stage 修复，三次无异源语义结果才要求宿主 SAME_SOURCE 子代理。

mini-task 是非 stage 的薄 skill：标准 bootstrap 创建独立 task/worktree/branch，既有 writer 一次形成四材料，两个专用 review kind 分别冻结设计和实现 packet，实施测试和真实结果后复用唯一 Git close。来自 A 时，task-close 先把 mini branch 合入冻结的共享目标分支；runner 再在认证 A workspace 内以 A 专属授权 merge 该目标 OID、解决冲突、复验并从原 stage 重跑，不创建 helper 或任务关系状态。

最后让五份 workflow 的声明、skill 依赖和 runtime outcome producer 对齐。Stage Agent 仍执行 portable workflow；runtime 不逐 skill 调度，只认证并透传有 evidence ref 的 outcome。现有 facts/monitoring consumer 展示 missing/unknown/incomplete 和可得成本，不能由 aggregate stage success 反推中间步骤成功。

### Module responsibilities

#### Portable interaction and consistency skills

- **Responsibility**：批量展示独立问题；按 stage 分析实际语义、产物证据、漂移、hand-off 和摘要。
- **Consumes**：冻结的当前四材料/阶段 packet 与真实回复。
- **Produces**：建议 finding、当前阶段修复输入、六项摘要和有证据的 skill outcome。
- **Must not decide**：产品方向、测试结果、provider verdict、继续工作的权限。

#### wh-review recovery and mini-task profiles

- **Responsibility**：保留单 attempt 原语，组合三次 fresh public requests；冻结 design/implementation packet；请求 SAME_SOURCE host fallback。
- **Consumes**：trusted config、现有 subject profile、material/snapshot identity。
- **Produces**：immutable attempt refs、真实终态、fallback-required fact；五阶段 workflow 与 mini-task runner 是两个明确 consumer，均须调用宿主独立上下文，并把冻结材料、snapshot、finding/coverage、来源类型和 evidence ref 写回当前 review fact。
- **Must not decide**：3rd-review 私有 lifecycle、质量 pass、风险接受。

#### mini-task runner and delivery

- **Responsibility**：薄编排现有 bootstrap、四材料、review、测试事实、close 和 A merge。
- **Consumes**：认证 TaskHandle、四材料、授权、当前 HEAD 和 review/test facts。
- **Produces**：独立功能 commit/merge/push/close 物理事实及 A 受影响复验事实。
- **Must not decide**：自动扩大范围、自动授权、创建第六 stage 或关系对象。

#### Stage outcome bridge

- **Responsibility**：认证 Stage Agent 提供的 step/skill outcome evidence，并透传给现有 facts/monitoring。
- **Consumes**：Stage Agent 用 `TaskKernel.publishCanonicalRecord` 写入内容寻址的 `quality/evidence/stage-outcomes/<stage>/<sha256>.json`；记录含 schema、task_id、stage、snapshot_tree、material hashes、manifest hash、step/skill outcomes 和 evidence refs。ArtifactDir 只读四材料，不写 TaskHandle quality namespace。
- **Produces**：completed/skipped/incomplete/unavailable/missing/unknown monitoring facts。
- **Must not decide**：执行 portable skill、补猜缺失步骤、把 fact 变 gate。
- **唯一接线**：official run 只新增 `receipts.stage_outcomes` 的 content-addressed ref；`officialStageHandler` 用现有 task record 读取和 hash/snapshot/manifest 认证，把认证后的数组放入既有 handler result 顶层；`stageMonitoringFacts` 保持唯一 consumer。每次 stage/snapshot 产生不可变新记录，retry 不覆盖；无记录时仍输出 missing/unknown。

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：扩展现有 stage consistency projection；`runReviewRecovery` 是 `wh-review-cli.mjs` 中包住三次 `runReviewRound` 的唯一外层符号，runner 仍单 attempt；mini-task 使用 review kind discriminator，不加入 `REVIEW_STAGES`；stage outcome 只接受 manifest 中 step/skill 和可认证 evidence ref。
- **Data flow / state**：packet hash/snapshot → analysis/review → immutable quality fact → current-stage repair → focused affected recheck；缺输入=`material_incomplete`，未执行=`missing/unknown`，不可得=`unavailable`，计划内未授权 Git=`pending/incomplete`。
- **API contract**：public runtime 七类不变；mini-task 通过可独立调用 skill/内部 runner 组合现有 API，不增加 CLI 类别。
- **UI / external code**：无新 UI；现有 monitoring page 只消费新增可信 facts。外部配置仅增加 `wh_review.mini_task.design` 与 `.implementation`。
- **Fail-loud behavior**：snapshot/material 漂移停止当前 recovery；伪造 outcome、越界文件、缺 AC/test evidence、计划内未授权 Git、merge conflict、同源冒充异源均明确 incomplete/unavailable。

## File Boundary

### NEW

- `skills/mini-task/SKILL.md`
- `skills/mini-task/scripts/mini-task-runner.mjs`
- `skills/mini-task/skill-bundle.json`
- `skills/wh-review/contracts/mini-task-design.md`
- `skills/wh-review/contracts/mini-task-implementation.md`
- `docs/standard-workflow.md`
- `tests/contract/stage-interaction-batching.test.mjs`
- `tests/contract/five-stage-spec-analyze-wiring.test.mjs`
- `tests/integration/mini-task-delivery.test.mjs`
- `tests/integration/mini-task-a-resume.test.mjs`
- `tests/contract/workflow-quality-regression.test.mjs`（把三个历史故障转成 P1～P4 真实 consumer 的最小失败场景，不复制历史事实库）
- `tests/fixtures/workflow-quality-cost-sample.json`（固定 sample_id、输入 hash、baseline 来源和采集字段；只存行为样例，不复制历史 thread 事实）

### MODIFY

- `skills/talk-with-zhipeng/SKILL.md`
- `skills/grill-with-docs/SKILL.md`
- `skills/spec-clarify/SKILL.md`
- `skills/spec-analyze/SKILL.md`
- `skills/spec-analyze/packet-lens.md`
- `runtime/stage/stage-content-contracts.mjs`
- `tests/contract/spec-analyze-completeness.test.mjs`
- `skills/wh-review/SKILL.md`
- `skills/wh-review/scripts/third-review-host-config.mjs`
- `skills/wh-review/scripts/wh-review-cli.mjs`
- `runtime/review/stage-materials.json`
- `skills/wh-review/stage-skill-plan.json`
- `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`
- `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- `skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`
- `tests/contract/review-materials-contract.test.mjs`
- `core/task-close.mjs`
- `tests/integration/vnext-delivery-close.test.mjs`
- `workflows/make-decision/SKILL.md`
- `workflows/make-decision/steps.json`
- `workflows/make-decision/skill-deps.yaml`
- `workflows/build-spec/SKILL.md`
- `workflows/build-spec/steps.json`
- `workflows/build-spec/skill-deps.yaml`
- `workflows/build-plan/SKILL.md`
- `workflows/build-plan/steps.json`
- `workflows/build-plan/skill-deps.yaml`
- `workflows/build-code/SKILL.md`
- `workflows/build-code/steps.json`
- `workflows/build-code/skill-deps.yaml`
- `workflows/verify-code/SKILL.md`
- `workflows/verify-code/steps.json`
- `workflows/verify-code/skill-deps.yaml`
- `runtime/stage/stage-handlers.mjs`
- `runtime/stage/stage-runner.mjs`
- `tools/cli/stage-runtime.mjs`
- `runtime/evidence/stage-completion-facts.mjs`
- `tests/contract/stage-skill-invocation-contract.test.mjs`
- `tests/contract/stage-routing-and-concrete-testing.test.mjs`
- `tests/contract/stage-completion.test.mjs`
- `tests/stage-completion-facts.test.mjs`
- `tests/m15-monitoring-integration.test.mjs`
- `tests/m15-monitoring-diagnostics.test.mjs`
- `tests/e2e/vnext-five-stage-current.test.mjs`
- `skills/talk-with-zhipeng/skill-bundle.json`
- `skills/grill-with-docs/skill-bundle.json`
- `skills/spec-clarify/skill-bundle.json`
- `skills/spec-analyze/skill-bundle.json`
- `skills/wh-review/skill-bundle.json`
- `skills/catalog.yaml`
- `skills/reuse-registry.md`
- `CONTEXT.md`
- `docs/adr/0013-mini-task-compact-delivery-flow.md`
- `docs/architecture/move-map.json`
- `/Users/Hugh/.config/workflowhub/config.json`

### DO NOT TOUCH

- `runtime/interface/runtime-facade.mjs` — 不新增 public runtime。
- `runtime/stage/completion-predicates.mjs`、`runtime/stage/stage-predicates.mjs` — analysis/review 不是 gate。
- `runtime/task/workspace.mjs` — 主线有用户未提交改动；复用接口，不编辑。
- `runtime/task/task-store.mjs`、`runtime/evidence/monitoring-diagnostics.mjs`、`runtime/evidence/monitoring-projector.mjs`、`runtime/evidence/monitoring-page.html` — 现有 writer/consumer 足够。
- `skills/wh-review/scripts/review-provider-client.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/**` — 不复制 provider lifecycle/polling/timeout。
- `specs/archive/**` — 历史只读。

## Technical Decisions

### DEC-001 — Stage Agent 执行，runtime 只认证 outcome

- **Problem**：声明 step/skill 与 monitoring 无可信 producer。
- **Options**：runtime 逐 skill 编排；继续只展示声明；认证 Stage Agent evidence 后透传。
- **Selected**：extend — 认证并透传 outcome。
- **Reason**：补足真实证据链，同时不建设第二套工作流引擎。
- **Consequence / risk**：必须拒绝调用方自报 executed；缺 evidence 保持 missing/unknown。
- **Fallback**：移除 bridge 后恢复现有保守 missing/unknown，不损坏四材料。
- **F10 real threat**：历史任务阶段绿但中间 step 丢失。
- **F10 existing cover**：manifest、facts、monitoring consumer 已覆盖大部分，仅缺 producer。
- **F10 bypassable**：若接受无 evidence 自报则可绕过，故必须绑定 refs/hash。
- **F10 maintenance cost**：一个窄 outcome validator 和合同测试。
- **F10 disposition**：`keep`

### DEC-002 — 三次 public attempt，不做 broker retry

- **Problem**：单次 provider unavailable 会丢失审查步骤。
- **Options**：修改 3rd-review 私有 lifecycle；WorkflowHub 隐藏 retry；组合三个现有 public requests。
- **Selected**：extend — `runReview` 保持单 attempt，CLI 组合三次 fresh requests。
- **Reason**：满足恢复要求且边界清楚，可回放每次事实。
- **Consequence / risk**：必须锁定同 material/snapshot；数组输出需保留现有单数 consumer。
- **Fallback**：退回单 attempt，历史 attempts 仍不可变。
- **F10 real threat**：真实 provider failure 已导致长等待和审查缺失。
- **F10 existing cover**：3rd-review 负责单会话健康；不负责 WorkflowHub 三次公开请求策略。
- **F10 bypassable**：SAME_SOURCE 或漂移 packet 不得计异源成功。
- **F10 maintenance cost**：一个有界 orchestration helper 和失败分类测试。
- **F10 disposition**：`keep`

### DEC-003 — mini-task 为薄 skill，不是第六 stage

- **Problem**：小型依赖/修复走完整五阶段过重，聊天直改又缺质量和交付。
- **Options**：恢复 scope_revision；新增第六 stage；非 stage skill 复用现有 API。
- **Selected**：new — `skills/mini-task` 薄编排。
- **Reason**：唯一能同时满足低成本、四材料、两次 review、独立 Git 交付和宪法边界。
- **Consequence / risk**：mini-task 在非 stage runner 内执行与 verify-code 同一组收尾检查，并通过 `TaskKernel.publishVNextQualityFact("verify-code", ...)` 发布现有 `full_tests_fresh`、`independent_review` 两个 subject；不运行或伪造 verify-code completion，不增加 proof mode/schema，且绑定当前 snapshot/material 和真实 test/review evidence。
- **Fallback**：停止 mini-task，保留独立 task/branch/材料，用户选择普通五阶段。
- **F10 real threat**：前置小改动要么阻塞 A，要么无审查直接改。
- **F10 existing cover**：bootstrap/workspace/writer/review/close 均复用，仅缺薄顺序编排。
- **F10 bypassable**：用户指定复杂需求时仍需风险披露；范围扩大暂停。
- **F10 maintenance cost**：一个 skill、一个 runner、两类 packet；A 二次 merge 留在 runner，不新增 helper。
- **F10 disposition**：`keep`

## Test Strategy

设计 RED/GREEN，不在 build-plan 执行命令。全部行为使用 phase 内同一 `gate_cmd` 与 oracle；最终 aggregate 只运行一次。

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
| --- | --- | --- | --- | --- |
| 交互+一致性 | T001/T002 | RED→GREEN | `npx vitest run tests/contract/stage-interaction-batching.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/spec-analyze-completeness.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / nonzero→0 | `ORACLE-STAGE-CONTRACT` / `quality/tests/P1-stage-contract.txt` |
| review 恢复 | T003/T004 | RED→GREEN | `npx vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs tests/contract/review-materials-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / nonzero→0 | `ORACLE-REVIEW-RECOVERY` / `quality/tests/P2-review-recovery.txt` |
| mini-task | T005/T006 | RED→GREEN | `npx vitest run tests/integration/mini-task-delivery.test.mjs tests/integration/mini-task-a-resume.test.mjs tests/integration/vnext-delivery-close.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / nonzero→0 | `ORACLE-MINI-TASK` / `quality/tests/P3-mini-task.txt` |
| outcome 链 | T007/T008 | RED→GREEN | `npx vitest run tests/contract/stage-skill-invocation-contract.test.mjs tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/stage-completion.test.mjs tests/stage-completion-facts.test.mjs tests/m15-monitoring-integration.test.mjs tests/m15-monitoring-diagnostics.test.mjs tests/e2e/vnext-five-stage-current.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / nonzero→0 | `ORACLE-OUTCOME-CHAIN` / `quality/tests/P4-outcome-chain.txt` |
| 治理+历史回放 | T009/T010 | RED→GREEN | `npx vitest run tests/contract/workflow-quality-regression.test.mjs tests/requirements-completeness-audit-acceptance.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / nonzero→0 | `ORACLE-GOV-REPLAY` / `quality/tests/P5-governance.txt` |
| 全部 AC | T011 | FINAL | P1～P5 五条 focused gate 串接后运行 `npm run check` / 0 | `ORACLE-FINAL` / `quality/tests/final-aggregate.txt` |

## Rollback and Recovery

- **Global recovery rule**：只回退当前 phase 实现，保留四材料、不可变 review/test facts 和已交付 d84d430；未变化 phase 不重跑。
- **Irreversible boundaries**：合入主线、commit、push、merge、archive、cleanup 分别取得授权；host config 修改前保留当前内容和 hash。
- **Recovery owner**：build-code Agent 处理 phase 内 RED/GREEN；Git 冲突立即 abort 并报告；产品方向变化返回 make-decision。

### Engineering Risk Handoff

- **PLAN-RISK-001**：outcome 自报造成假绿
  - **Affected IDs**：R-022～025、R-067、FR-STEP-001、FR-STAGE-001、T007～T008
  - **Trigger**：handler 接受没有 manifest/evidence/hash 的 completed。
  - **Consequence**：monitoring 显示已执行但 step 实际丢失。
  - **Mitigation or STOP**：只认证现有 manifest ID 和 evidence ref；否则 missing/unknown。
  - **Handling Stage**：build-code
  - **Verification**：ORACLE-OUTCOME-CHAIN 负例。
- **PLAN-RISK-002**：review 恢复越界成 provider lifecycle
  - **Affected IDs**：R-037、R-074、R-077、R-085～092、FR-REVIEW-001、T003～T004
  - **Trigger**：复用 session、添加 polling/timeout/kill 或 SAME_SOURCE 冒充异源。
  - **Consequence**：重复控制面和虚假质量闭合。
  - **Mitigation or STOP**：三个 public request、同 snapshot、原始终态保留；provider client 禁改。
  - **Handling Stage**：build-code
  - **Verification**：ORACLE-REVIEW-RECOVERY。
- **PLAN-RISK-003**：mini-task 绕过四材料或授权
  - **Affected IDs**：R-072～089、R-093、R-095、FR-MINI-001～004、FR-LIFECYCLE-001、T005～T006
  - **Trigger**：直接改代码、自动扩范围、复制 close、计划内未授权操作标完成。
  - **Consequence**：低质量交付或破坏 A。
  - **Mitigation or STOP**：认证 TaskHandle、四材料字段、两类 packet、task-close 唯一 executor、范围扩大暂停。
  - **Handling Stage**：build-code
  - **Verification**：ORACLE-MINI-TASK。
- **PLAN-RISK-004**：任务分支基线漂移
  - **Affected IDs**：PFACT-03、FR-REVIEW-001、T003～T004
  - **Trigger**：未合 d84d430 就重复编辑五文件，或带入 `runtime/task/workspace.mjs` 脏改。
  - **Consequence**：重复修复、冲突、污染用户改动。
  - **Mitigation or STOP**：build-code 前展示对象并取得 merge 授权；合并后读回 diff；workspace.mjs 禁改。
  - **Handling Stage**：build-code
  - **Verification**：`git diff --name-status bc8d78ed..d84d430c` 与工作树读回。

## Implementation Order

先执行 P1 公共交互/一致性合同；进入 T003 前授权同步 `d84d430` 基线，再执行 P2 review recovery/profile → P3 mini-task consumer/Git delivery → P4 五阶段 workflow 与可信 outcome producer → P5 治理、标准文档、bundle 和历史回归。P2 先于 P3，因为 mini-task 依赖两类 review kind；P1/P2/P3 先于 P4，因为 workflow 只能接入已存在合同；所有生产改动完成后才做 P5 单次闭包与 aggregate。

## Dependencies and Parallelism

- **Dependencies**：P1 → `d84d430` authorized merge → P2 → P3 → P4 → P5；每条 serial edge 都是 producer-before-consumer。
- **Parallel work**：同一 phase 内 RED fixture 可并行阅读，但 RED→GREEN、同一文件和最终 aggregate 必须串行；phase 间不并行，避免共享 workflow/review/bundle 边界交叉返工。
- **External dependencies**：3rd-review public broker 和 host-subagent；缺失分别记录 unavailable/SAME_SOURCE fallback unavailable，不阻止同任务修复。

## Open and deferred disposition

| Item | Plan owner / task | Current disposition | Close evidence |
| --- | --- | --- | --- |
| PFACT-04、OPEN-SPEC-01 | P1/P4，T002/T008 | 用现有 packet、workflow declaration、handler result、facts consumer 形成唯一接线，不建第二编排器 | ORACLE-STAGE-CONTRACT + ORACLE-OUTCOME-CHAIN |
| OPEN-SPEC-02 | P3/P4，T005/T008 | 复用现有 dirty facts；`runtime/task/workspace.mjs` 只读且禁止修改 | dirty 正负例与 monitoring readback |
| OPEN-SPEC-03 | P1/P4，T002/T008 | talk/grill/clarify 声明统一 ask/wait/resume 宿主合同 | batch/resume contract |
| OPEN-SPEC-04 | P4，T007/T008 | build-spec workflow 是条件调研事实的真实 consumer | workflow invocation contract |
| OPEN-SPEC-05 | P1，T001/T002 | 五个 profile 输入、finding、六项摘要在 analyzer 合同冻结 | profile schema 正负例 |
| OPEN-SPEC-06 | P4，T007/T008 | manifest 对照的 step/skill outcome 由 handler result 认证后进入现有 facts | 缺证据拒绝与 monitoring readback |
| OPEN-SPEC-07 | P2，T003/T004 | material/snapshot identity 决定 freshness；记录性变化不失效 | 三次 fresh request 与 drift fixture |
| OPEN-SPEC-08 | P5，T009/T010 | 不补写旧交互；四材料绑定 live thread ref/observed revision；canonical export/hash 缺失保持 unavailable | provenance integrity replay |

`DEFER-001～017` 不再留给未命名后续阶段：`001～003、009～010、013～015` 由上表对应 OPEN 项关闭；`004～005` 由 T003/T004；`006～008` 由 T007～T010；`011、016` 由 T009～T011 的同样例成本比较；`012` 由 T001/T002；`017` 由 T005/T006 与 T011 的物理读回关闭。若对应 oracle 不成立，就在该 task 修复，不向后移交。

## Requirement and Verification Traceability

### Deferred / Open execution index

| ID | owner | trigger | handoff / consumer | close condition |
| --- | --- | --- | --- | --- |
| DEFER-001 | T005/T008 | dirty workspace fact changes | existing workspace facts → monitoring | dirty positive/negative oracle passes |
| DEFER-002 | T001/T002/T008 | ask/wait/resume interaction | interaction host contract | batch/resume oracle passes |
| DEFER-003 | T007/T008 | build-spec research applies or skips | build-spec outcome → stage facts | executed/skipped/unavailable is readable |
| DEFER-004 | T007/T008/T011 | final implementation snapshot exists | build-code review and AC trace | current review/trace evidence recorded |
| DEFER-005 | T003/T004 | provider/material terminal result | wh-review result → stage workflow | recovery/path/cleanup oracle passes |
| DEFER-006 | T009/T010 | historical regression suite runs | four-material source binding → real consumers | three task failures replay without rewriting history |
| DEFER-007 | T003/T004 | record-only or subject change occurs | material/snapshot freshness consumer | record-only reuse and subject invalidation pass |
| DEFER-008 | T007/T008 | make-decision step finishes | stage outcome fact → handler/monitoring | each manifest step has authenticated outcome |
| DEFER-009 | T001/T002 | final analyzer runs after review repairs | build-plan quality fact | current five-input analyzer result recorded |
| DEFER-010 | T001～T010 | owning RED task begins | exact task file boundary | plan-task contract and phase oracle pass |
| DEFER-011 | T009/T010/T011 | baseline and candidate are available | same-sample cost facts → final summary | comparison is available or truthful unavailable |
| DEFER-012 | T001/T002 | make-decision requirement preparation | decision-log and stage summary | AC-001 oracle passes |
| DEFER-013 | T001/T002/T008 | any stage invokes consistency profile | stage packet → spec-analyze → facts | five profile schema/wiring pass |
| DEFER-014 | T007/T008 | Stage Agent completes/skips a step | stage outcome record → monitoring | missing/skipped/incomplete/unavailable cases pass |
| DEFER-015 | T007/T008 | build-plan reaches final analyzer step | workflow declaration → Stage Agent fact | actual invocation evidence is authenticated |
| DEFER-016 | T009/T010/T011 | candidate implementation is complete | same-sample cost facts → final summary | AC-019 passes without guessed token |
| DEFER-017 | T005/T006/T011 | close operation is applicable and authorized | existing task-close executor → physical readback | every applicable operation is read back |
| OPEN-001 | T005/T008 | dirty target is observed | existing dirty fact consumer | OPEN-SPEC-02 oracle closes |
| OPEN-002 | T007/T008 | conditional research decision occurs | build-spec workflow consumer | OPEN-SPEC-04 oracle closes |
| OPEN-003 | T003/T004 | public provider attempt terminates | runReviewRecovery only | three fresh requests/fallback contract passes |
| OPEN-004 | T005/T006 | actual dirty cleanup becomes applicable | current task-close authorization flow | N/A now; future operation requires bound authorization |
| OPEN-005 | T001/T002/T004 | confirmation or advice subject changes | material/snapshot freshness consumer | record-only change does not retrigger advice |
| OPEN-006 | T009/T010 | historical Talk evidence is requested | live thread ref + observed revision + four-material source binding | canonical hash remains unavailable; prevention regression passes |
| OPEN-007 | T001/T002/T008 | current-stage repair is needed | existing artifact owner writer | same-stage repair succeeds without transfer state |
| OPEN-008 | build-spec（closed） | historical final semantic audit completed | retained closed evidence | 不复用 ID；T011 final check 不改变其历史状态 |
| OPEN-009 | T005/T006 | user or stage invokes mini-task | mini-task runner | direct and enabling-change entry pass |
| OPEN-010 | T005/T006 | mini-task suitability is evaluated | four-material compact contract | boundary/explicit-user route cases pass |
| OPEN-011 | T005/T006 | mini-task scope expands materially | user choice handoff | pause/keep-small/ordinary-task cases pass |

完整 ID 索引：FR-PREP-001、FR-INTERACT-001、FR-TRACE-001、FR-STAGE-001、FR-STAGE-002、FR-STEP-001、FR-REPAIR-001、FR-EXEC-001、FR-REVIEW-001、FR-RESULT-001、FR-STATUS-001、FR-COST-001、FR-MINI-001、FR-MINI-002、FR-MINI-003、FR-MINI-004、FR-LIFECYCLE-001、FR-GOV-001、FR-AUDIT-001；AC-001、AC-002、AC-003、AC-004、AC-005、AC-006、AC-007、AC-008、AC-009、AC-010、AC-011、AC-012、AC-013、AC-014、AC-015、AC-016、AC-017、AC-018、AC-019、AC-020、AC-021、AC-022、AC-023、AC-024、AC-025、AC-026、AC-027。每项的 Phase、Task、command/oracle/evidence 由下表和 Test Strategy 共同绑定。

| Source / decision | FR | AC | Phase / Task | Depends on | Exact files | Command / oracle |
| --- | --- | --- | --- | --- | --- | --- |
| R-007～016、021～026、031～035、040～044、053～060、064～071、090～097 / D-001～004 | FR-PREP-001、FR-INTERACT-001、FR-TRACE-001、FR-STAGE-001～002、FR-STEP-001、FR-REPAIR-001、FR-EXEC-001、FR-RESULT-001、FR-STATUS-001 | AC-001～AC-013、AC-016、AC-017 | P1/T001～T002；P4/T007～T008 | P1；P4 另依赖 P3 | P1/P4 files | ORACLE-STAGE-CONTRACT、ORACLE-OUTCOME-CHAIN |
| R-005、017、036～039、074、077、085～086、092 / D-011 | FR-REVIEW-001 | AC-014、AC-015 | P2/T003～T004 | P1 | wh-review/config/profile files | ORACLE-REVIEW-RECOVERY |
| R-006、019、027、041～042、050～051、061、065、071 / D-004 | FR-COST-001 | AC-018、AC-019 | P1～P5/T002、T004、T006、T008、T010～T011 | all producers | phase tests + final | ORACLE-FINAL |
| R-072～089、093、095 / D-009～016 | FR-MINI-001～004 | AC-020、AC-021、AC-022、AC-023、AC-024 | P2/T004；P3/T005～T006 | P2 | mini-task/review/task-close files | ORACLE-MINI-TASK |
| R-020、029～030、048、079、081 / D-012 | FR-LIFECYCLE-001 | AC-025 | P3/T005～T006 | P2 | mini-task/task-close | ORACLE-MINI-TASK |
| R-018、028、063、067、094 / D-004 | FR-GOV-001 | AC-026 | P5/T009～T010 | P1～P4 | catalog/bundles/move-map/docs | ORACLE-GOV-REPLAY |
| R-055～056、061～064、096～097 / D-001～004 | FR-AUDIT-001 | AC-027 | P5/T009～T010 | P1～P4 | historical fixture/test/standard doc | ORACLE-GOV-REPLAY |

## Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| 宪法/术语/ADR | `CONTEXT.md`、`docs/adr/0013-mini-task-compact-delivery-flow.md`、`docs/architecture/move-map.json` | change | T010 | 登记唯一职责/consumer/删除条件 |
| 标准流程 | `docs/standard-workflow.md`、五份 workflow | change | T008、T010 | 文档与真实调用链一致 |
| 技能注册 | `skills/catalog.yaml`、`skills/reuse-registry.md`、bundles | change | T010 | 搬运闭包与来源同步 |
| public runtime | `runtime/interface/runtime-facade.mjs` | no change | T010 | 保持七类 public behavior |
| 历史 runtime | `specs/archive/**` | no change | T010 | 只读，不恢复 scope_revision |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"368817c2910a36e63d3ab4642c30270abdecef15dee7caf8050e778f095919ca","id":"CONSTITUTION","version":"1.5.0","clause_count":21}`
- **F1**：runtime 仅认证/透传，重活留在 portable skill 与 broker。
- **F2**：stage profile、review kind、outcome evidence 和 mini-task runner 都是窄接口。
- **F3**：四材料仍唯一当前真相；publication 结构错误 fail-loud。
- **F4**：finding 不阻止同任务修复；SAME_SOURCE 不冒充异源。
- **F5**：不新增推进 gate；所有检查 report-only。
- **F6**：facts/quality 继续外置，runner 不永久绑定任务。
- **F7**：确认不授权 Git；计划内未授权操作保持 pending/incomplete。
- **F8**：优先复用 validator、packet、workspace、close、monitoring。
- **F9**：缺 step/review/test/物理 Git 事实保持 missing/unavailable/incomplete。
- **F10**：每个新增点均绑定三个历史任务或 mini-task 真实故障，并有删除条件。
- **Q1**：测试、AC、review、真实结果缺失时不报完成，但继续同任务修复。
- **Q2**：材料可工作、publication 结构、完成质量、Git 授权四条边界分离。
- **Q3**：wh-review 维持异源独立；本地定点验证不作质量 verdict。
- **S1**：复用现有和外部成熟交互思路，不造 provider/workspace/close。
- **S2**：外部 grill 思路按 WorkflowHub 四材料和授权边界改造。
- **S3**：记录 grill 最新来源；实现时核对 upstream，不把联网更新变 gate。
- **S4**：skill outcome/cost 进入现有 facts 与 monitoring。
- **S5**：skill packet 可由子代理独立消费，主上下文只收 findings。
- **S6**：Talk/Grill/Clarify 参考已登记成熟来源。
- **S7**：五正式 stage 不变；mini-task 明确是非 stage skill。
- **S8**：所有 skill 以文件 packet/窄 API 工作，不绑单一宿主。

## Phase P1 — 交互与五阶段一致性核心

### Goal

三类交互可一次回答一组独立问题；同一 `spec-analyze` 以五个窄 profile 检查真实语义、累积产物、证据和 handoff，返回当前阶段修复输入及六项摘要。

### Files

- **NEW**：`tests/contract/stage-interaction-batching.test.mjs`、`tests/contract/five-stage-spec-analyze-wiring.test.mjs`
- **MODIFY**：`skills/talk-with-zhipeng/SKILL.md`、`skills/grill-with-docs/SKILL.md`、`skills/spec-clarify/SKILL.md`、`skills/spec-analyze/SKILL.md`、`skills/spec-analyze/packet-lens.md`、`runtime/stage/stage-content-contracts.mjs`、`tests/contract/spec-analyze-completeness.test.mjs`
- **DO NOT TOUCH**：五份 workflow manifests（P4）、review packet builder（P2）。

### Tasks

- `T001：RED 证明批量交互、五 profile、语义证据和当前 stage 闭环当前缺失。`
- `T002：GREEN 以窄合同实现交互和 stage-aware analysis core。`

### Verify

ORACLE-STAGE-CONTRACT — 运行 P1 gate，RED 非零且目标断言失败；GREEN exit 0；证据=`quality/tests/P1-stage-contract.txt`。

### Knowledge

P2/P4 只消费 profile 结果和 evidence refs；不得把 analyzer 变 provider review 或 gate。

### STOP

若 profile 需要第五材料、扫描历史补答案或决定专业质量，回 plan 缩小；出现新产品方向回 make-decision。

### Done

三类 interaction fixture 和五 profile fixture 通过，缺输入/漂移/当前 stage 修复/摘要负例保留。

### Risks and rollback

影响 FR-PREP/INTERACT/TRACE/STAGE/REPAIR/STATUS；风险是万能 analyzer；回滚仅移除 stage extension，保留现有 build-plan validator。

## Phase P2 — wh-review 恢复与 mini-task 审查合同

### Goal

同一 snapshot 最多三次 fresh 异源请求可回放；材料错误不计数、finding 不重试；三次失败后只请求 SAME_SOURCE host fallback；新增两个非 stage mini-task review kind。

### Files

- **NEW**：`skills/wh-review/contracts/mini-task-design.md`、`skills/wh-review/contracts/mini-task-implementation.md`
- **MODIFY**：`skills/wh-review/SKILL.md`、`skills/wh-review/scripts/third-review-host-config.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`runtime/review/stage-materials.json`、`skills/wh-review/stage-skill-plan.json`、`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`tests/contract/review-materials-contract.test.mjs`、`/Users/Hugh/.config/workflowhub/config.json`
- **DO NOT TOUCH**：`review-provider-client.mjs`、3rd-review 私有 runtime、`REVIEW_STAGES` 五阶段集合。

### Tasks

- `T003：RED 锁定 1/2/3 attempts、计数分类、snapshot 漂移、SAME_SOURCE 与两个 packet。`
- `T004：GREEN 扩展单 attempt 原语的外层组合和 trusted mini-task route。`

### Verify

ORACLE-REVIEW-RECOVERY — P2 gate RED 非零、GREEN 0；证据=`quality/tests/P2-review-recovery.txt`。

### Knowledge

P3 使用 design/implementation review kind；P4 workflow 使用 fallback-required fact。恢复编排唯一生产修改点是 `wh-review-cli.mjs:runReviewRecovery`；`review-runner.mjs:runReview` 保持单 attempt。d84d430 的 packet 去重与错误分类必须保留。

### STOP

若实现需要 session continuation、第二 timeout、provider polling/kill、旧 attempt 覆盖或新 stage，停止并回 plan。

### Done

三次独立 attempts、材料拒绝、真实 finding、漂移、fallback 和两类 packet 均有负例/正例；质量继续 truthful incomplete。

### Risks and rollback

影响 FR-REVIEW、FR-MINI-004；回滚 orchestration helper 后仍保留每个 immutable attempt 和 d84d430。

## Phase P3 — mini-task 独立交付与 A 恢复

### Goal

mini-task 用独立 task/worktree/branch、一次形成四材料、两次专用 review、聚焦测试、真实结果和唯一 Git close 完成交付；A 正常 merge 后从原 stage 重跑。

### Files

- **NEW**：`skills/mini-task/SKILL.md`、`skills/mini-task/scripts/mini-task-runner.mjs`、`tests/integration/mini-task-delivery.test.mjs`、`tests/integration/mini-task-a-resume.test.mjs`
- **MODIFY**：`core/task-close.mjs`、`tests/integration/vnext-delivery-close.test.mjs`
- **DO NOT TOUCH**：`runtime/task/workspace.mjs`、task index/database writers、旧 scope_revision/archive runtime。

### Tasks

- `T005：RED 锁定四材料字段、两个 review packet、测试/真实结果、Git 授权、范围扩大和 A merge 失败。`
- `T006：GREEN 实现薄 runner，把 mini-task 测试、两次 review、AC trace 和真实结果归一为现有 verification fact，并复用唯一 task-close executor。`

### Verify

ORACLE-MINI-TASK — P3 gate RED 非零、GREEN 0；证据=`quality/tests/P3-mini-task.txt`。

### Knowledge

P4 只需把 workflow 的 enabling change/fallback 交给 mini-task；不得新建 predecessor/successor/rebind。

### STOP

重大架构/迁移/权限/安全选择、范围明显扩大、计划内 Git 未授权、merge conflict 或测试 unavailable 未处置时暂停并保留事实。

### Done

直接 mini-task、A 阻塞、用户指定复杂范围、取消、same-source、真实 close、A merge/复验/原 stage 重跑全部可回放。

### Risks and rollback

影响 FR-MINI-001～004、FR-LIFECYCLE；回滚 runner 不删除 task/worktree/materials/commits。

## Phase P4 — 五阶段 workflow 与可信 outcome 链

### Goal

五份 workflow 的顺序、交互、profile、review、当前 stage 修复和摘要与实际 handler/outcome/facts/monitoring consumer 一致；中间缺步不被 aggregate 绿色覆盖。

### Files

- **NEW**：N/A — 复用现有 workflow/runtime 测试。
- **MODIFY**：`workflows/make-decision/SKILL.md`、`workflows/make-decision/steps.json`、`workflows/make-decision/skill-deps.yaml`、`workflows/build-spec/SKILL.md`、`workflows/build-spec/steps.json`、`workflows/build-spec/skill-deps.yaml`、`workflows/build-plan/SKILL.md`、`workflows/build-plan/steps.json`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-code/SKILL.md`、`workflows/build-code/steps.json`、`workflows/build-code/skill-deps.yaml`、`workflows/verify-code/SKILL.md`、`workflows/verify-code/steps.json`、`workflows/verify-code/skill-deps.yaml`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-runner.mjs`、`tools/cli/stage-runtime.mjs`、`runtime/evidence/stage-completion-facts.mjs`、`tests/contract/stage-skill-invocation-contract.test.mjs`、`tests/contract/stage-routing-and-concrete-testing.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/stage-completion-facts.test.mjs`、`tests/m15-monitoring-integration.test.mjs`、`tests/m15-monitoring-diagnostics.test.mjs`、`tests/e2e/vnext-five-stage-current.test.mjs`
- **DO NOT TOUCH**：runtime facade、completion predicates、task-store 和 monitoring projector/page。

### Tasks

- `T007：RED 证明五阶段 step/profile/summary 缺失、乱序、stale 和无 evidence 自报会被拒绝。`
- `T008：GREEN 接入 P1/P2/P3 producers，并只透传认证 outcome。`

### Verify

ORACLE-OUTCOME-CHAIN — P4 gate RED 非零、GREEN 0；证据=`quality/tests/P4-outcome-chain.txt`。

### Knowledge

P5 根据实际 manifests 生成标准文档、catalog/bundles 与历史回放，不得用文档反向伪造调用。

### STOP

若需要 runtime 逐 skill 执行、调用方可自报 completed、facts 成 gate 或新增 public command，停止回 plan。

### Done

五阶段标准顺序、step/skill evidence、profile、六项 summary、状态/成本和 E2E 当前事实一致；missing/unknown 负例保留。

### Risks and rollback

影响 FR-STAGE/STEP/EXEC/STATUS/COST；回滚 outcome bridge 后回到保守 missing/unknown，不改变四材料。

## Phase P5 — 治理同步、标准规范与最终回放

### Goal

标准流程文档与真实代码一致，所有 skill bundle/catalog/move-map/config 闭合，三个历史任务故障和全部 AC 在当前 snapshot 一次聚合验证。

### Files

- **NEW**：`skills/mini-task/skill-bundle.json`、`docs/standard-workflow.md`、`tests/contract/workflow-quality-regression.test.mjs`、`tests/fixtures/workflow-quality-cost-sample.json`
- **MODIFY**：`skills/talk-with-zhipeng/skill-bundle.json`、`skills/grill-with-docs/skill-bundle.json`、`skills/spec-clarify/skill-bundle.json`、`skills/spec-analyze/skill-bundle.json`、`skills/wh-review/skill-bundle.json`、`skills/catalog.yaml`、`skills/reuse-registry.md`、`CONTEXT.md`、`docs/adr/0013-mini-task-compact-delivery-flow.md`、`docs/architecture/move-map.json`
- **DO NOT TOUCH**：归档 specs、public runtime facade、任何历史 task evidence。

### Tasks

- `T009：RED 用三个历史任务各自的真实故障，驱动 P1～P4 consumer 的最小回归场景，并锁定来源回放、治理登记、bundle 闭包和标准文档与实现漂移。`
- `T010：GREEN 同步文档/治理/bundles 并修复历史回放。`
- `T011：FINAL 对当前 snapshot 只运行一次 aggregate、逐 AC trace 和 final integration review。`

### Verify

ORACLE-GOV-REPLAY — P5 focused gate 通过；随后 T011 在同一 current snapshot 串接 P1～P5 的五条 focused Vitest gate，再运行一次 `npm run check`；全部 exit 0 才满足 `ORACLE-FINAL`。最后用 `node skills/wh-review/scripts/wh-review-cli.mjs run quality/evidence/T011-final-review-input.json` 审查冻结的 current diff + 四材料 + phase facts，保存 result/report ref；另保存逐 AC trace。

### Knowledge

build-code 只按 tasks 执行；verify-code 读取真实结果，不重跑全部 phase 或补造历史成功。

### STOP

标准文档与 handler 不一致、任一 source/FR/AC/task/oracle 孤立、bundle/hash stale、宪法条款无证据或最终命令不可执行时，回受影响 phase 修复。

### Done

历史故障矩阵、21 条宪法、skill closure/smoke/structure、全部测试、逐 AC、当前异源 review 和大白话交接均有真实事实；unknown/unavailable 仍披露。

### Risks and rollback

影响 FR-GOV/AUDIT/RESULT/COST；文档和 bundle 可按 phase diff 回滚，历史 evidence 不改写。
