# 功能规格：WorkflowHub 交付流程保真与精简交付

> 基于已接受的 `decision-log.md`。本文只定义可观察行为、边界和验收，不指定代码文件、符号或工程命令。

- **功能名**：WorkflowHub 交付流程保真与精简交付
- **来源**：`decision-log.md` R-001～R-097、D-001～D-016、2026-08-12 最终确认
- **状态**：已审查并完成 build-spec，待 build-plan
- **content_profile**：`spec-content.v3`

## 速读卡（30 秒）

- **一句话需求**：让 WorkflowHub 在五个阶段最早形成并持续保真需求、步骤和质量，同时用 mini-task 安全交付独立小功能。
- **核心改动点**：
  - 五阶段检查需求的实际语义、累积产物和真实证据，不以编号或文件存在冒充覆盖。
  - 每个声明 step 留下最小 outcome，问题在发现 stage 当场修复并只复检受影响范围。
  - Talk/Grill/Clarify 批量问独立问题；wh-review 提供通用失败恢复；mini-task 提供精简完整交付。
- **最大影响面**：五阶段 skills、stage runtime、facts/quality、review、monitoring、配置和任务工作区。
- **验收信号**：语义遗漏、step 丢失、provider 失败和证据缺口都被如实识别；同一样例返工及重复调用下降；没有新增第五材料、第六 stage 或质量推进 gate。

## 来源与决策映射

| Source ID | Decision ID | FR / AC IDs | Status / affected scope | Unresolved / handoff |
| --- | --- | --- | --- | --- |
| R-001～R-016、R-020～R-026、R-053～R-060、R-064～R-071、R-090～R-097 | D-001～D-004 | FR-PREP-001、FR-INTERACT-001、FR-TRACE-001、FR-STAGE-001～002、FR-STEP-001、FR-REPAIR-001、FR-STATUS-001 | current / 五阶段保真 | 精确 packet 与接线由 build-plan 定义 |
| R-005、R-017、R-036～R-039、R-074、R-077、R-085～R-086、R-092 | D-011 | FR-REVIEW-001 | current / 通用 wh-review | provider 私有生命周期不在本任务 |
| R-006、R-019、R-027、R-041～R-044、R-050～R-051、R-061、R-065、R-071 | D-004 | FR-PREP-001、FR-COST-001 | current / 时间与 token | 精确 token 不可得时 unavailable |
| R-031～R-035、R-040、R-049 | D-001～D-004 | FR-EXEC-001 | current / 阶段执行与自动推进 | 工程命令由 build-plan 定义 |
| R-018、R-028～R-030、R-063、R-067、R-094 | D-004、D-012 | FR-GOV-001、FR-LIFECYCLE-001 | current / 治理和启动 | 精确实现由 build-plan 核实 |
| R-044～R-048、R-052、R-062、R-066、R-068、R-094 | D-003 | FR-RESULT-001、FR-STATUS-001 | current / 真实结果与状态 | 本任务没有最终用户页面 |
| R-069～R-070 | D-005～D-008 | none | historical/superseded | 不进入当前行为 |
| R-072～R-084、R-087～R-089、R-093、R-095 | D-009～D-016 | FR-MINI-001～004 | current / mini-task | 配置结构由 build-plan 定义 |
| R-055～R-056、R-061～R-062、R-096～R-097 | D-001～D-004 | FR-AUDIT-001 | current / 历史故障验收 | 历史精确 token unavailable |

### FR 来源绑定

| FR | Source / Decision | Status / PFACT | Scenario / state | AC |
| --- | --- | --- | --- | --- |
| FR-PREP-001 | R-007～010、041～044、058～059 / D-001 | current / PFACT-06 | SCN-001 / 默认、边界 | AC-001 |
| FR-INTERACT-001 | R-011、033、060 / D-001 | current / PFACT-03 | SCN-002 / 默认、错误 | AC-002 |
| FR-TRACE-001 | R-002～003、021、046～047、066、068、096 / D-003 | current / PFACT-03 | SCN-003 / 默认、错误 | AC-003、AC-004 |
| FR-STAGE-001 | R-012～016、024、091、097 / D-002 | current / PFACT-02、04 | SCN-003 / 空、错误 | AC-005、AC-006、AC-007 |
| FR-STAGE-002 | R-031～035、040、053～054、094 / D-001～004 | current / PFACT-01、03 | SCN-008 / 默认、边界 | AC-008、AC-012 |
| FR-STEP-001 | R-004、022～023、067、090 / D-003 | current / PFACT-03 | SCN-004 / 错误 | AC-009、AC-010 |
| FR-REPAIR-001 | R-014、057、065、091 / D-002～003 | current / PFACT-01 | SCN-005 / 错误 | AC-011 |
| FR-EXEC-001 | R-031～035、040～042、049 / D-001～004 | current / PFACT-01、03 | SCN-008 / 默认、边界 | AC-012、AC-013 |
| FR-REVIEW-001 | R-005、017、036～039、074、077、085～086、092 / D-011 | current / PFACT-03 | SCN-006 / 错误 | AC-014、AC-015 |
| FR-RESULT-001 | R-046～047、066～067、095 / D-003 | current / PFACT-03 | SCN-003、SCN-009 / 默认、错误 | AC-016 |
| FR-STATUS-001 | R-026、045、052、062、068、094 / D-003 | current / PFACT-01、05 | SCN-012 / 默认、空 | AC-017 |
| FR-COST-001 | R-006、019、027、041～042、050～051、061、065、071 / D-004 | current / PFACT-05 | SCN-007 / 默认、边界 | AC-018、AC-019 |
| FR-MINI-001 | R-072～077、080、082～088、092～095 / D-009、013～016 | current / PFACT-01、03 | SCN-009 / 默认、边界 | AC-020、AC-021 |
| FR-MINI-002 | R-078～081、089、093 / D-010、012 | current / PFACT-01 | SCN-010 / 边界、竞态 | AC-022 |
| FR-MINI-003 | R-030、048、079 / D-012 | current / PFACT-01 | SCN-011 / 取消 | AC-023 |
| FR-MINI-004 | R-076、085～088 / D-013～016 | current / PFACT-03 | SCN-009 / 默认、错误 | AC-024 |
| FR-LIFECYCLE-001 | R-020、029～030、048、079、081 / D-012 | current / PFACT-01 | SCN-001、SCN-010 / 权限、竞态 | AC-025 |
| FR-GOV-001 | R-018、028、063、067、094 / D-004 | current / PFACT-01、03 | 全部场景 / 边界 | AC-026 |
| FR-AUDIT-001 | R-055～056、061～064、096～097 / D-001～004 | current / PFACT-05 | SCN-003、SCN-007、SCN-012 / 错误 | AC-027 |

## 1. 问题与紧迫性

WorkflowHub 过去能跑完 stage，却可能在内部静默漏 step、把需求语义压成编号、在后期才补产品决定、重复全文分析和 review，或把测试、Git close、provider 失败误写成产品质量结论。三个历史任务已经造成真实返工、长等待和状态争议。

本需求要把质量形成放到最早责任点，并建立轻量的语义保真链；检查用于暴露事实和限制虚假完成，不成为继续修复的许可证。

## 2. 背景、目标与范围

### 目标

- 五阶段分别形成需求、规格、计划、实现和验收质量，并在阶段末检查累积语义与证据。
- 所有声明 step 均有最小、可回放的实际结果。
- 交互问题更少、更易回答，材料未变化时不重复消耗。
- provider 故障不丢审查步骤，也不伪造异源质量。
- mini-task 能以低于五阶段的成本完成独立、真实的小功能交付。

### 范围内

- 五阶段标准输入、步骤、产物、完成/失败边界和交接规范。
- make-decision 需求准备、三类交互 frontier、五阶段 spec-analyze profiles、step outcome、当前 stage 闭环。
- 最小 review packet、通用 wh-review 恢复、增量失效与成本事实。
- monitoring 可读结果、四层完成状态、真实用户结果验证。
- mini-task 紧凑四材料、两次专用审查、隔离工作区、Git 授权和 A 恢复。

## 3. 用户场景与状态覆盖

### SCN-001：在后续阶段前准备完整需求

- **角色**：提出需求的用户与 make-decision Agent
- **Given**：需求可能包含页面、依赖、权限、数据或不明确方向
- **When**：启动 make-decision
- **Then**：Agent 先查可查事实，按适用性确认完整旅程、状态、成功/失败、设计输入、依赖、非目标和延期；方向缺口不交给 build-spec 猜。

