# 实现计划：WorkflowHub 机制浪费收敛与运行时自足性

- **Input**：`specs/workflowhub-mechanism-waste-reduction-20260915/decision-log.md`（D-001～D-026，accepted）、`specs/workflowhub-mechanism-waste-reduction-20260915/spec.md`（spec-content.v3，25 FR / 26 AC）
- **Template version**：`plan-task.v4`

## 材料导航

| 章节 / 材料锚点 | 职责与摘要 | M/S/B/P 读取时机 |
| --- | --- | --- |
| `decision-log.md#决定（D-001～D-026）` | 已确认方向、顺序约束（去重替代物先于预算删除；终止原语先于达标契约）与 freeze packet；D-026 要求当前会话直接执行阶段 | M 首读；S 每 Phase 前复读相关 D |
| `decision-log.md#证据矩阵` | 每决定 oracle、期望结果与证据落点 | S 执行 RED/GREEN 前 |
| `spec.md#5 功能需求` | FR-REV/EXT/IDENT/EVID/CLOSE/HANDOFF/SCOPE/METRIC/UI/RUNTIME 产品行为 | M/S 设计时 |
| `spec.md#11 验收标准` | 26 张可证伪 AC 卡 | S 写测试 oracle 时 |
| `plan.md#File Boundary` 与各 Phase | 精确 NEW/MODIFY/DO NOT TOUCH 边界与工程方案 | S 每张任务卡执行前 |
| `tasks.md#Phase P1～P7` | 17 张可执行卡（8 对 RED/GREEN + 1 FINAL） | S 按卡执行；M 聚合 |

## Quick Read

- **Goal**：已记录审查事实不因材料字节变化翻转；评审预算消费删除并以 review_result_ref 去重；外部审查达标即发布初始结论、按 600000ms 严格边界处置迟到结果并披露完备性；写操作只认认证任务工作区；逐条验收证据只有官方一个写入者；当前 WorkflowHub 会话直接发布交互聚合、给出三类缺失诊断、写入阶段行/质量事实并直接运行非门禁 reflection/handoff，不要求外部 Stage Agent、bridge、session 或 stage outcome；未来材料显式不适用；收口含授权远端分支删除、恢复重放、阶段行分离与已知缺口；形成下载文件夹延期交接材料；after 行为全部由确定性 fixture 对照 t3 历史计数证明，不新跑真实任务。
- **Non-goals**：不做 7 组延期（R-013 评审输入切片、R-016 逐条验证记录机制、R-019 同义实现合并、R-021 通用宿主披露 UX、R-024 轻量协议、R-026 计划材料瘦身、R-028/R-029 巨型文件减法；来源：decision-log §非目标 / D-018）；不新增第六阶段、公共入口、第二评审合同或双写（来源：D-019 / R-030）；不做页面、组件、视觉或交互（来源：D-021 non_ui）；外部仓正式验收、commit、push、close 不计入本任务通过（来源：D-006）。
- **Before**：约 8 处把审查有效性绑到材料版本（F-002）；预算按材料版本发放仍在运行且至少两个消费点（V-04）；复用判定比对 material_revision（route 514-576）；verify-code 终局未绑当前快照；来源漂移整轮降级 unavailable（V-08）；外部服务无终止能力、分组只在全终态后产生（F-001）；写身份可被显式参数绕过（V-07）；验收证据存在 4 条竞争写入路径（V-16）；交互聚合无生产发布入口（D-022/F-005）；缺失输入无三类诊断；复盘被错误建模成外部 outcome producer；无 outcome 时成功 handler 被写成 stage-end 失败并触发错误恢复建议（F-006）；handoff 对未来材料留非零失败签名（D-025）。
- **After**：材料/快照变化零翻转、零自动派发；预算消费点为零、ADR-0028 同批修订、review_result_ref 去重先落地；只有 verify-code 终局绑当前快照；漂移单独披露不降级；请求显式携带 minimum_heterologous 且无效阈值响亮失败；成员 completed/failed/cancelled 真实终态；达标即发布不可变初始结论并披露完备性；迟到结果 <600000ms 追加、>=600000ms over_window_unjudged；写前四元身份 fail-loud、bootstrap 一次性事务、harness 迁入工作树；官方处理器成唯一验收证据写入者；run --action=execute 正式发布交互聚合且恰一次；当前会话直接发布阶段事实、stage-end 与非门禁 reflection/handoff，不读取或等待外部 Stage Agent/bridge/session/outcome；三类缺失原因可区分；未来材料 not_applicable 零失败签名；收口摘要登记延期交接固定路径；before/after 全部来自确定性 fixture。
- **Main risk**：删除预算后若去重替代物未先落地会重复派发（RISK-009）；跨仓契约两边消费者需同批对齐（D-008）；写身份强制可能破坏约 15 处测试调用点与 2 个 harness（FND-004）。
- **Next step**：先执行 D-026 的 T018 active-path correction 定向 gate，再回到当前 verify-code；T017 的历史 aggregate 只读保留，不重跑无关全量套件。

## Technical Context

### Global Constraints

- **Verified facts**：基线 commit `c5abe9ef`；认证 worktree 与 branch 见 decision-log 任务身份表；外部仓 `/Users/Hugh/Hugh/Project/3rd-review` HEAD `a96f28b`（独立 Git 仓库）；七类公共入口不变；宪法 22 条不劣化；归档事实只读；t3 计数（26 次尝试、约 12 小时 verify-code、4/10 unavailable、约 3183 秒失败占用）只作历史参照；只跑受影响针对性 vitest，禁止全量回归（AGENTS.md 测试硬规则）。
- **Language / runtime**：Node.js ESM；vitest 定向 contract 测试（--poolOptions.forks.singleFork --no-fileParallelism）；无新依赖。
- **Primary dependencies**：既有 runtime/review、runtime/stage、runtime/task、core/task-close、skills/wh-review；外部仓 lib 原语（仅 P2 实施面 prose 登记）。
- **Storage / state**：四材料权威不变；新证据只写既有 quality/tests、quality/evidence 路径；延期交接材料在仓外固定路径，不进入本仓快照。
- **Testing**：`npx vitest run <targeted files> --poolOptions.forks.singleFork --no-fileParallelism`；RED 期望非零，GREEN/FINAL 期望 0；确定性 fixture 自清理；不触真实 provider 网络。
- **Target environment**：认证 worktree 本地执行；两个真实 harness 迁入工作树内执行。
- **Scale / scope**：30+ 个 MODIFY 文件、8 个 NEW 文件（以 File Boundary 与各 Phase Files 的并集为准），全部在 File Boundary 内；外部仓 6 个文件只在 P2 prose 登记，不进本仓 File Boundary。
- **Unresolved facts**：外部仓正式验收与提交授权（OPEN-006，owner=用户在 build-code/verify-code）；来源范围呈现文案消费者清单（OPEN-007）已由 spec 冻结字段承担，本计划不展开。

## Code Anchors

- **Verified anchors**（全部经当前 HEAD `c5abe9ef` 只读核验）：
  - 审查路线 `runtime/review/review-record-route.mjs`：`evaluateReviewRound`/`validateRouteRepairAttempt`（358-493）、`findReusableReview` 按 material_revision 复用判定（514-576）、`authenticateBudgetContext`/`readLegacyBudgetAttempt`（769-988）、`readCanonicalBudgetHistory`（888-949）、派发前 drift 与 prior-subject 比较（1040-1139）、预算消费点 evaluateReviewRound 调用（1104-1137）、budgetContext 写入记录（1180-1205、1202-1245）、报告体含 budget_context 公开结果 JSON（1371）、`recordSimpleReviewResult` 身份字段校验（1592+）。
  - 预算治理：`docs/adr/0028-plan-slicing-and-review-budget.md` 正式审查预算条款（32-56）与登记验证条款（68-82）；`docs/architecture/control-plane-inventory.json` review-budget-namespace 登记（42-50）。
  - 写入口：`tools/cli/stage-runtime.mjs` `resolveWorkflowHubIdentity`（58-78）、launcher 引导（661-678）、`authenticateStageWriteBoundary` 调用（809-824）、run 输入白名单（969-988）；`tools/cli/task-bootstrap.mjs` 创建事务（72-98）；`tools/host/workflowhub-stage-agent-bridge.mjs` `readInput`（35-40）、`publishCurrentWorkflowHubSessionImpl`（391-453）、`buildRequirementAuthentication`（461-491）、`runBridge`（494-524）；`tools/architecture/public-behavior-baseline.mjs`（48-58、129-140）；`tools/architecture/clean-install.mjs`（130-145、249-252）。
  - 验收/交互：`runtime/stage/stage-handlers.mjs` `validateStageInvocation`（370-525）、`interactionAggregateFacts`（594-711）、`acceptanceCoverageForExecution`/`acceptanceCoverageFacts`（1646-1773）、make-decision 消费链（3485-3551）、build-code handler（3832-3856）、verify-code 聚合（3921-3952）；`runtime/stage/stage-runner.mjs`（920-953、1693-1731、2680-2710、3405-3439、3443-3458）；`runtime/stage/stage-agent-outcome-adapter.mjs`（323-442）；`runtime/task/task-kernel-implementation.mjs` `prepare/completeMakeDecisionInteractionPublication`（602-693、1005-1006）。
  - 收口：`core/task-close.mjs` `closeDelivery`（1456-1555）、worktree 清理判定（2781-2791）、cleanup 恢复重放（3142-3201）、失败恢复 sidecar（3317-3355）、reconciled 完成记录（3361-3377）；`runtime/task/task-store.mjs`（263-291）；`runtime/review/current-close-projection.mjs` `deriveCurrentCloseProjection`（232-258）；`tools/cli/task-close.mjs`（156-186、227-269）。
  - 自足性文档：`workflows/make-decision/SKILL.md`（300-358、383、399-407、429-437）；`docs/operations/claude-e2e-sample.md`（5-65）；`skills/workflowhub-host-protocol/SKILL.md`（66-87）；`skills/stage-handoff/SKILL.md`（21-26）；`workflows/*/skill-deps.yaml`（五份均非四字节占位）。
- **Existing interfaces**：recordSimpleReviewRequest/recordSimpleReviewResult 窄接口；run --action=execute 输入白名单；bridge stdin JSONL + transcript_path 契约；stage-reflection.v2；completion-predicates 缺失输入分支。
- **Read now**：Quick Read、Solution Design、File Boundary。
- **Must read before task**：各任务卡 Knowledge 列出的精确行段。
- **Context mode**：Lite — 任务卡只带所需行段锚点。

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
| --- | --- | --- | --- |
| 审查复用与记录 | extend | `runtime/review/review-record-route.mjs` | 删比较、保留 provenance 字段；删除条件=失效链不得恢复（ADR-0017） |
| 预算机制 | extend | `evaluateReviewBudget` 消费点（route 1104-1137） | 先落地 review_result_ref 去重再删；ADR-0028 同批修订 |
| 终局快照守卫 | extend | verify-code 谓词消费面 | 唯一保留代码身份门槛（D-003） |
| 外部审查合同 | extend | `skills/wh-review/scripts/review-provider-client.mjs` 等三脚本 | 扩展既有请求/状态/结果合同，不另建第二合同（D-008） |
| 写身份 | extend | `resolveWorkflowHubIdentity` + `authenticateStageWriteBoundary` | 复用既有守卫与身份解析（F-003），写口强制 |
| 验收证据 | extend | `acceptanceCoverageFacts` 官方处理器（stage-handlers 1646-1773） | 官方处理器成唯一写入者（D-012）；退休竞争输入 |
| 交互聚合发布 | extend | `completeMakeDecisionInteractionPublication` kernel writer | 复用既有写记录+发布事实能力（D-022），挂 run 白名单 |
| 缺失诊断 | extend | completion-predicates 缺失输入分支 | 三类原因可区分（D-023） |
| 当前会话阶段事实 | narrow | current public `run` + TaskKernel + current identity | 删除 bridge/session/outcome active 前置；旧 outcome 仅历史兼容（D-026） |
| 未来材料 N/A | extend | handoff 声明读取器外层 | 已存在正确空值语义，只补外层零失败签名（D-025） |
| 收口记录 | extend | `core/task-close.mjs` | 远端删除、恢复重放、阶段行分离、已知缺口（D-013～D-017） |
| 延期交接材料 | new | 仓外固定路径 Markdown | 交付物非控制面；删除条件=下一轮立项消费后可由用户移除 |

