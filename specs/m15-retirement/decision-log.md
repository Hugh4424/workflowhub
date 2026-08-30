---
version: draft
task: m15-retirement
stage: make-decision
---

# M15 退役 — 决策日志

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 | 先做任务 A：M15 退役 | 用户本会话："先做任务A吧，任务A不需要拍板这两个问题吧。请按标准 WorkflowHub 开始这个任务，从 make-decision 开始，不要跳阶段" | D-001（已确认） |
| R-002 | 任务 A = M15 退役 + 为 M16 准备数据基础的第一层补丁 | 用户前序消息："把M15退役，然后再加上每个workflow hub任务，每个stage能够收集、整理和归纳一些当前任务的stage的一些做得不好的地方，以及可以优化的地方"；主代理提案任务 A 范围："拆除 transcript 解析链、codex 专用钩子、monitor 投影器；保留 stage 级粗事实；补上第 1 层两个补丁（人工介入原文 + artifact 消费链）"，用户回复"先做任务A吧" | D-001 纯退役 + DEF-002（补丁延期至任务 B，用户 T-003 改选） |
| R-003 | 核心动机：不为监控而监控 | 用户前序消息："我的核心目标并不是真的想收集每个stage、每个step、每个skill的耗时和token。我的目标就是为了知道workflowhub整个任务执行中为什么耗时这么长，为什么质量这么低……现在来看，这个数据收集这件事情花费的成本太大了……很得不偿失" | 已确认事实 |
| R-004 | 过程要求：不跳阶段、不依赖 build-spec 补需求、大白话 Talk | 用户本会话："先基于原始需求，在make-decision的过程中和我一起仔细梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项。Talk 请用大白话说明选项、后果和风险" | 执行约束 |
| R-005 | M15 历史失败是本次决策的关键输入 | 用户前序消息："这个M15出现过非常非常多的问题，我改了好几版，最终收集的数据以及这个页面的内容也是离我最初设想的差距很大"；"只有codex能收集，其他的provider都无法正确地收集" | 已确认事实（调研 F-001~F-004 佐证） |

## 调研

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| F-001 | M15 原始设计意图（roadmap.md:426-442） | M15 定位为"消费 M14b 事实做流程退化诊断+成本归因"；硬性验收："只读取 M14b facts/index，不需要改核心流程代码；核心目录 diff 非空即失败" | 已采信 | 见正文 D 绑定 |
| F-002 | 当前实现技术真相（代码调研） | 唯一全能力 adapter 是 codex（rollout token_count 事件+专用 session hook）；DSH 规范化器只产 requirement_message；其余 provider 无钩子；监控链 = monitoring-facts/projector/diagnostics/page + codex-transcript-adapter + dsh-transcript + fact-collector + runMonitoringSidecar(stage-runtime.mjs:1118) + outcomeCostFacts(stage-runtime.mjs:586) + task-store facts.jsonl 读写 | 已采信 | 见正文 D 绑定 |
| F-003 | M15 研发史（specs/archive 三个 m15 目录 + reflog） | 初版 13 分钟交付 +6523 行/35 文件，T009 收尾验证从未闭环；后经历收据边界补丁与 runtime-observability-repair 返工；"没采到≠流程退化"问题从未解决 | 已采信 | 见正文 D 绑定 |
| F-004 | M0/decision-log 既有原则 | D28：层1指标应由流程引擎顺带生成、skill 不埋点；D30：关键事实禁止 LLM 推断，采不到记 unknown/unavailable；M0 铁律：采集纯脚本零 AI 成本、指标只观察不当 gate、孤儿采集器警示 | 已采信 | 见正文 D 绑定 |
| F-005 | 阶段自记录机制 ≠ M15 监控链 | make-decision SKILL.md 的"同一会话自动记录"（workflowhub-codex-session-event.mjs start/finish）是五阶段自身的 step/skill 执行记录，服务 stage outcome 事实；与 M15 监控采集链（transcript 解析/token 归因/投影页面）是两套东西，退役范围必须区分 | 已采信；本任务在 DSH 宿主下该记录机制返回 unavailable（实测：`no codex session id in environment`），如实记录不阻塞 | 待定 |

## 范围初判（triage）

- **已确认事实**：M15 监控链失败且成本高（R-003/R-005/F-002/F-003）；退役方向用户已明确（R-001/R-002）；其他 provider 采不到数据是设计内诚实行为而非 bug（F-004/D30）。
- **假设（待 Talk 验证）**：①"退役"= 拆除监控采集链代码而不仅是停用页面；②两个第一层补丁（人工介入原文、artifact 消费链）纳入本任务；③历史 facts/monitor 产物只读保留不删除。
- **改变方向的歧义**：①退役深度——是否触及 codex 专用 session 钩子（它与阶段自记录机制有共享代码，F-005）；②monitor 页面与生成器的去留；③补丁纳入范围。→ Talk Round 1 处理。
- **非目标（初判，待确认）**：不做 M16 候选池/迭代入口；不做离线复盘器（任务 B）；不补 DSH/Kimi/Claude 的 token 解析器；不改五阶段骨架；不删除历史只读记录。
- **延期项（初判）**：第 2 层判断层（离线复盘器）→ 任务 B；M16 本体；多 provider 能力对齐 → M17b。

## 需求-决策覆盖矩阵（五维）

