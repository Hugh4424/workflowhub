# WorkflowHub 薄核心重构规划：Decision Log

## 任务身份

- **任务类型**：规划任务
- task_id：workflowhub-thin-core-rebuild-planning-20260919
- 当前工作：按现行 WorkflowHub 执行 make-decision，与用户梳理完整需求，再接 build-prd。
- 当前状态：Round 1/2已完成；首次方向review红蓝unavailable且当时未重试。主会话已检查当前OI与审查缺失事实，未发现新的high/medium方向问题，以0题结束Round3。没有Round3 ask/wait/reply/resume事件；固定生命周期合同冲突仍披露。make-decision仍in_progress；主会话完成零问题Grill事实核对，未发现必须追加的方向选择。Grill最小结论已形成step9完整方向草案，标drafted。detail review首次执行同样unavailable（result_ref=null、coverage=incomplete）。审查协议的两个独立根因已定位并完成F1–F7修复与离线验证；修复后方向审查按material_changed重跑已取得可消费结果（红蓝均available、coverage=satisfied，11条findings、无blocking），方向级争议待Talk round 4；detail审查已按同一依据重新执行并同样取得可消费结果（红蓝均available、coverage=satisfied，26条findings），其方向级争议与方向审查一并待Talk round 4。最终确认和阶段完成尚未执行。
- 原始要求来源：当前用户会话；下文逐字保留用户八点思路与最新执行指令。研究结论和助手建议不是用户已确认方案。

## 材料导航

| 章节 | 摘要 | 读取时机 |
| --- | --- | --- |
| 原始需求 | 用户八点全文、目标与当前执行指令 | Talk、研究、Grill、方向覆盖核对 |
| 当前范围与边界 | 仅规划，不实现新框架 | 派发与范围变化前 |
| 唯一 OI 大纲 | 六框架节点、六方向类别与待决问题 | 所有后续问答、研究、审查 |
| 背景资料与来源区分 | 审计及已有独立研究引用 | 有针对性补充事实时 |
| 执行准备与交互记录 | 当前真实执行状态 | 恢复会话、阶段末披露 |

## 原始需求

| requirement_id | 原始需求 | 五维覆盖 | 处置 | 关联决定 |
| --- | --- | --- | --- | --- |
| R-001 | U-001 第1点：spec 优化、build-spec/build-plan 合并、真实验收 | goal / flow_or_surface / success_failure_acceptance | covered | D-001、OI-001、OI-004 |
| R-002 | U-001 第2点：删除 plan/tasks、每 phase 一个实现文档 | flow_or_surface / data_or_state | covered | OI-001、OI-003（文档形态经 U-009 改为一份权威 spec + phase 差异） |
| R-003 | U-001 第3点：真实可转 green 的 RED | success_failure_acceptance | covered | OI-004 |
| R-004 | U-001 第4点：子代理隔离、主会话协调、可并行 | flow_or_surface / data_or_state | covered | OI-002（经 U-009 扩大到全部阶段） |
| R-005 | U-001 第5点：替换实现与验证审查链 | success_failure_acceptance / flow_or_surface | covered | OI-005（有证据门槛的对比实验 + fallback） |
| R-006 | U-001 第6点：不建 token/时间统计机制 | constraint_non_goal_defer | covered | OI-006 |
| R-007 | U-001 第7点：弱化严格验收、消除阻塞 | success_failure_acceptance / goal | covered | OI-004 |
| R-008 | U-001 第8点：薄核心多技能、删除臃肿对象与流程 | constraint_non_goal_defer / data_or_state | covered | OI-003、OI-006 |
| R-009 | U-002：先 worktree、make-decision、后 build-prd、逐任务实施 | flow_or_surface / constraint_non_goal_defer | covered | OI-001、OI-007 |
| R-010 | U-002：大白话交互、主会话只派发与交互技能 | flow_or_surface / constraint_non_goal_defer | covered | OI-002（经 U-009 扩展到全部阶段） |
| R-011 | U-005：八点仅粗略候选，需要独立诊断与备选比较 | goal / success_failure_acceptance | covered | 全部 OI；三路调研 + 本轮扩散调研 |
| R-012 | U-005：Round2 两个局部 A 选择 | success_failure_acceptance / constraint_non_goal_defer | covered | OI-005、OI-007 |
| R-013 | U-006：继续 make-decision，不是批准架构 | flow_or_surface | covered | 仅授权继续，不新增方案 |
| R-014 | U-007：方法工具包产品定位 A | goal / data_or_state | covered | OI-009 |
| R-015 | U-009 第1点：所有阶段都派子代理 + 计划并行，主会话只派发回收 | flow_or_surface / constraint_non_goal_defer | covered | OI-002（新增，非八点原项） |
| R-016 | U-009 第2点：审查次数为每 phase + 全 phase 结束 + verify-code，只换工具 | success_failure_acceptance / flow_or_surface | covered | OI-001、OI-005（纠正此前写窄的结论） |
| R-017 | U-009 第3点：CPU/温度必须优化并定位原因 | success_failure_acceptance | covered | OI-011 |
| R-018 | U-010 第1点：彻底移除质量/流程阻塞，薄核心无任何阻塞 | flow_or_surface / constraint_non_goal_defer | covered | OI-012 |
| R-019 | U-010 第2点：删除哈希/快照/身份/材料/回执校验机器，推进/审查/测试不依赖 | flow_or_surface / data_or_state | covered | OI-013 |
| R-020 | U-010 第3点：build-plan 一次合并审查覆盖 spec+phase 文件 | flow_or_surface / success_failure_acceptance | covered | OI-014 |

### U-001：用户八点思路（全文）

我的思路：
1：spec优化，build-spec和build-plan合并成一个build-plan阶段，在这个阶段产出一个spec文档和多个phase文档，spec文档需要包含更标准的需求文档、验收流程、测试标准、架构方案等，相当于spec文档是把decision-log进行完整的实现所进行的翻译，需要结构更清晰、内容更清楚、验收更明确，避免出现所有phase做完了，但是一次真实测试验收都没做过，一直在用脚本验收，功能实现的完全不合理。
2：plan去除，不在需要plan和tasks文档，而是每一个phase一个实现文档，里面要写清楚背景、方案、流程、影响范围、测试标准、验收流程等等。要避免现在task文档的问题，也要有更清晰的实现指引。一个phase一个文档也能避免agent上下文爆炸；
3：TDD流程优化，现在的tdd完成是token和时间浪费机，对任务实现帮助非常少。需要更专业更有用的TDD流程，不要再写出完全没意义的red了，需要基于每一个task写真实的red，后续这个red也能基于实现完成的代码变成green。要让TDD的每一个token花的有意义；
4：build-code提速：每一个task的实现、审查、测试、修复应该是一个独立的子代理，避免上下文互相影响。主会话收集回复、派发任务、进行归纳和验收。同时，多个子代理、多个task、多个phase还可以设计并行规则，避免全部子代理都只能串行浪费时间！
5：审查效果提升，不再用wh-review里面的审查提示词和3rd-review进行build-code或verify-code审查了，而是改成类似“https://github.com/alibaba/open-code-review”的开源代码审查工具进行，保证代码审查质量更高，并且不在因为审查浪费这么长时间。
6：简化流程，不要浪费任何机制统计token、时间等，我需要workflowhub是一个简单好用的框架，不是一个复杂的流程制造机；
7：弱化所有流程中的严格验收！我已经花了十几个task优化阻塞问题，现在workflowhub还是充满了阻塞，根本不能用，烦死了。
8：简化workflowhub：workflowhub现在被一大堆对象、测试文件搞得非常臃肿，最开始设计的宪法完全没生效。有一点问题，agent就搞一大堆严格验收、新对象、新标准、新流程，让这能workflowhub非常难以维护，宪法里的最坏事件在当前workflowhub完美体现了。我需要彻底优化整个workflowhub，不要搞这么多流程、质量、文件！改成薄核心+多技能的项目规划！
请你基于这些思路和你的调研建议，看看合不合理，如何优化？我希望这一次方案实现后，再也不要来来回回的优化workflowhub了！太烦人了

### U-002：最新执行指令（全文）

整个任务非常复杂，我希望然后现在按标准 WorkflowHub 开始这个规划任务，先创建worktree，然后从 make-decision 开始，不要跳阶段，方便后续接上build-prd产生一个完整的prd文档，方便我后续逐任务实施。先基于原始需求，在make-decision的过程中和我一起仔细梳理完整需求流程，Talk 和grill请用大白话说明选项、后果和风险。注意主会话只进行子代理任务派发和交互类技能的执行，不要进行大量阅读和执行任务，保证主会话上下文控制和执行质量。

### U-003：本轮用户真实回复（全文）

1：这个问题不应该问，在make-decision最开始的时候已经有相关分流了，由人工决定是规划任务还是普通任务；2：A

来源：本轮用户消息，由主会话传递给材料写入子代理。首题是纠正和撤回，绝不登记为用户选择 A 或 B；第二题真实选择 A。宿主未提供 reply_ref/reply_hash，因此没有可声明的宿主认证凭证；本记录只保留真实会话来源，不补造字段。

### U-004：当前交互方式约束

来源：主会话传递的用户最新交互指令。后续 Talk 和 Grill 用聊天文字提问，禁止使用 Codex 提问工具；大白话说明选项、后果和风险。此约束不等于用户预先回答任何后续问题。

### U-005：Round 2 真实回复与研究纠正（全文）

1：A；2：A。现在有很严重的问题，你完全是依赖我给你的需求进行方案设计，这只是我的一些粗略的想法，你完全没有去调研之前我给你的调研材料，也没有去调研workflow hub现在的问题。也没有去调研外部，完全就是我给你什么，你就做什么。等于这个整个改进的上限还是基于我的经验，这完全不够呀，调研非常不够！方案深度也不够！

来源：本轮用户消息，由主会话交给唯一材料写入代理。Q1=A：原审查工具不可用时，采用一次由未参与实现者执行的独立替代审查。Q2=A：新流程优先，历史只读；未完成旧任务不要求自动兼容。二者是局部真实选择，不表示用户批准整体架构或原八点全部方案。

用户纠正的当前效力：原八点是粗略候选，不是完整获批方案，也不是最终需求边界。必须基于原审计、冻结执行证据、当前实现和外部一手研究独立诊断、比较备选方案，并可挑战或否定用户候选；不能只寻找支持原想法的证据。主会话已停止继续提问，直到新研究出现实质结果。同一任务返回 research-inputs 补充深度，暂停方案收敛；不新建任务、不重启流程、不宣称 Round 2 或整体方向已收敛。

### U-006：继续授权（全文）

好的，继续

来源：本轮用户真实消息，由主会话传递。含义仅为继续当前 make-decision 和基于新研究的下一批 Talk；不是批准研究推荐架构，不是选择宿主技能包或独立平台，不是批准原八点整体方案，也不授权提前实施、review、Grill、build-prd 或阶段完成。

### U-007：Round 2 group 2 产品定位选择（真实回复全文）

A

来源：本轮用户真实消息。主会话已用聊天文字提出 OI-009 产品定位问题，真实等待后收到本条A并恢复；这里只记录选项的最小决策含义，不复制完整问题卡、不新增交互archive或ledger、不补造宿主reply_ref/hash。

本次选择的方法工具包定位：当前AI助手及子代理按方法完成工作，WorkflowHub提供必要工具；通过实际改动、测试、审查说明结果，不再逐阶段专门认证。跨会话或不同助手接续依赖清晰记录与读取，不提供每一步强制机器认证；保留工作区安全、危险操作授权、真实测试、独立审查和如实披露。

批准边界：只确认产品定位及该卡直接表达的能力取舍，不等于批准原八点、具体阶段数、材料组织、每task开代理或OCR选型，也不是make-decision最终批准或实施授权。

### U-008：用户对任务拓扑的权威纠正（全文）

规划任务只有make-decision → build-prd，后续每个任务是单独的make-decision → build-plan → build-code → verify-code，你别搞错了

本条立即覆盖此前草案中的错误串行路径。规划任务只产出完整PRD与任务地图，不进入build-plan/build-code/verify-code；后续每个实施任务都是独立task。撤回把规划任务继续串入实现阶段的草案，不把纠正视为新增确认要求。

### U-009：最新三条要求（全文要点）

1. **不止 build-code，所有阶段都要"派子代理 + 并行设计"**：`make-decision`、`build-prd`、`build-plan`、`verify-code` 都要用同一套工作方法——主会话不要一直干活，把工作尽量派给子代理；能并行的尽量并行；主会话只负责**派发、回收和交互类技能**；保证主会话上下文干净，**减少自动压缩次数**。
2. **审查次数纠正（此前的收敛写窄了）**：审查不是"build-code 和 verify-code 各一次"，而是**每个 phase 一次 + 所有 phase 结束一次 + verify-code 一次**，与现在一致；只是把 `wh-review` 换成新的代码审查工具。
3. **CPU/温度必须优化**：现在一旦开始 WorkflowHub 任务，电脑超过 80 度、风扇超过 5000 转。要求查出是哪个进程导致（是否 kernel）并尽可能优化。

来源：本轮用户真实消息。第 2 条是对既有 OI-001/OI-005 收敛结论的**纠正**（此前把审查范围写成"只在两个阶段各一次"属收窄）；第 1 条扩大 OI-002 到全部阶段；第 3 条登记为 OI-011。

### U-010：三条新需求（2026-09-19，用户真实消息全文）

> 1：workflowhub任务执行时，大量的质量、流程阻塞，我希望彻底移除。workflowhub是一个薄核心的开发技能集，不应该有任何阻塞；
> 2：workflowhub任务执行时，大量哈希、sha、快照、身份、材料、回执校验不对的问题，导致任务无法推进，也需要进行处理。workflowhub不需要这些过度工程化的东西来保证交付质量。每个阶段的推进、审查、测试的推进都不需要这些东西来保证质量。
> 3：build-plan流程修改后，build-plan的审查也需要对应的修改，一次审查同时覆盖spec和phase文件。包含spec审查和原来的plan审查质量核心。
> 如果这些问题没有包含在prd内，需要回到make-decision看看如何把这两个需求也放在prd里一起彻底解决。

来源：本轮用户真实消息。覆盖核查结论：①半覆盖（FR-04/AC-04/SD-15 已有，但加固修订引入了新前置冲突）；②③未覆盖。

### 原始要求覆盖索引

