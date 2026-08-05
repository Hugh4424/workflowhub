# WorkflowHub 需求完整性审计：decision-log

这是本任务的第一份当前材料。它只记录：原始需求、需求/决策关系、分析来源、取舍、风险和延期交接。具体 FR、页面细节、任务拆分、测试步骤和证据格式留给后续 stage；后续 stage 不得借此重新猜需求。

状态：`verify-code / in_progress / V22 current-evidence-closure`；D18-D20 已获得用户确认，make-decision、build-spec、build-plan 已完成历史交接。上一轮 verify-code 的失败和 `incomplete` 结论是只读历史事实；本轮继续处理 D43-D57。历史内容合同已恢复并正在补当前扩展：decision-log → spec → plan → tasks 的来源映射、测试策略、阶段进度、执行路径和语义状态分离。不调用共享 provider、不追求 pass、不重跑完整五阶段；只补当前快照的逐项证据和最小必要回归。当前仍在 verify-code，直到正式 verification receipt、逐项 replay、任务完成证据和本轮人工 handoff 有真实结论前不 close。

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
| R17 | `make-decision`、`build-spec`、`build-plan` 的审查目的是获取异源意见，不是反复追求 provider `pass`；`pass`、`revise_required`、`unavailable` 都是质量事实，不能作为继续修复/推进的隐藏 gate。 | U14；Constitution F4/Q1/Q2；当前运行时与审查合同 |
| R18 | 这三个阶段已有 `pass` 基线后新增需求或修改内容，只审查新增/变更内容及直接影响，不全文重审；无法安全提取增量时必须如实记录并回退完整审查。 | U14；当前重复审查现象；审查 round/controller/material contract |
| R19 | 在 `build-code` 或 `verify-code` 发现实现、方案或原始需求需要调整时，沿用同一个 task，更新当前四份材料后走一次专用 scope-revision 审查；不重跑完整五阶段、不追求 provider `pass`，但必须审查临时需求是否符合核心目标、四份材料是否一致、影响范围是否完整、风险和宪法边界是否清楚。 | U15；当前任务执行中的 scope_revision 过重问题；D43-D44 |
| R20 | 仔细审计历史提交，确认 spec/plan/tasks 相关的高质量 skill、模板、内容合同和阶段流程是否被优化提交删除或弱化；恢复等价的可搬运内容合同，让后续 stage 不再靠 agent 临场猜测。 | U16；`775b57f` 删除证据；Bohr/Carver 历史审计 |
| R21 | 对照 AgentHub apply 阶段，恢复 build-code 的高质量开发闭环：每个 Phase 有边界和交接，行为改动有 RED/GREEN，实际改动做风险测试、差异扫描、独立审查、finding 根因/处置和留痕；但不得恢复与 WorkflowHub Constitution 冲突的 pass/commit/worktree/full-suite gate。 | U16；AgentHub `apply.md`；Newton/Confucius 审计 |
| R22 | build-code 每个 Phase 完成后，以及所有 Phase 完成收口时，必须按实际改动使用 `test-routing-advisor`、`testing-system-blueprint` 和适用的 `backend-testing`、`frontend-testing`、`fullstack-slice-testing`；测试结果、覆盖范围、跳过原因和 snapshot 必须留痕，不能只靠 RED/GREEN。 | U17；当前用户追加要求；Galileo/James 对 AgentHub testing 体系审计 |
| R23 | 测试规范和流程由高智力模型在 `build-plan` 阶段设计并写进 `tasks.md` 的每个 Task/Phase 卡；`build-code` 的普通模型直接执行已记录的命令、场景和 oracle，不在每个 Phase 重新走 route/blueprint/executor；最终聚合测试也提前写成专门的最终 Task/Phase 策略。 | U18；当前用户最新澄清；R22/D47 的执行成本问题 |

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
- 本轮新增的 review 语义修复：前三阶段的 `revise_required` 不再被流程当作“必须拿 pass 才能继续”；已有 `pass` 基线后的材料变化使用 runner 生成的 `review_delta`，只审查变化及直接影响。
- 五份报告的业务流程只作为需求保真和验收输入；具体业务页面留给对应项目。
- 历史 stage skill/template 的恢复只恢复内容合同、模板和可搬运测试方法；不恢复 AgentHub 的 gate、强制 commit、强制 worktree/session、第二状态机或 release 控制面。
- build-code 的每个 Phase 和最终收口都必须有实际改动路由、测试 blueprint、适用测试执行器报告、coverage limits 和当前 snapshot；完整回归仍只在 verify-code 或明确计划项执行。

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
- 前三阶段的 review `pass/revise_required/unavailable` 均保留原样；`status/progression` 不依赖 provider `pass`，已有 `pass` 后新增内容只进入增量审查。
- spec/plan/tasks 的生成不能只依赖阶段 SKILL 的概括文字；必须使用恢复的内容 skill/template，显式写出场景、状态、失败条件、STOP、oracle、证据、DAG 和 FR↔Task↔AC 追溯。
- build-code 的 RED/GREEN 是测试时序，不是完整质量证明；每个 Phase 还要有 blueprint、实际路由、适用执行器报告、差异/消费者扫描和交接摘要，最终收口再有当前快照聚合测试事实。

## 失败边界

- 原始需求或来源无法逐项回放。
- build-spec/build-plan/code/verify 偷偷新增或缩小需求。
- 没有真实 evidence、review 或 confirm 却宣称完成。
- 权限、篡改、格式损坏等非 ENOENT 读取错误被宽泛吞掉。
- 历史 review/snapshot/confirmation 被拿来支撑当前材料。
- manual close、Git merge 或 make check 被误写成 formal close。
- 子代理代替用户沟通、伪造用户回答，或没有展示摘要就静默跨阶段。
- provider 输出协议失败被吞成 UNKNOWN、或审查 finding 未分析就直接 handoff。
- build-code 只写 RED/GREEN，不按改动类型执行 backend/frontend/fullstack 风险测试，或执行了但没有报告、覆盖限制和 snapshot。
- review/test/evidence 被当成隐式交付 gate，或反过来因质量缺失宣称完成。
- 以“直到 provider pass”为理由反复全文审查，或把增量审查静默扩大/缩小而不记录 fallback。

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
- **推荐/大白话**：`recommended / accepted`。日志回答“要什么、选什么、依据什么”；页面、字段、测试步骤不在这里展开。
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
- **决定/影响**：INC-001 provider failure、INC-002 future read、INC-003 CAS、INC-004 误建未来文件、INC-005 stale confirm、INC-006 quality projection、INC-007 文档计数、INC-008 review packet 映射层级错误、INC-009 占位材料诊断、INC-010 公开审查结果含私有路径、INC-011 审查 finding 未分析即 handoff、INC-012 本地 Git object database 缺失历史对象、INC-013 v2 审查材料契约把必需 map 写成 optional、INC-014 review verdict 被错误理解为继续许可证且 changed snapshot 触发全文重审、INC-015 增量审查改造引入的当前流程修复事实均进入交接。
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
- **推荐/大白话**：`recommended / accepted`。以后每份日志都要能还原“用户要什么、依据什么、选了什么、为什么、怎么判断方向合理、后面交给谁”；但不写成 spec。
- **来源**：U11：“让以后所有的decision-log都包含所有原始需求、调研重点、talk结论、grill结果、推理结果……作为后续所有stage的核心参考文档”；U12 的沟通、摘要交接和质量边界要求；比较审查报告 `44357fd2-016d-457a-96fe-bce8cc9a08e8`、`200bca63-af28-4341-ba6f-99c6ca156ca1`。
- **事实/推理**：旧详细版保留了较多事实但与 spec 重复；新精简版保留了 R/F/D 矩阵但漏了阶段骨架、边界和证据锚点。故固定索引级字段，而不是恢复实现细节。
- **决定/影响**：未来 decision-log 至少包含：`原始需求/约束+来源`、`外部输入/调研重点+处理状态`、`目标/范围/非目标`、`决策级阶段链`、`Talk（问题/选项/选择/队列/evidence）`、`Grill（CONTEXT/ADR/冲突/四项退出/evidence）`、`D*（选择/来源摘录/事实约束/推理/理由/影响/后果风险/拒绝/未决/supersedes/批准）`、`成功/失败边界`、`审查处置`、`风险/延期交接`、`阶段末大白话摘要与用户看过状态`、`质量事实/推进资格/完成判据/不可逆授权边界`。
- **后果/风险**：每份日志会比纯摘要长，但不会重复页面字段、FR/AC 细节、任务、测试步骤或证据 schema；漏掉任一最低字段会再次让后续 stage 猜需求。
- **拒绝/未决**：拒绝“只写 R/F/D 三张表”；拒绝“复制完整用户流程和 spec”；未来是否机器校验该最低结构，交给独立 runtime 任务。
- **supersedes/批准**：`supersedes=仅把当前任务 D1 当作局部做法`；本 D11 是跨项目规范；正式确认 accepted。

### D12：用户沟通技能必须由主代理直接执行

- **关系**：R12 → D12；约束所有未来任务的 `talk`、`grill`、`clarify` 和同类用户沟通技能。
- **问题/选择**：沟通技能交给子代理代跑，还是由主代理在用户可见上下文直接完成？选择后者。
- **推荐/大白话**：`recommended / accepted`。需要用户回答的问题必须真的问到用户；子代理可以研究和整理事实，但不能代替用户回答、确认或做沟通结论。
- **来源**：U12：“talk、grill、clarify等技能需要和用户沟通的，一定要保证沟通，绝对不能用子代理执行。”当前 host-visible ref/hash 未提供。
- **事实/推理**：本任务审计发现沟通技能被默认放进子代理后，用户没有看到问题，也没有产生真实回答；研究结论不能冒充用户选择。故把“用户沟通所有权”固定给主代理。
- **决定/影响**：主代理直接运行沟通技能并展示问题、选项、后果、风险和回答；子代理只能提供研究、对照和草稿，不得写入用户回答或确认状态。
- **后果/风险**：主上下文会承担沟通成本；换来的是真实用户选择和可追溯交接，不能用并行节省上下文掩盖沟通缺失。
- **拒绝/未决**：拒绝“子代理代问再转述”；拒绝“根据历史或推测补用户答案”；具体 runtime ownership 检查延期到隔离实现任务。
- **supersedes/批准**：`supersedes=沟通技能可默认委托子代理的隐含行为`；正式确认 accepted。

### D13：三个阶段结尾必须有人看过大白话交接摘要

- **关系**：R13 → D13；约束 `make-decision`、`build-spec`、`build-plan` 到下一阶段的交接。
- **问题/选择**：阶段结束只写内部材料，还是先向用户解释并让用户看过摘要？选择后者。
- **推荐/大白话**：`recommended / accepted`。阶段结束时必须告诉用户“做了什么、产物是什么、还缺什么、风险是什么、下一阶段不能猜什么”；用户看过后才能声明已交接。
- **来源**：U12：“make-decision、build-spec、build-plan三个阶段结尾的时候，一定要用大白话把当前阶段做了什么，产物的总结摘要是怎样告诉给用户……必须要保证人看过大白话总结摘要，在进入下一个阶段！”原来设计的流程 ref/hash 未提供。
- **事实/推理**：没有人可读摘要时，材料即使存在，用户也无法发现遗漏；阶段会把错误假设静默传给下一阶段。摘要是人工交接事实，不是质量 verdict，也不新增 build-spec 的正式业务确认点。
- **决定/影响**：三个阶段结尾都要由主代理发送短摘要，包含完成内容、产物摘要、未决/延期、主要风险和下一阶段边界；必须记录用户看过/确认的真实结果，未看过就不能静默 handoff。
- **后果/风险**：阶段交接会多一次人工等待；这是为避免需求遗漏的必要通信成本。用户未回复时保持 `in_progress/pending`，不得假定已看过。
- **拒绝/未决**：拒绝只生成机器 receipt；拒绝子代理代发摘要或伪造已读；摘要的最小结构和 runtime 记录方式延期到对应阶段技能实现。
- **supersedes/批准**：`supersedes=原有但执行中经常遗漏的阶段末人工摘要交接`；正式确认 accepted。

### D14：质量保证是事实与人工把关，不是隐藏交付 gate

- **关系**：R14 → D14；与 D5、D10、D12、D13 共同约束质量、交付和人工交接边界。
- **问题/选择**：测试、review、evidence 缺失或 finding 出现就自动卡住修复/交付，还是记录事实并允许同任务继续？选择后者，并保持完成结论诚实。
- **推荐/大白话**：`recommended / accepted`。质量检查负责告诉人哪里有问题、证据是什么、状态是 `pass/fail/unknown/unavailable/incomplete`；不能偷偷变成“没有绿灯就不能修”。
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

### D17：v2 审查材料的必需 map 必须在公开契约中保持一致

- **关系**：R7、R15、D15 → D17；处理本轮 build-spec 真实审查在 provider 调用前即 `MATERIAL_INCOMPLETE` 的执行事故。
- **问题/选择**：运行时已经按 `wh_review.v2` 要求 `context_map`/`evidence_map`（build-code phase 还要求四张 authority map），但 `stage-materials.json` 和 `wh-review/SKILL.md` 把它们写成 optional；是继续让调用方猜，还是让公开契约和校验一致？选择后者。
- **推荐/大白话**：`selected / 直接修复`。所有 `wh_review.v2` 必需 map 同时列在 stage 的 `required` 和技能输入说明中；缺失时仍 fail-closed，并明确记录 `MATERIAL_INCOMPLETE`，但不会把 provider 误报成不可用。
- **来源**：本轮真实审查 attempt `2da6e4d4-f347-48a8-9b16-37762823e955`；attempt 错误为 `MATERIAL_INCOMPLETE: wh_review.v2 requires context_map`，`provider_attempts=[]`；运行时校验 `review-materials.mjs#validateV2AuthorityMaps`；用户已确认 D15，且授权正常推进问题直接修复。
- **事实/推理**：本次失败发生在 provider 调用前，不是三个 provider 不可用；旧公开文档让调用方以为 map 可省略，运行时却直接拒绝。放宽校验会降低审查材料完整性，继续保留 optional 则会重复触发同一事故，所以只同步契约，不改 provider 路由、配置、超时或质量 Gate。
- **决定/影响**：已在 WorkflowHub 修复并合并 main：`runtime/review/stage-materials.json` 将 v2 map 纳入 `required`；`skills/wh-review/SKILL.md` 明确每个 stage 的完整输入；契约测试断言 map 不能同时是 optional；skill bundle/catalog hash 已同步。当前 spec/build-plan 后续必须按该输入准备结构化 map。
- **后果/风险**：调用方如果仍缺 map，会更早、更明确地得到 unavailable 事实，provider 不会被调用；这不会阻塞同任务修复，但必须如实记录，不能把未调用 provider 写成审查完成。
- **拒绝/未决**：拒绝把 map 改回 optional、让 WorkflowHub 猜 map、修改共享 provider 配置、放宽 fail-closed 校验或自动补写证据。map 的具体内容由当前 stage 根据已存在材料生成，不新增第二套需求 ledger。
- **supersedes/批准**：`supersedes=stage matrix/skill 输入文档对 v2 map 的 optional 误导`；按已确认 D15 和用户“正常问题直接修复”授权执行；不新增业务范围，也不替代用户对 D15-D16 的确认。

### D18：前三阶段审查是异源意见，不是追求 provider pass 的继续许可证

- **关系**：R14、R16、R17、D5、D14、D16 → D18；重新打开 make-decision，修正“质量事实”和“阶段推进”被混看的风险。
- **问题/选择**：`revise_required` 是否必须反复审查到 `pass` 才能继续？选择不把 provider verdict 当阶段推进 gate，同时保留它作为真实质量事实。
- **推荐/大白话**：`selected / 直接修复`。审查的作用是提供异源意见；有意见就分析和处置，不能为了拿绿灯反复调用。`revise_required` 仍可使质量结论保持 `incomplete`，但不能阻止同一任务修复、正常推进或交接动作；严重 finding 仍按 repair-or-risk 规则处理。
- **来源**：U14；Constitution F4/Q1/Q2；`workflows/*/SKILL.md` 和 `skills/wh-review/contracts/*` 原有“非 gate”规定；运行时回归定位到 `775b57f` 引入的 `reviewEvidenceStatus(revise_required) → failed` 表面，以及 changed snapshot 默认重新选 `initial` 的控制逻辑。
- **事实/推理**：把 `revise_required` 改成假的 `passed` 会违反 F9/Q1；保留质量 `incomplete` 才能诚实显示 finding。真正要修的是“把 quality_status 误当继续条件”和“为获得 pass 重做全文审查”的流程解释与 round 选择。阶段 runner 已以当前四份材料计算 `status/progression`，回归测试确认 `revise_required` 时 `status=completed`、`quality_status=incomplete`，两者不冲突。
- **决定/影响**：不改 provider 配置、不改历史 verdict、不新增 gate、resolution flow 或 public command；WorkflowHub 的 review round、阶段技能和审查合同明确“意见非门禁”，只在确有材料变化时执行受影响的审查。已由 `410b6fe` 修复并以 `d2eaefe` 合并到 WorkflowHub `main`。
- **后果/风险**：质量不完整会继续显示为 `incomplete`，使用者若只看质量字段仍可能误以为不能推进；阶段摘要和下游技能必须同时展示 `progression/status`、真实 verdict、finding 处置和完成边界。
- **拒绝/未决**：拒绝把 `revise_required` 改写成 pass、拒绝把 unavailable 当通过、拒绝用 repeated review 消灭 finding；严重 finding 的具体风险选择仍由用户在对应阶段确认。
- **supersedes/批准**：`supersedes=“审查必须拿 pass 才能继续”的错误运行解释`；由 U14 明确提出，D18 为当前修复决策，代码已提交并合并。用户已在阶段摘要后回复 `确认，继续`，本决策状态为 `accepted`，make-decision 已交接 build-spec。

