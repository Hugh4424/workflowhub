# 实施计划：WorkflowHub UI 与前端交付契约

- **Input**：`decision-log.md`、`spec.md`
- **Template version**：`plan-task.v3`

## Quick Read

- **Goal**：UI 任务在 build-code 前拥有可读 Design.md 来源、页面/状态 UI Contract、组件/CSS/状态拥有者计划和可执行的浏览器/截图验收交接；新旧项目都能用同一套轻量技能初始化。
- **Non-goals**：不改 F11/PaperBuilder、不新增产品页面、后端/API/数据库、第五份当前材料、独立 UI 阶段、质量闸门或全仓前端重构；来源：`R-006`、`D-006`、`D-026`、`D-030`。
- **Before**：`build-spec` 只有 UI review lens，`build-plan` 没有组件/CSS 质量字段，`build-code` 的 frontend-testing 和 verify-code 的浏览器事实没有统一 UI Contract 输入；新旧项目初始化和 Design.md 可读性没有可搬运技能。
- **After**：已有三个独立可搬运技能，接入既有五阶段；真实组件和 fixture 优先在 build-spec 形成预览，build-plan 固定组件动作/消费者/状态/ViewModel/CSS/token/测试/截图，build-code 先静态组合再状态再 DTO wiring，verify-code 检查真实 consumer、兼容性、CSS 泄漏、行为、视觉、a11y 和性能事实；当前四份材料统一使用 `AC-UI-001`…`AC-UI-011` 与 `DEFER-001`。
- **Main risk**：新技能变成第二套控制面、Design.md 缺失被伪装成 ready、或计划字段写得漂亮但没有真实消费者和浏览器证据。
- **Next step**：先执行 Phase P1 的技能契约 RED；若仓库边界或上游来源与本计划不符，停回 `plan.md` 修正，不在 build-code 临场补范围。

## Technical Context

### Global Constraints

- **Verified facts**：当前材料为 `specs/ui-frontend-delivery-contract/decision-log.md` 与 `spec.md`；现有工作流仍是 make-decision、build-spec、build-plan、build-code、verify-code；`skills/plan-design-review` 只做 build-spec UI review，`skills/frontend-testing` 只做 build-code，`skills/isolated-browser-qa` 已提供隔离浏览器与清理；`runtime/stage/stage-content-contracts.mjs` 已提供 plan/task、spec-analyze 和 acceptance 结构校验。
- **Language / runtime**：仓库使用 Node.js ESM，现有合同测试通过 `node --test`；不新增运行时语言或服务。
- **Primary dependencies**：复用现有 `plan-design-review`、`frontend-testing`、`isolated-browser-qa`、`spec-analyze`、`wh-review`、`test-routing-advisor`；React/Next 只在 `frontend-component-quality` 内读取固定 Vercel MIT `react-best-practices` 编译规则，不把它变成阶段或 gate。
- **Storage / state**：只读四份当前材料和既有 `quality/*` 事实；Design.md 是项目级人工来源，不写入任务临时状态；Screen Read Map、Component Quality Map 和 preview/screenshot 都是阶段事实，不创建第五份材料、状态机或新 evidence store。
- **Testing**：先按 `testing-system-blueprint` 设计 RED/GREEN，build-code 才执行；UI 变更使用 `frontend-testing`，浏览器使用 `isolated-browser-qa`，最终用现有合同/集成测试和一次真实浏览器场景，保留未知、不可用和 N/A 原因。
- **Target environment**：WorkflowHub 仓库本身以及可搬运到 React/Next、其他 Web 技术栈的项目；非 React/Next 项目不得被强制套用 Vercel lens。
- **Scale / scope**：三个技能包、五阶段依赖/说明、现有 runtime 内容/审查契约、两个 plan/tasks 模板、合同测试、治理目录和上游通知；不触碰 PaperBuilder 运行时代码。
- **Unresolved facts**：真实项目的 viewport 组合、fixture 规模、CSS 数值阈值和预览宿主仍未知，归 `OPEN-UI-001`，由 build-plan 和人工确认补齐；缺失时保持 `unknown` 或 `N/A — reason`，不阻止同一任务继续。

## Code Anchors

- **Verified anchors**：`workflows/make-decision/SKILL.md` 的 triage/边界；`workflows/build-spec/skill-deps.yaml` 与 `steps.json` 的 UI 分支；`workflows/build-plan/skill-deps.yaml`、`skills/spec-plan/templates/plan-template.md`、`skills/spec-tasks/templates/tasks-template.md`；`workflows/build-code/skill-deps.yaml`、`workflows/build-code/SKILL.md`；`workflows/verify-code/skill-deps.yaml`、`workflows/verify-code/design-alignment.mjs`；`runtime/stage/stage-content-contracts.mjs` 的 `validatePlanTaskContract`、`validateSpecAnalyzeCompleteness`、`validateAcceptanceDesignMinimum`；`runtime/review/stage-materials.json`；`skills/catalog.yaml`。
- **Existing interfaces**：技能通过 `SKILL.md`、`skill-bundle.json` 和 stage `skill-deps.yaml` 声明；阶段只读四份材料并把事实写入既有 `quality/*`；plan/task 使用 `plan-task.v3`，每个行为任务必须同命令同 oracle 的 RED/GREEN 配对。
- **Read now**：实现前必须读取上述 workflow manifest、runtime validator、现有 UI/test 技能、`CONTEXT.md`、`docs/adr/0015-ui-design-source-and-initialization.md`、`docs/adr/0016-external-first-frontend-component-quality.md` 和三份 research 事实。
- **Must read before task**：P1 读取上游 Vercel pinned compiled guide 与 MIT 许可；P2 读取各阶段实际消费者和 review material schema；P3 读取 browser evidence schema、move-map 与 inventory。未知消费者不得靠猜。
- **Context mode**：Full；此次变更跨技能包、工作流接线、runtime 合同、模板和测试，不能只凭单文件上下文实现。

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
| --- | --- | --- | --- |
| UI 适用性 | extend | `workflows/make-decision/SKILL.md` triage | 复用现有 scope 事实，不新增 stage；无 UI consumer 时删除 UI 分支说明 |
| 项目初始化 | new | `skills/ui-project-init/` | 唯一 consumer 是 build-spec UI 分支；consumer 移除且无搬运项目使用时删除 |
| Design.md readiness | new | `skills/design-source-readiness/` | 只产生 Screen Read Map，不产生第二设计真相；build-spec 不再消费时删除 |
| 组件质量 | new | `skills/frontend-component-quality/` | 唯一公开入口，供 plan/code/verify；无三阶段 consumer 时删除 |
| React/Next lens | reuse + vendor | Vercel pinned compiled guide | 固定 commit、保留 LICENSE/UPSTREAM；不复制第二套 React 规则执行器 |
| UI 测试/截图 | extend | `skills/frontend-testing/`, `skills/isolated-browser-qa/` | 复用真实浏览器与清理，不新增浏览器 daemon 或 gate |
| 计划与任务字段 | extend | `skills/spec-plan/templates`, `skills/spec-tasks/templates` | 让 UI 组件动作和证据进入同一 plan/tasks 权威 |

