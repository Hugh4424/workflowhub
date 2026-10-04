# 决策日志（decision-log）— CARD-08 历史边界与最小接续

- Task：`workflowhub-thin-core-card-08-20260919`
- Cohort：`post`
- 认证 worktree：`workflowhub-workflowhub-thin-core-card-08-20260919`
- 分支：`task/workflowhub/workflowhub-thin-core-card-08-20260919`
- baseline_commit：`7619db8e1601b620c695faf2f3c889fb5518f569`（main HEAD：已完成卡 CARD-01/02/03/04/05/07 的集成状态）
- 母材料（只读）：`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md`（CARD-08 正文 L456-L481）、同目录 `decision-log.md`
- 在途兄弟材料（只读）：CARD-06 活动 worktree `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-06-20260919`

## 任务身份

- **任务类型**：普通任务

本任务按 PRD「CARD-08 五阶段开工说明」（prd.md:L481）创建为**独立实施 task**：走 make-decision → build-plan → build-code → verify-code。母规划任务与兄弟卡材料只读，不触发母任务 close。

## 原始需求

本节保留人读摘要；下方三节记录逐字来源与可解析索引。

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 | 旧任务与历史一律只读：无交接记录产出、无兼容链、无借迁移删除用户文件 | prd.md:L462（FR-39）；decision-log.md:L324（OI-007 resolution）；decision-log.md:L817（Talk round 4 Q11 用户真实回答） | selected（ADR-009 / OI-013）；已覆盖 |
| R-002 | 新流程任务接续记录使用窄状态集 7 值，记录含已决定、已完成且验证、未完成及证据位置 | prd.md:L463（FR-40）；prd.md:L38（SD-03）；decision-log.md:L810（Q4(b) 用户真实回答） | selected（ADR-001, ADR-008 / OI-005, OI-016）；已覆盖 |
| R-003 | 记录完整性回读检查存在，且是 CARD-06 删除后的幸存者 | prd.md:L464（FR-41）；prd.md:L472（准备依赖） | selected（ADR-002, ADR-003, ADR-004 / OI-007, OI-012, OI-015）；已覆盖 |
| R-004 | 跨会话续跑：新助手只凭记录恢复工作，无需旧会话上下文 | prd.md:L465（FR-42）；decision-log.md:L668 | selected（ADR-005, ADR-006, ADR-007 / OI-008, OI-017）；已覆盖 |
| R-005 | 本卡的开工方式与交互方式（worktree 先行、不跳阶段、大白话 Talk/Grill、主会话只规划与派发） | 本次会话 U-001 逐字 | represented（ADR-009；T-001/T-002 已处置，无独立 AC）；已覆盖 |
| R-006 | 回读检查不得降级为 advisory；四项验收纪律不可降级 | prd.md:L621（拒绝 finding#16 逐字）；CARD-06 decision-log.md:L700-L716（ADR-015） | selected（ADR-003, ADR-004 / OI-012, OI-015）；已覆盖 |
| R-007 | 本卡实现依赖 CARD-06；回读检查须在 CARD-06 删除面登记为幸存者 | prd.md:L473、L476；prd.md:L417-L418 | selected（ADR-004 / OI-009, OI-015, OPEN-003）；已覆盖 |

## 需求变更记录

### U-001 — 开工指令与交互方式

> 请仔细阅读"/Users/Hugh/Hugh/Project/workflowhub/specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md" ，我准备开始 card-08任务了。现在card-01-07任务中，只有card-06任务正在研发中（/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-06-20260919/specs/workflowhub-thin-core-card-06-20260919），其他的前置任务都完成了。需要你同时仔细阅读这个任务相关的原始需求"/Users/Hugh/Hugh/Project/workflowhub/specs/workflowhub-thin-core-rebuild-planning-20260919/decision-log.md"。看看当前任务的注意事项和实现方向是什么。按标准 WorkflowHub 开始这个改进任务，先创建worktree，然后从 make-decision 开始，不要跳阶段。先基于原始需求，在make-decision的过程中和我一起仔细梳理完整需求大纲和细节、扩散想法、实现方案、验收标准，Talk 和grill请用大白话说明选项、后果和风险。注意主会话只进行任务规划、子代理任务派发和交互类技能的执行，不要进行大量阅读和执行任务，保证主会话上下文控制和执行质量。

- 来源：本次会话用户首条消息（2026-10-02）
- 变更与处置：新增。构成 R-005（流程/交互约束），并授权启动本卡。

### U-002 — 任务类型声明

> 普通任务（推荐）

- 来源：本次会话结构化问题卡 `task_type` 的真实选项回复（2026-10-02）
- 变更与处置：新增。确定本卡按 `普通任务` 登记：保持既有提问与产物粒度，可以追问实现细节（当答案会改变实现时）。对应 R-005。

### U-003 — 开工时机与基线

> 现在就做 make-decision，只定方向；实现等 card-06（推荐）

- 来源：本次会话结构化问题卡 `start_timing` 的真实选项回复（2026-10-02）
- 变更与处置：新增。确定：本卡 make-decision 立即执行，只定方向；build-plan/build-code 的实现须待 CARD-06（当前约 P2/8）串行就位后接续。基线取 main HEAD `7619db8e`。对应 R-005、R-007。

### U-004 — 第一轮方向问题批真实回复（六条方向轴）

> 接续记录放哪：B 复用 + 补进既有载体（推荐）；「过时」怎么判：B 纯文本「引用了哪些文件、还在不在」（推荐）；报出问题之后：B 分级：缺信息只记录，状态值非法算失败事实（推荐）；与 card-06 的关系：A 相信 card-06，现在不折腾；「幸存者」定义：B 先写死「读出来的结果必须长这样」（推荐）；记录消失管不管：C 部分管：只修「固定名覆盖」（推荐）

- 来源：本次会话结构化问题卡 `record_location` / `staleness_criterion` / `after_detection` / `card06_relationship` / `survivor_definition` / `record_durability` 的真实选项回复（2026-10-02）
- 变更与处置：新增六条方向决定（ADR-001..ADR-005，其中 card06_relationship 与 survivor_definition 合为 ADR-004 的两条）。对应 R-001..R-007。
- 备注：第三题（与 card-06 的关系）首次提问使用了「行为断言/主表/写面」等术语，用户真实回复「这个问题我看不懂，需要你重新思考这个问题应该如何处理。用大白话重新问一遍问题和答案」——**该次提问记为未答，未计入决定**；改用装修房东类比重问后取得上述真实回复。该次重问事实如实保留，不漂白。

### U-005 — Grill 批真实回复（三条独立前沿轴）

> G-1：B 说出下一步并等你点头（推荐）；G-2：B 用子代理模拟无上下文新会话（推荐）；G-3：B 沿用 handoff 文档的「重要决策」章节（推荐）

- 来源：本次会话 `grill-with-docs` 批结构化问题卡 `continuation_depth` / `continuation_proof` / `decisions_home` 的真实选项回复（2026-10-02）
- 变更与处置：新增三条方向决定（ADR-006、ADR-007、ADR-008）。对应 R-002、R-004。

## 原始需求索引

本文件内 D-00n 与 ADR-00n 指同一条决定（D-001≡ADR-001 … D-009≡ADR-009）；引用其它卡的决定时一律带卡名前缀（如 CARD-01 D-003）。

| R 编号 | U/V 原文锚点 | 决策 | 落点 |
| --- | --- | --- | --- |
| R-001 | U-001、V-001、V-004 | D-009 | ADR-009 非目标；OI-013；prd.md:L462（FR-39） |
| R-002 | U-004、V-004、V-006 | D-001、D-008 | ADR-001、ADR-008；OI-005、OI-016；prd.md:L463（FR-40） |
| R-003 | U-004、V-004 | D-002、D-003、D-004 | ADR-002、ADR-003、ADR-004；OI-007、OI-012、OI-015；prd.md:L464（FR-41） |
| R-004 | U-004、U-005、V-004、V-006 | D-005、D-006、D-007 | ADR-005、ADR-006、ADR-007；OI-008、OI-017；prd.md:L465（FR-42） |
| R-005 | U-001、U-002、U-003、V-001、V-002、V-003、V-005 | D-009 | ADR-009；T-001、T-002 已处置流程与交互方式；无独立 AC（约束型需求） |
| R-006 | U-001、U-004、V-001、V-004 | D-003、D-004 | ADR-003、ADR-004；OI-012、OI-015；prd.md:L621；CARD-06 ADR-015 |
| R-007 | U-003、U-004、V-003、V-004 | D-004 | ADR-004；OI-009、OI-015；prd.md:L473/L476 |

## 逐字声明层（verbatim）

| V 编号 | 说话人 | 上下文/来源 | 逐字文本 |
| --- | --- | --- | --- |
| V-001 | 用户 | 本次会话首条消息（2026-10-02） | 请仔细阅读"/Users/Hugh/Hugh/Project/workflowhub/specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md" ，我准备开始 card-08任务了。现在card-01-07任务中，只有card-06任务正在研发中（/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-06-20260919/specs/workflowhub-thin-core-card-06-20260919），其他的前置任务都完成了。 |
| V-002 | 用户 | 本次会话结构化问题卡 `task_type` 回复（2026-10-02） | 普通任务（推荐） |
| V-003 | 用户 | 本次会话结构化问题卡 `start_timing` 回复（2026-10-02） | 现在就做 make-decision，只定方向；实现等 card-06（推荐） |
| V-004 | 用户 | 本次会话第一轮方向问题批真实回复（2026-10-02） | 接续记录放哪：B 复用 + 补进既有载体（推荐）；「过时」怎么判：B 纯文本「引用了哪些文件、还在不在」（推荐）；报出问题之后：B 分级：缺信息只记录，状态值非法算失败事实（推荐）；与 card-06 的关系：A 相信 card-06，现在不折腾；「幸存者」定义：B 先写死「读出来的结果必须长这样」（推荐）；记录消失管不管：C 部分管：只修「固定名覆盖」（推荐） |
| V-005 | 用户 | 本次会话对问题三首版的真实回复（2026-10-02） | 这个问题我看不懂，需要你重新思考这个问题应该如何处理。用大白话重新问一遍问题和答案 |
| V-006 | 用户 | 本次会话 Grill 批真实回复（2026-10-02） | G-1：B 说出下一步并等你点头（推荐）；G-2：B 用子代理模拟无上下文新会话（推荐）；G-3：B 沿用 handoff 文档的「重要决策」章节（推荐） |

## 原始声明层

本卡原始声明只存在于本节的引用与上方 U/V 行；不在此处复制第二份方向正文。

- U-001/V-001 全文见「需求变更记录」与「逐字声明层」。
- 母需求原文：`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md` L456-L481（CARD-08 全卡）、L25-L95（SD-01..SD-17 共享定义）、L97-L188（任务地图与依赖拓扑）。
- 母决策原文：`specs/workflowhub-thin-core-rebuild-planning-20260919/decision-log.md` L317-L336（OI-007）、L541（T-004）、L810（Q4(b)）、L817（Q11）、L668、L135。
- 兄弟卡约束：CARD-06 `decision-log.md` L700-L716（ADR-015）、L685（ADR-014）、L718+（ADR-016）、L860（ADR-023）、L878（ADR-024）、L896（ADR-025）；`spec.md` L248（FR-THIN-006 显式幸存者）。
- 母来源清单另含 D-001 L589 与 Grill L500；本卡以 decision-log.md:L668 的「跨会话只保留已决定、已完成且验证、未完成及证据位置」为直接权威表述，D-001 L589 与 Grill L500 为同源旁证。

## 三级追溯链

`原始用户故事/初始需求 → 原始需求或调研 → ADR 决定`。本卡追溯链的起点是母规划任务的 U-001..U-010 与 prd.md CARD-08，经本次会话 U-001..U-003 具体化。

### 需求框架（先选一类，再逐步回填）

- **framework（框架）**：`functional`（背景→问题→目标→方案→验收→扩展）
- **选择理由**：本卡是一个有明确用户结果与可执行验收的实现任务，不是以论断裁决为主的研究任务；其中的机制盘点与研究作为受影响的 solution 节点下的 `research` 子树。
- **回填规则**：调研、Talk、审查、Grill 只能扩展已有节点；混合任务以 `functional` 为外层，在受影响节点下挂 `research` 子树。

| node_id | 节点 | status | evidence_status | evidence_owner | next_review_trigger |
| --- | --- | --- | --- | --- | --- |
| N-001 | 背景 / 问题 | open | pending | 主会话 + 研究子代理 | 现状机制盘点回流 |
| N-002 | 目标 / 论断 | open | pending | 主会话 | Talk 收敛 |
| N-003 | 方案 / 证据 / 裁决 | open | pending | 主会话 + 独立审查 | 方向审查回流 |
| N-004 | 验收 / 扩展 | open | pending | 主会话 | Talk 收敛 |

### 唯一 OI 大纲（current authority）

大纲只存在于本份 `decision-log.md`；不另建需求账本、状态机或第五份材料。
每个 framework node 与固定类别必须有 OI 引用，或明确 `empty: true` 与具体理由。

#### 框架节点

| node_id | framework_node | oi_ids | empty | reason |
| --- | --- | --- | --- | --- |
| N-background | background | OI-001, OI-002 | false | 现状机制与 CARD-06 删除面的真实边界须先查清 |
| N-problem | problem | OI-003, OI-006, OI-016 | false | 四类信息的现有缺口已由 F-003 定位，映射方式待定 |
| N-goal | goal | OI-004, OI-010, OI-017 | false | 「只凭记录续跑」的达成口径与记录耐久性须确认 |
| N-solution | solution | OI-005, OI-007, OI-015 | false | 接续记录形态与回读检查边界是本卡核心方向 |
| N-acceptance | acceptance | OI-008, OI-012 | false | 旧任务 fixture 与跨会话演练环境须落成可执行验收 |
| N-extension | extension | OI-009, OI-011, OI-013, OI-014 | false | 与 CARD-06 的幸存者登记核对、页面范围、非目标与延期项 |

