# 功能规格：M15 真实记录链与看板交付修复

> 基于当前任务的已确认 decision-log.md。本文件只定义用户能看到的行为、边界和验收，不定义实现文件、代码符号或工程命令。

- **功能名**：M15 真实记录链与看板交付修复
- **来源**：decision-log.md 的 R-001～R-009、D-001～D-004、最终确认；历史 M15 页面基线只用于继承已确认的页面范围
- **状态**：草稿，待 build-spec 阶段审查和发布
- **content_profile**：`spec-content.v3`

## 速读卡

- **一句话需求**：让用户从一个新的正式 WorkflowHub 任务开始，看到真实、可追溯、能说明缺口的 M15 看板，而不是一张有字段却没有采集结果的页面。
- **核心改动点**：
  - 把真实任务、来源能力、事实、投影和页面状态接成一条可回放的链。
  - 未证明的宿主细节明确显示不可用，不把采集缺口说成流程失败。
- **最大影响面**：新任务记录、M15 四区页面、筛选、诊断、成本归因和后续 M16 的事实输入。
- **验收信号**：一条 fresh 任务能从正式入口走到浏览器；页面能逐项说明有数据、缺数据、来源不可用或投影不完整。

## 来源与决策映射

| Source ID | Decision ID | FR / AC IDs | Status / scope | Handoff / risk |
| --- | --- | --- | --- | --- |
| R-001～R-004 | D-003 | FR-CHAIN-001～002、FR-FACT-001～002、FR-E2E-001；AC-001～004、AC-010 | current / 先验证根因 | 真实 caller 与能力矩阵留 build/verify 证明 |
| R-004、R-007、R-008 | D-001 | FR-VIEW-001～002、FR-DIAG-001、FR-COST-001；AC-005～008 | current / 页面和数据一起交付 | 页面实现和浏览器验收在本任务内完成 |
| R-003、R-004、R-009 | D-002 | FR-CHAIN-002、FR-FACT-002、FR-DIAG-001、FR-COST-001；AC-002、004、007、008 | current / 按真实能力交付 | 未证明宿主事件延期，不猜测填充 |
| R-008、R-009 | D-004 | FR-PROJ-001、FR-E2E-001、FR-HANDOFF-001；AC-009～011 | current / 基础链可交付 | M16 另起任务，不在本期实现 |
| M15-BASELINE | D-001 | FR-VIEW-001～002、FR-DIAG-001、FR-COST-001；AC-005～008 | current / 继承四区、筛选和状态范围 | 历史数据不回填 |
| R-005 | D-001～D-004 | 无新增 FR / AC | 已由 make-decision 满足 | 后续阶段继续按标准顺序交接 |
| R-006 | D-001～D-004 | 无新增 FR / AC | Talk 与 decision-log 义务已满足 | 本规格不重新发明需求 |

每条 FR 和 AC 都在本规格中再次写出来源绑定；没有新增产品方向。

历史编号是已确认基线的来源别名；本规格的 FR/AC 编号按当前规格合同统一，下面的对照表是跨阶段追溯的唯一翻译表，不产生第二套需求。

### 历史 M15 编号与本规格编号对照

| 历史 FR / AC | 本规格 FR / AC | 继承内容 | 处理说明 |
| --- | --- | --- | --- |
| FR-VIEW-001 / AC-VIEW-016 | FR-VIEW-001 / AC-005 | 四区、共享筛选、默认任务总览、任务下钻、受控证据回链 | 保留并补真实浏览器验收 |
| FR-VIEW-002 / AC-VIEW-017 | FR-VIEW-002 / AC-006 | 打开读取一次、原生刷新读新快照 | 保留，不轮询、不自定义刷新 |
| FR-VIEW-003 / AC-VIEW-018 | FR-VIEW-002 / AC-006 | loading/ready/empty_valid/partial/stale/fatal | `empty` 统一为 `empty_valid` |
| FR-DIAG-003 / AC-DIAG-009 | FR-DIAG-001 / AC-007 | 状态、coverage、errors 分层 | 保留并补采集不可用边界 |
| FR-COST-003 / AC-COST-012 | FR-COST-001 / AC-008 | 受控问题聚合、趋势和小样本边界 | 保留并绑定 health 字段 |
| FR-E2E-001 / AC-019、AC-E2E-001 | FR-E2E-001 / AC-010 | fresh Codex 贯通事实到 HTML | 基础链必须真实，宿主细节诚实缺失 |

## 1. 问题与紧迫性

现在的 M15 页面能显示一些已有记录，但“任务真正执行过什么”和“页面显示了什么”没有被一条真实新任务证明串起来。结果是页面看起来有数据，实际上可能没有完整采集、没有可靠来源、没有拆分粒度，也无法判断空白是流程没发生还是记录没接上。

这会直接误导后续判断：用户可能把“没采到”当成“流程退化”，也可能把空白当成没有问题。M16 要做经验回路和候选池，前提是先有可信事实；因此当前只修 M15 的新任务记录和消费链，不提前做 M16。

## 2. 背景、目标与范围

### 背景

M15 页面沿用既有四区产品范围：任务总览、流程退化、成本归因、常见问题与趋势。当前调研已经找到记录、投影和页面的局部能力，但真实入口 caller、宿主来源能力和 fresh full-chain 证据没有先闭合。D-003 要求先验证根因，再按证据决定修复；D-002 和 D-004 要求真实能力不足时诚实展示缺口。

### 目标

- 新任务从正式入口开始后，至少真实产生 task、run、attempt、stage 和来源状态，并能被页面消费。
- 每个宿主事件都有明确的 present、missing、skipped、not_applicable、unknown、unavailable、unsupported、conflict 或 incomplete 语义。
- 页面同时告诉用户“流程实际结果”和“记录是否足够”，不把二者混成一个结论。
- canonical facts 是唯一事实来源；投影删除后可由同一份新事实重建，历史任务不被写入。
- 为未来 M16 交接一套带来源、粒度、时效和缺口说明的事实，而不是候选池或自动改法。

### 范围内

- 新任务的正式入口、来源登记、能力声明、事实记录、项目/全局投影和静态 HTML 消费链。
- M15 四区、七类共享筛选、样本充分性和页面状态。
- 流程退化与成本归因的保守判定。
- 一条 fresh Codex 真实任务的端到端浏览器验收。

## 3. 用户场景与状态覆盖

### SCN-001：正式任务产生基础记录

- **角色**：WorkflowHub 用户。
- **Given**：用户从正式入口创建一个新任务，任务没有历史回填数据。
- **When**：任务依次运行并结束。
- **Then**：任务、run、attempt、stage 和来源状态有同一任务身份绑定；页面能读取这次任务的当前事实。