| requirement_id | 原始要求 | 五维覆盖 | 当前处置 |
| --- | --- | --- | --- |
| R-001 | U-001 第1点：阶段合并、spec质量、真实验收 | business_goal / flow_or_surface / success_failure_acceptance | 用户粗略候选；OI-001、OI-004 待完整梳理 |
| R-002 | U-001 第2点：删除plan/tasks、每phase独立文档 | flow_or_surface / data_or_state / constraint_non_goal_defer | 用户粗略候选；OI-001、OI-003 待完整梳理 |
| R-003 | U-001 第3点：真实可转green的red | success_failure_acceptance / business_goal | 用户提出目标与候选；OI-004 待确定适用边界 |
| R-004 | U-001 第4点：子代理隔离、主会话协调、可并行 | flow_or_surface / data_or_state / constraint_non_goal_defer | 用户粗略候选；OI-002 待确定职责与失败恢复边界 |
| R-005 | U-001 第5点：替换实现与验证审查链 | success_failure_acceptance / flow_or_surface | 替换为用户粗略候选，具体工具未选定；独立替代审查处置已选择；OI-005 |
| R-006 | U-001 第6点：不建token/时间统计机制 | constraint_non_goal_defer / business_goal | 用户明确约束；OI-006 覆盖其他要删除的治理负担 |
| R-007 | U-001 第7点：弱化严格验收、消除阻塞 | success_failure_acceptance / business_goal | 用户明确痛点与目标；OI-004 待确定真实结果与非阻塞边界 |
| R-008 | U-001 第8点：薄核心多技能、删除臃肿对象测试流程 | constraint_non_goal_defer / data_or_state / business_goal | 用户明确方向；OI-003、OI-006 |
| R-009 | U-002：先worktree、make-decision、后build-prd、逐任务实施 | flow_or_surface / constraint_non_goal_defer | 当前执行授权；OI-001、OI-007 |
| R-010 | U-002：大白话交互、主会话只派发与交互技能 | flow_or_surface / constraint_non_goal_defer | 当前执行约束；OI-002 |
| R-011 | U-005：八点仅粗略候选，需要超出个人经验的独立诊断与备选比较 | business_goal / flow_or_surface / data_or_state / success_failure_acceptance / constraint_non_goal_defer | 原审计、冻结原件、当前实现、外部研究交叉检验；全部OI重新用于研究，不预设候选成立 |
| R-012 | U-005：Round2两个局部A选择 | success_failure_acceptance / constraint_non_goal_defer | T-003独立替代审查；T-004新流程优先、未完旧任务不要求自动兼容；不代表整体收敛 |
| R-013 | U-006：继续make-decision，不是批准架构 | flow_or_surface / constraint_non_goal_defer | 仅授权恢复Round2；不能用这句代替U-007真实选择 |
| R-014 | U-007：方法工具包产品定位A | business_goal / flow_or_surface / data_or_state / constraint_non_goal_defer | OI-009已获局部真实选择；关联OI-001/006后续方案以此为边界，具体设计仍未批准 |
| R-018 | U-010 第1点：彻底移除质量/流程阻塞，薄核心无任何阻塞 | flow_or_surface / constraint_non_goal_defer | 用户真实需求；Talk round 5 问1已收敛为只留两道人为门（推进确认对话、不可逆 Git 授权），其余机器门禁全删；OI-012 |
| R-019 | U-010 第2点：删除哈希/快照/身份/材料/回执校验机器，推进/审查/测试不依赖 | flow_or_surface / data_or_state | 用户真实需求；Talk round 5 问2已收敛为彻底全删，记录层用普通文件名+纯文本引用；OI-013 |
| R-020 | U-010 第3点：build-plan 一次合并审查覆盖 spec+phase 文件 | flow_or_surface / success_failure_acceptance | 用户真实需求；Talk round 5 问3已收敛为一次合并审查，两类质量核心合一；OI-014 |

## 范围

本任务是规划任务：完整梳理重构后的用户流程、职责、成功与失败边界、保留和删除的能力、风险与后续实施拆分。当前只进入现行 make-decision；后续在真实方向确认后按现有 build-prd 工作流形成完整 PRD，供另行逐任务实施。

当前不修改 WorkflowHub 生产代码，不实现新框架，不把目标方案提前作为本次执行规则，不创建新正式阶段。既有主工作区未提交内容保持原样；不 stash、不 commit、不 merge、不 push、不清理用户文件。本次没有授权物理 close。

用户八点原文完整保留，但按 U-005 必须作为粗略候选重新评估，不能当作已批准方案或需求上限。审查工具不可用时一次独立替代审查、新流程优先且未完成旧任务不要求自动兼容，为本轮局部真实选择；总体方案、职责拆分、流程形态、材料数量、真实验收与删除范围仍开放。需独立发现用户未提出的问题和更优方案，助手建议不得自动变成已确认选择。

U-010 三条（阻塞边界、校验机器删除、build-plan 合并审查）纳入本规划范围，由 PRD 加固第二轮承接。

## 非目标

不做独立后台执行平台，不保留通用阶段事实图或跨宿主自动恢复；不建 token 或时间统计机制；不为未完成旧任务建永久兼容；完全不碰 UI（不新增页面或仪表盘，也不改动既有交互展示与数据状态）；不在本次规划内实现新框架，不新增第五份材料、public command 或持久对象。

## 唯一 OI 大纲（current authority）

- **framework**：functional
- **选择理由**：本任务改变完整开发工作流，以背景、问题、目标、方案、验收、扩展串起用户流程；外部工具研究作为方案节点的输入。
- **outline_version**：outline-r2-group2-20260919
- 本节是唯一 OI 来源。OI 保留尚未整体收敛的开放问题；已确定的子结论见 T 表，不重复询问。开放 OI 不等于本轮必须继续提问，也不表示用户尚未提出方向。主会话先消化已有明确回答，只把仍会改变方向的问题交给用户。

### Framework nodes

| node_id | framework_node | oi_ids | empty | reason |
| --- | --- | --- | --- | --- |
| N-background | background | OI-001, OI-006, OI-009 | false | 用户审计与八点思路给出背景，需转为完整工作流目标 |
| N-problem | problem | OI-002, OI-004, OI-006 | false | 上下文污染、形式测试、审查和治理阻塞是问题来源 |
| N-goal | goal | OI-001, OI-004, OI-009 | false | 需要高质量、低等待、低维护且能真实交付的用户结果 |
| N-solution | solution | OI-001, OI-002, OI-003, OI-005, OI-009, OI-010 | false | 阶段、材料、子代理、审查工具方向需共同收敛 |
| N-acceptance | acceptance | OI-004, OI-005, OI-011 | false | 真实验收与审查结果应能识别失败，避免过程记录冒充成功 |
| N-extension | extension | OI-007, OI-008 | false | 后续实施与页面范围、迁移和延期边界需要明确 |

### Fixed categories

| category | oi_ids | empty | reason |
| --- | --- | --- | --- |
| complete_user_flow | OI-001, OI-002, OI-009, OI-010 | false | 端到端流程与子代理协调是核心方向 |
| page_scope | OI-008 | false | 用户未明确要求新增页面，需核实现有交互和最终范围 |
| data_state | OI-003 | false | 材料、执行事实、历史与并行结果的权威关系需要明确 |
| success_failure_boundary | OI-004, OI-005, OI-011 | false | 真验收、审查不可用、失败与继续修复的边界需要明确 |
| non_goals | OI-006 | false | 用户明确拒绝统计与过度治理，其他删除/保留边界待梳理 |
| deferred | OI-007 | false | 当前只做规划，后续逐任务实施的依赖与延期项待定义 |

### OI records

