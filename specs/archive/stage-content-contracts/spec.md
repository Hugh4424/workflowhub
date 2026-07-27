# 功能规格：Stage 内容契约

**功能名**: `stage-content-contracts`
**来源**: 已接受的 make-decision 决策记录；处理组 4（问题 17、29、13、20、3）
**状态**: 候选草稿；spec-clarify 的 2 个重大歧义已关闭；审查成本与自举选择有真实宿主可见回复，但旧 runtime 无法补出 typed interaction proof，用户已明确接受这一历史证据风险

## 速读卡（30 秒看懂这个需求）

- **一句话需求**：让 WorkflowHub 只有在真实问答、文档拷问、重大歧义、决策记录、计划任务和交接内容都具备可验证证据时，才把对应阶段发布为完成。
- **核心改动点**：接回现有步骤清单、执行日志和 audit 计算器；增加阶段专用内容证据；永久规范逐题问答；补齐决策记录、计划任务和双视图交接；重大审查问题默认暂停并允许用户明确承担风险继续。
- **最大影响面**：make-decision、build-spec、build-plan 的正式发布入口，以及五阶段共用的用户总结和审查处置。
- **验收信号**：61 条 FR、53 条 AC 全部通过；缺失、乱序、重复、篡改、错误绑定、假问答、未清重大歧义、空壳 decision-log、空壳 plan/tasks、双视图漂移、审查多头和超额调用等反例明确失败；当前 task 的一次自举例外只先修 review-flow authority，随后恢复标准阶段；原 task 产生新 revision/attempt，并实际重放处理组 1；旧记录不被改写。

## 1. 问题陈述

当前 WorkflowHub 已在 Skill、`skill-deps.yaml` 和 `steps.json` 中声明三轮对话、完整文档拷问、歧义关闭、决策记录、计划任务和完成卡要求，也已有步骤 audit 计算能力。但正式 Stage 发布只读取少量内容 receipt 和 review；audit 结果没有进入官方发布链路，官方 writer 又不支持所需的阶段专用内容证据。

因此，“文档说必须做”和“系统证明已经做”是两条断开的链。代理可以跳过真实交互、写一段自报摘要或交付空壳文档，runtime 仍发布没有缺项的 attempt。处理组 4 的五个问题是同一根因的不同表现；本需求修复共同权威链路，不做单点文案补丁。

## 2. 背景、目标和边界

### 背景

- 现有 `audit-aggregator` 能基于 manifest 和 journal 发现缺步骤、重复、乱序、依赖未完成、旧证据和 hash 不一致。
- 现有 make-decision handler 只消费 decision、direction review、detail review；build-spec/build-plan handler 只检查文档非空、hash、artifact 一致和 review。
- 现有 canonical writer 只允许 decision/spec/plan/tasks 等既有类型，未知内容证据会被拒绝。
- 用户已锁定：完整处理组 4 一起完成；复用现有 audit authority；不改写旧记录；长期执行真实问答和大白话卡片；最终 decision-log 保留每题的决定含义；用户总结和系统交接分开但同源；正式聚合中 `actionable + major|blocking` 的问题在全部五阶段默认暂停，用户可明确承担任何类别风险后继续。
- 上游 accepted decision-log 的 D1–D7 不允许原地改写；本规格以字面量 correction appendix 修正其中已知的不完整表述，保留原文、正确解释、原因和影响。

### 目标

1. 以现有 `steps.json + journal + audit-aggregator` 为唯一过程完成权威，把经认证的阶段专用内容证据接入正式发布。
2. 证明 ask → wait → real reply → queue re-rank 的真实顺序，而不是匹配 Skill 文案或自报“已完成”。
3. 让 spec 重大歧义逐项有结论，让 decision-log、plan、tasks、用户总结和系统交接具备最低内容契约。
4. 把永久问答规范落实到所有未来的 `talk-with-zhipeng` 和方向性 `grill-with-docs` 使用中。
5. 为每个内容契约提供正常、缺失、乱序、重复、篡改、错绑和旧数据兼容测试。
6. make-decision 最终确认前自动逐条核对原始需求、真实回答、grill/review 选择与 decision-log；遗漏必须展示，用户可修复或明确承担具体遗漏风险，不能静默继续。
7. 全部契约通过后，在原 task 上创建新 revision/attempt，并实际重放此前被阻塞的处理组 1；只生成 replay 计划不算完成。
8. 由 TaskKernel 统一持有五阶段审查链和当前指针，普通文档修正用可验证的差异处置，只有重大结构变化才允许一次新的完整审查，避免重复花费。

### 非目标（明确不做）

1. 不引入 Multica、Issue 评论作者认证、token proof 或密码学真人证明。
2. 不创建第二套 Stage 完成状态机、第二个 audit verdict 或每个 handler 各自维护的平行规则。
3. 不回填、改写或伪造旧 task、旧 attempt、旧 accepted record；不为旧格式保留永久绕过。
4. 不处理处理组 5 的跨阶段唤醒、处理组 6 的 build-code Phase 门禁，也不改 provider 选择、prompt 或路由价格；本任务只修正与处理组 4 直接冲突的审查链权威和调用次数。
5. 不把主观文本质量变成关键词打分器；机器只判断结构、身份、顺序、绑定和已声明的检查结果。
6. 不把用户可读总结塞入 provider/token/hash/receipt/attempt 等内部流水账。

### 假设

- **已确认决定 1**：以现有 wh-review 聚合中 `disposition=actionable` 且 `severity=major|blocking` 作为“证据充分的严重问题”的唯一机器入口。来源：spec-clarify Q1，用户选择 A。证据不足或未形成可执行结论的问题只记录提醒，不触发暂停。
- **已确认决定 2**：默认暂停和明确风险承担适用于 make-decision、build-spec、build-plan、build-code、verify-code 全部五阶段的正式 review。来源：spec-clarify Q2，用户选择 A。
- **已确认要求 3**：旧记录不改写；完成处理组 4 后必须在原 task 上创建新 revision/attempt，并实际重放处理组 1。只写恢复命令或 replay 计划不算交付完成。
- **规格推导 4**：hash 绑定实际持久化的最小 canonical 结构；先删除秘密和无关内容，再 hash 与写入。该顺序是 D9/D11“不可保存秘密”与“内容不可替换”同时成立的唯一结果，不新增用户选择。
- **宿主可见选择 5（证据边界已说明）**：用户在本轮宿主会话中选择 A：审查链和当前指针由 TaskKernel 持有；非 build-code 的普通修改不再次调用 provider，重大结构变化最多补一次完整审查；build-code 每次修复后仍完整审查到 pass。调用方给出的 `previous_result_ref` 只做并发冲突或旧接口兼容检查。该回复真实发生，但旧 runtime 当时没有 typed interaction proof；本规格不得把文档自报冒充可验证 canonical 交互记录。
- **宿主可见选择 6（证据边界已说明）**：用户在本轮宿主会话中选择 B：当前 `stage-content-contracts` task 先修 review-flow authority，而未选择推荐项 A“另建小前置任务并保持阶段顺序”。该自举已在稳定 external runner 中完成、投入当前流程并失效；CandidateWorkspace 已恢复为仅含三个设计产物。真实回复同样缺旧 runtime 的 typed proof，不得事后伪造或回填。
- **本轮风险处置 7**：针对正式审查指出的历史交互 proof 缺口，用户选择 A：修正 spec、临时 draft、`CONTEXT.md` 和 ADR，不再次调用 reviewer，并仅接受“上述真实宿主回复无法补成 typed proof”的历史风险。推荐理由：旧事实不能安全补造，继续重审也不能生成过去不存在的 typed record。直接后果：本次以文档明确证据边界和风险处置收口，不把该缺口宣称为已验证。主要风险：后续读者只能看到宿主会话事实和本次选择，不能用 canonical typed record 独立重放旧交互。大白话：承认旧系统当时没留下合格凭证，不能补假凭证；把限制写清楚后继续。

### 当前 external runner 基线与实现范围

- **现有并复用（reuse-existing）**：稳定 external runner 已具备并已在当前流程实际使用 TaskKernel 单一 review flow/root/head、`previous_result_ref` CAS、结构性完整审查预算、latest event、provider attempt/resolution 事件、精确 result/attempt/resolution receipt 消费、legacy root adoption、canonical result authentication、flow lock，以及 build-code 完整重审规则。31 个 runtime 路径的 `bootstrap-runtime.patch`、`bootstrap-runtime-files.tar`、`runtime-files.txt` 与 `runtime.sha256` 已备份。build-plan 只能安排在 build-code 首个 Phase 将这 31 个路径原样回放到 CandidateWorkspace 并逐文件 hash 验证，随后复用和补齐缺口，不得重建第二套实现。
- **当前 CandidateWorkspace**：只含 `CONTEXT.md`、`docs/adr/0009-stage-content-authority.md` 和 `specs/stage-content-contracts/spec.md` 三个设计产物，不含 runtime bootstrap 代码。
- **需要补齐（extend）**：合法新 revision 的隔离 lineage、完整可复算 cost fact 和五阶段缺失的矩阵覆盖；只能在现有 TaskKernel/wh-review 权威上补齐。
- **本处理组新增（new）**：interaction completion、ambiguity ledger、decision coverage/omission、plan/tasks 内容契约、双视图交接、严重 finding 暂停与风险接受，以及对应官方 Stage 发布消费。
- **范围约束**：以上分类只缩小重复建设，不增加任何原需求之外的实现项。

### 本次正式审查 finding 处置