| 维度 | 原始需求条目 | 当前处置 |
| --- | --- | --- |
| 业务目标 | R-003（知道哪里慢/质量低/如何优化，但不为监控而监控） | 已定：本任务只做止损（D-001）；洞察归任务 B/M16（D-006/DEF-001） |
| 流程/界面 | R-001/R-002（M15 退役；monitor 页面去留） | 已定：仓内全拆、仓外静态尸体+提示条（D-002/D-003） |
| 数据/状态 | R-002（补丁范围）；历史数据处置 | 已定：补丁延期（DEF-002）；历史全部只读（D-004） |
| 成功/失败/验收 | 未定义 | 已定：成功/失败边界节（命令级，D-005） |
| 约束/非目标/延期 | R-004 + 非目标 | 已定：非目标七条 + DEF-001~004（D-008） |

## 大白话卡（当前状态）

- **核心需求**：把花大力气却没产出价值的 M15 监控体系从 workflowhub 里拆干净，顺便给未来 M16 留两个便宜又有用的数据补丁。
- **核心目标**：workflowhub 回归轻量；以后每个任务自动留下"人为什么介入、产出有没有被用上"的原始记录，供离线分析用。
- **拟定方向**：拆监控链、留执行记录、页面留作历史快照、两个补丁纳入——待 Talk 确认。

## 阶段执行事实

- 会话事件记录机制：unavailable（DSH 宿主非 Codex 会话，`no codex session id in environment`；step/skill 级自动记录本阶段全程不可用，如实记录，不阻塞）。
- Step 1（load-context）：completed。已读 workflows/make-decision/SKILL.md、steps.json、skill-deps.yaml、skills/decision-log、skills/talk-with-zhipeng 及模板；前序调研结论（F-001~F-005）作为研究输入登记。
- Step 2（triage-scope）：completed。范围初判与覆盖矩阵如上；3 个改变方向的歧义进入 Talk Round 1。

## 三轮 talk

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001 | R1-Q1 退役拆到哪层：①只拆 M15 监控链保留阶段自记录（推荐）/②两套都简化/③只关网页 | 选①：甩包袱，风险是共享代码要分清；选②：动五阶段骨架、范围爆炸；选③：留孤儿采集器 | 选①「只拆①保留②」 | 提问时队列 4 个，答后剩 3 | 用户本轮回复 q1-retire-boundary |
| T-002 | R1-Q2 monitor 页面去留：留作快照删生成器（推荐）/全删/保留简化三区块 | 用户自定义答案改变了预设 | **自定义**：「我接下来也会设计离线复盘器这个功能，离线复盘器最终的结果也会显示在这个 monitor 页面里面，所以这个页面和这个生成的逻辑还是要保留的，只不过里面内容和原来完全不一样，这个改动放在下一个离线复盘器任务里面做」→ 本任务：页面+投影生成逻辑保留不动，内容重做归下一任务 | 答后新增派生问题「页面冻结状态是否被接受」入 R2 | 用户本轮回复 q2-monitor-page custom |
| T-003 | R1-Q3 两个补丁（人工介入原文 / artifact 消费链）是否纳入：都纳入（推荐）/只纳入前者/纯退役 | 纳入则任务有建设产出；纯退役最快最聚焦 | 选③「都不纳入，纯退役」——本任务只拆不建，补丁归后续任务 | 答后剩 2 + 1 派生 | 用户本轮回复 q3-patch-scope |
| T-004 | R1-Q4 历史数据处置：全部只读保留（推荐）/删 monitor 留 facts/全删 | 全删违反宪法历史只读原则 | 选①「全部只读保留」 | R1 收敛：无 high/medium 遗留；派生问题移 R2 | 用户本轮回复 q4-history-data |

**R1 收敛结论**：方向定为——本任务是**纯退役**任务：拆 M15 监控采集链、保留阶段自记录机制、历史数据全部只读保留、两个补丁不纳入。~~monitor 页面与投影生成逻辑原样保留~~（**注：此句已被 Grill G1 推翻**——代码核实发现投影链硬依赖采集链文件，用户改选仓内生成逻辑一并拆除、仅保留仓外静态页面文件，见 D-002/D-003 与 Supersedes）。R1 共 4 问全部回答，无 high/medium 遗留。

## 调研执行记录（step 4）

- 本任务所需调研已在 make-decision 启动前真实完成（本会话前序三路并行调研：M15 原始需求与决策史、specs/archive 三版演变、代码实现与侵入清单），结论已登记为 F-001~F-005。
- 是否触发新外部调研：**跳过**。理由：退役对象是本仓库自身代码，事实已通过代码调研直接获得；外部方案（Opik/Agent-as-a-Judge 等）属于任务 B（离线复盘器）的输入，其答案不会改变"是否退役、拆到哪"的方向。

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-005 | R2-Q5 验收深度：测试+静态检查+一次真实小任务（推荐）/只测试+静态检查/完整 dogfooding | 选①：证据最硬，多花一点时间 | 选① | 队列 3，答后剩 2 | 用户回复 q5-acceptance-depth |
| T-006 | R2-Q6 页面冻结期：接受冻结（推荐）/页面必须保持可用 | 接受：本任务最简单，代价是冻结期无新数据；不接受：拆除范围缩水、任务 B 还要再拆一次 | 选①「接受冻结」 | 答后剩 1 | 用户回复 q6-page-freeze |
| T-007 | R2-Q7 非目标清单确认（不做复盘器/不做两补丁/不动自记录/不动骨架/不补其他 provider） | 全部确认则范围最小 | 选①「全部确认」 | R2 收敛 | 用户回复 q7-nongoals |