```json
{
  "ois": [
    {
      "task_id": "workflowhub-thin-core-rebuild-planning-20260919",
      "outline_version": "outline-r2-group2-20260919",
      "oi_id": "OI-001",
      "category": "complete_user_flow",
      "source": "U-001 第1、2点；U-002；U-003；T-001；U-005；U-007；T-006；B-005/B-006/B-008",
      "question": "从真实任务依赖和用户结果出发，哪些工作方法或固定步骤应保留、合并或删除，各自有哪些证据和代价？",
      "resolution": "已收敛（Round 3）：保留规划任务两阶段与实施任务四阶段拓扑、入口手工选择任务类型；删除固定 Talk 轮次与 14 步顺序锁定、stage completion 通用认证、plan.md/tasks.md 双写及只保护流程形状的测试。发散不新增轮次，并入第一轮 Talk、调研与方向审查。文档形态为一份权威 spec + 每个 phase 只写本检索边界内的差异 + 常驻紧凑索引。具体文件与消费者由 build-plan 核查。 纠正（U-009 第 2 条）：审查次数保持现状不变——每个 phase 一次 + 所有 phase 结束一次 + verify-code 一次，只把 wh-review 换成新的代码审查工具，不再按“删除每 Phase review”处理。",
      "status": "confirmed",
      "reopen_provenance": "用户新增：spec 需作为实施前翻译（需求文档/验收流程/测试标准/架构方案），并新增每 phase 一份实现文档，文档形态结论被推翻。",
      "impact_dimensions": [
        "goal",
        "scope",
        "acceptance"
      ],
      "selected_disposition": "保留规划两阶段与实施四阶段拓扑、手工选任务类型；删除固定轮次与逐阶段认证",
      "evidence": "U-009 第2条与 OI-001 resolution；decision-log.md#范围",
      "acceptance": "completion 拓扑与删除范围已写入材料并被用户确认",
      "counterexample": "仍按固定 Talk 轮次或逐阶段机器认证组织工作",
      "requires_user_decision": true,
      "visible_group_id": "talk-round-4-group-2"
    },
    {
      "task_id": "workflowhub-thin-core-rebuild-planning-20260919",
      "outline_version": "outline-r2-group2-20260919",
      "oi_id": "OI-002",
      "category": "complete_user_flow",
      "source": "U-001 第4点；U-002；U-005 研究深度纠正",
      "question": "真实任务为何串行或上下文重复，怎样安排实现、测试、审查与修复才能减少等待且不转移协调成本？",
      "resolution": "已收敛（Round 3，经 U-009 第 1 条扩大到全部阶段）：make-decision、build-prd、build-plan、build-code、verify-code 都采用同一工作方法——按工作类型派发实施、测试、审查等子代理且各自独立上下文；修复回到实施子代理连续完成；主会话只做派发、回收与交互类技能，不做大量阅读或编辑，以保持主会话上下文干净并减少自动压缩次数。并行规则在计划阶段产出：先冻结接口蓝图（文件级符号与 import 图），再做依赖感知调度，保留中心化验证瓶颈，worktree 隔离并设硬并发上限（起始 3-5），只给输入、写集、环境独立的工作。",
      "status": "confirmed",
      "reopen_provenance": "用户新增：并行须在计划阶段设计，可并行 2–5 个子代理；并新增每 phase 一文档以避免上下文爆炸的上下文控制要求。",
      "impact_dimensions": [
        "goal",
        "scope",
        "acceptance"
      ],
      "selected_disposition": "全部阶段按工作类型派子代理，计划阶段产出并行规则，主会话只派发与回收",
      "evidence": "U-009 第1条；OI-002 resolution",
      "acceptance": "每个阶段都给出派发与并行方案，主会话不承担大量读写",
      "counterexample": "回到每 task 单代理串行或让主会话自己干活",
      "requires_user_decision": true,
      "visible_group_id": "talk-round-4-group-2"
    },
    {
      "task_id": "workflowhub-thin-core-rebuild-planning-20260919",
      "outline_version": "outline-r2-group2-20260919",
      "oi_id": "OI-003",
      "category": "data_state",
      "source": "U-001 第1、2、8点；U-005 研究深度纠正；B-005/B-006/B-008",
      "question": "框架产品定位明确后，哪些当前代码与真实执行结果必须可靠保留，哪些文档协议和重复证明可以删除而不损害实际使用？",
      "resolution": "已收敛（Round 3）：必须可靠保留真实命令 exit/output、原子写入、不可逆授权、失败与缺口事实、历史只读；删除多层重复 evidence 包装与 task kernel/fact graph 对日常工作的强制依赖。删除通用事实引擎前必须先承认真实损失清单（自动拒绝错绑或过期证据、跨宿主此答复批准此版本、跨宿主自动恢复与机器可查阶段状态），并在需求确证后再决定保留哪些窄能力。具体删除清单由 build-plan 核查。",
      "status": "confirmed",
      "reopen_provenance": "用户新增：文档形态改为实施前翻译的 spec 加每 phase 一份实现文档，删除/保留边界需随之重评。",
      "impact_dimensions": [
        "scope",
        "acceptance"
      ],
      "selected_disposition": "保留真实命令证据、原子写入、授权与失败事实；删除重复证据包装与 fact graph 强制依赖",
      "evidence": "OI-003 resolution；architecture-diagnosis.md",
      "acceptance": "保留清单与删除面写入材料，删除前承认损失清单",
      "counterexample": "把旧引擎换名搬进技能或被删能力无替代",
      "requires_user_decision": true,
      "visible_group_id": "talk-round-4-group-2"
    },
    {
      "task_id": "workflowhub-thin-core-rebuild-planning-20260919",
      "outline_version": "outline-r2-group2-20260919",
      "oi_id": "OI-004",
      "category": "success_failure_boundary",
      "source": "U-001 第1、3、7点；U-003；T-002；U-005",
      "question": "真实失败链中哪些验证能发现功能问题、哪些只证明流程合规，怎样明确成功、失败和条件不可用而不冻结正常修复？",
      "resolution": "已收敛（Round 3）：验收标准在 make-decision 就写成可执行形式（条件→系统必须做什么 + 可度量成功标准 + 至少一条失败或边界场景，写不出标 incomplete）；只有真实入口联通实跑才能宣称整体完成；代码审查不等于功能验收；验收 oracle 与实现者分离（测试目录对实现者只读或隐藏），通过条件必须包含改动前是红的，并保留 trace/JUnit/跳过计数等机器产物，缺产物即失败；真实测试失败必须修复复验；测试与验收类技能必须被实际执行且执行事实被记录。",
      "status": "confirmed",
      "reopen_provenance": "用户新增：真实验收与测试必须真正执行，禁止只有脚本测试；多个测试技能从未被正常使用，验收机制结论需重建。",
      "impact_dimensions": [
        "goal",
        "acceptance"
      ],
      "selected_disposition": "验收标准在 make-decision 写成可执行；只有真实入口跑通才算完成",
      "evidence": "U-009 第2条；OI-004 resolution",
      "acceptance": "每条需求有条件→行为、可度量成功标准与失败场景",
      "counterexample": "把脚本测试或审查 unavailable 当成通过",
      "requires_user_decision": true,
      "visible_group_id": "talk-round-4-group-3"
    },
    {
      "task_id": "workflowhub-thin-core-rebuild-planning-20260919",
      "outline_version": "outline-r2-group2-20260919",
      "oi_id": "OI-005",
      "category": "success_failure_boundary",
      "source": "U-001 第5点；U-005 研究深度纠正",
      "question": "不同审查方案的实际能力、失败边界、成本与替代条件有何证据，怎样避免只凭厂商宣称或用户候选选工具？",
      "resolution": "已收敛并经 U-009 第 2 条纠正：审查覆盖面保持现状——每个 phase 一次、所有 phase 结束一次（集成）、verify-code 一次；变化只在把 wh-review 换成新的代码审查工具，不减少审查次数。单次审查成功后不再为同一 scope 复审；审查提出的问题照单修复。换工具先做有证据门槛的对比实验并保留 fallback；工具 unavailable 时一次独立替代审查，再不可用如实披露。",
      "status": "confirmed",
      "impact_dimensions": [
        "scope",
        "acceptance"
      ],
      "selected_disposition": "审查每 phase 一次 + 全 phase 结束一次 + verify-code 一次，成功后不复审，工具替换先做对比实验",
      "evidence": "U-009 第2条；OI-005 resolution",
      "acceptance": "审查次数与工具替换门槛写入材料",
      "counterexample": "减少审查次数或未实测就删旧路径",
      "requires_user_decision": true,
      "visible_group_id": "talk-round-4-group-3"
    },
    {
      "task_id": "workflowhub-thin-core-rebuild-planning-20260919",
      "outline_version": "outline-r2-group2-20260919",
      "oi_id": "OI-006",
      "category": "non_goals",
      "source": "U-001 第6、7、8点；U-005；U-007；T-006；B-006/B-007/B-008",
      "question": "哪些核心职责和技能义务应保留或删除，各自保护什么真实能力、增加什么维护负担？",
      "resolution": "已收敛（Round 3）：保留可搬运技能与 5 项窄工具（工作区或范围核对、真实命令采集、安全写入、不可逆 Git 授权、冲突中断保护）；删除通用完成对象与 kernel/fact graph 强制依赖；旧 wh-review/broker 退出正常审查路径，历史只读保留，不许换名搬进 Skill。新增约束：测试与验收类技能必须被实际执行并留下执行事实；每项新增规则必须给出当前缺陷或用户结果理由，不得只换存放位置。",
      "status": "confirmed",
      "reopen_provenance": "用户新增：测试/验收类技能必须被正常使用，技能义务与保留删除范围需重评。",
      "impact_dimensions": [
        "scope",
        "acceptance"
      ],
      "selected_disposition": "保留可搬运技能与 5 项窄工具；删除通用完成对象与 kernel 强制依赖",
      "evidence": "OI-006 resolution",
      "acceptance": "保留与删除职责写明，测试技能必须真被执行",
      "counterexample": "新增只换存放位置的控制面",
      "requires_user_decision": true,
      "visible_group_id": "talk-round-4-group-2"
    },
    {
      "task_id": "workflowhub-thin-core-rebuild-planning-20260919",
      "outline_version": "outline-r2-group2-20260919",
      "oi_id": "OI-007",
      "category": "deferred",
      "source": "U-001 第8点；U-002；U-005 研究深度纠正",
      "question": "新流程、未完成旧任务与历史记录怎样划分处理范围，如何分步交付完整可用能力？",
      "resolution": "已收敛：新流程优先；未完成旧任务与历史完全不管、一律只读，不产交接记录、不做兼容、不借迁移删除用户文件；新流程任务的接续只留窄状态集（not-started/in-progress/succeeded/failed/blocked/unverified/abandoned）与记录完整性回读，不重建 fact graph 或恢复平台。",
      "status": "confirmed",
      "impact_dimensions": [
        "scope",
        "acceptance"
      ],
      "selected_disposition": "新流程优先；未完成旧任务与历史完全不管、只读",
      "evidence": "U-005 Q2；OI-007 resolution",
      "acceptance": "旧任务边界与新任务窄状态集写入材料",
      "counterexample": "为旧任务建兼容链或借迁移删用户文件",
      "requires_user_decision": true,
      "visible_group_id": "talk-round-4-group-3"
    },
    {
      "task_id": "workflowhub-thin-core-rebuild-planning-20260919",
      "outline_version": "outline-r2-group2-20260919",
      "oi_id": "OI-008",
      "category": "page_scope",
      "source": "U-001 全文；U-002；U-005 研究深度纠正",
      "question": "这次重构是否仅影响开发工作流和对话交互，现有或新增页面是否属于必须交付的用户范围？",
      "resolution": "已收敛：完全不碰 UI——不新增页面/仪表盘，也不改动现有 make-decision/detail/direction 的交互展示与数据状态。",
      "status": "confirmed",
      "impact_dimensions": [
        "scope",
        "acceptance"
      ],
      "selected_disposition": "完全不碰 UI",
      "evidence": "U-009 第3条相关决定；OI-008 resolution",
      "acceptance": "UI applicability 记为 non_ui 且三源一致",
      "counterexample": "新增页面或改动既有交互面",
      "requires_user_decision": true,
      "visible_group_id": "talk-round-4-group-2"
    },
    {
      "task_id": "workflowhub-thin-core-rebuild-planning-20260919",
      "outline_version": "outline-r2-group2-20260919",
      "oi_id": "OI-009",
      "category": "complete_user_flow",
      "source": "U-005；U-006；U-007；T-006；B-006候选产品形态；B-007三种架构与可推翻条件；B-008下一步",
      "question": "WorkflowHub主要应帮助用户在现有Agent宿主中完成工作，还是必须作为独立执行平台，在宿主退出或跨宿主接力时自行持续管理任务与恢复？",
      "status": "confirmed",
      "selected_disposition": "采用方法工具包定位：宿主Agent/子代理执行，WorkflowHub提供必要工具，不再逐阶段专门认证；接续依赖清楚记录与读取，保留实际安全、授权、测试、独立审查和如实披露。仅定位获选，具体设计未批准。",
      "impact_dimensions": [
        "goal",
        "scope"
      ],
      "requires_user_decision": true,
      "visible_group_id": "talk-round-2-group-2",
      "evidence": "当前会话用户U-007真实回复A及主会话对应产品定位卡；最小语义见T-006。宿主未提供认证reply_ref/hash，不补造。",
      "acceptance": "方案以现有AI宿主为执行者，用实际改动、测试和审查说明结果；不要求每一步强制机器认证，保留必要安全与真实披露。",
      "counterexample": "把WorkflowHub建设为强制逐阶段认证与自主接续平台，或删除真实测试、独立审查及危险操作授权，不符合本次A的选择。"
    },
    {
      "task_id": "workflowhub-thin-core-rebuild-planning-20260919",
      "outline_version": "outline-r2-group2-20260919",
      "oi_id": "OI-010",
      "category": "complete_user_flow",
      "source": "当前会话用户新增要求：make-decision 自身需要改造；U-001 第1/2/4点的原缺口；B-006 结构性成本链",
      "question": "make-decision 怎样才能从“弱化版记录工具”变成真正的头脑风暴平台：在用户需求模糊时扩散、丰富、细化，同时完成整理、设计与收敛，并产出可供 build-prd/build-plan 直接使用的 decision-log？",
      "status": "confirmed",
      "resolution": "已收敛（Round 3）：make-decision 改造为头脑风暴平台，不新增轮次——发散与设计并入第一轮 Talk、调研与方向审查；研究结论完整回到用户（取消 500 字回传上限，改为结构化候选清单加落盘全文与按需展开）；需求保真采用逐字双层结构（原始声明不得改写 + 派生需求带 source 锚点）、三档结论（接受 / 接受但有偏离 / 拒绝）且偏离必须写明改了什么为什么、原话一改则派生项标记待复核；追问按错误清单自检且每轮至少一条替代方案追问；取消对固定轮次与 14 步顺序的锁定，交互按尚未决定的实际问题触发；收敛为 append-only，发现缺口只追加不覆盖。",
      "impact_dimensions": [
        "goal",
        "scope",
        "acceptance"
      ],
      "selected_disposition": "make-decision 改造为头脑风暴平台：发散并入第一轮 Talk/调研/方向审查，需求保真三档，取消固定轮次",
      "evidence": "U-009 与 OI-010 resolution；make-decision-redesign-candidates.md",
      "acceptance": "发散、保真与验收标准写入材料并被用户确认",
      "counterexample": "继续只收敛用户已有想法或静默弱化需求",
      "requires_user_decision": true,
      "visible_group_id": "talk-round-4-group-2"
    },
    {
      "task_id": "workflowhub-thin-core-rebuild-planning-20260919",
      "outline_version": "outline-r2-group2-20260919",
      "oi_id": "OI-011",
      "category": "success_failure_boundary",
      "source": "当前会话用户新增要求 U-009 第 3 条；本轮实测进程与采样证据",
      "question": "WorkflowHub 任务为何造成不可接受的 CPU 占用与温度（超过 80 度、风扇超过 5000 转），是哪个进程导致，如何在不牺牲必要能力的前提下优化？",
      "status": "confirmed",
      "resolution": "已收敛（实测定位 + 用户决定）：原因不是 kernel，而是「高基线 + 高峰值」。高基线（无任务时）为 WindowServer 约 35%、DSH 渲染器约 19%、kernel_task 约 18%（温控征兆）、DSH GPU 约 10%，合计约一个整核；系统已在近 30 分钟记录 thermal-pressure Heavy 与 Moderate。高峰值为一次审查 2 角色 × 3 provider = 6 个 agent CLI 并发约 5.6–6.0 分钟（今日实测 codex 单角色 333s 与 360s）。环境层修复项与用户决定：重启=用户选择暂不重启；Spotlight 排除 ~/Project=用户同意但 macOS 无受支持命令行接口，需用户在已打开的系统设置面板中拖入一次（待用户动作）；清理陈旧 worktree=用户未授权；关闭不必要的常驻重后台（ToDesk 远控抓屏、极空间、微信、Adobe CC、CodexBar、VS Code、Agents Anywhere）=用户可自行处置。产品层修复项交后续实施任务与 build-plan：①broker 回收孤儿 manager/provider（必须先解除 broker 自己写入的只读目录，否则 cleanup 删不掉）；②限制单次审查并发 provider 数（峰值主因，收益最大）；③减少材料与证据写入量以降低索引抖动；④主会话只派发与回收以降低常驻进程与 GUI 渲染。已更正先前误判：每次轮询 spawn 一个 3rd-review 进程的成本实测仅 0.03s，不是热源；1000ms→5000ms 属边际优化。",
      "impact_dimensions": [
        "scope",
        "acceptance"
      ],
      "selected_disposition": "CPU/温度问题按实测定位为高基线+高峰值；环境层与产品层修复分开",
      "evidence": "OI-011 resolution 与 CPU 诊断节",
      "acceptance": "实测数据、已执行缓解与待实施项写入材料",
      "counterexample": "把非热源说成热源或不做实测",
      "requires_user_decision": true,
      "visible_group_id": "talk-round-4-group-2"
    },
    {
      "task_id": "workflowhub-thin-core-rebuild-planning-20260919",
      "outline_version": "outline-r2-group2-20260919",
      "oi_id": "OI-012",
      "category": "complete_user_flow",
      "source": "U-010 第1点；2026-09-19 Talk round 5 问1",
      "question": "「不应该有任何阻塞」的边界：新系统保留哪些门、删除哪些机器/流程门禁？",
      "resolution": "已收敛（2026-09-19 Talk round 5 问1）：新系统只有两道人为门（推进中的人为确认对话、不可逆 Git 授权，宪法级）；一切机器/流程门禁删除；迁移表冻结、并行声明、接口蓝图冻结从「推进前置」降级为「事实记录+验收核对」——没做是验收失败事实，不是推进阻塞。",
      "status": "confirmed",
      "impact_dimensions": [
        "流程",
        "拓扑",
        "验收"
      ],
      "selected_disposition": "只留两道人为门，其余机器门禁全删；冻结/声明类机制降级为事实记录+验收核对",
      "evidence": "U-010 第1点；decision-log.md Talk round 5；R-018",
      "acceptance": "抽真实任务：无机器门禁阻断推进；两道人为门仍在。",
      "counterexample": "若某机器校验仍阻断推进（除两道人为门），即违反。",
      "requires_user_decision": true,
      "visible_group_id": "talk-round-5"
    },
    {
      "task_id": "workflowhub-thin-core-rebuild-planning-20260919",
      "outline_version": "outline-r2-group2-20260919",
      "oi_id": "OI-013",
      "category": "data_state",
      "source": "U-010 第2点；2026-09-19 Talk round 5 问2",
      "question": "哈希/快照/身份/材料/回执校验机器在新系统怎么处置？",
      "resolution": "已收敛（2026-09-19 Talk round 5 问2）：彻底全删——阶段推进、审查派发、测试执行不依赖哈希/sha/快照/身份/材料/回执校验；记录层也不用内容寻址哈希，普通文件名+纯文本引用；质量=真实执行+独立审查+人确认。显式区分：本规划任务自身 build-prd 使用的 revision 绑定是现行系统合同，与本次新系统设计无关，不因此保留。",
      "status": "confirmed",
      "impact_dimensions": [
        "架构",
        "删除清单",
        "证据形态"
      ],
      "selected_disposition": "校验机器彻底全删；记录层用普通文件名+纯文本引用",
      "evidence": "U-010 第2点；decision-log.md Talk round 5；R-019",
      "acceptance": "新系统任一推进/审查/测试路径无哈希校验依赖；证据文件用普通文件名。",
      "counterexample": "任一阶段要求哈希相等才推进，即违反。",
      "requires_user_decision": true,
      "visible_group_id": "talk-round-5"
    },
    {
      "task_id": "workflowhub-thin-core-rebuild-planning-20260919",
      "outline_version": "outline-r2-group2-20260919",
      "oi_id": "OI-014",
      "category": "success_failure_boundary",
      "source": "U-010 第3点；2026-09-19 Talk round 5 问3",
      "question": "build-plan 流程修改后，build-plan 的审查如何对应修改？",
      "resolution": "已收敛（2026-09-19 Talk round 5 问3）：合并为一次——build-plan 完成后、build-code 开工前一次审查同时覆盖 spec 与 phase 文件；质量核心=原 spec 审查（需求翻译完整性/验收可执行/架构合理）+原 plan 审查（依赖正确/并行声明/写集）合一；审查节奏其余点不变（build-code 每 phase 一次+全 phase 集成一次+verify-code 终末一次）。",
      "status": "confirmed",
      "impact_dimensions": [
        "审查节奏",
        "文档权威"
      ],
      "selected_disposition": "build-plan 一次合并审查覆盖 spec+phase 文件，两类质量核心合一",
      "evidence": "U-010 第3点；decision-log.md Talk round 5；R-020",
      "acceptance": "一次合并审查真实执行且覆盖两类文件与两类质量核心。",
      "counterexample": "拆成两次固定审查或漏掉任一质量核心，即违反。",
      "requires_user_decision": true,
      "visible_group_id": "talk-round-5"
    }
  ]
}
```