### D19：已有 pass 基线后的前三阶段审查只看增量

- **关系**：R18、D11、D14、D18 → D19；约束 `make-decision`、`build-spec`、`build-plan` 的后续所有任务。
- **问题/选择**：已有 `pass` 后新增需求是否再次全文审查？选择由 runner 根据上一份已认证结果和当前材料哈希生成临时 `review_delta`，只交付新增/变更材料及直接影响。
- **推荐/大白话**：`selected / 最小改动`。没变的内容按已审查基线处理；变了什么就审什么。只有没有可验证的旧基线、没有分类 manifest 或 delta 无法安全生成时，才明确回退一次完整初始审查。
- **来源**：U14；`runtime/review/review-controller.mjs` 的现有 round 规则；`skills/wh-review/scripts/wh-review-cli.mjs`、`review-materials.mjs`、`review-runner.mjs`、stage-materials matrix 和 attempt schema；当前 `stage-review-cost-policy` 与 controller 回归测试。
- **事实/推理**：此前 changed snapshot 一律 `initial`，并将当前全部材料重新放进 packet；这使小改动也触发全文审查。将 delta 作为 runner 生成的临时输入，保留当前必需材料的完整 preflight 校验，但 provider packet 只包含 `review_delta` 和审查指令，既不新增任务 ledger，也不让调用者伪造 review round。
- **决定/影响**：新增内部 `incremental` round；仅前三阶段适用；当前分类 manifest 不把 `review_delta` 自身纳入下一次基线；provider 指令明确只看变更及直接影响；`review_delta` 不可由 caller 传入；无安全 delta 时回退 `initial` 并保留原因。build-code/verify-code 的原有 review scope 不改变。
- **后果/风险**：增量审查可能漏掉未标记的间接影响，因此 delta 同时记录 changed dimensions/direct impacts；关键接口、验收、状态、安全、并发、拓扑和测试策略的变化仍须被列为直接影响。若 delta 不完整，系统必须退回完整审查，不能静默缩小范围。
- **拒绝/未决**：拒绝全文重复审查、拒绝永久 response ledger/selector/review chain、拒绝修改共享 provider 配置；增量内容的具体 FR/AC 由当前 build-spec 细化，不在本决策中偷写实现细节。
- **supersedes/批准**：`supersedes=changed snapshot 即全文 initial review`；由 U14 直接提出，代码测试和合并事实记录后作为当前任务决定。用户已在阶段摘要后回复 `确认，继续`，本决策状态为 `accepted`；真实 build-spec 增量 smoke 已在本阶段执行，后续 build-plan 继续沿用同一 runner 规则。

### D20：前三阶段一次异源审查即可，不追求反复拿 pass

- **关系**：R17、R18、D18、D19 → D20；D20 是 FR-019/AC-022 对“审查意见不等于 pass gate”的非新增范围澄清，约束 `make-decision`、`build-spec`、`build-plan` 的审查次数和后续 finding 处置。
- **问题/选择**：审查发现 minor 或 invalid-anchor 事实后，是不断修改 plan/spec 再重复 provider 调用，还是把一次审查作为异源意见并由主代理分析处置？选择后者。
- **推荐/大白话**：`selected / 一次审查，保留意见`。审查做一次就够了；`pass` 不是目标，`revise_required`、`unavailable`、timeout、same-source 和 invalid 也要原样记录。审查后的修改由主代理按 finding 处置，不自动触发下一轮；如果以后真的新增需求或材料发生变化，才按 D19 的 runner 增量规则在新的阶段运行中审查受影响内容。
- **来源**：用户最新明确要求“审查是为了提供异源意见，不是为了获得通过，审查过一次就可以了”；R17/R18；Constitution F4、F7、F9、Q1、Q2；本次 build-plan attempt `44c0e96b-eabb-4fe3-a707-9ee4d0f6c2bd`。
- **事实/推理**：本次一次复审已真实调用 `kimi/k3`、`cursor/grok`、`opencode/v4flash`，3/1 valid，`codex/terra` 为 `SAME_SOURCE`，aggregate=`pass`，但仍有 minor 和 invalid-anchor 事实。继续追求无 finding 会把审查变成隐藏 gate，放大 provider 成本，并把“意见已分析”错误替代成“provider 通过”。正确边界是：主代理逐条记录事实、后果、status、下一步和证据；是否进入下一阶段由用户摘要确认和结构/完成事实决定，不由 verdict 决定。
- **决定/影响**：当前 build-plan 不再发起第二次 provider 审查；保留 attempt/result/report 原始记录。已根据有效意见修订当前 plan/tasks 的字段、任务边界、AC-023 skill closure 校验、配置证据非门禁和测试所有权，但这些修改不再自动触发审查。当前 review fact 仍以 `44c0...` 的一次审查为准，后续只做本地结构校验和用户交接。
- **范围绑定**：D20 不新增 FR/AC，不改变 D18/D19 的产品范围；它只把 FR-019/AC-022 的执行边界说清楚，并以本条作为当前阶段的解释性 revision note。
- **后果/风险**：一次审查不能证明后续修改没有新问题；通过阶段摘要、deterministic contract 和后续 build-code/verify-code 的实际证据承担这个风险。若新增需求或材料发生实质变化，必须回到 D19 的增量规则；不能用 D20 逃避新内容审查。
- **拒绝/未决**：拒绝“反复审查直到 pass”；拒绝删除原始 finding；拒绝把一次 `pass` 写成用户确认；build-plan 已由用户看过摘要并确认，当前进入 build-code。
- **supersedes/批准**：`supersedes=审查后自动循环修改并重复调用 provider 的做法`；本条由用户最新消息直接确认，状态 `accepted`。

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

本轮新增执行事故 INC-013：build-spec 按公开技能示例调用真实 `wh-review`，运行时在 provider 调用前返回 `MATERIAL_INCOMPLETE: wh_review.v2 requires context_map`，三个 provider 均未运行。根因是 v2 校验已把 map 视为必需，但 stage matrix/技能文档仍写 optional，导致调用方无法从公开契约正确构造输入。已按 D17 修复并合并 WorkflowHub main；原始 unavailable attempt 保留，不作为 provider 质量结论。修复后的重审必须补齐 `context_map`、`evidence_map`，并记录真实 provider 结果。

build-spec 修复后真实复审 attempt `7a5c8678-d159-4373-8b31-1324241941d7` 已完成：`semantic`、aggregate verdict=`pass`，`kimi/k3`、`cursor/grok`、`antigravity/flash` 均 completed，3/1 valid reviewers；无 timeout、provider unavailable、PUBLIC_RESULT_INVALID 或 MATERIAL_INCOMPLETE。审查结果仍逐条处理，不能只看 aggregate pass：`FR-008`/`AC-003` 的 R1-R14 旧枚举、`FR-012`/`AC-014` 的 INC-001~009 旧枚举、以及第 9 节漏列 A6，均由主代理核对当前文件后确认是有效问题并已修复为 R1-R16、INC-001~013 和 D17 已解决的 A6。报告中这些 finding 的正式 evidence_status 保留为 `invalid_anchor`（provider 使用了不存在的 `requirements/draft_spec.md` 锚点），没有把它改写成 provider 证据有效；本地直接核对是本次处置依据。因 spec 发生材料性修改，仍需再次复审，当前不得声明 build-spec handoff 完成。

本轮复审第一次重跑 attempt `b084a777-e9b9-4d42-9ea8-7ea9ae11e567` 在 provider 调用前因调用方把带结尾换行的行数多算一行，返回 `MATERIAL_INCOMPLETE`，`provider_attempts=[]`；这是本次审查输入锚点的操作错误，不是 provider 或 WorkflowHub 契约故障，原始失败保留。修正为冻结快照实际行数后，attempt `e3a5ca28-1160-451b-80b8-5b5e5a2b867f` 真实完成 semantic review：`kimi/k3`、`cursor/grok`、`antigravity/flash` 均 completed，3/1 valid reviewers，无 timeout、provider unavailable、PUBLIC_RESULT_INVALID、MATERIAL_INCOMPLETE 或 PROFILE_MISMATCH，aggregate verdict=`pass`。三方共提出 4 个 minor：AC-018 未明列 D15 四种错误码、影响材料仍写 V7、A2 分类应为 deferred、AC-013 重复挂靠执行事实 R3。主代理已逐条核对并在当前 spec V9 修复；这些 finding 的正式 minor 事实保留，不因 aggregate pass 被抹掉。因本次修改涉及验收口径和状态分类，仍需再做一次当前材料复审。

本轮还确认了流程事故：build-code/verify-code 原 review step 后直接 capture/publish，技能没有要求主代理逐条分析 finding；运行时只留下粗粒度 review verdict/missing item，导致“审查完成”被误当成“问题已处理”。已加入 `analyze-review-findings` 明确 step、build-spec/build-plan handoff 规则，并让运行时列出 finding ID 和 serious repair-or-risk 缺口；这些提醒不会变成阻塞普通修复的质量 Gate。逐条处置的最小证据绑定仍是当前任务后续 spec/plan 的设计项，不能在当前 decision-log 中假装已经实现。

本轮新增审查语义调查：`775b57f` 的新 vNext runner 将 provider `revise_required` 映射为 quality fact `failed`，而 review controller 对 changed snapshot 一律重新选择 `initial`；阶段 progression 本身已经与 quality completion 分离，但这两个表面信号会让执行者误以为必须反复取得 `pass`。主代理核对了 Constitution F4/Q1/Q2、阶段合同和 `status/progression` 代码，结论是不能把 `revise_required` 改写成 `passed`，否则会假绿；修复目标应是禁止 pass pursuit，并把变更范围缩到增量。

本轮 WorkflowHub 修复已完成：新增 `incremental` review round；前三阶段在已有 `pass` 且当前材料分类 manifest 可安全比较时，由 runner 生成临时 `review_delta`，provider packet 只包含 delta 和审查指令，当前必需材料仍完整 preflight；同快照不重审、无安全 delta 才回退一次完整 `initial`。caller 不能传入或选择 delta/round；`build-code`/`verify-code`、共享 provider 配置、历史 review/result 均不改变。代码提交 `410b6fe`，已合并 WorkflowHub `main` merge `d2eaefe`。回归事实：controller、stage cost policy、review CLI/material contract 及 first-three-stage progression 测试 `26/26` 通过；`npm run check` 通过；其中 `revise_required` 明确得到 `status=completed`、`quality_status=incomplete`，保留质量事实而不阻断推进。provider 未因本次代码回归测试被调用，后续真实增量 packet smoke 需在用户确认后按合法 build-spec/build-plan 阶段执行。

本轮 build-spec 真实增量审查 attempt `7dc814e1-28d2-4479-91b5-5f6fb6609f2a` 已完成：round=`incremental`，`kimi/k3`、`cursor/grok`、`antigravity/flash` 均 completed，3/1 valid reviewers，无 timeout、provider unavailable、PUBLIC_RESULT_INVALID 或 MATERIAL_INCOMPLETE；aggregate verdict=`revise_required`，原始 verdict 保留，不追求重审到 pass。主代理逐条处置：`F-da2f78e2f54b` 是当前 decision-log 在真实调用前仍写 reopened 的文档事实，已写入用户 `确认，继续` 的 accepted handoff；`F-d8e8545b916d` 与 `F-7dbb02d2d481` 共同指出 `review_delta.json` 被压成单行、provider 读不全，确认是运行时缺陷，已由 `9622cb4` 修复并以 main merge `45547fa` 合并；`F-adc1a79f0a80` 指出 direct impacts 未显式映射，已加入 runner 生成的 `direct_impacts`；`F-b1d8b5ab8faa` 指出早期阶段 evidence 为空缺少解释，已在增量审查指令中明确 `canonical-evidence.json` 为空是预期。修复回归：新增 controller/material readability 测试 `9/9`、stage policy/integration `13/13`，`npm run check` 全部通过；没有修改共享 provider 配置。该轮 provider 仍真实提出 `revise_required`，不改写成 pass。

执行环境事实：本轮 WorkflowHub/3rd-review 的 commit 和 merge 均成功，但 Git 自动 repack 报告缺失对象 `d4a931b5d44e5401702ee81135512075eb5c5c63`；`git fsck --full` 还发现大量历史 broken link/missing tree。当前 main、修复 commit 和工作区文件可正常读取；未运行 `reset`、`prune`、强制 `gc` 或删除日志。INC-012 只记录并延期给仓库维护，不把 Git 历史损坏误归因于本次代码修复。

修复后一轮 build-spec 增量审查 attempt `30c46589-9cb2-41dd-99f2-a13250f2be1c` 已完成：round=`incremental`，3 个 provider 均 completed，覆盖 3/1，无 timeout、provider unavailable、PUBLIC_RESULT_INVALID 或 MATERIAL_INCOMPLETE，aggregate verdict=`pass`。provider 原始事实仍分别保留：`antigravity/flash=pass`、`kimi/k3=pass`、`cursor/grok=revise_required`。主代理核对并修正了三个当前有效的追溯问题：D9 的 INC-014/015 未进入 FR-012/AC-014，FR-008 关联漏 D18/D19/R17/R18，以及 decision-log/spec 版本头与 D1/D11 的 pending 文本陈旧；另有 raw_requirement 历史基线 hash 错配，当前内容已正确，作为历史 minor 记录，不伪造回写旧快照。因这些修正又改变了当前材料，仍需按既有 pass 基线再做一次受影响增量复核；不追求 provider 全部返回 pass。

最后一次修复后 build-spec 增量复核 attempt `0269e624-7cf2-4879-ab33-2e4fab77cd30` 已完成：round=`incremental`，`kimi/k3`、`cursor/grok`、`antigravity/flash` 全部 completed，3/1 valid reviewers，无 timeout、provider unavailable、PUBLIC_RESULT_INVALID、MATERIAL_INCOMPLETE 或 PROFILE_MISMATCH；aggregate verdict=`pass`，无 adjudicated finding。三方确认 V12 已把 R1-R18、D1-D19、FR-001~FR-020、AC-001~AC-023、direct impacts、空 evidence 预期和非门禁/增量边界对齐；这是质量事实，不替代用户对阶段摘要的阅读。

本轮 build-plan 一次异源审查 attempt `44c0e96b-eabb-4fe3-a707-9ee4d0f6c2bd` 已完成：policy=`wh_review.v2/initial`，`kimi/k3`、`cursor/grok`、`opencode/v4flash` completed，3/1 valid reviewers，`codex/terra=SAME_SOURCE`，无 timeout、provider unavailable、PUBLIC_RESULT_INVALID、PROTOCOL_INCOMPATIBLE、MATERIAL_INCOMPLETE 或 PROFILE_MISMATCH，aggregate verdict=`pass`；原始 result=`quality/reviews/results/build-plan-default-a83f6293ba916659784330c92e947bf749f91c70-44c0e96b-eabb-4fe3-a707-9ee4d0f6c2bd.json`，report=`quality/reviews/reports/44c0e96b-eabb-4fe3-a707-9ee4d0f6c2bd.md`。provider 仍提出 5 个合并后的 minor 事实，另有 7 个 `invalid_anchor` provider finding：AC-023 的 skill bundle/catalog closure 未在任务中显式出现、T006 oracle 越过 T013/T014 提前宣称 hash 修复、T013/T014 的 AC 归属过宽、T013 provenance 用词矛盾、T007/T008 测试文件所有权重叠、T012 绝对宿主配置 hash 不可移植、A5 finding disposition 最小字段未落到 plan。主代理逐条核对后已把这些意见转成当前 plan/tasks 的可执行修正或明确复用事实：增加 skill closure 检查；拆分 T007/T008 测试文件；把 hash 修复独立归 T013/T014；补齐 `finding_id/原始事实/后果/status/next_action/evidence_ref/owner/consumer/retain_or_delete`；去掉硬编码宿主配置 gate，改为 launcher pre/post evidence-only；确认 D17 的 required-map 声明源是已合并 owner，不在本任务重复改写；为 markdownlint 使用 `npx --no-install`。invalid-anchor 的原始分类保持不变，没有被改写成有效 provider 证据。