**R2 收敛结论**：验收=测试+静态检查+一次真实小任务端到端；接受页面冻结期；非目标五条全部确认。R2 共 3 问全部回答，无 high/medium 遗留。

## 方向盲审（step 6，wh-review direction track）

- 执行事实：outcome=partial。kimi/coding（kimi-for-coding）completed、grok/grok（grok-4.6）completed、codex/luna failed（PUBLIC_RESULT_INVALID）。失败事实保留，不改写为通过。
- 收到 5 条 findings（2 家异源），处置见"审查处置"表 FND-001~FND-005，逐条进入 Talk Round 3。

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-008 | R3-Q8 拆除边界细化（处置 FND-001/004）：采集链拆、投影链整套留（推荐）/投影链也拆/全拆 | 选①：页面安全冻结、任务 B 直接复用投影链；代价是 schema+投影器暂留 | 选① | 队列 3，答后剩 2 | 用户回复 q8-retire-split |
| T-009 | R3-Q9 任务衔接（处置 FND-002/005）：承诺任务 B 紧随其后（推荐）/不承诺/先复盘器再退役 | 选①：洞察空窗期最短 | 选①「承诺任务 B 紧随其后」 | 答后剩 1 | 用户回复 q9-sequencing |
| T-010 | R3-Q10 验收加固（处置 FND-003）：阶段自记录不受影响加入验收（推荐）/不加 | 选①：基本零成本防回归 | 选① | R3 收敛 | 用户回复 q10-selfrecord-check |

**R3 收敛结论**：~~拆除边界细化为"采集链拆、投影链整套留"~~（**注：此边界已被 Grill G1 推翻**——代码核实发现投影链硬依赖采集链文件，用户改选全拆，见 D-002 与 Supersedes）；承诺任务 B（离线复盘器）紧随其后启动；验收加入"阶段自记录不受影响"验证。盲审 5 条 findings 全部处置完毕（FND-004/005 见审查处置表）。

## grill（step 8）

| grill_id | CONTEXT/冲突 | 结论 | ADR/四项退出 | source/evidence |
| --- | --- | --- | --- | --- |
| G-001 | 代码核实推翻 R3 边界假设 | 采集链/投影链/自记录三方在代码里纠缠（详见下），"按文件名拆采集留投影"不可执行；用户改选**全拆** | 退出检查见下 | Grill 代码核实报告（子代理，本会话） |
| G-002 | 未提交改动纠缠 | 主工作区 `M runtime/stage/stage-agent-outcome-adapter.mjs` + `D apply/evidence/current-diff-ac-coverage.json` 属 AC 证据绑定修复，与监控无关但所改文件依赖待处理模块；用户选**先提交/暂存再开工** | — | git status/diff 实测 |

**Grill 代码核实关键事实**（反向引用扫描，均有路径:行号证据，摘要存本日志）：

- 纠缠一：monitoring-projector（原拟留）硬 import monitoring-facts + monitoring-diagnostics（原拟拆）→ 自相矛盾。
- 纠缠二：阶段自记录的需求认证/需求快照子集住在拟拆文件里（codex-transcript-adapter 的 isAuthenticatedRequirementResult/parseRegisteredRequirementTranscript、fact-collector 的 authenticateRegisteredRequirementMessages、dsh-transcript 的快照函数、session-state.mjs:26,258-269）→ 该子集强制划入自记录保留区，不能整文件删。
- 纠缠三：task-store 的 facts.jsonl 通用读路径用 monitoring 分类器 → 拆时把分类判断下沉为 schema_version 字符串判断。
- 纠缠四：tests/helpers/stage-outcome.mjs 被 8 个非监控测试依赖却 import 采集链 → helper 需迁移到保留符号。
- 干净面：workflows/ 零监控引用；session-hook/session-event 两文件干净；collect-task-facts.mjs 是孤儿 CLI；config 三个 *-sources.mjs 是空 registry 只有孤儿引用。

**全需求覆盖矩阵**：goal=R-003 止损（T-003）；flow_or_surface=monitor 页面冻结/静态尸体（T-002+G1 修正）；data_or_state=历史 facts/monitor 数据只读（T-004）；success_failure_acceptance=Q5+Q10（T-005/T-010）；constraint_non_goal_defer=Q7 五条非目标+任务 B 承诺（T-007/T-009）。五类全覆盖。

**四项退出检查**：
1. 外部依赖接口核实：pass——纯删除任务，无新外部接口；wh-review 接口已实测（partial 事实如上）。
2. 命名唯一定义：pass——无新增命名；退役对象清单以 Grill 核实报告为唯一权威来源。
3. 失败语义明确：pass——被删模块引用必须清零（node 启动/import 报错即失败）；仓外页面成为静态尸体仍可打开；历史数据只读。
4. 范围边界写死：pass——G1 全拆 + 自记录保留区清单（需求认证/快照子集）+ 五条非目标。

**Grill 问答**：1 批 2 题（G1 拆除粒度、G2 未提交改动处置），真实回复后收敛，无遗留 high/medium。

**CONTEXT.md / ADR 结论**：
- CONTEXT.md：no-change。理由：未新增/修改领域术语；"监控退役"是任务级事实不是术语变化。
- ADR：not-needed。理由：三项判据中"难以反转"不成立（代码可经 git 历史恢复；退役决策与理由已由本 decision-log + move-map 删除条件完整记录）；其余两项（无背景会意外、真实取舍）成立但不满三项全真门槛。ADR-0012 保持历史只读，不改写。

---

## 目标

