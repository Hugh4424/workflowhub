# 功能规格：stage-reflection 复盘器可用性与信息质量改造

> 基于已接受的 make-decision 决策（workflowhub-stage-reflection-usability-20260901）。
> 本文件只写产品行为、边界和验收，不写实现类名、工程命令或任务步骤。

- **功能名**：复盘器可用性改造（执行闭环 + 诚实状态 + 一次性历史导入 + 信息质量）
- **来源**：specs/workflowhub-stage-reflection-usability-20260901/decision-log.md（D-001~D-008，用户已确认 accepted）
- **状态**：草稿（待本阶段冻结；当前仅接受 decision/build-plan 材料，不授权 build-code）
- **Current-material audit**：当前 SHA-256 见外部 manifest `quality/evidence/material-hashes-20260901.json`（2026-09-01）；仅记录材料 provenance，不代表 build-code 或验收通过。

## 速读卡（30 秒）

- **一句话需求**：让每个正式阶段结束时的复盘判断真正被执行并发布，且状态如实（没人执行/没触发/失败分得清），历史 20 条经验教训一次性正式入库，复盘内容带上机器可验事实，供 M16 候选池/质量税消费。
- **核心改动点**：
  - 新增复盘执行闭环（会话产出判断 → 机器校验/合并/发布）与调度语义修正（无执行器不再写假失败）；
  - 复盘状态扩为五态并定义状态转移表；页面词表如实显示；
  - 20 条历史教训经一次性转换适配器分项目导入，证据文件落正式存储，补人工介入提取与严重度校准；
  - 复盘内容重写（六类问题结构化）+ 新增事实投影三件套（v2）；M16 消费侧认 v1+v2 并存。
- **最大影响面**：五份正式工作流的阶段末行为、monitor 静态页面的状态徽章、M16 已合入 main 的候选池/趋势区消费链路。
- **验收信号**：契约测试全绿（含新旧记录兼容 fixture 与 M16 契约）、独立审查完成、最小真机验证跑通"会话产出判断 → reflect 发布 → 页面显示 → M16 消费"全链（含失败与未调度路径）、20 条历史教训实际落库。

## 来源与决策映射

| Source ID | Decision ID | FR / AC IDs | Status / affected scope | Unresolved / handoff |
| --- | --- | --- | --- | --- |
| R-001/R-003（流程合规/验收口径） | D-007 | AC-VERIFY-001~004 | current | 真实业务任务端到端=DE-001 延期 |
| R-002/R-004（流程梳理/页面范围） | D-001/D-002/D-006 | FR-EXEC-001~003、FR-STATE-001~003 | current | — |
| R-005/R-009（复盘器可用/信息质量/M16） | D-001/D-004/D-005 | FR-QUALITY-001~003、FR-M16-001 | current | operational_tail=DE-002 |
| R-006/R-008（评审材料/20 条归属） | D-003、G-002 | FR-IMPORT-001~005 | current | 严格行级证据=DE-003 |
| F-001/F-002（executor 缺失/前科） | D-001/D-007 | FR-EXEC-001、AC-VERIFY-003 | current | — |
| F-003（触发覆盖缺口） | D-002、G-001 | FR-STATE-002 | current | — |
| F-006/F-007（回填约束/契约不兼容） | D-003 | FR-IMPORT-001 | current | — |
| F-013/F-014/F-015（证据悬空/介入为零/降级实测） | D-003 | FR-IMPORT-003~005 | current | 介入深度校正=DE-004 |
| T-015（M16 消费改进归属） | D-005 | FR-M16-001 | current | M16 已合入；本任务消费适配在 T601 核验后进行，T010/AC-GOV-002 质量事实仍 incomplete/inconclusive |
| FND-S07（失败恢复矩阵缺口，本阶段审查） | D-001 细化 | FR-EXEC-004、AC-EXEC-004 | current | — |
| 非目标清单（初判+T-011/T-013） | D-008 | 第 10 节 | current | — |

## 1. 问题与紧迫性

stage-reflection 复盘器自落地以来从未在生产路径执行过：无任何宿主提供执行器，每次真实任务复盘恒定落"失败"记录（executor was not provided），M16 因此拿不到有效上游数据（其 T008 执行事实保留了 executor unavailable）。更糟的是，"没执行"和"真失败"在记录和页面上不可区分（假象）；M16 已建 130 项测试全绿但复盘仍不可用（F-002 前科），说明确定性测试不能替代真实链路验证。与此同时，20 个历史任务的经验教训已离线收集，但格式与正式契约不兼容且未落正式存储，M16 早期候选池数据稀缺。本需求把复盘器从"装饰"变成"真用"，并为 M16 供真实数据。

## 2. 背景、目标与范围

### 背景

既有机制完整：schema v1、验证器（含消费边自动派生与悬空引用降级规则）、固定路径不可变发布、monitor 页面（任务视图徽章 + M16 只读 Evolution 趋势区，已合入 main）。断裂点：执行器缺失、状态枚举无法表达"未执行/未触发"、五份工作流 SKILL.md 零提及复盘（无执行指令）、历史包字段契约不兼容。治理约束：公共运行时行为保持七类（doctor/status/run/review/verify/confirm/authorize），不新增公共行为类。

### 目标

- 每个真实任务阶段结束时，复盘判断由主会话产出并经机器闭环真实发布（不再是恒定假失败）；
- 用户/M16 能从页面与记录区分"成功/降级/失败/没人执行/没触发"；
- 复盘内容带机器可验事实（状态矩阵/身份快照/来源完整性）与结构化六类问题回答，M16 可聚合、可校验；
- M16 候选池/质量税立刻获得 20 条历史样本（仅供参考档）并能消费 v1+v2 并存记录；
- 一切改动保持既有契约测试绿、旧记录可读。

### 范围内

- 复盘执行闭环：会话产出判断 JSON → 机器完成校验、教训合并、固定路径不可变发布；
- 调度语义修正与状态枚举扩展（含 runner 两处最小改动，见第 10 节边界）；
- 五份工作流 SKILL.md 与 docs/standard-workflow.md 增补阶段末执行指令；
- 复盘技能 SKILL.md 重写（六类问题结构化输出 + 机器链描述与实际一致）；
- 复盘记录 schema v2（事实投影三件套）与验证器完整性规则；
- 20 条历史教训一次性正式导入（转换适配器、分项目、证据落库、介入补录、严重度校准）；
- 页面最小生效面（状态枚举 + 模板词表 + 契约测试同步）；
- M16 消费侧改进（认 v1+v2 并存与新状态语义）：M16 已合入当前基线；T601 已完成消费面核验，T602/T603 在当前分支实施必要适配；M16 T010/AC-GOV-002 仍为 `incomplete/inconclusive`；
- 最小真机验证（构造场景跑通全链，含失败/未调度路径）。

## 3. 用户场景与状态覆盖

### SCN-001：正常阶段结束并完成复盘

- **角色**：主会话（执行工作流的 agent）、任务 owner（人）
- **Given**：某真实任务的正式阶段（如 build-spec）执行完毕，stage outcome 已落盘；
- **When**：主会话按技能读取三输入（会话记忆/教训/阶段结果快照），按六类问题形成结构化判断 JSON，调用复盘执行闭环；
- **Then**：机器完成 raw 前奏校验、验证（含悬空引用降级与移除候选双硬信号门槛）、教训合并、固定路径不可变发布；记录状态为 ok 或 degraded；页面徽章与 M16 消费可见。

### SCN-002：阶段结束时无人执行复盘

- **角色**：主会话、任务 owner
- **Given**：阶段执行完毕，但本次未注入执行器且主会话未调用执行闭环；
- **When**：阶段运行结束；
- **Then**：不发布任何"失败"记录（固定路径保持空闲）；页面把该阶段复盘显示为 unavailable（有人能看到"没人执行"，不与真失败混淆）；主会话事后仍可通过执行闭环补一条真实记录（固定路径未被占用）。