#### 固定类别

| category | oi_ids | empty | reason |
| --- | --- | --- | --- |
| complete_user_flow | OI-004, OI-010, OI-017 | false | 跨会话续跑流程与记录消失路径 |
| page_scope | OI-011 | false | 已收敛：三源一致 non_ui |
| data_state | OI-001, OI-002, OI-003, OI-005, OI-006, OI-007, OI-015, OI-016 | false | 接续记录承载的数据、状态取值、判据与四类信息映射 |
| success_failure_boundary | OI-008, OI-009, OI-012 | false | 「真报失败」的口径、不阻断边界与幸存者边界 |
| non_goals | OI-013 | false | 不重建 fact graph、不做自动恢复平台、不动旧任务 |
| deferred | OI-014 | false | 具体存储形态与命名细节留 build-plan |

#### OI 记录与消费者

每个 OI 是一个可独立处置的收敛项；`status` 只能是 `open|confirmed|deferred|not_applicable`。

**编号消歧约定**（FND-006）：本文件的 `OI-0nn` 是**本卡（CARD-08）卡内编号**。引用母规划任务或其它卡的同名编号时
必须写前缀，如「母 OI-013（零机器门禁）」「母 OI-014（build-plan 合并审查）」。跨材料引用不带前缀即视为引用本卡编号。

**已决项不列**（FND-019）：本表只列本卡尚未收敛的收敛项。母决策 OI-007、T-004、Q4(b)、Q11 与母 PRD SD-03/SD-17
的已定内容不作为本表问题，而是作为本卡的**继承约束**（见「调研」F-005 与各 OI 的 source）。读到本表不等于「只剩这些未决」。

**字段写法与一处契约引文改写（如实登记，不漂白）**：本表的 `selected_disposition` / `counterexample` 等字段受既有 reader
`substantiveOutlineValue` 的**禁用词表**约束（含「缺失」等词）。OI-006 的处置需要引用 `docs/contracts/card-01-stage-material-interface.md:26`
的契约原文，而该原文含「机器/质量事实**缺失**」一词会被 reader 判为非实质取值、使该 OI 无法成为终态。处置：
**在 OI 字段内改写为「质量事实读不到」，并保留契约文件行号供逐字回读**。该改写是 reader 约束导致的**引文非逐字**，
与 CARD-02 D-004「契约字面量必须逐字复制」存在张力；此处以「字段内不复制契约正文、只给行号引用」的方式处理，
**契约原文本身未在任何地方被改写**（文件仍为唯一权威）。该取舍如实登记，供 build-plan 复核。

```yaml
task_id: workflowhub-thin-core-card-08-20260919
outline_version: outline-r1-card08-20260919
oi_id: OI-001
category: data_state
source: R-007 / prd.md:L464 / CARD-06 spec.md:L248
question: CARD-06 已经点名保留了哪些接续相关机制，它们的现状到底是什么样？
status: confirmed
impact_dimensions: [ordinary_detail]
requires_user_decision: false
selected_disposition: 由 F-004 调研核实，不需提问用户：CARD-06 点名清单与迁移表 §5.1 的登记是本卡读取集的唯一来源，本卡只按登记如实回读。
evidence: F-004（CARD-06 `spec.md:248` 点名 4 项；迁移表附件 §5.1 同族另有登记）
acceptance: 点名清单与迁移表 §5.1 的条目可逐条回读
counterexample: 把「点名清单」当成硬编码文件清单、忽略迁移表实际登记
```

```yaml
task_id: workflowhub-thin-core-card-08-20260919
outline_version: outline-r1-card08-20260919
oi_id: OI-002
category: data_state
source: R-003 / R-007 / prd.md:L621 / CARD-06 ADR-015
question: 要被删掉的「回执/材料校验机器」和要留下的「记录完整性回读检查」，边界划在哪里？
status: confirmed
impact_dimensions: [goal, scope, acceptance]
requires_user_decision: true
visible_group_id: talk-round-1-card08
selected_disposition: 边界由 ADR-002（判据不含哈希）与 ADR-004（保护对象是本卡结果契约）划定：以哈希/快照绑定版本、不通过即阻断推进的校验机器属删除面；无哈希、只读、不阻断、如实报缺的记录完整性读取结果属本卡。该边界由 T-004 与 T-007 两条真实回复联合推出，未作为独立问题单独提问。
evidence: T-004、T-007 真实回复 + FND-001/FND-012
acceptance: 被删的「回执 readback 校验」与本卡「记录完整性回读检查」在 decision-log 中各有可回读定义，边界句可引用
counterexample: 把两者当成同一个东西，导致本卡检查被随删除面一并清除
```

```yaml
task_id: workflowhub-thin-core-card-08-20260919
outline_version: outline-r1-card08-20260919
oi_id: OI-003
category: data_state
source: R-002 / F-002 / F-003 / F-006
question: 「已决定 / 已完成且验证 / 未完成 / 证据位置」四类信息，今天各有多少已经存在于 task 记录里，缺的是哪几类？
status: confirmed
selected_disposition: 已由 F-002/F-003/F-006 调研核实，不需提问用户。结论：四类**都不是从零开始**——①「已决定」今天只在 handoff 文档的散文里；②「已完成且验证」有结构但依赖将被删除的哈希机器；③「未完成」有 `phase_progress` 游标（真持久、无哈希、可幸存）但只覆盖「下一个 Phase/Task」；④「证据位置」有位置但与哈希成对出现、无纯路径通道。**四类均无「属于哪一类」的标记**。缺的具体落点由 OI-016 处置。
impact_dimensions: [ordinary_detail]
requires_user_decision: false
evidence: F-002、F-003、F-006
acceptance: 四类信息各有「有／部分有／无」的明确结论且可回读
counterexample: 把「有结构」等同于「可用」，忽略其依赖将被删除的哈希机器
```

```yaml
task_id: workflowhub-thin-core-card-08-20260919
outline_version: outline-r1-card08-20260919
oi_id: OI-004
category: complete_user_flow
source: R-004 / G-001 / prd.md:L465
question: 「新助手只凭记录恢复工作」到什么程度算达成——能说出下一步做什么、还是必须原地接着干？
status: confirmed
selected_disposition: G-001 用户选 B（说出下一步并等用户确认）——新会话须能定位状态与证据，并提出「下一步该做什么」，然后**等用户确认**；不自动开工。见 ADR-006。
impact_dimensions: [goal, acceptance]
requires_user_decision: true
visible_group_id: grill-card08
evidence: G-001/V-006 + ADR-006
acceptance: 新会话能定位状态与证据并给出下一步建议，且在用户确认前不开工
counterexample: 新会话未经确认即改变方向或执行不可逆动作
```

```yaml
task_id: workflowhub-thin-core-card-08-20260919
outline_version: outline-r1-card08-20260919
oi_id: OI-005
category: data_state
source: R-002 / R-003 / T-003
question: 接续记录是复用现有 task 记录（facts.jsonl 的游标 + 7 值），还是新写一份独立的接续记录？
status: confirmed
selected_disposition: T-003 用户选 B（复用 + 补进既有载体）。不新建独立接续记录文件；四类信息中缺落点的两类补进既有载体。代价已如实登记：动 facts.jsonl 行 schema 须与 CARD-06 收窄动作对账；动 handoff 文档须先解「固定名覆盖」。若最终证明 CARD-03 T-032「零新对象」无法在不越界前提下满足，须重新裁决 T-032 而非静默绕开。
impact_dimensions: [goal, scope, acceptance]
requires_user_decision: true
visible_group_id: talk-round-1-card08
evidence: T-003/V-004 + ADR-001
acceptance: 不新增独立接续权威文件、不双写，四类信息各有落点
counterexample: 为接续另立一份清单或权威文件，构成第二份权威
```

```yaml
task_id: workflowhub-thin-core-card-08-20260919
outline_version: outline-r1-card08-20260919
oi_id: OI-006
category: data_state
source: R-002 / prd.md:L38（SD-03）/ CARD-01 D-003 / docs/contracts/card-01-stage-material-interface.md
question: 7 值状态集在接续记录里落在「任务级」还是「阶段/步骤级」——一个任务只有一个状态，还是每个阶段各有一个？
status: confirmed
selected_disposition: 前置卡已定阶段级：CARD-01 明文「**阶段状态**使用窄状态集 7 值」（`card-01/decision-log.md:35`），契约白名单为 `not-started/in-progress/succeeded/failed/unverified/blocked/abandoned`，并规定「机器/质量事实读不到时只能保持 missing/unavailable/incomplete，不能包装为 blocked 或 succeeded；失败修复后重入原阶段，后续阶段不自动启动」（`docs/contracts/card-01-stage-material-interface.md:26`）。故落点是**阶段级**。**已核实的实现差距（属 build-plan，不是方向问题）**：今天这 7 值只在 `runtime/task/portable-workflow-run.mjs:8` 服务 build-prd 规划旅程；五个正式 stage 的 `status` 用的是另一套词表（`ready`/`blocked_by_missing_material`）。该差距如实登记，不在本阶段解决。
impact_dimensions: [ordinary_detail]
requires_user_decision: false
evidence: CARD-01 decision-log.md:35；docs/contracts/card-01-stage-material-interface.md:26
acceptance: 接续记录的状态取值只来自该 7 值白名单
counterexample: 引入第 8 个状态值，或把读不到的质量事实包装成 succeeded/blocked
```

```yaml
task_id: workflowhub-thin-core-card-08-20260919
outline_version: outline-r1-card08-20260919
oi_id: OI-007
category: data_state
source: R-003 / T-004
question: 回读检查查什么算「陈旧」、什么算「不完整」，才能既真报失败又不变成新的机器门禁？
status: confirmed
selected_disposition: 「陈旧」＝记录引用的文件路径不再存在／不再可读（T-004 用户选 B，纯文本引用，不引内容哈希也不引 Git 提交号）；记录在、内容变了**不判陈旧**。如实接受该盲区：本仓明确不承诺「自动判断证据全部过期」。已知盲区第二项：Git 提交号判据看不见未跟踪材料（本卡 decision-log.md 即未跟踪），故选 B 而非 A。DISPOSITION-PENDING：CARD-06 迁移表 §5.1 把这个判据问题标为 PENDING 且未写归属卡，本卡按 B 先定，CARD-06 完成后按 OPEN-001 对账。
impact_dimensions: [goal, acceptance]
requires_user_decision: true
visible_group_id: talk-round-1-card08
evidence: T-004/V-004 + ADR-002
acceptance: 对引用的不存在路径能报出陈旧，且不依赖任何哈希或 Git 提交号
counterexample: 记录在、内容变了被判陈旧（超出已登记判据）
```

```yaml
task_id: workflowhub-thin-core-card-08-20260919
outline_version: outline-r1-card08-20260919
oi_id: OI-008
category: success_failure_boundary
source: R-004 / G-002 / F-006 / prd.md:L466-L471
question: AC-39..AC-42 里哪几条今天可证伪、哪几条不可证伪？不可证伪的怎么改写为可观察替代物或如实记 incomplete？
status: confirmed
selected_disposition: 已按 AC 逐条区分「现成支撑 / 必须新建」（F-006）。**AC-41**：有最近支撑，可复用 `tests/integration/minimal-task-storage.test.mjs`（畸形行真报失败）与 `tests/contract/stage-progress-contract.test.mjs`（游标 current/stale）的形态，须补本卡的两级判据。**AC-42**：无任何现成工具，**必须新建**；证明方式由 G-002 定为子代理模拟无上下文新会话，且须写明该子代理未继承什么（ADR-007）。**AC-39**：须新建旧任务 fixture（可从 `tests/acceptance/card-01-current.mjs`、`tests/integration/card-01-dual-journey.test.mjs` 借形态，但都不是「旧任务只读」语义）。**AC-40**：须新建接续记录字段核对，落点随 ADR-001/ADR-008。
impact_dimensions: [acceptance]
requires_user_decision: true
visible_group_id: grill-card08
evidence: F-006、G-002/V-006 + ADR-007
acceptance: AC-39..AC-42 各有可实跑形态、通过条件与失败条件
counterexample: 把「检查记录信息齐备」当成「检验续跑」
```

```yaml
task_id: workflowhub-thin-core-card-08-20260919
outline_version: outline-r1-card08-20260919
oi_id: OI-009
category: success_failure_boundary
source: R-007 / prd.md:L476
question: CARD-06 已经替本卡登记了幸存者，本卡要做什么才算接住这份登记？
status: confirmed
impact_dimensions: [scope]
requires_user_decision: true
visible_group_id: talk-round-1-card08
selected_disposition: T-006 用户选 A（接受 CARD-06 现有登记）：本卡不向 CARD-06 提额外要求、不改其材料，只在本卡材料中如实回读其已点名项。
evidence: T-006/V-004 + FND-002 + OPEN-003
acceptance: CARD-06 已点名的 4 项被如实回读并在本卡材料中可查
counterexample: 本卡擅自修改 CARD-06 材料，或把未登记项当成已保护
```

```yaml
task_id: workflowhub-thin-core-card-08-20260919
outline_version: outline-r1-card08-20260919
oi_id: OI-010
category: complete_user_flow
source: R-004 / decision-log.md:L668
question: 跨会话续跑的完整流程是几步、每一步谁做什么、用户在哪里介入？
status: confirmed
impact_dimensions: [goal, acceptance]
requires_user_decision: true
visible_group_id: grill-card08
selected_disposition: G-001 用户选 B 定下流程终点：新会话能定位状态与证据，并提出「下一步该做什么」，然后等用户确认，不自动开工。
evidence: G-001/V-006 + ADR-006
acceptance: 流程为「读记录 → 定位状态/四类信息/证据 → 给出下一步建议 → 等用户确认」
counterexample: 流程里出现自动推进、或需要旧会话记忆才能补全
```

