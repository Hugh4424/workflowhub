# 功能规格：WorkflowHub 最小治理执行链

- **功能名**：WorkflowHub 最小治理执行链
- **来源**：已接受的 `decision-log.md`，R-001 至 R-008、D-002 至 D-017
- **状态**：草稿
- **内容格式**：spec-content.v3

## 速读卡（30 秒）

- **一句话需求**：用户选定项目后，只走五个正常阶段；内部材料、任务目录、审查输入和 Skill 消费要么直接工作，要么在问题产生处给出能修复的错误。
- **核心改动点**：统一材料的生产与消费格式；正式开始前建立正确 worktree；给 detail 审查正式最小输入；让 Skill 声明被正式 handler 消费；为实质性 UI 改动补齐 build-spec 设计确认；让 provider 执行不被本地按总耗时强制结束，并保留真实终态和失败事实。
- **最大影响面**：WorkflowHub 五阶段的治理运行时、现有审查 broker 的 provider 生命周期，以及未来 UI 任务在 build-spec 的条件设计路径；不实现产品页面。OpenCode Go/Zen 的远端 120 秒边界不属于本地可控范围。
- **验收信号**：真实生产物无需手工改写即可被消费；错误不会拖到发布；修复后可在同一任务继续；实质性 UI 改动在当前设计获批前不会进入下一阶段。

## 1. 问题与紧迫性

WorkflowHub 的价值是让用户方便完成 make-decision、build-spec、build-plan、build-code、verify-code。当前问题不是阶段不够，而是内部约定互相不一致：生产者写出的材料可能被自己的 parser 拒绝，任务记录可能早于 worktree 出现，detail 审查缺少正式输入，Skill 虽然声明却没有正式 handler 消费。结果是用户需要理解内部术语、反复猜字段，并在发布时才看到本应更早出现的错误。

本次只收敛现有治理运行时，让默认路径能走、错误尽早出现、修好后能在同一任务继续；不重写五阶段。

## 2. 背景、目标与范围

### 背景

当前工作真相只有 decision-log.md、spec.md、plan.md、tasks.md。阶段事件、审查和测试只记录事实，不是额外的用户步骤。已完成的 make-decision 已确认四类窄修复和条件 UI 设计治理，并明确禁止新阶段、新公共命令、新状态机和永久兼容层。

### 目标

- 用户仍只面对五个正常阶段和清楚的当前结果。
- 材料生产者与正式消费者使用同一套可验证格式。
- 项目身份、worktree、事件身份和输入结构在各自入口尽早校验。
- 输入或环境修好后，继续同一任务，不覆盖旧失败事实。
- 每个声明 Skill 的结果或负责材料都被现有正式 handler 真实消费。

### 范围内

- spec-specify、spec-analyze、spec-tasks 的生产格式与正式消费格式闭合。
- 四个编写阶段（make-decision、build-spec、build-plan、build-code）各保留一个材料语义结束检查；verify-code 不重复这项检查，审查建议不成为第二个结束检查。
- make-decision 正式开始前的项目身份、worktree 和事件早失败。
- wh-review detail 的正式最小输入、身份与新旧检查、逐字段诊断。
- 现有审查 broker 不按 provider 已运行多久主动终止；WorkflowHub 不增加第二套超时，外部或 provider 返回的 `PROCESS_TIMEOUT` 只按真实失败事实保留。
- Skill 声明与现有正式 handler 消费的一一映射。
- 实质性 UI 改动的 build-spec 设计读取、本地原型、展示、当前版本批准和外部设计返回闭环；非 UI 任务保持原路径。

### 来源与决策映射

- R-001 → D-006 → FR-MAT-001、FR-MAT-002、FR-MAT-003、FR-REV-001、FR-REV-002、FR-SKL-001、FR-SKL-002 → AC-MAT-001、AC-MAT-002、AC-MAT-003、AC-REV-001、AC-REV-002、AC-SKL-001、AC-SKL-002；status=current。
- R-002 → D-002、D-009 → FR-GOV-001 → AC-GOV-001；status=current。
- R-003 → D-002、D-009 → FR-GOV-001、FR-MAT-003 → AC-GOV-001、AC-MAT-003；status=current。
- R-004 → D-003、D-004、D-005、D-007、D-008 → FR-START-001、FR-START-002、FR-START-003、FR-EVT-001 → AC-START-001、AC-START-002、AC-START-003、AC-EVT-001；status=current。
- R-005 → D-009 → FR-GOV-001 → AC-GOV-001；status=current，本任务的代码、现有文档和提交仍逐项确认，不成为通用第六阶段。
- R-006 → D-006、D-009 → 第 10 节唯一非目标清单；status=non-goal（不实现产品 UI，但保留条件 UI 治理）。
- R-007 → D-010、D-011、D-013、D-014、D-015 → FR-UI-001、FR-UI-002、FR-UI-003 → AC-UI-001、AC-UI-002、AC-UI-003；status=current。
- R-008 → D-012、D-015 → FR-GOV-001、FR-UI-001、FR-UI-003 → AC-GOV-001、AC-UI-001、AC-UI-003；status=current。
- D-017 → FR-REV-004 → AC-REV-004；status=amended，范围只限现有 broker 的 provider 生命周期事实，不设本地 elapsed-time deadline；已有 `PROCESS_TIMEOUT` 仍保留为外部/历史事实。

### 决策状态

- **locked**：D-002 至 D-017 均已由用户确认；原选择、理由、范围和非目标只从 decision-log.md 读取，本阶段不重命名、不重新提问、不压缩成替代决定。
- **locked handoff**：D-008 要求把已验证的启动修复带入当前正确任务分支；本规格用 FR-START-001、FR-START-002 和 AC-START-001、AC-START-002 验证“先有正确 worktree”和“任务提交后仍复用”。
- **unresolved for engineering**：OPEN-GOV-001 至 OPEN-GOV-003 只涉及现有接口怎样直接连接，由 build-plan 关闭；它们不得改变用户流程或新增产品范围。
- **newly discovered ambiguity**：无。当前新增事实只收紧验证方法，没有需要用户重新选择的方向。

### 最新运行时修订（2026-08-28）

本节与 `decision-log.md` 同日修订覆盖此前“为每个 provider 设有限最终期限”的文字。当前实现不得按总耗时或无进展时长终止 `3rd-review`/`wh-review`；执行只在 provider/进程终态、明确取消或进程实际丢失时结束。健康探针的单次请求保护只产生诊断，不是执行期限。`PROCESS_TIMEOUT` 只表示 provider 或上游真实返回的失败事实；本地 watchdog 不生成它。OpenCode Go/Zen 仍可能在远端约 120 秒后不返回，这个风险延期到上游服务/路由修复，不在本地伪造通过。

## 3. 用户场景与状态覆盖

### SCN-001：用户只走五个正常阶段

- **角色**：使用 WorkflowHub 的开发者
- **Given**：用户已选定项目并开始一个任务
- **When**：用户先在 make-decision 用大白话完成 Talk，再依次完成五个正常阶段
- **Then**：用户只看到当前阶段、当前材料、成功结果或可行动错误，不需要操作内部运行时对象；Talk 覆盖完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期交接，不调用 Clarify、不虚构用户回复，并把原始需求、关键事实、选择、理由、风险和延期交接写入 decision-log.md

### SCN-002：真实材料原样流转

- **角色**：阶段执行者
- **Given**：当前阶段使用官方生产技能生成材料
- **When**：正式 parser、analyzer 或下游阶段读取该材料
- **Then**：材料无需人工改标签、字段或标题即可通过结构校验

### SCN-003：坏的分析输入在保存前失败

- **角色**：阶段执行者
- **Given**：分析输入缺字段、字段类型错误或身份不匹配
- **When**：输入交给正式记录入口
- **Then**：入口直接指出具体问题，不保存坏记录，也不等到发布才失败

### SCN-004：正确项目旁创建任务 worktree

- **角色**：开始 make-decision 的用户
- **Given**：当前会话唯一绑定一个真实 Git 项目
- **When**：正式任务开始
- **Then**：系统先在主项目旁创建或验证唯一任务 worktree，再记录第一条正式阶段事件或材料

### SCN-005：启动失败后原任务重试

- **角色**：修复环境问题的用户
- **Given**：项目缺失、身份冲突、Git 对象不可读或 worktree 创建失败
- **When**：用户修好真实原因后重试
- **Then**：系统继续同一任务；旧失败事实保留，错误目录或兜底任务不会被当成成功结果

