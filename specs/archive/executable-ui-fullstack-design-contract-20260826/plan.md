# 实现计划：WorkflowHub 可执行的设计与体验交付合同

- **Input**：`specs/executable-ui-fullstack-design-contract-20260826/decision-log.md`（current material; historical hash retained in task cards）、`specs/executable-ui-fullstack-design-contract-20260826/spec.md`（current material; historical hash retained in task cards）
- **Template version**：`plan-task.v3`

## Quick Read

- **Goal**：让 WorkflowHub 的五阶段真正消费 Design/Experience、真实消费者、前后端数据合同和 UI QA 证据；缺失、未知、失败、过期和未执行都保持可见。
- **Non-goals**：不改 PaperBuilder，不新增第六阶段、第五份 task 材料、公共 Runner、第二状态机或永久双写（R-003、D-001、D-002、D-014、D-015）。
- 来源：R-001 至 R-006；D-001 至 D-020；N-001、N-004、N-005、N-006、N-018、N-019、N-020、N-021。N-019 指向 Downloads 治理清单中的用户纠正记录，已明确标为“错误归因，已撤销”，不是待修复缺陷。
- **Before**：UI/Design/Component/QA 多为 Skill、模板或纯函数，正式 handler 没有完整消费；Design readiness 不绑定 Experience；plan 只接受调用方填写的 consumer；browser evidence 缺少服务/API/规范/AC/oracle/观察身份；spec 生成格式与严格 analyzer 不一致；step writer 直到 bridge 才发现重叠。
- **After**：共享合同函数和现有 handler 形成单一数据链；Design 与 Experience 有内容身份、锚点和唯一 writer；影响分类、可重放 census、质量结论和后端失败边界可验证；build-code 一次性执行受控真实 QA；spec 生成与 analyzer 同合同；step 越序在写入时失败，历史失败仍如实发布为 unavailable/incomplete。
- **Main risk**：改动同时跨运行时合同、阶段 handler、证据 schema、技能文本和 host event writer；当前 review 修复还需把“旧快照 provenance + 同 task repair”与完成语义保持一致。
- **Next step**：先落地 P1 共享合同和反例测试；任何新接口无法由现有四材料、现有质量存储或当前 handler 接上时，停止并回到本计划的 owning material，不自行增加控制面。

## Technical Context

### Global Constraints

- **Verified facts**：真实入口是 `runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/evidence/stage-content-evidence.mjs` 和 `tools/cli/stage-runtime.mjs`；当前 UI 合同已有 applicability、readiness、component map 和 design-alignment 局部函数，但 handler 未形成完整消费链。阶段仍只有 make-decision、build-spec、build-plan、build-code、verify-code；当前材料仍只有 decision-log.md、spec.md、plan.md、tasks.md。
- **Language / runtime**：Node.js v24.14.0，ESM；包脚本使用 Vitest 4 风格命令，当前仓库 `npm test` 为完整回归。
- **Primary dependencies**：复用 AJV 2020 schema validator、现有 canonical evidence writer、现有 TaskKernel/ArtifactDir、Vitest 和既有 isolated-browser-qa 脚本；不引入 Figma、Storybook、Chromatic 或新测试框架。
- **Storage / state**：项目 Design.md/Experience.md 仍由项目维护；当前 task 只保存质量事实和证据；交互汇总、browser evidence、stage outcome 继续使用现有 content-addressed quality namespace；session event 继续使用现有临时 sidecar，不新建 ledger。旧 review 快照只保留 provenance；同 task 修复在现有 stage outcome 中记录 `resolved`，不新增 review loop。
- **Testing**：P1/P2/P3 使用现有 contract/e2e 测试文件的 RED/GREEN；build-plan 不执行测试。build-code 才执行 test-routing 选出的 testing skill 和一次受控真实 QA；浏览器必须按 isolated-browser-qa 的单引擎、隔离 session、前后 cleanup 规则执行。
- **Target environment**：WorkflowHub 本地 Node CLI、候选 worktree 和现有五阶段；下游 UI 项目技术栈可未知，未知必须输出 unknown，不由本任务假定 React/Next。
- **Scale / scope**：只改现有运行时、技能、模板、合同、文档和测试入口；不新增生产运行时文件，仅新增一个专门的 contract test。P1 负责共享合同，P2 负责阶段/证据接线，P3 负责 host 事件早失败。
- **Unresolved facts**：本仓库没有业务页面、Design.md 或 Experience.md，因此本任务不能产生页面截图或浏览器 PASS；build-code 对真实下游项目的服务/API/浏览器身份仍由实际 task 发现，缺失必须保留 unknown/unavailable。旧 review 的 provider 完整可用性仍按真实 transport 记录，不因 `resolved` 伪造新的 provider clean。

## Code Anchors

- **Verified anchors**：`runtime/stage/stage-content-contracts.mjs` 的 `buildUiProjectInitFact`、`deriveDesignSourceReadiness`、`validateUiApplicability`、`validateUiContract`、`validateComponentQualityMap`、`validateInteractionLifecycleSequence`、`validateSpecContentProfile`、`validatePlanTaskContract`；`runtime/stage/stage-handlers.mjs` 的五个 `HANDLERS.set` 和 `officialStageHandler`；`runtime/stage/stage-runner.mjs` 的 `validateCodeReviewOutcome`/`publishVNextStage`；`runtime/stage/completion-predicates.mjs` 的 `qualityPredicateSatisfied`；`runtime/schemas/browser-qa-evidence.v1.json`；`runtime/evidence/stage-content-evidence.mjs`；`workflows/verify-code/design-alignment.mjs` 的 `alignUiDesignEvidence`；`tools/host/workflowhub-codex-session-state.mjs` 的 `startCodexSessionEvent`/`finishCodexSessionEvent`。
- **Existing interfaces**：阶段 handler 只接收受限 `receipts`、`acceptance_coverage` 和 finding dispositions；StageContentEvidence 以 content-addressed envelope 校验 payload；browser evidence 已有 route/page/scenario/tool/session/state/viewport/fixture/component/design_revision/visual/a11y/test/cleanup；session event 已有 step/skill、open/terminal、时间戳和 evidence refs。
- **Read now**：以上运行时模块、`runtime/review/stage-materials.json`、四阶段 SKILL.md、`skills/spec-specify/templates/spec-template.md`、`skills/frontend-testing`、`skills/isolated-browser-qa` 和对应 contract tests。
- **Must read before task**：执行每张卡前只读取该卡精确文件、当前四材料和上游 RED 证据；浏览器卡必须再读取 isolated-browser-qa bundled context/doctor/cleanup 说明。
- **Context mode**：Full — 这是跨运行时合同、阶段接线、证据、模板和 host 生命周期的治理修复，Lite 会漏掉真实 consumer 和失败链。

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
| --- | --- | --- | --- |
| Design/Experience identity | extend | `stage-content-contracts.mjs` readiness helpers | 复用现有 readiness 和 quality namespace；无新存储 |
| Impact/census/quality conclusion | extend | `validateUiApplicability`、`validateUiContract` | 在同一窄合同中补证据和 unknown 语义 |
| Interaction aggregate/detail input | extend | `interactionAggregateFacts`、`runtime/task/task-kernel-implementation.mjs` | 保持一个 interaction aggregate 和一个 detail adapter；正式 writer 绑定 task/decision/confirmation |
| Spec Markdown contract | extend | `validateSpecContentProfile`、spec template | 生成和严格 analyzer 共用当前 parser 规则 |
| Browser evidence | extend | `browser-qa-evidence.v1`、StageContentEvidence | 扩展现有 schema，不新建证据类型 |
| Stage handler consumption | extend | 五个 `HANDLERS.set`、`officialStageHandler` | 让正式消费者读取已有事实，不把 Skill 文本当执行 |
| Step-order protection | extend | `startCodexSessionEvent` | 写入前检查既有 manifest 顺序；不增加状态机或 ledger |