| Finding | 等级 | 处置 | 结果 |
| --- | --- | --- | --- |
| F-0070041452a5 | major | fixed | 标明复用与补齐 |
| F-8b5a89b3d962 | major | accepted_risk | 接受旧 proof 缺口 |
| F-6e1f8ce83733 | minor | rejected_invalid | 完整材料未截断 |
| F-b775127e107c | minor | fixed | 禁止复制宿主路径 |
| F-b7782691744b | minor | fixed | AC 只写可观察结果 |

- `F-0070041452a5`：FR-REV 与 AC46–AC53 已改成“复用稳定 external runner；首个 build-code Phase 原样回放并 hash 验证；只补齐缺口”，不再把自举完成的 authority 当作待新建能力，也不再误称 CandidateWorkspace 已含 runtime 代码。
- `F-8b5a89b3d962`：真实宿主可见回复已发生，但旧 runtime 没有 typed interaction proof。用户本轮选择 A，不伪造历史、不复审，并明确接受仅此历史证据风险；该接受不适用于未来交互。
- `F-6e1f8ce83733`：提交材料使用 canonical decision receipt 的完整当前 bytes，packet 无截断规则，且该 finding 的锚点无效，因此拒绝其“材料被截断”结论。
- `F-b775127e107c`：新增上游宿主绝对路径只可作为历史证据、不得复制到新产物的规则。
- `F-b7782691744b`：AC35 只要求从唯一 schema 的 `required` 集合证明字段覆盖；fixture 生成方法留给 build-plan。

## 3. 用户场景与用例

### 场景一：完整 make-decision 正常发布

- **角色**：WorkflowHub 调用宿主和任务负责人。
- **前置条件**：三轮对话、方向审查、完整文档拷问、decision-log、详细审查和最终确认均已真实完成。
- **操作步骤**：宿主逐次提交经认证的过程事件和内容证据；runtime 汇总 audit 并运行 make-decision 正式发布。
- **预期结果**：唯一 audit verdict 为 pass；正式 attempt 引用 audit、最终 decision-log 和所需内容证据；下游通过 accepted make-decision 的 `decision_ref` 读取完整当前版本。

### 场景二：代理跳过问答但自称完成

- **角色**：WorkflowHub 调用宿主。
- **前置条件**：decision-log 写有“已完成三轮对话”，但缺真实 ask/wait/reply/re-rank 记录，或文档拷问只有代码检查没有应有的用户决定。
- **操作步骤**：尝试发布 make-decision。
- **预期结果**：发布前明确失败；不产生可接受的成功 attempt；错误指出缺少或不完整的具体步骤/内容证据。

### 场景三：逐项关闭 spec 重大歧义

- **角色**：规格负责人。
- **前置条件**：当前 spec 有两个可独立改变范围、验收、接口、数据、安全或运维的歧义。
- **操作步骤**：一次只展示一个选项卡，等待真实回答后重新分类剩余问题。
- **预期结果**：每项重大歧义最终是用户决定、由锁定决定唯一推导的规格事实，或明确 blocker；仍有 blocker 时 build-spec 不得发布完成。

### 场景四：问题总数真实变化

- **角色**：用户。
- **前置条件**：本轮开始时预计 4 个问题；第 1 个回答使一个问题不再适用并新增一个真正的新问题。
- **操作步骤**：系统重排队列并展示第 2 张卡。
- **预期结果**：总数按“已问 + 当前仍开放”重算；变化附具体原因；分母不得机械等于分子，也不得无理由变化。

### 场景五：严重审查问题与风险承担

- **角色**：用户。
- **前置条件**：正式审查存在有效锚点的严重 actionable finding。
- **操作步骤**：系统暂停，展示问题、证据、可能后果和影响范围；用户选择修复或明确接受风险。
- **预期结果**：修复后由 TaskKernel 按所属阶段规则更新同一 review flow：非 build-code 普通修改写 delta/resolution，重大结构变化在预算内补一次 full review，build-code 完整重审到 pass；继续则写入 append-only 风险记录并绑定同一 finding、review 和当前快照；笼统“用户同意”不能放行。

### 场景六：旧记录继续使用

- **角色**：维护者。
- **前置条件**：旧 accepted 记录没有新内容证据。
- **操作步骤**：读取历史或继续旧工作。
- **预期结果**：历史读取保持可用且明确标为 legacy；继续工作必须创建新真实执行并链接旧记录；系统不得自动补齐或把旧记录改成新格式。

### 场景七：最终确认前发现遗漏

- **角色**：用户。
- **前置条件**：最终 decision-log 漏掉一条真实回答，逐条覆盖审计已定位该遗漏。
- **操作步骤**：系统在最终确认卡前展示遗漏内容、来源、影响、后果和风险；用户选择补齐，或明确承担这一条遗漏风险继续。
- **预期结果**：未处置的遗漏不能静默进入最终确认；风险接受只绑定该遗漏，不把覆盖审计伪装成“无遗漏”。

### 场景八：完成卡与系统交接同源

- **角色**：用户和下游 Stage。
- **前置条件**：Stage 已形成一份受控完成事实。
- **操作步骤**：系统从同一事实生成短用户总结和详细系统交接。
- **预期结果**：用户看到目标、效果、验证边界、风险、下一步和是否需行动；下游拿到完整技术事实；两份内容的共同字段一致，任何漂移都失败。

### 场景九：修订内容但不重复花审查费用

- **角色**：五阶段执行者和 TaskKernel。
- **前置条件**：当前阶段已有正式审查结果，随后出现普通文字修正、重大结构变化、审查服务不可用或 build-code 修复。
- **操作步骤**：执行者提交新内容与变更分类；TaskKernel 从当前审查链决定写差异处置、重试原审查、追加一次完整审查或让 build-code 继续完整审查。
- **预期结果**：调用方不能靠省略旧结果引用创建新链；普通修正不调用 provider；重大结构变化最多一次；build-code 修复后每次完整审查直至 pass；多头或跨 revision 错绑立即失败。

## 4. 功能需求

### 域：唯一过程权威与正式发布

- **FR-AUD-001**：`steps.json` 继续定义期望步骤，journal 记录实际执行，`audit-aggregator` 继续是唯一能产出过程 pass/fail 的组件；不得新增平行完成 verdict。来源：D2。
  - **场景**：Given 同一执行的 manifest 和 journal，When 计算完成状态，Then 只有 audit summary 产出过程 verdict。
- **FR-AUD-002**：官方 Stage 发布必须读取经 TaskHandle/TaskKernel 认证的 audit summary ref/hash/verdict，并验证 task、stage、run、manifest、journal 和内容证据属于同一执行。来源：D2、D7。
  - **场景**：Given audit 属于另一个 run 或 task，When 发布，Then fail-loud。
- **FR-AUD-003**：make-decision 发布必须要求三轮 talk、research 执行或明确跳过、direction review、grill、decision-log、detail review、最终用户确认和 publish 步骤全部按 manifest 顺序完成。来源：D1、D4、D8。
  - **场景**：Given 少一轮、乱序、重复或把一轮结果冒充另一轮，When 发布，Then 拒绝。
- **FR-AUD-004**：build-spec 发布必须要求 ambiguity ledger、spec 内容契约和 TaskKernel 认证的 review flow 覆盖最终 spec；build-plan 发布必须要求 plan/tasks 内容契约、用户计划确认和该 flow 覆盖最终快照。初始正式 review 绑定其快照；后续普通修改由同链的 delta/resolution 绑定新旧 hash，重大结构变化由同链唯一允许的追加 full review 绑定最终快照。来源：D1、问题 17、20、用户本轮审查成本决定。
  - **场景**：Given 文档改变但既无有效 delta/resolution 也无允许的结构性 full review，或内容证据绑定旧版本，When 发布，Then 拒绝。
- **FR-AUD-005**：缺失、重复、乱序、未成功、篡改 hash、错误 task/stage/run/ref/tree 绑定均为结构完整性错误，必须在成功 attempt 发布前失败；不得降级为 warning 或 `missing_items=[]`。来源：D7。
  - **场景**：Given 任一结构错误，When 执行 official run，Then 非零退出且无成功 attempt。
- **FR-AUD-006**：每个 Stage 的正式 attempt 必须包含 audit carrier 和该 Stage 所需内容证据的 canonical ref/hash；下游只能从 accepted result 的稳定字段读取当前版本，不搜索 revision 或宿主路径。来源：D2、D3、问题 13。
  - **场景**：Given 多个历史 revision，When 下游读取，Then 只得到 accepted result 指向的最终版本。
- **FR-AUD-007**：make-decision 的 interaction aggregate 必须强制引用宿主为已投递到用户可见会话表面的消息返回的 ref/hash；该证明只覆盖宿主确认投递，不证明消息作者是真人、用户实际阅读或客户端实际渲染。三个有序 talk round 各自保存队列、逐题处理、每答重排和结束结论；grill 保存 `CONTEXT.md` changed/no-change、ADR created/not-needed、术语/ADR 冲突处置、实际文件引用及四项 exit checks，并整体绑定 CandidateWorkspace tree 与最终 decision ref/hash。来源：问题 29、新增覆盖审计要求。
  - **场景**：Given interaction 内部记录完整但没有 host-visible ref，或 grill 少一项结果，When 发布，Then 拒绝。
- **FR-AUD-008**：detail review 的冻结材料必须包含完整 interaction aggregate 和完整最终 decision-log，不得只给压缩摘要、调用方结论或截断版本；review result 必须绑定两者 hash 与 CandidateWorkspace tree。来源：问题 29。
  - **场景**：Given detail review 只拿到方向摘要，When 尝试作为正式 detail review，Then 材料契约失败。
