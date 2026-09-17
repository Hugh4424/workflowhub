# 决策记录 · workflowhub-mechanism-waste-reduction-20260915

## 任务身份

| 项 | 值 |
| --- | --- |
| project | workflowhub |
| task_id | `workflowhub-mechanism-waste-reduction-20260915` |
| stage | make-decision |
| worktree | `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-mechanism-waste-reduction-20260915` |
| branch | `task/workflowhub/workflowhub-mechanism-waste-reduction-20260915` |
| baseline_commit | `c5abe9eff99c4432e677d8a30bdfff94d6209690` |
| task_path | `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-waste-reduction-20260915` |
| 材料根 | `<worktree>/specs/workflowhub-mechanism-waste-reduction-20260915/` |
| created_at | 2026-09-15 |
| 跨仓仓库（只读改动面） | `/Users/Hugh/Hugh/Project/3rd-review`（独立 Git 仓库，HEAD `a96f28b7`，remote `Hugh4424/3rd-review`） |
| 前序状态 | t3 已 close（completed）；`main == origin/main == c5abe9ef`；主检出干净；t3 的任务分支与 worktree 已清理 |
| 需求来源（只读参考） | 用户本会话消息；三份分析材料（sha256 见 §1.3） |

- **任务类型**：普通任务

> 用户于第 1 张问答卡（T-001）显式声明为 `普通任务`，未由 Agent 推断。该类型保持既有提问与产物粒度，允许在答案会改变实现时追问实现细节。

### 0.1 需求来源分层

| 层 | 来源 | 是否有用户逐字原话 | 本任务怎么用 |
| --- | --- | --- | --- |
| L1 | 本会话用户消息与 Talk/Grill 真实答复 | **有** | 唯一的需求权威 |
| L2 | 三份分析材料（Agent 产出） | **无** | 候选根因与候选方案池；逐条经 L3 复核，已被否决 5 处 |
| L3 | 本次独立只读核验的仓库事实（V 系列）与独立调研（F 系列） | 无（机器可复算） | 约束与偏差修正 |
| L4 | 既有治理条文与**既往用户已确认决定**（`CONSTITUTION.md`、`AGENTS.md`、vNext 边界、ADR-0017/0028/0029/0030、母决定 P-Q17/P-Q20/P-Q22/P-D-009/P-D-010/P-D-030） | 无 | 硬边界与**必须收口的已确认决定** |

**关键分层结论**：本任务的 A 组主体不是"新方向"，而是**既有已确认决定长期未实现的收口**（P-D-009①、P-D-010、P-D-030① 以及 ADR-0017 已明文规定的语义）。三份材料给出的"新方案"必须逐条对账既有决定，凡冲突者一律不得采纳。

### 0.2 本次核验事实（V 系列，来源：独立子代理只读扫描 main `c5abe9ef`）

| fact_id | 核验事实 | 与 L2 分析的关系 |
| --- | --- | --- |
| V-01 | 仓库已完全没有任何自动 CI 工作流目录 | 与 build-code 分析 §3.1 一致 |
| V-02 | 质量事实认证读取器刻意不接收当前材料/工作树身份，注释写明"后续材料编辑不被当作失效信号" | 方向与 build-code 分析 §4.2 一致，但这是**设计意图**，改它属语义变更 |
| V-03 | 评审复用已绑定材料身份（代码字节变化后拒绝复用） | **修正 L2**：build-code 分析 §3.6 属事实偏差 |
| V-04 | 评审预算是每个材料版本 `initial ≤1 / focused ≤1 / route_repair ≤1 / phase ≤1` | 与 t3 分析 §4.3 一致 |
| V-05 | 评审运行器等待**全部**选中 provider 到终态；"最少异源数达标"只是状态标签，不是提前返回条件；单轮托管等待上限 20 分钟 | 与 t3 分析 §4.3 一致 |
| V-06 | 收口清理只做工作树移除与**本地**分支删除，**不存在**远端任务分支删除 | 与 t3 分析 U8 一致 |
| V-07 | 阶段运行器身份核对存在，但当命令不在认证工作树内执行时**可被显式参数绕过** | 与 build-code 分析 §5.5 一致，且给出可绕过点 |
| V-08 | 来源漂移时已完成 provider 结果被**保留在记录里**，但整轮降级为不可用、不作为语义结论发布 | **修正 L2**：不是"丢弃已完成结果" |
| V-09 | t3 归档计划材料实测 **13,195** 行（不是约 12,581），含约 11,803 行生成式登记表 | **修正 L2 数字** |
| V-10 | 两条端到端套件确实存在（1452 / 2598 行）；仓库文档里的 600 秒是 provider 超时上限，不是命令上限 | **修正 L2**：600 秒命令上限无文档依据 |
| V-11 | 任务类型概念与逐条验收覆盖校验器均已存在并有真实消费者 | 复用既有机制，不得新建 |
| V-12 | 母决定 Q17=A / Q20 / Q22 与 P-D-009① 已**明文要求删除**"材料一改即失效并重跑"的链条（含 currentness 重算与 fact 级 freshness 评估） | **修正 L2 定性**：R-008 不是新改进项，而是**已确认决定的未完成实现**（回归） |
| V-13 | **ADR-0017 已明文规定**：`material_digest`、`snapshot_tree`、`decision_revision` 是 provenance/integrity 字段，"**不再作为 freshness selector 或失效触发器**"，且"材料变化不再触发下游事实失效或自动重跑" | **新增**：当前代码违反已 accepted 的 ADR-0017 |
| V-14 | **P-D-010 已明文要求删除** review 轮次预算机制（`validateReviewBudget` 及其消费点），重试改为"确已变化时显式发起"，不做自动计数；且要求先去重替代物（P-D-009③ 的 `review_result_ref`）先落地 | **新增**：主干上预算机制仍在，P-D-010 未实现 |
| V-15 | **ADR-0028（accepted，2026-09-11）** 把 `validateReviewBudget` 定为正式审查预算的唯一 owner，并要求只能被"保留同等语义的替代机制"替换 | **新增**：与 P-D-010 的"删除"直接冲突，删除须先修订/supersede ADR-0028 |
| V-16 | 逐条验收证据存在至少 4 条竞争写入路径；官方处理器已具备推导能力 | 唯一写入者可复用既有官方处理器（F-004） |

## 原始需求

> 用户原话（逐字，未改写）：我在做"/Users/Hugh/Hugh/Project/workflowhub/specs/workflowhub-mechanism-simplification-20260910"任务的时候，发现这些任务全做完了之后，workflowhub还是有很多阻塞和问题，包括耗时很长、token浪费很多等等，我进行了如下分析：（三份分析材料）请你先仔细阅读和调研这些文件内容，然后我希望现在按标准 WorkflowHub 开始这个改进任务，先创建worktree，然后从 make-decision 开始，不要跳阶段，也不要依赖 build-spec 补需求。先基于原始需求，在make-decision的过程中和我一起仔细梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项。注意主会话上下文控制和子代理派发。Talk 和grill请用大白话说明选项、后果和风险。

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 状态/处置 |
| --- | --- | --- | --- |
| R-001 | 症状：任务全做完后仍有大量阻塞与问题，核心是耗时长、token 浪费多 | L1 用户原话第 1 句 | covered（D-020） |
| R-002 | 先仔细阅读并调研三份分析材料 | L1 用户原话第 2 句 | covered（F-001~F-004） |
| R-003 | 按标准 WorkflowHub 五阶段开始这个改进任务 | L1 用户原话第 3 句 | covered（T-001） |
| R-004 | 先创建 worktree，从 make-decision 开始，不跳阶段 | L1 用户原话第 3 句 | covered（task-bootstrap 已执行） |
| R-005 | 在 make-decision 内梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标、延期项 | L1 用户原话第 3 句 | covered（六类固定类别 OI） |
| R-006 | 注意主会话上下文控制与子代理派发 | L1 用户原话第 4 句 | covered（执行纪律） |
| R-007 | Talk 与 Grill 用大白话说明选项、后果与风险 | L1 用户原话第 5 句 | covered（T-001~T-015、G-001~G-003） |
| R-008 | L2 建议：评审有效性与材料版本强耦合，材料一改即作废重跑 | t3 分析 §4.3 / §5 P0 | covered（D-001、D-003、D-004） |
| R-009 | L2 建议：provider 失败不熔断且等最慢成员，达标不提前收敛 | t3 分析 §4.3 / §5 P0 | covered（D-006~D-010） |
| R-010 | L2 建议：评审额度按材料版本一次性发放 | t3 分析 §4.3 / §5 P1 | covered（D-002） |
| R-011 | L2 建议：来源漂移使已完成 provider 结果无法发布 | t3 分析 §4.3 / §5 P1 | covered（D-005） |
| R-012 | L2 建议：收口不删除远端任务分支 | t3 分析 U8 | covered（D-013） |
| R-013 | L2 建议：评审范围是整分支差异，撞输入预算 | t3 分析 §4.3 / §5 P2 | deferred（R-032 交接） |
| R-014 | L2 建议：清理步骤物理已满足仍只能留失败记录 | t3 分析 U7 | covered（D-014） |
| R-015 | L2 建议：两条端到端套件长期跑不完，状态未知 | t3 分析 U9 | covered（D-017） |
| R-016 | L2 建议：逐条验收验证记录实为占位 | t3 分析 U2 | deferred（R-032 交接） |
| R-017 | L2 建议：阶段行退出码与阶段判定口径不一 | t3 分析 U5 | covered（D-015） |
| R-018 | L2 建议：需第二来源或外部提交的项未列为已知缺口 | t3 分析 U3/U1/U4 | covered（D-016） |
| R-019 | L2 建议：两份语义相同的实现存在漂移风险 | t3 分析 U6 | deferred（R-032 交接） |
| R-020 | L2 根因：修复中快照持续变化，旧证据失效形成重跑循环 | build-code 分析 §5.3 | covered（D-001、D-004） |
| R-021 | L2 根因：宿主独占阶段结论无真实生产者却曾作硬门 | build-code 分析 §4.4 | deferred（R-032 交接） |
| R-022 | L2 根因：主检出与工作树两套真相，未强制工作树身份 | build-code 分析 §5.5 | covered（D-011） |
| R-023 | L2 根因：逐条验收证据无唯一写入者，覆盖与测试快照漂移 | build-code 分析 §4.1 | covered（D-012） |
| R-024 | L2 根因：非行为型小改动执行协议过重 | build-code 分析 §5.1 | deferred（R-032 交接） |
| R-025 | L2 根因：评审是隐式无限重试队列而非有界尝试 | build-code 分析 §5.4 | covered（D-008、D-010） |
| R-026 | L2 根因：计划材料混入巨型生成式登记表，全文检查超时 | build-code 分析 §4.8 | deferred（R-032 交接） |
| R-027 | L2 根因：任务边界失守，小决策演变成一揽子机制重构 | build-code 分析 §4.7 | covered（D-019） |
| R-028 | L2 建议：整改线遗留缺口未关闭，巨人文件未随删除收缩 | 巨人切分提案 §1 | deferred（R-032 交接） |
| R-029 | L2 建议：需给巨人文件主体级减法落点与净减目标 | 巨人切分提案 §4 | deferred（R-032 交接） |
| R-030 | L4 治理硬边界：公共运行时只有既定七类入口，不新增双重控制面 | `AGENTS.md` vNext 边界 | covered（D-019） |
| R-031 | L4 治理硬边界：只跑受影响针对性测试，禁止无范围全量回归 | `AGENTS.md` 测试硬规则 | covered（D-019、D-020） |
| R-032 | 用户新增交付物：把所有延期功能整理成一份 md（背景/问题/证据），存本机下载文件夹，供下一个改进任务使用 | L1 用户原话（T-006 自由文本） | covered（D-018） |
| R-033 | 用户裁决：跨仓改动在本任务内一并完成，但本任务只收口 workflowhub | L1 用户原话（T-009） | covered（D-006） |
| R-034 | K3 复盘：`outline_closed` 在无外部宿主集成的会话中永久 missing，被归因为"宿主缺 bridge" | L1 用户本轮消息 + F-005 | covered（D-022） |
| R-035 | K3 复盘：`human_confirmation` 与 `stage_reflection` 同时报缺口，前者被归因为"无 canonical stage outcome 承载" | L1 用户本轮消息 + F-005 | covered（D-023、D-024） |
| R-036 | 用户要求：WorkflowHub 执行任务时不得再有任何机制性永久阻塞，且缺失不得被误归因 | L1 用户原话「我不希望workflowhub执行任务时还有任何阻塞」 | covered（D-022、D-023、D-024、D-025、D-026） |
| R-037 | K3 执行行出现 `stage-handoff:make-decision` 非零退出与 `unavailable` 失败签名，使执行行显示 incomplete | F-005 / K3 任务库 `facts.jsonl` | covered（D-025） |
| R-038 | 当前任务推进不需要外部 Stage Agent、bridge 或通过 bridge 提交当前 session/outcome；这些不能成为宪法允许的阶段前置 | L1 用户 2026-09-16 明确纠正 | covered（D-026） |

### 1.1 需求框架预设

- **framework**：`functional`（背景 → 问题 → 目标 → 方案 → 验收 → 扩展）。
- **选择理由**：本任务是把一组已观察到的机制性浪费收敛为可实现、可验收的改动，主体是行为/机制收口与取舍；事实研究已由 L3 完成，本阶段在既有节点下回填。
- **回填规则**：Talk、调研、审查、Grill 只更新本份 `decision-log.md` 的同一张 OI 大纲，不新建第二张表或第二状态机。

### 1.2 既往已确认决定（本任务的硬约束，**不得作为可选项重开**）

**命名约定（消除重号歧义）**：本任务自己的决定一律写作 `D-xxx`；**继承自上游任务的既有决定一律写作 `P-xxx`**（P = parent），例如 `P-Q17`、`P-D-009`、`P-D-010`、`P-D-030`。文中凡未加 `P-` 前缀的 `D-xxx` 均指本任务决定，因此本任务的 `D-009`（迟到结果处置）与 `D-010`（完备性披露）不会与继承的 `P-D-009`（失效链删除）或 `P-D-010`（轮次预算删除）混淆。引用既有决定时若未带前缀即为记录缺陷。

| 决定 | 内容（逐字或紧邻原文） | 位置 | 本任务如何收口 |
| --- | --- | --- | --- |
| Q17=A | 「①失效链全删；②只在『写正式记录』窄口保留一次身份核对」 | 母决定 L136 | D-001 |
| Q20 | 「1 次核心审查…没必要改一点点东西就重新审查一次…有做过就可以了」 | 母决定 L756 | D-001、D-003 |
| Q22 | 「绿灯有过一次就可以了…不要改一点就变一下」→ 彻底不判、跑完记一行 | 母决定 L758 | D-001 |
| P-D-009① | 「全删：材料整体哈希、snapshot tree、currentness 重算、fact 级 freshness 评估，以及由它们派生的『改一个字段→既有证据失效→重跑审查/测试』链条」 | 母决定 L1174 | D-001 |
| P-D-010 | 「review 轮次预算保留吗？→ 删除」；「重试改为『人/agent 判断 provider 或材料确已变化时手动发起』，不做自动计数」 | 母决定 L1195-L1197 | D-002 |
| P-D-030① | 主机制 = 3rd-review 侧 manager 心跳过期判死（协议零变更），`PROCESS_STALLED` 接成终态，wh-review 只消费不自造墙钟停滞判定 | 母决定 L1830-L1843 | D-007 |
| ADR-0017 | 「`material_digest`、`snapshot_tree`、`decision_revision` 是 provenance/integrity 字段，不再作为 freshness selector 或失效触发器」；「材料变化不再触发下游事实失效或自动重跑」 | `docs/adr/0017` | D-001（当前代码违反本 ADR） |
| ADR-0028 | `validateReviewBudget` 为正式审查预算唯一 owner，只能被"保留同等语义的替代机制"替换 | `docs/adr/0028` | D-002（删除须先修订/supersede 本 ADR） |

### 1.3 分析材料身份（供独立审查重建来源，回应方向审查的可追溯性发现）

| 材料 | sha256 | 用途 |
| --- | --- | --- |
| `workflowhub-stage-giant-slicing-task-proposal.md` | `b38a0aee8e35fe83617fce3c32d6373d6fe9bf1d7163f2e0cd2c1f99d2b37b67` | R-028 / R-029 来源 |
| `workflowhub-build-code-blocker-analysis-2026-09-15.md` | `47276faff8811650e707a25fe29eb27ce8036b552b6fe8e59ce5e9d979911003` | R-020~R-027 来源 |
| `workflowhub-t3-verify-code-blockers-analysis.md` | `124adcb922d7b39f6c97c311a163eb05881daf844fbf1921c5f51fe47c059bd8` | R-008~R-019 来源 |
## 方向流程（reconstruct → reveal → challenge）

本任务的推进按三个阶段回放，且**当前选择在 reveal 完成前对独立审查保持隐藏**：

| 阶段 | 输入 | 动作 | 可见性 | 状态与失败边界 |
| --- | --- | --- | --- | --- |
| reconstruct | 原始需求（L1）、三份分析材料（L2，sha256 见 §1.3）、仓库与治理事实（L3/L4） | 从需求框架六节点生成缺口问题，逐条用只读核验与独立调研判定 L2 建议是否成立 | 用户可见提问；方向审查只收到 questions-only 投影（ID/类别/问题/来源，状态统一 open，不含答案与处置） | 事实不可得则如实记 unavailable；不得用默认知识补齐 |
| reveal | Talk Round 1–3 与 Grill 的真实答复 | 逐批展示互斥选项、后果与风险，收敛方向、范围、非目标与延期 | 当前选择只对用户可见；审查轨道看不到答案 | 未收到真实答复前不得进入下一阶段；不得由 Agent 代答 |
| challenge | 已 reveal 的方向 + 完整事实 | 两轮独立红/蓝审查 + Grill 压力测试 + 既有决定对账（含 ADR 冲突） | 审查挑战已选择方向的语义与证据，不重开已确认决定 | 审查不可用保持 unavailable；findings 必须逐条处置后本阶段才可完成 |

**提前泄露防护（可证伪）**：方向审查的 packet 只允许 questions-only 投影，因此"选择"在 reveal 完成前不可能出现在审查输入里。失败条件：任何审查 packet 在 reveal 之前包含 answers、selected_disposition、evidence、conclusion 或 proposed_answer。本任务实际的方向审查因此只能评价"问题清单是否可审查"，其 blocking 发现（FND-001）已按该契约处置。

## 核心需求

