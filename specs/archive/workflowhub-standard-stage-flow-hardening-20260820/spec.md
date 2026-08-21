# 功能规格：WorkflowHub 标准五阶段执行与安全收口

## 速读卡（30 秒）

WorkflowHub 必须让一个任务从原始需求、决定、规格、计划、实现、验证到 close 始终使用同一组当前材料和当前事实。用户可以在同一任务里持续修复任何缺口，但只有当前阶段声明的 step、skill、核心产物、质量检查、审查处置和确认都真实闭合时，才能显示该阶段完成。正常 close 只汇总已经闭合的五阶段、产品发布和物理交付事实，不替前面补质量作业。

## 1. 问题与紧迫性

现有 WorkflowHub 已有五阶段、四份当前材料、独立审查和质量技能，但“文档声明执行”与“生产路径证明执行”仍会脱节：真实 Talk 轮次可被误判成重复 skill，缺失或错误的阶段末检查可能仍产生成功结果，旧审查可能覆盖新材料，物理交付也可能被误读成产品完成。结果是需求在后续阶段才暴露遗漏、close 反复失败、用户无法判断任务究竟是可继续修复、质量未完成、未发布，还是只完成了 Git 动作。

本需求要修复的是同一条事实链，不是再增加一套流程，也不是再次全面重写审查提示词。

## 2. 背景、目标与范围

目标用户是提出需求并做业务确认的人，以及按标准 manifest 执行任务的 Stage Agent。runtime 只认证事实并派生状态；异源 reviewer 只给质量建议；close 执行器只处理经过单独授权的物理动作。

范围包括：

- 五阶段各自唯一职责、输入、步骤、skill、核心产物、阶段结果和下游消费。
- make-decision 的真实多轮 Talk、全需求 Grill、原始需求覆盖和最终确认。
- build-spec 的条件 Clarify、完整用户场景、状态、失败边界、FR 与 AC。
- build-plan 的需求到任务、测试、判定规则和证据映射。
- build-code 的实现、真实测试、逐 AC 结果和阶段末一致性检查。
- verify-code 的专用代码审查、异源审查、finding 处置、closure、handoff 和确认。
- 前四阶段的 spec-analyze 当前材料绑定、问题修复和完成消费。
- 当前 review 绑定、统一状态展示、五阶段完成后的正常 close 与风险交付。
- 三个历史失败模式、bundle 一致性和一个简单任务的确定性全链路合同回归；本任务不要求启动真实 Talk/Clarify 交互，但要对可安全执行的生产 stage、analyzer、review、status 和 close preflight 走真实入口；provider 可尝试，物理不可逆动作仍按授权边界执行，生产合同仍必须保留真实 Talk/Clarify 生命周期。

页面和入口只覆盖现有 host Talk/确认卡，以及现有 doctor、status、run、review、verify、confirm、authorize 输出和监控投影；不新增 Web 或 Workboard 页面。

来源覆盖：R-001 至 R-014 全部进入本规格；D-001 至 D-011 全部保持原产品方向，D-012 只修订本任务验收边界，D-013 把 `manual-close` 的物理动作语义落实到现有 close 执行链，不新增产品方向。

## 3. 用户场景与状态覆盖

### SCN-001：从原始需求完成真实决定

- **Given**：用户提交了包含目标、约束和质量要求的原始需求。
- **When**：Stage Agent 执行 make-decision。
- **Then**：用户经历真实多轮 Talk，看到大白话选项、后果与风险；decision-log 覆盖全部已登记需求并记录事实、选择、理由、延期、拒绝项和最终确认。

### SCN-002：把已决定方向编译为完整规格

- **Given**：make-decision 的当前决定已经取得真实确认。
- **When**：Stage Agent 执行 build-spec。
- **Then**：spec 覆盖完整用户流程、入口范围、状态、成功与失败边界、非目标、FR、AC 和可观察判定；Clarify 只处理规格歧义，不补产品方向。

### SCN-003：把规格变成无孤儿项的执行计划

- **Given**：当前 spec 已闭合产品语义。
- **When**：Stage Agent 执行 build-plan。
- **Then**：每条适用 FR 和 AC 都能追踪到阶段、任务、依赖、文件边界、测试角色、判定规则、证据位置和停止条件，不存在孤儿需求或孤儿任务。

### SCN-004：实现并证明每条适用验收

- **Given**：当前 plan 和 tasks 已被确认。
- **When**：Stage Agent 执行 build-code。
- **Then**：实现、测试、逐 AC 实际结果和集成审查绑定当前源码与材料；失败结果被如实保留并在当前阶段修复，未修完不发布完成。

### SCN-005：独立验证真实实现质量

- **Given**：build-code 已产出当前实现和证据。
- **When**：Stage Agent 执行 verify-code。
- **Then**：专用代码审查检查真实消费者、生命周期、安全、失败边界、测试强度和原始需求遗漏；异源 finding 被修复或由用户具体承担风险，closure 与 handoff 绑定当前快照。

### SCN-006：阶段末发现缺口并在同一阶段处理

- **Given**：前四阶段任一当前材料或结果存在确定性缺口。
- **When**：stage-end spec-analyze 返回 finding 或不一致。
- **Then**：任务保持可编辑和可调查，Stage Agent 修正当前材料或补足当前事实并重跑受影响检查；不创建 blocked、reopen 或 recovery 流程，未闭合前阶段保持 incomplete。

### SCN-007：用户中途改变产品方向

- **Given**：后续消息改变范围、页面或入口、数据、成功失败边界或验收含义。
- **When**：当前阶段识别到方向变化。
- **Then**：只暂停正式 publication，回到 make-decision 的 Talk、decision-log 和确认职责取得真实选择；受影响的下游材料和质量事实因当前材料变化而 stale，并在同一任务内重编。

### SCN-008：审查不可用或绑定旧快照

- **Given**：review provider 不可用，或 review 绑定的材料和当前材料不一致。
- **When**：用户查看阶段质量或尝试完成阶段。
- **Then**：系统保留原始 attempt 和 unavailable 或 stale 事实，允许继续修复，但不把 transport success、空 findings 或旧结论显示为通过。

### SCN-009：正常完成和授权 close

- **Given**：五阶段当前完成、逐 AC 产品结果通过且产品已发布。
- **When**：用户对明确列出的物理动作单独授权并执行 close。
- **Then**：系统逐项记录 commit、archive、merge、push、cleanup 的适用结果，并在全部适用事实成功后显示正常完成。

### SCN-010：风险交付或部分物理失败

- **Given**：质量未闭合、产品未发布，或某个物理动作失败。
- **When**：用户先以 `prepare --risk-close=true` 固化风险理由，再确认 close plan、逐项授权 commit/archive/merge/push/cleanup，最后执行 `manual-close`；或重试同一计划的剩余动作。
- **Then**：`manual-close` 必须执行同一份现有 delivery close plan 的真实物理动作，不得只写风险记录；已经发生的物理事实保持不变，只重试安全且未完成的动作。物理 delivery 完成后写 `manual-risk-close.v1`，但 stage quality 仍为 incomplete、product release 仍为 not_released、任务也不显示正常 completed；失败则保留逐项 operation facts，不产生正常完成记录。

### SCN-011：多个 Talk 轮次共享一个阶段 skill

- **Given**：make-decision 需要三轮真实 Talk，manifest 只声明一次 talk-with-zhipeng skill。
- **When**：每轮 ask、wait、reply、resume 都已完成并上报。
- **Then**：runtime 将其识别为一个 skill 的多轮交互生命周期，而不是重复启动；缺轮次、乱序、错绑或伪造回复仍然 fail-loud。

### SCN-012：现有入口解析同一套能力和状态