### SCN-002：来源能力可证明或诚实缺失

- **角色**：记录链和页面用户。
- **Given**：宿主只声明了部分可采集事件，或来源未登记、不可读、不支持该格式。
- **When**：任务结束并生成事实。
- **Then**：有能力的事件显示 present；没有能力的事件显示 unavailable、unsupported 或 unknown，并保留原因和 coverage，不补零、不猜测。

### SCN-003：用户打开看板查看当前快照

- **角色**：监控页面用户。
- **Given**：有一份当前投影，可能完整、部分可用或合法为空。
- **When**：用户打开页面或用浏览器原生刷新。
- **Then**：页面先显示 loading，再显示 ready、empty_valid、partial、stale 或 fatal；显示生成时间、coverage 和 errors。

### SCN-004：用户查看流程退化

- **角色**：流程负责人。
- **Given**：来源已登记、事件适用性明确、来源声明支持该事件。
- **When**：用户打开流程退化区并筛选任务、阶段或时间范围。
- **Then**：只有已证明的 missing、明确乱序或 required artifact mismatch 进入退化统计；采集不可用不被算成流程退化。

### SCN-005：用户查看成本和趋势

- **角色**：流程优化负责人。
- **Given**：同一筛选范围内有可识别的 token、duration、retry 或 tool use 事实。
- **When**：用户打开成本归因或常见问题与趋势区。
- **Then**：数字回指受控来源；分母不足显示 insufficient 或 unknown；样本少于两个时不称为“常见”。

### SCN-006：来源或投影发生错误

- **角色**：页面用户。
- **Given**：来源未登记、越界、读失败、格式不支持、事实冲突或投影生成失败。
- **When**：页面读取快照。
- **Then**：显示 partial、stale 或 fatal 及可读错误；不把失败变成空成功，不覆盖 canonical facts。

### SCN-007：多个新任务同时更新

- **角色**：记录链。
- **Given**：两个或更多新任务同时完成或重新发布当前投影。
- **When**：全局快照被重建。
- **Then**：投影重建仍使用 canonical facts，任务身份和来源引用不丢失；发布失败显示错误并保留 canonical facts 不变。
- **性质与来源**：这是从 FR-PROJ-001 的“canonical facts 可重建、投影失败不改事实”推导出的回归场景，不新增页面指标；若并发发布能力无法由真实入口证明，只记录为 `unknown`/延期。

### SCN-008：任务取消、跳过或无适用事件

- **角色**：任务用户和页面用户。
- **Given**：任务被取消，或某事件经规则判定为 skipped、not_applicable，或未能完成。
- **When**：事实被发布并在页面展示。
- **Then**：保留带理由的状态；取消不被伪装成成功，skipped/not_applicable 不自动变成退化。

### SCN-009：权限与安全边界

- **角色**：页面用户和记录链。
- **Given**：来源身份、路径或来源文本不可信，或用户没有读取权限。
- **When**：记录或页面处理该输入。
- **Then**：拒绝越界和未授权读取；来源文本按普通文本展示，不成为脚本或 HTML；用户看到明确错误。
- **性质与来源**：这是从 FR-CHAIN-002 的来源身份/路径/安全校验和投影 `fatal` 触发条件推导出的安全边界，不把未证明的宿主能力写成已支持。

### SCN-010：fresh 任务端到端回放与重建

- **角色**：验收人员。
- **Given**：一个没有历史回填的 fresh 任务已经完成。
- **When**：验收人员核对正式入口、canonical facts、证据、投影、HTML 和浏览器，再删除派生投影并重建。
- **Then**：同一份 facts 的 hash 不变，重建结果一致，历史任务没有新增写入；宿主未证明能力仍只显示 unavailable、unsupported 或 unknown。

### SCN-011：同一真实来源贯穿五个阶段

- **角色**：WorkflowHub 用户和记录链。
- **Given**：用户从正常 Codex WorkflowHub 入口开始一个没有历史回填的新任务。
- **When**：任务依次进入五个正式阶段。
- **Then**：第一个阶段自动绑定当前 Codex source；后续阶段复用同一个绑定和任务身份，不需要用户重新输入 task id，也不启动额外 Agent。若已绑定 source 在后续阶段丢失，阶段入口直接报告来源断开，并保留 incomplete/unavailable 事实，不能继续伪造完整成本或证据。

### 状态覆盖清单

- [x] **默认态**：SCN-001、SCN-003、SCN-004、SCN-005。
- [x] **空态**：SCN-003、SCN-005；合法无匹配数据显示 empty_valid。
- [x] **错误态**：SCN-002、SCN-006、SCN-008、SCN-009。
- [x] **加载态**：SCN-003；读取快照前显示 loading。
- [x] **取消态**：SCN-008；取消保留为事实状态，不当作成功。
- [x] **边界态**：SCN-002、SCN-005、SCN-010；能力、分母和样本不足均显式处理。
- [x] **权限态**：SCN-006、SCN-009。
- [x] **竞态**：SCN-007、SCN-010。

### 用户可见状态转换

页面状态为：`loading → ready`、`empty_valid`、`partial`、`stale` 或 `fatal`；刷新重新从 loading 开始。事件状态为：`present`、`missing`、`skipped`、`not_applicable`、`unknown`、`unavailable`、`unsupported`、`conflict`、`incomplete`。页面/投影状态与事件状态不互相替代。

来源状态为 `unregistered`、`registered`、`unavailable`、`conflict`。`unregistered` 表示正式入口没有登记 source，不能静默当成成功；页面进入采集不可用提示，若连覆盖分母也不可得则投影为 `unknown`。

### 锁定的 Expected topology 基线

流程退化只能拿下面这套已确认基线做比较，页面和投影不能自行猜拓扑：

- 阶段固定为 `make-decision → build-spec → build-plan → build-code → verify-code`；阶段和 step 的顺序只按各自 manifest 的连续 `order` 判断。
- 每个阶段的 step 以及每个阶段的 skill，都以当前 manifest 中登记的身份、顺序、依赖、入口条件和完成证据为准；`trigger=false` 必须带理由，才是合法的 `not_applicable`。
- 顺序判断只在同一个 `run_id + attempt_id` 内进行；每次重试必须有独立 `attempt_id`，同一事件按 `fact_id` 去重，不能重复计数，也不能让重试复用旧 attempt。
- 未来阶段显示 `pending`，不能当成缺失；只有观察到更后阶段却缺少更前阶段，才可派生为 `evidence_gap`；已登记且适用的 step 发生顺序错误，才可派生为 `out_of_order`。
- manifest、skill 依赖和质量记录的 owner 保持原有边界；M15 只能观察，不创建第二套拓扑或事实库。

