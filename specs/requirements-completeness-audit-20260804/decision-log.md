# WorkflowHub 需求完整性审计：decision-log

这是本任务的第一份当前材料。它只记录：原始需求、需求/决策关系、分析来源、取舍、风险和延期交接。具体 FR、页面细节、任务拆分、测试步骤和证据格式留给后续 stage；后续 stage 不得借此重新猜需求。

状态：`make-decision / confirmed; handoff to build-spec pending`；D15-D16 已获得本轮用户确认，旧 D1-D14 确认仍保留为历史事实。当前 worktree 已有上一轮遗留的 `spec.md`、`plan.md`、`tasks.md`，但它们未被本轮 D15-D16 确认，不得自动视为当前 handoff；下一步由 `build-spec` 在同一任务中重审并修订。

## 原始需求

### 用户要求

| ID | 原始需求 | 来源 |
|---|---|---|
| R1 | 按标准 WorkflowHub 从 `make-decision` 开始，不跳阶段，不靠 `build-spec` 补需求。 | U0 |
| R2 | 调查五个根因：make-decision 漏需求、decision-log 不完整、build-spec 漏交付标准、verify-code 不回查原始需求、问题为何集中到最后才发现。 | U0 |
| R3 | 先派出超过 10 个子代理研究五份复盘报告，再开始本任务。 | U0 |
| R4 | Talk 用大白话说清选项、后果、风险；decision-log 记录原始需求、关键事实、选择、理由、延期交接。 | U0 |
| R5 | 五份报告中的问题要进入当前分析，并区分当前修复、后续交接、非目标和未决项。 | U0/U10 |
| R6 | 所有改动不得违反 WorkflowHub Constitution。 | U3 |
| R7 | 三个 provider 可用；调查调用失败根因，不改 wh-review/3rd-review 配置。 | U5 |
| R8 | 审查不影响其他任务；不在当前业务交付里调用共享 provider；失败/unavailable 必须保留。 | U4 |
| R9 | 正常推进发现的问题直接修复、提交合并 main，并作为当前任务需求记录。 | U8 |
| R10 | `make-decision` 的 confirm 不应强制读取尚未进入的 `spec.md`、`plan.md`、`tasks.md`。 | U7/U9 |
| R11 | 本轮要求：decision-log 不能只写摘要；但必须以需求点/决策点为单位，记录关系和来源，不要复制后续 spec。 | U11 |
| R12 | `talk`、`grill`、`clarify` 等需要和用户沟通的技能必须由主代理直接执行，绝不能交给子代理代替沟通。 | U12 |
| R13 | `make-decision`、`build-spec`、`build-plan` 结束时，必须用大白话告诉用户做了什么、产物摘要、风险和延期；用户看过摘要后才能交接到下一阶段。 | U12 |
| R14 | 质量保证不能用隐藏 gate 阻拦修复或交付；必须按 WorkflowHub Constitution 区分质量事实、推进资格、完成判据和不可逆授权。 | U12；Constitution F4/F7/F9/Q1/Q2 |
| R15 | 审查不可用是严重问题：调查 provider 输出为何被拒绝，直接修复并提交合并 main；不改共享配置，保留真实 unavailable 事实。 | U13；最新 build-plan 审查 attempt |
| R16 | 审查完成后必须由主代理逐条调研分析 finding，决定修复、无效驳回、明确承担风险或升级人工；不能无分析地直接推进。 | U13；五份复盘共同根因 |

### 五份报告的需求点

这些是本任务必须保留的输入，不是当前 WorkflowHub 要直接实现的业务功能。

| ID | 必须保留的需求语义 | 关系 |
|---|---|---|
| F15-1 | 策略列表、新建/复制、版本切换、回测、真实 `run_id`、报告回链。 | D1/D2/D4 |
| F15-2 | 进度、失败、策略版本、C10/F9/F11 等交付与协作结果不能只靠“任务完成”。 | D2/D5，后续业务任务 |
| F47-1 | 真实数据贯通 `Signal → OrderIntent → Fill → Position`。 | D1/D2/D4 |
| F47-2 | Footprint、方向颜色、信号 K、TP/SL/撤单、CVD/Delta/成交量等可见结果。 | D2/D4，后续业务任务 |
| KD-1 | `Home.md → 分类 → 语义主题页 → source-index` 的读者路径。 | D1/D2/D4 |
| KD-2 | 可读性、导航、独立人工读者验收，不能只用 claim/page/no-loss 数量代替。 | D2/D5，后续业务任务 |
| KD-3 | 模型、预算、失败、重试、来源和 Reader Package 要可追溯。 | D2/D5，后续业务任务 |
| KD-4 | review、manual close、formal close、results 和 provenance 必须分开记录。 | D5/D10 |
| F8-1 | 订单评论抽屉、绑定当前回测/订单、保存与失败状态。 | D1/D2/D4 |
| F8-2 | browser double-click、边界、恢复和用户可见失败要进入验收。 | D2/D4/D5，后续业务任务 |
| F8-3 | review 必须绑定当前 source snapshot；manual close 不等于 formal close。 | D5/D10 |
| M08-1 | 真实数据、5M K 线、策略、订单、成交、头寸、指标和权益曲线可复现。 | D1/D2/D4 |
| M08-2 | K/TTL/fill/cost/metrics 等 acceptance-critical 语义不能留给最后验收猜。 | D2/D4/D5，后续业务任务 |
| M08-3 | vNext/legacy、results、close、LFS/provenance 边界要如实记录。 | D5/D10 |

## 目标

让后续 stage 能从本日志回答三件事：用户要什么、为什么这样决定、后面必须证明什么；同时修复本次实际发现的 WorkflowHub 运行时断点。

## 范围

- 当前 WorkflowHub 的需求记录、Talk/Grill 结果、材料边界、证据状态、provider 调用边界和阶段交接。
- 所有需要用户回答的沟通、三个阶段的人工可读交接摘要，以及质量事实与交付推进的边界。
- 已确认的最小运行时修复：默认 provider 超时、未来材料读取、stage-content CAS latest 收口。
- 本轮新增的最小闭环修复：公开审查结果的私有路径安全恢复、协议错误分类、审查 finding 处置步骤和严重未解决 finding 的运行时质量提示。
- 五份报告的业务流程只作为需求保真和验收输入；具体业务页面留给对应项目。