## Solution Design

### Overview

P1 把 Design.md、Experience.md、影响分类、版本化 consumer census、前后端最小合同和质量结论做成同一组纯合同函数。规范只保存项目长期规则/场景，当前 task 只保存绑定 identity 和实际 evidence；相对路径、原始字节 hash、revision、显式 anchor 和 snapshot 是可比较身份。census producer 固定 `schema_version`、`scanner_version`、源码 snapshot、扫描配置、逐模式 `support_matrix`、稳定 `consumer_id`、枚举化 `unknown_reason` 和按 consumer_id 排序；人工补充只能以 `source=human` 追加，不能覆盖扫描项。后端合同逐层记录 API、DTO、schema/migration、persistence、consumer 的成功/失败、状态 owner、恢复、原子性和幂等边界。

P2 将这些事实接到正式阶段：build-spec/build-plan 读取规范和影响合同，build-code 的官方路径 `tools/cli/stage-runtime.mjs → runOfficialStage → officialStageHandler("build-code")` 消费 P1 合同，并对适用 UI attempt 通过现有 isolated-browser-qa 入口调用一次受控真实 QA，保存服务/API/DTO、AC、oracle、观察和 cleanup；verify-code 对当前实现做 Design/Experience/census/evidence 一致性核对。make-decision 的正式 interaction writer 在本 Phase 实现并绑定当前 task、decision、confirmation/material revision；现有浏览器 schema、stage-materials、Skill 依赖、catalog 和模板同步同一字段；纯后端不被 UI 证据拖慢。

P3 在现有 host session sidecar 写入 step 时读取声明的 `steps.json` 顺序，禁止后续 step 在前置 step open 时开始；skill 只可嵌套自己的父 step。旧重叠事件不改写，bridge 仍 fail closed，stage runtime 保留 unavailable/incomplete 事实。spec 生成器、严格 analyzer 和 detail review 的材料入口均改成同一共享合同，避免人工格式修补和非法字段运输。

### Review 修复收口（D-020）

审查结果必须保留它实际检查的快照和 provider 事实；这不等于修复后必须再拿一张名为 `clean` 的 review。verify-code 的当前 stage outcome 在同一 task 逐条记录 actionable finding 已 `fixed`/`rejected_invalid` 后，使用 `resolved` 作为当前完成状态，并把该 disposition 写入现有 `quality-fact.v1` review fact，确保进程重读仍能得到同一结论；build-code 已有的 finding-dispositions 负责处置，integration review 只需是已认证的记录。这样既不把旧 review 冒充当前快照，也不把 `clean` 变成重复审查门槛。

### Module responsibilities

#### Shared content contracts

- **Responsibility**：验证两份项目规范身份与职责、影响合同、可重放 census、后端每层成功/失败边界、质量结论、spec Markdown、交互汇总/detail 最小材料。
- **Consumes**：当前四材料、源码 snapshot、项目规范内容、现有 review/evidence refs。
- **Produces**：可序列化事实、明确状态和失败诊断，供 handler、evidence writer、review adapter 和测试使用。
- **Must not decide**：不决定产品方向、不替用户确认、不把 unknown 或 review 建议变成完成许可证。

#### Official stage handlers

- **Responsibility**：在已有五阶段入口消费共享事实并写入既有 completion/evidence 结构。
- **Consumes**：受限 receipts、当前 ArtifactDir、当前 Workspace snapshot 和共享合同结果。
- **Produces**：原有 stage outcome 的 facts、missing_items、quality conclusion 和 evidence refs。
- **Must not decide**：不新增 Runner、阶段、第五材料或第二状态机；不以 Skill 解析代替真实调用。

#### Evidence and skill adapters

- **Responsibility**：让 schema、Skill、catalog、review material、template 与正式 consumer 表达同一接线事实。
- **Consumes**：共享字段名、现有 canonical envelope 和真实执行输入。
- **Produces**：浏览器/交互/review 可验证 payload 与可搬运说明。
- **Must not decide**：不把 fixture-only、旧 evidence、缺 service identity 或未执行依赖改成 covered。

#### Host event writer

- **Responsibility**：在 `startCodexSessionEvent` 写入前拒绝同 stage 越序 step。
- **Consumes**：当前 session、stage manifest、父 step/skill identity。
- **Produces**：成功的合法 open event，或不写入的明确 sequence error。
- **Must not decide**：不删除、排序、改时间或修复历史非法事件。

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：共享合同函数均在现有 `runtime/stage/stage-content-contracts.mjs` 导出；make-decision writer 由 `runtime/task/task-kernel-implementation.mjs` 的现有 `prepareMakeDecisionInteractionPublication` / `completeMakeDecisionInteractionPublication` 接口承载；browser payload 继续 `browser-qa-evidence.v1`；interaction 继续 `workflowhub-interaction-aggregate.v1`；session event 继续既有 sidecar schema。
- **Data flow / state**：raw requirement → impact classification → Design/Experience identity/read map → deterministic census → selected contract → stage evidence/handler → quality conclusion。重试创建新 invocation/evidence；旧失败不覆盖。规范写入仅由 build-code 在规则/体验真实变化时执行；verify-code 只验证。
- **API contract**：本任务没有产品 API；后端合同的 API、DTO、schema/migration、persistence、consumer 层以版本化输入事实记录每层成功结果、失败结果、状态 owner、恢复动作、迁移原子性、部分提交可观察状态和幂等键/不支持幂等原因；unknown/不支持必须 fail-loud。fullstack fixture 必须证明真实请求→DTO→schema/persistence→consumer read-back 的绑定，不以字段存在代替端到端成功。
- **UI / external code**：本任务没有 WorkflowHub 业务页面；下游 UI 通过 Experience 场景和当前 browser evidence 绑定真实 route/page/state/viewport/keyboard/a11y/visual/performance。
- **Fail-loud behavior**：缺 identity、非法字段、未知 consumer、service/API mismatch、oracle/cleanup 失败、未允许 detail 字段、spec 格式不兼容或 step 越序都返回明确错误/unknown/incomplete，不默认补值。

## UI Delivery Contract (仅 UI phase/task 使用)

- **UI applicability**：`unknown` — WorkflowHub 仓库无业务 UI；本任务实现的是 UI 治理合同，不能伪造下游页面适用性。
- **Component action**：`extend-state-or-variant` — 扩展现有 readiness/component/evidence 合同；真实页面组件消费者由下游 build-code census 提供。
- **Real consumer**：`unknown — current repository has no business page; formal consumers are stage handlers, evidence validators, and downstream UI tasks`。
- **State owner**：共享合同函数和 stage handler；下游页面 state owner 由 Component Quality Map 记录。
- **Typed ViewModel**：现有 evidence/contract objects 的结构化字段；下游真实页面 adapter 未知，不擅自假定框架。
- **CSS/token owner**：`N/A — reason: this task changes WorkflowHub governance contracts, not product CSS`。
- **Fixture / viewport**：`N/A — reason: no in-scope WorkflowHub page or preview host`。
- **Browser / a11y / performance**：build-code 下游按 isolated-browser-qa；本任务只验证 evidence contract 和 handler seam，不宣称浏览器结果。
- **Screenshot handoff**：`unknown — no WorkflowHub business page; preserve preview/screenshot unavailable`。
- **Coverage limits**：不覆盖下游框架视觉效果、真实 API 运行、浏览器截图或性能数值；只覆盖合同、接线和失败语义。
- **N/A / unknown reason**：项目没有业务页面，所有页面事实由下游 task 提供；缺失不等于 non_ui 或 pass。

