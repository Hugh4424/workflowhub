# Decision Log — workflowhub-thin-core-card-06-20260919

- 任务：Card-06「薄核心删除与窄工具保留」（PRD 十卡拓扑 Group 2 先行串行卡）
- Cohort：post ｜ 认证 worktree：`workflowhub-workflowhub-thin-core-card-06-20260919` ｜ 分支：`task/workflowhub/workflowhub-thin-core-card-06-20260919`
- 权威来源：`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md`（CARD-06 全文 + AC-27~32/52/53）与 `decision-log.md`（OI-003/006/012/013、L662-668、G-3 L857、L694 重访条款）
- 本文档 append-only；更正见末节。

## 任务身份

- **任务类型**：普通任务

`readTaskTypeFromDecisionLog` 校验：单一声明、受控值，通过（见 step 1 提交记录）。

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 | 按标准 WorkflowHub 开始 Card-06：先建 worktree，从 make-decision 开始，不跳阶段；梳理大纲/扩散/方案/验收；Talk/Grill 大白话；主会话只做规划、派发、交互 | V-001（U-001） | covered（ADR-001~009） |
| R-002 | 派子代理调研 4 个 codex 历史会话，找问题与对本任务的帮助 | V-001（U-002） | covered（ADR-009 调研节 F-001~F-009） |
| R-003 | 开工节奏：make-decision/build-plan 先行，build-code 前完成 Card-03 并合并 | V-002（U-003） | covered（ADR-001） |
| R-004 | 流程边界纠正：本会话严格执行 make-decision 流程；build-plan 是其他会话的任务，不归本会话 | V-014（U-004） | covered（ADR-008） |

## 需求变更记录

### U-001 — 启动 Card-06 的方式

> 我准备开始 Card-06任务了。card-01至07都完成了，只有card-03正在开发中即将结束。需要你同时仔细阅读这个任务相关的原始需求……看看当前任务的注意事项和实现方向是什么。按标准 WorkflowHub 开始这个改进任务，先创建worktree，然后从 make-decision 开始，不要跳阶段。先基于原始需求，在make-decision的过程中和我一起仔细梳理完整需求大纲和细节、扩散想法、实现方案、验收标准，Talk 和grill请用大白话说明选项、后果和风险。注意主会话只进行任务规划、子代理任务派发和交互类技能的执行，不要进行大量阅读和执行任务，保证主会话上下文控制和执行质量。

- 来源：用户本会话首条消息（2026-09-30）
- 变更与处置：新增；全量 D 的依据

### U-002 — 调研历史执行会话

> 你可以先派出多个子代理仔细调研这些会话，都是workflowhub的执行会话，看看有什么问题？对当前任务有什么帮助：[4 个 codex rollout 路径]

- 来源：用户本会话首条消息（2026-09-30）
- 变更与处置：新增；落实为 6 个调研子代理（F-003~F-008）

### U-003 — 开工节奏

> 现在就开工，先做make-decision和build-plan，我会在build-code之前把card-03完成并合并进当前分支的

- 来源：ask_user_question T-001 批真实回复（2026-09-30）
- 变更与处置：新增 → D-001；后由 U-004 修正（build-plan 部分移出本会话）

### U-004 — 流程边界纠正

> 你完全没有按照make-decision的流程严格执行，遗漏了太多步骤和技能！另外，我没让你执行build-plan，那是我在其他会话要进行的任务！请重新调整todo list！

- 来源：用户消息（2026-09-30）
- 变更与处置：修改 U-003 中 build-plan 归属；新增 D-008（本会话边界 = make-decision 十三步，build-plan 移交）

## 原始需求索引

| R 编号 | U/V 原文锚点 | 决策 | 落点 |
| --- | --- | --- | --- |
| R-001 | U-001、V-001 | D-001 | 启动方式总纲：make-decision 十三步 + worktree；其余 ADR 均派生 |
| R-002 | U-002、V-001 | D-009 | 调研节 F-001~F-009；教训转化进 ADR-007 |
| R-003 | U-003、V-002 | D-001 | ADR-001 开工节奏 |
| R-004 | U-004、V-014 | D-008 | ADR-008 会话边界 |
| R-005 | V-004、V-010 | D-004 | ADR-004 删除策略与八批顺序 |
| R-006 | V-006、V-009 | D-002 | ADR-002 删除范围（pre 退役） |
| R-007 | V-007 | D-003 | ADR-003 窄工具落点 |
| R-008 | V-011 | D-005 | ADR-005 执行弹性 |
| R-009 | V-005、V-008 | D-007 | ADR-007 约法三章 |
| R-010 | V-003、V-012 | D-001 | OI-011→ADR-001 红线：dirty 处置与 Card-03 合并跟进 |
| R-011 | V-013 | D-008 | 任务身份节：普通任务 |

## 逐字声明层（verbatim）

| V 编号 | 说话人 | 上下文/来源 | 逐字文本 |
| --- | --- | --- | --- |
| V-001 | 用户 | 本会话首条消息 2026-09-30 | "我准备开始 Card-06任务了。card-01至07都完成了，只有card-03正在开发中即将结束。需要你同时仔细阅读这个任务相关的原始需求……按标准 WorkflowHub 开始这个改进任务，先创建worktree，然后从 make-decision 开始，不要跳阶段。先基于原始需求，在make-decision的过程中和我一起仔细梳理完整需求大纲和细节、扩散想法、实现方案、验收标准，Talk 和grill请用大白话说明选项、后果和风险。注意主会话只进行任务规划、子代理任务派发和交互类技能的执行，不要进行大量阅读和执行任务，保证主会话上下文控制和执行质量。" |
| V-002 | 用户 | ask_user_question T-001·prereq 回复 2026-09-30 | "现在就开工，先做make-decision和build-plan，我会在build-code之前把card-03完成并合并进当前分支的" |
| V-003 | 用户 | T-001·dirty-main 回复 | "我先派子代理查它的来历再定" |
| V-004 | 用户 | T-001·delete-strategy 回复 | "方案 B：按七类面逐批删除" |
| V-005 | 用户 | T-001·verify-budget 回复 | "开工就约法三章（推荐）" |
| V-006 | 用户 | T-002·dual-cohort 回复 | "pre 的旧机制也要一起删" |
| V-007 | 用户 | T-002·narrow-tools 回复 | "A：runtime/ 瘦身为纯工具模块（推荐）" |
| V-008 | 用户 | T-002·ground-rules 回复 | "7 条全部确认（推荐）" |
| V-009 | 用户 | T-003·pre-delete-confirm 回复 | "确认：pre 整体退役，只读归档（推荐）" |
| V-010 | 用户 | T-004·batch-order 回复 | "确认：8 批顺序照此执行（推荐）" |
| V-011 | 用户 | T-004·exec-flex 回复 | "三个细节全确认（推荐）" |
| V-012 | 用户 | T-005·orphan-change 回复 | "直接还原（推荐）" |
| V-013 | 用户 | T-006·task-type 回复 | "普通任务（推荐）" |
| V-014 | 用户 | 用户消息 2026-09-30 | "你完全没有按照make-decision的流程严格执行，遗漏了太多步骤和技能！另外，我没让你执行build-plan，那是我在其他会话要进行的任务！请重新调整todo list！" |