## Solution Design

### Overview

make-decision 只负责把 UI 适用性、页面范围、用户流程、状态、非目标和延期项冻结；判定输入固定为 `raw_requirement`、`project_inventory`、`planned_or_changed_frontend_fact`，按事实合并为 `ui`、`non_ui` 或 `unknown`，调用方不能把已有 UI 事实降级为 `non_ui`。计划或前端事实变化时必须重新计算；上游未冻结或输入互相冲突时保留 `unknown`，并交回 make-decision，不由 build-spec 补需求。build-spec 在 UI 分支先调用 `ui-project-init`，新项目建立项目级 Design.md 路径/版本和最小边界，历史项目只读盘点并收缩到首个低耦合页面；随后 `design-source-readiness` 把整份 Design.md 转成 Screen Read Map，缺失只记 `unknown`/`not_bindable`。

build-spec 继续复用真实组件、固定 fixture 和 viewport 做静态预览/Story，再记录默认、加载、空、错误、取消、权限、边界、竞态以及响应式/a11y 的可观察交互。预览不可用或不满意时只生成页面/区域、交互、状态、可见 label 的短提示词；人工 approved、acknowledged、not_approved 都允许继续，只有 approved 可以标 ready，任何结果都不得宣称视觉完成。

build-plan 使用 `frontend-component-quality` 输出 Component Quality Map：每个 UI 阶段明确复用、修改、增加状态/变体、新增局部、抽取共享或无消费者删除，列出真实 consumer、兼容性、state owner、typed ViewModel、CSS/token owner、命令、browser/a11y/perf、viewport、fixture、截图和限制。build-code 按静态组合 → 状态/交互 → DTO 到 typed ViewModel wiring 的顺序实现；verify-code 沿真实入口复查 consumer、CSS 泄漏、状态、行为和设计事实。组件质量 oracle 必须能用负例打破通过：重复组件、无 consumer 的删除、少于两个 consumer 的共享抽取、缺 state owner、跨页面 CSS 泄漏、global override 和 `!important` 都不得静默通过。

### Module responsibilities

#### ui-project-init

- **Responsibility**：根据 `new|legacy` 和项目盘点，返回最小 Design.md/组件/样式/fixture/viewport/preview 初始化事实。
- **Consumes**：原始 UI 范围、技术栈、项目盘点和现有路径。
- **Produces**：项目级 Design.md 路径/版本/可读性、fallback_visual_basis、组件/CSS 边界、首个页面候选、风险、人工确认与 `unknown` 原因。
- **Must not decide**：不创建任务状态、不整仓迁移、不替用户确认设计、不新增 runtime gate。

#### design-source-readiness

- **Responsibility**：完整读取 Design.md，生成可读、可绑定的 Screen Read Map。
- **Consumes**：Design.md 全文、项目版本号和当前材料引用。
- **Produces**：页面/区域 anchor、目标/主操作、状态、组件/token 来源、fixture、viewport、responsive/a11y intent、证据 freshness、缺项代码、人工待答项、binding_state。
- **Must not decide**：不打分、不设 ready gate、不写回 Design.md、不生成第二设计真相。

#### frontend-component-quality

- **Responsibility**：把组件化和前端实现质量变成可执行的 map 与审查事实。
- **Consumes**：Component Quality Map、真实 diff/consumer、状态/ViewModel、CSS/token、实际命令、browser/screenshot/a11y/perf facts。
- **Produces**：组件动作、consumer/兼容性、状态拥有者、类型边界、CSS/token owner、命令结果和 N/A/unknown/unavailable 原因。
- **Must not decide**：不替代 `frontend-testing`、不写任务状态、不创建阶段或 gate；React/Next 只读取固定 Vercel compiled guide。

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：三个技能使用独立输入/输出 Markdown/JSON 字段，不改变四材料；bundle 记录 source、commit、license、版本和依赖闭包；`frontend-component-quality` 的 Vercel vendor 只读。
- **Data flow / state**：UI applicability → init → readiness/Screen Read Map → UI Contract/preview → short prompt 或人工确认 → plan Component Quality Map → code tests/browser/screenshots → verify facts；失败保留原事实，重试只产生新候选结果。
- **API contract**：N/A — reason：本功能不新增后端或公共 API，仅修改本地技能和阶段说明。
- **UI / external code**：页面/区域、交互、状态和可见 label 是短提示词最小字段；状态契约另外记录 visible_structure、fixture_shape、actions、trigger、recovery、permission、preview/browser/screenshot assertion、responsive 与 a11y；证据缺失写明原因。UI Contract 还必须保留 `design_status`、`missing_items`（含 reason）、`fallback_visual_basis`、`constraints`、`assumptions`、`rework_risk`、`human_confirmation`、`current_material_ref`，以及 preview/fixture/viewport/screenshot/design-version refs。
- **Fail-loud behavior**：缺字段、Design.md 路径不可读、版本冲突、无真实 consumer、共享抽取少于两个 consumer、命令缺失且无 N/A 原因时返回明确不完整事实；这些事实不阻止同任务继续，但不能写成通过。

### Behavioral oracle contract