以上基线绑定 PFACT-003、FR-FACT-002、FR-DIAG-001、AC-004 和 AC-007。

## 4. 产品事实与假设（PFACT）

> 以下只记录本规格依赖的事实边界。实现和 fresh task 证明在后续 build/verify 产生；未证明内容不能写成已完成。

- **PFACT-001**：本任务只处理新任务事实，canonical facts 是事实唯一来源，页面和投影不是第二套真相。
  - **status**：`inferred`
  - **推断来源**：decision-log.md 的关键事实、D-001、D-003、最终确认。
  - **限制**：当前实现是否对所有新入口都遵守，必须由 fresh task 继续证明。
  - **关联**：FR-CHAIN-001、FR-FACT-001、FR-PROJ-001、FR-E2E-001；AC-001、AC-003、AC-009、AC-010。

- **PFACT-002**：宿主来源能力不应由目录扫描、时间猜测或业务语义推断出来，必须有登记身份、读取能力和支持范围。
  - **status**：`inferred`
  - **推断来源**：decision-log.md 的 D-002、D-003 和 M0/M15 调研结论。
  - **限制**：真实 launcher caller、source adapter 和每类宿主事件仍待 fresh task 证明。
  - **关联**：FR-CHAIN-001、FR-CHAIN-002、FR-FACT-002、FR-DIAG-001、FR-E2E-001；AC-001、AC-002、AC-004、AC-007、AC-010。

- **PFACT-003**：流程退化判定使用本规格“锁定的 Expected topology 基线”；顺序只在同一 `run_id + attempt_id` 内按 manifest 顺序判断，重试必须独立、事件按 `fact_id` 幂等，未来阶段是 `pending`，只有后续阶段存在而前置阶段缺失才是 `evidence_gap`，已登记且适用的顺序错误才是 `out_of_order`。只有适用性明确且来源支持的事实才能判定缺失或乱序。
  - **status**：`inferred`
  - **推断来源**：decision-log.md 的 Expected topology、D-003，以及历史 M15 页面基线。
  - **限制**：fresh task 若证明实际拓扑与候选基线不一致，必须按证据修订规格，不静默错绑。
  - **关联**：FR-FACT-002、FR-DIAG-001、FR-VIEW-001；AC-004、AC-005、AC-007。

- **PFACT-004**：review、test、verify 等原始质量记录继续由各自质量 owner 持有；M15 只能记录引用、状态、coverage 和 freshness。
  - **status**：`inferred`
  - **推断来源**：decision-log.md 的关键事实、D-003 和当前治理约束。
  - **限制**：各 owner 在真实任务中的 caller 仍需回放确认。
  - **关联**：FR-FACT-001、FR-PROJ-001、FR-E2E-001；AC-003、AC-009、AC-010。

- **PFACT-005**：页面消费的是一次生成的静态快照；打开或浏览器原生刷新才读取新快照，不轮询、不自动重载、不提供自定义刷新按钮。
  - **status**：`verified`
  - **证据或来源**：decision-log.md 的历史 M15 页面基线、D-001 和最终确认。
  - **关联**：FR-VIEW-001、FR-VIEW-002；AC-005、AC-006。

- **PFACT-006**：本期不回填历史 M15 数据；当前只对新任务产生可追溯记录，历史内容保持只读。
  - **status**：`verified`
  - **证据或来源**：原始需求 R-008、R-009，D-001、D-004 和最终确认。
  - **关联**：FR-PROJ-001、FR-HANDOFF-001；AC-009、AC-011。

- **PFACT-007**：样本充分性必须按视图所需字段覆盖、任务范围和 time-window 判断，不足时不能以 0 或 false 代替；至少一条范围内任务且该视图所需字段均有可回指的完整覆盖时为 `sufficient`；有任务但任一所需字段为 `unavailable`、`unsupported`、`unknown`、`conflict` 或 `incomplete` 时为 `insufficient`；任务数或覆盖分母缺失/冲突时为 `unknown`；合法无任务时为 `empty_valid`。
  - **status**：`verified`
  - **证据或来源**：最终确认第 2 项；D-001 的页面范围决定。
  - **关联**：FR-VIEW-002、FR-COST-001；AC-006、AC-008。

- **PFACT-008**：当前尚未证明所有 Codex transcript、session、step、skill、subagent、token、duration、retry 和 tool use 都能稳定绑定到真实任务。
  - **status**：`unknown`
  - **unknown**：影响是首版部分区域可能不可用；owner 为本任务 build/verify 的真实 source/adapter 验证。
  - **关联**：FR-CHAIN-002、FR-COST-001、FR-E2E-001；AC-002、AC-008、AC-010；关联风险 RISK-001、RISK-002。

- **PFACT-009**：M16 的经验回路和自进化候选池是后续独立任务，本期只交接已证明的事实和缺口。
  - **status**：`verified`
  - **证据或来源**：原始需求 R-009、D-001～D-004 和最终确认。
  - **关联**：FR-HANDOFF-001；AC-011。

- **PFACT-010**：在本次方案 A 中，正常 Codex 任务的 source binding 属于整条任务会话，而不是某一个阶段；它只能由第一个正式入口创建一次，后续阶段必须复用同一个不可变绑定。绑定丢失不能靠目录扫描、时间猜测、旧事实或手工 task id 补回。
  - **status**：`current`
  - **证据或来源**：decision-log.md 的“方案 A 确认”；fresh M15 run 显示首阶段 source `present`、后四阶段 `no_registered_source`。
  - **限制**：具体 host handoff 是否在所有正常入口都已贯通，仍需 build-code 的新鲜五阶段任务证明。
  - **关联**：FR-CHAIN-001、FR-CHAIN-002、FR-CHAIN-003、FR-E2E-001；AC-001、AC-002、AC-010、AC-012。

## 5. 功能需求

### 真实入口与来源（CHAIN）

- **FR-CHAIN-001**：每个 fresh 任务必须从正式 WorkflowHub 入口开始，形成唯一 task、run、attempt、stage 身份，并把来源状态绑定到同一任务；页面只能消费这条链产生的事实。
  - **范围边界**：包含新任务基础链；不包含历史回填或新建另一套任务身份。
  - **来源绑定**：R-001～R-004；D-003；状态 `current`。
  - **PFACT**：PFACT-001、PFACT-002。
  - **场景**：SCN-001、SCN-010。
  - **验收**：AC-001、AC-010。