### Design-gap handoff (不改变 Design.md 权威)

- **design_status**：`unknown` — 本仓库没有项目 Design.md/Experience.md。
- **missing_items / reason**：[`DESIGN-SOURCE-MISSING`, `EXPERIENCE-SOURCE-MISSING`, `PREVIEW-UNAVAILABLE`]；本任务只修复消费合同。
- **fallback_visual_basis**：`N/A — no WorkflowHub product page`。
- **constraints / assumptions**：Design 只管视觉/组件；Experience 只管页面/交互/长期场景；当前运行结果只进 task evidence。
- **rework_risk / human_confirmation**：下游项目若规范缺失、identity 漂移或 census unknown，必须返工或保留 incomplete；不得由本任务代确认。
- **current_material_ref / design_revision**：当前四材料由 task artifact ref 绑定；Design/Experience revision 为 `unknown`。
- **visible_labels**：`N/A — no in-scope page`。
- **preview_refs / fixture_refs / viewport_refs / screenshot_refs**：均为 `unknown — no preview host`。
- **responsive / a11y**：下游 Experience/QA 每个状态分别记录窄视口、溢出、焦点、键盘、语义和错误关联；本任务只保证这些字段不可静默丢失。

## File Boundary

### NEW

- `tests/contract/make-decision-interaction-publication.test.mjs` — contract/integration coverage only; no production authority

### MODIFY

- `runtime/stage/stage-content-contracts.mjs`
- `runtime/task/task-kernel-implementation.mjs`
- `runtime/stage/stage-handlers.mjs`
- `runtime/stage/stage-runner.mjs`
- `runtime/stage/completion-predicates.mjs`
- `runtime/evidence/quality-fact.mjs`
- `runtime/evidence/freshness.mjs`
- `runtime/schemas/quality-fact.v1.json`
- `runtime/schemas/browser-qa-evidence.v1.json`
- `runtime/evidence/stage-content-evidence.mjs`
- `runtime/review/stage-materials.json`
- `tools/host/workflowhub-codex-session-state.mjs`
- `skills/ui-project-init/SKILL.md`
- `skills/design-source-readiness/SKILL.md`
- `skills/frontend-component-quality/SKILL.md`
- `skills/frontend-testing/SKILL.md`
- `skills/isolated-browser-qa/SKILL.md`
- `skills/spec-specify/SKILL.md`
- `skills/spec-specify/templates/spec-template.md`
- `skills/spec-tasks/templates/tasks-template.md`
- `skills/spec-plan/templates/plan-template.md`
- `skills/spec-plan/skill-bundle.json`
- `skills/spec-tasks/skill-bundle.json`
- `skills/spec-specify/skill-bundle.json`
- `skills/frontend-testing/skill-bundle.json`
- `skills/isolated-browser-qa/skill-bundle.json`
- `workflows/build-spec/SKILL.md`
- `workflows/build-plan/SKILL.md`
- `workflows/build-code/SKILL.md`
- `workflows/verify-code/SKILL.md`
- `workflows/verify-code/design-alignment.mjs`
- `skills/catalog.yaml`
- `skills/reuse-registry.md`
- `tools/architecture/verify-final-coverage.mjs`
- `tools/cli/verify-structure.mjs`
- `tests/contract/ui-stage-integration.test.mjs`
- `tests/contract/ui-frontend-governance.test.mjs`
- `tests/stage-interaction-contract.test.mjs`
- `tests/contract/spec-analyze-completeness.test.mjs`
- `tests/contract/review-materials-contract.test.mjs`
- `tests/contract/stage-routing-and-concrete-testing.test.mjs`
- `tests/contract/phase-quality-handoff.test.mjs`
- `tests/contract/workflow-quality-regression.test.mjs`
- `tests/contract/stage-interaction-batching.test.mjs`
- `tests/contract/stage-order-and-host-interaction.test.mjs`
- `tests/e2e/vnext-five-stage-current.test.mjs`
- `tests/contract/stage-completion.test.mjs`
- `tests/integration/verify-freshness-selection.test.mjs`
- `tests/stage-plan-task-contract-v3.test.mjs`
- `tests/contract/filled-plan-task-production.test.mjs`
- `tests/contract/verify-final-coverage.test.mjs`
- `tests/contract/confirmation-authorization.test.mjs`
- `tests/final-cutover-guards.red.test.mjs`
- `tests/helpers/stage-outcome.mjs`
- `tests/stage-plan-task-contract.test.mjs`
- `tests/stage-risk-acceptance.test.mjs`
- `tests/per-invocation-doc-contract.test.mjs`

### DO NOT TOUCH

- `runtime/stage/stage-agent-outcome-adapter.mjs` — candidate worktree already contains unrelated WIP.
- `tests/integration/vnext-official-stage-run.test.mjs` — preserve unrelated WIP and existing integration baseline.
- `tools/host/workflowhub-stage-agent-bridge.mjs` — bridge must continue fail-closed on historical overlap; fix the writer before it.
- PaperBuilder repositories and product files — explicitly outside R-003/D-001.

## Technical Decisions

### DEC-001 — 复用现有合同和质量存储

- **Problem**：局部 UI/QA 能力没有进入正式 consumer，继续增加 Skill 或第五材料会扩大漂移。
- **Options**：复制一套 UI workflow；扩展现有 stage-content/evidence/handler；把判断留给人工文本。
- **Selected**：extend existing contracts and handlers。
- **Reason**：现有 namespace、ArtifactDir、stage outcome 和 pure validators 已是唯一真实接线，扩展最少。
- **Consequence / risk**：共享模块变大，必须用窄导出和 focused contract tests 控制回归。
- **Fallback**：发现接口无法复用时只保留 unknown/incomplete 并回到本 task owning material，不新建存储。
- **F10 disposition**：keep

### DEC-002 — Design.md 与 Experience.md 分工互补

- **Problem**：单一简陋 Design.md 无法同时承载视觉规则和页面交互，双写又会漂移。
- **Options**：继续一份简陋 Design；把交互塞入 Design；项目唯一 Design + 项目唯一 Experience。
- **Selected**：extend the existing readiness/component contract with two project-level sources。
- **Reason**：Design 只管原则/token/组件/视觉状态；Experience 只管页面/流转/状态/长期场景；各自有 identity 和唯一 writer。
- **Consequence / risk**：旧项目要迁移缺失条目，缺失期间为 incomplete/unknown。
- **Fallback**：只有既有 Design 时先 bound current，Experience 缺失明确交接，不生成假场景。
- **F10 disposition**：keep

### DEC-003 — 受控真实 QA 复用 build-code

