# Decision Log

## 当前状态

- Task：`workflowhub-delivery-flow-quality-v1`
- Stage：`make-decision`
- 状态：Talk、调研、direction advice、Grill、decision draft、detail advice、finding 处置、宪法检查和原始需求完整性审计均已完成；用户已最终确认，准备正式交接到 `build-spec`
- 原则：只维护当前四份材料，不新增需求台账、推进许可证、质量 gate 或平行状态机

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 | 基于归档需求、三个历史任务和本轮全部讨论，系统性改进 WorkflowHub 的完整交付流程。 | 当前会话及 `specs/archive/wh-review-execution-flow-improvement/` | OPEN；本任务总目标 |
| R-002 | 保证需求不遗漏，且不能只在 verify 或阶段末尾发现后返工。 | 用户指出“只靠 verify 最终覆盖卡，会导致严重返工” | OPEN；需形成逐阶段传递链 |
| R-003 | 保证高质量交付，不能只靠最后检查 AC、测试和 review。 | 用户指出需求必须从前面考虑清楚 | OPEN；需在各 stage 内提前形成 |
| R-004 | 保证流程步骤不遗漏；所有 stage 都要轻量防止 step 静默丢失。 | 用户补充“所有 stage 都要” | OPEN；需决定最小事实边界 |
| R-005 | 减少问题和阻塞；provider 可以有真实超时，但超时、死亡或坏输出不能让重要 review step 被跳过、伪装完成或改写成质量通过，必须保留失败并走明确恢复/替代路径。 | 用户对旧方案的纠正 | current constraint |
| R-006 | 减少时间和 token，必须针对具体 step/skill 的浪费处理，不能只设预算、停止条件或少跑一次。 | 用户对旧方案的纠正 | current constraint |
| R-007 | make-decision 增加需求准备检查：页面/UI、依赖、材料、权限、外部接口等必须在进入后续阶段前准备或作出明确决定。 | 用户列举 UI、依赖和不明确需求 | OPEN；make-decision owner |
| R-008 | 有页面修改时，设计稿、截图或可确认方案必须准备并由用户定稿；没有现成材料时允许 Agent 先设计。 | 用户页面准备示例 | OPEN；适用时执行 |
| R-009 | 前置依赖不足时，要在 make-decision 决定补依赖、调整方案或真实延期，不能让后续阶段瞎猜。 | 用户依赖示例 | OPEN；适用时执行 |
| R-010 | 所有方向性不明确内容必须在 Talk/Grill 完全弄清楚，不能转移给 build-spec。 | 用户明确要求 | current constraint |
| R-011 | Talk、Grill、Clarify 采用 frontier 批次：一次问一组互不依赖的问题，大白话、编号、推荐项、后果和风险；用户可只回编号。 | 用户引用最新版 `grill-me/grilling` | OPEN；需统一三技能协议 |
| R-012 | 每个 stage 结束调用一致性分析：以原始需求、decision-log、直接上游产物和当前产物为输入，检查全部覆盖、一致性、遗漏和范围漂移。 | 用户要求五阶段完整一致性检查 | OPEN；需设计 stage profile |
| R-013 | build-plan 必须以 spec 为原材料；build-code 必须以 plan/tasks 为原材料；verify-code 必须以代码、测试和实现事实为原材料。 | 用户明确补充完整检查链 | current constraint |
| R-014 | 一致性分析发现问题后，由发现问题的当前 stage 负责闭环：事实漏写调用对应材料既有 writer，新产品选择当场询问用户；不进入移交等待。没有问题时输出固定的大白话阶段摘要。 | 用户要求及 Talk 回复“3”“1” | D-002/D-003；已确认 |
| R-015 | 改造并复用现有 `spec-analyze`，内部使用五个窄 stage profile，并复用现有 `requirement-lineage`；不能创建第五份材料或第二套追踪系统。 | 用户 Talk Round 1 回复“1” | D-001；已确认 |
| R-016 | 修复当前 build-plan 已声明 final spec-analyze、但运行时实际未调用且测试反向禁止调用的矛盾。 | 当前仓库核实事实 | verified gap |
| R-017 | 所有 review 只获取建议事实，不要求 provider pass；只有取得当前可信异源审查且无重要 finding 时，才能宣称该 review 的异源质量闭合。provider 故障按 R-074/R-077/R-085～R-086 恢复；同源 fallback 或风险接受不冒充异源质量完成，也不冻结当前 task 内修复。 | 归档需求 R-022、用户 wh-review 恢复要求和后续讨论 | inherited current constraint；已消除“失败即停”歧义 |
| R-018 | 改造不能显著增加 WorkflowHub 复杂度和维护难度，必须符合宪法的四材料、事实非许可证、谨慎新增 gate、真实收益高于维护成本。 | 用户对旧方案的核心质疑 | current constraint |
| R-019 | 在一个 task 中按 phase 实施，顺序要减少交叉返工，并提供跨 stage 回归与时间/token 对比证据。 | 用户要求重新考虑实施顺序 | OPEN；build-plan owner |
| R-020 | 新任务必须从 make-decision 开始，不跳阶段，不依赖 build-spec 补需求；decision-log 记录原始需求、关键事实、选择、理由和延期交接。 | 用户当前请求 | current process constraint |
| R-021 | 原始需求使用稳定 source ID，后续 decision、FR、AC、plan、task、实现和验证都能回指，不靠数量汇总冒充覆盖。 | 全部讨论和历史任务根因分析 | current constraint |
| R-022 | 每个声明 step 必须留下轻量实际结果，可区分 completed、skipped、incomplete、unavailable；跳过必须有真实理由。 | 用户要求所有 stage 防 step 静默丢失 | OPEN；需复用现有 facts |
| R-023 | stage 结束时对照 step manifest，识别缺失、重复、乱序、旧结果和依赖未完成；最终 aggregate 不能覆盖中间缺步。 | 用户对“只做最终反查”的纠正 | OPEN；需定义最小检查 |
| R-024 | Analyzer 只读取冻结的当前 packet；缺失输入报告 material_incomplete，不扫描历史材料或猜答案。 | 现有 spec-analyze 边界及本轮方案 | current constraint |
| R-025 | Analyzer 的公共部分只检查需求 lineage、上下游一致性和 handoff；每个 stage 的专业质量仍由原 stage skill、测试和 review 负责。 | 复杂度控制方案 | OPEN；待 Talk 确认 |
| R-026 | 阶段摘要至少说明当前阶段、完成内容、需求覆盖、链路一致性、剩余风险、下一阶段可以做什么和不能猜什么。 | 用户要求设计摘要格式 | current constraint |
| R-027 | 时间/token 优化针对串行逐题、重复读全文、重复 review、无变化重跑、后期补需求和上下游返工，并用同样例前后比较。 | 用户要求针对性设计 | current constraint |
| R-028 | 每项新增生产机制必须说明唯一 owner、consumer、替代关系、测试和删除条件；不得只为机器可检查而长期扩张 runtime。 | `CONSTITUTION.md` 与 AGENTS 治理边界 | current constraint |
| R-029 | 新 task 必须由标准 bootstrap 登记，并由 make-decision 唯一启动入口准备隔离 worktree；其他 stage、review 和调用方不得各自创建或猜 workspace。 | 归档需求 R-004～R-005；三个任务执行问题 | baseline requirement；需回归保护 |
| R-030 | target main 即使 dirty 也能安全开始：只读记录 HEAD、tracked/staged/untracked 和有限原因建议；dirty 不进入 candidate，不自动 stash/commit/delete；清理必须先展示路径和风险并取得授权。 | 归档需求 R-004、R-013、R-014 | baseline requirement；需回归保护 |
| R-031 | make-decision 顺序必须真实执行：Talk 1 → 必要调研 → Talk 2 → direction advice → Talk 3 → Grill → decision draft → detail advice → 用户确认 → publish；Grill 不是 review。 | 归档 R-006、R-012 与 D-005/D-013 | baseline requirement；需纳入 step 防丢 |
| R-032 | Clarify 只能由 build-spec 的 `spec-clarify` 拥有；make-decision 负责 Talk/Grill 和方向，build-spec 不得借 Clarify 重新决定产品方向。 | 归档 R-007、R-011 | baseline requirement；批量协议需更新 |
| R-033 | Talk、Grill、Clarify 都必须有真实 `ask → waiting → reply → resume → re-rank` 契约；错 card/round/reply 不得推进，不能只靠技能文档自报。 | 归档 R-008、D-007/D-011 | baseline requirement；当前仍有运行接线缺口 |
| R-034 | build-spec 在规格事实不足时拥有条件调研；先读取已实现能力和当前事实，再决定 executed/skipped/unavailable；复用现有材料/facts，不新建研究库或完成 gate。 | 归档 R-009、R-011、D-008；PaperBuilder 任务反馈 | baseline requirement；需验证真实 consumer |
| R-035 | build-code 每个 phase 做与风险相称的实现、聚焦测试和当前变更审查；全部 phase 后只跑一次最终真实测试、逐 AC trace 和 final integration review。 | 归档 R-009/D-008；用户对三个任务的要求 | current requirement；避免重复全量验证 |
| R-036 | wh-review 每次只冻结当前 stage 所需的最小、干净、path-safe packet：方向、细节、phase diff 或 final implementation 各用自己的材料和提示/合同。 | 归档 R-015、D-009 | baseline requirement；需防 packet 过大或缺关键实现 |
| R-037 | provider 的 PROCESS_DEAD、SIGTERM、无最终文本、路径错误、timeout、坏 JSON、transport failure、SAME_SOURCE 和 route/profile mismatch 必须保留真实终态；不得伪造 `findings=[]`、pass、fallback 或当前完成。WorkflowHub 不另加第二套 provider timeout/lifecycle。 | 归档 R-016～R-017、D-009；三个任务的长等待与失败 | baseline requirement；需回归保护 |
| R-038 | 非 build-code advice 绑定被审材料和 provenance；仅 confirmation、receipt、decision-log 等记录性变化不得触发自动重审。只有真实主题变化或重要 finding 修复后才允许 focused review。 | 归档 R-019、D-015/D-018；M15 用户要求停止重复审查 | current requirement |
| R-039 | 所有 stage 的 review 都只提供建议事实，不要求 provider pass；build-code 的异源质量闭合要求当前可信审查无可行动 major/blocking finding。无变化或重复 finding 不机械重审；无可信终态时先执行通用 wh-review 三次恢复和同源降级，之后停止的只是无意义 provider 循环，不删除 review step、不停止当前 task 修复，并如实报告质量 incomplete。 | 归档 R-018、R-022、D-014/D-018 及用户 wh-review 恢复要求 | current requirement |
| R-040 | make-decision 每完成一个真实 step 都更新同一份 `decision-log.md`，记录新增需求或 no-new-requirement、用户回答、事实、选择、风险、非目标、未决和延期；最终再做完整来源回放。 | 归档 R-020、D-016 | baseline requirement；当前正式 handler 尚未完整接线 |
| R-041 | 任何 stage 不得把验证、校准、研究、UI、统计或治理扩张成原始目标未要求的大工程；发现新能力候选先做范围和 ROI 判断，未经确认不得进入当前 plan/code。 | ModelTest 的 72 次校准质疑、PaperBuilder 高级能力范围讨论、用户对旧方案复杂度质疑 | current requirement |
| R-042 | 每个任务在 make-decision 明确“最小充分成功证据”和客观停止条件；达到用户目标后停止继续批次/策略/窗口探索，不能机械跑到固定次数。 | PaperBuilder “不用等到第50批”和“不再尝试10个策略” | current requirement |
| R-043 | Talk 前先核实现有实现、当前能力、依赖、worktree、运行服务和缺口；Agent 能查到的事实不让用户回答，避免基于过期假设反复决策。 | PaperBuilder 用户要求先检查已实现能力和 worktree；多个任务反复纠正事实 | current requirement |
| R-044 | UI/页面需求必须在 make-decision 准备可确认设计输入并冻结关键布局、信息层级、语言、视觉和交互边界；未准备好时先由用户提供或 Agent 设计确认，不能边 build-code 边反复重做。 | M15 多轮页面返工、后续 Figma 才定稿；用户本轮明确要求 | current requirement |
| R-045 | WorkflowHub 的执行观察必须能按 task → stage → step/skill 显示名称、状态、实际结果、耗时、token、证据、遗漏和退化；面向用户使用可读中文/大白话，不堆内部 ID、英文标签和长路径。 | M15 页面反馈及最初“每个 stage 标准流程/步骤/产物”要求 | current requirement；复用现有 monitoring 数据 |
| R-046 | 测试、AC、review 和证据应在 spec/plan 阶段设计到对应需求和风险；build-code 执行聚焦验证，verify-code 只重放风险和最终全链，不得用最后补测试/AC 制造高质量假象。 | 用户对旧“缺 AC/测试/review 不能完成”方案的否定 | current requirement |
| R-047 | verify-code 必须反向检查原始需求、Design/decision/spec、完整用户流程、实际代码和证据；缺证据保持 unknown/incomplete，测试绿或 close 不能改写为业务通过。 | ModelTest 用户明确要求；三个任务最终状态问题 | current requirement |
| R-048 | 正式 close 与质量结论分开，但一旦用户明确授权正式或带风险 close，就必须真实执行计划内 commit、archive、merge、push、cleanup 并读回物理结果；不能只写 close 文档或停在授权前后。 | M15 多次追问 manual-close 的真实作用 | current requirement；不可逆动作仍分别授权 |
| R-049 | 用户已确认可自动推进后，阶段内部和后续已授权安全步骤应继续执行；只在新的产品选择、真实强阻塞、风险接受或不可逆授权时暂停，不为流程记录反复打断用户。 | ModelTest/PaperBuilder 用户要求除强阻塞外自动推进 | current requirement |
| R-050 | 时间/token 证据必须按 stage、step、skill、provider wait、测试、review、返工和用户等待拆分；用来删除真实浪费，不设置统一 token 预算、固定超时或机械停止 gate。 | 三任务分析问题 6；用户对预算/停止条件方案的否定 | current requirement |
| R-051 | 对相同未变化材料不得重复全文读取、全量测试、review 或 analyzer；实际材料/风险变化后只重跑受影响检查，最终 aggregate 按 plan 执行一次。 | M15“不要再一直全量测试”、review snapshot 重跑问题 | current requirement |
| R-052 | 任务完成必须同时区分需求实现、质量验收、Git 交付和正式 close；任一层未完成都不能被另一层的绿色事实覆盖。 | 三个任务的 complete/incomplete/close 争议 | current requirement |
| R-053 | 本任务必须交付一份五阶段标准流程规范，逐 stage 写清标准输入、内部步骤、每步结果、阶段产物、完成/失败边界和下游交接，不能只交付局部 analyzer 改造。 | 用户最初请求 | primary deliverable |
| R-054 | 标准规范必须同时以归档改造需求、当前五个 workflow、实际使用 skills 和 runtime 真实调用链为事实来源，文档声明与真实 handler 不一致时以缺口记录并修复。 | 用户最初请求及仓库审计 | primary deliverable |
| R-055 | 对 ModelTest US-04、PaperBuilder 智能迭代补充、WorkflowHub M15 分别逐 stage 对照标准流程，保存遗漏步骤、阻塞、交付质量、review 质量、原始需求最终覆盖和证据可信度，不用汇总结论替代逐任务事实。 | 用户七项审计问题 | primary evidence requirement |
| R-056 | 对三个任务的问题形成共同根因，并要求每项改造回指真实故障；不能把症状检查器当成根因方案。 | 用户要求重新调研和设计 | current requirement |
| R-057 | 除 stage-end 一致性检查外，每个 stage 内部都要在最便宜、最早的责任点主动形成质量，避免需求、设计、AC、计划、实现和证据到后面才补。 | 用户否定“最终检查和补救” | current requirement |
| R-058 | make-decision 的准备检查必须覆盖用户/角色、完整旅程、页面入口、数据来源与状态、成功/失败/取消/重试/恢复、权限安全、依赖兼容、迁移回滚、可观测性、验收环境、非目标和延期；不适用项明确 N/A。 | 用户要求先梳理完整范围及“等等其他” | current requirement |
| R-059 | 前置依赖不足且存在小型 enabling change 时，可在 make-decision 当前阶段明确范围并先补齐后继续；若会改变产品范围或产生不可逆影响，必须先取得用户决定。 | 用户前置依赖示例 | current requirement |
| R-060 | 批量 Talk/Grill/Clarify 每题只含一个决策轴、2～3 个有效选项；一批只问互不依赖且 Agent 无法自行查明的问题；保留部分回答，收到回复后重排 frontier。 | 用户降低交互成本要求及 grilling 合同 | current requirement |
| R-061 | 过程成本审计必须形成 step/skill 调用清单、材料重复读取、交互轮数、provider 等待、测试/review 重跑、返工和用户等待的真实分布，并区分合理成本与浪费。 | 用户问题 6 和再次纠正 | primary evidence requirement |
| R-062 | 最终评估必须分别回答：开发过程是否合理、每条原始需求是否真实实现、产品是否可用、交付质量是否足够、review 是否可信；不能以流程完成代替产品完成。 | 用户问题 7 | primary deliverable |
| R-063 | 新方案不得默认增加硬 gate、预算、停止条件、契约链或完成许可证；任何新增机制都必须证明能预防一个真实故障，并比复用现有能力更简单。 | 用户对第一版方案的否定 | constitutional constraint |
| R-064 | 本轮全部历史调研、被否定方案、最终选择和替代关系必须完成来源回放后才可恢复 Talk；不得再用概括性总目标代替逐项继承。 | 用户最新质疑 | current make-decision constraint |
| R-065 | 上游材料就地修复后，只重新生成受影响的下游片段并使受影响证据失效；未变化材料、review 和测试继续复用，禁止机械全链重跑。 | 用户减少返工/token 目标及历史根因 | current requirement |
| R-066 | 每类需求必须预先定义真实用户结果验证：页面走真实页面流程，CLI 跑真实命令，服务验真实接口及失败路径；单元测试绿色不能替代用户结果。 | 用户要求高质量真实交付 | current requirement |
| R-067 | stage 机制必须保持“steps/skill 声明 → handler 真实执行 → facts 写入 → status/monitoring 消费 → contract test 证明”一致；只写文档或存在文件不算执行。 | build-plan analyzer 冲突及三任务根因 | current requirement |
| R-068 | 一致性覆盖状态至少区分 covered、partial、missing、changed、expanded、stale、not_applicable、unavailable、deferred，不能把未知、延期或不适用合并成没问题。 | 三任务证据语义及用户质量目标 | current requirement |
| R-069 | 历史中途需求修订能力的调查与最初恢复解释。 | 用户最初追加需求及回复“3、1、1、1” | superseded：用户随后澄清目标不是 A 内材料 revision，而是 mini-task；仅保留调查事实 |
| R-070 | 最初轻量同-task revision 的宪法边界。 | D-006～D-008、宪法及 direction advice | superseded by R-072～R-081；禁止旧状态机的边界继续保留 |
| R-071 | 每阶段的一致性检查默认复用 requirement-lineage、material hash 和现有 facts 做增量引用/差异比对；只有缺安全基线或影响面无法确定时才读取完整当前材料，不机械重读历史或全链重跑。 | R-051/R-065 及 direction advice | confirmed boundary |
| R-072 | `mini-task` 不是修改 A 当前记录的需求：当 A 在 make-decision 或后续任一 stage 因其他需求依赖、缺失能力或必要修复无法继续时，先完成这个前置功能交付，再继续 A。 | 用户对 Grill G-001 的纠正及正式更名 | D-009；已确认 |
| R-073 | 每个 mini-task 是完整功能交付：方案完成后做一次独立方案审查，实施完成后再做一次独立实施审查；满足收口条件后提交并合并；在 `/Users/Hugh/.config/workflowhub/config.json` 增加两个专用审查配置。 | 用户对 Grill G-002 的纠正及回复 | D-009/D-013；已确认 |
| R-074 | wh-review 遇到 provider unavailable 时应先临时恢复并尽量按 WorkflowHub 配置完成异源审查；尝试 3 次仍失败时，使用当前 provider 的独立子代理审查，并如实区分异源审查与同源替代审查。 | 用户对 Grill G-003 的纠正 | current requirement；需修改当前 no-retry/no-fallback 合同 |
| R-075 | `mini-task` 是独立精简功能交付流程：既可由五阶段任一处在 A 被依赖阻塞时触发，也可由用户直接用于边界清楚的小功能；不运行完整五阶段。 | 用户回复 G-004=`2` 及正式更名说明 | D-009；已确认 |
| R-076 | `/Users/Hugh/.config/workflowhub/config.json` 的 `wh_review` 下增加 `mini_task.design` 与 `mini_task.implementation` 两个专用审查配置，复用现有 profiles 和 public review 入口；不把 mini-task 伪装成第六 stage。 | 用户明确要求及配置审计 | D-013；已确认 |
| R-077 | 通用 wh-review provider 恢复只在 route/auth/provider unavailable 时计入最多三次正式异源尝试；每次保存不可变 attempt，真实 finding 不算失败重试。三次均失败后调用当前 provider 独立子代理并标记 same-source fallback，不覆盖前三次 unavailable；缺异源结论时不能伪装为异源完成。五阶段与 mini-task 复用同一恢复能力。 | 用户明确说“如果进行 wh-review 时”及 G-006=`1` | D-011；已确认 |
| R-078 | mini-task 合并到目标分支后，A 通过正常 merge 吸收目标分支，不 reset/rebase/rebind/recreate；只让受影响测试、review 和证据失效，随后从原 stage 继续。 | 宪法/Git 审计及 G-005=`1` | D-010；已确认 |
| R-079 | mini-task 创建时可对明确计划内的 commit、merge、push、archive、cleanup 做一次绑定具体范围的预授权；最终仍绑定真实 snapshot 并读回结果，超范围或对象变化重新询问。 | 用户回复 G-007=`1` | D-012；已确认 |
| R-080 | `mini_task.design` 直接承担方案审查，`mini_task.implementation` 直接承担最终实施审查，不再重复调用同范围普通 plan/code review。 | 用户回复 G-008=`1` | D-013；已确认 |
| R-081 | A 存在未提交进度时，先取得明确授权并创建真实 A 进度 commit；mini-task 合并后把目标分支正常 merge 进 A，再执行受影响验证并从原 stage 继续。 | 用户回复 G-005=`1` | D-010；已确认 |
| R-082 | mini-task 默认适用于需求边界清楚、单一结果、影响面有限、无需重大架构/迁移/权限/安全决定的小功能；用户明确指定时也可使用，即使超出默认判断，但 Agent 必须披露额外风险且不改变不可逆授权和质量真实性边界。 | 用户回复 G-009=`1` 的补充 | D-014；已确认 |
| R-083 | mini-task 紧凑复用 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md` 四份材料，由精简流程一次形成，不新增 `mini-task.md` 或第五份当前真相，也不运行完整五阶段。 | 用户回复 G-010=`1` | D-015；已确认 |
| R-084 | mini-task 执行中发现实际范围明显膨胀时暂停实施，由用户选择缩小 mini-task 或创建普通五阶段任务；已确认事实和材料可复用，但不得自动转换、rebind、continuation 或静默扩张。 | 用户回复 G-011=`1` | D-016；已确认 |
| R-085 | 通用 wh-review 的三次异源尝试是同一当前 snapshot 上三个新的公开 review 请求，各自保存 attempt；不是复用 provider session、broker continuation 或隐藏 retry。仅 provider/route/auth unavailable 进入下一次，真实 finding 必须在当前 stage/mini-task 修复而不是重试。 | 用户 wh-review 原话及 focused direction advice F-470caa85597d | confirmed operational boundary |
| R-086 | 若只能取得 same-source fallback，任何依赖该 review 宣称质量完成或执行后续带风险交付前，都必须披露三次 unavailable、fallback 来源和未覆盖风险，并绑定当前 snapshot 的明确风险接受；普通阶段确认或 Git 预授权不能代替质量风险接受，质量状态继续保持 incomplete。 | 用户 wh-review 原话、focused direction advice F-ba035f674104、D-011 | confirmed quality boundary |
| R-087 | mini-task 的紧凑四材料最低标准：decision-log 保留原始来源、事实/约束、选择理由、影响、风险、否决方案、未决和 supersedes；spec 保留用户结果/状态/失败/AC/非目标；plan 保留方案、依赖、影响面、测试/review/Git/回退；tasks 保留可执行步骤、oracle 和证据。N/A 必须给理由。 | focused direction advice F-99ab2ac8d3ec | confirmed material contract |
| R-088 | mini-task implementation review 必须消费确认后的四材料、当前 diff/snapshot、受影响测试命令与 oracle、实际结果、跳过理由、coverage limits、AC trace 和剩余风险；测试由当前 mini-task Agent 执行，失败或 unavailable 如实保留并在当前 mini-task 修复。 | focused direction advice F-dff74dcd11d4 | confirmed evidence contract |
| R-089 | mini-task 合并后“A 从原 stage 继续”只是以 A 当前 worktree/HEAD 重新调用同一个普通 stage，并重新核验受影响事实；不恢复 provider session、review continuation、checkpoint、rebind 或 recovery 对象。 | focused direction advice F-b4f1ec80967b | confirmed runtime boundary |
| R-090 | 每个声明 step 的最小 outcome 至少包含 step_id、status（completed/skipped/incomplete/unavailable）、输入引用、实际结果摘要、证据引用；skipped 必须有理由，失败/未知必须有原始原因；耗时/token 可得则记录，不可得保持 unavailable。 | detail advice F-705622561add | confirmed step contract |
| R-091 | 五阶段 spec-analyze 的验收必须证明公共核心只检查 requirement lineage、累积材料一致性和 handoff，不替代 stage 专业质量；finding 的闭环事实必须记录发现 stage、受影响 source/artifact、合法 writer 或用户决定、修复结果和复检结果，且没有移交等待状态。 | detail advice F-949c2cc5a9ab、D-001～D-003 | confirmed acceptance boundary |
| R-092 | 通用 wh-review 异源失败计数以“本次公开 review 没有任何有效异源语义结果”为准，包括 provider/transport/auth/timeout/output/protocol/profile/unknown 失败或仅 SAME_SOURCE；MATERIAL_INCOMPLETE/安全拒绝必须先修材料且不计次数，真实 findings 进入当前 stage 修复且不计失败重试。 | 用户 wh-review 原话及 detail advice F-74a8d177eae6 | confirmed attempt taxonomy |
| R-093 | 每个 mini-task 使用独立 task ID、隔离 worktree 和 branch，以支持独立测试、审查、commit 和 merge；由 A 触发时，A 只在现有材料/facts 记录阻塞原因、mini-task ID、所需结果和最终 merge commit，不创建 predecessor/successor runtime 关系对象。 | mini-task 独立交付要求及 detail advice F-e5d149e93cc6 | confirmed container boundary |
| R-094 | 最终验收必须额外证明：交付五阶段标准流程规范（输入、步骤/outcome、产物、完成/失败边界、下游交接）；monitoring 按 task→stage→step/skill 显示结果、耗时、token、证据、遗漏和退化；需求实现/质量/Git/close 四层分离；每项新增机制都有 owner、consumer、替代对象、测试和删除/保留条件。 | detail advice F-6747936e2071；R-028/R-045/R-052～R-054 | confirmed acceptance coverage |
| R-095 | mini-task 作为完整功能交付，也必须执行与类型相称的真实用户结果验证：页面走真实页面，CLI 跑真实命令，服务验真实接口和失败路径；implementation review 必须消费该结果，测试绿不能替代。 | R-066、用户“完整功能交付”及完整性审计 | derived requirement；已随最终整体确认接受 |
| R-096 | 原始需求完整性不能用 R 编号连续代替；必须保存当前会话需求组到 R/D 的来源回放、三个历史 thread ID、七项审计的实际裁决、已有 duration 和不可得 token 的真实边界。 | 用户要求确认“是否记录了全部调研、方案、细节”及本次完整性检查 | current make-decision requirement |
| R-097 | 当前 `spec-analyze` 仍是 build-plan-only packet lens，无法在 make-decision 只凭 decision-log 合法运行；本次采用等价的冻结来源回放并记录限制。实现必须增加五个窄 profile 后，才可宣称每 stage 实际调用。 | 当前 skill 实读与本次审计 | verified gap；不得伪装已调用 |

## 归档原始需求继承映射

归档 `wh-review-execution-flow-improvement` 是本任务的基线来源，不是下游需要自行翻阅的第二份需求真相。下面逐条把旧 R 映射进当前需求；未列出的旧需求不得被视为自动删除。

| 归档 source | 当前承接 | 状态/变化 |
| --- | --- | --- |
| old R-001 | R-001、R-020 | 继续有效：新 task、从 make-decision 开始、不让 build-spec 补需求 |
| old R-002 | R-007～R-010、R-044 | 扩展：增加 UI/依赖/材料准备检查 |
| old R-003 | R-011、R-020 | 扩展：三类交互统一 frontier 批次 |
| old R-004 | R-030 | 继续有效：dirty 只读、不阻止、不自动处理 |
| old R-005 | R-029 | 继续有效：make-decision 唯一准备 worktree |
| old R-006 | R-031 | 继续有效：两次 advice 顺序，Grill 非 review |
| old R-007 | R-032 | 继续有效：Clarify 只归 build-spec |
| old R-008 | R-011、R-033 | 扩展：真实交互 seam + 批量独立问题/部分回答 |
| old R-009 | R-034、R-035 | 继续有效：build-spec 条件调研、build-code final integration |
| old R-010 | R-018、R-028 | 继续有效：宪法、无新维护对象/gate |
| old R-011 | R-034 | 继续有效：条件调研复用现有事实和材料 |
| old R-012 | R-031、R-033 | 继续有效：交互/review 顺序必须由真实事实校验 |
| old R-013 | R-030 | 继续有效：dirty 不带入 candidate，给原因和建议 |
| old R-014 | R-030、R-048 | 继续有效：清理需建议、风险和真实授权 |
| old R-015 | R-036 | 继续有效：最小、当前、阶段特有 review packet |
| old R-016 | R-037 | 继续有效：provider 失败不能冒充业务结论 |
| old R-017 | R-037、R-038、R-052 | 继续有效：旧事实、测试绿和 close 不能冒充当前质量 |
| old R-018 | R-039 | 被 old R-022/D-018 修正：所有 stage 都不要求 provider pass |
| old R-019 | R-038、R-051 | 继续有效：记录性变化不触发 advice 重审 |
| old R-020 | R-040 | 继续有效：make-decision 每 step 连续更新同一 decision-log |
| old R-021 | R-012～R-016、R-024～R-026 | 扩展：从 build-plan 最终检查扩到五个 stage 窄 profile |
| old R-022 | R-039 | 继续有效：build-code 以无可信重要 finding 收口，不追 provider pass |

## 归档决定继承与 supersede

| 归档决定 | 当前处理 |
| --- | --- |
| old D-001 | 继续有效：修复正式生产路径，不以旁路掩盖问题 |
| old D-002 | 继续有效：用户可见状态必须来自真实事实 |
| old D-003 | 继续有效：make-decision 正式入口是唯一 workspace 创建者 |
| old D-004 | 继续有效：dirty main 只读诊断且不能污染 candidate |
| old D-005 | 继续有效，并由 R-011 扩展三类交互的批量 frontier；review 顺序不变 |
| old D-006 | 继续有效：Clarify 唯一属于 build-spec |
| old D-007 | 继续有效：交互必须真实 ask/wait/reply/resume |
| old D-008 | 继续有效：build-spec 条件调研和 build-code final integration |
| old D-009 | 继续有效：最小可信 review packet、路径适配、provenance 和失败终态 |
| old D-010 | 继续有效：不新增平行控制面或第二生命周期 |
| old D-011 | 继续有效：三类交互 contract test；增加部分回答和 frontier 重排 |
| old D-012 | Grill 批量部分继续有效；“Talk 不批量”被当前 R-011/D-001 supersede；Clarify 同步升级为批量独立问题 |
| old D-013 | 继续有效：步骤顺序必须用当前事实证明，不能只看 ref 存在 |
| old D-014 | advice-only 部分继续有效；“build-code 需要 provider pass”被 old D-018/R-039 supersede |
| old D-015 | 继续有效：advice freshness 与记录性 snapshot 变化解耦 |
| old D-016 | 继续有效：make-decision 每 step 写同一 decision-log，写失败不能自报完成 |
| old D-017 | 继续有效并扩展：build-plan final analyzer 保留精确时点，同时增加五 stage 窄 profile |
| old D-018 | 继续有效：build-code 只收口可信 major/blocking finding，实际变化后 focused review |

## 需求来源分类

- `R-001～R-020、R-029～R-064` 中标为用户请求或历史原话的条目，是直接需求或已确认选择。
- `R-016、R-021、R-024、R-028` 是仓库事实或由宪法推导的实现约束，不冒充用户原话；最终确认时可保留、修改或删除方案细节。
- `R-065～R-084` 中 R-072～R-084 是用户对 mini-task/wh-review 的明确要求或编号选择；其余为这些选择与已确认成本目标的直接边界。
- `R-085～R-094` 是 review/宪法对已确认方向的可执行化约束，不冒充新的用户选择；`R-095` 是“完整功能交付”的真实结果验收推导，等待最终确认；`R-096～R-097` 是本次完整性审计要求和当前仓库事实。
- 三个历史任务的产品需求只是审计证据，不进入本任务产品范围。

## 当前会话原始需求来源回放

以下稳定标签按本 task 当前会话中的用户消息顺序建立；一条消息拆成多个 R 时明确列出，不再用“全部讨论”替代来源。

| source_group | 用户原话主题 | 进入当前材料 | 覆盖结论 |
| --- | --- | --- | --- |
| SRC-01 | 整理五阶段标准流程、步骤和产物 | R-001、R-053～R-054 | covered |
| SRC-02 | 审计三个 task 的七个问题并评估 WorkflowHub | R-045、R-050、R-052、R-055～R-056、R-061～R-062 | covered；实际裁决见下节 |
| SRC-03 | 质疑复杂度、维护成本、宪法和新阻塞 | R-018、R-028、R-063 | covered |
| SRC-04 | 否定 verify/末尾 AC-review/末尾补步骤/provider 停止/简单预算方案 | R-002～R-006、R-017、R-027、R-035～R-039、R-046、R-050～R-051、R-057、R-065 | covered |
| SRC-05 | 所有 stage 防 step 静默丢失；make-decision 检查 UI、依赖、歧义 | R-004、R-007～R-010、R-022～R-023、R-044、R-058～R-059、R-090 | covered |
| SRC-06 | spec-analyze 五阶段累积一致性、当场修复、无问题摘要 | R-012～R-016、R-024～R-026、R-068、R-071、R-091、R-097；D-001～D-004 | covered；当前 skill 限制如实保留 |
| SRC-07 | Talk/Grill/Clarify 批量大白话问题、推荐和风险 | R-011、R-033、R-060 | covered |
| SRC-08 | 一个 task 分 phase 的实施顺序 | R-019、R-035、R-046、实施顺序章节 | covered |
| SRC-09 | 从 make-decision 开始、四材料、完整用户流程和边界 | R-020～R-021、R-040、R-058 | covered |
| SRC-10 | 恢复 scope_revision，随后纠正为独立 mini-task | R-069～R-084、R-093；D-005～D-016 | covered；旧解释明确 superseded |
| SRC-11 | wh-review 三次异源恢复，失败后当前 provider 独立子代理 | R-005、R-037、R-074、R-077、R-085～R-086、R-092；D-011 | covered；适用范围已修正为通用 wh-review |
| SRC-12 | mini-task 两次专用审查、配置、Git 交付、A 恢复、用户可指定 | R-073、R-075～R-084、R-087～R-089、R-093、R-095；D-009～D-016 | covered；R-095 待最终确认 |

省略接受：没有把用户否定方案当作当前方案；它们保留在“已明确拒绝的方案”。没有把三个历史 task 的产品需求并入本 task 产品范围，只把它们作为流程故障和验收证据。除 thread API 未提供的精确 token 外，没有已知原始需求被静默省略。

## 五阶段标准流程基线（待本轮方向确认）

### make-decision

- 输入：原始需求、当前仓库/运行事实、历史相关材料、依赖与设计材料。
- 主步骤：隔离 workspace → 事实盘点和需求准备检查 → Talk 1 → 必要调研 → Talk 2 → direction advice → Talk 3 → Grill → decision draft → detail advice 与 finding 处置 → 用户确认 → publish/handoff。
- 阶段内质量形成：在提问前查清 Agent 可查事实；冻结用户流程、页面/设计、数据状态、边界、依赖、成功证据、停止条件、非目标和延期；每个真实 step 更新同一 decision-log。
- 产物：已确认 `decision-log.md`，以及现有 facts/quality 中的真实 interaction、research、review 和 step outcomes。
- 结束检查：原始需求、全部回答、关键事实、选择理由、风险、延期和所有 step 均可回放；有缺口由当前 stage 就地闭环。

### build-spec

- 输入：原始需求索引、已确认 decision-log、现有实现/接口事实和必要设计材料。
- 主步骤：盘点现有能力 → 条件调研（executed/skipped/unavailable）→ 批量 Clarify 规格歧义 → 写用户流程、状态、FR/NFR/AC/边界 → 规格 review 与 finding 处置 → publish。
- 阶段内质量形成：每条需求在写规格时形成可测试行为和失败语义；Clarify 不重开产品方向，方向缺口当场问用户并补回 decision-log。
- 产物：同一份 `spec.md` 与真实 research/review/step facts。
- 结束检查：`原始需求 + decision-log + spec` 全覆盖、一致；缺失输入保持 incomplete，不让 build-plan 猜。

### build-plan

- 输入：原始需求、decision-log、spec、仓库现状、依赖和验证能力。
- 主步骤：实现现状核验 → 架构/变更设计 → phase 与 task 拆分 → 为每个 task 绑定需求、风险、oracle、测试和 review → plan review/finding 处置 → 最终修订 → final analyzer → publish。
- 阶段内质量形成：把 AC、验证 oracle、聚焦测试、review packet、停止条件和可恢复失败设计进任务；不以固定次数替代目标证据。
- 产物：同一份 `plan.md`、`tasks.md` 与 review/analyzer/step facts。
- 结束检查：`原始需求 + decision-log + spec + plan/tasks` 覆盖全部 R/D/FR/AC/DEFER/OPEN，且每个 task 有真实 oracle。

### build-code

- 输入：原始需求、decision-log、spec、plan、tasks、当前代码和阶段 facts。
- 主步骤：按 phase 实现 → 聚焦测试 → 当前 phase 异源 review → finding 就地修复；全部 phase 后执行一次最终真实测试 → AC trace/implementation receipt → final integration review → focused repair → 交付准备。
- 阶段内质量形成：每个 phase 只验证受影响风险；不等待最后才补设计/测试；不因 provider 失败跳过审查事实，也不对未变化材料机械重跑。
- 产物：代码、测试、实现/AC 追踪、当前 review/test/evidence/step facts。
- 结束检查：`原始需求 + decision/spec/plan/tasks + 当前实现和证据` 一致；无可信 review 时如实保留 unavailable，不伪造 pass。

### verify-code

- 输入：前四阶段全部当前材料、代码、测试、review、运行和交付事实。
- 主步骤：反向回放原始需求与完整用户流程 → 风险/回归/真实运行验证 → 独立质量审查 → finding 就地修复和受影响复验 → 区分需求、质量、Git、close 状态 → 在授权后执行真实交付/close。
- 阶段内质量形成：只重放剩余风险和最终全链证据，不充当上游补需求阶段；unknown/unavailable 不改写成通过。
- 产物：`quality/verify.json`、必要 evidence、最终状态摘要及经授权的真实 Git/close 结果。
- 结束检查：`原始需求 + decision + spec + plan/tasks + code/tests/reviews/evidence` 全链可回放；没有任何绿色局部事实覆盖未完成层。

## 方案全集（不是只改 spec-analyze）

1. 需求源头：稳定 requirement/source ID、完整准备矩阵、设计/依赖先决条件、目标证据与停止条件，在 make-decision 形成而非 verify 补救。
2. 交互降耗：Talk/Grill/Clarify 共享批量 frontier 表达和真实暂停恢复，但职责分开；可查事实不问用户。
3. 步骤防丢：五 stage 的声明 step 都写最小 outcome/evidence 到现有 facts，并与 manifest 对照；它与“make-decision 每 step 更新 decision-log”是两条独立机制。
4. 阶段内质量：spec 写行为与 AC，plan 绑定 oracle/test/review，code 分 phase 聚焦验证，verify 只做独立回放；不靠最终硬卡补质量。
5. 阶段间一致性：复用一个 `spec-analyze` 公共核心和五个窄 profile，消费累积材料；发现问题由当前 stage 闭环，无问题输出大白话摘要。
6. 审查可靠性：最小冻结 packet、专属 prompt/contract、完整 provenance、provider 失败真实分类、记录变化不重审、重要 finding 仅在真实修复后 focused review。
7. 成本治理：按 step/skill/provider/test/review/返工采集实际成本，删除串行提问、重复全文读取、未变化重跑和目标外实验；不设统一 token 预算。
8. 可观察与交付：按 task/stage/step/skill 展示真实结果、耗时、token 和证据；需求、质量、Git、close 四层分开，授权后完成真实物理操作。
9. 复杂度边界：复用四材料、facts、quality、manifest、requirement-lineage 和现有七类 public runtime；不新增 ledger、permit、selector、第五材料或第二 provider lifecycle。

## 旧任务已实现/未完成事实的继承

- 旧 P1～P5 的 worktree、交互、review packet、build-spec research、build-code integration 等实现不能假设消失；build-plan 前必须逐项核验“仍存在且正确 / 存在但错误 / 未完成 / 已被新决定替代”，只修改有证据的缺口。
- 旧 final integration provider 超长等待且无最终文本、integration review `missing/unknown`、部分 AC 缺当前证据，均保持历史事实；不得在本任务中补写成完成。
- 本任务的实现计划必须附“旧能力 → 当前代码 consumer → 本次修改 → 回归证据”，避免重复实现或误删。

## 新增/改造机制的职责与删除条件

| 机制 | owner / consumer | 替代什么 | 测试与删除/保留条件 |
| --- | --- | --- | --- |
| 批量 Talk/Grill/Clarify | 对应交互 skill / make-decision、build-spec host | 串行逐题卡 | contract test；宿主原生提供同合同后删除重复适配 |
| step outcome | 各 stage handler / status、monitoring、stage summary | 只看 manifest/aggregate | 缺失乱序测试；若 facts 原生覆盖同字段则删 adapter |
| 五 profile spec-analyze | 各 stage / 当前 stage Agent、quality summary | build-plan-only 声明和人工全文反查 | lineage/缺料/闭环测试；若 stage writer 原生保证同检查则保留单一公共核心或删除重复 profile |
| review 可靠性 | wh-review / 五 stage 与 mini-task | 旧 snapshot、无变化重审、失败伪 pass | packet/provenance/failure tests；3rd-review 公共合同原生覆盖的 lifecycle 逻辑不在 WorkflowHub 重复保留 |
| monitoring 与成本摘要 | runtime facts/projector / 用户和诊断 | 人工翻日志与猜 token | projection/coverage/stale tests；无消费者字段删除，不变成 gate |
| mini-task | mini-task workflow / 直接用户或被阻塞 A | 历史 scope_revision 与为小功能强跑五阶段 | 两次 review、Git/A 恢复 E2E；若实际收益不降低时耗或长期绕过质量，则删除 mini-task 流程，四材料和历史 facts 保留 |

## 建议实施顺序（Talk/Grill 后冻结）

1. 冻结原始需求回放、五阶段标准流程和当前实现 inventory，先建立不遗漏的验收基线。
2. 统一 Talk/Grill/Clarify 的批量 frontier 与真实 ask/wait/reply/resume contract，先减少后续决策和规格交互浪费。
3. 接通现有 step outcomes 与 make-decision 逐 step decision-log writer，先让五阶段执行事实不再静默丢失。
4. 完成 make-decision 准备矩阵及 make-decision/build-spec 的阶段内质量和结束检查。
5. 改造公共 `spec-analyze` 核心与五个窄 profile，并先修复 build-plan“声明调用但实际禁止”的现有矛盾。
6. 接入 build-code/verify-code 的累积一致性、phase/final integration、真实 review failure 和就地修复语义。
7. 接通 monitoring、成本分解、大白话阶段摘要和需求/质量/Git/close 四层状态。
8. 用同一组跨阶段样例做遗漏、乱序、provider failure、UI/依赖准备、原始需求覆盖和时间/token 前后回归，再做宪法检查。

## 已核实关键事实

- 当前真相仍只有 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md`。
- `spec-analyze` 当前是 build-plan 专用、只读、report-only lens；已有覆盖检查实现，但 stage runtime 没有实际调用。
- `requirement-lineage` 已能表达 requirement → decision → artifact → verification，不应新建第二套 lineage。
- `grill-with-docs` 已支持独立 frontier 批次；`talk-with-zhipeng` 和 `spec-clarify` 仍强制一次一问。
- 本任务不涉及最终用户产品页面；“UI 准备检查”是 make-decision 的通用能力，当前可用交互卡和 contract test 验收。
- `scope_revision` 专用实现由 `d8646ee7` 引入，并在 `dde024a7`（`refactor(runtime): restore four-material task flow`）删除；被删除范围包括专用 validator/contract/review kind 和测试。
- 当前 `wh-review` 明确没有 `scope_revision` review kind，CLI 也拒绝 `materials.scope_revision`；当前 public runtime 没有专用 scope revision 命令。
- 当前 `spec-specify` 仍保留“make-decision 授权需求修订后，在同一 task 更新受影响 FR/AC/source binding”的核心语义，因此删除的是旧控制面，不是同 task 修订这个用户能力。
- 旧流程只允许 build-code/verify-code 触发，要求四材料影响分析和一次专用 review；其独立 schema、packet、route、review round 与当前 vNext 简化边界冲突，不适合直接 cherry-pick 恢复。
- 历史 scope_revision 处理“A 自身需求变化”，坚持同 task、只做一次方案/影响审查且不负责代码通过或 Git 交付；用户当前要求的是不同的新能力，不能称为原样找回。
- 当前配置加载器、review fact schema 和 CLI 只认识五个 stage/现有 track；仅向配置文件添加 scope_revision 会失败，必须同步增加轻量配置读取、design/implementation contract、packet 和结果标识。
- 当前一次 wh-review 是一个 broker group request，没有“三次正式异源恢复”编排；同 provider 子代理可提供独立上下文建议，但按当前宪法 Q3 不能标为异源质量裁决。
- B 合并后可将目标分支正常 merge 进 A worktree 并从原 stage 继续；当前 workspace 的祖先检查可能错误阻止已有独立 commit 的 A，需要在不引入 rebind/recovery 的前提下修正。

