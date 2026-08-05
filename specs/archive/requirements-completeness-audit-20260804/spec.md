# WorkflowHub 需求完整性审计：spec

状态：`build-code / verify-code candidate / V21`

来源：当前已确认的 `decision-log.md`，D1-D19 是需求方向，D20-D56 是对既有 FR/AC、内容合同、测试策略、阶段进度、任务路径和证据边界的收口；本文件只把已确认方向展开成可验收的 FR/AC，不新增业务需求。

V16 说明：D20-D37 不新增业务范围。D20-D35 细化既有的异源审查、fail-loud、AC 证据、原始需求回放、finding 处置、当前实现证据、provider 失败保留、历史 Phase/current-only 边界、verify-code 逐 AC 证据特异性和 packet 元数据；D36-D37 收口同快照完整测试复用、命令哈希校验和 review 非门禁语义。它们必须在当前实现和 verify-code 事实中可回放，但不另造 FR/AC。

## 来源与决策映射

| Source ID | Decision ID | FR / AC IDs | Status / affected scope | Handoff |
|---|---|---|---|---|
| R20、INC-046 | D45、D51 | FR-026、AC-029 | provisional/incomplete；内容 skill/template 和 provenance 已落地，D51-D56 当前交接未闭合 | T025/T028；不恢复旧 gate |
| R13、R17、R20 | D53 | FR-027、AC-030 | provisional/incomplete；plan 三阶段进度已落地，当前阶段状态和 handoff 仍需收口 | T026；用户 handoff 仍独立 |
| R23、INC-055/056 | D49、D53、D56 | FR-028、AC-030 | provisional/incomplete；tasks 字段已回填，逐项语义证据未闭合 | T026/T028；缺证据保持 incomplete |
| R2、R5、R11、R16、R23 | D54、D55、D56 | FR-029、AC-031 | unknown/incomplete；逐项语义证据、用户沟通和旧卡回填未闭合 | T027；不升级 formal accepted |
| R20、R23、D51-D56、INC-057 | D57 | FR-007、FR-009、FR-026、FR-029 / AC-008、AC-009、AC-029、AC-031 | current review/recovery fact；原始 finding 保留，verdict 非 gate | T028/T029；host-path redaction 与历史 evidence compatibility 有 focused contract |

本表只保存关系，不复制 decision-log 正文；每个新增或变更 FR/AC 必须有来源，scope
revision 只更新受影响关系，不另建需求账本。

## 1. 目标

修复 WorkflowHub 在需求记录、用户沟通、阶段交接、质量事实和当前材料读取上的最小闭环，使后续阶段能够从原始需求恢复范围、方案、风险和验收，而不是到 `verify-code` 才第一次猜测。

## 2. 用户和系统流程

1. 用户提出原始需求和约束。
2. `make-decision` 只读取当前已有材料；只有 `ENOENT` 的未来 `spec.md`、`plan.md`、`tasks.md` 视为尚未进入，不能预创建空文件。
3. 主代理直接与用户进行 `talk`、`grill`、`clarify` 等沟通；子代理只能研究、对照和整理事实，不能代替用户回答。
4. 主代理把原始需求、报告事实、Talk/Grill/调研、决策关系、边界、风险和延期写入 `decision-log.md`。
5. `make-decision` 进行独立审查并保留真实 verdict；审查失败、超时、同源排除和 unavailable 均保留原状态。前三阶段的审查是异源意见，不是要求 provider 给出 `pass` 的继续许可证；`revise_required` 可以让质量状态保持 incomplete，但不阻断阶段推进。
6. `make-decision` 结尾向用户展示大白话摘要；用户看过并确认后，才能交接到 `build-spec`。
7. `build-spec` 只把已确认且可绑定的决策展开为 FR/AC、接口边界和风险；D1-D19 是原始方向，已确认的 scope-revision 决策可以扩展既有范围，但每个新增 FR/AC 必须回指 R*/F*/INC*/D* 并标明 approved/provisional 状态。D20-D29 以及未完成用户交接的 D50-D56 只能澄清既有实现和证据边界，不能产生可验收的当前约束。已有 `pass` 基线后，如果当前材料增加或修改，只审查 runner 生成的变更内容及直接影响；发现新需求时仍回到 `make-decision`，不能在 spec 阶段补需求。
8. `build-spec` 结尾展示大白话摘要并取得用户看过的交接记录；这不是新增的正式业务确认点。
9. `build-plan` 把全部 FR/AC 映射到 plan/tasks、检查和交付顺序；结尾展示大白话摘要并取得该阶段确认后再交接。
10. `build-code` 和 `verify-code` 只以四份当前材料作为需求来源；`verify-code` 同时回放当前证据并绑定当前 snapshot/provenance，逐项输出真实质量状态。

## 3. 范围

- 当前四份材料的单一事实边界和未来材料缺失语义。
- decision-log 的需求点、决策点、来源和下游交接结构。
- 用户沟通的主代理所有权，以及三个阶段末的人类可读摘要交接。
- 质量事实、推进资格、阶段完成、formal close 和不可逆授权的边界。
- provider 默认超时、stage-content revision/latest CAS 收口和真实失败保留。
- 公开审查结果的私有路径安全恢复、协议错误分类，以及审查 finding 的逐条分析—处置—交接闭环。
- 前三阶段审查的非门禁语义、`revise_required` 的真实质量状态，以及已有 `pass` 基线后的增量审查范围。
- 五份复盘报告作为需求保真和后续业务验收输入的完整映射。
- 当前任务已有运行时修复的回归和证据绑定；不重新设计共享 provider 配置。

## 4. 非目标

- 不实现 PaperBuilder、KnowledgeDigest 的页面、策略、订单、知识产品或读者界面。
- 不改 wh-review/3rd-review 配置，不换 provider，不新增自动重试。
- 不新增 selector、lineage、recovery、continuation、replacement review、双写或永久平行控制面。
- 不新增 daemon、cron、长期服务或第二套运行时控制面；本任务只使用现有运行时和 TaskKernel 记录。
- 不把 review、test、evidence、confirmation 或历史 receipt 变成修复/交付准入 gate；不为追求 provider `pass` 反复全文审查。
- 不删除或覆盖历史失败、timeout、unavailable、review、snapshot 和 confirmation。
- 不把本 spec 扩展成具体业务页面字段、任务拆分或测试脚本；这些由后续 plan/tasks 细化。

## 5. 功能需求

### FR-001｜当前材料和阶段顺序

