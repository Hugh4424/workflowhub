# Decision Log

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 | 修复 WorkflowHub 对前端标准化、统一性、组件化、可维护性和真实 UI 验收的能力缺口。 | host-visible requirement #1："基于workflowhub的能力和流程，看看这些问题的根本原因是什么，应该如何处理" | 研究事实已收集；待方向确认。 |
| R-002 | 将 `Design.md` 恢复为前端构建的核心规范入口，并决定其正确形态、使用方式和相关技能/模板改造。 | host-visible requirement #2："Design.md...完全没作为整个前端构建流程中的核心规范文件" | 待决定设计源边界。 |
| R-003 | 同一任务完成 WorkflowHub 修复；不处理 PaperBuilder 产品代码。 | host-visible requirement #2："我只想在当前任务进行workflowhub的修复，不用考虑PaperBuilder的修复了" | D-001 已确认。 |
| R-004 | 从 `make-decision` 开始，不跳阶段；先梳理流程、页面范围、数据状态、成功/失败边界、非目标和延期项。 | host-visible requirement #4："请按标准 WorkflowHub 开始这个任务吧，从 make-decision 开始" | 当前阶段执行中。 |
| R-005 | Talk 用大白话说明选项、后果和风险；记录选择、理由和延期交接。 | host-visible requirement #4："Talk 请用大白话说明选项、后果和风险" | 当前阶段执行中。 |
| R-006 | 整理 WorkflowHub 治理能力问题到 Downloads 文件，并在当前任务发现新问题时持续更新。 | host-visible reply #5："请整理一下放在本机下载文件夹中...当前任务执行中如果有问题，也更新在这个文件中" | D-006 已确认。 |

## 目标

- 目标：让 WorkflowHub 在一个既有五阶段、四份当前材料的任务内，把项目设计规范、组件/页面消费者、前后端契约和真实验收证据串成可解析、可消费、可验证的交付链。

## 完整用户流程、状态和边界

### 用户流程

1. 使用者提出变更，`make-decision` 从原始需求判定 `non_ui`、`ui`、`backend`、`fullstack` 或 `unknown`，并说明判定理由；`unknown` 不能伪装成不适用。
2. `ui` 或 `fullstack` 变更定位项目唯一 `Design.md`（视觉/组件规则）和项目唯一 `Experience.md`（页面/交互/测试），及各自章节、锚点和当前内容身份；纯 `backend` 仍要定位 API、DTO、schema/migration、persistence 和真实 consumer，但不无故要求页面重做。
3. `build-spec` 只能细化已经确认的用户结果：`Design.md` 使用/变更、`Experience.md` 的 `route/screen/region × viewport × state × interaction × scenario`，后端的 `endpoint → DTO → schema/migration → persistence → consumer → failure`，以及跨边界的 fullstack slice；它不得补写未确认的产品需求。
4. `build-plan` 必须安排受影响消费者与变更顺序。当前没有可信 census 能力，因此本任务要新增可复现的源码 census；上线后由该阶段生成 route/import/lazy/CSS 和数据消费者事实，再由人补页面语义、Design anchor 和视觉 oracle。
5. `build-code` 是 `Design.md` 的唯一 writer：同步实现、迁移和设计规则变更，并由既有阶段的一次性受控测试命令完成服务/API identity、真实浏览器、证据采集与 cleanup；不新增持久 Runner 对象。
6. `verify-code` 不重做产品测试；它核对当前 diff、Design 内容身份、consumer census、所选合同和真实证据是否一致，按事实给 `covered`、`incomplete`、`unknown` 或失败结果。

### 关键数据状态

- 影响分类：`non_ui | ui | backend | fullstack | unknown`；由真实受影响消费者决定。
- 设计源：`not_applicable | bound_current | missing | update_required | stale | unknown`。适用 UI/用户可见跨边界任务必须绑定并使用当前 `Design.md` anchor/content identity；只有原则、token、组件、模式、a11y、性能或治理规则本身变化时才是 `update_required`。
- 体验源：`not_applicable | bound_current | missing | update_required | stale | unknown`。适用 UI/用户可见跨边界任务必须绑定 `Experience.md`；页面、流转、交互状态或长期测试场景变化时是 `update_required`。
- consumer 与合同：每项为 `known | unknown | not_applicable`，不能把找不到当作不存在。
- 质量结论：`covered | incomplete | unknown`；执行过程另保留 `not_run | passed | failed | unavailable`，不得把后者压成 PASS。
- 服务与浏览器：记录 `not_started | healthy | failed | cleanup_failed` 和实际 API/DTO 身份；fixture-only 只能是组件证据，不能替代真实页面验收。

### 成功/失败边界

- 成功边界：选中的 UI、后端或 fullstack 合同都有当前材料、Design/consumer 身份和真实验证事实；才可声明对应范围 `covered`。`Design.md` 被正确使用但规则未变时，`bound_current` 即可；`non_ui` 不必携带无关 Design/browser 证据。
- 可继续修复：缺 Design 绑定、消费者、浏览器、API/DTO/持久化链等质量事实时，相关结论为 `incomplete`，同一任务仍可修复和补证据。
- 方向停止线：若完整流程、页面/消费者范围、关键数据状态、成功/失败边界、非目标或延期项未在 `make-decision` 确认，不能进入 `build-spec` 让其猜需求。
- 失败边界：只扩写 `Design.md`、只增加 Skill/模板文字、只通过单元测试、把 fixture 页面当真实页面、或只声明 Skill 依赖而没有实际执行，均不算完成。

## 范围

- 当前范围：WorkflowHub 的 Design Source、UI/全栈合同、五阶段 consumer、任务模板、证据 schema、消费者 census、真实验收接线及回归测试。
- 用户流程、状态和边界已在本材料完整记录；`build-spec` 只能将其编成可测试的合同，不能补需求。
- 初步 UI applicability：`ui`。证据是原始需求直接要求 WorkflowHub 修复前端设计和验收流程；具体页面/路由是被治理项目的输入，不是本任务新增的 WorkflowHub 产品页面。
- 已确认范围：适用改动必须覆盖 UI 与 API、DTO、schema/migration、持久化和真实消费者；跨边界必须有 fullstack slice。

## 初步流程、状态与范围盘点

- 使用者流程：创建或继续一个 WorkflowHub task → make-decision 判定 UI/全栈适用性和 Design Source → build-spec 写用户结果和状态 → build-plan 生成消费者/实现矩阵 → build-code 改设计资产和代码并采集真实证据 → verify-code 验证合同、消费者、当前 diff 与证据对应关系。
- 页面范围：本任务不新增某个业务应用页面；它治理被接入项目的 `route / screen / region / viewport / state`，并要求每项 UI 改动声明受影响页面或明确 non-UI。
- 数据状态：最小方向为 UI applicability、Design revision/content identity、design anchor、route/import/lazy/CSS consumer census、API/DTO/持久化 consumer、AC evidence。具体字段和唯一来源留给 build-spec，当前不猜。
- 成功结果：适用 UI 或跨边界任务能得到准确的 `covered` 或 `incomplete` 质量事实；非 UI 任务不被额外流程拖慢。
- 失败结果：设计源缺失/漂移、consumer 未知、真实服务失败、fixture 替代页面、证据过期或清理失败时，保留准确失败/未知事实，不伪造通过。
- 剩余方向未决：真实浏览器执行链/evidence v2 是否必须在当前任务交付；只等待 Talk Round 3 的无持久对象执行责任澄清。

## 非目标

- 不修改 PaperBuilder 产品代码、页面、数据或历史任务。
- 不新增第六阶段、第五份任务材料、第二套任务状态机或永久兼容双写。
- 不强制采用 Figma、Storybook、Chromatic 或某一前端框架；它们只能是可选适配器。
- `Experience.md` 不得定义颜色、排版、间距、token、视觉组件规则或第二套样式系统；它是体验/测试规范，不是视觉规范。
- 不把缺质量事实变成禁止同任务修复的 Gate。
- 不把 Downloads 治理问题清单当作第五份任务材料或阶段推进依据；它只是后续治理的规划输入和本任务问题日志。

