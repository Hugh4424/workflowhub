# 实现计划：WorkflowHub 最小治理执行链

- **Input**：`specs/governance-runtime-execution-chain-20260827/decision-log.md`、`specs/governance-runtime-execution-chain-20260827/spec.md`
- **Template version**：`plan-task.v3`

## Quick Read

- **Goal**：让五个正常阶段继续保持简单；材料、启动、事件、detail 审查、provider 生命周期和 Skill 消费在真实入口处闭合，错误在写入或调用发生前说明原因，修好后可继续同一任务。
- **Non-goals**：不实现产品 UI、浏览器 QA、归档任务返工、下游产品验收；本计划只实现并测试未来实质性 UI 改动在 build-spec 的条件设计治理。仍不新增阶段、公共 CLI、Runner、持久任务对象、第五份材料、第二套状态机、永久兼容桥或硬性质量关卡。来源：`decision-log.md` R-002、R-003、R-006、R-007、D-006、D-009、D-010-D-015。
- **Before**：目标任务分支 `a964b8b27` 已有四材料和五阶段，但模板与严格消费存在错位，make-decision 的准备顺序、事件保存时机、detail 输入绑定和 Skill 语义消费仍有缺口。
- **After**：使用现有入口和 handler；四材料生产物可原样被正式消费者读取；正确 worktree 先于正式开始；错误事件和坏输入不污染有效序列；detail 先做公开字段诊断；provider 执行不受本地 elapsed-time deadline 终止，真实终态/取消/进程丢失仍能结束；每个声明 Skill 有且只有一个正式 consumer。
- **Main risk**：修复内部契约时误加新控制面，或把外部质量 unavailable 错当成结构成功。
- **Next step**：在 P3 记录 T009/T013 的 provider 无本地时限回归；任何需要新阶段、长期对象、新公共入口或第二套超时的要求立即 STOP 并回到 decision-log。

### 2026-08-28 运行时修订

本计划按 `decision-log.md` 最新修订执行：`3rd-review` 和 `wh-review` 不设 provider elapsed-time/no-progress 总时长。旧的 15 分钟 deadline、共享剩余时间和超时终止仅是历史执行记录，不是当前实现要求。健康探针短时请求保护只做诊断；上游 OpenCode Go/Zen 约 120 秒不返回的风险延期处理。

## Technical Context

### Global Constraints

- 四份当前材料仍是唯一工作真相；事件、review、测试和分析只记录事实，不是推进许可证。
- WorkflowHub 四份材料和本仓库 runtime 只在目标任务工作树 `/Users/Hugh/Hugh/Project/workflowhub-governance-runtime-execution-chain-20260827` 修改；目标分支是 `task/workflowhub/governance-runtime-execution-chain-20260827`，基线 `a964b8b2747f23361a684605e27161fab33cf3db`。T009 的 provider 生命周期代码只在 `/Users/Hugh/Hugh/Project/3rd-review` 主项目旁由 build-code 创建的平行任务 worktree 修改，不改两个主项目 checkout。
- 原先 Git 缺失对象导致的 worktree 创建失败是外部前置事实；`git fetch --refetch origin` 后已恢复，不把旧对象 gc 告警扩大为本任务功能。
- **Verified facts**：真实入口与测试锚点已由独立只读调研核实；五份 `skill-deps.yaml` 是声明的唯一来源，当前本地快照枚举出 35 条声明但实现不得把数量写死；只有少数声明已有完整语义 consumer；build-spec 的 `spec-research` receipt 白名单存在不可达缺口；显式无效 stage outcome 当前可能被降级为 diagnostic。
- **Language / runtime**：Node.js ESM，目标 Node `>=24`；现有测试使用 Vitest。
- **Primary dependencies**：复用 `js-yaml`、现有 TaskHandle、ArtifactDir、stage manifest loader、wh-review broker、`3rd-review` process runner 和已有 validator；不新增运行时依赖。
- **Storage / state**：TaskHandle 继续保存不可变事实；四份材料在任务 worktree 内原子更新；host session sidecar 只保存会话事件，不成为第二事实库。
- **Testing**：先用每 Phase 的 focused Vitest 命令做 RED/GREEN，再执行一次最终 `npm test`；测试不等于交付或发布。
- **Target environment**：本地 WorkflowHub 运行时与目标项目真实 Git；没有页面、浏览器或下游服务。
- **Scale / scope**：只触及本计划 File Boundary 中的现有 WorkflowHub runtime、Skill 合同、manifest、`3rd-review` Broker/process 和测试；公共治理文档的同步未获具体文字授权，本轮不修改；不扫描或重写历史归档。
- **Resolved plan facts**：spec-analyze 的 producer、正式记录入口和四个编写阶段的唯一语义 owner 由 P1 明确；保存前校验 task/stage/material/evidence 身份，当前四材料第 11 节是 AC 的唯一来源，审查 packet 的 `acceptance_criteria` 只从该章节派生，不创建第五份当前材料。
- **Resolved engineering facts**：T009/T013 删除 `3rd-review` Broker/process/health-runner 的 provider elapsed-time/no-progress 终止；`PROCESS_TIMEOUT` 只保留 provider/上游真实失败事实。`terminationGraceMs=5000` 仅用于已确认终态或取消后的进程清理，不是执行预算；OpenCode 使用 `timeout:false`，不新增公开配置字段。
- **Remaining engineering facts**：detail 的完整决定绑定细节、未鉴权错误是否可写 unavailable、30 个非硬编码 Skill 的逐项 consumer 绑定，均由 P2/P3/P4 以现有接口关闭；若必须增加新对象、新配置面或公共流程则 STOP。

## Code Anchors

- **Verified anchors**：`runtime/stage/stage-content-contracts.mjs#validateSpecContentProfile`、`#validatePlanTaskContract`、`#validateExecutablePlanTaskMinimum`、`#validateStageSpecAnalyzeProfile`、`#buildUiProjectInitFact`、`#deriveDesignSourceReadiness`、`#validateUiDesignLoopFact`、`#validateComponentQualityMap`；`runtime/stage/stage-agent-outcome-adapter.mjs#buildAnalyzer`、`#adaptStageAgentExecution`；`runtime/stage/stage-runner.mjs#validateStageSpecAnalyzeOutcome`、`#validateSkillOutcome`；`runtime/stage/stage-handlers.mjs#interactionAggregateFacts`、`#testFacts`、`#safeReviewFacts`、`#controlledBrowserQaFacts`、`#buildCodeContractFacts`、`#codeReviewFacts`、`#officialStageHandler`；`runtime/task/workspace.mjs#prepareTaskWorkspace`；`tools/cli/stage-runtime.mjs#resolveWorkflowHubIdentity`；`tools/host/workflowhub-codex-session-event.mjs#recordSpecAnalyze`；`tools/host/workflowhub-codex-session-state.mjs#preflightStartEvent`；`skills/wh-review/scripts/wh-review-cli.mjs#runReviewRound`；`runtime/stage/stage-skill-runtime.mjs#resolveStageSkillPackages`。
- **Existing interfaces**：五个 `workflows/<stage>/steps.json`、五个 `skill-deps.yaml`、`ArtifactDir` 四材料读写、`stage-runtime run`、`workflowhub-codex-session-event`、`wh-review run` 和现有三种状态 `consistent/inconsistent/material_incomplete`。
- **Read now**：本计划列出的生产模板、validator、启动入口、review matrix、Skill manifest 和对应测试。
- **Must read before task**：每张任务卡的精确文件与对应 symbol；不需要读取历史归档或全仓无关目录。
- **Context mode**：Full — 四个修复域跨 runtime、host、Skill 和测试，需要保留身份/材料/快照关系。

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
| --- | --- | --- | --- |
| 材料语法 | extend | `runtime/stage/stage-content-contracts.mjs` | 直接收敛现有 validator 与模板；不加转换层 |
| 任务 worktree | extend | `runtime/task/workspace.mjs` | 复用确定路径和任务分支；不新增目录策略 |
| detail 审查 | extend | `wh-review-cli.mjs#runReviewRound` | 复用 broker 和 matrix；只补最小预检 |
| provider 生命周期 | simplify | `3rd-review/lib/broker.mjs`、`3rd-review/lib/process.mjs`、`3rd-review/lib/health-runner.mjs`、`3rd-review/lib/config.mjs` | 删除本地 elapsed-time 终止；保留真实终态、取消、进程丢失和清理，不加新协议或配置面 |
| Skill consumer | extend | `stage-skill-runtime.mjs`、`stage-runner.mjs` | 在已有声明和 handler 合同中补唯一映射 |
| 新运行时对象 | remove | N/A — 现有接口足够 | 任何新对象都超出 D-006/D-009，直接 STOP |