- **FR-CHAIN-002**：来源必须声明身份、可读能力、支持的格式/版本、task/run/session 绑定和适用事件；未登记、不可读、不支持或冲突时必须给出对应状态和原因。
  - **范围边界**：只记录真实声明的能力；不通过目录枚举、时间猜测、fixture 或语义推断补全来源。
  - **来源绑定**：R-002、R-003、R-004；D-002、D-003；状态 `current`。
  - **PFACT**：PFACT-002、PFACT-008。
  - **场景**：SCN-002、SCN-006、SCN-009。
  - **验收**：AC-002、AC-004、AC-010。

- **FR-CHAIN-003**：正常 Codex 任务在第一个正式阶段自动创建一次 source binding；后续正式阶段必须复用同一个 `source_id`、session 绑定和 task/run/attempt 身份。后续阶段不能要求用户手工重新绑定；如果绑定不存在、切换到别的 task 或来源身份不一致，阶段入口必须失败并留下可读的 incomplete/unavailable 原因，不得把该阶段写成有完整来源的成功记录。
  - **范围边界**：只约束当前 M15 的正常 Codex 入口；不新增公共命令、不新增第二套 facts、不扫描 transcript 目录、不推断缺失数据；多 CLI 交给 M17。
  - **来源绑定**：R-002、R-004、R-008；D-003、D-006、D-007；2026-08-18 方案 A 确认；状态 `current`。
  - **PFACT**：PFACT-001、PFACT-002、PFACT-010。
  - **场景**：SCN-001、SCN-002、SCN-011。
  - **验收**：AC-001、AC-002、AC-010、AC-012。

### canonical facts 与状态（FACT）

- **FR-FACT-001**：新任务事实必须按固定粒度记录事实类型、来源、状态、coverage、归属键、值或原因，并保留证据引用；同一粒度的不同来源冲突时分别保留并标 conflict，不静默择值或相加。
  - **范围边界**：M15 只发布观察事实，不复制 review/test/verify 的原始正文，也不把页面派生结果写回事实。
  - **来源绑定**：R-001、R-003、R-004；D-003；状态 `current`。
  - **PFACT**：PFACT-001、PFACT-004。
  - **场景**：SCN-001、SCN-002、SCN-008、SCN-010。
  - **验收**：AC-003、AC-004、AC-009。

- **FR-FACT-002**：事件状态必须使用本规格的九种事实状态；诊断中的 pending、evidence_gap、out_of_order、failed 等只能作为带来源和 reason 的派生结果，不改变事实状态。顺序只在同一 `run_id + attempt_id` 内按 manifest 的 `order` 判断；重试必须使用独立 `attempt_id`，重复事件按 `fact_id` 幂等。
  - **范围边界**：未来阶段的 pending 不是缺失；只有后续阶段存在而前置阶段缺失才是 evidence_gap；已登记且适用的顺序错误才是 out_of_order；不把 unknown、unavailable、unsupported、incomplete 算作流程退化。
  - **来源绑定**：R-001、R-002、R-004；D-002、D-003、D-004；状态 `current`。
  - **PFACT**：PFACT-003、PFACT-008。
  - **场景**：SCN-002、SCN-004、SCN-008。
  - **验收**：AC-004、AC-007。

### 页面与诊断（VIEW）

- **FR-VIEW-001**：静态页面打开时默认显示任务总览区，提供任务总览、流程退化、成本归因、常见问题与趋势四个区，并支持全局、project、task、stage、skill、version、time-window 七类共享筛选；任务总览可带 task 范围下钻到流程退化区和成本归因区，展示项可回指受控来源和证据；切区后保留筛选，浏览器刷新后回默认筛选。
  - **范围边界**：页面只展示事实和确定性派生结果，不生成质量分、自动改法或候选池。
  - **来源绑定**：R-004、R-007；D-001；M15-BASELINE；状态 `current`。
  - **PFACT**：PFACT-003、PFACT-005。
  - **场景**：SCN-003、SCN-004、SCN-005。
  - **验收**：AC-005。

- **FR-VIEW-002**：页面必须显示 loading、ready、empty_valid、partial、stale、fatal 六种 UI 状态，并始终显示 generated time、coverage、errors 和每个视图的样本充分性 `sufficient`、`insufficient`、`empty_valid` 或 `unknown`。投影状态 `current` 且有任务映射为 ready，`current` 且范围合法但无任务映射为 empty_valid，`partial`/`unknown` 映射为 partial，`stale` 映射为 stale，`fatal` 映射为 fatal；投影尚不可读时先显示 loading。stale 必须能说明 canonical facts 更新但投影未重发，fatal 必须能说明 data.js 缺失、合同不兼容、重建失败或来源安全校验失败。至少一条范围内任务且该视图所需字段均有可回指的完整覆盖时为 `sufficient`；任务数或覆盖分母缺失/冲突时为 `unknown`；合法无任务时为 `empty_valid`。
  - **范围边界**：partial/stale 仍可展示可用事实，但不能伪装成 ready；fatal 不显示未经验证的数字。四个视图的 required field set 固定，页面运行时不得按现有记录条数猜字段：任务总览需要 `task_id`、`project_name`、`run_id`、`attempt_id`、stage fact 的 `value.outcome`、`source.status`、`coverage`；流程退化需要 Expected topology 以及 `stage/step/skill/artifact/health/review/verify` facts 的 `status`、`reason/error`、`coverage`、`evidence_refs`；成本归因按筛选维度需要对应 `session_id`、`subagent_id`、`stage`、`skill_id` 与 `token.message_id`、`tool_use.tool_use_id`、`duration.duration_ms`、`retry.retry_id`，并要求 `source` 和 `attempt_id`；常见问题与趋势需要 `health.domain`、`health.friction_type`、`health.error_code`、`observed_at`、`coverage`、`source_refs`，趋势还需要至少两个兼容 time bucket 和可用分母。页面同时显示 `in_scope_task_count`、所需字段覆盖和判定原因；任一所需字段为 unavailable、unsupported、unknown、conflict 或 incomplete 时只能为 insufficient 或 unknown。
  - **来源绑定**：R-004、R-007、R-008；D-001、D-002、D-004；状态 `current`。
  - **PFACT**：PFACT-005、PFACT-007、PFACT-008。
  - **场景**：SCN-003、SCN-005、SCN-006、SCN-010。
  - **验收**：AC-006、AC-008、AC-010。