- 把 M15 监控体系从 workflowhub 生产代码中完整退役，止住"为高成本低价值采集链持续付维护税"的损；为紧随其后的任务 B（离线复盘器）留出干净的重建地面。

## 成功/失败边界

- **成功边界**（细节审查后具体化，命令级可复核）：①监控链代码按"拆除/保留符号地图"（文末附录 A）全部删除，`grep -rn "monitoring-facts\|monitoring-diagnostics\|monitoring-projector\|codex-transcript-adapter\|fact-collector\|dsh-transcript\|runMonitoringSidecar\|outcomeCostFacts\|tokenUsageBetween" runtime/ tools/ workflows/ config/` 零命中（白名单=保留区文件 codex-transcript-adapter.mjs/fact-collector.mjs/dsh-transcript.mjs 及其合法引用者按文件名的命中，属预期；但这些文件内部不得残留被摘除符号）；②`npm test` 与 `npm run check` 全绿；③真实任务验证=本任务自身的 build-spec→build-plan→build-code→verify-code 后续阶段即为验证载体，跑通即证明五阶段正常；④自记录回归验证：task-store facts 读写、stage outcome、需求认证/快照路径正常——**注意**：codex 会话事件机制（step/skill token 事件）在本 DSH 宿主下天然 unavailable（实测 `no codex session id in environment`），该子项在 DSH 下只能保持 unavailable 诚实记录、不算回归也不算通过，留待 codex 宿主任务顺带验证；⑤历史数据零改动：开工前对仓外 workflowhub-monitor-data.js、workflowhub-monitor-facts.jsonl 与各任务 facts.jsonl 记录 sha256 清单，完工后逐一比对不变；html 的唯一豁免是⑥的提示条改动，完工后记录新 sha256；⑥仓外页面静态可开（已实测：workflowhub-monitor.html 无 fetch/XHR/动态 import，仅读同目录 data.js，file:// 直开正常），且页面顶部加静态"已退役"提示条（范围内唯一仓外改动）。
- **失败边界**：阶段自记录任何一环回归（DSH 天然 unavailable 子项除外，如实标注）；误删共享代码导致五阶段执行报错；历史记录被改写或删除；拆除后仍有对已删模块的引用。

## 范围

- **当前范围**：runtime/evidence/ 监控五件套（monitoring-facts、monitoring-diagnostics、monitoring-projector、monitoring-page.html、codex-transcript-adapter 的监控子集）、dsh-transcript 的监控子集、fact-collector 的监控子集、stage-runtime.mjs 的 runMonitoringSidecar/outcomeCostFacts/监控源解析段、session-state.mjs 的 tokenUsageBetween 及其调用点、runtime/schemas/ 两个 monitoring schema、tools/cli/collect-task-facts.mjs 孤儿 CLI、config/ 三个空 registry、纯监控测试删除 + 混测测试改造、check-task-record-paths.mjs 登记表同步、move-map.json 删除登记。
- **保留区（写死）**：阶段自记录机制全套；需求认证/需求快照子集（即使它们住在待删文件里，也要把保留符号迁移或留下）；仓外 monitor 三件套与历史任务数据（唯一例外：html 顶部加"已退役"静态提示条，见成功边界⑤⑥）。

## 非目标

1. 不做离线复盘器（任务 B）；2. 不做人工介入原文、artifact 消费链两个补丁（后续任务）；3. 不动阶段自记录机制；4. 不动五阶段骨架；5. 不给 DSH/Kimi 等其他 agent 补数据采集；6. 不改写 ADR-0012 等历史记录；7. 不删除仓外 monitor 页面文件。

## 决定

### D-001
- question/final_option: 本任务性质 → 纯退役，只拆不建
- recommendation/plain_language: 推荐；用户明确"先止损，建设归后续"
- decision: 任务 A = M15 纯退役，不含任何新增采集/补丁能力
- source_type/reference/exact_excerpt: 用户 Talk R1 回复 q3-patch-scope「都不纳入，纯退役」
- approval_binding: Talk R1 用户真实选择
- 事实与约束: R-003（数据收集成本太大、得不偿失）；F-003（三版返工史）
- Logic: 监控链失败且维护税高 -> 建设性内容会扩大范围 -> 纯退役 -> 最小风险止损
- choice_reason/impact: 范围最小化；影响=本任务无新能力产出
- consequences_and_risks: 拆完后无任何新数据可看（空窗期），由 D-006 任务 B 承诺对冲
- rejected_alternatives: 纳入两个补丁（用户否决）；只关页面留采集链（留孤儿代码）
- unresolved_items/owner: 无
- Supersedes: none

### D-002
- question/final_option: 退役拆到哪层 → 监控链全拆（含投影设施），自记录全留
- recommendation/plain_language: 盲审前推荐"拆采集留投影"；Grill 代码核实证明两链纠缠不可分后，用户改选全拆
- decision: 拆除清单=范围节所列；保留区=阶段自记录全套 + 需求认证/快照子集（纠缠符号迁移或保留）；仓外页面成静态尸体
- source_type/reference/exact_excerpt: 用户 Grill 回复 g1-removal-granularity「连投影设施一起拆干净」；Grill 代码核实报告四处纠缠
- approval_binding: Grill 用户真实选择（G1）
- 事实与约束: projector 硬 import facts/diagnostics（纠缠一）；自记录依赖 adapter/fact-collector/dsh-transcript 子集（纠缠二）；task-store 分类器纠缠（纠缠三）
- Logic: 文件名级边界不可执行 -> 按功能纠缠重划 -> 全拆+保留区清单 -> 页面静态、地面干净
- choice_reason/impact: 拆除最彻底，任务 B 白地重建更干净；影响=投影器/诊断/facts 格式一并删除
- consequences_and_risks: 任务 B 重建投影设施成本变高（用户已知情接受）；拆除面大，由 D-006 验收对冲回归风险
- rejected_alternatives: 拆采集留投影（代码核实证明不可执行，选项失效）；只拔触发点（留死代码）
- unresolved_items/owner: 无
- Supersedes: T-008（R3-Q8「采集链拆、投影链整套留」）——被 Grill 新事实推翻，用户重新选择