## Solution Design

### Overview

P1 先让官方 spec/spec-analyze/tasks 生产格式、正式记录入口与已有严格 validator 使用同一语法，并让 stage-end analyzer 的输入检查在保存前明确区分结构、task/stage/material/evidence 身份与后续质量 freshness。P2 再把项目确认、worktree 准备和事件 preflight 排成一条顺序：worktree 成功后才允许正式开始，失败保留事实并可重试。

P3 先改 detail 的公开输入预检，再收敛 provider 生命周期：调用方提供任务身份、detail track、原始需求、完整当前决定和当前待审说明；runner 负责生成内部指令，provider 调用前报告字段错误；Broker/process 不因 elapsed time/no-progress 自动终止，`PROCESS_TIMEOUT` 只接收真实 provider/上游失败。P4 在既有 Skill manifest 中写入唯一 consumer，并由现有 stage runtime/handler 强制触发项的语义结果；外部质量 unavailable 仍保持 unavailable/incomplete。

### Module responsibilities

#### 材料合同

- **Responsibility**：定义并验证四材料的可消费语法。
- **Consumes**：decision-log、spec、plan、tasks 及当前 stage packet。
- **Produces**：canonical validator 结果与可原样消费的生产模板。
- **Must not decide**：不决定 review、测试或不可逆 Git 操作。

#### 启动与事件

- **Responsibility**：认证会话项目、准备唯一 worktree、在保存前验证 step/Skill 顺序。
- **Consumes**：用户选定项目、TaskHandle、stage/step manifest。
- **Produces**：已认证 workspace 或清楚的可修错误。
- **Must not decide**：不创建 recovery 阶段、不改写历史。

#### Detail review

- **Responsibility**：校验公开最小输入并绑定当前 decision-log/material revision。
- **Consumes**：当前任务身份、三项公开材料、现有 review broker。
- **Produces**：advice-only review 请求或 provider 前诊断。
- **Must not decide**：不把 review 变成阶段完成 gate。

#### Provider process boundary

- **Responsibility**：由 `3rd-review` Broker/进程执行器观察 provider 终态、取消和进程存活；不按 elapsed time/no-progress 主动终止。
- **Consumes**：provider execution plan、已有 `PROCESS_TIMEOUT`、现有终止宽限期和真实进程状态。
- **Produces**：正常结果或 provider/上游真实失败，保留 provider、attempt、耗时和原始错误事实。
- **Must not decide**：不新增 WorkflowHub 外层超时、重试协议、状态机、公开配置或把超时改写成 findings/pass。

#### Skill consumer

- **Responsibility**：把每个声明 Skill 绑定到恰好一个已有正式 consumer。
- **Consumes**：Skill manifest、当前 task/stage/material/snapshot 和 handler outcome。
- **Produces**：completed、not_applicable、failed 或 unavailable 的真实事实。
- **Must not decide**：不新增 dispatcher、持久 census 或第二状态机。

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：继续使用 `workflowhub-spec-analyze-stage-outcome.v1`、`workflowhub-codex-session-handoff.v1`、`stage-materials.json` 和 `plan-task.v3`；只补现有字段校验和 consumer 标识。
- **Data flow / state**：公开输入 → 入口 shape/identity preflight → 当前材料/worktree 绑定 → 现有 handler → 不可变事实；失败在拥有足够事实的最近入口返回。
- **API contract**：无新 API；现有 public 行为仍只有 `doctor`、`status`、`run`、`review`、`verify`、`confirm`、`authorize`。
- **UI / external code**：本任务不实现产品页面；只在现有 build-spec 条件步骤和 stage handler 中闭合 UI applicability、设计输入、原型展示/回复和当前批准事实。浏览器、组件和下游业务接口仍 N/A。
- **Fail-loud behavior**：缺字段、类型、身份、顺序、freshness、consumer 或 Git/worktree 错误都带具体名称和修复动作；不写坏事实，不把 unavailable 改成空结果。

## UI Delivery Contract (条件 UI 治理；本任务不做产品页面)

- **UI applicability**：当前任务是治理运行时的 `non_ui` 产品改动；P4 同时为未来实质性 UI 任务验证条件路径（ui/non_ui/unknown），不生成产品页面。
- **Component action**：N/A — reason: 当前任务没有产品组件；未来 UI 输入由 build-spec 读取现有页面/组件边界。
- **Real consumer**：`stage-content-contracts#buildUiProjectInitFact`、`#deriveDesignSourceReadiness`、`#validateUiDesignLoopFact`，由现有 build-spec handler 消费其当前阶段事实。
- **State owner**：现有 build-spec stage outcome/quality evidence；不新增 UI 状态存储或状态机。
- **Typed ViewModel**：N/A — reason: 没有 UI view model。
- **CSS/token owner**：N/A — reason: 没有样式。
- **Fixture / viewport**：只使用契约 fixture 记录本地 HTML 原型所需的页面/状态/宽度事实；不启动浏览器。
- **Browser / a11y / performance**：N/A — reason: 本任务不做产品页面或浏览器验收；原型契约只检查响应式和无障碍意图是否被记录。
- **Screenshot handoff**：N/A — reason: 本任务无产品页面输出；未来 UI 原型可作为质量证据引用。
- **Coverage limits**：不覆盖真实浏览器、页面布局、前端业务和下游产品验收；覆盖条件 UI 的输入、原型、展示顺序和批准绑定。
- **N/A / unknown reason**：当前任务 non_ui 是已接受范围；UI fixture 的缺输入保持 unknown/unavailable，不转成成功。

### Design-gap handoff (不改变 Design.md 权威)

- **design_status**：当前任务 `not_applicable`；未来实质性 UI 任务按条件路径达到 `previewed_waiting_reply`、`needs_revision`、`awaiting_external_return` 或 `approved_current`。
- **missing_items / reason**：当前任务 `[]`（没有产品 UI 输入）；条件 UI fixture 缺失时逐项记录 unknown/unavailable/N/A 原因。
- **fallback_visual_basis**：未来 UI 优先使用现有页面、真实数据、Design.md、Experience.md 和当前 spec；缺失时只给外部设计提示词，不伪造视觉完成。
- **constraints / assumptions**：只用现有五阶段、四材料、build-spec 条件步骤和现有 handler；不新增阶段、材料或状态机。
- **rework_risk / human_confirmation**：当前治理任务无页面返工；未来 UI 只有当前原型/外部返回物已展示且用户批准当前版本才可继续。
- **current_material_ref / design_revision**：当前四材料位于 `specs/governance-runtime-execution-chain-20260827/`；条件 UI 版本绑定当前 spec、设计/交互规范和页面数据输入。
- **visible_labels**：当前任务 N/A — reason: 无页面；条件 UI 原型必须记录页面级可见标签。
- **preview_refs / fixture_refs / viewport_refs / screenshot_refs**：当前任务无产品 preview；条件 UI 只引用质量 evidence 中的本地 HTML/fixture/viewport 事实。
- **responsive / a11y**：当前任务 N/A — reason: 无页面；条件 UI fixture 必须记录三种宽度、响应式行为和无障碍意图。

## File Boundary

### NEW

- `tests/contract/material-producer-consumer-roundtrip.test.mjs`
- `tests/contract/governance-startup-event-early-failure.test.mjs`
- `skills/wh-review/scripts/__tests__/detail-minimum-input.test.mjs`
- `tests/contract/stage-skill-consumer-contract.test.mjs`

### MODIFY