### SCN-006：任务提交后继续复用 worktree

- **角色**：在任务分支工作的开发者
- **Given**：任务 worktree 已产生自己的提交，主项目保持原状态
- **When**：同一任务再次进入正式阶段
- **Then**：系统复用同一路径、分支和 Git 注册，并以当前任务 HEAD 为当前基准

### SCN-007：错误事件不污染会话

- **角色**：阶段执行者
- **Given**：事件使用未声明的 step、Skill、错误顺序或错误任务身份
- **When**：事件准备写入
- **Then**：系统在写入前拒绝并点名错误；当前有效事件序列不变

### SCN-008：detail 审查使用正式最小输入

- **角色**：请求 make-decision detail 审查的阶段执行者
- **Given**：当前决定、Talk/Grill 结论和待审材料已经存在
- **When**：调用官方 detail 审查入口
- **Then**：入口只要求公开的最小输入，完整消费当前决定，调用方不猜生成字段或可选 map

### SCN-009：Skill 声明被正式消费

- **角色**：五阶段运行时
- **Given**：阶段声明了一个 Skill，且它在本次运行中触发或明确不适用
- **When**：正式 handler 处理阶段结果
- **Then**：触发项的真实结果或负责材料被语义消费；未触发项保持 not_applicable；缺失或失败被如实指出

### SCN-010：修复后的正式发布不覆盖旧事实

- **角色**：在同一会话修复阶段事实的执行者
- **Given**：旧执行尝试已写入不可变结果，当前材料或输入已修正
- **When**：同一任务重新执行正式发布
- **Then**：新执行使用新的当前尝试身份，旧结果不被覆盖，当前成功结果可独立验证；当前投影按事件追加顺序和阶段清单顺序重新计算，旧的后续阶段事件不进入本次投影，系统不以毫秒时间倒推新旧，任务分支领先主项目也不被当作过期

### SCN-013：provider 无终态时保持真实未完成

- **角色**：请求 detail 审查的阶段执行者
- **Given**：provider 进程持续运行但没有健康探针、终态输出或可验证进展
- **When**：现有审查 broker 执行该 provider
- **Then**：broker 和 WorkflowHub 不因已运行时长自动终止 provider；等待 provider/进程终态、明确取消或进程实际丢失。若上游已经返回 `PROCESS_TIMEOUT`，只保留该真实失败事实，不能写成空 findings、通过或语义结论

### SCN-011：实质性 UI 改动先完成当前设计

- **角色**：准备开发 UI 改动的用户和 build-spec 执行者
- **Given**：需求新增页面，或明显改变现有页面的布局、交互、状态或响应式结构
- **When**：进入 build-spec
- **Then**：执行者读取已有页面、组件、真实数据结构、Design.md、Experience.md 和当前 spec，生成并展示绑定当前输入的本地 HTML 原型；原型覆盖关键状态和桌面、窄屏、手机结构，用户可批准或要求修改

### SCN-012：UI 设计不满意时在同一阶段修复

- **角色**：不接受当前原型的用户
- **Given**：当前原型未获批准，或外部设计工具没有返回当前版本
- **When**：用户要求调整或使用外部设计提示词
- **Then**：build-spec 保持未完成，保留当前设计风险；返回的设计只有在绑定当前输入并重新展示、确认后才可继续，同一任务不新增阶段或材料

### 状态覆盖清单

| 状态 | 适用结论 | 场景 | 用户可见结果 |
| --- | --- | --- | --- |
| 默认态 | 适用 | SCN-001、002、011 | 五阶段正常流转；UI 任务先展示当前设计 |
| 空态 | 适用 | SCN-003、005 | 点名缺少的输入或项目 |
| 错误态 | 适用 | SCN-003、005、007 | 入口早失败且可重试 |
| 加载态 | N/A | 本地阶段命令 | 只发布终态事实 |
| 取消态 | 适用 | SCN-005、012 | 不伪造完成或覆盖当前材料 |
| 设计待确认 | 适用 | SCN-011、012 | 留在 build-spec，显示修改或外部设计动作 |
| 边界态 | 适用 | SCN-006、010、012 | 当前任务和设计输入身份保持唯一 |
| 权限态 | 适用 | SCN-007 | 错误写边界在写前拒绝 |
| 竞态 | 适用 | SCN-010、012 | 新旧尝试或设计版本互不覆盖 |
| provider 无终态 | 适用 | SCN-013 | 保持未完成并保留真实失败事实 |

## 4. 产品事实与假设（PFACT）

- **PFACT-GOV01**：verified — 已接受方向只允许四类治理运行时窄修复，并在实质性 UI 改动时补条件设计确认，不允许重写五阶段。
  - **证据或来源**：decision-log.md 的 R-001、R-002、R-003、R-007、D-002、D-006、D-009、D-010、D-011。
  - **关联**：FR-GOV-001、FR-MAT-003、FR-UI-001、AC-GOV-001、AC-MAT-003、AC-UI-001。

- **PFACT-GOV02**：inferred — 当前真实材料模板与正式 parser 存在可复现的不闭合，测试样本依赖手工修形。
  - **证据或来源**：本阶段只读研究；限制是源文件证据不在独立审查 packet 内，最终由 stage outcome 和后续 round-trip 测试核实。方向来源 R-001、D-006。
  - **关联**：FR-MAT-001、FR-MAT-002、AC-MAT-001、AC-MAT-002。

- **PFACT-GOV03**：verified — 当前确定 worktree 使用主项目旁的唯一目录和任务分支；任务产生提交后可复用同一 worktree。
  - **证据或来源**：decision-log.md 的 D-003 至 D-008，以及已验证的当前任务行为。
  - **关联**：FR-START-001、FR-START-002、FR-START-003、AC-START-001、AC-START-002、AC-START-003。

- **PFACT-GOV04**：inferred — 当前任务记录和私有事件可能早于 worktree 准备，因此会出现“看似开始、目录尚不存在”。
  - **证据或来源**：本阶段只读研究；限制是源文件证据不在独立审查 packet 内，后续由启动顺序测试核实。方向来源 R-004、D-003。
  - **关联**：FR-START-001、FR-EVT-001、AC-START-001、AC-EVT-001。

- **PFACT-GOV05**：inferred — 当前 detail 使用通用审查入口，已有最小材料集合，但文档、预检和真实 CLI 覆盖未闭合。
  - **证据或来源**：本阶段只读研究；限制是源文件证据不在独立审查 packet 内，后续由官方入口合同测试核实。方向来源 R-001、D-006。
  - **关联**：FR-REV-001、FR-REV-002、AC-REV-001、AC-REV-002。

- **PFACT-GOV06**：inferred — 当前 Skill closure 能证明包和声明存在，但多数声明不能证明被正式 handler 语义消费。
  - **证据或来源**：本阶段只读研究；限制是源文件证据不在独立审查 packet 内，后续由 consumer census 和真实 handler 测试核实。方向来源 R-001、D-006。
  - **关联**：FR-SKL-001、FR-SKL-002、AC-SKL-001、AC-SKL-002。

- **PFACT-GOV07**：not_applicable — 本任务不实现产品页面、前端业务、浏览器或下游 UI 验收；这些是条件 UI 治理的被保护对象，不是本任务的产品页面范围。
  - **不适用理由**：decision-log.md 的 R-006、R-007 和非目标同时明确“实现不做产品 UI、治理运行时必须覆盖 UI 条件路径”。
  - **关联**：FR-GOV-001、FR-UI-001、AC-GOV-001、AC-UI-001。

- **PFACT-GOV08**：inferred — 宿主应把用户选定的会话项目交给现有启动入口；具体接口属于 build-plan 的工程设计。
  - **证据或来源**：D-007 与当前接口调查；限制是尚未选择具体传递方式。
  - **关联**：FR-START-001、AC-START-001、OPEN-GOV-001、RISK-GOV-002。

- **PFACT-GOV09**：verified — spec-clarify trigger=false，当前 accepted decision 已覆盖用户流程、状态、成功失败、非目标、延期和验收边界。
  - **证据或来源**：本阶段完成的规格歧义检查；没有发起 Clarify，也没有推断用户回复。
  - **关联**：全部 FR 与 AC。