系统必须以 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md` 作为唯一当前材料。每个阶段只能读取已经进入的材料；未来材料不存在时保持缺失状态，不预创建、不补空文件、不把旧材料当当前材料。

关联：D1、D4、D7；R1、R10。

### FR-002｜需求到决策的可追溯记录

`decision-log.md` 必须逐项记录原始需求、五份报告需求点、目标、范围、非目标、决策级阶段链、Talk、Grill、调研、独立审查、`D*` 决策、成功/失败边界、风险和延期交接。Talk 至少包含问题/选项/选择/队列/evidence；Grill 至少包含 CONTEXT/ADR/冲突/四项退出/evidence；每个 `D*` 必须包含选择、来源摘录、事实约束、推理、理由、影响、后果风险、拒绝、未决、supersedes 和批准状态。

关联：D1、D2、D11；R2、R3、R4、R5、R11；F15-1/F15-2、F47-1/F47-2、KD-1/KD-2/KD-3/KD-4、F8-1/F8-2/F8-3、M08-1/M08-2/M08-3。

### FR-003｜用户沟通所有权

需要用户回答或确认的 `talk`、`grill`、`clarify` 及同类技能必须由主代理在用户可见上下文直接执行。子代理不得代替用户沟通、代写用户回答、代写用户确认或把推测写成用户选择。

关联：D12；R12。

### FR-004｜Talk/Grill/Clarify 证据完整性

沟通记录必须保留实际问题、用户看到的选项、后果和风险、用户回答、队列变化以及缺失项。Talk 的问题必须同时覆盖架构方向和产品旅程/用户最终结果，只问可能改变范围、结果、状态、数据或验收的问题。若原始 payload 缺少选项正文，必须记录为缺失，不能补写。Grill 必须记录 CONTEXT、ADR、冲突、四项退出检查和实际证据；缺失保持 `unknown`。

关联：D3、D12；R4、R11、R12。

### FR-005｜阶段末大白话交接

`make-decision`、`build-spec`、`build-plan` 结束时，主代理必须向用户展示简短摘要，至少包含：做了什么、产物是什么、范围/非目标、主要风险、未决/延期、下一阶段不能猜什么。只有真实记录用户看过/确认后，阶段才能声明已交接；用户未回应时保持 `in_progress/pending`。

关联：D13；R13。

### FR-006｜build-spec 只展开已确认方向

spec 必须把已确认的需求方向展开为稳定 ID 的 FR/AC、数据/接口边界、风险和假设；D1-D19 是原始方向，后续 scope-revision 只有在 Talk/Grill/Clarify、来源关系、用户交接和当前证据闭合后，才能扩展为新的 FR/AC。D20-D29 以及当前尚未完成交接的 D50-D56 只能回指既有 FR/AC 或标为 provisional/incomplete，不能成为当前验收依据。spec 不得新增没有 R*/F*/INC*/D* 来源的原始需求、页面结果、状态、数据或验收目标；出现新需求时必须回到 `make-decision` 建立新的 R/D 关系。

关联：D4、D11；R1、R2、R11。

### FR-007｜质量事实不是修复 gate

测试、review、evidence、provider unavailable、timeout 和 finding 必须作为真实事实浮现，不得阻止同任务继续修复或正常业务交付。严重 finding 的处置只能是“先修复（推荐）”或“由用户明确承担具体风险”，并记录真实选择；不能把风险承担写成 reviewer 已通过。缺少测试、逐 AC、独立 review 或人工交接时，不得宣称阶段完成；结构错误仍必须在正式 publication 时 fail-loud，不可逆操作仍需独立授权。

关联：D5、D10、D14；R6、R8、R14。

### FR-008｜verify-code 回放原始需求

`verify-code` 必须逐项回放 R1-R23、五份报告需求点和 INC-001 至 INC-056，确认每项属于当前实现、明确延期、非目标或真实 unavailable，并为每项绑定当前证据；R15 回放公开审查协议失败修复，R16 回放逐条 finding 处置，R17/R18 回放前三阶段 review 非门禁和增量范围，R19 回放轻量 scope-revision 合同，R20-R23 回放本轮内容合同、测试策略、进度/路径和语义闭环修复。不得只验证 spec 自洽、局部测试或“任务完成”状态。

关联：D2、D4、D5、D11、D15、D16、D18、D19、D43、D44；R2、R5、R11、R15、R16、R17、R18、R19。

### FR-009｜审查和 provider 失败保持真实

独立审查必须保留实际 provider、verdict、finding、same-source、invalid、timeout 和 unavailable。WorkflowHub 调用不能设置一个会早于 managed broker/provider 完成的隐藏默认墙钟超时；调用方显式指定的 timeout 仍然有效。聚合 `pass` 不能冒充用户确认；provider 输出无效不能改写成审查通过；不因审查失败而修改共享配置或自动重试。

关联：D6、D10、D14；R7、R8、R14。

### FR-010｜未来材料读取和 fail-loud

读取未来材料时只有 `ENOENT` 可转换为 `null`/missing。权限拒绝、篡改、格式损坏、hash 不匹配、snapshot/provenance 错误和其他非 `ENOENT` 错误必须明确失败，不得宽泛吞掉。

关联：D7；R10、R14。

### FR-011｜revision 与 latest 原子收口

stage-content 写入必须同时保证 immutable revision 和 current latest 指针的一致收口；使用现有 CAS 能力，冲突明确失败，不新增第二套 current view，不恢复退役 replacement API。

关联：D8；R9。

### FR-012｜历史和事故只读保留

旧确认、旧质量 projection、旧 review、provider failure、误建未来文件、材料映射错误和占位诊断必须保留为审计事实，不得支撑当前完成结论，也不得删除或覆盖。D9 的 INC-001 至 INC-056 必须逐项保留并可由 build-plan/verify-code 回放 freshness 和交接处理；INC-012 继续延期给仓库维护，INC-010/011/013/014/015 分别回指 FR-015/016/018/019/020；INC-016 至 INC-056 继续保留各自来源和当前 incomplete/deferred/unknown 状态。

关联：D9、D10；R5、R8、R9。

### FR-013｜跨项目 decision-log 最低结构

未来所有项目的 `decision-log.md` 至少包含：原始需求/来源、调研输入/处理状态、目标/范围/非目标、阶段链、Talk（问题/选项/选择/队列/evidence）、Grill（CONTEXT/ADR/冲突/四项退出/evidence）、D*（选择/来源摘录/事实约束/推理/理由/影响/后果风险/拒绝/未决/supersedes/批准）、成功/失败边界、审查处置、风险/延期、阶段末大白话摘要与用户看过状态、质量事实/推进资格/完成判据/不可逆授权边界。

关联：D11、D12、D13、D14；R4、R11、R12、R13、R14。

### FR-014｜业务交付、质量结果和 formal close 分离

业务可用、测试结果、独立审查、业务交付、Git 操作和 formal close 必须分别记录，任何一项不能冒充另一项。manual close、Git merge、`make check` 或单个 green 结果都不是 formal close；当前 snapshot 和 provenance 必须绑定质量事实。

关联：D5、D10、D14；R2、R5、R8、R14；KD-2/KD-4、F8-3、M08-3。

### FR-015｜公开审查协议失败必须可诊断且 fail-closed

当 provider 已实际运行但公开结果含私有绝对路径等协议违规时，系统必须保留
`PUBLIC_RESULT_INVALID` 等真实失败，不把它误报成 provider 全部不可用或语义
审查通过。支持同会话续写的 adapter 可以请求 provider 生成一份完整、无私有
路径的替代 JSON；替代仍违规时继续保持 unavailable。不得做文本清洗、修改共享
provider 配置、换 provider 或自动重试。

关联：D15；R7、R8、R9、R15。

### FR-016｜审查 finding 必须逐条分析后才能交接

每次语义审查产生 finding 后，主代理必须逐条记录 `fixed`、`rejected_invalid`、
`accepted_risk` 或 `needs_human`，说明事实、后果和下一步。有效 finding 回到同一
Task 修复并重跑受影响检查；严重未解决 finding 只能先修复或由用户明确承担具体
风险；原始 review verdict 永不改写。审查 unavailable/invalid 也要记录为不完整
处置，不能静默跳过。运行时必须把 finding ID 和 serious repair-or-risk 缺口浮现
为质量事实，但不得把该事实变成阻塞同任务修复或普通推进的 Gate。

关联：D16；R2、R8、R14、R16。

### FR-017｜新决策会使旧当前材料需要重审

当 make-decision 产生新的已确认 D* 时，已有 spec/plan/tasks 只能作为上一轮材料
读取，必须在当前 build-spec 重审受影响内容并写 revision note；旧材料不能因为
文件存在就自动成为本轮 handoff。

关联：D1、D4、D16；R1、R9、R11、R16。

### FR-018｜v2 审查材料契约必须和运行时校验一致

`wh_review.v2` 的公开输入说明和 `runtime/review/stage-materials.json` 必须把运行时
要求的 authority map 列为 `required`，不能一边写 optional、一边在 provider 调用前
拒绝。`make-decision/detail`、`build-spec`、`build-plan`、`verify-code` 必须提供
`context_map` 和 `evidence_map`；`build-code/phase` 必须提供 `phase_map`、
`impact_map`、`reuse_map`、`acceptance_map`；direction 和 integration 不凭空增加
这些 map。map 缺失时应 fail-closed 为 `MATERIAL_INCOMPLETE`，且不得调用 provider、
修改共享配置、自动补写证据或转成质量通过。

关联：D17；R7、R15。

### FR-019｜前三阶段审查是质量意见，不是推进门禁

`make-decision`、`build-spec`、`build-plan` 必须把 provider 的 `pass`、
`revise_required`、`unavailable`、timeout、same-source 和协议失败保留为真实质量
事实。阶段 `status/progression` 不得依赖 provider `pass`；`revise_required` 可以使
`quality_status` 保持 `incomplete`，但不能因此阻止同任务修复、正常阶段推进或把
finding 变成重复审查直到 `pass`。结构错误仍在正式 publication 边界 fail-loud，
formal completion 仍必须如实反映缺失质量事实。

关联：D18；R14、R17。

### FR-020｜已有 pass 基线后的前三阶段只审查增量

当上述三个阶段已有认证的 `pass` 结果且当前材料发生增加、删除或修改时，runner
必须依据上一结果的分类 manifest 和当前冻结材料哈希生成临时 `review_delta`，只交付
变化材料及其直接影响给 provider；delta 必须是 provider 可分段阅读的 JSON，并显式列出
每个变化维度对应的变更材料、直接影响材料和判断依据；未变化基线不重复放入或审查。当前阶段必需材料仍
必须完整 preflight 校验，caller 不得传入或选择 round/delta。若没有安全的上一份
manifest、材料无法比较或无法可靠确定范围，必须记录原因并回退一次完整 `initial`
审查。该规则只适用于前三阶段，不改变 `build-code`、`verify-code`、历史 review、
共享 provider 配置或新增控制面。

关联：D19；R18。

### FR-021｜中途临时需求走四材料一次性 scope-revision 审查

在 `build-code` 或 `verify-code` 中发现原始需求、用户结果、方案、FR/AC、数据状态、
成功/失败边界、非目标或交付影响需要改变时，主代理必须先和用户直接沟通，再在同一个
task 内更新当前 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md`。四份材料必须通过
一致性校验，至少写清临时需求原文、核心目标关系、受影响 ID、用户流程/数据状态/成功失败
影响、实现/测试/审查/交付影响、风险、非目标/延期和 Constitution 对照。