## 背景资料与来源区分

| source_id | 类型 | 位置 | 使用边界 |
| --- | --- | --- | --- |
| B-001 | 用户指定审计 | /Users/Hugh/Downloads/workflowhub-build-verify-time-waste-audit-20260919.md | 历史问题及证据线索，按当前代码核对；不是方案确认 |
| B-002 | 本对话已有独立外部研究 | /Users/Hugh/Hugh/Project/workflowhub/.planning/2026-09-19-workflowhub-independent-external-research/recommendations.md | 助手研究建议，未被用户逐项确认；按实际资料复用，不重复堆全文 |
| B-003 | 本对话已有子代理设计研究 | /Users/Hugh/Hugh/Project/workflowhub/.planning/2026-09-19-workflowhub-independent-external-research/agent-design.md | 助手建议，与用户要求分开；不计为本阶段正式研究完成 |
| B-004 | 当前框架合同 | workflows/make-decision/SKILL.md、steps.json、skill-deps.yaml | 约束本次实际执行顺序；目标重构中的合同变更需另行确认 |
| B-005 | 冻结执行证据复核 | quality/evidence/research/frozen-execution-root-cause-audit.md | 撤回无父命令等于空转、手工receipt和状态回写必失效的过度归因；保留真实writer消费断层，不提供效果保证 |
| B-006 | 当前源码全链诊断 | quality/evidence/research/architecture-diagnosis.md | 文档协议、方法证明、结果包装、流程形状测试的静态证据；删除范围仍是候选 |
| B-007 | 外部架构与反证 | quality/evidence/research/external-architecture-options.md | 固定版本源码/技能比较三种产品形态；非性能实测，非获批架构 |
| B-008 | 三路研究综合 | quality/evidence/research/research-synthesis.md | SHA256=14be784b2b5ecaf35faa6c6c24c62b3560ed546328d2e923fefba7a8b3ffb257；结论有可推翻条件与未知，不替用户决定 |

已有助手分析倾向：保留真实行为验证和必要独立复核；删除重复材料、无消费对象、机械 RED 和反复审查；不新增统计或治理控制面。这些只是研究输入，具体保留与删除范围尚未确认。

## 执行准备与交互记录

| step | 当前状态 | 真实依据与限制 |
| --- | --- | --- |
| 1 load-context | prepared | 已读取现行 stage/steps/deps、保留完整 U-001/U-002、创建认证 worktree/task、本唯一 OI；主会话尚需复核定稿，不宣称 stage 完成 |
| 2 triage-scope | draft | 当前范围、非目标与开放问题已形成草案；主会话尚需复核与用户交互 |
| 3 Talk round 1 | completed | 主会话已发问、等待并收到 U-003，恢复重排后剩余 high/medium 问题为0，已向用户宣告第一轮收敛（撤回1、确认1）；T 表保留真实处置。无宿主回复凭证，不宣称 aggregate 已认证；make-decision 仍 in_progress |
| 4 research-inputs | research_materials_prepared / publication_pending | 三路主体及综合B-005至B-008已形成，关键来源局部独立核查已执行；未运行正式阶段execute，也不宣称完整R4 research-report已发布。保留报告中的未实测与归因未知 |
| 5 Talk round 2 | completed | 主会话group2聊天卡收U-007真实A后已恢复重排，并结合独立重排明确向用户宣告Round2收敛，未追加问题；具体方案、make-decision最终确认与阶段完成仍未批准 |
| 6 direction-advice | attempt_recorded / semantic_unavailable；协议修复后重跑为 semantic_available | 首次公共paired review红蓝均PROTOCOL_INCOMPATIBLE、result_ref=null、coverage=incomplete，无语义findings；该失败事实与原件保留。协议修复后按material_changed重跑一次，红蓝均available、coverage=satisfied，产出11条findings（无blocking），方向级争议待Talk round 4；详见“方向审查重跑结果与处置”节 |
| 7 Talk round 3 | zero_question_closed / lifecycle_unavailable | 主会话已正式处置：红蓝无可消费语义结果、debate无输出，结合当前OI无新增high/medium方向问题，按Talk零问题规则0题结束。没有发卡、等待、用户回复或resume事件；不伪造，不宣称固定生命周期认证满足 |
| 8 grill-with-docs | completed / zero_questions | 主会话依据覆盖核对与真实已答选择决定零问题完成Grill，不伪造ask/reply。CONTEXT增两条目标术语，ADR-0031只记录已选产品定位；结论细节进入最终一次确认，非新增审批 |
| 9 write-decision-draft | drafted | 当前D-001及覆盖、未来路径、文档职责、实施验证、删除面与风险已写入；整体方案待最终确认 |
| 10 detail-advice | 首次semantic_unavailable；协议修复后重跑为semantic_available | 首次公共paired review红蓝均PROTOCOL_INCOMPATIBLE、result_ref=null、coverage=incomplete，该失败事实保留。修复后按material_changed重跑一次，红蓝均available、coverage=satisfied，产出26条findings（无blocking），材料不一致与方向级争议待处置；详见“detail审查重跑结果与处置”节 |
| 11–14 后续步骤 | not_started | 未执行最终确认、发布或复盘；未进入build-prd |

## 当前方向审查事实与 Round 3 边界

方向review消费的冻结decision-log SHA256为20dd5c90f42802798500642dc5019271e982f4fd8140d94bb51e21eb82e4761c，outline_version=outline-r2-group2-20260919。本次解除材料冻结后只追加真实失败事实，原始attempt保持不变，不把其身份重写成更新后的材料。

- pair_id：844081ad-b97f-433c-9e83-db756b62e2eb。
- pair report：quality/reviews/reports/make-decision-simple-47e5a943-bcde-5c68-a617-d3405eaff578.md。
- red attempt：quality/reviews/attempts/c00e13c8-df7c-596b-a6ab-19f2eb69d280/attempt.json；SHA256=1f327194b4a9fe7a692521449046a76db559914bc40108cce2119943b3dd7355。
- blue attempt：quality/reviews/attempts/6d0e9f36-a4cd-5a7b-a34f-fb8cd3c1f904/attempt.json；SHA256=690af347b600a2194dd25ade072a82858220f016a4b6ae29a84b122e1e347ff5。
- 两角色均semantic_status=unavailable、result_ref=null、coverage=incomplete；真实错误：PROTOCOL_INCOMPATIBLE: 3rd-review managed lifecycle envelope is invalid。
- attempt内记录blocked_before_dispatch、0 provider_attempts；该记录不能证明远端未启动。远端状态unknown，未取消；不声称provider_calls=0或计算实际远端成本。
- 只执行这一次公共paired review，未重试。没有可消费的红蓝语义finding或争议列表；debate未产生输出，不能宣称争议已被裁决，也不能以空列表冒充完成审查。

当前保留风险：缺少方向审查的独立语义覆盖；远端生命周期不明。它限制本阶段质量/完成声明，不阻止同任务继续讨论和修订。

Round3规则核对：skills/talk-with-zhipeng/SKILL.md:52–55明确候选可为零，无high/medium待回答项可说明事实与关闭理由后结束；:133–140也允许无人工等待，但必须由主会话记录候选和结束事实。workflows/make-decision/SKILL.md:258–272却要求每轮各自ask/wait/reply/resume，:351–359要求实际三轮/条件四轮且逐轮验证；steps.json:11也描述真实reply/resume。这是零问题结束与固定生命周期文字之间的合同冲突。

处理边界：主会话可先核对本轮是否确有未解决的方向问题；若确无新增high/medium项，可按Talk零问题规则说明原因结束本轮，再继续Grill讨论。不为凑轮数重问、不借用前轮回复、不生成未发生的ask/reply；此时不能宣称Round3的真实问答事件链存在或完整interaction aggregate已认证。若后续正式发布边界因此拒绝，保留实际错误/缺失，不创建替代对象。上述是规则边界。随后主会话已实际执行Round3候选核对并宣布0题结束：无新增high/medium方向问题，不为凑轮数重问，不生成ask/wait/reply/resume。此处仅由writer写回该真实处置，未替主会话执行交互；Grill仍未执行。固定生命周期与零问题规则冲突保留，interaction aggregate及正式completion可能因此incomplete，不阻止同task继续Grill讨论。

### Talk

本轮真实来源为 U-003。主会话已完成发问、等待真实回复、接收与恢复处置；没有回放或编造完整问题卡，不补造宿主认证字段。后续改用聊天文字问答。

| T-ID | Round / 来源 | 主题及真实回答 | 处置与最小决策含义 | 后果与边界 | OI |
| --- | --- | --- | --- | --- | --- |
| T-001 | Round 1 / U-003 首句 | 用户指出已有人工任务类型分流，本题不应再问 | 误提撤回；已由当前事实回答。沿用 make-decision 入口人工选择规划任务/普通任务，不新增按大小自动分流；不是 A/B 选项选择 | 避免重复要求用户决定已存在机制；后续任务内部流程尚未全部确认 | OI-001 |
| T-002 | Round 1 / U-003 第二句 | 用户真实回答：2：A | Agent 先实跑约定使用流程，展示结果与未决问题，用户按需重点抽验；不默认等待用户逐项亲验 | 不把脚本通过当作真实功能完成；Agent 无法实跑时如实披露，具体失败处置留在同一 OI 待研究后收敛 | OI-004 |
| T-003 | Round 2 / U-005 第一项 | 用户真实回答：1：A | 原审查工具不可用时，采用一次由未参与实现者完成的独立替代审查 | 保留真实来源和缺失，不把替代审查写成原工具已执行或通过；不是整体审查架构批准 | OI-005 |
| T-004 | Round 2 / U-005 第二项 | 用户真实回答：2：A | 新流程优先、历史只读，未完成旧任务不要求自动兼容 | 不为旧任务增建永久兼容链；具体切换与遗留任务处置仍须研究，未授权删除历史或用户文件 | OI-007 |
| T-005 | Round 2 / U-005 纠正 | 用户指出研究与方案深度不足，八点只是粗略想法 | 回到同task research-inputs：独立诊断、寻找备选与反证，不能照单设计 | 保留已有局部选择，暂停整体方案收敛与后续问答，不重启任务或提前进入review/Grill | 全部OI |
| T-006 | Round 2 group 2 / U-007 | 用户真实回答：A | 选择方法工具包，由宿主Agent/子代理执行；结果以实际改动、测试、审查说明，不再逐阶段专门认证 | 接续依赖清晰记录与读取；保留工作区安全、危险操作授权、真实测试、独立审查及如实披露。仅定位获选，不批准全部八点或具体技术方案 | OI-009；关联OI-001/006 |
| T-007 | Round 3 / 主会话实际处置 | 0题；没有用户回复事件，不适用选项选择 | 方向审查无语义结果、debate无输出；核对当前OI没有新增high/medium方向问题，按Talk零问题规则结束本轮 | 不等于方向审查通过，不伪造问答链；aggregate/completion合同缺口保留，same-task继续Grill | 当前OI与方向review原件 |

#### Round 2 在产品定位A之后的候选重排

| 候选轴 | 现有事实与影响 | 当前处置 |
| --- | --- | --- |
| OI-009：方法工具包或独立平台 | U-007真实A已决定产品定位及直接取舍 | 已答；不重问、不把A扩大为全部设计批准 |
| OI-001/OI-006：方法组合、删除重复证明与保留真实保护 | U-007已限定不要逐阶段专门认证，保留实际安全/授权/验证；B-006/B-008提供删除面 | 先据已选边界形成可审查方案，尚未发现必须现在向用户追加的独立方向分歧；不能靠改名恢复旧引擎 |
| OI-002/OI-003：工作包、材料组织与子代理策略 | 用户要隔离与提速；研究反证固定每task开代理和重复Phase全文不必然有效 | 作为后续方案比较，当前不让用户决定方法细节，不把粗略候选当批准；若独立审查发现用户可见能力取舍再回Talk |
| OI-004/OI-005：真实验收与审查方法 | Agent实跑、用户重点抽验、工具不可用一次非实现者独立替代均已答；OCR收益未实测 | 不重问已答规则；具体工具与验证方法保留未决，由事实和审查支持，不把效果未知硬变成现在的选择题 |
| OI-007：迁移范围 | 新流程优先、历史只读、未完旧任务不要求自动兼容已获A | 不再问兼容范围；具体顺序是待拟方案，不授权清理历史 |
| OI-008：页面范围 | 原需求聚焦工作流；三路研究未提出已证必要新增页面，亦未完成全部UI库存核查 | 维持unknown，不擅自确认non_ui；先按既有事实核实，不为凑轮数向用户提出无依据页面选项 |

本次重排结论：未发现必须立刻追问、且尚未被真实回复或既有事实覆盖的新high/medium方向项。主会话已依据真实A与独立重排明确宣告Round2收敛，未追加问题；后续按现行顺序进入方向审查，此次材料写入没有启动审查。仍open的OI代表具体方案尚待整理和检验，不等于每项都需要再问用户；不能为关闭OI自动批准方案。原八点粗略候选继续完整覆盖。没有创建新问题卡、默认答案、交互存档或伪造宿主凭证。

#### Round 1 候选重排

| 候选 | 原影响 | 当前处理 | 事实依据 |
| --- | --- | --- | --- |
| 真实痛点：慢、浪费上下文、形式测试、审查等待、过度治理阻塞 | high | 已由事实回答，不再问 | U-001 第1–8点、B-001 |
| 成功意图：质量更高、执行更快、真实用户流程可用且易维护 | high | 已由事实回答，不再问 | U-001 总目标、第1/3/6/8点 |
| 任务类型入口与分流 | high | 误提撤回，沿用人工选择 | U-003、T-001；当前 readTaskTypeFromDecisionLog 读回规划任务 |
| 最终真实验收的执行主体与人工参与 | high | 用户已答 A | U-003、T-002 |
| 是否需要针对性调研 | medium | 已由用户原请求与当前真实工具/并行方案未知回答：需要 | U-001 第5点要求结合调研判断；B-002/B-003 已有研究可复用，不重复整套检索 |
| 审查工具、子代理并行、保留机制、迁移与 UI 范围细化 | 后续方向项 | 先依据现有研究和当前事实核实；属于后续 Talk round 2 的条件输入，不为本轮凑题 | OI-002–OI-008；尚未形成完整已确认方案 |

