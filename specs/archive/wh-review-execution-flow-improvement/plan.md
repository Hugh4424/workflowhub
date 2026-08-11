# 实现计划：WorkflowHub 顺序执行与 wh-review 真实建议

- **Input**：`specs/wh-review-execution-flow-improvement/decision-log.md`、`specs/wh-review-execution-flow-improvement/spec.md`
- **Template version**：`plan-task.v3`
- **Spec SHA-256**：`5d3828e7d53eca7ffab19128576e00cf453f31cd5594f1a034f97e70e2039ba9`
- **Decision-log SHA-256**：`78a34a4c8fc3459aa4b135103813e11d7fedea0126f8db442b2f012ae3f66eba`

## Quick Read

- **Goal**：让任务从 make-decision 唯一入口安全启动，严格按 Talk → direction advice → Grill → detail advice 顺序推进；让 build-spec 独占 spec-clarify；让 wh-review 只发最小、阶段化、可追溯的异源建议，并如实区分 provider 失败、真实空结果和 build-code 的重要 finding 收口；让 build-plan 最终用现有 `spec-analyze` 严格回放五项当前材料，拦住需求遗漏事实。
- **Non-goals**：不改 WorkflowHub 宪法、三项历史任务、3rd-review 仓库、四份当前材料的权威边界；不新增 ledger、运行状态机、研究库、public ask/resume、provider fallback/retry 控制面或 quality gate。来源：`R-001`、`R-010`、`D-001`、`D-010`、`AC-015`。
- **Before**：dirty target 会阻止创建；wh-review CLI 可能旁路准备 worktree；make-decision 的 Clarify 归属和实际 step 边界不清；Grill 技能仍写成一次一问；build-spec 没有自己的 conditional research/spec-clarify；非 build-code advice 可能被过宽 freshness 规则逼成重审；build-code final integration 的时点不够醒目。
- **After**：dirty 只读记录并给建议，candidate 仍从 HEAD 创建；只有 make-decision 正式启动入口创建或复用 worktree；三类真实交互都有 ask → wait → reply → resume/re-rank 契约；Clarify 只在 build-spec；Grill 可一次展示互不依赖的当前前沿问题组但不是 review；review packet、provider route、失败终态和 provenance 可回看；所有 stage 只产 advice，build-code 只在当前可信结果没有重要 findings 后结束且不做无变化重审；记录性材料变化不触发 advice 重审；build-plan 最后一次 plan/tasks 修订后再执行一次 report-only `spec-analyze`，覆盖 DEFER/OPEN 和任务 oracle。
- **Main risk**：在修复旧合同的同时误增第二套状态/事实来源，或把“所有 stage 不要求 pass”误做成“provider 没有终态也算建议”，或者让 build-code 重要 finding 反复重审而没有停止点。
- **Next step**：按 P1 → P5 顺序执行 RED/GREEN；任何新产品方向、无法绑定的 host seam 或越界文件都回到对应当前材料，不在 build-code 临时补需求。

## Technical Context

### Global Constraints