### 决策级阶段链

1. 接收原始需求、约束和外部报告，保留来源。
2. 调研、Talk、Grill，关闭会改变方向的歧义。
3. make-decision 形成 `R*/F* → D*`，记录取舍、风险、边界；结束时主代理向用户展示大白话摘要并取得真实确认/看过记录。
4. build-spec 只把已确认决策展开；结束时展示大白话摘要并取得用户看过的交接记录，不新增正式业务确认点；发现新需求必须回到 make-decision。
5. build-plan 把同一批需求映射到任务、证据和交付顺序，不缩小范围；结束时展示大白话摘要，并取得该阶段所需的真实确认和看过记录后再交接。
6. build-code 只实现当前材料；新增用户结果、状态、数据或验收时建立 scope revision。
7. verify-code 逐项回放 `R*/F*` 和当前证据，输出 `pass/fail/unknown/deferred/unavailable`。
8. 业务交付、独立 review、formal close 和 handoff 分开记录。

## 成功边界

- 每个 `R*/F*` 都有来源、处理方式和唯一决策或明确延期。
- D* 能回放选择、理由、拒绝方案、风险、未决项和 supersedes。
- Talk、调研、Grill 和 review 的缺失/失败保持 `unknown` 或 `unavailable`，不写成 pass。
- 后续 stage 只能展开已确认需求；verify 必须回查原始需求和报告需求点。
- future material 缺失不算错误；非 ENOENT、hash、snapshot 或 provenance 异常必须暴露。
- 业务完成、测试、独立审查、交付和 formal close 不互相冒充。
- `talk`、`grill`、`clarify` 等沟通由主代理直接完成；三个阶段都有用户可读摘要和真实看过/确认记录。
- 质量 finding、测试失败、review unavailable 等作为事实浮现，不阻止同任务修复或正常业务交付；缺失事实不能被写成完成。
- 每次审查后必须先形成逐条 finding 处置摘要，再交接；处置摘要本身是质量/交接事实，不是隐藏质量 Gate。

## 失败边界

- 原始需求或来源无法逐项回放。
- build-spec/build-plan/code/verify 偷偷新增或缩小需求。
- 没有真实 evidence、review 或 confirm 却宣称完成。
- 权限、篡改、格式损坏等非 ENOENT 读取错误被宽泛吞掉。
- 历史 review/snapshot/confirmation 被拿来支撑当前材料。
- manual close、Git merge 或 make check 被误写成 formal close。
- 子代理代替用户沟通、伪造用户回答，或没有展示摘要就静默跨阶段。
- provider 输出协议失败被吞成 UNKNOWN、或审查 finding 未分析就直接 handoff。
- review/test/evidence 被当成隐式交付 gate，或反过来因质量缺失宣称完成。

## 非目标

- 不实现 PaperBuilder、KnowledgeDigest 的业务页面、策略、订单或知识产品。
- 不改 wh-review/3rd-review 配置，不换 provider，不新增自动重试。
- 本任务的材料审查只记录真实结果，不把失败/unavailable 改成 pass，也不把审查结果冒充用户确认。
- 不新增 selector、lineage、recovery、continuation、replacement review、双写或永久平行控制面。
- 不删除或覆盖历史 receipt、review、snapshot、失败和 unavailable 记录。
- 本次确认动作不新建 `spec.md`、`plan.md`、`tasks.md`；worktree 中已有的上一轮文件只作为当前材料/审计事实读取，必须经过 `build-spec` 重审后才能作为新的下游输入。

## 决定

每项使用紧凑的 `decision-entry.v1` 字段；`R*` 和报告需求点是输入，`D*` 是选择，后续 stage 只能细化其交付方式。

### D1：decision-log 的职责是“决策索引”，不是 spec

- **关系**：R1、R4、R11 → D1；取代本任务旧的 1,182 行冗长版本。
- **问题/选择**：日志应写完整 spec，还是写原始需求点、决策和来源关系？选择后者。
- **推荐/大白话**：`recommended / pending user confirm`。日志回答“要什么、选什么、依据什么”；页面、字段、测试步骤不在这里展开。
- **来源**：U11：“应该按照决策点或需求点来逐个记录，并且记录这些决策点和需求点的关系，以及具体来源等。”
- **事实/推理**：旧日志同时写需求、流程、状态、AC、后续设计，造成上下文浪费和 spec 重复；压成摘要又会丢需求。故保留索引级事实，不复制实现级细节。
- **决定/影响**：以 `R* / F*-* → D* → 后续 stage` 为主链；后续 spec 只展开已存在的节点。
- **后果/风险**：日志更短；如果下游不读取关系仍会漏需求。后续必须拒绝无来源的新 FR/AC。
- **拒绝/未决**：拒绝“只写五条结论”；拒绝“再建永久 requirement 台账”。具体结构化派生视图留后续 runtime 设计。
- **supersedes/批准**：`supersedes=旧 1,182 行版本`；Talk 绑定 T1/T2；正式确认 accepted。

### D2：每个重要需求都要有唯一的决策/来源关系

- **关系**：R2、R4、R5、F15-*、F47-*、KD-*、F8-*、M08-* → D2。
- **问题/选择**：只记录“报告已覆盖”，还是逐个列出需求语义并指向决策？选择逐个列出。
- **推荐/大白话**：`recommended`。每个需求点至少能找到来源、当前处理方式和后续归属。
- **来源**：五份报告；审计共同事实是粗粒度 `3/3、4/4、5/5` 不能证明用户结果已覆盖。
- **事实/推理**：报告中的页面、读者、订单、版本、真实数据和 close 语义被摘要吞掉；需求点矩阵能暴露“当前修复/后续/非目标/未决”。
- **决定/影响**：本日志保留需求点 ID；build-spec、build-plan、verify-code 必须引用这些 ID，不得另起一套来源。
- **后果/风险**：映射维护有成本；遗漏会在 coverage audit 暴露，而不是到最后才发现。
- **拒绝/未决**：拒绝单一 `source_manifest` 占位；后续阶段细化每个需求点的 FR/AC/task/evidence。
- **supersedes/批准**：`supersedes=旧日志“报告路径已记录即覆盖”`；正式确认 accepted。