- **Applicability**：测试以三个输入构造可重复事实：`raw_requirement`、`project_inventory`、`planned_or_changed_frontend_fact`。前端事实命中且需求是页面/交互时为 `ui`；三类事实都排除 UI 时为 `non_ui`；缺失、冲突或上游未冻结时为 `unknown`，并带 `source_reasons`、`risk`、`handoff=make-decision`。调用方传入 `non_ui` 只能作为请求，不能覆盖可信 `ui`；计划或前端事实变化必须重新计算，不能沿用旧结论。
- **UI Contract behavior**：正例覆盖 default/loading/empty/error/permission/boundary/narrow/race 八种状态，以及 actions、trigger、recovery、visible label 和 a11y/responsive 观察值；负例覆盖缺少 state owner、未声明恢复动作、竞态未定义、状态只存在于截图而没有可观察断言。
- **Design-gap handoff**：preview `unavailable`、取消、未返回或版本不匹配时，保留短提示词和上述 UI Contract 字段；`approved`、`acknowledged`、`not_approved` 分别可观察，只有 `approved` 标记 ready，其他结果可继续但必须带返工风险。任何 handoff 都引用当前 `spec.md`/`plan.md`/`tasks.md` 或项目级 Design.md 版本，不把任务状态写回 Design.md。
- **Component/CSS behavior**：positive fixture 沿真实 consumer 检查复用/修改/增状态/新增局部/共享抽取；negative fixture 必须拒绝 duplicate component、no-consumer deletion、shared extraction with fewer than two consumers、missing state owner、cross-page CSS leak、global override 和 `!important`。
- **Evidence limits**：合同测试可以证明输入、字段和失败边界；纯 Markdown 的人工视觉选择、短提示词可读性和真实页面布局只能标记 `manual`/`unknown`/`unavailable`，由 build-code/verify-code 的实际浏览器和截图事实补足，不能从合同测试绿色推导视觉完成。

## File Boundary

### NEW

- `skills/ui-project-init/SKILL.md`
- `skills/ui-project-init/skill-bundle.json`
- `skills/design-source-readiness/SKILL.md`
- `skills/design-source-readiness/skill-bundle.json`
- `skills/frontend-component-quality/SKILL.md`
- `skills/frontend-component-quality/skill-bundle.json`
- `skills/frontend-component-quality/upstream/react-best-practices/AGENTS.md`
- `skills/frontend-component-quality/upstream/react-best-practices/LICENSE`
- `skills/frontend-component-quality/upstream/react-best-practices/UPSTREAM.md`
- `docs/adr/0015-ui-design-source-and-initialization.md`
- `docs/adr/0016-external-first-frontend-component-quality.md`
- `docs/research/design-md-executable-source-research-2026-08-22.md`
- `docs/research/ui-delivery-contract-external-practices-2026-08-22.md`
- `docs/research/ui-frontend-simple-workflow-design-2026-08-22.md`
- `tests/contract/ui-skill-contract.test.mjs`
- `tests/contract/ui-stage-integration.test.mjs`
- `tests/contract/ui-frontend-governance.test.mjs`

### MODIFY

- `workflows/make-decision/SKILL.md`
- `workflows/build-spec/SKILL.md`
- `workflows/build-spec/skill-deps.yaml`
- `workflows/build-spec/steps.json`
- `workflows/build-plan/SKILL.md`
- `workflows/build-plan/skill-deps.yaml`
- `workflows/build-code/SKILL.md`
- `workflows/build-code/skill-deps.yaml`
- `workflows/verify-code/SKILL.md`
- `workflows/verify-code/skill-deps.yaml`
- `workflows/verify-code/design-alignment.mjs`
- `runtime/stage/stage-content-contracts.mjs`
- `runtime/review/stage-materials.json`
- `runtime/schemas/browser-qa-evidence.v1.json`
- `skills/spec-plan/templates/plan-template.md`
- `skills/spec-tasks/templates/tasks-template.md`
- `skills/frontend-testing/SKILL.md`
- `skills/isolated-browser-qa/SKILL.md`
- `skills/catalog.yaml`
- `docs/architecture/move-map.json`
- `docs/architecture/repository-inventory.tsv`
- `skills/reuse-registry.md`
- `CONTEXT.md`
- `THIRD_PARTY_NOTICES.md`

### DO NOT TOUCH

- `specs/ui-frontend-delivery-contract/decision-log.md` and `spec.md` — current material is frozen; build-plan only consumes it。
- `runtime/task/`、`runtime/distribution/`、`runtime/evidence/` — no new public control plane or evidence store。
- PaperBuilder/F11 source trees — explicitly deferred by `DEFER-001`。
- Existing `skills/wh-review` review controller — review-loop repair is already merged and not part of this feature。

## Technical Decisions

### DEC-001 — 复用五阶段，技能下沉

- **Problem**：若为 UI 再造阶段或 runtime 状态机，流程会重复且难以搬运。
- **Options**：新增 UI 阶段；把规则塞进 runtime；新增可搬运技能并接入现有阶段。
- **Selected**：reuse + new skills。
- **Reason**：保留既有五阶段和四材料，能力由技能承担，符合 F1/F2/F5/S7/S8。
- **Consequence / risk**：阶段说明和依赖 manifest 要同步，遗漏会形成“技能存在但不执行”。
- **Fallback**：缺技能时保留未可用事实，使用已有 UI review/frontend-testing 安全推进。
- **F10 real threat**：现有阶段没有统一 UI 设计/组件质量入口，未来任务会继续在 build-code 临场补 UI。
- **F10 existing cover**：已有五阶段、plan-design-review、frontend-testing 和 isolated-browser-qa 可承接大部分流程。
- **F10 bypassable**：非 UI 任务不加载三个技能；技能不可用时保留事实并继续安全的非 UI/通用路径。
- **F10 maintenance cost**：增加三个短技能和 manifest 条目，低于新增阶段、runtime 状态机和第二套证据存储。
- **F10 disposition**：keep

### DEC-002 — Design.md 是项目源，Screen Read Map 是派生事实

- **Problem**：Design.md 既难读又可能和任务状态混在一起。
- **Options**：把 Design.md 复制进任务；只凭人工阅读；生成结构化 Screen Read Map 但不设分数/gate。
- **Selected**：new `design-source-readiness` 派生 map。
- **Reason**：机器能检查锚点和缺项，人保留视觉意图；不制造第二真相。
- **Consequence / risk**：版本号可能被误改；必须保留版本文字和人工确认，不冒充新鲜度密码学证明。
- **Fallback**：Design.md 缺失时记录 fallback_visual_basis、unknown 和返工风险。
- **F10 real threat**：没有 map 时新页面会重新猜设计，返工真实发生。
- **F10 existing cover**：现有 plan-design-review 只审 spec，不输出可复用 map。
- **F10 bypassable**：非 UI 任务和没有 Design.md 的任务可以 N/A/unknown，不需新执行器。
- **F10 maintenance cost**：一个短技能和字段合同，维护小于重复人工审查。
- **F10 disposition**：keep