## 延期交接

- 会话可信绑定诊断、已合并候选的 review baseline、大材料审查分片和历史事件 producer 定位，保留在 Downloads 治理清单的 G-009 至 G-011；它们不阻塞本任务的 UI/全栈合同闭环。
- 不强制接入 Figma、Storybook、Chromatic 等外部产品；未来如需适配，只能消费本任务建立的单一 `Design.md` 合同和证据接口。
- 首版 census 的框架/动态模式支持范围由 build-spec 明确；无法可靠覆盖的模式必须输出 `unknown` 并交人工补充，不能冒充全量扫描。

## 决定

### D-001
- question/final_option: 修复范围落在哪个任务；仅当前 WorkflowHub 任务。
- recommendation/plain_language: 推荐；把流程能力修复与 PaperBuilder 产品修复分开，才能验证通用能力。
- decision: 本任务只改 WorkflowHub；PaperBuilder 仅作为历史发现来源，不作为实现目标。
- source_type/reference/exact_excerpt: user_requirement / R-003 / "我只想在当前任务进行workflowhub的修复，不用考虑PaperBuilder的修复了。"
- approval_binding: 用户明确提出；最终方向确认待后续 Talk。
- facts_and_constraints: 当前会话无匹配可续 TaskHandle，已新建并绑定本任务；工作区已有三处无关未提交改动。
- Logic: 用户范围约束 -> 避免把治理与产品修复混写 -> 修复可复用 WorkflowHub 能力。
- choice_reason/impact: 保持唯一目标；影响五阶段、相关模板/运行时/测试。
- consequences_and_risks: 能避免产品范围膨胀；需用通用 fixtures/契约测试证明效果。
- rejected_alternatives: 同时改 PaperBuilder；拒绝，违反用户范围。
- unresolved_items/owner: 设计源边界和前后端覆盖深度待 Talk；owner=用户与 make-decision。
- Supersedes: none.

### D-002
- question/final_option: 是否按标准 WorkflowHub 阶段推进；从 make-decision 开始且不依赖 build-spec 补需求。
- recommendation/plain_language: 必须遵守；先把要解决什么说清，后面才不会把技术方案当需求。
- decision: 当前仅执行 make-decision 的真实 Talk、调研、审查、Grill 和确认；不进入 build-spec。
- source_type/reference/exact_excerpt: user_requirement / R-004 / "从 make-decision 开始，不要跳阶段，也不要依赖 build-spec 补需求。"
- approval_binding: 用户明确提出。
- facts_and_constraints: 当前 task 已绑定会话；`load-context` 已启动。
- Logic: 原始要求 -> 先收敛方向和边界 -> 下游不猜需求。
- choice_reason/impact: 防止由旧报告或实现反推需求；影响所有后续材料。
- consequences_and_risks: 前期需要真实问答；换来更少返工。
- rejected_alternatives: 直接写 spec/plan；拒绝，违反用户要求。
- unresolved_items/owner: Talk Round 1 的方向问题待用户回答；owner=用户。
- Supersedes: none.

### D-003
- question/final_option: 本任务的合同覆盖范围；UI 加完整前后端消费者链。
- recommendation/plain_language: 推荐；用户选择一次补齐 UI 与跨边界设计遗漏。
- decision: UI 改动及任何跨边界改动必须表达并验证 `API -> DTO -> schema/migration -> persistence -> consumer`，并有 fullstack slice。
- source_type/reference/exact_excerpt: user_reply / Talk Round 1 Q1 / "1-2"
- approval_binding: 用户实际回复；最终方向确认待后续 Talk。
- facts_and_constraints: 现有正式计划/AC validator 对这些 UI/后端专项合同均无稳定 consumer。
- Logic: 已发现的遗漏跨 UI 和后端 -> 只修 UI 会留下同类漏洞 -> 统一合同覆盖两端。
- choice_reason/impact: 解决根因；影响 spec、plan、build-code、verify-code 的结构和测试。
- consequences_and_risks: 任务实现面扩大；通过固定 matrix 和 non-UI 不适用路径控制范围。
- rejected_alternatives: UI-only；拒绝，会保留后端消费者设计缺口。全治理重写；拒绝，超出单任务可验证范围。
- unresolved_items/owner: 后端 matrix 的最小字段和 fullstack 定义待 Round 2；owner=用户与 make-decision。
- Supersedes: none.

### D-004
- question/final_option: `Design.md` 的规范载体；单文件优先，最多允许一个 `Experience.md`。
- recommendation/plain_language: 用户选择单文件；减少项目多文件维护和查找成本。
- decision: `Design.md` 是项目唯一视觉与组件规范文件，承载原则、token、组件、视觉模式、视觉 a11y、性能、变更和治理；页面/状态、流转、交互实例和测试细节由 D-016 的项目唯一 `Experience.md` 承载。
- source_type/reference/exact_excerpt: user_reply / Talk Round 1 Q2 / "每个项目维护多个文件才会导致更高的维护成本和混乱，尽量保证在一个文件中维护。最多最多，可以新增一个Experience.md文件"
- approval_binding: 用户实际回复；最终方向确认待后续 Talk。
- facts_and_constraints: 用户接受最多两份项目级文件，但二者必须有稳定章节、锚点、版本/hash 和严格不可重叠的责任，避免再次变成简陋清单或双写。
- Logic: 用户维护成本约束 -> 视觉与体验各一份唯一来源 -> 用结构化章节而非多文件分散事实。
- choice_reason/impact: 直接满足用户维护偏好；影响 Design/Experience 模板、parser、readiness 和测试设计。
- consequences_and_risks: 文件会变大；以目录、锚点和生成索引控制，不拆 token/组件或页面/交互规范为多份手工文档。
- rejected_alternatives: 多个 canonical token/组件/测试文件；拒绝，用户认为会增加混乱。只保留简短说明；拒绝，无法承担核心规范职责。
- unresolved_items/owner: Experience 的既有项目覆盖门槛由 Grill Q3 确认；owner=用户。
- Supersedes: D-016 修正其原“Experience 仅在阈值后存在”的表述。

### D-005
- question/final_option: 缺专项质量事实时的流程语义；`incomplete` 但同任务可继续修复。
- recommendation/plain_language: 推荐；如实说明未验收，同时不把修复本身卡死。
- decision: 缺 Design 绑定、consumer census、浏览器、API/DTO/持久化或 fullstack evidence 时，相关质量结论为 `incomplete`；同一任务可继续修改和补证据。
- source_type/reference/exact_excerpt: user_reply / Talk Round 1 Q3 / "3-2"
- approval_binding: 用户实际回复；最终方向确认待后续 Talk。
- facts_and_constraints: 当前系统的风险是通用完成路径把缺专项事实掩盖为完成；硬 Gate 又会阻断修复。
- Logic: 用户选择 -> 区分继续工作与完成声明 -> 真实缺口可见且可修。
- choice_reason/impact: 保持 vNext anti-gate 边界；影响 validator、stage result 和回归测试。
- consequences_and_risks: 需要准确显示每项缺口；不能再用笼统 PASS 总结。
- rejected_alternatives: 缺证据即阻塞修复；拒绝。仅提示不改变声明；拒绝，会继续产生伪完成。
- unresolved_items/owner: 各合同的最小 required evidence 待 Round 2；owner=用户与 make-decision。
- Supersedes: none.