### D-003
- question/final_option: monitor 页面处置 → 仓外页面留作静态尸体，内容重做归任务 B
- recommendation/plain_language: 用户主动提出页面未来要复用为复盘器展示载体
- decision: 本任务不动仓外 ~/Knowledge/Projects/workflowhub-monitor.html 三件套的内容数据，唯一改动是 html 顶部加静态"已退役"提示条（FND-106 升级为必做）；仓库内生成逻辑随 D-002 全拆
- source_type/reference/exact_excerpt: 用户 Talk R1 q2-monitor-page 自定义回复「这个页面和这个生成的逻辑还是要保留的，只不过它里面内容就和原来完全不一样了，这个改动应该是放在下一个离线复盘器那个任务里面来做」
- approval_binding: Talk R1 用户真实回复
- 事实与约束: G1 后"生成逻辑保留"修正为"仅保留仓外静态文件；仓内生成逻辑拆除，任务 B 重建"
- Logic: 用户要复用页面载体 -> 但仓内实现与采集链纠缠 -> 仓外留尸体+仓内全拆 -> 两意图兼得
- choice_reason/impact: 尊重用户复用意图且不与拆除冲突
- consequences_and_risks: 页面数据永久停在最后快照（用户 T-006 已接受冻结）
- rejected_alternatives: 页面也删（用户否决）；保留仓内生成逻辑（G1 推翻）
- unresolved_items/owner: 无（页面"已退役"静态提示条经细节审查升级为范围内必做，见成功边界⑥）
- Supersedes: none

### D-004
- question/final_option: 历史数据处置 → 全部只读保留
- recommendation/plain_language: 推荐；符合宪法历史只读原则
- decision: 任务目录 facts.jsonl、仓外 monitor 数据文件全部只读保留，本任务零改动
- source_type/reference/exact_excerpt: 用户 Talk R1 回复 q4-history-data「全部只读保留」
- approval_binding: Talk R1 用户真实选择
- 事实与约束: AGENTS.md「旧记录只读保留」；任务 B 可拿历史数据做复盘样本
- Logic: 宪法要求+复盘样本价值 -> 只读保留
- choice_reason/impact: 零风险
- consequences_and_risks: 占磁盘，可忽略
- rejected_alternatives: 部分删除/全删（违宪法）
- unresolved_items/owner: 无
- Supersedes: none

### D-005
- question/final_option: 验收深度 → 测试+静态检查+一次真实小任务+自记录回归验证
- recommendation/plain_language: 推荐；删除型任务必须有端到端证据
- decision: 验收=①现有测试与静态检查通过；②被删模块零残留引用；③用 workflowhub 真实走一个任务（可复用本任务后续阶段）确认五阶段与自记录正常；④自记录回归验证（T-010）
- source_type/reference/exact_excerpt: 用户回复 q5-acceptance-depth「测试+静态检查+一次真实小任务」、q10-selfrecord-check「加入验收」
- approval_binding: Talk R2/R3 用户真实选择
- 事实与约束: F-003 教训（初版 M15 未做端到端验证导致返工）
- Logic: 拆除风险在共享代码 -> 静态扫描+真实运行双重验证 -> 回归可发现
- choice_reason/impact: 验收成本适中、证据硬
- consequences_and_risks: 多花一次真实任务的时间
- rejected_alternatives: 只跑测试（证据不足）；完整 dogfooding（过重）
- unresolved_items/owner: 无
- Supersedes: none

### D-006
- question/final_option: 任务衔接 → 承诺任务 B（离线复盘器）紧随其后启动
- recommendation/plain_language: 推荐；对冲盲审指出的"洞察空窗"风险
- decision: 任务 B 紧随承诺具体化——**触发条件**：任务 A 的 verify-code 通过（或本任务交付被用户接受）后立即启动；**任务标识**：建议 `task-retrospective`（离线复盘器+页面内容重做+两个数据补丁）；**owner**：用户+主代理；**空窗期上限**：任务 A 交付后下一个工作任务即任务 B；**A→B 交接契约**：本 decision-log 的 DEF 清单 + 历史只读数据样本 + 仓外静态页面载体，无其他隐性交接物。
- source_type/reference/exact_excerpt: 用户回复 q9-sequencing「承诺任务 B 紧随其后」
- approval_binding: Talk R3 用户真实选择
- 事实与约束: 盲审 FND-002/FND-005
- Logic: 纯退役不产生洞察 -> 空窗期风险 -> 紧接着启动任务 B -> 空窗最短
- choice_reason/impact: 消除盲审主要顾虑
- consequences_and_risks: 锁定近期工作投向
- rejected_alternatives: 不承诺（空窗拖长）；先复盘器再退役（顺序拧了）
- unresolved_items/owner: 无
- Supersedes: none