随后使用现有 wh-review provider 路由执行一次 `scope_revision` 专用审查。专用审查的
判断对象是“临时需求在整个任务中的合理性、核心目标一致性和影响范围完整性”，不是普通
代码审查，也不是为了取得 provider `pass`。`pass`、`revise_required`、`unavailable`、
timeout 和协议失败均原样保留；不创建新 stage、successor、reopen、ledger 或 provider
配置，不自动重新执行完整五阶段。审查后主代理必须逐条分析 finding 并写 disposition；
影响实现时回受影响的 build-code，影响验收时回 verify-code。

scope_revision packet 只携带四份材料的受影响 bounded excerpt，并绑定每个原文件的路径、字节数和
SHA-256；每份 excerpt 不超过 24 KiB，packet 总大小不超过 330 KiB。无法安全截取或超限时在 provider
调用前记录 `MATERIAL_INCOMPLETE`，不能静默全文复制或猜测遗漏。

关联：D44；R17、R18、R19。

### FR-022｜spec/plan/tasks 使用可搬运的内容合同和模板

`build-spec` 必须调用 `spec-specify`、`spec-clarify` 的当前内容合同，`build-plan` 必须
调用 `spec-plan`、`spec-tasks` 的当前内容合同。模板必须引导场景、状态、失败条件、
PFACT/OPEN、Constitution、精确边界、STOP、rollback、RED/GREEN、oracle、evidence 和
FR↔Task↔AC 双向追溯。它们是 stage 的输入格式，不是第二份当前材料、公共 stage 或
推进 gate；缺少历史模板不能再由 agent 临场补字段。

关联：D45；R1、R2、R4、R11、R20。

### FR-023｜build-code 恢复 Phase 级 apply 质量闭环

每个 build-code Task/Phase 在实现前要形成精确边界和 STOP 的 Phase Card；行为变化要
有真实 RED，实施后要跑风险相关测试、GREEN、完整 diff/消费者扫描、一次独立 review、
逐条 finding 根因与 disposition，并留下大白话交接摘要。完整回归、provider `pass`、
clean worktree 和 commit 不得成为普通阶段推进 gate；质量事实缺失保持可见。

关联：D46；R2、R14、R16、R21。

### FR-024｜build-plan 设计并固化分层测试策略

`build-plan` 必须根据每个 Task/Phase 的真实 changed files、FR/AC、接口和风险，使用
`test-routing-advisor`、`testing-system-blueprint` 以及适用的
`backend-testing`、`frontend-testing` 或 `fullstack-slice-testing` 设计测试策略，并把
测试层级、场景、命令、expected exit、oracle、fixture/service、浏览器路径（如适用）、
证据路径、coverage limits 和 snapshot 绑定写入 `tasks.md`。这五个技能是设计输入，不
是 build-code 每个 Phase 的重复执行循环。

关联：D47、D49；R21、R22、R23、D40。

