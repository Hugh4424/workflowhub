# 决策记录 · workflowhub-make-decision-hardening

## 0. 任务身份

| 项 | 值 |
|---|---|
| 项目 | `workflowhub` |
| 任务 | `workflowhub-make-decision-hardening` |
| 分支 | `task/workflowhub/workflowhub-make-decision-hardening` |
| 基线提交 | `1195bca08be4ef62e204ac764873b9e46a662432` |
| 认证 worktree | `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-make-decision-hardening` |
| 任务存储 | `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-make-decision-hardening` |
| 当前阶段 | `make-decision`（进行中） |
| 创建时间 | 2026-09-08 |

## 1. 原始需求（用户原话，未改写）

> 我刚刚在进行一个 WH｜908｜新增任务规划PRD技能 任务的make-decision时，发现当前的workflowhub的make-decision流程还是有严重问题，需求和方案根本没讨论出什么结论就急着收口make-decision了，还是我自己对当前任务有足够的任务，及时打断了收口流程，重新提出大量遗漏的地方，重新回到make-decision继续收敛需求，才保证了这个任务需求讨论的足够彻底。这非常依赖人工，make-decision的流程自己完全没发现这些问题。我希望你和我开启一个新任务，帮我把我workflowhub的make-decision阶段设计的更完善一些！
>
> 请按标准 WorkflowHub 开始这个任务吧，先创建worktree，然后从 make-decision 开始，不要跳阶段，也不要依赖 build-spec 补需求。先基于原始需求，在make-decision的过程中和我一起仔细梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项。注意主会话上下文控制和子代理派发。Talk 和grill请用大白话说明选项、后果和风险；

## 1.5 需求框架预设（decision-log 契约要求，先于研究/Talk 选定）

- 选定：`functional`（`背景 → 问题 → 目标 → 方案 → 验收 → 扩展`）。
- 理由：本任务是对既有 workflow 阶段的**改进型功能变更**，不是纯研究/证据裁决型任务。
- 允许的混合：若后续出现「哪种机制更有效」的证据型问题，在对应方案节点下挂 `research` 子节点，不新建平行需求列表。
- 节点状态取值：`confirmed | open | deferred | not_applicable`；证据缺失时标 `evidence_status: pending` + `evidence_owner` + `next_review_trigger`。

## 原始需求（逐条处置）

编号用于覆盖矩阵、收敛检查与审查发现引用；处置值取 `covered`/`deferred`/`non_goal`/`rejected`。**不得静默丢弃任何条目。**

| 编号 | 原始需求条目（拆解，不改语义） | 类型 | 维度 message_class | 处置 | 对应决定 |
|---|---|---|---|---|---|
| RQ-01 | 当前 workflowhub 的 make-decision 流程存在严重问题 | 问题陈述 | goal | covered | D-001 |
| RQ-02 | 需求与方案没讨论出结论就急着收口 make-decision | 核心缺陷 | goal | covered | D-001、D-006 |
| RQ-03 | 靠用户人工打断并重新提出大量遗漏，才回到 make-decision 继续收敛 | 人工依赖 | goal | covered | D-004、D-008 |
| RQ-04 | make-decision 流程自身完全没发现这些问题 | 自检缺失 | goal | covered | D-003、D-007 |
| RQ-05 | 目标是让 workflowhub 的 make-decision 阶段设计更完善 | 业务目标 | goal | covered | D-002～D-024 |
| RQ-06 | 按标准 WorkflowHub 流程执行，先创建 worktree | 执行约束 | constraint_non_goal_defer | covered | 已完成（见 §0） |
| RQ-07 | 从 make-decision 开始，不跳阶段 | 执行约束 | constraint_non_goal_defer | covered | 本阶段即 make-decision |
| RQ-08 | 不依赖 build-spec 补需求 | 边界约束 | constraint_non_goal_defer | covered | D-016～D-024 |
| RQ-09 | 基于原始需求，在 make-decision 中一起梳理**完整用户流程** | 必答内容 | flow_or_surface | covered | D-002、D-004 |
| RQ-10 | 梳理**页面范围** | 必答内容 | flow_or_surface | covered | D-002、§7（判定 non_ui） |
| RQ-11 | 梳理**数据状态** | 必答内容 | data_or_state | covered | D-002、D-013 |
| RQ-12 | 梳理**成功/失败边界** | 必答内容 | success_failure_acceptance | covered | D-006、D-008、D-020 |
| RQ-13 | 梳理**非目标** | 必答内容 | constraint_non_goal_defer | covered | D-022、D-027 |
| RQ-14 | 梳理**延期项** | 必答内容 | constraint_non_goal_defer | covered | D-009、D-014、D-026 |
| RQ-15 | 注意主会话上下文控制与子代理派发 | 执行约束 | constraint_non_goal_defer | covered | §9 执行方式 |
| RQ-16 | Talk 与 Grill 用大白话说明选项、后果和风险 | 交互约束 | flow_or_surface | covered | §9、§14 |

## 3. 需求到决策覆盖矩阵（五维）

本表按 SKILL.md 要求覆盖五维。

| 维度 | 覆盖对象 | 处置 | 对应决定 |
|---|---|---|---|
| 业务目标 business goal | RQ-01～RQ-05 | covered | D-001、D-007 |
| 流程与界面 flow/surface | RQ-09、RQ-10 | covered | D-002、D-023、§7（non_ui） |
| 数据与状态 data/state | RQ-11 | covered | D-018、D-019、D-021 |
| 成功/失败/验收 success/failure/acceptance | RQ-12 | covered | D-006、D-020、D-024 |
| 约束/非目标/延期 constraints/non-goals/deferrals | RQ-08、RQ-13、RQ-14 | covered | D-009、D-022、D-026、D-027 |

## 4. 事实与证据（step 1 load-context）

> 每条事实带真实证据引用（`path:line`）。主会话亲自回读的标 `[M]`；受限子代理回传的标 `[S]`。禁止凭记忆断言。

### 4.1 机器收敛检查到底查什么（主会话亲自核实）

| 编号 | 事实 | 证据 |
|---|---|---|
| F-01 | make-decision 阶段完成时调用 `analyzeDecisionConvergence(decisionLog, {originalRequirement, requirementMessages, requirementCoverageOutputs})`，其结果直接决定 `requirement_coverage / goal_achievement / acceptance_clarity / solution_convergence / plain_language_card` 五个谓词 | `runtime/stage/stage-handlers.mjs:3302`、`:3334-3338` |
| F-02 | `scope`、`non_goals`、`risks` 三个谓词只检查 decision-log 里**是否存在对应小节且有内容**（标题正则 + 非空正文），不检查语义 | `runtime/stage/stage-handlers.mjs:3331-3333` |
| F-03 | 「真实用户回答」判定 `recordedUserAnswer()` 只要求文本**含「用户/user」且其余部分是实质文字**，或含 `无新需求`；不比对任何宿主回复凭证 | `runtime/stage/stage-content-contracts.mjs:2672-2679` |
| F-04 | 收敛检查表（`## 收敛检查`）只校验四行维度（goal/scope/solution/acceptance）、列名、以及 solution 行出现「取舍/被拒方案/未决项」、acceptance 行出现「场景/数据来源/通过/失败」等**标签词** | `runtime/stage/stage-content-contracts.mjs:2692-2755` |
| F-05 | 需求覆盖矩阵的判定：存在覆盖小节 + ≥2 行 + 有「状态/处置」列且取值命中 `covered/accepted_omission/deferred/rejected/non_goal/延期/拒绝/覆盖/已接受` 之一 | `runtime/stage/stage-content-contracts.mjs:2792-2841` |
| F-06 | 宿主认证的原始需求消息（`requirementMessages`，带 `id`+`content_hash`）必须被覆盖矩阵文本包含其 `message_class`，并有一行同时含该消息映射出的 requirement_id 与 decision_id | `runtime/stage/stage-content-contracts.mjs:2845-2893` |
| F-07 | 交互聚合校验要求 `talk.status=completed`、`round_count≥1`、`architecture_direction_covered=true`、`user_outcome_covered=true`；**下限是 1 轮**，布尔值由主会话自己写 | `runtime/stage/stage-handlers.mjs:616-619` |
| F-08 | 生命周期校验 `validateInteractionAggregateLifecycle` 校验 ask/wait/reply/resume 事件的**结构**（round、card、reply 绑定），不校验问题深度、不校验是否覆盖五维 | `runtime/stage/stage-handlers.mjs:624-625` |
| F-09 | `check-decision-log-chain.mjs`（decision-log 的「可执行告警规则」）只在 `run-checks.mjs` 聚合里以 **advisory、non-blocking** 运行，不在 make-decision 阶段执行 | `tools/cli/run-checks.mjs:122-126` |

**由 F-01～F-09 得到的机制结论（待用户确认，不作为结论使用）：**

- 现有机器检查是**格式/自述检查**：主会话可以只写漂亮文本、把表格填满标签词，就通过全部 make-decision 谓词。
- 唯一真正外部锚定的是宿主认证的原始需求消息 hash（F-06），但它只校验「分类词出现过 + 某行含 R/D 编号」，不校验该需求**是否被真正讨论、是否真的没有遗漏**。
- 因此「需求和方案没讨论出结论就收口」在机制上**完全不会被发现**，与用户描述一致（RQ-02、RQ-04）。

### 4.2 真实失败案例证据（`workflowhub-build-prd`，子代理只读调查）

> 引用前缀：`L=` 该任务 `specs/workflowhub-build-prd/decision-log.md`；`N/S/Y/H/G/R2/F/A=` 该任务 `quality/evidence/` 下同名文件；`J=` 仓库 `workflows/make-decision/steps.json`。

| 编号 | 事实 | 证据 |
|---|---|---|
| E-01 | 收口时刻（准备进 step 9 草稿 → step 10 细节建议 → step 11 批准）决策只到 D1–D21；用户在打断后追加的 R10–R15 当时**没有任何对应决策** | `L174`、`L163-168` |
| E-02 | 收口时需求框架的「方案」「验收」节点仍是 `open` | `L185-186` |
| E-03 | 主会话先宣布「R2 当前没有尚待用户回答的 high/medium 轴」，用户随后仍在同一 Talk 内注入 R8/R9 | `L281` vs `L256`、`L283` |
| E-04 | 主会话宣布 R3「没有剩余轴、转 Grill」时，核心的步骤/技能/模板尚未研究 | `L300` vs `L339-342` |
| E-05 | 主会话自述「暂停 Grill 收尾和细节建议准备」；状态表自述「当前用户纠正：核心方案缺失」 | `Y:99`、`Y:102` |
| E-06 | 方向审查输入只有 `raw_requirement` + `objective_facts`（`D:27`），不含 decision-log，且早于核心方案；事后按合同**禁止重跑**，缺口永久保留 | `D:27`、`L438-439` |
| E-07 | 主会话称 Grill 无剩余高/中影响轴（`L453`），但 detail 审查仍出两条 `needs_human` 并产生 D52/D53 | `L453` vs `R2:3-10` |
| E-08 | 验收口径（AC-P01–P09、S01–S29）是在 31 项 findings 之后反推补齐的，不是收敛阶段自然产出 | `L45-55`、`L69-99`、`L106` |
| E-09 | 返工规模：决策从 D21 扩到 D53（+32 条）、补 7–8 份核心研究、追加 14 组增量 Talk 与增量 Grill、两场 debate | `L19`、`L306-424`、`L132-145` |
| E-10 | 材料**没有记录**「流程/技能自身没检查到」的结论；所有归因都指向主会话执行（偏外围治理、调度失误） | `N:11`、`H:78`、`N:13` |
| E-11 | 同期仍写下「未发现超出 D1–D49 的新实质决策轴」「未发现需新增产品方向」——与收口时相同的「无剩余轴」自述模式 | `G:52`、`S:71` |
| E-12 | 唯一的阶段级覆盖检查 `stage-end-spec-analyze`（step 12）排在 `approve-decision`（step 11）**之后**，且最终结论是 `material_incomplete` | `J:11-12`、`S:7` |

**结论（待用户确认）：** 收口前**没有任何机制**要求「原始需求逐条处置完毕」「五维覆盖无缺口」；唯一的阶段级覆盖检查发生在用户已经批准之后。用户描述与证据一致。