- **FR-DIAG-001**：流程退化区只能把来源已登记、事件适用性明确且来源支持的 missing、明确乱序或 required artifact mismatch 计为退化；采集不可用、来源不支持、冲突、证据不足和合法跳过必须单独提示。每个退化项和证据不足提示都保留受控来源与证据回链。未来阶段的 pending 不是缺失；只有后续阶段存在而前置阶段缺失才是 evidence_gap；已登记且适用的顺序错误才是 out_of_order；重试不得复用旧 attempt，重复事件不得重复计数。
  - **范围边界**：不输出根因、严重度、质量分或修改建议，也不把目录、时间或页面现状当成 Expected topology。
  - **来源绑定**：R-001、R-002、R-004；D-002、D-003、D-004；M15-BASELINE；状态 `current`。
  - **PFACT**：PFACT-003、PFACT-008。
  - **场景**：SCN-004、SCN-006、SCN-008。
  - **验收**：AC-004、AC-007。

### 成本与投影（COST/PROJ）

- **FR-COST-001**：成本区按 transcript、session、stage、skill、subagent 展示可得的 token、duration、retry、tool use；各数字必须有去重身份和受控来源。常见问题与趋势按 outcome、process、efficiency 组织展示；趋势只使用同一筛选范围内可核实的 time bucket 和分母，分母不足显示 insufficient 或 unknown；count 小于 2 不称为常见。常见问题的 `failure_domain` 只能是 `task_dir`、`worktree`、`review`、`verify`、`handoff`、`transcript`、`skill_missing`、`artifact_missing`、`token_waste` 九个受控值；`friction_type`、`error_code` 只能读取 health value 字段并通过受控 problem 投影传递，页面不能自由造词或自行补值，缺失/unknown 不进入“常见”聚合。
  - **范围边界**：高 token、长 duration 或高 retry 只是排行；只有事实能证明重复计数或冗余动作时才叫 token_waste。没有完整字段、来源或分母时必须保留 unavailable/insufficient/unknown。
  - **来源绑定**：R-003、R-004、R-007；D-001、D-002；M15-BASELINE；状态 `current`。
  - **PFACT**：PFACT-004、PFACT-007、PFACT-008。
  - **场景**：SCN-005、SCN-006。
  - **验收**：AC-008。

- **FR-PROJ-001**：项目和全局投影必须是 canonical facts 的可重建派生物，保留任务身份、来源引用、coverage、errors、生成时间和快照状态；投影失败不得修改或回滚 canonical facts。
  - **范围边界**：本期只保证新任务和当前投影，不迁移历史数据。
  - **来源绑定**：R-004、R-008；D-001、D-003、D-004；状态 `current`。
  - **PFACT**：PFACT-001、PFACT-004、PFACT-006。
  - **场景**：SCN-006、SCN-007、SCN-010。
  - **验收**：AC-009、AC-010。

- **FR-E2E-001**：一条 fresh Codex 任务必须贯通正式入口、canonical facts/evidence、项目/全局投影和 HTML/真实浏览器；基础 task/run/attempt/stage/source status/page state 链必须真实存在，宿主未证明的能力必须显示 `unavailable`、`unsupported` 或 `unknown`，不能借 fixture、目录扫描或猜测填满。
  - **范围边界**：不要求每类宿主事件都为 present，但要求每类都有诚实状态；不能用文件存在、API 返回或页面字符串替代中间绑定和浏览器验收。
  - **来源绑定**：R-001～R-004、R-008、R-009；D-001～D-004；状态 `current`。
  - **PFACT**：PFACT-001、PFACT-002、PFACT-004、PFACT-008。
  - **场景**：SCN-001、SCN-002、SCN-010。
  - **验收**：AC-010。

### 未来交接（HANDOFF）

- **FR-HANDOFF-001**：本任务结束时只向未来 M16 交接已证明的事实、来源能力矩阵、覆盖范围、缺口原因和重建规则；不在本任务生成经验回路、候选池、自动改法或质量分。
  - **范围边界**：M16 必须另起任务从 make-decision 开始，并自行决定如何消费这些事实。
  - **来源绑定**：R-009；D-001、D-002、D-004；状态 `deferred` for M16 capability, `current` for handoff contract。
  - **PFACT**：PFACT-006、PFACT-009。
  - **场景**：SCN-010。
  - **验收**：AC-011。

## 6. 模块划分

### 新任务记录

- **负责什么**：接住正式任务入口、身份、来源能力和新任务事实。
- **对外提供什么**：绑定 task/run/attempt/stage 的可回放事实，以及不可用原因。
- **依赖谁**：正式任务入口和已声明的宿主来源能力。
- **测试边界**：SCN-001、SCN-002、SCN-008、SCN-009。

### 事实派生与发布

- **负责什么**：从 canonical facts 计算诊断、成本、样本充分性和可重建投影。
- **对外提供什么**：带 coverage、errors、generated time 和快照状态的当前数据。
- **依赖谁**：新任务事实、质量 owner 的受控引用和固定拓扑。
- **测试边界**：SCN-004～SCN-007、SCN-010。

### M15 静态看板

- **负责什么**：四区、共享筛选、状态提示和安全展示。
- **对外提供什么**：用户可读的当前快照，不提供修改建议。
- **依赖谁**：canonical facts 生成的带身份、coverage 和生成时间的当前投影。
- **测试边界**：SCN-003～SCN-006、SCN-010。

## 7. 关键实体

- **Fresh task**：本期新创建、没有历史回填的任务；必须带 task、run、attempt 和 stage 归属。
- **Registered source**：被任务显式登记的来源；包含身份、可读能力、支持范围、格式/版本、绑定关系和安全边界。
- **Canonical fact**：一条可追溯的观察事实；包含 fact type、grain、source、status、coverage、归属键、value/reason 和 evidence ref。
- **Expected topology**：流程应有的阶段、step、skill、artifact 和顺序；只用于在事实充分时判定差异。
- **Projection snapshot**：由 canonical facts 重建出的当前页面数据；投影状态只能是 `current`、`partial`、`stale`、`unknown`、`fatal`，并包含 generated time、coverage、errors。canonical facts 的输入 hash/revision 晚于投影记录，或新 facts 已追加但未重新发布时为 stale；data.js 缺失、顶层合同不兼容、重建失败或来源身份/路径/安全校验失败时为 fatal。
- **Sample sufficiency**：按视图字段、任务范围和 time-window 判断的样本状态；取值为 sufficient、insufficient、empty_valid、unknown。

## 8. 数据和生命周期

- **数据粒度**：事实按 task/run/attempt/stage、step/skill、来源和事件粒度记录；成本按可去重的 message、tool-use、retry 或明确 start/end 记录。
- **数据时效**：新任务完成后追加事实并生成当前投影；页面打开或浏览器刷新读取一次快照。
- **缺失或迟到**：保留 missing、unknown、unavailable、unsupported、conflict、incomplete 和 reason；不补零、不补成功、不把迟到记录算成旧时点事实。
- **预览与正式**：页面只能展示带身份、coverage、errors 和生成时间的当前快照；没有这些绑定时显示 partial、stale 或 fatal。
- **当前与历史**：本期只写新任务；历史 M15 数据保持只读，不做迁移、补采或回填。
- **归属与清理**：canonical facts 由任务事实 owner 持有；project/global/HTML 是可删除、可重建的派生物；同一 facts hash 重建结果必须一致。