### FR-025｜build-code 只执行 tasks.md 中的测试策略

`build-code` 必须读取当前 Task/Phase 卡中已设计的 `test_strategy`，直接执行记录的
命令、场景和 oracle，并记录 exit code、输出/截图、实际结果、跳过原因、coverage limits
和当前 snapshot。它不得重新调用 route/blueprint/executor 来临场设计测试；最终聚合测试
必须由 build-plan 预先写成专门的 final Task/Phase 策略。策略缺失或不具备可执行边界时，
必须显示 `MATERIAL_INCOMPLETE` 并回到当前材料修复，不能由普通执行模型猜测替代方案。

关联：D49；R23。

### FR-026｜恢复高质量内容合同必须可核对来源

`spec-specify`、`spec-clarify`、`spec-plan`、`spec-tasks` 及其模板必须恢复到删除前
可读的高质量内容合同，并记录可核对的 Git 来源；当前 WorkflowHub 扩展只能在其上
增加阶段进度、执行路径和测试策略字段，不能用一份精简重写版冒充历史高水位版本。
catalog 与 bundle 的 hash 必须和实际文件同步。内容合同仍由阶段 inline 消费，不恢复
旧运行时、旧 gate 或第二套材料真相。

关联：D45、D51；R20、INC-046。

### FR-027｜plan.md 记录前三阶段进度

`plan.md` 必须有唯一的 `WorkflowHub Stage Progress` 索引，分别记录
`make-decision`、`build-spec`、`build-plan` 的材料状态、当前工作/产物、审查事实、
大白话交接、下一步和延期风险。进度状态与 `quality_status`、用户 handoff 分开；
provider `pass` 不是推进条件。该索引不复制 decision-log 或 spec。

关联：D53；R13、R17、R20、R23。

### FR-028｜tasks.md 记录 build-code/verify-code 进度和执行文件

`tasks.md` 必须有唯一的 `WorkflowHub Stage Progress` 索引，分别记录 build-code 和
verify-code 的当前 Task/Phase、命令/证据、handoff 和下一步。每张 Task 卡必须把
`Workflow stage`、`精确文件` 和派生的 `execution_file_paths` 绑定到所属 Phase 的
NEW/MODIFY 边界；路径不能使用 glob，完成区还必须记录实际命令、exit code、实际结果、
coverage limits 和 canonical evidence refs。它们是执行事实，不是第二份文件边界或隐形 gate。

关联：D49、D53、D56；R20、R23、INC-055、INC-056。

### FR-029｜结构完成与语义验收必须分开

任何阶段都不得因为文件存在、Task completed、FR/AC/Task ID 映射、局部测试或历史
receipt 就宣称所有原始/新增需求已语义验收。verify-code 必须逐项读取当前 R*/F*/INC*/D*
和新增 FR/AC，给出 `pass`、`fail`、`unknown`、`deferred` 或 `unavailable`，并绑定当前
snapshot、scenario、oracle、actual outcome、coverage limits、独立实现/验证锚点和真实
review/finding/handoff。缺失证据或 `needs_human` 保持 `unknown/incomplete`，不阻止同任务
修复，但不能升级为 formal accepted。

关联：D43、D50、D54、D55、D56；R2、R5、R11、R16、R20、R23。

## 6. 验收标准

### AC-001｜make-decision 只有当前材料

在只有 `decision-log.md` 时，`make-decision` 的 confirm、grill、status 能继续工作；不会因为缺少 `spec.md`、`plan.md`、`tasks.md` 自阻断，也不会创建三个未来文件。

验证：运行时回归测试；检查候选任务目录只存在当前阶段材料。

需求：FR-001、FR-010。

### AC-002｜非 ENOENT 失败暴露

未来材料读取遇到权限错误、格式错误、hash/snapshot/provenance 不一致时，命令返回明确失败；不能把它们当成 `null`。

验证：错误注入测试和错误字符串检查。

需求：FR-010。

### AC-003｜原始需求全覆盖

R1-R23、F15-1/F15-2、F47-1/F47-2、KD-1/KD-2/KD-3/KD-4、F8-1/F8-2/F8-3、M08-1/M08-2/M08-3 均能在 decision-log 找到来源、处理方式和 D*/延期/非目标归属；R15/R16 还必须分别回指 D15/D16，R17/R18 必须回指 D18/D19，R19 必须回指 D44，R20 必须回指 D45，R21 必须回指 D46，R22 必须回指 D47，R23 必须回指 D49，D17 的技术契约归属单独保留。

验证：coverage audit；R3 还必须回放 decision-log 调研段的 receipt `quality/tests/research.json`，sha256 `422f4044bfc68952c8ca917057e6930e51f7825943b49a0727e1b2936457ffe0`，确认“超过 10 个研究角色且先于本任务开始”的事实；缺失时显示 `unknown/incomplete`，不得写成 pass。

需求：FR-002、FR-008、FR-013；R3；F15-1/F15-2、F47-1/F47-2、KD-1/KD-2/KD-3/KD-4、F8-1/F8-2/F8-3、M08-1/M08-2/M08-3。

### AC-004｜沟通不被子代理替代

需要用户回答的沟通由主代理直接展示；子代理输出不能被当作用户回答、确认或 Talk/Grill 结论。缺少真实用户回答时，记录保持 pending/unknown。

验证：沟通执行身份检查和人工对话记录检查；分别检查架构类问题和产品旅程/用户结果类问题是否出现。

需求：FR-003、FR-004；D3、D12。

### AC-005｜阶段末摘要和人工交接

三个阶段结束时，用户能看到包含完成内容、产物摘要、风险、延期和下一阶段边界的大白话摘要；未产生真实看过/确认记录时，不声明 handoff 完成。

验证：make-decision、build-spec、build-plan 的阶段收口记录和人工回复。

需求：FR-005、FR-013。

### AC-006｜spec 不补需求

 spec 中每个 FR/AC 都能回指 D1-D56 或已有 R*/F*；若出现无法回指的新增范围，必须回到 make-decision，而不是直接写入 spec。

验证：FR/AC coverage matrix 和 ambiguity ledger。

需求：FR-006。

### AC-007｜verify 回放原始需求

verify-code 对每个 R*/F* 输出 `pass/fail/unknown/deferred/unavailable`，并绑定当前证据；只跑局部测试或只检查 spec 不能形成完成结论。

验证：逐项验收记录和当前 snapshot/provenance 检查。

需求：FR-008。

### AC-008｜质量事实不阻止同任务修复

review timeout、provider unavailable、普通 finding 或测试失败出现时，任务仍可在同一 task 继续修复；原始失败事实保持可见。严重 finding 只能选择先修复（推荐）或由用户明确承担具体风险，且不能改写原始 verdict。缺质量事实时，阶段状态保持 `in_progress/unknown/incomplete`，不能宣称完成。

验证：失败注入、同任务继续执行和完成声明负测。

需求：FR-007、FR-009、D14。

### AC-009｜结构错误仍 fail-loud