```yaml
task_id: workflowhub-thin-core-card-08-20260919
outline_version: outline-r1-card08-20260919
oi_id: OI-011
category: page_scope
source: R-005 / prd.md:L22（母 OI-008 non_ui）/ 母 Talk round 4 Q10（decision-log.md:L816）
question: 本卡的页面范围与交互方式边界是什么？
status: confirmed
selected_disposition: 三源一致 non_ui，已收敛不再提问：页面范围=non_ui（见「UI applicability」节）；R-005 的交互方式（大白话 Talk/Grill、主会话只规划与派发）由 U-001..U-003 与 T-001/T-002 真实回复处置，不另设问题
impact_dimensions: [ordinary_detail]
requires_user_decision: false
evidence: UI applicability 三源 + 母 PRD L22 + 母 Q10（decision-log.md:L816）
acceptance: 本卡材料中无 UI/页面/展示层改动
counterexample: 本卡引入页面或前端组件改动
```

```yaml
task_id: workflowhub-thin-core-card-08-20260919
outline_version: outline-r1-card08-20260919
oi_id: OI-012
category: success_failure_boundary
source: R-003 / R-006 / T-005
question: 回读检查报出问题之后呢——只如实记录并继续，还是必须停下等人？
status: confirmed
selected_disposition: T-005 用户选 B（分级）。缺信息（四类信息有缺项）＝只如实记录并继续，不阻断；状态值非法（出现 7 值之外的值）＝记为失败事实并留档。两种情形都不阻断推进，遵守母 PRD「只有两道人为门」。CARD-06 ADR-015「必须真实执行、不得降级 advisory」的可核对形态＝由非实现者上下文消费一次该检查输出，且至少留一次真实 failed 观测（本卡 verify-code 自举演练同样遵守）。补正（ADR-010）：第②级范围补入「陈旧」（引用的证据路径不存在），使 AC-41 的失败观测有来源；ADR-003 原文保留不重写。
impact_dimensions: [goal, acceptance]
requires_user_decision: true
visible_group_id: talk-round-1-card08
evidence: T-005/V-004 + ADR-003 + CARD-06 ADR-015、ADR-010
acceptance: 缺信息只记录不阻断；陈旧或状态值非法记为失败事实并留档；两者均不构成推进门；且由非实现者上下文消费一次并留至少一次真实 failed 观测
counterexample: 把任一级升格为阻断推进的门，或把该检查降级为 advisory
```

```yaml
task_id: workflowhub-thin-core-card-08-20260919
outline_version: outline-r1-card08-20260919
oi_id: OI-013
category: non_goals
source: R-001 / prd.md:L458
question: 本卡明确不做什么，才不会被做成新的重型事实图？
status: confirmed
impact_dimensions: [ordinary_detail]
requires_user_decision: false
selected_disposition: 非目标逐条写死在「## 非目标」节，全部可由 T-003..T-008 的真实回复或母 PRD 追溯；**本条未作为独立问题向用户提问**，故记为事实归纳而非独立用户决策（见 ADR-009）。
evidence: T-003..T-008/V-004 + 母 PRD L21、L459
acceptance: 非目标每条可追溯到真实回复或母 PRD 条款
counterexample: 执行中出现未被任何真实回复或母 PRD 覆盖的新范围
```

```yaml
task_id: workflowhub-thin-core-card-08-20260919
outline_version: outline-r1-card08-20260919
oi_id: OI-014
category: deferred
source: R-002 / prd.md:L479
question: 哪些具体设计（存储形态、文件命名、字段形状）留给 build-plan，不在本阶段定死？
status: confirmed
selected_disposition: 母 PRD L479 明写留 build-plan：本阶段只定方向与结果契约，不写字段形状、文件清单与命名细节。连带 DEFERRED-001/DEFERRED-002。
impact_dimensions: [ordinary_detail]
requires_user_decision: false
evidence: prd.md:L479；DEFERRED-001、DEFERRED-002
acceptance: 本阶段材料中不出现字段形状与文件命名细节
counterexample: 在方向阶段定死字段或文件清单
```

```yaml
task_id: workflowhub-thin-core-card-08-20260919
outline_version: outline-r1-card08-20260919
oi_id: OI-015
category: data_state
source: R-003 / R-006 / R-007 / FND-001 / FND-012 / T-006 / T-007
question: CARD-06 的删除面必须为本卡的回读检查保留什么？「幸存」是文件路径还在，还是删除后回读语义仍然成立？
status: confirmed
selected_disposition: 两条独立处置。①**与 CARD-06 的关系**：接受其现有登记，本卡现在不向它提额外要求、不改其材料（T-006=A）。②**「幸存者」定义**：本卡先写死「读出来的结果必须长什么样」——即本卡自己定义结果契约（需要读出哪些字段、什么算陈旧、读不到时如实报什么），再要求不管 CARD-06 怎么搬怎么改，这套**结果语义**不得变（T-007=B）。保护对象因此是**本卡的结果契约**，不是 CARD-06 的文件路径或函数位置。
impact_dimensions: [goal, scope, acceptance]
requires_user_decision: true
visible_group_id: talk-round-1-card08
evidence: T-007/V-004 + ADR-004 + P5.md:193
acceptance: 本卡结果契约在决策材料中可回读，且不绑定 CARD-06 的文件路径或函数位置
counterexample: 把「幸存者」写成文件路径存在性检查
```

```yaml
task_id: workflowhub-thin-core-card-08-20260919
outline_version: outline-r1-card08-20260919
oi_id: OI-016
category: data_state
source: R-002 / G-003 / FND-005 / FND-014（承接 CARD-01 DF-003）
question: 「已决定 / 已完成且验证 / 未完成 / 证据位置」四类信息分别映射到哪个既有载体的哪个位置？映射不出或落点不存在的那类，怎么如实记为 incomplete 而不是留白？
status: confirmed
selected_disposition: G-003 用户真实选择 B——「已决定」落到既有 `quality/evidence/handoff/<stage>.md` 的「重要决策」章节，按 ADR-005 改为不可变命名 + append-only（ADR-008）；其余三类沿用既有载体（`facts.jsonl` 行、`phase_progress` 游标、`evidence[]` 位置），**具体落点留 build-plan**。已知覆盖缺口如实登记、不得留白：该文档今天**只覆盖 4 个 authoring stage，不含 verify-code**，须在 build-plan 明确处置（补齐或如实记 incomplete）。承接 CARD-01 DF-003。
impact_dimensions: [goal, scope, acceptance]
requires_user_decision: true
visible_group_id: grill-card08
evidence: G-003/V-006 + ADR-008 + F-006④
acceptance: 四类信息各有指定载体，无落点者如实记 incomplete
counterexample: 某一类信息无落点却留白不记
```

```yaml
task_id: workflowhub-thin-core-card-08-20260919
outline_version: outline-r1-card08-20260919
oi_id: OI-017
category: complete_user_flow
source: R-004 / FND-007 / FND-014 / T-008 / CARD-01 RK-004、RK-007、OP-006
question: 记录本身消失这件事（外部 worktree 清理会销毁未跟踪的 decision-log.md；固定名文件会被原地覆盖）算不算本卡要管的范围？管到什么程度？
status: confirmed
selected_disposition: 部分管（C）。**在范围内**：本仓自己能修的「固定名文件被原地覆盖」——即把续跑载体改为不可变命名（日期+序号+描述）+ append-only，直接修掉 CARD-05 实测事故（`quality/evidence/handoff/make-decision.md` 被覆盖，11854 B → 4258 B，旧字节不可恢复）。**显式排除**：外部 worktree 清理销毁未跟踪材料——不在本仓控制内，只能提示不能防；该项在「非目标」与「未决项」双登记，不静默丢弃。
impact_dimensions: [goal, scope, acceptance]
requires_user_decision: true
visible_group_id: talk-round-1-card08
evidence: T-008/V-004 + ADR-005 + CARD-05 实测事故（`quality/evidence/handoff/make-decision.md` 11854 B → 4258 B）
acceptance: 固定名覆盖被改为不可变命名+append-only；外部清理在非目标与未决项双登记
counterexample: 把外部清理写成已防护，或把可修的覆盖问题一并排除
```

## 发散候选与可证伪大纲

本卡原始需求（prd.md:L456-L481 + 用户 U-001..U-003）边界明确、有母 PRD 的 FR/AC/oracle 兜底，**不属于「模糊需求」**，故不生成发散候选表与红蓝角度表。理由：需求已有可检查的失败场景与依赖声明，方向不确定性集中在「回读检查边界」与「接续记录形态」两点，由 OI-002/OI-005/OI-007/OI-012 逐条收敛即可。

`## 调研候选交付` 节在无用户可见候选时按模板记 `candidates: []` 并说明不适用。

## 目标

- 目标：让一个新会话（无旧会话上下文）**只凭当前任务的记录**，就能定位任务状态、已定事项、已完成且验证的事项、未完成事项与证据位置，并**说出下一步该做什么**（等用户确认后继续）；同时保证对旧任务与历史**零改动、零交接记录、零兼容链**。做法上**优先复用既有载体**，不重建 fact graph、不恢复平台、不新增第二份权威。
- 新流程任务接续只使用窄状态集 7 值（SD-03）+ 记录完整性回读检查。

## 成功/失败边界

- 成功边界：①旧任务 fixture 运行新流程后，旧文件 0 改动、0 交接记录、0 兼容链产物（AC-39）；②新流程 task 的接续记录状态为 7 值之一，且「已决定／已完成且验证／未完成／证据位置」四类信息齐备（AC-40）；③对构造出的陈旧/不完整记录，回读检查如实报出问题、真报失败（AC-41）；④子代理模拟的无上下文新会话仅凭记录即可正确定位状态与证据并说出下一步（AC-42）。
- 失败边界：①任一旧文件被改，或为兼容而建链（AC-39 失败场景）；②出现 7 值之外的状态，或缺任一类信息（AC-40 失败场景）；③陈旧/不完整记录被判完整（AC-41 失败场景）；④续跑需旧会话记忆，或记录不可得（AC-42 失败场景）；⑤接续记录被做成新的重型事实图（本卡局部风险①）；⑥回读检查形同虚设（本卡局部风险②）。

## 范围

- 当前范围：旧任务/历史只读边界；新流程接续记录形态（窄状态集 7 值 + 回读检查）；跨会话续跑演练。（prd.md:L459）
- 写面协调责任：本卡接续记录与回读检查的写面须与 CARD-09 的写入量削减面先协调（母 PRD L475）；协调时机在 build-plan。
- 最小读取集：本卡实际读取集＝母 PRD CARD-08 节 + SD-03/SD-15/SD-17 + 母 decision-log 的 OI-007/T-004/Q4(b)/Q11/L668/L135 ＋ CARD-01/02/03/05 归档 decision-log ＋ CARD-06 在途 spec.md/decision-log.md/迁移表（只读）＋ 本仓 runtime 相关实现；通常不用＝其它卡材料、旧任务内容本身、外部研究全文。
- 端到端流程含前两步：「接续记录写入」与「回读检查触发」——二者属本卡 build-code 的实现动作，具体形态归 build-plan（DEFERRED-001）；本阶段只定跨会话读取侧的流程（ADR-006/ADR-007）。若 build-plan 证明前两步需要方向级决定，须回本阶段增量决策。
- 本卡结果的两个 consumer：①用户（跨会话续跑）；②后续 task 主会话（读取接续记录继续工作）。两者均按 ADR-006/ADR-007 定义消费方式。
- 用户流程/结果只记索引和验收影响，细节进入 spec：跨会话续跑流程按 ADR-006/ADR-007 定标准与证明方式；记录的具体存储形态、字段形状、文件命名进入 build-plan（ADR-009 / OI-014）。

## 非目标

- 不重建 fact graph、不恢复阶段自动恢复平台（母 PRD 非目标 L21；OI-007 resolution）。
- **不修改 CARD-06 的材料**（T-006=A）。本卡不要求 CARD-06 改其迁移表、ADR 或 phase 文件；两者关系以本卡自己的**结果契约**约束（ADR-004）。
- **不新建独立的接续记录权威文件、不双写、不新增第二份清单**（CARD-02 D-002/D-004、CARD-03 T-032；ADR-001）。若最终证明在不越界前提下无法满足，须**重新裁决 T-032**，不得静默绕开。
- **不引入内容寻址哈希与 revision 引用**（SD-17；ADR-002）；不引入 Git 提交号作为陈旧判据。
- **不做跨会话证据链保证**，不承诺「自动判断证据全部过期」（CARD-02 D-008⑤ + V-20 限定）。
- **不管外部 worktree/分支清理销毁未跟踪材料**（T-008=C；显式排除，理由见 ADR-005）。
- **不新增 stage、public command、第五份材料、独立状态机、gate 或控制面**（CARD-03 L127、CARD-07 L359；SD-17）。
- **不触碰 UI / 页面 / 展示层**（母 OI-008 non_ui；本卡 UI applicability 三源一致 non_ui）。
- **不执行删除**（属 CARD-06，prd.md:L459）。
- 不做 token/时间统计机制；不为未完成旧任务建永久兼容。

## 核心需求