### D-006
- question/final_option: 是否保留独立治理问题清单；在 Downloads 创建并随当前任务发现更新。
- recommendation/plain_language: 用户要求；该文件服务未来治理，不替代本任务材料。
- decision: 创建 `workflowhub-governance-capability-issues-20260826.md`，记录范围、已核实问题、证据、处理建议、状态和本任务新增发现；每次新增问题同步更新。
- source_type/reference/exact_excerpt: user_reply / R-006 / "我后续会使用这个文件进行治理任务。当前任务执行中如果有问题，也更新在这个文件中。"
- approval_binding: 用户实际回复。
- facts_and_constraints: 当前任务四份材料仍是唯一任务真相；Downloads 文件不可作为阶段 writer 或推进许可证。
- Logic: 用户需要未来治理输入 -> 保留独立可读清单 -> 与正式 task state 隔离。
- choice_reason/impact: 便于后续治理选择；本任务只追加已核实事实。
- consequences_and_risks: 文件可能被误当验收；头部明确其非正式交付状态。
- rejected_alternatives: 不建清单；拒绝，违背用户用途。将它列为第五任务材料；拒绝，违背 vNext 边界。
- unresolved_items/owner: 当前任务中新发现项由主任务维护；未来治理优先级由用户决定。
- Supersedes: none.

### D-007
- question/final_option: 何时使用完整全栈合同；按真实消费者影响决定。
- recommendation/plain_language: 推荐，用户选择；不让纯后端小改动背负无关页面验收，也不让跨边界改动漏链。
- decision: 纯 UI 使用 UI 合同；纯后端使用 API/DTO/schema/persistence/consumer 合同；同一改动跨越两端时必须有 fullstack slice。
- source_type/reference/exact_excerpt: user_reply / Talk Round 2 Q1 / "1-2"
- approval_binding: 用户实际回复；最终方向确认待后续 Talk。
- facts_and_constraints: 现有三选一路由会允许执行者遗漏受影响层。
- Logic: 真实影响 -> 最小完整合同 -> 避免过度与遗漏。
- choice_reason/impact: 对所有阶段的 contract selection 和测试 matrix 生效。
- consequences_and_risks: 需要可信消费者识别；由 D-008 的 census 支撑。
- rejected_alternatives: 所有后端均强制 UI；拒绝，成本过高。自行选择 track；拒绝，现有缺口来源。
- unresolved_items/owner: 影响分类字段待 build-spec 定义；owner=build-spec。
- Supersedes: none.

### D-008
- question/final_option: 页面、组件和 CSS 范围来源；源码 census 加人工语义补充。
- recommendation/plain_language: 推荐，用户选择；机器负责找客观消费者，人负责解释视觉和业务含义。
- decision: build-plan 生成 route/import/lazy/CSS consumer census；人工映射 screen/state、Design anchor 和视觉规则；未知消费者保留 `unknown`。
- source_type/reference/exact_excerpt: user_reply / Talk Round 2 Q2 / "2-2"
- approval_binding: 用户实际回复；最终方向确认待后续 Talk。
- facts_and_constraints: 现有 Component Quality Map 只信调用方输入，不能自证完整。
- Logic: 当前源码事实 + 人工语义 -> 完整范围 -> 安全复用、拆分和删除。
- choice_reason/impact: 影响 build-plan、component quality validator 和删除安全测试。
- consequences_and_risks: census 不能自动判断设计正确性；此部分必须保持人工 anchor。
- rejected_alternatives: 纯手写清单；拒绝，易漏。自动判定所有语义；拒绝，假精确。
- unresolved_items/owner: census 的可支持框架与 unknown 表达待 build-spec；owner=build-spec。
- Supersedes: none.

### D-009
- question/final_option: `Design.md` 的唯一 writer；只有规范变化才由 build-code 写，前后阶段分别声明和校验。
- recommendation/plain_language: 推荐，用户选择；需求阶段不偷偷改项目，代码阶段也不能忘记改规范；但“使用规范”不等于“改规范”。
- decision: build-spec 写 `Design.md` 的 current anchor、使用方式及是否 `update_required`；build-plan 只在 `update_required` 时安排规范变更；build-code 是唯一 writer；verify-code 校验最终 revision/content identity 与实现一致。
- source_type/reference/exact_excerpt: user_reply / Talk Round 2 Q3 / "3-2"
- approval_binding: 用户实际回复；由 D-013 补充更新触发条件。
- facts_and_constraints: 当前没有设计源 owner/writer，导致版本字符串可脱离真实内容；同时把每次页面改动都等同规范改动会制造维护噪声。
- Logic: 先绑定/使用当前规则 -> 只在规则变化时明确写入职责 -> 最后独立核对。
- choice_reason/impact: 解决规范漂移而不把 `Design.md` 误当交互日志；影响 project Design.md 更新和 stage consumer。
- consequences_and_risks: 规范变化漏更新会如实 `incomplete`；单纯页面/交互变化不因未改 `Design.md` 被误判失败。
- rejected_alternatives: 早期阶段直接写项目文件；拒绝，易与实现脱节。任意阶段写；拒绝，版本混乱。所有 UI 改动强制改 `Design.md`；拒绝，违背其规范文件定位。
- unresolved_items/owner: content identity 格式与跨 repo 文件定位待 build-spec；owner=build-spec。
- Supersedes: none.

### D-010
- question/final_option: `Experience.md` 的创建条件；仅在内容无法清晰索引时受限创建。
- recommendation/plain_language: 推荐，用户选择；保持单文件优先，同时不把大量实例塞坏核心规范。
- decision: 默认只维护 `Design.md`；只有端到端页面流转、交互实例或测试细节已无法清晰索引时才可创建唯一 `Experience.md`，它只能引用 `Design.md` anchors，不能定义第二套组件/token 规则。
- source_type/reference/exact_excerpt: user_reply / Talk Round 2 Q4 / "4-2"
- approval_binding: 用户实际回复；最终方向确认待后续 Talk。
- facts_and_constraints: 用户明确要求最少文件；同时核心规范必须长期可读。
- Logic: 单文件默认 -> 超出可读边界才拆实例 -> 仍保持唯一规则来源。
- choice_reason/impact: 影响 Design template、validator 和 project initialization。
- consequences_and_risks: 需要给“无法清晰索引”一个可审查阈值；待 build-spec 定义。
- rejected_alternatives: 永不拆分；拒绝，可能破坏可读性。默认创建；拒绝，增加维护文件。
- unresolved_items/owner: 创建阈值和 Experience 内容清单待 build-spec；owner=build-spec。
- Supersedes: none. 后续被 D-016 替代其“按阈值才创建”的部分；保留原始选择过程。

### D-011
- question/final_option: make-decision 是否必须在本阶段写全用户流程、状态、成功/失败、非目标和延期，而不是交给 build-spec。
- recommendation/plain_language: 必须；这正是用户要求的“先说清要做什么”。后面的阶段只能做细化和实现，不能替用户补决定。
- decision: 将“完整用户流程、页面/消费者范围、数据状态、成功/失败边界、非目标和延期”作为本 decision-log 的方向完成条件；未确认前停止在 make-decision。
- source_type/reference/exact_excerpt: user_requirement / R-004 / "先基于原始需求，在make-decision的过程中和我一起仔细梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项。"
- approval_binding: 用户明确提出；本材料已据此重构，剩余两项由 Talk Round 3 确认。
- facts_and_constraints: 独立审查有效 finding `F-3cce48f6ece6` 指出当前方向没有把 UI governance contract 写进 make-decision；其他审查意见虽为 `invalid_anchor`，但与 R-004 一致，已作为方向完整性自检而非审查事实采纳。
- Logic: 原始需求 + 审查纠偏 -> 方向材料先完整 -> 防止 build-spec 代替用户决策。
- choice_reason/impact: 使后续四阶段有唯一的需求边界；影响 make-decision 完成条件和回归测试。
- consequences_and_risks: 前期多一次确认；避免需求在实现后才暴露。
- rejected_alternatives: 把范围和状态留给 build-spec；拒绝，违反 R-004。
- unresolved_items/owner: Talk Round 3 的 Design 触发与真实 QA 交付深度；owner=用户。
- Supersedes: none.