把 AI 开发工作流里"为了流程和机制本身而消耗掉的时间与 token"降下来：不再因为改了一份计划文本就作废已完成的审查、不再为了等一个慢的外部审查成员而空等、不再让同一个任务出现两套互相矛盾的状态、不再让逐条验收证据由多个写者互相打架。**这是收口你此前已经确认过、但代码一直没有真正执行的机制简化决定**，不是重新设计一套新流程。

## 核心目标

在不新增公共入口、不新增双重控制面、不伪造任何质量结论的前提下，达成三个可验证结果：

1. 仅材料字节发生变化，**不再**让任何已记录的审查事实翻转为过期或不可用，也**不再**触发新的评审派发（该断言即 §收敛检查 的验收判据）。
2. 外部审查不再"等最慢成员"：满足最少异源数即产出结论，并如实标注完备性；迟到结果在有效窗口内作为追加来源合入。
3. 同一任务的写操作只有一个认证身份来源，逐条验收证据只有一个写入者。

## 目标

- 目标：让机制性返工与空等可复算地下降，且**已确认决定得到真实收口**。
- 达成方式：删除而非重设计（删除失效链、删除轮次预算），补做而非绕过（补做外部服务的健康判死原语），强制而非默认（写操作身份强制 + 单写入者）。
- 可观测面：评审派发次数与翻转次数、单轮最大空等时长、失败 provider 吞噬时长、双身份出现次数、验收证据快照一致率。
- 非目标与延期项见 §非目标 与 §未决项；最终以 §决定 的 D 条目为准。

## 成功/失败边界

- 成功边界（T-008）：主判据 = 可证伪断言「仅材料字节发生变化时，不得让任何已记录的审查事实翻转为过期/不可用，也不得触发新的评审派发（在代码快照未变的前提下）」。对照基线 = t3 的真实计数（26 次评审尝试；verify-code 阶段约 12 小时；10 次尝试中 4 次不可用；失败 provider 吞噬约 3,183 秒），**不新跑真实任务**。辅助条件：公共行为契约与七类公共入口不变；宪法条目数与既有守卫不劣化；跨仓改动如实登记验收缺口。
- 失败边界：出现 false-green（把不可用/未知/未覆盖改写成通过）、公共行为契约被破坏、无范围全量回归、把 L2 建议当成用户已确认方向、或又演变成跨机制面的范围蔓延，均为本任务失败。
- 保留边界：真实的 `unknown` / `unavailable` / `incomplete` 必须原样保留，不能被摘要覆盖，也不能被当作质量通过。

## 验收标准

- 主验收（可证伪断言）：仅材料字节变化，不得翻转任何已记录审查事实或触发新派发；代码快照未变时同理。
- 结构验收：公共行为基线与结构/路径守卫不劣化；宪法条目数仍为 22。
- 收口验收：远端分支删除、清理步骤如实重放、阶段行口径分离、已知缺口披露、超长套件执行方式各自有真实证据。
- 交付物验收：R-032 延期交接 md 存在且逐条含背景/问题/证据。
- 缺口验收：跨仓改动与 7 项延期项如实登记为已知缺口，不声称已在本任务验收。

## 证据矩阵（每条决定的 oracle、期望结果与证据不可得处理）

| 决定 | 可执行 oracle（方向级） | 期望结果 | 证据落点 | 证据不可得时 |
| --- | --- | --- | --- | --- |
| D-001 | 材料字节改变而代码快照不变时，重放审查读回路径 | 已记录审查事实状态不变、无新派发 | 定向测试 + 阶段行计数 | failed |
| D-002 | 检查预算消费点是否已删除、去重替代物是否先落地 | 消费点为零且替代物生效 | 代码检索 + 定向测试 | failed |
| D-003 | 用非当前代码快照的 verify-code 审查尝试满足谓词 | 被拒绝 | 定向测试 | failed |
| D-004 | 检查审查事实是否携带来源范围、是否新增 stale 判定 | 有来源范围、无 stale 判定 | 事实字段读回 | failed |
| D-005 | 制造派发期间来源漂移，检查已完成 provider 结果 | 结果保留且可用 | 定向测试 + 事实读回 | failed |
| D-006 | 检查跨仓边界与验收缺口是否登记 | 已登记为已知缺口 | R-032 交付物 + 收口摘要 | failed |
| D-007 | 检查终止/判死原语是否存在并生效 | 停滞可达终态 | 外部仓测试（不计入本任务通过判据） | unknown |
| D-008 | 最少异源数满足时是否即产出结论 | 不再等全终态 | 外部仓测试（同上） | unknown |
| D-009 | 迟到结果窗口内是否追加、超窗是否标注 | 不丢弃、不推翻、有标注 | 外部仓测试（同上） | unknown |
| D-010 | 达标发布是否携带完备性披露 | 披露字段齐全 | 外部仓测试（同上） | unknown |
| D-011 | 从非认证工作树执行写命令 | fail-loud；只读命令与首次 make-decision 放行 | 定向测试 | failed |
| D-012 | 零证据、零 findings、已验证为空三种情形是否可区分 | 三者可区分且不冒充覆盖 | 定向测试 | failed |
| D-013 至 D-017 | 各自收口场景的命令与退出码 | 与期望一致 | 收口步骤记录与物理读回 | failed |
| D-018 | 检查交付物是否逐条含背景/问题/证据 | 7 条各出现一次且三项齐全 | 仓外文件 + 收口摘要 | failed |
| D-019 | 检查每条改动是否有决定编号 | 无无编号改动、无延期回流 | 计划与 diff 对账 | failed |
| D-020 | 材料字节变化时重放主判据 | 无翻转、无新派发 | 定向测试 + t3 对照计数 | failed |
| D-021 | 重算 UI 适用性三来源 | 仍为 non_ui 且无冲突 | 决策记录读回 | failed |
| D-022 | 用公开 `run --action=execute` 的聚合发布字段产出一份聚合，并检查 quality 事实 | 聚合被内容寻址写入且 `talk_clarify` 事实存在 | 定向测试 + 事实读回 | failed |
| D-023 | 分别制造"未提供 / 未通过 / 宿主给不了"三种缺失 | 三者诊断可区分，仅第三类为 unavailable | 定向测试 | failed |
| D-024 | 在纯本地会话走完阶段 outcome 与复盘 | 复盘不再只得到 executor_absent，且仍不作门禁 | 定向测试 + 阶段行读回 | failed |
| D-025 | 检查 make-decision 执行行的 handoff 行 | 无不适用情形下的非零退出或失败签名 | 阶段行读回 | failed |
| D-020（补充） | 用 t3 现有计数做 before/after 对比：评审派发次数、因材料改动触发的额外派发次数、单轮最大空等时长、失败 provider 吞噬时长 | 主指标不劣化，且机制行为断言成立 | t3 任务库真实计数 + 定向测试 | failed |
| D-003 / D-004（对称） | 四个方向都要成立：verify-code 绑当前快照被接受；build-code 集成审查不绑快照被接受；来源快照必须展示；消费方不得宣称覆盖当前代码 | 四个方向全部成立 | 定向测试 | failed |
| D-018（补充） | 交付物必须位于本机下载文件夹、为独立 md、可支撑下一轮立项、且在收口摘要登记 | 四项齐备 | 仓外路径 + 收口摘要读回 | failed |
| D-022 至 D-025（状态契约） | 端到端状态可追踪：已校验的 `interaction_aggregate` → 恰好一次发布 → `talk_clarify` → `outline_closed` 消费 → 阶段行 | 每一跳有唯一消费者且状态可读 | 定向测试 + 阶段行读回 | failed |
| D-006 至 D-010（跨仓拆分） | 逐仓库列出 owner 与交付物；跨仓项显式标记为延期/仅登记，且不作完成声明 | 不出现"既在范围、又不验收" | R-032 交付物 + 收口摘要 | failed |

**共同规则**：workflowhub 侧的 oracle 证据不可得时一律记 `failed`；跨仓侧记 `unknown`（未在本任务验收）。两者都**不得**记为通过。对照基线引用 t3 任务库的真实计数（26 次评审尝试、verify-code 阶段约 12 小时、10 次尝试中 4 次不可用、失败 provider 约 3,183 秒），**不新跑真实任务**。

## 范围

（已由 Talk Round 1 定为「B = A + 记录层与收口小修」，Round 2 定稿，Grill 校正后如下。）

- **A 组（最高杠杆根因，在范围）**
  1. **删除评审"当前性"失效链**（R-008 / D-001）：阶段与 phase 审查不再以材料版本、也不以代码快照作有效性比较；`material_digest`/`snapshot_tree`/`decision_revision` 只作 provenance。性质 = 收口 P-Q17=A / P-Q20 / P-Q22 / P-D-009① 与 ADR-0017。
  2. **删除评审轮次预算机制**（R-010 / D-002）：按 P-D-010 删除 `validateReviewBudget` 及其消费点；重试改为"确已变化时显式发起"；去重替代物 = P-D-009③ 的 `review_result_ref`，且必须先落地。须同步修订/supersede ADR-0028 的预算条款。
  3. **唯一保留的代码身份门槛**（D-003）：**verify-code 的终局代码审查必须绑当前代码快照**；build-code 的最终集成审查按阶段产物处理，不绑快照。
  4. **审查事实按来源范围记录并显示所审快照**（D-004）：消费面一律不得声称覆盖当前代码；**不**引入 stale 判定。
  5. **来源漂移时保留并使用已完成的 provider 结果**（R-011 / D-005）。
  6. **跨仓收口外部审查空等**（R-009 / R-033 / D-006~D-010）：先做终止/判死原语（心跳过期判死 + 停滞接终态 + 接通取消），再做"达标即产出"契约与迟到结果处置；本任务只收口 workflowhub。
  7. **写操作强制认证工作树身份**（R-022 / D-011）：只对写命令强制；窄逃生口仅限只读命令与"工作树尚未建立"的首次 make-decision；两个真实 harness 迁入工作树执行。
  8. **逐条验收证据唯一写入者**（R-023 / D-012）：复用 build-code 官方处理器作唯一推导者；同批退休竞争输入；不得双写。
  9. **交互聚合的官方发布入口**（R-034 / D-022）：在 `run --action=execute` 增加与 `research_report` 对称的 `interaction_aggregate` 发布字段，复用既有 kernel writer，调用方不再手写聚合。
  10. **缺失输入的根因诊断**（R-035 / D-023）：区分"未提供 / 未通过 / 宿主给不了"，只有第三类可记 `unavailable`。
  11. **当前会话直接执行阶段**（R-038 / D-026）：去掉 bridge/session/outcome 的 active 前置；复盘直接绑定当前 task identity，旧 outcome 仅历史兼容。
  12. **阶段末 handoff 的不适用收口**（R-037 / D-025）：目标材料在该阶段尚不存在时以显式不适用收口，不得留非零失败签名。
- **B 组（记录层与收口小修，在范围）**：远端任务分支删除（D-013）；清理步骤如实重放（D-014）；阶段行区分命令退出码与阶段判定（D-015）；收口摘要显式列出外部来源缺口（D-016）；超长端到端套件执行方式（D-017）。
- **本任务交付物**（R-032 / D-018）：一份独立 md 文件，逐条记录全部延期功能（背景/问题/证据），存本机下载文件夹。
- 用户流程/结果只记索引和验收影响，细节进入 spec。
- 硬边界：不新增公共流程节点，不新增双重控制面，不新增持久对象除非同时写明唯一消费者、owner、替代关系与删除条件（R-030）。跨仓改动不进入本任务的任务追踪与收口（R-033）。

## 跨仓依赖与验收边界

本任务把跨仓工作拆成"实施面"与"收口面"，避免"既在范围内、又不参与验收"的自相矛盾：

| 项 | 归属 | 进入本任务通过判据 | 验收与证据落点 |
| --- | --- | --- | --- |
| workflowhub 侧全部 A/B 组改动 | 本任务 | **是** | 本任务质量事实、定向测试与收口读回 |
| 外部审查服务仓的终止原语与达标即产出改动 | 本任务**实施**、外部仓**收口** | **否** | R-032 交付物中的"跨仓依赖"条目（背景/问题/证据/期望验收/owner）；该仓的提交、推送与验收另需用户显式授权 |
| R-032 延期交接 md | 本任务 | **是**（存在性与完整性） | 仓外文件路径 + 收口摘要登记 |

**因此**：本任务的 `passed` 只覆盖 workflowhub 侧改动；跨仓改动以其真实状态（已实施 / 未验收）如实披露，**不得**计入本任务的通过判据，也**不得**因其未验收而把本任务判失败。**D-006 失败条件**：跨仓边界或验收缺口未如实登记为已知缺口。

## 无阻塞自足性要求（本次新增，回应 K3 复盘）

| 观测到的阻塞 | 真实根因（本任务第一手核验） | 处置 |
| --- | --- | --- |
| `outline_closed` 永久 missing | 交互聚合**没有生产发布入口**：`completeMakeDecisionInteractionPublication` 全仓只有测试调用；`run --action=execute` 对 make-decision 只挂 `research_report` 一个发布字段 | D-022 |
| `human_confirmation` missing | **不是**宿主问题：公开 `confirm --action=decision` 会同时写确认记录与质量事实。K3 中确认记录存在而对应事实缺失，说明该记录不是在公开路径上产生的，或 execute 未带该 receipt | D-023 |
| `stage_reflection` 只能 unavailable | 旧实现把当前会话误建模成需要 bridge/outcome 的 producer，导致无 outcome 时落 `unavailable(executor_absent)`；当前会话应直接按 task/worktree/snapshot/material 发布 reflection，真正不可用才保留 `executor_absent`，且它**本就只是披露**、不是门禁 | D-024、D-026 |
| 执行行出现 handoff 失败签名 | 阶段末 handoff 读取该阶段尚不存在的目标材料（make-decision 阶段的 `plan.md`），外层命令以退出码 1 收场 | D-025 |
| 成功 handler 在无外部 outcome 时仍出现 stage-end 失败 | `runOfficialStage` 把“没有 host outcome”误判为 `stageStatus=failed`，随后恢复文案又要求补真实外部 Stage Agent/bridge outcome；这是 producer 归因错误，不是当前任务缺少执行者 | D-026 |
| 上述被混为一谈 | 缺失输入被静默丢弃，没有"未提供 / 未通过 / 宿主给不了"的可区分诊断 | D-023 |

**"零阻塞"的可证伪含义（本任务按此验收）**：在**纯本地、无外部宿主集成**的会话里，每个阶段结束时，完成谓词要么**可满足**，要么给出**可区分的真实原因**；不允许"无根因的永久缺失"，也不允许把缺失写成通过。

**必须保留的边界**：不得为了让谓词变绿而伪造执行事实、时间戳或 output hash；`stage_reflection` 不得升级为门禁（ADR-0026）；确实只能披露的项（例如没有可用的第二独立来源）必须如实披露为 `unavailable` —— 这不算"阻塞未解决"。

## 非目标

（已定稿，见 OI-26。）

- 不整体重写任何既有文件；不做与本任务选定方向无关的存量缺陷修复。
- 不改动 `specs/archive/**` 与历史事实；**不回溯重判**任何已归档任务的既有事实（T-003）。
- 不靠无范围全量回归、不靠 timeout 作为质量结论。
- 不把三份分析材料中的建议直接当作已确认需求；已被事实否决的条目不得照搬。
- **不在本任务内做**（全部登记为延期项并写入 R-032 交付物）：巨人文件主体级收窄（R-028/R-029）；非行为型小改动的轻量协议路径（R-024）；计划材料瘦身与生成式登记表拆分（R-026）；两份同语义实现同步加固（R-019）；逐条验收验证记录落地或显式废弃（R-016）；评审范围按 phase/文件集切分（R-013）；宿主披露优化（R-021）。
- 不新增第六个 stage、不新增公共运行时入口；跨仓改动不纳入本任务收口（R-033）。

## 决定

### D-001