## 原始声明层

- 母 cohort 原始八点需求与 U-010 三点：见 `specs/workflowhub-thin-core-rebuild-planning-20260919/decision-log.md` L46-57、L113-115（OI/SD/R 体系唯一权威，本文档不复制原文，只按 ID 引用）
- Card-06 直接来源条款：OI-003（L235-254）、OI-006（L297-316）、OI-012（L420-437）、OI-013（L439-458）、保留工具删除职责节（L662-668）、Grill G-3（L857）、最小 runtime 重访条款（L694）
- 阶段事实：本会话 ask_user_question 六批（T-001~T-006）真实回复为本文件唯一交互凭证来源

## 三级追溯链

`原始用户故事/初始需求（U/V）→ 原始需求或调研（R/F）→ ADR（D-006-xxx）`

### 需求框架

- **framework**：`functional`（背景→问题→目标→方案→验收→扩展）
- **选择理由**：Card-06 是工程实施卡（删除+保留），非证据裁决型研究；混合点（删前删后对比证据）以事实节点挂在 problem/solution 下，不另建 research 树
- **回填规则**：调研/Talk/审查/Grill 只扩展已有节点

| node_id | 节点 | status | evidence_status | evidence_owner | next_review_trigger |
| --- | --- | --- | --- | --- | --- |
| N-001 | 背景 | confirmed | confirmed | make-decision | — |
| N-002 | 问题 | confirmed | confirmed | make-decision | — |
| N-003 | 目标 | confirmed | confirmed | make-decision | — |
| N-004 | 方案 | confirmed | confirmed | make-decision | build-plan 核查可能触发补记 |
| N-005 | 验收 | confirmed | confirmed | make-decision | verify-code |
| N-006 | 扩展 | confirmed | confirmed | make-decision | Card-08/09 协调 |

### 唯一 OI 大纲（current authority）

outline_version：v1

#### Framework nodes

| node_id | framework_node | oi_ids | empty | reason |
| --- | --- | --- | --- | --- |
| N-background | background | OI-001 | false | |
| N-problem | problem | OI-002 | false | |
| N-goal | goal | OI-003 | false | |
| N-solution | solution | OI-004、OI-005、OI-006、OI-007、OI-008、OI-009、OI-010、OI-011 | false | |
| N-acceptance | acceptance | OI-012 | false | |
| N-extension | extension | OI-013、OI-017 | false | |

#### Fixed categories

| category | oi_ids | empty | reason |
| --- | --- | --- | --- |
| complete_user_flow | OI-014 | false | |
| page_scope | — | true | 非 UI 任务：Card-06 不动任何页面/前端；三输入（原始需求/仓库清单/变更面）均无 UI 信号 |
| data_state | OI-015 | false | |
| success_failure_boundary | OI-016 | false | |
| non_goals | OI-018 | false | |
| deferred | OI-017 | false | |

#### OI records