- **Problem**：fixture、Skill 文本和旧 invocation 被误当成真实页面验收。
- **Options**：新增 Runner/QA 阶段；在 build-code handler 内调用一次既有 isolated-browser-qa；只做静态截图。
- **Selected**：extend build-code handler and browser evidence。
- **Reason**：满足一次实际调用、重试新 invocation、服务/API/AC/oracle/cleanup 绑定，同时不增 public object/stage。
- **Consequence / risk**：下游服务不可用时质量仍 incomplete；浏览器成本留在真实 UI task。
- **Fallback**：只保留 blocked/unknown evidence 和恢复入口，禁止 fixture-only 升级。
- **F10 disposition**：keep

### DEC-004 — spec 生成和严格分析共享一个 Markdown 合同

- **Problem**：spec-specify 输出与 strict spec-analyze 的换行/列表语法不同，主 agent 被迫手工修补。
- **Options**：放宽 analyzer；继续人工改写；抽出共享格式定义并让模板/生成/validator 同源。
- **Selected**：extend existing spec content profile and template contract。
- **Reason**：保留严格 fail-loud，同时把合法格式提前约束到生产端。
- **Consequence / risk**：旧格式会出现 RED；必须在测试中明确迁移或拒绝，不可静默兼容。
- **Fallback**：旧格式明确 RED 并给迁移提示，不改变已有历史材料。
- **F10 disposition**：keep

### DEC-005 — writer 早失败，不修历史事件

- **Problem**：step 越序直到 bridge 才发现，发布失败晚且诊断差。
- **Options**：在 bridge 排序修历史；另建事件 ledger；在现有 start writer 读取 manifest 并拒绝越序。
- **Selected**：extend `startCodexSessionEvent`。
- **Reason**：一处早失败即可阻止新坏数据；历史 sidecar 和 bridge 语义保持不变。
- **Consequence / risk**：旧 session 仍不可发布，必须保留 unavailable/incomplete；新 session 需要严格按 manifest 记录。
- **Fallback**：非法 start 不写入；用户可在同一 task 新建合法 attempt，不能改旧事件。
- **F10 disposition**：keep

### DEC-006 — constitution clause snapshot 显式同步

- **Problem**：`CONSTITUTION.md`/checklist 已含 F11/22 条，但 runtime validator 的 current snapshot 仍 21 条。
- **Options**：忽略差异；删除 F11；同步 validator、模板测试和文档引用到真实 22 条。
- **Selected**：extend current clause snapshot and regression tests。
- **Reason**：这是实际治理漂移；同步一个现有常量和测试，比再造 gate 更小。
- **Consequence / risk**：旧计划若只列 21 条会在实现后失败；运行时、当前检查、计划模板、测试和 Skill Bundle/catalog 现已按真实 22 条及实际快照同步，后续只需保持同一源文件计数。
- **Fallback**：在 P2 不能安全同步时保持差异为明确 open risk，不伪造 clause_count。
- **F10 disposition**：keep

## Test Strategy

设计 RED/GREEN，不在 build-plan 执行命令。每对使用同一命令、同一 oracle identity 和 task-relative evidence path。

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
| --- | --- | --- | --- | --- |
| FR-DOC-001..004、FR-CON-001/002/004/005、FR-REL-001、AC-001..006、AC-008/009、AC-013、AC-016..018 | T001 | RED | historical `node --test tests/contract/ui-stage-integration.test.mjs tests/contract/ui-frontend-governance.test.mjs` / non-zero | ORACLE-P1-CONTRACT：身份、职责、census、影响、aggregate 生命周期和 unknown 反例先失败；`quality/tests/plan/P1-T001-red.json` |
| FR-DOC-001..004、FR-CON-001/002/004/005、FR-REL-001、AC-001..006、AC-008/009、AC-013、AC-016..018 | T002 | GREEN | `node --test tests/contract/ui-stage-integration.test.mjs tests/contract/ui-frontend-governance.test.mjs` + source-pinned Vitest lifecycle slice / 0 | ORACLE-P1-CONTRACT：同一负例保持失败语义，正例通过；`quality/tests/plan/P1-T002-green.json` |
| FR-CON-003、AC-008、AC-021 | T003 | RED | historical `node --test tests/contract/ui-stage-integration.test.mjs tests/contract/ui-frontend-governance.test.mjs` / non-zero | ORACLE-P1-DATA-CONTRACT：真实请求→DTO→schema/migration→persistence→consumer 回读、层级失败、状态 owner、恢复和幂等反例先失败；`quality/tests/plan/P1-T003-red.json` |
| FR-CON-003、AC-008、AC-021 | T004 | GREEN | `node --test tests/contract/ui-stage-integration.test.mjs tests/contract/ui-frontend-governance.test.mjs` + source-pinned Vitest lifecycle slice / 0 | ORACLE-P1-DATA-CONTRACT：成功回读可绑定，失败/部分提交/不兼容/不可重试仍准确降级；`quality/tests/plan/P1-T004-green.json` |
| FR-QA-001..004、FR-REL-002、FR-GOV-001..003、AC-007、AC-010..012、AC-014/015、AC-019/020/022 | T005 | RED | `npm exec vitest run tests/contract/review-materials-contract.test.mjs tests/contract/make-decision-interaction-publication.test.mjs tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/phase-quality-handoff.test.mjs tests/contract/workflow-quality-regression.test.mjs tests/e2e/vnext-five-stage-current.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / non-zero | ORACLE-P2-WIRING：handler 实际消费、QA identity、spec 同合同、detail 禁止字段、治理清单和 dependency/test 接线反例先失败；`quality/tests/plan/P2-T005-red.json` |
| FR-QA-001..004、FR-REL-002、FR-GOV-001..003、AC-007、AC-010..012、AC-014/015、AC-019/020/022 | T006 | GREEN | `npm exec vitest run tests/contract/review-materials-contract.test.mjs tests/contract/make-decision-interaction-publication.test.mjs tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/phase-quality-handoff.test.mjs tests/contract/workflow-quality-regression.test.mjs tests/e2e/vnext-five-stage-current.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / 0 | ORACLE-P2-WIRING：正式 consumer、writer replay/conflict、QA 成功/失败身份和 blocked/unknown/fixture-only 负例均保留；`quality/tests/plan/P2-T006-green.json` |
| FR-REL-003、AC-023 | T007 | RED | `npm exec vitest run tests/contract/stage-interaction-batching.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / non-zero | ORACLE-P3-EVENT-ORDER：后续 step 在前置 open 时 start 的断言先失败，历史 overlap 仍 fail-closed；`quality/tests/plan/P3-T007-red.json` |
| FR-REL-003、AC-023 | T008 | GREEN | `npm exec vitest run tests/contract/stage-interaction-batching.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / 0 | ORACLE-P3-EVENT-ORDER：非法 start 不写入并给 sequence error，合法父子 skill 和历史 unavailable 语义保持；`quality/tests/plan/P3-T008-green.json` |
| D-020 review repair completion semantics | same-task correction | GREEN | `node /Users/Hugh/Hugh/Project/workflowhub/node_modules/vitest/vitest.mjs run tests/contract/stage-completion.test.mjs tests/integration/verify-freshness-selection.test.mjs --config /Users/Hugh/Hugh/Project/workflowhub/vitest.config.mjs --poolOptions.forks.singleFork --no-fileParallelism` / 0 | ORACLE-REVIEW-REPAIR：`resolved` 可完成且可在 fresh read 重放，未处置 finding 仍不完成；旧 review 快照只保留 provenance，不产生 clean/re-review gate |

## Build-plan review findings and dispositions