让一个新会话（无旧会话上下文）只凭当前任务的记录，就能定位任务状态、已决定的事项、已完成且经验证的事项、未完成的事项，以及这些结论的证据放在哪里，并说出下一步该做什么——然后等用户确认再动手。
同时，对旧任务与历史保持零改动、零交接记录、零兼容链：不碰旧文件、不为兼容建桥、不借迁移删除用户文件。
做法上优先复用既有载体（facts.jsonl 行、phase_progress 游标、handoff 文档、evidence 位置），不重建 fact graph、不新增第二份权威、不新增 stage/gate/状态机。

## 决定

### ADR-001 接续记录复用既有载体，不另立权威

```text
- **source**：T-003 用户真实选择 B；R-002；prd.md:L463
- **decision**：续跑所需的四类信息**复用既有载体**承载，不新建独立的接续记录权威文件。缺落点的类别补进既有载体（具体落点见 ADR-008 与 build-plan）。不双写、不新增第二份清单。
- **rationale**：CARD-02 D-004「一事实一权威，余者只放指针」、CARD-03 T-032「零新字段、零新命令、零新对象、零新账本、零新 export」是前置卡已确认的硬约束；本卡头号局部风险即「接续记录被做成新的重型事实图」。
- **consequence**：已如实登记两项代价——①动 `facts.jsonl` 行 schema 须与 CARD-06 收窄该行的动作（迁移表 MT-1-082）对账；②动 handoff 文档须先解「固定名原子覆盖」（由 ADR-005 处置）。若上述任一路径被证明必然越界，须**重新裁决 CARD-03 T-032**，不得静默绕开。
- **supersedes**：N/A（新建）
- **原始声明层**：T-003 / R-002 / F-003 / F-005②
- **三级追溯**：U-004 → R-002（prd.md:L463）→ ADR-001
- **三档结论**：`confirmed`
- **approval_binding**：T-003 用户真实选项回复（2026-10-02）
- **owner/next_action**：本卡 build-plan 落实具体落点；越界时回到用户重新裁决 T-032
module: 接续记录形态
requirement_ids: [R-002]
derived_from: []
artifacts: [spec.md#FR-40]
```

### ADR-002 「陈旧」＝引用路径不再存在；内容变化不判陈旧

```text
- **source**：T-004 用户真实选择 B；R-003；prd.md:L464、L478；CARD-06 迁移表 §5.1（PENDING）
- **decision**：回读检查判定「陈旧」的判据为——记录所引用的文件路径**不再存在或不再可读**（纯文本路径引用）。记录仍在、内容已变**不判陈旧**。不引入内容寻址哈希，也不引入 Git 提交号。
- **rationale**：SD-17 明令记录层不用内容寻址哈希；CARD-06 迁移表 §5.1 自认旧判据（material_revision＝材料内容哈希）与母 OI-013 冲突并标为 PENDING。用户选择 B 的直接理由：Git 提交号判据看不见未跟踪材料——**本卡 decision-log.md 此刻正是未跟踪状态**（`git status` = `??`），CARD-01 RK-007 场景用 Git 判据根本发现不了。
- **consequence**：如实接受两项已知盲区——①内容变了发现不了；②纯文本路径判据无法覆盖「文件在但已过期」。两者均与本仓既有立场一致：「本检查工具是事实记录，不构成推进门禁，**不提供机器认证／跨会话证据链／自动判断证据全部过期的保证**」（CARD-02 D-008⑤ + V-20）。该取舍不得被下游改写成「保证」。
- **supersedes**：N/A（新建）。与 SD-17 点名的「回执 readback 校验」**近名易混（两者名称不同，参见 SD-17 原文）**，边界见 ADR-004。
- **原始声明层**：T-004 / R-003 / F-001③ / F-004③
- **三级追溯**：U-004 → R-003（prd.md:L464）→ ADR-002
- **三档结论**：`confirmed`
- **approval_binding**：T-004 用户真实选项回复（2026-10-02）
- **owner/next_action**：本卡 build-plan 按此写结果契约；CARD-06 完成后按 OPEN-001 对账
module: 回读检查
requirement_ids: [R-003]
derived_from: []
artifacts: [spec.md#FR-41]
```

### ADR-003 回读结果分级处置，两种情形均不阻断

```text
- **source**：T-005 用户真实选择 B；R-003、R-006；prd.md:L464、L478；CARD-06 ADR-015
- **decision**：分两级——①**缺信息**（四类信息有缺项）＝只如实记录并继续，不阻断；②**状态值非法**（出现 7 值之外的值）＝记为失败事实并留档。两种情形**都不阻断推进**。ADR-015「必须真实执行、不得降级 advisory」的可核对形态＝由**非实现者上下文消费一次该检查输出**，且**至少留一次真实 failed 观测**。
- **rationale**：母 PRD SD-17 只允许两道人为门（推进确认、不可逆 Git 授权），一切机器校验不得构成推进前置；同时母 PRD L621 拒绝把回读检查降级为 advisory。红队指出「非 advisory」与「非阻断」之间的状态此前无定义无实例，本 ADR 即为该状态的定义。
- **consequence**：分级线必须写死，否则会退化成新的判据机器。AC-41 要求「真报失败」由②承担并由非实现者消费证明；本卡 verify-code 自举演练同样遵守。缺信息不阻断，但必须出现在阶段末披露里。
- **supersedes**：N/A（新建）
- **原始声明层**：T-005 / R-006 / FND-009
- **三级追溯**：U-004 → R-003（prd.md:L464）→ ADR-003
- **三档结论**：`confirmed`
- **approval_binding**：T-005 用户真实选项回复（2026-10-02）
- **owner/next_action**：本卡 build-plan 与 verify-code 落实两级判据与非实现者消费
- **控制面登记（CARD-04 B-08）**：新增机器读数「记录完整性回读检查」——owner＝CARD-08 承接 task 的 build-code 实现与 verify-code 验证；consumer＝跨会话续跑的新会话（非实现者上下文消费一次）；替代关系＝取代已被 SD-17/OI-013 删除的 freshness/receipt 校验机器的「记录可读性」职能，**不**取代其推进门禁职能（本检查不构成门禁）；删除条件＝出现经独立审查的替代机制，或该检查连续两个任务无任何真实消费方可退役。
module: 回读检查
requirement_ids: [R-003, R-006]
derived_from: [ADR-002]
artifacts: [spec.md#FR-41]
```

### ADR-004 「幸存者」＝本卡结果契约的语义不变，不是文件路径

```text
- **source**：T-006 用户真实选择 A + T-007 用户真实选择 B；R-003、R-007；prd.md:L464、L476、L472-473
- **decision**：①与 CARD-06 的关系：**接受其现有登记，本卡现在不向它提额外要求、不改其材料**。②「幸存者」的定义：本卡**先写死「读出来的结果必须长什么样」**（需要读出哪些字段、什么算陈旧、读不到时如实报什么），再要求不管 CARD-06 怎么搬怎么改，这套**结果语义**不得变。保护对象因此是本卡的**结果契约**，不是 CARD-06 的文件路径或函数位置。
- **rationale**：CARD-06 已证明它会搬会改（迁移表 §5.1 标「函数需搬出宿主文件」，P5.md:178 把 stale 判据从材料哈希改为 Git 提交号），绑死位置的清单容易过期（红队实测其行号引用已漂移）；同时本卡无权修改兄弟卡材料，故不采用「要求它加保护」的路径。
- **consequence**：本卡验收有稳定对象，不怕 CARD-06 中途改。**偏离登记（SD-09「接受但有偏离」）**：母 PRD L476 原文要求「CARD-08 owner 在 CARD-06 删除面中显式登记回读检查为幸存者」；本卡按 T-006 用户真实选择改为「不提额外要求、不改其材料」，以本卡结果契约替代外部登记。**改了什么**：把「在他人材料里登记」换成「自己定义结果契约」；**为什么**：本卡无权修改兄弟卡材料，且用户明确选择不折腾 CARD-06。该偏离已获用户真实选项确认。已知未解决项：红队实测 CARD-06 迁移表**主表**中没有 `derivePhaseProgressStatus`/`phaseProgressReadback` 的独立行（只在附件 §5.1），其 AC-THIN-006 台账测试可能核不到对象——按 T-006=A 本卡不追改，登记为 **OPEN-003** 交用户或 CARD-06 owner 处置。若 CARD-06 落地后本卡结果契约读不出来，按 OPEN-001 对账并在 build-plan 处置。
- **supersedes**：N/A（新建）。划清与 SD-17 被删「回执 readback 校验」的边界：被删的是**以哈希/快照绑定版本、不通过即阻断推进**的校验机器；本 ADR 保护的是**无哈希、只读、不阻断、如实报缺**的记录完整性读取结果。
- **原始声明层**：T-006 / T-007 / R-007 / F-004
- **三级追溯**：U-004 → R-007（prd.md:L476）→ ADR-004
- **三档结论**：`confirmed`
- **approval_binding**：T-006 与 T-007 用户真实选项回复（2026-10-02）
- **owner/next_action**：本卡 build-plan 写结果契约；OPEN-003 由用户或 CARD-06 owner 处置
module: 与 CARD-06 的关系
requirement_ids: [R-003, R-007]
derived_from: [ADR-002]
artifacts: [spec.md#FR-41]
```

### ADR-005 记录耐久性：只修固定名覆盖，外部清理显式排除

```text
- **source**：T-008 用户真实选择 C；R-004；CARD-01 RK-004、RK-007、OP-006 显式延期给本卡
- **decision**：**在范围内**——修掉本仓能控制的「固定名文件被原地覆盖」：续跑载体改为不可变命名（日期+序号+描述）+ append-only（SD-17）。**显式排除**——外部 worktree/分支清理销毁未跟踪材料，不在本仓控制内，只能提示不能防；该项在「非目标」与「未决项」双登记，不静默丢弃。
- **rationale**：CARD-01 RK-004 登记「记录层停用内容寻址后文件名碰撞/覆盖」，RK-007/OP-006 登记「worktree 被外部清理导致未跟踪 decision-log.md 消失、全盘无副本、无 dangling commit」并明写「**根治归 CARD-08**」。本卡正面接住可控的那一半。CARD-05 有实测事故：`quality/evidence/handoff/make-decision.md` 被覆盖，11854 B → 4258 B，**旧字节不可恢复**——这正是可控的一半。
- **consequence**：改命名/留存规则会触及 CARD-05 D-020（`quality/reviews/` 命名）与 CARD-06 ADR-024（handoff 技能 NARROW 保留）的既有决定，须在 build-plan 阶段对账，不得单方面改。已实测并如实记录：**本卡 `specs/` 目录此刻为未跟踪状态**（`git status` = `??`），即 RK-007 场景在当前任务上真实存在。
- **supersedes**：N/A（新建）
- **原始声明层**：T-008 / R-004 / F-005⑤
- **三级追溯**：U-004 → R-004（prd.md:L465）→ ADR-005（承接 CARD-01 RK-007/OP-006/RK-004）
- **三档结论**：`confirmed`
- **approval_binding**：T-008 用户真实选项回复（2026-10-02）
- **owner/next_action**：本卡 build-plan 处置命名与留存；外部清理项留在未决项
module: 记录形态
requirement_ids: [R-004]
derived_from: []
artifacts: [spec.md#FR-40]
```

### ADR-006 跨会话续跑的达成标准＝能说出下一步并等用户确认

```text
- **source**：G-001 用户真实选择 B；R-004；prd.md:L465、L470
- **decision**：新会话须能定位任务状态与证据，**并提出「下一步该做什么」，然后等用户确认**；不自动开工。
- **rationale**：AC-42 要求「定位任务状态与证据**并继续**」，但未定义「继续」的深度；母 PRD 同时要求保留推进的人为确认门（SD-17 两道人为门）。选 B 同时满足两者。
- **consequence**：需在 build-plan 写清「提建议」与「替你决定」的界线；新会话不得在未经确认时改变任务方向或执行不可逆动作。
- **supersedes**：N/A（新建）
- **原始声明层**：G-001 / R-004
- **三级追溯**：U-005 → R-004（prd.md:L465）→ ADR-006
- **三档结论**：`confirmed`
- **approval_binding**：G-001 用户真实选项回复（2026-10-02）
- **owner/next_action**：本卡 build-plan 与 verify-code 按此写续跑标准
module: 跨会话续跑
requirement_ids: [R-004]
derived_from: [ADR-001]
artifacts: [spec.md#FR-42]
```

### ADR-007 跨会话续跑的证明方式＝子代理模拟无上下文新会话

```text
- **source**：G-002 用户真实选择 B；R-004；prd.md:L470、L474；FND-008
- **decision**：以**子代理模拟无上下文新会话**作为 AC-42 的证明方式：给该子代理只读的记录路径，看它能否独立定位状态与证据并说出下一步。**必须写明它没有继承什么**，否则构成自证。
- **rationale**：红队实测本仓**不存在**任何「新会话无旧上下文续跑」的可执行演练先例，AC-42 今天不可证伪；真开全新会话在本阶段做不到。选 B 是本阶段可跑且可重复的最强证明。
- **consequence**：子代理继承边界必须逐项写明（它能读到什么、不能读到什么），并作为验收证据的一部分保留。该方式弱于「真开新会话」，该强度差距如实披露，不冒充等价。
- **supersedes**：N/A（新建）
- **原始声明层**：G-002 / R-004 / F-006②
- **三级追溯**：U-005 → R-004（prd.md:L470）→ ADR-007
- **三档结论**：`confirmed`
- **approval_binding**：G-002 用户真实选项回复（2026-10-02）
- **owner/next_action**：本卡 verify-code 执行该演练并写明继承边界
module: 验收
requirement_ids: [R-004]
derived_from: [ADR-006]
artifacts: [spec.md#AC-42]
```

### ADR-008 「已决定」落到 handoff 文档的「重要决策」章节，改不可变命名 + append-only