### SCN-003：阶段未启动/中断/preflight 失败

- **角色**：任务 owner
- **Given**：阶段因 preflight/身份/启动失败或中断，从未进入 handler；
- **When**：阶段结束（或从未开始）；
- **Then**：机器留下"未调度"事实；页面显示 not_scheduled；不产生判断记录、不阻断 close。

### SCN-004：一次性导入 20 条历史教训

- **角色**：本任务执行者（主会话+人）
- **Given**：离线回填包（20 条判断 + 教训 + 会话索引）与本任务批准的一次性导入决策；
- **When**：执行转换适配器（字段映射 → 全量预演跑验证器 → 幂等/失败回滚 → 分项目落库）；
- **Then**：20/20 条教训按项目归属落入正式 lessons（WorkflowHub 入 workflowhub、PaperBuilder 入 paperbuilder 或离线标注）；证据索引文件落正式存储（文件级引用，不再悬空）；每条标注"历史回放"身份；严重度按规则校准；人工介入字段经补一轮提取填充（LLM 分析，标注低置信度）；导入失败不污染正式 lessons。

### SCN-005：任务 owner 查看页面状态

- **角色**：任务 owner
- **Given**：monitor 页面已生成；
- **When**：查看任务视图的某阶段卡片；
- **Then**：复盘徽章如实显示五态之一（ok/degraded/failed/unavailable/not_scheduled）；旧记录照常显示；M16 Evolution 趋势区布局与交互不变（消费数据语义见 FR-M16-001）。

### SCN-006：M16 消费复盘产物

- **角色**：M16 已合入 main 的候选池/质量税/趋势区
- **Given**：同时存在 v1 旧记录、v1 新状态记录与 v2 新记录；
- **When**：候选池聚合、质量税归因、趋势区投影运行时；
- **Then**：三版记录均被正确识别；unavailable/not_scheduled 不计入候选池判断计数（无判断内容）；"历史回放"记录进入仅供参考档；M16 契约测试保持绿。

### 状态覆盖清单

- [x] **默认态**：SCN-001
- [x] **空态**：SCN-002（无判断记录时的页面显示）
- [x] **错误态**：SCN-001 的失败分支（验证失败 → failed/degraded）与 SCN-004 的导入失败回滚
- [ ] **加载态**：N/A — 复盘与页面均为静态/离线产物，无加载交互
- [ ] **取消态**：N/A — 复盘执行闭环无中途取消语义；中断归入 SCN-003
- [x] **边界态**：SCN-003（未启动/中断）、SCN-004（unknown 任务身份的历史记录）
- [ ] **权限态**：N/A — 无多角色权限模型；执行闭环为私有命令，无新权限面
- [x] **竞态**：SCN-002 的"事后补记"（固定路径空闲保证后发真实记录不被占用）；run 与 reflect 的先后约定（FR-EXEC-003）

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：生产路径无任何复盘执行器提供方，真实任务复盘恒为 failed（executor was not provided）。
  - **status**：`verified`
  - **证据或来源**：make-decision F-001（全仓扫描：唯一注入者为测试）/F-002（M16 T008 执行事实）
  - **关联**：FR-EXEC-001、AC-VERIFY-003
- **PFACT-002**：130 项测试全绿不能证明生产可用（执行链依赖会话合规，确定性测试有盲区）。
  - **status**：`verified`
  - **证据或来源**：make-decision F-002；direction/detail 审查 FND-D02/FND-DD04
  - **关联**：AC-VERIFY-003
- **PFACT-003**：复盘触发仅覆盖 handler 成功/失败两条路径；preflight/身份/启动失败与中断无任何记录。
  - **status**：`verified`
  - **证据或来源**：make-decision F-003（stage-runner 调度点核实）
  - **关联**：FR-STATE-002
- **PFACT-004**：schema v1 状态枚举仅 completed/failed 与 ok/degraded/failed；验证器对悬空证据引用降级。
  - **status**：`verified`
  - **证据或来源**：make-decision F-004/F-015（导入预演实测）
  - **关联**：FR-STATE-001、FR-IMPORT-003
- **PFACT-005**：M16 是复盘产物唯一上游消费者（候选池两档、质量税 30 天归因、Evolution 趋势区）；M16 已合入当前 main 基线；其 T010/AC-GOV-002 独立质量收口尚未完成。
  - **status**：`verified`
  - **证据或来源**：make-decision F-005/R-101；T601 provenance `eeb9dfa12 → cdafb4446 → fff255c78`
  - **owner、影响**：M16 消费 mixed-input 适配由本任务 T602/T603 承接；独立质量收口未完成 → RISK-002
  - **关联**：FR-M16-001
- **PFACT-006**：历史回填包与正式契约不兼容（entry_kind/record_kind、source_refs 结构、unknown 任务身份），直接导入会使整条链路失败；其 20 条判断全部 confidence:high 且 interventions 为零，证据引用悬空。
  - **status**：`verified`
  - **证据或来源**：make-decision F-007/F-013/F-014
  - **关联**：FR-IMPORT-001~005
- **PFACT-007**：五份工作流 SKILL.md 与标准流程文档对复盘零提及；所有步骤/技能均为"当前主会话执行 + CLI 记录"模式；无生产侧宿主注入先例。
  - **status**：`verified`
  - **证据或来源**：make-decision R-102（调研报告，grep 复核零命中）
  - **关联**：FR-EXEC-003
- **PFACT-008**：复盘固定路径为内容寻址不可变发布（同字节幂等、异字节冲突）；若先写假失败记录会永久占用路径。
  - **status**：`verified`
  - **证据或来源**：make-decision F-001 上下文（task kernel createImmutable 语义核实）
  - **关联**：FR-EXEC-001、SCN-002
- **PFACT-009**：页面模板词表已含 unavailable（缺 not_scheduled）；投影器数据透传部分无需改，但需新增"可用性事实读取与派生"（FND-P03/P05 修复：事实无读者不落）；改动面为四处（schema 枚举 + 模板词表 + 投影器派生读取 + 契约测试）。
  - **status**：`verified`
  - **证据或来源**：make-decision R-101/FND-D07 核实
  - **关联**：FR-STATE-003
- **PFACT-010**：M15 遥测已退役且不得重建。
  - **status**：`verified`
  - **证据或来源**：make-decision F-011
  - **关联**：第 10 节非目标

## 5. 功能需求

### 执行闭环（EXEC）

复盘判断的产出与机器闭环。会话只产出判断内容（人可理解、带证据引用），机器负责一切确定性动作（校验、合并、发布），双方职责不可互换。

- **FR-EXEC-001**：提供复盘执行闭环命令（私有内部操作 `reflect`，经既有公共行为 run 的新 action 暴露，不新增公共行为类）：输入为会话产出的判断 JSON 与任务/阶段身份；机器完成 raw 前奏校验、schema+验证器校验、教训合并、固定路径不可变发布，返回真实结果（含验证降级/失败事实）。
  - **范围边界**：含判断输入契约、机器闭环、结果返回；不含判断内容生成（属会话与技能）、不含自动调度（由工作流指令引导会话调用）。
  - **依据**：D-001、PFACT-001/007/008
  - **场景**：SCN-001、SCN-002（事后补记）
  - **验收**：AC-EXEC-001、AC-VERIFY-003
- **FR-EXEC-002**：阶段运行在注入执行器时保持现有自动调度；无执行器时不发布任何"失败"复盘记录（固定路径保持空闲），只保留真实未执行事实供页面派生 unavailable。
  - **范围边界**：仅调度语义修正；不改变阶段状态机与步骤序列。
  - **依据**：D-001/D-002、PFACT-008
  - **场景**：SCN-002
  - **验收**：AC-EXEC-002