```yaml
  - task_id: workflowhub-thin-core-card-06-20260919
    outline_version: v1
    oi_id: OI-001
    category: complete_user_flow
    source: R-001/母decision-log
    question: Card-06 在十卡拓扑中的位置与前置是什么
    status: confirmed
    selected_disposition: Group 2 先行串行卡；实现依赖 01/02/03/04/05/07 就位（03 收尾中）
    evidence: 母 PRD L112 起 CARD-06 全文 + 拓扑图
    acceptance: Card-06 在 Group 2 串行就位，前置卡齐
    counterexample: 若 PRD 拓扑非 10 卡或 Group 划分不同即错
    impact_dimensions: [goal]
    requires_user_decision: true
    visible_group_id: T-001
  - task_id: workflowhub-thin-core-card-06-20260919
    outline_version: v1
    oi_id: OI-002
    category: success_failure_boundary
    source: R-001/母R-018/R-019
    question: 要删的机器保安具体是哪些职责
    status: confirmed
    selected_disposition: stage completion 通用认证、kernel/fact graph 强制依赖、多层 evidence 包装、plan/tasks 双写、固定 Talk 轮次、强制 handoff/不变路线重选、全部校验机器（revision 绑定/快照树/材料身份哈希/回执）+ 只保护流程形状的测试
    evidence: 母 OI-012/OI-013 resolution 逐字 + F-007 校验机器清单（11 组文件级定位）
    acceptance: 删除面覆盖母 PRD 点名的全部八项职责 + OI-013 五类校验机器
    counterexample: 任一被点名职责未出现在删除面即漏
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: T-001
  - task_id: workflowhub-thin-core-card-06-20260919
    outline_version: v1
    oi_id: OI-003
    category: data_state
    source: 母OI-006/OI-012/OI-013
    question: 删完后留下什么
    status: confirmed
    selected_disposition: 两道人为门 + 5 窄工具（工作区核对/命令采集/安全写入/Git 授权/冲突中断保护）+ 可搬运技能 + 真实命令证据/原子写/失败事实/历史只读
    evidence: 母 OI-006 resolution L303 + SD-04；F-007 五工具现行实现定位
    acceptance: 保留集与母决策逐条对应
    counterexample: 任一保留项被误删或任一删除项被保留即错
    impact_dimensions: [goal]
    requires_user_decision: true
    visible_group_id: T-002
  - task_id: workflowhub-thin-core-card-06-20260919
    outline_version: v1
    oi_id: OI-004
    category: complete_user_flow
    source: V-002
    question: 开工节奏
    status: confirmed
    selected_disposition: make-decision 现在执行；build-code 待 Card-03 完成并合并；build-plan 移交其他会话（ADR-001/008）
    evidence: V-002 原文 + U-004 纠正
    acceptance: 本卡材料先行、实施窗口后移；Card-03 合并带 26786b61
    counterexample: build-code 在 Card-03 合并前动手即违
    impact_dimensions: [goal]
    requires_user_decision: true
    visible_group_id: T-001
  - task_id: workflowhub-thin-core-card-06-20260919
    outline_version: v1
    oi_id: OI-005
    category: success_failure_boundary
    source: V-006/V-009
    question: 删除范围（post 与 pre 的边界）
    status: confirmed
    selected_disposition: post 机器门禁全删 + pre 整体退役只读归档（ADR-002）
    evidence: V-006/V-009 两次拍板 + F-008 的 117 项归档对象清单
    acceptance: pre 机制全删、117 项只读归档、历史可查
    counterexample: pre 机制残留可执行路径或归档对象被删即错
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: T-002/T-003
  - task_id: workflowhub-thin-core-card-06-20260919
    outline_version: v1
    oi_id: OI-006
    category: data_state
    source: V-007
    question: 5 窄工具落点
    status: confirmed
    selected_disposition: runtime/ 瘦身为纯工具模块（ADR-003）
    evidence: V-007 + F-007 五工具独立性评估
    acceptance: runtime/interface/ 只留窄工具实现，其余分区清空
    counterexample: 窄工具落点另起目录或融入 skills 即违
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: T-002
  - task_id: workflowhub-thin-core-card-06-20260919
    outline_version: v1
    oi_id: OI-007
    category: complete_user_flow
    source: V-004/V-010
    question: 删除策略与批次顺序
    status: confirmed
    selected_disposition: 方案 B 八批：0 窄工具→1 测试→2 流程→3 技能→4 机制核心→5 CLI/schema→6 瘦身→7 文档（ADR-004）
    evidence: V-004/V-010 + F-007/F-008 面清单
    acceptance: 每批按序执行，批前扫描批后验证
    counterexample: 跳批或倒序执行即违
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: T-001/T-004
  - task_id: workflowhub-thin-core-card-06-20260919
    outline_version: v1
    oi_id: OI-008
    category: data_state
    source: V-011
    question: 执行弹性（补记/快照/演练）
    status: confirmed
    selected_disposition: append-only 补记+即报；每批 backup 标签；AC-29 本卡自举演练（ADR-005）
    evidence: V-011
    acceptance: 冻结后首删晚于冻结；漏网消费者补记不静默
    counterexample: 静默改冻结条目或无快照即删即违
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: T-004
  - task_id: workflowhub-thin-core-card-06-20260919
    outline_version: v1
    oi_id: OI-009
    category: success_failure_boundary
    source: V-005/V-008
    question: 执行纪律
    status: confirmed
    selected_disposition: 约法三章 7 条全生效（ADR-007）
    evidence: V-005/V-008 + F-003~F-006 四次会话教训
    acceptance: 7 条写进执行全程
    counterexample: 审查超 2 轮未停下问或收官未拍板即违
    impact_dimensions: [goal]
    requires_user_decision: true
    visible_group_id: T-001/T-002
  - task_id: workflowhub-thin-core-card-06-20260919
    outline_version: v1
    oi_id: OI-010
    category: success_failure_boundary
    source: 母G-3(L857)
    question: G-3 安全闸协议
    status: confirmed
    selected_disposition: 当场停→大白话回报→等拍板；禁止自行保留/静默回写（ADR-006）
    evidence: 母 decision-log L857 + F-007/F-008 的 16 项 G-3 候选点名
    acceptance: 每批前安全职责扫描；触发即停
    counterexample: 任何自行处置或静默回写即违
    impact_dimensions: [goal]
    requires_user_decision: true
    visible_group_id: T-002
  - task_id: workflowhub-thin-core-card-06-20260919
    outline_version: v1
    oi_id: OI-011
    category: data_state
    source: V-003/V-012
    question: main 孤儿改动处置
    status: confirmed
    selected_disposition: 直接还原（git checkout）已执行；Card-03 合并须带 26786b61（ADR-001 红线）
    evidence: F-009 调查报告 + V-012
    acceptance: main 干净；26786b61 进 main 后审查路径可修
    counterexample: 孤儿改动被提交或 26786b61 未进 main 即违
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: T-001/T-005
  - task_id: workflowhub-thin-core-card-06-20260919
    outline_version: v1
    oi_id: OI-012
    category: success_failure_boundary
    source: 母PRD AC-27~32/52/53
    question: 验收怎么执行
    status: confirmed
    selected_disposition: 8 条 AC 转本卡可执行检查项（决定区验收模块）
    evidence: 母 PRD AC 原文 + finding#16
    acceptance: 逐条有可执行形态和失败判据
    counterexample: 任一 AC 无执行形态或失败判据被放宽即错
    impact_dimensions: [acceptance]
    requires_user_decision: true
    visible_group_id: T-001
  - task_id: workflowhub-thin-core-card-06-20260919
    outline_version: v1
    oi_id: OI-013
    category: deferred
    source: 母PRD
    question: 与 Card-08/09 的幸存者协调
    status: confirmed
    selected_disposition: 回读检查（Card-08）与写入量相关文件（Card-09）为显式幸存者，删除前标记
    evidence: 母 PRD Card-06 依赖节 + F-007 current-close-projection 幸存判定
    acceptance: 幸存者清单进迁移表且批前标记
    counterexample: 幸存者被误删即违
    impact_dimensions: [ordinary_detail]
    requires_user_decision: false
  - task_id: workflowhub-thin-core-card-06-20260919
    outline_version: v1
    oi_id: OI-014
    category: complete_user_flow
    source: 母AC-29
    question: 删后日常工作流怎么走
    status: confirmed
    selected_disposition: 发起→实施→验收走四阶段无机器门禁；本卡 build-code→verify-code 自举演练
    evidence: 母 OI-012 resolution + ADR-005
    acceptance: AC-29 实跑无任何 kernel 调用点
    counterexample: 任一环节因 kernel 不存在而阻断、或因校验机器前置而卡住，即失败
    impact_dimensions: [goal]
    requires_user_decision: true
    visible_group_id: T-004
  - task_id: workflowhub-thin-core-card-06-20260919
    outline_version: v1
    oi_id: OI-015
    category: data_state
    source: F-008盘点
    question: pre 任务数据怎么处置
    status: confirmed
    selected_disposition: 外置目录 173 项中 pre 未 close 117 项只读归档不删除（经 G-004 核实全部为历史遗留记录、无活跃进行中任务）；归档时写根目录 README-ARCHIVED.md；历史材料/archive 94 条只读保留
    evidence: F-008 盘点（117 项分批清单）+ G-004 核实（find/stat：7 天活跃任务仅 post 卡 5 个+readme 1 个）
    acceptance: 归档对象完整、只读、不补造 close
    counterexample: 任一归档对象被删或继续可写即违
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: T-003
  - task_id: workflowhub-thin-core-card-06-20260919
    outline_version: v1
    oi_id: OI-016
    category: success_failure_boundary
    source: 母PRD+finding#16
    question: 成败边界
    status: confirmed
    selected_disposition: 8 条 AC 全过为成；换名复活/无快照即删/外层 resolved 覆盖快照不匹配/G-3 自行处置为败
    evidence: 母 PRD oracle 节 + finding#16
    acceptance: 成功失败判据写死、执行中不降级
    counterexample: 任一把失败事实写成通过即违
    impact_dimensions: [acceptance]
    requires_user_decision: true
    visible_group_id: T-001
  - task_id: workflowhub-thin-core-card-06-20260919
    outline_version: v1
    oi_id: OI-017
    category: deferred
    source: 母L694/Q8
    question: 什么留给后续
    status: confirmed
    selected_disposition: 具体删除文件清单归 build-plan 核查产出；最小 runtime 重访触发条件=删除后出现窄工具+真实验收无法发现的实际失败
    evidence: 母 L694 + Q8
    acceptance: make-decision 不定死清单；重访条款存活
    counterexample: 本阶段定死具体文件清单即越权
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: T-001
  - task_id: workflowhub-thin-core-card-06-20260919
    outline_version: v1
    oi_id: OI-018
    category: non_goals
    source: 母PRD
    question: 非目标
    status: confirmed
    selected_disposition: 删除清单最终定死（归 build-plan）；审查选型（Card-05）；回读检查幸存登记（Card-08）；token 统计/后台平台/UI 改动不做
    evidence: 母 PRD out-of-scope 节 + R-006/R-020
    acceptance: 非目标四条边界写死
    counterexample: 越界承接他卡职责即违
    impact_dimensions: [scope]
    requires_user_decision: true
    visible_group_id: T-001
```