- **Review fact**：independent `wh-review` returned `available` with 10 findings（8 major、2 minor）；result/report/attempt refs remain immutable in `quality/reviews/`. This is review advice and evidence, not a pass or delivery gate.
- **F1 fixed**：T009 now uses the focused current-task command and explicitly excludes protected integration WIP from the hard oracle.
- **F2 fixed**：removed the duplicate Quick Read source declaration.
- **F3 fixed**：bound make-decision aggregate publication to the existing kernel writer and added a dedicated publication contract test covering task/decision/confirmation identity, replay, content conflict, and missing binding.
- **F4 fixed**：made the census producer versioned and reproducible (`schema_version`, `scanner_version`, source snapshot/config, support matrix, stable `consumer_id`, enumerated `unknown_reason`, deterministic sort, and human append semantics) with RED/GREEN coverage.
- **F5 fixed**：moved the interaction contract producer/test into P1 and kept the protected host bridge out of scope.
- **F6 fixed**：moved `tests/contract/spec-analyze-completeness.test.mjs` to P2 with the template/handler wiring it verifies.
- **F7 fixed**：specified the official build-code path, existing isolated-browser-qa adapter, service/API identity, cleanup, retry, cancel, mismatch, fixture-only, and unavailable/unknown outcomes; no new Runner/object is introduced.
- **F8 fixed**：removed unbound `CONTEXT.md` and `THIRD_PARTY_NOTICES.md` modifications from the file boundary.
- **F9 fixed**：added an independent P1 backend/fullstack pair covering API→DTO→schema/migration→persistence→consumer read-back, owner/recovery, atomicity, partial commit, incompatibility, and idempotency.
- **F10 fixed**：AC-020 now has concrete governance-file fields, append-only, and “runtime does not derive state from the file” assertions in T005/T006.
- **Disposition rule**：no finding is silently dropped; provider/transport failures and unavailable attempts remain facts. Any remaining open item is handled by the explicit risk/STOP rules above, not by weakening the oracle.

## Rollback and Recovery

- **Global recovery rule**：只回滚当前实现文件，保留 decision-log/spec、已确认方向和所有既有质量事实；不删除、重排或改写历史 session/evidence。
- **Irreversible boundaries**：本计划不授权 commit、push、merge、archive 或 cleanup；这些操作仍需独立 authorization。
- **Recovery owner**：当前 task owner 按受影响 Phase 回到对应 RED/材料；若旧 session 已 overlap，先记录 unavailable/incomplete，再用新合法 invocation 继续。

### Engineering Risk Handoff

- **PLAN-RISK-001**：共享合同过宽导致 handler 继续只读文本。
  - **Affected IDs**：PFACT-01、FR-DOC-001..004、FR-CON-001..005、AC-001..009、AC-016..018、AC-021、T001/T002/T003/T004。
  - **Trigger**：测试只检查 Skill/字段存在，没有调用纯合同和正式 handler。
  - **Consequence**：继续出现“声明已接入、正式结果未消费”。
  - **Mitigation or STOP**：RED/GREEN 必须断言函数输出和 handler invocation；若消费者无法定位，停止扩展并保留 unknown。
  - **Handling Stage**：build-code / verify-code
  - **Verification**：ORACLE-P1-CONTRACT 与 P2 handler integration negative fixtures。
- **PLAN-RISK-002**：下游项目没有规范或页面，QA 事实不可观察。
  - **Affected IDs**：PFACT-03、FR-DOC-001/002、FR-QA-001/002、AC-001/003/010/011。
  - **Trigger**：Design/Experience、服务/API、preview 或浏览器缺失。
  - **Consequence**：误报 covered 或把缺失当 non_ui。
  - **Mitigation or STOP**：输出 missing/unknown/unavailable，绑定原因和恢复入口；不伪造 screenshot/性能。
  - **Handling Stage**：build-code / verify-code
  - **Verification**：browser schema blocked/unknown tests、最终 census/evidence freshness。
- **PLAN-RISK-003**：spec Markdown 旧格式与严格 analyzer 迁移失败。
  - **Affected IDs**：PFACT-07、FR-GOV-003、AC-007/022、T005/T006。
  - **Trigger**：模板、生成器和 analyzer 各自维护格式。
  - **Consequence**：阶段结束靠人工改写，或 analyzer 被放宽而吞掉错误。
  - **Mitigation or STOP**：共享 formatter/profile；旧格式 RED，新的生成结果直接进入 strict analyzer GREEN。
  - **Handling Stage**：build-code / verify-code
  - **Verification**：spec generator → strict analyzer same revision test。
- **PLAN-RISK-004**：detail review 输入继续混入未允许语义字段。
  - **Affected IDs**：PFACT-06、FR-REL-002、AC-014、T005/T006。
  - **Trigger**：调用方绕过最小模板或错误复用 direction 字段。
  - **Consequence**：provider 被错误 dispatch，真实 transport 事实丢失。
  - **Mitigation or STOP**：入口先做 allowlist/required validation，MATERIAL_INCOMPLETE/MATERIAL_FORBIDDEN 均不 dispatch。
  - **Handling Stage**：build-code / verify-code
  - **Verification**：review-materials contract negative/positive fixtures。
- **PLAN-RISK-005**：当前 constitution runtime snapshot 与 22 条源文件继续漂移。
  - **Affected IDs**：F11、FR-GOV-001/003、AC-007/015/022、DEC-006、T005/T006。
  - **Trigger**：只改文档或只改常量。
  - **Consequence**：后续 plan/verify 产生结构误判。
  - **Mitigation or STOP**：P2 同步常量、测试和说明；在同步前将差异标记为 open，不写假 clause_count。
  - **Handling Stage**：build-plan / build-code
  - **Verification**：constitution clause count regression。
- **PLAN-RISK-006**：历史 session 已存在重叠事件，早失败修复不能让本次发布自动变绿。
  - **Affected IDs**：PFACT-08、FR-REL-003、AC-023、T007/T008。
  - **Trigger**：旧 sidecar 继续交给 bridge。
  - **Consequence**：stage outcome 仍 unavailable/incomplete。
  - **Mitigation or STOP**：不改历史；保留 offending event 和 bridge error，使用新合法 attempt。
  - **Handling Stage**：build-code / verify-code
  - **Verification**：历史 overlap fixture 保持 fail-closed，合法新顺序 GREEN。

## Implementation Order

先做 P1 共享合同和测试，再做 P2 阶段 handler/证据/技能接线，最后做 P3 host writer 早失败；P2 必须串行依赖 P1，因为 handler 读取 P1 的 identity/census/quality 结果；P3 可只在 P2 接口稳定后落地，因为 stage runtime 需要最终事件语义。每个 Phase 的 RED 先于 GREEN，最终 aggregate 只读所有事实。

## Dependencies and Parallelism

- **Dependencies**：P1 → P2（共享合同先于 handler/证据 consumer）；P2 → P3（阶段接线和当前 stage outcome 语义先稳定，host writer 才能绑定准确失败交接）；每个 RED → 对应 GREEN（测试必须先证明缺口）。
- **Parallel work**：同一 Phase 内不并行修改同一文件；文档/Skill 可与纯测试编写并行，但必须在对应 RED 后合并。禁止让多个任务同时改 `stage-content-contracts.mjs`。
- **External dependencies**：Node 24、Vitest、现有 AJV 和 isolated-browser-qa scripts；下游服务、浏览器和项目规范属于 build-code 运行时输入，缺失为 unknown/unavailable，不作为 build-plan 假设。

## Requirement and Verification Traceability