### D-012
- question/final_option: 消费者 census 是否可以假定已存在；否，作为当前任务明确交付。
- recommendation/plain_language: 推荐；先承认现在没有，再把“新工具由谁跑、结果怎么用”写清，不能拿一个未来能力当既成事实。
- decision: 当前没有 route/import/lazy/CSS/data consumer census；本任务须实现一个可复现的 census producer，并让后续 `build-plan` 正式消费其结果。它不能只作为 Skill 建议或人工 map。
- source_type/reference/exact_excerpt: research_fact / F-005、F-006 / "Component map 不扫描真实 consumers；skill-deps 只加载/解析 package。"
- approval_binding: 由 D-008 的用户选择和当前事实推出；最终方向确认待后续 Talk。
- facts_and_constraints: 审查 `F-b27280e47306` 因 anchor 无效不作为有效 finding，但其指出的前提混淆已按现有研究事实纠正。
- Logic: 没有当前能力 -> 明确新增 producer 和 consumer -> 以后每个项目的范围可复现。
- choice_reason/impact: 避免 plan 再次只写手工清单；影响 build-plan runtime、证据 schema 和集成测试。
- consequences_and_risks: 首版只能支持声明的框架/模式，不支持的消费者必须 `unknown`，不可默默遗漏。
- rejected_alternatives: 假定现有 map 就是 census；拒绝，事实不成立。
- unresolved_items/owner: 支持范围和输出结构在 build-spec 固化；owner=build-spec。
- Supersedes: none.

### D-013
- question/final_option: 使用 `Design.md` 与更新 `Design.md` 是否是同一件事；否。
- recommendation/plain_language: 推荐，用户确认；先用既有规范做页面，再只在规范本身要变时更新它。页面流转和交互不是 `Design.md` 的职责。
- decision: UI 或用户可见跨边界改动必须声明并使用 `Design.md` 的当前 anchor/content identity；仅当规范规则变化时才更新 `Design.md`。页面流转、交互实例和测试细节由 D-016 的项目唯一 `Experience.md` 承担；它不得定义视觉/样式规范。
- source_type/reference/exact_excerpt: user_reply / Talk Round 3 Q1 / "如果当前需求只需要使用Design.md里的规范和组件，那就只需要使用Design.md就够了，没必要更新吧。这个文件是规范，不是交互！页面或交互有变化，可以更新Experience.md。"
- approval_binding: 用户实际回复；最终方向确认待 Talk Round 3 Q2 澄清。
- facts_and_constraints: 原 Q1 的“UI 改动必须更新”把规则使用和规则演进混为一谈，已被用户纠正。
- Logic: 单一规范源 -> 使用与变更分开 -> 交互实例留在受限 Experience -> 不制造无意义文档更新。
- choice_reason/impact: 明确 `bound_current` 与 `update_required`；影响 spec、plan、build-code、verify-code 和 project template。
- consequences_and_risks: 执行者必须能说明“使用了什么规则、为什么未改规则”；不能只引用模糊版本字符串。
- rejected_alternatives: 所有 UI/跨边界改动更新 `Design.md`；拒绝，用户明确否定。把页面交互写回 `Design.md`；拒绝，文件不是交互记录。
- unresolved_items/owner: 无；体验文件的长期覆盖边界由 Grill Q3 确认；owner=用户。
- Supersedes: Talk Round 3 Q1 的原 option 2 表述。

### D-014
- question/final_option: 真实浏览器验收如何交付；本任务交付既有 build-code 的一次性受控测试命令，不新增 Runner 对象。
- recommendation/plain_language: 推荐，用户确认；真正需要的是可靠地测到正确服务和正确页面，不需要再造一个常驻对象或新流程。
- decision: 在既有 `build-code` 内实现一次性执行链：启动并确认服务/API 身份 → 调用隔离浏览器 → 采集新版 evidence → cleanup。不得新增名为 Runner 的公共命令、持久状态、任务对象或阶段。
- source_type/reference/exact_excerpt: user_reply / Talk Round 3 Q2 / "2-1确认"
- approval_binding: 用户实际确认；最终方向确认待 Grill、detail advice 和最终方向卡。
- facts_and_constraints: 当前浏览器 Skill 只管理隔离浏览器，不能自行保证应用服务、API identity、端口 owner 或应用 cleanup；当前缺的是该执行责任，不是一个新的领域/运行时对象。
- Logic: 真实验收必须有稳定服务与证据链 -> 复用既有 build-code 一次性命令 -> 避免扩张控制面。
- choice_reason/impact: 解决 G-005/G-006，同时符合既有 public runtime 和四份材料边界；影响 build-code、browser evidence、集成测试。
- consequences_and_risks: 实现成本高于手工步骤；若服务或 cleanup 失败，证据必须保留失败/`incomplete`，不能回退为 fixture PASS。
- rejected_alternatives: 新增/持久化 Runner；拒绝，用户否定且会新增控制面。人工操作；拒绝，仍可跳过或测错服务。延期；拒绝，保留当前根因。
- unresolved_items/owner: 命令入口、证据字段和失败输出由 build-spec 在本决定边界内固化；owner=build-spec。
- Supersedes: Talk Round 3 Q2 的“runner”术语，改称“一次性受控测试命令”。

### D-015
- question/final_option: 浏览器验收命令的正式术语；“受控真实 QA 执行链”。
- recommendation/plain_language: 推荐，用户确认；它说明这是既有阶段的一次性行为，不会与 WorkflowHub 的调用身份或持久对象混淆。
- decision: 在用户可见材料、合同、测试和代码注释中使用“受控真实 QA 执行链”；保留 `runner` 仅指 WorkflowHub 的每次调用执行身份。不得由此名称新增对象、公共命令、持久状态或阶段。
- source_type/reference/exact_excerpt: user_reply / Grill Q1 / "1-1"
- approval_binding: 用户实际确认；最终方向确认待 Grill 完成、detail advice 和最终方向卡。
- facts_and_constraints: `CONTEXT.md` 已定义 runner 为 per-invocation identity；同词指浏览器命令会冲突。
- Logic: 已有术语 -> 固定不冲突的新名称 -> 降低实现误导。
- choice_reason/impact: 影响 build-code、evidence schema、阶段提示词和测试命名；不改变公共 runtime。
- consequences_and_risks: 文本需要一次性统一替换；不应把命名替换伪装为功能修复。
- rejected_alternatives: 继续叫 Runner；拒绝，术语冲突。无固定名称；拒绝，合同和测试会漂移。
- unresolved_items/owner: Experience 信息的长期承载边界；owner=用户。
- Supersedes: D-014 中的旧称“一次性受控测试命令”。

### D-016
- question/final_option: `Experience.md` 是临时例外文件还是项目唯一的体验规范；项目唯一的体验规范。
- recommendation/plain_language: 用户确认；它和 `Design.md` 分工，不是重复。前者回答“页面怎样走、用户怎样操作、怎样验证”，后者回答“界面长什么样、组件怎样统一”。
- decision: 每个适用 UI 项目维护唯一 `Experience.md`，集中记录所有页面、区域、流转、交互状态、异常/恢复、可访问性交互语义和长期测试场景。它不记录颜色、排版、间距、token、视觉组件规则或样式；这些始终只属于 `Design.md`。页面/交互/测试变化更新 `Experience.md`；视觉或组件规则变化更新 `Design.md`；同一变更可同时更新二者。
- source_type/reference/exact_excerpt: user_reply / Grill Q2 / "不是创建唯一Experience.md，而是项目唯一的Experience.md，所有页面、交互、细节都写在这里面，相当于第二套规范...不涉及到样式，只和交互、页面、测试有关"
- approval_binding: 用户实际确认；最终方向确认待 Grill Q3、detail advice 和最终方向卡。
- facts_and_constraints: 用户最初允许最多一个 Experience；本次明确其应为项目级长期文件，而非按单次 task 临时创建。它的边界必须严格排除样式，防止和 Design.md 双写。
- Logic: 视觉规范与体验行为分别有唯一来源 -> 每次变更知道该写哪里 -> 页面与测试细节不挤进 Design.md。
- choice_reason/impact: 增加唯一的项目体验合同，但不新增 task 材料或阶段；影响项目初始化、spec/plan/build-code/verify-code 和测试模板。
- consequences_and_risks: 需要初始页面盘点和持续维护；若 Experience 缺受影响页面/状态，相关结论应为 `incomplete`，不能用 Design.md 代替。
- rejected_alternatives: 只在阈值满足时才创建 Experience；拒绝，无法成为全项目体验来源。把交互写回 Design；拒绝，用户明确区分。允许多个 Experience；拒绝，增加维护混乱。
- unresolved_items/owner: 既有大型项目从何种覆盖门槛开始与新增页面如何处理；owner=用户。
- Supersedes: D-010 的创建阈值；D-013 中“可能创建 Experience”的表述。