### SCN-002：用一组大白话问题收敛 frontier

- **角色**：用户
- **Given**：存在多个互不依赖且 Agent 无法查明的问题
- **When**：Talk、Grill 或 Clarify 发问
- **Then**：用户看到一组编号问题、推荐选项、后果和风险，可只回复编号；部分回复被保留，剩余 frontier 重新排序。

### SCN-003：检查需求实际语义和证据

- **角色**：Stage Agent
- **Given**：source ID、文件和编号都存在
- **When**：阶段一致性检查发现行为语义、失败边界、当前产物或证据缺失/冲突
- **Then**：结果为 partial、missing、changed、expanded、stale、unavailable 或 deferred，并指出具体 source、语义、产物和证据；不能判 covered。

### SCN-004：发现静默丢失的 step

- **角色**：Stage Agent 与任务观察者
- **Given**：manifest 声明了应执行步骤
- **When**：实际结果缺失、重复、乱序、过期、跳过、未完成或不可用
- **Then**：按 step 展示真实状态和原因；stage aggregate 不能覆盖中间缺口。

### SCN-005：当前 stage 当场闭环

- **角色**：发现问题的 Stage Agent
- **Given**：一致性检查发现当前或上游材料缺口
- **When**：缺口是事实漏写或新产品选择
- **Then**：Agent 分别调用合法材料 writer 或询问用户，修复并复检受影响范围；不创建移交等待状态。

### SCN-006：provider 失败但审查不丢失

- **角色**：Stage Agent
- **Given**：wh-review 没有取得有效异源语义结果
- **When**：route/auth/provider/transport/timeout/output/protocol/profile 失败
- **Then**：最多保存三次新的公开异源请求；仍失败时运行 same-source 独立子代理，保留所有失败并维持质量 incomplete，不伪装异源完成。

### SCN-007：材料变化后只重做受影响检查

- **角色**：Stage Agent
- **Given**：已有材料、测试和 review 事实
- **When**：材料未变化或只有局部语义/风险变化
- **Then**：未变化事实复用，变化只使受影响证据失效；最终 aggregate 按计划执行一次。

### SCN-008：按阶段责任自动推进并在目标达成时停止

- **角色**：Stage Agent
- **Given**：用户已确认方向，当前步骤安全、已授权且没有新产品选择
- **When**：阶段按固定顺序执行、形成真实 step outcome，并达到最小充分成功证据
- **Then**：Agent 自动继续后续安全步骤并停止额外探索；只在新产品选择、真实强阻塞、风险接受或不可逆授权时暂停。

### SCN-009：用户直接交付小功能

- **角色**：用户与 mini-task Agent
- **Given**：用户明确选择 mini-task，或需求默认适合精简交付
- **When**：创建独立 task、worktree 和 branch
- **Then**：紧凑形成四材料，完成 design review、实现、聚焦测试、真实用户结果、implementation review 和已授权 Git 交付。

### SCN-010：A 被前置能力阻塞

- **角色**：普通任务 A 的 Stage Agent
- **Given**：A 在任一 stage 被必要依赖或修复阻塞
- **When**：用户选择用 mini-task 先交付前置能力
- **Then**：A 保存真实进度；mini-task 合并后目标分支正常 merge 进 A，解决冲突并重验受影响范围，再普通调用原 stage。

### SCN-011：用户中途取消 mini-task

- **角色**：用户与 mini-task Agent
- **Given**：mini-task 已形成材料、工作区、提交或部分质量事实
- **When**：用户取消继续交付
- **Then**：停止尚未执行的操作，保留当前材料、事实、worktree、branch 和已有 Git 对象并报告真实状态；不自动 reset、删除或回退，后续 cleanup 仍需独立授权。

### SCN-012：分别查看四层状态

- **角色**：用户
- **Given**：任务拥有实现、测试、review、Git 或 close 的混合事实
- **When**：查看状态或完成摘要
- **Then**：需求实现、质量验收、Git 交付和正式 close 分别报告，任一绿色不能覆盖其他层的 unknown/incomplete。

### 状态覆盖清单

- [x] **默认态**：SCN-001、SCN-003、SCN-009
- [x] **空态**：无原始需求或必要材料时返回 material_incomplete；不生成空覆盖结论
- [x] **错误态**：SCN-004、SCN-006
- [x] **加载态**：N/A — CLI 工作流没有持续产品加载页面；provider 等待属于可观察执行状态
- [x] **取消态**：交互/provider 取消保持 incomplete/cancelled；mini-task 取消按 SCN-011 保留当前事实和对象
- [x] **边界态**：mini-task 范围膨胀、材料 stale、证据 unavailable
- [x] **权限态**：不可逆 Git 操作必须独立 authorize
- [x] **竞态**：A 与目标分支同时变化时不得 reset/rebind；merge 冲突显式处理

## 4. 产品事实与假设（PFACT）

- **规格调研状态**：`skipped` — 当前接口、状态、配置和治理边界已有本地一手材料；无需外部研究。
- **规格澄清状态**：`skipped` — 没有剩余会改变范围、验收、接口、数据、安全或操作的规格歧义。取消 mini-task 的行为由已确认的“不得自动破坏数据＋不可逆操作独立授权”唯一推导，不新增用户选择。

- **PFACT-01**：当前真相只有四份材料。
  - **status**：`verified`
  - **证据或来源**：CONSTITUTION F3、AGENTS vNext 边界
  - **关联**：FR-GOV-001、AC-026
- **PFACT-02**：当前 spec-analyze 只支持 build-plan 冻结 packet，并未在五阶段真实调用。
  - **status**：`verified`
  - **证据或来源**：R-016、R-097、当前 `spec-analyze` 合同
  - **关联**：FR-STAGE-001、AC-007
- **PFACT-03**：现有 requirement-lineage、facts/quality 和 manifests 可复用。
  - **status**：`verified`
  - **证据或来源**：R-015、R-021～R-023；当前 skills/requirement-lineage/SKILL.md、runtime/stage/step-manifest.mjs、runtime/evidence/stage-completion-facts.mjs
  - **关联**：FR-TRACE-001、FR-STEP-001、FR-GOV-001
- **PFACT-04**：五个 profile 的精确冻结输入、结果字段和现有执行链接入方式尚未确定。
  - **status**：`unknown`
  - **owner、影响**：build-plan；不影响产品方向，但影响 FR-STAGE-001 的工程设计；OPEN-SPEC-01
  - **关联**：FR-STAGE-001、AC-006
- **PFACT-05**：历史任务精确 token 分布已确认不可取得，状态为 unavailable，禁止估算。
  - **status**：`verified`
  - **证据或来源**：R-096 与历史完整性审计；只能比较可得调用次数和 duration
  - **关联**：FR-COST-001、AC-019
- **PFACT-06**：本需求没有最终用户产品页面。
  - **status**：`not_applicable`
  - **不适用理由**：页面/UI 是 make-decision 的通用准备维度；本任务交付的是工作流能力。
  - **关联**：FR-PREP-001、AC-001

## 5. 功能需求

### 需求准备与交互（PREP / INTERACT）

- **FR-PREP-001**：make-decision 必须在后续阶段前先核实可查事实，再对角色、完整旅程、页面入口、数据状态、成功/失败/取消/重试/恢复、权限安全、依赖兼容、迁移回滚、可观测性、验收环境、最小充分成功证据、客观停止条件、非目标和延期逐项给出 ready、needs-decision 或 N/A 结果。前置依赖不足但可由小型 enabling change 补齐时，先明确范围并通过独立 mini-task 的四材料、测试、两次审查和授权交付完成该小改动，再回到当前 make-decision；不得在规格和计划形成前直接旁路改代码。涉及新产品范围、重大风险或不可逆影响时必须由用户决定。
  - **依据**：R-007～R-010、R-041～R-044、R-058～R-059；PFACT-06
  - **场景**：SCN-001
  - **验收**：AC-001
- **FR-INTERACT-001**：Talk、Grill、Clarify 必须用大白话批量展示互不依赖的问题；每题只含一个决策轴和 2～3 个有效选项，并说明推荐、直接后果和主要风险。保留部分回复并重排 frontier；错误或过期回复不能推进。
  - **依据**：R-011、R-033、R-060
  - **场景**：SCN-002
  - **验收**：AC-002