- **FR-EXEC-003**：五份正式工作流技能与标准流程文档各增补一句阶段末复盘执行指令（阶段结束时主会话产出判断并调用执行闭环）；明确 run 与 reflect 的先后约定（run 不占固定路径；reflect 可在阶段结束后任意时刻补记，先到先得、不可覆盖）。
  - **范围边界**：仅指令文本增补；不改工作流拓扑（steps.json 不变，复盘仍为 on_stage_end 非阻断步骤）。
  - **依据**：D-001、PFACT-007
  - **场景**：SCN-001
  - **验收**：AC-EXEC-003

- **FR-EXEC-004**：执行闭环失败恢复矩阵（不可变发布 + 非阻断原则的完整展开）：

  | 情形 | 行为 | 副作用 | 页面/M16 状态 | 恢复 |
  | --- | --- | --- | --- | --- |
  | 非法判断输入（schema/验证器拒绝） | 返回真实失败原因（含 annotations） | 零副作用（先校验后落盘） | 无记录→派生 unavailable | 修正判断后重试 |
  | 同字节重复提交 | 幂等成功（返回既有发布事实） | 无新写入 | 既有记录状态 | 无需恢复 |
  | 异字节路径冲突（已有不同记录） | 明确冲突错误（不覆盖、不吞错） | 零副作用 | 既有记录状态 | 会话核对既有记录；确需修正走新阶段/新复盘语义，不覆盖 |
  | 发布成功但教训合并失败 | 记录存在并标注 degraded + 合并失败事实 | lessons 不写半成品（先暂存、发布成功才提交） | 记录 status=degraded | 重试合并（幂等键） |
  | 发布失败（I/O/校验链异常） | 真实上报失败事实 | lessons 不提交（原子边界=先暂存后提交） | 无记录→派生 unavailable | 修正后整体重试 |

  - **依据**：D-001、FND-S07、PFACT-008
  - **场景**：SCN-001 失败分支、SCN-002
  - **验收**：AC-EXEC-004

### 诚实状态（STATE）

让"没执行/没触发/真失败/成功/降级"五类事实各自可观察。

- **FR-STATE-001**：状态词汇扩展为五态并分层承载：①固定路径复盘记录（不可变发布）仅在真实判断执行后写入，其 status ∈ {ok, degraded, failed}（既有三态语义不变）；②新增"复盘可用性机器事实"承载 unavailable（阶段运行结束但无人执行）与 not_scheduled（阶段未触发），其状态枚举与记录 schema 共用同一五态词汇（v1 schema 枚举原地扩展，保持前向兼容与单一名词表）；③页面徽章与 M16 投影从"固定路径记录优先、其次可用性事实、否则 unknown"派生显示。
  - **范围边界**：枚举为兼容扩展（v1 原地扩）；既有 ok/degraded/failed 语义不变；"旧四态"表述作废——既有记录状态为三态，unavailable 此前仅存在于页面词表。
  - **依据**：D-002、PFACT-004/009
  - **场景**：SCN-002/003/005
  - **验收**：AC-STATE-001
- **FR-STATE-002**：状态转移表（条件 → 固定路径记录 → 可用性事实 → 页面徽章/M16 计数）：

  | 路径条件 | 固定路径记录 | 可用性事实（writer） | 页面徽章 | M16 判断计数 |
  | --- | --- | --- | --- | --- |
  | 判断真实执行且验证通过 | ok/degraded（reflect 闭环写） | 不写 | 记录 status | 计入 |
  | 判断真实执行但验证失败 | failed（reflect 闭环写） | 不写 | failed | 不计入（无有效判断） |
  | 阶段运行结束、无执行器且会话未补记 | 不写（路径保持空闲） | unavailable（runner 改动①落"未执行"事实） | unavailable | 不计入 |
  | preflight/身份/启动失败、中断 | 不写 | not_scheduled（runner 改动②落"未调度"事实） | not_scheduled | 不计入 |
  | 阶段从未启动（同任务后续阶段已有 outcome，本阶段三无：无记录/无事实/无 outcome） | 不写 | 不写（runner 不经过此路径，无写入方） | 投影派生 not_scheduled | 不计入 |
  | 会话事后补记（路径空闲时） | 真实记录覆盖派生态（先到先得） | 事实保留为历史 | 记录 status | 计入 |

runner 改动仅限两处：无执行器落"未执行"事实（不发布失败记录）；已运行路径的失败/中断落"未调度"事实。不动阶段序列/状态机。"从未启动"不设写入方，由投影派生规则承载（保持 runner 两处上限，G-001 不扩大）。

  **可用性事实的读者**（FND-P03 修复）：页面投影器扫描 evidence 区可用性事实目录、按事实内容的 (task_id, stage) 定位并派生徽章；M16 消费侧在本任务 T602/T603 中按混合输入契约读取。事实无读者不落——投影派生为本 spec 组成部分。

- **范围边界**：runner 两处最小改动；转移表为本 spec 规范并作为 fixture 断言依据。
- **依据**：D-002/D-008、G-001、PFACT-003
- **场景**：SCN-002/003
- **验收**：AC-STATE-002
- **FR-STATE-003**：页面最小生效面：schema 枚举扩展 + 模板状态词表补 not_scheduled（unavailable 已存在）+ 页面契约测试同步（含旧记录 fixture、新状态 fixture）；**投影器仅扩展"可用性事实读取与派生"**（扫描 evidence 区、按 (task,stage) 定位、派生徽章优先级：固定路径记录 > 可用性事实 > 从未启动派生规则 > unknown；FND-P03/P05 修复，不改布局/视图结构）；M16 Evolution 趋势区与任务视图其他字段不动。
  - **范围边界**：改动=schema 枚举 + 模板词表 + 投影器派生读取 + 契约测试四处封顶；任何额外页面增强属新需求。M16 消费适配属于 FR-M16-001 的独立窄增量，直接消费面与保护边界以 T601/T602/T603 登记为准，不扩展页面布局或 M16 data-plane。
  - **依据**：D-006、PFACT-009
  - **场景**：SCN-005
  - **验收**：AC-STATE-003

### 历史导入（IMPORT）

20 条历史教训经一次性转换正式入库，为 M16 提供早期样本。

- **FR-IMPORT-001**：提供一次性转换适配器：把离线回填包的记录/教训映射为正式契约（entry_kind 字段映射、source_refs 对象化、unknown 任务身份保留并标注"历史回放"）；转换后 20 条全量预演跑验证器；导入幂等，失败可回滚且不污染正式 lessons；该适配器为一次性动作，不成为每任务回填机制。
  - **范围边界**：仅本次 20 条；不做通用回填工具。
  - **依据**：D-003、PFACT-006
  - **场景**：SCN-004
  - **验收**：AC-IMPORT-001
- **FR-IMPORT-002**：分项目落库：WorkflowHub 任务的教训入 workflowhub 项目 lessons；PaperBuilder 任务的教训入 paperbuilder 项目（无正式项目目录则保留离线索引并显式标注归属），M16 按项目聚合不被跨项目污染。
  - **依据**：D-003、G-002
  - **场景**：SCN-004
  - **验收**：AC-IMPORT-002
- **FR-IMPORT-003**：历史证据落正式存储：会话索引文件落入正式 evidence 区域，历史记录的证据引用为文件级引用（行级细节保留在索引文件内），验证器不再因悬空引用降级。
  - **范围边界**：不拆 20 个行级独立文件（DE-003）。
  - **依据**：D-003、T-008、PFACT-006
  - **场景**：SCN-004
  - **验收**：AC-IMPORT-003