### D-017
- question/final_option: 存量项目首次建立 `Experience.md` 的覆盖语义；全量列出已发现页面，按真实完成度迁移。
- recommendation/plain_language: 推荐，用户确认；先让所有已发现页面“有位置”，再把这次受影响页面写全。未补完必须老实标注，不能用一个新文件假装项目已经标准化。
- decision: 先由 census 生成已发现页面/消费者清单，并在项目唯一 `Experience.md` 为每项建立条目。当前任务受影响页面必须有完整流程、状态、交互和测试场景；其他页面可暂为 `unknown` 或 `incomplete`，同一 task 可继续补齐。只有证据证明的覆盖范围可声明 `covered`。
- source_type/reference/exact_excerpt: user_reply / Grill Q3 / "3-1"
- approval_binding: 用户实际确认；最终方向确认待 Grill Q4、detail advice 和最终方向卡。
- facts_and_constraints: `Experience.md` 被选择为全项目事实源；不声明未盘点的页面，才能避免把增量迁移伪装成全量完成。
- Logic: census 先给范围 -> 每页有显式状态 -> 受影响页面强制详细 -> 其他页面如实留缺口。
- choice_reason/impact: 影响 project initialization、census 输出、Experience template、quality declaration 和 migration tests。
- consequences_and_risks: 初始清单会暴露历史缺口；但这些缺口不阻止同 task 修复，且不会被自动降成“不适用”。
- rejected_alternatives: 历史全补完才可改代码；拒绝，会不必要阻断。只写本次页面；拒绝，Experience 失去项目事实源职责。
- unresolved_items/owner: Experience 中“测试细节”保存场景还是保存每次运行结果；owner=用户。
- Supersedes: none.

### D-018
- question/final_option: `Experience.md` 的测试细节是否保存每次运行结果；否，只保存长期可复用的验收场景和边界。
- recommendation/plain_language: 推荐，用户确认；规范告诉后来的人“该怎么验”，证据告诉当前任务“这次实际验到了什么”。把两者分开才不会把旧截图当新结论。
- decision: `Experience.md` 保存场景、操作、预期结果、覆盖边界及 AC/Design anchor；当前 task 的 `quality/evidence/` 保存每次运行的截图、日志、hash、实际结果、服务/API identity 和 cleanup 事实。Experience 不保存可过期的运行结果。
- source_type/reference/exact_excerpt: user_reply / Grill Q4 / "4-1"
- approval_binding: 用户实际确认；最终方向确认待 detail advice 和最终方向卡。
- facts_and_constraints: 历史运行证据会过期或与当前 snapshot 不一致；但验收场景应跨 task 复用。
- Logic: 稳定场景与时效证据分层 -> 防止过期假绿 -> 仍可稳定回归。
- choice_reason/impact: 影响 Experience template、evidence schema、verify-code 一致性校验和回归测试。
- consequences_and_risks: 需要两处有明确链接：Experience 指向 AC/anchor，evidence 指向当前 task/material/snapshot；不得双写结果。
- rejected_alternatives: 把每次结果写进 Experience；拒绝，会堆积失效事实。不记录测试；拒绝，无法证明交互回归。
- unresolved_items/owner: 无；Grill 的方向问题已收敛。
- Supersedes: none.

### D-019
- question/final_option: 是否确认方向草案并进入 `build-spec`；确认。
- recommendation/plain_language: 推荐，用户确认；已完成需求、事实、风险、双文档职责、全栈合同和真实验收边界的收敛，下一阶段只把这些已确认内容编成可测试规格。
- decision: 用户确认当前方向。make-decision 结束后进入标准 `build-spec`；不得用 build-spec 修改已确认范围、补造用户需求或把 detail advice 的无 finding 写成质量 PASS。
- source_type/reference/exact_excerpt: user_reply / final direction confirmation / "确认方向，请确认当前会话最开始的调研和方案，都记录在decision-log中了，没问题就继续吧"
- approval_binding: 用户实际确认；调研索引已补入本材料，确认覆盖完整方向草案。
- facts_and_constraints: detail advice 有两次不可用和一次 available/no finding；均已保留。当前 task 的四份材料仍是唯一工作真相；Downloads 治理清单只是后续输入。
- Logic: 原始需求、研究、Talk、Grill、独立建议和用户确认齐全 -> 方向可冻结 -> 下游只细化和实现。
- choice_reason/impact: 授权进入 build-spec；影响同一 task 的后续四阶段。
- consequences_and_risks: 实现仍必须证明正式 consumer、真实 evidence 和回归，不能凭本确认称已完成。
- rejected_alternatives: 未经最终确认进入 build-spec；拒绝。把当前调研清单当独立任务材料；拒绝。
- unresolved_items/owner: 无方向未决项；延期治理项由未来任务的用户选择决定。
- Supersedes: none.

### D-020
- question/final_option: review 绑定修复前快照是否意味着当前任务未完成；否。
- recommendation/plain_language: 推荐按“审查过、问题已修复、当前检查完成、用户接受”判断完成；不要把 `clean` 当成永远要追的标签。
- decision: review 事实保留它实际审查的 `reviewed_snapshot`；修复事实、当前检查和人工确认分别绑定修复后的当前快照。只要 actionable finding 已逐条处置，当前代码检查完成，就不因 review 快照早于修复而降级或要求第三轮审查。`clean` 不是必需状态；release/close 仍是独立动作。
- source_type/reference/exact_excerpt: user_reply + governance-log / verify-code correction；`/Users/Hugh/Downloads/workflowhub-governance-capability-issues-20260826.md#N-019`（SHA-256 `db02e537822ef6bc8842ba89de192c58e1666f691db13d78814be28e5a505bab`）/ "审查过、修复过，就算完成了，‘clean’是个什么状态，永远追求clean只会陷入死循环！"
- approval_binding: 用户明确纠正当前 verify-code 结论；本决定覆盖旧的“旧 review 不能冒充当前 clean”表述中的完成语义，但保留 provenance 真实性要求。
- facts_and_constraints: verify-code 的正常生命周期先审查、再修复；强制 review 必须绑定最终快照会把正常修复流程变成重复审查 gate。审查来源、审查快照、修复快照、finding disposition、当前检查和用户确认必须分别可见。
- Logic: review 是风险发现事实 -> 修复是同 task 的处置事实 -> 当前检查证明修复后的代码 -> 人工确认接受当前结论；不把一个变化中的标签当作完成前提。
- choice_reason/impact: 消除错误阻塞和无限重审；影响 verify-code outcome、完成谓词、阶段交接和治理记录，不改变四份材料或 public stage 数量。
- consequences_and_risks: 不能把旧 review 改写成当前 review，也不能把未修复 finding 隐藏；若 finding 未处置或当前检查失败，仍必须如实保留风险。
- rejected_alternatives: 只接受最终快照上的 `clean` review；拒绝，会制造额外 gate 和死循环。复用旧 review 冒充当前 clean；拒绝，会破坏 provenance。
- unresolved_items/owner: 将 stage outcome 完成谓词从“最终 clean”改为“审查+修复+当前检查+确认”的运行时细节，由当前修复与后续治理共同维护；owner=verify-code/runtime。
- Supersedes: N-018 中把“没有当前 dsh 载荷”直接等同于当前任务 incomplete 的解释；保留其交接事实，不保留错误的完成结论。