- **Given**：用户从 host、doctor、status、run、review、verify 或 close 观察同一任务。
- **When**：任一入口解析 skill bundle、当前材料和阶段状态。
- **Then**：所有入口得到相同的认证来源和派生结论；bundle 或合同 hash 不一致时在进入审查前明确失败。

### SCN-013：空输入与无适用动作

- **Given**：任务没有可登记的原始需求、review 返回空 findings，或 close 没有适用的物理动作。
- **When**：用户查看阶段和任务结果。
- **Then**：系统分别显示无有效需求、审查结果为空或动作 not_applicable；空值本身不推导 review 通过、产品发布或任务完成。

### SCN-014：运行中、取消与缺少确认

- **Given**：stage、review 或 close 正在运行，Talk/Clarify 被中断，用户拒绝业务确认，或某项物理动作未授权。
- **When**：用户查看状态或尝试继续 publication。
- **Then**：运行中只显示进行中；取消和未确认保持 incomplete；系统不推断回复、确认、授权或成功，未受影响的同任务修复仍可继续。

### SCN-015：材料变化与并发 publication

- **Given**：analyzer 或 review 运行期间当前材料发生变化，两个 publication 竞争，或 close 目标在授权后漂移。
- **When**：较旧结果或第二个写入尝试成为 current。
- **Then**：旧结果变 stale，冲突写入 fail-loud 且不留下部分 canonical 事实；close 目标漂移后必须重新 preflight 和授权。

### SCN-016：规格内容合同自身不能假绿

- **Given**：spec 缺章节、章节乱序、重复 ID、来源映射不完整、AC 缺失败条件，或从当前 spec 字节解析出的卡片互相矛盾。
- **When**：build-spec 尝试正式 publication。
- **Then**：production profile 必须逐卡检查并拒绝完成；不能只运行较弱的格式或最低 AC 检查来替代完整规格合同。

### SCN-017：只用键盘完成 Talk 与确认

- **Given**：用户通过现有 host 卡片回答 Talk、Clarify 或业务确认。
- **When**：用户只使用键盘浏览选项、提交、拒绝或取消，或提交了无效选择。
- **Then**：提示、选项和操作都有可辨识名称，初始焦点与顺序稳定；错误后焦点回到错误摘要或待修选项，系统不推断选择。

### SCN-018：从失败信息得到唯一下一步

- **Given**：当前事实为 stale、unavailable、conflicting、未确认、未授权、close 目标漂移或部分失败。
- **When**：用户从任一现有消费者查看结果。
- **Then**：输出说明失败原因、受影响视角、没有变化的事实、可安全重试范围和唯一下一步，并明确是否需要重跑、重新确认或重新授权。

### 状态覆盖

| 状态 | 工作是否继续 | 可否阶段完成 | 用户看到的结论 | 场景 |
| --- | --- | --- | --- | --- |
| 当前且一致 | 可以 | 可以 | 当前阶段完成 | SCN-001—005 |
| 材料或质量缺口 | 可以 | 不可以 | 可继续修复、阶段未完成 | SCN-006 |
| 方向变化 | 可以 | 暂不可以 | 正在重编当前材料 | SCN-007 |
| stale/conflicting | 可以调查 | 不可以 | 旧事实无效或事实冲突 | SCN-007—008 |
| analyzer/test/AC unavailable | 可以 | 不可以 | 自身质量事实不可用 | SCN-008 |
| 异源 review unavailable | 可以 | 由其他完成事实判断 | review 不可用、不得显示 pass | SCN-008 |
| released且交付成功 | 已完成 | 可以 | 产品与物理交付均完成 | SCN-009 |
| 风险或部分交付 | 可以重试 | 不可以 | 分层显示真实结果 | SCN-010 |
| 空值/不适用 | 视原因而定 | 不自动可以 | 空值不等于通过 | SCN-013 |
| 运行中/取消/未授权 | 未受影响部分可以 | 不可以 | 进行中或未确认 | SCN-014 |
| 并发或目标漂移 | 可以调查 | 不可以 | stale 或明确冲突 | SCN-015 |
| 交互错误 | 可以重答 | 不可以 | 聚焦错误与待选项 | SCN-017 |
| 可恢复失败 | 可以按提示修复 | 不可以 | 原因、范围和下一步 | SCN-018 |

## 4. 产品事实与假设（PFACT）

- **PFACT-01**：verified。vNext 当前工作真相只有认证 worktree 根目录的 decision-log、spec、plan、tasks 四份材料；旧材料与历史快照只读。来源：D-011；ADR 0014 只记录该决定，不作为本 PFACT 的独立来源。
- **PFACT-02**：verified。review、test、evidence 和 history 是质量事实，不是继续工作的许可证；缺失质量不能冒充完成。来源：宪法 F3、F4、F7、Q1、Q2。
- **PFACT-03**：verified。现有 runtime 由 Stage Agent 执行 skill，runtime 认证 outcome 并派生状态；不需要中央 dispatcher。来源：D-003。
- **PFACT-04**：verified。前四阶段使用 spec-analyze，verify-code 使用专用代码审查 closure。来源：D-008。
- **PFACT-05**：verified。基线生产路径未把缺失或错误的 stage-end analyzer 可靠纳入完成判据。来源：研究基线 65 项通过、3 项失败。
- **PFACT-06**：verified。portable wh-review bundle 在基线存在合同 hash 不一致，入口解析结果可能分叉。来源：研究基线 bundle smoke。
- **PFACT-07**：verified。三轮真实 Talk 在当前 make-decision 发布时被误判为同一 skill 重复启动，内容完成但正式 publication 失败。来源：当前任务 make-decision 发布失败事实。
- **PFACT-08**：verified。当前 stage profile 对原始需求全集、完整 FR/AC、Clarify、真实测试结果的内容检查深度不一致。来源：G-005 至 G-010。
- **PFACT-09**：verified。T01、F13、KD 三个历史任务分别保留了交付与质量混读、前置未闭合仍出现后置工作、不可用与未发布层级混读的真实失败模式。来源：D-002、研究基线。
- **PFACT-10**：verified。现有 public runtime 只有 doctor、status、run、review、verify、confirm、authorize 七类，不增加第八类入口。来源：宪法永久实施边界。
- **PFACT-11**：verified。正常 close 的质量判断只能读取五阶段和产品结果，不应首次执行 analyzer 或 review。来源：D-007、D-010。
- **PFACT-12**：verified。当前规格不存在需要用户再次选择的重大产品歧义；spec-clarify 已记录 trigger=false 及原因。来源：D-001 至 D-011 与 build-spec Clarify outcome。

## 5. 功能需求