### 4.3 测试与影响面（子代理只读清点）

| 编号 | 事实 | 证据 |
|---|---|---|
| T-01 | make-decision 实际有 **12 个**完成谓词（任务初始清单漏了 `ui_applicability`） | `runtime/stage/completion-predicates.mjs:73` |
| T-02 | 收敛判定核心 `analyzeDecisionConvergence` 只有 2 个测试直接调用：`tests/contract/decision-convergence-depth.test.mjs`（纯函数语义）、`tests/contract/requirement-convergence-regression.test.mjs`（端到端 + 认证消息绑定） | 子代理清点 |
| T-03 | `non_goals` / `risks` / `plain_language_card` / `stage_end_spec_analyze` 只有「存在性/事实级」断言，**没有语义失败断言** | 子代理清点 |
| T-04 | **没有任何测试断言「某条原始需求未覆盖」或「缺口清单非空」即不得判完成** | 子代理清点（明确结论） |
| T-05 | 谓词集变化会波及硬编码清单：`tests/e2e/vnext-five-stage-current.test.mjs:526`、`tests/integration/vnext-delivery-close.test.mjs:74`；`stage-completion.test.mjs` 会自动纳入新谓词 | 子代理清点 |
| T-06 | 仓库无测试分组清单，只有 `test:safe`（近全量）与 `test:exclusive`（core）；「受影响测试组」只能按文件路径手选。最小组建议 8 个 contract 文件；git fixture 重活单独跑 | 子代理清点 + `package.json` |

### 4.4 运行时完整判定链（受限子代理只读调查，已与 4.1 交叉核对）

| 编号 | 事实 | 证据 |
|---|---|---|
| F-10 | 12 个谓词中，**9 个完全由主会话自己写的 `decision-log.md` 文本解析得出**：`scope`/`non_goals`/`risks`（标题+非空）、`ui_applicability`（自写 JSON 段）、以及 5 个 convergence 谓词 | `runtime/stage/stage-handlers.mjs:3330-3338`、`:540-553`、`:3323-3329` |
| F-11 | 只有 `stage_outcome` 是机器信封（内容寻址 + producer + manifest hash + 每步 proof）；`human_confirmation` 与 `stage_end_spec_analyze` 是**半独立**：runtime 记录/重算，但内容来自 stage agent 自报 | `runtime/stage/stage-runner.mjs:612-706`、`tools/cli/stage-runtime.mjs:749-756`、`runtime/stage/stage-agent-outcome-adapter.mjs:462-474` |
| F-12 | `human_confirmation` 的唯一「人」输入是 `--reply-text` **自由文本**，无真实性校验 | `tools/cli/stage-runtime.mjs:749-755`、`runtime/evidence/canonical-evidence-validators.mjs:380` |
| F-13 | 交互聚合的 `reply_ref`/`reply_hash` 只要求**非空 + hash 形状**，不与任何会话记录对账；而 build-spec 的 clarify 强制 `session_id`/`message_id`/时间戳对账 | `runtime/stage/stage-content-contracts.mjs:2081-2085` vs `runtime/evidence/canonical-receipt-writer.mjs:380-411` |
| F-14 | 聚合只要求 `round_count ≥ 1`，且 Talk 轮次与 14 步 manifest 的 `talk-round-1/2/3` **没有任何绑定**；缺一轮或不连续不算缺口 | `runtime/stage/stage-content-contracts.mjs:2245`、`:2172-2200`、`runtime/stage/stage-handlers.mjs:616` |
| F-15 | 无收敛表时走**回退启发式**：全文任意一处同时出现「R-001」与「D-001」即满足 coverage；用户答案格写「无新需求」即通过 `recordedUserAnswer` | `runtime/stage/stage-content-contracts.mjs:2792-2793`、`:2672-2679`、`:2731-2733` |
| F-16 | `spec-analyze` 的 make-decision profile 也**发现不了「需求没讨论完」**：`original_requirements` 与类标签由 stage agent 自报，消息可标 `not_asked` + 任意 `skip_reason` | `runtime/stage/stage-content-contracts.mjs:2333-2340`、`runtime/evidence/fact-collector.mjs:93-104` |
| F-17 | **没有任何检查**逐条问「原始需求是否被处置」，也没有检查「是否还有未决方向问题」（`open_direction_changing_questions` 只存在于 build-spec clarify 分支） | `runtime/stage/stage-content-contracts.mjs:4765-4781` |
| F-18 | 交互聚合并非硬前提：handler 只在 `receipts.interaction` 存在时读取；未消费只进 advisory | `runtime/stage/stage-handlers.mjs:3294`、`runtime/stage/stage-runner.mjs:2052-2055` |
| F-19 | 唯一较硬的间接约束：一旦写 `## UI applicability` 段，就强制要求四维收敛表，且每维必须有「用户答案」与「材料引用」关键词 | `runtime/stage/stage-content-contracts.mjs:2694-2754` |
| F-20 | 未确认交互聚合的生产调用方（runtime 只导出 `completeMakeDecisionInteractionPublication`，仓内无调用者）——可能在宿主侧 | 子代理标注 `unknown` |
| F-26 | 「认证需求消息」并非本次实时输入：`authenticatedRequirementContext` 来自**已存在的 stage outcome 的 `spec_analyze.packet`**；调用方不提交 `receipts.stage_outcomes` 时 `readOptionalStageOutcome` 直接返回 `value: null`（`:809-812`），首次运行时该上下文为空 → 五类维度检查**空转** | `runtime/stage/stage-runner.mjs:808-812`、`:2711`、`:2800-2828`；`runtime/stage/stage-content-contracts.mjs:5152-5158` |
| F-27 | **直接执行验证（主会话亲自跑，非推断）**：构造一份「占位式」decision-log——四行收敛表里 2 行写「无新需求」、1 行写「用户已确认目标」、方案行写「取舍：快速上线；被拒方案：全量重构；未决项：无未决项」，覆盖矩阵仅 1 行「covered」——`analyzeDecisionConvergence` 返回 **`ok: true`**，六个收敛谓词全部 `passed` | 探针脚本 `quality/evidence/probe-convergence-self-attestation.mjs`，SHA-256 `9a73cde8ffc9d9fc737526faebea710213c79678de5ca072c518fd89465e3333`；被测函数 `runtime/stage/stage-content-contracts.mjs:2776` |
| F-28 | 该检查对列名敏感：收敛表列头必须包含「用户答案 / answer / 无新需求」之一，否则整表判无效；但列**内容**不受真实性约束（F-27 已证） | `runtime/stage/stage-content-contracts.mjs:2703-2710`；F-27 |
| F-29 | **交互聚合在机器上不是完成前提**：全仓只有 `stage-handlers.mjs:3294` 读取 `receipts.interaction`，缺失即 `null`；完成谓词清单里没有它。也就是说「Talk 确实发生过」这份唯一结构记录，机器层面可以完全不提交 | `runtime/stage/stage-handlers.mjs:3294`；`status --action=begin` 谓词清单 |
| F-30 | 决策记录模板 `templates/decision-log-template.md` 有「非目标」（:36）和「风险与延期交接」（:117），但**没有收敛检查表、没有覆盖矩阵、没有 UI applicability** —— 这三项只写在 SKILL.md 文本里，不在模板里 | `skills/decision-log/templates/decision-log-template.md:36,117`（共 151 行） |
| F-31 | **需求框架机制已存在但无任何机器检查**：模板 `:9` 有「需求框架（先选一类，再逐步回填）」小节，decision-log 技能要求每个节点记 `status: confirmed\|open\|deferred\|not_applicable`；全仓没有任何代码校验节点状态。E-02 显示收口时「方案/验收」仍是 `open` 却照样往下走 | `skills/decision-log/templates/decision-log-template.md:9`、`skills/decision-log/SKILL.md:30-38`；grep 全仓无 `requirement_framework` 校验；E-02 |
| F-32 | 审查材料边界的真实配置：`make-decision/direction` 必需 `raw_requirement`/`objective_facts`/`review_instructions`，可选 `current_selection`/`alternatives`/`selection_rationale`/`key_assumptions`/`independent_reconstruction`/`direction_flow`，禁止 `proposed_solution`/`decision_log`/`spec`/`plan`/diff；`make-decision/detail` 必需 `raw_requirement`/`approved_direction`/`draft_spec_or_acceptance`/`review_instructions`，可选 `context_map`/`evidence_map`，无禁止项 | `runtime/review/stage-materials.json:4-13`、`:50-71` |
| F-33 | 存在历史任务 `make-decision-requirement-convergence-20260828`——同一问题的**前一次改造**（很可能就是现有收敛检查与覆盖矩阵的来源）；历史决定与遗留项正在由受限子代理核查，避免重复提案 | `specs/archive/make-decision-requirement-convergence-20260828/decision-log.md` |
| F-34 | **外部检索通道全部不可用（主会话亲自实测）**：`web_search`、`web_fetch`、`anysearch_search` 均返回 HTTP 402（AnySearch 账户配额/鉴权，`auth anonymous`）；`x_search` 返回未登录 Grok。4 个外部调研子代理已停止且**未产出结论** | 本会话工具返回；`request_id` 例：`44144003-0f46-4412-b3e5-2bfdd5ff954e`、`ce2a0a24-3c51-4f67-8c21-80b92fc75f0f` |
| F-35 | 因此外部成熟做法的**一手证据在本轮不可获得**；deep-research 合同要求记录真实事实，不得用默认知识或搜索摘要伪造来源 | `skills/deep-research/SKILL.md:96-101`（跳过/降级/停止） |
| F-36 | **替代通道已实测可用（主会话亲自验证）**：bash `curl` 网络可达——`github.com`/`api.github.com`/`raw.githubusercontent.com`/`arxiv.org`/`martinfowler.com`/`jpattonassociates.com`/`cucumber.io`/`who.int`/`designcouncil.org.uk`/`agilealliance.org`/`nasa.gov`/`standards.ieee.org`/`atlassian.com`/`productplan.com` 均 HTTP 200；`wikipedia.org`/`duckduckgo.com` 超时，`scrum.org`/`iso.org`/`nejm.org` 403。本机有 `python3` + `bs4` 可做正文提取 | 主会话实测；`curl -sSL -m 15 -o /dev/null -w "%{http_code}"` |
| F-37 | `check-decision-log-chain.mjs` 只检查链字段（`module`/`requirement_ids`/`derived_from`/`artifacts`）的文本卫生，**永不作为门**（永远 exit 0），完全不检查收敛 | `tools/cli/check-decision-log-chain.mjs:1-11`、`:14-15` |

**机制根因（子代理与主会话一致）：** make-decision 的完成判定是**自述式格式检查**。主会话只要写出结构完整、关键词齐备的 `decision-log.md`，并附一份自己写的 `--reply-text`，就能通过全部谓词；没有任何环节要求它证明「六类内容真的讨论过、未决项真的清零」。

### 4.5 书面契约的收敛缺口（受限子代理只读调查）

| 编号 | 事实 | 证据 |
|---|---|---|
| F-21 | 整个契约里对「何时可以结束 Talk」只有**一条判据**：本轮自造队列里没有 `high`/`medium` 待答问题；而队列由技能自己生成，明确允许「可以是零、一个或多个」，**不要求来自原始需求逐条分解** → 零问题收敛合法 | `skills/talk-with-zhipeng/SKILL.md:48`、`:52-53`、`:135`、`:140` |
| F-22 | 「完整用户流程、页面/入口范围」只写在 `docs/standard-workflow.md` 的「本阶段必须形成的内容」，**没有进 SKILL.md 的 Procedure**；数据状态仅作为矩阵标签，无状态迁移要求 | `workflows/make-decision/SKILL.md:124-128` vs `docs/standard-workflow.md:139-141` |
| F-23 | 决策记录模板 `templates/decision-log-template.md` **不含**收敛检查表与覆盖矩阵小节（这两节只在 SKILL.md 文本里要求） | 子代理核对模板文件 |
| F-24 | 允许提前收口的条款确实存在：完成事实缺失只「限制完成声明」（`SKILL.md:346`）、发布是「notification, not a gate」（`steps.json:17`）、review 明确「不成为阶段推进 gate」、make-decision 的 `work_status` 恒为 `ready` | `workflows/make-decision/SKILL.md:346`、`steps.json:17`、`skills/wh-review/contracts/make-decision.md:105`、`runtime/stage/completion-predicates.mjs:928-936` |
| F-25 | 契约中**没有**任何防止主会话自我宣布收敛的机制：收敛表与 Grill 摘要均由主会话自填，机器只做正则标签校验 | `runtime/stage/stage-content-contracts.mjs:2692-2749`、`:4785-4797` |