## 三个历史任务的过程证据与根因

### ModelTest US-04

- 上游没有先钉死评分、matcher、unknown、false-positive 等产品语义，build-spec/review 后期才多轮退回补决定，证明“后面发现再修”会造成真实返工。
- 曾扩张到用户认为没有必要的 72 次校准；根因是 plan 没有绑定最小充分证据和停止条件，研究/验证从证明能力扩大成追求完整实验。
- review packet 曾缺最终实现片段，AC 范围也没有正确拆成独立 AC；测试绿不能证明 review 看到了完整交付物。
- 最终仍有真实 provider/live 证据 unavailable；正确做法是保留 unknown/incomplete，而不是把结构测试或 close 当业务通过。

### PaperBuilder 智能迭代补充

- 进入 Talk 前没有先完整盘点已有能力、缺口、当前 worktree 和运行服务，用户需要反复要求“先检查现在实现了什么”。
- 高级能力、当前 task 范围、phase 数量和自动推进方式多轮才收敛；说明准备检查必须先区分已有、当前补充和真正后续能力。
- 测试一度机械尝试多个策略/批次；用户明确达到“完整 11 阶段、可正式多窗口验证、capability/statistics/lineage/replay 可读”即可停止，证明停止条件必须围绕用户目标而非固定数量。
- 用户希望一个 task 内分更多 phase，每个 phase 有详细测试和审查，只有确实过大的能力才延期；不能用“降低复杂度”把核心需求过度拆散。