Round 1 实际退出：主会话在真实用户回复后恢复并重排，本轮职责内 high/medium 未知为0，已向用户宣告第一轮收敛（撤回1、确认1），没有增加问题。各开放 OI 仍保留，Round 1 结束不代表 make-decision 完成，也不代表后续方向问题已获批准。

### Grill

主会话在方向review真实unavailable与Round3零问题结束之后，核对原需求、真实选择和三路研究，确认没有必须追加的方向级问题，Grill以0题完成。没有问答事件，也没有Grill review verdict；以下是主会话授权的最小决策更新，具体设计纳入最终一次确认，不冒充用户逐项批准。

- 工作组织：按可验证用户结果工作包组织，不强制每task一个子代理；强关联实现、测试、修复可在同一上下文连续完成，独立复核换上下文。并行只用于输入、写集和环境独立的工作包。
- 权威材料：规划任务的PRD独占产品目标、完整用户流程、跨任务需求、总体成功/失败与真实验收；每个独立实施task的spec只负责本task的实现设计、架构取舍、依赖与验证策略。Phase/工作包只引用PRD与spec中的全局目标，写本包差异，不复制完整需求与架构。后续总体验收由PRD任务地图明确指定的实施任务承接；子任务完成不自动等于总体功能完成，也不触发母任务close。具体责任卡由build-prd形成，不新增后台管家。
- 真实验收：基础工作可按自身验证事实完成；整体功能只有从真实入口联通实跑才可声明完成，沿用Agent实跑、用户重点抽验。真实测试失败必须修复并复验；review unavailable沿用一次未参与实现者的独立替代，二者不能混写。
- 接续：跨会话仅保留已决定、已验证、未完成、证据出处等清晰接续记录；不恢复阶段fact graph，不默认提供跨宿主自动恢复。
- 工具边界：stage completion、task kernel和fact graph是删除候选，不按现有对象反推必留核心。保留可脱离kernel的窄工具职责：工作区/范围核对、真实命令exit/output采集、安全写入、不可逆交付授权与冲突中断保护；未批准具体技术删除清单。
- 真实取舍：方法工具包不再承诺机器认证阶段完成、跨会话证据链或自动判断全部证据过期；这些是U-007所选定位的代价，不假称纯技能提供同等机器保证。

覆盖核对：goal由U-001高质量/低浪费与U-005独立诊断覆盖；flow由U-002当前make-decision→build-prd及U-007未来方法工具包覆盖；data/state由单一权威目标、差异工作包与最小接续覆盖；success/failure/acceptance由T-002真实实跑、T-003替代审查与失败不得漂白覆盖；constraints/non-goals/deferred由不建统计、历史只读、未完旧任务不自动兼容、当前不实施覆盖。无遗漏的消息类别；原八点继续保留为候选，不能因覆盖完整就宣称全部方案获批。

四项exit checks：
1. external_interfaces=pass（方向适用范围）：现行build-prd/spec-prd职责已核；OCR锁定SHA源码已核接口能力，真实效果unknown，不以未做benchmark冒充已验证收益。具体外部工具尚未选定，不靠虚构接口作方向决定。
2. canonical_names=pass：产品定位唯一称“方法工具包”，工作组织唯一称“可验证用户结果工作包”；定义见CONTEXT目标重构节。具体文件路径/字段留后续，不在规划任务问用户。
3. failure_semantics=pass：真实测试失败须修复/复验，review unavailable与远端unknown单列，不能伪绿；缺固定Round3生命周期仍披露，不冻结同task讨论。
4. scope_boundaries=pass（当前方向）：本次仅规划，未来以宿主执行为主；保留真实安全/授权/验证，放弃通用逐步认证，历史只读；未选具体代码删留、OCR收益未知均有owner和后续触发，不伪造实现完成。

CONTEXT：changed，仅增加两条目标重构术语，明确尚未实施，旧五阶段定义继续描述当前系统。ADR：created，docs/adr/0031-hosted-method-toolkit-direction.md，只记录U-007已解决的产品定位与能力取舍，文档并入本阶段最终整体确认。ADR三判据：难以反转=true（以后恢复统一认证/接续引擎需重新承担状态及适配成本）；无背景会意外=true（维护者可能把主动放弃的认证误作缺陷重建）；真实取舍=true（方法工具包与独立平台已有明确收益/代价比较及用户A）。

冲突处置：CONTEXT当前五阶段和旧ADR描述仍有效的现行实现；新节/ADR只描述未来目标，不即时替代现行合同，不授权物理删除或交付。Round3零问题与固定生命周期合同冲突仍未解决，aggregate/正式completion可能incomplete；本次Grill完成不漂白该缺口。

ADR文档职责登记：owner=本任务make-decision主会话；consumer=最终确认、后续build-prd与实施任务理解产品定位；替代关系=补充未来方向，不即时废止旧实现ADR；保留条件=方向仍是当前重构依据，若被新决策替代则按ADR惯例保留历史而非runtime消费；无新增生产控制面。

## 决定草案（step 9）

本稿供 detail advice 和最终一次用户确认。用户已选择“方法工具包”定位及此前四项边界；以下具体工作流、文档分工和删除方案仍是研究后的待确认方案，不代表原八点已整体批准。当前任务继续按现行 WorkflowHub 完成 make-decision，随后接 build-prd；未来流程不能提前替代当前执行合同。

### D-001 — 方法工具包、单一产品权威与可验证用户结果

- question/final_option：如何在保留真实交付质量的前提下，删除围绕阶段与证明运行的重复工作？推荐采用宿主承载的方法工具包，并按以下边界组织工作。
- recommendation/plain_language：现有AI助手负责对话、派发与执行，WorkflowHub提供方法和必要窄工具；用实际改动、测试、独立审查及未完成说明交付，不再默认用 task kernel、stage completion 或 fact graph 逐步认证。
- decision：产品定位已由U-007真实A选择；本条其余具体设计为待最终确认草案。
- source_type/reference/exact_excerpt：用户原始候选U-001、当前执行约束U-002、研究纠正U-005、定位选择U-007“A”、权威拓扑纠正U-008及T-001至T-006；三路研究B-005至B-008和零问题Grill最小结论。八点只作为粗略候选，不作为设计上限。
- approval_binding：产品定位、此前局部选择及U-008权威任务拓扑已确认；本完整草案其余设计尚未最终确认，没有伪造回复或宿主凭证。
- facts_and_constraints：冻结任务证据证明存在长线性计划与writer消费用途断层；无父命令不能证明空转，状态回填必失效和手工receipt两项归因已被反证。方向review一次真实unavailable，不能当作通过。
- Logic：真实浪费和用户结果问题 → 删除重复证明及固定仪式 → 宿主执行、单一目标权威、按结果验证 → 减少维护与协调，同时保留真实失败和安全边界。
- choice_reason/impact：同时改变框架职责、方法组织与材料权威，不只合并阶段或替换审查工具；接受不再提供每一步机器认证、跨会话证据链和自动过期判断的代价。
- consequences_and_risks：更依赖宿主能力与清晰记录；具体删除映射、工具接入及质量效果需后续核实，不能承诺节省比例或永不再重构。
- rejected_alternatives：继续维护统一执行平台；只把旧kernel/协议搬进Skill；PRD/spec重复产品需求；每包复制全部架构；强制每task新代理；机械RED或把环境错误当RED；用review通过替代真实入口验收。
- unresolved_items/owner：最终用户确认由make-decision主会话负责；完整用户旅程与任务覆盖由后续build-prd细化；具体删除清单、依赖和工具效果由后续build-plan/实施核查。未知不冒充已完成，不增加新gate。
- Supersedes：只细化本任务草案，不立即废止当前运行合同或删除历史证据。
- module：未来产品职责与交付方法
- requirement_ids：[R-001,R-002,R-003,R-004,R-005,R-006,R-007,R-008,R-009,R-010,R-011,R-012,R-013,R-014]
- derived_from：[]
- artifacts：当前decision-log；CONTEXT目标重构术语；ADR-0031；后续build-prd与实施材料（尚未生成）。

### 未来用户路径与各方法职责

人工在 make-decision 入口选择规划任务或普通任务，不新增按任务大小自动分流。权威拓扑以U-008为准：

- 规划任务只有 make-decision → build-prd，产出完整用户需求、总体成功/失败及真实验收要求、任务地图；到此结束规划范围，不进入build-plan、build-code或verify-code。
- 后续每个实施任务都是独立task，分别执行 make-decision → build-plan → build-code → verify-code；每个任务的make-decision只确认本任务方向与边界，继承PRD，不重问或改写全局产品决定。确有全局方向变化时明确交回其owner，不在子任务悄悄改写。
- 普通任务同样执行 make-decision → build-plan → build-code → verify-code，可按实际范围精简内容，不为不适用PRD或文档制造跳过事实。
- 每个实施task的build-plan只为本task产spec.md与工作包/phase说明，build-code和verify-code只处理本task。PRD任务地图和人工选择下一task足以衔接，不新增successor/predecessor关系对象、后台调度器或母任务自动close。

用户旅程分两条：规划任务提出目标、确认方向，再通过build-prd形成并确认完整PRD与任务地图；用户随后选择一个实施任务，在独立task中依次确认本task边界、产实现设计与工作包、实现与测试、独立复核及真实入口验收。后续任务逐个或按独立边界并行承接PRD；总体功能验收由任务地图明确指定的实施任务承接，规划任务本身不进入代码阶段。每个实施任务展示实际结果、证据与缺口，用户按需重点抽验；不可逆Git交付仍需明确授权。

### 文档权威与避免双写

- decision-log记录方向、取舍、约束及用户真实选择，不重写详细规格。
- 有PRD的规划任务：PRD独占产品目标、完整用户流程、跨任务需求、总体成功/失败与真实验收的权威；每项需求有负责工作包或明确排除理由。
- 每个独立实施task保留单一 spec.md，由该task的build-plan产出，作为本task实现设计权威：仅引用PRD/decision中的目标，写架构取舍、全局依赖和验证策略，不复制完整产品需求或重新定义验收目标。
- 无PRD的普通任务：精简spec引用用户原始需求和decision-log中的产品事实，再承接必要目标说明与实现设计；不得把实现方便性写成用户已批准的新需求。
- phases或工作包文档围绕可验证用户结果，只写本包差异、边界、依赖及自身测试/验收，引用同一全局目标；不复制PRD或spec完整正文。小任务可用简短章节，不机械增加文件。
- 删除 plan.md/tasks.md 双写及其相等性协议。产品目标改变回到其唯一权威更新，设计随引用调整；包内不能另写相冲突版本。总体验收由PRD任务地图明确指定的实施任务承接，不存在跨任务执行主会话；子任务状态相加不等于整体完成。
- 这是对Grill“单一权威”原则的细化：有PRD时产品权威在PRD，spec只管实现设计；不是PRD与spec同时管同一需求。

### 实施、并行与子代理（Talk round 4 用户定稿）

按**工作类型**派发子代理，而不是每个 task 或每个实现包各起一个新代理：

- 实施子代理：负责实现，并承接由审查或测试结果产生的修复，因此同一实现的修复保持连续上下文。
- 测试子代理：独立于实施上下文，负责真实测试与 RED→GREEN 证据。
- 审查子代理：独立于实施与测试上下文，负责异源复核。
- 主会话只做结果回收与任务派发，不承担大量阅读或编辑，保持主会话上下文干净。

并行仅用于输入、写集与环境独立的工作包，共享写面或真实发布依赖先协调，不能为并行转移整合成本。

可观察行为变化且真实测试能先失败时，用同一测试完成RED→GREEN。环境故障、配置缺失或无意义断言不算有效RED；纯文档等不为形式制造失败。已验证且相关输入未变的结果可供判断复用，不因多一轮汇报机械重跑。第一条贯通路径形成时就实际试用，最终仍做整体真实入口联通验收，不能只汇总单元测试或工作包状态。

### 审查、失败与真实完成

审查只出现在两个阶段，其他阶段不设固定审查：build-code 做一次异源代码审查，检查代码缺陷与相关边界；verify-code 做真实功能验收，检查整体用户行为、验收结果和残余风险。**审查成功后不复审**：审查提出的问题照单修复即可，修完不再重跑审查，也不建 severity 门槛或复审循环；代码审查不等于功能验收，不固定重做一轮相同代码审查。OCR可作为正常独立审查候选，但效果未实测，接入前验证能力与覆盖；不能直接把厂商数字当作本项目收益。

审查工具unavailable时沿用用户选择：一次由未参与实现者完成的独立替代审查，保留来源及缺口，不等待或反复重派；若替代也不可用，如实披露，不宣称独立审查已完成。真实测试失败必须修复并复验才能宣称对应功能完成；不能修复时可停止并交接未完成事实，不能用review unavailable替失败开脱。

基础工作可按自身验证事实完成；整体功能只有从真实入口联通实跑、达到约定成功条件且关键失败路径被核对，才可声明完成。Agent展示实际改动、验证结果、未验证项和风险，用户按需抽验；不默认逐项等用户亲验，不把物理交付当质量证明。

### 保留工具、删除职责与最小接续

保留可脱离kernel独立调用的窄工具：工作区/范围核对、真实命令exit/output采集、安全写入、不可逆Git授权及冲突中断保护。工具只保证实际能观察的事，不替人判断功能是否合理，也不另建通用完成对象。

删除目标职责：stage completion通用认证、task kernel/fact graph对日常工作的强制依赖、多层重复evidence包装、plan/tasks重复合同、固定Talk轮次、强制每Phase review/handoff/不变路线重选，以及只保护这些流程形状的测试。旧wh-review/broker不再是新流程正常审查路径，历史原件只读保留；不能换名字或搬进Skill继续执行。删除具体文件及其活跃消费者要由后续build-plan核查，不预先捏造完整删除清单；真实安全、失败和数据完整性测试保留或随职责改写。

跨会话只保留已决定、已完成且验证、未完成及证据位置，新的助手读取这些记录后继续；不恢复阶段fact graph或自动恢复平台。新流程优先；未完成旧任务与历史完全不管、一律只读——不产交接记录、不做迁移提示、不保证自动兼容，也不借迁移删除用户文件。新流程任务自身的接续才使用上面的窄状态集。

### 非目标、风险、未知与后续边界

不做独立后台执行平台，不保留通用阶段事实图或跨宿主自动恢复；不建token/时间统计机制，不为旧任务建设永久兼容；完全不碰 UI：不新增页面/仪表盘，也不改动现有 make-decision/detail/direction 的交互展示与数据状态；不在当前规划实现新框架。当前stage工具在重构正式交付前继续有效。

保留未知：OCR实际效果尚未验证；完整迁移删除清单和消费者影响需后续代码核查；全部host/子代理耗时归因不明；跨项目“功能不合理”案例尚未完整验证；纯技能不能保证与旧认证引擎同等自动审计。若用户后来提出确切的无人值守或跨宿主强恢复需求，应重新评估产品取舍，而不是偷偷加回平台。