## Solution Design

### Overview

P1 收口审查有效性：删除 review-record-route 内一切以材料版本/代码快照为输入的有效性比较与预算消费，`material_digest`/`snapshot_tree`/`decision_revision` 保留为 provenance；`review_result_ref` 同轨道去重先落地再删预算；verify-code 终局谓词只接受当前快照审查事实，build-code 集成审查按来源范围陈述；漂移期间已完成成员结果保留并单独披露；ADR-0028 预算条款与 control-plane-inventory 同批修订，review-budget-namespace 测试删除。

P2 扩展跨仓吞吐合同（实施面）：WorkflowHub 侧三脚本在请求中显式携带 `minimum_heterologous` 正整数并消费 member/group/publication 三维度状态；外部仓先补终止/判死原语（心跳死亡复用既有语义、停滞接终态、接通取消），再落达标即发布、完备性披露与 600000ms 严格迟到窗口。外部仓改动不计入本任务通过。

P3 强制写入身份：写命令落盘前校验 task_id、canonical task_path、worktree root、认证工作区四元一致；首次 make-decision 复用既有 bootstrap 事务写一次性身份记录；身份向子进程/子代理传播不可绕过；public-behavior-baseline 与 clean-install 迁入工作树执行。

P4 收口记录：授权后删除远端任务分支并显式披露未删除；通用恢复追加完成事实保留旧失败；阶段行分离命令退出码与阶段判定；长套件按受管理后台执行登记真实终态。

P5 验收证据与运行时发布：官方验收处理器成唯一写入者并区分三种空值；run --action=execute 增加 interaction_aggregate 发布字段由 kernel writer 恰发布一次并由 outline_closed 消费；缺失输入区分 caller_not_provided/provided_but_invalid/host_cannot_provide。

P6 当前会话阶段事实与未来材料：public `run` 直接发布当前事实；reflection/handoff 绑定当前 identity；handoff 对未来材料返回 not_applicable 且外层零失败签名。

P7 收尾：延期交接材料 7 组并在收口摘要登记同一路径；确定性 fixture 对照 t3 历史计数；反思页间接消费者数据兼容断言；FINAL 聚合一次。

### Module responsibilities

#### 审查事实域（P1）

- **Responsibility**：保存来源范围、结果引用、漂移与完备性；不做材料失效。
- **Consumes**：review attempt/result 历史、当前代码快照树。
- **Produces**：不可变审查事实、review_result_ref 去重结果。
- **Must not decide**：质量通过判定（消费方按来源范围陈述）。

#### 外部审查合同域（P2）

- **Responsibility**：请求阈值、解析三维度状态与迟到 supplement。
- **Consumes**：外部服务发布的状态与结果合同。
- **Produces**：WorkflowHub 侧消费事实与注册缺口。
- **Must not decide**：外部仓验收与提交授权（本任务之外）。

#### 任务身份域（P3）

- **Responsibility**：写前确认认证任务工作区四元一致。
- **Consumes**：既有身份解析与 bootstrap 事务。
- **Produces**：写边界放行/响亮失败、一次性引导记录。
- **Must not decide**：只读命令与后续阶段语义。

#### 收口事实域（P4）

- **Responsibility**：不可逆动作记录、恢复事实、阶段行。
- **Consumes**：close 计划、物理读回、执行事实。
- **Produces**：收口摘要、阶段行、缺口清单。
- **Must not decide**：历史失败改写（禁止）。

#### 阶段自足性域（P5/P6）

- **Responsibility**：当前会话直接发布交互聚合、阶段行/质量事实、reflection/handoff 与未来材料 N/A。
- **Consumes**：当前四材料、TaskKernel writer、completion-predicates；旧 bridge 仅在历史兼容读取时消费。
- **Produces**：talk_clarify 事实、当前阶段事实、非门禁 reflection/handoff、not_applicable 语义。
- **Must not decide**：复盘门禁（ADR-0026 保持非门禁）。

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：外部合同扩展 `minimum_heterologous`（正整数）、member_status（running/completed/failed/cancelled）、group_status（running/partial/completed/unavailable/cancelled）、publication_status（not_published/initial_published/late_open/late_closed）；初始结论披露 `published_at_least_sources`、`running_member_count`、`append_window`、`disclosure_text`；验收证据三态 unknown_empty_evidence / zero_review_findings / not_applicable with reason。
- **Data flow / state**：run --action=execute 收 interaction_aggregate 至内容寻址写入 quality/evidence/interactions/<sha256>.json，发布 talk_clarify 质量事实并填 receipts.interaction，再由 outline_closed 消费；外部迟到结果按 arrival_elapsed_ms 严格边界进入 supplement 或 over_window_unjudged。
- **API contract**：N/A — 无新公共命令或 HTTP 面，只扩展现有入口产品输入。
- **UI / external code**：N/A — non_ui；反思页生成器仅作间接消费者由窄兼容断言保护。
- **Fail-loud behavior**：无效 minimum_heterologous、四元身份不一致、手写 interaction receipt 并存、应存在却不可读的材料，全部写前或入口即失败。

## UI Delivery Contract (仅 UI phase/task 使用)

- **UI applicability**：`non_ui` — reason：三来源（原始需求、项目库存、计划变化）均 non_ui（decision-log §UI applicability；D-021）。
- **Component action**：N/A — 无页面、组件、样式或模板改动。
- **Real consumer**：反思页生成器为间接消费者；窄兼容断言见其消费字段保持可读（AC-UI-001）。
- **State owner / Typed ViewModel / CSS/token owner / Fixture / viewport / Browser / Screenshot**：N/A — non_ui。
- **Coverage limits**：不执行浏览器、视觉、a11y 或性能路线。
- **N/A / unknown reason**：non_ui 为 D-021 已记录事实，非 caller 降级。

### Design-gap handoff (不改变 Design.md 权威)

- **design_status**：`not_applicable`（non_ui，无 Design.md 参与）。

## File Boundary

### NEW

- `tests/contract/close-remote-branch-cleanup.test.mjs`
- `tests/contract/no-external-stage-agent-gate.test.mjs`

### MODIFY

- `tests/contract/review-material-change-redispatch.test.mjs`
- `runtime/evidence/freshness.mjs`
- `runtime/review/review-record-route.mjs`
- `tests/contract/review-budget-deletion.test.mjs`
- `docs/adr/0028-plan-slicing-and-review-budget.md`
- `docs/architecture/control-plane-inventory.json`
- `tests/contract/external-threshold-contract.test.mjs`
- `skills/wh-review/scripts/review-provider-client.mjs`
- `skills/wh-review/scripts/simple-review-runner.mjs`
- `skills/wh-review/scripts/third-review-host-config.mjs`
- `tests/contract/external-supplement-window.test.mjs`
- `tests/contract/write-identity-workspace.test.mjs`
- `tools/cli/stage-runtime.mjs`
- `tools/cli/task-close.mjs`
- `tools/cli/task-bootstrap.mjs`
- `tools/host/workflowhub-stage-agent-bridge.mjs`
- `tools/architecture/public-behavior-baseline.mjs`
- `tools/architecture/clean-install.mjs`
- `tests/contract/acceptance-single-writer-empty-values.test.mjs`
- `runtime/stage/stage-handlers.mjs`
- `runtime/stage/stage-runner.mjs`
- `runtime/stage/stage-agent-outcome-adapter.mjs`
- `runtime/task/task-kernel-implementation.mjs`
- `tests/contract/close-remote-branch-cleanup.test.mjs`
- `/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md`
- `core/task-close.mjs`
- `runtime/task/task-store.mjs`
- `runtime/review/current-close-projection.mjs`
- `skills/stage-handoff/SKILL.md`
- `workflows/make-decision/SKILL.md`
- `workflows/make-decision/skill-deps.yaml`
- `workflows/build-spec/skill-deps.yaml`
- `workflows/build-plan/skill-deps.yaml`
- `workflows/verify-code/skill-deps.yaml`
- `docs/operations/claude-e2e-sample.md`
- `skills/workflowhub-host-protocol/SKILL.md`
- `workflows/build-code/capture.mjs`
- `workflows/verify-code/capture.mjs`

- `tests/contract/make-decision-interaction-publication.test.mjs`
- `tests/contract/stage-handoff.test.mjs`
- `tests/contract/build-reflection-page.test.mjs`
- `tests/contract/five-stage-spec-analyze-wiring.test.mjs`
- `tests/contract/review-materials-contract.test.mjs`
- `tests/contract/close-sidecar-and-archive.test.mjs`
### DO NOT TOUCH

- `specs/archive/**` 与历史任务事实 — 只读保留，不回溯重判。
- `runtime/schemas/plan-task-contract.v1.json` — 旧契约只读兼容面。
- 七类公共入口（doctor/status/run/review/verify/confirm/authorize）— 不新增不劣化。
- 外部仓 `/Users/Hugh/Hugh/Project/3rd-review` 文件 — P2 实施面改动，不进本仓 File Boundary，正式收口在本任务之外（D-006）。

## Deletion Proofs

- `tests/contract/review-budget-namespace.test.mjs` 删除证明：P1 T004 完成后生产反向引用中 readCanonicalBudgetHistory 预算 namespace 零消费点（代码检索为零）、ADR-0028 预算条款已修订、control-plane-inventory 登记更新；若仍发现预算消费 consumer，立即 STOP，不用兼容双写过渡。
- 失效链删除证明：route 内 material_revision/snapshot_tree 比较分支删除后，T001/T002 证明材料字节变化零翻转、零自动派发；provenance 字段仍被事实携带。
- 竞争验收证据写入路径退休证明：调用方直提覆盖与宿主猜测覆盖两路径反向引用为零且 fail-closed；官方处理器唯一写入（T501/T502）。
- 不存在删除的项：延期 7 组（不进本计划）、外部仓对象（跨仓实施面）、历史质量事实（只读）— N/A，理由为 D-018/D-006 与 T-003 已冻结。

## Technical Decisions

### DEC-001 — 去重替代物先于预算删除

- **Problem**：直接删预算会失去唯一限流，重复派发风险上升（RISK-009）。
- **Options**：先删预算；先落地 review_result_ref 去重；保留预算改发放单位（已拒，P-D-010 冲突）。
- **Selected**：reuse review_result_ref 同轨道去重；先落地后删预算。
- **Reason**：满足 P-D-010 删除顺序约束与 ADR-0028 替代条件。
- **Consequence / risk**：去重未生效前不删预算；验收含三项可读证据。
- **Fallback**：去重落地失败即 STOP 回 plan，不删预算。
- **F10 disposition**：keep。

### DEC-002 — 失效链全删、字段保留为 provenance

- **Problem**：约 8 处把审查有效性绑到材料版本，返工引擎是预算按材料版本发放。
- **Options**：重设计谱系放宽（拒，重开已确认决定）；删比较保字段。
- **Selected**：extend route 删除比较分支，字段保留为 provenance。
- **Reason**：严格照 P-D-009 字面与 ADR-0017。
- **Consequence / risk**：读者需看来源范围字段（D-004 承担）。
- **Fallback**：回滚 route 单文件，保留四材料。
- **F10 disposition**：keep。

### DEC-003 — 唯一代码身份门槛落在 verify-code 终局

- **Problem**：阶段审查不比快照后，终局无兜底会假绿。
- **Options**：全部比快照（失效链回流）；都不比（假绿）；只 verify-code 例外。
- **Selected**：extend 终局谓词绑当前 snapshot_tree。
- **Reason**：D-003/G-002 两次确认；宪法禁止未覆盖说通过。
- **Consequence / risk**：集成审查声明必须范围化（D-004）。
- **Fallback**：谓词拒绝逻辑保持独立小函数，可单独回滚。
- **F10 disposition**：keep。

### DEC-004 — 跨仓分责：扩展既有合同、不并入口径