## 三轮 talk

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001 | Round 1：合同范围、Design.md 载体、缺证据语义。 | UI-only 会遗留全栈缺口；单文件需结构化；提示-only 会伪完成。 | 用户回复："1-2...2-1...3-2"。 | 3 个高影响问题全部回答；Round 1 无剩余高/中问题。 | host-visible reply #5 |
| T-002 | Round 2：合同选择、范围 census、Design writer、Experience 阈值。 | 过度全栈会增负担；人工清单会漏；多 writer 会漂移；默认多文件会增加维护。 | 用户回复："1-2 / 2-2 / 3-2 / 4-2"。 | 4 个高影响问题全部回答；Round 2 无剩余高/中问题。 | host-visible reply #6 |
| T-003 | Round 3：Design 使用/更新边界，以及无持久对象的自动真实 QA/evidence。 | 混同使用与更新会制造噪声；延期自动证据会使“真实验收”仍停在口号；新增 Runner 对象会膨胀控制面。 | Q1 选择后按 D-013 修正；Q2 用户确认 "2-1确认"，按 D-014 执行。 | 高影响问题全部回答。 | host-visible replies #7–#8 |

### Talk Round 1 / ask

- Q1 `contract-coverage`：本任务的可执行合同覆盖到哪里？
  - 1：只覆盖 UI 设计、组件和浏览器验收；后端继续沿用现有通用合同。
  - 2：推荐，覆盖 UI 加所有受影响的 API/DTO/schema/migration/consumer；跨边界必须有 fullstack slice。
  - 3：顺带重做全部 WorkflowHub 治理能力。
- Q2 `design-source-boundary`：`Design.md` 应怎样成为核心规范？
  - 1：一份写全所有 token、组件和测试细节的 Markdown。
  - 2：推荐，`Design.md` 是权威规则入口和索引；token、组件映射、可执行示例/测试各自有唯一机器资产。
  - 3：维持简短说明，只补少量章节。
- Q3 `quality-semantics`：缺 Design/消费者/真实验收事实时怎样处理？
  - 1：阻止同任务继续实现，直到证据齐全。
  - 2：推荐，允许同任务继续修复，但相关质量声明必须是 `incomplete`，不得称已完成。
  - 3：只给提示，不改变质量声明。

### Talk Round 2 / ask

- Q1 `backend-impact-rule`：哪些改动必须用完整全栈合同？
  - 1：每个后端改动都要求页面、Design 和浏览器证据。
  - 2：推荐，按真实影响：纯 UI 要 UI 合同；纯后端要 API/DTO/schema/persistence/consumer 合同；跨边界才要求 fullstack slice。
  - 3：沿用 frontend/backend/fullstack 三选一，由执行者自行判断。
- Q2 `page-coverage-source`：页面和组件范围怎样确定？
  - 1：只由计划作者手写页面清单。
  - 2：推荐，先从当前源码生成 route/import/lazy/CSS consumer census，再由人补页面语义和视觉规则；未知保持 `unknown`。
  - 3：让静态脚本自动判断所有页面语义和 CSS 正确性。
- Q3 `design-writer`：谁更新项目的 `Design.md`？
  - 1：make-decision 或 build-spec 直接改项目设计文件。
  - 2：推荐，build-spec 只写“必须更新哪些章节”；build-code 是唯一 writer；verify-code 校验最终 revision/content identity。
  - 3：每个阶段都可随时改。
- Q4 `experience-file-threshold`：何时允许新增唯一的 `Experience.md`？
  - 1：永不新增；所有旅程、交互实例和测试细节都写进 `Design.md`。
  - 2：推荐，只有端到端页面流转、交互实例或测试细节已无法在 `Design.md` 清晰索引时才新增；它只引用 `Design.md` 锚点，不能另定义 token/组件规则。
  - 3：每个 UI 项目一开始就创建。

### Talk Round 3 / ask

- Q1 `design-update-trigger`：哪类改动必须更新项目的 `Design.md`？
  - 1：所有代码改动都必须更新；最严格，但纯后端小修也会产生无意义文档噪声。
  - 2：**推荐**，UI/用户可见跨边界改动必须绑定并使用 `Design.md`；只有规范规则变化才更新它。页面/交互实例可写入受限的 `Experience.md`。
  - 3：只有新页面才更新；风险是既有页面、状态和组件改动继续漂移。
- Q2 `real-qa-delivery`：真实浏览器执行链和新版 evidence 要不要在本任务做成可运行能力？
  - 1：**推荐**，不新增或持久化任何名为 Runner 的对象。由既有 `build-code` 测试命令一次性负责启动/确认服务与 API 身份、调用隔离浏览器、采集证据、cleanup，并用官方阶段集成测试证明它真被调用；工作量更大，但能结束“有 Skill、没验收”的问题。
  - 2：当前只写模板和人工操作；风险是下一次任务仍可跳过真实验收。
  - 3：延期到后续治理；风险是本任务只能如实交付 `incomplete` 的 UI 验收能力。

## 调研

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| F-001 | 当前 WorkflowHub UI/Design 合同与正式运行时。 | UI skills/validators 被声明但 build-spec/build-plan handler 只消费通用结构；Design init/readiness 只信调用方传入文本。 | 已在本任务 research-inputs 复核。 | D-003、D-004 |
| F-002 | Design System 外部一手实践。 | token、组件状态、交互、视觉/a11y/性能证据需要同一闭环；结合用户选择，采用单一 `Design.md` 结构化章节而非多文件规范。 | 已完成；外部来源只作方向输入。 | D-004 |
| F-003 | 当前 make-decision writer 实现。 | 私有事件可逐 step 记录；唯一公开 decision-log writer 为整份原子覆盖，append/update contract 没有生产调用且 hash 规则与内容更新冲突。 | 已核实；本任务必须修复或如实保留为阶段质量缺口。 | D-002、D-005 |
| F-005 | 消费者、浏览器和 verify-code 接线。 | Component map 不扫描真实 consumers；build-code 没有稳定的受控浏览器执行链；v1 evidence 缺 AC/API/visual/perf identity；verify-code UI alignment 无生产调用。 | 已在本任务 research-inputs 复核。 | D-003、D-005 |
| F-006 | skill-deps 自动执行事实。 | 未发现生产 runtime 自动执行 skill-deps；stage-skill-runtime 仅加载/解析 package。 | 已核实；必须作为接线而非文档问题处理。 | D-003 |
| F-004 | 用户单文件 Design Source 约束。 | `Design.md` 为唯一规范文件，`Experience.md` 仅可在明确阈值下存在。 | 已确认；后续研究需据此调整先前多资产建议。 | D-004 |

### 初始调研来源与可追溯结论