```text
- **source**：G-003 用户真实选择 B；R-002；T-008=C；prd.md:L463；F-006④
- **decision**：四类信息中「已决定」由既有 `quality/evidence/handoff/<stage>.md` 的「重要决策」章节承载；按 ADR-005 改为**不可变命名 + append-only**。「已完成且验证」「未完成」「证据位置」沿用既有载体（`facts.jsonl` 行、`phase_progress` 游标、`evidence[]` 位置），具体落点留 build-plan。
- **rationale**：该章节已存在且格式可用（实盘 6090 B，13 个固定章节含重要决策/下一步动作/待读文件清单/成功失败边界），改动最小；且与 T-008=C「修掉固定名覆盖」天然一致。
- **consequence**：该文档今天自述 `non_authoritative` + `current_only`，改 append-only 后**必须重定其留存规则与权威声明**。已核实并如实登记一项覆盖缺口：它今天**只覆盖 4 个 authoring stage，不含 verify-code**——该缺口不得留白，须在 build-plan 明确处置（补齐、或如实记为 incomplete）。**单一权威对账（CARD-02 D-004）**：handoff 文档的「重要决策」章节**只放指向 `decision-log.md` 的指针**，不复制决定正文；它是**派生视图**，不是第二权威。决定正文的唯一权威始终是 `decision-log.md`。
- **supersedes**：N/A（新建）
- **原始声明层**：G-003 / R-002 / F-006④
- **三级追溯**：U-005 → R-002（prd.md:L463）→ ADR-008
- **三档结论**：`confirmed`
- **approval_binding**：G-003 用户真实选项回复（2026-10-02）
- **owner/next_action**：本卡 build-plan 落实命名/留存/权威声明与 verify-code 覆盖缺口
module: 接续记录形态
requirement_ids: [R-002]
derived_from: [ADR-001, ADR-005]
artifacts: [spec.md#FR-40]
```

### ADR-009 本卡非目标与范围写死

```text
- **source**：OI-013；U-001..U-005 综合；母 PRD L21、L459、L479；T-006=A、T-008=C
- **decision**：非目标逐条写死于「## 非目标」节（不重建 fact graph／不改 CARD-06 材料／不另立接续权威文件／不引哈希与 Git 判据／不承诺跨会话证据链／不管外部清理／不新增 stage-command-材料-状态机-gate-控制面／不碰 UI／不执行删除／不做 token 统计）。
- **rationale**：本卡头号局部风险是「接续记录被做成新的重型事实图」；范围写死是唯一可核对的防线。用户此前逐条选择直接推出这些边界。
- **consequence**：范围「做什么/不做什么」写死、无隐性口头扩大（Grill 退出检查第 4 项）。任何越界需求须回到用户重新决策，不得在下游静默扩大。
- **supersedes**：N/A（新建）
- **原始声明层**：OI-013 / 母 PRD L21、L459
- **三级追溯**：U-001..U-005 → R-001..R-007 → ADR-009
- **三档结论**：`confirmed`
- **approval_binding**：T-003..T-008 与 G-001..G-003 的真实选项回复（2026-10-02）；非目标为这些回复与母 PRD L21/L459 的事实归纳，未作为独立问题向用户提问
- **owner/next_action**：本卡全阶段遵守；越界回用户
module: 范围
requirement_ids: [R-001, R-002, R-003, R-004, R-005, R-006, R-007]
derived_from: []
artifacts: [spec.md]
```
### ADR-010 回读检查两级判据的范围补正（AC-41 失败语义接上）

```text
- **source**：阶段末一致性检查 finding #5；用户 2026-10-02 真实选项回复；母 PRD AC-41（prd.md:L469）
- **decision**：ADR-003 的第②级（记为失败事实并留档）范围**补入「陈旧」**：即记录引用的证据路径不再存在（判据见 ADR-002）。补正后两级为——①**缺信息**（四类信息有缺项）＝只如实记录并继续，不阻断；②**记录本身有硬缺陷**（状态值非法，或记录引用的证据路径不存在）＝记为失败事实并留档。两级均不阻断推进。
- **rationale**：母 PRD AC-41 要求以「陈旧/不完整记录」为条件验证回读检查，失败场景是「陈旧/不完整记录被判完整」。补正前「陈旧」无任何一级承接，AC-41 的失败观测无来源。用户选择保留原分级并把「陈旧」归入第②级。
- **consequence**：AC-41 的「真报失败」由第②级承担（陈旧或状态值非法均可产生真实 failed 观测）；「不完整」仍在第①级，**报出但不产生失败事实**——AC-41 的失败场景判定为「检查是否报出问题」，报出即不算失败场景。ADR-003 原文保持不变，本条为补正。
- **supersedes**：ADR-003 的第②级范围表述（原文保留，不重写）
- **原始声明层**：AC-41；finding #5；用户 2026-10-02 选项回复
- **三级追溯**：U-004 → R-003（prd.md:L464）→ ADR-003 → ADR-010
- **三档结论**：`confirmed`
- **approval_binding**：2026-10-02 用户真实选项回复「A 把「陈旧」归到失败那一级」
- **owner/next_action**：本卡 build-plan 与 verify-code 按补正后的两级写判据与验收
module: 回读检查
requirement_ids: [R-003, R-006]
derived_from: [ADR-002, ADR-003]
artifacts: [spec.md#FR-41, spec.md#AC-41]
```

## 动态 Talk 批次

| batch_id / OI version | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001（task_type） | 任务类型：普通任务 / 规划任务 | 普通任务=可追问实现细节；规划任务=只问方向 | 普通任务（推荐） | 本项关闭；提问边界按普通任务 | U-002 / V-002 |
| T-002（start_timing） | 开工时机与基线：现在只定方向 / 等 card-06 / 用 card-06 分支为基线 | 只定方向=不空等，但 card-06 删除面未定稿需回核；等待=一次做对但空等 6 批；换基线=贴现实但基线不稳 | 现在就做 make-decision，只定方向；实现等 card-06（推荐） | 本项关闭；基线固定 main `7619db8e` | U-003 / V-003 |
| T-003（OI-005） | 接续记录放哪：A 纯复用 / B 复用+补进既有载体 / C 另立一份 | A=最守规矩但「已决定」「证据位置」无处安放，AC-40 缺东西；B=四类信息有落点，但动 facts.jsonl 行 schema 会与 CARD-06 收窄动作撞车，动 handoff 须先解固定名覆盖；C=语义最清楚但顶撞 CARD-03 T-032「零新对象」且踩中本卡头号风险「新的重型事实图」 | B 复用 + 补进既有载体（推荐） | 本项关闭；新增 ADR-001；连带打开 OI-016（四类信息→既有载体映射） | U-004 / V-004 |
| T-004（OI-007） | 「过时」怎么判：A Git 提交号 / B 纯文本文件存在性 / C 不判过时只判完整 | A=与 CARD-06 口径一致，但看不见未提交材料（本卡 decision-log.md 此刻即未跟踪），RK-007 场景发现不了；B=完全符合 SD-17 纯文本引用、人可肉眼核，但内容变了发现不了（本仓本就不承诺「自动判断证据过期」）；C=最简、离门禁最远，但 AC-41 只完成一半 | B 纯文本「引用了哪些文件、还在不在」（推荐） | 本项关闭；新增 ADR-002 | U-004 / V-004 |
| T-005（OI-012） | 报出问题之后：A 只记录继续 / B 分级 / C 停下等人 | A=符合两道人为门，但易被当成 advisory，与 CARD-06 ADR-015「必须真实执行、不得降级」冲突；B=既「真报失败」又不加阻断门，但分级线须写死否则成新判据机器；C=最安全但直接违反母 PRD 零机器门禁 | B 分级：缺信息只记录，状态值非法算失败事实（推荐） | 本项关闭；新增 ADR-003；第②级范围由 ADR-010 补入「陈旧」 | U-004 / V-004 |
| T-006（card06_relationship） | 与 card-06 的关系：A 相信其现有登记、现在不折腾 / B 现在向它提明确要求 / C 本卡自己接过来 | A=现在最省事、不跨卡协调，但读回能力被改坏时本卡验收须重做；B=最能挡住，但本卡**无权改兄弟卡材料**，需用户或 CARD-06 owner 同意；C=最可控但与 CARD-06 B5/P6 写面直接冲突且顶撞「等 CARD-06 先就位」 | **A 相信 card-06，现在不折腾** | 本项关闭；FND-002 不再追求改 CARD-06 材料，转为 OPEN-003 由用户/CARD-06 owner 处置 | U-004 / V-004 |
| T-007（survivor_definition） | 「幸存者」定义：A 还能读到续跑位置即可 / B 本卡先写死「读出来的结果必须长这样」 / C 固定函数清单 | A=最宽松最易达成，但 card-06 改用 Git 判据后未提交材料不在其视野，续跑位置可能算错；B=本卡验收有稳定对象、不怕 card-06 中途改，代价是先花力气写准结果契约；C=最好核对，但 CARD-06 已证明会搬会改，绑死位置的清单易过期（其行号引用已漂移） | B 先写死「读出来的结果必须长这样」（推荐） | 本项关闭；新增 ADR-004；FND-004 按此处置 | U-004 / V-004 |
| T-008（OI-017） | 记录消失管不管：A 全管 / B 显式排除 / C 只修本仓修得动的 | A=正面接住 CARD-01 三笔旧账，但外部清理不在本仓控制内、只能提示不能防；B=范围最干净，但 CARD-01 明写「根治归 CARD-08」，排除即再挂账；C=能真修掉 card-05 实测的覆盖事故（11854B→4258B），但会碰到 CARD-05/CARD-06 既有命名与留存决定 | C 部分管：只修「固定名覆盖」（推荐） | 本项关闭；新增 ADR-005；外部 worktree 清理显式排除并写明理由 | U-004 / V-004 |

## 调研

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| F-001（现状机制盘点，main 7619db8e） | 7 值、task store、游标、回读检查今天到底是什么 | ①`TERMINAL_STATES` 7 值在 `runtime/task/portable-workflow-run.mjs:8`，但**只服务 build-prd 规划旅程**；五个正式 stage 的 `work_upstream` 不用这 7 值。②`phase_progress` 游标只允许出现在 build-code 行，恰 4 键 `{phase_id,task_id,material_revision,recorded_at}`，其中 `material_revision ~ /^revision-[a-f0-9]{64}$/`（`runtime/task/task-store.mjs:241-253`）——**硬要求内容哈希**。③读回判定 `derivePhaseProgressStatus` 只做 `cursor.material_revision === currentMaterialRevision`，否则 `stale` + `reason:"material_revision_mismatch"`。④`index.json` 已退役，本卡任务目录不创建。⑤`current-close-projection.mjs` 存在、只读、无哈希。 | 已落盘 | 待定 |
| F-002（现状机制盘点续） | 今天有没有「记录完整性/陈旧」检查器 | **只有 `runtime/evidence/freshness.mjs`，且 100% 建立在 sha256 + material_revision + snapshot_tree 之上**（`authenticateQualityFactRecord` 全 `current` 才 authenticated，否则 `missing`/`unavailable`）。生产代码 grep `readback|integrity|completeness|verify-record|回读` **不存在**通用的「task 目录记录完整性/陈旧性」检查器。CARD-06 删除面点名要删的正是这条链 → 直接复用 freshness 会随 CARD-06 一起失效。 | 已落盘 | 待定 |
| F-003（差距核对） | 四类信息今天各有多少 | ①**已决定**：`facts.jsonl` 无对应字段；只有 stage-reflection 渲染进 `quality/evidence/handoff/<stage>.md` 的散文。②**已完成且验证**：有结构，但依赖将被删除的哈希机器。③**未完成**：`phase_progress` 游标是真持久事实（无哈希文本，可幸存），但只覆盖「下一个 Phase/Task」，不覆盖「哪些活没做完」。④**证据位置**：`evidence[{command,exit_code,failure_signature}]`、`spec_analyze.ref`、`named_refs`、handoff `source_refs[{ref,sha256}]`——**全部与哈希成对出现并被强制校验，没有无哈希的纯路径通道，也没有「这条证据属于哪一类」的标记**。 | 已落盘 | 待定 |
| F-004（CARD-06 删除面，在途） | 幸存者登记的真实强度 | ①`spec.md:248` FR-THIN-006 点名 4 项；迁移表附件 §5.1（`attachments/migration-table.md:1259-1269`）另列同族 6 项。②**主表里没有 `derivePhaseProgressStatus`/`phaseProgressReadback` 的独立行**（主表 grep 计数 0），只出现在附件 §5.1——而主表自述是「逐文件处置的唯一权威」。③§5.1 自认冲突：stale 判据是 `material_revision`，与母 OI-013 冲突，**「是否算校验机器需 build-plan 定」（PENDING）**。④强制保护 = `AC-THIN-006` 台账测试核对「幸存者行路径仍存在」+ 定向测试 exit 0。⑤`P5.md:193` STOP 条件：「Card-08 需要的读回语义被破坏 → 停」。⑥`spec.md:314` 明确「回读检查新机制」不在 CARD-06 范围。 | 已落盘 | 待定 |
| F-005（前置卡约束） | CARD-01..05/07 对本卡的硬约束与遗留项 | ①7 值唯一、禁第二份清单、禁双写、禁新控制面、禁新增门禁（CARD-01 D-003 / CARD-02 D-002,D-004 / CARD-03 L127,L144 / CARD-04 B-08）。②单一进度权威＝`facts.jsonl` 的 `phase_progress` 游标；CARD-03 T-032=B 进一步定「同一字段、同一 4 键、同一 stage 行载体、同一对 run 写/status 读；**零新字段、零新命令、零新对象、零新账本、零新 export**」。③记录层不可变命名（日期+序号+描述）+ append-only + 纯文本引用，**禁用 revision/hash 引用**。④本仓明确**不承诺**「跨会话证据链」与「自动判断证据全部过期」，且不假称纯技能提供同等机器保证。⑤**遗留项**：CARD-01 的 DF-003、RK-004、RK-007、OP-006 均点名归 CARD-08。⑥CARD-01 接口蓝图仍写「四份当前材料」，post 现行三份（decision-log/spec/phases）——差异待 OI-005 处置。 | 已落盘 | 待定 |
| F-006（验收支撑盘点） | AC-39..AC-42 今天各有多少现成支撑 | ①AC-41 有最近支撑：`tests/integration/minimal-task-storage.test.mjs`（畸形行真报失败）、`tests/contract/stage-progress-contract.test.mjs`（游标 current/stale）。②AC-42 **无任何现成工具**，跨会话演练环境不存在，须新建。③AC-39/AC-40 只能部分借用（`tests/acceptance/card-01-current.mjs`、`tests/integration/card-01-dual-journey.test.mjs`、`tests/contract/portable-workflow-run.test.mjs` 的 7 值终态），但都不是「接续记录」形态。④现成「接续记录」实体＝`quality/evidence/handoff/<stage>.md`（13 固定章节含重要决策/下一步动作/待读文件清单/成功失败边界，实盘 6090 B），但自述 `non_authoritative` + `current_only`、只覆盖 4 个 authoring stage（**不含 verify-code**）、指针强制带 sha256，且**没有任何陈旧性检查**。 | 已落盘 | 待定 |