### 4.6 六类必答内容的现状对照（RQ-09～RQ-14）

| 内容类别 | 契约里是否明确要求 | 是否有机器检查 | 缺口 |
|---|---|---|---|
| 完整用户流程 | 仅 `docs/standard-workflow.md` 有，Procedure 无 | 无（仅「范围」小节非空） | 有要求、无强制、无检查 |
| 页面范围 | 同上 | 无 | 同上 |
| 数据状态 | 仅作为矩阵标签出现 | 无 | 有标签、无实质要求 |
| 成功/失败边界 | SKILL.md 收敛表 acceptance 行要求「场景/数据来源/通过/失败」标签 | 正则标签 | 标签可自填 |
| 非目标 | SKILL.md 要求「非目标」小节 | 标题存在性 | 可写空话 |
| 延期项 | SKILL.md 要求「风险与延期交接」小节 | 标题存在性 | 可写空话 |

## 5. 范围三角（step 2 triage-scope）

### 5.1 范围内（in scope，草案）

| 编号 | 范围项 | 说明 |
|---|---|---|
| S-01 | make-decision 阶段的**收敛判定设计** | 什么时候允许结束 Talk / 允许进入确认与发布 |
| S-02 | 防「主会话自我宣布收敛」的机制设计 | 独立判断、可证伪缺口清单、用户逐维确认等候选 |
| S-03 | 契约文本与技能（SKILL.md / steps.json / skill-deps.yaml / 相关技能）的改动设计 | 落点待选 |
| S-04 | 六类必答内容的**强制覆盖设计** | 完整用户流程、页面范围、数据状态、成功/失败边界、非目标、延期项 |
| S-05 | 改进效果的可证伪验收设计 | 如何证明改好了、而不是又写一堆表格 |

### 5.2 明确的不确定性（待 step 3/5/7 与用户收敛）

| 编号 | 不确定点 | 为什么必须问用户 |
|---|---|---|
| U-01 | 根因该定在哪一层：契约文本、技能行为、机器检查、还是用户确认时机 | 决定整个改造方向与工作量 |
| U-02 | 是否允许改动 runtime（新增/修改检查） | 触及宪法 F5/F10/F11「不新增 gate、不堆自动化」边界 |
| U-03 | 收敛判据是「问题池清零」还是「逐维用户确认」还是「独立审查通过」 | 三种判据的严格度与人工成本差异很大 |
| U-04 | 是否把「历史失败案例回放」作为验收方式 | 决定能否证伪 |
| U-05 | 改造范围是否只限 make-decision，还是允许改动被它调用的通用技能（Talk/Grill） | 影响可搬运性与其他阶段 |
| U-06 | 用户对「每次 make-decision 需要多花多少人工」的容忍度 | 直接决定方案可行性 |

### 5.3 非目标（草案，待确认）

| 编号 | 非目标 | 理由 |
|---|---|---|
| NG-01 | 不改其他四个 stage 的既有行为 | 与本任务问题无直接关系，避免扩散 |
| NG-02 | 不为「机器可校验」新建 gate、schema、状态机或第二材料 | 宪法 F5/F10/F11 |
| NG-03 | 不在本阶段实现代码或改 runtime | make-decision 只收敛需求与方向 |
| NG-04 | 不回溯修改 build-prd 任务的历史决策与审查事实 | 历史只读 |

### 5.4 延期项（草案，待确认）

| 编号 | 延期项 | 延期理由 |
|---|---|---|
| DF-01 | 其余 stage 的同类「过早收口」问题 | 先解决 make-decision，其他 stage 另行立项 |
| DF-02 | 跨项目可搬运性验证 | 依赖本阶段方案先定 |

## 6. 未决问题池（防止假收敛）

> 只有池中 `high`/`medium` 项清零，才允许结束 Talk 轮次与收口。

| 编号 | 影响 | 问题 | 状态 | 收敛于 |
|---|---|---|---|---|
| Q-01 | high | 过早收口的根因定在哪一层 | closed | D-001（T1-1） |
| Q-02 | high | 收敛由谁判定 | closed | D-004（T2-1=C） |
| Q-03 | high | 允许改 runtime 吗 | closed | D-007（T3-2=A） |
| Q-04 | medium | 六类必答内容如何强制 | closed | D-002、D-021（G-1） |
| Q-05 | medium | 验收是否用历史案例回放 | closed | D-011、D-024（G-3=A、R4-4=A） |
| Q-06 | medium | 人工成本容忍度 | closed | G-6=B（允许中间多 1–2 次澄清） |
| Q-07 | medium | 通用技能可否改动 | closed | D-023（G-4=A） |
| Q-08 | high | 「大纲」到底是什么、从哪来 | closed | D-002、D-019（G-1、R4-5） |
| Q-09 | high | 方向审查如何核对大纲 | closed | D-005、D-020（T3-1=A） |
| Q-10 | high | 细节审查在草稿后，如何支撑「开始就定大纲」 | closed | D-020、D-025（R4-5） |
| Q-11 | medium | 「具体要收敛的需求」如何判定已收敛 | closed | D-021、D-022 |
| Q-12 | high | 用户收口前确认的具体形态 | closed | D-008（R4-1 澄清：按主题分组确认） |
| Q-13 | medium | 未收敛项逐条还是批量 | closed | D-008（分组确认） |
| Q-14 | medium | 条目字段如何落进模板与检查 | closed | D-022 |
| Q-15 | high | 「命名未知」最低写法 | closed | D-016（R4-2=A） |
| Q-16 | high | 审查意见冲突听谁的 | closed | D-017（R4-3=C） |
| Q-17 | high | 行为层验收判分标准 | closed | D-024（R4-4=A） |
| Q-18 | high | 大纲与需求框架的关系 | closed | D-019（R4-5=A） |
| Q-19 | high | 分档/分组判据 | closed | D-008（R4-1 澄清） |
| Q-20 | high | 大纲生命周期（盲审快照 vs 终态记录） | closed | D-020 |

## UI applicability

```json
{
  "result": "non_ui",
  "sources": {
    "raw_requirement": { "result": "non_ui", "note": "用户原始要求为改进 make-decision 阶段设计，未提出任何页面、交互或前端诉求（no page / no frontend request）" },
    "project_inventory": { "result": "non_ui", "note": "workflowhub 是面向 AI 开发工作流的 CLI 编排工具；本任务涉及 workflow 技能文本、stage 完成谓词、审查材料配置与决策记录模板，均无 route、page、screen、component 或 css（cli-only）" },
    "planned_or_changed_frontend_fact": { "result": "non_ui", "note": "本次选定范围为「只改 make-decision 及其直接依赖」（D-022），不含任何 frontend 改动（no page/screen change）" }
  },
  "source_reasons": "三个来源一致排除 UI：原始需求无 UI 诉求、项目盘点无相关前端面、选定范围无前端改动。按三输入规则得出 non_ui，非调用方标签降级。"
}
```

## 收敛检查

| 维度 | 用户答案 | 事实/材料引用 | 可执行验收 |
|---|---|---|---|
| 目标 | 用户确认：根因是「agent 自己不知道哪里没想清楚」，要在大纲上闭环（T1-1、T1-2、T3-3） | D-001、D-003、H-11 | 场景：用一份历史原始需求生成收敛大纲；数据来源：`workflowhub-build-prd` 的原始需求文本；通过：大纲出现当初遗漏的类别且被标为 open；失败：大纲只复述需求原文、未出现任何未知项 |
| 范围 | 用户确认：只改 make-decision 及其直接依赖（G-4） | D-012、F-32 | 场景：检查改动文件清单；数据来源：git diff 与 move-map 登记；通过：改动只落在 make-decision 的 SKILL/steps、decision-log 技能与模板、审查材料配置、相关 runtime 谓词；失败：出现其他四阶段或 Talk/Grill 技能本体的改动 |
| 方案 | 用户确认：方向审查材料新增 `convergence_outline`、细节审查逐条对账、runtime 加 `outline_closed`（T3-1、T3-2、G-7、G-8）；取舍：可控性优先于改动最小；被拒方案：只改文本、新建独立检查文件、机器全量硬校验、统一批量确认、只修空转 bug；未决项：新字段实测、ADR 编号冲突 | D-002～D-013 | 场景：提交含 `convergence_outline` 的方向审查请求；数据来源：官方 `review --action=record` 返回值；通过：材料被接受且审查者引用大纲条目；失败：返回 `MATERIAL_FORBIDDEN` |
| 验收 | 用户确认：两层验收（G-3） | D-011、EV-01～EV-09 | 场景：机制层占位式决策记录回归 + 行为层历史需求离线回放；数据来源：探针脚本与历史 decision-log；通过：占位式被判不通过，且回放能列出当初遗漏类别；失败：占位式仍通过，或回放列不出缺口 |

## 9. Talk（真实问答）

> 每个 Round 独立执行 `ask → wait → 真实回复 → resume → 重排`。用户回复来自本会话 `ask_user_question` 的真实返回。

### Round 1（step 3）

问题组：1/1，3 个互相独立问题。

| 编号 | 决策轴 | 选项 | 用户真实回复 |
|---|---|---|---|
| T1-1 | 最痛的失败环节 | A 它自己说「讨论完了」实际差很远 / B 问得浅 / C 全是自证 | **A** |
| T1-2 | 什么算改好了 | A 收口前主动列未决清单 / B 独立一方判定 / C 覆盖六类+确认即可 | **自由回答（未选任何选项）**，原话见下 |
| T1-3 | 是否需要调研 | A 要 / B 不要 | **A**（要） |

**T1-2 用户原话（逐字保留）：**

> agent往往自己都没想清楚哪些是没想清楚的地方。这些东西应该再开始i就把大纲列出来，在方向审查和细节审查的时候，应该把大纲和具体要收敛的需求都确定下来，而不是最后靠人来发现

**对 T1-2 的解读（待 Round 2 确认，不自行当作结论）：**

1. 根因不只是「谁判定」，而是 **agent 自己都不知道有哪些没想清楚的地方**（未知的未知）。
2. 修法是**一开始就把大纲列出来**——先有「要收敛什么」的清单，而不是边做边发现。
3. **方向审查与细节审查**这两个既有独立检查点，应当承担「确定大纲 + 确定具体要收敛的需求」的职责。
4. 目标：把「发现问题」从事后人工补救，前移到**开始时的清单**与**审查时的核对**。

**由 T1-2 新增的待收敛项：**

| 编号 | 影响 | 问题 | 状态 |
|---|---|---|---|
| Q-08 | high | 「大纲」到底是什么：收敛清单？需求框架？用户旅程地图？它从哪里来？ | 待 Round 2 |
| Q-09 | high | 方向审查合同**禁止**看到方案与 decision-log（只给原始需求 + 客观事实），如何让它核对大纲？ | 待 Round 2 |
| Q-10 | high | 细节审查在 Grill + 草稿之后才跑，如何做到「开始就把大纲定下来」？ | 待 Round 2 |
| Q-11 | medium | 「具体要收敛的需求」如何判定已收敛（而不是填了字就算） | 待 Round 2 |

### Round 1 重排后的队列

- 已答：T1-1（A）、T1-3（A）。
- 仍开放：Q-08～Q-11（由 T1-2 产生）+ 原池 Q-02/Q-03/Q-04/Q-05/Q-06/Q-07。
- Q-01（根因层）被 T1-2 收窄为「未知的未知 + 缺前置大纲」，保留待确认。
- **本轮不得判定收敛**：仍有 high 项开放。

### Round 2（step 5 · 研究后）

问题组：1/1，4 个互相独立问题。**前置披露**：历史两次同类改造、已否决边界（见 §4.7 H-03）。