### 需求语义、阶段和步骤保真（TRACE / STAGE / STEP）

- **FR-TRACE-001**：每条原始需求必须按实际语义追到场景、行为、边界、AC、当前产物和客观证据；ID、路径、hash、文件或绿色测试单独存在均不能判 covered。
  - **依据**：R-002～R-003、R-021、R-046～R-047、R-066、R-068、R-096；PFACT-03
  - **场景**：SCN-003
  - **验收**：AC-003、AC-004
- **FR-STAGE-001**：五阶段必须分别消费冻结的累积材料并执行窄一致性 profile：make-decision 到 decision；build-spec 再加 spec；build-plan 再加 plan/tasks；build-code 再加实现、测试、AC trace；verify-code 再加当前 review、运行与交付证据。输入缺失返回 material_incomplete，不扫描历史材料或猜答案。
  - **依据**：R-012～R-016、R-024、R-091、R-097；PFACT-02、PFACT-04
  - **场景**：SCN-003
  - **验收**：AC-005～AC-007
- **FR-STAGE-002**：WorkflowHub 必须发布并真实执行以下五阶段标准合同；每个合同均明确输入、顺序步骤、最小 step outcome、专业质量、阶段产物、完成/失败边界和下游交接：
  - **make-decision**：输入原始需求与当前 decision-log；严格按 Talk 1 → 必要调研 → Talk 2 → direction advice → Talk 3 → Grill → decision draft → detail advice → 用户确认 → publish 执行，Grill 不是 review；过程中重建完整旅程/页面入口/数据状态/成功失败边界，完成需求准备矩阵并冻结事实、边界、成功证据与停止条件；每个真实 step 更新同一 decision-log。产物是可供 build-spec 直接消费的 decision-log。事实可查却未查、方向仍不明确、设计/依赖未准备或顺序缺步时不得宣称阶段完整。
  - **build-spec**：输入原始需求、decision-log 与当前 spec；依次做条件调研、仅对规格歧义 Clarify、定义场景/状态/FR/AC/oracle，再做语义一致性和异源审查；产物是完整可测试的 spec。不得重开已冻结方向，也不得把缺口交给 build-plan 猜。
  - **build-plan**：输入原始需求、decision-log、spec 与当前 plan/tasks；依次核实仓库事实、运行累积一致性分析、形成最小设计/阶段/测试/review/AC trace 与任务卡；产物是可执行 plan/tasks。不得以计划补产品需求或以未核实文件路径冒充工程事实。
  - **build-code**：输入四材料、当前实现和计划证据；按 phase 做风险相称实现、聚焦测试、当前变更审查并记录 step outcome；全部 phase 后只做一次最终真实测试、逐 AC trace 和 final integration review；产物是实现、测试与当前事实。局部绿色不能覆盖未执行 phase 或真实用户结果缺失。
  - **verify-code**：输入四材料、当前实现、测试、review、运行和交付证据；依次核对需求语义、逐 AC 结果、真实用户路径、失败恢复、开放风险和四层交付状态，再做最终一致性检查；产物是当前 verify/交付事实。不得以 merge、测试绿或文件存在替代产品验收。
  - **依据**：R-031～R-035、R-040、R-053～R-054、R-094；D-001～D-004
  - **场景**：SCN-001、SCN-003、SCN-008
  - **验收**：AC-008、AC-012
- **FR-STEP-001**：每个声明 step 必须记录 step_id、completed/skipped/incomplete/unavailable、输入引用、实际结果摘要、证据引用、跳过/失败原因及可得成本。
  - **依据**：R-004、R-022～R-023、R-067、R-090
  - **场景**：SCN-004
  - **验收**：AC-009、AC-010
- **FR-REPAIR-001**：发现问题的当前 stage 负责闭环；事实漏写使用合法 writer，新产品决定询问用户，修复后只复检受影响范围并记录处置链。
  - **依据**：R-014、R-057、R-065、R-091；D-002～D-003
  - **场景**：SCN-005
  - **验收**：AC-011
- **FR-EXEC-001**：每个 stage 按其标准合同顺序执行；只有 make-decision 每个真实 step 持续更新同一 decision-log。其他 stage 的事实漏写使用对应材料或 facts 的合法 writer，只有出现新产品选择时才写 decision-log，并保留 finding 处置链。build-spec 的 Clarify 只解决规格歧义，条件调研必须记录 executed、skipped 或 unavailable。用户已授权的安全步骤自动推进；范围扩张先判断对用户目标的增益，达到最小充分成功证据后停止，只有新产品选择、真实强阻塞、风险接受或不可逆授权才暂停。
  - **依据**：R-031～R-035、R-040、R-041～R-042、R-049；D-001～D-004
  - **场景**：SCN-008
  - **验收**：AC-012、AC-013

### 审查、证据、状态和成本（REVIEW / RESULT / STATUS / COST）

- **FR-REVIEW-001**：wh-review 必须按方向、细节、phase diff、final implementation 等 stage subject 使用各自最小、干净、path-safe packet 和专属审查合同，保留 provider 原始终态与 provenance。所有 stage 的 review 只提供建议事实，不要求 provider pass；记录性变化不触发重审，只有真实主题变化或重要 finding 修复后允许一次 focused review。build-code 只有当前可信审查无可行动 major/blocking finding时才形成异源质量闭合；无变化、重复 finding 或无可信终态不机械循环。没有有效异源结果时按三次 fresh request 和 same-source fallback 恢复，质量始终如实标记，同任务修复继续。
  - **依据**：R-005、R-017、R-036～R-039、R-074、R-077、R-085～R-086、R-092；D-011
  - **场景**：SCN-006
  - **验收**：AC-014、AC-015
- **FR-RESULT-001**：每类需求必须验证真实用户结果；页面走页面、CLI 跑命令、服务验接口和失败恢复、工作流机制证明 handler→facts→consumer→contract test。
  - **依据**：R-046～R-047、R-066～R-067、R-095
  - **场景**：SCN-003、SCN-009
  - **验收**：AC-016
- **FR-STATUS-001**：状态必须分别展示需求实现、质量验收、Git 交付、正式 close，以及 task→stage→step/skill 的实际结果、耗时/token、证据、遗漏和退化。每个 stage 结束的大白话摘要至少说明：当前阶段和完成内容、需求覆盖、与上游链路一致性、当场修复、剩余风险、下一阶段可直接消费什么及不能自行猜什么。最终评价必须分别回答五个问题：开发过程是否合理、每条原始需求是否实际实现、产品是否真实可用、交付质量是否足够、审查结论是否可信；五项不得互相替代。
  - **依据**：R-026、R-045、R-052、R-062、R-068、R-094
  - **场景**：SCN-012
  - **验收**：AC-017
- **FR-COST-001**：本次改造必须在同一标准 task 内按依赖顺序分 phase 实施，使公共合同先稳定、stage/mini-task consumer 后接入、跨 stage 集成和成本对比最后执行，避免多个 task 间交叉返工。系统必须按材料/风险变化做增量失效，复用未变化的事实，并记录交互、读取、provider wait、测试、review、返工和用户等待的可得成本；新增研究、测试批次、review 或范围扩张前判断其对用户目标的增益，达到成功 oracle 后停止。数据只用于优化，不成为预算 gate。
  - **依据**：R-006、R-027、R-041～R-042、R-050～R-051、R-061、R-065、R-071；PFACT-05
  - **场景**：SCN-007
  - **验收**：AC-018、AC-019

### mini-task、生命周期与治理（MINI / LIFECYCLE / GOV）

- **FR-MINI-001**：mini-task 必须在独立 task/worktree/branch 中紧凑复用四材料；四材料在 design review 前一次形成，后续只按真实变化修订，不拆成额外阶段或材料。decision-log 至少含原始需求来源、事实与约束、选择及理由、影响、风险、被拒方案、未决项和 supersedes；spec 至少含用户结果、用户/系统状态、失败边界、AC 和非目标；plan 至少含方案、依赖、影响半径、测试、review、Git 交付和 rollback；tasks 至少含可执行步骤、oracle 和证据。任何不适用字段必须写明 N/A 理由。随后执行 design review、实现、聚焦测试、真实用户结果和 implementation review；用户可直接指定 mini-task，范围变大时暂停让用户选择。
  - **依据**：R-072～R-077、R-080、R-082～R-088、R-092～R-095；D-009、D-013～D-016
  - **场景**：SCN-009
  - **验收**：AC-020、AC-021