- `runtime/stage/stage-content-contracts.mjs`
- `skills/spec-specify/SKILL.md`
- `skills/spec-specify/templates/spec-template.md`
- `skills/spec-analyze/SKILL.md`
- `skills/spec-tasks/SKILL.md`
- `skills/spec-tasks/templates/tasks-template.md`
- `runtime/task/workspace.mjs`
- `runtime/stage/stage-context.mjs`
- `tools/cli/task-bootstrap.mjs`
- `tools/cli/stage-runtime.mjs`
- `tools/host/workflowhub-codex-session-event.mjs`
- `tools/host/workflowhub-codex-session-state.mjs`
- `skills/wh-review/scripts/wh-review-cli.mjs`
- `skills/wh-review/scripts/review-materials.mjs`
- `skills/wh-review/contracts/make-decision.md`
- `runtime/stage/stage-handlers.mjs`
- `runtime/stage/stage-runner.mjs`
- `runtime/stage/stage-agent-outcome-adapter.mjs`
- `runtime/stage/stage-skill-runtime.mjs`
- `workflows/make-decision/skill-deps.yaml`
- `workflows/build-spec/skill-deps.yaml`
- `workflows/build-plan/skill-deps.yaml`
- `workflows/build-code/skill-deps.yaml`
- `workflows/verify-code/skill-deps.yaml`
- `skills/catalog.yaml`
- `3rd-review/lib/broker.mjs`（T009/T013；独立平行 worktree）
- `3rd-review/lib/process.mjs`（T009/T013；独立平行 worktree）
- `3rd-review/lib/health-runner.mjs`（T009/T013；独立平行 worktree）
- `3rd-review/lib/config.mjs`（T009/T013；独立平行 worktree）
- `3rd-review/docs/workflowhub-result-v3.md`（T009/T013；独立平行 worktree，文字同步）
- `3rd-review/test/broker.test.mjs`（T009/T013；独立平行 worktree）
- `3rd-review/test/health-runner.test.mjs`（T009/T013；独立平行 worktree）
- `3rd-review/test/opencode-health.test.mjs`（T009/T013；独立平行 worktree）
- `3rd-review/test/process.test.mjs`（T009/T013；独立平行 worktree）

### DO NOT TOUCH

- `constitution-checklist.md`：只绑定并检查，不改清单。
- `specs/archive/`：历史材料只读。
- `specs/governance-runtime-execution-chain-20260827/decision-log.md`：历史决策只追加修订，不改写旧事实；`spec.md` 只按已确认修订同步当前要求。
- `CONTEXT.md`、`CONSTITUTION.md`、`docs/contracts/task-context.md`、`docs/adr/0005-deterministic-task-directory.md`、`docs/adr/0015-ui-design-source-and-initialization.md`：本轮不改；具体文字授权作为延期交接保留在 decision-log。
- `3rd-review` provider adapter 和外部 OpenCode Go/Zen 服务：不改；本轮只删除本地 elapsed-time termination，不恢复 provider 专用 deadline 或新增配置。
- UI/fullstack contract、PaperBuilder 和下游产品目录：不实现产品页面。

## Technical Decisions

### DEC-001 — 在现有 validator 上收敛生产格式

- **Problem**：模板示例与严格 parser 的标题、状态和 AC 结构有错位。
- **Options**：改官方模板 / 新增转换层 / 放宽 parser。
- **Selected**：extend；改模板和必要说明，保持 parser 严格。
- **Reason**：生产者与唯一消费者共享一套格式，删除手工修形。
- **Consequence / risk**：旧外部模板可能暴露错误；用明确诊断和 round-trip 测试处理。
- **Fallback**：回退本 Phase 模板和说明修改，保留原始错误事实。
- **F10 disposition**：simplify。

### DEC-002 — 启动先准备 worktree，再绑定正式事实

- **Problem**：任务或 session 可能已显示开始，但正确目录尚未准备好。
- **Options**：保持延后创建 / 在现有 bootstrap 与 stage context 中前移 / 新建 start 命令。
- **Selected**：extend；复用现有 bootstrap、workspace 和 session state。
- **Reason**：不增加用户步骤或公共对象。
- **Consequence / risk**：宿主传入项目不完整时更早失败；错误会更明确。
- **Fallback**：保留同一任务，修好项目/Git/worktree 后重试。
- **F10 disposition**：simplify。

### DEC-003 — detail 使用完整当前决定而非摘要

- **Problem**：detail 需要理由、风险和 Grill，调用方不应猜内部字段；早期阶段旧 review 复用还会带来不必要的版本判断。
- **Options**：继续摘要 / 调用方提供第二份决定 / detail 读取当前 decision-log 原始内容，并让前三阶段每次实际执行都重新审当前输入。
- **Selected**：extend；detail 以当前 decision-log bytes 和 material revision 作为唯一输入来源；make-decision/build-spec/build-plan 不自动复用旧审查。
- **Reason**：不复制决定材料、不增加 caller 猜测字段，也不维护正文、版本和语义指纹的复用判断。
- **Consequence / risk**：阶段重跑会增加一次审查调用；旧 review 只读保留，当前执行不误用旧结果。
- **Fallback**：返回字段/freshness 诊断，同一任务修复后重试。
- **F10 disposition**：simplify。

### DEC-004 — 在既有 Skill manifest/handler 合同内补 consumer

- **Problem**：声明的 Skill 可能只有 package/event 记录，没有正式语义消费。
- **Options**：新增 census/dispatcher / 继续只记 executed / 在 manifest 加唯一 consumer 并由现有 runtime 强制验证。
- **Selected**：extend；声明 `consumer` 标识，复用现有 stage runtime/handler。
- **Reason**：一项声明对应一个 owner，不增加常驻控制面。
- **Consequence / risk**：需要逐项盘点五份 manifest 当前发现的声明（本地快照为 35 条）；外部质量仍可能 unavailable。
- **Fallback**：结构缺 consumer 早失败；外部质量缺失保持 unavailable/incomplete。
- **F10 disposition**：simplify。

### DEC-005 — 删除本地 provider elapsed-time 终止，不增加第二套超时

- **Problem**：OpenCode Go/Zen 的长多步流式 session 在约 120 秒无终态；本地再加一个总时长会误杀正常长审查，且不能改变远端边界。
- **Options**：保留本地总时长 / 在 WorkflowHub 再加外层超时 / 删除本地 elapsed-time/no-progress 终止并保留真实失败事实。
- **Selected**：simplify；`3rd-review` Broker/process/health-runner 不按 elapsed time/no-progress 主动终止；`PROCESS_TIMEOUT` 只接收 provider/上游真实失败；OpenCode 使用 `timeout:false`。
- **Reason**：用户要求 3rd-review 和 wh-review 不受执行时长限制。删除冲突规则比再加一层计时器简单，也不增加 WorkflowHub 状态、协议或用户步骤。
- **Consequence / risk**：无终态 provider 可能持续运行；远端 OpenCode Go/Zen 仍可能提前断开。该风险保持 `unavailable`/真实失败，延期到上游服务或路由修复。
- **Fallback**：用户或宿主明确取消、provider/进程终态、进程实际丢失仍能结束；不伪造 findings/pass，不由本地 watchdog 生成 `PROCESS_TIMEOUT`。
- **F10 disposition**：simplify。

## Test Strategy