### D3：Talk 同时覆盖架构和用户结果

- **关系**：R3、R4、F15-1、KD-1、F8-1、M08-1 → D3。
- **问题/选择**：Talk 只问架构，还是也问用户旅程、数据、状态和验收影响？选择两类都问。
- **推荐/大白话**：`recommended / Round 1-2 已选 B`。不只问“怎么搭”，还要问“用户最后要看到什么”。
- **来源**：T1/T2；报告共同问题是架构方向收敛了，产品旅程却没有进入验收。
- **事实/推理**：只维护 architecture queue 会漏策略列表、读者导航、订单生命周期、真实回测和 UI 失败；增加 product-journey queue 可在 make-decision 截住这些遗漏。
- **决定/影响**：Talk 记录选项、后果、风险、用户选择和队列变化；当前旧 payload 缺完整 A/B/C 原文，按缺失处理。
- **后果/风险**：问题数增加；只问会改变范围、结果、状态、数据或验收的问题，避免无限追问。
- **拒绝/未决**：拒绝“多开几轮就会完整”；各领域问题模板留后续任务。
- **supersedes/批准**：`supersedes=只保留方向问题的 Talk`；T1/T2；正式确认 accepted。

### D4：build-spec 只能展开，不能补需求

- **关系**：R1、R2、R4、F15-*、F47-*、KD-*、F8-*、M08-* → D4。
- **问题/选择**：缺口到 build-spec 再补，还是在 make-decision 暴露？选择前者禁止、后者要求回流。
- **推荐/大白话**：`recommended`。spec 是把已经决定的事写具体，不是第二次产品讨论。
- **来源**：U0：“不要依赖 build-spec 补需求”；报告共同根因是每阶段只验证自己看到的缩小材料。
- **事实/推理**：如果 spec 可自由补需求，原始需求没有稳定边界，verify 只能证明 spec 自洽；需求点→决策→spec 的单向展开可定位遗漏。
- **决定/影响**：spec 发现新增页面、状态、数据、用户结果或验收时，必须回到 make-decision 形成 scope revision。
- **后果/风险**：回流会增加一次确认成本；换来的是真实范围而不是静默猜测。
- **拒绝/未决**：拒绝 build-spec 作为“补需求阶段”；具体 revision schema 留后续实现。
- **supersedes/批准**：`supersedes=后续 stage 自行补需求`；正式确认 accepted。

### D5：把业务、测试、review、交付和 formal close 分开

- **关系**：R2、R5、R8、F8-3、KD-2、KD-4、M08-3 → D5。
- **问题/选择**：一个 green/accepted 是否代表全部完成？选择不代表。
- **推荐/大白话**：`recommended`。代码过测、用户能用、审查通过、业务交付、正式关闭是五件事。
- **来源**：F8/KD/M08 报告；已有事实包括 `unknown`、`unavailable`、manual close 和旧 snapshot。
- **事实/推理**：把不同状态合并会把缺证据变成 pass，也会让旧 review 支撑新代码；分开记录才能知道缺哪一扇门。
- **决定/影响**：后续 verify 必须逐项输出 `pass/fail/unknown/deferred/unavailable`，并绑定当前 snapshot；formal close 单独判断。
- **后果/风险**：状态展示更复杂；但不会再用一个绿灯掩盖 reader、browser、review 或 close 缺口。
- **拒绝/未决**：拒绝“make check 0 就完成”；review aggregation、close preflight 延期到隔离 runtime 任务。
- **supersedes/批准**：`supersedes=旧日志把质量状态当完成证明`；正式确认 accepted。

### D6：provider 失败修 WorkflowHub 代码，不动配置

- **关系**：R7、R8 → D6。
- **问题/选择**：改配置/重试/换 provider，还是修 WorkflowHub 隐藏超时？选择修代码。
- **推荐/大白话**：`recommended-and-approved by Talk Round 3`。WorkflowHub 不提前 120 秒挂电话；显式 timeout 仍有效。
- **来源**：U5：“不希望修改 wh-review 的配置”；T3；代码事实：默认 120 秒墙钟，真实 300 秒调用可完成。
- **事实/推理**：客户端先超时不等于 provider 不可用；去掉隐藏默认限制并交给 managed broker，能保留真实失败语义。
- **决定/影响**：已改 ReviewProviderClient；不新增 provider、不重试、不改配置。
- **后果/风险**：等待可能更久；broker/provider 真实失败仍会原样暴露。
- **拒绝/未决**：拒绝配置改动、自动重试、把认证失败统一归因 provider 不可用；隔离 smoke 后续执行。
- **supersedes/批准**：T3；正式确认 accepted。

### D7：未来阶段材料缺失是正常阶段状态

- **关系**：R1、R10 → D7。
- **问题/选择**：预创建未来文件，还是当前阶段只读当前已有材料？选择后者。
- **推荐/大白话**：`approved by user instruction`。make-decision 只有 `decision-log.md` 很正常；不存在的未来文件按 `null`，损坏文件仍报错。
- **来源**：U7/U9：“这些文件是后面的任务吧？”；已修复并有回归测试。
- **事实/推理**：无条件读取未来文件会自阻断；预创建空文件会伪造阶段顺序。只有 ENOENT 可转为 `null`；权限拒绝、篡改、格式损坏等非 ENOENT 错误必须继续抛出，保持 fail-loud。
- **决定/影响**：make-decision 的 confirm、grill、status 不再要求 `spec/plan/tasks`；后续材料进入后重新形成 freshness。
- **后果/风险**：早期确认可能因新材料进入而 stale；必须重新检查当前 revision。
- **拒绝/未决**：拒绝预创建空文件、catch 所有读取错误；旧确认 freshness projection 留后续 runtime 任务。
- **supersedes/批准**：`supersedes=旧日志“补齐未来文件”`；正式确认 accepted。