| 编号 | 决策轴 | 选项 | 用户真实回复 |
|---|---|---|---|
| T2-1 | 大纲由谁核对 | A 两次独立审查 / B 用户收口前确认 / C 两者都要 | **C（A+B 都要）** |
| T2-2 | 未收敛项怎么处理 | A 必须用户处置 / B agent 记延期 / C 必须清零 | **A（必须由你处置）** |
| T2-3 | 每条「真收敛」的证据 | A 四要素 / B 处置非空 / C 审查者逐条判 | **A（四要素）** |
| T2-4 | 外部调研不可用怎么办 | A 用仓内证据 / B 用户修通道 / C 跳过 | **自由回答（未选）**：「必须进行外部调研，你想想办法吧」 |

**T2-3「四要素」的具体内容（按选项原文）**：来源（哪条原始需求/哪个事实）+ 处置（收敛成决策/延期/非目标/不适用）+ 依据（决策编号或证据引用）+ 可证伪的验收或反例。

**T2-4 处置**：主会话实测发现外部检索 API 全部 402，但 **bash `curl` 网络可达**（github/arxiv/martinfowler/jpattonassociates/cucumber.io/who.int/designcouncil/agilealliance/nasa/standards.ieee.org 等均 200；wikipedia/duckduckgo 超时）。据此以 `curl` 读原文继续外部调研，**不跳过**（用户明确要求）。

### Round 2 重排后的队列

- 已答：T2-1（C）、T2-2（A）、T2-3（A）、T2-4（必须外部调研）。
- 因 T2-1=C：新增「用户收口前确认的具体形态」待收敛（Q-12）。
- 因 T2-2=A：新增「未收敛项的用户处置方式（逐条选/批量确认）」待收敛（Q-13）。
- 因 T2-3=A：新增「四要素如何落进模板与检查」待收敛（Q-14）。
- 仍开放：Q-09（方向审查材料边界）、Q-10（细节审查时机）、Q-11、Q-12～Q-14、Q-03（是否改 runtime）、Q-05（验收方式）、Q-06（人工成本）。

### Round 3（step 7 · 方向审查后）

输入：红蓝方向审查的完整发现清单（22 条，含 4 条 blocking）与主会话核对出的事实错误 1 条。问题组 1/1，5 个互相独立问题。

| 编号 | 决策轴 | 选项 | 用户真实回复 |
|---|---|---|---|
| T3-1 | 大纲怎么让方向审查看到 | A 作为方向审查材料提交 / B 移到细节审查 / C 两边分工 | **A** |
| T3-2 | 收口靠什么拦 | A 改 runtime / B 不改、接受风险 / C 只修首次运行空转 | **A** |
| T3-3 | 大纲要不要允许「未知」条目 | A 允许并强制 / B 维持绑定需求+反向清单 / C 两者都做 | **A** |
| T3-4 | 延期/不适用的合法条件 | A 四件套必须齐 / B 用户确认即可 / C 不允许延期 | **A** |
| T3-5 | 用户逐条处置的凭证 | A 绑真实交互凭证 / B 只认决策记录状态 | **A** |

**T3-1 的用户选择带来的直接后果（必须写进方案）**：大纲必须以「**只含问题与未知、不含拟议答案**」的形式进入方向审查材料包；因此需要实测它不会被判为 `proposed_solution`，且需要明确它与 `current_selection` 等既有可选字段的关系。

**T3-2 的后果**：本任务**包含 runtime 改动**——把「存在未处置 open 项」接到完成谓词并提供失败语义；按 F11 必须登记 owner、真实 consumer、完成 oracle、退出条件。

**T3-3 的后果**：大纲条目允许来源为「命名未知 / 审查新增缺口 / 尚无问题的类别」，状态 `open`。

**T3-4 的后果**：`deferred` 必须带 owner＋触发条件＋范围边界＋影响＋后续验收；`not_applicable` 必须带理由＋反例边界；缺项保持 `open`。

**T3-5 的后果**：用户处置必须绑定机器可核验的真实交互凭证（Talk 轮次 / 交互聚合），不接受自填状态。

### Round 3 重排后的队列

- 已答：T3-1～T3-5 全部为 A。
- 仍开放：G-1 大纲骨架（复用需求框架 / 固定六类 / 双骨架）、G-3 未收敛项处置形态（逐条 / 批量）、G-5 验收方式、G-6 人工成本、非目标与延期边界（进入 Grill）。
- 主会话自行处置（不需用户决定）：T-E 大纲生命周期（初始只填类别+未知+来源+open，终态回填处置/依据/验收）、T-I 审查事实错误（`rejected_invalid`）。

### Round 4（step 10 之后 · 条件轮次，触发条件＝细节审查发现方向级/影响验收的争议）

触发依据：`workflows/make-decision/SKILL.md:194-199`——细节审查后仍有方向级或影响验收的争议时才开第 4 轮。本次细节审查 40 条中有 6 条直指「核心规则被推给 build-spec」，属方向级。

问题组：1/1 + 1 次澄清。

| 编号 | 决策轴 | 选项 | 用户真实回复 |
|---|---|---|---|
| T4-1 | 哪些未收敛项必须逐条 | A 按影响判定 / B 按六类分类 / C 全部逐条 | **自由回答**：「参考talk、grill，一组一组的进行确认」→ 经澄清为 **A′ 按主题分组、一组一组确认** |
| T4-2 | 「命名未知」最低写法 | A 四件事齐 / B 只写未知对象 / C 不设格式 | **A** |
| T4-3 | 审查意见冲突听谁的 | A 列证据交用户裁决 / B 主会话自行裁决 / C 先对抗再裁决 | **C** |
| T4-4 | 行为层验收判分 | A 固定样本+四类阈值 / B 不设阈值 / C 自由判断 | **A** |
| T4-5 | 大纲与需求框架关系 | A 同一份记录 / B 两套并存 / C 只用 OI | **A** |

**澄清记录（Talk 规则：回答有歧义当场追问）**：T4-1 的自由回答含义不明，主会话当场追问「是『未收敛项按主题分组确认』还是『提问方式一组一组』」；用户选择 **A：未收敛项改成按主题分组、一组一组确认**。据此 D-008 替代了 G-2 的「统一批量确认」。

**本轮结论去向**：D-008（分组确认）、D-016（命名未知四件事）、D-017（先对抗再裁决）、D-024（固定样本+阈值）、D-018（同一份记录）。

## 10. 调研重点（step 4 · deep-research R0-R5）

用户选择：**需要调研**（T1-3 = A）。调研问题由需求框架五维生成。

| 编号 | 缺口问题 | 决策轴 |
|---|---|---|
| RQ-A | 有没有成熟机制能在**开始阶段**就把「必须收敛什么」列成清单，并被独立核对？ | 大纲形态与来源 |
| RQ-B | 如何判定一条需求**真的收敛了**（可证伪）？ | 收敛判据 |
| RQ-C | 这类清单如何避免退化成走过场？ | 防自欺机制 |
| RQ-D | AI/规格驱动开发如何处理「未想清楚就收口」？ | 改造落点 |
| RQ-E/F/G | 内部可行性：审查材料边界、细节审查时机、认证需求绑定可用性 | 改造落点 |

### 10.1 调研产物（内容寻址）

| 编号 | 问题 | 报告 ref | SHA-256 | 三角测量 | 复核 |
|---|---|---|---|---|---|
| RPT-01 | 审查材料边界与步骤顺序能否承载大纲核对；首次运行认证绑定是否可用 | `quality/evidence/research/7a476c7bcb9ca94e1468c07416e2f4fd9d070f570f9475fe717b46ab1958cfbd.json` | `7a476c7b…cfbd`（回读一致） | `supported` | R5 pass |
| RPT-02 | 成熟做法如何防止过早收口；可证伪判据；清单如何不退化成走过场 | `quality/evidence/research/17e0fd7173a0abe8f166cf40c677cb1724e9513e7ae1a4d4c8df39b181da056a.json` | `17e0fd71…056a`（回读一致） | `disputed`，2 处冲突 | R5 pass |

**R5 复核（独立上下文）**：两份 hash 均 pass；13 个必填字段齐全；内部定位抽查 1 条一致；外部引文抽查 1 条一致；findings `none`。**限制**：只抽查内部 1/4 source_ref、外部 1/8 条目。

### 10.2 外部证据（全部一手原文）

| 编号 | 证据 | 含义 |
|---|---|---|
| EV-01 | **Definition of Ready**：进迭代前明确并可见故事必须满足的准则（一般基于 INVEST）；收益是「避免做没有明确定义完成标准的功能，从而避免昂贵的来回讨论或返工」，并让团队可「拒绝」定义不清的功能 | 收口条件须是明确可见的准则 |
| EV-02 | **Example Mapping**：开发前先对话确认验收标准；显式捕获「无法在会话中回答的问题或做出的假设」与「被发现或切分并推迟出范围的新故事」 | 缺口清单＋延期项是核心产物 |
| EV-03 | **spec-kit**：模板强制 `[NEEDS CLARIFICATION]`，要求「标记所有歧义」「不要猜」，防止 LLM「做出看似合理但可能错误的假设」 | 直接对应「agent 不知道哪里没想清楚」 |
| EV-04 | **spec-kit**：模板清单被当作规格的「单元测试」；主张「一致性验证持续进行，而不是一次性关卡」 | 清单要能被打假且检查前移 |
| EV-05 | **spec-kit 模板**：每个用户故事/旅程必须「可独立测试」 | 对应可证伪验收 |
| EV-06 | **Double Diamond**：第一颗钻石是「帮助人们理解而不是简单假设问题是什么」 | 先理解再收敛 |
| EV-07/08 | **WHO 手术清单** 19 项；**Haynes 2009** 死亡率 1.5%→0.8%（P=0.003）、并发症 11.0%→7.0%（P<0.001） | 清单有效性的正面证据 |
| EV-09 | **Urbach 2014**（安大略 101 家医院、约 21.5 万台手术、强制采纳）：死亡率 OR 0.91（P=0.13）、并发症 OR 0.97（P=0.29），**无显著下降** | **反证：光有清单没用，效果取决于怎么用** |

**外部证据限制**：ISO/IEC/IEEE 29148 原文、User Story Mapping 原文、Gawande 原文均因站点拦截未取到；`web_search`/`web_fetch`/`anysearch` 全部 HTTP 402；本次改用 bash `curl` + `python3/bs4`，属既有工具路由之外的降级方式，已登记在 RPT-02 的 `tool_usage`。

## 11. 审查事实（step 6 方向审查 / step 10 细节审查）

### 11.1 方向审查执行事实

| 项 | 值 |
|---|---|
| 请求文件 | `quality/evidence/direction-review-request-01.json`，SHA-256 `ed5e934a85e1befe091c89ff201028341e55dc8da81ad1b1924e8a3c50b46e61` |
| 材料 | `raw_requirement`、`objective_facts`、`current_selection`、`alternatives`、`selection_rationale`、`key_assumptions` |
| pair_id | `e00f14a5-08ea-4f0d-b5b2-e31c2f7cc009` |
| 红队 | attempt `quality/reviews/attempts/876d32c7-7d02-5e62-a8c2-37faa859bd55/attempt.json`；result `quality/reviews/results/make-decision-simple-876d32c7-7d02-5e62-a8c2-37faa859bd55.json`（9 条） |
| 蓝队 | attempt `quality/reviews/attempts/8b6928bb-94df-590e-ade1-cfa85d1440ca/attempt.json`；result `quality/reviews/results/make-decision-simple-8b6928bb-94df-590e-ade1-cfa85d1440ca.json`（13 条） |
| 汇总报告 | `quality/reviews/reports/make-decision-simple-4b391454-1ced-5c0c-aeda-4487eb178f24.md` |
| 状态 | 红蓝均 `available`、`coverage=satisfied`、`partial=false`；22 条：blocking 4、major 17、minor 1 |
| 第一次 dispatch | **失败**：`review source changed while dispatching; result was not recorded`（主会话在 dispatch 期间改了 worktree）。失败事实保留在 `quality/evidence/direction-review-dispatch-failure-01.md`；材料未变，重新 dispatch 一次 |

### 11.2 细节审查执行事实