设计 RED/GREEN，不在 build-plan 执行命令。两者使用同一 `gate_cmd` 和 oracle identity；`gate_cmd` 只是测试命令，不是工作许可证。

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
| --- | --- | --- | --- | --- |
| FR-GOV-001, FR-MAT-001/002/003, AC-GOV-001, AC-MAT-001/002/003 | T001/T002 | RED/GREEN | `./node_modules/.bin/vitest run tests/contract/material-producer-consumer-roundtrip.test.mjs` / RED 非零，GREEN 0 | ORACLE-MAT+GOV：官方 spec/analysis/tasks 输出原样通过；坏 analyzer 输入不落库；公开 workflow/CLI 仍只有五阶段 / `quality/evidence/phase-p1-material.json` |
| FR-START-001/002/003, FR-EVT-001, AC-START-001/002/003, AC-EVT-001 | T004/T005 | RED/GREEN | `./node_modules/.bin/vitest run tests/contract/governance-startup-event-early-failure.test.mjs` / RED 非零，GREEN 0 | ORACLE-START：worktree 先成功、无效事件不写、修复复用同任务 / `quality/evidence/phase-p2-start.json` |
| FR-REV-001/002/003, AC-REV-001/002/003 | T007/T008 | RED/GREEN | `./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/detail-minimum-input.test.mjs` / RED 非零，GREEN 0 | ORACLE-DETAIL：公开最小输入和六类字段诊断在 provider 前生效；前三阶段每次实际执行只审一次当前输入 / `quality/evidence/phase-p3-detail.json` |
| FR-REV-004, AC-REV-004 | T009/T013 | RED/GREEN | `node --test test/process.test.mjs test/broker.test.mjs test/health-runner.test.mjs test/opencode-health.test.mjs`（在 3rd-review worktree） / RED 非零，GREEN 0 | ORACLE-REV-LIVENESS：provider 运行超过历史阈值或持续无进展时不被本地终止；终态/取消/进程丢失仍能结束，外部失败事实不改写 / `quality/evidence/phase-p3-provider-liveness.json` |
| FR-SKL-001/002, FR-UI-001/002/003, AC-SKL-001/002, AC-UI-001/002/003/004 | T010/T011 | RED/GREEN | `./node_modules/.bin/vitest run tests/contract/stage-skill-consumer-contract.test.mjs` / RED 非零，GREEN 0 | ORACLE-SKILL+UI：五份 manifest 动态发现的每项声明恰好一个具体 consumer；条件 UI 输入、原型、展示/回复和批准绑定，结构错与外部 unavailable 分开 / `quality/evidence/phase-p4-skill.json` |
| 全部 FR/AC 与跨 Phase seam | T012 | FINAL | `npm test` + `node --test test/process.test.mjs test/broker.test.mjs`（分别在对应 worktree） / 0 | ORACLE-FINAL：focused 与完整测试均保留真实状态，四材料、启动、detail、provider 生命周期、Skill 和条件 UI seam 可回放 / `quality/evidence/final-aggregate.json` |

## Rollback and Recovery

- **Global recovery rule**：只回滚当前实现文件和新测试；保留四份材料、已有启动修复和所有不可变质量事实。
- **删除证明**：本任务不删除历史、公共文档或产品文件；删除仅指撤下未授权的计划条目，已在当前 plan/decision-log 留痕。
- **Irreversible boundaries**：commit、push、merge、archive、cleanup 都需要用户另行授权；本轮不自动执行。
- **Recovery owner**：当前任务执行者负责回到受影响 Phase，保留原始失败输出，用同一任务和同一 oracle 修复。

### Engineering Risk Handoff

- **PLAN-RISK-001**：材料 producer/consumer 仍有隐含格式差异。
  - **Affected IDs**：FR-MAT-001/002/003、AC-MAT-001/002/003、T001/T002。
  - **Trigger**：round-trip 仍需手工替换标题、状态、oracle 或失败条件。
  - **Consequence**：用户继续猜内部字段。
  - **Mitigation or STOP**：只改官方模板或已有 validator；需要新转换层时 STOP。
  - **Handling Stage**：build-code。
  - **Verification**：ORACLE-MAT 与现有 strict analyzer 同命令。
- **PLAN-RISK-002**：会话 identity 与 worktree 准备顺序冲突。
  - **Affected IDs**：FR-START-001/002/003、FR-EVT-001、AC-START-001/002/003、AC-EVT-001、T004/T005。
  - **Trigger**：workspace 失败后仍绑定 session 或写第一条正式事件。
  - **Consequence**：看似已开始但目录错误，重试被旧绑定阻断。
  - **Mitigation or STOP**：把 prepare 放在正式绑定/事件前；不能猜 cwd。
  - **Handling Stage**：build-code。
  - **Verification**：ORACLE-START 比较事件序列、任务路径、分支和主项目 delta。
- **PLAN-RISK-003**：detail 旧 review 被错误复用。
  - **Affected IDs**：FR-REV-001/002/003、AC-REV-001/002/003、T007/T008。
  - **Trigger**：前三阶段重跑仍自动选择旧 review，或 detail 未绑定当前材料。
  - **Consequence**：provider 看到旧决定，结果失真；维护者被迫维护复杂新旧判断。
  - **Mitigation or STOP**：前三阶段每次实际执行只审当前输入一次，旧 review 只读不自动选；detail 仍绑定当前 bytes/revision；鉴权失败不伪造 unavailable。
  - **Handling Stage**：build-code。
  - **Verification**：ORACLE-DETAIL 检查 provider 调用次数和 freshness 诊断。
- **PLAN-RISK-004**：Skill 结构错误被降级为质量 unavailable。
  - **Affected IDs**：FR-SKL-001/002、AC-SKL-001/002、T010/T011。
  - **Trigger**：无 consumer、无效 outcome 或错身份仍进入 handler。
  - **Consequence**：声明看似完成但无人消费。
  - **Mitigation or STOP**：manifest/runner 在执行或写入前 fail-loud；外部质量 provider/test unavailable 保持原语义。
  - **Handling Stage**：build-code。
  - **Verification**：ORACLE-SKILL 和最终 stage outcome。
- **PLAN-RISK-005**：本地 provider elapsed-time 终止被未来改动重新引入。
  - **Affected IDs**：FR-REV-004、AC-REV-004、T009。
  - **Trigger**：Broker、process、health-runner 或 WorkflowHub 又加入 elapsed-time/no-progress watchdog。
  - **Consequence**：正常长审查被误杀，用户再次遇到隐藏时间限制，远端 120 秒问题仍未解决。
  - **Mitigation or STOP**：保持本地无总时长；只允许终态、明确取消、进程丢失和清理逻辑结束执行。若需要新 retry/state/config 或修复上游路由，停止并回到 decision-log。
  - **Handling Stage**：build-code。
  - **Verification**：ORACLE-REV-LIVENESS 与 `node --test test/process.test.mjs test/broker.test.mjs`。

## Implementation Order

P1 先稳定材料格式和 validator；P2 使任务启动、事件顺序和同任务重跑投影可依赖；P3 先校验 detail，再在 `3rd-review` Broker/process 完成 provider 生命周期边界；P4 最后把所有 Skill 声明和条件 UI 事实接到正式 handler。每个 Phase 内按 RED → GREEN → review 串行，最后只做一次全局 aggregate；P2/P3/P4 不并行写共享 WorkflowHub runtime 文件，T009/T013 使用独立仓库 worktree。

## Dependencies and Parallelism

- **Dependencies**：P1 → P2 → P3 → P4 → aggregate；生产者先于消费者，启动身份先于 review/Skill 绑定。
- **Parallel work**：每个 Phase 的 focused 测试可由独立测试进程运行，但代码文件所有权不重叠；不并行修改同一文件。
- **External dependencies**：Node、Git、现有本地 TaskHandle、wh-review provider 和 `3rd-review` sibling worktree；缺真实 provider 只记录 unavailable，不阻止结构修复；T009 的测试替身不访问网络。

## Requirement and Verification Traceability