用户随后明确：前三阶段审查只提供一次异源意见，不为了拿 `pass` 反复修改和调用 provider。依据 D20，以上一次审查就是本 build-plan 的独立质量事实；之后的 plan/tasks 文字收口不再自动触发复审。随后曾启动第二次复审，但用户要求停止，未产生新的 attempt/result/report，不能算新的质量事实。

本轮 build-code Phase 1 已完成一次异源审查：第一次调用因缺少 build-code 结构化 map 和测试 receipt 返回 `MATERIAL_INCOMPLETE`，provider 未调用；补齐正式 test receipt 与四张 map 后，attempt `e93d10f0-9483-4b3e-9cf0-91c87364b2fd` 由 `kimi/coding`、`cursor/grok` 完成，aggregate=`pass`。原始 provider verdict、2 个 minor 和 2 个 `invalid_anchor` finding 均保留。主代理核对后修复了三阶段真实回复测试覆盖和 Task completion area 写回规则；T001 RED 的 exit=1 事实写入 tasks 完成区；review packet 的 unknown acceptance map 保持 `rejected_invalid`，因为缺少可绑定 anchors 时不能用测试通过伪造 `complete`。本 Phase 不因修复而重复审查同一快照。

Phase 2 已完成一次异源审查：attempt `c1a86363-0929-4153-8de5-17ace352bb10` 由 `kimi/coding`、`cursor/grok` 完成，aggregate=`pass`，原始 1 个 `invalid_anchor` major 和 3 个 minor 均保留。主代理修复了用户摘要风险与 system confirmation summary 来源不一致的问题，并把风险纳入一致性检查；追加 combined test receipt 覆盖 Phase 1 交互测试和 Phase 2 摘要测试。canonical completion facts 尚在最终 build-code handoff 前，phase review packet 的空 canonical-evidence 和 unknown acceptance map 按真实阶段边界保留，不伪造 complete/pass；本 Phase 不因修复而重复审查同一快照。

Phase 3 已完成一次异源审查：attempt `d7808d5a-aaa7-4c39-acc7-484a99884f2a`，`kimi/coding`、`cursor/grok` completed，aggregate=`pass`；原始结果=`quality/reviews/results/build-code-default-11d8ff54dda5d70a5fcaa3251e16ae234449ccb8-d7808d5a-aaa7-4c39-acc7-484a99884f2a.json`，report=`quality/reviews/reports/d7808d5a-aaa7-4c39-acc7-484a99884f2a.md`。主代理逐条处置：`F-4e02455cb418`（stage_summary.artifacts 未纳入一致性检查）=`fixed`，补实现和 22/22 completion facts 测试；`F-9e9563e873f7`（T013/T014 完成区仍 pending）=`fixed`，补写任务事实；`F-3124676a62ba`、`F-af6cc711d3bc` 的 provider `invalid_anchor` major 原样保留，主代理核对后确认其指出的当前材料状态冲突具有真实语义风险，已按用户已确认的 build-plan→build-code 交接统一 decision-log/plan 当前状态，不把无效锚点改写成有效 provider 证据。Phase 3 full gate 为 `88/88`，hash RED `exit_code=1`、GREEN `3/3`；没有因 finding 或文档修复重复调用本 Phase provider。

Phase 4 已完成一次异源审查：attempt `38f60b2b-1f2f-48bb-908b-600b8a8f253d`，`kimi/coding`、`cursor/grok` completed，aggregate=`pass`；原始结果=`quality/reviews/results/build-code-default-3e54f2143a1950b9278456f2fa9856ef54361f36-38f60b2b-1f2f-48bb-908b-600b8a8f253d.json`，report=`quality/reviews/reports/38f60b2b-1f2f-48bb-908b-600b8a8f253d.md`。逐条处置：`F-0f02b5c57b14=fixed`（Supersedes/V12 状态统一）；`F-442c0660edde=fixed`（追加跨 Phase combined regression receipt）；`F-5039d613b859=fixed`（修正 decision-log skill 的断句）；`F-51dc3072dcf1=fixed`（verify 绑定 R3 research receipt 路径/hash，不匹配保持 unknown/incomplete）；`F-64657d4c6fdb=fixed`（契约测试覆盖当前 decision-log 实例）；`F-7bc3dbf6aad8=fixed`（补 Talk 队列和质量事实/推进资格/完成判据/不可逆授权边界）；`F-b67e3de23d1e=fixed`（provider-visible plan 不再写宿主绝对配置路径）；`F-ed9dd7e11678=fixed`（D20 明确是 FR-019/AC-022 的非新增范围澄清）；`F-d5c7e8936d08=rejected_invalid`（phase map 无安全 anchor 时保持 unknown 是 Constitution 要求的诚实事实）；`F-84fe1816f1e0=rejected_invalid`（Phase 5/6 尚未执行符合当前顺序，不是 Phase 4 缺陷）。Phase 4 gate `2/2` 契约测试和 3 文档 lint 通过，追加 combined regression receipt；没有因 finding 再次调用本 Phase provider。

Phase 5 已完成一次异源审查：attempt `3c6c01e7-54f0-41e5-8f82-ec1c254fc0d8`，result=`quality/reviews/results/build-code-default-33341edadca1ae46d46936e98b71e6e5d2acfb13-3c6c01e7-54f0-41e5-8f82-ec1c254fc0d8.json`，report=`quality/reviews/reports/3c6c01e7-54f0-41e5-8f82-ec1c254fc0d8.md`；`kimi/coding`、`cursor/grok` completed，aggregate=`pass`，无 timeout、provider unavailable、协议失败或 same-source。原始 finding 逐条处置：`F-e947806e0b90=fixed`，主代理已把 T009/T010 completion area 从 pending 补成 completed，并写入实际命令、13/13 e2e、receipt、AC、review 和时间；`F-2b6f902c6cc0=accepted_risk`，review 材料四张 Phase map 全部 unknown，原因是本阶段只验证当前材料读取错误语义，缺少安全业务 anchor 时不能伪造 complete，next_action 是在 Phase 6 integration/verify 的当前快照 AC trace 中补可验证锚点。该风险不阻断同任务推进，原始 finding/verdict 保留；不因 finding 重复审查 Phase 5。Phase 5 测试 `npx vitest run tests/e2e/vnext-five-stage-current.test.mjs` 为 `13/13`，验证 ENOENT=missing、非 ENOENT fail-loud 和未来材料不创建。

本轮 build-code 最终整合预检第一次 attempt `b14ee162-d440-4382-83b0-a3da1f6f68cc` 在 provider 调用前返回 `MATERIAL_INCOMPLETE`：当前 `tasks.md` 的早期 RED 任务把 `evidence_refs` 写成人话，整合解析器要求 canonical ref/hash 数组，因而没有 provider attempt；该失败事实保留，不能写成 provider unavailable 或审查完成。处理决定是只修当前任务记录格式：RED 的命令/exit 仍留在 `executed_commands`，`evidence_refs` 绑定实际存在的阶段 receipt，未把 GREEN receipt 伪装为 RED 证据。这个问题不扩张产品范围，但作为本任务执行缺口留给 verify-code 回放，防止后续任务完成区再次写出无法被整合审查读取的记录。

第二次整合预检 attempt `be4a8b83-09fc-4605-928c-a060cdcc040b` 在 provider 调用前返回 `MATERIAL_FORBIDDEN`：历史 Phase 覆盖不可重放时，整合 subject 把测试 receipt 的 `output_ref` 带入 provider packet。处理决定是让该分支只暴露 receipt `ref/hash`，保留原始输出在 canonical audit record，并用 `tests/contract/integration-review-subject.test.mjs` 固定不泄露断言；原始 unavailable 事实保留，不改 provider 配置，不把预检当成语义审查。

Phase 6 已完成一次异源审查：attempt `23831fc0-2578-423d-a2f2-bd079ffc880e`，原始 result 的 provider 均为 `revise_required`，aggregate=`pass`；6 个 `invalid_anchor` 和 2 个 minor 已逐条写入 T012，保留原始 verdict，不重复审查 Phase 6。之后的最终整合 review attempt `1211baea-1eb7-4a5f-a4af-28101a61f7e0` 在当前快照真实完成：`kimi/coding=pass`、`cursor/grok=revise_required`，aggregate=`pass`，无 timeout/provider unavailable/协议失败；result=`quality/reviews/results/build-code-default-be7729bf7f9dec12da224319a3d0f59076caf990-1211baea-1eb7-4a5f-a4af-28101a61f7e0.json`，report=`quality/reviews/reports/1211baea-1eb7-4a5f-a4af-28101a61f7e0.md`。`F-00547a1b42a5`、`F-eb8195773e3b` 的正式分类均为 `invalid_anchor`：前者要求把无法安全重放的历史 Phase 补成闭链，和当前-only/unknown 的 Constitution 边界冲突；后者要求 provider 生成的虚拟路径补更细 change authorship，当前 contract 已有每 AC 的 current change/test/evidence/anchor，且 Kimi 独立检查未发现问题。两条意见均记录为 `rejected_invalid`，verify-code 仍反向检查每个 AC；证据不足就写 `unknown/incomplete`，不把 aggregate pass 当完成。

verify-code 反向核验事实：四份当前材料均可读；当前 tasks 有 `14/14` 完成区；decision-log 保留 R1-R18、五份报告需求点和 INC-001~INC-015，spec 保留 FR-001~FR-020、AC-001~AC-023；R3 `quality/tests/research.json` sha256 与要求值 `422f4044bfc68952c8ca917057e6930e51f7825943b49a0727e1b2936457ffe0` 一致。当前用户流程核对的是 WorkflowHub CLI/技能链：原始需求→make-decision 当前材料→build-spec/build-plan 展开→build-code 实现与证据→verify-code 回放→用户确认；未来 PaperBuilder、KnowledgeDigest、浏览器业务流程按 D2/D4/D5 仍是后续项目验收输入，不在本任务冒充已实现。

verify-code full-suite receipt=`quality/tests/verify-code-full-suite.json`，sha256=`9c4ec3f47859cbef4fa2a7ec779c68f40851e77424250cf0ec65957674672da3`，`npm test` 为 `exit_code=1`，`1153/1172` 通过；失败集中在既有 `final-cutover-guards.red.test.mjs`、`contract/repository-inventory.test.mjs`、`workflow-v2-contract.test.mjs`、`integration/governance-learning-non-gate.test.mjs`。这四组失败原样保留，不能被当前任务的 focused receipt 或 AC 映射改写成 pass。当前 verification receipt=`quality/evidence/verification.json`，sha256=`296f53441cf826293960e98d5242a819289573cf77baa3ca7b1edf5c470a1769`；结论：current materials=`pass`、diff scope=`pass`、tasks completion=`pass`、browser QA=`not_applicable`，risk tests/core gaps=`fail`，acceptance criteria、review resolution、human handoff=`unknown`；整体 `incomplete`，不 close。

verify-code review attempt `5eb90d32-13cb-454f-be50-15fff06d5878` 真实完成：result=`quality/reviews/results/verify-code-default-2613703571b052e0927b7496fbe0d9d86902556c-5eb90d32-13cb-454f-be50-15fff06d5878.json`，sha256=`a145f46b00f7ec8f3341672bbe04e2d7b0c78fb3aef7f38cef839b191d9ed582`，report=`quality/reviews/reports/5eb90d32-13cb-454f-be50-15fff06d5878.md`；`kimi/k3`、`cursor/grok`、`antigravity/opus` completed，`codex/terra=SAME_SOURCE`，aggregate=`revise_required`。前三次 verify 材料预检 `eabefa62-817f-485a-a057-e2c65bc98bcf`、`670836d3-071f-4aa3-b5f9-c4e3b5dab400`、`a6b1f28f-226c-44b9-a5c6-1f441db23238` 均 `provider_attempts=[]`，分别因 acceptance aggregate 根路径、leaf 根路径和 evidence_type 输入错误失败；这些是调用方材料错误，不是 provider 不可用，均保留且未计入语义 review 次数。

verify finding 逐条处置：`F-1288e82b737e`、`F-295a6f216b58`、`F-5d35454ca1eb`、`F-7288c0db30b7`、`F-a197b2d42fd2`、`F-c8b3abe6413b`、`F-cb8a1d4cb1c3`、`F-ecdab2ee6359`、`F-fa75dbacc5bd`=`needs_human`：full-suite 失败、context/evidence map 未完成语义锚点、canonical evidence 初始空记录、per-AC 证据不足、R3/浏览器范围或逐项场景仍需人工判断；verify-code 不修代码、不重写任务材料，也不把严重风险静默变成 accepted。`F-2cb9170ee68e`、`F-51f600c695e1`=`accepted_risk`：分别是 AC summary 仍偏通用、provider packet 对 canonical evidence 只给 ref/hash 的审查质量限制，下一步由后续 verify/证据设计补齐，原始 minor 保留。`F-541911e057f8`、`F-c3bbcbc623cf`、`F-c453305449c5`=`needs_human`：虽然 provider 正式分类为 `invalid_anchor`，但它们指出的 pass/incomplete 矛盾、AC-003 R3 绑定缺失和 full-suite 失败影响是真实的，不能以锚点无效为由抹掉。浏览器意见只对实际 UI 业务适用；本 WorkflowHub CLI 任务按当前范围 `not_applicable`，PaperBuilder/KnowledgeDigest 的 UI 证据延期到各自业务任务。

本段 verify 事实写回 decision-log 后产生了仅文档/证据记录的 current-material revision；按 verify-code 规则不因 handoff 记录再次跑 full suite，也不重复 provider review。之前的测试和 review receipt 仍是其绑定 snapshot 的真实事实，当前结论因此继续保持 `incomplete/unknown`，不得 close。

### D21：审查结构错误必须 fail-loud，只有材料缺失才记 unavailable

- **关系**：R8、R14、R15、D5、D17 → D21；修正 review 结构错误被宽泛吞成 unavailable 的缺口。
- **选择/大白话**：材料真的没进来可以记 `unavailable`；哈希错、snapshot 脱离、provider 链损坏、verdict/schema 错不能藏起来，必须直接报错。
- **来源/事实**：verify-code 旧记录把结构错误和材料缺失混为一类；`safeReviewFacts()` 原先捕获所有异常。当前实现只降级 `MATERIAL_INCOMPLETE`/`ENOENT`，其余错误重新抛出；`tests/final-cutover-guards.red.test.mjs` 覆盖 fail-loud。
- **理由/影响**：不伪造质量事实，同时不把质量事实变成修复 gate；结构错误会暴露给当前任务，修复仍留在同一任务。
- **风险/延期**：调用方会更早看到明确错误；未来若增加可降级错误，必须先定义精确错误码，不能再 catch-all。
- **Supersedes**：`safeReviewFacts 捕获全部审查错误并统一写 unavailable`。

### D22：AC 汇总必须保留 leaf 结果，证据不完整时不能假绿

- **关系**：R2、R5、R14、D5 → D22；修正 `result=pass` 与 `status=incomplete` 并存造成的误读。
- **选择/大白话**：测试的原始 leaf 声明可以保留，但缺 metadata、非零 exit 或缺 canonical evidence 时，汇总结果只能是 `unknown`，不能继续显示成 pass。
- **来源/事实**：上一轮 verify finding 指出 AC summary 把通过声明和不完整证据混在一起；当前 `ac-evidence-summary.mjs` 读取 test receipt `exit_code`，保留 `leaf_result`，不完整时派生 `result=unknown`；4 个 AC summary 测试覆盖。
- **理由/影响**：读者能区分“测试声明通过”和“当前证据足够”；不新增 gate 或第二 completion authority。
- **风险/延期**：业务任务仍需提供真实页面/场景 evidence；本 WorkflowHub CLI 任务不冒充 PaperBuilder/KnowledgeDigest UI 已验收。
- **Supersedes**：`AC summary 只显示 leaf pass，不检查证据完整性`。

### D23：verify-code 用当前 verification receipt 做逐项原始需求回放

- **关系**：R1、R2、R4、R5、D1、D2、D5 → D23；落实“后续 stage 不能只看 spec/AC 自洽”。
- **选择/大白话**：verification receipt 里逐条列出原始 `R*`、报告需求点、`INC-*`、`D*`，绑定当前 snapshot、Design/任务 ID 和 canonical evidence；延期与暂时无法验证分开写。
- **来源/事实**：五份报告研究结论、verify-code 原始回放要求、当前 decision-log 的 ID 矩阵；当前 receipt writer 校验 `requirement_replay`，stage handler 校验缺项、额外项、snapshot/hash 和 unresolved 状态；`tests/final-cutover-guards.red.test.mjs` 覆盖。
- **理由/影响**：不另建永久 requirement ledger，回放事实和现有 verification receipt 共存；缺证据不能算 pass。
- **风险/延期**：五份报告中的业务页面、浏览器旅程和真实数据仍由对应项目实现；当前任务只能把它们标成 deferred 并保留来源。
- **Supersedes**：`verify-code 只反查四份当前材料和聚合 AC 映射`。