| Source / decision | FR | AC | Phase / Task | Depends on | Exact files | Command / oracle |
| --- | --- | --- | --- | --- | --- | --- |
| R-001/R-002; D-004/D-013/D-016 | FR-DOC-001..004 | AC-001..004/016 | P1/T001→T002 | none | `runtime/stage/stage-content-contracts.mjs`, `skills/ui-project-init/SKILL.md`, `skills/design-source-readiness/SKILL.md` | P1 command / ORACLE-P1-CONTRACT |
| D-007/D-008/D-012 | FR-CON-001/002/004/005 | AC-005/006/008/009/017/018 | P1/T001→T002 | none | `runtime/stage/stage-content-contracts.mjs`, `tests/contract/ui-stage-integration.test.mjs` | P1 command / ORACLE-P1-CONTRACT |
| D-003/D-007 | FR-CON-003 | AC-008/021 | P1/T003→T004 | P1/T002 | `runtime/stage/stage-content-contracts.mjs`, `tests/contract/ui-stage-integration.test.mjs` | P1 command / ORACLE-P1-DATA-CONTRACT |
| D-011/D-019; N-001 | FR-REL-001 | AC-013 | P1/T001→T002 | none | `runtime/stage/stage-content-contracts.mjs`, `tests/stage-interaction-contract.test.mjs` | P1 command / ORACLE-P1-CONTRACT |
| D-006/D-009/D-019 | FR-GOV-001..003 | AC-007/015/020/022 | P2/T005→T006 | P1/T004 | `runtime/stage/stage-handlers.mjs`, `runtime/review/stage-materials.json`, `skills/spec-specify/SKILL.md`, `skills/spec-specify/templates/spec-template.md` | P2 command / ORACLE-P2-WIRING |
| D-014/D-015/D-018 | FR-QA-001..004 | AC-010/011/012/019 | P2/T005→T006 | P1/T004 | `runtime/schemas/browser-qa-evidence.v1.json`, `runtime/evidence/stage-content-evidence.mjs`, `workflows/build-code/SKILL.md`, `workflows/verify-code/design-alignment.mjs` | P2 command / ORACLE-P2-WIRING |
| N-004/D-019 | FR-REL-002 | AC-014 | P2/T005→T006 | P1/T004 | `runtime/review/stage-materials.json`, `tests/contract/review-materials-contract.test.mjs` | P2 command / ORACLE-P2-WIRING |
| N-006/D-019 | FR-REL-003 | AC-023 | P3/T007→T008 | P2/T006 | `tools/host/workflowhub-codex-session-state.mjs`, `tests/contract/stage-order-and-host-interaction.test.mjs` | P3 command / ORACLE-P3-EVENT-ORDER |
| R-003/D-001 | non-goal | AC-005/020 | P3/T009 | P1/T004,P2/T006,P3/T008 | all boundary files | focused task regression / ORACLE-FINAL |

## Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| Runtime contracts/handlers | `runtime/stage/stage-content-contracts.mjs`, `runtime/stage/stage-handlers.mjs` | change | T001–T006 | Formal consumer must use facts |
| Review completion semantics | `runtime/stage/stage-runner.mjs`, `runtime/stage/completion-predicates.mjs` | change | same-task D-020 correction | Preserve old review provenance; allow repaired findings to resolve without a clean re-review |
| Make-decision writer | `runtime/task/task-kernel-implementation.mjs` | change | T005–T006 | Bind one aggregate to task/decision/confirmation and test replay/conflict |
| Evidence schemas | `runtime/schemas/browser-qa-evidence.v1.json`, `runtime/evidence/stage-content-evidence.mjs` | change | T005–T006 | Evidence identity and failure semantics |
| Stage/skill workflows | `workflows/build-spec/SKILL.md`, `workflows/build-plan/SKILL.md`, `workflows/build-code/SKILL.md`, `workflows/verify-code/SKILL.md` | change | T005–T006 | Skill declaration must match handler execution |
| UI skills/templates | `skills/ui-project-init/SKILL.md`, `skills/design-source-readiness/SKILL.md`, `skills/frontend-component-quality/SKILL.md`, `skills/frontend-testing/SKILL.md`, `skills/isolated-browser-qa/SKILL.md`, `skills/spec-specify/SKILL.md`, `skills/spec-specify/templates/spec-template.md`, `skills/spec-tasks/templates/tasks-template.md` | change | T001–T006 | Design/Experience, QA and task-template source-of-truth rules |
| Review/catalog | `runtime/review/stage-materials.json`, `skills/catalog.yaml`, `skills/reuse-registry.md` | change | T005–T006 | Owner/consumer/deletion and declared-vs-executed facts |
| Constitution/current checks | `tools/architecture/verify-final-coverage.mjs`, `tools/cli/verify-structure.mjs`, `tests/stage-risk-acceptance.test.mjs`, `tests/per-invocation-doc-contract.test.mjs`, `tests/contract/verify-final-coverage.test.mjs`, `tests/contract/confirmation-authorization.test.mjs`, `tests/final-cutover-guards.red.test.mjs`, `tests/helpers/stage-outcome.mjs`, `tests/stage-plan-task-contract.test.mjs` | change | same-task N-020 sync | Current v1.6.0/22-clause source must not be rejected by active validators; no new gate is introduced |
| Skill Bundle integrity | `skills/spec-plan/templates/plan-template.md`, `skills/spec-plan/skill-bundle.json`, `skills/spec-tasks/templates/tasks-template.md`, `skills/spec-tasks/skill-bundle.json`, `skills/spec-specify/skill-bundle.json`, `skills/frontend-testing/skill-bundle.json`, `skills/isolated-browser-qa/skill-bundle.json` | change | same-task N-020 sync | Hashes and current templates follow the existing closure consumer; no new bundle or runtime object |
| Host lifecycle | `tools/host/workflowhub-codex-session-state.mjs` | change | T007–T008 | Reject new step overlap at write time |
| Contract/e2e tests | listed `tests/contract/*`, `tests/stage-interaction-contract.test.mjs` and `tests/e2e/vnext-five-stage-current.test.mjs` | change | T001–T009 | RED/GREEN and final seam proof |
| Protected bridge/integration WIP | `tools/host/workflowhub-stage-agent-bridge.mjs`, `tests/integration/vnext-official-stage-run.test.mjs` | no change | all | Preserve unrelated WIP and fail-closed history |
| Downloads governance input | `/Users/Hugh/Downloads/workflowhub-governance-capability-issues-20260826.md` | no change in plan | all | Already updated in make-decision; build-code appends only new facts |

### N-020 治理同步收口（同一 task，不新增 phase/material）

宪法当前基准是 v1.6.0、22 条。审计发现少数仍在使用的结构检查、计划模板、任务模板、测试和 Skill Bundle 快照还停留在 21 条、旧 hash 或会被 validator 拒绝的标题层级；这会把合法 F11、合法完成卡或已修改的技能误判成漂移。已在现有消费者内同步真实条目数、F11、模板层级、bundle 文件 hash、catalog hash 和本地来源快照，并通过 `check-skill-closure`、`verify-structure` 与 `verify-final-coverage --governance` 复核。该同步不增加 gate、Runner、公共命令、阶段、材料或持久状态；历史 21 条材料只读保留。