- **PFACT-REV04**：verified — 当前 `3rd-review` broker/process/health-runner 不再有 provider 总耗时或无进展终止；WorkflowHub 只消费 provider/进程的真实终态、取消或进程丢失。OpenCode 约 120 秒的失败出现在 Go/Zen 上游长多步流式 session，本地 `timeout:false` 不能覆盖远端边界。
  - **证据或来源**：`3rd-review` 当前代码与 316/316 回归；失败样本约 120211 ms 时只有 `step_start`、最终为 `SESSION_IDLE_WITHOUT_TERMINAL`；同一模型约 378 KB 单请求约 8.5 秒完成。OpenCode provider 配置允许 `timeout:false`，但远端路由仍可能提前断开。
  - **研究状态**：verified — 本地执行时限已删除；上游 Go/Zen 远端边界保留为延期风险，不在本地添加替代 timer。
  - **关联**：FR-REV-004、AC-REV-004、RISK-GOV-006。

- **PFACT-UI01**：verified — 实质性 UI 改动的当前设计属于 build-spec 的条件工作；非 UI 或文字、局部样式修正不触发该路径。
  - **证据或来源**：decision-log.md 的 R-007、D-010、D-011、D-012。
  - **关联**：FR-UI-001、FR-UI-003、AC-UI-001、AC-UI-003。

- **PFACT-UI02**：inferred — 当前设计应以已有页面、组件、真实数据结构、Design.md、Experience.md 和当前 spec 为输入；这些输入在具体产品任务中可能缺失或过期。
  - **证据或来源**：decision-log.md 的 D-013、D-014、D-015；限制是本治理任务不读取某个具体产品页面，也不把缺失输入猜成可用设计。
  - **关联**：FR-UI-002、FR-UI-003、AC-UI-002、AC-UI-003、RISK-GOV-004。

- **PFACT-UI03**：verified — spec.md 是唯一产品需求权威；本地 HTML、外部设计返回物、截图和用户回复只是绑定当前版本的可见证据，不是第五份材料。
  - **证据或来源**：decision-log.md 的 D-014、D-015。
  - **关联**：FR-UI-002、FR-UI-003、AC-UI-002、AC-UI-003。

## 5. 功能需求

### 简单五阶段（GOV）

- **FR-GOV-001**：用户流程仍只有 make-decision、build-spec、build-plan、build-code、verify-code；内部目录、事件、审查、分析和确认不得变成新的用户阶段。make-decision 必须用大白话完成真实 Talk，覆盖完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期交接；不得在该阶段调用 Clarify 或虚构用户回复，并必须把原始需求、关键事实、选择、理由、风险和延期交接写入 decision-log.md。
  - **范围边界**：允许现有阶段内部早校验；不新增公共步骤或完成状态。
  - **依据**：D-002、D-009、PFACT-GOV01、PFACT-GOV07。
  - **场景**：SCN-001。
  - **验收**：AC-GOV-001。

### 条件 UI 设计治理（UI）

本域只规定未来 UI 任务在 build-spec 应看到什么；本任务不制作任何产品页面。实质性 UI 改动指新增页面，或明显改变现有页面的布局、交互、状态或响应式结构。文字和局部样式修正走普通规格路径。

- **FR-UI-001**：系统必须先判断当前需求是否属于实质性 UI 改动；属于时进入 build-spec 的设计读取、原型展示和当前版本确认，非 UI 或轻微修正记录不适用并继续原有规格路径。
  - **范围边界**：只增加现有 build-spec 的条件工作，不新增阶段、公共命令或通用审批。
  - **依据**：D-010、D-011、D-012、PFACT-UI01。
  - **场景**：SCN-001、SCN-011、SCN-012。
  - **验收**：AC-UI-001。

- **FR-UI-002**：实质性 UI 改动的设计必须以已有页面、组件、真实数据结构、Design.md、Experience.md 和当前 spec 为基础，生成可展示的本地 HTML 原型；原型至少说明页面或区域、交互流程、可见标签、关键状态、桌面/窄屏/手机结构、响应式行为和无障碍意图。
  - **范围边界**：原型是设计证据，不是生产代码、后端实现或浏览器 QA；输入缺失时如实显示 unknown/unavailable/N/A 及原因。
  - **依据**：D-013、D-014、D-015、PFACT-UI02、PFACT-UI03。
  - **场景**：SCN-011。
  - **验收**：AC-UI-002。

- **FR-UI-003**：当前原型或外部设计返回物必须绑定当前 spec、设计规范、交互规范、页面数据输入及其版本；展示必须先于用户回复。用户明确批准当前版本后，build-spec 才能继续；要求修改、未返回、版本不匹配或未批准都保留真实风险并留在 build-spec 同一任务修复。
  - **范围边界**：不复制第五份需求材料，不用旧回复或文件存在冒充批准，不把设计确认扩成所有任务的通用审批。
  - **当前设计证据**：适用性及理由、每个当前输入的 ref/hash/revision、原型或外部返回物的 ref/hash/revision、展示事件、展示后的用户回复，以及“批准绑定输入摘要和原型 hash”都写入现有阶段事实；任一输入或原型改变，旧批准立即失效。关键输入缺失时逐项记录 unknown、unavailable 或 N/A 及原因，不能宣称设计完成。
  - **依据**：D-011、D-013、D-014、D-015、PFACT-UI01、PFACT-UI03。
  - **场景**：SCN-011、SCN-012。
  - **验收**：AC-UI-003。

### 材料生产与阶段结束（MAT）

- **FR-MAT-001**：spec-specify、spec-analyze、spec-tasks 的官方模板或正式输出必须与唯一正式消费者使用同一套语法，真实产物可原样完成生产到解析的往返。
  - **范围边界**：只收敛现有四份材料及其现有 consumer；不建立第五份材料或转换层。
  - **依据**：D-006、PFACT-GOV02。
  - **场景**：SCN-002。
  - **验收**：AC-MAT-001。
  - **spec-specify 合同**：输入是当前 decision-log 与现有 spec；输出是 spec-content.v3。必含规范章节、SCN、单一状态 PFACT、带 source/scenario/AC 绑定的 FR，以及带场景、验证、通过、失败、证据类型的 AC；正式 build-spec handler 消费原始输出。
  - **spec-analyze 合同**：输入是当前 task/stage/material/snapshot 绑定的 packet 与 evidence subjects；输出只能是 consistent、inconsistent 或 material_incomplete，并带 errors、findings 和六部分摘要；正式 stage outcome handler 消费原始输出。
  - **spec-tasks 合同**：输入是当前 decision、spec、plan 和 acceptance criteria；输出使用当前 tasks 内容格式，必含可执行 Phase、任务卡、依赖、FR/AC 追溯、测试行为和唯一最终汇总；正式 build-plan handler 消费原始输出。
  - **共同身份锚点**：task、stage、material revision、当前材料 ref/hash，以及适用时的 snapshot 必须匹配；任一不匹配按该入口的字段或身份错误处理。

- **FR-MAT-002**：spec-analyze 的正式记录入口必须在保存前验证官方最小输入、任务、阶段、材料和证据身份；错误必须点名字段或身份，不保存坏对象。
  - **范围边界**：继续使用现有记录入口和当前事实库；不新增预处理服务或修形器。
  - **依据**：D-006、PFACT-GOV02。
  - **场景**：SCN-003。
  - **验收**：AC-MAT-002。

- **FR-MAT-003**：spec-analyze 是四个编写阶段共同使用的唯一材料语义检查 owner；每个阶段只调用一次对应检查，并按本阶段当前材料得到 consistent、inconsistent 或 material_incomplete。审查建议仍是建议，材料存在、人类确认和代码质量等原有事实各守原职责，不被合并或偷偷删除。
  - **范围边界**：唯一的是共同 owner 和每阶段一次语义调用，不是删除所有生命周期事实，也不是用一个阶段的结果替代另一个阶段。
  - **依据**：D-002、D-006、PFACT-GOV01。
  - **场景**：SCN-001、SCN-002。
  - **验收**：AC-MAT-003。
  - **四阶段映射**：make-decision 只检查原始需求与 decision-log.md；build-spec 在此基础上加入 spec.md；build-plan 再加入 plan.md 与 tasks.md；build-code 再加入实现、测试和逐条验收证据。四阶段各自只执行一次当前检查；consistent 才表示该阶段材料语义完整，inconsistent 或 material_incomplete 留在同阶段修复。verify-code 不适用此材料检查，沿用现有代码审查事实。
  - **正式交接**：下游只消费同一 task、同一阶段和当前材料 revision 的最新 completed 阶段结果。make-decision 因范围修订或阶段末检查失败重跑时，在新的当前结果正式完成前，仍保持现有进行中状态，不得拿旧完成结果当交接；旧失败和旧后续结果只读保留，修复后不阻塞同任务重跑。