### WorkflowHub M15

- 用户最初纠正“少走的是 step 或 skill，不是 stage”，说明 stage 绿色状态会掩盖内部 step 静默丢失。
- 页面需求没有在 make-decision 准备和确认设计，进入实现后多次因信息架构、卡片密度、语言、布局和视觉质量返工，最终才由 Figma 定稿。
- 页面一度无法说明每个 task 的 stage/step/skill 效果、耗时、token、证据和遗漏；说明 monitoring 必须消费真实 step facts，而非只展示抽象状态。
- 因 snapshot/记录变化重复全量测试和 review，用户明确要求停止；检查必须基于真实主题变化和受影响范围。
- manual-close 一度只写记录、不执行 commit/merge/push/cleanup，用户多次追问；说明完成、质量和真实交付动作必须分开但不能互相替代。

### 三个历史任务逐 stage 与七项审计裁决

证据入口（只读）：ModelTest US-04 thread `019ff138-2754-7691-9660-1d348b3abb0d`；PaperBuilder 智能迭代 thread `019ff12f-cba4-7c51-bee0-76b8d764c837`；WorkflowHub M15 thread `019ff133-51fa-7250-b31a-2a9b2e9bf8d6`。thread 中没有稳定暴露的精确 token 账单和每个内部 step 的完整 runtime fact，因此相应项保持 unavailable/partial，不根据聊天摘要伪造。