## 目标

- 目标：把 WorkflowHub 的 post 机器门禁全部拆除、pre 路径整体退役，只留两道人为门 + 5 项可脱离 kernel 独立调用的窄工具 + 可搬运技能；七类面迁移表冻结后逐批删除，8 条 AC 全过。

## 验收标准

- 通过条件（可验证）：AC-27/28/29/30/31/32/52/53 全过（执行形态见决定区·验收模块）；删除后日常路径无 kernel/校验机器前置；质量事实缺失保持 incomplete 由用户拍板，不伪造通过。
- 失败条件（边界）：任一被删职责换新名复活且消费者未变；任一工具必须经 kernel；无快照即删；损失清单缺项；G-3 自行保留静默回写；wh-review/broker 换名搬进 Skill 或被当 fallback；任一把失败事实写成通过。

## 范围

- 当前范围：make-decision 十三步（本会话，ADR-008）；删除面预调查已完成（F-007/F-008）为 build-plan 输入。
- 用户流程/结果只记索引和验收影响，细节进入 spec（build-plan 会话）。
- 模糊度判定：需求不模糊——Card-06 有母 PRD 全文 + 8 条 AC + 母 decision-log confirmed 决策链，"## 发散候选与可证伪大纲"节不适用（not_applicable：无模糊需求需发散；方案空间在 Talk 中直接三选项呈现并由用户裁决）。

### Triage 范围四维判定（step 2，talk-with-zhipeng 输出）

- 最终 verdict：**可以做**
- 四维详情：
  - 真实痛点：正面（证据——母 R-018/R-019 逐字"大量的质量、流程阻塞""大量哈希、sha、快照……导致任务无法推进"）
  - 复杂度/ROI：正面（证据——F-007/F-008 给出文件级删除面与消费者反查，改动量可估；ROI=后续每卡省数小时证据循环，Card-02/05 实测）
  - 风险与影响范围：中性偏正面（证据——影响面已列出七类面 + G-3 候选 16 项 + 双写嫌疑 6 组；风险有登记和协议）
  - 时机：正面（证据——PRD 拓扑 Group 2 先行卡，Group 1 仅剩 Card-03 收尾，用户已定节奏 ADR-001）
- 推翻条件：Card-03 合并不带入 26786b61（main 审查路径持续坏 → direction/detail advice 长期 unavailable → 完成判据缺 → 回到节奏裁决）；或 build-plan 核查发现 G-3 候选远超预期（>16 项）→ 重估批次计划
- 丢弃台账：无丢弃——母 PRD 八项删除职责 + OI-013 校验机器全部接收为删除面；Card-02"保留双 cohort"安排被 ADR-002 显式取代（登记于 Supersedes，非静默丢弃）
- 推断回显：无未确认推断；所有前提均绑定 U/V 原文或 F-00x 调查事实

## 非目标

- 具体删除文件清单定死（PRD Q8 → build-plan 核查）
- build-plan 及后续阶段执行（用户其他会话，D-008）
- 审查工具选型（Card-05）；回读检查幸存机制建设（Card-08）；写入量优化（Card-09）
- token/时间统计机制、后台执行平台、UI 改动

## 决定

决定区按 functional 方案模块分组；链序：requirement/question → facts/constraints → option → decision → feature/consumer → acceptance。

### ADR-001 开工节奏
```text
- **source**：V-002（U-003）
- **decision**：make-decision 现在执行；build-code（实际删除）等 Card-03 完成并合并后进行；build-plan 移交用户其他会话
- **rationale**：删除面调查可提前；动手拆必须等 Card-03 收尾合并，否则互相踩踏；U-004 明确会话边界
- **consequence**：本卡材料先行，实施窗口后移；Card-03 合并必须带入 26786b61（host_provider 修复），否则 main 审查路径必抛
- **supersedes**：none
- **原始声明层**：U-003、V-002
- **三级追溯**：R-003 → U-003 → ADR-001
- **三档结论**：confirmed
- **approval_binding**：V-002（ask_user_question T-001，2026-09-30）
- **owner/next_action**：主会话执行 make-decision；Card-03 合并由用户在 build-code 前完成
module: 开工节奏
requirement_ids: [R-003, R-004]
derived_from: []
artifacts: [本文档；下游 build-plan 输入]
```

### ADR-002 删除范围（post 全删 + pre 退役）
```text
- **source**：V-006、V-009（+ 母 OI-012/OI-013）
- **decision**：post 新路径机器门禁全删；pre 路径整体退役——pre 机制全删、未完成 pre 任务 117 项只读归档不再继续、历史记录保留只读可查；接续责任归 Card-08
- **rationale**：十卡终点即薄核心，pre 迟早要拆；用户知悉后果（pre 任务推进工具归零、Card-08 接续面收窄）后拍板
- **consequence**：G-3 触发面扩大（pre 机制安全职责扫描全做）；Card-02"保留双 cohort"临时安排被本决策取代；仓库体积下降最大化
- **supersedes**：Card-02 收口时"保留双 cohort"临时安排（不构成 ADR 级上游，记录取代事实）
- **原始声明层**：U-001、V-006、V-009
- **三级追溯**：R-001 → 母 decision-log OI-012/013 → ADR-002
- **三档结论**：confirmed
- **approval_binding**：V-006（T-002）、V-009（T-003）
- **owner/next_action**：build-code 执行归档；Card-08 接续
module: 删除范围
requirement_ids: [R-001]
derived_from: []
artifacts: [迁移表 pre 面条目；归档清单 117 项]
```