### D24：finding 处置必须是结构化当前事实，但不是隐藏门禁

- **关系**：R12、R14、R16、D16、D18 → D24；落实“审查后必须分析，不得直接推进”。
- **选择/大白话**：每个 finding 都记录原始事实、来源、后果、下一步、证据、owner、consumer 和保留/删除；状态只能是 `fixed`、`rejected_invalid`、`accepted_risk`、`needs_human`。它是交接事实，不是必须拿 pass 的门。
- **来源/事实**：用户明确要求主代理逐条分析；当前 `findingDispositions()` 校验每个 finding 的完整字段、ID 覆盖、重复/额外项和状态；`tests/final-cutover-guards.red.test.mjs` 覆盖。
- **理由/影响**：审查结果不会再被“做过”一句话掩盖，合法 finding 会回到同一 build-code Task；普通修复和推进仍不被质量事实阻断。
- **风险/延期**：`accepted_risk`/`needs_human` 不能宣称正式接受；当前最终 verify 仍需逐项判断并保留真实风险。
- **Supersedes**：`只在自由文本任务区写“review 已完成”，不保留逐条处置`。

### D25：同一 Task 修复后，用新的当前快照实现事实完成集成绑定

- **关系**：R2、R5、R8、D5、D14、D24 → D25；处理本轮 build-code 修复后旧 implementation receipt 仍绑定旧 snapshot 的执行缺口。
- **选择/大白话**：历史 `quality/evidence/implementation.json` 继续只读保留；同一 Task 的当前修复另写一个内容寻址的 `quality/evidence/implementation/<sha256>.json`，只绑定当前快照，不覆盖旧事实，也不创建 latest、replacement 或 successor 控制面。
- **来源/事实**：当前集成解析器已经只接受当前快照 implementation/green 证据；固定 implementation receipt 是 create-only，旧 receipt 的 snapshot 与本轮代码不同，导致真实修复无法进入当前集成审查。
- **理由/影响**：保住历史不可变，同时让同一 Task 能有真实的当前实现证据；集成审查显式消费返回的当前 ref，不能靠旧 receipt 或聚合测试绿冒充当前实现。
- **风险/延期**：当前 receipt 只证明 WorkflowHub 本仓库实现和其测试，不证明 PaperBuilder/KnowledgeDigest 的业务页面；业务 UI/真实数据验收仍延期给对应项目。
- **Supersedes**：无；这是对现有 create-only 事实模型的当前快照补充，不恢复退役 revision/latest API。

### D26：整合审查的 AC trace 必须保留全部已完成 Task，不得只取第一条

- **关系**：R2、R5、R14、R16、D23、D24、D25 → D26；处理当前整合审查把一个 AC 只挂到第一条完成任务、丢掉后续实现任务的追溯缺口。
- **选择/大白话**：同一个 AC 如果由多个已完成 Task 共同实现，就把这些 Task 全部列在 change 和 completion anchor 里；测试和当前 implementation receipt 仍绑定同一最终快照。审查意见可以指出映射错误，但不能要求凭空恢复不存在的历史 Phase 链。
- **来源/事实**：当前 build-code integration review `quality/reviews/results/build-code-default-592bba93ff3b480d4b5b9f710f6fb1cf3b8988a7-5d8abe2b-67ec-4fde-b908-f0e05a44195a.json` 指出 AC-023 只挂 T006、遗漏 T013/T014；本地核对 `tasks.md` 确认 T013/T014 都是 AC-023 的完成任务。`runtime/review/integration-review-subject.mjs` 原先用 `Map<AC, firstTask>`，已改为 `Map<AC, allTasks>`，并增加多 Task 回归测试。
- **理由/影响**：后续 verify 和第三方审查能还原“哪些任务实际改了什么”，不会因为第一条任务遮住后续修复；不新增 requirement ledger、selector 或历史控制面。
- **风险/延期**：旧 review receipt 中的错误映射仍是不可变历史；修复只对当前 snapshot 生效。历史 Phase 覆盖仍按 D27 公开为 unavailable/unknown，不为了让 provider 返回 pass 而伪造链。
- **Supersedes**：`一个 AC 只保留第一条完成 Task 的 change/anchor`。

### D27：历史 Phase 链缺失保持可见，不为整合 review 伪造补链

- **关系**：R14、R16、R17、D5、D21、D24、D26 → D27；处理当前 integration review 要求恢复旧 Phase review 链、否则拒绝整合的意见。
- **选择/大白话**：当前实现、当前测试、当前 AC trace 可以验证的内容照常验证；历史 Phase review 如果没有可认证的同快照记录，就明确写 `unavailable/unknown`，按风险处置，不重写旧记录、不补造 review/result、不把历史事实变成推进门槛。
- **来源/事实**：当前 integration review `F-ea76a3fe63fe` 的事实部分确认 `phase_coverage.status=unavailable`；WorkflowHub Constitution 明确历史 review/test/evidence 是事实，不是继续工作的许可证，缺失保持 unknown/unavailable。当前-only 分支已存在并由 `validateIntegrationMaterials` 校验 seam/AC trace 的诚实边界。
- **理由/影响**：保留真实审计缺口，同时允许同一 Task 修复当前代码；这正是“质量事实、推进资格、完成判据、不可逆授权分离”，而不是逃避审查。
- **风险/延期**：历史 Phase 的正式补证只能在已有真实不可变记录可核对时由独立维护任务处理；本任务不回写旧 receipt，也不执行 formal close。
- **Supersedes**：`整合 review 必须恢复一条无法认证的历史 Phase 链才能继续`。

### D28：build-code integration packet 必须给 provider 可审查的当前实现片段

- **关系**：R2、R5、R8、R14、D21、D25、D26 → D28；处理审查包只有任务勾选、没有当前实现代码和 canonical implementation summary 的缺口。
- **选择/大白话**：integration 不发送累计 diff 或完整项目，但必须从最终快照的 changed source hunk 选出有边界的实现片段，并把当前 implementation/GREEN receipt 的关键摘要放入 `canonical-evidence.json`；没有 changed source 时明确 `not_applicable`，不伪造代码覆盖。
- **来源/事实**：新的 integration review `quality/reviews/results/build-code-default-4f2c1d8b787f8be1ca2e5dc34bd5a10ba6651cb1-17bbf775-a48a-4d35-bdc1-fe29e9765fe9.json` 之前指出 packet 的 `canonical-evidence.json=[]`、`packet-plan` 排除 source snapshot，导致 provider 只能看到任务完成标记。已修改 `runtime/review/integration-review-subject.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/scripts/review-runner.mjs`，增加当前快照实现片段、路径安全锚点和 receipt 摘要；专项回归 `116/116`、`npm run check` 通过；新的独立 integration review 为 `verdict=pass`，唯一 finding 是历史 Phase `unavailable` 的 nonblocking minor。
- **理由/影响**：provider 能真正看到当前代码和证据边界，审查意见不再建立在“看不到实现”的误读上；仍不复制完整项目、不新增控制面、不把审查 verdict 当 stage gate。
- **风险/延期**：changed source 很多时片段数量和上下文成本会上升；当前实现按 hunk 选片段并受 bundle 约束，未来若超出边界必须显式缩减或失败，不能静默截断。没有实现变更的快照只记录 not_applicable。
- **Supersedes**：`integration 只发覆盖链/AC trace/test summary，不发任何当前实现片段`。

### D29：provider 越界访问按失败事实保留，不改共享配置或伪造异源通过

- **关系**：R8、R12、R14、D21、D24、D28 → D29；处理本轮 integration review 中一个 provider 的权限失败。
- **选择/大白话**：`cursor/grok` 本轮尝试访问 review bundle 以外的工具边界，记录为 `PROVIDER_PERMISSION_DENIED`；不改 wh-review 或 3rd-review 配置，不把失败改写成 pass。当前 policy 的最低有效 provider 数为 1，`pi/coding` 已完成真实 semantic review，整体 result 原样保留 `pass`，cursor 失败仍留在 attempt/report。
- **来源/事实**：attempt `quality/reviews/attempts/17bbf775-a48a-4d35-bdc1-fe29e9765fe9/attempt.json`：`pi/coding=completed`，`cursor/grok=failed`，错误为 `PROVIDER_PERMISSION_DENIED: Cursor Agent attempted a tool outside the scoped review bundle`；没有配置变更，也没有证据证明是 WorkflowHub 代码错误。
- **理由/影响**：遵守 Constitution 的 provenance 和 fail-loud 边界；一条有效审查事实可按现行最低 quorum 形成 semantic result，但 provider failure 不可隐藏，后续 provider/runtime 任务再独立调查。
- **风险/延期**：异源意见数量低于理想值，当前 packet 质量由有效 provider 和材料闭包证明；不能把本次 one-provider 结果描述成全部 provider 都成功。后续若政策提高最低 quorum，必须先解决真实权限/越界问题。
- **Supersedes**：`provider 调用失败后自动重试或清洗成通过`。

### D30：审查材料读取错误必须区分缺失与损坏，并移除不可达替代分支

- **关系**：R8、R10、R14、D21、D24、D28、D29 → D30；处理当前 integration review 指出的“任意读取/Git/JSON 错误都被降成 unavailable”以及 create-only receipt writer 中不可达 replacement 分支。
- **选择/大白话**：只有确实不存在的历史材料才可写成 `unavailable`；权限错误、损坏 JSON、Git 失败、hash/snapshot/provenance 错误必须直接暴露，不能伪装成缺失。receipt writer 只保留当前 Constitution 允许的 create-only 写入路径，删除不可达的 replacement 处理。
- **来源/事实**：当前 integration review `quality/reviews/results/build-code-default-cea03907abf122ff44db068a9220b85fec4851a5-062b7c39-fbbe-40de-814a-8d099202f564.json` 的 pi/coding finding；专项测试新增非 `ENOENT` `EACCES` 回归，覆盖 `integration-review-subject` 的 fail-loud 行为。
- **理由/影响**：审查不能把输入损坏误报为历史缺失；真实错误尽早暴露，便于修复，也不会新增 gate、selector、replacement 或共享配置改动。
- **风险/延期**：历史阶段材料仍可真实缺失并保持 `unavailable`；这不是当前代码质量通过，最终 verify 仍需披露并逐项处置。
- **Supersedes**：`integration/review subject 对所有材料错误统一降级为 unavailable`；不改变 D27 的历史缺失边界。

### D31：macOS 任务路径大小写按文件系统语义认证，manifest 身份仍严格匹配

- **关系**：R8、R10、R14、D21 → D31；处理当前任务在 macOS 上因旧存储目录为 `workflowhub`、manifest 项目身份为 `WorkflowHub`，`realpath` 后路径大小写变化而无法打开的问题。
- **选择/大白话**：macOS 的任务路径段允许大小写规范化，但任务 manifest 的 `project_name/task_id` 仍必须和请求身份精确一致；Linux 等大小写敏感系统继续精确匹配。不改任务数据、不改共享配置、不放宽 symlink 或目录边界。
- **来源/事实**：当前任务 `openTask` 实测原始错误为 `taskPath does not match Projects/WorkflowHub/tasks/...`；专项 `TaskHandle` 回归覆盖 macOS 大小写规范化路径，当前任务已成功打开并绑定同一 worktree。
- **理由/影响**：修复的是宿主文件系统大小写呈现，不是身份校验；恢复旧任务可继续验证，同时保留 manifest、Git worktree 和 symlink 安全检查。
- **风险/延期**：其他非标准历史存储布局仍需保持 fail-loud；本修复不迁移、重命名或覆盖历史任务目录。
- **Supersedes**：`realpath 后路径必须逐字符等于逻辑 projectName`；不改变 manifest identity mismatch 的拒绝规则。

### D32：Integration 历史 Phase 按各自快照保留，不能要求全部等于终态快照

- **关系**：R14、R16、D27、D28、D30 → D32；处理最新 build-code integration review 指出的历史 Phase 链被错误清空，以及 AC-008 旧 ID 特判永远不命中的问题。
- **选择/大白话**：当前 implementation/GREEN receipt 仍必须绑定最终快照；历史 Phase 的 review、phase-map、GREEN 各自绑定自己的 Phase snapshot，按阶段事实保留，不要求每个历史快照等于最终快照。无法认证的历史链继续写 `unavailable`，不能补造。AC 特判使用真实的 `AC-008`。
- **来源/事实**：最新 integration review `quality/reviews/results/build-code-default-7d0c15ed4842f911ff5c8fdedc7ebeb40ab26870-beb0b23e-ac24-48b1-8058-68cc3446a128.json`：`cursor/grok` 提出 major（Phase tree 被错误要求等于 final tree）和 minor（`AC-08` 与当前 `AC-008` 不一致），`pi/coding` 为 pass；结构结论与 `skills/wh-review/contracts/build-code.md` 的 ancestry/各段快照约束一致。
- **理由/影响**：不再把真实的多阶段历史误报成空链；仍保持当前终态证据严格同快照、历史缺失可见、质量事实不成为 gate。
- **风险/延期**：旧任务若没有 phase-specific review/map/GREEN binding，仍会保持 `unavailable`；本修复不把缺失历史变成 pass，也不改历史 receipt。
- **Supersedes**：`phaseCoverage 要求所有历史 Phase review.snapshot_tree === finalTree`；不改变 D27 的“不可认证历史不补链”边界。

### D33：当前-only 与部分历史链必须在合同和材料中明确区分

- **关系**：R14、R16、D27、D32 → D33；处理最新 review 对 `phase_coverage.status=unavailable/phases=[]` 合法边界的误读，以及部分 Phase binding 导致其他已认证 Phase 被一起丢弃的问题。
- **选择/大白话**：如果任务从未提供可认证的 Phase lineage，允许明确的 current-only integration：历史覆盖写 `unavailable`，当前 implementation/GREEN/AC trace 仍独立审查；如果只缺一部分 Phase，则保留已经认证的 Phase rows，把缺失行作为单独 audit gap，不清空整条链。两种情况都不是历史通过或阶段 Gate。
- **来源/事实**：最新 integration review `quality/reviews/results/build-code-default-d311fd6d4ef040892c9518f724bc6c86c9de8bb1-3c112a41-9647-4922-b4c1-50749fb4d1ab.json`：`cursor/grok` 的 major 认为合同禁止空链；`pi/coding` 的 minor 指出 partial row 会被整体验证失败。对照 D27、Constitution 质量事实非 gate 边界后，修正 `skills/wh-review/contracts/build-code.md` 的 current-only 合同，并让 runtime 按已声明 Phase binding 逐行保留/披露。
- **理由/影响**：合同和实现语义一致；不会把历史缺失误报为当前实现失败，也不会因一条坏历史记录抹掉其他真实历史证据。
- **风险/延期**：没有任何 Phase binding 的任务仍只有 current-only 事实；真正需要历史链的项目必须补齐各自 review/map/GREEN canonical binding，不能靠摘要或终态 receipt 猜测。
- **Supersedes**：`所有历史链缺失都必须阻止当前 integration` 与 `一条历史 binding 缺失就清空所有已认证 Phase`。

### D34：verify-code 的每条 AC 必须有可区分、可定位的证据

- **关系**：R1、R3、R14、D23、D24、D30、D33 → D34；处理最终 verify-code 审查暴露的泛化 AC 结果、部分 context map、UI 适用性未声明和无效 anchor 事实。
- **选择/大白话**：每条 AC 都必须写自己的场景、oracle、实际结果、实现/测试锚点和覆盖限制；只写“npm test 通过”或只挂一份 umbrella implementation receipt 不算通过证据，生成器必须降为 `unknown/incomplete`。标为 `complete` 的 context/evidence map 必须覆盖自己声称支持的全部 AC，锚点必须包含完整可读代码/测试块；纯 CLI/runtime 任务明确 `browser_qa=not_applicable` 及理由，UI 任务才要求真实浏览器证据。
- **来源/事实**：当前 verify-code review `quality/reviews/results/verify-code-default-f738d4b0ed1304fc50f4d713ece2e6b497a81868-a413d6f7-8cb8-4c38-9b40-ce852570d7ba.json`：`antigravity/opus` 指出实际结果模板化、context map 只覆盖 AC-001~AC-004、browser 适用性未声明、实现证据共用；`pi/k3` 指出 runtime anchor 截断，但该 anchor 被 adjudication 标为 `invalid_evidence`；`cursor/grok` 认为当前证据链完整。重新生成的当前 integration subject 已确认 AC-001~AC-023 全部有 entry。
- **理由/影响**：把“有 leaf”收紧为“能解释这条 AC 为什么成立”，降低 verify-code 用绿测试和批量模板掩盖漏验收的风险；不新增质量 Gate、不改变 provider 配置、不要求无 UI 任务伪造浏览器证据。
- **风险/延期**：历史业务项目的 browser/reader 结果仍延期，报告需求只能保持 `deferred`；任何未来任务若无法提供 AC-specific evidence 必须显示不完整，不能为交付方便自动补齐。
- **Supersedes**：`只要每条 leaf hash 不同就足够` 与 `context map 有一个大范围锚点即可声明 complete`。