| 项 | 值 |
|---|---|
| 请求文件 | `quality/evidence/detail-review-request-01.json` |
| 材料 | `raw_requirement`（638B）、`approved_direction`（当时 decision-log 全文 46586B，SHA-256 `cb62a6cf…d66`）、`draft_spec_or_acceptance`（1258B） |
| pair_id | `0d6488c3-e0bd-4286-a267-c4637d86204e` |
| 红队 | attempt `quality/reviews/attempts/0a9cab3e-32e8-5f94-acf7-5c9210845a62/attempt.json`；result `quality/reviews/results/make-decision-simple-0a9cab3e-32e8-5f94-acf7-5c9210845a62.json`（**25 条**）；4 provider 全 `completed` |
| 蓝队 | attempt `quality/reviews/attempts/faa93522-c819-5c87-a79c-f49dda912006/attempt.json`；result `quality/reviews/results/make-decision-simple-faa93522-c819-5c87-a79c-f49dda912006.json`（**15 条**）；`grok`/`pi`/`codex` `completed`，**`antigravity/flash` `failed`** |
| 汇总报告 | `quality/reviews/reports/make-decision-simple-ae24542b-ba85-5894-a568-dd0bd6ab92f8.md` |
| 状态 | `available`、**`partial=true`**；40 条：blocking 5、major 27、minor 8 |

### 11.3 审查事实错误核对

`F-34eb57a127b9` 主张「make-decision 编排中不存在细节审查步骤」——**与事实不符**：`workflows/make-decision/steps.json:14` 存在 step 10 `detail-advice`，`skills/wh-review/contracts/make-decision.md:49-91` 有 `make-decision/detail` 轨道。处置 `rejected_invalid`，保留原级别。

## 12. 当前状态

- 阶段：`make-decision` 进行中；**未做整体确认**，未进入 build-spec。
- 已完成：step 1～step 10 全部实际执行；决策草稿已按细节审查 40 条修订（D-001～D-027）；62 条审查发现全部登记处置。
- 进行中：step 11 用户整体确认（含 `CONTEXT.md`/ADR 写入授权）。
- 尚未完成：step 12 阶段末一致性检查、step 13 发布、step 14 复盘。
- 暂停/恢复记录：用户曾要求暂停一次，恢复后继续；暂停点与恢复点见 §15 状态。
## 确认与收尾事实（step 11 起）

### 用户整体确认

| 项 | 值 |
|---|---|
| 确认内容 | D-001～D-028、AC-01～AC-07、范围与非目标整体确认；并授权写入 `CONTEXT.md` 与 ADR |
| 用户回复 | 「A. 整体确认」（`ask_user_question` 真实返回） |
| 确认锚点 | `decision-log.md#用户整体确认`（供 confirmation 的 `subject_ref` 引用，避免自引用循环） |
| 首次确认记录 | `quality/confirmations/89e2d068fd88c43d36ead18c1d8f4501147541759445f39a4ab97bc228d2eb42.json`（快照绑定早于文档写入，已被最终状态下的重新记录取代） |
| 最终确认记录 | 见 `quality/confirmations/` 下最新记录（内容寻址；绑定本记录最终快照） |
| 宿主认证回复引用 | **不可得**：宿主未提供 `reply_ref`/`reply_hash`；已如实保留缺失，未伪造 |

> **顺序事实（如实记录）**：首次确认早于 `CONTEXT.md`/ADR 写入；写入后快照变化使首次确认失效，因此在最终材料状态下重新记录了一次确认。两次记录都对应同一个真实用户回复「A. 整体确认」，内容未变。

### 文档写入（已授权）

| 文件 | 变更 | 状态 |
|---|---|---|
| `CONTEXT.md` | 新增「收敛大纲与收口闭环（2026-09-09，已选设计·尚未实现）」小节：收敛大纲、条目状态、命名未知、questions-only 快照、`outline_closed`、用户分组确认 | 已写入 |
| `docs/adr/0025-convergence-outline-and-close-loop.md` | 新增 ADR，状态 `proposed` | 已写入 |

### 机器侧修复事实（执行中当场发现并修复）

| 编号 | 事实 | 处置 |
|---|---|---|
| X-01 | `## UI applicability` 与 `## 收敛检查` 标题带序号时**不会被解析**（校验用精确标题匹配） | 改为无序号标题；重跑后 `ui_applicability` 由 `missing` 变 `satisfied` |
| X-02 | UI 三来源若为纯中文文本，`sourceConclusion` 判不出 `ui/non_ui`，整体落 `unknown` | 改为带 `result: "non_ui"` 的对象形式；重跑后 `recorded` |
| X-03 | 决策记录的收敛表此前**未被真正解析**（走的是回退启发式） | 修复标题后已实测：破坏列名会让检查失败，证明表被真实解析 |

### 阶段运行结果（官方 `run --action=execute`）

| 谓词 | 状态 |
|---|---|
| scope / non_goals / risks / ui_applicability | satisfied |
| requirement_coverage / goal_achievement / acceptance_clarity / solution_convergence / plain_language_card | satisfied |
| human_confirmation | satisfied |
| **stage_end_spec_analyze** | **missing**（待 step 12 构造并提交 stage outcome） |
| **stage_outcome** | **missing**（同一原因） |


### 机器收尾事实（step 12～14 的真实结果）

| 项 | 结果 |
|---|---|
| stage outcome 发布 | **已发布，状态 `incomplete`**：见任务存储 `quality/evidence/stage-outcomes/make-decision/`（内容寻址；本次为该目录下状态为 `incomplete` 的那一份） |
| 步/技能覆盖 | 14 步中 13 完成、1 未完成（`stage-reflection`）；7 技能中 6 完成、1 未完成（`stage-reflection`） |
| spec-analyze 结果 | `ok=false`、`status=inconsistent`、**错误 2 条**：`authenticated requirement messages are required`、`Grill exit check external_interfaces is not pass` |
| 需求覆盖摘要 | 16/16 条原始需求有语义与证据绑定（`summary.requirement_coverage`） |
| 上游对齐摘要 | 0 条语义偏差、0 条证据问题 |
| 复盘（step 14） | **未发布**：`run --action=reflect` 返回 `reflection stage_status must be completed or failed`；当前 outcome 是 `incomplete` |
| 请求留证 | `quality/evidence/bridge-request-full-02.json`（completed 路径，被拒）、`bridge-request-incomplete-01.json`（incomplete 路径，成功发布） |

**根因（已用实测隔离，不是推断）：**

1. `make-decision` 的 stage-end 严格合同要求 `packet.authenticated_requirement_messages` 非空（`runtime/stage/stage-content-contracts.mjs:2297-2300`）。
2. 该字段只由 `requirementAuthentication` 注入（`runtime/stage/stage-agent-outcome-adapter.mjs:453-455`），而 `requirementAuthentication` 只能由**启动器注册的转录源**产生（`runtime/evidence/codex-transcript-adapter.mjs:32-34` 的 WeakSet 绑定 + `createRegisteredCodexSource`）。
3. 公开 bridge（`tools/host/workflowhub-stage-agent-bridge.mjs:266`）**从不传递**该参数；DSH 宿主侧也没有等价实现（在 DSH checkout 中 grep 无命中）。
4. 因此在本会话中，把状态标为 `completed` 会被 `buildAnalyzer` 拒绝（实测隔离后只剩这一条硬阻断）；只能发布 `incomplete`，而 `incomplete` 又不满足复盘入口的前置。
5. **第二处错误是材料事实，不是宿主缺口**：§14 的 Grill 退出检查第 1 项（外部接口核实）在写记录时就是「部分 pass」；诚实值应为 `unresolved`，因此 packet 如实提交后触发该错误。它可由后续实现与实测消除。

**结论（内容 vs 机器事实必须分开表述）：**

- **内容层面**：D-001～D-028、AC-01～AC-07、62 条审查发现处置、用户整体确认、CONTEXT.md 与 ADR 均已完成。
- **机器层面**：阶段完成事实与复盘**未达成**，原因是宿主缺少「启动器注册的需求转录源」这一能力；不是文档缺失，也不是审查未做。
- **未伪造**：没有构造 requirementAuthentication、没有把 incomplete 写成 completed、没有绕过复盘校验。
## 13. Grill（step 8 · 交互式思考，不产生 review）

### 批次 1（4 个互相独立问题）

| 编号 | 决策轴 | 选项 | 用户真实回复 |
|---|---|---|---|
| G-1 | 大纲骨架 | A 需求框架+六类兜底 / B 只用需求框架 / C 只用六类 | **A** |
| G-2 | 未收敛项怎么问 | A 逐条 / B 批量 / C 逐条且必须清零 | **B（批量确认）** |
| G-3 | 验收方式 | A 两层 / B 只机制层 / C 只契约检查 | **A** |
| G-4 | 本次不做什么 | A 只改 make-decision 及直接依赖 / B 连带 Talk/Grill / C 五阶段一起改 | **A** |

**发现的矛盾（Grill 必须当场指出）**：R2 的 T2-2 与 R3 的 T3-4 都选了「未收敛项必须由你逐条处置」「四件套必须齐」，而 G-2 选了「批量确认」。方向审查已明确警告：批量确认等于变相放行（`F-f1824a0d8f09`、`F-e8a2a51cb0e2`）。这属于自相矛盾，必须澄清后才能继续。

### 批次 2（依赖批次 1，含矛盾澄清）

| 编号 | 决策轴 | 选项 | 用户真实回复 |
|---|---|---|---|
| G-5 | 矛盾澄清：逐条 vs 批量 | A 分档（关键逐条、细节批量）/ B 统一批量 / C 统一逐条 | **A** |
| G-6 | 人工成本 | A 只多一次收口确认 / B 允许中间多 1–2 次澄清 / C 不增加 | **B** |
| G-7 | 命名唯一权威 | A 新增专用字段与命名 / B 复用 current_selection / C 写进 objective_facts | **A** |
| G-8 | 失败语义 | A 不得宣称完成但不阻断修复 / B 直接阻止进入下一阶段 / C 只记警告 | **A** |

**G-5 的后果（替代 G-2 的批量选择）**：未收敛项按影响分档——**影响目标/范围/验收的必须逐条**由用户处置；纯实现细节可批量确认，但每条仍必须带四件套（owner/触发条件/范围边界/影响/后续验收）。分档判据必须写死，避免 agent 把关键项归入「细节」。

**G-7 的命名定案（唯一权威来源）**：

| 名称 | 取值/形式 | 唯一权威来源 |
|---|---|---|
| 方向审查材料字段 | `convergence_outline` | `runtime/review/stage-materials.json` + `skills/wh-review/contracts/make-decision.md` |
| 大纲条目编号 | `OI-001` 起，固定宽度 | `workflows/make-decision/SKILL.md` |
| 条目状态 | `open \| confirmed \| deferred \| not_applicable` | 同上 |
| runtime 完成谓词 | `outline_closed` | `runtime/stage/completion-predicates.mjs` |

**G-8 的失败语义定案**：缺大纲或存在未处置 `open` 项 → **不得宣称 make-decision 完成**（质量状态保持 `incomplete`），但**不阻断同一任务继续修复**，也不改变「四材料可读即可继续」的推进边界。

### Grill 四项退出检查

| 检查项 | 结论 | 依据 |
|---|---|---|
| 1. 外部依赖接口是否已核实真实定义（非文档假设） | **pass**（2026-09-09 复核后由「部分 pass」变更，见下方 X-04） | 本任务**依赖**的外部接口均已用真实定义与真实调用核实：`review --action=record`（成功调用 2 次，含红蓝 pair）、`run --action=execute`、`stage-runtime` 公共入口、bridge CLI（成功发布 6 次）；材料 allowlist 由 `runtime/review/stage-materials.json` 权威配置读取，非文档假设 |
| 2. 涉及字段/路径命名是否已有唯一权威定义 | **pass** | G-7 定案表，四个名称各有唯一权威来源 |
| 3. 失败路径/异常语义是否明确 | **pass** | G-8 定案：不宣称完成但不阻断修复；`outline_closed` 缺项时保持 `incomplete` |
| 4. 范围边界「做什么/不做什么」是否写死 | **pass** | G-4 定案：只改 make-decision 及其直接依赖；其余四阶段、Talk/Grill 技能本体、宪法条款不动 |