- **Problem**：用户要求两仓同改，但任务模型只收口单仓。
- **Options**：拆两任务（用户未选）；只做单仓；同改只收口 workflowhub（用户选定）。
- **Selected**：extend 既有请求/状态/结果合同；外部仓改动登记为实施面与已知缺口。
- **Reason**：D-006 实施面/收口面分离；避免“既在范围又不验收”。
- **Consequence / risk**：外部仓无本任务监督（RISK-006 如实披露）。
- **Fallback**：WorkflowHub 侧 fixture 可独立判定本任务 AC。
- **F10 disposition**：keep。

### DEC-005 — 写身份强制位置在 stage-runtime 写边界

- **Problem**：全命令硬强制破坏约 15 处测试与 2 个 harness，并有引导死锁。
- **Options**：全局默认强制；只读放行+写口强制；不改只登记（拒）。
- **Selected**：extend authenticateStageWriteBoundary 写口强制 + bootstrap 一次性事务 + harness 迁移。
- **Reason**：D-011 窄逃生口；F-003 既有守卫可复用。
- **Consequence / risk**：需同批改测试与两个 harness。
- **Fallback**：守卫开关回退为可选，但验收保持 fail-loud 断言。
- **F10 disposition**：keep。

### DEC-006 — 验收证据复用官方处理器

- **Problem**：4 条竞争写入路径致快照漂移。
- **Options**：新增专用命令/对象（拒，新增控制面）；只加校验不退休（双写保留，拒）。
- **Selected**：extend 官方处理器为唯一写入者，退休两条竞争输入。
- **Reason**：D-012；官方处理器已具备推导全部输入（F-004）。
- **Consequence / risk**：调用方契约同批迁移。
- **Fallback**：旧记录只读保留，不回溯重判。
- **F10 disposition**：keep。

### DEC-007 — 交互聚合挂 run 白名单复用 kernel writer

- **Problem**：completeMakeDecisionInteractionPublication 全仓仅测试调用，生产入口缺失。
- **Options**：调用方继续手写（已实测走偏）；新增专用命令（拒）。
- **Selected**：extend run --action=execute 输入白名单挂既有 writer。
- **Reason**：D-022；与 research_report 钩子对称。
- **Consequence / risk**：需校验不得与手写 receipts.interaction 并存。
- **Fallback**：白名单字段回退，kernel writer 不动。
- **F10 disposition**：keep。

### DEC-008 — 未来材料 N/A 在外层命令收口

- **Problem**：声明读取器已给空值+原因，外层却以 1 退出。
- **Options**：改历史失败事实（拒，破坏 provenance）；外层区分时序语义。
- **Selected**：extend handoff 外层命令区分“未来材料”与“应存在不可读”。
- **Reason**：D-025；正常时序不记失败。
- **Consequence / risk**：需精确材料类别清单，避免把真失败漂成 N/A。
- **Fallback**：按类别清单回滚外层分支。
- **F10 disposition**：keep。

## Test Strategy

设计 RED/GREEN，不在 build-plan 执行命令；两者使用同一 `gate_cmd` 和 oracle identity；`gate_cmd` 只是测试命令，不是工作许可证。

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
| --- | --- | --- | --- | --- |
| FR-REV-001 / AC-REV-001 | T001 | RED | `npx vitest run tests/contract/review-material-change-redispatch.test.mjs` / `1` | ORACLE-REV-VALIDITY — target assertion fails: fact flips or dispatch count increases；`apply/evidence/T001.stdout` |
| FR-REV-001 / AC-REV-001 | T002 | GREEN | `同一命令` / `0` | ORACLE-REV-VALIDITY — same assertion passes with no stale/expired or redispatch；`apply/evidence/T002.stdout` |
| FR-REV-002 / AC-REV-002 | T003 | RED | `npx vitest run tests/contract/review-budget-deletion.test.mjs` / `1` | ORACLE-BUDGET-ZERO — target assertion fails: budget consumer exists or retry blocked；`apply/evidence/T003.stdout` |
| FR-REV-002 / AC-REV-002 | T004 | GREEN | `同一命令` / `0` | ORACLE-BUDGET-ZERO — same assertion passes; explicit retry once; ADR same-batch revised；`apply/evidence/T004.stdout` |
| FR-EXT-001, FR-EXT-002, FR-EXT-003 / AC-EXT-001, AC-EXT-002, AC-EXT-003 | T005 | RED | `npx vitest run tests/contract/external-threshold-contract.test.mjs` / `1` | ORACLE-THRESHOLD-REQUEST — target assertion fails: missing/invalid threshold or wrong member state；`apply/evidence/T005.stdout` |
| FR-EXT-001, FR-EXT-002, FR-EXT-003 / AC-EXT-001, AC-EXT-002, AC-EXT-003 | T006 | GREEN | `同一命令` / `0` | ORACLE-THRESHOLD-REQUEST — same assertion passes; running remains running; initial publishes once；`apply/evidence/T006.stdout` |
| FR-EXT-004, FR-EXT-005 / AC-EXT-004, AC-EXT-005, AC-EXT-006 | T007 | RED | `npx vitest run tests/contract/external-supplement-window.test.mjs` / `1` | ORACLE-SUPPLEMENT-WINDOW — target assertion fails at boundary or immutability；`apply/evidence/T007.stdout` |
| FR-EXT-004, FR-EXT-005 / AC-EXT-004, AC-EXT-005, AC-EXT-006 | T008 | GREEN | `同一命令` / `0` | ORACLE-SUPPLEMENT-WINDOW — same assertion passes at 599999/600000 boundary；`apply/evidence/T008.stdout` |
| FR-IDENT-001 / AC-IDENT-001 | T009 | RED | `npx vitest run tests/contract/write-identity-workspace.test.mjs` / `1` | ORACLE-WRITE-IDENTITY — target assertion fails: bytes land before identity check；`apply/evidence/T009.stdout` |
| FR-IDENT-001 / AC-IDENT-001 | T010 | GREEN | `同一命令` / `0` | ORACLE-WRITE-IDENTITY — same assertion passes; child bypass rejected；`apply/evidence/T010.stdout` |
| FR-EVID-001 / AC-EVID-001 | T011 | RED | `npx vitest run tests/contract/acceptance-single-writer-empty-values.test.mjs` / `1` | ORACLE-ACCEPTANCE-SINGLE-WRITER — target assertion fails on competitor write or missing outline_closed；`apply/evidence/T011.stdout` |
| FR-EVID-001 / AC-EVID-001 | T012 | GREEN | `同一命令` / `0` | ORACLE-ACCEPTANCE-SINGLE-WRITER — same assertion passes; no second writer；`apply/evidence/T012.stdout` |
| FR-CLOSE-001, FR-CLOSE-004, FR-CLOSE-005 / AC-CLOSE-001, AC-CLOSE-004, AC-CLOSE-005 | T013 | RED | `npx vitest run tests/contract/close-remote-branch-cleanup.test.mjs` / `1` | ORACLE-REMOTE-CLEANUP — target assertion fails on unauthorized delete or gap omission；`apply/evidence/T013.stdout` |
| FR-CLOSE-001, FR-CLOSE-004, FR-CLOSE-005 / AC-CLOSE-001, AC-CLOSE-004, AC-CLOSE-005 | T014 | GREEN | `同一命令` / `0` | ORACLE-REMOTE-CLEANUP — same assertion passes; recovery/new facts preserved；`apply/evidence/T014.stdout` |
| FR-RUNTIME-001, FR-RUNTIME-002, FR-RUNTIME-003, FR-RUNTIME-004, FR-HANDOFF-001, FR-UI-001 / AC-RUNTIME-001, AC-RUNTIME-002, AC-RUNTIME-003, AC-RUNTIME-004, AC-HANDOFF-001, AC-UI-001 | T015 | RED | `npx vitest run tests/contract/make-decision-interaction-publication.test.mjs tests/contract/stage-handoff.test.mjs tests/contract/build-reflection-page.test.mjs` / `1` | ORACLE-RUNTIME-HANDOFF — target assertion fails on publish/diagnosis/N/A/reflection；`apply/evidence/T015.stdout` |
| FR-RUNTIME-001, FR-RUNTIME-002, FR-RUNTIME-003, FR-RUNTIME-004, FR-HANDOFF-001, FR-UI-001 / AC-RUNTIME-001, AC-RUNTIME-002, AC-RUNTIME-003, AC-RUNTIME-004, AC-HANDOFF-001, AC-UI-001 | T016 | GREEN | `同一命令` / `0` | ORACLE-RUNTIME-HANDOFF — same assertion passes; unknown/unavailable/N/A semantics preserved；`apply/evidence/T016.stdout` |
| FR-SCOPE-001, FR-METRIC-001, FR-REV-003, FR-REV-004, FR-REV-005, FR-CLOSE-002, FR-CLOSE-003 / AC-SCOPE-001, AC-METRIC-001, AC-REV-003, AC-REV-004, AC-REV-005, AC-CLOSE-002, AC-CLOSE-003 | T017 | FINAL | `npx vitest run tests/contract/review-material-change-redispatch.test.mjs tests/contract/review-budget-deletion.test.mjs tests/contract/external-threshold-contract.test.mjs tests/contract/external-supplement-window.test.mjs tests/contract/write-identity-workspace.test.mjs tests/contract/acceptance-single-writer-empty-values.test.mjs tests/contract/close-remote-branch-cleanup.test.mjs tests/contract/make-decision-interaction-publication.test.mjs tests/contract/stage-handoff.test.mjs tests/contract/build-reflection-page.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/review-materials-contract.test.mjs tests/contract/close-sidecar-and-archive.test.mjs` / `0` | ORACLE-FINAL — all applicable AC and seams verified；`apply/evidence/T017.stdout` |

## Rollback and Recovery

- **Global recovery rule**：只回滚当前 Phase 的实现文件改动，保留四份材料、既有质量事实与历史证据；测试 fixture 自清理；不回溯重判旧事实。
- **Irreversible boundaries**：远端分支删除、commit、push、merge、archive、cleanup 与外部仓提交推送均需独立人工授权，本计划不执行。
- **Recovery owner**：build-code owner 按任务卡 recovery 字段回受影响 GREEN；外部仓改动由对应 repo owner 回滚；plan/tasks owner 处理材料级 STOP。

### Engineering Risk Handoff

- **PLAN-RISK-001**：去重替代物未先落地导致重复派发。
  - **Affected IDs**：R-025 / D-002 / FR-REV-002 / AC-REV-002 / T003-T004。
  - **Trigger**：review_result_ref 去重未生效即删除预算。
  - **Consequence**：重复对外调用与 token 浪费回升。
  - **Mitigation or STOP**：T003 RED 先证明去重生效再允许 T004 删预算；去重失败即 STOP。
  - **Handling Stage**：build-code。
  - **Verification**：ORACLE-REV-002 三项证据（去重生效、预算零消费、ADR 修订）。
- **PLAN-RISK-002**：跨仓契约两边不同批对齐。
  - **Affected IDs**：D-006～D-010 / FR-EXT-001～005 / AC-EXT-001～006 / T201-T208。
  - **Trigger**：WorkflowHub 侧消费与外部仓发布版本漂移。
  - **Consequence**：状态解析错误或误报达标。
  - **Mitigation or STOP**：P2 内 workflowhub 侧 fixture 独立判定；外部状态读回单独披露，不计 pass。
  - **Handling Stage**：build-code。
  - **Verification**：ORACLE-EXT-001/003/004 合同快照。

## Implementation Order

P1 → P2 → P3 → P4 → P5 → P6 → P7；每个行为变化先 RED 后 GREEN；T017 FINAL 最后执行一次。P3/P4 先完成成员终止语义，再落 threshold/partial/supplement；P5/P6 可与 P3/P4 并行但需文件所有权隔离；P7 最后。


## Dependencies and Parallelism

- **Dependencies**：T001 → T002；T003 → T004；T005 → T006；T007 → T008；T009 → T010；T011 → T012；T013 → T014；T015 → T016；T002,T004,T006,T008,T010,T012,T014,T016 → T017。
- **Parallel work**：不同 Phase 的 RED 任务可在文件边界不重叠时并行；同一 RED/GREEN 对必须串行；T017 FINAL 最后执行且只执行一次。
- **External dependencies**：外部仓正式验收、commit、push、close 不在本任务；absence semantics=unknown/outside pass。