### D8：stage-content 必须同时收口 revision 和 latest 指针

- **关系**：R9 → D8。
- **问题/选择**：保留已生成 revision 但 latest 不变，还是用现有 CAS writer 收口？选择 CAS writer。
- **推荐/大白话**：`approved by normal progression`。版本写完后必须能安全切到当前版本；冲突仍明确失败。
- **来源**：实际 incident：immutable revision 已生成，但退役 replacement API 拒绝 latest 更新；已有回归测试。
- **事实/推理**：只写 revision 会留下半成品；复用既有 capability/CAS writer 可修复闭环，不新增第二套 current view。
- **决定/影响**：已修 stage-content revision/latest pointer；覆盖 immutable bytes、CAS、latest reader 和冲突失败。
- **后果/风险**：并发冲突仍需人工处理；不能静默覆盖。
- **拒绝/未决**：拒绝新增 latest 文件、自动吞冲突、恢复退役 replacement API；无当前未决实现项。
- **supersedes/批准**：`approved by user “正常推进问题直接修复”`；正式确认 accepted。

### D9：执行事故也属于当前需求事实

- **关系**：R9、R11 → D9。
- **问题/选择**：只修代码，还是记录事故对当前材料和验收的影响？选择记录并修复。
- **推荐/大白话**：`recommended-and-user-directed`。本任务自己出现的假绿、过期确认和错误材料也不能丢。
- **来源**：U8/U10；本次事实：曾误建 `spec/plan/tasks`，随后删除；旧确认和质量 projection 需要重新判断 freshness。
- **事实/推理**：过程事故会污染后续状态；不记录就会重用 stale evidence，正好复现本任务要解决的问题。
- **决定/影响**：INC-001 provider failure、INC-002 future read、INC-003 CAS、INC-004 误建未来文件、INC-005 stale confirm、INC-006 quality projection、INC-007 文档计数、INC-008 review packet 映射层级错误、INC-009 占位材料诊断、INC-010 公开审查结果含私有路径、INC-011 审查 finding 未分析即 handoff、INC-012 本地 Git object database 缺失历史对象均进入交接。
- **后果/风险**：当前不能沿用旧 completed 结论；历史记录保留但只读。
- **拒绝/未决**：拒绝删除事故记录、继续使用旧 confirm；stale projection 的机器化显示延期。
- **supersedes/批准**：`supersedes=旧日志“最终确认已足够”`；正式确认 accepted。

### D10：共享 review、legacy/close 问题隔离延期

- **关系**：R8、R9、F8-3、KD-4、M08-3 → D10。
- **问题/选择**：当前任务直接改共享审查/配置，还是记录事实并交给隔离任务？选择隔离延期。
- **推荐/大白话**：`user-directed boundary`。问题不能消失，但不能为了本任务影响其他任务。
- **来源**：U4；现有 review 事实为 0/1 valid reviewer、三个 provider timeout、`unavailable/open`。
- **事实/推理**：review aggregation、host bridge、results publication、vNext/legacy 和 close 是独立故障域；当前修改它们会扩大影响。
- **决定/影响**：允许本任务对 decision-log 做只读材料审查；共享 review aggregation、snapshot freeze、results/close preflight、legacy 边界和配置/控制面改动交给隔离任务。当前只保留失败和交接，不能把材料审查当成 formal close。
- **后果/风险**：本任务不能宣称 formal close；其他任务仍可能受影响。
- **拒绝/未决**：拒绝改共享配置、伪造 review pass、删除 legacy 历史；owner 和实现方案需新任务确认。
- **supersedes/批准**：T3/U4；正式确认 accepted。

### D11：所有未来项目采用同一份 decision-log 最低结构

- **关系**：R4、R11、R12、R13、R14 → D11；D11 约束未来项目的 make-decision，不把本任务的长文当模板。
- **问题/选择**：每个项目自行决定日志写法，还是固定一个索引级最低结构？选择固定最低结构。
- **推荐/大白话**：`recommended / pending user confirm`。以后每份日志都要能还原“用户要什么、依据什么、选了什么、为什么、怎么判断方向合理、后面交给谁”；但不写成 spec。
- **来源**：U11：“让以后所有的decision-log都包含所有原始需求、调研重点、talk结论、grill结果、推理结果……作为后续所有stage的核心参考文档”；U12 的沟通、摘要交接和质量边界要求；比较审查报告 `44357fd2-016d-457a-96fe-bce8cc9a08e8`、`200bca63-af28-4341-ba6f-99c6ca156ca1`。
- **事实/推理**：旧详细版保留了较多事实但与 spec 重复；新精简版保留了 R/F/D 矩阵但漏了阶段骨架、边界和证据锚点。故固定索引级字段，而不是恢复实现细节。
- **决定/影响**：未来 decision-log 至少包含：`原始需求/约束+来源`、`外部输入/调研重点+处理状态`、`目标/范围/非目标`、`决策级阶段链`、`Talk（问题/选项/选择/队列/evidence）`、`Grill（CONTEXT/ADR/冲突/四项退出/evidence）`、`D*（选择/来源摘录/事实约束/推理/理由/影响/后果风险/拒绝/未决/supersedes/批准）`、`成功/失败边界`、`审查处置`、`风险/延期交接`、`阶段末大白话摘要与用户看过状态`、`质量事实/推进资格/完成判据/不可逆授权边界`。
- **后果/风险**：每份日志会比纯摘要长，但不会重复页面字段、FR/AC 细节、任务、测试步骤或证据 schema；漏掉任一最低字段会再次让后续 stage 猜需求。
- **拒绝/未决**：拒绝“只写 R/F/D 三张表”；拒绝“复制完整用户流程和 spec”；未来是否机器校验该最低结构，交给独立 runtime 任务。
- **supersedes/批准**：`supersedes=仅把当前任务 D1 当作局部做法`；本 D11 是跨项目规范；正式确认 accepted。

### D12：用户沟通技能必须由主代理直接执行