- **FR-AUD-009**：最终确认卡生成前必须自动逐条覆盖审计原始需求、所有真实用户回答、采用的 grill/review 选择和承重决定；每项必须映射到 decision-log 正文，或映射到专用 `decision-omission-acceptance.v1` appendix。任何未展示、未处置遗漏都阻止最终确认。来源：用户新增要求。
  - **场景**：Given 一条真实回答无 decision-log 映射，When 生成最终确认，Then 先展示遗漏并等待补齐或明确遗漏接受。
- **FR-AUD-010**：`task_id`、`stage`、`workflow_run_id`、producer、canonical ref/hash、snapshot/tree 等身份与绑定字段只能由 TaskKernel 或 canonical writer 注入；talk/grill/spec/plan 等组件不得设置这些字段，不得接收 root、task path、cwd 或仓库发现能力。来源：宪法 F1/F2/S8、独立宪法审计。
  - **场景**：Given 组件 payload 自带 task_id 或 root，When 写 typed evidence，Then writer 拒绝调用方身份字段并使用受控上下文注入。

### 域：真实逐题交互与永久提问规范

- **FR-INT-001**：所有未来 `talk-with-zhipeng` 的三轮调用必须分别建立完整候选队列，标明待回答、已由事实回答、不适用和影响等级；三轮不得合并。来源：D4。
  - **场景**：Given 某轮没有待答问题，When 结束，Then 仍记录空队列事实、理由和结束结论，而不是省略该轮。
- **FR-INT-002**：每张用户问题卡只能处理一个决策轴，提供 2–3 个互斥选项，标出一个推荐项及理由，并为每项给出大白话含义、直接后果和主要风险；不得开放式填空。来源：D4。
  - **场景**：Given 缺推荐理由或某选项缺风险，When 交付卡片，Then 卡片格式检查失败且不得记录为已提问。
- **FR-INT-003**：面向用户的卡片不得显示内部 ID、hash、receipt、attempt、runner 或记录术语；内部结构化记录仍保留精确技术字段。来源：D4。
  - **场景**：Given 结构化证据需要 run ID，When 生成卡片，Then ID 只存在内部记录，不出现在用户文字中。
- **FR-INT-004**：每次提问必须形成 ask 事件并立即暂停；只有收到与该卡绑定的真实用户 reply 后才能继续，随后必须形成 re-rank 事件。代理生成、默认值、旧答案或 decision-log 自报均不能替代 reply。来源：D4、D8。
  - **场景**：Given ask 后没有 reply，When 尝试下一题或发布，Then 拒绝。
- **FR-INT-005**：每轮问题分母必须等于“本轮已经提出的问题数 + 当前重排后仍会改变方向的开放问题数”；总数只有在真实回答新增或消除问题时才能变化，并记录变化原因。来源：D10。
  - **场景**：Given 队列从 4 变 3，When 展示下一卡，Then 记录被移除问题及事实原因；`2/2` 式机械跟随在队列仍有问题时失败。
- **FR-INT-006**：长期交互证据不得保存完整问题卡原文；必须保存卡片内容 hash、格式检查结果、选中项、ask/reply/re-rank 顺序、队列状态变化和绑定信息。来源：D11。
  - **场景**：Given canonical interaction record，When 检查内容，Then 找不到完整卡片原文但可验证结构检查和事件顺序。
- **FR-INT-007**：每个 interaction 选择必须在 accepted decision 集合中可读：优先写入 decision-log 正文；用户明确接受遗漏时，写入 bound omission appendix。正文或 appendix 都必须保存问题、最终选择、推荐状态及理由、后果、风险和大白话说明，并与 interaction evidence 的选中项/hash 一致。来源：D11、覆盖审计更正。
  - **场景**：Given interaction 选择 B，decision-log 和 appendix 都没有或写 A，When 发布 make-decision，Then 拒绝。
- **FR-INT-008**：`grill-with-docs` 发现会改变目标、范围、方案、风险或长期规则的轴时，必须复用单轴 ask/wait/reply/re-rank 规则；纯事实核实或机械文档修正可不问，但必须记录不提问理由和四项 exit check。来源：D8。
  - **场景**：Given grill 作出新长期规则但无真实 reply，When 完成 grill，Then 拒绝。
- **FR-INT-009**：host-visible ref 只证明消息确实投递到宿主可见表面，不证明评论作者或真人身份；ref/hash 必须与 ask、reply、round、题号和 card hash 一一绑定，缺失、重复、跨轮或跨 run 复用全部失败。来源：问题 29 信任边界。
  - **场景**：Given 一条 reply ref 同时绑定两题，When 聚合 interaction，Then 拒绝。

### 域：重大歧义关闭

- **FR-AMB-001**：build-spec 每次都必须建立 ambiguity ledger，把相关陈述分为锁定上游决定、上游明确未决项和新歧义，并标出可能改变的范围、验收、接口、数据、安全、运维维度。来源：D1、问题 17。
  - **场景**：Given 当前 draft，When 扫描，Then 每个候选歧义都有分类和影响维度。
- **FR-AMB-002**：能独立变化的行为必须拆成独立歧义轴；每次只处理一个，真实回答后重分类剩余轴。来源：问题 17、既有 spec-clarify 契约。
  - **场景**：Given output 格式与 fallback 策略可独立选择，When clarify，Then 不能合成一张“完整方案”卡。
- **FR-AMB-003**：每个重大歧义只能结束为：真实用户决定、由锁定决定唯一推导的 spec-local fact，或 unresolved blocker；非重大项可跳过，但必须记录其不影响六个维度的事实理由。来源：问题 17。
  - **场景**：Given 重大歧义无回答，When 完成 build-spec，Then blocker 阻止发布。
- **FR-AMB-004**：最终 spec 和 ambiguity ledger 必须绑定同一 content hash；review 或澄清后 spec 改变时必须重新生成 ledger/content evidence，并由 TaskKernel 按变更分类更新同一 review flow。普通修改写 delta/resolution 而不再次调用 provider；重大结构变化最多追加一次完整审查。来源：D7、问题 17、用户本轮审查成本决定。
  - **场景**：Given review 后 spec 改变，When 既复用旧 ledger，又没有同链 delta/resolution 或允许的结构性 full review，Then 拒绝。

### 域：完整且唯一的 decision-log

- **FR-DEC-001**：accepted decision 是“decision-log 正文 + 绑定的 omission appendix”的完整集合。正文应包含原始需求、目标、范围、非目标、每个承重决定、三轮 talk 结论、调研及跳过理由、完整 grill 结果、两次审查 finding 处置、用户最终确认、拒绝方案、风险、未决项、supersedes、文档结果和 exit checks；任何正文遗漏只有在覆盖审计发现、用户看过影响并写入专用 appendix 后才可接受。来源：D1、D8、问题 13、覆盖审计更正。
  - **场景**：Given 缺任一适用章节且无 bound omission appendix，When 写 receipt，Then 内容契约失败。
- **FR-DEC-002**：每个承重决定无论位于正文还是 omission appendix，都必须包含具体来源/真实回答摘录、事实与约束、推理链、选择理由、影响、后果和风险、拒绝方案、未决项及 supersedes；不得只写“已确认”或只记“用户接受遗漏”。来源：decision-log 锁定格式、D11。
  - **场景**：Given appendix 只写 omission accepted 而无决定含义，When 发布，Then 拒绝。
- **FR-DEC-003**：canonical decision receipt 必须指向最终完整内容并携带内容 hash；accepted make-decision 必须暴露唯一 `decision_ref`/hash，下游不得读取旧摘要或自行搜索 task 目录。来源：D2、问题 13。
  - **场景**：Given 完整 revision 和旧短摘要并存，When accepted，Then `decision_ref` 只指完整最终版本。
- **FR-DEC-004**：逻辑 task 名/外部工作项和 canonical task 身份之间必须有受控可读映射；用户视图与系统交接必须使用同一个 human-readable artifact label，并同时给出“从 accepted result 的稳定字段读取”的规则；不得暴露真实文件根或要求按 Issue 编号猜路径。上游材料中的宿主绝对路径只可作为历史证据存在性引用，任何新 decision-log、spec、plan、fixture 或交接不得复制该路径。来源：问题 13、host-independent 约束。
  - **场景**：Given 外部编号存在，When 用户查看或下游接手，Then 两处看到同一 artifact label；下游按 accepted lookup 读取，不做目录扫描。
- **FR-DEC-005**：accepted decision-log 的 D1–D7 不得原地修改；必须发布 append-only correction appendix，逐项保存原 decision ref/hash、以下字面量更正、原因、影响范围和 `does_not_rewrite_upstream=true`。来源：用户新增要求、D3。
  - **字面量更正 D1**：原“全部通过后才恢复/允许 replay”读作“全部通过后必须在原 task 产生新 revision/attempt 并实际重放处理组 1；仅允许或计划 replay 不算完成”。
  - **字面量更正 D2**：原“连接 authenticated Stage-specific content records”补足为“官方发布必须消费 audit carrier 与 typed content refs；writer/handler 不产生第二 verdict”。
  - **字面量更正 D3**：原“new truthful continuation”读作“原 task 上 append-only 新 revision/attempt，旧 bytes/hash 不变，不另建替代 task”。
  - **字面量更正 D4**：原“real delivery 可证明”补足为“每题强绑 host-visible ask/reply refs、card hash、round、题号、re-rank 和每轮结束结论”。
  - **字面量更正 D5**：原“two synchronized views”补足为“同一 completion facts、同一 human-readable artifact label、同一 accepted lookup rule；formal review record 与大白话 brief 分离”。
  - **字面量更正 D6**：原“serious/evidence-backed”固定为“全部五阶段 formal review 中 `actionable + major|blocking`”；build-spec/build-code 的暂停是异常处置点，不新增正常确认。
  - **字面量更正 D7**：原“结构错误不可继续”保持；decision coverage omission 只有被机器发现、展示并进入专用 omission appendix 后才从未处置错误变成 accepted exception，review risk record 不得代替。
  - **场景**：Given D1–D7 原文仍在，When 下游读取，Then 同时读取上述 correction appendix；原 bytes/hash 不变。