- **FR-REQ-001**：`fact-collector.mjs` 只认证 host launcher 已登记消息的 launcher/session/task/stage/version、identity/order/hash 和消息覆盖，不理解自然语言、不生成需求语义。现有 make-decision/spec-analyze skill 在独立技能上下文中把 authenticated messages 分类为 `goal`、`flow_or_surface`、`data_or_state`、`success_failure_acceptance`、`constraint_non_goal_defer` 五类并派生候选轴；runtime 只验证 analyzer 输出逐条绑定 authenticated message 与 decision-log 的 R/D/FR/AC，并发现“整个消息类/轴无输出”或已有轴未处置。每个高/中影响轴必须已有选择，或记录不提问理由并绑定 D/FR/AC；每条需求只有 represented 或完整 explicitly_deferred 才能满足完成。只读投影不持久化原文、不成为第五份材料，也不新增模型调用通道。覆盖 R-001—R-013、D-009、SCN-001。
- **FR-INT-001**：make-decision 的 Talk 必须支持同一声明 skill 下的多轮 ask、wait、真实 reply、resume，并校验 round、card、prompt 与回复绑定；合法多轮不得被判为重复 skill。现有 transcript adapter 把每轮 lifecycle 写入同一个 content-addressed `receipts.interaction` aggregate（ref/hash、task、decision snapshot），正式 make-decision handler 读取该 receipt，并在接受 aggregate/发布 quality fact 前对其中每轮调用现有 `validateInteractionLifecycleContract()`；不得依赖被 runner 移除的 caller `stage_outcomes` 或 adapter 自报完成。覆盖 R-003、R-013、D-003、SCN-001、SCN-011。
- **FR-INT-002**：build-spec Clarify 必须记录真实触发和处置；有歧义时正式 publication 路径调用现有 interaction lifecycle 校验，无重大歧义时记录绑定当前 decision/spec identity 的 trigger=false、具体原因和无待决方向，不能伪装执行。覆盖 R-002、R-013、D-004、SCN-002。
- **FR-INT-003**：make-decision 的最终确认必须是绑定当前 task、stage、subject 与 material identity 的真实 ask、wait、reply、resume 事实；缺失、拒绝、过期、错绑或 unavailable 时禁止 make-decision completed 和把 handoff 声明为正式完成，但不得阻止 build-spec 读取当前材料、继续工作或回修。覆盖 R-001、R-004、D-003、D-009、SCN-001、SCN-014。
- **FR-INT-004**：make-decision、build-plan、verify-code 三处业务确认都必须复用现有 Human Confirmation Fact，绑定当前 task、stage、subject、material identity 和真实 ask、wait、reply、resume；各自的 completed、正式完成声明与 normal close 必须读取该事实。确认不是进入/继续工作的许可证，不得阻止下一阶段读取材料或同任务修复；系统也不得从文本、测试、review、授权或其他确认推断同意。覆盖 R-013、D-003、SCN-001、SCN-003、SCN-005、SCN-009、SCN-014。
- **FR-GRL-001**：Grill 必须先覆盖完整原始需求、用户旅程、状态、阶段、材料、审查、修复、close、验收、复杂度、非目标和延期，再检查专项；只检查 spec-analyze 或 review 细节不能算完成。覆盖 R-012、SCN-001。
- **FR-STG-001**：每个 stage 的正式 outcome 必须绑定当前 task、stage、材料 identity、快照、manifest step/skill、产物、质量、处置、确认和 handoff。上游 stage producer 是该 stage 当前认证的 completion/handoff，由下一 stage 的 completed publication 消费；task dependency producer 是 tasks.md 前置卡的 completed+evidence facts，只在后置卡声明 completed、正式 handoff 和 normal task completion 时消费。runtime 不接管代码执行或 work permission。覆盖 R-005、R-013、D-003、SCN-001—005。
- **FR-STG-002**：声明 step/skill 缺失、乱序、错证据、上游 stage 或 task 依赖未完成、旧材料或阶段末质量缺失时，系统允许同任务继续实现、测试并记录真实 implementation/失败/quality facts，但拒绝对应后置卡 completed、正式 handoff 和 normal task completion。stage outcome adapter 保留真实非完成事实，只保证它们不能被聚合成后置 completed publication；不新增 permit/gate/store。覆盖 R-005、R-013、D-003、D-010、SCN-006、SCN-011。
- **FR-STG-003**：身份、路径、hash、subject、snapshot 或 canonical write 冲突必须 fail-loud，且不得留下部分 canonical publication。覆盖 D-003、D-005、SCN-008、SCN-012。
- **FR-ANL-001**：make-decision stage-end spec-analyze 必须核对 host 验证投影、全部原始需求索引、decision-log、完整 Grill、当前审查处置和已绑定的真实最终确认。覆盖 R-011、D-008、D-009、SCN-001。
- **FR-ANL-002**：build-spec stage-end spec-analyze 必须核对 decision-log 与 spec 中的完整场景、页面或入口、状态、成功失败边界、FR、AC、oracle、Clarify outcome、非目标与延期。覆盖 R-002、R-011、D-008、SCN-002。
- **FR-ANL-003**：build-plan stage-end spec-analyze 必须使用现有深层完整性规则核对每条 FR、AC、任务、依赖、测试角色、判定规则、证据和停止条件，并拒绝孤儿项。覆盖 R-011、D-008、SCN-003。
- **FR-ANL-004**：build-code stage-end spec-analyze 必须从现有 current facts/evidence 中按 `task_id + AC id + material revision + snapshot tree + producer stage` 选择每条 AC 的唯一结果，并验证完整链 `source_id → decision_id → FR/AC → task → file/symbol → gate command/oracle → evidence ref/hash → review ref/hash → stage-end ref/hash`，以及 scenario、exit、actual、coverage limit、独立验证。零条为 missing，多条冲突为 conflicting，禁止按时间戳猜“最新”；复用现有 linked_ids/anchors/evidence_refs，只在内存派生，不新增 store。覆盖 R-005、R-011、R-013、D-008、SCN-004。
- **FR-ANL-005**：前四阶段的 finding 在当前阶段处理：`actionable + major|blocking` 只能 fixed，或由用户以绑定 finding、当前 snapshot 和具体风险的 accepted_risk 承担；deferred/not_applicable 只适用于真实延期、不适用或非 serious finding，并必须有 reason、owner、trigger、handoff、close condition。处理后重跑受影响 analyzer；旧 revision、unavailable、未处置和不完整处置均保持 incomplete，只有 current consistent 结果才能满足阶段完成。覆盖 R-011、D-010、SCN-006。
- **FR-REV-001**：每个 stage 的独立审查必须绑定当前 subject、材料和快照，检查本阶段核心产物的业务语义、原始需求、真实 consumer、生命周期、失败边界和验收判定。每个 finding 的处置只能复用 fixed、rejected_invalid、accepted_risk、needs_human，并绑定 finding、review 与 snapshot；fixed 必须有当前修复证据，accepted_risk 必须有当前用户对具体风险的确认。provider 真实 unavailable/timeout 表示审查步骤已真实尝试，必须显示 unavailable 而非 pass，但本身不作 provider 可用性 gate；已返回 finding 的证据不足仍保持 incomplete。覆盖 R-010、D-005、SCN-001—005、SCN-008。
- **FR-REV-002**：wh-review 只修复可复现的 bundle、绑定、finding 消费或具体语义漏检；provider unavailable、原始 verdict 和 usage 事实必须原样保留，不得用空 findings 或猜测数字替代。覆盖 D-005、SCN-008、SCN-012。
- **FR-CHG-001**：方向、范围、入口、数据、成功失败或验收变化必须在同一任务调用 make-decision 的 Talk、decision-log 和确认职责；普通实现细节留在当前阶段。覆盖 R-001、D-004、SCN-007。
- **FR-CHG-002**：当前材料变化必须使绑定旧 revision 的下游材料、analyzer、review、test 和 handoff 失效；系统只重编受影响材料，不创建 reopen、recovery、successor 或第二状态机。覆盖 R-008、R-009、D-004、D-010、D-011、SCN-007。
- **FR-STA-001**：host 与现有 public 输出必须从同一事实派生 work_progress、stage_quality、product_release、physical_delivery 四个视角，并明确“可继续修复”不等于“可声明完成”。覆盖 R-005、D-006、SCN-006、SCN-008—010、SCN-012。
- **FR-STA-002**：stage_quality 只在当前 stage outcome、适用 predicate、阶段末质量和处置全部闭合时完成，verify-code 还必须具备 FR-INT-004 的当前确认；同一 predicate 出现多个 current 事实时保持 conflicting/incomplete，verify-code completed 只能绑定无开放 finding 的 clean review。`completion-predicates.mjs` 新增唯一纯函数 `deriveProductRelease()`：只读消费五阶段 current completion、批准 spec 明确给出的完整适用 AC ID 集合及逐 AC product result 和 verify-code 当前确认；缺失、重复、意外、非 current 或未绑定输入均返回 `not_released`，延期/不适用项不被推测为通过。verify confirmation 必须是现有 `human-confirmation.v2`，绑定 task、verify-code、material revision、snapshot 和确认时间。该函数返回显式 `released/not_released` 及 input refs/reasons，不写新 fact/schema/store；close 和所有消费者只读取该派生结果。四视角均在该模块组装，消费者不各自重算。覆盖 R-013、D-003、D-007、SCN-009—010。
- **FR-STA-003**：空输入、空 findings、无适用动作、运行中、取消、未确认、未授权、并发写入和目标漂移必须有独立可观察语义，且均不得自动推导完成。覆盖 R-002、R-005、D-003、D-006、D-007、SCN-013—015。
- **FR-CLS-001**：`prepareDeliveryClosePlan()` 是 normal close 唯一 preflight reader，必须一次读取并绑定 task dependency、五阶段 current outcome/completion、逐 AC/test、current review、三处确认、product release、四材料 revision、snapshot、Git 基线、逐项授权目标和生成物 manifest；不在 close 首次执行 analyzer/review。generated manifest 只从当前 completed task cards 的 actual_changes 与其 current test/evidence refs 中派生，并与现有 known-generated 安全分类取交集后冻结在 prepared plan。`executeClosePlan()` 只能认证并消费该未漂移 plan，直接调用不得绕过 prepare。覆盖 R-005、R-013、D-007、SCN-009。
- **FR-CLS-002**：commit、archive、merge、push、cleanup 必须逐项复用现有 operation facts 保留真实结果；dirty 检查只放行可证明属于当前 task/owner 的路径，归属不明仍 fail-loud；cleanup 只处理 prepared manifest、当前 sidecar 与固定 allowlist。失败后只重试未完成且安全幂等的动作，目标漂移时重新 preflight 和授权，不新增 close FSM 或 recovery 命令。覆盖 R-005、R-013、D-007、SCN-010。
- **FR-CLS-003**：`manual-close` 是真实物理风险交付动作，不是只写状态的记录快捷方式。它只能消费带 `risk_close` 的已准备 plan，并在 close confirmation 和 commit/archive/merge/push/cleanup 独立授权齐全后，复用 normal close 的六个 delivery executor、逐项 operation facts、dirty-owner/allowlist 和安全重试；任何授权缺失、目标漂移或物理动作失败都 fail-loud 并保留已发生事实。风险交付可以使 physical_delivery 完成，但不能改变 stage_quality incomplete、product_release not_released 或顶层任务未完成；只允许写 `manual-risk-close.v1`，不得写 `task-close-completed.v1`。普通 `execute`/`complete` 不得消费 risk plan；风险记录 writer 还必须验证同一 prepared plan 的六项 operation facts，不能靠调用方自报物理完成。覆盖 R-005、R-014、D-007、D-013、SCN-010。
- **FR-REG-001**：回归必须固定 T01、F13、KD 三个只读历史快照，运行前后证明源未变化，并分别验证交付质量分层、前置未闭合的 publication 边界、unavailable 与 not_released 的真实语义。覆盖 R-006、D-002、SCN-006、SCN-008、SCN-010。
- **FR-REG-002**：必须在隔离临时 Node repo 运行固定确定性合同：为现有 `greet <name>` 增加 `--caps`，正常 `greet Hugh --caps` 输出 `HELLO, HUGH!`，非法 `--caps=maybe` 输出固定 stderr 且 exit `2`；Clarify 名字空格的 trim 语义、build-plan 首轮遗漏非法 flag 的 AC→task/gate 绑定及本阶段 analyzer 找出/修复/重跑由现有交互和 analyzer 合同验证，不启动真实 Talk/Clarify 回复。本任务还必须对可安全执行的生产 stage/outcome、前四 analyzer、review/status 消费和 close preflight/负例走真实入口验收；真实 provider 若尝试失败保持 unavailable，commit/merge/push/archive/cleanup 等不可逆动作未获授权不得执行。任何缺失或 unavailable 保持 incomplete，不能推导 released/completed。覆盖 R-006、R-007、R-013、D-001、D-002、D-012、SCN-001—010。
- **FR-CMP-001**：改动必须复用现有四材料、session event、stage outcome、quality facts、completion/status/close 和公共七入口；不得新增生产 schema、public command、store、FSM 或持久 projection。宪法 21 条逐条以真实适用性和证据核对，不能用不存在的条款或“测试绿”替代。覆盖 R-008—R-010、R-013、D-003、D-006、SCN-012。
- **FR-SPC-001**：build-spec 的正式生产 profile 必须直接从同一份当前 spec 字节解析并验证章节、逐卡 ID、来源映射、场景与 FR/AC/PFACT 引用闭包、PFACT 互斥状态、Clarify 和每条 AC 的失败条件。解析结果只是本次校验的只读内存视图，不持久化、不设 writer、不成为当前材料或第二规格权威。覆盖 R-005、R-011、D-008、SCN-002、SCN-016。
- **FR-UIX-001**：host、monitor、close 与七类 public 入口必须遵循同一信息层级：先给主结论，再给适用的四视角与 current 绑定，再给失败原因、唯一下一步和真实退出语义。覆盖 R-005、D-006、SCN-012、SCN-018。
- **FR-UIX-002**：现有 Talk、Clarify 和确认卡必须提供可辨识名称、稳定初始焦点、提示到选项再到提交/拒绝/取消的键盘顺序，以及无效输入后的焦点恢复；不得推断用户选择。覆盖 R-003、D-006、SCN-001、SCN-017。
- **FR-UIX-003**：stale、unavailable、conflicting、未确认、未授权、目标漂移和部分失败的所有现有消费者必须显示原因、受影响视角、未改变事实、可重试范围和下一动作。覆盖 R-005、D-006、D-007、SCN-008、SCN-010、SCN-018。

