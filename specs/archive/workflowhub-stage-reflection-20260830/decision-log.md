---
version: draft
task: workflowhub-stage-reflection-20260830
stage: make-decision
---

# stage-reflection 复盘器 — 决策日志

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 | 按标准 WorkflowHub 开始复盘任务，从 make-decision 开始，不跳阶段、不依赖 build-spec 补需求 | 用户本会话："请按标准 WorkflowHub 开始这个复盘任务吧，M15退役我已经在其他会话进行了。从 make-decision 开始，不要跳阶段，也不要依赖 build-spec 补需求" | 执行约束 |
| R-002 | make-decision 期间共同梳理：完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项 | 用户本会话："先基于原始需求，在make-decision的过程中和我一起仔细梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项" | 执行约束 |
| R-003 | Talk 用大白话说明选项、后果和风险；decision-log 记录原始需求、关键事实、选择、理由和延期交接 | 用户本会话："Talk 请用大白话说明选项、后果和风险；decision-log 记录原始需求、关键事实、选择、理由和延期交接" | 执行约束 |
| R-004 | 复盘器自动触发：每个 stage 结束时自动总结复盘（不是 close 时；例：spec-analyze 的位置） | 用户："我希望还是不要在close的时候做，因为你在close的时候，你根本不知道前面几个stage发生了什么事情。所以我希望还是在每个stage结束的时候，比如说在用那个spec-analyze这个技能的时候，它就自动地进行一些总结和复盘" | 方向已定，挂载细节待 Talk |
| R-005 | 判断层输出放在任务目录 quality/ 下，随任务归档 | 用户："我希望判断层输出的存放位置放在任务目录 quality/ 下（随任务归档）" | 已确认 |
| R-006 | M15 全局监控网页保留：放每任务判断层输出结果 + 最近最重要的待更新优化问题（overall pending），作为 M16 数据输入 | 用户："M15那个全局的数据监控网页也可以保留，就是用来放这每一个任务的判断层输出结果，以及最近总结出来最重要的需要更新优化的问题……全局有一个overall的一个待处理任务结果，这个东西就可以未来给M16进行数据输入了" | 方向已定，改造归属待 Talk |
| R-007 | 复盘器失败语义：记录失败，close/流程照常（不阻断） | 用户 Talk 回答："记录失败，close 照常（推荐）" | 已确认 |
| R-008 | 成本否定：不做独立子代理读全量 transcript+四份材料+lessons+先前 reflection；只要记录三件事——本 stage 值得提升的地方、历史的坑这里也踩过吗、哪里可简化 | 用户："另起独立子代理读：本 stage transcript 全文……会不会太离谱了，token和时间消耗会不会太大了？我只想记录这个stage有哪些值得提升的地方，有哪些历史的坑这里也踩过？有哪里可以简化的地方" | 方向已定，输入范围待 Talk |
| R-009 | 技能命名：skills/stage-reflection | 用户："技能命名：skills/stage-reflection" | 已确认 |
| R-010 | 全局 lessons 索引位置：`<storageRoot>/Projects/<proj>/lessons/` | 用户："全局 lessons 索引位置：`<storageRoot>/Projects/<proj>/lessons/`" | 已确认 |
| R-011 | M15 退役已在其他会话进行（m15-retirement 任务），本任务不做退役 | 用户："M15退役我已经在其他会话进行了" | 事实；退役产出与本任务的关系待 Talk |
| R-012 | 用户核心动机：不为监控而监控；要的是"哪些 step/skill 有必要、如何系统优化、前期质量税" | 用户前序消息长文；"我需要知道的是。它每一个step，每一个skill，它对整个任务流程有没有帮助？有没有需要提升的地方？任务执行过程中有没有阻塞，人工为什么要回复那一句话？" | 已确认事实 |
| R-013 | 市面方案调研已完成（用户提供 opik/翁荔 harness 参考；已另派调研） | 用户："再帮我仔细调研调研，如果可以的话，用anysearch技能看一看市面上有没有更好的方案" | 已采信 |
| R-014 | 满足宪法边界：判断层结论不是机器事实（D30：关键事实禁止 LLM 推断）；质量裁决仍归 review（禁止自审自判） | 用户对分层的确认 + 宪法/CLAUDE.md | 分层设计已定；执行上下文边界待 Talk |
| R-015 | 四份核心材料必须在项目 worktree 的 `specs/<task-id>/` 任务文件夹下创建；任务追踪目录只放执行相关文件（task.json/facts.jsonl/quality/index.json），不得放 decision-log/spec/plan/tasks。**取证结论（F-013）**：偏离由 **m15-retirement**（08-30 15:46 起）开始，非代码改动而是 agent 会话行为漂移——其 spec.md:6/plan.md:3/handoff:19 均自引用 `tasks/m15-retirement/…` 路径；代码约定一直正确（`core/artifact-dir.mjs:73,81-82`、stage-runner.mjs:274-278、git-worktree-snapshot.mjs:24）；漂移诱因是文档未写死落点（docs/standard-workflow.md:9、workflows/*/SKILL.md、AGENTS.md 均只写裸文件名） | 用户："现在的核心四文件……都放在了任务追踪目录里。这不合适，是上一个任务搞错了！"；用户确认「并入本任务范围」 | 已确认；本任务文件已挪正 |

## 目标

- 为每个 workflowhub 任务的每个 stage 增加一个轻量自动复盘器（skills/stage-reflection），在 stage 结束时自动记录三件事：本 stage 值得提升的地方、历史的坑这里是否也踩过、哪里可以简化。
- 每个任务的复盘输出归档于任务目录 `quality/`，随任务保留。
- 改造 M15 全局监控页面为"任务判断层输出 + overall pending 待优化问题"视图，作为未来 M16 候选池的数据输入。
- 不恢复 M15 的 token/耗时/transcript 遥测采集链（已由 m15-retirement 会话退役）。

## 成功/失败边界

- 成功边界：① 每 stage 结束后自动产出结构化复盘（六类判断 + 证据 ref + confidence）；② 复盘存入任务 `quality/stage-reflection/` 且可被纯脚本聚合；③ 补丁 A 生效：confirm/authorize 记录含 reply_text+stage/step 锚点（v3，旧记录只读兼容）；④ 补丁 B 生效：消费边可从 stage outcome input_refs/evidence_refs 派生，无引用记 unknown；⑤ lessons 索引成功合并去重写回、失败时仅保留 failed 记录不污染；⑥ 全局页面显示任务级摘要 + overall pending；⑦ 复盘失败不阻断 stage/close（status:failed 落盘）。
- 失败边界：① 把 LLM 判断写成机器事实（违反 D30）；② 页面重成空壳（M15 教训）；③ 复盘器成为 stage 完成阻断门；④ remove_candidate 无机器信号支持（违反 D-006）；⑤ 补丁 A/B 验收不通过视为本任务失守（FND-D2 处置）。

## 范围

- 当前范围：stage-reflection 技能 + 每 stage 框架层自动挂载 + quality/ 归档 + 两补丁（A 人工介入原文 / B 消费链派生）+ lessons 索引（`<storageRoot>/Projects/<proj>/lessons/`）+ M15 页面改造（任务视图 + overall pending）+ 四份材料落点修正（R-015/D-012）。
- 用户流程/结果只记索引和验收影响，细节进入 spec。

## 非目标

- 不做 token/耗时/transcript 遥测采集（R-012，M15 退役已由 m15-retirement 会话执行）。
- 不做质量打分/质量裁决（归 review 体系）。
- 不做 M16 候选池本体、迭代入口、负例库（后续独立任务）。
- 不补 DSH/Kimi/Claude 的 per-provider 采集。
- 不做历史任务数据回填。
- 不改五阶段骨架（尽可能复用现有 stage 末挂载机制，具体待 Talk）。

## 决定

### D-001 触发时机与挂载
- question/final_option: 复盘器何时触发、挂在哪层？→ 每个 authoring stage 结束时自动触发，框架 manifest 声明 step + skill outcome 通道（复用 stage-runner 通用校验，不新增专用槽）
- recommendation/plain_language: 推荐框架层。让每个 stage 自动多一步"复盘"，不依赖人记性
- decision: per-stage-end 自动触发；挂载=各 stage steps.json 增加 stage-reflection step + manifest 声明 skill；stage-runner 通用 step/skill outcome 校验通道已核实支持（F-009），不改校验器核心
- source_type/reference/exact_excerpt: user / R-004 "在每个stage结束的时候……自动地进行一些总结和复盘"；T-002 选「框架层挂载（推荐）」
- approval_binding: 已确认（Talk R1-Q2 真实回复）
- facts_and_constraints: F-009（stage-runner 通用 step 通道）；R-004（per-stage 非 close）
- Logic: 每 stage 需要自动复盘 → 现有框架已有 stage-end step 机制 → manifest 声明即覆盖所有 stage → 无侵入性新校验器
- choice_reason/impact: 可靠、覆盖全、与现有机制一致；影响=各 workflow steps.json + manifest
- consequences_and_risks: 若某 stage 未声明则不复盘（manifest 强约束保证声明后才通过）；风险=多一次每次 stage 的 LLM 调用成本（已有 R3 决定删除成本上限作为验收条件）
- rejected_alternatives: 纯 SKILL.md 提示（依赖遵守、易漏）；混合（改动面更大）
- unresolved_items/owner: 无
- Supersedes: none

### D-002 执行体
- question/final_option: 复盘由谁执行？→ 当前主会话执行（自评）
- recommendation/plain_language: 用户否定独立子代理方案（成本），确认主会话自评；skill 设计得省 token
- decision: 当前主会话在 stage 结束时直接运行 skills/stage-reflection，不另起子代理、不读 transcript 全文
- source_type/reference/exact_excerpt: user / T-001 选① "上下文里才有经验和教训……不要浪费太多时间和token"；T-012 确认（FND-002 rejected_invalid）
- facts_and_constraints: R-008 否定"独立子代理+全量 transcript"；T-001/T-012 裁定
- Logic: 会话上下文含本 stage 全过程经验 → 省 token 优先 → 主会话自评 + 自评偏差用机器门槛/消融兜底
- choice_reason/impact: 成本最低；影响=判断质量接受自评偏差（D-006 门槛兜底）
- consequences_and_risks: 自评偏差（Agent-as-a-Judge 论文佐证）；缓解=remove 机器门槛 + M16 消融定案；该偏差不是质量裁决违反（过程观察非裁决）
- rejected_alternatives: 独立子代理轻量版（每 stage 一次启动成本）；事实实时+判断批量（违背 per-stage 自动）
- unresolved_items/owner: 无
- Supersedes: none

### D-003 输入范围
- question/final_option: 复盘器读什么？→ 会话记忆 + 全局 lessons 索引 + 本 stage step/skill outcome 记录
- recommendation/plain_language: 只读已在手上的东西；不读 transcript、不读四份材料全文
- decision: 输入=1) 当前会话记忆（stage 全过程经验）2) `<storageRoot>/Projects/<proj>/lessons/` 索引（小文件）3) 本 stage 的 step/skill outcome 记录（会话内已有）+ 两补丁数据
- source_type/reference/exact_excerpt: user / T-005 选「A 会话记忆+lessons 索引（推荐）」；FND-005 处置接受 outcome 补充
- approval_binding: 已确认
- facts_and_constraints: F-010（现有事实结构）；FND-005（outcome 已是结构化，读取零成本）
- Logic: 三件事可全由会话经验+教训对照回答 → 不读大文件 → 省 token 且满足范围
- choice_reason/impact: 成本最优
- consequences_and_risks: 可能漏记 transcript 深层次问题（接受，lesson 更新机制补齐）；冷启动 lessons 为空 → G-3 选从头积累（如实展示 unknown）
- rejected_alternatives: 读 facts.jsonl 本 stage 记录（收益有限）；读四份材料摘要（成本上升）
- unresolved_items/owner: 无
- Supersedes: none

### D-004 两个补丁（人工介入原文 + 产出消费链）
- question/final_option: 两补丁归本任务？形态？→ 归本任务；人工介入=升级 human-confirmation 记录（v3 加 reply_text + stage/step 锚点）；消费链=从 outcome input_refs/evidence_refs 派生
- recommendation/plain_language: 升级现有记录（单写入源不双写）；消费链零新增埋点
- decision: ① confirm/authorize 人工回复写入点升级 human-confirmation 记录：新增 `reply_text`（用户回复原文）+ `stage`/`step_slug` 锚点，schema 升 v3，旧记录只读兼容；② output 消费边由现有 stage outcome 的 input_refs/evidence_refs 派生（纯脚本），无引用记 unknown 不判无用
- source_type/reference/exact_excerpt: user / T-006 自定义 "1：人工介入时自动记下'你回复的那句话原文+当时处于哪个步骤'；2：记录每个 step/skill 产出的文件有没有被后续环节用上。"；G-1 选升级 confirmation；G-2 选 outcome 派生
- approval_binding: 已确认
- facts_and_constraints: human-confirmation.v1/v2 只有 accepted/rejected+时间（已核实无原文）；stage outcome 已含结构化 input_refs/evidence_refs（F-009 附近核实）
- Logic: 用户核心问题"人工为什么介入"需要原文 → 升级单一确认记录（零双写）→ 消费链从现有结构化引用派生 → 零新增埋点
- choice_reason/impact: 单写入源守宪法禁止双写；派生零侵入（M15 教训）
- consequences_and_risks: confirmation v3 需迁移写入点（兼容旧记录）；派生链对"引用未登记"保守处理（unknown）
- rejected_alternatives: 独立新 facts 记录（双写）；每 step 显式登记消费（侵入大）
- unresolved_items/owner: v3 字段最终 schema 进 spec
- Supersedes: none

### D-005 判断输出与分类
- question/final_option: 复盘输出什么样？→ 六类判断全量（keep/optimize/simplify/merge/remove_candidate/add），judgment 身份，带证据+置信度+复核触发条件
- recommendation/plain_language: 用户否定固定字段，要系统判断方法论；调研建议分层判断（机器信号→规则→LLM 归因）
- decision: 输出 `quality/stage-reflection/<stage>.json`（判断层，非 facts）：每 step/skill 一行六类判断；字段=step/skill_id、classification、reason、evidence_refs[]、confidence、next_review_trigger；文件身份标注 judgment；不带质量打分字段
- source_type/reference/exact_excerpt: user / T-009 自定义 + T-013 选「六类判断全量（推荐）」；调研 F-012（分层判断方法）
- approval_binding: 已确认
- facts_and_constraints: F-012（六类分类定义来自调研：消融/消费图/精益 waste/失败模式）
- Logic: 需要系统判断而非固定字段 → 六类增量式判断（keep→add）覆盖"优化/简化/减少/新增"全谱 → 输出可被页面与 M16 消费
- choice_reason/impact: 覆盖用户全部意图；判断可聚合、可证伪
- consequences_and_risks: 每 stage 一次 LLM 归因成本（用户决定接受，删除成本上限）；cold start 低置信如实标注
- rejected_alternatives: 四字段固定输出（T-009 否定）；三档判断（深度不够）
- unresolved_items/owner: 字段 schema 进 spec
- Supersedes: none

### D-006 remove_candidate 触发门槛
- question/final_option: 何时允许 remove_candidate？→ 仅当机器硬信号支持
- recommendation/plain_language: 防自评偏差、防"没记录=没用"误判
- decision: 仅当机器硬信号支持（零消费边 ∧ 人工否定/重复介入 ≥阈值）才允许输出 remove_candidate；仅 LLM 直觉的情形输出 needs_evidence（待验证）；remove 最终裁决权在人工复核 + 未来 M16 消融实验
- source_type/reference/exact_excerpt: user / G-4 选「机器信号才允许 remove（推荐）」
- approval_binding: 已确认
- facts_and_constraints: F-012 风险清单（self-evaluation bias、把没记录当没用、长尾价值误杀）
- Logic: 自评+冷启动 → LLM 直觉不可信 → 机器硬信号门槛 → 高置信 remove 候选；最终裁决给消融/人工
- choice_reason/impact: 降低乱删风险
- consequences_and_risks: 初期 remove_candidate 会很少（可接受：宁缺毋错）
- rejected_alternatives: LLM 直觉可直接 remove（G-4 否定）
- unresolved_items/owner: 阈值细节进 spec
- Supersedes: none

### D-007 lessons 索引
- question/final_option: 全局教训索引维护方式？→ 机器无条件追加原始观察，复盘成功后才合并去重写回；冷启动从头积累
- recommendation/plain_language: 防污染防丢失；用户放弃预填
- decision: `<storageRoot>/Projects/<proj>/lessons/`：①stage 结束机器追加原始观察（零 AI 成本）②复盘成功后再合并同类项写回 ③复盘失败只留 failed 记录不写回 ④按项目隔离、条目带 task/stage ref
- source_type/reference/exact_excerpt: user / T-010 选①；T-004 选「复盘时顺手维护」；G-3 选「从头积累」
- approval_binding: 已确认
- facts_and_constraints: FND-004 处置（写回与成功解耦）；R-010 位置
- Logic: 写回与判断成败解耦 → 防污染；从头积累 → 零一次性成本
- choice_reason/impact: 诚实（冷启动 unknown）且便宜
- consequences_and_risks: 前 N 个任务"历史坑对照"能力弱（如实展示 unknown）
- rejected_alternatives: 预填历史任务（T-011…实际 G-3 否定）；纯脚本合并（质量差）
- unresolved_items/owner: 无
- Supersedes: none

### D-008 页面改造（修订：复用 → 重建）
- question/final_option: M15 页面如何改造、归属？→ 本任务承接；**重建**（非复用）投影与页面生成逻辑，数据源换为复盘产物
- recommendation/plain_language: 仓外静态三件套模式（html+data.js）作为模板重写生成器；视图=任务视图+overall pending
- decision: 以仓外 `workflowhub-monitor.html`（静态尸体，数据冻结）+ data.js 注入模式为蓝本**重建**投影器与页面模板（新模块，登记 move-map.json 并注明替代 ADR 0012 退役条目）；数据源=`quality/stage-reflection/*` + lessons 索引；视图=①每任务各 stage 判断摘要 ②overall pending（跨任务按频次×严重度排序，severity/聚合规则进 spec，带来源任务 ref）；页面仅展示 judgment，不展示为事实；**开发顺序约束：m15-retirement 合并 main 后才开工 build-code**
- source_type/reference/exact_excerpt: user / R-006 + T-007 + 用户"我会在m15-retirement任务合并到main之后再做当前的stage-reflection任务的开发的"；m15-retirement decision-log D-002/D-003（投影链全拆，仓外页面留静态尸体）
- approval_binding: 已确认
- facts_and_constraints: F-014（m15 全拆投影设施；仓外静态模式保留）；M15 教训（空壳页面）
- Logic: 复用对象将被删除 → 重建生成器（仓外静态模式已证明可行）→ 数据源/视图不变
- choice_reason/impact: 无代码纠缠风险；工作量上调（新建投影器+页面模板而非改造）
- consequences_and_risks: 重建工作量大于改造（用户已知，m15 RISK-003 记录）；历史数据样本可读用于验证但不可写（D-004 sha256 比对）
- rejected_alternatives: 页面延后（用户 R-006 明确要）；交给 m15-retirement（其范围不含）
- unresolved_items/owner: 投影器/页面模板/聚合 schema 设计进 build-spec/build-plan
- Supersedes: 本日志初版 D-008「复用 m15-retirement 保留的页面+投影机制」（F-014 推翻前提）

### D-009 失败语义
- question/final_option: 复盘器失败时？→ 记录 status:failed，stage/close 照常
- recommendation/plain_language: 指标不当 gate（宪法）
- decision: 复盘失败/输出超时 → quality/stage-reflection/<stage>.json 记 `status:failed`（含错误摘要），不阻断 stage 完成与任务 close；lessons 合并不执行（原始观察仍机器追加）
- source_type/reference/exact_excerpt: user / R-007 + T-010
- approval_binding: 已确认
- facts_and_constraints: M0（指标只观察不当 gate）；宪法（记录事实非阻断）
- Logic: 复盘是观察 → 失败不应卡交付 → 落 failed 记录继续
- choice_reason/impact: 不引入阻断门
- consequences_and_risks: 复盘长期失败会攒 unknown（由页面状态可见，人工介入）
- rejected_alternatives: 复盘必成功才 close（阻断门，违背原则）
- unresolved_items/owner: 无
- Supersedes: none

### D-010 验收与成本
- question/final_option: 验收方式？成本约束？→ 真实任务端到端；删除成本上限成功条件
- recommendation/plain_language: 吸取 M15 教训（空壳页面无真实背书）
- decision: 验收=下一个真实 WorkflowHub 任务跑通：每 stage 产出复盘、页面展示真实数据、两补丁生效；用户审查判断质量后确认。成功/失败边界按上文（判断层身份/不阻断/六类/机器门槛），不设成本上限指标
- source_type/reference/exact_excerpt: user / T-008 选真实任务端到端；T-011 选删除成本条件
- approval_binding: 已确认
- facts_and_constraints: M15 历史（13 分钟 6.5k 行、T009 未闭环）；R-011 用户要"省 token"
- Logic: 端到端真实任务 → 证明采集链闭环；成本不做可测上限 → 用户拍板接受
- choice_reason/impact: 验收可信
- consequences_and_risks: 验收周期等一个真实任务；成本无硬约束（依靠 skill 设计省 token，实际使用中如过贵用户再收紧）
- rejected_alternatives: 构造样例（假数据）；两者都做（成本高）
- unresolved_items/owner: 无
- Supersedes: none

### D-011 非目标与延期（边界）
- question/final_option: 明确不做什么？→ 见下方非目标/延期
- decision: 非目标：不做 token/耗时/transcript 遥测（m15-retirement 已退役）；不做质量打分/质量裁决（归 review/verify）；不做 M16 候选池/迭代入口/负例库（后续独立任务）；不补 DSH/Kimi/Claude per-provider 采集；不做历史任务回填；不改五阶段主骨架（仅 manifest 声明新 step）。延期：M16 本体；页面可视化增强；消融实验体系
- source_type/reference/exact_excerpt: user / R-011、T-001~T-013 收敛 + m15-retirement T-001/T-003/T-004
- approval_binding: 已确认
- facts_and_constraints: 宪法（新控制面先登记消费者/删除条件——本任务已在 ADR 0021 登记）
- Logic: 最小交付、边界清晰 → 防范围吞并（M15 教训）
- choice_reason/impact: 聚焦
- consequences_and_risks: M16 依赖本任务与 m15-retirement 产出
- rejected_alternatives: 范围吞并页面增强/消融（延期）
- unresolved_items/owner: 无
- Supersedes: none

### D-012 四份材料落点修正
- question/final_option: 四份材料写在哪？→ worktree `specs/<task-id>/`；任务追踪目录只放执行文件
- recommendation/plain_language: 改回旧约定：specs 文件夹能追踪最近任务；追踪目录只管执行
- decision: ①本任务四份材料落 `worktree:specs/workflowhub-stage-reflection-20260830/`（已执行：decision-log.md 已挪正）；②本任务顺带修正 agent 操作约定（文档中明确材料落点，杜绝追踪目录写法）；③m15-retirement 会话的文件位置由其会话自行修正（本任务不动其他任务材料）
- source_type/reference/exact_excerpt: user / R-015 + 用户选「并入本任务范围」
- approval_binding: 已确认
- facts_and_constraints: core/artifact-dir.mjs:73,81-82 已有 `specs/<taskId>` 约定；现状两任务（本任务+m15-retirement）误写追踪目录
- Logic: 约定被偏离 → 材料挪正 + 文档修正 → specs/ 恢复可追踪
- choice_reason/impact: 恢复项目根目录 specs/ 的任务追踪能力
- consequences_and_risks: interaction aggregate 的 decision_ref 为相对名（"decision-log.md"），绑定内容不绑定路径，无需重建；m15-retirement 需另行通知
- rejected_alternatives: 单独开任务（用户否定）；改代码路径（无需——代码约定一直正确，F-013）
- unresolved_items/owner: 文档修正清单（F-013③）：docs/standard-workflow.md:9、workflows/make-decision/SKILL.md:58、build-spec/build-plan SKILL.md 同条款、AGENTS.md 治理边界条——落 build-spec/build-plan；m15-retirement 会话迁移清单（F-013④）由其会话执行
- Supersedes: none

### D-001 挂载机制（build-plan 修订）
- question/final_option: 复盘如何挂载到每个 stage？→ 框架层自动（manifest 声明 step，通用 step/skill outcome 通道）**+ runner 小幅扩展调度语义**
- recommendation/plain_language: 在 steps.json 声明，不走通用运行时改动；stage-runner 零修改
- decision: 各 stage steps.json 增加 stage-reflection step（**声明 `on_stage_end:true` + `blocking:false`**）+ skill-deps.yaml 绑定 skills/stage-reflection；**runner 小幅扩展**：无论 stage 成败都执行该 step、其失败不翻转 stage 状态/不阻断 close、调用技能前先执行机器前奏（raw 追加零 AI 兜底）——用户已确认（build-plan FND-P3 blocking，选「runner 小幅扩展」）；普通 step 语义两头堵（失败 stage 轮不到复盘/复盘失败拖挂 stage），这是对 D-001 实现细节的修订，不改方向
- source_type/reference/exact_excerpt: user / R-004 原话 + 代码调研 F-009 + build-plan 审查 FND-P3（codex/luna blocking）+ 用户 mount_fix=「runner 小幅扩展」
- approval_binding: 已确认（二次确认于 build-plan 阶段）
- facts_and_constraints: stage-runner.mjs:128-137 的 step_outcomes 校验是通用的（status/input_refs/result_summary/evidence_refs），新 step 无需改校验器核心；扩展仅限调度语义（on_stage_end/blocking）
- Logic: 框架已知每 stage 结束 → manifest 声明 → stage 结束自动执行；runner 扩展保证 completed/failed 两态都执行 + 非阻断
- choice_reason/impact: 自动性不依赖会话纪律；失败语义由 runner 强制而非靠自觉
- consequences_and_risks: runner 有改动面（调度语义 + 机器前奏），需集成测试覆盖三场景（技能未启动/超时/失败 raw 已落盘）
- rejected_alternatives: 会话级约定（用户否定"靠自觉"）；宿主事件钩子（m15 教训：只 codex 有钩子）；挪到下一 stage 入口（时机错位、失败重来重复风险）；纯会话纪律（失去自动性）
- unresolved_items/owner: runner 扩展的实现细节进 build-code（T22~T24）
- Supersedes: 本日志初版 D-001「stage-runner 零修改」表述（调度语义扩展除外）

## 三轮 talk

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001 | R1-Q1 复盘器执行体 | 上下文里才有经验和教训，最省 | 选①当前主会话 + "skill需要设计的好一些，不要浪费太多时间和token" | 剩 3 | 用户本轮回复 |
| T-002 | R1-Q2 挂载机制 | 框架层可靠覆盖全 | 选「框架层挂载」 | 剩 2 | 用户本轮回复 |
| T-003 | R1-Q3 页面归属 | m15-retirement 移交 | 选「本任务做页面」 | 剩 1 | 用户回复 + m15-retirement T-002 |
| T-004 | R1-Q4 lessons 维护 | 顺手维护质量高 | 选「复盘时顺手维护」 | R1 收敛 | 用户本轮回复 |
| T-005 | R2-Q1 复盘输入 | A 最省覆盖三件事 | 选「会话记忆+lessons 索引」 | 剩 3 | 用户本轮回复 |
| T-006 | R2-Q2 人工介入采集 | 用户自定义 | 自定义："1：人工介入时自动记下'你回复的那句话原文+当时处于哪个步骤'；2：记录每个 step/skill 产出的文件有没有被后续环节用上。" | 剩 2 | 用户本轮回复 |
| T-007 | R2-Q3 页面视图 | 双视图是 M16 输入形态 | 选「任务视图+overall pending」 | 剩 1 | 用户本轮回复 |
| T-008 | R2-Q4 验收方式 | 真实任务背书 | 选「真实任务端到端」 | R2 收敛 | 用户本轮回复 |
| T-009 | R3-Q1 输出字段 | 用户自定义：固定字段不足以做系统判断 | 自定义（六类判断方向）+ "需要详细的调研"→ 触发专项调研（F-012） | 触发新轴 | 用户本轮回复 |
| T-010 | R3-Q2 lessons 写回 | 防污染防丢失 | 选①机器先存原始观察，成功后才合并 | 剩 2 | 用户本轮回复 |
| T-011 | R3-Q3 成本边界 | 可测上限 vs 删条件 | 选「删掉成本条件」 | 剩 1 | 用户本轮回复 |
| T-012 | R3-Q4 执行体确认 | R-008 字面与方向冲突 | 选①确认主会话自评（FND-002 关闭） | R3 收敛（Q1 轴延伸） | 用户本轮回复 |
| T-013 | R3-延伸 判断方法 | 六类判断全量/三档/抽样复核 | 选「六类判断全量（推荐）」 | 全部收敛 | 用户本轮回复 |

**R1 收敛结论**：复盘器 = 每 stage 结束、当前主会话执行、框架层挂载、本任务做页面重做、lessons 由复盘时顺手维护。无 high/medium 遗留。

**R2 收敛结论**：输入=会话记忆+lessons 索引；两补丁归本任务；页面=任务视图+overall pending；验收=真实任务端到端。

**R3 收敛结论**：lessons 写回=机器先存原始观察+成功才合并；成本条件删除；执行体确认主会话自评（FND-002 rejected_invalid）；输出改为六类判断全量（调研后 T-013 确认）。

## 调研

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| F-001 | M15 原始设计意图（roadmap.md:426-442） | M15 定位"消费 M14b 事实做流程退化诊断+成本归因"；硬性验收"只读取 facts/index，不改核心流程代码" | 已采信 | R-012 |
| F-002 | M15 实现技术真相 | 唯一全能力 adapter 是 codex（rollout token_count + 专用 session hook）；DSH 只出 requirement_message；其余 provider 无钩子；遥测链 = monitoring-facts/projector/diagnostics/page + codex-transcript-adapter + dsh-transcript + runMonitoringSidecar + outcomeCostFacts + task-store facts.jsonl | 已采信 | R-011 |
| F-003 | M15 研发史（specs/archive 三个 m15 目录 + reflog） | 初版 13 分钟交付 +6523 行/35 文件，T009 收尾从未闭环；收据边界补丁；runtime-observability-repair 返工；"没采到≠流程退化"从未解决 | 已采信 | R-006 |
| F-004 | 既有原则 | D28：层1指标由流程引擎顺带生成、skill 不埋点；D30：关键事实禁止 LLM 推断，采不到记 unknown；M0：采集纯脚本零 AI 成本、指标只观察不当 gate、孤儿采集器警示 | 已采信 | R-014 |
| F-005 | 框架挂载点 | stage-runner.mjs:369-407 已有 stage-end analyzer step（stage-end-spec-analyze / final-spec-analyze），绑定 spec-analyze，outcome schema `workflowhub-spec-analyze-stage-outcome.v1`；authoring stage manifest 声明 step+skill | 已采信；挂载候选 | D-0xx（待定） |
| F-006 | 市面方案（本会话调研） | OpenAI Eval Skills（四维指标、分层检查：确定性规则→构建→冒烟→LLM-as-judge 收尾；"Every manual fix is a signal. Turn it into a test"）；Opik/Comet（trace+LLM-as-judge 指标库+看板，宜借分类法不宜引入平台）；Agent-as-Judge（ICML 2025，agent 评 agent 中间步骤）；CMU HITL（人工介入时机建模）；Anthropic 5 类迭代触发条件 + with/without 基线对比；Lilian Weng harness 长文（评测驱动闭环、低估脚手架） | 已采信 | R-013 |
| F-007 | m15-retirement 任务现状 | 已 bootstrapped（task_path `~/Knowledge/Projects/workflowhub/tasks/m15-retirement`），decision-log 处于 make-decision Talk 待确认；范围含"退役+第一层补丁（人工介入原文+artifact 消费链）"，补丁是否纳入未定 | 已采信；依赖待 Talk | R-006/R-008 |
| F-008 | 本任务启动事实 | task `workflowhub-stage-reflection-20260830` 已 bootstrap（worktree `workflowhub-workflowhub-stage-reflection-20260830`，branch `task/workflowhub/workflowhub-stage-reflection-20260830`，baseline 292f3b30）；session binding unavailable（DSH 宿主非 Codex 会话，`session_task_binding_mismatch`）——记录命令不可用，如实保留，不阻塞 | 已采信 | R-001 |
| F-009 | 框架挂载可行性 | stage-runner.mjs:128-137 对 step_outcomes 做**通用校验**（status/input_refs/result_summary/evidence_refs，按 manifest 顺序/identity）；record.spec_analyze 是特殊强校验槽。新增 stage-reflection step 走通用 step/skill outcome 通道即可，无需改 stage-runner 校验器；若要做强校验需新增类似 spec_analyze 的专用槽 | 已采信；设计取舍（通用 vs 强校验）进入 build-plan | 框架层挂载 |
| F-010 | 现有可消费事实 | 已有：quality/evidence/interactions/<sha256>.json（interactionAggregateFacts，含 Talk 卡片/回复原文）、quality/confirmations/、quality/reviews/results/、quality/tests/、facts.jsonl（task 级事实）。**不存在**：自由形态"人工介入原文"采集（m15-retirement T-003 已确认两补丁不纳入其范围） | 已采信 | R-012、OPEN-002/005 |
| F-011 | m15-retirement 会话进展（初查） | T-002：`monitor 页面和生成的逻辑保留，内容重做归下一个任务（离线复盘器）`；T-003：两补丁（人工介入原文/artifact 消费链）不纳入，纯退役；T-001：只拆监控链保留阶段自记录；T-004：历史数据全部只读保留；R1 已收敛 | 已采信；**部分被 F-014 修正** | R-006、OPEN-001 |
| F-014 | m15-retirement 决策与方案深度调研（最新状态） | ①**页面投影逻辑"保留"已被 Grill 推翻**（D-002/D-003 修正）：投影链与采集链代码纠缠不可分，改为**监控链含投影设施全拆**——`monitoring-facts/diagnostics/projector/page.html` + 两个监控 schema + collect-task-facts.mjs + 三个 config 全删；仓外三件套（monitor.html/data.js/facts.jsonl）留作**静态尸体**加"已退役"提示条；②阶段自记录机制写死保留（需求认证/step-skill 事件/stage outcome/facts 通用读写）；③历史数据字节级只读（AC-HISTORY-001 sha256 比对）；④保留区原地修剪：codex-transcript-adapter 只留需求认证符号、fact-collector 留需求认证符号、task-store 监控分类器下沉为行内字符串判断；⑤**session-event 的 usage 字段退役**→本任务无任何 token/耗时数据源可用；⑥进度：make-decision accepted、build-spec 冻结、build-plan 完成待通知进 build-code；T-001 completed（基线安顿），T-201~T-401 全 pending，worktree 无代码改动；⑦D-006 登记"任务 B（离线复盘器）紧随"=本任务；DEF-001（复盘器+页面重做）/DEF-002（两补丁）移交本任务关闭 | 已采信；**修正本任务页面方案为"重建"** | D-008 修订 |
| F-012 | 系统判断方法论专项调研（6 轮/24 查询，跨 7 流派） | 共识=三层组合：机器硬信号预筛（消费图/返工/变体）→ 因果消融定案（with/without、LOO；成本高只做审计）→ 独立判官辅助归因（Agent-as-a-Judge、pairwise、rubric）；关键陷阱：自评偏差（判官须独立）、冷启动无数据≠可删、没记录≠没消费、返工不一定浪费（返工后成功=必要防线）、长尾防御步骤防误杀、消融只测边际贡献；引用：OpenAI process supervision、Agent-as-a-Judge (ICML 2025)、Anthropic skill-creator with/without 基线、AFlow 自动 add/remove/merge、MAST 失败模式 | 已采信 | D-005/D-006 |
| F-013 | R-015 偏离取证（材料落点漂移源头） | ①偏离起点=m15-retirement（08-30 15:46），此前任务（make-decision-requirement-convergence、workflowhub-simplicity-close-repair、ui-e2e-delivery-contract）均正确落 `specs/<task-id>/`；②性质=agent 会话行为漂移+文档空白，**非代码改动**——代码约定始终正确（`core/artifact-dir.mjs:73,81-82`；读取侧 stage-runner.mjs:274-278、stage-context.mjs:86、git-worktree-snapshot.mjs:24 均锚定 `specs/<task>/`）；③文档空白位置：docs/standard-workflow.md:9、workflows/make-decision/SKILL.md:58、AGENTS.md 治理边界条均只写裸文件名；④m15-retirement 待修文件清单：追踪目录四材料挪至 `workflowhub-m15-retirement/specs/m15-retirement/` + 修其 spec.md:6/plan.md:3/handoff:19 交叉引用；⑤顺手项（非因果）：孤儿目录 `tasks/Projects/`（相对路径拼接残留，Aug 30 09:16）；⑥代码零改动即可 | 已采信 | R-015/D-012 |

## grill

| grill_id | CONTEXT/冲突 | 结论 | ADR/四项退出 | source/evidence |
| --- | --- | --- | --- | --- |
| G-001 | 人工介入原文采集形态：升级 confirmation 记录（推荐）/独立新 facts | 选升级——单写入源不双写；v3 加 reply_text+stage/step 锚点 | ADR 0021 | 用户 G1 回复（D-004） |
| G-002 | 消费链记录：outcome 派生（推荐）/每 step 显式登记 | 选派生——零新增埋点；无引用判 unknown 不判无用 | ADR 0021 | 用户 G2 回复（D-004） |
| G-003 | lessons 冷启动：历史任务预填（推荐）/从头积累 | 选从头积累——零一次性成本，冷启动如实展示 unknown | ADR 0021 | 用户 G3 回复（D-007） |
| G-004 | remove_candidate 触发门槛：机器信号才允许（推荐）/LLM 直觉可直接 remove | 选机器信号门槛——防自评偏差/防"没记录=没用"误判 | ADR 0021 | 用户 G4 回复（D-006） |

**grill_summary**：status=completed；direction_changing_challenges_resolved=true；context=no-change（理由：新术语 `stage-reflection`/「判断层 vs 事实层」将在 build-spec 定稿 schema 后一次性补录 CONTEXT.md，避免过早固化）；adr=created（docs/adr/0021-stage-reflection-judgment-layer.md）；conflicts=resolved（与 ADR 0012 的接替关系已在 0021 记录；无需术语冲突处理）；requirement_coverage=complete（goal/flow_or_surface/data_or_state/success_failure_acceptance/constraint_non_goal_defer 五类全覆盖）；exit_checks=external_interfaces: pass（framework step 通道/confirmation 记录/outcome input_refs 均已核实）；canonical_names: pass（skills/stage-reflection 用户确认）；failure_semantics: pass（R-007 + D-009）；scope_boundaries: pass（D-011 非目标/延期写死）；decision_updates=D-001~D-011。

## 审查处置

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| FND-001 | kimi/coding + codex/luna major：复盘输出"三件事"未覆盖 R-012（step/skill 有无帮助、阻塞、人工介入根因、前期考虑是否充分） | 复盘产出会漏掉用户核心问题 | **fixed** | D-005/D-006：六类判断全量 + remove 机器门槛；F-012 方法论 | make-decision；retain |
| FND-002 | grok major：方向偏离 R-008 原文（"另起独立子代理读全量 transcript"） | 误读——R-008 是用户对提案的否定式质疑 | **rejected_invalid** | T-001/T-012 用户裁定主会话自评；R-008 完整语义链已记录 | make-decision；retain |
| FND-003 | grok + codex/luna major：方向称"M15 页面改造"与"M15 退役在其他会话"冲突 | 表述歧义 | **fixed** | 方向改表述：承接 m15-retirement 保留的页面/投影机制，只换数据源与视图（D-008 + ADR 0021） | make-decision；retain |
| FND-004 | kimi + codex/luna major：lessons 索引写回与复盘失败语义、并发/原子/项目边界/来源保留未定义 | 失败时 lessons 可能丢失或被污染 | **fixed** | D-007：机器无条件追加原始观察 + 成功后才合并 + 按项目隔离 + 条目带 task/stage ref | make-decision；retain |
| FND-005 | codex/luna major：复盘输入缺结构化 step/skill outcome ledger | 单靠会话记忆+lessons 不稳 | **fixed** | D-003：输入=会话记忆+lessons 索引+本 stage step/skill outcome 记录（会话内已有，零额外读取） | make-decision；retain |
| FND-006 | codex/luna major：success 边界"成本可控"不可测试；schema/聚合规则未定义 | 无法验证 | **fixed** | T-011 成本条件删除；最小契约（judgment/failed/evidence_ref/confidence）已入 D-005，字段 schema 细节进 spec | make-decision；retain |
| FND-007 | kimi minor：severity×frequency 排序未定义（刻度、聚合、公式） | overall pending 视图无法实现 | **accepted_risk**（转 build-spec） | spec 定义 severity 刻度、frequency 窗口与排序公式 | build-spec；retain |
| FND-008 | grok minor：方向未提 R-009 技能名 | 方向材料遗漏 | **fixed** | D-002/D-005 已写明 skills/stage-reflection | make-decision；retain |
| FND-009 | kimi minor：失败语义未说 lessons 是否写回 | 同 FND-004 根源 | **fixed（合并）** | 并入 FND-004 → D-007 | make-decision；retain |
| FND-D1 | antigravity/flash major：overall pending severity/聚合公式缺失 | 交付物无法按确定标准实现 | **accepted_risk**（转 build-spec） | OPEN-007 + FND-007 同源；spec 定义 severity 枚举/频率窗口/排序公式 | build-spec；retain |
| FND-D2 | antigravity/flash major：两补丁无验收标准 | 端到端验收无法判定补丁 A/B 生效 | **fixed** | 成功边界 ③④⑤ + 失败边界 ⑤ | make-decision；retain |
| FND-D3 | antigravity/flash minor：lessons 索引维护无验收边界 | 无法判定索引生命周期 | **fixed** | 成功边界 ⑤ | make-decision；retain |
| FND-D4 | antigravity/flash minor：R-013 调研处理状态未收口 | 需求闭环缺失 | **fixed** | R-013 状态=已完成（F-012 调研为 D-005/D-006 方向输入，结论已落定） | make-decision；retain |

（独立审查 transport 事实：direction——status=available；kimi/coding completed 137s、grok/grok completed 68s（usage 53,877 tokens）、codex/luna completed 77s；material_id c56348e8…；findings 10 条。detail——status=unavailable/outcome=partial；provider_results：kimi/coding failed（PUBLIC_RESULT_INVALID）、antigravity/flash completed 29s（findings 4 条）、codex/luna failed（PUBLIC_RESULT_INVALID）；material_id 92111880…；本 track 保留一条语义建议结果，不做二次请求。）


## build-plan 审查处置（FND-P0~P9）

| finding | 内容 | status | 处置 |
| --- | --- | --- | --- |
| FND-P0 | derive-consumption-edges 无消费者接线 | fixed | T11/T16 显式调用该 CLI |
| FND-P1 | T3 并行/依赖元数据矛盾 | fixed | 并行改 [T7,T8]，T9 依赖 T3 |
| FND-P2+P9 | 孤儿目录删除超出冻结 spec 范围且不可逆 | fixed | 从本任务移除，记入 plan 延期节（用户手工或 m15 会话处理） |
| FND-P3（blocking） | 普通 step 语义两头堵 | fixed（方向细节修订+用户确认） | D-001 修订：runner 小幅扩展（on_stage_end/blocking + 机器前奏），新增 T22~T24 |
| FND-P4 | raw 追加未接入失败路径 | fixed | 机器前奏由 runner 执行，三场景测试 |
| FND-P5 | remove 门槛只在 prose | fixed | 新增 validate-stage-reflection.mjs 确定性校验器（T25~T27），缺信号机器降级 |
| FND-P6 | evidence_refs 无存在性校验 | fixed | 校验器做引用解析，悬空引用强制 confidence 非 high + degraded |
| FND-P7 | 页面无真实浏览器验收 | fixed | T17 增加浏览器 QA（agent-browser），五状态验证 |
| FND-P8 | T0 关键词放行不可靠 | fixed | 五项证据化核验，禁止关键词放行 |

## 最终确认

- 状态：**accepted（确认，但按用户指示暂停，不进入 build-spec，等用户通知）**
- 用户原文与 host-visible 绑定：用户回复"确认，暂不进入build-spec，等我通知"；后续 R-015（材料落点）与 D-008 修订（页面复用→重建）变更，用户于 reconfirm_d008 再次确认"确认修订（推荐）"；interaction aggregate：`quality/evidence/interactions/7f0c17790c47c5309b31400a4404b77c543be8bf6486e2a6c94ba52be28e7d9b.json`（sha256 已验）；decision-log 当前为已确认草稿（hash 随后续修订重算）
- 未确认内容：无；pending 事项=stage-end-spec-analyze 与 publish-decision 待用户通知后执行

## 拒绝方案

| 选项 | 拒绝理由 | 关联 D |
| --- | --- | --- |
| 独立子代理 + 全量 transcript 复盘（此前提案） | 用户 R-008：成本太大；只要记录三件事；T-001/T-012 裁定主会话自评 | D-002 |
| 固定四字段输出 | 用户 T-009：不足以系统判断 step/skill 价值 | D-005 |
| LLM 直觉直接 remove | 自评偏差 + 没记录≠没用（F-012 陷阱） | D-006 |
| 历史任务预填 lessons | 用户 G-3：从头积累 | D-007 |
| 每 step 显式登记消费 | 侵入每 step、M15 教训 | D-004 |
| 独立新 facts 记录介入原文 | 双写（宪法禁止） | D-004 |
| 成本上限作为成功条件 | 用户 T-011：删除 | D-010 |

## 风险与延期交接

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
| --- | --- | --- | --- |
| RISK-001 | 主会话自评偏差（Agent-as-a-Judge 论文佐证：判官与执行同源会高估） | remove 判断被高估/低估 | 缓解已入设计：remove 机器门槛（D-006）+ M16 消融定案 + 页面展示 confidence |
| RISK-002 | 冷启动：lessons 索引为空、消费边 unknown | 前 N 个任务复盘只能给低置信候选 | 如实标注 unknown；G-3 用户接受 |
| RISK-003 | outcome 派生的消费边有漏检（引用未登记） | 可能把"没记录"错标 unknown | 保守规则：无引用=unknown 不判无用（D-004） |
| RISK-004 | confirmation v3 迁移影响现有确认流程 | 写入点升级出错 | spec 中定义兼容策略（旧 v1/v2 只读） |
| RISK-005 | 页面重建工作量大于原"复用"预期；且依赖 m15-retirement 合并入 main 的最终代码状态 | 若 m15 中途方案再变，本任务 spec/plan 需同步 | 顺序约束已写死（D-008）；build-spec 前复核 m15 合并后状态 |
| DEFER-001 | M16 候选池/迭代入口/负例库 | 依赖本任务数据 + m15-retirement 产出 | 后续独立任务 |
| DEFER-002 | 消融实验体系（with/without 定案 remove/merge） | 需要足够样本；成本高 | M16 / 后续任务 |
| DEFER-003 | 页面可视化增强（过滤/导出） | 非 M16 输入必需 | 后续 |

## 质量边界

- 质量事实：本会话调研（F-001~F-012）、市面方案对比（F-006/F-012）、独立方向审查（3 providers，10 findings）、m15-retirement decision-log（F-011）、Grill（G-001~G-004）、ADR 0021。
- 推进资格：本任务为 workflowhub 公共 run 的 make-decision 阶段；会话事件记录 unavailable（DSH 宿主）如实保留。
- 完成判据：Talk 3 轮 + 延伸轮收敛（T-001~T-013）、Grill（4 轴真实回复）、决策草稿（D-001~D-011）、独立审查（direction available，findings 已处置）、用户最终确认、interaction aggregate。
- 不可逆授权边界：无（不产生删除/迁移 action；页面改造不动历史数据；confirmation v3 兼容旧记录）。

## 未决项

| item_id | 未决内容 | 原因 | 谁在何时解决 |
| --- | --- | --- | --- |
| OPEN-001~006 | ~~页面归属/执行体/挂载/lessons/输入/视图验收~~ | 已全部解决（Talk R1~R3 + Grill） | ✅ |
| OPEN-007 | severity 刻度、frequency 窗口与排序公式 | 属 overall pending 实现细节 | build-spec（FND-007 accepted_risk） |
| OPEN-008 | stage-reflection 判断文件字段 schema 定稿 | 属判断层输出契约实现细节 | build-spec / build-plan |
| OPEN-009 | CONTEXT.md 术语补录（stage-reflection/判断层 vs 事实层） | 等 schema 定稿避免过早固化 | build-spec 后（Grill 记录 no-change 理由） |

## Supersedes

- none（新任务）；接替关系：ADR 0012（M15 监控采集链）已由 m15-retirement 退役，判断层机制由 ADR 0021 定义，无 double-track。

## 文档结果

- CONTEXT.md：no-change，理由：新术语待 build-spec 定稿 schema 后一次性补录（Grill 已记录）
- ADR：created — `docs/adr/0021-stage-reflection-judgment-layer.md`（任务 worktree 分支）
- ADR criteria：hard to reverse=否（manifest 可移除、schema 兼容升级、索引可重建）；surprising without context=是（会话内自评+确认记录升级，需 ADR 解释）；genuine trade-off=是（成本 vs 每 stage 证据；自评偏差 vs 零子代理成本；判断层 vs 事实层合规）
- 术语/ADR 冲突及处理：无术语冲突；与 ADR 0012 接替关系已记录
- 不复制 spec 的边界：页面字段/API/schema/步骤/测试细节进入 spec，不在本日志。

## Exit checks

- 外部接口已核实：pass（step 通道 F-009、confirmation v1/v2 现状、outcome input_refs 结构均实测核实）
- 字段/路径命名唯一权威：pass（skills/stage-reflection、<storageRoot>/Projects/<proj>/lessons/、quality/stage-reflection/<stage>.json——用户确认 + 沿用现有命名）
- 失败路径/异常语义：pass（D-009 记录失败不阻断；D-006 未知即 unknown；D-004 无引用 unknown）
- 范围边界写死：pass（D-011 非目标/延期明确，无隐性口头扩大）

## 需求-决策覆盖矩阵（五维）

| 维度 | 原始需求条目 | 当前处置 |
| --- | --- | --- |
| 目标/成功意图 | R-003/R-008/R-012/R-013（动机+调研+系统判断） | D-002/D-005/D-006 + F-012 |
| 流程/页面入口 | R-004/R-006（每 stage 触发；页面双视图） | D-001/D-008（重建） |
| 数据/状态 | R-005/R-009/R-010/R-015 + 两补丁（T-006/G-001/G-002） | D-003/D-004/D-005/D-007/D-012 |
| 成功/失败/验收 | R-002/R-007 + 验收方式（T-008） | 成功/失败边界节 + D-009/D-010 |
| 约束/非目标/延期 | R-011/R-014 + 成本条件（T-011） | D-011 + ADR 0021 + DEFER/OPEN 交接 |

## 阶段执行事实

- 会话事件记录机制：unavailable（DSH 宿主非 Codex 会话，session_task_binding_mismatch；step/skill 级自动记录本阶段不可用，如实记录，不阻塞——同 m15-retirement F-005 先例）。
- Step 1（load-context）：completed。/ Step 2（triage-scope）：completed。
- Step 3（talk-round-1）：completed（T-001~T-004，4 个独立方向轴真实回复）。
- Step 4（research-inputs）：completed。追加轮：F-012 系统判断方法论专项调研（用户 T-009 触发）；方向审查前的基础调研（F-001~F-011）已完成。
- Step 5（talk-round-2）：completed（T-005~T-008）。
- Step 6（direction-advice）：completed。wh-review direction track：status=available，3 provider（kimi/coding 137s / grok 68s / codex/luna 77s），10 findings，全部处置（见审查处置表）。
- Step 7（talk-round-3）：completed（T-009~T-012）+ 延伸轮 T-013（六类判断全量）。
- Step 8（grill-with-docs）：completed（G-001~G-004 真实回复；grill_summary 见 grill 节；ADR 0021 created；CONTEXT.md no-change）。
- Step 9（write-decision-draft）：completed（D-001~D-011 + 成功/失败边界修订）。
- Step 10（detail-advice）：completed。wh-review detail track：status=unavailable/outcome=partial（antigravity/flash 29s 有效 4 findings；kimi/coding、codex/luna PUBLIC_RESULT_INVALID——真实保存，不重试），findings 已处置（FND-D1~D4）。
- Step 11（approve-decision）：**accepted（用户确认"确认，暂不进入build-spec，等我通知"）**；interaction aggregate 已组装并写入 content-addressed 路径（7f0c1779…），hash 匹配。
- Step 12（stage-end-spec-analyze）：completed（分析层）。in-context 语义核查：需求覆盖 R-001~R-015 全覆盖（五维矩阵已落盘）、目标达成、验收清晰、方案收敛、最终卡两次确认。唯一 finding：aggregate card_hash 为占位（DSH 宿主无卡片 hash 能力），如实保留、不影响方向。官方 record-spec-analyze 命令返回 unavailable（`no codex session id in environment`），如实记录。
- Step 13（publish-decision）：completed。六段大白话交接已发给用户（见会话输出）；官方 stage 发布写入器在 DSH 宿主不可用，决策以 decision-log.md + aggregate 为当前真相，进入 build-spec 由下一 stage 会话接管。
- 需求变更 R-015（材料落点）：completed。本任务 decision-log.md 已从任务追踪目录挪至 worktree `specs/workflowhub-stage-reflection-20260830/decision-log.md`；决策记入 D-012；m15-retirement 会话需另行通知自行修正。