- **关系**：R12 → D12；约束所有未来任务的 `talk`、`grill`、`clarify` 和同类用户沟通技能。
- **问题/选择**：沟通技能交给子代理代跑，还是由主代理在用户可见上下文直接完成？选择后者。
- **推荐/大白话**：`recommended / pending user confirm`。需要用户回答的问题必须真的问到用户；子代理可以研究和整理事实，但不能代替用户回答、确认或做沟通结论。
- **来源**：U12：“talk、grill、clarify等技能需要和用户沟通的，一定要保证沟通，绝对不能用子代理执行。”当前 host-visible ref/hash 未提供。
- **事实/推理**：本任务审计发现沟通技能被默认放进子代理后，用户没有看到问题，也没有产生真实回答；研究结论不能冒充用户选择。故把“用户沟通所有权”固定给主代理。
- **决定/影响**：主代理直接运行沟通技能并展示问题、选项、后果、风险和回答；子代理只能提供研究、对照和草稿，不得写入用户回答或确认状态。
- **后果/风险**：主上下文会承担沟通成本；换来的是真实用户选择和可追溯交接，不能用并行节省上下文掩盖沟通缺失。
- **拒绝/未决**：拒绝“子代理代问再转述”；拒绝“根据历史或推测补用户答案”；具体 runtime ownership 检查延期到隔离实现任务。
- **supersedes/批准**：`supersedes=沟通技能可默认委托子代理的隐含行为`；正式确认 accepted。

### D13：三个阶段结尾必须有人看过大白话交接摘要

- **关系**：R13 → D13；约束 `make-decision`、`build-spec`、`build-plan` 到下一阶段的交接。
- **问题/选择**：阶段结束只写内部材料，还是先向用户解释并让用户看过摘要？选择后者。
- **推荐/大白话**：`recommended / pending user confirm`。阶段结束时必须告诉用户“做了什么、产物是什么、还缺什么、风险是什么、下一阶段不能猜什么”；用户看过后才能声明已交接。
- **来源**：U12：“make-decision、build-spec、build-plan三个阶段结尾的时候，一定要用大白话把当前阶段做了什么，产物的总结摘要是怎样告诉给用户……必须要保证人看过大白话总结摘要，在进入下一个阶段！”原来设计的流程 ref/hash 未提供。
- **事实/推理**：没有人可读摘要时，材料即使存在，用户也无法发现遗漏；阶段会把错误假设静默传给下一阶段。摘要是人工交接事实，不是质量 verdict，也不新增 build-spec 的正式业务确认点。
- **决定/影响**：三个阶段结尾都要由主代理发送短摘要，包含完成内容、产物摘要、未决/延期、主要风险和下一阶段边界；必须记录用户看过/确认的真实结果，未看过就不能静默 handoff。
- **后果/风险**：阶段交接会多一次人工等待；这是为避免需求遗漏的必要通信成本。用户未回复时保持 `in_progress/pending`，不得假定已看过。
- **拒绝/未决**：拒绝只生成机器 receipt；拒绝子代理代发摘要或伪造已读；摘要的最小结构和 runtime 记录方式延期到对应阶段技能实现。
- **supersedes/批准**：`supersedes=原有但执行中经常遗漏的阶段末人工摘要交接`；正式确认 accepted。

### D14：质量保证是事实与人工把关，不是隐藏交付 gate

- **关系**：R14 → D14；与 D5、D10、D12、D13 共同约束质量、交付和人工交接边界。
- **问题/选择**：测试、review、evidence 缺失或 finding 出现就自动卡住修复/交付，还是记录事实并允许同任务继续？选择后者，并保持完成结论诚实。
- **推荐/大白话**：`recommended / pending user confirm`。质量检查负责告诉人哪里有问题、证据是什么、状态是 `pass/fail/unknown/unavailable/incomplete`；不能偷偷变成“没有绿灯就不能修”。
- **来源**：U12：“所有质量保证不能用gate阻拦交付，需要保证完全符合workflowhub的宪法！”；Constitution F4/F7/F9/Q1/Q2 与 checklist F4/Q1/Q2。
- **事实/推理**：宪法明确质量事实不是开始/继续修复的许可证，finding 不锁死同任务修复；但缺少实际测试、逐 AC、独立 review 或交接时不能宣称阶段完成，结构错误和不可逆操作仍按宪法 fail-loud/独立授权。故必须分开“能继续工作”“能真实发布”“能宣称完成”。
- **决定/影响**：不新增质量 gate；质量结果自动浮现并保留原始失败/unavailable，严重 finding 采用“先修复（推荐）或由用户明确承担具体风险”；同任务可继续修复和交付，但完成/formal close 不能伪造，commit/push/merge 等仍需独立授权。
- **后果/风险**：质量不足不会阻止当前修复，但可能让阶段保持 `in_progress` 或完成结论为 `unknown/incomplete`；如果只看交付动作而不看完成判据，仍会出现假绿。
- **拒绝/未决**：拒绝 provider/test/review 自动卡死工作；拒绝删除质量工作或把缺失写成 pass；各阶段具体质量事实、逐 AC 和交接证据由后续阶段按当前材料补齐。
- **supersedes/批准**：`supersedes=把质量检查当交付闸门或把质量缺失当完成的两种错误行为`；正式确认 accepted。

### D15：公开审查结果先修安全协议，不改共享 provider 配置