- question/final_option: 评审的"当前性"失效链保留吗？→ **按既有决定全删**（不是重新设计解耦方案）
- recommendation/plain_language: 「改一份计划就作废已完成的审查」这条链，你自己早前已经决定全删。现在要做的只是把代码里残留的那几处比较真正删掉。
- decision: 删除阶段与 phase 审查中一切以**材料版本**为输入的有效性比较（复用判定、额度作用域、closure 判定、freshness 读数、阶段/分析器绑定的 currentness 分支）。`material_digest`、`snapshot_tree`、`decision_revision` 字段**保留**为 provenance/integrity 字段，但不得再作为失效触发器或选择器。
- source_type/reference/exact_excerpt: 用户 Q17=A「①失效链全删；②只在「写正式记录」窄口保留一次身份核对」（母决定 L136）；Q22「绿灯有过一次就可以了…不要改一点就变一下」（L758）；P-D-009①「全删：材料整体哈希、snapshot tree、currentness 重算、fact 级 freshness 评估，以及由它们派生的『改一个字段 → 既有证据失效 → 重跑审查/测试』链条」（L1174）；ADR-0017「不再作为 freshness selector 或失效触发器」。
- approval_binding: 用户 Talk T-005 确认「严格照 P-D-009 字面」。
- facts_and_constraints: 现状约 8 处把"审查是否仍有效"绑到材料版本（F-002）；当前代码违反已 accepted 的 ADR-0017（V-13）；真正的返工引擎是"额度按材料版本发放"（F-002）。
- Logic: 失效链无宪法依据且是最大重复劳动源（前车之鉴：一次材料修改丢掉约 40 分钟已完成 provider 结果）→ 既有决定要求全删 → 字段保留为 provenance 不违反 provenance 要求 → 删除比较即可，不需要新机制。
- choice_reason/impact: 这是"自激反馈环"的唯一根治法；且属收口而非新设计。
- consequences_and_risks: 见 RISK-007（旧审查被读作当前阶段审查）。
- rejected_alternatives: 重新设计"材料谱系内放宽"（等于重开已确认决定）；保留材料版本比较只放宽 snapshot（与 P-D-009① 字面冲突）。
- unresolved_items/owner: 无（保留字段清单由 spec 冻结）。
- Supersedes: 取代任何仍以 material_revision 作 currentness 的实现路径；ADR-0017 无需修订（代码须回到 ADR）。
module: review-validity
requirement_ids: [R-008]
derived_from: []
artifacts: [spec.md#FR-REVIEW-VALIDITY]

### D-002

- question/final_option: 评审轮次预算保留吗？→ **按 P-D-010 删除**（不是改发放单位）
- recommendation/plain_language: 这套"同一份材料只允许发几轮、超了就报耗尽"的预算机制，你自己已经决定删掉。它本身还实测出过错——把没发出去的调用也算成了消耗。
- decision: 删除 `validateReviewBudget` 及其全部消费点；重试改为"人/agent 判断 provider 或材料确已变化时显式发起"，不做自动计数。去重替代物 = D-005 已强制的 `review_result_ref`（同一 track 已有 conducted 结果则不再派发），且**必须先落地替代物再删预算**（P-D-009③ 顺序约束）。同步修订 ADR-0028 的预算条款。
- source_type/reference/exact_excerpt: P-D-010「review 轮次预算保留吗？→ 删除」；「删除 review 轮次预算机制（`validateReviewBudget` 及其消费点）；重试改为『人/agent 判断 provider 或材料确已变化时手动发起』，不做自动计数」；「先落地 P-D-009③ 的 `review_result_ref` 去重替代物，再删预算」。
- approval_binding: 用户 Grill G-001 选择「按 P-D-010 删除额度机制」。
- facts_and_constraints: 预算仍在主干运行（V-04），P-D-010 未实现；至少两个消费点（`review-record-route` 与 `stage-handlers`）；ADR-0028 把预算定为唯一 owner 并要求"等价替代机制"才可替换（V-15）——与 P-D-010 冲突。
- Logic: 预算是三大真硬阻断之一且实测出过错 → 既有决定要求删除 → ADR-0028 的替代条件要求"经审查的替代"，去重替代物 `review_result_ref` 即该替代 → 删预算 + 修订 ADR 同时成立。
- choice_reason/impact: 拆除返工引擎的另一半；避免"靠造新 revision 换额度"的绕行。
- consequences_and_risks: 失去自动限流，重复派发完全依赖去重替代物；若替代物未先落地，会出现重复调用。
- rejected_alternatives: 保留额度改按"真实修复"发放（与 P-D-010 明文冲突，且等于重开已确认决定）；现状不动（三大硬阻断之一继续存在）。
- acceptance: 删除后必须同时存在两项可读证据——①预算消费点为零（代码检索）；②`review_result_ref` 去重替代物已生效（定向测试）；③**ADR-0028 的"正式审查预算与导入"条款已同批修订**，文档 diff 可读回。缺任一即判 failed。
- unresolved_items/owner: `review_result_ref` 替代物的落地顺序由 plan 冻结；owner = plan。
- Supersedes: ADR-0028 的"正式审查预算"条款。
module: review-validity
requirement_ids: [R-010, R-025]
derived_from: [D-001]
artifacts: [spec.md#FR-REVIEW-BUDGET, docs/adr/0028-plan-slicing-and-review-budget.md]

### D-003

- question/final_option: 既然代码快照也不作有效性比较，最后一道代码审查要不要例外？→ **只有 verify-code 例外**
- recommendation/plain_language: 阶段审查不再比代码快照；但最后那道 verify-code 审查是终局声明，它后面没有别的兜底，所以它必须确认审的是当前代码。
- decision: **verify-code 的终局代码审查必须绑定当前代码快照**。build-code 的**最终集成审查不绑代码快照**，按阶段产物审查处理（其快照仅作 provenance 记录）。除此以外不存在其他代码身份门槛。
- source_type/reference/exact_excerpt: 用户 T-011「verify-code 例外，必须绑当前快照」；用户 G-002「只有 verify-code 例外」。
- approval_binding: T-011 + G-002 两次真实答复一致。
- facts_and_constraints: verify-code 之后没有下游兜底（宪法禁止把未覆盖说成通过）；build-code 集成审查的对象是阶段产物与实现，其证据价值由 verify-code 补充。
- Logic: 阶段审查有 verify-code 兜底 → 可以不比快照；verify-code 无兜底 → 必须比快照 → 唯一门槛落在终局。
- choice_reason/impact: 在"消除返工"与"终局不假绿"之间取到唯一可行切分。
- consequences_and_risks: 集成审查可能对应非最终代码，因此其声明必须按来源范围表述（D-004），不得声称覆盖最终实现。
- rejected_alternatives: 集成审查也比快照（会把它变成失效链的一部分）；两个都不比（终局假绿，宪法禁止）。
- unresolved_items/owner: 无。
- Supersedes: 无。
module: review-validity
requirement_ids: [R-008]
derived_from: [D-001]
- record_contract: verify-code 审查事实必须同时携带 task_id、stage、review_track、subject_kind（代码）、snapshot_tree（当前代码快照）与 result_ref；读回时必须比对 snapshot_tree 与当前快照，不相等即不得作为终局通过依据。build-code 集成审查事实携带同一组字段，但 snapshot_tree 只作来源、不参与通过判定。
artifacts: [spec.md#FR-VERIFY-CODE-SNAPSHOT-GUARD]

### D-004

- question/final_option: 阶段/phase 审查事实在状态里如何呈现？→ 按来源范围记录并显示所审快照，不引入 stale 判定
- recommendation/plain_language: 审查记录里写明"它审的是哪一版代码"，但不再因为版本不同就把它判死。最终"代码审查通过"由 verify-code 那次提供。
- decision: 审查事实必须携带并显示其**来源范围**（所审代码快照与材料身份），消费面不得将其表述为"覆盖当前代码"；**不新增 stale/expired 状态或提示**。
- source_type/reference/exact_excerpt: 用户 T-015「按来源范围记录并显示快照」；P-D-009①「全删…失效链」；ADR-0017「不再作为 freshness selector 或失效触发器」。
- approval_binding: 用户 Talk T-015。
- facts_and_constraints: 若完全不显示快照，读者会误判覆盖范围（RISK-007）；若显示"过期提示"，等于把失效链换个名字装回来（与 P-D-009 冲突）。
- Logic: provenance 必须可读 → 显示快照；失效链必须删除 → 不设 stale 判定 → 靠范围化表述 + verify-code 兜底保证不夸大。
- choice_reason/impact: 同时满足 provenance 与"删失效链"两条硬要求。
- consequences_and_risks: 读者需要多看一个字段；文案若含糊仍可能被误读。
- rejected_alternatives: 不显示快照（无法判断覆盖范围）；显示并对落后给过期提示（重新引入失效链）。
- unresolved_items/owner: 具体呈现文案与消费者清单由 spec 冻结。
- Supersedes: 无。
module: review-validity
requirement_ids: [R-008, R-020]
derived_from: [D-001, D-003]
- record_contract: 审查事实必须携带 source_scope（所审代码快照 + 材料身份）、provider_result_refs（含迟到追加来源）、drift（有/无及漂移事实）与 completeness_disclosure；消费者只允许按 source_scope 表述，禁止声称覆盖当前代码；不得新增 stale/expired 状态字段。
artifacts: [spec.md#FR-REVIEW-PROVENANCE-DISPLAY]

### D-005

- question/final_option: 派发期间来源变化时，已完成的 provider 结果怎么处置？→ **保留并可用**，不再整轮降级
- recommendation/plain_language: 已经跑完的对外调用结果不要丢，也不要因为期间文件动了一下就作废整轮。
- decision: 来源漂移发生时，已完成 provider 的结果保留为可用事实并纳入结论；漂移本身如实记录为 provenance。不得因漂移把整轮降级为不可用。
- source_type/reference/exact_excerpt: 用户本会话 R-011（源自 t3 分析 P1）；现状 V-08（结果已保留，仅发布被降级）。
- approval_binding: 用户 Talk T-002（范围 B，含 A 组条目）。
- facts_and_constraints: 现状已保留结果在记录里（V-08），因此改动面小于 L2 估计；宪法要求 provenance 不得被摘要覆盖。
- Logic: 结果已存在且已付费 → 丢弃或降级都是浪费 → 保留并记录漂移事实即可。
- choice_reason/impact: 直接消除"跑了几分钟归零"。
- consequences_and_risks: 漂移期间结果可能对应非最终输入，故必须同时记录漂移 provenance 并由 D-004 的范围化表述约束声明。
- rejected_alternatives: 维持整轮不可用（浪费已完成调用）。
- unresolved_items/owner: 无。
- Supersedes: 无。
module: review-validity
requirement_ids: [R-011]
derived_from: [D-001]
artifacts: [spec.md#FR-SOURCE-DRIFT]

### D-006

- question/final_option: 外部审查服务的跨仓改动如何交付？→ 在本任务内一并改，但只收口 workflowhub
- recommendation/plain_language: 两个仓库都要改，但 WorkflowHub 的任务只能收口一个仓库，所以外部仓库那边不走本任务的任务追踪，缺的验收要如实登记。
- decision: 外部审查服务仓的改动在本任务内实施；本任务只对 workflowhub 做快照、独立审查、收口与物理读回。该仓的验收缺口、provenance 与提交授权由 R-032 交接文件承载并在本任务如实登记为已知缺口。
- source_type/reference/exact_excerpt: 用户 T-009「同时改两仓，只收口 workflowhub」；R-033。
- approval_binding: 用户 Talk T-009。
- facts_and_constraints: 一个任务只能绑一个目标仓库（`task-bootstrap` 只接受单个 `--target-repo`，`task.json` 只存一个 `target_repo_root`）；外部仓是独立 Git 仓库（`a96f28b7`，remote `Hugh4424/3rd-review`）。
- Logic: 用户要求根治空等 → 必须改外部仓 → 但任务模型只支持单仓收口 → 拆开"实施面"与"收口面"，缺口如实登记。
- choice_reason/impact: 满足用户意图且不伪造该仓的验收。
- consequences_and_risks: 见 RISK-006（该仓无本任务监督、无独立审查、无收口读回）。
- rejected_alternatives: 拆成两个任务（用户未选）；改成只做外部仓（workflowhub 侧问题无人做）。
- unresolved_items/owner: 该仓的提交/推送授权与验收方式（OPEN-006，owner = 用户在 build-code/verify-code 阶段）。
- Supersedes: 无。
module: cross-repo-throughput
requirement_ids: [R-009, R-033]
derived_from: []
artifacts: [spec.md#FR-CROSS-REPO-BOUNDARY]

### D-007

- question/final_option: 跨仓部分要不要先做终止/判死原语？→ **必须先做**
- recommendation/plain_language: 现在外部服务根本没有"终止"能力：没有进度时间戳、单个 provider 没有截止时间、配置还明确拒绝按耗时终止、停滞只写诊断不杀进程、取消接口你这边一次都没调过。所以不先把"判死"做出来，任何"熔断/达标即收敛"的策略都是空写。
- decision: 先在外部审查服务实现终止/判死原语：①manager 心跳过期判死（复用既有 `SESSION_MANAGER_LOST` 路径，协议零变更）；②`PROCESS_STALLED` 接成 provider 终态；③接通既有取消接口。此即 P-D-030① 的未完成实现。之后才在其上做收敛策略。
- source_type/reference/exact_excerpt: P-D-030①「主机制 = manager 心跳过期判死（协议零变更、对全体 provider 有效）；有 probe 的 provider 由 PROCESS_STALLED 接成终态；wh-review 只消费不自造墙钟停滞判定」（母决定 L743、L1830-L1843）；用户 G-003 选择「包含：先做终止/判死原语」。
- approval_binding: 用户 Grill G-003。
- facts_and_constraints: 外部服务公开状态只有 `{version, request_id, runtime_id, state, material_id}`；`deadline_ms` 为硬空值且配置拒绝按耗时终止；`PROCESS_STALLED` 只写诊断、从不 SIGTERM；取消接口零调用点（F-001）；「无 probe 时 health-runner 直接空转」且 antigravity/codex/pi 既无 probe 也不发 terminal 事件（母决定 L1842）。
- Logic: 无终止能力 → 策略无处生效 → 先补原语 → 再做策略 → 且原语必须落在服务侧（本仓被 P-D-030③ 禁止自造墙钟停滞判定）。
- choice_reason/impact: 与既有决定一致，且让后续策略有作用对象。
- consequences_and_risks: 跨仓工作量最大；该仓不进入本任务收口（D-006）。
- rejected_alternatives: 只做最小时间上限（与用户"不希望通过 timeout 停止审查"原话相背）；不包含原语（写出无法执行的计划）。
- unresolved_items/owner: 该仓的实现属于本次整体改进的实施面；其独立审查、回归证据、提交/推送与正式收口不进入本 WorkflowHub task，由 R-032 交接文件与外部仓后续收口承接。
- Supersedes: 无。
module: cross-repo-throughput
requirement_ids: [R-009]
derived_from: [D-006]
- state_semantics: provider 级终态值域 = completed 或 failed 或 cancelled；分组级值域 = completed 或 partial 或 unavailable 或 cancelled。取消语义 = 用户或调用方显式请求后进入 cancelled，不得由耗时推断。质量不可用 = 无可用终态时保持 unavailable，不得写成 failed。
artifacts: [spec.md#FR-TERMINATION-PRIMITIVE]

### D-008

- question/final_option: "必须等全部成员到终态才产出结果"这条契约怎么处理？→ **改为达标即可产出**
- recommendation/plain_language: 让外部服务在"最少异源数已经满足"时就能给出结论，不再为了等最慢的成员拖着不动。
- decision: 外部审查服务改为：满足最少异源数即产出分组结论；同时明确定义终态、取消、迟到结果与质量不可用四种语义。现有"非终态状态不得包含部分成员"的约束随之调整。
- source_type/reference/exact_excerpt: 用户 T-012 自由文本「可以改成达标即可产出」；F-001 / V-05（当前分组只在全部成员终态后产生）。
- approval_binding: 用户 Talk T-012。
- facts_and_constraints: 当前分组结果只在全部成员终态后产生，非终态不得带部分成员（F-001）；单轮托管等待上限 20 分钟（V-05）。
- Logic: 空等的根因是"等全终态" → 改为达标即产出 → 必须同时定义部分结果的语义，否则消费方无法判断完备性。
- choice_reason/impact: 直接消除"等最慢成员"。
- consequences_and_risks: 契约被多方消费，所有消费者需对齐；未定义语义会导致误读（由 D-010 兜住）。
- rejected_alternatives: 做成可配置（新增配置面且两边行为不一致更难排查）；保留全终态契约（"达标即收敛"永远做不成）。
- unresolved_items/owner: 终态/取消/迟到/质量不可用四类语义的具体定义由 spec 冻结。
- Supersedes: 现有"非终态不得包含部分成员"的传输约束。
module: cross-repo-throughput
requirement_ids: [R-009, R-025]
derived_from: [D-007]
- state_semantics: 最少异源数规则 = 满足阈值即允许产出分组结论；产出时仍在运行的成员保持 running，不得被写成 failed；部分结果语义 = 只含已达终态成员的结果，未达者显式标注 running。
- invariants: ①不得用耗时推断停滞；②未达最少异源数不得产出结论；③产出后新到的成员结果不得改写已发布结论（见 D-009）。
artifacts: [spec.md#FR-EARLY-CONVERGENCE]

### D-009

- question/final_option: 达标产出后迟到的慢成员结果怎么处置？→ **有效窗口内作为追加来源合入**
- recommendation/plain_language: 先出的结论不推翻；后来返回的结果在有效窗口内作为"追加来源"补进来，它带的新问题走你现有的处置流程；超窗到达的只当历史事实保留并标注"超窗未判断"。
- decision: 迟到结果①一律不丢弃；②在有效窗口内作为追加来源合入已发布结论，且**不推翻**已发布结论，其新 finding 走既有处置流程（fixed / rejected_invalid / accepted_risk / needs_human）；③超窗到达只作历史事实并显式标注"超窗未判断"。
- source_type/reference/exact_excerpt: 用户 T-012 自由文本「其他的慢成员返回结果后，不能丢弃，也需要考虑如何使用这些审查结果」；用户 G-004「追加来源 + 有效窗口」。
- approval_binding: 用户 Grill G-004。
- facts_and_constraints: 宪法要求 provenance 与失败事实保留；不能把"未判断"写成"已通过"。
- Logic: 不丢弃 → 但也不能让迟到结果无限延长本轮 → 设有效窗口 → 窗口内追加、窗口外标注。
- choice_reason/impact: 既不浪费已完成的对外调用，也不把"等最慢成员"换个形式装回来。
- consequences_and_risks: "有效窗口"的取值必须写死，否则边界模糊；追加来源的呈现方式必须让读者能分辨主结论与追加来源。
- rejected_alternatives: 只保留事实从不参与判断（慢成员找到的严重问题永远不处理）；可推翻重判且不设窗口（空等换形式回来）。
- unresolved_items/owner: 有效窗口取值与追加来源呈现由 spec 冻结。
- Supersedes: 无。
module: cross-repo-throughput
requirement_ids: [R-009]
derived_from: [D-008]
- state_semantics: 有效窗口从分组结论发布时刻起算；窗口长度由 spec 以单一常量冻结并写明理由；窗口内到达的成员结果进入 provider_result_refs 并标注 appended_after_publish；窗口外到达标注 over_window_unjudged，只作历史事实。
- invariants: 迟到结果永不覆盖已发布结论；其 finding 走 fixed / rejected_invalid / accepted_risk / needs_human 四态处置，不得静默丢弃，也不得标为通过。
artifacts: [spec.md#FR-LATE-RESULT-WINDOW]

### D-010

- question/final_option: 达标发布时如何声明审查完备性？→ **如实标注**
- recommendation/plain_language: 结论里写明"按最少异源数达标就发布了，还有几个成员在跑，它们的结果会在窗口内补进来"。既不空等，也不假装审完了。
- decision: 达标发布的结论必须携带完备性披露：按最少异源数达标、仍在运行的成员数、以及追加来源机制。不得省略该披露。
- source_type/reference/exact_excerpt: 用户 G-005「如实标注完备性」；宪法「不得把未覆盖说成通过」。
- approval_binding: 用户 Grill G-005。
- facts_and_constraints: 若省略披露，读者会把"达标发布"当成"审查完毕"（RISK-007 的同类风险）。
- Logic: 提前产出的代价是完备性下降 → 必须显式披露 → 披露使"提前"不等于"隐瞒"。
- choice_reason/impact: 在效率与诚实之间取到可审计的切分。
- consequences_and_risks: 披露文案若含糊仍可能被忽略。
- rejected_alternatives: 不声明完备性（与宪法冲突）；仍等全终态（否掉 D-008）。
- unresolved_items/owner: 披露字段与文案由 spec 冻结。
- Supersedes: 无。
module: cross-repo-throughput
requirement_ids: [R-009, R-025]
derived_from: [D-008, D-009]
- record_contract: 完备性披露字段固定为 published_at_least_sources、running_member_count、append_window（起止）与 disclosure_text；缺失任一字段即视为披露不完整。
artifacts: [spec.md#FR-COMPLETENESS-DISCLOSURE]

### D-011

- question/final_option: 工作树身份强制到什么程度？→ 只对写操作强制 + 窄逃生口
- recommendation/plain_language: 只有"会写正式记录"的命令必须在认证工作树里执行；只读命令（查状态/预检/体检）和"工作树还没建"的第一次 make-decision 留出窄口子；另外两个真实的发布/守卫脚本要迁进工作树跑，而不是给它们开豁免。
- decision: 对**写事实的命令**强制"当前上下文必须等于认证任务工作树"，不一致即 fail-loud。逃生口严格限于：①只读命令（状态/预检/体检）；②工作树尚未建立的首次 make-decision（含 bootstrap 路径）。两个真实 harness（发布安装校验、公共行为基线守卫）迁入工作树执行，不豁免。不得做成全局默认强制。
- source_type/reference/exact_excerpt: 用户 T-007；F-003 / V-07。
- approval_binding: 用户 Talk T-007。
- facts_and_constraints: 硬强制会破坏约 15 处测试调用点与 2 个真实 harness，并存在引导死锁（首个 make-decision 自身创建工作树）；已存在可选守卫开关与可复用身份解析函数（F-003）。
- Logic: 双真相的根因是写操作可在任意 checkout 发生 → 只锁写口 → 读命令与引导路径必须放行（否则不可启动）→ 真实 harness 迁移而非豁免，避免留下第二条真相路径。
- choice_reason/impact: 用最小回归面消除双身份。
- consequences_and_risks: 需同批改测试与两个脚本；逃生口若被放宽会重新引入双真相。
- rejected_alternatives: 全命令硬强制（破坏现有测试与发布校验）；不改只登记（双真相继续）。
- unresolved_items/owner: 具体写命令清单、逃生口边界与迁移清单由 spec 冻结。
- Supersedes: 无。
module: write-identity
requirement_ids: [R-022]
derived_from: []
- bootstrap_state: 首个 make-decision 允许在工作树尚未建立时执行，但必须持久化一次性状态（task_id + 触发命令 + 建立结果），之后任何写命令不得再沿用该状态；身份必须同时匹配 task_id、工作区路径与工作树根。
- propagation: 写身份必须向子进程与子代理传播；子代理不得在自己的上下文里绕过父级已解析的身份；错误工作树的写入尝试必须在写入前 fail-loud。
artifacts: [spec.md#FR-WRITE-IDENTITY-ENFORCEMENT]

### D-012

- question/final_option: 逐条验收证据由谁写？→ **build-code 官方处理器作唯一推导者**
- recommendation/plain_language: 现在至少有四条路径都在产出这份逐条验收证据，互相打架。让官方那一个处理器统一推导，另外两条输入路径同批退休，旧记录只读保留。
- decision: build-code 官方处理器成为逐条验收证据的**唯一写入者**；同批退休"调用方直接提交覆盖"与"运行器从宿主包猜测覆盖"两条竞争输入路径；每条 AC 绑定证据、无证据者保持 `unknown`，不得用空数组冒充覆盖；既有记录只读保留、不回溯重判。
- source_type/reference/exact_excerpt: 用户 T-002 范围条目；F-004 / V-16；宪法「不得把未覆盖说成通过」。
- approval_binding: 用户 Talk T-002。
- facts_and_constraints: 至少 4 条竞争写入路径；官方处理器已具备推导所需的全部输入（当前 AC 集合、测试 receipt 身份、快照与材料修订、执行证据叶子）；t3 任务库实测覆盖与 review 绑定不同快照（F-004）；治理规则禁止双写。
- Logic: 无唯一写入者 → 快照漂移 → 反复返工 → 收敛为一个推导者 → 退休其余输入以避免双写。
- choice_reason/impact: 复用既有处理器，不新增控制面。
- consequences_and_risks: 退休输入路径会改变调用方契约，需要同批迁移；旧记录若被读者误当当前，靠"不回溯 + 范围化"约束。
- rejected_alternatives: 只加校验不退休（保留双写）；新增专用命令/对象（新增控制面，违反 R-030）。
- unresolved_items/owner: 退休清单与迁移方式由 plan 冻结。
- Supersedes: 调用方直接提交覆盖、运行器从宿主包猜测覆盖两条路径。
module: acceptance-evidence
requirement_ids: [R-023]
derived_from: []
- record_contract: 逐条验收证据必须区分三种持久表示——零证据（status=unknown 且 evidence_refs 为空）、零 findings（已审查但无发现）、已验证为空（明确 not_applicable 且带理由）；三者不得互相冒充，也不得用空数组表示"已覆盖"；既有记录只读保留，不回溯重判。
artifacts: [spec.md#FR-ACCEPTANCE-SINGLE-WRITER]

### D-013

- question/final_option: 收口是否纳入远端任务分支删除？→ 纳入
- decision: 收口计划新增远端任务分支删除步骤；未删除时必须在收口输出显式提示，不得静默留下远端分支。
- source_type/reference/exact_excerpt: R-012；V-06（现状只删本地分支与工作树）。
- approval_binding: 用户 Talk T-002（B 组条目）。
- facts_and_constraints: 现状无任何远端分支删除；t3 曾靠人工补（t3 分析 U8）。
- Logic: 每次收口都留远端分支 → 需人工补 → 纳入计划步骤即可消除。
- choice_reason/impact: 消除反复人工补漏。
- consequences_and_risks: 远端删除属不可逆操作，必须仍在用户显式授权的收口动作内执行。
- rejected_alternatives: 只在输出提示（仍要人工补）。
- unresolved_items/owner: 无。
- Supersedes: 无。
module: close-records
requirement_ids: [R-012]
derived_from: []
artifacts: [spec.md#FR-CLOSE-REMOTE-BRANCH]

### D-014

- question/final_option: 物理已满足的清理步骤如何记录？→ 如实重放为完成，保留旧失败
- decision: 当清理步骤的物理状态已满足时，允许该步骤被如实记录为完成；旧失败记录不覆盖、不删除，保留为 provenance。
- source_type/reference/exact_excerpt: R-014；t3 分析 U7（`steps/cleanup.json` 仍为 failed 而完成记录为 true）。
- approval_binding: 用户 Talk T-002（B 组条目）。
- facts_and_constraints: 记录层冲突不影响物理结论但会误导审计；宪法的 provenance 要求禁止改写旧失败。
- Logic: 记录不一致 → 允许在物理读回后补记完成 → 同时保留旧失败以实现可追溯。
- choice_reason/impact: 消除审计困惑而不伪造历史。
- consequences_and_risks: 需要明确"补记"的写入方式与读回证据，否则可能被当作改写历史。
- rejected_alternatives: 维持失败记录（审计继续矛盾）；直接改写旧记录（破坏 provenance）。
- unresolved_items/owner: 补记的具体形态由 plan 冻结。
- Supersedes: 无。
module: close-records
requirement_ids: [R-014]
derived_from: []
artifacts: [spec.md#FR-CLEANUP-REPLAY]

### D-015

- question/final_option: 阶段行如何同时表达"命令退出码"与"阶段判定"？→ 明确分离
- decision: 阶段行必须把"该命令的退出码"与"阶段完成判定"分成两个可区分的事实，禁止用同一字段表达两种口径。
- source_type/reference/exact_excerpt: R-017；t3 分析 U5（row 写失败签名、predicate 写 satisfied）。
- approval_binding: 用户 Talk T-002（B 组条目）。
- facts_and_constraints: 现状两者口径不同且同场出现，易被误判任务状态。
- Logic: 观感冲突源于口径混用 → 分离字段即可消除。
- choice_reason/impact: 提升状态可读性。
- consequences_and_risks: 不改历史行，只影响新写入。
- rejected_alternatives: 删除失败事实（禁止）。
- unresolved_items/owner: 无。
- Supersedes: 无。
module: close-records
requirement_ids: [R-017]
derived_from: []
artifacts: [spec.md#FR-STAGE-ROW-SEMANTICS]

### D-016

- question/final_option: 需要外部来源的缺口如何披露？→ 收口摘要显式列出
- decision: 收口摘要必须显式列出"需要第二独立来源或外部提交才能满足"的验收项，作为已知缺口字段，而不是让其静默停留在阶段文件里。
- source_type/reference/exact_excerpt: R-018；t3 分析 U1/U3/U4。
- approval_binding: 用户 Talk T-002（B 组条目）。
- facts_and_constraints: t3 的 AC-ACC-008 与 stage outcome 缺口当时只存在于任务库文件里。
- Logic: 缺口不在摘要 → 审计要翻文件 → 列入摘要即可。
- choice_reason/impact: 审计成本下降且不伪造通过。
- consequences_and_risks: 无（纯披露）。
- rejected_alternatives: 维持分散记录。
- unresolved_items/owner: 无。
- Supersedes: 无。
module: close-records
requirement_ids: [R-018]
derived_from: []
artifacts: [spec.md#FR-KNOWN-GAP-DISCLOSURE]

### D-017

- question/final_option: 超长端到端套件怎么执行？→ 后台作业 + 单独登记结果
- decision: 无法在单条命令上限内完成的端到端套件改用后台作业执行并单独登记结果；不得用"超时"当作失败或通过结论。
- source_type/reference/exact_excerpt: R-015；V-10（600 秒是 provider 超时上限，不是命令上限，L2 表述无文档依据）。
- approval_binding: 用户 Talk T-002（B 组条目）。
- facts_and_constraints: 两条套件从未跑完，真实状态长期 unknown；其真实耗时从未被测量。
- Logic: 上限误杀 → 状态 unknown → 改后台执行并单列结果 → 消除长期未知。
- choice_reason/impact: 让 e2e 真实状态可见。
- consequences_and_risks: 后台作业需约定结果登记方式，否则仍是 unknown。
- rejected_alternatives: 拆分套件（改动测试结构，超出本轮范围）。
- unresolved_items/owner: 具体执行方式由 plan 冻结。
- Supersedes: 无。
module: close-records
requirement_ids: [R-015]
derived_from: []
artifacts: [spec.md#FR-E2E-EXECUTION]

### D-018

- question/final_option: 延期功能如何交接？→ 产出独立 md 交付物
- recommendation/plain_language: 把所有这轮不做的功能，逐条写清背景、问题和证据，放到你下载文件夹里，下一轮直接拿它立项。
- decision: 产出一份独立 Markdown 文件，逐条记录全部延期功能（背景 / 问题 / 证据），存放在本机下载文件夹，作为下一个改进任务的输入；内容须可独立重建问题与证据，不得只写标题。
- source_type/reference/exact_excerpt: 用户 T-006 自由文本「所有延期的功能请整理成一个md文件，详细记录背景、问题、证据，存储在本机下载文件夹中，我后续基于这个新文件做下一个改进任务」。
- approval_binding: 用户 Talk T-006。
- facts_and_constraints: 延期项共 7 条（R-013、R-016、R-019、R-021、R-024、R-026、R-028/R-029）。
- Logic: 延期项若只留在 decision-log 里会随任务归档沉没 → 需要独立可交付文件 → 下一轮据此立项。
- choice_reason/impact: 让"不做"也留下可执行的输入。
- consequences_and_risks: 该文件在仓外（下载文件夹），不进入本任务快照；需在决定与收口摘要中登记为仓外交付物。
- rejected_alternatives: 只写在 decision-log 的延期表（随归档沉没）。
- unresolved_items/owner: 文件路径与命名在 build-code 阶段确定并写入摘要。
- Supersedes: 无。
module: deliverables-and-boundaries
requirement_ids: [R-032]
derived_from: []
- record_contract: 交付物采用单一规范文件名与位置（下载文件夹下的固定文件名，由 build-code 冻结并写入收口摘要）；必须逐条包含全部 7 个延期项的 ID（R-013、R-016、R-019、R-021、R-024、R-026、R-028/R-029）各一次，每条含背景、问题、证据、边界与下一轮 owner 或触发条件；另设"跨仓依赖"一节记录 D-007 至 D-010 的期望验收。
artifacts: [spec.md#FR-DEFERRED-HANDOFF-DOC]

### D-019

- question/final_option: 本任务自身的边界纪律是什么？→ 每条改动必须对应既有决定编号或新决定
- decision: 每条进范围的改动必须写明它对应哪个既有已确认决定（P-Q17/P-Q20/P-Q22/P-D-009/P-D-010/P-D-030/ADR-0017/ADR-0028）或哪条本任务新决定；对不上号的条目不进本任务。7 项延期项不得以"顺手"为理由回流。
- source_type/reference/exact_excerpt: R-027（范围蔓延是本次要治的病）；R-030（vNext 边界）。
- approval_binding: 用户 Talk T-002 / T-006。
- facts_and_constraints: t3 的教训是"删一个 CI 的小决策演变成对 review / stage-runner / control-plane / vitest 的一揽子重构"。
- Logic: 无对账纪律 → 范围蔓延 → 用"决定编号"作准入门槛即可约束。
- choice_reason/impact: 直接防止本任务重演目标病症。
- consequences_and_risks: 若某条改动确无既有决定，必须显式新增决定并获用户确认，不能默认放行。
- rejected_alternatives: 只靠计划文件边界声明（t3 已证明不足）。
- unresolved_items/owner: 无。
- Supersedes: 无。
module: deliverables-and-boundaries
requirement_ids: [R-027, R-030]
derived_from: []
artifacts: [spec.md#FR-SCOPE-DISCIPLINE]

### D-020

- question/final_option: 用什么尺子验收"确实不浪费了"？→ 可证伪断言 + t3 真实计数
- decision: 主验收 = 一条可证伪断言（仅材料字节变化不得翻转任何已记录审查事实或触发新派发，代码快照未变时同理）；对照 = t3 的真实计数（26 次尝试、verify-code 约 12 小时、4/10 不可用、失败 provider 约 3,183 秒）；不新跑真实任务。证据不可得时显式判失败，不得记为通过。
- source_type/reference/exact_excerpt: 用户 T-008；R-031（禁止无范围全量回归）。
- approval_binding: 用户 Talk T-008。
- facts_and_constraints: 端到端墙钟受外部 provider 环境劣化影响大，噪声高；t3 计数是现成的 before 事实。
- Logic: 主观耗时不可证伪 → 换成机制行为断言 → 用现成计数作对照 → 不新增真实任务成本。
- choice_reason/impact: 判据不自证、不额外消耗。
- consequences_and_risks: 只能证明"机制行为改变"，不能把全部省时归因于本次改动。
- rejected_alternatives: 端到端总耗时为主（噪声高易误判）；不设基线（无法回答省了多少）。
- unresolved_items/owner: 断言的执行方式与证据路径由 plan 冻结。
- Supersedes: 无。
module: deliverables-and-boundaries
requirement_ids: [R-001, R-031]
derived_from: []
artifacts: [spec.md#FR-ACCEPTANCE-ORACLE]

### D-021

- question/final_option: 本任务是否触及页面或前端？→ `non_ui`
- decision: UI applicability = `non_ui`，由三来源证据合取得出（raw_requirement 无 UI 诉求；前端面不在需求索引内；声明范围不含前端改动）。反思页生成器作为**间接消费者**受兼容约束保护，但不构成本任务的 UI 范围。
- source_type/reference/exact_excerpt: 用户 T-010；`## UI applicability` 的三输入事实。
- approval_binding: 用户 Talk T-010。
- facts_and_constraints: 仓库存在反思页生成器与既有前端能力任务；本任务改动面向运行时机制与收口记录。
- Logic: 无 UI 需求 + 前端面不在范围内 + 声明不含前端改动 → 三来源均排除 → `non_ui`。
- choice_reason/impact: 明确不触发设计检查，同时登记间接消费者约束。
- consequences_and_risks: 见 RISK-005（事实形状变化可能影响反思页消费者）。
- rejected_alternatives: 记为 `ui`（会引入不必要的设计冻结）；记为 `unknown`（三来源已能给出可信排除）。
- unresolved_items/owner: 反思页消费者契约的兼容性由 build-plan/build-code 显式确认。
- Supersedes: 无。
module: deliverables-and-boundaries
requirement_ids: [R-005]
derived_from: []
- record_contract: UI 适用性事实必须以 sources 三来源对象形式保留（raw_requirement、project_inventory、planned_or_changed_frontend_fact），三来源各自独立给出结论，运行时按"三者皆 non_ui 才得 non_ui"派生。
- compatibility_acceptance: 反思页生成器作为间接消费者，必须有一条断言证明其消费的阶段/质量事实字段未被本任务破坏；确实不涉及则记 not_applicable 并给理由。
artifacts: [spec.md#UI-APPLICABILITY]

### D-022

- question/final_option: 交互聚合的"生产"路径怎么补？→ 在公开 `run --action=execute` 增加与 `research_report` 对称的 `interaction_aggregate` 发布字段，复用既有 kernel writer
- recommendation/plain_language: 现在这套"交互聚合"根本没有任何官方生产入口——仓库里那个既会写文件、又会发布质量事实的函数，只有测试在调用。于是普通会话只能手写一个格式严格的内容寻址文件；写错或漏写时系统只显示 missing，就被当成宿主限制。
- decision: 在公开 `run --action=execute` 的输入白名单中为 make-decision 增加 `interaction_aggregate` 字段，由 runtime 调用既有 `completeMakeDecisionInteractionPublication`：①内容寻址写入 `quality/evidence/interactions/<sha256>.json`；②发布 `talk_clarify` 质量事实；③把返回 ref 填入 `receipts.interaction`。调用方不得同时提交 `receipts.interaction`，不得手写聚合字节。不新增 public command、不新增持久对象类型、不新增第二 writer。
- source_type/reference/exact_excerpt: 本任务第一手核验：`completeMakeDecisionInteractionPublication` 全仓仅出现在 kernel 定义处与 `tests/contract/make-decision-interaction-publication.test.mjs`，`runtime/`、`tools/`、`skills/`、`workflows/` 无调用者；`run` 的字段白名单对 make-decision 只额外挂 `research_report`，而 `research_report` 有 CLI 侧发布钩子、聚合没有。K3 任务库实测：聚合文件存在（40,385 B、16 条 dispositions、`talk.round_count=4`）但其字节与当前 kernel 序列化结果不一致，且 71 个质量事实里**没有** `subject:"talk_clarify"`。
- approval_binding: 用户本轮原话「如果没有的话，请添加到当前任务中，我不希望workflowhub执行任务时还有任何阻塞」。
- facts_and_constraints: 该 writer 已同时具备"写记录 + 发布事实"两项能力；`receipts.interaction` 已被接受但只读；`readReceipt` 不做事实认证——所以参照既有 `research_report` 钩子即可，无需新机制。归档材料早已把该缺口登记为 `unknown`（F-20），本次首次给出确定结论。**跨 191 个任务的普查结论**：`talk_clarify` 与 `outline_closed` 两个 subject 集合**完全不相交**——凡发布过 `talk_clarify` 的任务都没有 `outline_closed` 判据，凡满足 `outline_closed` 的任务都没有 `talk_clarify` 事实；"同时满足 outline_closed + human_confirmation 并发布 talk_clarify"这条组合在生产上**从未被接线**。同时 `workflows/make-decision/SKILL.md` 的文档路径是"由会话直接组装聚合并写入任务目录"（T2/T3 均照此执行），与唯一的生产者 API 分叉：按 SKILL 走只会写出聚合文件、永不发布 `talk_clarify`；而 `outline_closed` 只需要 `receipts.interaction` 这个 receipt，并不需要 `talk_clarify`——它是**另一个** subject，且**不是**任何完成谓词（有契约测试断言其不在谓词集合内）。
- Logic: 有能力的 writer 存在但没有生产调用者 → 公开路径缺一个字段 → 补字段即可，不新增控制面。
- choice_reason/impact: 消除"必须手写聚合且失败静默"这一真实阻塞，且与既有研究发布路径完全对称。
- consequences_and_risks: 需同步校验"不得与 `receipts.interaction` 同时提交"；手写聚合的旧记录保留可读，不回溯重判。
- rejected_alternatives: 让调用方继续手写聚合（静默失败、易错、已实测走偏）；新增专用命令或对象（违反 R-030）。
- unresolved_items/owner: 字段名与并发校验细节由 spec 冻结。
- Supersedes: "调用方手写交互聚合"这一事实上的唯一路径。
module: stage-fact-publication
requirement_ids: [R-034, R-036]
derived_from: []
artifacts: [spec.md#FR-INTERACTION-AGGREGATE-PUBLICATION]

### D-023

- question/final_option: 完成谓词依赖的输入缺失时如何表现？→ 必须给出可区分诊断，禁止静默丢弃与误归因
- recommendation/plain_language: 现在缺了输入只显示 missing，分不清是"你没传"、"传了没通过"还是"宿主根本给不了"。结果一个纯粹的漏传被当成宿主限制，白等一轮。
- decision: 当完成谓词依赖的输入缺失时，运行输出必须区分三类：①调用方未提供；②提供了但未通过认证或校验；③外部宿主确实无法提供。只有第③类可用 `unavailable`；第①②类必须响亮失败或给出显式修复指引。`unavailable` 只作披露，不得成为同 task 修复的阻断，也不得被当作通过。
- source_type/reference/exact_excerpt: handler 对 `receipts.interaction`、`receipts.confirmation` 等可选输入采用"未定义即不加入完成主体"的写法，缺失时没有任何可区分诊断；ADR-0026 与 `skills/workflowhub-host-protocol/SKILL.md` 均明文规定 stage outcome 不得成为质量门禁。
- approval_binding: 用户本轮原话（同上）。
- facts_and_constraints: K3 中 `outline_closed` 的真实原因是生产入口缺失、`human_confirmation` 的真实原因是未走公开确认路径，两者都被误归因为"无宿主 bridge"。
- Logic: 静默可选 → 无法区分根因 → 误归因 → 白等或误判 → 强制三类诊断即可消除。
- choice_reason/impact: 直接消除"永远 missing 且被误读"的观感与时间浪费。
- consequences_and_risks: 需改诊断文本与相应测试，但不动谓词语义、不新增状态。
- rejected_alternatives: 把可选输入改成必填（会破坏历史路径与合法的 unavailable）。
- unresolved_items/owner: 诊断字段与文案由 spec 冻结。
- Supersedes: 无。
module: stage-fact-publication
requirement_ids: [R-035, R-036]
derived_from: [D-022]
artifacts: [spec.md#FR-MISSING-INPUT-DIAGNOSIS]

### D-024

- question/final_option: 阶段 outcome 与复盘在无外部宿主集成时怎么办？→ 提供受支持的本地最小路径；确实不可得时如实披露且不作门禁
- recommendation/plain_language: 复盘那一步现在是死路：它要一份由 bridge 发布的执行事实（含执行者、起止时间、输出 hash）。但那个 bridge 其实就是仓库里的一个命令行工具，本地会话自己也能调——只要给它一份带任务号/会话号/阶段的对话记录文件。所以要么把这条本地路径文档化并封装好，要么就明确它只是披露、不卡流程。
- decision: ①为普通本地会话提供受支持的阶段 outcome 构造路径：复用仓库内 bridge 的 stdin 契约与显式 `transcript_path`，给出可复用的最小封装与文档；②`stage_reflection` 保持**披露**语义，不得成为完成门禁（与 ADR-0026 一致）；③确实无法产出时保持 `unavailable` 并写明缺失的 producer 与影响范围，**禁止**伪造 executor、时间戳或 output hash。
- source_type/reference/exact_excerpt: `stage-reflect` 要求 `stage-reflection.v2` + 执行者身份与 `output_hash` + 恰好一份 `quality/evidence/stage-outcomes/<stage>/<sha256>.json`（缺一即 `unavailable`/`executor_absent`）；bridge 是仓库内 stdin CLI，只接受 `session.source.kind="host-session"` 与 `transcript_path`；其 transcript 只需带 `task_id`/`session_id`/`stage` 的 `user/message` JSONL；`completion-predicates.mjs` 与 host-protocol skill 均规定 outcome 不得成为门禁。
- approval_binding: 用户本轮原话（同上）。
- facts_and_constraints: 本地会话本身就是"宿主"，能构造该 transcript；但当前无文档、无封装，默认落到 `unavailable`。K3 实测：`quality/evidence/stage-outcomes/` 目录不存在，`quality/stage-reflection/` 不存在，只有 5 份 `stage-reflection-availability` 且 `reason_code=executor_absent`。
- Logic: 能力存在但无受支持路径 → 文档化并封装 → 复盘可在本地完成；若仍不可得，保持披露而非门禁 → 不再阻塞。
- choice_reason/impact: 消除"复盘永远 unavailable"，同时不伪造执行事实。
- consequences_and_risks: transcript 由会话自建，其认证强度低于真实外部宿主；必须在文档中写明该来源等级，不得声称等价。
- rejected_alternatives: 伪造 executor/时间戳/hash（宪法禁止）；把复盘升级为门禁（违反 ADR-0026）。
- unresolved_items/owner: 最小封装的形态与文档位置由 spec/plan 冻结。
- Supersedes: 无。
module: stage-fact-publication
requirement_ids: [R-035, R-036]
derived_from: [D-023]
artifacts: [spec.md#FR-LOCAL-STAGE-OUTCOME-PATH]

### D-025

- question/final_option: 阶段末 handoff 在目标材料尚不存在的阶段如何收口？→ 不得留非零失败签名
- recommendation/plain_language: make-decision 阶段结束时留下的执行行里有一条"handoff 命令退出码 1、失败签名 unavailable"，因为那一步要看 plan.md，而 make-decision 阶段根本还没有 plan.md。这让执行行看起来像失败了，其实不是。
- decision: 阶段末 handoff 在其引用的材料在该阶段尚不存在时，必须以显式的**不适用**语义收口（写明缺失的材料名与被跳过的原因），**不得**产生非零退出或失败签名。执行行不得因此显示 incomplete。
- source_type/reference/exact_excerpt: K3 任务库 `facts.jsonl` 的 make-decision 行：`evidence = [{"command":"stage-handoff:make-decision","exit_code":1,"failure_signature":"unavailable"}]`，且 `handoff = {value:null, reason:"the current plan.md was not readable for this stage-end write"}`；`layer_states` 因此为 implementation_completion=incomplete、stage_quality=incomplete。
- approval_binding: 用户本轮原话（同上）。
- facts_and_constraints: make-decision 只拥有 `decision-log.md`，`spec.md`/`plan.md`/`tasks.md` 分别由后续阶段产出；handoff 的声明读取器在 plan.md 缺失时返回空值加原因（这是正确处理），但外层命令仍以 1 退出。
- Logic: 材料尚未产出是正常时序 → 不该报失败 → 改为显式不适用 → 执行行不再假性 incomplete。
- choice_reason/impact: 消除"正常时序被记成失败"的观感，并避免误判任务状态。
- consequences_and_risks: 需区分"该阶段本就没有该材料"与"材料应存在但读不到"，后者仍须响亮失败。
- rejected_alternatives: 删除或改写历史失败事实（禁止，破坏 provenance）。
- unresolved_items/owner: 不适用语义的具体字段由 spec 冻结。
- Supersedes: 无。
module: stage-fact-publication
requirement_ids: [R-037, R-036]
derived_from: []
artifacts: [spec.md#FR-STAGE-HANDOFF-NOT-APPLICABLE]

### D-026（用户纠正：当前会话直接执行，2026-09-16）

- question/final_option: 阶段推进是否需要外部 Stage Agent、bridge、session 或当前 stage outcome？→ 不需要；当前 WorkflowHub 会话是唯一正式阶段执行者
- recommendation/plain_language: 先前把“没有外部 outcome”包装成失败，再建议补 bridge，是错误的 producer 归因。阶段 handler、质量事实、阶段行、reflection 和 handoff 都可以由当前认证会话直接完成；外部 host 不能成为同一 task 的继续条件。
- decision: 当前 public `stage-runtime run --action=execute` 直接调用官方 stage handler，并由现有 TaskKernel 发布当前质量事实和 `stage-end:<stage>` 阶段行。当前 run 不读取、不等待、不生成外部 Stage Agent 的 session/outcome；`receipts.stage_outcomes` 在 public invocation boundary 直接拒绝。build-code 的验收执行证据改用运行时生成并认证的 current-session binding（task/stage/attempt/run/snapshot/material），不从 host outcome 派生 actor；缺少 review、测试或 reflection 时只保留真实 `unknown`、`unavailable` 或 `incomplete`。stage-reflection 直接绑定当前 task/worktree/snapshot/material，并拒绝 public caller 以历史 outcome 作为当前 judgment 来源；stage-handoff 直接读取当前四材料。旧 `quality/evidence/stage-outcomes/**`、bridge 和 adapter 仅作历史读取、迁移和兼容测试，不能出现在 active manifest、current run、reflection、handoff 或 close 前置链。
- source_type/reference/exact_excerpt: 用户本轮原话“任务推进不需要‘外部 Stage Agent’，也不需要‘通过 bridge 提交当前快照的 session/outcome’，这些东西都违反 workflowhub 宪法”；本任务 RED：无 `receipts.stage_outcomes` 时 handler/publication 成功却写 `stage-end:verify-code` 退出 1；修复后同一入口写退出 0；`tests/contract/no-external-stage-agent-gate.test.mjs`、`tests/contract/stage-runner-reflection.test.mjs`。
- approval_binding: 用户本轮明确纠正并要求彻底解决。
- facts_and_constraints: 四份当前材料仍是唯一工作真相；质量、交付、Git 和 physical close 继续分离；独立 review 仍是质量事实但不要求外部 Stage Agent；历史 outcome 字节不回溯改写。
- Logic: 当前 handler 已有真实 producer 和 writer → 把 host outcome 从 active producer/前置条件链移除 → 成功本地 run 不再被缺 host 误记失败 → 同一 task 可以继续；真正的质量缺口仍保持原状态，不伪造通过。
- choice_reason/impact: 消除“先补外部 Agent 再 run”的机制性阻塞和重复控制面；代价是旧 outcome 只能保留兼容读取，不能再承担当前阶段细粒度执行证明。
- consequences_and_risks: active steps/skill-deps/host protocol/阶段技能必须不再声明 stage outcome 输入；public run 必须拒绝该旧 receipt；当前反思 executor 可用时按当前会话 identity 发布，不可用时为 `executor_absent` 且非阻断；legacy bridge 测试只证明历史兼容，不证明当前流程。current-session acceptance binding 只能由 runtime 生成，调用方不能伪造 source identity 或改绑快照/材料/attempt。
- rejected_alternatives: 继续要求本地 bridge 生成 outcome（只是包装缺失 producer）；把缺 outcome 降级成 unavailable 但继续放在 active manifest（仍诱导错误恢复）；伪造 executor、transcript、时间或 hash（违反宪法）。
- unresolved_items/owner: 旧 outcome adapter、历史 acceptance execution binding 和 migration reader 的最终删除时机由后续迁移决定；本任务只禁止它们成为 active gate，并登记唯一 consumer 与删除条件。
- Supersedes: D-024 中“本地会话必须经 bridge 生成当前 outcome”的路径；同时修正 OI-28、FR-RUNTIME-003、AC-RUNTIME-003 和 T016 中同义的 active contract。D-022、D-023、D-025 的交互发布、诊断和未来材料 N/A 语义继续有效。
module: stage-fact-publication
requirement_ids: [R-035, R-036]
derived_from: [D-024, D-025]
artifacts: [spec.md#FR-RUNTIME-003, spec.md#AC-RUNTIME-003, plan.md#D-026]

## 收敛检查

| 维度 | 用户答案 | 事实/材料引用 | 可执行验收 |
| --- | --- | --- | --- |
| 目标 | 用户确认（T-008）：主尺子 = 可证伪行为断言；对照 = t3 真实计数，不新跑真实任务 | R-001 / F-002 / T-008 | 场景：机制行为变化可复算；数据来源：质量事实与阶段行；通过：断言无违反且现有守卫全绿；失败：任一材料改动翻转审查事实或触发新派发 |
| 范围 | 用户确认（T-002 / T-006）：范围 = A 组 12 条 + B 组 5 条 + R-032 交付物；7 项延期 | R-032 / decision-log.md#范围 | 场景：范围清单逐条有归属；数据来源：决定区 D-001~D-025；通过：每条有决定编号且延期项进入交付物；失败：出现无决定编号的改动或延期项回流 |
| 方案 | 用户确认（T-005 / T-007 / T-011 / G-001 / G-002 / G-003 / G-004 / G-005）：方案 = 收口既有决定并跨仓补做终止原语与达标即产出；取舍：先删失效链再删额度、终局仅 verify-code 绑快照，牺牲部分审查完备性换取不再返工；被拒方案：保留额度只换发放单位；未决项：有效窗口取值与呈现文案由 spec 冻结 | D-001 / D-002 / D-003 / D-007 / D-008 | 场景：方案逐条可追溯到既有决定或新决定；数据来源：F-001~F-004 与 G/T 答复；通过：全部 D 条目有来源且无第二控制面；失败：出现重开已确认决定或新增双重控制面 |
| 验收 | 用户确认（T-008）：验收 = 可证伪断言 + t3 对照计数 + 既有守卫 | F-002 / D-020 | 场景：仅材料字节变化时审查事实不翻转；数据来源：质量事实库与阶段行计数；通过：断言无违反且结构守卫与公共行为基线不劣化；失败：任一路径在材料改动后翻转审查事实、触发新派发或出现 false-green |

## UI applicability

```json
{
  "result": "non_ui",
  "sources": {
    "raw_requirement": {
      "result": "non_ui",
      "fact": "The original requirement asks to reduce long elapsed time and heavy token waste in the five-stage runtime and its review mechanics. It names no page, route, screen, component, style or interaction, and requests no visual or frontend outcome."
    },
    "project_inventory": {
      "result": "non_ui",
      "fact": "This repository's frontend surface is the reflection page generator under tools/cli plus the separate frontend capability tracked in specs/workflowhub-ui-frontend-capability-20260904. Neither is referenced by any requirement in R-001..R-037, and no route, page or component appears in the accepted change set."
    },
    "planned_or_changed_frontend_fact": {
      "result": "non_ui",
      "fact": "The accepted change set (D-001..D-021) targets runtime review validity, write identity, acceptance-evidence ownership and close/record semantics, plus one standalone markdown handoff document. It adds or changes no route, page, component, style or template."
    }
  },
  "note": "The reflection page generator stays an indirect consumer of stage and quality facts; that compatibility constraint is recorded as RISK-005 and does not turn this task into a frontend change."
}
```

> 三个来源各自独立给出结论，运行时按"三者皆为 non_ui 才得 non_ui"的规则派生，本记录不自行盖章：`raw_requirement` 无任何 UI 诉求；`project_inventory` 的前端面不在本需求索引内；`planned_or_changed_frontend_fact` 不含任何前端改动。用户 T-010 的声明只更新了第三个来源，**不构成**"调用方点名降级"。间接消费者风险见 RISK-005（反思页生成器消费阶段与质量事实）。

## 三轮 talk

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001 | 任务类型：规划任务 / 普通任务 | 规划任务只问方向层；普通任务允许追问实现细节 | **普通任务** | 类型已定；保持既有提问粒度 | R-003 / V-11 |
| T-002 | 范围：A 只做最高杠杆根因 / B 加记录层与收口小修 / C 全部都做含巨人文件切分 | A 收益集中但维护性痛点延后；B 收口更省事但改动面变大；C 一次全解但易重演范围蔓延 | **B** | 排除 C；巨人文件切分移出本任务 | R-001 |
| T-003 | 旧任务事实是否回溯重判：不回溯 / 允许显示为过期 / 回溯重判全部 | 不回溯风险最小；显示为过期复杂度上升；回溯会改写历史结论 | **不回溯** | 只读性保留；新规则只影响新判定 | R-030 / V-02 |
| T-004 | 外部服务无健康判死能力时怎么办：只做有界尝试其余延期 / 连外部服务一起改 / 维持现状 | 有界尝试最坏仍等约 20 分钟；跨仓根治但范围翻倍；维持现状下次仍空等 | **连外部服务一起改** | R-009 改为跨仓交付；引导出 T-009 | F-001 / V-14 |
| T-005 | 代码快照守卫算不算失效链：材料不算代码算 / 代码也不算 / 重新裁决边界 | 材料不算代码算会有代码返工；代码也不算改动最小但有假绿风险；重新裁决等于重开已确认决定 | **代码也不算（严格照 P-D-009 字面）** | 阶段审查不再比材料版本与代码快照；引导出 T-011 | V-12 / V-13 |
| T-006 | 范围清单是否成立 | 三选项为按研究后清单 / 再缩到只做 A 组 / 把协议瘦身也纳入 | **按研究后的清单** + 追加要求：延期项整理成独立 md 存下载文件夹 | 范围定稿；新增 R-032 | R-032 |
| T-007 | 工作树身份强制力度 | 只对写操作可迁移；全强制破坏约 15 处测试与 2 个 harness；不改则双真相继续 | **只对写操作强制 + 窄逃生口** | 逃生口限只读命令与首次 make-decision；harness 迁移而非豁免 | F-003 / V-07 |
| T-008 | 验收尺子 | 可证伪断言不自证；总耗时噪声高；无基线无法回答省了多少 | **可证伪断言 + t3 真实计数** | 验收判据确定 | R-001 / F-002 |
| T-009 | 跨仓改动如何落地 | 拆两任务边界清楚；同改两仓只收口 workflowhub 则该仓无追踪；只做跨仓则本仓无人做 | **同时改两仓，只收口 workflowhub** | 交付面含跨仓；风险 RISK-006 | R-033 |
| T-010 | 是否触及页面或前端 | 不碰按非 UI；碰展示面需设计冻结；先按非 UI 则可能漏设计检查 | **不碰页面/前端** | UI applicability 重算为 `non_ui`；风险 RISK-005 | R-005 |
| T-011 | verify-code 是否例外 | 例外则终局不假绿；不例外则终局无兜底；只显示快照易误导 | **verify-code 例外，必须绑当前快照** | 唯一代码身份门槛落在终局 | F-002 / V-13 |
| T-012 | 全终态契约：达标即产出 / 可配置 / 保留全终态；并追问迟到结果如何使用 | 达标即产出根治空等但契约回归面最大；可配置新增配置面；保留则永不成事 | **改成达标即产出**，并追问迟到结果处置（引 G-004） | 引导出 D-008 与 D-009 | F-001 / V-05 |
| T-013 | 迟到结果处置：追加来源 + 有效窗口 / 只保留不判断 / 可推翻重判不设窗口 | 追加+窗口兼顾不浪费与不拖长；只保留会漏严重问题；可推翻等于空等换形式 | **追加来源 + 有效窗口** | D-009 定稿 | T-012 |
| T-014 | 跨仓是否包含终止/判死原语 | 包含则策略有作用对象；只做时间上限与用户原话相背；不包含则写出无法执行的计划 | **包含：先做终止/判死原语** | D-007 定稿 | P-D-030① / F-001 |
| T-015 | 审查事实呈现：按来源范围显示快照 / 不显示 / 显示并给过期提示 | 范围化显示兼顾 provenance 与删失效链；不显示无法判断覆盖；过期提示等于装回失效链 | **按来源范围记录并显示快照** | D-004 定稿 | P-D-009① / ADR-0017 |

## 调研

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| F-001 本仓 + 外部服务只读扫描 | 外部审查服务是否已提供健康判死与达标即收敛，本仓能否直接消费 | 不暴露任何健康/死亡信号；单 provider 截止时间为硬空值且配置拒绝按耗时终止；`PROCESS_STALLED` 只写诊断、从不终止子进程；分组结果只在全部成员终态后产生、非终态不得含部分成员；取消接口存在但本仓零调用点 | completed | D-006~D-010 |
| F-002 本仓 + 母决定/PRD/ADR 只读扫描 | 审查有效性该绑什么；现有绑定点分类 | 约 8 处把"审查是否仍有效"绑到材料版本；返工引擎是"按材料版本发放额度→材料一改即重置并重新派发"；P-Q17=A / P-Q20 / P-Q22 / P-D-009① 已明文要求删除该链；ADR-0017 亦已规定 snapshot/material 只作 provenance | completed | D-001~D-004 |
| F-003 本仓调用点扫描 | 强制写操作在工作树内的影响面 | 硬强制破坏约 15 处测试与 2 个真实 harness，并存在引导死锁（首个 make-decision 自身创建工作树）；已有可选守卫开关与可复用身份解析函数 | completed | D-011 |
| F-004 本仓生产者/消费者扫描 | 逐条验收证据由谁写、由谁消费 | 至少 4 条竞争写入路径；官方处理器已具备推导能力；t3 实测覆盖与 review 绑定不同快照 | completed | D-012 |
| F-005 K3 任务库与本仓公开路径复核 | `outline_closed`、`human_confirmation`、`stage_reflection` 与 handoff 缺口的真实根因 | 交互聚合缺官方生产入口；公开确认路径本可发布确认事实；旧实现把当前反思绑定到 outcome/bridge；正常未来材料缺失被 handoff 外层误记为非零失败。证据锚点：K3 `facts.jsonl`、本任务 `facts.jsonl`、公开 `run`/`confirm` 路径与 stage hand-off 消费链 | completed | D-022~D-026 |
| F-006 当前阻塞复现与根因 | 为什么会出现“先补外部 Stage Agent outcome 再正式 run” | 无 `receipts.stage_outcomes` 时官方 handler 与 publication 已成功，但旧 `runOfficialStage` 仍把缺 host outcome 映射成 `failed`，stage reflection/handoff 又沿用 host outcome 前置模型；修复后 public run 在入口拒绝旧 outcome 注入，直接写 `stage_end_recorded`/exit 0，current-session acceptance binding 由 runtime 生成，reflection/handoff 直接按当前身份校验；无 judgment/executor 时只记录 `executor_absent/unavailable`，不阻断。active manifest 不再声明 stage outcome 输入。证据：`tests/contract/no-external-stage-agent-gate.test.mjs`、`tests/contract/stage-runner-reflection.test.mjs`、`tests/contract/acceptance-execution-tier.test.mjs`、当前 `stage-runner`/`stage-reflect`/`stage-handoff`/`review-record-route` 实现 | completed | D-026 |

## grill

| grill_id | CONTEXT/冲突 | 结论 | ADR/四项退出 | source/evidence |
| --- | --- | --- | --- | --- |
| G-001 | 冲突：P-D-010 明文要求**删除**评审轮次预算，而 accepted 的 ADR-0028 把该预算定为唯一 owner 并要求"等价替代机制"才可替换 | 用户选择按 P-D-010 删除；去重替代物用 P-D-009③ 的 `review_result_ref`（即 ADR-0028 所要求的"经审查替代"），并同批修订 ADR-0028 的预算条款 | ADR：需要修订 ADR-0028（见 §文档结果） | 母决定 L1195-L1197 / docs/adr/0028 |
| G-002 | 边界：既然代码快照不再作有效性比较，最后一道审查是否例外 | 用户选择**只有 verify-code 例外**；build-code 集成审查按阶段产物处理，不绑快照 | 无 ADR 变更 | T-011 / G-002 |
| G-003 | 完备性：达标即产出 + 迟到结果只追加不推翻，如何声明"审查完没完" | 用户选择**如实标注完备性**（按最少异源数达标 + 仍在运行成员数 + 追加来源机制） | 无 ADR 变更 | T-012 / G-005 |
| G-004 | 冲突：当前实现处处违反已 accepted 的 ADR-0017，但无任何机制阻止再次回退 | 确认这是**收口问题**而非设计问题；把"仅材料变化不得翻转审查事实或触发新派发"写成可证伪验收判据 | ADR-0017 无需修订（代码须回到 ADR） | docs/adr/0017 / V-13 |

> Grill 结论：全需求五类覆盖矩阵（目标 / 流程与入口 / 数据与状态 / 成功失败与验收 / 约束非目标延期）逐类均有对应 OI 与决定；四项退出检查：外部接口已按真实定义核实（F-001）、字段与路径命名有唯一权威来源（既有 ADR 与母决定）、失败路径与异常语义已明确（D-004 / D-009 / D-010）、范围与不做清单已写死（§范围 / §非目标 / D-019）。**未触发为凑数而提问**：能被代码与既有决定回答的问题均已自行核实。

## 审查处置

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| FND-001 | 方向审查 F-76913bbf870b（blocking，red）+ F-945628e0a6ba（blue）：提交物只有 27 个未决问题，没有选定方向、范围边界、成功判据、失败边界与拒绝方案 | 若成立，最小可用改动无法被审查 | fixed | 方向轨道依契约**只能**接收 questions-only 投影（不得含答案/处置），故"包里没有方向"是结构必然而非缺陷；其实质缺口已在 §决定（D-001~D-025）、§收敛检查、§非目标、§拒绝方案 中补齐 | owner=make-decision；consumer=build-spec；retain |
| FND-002 | 方向审查 F-3b4029a6cb1c + F-a76d6e4c479a（red）+ F-d77e1afa661b（blue）：OI-07/OI-09 把已确认决定当开放问题，可能重开或造出第二控制面 | 可能重开 P-Q17/P-Q20/P-D-009/P-D-010，违反"不新增双重控制面" | fixed | 已把 P-Q17=A / P-Q20 / P-Q22 / P-D-009① / P-D-010 提升为 §1.2 硬约束；D-001 定性为收口；D-002 由"改发放单位"纠正为"按 D-010 删除" | owner=make-decision；consumer=build-spec/build-plan；retain |
| FND-003 | 方向审查 F-6cf113bcd0e2 + F-0a008e740cb3（red）：收敛问题未与"当前根本没有任何终止能力"排序，可行性会被误判 | 可能写出无法执行的熔断/收敛计划 | fixed | D-007 明确先补终止/判死原语（P-D-030① 的未完成实现），D-008 才改契约；D-009/D-010 定义迟到结果与完备性披露 | owner=make-decision；consumer=跨仓任务与 build-plan；retain |
| FND-004 | 方向审查 F-5b849f670261（red）+ F-5fcac96ee5f2（blue）：工作树强制边界未定，未约束兼容与引导约束 | 可能默认全局强制，破坏测试与发布校验 | fixed | D-011 写下写命令才强制、窄逃生口（只读命令 + 工作树未建立时的首次 make-decision）、两个 harness 迁移而非豁免 | owner=make-decision；consumer=build-plan；retain |
| FND-005 | 方向审查 F-148fe80fa326（red）+ F-8dfa32501879（blue）：验收证据无权威写入者、无优先级、无旧记录读法 | 可能再次产出内部不一致的验收证据 | fixed | D-012 指定官方处理器为唯一写入者，同批退休两条竞争输入，旧记录只读不回溯 | owner=make-decision；consumer=build-code/verify-code；retain |
| FND-006 | 方向审查 F-fd3f50a030d6（red）：没有选定成功度量与验收目标 | 可能改了文档却无法证明省时省 token | fixed | D-020 确定主判据（可证伪断言）与对照（t3 真实计数）；§验收标准 逐项列出 | owner=make-decision；consumer=build-plan/build-code；retain |
| FND-007 | 方向审查 F-ff796c5135ed（red）+ F-249202a12907（blue）：来源不可从提交字节重建（三份分析材料缺身份、R/V 编号未定义映射） | 审查无法重建范围与优先级 | fixed | §1.3 补齐三份材料的 sha256；§0.2 V 系列与 §调研 F 系列均给出定义与来源；§原始需求 覆盖表逐条给出 R→处置映射 | owner=make-decision；consumer=后续审查；retain |
| FND-008 | 细节审查 F-4c12821e5d5a（red，blocking）+ F-e7301749128e（blue）：跨仓工作同时被声明为"在范围内"和"排除在本任务快照与收口之外"，交付判据不一致 | 无法一致判定本任务是否通过 | fixed | 新增 §跨仓依赖与验收边界：把"实施面"与"收口面"分离——workflowhub 侧进入通过判据，跨仓改动只实施、不计入通过判据、以真实状态披露；未验收不得判本任务失败 | owner=make-decision；consumer=build-plan/build-code/close；retain |
| FND-009 | 细节审查 F-53ec241092a5（red，blocking）+ F-28a9d44607ff（blue）：缺少 reconstruct → reveal → challenge 流程与"选择在 reveal 前保持隐藏"的不变量 | 方向形成过程不可回放，且可能提前泄露选择 | fixed | 新增 §方向流程，含三阶段表、可见性规则与提前泄露的可证伪失败条件 | owner=make-decision；consumer=build-spec/后续审查；retain |
| FND-010 | 细节审查 F-995c210bf006（red）+ F-5bea0deea438（blue）：四类终态语义被点名但未定义，有效窗口无时长/时钟/边界行为 | 不同实现都可自称合规 | fixed | D-007 补 provider/分组终态值域与取消、质量不可用语义；D-008 补最少异源数规则与部分结果语义；D-009 补窗口起算、窗口内/外标注与不覆盖不变量；D-010 补披露字段 | owner=make-decision；consumer=跨仓任务与 build-spec；retain |
| FND-011 | 细节审查 F-8c94d7ed5501（red）：D-003 至 D-005 缺少可观察的记录契约，无法区分"绑当前代码"与"仅来源快照"以及漂移保留 | 读写两侧对同一事实的理解可能不一致 | fixed | D-003 补代码绑定记录契约（verify-code 绑快照、build-code 只作来源）；D-004 补来源范围、provider 结果引用、漂移与披露字段，并禁止新增 stale 字段 | owner=make-decision；consumer=build-spec/build-code；retain |
| FND-012 | 细节审查 F-8dacc4c01181（red）：D-002 的验收未包含"同批修订 ADR-0028" | 代码删了预算但治理文档仍要求保留 | fixed | D-002 新增 acceptance：预算消费点为零、去重替代物生效、ADR-0028 条款已同批修订且有文档 diff 可读回 | owner=make-decision；consumer=build-code；retain |
| FND-013 | 细节审查 F-6dfe84a8e404（red）：21 条决定缺少可追溯的 OI 记录（选项/后果/风险/用户选择） | 无法区分"分析建议"与"已确认方向" | fixed | §2.3 OI 记录 + §2.4 收敛进展 + §三轮 talk 的用户选择列共同构成追溯链；核心 OI 的选择由 approve-decision 的交互聚合 oi_dispositions 单向绑定；另加命名约定消除重号 | owner=make-decision；consumer=build-spec；retain |
| FND-014 | 细节审查 F-c6b5003ab44e（red）+ F-9dc7c243adb3（blue）：验收不可复现（无命令、基线引用、期望状态、证据落点） | 无法执行也无法复核 | fixed | 新增 §证据矩阵：逐决定给出 oracle、期望结果、证据落点与"不可得即 failed/unknown"规则；对照基线引用 t3 真实计数 | owner=make-decision；consumer=build-plan/build-code；retain |
| FND-015 | 细节审查 F-dc53d68c6d9a（red）：D-012 的 unknown 状态未落地，零证据仍可能被编码为空数组而看似通过 | 覆盖可能被冒充 | fixed | D-012 补 record_contract：零证据 / 零 findings / 已验证为空三种表示必须可区分，禁止空数组冒充覆盖，旧记录只读 | owner=make-decision；consumer=build-code/verify-code；retain |
| FND-016 | 细节审查 F-253b6d97d2ac（blue）：本任务 D-009/D-010 与继承的 D-009/D-010 重号，引用不唯一 | 验收与证据引用可能指错对象 | fixed | 新增命名约定：继承决定一律写 P- 前缀（P-Q17/P-D-009/P-D-010/P-D-030），本任务决定保持 D-xxx；全文已按此改写 | owner=make-decision；consumer=所有下游；retain |
| FND-017 | 细节审查 F-7ae665ff84eb（blue）：D-011 未定义一次性引导状态与身份向子进程/子代理的传播 | 引导路径可能成为永久旁路 | fixed | D-011 补 bootstrap_state（一次性、持久化、之后不得沿用）与 propagation（子进程/子代理不得绕过父级身份，错误工作树写入前 fail-loud） | owner=make-decision；consumer=build-spec/build-code；retain |
| FND-018 | 细节审查 F-a9787912ed66（blue）：D-021 的 non_ui 无法从提交字节验证，且间接消费者缺少兼容验收 | 结论不可复核或漏掉消费者破坏 | fixed | 三来源事实已在 §UI applicability 内联（含各自结论）；D-021 补 record_contract 与 compatibility_acceptance（反思页消费者断言或 not_applicable + 理由） | owner=make-decision；consumer=build-plan/build-code/verify-code；retain |
| FND-019 | 细节审查 F-ad733a029354（blue）+ F-60eccb9dcf99（red）：R-032 交付物缺少逐条背景/问题/证据，也没有规范文件名与位置 | 交付物无法独立重建，下一轮无法据以立项 | fixed | D-018 补 record_contract：单一规范文件名与位置、7 个延期项 ID 各出现一次、每条含背景/问题/证据/边界/owner 或触发条件，另设跨仓依赖一节 | owner=make-decision；consumer=下一轮任务；retain |
| FND-020 | 细节审查 F-9eace9bb910c（blue，minor）：逐条可证伪预期漏了 D-006 的失败条件 | 跨仓边界登记缺少可证伪判据 | fixed | §跨仓依赖与验收边界 与 §证据矩阵 均补 D-006 失败条件：跨仓边界或验收缺口未如实登记即为失败 | owner=make-decision；consumer=build-code；retain |
| FND-021 | 细节审查 F-194f2bcaecb2（red）：原始需求要求先建工作树再进 make-decision，而 D-011 允许工作树不存在时的首次 make-decision，例外未定义且未测试 | 引导例外可能演变成长期旁路 | fixed | 明确工作树创建是本任务前置（本任务已在 make-decision 前完成）；D-011 的例外被限定为一次性持久化引导状态并给出定向验收；§证据矩阵 D-011 行给出 oracle | owner=make-decision；consumer=build-plan；retain |
| FND-022 | 细节重跑（red，major + blue，blocking）：D-022~D-025 未经批准却进入验收；标题与范围仍写 `D-001~D-021`，与 25 条决定口径冲突 | 追溯与验收核对断裂，未经批准的决定被当作已确认 | fixed | 标题口径与其实体范围声明已统一为 `D-001~D-025`，范围计为 A 组 12 条；D-022~D-025 的批准状态由本次最终确认赋予——**未确认前它们仍是未确认内容**（§最终确认 已写明覆盖 D-001~D-025） | owner=make-decision；consumer=build-spec；retain |
| FND-023 | 细节重跑（red，major）：`D-010` 在同一文档内被赋予两个语义（继承的"删预算"与本任务的"完备性披露"） | 同一编号无法唯一追溯，D-002 的依赖产生歧义 | fixed | 材料内继承决定一律 `P-` 前缀（§1.2 命名约定），本任务决定保持 `D-xxx`；**两份审查 packet 文本里残留的裸 `D-009/D-010/D-030` 已改为 `P-` 前缀**（packet 侧缺陷，非材料缺陷） | owner=make-decision；consumer=所有下游；retain |
| FND-024 | 细节重跑（red，major）：三份分析材料与 D-022~D-025 缺少稳定证据锚点，包内无法独立重建 | 新决定来源不可复核 | fixed | §1.3 给出三份材料 sha256；D-022~D-025 每条 `source_type/reference/exact_excerpt` 均带第一手证据（file:line 与实测计数）；新增 F-005 记录本轮根因核验 | owner=make-decision；consumer=后续审查；retain |
| FND-025 | 细节重跑（red，major）：D-002 验收未包含同批修订 ADR-0028 | 代码删了预算但治理文档仍要求保留 | fixed | 材料中 D-002 的 `acceptance` 已含"ADR-0028 条款已同批修订且有文档 diff 可读回"；packet 侧未携带该行，已登记为 packet 构造要求 | owner=make-decision；consumer=build-code；retain |
| FND-026 | 细节重跑（red，major）：D-003~D-004 验收是单向的，只查 verify-code 不能对应旧快照 | 对称边界未被验证 | fixed | §证据矩阵新增"D-003 / D-004（对称）"行，四个方向全部要求成立 | owner=make-decision；consumer=build-code；retain |
| FND-027 | 细节重跑（red，major）：R-032 交付物验收遗漏位置、独立性、下一轮可重建性与收口登记 | 交付物可能无法支撑下一轮立项 | fixed | D-018 的 `record_contract` 已含规范位置与逐条要求；§证据矩阵新增 D-018 补充行（下载文件夹 / 独立 md / 可立项 / 收口登记） | owner=make-decision；consumer=下一轮任务；retain |
| FND-028 | 细节重跑（blue，major）：验收未度量原始痛点（耗时与 token 浪费），实现可能在满足全部结构判据的同时不解决用户问题 | 主验收偏离用户抱怨 | fixed | §证据矩阵新增 D-020 补充行：用 t3 真实计数作为 before/after 对比指标（派发次数、因材料改动触发的额外派发、单轮最大空等、失败 provider 吞噬时长），且不新跑真实任务 | owner=make-decision；consumer=build-plan/build-code；retain |
| FND-029 | 细节重跑（blue，major）：跨仓结果契约在状态转移层面不可证伪 | 不同实现都可自称合规 | fixed | D-007~D-010 已含 `state_semantics` 与 `invariants`；§证据矩阵新增状态契约行；D-006~D-010 跨仓拆分行要求逐仓库 owner 与显式延期标记 | owner=make-decision；consumer=跨仓任务与 build-spec；retain |
| FND-030 | 细节重跑（blue，major）：D-022~D-025 的端到端状态契约未定义（从聚合到 outline_closed 的消费链） | 发布后完成判据如何变真不明确 | fixed | D-022 决策文本写明链路（发布 → 填 `receipts.interaction` → `outline_closed` 消费）；§证据矩阵新增"状态契约"行要求每一跳有唯一消费者且状态可读 | owner=make-decision；consumer=build-code；retain |
| FND-031 | 细节重跑（blue，major）：reconstruct → reveal → challenge 流程与 pre-reveal 隐藏状态未出现在提交包内 | 方向形成过程不可回放 | fixed | 材料新增 §方向流程（三阶段表 + 可见性 + 提前泄露的可证伪失败条件）；packet 未携带属 packet 构造缺口，已登记为要求 | owner=make-decision；consumer=build-spec/后续审查；retain |
| FND-032 | 方向重跑（red×2 + blue，major）：`R-001~R-036` 未在包内定义，`V-16`、`F-005` 悬空，来源不可独立重建 | 方向无法被挑战 | fixed | 材料内已具备 §1.2 R 台账、§0.2 V 系列（含 V-16）、§1.3 三份材料 sha256、§调研 F 系列（含 F-005）；方向 packet 只摘要了 V-01~V-15 与 F-001~F-004，属 packet 构造缺口，已登记为"后续 packet 必须内联 R 台账与新 V/F 定义" | owner=make-decision；consumer=后续审查；retain |
| FND-033 | 方向重跑（red，major）：缺少覆盖"主会话上下文控制与子代理派发"及"Talk/Grill 用大白话"的 OI | 两条用户要求未落到方向轴 | rejected_invalid | R-006 / R-007 已在 §原始需求 覆盖表中 disposition 为 covered（执行纪律），它们是**执行约束**而非方向轴；方向轨道依契约只收到 questions-only 投影，看不到覆盖表，故产生该观感。不新增 OI，避免为满足观感而扩张大纲 | owner=make-decision；consumer=build-spec；retain |
| FND-034 | 方向重跑（red + blue，blocking）："提交物只有 28 个 open 问题、没有选定方向" | 最小可用改动无法审查 | rejected_invalid | 与 FND-001 同因：方向轨道依契约**只能**接收 questions-only 投影（不得含答案/处置/方案），因此"包里没有方向"是结构必然而非缺陷。方向、范围、非目标、拒绝方案与验收均已写入材料（§决定 / §收敛检查 / §非目标 / §拒绝方案 / §证据矩阵）。已把 packet 构造要求登记为后续改进 | owner=make-decision；consumer=build-spec；retain |

## 最终确认

- 状态：accepted
- 用户原文：`确认（推荐）`；本次 build-spec 恢复时又明确答复 `确认，继续（推荐）`，确认继续以 D-001~D-025、范围 B、7 项延期与 `non_ui` 为已批准方向。
- 绑定边界：认证确认记录由公开确认入口保存在任务质量目录；本材料只保存用户原文与语义，不复制或追逐内容寻址引用。后续规格细化不得重开该方向。

### M6 freeze packet

- decision_id: D-001~D-025
- material_revision: current
- snapshot_tree: current
- material_scope: ["decision-log.md"]
- material_scope_revision: current
- approval_binding status: accepted
- final_confirmation status: accepted
- step_11 status: accepted
- freeze packet covers 用户流程、数据状态、成败边界、非目标。
- 无未决方向级问题。

## 拒绝方案

| 选项 | 拒绝理由 | 关联 D |
| --- | --- | --- |
| 保留评审轮次预算、只把发放单位从"材料版本"改成"真实修复" | 与 P-D-010 明文"删除"冲突，且等于重开已确认决定；预算机制本身实测出过错（把未发出的调用算作消耗） | D-002 |
| 保留"材料版本"作为阶段审查的有效性比较，只放宽代码快照 | 与 D-009① 字面冲突；未消除返工引擎 | D-001 |
| 对全部命令硬强制工作树身份 | 破坏约 15 处测试调用点与 2 个真实 harness，并造成引导死锁 | D-011 |
| 为逐条验收证据新增专用命令/对象 | 新增控制面，违反 R-030；既有官方处理器已具备推导能力 | D-012 |
| 达标即产出后允许迟到结果推翻已发布结论且不设窗口 | 等于把"等最慢成员"换个形式装回来 | D-009 |
| 把巨人文件主体级收窄并入本任务 | 与"降低机制浪费"不是同一根因，会重演范围蔓延；原提案亦自述应另立任务 | D-019 |
| 拆成两个独立任务分别交付两仓 | 用户明确选择本任务内一并改、只收口 workflowhub | D-006 |

## 风险

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
| --- | --- | --- | --- |
| RISK-001 | 把 L2 分析建议误当成用户已确认方向 | 方向错误导致后续全部返工；已用 §0.1 分层与 FND-002 处置 | make-decision（已处置） |
| RISK-002 | 本任务自身重演"小决策演变成一揽子机制重构" | 再次长耗时与范围蔓延，正是本任务要治的病 | D-019 / build-plan |
| RISK-003 | 改动质量事实的"当前性"语义影响既有任务状态显示 | 旧任务状态观感变化或被误解为历史被改写 | D-001 + T-003（不回溯）；build-code |
| RISK-004 | 公共行为契约或七类公共入口被无意改变 | 违反宪法与 vNext 边界 | 验收阶段用公共行为基线与结构守卫证明不变 |
| RISK-005 | 反思页生成器消费阶段与质量事实；本任务改变事实形状可能间接破坏该消费者 | 反思页失真或报错，且 `non_ui` 不会被 UI 设计检查兜住 | build-plan / build-code 显式列为兼容约束；不涉及则记 `not_applicable` |
| RISK-006 | 跨仓改动不进入本任务快照、任务追踪与收口，缺少本任务监督下的独立审查与验收 | 该仓 provenance 与质量证据不在本任务内，审计无法从本任务回答"谁改的、验收过没有" | D-006；由 R-032 交付物承载；该仓提交/推送仍需用户显式授权；缺口如实登记 |
| RISK-007 | 阶段/phase 审查不再比较代码快照后，可能出现"旧审查被读作当前阶段审查" | 若有消费者据此声称"当前代码已审查"，构成夸大声明 | D-004（范围化记录与显示）+ D-003（终局由 verify-code 绑当前快照兜底） |
| RISK-008 | 把"已确认决定的收口"误做成"重新设计" | 重新发明方向、扩大范围 | D-019（每条改动必须对应既有决定编号或新决定） |
| RISK-009 | 删除轮次预算后失去自动限流，重复派发风险上升 | 若去重替代物未先落地，会出现重复的对外调用与 token 浪费 | D-002（先落地 `review_result_ref` 去重替代物再删预算）；build-plan 顺序约束 |
| RISK-010 | "有效窗口"取值不当 | 过短会漏掉有价值的迟到结果；过长等于把等待换个形式 | D-009；spec 冻结取值并给出理由 |

## 风险与延期交接

- 交接给 build-plan：RISK-005（反思页消费者兼容）、RISK-009（去重替代物先落地）、RISK-010（有效窗口取值）、RISK-002/D-019（范围纪律）。
- 交接给 build-code：跨仓改动面清单与验收缺口（RISK-006 / OPEN-006）、R-032 交付物的路径与命名。
- 交接给 verify-code：D-003 的终局快照门槛是唯一保留的代码身份门槛，必须验证其真实生效。
- 延期项（7 条）不进入本任务的 phase 计划，全部进入 R-032 交付物：R-013、R-016、R-019、R-021、R-024、R-026、R-028/R-029。

## 未决项

| item_id | 未决内容 | 原因 | 谁在何时解决 |
| --- | --- | --- | --- |
| OPEN-001 | ~~任务类型未声明~~ 已解决 | T-001 已声明为 `普通任务` | 已关闭 |
| OPEN-002 | ~~本任务具体条目清单~~ 已解决 | Round 2 定稿 + Grill 校正（D-002 由"改发放单位"纠正为"删除"） | 已关闭 |
| OPEN-003 | ~~L2 建议中哪些已在主干修复~~ 已解决 | F-001~F-004 逐条复核，修正 5 处偏差并新增 2 处"既有决定未实现" | 已关闭 |
| OPEN-004 | ~~巨人文件收窄是否并入本任务~~ 已解决 | T-002 移出，进入 R-032 交付物 | 已关闭 |
| OPEN-005 | 各条目的具体方案形态（改哪个行为、保留哪条守卫、如何退休竞争输入） | 属 spec 层细节，本阶段只定方向与边界 | build-spec；D 条目已给方向与验收 |
| OPEN-006 | 跨仓改动的验收方式与该仓提交/推送授权 | 该仓不进入本任务收口（R-033） | 用户；build-code / verify-code 阶段 |
| OPEN-007 | 阶段/phase 审查事实"来源范围"的具体呈现文案与消费者清单 | 由 D-004 引入，消费面尚未定义 | build-spec；由 D-004 与 RISK-007 约束 |

## Supersedes

- 取代 ADR-0028 的"正式审查预算"条款（D-002，按 P-D-010 删除预算；须以修订 ADR 收口）。
- 取代"非终态分组结果不得包含部分成员"的传输约束（D-008，改为达标即产出）。
- 取代"调用方直接提交输出验收覆盖"与"运行器从宿主包猜测覆盖"两条写入路径（D-012，收敛为单一写入者）。
- 不取代 ADR-0017：D-001 是让实现回到 ADR-0017 已规定的语义。

## 文档结果

- CONTEXT.md：**no-change**。本任务的决定使用的都是仓库既有领域概念（审查、材料、工作树身份、验收证据）；"来源范围""有效窗口""达标即产出"属实现层词汇，按 CONTEXT.md 的收录边界不入领域术语表。
- ADR：**需要修订 ADR-0028**（`docs/adr/0028-plan-slicing-and-review-budget.md`）的"正式审查预算与导入"条款——该 ADR 把 `validateReviewBudget` 定为唯一 owner，与本任务按 P-D-010 删除预算的决定冲突；按 ADR-0028 自身的替代条件，以 `review_result_ref` 去重替代物作为"经审查的替代"并同步修订 ADR。其余决定**无需新 ADR**：ADR-0017 已规定 freshness/currentness 失效链不得作为控制面，本任务只是让实现回到该 ADR。
- ADR 三项判据：①难以反转 = **真**（删除失效链并改变外部审查契约后回退成本高）；②无背景会意外 = **真**（"审查不因材料改动失效"对后来读者反直觉）；③存在真实取舍 = **真**（安全 vs 返工）。三项均真，但已有 ADR-0017/0029/0030 覆盖同一方向，因此只做 ADR-0028 的修订，不新开 ADR。
- 术语/ADR 冲突及处理：**已发现两处冲突并处置**——(1) 当前实现与 ADR-0017 冲突（实现侧须收口）；(2) P-D-010 与 ADR-0028 冲突（须修订 ADR-0028，见上）。
- 不复制 spec 的边界：本记录只写方向、取舍、风险与非目标；行为细节、接口、字段与验收细则留给 build-spec。

## Exit checks

- 上下文一致：**pass**。§原始需求 每条 R 均有处置；六个框架节点与六类固定类别均有 OI 覆盖；决定区每条 D 均可追溯到既有决定或本任务真实答复。
- owner/接口一致：**pass**。D-002 与 D-012 的写入者/替代物、D-006 的跨仓边界、D-011 的逃生口均写明 owner 与消费者。
- 失败语义明确：**pass**。D-003/D-004/RISK-007 规定审查范围化与终局门槛；§成功/失败边界 与 D-020 规定 false-green 即失败。
- 范围与延期明确：**pass**。§范围 列出 A 组 12 条 + B 组 5 条 + 交付物；§非目标 与 D-019 写死 7 项延期；延期项进入 R-032 交付物。

## 质量边界

- 质量事实：方向审查已记录（red + blue 均 available、coverage satisfied，7 组 finding 已处置）；细节审查已记录（red + blue 均 available、coverage satisfied，14 组 finding 已处置，含 1 条 minor）；交互聚合中的 OI 已按真实答复进入 `confirmed` / `deferred` / `not_applicable` 终态，且最终方向已获用户确认。
- 推进资格：`work_status=ready` 只表示同任务可继续修复，不是质量通过，也不是交付许可。
- 完成判据：Talk/Grill 收敛且真实答复齐全、两轮独立审查事实齐全且每条 finding 有处置、用户显式确认、交互聚合绑定当前决策、阶段末语义检查与复盘完成。
- 不可逆授权边界：本阶段不做 commit / merge / push / cleanup；跨仓改动亦不在本阶段执行，其提交授权另需用户显式给出。

## 2. OI 大纲（唯一当前版本 v1.1 · 研究前建立；v1.1 新增 OI-28）

> 身份绑定：本表全部 OI 绑定 `task_id = workflowhub-mechanism-waste-reduction-20260915`、`outline_version = v1.1`。**版本升级说明**：v1.1 仅新增 OI-28（阶段事实发布与完成谓词在无宿主集成会话中的自足性），其余 27 条 OI 的 question/source/category 未变；按契约，版本升级使 v1 的旧消费者结果失效，故方向审查与细节审查均已在新版本上重跑。
> 状态取值只用四个合法值：`open` / `confirmed` / `deferred` / `not_applicable`。§2.3 的 YAML 记录在 `approve-decision` 组装交互聚合时统一回填终态与凭证。
> 本表是本阶段唯一权威 OI 清单；Talk、调研、审查、Grill 只更新本表，不新建第二张表。
> `question` 一律写方向层问题，不写文件路径、函数名、字段名、算法、命令形态、行号或代码片段。

### 2.1 需求框架节点覆盖

| node_id | framework_node | oi_ids | empty | reason |
| --- | --- | --- | --- | --- |
| N-background | background | OI-01 OI-02 | false | 先分清症状/根因与成本归因 |
| N-problem | problem | OI-03 OI-04 | false | 逐条复核 L2 建议并找出最大放大器 |
| N-goal | goal | OI-05 OI-06 | false | 用户已裁决成功尺子与对照基线 |
| N-solution | solution | OI-07 OI-08 OI-09 OI-10 OI-11 OI-12 OI-13 OI-14 OI-15 OI-16 OI-17 OI-28 | false | 方案面最宽，逐项有决定或明确延期 |
| N-acceptance | acceptance | OI-18 OI-19 | false | 已定可执行证据与契约不变证明 |
| N-extension | extension | OI-20 OI-21 | false | 涉及治理登记与历史只读性 |

### 2.2 六类固定类别覆盖

| category | oi_ids | empty | reason |
| --- | --- | --- | --- |
| complete_user_flow | OI-11 OI-13 OI-22 | false | 保住既有端到端流程并说明改进落点 |
| page_scope | OI-23 | false | 已由三来源证据合取判定为非 UI |
| data_state | OI-07 OI-09 OI-10 OI-12 OI-20 OI-24 | false | 多个持久事实语义已裁决或待 spec 冻结 |
| success_failure_boundary | OI-01 OI-02 OI-03 OI-04 OI-05 OI-06 OI-08 OI-18 OI-19 OI-25 OI-28 | false | 失败/不可用边界是本任务核心风险面 |
| non_goals | OI-14 OI-15 OI-16 OI-17 OI-26 | false | 已显式划出不做的事以防范围蔓延 |
| deferred | OI-21 OI-27 | false | 延期项有归属并进入 R-032 交付物 |

### 2.3 OI 记录

```yaml
ois:
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-01
    category: success_failure_boundary
    source: R-001 R-002 / V-01
    question: 三份分析材料与用户抱怨之间是什么因果关系；哪些是症状、哪些是根因、哪些互为因果？
    status: confirmed
    impact_dimensions:
      - ordinary_detail
    requires_user_decision: false
    selected_disposition: 按 L1/L2/L3/L4 四层划分症状、建议、事实与硬边界
    evidence: §0.1 来源分层 + F-001~F-004
    acceptance: 每一层都有真实来源且互不冒充
    counterexample_boundary: 若把 L2 分析建议当作 L1 用户原话即为反例
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-02
    category: success_failure_boundary
    source: R-001 / V-05 V-08 V-09 V-10
    question: 已观察到的长耗时里，多少可归因于机制返工，多少来自外部 provider 环境劣化；本任务应当对哪一部分负责？
    status: confirmed
    impact_dimensions:
      - ordinary_detail
    requires_user_decision: false
    selected_disposition: 拆成机制返工与外部环境劣化两笔账，本任务只对机制返工负责
    evidence: F-001 / T-008
    acceptance: 收益声明不把外部劣化计入
    counterexample_boundary: 若把 provider 环境劣化的时间算作本任务收益即为反例
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-03
    category: success_failure_boundary
    source: R-008 R-009 R-010 R-011 R-012 R-013 R-014 R-015 R-016 R-017 R-018 R-019 R-020 R-021 R-022 R-023 R-024 R-025 R-026 R-027 / V-03 V-08 V-09 V-10 V-12
    question: 三份材料列出的未解决项与优化建议，在当前主干上逐条还成立吗；哪些已被修复、哪些是分析本身的事实偏差？
    status: confirmed
    impact_dimensions:
      - ordinary_detail
    requires_user_decision: false
    selected_disposition: 逐条复核 L2 建议，修正 5 处偏差并新增 2 处既有决定未实现
    evidence: V-03 V-08 V-09 V-10 V-12~V-16
    acceptance: 每条 L2 建议都有成立/不成立/偏差的结论
    counterexample_boundary: 若仍有 L2 建议被直接采纳而未复核即为反例
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-04
    category: success_failure_boundary
    source: R-020 R-022 R-023 R-024 R-027
    question: 耗时与 token 浪费最大的单项放大器是哪一个；先修它是否就能拿到大部分收益？
    status: confirmed
    impact_dimensions:
      - ordinary_detail
    requires_user_decision: false
    selected_disposition: 最大放大器 = 额度按材料版本发放导致重置与重新派发
    evidence: F-002
    acceptance: 返工引擎有唯一定位且被 D-001/D-002 覆盖
    counterexample_boundary: 若修完仍存在材料一改即重新派发即为反例
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-05
    category: success_failure_boundary
    source: R-001 R-003
    question: 本任务的显式成功尺子用哪一把——端到端时长、返工轮次、token 消耗，还是人工介入次数？
    status: confirmed
    impact_dimensions:
      - acceptance
    requires_user_decision: true
    visible_group_id: G-RV
    selected_disposition: 以可证伪行为断言为成功尺子
    evidence: D-020 / T-008
    acceptance: 断言可执行且不自证
    counterexample_boundary: 若验收只比主观耗时即为反例
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-06
    category: success_failure_boundary
    source: R-001 R-008 R-009
    question: 是否需要可复算的前后对比基线；用哪一次真实运行作为对照，才不算自证？
    status: confirmed
    impact_dimensions:
      - acceptance
    requires_user_decision: true
    visible_group_id: G-RV
    selected_disposition: 用 t3 真实计数作对照，不新跑真实任务
    evidence: D-020 / F-002
    acceptance: 对照引用真实历史计数
    counterexample_boundary: 若为验收新跑一次真实任务即为反例
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-07
    category: data_state
    source: R-008 / V-02 V-03 V-12 V-13
    question: 评审的有效性绑定应当怎样与材料版本解耦，才能在真实修复后不重复整轮评审，同时不制造假绿？
    status: confirmed
    impact_dimensions:
      - scope
    requires_user_decision: true
    visible_group_id: G-RV
    selected_disposition: 全删当前性比较，身份字段保留为来源
    evidence: D-001 / P-Q17 / P-D-009① / ADR-0017
    acceptance: 材料字节变化不翻转审查事实
    counterexample_boundary: 若任一材料改动触发失效或重跑即为反例
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-08
    category: success_failure_boundary
    source: R-009 / V-05
    question: 外部 provider 失败与慢成员应当如何熔断与收敛；达标即先返回是否可接受？
    status: confirmed
    impact_dimensions:
      - scope
    requires_user_decision: true
    visible_group_id: G-CR
    selected_disposition: 先补终止/判死原语，再改达标即产出契约
    evidence: D-007~D-010 / P-D-030①
    acceptance: 原语先行且策略有作用对象
    counterexample_boundary: 若在无终止能力时先写策略即为反例
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-09
    category: data_state
    source: R-010 / V-04 V-14
    question: 评审额度应当以什么为单位发放，才不会再出现靠改材料换额度、额度耗尽即停摆？
    status: confirmed
    impact_dimensions:
      - scope
    requires_user_decision: true
    visible_group_id: G-RV
    selected_disposition: 按 P-D-010 删除额度机制，不重设计发放单位
    evidence: D-002 / P-D-010 / ADR-0028
    acceptance: 预算消费点为零且替代物先落地
    counterexample_boundary: 若保留额度仅换发放单位即为反例
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-10
    category: data_state
    source: R-011 / V-08
    question: 派发期间来源发生变化时，已完成的 provider 结果应当保留、降级还是作废？
    status: confirmed
    impact_dimensions:
      - ordinary_detail
    requires_user_decision: false
    selected_disposition: 来源漂移时保留并可用已完成的 provider 结果
    evidence: D-005 / V-08
    acceptance: 结果不丢弃、不整轮降级
    counterexample_boundary: 若漂移导致已完成结果不可用即为反例
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-11
    category: complete_user_flow
    source: R-022 / V-07
    question: 工作树与任务身份应当在什么入口被强制核对，才能消除同一任务两套真相？
    status: confirmed
    impact_dimensions:
      - scope
    requires_user_decision: true
    visible_group_id: G-WI
    selected_disposition: 只对写命令强制工作树身份 + 窄逃生口 + harness 迁移
    evidence: D-011 / T-007 / F-003
    acceptance: 非认证工作树的写命令 fail-loud，只读与首次 make-decision 放行
    counterexample_boundary: 若逃生口被放宽到写命令即为反例
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-12
    category: data_state
    source: R-023 / V-16
    question: 逐条验收证据应当由谁一次性生成并绑定，才能不再出现覆盖与测试快照互相漂移？
    status: confirmed
    impact_dimensions:
      - scope
    requires_user_decision: true
    visible_group_id: G-AE
    selected_disposition: 官方处理器为唯一写入者，同批退休竞争输入
    evidence: D-012 / F-004
    acceptance: 只剩一条写入路径且三种表示可区分
    counterexample_boundary: 若仍存在两条以上写入路径即为反例
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-13
    category: complete_user_flow
    source: R-024
    question: 非行为型小改动是否需要更轻的执行路径；若需要，本任务做还是另立任务？
    status: deferred
    impact_dimensions:
      - scope
    requires_user_decision: true
    visible_group_id: G-SC
    selected_disposition: "延期：非行为型轻量协议路径不在本任务，转入 R-032 交付物由下一轮立项"
    owner: 下一轮任务（由 R-032 交付物立项）
    trigger_condition: 本任务 close 且 R-032 交付物产出后
    scope_boundary: 非行为型小改动的轻量执行路径
    impact: 小改动仍按完整协议执行，耗时偏高
    follow_up_acceptance: 轻量路径在同一材料与快照身份下完成且不降低证据要求
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-14
    category: non_goals
    source: R-012 R-014 R-015 R-017 R-018 R-019
    question: 记录层与收口类小修是否纳入本任务，还是登记为延期项？
    status: confirmed
    impact_dimensions:
      - scope
    requires_user_decision: true
    visible_group_id: G-SC
    selected_disposition: B 组 5 条记录层与收口小修全部纳入
    evidence: D-013~D-017 / T-006
    acceptance: 五条各有真实命令与退出码证据
    counterexample_boundary: 若任一条无证据或仍靠人工补漏即为反例
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-15
    category: non_goals
    source: R-028 R-029
    question: 既有巨人文件的主体级收窄是并入本任务，还是按原提案另立任务？
    status: deferred
    impact_dimensions:
      - scope
    requires_user_decision: true
    visible_group_id: G-SC
    selected_disposition: "延期：既有巨人文件的主体级收窄移出本任务，转入 R-032 交付物由下一轮立项"
    owner: 下一轮任务（由 R-032 交付物立项）
    trigger_condition: 本任务 close 且 R-032 交付物产出后
    scope_boundary: 既有巨人文件的主体级收窄与净减目标
    impact: 可维护性痛点延续，维护成本不降
    follow_up_acceptance: 给出的净减目标可复算且公共行为契约不变
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-16
    category: non_goals
    source: R-013 R-015 R-026 / V-09 V-10
    question: 计划材料瘦身、生成式登记表拆分与超长端到端套件的执行上限，是否纳入本任务？
    status: confirmed
    impact_dimensions:
      - scope
    requires_user_decision: true
    visible_group_id: G-SC
    selected_disposition: 仅超长端到端套件执行方式纳入；计划材料瘦身与生成表拆分延期
    evidence: D-017 / V-09 / V-10
    acceptance: 套件真实状态可见；瘦身项进入 R-032
    counterexample_boundary: 若继续用超时冒充失败或通过即为反例
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-17
    category: non_goals
    source: R-027
    question: 本任务自身要遵守什么边界纪律，才能不重演小决策演变成一揽子机制重构？
    status: confirmed
    impact_dimensions:
      - scope
    requires_user_decision: true
    visible_group_id: G-SC
    selected_disposition: 每条改动必须对应既有决定编号或本任务新决定
    evidence: D-019 / R-027
    acceptance: 计划与 diff 中无无编号改动、无延期回流
    counterexample_boundary: 若出现无编号改动或延期项回流即为反例
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-18
    category: success_failure_boundary
    source: R-001 R-003 / R-031
    question: 用什么可执行证据证明改进真的生效，以及如何避免只证明文档存在？
    status: confirmed
    impact_dimensions:
      - acceptance
    requires_user_decision: true
    visible_group_id: G-AC
    selected_disposition: 证据 = 可证伪断言 + t3 对照计数 + 现有守卫
    evidence: D-020 / §证据矩阵
    acceptance: 证据不可得时记为失败或不可用，不得记为通过
    counterexample_boundary: 若证据不可得却记为通过即为反例
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-19
    category: success_failure_boundary
    source: R-030 R-031
    question: 如何证明公共行为契约与既定公共入口没有改变，且不靠无范围全量回归？
    status: confirmed
    impact_dimensions:
      - acceptance
    requires_user_decision: true
    visible_group_id: G-AC
    selected_disposition: 用公共行为基线与结构/路径守卫证明契约不变
    evidence: D-020 / R-031
    acceptance: 守卫不劣化且宪法条目数仍 22
    counterexample_boundary: 若以无范围全量回归代替定向证据即为反例
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-20
    category: data_state
    source: R-030
    question: 本任务是否触碰宪法条目、控制面登记与目录登记；是否需要新增或删除持久对象？
    status: confirmed
    impact_dimensions:
      - ordinary_detail
    requires_user_decision: false
    selected_disposition: 需修订 ADR-0028 预算条款；不新增持久对象；退休消费点须登记
    evidence: D-002 / §文档结果
    acceptance: ADR 修订有文档 diff；无未登记控制面
    counterexample_boundary: 若新增控制面而未登记唯一消费者与删除条件即为反例
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-21
    category: deferred
    source: R-030 / V-02 V-03
    question: 对已归档旧任务及其事实，新规则是否回溯重判；只读性如何保持？
    status: confirmed
    impact_dimensions:
      - ordinary_detail
    requires_user_decision: false
    selected_disposition: 不回溯重判；旧记录只读保留
    evidence: T-003 / ADR-0017
    acceptance: 旧任务事实字节不变且仍可读
    counterexample_boundary: 若任何旧记录字节被改写即为反例
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-22
    category: complete_user_flow
    source: R-003 R-005
    question: 本任务要保住的完整用户流程是什么，改进点分别落在流程的哪一步？
    status: confirmed
    impact_dimensions:
      - goal
    requires_user_decision: true
    visible_group_id: G-AC
    selected_disposition: 端到端流程保持：建工作树 → 五阶段 → 评审 → 收口；改进落在评审复用与额度、写身份、验收证据、收口步骤
    evidence: D-001~D-019 / T-002
    acceptance: 流程各步仍可完成且公共入口不变
    counterexample_boundary: 若任一步因本改动不可完成即为反例
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-23
    category: page_scope
    source: R-005 / UI applicability
    question: 本任务是否触及页面或前端；命令与状态输出算不算页面范围？
    status: confirmed
    impact_dimensions:
      - ordinary_detail
    requires_user_decision: false
    selected_disposition: non_ui：三来源证据合取，非用户点名降级
    evidence: D-021 / §UI applicability
    acceptance: 运行时派生结果与记录一致
    counterexample_boundary: 若运行时派生结果与本记录不一致（派生为界面相关或未定）即为反例
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-24
    category: data_state
    source: R-005 R-020 R-023
    question: 哪些持久事实的字段或语义会变化，旧数据如何继续可读？
    status: confirmed
    impact_dimensions:
      - ordinary_detail
    requires_user_decision: false
    selected_disposition: 材料与快照字段保留但不再作失效触发器；预算机制删除；验收覆盖收敛为单写入者；旧记录只读
    evidence: D-001 / D-002 / D-012
    acceptance: 字段语义变化有记录且旧数据可读
    counterexample_boundary: 若删除身份字段或改写旧记录即为反例
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-25
    category: success_failure_boundary
    source: R-005 R-021 / V-02
    question: 失败、不可用与来源漂移如何划分边界；哪些必须响亮失败，哪些只能是披露而不能当门？
    status: confirmed
    impact_dimensions:
      - acceptance
    requires_user_decision: true
    visible_group_id: G-RV
    selected_disposition: 审查按来源范围记录；verify-code 终局绑当前快照；不得把未覆盖说成通过
    evidence: D-003 / D-004 / RISK-007
    acceptance: 终局通过必对应当前代码快照
    counterexample_boundary: 若终局通过可对应非当前快照即为反例
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-26
    category: non_goals
    source: R-005 R-030
    question: 明确不做的清单是什么？
    status: confirmed
    impact_dimensions:
      - scope
    requires_user_decision: true
    visible_group_id: G-SC
    selected_disposition: 非目标清单定稿（含 7 项明确延期）
    evidence: §非目标 / T-006
    acceptance: 清单写死且延期项进入 R-032
    counterexample_boundary: 若出现清单外扩张即为反例
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-27
    category: deferred
    source: R-005 R-032
    question: 明确延期的清单是什么；各自 owner、触发条件与关闭判据是什么？
    status: confirmed
    impact_dimensions:
      - scope
    requires_user_decision: true
    visible_group_id: G-SC
    selected_disposition: 7 项延期全部进入 R-032 交付物，owner 与触发条件明确
    evidence: D-018 / §风险 / §未决项
    acceptance: 每条延期项各出现一次且含背景/问题/证据
    counterexample_boundary: 若延期项只在 decision-log 里而无独立交付物即为反例
  - task_id: workflowhub-mechanism-waste-reduction-20260915
    outline_version: v1.1
    oi_id: OI-28
    category: success_failure_boundary
    source: R-034 R-035 R-036 / F-005
    question: "在没有任何外部宿主集成的普通本地会话里，阶段完成谓词与阶段事实发布应当怎样才能不永久落空，同时又不把落空伪装成通过？"
    status: confirmed
    impact_dimensions:
      - scope
    requires_user_decision: true
    visible_group_id: G-SC
    selected_disposition: "官方路径自足：当前 WorkflowHub 会话直接执行阶段并发布当前质量事实、阶段行、reflection 与 handoff；不要求外部 Stage Agent、bridge、session 或 stage outcome。缺少质量事实只如实披露 unknown/unavailable/incomplete；旧 outcome/bridge 只读兼容。"
    evidence: "F-005、F-006 / 本任务对主干的第一手核验"
    acceptance: "认证任务 worktree 中直接运行 public stage-runtime，无 receipts.stage_outcomes 也能发布 stage_end_recorded/exit 0；当前 session 可直接发布非门禁 reflection，完成谓词不再出现无根因的永久落空"
    counterexample_boundary: "若无外部 outcome 时成功 handler 仍被写成失败、恢复建议仍要求先补外部 Stage Agent/bridge，或质量缺口被改写为通过，即为反例"

```

### 2.4 收敛进展（导航用，非 OI 权威）

| oi_id | 当前收敛情况 | 答复来源 |
| --- | --- | --- |
| OI-01 | 已收敛：因果关系分层完成 | §0.1 / F-001~F-004 |
| OI-02 | 已收敛：归因拆成"机制返工"与"外部环境劣化"，本任务只对机制返工负责 | T-008 / RISK-006 |
| OI-03 | 已收敛：独立调研逐条复核，修正 5 处偏差并新增 2 处"既有决定未实现" | V-12 V-13 V-14 V-15 V-16 / F-001~F-004 |
| OI-04 | 已收敛：最大放大器 = 额度按材料版本发放导致的重置与重新派发 | F-002 |
| OI-05 | 已定：可证伪行为断言为主尺子 | D-020 / T-008 |
| OI-06 | 已定：用 t3 真实计数作 before，不新跑真实任务 | D-020 / T-008 |
| OI-07 | 已定：全删当前性比较，字段保留为 provenance | D-001 / T-005 |
| OI-08 | 已定：先补终止原语，再改"达标即产出"契约，并定义迟到与完备性语义 | D-007~D-010 |
| OI-09 | 已定：按 P-D-010 删除额度机制，不重设计发放单位 | D-002 / G-001 |
| OI-10 | 已定：保留并可用，不再整轮降级 | D-005 |
| OI-11 | 已定：只对写命令强制 + 窄逃生口 + harness 迁移 | D-011 / T-007 |
| OI-12 | 已定：官方处理器唯一写入者，同批退休竞争输入 | D-012 |
| OI-13 | 已定延期：轻量协议路径不纳入本任务 | T-006 |
| OI-14 | 已定在范围：B 组 5 条 | T-006 |
| OI-15 | 已定：移出本任务，进入 R-032 交付物 | T-002 / T-006 |
| OI-16 | 已定：仅超长套件执行方式在范围，其余延期 | D-017 / T-006 |
| OI-17 | 已收敛：边界纪律 = 每条改动对应既有决定编号或新决定 | D-019 |
| OI-18 | 已定：可证伪断言 + t3 计数 + 现有守卫 | D-020 |
| OI-19 | 已定：公共行为基线与结构/路径守卫，不做无范围全量回归 | D-020 / R-031 |
| OI-20 | 待 spec 冻结：控制面/目录登记与持久对象增减（ADR-0028 修订已确定） | D-002 / §文档结果 |
| OI-28 | 已定：官方路径自足（当前会话直接发布聚合/阶段事实/reflection/handoff + 可区分诊断 + handoff 不适用收口）；旧 outcome/bridge 只读兼容，不是 active 前置 | D-022~D-026 |
| OI-21 | 已定：不回溯重判；旧记录只读 | T-003 |
| OI-22 | 已收敛：端到端流程 = 建工作树 → 五阶段 → 评审 → 收口；改进点分别落在评审复用与额度、写身份、验收证据、收口步骤、阶段事实发布 | D-001~D-025 |
| OI-23 | 已定：`non_ui`（三来源证据合取） | D-021 / T-010 |
| OI-24 | 待 spec 冻结：变化的事实字段与旧数据可读性 | D-001 / D-012 |
| OI-25 | 已定：审查按来源范围记录；verify-code 终局绑当前快照；不得把未覆盖说成通过 | D-003 / D-004 |
| OI-26 | 已定：见 §非目标（7 项延期） | T-006 |
| OI-27 | 已定：7 项延期进入 R-032 交付物；owner 与触发条件见 §风险 与 §未决项 | D-018 |