N-021 的任务模板标题层级也在同一同步内修正：UI 可选区属于任务卡内部，使用 `#####` 与完成区同级，避免结构校验制造假阻塞。

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"dff42267e6d91ebee604607d2017f241d08fe6d885468727c1049c05eff64097","id":"CONSTITUTION","version":"1.6.0","clause_count":22}`
- **F1**：共享合同只做窄验证和汇总，重活仍在技能/handler边界。
- **F2**：identity、census、evidence、event 都通过现有结构化接口。
- **F3**：四材料仍决定继续；结构错误在 writer/handler publication 前 fail-loud。
- **F4**：review 仍是异源事实；finding 只修复或承担风险，不是编码 gate。
- **F5**：只补已经发生的 identity、spec 格式和 event overlap 缺口，不新增普遍 gate。
- **F6**：调用 identity 与 task identity 分离，session sidecar 仍是外置执行记录。
- **F7**：不把本计划确认或阶段事实授权给 commit/push/merge/archive/cleanup。
- **F8**：优先扩展已有合同、schema、handler 和测试，不造 Runner/ledger。
- **F9**：未知、失败、过期、缺失和历史 overlap 均有可证伪输出。
- **F10**：只同步一个已有 clause snapshot 和必要回归，不建设自动化平台。
- **Q1**：质量事实不当准入证；浏览器和 review 缺失降低结论。
- **Q2**：材料推进、结构发布和质量完成保持分离。
- **Q3**：独立 wh-review、testing skill 和人工确认各自保留来源。
- **S1**：复用现有 isolated-browser-qa、AJV、Vitest 和 stage contracts。
- **S2**：技能只按 WorkflowHub 合同补齐 owner/consumer/unknown 语义。
- **S3**：模板、catalog、registry 和上游来源同步检查。
- **S4**：新增合同事实均由 contract tests 和 stage evidence 记录。
- **S5**：技能保持可独立调用，主阶段只消费结构化结果。
- **S6**：规范和 QA 规则吸收成熟组件/浏览器实践，但不绑定特定平台。
- **S7**：仍是一阶段一技能一工作流一目录，不新增阶段。
- **S8**：所有扩展在现有 portable ESM/Markdown/schema 边界内，可跨宿主搬运。

> **F11**：正常执行优先；本任务不把旧 review 快照、缺 provider 或辅助事实变成额外阻塞；新增控制仅复用现有 owner/consumer/oracle。

## Phase P1 — 规范身份、影响与消费者合同

### Goal

共享合同能区分 Design/Experience 的职责和 identity、按真实证据给出影响分类、生成可重放 census，并为 UI/backend/fullstack 计算唯一的 covered/incomplete/unknown 结论。

### Files

- **NEW**：N/A — no new production file
- **MODIFY**：`runtime/stage/stage-content-contracts.mjs`; `skills/ui-project-init/SKILL.md`; `skills/design-source-readiness/SKILL.md`; `skills/frontend-component-quality/SKILL.md`; `tests/contract/ui-stage-integration.test.mjs`; `tests/contract/ui-frontend-governance.test.mjs`; `tests/stage-interaction-contract.test.mjs`
- **DO NOT TOUCH**：`runtime/stage/stage-agent-outcome-adapter.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`，均为保护的 unrelated WIP/历史 fail-closed 边界。

### Tasks

- T001：先加入 identity、职责、census、影响、interaction aggregate 生命周期和 quality conclusion 的反例，证明当前局部能力不能满足新合同（RED）。
- T002：扩展现有合同和 UI skill 输入输出，使 T001 的目标断言通过并保留 unknown/incomplete 负例（GREEN）。
- T003：加入 API→DTO→schema/migration→persistence→consumer 回读及各层失败边界反例（RED）。
- T004：实现可绑定、可恢复、可幂等声明的后端/fullstack 合同，使 T003 目标断言通过（GREEN）。

### Verify

P1 的 T001/T002/T003/T004 使用同一 `npm exec vitest run tests/contract/ui-stage-integration.test.mjs tests/contract/ui-frontend-governance.test.mjs tests/stage-interaction-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；T001/T003 预期非零且必须是目标断言失败，T002/T004 预期 0，并保留缺 identity、动态 consumer、unknown downgrade、aggregate 生命周期和 DTO/迁移/幂等失败反例。T001/T002 使用 ORACLE-P1-CONTRACT，T003/T004 使用 ORACLE-P1-DATA-CONTRACT。

### Knowledge

P2 必须知道 identity/census/quality 函数、interaction writer 和后端层合同的精确字段、状态枚举、稳定排序、回读和不适用边界；P1 不写 stage outcome，不运行浏览器。

### STOP

若需要新 evidence store、第二状态机、框架特定页面假设，或无法从当前源码 snapshot 得到稳定 consumer_id，停止并回到 spec/本 Phase，不猜测。

### Done

只在 T001/T003 RED、T002/T004 GREEN、源→FR/AC 映射和 unknown/incomplete 负例均有真实 evidence 后，描述 P1 合同完成；不把仓库无业务页面写成 UI covered。

### Risks and rollback

受 PLAN-RISK-001/002/005 影响；回滚只撤销 P1 修改，保留四材料和已有事实。F11 差异由 P2 处理。

## Phase P2 — 正式阶段、证据和模板接线

### Goal

正式 handler 真正消费 P1 合同；browser evidence、review materials、spec 模板、Skill/catalog/文档和测试表达同一事实；build-code 对适用 UI attempt 只调用一次受控真实 QA，verify-code 能发现漂移。

### Files

- **NEW**：`tests/contract/make-decision-interaction-publication.test.mjs` — contract/integration coverage only; no production authority
- **MODIFY**：`runtime/task/task-kernel-implementation.mjs`; `runtime/stage/stage-handlers.mjs`; `runtime/schemas/browser-qa-evidence.v1.json`; `runtime/evidence/stage-content-evidence.mjs`; `runtime/review/stage-materials.json`; `skills/frontend-testing/SKILL.md`; `skills/isolated-browser-qa/SKILL.md`; `skills/spec-specify/SKILL.md`; `skills/spec-specify/templates/spec-template.md`; `skills/spec-tasks/templates/tasks-template.md`; `skills/spec-plan/templates/plan-template.md`; `skills/spec-plan/skill-bundle.json`; `skills/spec-tasks/skill-bundle.json`; `skills/spec-specify/skill-bundle.json`; `skills/frontend-testing/skill-bundle.json`; `skills/isolated-browser-qa/skill-bundle.json`; `workflows/build-spec/SKILL.md`; `workflows/build-plan/SKILL.md`; `workflows/build-code/SKILL.md`; `workflows/verify-code/SKILL.md`; `workflows/verify-code/design-alignment.mjs`; `skills/catalog.yaml`; `skills/reuse-registry.md`; `tools/architecture/verify-final-coverage.mjs`; `tools/cli/verify-structure.mjs`; `tests/contract/review-materials-contract.test.mjs`; `tests/contract/stage-routing-and-concrete-testing.test.mjs`; `tests/contract/spec-analyze-completeness.test.mjs`; `tests/contract/phase-quality-handoff.test.mjs`; `tests/contract/workflow-quality-regression.test.mjs`; `tests/e2e/vnext-five-stage-current.test.mjs`; `tests/contract/filled-plan-task-production.test.mjs`; `tests/contract/verify-final-coverage.test.mjs`; `tests/contract/confirmation-authorization.test.mjs`; `tests/final-cutover-guards.red.test.mjs`; `tests/helpers/stage-outcome.mjs`; `tests/stage-plan-task-contract.test.mjs`; `tests/stage-risk-acceptance.test.mjs`; `tests/per-invocation-doc-contract.test.mjs`
- **MODIFY**：`runtime/stage/stage-runner.mjs`; `runtime/stage/completion-predicates.mjs`; `runtime/evidence/quality-fact.mjs`; `runtime/evidence/freshness.mjs`; `runtime/schemas/quality-fact.v1.json`; `tests/contract/stage-completion.test.mjs`; `tests/integration/verify-freshness-selection.test.mjs`; `tests/stage-plan-task-contract-v3.test.mjs`
- **DO NOT TOUCH**：`runtime/stage/stage-agent-outcome-adapter.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`。