### 正式启动与事件（START / EVT）

- **FR-START-001**：正式 make-decision 开始前，系统必须从当前会话唯一确定用户选定的真实 Git 项目，并先创建或验证主项目旁的唯一任务 worktree；成功前不得记录第一条正式阶段事件或材料。
  - **范围边界**：不从 Agent cwd、临时 checkout 或文件系统猜项目，不要求用户新增一个流程步骤。
  - **依据**：D-003、D-004、D-007、PFACT-GOV03、PFACT-GOV04、PFACT-GOV08。
  - **场景**：SCN-004、SCN-005。
  - **验收**：AC-START-001。

- **FR-START-002**：同一任务必须复用相同的 worktree 路径、任务分支和 Git 注册；任务分支产生提交后，以当前任务 HEAD 继续，主项目分支和工作区状态保持不变。
  - **范围边界**：不回退、不重新绑定主项目基线、不创建第二个任务目录。
  - **依据**：D-005、D-008、PFACT-GOV03。
  - **场景**：SCN-006。
  - **验收**：AC-START-002。

- **FR-START-003**：项目缺失或冲突、Git 不可读、路径或分支冲突、worktree 创建失败时，错误必须指出真实原因和可重试动作；修好后继续同一任务，旧失败事实保留。若 make-decision 因范围修订或阶段末检查失败而重跑，只有新的当前阶段结果和现有确认事实正式完成后，build-spec 才能消费它；此前不得用旧结果冒充交接。
  - **范围边界**：不创建 recovery 阶段、兜底目录、替代任务或历史改写。
  - **依据**：D-002、D-003、D-007、PFACT-GOV03。
  - **场景**：SCN-005、SCN-010。
  - **验收**：AC-START-003。

- **FR-EVT-001**：阶段事件在写入前必须验证当前任务、阶段、manifest 中声明的 step 或 Skill、依赖顺序和父子身份；任何不匹配不得污染当前事件序列。原始事件永久追加保留，当前投影按事件追加顺序和阶段清单顺序计算：发现回退、重复或从较早阶段重跑时，较早阶段成为新的起点，其后的旧阶段事件不进入当前投影；不以墙上时钟决定新旧，每次正式重跑使用新的 attempt 身份。
  - **范围边界**：复用现有事件入口和 manifest，不建立第二套事件系统。
  - **依据**：D-006、PFACT-GOV04。
  - **场景**：SCN-007。
  - **验收**：AC-EVT-001。

### detail 审查输入（REV）

- **FR-REV-001**：make-decision detail 的官方入口必须公开一份最小输入：任务路径、项目名、任务 ID、阶段、宿主 provider、detail track 和 materials；materials 只要求原始需求、完整当前决定、当前待审说明。完整当前决定包含已批准方向、理由、风险和 Grill 结论。调用方不得提供 runner 生成的审查指令，也不必猜可选 map。
  - **范围边界**：继续使用现有通用 review 入口和当前 decision-log 权威，不新增 detail 命令或第二份决定材料。
  - **依据**：D-006、PFACT-GOV05。
  - **场景**：SCN-008。
  - **验收**：AC-REV-001。
  - **权威绑定**：完整当前决定必须是当前 decision-log.md 的不可压缩原始 bytes，并绑定当前材料 revision；不得用摘要、字段摘录或旧 revision 代替。
  - **顶层字段**：task_path 是当前任务绝对路径；project_name、task_id 必须匹配该任务；stage 固定为 make-decision；host_provider 必填；review_track 固定为 detail；materials 必须是对象。
  - **materials 必填**：raw_requirement、approved_direction、draft_spec_or_acceptance 都是非空文本；approved_direction 必须承载完整当前 decision-log bytes，draft_spec_or_acceptance 必须是当前待审材料。
  - **可选与禁止**：context_map、evidence_map 继续可选；review_instructions、packet metadata、hashes 和 provider/model/effort 等 runner 生成或受信配置字段禁止由调用方提供。

- **FR-REV-002**：detail 预检必须在 provider 调用前逐字段报告 missing、empty、forbidden、type、identity、freshness；missing/empty 针对全部必填字段，type 针对路径、文本和对象形状，identity 针对 task/project/stage/track，freshness 针对 decision revision 和当前待审材料，forbidden 针对所有 runner 生成或受信配置字段。失败保持真实 unavailable 事实，修正输入后可在同一任务重试。
  - **范围边界**：不增加外层重试、provider fallback 或格式纠正器。
  - **依据**：D-002、D-006、PFACT-GOV05。
  - **场景**：SCN-008、SCN-010。
  - **验收**：AC-REV-002。

- **FR-REV-003**：make-decision、build-spec、build-plan 每次实际执行只审当前输入一次；历史审查只读保留且不自动复用。当前输入修正后可在同一任务重新请求审查，新结果与旧结果互不覆盖。
  - **范围边界**：不比较正文、版本、语义指纹或另建审查状态；build-code 和 verify-code 继续遵守各自当前实现审查规则。
  - **依据**：D-016、PFACT-GOV05。
  - **场景**：SCN-008、SCN-010。
  - **验收**：AC-REV-003。

- **FR-REV-004**：现有审查 broker 和 WorkflowHub 不得因 provider 已运行多久而主动终止执行。执行只在 provider/进程报告终态、用户或宿主明确取消、或进程实际丢失时结束；健康探针的单次请求超时仅用于诊断/启动探测，不能结束 provider。上游或 provider 返回的 `PROCESS_TIMEOUT` 只按真实失败事实保留，不由本地 watchdog 生成。
  - **范围边界**：只删除本地 provider elapsed-time termination；不改变 detail 最小输入、review 结果协议、材料身份、审查次数或用户可见的五阶段路径。
  - **依据**：D-017 经 2026-08-28 修订、PFACT-REV04。
  - **场景**：SCN-008、SCN-013。
  - **验收**：AC-REV-004。

### Skill 正式消费（SKL）

- **FR-SKL-001**：每个阶段声明的 Skill 必须能解析到恰好一个现有正式 consumer；consumer 要以 Skill identity 和当前 task、stage、material、snapshot 绑定验证其结果或负责材料。只有包存在、事件行存在或 monitoring 有记录，不算正式消费。
  - **范围边界**：映射收敛在现有声明和 handler 合同，不新增 handler 层、控制面或持久映射对象。
  - **依据**：D-006、PFACT-GOV06。
  - **场景**：SCN-009。
  - **验收**：AC-SKL-001。

- **FR-SKL-002**：缺少 consumer 是结构性执行错误，必须在执行前点名 Skill 和阶段；已触发却缺少其正式 handler 必需的结果、身份或材料，是受影响阶段结果的完整性错误，必须在该结果写入前失败。consumer 已真实运行但外部 review、测试或质量结果 unavailable 时，按原有质量语义记录 unavailable 或 incomplete，同任务仍可修复；未触发项保持 not_applicable，不得伪造 executed 或成功。
  - **范围边界**：结构性错误阻止错误的阶段结果写入，但不阻止同一任务修复；外部质量缺失不变成新的工作推进 Gate。
  - **依据**：D-002、D-006、PFACT-GOV06。
  - **场景**：SCN-009、SCN-010。
  - **验收**：AC-SKL-002。

## 6. 模块划分

### 任务启动

- **负责什么**：确认会话项目，建立或验证唯一任务 worktree，再开放正式阶段写入。
- **对外提供什么**：可验证的任务目录，或清楚且可重试的启动错误。
- **依赖谁**：当前会话项目上下文和真实 Git 项目。
- **测试边界**：开始成功、项目缺失、Git 失败、同任务重试、提交后复用。

### 材料编写与分析

- **负责什么**：用同一内容合同生产和读取当前材料，并执行唯一材料语义检查。
- **对外提供什么**：可直接消费的材料，或保存前的字段级错误。
- **依赖谁**：当前四材料和阶段身份。
- **测试边界**：真实模板往返、坏输入不落库、修正后重试。

### 审查输入