### 域：可执行 plan 和 tasks 内容契约

- **FR-PLN-001**：plan 必须包含技术上下文、全局约束、模块/接口/数据契约、实施顺序、测试策略、回滚/恢复、FR→AC→Step 映射、21 条宪法检查和复杂度取舍。来源：问题 20、既有 spec-plan 模板。
  - **场景**：Given 缺需求映射或恢复策略，When 发布 build-plan，Then 内容契约失败。
- **FR-PLN-002**：每个实施 Phase 必须包含 Goal、Files、Tasks、Verify、Knowledge、STOP 六段；`None` 必须附适用理由，不能用空标题冒充完成。来源：问题 20。
  - **场景**：Given Phase 缺 Knowledge 或 STOP，When 验证，Then 失败并指出 Phase。
- **FR-PLN-003**：每个 task 必须包含稳定 task ID、动作、精确文件、输入、输出、依赖 task IDs、FR IDs、可执行验证命令和成功/失败 oracle；改变行为的任务必须说明先看到失败再看到成功的顺序。来源：问题 20。
  - **场景**：Given task 只写“更新校验并测试”，When 验证，Then 因文件、命令、oracle 缺失失败。
- **FR-PLN-004**：所有 accepted FR 必须至少映射到一个 task 和一个 AC；所有 task 必须反向引用有效 FR；依赖必须存在、无环、先于消费者或明确允许并行。来源：问题 20。
  - **场景**：Given 任一 FR 无 task，When 发布，Then 拒绝。
- **FR-PLN-005**：build-plan 正式 review 必须收到完整 plan、tasks、spec 和内容契约结果；任何结构缺口不得被 provider pass 覆盖。主观工程质量由独立 review 给出，结构缺失由确定性契约失败。来源：D7、问题 20。
  - **场景**：Given reviewer pass 但 task 缺 Verify，When 发布，Then 仍拒绝。
- **FR-PLN-006**：build-plan 必须执行独立 engineering lens。实现优先复用现有 wh-review 所有的 `plan-eng-review` lens 和 `wh_review_engineering_lens` 声明，不得再建独立 review runner 或第二个 verdict；正式 review 必须证明该 lens 已按 manifest 加载。来源：问题 20、现有 build-plan/wh-review 事实。
  - **场景**：Given 正式 build-plan review 未加载 engineering lens，When 发布，Then review 材料契约失败。

### 域：用户总结与系统交接

- **FR-HOF-001**：每个 Stage 从一份 canonical completion facts 生成两个同步视图：短用户总结和详细系统交接；共同字段包括结果、产物、人类可读验证结论、未决风险、下一负责人/阶段和用户动作。来源：D5、问题 3。
  - **场景**：Given 两视图结果或风险不同，When 发布 handoff，Then 一致性验证失败。
- **FR-HOF-002**：用户总结只保留整体目标、做法、效果、验证边界、风险、下一步和是否需用户动作，使用高中生可懂的大白话；不得混入 provider/token/hash/receipt/attempt/runner 或内部编号流水账。来源：D4、D5、问题 3。
  - **场景**：Given 用户总结包含 receipt/hash，When 交付，Then presentation check 失败。
- **FR-HOF-003**：系统交接必须保留正式 artifact/ref/hash、审查状态、缺项、依赖、恢复条件和下游读取规则；用户总结不得代替系统交接，系统交接也不得直接倾倒给用户。用户视图和系统交接对同一产物必须使用同一个 human-readable artifact label。来源：D5、问题 3、问题 13。
  - **场景**：Given 只有短总结或两视图产物名称不同，When Stage 完成，Then 拒绝。
- **FR-HOF-004**：formal review record 必须保留实际 provider、runtime 实际提供的 duration/token、每个 finding 的 disposition、证据状态和最终处置；duration 或 token 任一未提供时，面向用户的大白话 review brief 必须写“未提供”且不得估算。brief 只说审查对象、实际 provider、verdict、重要 finding/处置、指标是否提供和下一步，不复制内部 ref/hash。来源：问题 3。
  - **场景**：Given runtime 未提供 duration、token 或两者，When 生成 brief，Then 对每个缺失指标写“未提供”而非估算；formal record 仍保留 runtime 实际字段。

### 域：审查链权威与调用成本

- **FR-REV-001（reuse-existing）**：稳定 external runner 的 TaskKernel 已是全部五阶段 review flow、root、head 和调用预算的唯一写入权威，并已有 flow identity、flow lock 和 canonical event，且已用于当前流程。build-code 首个 Phase 必须从备份原样回放对应 runtime 路径到 CandidateWorkspace 并逐文件 hash 验证；随后只验证绑定并补缺，不得重建平行 authority。来源：用户宿主可见选择、稳定 external runner。
  - **场景**：Given 已有 flow，When caller 省略 `previous_result_ref`，Then TaskKernel 解析当前 head，不能另开 root。
- **FR-REV-002（reuse-existing）**：当前 public CLI 与 TaskKernel 已把 `previous_result_ref` 限定为 compare-and-swap 或旧接口兼容断言；后续只验证五阶段覆盖并补缺。提供时必须等于当前 head，不提供时不改变续链语义。错 ref、过期 ref、跨 stage/track/revision ref 全部 fail-loud。
  - **场景**：Given 两个执行者同时基于旧 head 更新，When 第二个提交，Then CAS 冲突且不产生分叉。
- **FR-REV-003（reuse-existing）**：稳定 external runner 已有并已使用 append-only resolution、latest-event 消费和零 provider 的普通修改路径；原样回放并 hash 验证后，只补齐 make-decision、build-spec、build-plan、verify-code 的覆盖。记录继续绑定 prior head、旧/新 snapshot/material/hash、逐项 finding 处置、验证证据和 `structural_change=false`，由 TaskKernel 原子推进最新 action 而不伪造新 verdict。
  - **场景**：Given pass+minor 后只修措辞或补证据，When 提交 verified delta，Then provider 调用数保持 1 且最终内容可发布。
- **FR-REV-004（reuse-existing）**：稳定 external runner 的 controller 和 TaskKernel 已实现并已使用冻结材料分类与每条非 build-code flow 一次结构性完整审查预算；原样回放并 hash 验证后，只验证十类维度和补缺。方向、AC、接口、schema、状态、安全、并发、拓扑、Phase 顺序或测试策略变化才可消耗预算。
  - **场景**：Given 同一 flow 已用过结构性 full review，When 再次请求 provider，Then 在派发前失败且写明预算已用尽。
- **FR-REV-005（reuse-existing）**：复用现有 build-code 强规则：每次修复后都基于完整当前材料执行 full review，直到 semantic pass；后续只验证现有回归，不另建循环或预算。delta/resolution 和一次结构性预算不得替代任何修复后的 provider 调用。
  - **场景**：Given build-code review 要求修改，When 代码修复，Then 必须再次完整审查；未 pass 不得结束。
- **FR-REV-006（reuse-existing）**：稳定 external runner 的 flow 已把 unavailable、timeout、adapter failure 或 invalid reviewer output 记录为 provider attempt，不推进 semantic head、不消耗结构性预算；原样回放并 hash 验证后，只验证五阶段覆盖并补缺。
  - **场景**：Given provider transport unavailable，When caller 重试，Then 不得新建 root，也不得把 unavailable 当 pass 或 finding。
- **FR-REV-007（reuse-existing + extend）**：复用当前单 root/head、断链检测、canonical authentication、legacy adoption 和精确 receipt 消费；仅补齐合法新 revision 的隔离 flow 与上一 accepted revision lineage。多 root、多 head、head 回退、按时间猜选或跨 revision 串线继续 fail-loud。
  - **场景**：Given revision A 与 B 都有结果，When B 更新，Then 只能更新 B 的 head；把 A 的 ref 当 B 的 previous ref 必须失败。
- **FR-REV-008（extend）**：在当前 flow event 的真实 provider 计数、预算和 refs 上补齐统一可复算 cost fact：决策类型、是否调用 provider、实际调用次数、预算前后值、原因、flow/root/head/revision、输入输出 refs。不得新建第二计数器；五阶段控制器和指标只读该事实，不估算 token/duration。
  - **场景**：Given 普通修改，When 完成 resolution，Then cost fact 明确 `provider_calls=0`；任何隐藏调用或计数漂移失败。
- **FR-REV-009（reuse-existing / bootstrap completed）**：稳定 external runner 已完成并已使用一次性自举范围内的 TaskKernel review flow/root/head/CAS/预算/latest-event/精确 receipt/legacy adoption/canonical authentication 与必要测试，自举现已失效；31 路径 patch/tar/manifest 已备份。当前 CandidateWorkspace 仅含三个设计产物。后续只允许首个 build-code Phase 原样回放、逐文件 hash 验证和补缺，不能再写第二次 exception、重建 authority或修改 TaskHandle 历史。
  - **场景**：Given external runner 已有该 authority且备份完整，When 进入首个 build-code Phase，Then 原样回放到 CandidateWorkspace并逐文件 hash 相等；再次申请 bootstrap 或重建平行 authority 立即失败。

### 域：严重审查问题与明确风险承担

- **FR-RSK-001**：全部五阶段的正式审查中，`disposition=actionable` 且 `severity=major|blocking` 的 finding 必须默认暂停推进；invalid evidence、invalid anchor、unavailable、timeout 或 adapter failure 不得算作可执行严重 finding。来源：D6、spec-clarify Q1/Q2 均选择 A、既有 review 证据规则。
  - **场景**：Given major finding 的 anchor 无效，When 聚合，Then 不触发风险承担流程，也不得称为通过。