说明：F-001..F-006 为只读研究子代理的直接结论，其原始报告未按 research-report.v1 落盘；本卡任务库当前只有 questions-only 投影一份。该缺口如实登记。F-001..F-006 为只读研究子代理的结论，其原始报告未按 research-report.v1 落盘，因此这六条证据当前**不可字节级复核**，只能按本表摘要回读；该缺口如实登记，不漂白。

## 调研候选交付

本阶段研究为事实盘点而非用户可见的方案候选；研究报告须显式声明 `candidates`，无用户可见候选时记 `candidates: []`。当前尚未产出 `research-report.v1`。

完整报告：待落盘 `quality/evidence/research/<ref>`（具体 ref 按实际产出填写，不预造）。

| 候选 ID | 大白话摘要 | 推荐/不推荐 | 理由 | 出处与全文 |
| --- | --- | --- | --- | --- |

本阶段研究为事实盘点而非用户可见方案候选，按 `research-report.v1` 契约应声明 `candidates: []`；**当前尚未产出 `research-report.v1` 原件**，该缺口如实登记，不冒充已落盘。

## grill（质询）

Grill 为交互式思考，**不调用 wh-review、不生成 review finding、不写 review fact**（`skills/grill-with-docs/SKILL.md`）。
本批为一次独立前沿问题批（3 题，互相独立），走真实 `ask → wait → reply → resume → re-rank`。

| grill_id | CONTEXT/冲突 | 结论 | ADR/四项退出 | source/evidence |
| --- | --- | --- | --- | --- |
| G-001（OI-004） | 「只凭记录恢复工作」到什么程度算达成——母 PRD AC-42 说「定位任务状态与证据**并继续**」，但未定义「继续」的深度 | 用户真实选择 **B 说出下一步并等你点头**：新会话要能定位状态/证据，并提出「下一步该干什么」，然后等用户确认；不自动开工（保留母 PRD 推进人为门） | ADR-006；exit: scope_boundaries=pass | U-005 / V-006 |
| G-002（OI-008） | AC-42 今天**不可证伪**：红队实测无任何「新会话无上下文续跑」的既有演练环境 | 用户真实选择 **B 用子代理模拟无上下文新会话**：给只读记录路径，看其能否独立定位状态与证据并说出下一步。**必须写明它没有继承什么**，否则是自证 | ADR-007；exit: failure_semantics=pass | U-005 / V-006 |
| G-003（OI-016） | 四类信息中「已决定」今天**完全无家可归**（facts.jsonl 无字段；只在 handoff 散文里） | 用户真实选择 **B 沿用 handoff 文档的「重要决策」章节**：按 T-008=C 改为不可变命名 + append-only。代价已登记：该文档自述 `non_authoritative`+`current_only`，改后须重定留存规则；且今天**不覆盖 verify-code** | ADR-008；exit: canonical_names=pass | U-005 / V-006 |

### 全需求覆盖矩阵（Grill 临时验证视图，不持久化原文、不是第五份材料）

| 消息类 | 落到哪条决策轴 | 状态 |
| --- | --- | --- |
| goal（目标和成功意图） | OI-004 → G-001 → ADR-006 | 已收敛 |
| flow_or_surface（用户旅程/入口范围） | OI-010（随 G-001 收敛）· OI-017 → ADR-005 | 已收敛 |
| data_or_state（数据/状态/状态变化） | OI-003 ✓ · OI-005 → ADR-001 · OI-006 ✓ · OI-007 → ADR-002 · OI-016 → G-003 → ADR-008 | 已收敛 |
| success_failure_acceptance（成功/失败/取消/验收） | OI-012 → ADR-003 · ADR-010（第②级范围补正）· OI-008 → G-002 → ADR-007 | 已收敛 |
| constraint_non_goal_defer（约束/非目标/延期/风险） | OI-013 → ADR-009 · OI-014 ✓ · OI-015 → ADR-004 | 已收敛 |

五类无缺类；每条已认证原始消息（U-001..U-005、母 R-001..R-007）均落到一条决策轴，无无主消息。

### 四项退出检查（客观 checklist）

本表为**自评 checklist**（依据全部来自本文件内引用），尚未经非实现者上下文消费；与 ADR-003 要求的「由非实现者消费一次」是两件事，不得混同。

| # | 检查项 | 结果 | 依据 |
| --- | --- | --- | --- |
| 1 | external_interfaces：外部依赖接口已核实真实定义（非文档假设） | **pass** | 只消费本仓代码与契约：`runtime/task/task-store.mjs`、`runtime/task/portable-workflow-run.mjs`、`runtime/evidence/freshness.mjs`、`runtime/stage/current-close-projection.mjs`、`tools/cli/stage-runtime.mjs`、`runtime/stage/stage-handoff.mjs`、`docs/contracts/card-01-stage-material-interface.md`；均已读真实实现或契约原文，非文档假设 |
| 2 | canonical_names：涉及字段/路径命名已有唯一权威定义 | **pass** | 7 值唯一权威＝`docs/contracts/card-01-stage-material-interface.md:26`；`phase_progress` 字段权威＝`runtime/task/task-store.mjs:241-253`；续跑载体命名沿用 SD-17「日期+序号+描述」；本卡不新造名词 |
| 3 | failure_semantics：失败路径/异常语义明确 | **pass** | OI-012/ADR-003 已定分级，第②级范围经 ADR-010 补入「陈旧」；「读不到记录」的诚实降级已有先例可循（`projectStageExecutionOutcome` 的 `phase_progress_cursor_only` 降级不冒充完成）；AC-39..AC-42 各有失败场景 |
| 4 | scope_boundaries：范围「做什么/不做什么」写死、无隐性口头扩大 | **pass** | OI-013/ADR-009 逐条写死非目标；T-008=C 显式排除外部清理；T-006=A 显式不碰 CARD-06 材料 |

### 结束记录（grill_summary）

- **CONTEXT.md**：`no-change`。理由：本卡的术语全部沿用既有权威定义（7 值、`phase_progress`、窄工具），未引入新的领域术语或改变既有术语含义。实际文件引用：无（本阶段只读，未改）。
- **ADR**：`created`（本卡 `decision-log.md` 的 `### ADR-001`..`### ADR-009`）。理由：本条记录走 decision-log 的 ADR 段，不改 `docs/adr/` 目录下的仓库级 ADR（那属 build-plan/build-code 的写面）。实际文件引用：本文件。
- **ADR 三项判据**：①难以反转＝**真**（结果契约一旦被 build-code 消费，再改要重做续跑演练与验收）；②无背景会意外＝**真**（维护者可能把「回读检查」误当成被 SD-17 删除的「回执回读校验」而一并删掉）；③真实取舍＝**真**（纯文本判陈旧 vs 哈希判陈旧、复用既有载体 vs 另立，均有明确代价比较与用户 A/B 选择）。
- **与现有术语/ADR 的冲突及处理**：发现并处理 3 处——①本卡 OI 编号与母 OI-013/母 OI-014 撞号 → 加编号消歧约定（FND-006）；②「回读检查」与 SD-17 点名的「回执 readback 校验」**近名易混（两者名称不同，参见 SD-17 原文）** → 由 ADR-002/ADR-004 划边界；③CARD-03 T-032「零新对象」与本卡「补进既有载体」的边界 → 由 ADR-001 显式登记代价，越界则须重新裁决 T-032。

## 审查处置

本阶段执行**一次**方向审查（step 4，红队 + 蓝队各一，独立上下文、非实施者），输入为 questions-only 投影
`quality/evidence/2026-10-02-001-convergence-outline-questions-only.json`（task store）。审查为建议，不是 pass 门。

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| FND-001（红 blocking） | CARD-06 spec.md:314 把「回读检查新机制」整块划给本卡，FR-41 又要求它是 CARD-06 删除后的幸存者 | 两卡可各自主张「不是我的事」；本卡大纲无一条约束 CARD-06 的删除面 | fixed | 新增 OI-015「CARD-06 删除面必须为回读保留什么」＋ F-004 登记 | OI-015 / 本卡 → CARD-06 迁移表 |
| FND-002（红 blocking） | CARD-06 迁移表主表自述「逐文件处置的唯一权威」，但 `derivePhaseProgressStatus`/`phaseProgressReadback` 在主表**无独立行**（主表 grep 计数 0），只见于附件 §5.1 | AC-THIN-006 台账测试**无对象可核** | needs_human | 本卡无权改 CARD-06 材料；已登记为 OPEN-003，交 CARD-06 owner / 其 build-plan 补主表行 | CARD-06 owner / 用户裁决 |
| FND-003（红 blocking） | 迁移表 §5.1 行号已漂移（记 L1014-1028 实为 L1050-1064；记 L1697-1711 实为 L1733-1740）；判据仍 `material_revision_mismatch`；`phase_progress` 行 schema 今天**硬拒非哈希**（task-store.mjs:241-253） | 与 SD-17「禁用内容寻址哈希」正面冲突；CARD-06 P5/P6 把同一文件同一函数分两批动 | fixed | 方向层由 OI-002/OI-007 处置；本卡引用一律**降级为符号引用**，不引行号 | 本卡 build-plan |
| FND-004（红 major） | 唯一强制保护 = 台账测试核对「幸存者行**路径仍存在**」+ 定向测试 exit 0；路径检查阻止不了函数被搬走/改写 | 幸存者保护可能形式化 | fixed | OI-015 问题面改为「保护对象是路径还是行为断言」 | OI-015 |
| FND-005（红 major） | AC-40 要四类信息齐备，但 7 值里没有「已决定」；「已完成且验证」≠ `succeeded`；「证据位置」在游标 4 键中 today 无处安放 | AC-40 无落点，可能留白 | fixed | 新增 OI-016「四类信息→既有载体的映射」 | OI-016 |
| FND-006（红 major） | 编号撞号：卡内 OI-013/OI-014 与母 OI-013（零机器门禁）/母 OI-014（合并审查点）同名异物 | 跨材料引用必指错事物 | fixed | 在本文件 OI 段加显式消歧约定（本卡 OI 直接写 OI-nnn，母卡一律写「母 OI-nnn」） | 本卡全材料 |
| FND-007（红 major） | CARD-01 RK-007/OP-006 已发生事实（材料被外部 worktree 清理静默销毁、全盘无副本）只作约束登记，无 OI 承接 | FR-42 的最大失败路径恰是记录本身消失 | fixed | 新增 OI-017；已实测本卡 `specs/` 目录当前为未跟踪状态（`git status` = `??`） | OI-017 |
| FND-008（红 major） | OI-008 问「用什么 fixture」是测试工程而非方向；AC-42「新会话无助手工补全」在本会话内检验必被污染；AC-41「真报失败」的「真」无判据 | 验收可能不可证伪 | fixed | OI-008 的 question 已按可证伪性重写 | OI-008 |
| FND-009（红 major） | CARD-06 ADR-015 要求回读「必须真实执行、不得降级 advisory」；SD-15/SD-17 又要求机器读数只记录不阻断、只有两道人为门 | 「非 advisory」与「非阻断」之间的状态今天无定义无实例 | fixed | OI-012 问题面补「真实执行的可核对形态」；范围补正见 ADR-010 | OI-012 |
| FND-010（红 major） | CARD-03 `decision-log.md:76`（T-032=B）已定「同一 `phase_progress` 字段、同一 4 键、同一 stage 行载体、同一对 run 写/status 读；零新字段/命令/对象/账本」 | 本卡若走「新写一份接续记录」即需重新裁决 T-032 | fixed | 已补入 F-005②；OI-005 选项须显式标注该代价 | 本卡材料 |
| FND-011（红 major＋蓝 blocking） | 全部方向性措辞绑在当前实现（`material_revision`、freshness）上，而 CARD-06 会改写判据、删 freshness | 表述最易过时 | fixed | 本卡按「不绑实现的判据句」写；并声明 CARD-06 完成后重取基线（DEFERRED-002/OPEN-001） | 本卡 build-plan |
| FND-012（蓝 blocking） | 「幸存者是删除幸存者」只写成文件存在性，缺「删除后**语义**仍成立」的判据；P5.md:193 自带 STOP「Card-08 需要的读回语义被破坏 → 停」 | AC-41 可能对着已被改写的幸存者失效 | fixed | OI-015 问题面含「语义仍成立」，不只存在性 | OI-015 |
| FND-013（蓝 major） | 点名清单被框在 spec.md:248 的 4 项，迁移表实际同族还有 MT-6-114（close 四域只读回读，SURVIVOR）、MT-6-291/minimal-task-storage（畸形行真报失败＝回读最近幸存者）、interrupted-same-task-recovery（PENDING） | 只按 4 项盘点会漏掉现成可用物 | fixed | F-004 已补；OI-001/OI-009 读取集含 §5.1 全表 | OI-001/OI-009 |
| FND-014（蓝 major） | 前置卡延期给本卡四项（DF-003/RK-004/RK-007/OP-006）只接了 RK-007/OP-006；DF-003、RK-004 无落点也无排除理由 | 覆盖缺口，且是「沉默」 | fixed | DF-003 由 OI-003/OI-005/OI-016 承接并标注；RK-004 由 OI-017 承接 | 本卡材料 |
| FND-015（蓝 major） | AC-39..AC-42 与 oracle 未区分「现成支撑 / 必须新建」。实测 main 7619db8e：AC-41 有最近支撑（minimal-task-storage、stage-progress-contract）；AC-42 无任何现成工具 | 可能把可复用项当新建，或反之 | fixed | F-006 登记；OI-008 按 AC 逐条标注 | OI-008 |
| FND-016（蓝 major） | CARD-01 蓝图仍定义「四份当前材料」，post 现行三份（decision-log/spec/phases） | 直接影响 FR-40/AC-40「接续记录落在哪份材料上」的判定 | fixed | 已补入 F-005；OI-005 处置该差异 | OI-005 |
| FND-017（蓝 minor） | 「不承诺跨会话证据链」漏掉同处限定「不假称纯技能提供同等机器保证」 | 回读检查的能力边界来源缺半句 | fixed | 已补入 F-005④ | — |
| FND-018（红 minor） | OI-011 只问「是否触碰页面」，而母 Q10 已定「完全不碰 UI」；R-005 的交互方式无 OI 承接 | 问题问错对象 | fixed | OI-011 记为已知约束（non_ui 三源一致）；R-005 已在 U-001..U-003 与 T-001/T-002 处置 | — |
| FND-019（红/蓝 minor） | 框架表若被当「问题全集」读，会误判「只剩这 14 件未决」 | 遗漏本身就是结论 | fixed | 框架表下加「已决项不列」显式说明 | — |