当前来源绑定（2026-08-12 只读回读）：

| source | live ref | host / latest observed revision | canonical content hash |
| --- | --- | --- | --- |
| US-04 | `thread://019ff138-2754-7691-9660-1d348b3abb0d` | `local`; updatedAt=`1786491573`; newest-page nextCursor=`019ff198-0dfc-7790-b7c4-9aac8cfbdfcd` | unavailable — thread connector 不提供可持久化的 canonical export/hash |
| PaperBuilder | `thread://019ff12f-cba4-7c51-bee0-76b8d764c837` | `local`; 2026-08-12 read_thread readback | unavailable — 同上 |
| M15 | `thread://019ff133-51fa-7250-b31a-2a9b2e9bf8d6` | `local`; 2026-08-12 read_thread readback | unavailable — 同上 |

因此 T009 只能证明 live ref、当前四材料的 source-group 绑定和新流程防复发场景；不能宣称三个 thread 的 canonical 内容 hash 已归档。若未来 connector 提供稳定 export/hash，再补独立 provenance evidence，不改写本次 unavailable 事实。

| task | make-decision | build-spec | build-plan | build-code | verify-code |
| --- | --- | --- | --- | --- | --- |
| US-04 | 进入并确认；评分/边界仍后补，partial | 已执行；因上游歧义返工，partial | 已执行；校准范围膨胀，partial | 三 phase 完成，131/131；integration 证据有缺口 | 反向验收完成；AC-002/012 unknown，incomplete |
| PaperBuilder | 已执行；现状/依赖盘点偏晚，partial | 已执行；已有/新增能力边界多轮收敛 | 已执行；phase/停止条件曾不清 | 分 phase 实施、测试、review；存在机械多策略/批次探索 | 有交付事实；逐原始需求最终验收链不完整，partial/unknown |
| M15 | 已执行；step/skill 与 UI 范围未前置冻结，partial | 已执行；真实页面结果和数据展示语义后补 | 已执行；monitoring/E2E/close 边界仍漂移 | 页面多轮重做，最终有静态页面和浏览器检查 | 真实 Codex 五阶段 E2E/独立 review 未齐，incomplete；后续风险 close 不等于质量通过 |

上述 `partial` 表示“stage 进入过但不满足本任务拟定的标准质量形成/step 证据”，不是说整个 stage 未运行。无法从 thread 独立证明的 step 不写 completed。

| 审计问题 | US-04 | PaperBuilder | M15 |
| --- | --- | --- | --- |
| 1 标准流程 | 五阶段可见；上游决定后补 | 五阶段过程可见；前置盘点不足 | 五阶段可见；step/skill 可见性不足 |
| 2 步骤遗漏 | 产品语义、完整 packet、live 证据 | Talk 前实现盘点、目标停止 oracle | UI 冻结、step outcome、真实 E2E |
| 3 阻塞问题 | US-03/provider gate、长 review | worktree/能力边界/机械探索 | provider/review、E2E、close 语义 |
| 4 交付/review | 结构测试强；业务仍 incomplete | 功能交付有证据；独立最终覆盖 partial | 页面可用证据部分；review/正式验收 incomplete |
| 5 根因 | make-decision 未冻结语义和成功证据 | 先问后查、数量代替目标 | manifest≠执行、UI/交付边界后补 |
| 6 时间/token | 主要耗在后补决定、provider 等待、close | 主要耗在盘点返工、多策略/批次 | 主要耗在 UI 重做、重复测试/review、close 往返 |
| 7 原始需求 | 不能证明完美实现；AC-002/012 unknown | 没有逐条最终闭环证据，partial/unknown | 静态页面部分交付；真实 E2E/正式质量未完成 |