- **FR-MINI-004**：mini-task 必须使用两个独立配置 `wh_review.mini_task.design` 与 `wh_review.mini_task.implementation`。design review 消费已确认的四材料和方案风险；implementation review 的冻结 packet 必须含已确认四材料、当前 diff/snapshot、受影响测试命令及 oracle、当前 mini-task agent 的实际测试结果、跳过理由、coverage limits、逐 AC trace、真实用户结果和剩余风险。测试失败或 unavailable 必须由当前 mini-task 修复或如实保持未完成，不能移交给调用它的主任务。两次专用审查替代同范围普通 review，不重复调用；任何 unavailable/SAME_SOURCE 如实保留。
  - **依据**：R-076、R-085～R-088；D-013～D-016
  - **场景**：SCN-009
  - **验收**：AC-024
- **FR-MINI-002**：A 被 mini-task 阻塞时，A 的真实进度、授权、合并、冲突、受影响复验和从原 stage 普通重调必须可回放，不创建 continuation/rebind 关系。
  - **依据**：R-078～R-081、R-089、R-093；D-010、D-012
  - **场景**：SCN-010
  - **验收**：AC-022
- **FR-MINI-003**：取消 mini-task 只停止未来动作并保留当前事实和 Git 对象；任何回退、删除或 cleanup 必须重新展示对象并独立授权。
  - **依据**：R-030、R-048、R-079；D-012 的不可逆授权边界
  - **场景**：SCN-011
  - **验收**：AC-023
- **FR-LIFECYCLE-001**：标准任务先完成最小 bootstrap 登记原始需求、task 标识、目标仓库和来源，再从 make-decision 启动并由它唯一准备隔离工作区；bootstrap 不是新 stage，也不做产品决定。dirty target 只读报告且不自动 stash/commit/delete/带入 candidate；commit/push/merge/archive/cleanup 分别独立授权并绑定真实对象。取得明确授权且对应收口条件满足后，必须真实执行计划内适用操作并读回物理结果，不能停在授权或 close 文档；明确不在计划内的操作标 skipped 并说明理由，计划内但未授权的操作保持 pending/incomplete 并暂停等待授权。mini-task 可在创建时取得一次计划内 Git 预授权，但必须逐项绑定 task、branch、操作、范围和预期最终 snapshot；对象或范围变化后重新授权，模糊确认不能替代具体操作授权。
  - **依据**：R-020、R-029～R-030、R-048、R-079、R-081；D-012
  - **场景**：SCN-001、SCN-010
  - **验收**：AC-025
- **FR-GOV-001**：新增行为必须复用四材料、facts/quality、manifests、lineage 和七类公共 runtime；不得新增第五材料、第六 stage、第二 provider 生命周期、质量推进 gate 或历史 runtime 分支。
  - **依据**：R-018、R-028、R-063、R-067、R-094；PFACT-01、PFACT-03
  - **场景**：全部场景
  - **验收**：AC-026
- **FR-AUDIT-001**：本需求的验收必须以三个原始 thread `019ff138-2754-7691-9660-1d348b3abb0d`、`019ff12f-cba4-7c51-bee0-76b8d764c837`、`019ff133-51fa-7250-b31a-2a9b2e9bf8d6` 为来源，分别逐 stage 保存步骤遗漏、阻塞、交付质量、review 质量、原始需求最终覆盖和证据可信度，并形成共同根因；每项改造必须回指至少一个真实故障。还必须回放本轮历史调研、被否定方案、最终选择、替代关系、七项审计实际裁决、可得 duration 与 unavailable token 边界，并保存每个 source group 到 R/D 的来源绑定。来源回放完成前不得恢复 Talk 或宣称需求 frontier 完整。历史 evidence 的 partial/unknown/unavailable 保持原样，不把旧记录改写成当前成功；汇总结论不能替代逐任务事实。
  - **依据**：R-055～R-056、R-061～R-064、R-096～R-097
  - **场景**：SCN-003、SCN-007、SCN-012
  - **验收**：AC-027

## 6. 模块划分

### 五阶段保真能力

- **负责什么**：阶段内质量形成、step outcome、累积语义与证据一致性、可读摘要。
- **对外提供什么**：当前事实和明确的 covered/partial/missing 等结果。
- **依赖谁**：四材料、manifest、facts/quality、requirement-lineage。
- **验收边界**：五个 profile 的真实调用和故障场景。

### 通用审查恢复能力

- **负责什么**：冻结最小 packet、公开异源请求、失败事实和 same-source 降级。
- **对外提供什么**：不可变 attempt、findings、provenance 和真实质量限制。
- **依赖谁**：wh-review 与 3rd-review 公共结果。
- **测试边界**：失败分类、三次请求、材料修复、不伪造异源完成。

### mini-task

- **负责什么**：独立小功能的精简完整交付，以及阻塞任务 A 的恢复。
- **对外提供什么**：四材料、两次专用审查、真实结果、Git 交付和 merge commit。
- **依赖谁**：现有 workspace、四材料 writer、review、test 和 authorization。
- **测试边界**：独立容器、范围膨胀、same-source 风险、A merge/retest/resume。

### 机制职责与删除条件

- **交互 frontier**：owner 为 make-decision Talk/Grill 与 build-spec Clarify；consumer 是当前 Stage Agent；替代串行追问和多轴混问；测试编号回复、部分恢复、单题单轴与 2～3 选项；当宿主原生交互合同完整覆盖且三类技能不再消费时删除适配层。
- **五阶段一致性 profiles**：owner 为 `spec-analyze` 的五个窄 profile；consumer 是对应 Stage Agent 的阶段末摘要；替代 build-plan-only 检查和 verify 末端补救；验收冻结输入、语义覆盖、真实证据和执行→事实→摘要；当公共阶段能力原生提供同一语义且不再有 profile consumer 时删除额外接入层。
- **step outcome**：owner 为现有 stage manifest/facts writer；consumer 是 status、阶段摘要和一致性检查；替代只看 stage aggregate；验收缺失、重复、乱序、stale、skipped、incomplete、unavailable；若现有事实已完整承载则只复用，不新增对象。
- **wh-review 恢复**：owner 为 wh-review 公共请求与 3rd-review 私有生命周期；consumer 是 Stage Agent；替代各 stage 自建 retry/fallback；验收材料错误、provider 失败、异源重试、same-source 降级与 provenance；当 broker 公共结果原生提供已确认恢复语义时删除 WorkflowHub 侧额外恢复接入。
- **成本观察**：owner 为现有 step/skill/provider/test/review facts；consumer 是 monitoring 与流程优化；替代人工估算和固定 token gate；测试 unavailable、未变化复用和局部失效；若没有实际 status/优化 consumer 或数据不可稳定取得则删除对应采集字段。
- **mini-task**：owner 为独立 mini-task workflow；consumer 是直接小功能用户与被依赖阻塞的任务 A；替代历史 scope_revision 和临时聊天改代码；测试四材料、两次专审、真实结果、Git 授权、merge/恢复；若使用频率与质量证据不能证明低于五阶段成本，停止扩展并评估删除。

## 7. 关键实体

- **Requirement coverage**：source 与场景、行为、边界、AC、产物和当前证据的语义关系；状态只能是 covered、partial、missing、changed、expanded、stale、not_applicable、unavailable、deferred。
- **Step outcome**：声明 step 的最小事实；包含身份、状态、输入、实际结果、证据和失败/跳过原因。
- **Review attempt**：一次公开请求的来源、材料、终态和 provenance；失败不产生空 findings。
- **mini-task**：独立 task/worktree/branch 中的紧凑四材料交付，不是第六 stage。

## 8. 数据和生命周期

- **数据粒度**：需求覆盖按 source/行为/AC；step 按 manifest step；review 按公开 attempt；成本按可登记 step/skill/provider/test/review 事实。
- **数据时效**：绑定当前 material revision 或 snapshot；语义/风险变化使受影响事实 stale。
- **缺失或迟到**：显示 missing/unknown/unavailable，不补零、不补成功。
- **预览与正式**：草稿可继续修复；正式完成必须引用当前质量事实，但质量事实不是推进许可证。
- **当前与历史**：当前材料覆盖旧版本作为工作真相；旧 facts/reports 不可变且只读保留。
- **归属与清理**：沿用现有 task facts/quality owner；临时 review bundle 在既有 owner 内清理，不创建新长期存储。