### ADR-003 窄工具落点
```text
- **source**：V-007
- **decision**：5 项窄工具落点为 runtime/ 瘦身为纯工具模块（runtime/interface/ 下只留窄工具实现）
- **rationale**：现有消费者 import 路径变动最小；F-007 查明仅工具②基本独立、①③④⑤需从 kernel 剥离改写——落点定了但剥离方案归 build-plan/实施
- **consequence**：runtime/ 名字可能误导"还有运行时状态"——批次 6 瘦身时以 move-map 登记澄清
- **supersedes**：none
- **原始声明层**：V-007
- **三级追溯**：R-001 → 母 OI-006 → ADR-003
- **三档结论**：confirmed
- **approval_binding**：V-007（T-002）
- **owner/next_action**：批次 0/6 实施剥离
module: 窄工具
requirement_ids: [R-001]
derived_from: []
artifacts: [runtime/interface 瘦身结果]
```

### ADR-004 删除策略与八批顺序
```text
- **source**：V-004、V-010
- **decision**：方案 B 逐批删除，八批：0 窄工具独立化 → 1 只保护流程形状的测试 → 2 workflows/steps+config（固定轮次/14 步锁）→ 3 skills 旧绑定（wh-review/broker 退出）→ 4 runtime 机制核心（kernel/fact graph/completion/evidence）→ 5 CLI 旧入口+schemas → 6 runtime 瘦身+move-map → 7 治理文档
- **rationale**：先立新后拆旧、先删看守再删牢房；每批前消费者扫描+G-3，每批后针对性验证+向用户汇报
- **consequence**：总时长比一次性删除长；中间态需防"双轨并存"被误读为新增双写
- **supersedes**：none
- **原始声明层**：V-004、V-010
- **三级追溯**：R-001 → OI-002 → ADR-004
- **三档结论**：confirmed
- **approval_binding**：V-004（T-001）、V-010（T-004）
- **owner/next_action**：build-plan 细化批次任务；build-code 执行
module: 删除策略
requirement_ids: [R-001]
derived_from: [ADR-002]
artifacts: [phases/P0~P7 骨架输入]
```

### ADR-005 执行弹性
```text
- **source**：V-011
- **decision**：迁移表冻结后允许 append-only 补记+立即向用户汇报（不许静默改冻结条目）；每批删除前打 backup/card-06-b<N> 标签；AC-29 日常路径演练 = 本卡 build-code→verify-code 自举
- **rationale**：发现漏网消费者不必整批回滚；快照 = AC-53 后悔药；自举演练真实且不额外造任务
- **consequence**：冻结的严肃性靠"首删晚于冻结"保证，不靠禁止补记
- **supersedes**：none
- **原始声明层**：V-011
- **三级追溯**：R-001 → 母 OI-012 → ADR-005
- **三档结论**：confirmed
- **approval_binding**：V-011（T-004）
module: 删除策略
requirement_ids: [R-001]
derived_from: [ADR-004]
artifacts: [迁移表操作规则]
```

### ADR-006 G-3 安全闸协议
```text
- **source**：母 G-3（L857）
- **decision**：每批删除前子代理做安全职责扫描；发现待删机制承担安全职责 → 当场停 → 大白话回报 → 等用户拍板；禁止自行保留/静默回写 PRD
- **rationale**：母 Grill 既定协议；F-007/F-008 已点名 8+9 项 G-3 候选（不可逆授权、原子写、project lock、protected-paths、accepted_risk、结构化问答卡等）
- **consequence**：批次可能中途暂停等裁决——这是特性不是故障
- **supersedes**：none
- **原始声明层**：母 decision-log L857
- **三级追溯**：R-001 → 母 G-3 → ADR-006
- **三档结论**：confirmed
- **approval_binding**：用户 T-002 批确认（G-3 流程提案）
module: 安全闸
requirement_ids: [R-001]
derived_from: []
artifacts: [每批 G-3 扫描记录]
```

### ADR-007 执行纪律（约法三章）
```text
- **source**：V-005、V-008
- **decision**：7 条全生效：①每批删完即报 ②审查每 Phase 至多 2 轮，超了带 incomplete 停下问 ③gate timeout 实测标定 ④逐 AC 结构化产出在 build-plan 声明 ⑤重活全走子代理短任务、主会话只当工头 ⑥压缩后第一时间读 phase_progress 游标+phases/index.md ⑦带 incomplete 收官须用户明确拍板
- **rationale**：Card-02/04/05 三次"代码完→证据循环数小时→用户发火"的教训转化；用户确认 7 条
- **consequence**：个别质量事实保持 incomplete 由用户拍板接受
- **supersedes**：none
- **原始声明层**：V-005、V-008
- **三级追溯**：R-001 → F-003~F-006 会话教训 → ADR-007
- **三档结论**：confirmed
- **approval_binding**：V-005（T-001）、V-008（T-002）
module: 执行纪律
requirement_ids: [R-001]
derived_from: []
artifacts: [本文档；build-plan 合同]
```

### ADR-008 会话边界
```text
- **source**：V-014（U-004）
- **decision**：本会话 = make-decision 十三步为止；build-plan/build-code/verify-code 全部移交（用户在其它会话执行 build-plan）
- **rationale**：用户明确纠正；此前我把 build-plan 排进 todo 属越界
- **consequence**：step 12 的 handoff 必须写清"下游从 build-plan 开始"；本卡 task.json 尚未创建的问题在 publish 前处理或披露
- **supersedes**：U-003 中"build-plan 先行"的归属表述
- **原始声明层**：U-004、V-014
- **三级追溯**：R-004 → U-004 → ADR-008
- **三档结论**：confirmed
- **approval_binding**：V-014（用户消息 2026-09-30）
module: 会话边界
requirement_ids: [R-004]
derived_from: []
artifacts: [step 12 handoff 边界声明]
```

### ADR-009 调研事实层（D-009）
```text
- **source**：U-002、F-001~F-009
- **decision**：9 项调研全部完成并落本文件调研节；deep-research 外部检索跳过（原因：方向性事实已全部取自权威内部来源——母 cohort 两材料 + 4 份历史执行会话转录 + 2 份删除面 grep 调查，外部检索不能改变方向）
- **rationale**：技能允许"记录跳过原因"；内部事实三角测量已充分
- **consequence**：无外部检索报告；若 build-plan 发现内部事实不足，可补一轮 deep-research
- **supersedes**：none
- **原始声明层**：U-002
- **三级追溯**：R-002 → F-001~F-009 → ADR-009
- **三档结论**：confirmed
- **approval_binding**：调研为事实层，不需用户确认
module: 调研
requirement_ids: [R-002]
derived_from: []
artifacts: [本文档调研节；两调查报告原文在会话内，关键结论已结构化入本文档]
```