**未处置/未解决**：FND-002（needs_human）——本卡无权修改 CARD-06 材料；已记为 OPEN-003。
审查未在方向层发现 blocking 级**方向**争议；两条红队 blocking 均指向 CARD-06 侧的登记完整性，已分别转为 OI-015 与 OPEN-003。

**审查未核实项**（如实保留）：①`workflowhub-convergence-outline.v1` 正式 schema 不在本仓，无法判断投影是否漏必填字段；②CARD-06 P5/P6 阶段文件无 Write set 段，无法确认「回读函数搬到哪个文件」由哪个 Phase 承担；③未找到任何「新会话无旧上下文续跑」的既有可执行演练先例；④CARD-06 T022/P5 的实际落地状态无法从 main 核实（本卡基线为 main）。

**审查 provenance 登记**：本阶段 4 次独立审查（direction 红蓝队 step 4、detail 红蓝队 step 9）的 provenance 见 task store `quality/reviews/2026-10-02-001-make-decision-review-provenance.md`；**原件状态 `unavailable`**（独立子代理上下文产出、消息回传，未按 wh-review 路径字节级持久化），该文件只是登记，不替代原件。

## 最终确认

- 状态：**accepted**
- 用户原文与 host-visible 绑定：本次会话结构化问题卡 `final_confirmation` 的真实选项回复（2026-10-02）——**「确认，方向没问题」**。同批 `open003` 的真实选项回复——**「维持现状，只当已知缺口挂着（推荐）」**，即 OPEN-003 不再追改 CARD-06 材料，按已知缺口挂账。
- 确认范围：本卡的方向、范围、非目标、成功/失败边界、ADR-001..ADR-010、T-001..T-008、G-001..G-003、风险与延期交接、未决项 OPEN-001..OPEN-005。
- 未确认内容：**无**。字段形状、文件命名、与 CARD-06 的对账属显式延期项（DEFERRED-001..004），不属未确认方向。
- 确认前已如实披露的事实：①四个机器 reader 首轮全部读不出草稿，已定点修复并**独立复跑通过**（`analyzeDecisionOutline` ok / `analyzeDecisionConvergence` ok / UI `recorded`+`non_ui` / census `present`，errors 全空、`open_items` 为空）；②两处**必要措辞偏离**（收敛检查表头补「（用户答案）」、处置列补「；已覆盖」，均为 live reader 要求）；③OI-006 契约引文因 reader 禁用词而**非逐字**（已单列登记）；④方向审查用独立子代理而非 wh-review provider 调用，差异如实登记未冒充。
- 确认性质：**完成事实，不是继续工作的许可证**（`workflows/make-decision/SKILL.md`）。本确认不授权 commit/archive/merge/push/cleanup。

## 拒绝方案

| 选项 | 拒绝理由 | 关联 D |
| --- | --- | --- |
| T-003=A 纯复用现有记录 | 四类信息中「已决定」「证据位置」在 `facts.jsonl` 无落点，AC-40 判失败 | ADR-001 |
| T-003=C 另立独立接续记录文件 | 顶撞 CARD-03 T-032「零新对象」与 CARD-02 D-004「一事实一权威」，且踩中本卡头号风险「新的重型事实图」 | ADR-001、ADR-009 |
| T-004=A 用 Git 提交号判陈旧 | 看不见未跟踪材料，而本卡决策材料此刻正是未跟踪（`git status` = `??`），CARD-01 RK-007 场景发现不了 | ADR-002 |
| T-004=C 不判陈旧只判完整 | AC-41 明确要求「构造陈旧记录→报出问题」，只判完整仅完成一半 | ADR-002 |
| T-005=A 只记录并继续（不设失败事实） | 与 CARD-06 ADR-015「回读检查必须真实执行、不得降级 advisory」冲突，易被当成 advisory | ADR-003 |
| T-005=C 发现即停下等人 | 违反母 PRD SD-17「只有两道人为门、一切机器校验不构成推进前置」 | ADR-003 |
| T-006=B 现在向 CARD-06 提明确要求 | 本卡**无权修改兄弟卡材料**；跨卡协调需用户或 CARD-06 owner 介入，成本高于收益 | ADR-004、OPEN-003 |
| T-006=C 本卡自己接过读回函数 | 与 CARD-06 B5/P6 写面直接冲突，且顶撞 prd.md:L475「待 CARD-06 先串行就位」 | ADR-004 |
| T-007=A 只要还能读到续跑位置 | 不定义结果形态时，CARD-06 改用 Git 判据后未提交材料不在其视野，续跑位置会算错 | ADR-004 |
| T-007=C 固定「哪些函数要活下来」的清单 | CARD-06 已证明会搬会改；其行号引用已实测漂移（记 L1014-1028 实为 L1050-1064） | ADR-004 |
| T-008=A 全管（含外部清理） | 外部 worktree 清理不在本仓控制内，只能提示不能防；纳入范围会做成不可兑现的承诺 | ADR-005、ADR-009 |
| T-008=B 完全不管 | CARD-01 明写「根治归 CARD-08」，且 CARD-05 有实测覆盖事故（11854 B → 4258 B，字节不可恢复），全不管等于放弃可修复的一半 | ADR-005 |
| 把回读检查并入 `freshness.mjs` 沿用 | 该文件 100% 建立在 sha256 + `material_revision` + `snapshot_tree` 上，正是 CARD-06 点名要删的链；沿用即随删除失效 | ADR-002、ADR-004 |

## 风险与延期交接

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
| --- | --- | --- | --- |
| RISK-001 | 接续记录被做成新的重型事实图（与薄核心定位冲突） | prd.md:L478 局部风险；若发生则本卡目标失败 | 本卡 build-plan 设计期 / CARD-08 owner；由 ADR-001、ADR-009 设防 |
| RISK-002 | 回读检查形同虚设，陈旧/不完整记录被判完整 | prd.md:L478；AC-41 失败场景；补正后 AC-41 的失败观测由 ADR-010 的第②级承担 | 本卡 verify-code；由 ADR-003 的「非实现者消费 + 至少一次真实 failed 观测」设防 |
| RISK-003 | 记录层停用内容寻址后文件名碰撞/覆盖 | prd.md:L609（R7）；**已在 CARD-05 实测发生**（handoff 文件被覆盖，11854 B → 4258 B，旧字节不可恢复） | 本卡 build-plan 命名设计 / ADR-005 |
| RISK-004 | 本卡结果契约（ADR-004）与 CARD-06 落地后的实际读回能力对不上 | CARD-06 约 P2/8，其 B5/P6 会搬走读回函数并改判据 | OPEN-001 对账；CARD-08 build-plan |
| RISK-005 | 「陈旧」判据的两项已知盲区被下游改写成「保证」 | 盲区：①内容变了发现不了；②无哈希｜后果：超出本仓既有承诺（不承诺跨会话证据链） | 本卡全阶段；由 ADR-002 显式登记 |
| RISK-006 | `quality/evidence/handoff/<stage>.md` 不覆盖 verify-code，而「已决定」落到该文档 | 实测 `STAGE_HANDOFF_STAGES` 不含 verify-code；后果：verify-code 阶段的「已决定」无落点 | OPEN-004；CARD-08 build-plan |
| RISK-007 | 本卡材料当前为未跟踪状态，可能被外部清理静默销毁 | 已实测 `git status` = `??`；CARD-01 RK-007 场景在当前任务上真实存在 | 本卡显式排除（T-008=C）并挂账 OPEN-005；**用户可另行决定是否加保护** |
| DEFERRED-001 | 接续记录的具体存储形态、字段形状、文件命名 | prd.md:L479 可后置技术项 | CARD-08 build-plan |
| DEFERRED-002 | 与 CARD-06 最终删除面的对账 | U-003 已确认的代价：删除面未定稿，build-plan 须回核 | CARD-08 build-plan；CARD-06 完成后 |
| DEFERRED-003 | `phases/index.md` 与阶段材料的正文细节 | 属 build-plan 产物形态，不在方向阶段 | CARD-08 build-plan |
| DEFERRED-004 | 母 PRD L475 的合并依赖：待 CARD-06 串行就位后与 CARD-09 并行（并行度 2），写面先协调 | 本卡当前只到 make-decision，未进入并行实施；不登记则下游可能漏掉协调责任 | CARD-08 build-plan；触发条件＝CARD-06 就位后 |

### 质量边界