### D35：审查材料和质量 warning 必须与真实交付语义一致

- **关系**：D21、D24、D30、D34 → D35；处理最新 build-code integration review 对 unavailable warning 和 packet-plan delivery mode 的 minor 事实。
- **选择/大白话**：如果 build-code review 已明确 unavailable，只保留一条“审查不可用、当前验证不完整”的 warning，不再追加没有意义的 scope mismatch；integration review 的 packet-plan 明确标记 `selected_context`，因为它交付的是当前快照选定片段，不是完整 inline 材料。
- **来源/事实**：当前 build-code review `quality/reviews/results/build-code-default-5eb78dafa043bd1e9b7d6ed45ba46b41b3470c5b-fbfa1f16-e650-4464-b300-eae79d85ad17.json` 中 `pi/coding` 提出的两条 minor；对照 `runtime/stage/stage-handlers.mjs` verify warning 分支和 `skills/wh-review/scripts/review-materials.mjs` packet-plan 生成逻辑确认均为真实可修复问题。
- **理由/影响**：质量事实更准确，provider 看到的交付模式不再与包内容矛盾；不改变 review verdict、provider 配置或质量非 gate 边界。
- **风险/延期**：历史已发布 packet-plan 只读保留；未来新增交付模式仍须先定义真实 consumer，不能用 metadata 修饰掩盖材料缺失。
- **Supersedes**：`unavailable 后继续做无条件 scope mismatch 检查` 与 `integration 没有 diff-index 就默认 inline_complete`。

### D36：verify-code 复用同快照完整测试收据

- **关系**：R1、R14、D18、D19、D34、D35 → D36；处理本轮发现的“阶段不同导致完整测试重复执行”问题。
- **选择/大白话**：verify-code 可以消费 build-code 已产生、且仍绑定同一工作区快照的完整测试收据；verify-code 的定向检查单独记录，不因为阶段名不同再跑一次 `npm test`。
- **来源/事实**：本轮运行发现 `testFacts()` 默认要求 `producer.stage === worker.stage`，所以 verify-code 会拒绝同快照 build-code 的完整 `npm test` 收据；这与已确认的增量验证原则冲突。
- **理由/风险**：只放宽 `tests` 收据允许的生产阶段为 `build-code`/`verify-code`，任务、快照、命令结果、输出路径和哈希仍走原有校验；implementation、review、evidence 等收据继续严格阶段绑定，避免跨任务或跨快照复用。
- **验收/延期交接**：定向回归必须证明 verify-code 能消费同快照 build-code 测试收据；只有生产代码或测试合同改变导致快照失效时才跑一次新的完整套件。本次修复不重复采集已完成的证据审查。

### D37：完整测试自动复用，审查事实不变成交付门禁

- **关系**：R1、R14、D16、D19、D36 → D37；处理本轮继续发现的“采集端仍会重新执行完整测试”和 verify-code 把历史/不可用 review 变成 `verification_failure` 的矛盾。
- **选择/大白话**：verify-code 采集 `npm test` 时自动查找同任务、同快照、同源码摘要、退出码为 0 且输出哈希有效的 build-code 收据；找到就直接复用，找不到才执行一次。测试收据还必须校验 `command_hash`，verify-code 只把精确的 `npm test` 当完整套件。review 的 `pass`、`revise_required`、`unavailable` 和旧快照都保留为质量事实/审计 warning，不因 review 本身设置交付失败；真实测试失败、AC 失败和结构错误仍 fail-loud。
- **来源/事实**：Carver 审计发现 D36 只放宽了消费端，`workflows/verify-code/capture.mjs` 仍可启动新命令；同时 `testFacts()` 未验证命令哈希，verify handler 对 review 非 pass 仍加入 `mismatches`。本轮定向回归证明采集端复用和非门禁结果。
- **理由/风险**：把“是否重跑”变成收据有效性判断，避免重复耗时又不接受伪造/旧快照；把 review 与业务交付分开，避免审查意见被误当成流程 gate。风险是无有效当前完整收据时仍需执行一次 `npm test`，以及质量状态可能继续是 `incomplete`，必须原样交接。
- **验收/延期交接**：复用测试必须保留原始 receipt/output ref/hash；源码、快照、命令或输出任一变化都不能复用。verify-code 必须完成当前测试/AC/结构检查，并在摘要中披露 review 质量状态；不重复前三阶段或同快照的已完成审查。测试合同和阶段摘要的统一规则留给后续任务继续沿用。

### D38：材料变更不触发全量测试，质量事实按谓词独立记录

- **关系**：R1、R14、R17、R18、D36、D37 → D38；处理“tasks.md/decision-log.md 只改交接内容却再次启动 `npm test`”以及一个 review/任务缺口污染无关测试和 AC 状态的问题。
- **选择/大白话**：测试合同只看实现、测试和命令/输出；当前四份材料的变更不让完整测试 receipt 失效，但当前 AC、replay 和材料事实仍要重新核对。发布 quality fact 时，测试、AC、review、confirmation 各看自己的证据，不能用一个全局 missing 把别的事实一起改成 missing。
- **来源/事实**：T015 RED 暴露 material-only 编辑后 receipt 未复用；stage-runner 使用全局 `missing` 降级了无关测试/AC；当前 focused 定向回归 `140/140` 通过，未重新运行 `npm test`。
- **理由/影响**：避免重复耗时，同时保持快照、source/test-contract digest、命令哈希和输出哈希校验；review 的 `revise_required`/`unavailable` 仍原样保留为质量事实，不变成通过，也不变成普通推进 gate。
- **风险/延期**：材料路径匹配必须只覆盖当前任务四份材料；实现或测试合同任何变化都必须让旧 receipt 失效。最终 verify 仍需在没有当前有效完整 receipt 时运行一次完整套件，不能用 focused receipt 冒充完整回归。
- **验收/延期交接**：T015/T016 采用 RED/GREEN 配对；material-only receipt 复用、快照隔离和 predicate 独立发布由定向测试覆盖。后续阶段必须重新生成当前 AC/replay 证据，不能沿用旧材料结论。

### D39：completion wrapper 必须按 canonical facts 发布独立质量谓词

- **关系**：D38、INC-036 → D39；处理“verify-code 有开放 review finding 时，AC/exception 被错误发布为 missing”的实现缺口。
- **选择/大白话**：stage-runner 读取 `result.completion.facts.business_facts`，分别发布 test、AC、review、confirmation；不能把 `completion` 外层 wrapper 当成 facts，也不能用一个 review warning 污染无关谓词。
- **来源/事实**：官方 verify 的真实当前快照曾发布 `acceptance_criteria=missing`、`exceptions=missing`，但 canonical verification item 为 `pass`；根因是读取路径少了 `.facts`。修复后定向回归 `92/92` 通过。
- **理由/风险**：修复真实状态错误，不改变“review finding 保留为质量事实、不是交付 gate”的宪法边界。风险是已有旧 quality fact 仍只读保留，必须用当前快照重新发布；本次不重跑 provider 审查。
- **验收/延期交接**：定向测试必须证明存在开放 review 时 AC/exception 仍能按各自证据发布 `passed`；全量 `npm test` 的最后通过收据只对修复前一版源码有效，本轮不伪造为当前快照，后续若需要正式最终快照收口再单独建立一次。

### D40：完整回归只在新实现边界运行一次，后续按影响范围定向验证

- **关系**：用户关于“不要一直做全量测试”的当前要求、D36-D39 → D40；把增量验证规则落实到本轮实际修复。
- **选择/大白话**：材料、证据、任务交接或审查记录变化只跑受影响的合同测试；如果生产代码或测试合同变化让旧完整收据失效，也不循环重跑，先用定向测试确认修复，再把完整测试状态诚实记为 `unknown/stale`，等真正需要新的最终快照时最多跑一次。
- **来源/事实**：`final19` 是 completion-wrapper 修复前的完整测试收据；修复后 `vnext-official-stage-run`、`final-cutover-guards`、`stage-completion-facts` 定向回归 `92/92` 通过。用户明确要求停止重复全量回归，本轮不把 `final19` 冒充当前实现的完整通过证据。
- **理由/风险**：避免把全量测试当作每次材料同步的仪式，同时保留当前实现变化带来的真实风险；当前完整测试事实保持 `unknown`，不降级为假通过，也不把它变成 WorkflowHub 交付 Gate。
- **验收/延期交接**：当前验证 receipt 必须引用当前材料/实现/证据，并把 `risk_tests=unknown` 与原因写清；后续只有生产/测试合同再次形成新的最终验证边界时，才建立一次新的完整收据。

### D41：审查处置只针对 canonical reportable findings

- **关系**：D24、D37、D40 → D41；处理正式 verify 时把 `adjudication.clusters` 中未被当前结果采纳的旧分歧误报成当前处置项的问题。
- **选择/大白话**：当前 review result 的 `findings` 是要分析和记录处置的正式发现；`adjudication.clusters` 只保留异源分析溯源。旧格式没有 `findings` 时才回退 clusters，不能把两套集合混成一套当前门槛。
- **来源/事实**：重新发布 verify 时，build-code 的正式 `findings` 只有 F-7e3ee94dc90a，但 clusters 还带 3 条未采纳历史分歧；verify 的正式 findings 是四条 F-aa/F-b199/F-ca69/F-da37，但 clusters 还带 4 条额外旧分歧，造成多余 warning。已增加 canonical finding 选择逻辑。
- **理由/风险**：保留所有 provider/adjudication 原始事实，同时只要求当前正式结果逐条分析；当前严重 canonical finding 仍走风险处置路径，不会因去掉未采纳分歧而被漏掉。旧 review 记录不修改。
- **验收/延期交接**：`stage-risk-acceptance`、`final-cutover-guards`、官方 stage-runner、completion wrapper 定向回归 `100/100`；后续 review 处置必须使用 canonical findings，不能按历史 clusters 自动制造新的 finding。

### D42：逐 AC 证据图禁止复用同一 proving anchor

- **关系**：D23、D34、D41 → D42；把“每个 AC 有锚点”进一步收紧为“每个完成 AC 有自己的实现/测试证明块”。
- **选择/大白话**：`evidence_map` 中不同完成态 `AC-*` 不能共享完全相同的 `path + 行范围 + role` 锚点；发现复用就标记 `MATERIAL_INCOMPLETE`，要求回到对应实现或测试块补独立证据。只换 anchor id 不算不同证据。
- **来源/事实**：当前 verify raw finding `F-b19968dd90ac` 明确指出 AC-002/009、AC-012/020 复用实现锚点；`F-da37494c7eaf` 还指出 23 条 AC 的证明过度模板化。原有校验只检查“每条 AC 有 anchors”，没有检查 anchor 是否被另一条 AC 复用。
- **理由/风险**：在 review/verify 前暴露证据无法区分的问题，避免下游拿同一段代码冒充多个需求已证明；规则只约束 v2 evidence map 的完成条目，不新增控制面，不把 review 变成交付 gate。风险是历史 map 可能因此变成不完整，必须保留 unknown/incomplete，不得静默改写。
- **验收/延期交接**：`validateAuthorityMap("evidence_map", ...)` 和定向合同测试必须拒绝不同 AC 复用同一 proving anchor；后续 build-code/verify-code 必须为每个 AC 提供独立 implementation/test block，或诚实记录 `unknown/not_applicable`。

### D43：前置阶段必须验证语义证明，不得把结构映射当成需求完成

- **关系**：R2、R4、R5、R11、R14、R16、R19、F15-1/F15-2、F47-1/F47-2、KD-1/KD-2/KD-3/KD-4、F8-1/F8-2/F8-3、M08-1/M08-2/M08-3 → D43。
- **选择/大白话**：`decision-log` 记录来源和决策，`spec/plan/tasks` 记录设计和执行，但这些编号、引用、哈希、任务完成行都不能单独证明用户结果。每个当前 AC 和每条原始需求回放必须有具体场景、判断标准、实际结果、独立实现/测试锚点和覆盖限制；缺任何一项就保持 `unknown/incomplete`。
- **来源/事实**：五份复盘及当前 verify raw findings `F-aa3485117c18`、`F-b19968dd90ac`、`F-ca69c836cd48`、`F-da37494c7eaf`；前置校验主要验证 map/ID/ref/hash，未验证证据内容是否真的证明需求。
- **理由/风险**：把遗漏提前暴露在 build-spec/build-plan/build-code，而不是等 verify 或最终验收猜测。风险是历史材料会被正确降级为 unknown；不得为了绿色而补写虚假用户结果。
- **验收/延期交接**：运行时和 review material contract 必须拒绝模板化/共享证明块；逐条 replay 必须绑定当前 snapshot 和真实证据。五份报告中的业务页面和真实数据实现仍延期给对应项目，但不能再被本任务的“结构覆盖”冒充完成。

### D44：build-code/verify-code 的临时需求使用轻量 scope-revision 专用审查