**X-04 退出检查第 1 项的复核（如实记录）**：Grill 时该项记为「部分 pass」，理由是新字段 `convergence_outline` 尚未实测。复核后判定该理由**混淆了两类对象**：该检查问的是「本任务**依赖**的外部接口」，而 `convergence_outline` 是本任务**自己的交付物**，其验收由 AC-04 追踪（并已登记为 RISK-01）。本任务真正依赖的外部接口（`review --action=record`、`run --action=execute`、`stage-runtime`、bridge）全部以真实定义 + 真实调用核实，故改为 `pass`。**变更原因、时间与依据一并保留**，不掩盖原判断。

### Grill 结束记录（CONTEXT / ADR）

| 项 | 结论 | 理由 |
|---|---|---|
| `CONTEXT.md` | **changed** | 需新增/更新领域术语：收敛大纲（convergence outline）、未收敛项处置、`outline_closed` 的语义边界 |
| ADR | **created** | 三项判据全为真：① 难以反转——改 runtime 完成谓词与方向审查材料边界；② 无背景会意外——同一问题已修两次，第三次才动 runtime，且把「问题清单」交给盲审方向审查；③ 真实取舍——不改 runtime（自律）vs 改 runtime（可控），批量确认 vs 逐条确认 |

## 14. 决策草稿（step 9 + step 10 修订）

## 核心需求

让 workflowhub 的 `make-decision` 阶段不再「需求和方案没讨论出结论就收口」，并且**不依赖用户人工打断**去发现遗漏。

## 核心目标

把「发现需求缺口」从事后人工补救，前移到**开始就建立的收敛大纲**，由**方向审查、细节审查、用户分组确认**三个真实消费者闭环；机器侧对「大纲是否闭环」产出**可证伪的完成事实**，且所有会改变目标/范围/验收的规则都在本阶段定死，不留给下游。

## 目标、用户流程与边界

### 改造后的完整用户流程（每步标执行者）

| 步 | 执行者 | 动作 | 产出 |
|---|---|---|---|
| 1 | 主会话（M） | 读原始需求；按需求框架＋固定六类建立**收敛大纲骨架**，条目 `OI-xxx`，状态 `open`，只填类别、已知未知、来源 | decision-log 内的 OI 清单（六类与框架节点结构齐备） |
| 2 | M | 冻结一份 **questions-only 快照**（只含类别/未知/来源/`open`；禁止出现 D 编号、处置、拟议答案） | 方向审查材料 `convergence_outline` |
| 3 | M | Talk R1 → 研究 → Talk R2，逐项回答大纲问题；回答即回填终态字段 | OI 条目进入 `confirmed`/`deferred`/`not_applicable` 或保持 `open` |
| 4 | 独立审查（B/S） | **方向审查**用快照核对「有没有整类没问、有没有该问没问的未知」 | 方向审查 findings（advice） |
| 5 | M | Talk R3 处理方向审查争议 | 更新后的 OI 清单 |
| 6 | M | **Grill**（五类覆盖 + 四项退出检查） | Grill 结论、CONTEXT/ADR 判定 |
| 7 | M | 写决策草稿 | 完整 decision-log |
| 8 | 独立审查（B/S） | **细节审查**逐条对账「是否真的收敛」 | 细节审查 findings（advice） |
| 9 | M | 处置 findings；审查意见冲突时先开**有界对抗**再交用户裁决 | 处置记录 |
| 10 | M | 收口前把未收敛项**按主题分组**提交用户确认 | 用户处置凭证 |
| 11 | M | 用户整体确认（本阶段唯一确认点） | 确认事实 |
| 12 | runtime | `outline_closed` 合取判定 | 阶段完成事实（不满足则 `incomplete`） |
| 13 | M | 阶段末一致性检查（spec-analyze）→ 发布 → 复盘 | 阶段收尾事实 |

**失败后如何修（必须写明）**：`outline_closed` 判 missing 时，M 在大纲补条目或补齐终态字段 → 若方向审查用的快照已变，**旧方向审查结果作废**（D-020）→ 重跑受影响审查 → 重新提交用户确认 → 再声明完成。该回路不新增 stage，仍在同一任务内。

### 边界

本次只改 make-decision 及其直接依赖（见 D-023 明确允许清单）；不改其他四个 stage、不改 Talk/Grill 技能本体、不改宪法条款。

## 范围

| 编号 | 范围内 | 依据 |
|---|---|---|
| S-01 | 收敛大纲的形态、生命周期、命名与状态机 | D-002、D-018、D-019、D-021 |
| S-02 | 三个消费者（方向审查 / 细节审查 / 用户分组确认）的职责与材料边界 | D-004、D-005、D-008、D-016、D-017 |
| S-03 | 收口条件与失败语义（合取 oracle） | D-006、D-007、D-020 |
| S-04 | 延期/不适用的关闭条件与大纲变更协议 | D-009、D-014 |
| S-05 | 用户处置的真实凭证绑定 | D-010 |
| S-06 | 两层验收的可执行判据 | D-011、D-024 |
| S-07 | `CONTEXT.md` 术语与 ADR | D-015 |

## 非目标

| 编号 | 非目标 | 理由 |
|---|---|---|
| NG-01 | 不改其他四个 stage 的既有行为 | G-4 定案 |
| NG-02 | 不改 Talk/Grill 技能本体 | G-4 定案；通用技能回归面大 |
| NG-03 | 不新建第五份材料或独立收敛检查文件 | 历史已否决（违反 F11 第五材料边界） |
| NG-04 | 不做**机器语义裁决**（机器不判断「讨论是否充分」） | 历史已否决（违反 F10）。**注意**：D-007 新增的 `outline_closed` 只是**一个完成事实**，不是语义裁决，二者不矛盾（修正审查 `F-24abb75e4a0a` 指出的措辞冲突） |
| NG-05 | 不修改宪法条款、历史 ADR、历史审查事实 | 治理边界 |
| NG-06 | 不在本阶段实现代码 | make-decision 只收敛方向 |
| NG-07 | 不用对抗性 dogfood 作为验收 | 历史用户已否决 |

## 验收标准

| 编号 | 被测对象 | 场景与夹具 | 数据来源 | 通过条件 | 失败条件 |
|---|---|---|---|---|---|
| AC-01 | **`outline_closed`**（明确指名，不再写「新检查」） | 占位式 decision-log（同 `probe-convergence-self-attestation.mjs` 夹具） | 该探针夹具 + `runtime/stage/completion-predicates.mjs` | `outline_closed = missing` | 返回 `passed` |
| AC-02 | `outline_closed` 合取项 | 缺 OI 清单 / 缺 questions-only 快照 / 影响项无凭证 / 有未处置 open / 六类与框架条目结构缺失 | decision-log + 审查材料 + 确认事实 | 任一缺失即 `missing` | 任一缺失仍 `passed` |
| AC-03 | 行为层回放 | **固定样本＝`workflowhub-build-prd` 首条原始需求文本（逐字）**；期望＝大纲至少出现「技能流程/模板结构/审查设计/治理边界」四类中的**三类**，且至少一条合法命名未知 | 该任务原始需求 + 本决策记录 D-016 | 独立一方逐项打勾，**缺两类及以上判失败** | 缺两类及以上，或只复述原文 |
| AC-04 | 方向审查材料 | 提交含 `convergence_outline` 的方向审查请求 | 官方 `review --action=record` | 材料被接受且审查者引用 OI 条目 | 返回 `MATERIAL_FORBIDDEN` |
| AC-05 | 分组确认（含受控反例） | 构造一条引用 goal/AC 编号的 `open` 项并放进批量桶 | 收口确认卡 | 验收判**失败**（说明关键项未被逐条） | 该项未出现在逐条区却判通过 |
| AC-06 | 终态字段 | `confirmed` / `deferred` / `not_applicable` 各缺一个必填字段 | D-021 字段表 | 缺字段即保持 `open` | 缺字段仍算关闭 |
| AC-07 | 改动面 | git diff 对照 D-022 允许清单 | 允许清单 | 改动全部在清单内 | 出现清单外文件 |
| AC-08 | DSH 需求源提取（选项 B） | 固定 JSONL 夹具：含 `kind=="user"` 消息与各类注入消息（subagent-settled / agent-message / goal / plugin / session-reference / agent-instructions / skill-catalog） | 夹具 + `probe-requirement-extraction.mjs` 同形规则 | 只取 `kind=="user"`；`order` 连续；`content_hash` 正确；注入消息被拒 | 采信任何注入消息，或 hash/order 不符 |

## 决定

### D-001 问题定性：不是缺大纲，而是大纲没有闭环
- **决定**：改造对象是「大纲的消费者、关闭规则与判据」，不是再造清单。
- **来源**：T1-1（A）、T1-2 原话；H-05～H-11；F-10/F-15/F-21/F-25/F-27。
- **后果与风险**：改造面比只改文本大；需要动 runtime。
- **被拒方案**：把根因归为「用户没说清楚」。**Supersedes**：none。

### D-002 收敛大纲的形态与生命周期
- **决定**：需求框架节点＋固定六类兜底；条目 `OI-xxx`；初始＝类别＋已知未知＋来源＋`open`；终态字段见 D-022。
- **来源**：G-1（A）、T3-3（A）；`F-67d090b01260`、`F-8f0736d3307d`、`F-1164aba9d024`。
- **后果与风险**：两套骨架需映射（D-019 收拢为同一份记录）。
- **Supersedes**：none。

### D-003 大纲必须容纳「未知」条目
- **决定**：条目来源可以是命名未知、审查新增缺口、或某类别尚无问题；状态 `open`。最低写法见 D-016。
- **来源**：T3-3（A）；`F-eb2a57e15a9b`、`F-7cb09492f1c6`、`F-a8a37bc03271`、`F-0708a953d244`；EV-03。
- **Supersedes**：none。

### D-004 三个消费者与各自职责
- **决定**：方向审查核对**完整性**；细节审查逐条对账**是否真收敛**；用户**按主题分组**处置未收敛项。
- **来源**：T2-1（C）、T1-2 原话、R4-1 澄清。
- **Supersedes**：none。

### D-005 方向审查材料新增 `convergence_outline`（**必需**字段）
- **决定**：`runtime/review/stage-materials.json` 的 `make-decision/direction` 把 `convergence_outline` 加入 **required**（修正审查 `F-9926853a51ab`/`F-443ec071b402`：可选就无法强制核对）；内容为 **questions-only 快照**（见 D-020）。
- **来源**：T3-1（A）、G-7（A）；`F-0f43fe226412`、`F-2a04ce0ce1cc`。
- **后果与风险**：新字段尚未实测（RISK-01）。
- **Supersedes**：none。

### D-006 收口条件与失败语义（修正措辞）
- **决定**：缺大纲或存在未处置 `open` 项 → **不得宣称阶段完成**、**不得发布可被下一阶段消费的完成事实**；「修复」限定为**在同一 make-decision 任务内继续改大纲/补字段/重审**，**不改变**「四材料可读即可继续」的推进边界（修正 `F-02ecaee5b388`）。
- **来源**：G-8（A）；`F-774024870c8c`、`F-c8029958c25e`、`F-36fcaddf0945`、`F-cf246f22fa72`；宪法 F3/Q2。
- **Supersedes**：无（措辞澄清）。

### D-007 runtime 改动：新增 `outline_closed` 完成谓词
- **决定**：在 `runtime/stage/completion-predicates.mjs` 新增 `outline_closed`；按 F11 登记 owner（make-decision）、真实 consumer（阶段完成事实）、完成 oracle（D-021 合取）、退出条件（被经过审查的替代机制取代）。
- **来源**：T3-2（A）；`F-774024870c8c`、`F-cf246f22fa72`、`F-c8029958c25e`、`F-c5ac1cca53c0`、`F-da45332724a2`。
- **Supersedes**：none。

### D-008 未收敛项：按主题分组确认
- **决定**（修正 G-2 的「批量」）：未收敛项**按主题分组**，一组一组提交用户确认；**影响目标/范围/验收的项必须单独成组并逐项列出**；每组必须附「为什么这些项互相独立」与「为什么该组不影响/影响目标范围验收」的依据。
- **来源**：R4-1 澄清（A）；`F-158eb1c8163b`、`F-65d540a625e4`、`F-ce0dba0d0e71`、`F-76ac1f532957`。
- **后果与风险**：分组由主会话做，可能把关键项塞进不显眼的组——由细节审查抽查（AC-05 受控反例）。
- **Supersedes**：G-2 的「统一批量确认」。