| 来源 | 已纳入的结论 | 在本方向中的作用 |
| --- | --- | --- |
| `/Users/Hugh/Downloads/workflowhub-frontend-task-findings-20260825.md` | 现有 UI 任务可完成流程但缺真实页面、数据状态和浏览器验收闭环。 | F-001、F-005；拒绝“单测/fixture 即完成”。 |
| `/Users/Hugh/Downloads/workflowhub-frontend-capability-gaps-2026-08-25.md` | UI/Design/Component 能力存在但未被正式 handler 消费；Design 缺 owner/writer/identity。 | D-003、D-004、D-009、D-016。 |
| `/Users/Hugh/Downloads/workflowhub-frontend-qa-gap-20260826.md` | 现有浏览器证据有部分截图完整性，但缺 AC、Design/API identity、视觉/a11y/performance oracle 和 cleanup 绑定。 | D-014、D-015、D-018。 |
| `/Users/Hugh/Downloads/workflowhub-frontend-root-cause-2026-08-26.md` | 根因是“Skill/模板/静态校验存在”被误当“正式运行时真实消费”，并伴随 catalog/test 漂移。 | F-006、方向草案第 2、7 项。 |
| Material Design 3、Atlassian Design System、Carbon Design System 的官方设计系统资料 | 设计系统必须有可复用基础规则、token、组件与状态，不是简短样式清单。 | `Design.md` 成为唯一视觉/组件规范，而不是零散样式说明。 |
| Storybook 官方视觉/无障碍测试资料、Playwright 官方视觉比较资料 | UI 规范需要可执行场景和真实 visual/a11y evidence；单元测试不等于用户界面验收。 | Experience 场景与当前 task evidence 分层；D-014/D-018。 |
| W3C WAI-ARIA Authoring Practices / WCAG、web.dev 性能预算资料 | 交互语义、键盘/focus、a11y 与性能需要明确 oracle/阈值，不能只写“已检查”。 | Experience 的交互语义、Design 的视觉规则、evidence 的真实结果分工。 |

- 外部资料只用于验证通用做法；本任务不强制引入其工具、平台或多文件体系。用户的“双项目级规范、四份 task 材料”选择优先。

## grill

| grill_id | CONTEXT/冲突 | 结论 | ADR/四项退出 | source/evidence |
| --- | --- | --- | --- | --- |
| G-001 | `CONTEXT.md` 已把 `runner` 定义为每次调用认证的 WorkflowHub 执行身份，和“浏览器测试命令”不是同一概念。 | 用户确认固定称为“受控真实 QA 执行链”（D-015）；不再使用 Runner 描述它。 | 无需 ADR：只是消除既有术语冲突；不新增对象、owner 或状态。 | `CONTEXT.md:58-66`、`CONTEXT.md:176-178`、host-visible reply #9 |
| G-002 | 用户把 Experience 定义为项目级长期体验规范，不是每 task 临时例外文件。 | D-016：唯一 Experience 承载页面/交互/测试，严格排除样式；D-017 确认存量项目全量列项、按真实完成度迁移。 | 无需 ADR：本任务的可逆合同边界；由 template/validator 和阶段测试落地。 | host-visible replies #10–#11 |
| G-003 | “所有页面”不能被增量写入误读为“已完整覆盖所有页面”。 | 用户确认 D-017：全量列条目，受影响页写全，未迁移项保持 `unknown`/`incomplete`。 | 无需 ADR：质量状态沿用既有事实语义；由 Experience validator 和 evidence 绑定落地。 | host-visible reply #11 |
| G-004 | 长期体验规范若保存逐次执行结果，会把历史证据混入当前质量。 | 用户确认 D-018：Experience 只保存可复用场景/边界；运行结果只在当前 task evidence。 | 无需 ADR：沿用当前四材料与 `quality/evidence/` 边界。 | host-visible reply #12 |

### Grill Q1 / ask

- `qa-execution-term`：浏览器验收的一次性命令应怎样命名？
  - 1：**推荐**，称为“受控真实 QA 执行链”。它是既有 `build-code` 的一次性行为，不是对象；`runner` 保留给 WorkflowHub 的调用身份。
  - 2：继续叫 Runner。风险：会和现有执行身份概念冲突，并诱发不必要的持久对象设计。
  - 3：不固定名称。风险：文档、合同和测试会继续各说各话。

### Grill Q2 / ask

- `experience-retention`：页面流转或交互变了，但还不值得创建 `Experience.md` 时，长期事实放哪里？
  - 1：**推荐**，当前 task 的 spec/plan/evidence 记录这次变更与验收；只有该交互会被后续任务反复复用、且 `Design.md` 无法清晰索引时，才创建唯一 `Experience.md`。这样不增加每次交互一个文件。
  - 2：每次交互变化都创建/更新 `Experience.md`。风险：很快变成第二份长期规范和维护负担。
  - 3：把交互一律写回 `Design.md`。风险：违反其“规范而非交互记录”的定位。

### Grill Q3 / ask

- `existing-project-experience-coverage`：已有项目第一次引入 `Experience.md`，怎样避免“只写本次页面，却假装全项目已覆盖”？
  - 1：**推荐**，先生成源码页面/消费者盘点；所有已发现页面在同一份 `Experience.md` 有条目。受影响页面必须写全流程、状态和测试场景；未完成迁移的其他页面明确标 `unknown`/`incomplete`，可在同任务持续补齐。
  - 2：所有旧页面都写全后才允许改任何一个页面。风险：把历史补文档变成实现阻塞，违反同任务可继续修复的边界。
  - 3：只写本次触及页面，其他页面不留条目。风险：`Experience.md` 无法成为“所有页面”的项目事实源。

### Grill Q4 / ask

- `experience-test-detail`：`Experience.md` 的“测试细节”应保存什么？
  - 1：**推荐**，保存长期可复用的场景、操作步骤、预期结果、覆盖边界和对应 AC/Design anchor；每一次运行的截图、日志、hash、实际结果仍保存到当前 task 的 `quality/evidence/`。这样规范不会因旧结果过期。
  - 2：场景和每次运行结果都写进 `Experience.md`。风险：文件会积累过期截图/日志，误把历史结果当当前质量事实。
  - 3：Experience 不记录测试。风险：页面与交互无法稳定回归验证。

## 审查处置

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| F-3cce48f6ece6 | wh-review external direct evidence：make-decision 还没有把 UI governance contract 嵌入当前方向。 | 方向会误以为已有治理已足够。 | fixed_in_material | 已加入“完整用户流程、状态和边界”及 D-011；Round 3 只收两项用户选择。`quality/reviews/results/make-decision-direction-09feabc4200d16b820dd4f03f92833b7ee650099-d54a3c56-259b-4d91-8a54-794081c96473.json` | make-decision / decision-log / retain |
| F-01287f5b4f1c | wh-review minor：前端标准化为何需要全栈合同说明不足。 | 容易被误解为无边界扩大。 | fixed_in_material | D-003、完整流程第 2–3 步已说明：route/component 的真实数据状态依赖 API/DTO/schema/persistence/consumer，漏链则无法稳定验证 UI。`quality/reviews/reports/d54a3c56-259b-4d91-8a54-794081c96473.md` | make-decision / decision-log / retain |
| F-b27280e47306 | wh-review `invalid_anchor`：census 被当成现有能力。 | 不能作为正式审查 finding；但前提混淆会导致错误方案。 | corrected_independently | 以本任务 F-005/F-006 事实写入 D-012：census 是要新建的 producer，后续 build-plan 消费。 | build-plan / census producer / retain |
| F-5ae9695c4a04 | wh-review `invalid_anchor`：受控浏览器执行链/evidence v2 不是明确交付。 | 不能作为正式审查 finding；但是真实验收范围需用户选择。 | fixed_in_direction | D-014 已确认：既有 build-code 一次性命令交付服务/API → 浏览器 → evidence → cleanup，不引入持久 Runner。 | build-code / quality/evidence / retain |
| F-eefa5d73ca3c | wh-review `invalid_anchor`：流程、状态、边界和停止线未记录。 | 不能作为正式审查 finding；与 R-004 的原始要求一致。 | fixed_in_material | 已写入“完整用户流程、状态和边界”及延期交接；方向事实未完不得进 build-spec。 | make-decision / decision-log / retain |

## Detail advice 事实与处置