## Requirement and Verification Traceability

| Source / decision | FR | AC | Phase / Task | Depends on | Exact files | Command / oracle |
| --- | --- | --- | --- | --- | --- | --- |
|  | FR-REV-001 | AC-REV-001 | PP1 — Review source scope / validity freeze / T001 | N/A — first task | `tests/contract/review-material-change-redispatch.test.mjs` | `npx vitest run tests/contract/review-material-change-redispatch.test.mjs` / ORACLE-REV-VALIDITY — target assertion fails: fact flips or dispatch count increases |
|  | FR-REV-001 | AC-REV-001 | PP1 — Review source scope / validity freeze / T002 | T001 | `runtime/evidence/freshness.mjs` `runtime/review/review-record-route.mjs` `tests/contract/review-material-change-redispatch.test.mjs` | `npx vitest run tests/contract/review-material-change-redispatch.test.mjs` / ORACLE-REV-VALIDITY — same assertion passes with no stale/expired or redispatch |
|  | FR-REV-002 | AC-REV-002 | PP2 — Delete review budget machinery / T003 | N/A — independent RED after stable dedupe design | `tests/contract/review-budget-deletion.test.mjs` | `npx vitest run tests/contract/review-budget-deletion.test.mjs` / ORACLE-BUDGET-ZERO — target assertion fails: budget consumer exists or retry blocked |
|  | FR-REV-002 | AC-REV-002 | PP2 — Delete review budget machinery / T004 | T003 | `runtime/review/review-record-route.mjs` `docs/adr/0028-plan-slicing-and-review-budget.md` `docs/architecture/control-plane-inventory.json` ` | `npx vitest run tests/contract/review-budget-deletion.test.mjs` / ORACLE-BUDGET-ZERO — same assertion passes; explicit retry once; ADR same-batch revised |
|  | FR-EXT-001, FR-EXT-002, FR-EXT-003 | AC-EXT-001, AC-EXT-002, AC-EXT-003 | PP3 — External member termination semantics / T005 | N/A — independent RED | `tests/contract/external-threshold-contract.test.mjs` | `npx vitest run tests/contract/external-threshold-contract.test.mjs` / ORACLE-THRESHOLD-REQUEST — target assertion fails: missing/invalid threshold or wrong member state |
|  | FR-EXT-001, FR-EXT-002, FR-EXT-003 | AC-EXT-001, AC-EXT-002, AC-EXT-003 | PP3 — External member termination semantics / T006 | T005 | `skills/wh-review/scripts/review-provider-client.mjs` `skills/wh-review/scripts/simple-review-runner.mjs` `skills/wh-review/scripts/third-review-host-config.mjs` | `npx vitest run tests/contract/external-threshold-contract.test.mjs` / ORACLE-THRESHOLD-REQUEST — same assertion passes; running remains running; initial publishes once |
|  | FR-EXT-004, FR-EXT-005 | AC-EXT-004, AC-EXT-005, AC-EXT-006 | PP4 — Early publish / late supplement contract / T007 | N/A — independent RED | `tests/contract/external-supplement-window.test.mjs` | `npx vitest run tests/contract/external-supplement-window.test.mjs` / ORACLE-SUPPLEMENT-WINDOW — target assertion fails at boundary or immutability |
|  | FR-EXT-004, FR-EXT-005 | AC-EXT-004, AC-EXT-005, AC-EXT-006 | PP4 — Early publish / late supplement contract / T008 | T007 | `skills/wh-review/scripts/review-provider-client.mjs` `skills/wh-review/scripts/simple-review-runner.mjs` | `npx vitest run tests/contract/external-supplement-window.test.mjs` / ORACLE-SUPPLEMENT-WINDOW — same assertion passes at 599999/600000 boundary |
|  | FR-IDENT-001 | AC-IDENT-001 | PP5 — Write identity before formal writes / T009 | N/A — independent RED | `tests/contract/write-identity-workspace.test.mjs` | `npx vitest run tests/contract/write-identity-workspace.test.mjs` / ORACLE-WRITE-IDENTITY — target assertion fails: bytes land before identity check |
|  | FR-IDENT-001 | AC-IDENT-001 | PP5 — Write identity before formal writes / T010 | T009 | `tools/cli/stage-runtime.mjs` `tools/cli/task-close.mjs` `tools/cli/task-bootstrap.mjs` `tools/host/workflowhub-stage-agent-bridge.mjs` `tools/architecture/public-behavior-baseline.mjs` `tools/architecture/clean-install.mjs` | `npx vitest run tests/contract/write-identity-workspace.test.mjs` / ORACLE-WRITE-IDENTITY — same assertion passes; child bypass rejected |
|  | FR-EVID-001 | AC-EVID-001 | PP6 — Acceptance single writer / interaction publication / T011 | N/A — independent RED | `tests/contract/acceptance-single-writer-empty-values.test.mjs` | `npx vitest run tests/contract/acceptance-single-writer-empty-values.test.mjs` / ORACLE-ACCEPTANCE-SINGLE-WRITER — target assertion fails on competitor write or missing outline_closed |
|  | FR-EVID-001 | AC-EVID-001 | PP6 — Acceptance single writer / interaction publication / T012 | T011 | `runtime/stage/stage-handlers.mjs` `runtime/stage/stage-runner.mjs` `runtime/stage/stage-agent-outcome-adapter.mjs` `runtime/task/task-kernel-implementation.mjs` | `npx vitest run tests/contract/acceptance-single-writer-empty-values.test.mjs` / ORACLE-ACCEPTANCE-SINGLE-WRITER — same assertion passes; no second writer |
| ALL R-001~R-037；D-001~D-025 | FR-CLOSE-001, FR-CLOSE-004, FR-CLOSE-005 | AC-CLOSE-001, AC-CLOSE-004, AC-CLOSE-005 | PP7 — Close / handoff / runtime ergonomics / non-UI / final aggregate / T013 | N/A — independent RED | `tests/contract/close-remote-branch-cleanup.test.mjs` | `npx vitest run tests/contract/close-remote-branch-cleanup.test.mjs` / ORACLE-REMOTE-CLEANUP — target assertion fails on unauthorized delete or gap omission |
| ALL R-001~R-037；D-001~D-025 | FR-CLOSE-001, FR-CLOSE-004, FR-CLOSE-005 | AC-CLOSE-001, AC-CLOSE-004, AC-CLOSE-005 | PP7 — Close / handoff / runtime ergonomics / non-UI / final aggregate / T014 | T013 | `core/task-close.mjs` `runtime/task/task-store.mjs` `runtime/review/current-close-projection.mjs` | `npx vitest run tests/contract/close-remote-branch-cleanup.test.mjs` / ORACLE-REMOTE-CLEANUP — same assertion passes; recovery/new facts preserved |
|  | FR-RUNTIME-001, FR-RUNTIME-002, FR-RUNTIME-003, FR-RUNTIME-004, FR-HANDOFF-001, FR-UI-001 | AC-RUNTIME-001, AC-RUNTIME-002, AC-RUNTIME-003, AC-RUNTIME-004, AC-HANDOFF-001, AC-UI-001 | PP7 — Close / handoff / runtime ergonomics / non-UI / final aggregate / T015 | N/A — independent RED | `tests/contract/make-decision-interaction-publication.test.mjs` `tests/contract/stage-handoff.test.mjs` `tests/contract/build-reflection-page.test.mjs` `tests/contract/review-material-change-redispatch.test.mjs` `tests/contract/review-budget-deletion.test.mjs` `tests/contract/external-threshold-contract.test.mjs` `tests/contract/external-supplement-window.test.mjs` `tests/contract/write-identity-workspace.test.mjs` `tests/contract/acceptance-single-writer-empty-values.test.mjs` | `npx vitest run tests/contract/make-decision-interaction-publication.test.mjs tests/contract/stage-handoff.test.mjs tests/contract/build-reflection-page.test.mjs` / ORACLE-RUNTIME-HANDOFF — target assertion fails on publish/diagnosis/N/A/reflection |
| ALL R-001~R-037；D-001~D-025 | FR-RUNTIME-001, FR-RUNTIME-002, FR-RUNTIME-003, FR-RUNTIME-004, FR-HANDOFF-001, FR-UI-001 | AC-RUNTIME-001, AC-RUNTIME-002, AC-RUNTIME-003, AC-RUNTIME-004, AC-HANDOFF-001, AC-UI-001 | PP7 — Close / handoff / runtime ergonomics / non-UI / final aggregate / T016 | T015 | `runtime/task/task-kernel-implementation.mjs` `runtime/stage/stage-handlers.mjs` `tools/cli/stage-runtime.mjs` `tools/host/workflowhub-local-stage-runner.mjs` `skills/stage-handoff/SKILL.md` `workflows/make-decision/SKILL.md` `workflows/make-decision/skill-deps.yaml` `workflows/build-spec/skill-deps.yaml` `workflows/build-plan/skill-deps.yaml` `workflows/verify-code/skill-deps.yaml` `docs/operations/claude-e2e-sample.md` `skills/workflowhub-host-protocol/SKILL.md` `workflows/build-code/capture.mjs` `workflows/verify-code/capture.mjs` `tests/contract/build-reflection-page.test.mjs` `tests/contract/make-decision-interaction-publication.test.mjs` `tests/contract/stage-handoff.test.mjs` `/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md` | `npx vitest run tests/contract/make-decision-interaction-publication.test.mjs tests/contract/stage-handoff.test.mjs tests/contract/build-reflection-page.test.mjs` / ORACLE-RUNTIME-HANDOFF — same assertion passes; unknown/unavailable/N/A semantics preserved |
| ALL R-001~R-037；D-001~D-025 | FR-SCOPE-001, FR-METRIC-001, FR-REV-003, FR-REV-004, FR-REV-005, FR-CLOSE-002, FR-CLOSE-003 | AC-SCOPE-001, AC-METRIC-001, AC-REV-003, AC-REV-004, AC-REV-005, AC-CLOSE-002, AC-CLOSE-003 | PP7 — Close / handoff / runtime ergonomics / non-UI / final aggregate / T017 | T002,T004,T006,T008,T010,T012,T014,T016 | `tests/contract/review-materials-contract.test.mjs` `tests/contract/close-sidecar-and-archive.test.mjs` `tests/contract/close-remote-branch-cleanup.test.mjs` `core/task-close.mjs` `runtime/task/task-store.mjs` `runtime/review/current-close-projection.mjs` `tests/contract/make-decision-interaction-publication.test.mjs` `tests/contract/stage-handoff.test.mjs` `tests/contract/build-reflection-page.test.mjs` `tests/contract/five-stage-spec-analyze-wiring.test.mjs` `tests/contract/review-materials-contract.test.mjs` `tests/contract/close-sidecar-and-archive.test.mjs` `tests/contract/review-material-change-redispatch.test.mjs` `tests/contract/review-budget-deletion.test.mjs` `tests/contract/external-threshold-contract.test.mjs` `tests/contract/external-supplement-window.test.mjs` `tests/contract/write-identity-workspace.test.mjs` `tests/contract/acceptance-single-writer-empty-values.test.mjs` | `npx vitest run tests/contract/review-material-change-redispatch.test.mjs tests/contract/review-budget-deletion.test.mjs tests/contract/external-threshold-contract.test.mjs tests/contract/external-supplement-window.test.mjs tests/contract/write-identity-workspace.test.mjs tests/contract/acceptance-single-writer-empty-values.test.mjs tests/contract/close-remote-branch-cleanup.test.mjs tests/contract/make-decision-interaction-publication.test.mjs tests/contract/stage-handoff.test.mjs tests/contract/build-reflection-page.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/review-materials-contract.test.mjs tests/contract/close-sidecar-and-archive.test.mjs` / ORACLE-FINAL — all applicable AC and seams verified |
| R-038；D-026 | FR-RUNTIME-003 | AC-RUNTIME-003 | Post-P7 corrective path / T018 | T017 historical aggregate | `runtime/stage/stage-runner.mjs` `runtime/stage/stage-reflect.mjs` `runtime/stage/stage-handoff.mjs` `workflows/*/steps.json` `workflows/*/skill-deps.yaml` `tests/contract/no-external-stage-agent-gate.test.mjs` `tests/contract/stage-runner-reflection.test.mjs` | `npx vitest run tests/contract/no-external-stage-agent-gate.test.mjs tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/workflow-quality-regression.test.mjs tests/contract/stage-runner-reflection.test.mjs tests/contract/stage-handoff.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / 无 outcome 时 `stage_end_recorded`/exit 0；current session 直接绑定 reflection/handoff；质量缺口不作 gate |

## Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| 技能 | `workflows/make-decision/SKILL.md`, `skills/workflowhub-host-protocol/SKILL.md`, `skills/stage-handoff/SKILL.md`, `workflows/*/skill-deps.yaml` | change | T503-T510, T018 | D-022～D-026 文档化当前会话正式路径；skill-deps 不再声明 stage outcome |
| 测试 | `tests/contract/**` 24 新文件；`tests/contract/review-budget-namespace.test.mjs` | change | 全部 | 定向 RED/GREEN；预算 namespace 测试随机制删除 |
| 文档 | `docs/adr/0028-plan-slicing-and-review-budget.md`, `docs/architecture/control-plane-inventory.json`, `docs/operations/claude-e2e-sample.md` | change | T003/T004, T405/T406, T507/T508 | ADR-0028 同批修订；登记更新；本地路径样例 |
| 运行时 | `runtime/review/review-record-route.mjs`, `runtime/stage/*`, `runtime/task/*` | change | P1-P6 | 行为收口 |
| 宪法 | `CONSTITUTION.md`, `constitution-checklist.md` | no change | none | 22 条不劣化 |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"91c72a0db7a77da84369d0aada56105612c21def13761f6aa7db387b8922f434","id":"CONSTITUTION","version":"1.9.0","clause_count":22}`
- **F1**：runtime 只做调度/投影，能力收口到 review route、stage handlers、close 等既有 owner。
- **F2**：窄接口接缝：recordSimpleReviewRequest/Result、run 白名单、bridge stdin、close 投影。
- **F3**：四材料为唯一工作真相；本计划只细化 plan/tasks。
- **F4**：每 Phase 一次独立 review 由 build-plan review 适配器产生，findings 不锁死同任务修复。
- **F5**：只跑受影响定向测试；无全量回归；slice 恒定可复算。
- **F6**：测试证据写既有 quality/tests、quality/evidence 底座。
- **F7**：build-plan 用户确认与 build-code 实现、不可逆授权分离。
- **F8**：reuse→extend 优先；唯一 writer 保留；不新增第二控制面/双写。
- **F9**：RED/GREEN 负例可证伪；unknown/unavailable/incomplete 不漂白为通过。
- **F10**：只扩展现有测试/validator；ADR-0028 修订非运行时自动化；无新机制面（DEC 均为 extend/reuse）。
- **F11**：review/test/evidence 为事实非许可证；FINAL 不新增权威。
- **Q1**：缺失/unavailable 可继续同任务修复，不得报完成。
- **Q2**：推进、发布、完成事实分离；gate_cmd 不是工作许可证。
- **Q3**：Phase review 独立上下文；结构 validator 不冒充质量裁决。
- **S1**：复用 Vitest、既有 kernel writer、bridge、close 投影。
- **S2**：技能保持可搬运；文档改动限于既有 SKILL.md 路径。
- **S3**：无外部 skill 升级；外部仓仅实施面改动。
- **S4**：profile/性能指标由 D-020 确定性 fixture 进入统一 evidence。
- **S5**：重扫描与 review 可派子代理；主会话只收摘要。
- **S6**：复用现有 backend-testing 实践；无新测试框架。
- **S7**：不新增 stage/workflow；七 Phase 是 build-code 内实现阶段。
- **S8**：bridge/脚本保持文件输入/JSON 输出，无宿主隐式依赖。

## Phase P1 — Review source scope / validity freeze

### Goal

材料变化不再翻转已记录审查，验证范围按来源读取。

### Files

- **NEW**：`tests/contract/review-material-change-redispatch.test.mjs`
- **MODIFY**：`runtime/evidence/freshness.mjs`
- **MODIFY**：`runtime/review/review-record-route.mjs`
- **DO NOT TOUCH**：`specs/workflowhub-mechanism-waste-reduction-20260915/spec.md` — material authority

### Tasks

#### T001 — RED：material change does not redispatch
- **ID**：T001
- **Phase**：Phase P1 — Review source scope / validity freeze
- **goal**：Material-byte-only change leaves fact status/source refs unchanged and dispatch count zero.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：N/A — first task
- **并行**：否 — paired RED/GREEN
- **FR**：FR-REV-001
- **AC**：AC-REV-001
- **动作**：Add failing test that mutates material bytes under fixed code snapshot and asserts no stale/expired or redispatch.
- **精确文件**：`tests/contract/review-material-change-redispatch.test.mjs`
- **boundary**：files: `tests/contract/review-material-change-redispatch.test.mjs`; symbols/regions: only declared symbols
- **输出**：RED evidence with target assertion failing
- **Knowledge**：freshness key currently uses material version and route rejects reuse
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`npx vitest run tests/contract/review-material-change-redispatch.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-REV-VALIDITY — target assertion fails: fact flips or dispatch count increases
- **evidence_path**：apply/evidence/T001.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：False RED due to fixture setup
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — not started
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started

#### T002 — GREEN：material change does not redispatch
- **ID**：T002
- **Phase**：Phase P1 — Review source scope / validity freeze
- **goal**：Make T001 pass with minimal freshness/route change.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：T001
- **并行**：否 — paired RED/GREEN
- **FR**：FR-REV-001
- **AC**：AC-REV-001
- **动作**：Change freshness/route to preserve recorded fact for same code snapshot and source scope.
- **精确文件**：`runtime/evidence/freshness.mjs` `runtime/review/review-record-route.mjs` `tests/contract/review-material-change-redispatch.test.mjs`
- **boundary**：files: `runtime/evidence/freshness.mjs` `runtime/review/review-record-route.mjs`; symbols/regions: only declared symbols
- **输出**：GREEN evidence; negative stale/expired case remains impossible
- **Knowledge**：Same oracle as T001
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`npx vitest run tests/contract/review-material-change-redispatch.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-REV-VALIDITY — same assertion passes with no stale/expired or redispatch
- **evidence_path**：apply/evidence/T002.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：Overbroad key hides real code-snapshot review
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — not started
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started


### Verify

`npx vitest run tests/contract/review-material-change-redispatch.test.mjs
- `exit 0; ORACLE-REV-VALIDITY。

### Knowledge

Source-scope key must preserve old fact provenance。

### STOP

If fixture cannot create deterministic material change without live task`
- `return spec.md#D-020。

### Done

AC-REV-001/003/004/005 covered by T002。

### Risks and rollback

Risk: stale key migration；rollback freshness key only。

## Phase P2 — Delete review budget machinery

### Goal

预算消费行为为零；显式重试创建一次新尝试。

### Files

- **NEW**：`tests/contract/review-budget-deletion.test.mjs`
- **MODIFY**：`runtime/review/review-record-route.mjs`
- **MODIFY**：`docs/adr/0028-plan-slicing-and-review-budget.md`
- **MODIFY**：`docs/architecture/control-plane-inventory.json`
- **DO NOT TOUCH**：`docs/adr/0028-plan-slicing-and-review-budget.md` — history sections

### Tasks

#### T003 — RED：budget consumer zero and explicit retry once
- **ID**：T003
- **Phase**：Phase P2 — Delete review budget machinery
- **goal**：Budget machinery exists and blocks explicit retry.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：N/A — independent RED after stable dedupe design
- **并行**：否 — paired RED/GREEN
- **FR**：FR-REV-002
- **AC**：AC-REV-002
- **动作**：Add failing test asserting no budget consumers and one new attempt only for explicit retry.
- **精确文件**：`tests/contract/review-budget-deletion.test.mjs`
- **boundary**：files: `tests/contract/review-budget-deletion.test.mjs`; symbols/regions: only declared symbols
- **输出**：RED evidence with budget consumer present
- **Knowledge**：evaluateReviewRound and ADR budget clauses still exist
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`npx vitest run tests/contract/review-budget-deletion.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-BUDGET-ZERO — target assertion fails: budget consumer exists or retry blocked
- **evidence_path**：apply/evidence/T003.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：False RED from stale governance docs
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — not started
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started

#### T004 — GREEN：budget consumer zero and explicit retry once
- **ID**：T004
- **Phase**：Phase P2 — Delete review budget machinery
- **goal**：Make T003 pass by deleting budget machinery after stable dedupe.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：T003
- **并行**：否 — paired RED/GREEN
- **FR**：FR-REV-002
- **AC**：AC-REV-002
- **动作**：Remove evaluateReviewRound call/blocks, revise ADR-0028 and inventory, keep review_result_ref dedupe.
- **精确文件**：`runtime/review/review-record-route.mjs` `docs/adr/0028-plan-slicing-and-review-budget.md` `docs/architecture/control-plane-inventory.json` `
- **boundary**：files: `runtime/review/review-record-route.mjs` `docs/adr/0028-plan-slicing-and-review-budget.md` `docs/architecture/control-plane-inventory.json`; symbols/regions: only declared symbols
- **输出**：GREEN evidence; budget grep zero; ADR diff readable
- **Knowledge**：Same oracle as T003
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`npx vitest run tests/contract/review-budget-deletion.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-BUDGET-ZERO — same assertion passes; explicit retry once; ADR same-batch revised
- **evidence_path**：apply/evidence/T004.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：Deleting budget before stable dedupe causes duplicate dispatch
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — not started
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started


### Verify

`npx vitest run tests/contract/review-budget-deletion.test.mjs
- `exit 0; ORACLE-BUDGET-ZERO。

### Knowledge

Dedupe must be stable before budget deletion。

### STOP

If repeated dispatch remains after dedupe`
- `return plan.md#DEC-002。

### Done

AC-REV-002 and ADR-0028 same-batch revision covered。

### Risks and rollback

Risk: governance docs left requiring budget；verify ADR diff。

## Phase P3 — External member termination semantics

### Goal

心跳死亡、真实停滞、显式取消进入成员终态；长时间运行保持 running。

### Files

- **NEW**：`tests/contract/external-threshold-contract.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/review-provider-client.mjs`
- **MODIFY**：`skills/wh-review/scripts/simple-review-runner.mjs`
- **MODIFY**：`skills/wh-review/scripts/third-review-host-config.mjs`
- **DO NOT TOUCH**：external repo formal acceptance files

### Tasks

#### T005 — RED：threshold request and member terminal states
- **ID**：T005
- **Phase**：Phase P3 — External member termination semantics
- **goal**：Request omits minimum_heterologous and member terminal states are not consumed.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：N/A — independent RED
- **并行**：否 — paired RED/GREEN
- **FR**：FR-EXT-001, FR-EXT-002, FR-EXT-003
- **AC**：AC-EXT-001, AC-EXT-002, AC-EXT-003
- **动作**：Add failing contract fixture asserting request threshold validation and member status semantics.
- **精确文件**：`tests/contract/external-threshold-contract.test.mjs`
- **boundary**：files: `tests/contract/external-threshold-contract.test.mjs`; symbols/regions: only declared symbols
- **输出**：RED evidence: invalid threshold accepted or running conflated with failed
- **Knowledge**：review-provider-client request validator omits threshold
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`npx vitest run tests/contract/external-threshold-contract.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-THRESHOLD-REQUEST — target assertion fails: missing/invalid threshold or wrong member state
- **evidence_path**：apply/evidence/T005.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：False RED from external fixture mismatch
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — not started
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started

#### T006 — GREEN：threshold request and member terminal states
- **ID**：T006
- **Phase**：Phase P3 — External member termination semantics
- **goal**：Make T005 pass by extending request/status parser and runner routing.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：T005
- **并行**：否 — paired RED/GREEN
- **FR**：FR-EXT-001, FR-EXT-002, FR-EXT-003
- **AC**：AC-EXT-001, AC-EXT-002, AC-EXT-003
- **动作**：Send minimum_heterologous, validate positive int <= heterologous count, parse member/group/publication statuses.
- **精确文件**：`skills/wh-review/scripts/review-provider-client.mjs` `skills/wh-review/scripts/simple-review-runner.mjs` `skills/wh-review/scripts/third-review-host-config.mjs`
- **boundary**：files: `skills/wh-review/scripts/review-provider-client.mjs` `skills/wh-review/scripts/simple-review-runner.mjs` `skills/wh-review/scripts/third-review-host-config.mjs`; symbols/regions: only declared symbols
- **输出**：GREEN evidence: invalid threshold fails; threshold 2 publishes initial after second heterologous member
- **Knowledge**：Same oracle as T005
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`npx vitest run tests/contract/external-threshold-contract.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-THRESHOLD-REQUEST — same assertion passes; running remains running; initial publishes once
- **evidence_path**：apply/evidence/T006.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：External service field naming drift
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — not started
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started