### D-007
- question/final_option: 未提交改动处置 → 先在主工作区提交或暂存再开工
- recommendation/plain_language: 推荐；保持任务 A 基线干净
- decision: build-code 开工前，先把主工作区 stage-agent-outcome-adapter.mjs 修改 + current-diff-ac-coverage.json 删除这两个无关改动提交或暂存
- source_type/reference/exact_excerpt: 用户 Grill 回复 g2-uncommitted-changes「先在主工作区提交或暂存再开工」
- approval_binding: Grill 用户真实选择
- 事实与约束: Grill 核实该改动属 AC 证据绑定修复、与监控无关
- Logic: 无关在制品混入拆除 diff -> 验收回溯变脏 -> 先安顿 -> 基线干净
- choice_reason/impact: 保证拆除 diff 纯净可审
- consequences_and_risks: 需用户确认那两个改动的提交方式
- rejected_alternatives: 开工时一并处理（diff 混杂）
- unresolved_items/owner: 提交信息/归属 → build-code 开工时处理
- Supersedes: none

### D-008
- question/final_option: 非目标清单 → 七条全部确认
- recommendation/plain_language: 推荐；范围最小化
- decision: 非目标七条见"非目标"节，逐条写死
- source_type/reference/exact_excerpt: 用户回复 q7-nongoals「全部确认」
- approval_binding: Talk R2 用户真实选择
- 事实与约束: D-001 纯退役定位
- Logic: 范围蔓延是 M15 失败根因之一 -> 非目标写死 -> 防蔓延
- choice_reason/impact: 边界清晰
- consequences_and_risks: 无新增能力，空窗期由 D-006 对冲
- rejected_alternatives: 无
- unresolved_items/owner: 无
- Supersedes: none

## 审查处置

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| FND-001 | kimi major：拆采集链留页面导致投影层依赖的 schema/数据源消失，页面从"冻结"变"坏掉" | 促成 Q8 边界细化，最终经 Grill 演变为全拆（D-002），问题消解 | fixed | D-002 全拆后无此依赖；验收含零残留引用检查 | make-decision/build-code/retain |
| FND-002 | kimi major：纯退役消除唯一可见性，建议替代品先行或承诺紧随 | 促成 D-006 任务 B 紧随承诺 | fixed | D-006 记录承诺 | make-decision/retain |
| FND-003 | kimi minor：自记录与待删组件的独立性未验证 | 促成 Grill 代码核实（纠缠二/三/四被发现）+ T-010 验收加固 | fixed | Grill 核实报告；D-005 验收④ | make-decision/build-code/retain |
| FND-004 | grok major：保留页面逻辑与"页面离设想差距大"的原始需求矛盾 | G1 全拆后仓内页面逻辑一并删除，矛盾消解 | fixed | D-002/D-003 | make-decision/retain |
| FND-005 | grok major：方向未直接回应"为什么慢/质量低/step 有没有必要"的核心目标 | 分阶段策略：本任务止损，洞察由任务 B 交付；已承诺紧随 | accepted_risk | D-006；任务 B 启动时关闭此风险 | 用户/任务 B/retain |
| FND-006 | 方向盲审 transport 事实：codex/luna failed（PUBLIC_RESULT_INVALID），kimi/grok completed，outcome=partial | 2/3 异源 reviewer 返回有效 findings，满足 advice 可用；失败事实保留不改写 | accepted_risk | 本日志方向盲审节 | make-decision/retain |

## 最终确认

- 状态：accepted
- 用户原文与 host-visible 绑定：最终确认卡回复——q-final-confirm「确认，锁定决策」；q-final-stash「提交为一个独立 commit」（OPEN-001 关闭：无关在制品以独立 commit 提交后开工）
- 未确认内容：无
- 确认时点事实：方向盲审 partial（kimi/grok 有效、codex failed）、细节审查 available（8 条 findings，FND-101~107 已修复、FND-108 由 q-final-stash 关闭）

## 拒绝方案

| 选项 | 拒绝理由 | 关联 D |
| --- | --- | --- |
| 两套记录都重新简化 | 动五阶段骨架，范围爆炸，违背止损定位 | D-001 |
| 只关网页留采集链 | 留孤儿采集器（M0 警示） | D-001 |
| 纳入两个数据补丁 | 用户明确纯退役 | D-001 |
| 拆采集留投影 | Grill 代码核实证明文件名级边界不可执行，选项失效 | D-002 |
| 只拔自动触发点 | 留死代码 | D-002 |
| 页面也删/全删历史 | 用户要留页面载体；删历史违宪法 | D-003/D-004 |
| 先复盘器再退役 | 复盘器建在待拆链上，顺序拧了 | D-006 |

## 风险与延期交接

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
| --- | --- | --- | --- |
| RISK-001 | 拆除面大、共享代码多，存在误删自记录依赖的回归风险 | 五阶段执行报错 | build-code 严格按 Grill 保留区清单；verify-code 跑 D-005 验收 |
| RISK-002 | 洞察空窗期：拆完到任务 B 上线之间无新数据可看 | 优化工作暂停感知 | 任务 B 紧随（D-006）/用户 |
| RISK-003 | 任务 B 需重建投影设施，成本比"保留改造"高 | 任务 B 工作量上升 | 用户 G1 已知情接受/任务 B |
| DEF-001 | 离线复盘器（判断层）+ 页面内容重做 | 任务 B（触发=D-006） | 任务 B/用户；关闭条件=任务 B 交付 |
| DEF-002 | 人工介入原文记录、artifact 消费链两个补丁 | 任务 B（D-006 任务标识已含；关闭条件=任务 B 交付） | 任务 B |
| DEF-003 | M16 候选池/迭代入口/负例库 | 任务 B 之后 | M16 任务；关闭条件=M16 立项交付或用户明确取消 |
| DEF-004 | 多 provider 能力对齐 | M17b | M17b 任务；关闭条件=M17b 交付或用户明确取消 |