后续build-prd应把上述完整用户旅程、责任归属、实际成功/失败边界、迁移范围和任务之间依赖写清，尤其给总体真实验收安排明确承接；不把实现函数、字段、schema或命令形态当本阶段用户问题。

### 原始八点到草案的覆盖

| 原候选 | 本稿处理 | 未被默认为批准的部分 |
| --- | --- | --- |
| 1 合并规格/计划 | 独立实施task内合并为build-plan方法；规划任务只到PRD，PRD管全局产品，task spec管本task实现 | 具体结构待最终确认 |
| 2 每Phase文档 | 按可验证用户结果工作包，只写差异；删除plan/tasks双写 | 不机械按phase数增文件 |
| 3 TDD提效 | 同一真实行为测试RED→GREEN，剔除形式RED | 不证明所有变更都适用TDD |
| 4 子代理与并行 | 按工作类型派发实施/测试/审查子代理；修复回到实施子代理；主会话只派发与回收 | 不为每个实现包或每个 task 新起代理 |
| 5 更换审查 | OCR等可替换候选，代码review与功能验收分工 | OCR更快更准仍未知 |
| 6 去统计 | 不建设token/时间统计机制 | 不删除真实执行结果 |
| 7 弱化严格流程 | 删除过程认证，失败可披露并结束当前尝试 | 不把真实测试失败写成完成 |
| 8 薄核心多技能 | 删除核心与技能中的重复职责，保留窄工具 | 不把旧引擎换名搬家 |

### 备选方案补记（Round 3）

- 审查路径补为显式备选：保留现审查、替换为有证据门槛的对比实验、或仅在不可用时 fallback（对应 OI-005 的收敛结论）。原 alternatives 只覆盖 runtime/认证维度，是审查发现的缺口。
- 被否方案“保留最小必需 runtime”的驳回证据未在第一轮给出：该项比较**延期到 build-plan**，重访触发条件是——若删除后出现无法用窄工具+真实验收发现的实际失败，则重新比较最小 runtime 方案。

### 方向契约（Round 3 定稿）

- WorkflowHub 所有权：方法、窄工具、真实验收要求与独立审查编排；不承担通用阶段调度、产品裁决、恢复平台或质量 verdict。
- 宿主/技能职责：宿主 AI 助手负责对话、派发与执行；技能提供可搬运方法与窄工具；跨宿主不承诺自动恢复。
- 显式非目标：不做独立后台执行平台；不建 token/时间统计；不为旧任务建永久兼容；完全不碰 UI；不在本规划内实现新框架。
- 每个 OI 的退出标准：上表八条 OI 均已给出收敛结论并标记 confirmed；后续若出现与结论冲突的新事实，按同一 OI 重新收敛，不新增第二套清单。
- 可测量的"无重复契约"标准：同一事实只有一个权威文件；删除后不得存在两个文件对同一事实各自声明权威。该标准作为 build-prd 的命名可检查交付项，与具体重构验收标准一并产出。

开放状态：本完整草案等待最终用户确认；方向审查协议修复后已重跑并取得可消费结果，其方向级争议待Talk round 4；detail首次审查unavailable，修复后已按material_changed重跑并取得可消费结果（26条findings，无blocking）；两类审查的方向级/验收级争议均待Talk round 4；Round3零题生命周期冲突及宿主凭证缺失仍如实保留。草案完成不是make-decision完成，也不是build-prd已开始。

## 细节审查事实与审查协议修复记录（2026-09-19 续接会话）

本节由续接会话按真实原件写回，只追加既有事实与已完成的修复证据，不改变任何用户已作选择、OI 或草案范围。

### 细节（detail）审查真实事实

- pair_id：a33af2fa-08fb-4adc-b72c-3ada1a2cd775；request_key：f956bff0b84d4777255b19a2f84672ad40696f7c884ba113598540f7ea7a55d4。
- 请求原件：quality/evidence/research/detail-review-request-43cc2844d445b09bb57ae4f8396583e43ba26cb2ba444105703a25234e45c9bd.json（文件名即其 SHA256）。
- red attempt：quality/reviews/attempts/5f07fd88-d58f-5902-aa3d-067a7b055313/attempt.json；SHA256=b3b3e98f740689811543831425983fe1a57a6da345f1e812fd241e7b1e2a650d。
- blue attempt：quality/reviews/attempts/abc68c98-3fc7-563d-a82d-8ccc7de2422f/attempt.json；SHA256=027383e4d05438c8d4e3ddc0f6277ea205350534be89966d8bc0484ea1965c9c。
- pair report：quality/reviews/reports/make-decision-simple-79a66bad-82f1-542a-a4a1-7ca620ec007c.md；SHA256=def18f58c489f935cf0b3ae8918ea739331345a8e765a53b1ce67880a7782601。
- 两角色均 semantic_status=unavailable、result_ref=null、coverage=incomplete；真实错误：PROTOCOL_INCOMPATIBLE: 3rd-review managed lifecycle envelope is invalid。detail advice 仍不可消费，不得写成通过。
- 此前正文只记录方向 review 事实而未记录 detail 事实；本行补齐该缺口。detail 只发出一次，未重试。

### 方向（direction）审查的执行事实补充

方向两角色同样 unavailable，但远端行为与此前记录不同：两个方向 runtime（0b191aab-583e-4119-b73b-26175fee6844、16232244-8c18-4f12-88f5-251b1677731d）三个 provider 全部 failed，错误为 MATERIAL_INCOMPLETE: direction-review.v1 material is missing direction_flow.json。方向因此没有任何 provider 输出，不存在可回收的 late result。

### 已定位的两个独立根因（离线可复现，已用真实字节与 broker 自身代码验证）

1. 身份分叉：bundle 投递字节使用 skills/wh-review/scripts/review-materials.mjs:426 的脱敏规则（遇中文标点停止），而声明的 packet material id 使用 runtime/review/review-packet-identity.mjs:7 的旧规则（继续吞掉路径后整行）。真实触发是 https:// 中的 s:/ 命中 Windows 盘符分支后吞掉整句中文。结果：detail 声明 8243e7e8…、broker 对实收字节算出 f807724e…；direction 声明 653d9312…、broker 算出 421f2802…。broker 按实收字节计算是正确的，外层 parser 拒绝的是合法 envelope。
2. 材料路径不匹配：direction flow 被投递为 materials/09-direction_flow.json，而 broker 的 validateDirectionReviewMaterial 要求末段恰为 direction_flow.json，序号前缀使 endsWith 失配。用 broker 自身 validateAttachments 对真实冻结字节复算：content_entries 含该文件而 finder 返回 NONE。
3. 观测缺陷：start 请求已发出、broker 已创建 runtime，attempt 仍记 blocked_before_dispatch、provider_attempts=[]、runtime_id 缺失，且 provider_results 取值自 review-provider-client.mjs 中并不存在的 error.managed_observation。因此该记录不能作为“远端未执行”或“可安全重派”的依据。

### 已完成的修复（F1–F7，未提交）

新增 runtime/review/provider-material-projection.mjs 作为脱敏规则与 provider 材料路径规则的唯一实现（原计划文件名 host-path-redaction.mjs 因同时承载路径规则而改名为 provider-material-projection.mjs，已登记 move-map）；review-packet-identity.mjs 与 review-materials.mjs 改用它；simple-review-runner.mjs 以 direction_flow.json 投递 flow、并在 dispatch 前用 deliveredMaterialId 对实际写入的字节复算身份，不一致即本地失败；authenticated-evidence.json 现按 broker 的口径计入声明身份（原“base material identity 不含证据”的旧语义由既有 authenticated_evidence_sha256 承担）；review-provider-client.mjs 接受 broker 真实的 health 形状（error 可省略、status 可为 pending）；被拒绝的 managed envelope 现携带 managed_observation，attempt schema 与 review-record-route.mjs 接受并保留 sent_unparsed。

验证证据：quality/evidence/review-protocol-repair/RED-GREEN.md；SHA256=86c763104e338b612baeb503d140d89ff37263b48de374e91358e7ee5649196d。修复后按真实捕获请求复算：detail 声明身份 = f807724e…（与真实 broker envelope 一致）；direction 声明身份 = broker 自身代码算出的 621f31ca…。RED 已证：修复前新增回归测试失败，修复后 103 个 wh-review 测试与 59+193 个 contract 测试通过；acceptance-execution-tier.test.mjs 的 4 个失败经同 worktree 同分支原地回退对照确认在基线同样存在。

### 保全的远端证据

detail 两个 runtime 的 broker 原始状态（public.json、state.json、材料、provider 原始输出）已就地保全到 quality/evidence/review-late-results/（说明见同目录 INDEX.md；SHA256=c09693828e7b9984b9579c92b4e6ae3873f098c8592d8599b23ba20271e99c17），原因是 /tmp/3rd-review 的 24 小时 TTL 于 2026-09-20T12:13:38+08:00 到期。该保全只是原始证据，不是审查通过，也不得导入为 current pass。

### 仍未完成

上述修复完成后用户已授权发起真实审查。方向审查已按 material_changed 依据重新执行并取得可消费语义结果（见下节）；detail 审查已按同一依据发起，结果未回。最终用户确认、interaction aggregate、stage-end spec analyze、publish-decision、stage-reflection 与正式 stage handoff 均未执行；未进入 build-prd。

## 方向审查重跑结果与处置（2026-09-19 续接会话）

修复后按正规入口重新发起了一次真实方向审查（`stage-runtime.mjs review --action=record`，非自拼 payload）。复用键命中上一次 unavailable 的方向审查，因此按 `retry.basis=material_changed` 重新派发；依据成立的原因是投递材料身份确实改变（direction flow 路径由 `materials/09-direction_flow.json` 改为 `direction_flow.json`），重试已被接纳。

### 本次结果（可消费）

- pair_id：b842d4d4-cbc9-4e38-99ef-643481c09f85；两个角色均 semantic_status=available、partial=false、coverage=satisfied。
- red attempt：quality/reviews/attempts/9782031c-399d-509a-ab90-3cb7b10b7b13/attempt.json；SHA256=f8da0a5b8566071f9904a179f5a5011bdd2949ce6c0f5c47991e8459d61e6387。
- red result：quality/reviews/results/make-decision-simple-9782031c-399d-509a-ab90-3cb7b10b7b13.json；SHA256=bacaf47ba6ae6927ae0115cedb35e8f38df752a44ade0a77e2be072bfbd10f44；6 findings。
- blue attempt：quality/reviews/attempts/32164320-8c20-5a28-af03-204cb4fc48be/attempt.json；SHA256=2e30d06e30c5b54eac2548037104d087ce1c015f3fcd33f44fd0d013372467b6。
- blue result：quality/reviews/results/make-decision-simple-32164320-8c20-5a28-af03-204cb4fc48be.json；SHA256=6203b1a5a2e18bacb0426d4b65b6143dab2445fb20545471bb4d05a998846343；5 findings。
- pair report：quality/reviews/reports/make-decision-simple-5cd13506-c985-5244-aee8-9d3794386132.md；SHA256=1c4beec8a83c375e73fea908ce473dc535f07be5a16e7fea52a74ea101b896ea。
- 两个 attempt 均 terminal_status=semantic、dispatch_state=dispatched、provider_attempts=3、material_id=621f31cab96a79af0ad932f3297b3e2f5e2cf2a0354a5973743731ade58c0019（与 broker 实算一致）。修复前的 blocked_before_dispatch 与空 provider 清单不再出现。
- 无 blocking 级 finding；共 11 条原始 finding（红 6、蓝 5），adjudication 聚类 17 条。

### 合并后的方向级争议（按根因）

1. **方向只定了定位，未定边界**（红-1、蓝-1、蓝-5、红-5、红-6）：OI-001..OI-008 仍 open，核心边界、文档模型、TDD、并行、审查工具、迁移与页面范围未决；"最小有用范围"因此无法验证。多条要求先产出显式 keep/delete 清单（现役校验器、freshness 规则、阻塞 gate，各自对应 U-001 的痛点）。
2. **审查工具替换无评估路径**（蓝-2、蓝-3、红-2）：替换属用户八点之一且 OI-005 open，但 alternatives 只覆盖 runtime/认证维度，替换收益与 net 时间/token 未测量；建议改成有证据门槛的实验并保留 fallback。
3. **去掉跨宿主认证后无失败面替代**（红-2、聚类 F-c0fc76fd15c2、F-24449e5e41e4）：承认失去自动 cross-host currentness 保证，但没有替代检测，陈旧/不完整 handoff 记录下恢复会无信号；建议保留一个窄的"记录完整性/回读"检查。
4. **材料内部不一致（可直接修）**：`convergence_outline` 把 OI-009 标为 open，而 `current_selection` 已记录 U-007 选 A（红-3、蓝-5）；`product_positioning` 的批准边界提到 "OCR选型"，而包内没有任何 OCR 主题（蓝-4）。
5. **被否替代方案缺少其自身要求的证据**（红-4）：拒掉"保留最小必需 runtime"时未给出其描述要求的证明，也未声明该比较延期及其重访触发条件。

### 处置状态

按 make-decision step 10 的规则，上述第 1、2、3、5 项属方向级/影响验收的争议，须经条件性 Talk round 4 与用户真实回复决定，主会话不得自行改写产品方向；第 4 项是材料内部不一致，待用户确认后可当场修正。**尚未进行任何方向级改写，也未替用户作答。** 本节的 finding 文本与聚类只在 task store 原件中，未复制进材料。

## detail 审查重跑结果与处置（2026-09-19 续接会话）

方向审查取得可消费结果后，按同一正规入口与同一 `material_changed` 依据重新发起了一次真实 detail 审查。

### 本次结果（可消费）

- pair_id：ef00cd54-f083-41b4-b1e3-0c4a2974cfc5；两角色均 semantic_status=available、partial=false、coverage=satisfied。
- red attempt：quality/reviews/attempts/dc3df961-dddd-54af-a654-603d8c360ba9/attempt.json；SHA256=05c9ccbd3f998b472d12472585d999905c165a59790f68556ac943200e0fe133。
- red result：quality/reviews/results/make-decision-simple-dc3df961-dddd-54af-a654-603d8c360ba9.json；SHA256=e1535a9f3fe5a8e431f51385071008ba52e59ffef1419a0bf3ee8cc925b96d21；13 findings。
- blue attempt：quality/reviews/attempts/7d580780-26ee-5e79-a863-fcdc934cd309/attempt.json；SHA256=c0d672dbe664ca65af869266237c9e37c77259193ae0db305b847bdced0a4fae。
- blue result：quality/reviews/results/make-decision-simple-7d580780-26ee-5e79-a863-fcdc934cd309.json；SHA256=b2babe1e19088fde2f70add6975c782af0e78be6899e9fc71083e0549c8662c7；13 findings。
- pair report：quality/reviews/reports/make-decision-simple-5402186e-4f9b-5d87-afd9-16eec266d0a5.md；SHA256=6789ae06eae66a3e539e1db9bf85087d2e5bb126687376bf8a94e52615263ddb。
- 两个 attempt 均 terminal_status=semantic、dispatch_state=dispatched、provider_attempts=3、material_id=f807724eca58474466ab7e0390443071e490beb31b72bdee38d41416dfa1a296，正是修复前该 detail 包被 broker 实算出的 id；外层身份分叉在真实运行中已消失。