任务、workspace、runtime、材料 hash、快照、写集合或正式 publication 结构错误时，正式写入明确失败；不能用质量 gate、旧 receipt 或自动 accepted 掩盖错误。

验证：结构错绑和内容错配测试。

需求：FR-007、FR-010、FR-012。

### AC-010｜审查结果真实保留

独立审查输出能区分真实完成、same-source、invalid、timeout、unavailable 和 provider failure；aggregate `pass` 不等于用户确认，不覆盖原始 provider 事实。

验证：wh-review 结果、quality facts 和报告交叉检查。

需求：FR-009。

### AC-011｜provider 配置不被修改

上述 provider 超时/无效输出修复不修改 wh-review/3rd-review 配置、不更换 provider、不新增自动重试；WorkflowHub 不得用隐藏默认 timeout 在 managed broker/provider 完成前提前失败，调用方显式 timeout 仍有效。

验证：配置文件 hash/diff 检查、显式 timeout 回归和真实调用边界检查；验证没有隐藏默认 timeout 先于 provider/broker 完成而失败。

需求：FR-009、D6。

### AC-012｜CAS latest 收口

stage-content revision 写成功后 current latest 指针可读且绑定正确 revision；并发 CAS 冲突明确失败，不能留下 revision 已写而 latest 未更新的静默半成品。

验证：revision/latest 回归、并发冲突和故障注入测试。

需求：FR-011。

### AC-013｜五份报告语义不被摘要吞掉

PaperBuilder、KnowledgeDigest 和历史任务中的真实用户结果仍作为后续验收输入保留：流程、真实数据、读者路径、失败/预算/来源、browser 交互、snapshot/close、指标和 provenance 均不能只用“任务完成”代替。

验证：报告需求点与 decision-log、spec 的映射审计；具体业务实现延期，不在本任务宣称完成。

需求：FR-002、FR-008、FR-012；F15-1/F15-2、F47-1/F47-2、KD-1/KD-2/KD-3/KD-4、F8-1/F8-2/F8-3、M08-1/M08-2/M08-3。

### AC-014｜历史事实不冒充当前事实

旧确认、旧 review、旧 snapshot、旧 quality projection 和旧 material revision 在当前材料变化后仍可读取，但不能支撑当前阶段的完成或 handoff 结论；INC-001 至 INC-056 必须逐项可回放，不能只保留前九项。

验证：修改当前材料后 freshness 检查和旧事实负测。

需求：FR-009、FR-012；INC-001/INC-002/INC-003/INC-004/INC-005/INC-006/INC-007/INC-008/INC-009/INC-010/INC-011/INC-012/INC-013/INC-014/INC-015/INC-016/INC-017/INC-018/INC-019/INC-020/INC-021/INC-022/INC-023/INC-024/INC-025/INC-026/INC-027/INC-028/INC-029/INC-030/INC-031/INC-032/INC-033/INC-034/INC-035/INC-036/INC-037/INC-038/INC-039/INC-040/INC-041/INC-042/INC-043/INC-044/INC-045/INC-046/INC-047/INC-048/INC-049/INC-050/INC-051/INC-052/INC-053/INC-054/INC-055/INC-056。

### AC-015｜当前文档边界清楚

spec 包含稳定 ID、范围、非目标、FR、AC、接口/数据/运维边界、风险和假设，但不复制详细页面字段、任务拆分、测试脚本或证据 schema。运维边界明确为：本任务不新增 provider 配置、daemon、cron、长期服务或第二套控制面，只使用现有运行时和 TaskKernel 记录。

验证：spec review 检查第 3、4 节已先声明接口/数据/运维边界，再检查本 AC 的职责边界；第 7 节只承载共享边界和状态接口，不冒充运维边界来源。

需求：FR-006、FR-013。

### AC-016｜交付与 formal close 不互相冒充

用户可分别看到业务可用状态、测试结果、独立 review、业务交付、Git merge 和 formal close。manual close、`make check` 或 Git merge 单独出现时，系统仍不能把它们写成 formal close；缺少当前 snapshot/provenance 或质量事实时保持 `unknown/incomplete`。

验证：状态矩阵、旧 close 事实回放和当前 snapshot 绑定检查。

需求：FR-014；D5、D10、D14；KD-2/KD-4、F8-3、M08-3。

### AC-017｜decision-log 最低字段不丢失

coverage audit 必须在任一 Talk、Grill 或 `D*` 缺少 D11 规定字段时返回 `unknown/incomplete` 或失败，不能因为只存在 R/F/D 三张表就通过。特别是 `D*` 的 `supersedes`、来源摘录、事实约束、推理、拒绝、未决和批准状态必须可回放。

验证：最低结构字段审计和故意删除字段的负测。

需求：FR-002、FR-013；D11。

### AC-018｜公开审查协议失败可区分且不伪造通过

包含私有路径的 provider 输出必须得到 `PUBLIC_RESULT_INVALID` 等明确分类；同会话
安全重写成功时只接受完整替代 JSON，失败时仍为 unavailable，原始失败可追溯；不
修改共享配置、不自动重试、不把 group-level failure 拆成 provider pass。

验证：3rd-review public-output rewrite 回归、WorkflowHub 对
`PUBLIC_RESULT_INVALID`、`PROTOCOL_INCOMPATIBLE`、`MATERIAL_INCOMPLETE`、
`PROFILE_MISMATCH` 四种真实码的 classification 测试、配置 diff 检查和失败重写负测。

需求：FR-015；D15。

### AC-019｜每个 finding 都有处置事实

审查后的当前 Task completion area 和阶段交接必须能看到每个 finding 的分析、
处置、证据或未决风险；`build-code`、`verify-code` 在 review 后经过
`analyze-review-findings`；build-spec/build-plan 不得在未写处置摘要时静默 handoff。
严重 finding 未修复且无风险承担时，完成结论保持 `incomplete/unknown`；该缺口
仍不阻止同一 Task 继续修复。

验证：step manifest、workflow skill 契约、严重 finding 运行时 missing-item 回归和
无处置 handoff 负测。

需求：FR-016；D16。

### AC-020｜旧材料不能自动覆盖新决策

本轮 D15-D19 确认后，上一轮遗留的 spec/plan/tasks 必须先经过 build-spec 重审；
旧 review、旧确认和旧 snapshot 只能作为审计事实，不能支撑本轮 handoff 或完成声明。

验证：材料 revision note、旧材料 freshness 负测和当前四份材料来源检查。

需求：FR-017；D1、D4、D16、D18、D19。

### AC-021｜v2 审查输入不会再因公开契约歧义而失败

每个 `wh_review.v2` stage 的 authority map 同时出现在 stage matrix 的 `required`
和 `v2_required_maps` 中，不再出现在 `optional`；`wh-review/SKILL.md` 逐 stage 列出
完整输入。缺 map 的负例必须在 provider 调用前返回
`MATERIAL_INCOMPLETE`，`provider_attempts` 保持为空；补齐结构化 map 后，调用才进入
配置的 provider route。该契约修复不改变 provider 配置、超时、重试、质量 Gate 或
审查 verdict 语义。