### D-009 延期与不适用的合法关闭条件
- **决定**：`deferred` 必须带**延期元数据五件**（owner、触发条件、范围边界、影响、后续验收）；`not_applicable` 必须带**不适用二件**（理由、反例边界）；缺项保持 `open`。
- **来源**：T3-4（A）；`F-4ff4f6ff93c5`、`F-e8a2a51cb0e2`。
- **术语修正**：不再使用「四件套」这一称呼（`F-2f70cec49927`、`F-5470e1ae40b0`、`F-7ac8e531d605`、`F-8ceb06a713cc`、`F-b11e31e9828d`、`F-bfdaf7bfefd6`）。
- **Supersedes**：无（术语统一）。

### D-010 用户处置绑定真实交互凭证
- **决定**：用户处置必须绑定机器可核验的交互事实（Talk 轮次 / 交互聚合），不接受自填状态；凭证缺失 → 按 D-006 不得宣称完成，保持 `incomplete`，不伪造。
- **来源**：T3-5（A）；`F-f1824a0d8f09`。
- **Supersedes**：none。

### D-011 两层验收
- **决定**：机制层＝AC-01/AC-02/AC-06；行为层＝AC-03/AC-05；边界＝AC-04/AC-07。
- **来源**：G-3（A）；H-03、H-09。
- **Supersedes**：none。

### D-012 范围边界
- **决定**：见 D-023 明确允许清单。
- **来源**：G-4（A）。
- **Supersedes**：none。

### D-013 命名唯一权威
- **决定**：`convergence_outline`（材料字段）、`OI-xxx`（条目编号）、`open|confirmed|deferred|not_applicable`（状态）、`outline_closed`（谓词）；权威来源分别为 `runtime/review/stage-materials.json`、`workflows/make-decision/SKILL.md`、`runtime/stage/completion-predicates.mjs`。
- **Supersedes**：none。

### D-014 大纲变更协议
- **决定**：任何新发现必须落成新条目或更新既有条目并记来源；条目或决定变化 → 受影响的**方向审查快照失效**（D-020）、细节审查结论与用户确认作废，直至对最终版本重新完成。
- **来源**：`F-4725798a7dc8`、`F-58ce5281f54b`。
- **Supersedes**：none。

### D-015 文档结果
- `CONTEXT.md`：**changed**；ADR：**created**（三项判据全真，见 §14）。写入需用户授权（尚未取得）。

### D-016 「命名未知」的最低写法
- **决定**：合法未知必须写清四件事——**不知道什么 + 所属类别 + 来源（哪条需求/事实/审查）+ 为什么现在不知道（缺什么证据/要谁回答）**；缺任一项不算合法未知，保持 `open`。
- **来源**：R4-2（A）；`F-3a71859ecb99`、`F-43f9a5351d0c`。
- **Supersedes**：OPEN-02（原「留给 build-spec」）。

### D-017 审查意见冲突：先有界对抗，再交用户裁决
- **决定**：方向/细节审查内部出现矛盾时，先开**一次有界对抗**（角色对同一批矛盾各出陈述 + 一轮交锋），再由主会话逐条列出双方证据与影响，交用户裁决；**不得由主会话自行采纳一方**。
- **来源**：R4-3（C）；`F-58ce5281f54b`、`F-65d540a625e4`。
- **后果与风险**：成本高于直接裁决；沿用 20260828 已确立的「实质争议才 debate」边界。
- **Supersedes**：OPEN-03。

### D-018 需求框架与 OI 的关系
- **决定**：**同一份记录**——需求框架节点就是大纲骨架，OI 条目挂在节点下；节点状态与 OI 状态**同源**，不新增第二套状态机。
- **来源**：R4-5（A）；`F-bfdaf7bfefd6`、`F-3779d854f8c2`、`F-b11e31e9828d`。
- **Supersedes**：OPEN-01。

### D-019 大纲生命周期与盲审快照
- **决定**：
  1. 阶段开始建立骨架（步 1）；
  2. **步 2 冻结 questions-only 快照**——只含类别/未知/来源/`open`，**禁止**出现 D 编号、处置、拟议答案；该快照是方向审查的唯一输入；
  3. Talk/研究回填的终态字段**只进 decision-log**，供细节审查与用户确认消费；
  4. 快照变更 → 旧方向审查结果作废（D-014）。
- **来源**：`F-b6e6e64a039e`、`F-94ccd24f030a`、`F-7ab4d56e4c8d`、`F-443ec071b402`、`F-65993ad3b659`。
- **Supersedes**：无（新增）。

### D-020 `outline_closed` 的合取 oracle
- **决定**：`outline_closed = passed` 当且仅当**全部**成立：
  1. decision-log 存在 OI 清单，且六类与需求框架条目结构齐备（缺项须写「无 + 理由」）；
  2. 方向审查材料包含与当前大纲版本一致的 questions-only 快照；
  3. 无未处置 `open` 项；
  4. 每条终态满足 D-022 的字段表；
  5. 影响目标/范围/验收的条目带可核验的用户处置凭证。
  任一不成立 → `missing`，按 D-006 处理。
- **来源**：`F-c068c8445aec`、`F-b6c8cbe1f143`、`F-68d49d862c2f`、`F-517e12121be6`、`F-405f8cc891a4`。
- **Supersedes**：无（细化 D-007）。

### D-021 终态字段表（唯一权威，替代「四要素/四件套」）
- **决定**：

| 状态 | 必填字段 | 谁可转出 |
|---|---|---|
| `open` | 类别、已知未知、来源 | — |
| `confirmed` | 来源、处置、依据（D 编号或证据引用）、可证伪验收或反例 | 主会话填写 + 细节审查对账 |
| `deferred` | 延期元数据五件：owner、触发条件、范围边界、影响、后续验收 | 主会话填写 + 用户分组确认 |
| `not_applicable` | 不适用二件：理由、反例边界 | 主会话填写 + 细节审查对账 |

- **来源**：`F-3779d854f8c2`、`F-8ceb06a713cc`、`F-b11e31e9828d`、`F-bfdaf7bfefd6`、`F-7ac8e531d605`、`F-5470e1ae40b0`。
- **Supersedes**：D-002/D-009 中零散的字段表述。

### D-022 明确允许清单（替代「直接依赖」）
- **决定**：本次允许改动文件：

| 文件 | 用途 |
|---|---|
| `workflows/make-decision/SKILL.md` | 大纲步骤、消费者职责、收口条件 |
| `workflows/make-decision/steps.json` | 在 research 之前加入「建立骨架」完成项 |
| `skills/decision-log/SKILL.md` 与 `templates/decision-log-template.md` | OI 结构与字段表 |
| `runtime/review/stage-materials.json` | direction 新增必需字段 `convergence_outline` |
| `skills/wh-review/contracts/make-decision.md` | 快照定义与审查职责 |
| `runtime/stage/stage-content-contracts.mjs` | 快照合法性校验（questions-only） |
| `runtime/stage/stage-handlers.mjs` | 消费 `convergence_outline` 与合取判定 |
| `runtime/stage/completion-predicates.mjs` | 新增 `outline_closed` |
| `docs/standard-workflow.md`、`CONTEXT.md`、`docs/adr/0025-*.md` | 规范、术语、ADR |
| 受影响测试 | 谓词与交互合同测试 |
- **来源**：`F-64d789441ef9`、`F-24abb75e4a0a`；T-05（硬编码谓词清单的 e2e/integration 测试）。
- **Supersedes**：D-012 中含糊的「及其直接依赖」。

### D-023 完整用户流程（见 §目标、用户流程与边界）
- **来源**：`F-464b819cb7eb`。
- **Supersedes**：D-002 中「6 步高兴路径」的旧描述。

### D-024 行为层验收判据
- **决定**：AC-03 固定样本与阈值见 §验收标准；判分由独立一方执行；「命名未知」合法性按 D-016。
- **来源**：R4-4（A）；`F-692f7e046459`、`F-1f9d240d00de`、`F-ee273abad705`、`F-3a71859ecb99`。
- **Supersedes**：OPEN-04。

### D-025 决策记录自洽要求
- **决定**：决策记录的覆盖矩阵、问题池、状态小节必须与最终决定同步；**不得出现「已决定」与「待问/待收敛」并存**。
- **来源**：`F-df61c72d11f0`、`F-3fa55b0a6362`。
- **Supersedes**：无。

### D-026 延期项自身必须合规
- **决定**：本记录中的每条 DEFER 必须带延期元数据五件；若确实无法给出，则该条**保持 `open`**，并在用户分组确认中逐条处置。
- **来源**：`F-5aeeb7abcfaf`、`F-b483ece052ca`、`F-3fa55b0a6362`。
- **Supersedes**：无。

### D-027 非目标措辞修正
- **决定**：NG-04 明确「不做机器语义裁决」，与「新增一个完成事实 `outline_closed`」区分开；两者不矛盾。
- **来源**：`F-24abb75e4a0a`。
- **Supersedes**：无。

### D-028 宪法边界（F7 / S4 / F11 的落地约束）
- **决定**：
  1. **F7**：D-008 的「按主题分组确认」**并入 make-decision 既有的 approve-decision 确认**，是该确认点内部的呈现方式；**不新增第五处正常确认点**，不改变三处确认与 UI 限定确认的既有边界。
  2. **S4**：本机制不新建指标系统；`outline_closed` 的结果随既有 stage outcome 与质量事实采集，复用现有执行记录底座。
  3. **F11 边界（防膨胀）**：本次只新增**一个**控制面事实 `outline_closed`；`convergence_outline` 是既有 decision-log 的投影材料，**不落成新文件、不建第二 store、不新增 stage/public command**。若后续阶段提出第二个完成谓词或第二个新字段，必须先回到 make-decision 重新确认。
- **来源**：宪法 F7、S4、F11；`F-24abb75e4a0a`；用户要求「保持简洁、不违宪」。
- **后果与风险**：把「只加一个」写成硬边界后，后续若确实需要第二个，必须回来改决策，成本上升。
- **Supersedes**：无（新增）。


### D-029 选项 B：WorkflowHub 侧补齐 DSH 需求源（新增控制面，待确认后实施）

- **问题与最终选项**：`stage_end_spec_analyze` 因缺认证需求投影无法通过 → 用户选择 **B**（WorkflowHub 侧补齐）。
- **决定**：在 `tools/host/workflowhub-stage-agent-bridge.mjs` 增加显式 opt-in：`session.requirement_source = { kind: "dsh-session", source_ref }`。bridge 内部：
  1. 读取 `DSH_SESSION_JSONL`（zstd 解压）；
  2. 按**机械规则**提取需求消息：`type === "user/message"` 且 `data.source.kind === "user"`（不依赖 agent 挑选）；
  3. 生成 `requirement_message` JSONL（`id`/`order` 连续/`content`/`content_hash`/`task_id`/`session_id`/`stage`）；
  4. 用 `createTranscriptSourceReader` 铸 reader，复用既有 `createRegisteredCodexSource`（传 DSH 的 `source_id`/`source_ref`），产出 `requirementAuthentication`；
  5. 传给 `publishCurrentWorkflowHubSession`。
- **F11 登记（新增控制面必须有）**：
  - **owner**：`make-decision` 阶段；
  - **真实 consumer**：stage outcome 的 `packet.authenticated_requirement_messages`（被 `validateRequirementCoverage` 消费）；
  - **完成 oracle**：AC-08 + `stage_end_spec_analyze` 谓词；
  - **失败语义**：解压失败 / 文件缺失 / 无 `kind==="user"` 消息 → 返回 `unavailable` 且**不伪造**，阶段保持 `incomplete`，不阻断同任务修复；
  - **退出条件**：DSH 宿主侧实现（选项 A）落地后移除本适配。
- **必须写明的属性下降**：冻结列表与内容同源于同一文件、同一进程，**不再是「独立启动器锚」**；防伪依赖「该文件由 DSH 写 + 机械规则」。不得宣称与 Codex 侧语义等价。
- **改动面**：`tools/host/workflowhub-stage-agent-bridge.mjs`（唯一生产文件）+ 1 个契约测试 + 1 个负例；`runtime/evidence/*` 不改。
- **回退**：删除 opt-in 分支与测试；无数据迁移、无 schema 变更。
- **来源**：用户选 B；`diagnosis-requirement-authentication-gap.md`；`minimal-change-plan-requirement-source.md`；探针 `probe-requirement-extraction.mjs`（45 条事件中机械选中 5 条真实用户消息）。
- **Supersedes**：无（新增）。