### 来源与决策映射

- R-001、D-001、D-004 → FR-CHG-001、FR-CHG-002、FR-STG-001 → AC-005、AC-013。
- R-002、D-006 → FR-INT-002、FR-STA-003 → AC-003、AC-020。
- R-003、D-003 → FR-INT-001、FR-STG-002 → AC-002、AC-005。
- R-004、D-009、D-011 → FR-REQ-001、FR-CHG-002 → AC-001、AC-013、AC-019。
- R-005、D-007、D-010 → FR-STG-001、FR-STG-002、FR-STG-003、FR-ANL-001、FR-ANL-002、FR-ANL-003、FR-ANL-004、FR-ANL-005、FR-CLS-001、FR-CLS-002、FR-CLS-003、FR-STA-001、FR-STA-002、FR-STA-003 → AC-005、AC-006、AC-007、AC-008、AC-009、AC-010、AC-014、AC-015、AC-016、AC-020。
- R-006、D-002、D-012 → FR-REG-001、FR-REG-002 → AC-017、AC-018。
- R-007、D-001 → FR-STG-001、FR-REG-002 → AC-005、AC-018。
- R-008、R-009、D-003、D-011 → FR-CMP-001、FR-CHG-002 → AC-019。
- R-010、D-005、D-008 → FR-REV-001、FR-REV-002、FR-ANL-001、FR-ANL-002、FR-ANL-003、FR-ANL-004、FR-ANL-005 → AC-006、AC-007、AC-008、AC-009、AC-010、AC-011、AC-012。
- R-011、D-008、D-010 → FR-ANL-001、FR-ANL-002、FR-ANL-003、FR-ANL-004、FR-ANL-005、FR-SPC-001 → AC-006、AC-007、AC-008、AC-009、AC-010、AC-021。
- R-012、D-005 → FR-GRL-001、FR-REV-001 → AC-004、AC-011。
- R-013、D-003、D-007、D-009 → FR-REQ-001、FR-INT-001、FR-INT-002、FR-INT-003、FR-INT-004、FR-STG-001、FR-STG-002、FR-ANL-004、FR-STA-002、FR-CLS-001、FR-CLS-002、FR-REG-002、FR-CMP-001 → AC-001、AC-002、AC-003、AC-005、AC-009、AC-015、AC-016、AC-018、AC-019、AC-025。
- R-014、D-013 → FR-CLS-003、FR-STA-002 → AC-016、AC-020、AC-025。
- R-003、D-006 → FR-UIX-002 → AC-023。
- R-005、D-006、D-007 → FR-UIX-001、FR-UIX-003 → AC-022、AC-024。
- R-001、R-004、D-003、D-009 → FR-INT-003 → AC-025。