| Source / decision | FR | AC | Phase / Task | Depends on | Exact files | Command / oracle |
| --- | --- | --- | --- | --- | --- | --- |
| R-001/D-006 | FR-MAT-001, FR-MAT-002, FR-MAT-003 | AC-MAT-001, AC-MAT-002, AC-MAT-003 | P1/T001-T002 | none | `runtime/stage/stage-content-contracts.mjs`, spec-analyze adapter/runner/record entry, templates, roundtrip test | ORACLE-MAT+GOV |
| R-002/R-003/D-009 | FR-GOV-001 | AC-GOV-001 | P1/T001-T002 | none | `runtime/stage/stage-content-contracts.mjs`, roundtrip test and existing five stage manifests/public action set | ORACLE-MAT+GOV |
| R-004/D-003-D-008 | FR-START-001, FR-START-002, FR-START-003 | AC-START-001, AC-START-002, AC-START-003 | P2/T004-T005 | P1 | `runtime/task/workspace.mjs`, `tools/cli/stage-runtime.mjs`, startup test | ORACLE-START |
| R-004/D-006 | FR-EVT-001 | AC-EVT-001 | P2/T004-T005 | P1 | `tools/host/workflowhub-codex-session-state.mjs`, event test | ORACLE-START |
| R-001/D-006/D-016 | FR-REV-001, FR-REV-002, FR-REV-003 | AC-REV-001, AC-REV-002, AC-REV-003 | P3/T007-T008 | P2 | `skills/wh-review/scripts/wh-review-cli.mjs`, `review-materials.mjs`, detail test | ORACLE-DETAIL |
| R-001/D-006/D-017 | FR-REV-004 | AC-REV-004 | P3/T009 | P2 | `3rd-review/lib/broker.mjs`, `3rd-review/lib/process.mjs`, `3rd-review/test/broker.test.mjs`, `3rd-review/test/process.test.mjs` | ORACLE-REV-LIVENESS |
| R-001/D-006/D-010-D-015 | FR-SKL-001, FR-SKL-002, FR-UI-001, FR-UI-002, FR-UI-003 | AC-SKL-001, AC-SKL-002, AC-UI-001, AC-UI-002, AC-UI-003, AC-UI-004 | P4/T010-T011 | P3 | manifests, `runtime/stage/stage-content-contracts.mjs`, `stage-handlers.mjs`, `stage-runner.mjs`, Skill/UI test | ORACLE-SKILL+UI |

## Deferred/Open Handoff Index

This index carries the decision-log's existing deferred and open items into the plan so each handoff has one owner, trigger, destination, and close condition. It does not add a stage, material, or gate.

| ID | owner | trigger | handoff | close condition |
| --- | --- | --- | --- | --- |
| DEFER-001 | 本机环境维护 | 用户单独要求维护 | 本机环境维护 | 对象库清理验证完成 |
| DEFER-002 | 归档任务 | 独立重开 | 原归档任务 | 本任务永久不处理 |
| DEFER-003 | 环境准备 | 用户另行批准 | 本机运行环境 | 本任务不实施 |
| DEFER-004 | make-decision | 现有能力无法满足且用户愿意扩大范围 | 未来独立决定 | 当前任务停止并说明 |
| OPEN-001 | build-plan | 详细建议后、实施前用户确认 | 四项最小修复 | 用户确认具体 diff |
| OPEN-002 | build-plan | 启动入口核实 | 现有启动入口 | 最小接口确定 |
| OPEN-003 | build-plan | 实施前用户确认 | 当前任务分支 | 带入并复测 |
| OPEN-004 | build-plan | 文档 diff 核实 | ADR 0005/task-context | 用户确认最小文字 |
| OPEN-005 | closed | 设计源已定 | build-spec | spec 唯一权威 |
| OPEN-006 | build-code | 实施前用户确认 | CONSTITUTION/ADR 文档同步 | 最小文字获批 |
| OPEN-007 | closed | provider 本地 elapsed-time deadline | 3rd-review Broker/process sibling worktree | 已删除本地总时长终止；5000ms 仅为已确认终态/取消后的清理；上游约 120 秒边界延期 |
| R-005/D-009 | all affected | all affected | every Phase | user confirmation remains task boundary | only current task files | no commit without authorize |
| R-006/D-006/D-009 | non-goal | non-goal | every Phase | none | DO NOT TOUCH paths | scope audit |

## Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| 四材料模板与 validator | `runtime/stage/stage-content-contracts.mjs`, spec-analyze adapter/runner/record entry, `skills/spec-*` | change | T001-T002 | 统一 producer/consumer 与保存前身份 |
| Task/worktree/session | `runtime/task`, `runtime/stage/stage-context.mjs`, `tools/cli`, `tools/host` | change | T004-T005 | 先准备、早失败、可重试，重跑投影不带旧后续 |
| Review contract | `skills/wh-review/scripts`, `skills/wh-review/contracts/make-decision.md` | change | T007-T008 | detail 公开最小输入；前三阶段每次只审当前输入 |
| Provider lifecycle | `3rd-review/lib/broker.mjs`, `3rd-review/lib/process.mjs`, `3rd-review/lib/health-runner.mjs`, `3rd-review/lib/config.mjs` | change | T009/T013 | 删除本地 elapsed-time 终止；保留真实终态/取消/进程丢失和清理 |
| Skill declarations/handler/UI governance | `workflows/*/skill-deps.yaml`, `runtime/stage`, `skills/catalog.yaml`, 条件 UI contract | change | T010-T011 | 唯一具体 consumer 和条件 UI 设计事实 |
| Approved governance docs | `CONTEXT.md`, `CONSTITUTION.md`, `docs/adr/0015-ui-design-source-and-initialization.md` | no change | deferred | 具体文字尚未逐项确认；不在本轮扩大改动面 |
| Constitution/history/archive | `constitution-checklist.md`, `specs/archive/`, UI/fullstack product implementation | no change | all | 保留历史和非目标边界 |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"CONSTITUTION.md","hash":"87637f45e507e8f0f382b9c6608c7a16dbee6295f940366abddd863f91a3b58e","id":"WORKFLOWHUB-CONSTITUTION","version":"1.6.0","clause_count":22}`
- **F1**：复用现有 validator、TaskHandle、handler；不把业务逻辑塞入新核心。
- **F2**：公开输入只保留阶段已有窄接口；内部字段由现有 runner 生成。
- **F3**：四材料决定推进；身份、hash、顺序和正式写边界在写前检查。
- **F4**：review 仍是 advice-only；finding 不阻止同任务修复。
- **F5**：只补已有入口的必要检查；无用新 gate 直接删除。
- **F6**：继续使用 TaskHandle 和现有外置 session handoff，不绑定永久 runner。
- **F7**：保留阶段确认与 Git authorize 分离；本计划不代替用户确认。
- **F8**：不新增 dispatcher、恢复链或兼容桥。
- **F9**：RED/GREEN、负例、旧失败保留和 unavailable 事实可证伪。
- **F10**：新增四个行为测试直接证明真实收益；不新增计数器或常驻基础设施。
- **F11**：正常路径仍是五阶段；结构错误早失败，质量事实不阻塞修复。
- **Q1**：质量事实不作准入证；provider/test unavailable 不被伪造为 pass。
- **Q2**：材料、结构、质量和完成判据分离；坏写入先失败。
- **Q3**：wh-review 保留异源建议；本地事件只证明结构事实。
- **S1**：优先复用已有 TaskHandle、ArtifactDir、wh-review 和 manifest。
- **S2**：只在现有 Skill 合同内做合宪适配。
- **S3**：每 Phase 就地读取当前模板/manifest/validator。
- **S4**：新测试输出真实可回放证据；不造运行时指标系统。
- **S5**：独立 review 和 test route 继续由技能执行，主流程只收摘要。
- **S6**：使用已完成的独立只读调研和现有历史合同，不闭门新增模型。
- **S7**：保持一阶段一 workflow 一目录。
- **S8**：Skill 改动保持独立文件和可搬运入口，不绑定本机路径。

## Phase P1 — 材料生产与唯一语义检查

### Goal

官方 spec/spec-analyze/tasks 生产说明、正式记录入口与已有 strict validator 对齐；代表性真实格式可原样 round-trip，坏 analyzer 结构和错误 task/stage/material/evidence 身份在保存前有明确错误；四个编写阶段只由同一 spec-analyze owner 做一次材料语义判断。P1 的治理 oracle 还必须直接核对 make-decision 的真实 Talk 和 decision-log：六类大白话覆盖齐全，未调用 Clarify、未虚构用户回复，且原始需求、事实、选择、理由、风险和延期交接已保存。

### Files

- **NEW**：`tests/contract/material-producer-consumer-roundtrip.test.mjs`
- **MODIFY**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`runtime/stage/stage-runner.mjs`、`tools/host/workflowhub-codex-session-event.mjs`、`tools/host/workflowhub-codex-session-state.mjs`、`skills/spec-specify/SKILL.md`、`skills/spec-specify/templates/spec-template.md`、`skills/spec-analyze/SKILL.md`、`skills/spec-tasks/SKILL.md`、`skills/spec-tasks/templates/tasks-template.md`
- **DO NOT TOUCH**：`specs/governance-runtime-execution-chain-20260827/decision-log.md`、`spec.md`；本 Phase 不补需求。

P1 在 `tools/host/workflowhub-codex-session-event.mjs` 只负责 `recordSpecAnalyze` 的保存前记录入口；事件 start/finish 的顺序和 preflight 归 P2，虽共享同一文件，但不交叉改动对方职责。

### Tasks

- T001/T002：先对官方 spec、spec-analyze 和 tasks producer representative output、strict parser、spec-analyze 三态、保存前身份校验、四阶段单一 owner 和五阶段公开面建立同一 RED/GREEN oracle。

### Verify

ORACLE-MAT — `./node_modules/.bin/vitest run tests/contract/material-producer-consumer-roundtrip.test.mjs`；RED 非零、GREEN 0；记录 producer 输出未手工修形、spec-analyze 三态/身份错误在保存前失败且不落库、四阶段只调用一次 owner，以及公开流程仍为五阶段；同一测试还核对 Talk 的流程/页面范围/数据状态/成功失败/非目标/延期交接覆盖和 decision-log 的原始需求、事实、选择、理由、风险、延期交接字段，并断言没有 Clarify 或虚构回复。

### Knowledge

P2 只消费稳定的材料内容和 validator 结果；P1 已由现有 adapter/runner 与 host record 入口负责 task/stage/material/evidence 身份绑定，P2 再负责启动时的项目/worktree/session 顺序和事件身份。

### STOP

需要第五份材料、转换层、放宽 parser、改写 decision/spec 或新增 semantic gate 时停止并回到 decision-log。

### Done

只有当同一命令的 RED 先因目标断言失败、GREEN 通过并保留负例，才把 P1 交给 P2；独立 review 另作质量事实，不是交接前置条件；不声称产品发布。

### Risks and rollback

风险是模板修正扩大成全仓格式迁移；只回滚本 Phase 文件，保留旧失败事实和四份材料。

## Phase P2 — 启动、worktree 与事件早失败

### Goal

make-decision 正式开始前从当前会话的唯一项目上下文解析真实 Git 项目并完成主项目旁 worktree；缺失、非 Git 或冲突项目在第一条正式事件/材料前失败；错误事件不写入；真实原因修好后同一任务、同一路径、同一分支可继续。阶段回退或重跑时保留原始事件，按追加顺序和阶段清单重算当前投影，旧的后续事件不再带入。

### Files

- **NEW**：`tests/contract/governance-startup-event-early-failure.test.mjs`
- **MODIFY**：`runtime/task/workspace.mjs`、`runtime/stage/stage-context.mjs`、`tools/cli/task-bootstrap.mjs`、`tools/cli/stage-runtime.mjs`、`tools/host/workflowhub-codex-session-event.mjs`、`tools/host/workflowhub-codex-session-state.mjs`
- **DO NOT TOUCH**：`runtime/task/task-handle.mjs` 的 create-only 语义和历史事件。

P2 在 `workflowhub-codex-session-event.mjs` 只负责 start/finish 的顺序、身份和 preflight；P1 的 `recordSpecAnalyze` 入口保持独立。`task-context` 与 ADR 0005 的文字同步留作延期，不把文档改动混入运行时修复。

### Tasks

- T004/T005：明确 `resolveWorkflowHubIdentity` → `task-bootstrap` → `prepareTaskWorkspace` 的项目输入链，覆盖缺失项目、非 Git 项目、路径/分支/Git/worktree/身份/顺序错误、detached target、任务提交后复用、阶段回退/重复、时间戳回退、任务分支领先主项目、旧后续不进入当前投影和事件序列字节不变。

### Verify

ORACLE-START — `./node_modules/.bin/vitest run tests/contract/governance-startup-event-early-failure.test.mjs`；RED 非零、GREEN 0；比较项目输入链、worktree 先成功、任务分支、Git 注册、主项目 delta、旧失败、重跑投影和有效事件序列。

### Knowledge

P3 可以信任当前 task/worktree/material revision；未鉴权 task 错误不伪造 unavailable，已鉴权输入错误才可记录事实。

### STOP

需要 cwd 猜项目、fallback 目录、recovery 阶段、替代任务或重写历史时停止。

### Done

有效项目先建 worktree，失败在第一条正式事件/材料前返回；修复后同一任务可重试；重跑使用新 attempt，当前投影不带起点之后的旧阶段事件；不承诺 commit/push/merge。

### Risks and rollback

风险是把宿主 session 绑定提前到 workspace 成功之前；回滚启动顺序改动，不动 TaskHandle 事实。

## Phase P3 — detail 审查公开最小输入

### Goal

detail 调用方只需提供公开身份和三项当前材料；provider 调用前逐字段报错，当前决定 bytes/revision 必须绑定本次请求。make-decision、build-spec、build-plan 每次实际执行各审当前输入一次，历史审查只读且不自动复用。对 provider 生命周期，Broker/process 不因 elapsed time/no-progress 自动终止；真实终态、取消或进程丢失结束执行，外部 `PROCESS_TIMEOUT` 只保留为真实失败。

### Files

- **NEW**：`skills/wh-review/scripts/__tests__/detail-minimum-input.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/contracts/make-decision.md`
- **MODIFY**：`3rd-review/lib/broker.mjs`、`3rd-review/lib/process.mjs`、`3rd-review/lib/health-runner.mjs`、`3rd-review/lib/config.mjs`、`3rd-review/docs/workflowhub-result-v3.md`、`3rd-review/test/broker.test.mjs`、`3rd-review/test/health-runner.test.mjs`、`3rd-review/test/opencode-health.test.mjs`、`3rd-review/test/process.test.mjs`
- T009/T013 只在 `3rd-review` 主项目旁的独立平行 worktree 修改上述 provider 生命周期文件。
- **DO NOT TOUCH**：`runtime/review/stage-materials.json` 的现有公开矩阵；`3rd-review` provider adapter、外部 OpenCode Go/Zen 服务和历史 review/事件。健康 runner、config 与 result 文档只同步本次“无本地 elapsed-time deadline”事实。

- **Symbols/regions**：Broker `runAttempt`、process liveness/termination cleanup、health-runner no-progress diagnostic、config timeout validation；这些区域只观察真实终态/取消/进程丢失，不创建 elapsed-time deadline。

### Tasks

- T007/T008：建立最小输入、missing/empty/forbidden/type/identity/freshness 六类诊断与 provider 未调用的 RED/GREEN，并断言前三阶段每次实际执行只审一次当前输入、旧结果不自动复用。
- T009/T013：在 `3rd-review` Broker/process/health-runner 删除 provider elapsed-time/no-progress 自动终止；`PROCESS_TIMEOUT` 只接收 provider/上游真实失败，`terminationGraceMs=5000` 仅用于已确认终态或取消后的清理；健康探针的单次请求保护只产生日志诊断；不改 WorkflowHub 外层调用、protocol、retry policy 或公共流程。

### Verify

ORACLE-DETAIL — `./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/detail-minimum-input.test.mjs`；RED 非零、GREEN 0；检查输入字段、当前 decision-log 原始内容、revision、provider 调用次数和历史结果不自动复用。

ORACLE-REV-LIVENESS — 在 `3rd-review` 平行 worktree 执行 `node --test test/process.test.mjs test/broker.test.mjs test/health-runner.test.mjs test/opencode-health.test.mjs`；RED 非零、GREEN 0；静默/无终态 provider 超过历史阈值后仍不被本地 elapsed-time 终止，终态/取消/进程丢失仍结束；外部 `PROCESS_TIMEOUT` 和 provider 错误事实保留；健康探针请求保护不升级为进程终止。

### Knowledge

P4 的 Skill consumer 只使用当前 review/result 事实；review 仍是 advice，不成为阶段结束 gate。T009/T013 的 liveness 只由 `3rd-review` Broker/process 观察真实终态和取消，WorkflowHub 不新增超时。

### STOP

需要第二份 decision-log、caller 提供 runner 指令、provider fallback、新增 detail 公共命令、新配置字段、第二状态机，或重新加入 provider elapsed-time/no-progress deadline 时停止。

### Done

最小正常路径可运行；字段错误在 provider 前失败；鉴权边界和 unavailable 语义保持真实；provider 无终态时不会被本地按时长杀死，真实终态/取消/进程丢失仍能结束，已有正常/健康/重试语义不被偷偷改写。

### Risks and rollback

风险是重跑路径再次偷偷引入旧 review 复用；回滚 early-stage dispatch/preflight 修改，保留原始 review 事实。

## Phase P4 — Skill 声明到正式 consumer

### Goal

五阶段声明（由五份 `skill-deps.yaml` 动态发现；当前快照为 35 条）各有一个具体正式 consumer；结构性缺 consumer/无效 outcome 在执行或写入前失败；外部质量 unavailable/not_applicable 保持原语义。条件 UI 的三个 build-spec 步骤还必须把真实输入、Screen Read Map、原型/外部返回、展示顺序和当前用户批准交给现有 build-spec handler；当前治理任务本身仍不生成产品页面。

### Formal consumer map

下面是本计划唯一的声明→消费者清单。每行对应一个由五份 `skill-deps.yaml` 动态发现的声明；当前快照有 35 条，但实现和测试不得把数量写死。每行只有一个正式 consumer；同一函数只有在消费字段明确不同、并由测试绑定当前 task/stage/material/snapshot 时才可复用。`wh-review#buildReviewMaterials` 只组装送审材料，不算结果 consumer。