### Verify

`npx vitest run tests/contract/external-threshold-contract.test.mjs
- `exit 0; ORACLE-THRESHOLD-REQUEST。

### Knowledge

D-007 protocol-zero-change only for heartbeat death primitive。

### STOP

If provider request cannot carry threshold`
- `return spec.md#FR-EXT-003。

### Done

AC-EXT-001/002/003 covered。

### Risks and rollback

Risk: external service not updated；keep WorkflowHub parser consumer behind contract fixture。

## Phase P4 — Early publish / late supplement contract

### Goal

threshold initial conclusion + 600000ms supplement/over_window_unjudged + completeness disclosure。

### Files

- **NEW**：`tests/contract/external-supplement-window.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/review-provider-client.mjs`
- **MODIFY**：`skills/wh-review/scripts/simple-review-runner.mjs`
- **DO NOT TOUCH**：`runtime/task/task-store.mjs` — immutable initial record semantics

### Tasks

#### T007 — RED：initial immutable and late window strict
- **ID**：T007
- **Phase**：Phase P4 — Early publish / late supplement contract
- **goal**：Initial conclusion not immutable and late boundary not strict.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：N/A — independent RED
- **并行**：否 — paired RED/GREEN
- **FR**：FR-EXT-004, FR-EXT-005
- **AC**：AC-EXT-004, AC-EXT-005, AC-EXT-006
- **动作**：Add failing fixture for initial publication plus 599999 in-window and 600000 over_window_unjudged.
- **精确文件**：`tests/contract/external-supplement-window.test.mjs`
- **boundary**：files: `tests/contract/external-supplement-window.test.mjs`; symbols/regions: only declared symbols
- **输出**：RED evidence: late result mutates initial or boundary wrong
- **Knowledge**：current parser has no supplement/over_window_unjudged handling
- **verification_role**：RED
- **paired_task**：T008
- **gate_cmd**：`npx vitest run tests/contract/external-supplement-window.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-SUPPLEMENT-WINDOW — target assertion fails at boundary or immutability
- **evidence_path**：apply/evidence/T007.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：False RED from clock fixture
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — not started
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started

#### T008 — GREEN：initial immutable and late window strict
- **ID**：T008
- **Phase**：Phase P4 — Early publish / late supplement contract
- **goal**：Make T007 pass by adding supplement registration and parsing.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：T007
- **并行**：否 — paired RED/GREEN
- **FR**：FR-EXT-004, FR-EXT-005
- **AC**：AC-EXT-004, AC-EXT-005, AC-EXT-006
- **动作**：Parse published_at, running_member_count, append_window; register supplement append-only with initial ref.
- **精确文件**：`skills/wh-review/scripts/review-provider-client.mjs` `skills/wh-review/scripts/simple-review-runner.mjs`
- **boundary**：files: `skills/wh-review/scripts/review-provider-client.mjs` `skills/wh-review/scripts/simple-review-runner.mjs`; symbols/regions: only declared symbols
- **输出**：GREEN evidence: supplement in aggregation/disposition; initial bytes unchanged
- **Knowledge**：Same oracle as T007
- **verification_role**：GREEN
- **paired_task**：T007
- **gate_cmd**：`npx vitest run tests/contract/external-supplement-window.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-SUPPLEMENT-WINDOW — same assertion passes at 599999/600000 boundary
- **evidence_path**：apply/evidence/T008.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：Supplement owner not unique; registration missing
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — not started
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started


### Verify

`npx vitest run tests/contract/external-supplement-window.test.mjs
- `exit 0; ORACLE-SUPPLEMENT-WINDOW。

### Knowledge

arrival_at is external-service persistence time; >=600000 over_window_unjudged。

### STOP

If supplement can mutate initial result`
- `return spec.md#FR-EXT-004。

### Done

AC-EXT-004/005/006 covered。

### Risks and rollback

Risk: window boundary clock skew；same authoritative clock domain required。

## Phase P5 — Write identity before formal writes

### Goal

task_id/path/worktree root 匹配；bootstrap transaction closes；derived executors inherit guard。

### Files

- **NEW**：`tests/contract/write-identity-workspace.test.mjs`
- **MODIFY**：`tools/cli/stage-runtime.mjs`
- **MODIFY**：`tools/cli/task-close.mjs`
- **MODIFY**：`tools/cli/task-bootstrap.mjs`
- **MODIFY**：`tools/host/workflowhub-stage-agent-bridge.mjs`
- **MODIFY**：`tools/architecture/public-behavior-baseline.mjs`
- **MODIFY**：`tools/architecture/clean-install.mjs`
- **DO NOT TOUCH**：read-only public commands

### Tasks

#### T009 — RED：wrong workspace write fails before bytes
- **ID**：T009
- **Phase**：Phase P5 — Write identity before formal writes
- **goal**：Wrong task/path/root writes can land.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：N/A — independent RED
- **并行**：否 — paired RED/GREEN
- **FR**：FR-IDENT-001
- **AC**：AC-IDENT-001
- **动作**：Add failing test for wrong task/path/root and child executor bypass.
- **精确文件**：`tests/contract/write-identity-workspace.test.mjs`
- **boundary**：files: `tests/contract/write-identity-workspace.test.mjs`; symbols/regions: only declared symbols
- **输出**：RED evidence: write succeeds outside authenticated workspace
- **Knowledge**：stage-runtime write path allows explicit ids outside worktree
- **verification_role**：RED
- **paired_task**：T010
- **gate_cmd**：`npx vitest run tests/contract/write-identity-workspace.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-WRITE-IDENTITY — target assertion fails: bytes land before identity check
- **evidence_path**：apply/evidence/T009.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：False RED due to read-only command blocked
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — not started
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started

#### T010 — GREEN：wrong workspace write fails before bytes
- **ID**：T010
- **Phase**：Phase P5 — Write identity before formal writes
- **goal**：Make T009 pass by adding write guard and propagating identity.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：T009
- **并行**：否 — paired RED/GREEN
- **FR**：FR-IDENT-001
- **AC**：AC-IDENT-001
- **动作**：Enforce write identity at stage-runtime/task-close/bridge; bootstrap transaction writes task_id, command, result then closes; fix harness cwd.
- **精确文件**：`tools/cli/stage-runtime.mjs` `tools/cli/task-close.mjs` `tools/cli/task-bootstrap.mjs` `tools/host/workflowhub-stage-agent-bridge.mjs` `tools/architecture/public-behavior-baseline.mjs` `tools/architecture/clean-install.mjs`
- **boundary**：files: `tools/cli/stage-runtime.mjs` `tools/cli/task-close.mjs` `tools/cli/task-bootstrap.mjs` `tools/host/workflowhub-stage-agent-bridge.mjs` `tools/architecture/public-behavior-baseline.mjs` `tools/architecture/clean-install.mjs`; symbols/regions: only declared symbols
- **输出**：GREEN evidence: only exact identity writes; bootstrap no new persistent object
- **Knowledge**：Same oracle as T009
- **verification_role**：GREEN
- **paired_task**：T009
- **gate_cmd**：`npx vitest run tests/contract/write-identity-workspace.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-WRITE-IDENTITY — same assertion passes; child bypass rejected
- **evidence_path**：apply/evidence/T010.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：Guard over-applied to read-only commands
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — not started
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started


### Verify

`npx vitest run tests/contract/write-identity-workspace.test.mjs
- `exit 0; ORACLE-WRITE-IDENTITY。

### Knowledge

Guard applies to writes only；doctor read-only remains。

### STOP

If bootstrap transaction cannot complete without new persistent object`
- `return spec.md#FR-IDENT-001。

### Done

AC-IDENT-001 covered。

### Risks and rollback

Risk: 15 test call sites break；harness cwd fixes documented。

## Phase P6 — Acceptance single writer / interaction publication

### Goal

官方验收推导唯一写者；talk_clarify quality fact + receipts.interaction + outline_closed consumption exactly once。

### Files

- **NEW**：`tests/contract/acceptance-single-writer-empty-values.test.mjs`
- **MODIFY**：`runtime/stage/stage-handlers.mjs`
- **MODIFY**：`runtime/stage/stage-runner.mjs`
- **MODIFY**：`runtime/stage/stage-agent-outcome-adapter.mjs`
- **MODIFY**：`runtime/task/task-kernel-implementation.mjs`
- **DO NOT TOUCH**：`runtime/schemas/**` — stable schemas

### Tasks

#### T011 — RED：single acceptance writer and interaction exactly once
- **ID**：T011
- **Phase**：Phase P6 — Acceptance single writer / interaction publication
- **goal**：Competing acceptance inputs can overwrite and interaction publication is not unique.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：N/A — independent RED
- **并行**：否 — paired RED/GREEN
- **FR**：FR-EVID-001
- **AC**：AC-EVID-001
- **动作**：Add failing test for competitor write rejection and talk_clarify/receipts.interaction/outline_closed chain.
- **精确文件**：`tests/contract/acceptance-single-writer-empty-values.test.mjs`
- **boundary**：files: `tests/contract/acceptance-single-writer-empty-values.test.mjs`; symbols/regions: only declared symbols
- **输出**：RED evidence: second writer succeeds or outline_closed missing
- **Knowledge**：stage handlers accept caller/host inputs
- **verification_role**：RED
- **paired_task**：T012
- **gate_cmd**：`npx vitest run tests/contract/acceptance-single-writer-empty-values.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-ACCEPTANCE-SINGLE-WRITER — target assertion fails on competitor write or missing outline_closed
- **evidence_path**：apply/evidence/T011.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：False RED due to unrelated missing fact
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — not started
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started

#### T012 — GREEN：single acceptance writer and interaction exactly once
- **ID**：T012
- **Phase**：Phase P6 — Acceptance single writer / interaction publication
- **goal**：Make T011 pass by deleting competing input paths and wiring unique publish.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：T011
- **并行**：否 — paired RED/GREEN
- **FR**：FR-EVID-001
- **AC**：AC-EVID-001
- **动作**：Restrict to official derivation owner; kernel publishes interaction once and outline_closed consumes.
- **精确文件**：`runtime/stage/stage-handlers.mjs` `runtime/stage/stage-runner.mjs` `runtime/stage/stage-agent-outcome-adapter.mjs` `runtime/task/task-kernel-implementation.mjs`
- **boundary**：files: `runtime/stage/stage-handlers.mjs` `runtime/stage/stage-runner.mjs` `runtime/stage/stage-agent-outcome-adapter.mjs` `runtime/task/task-kernel-implementation.mjs`; symbols/regions: only declared symbols
- **输出**：GREEN evidence: empty/zero/N/A distinct; publish once; consumer reads
- **Knowledge**：Same oracle as T011
- **verification_role**：GREEN
- **paired_task**：T011
- **gate_cmd**：`npx vitest run tests/contract/acceptance-single-writer-empty-values.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-ACCEPTANCE-SINGLE-WRITER — same assertion passes; no second writer
- **evidence_path**：apply/evidence/T012.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：Deleting wrong input path breaks stage facts
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — not started
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started


### Verify

`npx vitest run tests/contract/acceptance-single-writer-empty-values.test.mjs
- `exit 0; ORACLE-ACCEPTANCE-SINGLE-WRITER。

### Knowledge

Receipt owner is task kernel publish；caller cannot submit receipts.interaction。