## 6. 模块划分

- **Host 交互层**：保存真实用户消息和确认，执行 Talk/Clarify 的可见交互；不自行判定阶段完成。
- **Stage Agent**：按阶段 manifest 执行 step 和 skill，修复当前材料，提交真实 outcome；不成为质量裁判。
- **Stage 认证与完成派生**：校验身份、顺序、材料、证据和阶段末闭环，并派生 stage_quality。
- **规格一致性分析**：前四阶段按适用 profile 检查原始需求、当前四材料、AC、任务、实际结果和证据；共享深层规则，不复制四套实现。
- **独立审查**：提供绑定当前 subject 的异源建议和原始事实；不提供工作许可证。
- **任务状态投影**：统一派生 work_progress、stage_quality、product_release、physical_delivery，供 host、CLI 和监控读取。
- **Close 执行**：只读质量与发布前提，执行单独授权的物理动作并保留逐项结果。

### 现有消费者输出合同

| 消费者 | 主结论 | 适用视角 | 失败信息 | 下一动作 |
| --- | --- | --- | --- | --- |
| Talk/确认卡 | 待用户选择 | 工作进度 | 选择错误原因 | 重答或取消 |
| doctor | 能力是否可用 | 工作进度 | 解析冲突原因 | 修配置再检查 |
| status/monitor | 当前任务状态 | 全部四视角 | 缺口与未变事实 | 修当前缺口 |
| run | 阶段发布结果 | 进度与质量 | 失败阶段和原因 | 修复后重跑 |
| review | 审查事实结果 | 阶段质量 | unavailable 原因 | 修复或重审 |
| verify | 产品验证结果 | 质量与发布 | AC 和证据缺口 | 补证据再验 |
| confirm | 业务确认结果 | 进度与质量 | 未确认或错绑定 | 重新明确确认 |
| authorize | 物理授权结果 | 物理交付 | 未授权或目标漂移 | 重做授权 |
| close | 交付逐项结果 | 发布与交付 | 失败项和未变事实 | 安全重试剩余项 |

## 7. 关键实体

- **Registered Transcript Verification Projection**：host launcher 从当前已登记用户消息即时生成的只读验证视图，包含格式版本、launcher、session、task、stage、消息 identity、顺序、内容 hash 与 R 条目映射；不保存第二份消息原文，没有独立 writer，验证结束即可丢弃。
- **Current Material**：四份当前材料中的一份及其 task-relative identity 和内容 hash。
- **Stage Outcome**：一个 stage 对声明 step、skill、产物、质量、确认和 handoff 的认证结果。
- **Interaction Lifecycle**：一次声明 skill 内可包含多轮 ask、wait、reply、resume；轮次有稳定身份和顺序。
- **Human Confirmation Fact**：绑定当前 task、stage、subject、material identity 和真实 ask、wait、reply、resume 的用户确认；拒绝、错绑、过期或不可用不能满足完成，也不能由系统推断。
- **Quality Fact**：review、test、analyzer、verify 或 evidence 的 present、unavailable、incomplete、stale、conflicting 事实。
- **Finding Disposition**：绑定 finding、review 和 snapshot 的 fixed、rejected_invalid、accepted_risk 或 needs_human 事实；fixed 绑定修复证据，accepted_risk 绑定真实用户风险确认；证据不足沿用 Quality Fact 的 incomplete/unavailable。
- **Derived View**：work_progress、stage_quality、product_release、physical_delivery 的即时只读结论，不是持久状态机。
- **Close Action Fact**：commit、archive、merge、push、cleanup 中单项动作的目标、授权和实际结果。

## 8. 数据和生命周期

1. 用户消息先由 host 登记，decision-log 将其编译为需求、决定、延期或拒绝项。
2. 每个阶段读取认证 worktree 根目录的适用当前材料；材料内容变化后，旧绑定自动变为 stale。
3. Stage Agent 上报声明 step/skill 的真实 lifecycle 和产物；同一交互 skill 可以包含多个有序 round，但不能出现两个并行或不相关的 skill 生命周期。
4. 前四阶段在当前材料上执行 spec-analyze；finding 修复后产生新的材料 identity，并只重跑受影响检查。
5. 独立 review 和测试保留原始 attempt、结果、证据和 unavailable；摘要不能覆盖来源。
6. stage completion 只从 current outcome 与适用闭环事实派生；自身 analyzer/test/AC/交接的缺失、stale、conflicting 或 unavailable 保持 incomplete；异源 review 必须真实执行或如实 unavailable，后者不得显示 pass，但不单独成为 provider gate。
7. product release 只由 `deriveProductRelease()` 从五阶段 completion、逐 AC 结果和 verify-code 当前确认纯派生，不新增 release fact writer。
8. close 在单独授权后执行并记录物理动作；normal close 和 manual-close 共用同一份 plan、executor、operation facts 和安全重试。manual-close 只放宽质量/发布前置，不放宽目标校验或物理授权；部分成功和失败均不可变保留，重试不重写已经发生的事实。

合法状态不增加新枚举：step/skill 沿用 completed、failed、skipped、incomplete、unavailable；质量沿用 present、unavailable、incomplete、stale、conflicting。represented、explicitly_deferred、omitted_unaccepted 是需求覆盖判定；四个对外视角均为派生结果。

## 9. 兼容性预留

- 保持七类 public runtime 入口不变，内部私有实现不升级为公共流程节点。
- 保持历史 task、receipt、review、snapshot 和 ADR 只读；不建立双读 compatibility bridge。
- 保持 provider 原始结果、provenance 和失败事实可读；当前消费者只使用绑定 current material 的事实。
- 保持主 worktree 中其他任务的未提交改动不被本任务修改或吸收。
- 现有输出可以增加派生字段或纠正语义，但不能让 host、CLI、monitor 和 close 各维护一套状态。

## 10. 明确不做与默认必须成立

### 明确不做

- 不新增中央 dispatcher、第二 FSM、raw requirement ledger、reopen、recovery、rebind、successor 或 snapshot lineage。
- 不新增 Web/Workboard 页面、第八类 public command 或无真实 consumer 的控制面。
- 不把 build-spec、build-plan 或 build-code 作为补产品方向的地方。
- 不让 review、test 或 analyzer 成为继续编辑和修复的许可证。
- 不用 spec-analyze 替代 verify-code 的专用代码审查，也不在 verify-code 叠加重复 analyzer。
- 不全面重写五套 wh-review 提示词和合同；只有确定性 fixture 证明具体漏检时才窄改。
- 不把 provider 成功、空 findings、绿测试、merge 或 physical delivery 单独等同产品完成。
- 不修改三个历史 fixture 的源目录，不吞并主 worktree 的其他未提交改动。