- **FR-RSK-002**：暂停卡必须用大白话展示具体问题、可验证证据、可能后果、影响范围，以及“修复”和“明确承担风险继续”等互斥选项；用户未回复前不得继续。来源：D6、D9。
  - **场景**：Given 只展示“存在严重问题”，When 请求继续，Then 因信息不足不能接受风险。
- **FR-RSK-003**：用户明确继续时，系统必须写 append-only risk acceptance，包含 finding/ref/hash、证据、影响范围、可能后果、用户精确选择、回答绑定、适用 Stage/task/snapshot 和时间；不得保存秘密或无关对话，不得用通用“用户同意”替代。来源：D9。
  - **场景**：Given 风险记录缺后果或只写 agreed，When 继续，Then 拒绝。
- **FR-RSK-004**：review `risk-acceptance.v1` 只放行绑定的具体 serious finding 和快照，不改变 review/audit verdict、不伪造 pass、不承载 decision coverage omission，也不放行缺步骤、无 host-visible ref、hash/tree 错绑等结构错误。新 finding、结构性 full review 或内容变化超出既有风险范围时必须重新处置；普通修改可由同链 delta/resolution 证明未扩大风险。decision omission 仅走 `decision-omission-acceptance.v1`。来源：D6、D7、D9、覆盖审计更正。
  - **场景**：Given 接受快照 A 的 finding，When 快照 B 或 decision omission 复用该记录，Then 拒绝。

### 域：宪法、可搬运性与运行观测

- **FR-GOV-001**：CONSTITUTION 必须升至 `1.3.0`，逐条修订 F3、F4、F7、Q1、Q2；revision 来源写明本任务 accepted decision、spec-clarify Q1=A/Q2=A 和两份独立宪法审计。旧→新映射为 F3→F3、F4→F4、F7→F7、Q1→Q1、Q2→Q2；其余 16 条不变；`constitution-checklist.md` 同步且总数仍为 21。来源：宪法治理规则。
  - **场景**：Given 只改正文未改版本/修订来源/映射/checklist，When 宪法检查，Then 失败。
- **FR-GOV-002**：F3 新语义必须区分三类事实：身份/顺序/hash 等结构事实不满足时阻止成功发布；一般质量事实只记录；已确认阈值的严重 review finding 进入可由用户覆盖的暂停。F4/Q1 同步写明严重 finding 的窄例外，不把所有质量意见变成 gate。来源：Q1=A。
  - **场景**：Given minor finding，When 发布，Then 只记录；Given actionable major，Then 暂停。
- **FR-GOV-003**：F7/Q2 必须保持正常业务确认仅 make-decision、build-plan、verify-code；build-spec/build-code 遇严重 finding 时进入异常处置点，用户可修复或明确承担风险，不把两个自动 Stage 改成每次正常确认。来源：Q2=A、现有五阶段确认边界。
  - **场景**：Given build-spec 无 serious finding，When 完成，Then自动推进；有 serious finding 时才暂停。
- **FR-GOV-004**：修改 `talk-with-zhipeng` 或 `grill-with-docs` 前必须核对 Skill `Sources` 与 skill-bundle provenance 中的固定上游版本是否更新，并做一次窄替代方案调查；来源缺失时先记录缺口并只从可验证 provenance 建立来源，不得猜测。记录检查日期、上游 commit/version、候选、采用/拒绝理由；不得借研究扩展处理组 4。来源：S3、S6。
  - **场景**：Given 未记录 upstream/替代检查，When 计划实施 Skill 修改，Then 计划不完整。
- **FR-GOV-005**：所有被修改的自定义 Stage/Skill 必须继续在入口记录 metrics skeleton、退出记录 own result；成功、结构失败、serious pause、用户 override 和 omission acceptance 路径均有回归，metrics 失败保持 warn-only。来源：S4、现有 Stage metrics contract。
  - **场景**：Given serious pause，When 退出，Then 有 own result；collector 失败不掩盖原结果。
- **FR-GOV-006**：必须用中性宿主真实 harness 跑 make-decision、build-spec、build-plan 关键正反例，证明无 Multica、Issue 身份、cwd、repository/root discovery 或 root/task path 注入；纯正则扫描不能替代真实 harness。来源：F2、S8、host-independent 约束。
  - **场景**：Given 临时中性项目和显式 StageContext，When 运行，Then 不依赖 workflowhub cwd 或 Multica 才能完成。
- **FR-GOV-007**：实施前只对三类成熟实践做窄研究：append-only audit event、host-visible interaction binding、human risk/omission acceptance；每类最多形成与本规格直接相关的采用/拒绝结论，不新增 provider、身份系统或通用工作流框架。来源：F8、F10、S6。
  - **场景**：Given 研究建议新建通用身份平台，When 对照 scope，Then 记录拒绝且不纳入 plan。

### 域：兼容、隐私与恢复

- **FR-CMP-001**：旧记录保持逐字不变并可读；无新 audit/content carrier 的旧记录明确标为 legacy/unknown，不被追溯判假，也不能作为新执行的完成证据。来源：D3。
  - **场景**：Given 旧 accepted record，When 只读，Then 可读；When 用于新发布，Then 要求新 continuation。
- **FR-CMP-002**：新 continuation 必须 append-only 地绑定旧 accepted/attempt ref/hash和重新执行原因；禁止自动 backfill、原地 migration 和永久 legacy bypass。来源：D3。
  - **场景**：Given 尝试修改旧 JSON 补字段，When 写入，Then 拒绝。
- **FR-CMP-003**：处理组 4 所有验收通过后，必须在原被阻塞 task 上创建新 revision/attempt，使用新契约实际重放处理组 1，并保留旧失败 attempt/review；重放成功或真实失败证据是本任务交付的一部分，只写 replay 计划不算完成。来源：D1、用户新增要求。
  - **场景**：Given 代码和测试已通过但未实际重放，When 判断任务完成，Then 仍为未完成。

## 5. 模块划分

### Stage 内容证据写入器

- **负责什么**：为 allowlist 中的 Stage/组件写入经 task、stage、run 和内容 hash 绑定的 typed evidence。
- **对外提供什么业务能力**：create-only canonical ref/hash；不产出过程 verdict。
- **需要哪些上游业务能力**：TaskHandle/TaskKernel 写权限、最终内容、宿主提交的真实交互事件。
- **验收边界**：能拒绝未知类型、错误身份、重复冲突、hash/tree 不一致；不判断自然语言质量。

### 现有步骤日志与 audit 计算器

- **负责什么**：把 manifest 的期望步骤、journal 的实际事件和 typed completion evidence 交叉验证。
- **对外提供什么业务能力**：唯一 audit summary/ref/hash/verdict。
- **需要哪些上游业务能力**：steps manifest、requirement ledger、journal、canonical evidence reader。
- **验收边界**：缺失、重复、乱序、未成功、过期、篡改和依赖错误可确定性复现；不承担 review 质量裁决。

### Official Stage 发布器

- **负责什么**：按 Stage 读取 allowlisted receipts、audit carrier、内容证据和最终快照，先验证再发布 attempt。
- **对外提供什么业务能力**：带完整 facts/evidence/missing_items 的 append-only attempt 和 accepted stable lookup。
- **需要哪些上游业务能力**：audit summary、Stage handler、TaskKernel、ArtifactDir/CandidateWorkspace。
- **验收边界**：任何必需证据缺失或错绑时无成功 attempt；不得重算第二个 audit verdict。

### 对话与文档拷问组件

- **负责什么**：生成单轴卡、暂停等待、消费真实回答、重排队列、形成不含完整卡原文的结构化交互事实。
- **对外提供什么业务能力**：talk 三轮、grill、spec-clarify 的事件和完成证据。
- **需要哪些上游业务能力**：锁定决定、代码/文档事实、host-visible ask/wait/resume 回调。
- **验收边界**：不能模拟回答；不能直接写 task 路径；无重大问题时可用事实理由完成。

### 文档内容契约组件

- **负责什么**：验证 ambiguity ledger、decision-log、plan、tasks、completion facts 的最低结构和交叉引用。
- **对外提供什么业务能力**：内容契约检查结果及最终内容 hash。
- **需要哪些上游业务能力**：named artifact 内容和锁定上游决定。
- **验收边界**：可确定性检查结构/映射/非空理由；不替代独立工程质量 review。

### 审查暂停与风险处置组件

- **负责什么**：消费 canonical wh-review finding，触发默认暂停，记录修复或用户明确风险承担。
- **对外提供什么业务能力**：finding disposition 和 append-only risk acceptance。
- **需要哪些上游业务能力**：正式 review result、host-visible user reply、当前 snapshot。
- **验收边界**：只处理有效 serious finding；不更改 review verdict；不放行 audit/结构错误。

### 双视图交接组件

- **负责什么**：从同一 completion facts 生成用户总结和系统交接并检查共同字段一致。
- **对外提供什么业务能力**：plain-language summary 与 formal handoff。
- **需要哪些上游业务能力**：最终 Stage facts、review、missing items、next owner。
- **验收边界**：用户视图无内部流水账；系统视图信息完整；两者不漂移。

## 6. 关键实体

### `stage-content-evidence.v1`（公共封套）

- **定义**：所有 Stage 专用内容证据的窄封套；具体 payload 由受控 kind 决定。
- **字段**：`schema_version`、`kind`、`task_id`、`stage`、`workflow_run_id`、`producer`、`content_hash`、可选 `snapshot_head/tree`、`payload`。
- **关系**：writer 只写；audit 读取并验证；handler 只消费 audit 已核对且 allowlisted 的 ref/hash。

