# 详细计划与执行交接简化：当前决策 v3（用户已确认）

- task_id：`workflowhub-execution-simplification-20260907`；stage：`make-decision`；decision_status：`confirmed`；stage_status：`in_progress`（正式收尾尚在执行）。
- 当前步骤：step11用户已确认U13，待执行阶段末spec-analyze、正式run与复盘；Talk 1–3、Grill、草稿及两track意见处置已完成；direction/detail均取得语义意见但canonical记录失败，事实完整性仍incomplete。用户最终确认已完成；阶段末spec-analyze和阶段完成尚未完成。
- 工作区：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-execution-simplification-20260907`；基线：`e12d446a9e930761c50f12b5efb783466a6c39a1`。认证事实沿用当前记录，不新造绑定。
- 四份工作真相：`decision-log.md`（方向与决定）、`spec.md`（行为和验收语义）、`plan.md`（工程方案）、`tasks.md`（执行卡）。本草稿不替代后三份，不启动实现。
- 需求权威为真实用户消息；原研究、失败记录及 provider 输出只提供事实。下列为当前视图，历史问答及早期 open 事实保留在来源与步骤索引，不当作当前未答问题。

## 原始需求

本表是源覆盖主索引：每个 R/S/U 源出现一次并映射主决定；后文只用同一源的引用，不建立第二需求清单。原始宿主消息缺少精确消息 ref/hash 的，明确 unavailable；不把引用变成人身份认证。用户最终整体批准见U13；内容hash由可见原文字节计算，不声称宿主签名。

| source_id | 原始需求/约束与原文摘录 | 来源引用 | disposition / 唯一主决定 |
| --- | --- | --- | --- |
| R1 | 多个任务卡在 verify-code 的流程、证据，最后只能 risk-close；须解决真实交付问题 | 本任务原始用户消息；精确消息ref/hash unavailable | covered：必要成功链修复；D8 |
| R2 | “简洁优雅的开发框架” | 本任务原始用户消息；精确消息ref/hash unavailable | covered：删重复责任，不降质量；D3 |
| R3 | 前期 sol/astra，build-code/verify-code 用 luna 节省 token | 本任务原始用户消息；精确消息ref/hash unavailable | clarified by U1：保留前期sol/astra、执行luna的使用目标；不建设自动切换/升级机制，不做模型切换验收；D1 |
| R4 | 先 worktree，再 make-decision，不跳阶段，不依赖 build-spec 补需求 | 本任务原始用户消息；精确消息ref/hash unavailable | covered：当前仅决策，需求不下放；D1 |
| R5 | 完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项 | 本任务原始用户消息；精确消息ref/hash unavailable | covered：五维流程、状态和场景；D8 |
| R6 | 主上下文控制、子代理派发；Talk/Grill 大白话 | 本任务原始用户消息；精确消息ref/hash unavailable | covered：主会话交互、重读委派，四角色已执行；D2 |
| S1 | 复盘材料提供待核事实，不能自动批准方案 | `/Users/Hugh/Downloads/workflowhub-review-flow-repair-full-session-postmortem-20260907.md` | adopted as evidence only；D8 |
| U1 | “不要做这种模型切换的验收，只需要帮我设计低智力模型也能执行好build-code的方案即可，必须详细完整的计划文件等。” | 宿主真实纠正消息；精确ref/hash unavailable | confirmed；D1 |
| U2 | “继续问答，问答不要设置倒计时，我还没写完答案就结束了” | 宿主真实消息；精确ref/hash unavailable | confirmed；D2 |
| U3 | “A（推荐）必要质量检查保留，没有实际质量收益的过程要求删减；计划把保留的操作写清楚。” | `call_HLOSNXhGlL64ZH1AghNRSArB` / questionItemId=`[request_user_input_async, call_HLOSNXhGlL64ZH1AghNRSArB, 0]`；reply_hash unavailable | confirmed；D3 |
| U4 | “应该按照现在的设计来，build-code每个phase都要审查，然后verify-code也有独立代码审查” | `call_rBG35YGKI7mOw3F9KS3hRy4R` / item0；reply_hash unavailable | confirmed；D4 |
| U5 | “A（推荐）按风险选择：修 bug 要证明测试能抓住问题；新功能验证成功和失败场景；简单非行为改动不强造失败，也不事后重造历史。” | `call_rBG35YGKI7mOw3F9KS3hRy4R` / item1；reply_hash unavailable | confirmed；D5 |
| U6 | “C 每阶段都保留，由工具尽量整理、模型补判断。过程资料最完整，但维护和执行负担最大。” | `call_rBG35YGKI7mOw3F9KS3hRy4R` / item2；reply_hash unavailable | confirmed；D6 |
| U7 | “A（推荐）build-code 按前期写好的验收方案完成实跑；verify-code 独立审查实现和结果，发现疑点再补针对性验证。” | `call_rBG35YGKI7mOw3F9KS3hRy4R` / item3；reply_hash unavailable | confirmed；D5 |
| U8 | “A（推荐）不新增或重新设计页面；保留现有报告正常生成与查看，重点改计划、执行指引和必要工具。” | `call_PQawK5geDOEAJUg3MnS7Wc1r` / item0；reply_hash unavailable | confirmed；D9 |
| U9 | “A（推荐）计划提前写清允许调整的边界；边界内补上遗漏、同步原计划并继续。涉及需求或接口变化时，先回对应材料解决。” | `call_PQawK5geDOEAJUg3MnS7Wc1r` / item1；reply_hash unavailable | confirmed；D7 |
| U10 | “A（推荐）停止重复请求，明确保留审查缺口；继续能独立完成的工作，并向你说明受影响部分和补审办法。” | `call_PQawK5geDOEAJUg3MnS7Wc1r` / item2；reply_hash unavailable | confirmed；D10 |
| U11 | “A（推荐）每项任务给出可直接执行的修改步骤；关键逻辑写到伪代码和输入输出示例，普通函数细节由执行模型完成。前期设计充分，同时避免计划复制一遍代码。” | `call_TbbkBsemwzpqbcLelE1JKY46` / item0；reply_hash unavailable | confirmed；D1 |
| U12 | “请再次仔细对照原始需求文件…包括审查失败和部分成功不算通过…e2e…code_review、stage_outcome…”（完整原文见末节） | call_sWkkAB2J9aV7dLGWG2Omxwuq / item0 | 已完成追加核查，非批准；D8/D11–D14 |
| U13 | “确认补齐后的决策，完成 make-decision 收尾。” | call_00X5dKnJBkZCcswbc4uw6bU9 / questionItemId item0 | confirmed：整体批准D1–D14、PM64项处置及明确延期 |

## 需求框架

- framework：`functional`；选择理由：这是五阶段工作流交付改进，按背景→问题→目标→方案→验收→扩展组织。在问题/方案下挂 research 子节点；后续只回填同一框架。

| node_id | 节点与当前内容 | status | evidence_status / evidence_owner / next_review_trigger |
| --- | --- | --- | --- |
| N1 | 背景：用户报告反复交付受阻 | confirmed | 用户事实已给；历史抽样不外推总体 |
| N2 | 问题：计划执行责任、重复劳动、必要成功链契约缺陷 | confirmed | 当前研究与错误原件；运行修复效果 pending / build-code / 真实针对性验收 |
| N3 | 目标：降低临场设计与协议拼装负担，真实正常交付 | confirmed | U1/U3/U11；不承诺模型可靠率或费用比例 |
| N4 | 方案：D1–D14 当前选择 | 局部选择及整体U13 confirmed | Talk/Grill 已收敛；整体 final approval pending / 主会话 / detail已处置，最终确认后执行阶段末审计 |
| N5 | 验收：正常、修复、不可用、错来源、复盘报告场景 | 责任及完整卡U13 confirmed | 验收方向已明确；动态结果 pending / build-code / 执行已设计验收 |
| N6 | 扩展：模型机制、页面重设计与历史追认不纳入 | confirmed | U1/U8及既有治理；无已批准新增迁移体系 |

## 目标、范围与完整用户流程

目标是让前期设计足够完整，执行模型按清楚计划完成实现到验证的交接；减少重复抄写、过程证明和临末拼装，保留真实质量工作。并未证明 token 节省比例或任何模型零错误。

| 环节 | 用户/执行者拿到什么 | 必须在本环节完成 | 失败/缺口怎样处理 |
| --- | --- | --- | --- |
| make-decision | 已确认目标、用户流程、页面范围、数据状态、成功失败、非目标/延期 | 解决产品方向与验收归属，不推给build-spec | 方向争议继续本阶段问答；不代填答案 |
| build-spec | 同一spec内完整行为、接口/状态、输入来源、验收场景 | 细化已定需求，不新猜产品方向 | 发现方向缺口回make-decision；实现语义在本阶段澄清 |
| build-plan | 同一plan/tasks内工程方案与逐卡执行说明 | 写明依赖、真实接口两端、动作、检查命令及预期、失败路由、允许补漏边界；设计每Phase审查和完整功能验收 | 入口/依赖未知明示并先解决设计问题，不用“自行完善”代替计划 |
| build-code | 当前任务卡及其明确引用，必要工具可直接调用 | 按卡实现、针对性检查、每Phase独立审查与finding处置；实跑预定完整功能验收；证据随执行产生 | 普通缺陷同task修；边界内补漏同步原计划；需求/接口变化回owner；外部审查不可用有限停止并报告 |
| verify-code | 当前实现、原始检查/审查结果与已处置findings | 保留独立代码审查；有疑点再作针对性验证；修复后沿原review登记真实处置，不为clean标签重审 | 明确未修问题或证据缺口；不替上游补需求/验收设计、不制造通过 |
| 各阶段末复盘 | 工具整理的事实和模型判断 | 每阶段保留复盘及真实未完成/失败信息；已有报告正常生成 | 自动采集失败如实缺失，不伪造；已有生命周期冲突须纳入必要修复，不能靠补历史收尾 |
| 最终交付 | 已证明结果、剩余缺口、交付动作说明 | 用户确认验证结论；不可逆交付另按明确授权执行 | 未证明质量保持未完成；物理交付成功不冒充质量通过 |

每阶段末复盘均保留。方向、计划和验证结论沿既有三处正常确认；非 UI 不增加设计确认，build-code 不增加日常用户确认。U2 无倒计时约束适用于本次真实问答，未答不得用超时或推荐代填。

## 数据与状态、成功/失败边界

- 四材料仍是工作真相：方向/规格/方案/执行卡各管一层；相同接口、命令、边界有一个权威位置，其余引用或工具投影，避免人工同步多份。
- 执行结果来自实际动作：测试命令/退出结果、验收结果、审查原件、finding处置和复盘观察由现有入口记录/消费；工具自动派生身份/引用，模型不手拼来源证明。
- 原review与旧失败不可改写；修复产生当前修复事实并指向原finding。输入错任务、错来源或原件hash不符时拒绝那次写入并明确字段，不能把拒绝升级为整task锁定。
- 已通过、真实失败、未执行、外部不可用必须区分；不把缺计时/重复过程表缺失解释成代码失败，不把缺必要质量事实解释成完成。
- 验收通过要有真实行为结果；检查失败要能指向场景及实际偏差；审查缺口要能解释范围与补审动作；复盘不能代替任何一种质量结果。

- 正常成功：详细计划可执行；每 Phase 审查和 verify 独立审查真实完成；build-code 预定功能验收结果由 verify 合法读取；每阶段复盘和现有报告正常生成；不临末另造证据打包脚本。
- 修复成功：原 review 不可变，当前真实修复与受影响检查关联原 finding 后可合法交接；必要新风险才追加针对性检查/审查，不为 clean 标签重审。
- 功能失败：定位实际场景偏差，同 task 修复；错任务/来源/hash 则明确拒绝该写入，不把整 task 冻结。
- 外部不可用：有限尝试后停止重复请求，保留缺口、影响范围和补审办法，继续独立工作；不能假绿或自动 risk-close。
- 过程采集失败：如实记录缺失，不伪造模型判断，不把过程缺失改写为代码失败；中止或部分答复按用户真实意图处理，未答保持未答。

## 保留活动与取消重复责任

| 保留的质量活动 | 明确取消的重复责任 / 保护边界 |
| --- | --- |
| 每Phase审查、verify独立审查 | 不重复抄已有Phase边界、拼同一审查输入；不为clean标签无新风险重审 |
| 风险相关检查、真实功能验收与逐AC结果 | 不机械补造RED历史；不以退出0代替行为断言 |
| 每阶段复盘、现有报告生成查看 | 工具收集事实，不手工多处同步；模型判断仍真实产生 |
| 必要身份与来源真实性 | 工具派生既有身份/引用，不让执行者临末另写打包脚本 |
| 当前四材料中的方向/规格/工程说明 | 相同接口/命令/边界一处定义，其余引用；路线未变不重复选择 |

## 下游材料须达到的可执行标准与完整成功链

下游spec/plan/tasks的目标标准（本决策草稿不冒称已写完工程计划）：明确输入、依赖/真实锚点、动作、consumer、关键逻辑伪代码及I/O、检查预期、失败路由与允许补漏边界。普通函数不复制代码；缺口继续修原材料，不新增准入gate。

| scenario_id | 场景与数据源 | 可观察结果 / 失败信号 |
| --- | --- | --- |
| SC-normal | 无finding正常任务；真实执行、actor、预定验收、必要复核与现有确认 | writer/consumer合法写读，审查复盘完整；固定missing、临末手拼或假绿为失败 |
| SC-findingfix | 原review/finding、当前修复和受影响检查 | 原件保留且当前处置可合法交接；强迫改旧review或为clean全轮重审为失败 |
| SC-unavailable | 实际外部失败及有限尝试记录 | 停重复、明确未审范围/影响/补审；无限重试、冒称完整质量为失败 |
| SC-wrongbinding | 错任务/来源或原件hash变化输入 | 明确拒绝本次错误写入；接受错源或冻结同task修复为失败 |
| SC-reflection | 各阶段真实事实、模型判断与现有报告 | 正常生成且可查看，删重后consumer输入仍完整，失败真实披露；伪造判断或缺失反转代码结果为失败 |
| SC-plan-deviation | 计划遗漏必要局部文件/步骤；另给需求或接口改变反例 | 边界内同步原plan/tasks再继续；越界回材料owner解决；悄悄改需求或一律重跑全阶段为失败 |
| SC-partial-review | 同批真实语义结果与部分provider失败 | 保留findings与失败分别可读，按原审查契约判覆盖；抹掉可用意见/失败或伪造覆盖为失败 |
| SC-review-write-failure | 已有合法语义结果但记录器拒绝 | 留原始结果与具体写入错误，修合法记录路径，不重复provider求同意见；说无语义或记录成功为失败 |

这些是待实现验证的目标，不是已测得净token下降或框架成功结果。


### 必要成功链的行为语义（D5/D8/D10）

本节固定需求语义，schema字段名、函数和命令由build-spec/build-plan在已有对象内细化；不新增状态机、store或公共流程节点。

| 实际输入/状态 | 谁写、谁读与可观察结果 | 失败/继续边界 |
| --- | --- | --- |
| 当前任务、真实执行者、逐AC实跑输入与结果 | build-code通过现有入口记录真实来源和行为结果；verify核对任务/来源、场景、断言与结果的关联 | 未执行或断言失败如实保留，不能用退出0补成通过；疑点触发针对性复验 |
| 原review及finding、当前修复和受影响检查 | 原件不可变；修复记录指向原finding与当前实现，bridge/writer/consumer采用同一语义 | 允许合法旧review作为修复来源，拒绝错任务、错来源或原件hash变化；不要求篡改旧review或重取clean |
| 部分provider返回可用意见，另一些失败 | 可用findings和各失败同时保留；可用性、独立覆盖、写入结果、质量判断分别读取 | 独立覆盖是否满足沿用当前attempt.review_policy及canonical-review-result的distinctAdapters/distinctSources认证；缺失不能当完整，部分失败不能抹掉已得语义 |
| 意见已取得但记录失败 | 保留完整原始公共结果及错误；修现有记录入口后消费同一结果 | 不报记录成功，也不报没有语义；不能为导入/clean重新请求本track同意见 |
| 必要审查全部不可用 | 当前stage owner记录未审范围、影响、实际尝试与补审办法 | 只有route/material实际修复且既有预算有余额才再试；预算耗尽或无可修条件就停止。继续独立工作不代表该审查或整个stage已完成 |
| 现有用户确认与最终验收复核 | verify必做逐AC及来源/结果关联审查，只有疑点才复跑；现有用户确认通过原入口记录并被正确读取 | 不另加第二次全量功能验收或日常确认；确认缺失如实缺失，不代替用户，不授权不可逆交付 |

错输入只拒绝本次错误写入；修正输入后可在同任务提交正确事实。业务质量失败、provider不可用和记录失败保持不同原因。预算引用现有配置，工程计划给出来源、有效值与停止路径；取不到有效值时不推定仍有余额，不新建持久重试计数。四材料可读时继续独立工作与“阶段已完成”严格区分；本任务仍按用户指定顺序完成make-decision后才转下一阶段，不新增reopen/risk-close恢复链。

已有工作区前置事实：已先从基线创建独立worktree并经task-bootstrap认证，路径/基线见文首，结果来源为本次bootstrap记录；后续四材料仅写该worktree。创建/认证失败则保留真实错误、修复绑定，不向未经绑定路径写材料；不新增worktree preflight公共节点。

## 决定

以下每项使用 decision-entry.v1 最低推理字段；module/requirement_ids/artifacts/derived_from 只作文本链。approval_binding 仅表示列出的真实局部选择，全部条目的整体最终批准已由U13确认；正式确认记录由现有公共confirm写入，内容hash不冒称宿主签名。

### 前期计划可执行性

### D1
- question/final_option: 如何让执行者不临场补设计？采用 U11 A：动作可执行、关键逻辑伪代码与 I/O；普通函数自行实现。
- recommendation/plain_language: 推荐 A：把难的设计提前完成，避免材料复制代码。
- decision: 前期完整解决产品方向；spec 细化行为/状态/验收语义；plan/tasks 写清依赖、真实接口两端、输入动作、关键逻辑、检查预期、失败路由与调整边界。
- source_type/reference/exact_excerpt: actual_user_answer：U1/U11，源索引精确引用；摘录“关键逻辑写到伪代码和输入输出示例”。
- approval_binding: U1/U11 局部选择 confirmed；U11 host ref 见源索引；hash unavailable；整体U13 confirmed。
- facts_and_constraints: 模板已有字段但内容可空泛；无模型对照证据；不增加第五权威材料。
- Logic: 详细计划需求 -> 禁止模型机制扩围 -> 分层材料及关键逻辑例子 -> 减少执行者重新设计。
- choice_reason/impact: 满足用户期望的粒度；影响四材料职责与 build-code 消费。
- consequences_and_risks: 前期设计成本上升，过长或失同步仍可能增加负担。
- rejected_alternatives: 自动切换/升级机制及宿主对比不属于本期；U1明确排除切换验收，用户自行选择Luna执行的意图保留；普遍逐函数实现草稿：U11 拒绝复制代码。
- unresolved_items/owner: 产品轴无剩余；工程锚点和具体伪代码由 build-plan 填实，不能重新决定需求。
- Supersedes: none；撤回过度扩展的候选 Q2/Q3，并非替换已批准模型方案。
- module: 前期计划可执行性; requirement_ids: [R3, R4, U1, U11]; derived_from: []; artifacts: [spec.md, plan.md, tasks.md]

### 真实问答与主会话职责

### D2
- question/final_option: 问答何时收敛？真实答复到齐或用户明确撤回，不设截止时间。
- recommendation/plain_language: 遵循用户纠正；大白话交互、独立读取委派，避免主上下文挤占。
- decision: 本次任务问答不设答题截止时间，未答不得默认收敛或代答；按R6用大白话说明选项、后果和风险。主会话独占Talk/Grill来自当前make-decision技能，重读与讨论按R6委派；不新增宿主级超时控制面。
- source_type/reference/exact_excerpt: actual_user_answer：U2；摘录“问答不要设置倒计时”；R6 提供委派约束。
- approval_binding: U2确认本次无倒计时，R6要求大白话与委派；主会话交互归属来自workflows/make-decision/SKILL.md的Portable dependencies，不冒称U2授权；整体U13 confirmed。
- facts_and_constraints: 宿主有真实部分回复；工具没有认证 reply_hash，不虚构。
- Logic: 答题被提前结束 -> 等真实回复 -> 取消倒计时及默认代答 -> 需求不丢失。
- choice_reason/impact: 保护需求完整性；影响本次交互和委派安排。
- consequences_and_risks: 等待时长不可预估；不扩展为全宿主新超时控制面。
- rejected_alternatives: 推荐项自动生效/凑轮次重问：违反 U2 与已答事实。
- unresolved_items/owner: 无新产品问题；最终确认尚待真实答复。
- Supersedes: none；纠正早期交互方式。
- module: 真实问答与主会话职责; requirement_ids: [R6, U2]; derived_from: [D1]; artifacts: [decision-log.md]

### 删除重复执行责任

### D3
- question/final_option: 哪些流程可简化？选 U3 A，删无真实收益过程要求。
- recommendation/plain_language: 推荐 A：质量动作保留，重复整理责任减少。
- decision: 同接口/命令/事实一处权威、其余引用；不重复抄边界、选择未变路线、手拼派生身份/来源、不补造历史。
- source_type/reference/exact_excerpt: actual_user_answer：U3；摘录“必要质量检查保留，没有实际质量收益的过程要求删减”。
- approval_binding: U3 confirmed；host ref 见源索引；reply_hash unavailable；整体U13 confirmed。
- facts_and_constraints: U4/U6 限定保留审查/复盘；删除必须核实 consumer，不创建第二事实系统。
- Logic: 重复整理负担 -> 质量保护不减 -> 去重复和工具派生 -> 执行者聚焦真实实现。
- choice_reason/impact: 较仅加长计划直接；影响 skills、现有工具与派生事实消费者。
- consequences_and_risks: 误删真实消费者会破坏质量；不承诺净费用百分比。
- rejected_alternatives: 只加长计划保留全部手工：重复负担仍在；为自动化新增永久控制面：违背轻量约束。
- unresolved_items/owner: 具体删除字段/步骤由工程核对 consumer；没有证据不删。
- Supersedes: none；U4/U6 对 U3 的范围作明确限定。
- module: 删除重复执行责任; requirement_ids: [R2, U3]; derived_from: [D1]; artifacts: [plan.md, tasks.md]

### 独立审查保持分布

### D4
- question/final_option: 审查集中最终还是每 Phase？保留每 Phase 和 verify 独立审查。
- recommendation/plain_language: 用户未采纳减少 Phase 审查的推荐；尊重其质量取舍。
- decision: build-code 各 Phase 真实审查与处置，verify 独立代码审查；缺口按 D10，审查不是准入许可证。
- source_type/reference/exact_excerpt: actual_user_answer：U4；摘录“build-code每个phase都要审查，然后verify-code也有独立代码审查”。
- approval_binding: U4 confirmed；host ref 见源索引；reply_hash unavailable；整体U13 confirmed。
- facts_and_constraints: 宪法 F4/Q3 要求真实独立来源，禁止自审自判。
- Logic: 用户保留审查点 -> 不以省成本删质量 -> 简化重复输入记录 -> 审查覆盖维持。
- choice_reason/impact: 保持现有质量覆盖；影响 Phase 计划与 verify 交接。
- consequences_and_risks: 审查成本与外部可用性依赖保留。
- rejected_alternatives: 集中到最后/减少 Phase：U4 明确否决；为 clean 重审：不解决新风险。
- unresolved_items/owner: 本次 canonical direction-advice 未完整；该事实不改写为 pass。
- Supersedes: none；撤回减少审查的研究推荐。
- module: 独立审查保持分布; requirement_ids: [U4]; derived_from: [D3]; artifacts: [plan.md, tasks.md]

### 风险测试与功能验收归属

### D5
- question/final_option: 测试如何选、谁实跑验收？U5 A 风险选择，U7 A 由 build-code 承担。
- recommendation/plain_language: 两项均推荐 A：验证真实行为，避免最后集中补课。
- decision: 修 bug 证明检查能抓问题，新功能覆盖成功/失败；简单非行为改动不强造 RED。前期设计完整验收，build-code 实跑；verify 独审，疑点再复验。
- source_type/reference/exact_excerpt: actual_user_answer：U5/U7；摘录“build-code 按前期写好的验收方案完成实跑”。
- approval_binding: U5/U7 confirmed；host refs 见源索引；reply_hash unavailable；整体U13 confirmed。
- facts_and_constraints: 退出0不代表测到新行为；代码审查不能冒充功能验收。
- Logic: 局部命令绿可能漏行为 -> 验收前期设计 -> 实现者完成真实场景 -> verify 有可信结果可读。
- choice_reason/impact: 责任完整；影响 spec AC、plan 检查及结果 consumer。
- consequences_and_risks: 前期验收设计投入保留；漏场景会带来虚假完成风险。
- rejected_alternatives: 普遍机械 RED/GREEN 配对、补历史：U5 拒绝；verify 临末补验收设计：U7 拒绝。
- unresolved_items/owner: 具体命令/数据工程细化；验收责任与成功链不能延期。
- Supersedes: none；CONTEXT 的职责歧义已最小修正。
- module: 风险测试与功能验收归属; requirement_ids: [U5, U7]; derived_from: [D1, D4]; artifacts: [spec.md, plan.md, tasks.md, CONTEXT.md]

### 每阶段复盘

### D6
- question/final_option: 复盘是否按需？U6 C：每阶段保留。
- recommendation/plain_language: 用户选择保留全部，未采用按需推荐；资料最完整。
- decision: 工具整理真实事实，模型补判断；每阶段复盘及已有报告保留，采集失败如实缺失。删手工同步前必须核对现有报告生成与查看的完整consumer链，保留其所需事实，SC-reflection检验可用性。
- source_type/reference/exact_excerpt: actual_user_answer：U6；摘录“每阶段都保留，由工具尽量整理、模型补判断”。
- approval_binding: U6 confirmed；host ref 见源索引；reply_hash unavailable；整体U13 confirmed。
- facts_and_constraints: 过程自动采集不能制造未执行事件或模型判断。
- Logic: 用户要求阶段资料完整 -> 不减少复盘 -> 自动事实整理与人工判断分工 -> 保持可追溯。
- choice_reason/impact: 保留观察价值；影响阶段末记录与报告消费者。
- consequences_and_risks: 维护执行负担最大；失败不得反转代码结果。
- rejected_alternatives: 按需复盘/退出每阶段复盘：U6 明确拒绝。
- unresolved_items/owner: 重复观察生命周期冲突纳入 D8，尚未实现修复。
- Supersedes: none；撤回减少复盘的研究推荐。
- module: 每阶段复盘; requirement_ids: [U6]; derived_from: [D3]; artifacts: [plan.md, tasks.md]

### 计划偏差分流

### D7
- question/final_option: 执行遇遗漏如何处理？U9 A：边界内补漏并同步原计划。
- recommendation/plain_language: 推荐 A：减少无意义打断，保留需求边界。
- decision: 需求/接口/验收不变且在预设范围内，可同步原计划继续；产品方向回 make-decision，行为/接口歧义回 build-spec，工程步骤补充归 build-plan。
- source_type/reference/exact_excerpt: actual_user_answer：U9；摘录“涉及需求或接口变化时，先回对应材料解决”。
- approval_binding: U9 confirmed；host ref 见源索引；reply_hash unavailable；整体U13 confirmed。
- facts_and_constraints: 四材料单一工作真相；同 task 修复不冻结，不默认整阶段重跑。
- Logic: 局部遗漏不可避免 -> 预设边界 -> 同步原计划再继续 -> 降低打断且不擅自扩围。
- choice_reason/impact: 减小执行决策成本；影响执行卡和 owner 交接。
- consequences_and_risks: 边界含糊易误吸收真实需求变化，计划须具体。
- rejected_alternatives: 遗漏一律整阶段重跑：无收益；任意改需求/接口：违反 U9。
- unresolved_items/owner: 工程设计写清本任务允许补漏类别；不新增产品轴。
- Supersedes: none。
- module: 计划偏差分流; requirement_ids: [U9]; derived_from: [D1]; artifacts: [spec.md, plan.md, tasks.md]

### 必要交接成功链

### D8
- question/final_option: 只整理计划还是修必要合同？本期同时打通已证实的成功链缺口。
- recommendation/plain_language: 建议完整修必要链：只改 close 状态不能修真实缺失。
- decision: 原 review 不可变，当前修复事实关联原 finding，writer/consumer 共用语义；真实执行/actor、独立验收复核、现有用户确认可记录并消费；修 review 状态生产/记录不一致与必要复盘冲突。完整链细化见D11（code_review/stage_outcome）、D12（E2E）、D13（批准与复盘）、D14（执行保护），不能只修一端即报整体完成。
- source_type/reference/exact_excerpt: research/code/grill：R1/R5/S1、当前源码及本次实际错误；摘录“review result status must be available or unavailable”。
- approval_binding: 研究与 Grill 派生建议；无单独用户风险选择；整体最终确认U13 confirmed；hash unavailable。
- facts_and_constraints: 固定 missing 限于已核 required E2E 分支；原件留存；不把代码审查当功能复核，不新增日常确认。
- Logic: 真实交接缺口 -> 无法诚实正常交付 -> 修现有 owner/consumer 合同 -> 合法证据可写可读且错源被拒。
- choice_reason/impact: 覆盖原始交付目标；影响已有 runtime/bridge/review/验收及复盘消费者。
- consequences_and_risks: 可能跨模块；字段实施待细化，修复效果未验证，历史任务不迁移追认。
- rejected_alternatives: 只改 close 状态或延期必要链：保留原故障；旧 review 改成当前 clean：改写事实；第二事实系统：超范围。
- unresolved_items/owner: 生产代码尚未修；动态效果 pending / build-code。本期必修已获U13整体批准；字段/函数归工程设计。
- Supersedes: none；保留旧失败与旧 review。
- module: 必要交接成功链; requirement_ids: [R1, R5, S1]; derived_from: [D4, D5, D6, D7]; artifacts: [spec.md, plan.md, tasks.md]

### 页面与扩展边界

### D9
- question/final_option: 是否改页面？U8 A：不新增/重设计，保留报告。
- recommendation/plain_language: 推荐 A：集中计划、执行指引和必要工具。
- decision: non_ui；不新增 Web 控制台，不改页面布局/交互；保留报告正常生成查看。沿用既有四材料、五阶段、七类公共行为。
- source_type/reference/exact_excerpt: actual_user_answer：U8；摘录“不新增或重新设计页面”。
- approval_binding: U8 confirmed；host ref 见源索引；reply_hash unavailable；整体U13 confirmed。
- facts_and_constraints: 三输入 UI 判断无本次前端变化；新持久体系无当前需求。
- Logic: 范围集中 -> 页面不变 -> 修执行与交接 -> 降低无关维护成本。
- choice_reason/impact: 保持现有用户表面；影响范围及非目标。
- consequences_and_risks: 若后续实际涉及 UI，须重算 applicability，不能沿用旧标签。
- rejected_alternatives: 新页面/控制台：U8 排除；新 runner/公共 stage/第五材料/永久兼容桥：无必要 consumer。
- unresolved_items/owner: 没有纳入历史质量追认或迁移；未来有独立需求再决定。
- Supersedes: none。
- module: 页面与扩展边界; requirement_ids: [U8]; derived_from: [D1, D8]; artifacts: [spec.md, plan.md]

### 外部不可用与真实完成

### D10
- question/final_option: 外部审查不可用如何结束？U10 A：有限停止、保留缺口、继续独立工作。
- recommendation/plain_language: 推荐 A：停止空转，同时保持质量真实。
- decision: 各强制审查点适用同一不可用分支；说明未审范围、影响和补审路径；已拿意见但记录失败要区分，不为 canonical/clean 重发同意见。
- source_type/reference/exact_excerpt: actual_user_answer：U10；摘录“停止重复请求，明确保留审查缺口”。
- approval_binding: U10 confirmed；host ref 见源索引；reply_hash unavailable；整体U13 confirmed。
- facts_and_constraints: 宪法F3/F4 允许同 task 修复；宪法F7 保留真实确认及独立不可逆授权。
- Logic: 外部能力失败 -> 不可伪造也不空转 -> 如实停止重复并继续可做部分 -> 有限诊断与明确交接。
- choice_reason/impact: 改善失败可结束性；影响全部审查点和完成报告。
- consequences_and_risks: 任务质量可能暂不完整；不可把物理交付或记录成功当质量通过。
- rejected_alternatives: 无限重试：U10 拒绝；解除人工确认/自动 risk-close：越过现有授权； unavailable 当 pass：造假。
- unresolved_items/owner: canonical direction-advice 失败保留；当前不重复该 track 请求；实现 owner 修合同。
- Supersedes: none。
- module: 外部不可用与真实完成; requirement_ids: [U10]; derived_from: [D4, D8]; artifacts: [spec.md, plan.md, tasks.md]


### 审查部分成功的唯一解释（D8补足）

- 保留原始公共结果及provider/role失败；canonical继续沿既有`status=available|unavailable`表达语义可用性，以既有`outcome=partial`等完整性字段保留成员失败，不把raw原件的`available-with-failures`改写掉。具体标准化放一个现有边界，各consumer复用；不是手改本次原件使其过关。
- 独立覆盖按该role的现有`attempt.review_policy`、eligible/pin、实际来源/adapter及输出provenance认证；不能数completed字样，也不能把红蓝相同provider当两个独立来源。paired结果使用已有pair_id/role保留两组身份，各自验证，不能展平后因重复provider拒绝合法两角色结果。
- 有合法异源且满足最低覆盖：该审查可用，即使其他成员失败；失败仍partial保留。有效意见但覆盖不足：保留意见及缺口，不能说完整审查通过。覆盖达标但serious未处置：质量仍未完成。全失败空findings：没有clean语义依据。合法review返回空findings则与全失败空数组不同。
- `REVIEW_NO_SEMANTIC_RESULT`仅在全部role均无可认证语义时成立；不能因为各role带失败成员或未满足quorum就抹掉已有语义。可用性、覆盖、严重问题、持久写入、stage结果认证和最终完成分别判断。
- paired验收明确四分支：两role各达覆盖但部分成员失败，成对审查可用且partial保留；仅一role达标，保留该意见与另一role缺口；两role有语义但均未达覆盖，保留语义而不称完整成对审查；材料不一致则拒绝错误成对绑定。后三者不能宣称完整成对审查，均不靠展平provider或顶层minimum重造policy。
- 来源：`runtime/review/canonical-review-result.mjs:118–189,234–315`、`runtime/stage/stage-runner.mjs:1327–1403`、`runtime/review/review-record-route.mjs:368–387`；完整核查RSH7。代码审查与E2E独立性分别沿其真实现有契约，不把一个阈值偷用到另一条链。

## 原始复盘二次覆盖后的补充决定（U13已整体确认）

U12要求再次逐项核查。复核结论是：上一版D8过于概括，不能称所有问题都有明确方案。本节和后续PM矩阵补足遗漏，为当前同一决策；U13已批准其范围，不是已实现代码。历史已经修过的问题仅列保留约束与受影响验证；本期不重做全仓修复。

### D11
- question/final_option: `code_review`、`stage_outcome`如何真实产生并一次被消费？复用现有实际调用和事实入口，去掉重复人工执行证明，接通必要来源与结果传递。
- recommendation/plain_language: 审查确实做过就直接使用其真实结果；模型不再临末手填一套“我执行过”的证明，也不能把没做过填成做过。
- decision: 当前显式host/session输入和实际review/step执行，通过现有adapter/bridge/run返回完整可用引用，正式fact和status消费同一结果。共享producer身份校验；source_family须符合真实source_id定义，未知来源明确不可用，不扫描历史会话或环境猜值。移除与认证review结果重复的手填`dsh-code-review executed`要求及宿主技能名称绑定；同步现有manifest/consumer，保留原独立审查活动、质量覆盖、finding处置和每阶段复盘；现有dsh组合技能中的真实consumer、失败边界等审查视角继续进入同次review输入，不能只保留次数却缩窄审查内容。实现后修复、验证、交接等实际动作仍须真实结果，canonical review不能自动证明它们发生。
- source_type/reference/exact_excerpt: U12“缺少 code_review、stage_outcome的问题”；原复盘§5.1a/5.2、§12.2；RSH6/RSH7当前代码核查。
- approval_binding: U12仅要求复核；U13已整体批准并显式覆盖本项。
- facts_and_constraints: 当前bridge只检查source字段非空，runner检查family/id一致；旧review resolved内外规则不一；单有review原件不等于当前stage结果已认证。历史generic错误不是source错配唯一根因的证明。
- Logic: 真实审查已经发生但回执链缺口 -> 分清重复证明与必要后续事实 -> 真实调用直接传递必要引用且上下游同校验 -> 正常执行不依赖临末打包脚本。
- choice_reason/impact: 降低执行模型拼协议负担；改现有skill指引、manifest、adapter/bridge和runner，不新造执行器、每skill公共入口或控制面。
- consequences_and_risks: 删除重复要求必须保留实际活动和独立来源认证；不能把所有step的executed默认设true。
- rejected_alternatives: 仅伪填executed/source、只以bridge exit0宣称成功、继续增加独立凭据包：不采用；为缺canonical重复发provider：不采用。
- unresolved_items/owner: build-spec固定已有对象的输入/输出与缺口语义，build-plan给真实路径/字段及首个适合执行卡；build-code实走producer→bridge→run→发布fact→status。具体工具字段待工程细化，链路是否本期处理不下放。
- Supersedes: 细化D8笼统“必要成功链”，不替换原review或历史失败。
- module: 真实执行结果生产消费; requirement_ids: [R1, R3, R4, R5, U1, U3, U4, U12]; derived_from: [D1, D3, D4, D8, D10]; artifacts: [spec.md, plan.md, tasks.md]

### D12
- question/final_option: E2E是否只修stale过滤与reader？否，接通当前完整执行、独立复核、确认和嵌套证据消费。
- recommendation/plain_language: 要证明从真实输入到最终结果的整条功能流程；不能改掉一个missing，下一次execute又重新缺失。
- decision: build-code按前期场景实跑，包括现有契约声明的command/service场景；使用真实行为断言，不把shell退出0直接当验收。执行actor从实际认证outcome取得；verify现有独立审查同时核对逐AC、执行原件和冻结材料，有疑点再复跑，不另增一轮全量验收或必做独审。同一次verify审查输入同时包含实现、逐AC、执行原件与冻结材料，沿既有verify policy完成；复用该实际输出形成E2E binding。不得在普通verify之外再直接调用会dispatch的runTaskBoundE2eReview，也不得仅取canonical存在就追认原审查没看过的E2E材料。读取现有verify真实用户确认；统一异源定义与绑定。writer、reader、nested freshness对revision/ref/hash及执行类型一致。当前适用性由当前材料决定，旧missing不激活不适用要求；空场景/缺路由不能假成功。逐AC未知仍保持未知，不能从一次执行自动推导全覆盖。
- source_type/reference/exact_excerpt: U7完整验收归build-code、U12“e2e的问题”；原复盘§5.1a、§9.1、§12.1；RSH8逐边源码证据。
- approval_binding: U7职责已确认，本项具体完整链范围已由U13整体确认；不是已验证的E2E通过。
- facts_and_constraints: 当前command/service固定unavailable；E2E复核producer已有但未见生产路由接线；required reader固定actor=null、独审/确认missing；nested消费者与writer存在字段/类型不一致。现有source独立性两端口径也不同，不能放宽真实性换取通过。
- Logic: 只修局部reader无法使真实写入和回读成功 -> 保留原职责并接既有能力 -> 同一场景实际execute发布与status回读 -> 合法正例可完成，缺失负例准确指出缺哪边。
- choice_reason/impact: 直接覆盖用户正常质量完成目标；改现有acceptance执行、review接线、确认消费及freshness，不新建验收平台。
- consequences_and_risks: 涉及多消费者；fixture与live必须分开，当前没有实跑就不能承诺已成功。保留必要外部调用成本与现有授权边界。
- rejected_alternatives: 删除全部E2E要求、只测内部函数/文件存在、复用close授权作验收确认、增第二次全量实跑或第三轮独审：不采用。
- unresolved_items/owner: spec明确场景/来源/每项缺失与拒绝语义；plan给command/service真实执行方案及全部consumer锚点；build-code验证正式execute→fact→status。本期不把任何必需一边再延期后宣称完整成功。
- Supersedes: 细化D5/D8；stale既有修复保留，不重写历史结果。
- module: 完整功能验收; requirement_ids: [R1, R5, U5, U7, U12]; derived_from: [D5, D8, D11]; artifacts: [spec.md, plan.md, tasks.md]

### D13
- question/final_option: 如何消除批准自指、重复确认和同阶段复盘冲突？批准全文与执行事实分开，重试幂等，新真实观察不可变保存并显式引用。
- recommendation/plain_language: 同意过的方向不应因工具写了一条“已同意”而失效；修复后有新复盘可以保存，旧记录不覆盖。
- decision: 用户批准最终decision-log全文；真实确认及后续纯步骤状态写现有执行事实，不再要求把自身当前hash、确认结果或每步完成反复回填被批准正文。沿现有make-decision材料scope验证批准对象，后续spec/plan/code变化不自动使方向批准失效；真实decision正文变化需更新确认，不任意正则忽略正文。review按自身范围和材料继续严格绑定。同subject、批准对象、步骤和真实答复表达同一确认意图，重试返回首次记录及时间；不同选择或内容保留为新事实。同阶段修复后确有新观察可提交新judgment，旧件不可变、相同判断幂等；本次run/reflect显式返回并消费实际ref，同步报告与lesson消费者，不强制每attempt复盘。未提供本轮executor/judgment保持真实缺失，不用旧成功冒充。
- source_type/reference/exact_excerpt: U3删无收益过程、U6每阶段复盘；原复盘F-020、§5.4、§9.1、§12.3；RSH9当前writer/consumer核查。
- approval_binding: U3/U6已有选择有效；该生命周期解决方式已由U13整体确认。
- facts_and_constraints: 确认fact已有material_scope_revision；现有freeze却要求正文三处值与当前四材料revision一致；confirm先生成新时间再比全对象；reflection和多个consumer固定stage.json。末次历史executor_absent与较早immutable冲突是两件事。
- Logic: 确认回写造成自指、固定路径只能容纳一份判断 -> 使用既有作用域与事实引用 -> 同意图可重试、真实新观察可保留 -> 不靠续签/覆盖旧报告维持流程。
- choice_reason/impact: 删除重复校验及手工回填；替换现有reflection固定路径writer/consumer，新写走已有quality/evidence，不双写、不加latest/selector/恢复链。
- consequences_and_risks: 必须同时改runner/validator/report/lesson，防只改文件名造成下游失读；确认并发和半写由现有原子写边界解决，不宣称仅先查后写即可exactly-once。
- rejected_alternatives: 任意排除正文片段hash、永久冻结方向不可修改、每attempt强制复盘、覆盖旧判断或新增确认ledger：不采用。
- unresolved_items/owner: spec写清相同意图/真实变化/缺executor语义；plan细化现有原子去重与ref传递，登记替代固定路径的唯一owner/consumer及删除条件。旧记录只读，无历史迁移或追认。
- Supersedes: 细化D3/D6/D8，不替换已批准历史记录。
- module: 批准与复盘生命周期; requirement_ids: [R1, R2, R5, U3, U6, U12]; derived_from: [D3, D6, D8, D11]; artifacts: [spec.md, plan.md, tasks.md]

### D14
- question/final_option: 原文件中其余执行、模板、打包、分发、隔离和usage问题怎样处置？明确区分本期合同修复、既有修复保护、执行纪律及延期，不把全部历史bug重新实现。
- recommendation/plain_language: 对已经修好的部分保留保护；把发生过的漏项写进可执行计划，避免同一错误换个文件再发生。
- decision: 本期同一真实模板实例贯穿parser/validator/handler/host，结构化状态只读其明确字段，不能从否定句或自然词猜成阻塞；合法D-ID/N/A/事件时间、缺时间和依赖顺序保持一致。完整refs从当前材料和现有入口取得，不截尾、不硬选文件、不以dirty内容配HEAD；原件按现有attempt保留，原始与脱敏hash域分开。工具形状与错误传播准确，record是否会dispatch明确；缺必需材料在昂贵派发前暴露。已修半写/并发/复用、字段持久化、隔离、分发和性能保护继续生效，本期触及处才做针对性检查及必要生成物同步。已证usage嵌套读写错位本期最小修，缺值仍unavailable，不补0，不把缺遥测当代码失败。长会话交接简记当前目标、最新授权、执行卡、证据和停止条件；主会话只收有界摘要与引用，不引入token门槛。
- source_type/reference/exact_excerpt: U1详细计划、U3减重复、U5风险测试、U12全面对照；原复盘§3/§6/§7/§9及PM完整矩阵；RSH10已修保护核查。
- approval_binding: 当前补足处置已由U13整体确认；历史已修事实不代表本轮测试已通过。
- facts_and_constraints: attempt/并发/error等有历史修复及当前保护；refs截断来自历史临时脚本，不据此宣称生产现存同bug；usage writer与reader层级错位当前可定位。全仓隔离、全部bundle与性能未在本轮重新验证。
- Logic: 总原则不能防止已发生的具体遗漏 -> 把真实consumer、完整输入、失败路由和受影响验证放入原计划 -> 只修现存合同/本次退化 -> 避免全量重开和新的流程表格。
- choice_reason/impact: 覆盖原始问题但控制实现范围；材料、技能、当前相关consumer与定向测试同步，不建设通用治理平台。
- consequences_and_risks: 当前未证实的问题先用同一真实模板组合核对，不能先宣布仍坏或已好；受影响分发必须同步，不以“超范围”遗漏真实安装consumer。
- rejected_alternatives: 重跑所有历史测试、重造RED历史、所有性能操作统一新增1秒SLA、所有fixture叫live、并行改用户真配置：不采用。
- unresolved_items/owner: 工程计划对每个受影响consumer给现有路径、命令及预期。精确费用分析/历史回填、全宿主自动采集、全仓隔离审计、全产品性能工程、历史任务质量追认明确延期/非目标，不作为本期成功依赖；若发现本期真实consumer依赖其中某项，应先在本决策范围解决，不静默延期后承诺完整。
- Supersedes: 补足D1/D3/D5/D9；不覆写历史修复和原始错误。
- module: 执行可靠性与已修保护; requirement_ids: [R1, R2, R3, R4, R5, R6, U1, U3, U5, U12]; derived_from: [D1, D3, D5, D8, D11, D12, D13]; artifacts: [spec.md, plan.md, tasks.md]


D14具体保留项：review/bare稳定业务键不含随机attempt身份；复用的输入变化必须正确区分，不由confirm幂等代替验证。oracle场景、结果ref与evidence_path必须由真实consumer回读。unknown introduced_stage、path-only伪结果、fallback失败遗漏missing保持拒绝/缺口；相关检查总范围与skip缺口一并报告，不能只引用末次小测试。fixture不触用户真config/sink；本期不为验收执行真实用户配置迁移，未来必要迁移依已有授权、当前身份、备份与回读。PM08/11/16/22/38/61逐项对应，历史已修不冒称本轮重新通过。

### 本次补足的可观察验收

| scenario | 输入/动作 | 必须观察结果与禁止的假成功 |
| --- | --- | --- |
| SC-review-quorum | 按各role现有attempt.review_policy分别覆盖两组达标带失败、仅一组达标、两组有语义不达标、材料不一致；另测同源假身份与全失败空findings | 合法覆盖按来源和adapter认证；部分成员失败不自动全不可用，覆盖不足/全失败不clean；满足覆盖但serious未处置仍不算质量完成 |
| SC-outcome-chain | 当前真实review与实际step结果通过现有producer→bridge→run→fact→status | 合法outcome ref/hash确实被消费；不以bridge exit0或文件存在代替。移除重复手填证明后独立质量、修复和交接仍有真实来源 |
| SC-outcome-negative | 缺实际执行、错误source_id/family、跨task/hash、漏修serious、合法unavailable | 错输入明确定位拒绝；未执行/不可用各自真实保留，不能默认executed，也不冻结同task修复 |
| SC-e2e-full | 当前command/service真实场景、逐AC断言、认证actor、现有verify异源复核与真实确认 | 正式execute发布的当前E2E事实被status读为通过；只改stale过滤、手写加强fixture或整体退出0都不算 |
| SC-e2e-negative | 逐个移除actor/复核/确认，另给同源、错revision、空场景和真正不适用材料 | 缺哪项明确说哪项，错绑定拒绝，不适用不被旧missing激活；未知逐AC不被E2E聚合吞掉 |
| SC-e2e-nested | 用真实writer产物经过nested freshness；包括command/service类型及错误revision | 合法产物上下游一致；缺/错字段被拒，不只让上层handler通过 |
| SC-confirm-intent | 固定decision全文真实确认后细化spec；不同时间重试同意图；再真实改变决定 | 下游材料变化不制造方向续签；同意图同ref/首次时间，真正改变决定需新确认，原件不覆写；并发/半写不重造回复 |
| SC-reflection-reentry | 同stage判断A→A重试→实际修复后新判断B；另测executor缺失 | A原件不变，重试不重复lesson，B新原件，本次显式引用B且报告可查看；缺executor不能借A冒本轮完成 |
| SC-material-consumers | 同一合法模板含否定句、带原因N/A、当前合法ID、混合真实时间/缺时间及应有refs | 各真实consumer一致；自然文案不改变结构化状态；本阶段不要求未来材料已完成，缺引用不派发昂贵审查 |
| SC-execution-protection | 本期受影响record/模板/分发修改，隔离fixture与完整public终点 | 保留半写/复用/错误字段等现有保护；不污染真配置；必要bundle/install同步；不把内部函数计时代替完整终点，不扩全量回归 |
| SC-usage-truth | 当前canonical执行usage与缺失usage两输入经保留报告consumer | 正确读已有数据，缺失不补0；不宣称精确总费用或把遥测缺失当实现失败 |

这些可合并成少量跨真实入口的受影响验证，不是11个新gate，也不是本阶段已经执行的测试。首张适合的build-code卡先做最小真实入口检查，尽早发现生产/消费断边；build-plan只规划，不提前执行未来功能测试。外部live与受控fixture分别标注。

## Talk 与步骤历史

| step/talk_id | actual_result / 真实回复 | 队列变化 | 当前状态与来源 |
| --- | --- | --- | --- |
| 1 load-context | 读取约束、当前源码及 bootstrap 认证事实 | 先列五维缺口 | completed；原 decision-log step1 |
| 2 triage-scope | 核出 bridge snapshot 与 E2E 固定缺失分支 | 范围当时 open；后续由 U1–U11 收敛 | completed；研究定位下表 |
| 3 talk-r1 | 原3题；U1撤回模型升级/宿主比较，U2纠正时限，U3回答剩余简化轴 | 两题撤回非默认选A；剩余1题真实回答后未答0 | completed；源索引 U1–U3；早期推荐不变成决定 |
| 4 research-inputs | 三研究上下文及一次独立复核；两项表述问题修正 | 生成审查、测试、复盘、验收等7轴 | completed；下表研究证据 |
| 5 talk-r2 | 首组 U4–U7、次组 U8–U10；真实 ask→wait→reply→resume | 首组答4剩3；次组答3，未答0；用户否决减审查/复盘 | completed；源索引三组宿主调用 |
| 6 direction-advice | 首次无语义结果；修正材料后二组20条语义意见；canonical失败；四角色讨论 | 不因失败锁住后续讨论，不为clean重复发审 | incomplete；下节保留原始状态 |
| 7 talk-r3 | U11真实A，关键逻辑伪代码与I/O，普通函数细节留执行者 | 1题答完，未答0；不重复既有问题 | completed；源索引 U11 |
| 8 grill-with-docs | 七坏场景、五维及四退出检查，CONTEXT最小修正 | 零新问题，无伪造Grill ask/reply | completed；Grill索引 |
| 9 decision-log | 草稿经正式writer写入，D1–D14及覆盖索引 | detail后同材料澄清 | completed；本文件及run:draft实际exit0 |
| 10 detail-advice / 10b debate | 18条语义意见、四角色讨论与逐项处置完成；canonical导入失败 | 无新产品轴，条件Talk4不触发；不重复provider | advice语义完成/正式记录incomplete；下节原件 |
| 后续 | 最终覆盖审计、真实最终确认、阶段末复盘与交接未完成；detail语义处置已完成，canonical失败保留 | 不跳 build-spec/build-code | pending / 主会话 |

## 调研重点

| research_id/source | 重点与关键事实 | 处置 / 关联D |
| --- | --- | --- |
| RSH1 / `quality/evidence/research/52312eef097fac91b9791c5c0a277d5a4a9f8c6b853d7481ea1e6ffabdc93494.json` | 计划模板已有字段，真实输入/动作/consumer/预期才决定可执行性；外部 Spec Kit/Anthropic 官方方法参考未固定上游版本 | 采纳方法，不新增运行模板依赖/vendoring；D1/D3 |
| RSH2 / 同报告；`tools/host/workflowhub-stage-agent-bridge.mjs:130-131` 与 `runtime/stage/stage-runner.mjs:603-608` | bridge要求current，resolved允许旧review snapshot，内外合同冲突 | 必须修已有读写语义，原review不改；D8 |
| RSH3 / 同报告；`runtime/stage/stage-runner.mjs:1186-1216` | required E2E分支执行已有passed路径，但actor=null、独立复核/确认固定missing；仅源码核对 | 不把范围扩大为全部E2E失败；打通事实链；D5/D8 |
| RSH4 / `quality/evidence/research/1380257348a7129fded0864bd8c2846c0f26dce87cfe99ab4cbed8ce2075d523.md` | 独立复核只绑定初始报告`9cc032c237bcb5f1c6c7eeb649ef2733f563ae83ec1864c805c78e7fa013ec67`，指出E2E表述过宽、来源定位不完整 | 新报告已收窄/补引用；不冒称新hash获旧复核或质量PASS；D8 |
| RSH5 / S1 与 `/tmp/workflowhub-postmortem-analysis-20260907.md` | 抽样3旧任务质量incomplete，其中1 risk、2 normal；不能外推十多个任务同根因，无模型实验 | 作为问题线索，不归罪Luna、不追认历史；D1/D8 |

上述 quality 路径相对当前外置 task；报告hash沿用已核记录，不新增伪造hash。四角色产品/执行/质量真实性/简洁性均已讨论，先3并行后第4。独立上下文报告已核对字节 hash，属于讨论证据，不冒充 provider 认证：
- product：`quality/evidence/direction/a77adec4cfd1169b0ce73876e20b77b957b1254a515898cd79fba5e7520d07a5.md`；SHA-256 `a77adec4cfd1169b0ce73876e20b77b957b1254a515898cd79fba5e7520d07a5`。
- execution：`quality/evidence/direction/61e89ddf25bdd3fb32d1a0990866e4f3371dab6ad4bd9042b4181e93dcacee6e.md`；SHA-256 `61e89ddf25bdd3fb32d1a0990866e4f3371dab6ad4bd9042b4181e93dcacee6e`。
- integrity：`quality/evidence/direction/8d7853c92915310432882c7acfaf6a8bfd2466ed0b26cec2e16227f54bd5a7d5.md`；SHA-256 `8d7853c92915310432882c7acfaf6a8bfd2466ed0b26cec2e16227f54bd5a7d5`。
- economy：`quality/evidence/direction/f06d7554fa3bbef3ce292a5e53a938e25772271c81551a070ef6857f6f91260c.md`；SHA-256 `f06d7554fa3bbef3ce292a5e53a938e25772271c81551a070ef6857f6f91260c`。

## Direction advice 与审查处置

- 首次公共 `review --action=record` 已产生canonical attempt：`quality/reviews/attempts/ae86a015-2fec-4a2c-92a1-492e1c90870d/attempt.json`；结果为 `unavailable / MATERIAL_INCOMPLETE`，原因是材料缺 `objective_facts`，`provider_attempts=[]`、`result_ref=null`。CLI退出0只代表记录成功，不代表审查完成。
- 根因已定点核实：`runtime/review/stage-materials.json:55-58` direction由caller提供`raw_requirement`和`objective_facts`，runner生成`review_instructions`；不得用decision-log别名规避材料边界。原请求所用泛化材料键没有满足当前正式合同。
- 修复输入：只使用明确required/optional语义，真实用户答复作为原始约束，客观源码/研究事实作为objective_facts；不把整份历史decision-log作为方向盲审材料。材料fingerprint变化后允许再请求一次；首次没有语义advice，没有重复provider审查。
- 此事件作为当前任务的真实工具输入缺口保留；不能靠多写一段说明代替下游计划中完整可用输入示例。未为此修改生产代码或跳阶段。

- 修复材料后的请求实际启动红/蓝两组（pair `056aa9e1-3b27-45cb-9ce0-346f5f62879d`），而非此前口头所称单broker组。两组各3个broker completed输出，红11条/蓝9条语义意见；这不是WorkflowHub已认证6份独立质量结果。
- 本次公共记录命令exit=1，实际错误`TypeError: review result status must be available or unavailable`；canonical attempt/result/report未产生。producer支持`available-with-failures`而consumer只接受两态，精确本次公共聚合字节未保留，返回状态只能标unknown，不能把代码路径推断当原件。
- 已提炼语义事实：`quality/evidence/direction/1b0dd5f6626256ab9cb6676ddecc952da86cca31d0a6aaa536e22ec5eea82bb0.md`。含20条原finding标识/严重程度、runtime/material/digest和原始记录失败；它是补充证据，不是canonical review或PASS。原始provider流留broker私有。
- 取得语义意见后停止本track请求；不为补写canonical或追clean重复发审。四角色（产品、执行、质量真实性、简洁性）独立上下文讨论已完成；受并发容量限制先3角色并行、后第4角色，未改变阶段次序。角色建议不冒充异源provider结果。

下表 status 仅是**方向意见处置**：`fixed` 表示当前决定已补齐表达或明确纳入范围，不表示生产代码 repaired、测试通过或 canonical 写成功；`rejected_invalid` 表示建议越过已定边界。原始严重程度及失败不改写，无 accepted_risk。source/evidence_ref 全部为 `quality/evidence/direction/1b0dd5f6626256ab9cb6676ddecc952da86cca31d0a6aaa536e22ec5eea82bb0.md` 的对应完整 finding_id；owner=make-decision 主会话，consumer=当前决定及下游spec/plan，retain_or_delete=保留原件与派生处置。不得用此表冒充 canonical review。

| finding_id | original_fact / consequence | status | next_action / 关联决定 |
| --- | --- | --- | --- |
| red/kimi/coding/1 | 摘要缺verify失败路由，可能空转 | fixed | 引用已有U10，全部必要审查点适用；D10 |
| red/kimi/coding/2 | 摘要缺可观察成功口径，效果无法验证 | fixed | 用既有成功/修复/失败场景，禁模型或token gate；D1/D8 |
| red/kimi/coding/3 | spec/plan边界不清，可能重复写 | fixed | 明确语义与执行分工，一处定义其余引用；D1 |
| red/kimi/coding/4 | 拒绝备选无来源，易重议 | fixed | U4/U6保留真实否决与成本；D4/D6 |
| red/kimi/coding/5 | 四材料未命名，可能漂移 | fixed | 明确当前四文件，拒绝替代文件示例；D1 |
| red/antigravity/flash/1 | 指出不可用路由并建议解除用户确认 | rejected_invalid | 不可用部分按D10；解除确认/自动交付违反F7，拒绝 |
| red/codex/luna/1 | 计划不够可执行，建议字段准入门 | fixed | U11明确粒度，拒绝新增准入gate；D1 |
| red/codex/luna/2 | 摘要漏无倒计时约束 | fixed | 明示U2，不新增跨宿主控制面；D2 |
| red/codex/luna/3 | 未表达不可用分支 | fixed | 统一引用D10，保留缺口 |
| red/codex/luna/4 | 补漏分流未明 | fixed | 同步原计划/回对应owner；D7 |
| red/codex/luna/5 | 旧review/当前修复规则未定 | fixed | 原review不可变，当前修复关联原finding；D8，生产待实现 |
| blue/kimi/coding/1 | E2E actor/复核/确认固定缺失 | fixed | 明确本期必须打通，不能延期；D8，生产待实现 |
| blue/kimi/coding/2 | 缺失败路由与risk-close边界 | fixed | U10与F7，不自动风险交付；D10 |
| blue/kimi/coding/3 | 净减负未证明，保留复盘成本 | fixed | 列消除人工重复，不承诺净费用比例；D3/D6 |
| blue/kimi/coding/4 | 外部模板未pin可漂移 | rejected_invalid | 只作研究引用，保留可变局限，不新建运行版本控制面；D1/D9 |
| blue/codex/luna/1 | 未落实验收证据真实producer/consumer | fixed | 纳入必要链，字段工程细化，修不修不下放；D5/D8 |
| blue/codex/luna/2 | snapshot/version规则不一致 | fixed | D8明确语义；旧任务不迁移追认，生产待实现 |
| blue/codex/luna/3 | 审查不可用未表达 | fixed | D10全保留审查点适用 |
| blue/codex/luna/4 | 无截止问答遗漏 | fixed | D2真实答复，不代答 |
| blue/codex/luna/5 | 局部偏差与需求变化边界遗漏 | fixed | D7明确owner与边界，不整阶段重跑 |

## Grill 与文档结果

本步骤由主会话执行，不调用wh-review、不产生review事实。五类原始需求均映射现有决定：goal=R1/R2/R3/U1/U11；flow_or_surface=R4/R5/U4/U7/U8；data_or_state=R5/U3/U9；success_failure_acceptance=R1/R5/U5/U7/U10；constraint_non_goal_defer=R4/R6/U1/U2/U4/U6/U8。已确认内容不重新询问。

| 坏场景 | 本次核查结论 | 事实/决定依据 |
| --- | --- | --- |
| 计划写完后实际接口变化 | 执行者先核对卡内真实锚点；接口/行为变化不能按普通补漏吸收，回对应原材料解决。边界内局部文件/步骤补漏同步原计划后继续，不整阶段重跑。 | U9；宪法F3/F4（CONSTITUTION.md:26、33）；plan模板Verified anchors/Existing interfaces。 |
| 命令显示通过，但没有测到新增行为 | 不把命令退出0等同功能验收；计划给真实consumer、输入、目标断言和失败例子。修bug证明测试能抓缺陷，不为补过程顺序重造历史。 | U5/U7/U11；当前命令validator仅词形核验的研究证据。 |
| 审查发现问题，修复改变代码 | 原review不可变，当前真实修复及受影响检查关联原finding；写入和读取遵守同一规则。必要新风险才补相应检查/审查，不能为了clean标签重审。 | 宪法F4/F9（CONSTITUTION.md:33、68）；U4；bridge/runner实际冲突证据。 |
| 审查已返回但结果记录失败 | 分开报告已取得意见与未成功记录；保留真实错误，不重复调用provider换取同一意见；修工具合同，正常讨论和同task修复可继续。 | 本次实际方向审查记录TypeError；U10；wh-review retry边界。 |
| 外部审查不可用 | 有限尝试后停止空转，保留未审范围，继续独立工作并给出补审办法；不能把完整质量改为通过或自动授权风险交付。 | U10；宪法F4/F7（CONSTITUTION.md:33、54）。 |
| 阶段复盘记录失败 | 每阶段复盘仍要做，事实采集与模型判断分开；失败/缺失真实披露，不反转代码结果。固定不可变路径的重复观察冲突需在本期必要工具范围解决。 | U6；runner:2086-2097、2240-2243已隔离复盘失败。 |
| 用户中止或只答一部分 | 停止用户要求停止的工作，保留现有材料和真实结果；未答问题保持未答，不默认选择；未授权不合并、归档或清理。继续时按当前材料及已有事实处理，不新造恢复许可证。 | U2；宪法F3/F7（CONSTITUTION.md:26、54）；宿主真实部分回复协议。 |

- 本轮没有新增需用户决定的高/中影响轴。上述场景都有真实已确认边界或当前宪法/代码事实，因此Grill采用零新增问题的事实核查，不为完成形式重复确认；不伪造Grill ask/reply事件。
- 外部接口已核真实定义：公共review请求已实际执行，输入契约和记录状态冲突均有当前源码/结果；既有stage接口来自当前实现，source/task身份仍显式，不改成扫描宿主历史。后续只细化已定修复的字段/实现。
- 唯一命名已明确：decision-log.md/spec.md/plan.md/tasks.md、五阶段及既有公共七类行为继续使用；不新增权威材料或状态系统。
- 失败语义已明确：真实行为失败、错误来源写拒绝、外部不可用、过程诊断缺失、主动中止分别处理；没有隐藏自动risk-close。
- 范围已明确：本期同时处理计划可执行性、重复劳动和必经接口成功链；保留指定审查/复盘；排除模型机制、页面重设计及历史质量追认。具体函数/字段归工程细化，不把“是否实现成功链”下放。

### Grill 文档结果与退出检查

- CONTEXT.md：changed。按U7最小明确build-code负责完整功能实跑，verify-code负责独立审查及疑点复验；不把verify的“验收”别名继续混用为上游全部验收工作。实际文件：认证worktree根CONTEXT.md“build-code/verify-code”两项。
- ADR：not-needed。三判据：难以反转=false（沿用既有阶段/四材料/事实来源，不引入新的持久体系或迁移）；无背景会意外=true；有真实取舍=true。因此不另建ADR，决定与依据留当前decision-log。
- 既有冲突：ADR0010历史“暂停”口径按当前宪法F4解释为不冻结同task修复，不重写历史ADR；ADR0023仍是Draft，不当作新增已接受约束。
- 四项退出检查：external_interfaces=pass（真实入口与源码定义）；canonical_names=pass（沿用当前权威名称）；failure_semantics=pass（U5/U9/U10与上述场景）；scope_boundaries=pass（U1/U4/U6/U8及本期必要成功链）。这些是需求核查结论，不是代码测试或质量PASS。


## Detail advice 与处置（step10）

- 唯一detail请求bare exit0，完整公共result `quality/evidence/detail/e4a95db23145a4b88e7329e148c491f372be9086f00e91120269fc890dbabf04.json`；实际status=`available-with-failures`，18条语义finding，红蓝role_results均available。
- 同一原件error=`REVIEW_NO_SEMANTIC_RESULT`却称无语义，与实际findings/role状态矛盾；原字段并存保留，纳入D8已有聚合/消费合同修复。不据此抹掉意见，也不倒填旧direction未知聚合状态。
- grok两组health失败、pi/v4flash两组身份校验失败；kimi/antigravity/codex语义输出已返回。失败覆盖与可用意见均不改写为全provider通过。
- 仅以完整result通过公共review:record导入一次，exit1：`review result status must be available or unavailable`；错误原件 `quality/evidence/detail/c9acbb2d63ab94010f5b4d2be42226801788f72b0de06ee6b6f81f86c5ce6ee5.log`。无新canonical ref；没有改status、删除provider或重复请求。
- 审查材料02-approved_direction与03-draft_spec_or_acceptance都是本任务唯一decision-log的有意审查投影；02键名来自wh-review合同，不能当作已取得整体批准或第二份工作材料。
- 以下detail#编号为原件findings数组的1-based位置，原始severity/provider/role与意见保留；fixed仅指本决策表达/范围处置，不表示代码修复或质量通过。无accepted_risk。

| finding | 原severity / 来源 | disposition | 处置依据 |
| --- | --- | --- | --- |
| detail#1 | major / red/kimi/coding | fixed | 研究编号改RSH，宪法引用明确CONSTITUTION.md；F9实际存在，拒绝其不存在的子结论 |
| detail#2 | minor / red/kimi/coding | rejected_invalid | 实际20唯一行=红11+蓝9；独立核数，原意见保留不改数字 |
| detail#3 | minor / red/kimi/coding | fixed | D2本条内写明仅本次问答，不扩展宿主超时控制面 |
| detail#4 | minor / red/kimi/coding | fixed | 新增SC-plan-deviation；问答工具不在本期改动范围，不增全局无截止时间功能 |
| detail#5 | major / red/codex/luna | fixed | 补必要成功链行为语义；目标标准明确属下游，工程字段与伪代码按既定stage分工 |
| detail#6 | major / red/codex/luna | fixed | 补SC-partial-review与SC-review-write-failure；可用性、覆盖、写入、质量语义分开，不新建状态体系 |
| detail#7 | major / red/codex/luna | fixed | 补既有预算/变化前提/有语义停止规则及owner；拒绝新reopen/risk-close恢复状态机 |
| detail#8 | minor / red/codex/luna | rejected_invalid | 02/03为同一权威decision-log的审查材料投影，不是两份工作真相；补清此关系 |
| detail#9 | major / blue/kimi/coding | fixed | R3明确保留用户前期高能力/执行Luna意图；不重问模型使用，仅排除切换验收和机制扩围 |
| detail#10 | minor / blue/kimi/coding | fixed | D2分别绑定U2、R6和make-decision技能，不把技能规则冒作U2批准 |
| detail#11 | major / blue/kimi/coding | fixed | D8仍待最终整体确认；在确认卡明确跨模块范围与尚未验证的代价，不先实施 |
| detail#12 | major / blue/kimi/coding | fixed | D6/RISK2明确报告consumer核对与SC-reflection保留约束 |
| detail#13 | minor / blue/kimi/coding | fixed | D2 decision显式大白话说明选项、后果、风险 |
| detail#14 | minor / blue/kimi/coding | fixed | RISK5明确历史多数任务同因未证，不以当前样本代表历史总体解决 |
| detail#15 | blocking / blue/codex/luna | fixed | 同第6条补产品语义；旧direction状态unknown原样保留，detail实际状态单独记录，不提前新schema |
| detail#16 | major / blue/codex/luna | fixed | 补build-code/verify责任矩阵与失败owner；verify必审证据关联，疑点复跑，不加第二全量验收 |
| detail#17 | major / blue/codex/luna | fixed | N4/N5区分局部选择与整体pending，最终批准未伪造；拒绝增加draft/approved/handoff_ready状态机或新gate |
| detail#18 | major / blue/codex/luna | fixed | 补已实际完成worktree/bootstrap事实及错绑定失败边界；不新增公共preflight节点 |

四角色独立上下文讨论引用（产品角色曾整理草稿，仅作产品讨论，不冒充独立质量来源）：
- product：`quality/evidence/detail/9350ce833d3aed9e6aea20121b5a5e36383dedfb41ca27c944852f8d8d1ee5b6.md`。
- execution：`quality/evidence/detail/c51d540e72af9d300e9997d6afa95590e1664d6c2726888935ed7572778befd3.md`。
- integrity：`quality/evidence/detail/f0f6a6262a5ee7ee777d35f66d222e1fbe876879cafc5564db26238ae4176a40.md`。
- economy：`quality/evidence/detail/9c7c1b5fbb61a4660699d3716d570abdc075f71f035b23c42340cdfc21fd7369.md`。

四角色均未发现新增产品选择。上述修订是已答U1–U11/现有治理的表达与可观察语义补足；条件Talk4 not_applicable。D8总体范围仍由既定最终确认明确批准，未把讨论代作批准。

## UI applicability

```json
{
  "result": "non_ui",
  "sources": {
    "raw_requirement": {"result": "non_ui", "source": "U8", "fact": "用户明确不新增或重新设计页面，保留现有报告生成与查看。"},
    "project_inventory": {"result": "non_ui", "source": "README.md:3-38; package.json:6-24; tools/cli/build-reflection-page.mjs:267-306", "fact": "主要入口为CLI和skills；已有生成报告页面consumer，存在不等于本次改页面。"},
    "planned_or_changed_frontend_fact": {"result": "non_ui", "source": "当前Talk方向U8及本节范围", "fact": "当前拟议改动是计划/执行指引/必要工具与证据消费，不新增前端路由、页面布局或交互；保留现有查看能力。"}
  },
  "source_reasons": ["三来源无本次前端改动信号；如果后续实际范围涉及页面/交互变更，必须重新计算。"]
}
```

## 收敛检查

| item | 实际用户答复依据 / 材料引用 | 收敛结论 |
| --- | --- | --- |
| target | U1/U3/U11真实回复；D1/D3 | 可执行详细计划降低临场设计与重复拼装；不承诺模型可靠率/费用比例。 |
| scope | U4/U6/U8/U9/U10；R1/R5及D4–D10 | 保留各Phase/verify审查和各阶段复盘；修必经成功链；不改页面，不做模型机制或历史追认。 |
| solution | U11选A、U4/U6真实否决；D1–D14 | tradeoff：前期关键逻辑更完整，但不复制普通函数代码；审查/复盘成本保留。rejected：模型机制、减少审查/复盘、自动交付。open disposition：无未答产品轴；detail语义处置已完成；最终确认pending，工程字段由既定owner细化。 |
| acceptance | U5/U7/U10真实回复；Grill七场景及D5/D8/D10；无新需求 | scenario：正常任务、finding修复、外部不可用、错任务/原件、复盘报告。data source：实际执行/actor、原review、当前修复/受影响检查、真实确认和阶段观察。pass：正常/修复的真实结果可合法写读，错源拒绝，不可用有限停止并明确未完成，报告可生成。fail：假绿、固定missing阻断正常证据、篡改review、无限重试、越权确认或命令未覆盖目标行为。 |

## 非目标、拒绝方案与延期交接

- 不做模型切换验收、自动升级、宿主对比或模型能力实验；不新增/重设计页面；不减少每Phase审查、verify独审或每stage复盘。
- 不新建runner、公共stage、第五权威材料、第二事实系统、永久兼容桥或历史runtime分支；不迁移/追认旧任务质量；外部方法参考不成为运行模板依赖。
- 不只改close状态，不靠补历史或伪造身份/来源收尾；不解除用户确认，不自动风险交付。逐条拒绝理由及真实来源见D1–D14。
- 本期必要合同修复不能延期后仍宣称目标完成。具体实现步骤、字段和风险测试由既定下游工程细化，属于正常阶段分工，不是遗留产品选择。

| risk/deferred_id | 内容与后果 | owner / trigger |
| --- | --- | --- |
| RISK1 | 计划过长/重复代码造成失同步 | build-plan：按U11粒度并引用唯一权威 |
| RISK2 | 删除项存在真实consumer，误删质量保护或现有报告 | build-plan/build-code：核实报告生成/查看及审查consumer，保护D4/D6/D9；无证据不删 |
| RISK5 | 已核缺陷与历史十多个任务是否同因未验证 | 仅以本期场景验收，不宣称解决所有历史失败；不扩展历史追认 |
| RISK3 | 外部不可用使质量暂时不完整 | 相应stage：有限停止与明确补审，不假绿 |
| RISK4 | 已核源码缺陷与状态合同尚未实施修复 | build-code/verify：真实针对性结果，不把方向补足当实现fixed |
| DEFER1 | 历史任务迁移/质量追认、模型/页面扩展 | 本期非目标；未来独立需求才重新决定，无本期完成依赖 |

### 质量边界

- 质量事实：测试、review、finding处置、AC结果、复盘各自真实；broker completed不等于canonical认证，当前direction-advice仍incomplete。
- 推进资格：四材料存在可读即可同task继续补充/修复；review、accepted、确认、审计不造额外准入许可证；本任务仍按用户要求先完成当前阶段。
- 完成判据：真实交付、风险测试、逐AC、独立审查事实与人类交接必须按实说明；方向补足、CLI exit0、物理close均不等于质量通过。
- 不可逆授权边界：方向/计划/验证三处正常确认不顺带授权commit/push/merge/archive/cleanup；按真实明确授权执行，未答不当授权。

## 最终确认与未完成项（U13）

- 状态：用户整体确认已取得。U13原文“确认补齐后的决策，完成 make-decision 收尾。”；call_00X5dKnJBkZCcswbc4uw6bU9 / item0。U12此前要求补查，不能当接受；完成补查后才取得U13。正式confirm与后续收尾记录按真实工具输出保留。
- 未完成：两track canonical记录（既有失败保留）、step12阶段末spec-analyze、step13正式结果发布与step14复盘。step11真实确认已完成。owner为主会话；step9及detail语义意见/处置已完成，不重复发审。
- 未答产品轴：0；四角色detail讨论未发现需新增选择，条件Talk4不适用；U13整体确认已明确包含D8/D11–D14跨模块成功链及成本/尚未验证。生产实现、测试和实际正常成功链均尚未执行。
- decision-correction-appendix.v1：not_applicable；这是首次待整体批准的D1–D14，不存在被本次替换的旧批准决定。原候选、撤回及真实回复继续保留，不伪造附录。
- Supersedes：本草稿整合当前视图，不覆盖旧消息、失败、review或认证材料字节；候选被撤回的历史在Talk表保留，不把推荐写成曾批准决定。

## 阶段末大白话摘要（当前草稿）

前期把目标、行为和关键逻辑讲清，计划写到能执行；普通函数细节留给实现者。删重复整理，不删用户保留的审查、测试和复盘。build-code完成预定功能验收，verify独立审查；局部遗漏在原边界补，需求/接口变化回原材料。必要工具合同本期修，外部失败如实停重试；用户确认和交付授权保留。代价是前期设计与审查复盘成本仍在，不能承诺总体省费。无页面或模型机制扩展。U12补充核查后增加D11–D14，明确结果链、E2E、批准/复盘生命周期与已修保护，PM64项均有处置；整体批准仍待重新确认。CONTEXT职责已最小修正；正式审查记录失败仍保留。

## 最终确认处真实追加要求（U12，尚未批准）

- 来源：call_sWkkAB2J9aV7dLGWG2Omxwuq / questionItemId item0。用户原答复：“请再次仔细对照原始需求文件‘/Users/Hugh/Downloads/workflowhub-review-flow-repair-full-session-postmortem-20260907.md’，看看所有问题和原始需求是否都有决策和方案进行解决？包括审查失败和部分成功不算通过的问题有没有调研和方案？e2e的问题？缺少 code_review、stage_outcome的问题？”（原消息中文双引号路径，此处引号为排版投影。）
- 处置：这是补充核查要求，不是accepted；step11仍pending。先重读原件完整问题清单，逐项对照当前决定、解决路径和验收场景，尤其审查部分成功、E2E、code_review/stage_outcome真实生产/消费。发现未定范围时再做增量决定，不把泛称D8当全部已解决，不转build-spec。
- 实际动作：主会话重读第5/9节，三个有界独立上下文分别核查完整覆盖、review/outcome、E2E现有生产链；当前无生产修改、测试或新增provider请求。

## U12补充调研来源

以下报告已保存不可变字节并核验hash；它们提供源码/原件事实及设计建议，不是实现测试或provider质量通过：
- RSH6：`quality/evidence/research/dc812895562fa09af423c6ffd56a63f832411ac3ec741c3a8582dd3026741cea.md`。
- RSH7：`quality/evidence/research/83a07d16c00e83f8b1066ae81455c71f153a54f4456a503028964c23e624c953.md`。
- RSH8：`quality/evidence/research/b4d1ee2e7ca1c836531f84b27a58404a0b13af2192373ccec17ebee069b7f4f7.md`。
- RSH9：`quality/evidence/research/06a98f80e0407e5f54035122219661201d4057d3b71a4e60cc92b0e523cab18a.md`。
- RSH10：`quality/evidence/research/b3e3b9b528f8b36570b06a384c411b45bfeca20344d973f06704b932a6e2e012.md`。

## PM01–PM64 原始复盘逐项处置（U13整体批准）


owner约定：`spec/plan`=build-spec定行为、build-plan绑定现有接口/输入输出/针对性检查；`code`=build-code实施与实跑；`verify`=verify-code独立核对；`stage`=发生该行为的当前stage主会话。S01–S12为下表原始场景，C01–C05为组合验收，不是新增流程节点。

| PM | 原件行 | disposition：具体处置 | owner | 决策 | 场景 |
|---|---|---|---|---|---|
| PM01 | 23,139,514–524 | 本期必修：接通actor、独立复核、确认、reader及新execute当前事实 | spec/plan→code；verify | D12 | S01/S09/C02 |
| PM02 | 24,131–135,367–373 | 本期必修：原review→当前修复共用校验；旧review不改clean | spec/plan→code；verify | D8 | S02/S03/S04 |
| PM03 | 25,106,208,217–242 | 本期必修：必要生产消费链全部列owner；不再以NG排除兑现目标所需集成 | spec/plan | D8/D11/D12/D13 | S01/S02/S06 |
| PM04 | 26,82,107,238 | 组合核实：同一合法模板贯穿真实consumer；范围内不一致修原入口 | spec/plan→code | D1/D14 | C01 |
| PM05 | 193,217–242 | 本期必修usage嵌套层级；明确延期精确费用、历史回填与全宿主采集，不零填 | spec/plan→code；未来独立需求owner | D6/D14 | C03 |
| PM06 | 193,217–242 | 组合核实blocked/reused全部受影响consumer；保留已有修复，不增加状态分支 | spec/plan→code | D14 | C01/C03 |
| PM07 | 81,197–198 | 已修保护：空E2E/route与owner规则在实际执行组合验收，零场景不假绿 | code；verify | D12/D14 | S09/C02 |
| PM08 | 81,194,197–198,202 | 已修保护：bare稳定业务身份排除随机attempt输入，输入变更不误复用 | code | D14 | C03 |
| PM09 | 82,202,205,212 | 已修保护：D-ID同一合法样本贯穿parser/validator/handler | code | D14 | C01 |
| PM10 | 82,197,203 | 已修保护：带原因N/A与合法不适用语义一致 | code | D14 | C01 |
| PM11 | 82,205–207,385 | 组合核实：场景/oracle/事件/证据ref实际关联，已有修复保留 | spec/plan→code | D1/D12/D14 | C01/C02 |
| PM12 | 83,199,241 | 本期必须满足并组合核实：结构化状态决定机器分支；仍存在自然否定句误判则修原parser，不靠改文案避错 | spec/plan→code | D14 | C01 |
| PM13 | 84,200,232 | 本期必修：批准内容与确认/纯过程元数据沿现有scope分域，消除自指 | spec/plan→code | D13 | S08 |
| PM14 | 85,200,232,436 | 本期必修：同意图同身份confirm幂等，变更明确处理，旧件保留 | spec/plan→code | D13 | S08 |
| PM15 | 86,206,272 | 已修保护：timed/untimed混合与缺遥测分域；不承诺全宿主自动采集 | code；stage | D6/D14 | C03 |
| PM16 | 87,275,432 | 已修保护：跨task、未知source/introduced_stage、path-only结果不fail-open | code；verify | D11/D14 | S04/C01 |
| PM17 | 88,280,358 | 已修保护：半写、锁、并发归属与失败重试，只跑受影响路径 | code | D14 | C03 |
| PM18 | 88,280 | 已修保护：complete复用不被partial掩盖，指纹改变不误复用 | code | D14 | C03 |
| PM19 | 88,281,358 | 已修保护：error_code/report_ref/sink身份/all-fail持久与回读一致 | code | D8/D14 | S06/C03 |
| PM20 | 89,116,269,271 | 已修保护及执行纪律：受影响bundle/catalog同步，安装consumer验证 | code | D14 | C04 |
| PM21 | 90,278,281,324 | 已修保护及执行纪律：fixture注入隔离真config/sink，针对实际泄漏点 | code | D14 | S10/C04 |
| PM22 | 282,324 | 已修保护：migration当前绑定；真实迁移按实际需要备份回读，不借测试改真配置 | code；stage确认已有授权范围 | D14 | S10/C04 |
| PM23 | 91,114,277–278,288 | 执行纪律：按风险证明敏感性，倒序只一次真实核对，不回滚他人工作补历史 | code | D5/D14 | C05 |
| PM24 | 92,115,284,325 | 执行纪律及已修保护：完整refs，不截尾/硬编码；缺件零dispatch | code；stage | D3/D14 | S11 |
| PM25 | 92,202,284,632 | 执行纪律：真实当前内容身份，不将dirty字节冒充HEAD；保护并发修改 | code；stage | D11/D14 | S04/S11 |
| PM26 | 93,289,291,325 | 已修保护：受影响预检检查完整保存/回读性能终点，沿已有AC不造新指标gate | code | D14 | S11 |
| PM27 | 94,72,291 | 执行纪律：既有attempt标识保存每轮原件，不覆盖、不新建store | stage；code维护已有写入边界 | D8/D14 | C03 |
| PM28 | 95,285–286,326,387 | 本期必修：partial、有效覆盖、成员失败、serious处置正交；绑定既有阈值来源 | spec/plan→code；verify | D8 | S05/S03 |
| PM29 | 387,434,716–721 | 本期必修/保留：全失败空findings不是clean；原失败事实可读 | code；stage | D8/D10 | S06 |
| PM30 | 117,285,287,290 | 本期必修raw状态兼容；执行纪律：修记录后消费原结果，不重发同意见 | code；stage | D8/D10 | S05/S06/C03 |
| PM31 | 117,292,556–562 | 执行纪律：按既有预算来源/范围/有效值停止，停止外调不停止本地修复 | spec/plan；stage | D10 | S06 |
| PM32 | 97,212,356,536–540 | 本期必修：不可变新观察显式ref；每stage复盘非每attempt；缺judgment如实 | spec/plan→code；stage | D6/D13 | S07 |
| PM33 | 98,128,145,274,353–355 | 本期必修：真实review及修复事件进入outcome链，移除重复手填executed/名称条件 | spec/plan→code；verify | D11 | S01/S02/S06 |
| PM34 | 141,530–534 | 本期必修：source身份共享校验、正确输入例；错误只拒本次、修正可再交 | spec/plan→code | D11 | S04/S01 |
| PM35 | 145–147,391–398,446 | 本期工程安排：首张适合code卡真实producer→bridge→run→fact→status | plan→code；verify | D11 | S01/S02/S06 |
| PM36 | 99,123–128,359,594,616 | 执行纪律：质量/可工作/物理close分开，completed是结果，不新risk许可 | stage | D10/D14 | S12 |
| PM37 | 100,268 | 执行纪律：就地维护当前目标/最新授权/下一步/证据，不恢复旧停止点 | stage | D3/D7/D14 | C05 |
| PM38 | 39–41,100,361,383,385 | 执行纪律：聚合实际受影响检查与逐AC缺口；skip不当替代覆盖，不只报最后小测试 | code；verify | D5/D14 | C05 |
| PM39 | 112,271,350,617 | 执行纪律：失败与未完成事实不被“已完成”措辞覆盖 | stage | D5/D10/D14 | S01/S06/C05 |
| PM40 | 113,275,322 | 本期验收安排：按实际改变覆盖真实成功/失败consumer，局部GREEN不替代总目标 | plan→code；verify | D5/D14 | C01/C03/C04/S11 |
| PM41 | 194,197–198 | 执行纪律：关键语义交正确阶段澄清，普通函数细节留执行者 | spec/plan；stage | D1/D2/D7 | C01 |
| PM42 | 201–202,212 | 本期必修与纪律：实质内容和过程身份分开，不因随机元数据反复发布/续签 | code；stage | D3/D13/D14 | S08/C03 |
| PM43 | 209 | 执行纪律：结构化结果核对、失败逐层传播，末命令exit0不吞前错 | code；stage | D14 | C03/C05 |
| PM44 | 210,645 | 执行纪律：重活给摘要与refs，原始大包保文件，不新增token gate | stage | D3/D14 | C05 |
| PM45 | 211,233 | 执行纪律及组合核实：原始/脱敏身份域明确，不误对hash也不全局豁免 | code；stage | D13/D14 | S04/S11 |
| PM46 | 270,283 | 执行纪律及组合核实：真实入口可用、依赖顺序真实；不把补材料充作执行 | plan→code | D1/D7/D14 | C01/C05 |
| PM47 | 276,288 | 执行纪律：RED失败断言必须绑定目标行为，无关失败不计有效验证 | code；verify | D5 | C05 |
| PM48 | 293,361,600,688–710 | 执行纪律：读取当前绑定task根与现有事实；旧初始化摘要不是现状证明 | stage | D14 | S12/C05 |
| PM49 | 351 | 执行纪律：按真实入口判断是否dispatch，record不是无外调承诺 | stage | D10/D14 | S06/S11 |
| PM50 | 352 | 执行纪律及组合核实：计划采用当前合法公共命令/I-O例，不新增行为类别 | plan→code | D1/D9/D14 | C01 |
| PM51 | 357,556–570,633,652–658 | 执行纪律：先完成已授权可修工作；新serious风险具体决定，不重复旧授权 | stage | D7/D10 | S03/S12 |
| PM52 | 362–363,398,664–665 | 执行纪律：一次有限核对不是普遍close gate，物理成功不代表质量通过 | stage | D10 | S12 |
| PM53 | 59,65–73,484–487,688–721 | 明确延期历史补证/精确成本/全量10任务统计；非目标历史质量追认 | 未来独立研究owner；当前stage披露边界 | D9/D14 | C05（仅披露核对） |
| PM54 | 456–461,636,672–676 | 非目标：新复杂度/成本gate或一概取消验证；执行纪律保留真实收益判断 | stage | D9/D14 | C05（范围核对） |
| PM55 | 145–147,648,676 | 本期实现既有host真实链；明确延期全宿主自动采集，不新增唯一执行器 | spec/plan→code；未来独立需求owner | D9/D11/D14 | S01/S06 |
| PM56 | 44,640,716–721 | 执行纪律：主会话核对不算独立clean；review来源、范围、处置真实 | verify；stage | D4/D8 | S02/S05/C05 |
| PM57 | 631–648 | 非目标全仓宪法审计/历史全根治宣称；只报具体证据支持的范围 | stage | D9 | C05（范围核对） |
| PM58 | 734–739 | 本期完成要求：普通成功、修复后成功、真实不可用三链，物理close不顶替 | plan→code；verify | D8/D11/D12 | S01/S02/S06 |
| PM59 | 714 | 已修保护：公共入口必要字段贯穿consumer，不推定当前仍缺 | code | D11/D14 | C01/S01 |
| PM60 | 714 | 已修保护：现有可信来源认证，不信调用方自报身份 | code；verify | D11/D14 | S04 |
| PM61 | 714 | 已修保护：fallback失败进入真实missing，不因fallback假绿 | code | D10/D14 | S06/C03 |
| PM62 | 714,718 | 已修保护：真实回复正确消费、不重复确认；确认不顶替code_review | code；stage | D12/D13 | S01/S08 |
| PM63 | 714 | 已修保护：packet来源验证保留，不以临时拼包替代 | code | D11/D14 | S04/S11 |
| PM64 | 714 | 已修保护：本stage不要求未来plan/tasks已完成，按当前材料职责消费 | spec/plan→code | D1/D14 | C01 |

## 十二项原始场景与完成判据

| 场景 | 原件行 | 候选完成判据 | 决策/PM |
|---|---|---|---|
| S01 普通任务 | 429 | 真实producer/独立review/执行事实经bridge→run→fact→status可读；E2E适用时actor/确认/复核完整，不手填执行 | D11/D12；PM01/33/34/35/58/59/62 |
| S02 审查后修复 | 430 | 原review不变；当前修复及检查可合法消费，无默认第三轮审查 | D8/D11；PM02/33/35/56/58 |
| S03 漏修/无证据 | 431 | 缺修复/检查保留finding；允许同task继续修复；覆盖满足不抹serious | D8/D10；PM02/28/51 |
| S04 错task/source/hash/范围 | 432 | 字段级拒绝错误写入；不污染正确事实，修正后可交；来源/hash保护不删除 | D8/D11/D13/D14；PM16/25/34/45/60/63 |
| S05 有效异源+成员失败 | 433 | 依既有策略显示真实覆盖，partial/失败/serious处置分别可读；不说全失败或全通过 | D8；PM28/30/56 |
| S06 全部外部不可用 | 434 | 全失败空findings不clean；失败持久可读；预算内有限停止，可做独立工作，质量不冒完成 | D8/D10/D11；PM19/29/31/35/39/49/55/58/61 |
| S07 多次同阶段收尾 | 435 | 旧reflection不变，新真实观察显式ref可消费；缺judgment如实；不强制每attempt总结 | D6/D13；PM32 |
| S08 批准与冻结 | 436 | 同意图幂等，内容变化明确处理；批准含全文，不回写确认制造自指 | D13；PM13/14/42/62 |
| S09 stale及当前E2E | 437；补514–524 | stale不激活不适用要求；适用的新execute真实执行与reader成功链可达 | D12；PM01/07 |
| S10 隔离与迁移 | 438 | 受控测试不依赖/修改用户config/sink；需要的真实迁移另有当前身份、备份及回读 | D14；PM21/22 |
| S11 完整refs/性能终点 | 439 | refs完整可追溯；缺件零dispatch；性能含真实保存/回读，沿受影响既有AC | D14；PM24/25/26/45/49/63 |
| S12 物理close | 440 | 有真实授权与安全身份才执行具体物理动作；质量缺失如实，completed不是前提，不自动扩风险 | D10/D14；PM36/48/51/52 |

补充组合验收：C01=同一合法模板贯穿实际consumer（D-ID/N/A/结构status/来源/当前阶段依赖/命令）；C02=command/service→逐AC断言→actor→嵌套结果→verify复核→status；C03=usage及受影响事件/attempt成功、失败、复用的保存回读；C04=fixture隔离与受影响bundle/install/migration；C05=实际执行记录及收尾报告核对。只组合已有受影响检查，不新增公共gate、不全量回归；无需外部能力的fixture与真正live结果明确标注。

未完成与延期：U13整体确认已取得；D8/D11–D14尚未实施。当前缺陷不明的保护项在组合验收前保持未核，不因列入矩阵就写passed。历史任务质量追认、全仓审计、新控制面非目标；精确费用/历史usage回填/全宿主自动采集/缺失历史会话补证延期至独立需求，不能把这些延期反向当作本期正常成功链缺失的借口。

## 补充研究独立核对处置

- RSH11：`quality/evidence/research/5b2f1f746ab9101b6caa16d6adf34c56d4f7f7f0661eb3fd879570de930e23d9.md`，独立上下文抽核五份报告与D11–D14，不是provider正式质量结果；未测试、未调用provider。
- 第1条采纳：明确同次verify覆盖实现与E2E，不直接额外dispatch现成E2E函数；第2/3条在PM08/11/16/22/38/61及D14补明确落点；第4条在D8/SC-review-quorum补paired四分支；第5条D11保留原审查视角。第6/7条确认范围边界，不新增gate或第三轮验收。
- 原报告保留，不伪称对之后修订字节再次独立通过；上述为主会话逐项登记，当前整体仍pending。

## U13最终确认事实与收尾边界

- 真实问题：是否确认补齐后的完整范围：本期处理审查结果、code_review/stage_outcome、E2E全链、批准/复盘生命周期及必要执行合同；保留各Phase审查与每阶段复盘，历史已修项只做受影响保护，精确费用/历史回填/全宿主自动采集等明确延期？确认后完成本阶段收尾，当前审查记录失败仍如实保留。
- 真实答复：“确认补齐后的决策，完成 make-decision 收尾。”；questionItemId=`["request_user_input_async","call_00X5dKnJBkZCcswbc4uw6bU9",0]`。主会话实际等待后读取答复，恢复收尾，未代选。
- 批准范围：D1–D14、PM01–PM64明确处置及原12场景映射；批准不代表实施、测试、provider全绿或正式质量记录成功，不授权本阶段修改生产代码或物理交付。
- 本文件先记录真实答复再走公共confirm，工具给出的真实ref/hash存在既有执行事实中，不把自身新hash反写正文制造自指。后续实际spec-analyze、run、reflect结果保留在既有质量/执行记录并在阶段交接披露；如当前旧consumer仍要求自指正文，保留真实失败，不伪造当前hash。