### STOP

If existing outline_closed consumer cannot read new fact`
- `return spec.md#FR-RUNTIME-001。

### Done

AC-EVID-001 and AC-RUNTIME-001 covered。

### Risks and rollback

Risk: competing input paths remain；delete caller/host input paths。

## Phase P7 — Close / handoff / runtime ergonomics / non-UI / final aggregate

### Goal

authorized remote cleanup + recovery + known gaps; deferred handoff; current-session stage facts/reflection; final aggregate。D-026 explicitly retires the local bridge/outcome path from the active contract; historical T015/T016 wording is retained as provenance only。

### Files

- **MODIFY**：`tests/contract/close-remote-branch-cleanup.test.mjs`
- **NEW**：`tests/contract/no-external-stage-agent-gate.test.mjs`
- **MODIFY**：`/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md`
- **MODIFY**：`core/task-close.mjs`
- **MODIFY**：`runtime/task/task-store.mjs`
- **MODIFY**：`runtime/review/current-close-projection.mjs`
- **MODIFY**：`tests/contract/make-decision-interaction-publication.test.mjs`
- **MODIFY**：`tests/contract/stage-handoff.test.mjs`
- **MODIFY**：`tests/contract/build-reflection-page.test.mjs`
- **MODIFY**：`runtime/task/task-kernel-implementation.mjs`
- **MODIFY**：`runtime/stage/stage-handlers.mjs`
- **MODIFY**：`tools/cli/stage-runtime.mjs`
- **MODIFY**：`skills/stage-handoff/SKILL.md`
- **MODIFY**：`workflows/make-decision/SKILL.md`
- **MODIFY**：`workflows/make-decision/skill-deps.yaml`
- **MODIFY**：`workflows/build-spec/skill-deps.yaml`
- **MODIFY**：`workflows/build-plan/skill-deps.yaml`
- **MODIFY**：`workflows/verify-code/skill-deps.yaml`
- **MODIFY**：`docs/operations/claude-e2e-sample.md`
- **MODIFY**：`skills/workflowhub-host-protocol/SKILL.md`
- **MODIFY**：`workflows/build-code/capture.mjs`
- **MODIFY**：`workflows/verify-code/capture.mjs`
- **MODIFY**：`tests/contract/five-stage-spec-analyze-wiring.test.mjs`
- **MODIFY**：`tests/contract/review-materials-contract.test.mjs`
- **MODIFY**：`tests/contract/close-sidecar-and-archive.test.mjs`
- **MODIFY**：`tests/contract/review-material-change-redispatch.test.mjs`
- **MODIFY**：`tests/contract/review-budget-deletion.test.mjs`
- **MODIFY**：`tests/contract/external-threshold-contract.test.mjs`
- **MODIFY**：`tests/contract/external-supplement-window.test.mjs`
- **MODIFY**：`tests/contract/write-identity-workspace.test.mjs`
- **MODIFY**：`tests/contract/acceptance-single-writer-empty-values.test.mjs`
- **DO NOT TOUCH**：`specs/workflowhub-mechanism-waste-reduction-20260915/decision-log.md` — accepted material authority

### Tasks

#### T013 — RED：remote cleanup authorization and known gaps
- **ID**：T013
- **Phase**：Phase P7 — Close / handoff / runtime ergonomics / non-UI / final aggregate
- **goal**：Cleanup does not include authorized remote branch deletion and known gaps.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **source_refs / decision_refs**：ALL R-001~R-037；D-001~D-025
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：N/A — independent RED
- **并行**：否 — paired RED/GREEN
- **FR**：FR-CLOSE-001, FR-CLOSE-004, FR-CLOSE-005
- **AC**：AC-CLOSE-001, AC-CLOSE-004, AC-CLOSE-005
- **动作**：Add failing test for authorized remote delete only and known-gap summary including external repo.
- **精确文件**：`tests/contract/close-remote-branch-cleanup.test.mjs`
- **boundary**：files: `tests/contract/close-remote-branch-cleanup.test.mjs`; symbols/regions: only declared symbols
- **输出**：RED evidence: unauthorized delete or missing known gap
- **Knowledge**：cleanup composite local-only
- **verification_role**：RED
- **paired_task**：T014
- **gate_cmd**：`npx vitest run tests/contract/close-remote-branch-cleanup.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-REMOTE-CLEANUP — target assertion fails on unauthorized delete or gap omission
- **evidence_path**：apply/evidence/T013.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：False RED from missing authorization fixture
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — not started
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started

#### T014 — GREEN：remote cleanup authorization and known gaps
- **ID**：T014
- **Phase**：Phase P7 — Close / handoff / runtime ergonomics / non-UI / final aggregate
- **goal**：Make T013 pass by extending cleanup and projection.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **source_refs / decision_refs**：ALL R-001~R-037；D-001~D-025
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：T013
- **并行**：否 — paired RED/GREEN
- **FR**：FR-CLOSE-001, FR-CLOSE-004, FR-CLOSE-005
- **AC**：AC-CLOSE-001, AC-CLOSE-004, AC-CLOSE-005
- **动作**：Extend cleanup composite with remote branch delete; derive known gaps in close status/projection; keep recovery facts.
- **精确文件**：`core/task-close.mjs` `runtime/task/task-store.mjs` `runtime/review/current-close-projection.mjs`
- **boundary**：files: `core/task-close.mjs` `runtime/task/task-store.mjs` `runtime/review/current-close-projection.mjs`; symbols/regions: only declared symbols
- **输出**：GREEN evidence: only authorized delete; failed delete visible; gaps derived
- **Knowledge**：Same oracle as T013
- **verification_role**：GREEN
- **paired_task**：T013
- **gate_cmd**：`npx vitest run tests/contract/close-remote-branch-cleanup.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-REMOTE-CLEANUP — same assertion passes; recovery/new facts preserved
- **evidence_path**：apply/evidence/T014.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：Remote readback unavailable
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — not started
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started

#### T015 — RED：runtime handoff local outcome and reflection compatibility
- **ID**：T015
- **Phase**：Phase P7 — Close / handoff / runtime ergonomics / non-UI / final aggregate
- **goal**：Local session cannot produce outcome; future material leaves nonzero failure; reflection fields unreadable.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`- **source_refs / decision_refs**：ALL R-001~R-037；D-001~D-025
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：N/A — independent RED
- **并行**：否 — paired RED/GREEN
- **FR**：FR-RUNTIME-001, FR-RUNTIME-002, FR-RUNTIME-003, FR-RUNTIME-004, FR-HANDOFF-001, FR-UI-001
- **AC**：AC-RUNTIME-001, AC-RUNTIME-002, AC-RUNTIME-003, AC-RUNTIME-004, AC-HANDOFF-001, AC-UI-001
- **动作**：Add failing tests for interaction publication`
- `missing-input diagnosis`
- `future material N/A`
- `local outcome ergonomics`
- `reflection data compatibility.
- **精确文件**：`tests/contract/make-decision-interaction-publication.test.mjs` `tests/contract/stage-handoff.test.mjs` `tests/contract/build-reflection-page.test.mjs` `tests/contract/review-material-change-redispatch.test.mjs` `tests/contract/review-budget-deletion.test.mjs` `tests/contract/external-threshold-contract.test.mjs` `tests/contract/external-supplement-window.test.mjs` `tests/contract/write-identity-workspace.test.mjs` `tests/contract/acceptance-single-writer-empty-values.test.mjs`
- **boundary**：files: `tests/contract/make-decision-interaction-publication.test.mjs` `tests/contract/stage-handoff.test.mjs` `tests/contract/build-reflection-page.test.mjs` `tests/contract/review-material-change-redispatch.test.mjs` `tests/contract/review-budget-deletion.test.mjs` `tests/contract/external-threshold-contract.test.mjs` `tests/contract/external-supplement-window.test.mjs` `tests/contract/write-identity-workspace.test.mjs` `tests/contract/acceptance-single-writer-empty-values.test.mjs`; symbols/regions: only declared symbols
- **输出**：RED evidence: outline_closed missing, future material nonzero, or reflection field broken
- **Knowledge**：docs instruct direct writes; make-decision exits nonzero on future ENOENT
- **verification_role**：RED
- **paired_task**：T016
- **gate_cmd**：`npx vitest run tests/contract/make-decision-interaction-publication.test.mjs tests/contract/stage-handoff.test.mjs tests/contract/build-reflection-page.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-RUNTIME-HANDOFF — target assertion fails on publish/diagnosis/N/A/reflection
- **evidence_path**：apply/evidence/T015.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：False RED from unavailable local host
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — not started
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started