## 9. 兼容性预留

- **既有消费方**：五阶段和七类 public runtime 名称保持；旧报告和历史 task 只读。
- **命名预留**：新能力唯一称为 mini-task；scope_revision 仅作历史术语。
- **容器预留**：mini-task 复用四材料 schema 语义，不增加第五容器。
- **状态预留**：保留 unknown/unavailable/incomplete 和九种 coverage 状态，不压成布尔值。
- **扩展边界**：只允许五个窄 profile 和两个 mini-task review 配置；不承诺通用工作流框架。

## 10. 明确不做与默认必须成立

### 明确不做

- 不靠 verify 最后统一补需求、AC、测试或 step。
- 不新增第五材料、第六 stage、需求数据库、ledger、permit、selector、completion gate 或平行状态机。
- 不让 spec-analyze 替代 stage 专业质量、测试、代码审查或 provider review。
- 不在 WorkflowHub 重造 provider polling、session、timeout 或私有生命周期。
- 不恢复 successor、rebind、continuation、recovery、checkpoint 等旧控制面或永久兼容桥。
- 不把三个历史 task 的业务需求并入当前产品范围。
- 不用统一 token 预算、固定次数或文件/编号存在作为成功条件。
- 不自动 stash、commit、删除 dirty 内容；不未经授权执行不可逆 Git 操作。

上游非目标处置：decision-log 的七项非目标全部保持 current；“不重写五阶段”由 FR-STAGE-002 约束为补标准合同，“不新增 stage/CLI/数据库/lineage/selector/permit/gate”归入 FR-GOV-001，“analyzer 不替代专业质量”归入 RISK-ANALYZER-01，“不修改 provider 私有生命周期”归入 FR-REVIEW-001 边界，“历史业务不入范围”与“mini-task 不是旧 scope_revision/第六 stage/旧状态机”保留在本节。其余两条是这些上游非目标的具体化，不扩大范围。

### 默认必须成立

- finding 不锁死同任务修复；缺质量事实不能宣称完成。
- same-source 始终不是异源；风险接受不改变质量事实。
- 当前 stage 闭环不能越权改写产品决定。
- 新机制必须有 owner、consumer、替代对象、测试和删除/保留条件。

## 11. 验收标准

### AC 受影响用户状态

| AC | Scenario | State | AC | Scenario / state |
| --- | --- | --- | --- | --- |
| AC-001 | SCN-001 | 默认、边界 | AC-002 | SCN-002 / 默认、错误 |
| AC-003 | SCN-003 | 默认、错误 | AC-004 | SCN-003 / 错误 |
| AC-005 | SCN-003 | 空、错误 | AC-006 | SCN-003 / 默认、错误 |
| AC-007 | SCN-003 | 空、错误 | AC-008 | SCN-008 / 默认、边界 |
| AC-009 | SCN-004 | 错误 | AC-010 | SCN-004 / 默认、空 |
| AC-011 | SCN-005 | 错误 | AC-012 | SCN-008 / 默认、边界 |
| AC-013 | SCN-008 | 默认、边界、权限 | AC-014 | SCN-006 / 错误 |
| AC-015 | SCN-006 | 错误、权限 | AC-016 | SCN-003、SCN-009 / 默认、错误 |
| AC-017 | SCN-012 | 默认、空 | AC-018 | SCN-007 / 默认、边界 |
| AC-019 | SCN-007 | 默认、边界 | AC-020 | SCN-009 / 默认 |
| AC-021 | SCN-009 | 边界 | AC-022 | SCN-010 / 竞态、错误 |
| AC-023 | SCN-011 | 取消、权限 | AC-024 | SCN-009 / 默认、错误 |
| AC-025 | SCN-001、SCN-010 | 权限、竞态 | AC-026 | 全部场景 / 边界 |
| AC-027 | SCN-003、SCN-007、SCN-012 | 错误、空 | N/A | 无剩余 AC |

- [ ] **AC-001**：适用性矩阵覆盖完整用户旅程、页面入口、数据状态、成功/失败/取消/重试/恢复、权限安全、依赖兼容、迁移回滚、可观测性和验收环境；UI/依赖/方向缺口在 make-decision 被解决、明确延期或 N/A。可由小改动补齐的前置依赖必须通过独立 mini-task 的四材料、测试、两次审查和授权交付完成，再回到当前阶段；同时冻结最小充分成功证据和客观停止条件，build-spec 不补产品方向。
  - **需求**：FR-PREP-001
  验证：页面、依赖和无页面三类场景
  - **通过条件**：每项有可读结论、来源和处理结果；达到用户目标即可据停止条件结束探索
  - **失败条件**：缺项被静默交给后续阶段，或目标已达仍机械增加批次/策略/窗口
  - **证据类型**：test + evidence
- [ ] **AC-002**：一批独立问题可编号回答；每题只有一个决策轴和 2～3 个有效选项，并包含推荐、后果和风险；部分回答后保留答案并重排，错 reply 不推进。
  - **需求**：FR-INTERACT-001
  验证：交互合同场景
  - **通过条件**：真实 ask→wait→reply→resume/re-rank 可回放
  - **失败条件**：串行逐题、一题混入多轴、选项不是 2～3 个、问题有依赖或推断用户答案
  - **证据类型**：test + evidence
- [ ] **AC-003**：保留全部 ID 和文件，只删除/改变一项需求行为、失败边界或证据时，必须返回 partial/missing/changed/stale 并指明 source、场景、FR、AC、产物和证据。
  - **需求**：FR-TRACE-001
  验证：语义变更和空壳文件 fixture
  - **通过条件**：实际语义缺口被定位
  - **失败条件**：因编号、路径、hash 或文件存在判 covered
  - **证据类型**：test
- [ ] **AC-004**：测试绿、review 文件或 Git merge 存在但与需求语义/当前 snapshot 不匹配时，不得判 covered。
  - **需求**：FR-TRACE-001
  验证：错误证据、旧 snapshot、无 consumer fixture
  - **通过条件**：保持 partial/stale/unavailable
  - **失败条件**：任何单一绿色事实覆盖语义缺口
  - **证据类型**：test
- [ ] **AC-005**：五个 profile 各自消费正确累积材料，能识别遗漏、冲突、范围扩大和 stale 上游产物。
  - **需求**：FR-STAGE-001
  验证：五阶段合同场景
  - **通过条件**：差异定位到当前 source/artifact；缺输入返回 material_incomplete
  - **失败条件**：只在 verify 统一发现、只检查当前文件、扫描历史材料补答案或自行猜测缺失输入
  - **证据类型**：test
- [ ] **AC-006**：每个 profile 均证明 skill/step 声明→handler 调用→facts 写入→status/summary 消费→contract test。
  - **需求**：FR-STAGE-001
  验证：真实调用链合同测试
  - **通过条件**：五条链均有执行证据
  - **失败条件**：仅有 skill、配置、profile 或输出文件
  - **证据类型**：test + evidence
- [ ] **AC-007**：五个 profile 全部接通前，能力状态保持 partial/incomplete；当前 build-plan-only 实现不能冒充全阶段完成。
  - **需求**：FR-STAGE-001
  验证：当前事实和缺 profile 场景
  - **通过条件**：缺口可见且不阻止同任务修复
  - **失败条件**：文档声明直接变为完成
  - **证据类型**：evidence
- [ ] **AC-008**：五个 stage 的标准规范逐一覆盖输入、顺序步骤、最小 outcome、专业质量、产物、完成/失败边界和下游交接，并与当前 workflow/skill/handler 的真实调用一致。
  - **需求**：FR-STAGE-002
  验证：五阶段规范与真实调用链逐项对照
  - **通过条件**：五个合同均有实际 consumer 和可证伪执行证据
  - **失败条件**：只写 profile、只写文档，或任一 stage 缺标准流程维度
  - **证据类型**：test + evidence
- [ ] **AC-009**：缺失、重复、乱序、stale、skipped、incomplete、unavailable 和依赖未完成均被识别，aggregate 不覆盖中间缺步。
  - **需求**：FR-STEP-001
  验证：step topology fixture
  - **通过条件**：状态及原始原因逐项可见
  - **失败条件**：stage 绿色掩盖 step 缺口
  - **证据类型**：test