### Tasks

- T005：加入正式 handler、schema、模板、dependency/consumer 和受控真实 QA 的失败测试，证明“声明/解析”不等于“正式执行”（RED）。
- T006：接通 P1 合同、make-decision writer、受控真实 QA evidence、detail adapter、spec formatter 和治理同步，保留不可用/失败事实（GREEN）。

### Verify

P2 的 T005/T006 使用同一 `npm exec vitest run tests/contract/review-materials-contract.test.mjs tests/contract/make-decision-interaction-publication.test.mjs tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/phase-quality-handoff.test.mjs tests/contract/workflow-quality-regression.test.mjs tests/e2e/vnext-five-stage-current.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；必须断言 `tools/cli/stage-runtime.mjs → runOfficialStage → officialStageHandler("build-code")` 的实际 invocation、一次新 invocation 重试、service/API mismatch、fixture-only、取消、cleanup failure、detail forbidden field、spec generated→strict analyzer、治理清单 append-only 和 F11 clause regression。

### Knowledge

P3 只接收已稳定的 stage outcome/evidence 输入和 completion missing semantics；不得把 P2 的 unavailable review、browser 或 audit 写成通过。

### STOP

若要新增公共命令/Runner/持久 QA 对象、放宽 strict analyzer、让 fixture 代替真实服务，或无法确定唯一 owner/consumer，停止并回到 spec/plan。

### Done

T005 RED 与 T006 GREEN 有同命令/同 oracle；正式 handler、schema、Skill、catalog、review materials、make-decision writer 和测试互相引用；所有 unavailable/unknown/incomplete 保持原始原因。

### Risks and rollback

受 PLAN-RISK-001/002/003/004/005 影响；回滚只撤销 P2 接线，保留 P1 合同和真实失败证据。

## Phase P3 — Step writer 早失败和最终聚合

### Goal

新 step event 越序在写入时拒绝，合法父子 skill 仍可记录，历史 overlap 继续 fail-closed；最后一次聚合检查用完整回归验证跨 Phase seam，不改历史。

### Files

- **NEW**：N/A — no new production file
- **MODIFY**：`tools/host/workflowhub-codex-session-state.mjs`; `tests/contract/stage-interaction-batching.test.mjs`; `tests/contract/stage-order-and-host-interaction.test.mjs`
- **DO NOT TOUCH**：`tools/host/workflowhub-stage-agent-bridge.mjs`、`tests/integration/vnext-official-stage-run.test.mjs` 及其他保护 WIP。

### Tasks

- T007：加入 writer 越序、父子 skill、历史 overlap 和不写入断言（RED）。
- T008：在现有 start writer 中实现 manifest 顺序 preflight，并保留 bridge 的历史 fail-closed 语义（GREEN）。
- T009：FINAL 只执行一次当前 task 的聚焦回归，记录每个适用 AC、跨任务 seam、真实退出码和残余风险。

### Verify

T007/T008 使用 ORACLE-P3-EVENT-ORDER 同一 focused command；T009 使用当前 task 的 focused command / ORACLE-FINAL，预期 0。任何历史 session overlap、下游页面缺失或 review unavailable 仍在证据中显示，不被 aggregate 抹平；不执行包含受保护 integration WIP 的 `npm test` 作为硬 oracle。

### Knowledge

最终交接给 build-code：P1/P2 的合同和阶段 consumer 已确定；实现必须按任务卡逐条 RED/GREEN，真实 UI 只走受控真实 QA，不能把本任务无页面当成浏览器 PASS。

### STOP

若 aggregate 需要改写旧 event、跳过失败测试、增加第五材料或改变 public route，停止并回到对应 Phase/材料。

### Done

T007 RED、T008 GREEN、T009 聚焦回归事实均有命令、exit、oracle、coverage limits 和证据；最终结论仍区分 covered/incomplete/unknown。

### Risks and rollback

受 PLAN-RISK-006 影响；回滚只撤 writer preflight 和新增测试，历史 sidecar 保持原样。

## Final current-snapshot aggregate strategy

- **tier / method**：fullstack；使用当前 task 的 focused Vitest command，覆盖运行时合同、handler、schema、Skill/模板和 host seam；不把包含受保护 integration WIP 的 `npm test` 当硬 oracle。
- **scenarios**：全部 AC-001..023；规范缺失/漂移、consumer unknown、后端层失败、真实 QA blocked/unknown、detail forbidden、spec old-format RED、step overlap fail-closed 和合法新顺序。
- **command**：`npm exec vitest run tests/contract/ui-stage-integration.test.mjs tests/contract/ui-frontend-governance.test.mjs tests/stage-interaction-contract.test.mjs tests/contract/review-materials-contract.test.mjs tests/contract/make-decision-interaction-publication.test.mjs tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/phase-quality-handoff.test.mjs tests/contract/workflow-quality-regression.test.mjs tests/contract/stage-interaction-batching.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs tests/e2e/vnext-five-stage-current.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected exit**：0
- **oracle**：ORACLE-FINAL — 当前快照所有 focused contract、e2e 和历史负例通过；不把缺质量事实写成 covered。
- **fixtures_services**：使用现有 contract fixtures；不启动下游业务服务。真实浏览器服务属于 build-code，下游 task 自己按 isolated-browser-qa cleanup。
- **evidence_path**：`quality/tests/plan/T009-final.json`
- **coverage limits**：不覆盖下游页面视觉像素、真实 API 数据、浏览器性能数值和外部 provider 可用性；这些保持 unknown/unavailable。
- **STOP**：命令不可执行、任何行为卡没有 RED/GREEN、边界越界或需要新产品决策时停止。
- **execution_contract**：当前快照只运行一次；失败保存原始输出，回受影响 task，不用重复全量运行掩盖局部失败。

## Dependency Graph

- **order**：T001 (RED) → T002 (GREEN) → T003 (RED) → T004 (GREEN) → T005 (RED) → T006 (GREEN) → T007 (RED) → T008 (GREEN) → T009 (FINAL)
- **serial reasons**：P1 contracts are producers for P2 handlers; P2 outcome/evidence semantics are producers for P3 event and aggregate checks; each GREEN depends on its RED.

```text
T001 (RED) → T002 (GREEN) → T003 (RED) → T004 (GREEN) → T005 (RED) → T006 (GREEN) → T007 (RED) → T008 (GREEN) → T009 (FINAL)
```

## Final Boundary Check

- [x] 每个 Phase 的 Goal、Files、Tasks、Verify、Knowledge、STOP、Done、Risks and rollback 完整。
- [x] 每个任务只有一张卡和一个完成区；文件是所属 Phase NEW/MODIFY 的子集。
- [x] 每个行为变化都有同命令、同 oracle 的 RED → GREEN；FINAL 只做一次聚合。
- [x] 依赖无环，FR/AC 双向追溯闭合，未知事实没有被写成假设或通过。
- [x] review、test、evidence 只作为事实记录，不是开始、继续或交付许可证。
