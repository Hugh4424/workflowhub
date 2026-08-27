# 功能规格：WorkflowHub 可执行的设计与体验交付合同

> 基于已确认的 `decision-log.md`。本文件只定义 WorkflowHub 使用者可观察到的行为、边界和验收；不定义工程文件、代码符号或执行命令。

- **功能名**：可执行的设计与体验交付合同
- **来源**：R-001 至 R-006；D-001 至 D-020
- **状态**：已确认，待实现
- **内容档案**：`spec-content.v3`

## 速读卡（30 秒）

- **一句话需求**：使用者用 WorkflowHub 开发或优化 UI、后端或全栈功能时，系统要把设计规则、体验行为、真实消费者和当前验证证据连成可检查的交付链。
- **核心改动点**：
  - 项目以唯一 `Design.md` 管视觉/组件，以唯一 `Experience.md` 管页面/交互/测试场景。
  - 五阶段按真实影响消费 UI、后端或全栈合同；不能只靠 Skill、模板或人工清单声称已覆盖。
  - 真实 QA 绑定当前服务/API、隔离浏览器、逐条验收证据和清理结果；缺口如实为 `unknown` 或 `incomplete`。
- **最大影响面**：WorkflowHub 的五阶段材料、项目初始化、前后端变更方案、浏览器验收、最终代码核对和质量表达。
- **验收信号**：适用范围只有在当前规范身份、消费者、场景和证据一致时才可被声明为 `covered`；否则给出可继续修复的准确缺口。

### 来源与决策映射

| Source ID | Decision ID | FR / AC IDs | Status / affected scope | Unresolved / handoff |
| --- | --- | --- | --- | --- |
| R-001、R-002 | D-003、D-004、D-016 | FR-DOC-001～004；AC-001～004、016 | current；UI 与全栈规范 | build-plan 定义实现矩阵 |
| R-003 | D-001 | §10 非目标；AC-005 | current；任务范围 | PaperBuilder 为非目标 |
| R-004、R-005 | D-002、D-011、D-019 | FR-REL-001～002；AC-013～014 | current；五阶段方向 | build-spec 不补需求 |
| R-006 | D-006 | FR-GOV-002；AC-020 | current；治理清单 | 后续治理任务消费 |
| F-005 | D-007、D-008、D-012、D-014、D-015 | FR-CON-001～005；FR-QA-001～004；AC-008～012、017～019、021 | current；consumer 与 QA | 不支持模式保持 unknown |
| F-006、N-005 | D-006、D-012、D-019 | FR-GOV-001、003；AC-007、022 | current；声明、模板与执行一致性 | 仅解析/加载或人工格式修补不等于接入 |
| F-003、N-004 | D-018、D-019 | FR-REL-001～002；AC-013～015 | current；流程事实可靠性 | 同一任务实施修复 |
| D-017 | D-017 | FR-DOC-002；FR-CON-002；AC-003、006、017 | current；存量 Experience 迁移 | 非受影响页面保留缺口 |
| D-018 | D-018 | FR-DOC-002；FR-QA-002；AC-003、010 | current；长期场景与当前证据分层 | 运行结果不写回 Experience |
| N-006 | 当前 task 的实际阶段发布 | FR-REL-003；AC-023 | current；事件顺序与失败恢复 | 历史重叠不可改写，保持 incomplete |
| G-009～G-011 | D-019 | N/A | deferred；其他治理能力 | 未来治理任务明确接手 |

## 1. 问题与紧迫性

WorkflowHub 当前可声明阶段已执行，却不能稳定证明项目视觉是否统一、组件是否有真实消费者、交互是否覆盖失败状态，或前端依赖的 API/DTO/持久化链是否一致。根因不是缺少更多 Markdown，而是设计、体验、消费者和证据没有进入正式五阶段的真实消费路径。

这会让使用者在完成多个 phase 后才发现页面不一致、交互不可恢复、fixture 代替真实服务、或设计文档与实现已漂移。当前任务必须把这些缺口改成可观察的交付行为，同时不引入第六阶段、第二套状态机或额外任务材料。

## 2. 背景、目标与范围

### 背景

现有能力中已经有设计就绪、组件质量、浏览器 QA 和设计对齐等局部能力，但它们没有全部成为正式阶段消费者。现有 `Design.md` 又被弱化为可选参考，无法承担统一性和可维护性的来源责任。使用者已确认：视觉规则与体验行为都需要项目级唯一来源，但两者不得双写。

### 本任务的 UI 初始化事实

- **状态**：`legacy` / `not_ready`，且为非阻断事实。
- **已观察范围**：WorkflowHub 当前仓库根目录未发现项目级 `Design.md` 或 `Experience.md`；本任务治理下游项目的交付合同，不新增 WorkflowHub 业务页面。
- **未知边界**：下游项目的规范路径、内容身份、预览服务和 viewport 尚未由本次 task 提供，必须在各自项目的实际变更中绑定或如实报告缺失。
- **处理原则**：本任务先实现两份规范、体验场景和证据合同；不能以当前仓库没有业务页面为由省略该合同，也不能把 `not_ready` 写成视觉验收已通过。
- **现有就绪能力的边界**：当前 `Design.md` 就绪派生在来源缺失时返回 `not_ready`、`not_bindable`、`gate: false`，并且只形成视觉 Screen Read Map；它尚不能绑定 Experience。这是本期 FR-DOC-001～003 所要补齐的合同缺口，而不是可用的双文档验收能力。
- **本次设计审视事实**：本 task 没有受治理的 WorkflowHub 业务页面或预览服务，故视觉预览为 `preview_unavailable`，可继续但不产生视觉通过结论。规格已覆盖空、加载、错误、取消、竞态及恢复；冻结前必须把两份规范的最低结构、键盘/焦点和响应式边界写成可测合同。

### 目标

- 让 UI/全栈使用者能明确知道本次改动应使用或更新哪一份项目规范、影响哪些页面/消费者、以及什么事实可支持完成声明。
- 让纯后端改动使用完整数据合同而不被无关 UI 验收拖慢；跨边界改动不再漏掉任一层。
- 让存量项目能够诚实迁移：已发现页面都可见，受影响页面先完整，未完成部分明确为缺口。
- 让缺少质量事实不阻止同一任务修复，但绝不被改写成质量通过。

### 审查修复的完成语义