| stage | declared Skill | formal consumer | consumed result/material |
| --- | --- | --- | --- |
| make-decision | talk-with-zhipeng | `stage-handlers#interactionAggregateFacts` | `receipts.interaction`：真实 Talk 生命周期与六类覆盖，绑定 task/stage/snapshot/decision |
| make-decision | grill-with-docs | `stage-handlers#testFacts` | `receipts.grill`：当前 grill receipt，绑定 task/stage/snapshot |
| make-decision | decision-log | `stage-handlers#officialStageHandler("make-decision")` | 当前 `decision-log.md` bytes/hash 与原始需求、事实、选择、理由、风险、延期交接 |
| make-decision | wh-review | `stage-handlers#safeReviewFacts` | `receipts.direction_review`/`detail_review`：当前 review result 与 task/stage/material/snapshot |
| make-decision | spec-analyze | `stage-runner#validateStageSpecAnalyzeOutcome` | 当前 make-decision `spec_analyze` outcome 与 analyzer step identity |
| build-spec | spec-research | `stage-handlers#testFacts` | `receipts.research`：当前 research receipt，绑定 task/stage/snapshot |
| build-spec | spec-clarify | `stage-handlers#testFacts` | `receipts.clarify`：当前 clarify receipt，绑定 task/stage/snapshot |
| build-spec | spec-specify | `stage-handlers#officialStageHandler("build-spec")` | 当前 `spec.md` bytes/hash 与 producer output |
| build-spec | simplicity-guard | `stage-handlers#safeReviewFacts` | 当前 `review` result 的 `lens=simplicity-guard`、task/stage/material/snapshot |
| build-spec | plan-ceo-review | `stage-handlers#safeReviewFacts` | 当前 `review` result 的 `lens=plan-ceo-review`、task/stage/material/snapshot |
| build-spec | ui-project-init | `stage-handlers#officialStageHandler("build-spec")` | `receipts.ui_project_init`：UI applicability、设计源初始化事实与当前 spec/data refs |
| build-spec | design-source-readiness | `stage-handlers#officialStageHandler("build-spec")` | `receipts.design_source_readiness`：Screen Read Map、readiness、source refs/hash/revision |
| build-spec | plan-design-review | `stage-handlers#officialStageHandler("build-spec")` | `receipts.plan_design_review`：原型/外部返回、页面/状态/viewport/a11y、展示顺序和当前批准 |
| build-spec | wh-review | `stage-handlers#safeReviewFacts` | 当前通用 `review` receipt，绑定 task/stage/material/snapshot |
| build-spec | spec-analyze | `stage-runner#validateStageSpecAnalyzeOutcome` | 当前 build-spec `spec_analyze` outcome 与 analyzer step identity |
| build-plan | spec-research | `stage-handlers#testFacts` | `receipts.research`：当前 research receipt，绑定 task/stage/snapshot |
| build-plan | spec-plan | `stage-handlers#officialStageHandler("build-plan")` | 当前 `plan.md` bytes/hash 与 producer output |
| build-plan | simplicity-guard | `stage-handlers#safeReviewFacts` | 当前 `review` result 的 `lens=simplicity-guard`、task/stage/material/snapshot |
| build-plan | plan-eng-review | `stage-handlers#safeReviewFacts` | 当前 `review` result 的 `lens=plan-eng-review`、task/stage/material/snapshot |
| build-plan | testing-system-blueprint | `stage-handlers#officialStageHandler("build-plan")` | 当前 `plan.md` test strategy 与任务/验收绑定 |
| build-plan | frontend-component-quality | `stage-content-contracts#validateComponentQualityMap` | 当前 `contract_facts.component_quality_map` 与 task/stage/snapshot；无 UI 为 `not_applicable` |
| build-plan | test-routing-advisor | `stage-handlers#officialStageHandler("build-plan")` | 当前 plan 的 test-tier/routing 字段与任务范围 |
| build-plan | spec-tasks | `stage-handlers#officialStageHandler("build-plan")` | 当前 `tasks.md` bytes/hash 与 producer output |
| build-plan | spec-analyze | `stage-runner#validateStageSpecAnalyzeOutcome` | 当前 build-plan `spec_analyze` outcome 与 analyzer step identity |
| build-plan | wh-review | `stage-handlers#safeReviewFacts` | 当前 build-plan `review` result 与 task/stage/material/snapshot |
| build-code | test-routing-advisor | `stage-handlers#buildCodeContractFacts` | 当前 implementation scope 的 test routing 与 snapshot |
| build-code | backend-testing | `stage-handlers#testFacts` | `receipts.tests`：当前 backend test receipt 与 task/stage/snapshot |
| build-code | frontend-testing | `stage-handlers#testFacts` | `receipts.tests`：当前 frontend test receipt 与 task/stage/snapshot |
| build-code | frontend-component-quality | `stage-handlers#controlledBrowserQaFacts` | 当前 UI QA/component quality fact 与 implementation snapshot；无 UI 为 `not_applicable` |
| build-code | fullstack-slice-testing | `stage-handlers#testFacts` | `receipts.tests`：当前 fullstack slice receipt 与 task/stage/snapshot |
| build-code | wh-review | `stage-handlers#safeReviewFacts` | 当前 build-code integration `review` result 与 task/stage/material/snapshot |
| build-code | spec-analyze | `stage-runner#validateStageSpecAnalyzeOutcome` | 当前 build-code `spec_analyze` outcome 与 analyzer step identity |
| verify-code | dsh-code-review | `stage-handlers#codeReviewFacts` | `receipts.quality_review`：当前 code review result 与 task/stage/snapshot |
| verify-code | frontend-component-quality | `stage-content-contracts#validateComponentQualityMap` | 当前 `contract_facts.component_quality_map` 与 implementation snapshot；无 UI 为 `not_applicable` |
| verify-code | wh-review | `stage-handlers#safeReviewFacts` | 当前 post-repair `review` result 与 task/stage/material/snapshot |

P4 的 manifest 字段只引用上表已有 symbol；需要新增的只是现有 build-spec/build-plan/verify-code handler 内的窄消费分支，不建立新 handler、dispatcher 或持久 census。缺失、重复、generic 或与当前身份不匹配的 mapping 在执行前失败。

### Files

- **NEW**：`tests/contract/stage-skill-consumer-contract.test.mjs`
- **MODIFY**：`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`runtime/stage/stage-skill-runtime.mjs`、`workflows/make-decision/skill-deps.yaml`、`workflows/build-spec/skill-deps.yaml`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-code/skill-deps.yaml`、`workflows/verify-code/skill-deps.yaml`、`skills/catalog.yaml`
- **DO NOT TOUCH**：外部 provider 实现、历史 stage outcome、归档 Skill。

### Tasks