### ADR-010 文档时机（Grill G-002）
```text
- **source**：G-002 挑战（doc-timing）
- **decision**：折中——build-code 开工时在 AGENTS.md 顶部加"Card-06 删除进行中"临时横幅，其余治理文档仍按 ADR-004 批次 7 统一改写
- **rationale**：两头都占——不被旧描述误导（Card-04 stale 教训）+ 避免 7 次中间态改写的工作量
- **consequence**：批次 7 的文档任务减一小项（横幅移除并入）；横幅本身在收口时删除
- **supersedes**：none（细化 ADR-004 批次 7）
- **原始声明层**：G-002 用户选 C
- **三级追溯**：R-001 → G-002 → ADR-010
- **三档结论**：confirmed
- **approval_binding**：Grill G-002 回复（2026-09-30）
- **owner/next_action**：build-code 开工横幅、收口时移除
module: 删除策略
requirement_ids: [R-001]
derived_from: [ADR-004]
artifacts: [AGENTS.md 临时横幅]
```

### ADR-011 删除期间仓库使用（Grill G-003）
```text
- **source**：G-003 挑战（new-task-during）用户自由文本回复
- **decision**：删除期间（Card-06 build-code 窗口）用户不会使用改到一半的 workflowhub 仓库——"新任务怎么走"风险项关闭，不设冻结机制（无需机制，用户事实承诺）
- **rationale**：用户原话"不用管，我不会在这期间用改到一半的 workflowhub 的"——事实回答而非选项选择，比任何机制都可靠
- **consequence**：Q2 风险从"需要裁决"降级为"已关闭"；不设冻结控制面（遵守"无消费者的新控制面不新增"）
- **supersedes**：none
- **原始声明层**：G-003 用户自由文本
- **三级追溯**：R-001 → G-003 → ADR-011
- **三档结论**：confirmed
- **approval_binding**：Grill G-003 自由文本回复（2026-09-30）
- **owner/next_action**：用户自律；build-code 开工时在首条汇报里复述此承诺作为对齐
module: 开工节奏
requirement_ids: [R-001]
derived_from: [ADR-001]
artifacts: [build-code 首条汇报对齐项]
```

### ADR-012 pre 归档形态修正（Grill G-004）
```text
- **source**：G-004 挑战（pre-archive-form）用户质疑 + 主会话核实
- **decision**：①事实修正：F-008"pre 未 close 117 项"中**无任何活跃进行中任务**——核实（2026-09-30）外置任务存储 7 天内有事实写入的只有 5 个 post 卡（01/03/04/05/06）+1 个 readme 材料任务；117 项全部是历史遗留记录。归档语义=历史记录只读化，不存在"中断进行中任务"。②归档时写一份根目录 README 说明（为什么归档、怎么只读查、接续归 Card-08）
- **rationale**：用户质疑触发核实，核实结果支持用户说法；README 防止未来误读未 close 目录为"还在进行"
- **consequence**：OI-015 表述修正；ADR-002 的"接续"语义更清晰——无活可接，Card-08 接的是"历史查询"而非"任务继续"
- **supersedes**：ADR-002 中"未完成 pre 任务不再继续"的表述（细化为"历史遗留记录无活跃任务"）
- **原始声明层**：G-004 用户质疑原文 + 主会话 find/stat 核实事实
- **三级追溯**：R-001 → G-004 → ADR-012
- **三档结论**：confirmed
- **approval_binding**：Grill G-004 澄清回复选 A（2026-09-30）
- **owner/next_action**：批次执行时写 README；Card-08 消费
module: 删除范围
requirement_ids: [R-001]
derived_from: [ADR-002]
artifacts: [任务存储根 README-ARCHIVED.md]
```

### ADR-013 双层 hash 处置（Grill G-005）
```text
- **source**：G-005 挑战（dual-hash）
- **decision**：catalog.yaml ↔ skill-bundle.json 双层 hash 随校验机器一起删（ADR-004 批次 5/6 随 schema/check-skill-closure 链处置）；不修成单一来源（修=变相保留机器）
- **rationale**：hash 校验是机器门禁本体的一部分，属 OI-013 点名删除面；F-008 已知其手工同步必然遗漏（Card-07 会话踩过），保留即保留缺陷
- **consequence**：迁移表批次 5/6 须排好顺序：先拆 check-skill-closure 消费链，再删 hash 字段；skills/catalog.yaml 本体保留（登记职责用）
- **supersedes**：F-008"保留但需修双层 hash"的调查建议（改为删除）
- **原始声明层**：G-005 用户选 A
- **三级追溯**：R-001 → G-005 → ADR-013
- **三档结论**：confirmed
- **approval_binding**：Grill G-005 回复（2026-09-30）
- **owner/next_action**：build-plan 排批次 5/6 顺序；build-code 执行
module: 删除策略
requirement_ids: [R-001]
derived_from: [ADR-004]
artifacts: [批次 5/6 迁移表条目]
```

## 动态 Talk 批次

| batch_id / OI version | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001 / v1 | 开工前置（3 选项） | 等 03=最稳；现在全速=违反拓扑 | V-002 自由文本（第 4 选项自定义） | OI-004 确认 | ask_user_question 2026-09-30 |
| T-001 / v1 | dirty 文件处置（4 选项） | 带走=别人半拉活进基线 | V-003 | 转 F-009 调查后 T-005 裁决 | 同上 |
| T-001 / v1 | 删除策略（3 方案） | A 最激进；C 最慢 | V-004 | OI-007 确认 | 同上 |
| T-001 / v1 | 验收预算（3 选项） | 不设上限=重走老路 | V-005 | OI-009 确认 | 同上 |
| T-002 / v1 | 双 cohort 边界（3 选项） | 只删 post=瘦不彻底 | V-006 | OI-005 待确认→T-003 后果确认 | 同上 |
| T-002 / v1 | 窄工具落点（3 选项） | B=import 全改；C=边界模糊 | V-007 | OI-006 确认 | 同上 |
| T-002 / v1 | 约法三章（3 选项） | 精简版=纪律不足 | V-008 | OI-009 确认 | 同上 |
| T-003 / v1 | pre 全删后果确认（3 选项） | 先盘点=多一轮工作量 | V-009 | OI-005 确认（取代 Card-02 临时安排） | 同上 |
| T-004 / v1 | 八批顺序（3 选项） | 自由排=失去用户锚点 | V-010 | OI-007 确认 | 同上 |
| T-004 / v1 | 执行弹性三细节（3 选项） | 不许补记=小漏大批量返工 | V-011 | OI-008 确认 | 同上 |
| T-005 / v1 | 孤儿改动处置（2 选项） | stash=否决方案可能被误翻出来 | V-012 | OI-011 确认（已执行还原） | 同上 |
| T-006 / v1 | 任务类型（2 选项） | 规划任务=只剩两阶段 | V-013 | 任务身份节确认 | 同上 |