验证：`simple-contracts.test.mjs` 的 stage matrix/技能输入契约测试；真实
build-spec 审查 attempt `2da6e4d4-f347-48a8-9b16-37762823e955` 作为修复前的失败事实，
后续重审记录真实 provider 状态，不把这次 preflight failure 当 provider failure。

需求：FR-018；D17。

### AC-022｜前三阶段不追求 provider pass 才能继续

给 `make-decision`、`build-spec` 或 `build-plan` 提供真实的
`revise_required`、timeout 或 unavailable 质量事实时，阶段仍可发布真实的
`status/progression` 结果；质量字段保持 `incomplete/unknown`，原始 verdict、finding
和失败原因仍可见，不能被改写成 `pass`。同一材料不能因为没有拿到 `pass` 而循环全文
审查；结构错误和 formal completion 的缺失质量事实仍按原规则处理。

验证：阶段运行时回归、`revise_required` 非门禁回归、质量事实与阶段状态分离检查，
以及“重复审查直到 pass”负测。

需求：FR-019；D18、R17。

### AC-023｜已有 pass 后新增内容只审查增量

已有 `pass` 的前三阶段材料发生变化时，审查 round 必须为 `incremental`，并由 runner
生成 `wh-review-delta.v1`；delta 列出新增、删除或修改的材料、前后哈希、变化维度和
直接影响。provider-visible packet 不包含未变化的完整基线，当前必需材料仍经过完整
preflight，caller 传入 `review_delta` 或自行指定 round 必须失败。delta 必须保持多行/分段可读，
并且增量指令要说明前三阶段没有实现执行 receipt 时 `canonical-evidence.json` 为空是预期。
上一份 pass 缺少可认证
manifest 或无法安全比较时，round 必须回退为 `initial` 并留下 fallback 原因；
`build-code`、`verify-code` 和共享配置不受影响。

验证：review controller、CLI/material contract、stage cost policy、增量材料包和
无 manifest 回退回归；检查 skill bundle/catalog hash 与 main 合并版本一致。

需求：FR-020；D19、R18。

### AC-024｜中途临时需求只走一次专用 scope-revision 审查

给定一个从 `build-code` 或 `verify-code` 提出的临时需求，系统必须在同一个 task 内读取并
校验四份当前材料：`decision-log.md`、`spec.md`、`plan.md`、`tasks.md`。四份材料必须共同
包含临时需求原文、核心目标关系、受影响 R/D/FR/AC/Task、用户流程/数据状态/成功失败边界、
实现/测试/审查/交付影响、风险、非目标/延期和 Constitution 检查；还必须有 return_stage、
main-agent 的 Talk/Clarify/Grill 和用户回应，以及 decision-log/spec/plan/tasks、acceptance、
implementation、tests、review、delivery 的 consumer coverage。任一项缺失时 provider 调用前
返回 `MATERIAL_INCOMPLETE`。

系统随后必须用现有 provider route 生成一个专用 `scope_revision` review packet，使用专属
prompt 和 `scope-revision` contract；packet 只审查临时需求在整个任务中的合理性与影响完整性，
不把代码“是否通过”混进这个 verdict。相同 revision 只允许一次语义审查；`revise_required`、
`unavailable`、timeout、协议失败和 finding 必须原样保留，不得循环审查到 `pass`，不得创建新
stage/task/provider 配置。审查后必须有主代理的逐条 disposition，并回到受影响的正常 stage。

验证：scope-revision schema/材料校验、专属 prompt/contract、一次性 review identity、四材料
缺项负测、非门禁和同 task 路由定向测试；不重复 `npm test`，不调用共享 provider 配置变更。

packet 还必须使用四份材料的受影响摘录和原文件 hash/size 绑定，单个摘录不超过 24 KiB、总 packet
不超过 330 KiB；超限或无法安全截取时在 provider 前返回 `MATERIAL_INCOMPLETE`。验证必须覆盖
摘录路径/hash、packet 大小和超限负测。

需求：FR-021；D44、D48、R19。

### AC-025｜spec/plan/tasks 内容合同和模板可用

build-spec/build-plan 的 stage manifest 能解析并调用 `spec-specify`、`spec-clarify`、
`spec-plan`、`spec-tasks`；对应模板分别包含场景/状态/失败条件、歧义来源与用户回答、
Constitution/STOP/rollback、RED/GREEN/oracle/evidence、DAG 和 FR↔Task↔AC 双向追溯。
模板只作为当前四份材料的内容合同，不产生第二份材料、公共 stage 或质量 gate。

验证：skill closure、模板字段和 stage manifest focused tests；历史 skill/template 缺失时
不得只靠 stage SKILL 的概括文字宣称内容合同仍然完整。

需求：FR-022；D45、R20。

### AC-026｜build-code 每个 Phase 都有 apply 质量事实

每个行为 Task/Phase 都能回放 Phase Card、RED（或不适用理由）、实现 diff、风险测试、
GREEN、完整 diff/消费者扫描、独立 review、逐条 finding disposition 和大白话 handoff；
测试失败、review unavailable、coverage gap 和未解决 finding 原样记录，不被改成 pass，也
不因缺质量事实阻止同 task 修复或普通推进。

验证：build-code apply contract、steps manifest 和 Task completion focused tests；负测覆盖
只写 RED/GREEN、漏 finding disposition、漏 handoff 和把 review/commit/full-suite 当 gate。

需求：FR-023；D46、R21。

### AC-027｜build-plan 将分层测试策略写入 tasks.md

对每个 Task/Phase（包括最终聚合 Task/Phase），`tasks.md` 都能回放五个测试设计技能的
适用结果：simple/feature/fullstack 选择、行为/状态/错误/seam/UI 风险维度、场景、命令、
expected exit、oracle、fixture/service、证据路径、coverage limits 和 snapshot 绑定。
build-code 不需要重新设计这些内容，只执行任务卡并补写实际结果；完整回归不因本 AC 在
每个 Phase 重复执行。

验证：build-plan manifest、tasks template、build-code manifest/steps、技能 closure 和
apply-quality focused tests；负测覆盖缺少命令/oracle/证据边界、把 RED/GREEN 当作唯一
测试报告、把普通执行模型变成测试设计者以及交叉边界改动未升级 fullstack。

需求：FR-024、FR-025；D47、D49、R22、R23。

### AC-028｜build-code 执行任务卡策略而不重新设计

当当前 Task/Phase 的 `tasks.md` 卡包含完整 `test_strategy` 时，build-code 直接执行其
commands/scenarios/oracle，并记录 expected exit、实际结果、evidence、coverage limits
和 snapshot；build-code manifest 不声明五个测试设计技能，steps 不要求 per-Phase 或最终
临时 route/blueprint/executor 设计。若策略缺少可执行命令、oracle 或证据边界，结果明确
为 `MATERIAL_INCOMPLETE`，回到材料修复；不得由普通执行模型自行补方案。无论测试结果是
成功、失败还是 unavailable，都只是质量事实，不是 pass gate。