异源 review 绑定的是它实际检查过的快照；如果 finding 已在同一 task 修复，并完成当前检查和用户确认，当前结果可按 `resolved` 完成。旧 review 仍原样保留为 provenance，不改写成当前 `clean`，也不因为缺少 `clean` 标签循环重审。`clean` 只表示审查时没有 finding，不是永远要追的状态。

### 范围内

- 两份项目级规范的职责、引用、更新、身份和存量迁移规则。
- UI、后端、全栈影响分类和可观察合同。
- 真实消费者盘点、长期体验场景、当前运行证据和最终一致性核对。
- 方向确认、独立审查材料和阶段末事实的可靠性修复。

## 3. 用户场景与状态覆盖

### SCN-001：使用既有视觉和体验规则完成 UI 变更

- **角色**：使用 WorkflowHub 的产品/开发使用者
- **Given**：项目已有 `Design.md`、`Experience.md`，且本次改动不改变视觉/组件规则
- **When**：使用者提出一个 UI 页面或组件改动
- **Then**：系统绑定两份规范的当前章节和内容身份，显示受影响页面/状态/消费者；只在体验行为变化时要求更新 Experience，不把“使用 Design”误判为“必须改 Design”。

### SCN-002：视觉或组件规则发生变化

- **角色**：使用 WorkflowHub 的项目维护者
- **Given**：UI 改动新增或改变视觉原则、token、组件规则、视觉无障碍或性能规则
- **When**：使用者确认该规则变化
- **Then**：系统把 `Design.md` 标为 `update_required`，并要求最终实现与更新后的章节/内容身份一致。

### SCN-003：页面流转或交互状态发生变化

- **角色**：使用 WorkflowHub 的项目维护者
- **Given**：项目已有唯一 `Experience.md`
- **When**：页面、区域、用户流转、交互状态、异常恢复或长期测试场景变化
- **Then**：系统把 `Experience.md` 标为 `update_required`；它保存场景和预期，不保存本次运行截图或日志。

### SCN-004：存量项目首次建立体验规范

- **角色**：使用 WorkflowHub 的存量项目维护者
- **Given**：项目已有页面和组件，但没有完整 `Experience.md`
- **When**：系统盘点当前可发现页面与消费者
- **Then**：每个已发现页面在同一份 Experience 中有条目；当前受影响页面具备完整流程、状态和测试场景，其余页面诚实为 `unknown` 或 `incomplete`。

### SCN-005：纯后端与跨边界改动

- **角色**：使用 WorkflowHub 的开发使用者
- **Given**：改动的消费者影响已被盘点
- **When**：使用者提交纯后端或跨前后端改动
- **Then**：纯后端遵循数据合同；跨边界同时遵循数据合同和 UI/Experience 合同，并有一个真实可验证的全栈切片。

### SCN-006：真实 UI 验收失败或证据不完整

- **角色**：使用 WorkflowHub 的开发使用者
- **Given**：UI 或全栈合同要求真实浏览器验收
- **When**：服务/API 身份不匹配、浏览器场景失败、清理失败、消费者未知或证据与当前材料不一致
- **Then**：系统记录失败、`unknown` 或 `incomplete`，说明缺口；同一 task 可以补齐和重试，但不能声明 `covered`。

### SCN-007：审查或记录材料不满足合同

- **角色**：使用 WorkflowHub 的流程维护者
- **Given**：阶段需要独立审查或已确认方向的不可变事实
- **When**：审查输入缺字段、含禁止字段，或确认后缺少可绑定的交互汇总事实
- **Then**：系统保留准确的 `unavailable`/`material_incomplete` 诊断，不把它写成“无 finding”；官方输入入口应能给出可复用的最小材料。

### 状态覆盖清单

| 状态 | 覆盖场景 | 使用者可见语义 | 处理 |
| --- | --- | --- | --- |
| 默认态 | SCN-001、SCN-005 | 影响分类与规范绑定明确 | 可继续设计/实现 |
| 空态 | SCN-004 | 未发现页面或无适用消费者 | `N/A — reason` 或 unknown |
| 错误态 | SCN-006、SCN-007 | 服务、证据或输入合同失败 | 保留失败诊断 |
| 加载态 | SCN-006 | QA 正在采集当前证据 | 不预先声明 covered |
| 取消态 | SCN-006 | 外部浏览器/设计动作被取消 | 保留取消事实与恢复入口 |
| 边界态 | SCN-002～005 | ui/backend/fullstack 切换 | 按真实消费者选合同 |
| 权限态 | N/A — 本任务不新增项目用户权限模型 | 不改变被治理项目权限 | 保留现有权限行为 |
| 竞态 | SCN-006、SCN-007 | 材料/规范/服务在运行期间漂移 | 证据与当前身份不一致即不可 covered |

## 4. 产品事实与假设（PFACT）

- **PFACT-01**：现有 UI/Design/Component 能力存在，但未被所有正式阶段 handler 消费。（status: verified）
  - **status**：`verified`
  - **证据或来源**：F-001、F-005、F-006
  - **关联**：FR-CON-001、FR-GOV-001；AC-008、AC-015
- **PFACT-02**：现有消费者质量 map 不会自行生成完整的 route/import/lazy/CSS/data consumer 事实。（status: verified）
  - **status**：`verified`
  - **证据或来源**：F-005
  - **关联**：FR-CON-002；AC-009
- **PFACT-03**：现有浏览器证据没有完整绑定 AC、规范内容身份、真实 API/DTO 身份、视觉/a11y/performance oracle 与 cleanup。（status: verified）
  - **status**：`verified`
  - **证据或来源**：F-005、初始 QA 调研
  - **关联**：FR-QA-001、FR-QA-002；AC-010、AC-011
- **PFACT-04**：`runner` 已有“每次调用执行身份”的定义，不能再表示浏览器验收行为。（status: verified）
  - **status**：`verified`
  - **证据或来源**：Grill G-001
  - **关联**：FR-QA-001；AC-012
- **PFACT-05**：当前 make-decision 不能用正式 writer 生成当前已确认 decision 所需的交互汇总事实。（status: verified）
  - **status**：`verified`
  - **证据或来源**：F-003、N-001、本阶段 `material_incomplete` 分析
  - **关联**：FR-REL-001；AC-013
- **PFACT-06**：detail advice 的输入合同没有直接可复用的最小模板，已在本 task 产生两次不可用事实。（status: verified）
  - **status**：`verified`
  - **证据或来源**：N-004
  - **关联**：FR-REL-002；AC-014