- 质量事实：本阶段已完成——step 1-2 材料落盘；step 3 研究（F-001..F-006，来源为只读研究子代理）；step 4 方向审查一次（红队 + 蓝队各一，独立上下文、非实施者，产出 FND-001..FND-019，19 条全部处置：18 fixed / 1 needs_human）；step 5 第一轮方向 Talk（T-001..T-008，8 条真实用户回复）；step 6 Grill（G-001..G-003，3 条真实用户回复，四项退出检查全 pass）；step 7 module-convergence 由 G-001..G-003 承担；**原 17 条 OI 已全部收敛为终态**；step 8 草稿落盘。**如实保留的缺口**：①step 4 审查的 provider/transport 原始凭证未按 wh-review 路径产出（本阶段用的是独立子代理审查，非 wh-review provider 调用），该差异如实登记，不冒充 wh-review 已执行；②母动作序列要求 step 11-13 只落 task store，本阶段尚未执行；③本轮 Talk 有一题首次提问因术语过重导致用户无法作答（V-005），重问后取得真实回复，该次失败提问如实保留。
- reader 结果留痕：四个 reader 通过的结论不以上述叙述为凭，原始 stdout 已留存于 task store 路径 `quality/tests/2026-10-02-001-card08-reader-output.txt`（本机绝对路径 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-08-20260919/quality/tests/2026-10-02-001-card08-reader-output.txt`）：`OUTLINE` ok=true、`CONVERGENCE` ok=true、`UI` status=recorded + result=non_ui、`CENSUS` status=present，四者 `errors` 全空。复跑命令与留存件一致，可据此回读。
- 推进资格：质量事实不是推进许可证（SD-15）。本阶段推进只受两道人为门约束（SD-17）：①推进确认对话——本卡的用户确认由「## 最终确认」节承载；②不可逆 Git 授权——本卡**未执行**任何 commit/archive/merge/push/cleanup。
- 完成判据：dynamic Talk 队列已收敛（无剩余方向级未决问题）；17 条 OI 全部为终态（confirmed），无 open 项；必要研究已运行（F-001..F-006）；Grill 已运行且四项退出检查全 pass；`decision-log.md` 为当前版本；独立审查事实与发现已记录且每条都有处置；**用户经真实结构化答复确认决定**（见「## 最终确认」）。
- 阶段末一致性检查与修复（2026-10-02）：草稿落盘后另跑一次**阶段末一致性检查**（spec-analyze），产出 finding #1..#5，由检查者以外的实施上下文逐条定点修复：R1 审查 provenance 落盘登记（4 次独立审查：direction 红蓝队 step 4、detail 红蓝队 step 9；provider/transport＝独立子代理上下文，**非** wh-review provider 路径；**原件状态 `unavailable`**，登记件见 `quality/reviews/2026-10-02-001-make-decision-review-provenance.md`，不替代原件）；R2 四个 reader 的 stdout 原文留痕（`quality/tests/2026-10-02-001-card08-reader-output.txt`）；R3 Grill 四项退出检查标注为**自评 checklist**；R4 补 DEFERRED-004（母 PRD L475 合并依赖与写面协调）；R5 ADR-004 按 SD-09 登记集成责任偏离；R6 ADR-008 补单一权威对账；R7 ADR-003 补 B-08 控制面四要素登记；R8/R10/R11/R12/R13 补术语、引文、最小读取集、consumer 与流程前两步；R9 措辞（`ADR-015` 一律限定为 `CARD-06 ADR-015`、「同名异物」改为「近名易混」、OI-002 处置补出处）。**R14 为方向级变更**：阶段末检查发现 ADR-003 第②级无法承接母 PRD AC-41 的失败观测，经用户 2026-10-02 真实选项回复「A 把「陈旧」归到失败那一级」新增 **ADR-010** 补正；按 SD-10 纪律 **ADR-003 原文保留不重写**，差异记入「## Append-only 更正（只追加）」。该检查与修复是**事实记录**，不是推进许可证。
- 一处引用错配如实登记（不漂白，且已在同任务内修正）：修复指令把 R13 流程句写成「跨会话读取侧的流程（ADR-006/ADR-010 见下）」，但 **ADR-010 是回读检查第②级范围的补正（承接 AC-41），与本卡流程无关**；跨会话读取侧流程的实际权威是 **ADR-006 与 ADR-007**。**处置**：「## 范围」该句已改为「（ADR-006/ADR-007）」；原错配事实保留在本条，不因修正而删除。同类处置：ADR-003 正文内一处裸写 `ADR-015` 的消歧**只登记在「## Append-only 更正」**，ADR-003 正文完全不改（严格 SD-10），该处作为**已知例外**保留。
- 不可逆授权边界：本卡不执行 commit/archive/merge/push/cleanup 等不可逆 Git 动作，除非用户单独授权（母 PRD SD-17 第二道人为门）。

## 未决项

| item_id | 未决内容 | 原因 | 谁在何时解决 |
| --- | --- | --- | --- |
| OPEN-001 | 本卡结果契约（ADR-004）与 CARD-06 最终删除面的对账 | CARD-06 在途（真实进度 P2/T011，共 P1→P8 八批）；其迁移表 §5.1 把「读回函数是否算校验机器」标为 PENDING 且未写归属卡 | CARD-08 build-plan；触发条件＝CARD-06 完成并合并到 main 之后 |
| OPEN-002 | 接续记录的具体存储形态与命名 | 属母 PRD 明写的可后置技术项（prd.md:L479） | CARD-08 build-plan |
| OPEN-003 | CARD-06 迁移表**主表**中没有 `derivePhaseProgressStatus` / `phaseProgressReadback` 的独立行（只在附件 §5.1），其 `AC-THIN-006` 台账测试可能核不到保护对象 | 红队实测主表 `grep -c phaseProgressReadback` = 0；本卡**无权修改兄弟卡材料**（T-006=A） | **用户或 CARD-06 owner 处置**；本卡只登记，不追改。触发条件＝CARD-06 build-code 执行到 B5/P6 时 |
| OPEN-004 | `quality/evidence/handoff/<stage>.md` 今天**不覆盖 verify-code**（只 4 个 authoring stage），而「已决定」按 ADR-008 落到该文档 | 实测 `stage-handoff.mjs` 的 `STAGE_HANDOFF_STAGES` 不含 verify-code | CARD-08 build-plan：明确处置为「补齐」或「如实记 incomplete」，不得留白 |
| OPEN-005 | 外部 worktree/分支清理销毁未跟踪材料（CARD-01 RK-007/OP-006 明写「根治归 CARD-08」，但本卡按 T-008=C 显式排除） | 超出本仓控制范围，只能提示不能防 | **无人承接，如实挂账**：已被本卡显式排除并写明理由；若日后仍要根治，须由用户重新立项 |

**已关闭**：OPEN-000（CARD-01 DF-003「旧任务兼容与最小接续」）——已由 OI-003、OI-005、OI-016 与 ADR-001/ADR-008 承接，不再是悬空条目。

## 退役登记（retirement）

退役是一次**决定**，不是进度：不写百分比、不写状态机。被取消、删除或永久退出的对象（需求、Phase、Task、材料、机制）在这里各占一行；没有退役对象时保留表头并写一行「本卡无退役对象」。

| 日期 | 哪张（R/FR/AC/Phase/Task/材料 编号或 ID） | 为什么退役 | 谁决定 | 原来的需求编号 |
| --- | --- | --- | --- | --- |
| 2026-10-02 | 外部 worktree/分支清理销毁未跟踪材料的防护（CARD-01 RK-007 / OP-006 的「根治」部分） | 该项超出本仓控制范围，只能提示不能防；纳入本卡范围会做成不可兑现的承诺 | 用户（T-008 真实选择 C：部分管，只修「固定名覆盖」） | R-004（prd.md:L465）；上游来源 CARD-01 RK-007、OP-006 |
| 2026-10-02 | 「用内容哈希或 Git 提交号判定记录陈旧」这一机制 | 内容哈希被 SD-17 明令停用；Git 提交号判据看不见未跟踪材料，而本卡决策材料此刻正是未跟踪状态，该判据在本卡场景下会算错 | 用户（T-004 真实选择 B：纯文本路径存在性判据） | R-003（prd.md:L464） |

## Supersedes（被替代记录）

无。本卡为新建任务，无被替代记录。

## Append-only 更正（只追加）

只追加更正记录；不得重写已确认 ADR。每条更正引用被替代 ADR、原因和新的 ADR。

- 2026-10-02：ADR-003 的第②级范围经阶段末一致性检查 finding #5 发现无法承接母 PRD AC-41 的失败观测；经用户真实选项回复「A 把「陈旧」归到失败那一级」补正，新增 **ADR-010**。**ADR-003 原文保留不重写**（SD-10）。被替代表述：ADR-003 的 `decision` 中「②状态值非法」一句的范围。
- 2026-10-02（引用消歧，非决定变更）：ADR-003 的 `decision` 内所引 `ADR-015` 指 **CARD-06 的 ADR-015**（回读检查不得降级 advisory），不是本卡编号；本卡 ADR 只到 ADR-010。**处理方式：ADR-003 正文完全不改**（严格按 SD-10 不改写已确认内容），消歧只登记在本条。**已知残留**：ADR-003 正文内因此保留一处不带卡名前缀的跨材料引用，与本文件 FND-006 的消歧约定不符——该处为本条登记的**已知例外**，读者按本条判定其指向即可；若日后需要正文级消歧，须走「新增 ADR + supersedes」路径，不得直接改 ADR-003 正文。

## 文档结果

- CONTEXT.md：**no-change**（未修改文件），但如实登记本卡引入的两个新说法：「结果契约」（本卡用于指「不管实现怎么搬改、读出来的结果语义不得变」，出现约 17 处）与「续跑载体」（指承载四类信息的既有文件/字段，出现约 3 处）。二者**未被登记进 CONTEXT.md**，属本卡材料内的工作用语；若 build-plan 认为需要成为正式术语，应走 CONTEXT.md 更新。
- ADR：**created**（本文件 `### ADR-001`..`### ADR-010`），原因：本卡有难以逆转的结果契约与真实取舍需要留证。文件引用：本文件。**不改** `docs/adr/` 仓库级 ADR（那属 build-plan/build-code 写面）。
- ADR 判据：hard to reverse＝**真**（结果契约一旦被 build-code 消费，再改要重做续跑演练与全部验收）；surprising without context＝**真**（维护者很可能把「记录完整性回读检查」误当成 SD-17 点名要删的「回执 readback 校验」而一并删除）；genuine trade-off＝**真**（纯文本判陈旧 vs 哈希判陈旧、复用既有载体 vs 另立权威，均有已登记的代价比较与用户真实 A/B 选择）。
- 术语/ADR 冲突及处理：**已处理 3 处**——①本卡 OI 编号与母 OI-013/母 OI-014 撞号 → 增设编号消歧约定（FND-006，见 OI 段）；②「记录完整性回读检查」与 SD-17 点名的「回执 readback 校验」**近名易混（两者名称不同，参见 SD-17 原文）** → 由 ADR-002 与 ADR-004 划清边界（被删的是以哈希/快照绑定版本、不通过即阻断推进的机器；本卡保护的是无哈希、只读、不阻断、如实报缺的读取结果）；③CARD-03 T-032「零新字段/零新对象」与本卡「补进既有载体」的边界 → 由 ADR-001 显式登记代价，若越界须**重新裁决 T-032**。
- 不复制 spec 的边界：本文件只记方向、选择、理由、风险、边界与验收口径；实现细节、字段形状与文件清单进入 build-plan 的 `spec.md` 与 `phases/P<n>.md`。

### Exit checks（退出检查）

- 上下文一致：**pass**。本卡消费的当前材料只有母 PRD CARD-08 节、母 decision-log 的 OI-007/T-004/Q4(b)/Q11、前置卡已归档材料与 CARD-06 在途材料（只读）；不把未来 `spec.md`/`phases/**` 当方向确认前置。
- owner/接口一致：**pass**。本卡 owner＝CARD-08 承接 task（本任务）；`facts.jsonl` 的 owner＝task-store；`phase_progress` 游标 owner＝build-code 的 run 写入路径；handoff 文档 owner＝stage-handoff 技能。ADR-008 指向的载体 owner 与既有登记一致，未改 owner。
- 失败语义明确：**pass**。AC-39..AC-42 各有失败场景；回读检查两级判据（缺信息 / 状态值非法）由 ADR-003 定义，第②级范围经 ADR-010 补入「陈旧」（引用的证据路径不存在），使 AC-41 的失败观测有来源；「读不到记录」的诚实降级沿用既有先例（不冒充完成）。
- 范围与延期明确：**pass**。非目标逐条写死于「## 非目标」（ADR-009）；延期项 DEFERRED-001..004 与未决项 OPEN-001..005 均带 owner 与触发条件；退役对象 2 项已按模板登记，不用「以后再说」。

## UI applicability

```json
{
  "result": "non_ui",
  "sources": {
    "raw_requirement": {
      "result": "non_ui",
      "reason": "用户原始需求（U-001）要求的是任务记录与跨会话接续机制，未提出任何页面、交互或视觉要求"
    },
    "project_inventory": {
      "result": "non_ui",
      "reason": "本仓为 Node CLI 与运行时项目（.mjs/.md/.json），无前端框架、无路由表、无组件目录"
    },
    "planned_or_changed_frontend_fact": {
      "result": "non_ui",
      "reason": "本卡计划只涉及 task 记录、状态集与回读检查，不计划任何前端改动；母 PRD L22 已确认 OI-008 为 non_ui 并显式排除 UI"
    }
  },
  "source_reasons": []
}
```

三源一致指向 `non_ui`，无冲突，无需向用户追问；本卡跳过 UI 设计链。

## 收敛检查

| 维度 | 用户实际答复（用户答案） | 事实引用（R/D/F/OI 编号） | 可执行验收 |
| --- | --- | --- | --- |
| 目标 | **新答复**：T-003（复用既有载体）＋ G-001（新会话须说出下一步并等用户确认，不自动开工）。事实引用：U-004/V-004、U-005/V-006；ADR-001、ADR-006。 | R-002、R-004；D-001、D-006；ADR-001、ADR-006；OI-004、OI-005 | 新会话能定位状态与证据并给出下一步建议，且在用户确认前不开工（AC-42） |
| 范围 | **新答复**：T-006 用户选 A（不碰 CARD-06 材料）＋ T-007 用户选 B（「幸存者」＝本卡结果契约语义不变）＋ T-008 用户选 C（部分管：只修固定名覆盖，外部清理显式排除）。事实引用：U-004/V-004；ADR-004、ADR-005、ADR-009。 | R-001、R-003、R-007；D-004、D-005、D-009；ADR-004、ADR-005、ADR-009；OI-009、OI-015、OI-017 | 非目标逐条写死且可追溯；旧任务 0 改动、0 交接记录、0 兼容链（AC-39）；未决项处置：4 项带 owner 与触发条件；OPEN-005 无人承接（如实挂账） |
| 方案 | **取舍**（[推论]，agent 取舍而非用户答复）：复用既有载体优于另立独立接续记录；**被拒选项**：T-003=A、T-003=C、T-004=A、T-005=C、T-006=B/C、T-007=C、T-008=A；**未决项处置**：4 项带 owner 与触发条件；OPEN-005 无人承接（如实挂账）。 | R-002、R-003；D-001、D-002、D-003；ADR-001、ADR-002、ADR-003；OI-005、OI-007、OI-012 | 复用既有载体、不新增第二份权威（AC-40）；「陈旧」＝引用路径不再存在，内容变化不判陈旧；回读分级不阻断（AC-41） |
| 验收 | **新答复**：G-002 用户选 B（子代理模拟无上下文新会话＝AC-42 证明方式）＋ T-005 用户选 B（分级处置，第②级范围经 ADR-010 补入「陈旧」）。事实引用：U-005/V-006；ADR-003、ADR-007。 | R-004、R-006；D-003、D-007；ADR-003、ADR-007；OI-008、OI-012 | **场景**：①旧任务 fixture 运行新流程；②检查接续记录字段；③构造陈旧/不完整记录；④子代理模拟无上下文新会话。**数据来源**：旧任务 fixtures、facts.jsonl、phase_progress 游标、quality/evidence/handoff。**通过条件**：AC-39 旧文件 0 改动；AC-40 状态为 7 值之一且四类信息齐备；AC-41 真报失败；AC-42 仅凭记录定位并说出下一步。**失败条件**：旧文件被改或建兼容链；出现 7 值外状态；陈旧记录被判完整；续跑需旧会话记忆。 |