- **FR-IMPORT-004**：对 20 个历史会话补一轮人工介入提取（用户真实回复与步骤锚点）。**覆盖完整性要求**：20/20 个会话各产出一份提取凭证（{会话身份, 提取时间, 覆盖的会话区间, 结果}）；结果为"已检查且无介入"时必须附会话锚点证据（区间起止 + 检查方法）；提取不可见/失败时单独标记低置信度与原因，不得静默跳过；介入字段以低置信度标注写入。提取为 LLM 分析，样本深度不足时转 DE-004 校正。
  - **依据**：D-003、T-009、PFACT-006
  - **场景**：SCN-004
  - **验收**：AC-IMPORT-004
- **FR-IMPORT-005**：严重度校准：occurrence_count≥2 或用户明确确认 → high；单次观察 → medium；纯提示/体验 → low；导入时逐条复核并保留校准理由。
  - **依据**：D-003、FND-D09
  - **场景**：SCN-004
  - **验收**：AC-IMPORT-005

### 信息质量（QUALITY）

复盘内容从"自由文本"升级为"结构化判断 + 机器事实投影"。

- **FR-QUALITY-001**：复盘技能 SKILL.md 重写：按六类问题（什么帮了忙/什么该提升/什么阻塞了/为什么需要人工介入/什么该简化/什么现在就能简化）引导收集，输出为结构化区块；机器链描述与实际一致（消费边由验证器自动派生，技能不再要求重复调用）；判断内容必须携带证据引用与置信度，未知/不适用显式记录，禁止静默空缺。
  - **依据**：D-004、FND-D08/D11、PFACT-007
  - **场景**：SCN-001
  - **验收**：AC-QUALITY-001
- **FR-QUALITY-002**：新增复盘记录 schema v2（独立文件，v1 保留只读兼容旧记录）：事实投影三件套——status_matrix（code/verify/physical_close/acceptance/release 五栏状态，每栏绑定证据引用，禁止推导质量结论）、identity（任务/worktree/分支/attempt/snapshot/材料 revision 快照）、source_completeness（会话压缩/截断/可见范围/未知原因）。机器可验部分由前奏填充，其余由会话填写并经验证器检查引用存在性；operational_tail 不在本期（DE-002）。
  - **范围边界**：三件套封顶；v2 不引入遥测字段（F-011）。
  - **依据**：D-004/D-005、T-007
  - **场景**：SCN-001/006
  - **验收**：AC-QUALITY-002
- **FR-QUALITY-003**：验证器增加完整性规则：六类区块与三件套缺失/未知时必须显式标注（含 source_completeness 标记），引用悬空沿用既有降级规则；移除候选判定沿用双硬信号门槛（零消费 + 被拒或同步骤两次介入）。
  - **依据**：D-004、FND-D11
  - **场景**：SCN-001
  - **验收**：AC-QUALITY-003

### M16 消费改进（M16）

- **FR-M16-001**：M16 消费侧（候选池聚合、质量税归因、趋势区投影）识别 v1 旧记录、v1 新状态、v2 记录与历史回放并存。**边界澄清**：Evolution 趋势区的布局与交互不变（SCN-005 所指"行为不变"仅指视觉/交互）；消费数据语义按下列混合输入期望改变：

  | 输入 | 候选池计数 | 分层 | 质量税归因 | 趋势区投影 |
  | --- | --- | --- | --- | --- |
  | v1 旧记录（ok/degraded/failed） | 计入 | 既有两档规则 | 既有 30 天归因 | 既有 |
  | v1 新状态/可用性事实（unavailable/not_scheduled） | 不计入（无判断内容） | 不分层 | 不进分母 | 不产生趋势数据点 |
  | v2 记录 | 计入（判断区块） | 既有两档规则 | 既有归因 + 三件套可供归因 | 既有 |
  | 历史回放记录（historical_replay=true） | 计入但仅参考 | 强制 reference_only（不进 action_suggested） | 不进分母（非真实执行样本） | 标注历史来源 |
  | malformed 输入 | 跳过并记录错误事实 | — | — | — |

实施时点：M16 任务完成开发并 merge 进当前分支后，在本分支修改（不在 M16 任务侧加需求）。

- **范围边界**：仅消费侧识别与过滤；不改 M16 的候选池判定语义、两档分层规则或趋势区布局。
- **依据**：D-005、T-015、PFACT-005
- **场景**：SCN-006
- **验收**：AC-M16-001

## 6. 模块划分

### 复盘执行闭环（会话侧 + 机器侧）

- **负责什么**：会话产出结构化判断；机器校验/合并/发布。
- **对外提供什么**：固定路径的权威复盘记录与可观察的真实状态。
- **依赖谁**：既有 raw 前奏、验证器、教训合并、不可变发布机制。
- **测试边界**：判断 JSON 契约 → 机器闭环 → 发布结果可独立验收（AC-EXEC-001）。

### 状态与投影（schema/验证器/页面）

- **负责什么**：五态语义、状态转移、页面如实显示。
- **对外提供什么**：任务视图徽章与可机读状态。
- **依赖谁**：既有投影器与模板。
- **测试边界**：四处改动 + 契约 fixture（AC-STATE-001~003）。

### 一次性历史导入

- **负责什么**：离线包 → 正式契约的转换与落库。
- **对外提供什么**：分项目的正式 lessons、正式证据文件、"历史回放"身份标注。
- **依赖谁**：验证器（全量预演）、lessons 合并规则。
- **测试边界**：20/20 落库断言 + 幂等/回滚（AC-IMPORT-001~005）。

### M16 消费侧

- **负责什么**：v1/v2 与新状态的识别、过滤与分层。
- **对外提供什么**：候选池/质量税/趋势区对复盘产物的正确消费。
- **依赖谁**：M16 已合入 main 的组件（合并后修改）。
- **测试边界**：M16 契约测试 + 新 fixture（AC-M16-001）。

## 7. 关键实体

- **复盘记录（v1/v2）**：
  - **定义**：一个阶段一次的判断层记录（judgment≠fact）。
  - **字段和约束**：v1 既有字段 + 状态五态；v2 增 status_matrix/identity/source_completeness 三件套；判断区块带证据引用与置信度；来源引用必须为对象形态 {task_id, raw_entry_id}。
  - **关系**：被 M16 候选池/质量税/趋势区消费；被页面徽章投影。
- **历史回放记录**：
  - **定义**：一次性导入的历史判断，带"历史回放"身份标注，非当前任务事实。
  - **字段和约束**：保留原任务身份（含 unknown 前缀），证据引用为正式存储的文件级引用；进入 M16 仅供参考档。
  - **关系**：进入对应项目 lessons；不回写当前任务事实通道。
- **教训条目（lessons）**：
  - **定义**：阶段级经验累积（raw_observation/merged_lesson）。
  - **字段和约束**：entry_kind 严格枚举；合并要求 source.task_id 匹配。
  - **关系**：复盘判断的合并产物；M16 消费源之一。
- **复盘可用性事实**：
  - **定义**：runner 在"无人执行/未触发"路径落下的轻量机器事实（不在固定路径，不占不可变位置）。
  - **字段和约束**：stage、状态（unavailable|not_scheduled）、原因码（executor_absent/preflight_failed/identity_failed/startup_failed/interrupted/not_started）、时间戳、任务身份。
  - **关系**：页面与 M16 投影的派生源；会话补记后保留为历史事实。

### 7.1 判断输入与 v2 字段级契约（冻结）

**判断输入 JSON（reflect 闭环输入，会话产出）**：

| 字段 | 类型 | 必填 | 语义 |
| --- | --- | --- | --- |
| stage_status | enum: completed\|failed | 是 | 阶段实际结局（与会话观察一致，机器与 stage outcome 对账） |
| judgments[] | array | 是（可为空数组但须显式） | 每条：classification（keep/optimize/simplify/merge/remove_candidate/add/needs_evidence）、title、detail、severity（high/medium/low）、evidence_refs[]（safe_ref 形态）、confidence（high/medium/low）、source_refs[]（{task_id, raw_entry_id} 对象）、next_review_trigger |
| interventions[] | array | 是（可为空数组但须显式） | 每条：step_ref、reason、confidence；无介入时为空数组并在六类区块显式说明 |
| lessons_added[] | array | 是（可为空数组但须显式） | 本阶段新增教训摘要 |
| 六类区块 | object | 是 | what_helped/what_to_improve/blockers/intervention_reasons/what_to_simplify/simplifiable_now；每块 {state: observed\|none_observed\|unknown, unknown_reason?, items:[{summary, evidence_refs, confidence}]} |
| 事实投影（v2 记录） | object | v2 必填 | 见下三件套 |