- **PFACT-07**：`spec-specify` 产出的 PFACT/AC Markdown 格式与严格 `spec-analyze` parser 不兼容，需人工改写才可通过。（status: verified）
  - **status**：`verified`
  - **证据或来源**：N-005；本 task 的 build-spec stage-end 预检
  - **关联**：FR-GOV-003；AC-022
- **PFACT-08**：step 事件写入允许后续 step 在前置 step open 时启动，最终 bridge 才报告时间线重叠。（status: verified）
  - **status**：`verified`
  - **证据或来源**：N-006；本 task `BRIDGE_TIME_INVALID` 正式发布失败
  - **关联**：FR-REL-003；AC-023

## 5. 功能需求

### 项目规范（DOC）

WorkflowHub 必须将每个适用 UI 项目的视觉规则和体验规则拆成两份唯一、互补但不重叠的项目级规范。它们不是 task 的第五份材料；当前 task 仍只以四份材料和质量事实为工作真相。

- **FR-DOC-001**：系统必须把 `Design.md` 定义为唯一的视觉与组件规范。
  - **最低结构**：必须有用途/owner/修订与内容身份、设计原则、色彩/字体/间距/尺寸等 token、布局与响应式规则、组件 API 与组合规则、视觉状态、视觉无障碍、性能预算、变更与治理章节；章节应可被锚定引用。
  - **范围边界**：它定义视觉/组件的共享规则，不包含页面流转、业务动作、逐次运行结果或体验测试步骤。
  - **依据**：D-004、D-013、D-016；PFACT-01
  - **场景**：SCN-001、SCN-002
  - **验收**：AC-001、AC-002
- **FR-DOC-002**：系统必须把 `Experience.md` 定义为唯一的页面、交互和长期测试场景规范。
  - **最低结构**：必须有用途/owner/修订与内容身份、页面/区域索引、每页的已知范围与状态、用户流转、交互与异常恢复、可访问性交互语义、长期场景/操作/预期/覆盖边界和已知缺口；章节和页面条目应可被锚定引用。
  - **范围边界**：它包含页面/区域、流转、交互状态、异常与恢复、可访问性交互语义、场景、操作、预期和覆盖边界；不得定义样式、token、断点、排版、视觉组件规则，也不得保存逐次运行结果。
  - **依据**：D-016、D-018；PFACT-01
  - **场景**：SCN-001、SCN-003、SCN-004
  - **验收**：AC-003、AC-004
- **FR-DOC-003**：系统必须区分“绑定/使用当前规范”和“更新规范”。
  - **范围边界**：视觉/组件规则变化才更新 Design；页面/交互/长期场景变化才更新 Experience；同一变更可更新两者。
  - **依据**：D-009、D-013、D-016
  - **场景**：SCN-001～003
  - **验收**：AC-002、AC-004
- **FR-DOC-004**：系统必须对两份项目规范使用同一套可比较的来源身份与写入生命周期。
  - **来源身份**：每次绑定必须带上 `document_kind`（`design` 或 `experience`）、项目相对 `path`、`content_sha256`（文件 UTF-8 原始字节的 SHA-256）、非空 `revision`、稳定 `anchor_id` 和 `anchor_title`。`anchor_id` 由文档显式标注，不能依赖浏览器自动生成的标题 slug；同一文档内必须唯一。
  - **比较与漂移**：比较相对路径、内容 hash、revision 和锚点四项；任一已绑定项不一致即为 `stale`，不能继续沿用旧证据。缺字段为 `missing`/`unknown`，不伪造默认 identity。
  - **唯一 writer**：make-decision、build-spec、build-plan 只声明、绑定或计划 identity；只有 build-code 可在真实规则或体验变化时写入项目 `Design.md` / `Experience.md`，并生成更新后的 identity。verify-code 只验证，不回写。仅使用既有规则时 build-code 只绑定，不更新。
  - **依据**：D-009、D-013、D-016；PFACT-01
  - **场景**：SCN-001～004、SCN-006
  - **验收**：AC-001、AC-002、AC-004、AC-016

### 范围与合同（CON）

系统必须依据真实消费者影响而非执行者直觉选择合同，使纯后端不被过度约束，跨边界也不遗漏 UI 与数据任一端。

- **FR-CON-001**：系统必须将改动表达为 `non_ui`、`ui`、`backend`、`fullstack` 或 `unknown`，并保留判定依据。
  - **范围边界**：`unknown` 不能降格为不适用；纯后端不要求无关 UI 证据。
  - **依据**：D-003、D-007
  - **场景**：SCN-005、SCN-006
  - **验收**：AC-005、AC-008
- **FR-CON-002**：系统必须生成可复现的真实消费者盘点，并允许人工补充体验和视觉语义。
  - **范围边界**：覆盖已支持的 route/import/lazy/CSS/data consumer；无法支持或确认的项必须为 `unknown`，不能漏掉或默认为零。
  - **依据**：D-008、D-012；PFACT-02
  - **场景**：SCN-004、SCN-005
  - **验收**：AC-006、AC-009、AC-017
- **FR-CON-003**：系统必须对纯 UI、纯后端和全栈切片使用不同的最小完整合同。
  - **范围边界**：UI 合同绑定 Design、Experience 和 consumer；后端合同覆盖 API、DTO、schema/migration、persistence、consumer、failure；fullstack 同时覆盖二者。
  - **后端成功与失败边界**：每层必须写明成功结果、失败结果、状态 owner 和恢复方式。API 至少区分校验/权限/冲突/上游/超时等适用失败；DTO 不一致必须显式为不兼容，禁止用合理默认值掩盖；migration 必须给出原子性、停止条件和 forward/rollback 或人工恢复方案；persistence 必须说明原子提交、部分失败后的可观察状态和幂等键或“不支持幂等”的原因；consumer 必须将可重试、不可重试和未知映射到真实恢复动作。fullstack 成功必须从真实请求经 DTO、schema/persistence 到消费者读回；任一层失败不得伪造端到端成功。
  - **依据**：D-003、D-007
  - **场景**：SCN-001、SCN-005
  - **验收**：AC-008、AC-021