质量最终裁决：三个任务都不能表述为“所有原始需求完美实现”。US-04 的 Git/close 后续真实完成，但业务校准质量仍 incomplete；PaperBuilder 有实现和测试事实，但缺完整的逐原始需求最终回放；M15 有页面交付事实，但真实运行与独立质量事实未闭合。review provider 失败、packet 缺失或 same-source 只能降低可信度，不能改写为空 findings/pass。

### 历史过程成本事实

thread API 已读取到的 turn duration 求和仅用于诊断，多个 turn 可能包含等待且不等于互斥 wall-clock：US-04 约 `31,301,265 ms`，PaperBuilder 约 `41,959,451 ms`，M15 约 `47,218,224 ms`。精确 token 分布 unavailable。

- US-04：合理成本是三 phase 实现、131/131 回归和逐 AC 反向验收；浪费主要是评分/样本边界后补、过量校准设想、review packet 不完整后的返工、provider 长等待和 close 证据重捕获。
- PaperBuilder：合理成本是现状研究、分 phase 实现与真实测试；浪费主要是进入 Talk 前盘点不足、已达到目标后继续固定策略/批次探索、重复解释能力边界。
- M15：合理成本是设计实现和真实页面检查；浪费主要是 UI 未冻结导致多轮重做、未变化材料的全量测试/review、monitoring 事实不足后的反复解释、manual-close/风险 close/物理交付语义往返。
- 后续实现验收必须按 R-050/R-061 获取 stage/step/skill/provider/test/review/user-wait 的结构化事实；本审计不把不可得 token 猜成百分比。

### 归档任务 P1～P5 实施与质量继承

归档任务不是只有 R/D 需要继承；其实际执行状态也是本任务改造的基线证据：

- P1～P5 的实现、定向测试和阶段异源审查已执行；最终当前快照 `5d443cbad0ee2c0d8aec24a9668e3b9426cfe40` 上 `npm test` exit 0。
- P1 有 2 条 minor advice；P2～P5 的阶段 review 有可信 provider 终态且 findings 为空。这些是 advice facts，不是 provider pass。
- 最终 `phase_id=null` integration provider 超过 12 分钟仍无最终文本并被停止；没有可认证 integration result，因此 integration review 保持 `missing/unknown`。
- `AC-001～AC-024` 的当前官方 acceptance coverage 保持 `unknown`；全量测试绿色不能替代逐 AC 语义证据。
- 遗留事实：SCN-011 仍有旧“pass 合同”措辞；可信 integration review、逐 AC 当前证据、provider 无终态的 broker timeout/kill 仍未闭合。
- 因此归档任务最终状态是 `incomplete`，不能把“P1～P5 代码已做”压缩成“完整交付已通过”。证据源：`specs/archive/wh-review-execution-flow-improvement/tasks.md` 的 T011 执行状态。

### 历史故障 → 改造 → 验证

| 历史故障 | 根因 | 对应改造 | 必须证明 |
| --- | --- | --- | --- |
| US-04 后期补评分语义 | 决策准备不完整 | R-007～R-010、R-058 | build-spec 不再补方向 |
| US-04 72 次校准 | 成功证据未冻结 | R-041～R-042 | 达标即停且不扩范围 |
| PB 先问后盘点 | 当前事实未核验 | R-034、R-043 | 可查事实不再问用户 |
| PB 固定批次探索 | 数量代替目标 | R-042、R-050 | 成本按目标和变化触发 |
| M15 step/skill 消失 | manifest 不等于执行 | R-022～R-023、R-067 | 缺步/乱序可被发现 |
| M15 UI 多轮返工 | 设计未在前面冻结 | R-008、R-044、R-058 | 页面输入先确认再开发 |
| 三任务 review 失真 | packet/终态/快照不可靠 | R-036～R-039 | 失败不变 pass，变化才重审 |
| 重复读/测/review | 无影响面失效规则 | R-050～R-051、R-061、R-065 | 同样例重复次数下降 |
| close 冒充交付 | 多层状态混淆 | R-047～R-048、R-052 | 四层状态和物理结果分开 |
| worktree 未提前准备 | 启动 owner 分散 | R-029～R-030、R-043 | make-decision 唯一准备且 dirty 不污染 candidate |
| Talk/Clarify 串行逐题 | frontier 未批量重排 | R-011、R-033、R-060 | 独立问题成批，部分回复后 re-rank |
| review packet 缺真实实现 | packet 只看摘要/旧快照 | R-036、R-088 | 当前 diff、测试、AC trace 和 coverage limit 都进入 packet |
| provider 长等待/无终态 | 失败语义和恢复不完整 | R-005、R-037、R-074、R-077、R-085～R-086、R-092 | 三次公开异源事实、同源降级和风险披露均可回放 |
| PB 自动推进/停止漂移 | 成功 oracle 与强阻塞不清 | R-042、R-049 | 达到用户结果即停，仅新选择/强阻塞暂停 |
| M15 看不到 step/skill | 声明无真实 consumer | R-045、R-067、R-090、R-094 | handler→facts→status→页面 E2E 合同通过 |
| 摘要丢失原始语义 | 缺 source lineage/replay | R-021、R-040、R-064、R-068、R-096 | source_group→R/D→产物→证据可追且 partial 不冒充 covered |

## 已明确拒绝的方案

- 只在 verify-code 做最终覆盖卡，再回头补全部遗漏。
- 只用“缺 AC、测试、review 就不能报完成”替代前面阶段的需求准备和质量设计。
- 只在 stage 结束检查步骤，发现缺步后机械补做而不解决前置条件。
- 给所有 provider 加 WorkflowHub 自己的有界超时、失败即跳过或 review 只跑一次，从而静默丢失重要审查。
- 用统一 token 预算、固定停止条件、一次 review、无变化不重跑作为主要成本方案。
- 为每个 stage 新建一套 analyzer、状态文件、ledger、permit 或硬 gate。
- 让当前 stage 任意改写四材料并自行补产品决定。
- 把所有问题固定移交给 owner stage 并进入等待；当前 stage 必须负责闭环，但使用合法 writer 和真实用户选择。

## 用户流程/结果索引

1. 用户从 make-decision 提交原始需求。
2. 系统读取仓库事实并做需求准备检查；可查事实自行核实。
3. 对仍会改变方向、且彼此独立的问题进行大白话批次 Talk；收到真实回复后重新计算下一批。
4. 方向明确后执行必要研究、direction advice、Talk Round 3、Grill、decision draft、detail advice 和 finding 处置。
5. 用户确认 decision-log 后发布/交接；后续 stage 只消费已确认决定，不补造产品方向。
6. 每个 stage 按“原始需求 + decision-log + 直接上游产物 + 当前产物”做结束一致性检查。
7. 发现缺口时由当前 stage Agent 负责闭环：事实漏写调用原材料既有 writer；新产品选择当场询问用户；不建立移交等待程序。无缺口时输出统一大白话摘要。
8. verify-code 最终回放全链路和真实证据，不能用计划或历史 review 冒充实现完成。

### mini-task 统一子流程（已确认）

1. 用户直接提出小功能，或 A 在任一 stage 被必要依赖/修复阻塞，创建独立 mini-task；若来自 A，记录阻塞原因、所需结果和返回条件。
2. 用精简材料完成需求、影响、方案、AC、风险、测试和交付设计；执行 `mini_task.design` 异源审查并就地修复 finding。
3. 实施功能并运行聚焦测试；执行 `mini_task.implementation` 异源审查并就地修复 finding。
4. 复用通用 wh-review 恢复：provider unavailable 时最多做三次新的正式异源请求；仍失败则运行当前 provider 独立子代理并标为 same-source fallback。缺异源时质量保持 incomplete，带风险交付前另行接受当前风险。
5. 使用创建时的计划内预授权，绑定最终真实 snapshot 执行 commit、merge、push、archive、cleanup；对象或范围变化时重新询问。
6. 若来自 A，先有 A 进度 commit；mini-task 合并后把目标分支 merge 进 A，解决冲突、跑受影响验证，并从 A 原 stage 继续。

## 页面范围

- 当前任务无最终用户页面、路由或视觉稿修改。
- 范围内的“页面/UI 准备”是 make-decision 的通用检查维度及交互卡行为。
- 如后续实现判断需要新的 GUI 或独立控制台，必须回到 make-decision 重新确认，不由 build-spec 或 build-code自行扩大。

## 数据与状态

- 当前材料：四份 Markdown 工作材料。
- 当前事实：现有 `facts.jsonl`、`quality/reviews/`、`quality/tests/`、`quality/evidence/`、`quality/verify.json`。
- 一致性结果只能是事实；不得成为新的 work permit、selector、latest projection 或平行状态机。
- 需求覆盖使用现有 requirement/source IDs 和 artifact/evidence refs；不复制完整问答历史。
- 一致性状态使用 R-068 的九种语义；缺输入时是 `unavailable/material_incomplete`，不是 covered。

## 阶段结束大白话摘要格式

每个 stage 结束只输出一段短摘要，并由真实 facts/quality 生成：

1. 这一步做了什么：当前 stage 和实际完成的核心工作。
2. 需求有没有漏：covered/partial/missing 等结果及受影响 source ID。
3. 和前面是否一致：直接上游及累积材料是否冲突、扩大或过期。
4. 当场修了什么：当前 stage 已闭环的缺口、调用的合法 writer 和复验结果。
5. 还不知道什么：真实 risk、unavailable、deferred，不写成通过。
6. 接下来能做什么：下阶段可直接消费的材料，以及明确不能自行猜的内容。

## 成功/失败边界

- 成功：五个 stage 都能在发现问题的当前 stage 及时闭环需求传递遗漏；交互轮数减少；原始需求到最终证据可回放；真实用户结果可验证；不新增控制面。
- 失败：只在 verify 才发现遗漏；Analyzer 只写“已检查”但没有真实调用；缺失输入被猜测；新建第五材料、gate、ledger；批量问题存在依赖却一次抛给用户；检查导致重复 review 或无限返工。

## 非目标

- 不重写五阶段模型。
- 不创建新的 stage、公共 CLI 类别、需求数据库、快照 lineage、selector、permit 或 completion gate。
- 不把 `spec-analyze` 变成 provider review、代码质量审查或测试替代品。
- 不在本任务修改 3rd-review provider 私有生命周期。
- 不把三个历史任务的产品业务需求带入本任务。
- 不把 mini-task 伪装成历史 scope_revision 的原样恢复；不直接 cherry-pick 旧大型提交。
- 不把 mini-task 做成第六 stage，也不恢复旧 successor/reopen/rebind/recovery/controller/round 状态机。

## 风险与延期交接

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
| --- | --- | --- | --- |
| RISK-001 | 全阶段 analyzer 变成万能技能 | 规则膨胀、重复维护 | make-decision 决定公共核心与 stage profile 边界 |
| RISK-002 | 所有 finding 都变成硬阻塞 | 增加返工和停滞 | 保持事实语义；只限制虚假完成声明 |
| RISK-003 | 每个 phase 重跑全链路分析 | 时间/token 上升 | build-code 仅最终 aggregate 运行全链检查 |
| DEFER-001 | dirty fact 字段、摘要上限和分类枚举 | 对齐现有 validator/fixture；证明 dirty 不阻止且不带入 candidate | owner：build-plan/runtime；当前 task 先审计现状 |
| DEFER-002 | 三类 ask/wait/resume host seam | contract tests 证明批量 card、waiting、部分 reply、resume/re-rank 和错误回复拒绝 | owner：make-decision/build-spec/runtime |
| DEFER-003 | build-spec conditional research 的实际 fact consumer | executed/skipped/unavailable 可被当前 stage/status 读取，不新增对象/gate | owner：build-spec/runtime |
| DEFER-004 | build-code final integration 和 AC trace | final tests 后以 `phase_id=null` 当前实现包审查，真实 finding 有处置 | owner：build-code/review runtime |
| DEFER-005 | wh-review 终态分类、path-safe bundle、route/coverage、临时物清理和通用恢复 | provider 失败分类真实；最多三次新的异源请求，之后 same-source fallback 如实标记；不无限 retry、不伪造异源完成；最小包完整 | owner：wh-review/3rd-review |
| DEFER-006 | 三个历史 task 的旧记录 | 只读证据，不改写、不重新制造 review；当前 task 保存逐 stage/七项裁决、根因和可用证据锚点，不修改历史质量事实 | owner：本 task 审计 |
| DEFER-007 | advice freshness 与 record-only snapshot 解耦 | 记录性变化不重审；build-code 当前实现仍绑定 snapshot | owner：wh-review/runtime |
| DEFER-008 | make-decision 每个现有 step 更新同一 decision-log | 当前 handler 真正校验/消费 step updates；写失败保持 step incomplete | owner：make-decision/runtime |
| DEFER-009 | build-plan final analyzer 精确合同 | findings 处置和最终修订后、publish 前真实执行 R/D/FR/AC/DEFER/OPEN/oracle 检查 | owner：build-plan/runtime |
| DEFER-010 | 精确代码文件、schema 和命令 | 方向确认后才能稳定 | build-plan |
| DEFER-011 | 精确性能/token 基线样例 | 需要实现前后的同样例数据 | build-plan/build-code/verify-code |
| RISK-004 | 当前 stage 就地修复可能越过材料 owner | 下游偷偷补需求或改写用户决定 | 只允许调用既有 owner writer；新产品选择必须问用户 |
| RISK-005 | 批量 frontier 混入有依赖的问题 | 用户一次回答建立在未决前提上 | 每批只含互不依赖轴；部分回答后重排 |
| RISK-006 | step facts 过细变成新日志系统 | 写入、展示和维护成本超过收益 | 每个 manifest step 只保留最小 outcome 和 evidence refs，写入现有 facts |
| RISK-007 | 统一 analyzer 变成测试/review/代码质量的替代品 | 输出看似完整但业务质量仍未知 | 公共核心只做 lineage/一致性/handoff；专业检查留在 stage |
| RISK-008 | 自动推进掩盖真实用户决策或不可逆风险 | 未经确认扩大范围或执行 close | 只在新选择、强阻塞、风险接受、不可逆授权时暂停 |
| DEFER-012 | make-decision 需求准备检查的适用性矩阵和摘要字段 | build-spec 前必须明确 UI、依赖、角色、数据、边界是否 ready/needs-decision/not-applicable | owner：make-decision；consumer：decision-log 和 stage summary |
| DEFER-013 | 五个 `spec-analyze` profile 的精确 packet 和 finding schema | 复用现有 packet/validator/requirement-lineage；缺输入为 material_incomplete | owner：各 stage；consumer：现有 facts/quality 与阶段摘要 |
| DEFER-014 | 全 stage step outcome 的最小字段和 manifest 对照算法 | 必须证明缺失、skipped、incomplete、unavailable、乱序和依赖未完成；不建新 ledger | owner：runtime/stage；consumer：status/monitoring/stage summary |
| DEFER-015 | build-plan 已声明 analyzer 但 runtime 不调用的修复 | handler 实际执行、现有反向测试改为正向执行证据 | owner：build-plan/runtime；consumer：现有 quality fact |
| DEFER-016 | 时间/token 前后对比 fixture | 同一任务样例对比交互轮数、材料读取、review/test 次数、provider wait 和返工 | owner：build-plan/verify-code；仅诊断，不作 gate |
| DEFER-017 | 真实 close 和带风险 close 的统一说明与自动继续边界 | 用户授权后必须完成计划内物理操作并读回；质量 unknown 继续披露 | owner：verify/close runtime；不可逆授权保持现有机制 |