验证：build-code apply contract、tasks template、build-plan/build-code skill closure 和
缺策略负测。

需求：FR-025；D49、R23。

### AC-029｜高质量内容合同来源和当前扩展可核对

历史审计能指出当前 `spec-*` 内容合同来自删除前可读的高水位提交
`5af7349554cdfbb0bfa5c502484d12c69e620188`（其后续组合提交为
`c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf`）；当前文件保留其字段并附加 WorkflowHub
阶段扩展。每个 skill/bundle/catalog hash 与实际文件一致；不把删除后的短版模板写成
“恢复完成”。

验证：逐文件 Git provenance 对照、skill closure 和当前模板字段回归；不修改 AgentHub
源仓库或 provider 配置。

需求：FR-026；D45、D51、R20、INC-046。

### AC-030｜plan/tasks 进度和执行路径可派生

当前 `plan.md` 包含 make-decision/build-spec/build-plan 三行进度，当前 `tasks.md` 包含
build-code/verify-code 两行进度；每个 Task 的执行路径来自其 `精确文件` 并受所属 Phase
边界约束。删除任一阶段行或把路径写成 glob 时，契约测试失败；进度行可以显示
`completed / quality=incomplete`，不把质量事实变成推进 gate。

验证：当前任务材料的 stage-progress contract、Phase 文件边界和 exact-path 负测。

需求：FR-027、FR-028；D49、D53、D56；R13、R20、R23、INC-055、INC-056。

### AC-031｜缺语义证据不能冒充全量完成

给定当前材料仍引用但实际不存在的 receipt、过期 snapshot、共享 proving anchor、
`needs_human` finding 或未确认 handoff，verify-code 必须逐项输出 `unknown/incomplete`
或相应的 deferred/unavailable，并在总体结论写明“结构和局部实现已完成，全部需求语义
验收未完成”。`Task completed`、局部 focused test、历史 provider `pass` 和 progress
`completed` 都不能把结论升级为正式 accepted。

验证：缺 receipt、漂移 snapshot、重复锚点、未处置 finding 和无 handoff 的负测；不运行
无关全量回归、不重复 provider，只验证受影响事实。

需求：FR-029；D43、D50、D54、D55、D56；R2、R16、R23、INC-056。

## 7. 数据和接口边界

- 输入：四份当前材料、用户可见沟通、指定复盘报告、当前代码事实、独立 review 结果。
- 当前状态：材料存在性、材料 revision、snapshot/provenance、用户确认、review/test/research/grill 事实分开保存。
- 输出：`spec.md`、FR/AC coverage、finding disposition 摘要、v2 review authority maps、ambiguity ledger、真实 review/clarification 状态和 build-plan 交接摘要。
- 增量审查：已有 pass 基线、当前材料分类 manifest、runner 生成的 `review_delta`、变化维度、直接影响、fallback 原因和实际 review round 分开保存；delta 不是任务 ledger，也不是新的 completion 状态。
- 审查处置：当前 Task completion area 记录逐条分析和下一步；运行时质量事实记录 finding IDs、原始 verdict、风险承担或 incomplete，不创建第二套 completion 状态机。
- 失败语义：`fail` 表示事实失败，`unknown/unavailable/incomplete` 表示证据缺失或不可用；这些状态不能被统一改成 pass。
- 共享边界：provider 配置属于 wh-review/3rd-review，不由本任务修改；PaperBuilder/KnowledgeDigest 业务实现属于后续项目。
- 内容合同边界：spec/plan/tasks 的四个恢复 skill/template 只约束材料内容，不创建第二份材料真相或公共流程节点。
- build-code 测试边界：build-plan 把 routing/blueprint/适用测试方法、命令、oracle 和 coverage limits 固化在 tasks.md；build-code 每 Phase 和最终收口只执行并记录实际结果。完整回归仍由 verify-code 或明确计划项负责，测试事实不成为推进 gate。
- scope_revision packet 边界：四份材料只以 source hash/size 加受影响 bounded excerpt 进入 provider；超限保持 `MATERIAL_INCOMPLETE`，不复制完整历史。

## 8. 风险和假设

- provider 输出可能因私有路径或协议问题变成 `PUBLIC_RESULT_INVALID`；保留事实，不伪造覆盖。
- 用户未阅读阶段摘要时，handoff 必须保持 pending；不能用机器 receipt 代替人看过。
- 当前报告的业务验收细节仍由对应项目 build-spec 展开；本任务只保证它们不被上游摘要丢失。
- 旧 quality facts 可能绑定历史材料 revision；只有当前 revision 的证据能支撑当前完成结论。
- 质量非 gate 不等于质量可删除；缺质量事实会阻止“完成”声明，但不阻止同任务继续修复。
- 安全输出重写仍可能失败；失败必须继续显示 unavailable。
- 自由文本处置摘要当前不能自动完成全部证据绑定；后续 plan 必须明确最小证据、owner、consumer 和删除/保留条件，但不得新增平行控制面。
- v2 authority map 的业务条目必须从当前 decision-log/spec 和现有证据生成；map 结构由 review contract 固定，不能在调用时临时猜测或把 provider 未调用写成审查结果。
- 增量审查依赖上一份 pass 的可认证分类 manifest；manifest 缺失或直接影响无法安全判断时，必须回退完整 initial，并保留原因，不能为了节省上下文静默漏审。
- tasks.md 的测试策略质量成为 build-code 结果的上游风险；命令、oracle、fixture、证据边界或 coverage limits 缺失时必须保持 `MATERIAL_INCOMPLETE` 并回到 build-plan 材料修复，普通执行模型不能临场替代设计。

## 9. 决策状态分类

- **locked**：D1-D19 全部是已确认方向；D17 是由已确认 D15 直接推导的技术契约修复，D18-D19 是本轮确认后的审查语义修复；D20-D29 是既有范围内的实现/证据收口；D45-D49 是当前 scope revision 的已选修复方向；build-spec 只能展开，不能重新选择或改写。
- **provisional/incomplete**：D50-D56 是当前审计修订的事实和候选修复方向；其中 D51-D56 尚缺本轮完整 Talk/Grill/Clarify 记录、逐项当前证据和新的用户 handoff，因此 FR-026-FR-029、AC-029-AC-031 只能作为待修订合同，不能作为当前 formal acceptance 依据。
- **unresolved**：A1（阶段摘要的具体 runtime schema）、A3（R12-R14 的独立复审覆盖）、A5（finding disposition 的最小证据绑定字段）。这些不改变本 spec 的当前范围；A3/A5 保持质量或设计事实 `unknown/deferred`。
- **deferred**：A2（五份报告业务实现归属）已明确延期给后续 PaperBuilder/KnowledgeDigest 任务，不是当前 spec 的未决选择。
- **newly discovered ambiguity**：A4（是否新增自动化 gate）、A6（v2 authority map 的逐条业务内容由谁生成）。A4 已依据 locked D14 的 Constitution F4/F7/F9/Q1/Q2 和 checklist F4/Q1/Q2 解决为“不新增”；A6 已依据 D17 锁定结构、来源和缺失语义，具体条目编排延期给 build-plan，详见第 10 节。