### DEC-003 — 组件质量单一入口，Vercel 只作内部 lens

- **Problem**：前端代码重复、状态遗漏、CSS 泄漏，且 React/Next 规则可能被重复实现。
- **Options**：新增多套框架规则；只用 Vercel；一个通用 Component Quality Map 内嵌固定 Vercel lens。
- **Selected**：new `frontend-component-quality` + vendored Vercel compiled guide。
- **Reason**：组件动作和真实 consumer 对所有前端栈有用，Vercel 只对 React/Next 条件适用。
- **Consequence / risk**：需要明确 upstream commit、MIT LICENSE、只读边界和非 React N/A。
- **Fallback**：上游规则不可用时执行通用 consumer/state/CSS/testing 检查，并记录 unavailable。
- **F10 real threat**：没有 consumer/CSS/state 检查会继续产生长代码和重复组件。
- **F10 existing cover**：现有 frontend-testing 关注状态测试，不覆盖组件 ownership 与 CSS 归属。
- **F10 bypassable**：没有 React/Next 代码时跳过 Vercel lens，不阻止通用质量检查。
- **F10 maintenance cost**：只维护一个入口和一个 pinned compiled guide，不建规则执行器。
- **F10 disposition**：keep

### DEC-004 — 证据按阶段产生，不设 UI gate

- **Problem**：设计稿或浏览器宿主缺失会让任务卡死，或被截图伪装成完成。
- **Options**：强制 preview/screenshot；完全不要证据；按阶段记录事实、缺失和限制，人工确认后继续。
- **Selected**：extend existing test/browser evidence contracts。
- **Reason**：符合 D-030、F4/F7/Q1/Q2；继续工作和完成声明分离。
- **Consequence / risk**：build-code 可能在 unknown 设计上返工，必须在 plan/task/verify 暴露。
- **Fallback**：没有 browser 命令时记录 unavailable/N/A 原因并保留静态/合同检查。
- **F10 disposition**：simplify

## Test Strategy

设计 RED/GREEN，不在 build-plan 执行命令。行为阶段使用同一命令和 oracle；材料契约测试只验证字段、来源、边界、无 gate 和唯一 consumer，不把测试结果当推进许可证。

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
| --- | --- | --- | --- | --- |
| FR-UI-001/002/003/004 | T001/T002 | RED/GREEN | `node --test tests/contract/ui-skill-contract.test.mjs` / non-zero, 0 | ORACLE-UI-SKILL；`quality/tests/ui-skill-contract.txt` |
| FR-UI-001/003/004/005/008/009/010/011 | T003/T004 | RED/GREEN | `node --test tests/contract/ui-stage-integration.test.mjs` / non-zero, 0 | ORACLE-UI-STAGE；`quality/tests/ui-stage-integration.txt` |
| FR-UI-002/006/007/008/009/010/011 | T005/T006 | RED/GREEN | `node --test tests/contract/ui-frontend-governance.test.mjs` / non-zero, 0 | ORACLE-UI-GOV；`quality/tests/ui-frontend-governance.txt` |
| 全部适用 AC 与跨阶段 seam | T007 | N/A — non-behavior aggregate verification | `node --test tests/contract/ui-skill-contract.test.mjs tests/contract/ui-stage-integration.test.mjs tests/contract/ui-frontend-governance.test.mjs` / 0 | ORACLE-UI-FINAL；`quality/tests/ui-frontend-final.txt` |

## Review Findings Disposition

本阶段按标准 build-plan 规则只调用一次异源审查。审查 attempt `8eaf241e-b428-49d7-89bd-b6cf58c2b863` 返回 8 条有效意见；`opencode` 的 transport unavailable 原样保留为事实，不重试、不改写为空 findings。

- **F-07b6fea4d49f（codex/luna）**：已修复。新增 Behavioral oracle contract、八状态/竞态/权限/响应式/a11y 正负例、preview 和人工确认状态转移，写入 T003/T004 和 T005/T006 的场景及限制。
- **F-3df8dc81d6b8（codex/luna）**：已修复。Component/CSS behavior 增加 duplicate、无 consumer 删除、少于两个 consumer 抽取、缺 state owner、CSS 泄漏/global override/`!important` 负例，交给 T005/T006 governance oracle。
- **F-55a0d0c0ac65（codex/luna）**：已修复。`design-source-readiness` 的 Read Map 明确先作为既有 `plan-design-review` 的输入；T004 固定 build-spec 的调用顺序，并在 P2 合同测试核验 consumer、依赖和 invocation，不新增第二 review controller。
- **F-9ab00af8c472（codex/luna）**：已修复。Applicability 固定三类输入、合并/冲突规则、caller downgrade 负例、source reasons/risk/handoff 和 plan/frontend change re-evaluation；T003/T004 记录 upstream 未冻结时回 make-decision。
- **F-9e8b88e49a6e（pi/k3）**：已修复。把 runtime UI validator、AC namespace、design-alignment 和组件/CSS consumer 检查改为正负行为 fixture；同时收窄 coverage limits，明确合同绿色不等于真实页面视觉通过。
- **F-f5bbd811e7e2（codex/luna）**：已修复。UI Contract、plan/task handoff 加入 `design_status`、`missing_items`/reason、`fallback_visual_basis`、`constraints`、`assumptions`、`rework_risk`、`human_confirmation`、`current_material_ref` 及 preview/fixture/viewport/screenshot/version refs。
- **F-2d991bca73ec（codex/luna）**：已修复。Test Strategy 的 P1 行收窄为 `FR-UI-001/002/003/004`，与 T001/T002 完全一致。
- **F-7cc3189136ff（codex/luna）**：已修复。T003/T004 场景加入 upstream 未冻结/冲突 → `unknown` + make-decision handoff，保持事实而不阻止同 task。

**Current material fact**：build-spec 已把 `spec.md` 的 AC 标识统一为 `AC-UI-001`…`AC-UI-011`，延期项统一为 `DEFER-001`；当前 runtime 已修复 canonical namespaced AC 识别，直接运行 `validateSpecContentProfile(spec.md)` 返回 `{"ok":true,"errors":[]}`。本次材料修订只更新已解决事实和任务证据引用，不改变产品语义；历史 incomplete/provider/stale snapshot 事实继续保留在 quality evidence。

## Rollback and Recovery