| attempt/result | 事实 | status | 处置与证据 |
| --- | --- | --- | --- |
| `e5b7492b-0c63-4633-a141-f528d2a1064d` | detail 首次调用缺 `approved_direction`、`draft_spec_or_acceptance`，返回 `MATERIAL_INCOMPLETE`。 | unavailable retained | 不写成无 finding；N-004 记录 detail 输入模板/adapter 缺口。`quality/reviews/reports/e5b7492b-0c63-4633-a141-f528d2a1064d.md` |
| `9599a9e1-f8eb-4766-a42b-fb3486ac707e` | 补齐必需字段后，`objective_facts` 又被 detail 拒绝为 `MATERIAL_FORBIDDEN`。 | unavailable retained | 不写成无 finding；N-004 记录 semantic_fields 与允许输入边界冲突。`quality/reviews/reports/9599a9e1-f8eb-4766-a42b-fb3486ac707e.md` |
| `56f58426-e197-4c22-8e85-cb3b87084e3c` | 最小合法材料的 detail advice 是 `semantic/available`，1 位有效异源审查者，`findings: none`；另 1 位 provider 无 terminal，same-source 排除保留。 | available_no_finding | 没有 finding 不是 stage PASS；当前方向进入真实用户最终确认。`quality/reviews/reports/56f58426-e197-4c22-8e85-cb3b87084e3c.md` |

## 最终确认

- 状态：confirmed
- 用户原文与 host-visible 绑定："确认方向，请确认当前会话最开始的调研和方案，都记录在decision-log中了，没问题就继续吧"。
- 覆盖：D-001 至 D-018、方向草案、初始调研来源、三轮 Talk、Grill、direction/detail advice、非目标和延期交接。
- 未确认内容：无方向未决项；进入本阶段 stage-end 分析。

## 方向草案（历史草案；已由 D-019 确认并交给后续阶段）

### 要交付的能力

1. 为适用 UI 项目建立两个、且只有两个项目级规范：`Design.md` 是唯一视觉/组件规则源；`Experience.md` 是唯一页面/交互/测试场景源。二者都有稳定章节、锚点、revision/content identity 和唯一 writer，但不是 task 的第五份材料。
2. 把 UI、backend、fullstack 影响分类和合同写入四份既有材料，并让正式五阶段 handler 实际消费，而不是只在 Skill、模板或 caller map 中出现。
3. 新增可复现的源码 consumer census。它列出已发现 route/import/lazy/CSS/data consumers；不支持或无法确认的模式输出 `unknown`，人工补充语义，不能伪报扫描完整。
4. 对 UI 使用 `Design + Experience + consumer` 合同；对后端使用 `API → DTO → schema/migration → persistence → consumer → failure` 合同；跨边界使用 fullstack slice。前端真实状态依赖后端链，故两者共同验证但不强制纯后端携带无关页面证据。
5. 用既有 `build-code` 内的“受控真实 QA 执行链”完成服务/API identity → 隔离浏览器 → 新版 evidence → cleanup。它不是 Runner，不新增公共命令、任务对象、持久状态、阶段或控制面。
6. `Experience.md` 保存长期场景、步骤、预期、覆盖边界和 AC/Design anchor；当前 task 的 `quality/evidence/` 保存逐次截图、日志、hash、实际结果和 cleanup/API 身份。缺事实保持 `unknown`/`incomplete`，同 task 可继续修复。
7. 修复 make-decision 决策记录的实际 writer/内容身份矛盾，并清理 catalog、manifest、模板和测试的“已声明 ≠ 已执行”漂移。

### 适用与更新规则

- `non_ui`：不强制 Design/Experience/browser，但仍按真实后端影响维护数据合同。
- `ui`：必须绑定 `Design.md` 与 `Experience.md`；视觉/组件规则改变才更新 Design，页面/交互/场景改变才更新 Experience。
- `fullstack`：同时绑定两份项目规范与全链数据合同；依据实际变化分别更新，不把“引用”误当“改规范”。
- 存量项目首次引入 Experience：所有已发现页面均有条目；受影响页面写全，其余真实标 `unknown`/`incomplete`。只有当前证据支持的范围可称 `covered`。

### 成功与失败声明

- 只有当前材料、选中合同、两份项目规范身份、真实 consumer、逐 AC 场景和当前 evidence 一致时，才可对相应范围声明 `covered`。
- 服务/API 不符、浏览器失败、cleanup 失败、fixture 替代真实页面、Design/Experience 漂移或 consumer 未知，必须保留失败/未知/`incomplete`；不得改写成 PASS。
- 专项质量缺口不阻止同一 task 修复；原始方向事实未确认才阻止进入下一阶段。当前方向已由 D-019 确认；本节保留当时的草案原文，仅作过程记录，不能覆盖后续四份材料和 D-020。

## 拒绝方案

| 选项 | 拒绝理由 | 关联 D |
| --- | --- | --- |
| 直接进入 build-spec | 用户明确要求不跳过 make-decision。 | D-002 |
| 在本任务修复 PaperBuilder | 用户明确排除。 | D-001 |

## 风险与延期交接

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
| --- | --- | --- | --- |
| RISK-001 | 当前工作区三处未提交改动与本任务无关。 | 若混入本任务会污染实现和证据。 | build-code / 当前工作区 owner |
| DEFER-001 | 具体第三方设计工具适配。 | 未经用户选择会造成无关依赖。 | 明确非目标；未来独立需求 |
| RISK-002 | 现有 make-decision writer 不能证明每个 step 追加时的内容身份。 | 若不修复，阶段只能如实保持质量事实不完整。 | 本任务 / build-code |
| RISK-003 | `Design.md` 单文件可能膨胀和难解析。 | 若无章节/锚点/一致 schema，会重演当前简陋或漂移。 | 本任务 / build-spec、build-code |
| RISK-004 | Skill 声明不代表生产执行。 | 若只更新 catalog/template，仍会重演 phase 通过但专项能力未运行。 | 本任务 / build-code、verify-code |

## 质量边界

- 质量事实：设计、消费者、浏览器、API/DTO 与性能证据必须分别真实记录。
- 推进资格：同任务可以在缺质量事实时继续修复。
- 完成判据：缺相关事实不得宣称 UI 或全栈标准化质量完成。
- 不可逆授权边界：不执行提交、合并、推送、删除或改写历史任务，除非另获授权。

## 未决项（历史记录；已由 build-spec/build-plan 细化）

| item_id | 未决内容 | 原因 | 谁在何时解决 |
| --- | --- | --- | --- |
| OPEN-001 | 后端矩阵和 fullstack slice 的最小字段。 | 已在 `spec.md`/`plan.md` 固化；保留原始问题供追溯。 | 已解决；后续只在新需求中重新决策。 |
| OPEN-002 | `Experience.md` 的可审查创建阈值。 | 已由 D-016/D-017 和 `spec.md` 固化为项目唯一文件及迁移语义。 | 已解决；后续只在新需求中重新决策。 |
| OPEN-003 | 各专项合同的最小 evidence。 | 已在 `spec.md`/`plan.md`/`tasks.md` 固化；缺失仍按 unknown/incomplete 记录。 | 已解决；后续只在新需求中重新决策。 |

## Supersedes

- none

## 文档结果

- CONTEXT.md：无领域术语变更；`runner` 与“受控真实 QA 执行链”边界已在 D-014/D-015 固定。
- ADR：本任务没有新增必须独立持久化的架构决策；关键选择已记录为 D-001 至 D-020。
- ADR criteria：不新增 ADR 文件，避免多一套维护入口。
- 术语/ADR 冲突及处理：已处理 `runner` 术语和 Design/Experience 分工；本节只保留索引。
- 不复制 spec 的边界：本材料保留用户需求、选择、理由、风险和延期；字段实现以 `spec.md`/`plan.md`/`tasks.md` 为准。

## Exit checks

- 上下文一致：`load-context` 已读取 stage package、依赖和原始 requirement；会话事件已记录。
- owner/接口一致：TaskHandle、当前会话和四份材料已绑定；外部工具适配列为非目标或延期。
- 失败语义明确：成功、失败、unknown、unavailable、incomplete 和当前快照边界已确认。
- 范围与延期明确：范围、非目标、延期交接和 D-020 的完成语义已记录。