- **关系**：R7、R8、R9、R15 → D15；直接处理最新 build-plan 审查不可用事故。
- **问题/选择**：provider 已实际运行，但最终输出含私有绝对路径，3rd-review 将整组结果拒绝为 `PUBLIC_RESULT_INVALID`；选择改 broker/adapter 的安全公开输出恢复，不改配置、不把失败改成 pass。
- **推荐/大白话**：`recommended / 已按用户授权修复并合并`。provider 在同一原生会话里重写一份不含私有路径的完整 JSON；重写仍不合规就保持 unavailable。
- **来源**：最新 build-plan attempt `e3c40da8-bd0d-448f-9927-8b3904dc92ec`；3rd-review 修复提交 `6335345`，main 合并后 `4210810`；3rd-review 顺序回归 `257 passed / 0 failed`。
- **事实/推理**：这是公开协议/传输安全失败，不是语义 review pass/fail；WorkflowHub 不做文本脱敏冒充结果。原始失败仍保留，安全重写失败仍 unavailable；WorkflowHub 报告把 `PUBLIC_RESULT_INVALID`、`PROTOCOL_INCOMPATIBLE`、`MATERIAL_INCOMPLETE`、`PROFILE_MISMATCH` 按真实码分类，不再统称 `UNKNOWN`。
- **决定/影响**：已给支持 continuation 的 cursor/kimi/opencode/grok/claude-code adapter 统一安全重写契约；不改 `/Users/Hugh/.config/3rd-review/config.json` 或 WorkflowHub provider 配置，不加自动重试。
- **后果/风险**：provider 仍可能输出无法公开的内容，届时审查仍不可用；这比泄露私有路径或伪造语义结果安全，需在后续阶段如实显示 unavailable。
- **拒绝/延期**：拒绝原始文本清洗、改配置、换 provider、把 group-level failure 拆成假的 provider pass；本任务只收口公开协议，provider 质量和审查聚合继续按独立事实记录。
- **supersedes/批准**：`supersedes=把全部 provider 失败归因于 provider 不可用`；代码修复已获用户“按推荐修复并继续”的授权；本轮用户已确认 D15。

### D16：审查后必须完成逐条分析—处置—交接闭环

- **关系**：R2、R8、R14、R16、D5、D14 → D16；处理“审查完成后直接往后推进”的流程断点。
- **问题/选择**：review 产生 findings 后直接更新任务/进入下一阶段，还是先逐条说明原因和后果并决定下一步？选择后者，同时不把质量变成修复 Gate。
- **推荐/大白话**：`recommended / 当前已落最小闭环`。主代理必须对每个 finding 记录 `fixed`、`rejected_invalid`、`accepted_risk` 或 `needs_human`；有效问题回到同一 Task 修复并重跑受影响检查，严重未解决问题只能修复或让用户明确承担风险，原 verdict 永不改写。
- **来源**：U13；五份复盘共同事实；代码审查发现 `build-code`/`verify-code` 原 work loop 在 review 后直接 capture/publish，`reviewFacts()` 只保留粗粒度 warning；Constitution F4/F7/F9/Q1/Q2。
- **事实/推理**：如果没有逐条处置，后续 stage 只能看到“review 做过”，无法知道哪些问题已调查、哪些已修复、哪些只是风险；但 Constitution 明确质量事实不能阻止同任务修复或普通推进。因此采用两层修复：技能/step 明确要求处置，运行时把 clusters 和 serious unresolved findings 浮现为 `missing_items`，而不是新增隐藏许可状态。
- **决定/影响**：`build-code`、`verify-code` 在 review 后新增 `analyze-review-findings` step；`build-spec`、`build-plan` 明确要求主代理在 handoff 前逐条记录 finding disposition；运行时保留原 review、增加逐条分析提醒和 serious repair-or-risk 提醒；处置摘要写入当前 Task completion area。
- **后果/风险**：主代理需要多做一次分析，避免把 provider 意见机械当命令；当前运行时还不能从自由文本 Task completion 自动验证每个 disposition 的证据绑定，因此本轮先保证流程不再静默跳过，正式的最小证据字段在本任务后续 build-spec/build-plan 设计中补齐。
- **宪法边界**：处置 step 是质量/交接事实，不是质量 Gate；`revise_required`、`unavailable`、timeout、invalid 永不变成 pass；不新增 public command、successor、re-review flow、response ledger、selector、rebind 或第二套 completion 状态机。
- **拒绝/延期**：拒绝“review receipt 存在即视为已分析”、拒绝自动把 minor/major 统一卡死、拒绝创建新的 review resolution 控制面；逐条处置证据的最终结构、消费者和删除/保留条件交给当前任务后续 spec/plan，不能在 build-code 临时猜。
- **supersedes/批准**：`supersedes=review 完成即可直接进入下一步的隐含流程`；本轮用户已确认 D16，下一步进入 `build-spec` 细化处置证据和验收边界。

## 三轮 talk

- **T1 / Round 1**：用户选 `B`，方向为调查并修复最小闭环；完成证明仍开放。来源：`host-message://reply/make-decision/talk-round-1/q1`；canonical evidence：`evidence/stage-content/23a667f39b3bd64017c5401e6a3b23ced2e8b6dd5848230d40834be8e24310b4/interaction-completion.talk-0001.json`，sha256 `f4467bb2d34fbe1cfd909bda28a9670a7c234c88c8fcba231b92aefeebf1086c`。
- **T2 / Round 2**：用户选 `B`，接受完整五阶段链路、五份报告逐项回归、共享追踪/证据契约和 Constitution 边界。来源：`host-message://reply/make-decision/talk-round-2/q1,q2`；canonical evidence：同目录 `interaction-completion.talk-0002.json`，sha256 `eadc5625003b6926885b5b0b772ed03d84e251adab743ffd87dd5bc7982a9dce`。
- **T3 / Round 3**：用户选推荐的代码修复；不改配置、不自动重试、保留 provider failure。来源：`host-message://reply/make-decision/talk-round-3/q1`；canonical evidence：同目录 `interaction-completion.talk-0003.json`，sha256 `675f0a4a073ba173ab89159154e6f3e2498b6d8f82f01cf5e1f0957e03bd93f9`。
- **T3 的盲审风险补记**：这不是伪造原始 Talk payload，而是对审查发现的覆盖结论：材料审查是输入，不是用户确认；本轮外部 provider 覆盖不完整，`PUBLIC_RESULT_INVALID`、`SAME_SOURCE` 和 provider unavailable 必须保留；只采纳有有效锚点的结构修正，不恢复旧详细版，不把聚合 `pass` 当作完成。剩余风险是用户仍未正式确认、Talk 原始选项正文缺失、审查覆盖可能继续受 provider 输出契约影响。
- **记录缺口**：当前 payload 只有 selected option、refs、hash、队列和结束原因，没有完整 A/B/C 选项正文；不补写。后续 Talk writer 必须保存问题、全部选项、后果、风险、回答和队列变化。
- **U12 的沟通处理**：本轮 U12 是明确的新增要求，不是需要二选一的 Talk 问题；没有另开 Talk/Grill/Clarify 回合，也没有让子代理代替沟通或补写用户回答。若后续出现会改变方向的歧义，必须由主代理直接向用户提问并记录真实回答。