默认必须成立：结构和身份错误尽早明确失败；同一任务始终可以修复；缺失质量保持真实 incomplete；不可逆动作必须单独授权；新增机制必须证明唯一消费者和维护边界。

## 11. 验收标准

以下复选框是 spec-content.v3 的固定 AC 卡片格式，表示待实现验收条款，不表示本规格仍未冻结。

- [ ] **AC-001**：原始需求覆盖完整。
  场景：用当前任务已登记的全部用户消息生成 host 验证投影，并与 decision-log 的 R-001 至 R-014 及候选决策轴对照。
  验证：fact collector 只认证 launcher/session/task/stage/version 与消息 identity/order/hash；make-decision/spec-analyze skill 对认证消息分五类并派生轴，runtime 校验每个输出与 message/R/D/FR/AC 绑定；删除整类消息或整条轴做负例。
  通过：每条需求唯一落入 represented 或完整 explicitly_deferred；每个高/中影响轴已有选择，或记录不提问理由并绑定 D/FR/AC；没有第五份需求账本。
  失败：生成器漏产整个轴/消息类，任一需求或轴错绑、漏项、omitted_unaccepted，或由 Stage Agent 自报替代真实来源。
  证据：evidence；影响状态：make-decision stage_quality。

- [ ] **AC-002**：三轮 Talk 是一个合法多轮 skill 生命周期。
  场景：同一 make-decision 尝试连续完成三轮 ask、wait、真实 reply、resume，然后发布阶段结果。
  验证：通过正式 make-decision handler 输入 content-addressed `receipts.interaction`，对正常三轮和缺轮、乱序、错回复、第二 lifecycle、错 ref/hash/task/snapshot 做正反测试，并证明每轮在 aggregate 接受前调用 validator。
  通过：合法三轮全部认证且 publication 成功；validator 未接生产时测试必失败。
  失败：合法多轮被判重复，非法/错绑 receipt 被接受、部分发布，handler 依赖 caller `stage_outcomes`，或只有 adapter 自报而正式 handler 未逐轮消费。
  证据：test；影响状态：make-decision work_progress 与 stage_quality。

- [ ] **AC-003**：Clarify 真实执行或真实跳过。
  场景：分别运行无重大规格歧义和存在一项非方向性规格歧义的 build-spec。
  验证：通过正式 build-spec handler 检查两条路径的当前 decision/spec 绑定与 host lifecycle。
  通过：无歧义路径记录 trigger=false、原因和无待决方向；有歧义路径经现有 lifecycle validator 完成真实 ask、wait、reply、resume 与处置。
  失败：伪执行、推断回复、绑定旧 spec，或由 Clarify 静默吸收方向变化。
  证据：evidence；影响状态：build-spec stage_quality。

- [ ] **AC-004**：Grill 覆盖整个需求而非单一专项。
  场景：对本需求运行 Grill，并故意只提供 spec-analyze profile 检查结果。
  验证：用全需求矩阵逐类核对 Grill 结果。
  通过：原始目标、旅程、五阶段、交互、四材料、状态、审查、修复、close、回归、复杂度、非目标和延期全部有结论。
  失败：只检查一个 skill、profile、证据格式或任一大类缺失仍标记完成。
  证据：manual；影响状态：make-decision stage_quality。

- [ ] **AC-005**：五阶段 outcome 与声明步骤一致。
  场景：对五个 stage 分别提供完整、缺 step、错 step 证据、重复 skill、乱序、上游 stage 未闭合和 task dependency 未闭合的 outcome。
  验证：逐 stage 执行正反 outcome publication；另在前置未闭合时记录后置 implementation summary、GREEN/失败 test fact，再尝试发布 completed execution fact 和 handoff。
  通过：实现、测试和失败事实可真实记录；只有完整、current、有序且依赖闭合的 outcome 得到 completed，未闭合时 completed/handoff/normal completion 为零。
  失败：质量事实被当作工作许可证，或任一缺失/错误 outcome、后置 completed/handoff 越过依赖写入。
  证据：test；影响状态：五阶段 stage_quality 与 work_progress。

- [ ] **AC-006**：make-decision analyzer 检查真实需求全集。
  场景：在 decision-log 中遗漏一条已登记用户需求，其他结构和自报 coverage 保持完整。
  验证：删除一条真实需求后运行 analyzer，再在当前阶段修复并重跑。
  通过：遗漏产生 finding；修复后 current revision 为 consistent。
  失败：自报 coverage 使遗漏通过，或旧 analyzer 结果继续有效。
  证据：test；影响状态：make-decision stage_quality。

- [ ] **AC-007**：build-spec analyzer 检查规格语义与 Clarify。
  场景：分别删除一个用户场景、状态、失败边界、FR、AC oracle 或 Clarify outcome。
  验证：对每类缺口独立运行 production profile 并修复重跑。
  通过：每类缺口都有可定位 finding，修复后 current revision consistent。
  失败：宽泛 coverage、文件存在或较弱格式校验掩盖任一缺口。
  证据：test；影响状态：build-spec stage_quality。

- [ ] **AC-008**：build-plan analyzer 使用深层完整性规则。
  场景：构造孤儿 FR、孤儿 AC、孤儿 task，以及缺依赖、测试角色、判定规则、证据或停止条件的任务。
  验证：把现有深层完整性规则接入 production profile 并运行各负例。
  通过：所有孤儿和字段缺口被发现，当前阶段修复后重跑完成。
  失败：深层测试存在但生产 profile 未调用，或创建 blocked/recovery 才能继续。
  证据：test；影响状态：build-plan stage_quality。

- [ ] **AC-009**：build-code analyzer 消费真实结果。
  场景：提供结构完整但 exit、oracle、actual、coverage、证据 hash、task/material/snapshot/producer identity 或运行入口之一错误的逐 AC 结果，并注入同一 AC 的冲突重复结果。
  验证：正式 profile 按精确复合键选取每条 AC，并逐字段删除/错绑 source、decision、FR、task、file/symbol、gate、oracle、evidence、review、stage-end ref/hash；另测零条、冲突多条和旧结果。
  通过：每条 AC 只消费唯一 current 且完整的端到端链；任一字段 missing/conflicting/错配保持 incomplete，修复后才 consistent。
  失败：按时间戳猜最新，或仅凭自报 actual_behavior、绿摘要、旧 task/material/snapshot 通过。
  证据：test；影响状态：build-code stage_quality 与 product_release。

- [ ] **AC-010**：阶段末质量是完成条件，不是工作许可证。
  场景：让前四任一 stage 的 analyzer 缺失、未执行、unavailable、inconsistent、绑定旧材料，或产生需要延期/不适用处置的 finding，然后继续编辑当前任务。
  验证：检查同任务修复能力、finding 终态、publication 和状态投影。
  通过：编辑调查继续且没有 blocked/reopen/recovery；serious finding 被 fixed 或有当前用户的具体 accepted_risk，其他真实延期/不适用项有完整处置；重跑后 current consistent 才完成。
  失败：质量缺口锁死修复，serious finding 被普通 deferred/not_applicable 绕过，或 unavailable、旧 revision、未处置、不完整处置仍显示完成。
  证据：test；影响状态：前四 stage_quality 与 work_progress。

- [ ] **AC-011**：独立审查绑定当前语义主题。
  场景：对当前 stage 提供绑定当前材料的语义 review，再修改材料并尝试复用旧结果。
  验证：检查 packet 主题、当前 identity、review 内容，以及每个 disposition 的 finding、review、snapshot 和必需证据绑定。
  通过：审查覆盖业务语义六类重点；材料变化后旧结果 stale；fixed 有修复证据，accepted_risk 有当前用户确认，其他枚举保持真实语义。
  失败：只查流程文档，旧 review 覆盖新材料，处置使用未知枚举、错绑，或 needs_human/证据不足仍满足完成。
  证据：evidence；影响状态：各 stage_quality。