- T010/T011：从五份 manifest 动态发现每个 declaration，并按上表写入一个具体 consumer、消费字段和身份锚点；修复 build-spec/build-plan research 与 build-spec clarify receipt 不可达；在现有 build-spec handler 增加条件 UI 窄消费：校验 `ui-project-init`、`design-source-readiness`、`plan-design-review` 的当前 facts，要求本地 HTML/外部返回、展示事件、用户回复和当前批准绑定当前输入；UI fixture 逐项覆盖页面/区域、交互流程、可见标签、关键状态、桌面/窄屏/手机结构、响应式行为、无障碍意图和缺失输入原因；build-plan/verify-code 的 `frontend-component-quality` 由现有 `validateComponentQualityMap` 语义消费，无 UI 时明确 `not_applicable`；不修改尚未逐项确认的公共治理文档。强制结构错误与外部 unavailable/not_applicable 分离。

### Verify

ORACLE-SKILL — `./node_modules/.bin/vitest run tests/contract/stage-skill-consumer-contract.test.mjs`；RED 非零、GREEN 0；从五份 manifest 动态逐项检查 declaration → 一个具体 consumer → current identity → handler result/material，并覆盖 UI/non_ui/unknown、原型展示先于回复、当前批准绑定、页面/区域/流程/标签/状态/三种宽度/响应式/a11y 和缺失输入原因；公共治理文档不在本轮验证或修改。

### Knowledge

最终 aggregate 只读取四材料、当前实现、各 Phase 事实；不能把 package/event/monitoring 记录当成 semantic consumption。

### STOP

需要新增 dispatcher、持久 census、第二状态机、永久兼容桥或把质量缺失升级为工作 Gate 时停止。

### Done

结构性错误 fail-loud；not_applicable/unavailable/incomplete 真实保留；manifest 动态发现的全部 consumer 映射均有测试证据，条件 UI 的输入/原型/展示/回复/批准及原型内容完整性也被现有 handler 消费；没有 generic 或重复占位映射，公共治理文档不在本轮改动。

### Risks and rollback

风险是把 generic executed 当成语义结果，或把 UI 依赖写成新的通用审批；回滚 manifest/runner/adapter/handler consumer checks，公共治理文档不参与本轮回滚，保留不可变失败事实。

## Build-plan review finding disposition

- **Review ref**：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/governance-runtime-execution-chain-20260827/quality/reviews/results/build-plan-default-c4a58ad0eb260a52e210d27b9ada09050c0924ff-051bd583-1367-481f-b22b-f5259c90971c.json`；该审查结果是不可变质量事实，不是阶段推进条件。
- **F-0894019988fa / F-233abacf541c**：已处理。`spec.md §11` 是唯一验收标准来源；review packet 的 `acceptance_criteria` 必须由这些条目生成，不新增第五份当前材料，也不接受空占位。
- **F-09397782e92e**：已处理。`tasks.md` 的每个 `versioned_refs` 绑定当前 `plan.md` hash。
- **F-20837d617a0c**：已处理。P1 的 Done 不再把独立 review 事实当作交接前置条件。
- **F-3580c8c016bd**：已处理。P2 明确当前会话项目 → `task-bootstrap` → `prepareTaskWorkspace` 的输入链，并覆盖缺失项目和非 Git 项目。
- **F-5797648b8955**：已处理。P1 纳入真实 spec、spec-analyze、tasks 生产者、正式保存入口、当前身份绑定和唯一 owner 的 round-trip 证据。
- **F-c07b37bed6ea**：已处理。ORACLE-MAT+GOV 明确检查既有五阶段和公共入口不扩张。
- **F-cad4d529a14b**：已处理。P4 已列出 manifest 动态发现的 declaration → consumer 具体映射，并要求逐项验证，不把 35 条写成固定协议。
- **输入事实**：本轮审查调用最初错误生成了空的 `requirements/acceptance_criteria.json`；该错误不改写审查结果，也不新增当前材料。计划已把唯一来源和生成规则写清，后续官方输入从 `spec.md §11` 读取真实条目。

- **本轮 Review ref**：`quality/reviews/results/build-plan-default-14d13b2e69f6d16090635eb64fb33f9c88cf13c7-48460963-4ebe-4952-beec-6b9f3fd927ba.json`；报告 `quality/reviews/reports/48460963-4ebe-4952-beec-6b9f3fd927ba.md`；attempt `quality/reviews/attempts/48460963-4ebe-4952-beec-6b9f3fd927ba/attempt.json`。这是不可变质量事实，不是推进许可证。
- **F-0f2561f62d0c**：`rejected_invalid`。审查 packet 为保护宿主路径把 `plan.md` 中的绝对路径替换为 `<host-path-redacted>`，所以 packet 内 `requirements/draft_plan.md` 的 hash 与工作树文件 hash 必然不同；审查时的 `e26568e8…` 只是上一快照，`tasks.md` 会在本次计划最后一次修改后同步绑定当前 `plan.md` hash。
- **F-abdb364884e9**：`fixed`。P1 的 Talk oracle 现在逐项核对流程、页面范围、数据状态、成功/失败、非目标、延期交接，以及 decision-log 的原始需求、事实、选择、理由、风险和延期交接，并断言不调用 Clarify、不虚构回复。
- **F-42133d9b750f / F-60155b44f3aa**：`fixed`。Formal consumer map 改成每个 manifest declaration 只有一个具体函数；review lens 统一由 `stage-handlers#safeReviewFacts` 消费结果，UI 三项由 `stage-handlers#officialStageHandler("build-spec")` 按不同 receipt 字段消费，组件质量和代码审查分别绑定实际 validator/handler；不再把 `buildReviewMaterials` 当结果 consumer，也不使用多头箭头映射。
- **F-71bb0c6b7732**：`fixed`。T010/T011 的 UI oracle 增加页面/区域、交互流程、可见标签、关键状态、桌面/窄屏/手机、响应式、a11y 和缺失输入原因的逐项断言；原型展示和当前批准仍绑定输入版本。
- **F-97998781c016**：`fixed`。删除 P4 对 `CONTEXT.md`、`CONSTITUTION.md` 的修改和所谓 F7 例外；本任务不修改未经逐项确认的公共治理文档。
- **F-8ae2cd9c4c39**：`fixed`。删除 P2 对 `docs/contracts/task-context.md`、`docs/adr/0005-deterministic-task-directory.md` 的修改；文档冲突作为 decision-log 的延期交接保留。
- **F-3a5f24651481**：`fixed`。不把 35 写成协议常量；测试从五份 `skill-deps.yaml` 动态发现当前声明，35 仅是当前快照事实。
- **F-8c22496097bc**：`fixed`。P1/P2 对共享 event 文件按函数职责分界：P1 只改 `recordSpecAnalyze`，P2 只改 start/finish preflight，并在 Phase 说明中写明所有权。
- **F-c90a0804c2c9**：`fixed`。同上，明确共享文件的 disjoint symbol ownership，避免把材料记录和启动顺序混成一个 Phase。
- **provider 状态**：`opencode/v4flash` 为 `SESSION_IDLE_WITHOUT_TERMINAL`；保留为 review unavailable 事实，不改写为空 findings，不把它升级为结构性阻塞。

## Final current-snapshot aggregate

- **tier / method**：fullstack / existing full `npm test`，因为实现跨 runtime、host、Skill 和测试边界。
- **scenarios**：四材料 round-trip、坏 analyzer 输入、worktree 先后、任务提交后复用、错误事件不污染、重跑投影、detail 六类诊断、前三阶段每次只审当前输入、从五份 manifest 动态发现的全部 Skill 唯一 consumer、条件 UI 设计输入/原型/展示/批准、外部 unavailable/not_applicable。
- **command**：`npm test`
- **expected exit**：0
- **oracle**：ORACLE-FINAL；当前快照全量测试通过或保留真实 incomplete/unavailable；没有把测试绿色写成发布/验收。
- **fixtures_services**：本地 Vitest fixture、临时 Git repository 和 provider stub；每个测试负责清理临时目录，不启动浏览器。
- **coverage limits**：不覆盖真实 provider 能力、产品页面、浏览器 QA、下游产品和旧归档；覆盖条件 UI 治理契约但不把原型当产品验收。
- **STOP**：命令损坏、AC 缺失、边界越界或需要新决策。
- **execution_contract**：当前快照运行一次；失败保留原始输出，回受影响 task，不用全量重跑掩盖局部失败。