- **FR-CON-004**：消费者盘点必须有版本化、可重放的数据合同。
  - **输入**：`schema_version`、scanner version、项目源码 snapshot identity、扫描配置和 `support_matrix`；support matrix 必须逐项列出本次真正支持的 route/import/lazy/CSS/data 模式，未列模式一律不是“已支持”。
  - **输出**：每项包含稳定 `consumer_id`（由 kind、项目相对 path 和显式 anchor 计算）、kind、location、discovery status、关联页面或数据链、来源 identity 和 `unknown_reason`。相同输入必须得到按 consumer ID 排序的等价输出。
  - **未知与人工补充**：动态加载、生成代码、框架不支持、扫描失败、语义无法判定等必须使用枚举原因；人工补充以同一 schema 追加 `source=human`、理由和证据，不能覆盖扫描原始项。
  - **下游消费**：发现的页面进入 Experience 索引；无 Experience 条目或无法匹配的页面为 `incomplete`。影响分类以盘点为依据，并保留其引用。
  - **依据**：D-008、D-012；PFACT-02
  - **场景**：SCN-004、SCN-005、SCN-006
  - **验收**：AC-006、AC-009、AC-017
- **FR-CON-005**：系统必须用固定的合同证据集合计算 `covered`、`incomplete` 和 `unknown`。
  - **最小集合**：`non_ui` 需要影响依据与非 UI 理由；`backend` 需要 API、DTO、schema/migration、persistence、consumer 和失败边界；`ui` 需要双规范 identity、consumer census、Experience 场景和当前 UI evidence；`fullstack` 需要 UI 与 backend 集合及真实端到端切片。
  - **优先级**：任一必需事实已知缺失、失败、取消、过期、身份不匹配、cleanup 失败或未执行，结论为 `incomplete`；否则任一必需事实是 `unknown`/`unavailable`/unsupported，结论为 `unknown`；只有所有必需事实当前且成功、无未知项，才可为 `covered`。带理由的 `not_applicable` 仅从对应集合排除，不能把未知降为不适用。
  - **依据**：D-005、D-007、D-014；PFACT-03
  - **场景**：SCN-005、SCN-006
  - **验收**：AC-005、AC-008、AC-011、AC-018

### 真实验收与证据（QA）

系统必须让真实页面验收成为可观察执行事实，而不是单独的 Skill 声明、fixture 截图或人工口头结论。

- **FR-QA-001**：系统必须提供既有 build-code 内的一次性“受控真实 QA 执行链”。
  - **实际调用**：每个适用的 build-code stage attempt 必须由官方 handler 实际调用一次该链，并记录 invocation identity；重试只能创建新的 invocation，不能把旧结果覆盖或当作本次调用。
  - **范围边界**：依次确认当前服务与 API 身份、运行隔离浏览器、采集结果并清理；不得新增 Runner 对象、公共命令、持久状态或阶段。
  - **依据**：D-014、D-015；PFACT-03、PFACT-04
  - **场景**：SCN-006
  - **验收**：AC-010、AC-012、AC-019
- **FR-QA-002**：系统必须让当前 UI 证据绑定验收标准、两份规范身份、真实服务/API/DTO 身份、视觉/a11y/performance oracle、控制台/网络/焦点/溢出观察和 cleanup 结果。
  - **最小 evidence identity**：每条证据必须带 task、stage attempt、material revision、源码 snapshot、invocation、AC、Design/Experience identity、service instance identity、API/DTO contract identity、browser isolation profile、oracle 结果、console/network/focus/overflow 观察和 cleanup 结果。
  - **失败、取消与恢复**：身份不匹配、浏览器失败、oracle 失败、取消、cleanup 失败均保留独立事实并按 FR-CON-005 计算；重试创建新 evidence，旧失败不被删除。fixture-only 只能是组件证据，不得替代真实页面验收；运行结果不写回 Experience。
  - **依据**：D-014、D-018；PFACT-03
  - **场景**：SCN-003、SCN-006
  - **验收**：AC-010、AC-011
- **FR-QA-003**：系统必须在最终核对时验证当前变更、规范身份、consumer census、所选合同和证据的一致性。
  - **范围边界**：最终核对不伪造或重跑缺失的产品浏览器结果；不一致或过期证据保持缺口。
  - **依据**：D-005、D-009、D-014
  - **场景**：SCN-006
  - **验收**：AC-011
- **FR-QA-004**：系统必须为受控真实 QA 执行链提供官方 handler 集成验收，而非仅测试纯函数或 Skill 声明。
  - **机器 oracle**：集成测试必须证明 build-code handler 实际发起调用，并覆盖真实服务/API 身份成功、身份错配、浏览器/oracle 失败、取消、一次新 invocation 的重试、cleanup 失败和 fixture-only 反例；每一例都断言正确 evidence 身份与非 PASS 语义。
  - **依据**：D-014、D-015；PFACT-03
  - **场景**：SCN-006
  - **验收**：AC-010、AC-011、AC-012、AC-019

### 流程可靠性与治理（REL）

系统必须让当前任务的真实执行和审查事实可被正确写入、消费和复核，不能让“已声明”代替“已执行”。

- **FR-REL-001**：系统必须让 make-decision 的已确认方向拥有可绑定、不可变的交互汇总事实。
  - **最小输入与输出**：输入为当前 task/stage、当前 decision material ref/hash/revision、用户 confirmation ref/hash、按顺序的 Talk/Grill/Advice 摘要和原始需求绑定；输出为 `workflowhub-interaction-aggregate.v1`，包含这些绑定、内容 hash、生成时间和不可变事实 ref。
  - **重放与冲突**：相同 identity 的重放返回既有不可变事实；任一被绑定内容变化必须产生明确 conflict/重新确认路径，绝不能改写旧事实或生成第二状态机。缺绑定为 `MATERIAL_INCOMPLETE`，冲突为明确冲突诊断，均不得被写成已确认。
  - **范围边界**：事实只绑定当前 task、阶段、当前 decision 和确认；不创建第二状态机、历史 ledger 或新任务。
  - **依据**：D-011、D-019；PFACT-05
  - **场景**：SCN-007
  - **验收**：AC-013
- **FR-REL-002**：系统必须为 detail advice 提供可直接复用的最小合法材料入口。
  - **最小输入**：`raw_requirement`、`approved_direction`、`draft_spec_or_acceptance` 和固定生成的 `review_instructions` 为必填；`context_map`、`evidence_map` 是可选。调用者不得再附带未被该入口声明的语义字段，例如 `objective_facts`。
  - **错误与输出**：缺失/空必填材料为 `MATERIAL_INCOMPLETE`，未允许字段为 `MATERIAL_FORBIDDEN`，并且均不得 dispatch provider；正确材料输出独立 review attempt/result ref、task/stage/material identity、provider transport terminal fact 和 findings，transport unavailable 不能变成空 finding。
  - **范围边界**：缺字段或禁止字段必须精确失败；正确最小材料可发起独立建议并保留真实运输事实。
  - **依据**：D-019；PFACT-06
  - **场景**：SCN-007
  - **验收**：AC-014