## 细节审查（step 10，wh-review detail track）

- 执行事实：status=available，outcome=completed；kimi/coding、antigravity/flash、codex/luna 三家全部 completed；8 条 findings。处置如下（编号 FND-101~108）：

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| FND-101 | kimi major：D-002 拆/留子集无具体符号与行号，build-code 无法安全动刀 | 已在文末补"附录 A 拆除/保留符号地图"（Grill 核实报告全文要点落入日志） | fixed | 附录 A | build-code/retain |
| FND-102 | kimi major：成功边界⑤未验证仓外页面是否自包含 | 已实测：html 无 fetch/XHR/动态 import，仅读同目录 data.js，file:// 直开正常；结论写入成功边界⑥ | fixed | 实测记录（本日志成功边界节） | verify-code/retain |
| FND-103 | codex blocking：最终确认仍 pending，草案未获用户确认 | 这是步骤 10 时点的事实，非缺陷；步骤 11 由用户真实确认关闭 | fixed | 步骤 11 确认记录 | make-decision/retain |
| FND-104 | codex major：R1 收敛结论"投影生成逻辑原样保留"与 G1/D-002 删除冲突 | 已在 R1 收敛结论加推翻标注，Supersedes 已登记 | fixed | R1 收敛结论修订行 | make-decision/retain |
| FND-105 | codex major：验收不可直接执行（无命令/范围/比对方法/任务身份），且自记录在 DSH 下 unavailable | 成功边界已具体化到命令级；DSH 下 codex 会话事件子项诚实标 unavailable、不算回归也不算通过 | fixed | 成功边界节（命令+sha256 比对+载体+unavailable 标注） | verify-code/retain |
| FND-106 | codex major：冻结页面可能误导用户把旧快照当当前监控 | "已退役"静态提示条从可选项升级为成功边界⑥必做 | fixed | 成功边界⑥；D-003 未决项关闭 | build-code/retain |
| FND-107 | codex major：任务 B 承诺缺 owner/触发/标识/空窗上限/交接契约 | D-006 已补全五项 | fixed | D-006 修订 | 用户/任务 B/retain |
| FND-108 | codex major：D-007"提交或暂存"未收敛，基线无法稳定复核 | 升级为最终确认卡的必答题，用户选定后写入 | needs_human | 最终确认卡 q-final-stash | 用户/retain |

## 附录 A：拆除/保留符号地图（Grill 代码核实报告要点，build-code 唯一权威清单）

**整文件删除**：`runtime/evidence/monitoring-diagnostics.mjs`、`runtime/evidence/monitoring-projector.mjs`、`runtime/evidence/monitoring-page.html`、`runtime/schemas/monitoring-fact.v1.json`、`runtime/schemas/monitoring-projection.v1.json`、`tools/cli/collect-task-facts.mjs`、`config/transcript-sources.mjs`、`config/runtime-fact-sources.mjs`、`config/runtime-fact-v2-sources.mjs`；纯监控测试 `tests/m15-monitoring-facts.test.mjs`、`tests/m15-monitoring-diagnostics.test.mjs`、`tests/m15-monitoring-projector.test.mjs`、`tests/m15-codex-transcript-adapter.test.mjs`、`tests/m15-monitoring-integration.test.mjs`。

**行级摘除**：`tools/cli/stage-runtime.mjs` 的 `normalizeCodexRollout`(:232)、`resolveDefaultMonitoringSource`(:367)、`outcomeCostFacts`(:586-629)、`runMonitoringSidecar`(:1118) 及 run 主路径 :1390/:1421 两处调用；`tools/host/workflowhub-codex-session-state.mjs` 的 `tokenUsageBetween`(:429-453) 及 `finishCodexSessionEvent` :658 的 event.usage 行；`tools/cli/check-task-record-paths.mjs` :81-82/:99/:226 监控登记项；`docs/architecture/move-map.json` :1620-1625/:1638-1661 监控登记改为已退役。

**保留区（自记录强制保留，住在待处理文件中）**：`codex-transcript-adapter.mjs` 的 `isAuthenticatedRequirementResult`、`parseRegisteredRequirementTranscript`、`createRegisteredCodexSource`（需求认证与源构造，引用者 stage-agent-outcome-adapter.mjs:17,356、stage-runtime.mjs:448/:373/:397、tests/helpers/stage-outcome.mjs:8、tests/m15-codex-session-hook.test.mjs:21）；`fact-collector.mjs` 的 `authenticateRegisteredRequirementMessages`、`isTranscriptSourceReader`、`createTranscriptSourceReader`；`dsh-transcript.mjs` 的需求快照/路径函数（引用者 session-state.mjs:26,258-269）；`task-store.mjs` 的 facts.jsonl 通用读写（监控分类器 `isMonitoringFact/isHistoricalMonitoringFact` 下沉为 schema_version 字符串判断，:113-129）；`monitoring-facts.mjs` **整删**（决策定死，消除条件分支）：`safePublicRef` 无存活引用者（原唯一引用者 projector 同删），`isMonitoringFact/isHistoricalMonitoringFact` 由 task-store 下沉为 schema_version 字符串判断后不再需要。