- [ ] **AC-012**：review 入口和 bundle 解析一致。
  场景：从 portable bundle、direct review 和 stage host 三个入口解析同一 wh-review 能力，并注入合同 hash 不一致。
  验证：比较三入口解析 identity，并运行正常与 hash 冲突负例。
  通过：正常解析一致；冲突在 provider dispatch 前 fail-loud，原始 unavailable 与 usage 保留。
  失败：任一入口绕过认证，或用空 findings、猜测数字覆盖失败事实。
  证据：test；影响状态：review quality fact 与 stage_quality。

- [ ] **AC-013**：方向变化在同一任务重编。
  场景：在 build-code 中新增会改变入口和验收含义的用户要求。
  验证：执行一次方向变化和一次普通实现细节变化。
  通过：方向变化走真实 Talk/确认和受影响材料重编；普通细节留在当前阶段。
  失败：方向被静默吸收、所有消息都重跑流程，或创建 successor/reopen/recovery。
  证据：evidence；影响状态：work_progress 与受影响 stage_quality。

- [ ] **AC-014**：现有消费者展示同一派生事实。
  场景：分别制造正常、可继续未完成、review unavailable、not_released、physical delivery completed 五种组合，并从 host、status、monitor 和 close 读取。
  验证：比较所有现有消费者对同一输入事实的输出。
  通过：四个视角结论一致且明确区分可继续、质量、发布和交付。
  失败：任一入口自行计算状态，或把可继续、已 merge、已交付显示为正常完成。
  证据：test；影响状态：全部对外派生视角。

- [ ] **AC-015**：normal close 不替前阶段补质量。
  场景：分别缺 task dependency、stage outcome/completion、AC/test、current review、三处确认、material/snapshot、release、prepared plan 或 generated manifest，再运行 normal close；另直接调用 execute 绕过 prepare。
  验证：通过唯一 `prepareDeliveryClosePlan()` 运行逐字段缺失/错绑负例；generated paths 从 completed task actual_changes + current test/evidence refs 与 known-generated 交集派生；观察物理写动作。
  通过：任一缺失/错绑负例只读失败且零物理动作；manifest 来源可追溯；execute 只消费认证且未漂移的 prepared plan；完整正例才进入授权执行。
  失败：close 首次补 analyzer/review/材料，直接 execute 绕过 prepare，或缺任一前提仍执行 normal close。
  证据：test；影响状态：product_release、physical_delivery、task completion。

- [ ] **AC-016**：风险交付与部分失败保持真实。
  场景：质量 incomplete 且 release not_released 时准备 risk plan，未授权执行必须零物理写；补齐五类独立授权后由 `manual-close` 完成六个物理动作，让一个物理动作中断后重试，并分别放入本 task dirty、他 task dirty 和归属不明 dirty 文件。
  验证：检查 risk plan/confirmation/authorization 绑定、可读的逐项 operation fact、重试集合、prepared manifest、cleanup allowlist、dirty owner、目标漂移和四视角输出。
  通过：未授权零物理写；授权后 `manual-close` 真实完成物理交付并写 risk evidence，不写 normal completion；中断后仍能读出已发生事实；只重试探针证明未完成且安全的动作；只清理 manifest/sidecar/allowlist；归属不明 fail-loud；漂移后重新 preflight/授权。
  失败：重写已发生事实、重复副作用、清理未知文件、忽略不明 dirty，或 physical_delivery 覆盖质量和发布。
  证据：test；影响状态：physical_delivery、stage_quality、product_release。

- [ ] **AC-017**：三个历史失败模式成为确定性回归。
  场景：在现有 E2E 的 table/helper 中为 T01、F13、KD 各登记只读 source identity/hash、最小输入字段、预期状态、反向断言和 evidence path，分别执行对应状态和完成判定。
  验证：比较每条 table record 的预期状态、反向断言和源目录运行前后 identity；生产 runtime 不读取该 table。
  通过：三类失败层级均保持真实，源 before 与 after 完全相同。
  失败：记录缺 source/hash/输入/oracle/evidence 任一项、历史源被修改，或任一失败模式被汇总成 pass/completed。
  证据：test；影响状态：回归可信度与对应派生视角。

- [ ] **AC-018**：简单任务的全链路行为合同与可安全生产入口可验证。
  场景：以隔离临时 Node repo 的 `greet <name>` + `--caps` 作为现有确定性 E2E/合同夹具；覆盖正常输出 `HELLO, HUGH!`、非法 `--caps=maybe` 的固定 stderr/exit `2`、Clarify 名字空格 trim 语义、build-plan 首轮遗漏非法 flag 的 AC→task/gate 绑定并由当前 stage analyzer 找出/修复/重跑、阶段顺序、阶段末 `spec-analyze`、阶段内修复、三处确认、review unavailable 和 close 未完成语义。
  验证：运行现有 E2E、阶段 outcome、四个前置 stage-end analyzer、逐 AC、review/status、release/close 合同，并通过真实 stage/runtime 入口验收可安全的 analyzer、review、status 和 close preflight/负例；读回当前材料/快照绑定的证据。Talk/Clarify 的正反夹具必须证明生产路径只接受真实 `ask → wait → user reply → resume`，但本任务不启动真实 Talk/Clarify 交互；provider 可尝试但不得合成结果；物理 close 只在隔离临时 Git/bare remote 中按真实独立授权执行，真实 main/remote 不执行不可逆动作。
  通过：确定性合同和可安全生产入口均覆盖上述行为；生产 Talk/Clarify 仍保留真实生命周期约束；真实 provider 或真实 main/remote 物理 close 未运行或 unavailable 时明确记录 coverage limit，隔离临时 Git fixture 的授权动作不被冒充为真实项目发布，也不把结果宣称为 released/completed。
  失败：允许猜回复、跳阶段、build-spec 静默补方向、未处理 finding 仍 completed、provider/close 缺失却推导 released/completed，或确定性夹具绕过生产 consumer。
  证据：test/evidence；影响状态：本任务实现质量与回归可信度，不直接派生外部任务的 product release。

- [ ] **AC-019**：改动没有引入重复控制面。
  场景：检查本任务最终新增或修改的生产对象、入口、状态和文档职责。
  验证：执行架构清单、反向消费者扫描，并按宪法实际 21 条逐项核对适用性和证据。
  通过：没有新增生产 schema、public command、store、FSM、持久 projection 或其他被禁止控制面；每个必要新增对象都有唯一 consumer、owner、替代关系和删除条件。
  失败：出现重复 writer、永久 bridge、无消费者对象或新增公共流程节点。
  证据：evidence；影响状态：constitution compliance 与 task completion。

- [ ] **AC-020**：空态、加载、取消、权限和竞态语义明确。
  场景：分别制造无有效需求、空 findings、无适用动作、运行中、交互取消、拒绝确认、缺授权、材料并发变化和 close 目标漂移。
  验证：从 host、status、run、review 和 close 观察每种状态及其 publication 行为。
  通过：每种状态有独立真实结论，未受影响修复可继续，任何状态都不自动推导完成。
  失败：空值等于 pass、运行中提前完成、取消后推断回复、缺授权执行动作或竞态覆盖 current 事实。
  证据：test；影响状态：work_progress、stage_quality、product_release、physical_delivery。