### `interaction-completion.v1`

- **定义**：证明 talk/grill/spec-clarify 实际 ask/wait/reply/re-rank 顺序的最小记录，不保存完整卡片原文。
- **字段**：调用类型、round、队列条目 ID/影响/状态、问题序号和预计总数、总数变化原因、`card_hash`、格式检查布尔项、ask/reply/re-rank 顺序号和时间、host-visible message ref/hash、selected option、每轮处理结果与结束结论、grill 的 CONTEXT/ADR/冲突/文件引用/四项检查、CandidateWorkspace tree、decision ref/hash。
- **关系**：三轮 talk 和 grill 分别产生记录；make-decision interaction aggregate 只聚合 ref/hash和顺序，不复制原文。

### `ambiguity-ledger.v1`

- **定义**：build-spec 的逐项歧义状态表。
- **字段**：稳定 ambiguity ID、分类、六类影响维度、material 标记、状态、source ref/hash、answer/derived fact/blocker、受影响 FR、spec content hash。
- **关系**：spec-clarify 更新；build-spec audit 和 review 消费。

### `decision-coverage-audit.v1`

- **定义**：最终确认前逐条核对需求、真实回答、grill/review 选择和承重决定是否进入 decision-log。
- **字段**：source item ref/hash、decision-log mapping、coverage status、omission reason、用户可见遗漏卡 ref/hash、omission acceptance ref/hash、最终统计。
- **关系**：必须在最终确认卡前生成；未映射且未明确接受的遗漏阻止确认；不重写上游 decision-log。

### `decision-entry.v1`

- **定义**：decision-log 正文和遗漏 appendix 共同使用的唯一决定条目字段标准。
- **字段**：`question`、`selected_option`、`recommendation_status`、`recommendation_reason`、`plain_language_meaning`、`source_exact_excerpt`、`facts_and_constraints`、`logic`、`choice_reason`、`impact`、`consequences`、`risks`、`rejected_alternatives`、`unresolved`、`supersedes`；全部列入 schema 的 `required`。
- **关系**：decision-log 正文和 `decision-omission-acceptance.v1.decision_entry` 都必须引用并符合这一 schema，不得各自维护字段副本。

### `decision-omission-acceptance.v1`

- **定义**：用户看过某条 decision coverage 遗漏后，明确允许它以 appendix 形式进入 accepted decision 集合的专用记录；与 review finding 的 `risk-acceptance.v1` 分离。
- **字段**：writer 注入的 task/stage/run/producer/ref/hash/snapshot；`source_item_ref/hash`、`coverage_audit_ref/hash`、`omission_reason`、用户实际看到的遗漏内容/后果/影响范围及其 card ref/hash、真实 selected option/reply ref/hash、decision-log ref/hash、accepted_at；完整 `decision_entry` 必须引用并符合 `decision-entry.v1`。
- **关系**：同 snapshot/hash 绑定；只处置一条 coverage item；`decision_entry` 同时满足 FR-INT-007 与 FR-DEC-002，不得只保存 omission 元数据。accepted decision lookup 返回 decision-log 正文及全部 bound omission appendix；review risk acceptance 不得填充或替代本 schema。

### `decision-log-contract.v1`

- **定义**：decision-log 正文、遗漏 appendix、逐题选择和来源映射的 accepted decision 集合检查结果。
- **字段**：`main_ref`、`main_hash`、`omission_appendix_refs`（每项含 ref/hash）、`accepted_decision_coverage`、required section checks、question decision mappings、talk/grill/review source refs、unresolved items、supersedes map。
- **关系**：`accepted_decision_coverage` 必须枚举每条原始需求、真实问题/回答、grill/review 选择和承重决定，并证明它在 main 或一个 bound appendix 中恰好覆盖一次；零次是遗漏，两次及以上是重复，均失败。不复制正文全文；与 canonical decision receipt、interaction evidence、coverage audit 和 omission records 交叉验证。

### `plan-task-contract.v1`

- **定义**：plan/tasks 的 Phase 六段、task 必填字段、依赖和 FR/AC traceability 检查结果。
- **字段**：plan/tasks ref/hash、phase rows、task rows、FR coverage、AC coverage、dependency validation、command/oracle checks、errors。
- **关系**：spec-plan/spec-tasks 产出内容，确定性 validator 产出契约结果，build-plan audit 消费。

### `stage-completion-facts.v1`

- **定义**：用户总结与系统交接的共同事实源。
- **字段**：stage result、human-readable artifacts、tests/review conclusions、verification limits、risks、downstream dependencies、next owner、user action、formal refs。
- **关系**：renderer 分别生成 user summary 和 system handoff；一致性检查核对共同字段。

### `review-flow.v1`

- **定义**：TaskKernel 为一个 task/stage/track-or-subject/revision 持有的唯一审查链权威；调用方不能自行创建 root 或选择 head。
- **字段**：flow identity、revision、root ref、canonical head ref、head kind/result status、initial full-review ref、structural full-review budget/used、unavailable attempts、delta/resolution refs、build-code pass state、lineage previous revision ref、CAS version、cost facts。
- **关系**：`previous_result_ref` 只与 canonical head 做 CAS/兼容检查；普通变更追加 `review-delta-resolution.v1`，重大结构变化最多追加一次 full result，build-code 每次修复追加 full result；publisher 只消费 TaskKernel 返回的唯一 head。

### `review-delta-resolution.v1`

- **定义**：非 build-code 普通修改在不调用 provider 时，对新旧内容和既有 finding 处置的 append-only 证明。
- **字段**：flow/root/revision/prior head、before/after snapshot/material/content hashes、分类依据、`structural_change=false`、finding dispositions、验证证据 refs/hashes、resulting head、provider_calls=0。
- **关系**：只能由 TaskKernel 绑定并推进同一 flow；不能伪造新 review verdict，不能用于 build-code 修复或重大结构变化。

### `review-flow-bootstrap-exception.v1`

- **定义**：只供当前 `stage-content-contracts` task 修复 review-flow authority 的一次性、自动失效例外。
- **字段**：task/revision/lineage、selected=B、recommendation=A/not_selected、用户 reply binding、允许的 authority 范围、必要测试、created_at、失效条件、used_at。
- **关系**：TaskKernel 验证 task/revision 和未使用状态；只授权 review flow/root/head/预算/CAS authority。必要测试通过即失效，后续执行恢复标准 stages；不得改写历史或跨 task/revision 复用。

### `risk-acceptance.v1`

- **定义**：用户看过具体严重 review finding 后明确承担风险的 append-only 记录；不得承载 decision coverage omission。
- **字段**：task/stage/run/snapshot、review/finding/evidence ref/hash、问题、影响范围、可能后果、展示卡 hash、用户精确选择、reply binding、accepted_at。
- **关系**：只处置绑定 finding；被 official publisher 验证；不能改变 review verdict 或 audit verdict。

## 7. 数据和生命周期

- **数据粒度**：每个 task 的每次 Stage run；交互记录细到每轮和每张实际问题卡，risk acceptance 细到每个 finding；review flow 细到 stage/track-or-subject/revision。
- **数据时效**：执行时即时 append-only；accepted lookup 指向当前最终版本；历史 attempt/revision 永久保留为任务审计记录。
- **数据归属与生命周期约束（用户可见）**：TaskHandle/TaskKernel 持有 canonical records并由 TaskKernel/writer 注入身份字段；CandidateWorkspace 只持有设计 artifact；组件不得接收 root/task path；宿主只负责可见消息投递和真实回复绑定，不成为 WorkflowHub 身份权威。
- **清理策略**：不清理 canonical 历史；OS 临时 draft 由正常临时目录生命周期回收；禁止把临时路径写入证据或交接。
- **隐私最小化**：interaction record 不保存完整问题卡或无关对话；只保存 hash、格式检查、选项和顺序事实。risk acceptance 只保存决定所必需的信息；检测到秘密时不得静默落盘，应要求用户用不含秘密的明确选项重新确认。
- **完整性顺序**：先完成敏感信息检查和最小化，再对实际被持久化的 canonical 结构计算 hash；不得对一份内容算 hash 后持久化另一份内容。
- **审查链顺序**：TaskKernel 先锁定 flow/head/CAS version，再判定 retry、delta 或 full，写 canonical record 后原子推进 head 和 cost fact；任一步失败都保持旧 head，不留下可消费的半成品分叉。

## 8. 兼容性预留

- **向后兼容**：旧记录只读，不新增字段、不改 hash、不追溯宣布失败。新代码读取无 carrier 的旧 accepted 时返回 `legacy=true/unknown` 和明确继续条件；任何新 Stage publication 必须使用新证据。
- **恢复策略**：旧工作继续时由 TaskKernel 创建隔离的新 revision flow，并通过 append-only lineage 连接，不修改旧记录。`previous_result_ref` 不负责创建新 flow。build-plan 必须给出具体 CLI 和阶段安排；本任务必须实际执行处理组 1 重放并记录真实结果。
- **扩展预留**：公共封套以 allowlisted `kind + schema_version` 扩展；新增 kind 必须有 schema、writer、audit mapping、handler requirement 和正反例，不能靠 handler 接受任意 payload。
- **删除策略**：不保留永久 legacy bypass；迁移期仅保留只读识别和明确错误。何时移除只读 adapter 由后续有真实使用数据的任务决定。

## 9. 不做和隐性必达

### 明确不做