#### T016 — GREEN：runtime handoff local outcome and reflection compatibility
- **ID**：T016
- **Phase**：Phase P7 — Close / handoff / runtime ergonomics / non-UI / final aggregate
- **goal**：Make T015 pass with docs/runtime corrections and wrapper.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **source_refs / decision_refs**：ALL R-001~R-037；D-001~D-025
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：T015
- **并行**：否 — paired RED/GREEN
- **FR**：FR-RUNTIME-001, FR-RUNTIME-002, FR-RUNTIME-003, FR-RUNTIME-004, FR-HANDOFF-001, FR-UI-001
- **AC**：AC-RUNTIME-001, AC-RUNTIME-002, AC-RUNTIME-003, AC-RUNTIME-004, AC-HANDOFF-001, AC-UI-001
- **动作**：Remove direct-write instructions; add diagnosis; make future material N/A zero-failure; add local wrapper docs; verify reflection fields.
- **精确文件**：`runtime/task/task-kernel-implementation.mjs` `runtime/stage/stage-handlers.mjs` `tools/cli/stage-runtime.mjs` `tools/host/workflowhub-local-stage-runner.mjs` `skills/stage-handoff/SKILL.md` `workflows/make-decision/SKILL.md` `workflows/make-decision/skill-deps.yaml` `workflows/build-spec/skill-deps.yaml` `workflows/build-plan/skill-deps.yaml` `workflows/verify-code/skill-deps.yaml` `docs/operations/claude-e2e-sample.md` `skills/workflowhub-host-protocol/SKILL.md` `workflows/build-code/capture.mjs` `workflows/verify-code/capture.mjs` `tests/contract/build-reflection-page.test.mjs` `tests/contract/make-decision-interaction-publication.test.mjs` `tests/contract/stage-handoff.test.mjs` `/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md`
- **boundary**：files: `runtime/task/task-kernel-implementation.mjs` `runtime/stage/stage-handlers.mjs` `tools/cli/stage-runtime.mjs` `tools/host/workflowhub-local-stage-runner.mjs` `skills/stage-handoff/SKILL.md` `workflows/make-decision/SKILL.md` `workflows/make-decision/skill-deps.yaml` `workflows/build-spec/skill-deps.yaml` `workflows/build-plan/skill-deps.yaml` `workflows/verify-code/skill-deps.yaml` `docs/operations/claude-e2e-sample.md` `skills/workflowhub-host-protocol/SKILL.md` `workflows/build-code/capture.mjs` `workflows/verify-code/capture.mjs` `tests/contract/build-reflection-page.test.mjs` `tests/contract/make-decision-interaction-publication.test.mjs` `tests/contract/stage-handoff.test.mjs` `/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md`; symbols/regions: only declared symbols
- **输出**：GREEN evidence: local outcome source-level facts; future material N/A; reflection fields readable
- **Knowledge**：Same oracle as T015
- **verification_role**：GREEN
- **paired_task**：T015
- **gate_cmd**：`npx vitest run tests/contract/make-decision-interaction-publication.test.mjs tests/contract/stage-handoff.test.mjs tests/contract/build-reflection-page.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-RUNTIME-HANDOFF — same assertion passes; unknown/unavailable/N/A semantics preserved
- **evidence_path**：apply/evidence/T016.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：Local wrapper invents lifecycle facts
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — not started
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started

#### T017 — FINAL：aggregate verification
- **ID**：T017
- **Phase**：Phase P7 — Close / handoff / runtime ergonomics / non-UI / final aggregate
- **goal**：按 plan.md 最终路线验证全部适用 AC、跨任务 seam 和当前完整测试事实
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **source_refs / decision_refs**：ALL R-001~R-037；D-001~D-025
- **输入**：已完成的 Phase tasks 和最终路线
- **依赖**：T002,T004,T006,T008,T010,T012,T014,T016
- **并行**：否 — aggregate reads all preceding task facts
- **FR**：FR-SCOPE-001, FR-METRIC-001, FR-REV-003, FR-REV-004, FR-REV-005, FR-CLOSE-002, FR-CLOSE-003
- **AC**：AC-SCOPE-001, AC-METRIC-001, AC-REV-003, AC-REV-004, AC-REV-005, AC-CLOSE-002, AC-CLOSE-003
- **动作**：只执行一次最终聚合检查并记录真实退出码、oracle、覆盖范围和剩余风险；不创建新的状态权威
- **精确文件**：`tests/contract/review-materials-contract.test.mjs` `tests/contract/close-sidecar-and-archive.test.mjs` `tests/contract/close-remote-branch-cleanup.test.mjs` `core/task-close.mjs` `runtime/task/task-store.mjs` `runtime/review/current-close-projection.mjs` `tests/contract/make-decision-interaction-publication.test.mjs` `tests/contract/stage-handoff.test.mjs` `tests/contract/build-reflection-page.test.mjs` `tests/contract/five-stage-spec-analyze-wiring.test.mjs` `tests/contract/review-materials-contract.test.mjs` `tests/contract/close-sidecar-and-archive.test.mjs` `tests/contract/review-material-change-redispatch.test.mjs` `tests/contract/review-budget-deletion.test.mjs` `tests/contract/external-threshold-contract.test.mjs` `tests/contract/external-supplement-window.test.mjs` `tests/contract/write-identity-workspace.test.mjs` `tests/contract/acceptance-single-writer-empty-values.test.mjs`
- **boundary**：files: `tests/contract/review-materials-contract.test.mjs` `tests/contract/close-sidecar-and-archive.test.mjs` `tests/contract/close-remote-branch-cleanup.test.mjs` `core/task-close.mjs` `runtime/task/task-store.mjs` `runtime/review/current-close-projection.mjs` `tests/contract/make-decision-interaction-publication.test.mjs` `tests/contract/stage-handoff.test.mjs` `tests/contract/build-reflection-page.test.mjs` `tests/contract/five-stage-spec-analyze-wiring.test.mjs` `tests/contract/review-materials-contract.test.mjs` `tests/contract/close-sidecar-and-archive.test.mjs` `tests/contract/review-material-change-redispatch.test.mjs` `tests/contract/review-budget-deletion.test.mjs` `tests/contract/external-threshold-contract.test.mjs` `tests/contract/external-supplement-window.test.mjs` `tests/contract/write-identity-workspace.test.mjs` `tests/contract/acceptance-single-writer-empty-values.test.mjs`; symbols/regions: test files only
- **输出**：最终测试与交接事实
- **Knowledge**：所有前序任务真实结果；外部仓正式验收不在本任务
- **verification_role**：N/A — non-behavior aggregate verification
- **paired_task**：N/A — aggregate has no RED/GREEN pair
- **gate_cmd**：`npx vitest run tests/contract/review-material-change-redispatch.test.mjs tests/contract/review-budget-deletion.test.mjs tests/contract/external-threshold-contract.test.mjs tests/contract/external-supplement-window.test.mjs tests/contract/write-identity-workspace.test.mjs tests/contract/acceptance-single-writer-empty-values.test.mjs tests/contract/close-remote-branch-cleanup.test.mjs tests/contract/make-decision-interaction-publication.test.mjs tests/contract/stage-handoff.test.mjs tests/contract/build-reflection-page.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/review-materials-contract.test.mjs tests/contract/close-sidecar-and-archive.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-FINAL — all applicable AC and seams verified
- **evidence_path**：apply/evidence/T017.stdout
- **STOP**：最终命令不可执行、AC 缺失、越界或需要新决策时停止
- **recovery**：build-code owner repairs implementation; verify-code owner records unavailable facts
- **task risk**：聚合覆盖遗漏或把质量事实误写成通过
- **test tier / test method**：feature — targeted aggregate only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative seams run with same final command/oracle
- **fixtures_services**：deterministic fixtures; no new live task
- **coverage limits**：covers applicable ACs and declared seams only; external formal acceptance excluded
- **acceptance_role**：acceptance
- **ui_scope**：non_ui
- **acceptance_data**：`[{"source": "current task fixture", "sample": "all applicable ACs", "scenario": "final aggregate command result", "tier": "command", "execution": {"command": "npx", "args": ["vitest", "run", "tests/contract/review-material-change-redispatch.test.mjs", "tests/contract/review-budget-deletion.test.mjs", "tests/contract/external-threshold-contract.test.mjs", "tests/contract/external-supplement-window.test.mjs", "tests/contract/write-identity-workspace.test.mjs", "tests/contract/acceptance-single-writer-empty-values.test.mjs", "tests/contract/close-remote-branch-cleanup.test.mjs", "tests/contract/make-decision-interaction-publication.test.mjs", "tests/contract/stage-handoff.test.mjs", "tests/contract/build-reflection-page.test.mjs", "tests/contract/five-stage-spec-analyze-wiring.test.mjs", "tests/contract/review-materials-contract.test.mjs", "tests/contract/close-sidecar-and-archive.test.mjs"], "timeout_ms": 120000}}]`
- **e2e_scope**：not_required

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — final aggregate not executed
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started

#### T018 — D-026：active stage path no longer depends on external outcome
- **ID**：T018
- **Phase**：Post-P7 corrective task — current-session stage execution
- **goal**：删除 active manifest、reflection、handoff 与恢复链上的外部 Stage Agent/bridge/session/outcome 前置；保留旧 outcome/bridge 只读兼容；修复无 outcome 时成功 handler 被误记为 stage-end failure 的根因。
- **design_state**：ready
- **source_refs / decision_refs**：R-035, R-036, R-037, R-038；D-022, D-023, D-025, D-026
- **依赖**：T017 historical aggregate；当前 material revision 必须在执行前重新计算
- **精确文件**：`runtime/stage/stage-runner.mjs` `runtime/stage/stage-handlers.mjs` `runtime/stage/stage-reflect.mjs` `runtime/stage/stage-handoff.mjs` `runtime/evidence/canonical-evidence-validators.mjs` `runtime/evidence/freshness.mjs` `runtime/review/review-record-route.mjs` `skills/wh-review/scripts/wh-review-cli.mjs` `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs` `workflows/*/steps.json` `workflows/*/skill-deps.yaml` `workflows/*/SKILL.md` `skills/stage-reflection/SKILL.md` `skills/stage-handoff/SKILL.md` `skills/spec-analyze/SKILL.md` `skills/workflowhub-host-protocol/SKILL.md` `tools/cli/stage-runtime.mjs` `tests/contract/no-external-stage-agent-gate.test.mjs` `tests/contract/stage-runner-reflection.test.mjs` `tests/contract/acceptance-execution-tier.test.mjs`
- **oracle**：public `stage-runtime run --action=execute` 不接受 `receipts.stage_outcomes`；无该字段时成功发布当前事实和 `stage-end:<stage>`，阶段行 `exit_code=0/failure_signature=stage_end_recorded`；build-code acceptance execution aggregate 带 runtime-owned current-session binding，ordinary verify review 能消费该 binding；active workflow/skill deps 不再声明 `stage_outcome`；当前 session 可直接发布非门禁 reflection/handoff，缺 executor 只保留 unavailable；质量缺口仍是 unknown/unavailable/incomplete。
- **gate_cmd**：`npx vitest run tests/contract/no-external-stage-agent-gate.test.mjs tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/workflow-quality-regression.test.mjs tests/contract/stage-runner-reflection.test.mjs tests/contract/stage-handoff.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：`0`
- **STOP**：若 public run 仍要求外部 outcome，或测试失败来自当前契约之外的新设计问题，停止并记录真实阻塞；不得补造 bridge/session/outcome。
- **status**：`completed`
- **review_findings**：独立审查发现的 active public run、验收聚合、reflection 来源、handoff identity 及 wh-review 私有执行源残留均已修复；旧 outcome/bridge 仅保留兼容读取。最终质量仍如实保留 `code_review=missing/incomplete`，不把本任务修复冒充 verify-code 质量通过。
- **evidence_path**：`.planning/2026-09-16-eliminate-external-stage-agent/evidence/T018.stdout`
- **actual_changes**：public `stage-runtime run` 在任何研究/事实写入前拒绝 `receipts.stage_outcomes`；`runOfficialStage` 将当前 handler/publication 作为 stage-end 成功依据；build-code 验收原件改为 runtime-owned current-session binding；普通 review 与 wh-review 私有 E2E 路由消费当前 acceptance aggregate，不再要求外部 Stage Agent；reflection/handoff 直接校验当前 task/worktree/branch/snapshot/material；active workflow/skill 文档和 verify-code manifest 去除外部前置；旧 outcome/bridge/adapter 保留为历史兼容。
- **executed_commands**：`npx vitest run tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/workflow-quality-regression.test.mjs tests/contract/no-external-stage-agent-gate.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`（3 files / 23 tests，exit 0）；`npx vitest run tests/contract/stage-runner-reflection.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`（22/22，exit 0）；`npx vitest run tests/contract/stage-handoff.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`（35/35，exit 0）；acceptance execution current-session focused tests（3 passed，41 skipped，exit 0）；current-path e2e smoke（build-spec/make-decision/five-stage 各 1/1，历史边界 6/6，exit 0）；`npx vitest run tests/contract/no-external-stage-agent-gate.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`（2 files / 37 tests，exit 0）；public `node tools/cli/stage-runtime.mjs run --action=execute --stage=verify-code --project=workflowhub --task=workflowhub-mechanism-waste-reduction-20260915`（exit 0，`work_status=ready`、`continuation_allowed=true`、stage-end `exit_code=0/failure_signature=stage_end_recorded`）。未跑全量回归。
- **evidence_refs**：`.planning/2026-09-16-eliminate-external-stage-agent/evidence/T018.stdout`；当前 task `facts.jsonl#stage-end:verify-code`；当前 public smoke/status 输出。
- **covered_ac**：`AC-RUNTIME-003`、`AC-HANDOFF-001` 以及 D-026 active-path/no-external producer contract；质量 `code_review` 仍 missing/incomplete，未宣称 verify-code 质量完成。
- **review_fact**：Goodall 独立只读残留路径审查已逐项修复；本轮未重跑独立正式 provider code review，原质量缺口保留。
- **completed_at**：`2026-09-17T01:45:11+08:00`
- **执行事实**：未使用外部 Stage Agent、bridge 或 session/outcome；当前 WorkflowHub 会话直接执行并发布 stage row、质量事实；reflection 在无 judgment executor 时真实记录 `unavailable/executor_absent`，不阻断工作；未 commit/push/merge/archive/close。

### Verify

`npx vitest run tests/contract/review-material-change-redispatch.test.mjs tests/contract/review-budget-deletion.test.mjs tests/contract/external-threshold-contract.test.mjs tests/contract/external-supplement-window.test.mjs tests/contract/write-identity-workspace.test.mjs tests/contract/acceptance-single-writer-empty-values.test.mjs tests/contract/close-remote-branch-cleanup.test.mjs tests/contract/make-decision-interaction-publication.test.mjs tests/contract/stage-handoff.test.mjs tests/contract/build-reflection-page.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/review-materials-contract.test.mjs tests/contract/close-sidecar-and-archive.test.mjs` exit 0; ORACLE-FINAL。

### Knowledge

Reflection data-compat assertion remains narrow; no UI work。

### STOP

If Downloads markdown or close summary path unavailable, return spec.md#FR-HANDOFF-001。

### Done

All FR/AC covered by T017 aggregate。

### Risks and rollback

Risk: long suites exceed ceiling；host-managed background commands required。

## Complexity Trade-offs

删比较优于重设计谱系（P-D-009 字面）；复用官方处理器优于新增写入者（R-030）；挂白名单优于新增命令（D-022）；外层 N/A 收口优于改历史事实（provenance）。代价是 P1 route 单文件改动集中、P2 跨仓对齐成本高；收益是无第二控制面、回归面可枚举。