- **Global recovery rule**：只回滚本次实现文件，保留四份当前材料和已有 review/test facts；不删除历史质量事实，不创建 successor/recovery task。
- **Irreversible boundaries**：commit、push、merge、archive、cleanup 都需独立 `authorize --op=...`；build-code 前不需要提交。
- **Recovery owner**：当前 task 的执行者按 task boundary 恢复；若方向改变回 make-decision，若 spec 改变回 build-spec，若 plan/tasks 改变回 build-plan。

### Engineering Risk Handoff

#### PLAN-RISK-001 — 技能接线遗漏

- **Affected IDs**：`R-001`、`R-002`、`FR-UI-001`、`FR-UI-003`、`FR-UI-008`、`AC-UI-001`、`AC-UI-003`、`AC-UI-008`、T001–T004。
- **Trigger**：skill 目录和 catalog 存在，但某阶段 manifest、消费者或测试没有引用它。
- **Consequence**：未来 agent 看得到文件却不会调用，UI 质量继续在 build-code 才暴露。
- **Mitigation or STOP**：P1/P2 合同测试必须同时查路径、bundle、used_by_stages 和唯一 consumer；发现缺接线停回当前 task。
- **Handling Stage**：build-plan、build-code。
- **Verification**：ORACLE-UI-SKILL、ORACLE-UI-STAGE 和 catalog closure test。

#### PLAN-RISK-002 — Design.md/代码漂移

- **Affected IDs**：`R-007`、`R-008`、`FR-UI-003`、`FR-UI-004`、`FR-UI-011`、`AC-UI-003`、`AC-UI-004`、`AC-UI-011`、T003–T006。
- **Trigger**：版本变更、Screen Read Map 缺项、真实 consumer 或 CSS owner 不一致。
- **Consequence**：页面看起来可用但交互/状态/样式与设计来源不一致，截图被误作完成。
- **Mitigation or STOP**：readiness 输出 not_bindable/unknown；plan 绑定版本和 map；verify 复查真实 consumer、CSS 泄漏、浏览器/a11y 事实。
- **Handling Stage**：build-spec、build-plan、verify-code。
- **Verification**：`design-alignment.mjs`、frontend-component-quality facts、浏览器证据或明确 N/A。

#### PLAN-RISK-003 — 设计信息不足导致返工

- **Affected IDs**：`OPEN-UI-001`、`RISK-UI-001`、`FR-UI-005`、`FR-UI-006`、`FR-UI-007`、`AC-UI-005`、`AC-UI-006`、`AC-UI-007`、T003–T007。
- **Trigger**：没有 preview 宿主、fixture、viewport 或人工未满意。
- **Consequence**：build-code 需要在已知风险下补强或返工。
- **Mitigation or STOP**：短提示词只写页面/区域、交互、状态、label；人工 confirmation 允许继续但不得标 ready；每个 UI plan phase 写浏览器测试和截图卡。
- **Handling Stage**：build-spec、build-plan、build-code、verify-code。
- **Verification**：UI Contract 状态字段、tasks 的 fixture/viewport/evidence_path、实际测试事实和限制。

#### PLAN-RISK-004 — canonical AC 标识与 spec-content card 校验不一致

- **Affected IDs**：`AC-UI-001`–`AC-UI-011`、`FR-UI-001`–`FR-UI-011`、T003/T004/T007。
- **Trigger（历史）**：当前四份材料已经使用 canonical `AC-UI-001`…`AC-UI-011`，旧 runtime 曾只匹配 compact card 形态。
- **Consequence（历史）**：旧 build-spec 结构校验会错误报告缺少 AC card；把 spec 改回旧编号会破坏当前材料 lineage。
- **Mitigation or STOP**：已在 T004 对应 runtime 中统一 canonical/legacy 正负解析；保持 canonical 编号，不能回退为 compact ID，也不能把旧 incomplete 事实覆盖成新的通过结论。
- **Handling Stage**：build-code 已完成实现；verify-code 只消费当前检查结果并保留历史 provider/stale snapshot 事实。
- **Verification**：当前 `validateSpecContentProfile`、`validatePlanTaskContract`、`validateExecutablePlanTaskMinimum` 与 T003/T004 canonical/legacy 正负 fixture 均能识别 accepted AC，且拒绝未知 ID；当前结果为已解决，历史风险仅作追溯。

#### PLAN-RISK-005 — 延期项标识回归漂移

- **Affected IDs**：四份材料的 `DEFER-001` 与 T007 deferred handoff。
- **Trigger**：后续编辑重新引入旧的 namespaced 延期形式，或只更新 spec 而遗漏 plan/tasks。
- **Consequence**：最终 analyzer 把同一延期项拆成两个 ID，丢失 owner、handoff 或 close condition 的完整链路。
- **Mitigation or STOP**：所有当前材料只使用 `DEFER-001`；任何延期项改动必须在 owning material 同步并保留 analyzer 的事实结果。
- **Handling Stage**：build-plan / build-code / verify-code 按当前材料职责处理。
- **Verification**：`validateSpecAnalyzeCompleteness` 对四份材料返回无 `deferred_open_handoff_gap`，并逐份核验 owner、trigger、handoff、close condition。

## Implementation Order

1. **P1** 先新增三个技能、Vercel 上游闭包、ADR/research 和契约测试；没有可验证技能合同就不接入阶段。
2. **P2** 将 UI 适用性、初始化、readiness、Component Quality Map 接入既有 workflow manifest、runtime content/review contracts 和 verify design alignment；P2 只消费 P1 公开入口。
3. **P3** 把 UI 字段、状态/a11y/responsive、测试/浏览器/截图交接写入 plan/tasks/front-end QA 模板和治理目录，运行完整合同/集成测试。
4. 任何 UI 阶段的真实实现顺序固定为静态组件组合 → 状态/交互 → DTO 到 typed ViewModel wiring；不可把重新设计推迟到 build-code。

## Dependencies and Parallelism

- **Dependencies**：P1 → P2 → P3；P1 的三个技能和 Vercel vendor 可并行编写但共享 `skills/catalog.yaml`、inventory 和 bundle closure 的任务串行；P2 必须等入口名称冻结；P3 必须等 runtime 字段冻结。
- **Parallel work**：P1 技能正文与 ADR/research 可并行，唯一共享治理文件由一个 task 修改；P2 workflow manifest 与 runtime tests 可并行但不能重叠同文件；P3 模板、browser docs、governance 可并行，最终合同测试串行。
- **External dependencies**：Vercel `react-best-practices` pinned commit `dd089a8c752c966dee8bf0f27cb625ba193ffd9e`、version `1.0.0`、MIT；缺失时保留 upstream unavailable，不阻止通用组件质量。