**v2 事实投影三件套**：

| 字段 | 填充方 | 语义 |
| --- | --- | --- |
| status_matrix.{code,verify,physical_close,acceptance,release} | 机器前奏填充、会话可校正 | 每栏 {state: completed\|failed\|not_applicable\|unknown, evidence_refs[]}；禁止推导质量结论 |
| identity | 机器前奏填充 | {task_id, worktree, branch, attempt, snapshot_tree, material_revision} 快照 |
| source_completeness | 会话填写 | {compaction: true\|false\|unknown, truncation: true\|false\|unknown, visible_scope: 字符串\|unknown, unknown_reasons[]} |

**验证器输出**：{status: ok\|degraded\|failed, annotations[]: {code, reason, ref}}；缺失/未知→显式 annotation；悬空引用→degraded（既有规则）；移除候选→双硬信号门槛（既有规则）。

**责任边界**：identity 与 status_matrix 的机器可验部分由前奏填充；六类区块与 judgments 由会话产出；验证器只校验不改写；机器不生成判断内容。

### 7.2 历史导入字段级映射契约（冻结）

| 离线包字段 | 正式契约字段 | 映射规则 |
| --- | --- | --- |
| record_kind | entry_kind | 逐值恒等改名：raw_observation→raw_observation、merged_lesson→merged_lesson |
| source_refs（字符串数组） | source_refs（对象数组） | 每个字符串 → {task_id: 原任务身份, raw_entry_id: 原行标识} |
| task_id（含 unknown-&lt;thread&gt;） | task_id | 原样保留；另加标注字段 historical_replay: true（记录与教训均带） |
| evidence_refs（含 #fragment） | evidence_refs | 去掉 fragment，指向落库后的索引文件（文件级引用）；行级细节留在索引文件内 |
| severity（全部 high） | severity + severity_reason | 按 FR-IMPORT-005 规则校准并留理由 |
| interventions（全零） | interventions + extraction_evidence | 补录结果；每会话一份提取凭证（见 FR-IMPORT-004） |

**20 条项目归属表**（依 transcript-index 实测）：workflowhub 10 条（unknown-01a05346…、m15-retirement、make-decision-requirement-convergence-20260828、executable-ui-fullstack-design-contract-20260826、governance-runtime-execution-chain-20260827、workflowhub-trust-recovery、workflowhub-standard-flow-dogfood-20260820、WH-context-map-snapshot-repair、requirements-completeness-audit-20260804、workflow-quality-recording-simplification）；paperbuilder 10 条（paperbuilder-v2-t07-health-isolation、f17-risk-control-popup、PB-F16、frontend-ui-workflowhub、f11-f12a-ai-strategy-edit-loop、f12b-diff-preview-large-yaml ×2、01a0125d-33a9-…、PB-V2-PRD-Git-delivery-post-T05-roadmap、paperbuilder-v2-t01-strategy-snapshot）。

**证据落库**：索引文件落项目级正式 evidence 区（`quality/evidence/historical-replay-20260901/transcript-index.jsonl`，文件级引用）；**幂等键**：（项目, 阶段, 原行标识）+ 内容字节哈希；**回滚边界**：按条目原子——单条转换/校验失败→该条不落库并报告，已成功条目保留，正式 lessons 不被半成品污染。

## 8. 数据和生命周期

- **数据粒度**：一条复盘记录=一个任务的一个阶段一次复盘；一条教训=一个可归并的经验单元。
- **数据时效**：固定路径不可变（先到先得、不可覆盖）；事后补记只在路径空闲时可行。
- **缺失或迟到**：阶段结束未复盘 → 页面显示 unavailable/not_scheduled，可事后补记；不静默丢事实。
- **预览与正式**：历史导入先全量预演（验证器）再正式落库；用户看到的是落库后的正式结果。
- **当前与历史**：历史记录带"历史回放"标注永久保留；v1 旧记录只读兼容。
- **归属与清理**：教训按项目归属（workflowhub/paperbuilder）；历史证据文件归正式 evidence 区；转换适配器为一次性产物（使用后归档，删除条件=本次导入完成且验收通过）。

## 9. 兼容性预留

- **既有消费方**：v1 旧记录可读、页面与 M16 对旧记录行为不变；M16 契约测试保绿。
- **命名预留**：复盘执行闭环内部操作名 `reflect` 冻结并登记 move-map；公共行为不新增类（沿用七类）。
- **容器预留**：v2 独立 schema 文件，v1/v2 并存；三件套之外字段（operational_tail）留给后续版本。
- **状态预留**：五态枚举不堵死后续新状态；页面词表与测试按枚举同步。
- **扩展边界**：本期不承诺通用回填机制、行级历史证据、operational_tail、自动调度器。

## 10. 明确不做与默认必须成立

### 明确不做

- 不重建 M15 遥测（token/耗时/provider 采集）——D-008/F-011，永久。
- 不自动修改 skill/step（判断→执行永远过人）——D-008，永久。
- 不改五阶段主骨架语义（阶段序列/状态机不动）；runner 改动仅限两处（无执行器不发布失败记录；未触发路径落未调度事实）——D-008/G-001，本期边界。
- 20 条历史导入是一次性动作，不做每任务回填机制——D-003，本期边界。
- 不主动检视/修复 M16 组件问题；M16 消费改动仅限本任务必要面且在其 merge 后进行——T-011/T-013/T-015，本期边界。
- 不新增公共运行时行为类（七类不变）——治理边界，永久。
- 不做行级历史证据文件（DE-003）、operational_tail（DE-002）、真实业务任务端到端验收（DE-001）。

### 默认必须成立

- 判断≠事实：判断永不写机器事实通道；事实投影仅记录机器可验状态（FR-QUALITY-002，AC-QUALITY-002）。
- 复盘失败/不可用不阻断阶段或 close（FR-EXEC-001/002，AC-VERIFY-004）。
- 一切质量事实如实保留（含不可用/失败），不伪造通过（全部 AC 的证据类型约束）。
- 宪法 F9 可证伪：真机验证场景在实际为假时必须真报失败；F10 自动化按真实收益，不为 CI 堆基建（AC-VERIFY-003）。

## 11. 验收标准

- [ ] **AC-EXEC-001**：会话产出的合法判断 JSON 经执行闭环被真实发布（固定路径记录存在、字节与内容寻址一致、教训合并完成）；非法判断（缺证据引用/越界字段）被拒绝并返回真实失败原因。
  - **需求**：FR-EXEC-001
  - **验证方法**：构造场景经正式入口执行（最小真机验证）
  - **通过条件**：合法输入发布成功；非法输入真实拒绝且不留半成品
  - **失败条件**：合法输入被拒、非法输入被接受、发布字节与内容寻址不符、错误被吞
  - **证据类型**：`evidence`
- [ ] **AC-EXEC-004**：失败恢复矩阵逐行成立：非法输入可修正重试且零副作用；同字节重复幂等；异字节冲突明确报错不覆盖；发布成功+合并失败时记录标注 degraded 且 lessons 无半成品；发布失败时 lessons 不提交。
  - **需求**：FR-EXEC-004
  - **验证方法**：契约测试（正/负例 fixture）+ 最小真机验证失败路径
  - **通过条件**：五行矩阵行为与表一致
  - **失败条件**：任一行行为偏离（半成品、吞错、覆盖、不可重试）
  - **证据类型**：`test`