### 合并后的主要争议（按根因）

1. **送审材料集不完整（已核对，纠正 reviewer 的具体断言）**：reviewer 称 D-001 的 `requirement_ids: [R-001..R-014]` 在任何材料中都没有定义（红-2、红-5、蓝-6、蓝-8）。核对权威材料：这 14 个需求的完整定义表存在于本 decision-log 的 R-001..R-014 行，但**未包含在本次 detail 送审包内**（送审的 `draft_spec_or_acceptance` 只覆盖决定草案之后的段落）。因此该断言对权威材料不成立，但对"审查面"成立——真正缺陷是送审材料集与被引用来源不一致，与第 4 项同根因。**不据此删除 `requirement_ids`**；正确处置是把需求目录纳入送审/确认材料集。
2. **总体验收主体自相矛盾（可核对）**：草案第 33 行把总体功能验收交给任务地图指定的实施任务，第 42 行却说由"执行主会话围绕 PRD 组织"；在 U-008 的独立 task 拓扑下不存在跨任务执行主会话（红-7、蓝-13）。
3. **验收标准悬空**：成功/失败边界称"具体重构验收标准由 OI-004 收敛"，但 OI-004 仍 open、Grill 已零题结束、本阶段只剩最终确认，没有任何步骤或负责人承接该收敛（红-1、红-9、蓝-9、red-10）。
4. **材料集不含被引用来源**：T-001/T-002 引 U-003、OI-009 引 U-006、多处引 B-005..B-008/ADR-0031/CONTEXT/decision-log，而这些都不在提交材料内，批准边界声称只批准"下方真实用户选择"，该证据链无法在审查面内核对（蓝-4、蓝-5、红-6）。
5. **OI 台账与草案不一致**：OI-001..OI-008 仍标 open，而草案正文已对部分 OI 给出处置（如 OI-008 不新增页面、OI-003/OI-006 删除与工具边界）；Grill 记录称覆盖无遗漏却漏了 page_scope（红-8、蓝-1、蓝-7、蓝-12）。
6. **Grill 记录残留旧文档权威**：04-context_map.json 的 Grill 记录仍写"spec 承载权威用户目标和跨任务需求"，与草案按 U-008 收敛的"PRD 独占、spec 仅引用"相矛盾（蓝-11）。这与协议修复期间发现的 decision-log 单行漂移是同一处语义。
7. **缺少交接与失败状态语义**：跨会话交接把不同状态压成"未完成"，未定义拒绝/修订/阻塞/取消/恢复/未验证/已接受残余风险的状态与再入点；迁移无切换标记与旧任务分类；review findings 如何影响完成度未定义（红-12、蓝-2、蓝-3、蓝-10）。
8. **简化没有可检查的删除验收**：薄核心未给最小产物集、事实单一权威、待移除消费者与"无重复契约"的可判定标准；TDD 未绑定到任务级可观察行为（红-3、红-11）。
9. **确认流未保留方向性重建**：红-13 认为确认流未保留 reconstruct→reveal→challenge 且未在 reveal 前隐藏当前选择。

### 处置状态

第 1、2、3、6 项是可在材料内当场核对并修正的不一致，主会话可直接修；第 4、5、7、8、9 项涉及范围、验收主体、交接语义与确认流程，属方向级/影响验收的争议，须经条件性 Talk round 4 与用户真实回复决定。**尚未修改草案正文、未改写 OI 台账、未替用户作答。**

## Talk round 4（细节审查后，2026-09-19 续接会话）

用户对两类审查 findings 的处置给出真实回答，同一条回复含一次真实纠正。

| 编号 | 主题 | 用户真实回答 |
| --- | --- | --- |
| Q1 | 送审/确认材料集 | 纳入被引用来源：需求目录 R-001..R-014、U-003/U-006、B-005..B-008、ADR-0031、CONTEXT、decision-log |
| Q2 | OI-004 收敛归属 | 显式改派给 build-prd，作为命名的可检查交付项；统一原“由 OI-004 收敛”的悬空表述 |
| Q3 | 总体验收主体 | 统一为“任务地图明确指定的实施任务承接”，删除“执行主会话围绕 PRD 组织总体验收” |
| Q4 | 审查工具与跨会话保证 | 两项都接受：(a) 审查工具替换改为有证据门槛的对比实验并保留 fallback；(b) 保留窄交接状态集 + 记录完整性回读检查 |
| Q5 | 页面范围 OI-008 | 明确边界（不新增页面/仪表盘，并说明是否影响现有交互面） |
| Q6 | 文档集与阶段产物 | 按草案：规划任务只到 PRD（全局产品权威）；每个实施 task 的 build-plan 产 spec.md + 工作包说明 |
| Q7 | TDD 强度 | 保持草案的“有条件 TDD”（只对可观察行为变化且能先失败时做 RED） |
| Q8 | 删除边界 | 保持“删除目标职责 + 后续核查”，不在本阶段定死具体文件清单 |
| Q9 | 子代理与并行 | **按工作类型派发子代理**（实施/测试/审查各自独立上下文）；修复由**实施子代理**在连续上下文中承接；主会话只做结果回收与任务派发，不承担大量阅读或编辑，保持主会话上下文干净 |
| Q10 | 页面范围（具体） | 完全不碰 UI：不新增页面/仪表盘，也不改动现有 make-decision/detail/direction 的交互展示与数据状态 |
| Q11 | 旧任务与历史的过渡 | 完全不管：未完成旧任务与历史一律只读，不产交接记录、不做兼容 |
| Q12 | 最终确认的交互形态 | 要：先重建用户目标，再揭示当前已选方案，再让用户逐条挑战，而不是直接问“同意吗” |
| Q13 | 审查发现如何影响完成 | 用户指出该问题问得过于抽象。真实答复：新流程只有 build-code 与 verify-code 需要审查；**每次审查只要审查成功就不再复审，该修复的修复即可**，不希望反复审查浪费时间。主会话按此把它落成具体规则（见“审查、失败与真实完成”），不建严重度门槛 |
| Q14 | 发散环节形态 | **不新增轮次**：发散与设计并入第一轮 Talk、调研与方向审查 |
| Q15 | 需求保真档位 | 三档结论（接受 / 接受但有偏离 / 拒绝）+ 偏离必须写明改了什么为什么 + 原始声明逐字保留 + 原话一改即把派生项标记待复核 |
| Q16 | 验收标准时机 | 就在 make-decision 写成可执行形式（条件→系统必须做什么 + 可度量成功标准 + 至少一条失败或边界场景；写不出标 incomplete） |
| Q17 | 实现文档形态 | 一份权威 spec + 每个 phase 只写本检索边界内的差异 + 常驻紧凑索引，细节按需读（用户接受以此取代“每 phase 一份完整文档”） |

### 用户纠正（真实回复，优先级最高）

用户指出：Q1–Q5 这类问题（材料集、OI 状态、需求编号、责任人措辞）**与 WorkflowHub 流程改造本身无关**；具体方案从未与用户逐条讨论，需求尚未收敛，照此无法设计 PRD，等于凭空做。要求主会话把**具体方案本身**端出来逐条讨论，而不是只收敛材料记账。

该纠正即刻生效，约束后续交互：**以方案内容为主线**；材料自洽性、台账状态、编号一致性等问题由主会话直接修正，只做简短披露，不再作为向用户提问的主体。同时确认：上述 Q1–Q5 是真实回答，仍按答复执行。

### 用户在最终确认阶段的新增要求与流程纠正（Round 3 续）

用户在“逐条挑战”中给出真实回复，包含新增需求与一次方法论纠正。以下为逐字含义的整理，未经改写。

**新增/修订需求**

1. **spec 要成为实施前的“翻译”，不能只是实现设计**：任务 spec 需包含更标准的需求文档、验收流程、测试标准、架构方案，把 decision-log 的原始需求在实施前做必要翻译；结构更清晰、内容更清楚、验收更明确。
2. **禁止“phase 全做完但一次真实验收都没做过”**：当前 WorkflowHub 的验收与测试极差，几乎全是脚本测试代码，没有真实验收，功能是否做好无法判断，用户只能自己验收才发现大量问题；**多个测试技能从未被正常使用**。新流程必须让真实验收与测试技能真正被执行。
3. **每个 phase 一份实现文档**：内容包含背景、方案、流程、影响范围、测试标准、验收流程；避免现在 task 文档的问题，提供更清晰的实现指引。
4. **每 phase 一文档的动机之一是上下文控制**：一个 phase 一个文档可避免 agent 上下文爆炸。
5. **并行要在计划阶段设计**：除“实现/审查/测试各为独立子代理”外，多个子代理、多个 task、多个 phase 应在任务计划阶段就设计并行规则，避免全部串行；整个计划设计好后可并行 2–5 个子代理执行，主会话负责收集回复、派发任务、归纳与验收。

**方法论纠正（优先级最高）**

用户指出：现有 8 个决策基本是用户自己提出的，主会话**没有为这些需求做过详细的外部与内部调研，也没有提出 8 点之外的任何想法**。make-decision 阶段主会话的职责应是**与用户一起扩散想法**，而实际一直在**收敛用户自己的想法**。该纠正即刻生效：主会话须先补齐内外部调研，并给出 8 点之外的新候选方向，再由用户决定取舍。

**对既有收敛结论的影响**：新增需求直接推翻了部分刚收敛的结论（文档形态、真实验收机制、并行规划），因此 OI-001、OI-002、OI-003、OI-004、OI-006 重新打开（status=open）并登记 reopen_reason；OI-005、OI-007、OI-008、OI-009 的结论不受影响。

### Grill（续接会话真实执行的一轮）

收口时运行时要求 interaction aggregate 的 Grill 至少含一轮真实 ask→wait→reply→resume；此前该步骤为 0 题完成、没有问答事件，因此按同一 Grill 步骤真实补跑**一批独立前沿问题**，用户逐题以选项作答。

| frontier_id | 前沿问题 | 用户真实回答 | 处置含义 |
| --- | --- | --- | --- |
| G-1 | 并行前已冻结接口蓝图，若实施中发现接口必须改，怎么收场 | 停并重排 | 停并行、由主会话重排后继续；那批并行收益作废，但不产生静默不一致 |
| G-2 | 验收要求“改动前是红的”，若某任务确实先写不出失败测试（纯文档、探索性改动） | 显式豁免 + 必须披露 | 必须补一条可失败的检查或写明豁免理由与风险，并在验收中披露；不允许直接跳过 |
| G-3 | 删除清单交 build-plan 核查，若发现某待删机制其实在承担安全职责（如授权前脏目标预检） | 停下回报，由你定 | 实施任务立即停下回报，由用户决定保留或继续删除；不允许自行保留并静默回写 PRD |
| G-4 | 发散并入第一轮 Talk/调研/方向审查后，若仍觉选项不够 | 自动再发散一轮 | 按“取消固定轮次、按未知问题触发”自动再跑一轮发散，不凑数也不压制 |

上述四条即时生效，作为方向级的 Grill 结论进入 build-prd 的输入；它们不新增 gate，只约束后续实施任务与并行、验收、删除边界的处置方式。

## make-decision 自身改造要求与机制诊断（2026-09-19 续接会话）

改造机制的完整候选与来源索引见 quality/evidence/research/make-decision-redesign-candidates.md（三路调研整理稿：12 条机制 + 14 条八点外候选 + 10 条失败模式）。

用户新增要求：**make-decision 本身也是被改造对象**（已登记为 OI-010）。

### 用户原话要点

1. 没有帮用户做详细调研，没有给出更丰富的想法和方案；
2. **把用户本身的需求弱化了，而且没有告诉用户**；
3. 现在的 make-decision 有严重问题，**完全没起到作用，变成纯粹的记录工具，还是弱化版的记录工具**；
4. 期望它是一个**头脑风暴平台**：用户提出模糊需求时帮其**扩散、丰富、细化**，同时帮其**整理、设计、收敛**，最终生成一个完美的 decision-log，方便后续 build-prd 或 build-plan。

### 机制诊断（每条都有文件与行号证据）

| # | 机制 | 证据 | 后果 |
| --- | --- | --- | --- |
| 1 | **完全没有发散环节**：`发散`/`扩散`/`头脑风暴`/`brainstorm`/`diverge` 在三份技能里出现 **0 次** | `workflows/make-decision/SKILL.md`、`skills/talk-with-zhipeng/SKILL.md`、`skills/grill-with-docs/SKILL.md` 全文 | 只设计过收敛，没有设计过扩散 |
| 2 | **先收窄、后调研**：step 2 `triage-scope` 在 step 4 `research-inputs` 之前就把范围、不确定性、非目标**定稿** | `workflows/make-decision/steps.json` 顺序；SKILL.md:380「S 回传范围、不确定性和非目标草案；M 定稿」 | 研究被已收窄的范围限制，产生不了范围外想法 |
| 3 | **主会话被定义为登记者**：「候选由 S 生成、M 选择；…**M 只登记**」；「问题卡与用户回复**只登记**在 decision-log T 表」 | SKILL.md:404-405 | 交互面只剩“选一个”，没有“一起想” |
| 4 | **研究结论回传被压到 ≤500 字**：「研究/草稿/汇总类**不超过 500 字**」 | SKILL.md:401 | 丰富性在到达用户之前被挤掉——这正是“没有更丰富的想法”的机制 |
| 5 | **Talk 技能是纯收敛器**：2–3 个互斥选项、最小合理假设、禁止开放式填空、到阈值即结束；且明确「不得要求用户自己写第四个方案」 | `skills/talk-with-zhipeng/SKILL.md` §2、§2.1、§4、L89 | 用户自己的扩展被规则禁止，选项只能来自 agent 已有认知 |
| 6 | **覆盖核对只按类别、不校验强度**：只检查六节点/类别有无覆盖，不比对每条原始需求是否被削弱 | SKILL.md:188、443-448 | 弱化在检查里不可见，所以既没被发现也没被告知 |
| 7 | **验收 oracle 本该在这里定，却被推走**：SKILL.md:156 明确「验收在这里明确用户场景、数据来源、成功 oracle 和失败条件」，当前草案却推给 OI-004 与 build-prd | SKILL.md:156 对照决定草案 | 属执行漏项，也是“真实验收从未发生”的上游原因 |
| 8 | **并行是固定上限 + 顺序优先**：「并行上限固定为：研究 4、debate 4、红蓝 2；交互步骤与依赖链按顺序执行，不为并行而并行」 | SKILL.md:402-403 | 与用户「计划阶段设计 2–5 路并行」方向不一致 |