- **FR-GOV-001**：系统必须保证 catalog、依赖声明、模板、正式消费者和回归测试表达同一真实接线事实。
  - **范围边界**：声明的 Skill 必须有可验证的触发/执行事实；无 consumer 的重复控制面不得新增。
  - **依据**：D-006、D-012、D-019；PFACT-01
  - **场景**：SCN-007
  - **验收**：AC-007、AC-015
- **FR-GOV-002**：系统必须维护本 task 的用户指定治理问题清单：`/Users/Hugh/Downloads/workflowhub-governance-capability-issues-20260826.md`。
  - **最低条目**：每项必须有稳定 ID、问题、发现事实/证据、影响、根因、处理建议、owner/handoff、状态和最后更新时间；当前 task 发现新的 WorkflowHub 治理问题时追加或更新对应条目。
  - **边界**：该文件是用户持有的后续治理输入，不是第五份 task 材料、阶段推进许可证或完成依据；它不得覆盖 task 内的原始 review/失败事实。
  - **依据**：D-006
  - **场景**：SCN-007
  - **验收**：AC-020
- **FR-GOV-003**：stage-owned spec 模板、生成器和严格 spec-analyze 必须消费同一份 Markdown 内容合同。
  - **范围边界**：PFACT 状态、AC 场景、验证/oracle、失败条件、章节与来源映射的格式必须由同一共享定义产生并校验；不得依赖主 agent 对每个生成 spec 做手工格式修补。
  - **迁移语义**：旧格式必须有明确 RED 或兼容迁移策略；新的 GREEN 回归必须从 spec-specify 生成结果直接进入严格 stage-end spec-analyze。
  - **依据**：N-005；PFACT-07
  - **场景**：SCN-007
  - **验收**：AC-007、AC-022

### 流程事件可靠性（REL）

- **FR-REL-003**：阶段事件 writer 必须在写入时维护声明的 step 顺序，并在无法发布时保留真实失败事实。
  - **顺序规则**：同一 stage 的后续 step 只有在所有前置 step 已结束为 `completed`、`not_applicable` 或 `skipped` 后才能 `start`；一个 step 可以和它自己的声明 skill 按既有父子关系记录，但不能越过下一个 step。非法开始应在写入时返回明确 sequence error，不等待最终 bridge。
  - **失败恢复**：历史已写入的重叠/逆序事件不可删除、排序、改时间或重写成成功；正式发布应产生现有质量存储可消费的 `unavailable`/`incomplete` 事实，并说明 offending event，允许同 task 修复后从新合法 attempt 继续。
  - **边界**：不新增状态机、ledger、公共命令或第五份 task 材料；只强化现有 session event 和 stage outcome 合同。
  - **依据**：N-006；PFACT-08
  - **场景**：SCN-007
  - **验收**：AC-023

## 6. 模块划分

### 项目规范合同

- **负责什么**：定义、读取、绑定和更新两份项目规范的互补职责。
- **对外提供什么**：可引用的章节、内容身份、适用状态和更新语义。
- **依赖谁**：项目当前规范与影响分类。
- **测试边界**：视觉与体验职责不会重复；引用与更新状态可被观察。

### 消费者与影响合同

- **负责什么**：盘点真实消费者，判断影响范围并选择对应合同。
- **对外提供什么**：可复现的 consumer 清单、`unknown` 边界和 UI/backend/fullstack 合同选择。
- **依赖谁**：项目源码、人工语义补充和当前变更范围。
- **测试边界**：已支持消费者被盘点，未知模式不被静默省略。

### 体验验证合同

- **负责什么**：把长期场景和当前运行证据分层，并表达真实 QA 的失败/恢复语义。
- **对外提供什么**：逐 AC 的场景、oracle、当前证据身份和 cleanup 事实。
- **依赖谁**：Experience 场景、Design 规则、服务/API 身份和隔离浏览器。
- **测试边界**：fixture、旧服务、过期证据或清理失败不能形成 covered。

### 流程一致性合同

- **负责什么**：保证方向确认、审查输入、正式消费者和质量事实之间可追溯且不假绿。
- **对外提供什么**：不可变确认绑定、最小审查输入和一致的声明/执行事实。
- **依赖谁**：当前四份材料、用户确认和独立审查结果。
- **测试边界**：缺字段、禁止字段、缺身份或未执行依赖都被准确表达。

## 7. 关键实体

- **设计规范（Design Source）**：项目唯一视觉与组件规则来源；状态为 `not_applicable`、`bound_current`、`missing`、`update_required`、`stale` 或 `unknown`。
- **体验规范（Experience Source）**：项目唯一页面、交互与长期测试场景来源；状态与设计规范相同，但更新触发不同。
- **消费者盘点（Consumer Census）**：当前源码可发现的页面、组件、样式和数据消费者，以及每项的已知/未知边界。
- **影响合同（Impact Contract）**：某项变更选择的 UI、后端或全栈可观察义务集合。
- **体验场景（Experience Scenario）**：长期复用的用户操作、预期、覆盖边界和规范锚点，不携带某次执行结果。
- **当前验证证据（Current Evidence）**：仅属于当前 task 的实际运行结果、身份、oracle、限制和 cleanup 事实。
- **质量结论（Quality Conclusion）**：`covered`、`incomplete` 或 `unknown`；它与运行过程的 `passed`、`failed`、`unavailable` 分开表达。

## 8. 数据和生命周期

- **数据粒度**：Design/Experience 以项目级章节和页面条目为粒度；census 以真实消费者为粒度；evidence 以当前 task 的验收场景为粒度。
- **数据时效**：两份项目规范在其规则或场景变更后更新；consumer 与当前 evidence 必须绑定本次材料/服务身份，漂移即失效。
- **缺失或迟到**：缺规范、缺消费者、缺浏览器、缺服务身份或缺审查材料必须显示 `missing`、`unknown`、`unavailable` 或 `incomplete`，并给出修复方向。
- **预览与正式**：fixture/preview 可辅助组件判断；只有绑定当前服务/API 的真实页面证据才可支持全页面体验结论。
- **当前与历史**：Experience 保存长期场景，不保存历史运行结果；每次运行证据保留在各自 task，不覆盖旧事实。
- **归属与清理**：项目维护者维护 Design/Experience；本 task 的质量证据由该 task 持有；一次性真实 QA 必须记录清理成功或失败。