## 9. 兼容性预留

- **既有消费方**：保留 M15 四区、七类筛选和静态 HTML 使用方式；旧页面快照和历史任务只读。
- **历史显示**：历史 M15 任务不回填、不重写，只能以 `partial`/`missing` 语义展示，不能冒充当前完整任务或 `sufficient` 样本。
- **命名预留**：固定使用本规格的九种事件状态和六种页面状态；新增状态必须回到 make-decision，不在页面自由造词。
- **容器预留**：能力矩阵和 coverage 能容纳未来新增宿主事件，但未证明事件只能显示 unknown/unavailable/unsupported。
- **状态预留**：保留 sufficient、insufficient、empty_valid、unknown 的样本状态，不能压成布尔值。
- **扩展边界**：为 M16 保留事实引用、来源、粒度、时间和缺口说明；不承诺 M16 的候选池算法、排序或自动执行。

## 10. 明确不做与默认必须成立

### 明确不做

- 不处理历史数据、不回填旧任务、不修改历史页面快照（R-008；D-001、D-004）。
- 不实现 M16 经验回路、自进化候选池、候选排序、自动改法或自动执行（R-009；D-001、D-004）。
- 不实现多 CLI，只接入当前 Codex（调研输入；R-003、R-004；D-001、D-002）。
- 不做自动 canary、稳定版本选择或线上回退；这些能力延期，当前不声称支持（D-002、D-004）。
- 不自动修改、批准、上线或回退生产 skill（D-001、D-004）。
- 不新增 candidate ledger、successor/predecessor、selector、snapshot lineage 或新的公共流程阶段（D-001、D-004）。
- 不把未证明的宿主事件用 fixture、目录扫描、时间猜测或语义推断填满（D-002、D-003）。
- 不在 M15 生成质量分、根因结论或修复建议（D-002、D-003；M15-BASELINE）。
- 不轮询、自动重载或增加自定义刷新按钮（M15-BASELINE；D-001）。
- 不复制质量 owner 的原始 review/test/verify 内容，不建立第二套事实库或平行状态机（D-003、D-004）。

### 默认必须成立

- unknown、unavailable、unsupported、incomplete、missing 不得被改成 0、false 或 success（FR-FACT-002、FR-VIEW-002；AC-004、AC-006）。
- 采集缺口只有在适用性和来源能力都已证明时才能进入流程退化统计（FR-DIAG-001；AC-007）。
- 投影、页面或全局发布失败不得修改 canonical facts（FR-PROJ-001；AC-009）。
- 来源身份、路径和文本必须做权限与安全检查，来源文本只按普通文本展示（FR-CHAIN-002；AC-002、AC-010）。
- 页面状态和事实状态必须分开，partial 不能被解释成 workflow 失败（FR-VIEW-002、FR-DIAG-001；AC-006、AC-007）。

## 11. 验收标准

证据类型口径：`test` 是可重复执行的自动化检查；`manual` 是真实页面或正式入口的人工操作回放；`evidence` 是可按来源、身份和 hash 回读的 canonical fact、投影或受控引用。三者可以组合，但都不能用“文件存在”替代真实链路。

- [ ] **AC-001**：一条 fresh 任务从正式入口完成后，用户能看到同一 task 下的 run、attempt、stage、来源状态和页面当前记录，且没有依赖历史回填。
  - **需求**：FR-CHAIN-001
  验证：真实新任务回放正式入口到页面入口，逐项核对身份绑定和当前事实。
  - **通过条件**：task/run/attempt/stage/source 与页面记录同一任务绑定；基础链可回放。
  - **失败条件**：只看到手工 fixture、孤立页面字段、历史数据或无法绑定的来源。
  - **证据类型**：`evidence` + `manual`

- [ ] **AC-002**：来源登记和能力声明能区分支持、未登记、不可读、不支持、冲突和权限失败，不用猜测补齐宿主事件。
  - **需求**：FR-CHAIN-002
  验证：真实来源和受控不可用场景各走一次，并核对状态、原因、coverage 和安全边界。
  - **通过条件**：每种结果都有正确状态和可追溯原因；越界或未授权输入被拒绝。
  - **失败条件**：按目录或时间猜来源，或把不可读变成空成功/流程失败。
  - **证据类型**：`test` + `evidence`

- [ ] **AC-003**：同一新任务的事实、来源、粒度、coverage、value/reason 和 evidence ref 能互相回指，质量原始记录仍由原 owner 持有。
  - **需求**：FR-FACT-001
  验证：从 canonical facts 反查来源和质量记录，再检查同一粒度的冲突来源是否分别保留。
  - **通过条件**：链路可回放，冲突显式保留，没有静默择值或相加。
  - **失败条件**：只有页面数值、只有文件存在、或页面复制成第二份事实。
  - **证据类型**：`test` + `evidence`

- [ ] **AC-004**：事件状态和派生诊断分开，missing/乱序只在来源和适用性已证明时出现，unknown/unavailable/unsupported/incomplete 不被算作退化。
  - **需求**：FR-CHAIN-002、FR-FACT-002、FR-DIAG-001
  验证：覆盖正常、缺采、来源不支持、合法跳过、乱序和冲突的任务样例，查看事实和诊断两层。
  - **通过条件**：每种输入都有唯一明确语义、reason 和 coverage；采集缺口不进入退化统计。
  - **失败条件**：把没采到说成流程坏，把 skipped/not_applicable 说成退化，或用 pending 覆盖原始状态。
  - **证据类型**：`test` + `manual`

- [ ] **AC-005**：页面打开默认显示任务总览，提供四个区和七类共享筛选；切区保留筛选，刷新回默认，并能在任务总览下钻到退化和成本信息，展示项可回指受控来源和证据。
  - **需求**：FR-VIEW-001
  验证：浏览器打开页面，依次切换四区和筛选，刷新后观察筛选与下钻行为。
  - **通过条件**：四区、筛选和下钻均可操作，筛选范围没有跨区漂移。
  - **失败条件**：只有静态字段、筛选不生效、刷新行为与约定不符或缺少一个区。
  - **证据类型**：`manual` + `evidence`