- [ ] **AC-EXEC-002**：无执行器的阶段运行结束时不发布任何复盘记录，固定路径保持空闲；页面派生 unavailable；事后补记可成功写入同一路径。
  - **需求**：FR-EXEC-002
  - **验证方法**：契约测试 + 最小真机验证（未执行路径）
  - **通过条件**：无假失败记录；补记不被占用冲突
  - **失败条件**：出现 status=failed 且 executor-not-provided 的记录，或补记报路径冲突
  - **证据类型**：`test`
- [ ] **AC-EXEC-003**：五份工作流技能与标准流程文档均含阶段末复盘执行指令，且指令与实际命令行为一致（无漂移）。
  - **需求**：FR-EXEC-003
  - **验证方法**：文档检查 + 指令与命令行为对照
  - **通过条件**：五处指令存在且语义与实现一致
  - **失败条件**：任一缺指令或指令描述与实现不符
  - **证据类型**：`evidence`
- [ ] **AC-STATE-001**：schema 接受五态词汇；既有三态（ok/degraded/failed）旧记录不受影响。
  - **需求**：FR-STATE-001
  - **验证方法**：契约测试（新旧 fixture）
  - **通过条件**：五态均通过校验；旧记录 fixture 全绿
  - **失败条件**：新状态校验失败或旧记录回归失败
  - **证据类型**：`test`
- [ ] **AC-STATE-002**：状态转移表每个路径（成功/失败/未执行/未调度/事后补记）产生预期状态与事实来源；runner 改动不超过两处且不动阶段状态机。
  - **需求**：FR-STATE-002
  - **验证方法**：契约测试按转移表断言 + 改动面审查
  - **通过条件**：逐路径状态符合转移表；改动面未超限
  - **失败条件**：任一路径状态与表不符，或 runner 出现第三处改动
  - **证据类型**：`test`
- [ ] **AC-STATE-003**：页面徽章如实显示五态；M16 趋势区与任务视图其他字段回归不变。
  - **需求**：FR-STATE-003
  - **验证方法**：页面契约测试 + 旧记录 fixture
  - **通过条件**：五态渲染正确；既有断言全绿
  - **失败条件**：新状态显示为 unknown 兜底或旧视图回归
  - **证据类型**：`test`
- [ ] **AC-IMPORT-001**：20/20 条历史教训经转换适配器落库到正式 lessons；转换后记录通过验证器全量预演；重复执行导入幂等；人为制造失败时正式 lessons 不被污染。
  - **需求**：FR-IMPORT-001
  - **验证方法**：最小真机验证（导入场景）+ 幂等/回滚用例
  - **通过条件**：20/20 落库且校验通过；幂等与回滚成立
  - **失败条件**：落库条数不足、校验失败仍落库、失败污染正式数据
  - **证据类型**：`evidence`
- [ ] **AC-IMPORT-002**：落库后 WorkflowHub 与 PaperBuilder 教训分项目归属，无跨项目混入。
  - **需求**：FR-IMPORT-002
  - **验证方法**：落库结果检查
  - **通过条件**：每条教训的项目归属与其来源任务一致
  - **失败条件**：任一跨项目混入或归属缺失
  - **证据类型**：`evidence`
- [ ] **AC-IMPORT-003**：历史记录的证据引用全部指向正式存储内的真实文件（验证器不再降级）。
  - **需求**：FR-IMPORT-003
  - **验证方法**：验证器全量跑
  - **通过条件**：无悬空引用导致的降级
  - **失败条件**：任一引用悬空
  - **证据类型**：`test`
- [ ] **AC-IMPORT-004**：20/20 个会话均有提取凭证；介入字段显式（可为零但须附"已检查且无介入"的会话锚点证据）；提取失败/不可见的会话单独标记低置信度与原因；不存在静默跳过。
  - **需求**：FR-IMPORT-004
  - **验证方法**：提取凭证清单检查（20/20）+ 抽样核对锚点
  - **通过条件**：凭证覆盖 20/20；零介入条目有锚点证据；失败条目有显式标记
  - **失败条件**：任一会话无凭证、零介入无证据、或置信度伪造为高
  - **证据类型**：`evidence`
- [ ] **AC-IMPORT-005**：20 条记录的严重度分布不再为 18 high/2 medium/0 low 的无校准状态；每条严重度有据可查（出现次数或用户确认或单次/体验规则）。
  - **需求**：FR-IMPORT-005
  - **验证方法**：落库结果检查 + 校准理由留痕
  - **通过条件**：每条严重度符合规则并附理由
  - **失败条件**：无规则依据的 high 仍存在
  - **证据类型**：`evidence`
- [ ] **AC-QUALITY-001**：重写后技能按六类问题输出结构化判断区块；机器链描述与实际行为一致（消费边由验证器派生）；未知/不适用显式标注。
  - **需求**：FR-QUALITY-001
  - **验证方法**：文档检查 + 最小真机验证中会话产出的判断 JSON 被闭环接受
  - **通过条件**：判断 JSON 符合契约且被机器接受；技能描述与实现一致
  - **失败条件**：会话产出被闭环拒绝（契约不自洽）或描述漂移残留
  - **证据类型**：`evidence`
- [ ] **AC-QUALITY-002**：v2 记录包含三件套；五栏状态每栏有证据引用或显式 unknown；身份快照与实际一致；v1 旧记录不受影响。
  - **需求**：FR-QUALITY-002
  - **验证方法**：契约测试（v2 fixture）+ 兼容性 fixture
  - **通过条件**：三件套完整且引用可验；v1 回归绿
  - **失败条件**：三件套缺失/引用悬空未被标出，或 v1 回归失败
  - **证据类型**：`test`
- [ ] **AC-QUALITY-003**：六类区块或三件套缺失/未知时验证器产生显式标注（非静默通过）；悬空引用沿用降级；移除候选双硬信号门槛不变。
  - **需求**：FR-QUALITY-003
  - **验证方法**：契约测试（负例 fixture）
  - **通过条件**：缺失→显式标注；悬空→降级；移除门槛行为不变
  - **失败条件**：缺失静默通过或门槛行为漂移
  - **证据类型**：`test`
- [ ] **AC-M16-001**：M16 候选池/质量税/趋势区在 v1 旧记录、v1 新状态、v2 记录混合输入下行为正确（新状态不计入判断计数；历史回放进仅供参考档）；M16 既有契约测试全绿。
  - **需求**：FR-M16-001
  - **验证方法**：M16 既有契约测试 + 本任务 mixed-input fixture（M16 已合入；在 T602/T603 执行）
  - **通过条件**：混合输入消费正确；M16 测试全绿
  - **失败条件**：新状态被误计入、历史回放被当作当前任务事实、M16 回归
  - **证据类型**：`test`
- [ ] **AC-VERIFY-001**：本任务全部确定性契约测试绿（含新旧记录兼容 fixture、新状态 fixture、M16 契约）。
  - **需求**：D-007
  - **验证方法**：测试运行
  - **通过条件**：全绿
  - **失败条件**：任一红或被静默跳过
  - **证据类型**：`test`
- [ ] **AC-VERIFY-002**：独立审查（wh-review）完成且 findings 全部处置（fixed/rejected_invalid/accepted_risk/needs_human 如实标注）。
  - **需求**：D-007
  - **验证方法**：审查结果 + 处置记录
  - **通过条件**：审查返回 available 且 findings 有处置
  - **失败条件**：审查缺失却宣称完成，或 findings 未处置
  - **证据类型**：`evidence`
- [ ] **AC-VERIFY-003**：最小真机验证跑通全链：raw 前奏 → 会话产出判断 JSON（按重写后技能契约）→ 校验 → 合并 → 发布 → 页面显示 → M16 消费；覆盖成功、失败、未调度、验证失败四类路径；验证在实际为假时真报失败。
  - **需求**：D-007、T-014、FND-DD04
  - **验证方法**：构造场景经正式入口执行
  - **通过条件**：四类路径结果与预期一致；失败路径真实报失败
  - **失败条件**：任一路径结果与预期不符，或验证假绿
  - **证据类型**：`evidence`