## 9. 兼容性预留

- **既有消费方**：非 UI 任务继续使用既有数据合同，不被强制要求两份项目规范或浏览器证据。
- **命名预留**：浏览器验收固定称“受控真实 QA 执行链”；`runner` 保留既有调用身份含义。
- **容器预留**：两份项目规范与四份 task 材料、当前质量证据共存；不得新增任务材料或第二状态机。
- **状态预留**：未知、不适用、缺失、陈旧、失败与未完成保持独立，不用单一 PASS/完成掩盖。
- **扩展边界**：未来可接入第三方设计或测试工具，但只能适配现有规范/证据合同；本期不承诺特定平台。

## 10. 明确不做与默认必须成立

### 明确不做

- 不修改 PaperBuilder 产品代码、页面、数据或历史任务（D-001）。
- 不新增第六阶段、第五份 task 材料、第二套状态机、公共 Runner、持久测试对象或永久双写（D-002、D-014、D-015）。
- 不强制引入 Figma、Storybook、Chromatic 或某一框架（D-019）。
- 不将会话诊断、已合并 review baseline、大材料审查分片或历史事件 producer 定位混入本期实现（D-019）。旧 review 的快照身份保持真实，修复后的完成按“已审查、已修复、当前检查、用户确认”判断（D-020）。
- 不把质量事实缺失变成同一 task 的修复阻塞（D-005）。

### 默认必须成立

- 任何适用规则、消费者或证据缺失时，系统必须早暴露准确原因，不能以默认数据或文字摘要掩盖（FR-CON-001、FR-QA-002）。
- 任何被声明为已接入的能力必须有真实 consumer、owner、测试和保留/删除条件（FR-GOV-001）。
- 任何质量结论都必须与当前范围和证据身份对应，历史或 fixture 证据不能自动升级当前结论（FR-QA-002、FR-QA-003）。

## 11. 验收标准

- [ ] **AC-001**：UI 项目能识别唯一 Design 与唯一 Experience，且二者职责不重叠。
  - **需求**：FR-DOC-001、FR-DOC-002
  验证：合同与模板验证
  - **通过条件**：视觉/组件/响应式规则只属于 Design；页面/交互/场景只属于 Experience；二者有明确章节、身份和 owner。
  失败：任一文件缺职责、允许样式双写，或被当作 task 第五材料。
  - **证据类型**：`test`
- [ ] **AC-002**：仅使用既有视觉规则的 UI 改动不会被要求更新 Design；规则变化会被准确标为更新。
  - **需求**：FR-DOC-001、FR-DOC-003
  验证：状态转换与边界案例
  - **通过条件**：`bound_current` 与 `update_required` 可区分并被后续阶段消费。
  失败：所有 UI 改动都强制改 Design，或真实规则变化未被捕获。
  - **证据类型**：`test`
- [ ] **AC-003**：Experience 可包含全项目已发现页面、状态、交互、恢复和长期场景，但不能包含样式规则或逐次运行结果。
  - **需求**：FR-DOC-002
  验证：合同与负面内容案例
  - **通过条件**：每个已发现页面有可锚定条目，体验/测试场景可索引，样式与历史结果被拒绝或分离。
  失败：存在多个 Experience、体验条目漏掉已发现页面，或 Experience 成为第二套样式规范。
  - **证据类型**：`test`
- [ ] **AC-004**：页面/交互/场景变化会更新 Experience；视觉规则变化会更新 Design；同一变更可同时更新两者。
  - **需求**：FR-DOC-002、FR-DOC-003
  验证：变更分类场景
  - **通过条件**：每类变更有唯一、可解释的更新义务。
  失败：将引用误当更新，或交互被写回 Design。
  - **证据类型**：`test`
- [ ] **AC-005**：每项改动都有基于证据的影响分类；unknown 不会被降格为 non_ui。
  - **需求**：FR-CON-001
  验证：分类与反例测试
  - **通过条件**：UI、后端、全栈、非 UI 与未知语义可区分。
  失败：执行者标签可覆盖真实消费者事实。
  - **证据类型**：`test`
- [ ] **AC-006**：存量项目会列出所有可发现页面；受影响页面完整，其余未完成页面保持 unknown/incomplete。
  - **需求**：FR-DOC-002、FR-CON-002
  验证：存量项目迁移场景
  - **通过条件**：不会把增量迁移误称全量 covered。
  失败：只写本次页面且隐藏其余页面，或历史补齐阻断同 task 修复。
  - **证据类型**：`test`
- [ ] **AC-007**：Skill/catalog/template/正式消费者与测试不能对同一能力给出相互矛盾的“已接入”声明。
  - **需求**：FR-GOV-001
  验证：契约与集成测试
  - **通过条件**：声明、触发/执行事实和 consumer 一致。
  失败：只改 catalog 或模板仍能被宣称为接入。
  - **证据类型**：`test`
- [ ] **AC-008**：UI、后端和全栈合同只要求真实影响层；全栈切片同时覆盖体验与数据链。
  - **需求**：FR-CON-001、FR-CON-003
  验证：三类变更矩阵
  - **通过条件**：纯后端不被无关 UI 拖慢，跨边界没有缺层。
  失败：任一层可被执行者随意省略。
  - **证据类型**：`test`
- [ ] **AC-009**：census 对支持的消费者可复现，对不支持模式显式为 unknown。
  - **需求**：FR-CON-002
  验证：源码样本与未知模式案例
  - **通过条件**：route/import/lazy/CSS/data 事实可被消费，未知不会默认为零。
  失败：仍依赖调用者手工 map 即可声称完整。
  - **证据类型**：`test`
- [ ] **AC-010**：真实 UI 证据绑定当前服务/API、隔离浏览器、AC、Design/Experience 身份、视觉/a11y/performance oracle 和 cleanup。
  - **需求**：FR-QA-001、FR-QA-002
  验证：真实服务成功、身份错配和 cleanup 失败场景
  - **通过条件**：每项证据可回指 task、stage attempt、material/snapshot、当前身份与场景；失败、取消与重试证据不互相覆盖。
  失败：fixture、旧服务、身份错配或无 cleanup 仍被判为真实页面通过。
  - **证据类型**：`evidence`