1. 不接入 Multica 身份或评论认证。
2. 不建设平行 completion envelope、平行 audit verdict 或通用 12 步新框架。
3. 不修改旧记录，不伪造过去未发生的 talk/grill。
4. 不把 review transport success、provider 名声、timeout 或 invalid anchor 当作语义 verdict。
5. 不扩到处理组 5–6，也不改处理组 7 的 provider、prompt 或路由策略；只落实本规格明确要求的审查链与调用次数规则。

### 隐性必达

- WorkflowHub 核心保持宿主无关；所有组件只拿窄 capability，不接收 root/task path。
- 结构错误必须 fail-loud；语义 review 与结构 integrity 分开。
- 用户的锁定选择不得在 spec/plan/build 中被重新解释或重问。
- 严重 review 暂停不得在宪法修改前实现：CONSTITUTION 升至 1.3.0，按 FR-GOV-001..003 修订 F3/F4/F7/Q1/Q2，保留 21 条并同步 checklist、revision source、旧新映射；完成独立宪法审查后才可实施 RSK。
- 所有 Stage-owned always/conditional component completion 必须与 `skill-deps.yaml`、artifact 和 review ref 交叉一致。
- 处理组 4 与长期交互规范全部通过后，必须实际重放此前被阻塞的处理组 1；只生成计划不算完成。

## 10. 验收清单及未决问题

### 验收检查（success_criteria）

- [ ] **AC1**：完整 make-decision 正例含三轮 talk、research disposition、direction review、真实 grill、完整 decision-log、detail review、最终用户确认和 publish，official run 成功且 attempt 携带同一 run 的 audit carrier 和内容 refs。反向：任一步骤缺失或错绑仍成功即失败。← FR-AUD-001..006
- [ ] **AC2**：分别注入少一轮、乱序、重复、跨 round 冒充、未成功 exit、无 reply、无 re-rank，official run 全部非零且无成功 attempt。反向：任一反例发布成功即失败。← FR-AUD-003、FR-AUD-005、FR-INT-001、FR-INT-004
- [ ] **AC3**：分别篡改 journal、content evidence、decision/spec/plan/tasks、audit summary 的 bytes/hash/ref/tree/task/stage/run，全部在发布前失败。反向：仅记录 warning 或 `missing_items=[]` 即失败。← FR-AUD-002、FR-AUD-004..006
- [ ] **AC4**：验证 audit-aggregator 是唯一过程 verdict 生产者；writer、handler、content validator 不产生第二个 pass/fail authority。反向：出现平行完成状态机即失败。← FR-AUD-001
- [ ] **AC5**：卡片契约正例包含单轴、2–3 互斥项、推荐及理由、每项含义/后果/风险；逐项删除或合并双轴时格式检查失败且 ask 不成立。← FR-INT-002
- [ ] **AC6**：用户卡片无内部 ID/hash/receipt/attempt/runner；内部 evidence 保留精确绑定。反向：隐藏内部字段导致 evidence 不精确，或用户卡泄漏内部流水账，均失败。← FR-INT-003
- [ ] **AC7**：ask 后同一 invocation 停止；无真实绑定 reply 时不能下一题、改稿或 review；真实 reply 后必须 re-rank。反向：代理默认答案、旧答案或 decision-log 自报可推进即失败。← FR-INT-004
- [ ] **AC8**：用固定 4 题、移除 1 题、新增 1 题三个 fixture 验证分母 = 已问 + 当前开放；每次变化有真实回答触发和原因。反向：分母机械跟分子或无理由变化即失败。← FR-INT-005
- [ ] **AC9**：interaction evidence 不含完整卡片原文，但含 card hash、全部格式检查、selected option、ask/reply/re-rank 顺序和队列变化。反向：只存选择+hash或保存完整原始对话均失败。← FR-INT-006
- [ ] **AC10**：accepted decision 集合中的 decision-log 正文或 bound omission appendix 逐题包含问题、最终项、推荐状态及理由、后果、风险、大白话说明，并与 interaction selected option 一致。两处都缺失或选项不一致即失败。← FR-INT-007
- [ ] **AC11**：grill 的方向性轴必须真实逐题问答；无方向性轴的机械任务可零问题，但需代码/文档事实、不提问理由、CONTEXT/ADR disposition、冲突处置、实际文件引用和四项 exit checks。反向：方向性决定只有代码阅读或自报、任一 grill 字段缺失即失败。← FR-INT-008、FR-AUD-007
- [ ] **AC12**：ambiguity ledger 覆盖所有候选歧义并标分类、影响维度、material、状态和 spec hash；两条独立轴不能合并。反向：只问一题却关闭多条独立轴即失败。← FR-AMB-001、FR-AMB-002
- [ ] **AC13**：重大歧义全部结束为用户决定、唯一推导事实或 blocker；存在 blocker 时 build-spec run 失败；无重大歧义时有可验证跳过理由。← FR-AMB-003
- [ ] **AC14**：clarify/review 后改变 spec 必须产生新 ledger/content evidence；普通修改还必须有同 flow 的 verified delta/resolution 且 provider 调用为 0，重大结构变化必须有预算内唯一 fresh full review。旧 hash、跨 flow 记录或无处置修改均失败。← FR-AMB-004、FR-REV-003、FR-REV-004
- [ ] **AC15**：accepted decision = decision-log 正文 + bound omission appendix；每个承重决定、逐题含义和 grill/review disposition 在该集合中恰好覆盖一次。无 appendix 的遗漏、空壳、短摘要和“已确认/接受遗漏”占位全部失败。← FR-DEC-001、FR-DEC-002
- [ ] **AC16**：accepted make-decision 的唯一 `decision_ref`/hash 指向最终完整版本；存在旧摘要和 revision 时，下游仍只读最终 accepted 指针；用户视图与系统交接使用同一 human-readable artifact label 和 accepted lookup rule。← FR-DEC-003、FR-DEC-004
- [ ] **AC17**：plan 正例包含全部上下文、契约、顺序、测试、恢复、traceability 和 21 条宪法检查；逐项删除时内容契约失败。← FR-PLN-001
- [ ] **AC18**：每个 Phase 都有 Goal/Files/Tasks/Verify/Knowledge/STOP；空标题和无理由 `None` 失败。← FR-PLN-002
- [ ] **AC19**：每个 task 都有 ID、动作、精确文件、输入、输出、依赖、FR、命令、oracle；行为改动有 RED→GREEN 顺序。逐项缺失 fixture 全部失败。← FR-PLN-003
- [ ] **AC20**：FR→task→AC 双向映射完整，task 依赖存在、无环、顺序合法；孤儿 FR/task、重复 ID、无效依赖全部失败。← FR-PLN-004
- [ ] **AC21**：review pass 不能覆盖 plan/tasks 结构失败；初次正式 review 必须独立执行并加载 `plan-eng-review` engineering lens。后续最终内容必须由同一 TaskKernel review flow 的有效 delta/resolution 或预算内结构性 full review 覆盖，不能要求普通改字二审，也不能脱离正式 review 链。← FR-PLN-005、FR-PLN-006、FR-REV-003、FR-REV-004
- [ ] **AC22**：同一 completion facts 生成用户总结和系统交接；共同字段逐项一致。改变任一视图的结果、风险、下一负责人或用户动作后，一致性检查失败。← FR-HOF-001、FR-HOF-003
- [ ] **AC23**：用户总结包含目标、做法、效果、验证边界、风险、下一步、用户动作，且无内部流水账；系统交接保留正式 refs/hash/review/dependency/recovery；两者 artifact label 相同。缺任一适用内容失败。← FR-HOF-002、FR-HOF-003
- [ ] **AC24**：全部五阶段中，`actionable + major|blocking` finding 触发暂停；invalid anchor/evidence、unavailable、timeout、adapter failure 不触发风险放行且不伪装 pass。← FR-RSK-001
- [ ] **AC25**：风险暂停卡展示问题、证据、后果、范围和互斥选项；无真实回复不能继续。← FR-RSK-002
- [ ] **AC26**：risk acceptance 包含所有必填绑定，只放行同一 finding+snapshot；通用“用户同意”、缺字段、篡改、跨快照复用、新 finding 复用全部失败；review verdict 保持原值。← FR-RSK-003、FR-RSK-004
- [ ] **AC27**：review `risk-acceptance.v1` 不能承载 decision omission，也不能放行结构错误；decision omission 只能由独立 `decision-omission-acceptance.v1` 处置。静默遗漏、schema 混用、缺步骤/host-visible ref/hash mismatch 后发布均失败。← FR-RSK-004、FR-AUD-005、FR-AUD-009
- [ ] **AC28**：旧记录 bytes/hash 不变且只读可查；用于新执行时返回 legacy/unknown 和 continuation 条件；自动 backfill、原地改写和 legacy bypass 失败。← FR-CMP-001、FR-CMP-002
- [ ] **AC29**：宿主独立性扫描通过：新增 Skill/core 接口不含 Multica、Issue 评论身份、宿主路径发现或 root/task path 注入。← 全部 FR、非目标 1
- [ ] **AC30**：CONSTITUTION.md、constitution-checklist.md、版本、修订记录和旧→新条目映射同步完成并通过独立宪法审查；否则严重 review pause 不得进入实现。← FR-RSK-001..004、隐性必达
- [ ] **AC31**：新增 writer/schema/audit/handler/Skill/模板测试均为窄测试且正反例通过；现有相关 audit、official receipt、five-stage、interaction-quality、host-independence 回归全绿。← 全部 FR
- [ ] **AC32**：处理组 4 和长期交互规范全部通过后，在原被阻塞 task 上创建新 revision/attempt，保留旧失败记录并实际重放处理组 1；只生成 replay 计划、另建无关 task 或覆盖旧记录均失败。← D1、FR-CMP-003
- [ ] **AC33**：interaction aggregate 的三轮 talk 都有 host-visible ask/reply refs、每轮队列处理与结束结论；grill 有 CONTEXT/ADR/冲突/文件引用/四项检查；aggregate 强绑 tree+decision ref/hash。逐项缺失、重复、跨轮/跨 run 复用全部失败。← FR-AUD-007、FR-INT-009
- [ ] **AC34**：detail review 冻结包同时包含完整 interaction aggregate、完整 decision-log 和对应 hash/tree；压缩摘要、截断 decision-log 或调用方结论不能进入正式 detail review。← FR-AUD-008
- [ ] **AC35**：最终确认前覆盖审计逐条映射原始需求、真实回答、grill/review 选择和承重决定；遗漏一项时先展示遗漏、原因、后果、范围并等待真实选择。选择接受后生成独立 omission appendix，强绑 source item、coverage audit、card/reply、decision-log 和同一 snapshot/hash；其 `decision_entry` 必须引用并完整符合 Section 6 唯一的 `decision-entry.v1` schema。验收覆盖必须直接遍历该 canonical schema 的全部 `required` 字段并证明每项都会被强制；具体 fixture 生成方法由 build-plan 决定。`decision-log-contract.v1` 的 main_ref/hash、appendix refs/hashes 和 accepted_decision_coverage 必须证明每条来源在正文或一个 appendix 中恰好覆盖一次；零次、重复覆盖、错 hash 均失败。coverage status 保持 `accepted_omission`，不得伪造 covered/pass。← FR-AUD-009、FR-INT-007、FR-DEC-001、FR-DEC-002
- [ ] **AC36**：formal review record 保留实际 provider、runtime 实供耗时/token、finding disposition/evidence status/处置；独立 review brief 使用大白话，未提供指标明确写未提供且不估算。← FR-HOF-004
- [ ] **AC37**：D1–D7 原 decision-log bytes/hash 保持不变；correction appendix 逐字包含 FR-DEC-005 的七条更正，accepted lookup 能同时读取；少一条或改写原文均失败。← FR-DEC-005、FR-CMP-001
- [ ] **AC38**：现有 `plan-eng-review` 继续作为 wh-review lens-only 能力执行；未另建 runner/verdict，缺 lens 的正式 build-plan review 失败。← FR-PLN-006、FR-AUD-001
- [ ] **AC39**：TaskKernel/canonical writer 注入所有身份/绑定字段；组件传 task_id/stage/run/root/task path/cwd 时拒绝。代码接口和 fixture 均证明组件只收内容与窄 callback。← FR-AUD-010
- [ ] **AC40**：CONSTITUTION 版本精确为 1.3.0；F3/F4/F7/Q1/Q2 包含 FR-GOV-001..003 语义；revision source 和五条旧→新映射齐全；checklist 同步且仍恰好 21 条；独立宪法 review 通过前无 RSK 实现 diff。← FR-GOV-001..003
- [ ] **AC41**：build-spec/build-code 正常无 serious finding 时不新增确认；`actionable + major|blocking` 时进入异常处置；minor/invalid/unavailable 不触发。← FR-GOV-002、FR-GOV-003
- [ ] **AC42**：修改 talk/grill 前记录 Sources 上游版本/commit、更新检查日期、至少一个替代候选和采用/拒绝理由；研究未扩大处理组 4。← FR-GOV-004、FR-GOV-007
- [ ] **AC43**：每个修改 Stage/Skill 的 entry skeleton 与 success/structural-fail/serious-pause/risk-override/omission-accept own-result 均有回归；metrics collector 故障只告警且原结果不变。← FR-GOV-005
- [ ] **AC44**：中性宿主真实 harness 在非 workflowhub cwd、无 Multica/Issue 身份环境完成关键正例，并让 root/task path 注入、cwd/repository discovery 反例失败；纯文本扫描不算验收。← FR-GOV-006、FR-AUD-010
- [ ] **AC45**：三类成熟实践窄研究各有来源、适用性、采用/拒绝结论；没有新增 provider、身份系统或通用框架。← FR-GOV-007
- [ ] **AC46（reuse）**：复用当前 flow/CAS fixture，补齐五阶段缺少的矩阵：省略 `previous_result_ref` 续接当前 head，正确 ref 成功，过期或跨 stage/track/revision ref 在写入前失败；不得另建 fixture framework。← FR-REV-001、FR-REV-002
- [ ] **AC47（reuse + extend）**：复用当前 resolution/latest-event 测试，只补齐四个非 build-code stage 的 pass+minor 普通修改覆盖；provider 调用不增加，伪造 resolution 或缺绑定失败。← FR-REV-003、FR-REV-008
- [ ] **AC48（reuse + extend）**：复用当前分类器和结构预算测试，补齐十类结构维度的缺失矩阵；第一次允许 full、第二次派发前失败，caller 不能重置预算。← FR-REV-004、FR-REV-008
- [ ] **AC49（reuse）**：复用现有 build-code 完整重审循环测试，确认多次修复后才 pass；不得新增另一套循环或用 delta/一次预算替代。← FR-REV-005、FR-REV-008
- [ ] **AC50（reuse + extend）**：复用当前 unavailable provider-attempt/head/budget 测试，补齐五阶段覆盖；失败不产生 verdict、不另开 root。← FR-REV-006
- [ ] **AC51（reuse + extend）**：复用当前单 root/head、CAS、断链、canonical authentication、legacy adoption 和精确 receipt 测试；只新增合法 revision 隔离与 lineage 缺口覆盖。← FR-REV-007
- [ ] **AC52（extend）**：基于现有 flow event 计数补齐五阶段统一 cost fact；逐动作核对 decision、provider_calls、预算前后、flow/root/head/revision 和 refs，禁止第二计数器、估算或重复计数。← FR-REV-008、FR-HOF-004
- [ ] **AC53（reuse / completed bootstrap）**：验证稳定 external runner 已实际用于当前流程；31 个 runtime 路径的 patch、tar、文件清单和 SHA-256 manifest 完整；当前 CandidateWorkspace 恰好只含三个设计产物；build-code 首个 Phase 原样回放全部路径并逐文件 hash 相等。不得重建 authority、补造旧 typed interaction proof、扩大范围或第二次使用 bootstrap。← FR-REV-009、本轮风险处置 7