## 调研

执行事实：已使用 13 个研究角色；五份报告均已读并交叉归纳。研究 receipt：`quality/tests/research.json`，sha256 `422f4044bfc68952c8ca917057e6930e51f7825943b49a0727e1b2936457ffe0`。外部搜索未作为本任务必要输入，本地指定报告不能因跳过外部搜索而跳过。

| 来源 | 改变决策的事实 | 当前处理 |
|---|---|---|
| F15 | 流程和策略细节被粗 coverage 隐去；列表、版本、run、进度、协作结果未成链。 | D1/D2/D4；业务细节延期。 |
| F4/F7 | 真实订单链和视觉/指标语义未进入验收。 | D2/D4/D5；业务细节延期。 |
| KnowledgeDigest | 有产出不等于读者可用；Home、导航、人工语义验收、模型失败账本被漏掉。 | D2/D5；Reader 任务延期。 |
| F8 | 评论抽屉、browser 行为、失败恢复、snapshot 绑定和 manual/formal close 被混淆。 | D2/D5/D10；业务与 review 隔离。 |
| M0.8 | K/TTL/fill/cost/metrics、真实数据和 vNext/legacy/results 边界未固化。 | D2/D5/D10；domain profile 延期。 |

共同根因：上游把原始需求压成少数摘要；后续阶段只检查当前材料自洽；证据状态和交付状态混用；revision/snapshot 变化没有使旧结论失效。

## grill

- **结论**：D1-D10 与 Constitution 的单一当前材料、历史只读、无新永久控制面边界一致。
- **检查结果**：术语/CONTEXT 一致；阶段读取边界、provider 生命周期、CAS latest、失败语义和延期范围均有代码或测试事实支撑。
- **四项退出检查**：上下文一致、接口/owner 一致、失败语义明确、范围与延期明确；均通过。
- **CONTEXT.md**：no-change；本任务没有新增领域术语。
- **ADR**：not-needed；没有新增难以逆转的架构。标准化“日志与 spec 的边界”若成为跨任务架构，再单独建 ADR。
- **三项 ADR 判断**：难以逆转=`否`；无上下文会意外=`是`；存在真实取舍（完整性/上下文成本）=`是`，本任务用 decision-log 记录即可。
- **canonical evidence**：`evidence/stage-content/23a667f39b3bd64017c5401e6a3b23ced2e8b6dd5848230d40834be8e24310b4/interaction-completion.grill.json`，sha256 `eae1e21dab425abcd8a452cde70678f68360feeff37ac1ba867ad8b540910798`。
- **限制**：CONTEXT/ADR/冲突/四项退出检查有明确结论；既有 Grill payload 的逐题 rounds 不完整，保持 `unknown`，不假造逐题回答。

## 审查处置

本轮比较审查已真实调用 `wh-review` detail：首次完整 A/B 比较 attempt `44357fd2-016d-457a-96fe-bce8cc9a08e8` 有 3 个异源 provider 完成，`codex/terra` 因 `SAME_SOURCE` 排除，聚合 verdict=`pass`；按该轮有效锚点采纳了阶段链、成功/失败边界、证据路径、D7 fail-loud、KD-4 定义和 D11 最低结构等修正。修正后的复审 attempt `200bca63-af28-4341-ba6f-99c6ca156ca1` 聚合 verdict=`pass`：`antigravity/flash` 有效完成，`kimi/k3` 与 `cursor/grok` 因输出含私有绝对路径而为 `PUBLIC_RESULT_INVALID`，`codex/terra` 仍为 `SAME_SOURCE`；这些 provider 失败事实不改写为质量通过。复审还发现并要求修正两点：T3 补盲审假设/剩余风险覆盖；“未决项”必须保持 `pending`，不能写成已确认。此前一次完整材料因 map 放错层级产生 `MATERIAL_INCOMPLETE`（attempt `e5b6791d-fec5-4cc9-afe9-d72a30ce4dd9`），未调用 provider；另一次一字节占位材料诊断（attempt `709c156a-8235-44fb-908e-e32718b0b1a8`）不作为文档质量结论。正式用户 confirm 已 accepted，见下方 TaskKernel record。
R12-R14 是本轮复审之后新增的用户要求；本次只做了本地结构和 Markdown 检查，尚未把这三项交给新的 provider 复审，因此其独立 review 覆盖保持 `unknown`，不能把之前的 `pass` 扩大解释为覆盖当前新增内容。

本轮新增事故与修复：最新 build-plan final review attempt `e3c40da8-bd0d-448f-9927-8b3904dc92ec` 中，`cursor/grok`、`kimi/k3`、`opencode/v4flash` 均因 provider 最终公开输出含私有绝对路径而返回 `PUBLIC_RESULT_INVALID`；`codex/terra` 为 `SAME_SOURCE`，因此有效 reviewer 为 `0/1`。这不是三个 provider 同时不可用，也不是语义审查 pass，而是公开协议的 fail-closed 结果。已在独立 3rd-review worktree 修复同会话安全输出重写并合并 3rd-review main（commit `6335345`，main merge `4210810`），完整顺序回归 `257 passed / 0 failed`；WorkflowHub 同步把公开协议错误按真实码分类，未改共享配置。

本轮还确认了流程事故：build-code/verify-code 原 review step 后直接 capture/publish，技能没有要求主代理逐条分析 finding；运行时只留下粗粒度 review verdict/missing item，导致“审查完成”被误当成“问题已处理”。已加入 `analyze-review-findings` 明确 step、build-spec/build-plan handoff 规则，并让运行时列出 finding ID 和 serious repair-or-risk 缺口；这些提醒不会变成阻塞普通修复的质量 Gate。逐条处置的最小证据绑定仍是当前任务后续 spec/plan 的设计项，不能在当前 decision-log 中假装已经实现。