- **负责什么**：构造并预检 detail 最小输入，保留真实 transport 和 finding 事实，并确保 provider 无终态时最终返回已有超时事实。
- **对外提供什么**：完整当前决定的 advice-only 审查结果，或 provider 调用前的诊断。
- **依赖谁**：decision-log、当前待审说明和现有 review broker。
  - **测试边界**：最小输入成功、逐字段失败、不调用 provider、同任务重试、无探针 provider 长时间保持运行且不被本地计时器杀死；终态、取消和进程丢失仍能结束。

### Skill 消费

- **负责什么**：把声明 Skill 映射到现有正式 consumer 并验证实际消费结果。
- **对外提供什么**：completed、not_applicable、failed 或 unavailable 的真实阶段事实。
- **依赖谁**：阶段声明、manifest、当前材料和现有 handler。
- **测试边界**：成功消费、未触发、缺 consumer、handler 失败。

### 条件 UI 设计

- **负责什么**：在实质性 UI 改动时把当前设计做成可见、可确认、可继续修复的 build-spec 结果。
- **对外提供什么**：本地 HTML 原型、关键状态和当前版本确认事实；不提供生产页面。
- **依赖谁**：已有页面和数据结构、Design.md、Experience.md、当前 spec 及用户当前回复。
- **测试边界**：非 UI 不触发；UI 输入缺失、原型未展示、版本不匹配、外部设计未返回和当前版本批准均有真实状态。

## 7. 关键实体

- **当前材料**：
  - **定义**：decision-log.md、spec.md、plan.md、tasks.md 四份当前工作真相。
  - **字段和约束**：每份材料有唯一职责和当前内容身份；生产格式必须被正式 consumer 原样接受。
  - **关系**：上游决定约束下游材料；下游不得补上游方向。

- **任务工作区**：
  - **定义**：用户选定主项目旁、绑定唯一任务分支的 worktree。
  - **字段和约束**：项目、任务、路径、分支、Git common dir 和当前 HEAD 必须一致。
  - **关系**：正式阶段事件和材料只能绑定该工作区。

- **阶段事件**：
  - **定义**：一个已声明 step 或 Skill 的开始与终态事实。
  - **字段和约束**：任务、阶段、subject、顺序和依赖必须在写前成立。
  - **关系**：正式阶段结果消费当前 subject 的最新真实终态，旧失败事实只读保留。

- **detail 审查请求**：
  - **定义**：对当前决定和待审说明的一次 advice-only 请求。
  - **字段和约束**：顶层最小身份字段齐全；materials 只含原始需求、完整当前决定和当前待审说明；生成字段由 runner 负责。
  - **关系**：结果是质量事实，不改变决定或成为推进许可证。

- **审查执行结果**：
  - **定义**：现有 broker 对一次 provider 执行返回的终态事实。
  - **字段和约束**：正常完成、provider 失败、输出无效和外部 `PROCESS_TIMEOUT` 必须保持原有错误语义；本地不生成按时长结束的结果，任何失败不得携带可被当作语义结论的 findings。
  - **关系**：WorkflowHub 只消费 broker 的最终结果；provider 生命周期不在 WorkflowHub 再复制。

- **Skill 消费绑定**：
  - **定义**：声明 Skill 与现有正式 handler 的唯一语义消费关系。
  - **字段和约束**：同一阶段内一项声明只对应一个 consumer，身份绑定当前 task、stage、material、snapshot。
  - **关系**：consumer 验证结果或负责材料；monitoring 仅报告事实。

- **UI 设计版本**：
  - **定义**：一次绑定当前输入的本地 HTML 原型或外部设计返回物。
  - **字段和约束**：页面/区域、交互流程、可见标签、状态、响应式和无障碍意图，以及当前 spec、Design.md、Experience.md 和页面数据输入的版本绑定；展示记录必须早于用户回复。
  - **关系**：由 build-spec 产生，plan-design-review 检查；当前用户批准只确认这一版本，不改变 spec.md 的唯一权威地位。

## 8. 数据和生命周期

- **数据粒度**：四份当前材料各代表同一任务的一份当前真相；事件、审查、测试和分析各代表一次不可变事实。
- **数据时效**：当前材料改变后，新质量事实必须绑定新材料和当前工作区；旧事实变为历史，不冒充当前。
- **缺失或迟到**：缺输入、consumer 或外部结果时明确记录 missing、unavailable 或 incomplete；不补写成功。
- **provider 无终态**：provider 没有健康探针、终态输出或可验证进展时，broker 不按时长自动结束；保持运行直到真实终态、取消或进程丢失。上游已返回的 `PROCESS_TIMEOUT` 仍原样记录，不能改写为通过或空 findings。
- **预览与正式**：草稿材料可继续修；UI 设计先展示当前原型或外部返回物，只有正式 handler 接受并绑定当前身份、输入版本和当前用户回复后，才可声明相应设计事实完成。
- **当前与历史**：材料在同一文件修订；不可变事实累加。正式当前结果使用最新有效尝试，不覆盖历史；前三阶段审查每次只审当前输入，不自动复用旧结果。
- **当前投影与重跑**：原始事件按写入顺序永久保留；当前投影先按阶段清单识别最早未完成或正在重跑的阶段，再取该起点及其之前的当前有效终态，起点之后的旧事件不进入本次投影。墙上时钟回拨或事件时间相同不改变顺序；每次正式重跑使用新的 attempt 身份。任务分支领先主项目、旧失败已存在或主项目有用户独立变化，都按真实当前工作区和新增 delta 判断，不得当作旧结果或过期。
- **归属与清理**：四材料归各自阶段 owner；质量事实归现有事实库。旧记录只读，不新增 latest 指针或清理流程。

## 9. 兼容性预留

- **既有消费方**：继续使用五阶段、四材料、现有 public runtime 和现有 handler；已归档记录和旧审查只读。
- **命名预留**：只统一当前正式语法和已有最小输入名称，不建立永久别名集。
- **容器预留**：不新增 envelope、第五材料、第二套状态或持久映射对象。
- **状态预留**：继续使用 completed、failed、not_applicable、unavailable、incomplete 等现有真实状态，不发明“兼容成功”。
- **审查终止预留**：不新增本地 provider elapsed-time timeout；继续使用已有 `PROCESS_TIMEOUT` 表示 provider/上游真实失败事实，不新增 WorkflowHub 外层超时状态或第二套生命周期。
- **扩展边界**：本期只保证当前官方模板、正式 consumer 和条件 UI 设计证据闭合；未来新增语法、Skill 或设计输入必须先声明唯一 consumer 和删除条件。

## 10. 明确不做与默认必须成立

### 明确不做

- 不重做已归档的 UI/fullstack contract；不做产品 UI、前端业务、真实浏览器 QA 或下游产品验收。本期只定义 UI 任务在 build-spec 的条件设计治理。来源：R-006、R-007、D-006、D-010、D-013。
- 不新增阶段、公共命令、Runner、持久任务对象、第五份核心材料、第二套状态机、永久兼容桥或硬性质量关卡。来源：R-002、R-003、D-002、D-009。
- 不改写历史事件、review 或失败事实，不把 unavailable、missing、incomplete 变成通过。来源：R-001、D-002。
- 不自动安装依赖，不处理旧 Git 对象 gc 告警，不重开归档任务。来源：DEFER-001 至 DEFER-003。
- 不在 WorkflowHub 复制 provider 轮询、终止或 fallback；本地 broker 也不增加 provider elapsed-time timeout；不借本次修复清理 v3、`material_id`、`semantic_hash` 或其他历史复杂度。来源：D-017 及 2026-08-28 修订。
- 不在 build-spec 决定具体代码文件、函数、接口传递方式、测试命令或实施顺序；这些属于 build-plan。
- 不删除人类确认等原有生命周期事实；“唯一 stage-end”只指唯一材料语义检查。

### 默认必须成立

- 用户只需理解五个正常阶段；内部身份和字段由系统在入口验证。关联 FR-GOV-001、AC-GOV-001。
- 每个错误在最早拥有足够事实的入口失败，并给出可行动原因。关联 FR-MAT-002、FR-START-003、FR-EVT-001、FR-REV-002、FR-SKL-002。
- 同一任务修复不创建替代任务、恢复阶段或历史改写。关联 FR-START-003、AC-START-003。
- 实质性 UI 改动未绑定当前设计版本并获当前用户批准时，不进入下一阶段；非 UI 或轻微修正不被该条件阻塞。关联 FR-UI-001、FR-UI-003、AC-UI-001、AC-UI-003。
- 本任务的代码、现有文档改动和提交继续逐项由用户确认；这不是普通 WorkflowHub 任务的新阶段。关联 FR-GOV-001、AC-GOV-001。