- [ ] **AC-006**：页面能显示 loading、ready、empty_valid、partial、stale、fatal，并显示 generated time、coverage、errors、`in_scope_task_count`、所需字段覆盖和样本充分性；投影到页面的状态映射与本规格一致，stale/fatal 能显示触发原因。
  - **需求**：FR-VIEW-002
  验证：浏览器分别读取投影 current 且有任务、current 合法为空、partial、unknown、stale 和 fatal 快照，并检查四个视图的固定 required field set。
  - **通过条件**：状态与输入一致；partial/stale 不冒充 ready；fatal 不显示未经验证的数字；字段不足时样本状态为 insufficient 或 unknown，并给出原因。
  - **失败条件**：状态缺失、错误被吞掉、空白被当成功或 unknown 被显示为 0/false。
  - **证据类型**：`manual` + `test`

- [ ] **AC-007**：流程退化区只统计已证明的 missing、乱序或 required artifact mismatch，采集不可用、冲突和合法跳过在证据不足提示中单独显示；退化项和提示都能回指受控来源与证据。
  - **需求**：FR-FACT-002、FR-DIAG-001
  验证：用同一任务范围查看适用事件缺失和来源不可用两类数据，并比较退化统计与提示区。
  - **通过条件**：两类结果不混淆，退化项保留来源事实和 reason。
  - **失败条件**：按空白数量推断退化、输出根因/质量分/修法，或把不可用算进退化数量。
  - **证据类型**：`test` + `manual`

- [ ] **AC-008**：成本和趋势只展示可去重、可回指的数据，并按 outcome、process、efficiency 组织展示；趋势分母不足显示 insufficient/unknown，少于两个样本不称为常见；常见问题只接受九个受控 `failure_domain`，`friction_type`/`error_code` 必须来自 health value 和 problem 投影，缺失/unknown 不进入常见聚合。
  - **需求**：FR-COST-001、FR-VIEW-002
  验证：对 token、duration、retry、tool use、趋势和 outcome/process/efficiency 展示使用重复 ID、缺字段、小样本、正常样本和九个 failure_domain/受控 health 字段样例。
  - **通过条件**：去重和分母正确；不足时不造数字、不造趋势、不称常见；页面没有自由补造问题键。
  - **失败条件**：混加不同来源、把高成本叫浪费、用不明分母算比例或趋势，或 count=1 称常见。
  - **证据类型**：`test` + `evidence`

- [ ] **AC-009**：删除项目/全局/HTML 派生物后，只用同一份 canonical facts 重建，facts hash 不变，前后投影一致，投影失败不改事实。
  - **需求**：FR-FACT-001、FR-PROJ-001
  验证：对一个 fresh 任务记录 facts hash，移除派生物后重新生成并比较结果，同时注入投影失败。
  - **通过条件**：facts hash 前后一致；成功重建结果一致；失败只显示错误，不回滚或污染 canonical facts。
  - **失败条件**：重建依赖页面、重新写入历史任务或修改事实来掩盖投影失败。
  - **证据类型**：`test` + `evidence`

- [ ] **AC-010**：fresh Codex 任务能完整回放正式入口 → facts/evidence → project/global projection → HTML/浏览器；宿主未证明能力仍诚实显示 unavailable/unsupported/unknown。
  - **需求**：FR-CHAIN-001、FR-CHAIN-002、FR-E2E-001、FR-VIEW-002、FR-PROJ-001
  验证：使用一条没有历史回填的真实任务，按顺序核对入口、事实、证据、投影和浏览器显示，并保存每段绑定。
  - **通过条件**：基础链真实跑通；每个宿主细节都有 present 或明确缺失状态；页面状态与投影一致。
  - **失败条件**：只用 fixture、只验证文件存在、只验证 API 返回、缺少中间绑定，或把未采集字段显示成完整数据；若 fresh task 不能稳定生成并绑定 task/run/attempt/stage，或页面不能读回同一任务，只能交付证据缺口和明确延期，不得宣称 M15 基础交付完成，M16 也不得消费这条未闭合链。
  - **证据类型**：`evidence` + `manual`

- [ ] **AC-011**：当前交付不写历史任务、不实现 M16 候选池，但能向后续任务交接已证明事实、能力矩阵、覆盖范围、缺口原因和重建规则。
  - **需求**：FR-HANDOFF-001、FR-PROJ-001
  验证：检查 fresh 任务与历史任务的写入边界，并查看交接材料能否说明哪些事实可供未来 M16 使用。
  - **通过条件**：历史只读；交接只包含可追溯事实和明确延期，不包含候选排序或自动改法。
  - **失败条件**：补写历史、把 M16 需求偷偷放入本期，或交接只给一张没有来源的页面快照。
  - **证据类型**：`evidence` + `manual`

- [ ] **AC-012**：一条新的正常 Codex 任务从第一个正式阶段到第五个正式阶段，只自动绑定一次 source；五个阶段的 source identity、session、task/run/attempt 都能回指同一条绑定。用户不需要手填 task id，不需要启动 Stage Agent。
  - **需求**：FR-CHAIN-003、FR-E2E-001
  - **验证**：从真实 WorkflowHub `run` 入口启动 fresh 任务，依次执行五个阶段，分别回读每个阶段的 source fact 和任务事实；再制造一次后续阶段 source 丢失场景，检查入口是否明确失败而不是继续产出假完整记录。
  - **通过条件**：五个阶段 source 均为 `present` 且使用同一合法绑定；step/skill 事实能回到同一 task/run/attempt；source 丢失时状态为 incomplete/unavailable 并有原因。
  - **失败条件**：只有第一阶段有 source、后续阶段重新猜 source、需要用户重复输入、启动额外 Agent、跨 task 串数据，或 source 丢失后仍显示阶段完成。
  - **证据类型**：`test` + `evidence` + `manual`

## 12. 风险、未决与交接

- **RISK-001**：真实宿主来源或 caller 仍未接入所有声明事件。
  - **受影响 ID**：PFACT-002、PFACT-008、FR-CHAIN-002、FR-FACT-002、FR-E2E-001、AC-002、AC-004、AC-010。
  - **触发条件**：fresh task 不能提供同一 task/run/session 的来源登记或能力证据。
  - **后果**：页面只能部分可用；若误算为 missing，会把采集故障误报成流程退化。
  - **缓解或 STOP**：基础 task/run/attempt/stage 链或身份绑定不成立时 STOP；本任务只能交付证据缺口和明确延期，不得宣称 M15 基础交付完成，M16 不得消费未闭合链；宿主细节则保持 unavailable/unsupported/unknown。
  - **处理 Stage**：`build-code`
  - **验证**：fresh task capability matrix 与 facts 回放逐项一致。