Talk 收敛状态：v1 队列无 high/medium 未答项；架构方向与用户体验均已覆盖。四维判定见 step 2 登记。

## 调研

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| F-001 PRD 全量 | Card-06 范围/AC/依赖 | 实际 10 卡；AC-27~32/52/53；Group 2 先行；verify.v1/product_release/status_groups 现状零匹配 | 完成 | ADR-002/004 |
| F-002 母 decision-log 全量 | OI/R/G 决策链 | OI-003/006/012/013 confirmed；G-3；L694 重访条款；Q8 清单不定死 | 完成 | ADR-002/006 |
| F-003 会话1 Card-02 verify/close（43MB） | 验收契约/证据循环 | AC 结构化 producer 必须前置；用户定调"Card-06=物理删除+零 consumer 证明"；保留双 cohort 被本卡取代 | 完成 | ADR-007 |
| F-004 会话2 Card-07 build-code（82MB） | receipt 雪崩/timeout | snapshot 变化 10 次全量重采；240s 声明 vs 13.1min 实测；先立新后拆旧活例证 | 完成 | ADR-004/007 |
| F-005 会话3 Card-05 build-code（375MB） | 进度丢失/超时杀审查 | 三次退回 P3/P4；进度游标条款来源；6650 万 token 教训；健康信号替代墙钟 | 完成 | ADR-007 |
| F-006 会话4 Card-04 build-code（110MB） | Phase 切分/子代理失控 | 八项 Phase 合同；单代理 followup 121 次反面教材；黑话汇报事故 | 完成 | ADR-007 |
| F-007 机制层删除面（grep 反查） | runtime/tools/tests/schema 清单 | 73 .mjs：删约 34/改窄工具 5-8/幸存 4-6/待定约 20；5 窄工具仅②独立可用；G-3 候选 7 项；孤儿 8 项 | 完成 | ADR-003/004 |
| F-008 方法/pre 任务面（grep 反查） | skills/workflows/治理文档/pre 任务 | skills 删 6 保 29 待定 8；pre 未 close 117 项归档清单；G-3 候选 9 项；双写嫌疑 6 组；Card-06 task.json 未创建 | 完成 | ADR-002/004/006 |
| F-009 dirty 文件调查 | 孤儿改动归属 | 无任务归属、违背 2026-09-29 裁决、全库查无出处；正解在 Card-03 26786b61 | 完成→已处置还原 | ADR-001/011(OI) |

## 调研候选交付

不适用：F-001~F-009 均为内部事实调研，无用户可见方向候选（无"可选方案"需要交付——方案已在 Talk 中直接由用户裁决）。`candidates: []`。

## grill

module-convergence 记录（step 7）：当前 OI v1 共 18 条全部 confirmed，无 open；Grill G-002~G-005 后队列中无 high/medium 待答项——本轮零问题合法收敛。开放问题见"## 未决项"（OPEN-001/002/004/005，均为 deferred 处置，有 owner 与触发条件）。write-decision-draft（step 8）：本文件决定区 ADR-001~013 已按 decision-entry.v1 全字段成型，含 supersedes 链（ADR-002 取代双 cohort 临时安排、ADR-012 细化 ADR-002、ADR-008 修正 U-003），草案即本文档。

| grill_id | CONTEXT/冲突 | 结论 | ADR/四项退出 | source/evidence |
| --- | --- | --- | --- | --- |
| G-001 | pre 全删 vs Card-02"保留双 cohort"冲突 | 后果账摊开后用户确认退役（V-009）；取代关系写入 ADR-002 supersedes | 进行中（正式 Grill 批次见 step 6） | V-006/V-009 |
| G-002 | 文档时机：删除期间旧文档描述与实况脱节风险 | 折中：开工横幅+批次 7 统改（ADR-010） | 外部接口 pass / 命名 pass / 失败语义 pass / 范围 pass | 用户选 C |
| G-003 | 删除期间新任务归属 | 用户事实回答：期间不使用仓库，风险关闭不设机制（ADR-011） | 同上 | 用户自由文本 |
| G-004 | pre"进行中"判断被用户质疑 | 核实：7 天内活跃任务全为 post 卡，117 项均历史遗留无活跃（ADR-012） | 同上 | 用户质疑+find/stat 核实 |
| G-005 | catalog↔bundle 双层 hash 双写 | 随校验机器删除，不修（ADR-013） | 同上 | 用户选 A |

## 审查处置

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| DIR-001 | direction-advice 审查 2026-09-30 两次真实执行：①首试 openTask ENOENT（task store 未注册）②修复后重试命中 REVIEW_EXECUTION_FAILED「host_provider is required」（review-route-identity.mjs 两参调用 vs 四参签名；26786b61 在 Card-03 分支未合入） | attempt_ref=quality/reviews/attempts/c0985e26-96e1-5304-ae7f-290f411560dc/attempt.json；report_ref=quality/reviews/reports/make-decision-simple-c0985e26….md；blocked_before_dispatch、provider_attempts=[]、findings=[]、terminal_status=unavailable；provider 未启动，不构成 pass 也不构成 findings | unavailable | 按契约不再重试；等 Card-03 合并 26786b61 修复 route 后按普通步骤重做 1 次；snapshot_tree 2a44c5af 绑定当前 HEAD | owner=make-decision / consumer=step4 完成事实 + 阶段末披露 / retain |
| DTL-001 | detail-advice 审查 2026-09-30 真实执行 1 次：同样命中 REVIEW_EXECUTION_FAILED「host_provider is required」（simple-review-runner 强制 host_provider 非空未注入；与 DIR-001 同根因） | attempt_ref=quality/reviews/attempts/278f5218-7611-52d2-a922-0524be468ec2/attempt.json；blocked_before_dispatch、provider_attempts=[]、findings=[]、terminal_status=unavailable | unavailable | 不再重试；等 Card-03 合并 26786b61 后与 DIR-001 一并重做 | owner=make-decision / consumer=step9 完成事实 + 阶段末披露 / retain |
| DIR-002 | analyzeDecisionOutline 严格性观察（121→0 已修复） | 材料形态对齐 reader 链，detail/approve 消费无障碍 | fixed | 三 reader 终验 2026-09-30：outline [] / census 0 / convergence 8 项全 passed | owner=make-decision / consumer=detail-advice,approve / retain |