## Requirement and Verification Traceability

| Source / decision | FR | AC | Phase / Task | Depends on | Exact files | Command / oracle |
| --- | --- | --- | --- | --- | --- | --- |
| `R-001`/`D-001` | FR-UI-001 | AC-UI-001 | P2/T003–T004 | T001–T002 | `workflows/make-decision/SKILL.md`, `workflows/build-spec/SKILL.md` | `node --test tests/contract/ui-stage-integration.test.mjs` / ORACLE-UI-STAGE |
| `R-003`/`D-003`/`D-009` | FR-UI-002 | AC-UI-002 | P1/P2/T001–T004 | none | `skills/ui-project-init/SKILL.md`, `workflows/build-spec/skill-deps.yaml` | ORACLE-UI-SKILL / ORACLE-UI-STAGE |
| `R-007`/`D-007`/`D-013` | FR-UI-003, FR-UI-004 | AC-UI-003, AC-UI-004 | P1/P2/T001–T004 | T001–T002 | `skills/design-source-readiness/SKILL.md`, `runtime/stage/stage-content-contracts.mjs` | ORACLE-UI-STAGE |
| `R-008`/`D-011`/`D-012` | FR-UI-005, FR-UI-006, FR-UI-007 | AC-UI-005, AC-UI-006, AC-UI-007 | P2/P3/T003–T007 | T001–T004 | `workflows/build-spec/SKILL.md`, `skills/spec-plan/templates/plan-template.md`, `skills/frontend-testing/SKILL.md` | ORACLE-UI-GOV / ORACLE-UI-FINAL |
| `R-011`/`D-014`–`D-025` | FR-UI-008, FR-UI-009 | AC-UI-008, AC-UI-009 | P1/P2/P3/T001–T007 | T001–T004 | `skills/frontend-component-quality/SKILL.md`, `workflows/build-code/SKILL.md`, `workflows/verify-code/design-alignment.mjs` | ORACLE-UI-SKILL / ORACLE-UI-STAGE / ORACLE-UI-GOV |
| `R-008`/`R-011`/`D-020`–`D-024` | FR-UI-010, FR-UI-011 | AC-UI-010, AC-UI-011 | P2/P3/T003–T007 | T003–T004 | `skills/spec-tasks/templates/tasks-template.md`, `skills/isolated-browser-qa/SKILL.md` | ORACLE-UI-GOV / ORACLE-UI-FINAL |
| `R-006`/`D-006`/`DEFER-001` | FR-UI-011 | AC-UI-011 | P3/T005–T007 | T003–T004 | `docs/adr/0015-ui-design-source-and-initialization.md`, `CONTEXT.md` | ORACLE-UI-GOV |

## Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| 技能目录与来源 | `skills/catalog.yaml`, `skills/*/skill-bundle.json` | change | T001–T002 | 新技能必须有 owner、consumer、上游、许可证、删除条件 |
| 阶段 manifest | `workflows/*/SKILL.md`, `workflows/*/skill-deps.yaml`, `workflows/build-spec/steps.json` | change | T003–T004 | 接入现有阶段，不新增阶段 |
| Runtime 合同 | `runtime/stage/stage-content-contracts.mjs`, `runtime/review/stage-materials.json` | change | T003–T004 | 让 UI 字段进入现有 plan/task/review/spec-analyze 事实 |
| 浏览器/测试 | `skills/frontend-testing/SKILL.md`, `skills/isolated-browser-qa/SKILL.md`, `workflows/verify-code/design-alignment.mjs` | change | T005–T006 | 复用真实测试和截图证据，不新增 gate |
| 模板 | `skills/spec-plan/templates/plan-template.md`, `skills/spec-tasks/templates/tasks-template.md` | change | T005–T006 | 让每个 UI phase 显式写组件动作和测试/截图 |
| 架构治理 | `docs/architecture/move-map.json`, `docs/architecture/repository-inventory.tsv`, `skills/reuse-registry.md`, `CONTEXT.md`, `THIRD_PARTY_NOTICES.md` | change | T005–T007 | 登记职责、consumer、owner、来源和保留/删除条件 |
| 原始需求/规格 | `specs/ui-frontend-delivery-contract/decision-log.md`, `spec.md` | no change | none | 当前材料冻结，不能由 plan/code 改写 |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"368817c2910a36e63d3ab4642c30270abdecef15dee7caf8050e778f095919ca","id":"CONSTITUTION","version":"1.5.0","clause_count":21}`
- **F1**：三个能力下沉技能，runtime 只编排；证据为 P1 skill packages 与 P2 manifest。
- **F2**：技能只通过窄输入/输出和现有四材料、quality facts 交互；不暴露 runtime 内部状态。
- **F3**：四材料仍是工作 authority，review/test/browser 只作事实；T003–T007 不新增 accepted gate。
- **F4**：计划审查只调用一次并保留 findings/disposition；UI skills 不自审自判。
- **F5**：复用既有五阶段、frontend-testing、isolated-browser-qa；没有新阶段或 UI gate。
- **F6**：事实沿现有 quality/* 外置记录，技能不绑定 runner 或提交。
- **F7**：只保留既有 make-decision/build-plan/verify-code 确认；设计确认不授权 commit/merge。
- **F8**：优先复用现有 lens、模板和 browser QA；Vercel 只做内部 compiled lens。
- **F9**：缺 Design.md、browser 或 consumer 时写 unknown/unavailable，不能假绿。
- **F10**：每个 new 机制在 DEC-002/003 记录真实威胁、已有覆盖、可绕过性和维护成本。
- **Q1**：UI 事实不作进入许可证，但缺质量事实不能宣称设计或阶段完成。
- **Q2**：推进、结构写入和完成结论分离；plan/task 只消费四材料。
- **Q3**：计划独立审查由异源来源产生，主 Agent 只处置 findings。
- **S1**：复用 AgentHub frontend-testing、isolated-browser-qa 与 Vercel MIT compiled guide。
- **S2**：上游技能按 WorkflowHub 宪法改为 advice/fact，不带宿主 gate。
- **S3**：UPSTREAM.md 记录 pinned commit 和版本，迭代时人工比较上游。
- **S4**：自定义技能通过既有 stage/quality facts 采集实际使用和缺失事实。
- **S5**：技能正文、bundle 和 contract tests 可由独立子代理调用，主上下文只收摘要。
- **S6**：ADR/research 保留 AgentHub、Vercel 和外部 UI workflow 事实，不闭门设计。
- **S7**：一个工作流一目录；三个独立能力各自一目录，不新增阶段。
- **S8**：技能只依赖输入/输出合同、可搬运到非 React/Next；Vercel lens 条件适用。

## Phase P1 — 技能包与外部来源闭包

### Goal

交付三个可独立调用的 UI 技能、固定 Vercel 只读上游闭包、ADR/research 事实和 skill/catalog 验证；不接入阶段。

### Files

- **NEW**：`skills/ui-project-init/SKILL.md`, `skills/ui-project-init/skill-bundle.json`, `skills/design-source-readiness/SKILL.md`, `skills/design-source-readiness/skill-bundle.json`, `skills/frontend-component-quality/SKILL.md`, `skills/frontend-component-quality/skill-bundle.json`, `skills/frontend-component-quality/upstream/react-best-practices/AGENTS.md`, `skills/frontend-component-quality/upstream/react-best-practices/LICENSE`, `skills/frontend-component-quality/upstream/react-best-practices/UPSTREAM.md`, `docs/adr/0015-ui-design-source-and-initialization.md`, `docs/adr/0016-external-first-frontend-component-quality.md`, `docs/research/design-md-executable-source-research-2026-08-22.md`, `docs/research/ui-delivery-contract-external-practices-2026-08-22.md`, `docs/research/ui-frontend-simple-workflow-design-2026-08-22.md`, `tests/contract/ui-skill-contract.test.mjs`
- **MODIFY**：`skills/catalog.yaml`, `skills/reuse-registry.md`, `THIRD_PARTY_NOTICES.md`
- **DO NOT TOUCH**：`decision-log.md`, `spec.md`, `runtime/*`, PaperBuilder/F11 source trees。

### Tasks

- `T001`：先写 skill contract RED，断言三技能字段、bundle closure、Vercel commit/license 和无独立 gate。
- `T002`：实现三个技能、外部来源闭包、catalog/reuse/notice 登记并让 T001 GREEN。

### Verify

ORACLE-UI-SKILL

`node --test tests/contract/ui-skill-contract.test.mjs`；RED 非零、GREEN 0；检查唯一 consumer、bundle source/license、`new|legacy`、Read Map 字段、Component Quality Map、Vercel pinned identity 和 unknown/unavailable/N/A 语义；证据 `quality/tests/ui-skill-contract.txt`。

### Knowledge

P2 可读取三个稳定 skill path、bundle 和上游 commit；技能不负责阶段调度、质量 gate 或第二材料；React/Next 之外只执行通用组件质量。

### STOP

若上游 Vercel commit、MIT 许可、技能路径或唯一 consumer 不能核验，保留失败事实并回 `plan.md`，不得用本地模型摘要冒充来源。

### Done

三个 skill 的合同测试 GREEN 或真实 unavailable 已记录；目录、bundle、license、UPSTREAM、owner、consumer、删除条件齐全；没有阶段接线或代码实现声明。

### Risks and rollback

受 `PLAN-RISK-001` 影响；错误来源或重复控制面只删除本 Phase 新文件/登记，保留决策和研究事实，不回滚四材料。

## Phase P2 — 五阶段接线与运行时合同

### Goal

把 UI 适用性、初始化、readiness、UI Contract 和 Component Quality Map 接入既有 workflow dependencies、stage content/review contracts 和 verify design alignment，仍不新增阶段、公共命令或 gate。`design-source-readiness` 的输出先进入既有 `plan-design-review`，再进入 UI Contract；上游未冻结或材料冲突时保持 `unknown` 并 hand back make-decision。

### Files

- **NEW**：`tests/contract/ui-stage-integration.test.mjs`
- **MODIFY**：`workflows/make-decision/SKILL.md`, `workflows/build-spec/SKILL.md`, `workflows/build-spec/skill-deps.yaml`, `workflows/build-spec/steps.json`, `workflows/build-plan/SKILL.md`, `workflows/build-plan/skill-deps.yaml`, `workflows/build-code/SKILL.md`, `workflows/build-code/skill-deps.yaml`, `workflows/verify-code/SKILL.md`, `workflows/verify-code/skill-deps.yaml`, `workflows/verify-code/design-alignment.mjs`, `runtime/stage/stage-content-contracts.mjs`, `runtime/review/stage-materials.json`
- **DO NOT TOUCH**：`runtime/task/`, public CLI surface, `skills/wh-review` review-controller。

### Tasks

- `T003`：先写 workflow/runtime/review 接线 RED，断言 UI 分支顺序、skill ownership、UI fields、无新 stage/gate 和 verify consumer checks；同时覆盖三类 applicability 输入、冲突/重算、caller downgrade、八种状态、preview/confirmation 和 upstream handoff。
- `T004`：接入现有五阶段和 runtime/review contracts，让 T003 GREEN；build-spec 调用 init/readiness → 既有 `plan-design-review`，build-plan/code/verify 调用 component quality，make-decision 只做 applicability；同时让内容合同接受当前材料的 canonical `AC-UI-001`…`AC-UI-011`，并以 legacy compact fixture 防止未知 ID 被放宽。

### Verify

ORACLE-UI-STAGE

`node --test tests/contract/ui-stage-integration.test.mjs`；RED 非零、GREEN 0；检查 manifest path/bundle/trigger、现有 step 顺序、四材料边界、content validator fields、review semantic fields 和 design-alignment consumer；证据 `quality/tests/ui-stage-integration.txt`。

### Knowledge

P3 可以直接修改模板和 browser/testing 文档，使用已冻结的 UI Contract/Component Quality Map 字段；任何缺失事实仍是 quality fact，不是 stage entry gate。

### STOP

若接线需要新阶段、第五材料、公共命令、独立 evidence store、review controller 或 runtime 状态机，停回 `plan.md` 与 `decision-log.md`，不能在实现中扩张。

### Done

五阶段仍按原顺序；UI skill 唯一 consumer 和触发点可由合同测试证明；runtime 只校验/投影既有材料和事实；verify 可沿真实 consumer 检查，不会把截图当设计完成。

### Risks and rollback

受 `PLAN-RISK-001`、`PLAN-RISK-002` 影响；接线失败时只回滚 manifest/runtime 修改，保留 P1 skill 包和 review/test 事实。

## Phase P3 — 计划模板、前端 QA 与治理闭合

### Goal

让每个 UI plan phase/task 明确组件动作、状态/ViewModel/CSS/token、fixture/viewport、browser/a11y/perf、截图和限制；扩展现有 browser-qa payload，使 blocked/unknown 能在保留失败原因时没有截图；用正负行为 fixture 验证组件/CSS 和 design-gap handoff，并以真实合同/治理测试完成闭合。

### Files

- **NEW**：`tests/contract/ui-frontend-governance.test.mjs`
- **MODIFY**：`skills/spec-plan/templates/plan-template.md`, `skills/spec-tasks/templates/tasks-template.md`, `skills/frontend-testing/SKILL.md`, `skills/isolated-browser-qa/SKILL.md`, `runtime/schemas/browser-qa-evidence.v1.json`, `skills/catalog.yaml`, `docs/architecture/move-map.json`, `docs/architecture/repository-inventory.tsv`, `skills/reuse-registry.md`, `CONTEXT.md`, `THIRD_PARTY_NOTICES.md`
- **DO NOT TOUCH**：`specs/ui-frontend-delivery-contract/decision-log.md`, `spec.md`；不把模板字段写回 Design.md。

### Tasks

- `T005`：先写模板、frontend/browser QA、治理 closure RED，断言 UI phase 必须有测试/截图/viewport/fixture 交接、CSS/token/consumer 字段和 move-map/catalog 登记，组件/CSS 负例和 design-gap handoff 字段可被拒绝，且 browser-qa 的 blocked/unknown 不能伪装成 pass。
- `T006`：实现模板、QA 交接、browser-qa schema 的状态/viewport/fixture/Design.md 版本与失败原因字段、设计缺口 handoff、组件/CSS 负例 oracle、治理登记并让 T005 GREEN；保留 N/A/unknown/unavailable 原因和截图只作观察事实。
- `T007`：最终只做一次完整合同/集成聚合，检查全部 FR/AC、task oracles、deferred/open handoff、依赖图和当前快照。

### Verify

ORACLE-UI-GOV

T005/T006 使用 `node --test tests/contract/ui-frontend-governance.test.mjs`，RED 非零、GREEN 0；T007 使用三个合同测试同一命令，expected exit 0，ORACLE-UI-FINAL；证据分别为 `quality/tests/ui-frontend-governance.txt`、`quality/tests/ui-frontend-final.txt`。浏览器实际命令只在未来 build-code 按 task route 执行，本 Phase 不声称页面通过。

### Knowledge

后续 UI 项目可从模板直接读取状态契约和组件质量卡；没有宿主或设计稿可写 N/A/unknown，browser-qa blocked/unknown 必须有非空原因，仍能继续但不能声称视觉完成；DEFER-001 交给独立 PaperBuilder make-decision。

### STOP

若模板或治理测试要求新增第五材料、强制浏览器 gate、CSS 数值阈值、全仓迁移或把 Vercel 规则用于非 React/Next，停回当前 plan；若 OPEN-UI-001 未知，保留 unknown，不自行补数值。

### Done

三个 contract tests 的最终事实、所有适用 FR/AC 映射、任务 oracle、governance registration 和 deferred/open handoff 可被 spec-analyze 读取；质量事实缺失仍显式标注，不报假绿。

### Risks and rollback

受 `PLAN-RISK-002`、`PLAN-RISK-003` 影响；模板/治理不兼容时只回滚 P3 文件，保留 P1/P2 事实并把未解决项交回 build-plan。

## Final current-snapshot aggregate strategy

- **tier / method**：fullstack；使用现有合同测试、`spec-analyze` packet validation 和适用时的 `frontend-testing`/`isolated-browser-qa` 事实；本功能本身不执行目标项目浏览器。
- **scenarios**：UI applicability 不能被 caller 降级；new/legacy 初始化；Design.md 缺失/版本变化；Screen Read Map 缺项；preview ready/unavailable、短提示词、approved/acknowledged/not_approved；组件复用/修改/增状态/新增局部/共享抽取/删除；真实 consumer/CSS/token/ViewModel；每个 UI phase 测试和截图交接；deferred/open handoff。
- **command**：`node --test tests/contract/ui-skill-contract.test.mjs tests/contract/ui-stage-integration.test.mjs tests/contract/ui-frontend-governance.test.mjs`
- **expected exit**：0
- **oracle**：ORACLE-UI-FINAL；三个 skill 可解析、五阶段接线可核验、模板/任务 UI fields 可执行、无额外 gate/control plane、全部当前 FR/AC 与 task oracle 有绑定。
- **fixtures_services**：N/A — reason：WorkflowHub contract feature 不启动目标产品服务；测试使用仓库 fixture 和临时 JSON/Markdown，结束后删除临时目录。
- **evidence_path**：`quality/tests/ui-frontend-final.txt`
- **coverage limits**：覆盖 WorkflowHub skill/manifest/runtime/template 合同；不证明任何具体产品页面的视觉审美、浏览器性能或真实业务 API。
- **STOP**：命令损坏、FR/AC/task oracle 缺失、当前快照越界、发现需要新设计或外部来源无法核验时返回 owning material。
- **execution_contract**：当前快照只运行一次；失败保留原始输出，回受影响 task，不用全量重跑掩盖局部失败。

## Dependency Graph

- **order**：T001 (RED) → T002 (GREEN) → T003 (RED) → T004 (GREEN) → T005 (RED) → T006 (GREEN) → T007 (FINAL)

```text
T001 (RED) → T002 (GREEN) → T003 (RED) → T004 (GREEN) → T005 (RED) → T006 (GREEN) → T007 (FINAL)
```

## Final Boundary Check

- [x] 每个 Phase 的 Goal、Files、Tasks、Verify、Knowledge、STOP、Done、Risks and rollback 完整。
- [x] 每个任务只有一张卡和一个完成区；文件属于所属 Phase NEW/MODIFY。
- [x] 每个行为变化都有同命令、同 oracle 的 RED → GREEN；FINAL 只做一次聚合。
- [x] 依赖无环，FR/AC 双向追溯闭合，unknown/unavailable/N/A 都有原因。
- [x] review、test、evidence 只作为事实记录，不是开始、继续或交付许可证。