## 11. 验收标准

- [ ] **AC-GOV-001**：用户流程保持五阶段
  场景：用户从选定项目开始并查看完整任务流程。
  验证：公开流程只出现 make-decision、build-spec、build-plan、build-code、verify-code，内部动作不要求用户单独操作；核对 make-decision 的真实 Talk 和 decision-log.md。
  通过：没有新增第六阶段、公共入口或常驻审批步骤；Talk 用大白话覆盖流程、页面范围、数据状态、成功/失败、非目标和延期交接，未调用 Clarify、未虚构回复，且 decision-log.md 保存原始需求、事实、选择、理由、风险和延期交接；本任务的逐项确认保持任务内约束。
  失败：用户必须学习或操作新的阶段、Runner、恢复流程或持久对象才能继续，或 Talk/decision-log 缺少上述内容。
  证据类型：evidence。

- [ ] **AC-UI-001**：只在实质性 UI 改动时进入设计路径
  - **需求**：FR-UI-001
  - **场景**：SCN-001、SCN-011、SCN-012。
  验证：分别提交新增页面、明显布局/交互/状态/响应式变化，以及文字或局部样式修正，观察 build-spec 的路径和用户可见结果。
  - **通过条件**：前两类进入条件设计路径并保留当前设计状态；后一类记录不适用并继续普通规格路径；没有新增用户阶段。
  - **失败条件**：轻微修正被无故阻塞、实质性改动跳过设计，或用户必须操作新的公共流程才能继续。
  - **证据类型**：test。

- [ ] **AC-UI-002**：本地原型覆盖真实输入和关键状态
  - **需求**：FR-UI-002
  - **场景**：SCN-011。
  验证：检查当前 UI 任务的原型展示和其输入绑定，覆盖已有页面/数据/设计规范、页面区域、交互流程、可见标签、关键状态、三种宽度、响应式和无障碍意图。
  - **通过条件**：原型可在本地展示且绑定当前输入；缺失输入显示真实 unknown、unavailable 或 N/A 原因；原型没有冒充生产实现或浏览器验收。
  - **失败条件**：只给抽象文字、使用虚构数据、遗漏关键状态或宽度、把文件存在当作设计完成，或要求用户先猜内部字段。
  - **证据类型**：evidence。

- [ ] **AC-UI-003**：当前设计批准绑定当前版本
  - **需求**：FR-UI-003
  - **场景**：SCN-011、SCN-012。
  验证：依次观察原型展示、用户批准、要求修改、外部设计未返回和输入版本变化后的 build-spec 状态。
  - **通过条件**：展示先于回复；适用性、当前输入 ref/hash/revision、原型或外部返回物 ref/hash/revision、展示事件、用户回复和批准绑定摘要均能互相核对；只有当前版本的明确批准才允许继续；修改、未返回、版本不匹配或未批准保持真实风险并可在同一任务修复；spec.md 仍是唯一产品权威。
  - **失败条件**：旧回复或旧设计冒充当前批准、未展示就接受回复、输入或原型变化后仍显示已定稿、缺失输入被写成完成，或新增第五份需求材料。
  - **证据类型**：test。

- [ ] **AC-UI-004**：非 UI 任务不承担设计负担
  - **需求**：FR-UI-001
  - **场景**：SCN-001、SCN-012。
  验证：运行不涉及产品页面的治理任务，并检查阶段路径、材料和质量事实。
  - **通过条件**：UI 设计依赖记录 not_applicable 及原因，五阶段和四份材料不变，任务不因缺少产品设计文件而阻塞。
  - **失败条件**：非 UI 任务被要求生成原型、等待外部设计，或被新增的 UI 状态机、阶段和材料阻塞。
  - **证据类型**：test。

- [ ] **AC-MAT-001**：真实生产物原样通过正式 consumer
  场景：分别使用官方 spec、analysis 和 tasks 生产路径生成完整非空材料，再交给唯一正式 parser 或 handler。
  验证：比较真实生产输出与正式消费结果，不允许测试或主 Agent 手工改标题、标签、状态、oracle 或失败条件。
  通过：三类真实输出均被原样接受，且同一格式错误在生产侧和消费侧得到一致结论。
  失败：任何输出需要 replace、补字段、改标题、别名桥或测试专用 fixture 才能通过。
  证据类型：test。

- [ ] **AC-MAT-002**：坏的 spec-analyze 输入不落库
  场景：依次提交缺 packet、缺 evidence subjects、错误任务、错误阶段、旧材料或字段类型错误的分析输入。
  验证：观察正式记录入口的返回错误和当前记录内容。
  通过：每种错误在保存前点名字段或身份；当前记录未改变；修正后同一任务可成功记录。
  失败：坏对象被保存、错误只在 public run 暴露、诊断要求用户猜内部字段，或修复后必须新建任务。
  证据类型：test。

- [ ] **AC-MAT-003**：每个编写阶段只有一个材料语义结束检查
  场景：make-decision、build-spec、build-plan、build-code 四个编写阶段分别得到一致、不一致和审查建议缺失的组合，并在 make-decision 范围修订后重跑。
  验证：逐阶段核对“当前输入—唯一检查—结果状态—正式交接”映射，以及事件追加顺序、当前材料 revision 和旧后续事件的处理。
  通过：四个阶段分别只检查本阶段列明的当前材料，由同一个 spec-analyze owner 各执行一次；每次只返回 consistent、inconsistent 或 material_incomplete；只有同一 task、当前 revision 的最新 completed 结果可交给下游，范围修订后的新结果完成前保持进行中；审查建议不成为第二个语义 gate，旧失败和旧后续事件只读保留；verify-code 不重复此检查，人类确认和其他原有事实仍按自身职责报告。
  失败：多个机制重复裁决材料语义、旧完成结果冒充新交接、回退或重复事件改变当前投影、建议缺失阻止同任务修复，或为了“唯一”删除原有确认与质量事实。
  证据类型：test。

- [ ] **AC-START-001**：worktree 成功后才正式开始
  场景：分别使用唯一有效项目、缺失项目、冲突项目、非 Git 项目和不可读 Git 项目开始 make-decision。
  验证：观察任务 worktree、第一条正式事件和第一份材料的先后关系。
  通过：有效项目先在主项目旁得到唯一 worktree；其他情况在任何正式事件或材料写入前失败并说明原因。
  失败：任务显示已开始但目录不存在、使用 cwd 或临时 checkout 猜项目、或失败后留下被当成成功的任务目录。
  证据类型：test。

- [ ] **AC-START-002**：任务提交后复用同一 worktree
  场景：任务 worktree 创建后产生自己的提交，主项目同时保持原提交或产生独立变化，再次进入同一任务。
  验证：比较前后 worktree 路径、目录身份、任务分支、Git 注册、common dir、任务 HEAD 和主项目状态。
  通过：所有工作区身份保持一致，当前基准等于任务 HEAD；以进入操作前记录的主项目 commit 和 status 为基线，系统造成的 delta 为空，用户预先存在的独立变化保持原样。
  失败：因任务领先主项目而拒绝、创建第二目录、退回旧基线、切成 detached 状态或改动主项目。
  证据类型：test。

- [ ] **AC-START-003**：启动错误可在同一任务修复
  场景：先制造项目、Git、路径、分支或 worktree 错误，或让 make-decision 阶段末检查失败，再修复真实原因并重试。
  验证：观察旧失败事实、任务身份、工作区、当前阶段结果和下游交接。
  通过：错误包含真实原因和动作；旧失败只读保留；修复后同一任务以新当前结果继续，make-decision 的新阶段结果和确认正式完成前，build-spec 不消费旧结果。
  失败：错误被兜底隐藏、失败事实被改写、旧完成结果冒充新交接、需要 recovery 阶段或必须创建新任务。
  证据类型：test。

- [ ] **AC-EVT-001**：错误事件在写入前失败
  场景：提交未声明 subject、错误任务、错误阶段、错误顺序、未满足依赖、阶段回退或重复顺序的事件，并覆盖时间戳回退和任务分支领先主项目的重跑。
  验证：比较失败前后的原始事件序列与当前投影。
  通过：每种错误点名 subject 或身份；事件序列字节不变；当前投影按追加顺序和阶段清单顺序取新的重跑起点，不把旧后续事件带入；正确事件随后可在同一任务写入，任务分支领先主项目不被误报为过期。
  失败：无效事件先写后报错、错误到发布才暴露、墙上时钟改变新旧判断、旧后续阻断重跑，或正确重试被旧错误阻断。
  证据类型：test。