- [ ] **AC-010**：每个 step outcome 含最小字段；skipped 有理由，成本不可得时为 unavailable。
  - **需求**：FR-STEP-001
  验证：schema/consumer 合同
  - **通过条件**：facts 与 status 语义一致
  - **失败条件**：缺字段、猜测成本或空结果冒充完成
  - **证据类型**：test
- [ ] **AC-011**：finding 记录发现 stage、受影响 source/artifact、合法 writer 或用户决定、修复结果和复检结果；只重验受影响范围。
  - **需求**：FR-REPAIR-001
  验证：事实漏写与新产品选择两类场景
  - **通过条件**：当前 stage 闭环且无移交等待对象
  - **失败条件**：越权改写、只记录不修或全链机械重跑
  - **证据类型**：test + evidence
- [ ] **AC-012**：make-decision 严格按 Talk 1 → 必要调研 → Talk 2 → direction advice → Talk 3 → Grill → decision draft → detail advice → 用户确认 → publish 执行；其余四 stage 按各自标准合同顺序执行。条件调研有 executed/skipped/unavailable，build-code 每 phase 有聚焦测试/当前变更审查，最终只有一次真实全量测试、逐 AC trace 和 final integration review。
  - **需求**：FR-STAGE-002、FR-EXEC-001
  验证：完整五阶段任务与 phase fixture
  - **通过条件**：每步 outcome 和阶段交接可回放；make-decision 每个真实 step 更新同一 decision-log，其他 stage 只由合法 writer 更新所属材料或 facts，新产品选择才写 decision-log
  - **失败条件**：Clarify 重开方向、跳过 phase 质量、重复最终全量或只在 verify 补步骤
  - **证据类型**：test + evidence
- [ ] **AC-013**：用户确认后安全步骤自动推进；只有新产品选择、真实强阻塞、风险接受或不可逆授权暂停；达到成功 oracle 后不继续无增益探索。
  - **需求**：FR-EXEC-001、FR-COST-001
  验证：已授权推进、范围扩张和目标已达场景
  - **通过条件**：暂停原因属于四类之一，新增工作有明确用户价值
  - **失败条件**：为流程记录频繁打断，或成功后继续机械研究/review/测试
  - **证据类型**：test + evidence
- [ ] **AC-014**：方向、细节、phase diff、final implementation 等 subject 各用专属最小冻结 packet 和审查合同；三次 fresh 异源 attempt 独立可回放。MATERIAL_INCOMPLETE 先修材料且不计数，真实 finding 在当前 stage 修复而非重试；记录性变化不触发重审，重要修复后最多一次 focused review。
  - **需求**：FR-REVIEW-001
  验证：provider/材料/finding 分类场景
  - **通过条件**：每次终态与 provenance 保留
  - **失败条件**：隐藏 retry、复用 session、失败变空 findings
  - **证据类型**：test + evidence
- [ ] **AC-015**：review 只提供建议事实，不成为推进许可证；same-source fallback 永远标记 SAME_SOURCE，缺异源时质量保持 incomplete，带风险交付需当前 snapshot 风险接受。build-code 的当前可信审查仍有可行动 major/blocking finding 时不得形成异源质量闭合；无变化或重复 finding 不机械循环。
  - **需求**：FR-REVIEW-001
  验证：三次失败后的降级场景
  - **通过条件**：质量和授权边界均真实
  - **失败条件**：fallback 变异源完成或普通确认代替风险接受
  - **证据类型**：test + evidence
- [ ] **AC-016**：页面、CLI、服务和工作流机制分别有真实结果 oracle；文件、单元测试或 review 存在均不能单独证明实现。
  - **需求**：FR-RESULT-001
  验证：按需求类型运行真实用户路径
  - **通过条件**：成功、失败和恢复结果可观察
  - **失败条件**：只验证内部结构
  - **证据类型**：test + manual + evidence
- [ ] **AC-017**：需求实现、质量验收、Git 交付、正式 close 四层及 stage/step/skill 明细分别展示；unknown/incomplete 不被其他绿色事实覆盖。最终报告分别回答过程是否合理、每条原始需求是否实际实现、产品是否可用、交付质量是否足够、审查是否可信。
  - **需求**：FR-STATUS-001
  验证：混合状态任务投影
  - **通过条件**：大白话状态与原始事实一致，阶段摘要包含完成内容、需求覆盖、链路一致性、当场修复、剩余风险及下一阶段可消费/不可猜内容
  - **失败条件**：单一 completed 覆盖局部缺口，或摘要缺少任一最低内容
  - **证据类型**：test + evidence
- [ ] **AC-018**：本次改造在同一 task 按“公共合同 → stage/mini-task 接入 → 跨 stage 集成与成本对比”的依赖顺序分 phase；同一 snapshot/material 不重复全文分析、全量测试、review 或 analyzer，局部变化只失效受影响证据。
  - **需求**：FR-COST-001
  验证：无变化与局部变化样例
  - **通过条件**：调用范围与影响面一致
  - **失败条件**：机械全链重跑或错误复用 stale 事实
  - **证据类型**：test + evidence
- [ ] **AC-019**：同一样例前后比较交互、读取、provider wait、测试、review、返工和用户等待；不可得 token 为 unavailable，数据不作预算 gate。
  - **需求**：FR-COST-001
  验证：前后对比报告
  - **通过条件**：真实浪费下降且无质量降级
  - **失败条件**：猜测 token、固定预算、无 ROI 扩张范围，或少跑一次冒充优化
  - **证据类型**：evidence
- [ ] **AC-020**：mini-task 有独立 task/worktree/branch；design review 前一次形成四材料：decision-log 含来源、事实约束、选择理由、影响、风险、被拒方案、未决项和 supersedes，spec 含用户结果/状态/失败/AC/非目标，plan 含方案/依赖/影响半径/测试/review/Git/rollback，tasks 含步骤/oracle/证据；N/A 均有理由。随后完成 design review、实现、测试、真实用户结果和 implementation review。
  - **需求**：FR-MINI-001
  验证：独立 mini-task E2E
  - **通过条件**：每项有当前证据且无第五材料/第六 stage
  - **失败条件**：聊天后直接改代码或普通 review 重复执行
  - **证据类型**：test + evidence
- [ ] **AC-021**：用户指定复杂 mini-task 时风险被披露；范围膨胀时暂停让用户选择缩小或普通任务，不自动转换。
  - **需求**：FR-MINI-001
  验证：范围边界场景
  - **通过条件**：用户选择和已有事实保留
  - **失败条件**：静默扩张或自动 rebind
  - **证据类型**：test + evidence
- [ ] **AC-022**：A 进度 commit 经独立授权；mini-task 交付后正常 merge 进 A，冲突和受影响复验可见，再普通调用原 stage。
  - **需求**：FR-MINI-002
  验证：A dirty/clean、merge conflict、目标变化场景
  - **通过条件**：真实 Git 对象和恢复链可回放
  - **失败条件**：stash/reset/rebase/rebind、跳过复验或预授权越范围
  - **证据类型**：test + evidence
- [ ] **AC-023**：取消时停止未执行操作，保留材料、facts、worktree、branch 和已有 commits，并分别报告；没有独立授权不得回退或 cleanup。
  - **需求**：FR-MINI-003
  验证：取消发生在设计后、实现后和部分 Git 操作后三类场景
  - **通过条件**：状态可恢复且没有自动破坏数据
  - **失败条件**：自动 reset/delete/cleanup 或把取消写成完成
  - **证据类型**：test + evidence
- [ ] **AC-024**：design 与 implementation 分别使用 `wh_review.mini_task.design`、`wh_review.mini_task.implementation`；前者看到已确认四材料和方案风险，后者的冻结 packet 含已确认四材料、当前 diff/snapshot、受影响测试命令及 oracle、当前 agent 实际结果、跳过理由、coverage limits、逐 AC trace、真实用户结果和剩余风险，且不重复同范围普通 review。失败或 unavailable 在 mini-task 内修复或保持未完成。
  - **需求**：FR-MINI-004
  验证：两类配置和冻结 packet 合同场景
  - **通过条件**：配置、材料、provenance 和替代关系均可回放
  - **失败条件**：配置缺失、空壳四材料、implementation 看不到证据、重复 review 或 SAME_SOURCE 冒充异源
  - **证据类型**：test + evidence