- **RISK-002**：成本事件形状或分母不足，导致重复计数或虚假趋势。
  - **受影响 ID**：PFACT-007、PFACT-008、FR-COST-001、FR-VIEW-002、AC-006、AC-008。
  - **触发条件**：message/tool/retry identity 缺失，或筛选范围内没有合法分母。
  - **后果**：用户会把估算数字当成真实成本或流程结论。
  - **缓解或 STOP**：保留 unavailable/insufficient/unknown；没有可核实分母时不发布比例和趋势。
  - **处理 Stage**：`build-code`
  - **验证**：重复 ID、小样本和缺字段样例的页面结果可回指原始事实。

- **RISK-003**：投影或全局发布失败，页面无法与 canonical facts 对应。
  - **受影响 ID**：PFACT-001、PFACT-006、FR-PROJ-001、FR-VIEW-002、AC-006、AC-009。
  - **触发条件**：并发更新、派生物删除或发布中断。
  - **后果**：页面结论与 canonical facts 不一致。
  - **缓解或 STOP**：失败显示 stale/fatal，不修改 facts；按同一份 canonical facts 重建并核对身份、引用和 hash。
  - **处理 Stage**：`build-code`
  - **验证**：并发、失败和重建场景的 hash、快照和页面状态一致。

- **RISK-004**：expected topology 与真实入口存在差异，导致错误的退化结论。
  - **受影响 ID**：PFACT-003、FR-DIAG-001、AC-004、AC-007。
  - **触发条件**：fresh task 证明阶段、step、skill 或 artifact 事实不符合当前候选拓扑。
  - **后果**：正常流程被标成缺失，或真实缺步被漏掉。
  - **缓解或 STOP**：在证据确认前保持 unknown/incomplete；以 fresh task 事实修订产品契约，不静默适配。
  - **处理 Stage**：`verify-code`
  - **验证**：验收包逐项说明预期拓扑、实际事实和差异处置。

- **OPEN-001**：各类宿主事件在真实 Codex 入口中的最终支持范围仍待 fresh task 证明。
  - **受影响 ID**：PFACT-008、FR-CHAIN-002、FR-COST-001、FR-E2E-001、AC-002、AC-008、AC-010。
  - **owner**：本任务 build/verify 负责人。
  - **影响**：会改变哪些页面字段能显示 present，以及首版能否达到 ready 还是 partial；不改变基础链和诚实缺失边界。
  - **处理 Stage**：`verify-code`
  - **关闭条件或 STOP**：一条 fresh task 给出来源登记、能力声明、实际事件、coverage、原因和页面对应关系；未闭合则保持 open，不宣称全采集。

- **RISK-005**：阶段切换时 source handoff 仍可能丢失，导致第一阶段有真实来源、后续阶段只有拓扑或局部事实。
  - **受影响 ID**：PFACT-010、FR-CHAIN-003、FR-E2E-001、AC-001、AC-002、AC-010、AC-012。
  - **触发条件**：fresh 五阶段任务中任一后续阶段的 source_id、session 或 task/run/attempt 不能回到第一阶段的同一绑定。
  - **后果**：页面会显示部分成本和证据，用户无法确认整条任务；若继续当作成功，会再次产生误导数据。
  - **缓解或 STOP**：复用现有 session handoff；入口缺绑定就直接失败；保留 incomplete/unavailable；不使用目录扫描或历史回填。五阶段 source 未全部闭合时，M15 不得 close。
  - **处理 Stage**：`build-code`，最终由 `verify-code` 用真实五阶段任务复核。
  - **验证**：AC-012 的五阶段 source identity 对照和 source 丢失负面场景。

- **D-003 最小证据清单**：后续实现和验证必须依次核对真实 source/task/run/session 绑定、runtime run/attempt/stage 事实、Expected topology 基线、宿主已声明事件、M14b/M10 正常 caller、facts→projection→HTML 全链，以及九个 `failure_domain` 值和 health 字段绑定；任何一项没有证据都保留 `unknown`/`unavailable`/`incomplete`，不能靠页面结果补齐。

- **M17a 延期交接**：外部 skill registry 的更新检查交给 M17a；本任务不新增 registry 控制面。若该 registry 能力尚不可用，页面必须明确显示 `unavailable`，不能假装已经检查完成。

- **M17 延期交接**：多 CLI 支持交给 M17；本任务只接当前 Codex，不为其他 CLI 新增入口、来源或兼容层。

## 13. 业务影响与回归范围

### 新任务执行与记录

- **既有行为**：任务可产生局部 runtime/quality 记录，页面读取已有投影。
- **本需求影响**：新任务必须能回放正式入口、来源能力和 canonical facts 的绑定；未证明能力明确显示缺口。
- **回归路径**：SCN-001、SCN-002、SCN-008、SCN-009、SCN-010。
- **验收**：AC-001～AC-004、AC-010。

### M15 页面和投影

- **既有行为**：页面提供四区和筛选，但数据完整性、状态和来源可能不足。
- **本需求影响**：四区、筛选、样本充分性、状态和错误提示必须与当前快照一致。
- **回归路径**：SCN-003～SCN-007、SCN-010。
- **验收**：AC-005～AC-009、AC-010。

### 明确无影响

- 历史任务和历史页面不回填、不重写。
- M16 经验回路、自进化候选池和自动改法不在本期。
- M15 不成为任务继续执行的质量门，也不改变宿主私有生命周期。

## Spec Clarification Record

- **component**：`spec-clarify`
- **status**：`trigger=false`
- **reason**：D-001～D-004 和最终确认已经固定了页面范围、能力缺失语义、验证优先、基础链成功边界、样本充分性、hash 重建和 M16 延期；本阶段没有剩余会改变产品范围或验收的规格歧义。

## Spec Research Record

- **status**：`skipped`
- **reason**：当前 decision-log.md 已包含原始调研、历史 M15 页面基线、关键状态、Expected topology、fresh task 证据清单和最终确认；本规格无需新增外部事实才能明确用户行为。真实宿主能力仍是 build/verify 的事实验证，不由本阶段猜测。

## 下游交接

- `build-plan` 只能把本规格转成工程计划，先核对真实入口 caller、source/adapter、facts、projection 和页面的实际消费者；不得把 OPEN-001 猜成已支持。
- `build-code` 先做 D-003 的最小证据闭合，再按证据修 producer/source/projector/page；缺失能力保持原状态。
- `verify-code` 必须用一条 fresh 任务完成 AC-010，并证明 AC-009 的 facts hash、删除派生物重建和历史只读边界。
- M16 未来另起任务，从 make-decision 开始；本规格只交接可证明事实，不交接候选池或自动改法。