- [ ] **AC-REV-001**：detail 最小输入有官方正常路径
  场景：调用方只提供任务身份、detail track，以及原始需求、完整当前决定和当前待审说明。
  验证：观察入口接受的字段、冻结 packet 和 provider 收到的当前材料。
  通过：最小输入可直接运行；完整决定包含理由、风险和 Grill；生成指令由 runner 提供；可选 map 缺失不阻止调用。
  失败：调用方必须猜 review instructions、内部 map、压缩决定或第二份决定材料才能运行。
  证据类型：test。

- [ ] **AC-REV-002**：detail 字段错误在 provider 前诊断
  场景：逐一提交 missing、empty、forbidden、type、identity 和 freshness 错误，再修正输入。
  验证：观察字段级错误、provider 调用次数、unavailable 事实和重试结果。
  通过：错误逐字段报告且 provider 未被调用；失败事实保留；修正后同一任务成功。
  失败：runner 静默覆盖 caller 禁止字段、调用 provider 后才失败、把 unavailable 当空 findings，或自行 fallback。
  证据类型：test。

- [ ] **AC-REV-003**：前三阶段每次只审当前输入
  - **需求**：FR-REV-003
  - **场景**：SCN-008、SCN-010。
  验证：在 make-decision、build-spec 和 build-plan 中分别重复执行同一阶段，并比较每次输入、尝试身份和历史结果。
  - **通过条件**：每次实际执行只产生一次当前输入的审查；旧结果保留为历史但不被自动选用；修复后同一任务可用新结果继续。
  - **失败条件**：旧范围结果被自动复用、同次执行重复调用或因旧 attempt 身份冲突无法继续。
  - **证据类型**：test。

- [ ] **AC-REV-004**：provider 执行没有本地 elapsed-time 终止
  - **需求**：FR-REV-004
  - **场景**：SCN-008、SCN-013。
  - **验证**：使用没有健康探针、持续运行且不产生终态输出的 provider 测试替身，让假时钟超过历史 15 分钟阈值，观察 broker 是否仍不因时长终止；同时验证 provider/进程终态、明确取消、进程丢失、provider 自身失败和输出无效仍保持原有语义。
  - **通过条件**：本地 broker、process、health-runner 和 WorkflowHub 不因 elapsed time/no-progress 自动终止 provider；真实终态、取消或进程丢失能结束调用；外部 `PROCESS_TIMEOUT` 及其他失败事实保留，不能伪造 findings 或通过。
  - **失败条件**：任一本地层按时长自动杀死 provider、另建外层超时、或把外部失败写成空 findings/通过；正常 provider 行为被改变。
  - **证据类型**：test。

- [ ] **AC-SKL-001**：每个声明 Skill 有唯一正式 consumer
  场景：对五阶段所有声明 Skill 做 consumer census，并选择一个真实触发项执行到正式 handler。
  验证：逐项核对声明、唯一 consumer、当前身份绑定和实际消费结果。
  通过：每项恰好一个现有 consumer；真实触发项的结果或负责材料被语义验证；仅 package、事件或 monitoring 不被误算。
  失败：任一 Skill 无 consumer、有多个 consumer、只记录 executed 却无人读取，或消费旧任务/旧材料结果。
  证据类型：test。

- [ ] **AC-SKL-002**：Skill 缺失和失败语义真实
  场景：分别制造缺 consumer、未触发、触发但缺结果、结果无效和 handler 失败。
  验证：观察执行前检查、发布前错误、阶段事实和同任务重试。
  通过：缺 consumer 在执行前点名；触发项缺正式结果或身份时不写错误阶段结果；未触发为 not_applicable；consumer 已运行但外部质量 unavailable 时如实记录且同任务可修；修正后可继续。
  失败：自动补 unavailable 冒充正式消费、伪造 executed、吞掉结构性 handler 错误、把外部质量不可用误写成结构成功，或把质量缺失变成新的恢复流程。
  证据类型：test。

## 12. 风险、未决与交接

- **RISK-GOV-001**：为解决内部不一致又增加控制流程
  - **受影响 ID**：FR-GOV-001、FR-MAT-003、FR-SKL-001、AC-GOV-001。
  - **触发条件**：方案新增公共命令、长期对象、第二状态机、通用转换层或恢复阶段。
  - **后果**：用户继续面对黑话和阻塞，维护面扩大。
  - **缓解或 STOP**：优先删除冲突规则、复用现有入口；必须新增上述能力时停止并回到 make-decision。
  - **处理 Stage**：build-plan。
  - **验证**：每个计划项能追溯到本规格且没有新增用户步骤。

- **RISK-GOV-002**：会话项目上下文和旧启动文档仍可能冲突
  - **受影响 ID**：PFACT-GOV08、FR-START-001、AC-START-001。
  - **触发条件**：实现继续从 cwd 推断项目，或旧文档仍写成先开始后建 worktree。
  - **后果**：任务再次落错位置或出现假开始。
  - **缓解或 STOP**：build-plan 只选择现有宿主项目上下文到现有启动入口的最短路径，并列出最小文档同步；不得猜 cwd。
  - **处理 Stage**：build-plan。
  - **验证**：计划包含唯一输入来源、早失败和旧文字替换范围。

- **RISK-GOV-003**：同一会话修复后可能复用旧不可变尝试身份
  - **受影响 ID**：FR-START-003、FR-REV-002、FR-SKL-002、AC-START-003。
  - **触发条件**：当前材料或事实修复后，正式重跑仍选择旧 attempt。
  - **后果**：不可变写入产生 replay conflict，用户误以为同任务不能继续。
  - **缓解或 STOP**：在现有 run 语义内为真实新尝试使用新身份，旧结果只读保留；不新增 recovery 对象。
  - **处理 Stage**：build-plan。
  - **验证**：SCN-010 的新旧尝试均可验证且互不覆盖。

- **RISK-GOV-004**：具体 UI 任务缺少可读取的设计或数据来源
  - **受影响 ID**：PFACT-UI02、FR-UI-002、AC-UI-002。
  - **触发条件**：页面、真实数据结构、Design.md、Experience.md 或当前 spec 缺失、过期或不可绑定。
  - **后果**：原型可能无法忠实表达页面状态，用户会在 build-code 才发现返工风险。
  - **缓解或 STOP**：对适用性、spec、Design、Experience、页面和数据输入逐项记录 ref/hash/revision；缺失来源和原因保持 unknown/unavailable，不把猜测当设计完成；需要改变方向时回到 make-decision。
  - **处理 Stage**：build-spec。
  - **验证**：当前设计事实列出每个缺失来源及可行动的重新读取或外部设计动作。

- **RISK-GOV-005**：设计批准与当前输入版本脱节
  - **受影响 ID**：PFACT-UI03、FR-UI-003、AC-UI-003。
  - **触发条件**：spec、设计规范、交互规范、页面数据或原型改变后仍沿用旧回复或旧设计。
  - **后果**：用户以为已定稿，实际实现依据已经变化。
  - **缓解或 STOP**：输入或原型变化即使旧批准失效；重新记录展示事件，绑定展示后的用户回复、输入摘要和原型 hash，再等待当前用户回复，不新增替代材料或恢复流程。
  - **处理 Stage**：build-spec。
  - **验证**：当前批准同时绑定展示事实和所有当前输入版本。

- **RISK-GOV-006**：上游 provider 可能无终态或在本地之外提前断开
  - **受影响 ID**：PFACT-REV04、FR-REV-004、AC-REV-004。
  - **触发条件**：无健康探针、无终态输出或无可验证进展的 provider 持续运行，且 broker 只等待自然退出。
  - **后果**：用户可能长时间等待，或收到 OpenCode Go/Zen 的 `SESSION_IDLE_WITHOUT_TERMINAL`/`PROCESS_TIMEOUT`，本地仓库无法修复远端服务边界。
  - **缓解或 STOP**：本地不添加误杀性的 elapsed-time deadline；保留真实 unavailable/失败事实，明确取消仍可结束。若要修复约 120 秒远端边界，延期到上游服务/路由或已验证的直连 provider；若实现需要新增公开状态、协议或生命周期对象，停止并回到 make-decision。
  - **处理 Stage**：build-plan。
  - **验证**：无探针测试替身在超过历史阈值后仍可等待真实终态；取消、进程丢失和外部失败事实保持原语义。