- [ ] **AC-025**：make-decision 前的最小 bootstrap 只登记原始需求、task、仓库和来源，不成为新 stage；make-decision 唯一准备 worktree。dirty target 不污染 candidate；commit/push/merge/archive/cleanup 均需独立授权。授权且收口条件满足的计划内适用操作必须真实执行并读回；不在计划内的操作标 skipped 和理由，计划内但未授权的操作保持 pending/incomplete 并暂停等待授权。mini-task 至少真实完成已授权的 commit 与 merge，其他计划内操作同样执行；创建时的一次计划内预授权逐项绑定 task、branch、操作、范围和预期 snapshot，对象变化后失效并重新授权。
  - **需求**：FR-LIFECYCLE-001
  验证：工作区与授权场景
  - **通过条件**：安全启动及授权边界真实
  - **失败条件**：自动清理/提交或阶段确认顺带授权
  - **证据类型**：test + evidence
- [ ] **AC-026**：最终没有第五材料、第六 stage、新 public runtime 类别、质量推进 gate、第二 provider 生命周期或历史 runtime 分支；新增机制均有 owner/consumer/替代/测试/删除条件。
  - **需求**：FR-GOV-001
  验证：宪法清单和 consumer 扫描
  - **通过条件**：宪法检查清单全部适用条款有证据
  - **失败条件**：重复控制面或无消费者生产对象
  - **证据类型**：test + evidence
- [ ] **AC-027**：从三个原始 thread 分别逐 stage 重放 US-04、PaperBuilder、M15，保存步骤遗漏、阻塞、交付/review 质量、原始需求覆盖和证据可信度；形成共同根因，并把每项改造回指真实故障。同时回放历史调研、否定方案、最终选择、替代关系、七项审计裁决、归档 P1～P5、可得 duration 和 unavailable token 边界，并证明每个 source group 绑定到 R/D；回放完成前 Talk/frontier 不得推进，历史 unknown/unavailable 不被改写。
  - **需求**：FR-AUDIT-001
  验证：历史故障到新 oracle 的回放矩阵
  - **通过条件**：每项故障有可执行验收结果
  - **失败条件**：只保留总结、没有 oracle，或声称历史需求完美实现
  - **证据类型**：test + evidence

## 12. 风险、未决与交接

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
| OPEN-006 | T009/T010 | historical Talk evidence is requested | four-material source binding | remains unavailable; prevention regression passes |
| OPEN-007 | T001/T002/T008 | current-stage repair is needed | existing artifact owner writer | same-stage repair succeeds without transfer state |
| OPEN-008 | build-spec（closed） | historical final semantic audit completed | retained closed evidence | 不复用 ID；T011 final check 不改变其历史状态 |
| OPEN-009 | T005/T006 | user or stage invokes mini-task | mini-task runner | direct and enabling-change entry pass |
| OPEN-010 | T005/T006 | mini-task suitability is evaluated | four-material compact contract | boundary/explicit-user route cases pass |
| OPEN-011 | T005/T006 | mini-task scope expands materially | user choice handoff | pause/keep-small/ordinary-task cases pass |

### 上游风险、延期和未决处置

| Source IDs | Disposition | Current owner | Close / handoff |
| --- | --- | --- | --- |
| RISK-001、006～007 | 合并 RISK-ANALYZER-01 | build-plan | 证明无万能 analyzer/新日志系统 |
| RISK-002 | 合并 RISK-FACT-GATE-01 | build-plan | unavailable 不阻止同任务修复 |
| RISK-003 | 合并 RISK-COST-01 | verify-code | 最终 aggregate 不按 phase 重跑 |
| RISK-004 | 合并 RISK-OWNER-01 | 当前 stage | 新选择只问用户 |
| RISK-005 | 合并 RISK-INTERACT-01 | make-decision/build-spec | 单题单轴、批内无依赖 |
| RISK-008 | 合并 RISK-AUTO-01 | 各 stage | 只按四类原因暂停 |
| DEFER-001～003 | 保留到 OPEN-SPEC-02～04 | build-plan/runtime | 核实现有 consumer 后关闭 |
| DEFER-004～005 | 由 FR-EXEC-001、FR-REVIEW-001 承载 | build-code/wh-review | 合同和失败 fixture 通过 |
| DEFER-006～008 | 由 FR-AUDIT-001、FR-COST-001、FR-EXEC-001 承载 | 对应 owner | 历史只读、freshness、step 写入可证 |
| DEFER-009～010 | 保留到 OPEN-SPEC-01 | build-plan | 形成最小工程合同，不改产品方向 |
| DEFER-011 | 合并 RISK-COST-01 | verify-code | 同样例可得成本比较 |
| DEFER-012 | 由 FR-PREP-001 承载 | make-decision | AC-001 通过 |
| DEFER-013～015 | 保留到 OPEN-SPEC-01、05～06 | build-plan/runtime | 真实接线与字段合同关闭 |
| DEFER-016 | 合并 RISK-COST-01 | verify-code | AC-019 通过 |
| DEFER-017 | 由 FR-STATUS-001、FR-LIFECYCLE-001 承载 | verify/close | 物理操作读回且风险继续披露 |
| OPEN-001～007 | 保留为 OPEN-SPEC-02～08 | 各卡 owner | 各卡关闭条件满足 |
| OPEN-008 | closed by final semantic audit | build-spec | R-001～097 已按实际语义、产物证据与 finding 处置反查，无待修遗漏 |
| OPEN-009～011 | closed by D-009、D-014～016 | mini-task | 入口、材料/边界、范围变大已冻结 |

- **RISK-ANALYZER-01**：spec-analyze 膨胀为万能技能
  - **受影响 ID**：FR-STAGE-001、FR-RESULT-001、AC-026
  - **触发条件**：profile 开始承担测试、review 或专业质量
  - **后果**：重复规则、维护上升、假绿
  - **缓解或 STOP**：公共核心只做 lineage/一致性/handoff；超出即删除
  - **处理 Stage**：build-plan
  验证：职责和 consumer 检查
- **RISK-FACT-GATE-01**：facts/review 被实现成推进许可证
  - **受影响 ID**：FR-REPAIR-001、FR-GOV-001
  - **触发条件**：finding/unavailable 阻止同任务修复
  - **后果**：新增阻塞和绕过流程
  - **缓解或 STOP**：只限制完成声明；继续修复路径必须存在
  - **处理 Stage**：build-plan
  验证：unavailable/finding 场景
- **RISK-COST-01**：成本数据缺失或被猜测
  - **受影响 ID**：PFACT-05、FR-COST-001
  - **触发条件**：host/provider 不提供 usage
  - **后果**：优化判断失真
  - **缓解或 STOP**：标 unavailable，比较可得调用和 duration
  - **处理 Stage**：verify-code
  验证：缺 usage 场景
- **RISK-MINI-01**：mini-task 被用于绕过复杂需求
  - **受影响 ID**：FR-MINI-001、AC-021
  - **触发条件**：出现重大架构/迁移/权限/安全决定或范围膨胀
  - **后果**：质量形成不足
  - **缓解或 STOP**：披露风险并暂停，由用户选择缩小或普通任务
  - **处理 Stage**：mini-task
  验证：复杂范围 fixture
- **RISK-OWNER-01**：当前 stage 越权改写上游决定
  - **受影响 ID**：FR-REPAIR-001
  - **触发条件**：修复需要新产品选择
  - **后果**：需求被 Agent 猜测
  - **缓解或 STOP**：询问用户；只用合法 writer 写事实
  - **处理 Stage**：发现问题的当前 stage
  验证：方向缺口场景
- **RISK-INTERACT-01**：批量 frontier 混入有依赖问题
  - **受影响 ID**：FR-INTERACT-001、AC-002
  - **触发条件**：同一批问题的答案依赖未决前提，或单题包含多轴
  - **后果**：用户编号回复产生错误组合
  - **缓解或 STOP**：每题单轴且每批只含互不依赖问题；部分回答后重新排序
  - **处理 Stage**：make-decision/build-spec
  验证：依赖问题与多轴问题场景