- [ ] **AC-011**：最终核对会发现当前变更、规范、consumer、合同和 evidence 的不一致或过期。
  - **需求**：FR-QA-002、FR-QA-003
  验证：一致性与陈旧证据反例
  - **通过条件**：不一致为 `incomplete`/`unknown`，并可说明修复方向。
  失败：仅凭单元测试或文件存在就给 covered。
  - **证据类型**：`test`
- [ ] **AC-012**：真实 QA 行为不会新建或复用 Runner 名称、对象、持久状态、公共命令或阶段。
  - **需求**：FR-QA-001
  验证：架构与行为边界测试
  - **通过条件**：它只是既有 build-code 的一次性“受控真实 QA 执行链”。
  失败：引入新的控制面或与调用身份术语冲突。
  - **证据类型**：`test`
- [ ] **AC-013**：make-decision 的用户确认拥有只绑定当前 task、当前方向和当前材料的不可变交互汇总事实。
  - **需求**：FR-REL-001
  验证：确认、内容变化、重放与冲突反例
  - **通过条件**：正常确认以规定输入产生 `workflowhub-interaction-aggregate.v1`；变化或冲突不会复写旧事实，相同重放返回原事实。
  失败：只能手工伪造、整份覆盖无法追溯，或新增第二状态机。
  - **证据类型**：`test`
- [ ] **AC-014**：detail advice 有官方最小材料模板/adapter；缺字段和禁止字段精确失败，正确材料可产生真实独立审查事实。
  - **需求**：FR-REL-002
  验证：缺字段、禁止字段、正确字段三组案例
  - **通过条件**：使用者无需从内部代码反查输入字段；`objective_facts` 等未声明字段按 `MATERIAL_FORBIDDEN` 拒绝且不 dispatch。
  失败：正确意图仍只能反复得到 MATERIAL_INCOMPLETE/MATERIAL_FORBIDDEN。
  - **证据类型**：`test`
- [ ] **AC-015**：Skill 依赖被声明时，正式结果能区分未触发、已触发未执行与已执行，并与 consumer/test 一致。
  - **需求**：FR-GOV-001
  验证：阶段集成测试
  - **通过条件**：声明不再替代执行事实。
  失败：仅加载/解析 Skill 就能声称完成对应 UI/全栈质量动作。
  - **证据类型**：`test`
- [ ] **AC-016**：每个 Design/Experience 绑定都能以规定 identity 精确比较，且 writer 不越阶段。
  - **需求**：FR-DOC-004
  验证：identity、锚点、内容变化与阶段 writer 的正反例
  - **通过条件**：path/hash/revision/anchor 全部匹配才可绑定；漂移为 stale；只有 build-code 可更新项目规范。
  失败：标题 slug 被当稳定 anchor、identity 不全仍 covered，或 build-spec/verify-code 写入规范。
  - **证据类型**：`test`
- [ ] **AC-017**：同一源码 snapshot 的 consumer census 可重放，未知模式和人工语义不会被静默吞掉。
  - **需求**：FR-CON-002、FR-CON-004
  验证：支持模式、动态未知模式、人工补充与重复扫描案例
  - **通过条件**：输出具有 schema/version/支持矩阵、稳定 consumer ID 和 unknown reason；发现页面进入 Experience 索引。
  失败：扫描输入不明、重复结果不稳定，或人工补充覆盖原始扫描事实。
  - **证据类型**：`test`
- [ ] **AC-018**：同一合同证据集合对 `covered`、`incomplete` 和 `unknown` 的结论唯一且可解释。
  - **需求**：FR-CON-005
  验证：四类影响合同与缺失/失败/陈旧/未知组合矩阵
  - **通过条件**：已知失败或缺失优先为 incomplete；仅未知为 unknown；所有当前成功事实才可 covered。
  失败：unknown 被降为不适用，或缺浏览器/迁移/cleanup 仍给 covered。
  - **证据类型**：`test`
- [ ] **AC-019**：build-code 官方 handler 对适用范围实际调用一次受控真实 QA 执行链，并正确表达新 invocation 的重试。
  - **需求**：FR-QA-001、FR-QA-004
  验证：阶段集成测试与 fixture-only 反例
  - **通过条件**：成功、身份错配、浏览器失败、取消、重试和 cleanup 失败均有真实调用/evidence 事实。
  失败：只测试纯函数、只解析 Skill，或用 fixture/旧 invocation 冒充真实页面验收。
  - **证据类型**：`test`
- [ ] **AC-020**：本 task 的用户指定 Downloads 治理清单保持可消费、可更新，且不冒充 task 材料。
  - **需求**：FR-GOV-002
  验证：字段、追加更新和边界检查
  - **通过条件**：每项具备最低字段；本 task 的新治理发现会更新；没有任何阶段状态从该文件推导。
  失败：清单漏掉 owner/证据/状态，或被当作第五材料/完成凭据。
  - **证据类型**：`test`
- [ ] **AC-021**：后端与全栈合同对每一数据层给出可验证成功、失败、恢复和幂等边界。
  - **需求**：FR-CON-003
  验证：API、DTO、migration、persistence、consumer 与端到端切片的正反例
  - **通过条件**：全栈成功可读回；部分失败、DTO 不兼容、迁移/persistence 异常和不可重试动作均有真实可观察结果。
  失败：用默认数据掩盖不兼容，或任一数据层失败仍被声明端到端成功。
  - **证据类型**：`test`
- [ ] **AC-022**：spec-specify 生成的规格可被同一 current revision 的严格 spec-analyze 直接解析。
  - **需求**：FR-GOV-003
  验证：生成 spec → 严格 stage-end spec-analyze GREEN，及旧 PFACT/AC 格式的 RED/迁移案例。
  - **通过条件**：PFACT、AC、章节和来源映射格式来自同一共享合同，不需要 agent 手工改标签。
  失败：生成后仍必须人工改 PFACT 状态、验证/oracle 或失败标签才能得到一致结果。
  - **证据类型**：`test`
- [ ] **AC-023**：step 事件顺序错误在写入时被拒绝，历史重叠会形成真实不可用事实而不是发布末尾才崩溃。
  - **需求**：FR-REL-003
  验证：顺序 step 的 GREEN、前置 open 时启动后续 step 的 RED、以及历史重叠事件的 fail-closed/unavailable 记录案例。
  - **通过条件**：没有后续 step 越过 open 前置；非法事件不写入；已存在的重叠事件不被修改且 stage 质量保持 incomplete/unavailable。
  失败：允许越序并在大量工作后才报 `BRIDGE_TIME_INVALID`，或通过改时间/删事件伪造可发布结果。
  - **证据类型**：`test`