- **OPEN-GOV-001**：会话项目上下文进入现有启动入口的最小接口
  - **受影响 ID**：PFACT-GOV08、FR-START-001、AC-START-001。
  - **owner**：build-plan。
  - **影响**：若不闭合，系统仍可能猜路径或无法在正式开始前建 worktree。
  - **处理 Stage**：build-plan。
  - **关闭条件或 STOP**：明确一个已有宿主输入到现有 bootstrap/workspace 准备的直接连接；若需要新公共命令、持久对象或 cwd fallback，停止并回报用户。

- **OPEN-GOV-002**：Skill 声明到现有 consumer 的最小映射位置
  - **受影响 ID**：FR-SKL-001、FR-SKL-002、AC-SKL-001、AC-SKL-002。
  - **owner**：build-plan。
  - **影响**：若不明确，声明存在仍不能证明正式消费。
  - **处理 Stage**：build-plan。
  - **关闭条件或 STOP**：consumer census 完成，映射落在一个现有声明或 handler 合同中；若需要新控制面或持久映射表，停止并回报用户。

- **OPEN-GOV-003**：detail 完整决定在现有最小输入中的唯一绑定方式
  - **受影响 ID**：FR-REV-001、AC-REV-001。
  - **owner**：build-plan。
  - **影响**：若继续传压缩摘要，detail 会丢失理由、风险和 Grill。
  - **处理 Stage**：build-plan。
  - **关闭条件或 STOP**：现有 detail materials 中只有一个字段绑定完整当前 decision-log bytes；不复制第二份决定，不增加新命令。

- **OPEN-GOV-004**：provider 本地无 elapsed-time deadline（已关闭）
  - **受影响 ID**：FR-REV-004、AC-REV-004、RISK-GOV-006。
  - **owner**：build-plan。
  - **影响**：不再选择本地总时长；远端服务仍可能有本地无法控制的边界。
  - **处理 Stage**：build-plan。
  - **关闭条件或 STOP**：已由 2026-08-28 用户指示关闭本地 elapsed-time 期限；只保留取消、终态、进程丢失和单次健康探测保护。上游修复另行延期，不在本任务增加配置面。

### 当前延期与未决交接索引

下面的索引只是把 decision-log 已记录的延期和未决事项原样带入当前 spec，方便后续阶段逐项交接；它不新增材料或流程。

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
| OPEN-007 | build-plan | provider 默认期限与终止宽限期 | 现有 broker | 统一取值并通过无终态测试；不得新增状态或配置面 |

### 独立审查处置

- **F-17ec879d7e51**：fixed。FR-REV-001/002 已补完整 decision-log bytes 绑定、顶层字段、materials 必填、可选/禁止字段，以及六类逐字段诊断范围。
- **F-34e0607bbc5b**：fixed。PFACT-GOV02、GOV04、GOV05、GOV06 已改为 inferred，并写明 packet 外证据限制和后续核实方式。
- **F-36c311c1cc1b**：fixed。FR-MAT-003/AC-MAT-003 已明确唯一 owner 是 spec-analyze，每个编写阶段只执行一次本阶段 profile。
- **F-59418d6bcfd0**：fixed。FR-SKL-002/AC-SKL-002 已区分结构性执行错误与外部质量 unavailable。
- **F-984e90e4ca61**：fixed。来源映射后新增 locked、unresolved、newly discovered ambiguity 状态，并把 D-008 绑定到启动验收。
- **F-bf496c1c39d3**：fixed。AC-START-002 改为比较系统造成的主项目 delta，允许用户预先存在的独立变化保持原样。
- **F-fd244bdf2d11**：fixed。FR-MAT-001 已按三类 producer/consumer 补输入、输出、必填内容、身份锚点和往返行为。
- **F-00b3dce35440**：fixed。SCN-001、FR-GOV-001 和 AC-GOV-001 已补大白话 Talk 的六项覆盖、禁止 Clarify、禁止虚构回复，以及 decision-log 必须保存的原始需求、事实、选择、理由、风险和延期交接。
- **F-0acf17e7ad88**：fixed。FR-MAT-003 和 AC-MAT-003 已列出四个编写阶段的当前输入、唯一材料检查、结果状态和 verify-code 不适用边界。
- **F-0b9f83a6e949**：fixed。FR-UI-003、AC-UI-003 和 RISK-GOV-004/005 已补适用性、输入与设计版本、展示事件、用户回复和批准绑定；输入或原型变化会使旧批准失效。
- **F-5c6e9c86e5d3**：fixed。FR-MAT-003、AC-MAT-003、FR-START-003、AC-START-003 和 SCN-010 已规定范围修订重跑须产生新的正式当前结果，旧完成结果不能冒充下游交接。
- **F-942bf47abf83**：fixed。FR-EVT-001、AC-EVT-001 和 SCN-010 已规定原始事件追加保留、按阶段清单和追加顺序形成当前投影、旧后续不带入、时间回拨不改新旧判断，以及每次重跑使用新 attempt 身份。

- **DEFER-GOV-001**：旧 Git 对象自动 gc 告警；owner=本机环境维护；trigger=用户单独要求维护；consumer=本机 Git；close=对象库清理验证完成。
- **DEFER-GOV-002**：已归档 UI/fullstack contract；owner=归档任务；trigger=独立重开；consumer=原归档任务；retain=本任务永久不处理。
- **DEFER-GOV-003**：自动安装依赖；owner=环境准备；trigger=用户另行批准；consumer=本机运行环境；retain=本任务不实施。
- **DEFER-GOV-004**：任何需要新阶段、长期对象或兼容层的候选修复；owner=make-decision；trigger=现有能力无法满足且用户愿意扩大范围；consumer=未来独立决定；retain=当前任务停止并说明。

## 13. 业务影响与回归范围

### WorkflowHub 五阶段默认路径

- **既有行为**：用户能够启动五阶段，但内部格式、目录准备、审查输入和 Skill 消费可能在较晚位置失败。
- **本需求影响**：用户仍走同样五阶段；成功路径更直接，错误更早且可修复。
- **回归路径**：选定项目 → 创建任务 worktree → make-decision → build-spec → build-plan → build-code → verify-code；每阶段材料与正式 handler 使用当前任务身份。
- **验收**：AC-GOV-001、AC-MAT-001、AC-START-001、AC-SKL-001。

### 同任务修复

- **既有行为**：部分修复后重跑会因旧基线或旧尝试身份冲突而失败。
- **本需求影响**：旧失败事实保留，修正后的新尝试继续同一任务和 worktree。
- **回归路径**：制造真实失败 → 修正输入或环境 → 原任务重试 → 验证新旧事实互不覆盖。
- **验收**：AC-MAT-002、AC-START-003、AC-EVT-001、AC-REV-002、AC-SKL-002。

### 条件 UI 设计路径

- **既有行为**：UI 任务可能只完成文字规格或文件检查，没有展示绑定当前数据和规范的设计，直到编码阶段才暴露返工。
- **本需求影响**：实质性 UI 改动在 build-spec 先展示本地 HTML 原型；用户不满意时可在同一任务修改或使用外部设计提示词，非 UI 任务不受影响。
- **回归路径**：判断 UI 适用性 → 读取已有页面/数据/规范 → 展示当前原型和关键状态 → 用户批准或要求修改 → 绑定当前版本后交给 build-plan。
- **验收**：AC-UI-001、AC-UI-002、AC-UI-003、AC-UI-004。

### 审查 provider 无终态

- **既有行为**：provider 没有健康探针或终态输出时可能一直等待，OpenCode Go/Zen 还可能在远端约 120 秒后不返回。
- **本需求影响**：本地审查 broker 不再按总时长结束 provider；WorkflowHub 不增加第二套超时或用户步骤，真实上游失败保持 unavailable。
- **回归路径**：无终态 provider → 本地保持运行 → provider/进程终态、取消或丢失时结束；外部 `PROCESS_TIMEOUT`、正常完成、provider 自身失败和输出无效保持原有语义。
- **验收**：AC-REV-004。

- **可能受冲击的业务规则**：四材料唯一职责、不可变事实、当前任务身份、审查 advice-only、质量缺失不伪装为通过。
- **明确无影响**：产品 UI 实现、前端业务、真实浏览器 QA、下游产品验收、归档任务、主项目业务功能；本规格只约束 UI 任务的 build-spec 设计证据路径。