## 最终确认

- 状态：pending（step 10 approve-decision 执行）
- 用户原文与 host-visible 绑定：待登记
- 未确认内容：全部 ADR 待最终大白话确认卡

## 拒绝方案

| 选项 | 拒绝理由 | 关联 D |
| --- | --- | --- |
| 一次性大删除（方案 A） | 误删定位难、G-3 触发面大、回滚成本高 | ADR-004 |
| 先断供再拆除（方案 C） | 中间态双轨并存易被误读为新增双写机制 | ADR-004 |
| 新目录 tools/narrow/ 或 runtime/narrow/ | 消费者 import 全改、Card-08/09 幸存者跟着迁移 | ADR-003 |
| 窄工具融入 skills/ | 技能是"方法"不是"工具"，边界模糊，违反"可脱离 kernel 独立调用" | ADR-003 |
| 只删 post、保留双 cohort | 用户在本卡推翻 Card-02 临时安排；长痛不如短痛 | ADR-002 |
| stash 留孤儿改动 | 已否决方案可能被未来会话误翻出来用 | OI-011 |
| 规划任务 | Card-06 走四阶段实施旅程 | 任务身份 |
| build-plan 归本会话 | 用户明确纠正（U-004） | ADR-008 |

## 风险与延期交接

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
| --- | --- | --- | --- |
| R1 | 换名不改消费者 | 删除失效、AC-27 失败 | build-code 每批消费者核对 |
| R2 | 旧流程搬进技能 | AC-32 失败 | 批次 3 逐文件核 |
| R6 | 删校验机器后材料偷换无机器防护 | 以两道人为门+独立审查+真实执行兜底（明示取舍） | 全程 |
| R7 | 文件名碰撞/覆盖 | 不可变命名（日期+序号+描述）+append-only | 记录层全程 |
| G-3 | 待删机制担安全职责 | 批次暂停等用户裁决 | 每批前扫描 |
| OPEN-risk | Card-06 task.json 未创建 | publish/reflection 无 task store 可写 | step 12 前处理或披露 |
| OPEN-risk | main 审查路径 host_provider bug | direction/detail advice 可能 unavailable | 等 Card-03 合并 26786b61 后重试 |

### 质量边界

- 质量事实：direction/detail advice 尚未执行（step 4/9）；调研事实 9 项已落
- 推进资格：talk-with-zhipeng 不产出推进资格；本阶段完成判据 = 十三步各步事实齐备
- 完成判据：steps.json 13 步 completion_evidence 齐备 + 用户最终确认
- 不可逆授权边界：本阶段无 git 不可逆操作（还原孤儿改动是工作区清理，已获用户授权 V-012）

## 未决项

| item_id | 未决内容 | 原因 | 谁在何时解决 |
| --- | --- | --- | --- |
| OPEN-001 | 具体删除文件清单 | PRD Q8：归 build-plan 核查产出 | build-plan 会话 |
| OPEN-002 | 审查路径 host_provider bug | 正解 26786b61 在 Card-03 分支未合 main | 用户 Card-03 合并时 |
| OPEN-003 | ~~Card-06 task.json 未创建~~ | ~~任务记录未引导~~ | 已关闭：2026-09-30 task-bootstrap 注册（canonical_resolver，cohort=post，worktree 绑定 baseline be8500e4） |
| OPEN-004 | 窄工具③④⑤剥离方案 | F-007：③在 kernel 句柄内、④必经 kernel、⑤无单一实现 | build-plan/批次 0 |
| OPEN-005 | 冲突中断保护⑤选哪个候选 | 三候选（workspace 冲突拒绝/记录锁/project lock）各有耦合 | build-plan 定死 |

## Supersedes

- 本文档第七节 ADR-002 取代 Card-02 收口时"保留双 cohort"临时安排（非 ADR 级上游，事实取代）
- 本文档第八节 ADR-008 修正 U-003 中 build-plan 归属表述

## Append-only 更正

（暂无）

## 文档结果

- CONTEXT.md：no-change——Grill 未产生领域术语/含义/边界变化（G-002~G-005 均为执行层决策，不动 CONTEXT 词条）；理由：现有术语（cohort/窄工具/G-3）含义未变
- ADR：本文档 ADR-001~013 集即决定记录；docs/adr 不另建——三项判据评估：hard to reverse=是（pre 退役不可逆）、surprising=否（十卡 PRD 明示）、genuine trade-off=否（方向唯一）——后两项不全真，不另建 ADR 文件
- ADR criteria：待 Grill
- 术语/ADR 冲突及处理：待 Grill
- 不复制 spec 的边界：本文件只记决策索引与来源锚点，实现细节归 build-plan 的 spec.md/phases

### Exit checks

- 上下文一致：待 step 6/11 核验
- owner/接口一致：待 step 6/11 核验
- 失败语义明确：待 step 6/11 核验
- 范围与延期明确：待 step 6/11 核验

## 核心需求

把 WorkflowHub 里所有"机器保安"（哈希/快照/身份/材料/回执校验、stage completion 认证、task kernel/fact graph 强制依赖、evidence 多层包装、plan/tasks 双写、固定 Talk 轮次、强制 handoff、只保护流程形状的测试）全部拆除——post 新路径拆干净、pre 旧路径整体退役只读归档；只留下两道"人为门"（你点头确认 + Git 不可逆授权）和 5 样能脱离 kernel 独立使用的窄工具。

## 核心目标

目标达成标志——删完之后：任何人走"发起→实施→验收"日常工作流，全程没有一个环节会被机器门禁卡住；5 项窄工具在没有 kernel 的环境下逐项可用（5/5 真实结果）；仓库里不存在换名复活的旧机制；删除前的一切损失都有白纸黑字的承认和后悔药（快照）。

## 决定

方向一句话：先立新、后拆旧、分批拆、拆完验证——按已经拍板的 8 批顺序（先立窄工具 → 测试看守 → 流程 → 技能 → 机制核心 → CLI/schema → 瘦身 → 文档），每批删之前扫描谁在用它、查它有没有暗中干安全活（G-3），删完立刻验证并向你汇报。范围边界：具体删哪些文件由 build-plan 核查定，本阶段不定死；Card-08 的回读检查和 Card-09 的写入量文件是显式幸存者。验收：PRD 的 8 条 AC 一条不能少，质量缺口如实带 incomplete 由你拍板，不伪造通过。