## 未决项

| item_id | 未决内容 | 原因 | 谁在何时解决 |
| --- | --- | --- | --- |
| OPEN-001 | dirty fact 当前字段、摘要大小、分类枚举是否已完整实现 | 归档要求可能已有部分实现，需按当前 runtime 复核而非重复建设 | build-plan 前现状审计 |
| OPEN-002 | build-spec conditional research 的 fact key/step_id 是否有真实 consumer | skill/steps 已声明不等于 handler 已消费 | build-plan/runtime 设计时关闭 |
| OPEN-003 | broker timeout/kill/group outcome 的真实公共接口边界 | provider lifecycle 属 3rd-review，WorkflowHub 不应再造一套 | wh-review contract 回归时关闭 |
| OPEN-004 | 当前 target dirty cleanup 路径 | 当前 baseline clean，无具体清理对象 | 未来发现 dirty 时先建议、后授权；本 task N/A |
| OPEN-005 | human confirmation、interaction fact 与 advice provenance 的当前绑定是否仍过宽 | 记录性 snapshot 不应触发 advice 重审 | make-decision/detail advice 前审计 |
| OPEN-006 | 历史 Talk 队列缺失证据 | 不可追回，不能伪造补写 | evidence-only；当前契约测试证明新流程即可 |
| OPEN-007 | 所有 stage 就地修复时的 writer 调用边界 | 已决定当前 stage 负责闭环，但精确 API/错误恢复需设计 | build-plan；不得形成移交状态机 |
| OPEN-008 | Original Requirement Replay 是否仍有遗漏 | CLOSED：四份独立审计发现历史七项审计、通用 wh-review 范围、P1～P5 状态、来源锚点和 stale 表述缺口；已在 build-spec 修复为 R-001～R-097 及完整性审计章节。编号连续只作机械检查，不再冒充语义覆盖 | build-spec final semantic audit 已关闭；后续 final check 不复用本 ID |
| OPEN-009 | mini-task 的两种入口 | CLOSED：五阶段任一处可作为 A 的前置交付触发，也可由用户直接用于小功能 | D-009 |
| OPEN-010 | mini-task 的精简材料合同和“小功能”适用边界 | CLOSED：紧凑四材料；默认按明确度/风险判断，用户也可显式指定 | D-014/D-015 |
| OPEN-011 | mini-task 执行中发现范围变大时如何处理 | CLOSED：暂停并由用户选择缩小或创建普通任务，不自动转换 | D-016 |

## 当前 make-decision step 更新

| step | 状态 | 本次更新 | 下一步 |
| --- | --- | --- | --- |
| 1. load-context | completed (repaired) | 读取当前会话、三个历史 task、归档需求与 P1～P5 执行状态、五阶段 skills、`spec-analyze`、`requirement-lineage`、scope_revision 历史和宪法；经两轮独立审计修复为 R-001～R-097，并补回旧 R/D/DEFER/OPEN/P1～P5 去向。 | triage-scope |
| 2. triage-scope | completed | 当前任务属于跨五阶段的流程能力改造；无产品页面改动；可复用现有四材料、facts、stage manifests 和 analyzer，不需要新控制面。 | Talk Round 1 |
| 3. talk-round-1 | completed (repaired; answers preserved) | 早期错误判断“无剩余 high/medium 问题”；随后完整 replay、批量 Talk、Grill 和四份独立审计已补齐并归并。当前没有未回答的 high/medium 产品方向；R-095 作为推导边界随最终整体确认。 | final confirmation |
| 4. research-inputs | completed (internal synthesis); external skipped | 外部研究不需要；三个历史任务、归档需求和当前 runtime 的内部证据综合已真实执行并写入根因/方案/继承映射，不能再简称为 skipped。 | Talk Round 2 |
| 5. talk-round-2 | completed | 用户选择方案 2 已保存；Original Requirement Replay 已修复。新增 scope_revision 的四个互不依赖方向轴已由用户一次回复 `3、1、1、1`，形成 D-005～D-008。当前没有剩余必须由用户先决定的 high/medium frontier。 | direction advice |
| 6. direction-advice | completed | wh-review 返回 2 major、2 minor；均为方向 packet 未显式带出已确认边界。F-77e3715da06d、F-d157ed64b2de 通过 D-006～D-008/R-070 修复；F-a331f4bcf95f 通过 R-071 修复；F-135b0f02f 对应 R-037/R-044/R-052 和历史故障映射，拒绝其“未覆盖”判断但接受需在 packet 显式映射的建议。 | Talk Round 3 |
| 7. talk-round-3 | completed (no-new-question) | 处置 direction findings 后没有新的用户产品选择；已有答案不重复询问。 | Grill |
| 8. grill | completed | 用户选择 `1、1、1` 并补充“用户指定也可使用”：默认按明确度/风险推荐，用户可显式指定；紧凑复用四材料；范围膨胀时暂停并由用户选择缩小或普通任务。Grill 无剩余 high/medium 问题。 | focused direction advice → decision draft |
| 9. focused-direction-advice | completed | mini-task 真实方向变化后执行一次聚焦审查；1 major、4 minor 均为合同缺口，已通过 R-085～R-089 在当前 stage 修复，无新增用户方向问题。 | decision draft |
| 10. decision-draft | completed (repaired) | D-001～D-016、R-001～R-097、五阶段改造、通用 wh-review 恢复、mini-task、三个历史 task 七项裁决、P1～P5 状态和成本边界已整理成同一 decision-log 草案。 | final confirmation |

## 三轮 Talk

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001 | 五阶段一致性检查由什么能力统一承载：1 扩展 spec-analyze；2 抽出新的公共能力；3 各 stage 自建 | 1 入口唯一、维护最低，但必须限制万能化；2 命名清楚但增加相邻入口；3 局部独立但重复和漂移最高 | `1` | 已确认唯一入口；新增“step 缺失如何影响流程”为下一最高问题 | 当前会话真实用户回复 |
| T-002 | 一致性检查发现问题后由谁修复：1 留到 verify；2 回 owner stage；3 当前 stage 直接处理 | 1 后期返工；2 owner 清楚但产生移交流程；3 闭环最快但可能跨越材料 owner | `3，在哪个stage检查出的问题，就在哪个stage修复，不要总是移交程序` | 已确认当前 stage 对修复闭环负责；跨 owner 写入方式成为下一关键问题 | 当前会话真实用户回复 |
| T-003 | 当前 stage 遇到跨 owner 或方向性缺口时如何修：1 当前 stage 负责到底但使用原 owner writer/真实用户回答；2 任意改写并自行决定；3 只记录继续 | 1 保留 owner 且无移交等待；2 快但越权猜需求；3 遗漏继续存在 | `1` | 回答已保留；当时“已收敛”的判断被本轮审计撤销 | 当前会话真实用户回复 |
| T-004 | 一致性和 step 检查结果如何保存并影响完成：1 新状态/gate；2 现有 facts 且只限制完成声明；3 仅聊天摘要 | 1 增加控制面；2 可证明执行且不锁死修复；3 无法证明真实执行 | `2`；并指出“spec-analyze 只是最后的一点小问题”，要求确认全部调研、方案和细节未遗漏 | 触发完整原始需求回放；Talk 暂停，不把当前 28 条当作已证明完整 | 当前会话真实用户回复 |
| T-005 | scope_revision 适用阶段 | 1 后四阶段；2 仅 code/verify；3 五阶段 | `3` | CLOSED；五阶段统一触发语义 | 当前用户回复 `3、1、1、1` |
| T-006 | scope_revision 恢复深度 | 1 轻量同-task；2 专用 contract/review；3 完整旧控制面 | `1` | CLOSED；不恢复独立 runtime 对象 | 当前用户回复 `3、1、1、1` |
| T-007 | 同一 task 的边界 | 1 同核心结果留 A、无关目标新 task；2 所有变化留 A；3 新行为都拆 task | `1` | CLOSED；按核心用户结果划界 | 当前用户回复 `3、1、1、1` |
| T-008 | 影响材料与证据如何更新 | 1 只更新受影响范围；2 全链重写；3 只写 decision-log | `1` | CLOSED；delta-aware 更新和失效 | 当前用户回复 `3、1、1、1` |

## 决定

### D-001

- question/final_option：五阶段一致性检查由谁统一承载；选择方案 1。
- recommendation/plain_language：采用推荐项；继续使用现有 `spec-analyze` 这一个入口，内部按阶段做不同检查。
- decision：扩展 `spec-analyze` 为公共一致性入口；五个 stage 使用窄 profile；底层复用 `requirement-lineage`。
- source_type/reference/exact_excerpt：真实用户回复；当前会话；原文“1”。
- approval_binding：Talk 已回答，最终 decision confirmation 尚未执行。
- facts_and_constraints：现有 `spec-analyze` 已有 build-plan validator；现有 `requirement-lineage` 已有窄 lineage 合同；宪法禁止重复控制面。
- Logic：已有两个可复用能力 → 不能增加维护面 → 单入口加窄 profile → 统一检查且避免五套规则漂移。
- choice_reason/impact：维护成本最低；影响五阶段 skill、packet 和 stage-end 调用。
- consequences_and_risks：名称职责变宽；必须明确公共核心只检查需求传递，不取代 stage 专业质量、测试或 review。
- rejected_alternatives：方案 2 会增加相邻入口；方案 3 会复制五套规则并增加漂移和 token 浪费。
- unresolved_items/owner：step 缺失语义、修复路由和精确实现由后续 Talk/build-plan 确定。
- Supersedes：none。

### D-002

- question/final_option：一致性问题由谁负责修复；选择方案 3，并补充“不总是移交程序”。
- recommendation/plain_language：用户没有采用推荐的 owner-stage 移交；要求发现问题的当前 stage 直接负责把问题闭环。
- decision：哪个 stage 检查出问题，哪个 stage 负责修复、验证和继续当前流程；不得创建发现单、移交等待或来回跳转程序。
- source_type/reference/exact_excerpt：真实用户回复；当前会话；原文“3，在哪个stage检查出的问题，就在哪个stage修复，不要总是移交程序”。
- approval_binding：Talk 已回答，最终 decision confirmation 尚未执行。
- facts_and_constraints：用户明确反对后期返工和流程阻塞；宪法仍规定四份材料有唯一 owner，build-spec/build-plan 不能静默补产品方向。
- Logic：移交造成等待和上下文损耗 → 当前 stage 对问题闭环负责 → 更早修复并减少往返 → 仍需明确跨 owner 材料的合法写入方式。
- choice_reason/impact：优先减少程序化移交、阻塞、重复阅读和 token 浪费；影响五阶段 analyzer finding 处置。
- consequences_and_risks：当前 stage 可能发现上游材料缺口；若允许直接任意改写四材料，会破坏 owner 和需求确认边界，因此该例外规则仍未确认。
- rejected_alternatives：方案 1 会把问题拖到最终验证；方案 2 会形成用户不希望的固定移交流程。
- unresolved_items/owner：当前 stage 遇到跨 owner 或方向性缺口时，采用受控 owner writer 还是直接改写，需下一题由用户确认。
- Supersedes：none。