- [ ] **AC-VERIFY-004**：复盘失败/不可用全程不阻断阶段推进与 close。
  - **需求**：D-001/D-002
  - **验证方法**：最小真机验证中的失败/未调度路径
  - **通过条件**：阶段与 close 正常推进，复盘状态如实记录
  - **失败条件**：复盘问题导致阻断
  - **证据类型**：`evidence`

## 12. 风险、未决与交接

- **RISK-001**：复盘依赖主会话自觉执行（LLM 合规依赖）。
  - **受影响 ID**：FR-EXEC-001/003、AC-VERIFY-003
  - **触发条件**：会话未读技能或未调用执行闭环
  - **后果**：静默不复盘（但页面显示 unavailable，不再伪装失败）
  - **缓解或 STOP**：状态可见性兜底 + AC-VERIFY-003 真机验证 + 用户抽查（DE-001）
  - **处理 Stage**：`build-code`
  - **验证**：真机验证记录与页面状态观察
- **RISK-002**：M16 已合入当前基线，但其独立质量收口仍未完成（T010/AC-GOV-002=`incomplete/inconclusive`）；FR-M16-001 的消费适配不能被误写成 M16 全质量通过。
  - **受影响 ID**：FR-M16-001、AC-M16-001
  - **触发条件**：T602/T603 试图以 merge、既有 focused tests 或 archive status 代替 mixed-input 证据，或需要改 M16 判定语义/趋势布局
  - **后果**：本任务边界漂移，或把不完整质量事实伪装成通过
  - **缓解或 STOP**：T601 登记 `eeb9dfa12 → cdafb4446 → fff255c78` provenance 与 direct consumer surface；T602/T603 仅做必要输入适配；遇到语义/第二事实源扩张则 STOP，并保持 incomplete 如实记录
  - **处理 Stage**：`build-code`
  - **验证**：T602 mixed-input 五行 oracle + T603 回归；M16 T010/AC-GOV-002 独立质量状态继续保留
- **RISK-003**：历史导入记录带"历史回放"身份，可能被误读为当前任务事实。
  - **受影响 ID**：FR-IMPORT-001、AC-M16-001
  - **触发条件**：M16 或人读取历史记录时忽略标注
  - **后果**：候选池把历史判断当强信号
  - **缓解或 STOP**：导入时显式标注 + M16 仅供参考档 + AC-IMPORT/AC-M16 断言
  - **处理 Stage**：`build-code`
  - **验证**：AC-M16-001 混合输入用例
- **RISK-004**：与 M16 共享 schema/投影器，改动可能破坏既有视图。
  - **受影响 ID**：FR-STATE-003、FR-M16-001
  - **触发条件**：枚举扩展或 v2 引入导致投影器回归
  - **后果**：页面或趋势区显示错误
  - **缓解或 STOP**：契约测试保绿 + 兼容性 fixture（AC-STATE-003/AC-QUALITY-002）
  - **处理 Stage**：`build-code`
  - **验证**：契约测试与页面 fixture
- **OPEN-01**（已关闭，T601，2026-09-01）：M16 消费侧具体文件面已在 merge 后按最终代码登记。provenance=`eeb9dfa12 → cdafb4446（M16 merge）→ fff255c78（归档材料）`；当前任务分支与 main 同指 `fff255c78`。direct consumer surface=`runtime/evidence/workflow-evolution.mjs`、`runtime/schemas/workflow-evolution.v1.json`、`tools/cli/build-reflection-page.mjs`、`tools/cli/build-reflection-page-template.html`、`tools/cli/derive-consumption-edges.mjs`，以及相应 candidates/page/governance/e2e contracts。T602/T603 已承接并完成本任务要求的 stage-reflection.v2、availability fact、historical replay mixed-input 适配；M16 T010/AC-GOV-002 仍 `incomplete/inconclusive`，不因本关闭事实改变。
- **Post-build-plan factual addendum（2026-09-01）**：T601 只完成 merge provenance/消费面核验，不代表 FR-M16-001 或 M16 全质量通过；截至该时点 T602/T603 尚未执行，FR-M16-001 五行 mixed-input 期望与其 malformed diagnostic 要求保持不变。当前执行状态以文末 2026-09-03 更正为准。`npm test` 与 `npm run check` 的基线尝试因本地依赖缺失分别 exit=127，不产生通过证据。
- **OPEN-02**（已关闭——FND-S02 处置）：判断 JSON 契约的字段名与必填集已在本 spec §7.1 冻结（字段级表+责任边界+验证器输出结构）；build-plan 只剩 schema JSON 语法实现，无语义待定项。
- **DE-001**：真实业务任务端到端复盘 + 用户抽查复盘质量（下一真实任务触发）。
- **DE-002**：operational_tail 字段（fsck/残留进程/清理状态）。
- **DE-003**：严格行级历史证据文件（如需行级引用再补）。
- **DE-004**：历史介入提取深度校正（M16 数据验证时若样本不足）。

## 13. 业务影响与回归范围

### 阶段运行与复盘发布

- **既有行为**：阶段结束时无条件调度复盘，无执行器 → 恒定发布 failed 记录并占用固定路径。
- **本需求影响**：无执行器不再发布假失败（路径保持空闲）；会话可经执行闭环真实发布；状态五态如实。
- **回归路径**：既有注入执行器的 e2e 路径（测试注入）行为不变；固定路径不可变语义不变。
- **验收**：AC-EXEC-002、AC-VERIFY-004

### monitor 页面

- **既有行为**：任务视图徽章显示 ok/degraded/failed/unavailable（unknown 兜底）；M16 趋势区三区块。
- **本需求影响**：新增 not_scheduled 词表与显示；其余不动。
- **回归路径**：页面契约测试全量；旧记录 fixture。
- **验收**：AC-STATE-003

### M16 候选池/质量税/趋势区

- **既有行为**：消费 v1 复盘记录（判断计数、两档分层、30 天归因）。
- **本需求影响**：识别 v1 新状态/v2/历史回放并存并按规则过滤分层（M16 已合入；本任务在 T601 核验后实施；不改既有候选身份、阈值、锁/CAS、生命周期与趋势区布局）。现行 M16 消费链尚只读取 stage-reflection.v1；v2、availability fact、historical replay 与 malformed diagnostic 的混合输入适配由本任务 T602/T603 实现，若缺少前置输入契约则按 STOP，不静默当作空数据。
- **回归路径**：M16 契约测试全量 + 混合输入 fixture。
- **验收**：AC-M16-001

### 项目 lessons 数据

- **既有行为**：仅真实任务复盘合并产生（当前为零）。
- **本需求影响**：一次性获得 20 条历史教训（分项目、历史回放标注）。
- **回归路径**：lessons 读取契约（entry_kind 严格枚举）不受影响；导入幂等。
- **验收**：AC-IMPORT-001~005

- **可能受冲击的业务规则**：判断≠事实（D30）；复盘不阻断推进；不可变发布先到先得；七类公共行为不增。
- **明确无影响**：工作流拓扑（steps.json 不变）；task kernel 事实通道；M15 已退役遥测；其他四份当前材料机制。

## 14. UI 合同事实（build-spec 步骤 7-9，runtime 合同函数真实输出）