## 拒绝方案

| 编号 | 被拒方案 | 拒绝理由 |
|---|---|---|
| RJ-01 | 只改技能文本 | 历史判为「纸面合规」 |
| RJ-02 | 新建独立收敛检查文件 | 违反 F11 第五材料边界 |
| RJ-03 | 机器全量硬校验 | 违反 F10 |
| RJ-04 | 结束卡写完整方案 | 违反 direction 盲审合同 |
| RJ-05 | 对抗性 dogfood 作为验收 | 历史用户已否决 |
| RJ-06 | 统一批量确认未收敛项 | 审查证明等于变相放行；改为分组确认 |
| RJ-07 | 只修首次运行空转 bug | 拦不住「agent 自己宣布收敛」 |
| RJ-08 | 只用需求框架 / 只用六类 | 分别有整类遗漏与凑数风险 |
| RJ-09 | 大纲写进 `objective_facts` / `current_selection` | 语义混住 |
| RJ-10 | 直接阻止进入下一阶段 | 违反 F3/Q2 |
| RJ-11 | 只记警告不改成完成状态 | 就是本次问题成因 |
| RJ-12 | 连带改 Talk/Grill 或五阶段一起改 | 范围失控 |
| RJ-13 | 把核心规则留给 build-spec | 违反 RQ-08；审查 `F-1c94e6524312`/`F-731d9b105af5` 点名 |
| RJ-14 | 方向审查收完整大纲（含答案） | 违反盲审合同 |
| RJ-15 | 用「四件套」这类计数称呼字段 | 术语漂移，验收与实现会错位 |

## 审查处置

### 方向审查 22 条（step 6）

| finding | 级别 | 处置 | 依据 |
|---|---|---|---|
| `F-0f43fe226412`、`F-2a04ce0ce1cc` | blocking | fixed | D-005（必需字段） |
| `F-774024870c8c`、`F-c8029958c25e` | blocking | fixed | D-007 + D-006 |
| `F-eb2a57e15a9b` | blocking | fixed | D-003 + D-016 |
| `F-0708a953d244`、`F-a8a37bc03271` | major | fixed | D-002 + D-003 |
| `F-4ff4f6ff93c5`、`F-e8a2a51cb0e2` | major | fixed | D-009 + D-021 |
| `F-7cb09492f1c6` | major | fixed | D-003 + D-004 |
| `F-c5ac1cca53c0`、`F-da45332724a2` | major | fixed | D-007 + D-020 |
| `F-cf246f22fa72` | major | fixed | D-007 |
| `F-de4a96a10f65` | major | fixed | D-002/D-005/D-006/D-007 |
| `F-f1824a0d8f09` | major | fixed | D-010 + D-020 |
| `F-1164aba9d024` | major | fixed | D-002 + D-018 |
| `F-67d090b01260`、`F-8f0736d3307d` | minor/major | fixed | D-002 + D-021 |
| `F-4725798a7dc8` | major | fixed | D-014 |
| `F-58ce5281f54b` | major | fixed | D-017 |
| `F-36fcaddf0945` | major | fixed | D-006 |
| `F-34eb57a127b9` | major | rejected_invalid | `steps.json:14` 存在 `detail-advice`；保留原级别 |

### 细节审查 40 条（step 10）

| finding | 级别 | 处置 | 依据 |
|---|---|---|---|
| `F-1c94e6524312`、`F-731d9b105af5` | blocking | fixed | D-016～D-024 把核心规则收回本阶段 |
| `F-b6e6e64a039e` | blocking | fixed | D-019 盲审快照与终态记录分离 |
| `F-c068c8445aec`、`F-b6c8cbe1f143` | blocking | fixed | D-020 合取 oracle |
| `F-7ab4d56e4c8d` | blocking | fixed | D-005 + D-019 |
| `F-68d49d862c2f` | major | fixed | D-020 + D-021 |
| `F-9926853a51ab`、`F-443ec071b402` | major | fixed | D-005 改为必需字段 |
| `F-65d540a625e4`、`F-ce0dba0d0e71`、`F-43f9a5351d0c`、`F-158eb1c8163b` | major | fixed | D-008 + D-016 + D-017 + D-024 |
| `F-24abb75e4a0a` | major | fixed | D-027 |
| `F-64d789441ef9` | major | fixed | D-022 允许清单 |
| `F-464b819cb7eb` | major | fixed | D-023 完整流程 |
| `F-3779d854f8c2`、`F-b11e31e9828d`、`F-8ceb06a713cc`、`F-bfdaf7bfefd6`、`F-2f70cec49927`、`F-5470e1ae40b0`、`F-7ac8e531d605` | major/minor | fixed | D-021 唯一字段表 |
| `F-3a71859ecb99` | major | fixed | D-024（AC-03 与阈值对齐） |
| `F-5aeeb7abcfaf`、`F-b483ece052ca`、`F-3fa55b0a6362` | major | fixed | D-026 延期项自身合规 |
| `F-02ecaee5b388` | major | fixed | D-006 措辞澄清 |
| `F-692f7e046459`、`F-1f9d240d00de`、`F-ee273abad705` | major | fixed | D-024 固定样本与判分 |
| `F-76ac1f532957`、`F-517e12121be6` | minor | fixed | AC-05 受控反例、AC-02 六类结构 |
| `F-65993ad3b659` | major | fixed | D-019 快照冻结时点 |
| `F-c78365dad52d` | major | fixed | AC-01/02/03/05/06 均配负例 |
| `F-e0880825e83f`、`F-405f8cc891a4` | major | fixed | AC-01 指名被测函数 |
| `F-94ccd24f030a` | major | fixed | D-019 快照只含问题与未知 |
| `F-df61c72d11f0` | major | fixed | D-025 + §3/§6/§12 已同步 |
| `F-78f22fb8b1d1` | minor | fixed | §7 判定 `non_ui`；仓库改动面由 AC-07 管 |

## 风险与延期交接

| 编号 | 类型 | 内容 | owner | 触发条件 | 范围边界 | 影响 | 后续验收 |
|---|---|---|---|---|---|---|---|
| RISK-01 | 风险 | 新字段 `convergence_outline` 尚未实测，可能被 `MATERIAL_FORBIDDEN` | build-code | AC-04 执行时 | 只限方向审查材料配置与合同 | 方向审查仍读不到大纲 | AC-04 |
| RISK-02 | 风险 | 分组由主会话做，可能把关键项塞进不显眼的组 | 细节审查 | 每次收口确认 | 只限未收敛项分组 | 关键项被批量放行 | AC-05 受控反例 |
| RISK-03 | 风险 | 用户处置凭证缺失时无法宣称完成（历史已发生） | 各阶段 | 收口声明时 | 只限完成声明 | 阶段保持 `incomplete` | D-006/D-010 |
| DEFER-01 | 延期 | ADR 编号可能与未合并分支的 ADR 0025 冲突 | build-code/close | 合并时 | 只限 `docs/adr/` 编号 | 合并冲突 | close 前检查 |
| DEFER-02 | 延期 | 首次运行认证上下文空转的修复细节 | build-spec/build-code | 实现 `outline_closed` 时 | 只限 `authenticatedRequirementContext` | 五类维度检查仍空转 | 实现后回归 |
| RISK-04 | 风险 | 方案对「需求覆盖」强、对「方案讨论充分性」只有审查挑战与用户确认，机器不判断讨论是否充分 | make-decision | 每次收口 | 只限「方案是否讨论充分」 | 仍可能收口偏早 | 细节审查 + 用户分组确认 |
| RISK-05 | 风险 | 用户确认仍需人工拍板，未消除人工（只是从「主动发现」变为「被动确认」） | 用户 | 每次收口 | 只限未收敛项确认 | 人工成本未降为零 | 用户分组确认记录 |

> 原 OPEN-01～OPEN-05 已由 D-016～D-024 关闭，不再作为未决项。

## 未决项

| 编号 | 未决项 | 处置 |
|---|---|---|
| OPEN-06 | `CONTEXT.md` 与 ADR 的实际写入 | 需用户授权后执行（文档，不影响本阶段材料） |
| OPEN-07 | 允许清单内各文件的具体改法 | build-spec 实现，**不得**补产品决策 |


## 阶段末遗漏披露（SKILL 要求：逐项列出未完成/失败/跳过/不适用/unknown/unavailable/incomplete）

| 项 | 状态 | 真实原因 | 证据 |
|---|---|---|---|
| step 14 `stage-reflection` | **incomplete** | `run --action=reflect` 要求 `stage_status` 为 `completed` 或 `failed`；本次 stage outcome 为 `incomplete` | `quality/evidence/make-decision-reflection-attempt.md` |
| step 12 `stage-end-spec-analyze` 的完成谓词 | **missing** | spec-analyze 报错 2 条：`authenticated requirement messages are required`（宿主缺口）、`Grill exit check external_interfaces is not pass`（材料事实） | 最终 stage outcome `quality/evidence/stage-outcomes/make-decision/`（状态 `incomplete`） |
| 交互聚合 `quality/evidence/interactions/<sha256>.json` | **unavailable** | 宿主未绑定每轮 `ask→wait→reply→resume` 的认证 `reply_ref`/`reply_hash`；SKILL 明确「不得伪造工具调用、答案或回复凭证」，故不生成 | `workflows/make-decision/SKILL.md:237-298`；本记录 §确认与收尾事实 |
| 宿主认证回复引用 | **unavailable** | `confirm --action=decision` 只接受自由文本 `reply_text`，无 `reply_ref`/`reply_hash` | 同上 |
| 细节审查 provider | **partial** | 蓝队 `antigravity/flash` 返回 `failed`；其余 5 个 provider 正常 | `quality/reviews/attempts/faa93522-c819-5c87-a79c-f49dda912006/attempt.json` |
| 外部一手来源 | **unavailable（3 项）** | ISO/IEC/IEEE 29148 原文、User Story Mapping 原文、Gawande 原文均被站点拦截未取到 | RPT-02 的 `open_items` |
| 方向审查第一次 dispatch | **failed（已重跑一次）** | 主会话在 dispatch 期间修改 worktree，`review source changed while dispatching` | `quality/evidence/direction-review-dispatch-failure-01.md` |
| 本轮实现与验证 | **not_applicable** | make-decision 只收敛方向，不实现代码；AC-01～AC-07 尚未执行 | §非目标 NG-06 |

**无遗漏项**：上述之外没有其他未披露的跳过或失败步骤。

## 阶段末大白话总结

1. **本阶段做了什么**：建任务与 worktree；查清现有完成判定是自述式（实测占位文本可通过）；发现同一问题已修过两次；做了内部＋外部调研（外部检索 API 不可用，改用 `curl` 读一手原文）；Talk 三轮＋条件第 4 轮、一次方向审查（22 条）、一次细节审查（40 条）、两批 Grill。
2. **需求覆盖**：RQ-01～RQ-16 全部 `covered`；五维矩阵已填。
3. **上游一致性**：与宪法 F3/F4/F5/F10/F11、Q1/Q2/Q3 一致；不复用历史已否决路径。
4. **当场修复**：方向审查 1 条事实错误判 `rejected_invalid`；「批量确认」与「逐条处置」的矛盾在 Grill 当场澄清；细节审查指出的「核心规则推给 build-spec」已由 D-016～D-024 收回本阶段。
5. **剩余风险**：RISK-01～RISK-05；DEFER-01～DEFER-02。
6. **下游边界**：build-spec 只实现 D-002～D-024 已定规则，**不得**补产品方向、不得把审查建议当关卡结论、不得把 OPEN-06/07 当作已决。

## 文档结果

- `CONTEXT.md`：**changed**（待授权写入）。
- ADR：**created**（待授权写入）；三项判据全真。
- 四项退出检查：见 §14。

## 状态

- 决策草稿已按细节审查 40 条修订；**尚未获得用户整体确认（step 11）**，未进入 build-spec。
- 62 条审查发现均已登记处置；处置为 `fixed` 的条目**指方案已修订，不代表已实现或已验证**。