### D-003

- question/final_option：当前 stage 遇到跨 owner 或方向性缺口时如何闭环；选择方案 1。
- recommendation/plain_language：采用推荐项；当前 Agent 负责把问题解决完，但不能越权猜需求。
- decision：已确认事实的漏写由当前 Agent 调用对应材料既有 writer 补回；新的产品选择由当前 Agent 当场向用户提问并把真实回答写入 decision-log；随后重新检查并继续当前 stage。
- source_type/reference/exact_excerpt：真实用户回复；当前会话；原文“1”。
- approval_binding：Talk 已回答，最终 decision confirmation 尚未执行。
- facts_and_constraints：四材料各有唯一 owner；用户要求问题在发现 stage 闭环且不要固定移交程序。
- Logic：当前 stage 负责闭环 → 不能进入移交等待 → 复用原 owner writer/用户确认 → 保留材料权威且减少往返。
- choice_reason/impact：同时满足“就地修复”和“不让下游补需求”；影响所有 analyzer finding 的 repair action。
- consequences_and_risks：必须区分事实漏写与新产品决定；误分类可能导致越权修改或多余提问。
- rejected_alternatives：任意改写会破坏 owner；只记录继续会保留真实遗漏。
- unresolved_items/owner：一致性结果的保存和完成语义在 Talk Round 2 确认。
- Supersedes：none。

### D-004

- question/final_option：一致性和 step 检查结果如何保存并影响完成；选择方案 2。
- recommendation/plain_language：采用推荐项；复用现有 facts/quality，检查结果只限制“能否说完成”，不阻止当前 task 继续修复。
- decision：不新增 analyzer 状态文件或硬 gate；面向用户显示大白话摘要，正式事实进入现有事实存储。
- source_type/reference/exact_excerpt：真实用户回复；当前会话；原文“2.”。
- approval_binding：Talk 已回答，最终 decision confirmation 尚未执行。
- facts_and_constraints：宪法要求质量事实不是推进许可证；用户反对新增限制、契约、预算和停止条件导致阻塞。
- Logic：需要证明真实执行 + 不能新增控制面 → 复用现有 facts/quality → 保留真实性且不锁死修复。
- choice_reason/impact：兼顾可审计与低复杂度；影响五阶段 handler、status 和摘要展示。
- consequences_and_risks：现有 facts 的 writer/consumer 必须真实接通；不能只增加文档声明。
- rejected_alternatives：独立 gate 增加维护和阻塞；纯聊天摘要无法证明执行。
- unresolved_items/owner：此前全部调研、方案、根因和否定方案是否完整进入当前 decision-log，正在由 make-decision 回放审计。
- Supersedes：none。

### D-005

- current_status：superseded by D-009；只保留“五个 stage 都可触发 mini-task”这一事实。
- question/final_option：哪些 stage 可触发 scope_revision；选择方案 3。
- decision：历史回答曾被解释为五阶段内的材料 revision；该解释已失效。当前权威决定是 D-009：五阶段任一处可触发独立 mini-task，A 自身方向变化不因此记为 revision。
- source_type/reference/exact_excerpt：真实用户回复；当前会话；原文“3、1、1、1”中的第一个 `3`。
- choice_reason/impact：用户要求所有阶段对需求变化使用一致、可见的处理方式，避免只有后期阶段能修订。
- consequences_and_risks：历史风险不再适用；mini-task 风险由 D-009～D-016 记录。
- rejected_alternatives：只支持后四阶段或历史 code/verify 会让早期需求变化缺少统一影响分析。
- Supersedes：旧 scope_revision 仅允许 build-code/verify-code 的适用范围。

### D-006

- current_status：superseded by D-009/D-013；仅作为被推翻方案保留。
- question/final_option：scope_revision 恢复深度；选择方案 1。
- decision：历史轻量同-task revision 方案已失效；当前使用独立 mini-task、两个专用 review track 和精简四材料。
- source_type/reference/exact_excerpt：真实用户回复；原文“3、1、1、1”中的第二个 `1`。
- choice_reason/impact：恢复用户需要的能力，同时遵守四材料、事实非许可证和减少控制面的宪法边界。
- consequences_and_risks：本段只描述已废弃的轻量同-task revision 方案，禁止作为下游输入；当前 mini-task 的专用 design/implementation packet、独立 task/worktree/branch 由 D-009/D-013/R-087～R-093 定义。
- rejected_alternatives：恢复完整旧 scope_revision 状态机会增加控制面；当前替代方案是独立但精简的 mini-task。
- Supersedes：本决定本身已被 D-009/D-013 全部替代，不保留同-task修订作为当前 mini-task 语义。

### D-007

- current_status：superseded by D-009/R-093；不再是开放决定。
- question/final_option：什么变化保留在 A task；选择方案 1。
- decision：历史“A 内需求范围”判断已失效；mini-task 使用独立 task ID/worktree/branch，A 只记录阻塞原因、所需结果和 merge commit。
- source_type/reference/exact_excerpt：真实用户回复；原文“3、1、1、1”中的第三个 `1`。
- choice_reason/impact：既允许真实需求演进，又防止 A task 无限膨胀。
- consequences_and_risks：核心目标关系需要显式说明；不得只凭文件重叠或实现方便判断。
- rejected_alternatives：全部塞进 A 会失控；任何新增行为都拆 task 会增加上下文切换和遗漏。
- Supersedes：closed by D-009/R-093。

### D-008

- current_status：superseded by D-010/D-015/R-093；不再是开放决定。
- question/final_option：需求变化后的更新范围；选择方案 1。
- decision：历史“A 内受影响片段更新”方案已失效；mini-task 独立维护紧凑四材料并完成 Git 交付，A 在合并后只重验受影响范围。
- source_type/reference/exact_excerpt：真实用户回复；原文“3、1、1、1”中的第四个 `1`。
- choice_reason/impact：保留需求一致性，同时直接减少重复全文读取、全量测试、review 和返工。
- consequences_and_risks：影响面漏判会留下 stale 证据；需由 source ID、用户旅程/状态/AC 和消费者引用共同计算，而不是只看 changed files。
- rejected_alternatives：全链重写成本过高；只改 decision-log 会让下游静默过期。
- Supersedes：closed by D-010/D-015/R-093。

### D-009

- question/final_option：前置功能执行容器与正式名称；选择精简子流程，并更名为 mini-task。
- decision：mini-task 是独立的小功能交付流程，不运行完整五阶段；既可由 A 任一 stage 因前置依赖/必要修复触发，也可由用户直接启动。
- source_type/reference/exact_excerpt：真实用户回复；“1：2”及“直接改成mini-task好了，后续可能直接用这个流程做一些小功能”。
- choice_reason/impact：完整五阶段对小功能过重；mini-task 仍保留需求、方案、测试、两次审查和真实 Git 交付。
- consequences_and_risks：必须明确精简材料和适用边界，防止大需求绕过五阶段。
- rejected_alternatives：普通完整 task 成本过高；按规模自动二选一会引入隐式分类和行为漂移。
- Supersedes：D-005～D-008 中“scope_revision 是 A 内材料修订”的全部产品语义；历史事实继续只读保留。

### D-010

- question/final_option：A 有未提交进度时如何保存；选择方案 1。
- decision：取得明确授权后创建真实 A 进度 commit；mini-task 合并到目标分支后，将目标分支 merge 进 A，再解决冲突和运行受影响验证。
- source_type/reference/exact_excerpt：真实用户回复；“2:1”。
- choice_reason/impact：避免 stash 隐藏状态和人工清理阻塞，保留清晰可恢复历史。
- consequences_and_risks：进度 commit 不等于 A 完成或质量通过；只能包含已核实属于 A 的当前改动。
- rejected_alternatives：人工整理会阻塞；stash 隐藏状态且恢复风险高。
- Supersedes：none。

### D-011

- question/final_option：通用 wh-review 三次异源失败后同源子代理的效力；选择方案 1。
- decision：五阶段与 mini-task 的 wh-review 都先做最多三次新的异源请求；仍失败时执行当前 provider 的独立子代理审查，但如实标记 same-source fallback，前三次 unavailable 不覆盖，不把 fallback 冒充异源。若需在缺异源结论下宣称质量闭合或执行带风险交付，质量仍为 incomplete，并必须记录、披露和接受当前 snapshot 的具体风险。
- source_type/reference/exact_excerpt：真实用户回复；“3：1”。
- choice_reason/impact：重要审查步骤不丢失，provider 故障也不会无限冻结；同时保留来源真实性。
- consequences_and_risks：同源独立上下文仍不是宪法 Q3 的异源质量裁决，完成摘要必须明确质量限制。
- rejected_alternatives：伪装异源违反宪法；绝对禁止合并会让 provider 故障永久阻塞 A。
- Supersedes：当前 wh-review 的绝对 no-retry/no-fallback 运行策略，但不改变 3rd-review 私有生命周期 owner。

### D-012

- question/final_option：mini-task Git 授权方式；选择方案 1。
- decision：创建 mini-task 时，用户可对明确计划内的 commit、merge、push、archive、cleanup 一次性预授权；执行时绑定实际 branch/commit/snapshot 并读回，范围或对象变化必须重新询问。
- source_type/reference/exact_excerpt：真实用户回复；“4:1”。
- choice_reason/impact：实现“审查没问题直接提交合并”，同时保留宪法 F7 的具体授权和真实对象绑定。
- consequences_and_risks：预授权不能扩张到 A 的额外交付动作或未列出的不可逆操作。
- rejected_alternatives：实施后再问增加等待；完全无授权执行违反宪法。
- Supersedes：none。

### D-013

- question/final_option：两次专用审查是否替代普通 review；选择方案 1，并明确两个配置。
- decision：`mini_task.design` 承担方案审查，`mini_task.implementation` 承担最终实现审查，替代同范围普通 plan/code review；在 `/Users/Hugh/.config/workflowhub/config.json` 中分别配置。
- source_type/reference/exact_excerpt：真实用户回复；“5:1，那就是要再...config.json中新建两个审查配置，scope的方案审查和实施审查”。名称随后统一改为 mini-task。
- choice_reason/impact：满足专用审查目标且不重复消耗 provider 时间/token。
- consequences_and_risks：两类 packet、prompt 和结果标识必须明确不同；不能用 design 结果替代 implementation。
- rejected_alternatives：专用和普通审查都跑会重复；只跑普通审查无法表达 mini-task 两个专门问题。
- Supersedes：D-006 中“使用当前 stage 普通 review”的决定。

### D-014

- question/final_option：什么功能适合 mini-task；选择风险/明确度判断，并允许用户显式指定。
- decision：默认在需求边界清楚、单一结果、影响面有限、无重大架构/迁移/权限/安全决定时使用；用户明确指定时也可使用，Agent 只披露风险，不以默认分类拒绝。
- source_type/reference/exact_excerpt：真实用户回复；“1（除了……外，用户指定的需求也可以用）”。
- choice_reason/impact：保留 Agent 的专业推荐，也保留用户对执行流程的最终选择。
- consequences_and_risks：用户指定不能授权未知不可逆操作，也不能把缺失异源审查、测试或证据改写成完成。
- rejected_alternatives：完全只由用户标签会缺少风险提示；数值硬门槛容易误判复杂度。
- Supersedes：none。

### D-015

- question/final_option：mini-task 使用什么材料；选择紧凑复用四材料。
- decision：同一 mini-task 仍使用 decision-log/spec/plan/tasks，但采用精简模板和一次式设计形成；design review 读取这四份当前材料，implementation review 再加入当前代码、测试和 AC trace。
- source_type/reference/exact_excerpt：真实用户回复；第二个“1”。
- choice_reason/impact：两次审查有稳定输入且不创建第五真相；不要求经历五个标准 stage。
- consequences_and_risks：精简 writer 必须复用现有四材料 schema/owner 语义，不能复制一套 mini-task ledger。
- rejected_alternatives：单独 mini-task.md 增加控制面；聊天+diff 无法稳定证明需求和方案。
- Supersedes：none。

### D-016

- question/final_option：执行中发现 mini-task 变大如何处理；选择暂停并让用户决定。
- decision：停止继续扩大实现，向用户说明新增范围、风险和已有成果；用户选择缩小当前 mini-task，或用已确认事实创建普通五阶段任务。不得自动转换当前 task。
- source_type/reference/exact_excerpt：真实用户回复；第三个“1”。
- choice_reason/impact：防止精简流程静默吞掉复杂设计，也不引入自动 rebind/continuation。
- consequences_and_risks：会新增一次必要用户选择，但只在实际范围明显变化时触发。
- rejected_alternatives：继续会绕过质量形成；自动转换增加状态和恢复复杂度。
- Supersedes：none。

## 调研

- 外部研究：skipped；现有本地一手材料足够。
- 内部证据综合：completed；三个历史 task 的 thread ID、逐 stage/七项审计裁决、可用 duration、归档 R/D/DEFER/OPEN/P1～P5、当前 workflows/skills/runtime 和上游 `grilling` 合同已纳入本日志；不可得的精确 step/token 事实保持 unavailable。
- 限制：历史任务精确 token 若来源未提供则保持 unavailable；已读取的 duration 仅作诊断，不伪装成互斥 wall-clock 或精确 token 占比。