结论：现有 make-decision 被设计成收敛器，并把收敛器的输出当作唯一产出；它缺少发散设计、缺少需求保真校验、缺少“研究结论完整到达用户”的通路。这三条缺口与 U-001 第 1、2、4 点被削弱的机制同源。

## CPU 与温度问题:实测诊断（2026-09-19 续接会话）

用 `ps` / `top` / `sample` 实测，结论:**不是 kernel**。

| 发现 | 证据 | 影响 |
| --- | --- | --- |
| **3rd-review 泄漏的 managed session manager** | PID 75088 `node 3rd-review/lib/managed-session-manager.mjs <tmpjob> <runtime> <operation>`，父进程已为 1，已运行 **18 小时 9 分**，生命周期均值 **35–37% CPU**；`sample` 显示 CPU 全部烧在 **uv__run_timers → V8 函数调用**（2506 采样中 1827 在 timers），即定时器回调高频空转 | 单进程长期吃 1/3 核，是持续发热与高基线的直接来源 |
| **泄漏的 provider 桩进程** | PID 75346（manager 子进程）与 PID 6792，命令为 `node 3rd-review/test/slow-cli.mjs ... --output-format stream-json`；其中 6792 已运行 **1 天 6 小时**。`slow-cli.mjs` 全文只有 `setInterval(() => {}, 1000)`，是测试桩 | 说明 broker 侧**没有回收**已死任务的 manager 与 provider；3rd-review 自身的测试运行也会留下泄漏 |
| **审查客户端每秒 spawn 一个 3rd-review 进程**（**已实测降级，非热源**） | 默认 `DEFAULT_MANAGED_STATUS_POLL_MS = 1000`，每次 `statusManaged` 经 `review-provider-client.mjs:169 spawn()` 起新进程。**实测单次 spawn 仅 0.03s CPU（模块加载为主）** | 数千次 spawn ≈ 秒级 CPU 总量，**不是**升温主因；已在 2026-09-19 把默认值改为 5000ms（边际收益，保留） |
| **并发 provider 数量** | 一次审查 2 角色 × 3 provider = **6 个 agent CLI 并发**（kimi / agy / codex），每个自身还会起子进程；另加每角色 1 个 broker/manager 与 2 个 stage-runtime 进程 | 峰值并发进程数与 CPU 占用高 |
| **Spotlight 索引抖动** | `mds` 4.0% + `mds_stores` 3.4% + `fseventsd` 7.5% ≈ 15% | worktree 与 `/tmp/3rd-review`（24 个 runtime 目录、38MB、大量小文件）持续被索引 |
| **DSH Desktop 渲染本会话** | DSH Desktop Helper (Renderer) 35.4% + Helper 19.1%，WindowServer 39.5% | 超长会话的界面渲染是独立热源；这与“主会话上下文要干净、减少自动压缩”的要求同源 |

**已执行的清理**:终止 PID 75088、75346、6792（均为孤儿或测试桩）。清理后瞬时占用回到 **用户 7.98% + 系统 7.13%，idle 84.88%**。

**已执行的三项缓解（2026-09-19，用户授权）**

- **⑤ 清理过期 runtime：已完成**。25 个目录中仅 3 个已过 TTL（31273acc、b9642fbb、dcef6bac），其余 21 个仍在 TTL 内、未触碰。删除时发现**材料目录被 broker 写成只读（`dr-x`）**，普通 `rm -rf` 会失败，必须先 `chmod -R u+w`；这同时说明 **broker 自身的 `cleanup()` 也很可能删不掉过期 runtime**，是第 ① 项回收修复必须处理的点。结果：24 → 21 个目录，36M → 31M。
- **④ Spotlight 排除：已实测否定，不再实施**。用 `mdfind -onlyin /tmp/3rd-review` 实测命中 **0**，说明 macOS **本来就不索引 /tmp**，`.metadata_never_index` 标记无意义（已移除）。**更正先前归因**：此前把 `mds`/`mds_stores` 约 7% 归因于 `/tmp/3rd-review` 是错的；索引抖动更可能来自 `~/Project` 下的 worktree（这些确实被索引）。排除项目目录会让用户**在项目里搜不到文件名**，属持久系统设置且代价明确，**未执行、留给用户决定**。
- **② 轮询间隔：已完成**。`skills/wh-review/scripts/simple-review-runner.mjs` 的 `DEFAULT_MANAGED_STATUS_POLL_MS` 由 1000ms 改为 5000ms（每次轮询都会 spawn 一个新 3rd-review 进程，故该间隔是直接的 CPU/进程抖动开关）；调用方仍可用已有的 `dependencies.managedStatusPollMs` 覆盖，未新增配置面。受影响测试通过（137 + 32），`check-skill-closure` ok，skill-bundle/catalog/move-map 声明哈希已同步刷新。

**彻底调研结果（2026-09-19，含更正确认）**

无特权重采样（无免密 sudo，故无 powermetrics 精确温度；改用 `top`/`pmset`/`log`/`mdfind`）：

- **稳态基线（没有任何 WorkflowHub 任务在跑）就已经很高**：瞬时占用约 15–17%（83–85% idle），但**前四名常年占一个整核**——`WindowServer` **34.8%**、`DSH Desktop Helper (Renderer)` **19.2%**、`kernel_task` **17.6%**、`DSH Desktop Helper (gpu-process)` **9.9%**。`WindowServer` 是 9 天 23 小时的**生命周期均值**约 35–39%。
- **`kernel_task` 17.6% 是温控征兆而非原因**：macOS 的 kernel_task 在高 CPU 时通常在做降频/停核补偿。
- **热压力已被系统记录**：近 30 分钟日志出现 `thermal-pressure Heavy` ×1、`Moderate` ×2、`Nominal` ×2；`pmset -g therm` 未记录 warning level（该字段只覆盖部分档位）。
- **任务期间的峰值已量化**：一次审查 = 2 角色 × 3 provider = **6 个 agent CLI 同时运行约 5.6–6.0 分钟**（今日真实运行：direction kimi 133s / antigravity 138s / **codex 333s**；detail kimi 242s / antigravity 212s / **codex 360s**），外加上限 20 分钟的角色等待循环与 broker/manager 进程。
- **Spotlight 索引面已量化**：`mdfind` 命中 `~/Project` **362,519** 条、`~/Knowledge/Projects/workflowhub` **76,293** 条、`/tmp/3rd-review` **0** 条。索引抖动的根因是**文件数量**（10 个 git worktree + `~/.codex/worktrees` 15 个目录 + node_modules），不是 /tmp。

**结论：温度问题的结构是“高基线 + 高峰值”**。基线来自 GUI 渲染与内核温控补偿，峰值来自 6 个并发 agent CLI。

**可直接现在修复（环境层，不动产品代码）**
1. **重启一次**：已连续运行 9 天 23 小时，`WindowServer`/`kernel_task` 常年占核，重启是最可能一次性显著降温的动作（代价：结束当前会话与在跑的工作）。
2. **Spotlight 排除 `~/Project`**：macOS **没有受支持的命令行接口**可写 Spotlight 隐私列表（该列表是 System Settings 的二进制 sfl），只能用 GUI 拖入；已为用户打开设置面板。代价：项目内文件名将搜不到（用户已接受）。
3. **关闭不需要的常驻重后台**：ToDesk（远控持续抓屏，会推高 `WindowServer`）、极空间/ZSpace、WeChat/企业微信、Adobe CC、CodexBar、VS Code、Agents Anywhere 等。
4. **本会话自身**：DSH 渲染器 + GPU 进程约 29%，与这个超长会话的渲染量直接相关；**收窄上下文或另开会话**可直接降低（与 OI-002/OI-010 的“主会话上下文干净”同向）。
5. 可选：清理陈旧 worktree（`~/.codex/worktrees` 15 个目录）以减少被索引文件数——属删除操作，需用户明确授权。

**应放 decision-log（产品层改动）**
1. broker 加回收（含先解除只读，否则 `cleanup()` 删不掉过期 runtime）；
2. 限制单次审查的并发 provider 数（6 个 agent CLI × 6 分钟是任务期峰值主因）；
3. 减少材料与证据写入量（索引抖动的根因是文件数，与 OI-003 删除重复证据包装一致）；
4. 主会话只派发与回收、工作交子代理（减少常驻进程与 GUI 渲染，与 OI-002/OI-010 一致）。

**仍待实施的优化**（属产品改动）：


## UI applicability

三源按证据合并；本任务明确“完全不碰 UI”。

```json
{
  "result": "non_ui",
  "sources": {
    "raw_requirement": { "result": "non_ui", "description": "用户原始要求只涉及开发工作流的流程、文档、测试、审查与并行方式，未提出任何页面、交互或视觉要求" },
    "project_inventory": { "result": "non_ui", "description": "本仓为 Node CLI 与运行时项目，由 .mjs/.md/.json 构成，无前端框架、无路由表、无组件目录" },
    "planned_or_changed_frontend_fact": { "result": "non_ui", "description": "本次为规划任务且用户明确不碰 UI，不计划也不涉及任何前端改动" }
  }
}
```

## 收敛检查

| 维度 | 用户答案 | 事实与材料引用 | 可执行验收 |
| --- | --- | --- | --- |
| 目标 | 用户确认 Round 3 T-006 与 U-007 A：以真实交付结果而非流程形状为准 | R-014、OI-009、decision-log.md#范围 | 见「验收」行 |
| 范围 | 用户确认 U-008 与 U-009：规划任务只到 build-prd，只做规划，不碰 UI | R-009、R-017、OI-010、decision-log.md#非目标 | 见「验收」行 |
| 方案 | 用户确认 U-007 A 与 U-009；取舍：保留窄工具与真实审查、删除通用事实引擎；被拒方案：独立执行平台、逐阶段机器认证、每 phase 一份完整文档；无未决项 | R-001、R-008、D-001、OI-001、OI-003 | 见「验收」行 |
| 验收 | 用户确认 U-003 T-002（实跑 + 抽验）与 U-009 | R-001、R-016、OI-004 | 场景：在本 task worktree 内执行 make-decision 并按 U-008 拓扑接 build-prd；数据来源：真实 run 输出、facts.jsonl 与两类独立审查原件；通过：make-decision 的 completion.status 为 completed 且 quality_missing 为空；失败：任一必需 predicate 仍为 missing，或审查 unavailable 被写成通过 |

U-010 追加（2026-09-19）：U-010 三条已经 Talk round 5 收敛（OI-012/013/014 confirmed），目标/范围/方案/验收四要素在新增记录中齐备。

## 大白话结束卡

### 核心需求

用户要 WorkflowHub 变成一个能真正干活、不拖时间的开发工作流：不再被流程和证据要求卡住，不再反复来回；规划任务先把需求彻底收敛成 PRD 与任务地图，之后每个实施任务独立跑四阶段；验收必须靠真实入口跑通，不能全是脚本自证；测试与审查技能必须真的被用；方法和技能可以在不同 AI 助手里复用。

### 核心目标

实现一个薄核心的方法工具包：现有 AI 助手干活，WorkflowHub 提供方法与少量窄工具；达成可观察结果——make-decision 一次收敛出完整需求与边界，实施任务按计划并行推进，整体功能由真实入口实跑确认而非子任务状态相加。

### 已选方向

已选方法工具包（U-007 A）并保留真实验收、独立审查与危险操作授权。取舍：保留窄工具、真实命令证据与历史只读，删除逐阶段机器认证、重复证据包装、plan/tasks 双写与固定轮次；被拒方案：独立执行后台平台、把旧引擎换名搬进技能、每 phase 一份完整文档、每 task 一个新代理。未决项：具体删除文件清单与并行收益实测留待 build-plan 与实施任务。

## 成功/失败边界

规划成功目标：用户能核对完整工作流、范围、真实交付结果、失败处置、风险和后续逐任务实施边界；经真实 make-decision 确认后交给 build-prd。具体重构验收标准不在本阶段由 OI-004 收敛（Talk round 4 已决定）：它是 build-prd 的命名可检查交付项，须给出可观察的成功/失败用例、所需证据与承接负责人。

当前不能宣称：框架已实现、测试通过、审查完成、需求全部澄清、make-decision 完成、PRD 完成或物理交付。

## 风险与延期交接

风险：仅换文件名但不改消费者；把旧流程搬到技能里；把减阻塞误做成掩盖失败；新审查工具效果未经当前任务验证；并行边界不清造成覆盖写入。这些是待评估风险，不是新增执行 gate。

延期：本次规划确认后的实现、测试和交付由后续任务承担；具体迁移顺序和排除项尚未确认，保留 OI-007。

新增风险（U-010 / Talk round 5，2026-09-19）：R6=删除校验机器后材料偷换无机器防护——以两道人为门+独立审查+真实执行兜底，明示该取舍；R7=记录层停用内容寻址后文件名碰撞/覆盖风险——以不可变命名（日期+序号+描述）与只追加纪律缓解。

## Talk round 5（U-010 三问，2026-09-19）

本轮就 U-010 三条新需求向用户逐字提问并获真实答复，逐字记录如下：

- 问1「『不应该有任何阻塞』的边界」→ 答：**只留两道人为门，其余全删**——保留：推进中的人为确认对话+不可逆 Git 授权（宪法级）；删掉一切机器门禁；迁移表/并行声明/接口冻结改为「事实记录+验收核对」，不再做推进前置。
- 问2「哈希/快照/身份/材料/回执校验机器在新系统怎么处置」→ 答：**彻底全删**——连记录层的内容寻址也不用哈希，全部用普通文件名+纯文本引用。
- 问3「build-plan 审查合并的形态」→ 答：**是，合并为一次**——build-plan 完成后、build-code 开工前一次审查，同时覆盖 spec 与 phase 文件；质量核心=原 spec 审查（需求翻译/验收可执行/架构合理）+原 plan 审查（依赖/并行/写集）合一。

收敛登记：三条分别登记为 OI-012、OI-013、OI-014（status=confirmed），主覆盖矩阵与原始要求覆盖索引各新增 R-018、R-019、R-020 行。