### 未决风险和问题

- **~~未决 1（严重问题阈值）—— 已决~~**：spec-clarify Q1 选择 A；采用正式聚合中 `disposition=actionable` 且 `severity=major|blocking` 作为唯一阈值。
- **~~未决 2（暂停适用阶段）—— 已决~~**：spec-clarify Q2 选择 A；适用于全部五阶段的正式 review。
- **~~未决 3（hash 与隐私顺序）—— 已由锁定约束唯一推导~~**：先秘密最小化，再对实际持久化 canonical 结构 hash 和写入；含秘密的回复要求用选项标签重新确认。
- **已接受的历史证据风险**：审查成本 A 与自举 B 的真实宿主可见回复发生在 typed interaction proof 可用之前；用户本轮选择 A，仅接受这两条历史回复不可补证的风险，不允许伪造记录、扩大到未来交互或把它表述为 canonical verified。
- **剩余重大歧义：0**。
- **build-plan 必须细化但不重新选择**：旧 task continuation/replay 的具体 CLI 和 Phase；FR-DEC-005 已固定 D1–D7 correction 字面量，plan 只安排实现，不得重新措辞或重新选择。

## 11. 影响范围（业务性质）

- **受影响功能：make-decision**
  - 既有行为：只有 decision 和两路 review 即可发布；talk/grill 主要靠 Skill 文案。
  - 本需求影响：三轮真实 talk、完整 grill、完整 detail review 材料、逐条覆盖审计、decision-log、review、最终确认和 audit/content evidence 全部同 run 才可发布；遗漏必须展示并处置。
  - 回归要点：仍只在最终业务方向边界要求一次用户确认；不引入宿主身份认证。

- **受影响功能：build-spec**
  - 既有行为：要求 ambiguity scan，但无 canonical ledger 进入 publication。
  - 本需求影响：重大歧义逐项关闭并与最终 spec/review hash 绑定。
  - 回归要点：没有重大歧义时不制造问题；每次卡片仍 ask 后立即暂停。

- **受影响功能：build-plan**
  - 既有行为：plan/tasks 只需非空且 hash/artifact 一致。
  - 本需求影响：Phase 六段、task 必填字段、依赖和 FR/AC traceability 成为确定性内容契约；正式 wh-review 必须加载现有独立 engineering lens。
  - 回归要点：内容结构检查不替代独立工程 review；计划仍由用户确认。

- **受影响功能：五阶段交接**
  - 既有行为：短总结和技术 handoff 边界不稳定。
  - 本需求影响：两个视图从同一 completion facts 生成并核对一致；同一 artifact label 和 accepted lookup rule；formal review record 与大白话 brief 分离。
  - 回归要点：用户消息保持大白话；系统记录保持精确。

- **受影响功能：正式审查处置**
  - 既有行为：质量 finding 通常只记录，不阻断。
  - 本需求影响：经确认阈值的严重 finding 默认暂停，用户可在充分知情后明确承担风险继续。
  - 回归要点：invalid/unavailable 不是 verdict；风险承担不变绿、不放行结构错误、不跨快照。

- **可能受冲击的业务规则**：宪法 F3、F4、F7、Q1、Q2；按 FR-GOV-001..003 升级 1.3.0、同步 21 条 checklist 并完成独立审查后，才可实施 RSK。
- **明确无影响**：Multica、外部 Issue 身份、provider 路由与 prompt、build-code Phase 门禁本身、verify-code 的 acceptance evidence 语义、处理组 5–6；build-code 原有“每次修复后完整审查到 pass”保持不变。