## 决策草案摘要

1. 保留 WorkflowHub 五阶段，但把需求准备、专业质量和 step outcome 放到各自最早责任点，不依赖 verify 末尾补救。
2. Talk/Grill/Clarify 采用批量 frontier；Agent 可查事实不问用户，真实 ask/wait/reply/resume 仍保留。
3. 五 stage 复用一个 `spec-analyze` 公共一致性核心和窄 profile；结果写现有 facts/quality，发现问题由当前 stage 闭环。
4. review 复用最小当前 packet 和真实 provenance；provider 失败不冒充 pass，无变化不重跑，真实影响变化只做 focused review。
5. 时间/token 按 step/skill/provider/test/review/返工拆解，删除串行提问、重复全文读取、未变化重跑和目标外实验，不设统一预算 gate。
6. 新增 mini-task 精简功能交付流程：可独立启动，或作为 A 的前置交付；紧凑复用四材料，不运行完整五阶段。
7. mini-task 使用 `mini_task.design` 和 `mini_task.implementation` 两个专用审查配置，分别审方案和当前实现，替代同范围普通 review。
8. mini-task 完成后按预授权绑定真实 snapshot 执行 Git 交付；若来自 A，则 merge 目标分支进 A 并从原 stage 普通重调继续。
9. 异源 provider unavailable 最多三次 fresh review；仍失败使用 same-source 子代理降级。缺异源时合并前另行绑定具体风险接受。
10. 全部改造只复用四材料、facts/quality、manifest、requirement-lineage 和七类 public runtime；不恢复旧控制面或新增第五真相。

## make-decision 验收草案

1. 交付五阶段标准规范：每个 stage 都列出标准输入、内部步骤、每步最小 outcome、阶段产物、完成/失败边界和下游交接，并与当前 workflow/skill/handler/test 一致。
2. 每个 manifest step 产生 R-090 最小 outcome；缺失、重复、乱序、stale、skipped、incomplete、unavailable 和依赖未完成均有测试样例。
3. 原始 source ID 可追到 decision、FR/AC、plan/task、实现和当前证据；五阶段 spec-analyze 满足 R-091，不替代专业质量，finding 在发现 stage 留下修复与复检事实。
4. make-decision 能在编码前完成 UI、依赖、角色、用户流程、数据状态、失败恢复、权限、安全、验收、非目标和延期准备；build-spec/plan/code/verify 各自在最早责任点形成 R-053/R-054 所列专业质量。
5. wh-review 的最小 packet、snapshot/provenance、provider failure、finding disposition 和变化触发均有合同测试；失败不变 pass，无变化不重审。
6. monitoring 能按 task→stage→step/skill 用大白话展示名称、状态、实际结果、耗时、token（不可得则 unavailable）、证据、遗漏和退化。
7. 同一样例改造前后比较交互轮数、全文读取、provider 等待、review/test 调用和返工；诊断数据不用作预算 gate。
8. mini-task 使用独立 task/worktree/branch和紧凑四材料；`mini_task.design` 与 `mini_task.implementation` 配置、packet、review fact 独立且替代同范围普通 review。
9. 通用 wh-review 三次异源尝试满足 R-074/R-077/R-085/R-092，五阶段和 mini-task 都复用；same-source fallback 满足 R-086 且不改变 incomplete。mini-task implementation review 额外满足 R-088/R-095；Git 预授权、真实交付、A 进度 commit/merge/受影响复验均有 E2E 证据。
10. 最终状态分别报告需求实现、质量验收、Git 交付和正式 close；任何一层的绿色事实不能覆盖另一层缺口。
11. 每项生产机制满足“职责与删除条件”表的 owner、consumer、替代对象、测试及删除/保留条件，并通过 constitution-checklist。

## Grill

### Batch 1

| grill_id | 挑战场景 | 需要冻结的边界 | 状态 |
| --- | --- | --- | --- |
| G-001 | make-decision 中什么时候需要 scope_revision | 用户纠正：不是修改当前需求；A 因其他依赖/修复未完成而阻塞时，先交付前置功能再继续 A | answered；原问题前提被推翻 |
| G-002 | scope_revision 如何审查 | 用户纠正：它是完整功能交付，方案和实施各做一次独立 scope_revision review，之后提交、合并，并新增专用配置 | answered；需审计实现边界 |
| G-003 | provider unavailable 如何处理 | 用户纠正：属于 wh-review；先临时恢复并按配置做异源审查，3 次失败后使用当前 provider 的独立子代理审查 | answered；需审计同源标识和重试 owner |
| G-004 | 前置功能 B 用什么执行容器 | `2`：专用精简子流程，不走完整五阶段 | answered |
| G-005 | A 有未提交进度时如何安全等待 B 并吸收目标分支 | `1`：明确授权后创建 A 进度 commit | answered |
| G-006 | 三次异源失败后的同源子代理审查能否支持“审查完整/自动合并” | `1`：执行但如实标为非异源 fallback；缺异源时需接受具体风险 | answered |
| G-007 | B 的 commit/merge 如何授权 | `1`：创建 mini-task 时一次预授权计划内操作，最终绑定真实 snapshot | answered |
| G-008 | 专用两次审查与普通 stage review 是否重复 | `1`：专用 design/implementation review 替代同范围普通 review | answered |
| G-009 | 什么功能适合直接使用 mini-task | `1`，并补充用户明确指定的需求也可使用 | answered |
| G-010 | mini-task 用什么当前材料支持两次可信审查 | `1`：紧凑复用四材料，一次形成 | answered |
| G-011 | mini-task 做到一半发现并不小 | `1`：暂停，由用户选择缩小或创建普通任务 | answered |

### Grill 结束记录

- CONTEXT.md：changed；新增 `mini-task` 的唯一领域定义并明确它不是第六 stage、历史 scope_revision 或 continuation。文件：`CONTEXT.md`。
- ADR：created as proposed；文件：`docs/adr/0013-mini-task-compact-delivery-flow.md`。
- ADR 三项判据：难以反转=true（新增长期交付路径和配置合同）；无背景会意外=true（精简流程仍使用四材料和两次审查）；存在真实取舍=true（完整五阶段质量与小功能成本之间取舍）。
- 术语/ADR 冲突：resolved；`scope_revision` 保留为历史同-task材料修订事实，新能力唯一名称为 `mini-task`；不改变 ADR 0008/0009 的历史恢复边界。
- 退出检查：
  - 外部依赖接口：pass；已核实 config loader、wh-review stage/material/schema、3rd-review public request 和 Git/workspace 当前定义。
  - 字段/路径唯一命名：pass；`wh_review.mini_task.design`、`wh_review.mini_task.implementation`、`mini-task` 为唯一新名称，精确 schema 细节由 build-plan 落实。
  - 失败路径/异常语义：pass；三次 fresh 异源失败、same-source fallback、风险接受、范围膨胀、测试失败和 A merge 冲突均有明确处理。
  - 范围边界：pass；做精简四材料/两次审查/测试/Git/A 恢复，不做第六 stage、第五材料、旧状态机或自动任务转换。

## 审查处置

- direction advice：completed；`quality/reviews/reports/56f7833d-dfd1-45b6-aba7-46180a46fa9a.md`。
  - `F-77e3715da06d`：fixed；补成 R-070，明确与 successor/reopen/rebind/continuation/recovery 的区别。
  - `F-d157ed64b2de`：fixed；D-006/R-070 明确只恢复 task 内修订语义，复用 `spec-specify`，不恢复专用 review/runtime。
  - `F-a331f4bcf95f`：fixed；补成 R-071，明确增量引用/差异比对优先，无法安全确定才读完整当前材料。
  - `F-135b0f02f`：rejected as already covered，接受 packet 表达改进；UI、provider 失败和完成/质量/Git/close 已分别由 R-044、R-037、R-052 及历史故障映射覆盖。
- focused direction advice：completed；`quality/reviews/reports/529e6939-64c0-4bdd-ac2c-97035baba71d.md`。
  - `F-ba035f674104`：fixed and scope-corrected；R-086 明确通用 wh-review 的 same-source fallback 在带风险交付前必须绑定当前风险接受。
  - `F-470caa85597d`：fixed and scope-corrected；R-085 明确通用 wh-review 的三个 fresh public requests，不是 continuation。
  - `F-99ab2ac8d3ec`：fixed；R-087 定义精简四材料最低标准。
  - `F-b4f1ec80967b`：fixed；R-089 区分普通 stage 重新调用与禁用 continuation。
  - `F-dff74dcd11d4`：fixed；R-088 定义实施审查的测试和 AC 证据。
- detail advice：completed；第二次有效当前材料审查为 `quality/reviews/reports/7febf4f4-d254-45f6-ac75-1b35cafde0e0.md`。按 single-round 规则处理 finding 后不为追求空结果再次调用。
  - 首次 attempt `quality/reviews/reports/c4cf428d-506b-497c-957a-3ee3152553ba.md`：semantic available，但 packet 只给摘要导致 detail 覆盖不足；不是 runner 的 MATERIAL_INCOMPLETE/unavailable。其 findings 作为直接材料缺口接受，补齐完整 decision-log/Grill 后产生第二个新 attempt。
  - `F-122b296a0853`：fixed；补齐 Grill 结束记录，并在重审 packet 中提供完整 decision-log。
  - `F-705622561add`：fixed；R-090 定义最小 step outcome。
  - `F-949c2cc5a9ab`：fixed；R-091 定义 spec-analyze 边界和当前 stage 闭环记录。
  - `F-a86758def988`：fixed；R-087 已枚举精简四材料最低合同，重审提供完整锚点。
  - `F-74a8d177eae6`：fixed and scope-corrected；R-092 定义通用 wh-review 哪些终态计入三次异源失败。
  - `F-735e73e37e01`：rejected as packet omission；R-016 已授权 build-plan analyzer，R-076/D-013 已授权两个 mini-task 配置；重审提供完整 decision-log。
  - `F-0a21991a58c4`：fixed；纠正首次 attempt 分类，不再把“覆盖不足”写成 runner unavailable，也不丢弃其真实 findings。
  - `F-1afe6029123c`：fixed；文档结果同步 CONTEXT/ADR 当前事实。
  - `F-6747936e2071`：fixed；新增完整验收草案、机制职责/consumer/测试/删除条件，覆盖 R-028/R-045/R-052～R-054。
  - `F-6d55c62cc52f`：fixed；顶部状态同步到 detail findings 收尾和最终确认 pending。
  - `F-7ca35cbe56d3`：fixed then extended；当时 OPEN-008 改为 R-001～R-094；本次完整性审计进一步扩展到 R-001～R-097，并明确编号连续不等于语义覆盖。
  - `F-b402f02d521f`：fixed；D-005 正文明确 superseded，不再把 make-decision 方向变化记为 revision。
  - `F-e5d149e93cc6`：fixed；D-007/D-008 明确 closed by 新决定，R-093 冻结独立 task/worktree/branch。

## 最终确认

- 状态：accepted
- 用户原文：`好的，确定一下“新流程必须检查需求的实际语义和产物证据，不能只检查编号或文档存在。”是否在计划内？没问题就可以继续了`
- 绑定解释：该要求已由 R-021/R-068/R-091/R-096 和 make-decision 验收草案覆盖；用户在得到明确答复后授权继续，因此确认 R-001～R-097、D-001～D-016、五阶段标准规范、三个历史 task 七项审计裁决、通用 wh-review 恢复、mini-task、实施顺序、风险/延期、CONTEXT 更新和 proposed ADR 0013 作为 build-spec 输入。
- 非授权边界：本确认不授权 commit、push、merge、archive 或 cleanup。

## 宪法检查结论

- F1/F2/F8：pass；五阶段公共核心保持薄，重活在 stage skill/mini-task workflow，接口只传四材料、facts 和 review packet。
- F3/F6/F9：pass；四材料仍是当前真相，正式写入绑定真实 task/worktree/snapshot，不用旧记录或 fallback 假绿。
- F4/F5/Q1/Q2：pass；finding 不锁死当前修复，也不删除质量工作；没有新增推进许可证，完成、质量和交付分开。
- F7：pass with implementation obligation；mini-task 创建时的 Git 预授权必须是独立 authorize 动作并绑定明确对象/范围，不得由阶段确认顺带授权。
- F10：pass；新增机制均有真实历史故障、consumer 和删除条件，成本证据只诊断不作 gate。
- Q3：pass with implementation obligation；same-source 子代理只作降级建议，缺异源时必须披露并由用户接受当前风险，不能写成异源 verdict。
- S1～S6/S8：pass；复用现有 skills、3rd-review、facts、lineage 和外部 grilling，新增 skill 保持可搬运并进入统一指标。
- S7：pass with implementation obligation；mini-task 是独立 workflow/skill/folder，不是第六 stage；五个正式 stage 的一阶段一技能关系不变。

## 质量边界

- 质量事实：一致性分析、测试和 review 只记录真实事实。
- 推进资格：当前四材料可读即可继续同 task 工作。
- 完成判据：不能在关键需求、测试或真实 review 事实缺失时宣称完成。
- 不可逆授权边界：commit、push、merge、archive、cleanup 均需独立明确授权。

## 文档结果

- CONTEXT.md：changed；新增 `mini-task` 唯一领域定义，文件 `CONTEXT.md`。
- ADR：created as proposed；`docs/adr/0013-mini-task-compact-delivery-flow.md`，随最终用户确认接受或调整。