- **关系**：R17、R18、R19、D18、D19、D43 → D44；约束后续所有 WorkflowHub task 的中途需求修订。
- **选择/大白话**：临时需求不创建新 stage、successor task、reopen、ledger 或 provider 配置。主代理直接和用户 Talk/Clarify/Grill（不能交给子代理），在同一个 task 内同步 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md` 四份材料，然后调用现有 wh-review 路由的一次专用 `scope_revision` review。该 review 只判断临时需求是否合理、是否符合核心目标、四份材料和用户流程/数据状态/成功失败边界是否一致、实现/测试/交付影响是否完整、风险/延期/宪法边界是否清楚；不审查代码是否已经通过，也不因 verdict 不是 `pass` 循环审查。
- **来源/事实**：用户 U15；Carver scope_revision 设计审计；现有 material revision/CAS、review delta、provider routing 和 Constitution F3/F4/F7/F9。
- **理由/风险**：比完整五阶段回退更省时，但保留需求变化的核心判断。四份材料任一缺失、关系断裂或影响矩阵不完整时，必须在 provider 前 `MATERIAL_INCOMPLETE`；review `revise_required/unavailable/timeout` 原样保留为质量事实，不成为隐藏 gate。
- **验收/延期交接**：新增专用 scope-revision prompt/contract/schema/定向回归；同一 revision 只允许一次语义 review，结果必须保留原始 verdict/finding 和逐条 disposition。影响代码的修订仍回到受影响 build-code，影响验收的修订仍回到 verify-code；不是重新走完整五阶段。

### D45：恢复 spec/plan/tasks 的内容 skill 与模板，但不恢复第二控制面

- **关系**：R20、R1、R4、R11、D1、D4 → D45；这是当前 scope revision 的第一个修复决策。
- **选择/大白话**：恢复四个可搬运的 `spec-specify`、`spec-clarify`、`spec-plan`、`spec-tasks` skill 及其模板，并接回 `build-spec`/`build-plan` 的 inline 依赖。模板负责把场景、状态、失败条件、STOP、oracle、证据和追溯写全；阶段 SKILL 仍是唯一编排入口，四份材料仍是唯一当前真相。
- **来源/事实**：Git 直接证明 `775b57f` 删除了 4 个 spec skill、3 个模板和相关测试；`432c73d`/`5728ed8` 曾先削弱再补回模板合同；当前 catalog 仍引用这些不存在的路径并标记 absorbed。Carver/Bohr 审计确认“功能曾被吸收，但没有等价的可执行内容引导”。
- **理由/风险**：只靠短 SKILL 概括文字会把质量重新交给 agent 临场发挥；恢复模板能把缺口提前暴露。风险是重复格式或第二真相，因此明确模板只做 content contract，禁止新增 stage、ledger、permit、状态机。
- **验收/延期交接**：build-spec/build-plan manifest 可解析这些 skill；bundle/catalog/registry closure 通过；模板字段测试覆盖 scenario/state/failure、Constitution/STOP/rollback、RED/GREEN/oracle/evidence/DAG；后续阶段继续使用同一四份材料。

### D46：把 AgentHub apply 的高价值闭环适配到 build-code

- **关系**：R21、R2、R14、R16、D24、D43、D44 → D46；这是当前 scope revision 的第二个修复决策。
- **选择/大白话**：每个 Task/Phase 先形成小型 Phase Card（目标、精确文件边界、AC、非目标、兼容边界、STOP、测试层级），再按 RED→实现→风险测试→GREEN→差异/消费者扫描→一次独立 review→逐条 finding 处置→大白话交接执行。保留 AgentHub 的质量顺序，不搬它的门禁、强制 commit、平行 worktree、新 session 或历史 permit。
- **来源/事实**：AgentHub `apply.md` 约 419 行，明确 Phase Card、RED/GREEN、测试执行器、phase report、review finding 修复和 handoff；当前 WorkflowHub `build-code/SKILL.md` 约 152 行，只有 Task→focused test→review→completion area；`steps.json` 还没有测试 blueprint/route 证据。Newton/Confucius 审计确认当前文档和运行时存在流程断层。
- **理由/风险**：当前流程太容易按 plan/task 机械改代码，导致跨状态、接口、并发和用户结果遗漏到 verify 才发现。适配后证据更多，但只围绕真实 changed scope，不把质量事实变成推进许可证。
- **验收/延期交接**：build-code SKILL、steps 和 focused contract test 明确 Phase Card、差异扫描、finding 根因/处置、handoff；缺失事实显示 unknown/incomplete；review pass、commit、clean worktree 和 full-suite 都不能成为普通推进 gate。

### D47：每 Phase 和最终收口使用分层测试技能并留痕

- **关系**：R22、R21、D40、D46 → D47；这是用户在本轮审计中追加的具体测试质量要求。
- **选择/大白话**：先让 `test-routing-advisor` 根据真实 changed files 选 `simple/feature/fullstack`，再由 `testing-system-blueprint` 扫描行为、状态/数据、错误/恢复、权限、并发、跨模块 seam、UI 和 coverage limits；最后调用适用的 `backend-testing`、`frontend-testing` 或 `fullstack-slice-testing`。每个 Phase 都保存命令、oracle、实际结果、跳过原因、coverage limits、报告和 snapshot；所有 Phase 结束后，在最终当前快照上重新走一次 route/blueprint/适用 executor，再保存聚合报告。RED/GREEN 仍保留，但只是时序证据，不再冒充完整质量。
- **来源/事实**：AgentHub `testing-system-blueprint`、`backend-testing`、`frontend-testing`、`fullstack-slice-testing` 和 `apply.md` 的测试路由/报告要求；当前仓库只有 `test-routing-advisor`，且 build-code manifest 没有接入它或其他执行器。Galileo/James 的独立审计确认这一层是当前缺口；用户 U17 明确要求恢复。
- **理由/风险**：这样能在 Phase 内发现 seam 和状态遗漏，而不是把所有问题推到 verify；代价是每个 Phase 多一份结构化报告。通过按风险层级和受影响范围执行，避免重复无关的全量测试。
- **验收/延期交接**：build-code manifest/steps/SKILL 宣明五个测试技能及 conditional route；测试合同验证 Phase 报告和 final summary 的字段；测试失败、不可用和 skipped 如实保留，不阻止同 task 修复或普通推进。浏览器只在 UI 适用时走独立 browser QA。

### D48：scope_revision 只交付受影响摘录，不复制四份完整材料

- **关系**：R19、D44、D45-D47 → D48；这是本轮轻量 scope_revision 实测后的设计修正。
- **选择/大白话**：专用 packet 只带四份当前材料的受影响段落摘录，同时绑定原文件路径、字节数和 SHA-256；每份摘录最多 24 KiB，整个 packet 超过 330 KiB 在 provider 前直接标记 `MATERIAL_INCOMPLETE`。这样审查的是临时需求和直接影响，不会重新吞掉完整 `tasks.md`。
- **来源/事实**：首次真实 packet 试验把完整四份材料装入约 342 KiB；当前 `tasks.md` 的历史任务区占用主要上下文，但 scope_revision 不需要重审未变更历史。压缩后当前受影响摘录 packet 实测约 74.7 KiB、`inline_complete`，仍保留四份原文件 hash 绑定。
- **理由/风险**：上下文更小、审查边界更清楚；风险是摘录漏掉直接影响，因此 provider 前必须有四材料/consumer coverage 校验，摘录必须由主代理从当前文件选择并绑定原 hash，不能凭空摘要。
- **验收/延期交接**：scope_revision contract、packet writer 和 focused test 必须拒绝超长摘录、保留 source hash，并验证 packet < 330 KiB；超出或无法安全截取时保留 `MATERIAL_INCOMPLETE`，不偷偷退回全文或继续调用 provider。

### D49：在 build-plan 固化测试策略，build-code 只执行

- **关系**：R23、R22、D47、D48 → D49；这是对 D47“每 Phase 重新 route/blueprint/executor”实现方式的修正，不改变测试覆盖目标。
- **选择/大白话**：高智力模型在 `build-plan` 为每个 Task/Phase 使用五个测试技能设计测试层级、风险维度、场景、命令、oracle、fixture/service、证据路径和 coverage limits，并把完整策略写进 `tasks.md`。`build-code` 只读取任务卡、执行这些策略、记录真实结果；普通模型不重新判断测试方案。最终当前快照也用一张提前设计的 final Task/Phase 卡表达，不再临时重走三套设计技能。
- **来源/事实**：用户 U18；R22/D47；AgentHub apply 的测试质量来自“先设计、再执行、留痕”，而不是每个执行阶段反复重新规划；前一版本任务实现把设计技能放进 build-code manifest，造成 token 和时间浪费，也让执行模型承担了不该承担的测试设计判断。
- **理由/风险**：把高智力集中在 build-plan，能让普通执行模型按明确 oracle 做稳定执行，减少每 Phase 漂移和重复成本。新风险是 build-plan 的策略若写得含糊，会把错误前移；因此 tasks contract 必须拒绝缺少命令/oracle/证据边界的策略，缺失时标记 `MATERIAL_INCOMPLETE` 并回到材料修复，不能让 build-code 临场猜测。
- **验收/延期交接**：build-plan manifest 声明五个设计技能；tasks 模板逐 Task/Phase 固化 strategy owner、tier、scenarios、commands、expected exit、oracle、fixtures、evidence、limits 和执行契约；build-code manifest 不再声明五个设计技能，steps 只记录 strategy/result；测试失败、不可用和 coverage gap 仍是质量事实，不是 pass gate。普通模型执行策略的实际效果由后续 build-code/verify-code 证据验证。

### D50：任务完成区只接受 TaskKernel 可认证的 canonical evidence_refs

- **关系**：R21、R23、D43、D49、T017-T024 → D50；这是把“任务行已勾选”与“完成事实可验证”分开的最后一段证据链。
- **选择/大白话**：`tasks.md` 的 `evidence_refs` 必须是 TaskKernel 能读取、校验类型、哈希和当前记录的 canonical JSON 引用；控制台标签、口头说明和不支持的 `kind` 只能写在备注，不能冒充完成证据。引用缺失或认证失败时，任务保持 `incomplete`，不因结构检查绿灯而自动完成。
- **来源/事实**：本轮直接 completion validation 曾返回结构 `ok`，但 TaskKernel 认证的 `complete=0`；T017-T019 还含不支持的 evidence kind，T020-T024 使用了非 JSON 控制台标签。通过 canonical receipt `quality/tests/build-code-task-strategy-current-20260805.json`（receipt hash `c2cfd28280c4b541d2f914705d2bf6ee0d19b1843425f822ea92a07dbaac4de7`）修复后，认证结果为 `complete=24`、`pending=[]`、`invalid=[]`；未来任务的 `spec-tasks`/tasks template/build-code contract 也已补上同一规则。
- **理由/风险**：否则后续 stage 会把“材料写得像完成”当成“事实已经完成”，正好重现本任务一直追查的假完成。代价是每次勾选任务都必须写入真实 receipt；这增加一点操作约束，但不增加 provider、full-suite 或质量 gate。
- **验收/延期交接**：build-code 必须先发布 canonical task receipt，再勾选完成；verify-code 读取认证结果而不是只读 markdown。旧标签和旧失败事实只读保留；canonical receipt 不代表完整回归、provider review 或用户交接已经通过。

### 当前 scope-revision 的主代理沟通记录

- **Talk**：主代理用大白话说明了三个选项：只补文档；恢复历史内容合同和测试闭环但不搬 AgentHub 门禁；或整套搬回 AgentHub。用户明确要求调查并把两项改进纳入当前 task；追加消息进一步明确每 Phase 和最终收口必须使用分层测试技能并留痕。选择第二项。
- **Clarify**：当前用户已经明确新增需求的测试层级和留痕范围，无需把它猜成“每次全量回归”；完整回归仍按 D40 保持受影响/最终边界执行。
- **Grill**：主代理检查了四材料传播、现有 provider 配置、Constitution 的非 gate 边界、公共 stage 数量、同 task scope revision 和历史事实不可改写；没有新增 stage、provider、ledger、permit 或 commit gate。
- **用户回应**：本轮用户直接要求继续调查并补上这组测试/留痕质量要求；该回应由主代理记录，不由子代理代答。

## 当前执行事故与修复事实

- **INC-016**：完整回归第一次重跑暴露 3 组架构生成物过期（inventory、complexity baseline/final）以及 2 个 skill bundle hash 过期；原因是当前候选修改后生成物未重新收口。已按提供的架构脚本重生成 inventory/complexity，并同步 `skills/wh-review/skill-bundle.json`、`skills/catalog.yaml`；架构/归档/skill dispatch 聚焦测试 `11/11` 通过。
- **INC-017**：审查结构校验原来把非法链、hash/snapshot/provenance 错误降成 unavailable；已按 D21 改为精确降级，结构错误 fail-loud，聚焦与集成回归已覆盖。
- **INC-018**：AC summary 曾把 leaf `pass` 直接展示为整体 pass；已按 D22 增加 `leaf_result` 与派生 `unknown`，缺证据/非零 receipt 不再假绿。
- **INC-019**：上一轮 verify 只有聚合 AC 映射，没有当前 snapshot 绑定的逐项原始需求回放；已按 D23 把回放写进同一 verification receipt 契约，未新增台账或控制面。
- **INC-020**：审查后只有粗粒度 warning，finding 可能未分析就 handoff；已按 D24 增加当前 invocation 的结构化处置事实，保留原始 review，不把处置变成 gate。
- **INC-021**：同一 Task 的本轮修复改变了实现和 snapshot，但固定 implementation receipt 仍绑定旧 snapshot；若继续使用它，集成审查无法证明当前代码。已按 D25 增加内容寻址的当前 implementation receipt，旧 receipt 保持只读，未改 provider 配置、latest/replacement 或 successor 控制面。
- **INC-022**：当前快照 build-code integration review 发现 AC trace 只保存每个 AC 的第一条完成 Task，AC-023 因此漏掉真实实现任务 T013/T014；同一 review 还把历史 Phase coverage unavailable 当成必须补链的 blocking finding。已按 D26 修改整合 subject 为保留全部完成 Task，并增加回归；按 D27 将历史链缺失保持 unavailable/unknown，作为 `accepted_risk` 事实处置，不伪造历史、不阻断同任务修复。
- **INC-023**：修复 D26 后首次重做 integration packet 暴露两个材料生成问题：实现片段锚点把源路径中的 `/` 直接放进临时文件名，导致 bundle 生成 `ENOENT`；且旧测试夹具没有 changed source 时错误要求 implementation excerpt。已按 D28 将锚点 ID 改为安全路径名，并允许无实现变更时显式 `not_applicable`；新的当前快照 packet 生成成功，专项回归和 full suite 均通过。
- **INC-024**：D28 修复后的真实 integration review 中，`pi/coding` 完成 semantic `pass`，`cursor/grok` 因尝试访问 review bundle 外工具失败，错误为 `PROVIDER_PERMISSION_DENIED`。按 D29 保留原始 attempt/provider failure，不改共享配置、不重复同快照 review、不把 one-provider 事实夸成全 provider 成功；当前 review result 仍按现行最低 quorum 为 `pass`，该 provider 风险延期到独立 provider/runtime 调查。
- **INC-025**：当前 integration review 发现 `integration-review-subject` 把非 `ENOENT` 的权限、Git、JSON 和结构错误误报成 `unavailable`，并发现 receipt writer 中 replacement 分支不可达。已按 D30 改为非缺失错误 fail-loud、仅 `ENOENT` 精确降级，并删除不可达分支；新增专项回归通过。原审查 finding 保留为历史事实，不能被新测试结果覆盖。
- **INC-026**：最终证据采集前，当前任务在 macOS 上因存储目录大小写被 `realpath` 规范化而无法通过 `openTask`；不是 provider 或任务材料错误。已按 D31 修复路径段认证并加入回归，当前任务重新打开成功；不修改任何共享 provider 配置。
- **INC-027**：最新 integration review 发现历史 Phase coverage 把每个 Phase 的 `snapshot_tree` 错当成必须等于终态树，导致多阶段链被降为 `unavailable/phases=[]`；同时发现 `AC-08` 与当前 `AC-008` 不匹配。已按 D32 改为按各 Phase 自身 review/map/GREEN 快照绑定，并修正 AC ID；专项回归通过。原 provider finding 保留，未因 aggregate `pass` 被覆盖。
- **INC-028**：D32 修复后的最新 integration review 暴露合同文字与 D27 current-only 边界冲突：provider 将诚实的历史缺失 `unavailable/phases=[]` 视为禁止的空链。已按 D33 修正 build-code review contract，明确 current-only 是非 gate 质量事实；provider finding 保留为审查事实，不伪造为代码缺陷。
- **INC-029**：同一最新 review 指出部分历史 Phase binding 会因一行缺失而丢失其他已认证行。已按 D33 将 phase coverage 改为只处理声明了 lineage binding 的 rows，逐行保留成功 binding、逐行记录 unavailable gap；没有任何 binding 时才走明确 current-only fallback。专项回归通过。
- **INC-030**：D33 修改 build-code review contract 后，第一次最终 `npm test` 如实暴露 skill bundle 中 `contracts/build-code.md` 的 hash 未同步，2 个 dispatch 测试失败；已定位为生成物同步问题，不是 provider 或业务失败，现已同步 bundle/catalog hash 并通过专项测试。
- **INC-031**：最终 verify-code 审查暴露 23 条 AC 的 actual outcome 仍是模板化描述、context map 只覆盖 AC-001~AC-004，且纯 CLI/runtime 任务没有显式 `browser_qa=not_applicable`；已按 D34 收紧生成器/技能合同，并重建逐 AC 特定证据和全量 map。
- **INC-032**：同一 verify-code 审查中的 `pi/k3` 报告 runtime anchor 在多行表达式中截断；审查系统将其归类为 `invalid_evidence`，不是实现缺陷；已把锚点范围收敛到完整表达式，并在 finding disposition 中保留原始事实。
- **INC-033**：最新 build-code integration review 发现两条真实 minor：verify-code 在 build-code review unavailable 时追加冗余 scope mismatch，且 integration packet-plan 错标 `inline_complete`；已按 D35 修复并保留原始 review finding。
- **INC-034**：verify-code 原先因 `tests` 收据必须属于 `verify-code` 而拒绝同快照 build-code 的完整 `npm test` 收据，制造不必要的全量回归；已按 D36 允许两个阶段的 tests 收据并加入定向回归。此次修复后不重复此前已完成的全量测试；若最终生产快照确实改变，最多只做一次新的完整套件。
- **INC-035**：D36 修复后继续审计发现采集端没有自动寻找 build-code 完整收据，且命令哈希和 review 非门禁语义仍不完整；已按 D37 增加同快照 `npm test` 自动复用、命令哈希校验和 review warning 化，当前只跑定向回归，未重复完整套件。
- **INC-036**：D37 后继续审计发现两处真实缺口：material-only/tasks-only 编辑仍会因快照/source digest 严格相等而重新执行完整测试；stage-runner 又用全局 missing 把无关的 test/AC/confirmation 事实一起降级。已按 D38 增加当前材料排除于测试合同 digest、材料-only 快照识别、receipt 自动复用和按谓词独立状态；定向回归 `140/140` 通过，未重复完整套件。旧 full receipt 在生产源代码已改变后保持 stale，不伪造为当前完整测试。
- **INC-037**：按 D38 重新执行 verify-code 时发现 stage-runner 把 `result.completion.business_facts` 当作真实字段，实际 canonical completion 是 `{facts,user,system}`；因此开放 review 的 warning 让 `acceptance_criteria` 和 `exceptions` 生成了错误的 `missing` quality fact。已改为读取 `result.completion.facts.business_facts`，新增谓词隔离回归 `92/92`；旧错误 quality fact 只读保留，当前结果需重新发布，未改 provider 配置、未重复审查。
- **INC-038**：按 D40 重新发布 verify 时发现 `reviewDispositionWarnings` 和 `deriveSeriousReviewPause` 直接遍历 `adjudication.clusters`，而 `findingDispositions` 只按 canonical `findings`；因此历史/未采纳分歧被错误要求处置。已统一使用 canonical reportable findings，旧格式仅兼容回退；定向回归 `100/100`，未重跑全量、未重复审查。
- **INC-039**：按 F-b199 复核 evidence map 时发现校验只验证每条 AC 存在 anchor，没有验证不同 AC 是否共享同一 `path + 行范围 + role`；初版补丁还只接在 v2 批量入口，公共 `validateAuthorityMap` 直接调用会漏检，定向测试因此先失败。已把规则接到公共入口，并新增共享 proving anchor 回归；合同测试 `4/4` 通过，未重跑全量、未重复审查。

- **INC-040**：本轮回放确认“任务行 14/14 completed、ID/FR/AC 映射完整、局部测试绿色”仍能掩盖原始业务语义缺口；原因是前置合同只验证结构，不验证场景、oracle、实际结果、独立锚点和覆盖限制。按 D43 增加语义证明要求；历史 aggregate receipt 不再作为逐 AC 完成证明。
- **INC-041**：用户在 build-code/verify-code 中提出修订时，当前只有普通阶段回退语义，没有四材料一致性和临时需求专用审查合同，容易自动回到完整 scope_revision 流程或直接推进。按 D44 设计同 task、四材料、一次专用 review 的轻量路径；不新增 stage/provider/config，review 不作为 pass gate。
- **INC-042**：实现 D43/D44 后首次 scope-revision packet 测试发现专属 contract 没有按 `scope_revision` 选择，错误寻找 `contracts/scope-revision.md` 的路径；已修正 contract selection，并用 scope packet、stage matrix、skill closure 和相关 focused tests 验证。定向集合当前 `78/78` 通过，skill closure `ok`；未重跑全量、未调用 provider。
- **INC-043**：继续反推“为什么 build-spec/build-plan 没有提前暴露遗漏”时发现，原有 build-spec handler 只校验 spec 字节/hash，build-plan 只跑最小可执行检查；两者都可能在 AC 没写可观察场景/oracle、plan/task 只做结构映射时继续推进。已增加 build-spec 的 AC 设计最小检查，并让 build-plan 使用完整 plan-task contract；这只提前暴露缺口，不把 review/test 变成隐藏 gate。当前 spec 的 AC 设计检查和 plan-task contract 均为 `ok`，新增 focused 集合 `200/200`、官方 stage integration `7/7`、skill closure `ok`；未重跑全量、未调用 provider。
- **当前 verify-code raw findings 处置**：`F-aa3485117c18`（AC-018 缺少 `PUBLIC_RESULT_INVALID`/私有路径/四类错误分类锚点）、`F-b19968dd90ac`（AC-002/009 与 AC-012/020 的实现锚点重复）、`F-ca69c836cd48`（AC-003 未绑定 R3 `quality/tests/research.json`、固定 sha256、13 个研究角色和事前事实）、`F-da37494c7eaf`（23 条 AC 的场景/oracle/actual outcome 与共享 implementation/test receipt 过于模板化）均保留原始 `revise_required` 事实，当前 disposition 为 `needs_human`；不重复审查，不把它们改写成通过。后续 build-code 继续按各 finding 的具体证据要求收口；在此之前 verify 质量保持 `unknown/incomplete`。
- **当前回归事实**：第一次新的 `npm test` 在修复生成物前为 `132/135` 文件通过、5 个测试失败；失败均已定位为生成物/hash 快照不同步。生成物修复后 `final19` 曾通过，但随后 D39 修复了 completion-wrapper 并改变了当前源码/测试快照；按 D40 不继续循环跑全量，当前完整测试状态明确为 `unknown/stale`，不能把旧收据当作当前通过证据。
- **INC-044**：把 T019 的语义 evidence/replay 写回 `tasks.md` 后，当前四份材料发生了纯材料快照变化；旧实现要求每条 replay 的 `snapshot_tree` 精确等于新快照，导致任务完成记录反过来使刚生成的语义证据变 stale。按 D43/D44 修复：replay 允许复用同源码快照下仅变更四份材料的证据；一旦变更超出 `specs/<task>/{decision-log,spec,plan,tasks}.md`，仍拒绝并保持 incomplete。该边界只解决证据写回的自引用问题，不放宽源码实现证据。
- **INC-045**：刷新当前 AC 聚合时，第一次生成的 leaf 直接引用了 `quality/tests/`，被 acceptance evidence 合同拒绝；这是证据分层输入错误，不是 provider 或实现失败。失败记录保留；当前合法结构是 leaf 引用 `evidence/` observation 与 `quality/evidence/` implementation，observation/verification 再引用 `quality/tests/`，避免放宽 acceptance schema。
- **INC-046**：本次历史审计确认 `775b57f` 直接删除 `spec-specify`、`spec-clarify`、`spec-plan`、`spec-tasks` 及模板；catalog 仍保留 absorbed 路径，但当前 stage manifest 不再调用它们。结果是高质量字段只剩阶段 SKILL 的概括性文字，未来任务容易退化成“有 spec/plan/tasks 文件就算完成”。本轮按 D45 恢复可搬运内容合同、模板和 stage inline 依赖；不恢复第二 runtime。
- **INC-047**：本次历史审计确认 AgentHub apply 的测试执行器、blueprint、Phase report 和分层风险测试没有等价接入当前 build-code；当前只有 RED/GREEN 和 focused test 文字，且现有 `test-routing-advisor` 未进入 build-code manifest。用户追加要求每个 Phase 和最终收口都按改动类型使用相关测试技能并留痕。本轮按 D46/D47 接入五个测试技能、steps 证据字段和 focused contract tests；不恢复 AgentHub 的 pass/commit/full-suite gate。
- **INC-048**：首次真实生成 scope_revision packet 发现完整四材料约 342 KiB，轻量流程反而会占用大块上下文；按 D48 改为 source hash/size + 受影响摘录，并加 24 KiB/材料与 330 KiB/packet 上限。当前摘录 packet 实测约 74.7 KiB；超限保持 `MATERIAL_INCOMPLETE`，不伪造 provider 结果。
- **INC-049**：按 D47 把五个测试技能接入 build-code 后，用户指出这会让每个 Phase 反复做测试设计，既浪费上下文，也把高智力判断下放给普通执行模型。按 D49 将设计前移到 build-plan，并把每 Task/Phase/final strategy 固化到 tasks.md；build-code 只执行并留痕，撤销 per-Phase route/blueprint/executor 设计循环。
- **INC-050**：本轮修正测试策略后，直接回放当前 plan-task.v3 发现 Phase 8 的 plan/tasks Files 没有逐字一致，T020-T024 的非行为 reason 也不符合合同，容易让“材料看起来完整”继续绕过结构验证。已补齐 Phase 8 的精确文件边界、四份当前材料 owner 和 N/A reason；当前 `validatePlanTaskContract` 返回 `plan-task-v3: ok`。
- **INC-051**：当前 focused verification 发现 T020-T024 的 `evidence_refs` 是控制台标签，不是 TaskKernel 可认证的 canonical receipt；同时 T017-T019 混入不支持的 `kind`。因此直接结构校验会绿，但真实 completion validation 仍是 `incomplete`。已用正常 receipt writer 写入 `quality/tests/build-code-task-strategy-20260805.json`，把 T017-T024 改为受支持的 JSON 引用；TaskKernel 重新认证为 `complete=24`、`pending=[]`、`invalid=[]`。这只是定向测试/闭环证据，不是 full-suite、provider 或人工交接证据。
- **当前真实结论**：之前“任务执行完”的说法只成立于结构完成（任务行、映射、局部测试），不成立于原始需求语义完成；这是本任务一直追查的根因，不应继续复述为已完成。D50 修复后，T001-T024 的完成引用已能被 TaskKernel 认证，但整体仍需 verify-code 逐条回放，并保留 `human_handoff=unknown`、历史 full-suite `fail/stale` 和未调用 provider 的事实，不能 close。
- **当前证据刷新状态**：已在当前源码/材料快照上写入 T017-T024 的 canonical completion receipt，认证结果为 `24/24`；定向合同测试 `41/41`、skill closure、五阶段 dispatch smoke、Constitution checklist 和 `git diff --check` 均通过。verify-code 当前只能把 fresh full-suite、逐条 AC verification、same-build integration review、independent review 和 human handoff 标为 `unknown/missing`；历史 `npm test` 失败/stale、provider 未调用和五份报告业务延期继续保留，这些事实不能被 focused evidence 改写。

## build-spec 阶段大白话交接摘要

- **做了什么**：把已确认的 D1-D19 变成 FR-001~FR-020 和 AC-001~AC-023；补齐用户流程、范围/非目标、数据和状态边界、成功/失败边界、风险、延期，以及 R1-R18 和五份报告的回放关系。
- **本阶段修复**：真实增量审查发现的单行 delta、direct impacts 缺失、陈旧事故枚举、版本头和确认状态均已处理；WorkflowHub 修复已提交并合并 `main`。
- **审查结果**：最后一轮只审查变化内容及直接影响；三个 provider 都真实完成，aggregate=`pass`，无 adjudicated finding。此前的 `revise_required` 和历史 minor 仍保留为事实，没有被抹掉。
- **没有做什么**：没有新增业务需求，没有改共享 provider 配置，也没有把质量结果变成交付 Gate；build-plan 已按本摘要完成交接，build-code 只消费已确认材料。
- **延期和风险**：具体任务拆分、证据绑定细节和业务项目实现留给 build-plan/后续项目；provider 未来仍可能失败，必须继续保留真实 unavailable/timeout。
- **下一阶段不能猜什么**：build-plan 只能按本日志的 R/F/D 关系和本 spec 的 FR/AC 排任务，不能补页面、数据、验收或新的控制面。
- **用户看过状态**：`accepted`；用户回复“确认，进入build-plan吧”，随后确认按 build-code 标准流程执行；build-plan handoff 已完成。

## 最终确认

当前推荐方向：采用 D1-D19；D1-D16 是已确认产品/流程方向，D17-D19 是本轮基于 U14 和代码事实形成的修复决策；当前材料只做决策索引，不复制 spec；后续 stage 只能展开已有 `R* / F*-* → D*` 关系。主要风险是下游不遵守关系链、用户未看交接摘要、旧确认 stale、provider 仍可能返回无法公开的输出，以及 review finding 处置证据还未完成机器化绑定；增量范围已通过三轮真实 incremental provider smoke 验证。

历史用户正式确认：`accepted`。原始回答：`确认，继续吧`。TaskKernel canonical confirmation：`quality/confirmations/b2689b333a7def3ca8f699026c7640d28a6c6372533515140c29bd443dbb3d87.json`；sha256 `b2689b333a7def3ca8f699026c7640d28a6c6372533515140c29bd443dbb3d87`；material revision `revision-5c35208cab42144c512787fd9efae720a3fd9d2621d59f80435d318ecd9d4171`；snapshot tree `0804d1c7de01e6f9b6b2beb770616144d0f8ea3b`。该确认覆盖 D1-D14。

本轮确认：`accepted`。原始回答：`好的，可以继续了`。覆盖 D15-D16；这是用户对已修复公开审查协议和逐条 finding 处置闭环的真实确认。D18-D19 是后续 U14 新增要求对应的当前决策，已在本轮大白话摘要后由用户回复 `确认，继续` 接受，并已完成 make-decision→build-spec handoff。此前遗留的 spec/plan/tasks 不能绕过本轮 build-spec 重审。后续 `build-spec`、`build-plan` 仍须完成各自的大白话摘要交接。

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
- v2 审查 map 缺失时会在 provider 调用前保持 `MATERIAL_INCOMPLETE`；必须补齐公开契约要求的 map，不能把“未调用 provider”写成 provider 不可用或审查完成。
- finding 处置已按 D24 落为当前 stage invocation 的结构化事实；仍需在最终 verify 中为本轮真实 review finding 逐条提供当前证据或诚实风险状态，不能把测试绿替代处置。
- `revise_required` 仍会让质量字段保持 `incomplete`；若下游只看该字段而忽略 `status/progression`，仍可能错误地把质量事实当推进 gate。阶段末大白话摘要必须同时解释两者。
- 增量审查依赖上一份 pass 结果的分类 manifest；manifest 缺失、材料删除或无法安全比较时必须走完整审查并保留 fallback 原因，不能为了省上下文静默漏审。

## 未决项

- 用户是否正式接受 D1-D14、补回的阶段链/边界/证据锚点、跨项目最低结构和人工交接/质量边界：`accepted`，见历史 TaskKernel confirmation。
- 用户是否正式接受 D15-D16：`accepted`，见本轮真实用户回复 `好的，可以继续了`。
- 后续 build-spec 如何把每个 `R*/F*` 展开成 FR/AC：build-spec 负责，但不得新增需求。
- stale confirmation/quality projection 的机器化诊断：隔离 runtime 任务。
- review aggregation、snapshot freeze、results publication、close preflight：隔离 review/runtime 任务。
- review finding disposition 的最小结构化证据绑定：本次只落流程和质量提示；在 D15-D16 确认后由 build-spec/build-plan 设计，不新增 public command 或平行 completion 状态机。
- v2 authority map 的业务内容如何由每个 stage 从当前材料生成：D17 已锁定“必须提供且公开说明”，具体 map 条目和证据锚点由当前 build-spec/build-plan 细化，不新增需求 ledger。
- D18/D19 的真实 provider packet 增量 smoke：已由 build-spec attempt `7dc814e1-28d2-4479-91b5-5f6fb6609f2a` 完成并记录真实 `revise_required`；packet 可读性/direct impacts 修复已合并，后续 build-plan 沿用相同规则，不把该结果改写成 pass。release/hash 已随 `45547fa` 同步；不改共享 provider 配置。
- 五份报告各自业务实现和人工读者/浏览器验收：对应 PaperBuilder/KnowledgeDigest 任务。

## Supersedes

- 本版 V12（当前精简候选）supersedes V4（V1 的 1,182 行详细候选压缩版）；原因是 V12 统一了 D18-D20、增量审查、阶段交接和当前 build-code 状态。
- V12 保留 V4 的精简索引结构，同时追加 D17-D20；不把修复代码细节复制成 spec，不把历史 confirm 扩大解释为当前范围确认。
- V0（约 302 行初始摘要）和 V1 都只作为只读审计对照；canonical ref/hash 未提供，不能把其中“已确认”状态带入 V3。
- `decision-correction-appendix.v1`：原始 canonical decision ref/hash 未提供，不能伪造；本版以 `supersedes` 和 D1-D14 的明确关系记录修正，`does_not_rewrite_upstream=true`。

## 当前修订决策（V21）

### D51：恢复版本和当前扩展必须分别记录

- **关系**：R20、D45、INC-046 → D51。
- **来源/事实**：历史审计确认 `775b57f` 删除了 `spec-specify`、`spec-clarify`、`spec-plan`、`spec-tasks` 及模板；删除前最后可读高水位文件来自 `5af7349554cdfbb0bfa5c502484d12c69e620188`，完整组合恢复点为 `c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf`。当前恢复文件还缺 WorkflowHub 专属的阶段进度/执行路径/来源映射/测试策略扩展。
- **当前可核对边界**：当前 clone 能直接核对 `c3e1b1c5...` 的七个文件和当前新增 diff，但 `5af7349...` 的 parent tree 当前不可读；因此只能宣称“有 provenance 的等价恢复 + 当前扩展”，不能宣称与删除前对象逐字节相同。
- **选择**：保留历史高质量正文，再以附加章节增加当前扩展；同步 bundle/catalog hash；不恢复旧 runtime、gate 或第二套材料。
- **理由**：能同时恢复被删除的工程约束和当前宪法边界，避免“精简版”重新丢字段。
- **后果/风险**：模板更长，输入成本上升；通过只保存 ID、refs 和事实索引，避免与 spec/decision-log 重复。
- **延期交接**：真实每个 Task 的策略和当前 receipt 仍由 build-plan/build-code/verify-code 逐项完成，不能用模板存在冒充。

### D52：固定 decision-log → spec → plan → tasks 的单向映射

- **关系**：R1、R2、R11、R20、R23、D1、D4、D45、D49 → D52。
- **来源/事实**：审计发现下游可以保留 FR/AC/Task ID，却漏掉 R20-R23、D45-D50 或把 T023/T024 的局部映射误当全量闭合；五份报告业务语义也必须保留为 deferred/non-goal，而不能被摘要吞掉。
- **选择**：decision-log 保存原始需求/事实/选择/理由/延期；spec 保存 source binding、场景、FR/AC；plan 保存 Phase/依赖/边界/验证；tasks 保存 Task/命令/oracle/路径/证据。每级仅保存 `source_refs/decision_refs`，不复制正文；scope_revision 只改受影响关系。
- **理由**：既能还原事实，又避免 decision-log 与 spec 高度重复；下游不能凭空补需求。
- **后果/风险**：任何漏映射都必须暴露为 unknown/incomplete；旧材料只读，不能自动继承当前 handoff。
- **延期交接**：当前 spec/plan/tasks 的全量逐项 replay 由 T027 继续，五份报告具体业务实现交给后续项目。

### D53：把阶段进度和执行文件路径写入 plan/tasks

- **关系**：R13、R20、R23、D13、D45、D49、D50 → D53。
- **来源/事实**：当前 plan/tasks 只有 Phase/Task 完成行，缺少明确的前三阶段进度、build-code/verify-code 进度和执行路径索引；“任务完成”无法说明是否真的执行了哪个文件、哪个命令。
- **选择**：plan 增加 make-decision/build-spec/build-plan 三行 `WorkflowHub Stage Progress`；tasks 增加 build-code/verify-code 两行；每张卡用 `精确文件` 作为唯一边界，`execution_file_paths` 只能派生为精确子集。runtime 读取声明进度，但 quality/review/handoff 独立保留。
- **理由**：让进度可读、路径可追踪，同时不新增 progress ledger/permit，也不把 review pass 变成 gate。
- **后果/风险**：手写进度仍可能过时；因此只把它当当前材料事实，并用 focused contract 检查缺行、glob 和质量/进度混写。
- **延期交接**：T026 的 focused 验证完成后，verify-code 仍需以真实任务证据复核，不信任单独的进度行。

### D54：结构/局部实现与全部需求语义验收分离

- **关系**：R2、R5、R11、R16、R20、R23、D43、D50 → D54。
- **来源/事实**：独立审计确认：任务行、映射、局部测试和历史 receipt 只能证明结构/局部实现；当前引用的 `quality/tests/*`、`quality/evidence/verification/*` 在本任务目录缺失，R3 research receipt、逐项 AC 当前锚点、fresh review resolution 和 human handoff 不能独立复核；T023 也明确本轮 scope_revision provider 未调用。
- **选择**：统一使用两句话：`结构和局部实现已完成` 表示材料/合同/部分代码路径存在；`全部需求语义验收通过` 只有在每个 R/F/INC/D/FR/AC 有当前 scenario、oracle、actual outcome、coverage limits、独立锚点、review/finding/handoff 后才能说。缺失证据保持 `unknown/incomplete/deferred/unavailable`。
- **理由**：直接修复“verify-code 最后才发现遗漏”的根因，不让绿色结构测试制造假完成。
- **后果/风险**：当前任务不能立即 close；这是事实，不是 gate。普通修复可以继续，formal accepted 必须等待完整事实。
- **延期交接**：T027 逐项回放；五份报告业务需求仍交给 PaperBuilder/KnowledgeDigest 等后续任务。

### D55：当前任务的证据缺口不得由日志声明填补

- **关系**：R3、R7、R8、R15、R16、D17、D18、D19、D51-D54 → D55。
- **来源/事实**：当前工作树没有 `quality/` 下日志引用的 canonical research/build/test/replay receipt；本轮尝试新增多代理分工时受到线程上限限制，已有独立审计结果和 Git 历史可用，但不能冒充本轮完整 `>10` 子代理 receipt；共享 provider 本轮按范围未调用。
- **选择**：把缺失记录成 `unknown/incomplete`，只执行 focused contract 修复和验证；不生成伪 receipt、不把未调用 provider 写成 unavailable/pass、不改共享配置。
- **理由**：符合 Constitution 的真实失败和非 gate 边界。
- **后果/风险**：当前需求的“全部原始/新增需求已实现且审查通过”仍不能成立。
- **延期交接**：verify-code 需要在有真实当前 evidence 和用户看过摘要后再形成最终结论；不执行 close/authorize。

### D56：高质量任务合同必须回填当前任务的历史卡

- **关系**：R20、R23、D51-D55 → D56。
- **来源/事实**：恢复后的 `spec-tasks` skill/template 要求每张 Task 记录 `source_refs/decision_refs`、`Workflow stage`、精确 `execution_file_paths`、测试策略和真实完成事实；当前卡片审计显示 T001-T024 仍是旧格式，只有 T025-T027 已补当前字段，不能把模板闭环误当当前任务闭环。
- **选择**：增加同一任务内的 T028，逐张回填 T001-T024 的来源/决策关系、阶段、精确执行路径、测试策略和覆盖限制；保留既有历史命令、review、失败和完成事实，不新建第二份卡片或第二套进度账本。
- **理由**：否则后续 build-code 仍会遇到“模板要求很完整、当前 tasks 却无法直接执行”的同一遗漏根因。
- **后果/风险**：回填成本增加，旧卡中无法独立核实的证据仍必须保持 `unknown/incomplete`，不能为方便而补造 receipt、snapshot 或 provider verdict。
- **延期交接**：T028 只收口任务卡可执行性；T027 仍负责全部 R/F/INC/D/FR/AC 的当前语义回放，五份报告的业务需求仍延期给对应业务项目。

## 当前独立审查事实与处置（V22）

### D57：本轮材料必须经过一次真实独立审查，但 verdict 不是完成条件

- **关系**：R20、R23、D51-D56 → D57；INC-057。
- **来源/事实**：对当前 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md` 和四个 spec 内容 skill/template 做了一次真实 `wh-review make-decision/detail` material-only 审查；没有修改 wh-review/3rd-review 配置。审查 attempt 为 `65786668-a553-4001-8073-1626b2abb523`，result 为 `quality/reviews/results/make-decision-detail-1ee0edc4e90d4395a00f1689c928f1d3efd91896-65786668-a553-4001-8073-1626b2abb523.json`，report 为 `quality/reviews/reports/65786668-a553-4001-8073-1626b2abb523.md`；eligible reviewers 为 3/1，provider 未超时或 unavailable，aggregate 为 `semantic/pass`。其中 9 条 finding 被分类为 `invalid_anchor`、1 条为 `minor`，原始 finding 仍保留，不能把 aggregate pass 改写成当前任务通过。
- **选择**：只审查一次；按 finding 逐条修复或保留 `needs_human`，不为了得到 pass 循环全文审查；修复后只跑受影响 focused contract。
- **理由**：符合“异源意见一次即可”和“质量事实不是推进 gate”；当前 review packet 的 maps 是 `unknown`，且是 material-only，不证明当前业务实现、canonical replay 或用户 handoff。
- **后果/风险**：审查已提供异源意见，但 D51-D56 仍不能在没有用户交接和逐项证据时升级为 locked/formal accepted。
- **延期交接**：下一步完成 `needs_human` 的主代理 Talk/Grill/Clarify 和真实用户 handoff，再由 verify-code 生成当前 R/F/INC/D/FR/AC replay；不重复本次未变化的 provider 审查。

### 本轮 finding 逐条处置

| Finding | 状态 | 原始问题 | 当前处置 / 证据 | 后续 owner |
|---|---|---|---|---|
| F-19ba8fdf46b7 | fixed | FR-006 仍只允许 D1-D19 | FR-006 改为“已确认决策才可展开”；D50-D56 标 provisional/incomplete | build-spec；保留原 finding |
| F-1aaf1c3a6557 | fixed | 旧 replay 范围仍停在 R1-R19/INC-015 | 当前 FR-008/FR-012/AC-014/plan 改为 R1-R23、INC-001~056 | verify-code；历史旧卡不改写 |
| F-1c881c91827a | fixed | Phase 文件边界用了 verification 目录 | plan/tasks 改为精确 JSON 输出路径 | build-plan；focused contract |
| F-2d71531803e6 | needs_human | 当前 scope revision 缺逐问题 Talk/Grill/Clarify | 不补造用户回答；D51-D56 保持 provisional，主代理补直接沟通记录 | 主代理；用户 handoff |
| F-43e928f9f93a | needs_human | D51-D56 未完成当前确认却被当作闭合范围 | FR-026-FR-029、AC-029-AC-031 明确标 provisional/incomplete | 主代理；确认后再锁定 |
| F-45f713ea830c | fixed | plan 阶段行与 T025-T028 实际状态冲突 | build-plan 改 `in_progress`；T028 回填已记录，T027 仍 blocked-by-design | build-plan/verify-code |
| F-8b360359f4c4 | needs_human | Talk 选项正文和 Grill 逐问记录不完整 | 保留 unknown；未来 scope-changing decision 必须由主代理直接补齐 | 主代理；不由子代理代答 |
| F-a6563f9a59bb | needs_human | D21-D56 的用户 accepted 状态不足 | spec §9 明确 D50-D56 provisional；不能宣称 formal accepted | 主代理；用户 handoff |
| F-ebc0b2061efb | fixed | FR-008 漏 R20-R23 | FR-008 已扩为 R1-R23，并列出 R20-R23 回放责任 | verify-code；T027 |
| F-fcf4ba904d4b | fixed | provider packet 暴露本机绝对路径 | `review-materials.mjs` 只在 provider-derived view 做 `<host-path-redacted>`；canonical source 不改；新增 contract test | wh-review material boundary |

### 当前执行审计事实

- **INC-052**：本轮需要的精确多代理分工在环境线程上限下未能新建；已使用先前独立审计结果、当前任务目录证据和 Git 历史完成交叉研究。此事实不计作 R3 的新 receipt，R3 仍为 `unknown/incomplete`。
- **INC-053**：当前任务目录缺少日志引用的 `quality/tests/research.json`、`quality/tests/build-code-task-strategy-current-20260805.json`、`quality/evidence/verification/requirements-completeness-replay-current.json` 等文件；Markdown 引用不能单独证明内容存在或 hash 正确。
- **INC-054**：当前新增的 spec/plan/tasks 内容合同扩展已写入 skill/template 和当前材料；bundle/catalog hash 同步与 focused contract 仍需执行，不能先写成 closure pass。
- **INC-055**：当前 T001-T024 并非每张卡都有完整任务级 test strategy；T025-T027 已加入本轮修复范围，其中 T027 仍 blocked-by-design，直到当前语义 replay evidence 可读。
- **INC-056**：T001-T024 还缺当前模板要求的 `source_refs/decision_refs`、`Workflow stage`、`execution_file_paths`、策略 owner/coverage limits 等字段；T028 负责回填，不能用 T025-T027 的三张新卡代表全量闭合。
- **INC-057**：本轮真实 material-only 独立审查的 attempt/result/report、provider 覆盖、aggregate verdict 和 10 条原始 finding 已记录在 D57；审查未超时或 unavailable，但因 packet maps 为 unknown，finding 逐条保留 `invalid_anchor`/`minor` 分类，不能把 provider `pass` 当作当前语义验收。
- **INC-058**：聚焦回归发现历史 Task evidence 缺失时 `certifyCurrentTaskCompletion` 仍会抛 ENOENT，且只有 `bytes` 没有预计算 hash 时会误报 hash mismatch；已改为仅把 ENOENT 记为 `historical evidence unavailable`，并从 bytes 计算 hash，非 ENOENT 仍 fail-loud；`tests/stage-plan-task-contract-v3.test.mjs` 21/21 通过。
- **INC-059**：plan-task.v3 校验发现 Phase 8 和 File Boundary 使用目录/通配边界、T025-T028 缺 `versioned_refs`，导致精确任务路径无法闭合；已把 Phase 8/global boundary 展开为精确文件并补当前 spec/plan hash，plan-task 与 executable minimum 均通过。
- **INC-060**：继续执行 T027 时，当前工作树可以捕获可复现的 execution snapshot（`snapshot_tree=9dc7e78d0172712afa85ad90cfef064d8e149294`、`source_digest=ed35c8d1fcb71f0f63e4182d2cc02ee89d837e16fe2ad1247552ed835d0faac8`），并枚举出 R1-R23、14 个报告需求点、INC-001..INC-059、D1-D57；但当前工作树没有可读取的 TaskKernel `quality/evidence` canonical replay receipt。因此这次只记录回放输入和 snapshot，逐项语义状态仍必须是 `unknown/incomplete/deferred/unavailable`，不能把材料枚举、聚焦合同或历史收据写成 replay pass。
- **当前继续执行事实**：第一次绑定当前候选快照的完整 `npm test` 收据 `quality/tests/verify-code-final-full2-20260805.json` 真实以 `exit_code=1` 结束，失败为 5 个测试：架构 inventory/complexity 生成物不同步 3 个、恢复 `spec-clarify` 后的旧技能契约 1 个、build-code 缺少明确 `focused test command` 文本契约 1 个。已按受影响范围修复生成物和契约，focused 回归 `repository-inventory + simple-contracts + workflow-v2-contract` 为 `32/32` 通过；这条历史失败仍保留，不能被 focused 结果覆盖为完整回归通过。
- **当前继续执行事实**：canonical test capture 曾被同任务的 malformed 历史 `quality/tests/research.json` 阻断；修复为“指定收据自身损坏仍 fail-loud，其他历史坏收据只保留质量事实、不阻断新的当前捕获”后，当前 acceptance matrix 和完整套件均能完成捕获。原始 malformed bytes/hash 仍保留为质量事实，未篡改 research receipt。
- **当前继续执行事实**：已为 T001-T029 各写入独立的当前 `quality/evidence/task-completion/verify-code/` canonical completion record，并把 tasks.md 的 29 个 `evidence_refs` 改为当前 record/hash；这只证明 TaskKernel 可读取任务完成事实，不等于原始需求语义验收、provider review 通过或用户 handoff。
- **当前继续执行事实**：canonical verification writer 原先只接受数组形式的 `coverage_limits`，而 verify-code 语义回放要求可直接判定的文本字段，造成合法回放在写入后被降级为 `unknown`。现允许兼容的非空文本或文本数组；新回放使用文本，旧数组事实保持可读，不改变 review/pass 的非门禁语义。

## 当前 close 运行时修复（V23）

### D58：close 只消费最新当前事实，质量 verdict 不作为交付 gate

- **关系**：R14、D14、D54、D57、INC-060 → D58。
- **来源/事实**：close preflight 曾因同一 subject 的多条不可变 quality fact 直接判定 `ambiguous`；同时把 review/test 的 `status != passed` 当成 close 阻断。两者都与“事实追加保留、质量不是推进许可证、用户确认才是交付决定”冲突。
- **选择**：同一 `subject/material/snapshot` 按 `recorded_at` 和 ref tie-break 取最新事实，历史记录继续保留；close 只校验三类当前事实存在且绑定同一快照，不校验 verdict 必须为 `passed`。`failed/revise_required/unavailable` 仍原样进入 close 证据。
- **理由**：消除重复确认导致的假阻断，也避免 review 为异源意见被误改造成“必须通过才能推进”；同时保留快照一致性，防止真实过期事实被消费。
- **后果/风险**：用户确认可以接受带质量风险的交付，风险必须在 close 结果和证据中可见；缺少事实或快照不一致仍然失败。
- **延期交接**：未来 close/verify 实现和测试必须复用此规则；本次完整 verify 快照需要在本轮代码修复后刷新，不能沿用旧快照冒充当前。

### INC-061：close preflight 修复已完成，正式 close 仍待当前快照和目标仓库前置条件

- 已修复 `core/task-close.mjs` 的重复事实选择和非 `passed` verdict 阻断，并补齐 worktree 已移除分支的同一规则。
- 聚焦回归：`vnext-delivery-close`、`manual-delivery-close`、`confirmation-authorization` 共 `13/13` 通过。
- 当前尝试 prepare 的真实结果：旧 verify facts 与修复后的工作树快照不一致，必须先刷新当前 verify 事实；不得把旧 receipt 改写为当前事实。

### INC-062：本轮全量测试保留失败事实，修复后只跑受影响回归

- `npm test` 本轮真实结果为 `140` 个测试文件、`1242` 个测试，`1239` 通过、`3` 失败；失败全部是架构 inventory/complexity 生成物不同步，不是业务运行时失败。
- 已同步生成物；随后只运行受影响的 `repository-inventory` 合同测试，结果 `9/9` 通过。全量失败收据继续保留，不能改写成全量通过。
- 该事实支持 D58：测试结果是可见质量事实，不是阻断交付的许可证；close 仍要求当前事实和同一快照，但不要求 verdict 为 `passed`。

## 文档结果

- `CONTEXT.md`：no-change；无新领域术语。
- ADR：not-needed；当前是可逆的材料职责和运行时边界修复。
- 本文保留需求原子、决策点、来源、理由、取舍、决策级阶段链、成功/失败边界和交接；不保留实现级页面/字段/测试设计。

## Exit checks

- R1-R23、五份报告需求点、INC-001~056 和 D1-D56 已进入当前材料映射；但当前逐项 semantic replay、canonical receipt、fresh review resolution、T001-T024 任务卡回填和 human handoff 仍缺失，结论为 `incomplete/unknown`，不能写成 replay pass 或整体 close。
- F15/F4F7/KnowledgeDigest/F8/M0.8 需求点均已映射：pass。
- Talk、Grill、调研、审查事实均已记录；原始 Talk payload、R3 当前 research receipt、部分 provider/review 和本轮 handoff 仍标为 unknown/unavailable/incomplete，并保留已有路径/hash：不升级为 pass。
- 决策级阶段链、成功边界、失败边界和跨项目最低结构已记录：pass。
- 本次 make-decision 未新建未来材料；已有 spec/plan/tasks 已被当前 scope revision 更新，但阶段进度和语义质量分开记录，不能自动作为本轮 handoff：事实已记录，handoff 仍 pending。
- 历史用户正式确认 D1-D14：accepted；本轮用户确认 D15-D16、D18-D20：accepted。D21-D56 属于当前同任务修复/审计决策，其中 D51-D56 的当前证据和新 handoff 尚未闭合；完整 `npm test` 未重跑、provider 未调用、verify-code 阶段摘要尚未得到用户确认，故仍停在 close 之前。