## 10. 歧义清单

- A1：三个阶段的用户看过记录使用何种具体 runtime schema。结论：不改变当前范围和验收语义；本 spec 只锁定“主代理展示 + 真实看过/确认 + 未看过不 handoff”，具体 schema 延期给阶段 runtime 实现。
- A2：五份报告中的业务页面、订单、知识产品和读者验收如何实现。结论：明确属于后续 PaperBuilder/KnowledgeDigest 任务，不是本任务的可交付范围。
- A3：R12-R14 在上次 provider 复审之后新增，当前独立复审覆盖为 `unknown`。结论：保留事实，不把旧 review 扩大解释；本 spec 可继续起草，最终 review/完成状态如实记录。
- A4：是否需要新增自动化 gate。结论：不新增；按已批准 D14 的 Constitution F4/F7/F9/Q1/Q2 及 checklist F4/Q1/Q2，使用主代理沟通、现有运行时记录和必要的实跑检查。
- A5：finding disposition 是否新增独立 resolution schema/control plane。结论：不新增；先复用当前 Task completion area、已有 review/risk acceptance 和运行时 missing-items，后续 plan 只设计满足证据绑定所需的最小字段。
- A6：v2 authority map 的逐条业务内容由谁生成。结论：当前 spec 只锁定结构、来源和缺失语义；条目必须引用已有当前材料，具体 map 编排和证据锚点由 build-plan 设计，不能新增需求或第二套 ledger。
- A7：AgentHub 的测试执行器是否全部恢复为强制 gate。结论：只恢复测试方法、风险维度、分层路由和报告字段；适用 executor 按 changed files 选择，失败/缺失是质量事实，不恢复 pass/commit/full-suite gate。

## 11. 当前 spec 修订记录

- V1：由已确认 D1-D14 展开本 spec；没有新增原始需求。
- V2：根据 build-spec 独立审查 attempt `b8e39229-b2f9-413e-a217-b2eeae12ebb5` 修正 D3 Talk 双覆盖、D5 close 分离、D6 隐藏 timeout、R3/F* 追溯、locked/unresolved 分类、运维边界和 Constitution 来源；没有新增原始需求。
- V3：根据复审 attempt `21adfeff-5560-4180-a37b-f4ba8619c9bc` 修正运维边界的主体位置和 A4 的 ambiguity 分类；没有新增原始需求。
- 独立审查事实：复审 verdict=`pass`，3 个异源 provider 完成，2 条 minor 已修正；provider 的 `SESSION_PATH_UNAVAILABLE` 仅是公开诊断，不影响结果真实性。
- V4：根据当前快照复审 attempt `b54cb730-598f-4a28-907f-0f30b64d63b4` 补齐严重 finding 的 repair-or-risk 处置和 INC-001~INC-009 事故交接映射；没有新增原始需求。
- V5：根据当前快照复审 attempt `684fe96a-8570-47e8-8053-04651df5d69b` 补齐 D11 最低字段、R3 研究 receipt、verify-code 证据语义和 AC-017；没有新增原始需求。
- V6：本轮用户确认 D15-D16 后，补齐公开审查协议失败、逐条 finding 处置和旧材料重审的 FR/AC；没有新增原始需求。
- V7：build-spec 真实审查发现 v2 map 的公开契约与运行时校验不一致；依据 D17 补齐 FR-018/AC-021、输入/风险边界和 A6；没有新增业务需求。
- V8：本轮独立审查发现 FR-008/AC-003 仍写 R1-R14、FR-012/AC-014 仍写 INC-001~009，且 A6 未归类；按逐条处置修正为 R1-R16、INC-001~013，并将 A6 归为 D17 解决的已处理歧义；没有新增业务需求。
- V9：本轮独立复审发现四项 minor 追溯问题：D15 四种错误码需在 AC-018 明列、影响材料需同步 V8、A2 应标为 deferred、AC-013 不重复承载 R3；已逐项修正，没有新增业务需求。
- V10：用户确认 R17-R18 后，依据 D18-D19 增加 FR-019/FR-020、AC-022/AC-023，并同步前三阶段非门禁语义、已有 pass 后增量审查、流程边界、风险和接口事实；没有新增业务需求。
- V14：根据 D43 修正完成判据：结构映射、任务完成行、聚合测试和 ref/hash 不能替代逐条语义证据；根据 D44/R19 增加 FR-021/AC-024，定义同 task 四材料一次性 scope-revision 专用审查；这是当前任务新增的流程需求，不是业务页面需求。
- V11：真实增量审查发现 runner 把 `review_delta` 压成单行且未显式列出 direct impacts；依据 D19 补充 provider 可读分段、维度到直接影响映射和早期阶段空 evidence 说明；没有新增原始需求。
- V12（历史基线）：修复后增量审查发现 D9 事故枚举、FR-008 的 D18/D19 追溯、decision/spec 版本头和 D1/D11 确认状态仍有陈旧文本；逐条修正为 INC-001~015、完整 D/R 关系和 accepted；没有新增原始需求。
- V13（当前修订）：同步 D20-D29 的既有范围实现/证据收口，并把当前 verify-code candidate、逐项 AC 证据和未决质量事实交给 verify-code 回放；没有新增业务需求。
- 影响材料：上一轮遗留的 `plan.md`、`tasks.md` 仍可读，但不能自动代表本轮 handoff；当前 plan/tasks 已同步 D15-D29 和本 spec 当前 V13。
- V15（当前 scope revision）：根据 Git 历史和 AgentHub apply/testing 对照增加 FR-022~FR-024、AC-025~AC-027；恢复 spec/plan/tasks 内容合同、build-code apply 质量顺序和分层测试留痕；没有新增业务页面需求，不恢复 AgentHub 门禁。
- V17（当前 scope revision）：根据 D48 和真实 packet 试验，把 scope_revision provider 输入收敛为 source hash/size 加受影响 bounded excerpt，并加入 24 KiB/摘录与 330 KiB/packet 限制；没有新增业务页面需求。
- V19（当前 scope revision）：根据 D49/R23 把测试路由、blueprint 和适用测试方法前移到 build-plan，要求每个 Task/Phase/final strategy 写入 tasks.md；build-code 只执行策略并留痕，不在每个 Phase 重做测试设计；没有新增业务页面需求。
- V21（当前 scope revision）：根据 D51-D56 把恢复后的高质量内容合同与当前扩展分开，补齐 decision-log → spec → plan → tasks 的来源映射、前三阶段/后两阶段进度、精确执行路径和旧任务卡回填要求；没有新增业务页面需求，历史证据缺口继续保持 unknown/incomplete。
- 本阶段交接要求：完成澄清、Constitution 对照、针对 D18-D19 的增量独立 review、finding 逐条处置和大白话摘要后，取得用户看过记录再进入 `build-plan`。