执行环境事实：本轮 WorkflowHub/3rd-review 的 commit 和 merge 均成功，但 Git 自动 repack 报告缺失对象 `d4a931b5d44e5401702ee81135512075eb5c5c63`；`git fsck --full` 还发现大量历史 broken link/missing tree。当前 main、修复 commit 和工作区文件可正常读取；未运行 `reset`、`prune`、强制 `gc` 或删除日志。INC-012 只记录并延期给仓库维护，不把 Git 历史损坏误归因于本次代码修复。

## 最终确认

当前推荐方向：采用 D1-D16；当前材料只做决策索引，不复制 spec；后续 stage 只能展开已有 `R* / F*-* → D*` 关系。主要风险是下游不遵守关系链、用户未看交接摘要、旧确认 stale、provider 仍可能返回无法公开的输出、review finding 处置证据还未完成机器化绑定。

历史用户正式确认：`accepted`。原始回答：`确认，继续吧`。TaskKernel canonical confirmation：`quality/confirmations/b2689b333a7def3ca8f699026c7640d28a6c6372533515140c29bd443dbb3d87.json`；sha256 `b2689b333a7def3ca8f699026c7640d28a6c6372533515140c29bd443dbb3d87`；material revision `revision-5c35208cab42144c512787fd9efae720a3fd9d2621d59f80435d318ecd9d4171`；snapshot tree `0804d1c7de01e6f9b6b2beb770616144d0f8ea3b`。该确认覆盖 D1-D14。

本轮确认：`accepted`。原始回答：`好的，可以继续了`。覆盖 D15-D16；这是用户对已修复公开审查协议和逐条 finding 处置闭环的真实确认。当前 make-decision 结论已确认，下一步进入 `build-spec`；此前遗留的 spec/plan/tasks 不能绕过本轮 build-spec 重审。后续 `build-spec`、`build-plan` 仍须完成各自的大白话摘要交接。

## 拒绝方案

- 只加 verify 检查：太晚，无法恢复已丢失的原始语义。
- 让 build-spec 补需求：违反 R1，且会让需求来源不稳定。
- 保留 1,182 行全量说明：上下文成本高，并与 spec 重复。
- 只保留五条摘要：无法逐项回放报告需求和决策来源。
- 预创建未来材料：伪造阶段状态。
- 改 wh-review 配置或自动重试：扩大共享任务影响并掩盖真实失败。

## 风险

- 后续 stage 若新增没有 `R*/F*` 来源的 FR/AC，仍会重新猜需求。
- 当前 Talk 选项正文缺失，历史选择只能以 refs/hash 绑定，不能补写。
- 旧 confirmation、quality projection 和 review 记录可能绑定旧 material；不能直接当当前结论。
- review/close/legacy 问题延期期间，不能宣称完整 formal close。
- 需求点矩阵只解决“知道要做什么”，不替代后续场景级验收。
- provider 仍可能无法给出不含私有路径的公开 JSON；失败必须保持 `PUBLIC_RESULT_INVALID`/unavailable，不能用文本清洗兜底。
- finding 处置目前靠主代理流程和当前 Task completion area，尚未有不新增控制面的最小绑定事实；后续设计必须明确 owner、consumer、证据和删除/保留条件。

## 未决项

- 用户是否正式接受 D1-D14、补回的阶段链/边界/证据锚点、跨项目最低结构和人工交接/质量边界：`accepted`，见历史 TaskKernel confirmation。
- 用户是否正式接受 D15-D16：`accepted`，见本轮真实用户回复 `好的，可以继续了`。
- 后续 build-spec 如何把每个 `R*/F*` 展开成 FR/AC：build-spec 负责，但不得新增需求。
- stale confirmation/quality projection 的机器化诊断：隔离 runtime 任务。
- review aggregation、snapshot freeze、results publication、close preflight：隔离 review/runtime 任务。
- review finding disposition 的最小结构化证据绑定：本次只落流程和质量提示；在 D15-D16 确认后由 build-spec/build-plan 设计，不新增 public command 或平行 completion 状态机。
- 五份报告各自业务实现和人工读者/浏览器验收：对应 PaperBuilder/KnowledgeDigest 任务。

## Supersedes

- 本版（V3，当前精简候选）supersedes V2（V1 的 1,182 行详细候选压缩版）；原因是 V2 未记录最新公开审查协议事故和 finding 处置闭环。
- V3 保留 V2 的精简索引结构，同时追加 D15-D16；不把修复代码细节复制成 spec，不把历史 confirm 扩大解释为当前范围确认。
- V0（约 302 行初始摘要）和 V1 都只作为只读审计对照；canonical ref/hash 未提供，不能把其中“已确认”状态带入 V3。
- `decision-correction-appendix.v1`：原始 canonical decision ref/hash 未提供，不能伪造；本版以 `supersedes` 和 D1-D14 的明确关系记录修正，`does_not_rewrite_upstream=true`。

## 文档结果

- `CONTEXT.md`：no-change；无新领域术语。
- ADR：not-needed；当前是可逆的材料职责和运行时边界修复。
- 本文保留需求原子、决策点、来源、理由、取舍、决策级阶段链、成功/失败边界和交接；不保留实现级页面/字段/测试设计。

## Exit checks

- R1-R16 均已映射到 D1-D16 或非目标/未决项：pass。
- F15/F4F7/KnowledgeDigest/F8/M0.8 需求点均已映射：pass。
- Talk、Grill、调研、审查事实均已记录，缺失项标为 unknown/unavailable，并保留路径/hash：pass。
- 决策级阶段链、成功边界、失败边界和跨项目最低结构已记录：pass。
- 本次 make-decision 未新建未来材料；已有 spec/plan/tasks 已明确标记为上一轮遗留，不能自动作为本轮 handoff：pass。
- 历史用户正式确认 D1-D14：pass；本轮用户确认 D15-D16：pass。三个阶段的人工摘要交接规则已记录。阶段 handoff：make-decision 已确认，进入 `build-spec`；build-spec 必须先重审并修订受 D15-D16 影响的当前材料，再展示大白话摘要后交接。