- [ ] **AC-021**：完整规格合同进入 production profile。
  场景：分别注入缺章节、章节乱序、重复 ID、来源映射遗漏、引用不对称、PFACT 状态冲突、AC 缺失败条件，以及同一 spec 字节解析出的卡片矛盾。
  验证：通过正式 build-spec publication 路径运行每个负例，而不是只直接调用单元 validator。
  通过：所有负例均拒绝 completed；完整 current spec 同时通过章节、逐卡、引用、Clarify 和 AC 合同；校验视图无持久 writer。
  失败：正式 handler 只执行最低验收校验，或新增第二份规格权威、独立 writer 或持久 current projection。
  证据：test；影响状态：build-spec stage_quality。

- [ ] **AC-022**：全部现有消费者遵循同一输出层级。
  场景：对同一组正常、incomplete、unavailable、not_released 和 physical delivery 事实，读取 host、doctor、status、monitor、run、review、verify、confirm、authorize 和 close。
  验证：逐入口比较主结论、适用视角、current 绑定、失败原因、下一动作和退出语义。
  通过：每个入口按其职责显示同一派生事实，七类 public 入口与 host、monitor、close 无矛盾。
  失败：遗漏任一入口，主结论顺序不一致，或入口自行推导出不同完成状态。
  证据：test；影响状态：全部对外派生视角。

- [ ] **AC-023**：Talk、Clarify 和确认卡支持键盘与错误聚焦。
  场景：只用键盘完成选择、提交、拒绝、取消，并分别提交空选择和无效选择。
  验证：检查可辨识名称、初始焦点、操作顺序、提交结果和错误后的焦点位置。
  通过：全流程可只用键盘完成，错误焦点回到摘要或待修项，取消和拒绝保持真实。
  失败：操作无名称、焦点丢失、顺序不稳定、必须使用指针，或系统推断用户选择。
  证据：manual；影响状态：interaction lifecycle 与业务确认。

- [ ] **AC-024**：失败和未完成状态提供可执行恢复信息。
  场景：分别制造 stale、unavailable、conflicting、未确认、未授权、目标漂移和部分失败。
  验证：从全部适用消费者读取原因、受影响视角、未改变事实、可重试范围和下一动作。
  通过：普通用户手工读一遍即可指出唯一下一步：修材料、重跑检查、重新确认、重新授权或只重试剩余动作。
  失败：只显示未完成或错误码，没有恢复范围，或建议重做已经成功的不可逆动作。
  证据：manual；影响状态：work_progress、stage_quality、product_release、physical_delivery。

- [ ] **AC-025**：三处业务确认都是当前硬完成条件。
  场景：对 make-decision、build-plan、verify-code 分别提供正确、缺失、拒绝、旧材料、错 task/stage/subject 和 unavailable 确认事实。
  验证：检查真实 ask、wait、reply、resume 与当前 material identity，并尝试各阶段 completed、正式完成声明和 normal close，同时证明下一阶段仍可读取材料并继续修复。
  通过：三处都只有正确绑定当前材料的真实同意能满足本阶段完成/正式完成声明/normal close；错误确认不阻止继续工作。
  失败：系统从文本、测试、review 或授权推断同意，任一错误确认仍允许完成/normal close，或被做成下一阶段工作许可证。
  证据：test；影响状态：make-decision、build-plan、verify-code stage_quality 与下游一致性。

## 12. 风险、未决与交接

### DEFER-002：真实 host 卡片焦点行为

- **DEFER-002 handoff contract**：Owner=Codex host UI owner；Trigger=host 暴露可测试 card focus/keyboard API；Handoff=Talk/Clarify/confirmation schema 与键盘场景；Close condition=真实 renderer 证据证明初始焦点、键盘顺序和错误焦点恢复。
- **Owner**：Codex host UI owner；WorkflowHub owner 只提供问题顺序、可辨识名称和不得推断选择的合同。
- **Trigger**：host 暴露可测试的 card focus/keyboard API，或 renderer 被纳入本仓库并登记真实 consumer。
- **Handoff**：Talk、Clarify、confirmation 问题卡 schema，连同 Tab/Enter/Escape 顺序和错误焦点场景交给 host UI。
- **Close condition**：真实 renderer 自动化或人工证据证明稳定初始焦点、键盘顺序和错误焦点恢复；在此之前 AC-023 保持 deferred，不计入 product release pass。

- **RISK-01**：触发：当前 main worktree 的其他任务改动进入本任务。后果：基线和交付边界被污染。处理：build-code 继续使用隔离 worktree，close 前核对差异，禁止吸收或覆盖。验证：最终变更只包含本任务授权范围。影响：FR-CMP-001、AC-019。
- **RISK-02**：触发：provider 或 bundle 不可用。后果：独立 review 只有真实 unavailable 事实，无法提供语义建议。处理：保留原始 unavailable 并继续同任务工作；不得显示 review pass，但也不得仅因 provider 不可用锁死阶段完成，阶段仍按核心交付、测试、逐 AC、已知 serious finding 和交接判断。验证：不存在空 findings、猜测 usage、伪造 pass 或 provider gate。影响：FR-REV-001、FR-REV-002、AC-011、AC-012。
- **RISK-03**：触发：实现把所有重复 lifecycle 都当成合法多轮交互。后果：真正的重复启动和错绑被掩盖。处理：build-code 只允许同一声明 skill 内具有稳定 round、card、prompt 和有序交互的多轮。验证：AC-002 的正反例全部满足。影响：FR-INT-001、AC-002。
- **RISK-04**：触发：为统一展示新增独立 writer 或转换表。后果：四个派生视角演化成第二状态机。处理：build-plan 必须把它们限定为读取同一事实的即时派生。验证：架构和消费者扫描无独立持久状态。影响：FR-STA-001—003、FR-CMP-001、AC-014、AC-019、AC-020。
- **RISK-05**：触发：历史 fixture 含机器相关位置或旧格式。后果：回归不可复现或污染历史源。处理：build-plan 固定最小 manifest，运行时复制到临时区域，只在测试适配旧输入。验证：三份源运行前后 identity 不变。影响：FR-REG-001、AC-017。
- **RISK-06**：触发：只修直接 validator，而正式 handler 未消费完整规格合同。后果：单元测试绿但 build-spec 仍可假完成。处理：build-code 必须用正式 publication 负例证明完整 profile 被消费。验证：AC-021 的所有负例在生产路径失败。影响：FR-SPC-001、AC-021。

未决项：无产品方向未决。精确文件、结构化字段、执行命令、测试顺序和 evidence locator 交给 build-plan；这些实现选择不得改变本规格的行为、状态、失败边界和验收 oracle。

Clarify 结论：spec-clarify 为 trigger=false。原因是 D-001 至 D-011 已冻结范围、用户流程、入口、数据状态、成功失败、非目标、延期和验收强度；本阶段只完成结构化编译，没有发现需要用户重新选择的重大歧义。

## 13. 业务影响与回归范围

直接影响所有使用五阶段 authoring、独立 review、任务状态和 close 的 WorkflowHub 任务。重点回归：

- make-decision 多轮 Talk、全需求 Grill、用户确认和正式 publication。
- build-spec Clarify 的 execute/skip、内容完整性和当前材料绑定。
- build-plan 深层完整性、build-code 真实 AC 结果和前四 stage-end 修复循环。
- verify-code 专用代码审查 closure，不叠加重复 spec-analyze。
- doctor、status、run、review、verify、confirm、authorize 的一致解析和状态语义。
- normal close、风险交付、部分失败和安全重试。
- T01、F13、KD 固定历史回归、bundle smoke、一个简单确定性全链路合同回归和可安全生产入口验收；真实 Talk/Clarify dogfood 不属于本任务验收证据，provider/物理不可逆交付按真实事实和授权边界保留。

成功标准不是“测试变绿”或“文件存在”，而是原始需求到决定、FR/AC、任务、真实结果、阶段质量、产品发布和物理交付均能在当前 identity 上独立读回，并且所有负向场景不能假完成。