### 冻结审查事实与处置

- **审查事实**：`quality/reviews/results/build-spec-default-10f592e9f05b387dbc4b3b244a24b59d502bf2ed-6a6334b2-7a11-46c2-86ec-e1ef5f5f351f.json` 为本 stage 唯一一次语义 advice。其 broker group 为 `partial`：`codex/luna` 与 `kimi/coding` 完成，`opencode/v4flash` 为 `SESSION_IDLE_WITHOUT_TERMINAL`；这不是空 finding，也不是 review PASS。
- **处置边界**：下列修复改变了 current spec，故该 review 的 material identity 已成为历史审查事实；按单轮规则不重跑同一 review。stage-end spec-analyze 必须针对当前材料检查一致性，不能把旧 review 当作新材料已独立审查。
- **F-172b8ea93d45**：已修复。新增 FR-GOV-002 / AC-020，明确 Downloads 清单的位置、字段、更新义务及非第五材料边界。
- **F-5a3904125feb**：已修复。FR-DOC-004 / AC-016 定义 identity、稳定锚点、hash 比较、漂移与唯一 writer。
- **F-60bd685ce866**：已修复。FR-CON-005 / AC-018 定义四类合同的最小事实、结论优先级和 covered 判定。
- **F-77b4efe9fe78**：已修复。FR-REL-001 / 002 定义交互汇总与 detail advice 的最小输入、输出、绑定、重放、冲突和错误语义。
- **F-a79db533d6b2、F-e2d5958dfa13、F-d2ba29a04ca6、F-52175d18a19a**：已修复。来源映射改为真实 FR/AC，单列 F-006，并补 D-017 / D-018 追溯。
- **F-b144cea4d9ae**：已修复。FR-CON-003 / AC-021 补全后端与全栈的成功、失败、恢复、幂等和读回边界。
- **F-b3ec185e6717**：已修复。FR-CON-004 / AC-017 定义 census 的输入、输出、支持矩阵、unknown 与人工补充。
- **F-c53f58301945**：已修复。FR-QA-001～004 / AC-019 要求 build-code handler 的实际一次调用及成功、失败、取消、重试、cleanup 集成 oracle。
- **F-577a32d20f30**：已修复。第三方工具非目标仅引用 D-019，不再误引 D-001。

## 12. 风险、未决与交接

- **RISK-001**：交互汇总事实 writer 缺失。
  - **受影响 ID**：PFACT-05、FR-REL-001、AC-013
  - **触发条件**：用户确认方向后，正式路径仍无法生成绑定该确认的不可变汇总事实。
  - **后果**：make-decision 质量不能被完整声明，后续使用者可能依赖不可验证的手工记录。
  - **缓解或 STOP**：在本 task 修复正式 writer；修复前如实保留 `material_incomplete`，不创建替代状态机。
  - **处理 Stage**：`build-code`
  - **验证**：AC-013 的正常、冲突与重放案例。
- **RISK-002**：consumer census 首版的技术栈或动态模式覆盖有限。
  - **受影响 ID**：FR-CON-002、AC-006、AC-009
  - **触发条件**：项目使用未支持的动态消费者模式。
  - **后果**：页面/消费者范围可能未完全可知。
  - **缓解或 STOP**：输出 `unknown` 与人工补充入口；禁止以零消费者或 covered 代替。
  - **处理 Stage**：`build-plan`
  - **验证**：AC-009 的未知模式案例。
- **RISK-003**：受控真实 QA 的服务/API 身份或 cleanup 失败。
  - **受影响 ID**：FR-QA-001～003、AC-010、AC-011
  - **触发条件**：测试命中旧服务、fixture、错误 API，或资源未清理。
  - **后果**：真实验收结论不可用或污染后续测试。
  - **缓解或 STOP**：记录实际身份与 cleanup 事实；失败即 incomplete，不降级为 PASS。
  - **处理 Stage**：`build-code`、`verify-code`
  - **验证**：AC-010、AC-011。
- **RISK-004**：detail advice 输入合同继续漂移。
  - **受影响 ID**：PFACT-06、FR-REL-002、AC-014
  - **触发条件**：必填/禁止/语义字段不一致或没有官方 adapter。
  - **后果**：独立审查得到不可用事实，流程被错误描述。
  - **缓解或 STOP**：在本 task 提供最小模板/adapter 和三组边界案例。
  - **处理 Stage**：`build-code`
  - **验证**：AC-014。
- **RISK-005**：spec 模板与严格 analyzer 的共享格式继续漂移。
  - **受影响 ID**：PFACT-07、FR-GOV-003、AC-022
  - **触发条件**：spec-specify 产物仍需人工更改 PFACT、AC 或章节格式，才可被本阶段 parser 接受。
  - **后果**：工作流可表面完成、但正式 stage-end 只会产出格式性不一致，掩盖真正产品规格质量。
  - **缓解或 STOP**：在本 task 让模板/共享合同/validator 使用同一来源，并用生成→严格分析 GREEN 和旧格式 RED 证明；修复前保持 `incomplete`，不手工伪装为通用模板已可用。
  - **处理 Stage**：`build-code`
  - **验证**：AC-022。

- **OPEN-001**：census 首版支持哪些框架和动态加载模式。
  - **受影响 ID**：FR-CON-002、AC-009
  - **owner**：`build-plan`
  - **影响**：决定可自动盘点范围与人工补充边界。
  - **处理 Stage**：`build-plan`
  - **关闭条件或 STOP**：计划列出支持集合、未知输出和验证样本；未列清不得将未知模式称为 complete。

## 13. 业务影响与回归范围

### WorkflowHub 的 UI/全栈交付流程

- **既有行为**：局部 Skill、模板和 validator 可以存在，但阶段可能只消费通用事实；Design/QA/consumer 证据可脱节。
- **本需求影响**：适用任务必须暴露两份项目规范、真实消费者、影响合同和当前证据之间的对应关系。
- **回归路径**：SCN-001 至 SCN-007；AC-001 至 AC-015。
- **验收**：所有 AC。

- **可能受冲击的业务规则**：四份 task 材料仍是唯一工作真相；质量事实不阻止同 task 修复；已有公共运行时分类不扩张。
- **明确无影响**：PaperBuilder 产品行为、第三方设计工具选择、非 UI 任务的无关浏览器/规范负担，以及延期治理项。