- **Verified facts**：当前工作真相只有 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md`；旧 task、旧 receipt、旧 review、旧 snapshot 只读保留。make-decision 已有唯一准备入口，CandidateWorkspace 使用确定性 sibling path 和 task branch；当前代码仍在 `runtime/task/workspace.mjs` 中拒绝 dirty target。wh-review 已有 allowlist、冻结 manifest、阶段 contract、通用 3rd-review broker、真实 provider 结果和失败记录能力。`PROCESS_DEAD`、SIGTERM、路径错误、坏 JSON、transport failure 与 findings=[] 已在历史事实中被明确区分。
- **Language / runtime**：Node.js `v24.14.0`；Git worktree；Vitest 单 fork、关闭文件并行用于共享 worktree 合同测试。
- **Primary dependencies**：复用 `CandidateWorkspace`、现有 stage-runtime make-decision preparation、现有 interaction aggregate、现有 `quality/evidence/`、`quality/reviews/`、`quality/tests/`、`quality/confirmations/` 和现有 `authorize cleanup`。不引入第二 provider client、第二 research source 或第二 writer。
- **Storage / state**：只追加或修正现有四材料和已有 quality facts；逐 step decision-log 更新仍写同一份 `decision-log.md`；provider bundle 是一次性冻结输入，不是持久状态；Grill 问题队列只在当前会话内存在。
- **Testing**：每个行为改动先用同一 `gate_cmd` 形成真实 RED，再由最小实现变为 GREEN；build-plan 不执行测试；build-code 执行这些命令并记录现有 `quality/tests/` 事实；最终聚合只执行一次 `npm test`。
- **Target environment**：本地 WorkflowHub task worktree、宿主可暂停/恢复的会话、配置好的通用 3rd-review broker；外部 provider 不可用时保留 unavailable，不阻塞同 task 修复，但会降低完成声明。
- **Scale / scope**：5 个实现阶段，10 张行为 RED/GREEN 卡和 1 张 final aggregate；复用现有 `spec-analyze`，不新增 stage、材料、ledger、receipt、状态对象或 quality gate；只改已列出的 runtime、workflow、skill、review contract 和契约测试文件。
- **Unresolved facts**：dirty 摘要字段、build-spec research fact 的具体 key、broker timeout/kill 的具体 route readback 和现有 analyzer projection 的 disposition 字段仍需在执行时对齐现有接口；它们有 owner 和 STOP 条件，不能由 build-code 猜。对应 `OPEN-001`、`OPEN-002`、`OPEN-003`、`DEFER-001`、`DEFER-003`、`DEFER-005`、`DEFER-009`。

## Code Anchors

- **Verified anchors**：`runtime/task/workspace.mjs:workspaceForCreation`、`prepareTaskWorkspace`、`validateCandidate`；`runtime/stage/stage-context.mjs:bootstrapStage`、`prepareMakeDecisionWorkspace`；`tools/cli/stage-runtime.mjs` 的 make-decision preparation；`skills/wh-review/scripts/wh-review-cli.mjs:resolveTrustedReviewSubject`；`runtime/stage/stage-handlers.mjs:interactionAggregateFacts`、`bindFinalReview`、make-decision/build-spec official handlers；`runtime/evidence/freshness.mjs:selectCurrentFacts`；`skills/wh-review/scripts/review-materials.mjs:reviewInstructionsFor`、`buildReviewMaterials`；`skills/wh-review/scripts/review-runner.mjs:reviewGroupOutcome`。
- **Existing interfaces**：`prepareTaskWorkspace(TaskHandle)`、`CandidateWorkspace.captureSnapshot()`、`stage-runtime run --stage=make-decision`、`workflowhub-result.v2`、`quality/evidence/interactions/<sha256>.json`、现有 `review result/attempt/report` 和 `authorize cleanup`。
- **Read now**：`CONSTITUTION.md`、`constitution-checklist.md`、当前 decision/spec、上述 runtime anchors、阶段 steps/deps、wh-review stage plan/contracts、相关契约测试。
- **Must read before task**：执行每张卡前重读该卡列出的精确文件和当前四材料；provider 或 host seam 不用旧 attempt、旧 snapshot、旧 report 代替当前事实。
- **Context mode**：Full for P1/P2/P4 because they cross runtime, host and skill contracts; Lite for P3/P5 tests after their owning contracts are fixed.

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
| --- | --- | --- | --- |
| task worktree | extend | `runtime/task/workspace.mjs:prepareTaskWorkspace` | 保留确定性 branch/path 和 HEAD 基线，只增加 dirty 只读诊断；无独立对象。 |
| make-decision preparation | reuse | `tools/cli/stage-runtime.mjs` | 保留现有唯一正式入口；wh-review 只打开既有 candidate。 |
| interaction evidence | extend | `runtime/stage/stage-handlers.mjs:interactionAggregateFacts` | 用现有 aggregate/宿主 seam 表达唯一 owner 和真实回合，不建聊天归档。 |
| decision continuity | reuse | 当前 `decision-log.md` 与 `workflows/make-decision/steps.json` | 每步更新同一材料，最后回放；不建 requirement ledger。 |
| spec clarification | reuse | `skills/spec-clarify/SKILL.md` | 恢复 build-spec 依赖和 step，移除 make-decision 重复 Clarify。 |
| Grill | extend | `skills/grill-with-docs/SKILL.md` | 只把独立 frontier 作为一组展示；仍是交互思考，不成为 review。 |
| heterologous review | reuse | `skills/wh-review/scripts/review-materials.mjs`、`review-runner.mjs` | 保持 broker owner、阶段 allowlist 和真实 terminal taxonomy；不做旁路 fallback。 |
| review freshness | extend | `runtime/evidence/freshness.mjs`、`runtime/stage/stage-handlers.mjs:bindFinalReview` | advice 保留实际 reviewed provenance；只有 build-code 绑定当前实现。 |
| final integration review | reuse | `phase_id=null` integration review contract | 只把时点和输入写清楚，不增加新的 gate。 |

## Solution Design

### Overview

P1 把 candidate 创建改成“先读 target，再从 HEAD 建立 worktree”：读取 ref、HEAD、dirty 状态和有限摘要只是事实诊断；不 stash、不 commit、不 delete、不把 dirty 内容带入 candidate，也不因 dirty 阻止启动。正式 make-decision 入口继续是唯一创建者，wh-review 只打开认证的已有 workspace。

P2 保留当前 decision-log step 表的 13 个 make-decision step 和现有 quality stores，但把顺序、owner、连续 decision-log 更新和交互生命周期写成可执行合同。Talk 仍一次一题，并在每个选项上给出大白话后果和风险；Grill 对当前互不依赖的 frontier 可一次成组提问，部分回答只重排未答项；Clarify 不在 make-decision 运行。

P3 恢复 build-spec 的 conditional research 和 `spec-clarify`，结果只复用现有 facts/materials 并保持 executed/skipped/unavailable；build-code 明确“最终测试与 AC trace → final integration review → findings disposition/focused repair → 现有发布合同”。

P4 收窄审查包并把阶段特有 prompt/skill/contract 与通用 broker 保持在同一次 review 调用中。每个阶段合同必须明确关注点、排除项和 finding 证据要求；provider 没有可信最终文本时只记录真实 unavailable/transport 分类，并消费实际 timeout/kill/route/coverage/group outcome；所有 stage 只需真实异源建议，不要求 pass/findings=[]；记录性 decision-log/snapshot 变化不自动触发 advice 重审，build-code 仍严格绑定当前实现并收口重要 findings。

P5 用现有宪法和四材料合同做回归锁定，并把 build-plan 最终 `spec-analyze` 放在 findings 处置和最后一次 plan/tasks 修订之后、publish 前；证明没有新增维护对象、public command、quality gate、替代 ledger 或历史迁移。

### Module responsibilities

#### Task start and candidate

- **Responsibility**：读取 target 状态、从 HEAD 生成确定性 CandidateWorkspace、返回有限 dirty 建议。
- **Consumes**：`TaskHandle`、target repository、现有 task manifest。
- **Produces**：既有 CandidateWorkspace 能力和 make-decision completion facts 中的 dirty 事实。
- **Must not decide**：不决定用户是否清理，不导入 dirty 内容，不改变 target，不生成新的状态对象。

#### Stage interaction and materials

- **Responsibility**：make-decision 编排 Talk/Grill/decision-log；build-spec 编排 research/spec-clarify；build-code 消费已确认材料。
- **Consumes**：当前四材料、现有 interaction completion record、用户真实 reply、既有 stage steps。
- **Produces**：同一 decision-log、现有 interaction/research facts、现有 stage result。
- **Must not decide**：不把文档存在、测试通过、历史 review 或 provider failure 变成完成。

#### wh-review and broker

- **Responsibility**：按 stage/track/scope 生成最小冻结 packet，调用配置的通用 broker，记录真实 route/coverage/terminal/provenance。
- **Consumes**：allowlist 规定的四材料、phase diff/context、阶段 skill/contract、broker 配置。
- **Produces**：现有 review result/attempt/report 和 findings/unavailable facts。
- **Must not decide**：不自行选 provider、不 fallback、不把 Grill 当 review、不生成 stage pass。

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：复用 `workflowhub-interaction-aggregate.v1`、`workflowhub-result.v2`、现有 receipt namespaces 和 `quality/*`；build-spec 只增加对现有 `research` test-fact 形状的 stage 消费，不创建新 schema。
- **Data flow / state**：入口读取 target → 从 HEAD 建 candidate → make-decision 按现有 13 步逐步写同一 decision-log → build-spec 条件研究/Clarify → build-plan 设计 → review findings 处置 → 最终 `spec-analyze` 跨材料回放 → publish-plan-result → build-code phase/final integration → verify-code。任一写入、reply、provider terminal、identity 或最终分析输入不匹配都保留 incomplete/unavailable 并回同 task 修复。
- **API contract**：不新增 public API。现有 CLI `doctor/status/run/review/verify/confirm/authorize` 保持不变；workspace preparation 是 make-decision 私有入口，wh-review 无 workspace 时明确失败。
- **UI / external code**：只改宿主可见的 plain-language cards/result explanations；不新增页面、路由、持久问答页或第二状态机。
- **Fail-loud behavior**：错误 card/round/hash、错误顺序、旧事实冒充当前、路径逃逸、坏 JSON、provider 无终态、workspace 身份变化、最终 analyzer 缺输入/缺 DEFER/OPEN 去向和未授权 cleanup 都明确报错或保持 unavailable/incomplete。

## File Boundary

### NEW

- N/A — 不新增生产文件、当前材料、状态存储、public command、review 控制面或质量 gate。

### MODIFY

- `runtime/task/workspace.mjs`
- `runtime/stage/stage-handlers.mjs`
- `skills/wh-review/scripts/wh-review-cli.mjs`
- `core/__tests__/workspace-manager.test.mjs`
- `tests/official-make-decision-cli.test.mjs`
- `tests/contract/material-workspace.test.mjs`
- `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- `workflows/make-decision/SKILL.md`
- `workflows/make-decision/steps.json`
- `workflows/make-decision/skill-deps.yaml`
- `skills/talk-with-zhipeng/SKILL.md`
- `skills/grill-with-docs/SKILL.md`
- `runtime/stage/stage-content-contracts.mjs`
- `tests/stage-interaction-contract.test.mjs`
- `tests/interaction-quality-contract.test.mjs`
- `tests/stage-decision-contract.test.mjs`
- `tests/decision-log-content-contract.test.mjs`
- `tests/workflow-v2-contract.test.mjs`
- `workflows/build-spec/SKILL.md`
- `workflows/build-spec/steps.json`
- `workflows/build-spec/skill-deps.yaml`
- `workflows/build-code/SKILL.md`
- `workflows/build-code/steps.json`
- `skills/catalog.yaml`
- `tests/contract/stage-routing-and-concrete-testing.test.mjs`
- `tests/contract/spec-stage-artifact-closure.test.mjs`
- `tests/contract/stage-skill-invocation-contract.test.mjs`
- `tests/contract/stage-completion.test.mjs`
- `skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`
- `skills/wh-review/SKILL.md`
- `skills/wh-review/contracts/provider-protocol.md`
- `skills/wh-review/contracts/make-decision.md`
- `skills/wh-review/contracts/build-spec.md`
- `skills/wh-review/contracts/build-plan.md`
- `skills/wh-review/contracts/build-code.md`
- `skills/wh-review/scripts/review-materials.mjs`
- `workflows/build-plan/SKILL.md`
- `workflows/build-plan/steps.json`
- `skills/spec-analyze/SKILL.md`
- `quality/tests/T011-final.json`
- `tests/contract/spec-analyze-completeness.test.mjs`
- `skills/wh-review/scripts/review-runner.mjs`
- `runtime/evidence/freshness.mjs`
- `skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- `skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs`
- `skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs`
- `tests/contract/review-materials-contract.test.mjs`
- `tests/integration/verify-freshness-selection.test.mjs`
- `tests/contract/make-decision-artifact-path.test.mjs`
- `tests/final-cutover-guards.red.test.mjs`
- `tests/stage-review-cost-policy.test.mjs`
- `tests/contract/four-material-non-gate-contract.test.mjs`
- `tests/contract/repository-governance.test.mjs`
- `tests/p0-foundation-contracts.test.mjs`
- `tests/requirements-completeness-audit-acceptance.test.mjs`

### DO NOT TOUCH

- `CONSTITUTION.md` — 本任务必须服从现有 1.5.0 宪法，不改条款。
- `constitution-checklist.md` — 只作为 21 条绑定事实，不改清单。
- `CONTEXT.md` — Grill 结果是 no-change，术语没有领域含义变化。
- `runtime/evidence/requirement-ledger.mjs` — 历史兼容区，不恢复或扩展为新 ledger。
- `tools/cli/task-bootstrap.mjs` — 只登记 task，不承担阶段 worktree 创建。
- `tools/cli/stage-runtime.mjs` — 现有正式 make-decision preparation owner 保持不分叉。
- `runtime/stage/stage-context.mjs` — 现有拒绝 caller-supplied path 和 preparation seam 已足够；若执行发现事实相反，先回 plan/spec，不旁路修改。
- `skills/spec-clarify/SKILL.md` — 复用现有唯一 Clarify skill，不重写成第二套。
- `skills/wh-review/stage-skill-plan.json` — 继续由 wh-review 统一路由；阶段特有内容由既有 contract/skill allowlist 提供。
- `external 3rd-review repository/**` — 本任务只修 WorkflowHub 侧合同和测试；Kimi absolute ReadFile 适配事实保留为 transport evidence，不扩大 packet。
- `specs/archive/**` — 历史材料只读，不迁移、不补写、不冒充当前结果。

## Technical Decisions

### DEC-001 — dirty target 只记录，不带入 candidate

- **Problem**：dirty main 会阻止 task worktree 创建，或被误认为当前实现内容。
- **Options**：A 保持阻止；B 自动 stash/commit/清理；C 从 target HEAD 建 candidate，同时只读记录 dirty 和建议。
- **Selected**：extend 现有 `workspaceForCreation` 和 CandidateWorkspace。
- **Reason**：C 保留 HEAD 身份和用户改动，解决启动阻塞，改动最小。
- **Consequence / risk**：dirty 内容不会自动进入 task；用户要带入时必须另行明确处理。
- **Fallback**：状态命令失败就 fail-loud；摘要不确定时记录 unknown/recommended，不猜用户意图。
- **F10 disposition**：`keep` — 复用现有检查，不造诊断平台。

### DEC-002 — make-decision 是唯一 workspace 创建 owner

- **Problem**：不同调用方分别 prepare 会重复创建、旁路身份校验和难以解释失败。
- **Options**：A 每个 review caller 自己准备；B task-bootstrap 预创建；C 保留 stage-runtime make-decision 入口，其他调用方只 open。
- **Selected**：reuse 现有正式 make-decision preparation seam。
- **Reason**：生命周期与用户启动意图一致，review 只消费已有 capability。
- **Consequence / risk**：没有已创建 workspace 的旁路 review 会明确不可用，不能偷偷创建。
- **Fallback**：重复启动复用并校验现有 deterministic workspace；冲突不自动修复。
- **F10 disposition**：`keep`。

### DEC-003 — 顺序由现有 steps、interaction evidence 和 current material 共同证明

- **Problem**：Talk、direction advice、Grill、detail advice 曾出现乱序，Grill 还可能被当 review。
- **Options**：A 新建流程状态机；B 只改文档；C 加强现有 steps、audit、interaction aggregate 和 publish contracts。
- **Selected**：extend 现有阶段 steps 和 completion/content contracts。
- **Reason**：保留宪法要求的薄核心，不新增状态维护对象；错误顺序在发布前 fail-loud。
- **Consequence / risk**：旧历史记录不能补成当前顺序，当前 task 必须重新形成真实证据。
- **Fallback**：任何顺序证据缺失保持 incomplete，回同 task 修复。
- **F10 disposition**：`keep`。

### DEC-004 — Clarify 唯一归 build-spec，Talk 和 Grill 保持不同问答规则

- **Problem**：make-decision 和 build-spec 各自 Clarify 会重复提问、分叉事实；Grill 一次一问限制了独立前沿问题的处理。
- **Options**：A 两阶段都 Clarify；B make-decision 继续承包 Clarify；C make-decision 只保留 Talk/Grill，build-spec 使用现有 spec-clarify；Grill 只对独立 frontier 成组展示。
- **Selected**：reuse 现有 `spec-clarify`，extend 本地 Grill 交互合同。
- **Reason**：一个问题一个 owner；批量只优化互不依赖问题，不把 Grill 变成 review 或问卷。
- **Consequence / risk**：host 必须真实绑定 card/reply；无法绑定时保持 incomplete。
- **Fallback**：Talk 继续一次一题；Grill 冲突时退回最小澄清。
- **F10 disposition**：`keep`。

### DEC-005 — review packet 最小化，provider 失败不转 findings

- **Problem**：完整仓库、累计 diff、raw log 和路径误用会膨胀上下文、拖慢 provider，且失败可能被写成空 findings。
- **Options**：A 扩大包提高“保险”；B caller 自己 fallback/retry；C 复用 allowlist、阶段 prompt/contract 和一个通用 broker，保留 terminal/provenance。
- **Selected**：reuse 现有 wh-review packet/broker，extend 失败和提示合同。
- **Reason**：最小输入更聚焦，单一 provider owner 更容易解释；transport 问题由适配层如实记录。
- **Consequence / risk**：包过小可能遗漏必要上下文，靠阶段 contract/context map 补语义而不是塞全仓库。
- **Fallback**：合法的真实 empty findings 保留；没有最终文本只记 unavailable，不重试制造结果。
- **F10 disposition**：`keep`。

### DEC-006 — advice freshness 与 implementation freshness 分开

- **Problem**：只追加 confirmation/interaction/decision-log 等记录性材料就触发非 build-code advice 重审，偏离“只为获取异源建议”的根本目标。
- **Options**：A 所有 snapshot 变化都重审；B 所有 review 都忽略 snapshot；C advice 保留实际 reviewed material/provenance，build-code 仍严格绑定当前实现。
- **Selected**：extend 现有 freshness selection 和 final binding。
- **Reason**：既不伪造 advice 当前，也不把记录变化当被审主题变化；同时保留 build-code 当前实现和重要 finding 的真实性，不依赖 provider pass 字样。
- **Consequence / risk**：新的真实 subject 仍需新 advice 请求；调用方必须说明理由并保留 provenance。
- **Fallback**：无法判断是否 record-only 时保持 unknown/incomplete，不静默选择旧结果。
- **F10 disposition**：`keep`。

### DEC-007 — build-spec research 和 build-code final integration 复用现有事实边界

- **Problem**：build-spec 缺少清晰 research owner，build-code 的 integration review 时点隐藏在泛化 review-change 中。
- **Options**：A 新增研究库/新 gate；B 只补文档；C 恢复 build-spec 条件 research/spec-clarify，明确 build-code final integration 顺序并复用现有 review predicate。
- **Selected**：extend 现有 stage steps/deps 和已有 quality fact consumer。
- **Reason**：补齐 owner 与执行顺序，不增维护对象、public stage 或完成 gate。
- **Consequence / risk**：research 的具体 fact key 需要和现有 test-fact 形状对齐；不确定就记录 unavailable。
- **Fallback**：规格已足够时明确 skipped；实现 integration 复用 `phase_id=null` contract。
- **F10 disposition**：`keep`。

### DEC-008 — decision-log 逐 step 更新仍是同一当前材料

- **Problem**：只在末尾回放容易漏需求，后续阶段读到不完整核心材料会整体跑偏。
- **Options**：A 只做一次最终回放；B 新建 requirement ledger；C 每个现有 step 完成时更新同一 decision-log，最后再做完整回放。
- **Selected**：extend `decision-log.md` 写入合同和现有 13-step evidence。
- **Reason**：提高可追溯性又不增加第五份材料、writer 或 gate；no-new-requirement 也留下事实。
- **Consequence / risk**：日志更长、hash 变化更频繁；非 build-code advice 不因此重审。
- **Fallback**：写入失败保持当前 step incomplete，修复绑定后再继续。
- **F10 disposition**：`keep`。

### DEC-009 — 所有 review 只产 advice，build-code 以无重要 findings 收口

- **Problem**：继续把 build-code 的 provider `pass` 当作结束条件，会让所有阶段混入放行语义；去掉 pass 后又可能让实现 review 过松，或因为 findings 变化无限重审。
- **Options**：A 所有阶段都追求 pass；B 所有阶段只记录建议且不对 build-code 收口；C 所有阶段只记录可信异源建议，build-code 复用现有 `actionable` 的 `major|blocking` finding 处置，实际修复后只做一次 focused review，并在重复/无变化/无终态时停止。
- **Selected**：C；复用现有 wh-review finding adjudication、当前实现绑定、focused repair 和 needs_human/unavailable/incomplete 事实。
- **Reason**：方向/规格/计划审查回到“找问题、给建议”；build-code 保留严格的当前实现重要问题清除要求，但不需要 provider 写 `pass`，也不产生新的 review loop controller 或 quality gate。
- **Consequence / risk**：build-code 可能因真实重要问题需要多轮修复；每轮必须有实际主题变化，重复 finding、只改记录或 provider 无终态就停止自动循环并交接，避免路线漂移、时间和 token 浪费。
- **Fallback**：`minor`/`nonblocking_minor` 作为 advice 保留；`invalid_anchor`、unavailable 和 transport failure 保持原事实，不能当作“没有重要 findings”。
- **F10 disposition**：`keep`。

## Test Strategy

设计 RED/GREEN，不在 build-plan 执行命令。每对使用同一 `gate_cmd`、同一 oracle identity 和同一 task-relative evidence path；RED 的非零必须来自目标断言，GREEN 必须保留失败路径。

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
| --- | --- | --- | --- | --- |
| FR-START-001/002、FR-CLEANUP-001、AC-001/002/014 | T001/T002 | RED → GREEN | `npm exec -- vitest run core/__tests__/workspace-manager.test.mjs tests/official-make-decision-cli.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs tests/contract/material-workspace.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / RED 非零、GREEN 0 | `ORACLE-START-DIRTY`：dirty target 未被阻止、未被导入、未被自动清理；失败事实明确；`quality/tests/T001-start-dirty-red.json`、`quality/tests/T002-start-dirty-green.json` |
| FR-INTERACT-001、FR-INTERACT-003/005、FR-DECISION-001、AC-003/005/017/018/019 | T003/T004 | RED → GREEN | `npm exec -- vitest run tests/stage-interaction-contract.test.mjs tests/interaction-quality-contract.test.mjs tests/stage-decision-contract.test.mjs tests/decision-log-content-contract.test.mjs tests/workflow-v2-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / RED 非零、GREEN 0 | `ORACLE-INTERACTION-ORDER`：13 step 顺序、Talk 大白话后果/风险、Talk/Grill 真实 ask/wait/reply/resume、Grill frontier batch、连续 decision-log 和 Grill 非 review；`quality/tests/T003-interaction-red.json`、`quality/tests/T004-interaction-green.json` |
| FR-INTERACT-002、FR-SPEC-001/002、FR-HANDOFF-001、AC-004、AC-011/012/013 | T005/T006 | RED → GREEN | `npm exec -- vitest run tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs tests/contract/stage-completion.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / RED 非零、GREEN 0 | `ORACLE-STAGE-HANDOFF`：build-spec research/Clarify owner 唯一、spec-clarify 真实 ask/wait/reply/resume、build-code final integration 时点明确且复用旧 contract；`quality/tests/T005-handoff-red.json`、`quality/tests/T006-handoff-green.json` |
| FR-REVIEW-001..009、AC-006/007/008/009/010/016/020/021/023/024 | T007/T008 | RED → GREEN | `npm exec -- vitest run skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs tests/contract/review-materials-contract.test.mjs tests/integration/verify-freshness-selection.test.mjs tests/contract/make-decision-artifact-path.test.mjs tests/final-cutover-guards.red.test.mjs tests/stage-review-cost-policy.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / RED 非零、GREEN 0 | `ORACLE-REVIEW-FACTS`：最小 packet、每阶段关注点/排除项/证据要求、broker route、timeout/kill/group outcome、terminal failure、advice freshness、所有 stage advice-only、build-code 重要 finding 收口和停止边界；`quality/tests/T007-T008-review.json` |
| FR-GOV-001、FR-PLAN-001、AC-015/022 | T009/T010 | RED → GREEN | `npm exec -- vitest run tests/contract/four-material-non-gate-contract.test.mjs tests/contract/repository-governance.test.mjs tests/p0-foundation-contracts.test.mjs tests/requirements-completeness-audit-acceptance.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/stage-completion.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / RED 非零、GREEN 0 | `ORACLE-GOV-BOUNDARY`：无新对象/gate，最终 spec-analyze 在 findings disposition 后、publish 前运行，且发现 DEFER/OPEN/流程边界/oracle 遗漏；`quality/tests/T009-T010-governance.json` |

## Rollback and Recovery

- **Global recovery rule**：只回滚当前实现、skill、contract 和测试 bytes；保留当前四份材料、旧 review/attempt/report、provider failure 和历史 task，不做历史改写。
- **Irreversible boundaries**：cleanup、commit、push、merge、archive 仍需既有独立授权；本计划不授权这些动作，也不自动处理 dirty main。
- **Recovery owner**：主 agent 按 owning Phase 回滚最小改动；若是材料/方向缺口回 `decision-log.md` 或 `spec.md`，若是 host/provider 事实缺口保持 incomplete/unavailable，不新建 successor task。

### Engineering Risk Handoff

- **PLAN-RISK-001**：host 无法真实承载三种 ask/wait/reply/resume。
  - **Affected IDs**：`R-007`、`R-008`、`R-012`、`FR-INTERACT-002/003/004`、`AC-004/005/018`、T003/T004。
  - **Trigger**：reply 无法绑定 card/round/hash，或 resume 不保持等待态。
  - **Consequence**：系统可能用 aggregate 字段冒充真实交互。
  - **Mitigation or STOP**：保持 incomplete，补既有 host seam 契约；不得新增 public ask/resume 或持久问答对象。
  - **Handling Stage**：build-code；必要时回 make-decision/spec 的 owner 材料。
  - **Verification**：真实 ask → waiting-for-user → 对应 reply → resume/re-rank 测试和失败分支。
- **PLAN-RISK-002**：provider transport/path failure 被误分类为业务 findings。
  - **Affected IDs**：`R-015`–`R-019`、`FR-REVIEW-001..006`、`AC-006..010/016`、T007/T008。
  - **Trigger**：Kimi 需要绝对 ReadFile path、provider SIGTERM、坏 JSON 或 broker terminal error。
  - **Consequence**：重试、包膨胀或伪造 findings/pass。
  - **Mitigation or STOP**：保持 file-only logical path contract，由 adapter 负责绝对路径转换；WorkflowHub 记录 route/terminal/unavailable，不 fallback、不格式修正、不扩包。
  - **Handling Stage**：build-code；3rd-review 只保留为外部 transport owner。
  - **Verification**：fault fixtures 断言失败不是 findings=[]，真实 empty findings 与 unavailable 可区分。
- **PLAN-RISK-003**：逐 step decision-log 更新造成 hash churn 或内容缺字段。
  - **Affected IDs**：`R-020`、`FR-DECISION-001`、`AC-017`、T003/T004。
  - **Trigger**：step 更新漏写 no-new、用户回答、去向，或写失败仍推进。
  - **Consequence**：后续阶段读取不完整需求，或 advice 被错误重审。
  - **Mitigation or STOP**：同一材料逐步追加、最终逐源回放；写失败保持当前 step incomplete；record-only 变化不触发非 build-code advice review。
  - **Handling Stage**：build-code；方向缺口回 make-decision。
  - **Verification**：13 step 覆盖、写失败负例、原始来源分类和 freshness 负例。
- **PLAN-RISK-004**：把任一 stage advice 误当 pass gate，或去掉 pass 后让 build-code 重要 finding 漏掉。
  - **Affected IDs**：`R-018`、`R-022`、`D-014`、`D-018`、`FR-REVIEW-003/005/009`、`AC-008/010/023/024`、T007/T008。
  - **Trigger**：findings 非空、provider unavailable 或旧 advice 被要求重审；build-code 带着当前 actionable major/blocking finding 结束。
  - **Consequence**：普通审查变成阻塞器，或实现审查过松，均偏离“获取异源建议并控制风险”的目标。
  - **Mitigation or STOP**：所有 stage 只记录可信 advice；build-code 复用现有重要 finding 分类，实际修复后只做一次 focused review；重复、无变化或无终态就停止自动循环，保留真实交接事实，不新增 gate。
  - **Handling Stage**：wh-review/build-code。
  - **Verification**：stage review contract 检查 advice-only；build-code contract 检查当前 material、重要 finding 收口、focused repair 和停止边界。
- **PLAN-RISK-005**：DEFER/OPEN 在 decision-log 中存在，但没有进入 spec/plan/tasks 的同一检查链。
  - **Affected IDs**：`R-021`、`FR-PLAN-001`、`AC-012/022`、`DEFER-001..009`、`OPEN-001..006`、T009/T010/T011。
  - **Trigger**：只运行中段 spec-analyze、只检查 R/D/FR/AC，或第 11 步修订后没有最终回放。
  - **Consequence**：18/18 FR/AC 结构通过仍可能漏掉延期/未决，后续阶段继续猜需求。
  - **Mitigation or STOP**：扩展现有 planning_artifacts/validator，publish 前由 build-plan 运行一次 report-only spec-analyze；缺项保持 finding/incomplete，不新增 ledger/gate。
  - **Handling Stage**：build-plan；实现由 build-code 按现有 runtime/skill/test owner 完成。
  - **Verification**：漏掉任一 DEFER/OPEN、流程/边界/非目标或 task oracle 的反例必须被发现；显式分类并绑定去向的正例可通过。

## Implementation Order

1. **P1/T001 → T002**：先固定 workspace、dirty 和唯一创建 owner；后续所有阶段都依赖 candidate 身份。
2. **P2/T003 → T004**：再固定 make-decision 顺序、唯一 Clarify owner、Grill 交互和逐 step decision-log；build-spec/build-plan 只能消费其结果。
3. **P3/T005 → T006**：恢复 build-spec research/spec-clarify，并明确 build-code final integration 的顺序和输入。
4. **P4/T007 → T008**：在阶段边界稳定后收窄 wh-review packet、provider failure taxonomy 和 advice freshness；不重新调用旧 advice provider 只为追求空 findings。
5. **P5/T009 → T010**：锁定四材料、质量事实和宪法边界；把 build-plan 的最终 spec-analyze 顺序、输入和 DEFER/OPEN 交接校验接入现有 workflow/validator/tests。
6. **T011**：所有行为卡 GREEN 后只做一次 final aggregate；同时核对最终 spec-analyze 的当前五项输入和结果事实。build-code 阶段的真实 provider review 仍必须在最终测试与 AC trace 后执行；所有 review 都只产 advice，build-code 以当前可信结果没有重要 findings 收口，且不做无变化的无限重审。

## Dependencies and Parallelism

- **Dependencies**：P1 → P2 → P3 → P4 → P5；workspace 身份先于交互，交互 owner 先于 build-spec，阶段边界先于 review packet，治理回归最后确认不增对象/gate。
- **Parallel work**：同一 Phase 的 RED/GREEN 不并行；不同 Phase 不并行，因为它们共享当前四材料、skill deps、stage contracts 和测试 fixture。子代理只能在不重叠文件所有权的阅读/测试 lane 工作。
- **External dependencies**：Node/Git/Vitest 是本地必需能力；host-subagent、wh-review-provider 只在对应真实 review/交互测试需要时调用；缺失均记录 diagnostic/unavailable，不改写成 pass。

## Requirement and Verification Traceability

原始需求索引完整覆盖：`R-001`、`R-002`、`R-003`、`R-004`、`R-005`、`R-006`、`R-007`、`R-008`、`R-009`、`R-010`、`R-011`、`R-012`、`R-013`、`R-014`、`R-015`、`R-016`、`R-017`、`R-018`、`R-019`、`R-020`、`R-021`、`R-022`；决定索引完整覆盖：`D-001`、`D-002`、`D-003`、`D-004`、`D-005`、`D-006`、`D-007`、`D-008`、`D-009`、`D-010`、`D-011`、`D-012`、`D-013`、`D-014`、`D-015`、`D-016`、`D-017`、`D-018`；Grill 追加事实 `G-002`。

功能和验收 ID 的逐项覆盖：`FR-START-001`、`FR-START-002`、`FR-CLEANUP-001`、`FR-INTERACT-001`、`FR-INTERACT-002`、`FR-INTERACT-003`、`FR-INTERACT-004`、`FR-INTERACT-005`、`FR-DECISION-001`、`FR-REVIEW-001`、`FR-REVIEW-002`、`FR-REVIEW-003`、`FR-REVIEW-004`、`FR-REVIEW-005`、`FR-REVIEW-006`、`FR-REVIEW-007`、`FR-REVIEW-008`、`FR-REVIEW-009`、`FR-SPEC-001`、`FR-SPEC-002`、`FR-HANDOFF-001`、`FR-PLAN-001`、`FR-GOV-001`；`AC-001`、`AC-002`、`AC-003`、`AC-004`、`AC-005`、`AC-006`、`AC-007`、`AC-008`、`AC-009`、`AC-010`、`AC-011`、`AC-012`、`AC-013`、`AC-014`、`AC-015`、`AC-016`、`AC-017`、`AC-018`、`AC-019`、`AC-020`、`AC-021`、`AC-022`、`AC-023`、`AC-024`。

| Source / decision | FR | AC | Phase / Task | Depends on | Exact files | Command / oracle |
| --- | --- | --- | --- | --- | --- | --- |
| `R-001,R-002,R-003,R-004,R-005,R-013,R-014 / D-001,D-002,D-003,D-004,D-009` | `FR-START-001`, `FR-START-002`, `FR-CLEANUP-001` | `AC-001`, `AC-002`, `AC-014` | P1 / T001,T002 | none | `runtime/task/workspace.mjs`, `runtime/stage/stage-handlers.mjs`, workspace tests | P1 gate / `ORACLE-START-DIRTY` |
| `R-002,R-003,R-006,R-007,R-008,R-012,R-020,G-002 / D-002,D-005..D-007,D-012,D-013,D-016` | `FR-INTERACT-001`, `FR-INTERACT-003/004/005`, `FR-DECISION-001` | `AC-003/005/017/018/019` | P2 / T003,T004 | T002 | make-decision/talk/grill/content contracts and existing writer | P2 gate / `ORACLE-INTERACTION-ORDER` |
| `R-007,R-008,R-009,R-011,R-012 / D-006,D-007,D-008,D-011,DEFER-003,DEFER-004` | `FR-INTERACT-002`, `FR-SPEC-001/002`, `FR-HANDOFF-001` | `AC-004`, `AC-011/012/013` | P3 / T005,T006 | T004 | build-spec/build-code steps/deps, existing runtime research consumer and routing/lifecycle tests | P3 gate / `ORACLE-STAGE-HANDOFF` |
| `R-015,R-016,R-017,R-018,R-019,R-022 / D-009,D-014,D-015,D-018` | `FR-REVIEW-001..009` | `AC-006/007/008/009/010/016/020/021/023/024` | P4 / T007,T008 | T006 | wh-review packet/runner/contracts/freshness tests | P4 advice/finding closure / `ORACLE-REVIEW-FACTS` |
| `R-001,R-010 / D-001,D-010` | `FR-GOV-001` | `AC-015` | P5 / T009,T010 | T008 | governance/four-material tests | P5 gate / `ORACLE-GOV-BOUNDARY` |
| `R-021 / D-017,DEFER-009` | `FR-PLAN-001` | `AC-022` | P5 / T009,T010,T011 | T008 | build-plan steps/skill, existing spec-analyze projection/validator and contract tests | P5 report-only check / `ORACLE-GOV-BOUNDARY` |
| `R-001..R-022,G-002 / D-001..D-018,DEFER-001..009,OPEN-001..006` | all FR | all AC | final / T011 | T010 | existing full test surface plus final spec-analyze facts | `npm test` / `ORACLE-FINAL` |

### Deferred/open handoff traceability

| ID | owner/阶段 | plan/task 去向 | 结果边界 |
| --- | --- | --- | --- |
| DEFER-001 / OPEN-001 | P1 / build-plan | T001/T002 | dirty fact 字段与摘要对齐现有 validator |
| DEFER-002 | P2/P3 / build-code | T003/T004/T005/T006 | 三类真实 seam；失败 incomplete，不增 public API |
| DEFER-003 | P3 / build-spec | T005/T006 | 现有 research fact executed/skipped/unavailable |
| DEFER-004 | P3 / build-code | T005/T006 | final integration 复用 phase_id=null |
| DEFER-005 | P2/P4 / make-decision + wh-review | T003/T004/T007/T008 | 阶段顺序与 review 关注点固定，失败保持事实 |
| OPEN-002 | P3 / build-spec | T005/T006 | conditional research fact key/step_id 与现有结构对齐 |
| OPEN-003 | P4 / wh-review | T007/T008 | timeout/kill/route/coverage/group outcome 真实可读 |
| DEFER-006 | P5 / history boundary | T009/T010 | 只读证据，不改写、不重审、不产实现 task |
| OPEN-006 | P5 / history boundary | T009/T010/T011 | 历史结果不能冒充当前 snapshot |
| DEFER-007 | P4 / wh-review/runtime | T007/T008 | record-only 不重审；build-code 仍严格 |
| OPEN-005 | make-decision 收尾 / P4/P5 | T007/T008/T011 | confirmation 与 advice provenance 绑定；record-only 不重审 |
| DEFER-008 | P2/P5 / make-decision/build-plan | T003/T004/T011 | 同一 decision-log 逐 step + 最终回放 |
| DEFER-009 | P5 / build-plan | T009/T010/T011 | 最终 spec-analyze report-only；缺项 finding/incomplete |
| OPEN-004 | P1 / user-authorized cleanup | T001/T002 | 未同意不动；同意后复用 authorize |

## Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| 宪法与清单 | `CONSTITUTION.md`, `constitution-checklist.md` | no change | T009/T010 | 宪法只是绑定和逐条核对，不新增条款。 |
| 当前四材料 | `decision-log.md`, `spec.md`, `plan.md`, `tasks.md` | no change to direction/spec; plan/tasks authored by stage | T003/T005/T009/T011 | 继续使用同一权威边界，不建第五份材料；最终 analyzer 只读检查。 |
| WorkflowHub runtime | `runtime/task/workspace.mjs`, `runtime/stage/stage-handlers.mjs`, `runtime/evidence/freshness.mjs` | change | T001/T002,T007/T008 | 修复 dirty、顺序事实和 advice freshness；复用现有 facts。 |
| Stage workflows | `workflows/make-decision/**`, `workflows/build-spec/**`, `workflows/build-code/**`, `workflows/build-plan/**` | change | T003/T004,T005/T006,T009/T010 | 固定 owner、顺序、research、final integration 和最终跨材料检查。 |
| Skills and review contracts | `skills/talk-with-zhipeng/**`, `skills/grill-with-docs/**`, `skills/wh-review/**` | change | T003/T004,T007/T008 | 交互和 review 合同可搬运且不含第二控制面。 |
| 3rd-review | `external 3rd-review repository/**` | no change | T007/T008 | Kimi path conversion 属 transport owner；WorkflowHub 只保留事实。 |
| Tests | listed contract/integration tests | change | T001–T011 | 真实 RED/GREEN、最终 spec-analyze 和边界回归，不把测试变成 gate。 |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"368817c2910a36e63d3ab4642c30270abdecef15dee7caf8050e778f095919ca","id":"CONSTITUTION","version":"1.5.0","clause_count":21}`
- **F1**：`[x]` 核心只编排现有 capability；重逻辑放 runtime/skill contract，P1/P2 不造新控制面。
- **F2**：`[x]` 复用 TaskHandle、CandidateWorkspace、interaction aggregate、broker v2 和 quality namespaces，接口不暴露 provider 私有实现。
- **F3**：`[x]` 四材料仍是推进真相；publication 的 workspace、hash、顺序和 result 结构继续 fail-loud。
- **F4**：`[x]` 所有 review 都是建议事实；finding 不锁死同 task 修复，build-code 只对当前可信的 actionable major/blocking finding 做严格收口，unavailable 不改写成 pass 或无重要 finding。
- **F5**：`[x]` 只补真实发生过的 dirty、乱序、交互失真、provider 失败和 packet 膨胀问题，不预堆新 gate。
- **F6**：`[x]` 外置 facts 仍认证当次执行身份与实际内容，不把 task 永久绑定 runner path/commit。
- **F7**：`[x]` 只保留 make-decision/build-plan/verify-code 正常确认；cleanup/commit 等继续独立授权。
- **F8**：`[x]` 选择复用现有 runner、facts、allowlist、skill 和 broker，不复制 fallback/replacement 链。
- **F9**：`[x]` dirty、坏 reply、旧 provenance、PROCESS_DEAD 和缺质量事实都能真实保持 incomplete/unavailable。
- **F10**：`[x]` RED/GREEN 只验证真实风险；不新增“为了可机器校验”的永久系统。
- **Q1**：`[x]` quality/test/review 是事实，不能当开始许可证；缺项只降低完成声明。
- **Q2**：`[x]` 推进资格、publication 和完成判据分离；旧 review/空 findings/测试通过不能单独完成。
- **Q3**：`[x]` 语义 review 继续由异源 provider 产生，本地 runtime 只认证结构、身份和 provenance。
- **S1**：`[x]` 复用现有 spec-clarify、Grill、wh-review 和 3rd-review，不重造通用能力。
- **S2**：`[x]` 对外部/历史技能只做必要的 WorkflowHub 合宪改造，保留可搬运边界。
- **S3**：`[x]` Grill 上游在 2026-07-26 已检查；本次记录 pinned source unchanged，并因当前产品需要补独立 frontier batch 语义。
- **S4**：`[x]` 复用统一 quality facts/测试记录，不另起技能指标系统。
- **S5**：`[x]` 每个重 lane 可交给独立上下文；主流程只消费摘要和事实 ref。
- **S6**：`[x]` Grill 保留 Matt Pocock 来源检查结论；不因“批量”需求盲目替换上游技能。
- **S7**：`[x]` 不新增阶段；现有阶段 workflow、skill、contract 仍按目录一一对应。
- **S8**：`[x]` 技能只依赖窄输入/输出和现有 callback，未绑定某个宿主私有路径或 provider。

## Phase P1 — 启动、dirty 诊断与唯一 workspace owner

### Goal

dirty target 可以启动 task；candidate 只来自 target HEAD；只有 make-decision 入口创建/复用 worktree；wh-review 不旁路创建；用户明确同意后可以沿用现有 authorize cleanup 正确处理明确路径。

### Files

- **NEW**：N/A — 不新增文件。
- **MODIFY**：`runtime/task/workspace.mjs`、`runtime/stage/stage-handlers.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`core/__tests__/workspace-manager.test.mjs`、`tests/official-make-decision-cli.test.mjs`、`tests/contract/material-workspace.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- **DO NOT TOUCH**：`tools/cli/task-bootstrap.mjs`、`tools/cli/stage-runtime.mjs`；登记和正式入口职责已经正确。

### Tasks

- T001 RED：把 dirty target、candidate HEAD 不带入、唯一 preparation owner、review-only open、未同意不清理和明确同意 cleanup 正向路径写成失败测试。
- T002 GREEN：移除 dirty 阻止，记录现有 fact 中的只读诊断，并让 wh-review 只打开已有 workspace；复用现有 authorize cleanup 处理用户明确同意的具体路径，保留未同意/范围不明失败边界。

### Verify

ORACLE-START-DIRTY — P1 gate_cmd；RED 预期非零，GREEN 预期 0；`ORACLE-START-DIRTY` 必须同时看到 target 未被改动、candidate 基线是 HEAD、dirty 未进入、旁路 review 不创建 workspace、重复或并发 preparation 不创建第二个 workspace、未同意不清理且明确同意后只调用现有 authorize cleanup。

### Knowledge

P2 可以依赖认证 CandidateWorkspace 和明确的 target dirty fact；任何 dirty cleanup 都只能生成建议，不能自行执行。

### STOP

发现需要修改 task-bootstrap、增加持久 dirty ledger、自动 stash/commit/delete、或以 dirty 内容改变 candidate 时停止，回 `decision-log.md`/`spec.md`。

### Done

GREEN 只说明 P1 行为测试通过；没有把测试通过或 dirty 摘要当作用户清理同意，也没有声明后续 stage 已完成。

### Risks and rollback

风险是把诊断摘要误当意图，或把测试 fixture 的同意误当当前用户同意；回滚只撤销 P1 当前 runtime/CLI/test bytes，保留 target 和用户 dirty 内容。

## Phase P2 — make-decision 顺序、交互与连续 decision-log

### Goal

当前 decision-log step 表的 13 个现有 step 严格按顺序；Talk/Grill 的真实生命周期可验证；Talk 卡片用大白话解释选项、后果和风险；Clarify 不再由 make-decision 执行；现有 stage writer/handler 对每个 step 完成都更新同一 decision-log。

### Files

- **NEW**：N/A — 不新增文件。
- **MODIFY**：`workflows/make-decision/SKILL.md`、`workflows/make-decision/steps.json`、`workflows/make-decision/skill-deps.yaml`、`skills/talk-with-zhipeng/SKILL.md`、`skills/grill-with-docs/SKILL.md`、`runtime/stage/stage-content-contracts.mjs`、`tests/stage-interaction-contract.test.mjs`、`tests/interaction-quality-contract.test.mjs`、`tests/stage-decision-contract.test.mjs`、`tests/decision-log-content-contract.test.mjs`、`tests/workflow-v2-contract.test.mjs`
- **DO NOT TOUCH**：`skills/spec-clarify/SKILL.md`；它由 P3 作为 build-spec 唯一 Clarify owner 复用。

### Tasks

- T003 RED：锁定 13 step 顺序、Talk 一次一题且每个选项有大白话后果/风险、Grill 独立 frontier batch、错 reply 拒绝、Grill 非 review、逐 step decision-log 更新和真实 writer/失败返回的失败断言。
- T004 GREEN：收窄 make-decision/Talk owner，补 Grill batch/re-rank 规则和现有 content contract 校验；把实际 writer/handler 纳入接线；写入失败保持 step incomplete，不增加 ledger/gate。

### Verify

ORACLE-INTERACTION-ORDER — P2 gate_cmd；`ORACLE-INTERACTION-ORDER` 必须能证明 Talk Round 1 → research → Round 2 → direction advice → Round 3 → Grill → draft → detail advice → confirmation → publish；并证明 Talk 选项有后果/风险、13 step 都由现有 writer 更新同一 decision-log、写失败保持 incomplete、Grill 没有 provider review 身份。

### Knowledge

P3 只消费已确认的 decision-log；spec-clarify 问题不能由 make-decision 自己补写，方向问题才回 make-decision。

### STOP

发现需要新增 public ask/resume、question archive、round ledger、第二 decision log，或必须改变用户方向时停止并回当前材料。

### Done

GREEN 证明现有记录和交互合同清楚，不代表方向 review/detail review 已 pass；非 build-code advice 仍只收真实异源建议。

### Risks and rollback

风险是 aggregate 字段存在但没有真实 ask/wait/reply；回滚只撤销 P2 合同/测试，保留当前 decision-log 的真实历史事实。

## Phase P3 — build-spec research/Clarify 与 build-code final integration

### Goal

build-spec 在需要时负责条件调研和唯一 spec-clarify；现有 runtime stage consumer 真正读取 research fact；build-code 明确在最终测试与 AC trace 后执行 integration review，继续使用现有实现合同。

### Files

- **NEW**：N/A — 不新增文件。
- **MODIFY**：`workflows/build-spec/SKILL.md`、`workflows/build-spec/steps.json`、`workflows/build-spec/skill-deps.yaml`、`workflows/build-code/SKILL.md`、`workflows/build-code/steps.json`、`skills/catalog.yaml`、`runtime/stage/stage-handlers.mjs`、`tests/contract/stage-routing-and-concrete-testing.test.mjs`、`tests/contract/spec-stage-artifact-closure.test.mjs`、`tests/contract/stage-skill-invocation-contract.test.mjs`、`tests/contract/stage-completion.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`
- **DO NOT TOUCH**：`skills/spec-clarify/SKILL.md`、`runtime/evidence/requirement-ledger.mjs`；分别复用既有 skill、保持历史兼容边界。

### Tasks

- T005 RED：把 build-spec 缺 research/spec-clarify owner、research fact 没有 runtime consumer 和 build-code final integration 顺序写成失败测试。
- T006 GREEN：在现有 steps/deps/catalog/runtime consumer 里恢复唯一 owner，真正消费已有 research fact，保留 executed/skipped/unavailable 语义，并补齐最终 integration review 的输入与时点说明。

### Verify

ORACLE-STAGE-HANDOFF — P3 gate_cmd；`ORACLE-STAGE-HANDOFF` 必须断言 build-spec 不再把 Clarify 下放给 make-decision，conditional research fact 有现有 runtime consumer，build-plan 不补方向，build-code 的 integration review 复用 `phase_id=null` 而无新 gate。

### Knowledge

P4 可以按稳定 stage scope 选择 review packet；build-spec research 只复用已有 facts/materials，不需要新数据库或新 receipt 类型。

### STOP

若必须新增 research store、stage public command、completion predicate 或改写产品行为，停止回 `spec.md`，不得在 plan/tasks 中偷偷补方向。

### Done

GREEN 证明 owner/步骤/输入可观察；不把 build-spec review 说成 pass，也不把 build-code final review 之前的测试结果当最终集成结论。

### Risks and rollback

风险是将条件 research 误做成强制 gate；回滚时保留 `skipped/unavailable` 事实，不删除 provider 或历史研究事实。

## Phase P4 — wh-review 最小 packet、provider 终态与 advice freshness

### Goal

每个阶段只发送最小干净 packet，并附阶段 prompt/skill/contract 中明确的关注点、排除项和 finding 证据要求；真实 provider 失败不伪造成 findings，慢/卡/终态缺失有真实 timeout/kill/route/coverage/group outcome 分类；所有阶段只获取可信异源 advice，不要求 provider `pass`；build-code 仍严格绑定当前实现，并只在当前可信 review 没有重要 findings 后结束 review cycle。

### Files

- **NEW**：N/A — 不新增文件。
- **MODIFY**：`skills/wh-review/SKILL.md`、`skills/wh-review/contracts/provider-protocol.md`、`skills/wh-review/contracts/make-decision.md`、`skills/wh-review/contracts/build-spec.md`、`skills/wh-review/contracts/build-plan.md`、`skills/wh-review/contracts/build-code.md`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`runtime/evidence/freshness.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs`、`skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs`、`tests/contract/review-materials-contract.test.mjs`、`tests/integration/verify-freshness-selection.test.mjs`、`tests/contract/make-decision-artifact-path.test.mjs`、`tests/final-cutover-guards.red.test.mjs`、`tests/stage-review-cost-policy.test.mjs`
- **DO NOT TOUCH**：`external 3rd-review repository/**`；broker/provider adapter 的真实失败事实只在 WorkflowHub 侧如实消费。

### Tasks

- T007 RED：覆盖最小 packet、每阶段具体关注点/排除项/证据要求、logical bundle path、PROCESS_DEAD/SIGTERM/坏 JSON/transport failure/timeout/kill、真实 empty findings、route/coverage/group outcome、所有阶段 advice-only、build-code 当前重要 finding 收口、focused repair 和停止边界的失败断言。
- T008 GREEN：复用既有 packet/runner/broker，补清楚阶段语义和真实终态记录；禁止 fallback/无限 retry/伪造 findings/pass；记录性 material 变化不让 advice 失效；build-code 只在没有当前 actionable major/blocking finding 后结束，实际修复后最多按主题变化做 focused review，重复/无变化/无终态就交接；不扩大到完整仓库或重复 planning artifacts。

### Verify

ORACLE-REVIEW-FACTS — P4 gate_cmd；`ORACLE-REVIEW-FACTS` 必须同时看到阶段关注点/排除项/证据要求、route/provider/coverage/attempt/result/report/provenance、timeout/kill/group outcome，且 unavailable 不是 findings=[]、不是 review passed、不是“无重要 findings”；所有 stage 不要求 provider pass，build-code 必须能证明当前可信结果没有 actionable major/blocking finding，或诚实交接 unresolved/unavailable/incomplete。

### Knowledge

P5 只检查边界，不重新审查 unchanged advice；新的 review 只能由明确的新建议请求和实际 subject 变化/理由触发。

### STOP

若需要把完整仓库/raw logs/累计 diff 全塞入 packet，或调用方新增 provider fallback/retry/selection/lifecycle，停止并回 `D-009`/`D-015`。

### Done

GREEN 证明 review 事实诚实、包可聚焦；所有 stage 都只交付 advice fact；build-code 只有在当前可信结果没有重要 findings 时结束 review cycle，不要求 provider pass，也不因 minor advice 无限重审。

### Risks and rollback

风险是 packet 过小或 transport diagnosis 不完整；回滚只撤销 WorkflowHub 侧 skill/contract/runner 变更，保留完整 provider attempts/reports。

## Phase P5 — 宪法、四材料和非 gate 回归锁定

### Goal

用已有测试证明本方案不新增维护对象、质量 gate、public 控制面或替代材料，同时不把 review/test/history 变成推进许可证；并在 build-plan 最终 publish 前真实调用一次严格 `spec-analyze`，检查五项当前材料和全部 DEFER/OPEN 去向。

### Files

- **NEW**：N/A — 不新增文件。
- **MODIFY**：`workflows/build-plan/SKILL.md`、`workflows/build-plan/steps.json`、`skills/spec-analyze/SKILL.md`、`skills/wh-review/scripts/review-materials.mjs`、`runtime/stage/stage-content-contracts.mjs`、`tests/contract/four-material-non-gate-contract.test.mjs`、`tests/contract/repository-governance.test.mjs`、`tests/p0-foundation-contracts.test.mjs`、`tests/requirements-completeness-audit-acceptance.test.mjs`、`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/spec-stage-artifact-closure.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/contract/stage-skill-invocation-contract.test.mjs`、`quality/tests/T011-final.json`
- **DO NOT TOUCH**：`CONSTITUTION.md`、`constitution-checklist.md`、`specs/archive/**`；只读绑定和历史证据不改写。

### Tasks

- T009 RED：把新增 ledger/gate、旧历史冒充当前、provider unavailable 当 pass、四材料边界被破坏，以及 build-plan 没有在最后调用严格 `spec-analyze`、漏掉 DEFER/OPEN 的场景写成失败测试。
- T010 GREEN：修正现有 build-plan step/skill 和 spec-analyze projection/validator/test，使最终调用发生在 findings disposition 后、publish 前；补齐 R/D/FR/AC/DEFER/OPEN、流程/边界/非目标和 task oracle 检查；同时保持治理边界、质量事实非 gate、历史只读和当前材料来源真实。

### Verify

ORACLE-GOV-BOUNDARY — P5 gate_cmd；`ORACLE-GOV-BOUNDARY` 必须证明只存在四份当前材料，旧记录只读，review/test/evidence/history 不授权推进，不新增 public 入口或 quality predicate；`spec-analyze` 仍是 report-only，且最终顺序在 publish 前。

### Knowledge

T011 可以执行完整测试；任何剩余 unavailable 仍是质量事实，不被聚合命令改写为 pass；T011 同时验证最终 spec-analyze 的当前五项输入和 DEFER/OPEN 覆盖事实。

### STOP

发现只能靠新增控制面或新 gate 才能通过时停止，不扩展本任务范围。

### Done

GREEN 只证明治理回归；最终质量和 provider 事实仍由 build-code/verify-code 的既有阶段合同提供。

### Risks and rollback

风险是测试误把“结构检查通过”当“业务质量通过”；回滚只撤回断言变化，保留真实 failure evidence。

## Current build-plan review findings and dispositions

本轮 `build-plan` review 已真实调用现有 `wh-review` broker；当前 receipt/report 只作为建议事实，不是通过门槛。有效异源建议为 2 个 provider，另有 1 个 provider timeout；同源 provider 被排除，失败和 coverage 事实保留在原始 report/attempt 中。

- `F-1bf3566746c5`：`fixed`。顶层 File Boundary 补入 P5 实际会修改的 `workflows/build-plan/SKILL.md`、`workflows/build-plan/steps.json`、`skills/spec-analyze/SKILL.md`、`tests/contract/spec-analyze-completeness.test.mjs`。
- `F-5540c79bc5a0`：`rejected_invalid`。当前 canonical `plan.md` 与 `tasks.md` 的 Plan SHA 一致；provider 看到的差异来自 review packet 对绝对主机路径的脱敏，不能把脱敏后的 packet hash 写回当前材料。已将材料中的外部仓库路径改成逻辑路径，避免继续制造这个假差异。
- `F-867eba4351a0`：`fixed`。T010 的 exact files/boundary 补入它实际运行并可能调整治理断言的两个 contract test，并写清 GREEN 的修改范围。
- `F-986b0c00d317`：`fixed`。T005/T006 补上遗漏的 `FR-INTERACT-002` 和 `AC-004`。
- `F-19f0f90fb8aa`：`fixed`。T001/T002 补上重复或并发 preparation 的场景和 oracle，确认不会创建第二个 workspace。
- `F-82b7e9ab35a9`：`fixed`。plan/tasks 的 DEFER/OPEN handoff 已按 spec 拆开并逐项对齐。
- `F-acc69ca7f7f2`：`fixed`。T011 不再把后续 build-code final integration 或 verify-code handoff 当作自身测试前置输入；后续事实仍按阶段顺序交接。
- `F-b5d48a700572`：`fixed`。T011 明确为只读聚合验证，不拥有生产文件修改边界。
- `F-bdf869c1d216`：`fixed`。T009 收窄为 test-only RED；T010 明确负责 production 与其治理断言 GREEN。

本轮 review receipt 产生于 `R-022/D-018` 之前，因此不把旧 advice 解释成已经覆盖“所有 stage advice-only、build-code 无重要 findings 收口和停止边界”。这条新增需求由 T007/T008 的后续合同测试和实现接线覆盖；本次不因材料新增方向而伪造旧 review 覆盖或自动重跑。

没有把 provider timeout、invalid anchor、空 findings 或本轮建议改写成 pass；本轮只完成意见处置，后续实现阶段再按 T001–T011 的顺序执行测试和修复。

## Final current-snapshot aggregate strategy

- **tier / method**：full / `npm test`；build-code 前置执行各阶段 focused tests、最终 AC trace 和 final integration review，verify-code 再独立验证。
- **scenarios**：dirty target 启动与 cleanup consent；13-step make-decision 顺序；Talk/spec-clarify/Grill ask-wait-reply-resume；Grill batch partial/conflict；最小 packet 和 provider transport failure；record-only advice freshness；build-spec research owner；build-code final integration；四材料和无新 gate 边界。
- **command**：`npm test`
- **expected exit**：0
- **oracle**：`ORACLE-FINAL` — 全部适用 FR/AC 的契约测试、失败边界、当前 four-material binding 和现有 full test suite 均通过；provider unavailable 仍必须以 unavailable 事实存在，不被命令改写。
- **fixtures_services**：确定性本地 Vitest fixtures；真实 provider review 只在阶段 review 步骤调用；不启动额外长期服务；临时 bundle/worktree 由现有 runner cleanup。
- **evidence_path**：`quality/tests/T011-final.json`
- **coverage limits**：覆盖本任务列出的 runtime/workflow/skill/contract/test 范围；不覆盖 3rd-review 内部 adapter 实现、历史 task 修复、用户未授权 cleanup/commit/push/merge。
- **STOP**：命令损坏、AC 缺失、当前材料/hash 错绑、出现新对象/gate、provider 失败被改写或需要新产品决定时回受影响 task/材料。
- **execution_contract**：当前快照运行一次；失败保留原始输出，回受影响 task，不用全量重跑掩盖局部失败。

## Dependency Graph

- **order**：T001 (RED) → T002 (GREEN) → T003 (RED) → T004 (GREEN) → T005 (RED) → T006 (GREEN) → T007 (RED) → T008 (GREEN) → T009 (RED) → T010 (GREEN) → T011 (FINAL；含最终 spec-analyze 回放事实)

```text
T001 (RED) → T002 (GREEN) → T003 (RED) → T004 (GREEN) → T005 (RED) → T006 (GREEN) → T007 (RED) → T008 (GREEN) → T009 (RED) → T010 (GREEN) → T011 (FINAL；含最终 spec-analyze 回放事实)
```

## Final Boundary Check

- **Deletion proof**：No deletion；本任务只修改现有 WorkflowHub runtime、workflow、skill、contract 和测试，保留四份当前材料、历史事实、provider attempt/report 及既有兼容文件。
- [x] 每个 Phase 的 Goal、Files、Tasks、Verify、Knowledge、STOP、Done、Risks and rollback 完整。
- [x] 每个任务只有一张卡和一个完成区；文件是所属 Phase NEW/MODIFY 的子集。
- [x] 每个行为变化都有同命令、同 oracle 的 RED → GREEN；FINAL 只做一次聚合。
- [x] 依赖无环，FR/AC 双向追溯闭合，未知事实没有被写成假设或通过。
- [x] R/D/FR/AC 之外的 DEFER/OPEN 也必须在当前四材料和任务/非目标交接中有明确去向；最终 spec-analyze 在 publish 前执行。
- [x] review、test、evidence 只作为事实记录，不是开始、继续或交付许可证。