- **ui-project-init（legacy）**：status=`not_ready`（如实：项目级 Design.md/Experience.md 缺失 → DESIGN-SOURCE-PATH/DESIGN-REVISION/EXPERIENCE-SOURCE/EXPERIENCE-REVISION 四个 MISSING，non-gating）；legacy 盘点：技术栈=静态 HTML 模板+Node 投影器+data.js 注入；路由=monitor 单页；CSS 副作用=模板内联 state-* 徽章类；数据入口=**WH_MONITOR_DATA**；组件候选=stage 卡片/状态徽章/ref 面板/Evolution 趋势区块；测试能力=页面契约测试；耦合风险=与 M16 共享 schema/投影器；最小缩减建议=仅词表级改动。scope=monitor 任务视图阶段卡复盘状态徽章；fixture=页面契约测试 fixture（旧记录+新状态）；preview=N/A（契约测试+人工查看覆盖）；human_confirmation=acknowledged（decision-log T-006 仅最小生效面）。
- **design-source-readiness**：binding_state=`not_bindable`（DESIGN-SOURCE-MISSING + SCREEN-READ-MAP-EMPTY，non-gating）；无 Screen Read Map（无 Design.md）。
- **plan-design-review（设计回路）**：buildShortUiDesignPrompt 已产出（页面/区域=monitor 任务视图阶段卡复盘状态徽章；交互=查看阶段复盘状态；状态与可见 label=ok/degraded/failed/unavailable/not_scheduled）；validateUiDesignLoopFact 校验通过：state=`external_design_not_returned`（理由=词表级改动无视觉设计需求、未发起外部设计；preserves_current_contract=true；可见动作=重新生成设计提示词/继续并记录风险；continuation_allowed=false，non-gating）。
- **canonical quality/facts 发布**：DSH 手动模式无认证链，以上事实落于本节（spec.md 为当前材料），如实记录。

## 15. 简洁与方向自查（build-spec 步骤 5-6，inline lens）

- **simplicity-guard（四阶梯）**：执行闭环=P2 复用改造（复用既有 runStageEndReflection 批处理/验证器/不可变发布，不重写）；状态枚举=P2 扩展现有 schema；转换适配器=P3 新建但为一次性产物（用后归档，删除条件已写）；页面=P1/P2 复用模板词表（unavailable 已存在）；v2 schema=P3 新建独立文件（v1 冻结语义所需）；M16 消费=P2 修改既有组件（merge 后）；真机验证=P1 复用既有 E2E 模式。未发现可删除项；无"以后可能需要"的占位。
- **plan-ceo-review（方向透镜）**：问题与证据（PFACT-001~010）与假设分离；前提"复盘由主会话执行"的失败模式=RISK-001 已缓解（可见性兜底+真机验证）；最窄可行范围与用户拍板一致（v2 三件套/历史导入均为用户决策 T-003/T-007）；替代方案与取舍已在 decision-log 记录（宿主注入/纯文档/replay-only 等被拒绝）；时机=M16 消费真实数据前；无方向级异议。

## 16. 独立审查事实与处置（build-spec 步骤 11-12）

- **审查事实**：wh-review build-spec（review_track=null）——status=**available**，outcome=completed；3 家 provider 返回（kimi/coding 241s / antigravity-flash 55s / codex-luna 201s）；material_id=00d4ee4fff2c0edc1ea1061eaedb2d0249e8d4e7db7bc1feb83b5c09ebefe39e；runtime_id=7489ea52-1e66-45e0-84da-4329713ed483；findings 共 7 条（全部 major；antigravity 无 findings 为有效空结果）。材料含完整 decision-log 与 spec 原文（修复上轮"摘要不可审"问题）。
- **处置**：

| finding_id | 内容 | status | 处置 |
| --- | --- | --- | --- |
| FND-S01（kimi） | 状态模型自相矛盾：unavailable/not_scheduled 是记录状态还是页面派生态未定义 | **fixed** | FR-STATE-001/002 重写：三层承载（固定路径记录三态/可用性事实两态/投影派生）+ 带 writer 列的状态转移表 |
| FND-S02（codex） | 判断 JSON 与 v2 字段级契约被延期到 build-plan（OPEN-02） | **fixed** | §7.1 字段级契约冻结（输入字段表/三件套/验证器输出/责任边界）；OPEN-02 关闭 |
| FND-S03（codex） | 同 S01 + "旧四态"表述错误（v1 记录实为三态） | **fixed** | 并入 S01 修正；FR-STATE-001 明确"旧四态"作废 |
| FND-S04（codex） | 历史导入缺字段级映射表/归属表/幂等键/回滚边界 | **fixed** | §7.2 映射契约冻结（逐值映射+20 条归属表+幂等键+条目级原子回滚） |
| FND-S05（codex） | AC-IMPORT-004 允许跳过介入提取仍以"显式为零"通过 | **fixed** | FR-IMPORT-004/AC-IMPORT-004 加覆盖完整性（20/20 提取凭证+零介入锚点证据+失败显式标记） |
| FND-S06（codex） | FR-M16-001 与 SCN-005"趋势区行为不变"矛盾；混合输入期望未冻结 | **fixed** | FR-M16-001 边界澄清（布局交互不变/消费语义改变）+ 混合输入期望表（含 malformed） |
| FND-S07（codex） | 失败恢复不完整（重试/幂等/冲突/原子回滚未定义） | **fixed** | 新增 FR-EXEC-004 失败恢复矩阵 + AC-EXEC-004 |

- 无 rejected/needs_human：7 条全部为 spec 级修补，不涉及方向变更（不回 make-decision）。

## 17. 阶段收口校验（build-spec 步骤 13，2026-09-01）

- 手动 spec-analyze 口径七项检查（官方 record-spec-analyze 因 DSH 无认证链不可用，如实保留；runtime 认证的 stage outcome 未产生）：
  1. R-001~R-009 → D-001~D-008 → FR/AC 映射全表无遗漏（§来源映射 + 机器核对 8/8 决策均有承接）✓
  2. 原始需求/用户流程/页面范围/数据状态/成功失败边界/非目标/延期在 spec 中一致表示（§1-3、§5、§10-12、§16）✓
  3. 无矛盾/漂移/范围吞并：7 条审查 findings 全部修复（含状态模型矛盾、契约缺失、导入映射缺失）；FR-EXEC-004 为 D-001 语义细化（来源已登记，非新方向）✓
  4. AC 均可观察且带验证方法/通过条件/失败条件/证据类型（16 条 AC）✓
  5. DEFER/OPEN 交接：DE-001~004 有触发与关闭条件；OPEN-01 的具体消费文件面已由 T601 事实闭合，T602/T603 已完成消费适配；OPEN-02 已关闭 ✓
  6. 证据 vs 推断：PFACT-001~010 全部 verified 并绑来源；无推断冒充事实 ✓
  7. 发现项已在本阶段本地修复后再声明完成：无遗留语义缺口 ✓
- 结论：build-spec 语义覆盖通过（手动口径）；官方认证口径 unavailable，如实保留。
- 同一会话记录事实：DSH 无 codex 会话绑定，session-event start/finish 记录全程不可用（已在 make-decision 首次记录，不再逐条补假数据）。

## 当前执行状态更正（2026-09-03）

- 本 spec 中“ T602/T603 尚未执行、现行消费链尚未实现 mixed-input 适配”等文字属于 build-plan 时的历史状态；当前任务卡已记录 T602/T603 完成，当前分支的消费适配与 mixed-input 五行契约已落地，M16 archive 未修改。`AC-M16-001` 仍不因该局部事实自动变为完整 release acceptance，因为 M16 独立 T010/AC-GOV-002 仍 `incomplete/inconclusive`。
- 当前实现已完成局部代码修复并通过聚焦测试，但正式 AC 勾选仍保持未勾选：P7 浏览器仅 smoke，canonical dsh-code-review/session-event 缺失，且官方 task store 尚未绑定当前快照的 canonical review/test facts。保持未勾选是如实状态，不是遗漏。
- 因此本 spec 支持继续收口，不支持现在宣称“任务完成”或 close；需先完成正确 session binding、canonical review/outcome 和官方质量事实绑定，再重新检查 release/close。