- **RISK-AUTO-01**：自动推进越过真实用户决定或不可逆风险
  - **受影响 ID**：FR-EXEC-001、FR-LIFECYCLE-001、AC-013
  - **触发条件**：出现新产品选择、强阻塞、风险接受或不可逆操作
  - **后果**：范围或外部状态未经授权改变
  - **缓解或 STOP**：命中四类原因立即暂停；其他已授权安全步骤继续
  - **处理 Stage**：发现条件的当前 stage
  验证：自动推进与四类暂停场景
- **OPEN-SPEC-01**：五阶段工程文件、执行顺序、调用命令与最终 analyzer 接口合同
  - **受影响 ID**：PFACT-04、FR-STAGE-001、FR-STAGE-002
  - **owner**：build-plan
  - **影响**：决定最小实现边界，不改变已确认产品行为
  - **处理 Stage**：build-plan
  - **关闭条件或 STOP**：证明复用现有 packet/facts/manifest，且不新增控制面
- **OPEN-SPEC-02**：dirty fact 当前字段、摘要大小和分类枚举是否完整
  - **受影响 ID**：FR-LIFECYCLE-001、AC-025
  - **owner / 影响**：build-plan/runtime；决定复用字段，不改变 dirty 不污染 candidate 的行为
  - **处理 Stage**：build-plan
  - **关闭条件或 STOP**：当前 validator/consumer 证据足够，或只补最小字段
- **OPEN-SPEC-03**：三类 ask/wait/resume 的宿主接线
  - **受影响 ID**：FR-INTERACT-001、AC-002
  - **owner / 影响**：build-plan/runtime；影响恢复接线，不改变交互合同
  - **处理 Stage**：build-plan
  - **关闭条件或 STOP**：真实 waiting、部分 reply、resume/re-rank 和错 reply 拒绝可证
- **OPEN-SPEC-04**：build-spec 条件调研事实的现有 consumer
  - **受影响 ID**：FR-EXEC-001、AC-012
  - **owner / 影响**：build-plan/runtime；影响 executed/skipped/unavailable 展示
  - **处理 Stage**：build-plan
  - **关闭条件或 STOP**：当前 stage/status 真实消费，且不新增对象/gate
- **OPEN-SPEC-05**：五个一致性 profile 的冻结输入和 finding 字段
  - **受影响 ID**：FR-STAGE-001、AC-005、AC-006、AC-007
  - **owner / 影响**：build-plan/runtime；影响材料完整性和处置接线
  - **处理 Stage**：build-plan
  - **关闭条件或 STOP**：复用现有 packet/validator/lineage，缺输入为 material_incomplete
- **OPEN-SPEC-06**：step outcome 的最小字段和 manifest 对照
  - **受影响 ID**：FR-STEP-001、AC-009、AC-010
  - **owner / 影响**：build-plan/runtime；影响 status/summary，不允许新 ledger
  - **处理 Stage**：build-plan
  - **关闭条件或 STOP**：缺失、重复、乱序及各失败状态均有现有 facts consumer
- **OPEN-SPEC-07**：advice freshness 与记录性变化的边界
  - **受影响 ID**：FR-REVIEW-001、FR-COST-001
  - **owner / 影响**：build-plan/wh-review；影响是否复用现有 review
  - **处理 Stage**：build-plan
  - **关闭条件或 STOP**：记录性变化不重审，真实实现变化仍绑定当前 snapshot
- **OPEN-SPEC-08**：历史不可追回交互证据的当前验收方式
  - **受影响 ID**：FR-AUDIT-001、AC-027
  - **owner / 影响**：verify-code；历史事实保持 unavailable，只验新合同
  - **处理 Stage**：verify-code
  - **关闭条件或 STOP**：不补写历史记录，新流程契约测试证明防复发

## build-spec 审查处置

以下只记录不可变审查事实及本阶段修复位置，不把 provider 可用、finding 已处置或本地校验通过改写为 provider pass。

- **attempt 84054678-9e83-4630-aa47-8dace84815d0**：`available`，两份有效异源结果；5 major、4 minor。
  - `F-0ed9c5a72bfc`：单题单轴和 2～3 个有效选项已进入 FR-INTERACT-001、AC-002。
  - `F-1c752ea3fd2f`：build-code 每 phase 聚焦质量与最终单次集成验证已进入 FR-STAGE-002、FR-EXEC-001、AC-012。
  - `F-482fbce1af1c`：冻结 packet、material_incomplete 与禁止历史补猜已进入 FR-STAGE-001、AC-005。
  - `F-b742b9766f7d`：删除不存在的 EVIDENCE/OBSERVE 历史映射名，全部映射改用真实 FR/AC ID。
  - `F-be5c9bb9f99e`：五阶段标准流程交付及真实调用链对照已进入 FR-STAGE-002、AC-008。
  - `F-c01276e1b06b`：自动推进和四类暂停边界已进入 FR-EXEC-001、AC-013。
  - `F-d3083b67ca6e`：阶段摘要最低内容已进入 FR-STATUS-001、AC-017。
  - `F-d4e51bad6a1f`：最小充分成功证据与停止条件已进入 FR-PREP-001、AC-001。
  - `F-f2d36eefdee8`：R-031、R-032、R-034、R-040、R-049 已分别绑定 FR-STAGE-002、FR-EXEC-001 和 AC-012、AC-013。
- **attempt a0571627-cf36-4b64-b307-575b86f706e0**：`available`，两份有效异源结果；4 major、6 minor。
  - `F-14d8e4ed90ac`：四材料在 design review 前一次形成已进入 FR-MINI-001、AC-020。
  - `F-17e025f667dc`、`F-5c1dc74ef729`：decision-log 逐 step 写入仅属于 make-decision；其他 stage 使用合法 writer，仅新产品选择写 decision-log，见 FR-EXEC-001、AC-012。
  - `F-254920d90434`：完整旅程和页面入口已进入 FR-PREP-001、AC-001。
  - `F-4780f750e6e1`：make-decision 精确顺序已进入 FR-STAGE-002、AC-012。
  - `F-a7dba8477aa2`：mini-task 四材料完整字段和 N/A 理由已进入 FR-MINI-001、AC-020。
  - `F-cd0d0349788a`：enabling change 路径已进入 FR-PREP-001、AC-001。
  - `F-cf69bbe9fd6e`：删除无来源的 21 项数字，AC-026 改为宪法清单全部适用条款。
  - `F-e7c46a5f5e59`：R-043 已改绑 FR-PREP-001，并要求 Talk 前先核实可查事实。
  - `F-fd6f5ab3fa37`：最小 bootstrap 已进入 FR-LIFECYCLE-001、AC-025。

本阶段额外独立审计发现的 implementation packet 字段、最终五问、历史审计验收、授权后真实 Git 交付、单 task phase 顺序及 enabling change 旁路风险，已分别由 FR-MINI-004/AC-024、FR-STATUS-001/AC-017、FR-AUDIT-001/AC-027、FR-LIFECYCLE-001/AC-025、FR-COST-001/AC-018、FR-PREP-001/AC-001 当场补齐。最终语义审计无剩余 actionable finding，OPEN-008 已关闭。

## 13. 业务影响与回归范围

### 五阶段工作流

- **既有行为**：阶段和 skill 可声明步骤，但真实调用、facts、状态及累积语义检查可能不一致。
- **本需求影响**：每阶段在最早责任点形成质量并输出真实可读结果。
- **回归路径**：从 make-decision 到 verify-code 跑完整任务，以及每个 stage 的局部失败/修复场景。
- **验收**：AC-001～AC-017

### wh-review

- **既有行为**：一次 broker request，无通用三次恢复；失败可能长期无可信终态。
- **本需求影响**：失败事实、三次异源请求、same-source 降级和质量限制可回放。
- **回归路径**：正常 findings、空 findings、材料缺失、provider/transport/timeout/SAME_SOURCE。
- **验收**：AC-014～AC-015

### mini-task

- **既有行为**：历史 scope_revision 已删除；小功能只能走完整五阶段或临时处理。
- **本需求影响**：新增独立精简但完整的交付路径。
- **回归路径**：直接使用、A 阻塞、范围膨胀、同源降级、Git 对象变化和 merge 冲突。
- **验收**：AC-020～AC-025

- **可能受冲击的业务规则**：四材料唯一权威、review advice-only、质量事实不作许可证、不可逆操作独立授权、旧历史只读。
- **明确无影响**：历史 task 内容和历史 review 不被改写；3rd-review 私有 provider 生命周期不在本任务内。