**测试改造（不删）**：`tests/helpers/stage-outcome.mjs`（8 个非监控测试依赖，迁移到保留符号）；`tests/m15-codex-session-hook.test.mjs`、`tests/dsh-transcript.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs` 摘除监控断言后保留自记录用例。

**干净不动**：`workflows/`（零监控引用）；`tools/host/workflowhub-codex-session-hook.mjs`、`workflowhub-codex-session-event.mjs`（干净）。

## 质量边界

- 质量事实：wh-review 方向盲审 outcome=partial（kimi/grok 有效、codex failed）；Grill 代码核实报告；后续细节审查事实；会话事件记录全程 unavailable（DSH 宿主，如实记录）。
- 推进资格： Talk/Grill 真实回复已收敛；事实写入失败不冻结对话，同任务修复。
- 完成判据：成功/失败边界节五条 + D-005 验收四项。
- 不可逆授权边界：代码删除发生在任务 worktree，经 verify-code 后才合并；历史数据任何写操作都禁止。

## 未决项

| item_id | 未决内容 | 原因 | 谁在何时解决 |
| --- | --- | --- | --- |
| ~~OPEN-001~~ | ~~主工作区两个未提交改动的处置方式~~ | 已关闭：最终确认 q-final-stash 选定"提交为一个独立 commit" | build-code 开工前执行 |
| ~~OPEN-002~~ | ~~仓外页面是否加"已退役"静态提示~~ | 已关闭：FND-106 处置后升级为成功边界⑥必做 | — |

## Supersedes

- D-002 supersedes T-008（R3-Q8「采集链拆、投影链整套留」）：Grill 代码核实发现投影链硬依赖采集链文件，原选项不可执行，用户 G1 改选全拆。

## 文档结果

- CONTEXT.md：no-change。理由：无领域术语新增/变更；监控退役是任务级事实。文件引用：CONTEXT.md 未触碰。
- ADR：not-needed。理由：三项判据未全真——"难以反转"不成立（代码可经 git 历史恢复，决策已由本日志+move-map 删除条件记录）；"无背景会意外"与"真实取舍"成立。ADR-0012 保持历史只读不改写。
- ADR criteria：hard to reverse=false / surprising without context=true / genuine trade-off=true
- 术语/ADR 冲突及处理：无冲突。
- 不复制 spec 的边界：本日志只记决策与来源索引；拆除文件清单明细、改造步骤、测试清单归 build-spec/build-plan。

## Exit checks

- 上下文一致：pass（Grill 核实报告与 D-002 保留区清单一致）
- owner/接口一致：pass（无新接口；删除对象有唯一权威清单）
- 失败语义明确：pass（零残留引用、页面静态可开、历史零改动）
- 范围与延期明确：pass（非目标七条 + DEF-001~004）

## spec-analyze（step 12，独立上下文执行）

- 执行事实：独立子代理按 skills/spec-analyze/SKILL.md 检查原始需求覆盖、日志语义一致性、验收可执行性、聚合 hash 绑定。结论初判 **incomplete**：2 HIGH + 5 MEDIUM + 3 LOW。
- 处置：F-1~F-9 全部当场修复（成功边界⑤⑥矛盾消解、R3 收敛结论补推翻标注、D-001 错引 D-007→D-006、DEF-005 悬空、grep 预言机定死+monitoring-facts 整删消条件分支、triage 时点三索引表刷新、DEF-002 触发写死、OPEN-001 关闭标注、FND-108 命名统一）；F-10（聚合 schema 不覆盖 grill/confirm 事件）核实为非缺陷——workflowhub-interaction-aggregate.v1 契约本就只建模 talk/clarify（workflows/make-decision/SKILL.md），记录为观察项。
- 复查结论：修复均为文档一致性修复，不改变已确认决策语义；无遗留 HIGH/MEDIUM。spec-analyze 最终结论：**complete**。
- 聚合重建：上述修复改变了 decision-log 字节，按"决策变更则重建聚合"规则以修复后字节重建交互聚合（决策语义未变，属文档修复后刷新）。

## 阶段收尾事实（step 13 publish）

- 交互聚合：初版 `quality/evidence/interactions/bc2367456eef52c56833fd42c6c5fd7208580f9384d78fd427dbe1596c6c1f72.json`（决策确认时点）；spec-analyze 文档修复后重建为 `quality/evidence/interactions/e5eea5423dad65b590dddf4745197eb17c318843eb70a5d3c759d65bee8b5865.json`（decision_hash=953bf277…c03d）。两版均不可变保留。
- 人工确认事实：`quality/confirmations/c4d5b9baaee4311b946e00309572b79c97c967e83df5dc048ccf9bdbe1e34e71.json`（task=m15-retirement，decision=accepted，snapshot_tree=9137e1f7…）。
- **事故事实（保留不改写）**：第一次 confirm 调用因未显式指定 --project/--task，被运行时按会话上下文解析到任务 `ui-e2e-delivery-contract-20260830`，写入了一条 task_id 错误的确认记录（`quality/confirmations/60cb75e17dc92c13cbf73cd189ac255cb6c0d6b9346a87d21c0d4dbbd32161f0.json`，属该任务目录）。create-only 不可撤回；本日志如实登记，是否清理由该任务 owner 另行决定。
- 会话事件记录（step/skill 级）：全程 unavailable（DSH 宿主），未伪造。
- public run 复核：stage=make-decision 可继续（continuation_allowed=true）；完成谓词中会话事件类事实因 DSH 宿主保持 missing/unavailable，按宪法只影响完成宣称、不阻塞推进；语义完成依据=本日志 + 确认事实 + 聚合。
