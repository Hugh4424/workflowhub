# 功能规格：make-decision 有序头脑风暴

> 本文件是本实施 task 的全局实现设计权威：说明目标翻译、架构边界、全局依赖与验证策略；每包差异、精确命令和执行步骤只属于对应 `phases/P<n>.md`。不复制母 PRD 的完整产品需求。
> 验收正文只在 Appendix A；叙事区只引用 AC ID。

- **功能名**：make-decision 有序头脑风暴
- **来源**：`decision-log.md` U-001～U-009、V-001～V-029、D-002、D-009～D-033、OI outline-v2；母 PRD CARD-02/CARD-07
- **状态**：build-plan 当前草稿

## 速读卡（30 秒）

- **一句话需求**：用户只给模糊需求和痛点；WorkflowHub 负责调研、发散、异源挑战和结构化收敛，只把重要、方向或无法合理消解的模糊问题交给用户。
- **核心改动点**：
  - 固定轮次记录流改成可回边、按未决项驱动的头脑风暴流。
  - 用户原话与 agent 派生分层；研究、候选、偏离和取代关系均可追溯。
  - 已知需求逐项处置；遗漏、盲重建泄漏和覆盖历史正文必须明确失败。
- **最大影响面**：需求入口、研究交付、方向审查、Talk/Grill、收敛记录和下游规划输入。
- **验收信号**：模糊需求能产生真实新方向；普通问题不占用用户；原话不被改写；漏项、泄漏选择和覆盖旧结论均被拒绝。

## 材料导航

| 章节 | 摘要 | 读取时机 |
| --- | --- | --- |
| `decision-log.md#u-004-card-02-合并后的阶段切换逐字` | 最新阶段方向与 cohort 授权 | build-plan 入口 |
| `decision-log.md#需求大纲-v1模块台账` | 产品模块和未决范围 | spec 作者与审查 |
| `decision-log.md#现行结论` | append-only 推导出的当前决定 | 所有下游 |
| `spec.md#appendix-a--验收判据唯一权威` | 产品验收唯一正文 | plan、build-code、verify-code |
| `phases/index.md#execution-index` | 每个独立 Phase 的纯指针索引 | build-plan、build-code、verify-code |
| `phases/P1.md#l1--executable-contract` | CARD-02 产物合同修复与共享 runtime | build-code |
| `phases/P2.md#l1--executable-contract` | CARD-07 作者合同 | build-code |
| `phases/P3.md#l1--executable-contract` | 真实切片与逐项验收 | build-code、verify-code |
| `phases/P4.md#l1--executable-contract` | 独立原文分母、语义强度、最终 spec-analyze 与条件交付 | build-plan 最后分析、build-code、verify-code |

## 来源与决策映射

| Source ID | Decision ID | FR / AC IDs | Status / affected scope | Unresolved / handoff |
| --- | --- | --- | --- | --- |
| U-001、V-001/V-014 | D-002、D-015 | FR-34、FR-40、FR-43 / AC-34、AC-40、AC-43 | current / research + early review | review unavailable 保真 |
| U-002、V-004～V-010 | D-011～D-017 | FR-33、FR-36、FR-38～FR-41 / AC 同号 | current / main flow | 普通问题最小假设 |
| V-016 | D-013 | FR-39 / AC-39 | current / minimum intake | 无 |
| V-017/V-018 | D-015 | FR-34 / AC-34 | current / research delivery | 无 |
| V-019 | D-016/D-017 | FR-36、FR-41 / AC-36、AC-41 | current / question routing | 无 |
| U-004、V-020/V-021 | D-029 | FR-46 / AC-46 | current / four-stage authoring | 手动 cohort 例外已留证据 |
| FR-33～FR-38 卡面 | D-009～D-027 | FR-33～FR-38 / AC-33～AC-38 | current / core acceptance | 无 |
| OI-016、U-010、R-035 | D-035 | RISK-005 | current / CARD-07 owns shared make-decision interface | CARD-04 only adapts the frozen decision-log consumer contract; current behavior tests remain required |
| U-005、V-022/V-023 | D-030 | FR-47～FR-49 / AC-47～AC-49 | current / CARD-02 物理产物漏项修复 | 独立 Phase 文件与原始需求回读 |
| U-006/U-007、V-024～V-027 | D-031 | FR-50～FR-52 / AC-50～AC-52 | current / 可执行细度与防漏设计 | 旧计划执行前信息迁移、空壳负例、真实抽验 |
| U-008/U-009、R-032/R-033 | D-032/D-033 | FR-53～FR-55 / AC-53～AC-55 | current / Phase 4 原文分析与条件提交 | decision-log 逐字层独立分母及正式 analyzer 未证实；CARD-02 全量 AC 未绿时保持 incomplete |
| U-002-23/24、R-034 | D-034 | FR-40 / AC-40 | current / make-decision 用户共同梳理方案与验收 | 本阶段真实问答及裁决缺证时 incomplete，不能由后续 spec/AC 代偿 |

## 1. 问题与紧迫性

旧 make-decision 容易把用户需求压缩成摘要，调研与审查发生太晚，提问顺序零散，普通问题也反复占用用户。结论可能被原地覆盖，已知需求还可能在没有逐项处置时被宣称“已收敛”。CARD-02 已交付四阶段 topology，但 post 文档作者链仍保留 plan/tasks 旧形态；本任务先补齐该漏项，再把头脑风暴语义设计完整，避免下游普通模型靠猜测补需求。

## 2. 背景、目标与范围

### 背景

本任务消费 CARD-02 的 post-cohort `make-decision → build-plan → build-code → verify-code` 路径。CARD-02 的原始目标是 `build-plan` 同时产规格、逐 Phase 独立文件和纯指针索引；当前实现只完成了拓扑与部分纯指针化。本任务按 U-005 增加漏项修复，之后再交付 CARD-07 的发散、研究、提问、审查与收敛语义，不建立新的控制面。

### 目标

- **GOAL-001**：模糊需求可直接启动；完整背景、故事、约束和验收候选由 agent 派生并标来源。
- **GOAL-002**：外部与内部研究作为发散引擎，早于用户大纲定向。
- **GOAL-003**：每条候选有 origin，能证明出现用户原始候选之外的新方向。
- **GOAL-004**：只向用户升级重要、方向和真实模糊问题。
- **GOAL-005**：原话、派生、偏离、取代、未知和延期均可追溯，不伪造闭合。
- **GOAL-006**：使用 post 四阶段，由本 stage 产出最终 spec、逐 Phase 独立文件与纯指针索引；下游消费同一物理集合。
- **GOAL-007**：build-plan 最后真实执行 spec-analyze，以不受当前材料自报影响的原文分母识别遗漏、弱化和错绑；原始 CARD-02 全量未证实时不提交 main。

### 范围内

- 最小入口、研究、角度发散、方向审查、大纲讨论、逐模块收敛的完整行为链。
- 动态问题分级、零问题轮次、可证伪大纲重画。
- 逐字层、派生层、三档结论、append-only 取代和现行结论。
- 已知需求逐项处置、漏项负例、blind reconstruct 协议。
- review 不可用、材料身份漂移和用户暂停的真实失败语义。
- CARD-02 post 文档作者与消费者漏项：spec 实现设计、独立 Phase 文件、纯指针索引、正式 handler 与下游读回、AC-07/08/09 真验收。
- P4 根治末端自证：认证原文分母、语义强度反例、真实 spec-analyze 调用/发布/读回，以及 CARD-02 全量条件验收。

## 3. 用户场景与状态覆盖

### SCN-001：模糊需求直接启动
- **角色**：提出需求的用户
- **Given**：只有模糊需求和痛点
- **When**：开始 make-decision
- **Then**：流程继续；背景、故事、约束和验收候选标为 agent 派生或待核对

### SCN-002：研究完整到达
- **角色**：需要理解候选方向的用户
- **Given**：存在需要扩展的方向空间
- **When**：完成外部最佳实践研究和内部结构分析
- **Then**：得到大白话表格、推荐/不推荐、逐条来源和完整材料引用，无固定长度截断

### SCN-003：按变化角度产生新方向
- **角色**：make-decision 主会话
- **Given**：已有原始候选
- **When**：生成 2～3 个变化角度并逐角度填充
- **Then**：每条候选标 origin，集合差中至少有一条非用户原始方向

### SCN-004：选项不足时自动再发散
- **角色**：make-decision 主会话
- **Given**：角度为空、候选雷同或用户认为选项不足
- **When**：检查角度覆盖
- **Then**：回到研究/发散，空缺填满后才收敛，不靠固定轮次停止

### SCN-005：可证伪大纲被推翻
- **角色**：make-decision 主会话
- **Given**：大纲附 3～5 个可证伪问题
- **When**：过半假设被证伪
- **Then**：旧版标废弃并重画；用户讨论同时展示被证伪假设和原因

### SCN-006：异源方向审查只做挑战
- **角色**：独立 reviewer
- **Given**：研究与发散形成未收敛选项空间
- **When**：执行配置声明的 direction review
- **Then**：只返回缺口、冲突和风险；不可用时保留 provider/transport/error，不生成通过

### SCN-007：只问真正需要用户的问题
- **角色**：用户
- **Given**：出现新的未决项
- **When**：系统分类其影响
- **Then**：仅重要、方向和真实模糊项进入问题队列；普通项记录最小合理假设

### SCN-008：零问题轮次合法
- **角色**：make-decision 主会话
- **Given**：当前没有需用户决定的问题
- **When**：检查交互节点
- **Then**：不为凑轮次提问；零问题结果合法，按剩余 OI 推进

### SCN-009：发现缺口时追加而不覆盖
- **角色**：材料 writer
- **Given**：既有结论被修正或取代
- **When**：记录新事实
- **Then**：旧正文保留并标取代；现行结论由追加记录推导；放弃方向及原因可回读

### SCN-010：盲重建后再揭示与挑战
- **角色**：用户与 make-decision 主会话
- **Given**：进入最终方向确认
- **When**：执行 reconstruct → reveal → challenge
- **Then**：重建阶段看不到当前选择/推荐/排序；揭示后才暴露；漏项或拒绝返回相关模块

### 状态机

`intake_minimum → outline_hypothesis → researching → diverging → direction_review → outline_discussion → module_convergence → reconstructing → revealed → challenging → confirmed`

分支：

- `intake_minimum → awaiting_minimum_input`：连模糊需求或痛点都没有。
- `researching → research_degraded`：研究不可用；披露缺失范围后继续安全工作。
- `diverging → divergence_refill → diverging`：角度空缺或候选雷同。
- `outline_hypothesis → redraw_required → outline_hypothesis`：过半假设被证伪。
- `direction_review → review_unavailable`：审查不可用，禁止改写为通过。
- `module_convergence → no_question`：无用户问题，合法继续。
- `reconstructing → blind_violation`：提前携带当前选择、推荐或排序。
- `challenging → revision_required | coverage_incomplete`：用户拒绝或已知需求仍缺处置。
- 任意交互态可进入 `paused_by_user`；恢复必须绑定同一问题和材料身份。

### 状态覆盖清单

- [x] **默认态**：SCN-001～SCN-004
- [x] **空态**：`awaiting_minimum_input`、`no_question`
- [x] **错误态**：`research_degraded`、`review_unavailable`、`blind_violation`
- [x] **加载态**：`researching`、`direction_review`
- [x] **取消态**：`paused_by_user`
- [x] **边界态**：`redraw_required`、`coverage_incomplete`
- [x] **权限态**：最终确认只能来自真实用户答复
- [x] **竞态**：过期答复或材料漂移保持 incomplete，不绑定到新问题

## 4. 产品事实与假设（PFACT）

- **PFACT-01**：CARD-02 已合入当前基线，post topology 为四阶段。
  - **status**：`verified`
  - **证据或来源**：提交 `dd80ceb1`；D-029；runtime status 回显
  - **关联**：FR-46、AC-46
- **PFACT-02**：本任务 cohort 经用户明确授权从 pre 手动改为 post。
  - **status**：`verified`
  - **证据或来源**：V-021；`quality/evidence/manual-activation-cohort-change-20260922.json`
  - **关联**：FR-46、AC-46、RISK-008
- **PFACT-03**：CARD-02 已将 coverage audit 接入生产路径并删除 active interaction aggregate。
  - **status**：`verified`
  - **证据或来源**：D-029 合并审计；D-018/D-019 现行结论
  - **关联**：FR-44、AC-44
- **PFACT-04**：CARD-07 的共享写面冻结已由 U-010/D-035 决定；CARD-04 后续只消费 `decision-log.md` 合同。
  - **status**：`implemented_locally`
  - **owner、影响**：CARD-07；定向合同测试已通过，正式 stage quality 与 CARD-04 适配仍未发生；关联 RISK-005
  - **关联**：FR-40、AC-40
- **PFACT-05**：本任务不涉及 UI。
  - **status**：`not_applicable`
  - **不适用理由**：只改变 CLI 工作流语义和材料合同
  - **关联**：NG-001
- **PFACT-06**：此前未纳入的 CARD-02 79 条已知来源已逐项登记；其中 11 条“CARD-02 已实现”旧判断经 U-006/U-007 重新核对，现行处置覆盖旧快照。
  - **status**：`verified`（逐项登记与纠偏）；各条实现/验收状态仍需独立证据
  - **证据或来源**：`research/card02-79-alignment.md` 的历史表与末尾现行处置叠加表；当前 16 本卡承接、63 交其他卡、0 无主排除、0 无条件沿用旧已实现声明，合计 79
  - **关联**：FR-44、AC-44、PLAN-RISK-006
- **PFACT-07**：原子台账限定在会进入正式需求/验收的已知单元；早期 14 FR + 14 AC 是旧快照，当前 spec 已扩展，不得把历史计数当现行分母。
  - **status**：`verified`（边界）；现行数量由本文 FR/AC 定义逐条推导
  - **证据或来源**：`research/atomic-ledger-cost-check.md`（历史成本基线）；本文 `## 5. 功能需求` 与 Appendix A
  - **关联**：FR-44、AC-44、NG-004
- **PFACT-08**：母 PRD 的“三个 revision 同 CARD-01”指 Decision revision、Source revision、Map revision 三类规划 provenance；按 SD-17 只保留语义锚点，不作为 CARD-07 推进或验收绑定。
  - **status**：`verified`
  - **证据或来源**：母 PRD `必要附件与版本`；CARD-01 的 Decision/Source/Map revision 三项；coverage A-046/U-22
  - **关联**：RISK-008；不新增 FR/AC
- **PFACT-09**：CARD-02 的 post 物理 Phase 文件并未随代码合并落地；正式 writer/reader 与原验收映射仍围绕 plan/tasks。
  - **status**：`verified`
  - **证据或来源**：CARD-02 D-002/FR-DOC-003/FR-FLOW-003 与当前 `spec-plan`、`stage-handlers`、`tests/acceptance/card-02-current.mjs` 对照；U-005。
  - **关联**：FR-47～FR-49、AC-47～AC-49、RISK-009
- **PFACT-10**：本轮虽补物理 Phase，却把任务合同压成每 Phase 一行 `Tasks`；当前 spec 未填模板要求的全局实现设计，旧计划的执行前细节没有获得新权威落点。结构校验仍误报 `ok=true`。
  - **status**：`verified`
  - **证据或来源**：`research/phase-detail-loss-audit.md`；`skills/spec-plan/templates/phase-template.md` 旧 33 行版本；当前 P1～P3 修订前原件；`validatePostPhaseContract` 的 RED 反例
  - **关联**：FR-50～FR-52、AC-50～AC-52、RISK-010

## 5. 功能需求

### 发散与研究（DIV）

- **FR-33**：对模糊需求，首个发散周期必须产生用户原始候选之外的新方向。边界：不以同义改写充数。依据：D-011/D-015；场景：SCN-003/004；验收：AC-33。
- **FR-34**：研究结论以结构化清单、完整材料引用和按需展开方式到达用户，不受固定长度截断。依据：D-015；场景：SCN-002；验收：AC-34。
- **FR-42**：大纲是可证伪且有版本的假设；过半假设被证伪时必须废弃重画。依据：D-009/D-025；场景：SCN-005；验收：AC-42。

### 保真与收敛（FID）

- **FR-35**：用户原始声明逐字保留；派生项带来源；结论落三档；偏离写明变化和原因；原话变化使依赖项待复核。依据：D-010/D-017；场景：SCN-001/009；验收：AC-35。
- **FR-37**：收敛记录 append-only；缺口、修正、取代和放弃均追加，不覆盖历史正文。依据：D-020；场景：SCN-009；验收：AC-37。
- **FR-44**：已知范围内，每个形成正式需求或验收的单元必须有唯一处置；范围明标“已知但非穷尽”。依据：D-018/D-021/D-023；场景：SCN-010；验收：AC-44。
- **FR-45**：最终确认遵守 blind reconstruct → reveal → challenge；重建阶段不得泄漏当前选择、推荐或排序。依据：D-024/D-027；场景：SCN-010；验收：AC-45。

### 动态交互（INT）

- **FR-36**：交互由真实未决项触发，不使用固定轮次或 14 步顺序锁；选项不足自动回到发散。依据：D-011/D-016/D-017；场景：SCN-004/008；验收：AC-36。
- **FR-38**：问题卡用大白话表达 2～3 个互斥选项、推荐、后果和风险；每轮至少一条替代方案，并执行错误自检。依据：D-012/D-017；场景：SCN-007；验收：AC-38。
- **FR-39**：入口只要求模糊需求和痛点；其他内容由 agent 派生并明确标记，不冒充用户原话。依据：D-013；场景：SCN-001；验收：AC-39。
- **FR-41**：只有重要、方向和真实模糊问题升级给用户；普通问题采用并披露最小合理假设。依据：D-016；场景：SCN-007/008；验收：AC-41。

### 顺序与审查（FLOW）

- **FR-40**：顺序为研究与发散 → direction review → 用户定大纲 → 逐模块收敛，并用模块级台账回显进度。在 make-decision 的模块讨论中，重要、方向或真实模糊的实现方案与验收标准由 agent 提议、和用户共同梳理并记录答复；后续 spec/AC 文档存在不代替该次参与。依据：U-002-23/24、D-002/D-014/D-034；场景：SCN-002/006/007；验收：AC-40。
- **FR-43**：direction review 读取未收敛选项空间且只做挑战；失败或不可用不能成为空 findings 或通过。依据：D-002/D-008/D-026；场景：SCN-006；验收：AC-43。
- **FR-46**：post cohort 的 build-plan 从 decision-log 冷启动并产出 spec、独立 Phase 文件与纯指针索引；不得要求先运行 build-spec。依据：D-029/D-030；验收：AC-46。

### CARD-02 缺口修复（DOC）

- **FR-47**：post build-plan 每个 Phase 都有独立 `phases/P<n>.md`，头部自声明精确写集、依赖和消费者，正文按 L0/L1/L2 分层；`phases/index.md` 只放权威路径、锚点、写集、依赖、消费者。依据：D-030、CARD-02 D-002/FR-DOC-003/004；验收：AC-47。
- **FR-48**：post 的当前材料身份、正式 build-plan、review/analyze、build-code 与 verify-code 消费同一组 `decision-log.md`、`spec.md`、`phases/index.md` 和索引列出的全部 Phase；pre/history 仍消费旧四材料。缺失、额外、重复、逃逸或不一致的 Phase 不得被旧 plan/tasks 代偿。依据：D-030、CARD-02 FR-FLOW-003；验收：AC-48。
- **FR-49**：CARD-02 AC-07/08/09 的验收必须从原始需求追踪到真实 post task 的 spec、逐 Phase 文件与下游读回；不得把“合并审查路由存在”替代“无 plan/tasks 双写”的断言。依据：D-030、母 PRD CARD-02；验收：AC-49。
- **FR-50**：新结构必须保存旧 `plan/tasks` 的执行前信息密度：`spec.md` 独占已核实全局架构/接口/失败语义/依赖/验证策略，各独立 Phase 的 L1 为每个 Task 保存可单独执行的输入、精确文件/符号与动作、输出/错误、前置与依赖、同一目标 RED/GREEN、正负 oracle、预写测试禁改边界、证据、STOP/恢复；不得把多个 Task 压成一行。旧执行后状态不复制进 Phase。依据：U-006/U-007、D-031、CARD-02 D-003/AC-DOC-003；验收：AC-50。
- **FR-51**：需求覆盖以原始用户声明和母 PRD 的已知单元为分母，不以当前 spec 或模板字段为自证分母；每条 current 来源向前映射到决策、FR/AC、Phase/Task、同义的正负 oracle/证据，并反向拒绝无来源的实现 Task。漏原文、弱化强度、错绑 AC、只有 ID 没有行为均不得称一致。依据：U-006/U-007、D-031、CARD-02 AC-FLOW-002/AC-COVER-001；验收：AC-51。
- **FR-52**：post 作者、测试蓝图/路由、依赖声明、review/analyze 与下游消费者必须指向同一 `spec + 独立 Phase + 纯指针 index`，不让 build-code 补做产品/工程设计。适用的行为测试由 build-plan 强方预写为可运行原件并证实目标 RED，测试/断言列入 DO NOT TOUCH；只有有真实理由的非行为/G-2 情形可明确 N/A，不能把“待写”冒充已准备。合法测试变更须显式请求和独立审查；build-code 用同一 oracle 让 GREEN；verify-code 对原始需求→实现→观察证据作当前范围回读，缺证据如实记 incomplete。依据：U-006/U-007、D-031、CARD-02 D-003/AC-TEST-002；验收：AC-52。

### 原始需求末端分析（ANALYZE）

- **FR-53**：post build-plan 的最终 spec-analyze 必须从认证 worktree 的当前 `decision-log.md` 字节独立提取逐字声明层及明确原子条目，建立来源分母并反查原始需求索引；记录来源位置/hash/material revision，并与 `original_requirements`、coverage 行核对。派生摘要、索引或调用方自报列表均不能单独缩小分母；缺当前逐字来源或无法提取时报 `material_incomplete`，无需额外 manifest raw inventory 或 host transcript。母 PRD/归档只读用于 CARD-02 历史条件验收。依据：U-008/U-009、D-032/D-033、CARD-02 AC-DOC-005/AC-COVER-001；验收：AC-53。
- **FR-54**：对从当前 decision-log 逐字层独立提取的每条已知来源，按行为、量词、否定、先后、边界、失败条件，核 decision 处置、spec FR/AC 与独立 Phase Task 的真实动作、正反 oracle/证据；从 Task 反查来源。错绑、弱化、只见文件/ID、`semantic_match=true` 自报都不得得到 `consistent`；无法证明同义时保持具名 `unknown/inconsistent` 并交独立语义复核。依据：U-008/U-009、D-032/D-033、CARD-02 AC-DOC-003/AC-FLOW-002/AC-TEST-001；验收：AC-54。
- **FR-55**：build-plan step 11 在独立 review 处置和最后材料 revision 后实际调用既有 spec-analyze，认证当前 decision-log 逐字来源、spec/index/全部 Phase 的字节与结果身份，经现有 stage quality writer 发布并读回。技能声明、review packet 或本地检查不能替代执行；missing/unavailable/material_incomplete/inconsistent 不改成通过，不妨碍同 task 修复。只有 CARD-02 母 PRD 每个原始要求及每条原始 AC 均有同义实现与质量证据、新模板及当前填充材料实测明显优于开发前执行前工作包时，U-008/U-009 的 main 提交条件才成立。依据：U-008/U-009、D-032/D-033、CARD-02 AC-HANDOFF-001；验收：AC-55。

## 6. 模块划分

### 最小入口与事实派生
- **负责什么**：接收模糊需求/痛点，拆出标明来源的派生事实。
- **对外提供什么**：逐字原文、派生候选、待核对项。
- **依赖谁**：用户最小输入。
- **测试边界**：缺完整字段仍能继续，派生不冒充原话。

### 研究与发散
- **负责什么**：外部方案、内部结构、变化角度和候选空间。
- **对外提供什么**：带 origin 的候选与可证伪大纲。
- **依赖谁**：最小入口与当前 OI。
- **测试边界**：至少一个真实新方向，完整研究可回读。

### 审查与收敛
- **负责什么**：早期异源挑战、问题分级、逐模块确认和 blind reconstruct。
- **对外提供什么**：现行结论、放弃清单、确认/风险事实。
- **依赖谁**：研究与发散输出、真实用户答复。
- **测试边界**：不可用不伪绿，历史不覆盖，漏项必失败。

## 7. 关键实体

- **VerbatimStatement**：逐字用户声明；字段为稳定 ID、说出者、场景、原文、内容 hash。
- **DerivedItem**：agent 派生项；字段为 ID、source anchors、状态、受原话变化影响标志。
- **OutlineItem**：唯一 OI；字段为 ID、版本、问题、状态、影响维度、处置、证据、验收、反例。
- **DivergenceCandidate**：候选方向；字段为 ID、angle、origin、内容、推荐标志与理由。
- **CurrentConclusion**：由 append-only 决策推导的当前视图；不覆盖历史决策。
- **QuestionCard**：需用户决定的问题；字段为分类、2～3 互斥选项、推荐、后果、风险、替代方案。

## 8. 数据和生命周期

- **数据粒度**：原话、派生项、OI、候选、决策和问题卡分别独立编号。
- **数据时效**：原话和历史决策不可变；现行结论、OI 状态和模块状态随追加记录更新。
- **缺失或迟到**：研究/review/答复缺失保持 unavailable/incomplete，不补写默认成功。
- **预览与正式**：大纲 r0 是可证伪草案；用户确认后的现行结论才是正式方向。
- **当前与历史**：当前视图由历史追加记录推导；历史只读保留。
- **归属与清理**：当前四材料归任务 worktree；质量原件归 task store；只按正式 close 清理。

## 9. 兼容性预留

- **既有消费方**：历史/pre 记录继续只读；post writer 不恢复 build-spec 或 aggregate。
- **命名预留**：保留 FR-33～FR-38/AC-33～AC-38；新增项从 39 继续。
- **容器预留**：现有 decision-log/OI/quality facts 内扩展，不新增第五材料。
- **状态预留**：unknown、unavailable、incomplete、deferred 均为一等状态。
- **扩展边界**：CARD-03/04/06 的职责只留交接，不在本卡实现。

## 10. 明确不做与默认必须成立

### 明确不做

- **NG-001**：页面、视觉或前端交互改造（OI-017）。
- **NG-002**：新 stage、gate、public command、第五材料或替代控制面（D-017/D-018）。
- **NG-003**：第四套 coverage validator（D-018）。
- **NG-004**：全量原子需求账本（D-021/D-023）。
- **NG-005**：审查工具替换、provider 对比或 go/no-go（OI-017）。
- **NG-006**：CARD-03 通用子代理机制、CARD-04 oracle 机制、CARD-06 其余删除面（D-028/OI-016）。
- **NG-007**：回写母 PRD、迁移或改写历史记录（D-003/D-020）。
- **NG-008**：把 unavailable、空 findings 或记录成功写成质量通过（D-002/D-027）。

### 默认必须成立

- 配置声明的 provider/role/transport 为审查事实来源；失败保真。
- 主会话保留规划、派发与交互职责；重读量工作使用独立上下文。
- 质量事实不是工作许可证；缺失质量降低完成声明，不阻止同 task 修复。
- 任何新控制面必须有真实 consumer、owner、test 和删除条件。

## 验收流程

从 SCN 定位 FR，再定位 Appendix A 的同号 AC；build-code 按 phase 中同一 oracle 执行 RED/GREEN并发布原始证据，verify-code 回读当前快照证据。任何 missing/unavailable/incomplete 保留原状态。

## 测试标准

每个行为切片使用同一 RED/GREEN 命令、同一 oracle ID 和任务相对 evidence path；精确命令只在所属独立 Phase 文件。CARD-02 物理材料合同先以缺 Phase、额外 Phase、索引漂移和旧 plan/tasks 代偿负例证伪，再在当前 CARD-07 task 跑真实读回。

## 架构边界

全局架构沿已有 WorkflowHub seam 原位扩展，不新增 stage、公共命令或第二 topology registry：portable skills 负责 research/Talk/decision 的作者行为；`material-workspace` 与 task kernel 负责 cohort-aware 材料集合和身份摘要；正式 build-plan handler 只读物理 Phase 文件；build-code/verify-code 从同一索引进入工作包；review 和质量事实保持独立。CARD-01 `task-topology.mjs` 是唯一 topology owner。精确写集、命令和回滚属于各 Phase 文件，不在本节复制。

### CARD-02 缺口修复

- **设计根因**：CARD-02 的 make-decision/spec 已明确每 Phase 独立文件；当时 build-plan 却没有规定 Phase 路径、文件发现、身份绑定和缺件失败 oracle，P1 仍只改既有 plan/tasks 模板。此处把 post 物理集合定为 `spec.md`、`phases/index.md` 与 `phases/P1.md…Pn.md`，索引列出连续唯一 Phase；decision-log 仍是方向权威。
- **实现根因**：旧 `spec-plan` 指令只写 `plan.md`、旧 handler 和 build-code/verify-code 硬读 plan/tasks。post 路径必须直接读取 Phase 原件和索引；pre/history 的四材料路径保留，不能以 in-memory plan/tasks 拼接桥代偿。
- **验收根因**：CARD-02 AC-FLOW-003 曾错绑到 merged-review 测试，无法证伪物理文件缺失；目标测试必须实际生成多 Phase 文件、逐层读回，并验证旧路径不能让缺件变绿。
- **接口与状态**：Phase 索引是纯指针，不是第二正文；Phase 文件自声明写集、依赖、消费者、L0/L1/L2、RED/GREEN 命令与 oracle。身份摘要覆盖同一 Phase 集合；索引缺失、P 号断裂、额外文件、引用越界、正文/索引写集漂移均明确失败。依赖是有向无环图，可并行时不强制串行。
- **恢复与兼容**：post 修复失败时仍可在本 task 继续材料或代码修复，缺失质量如实记 `incomplete`；不改写 CARD-02 归档和旧 task。不可逆 Git 操作另行授权。

### 全局依赖与交付顺序

`P1` 先修 CARD-02 物理材料合同及与 CARD-07 共用的 runtime consumer；`P2` 在该接口上完成 make-decision 作者行为；`P3` 等待两者并跑真实切片与当前范围验收；`P4` 在 P1～P3 当前原件上根治 spec-analyze 的原文分母、语义弱化与末端未执行问题。每 Phase 的精确文件归属、入口条件、测试和 STOP 只在对应文件定义；索引只帮助定位，不改写这些决定。OI-016 已由 U-010/D-035 冻结 owner/边界：CARD-07 实现与集成，CARD-04 仅消费。

## 实现设计（全局权威）

本节只定义跨 Phase 的工程事实、接口与验证策略；具体可改文件、逐 Task 动作和精确命令由相应 Phase 的 L1 唯一维护。CARD-02 旧 `plan.md/tasks.md` 是**执行前细度对标材料**，不成为 post writer、第二权威或进度账。以下锚点均来自当前仓库；没有观测到的执行事实不写成已通过。

### Code Anchors

| 当前代码锚点 | 已核实的现状 / 真实消费者 | 本任务选择与 owner |
| --- | --- | --- |
| `runtime/task/material-workspace.mjs#materialFilesForCohort`、`#inspectMaterialWorkspace`、`#buildStageInputPacket` | 按 cohort 解析当前物理材料及 packet；post 索引列出的 Phase 可进入材料集合，缺件不能由旧文件代偿。 | P1 延伸同一解析 seam，不新建 material registry；build-plan/review/analyze/build-code/verify-code 共用。 |
| `runtime/stage/stage-content-contracts.mjs#validatePostPhaseContract`、`#validateStageSpecAnalyzeProfile` | 已能查物理文件、索引、ID；修订前对一行 Task/空全局设计仍返回 `ok:true`。 | P1 在既有报告型校验内补逐 Task 和全局设计缺失诊断；语义可执行性由原始需求对照和独立读者抽验，不由字段存在冒充。 |
| `runtime/stage/stage-handlers.mjs#officialStageHandler`、`#currentPostPhases` | 正式 build-plan 读物理 Phase 并发布阶段事实；当前 build-code acceptance execution 对 post 仍可能 `unavailable`。 | P1 保持已认证原件与真实质量状态；P3 回读，不以计划命令当执行证据。 |
| `runtime/stage/stage-runner.mjs#runOfficialStage`、`#validateStageSpecAnalyzeOutcome` | 正式阶段和最终分析读取任务身份、材料与质量事实。 | P1/P3 只改现有 consumer/测试；没有 review、用户答复或真实执行时不宣称阶段完成。 |
| `runtime/review/review-record-route.mjs#recordSimpleReviewRequest`、`skills/wh-review/scripts/simple-review-runner.mjs#runSimpleReview` | build-plan packet 认证 cohort 并交付各 Phase 原件；取消/失败有 canonical attempt。 | P1 把原始需求、spec、索引、全部 Phase 交给一次审查；上次被取消的 attempt 只作不可用事实，不复用为当前材料结论。 |
| `tools/cli/stage-runtime.mjs#stageRuntimeMain`、`#deriveCurrentStatusDomains` | 公共入口按 post 四阶段和当前材料报告 status、draft、review、run。 | P1 维持七类公共 runtime，不新增 phase-* 命令或推进门。 |
| `workflows/make-decision/steps.json`、`workflows/make-decision/SKILL.md` | 步骤/说明仍含固定 Talk 顺序与旧 build-spec Clarify 语义。 | P2 在现有 workflow 原位调整研究→发散→direction review→大纲讨论→模块收敛，按真实 OI 回边；不能只换词而保留固定依赖。 |
| `skills/talk-with-zhipeng/SKILL.md`、`skills/deep-research/SKILL.md`、`skills/decision-log/SKILL.md` | 分别是问题卡、研究到达、逐字/决策作者；当前部分说明仍按固定 Round 或摘要出口。 | P2 改已存在的作者合同，不新造同义技能；输出由当前 decision-log 和真实用户可见内容读取。 |
| `runtime/stage/stage-content-contracts.mjs#analyzeDecisionOutline`、`#analyzeDecisionConvergence`、`#buildDecisionCoverageAudit`、`#validateInteractionLifecycleSequence` | 现有大纲、收敛、已知来源覆盖与交互生命周期检查 seam。 | P2 只在真实 producer/consumer 缺口上窄改；本卡测试必须能用空角度、过半证伪、漏 source/强度、零问题与 stale reply 反例证伪。 |
| `runtime/stage/stage-handlers.mjs#buildDirectionReviewInput`、`skills/wh-review/contracts/make-decision.md` | direction review 的输入与挑战边界已经有现有 route。 | P2 保持配置声明的 provider/transport、reconstruct→reveal→challenge 盲边界；`unavailable` 不改为空 findings。 |
| `tests/official-make-decision-cli.test.mjs`、`tests/contract/requirement-convergence-regression.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs` | 是现有公开入口/跨 seam 回归位置，不等于当前目标全部已被这些测试覆盖。 | P3 增加窄 fixture 与目标断言；真实 RED 只认目标断言，环境/collection 失败不算。 |
| `skills/spec-analyze/SKILL.md`、`packet-lens.md`、`runtime/stage/stage-agent-outcome-adapter.mjs` | 旧 adapter 可将 decision-log 全文同时填作原文/决策，并接收调用方自报的 `original_requirements`/coverage；这与从逐字声明层独立提取分母不同。 | P4 修来源协议/旧 adapter；现有 profile validator 从认证 worktree 的当前 decision-log 字节独立提取 U/V 原话及明确原子条目，拒绝包内漏项自证。 |
| `runtime/task/task-kernel-implementation.mjs#decisionCoverageAudit`、`runtime/evidence/codex-transcript-adapter.mjs#isAuthenticatedRequirementResult` | 既有 manifest inventory 与 host transcript 认证能力可作历史/可选来源，但 CARD-07 `task.json.inputs={}`；D-033 已取消二者为本任务原始需求分母的强制前置。 | P4 不新建 raw inventory 或第二来源账本；从当前 decision-log 的逐字层建立分母并回查索引/目标，来源缺失报 `material_incomplete`。 |
| `runtime/stage/stage-content-contracts.mjs#semanticMeaningMatches`、`#validateStageSpecAnalyzeProfile`、`runtime/stage/stage-runner.mjs#runOfficialStage`、`#publishStageEndSpecAnalyzeFact` | 当前短语归一与包内 coverage 能局部比对，却不能证明原文集合完整；正式 run 在无 stage outcome 时只留下 missing 质量事实，不自动执行五输入分析。 | P1 runtime owner 补原文 census/最终执行与质量事实接线；P4 提供技能合同、目标负例和真实入口验收，不以 reviewer packet 代替 stage-end 结果。 |

### Interfaces and Failure Semantics

| 接口/数据边界 | 输入 → 输出及唯一 owner | 明确失败、恢复和兼容语义 |
| --- | --- | --- |
| post 规划材料 | 当前 `decision-log.md` → 含全局实现设计的 `spec.md` → 各 `phases/P<n>.md` → 纯指针 `phases/index.md`；作者 `spec-specify/spec-plan/spec-tasks`。 | 缺/额外/非连续/越界 Phase、索引与正文写集或消费者漂移报 `incomplete`；pre/history 四材料只读，不以 active `plan/tasks` 代偿。 |
| Phase 工作包 | header 声明 Global spec、write set、dependency、consumer；L0 是可观察增量，L1 是逐 Task 可执行卡，L2 只放带过期条件的参考。 | `### Tnnn` 卡缺动作/文件符号、输入输出、同命令 RED/GREEN、目标失败、证据或 STOP 时不能报告“可执行”；真实执行后状态写 task facts/quality，不写回 Phase 当第二账。 |
| make-decision 最小入口 | 用户模糊需求+痛点 → 原文和标源派生 → 可证伪大纲/候选/问题队列；owner=主会话与现有 portable skills。 | 缺完整背景不是拒绝入口；派生不能冒充原话；空角度/选项不足回到研究与发散；零用户问题合法。 |
| 研究与候选 | 外部最佳实践+内部结构事实 → 完整落盘材料、用户可见大白话清单、每条 origin/推荐与反例。 | provider 不可用保留来源和缺口；不能用固定 500 字截断或只有摘要路径宣称完整到达；同义改写不计新方向。 |
| direction review | 未收敛选项空间与配置声明路由 → 挑战 findings 或真实 partial/unavailable；当前选择只在 reveal 后可见。 | 前置选择泄漏、错 provider、坏 packet、transport 失败各自保留原码；没有审查结果不自动变空 findings 或通过。 |
| 收敛与确认 | 已知来源单元/OI/用户逐字答复 → append-only supersession、现行结论及显式用户确认。 | 漏一个已知单元、弱化限定词、双处置/无 owner、旧正文被覆盖或旧答复错绑均报告；缺质量不阻止同 task 修复，但不能宣称完成。 |
| test/review/verify | build-plan 强方预写适用行为的可运行目标测试并记录目标 RED/保护边界 → build-code 只改实现取得同 oracle GREEN → verify-code 抽原始需求/真实消费者/证据。 | 目标测试尚未写成可运行原件或 RED 只是 setup 失败时标 `incomplete`；非行为/G-2 才能凭具体理由 N/A；实施者不得静默改断言，合法变更走显式请求+独立审查；缺执行、provider 或用户确认保留 `unavailable/incomplete`。 |
| post build-code native acceptance | 当前索引 Phase 中唯一 `acceptance_role=acceptance` Task 的 typed `acceptance_data` → 既有私有 command/service runner → 既有逐 AC quality fact/evidence writer；owner=P1/T005，声明=P3/T016。 | 不再从 `tasks.md`、Phase `gate_cmd` 或退出码推导验收；缺失/重复/非法声明为 `unavailable`/`incomplete`，执行失败、超时、取消、清理失败和单 AC 缺证据保留原状态。 |
| 原文→最终分析 | 认证 worktree 的当前 `decision-log.md` 逐字声明层/明确原子条目 → 独立提取的来源分母及索引反查 → 当前 spec/全部 Phase 的双向行为 trace → build-plan 最后 profile 结果 → 既有 quality fact；其 `stage-quality-evidence.v1.subject_fact.analysis_result` 保存原始诊断，由 stage status/readback 和 verify-code 消费。owner=现有 stage writer；若现有 analyzer 被审查后的替代实现取代，则同事务移除此字段。 | 逐字层缺失或无法提取报 `material_incomplete`；包内删项、量词/否定/物理形态弱化报具名 `inconsistent`；正式调用/发布缺失报 `unavailable/missing`。额外 manifest inventory/host transcript 非前置。 |

### Architecture Choices and Dependencies

#### post build-code native acceptance contract

post 不复活旧 `tasks.md` acceptance reader。当前索引列出的独立 Phase Task 中，最多且必须恰有一个 Task 声明 `acceptance_role=acceptance`；本任务由 P3/T016 承载最终逐 AC 矩阵。该卡的 `acceptance_data` 是 JSON 数组，每个 scenario 只允许 `source`、`sample`、`scenario`、`tier`、`execution` 五类字段：本 non-UI task 的 `tier` 为 `command` 或 `service`；command 的 execution 需要 `command`、字符串 `args`、正整数 `timeout_ms`，service 需要 worktree-relative `module_ref`、`export_name`、`input`、正整数 `timeout_ms`。AC 集合来自同一 Task 的 `Source / FR / AC`，不由 scenario 自报第二份分母。

P1/T005 的 reader 从当前 `phases/index.md` 和每个物理 Phase 读取该 typed card，拒绝缺失、重复、越界、旧 tasks 来源、非法 tier/execution 或 AC 为空；合法声明归一化为现有私有 runner 所需的 task/stage/snapshot/material/attempt binding，并继续使用现有 `acceptance_execution` aggregate、逐 AC evidence 和 quality fact writer。`acceptance_data` 只声明要执行什么，不声明已通过；运行时必须比较实际 assertion，exit 0、`gate_cmd`、手写 `executed` 或计划文本均不能替代 per-AC evidence。当前 contract 缺失时保持 `unavailable/incomplete`，不阻止同 task 修复。

#### 行为验收的可观察合同（先于 P2 的目标 RED）

目前 `research-report.v1` 只证明研究原件/来源，交互校验只证明问题卡形状，`analyzeDecisionOutline` 只证明 OI 结构与终态；三者都不能证明 AC-33/34/36/38/42 的完整行为。不能对不存在的字段写关键词断言并称作目标 RED。P2 在修改共享作者流程前，先把下列结果写进**现有** `decision-log.md` 的来源/研究/Talk/大纲段落，并在 P1 所属 `runtime/stage/stage-content-contracts.mjs` 的纯读取边界定义只读解释器；它只返回诊断，不创建第五份材料、第二套状态或新的公共命令。P2 作者是记录的 owner，P1 reader 是消费者，P3 官方入口和 verify-code 是证据消费者。已有原文和旧 OI 不覆盖；缺字段返回 `unknown/incomplete`，绝不默认为零或通过。读者接口和字段语义须先经 OI-016 共享 owner 冻结；若 CARD-04 与此写面冲突，受影响行为停在设计/测试准备，不把以下提案当已实施事实。

| AC | 现有材料中的最小可回读记录 | reader 必须区分的失败 | 目标测试边界 |
| --- | --- | --- | --- |
| AC-33 | 本轮原始用户候选 ID 集、派生候选 ID/`origin`/角度/来源 ref、同义归并组、轮次；保留原始分母。 | 候选数未严格大于原始数、新 `origin` 差集为空、同义换词冒充新方向、来源缺失。 | 先测 reader 的数/差集/同义拒绝，再以正式 make-decision 输出验证生产者；静态技能句子不算业务 RED。 |
| AC-34 | 每条用户可见候选的研究来源、推荐/不推荐理由、摘要、完整材料 ref/path、交付状态；研究原件保持原位。 | 只有内部摘要、全文引用丢失、固定长度截断、provider unavailable 被写成空成功。 | 原件 parser 测试仅证明局部；完整 AC 需要用户可见交付事件与正式输出同一来源绑定。 |
| AC-36 | 当前 OI 未决集合、impact/需用户决定、每次 ask/wait/reply/resume 的轮次与回填版本、零待问/再发散原因。 | 固定三轮空问、必要问题未问、普通项误升级、选项不足仍强问、迟到回复错绑。 | `steps.json` 无固定轮次只证明拓扑；真实动态行为由 OI 与交互事件的同身份读回判定。 |
| AC-38 | 每轮问题批次的互斥选项、推荐/含义/后果/风险、至少一个替代、错误清单自检结果与证据。 | 任意一轮缺替代或自检、只在第一轮填写、用 prose 自称检查过。 | 问题卡形状单测是局部；逐轮原件与负例才证明完整 AC。 |
| AC-42 | `outline_version` 下五个可证伪假设及证伪依据、被废弃版本、新版重画来源。 | 过半证伪仍修补旧版、静默改写原假设、只有版本号而无证伪来源。 | OI 终态测试不够；需同一 outline lineage 的 5→3→废弃→新版本目标断言。 |

`build-plan` 预写 RED 的认证也有同类缺口：当前正式 handler 的 `no_prewritten_test` 仅看 Phase 中命令/oracle 字段，未调用已有 `testFacts`，没有测试文件 hash、目标断言失败、命令输出与冻结边界的可信绑定。本任务不能据此报告 AC-52 完成。P1/T003 应复用现有 task facts/quality test receipt 记录测试文件路径/hash、目标 assertion 名称、同命令、非零退出、原始输出 ref、当前材料/工作树身份和冻结 hash；正式 build-plan 只在逐项认证后报告该自检成立，收集/环境失败或仅有 Phase 文案都保持 `incomplete`。build-code 比对冻结 hash，合法改动需显式理由、旧证据和独立复核；不新增平行 RED ledger。

#### Phase 4 原文分析的生产者与校验边界

旧路径的致命缝隙不在“没有写检查要求”，而在**检查分母和执行事实都由同一个包自报**：旧 adapter 可把 decision-log 全文填进 `original_requirement`，`original_requirements` 与 coverage 同时漏掉一条仍内部一致；`semanticMeaningMatches` 的归一/包含判断可把“每轮”弱成“某轮”；manifest/deps 只声明 final step，正式 `runOfficialStage` 未取得 stage outcome 时没有五输入分析，仅发布 missing。D-033 现将**认证 worktree 中当前 decision-log 的逐字声明层和明确原子条目**定为本任务原始需求权威，不再要求额外 manifest raw inventory/host transcript。P4/T017～T019 用三组相互独立的证据约束：①从当前文件字节/位置独立提取 U/V 原话与原子单元，反查原始需求索引，不能由索引或 packet 自报缩小分母；②原话→spec→Task 的强度/失败 oracle 对照；③最后材料版本上的真实执行与 quality fact 读回。未分类/含糊原话保留 unknown，并由独立语义读者检查，不建永久原子台账。**当前路径的目标接线**由现有 runner 在 handler 后、事务发布前从认证 worktree 的当前 decision-log 和 `preflight.materials` 构造独立来源 census，先调用既有 `validateStageSpecAnalyzeProfile(strict_material_contracts=true)` 产保守结构结果，再经当前会话的私有 `publication.runSpecAnalyze` 真正执行 portable lens 并逐字段认证返回；结果带 source hash、skill bundle hash 与当前身份供 `publishStageEndSpecAnalyzeFact` 单点发布。缺可信回调或直接 shell CLI 无 host service 时如实 `unavailable`，不能把 JS profile 的 skill_id/hash 当真实技能执行，不接受 invocation 自报 `consistent`，也不借 legacy Stage Agent outcome。逐字来源缺失为 `material_incomplete`，无真实调用/发布为 missing。既有 profile/writer 为唯一生产接线；技能只是执行方法，不能自写 `consistent`。独立 review 对未能机器证明的同义关系出 findings；未知保持 unknown，不以正则或高分覆盖。此段是目标设计，不能视为当前代码已实现。

- **复用与扩展**：保留现有 task kernel、material workspace、stage handler、review route、make-decision skills 与公开 CLI。只在其既有 writer/reader/validator 处改物理材料和内容合同；新增生产文件需在对应 Phase 说明 consumer、owner、测试、替代/删除条件。拒绝第二 topology registry、复活 plan/tasks 双写或以兼容桥隐式拼接旧正文。
- **单一权威**：母 PRD 独占跨卡产品目标；当前 decision-log 保留用户原话与已确认方向；spec 是本 task 产品验收和全局工程设计；每 Phase 是本包差异与逐 Task 执行设计；index 只定位；task facts/quality 才记实际执行。`material_revision` 只是现有 runtime 身份与漂移诊断，不嵌入文档指针、不充当新工作许可证，符合母 PRD SD-17。
- **生产者顺序**：P1 固定 post 材料/作者/审查/下游接口和可执行模板；P2 在其上改 make-decision 作者行为；P3 读取两者做真实入口和逐 AC 回读；P4 在当前真实样本上修原文分母/末端技能，并要求 P1 runtime owner 完成最终分析接线。Phase 之间只依赖真正交接的接口，不用编号强制假串行；各文件的唯一 Phase owner 在 `phases/index.md` 可定位，逐 Task 精确子集只在 Phase L1。
- **共享写面前置**：母 PRD CARD-07 与 CARD-04 共用 make-decision 接口。U-010/D-035 已冻结唯一 owner= CARD-07、artifact=`decision-log.md`、CARD-04=后续只消费；当前 pre/post completion 不再消费 aggregate/outline gate，历史记录只读。共享合同的定向 RED→GREEN 已通过；不把这组测试冒充正式 stage quality 或 CARD-04 已适配。后续 CARD-04 不得重建 aggregate store、outline gate、公共命令或第二 writer。
- **回滚与保留**：只回滚本 Phase 未验证的实现改动；保留原始 review、失败测试、材料版本和用户答复，不用删证据取得绿灯。commit/push/merge/archive/cleanup 仍需各自授权；build-plan 不执行 build-code 的 GREEN。

### CARD-02 原始遗漏的五个断点与本任务反例

| 断点 | 可核对根因 | 本任务的防复发反例/owner |
| --- | --- | --- |
| 来源到方案 | 母 PRD R-002 和 CARD-02 D-002 要独立 Phase；旧计划 `NEW=N/A`、只改 plan/tasks 模板，将独立误译为单文件章节。 | 删除一个原始 R/U 单元，trace 必须报具体缺口；P1 负责原始分母与物理文件负例。 |
| 真实内容质量 | CARD-02 将弱模型真实 task 抽验后置 CARD-10；本轮新模板又以一行 Task 代替旧逐卡细度，spec 未填全局设计。 | 保持物理文件但删动作/代码符号/目标 RED，报告不可执行；P1 修模板，P3 做只读 spec+单 Phase 抽验，CARD-10 后续弱模型实跑仍 `deferred`。 |
| 实现对计划 | CARD-02 build-code 实现了缩窄计划的 `plan.md` Phase 章节和 `tasks.md` 指针，未落实母 PRD 的物理/可执行原意。 | 反向扫描 active writer/reader/validator 与实际新建 task；缺 Phase 不得由旧文件代偿，P1 owner。 |
| 一致性自证 | 原 AC-FLOW-003 错绑 merged-review 测试；新 validator 的简版正例也以关键词齐全报 `ok:true`，没查同义行为。 | 错绑 AC-33/AC-38、只有 ID/一行 Task 的 fixture 均不能报一致；结构结论与独立语义意见分别记录，P1/P3 owner。 |
| 末端回溯 | CARD-02 归档正式 spec-analyze publication `unavailable`，未有可证正式 verify-code 逐母 PRD 回读原件；不能说“verify 跑过却漏报”。 | 未来 verify-code 从本次已接受原始要求抽实现/真实证据；缺原件留 missing，不由绿测试名称推 achieved，P3 owner。 |
| analyzer 包内自证 | adapter 曾将 decision-log 全文直接充原文，调用方同时报 `original_requirements`/coverage；删逐字条目再删 coverage 仍能自洽，正式 run 缺 outcome 时仅记 missing。 | P4 从认证当前 decision-log 的逐字层独立建分母并反查索引，runtime 验真实最后调用/发布；删中间原话、弱化“每轮”、仅声明未执行三种负例分别命名。 |

### Requirement-to-Task Trace

本表是来源到**计划中执行合同**的桥，不复制 Appendix A 的验收正文。每个 P/T 必须在对应 Phase L1 有独立卡，行中 `ORACLE-*` 的失败信号由卡内明确；历史/延期来源不冒充已完成。修订 Task ID 时须同步此表和 Phase，而不是只改索引。

目前 U/R/PRD 锚点来自当前 decision 与母 PRD 路径；D-033 已指定当前 decision-log 逐字声明层为本任务分析来源，但正式 reader 尚需从文件字节/位置独立提取 U/V 原话及明确原子条目并反查 R 索引。P4/T017 是本表提升为“原文独立分母”的前置，完成前 AC-53/54 不得标 achieved；以下 ID 齐全只是计划追踪，不是语义全覆盖证明。母 PRD 仍单独用于 CARD-02 历史条件验收。

| Source / decision | FR / AC | Phase / Task | Oracle / planned evidence | Dependency / status boundary |
| --- | --- | --- | --- | --- |
| R-030、R-031、U-006；母 PRD CARD-02 | FR-47 FR-49 FR-50 FR-51 / AC-47 AC-49 AC-50 AC-51 | P1/T001 | ORACLE-RAW-TRACE-001；空壳/漏来源/错绑目标 RED | 先建立判据；不以测试收集失败充 RED |
| R-030、R-031、U-007；母 PRD CARD-02 | FR-47 FR-50 FR-52 / AC-47 AC-50 AC-52 | P1/T002 | ORACLE-PHASE-EXECUTABLE-001；作者/模板/deps 负例 | 预写目标测试保留，旧 pre 可读 |
| R-030、R-031、R-032、R-033、U-008/U-009；母 PRD CARD-02 | FR-46 FR-47 FR-48 FR-53 FR-54 / AC-46 AC-47 AC-48 AC-53 AC-54 | P1/T003 | ORACLE-CARD02-PHASE-FILES-001 与 ORACLE-CARD07-P4-SOURCE-001/SEMANTIC-001；缺 P2/旧文件代偿/逐字层漏项/弱化负例 | P1 自写目标测试并交付 reader，P4 后复核/返修；身份是诊断非新 gate |
| R-030、R-031；母 PRD CARD-02 | FR-48 FR-52 / AC-48 AC-52 | P1/T004 | ORACLE-POST-REVIEW-001；完整 packet/错 cohort 负例 | provider 结果缺失保持 unavailable |
| R-030、R-031、R-032、R-033、R-035、U-002、U-008/U-009/U-010 | FR-36 FR-40 FR-44 FR-48 FR-52 FR-55 / AC-36 AC-40 AC-44 AC-48 AC-52 AC-55、原 AC-CLEAN-001 | P1/T005 | ORACLE-POST-CONSUMER-001 与 ORACLE-CARD07-P4-PUBLICATION-001；下游同集合/最终分析缺执行保真 | D-035 使 CARD-07 成为唯一 shared-interface owner；P4 仍不把未来 E2E 写成当前通过 |
| R-030、R-031、R-035、U-005、U-007、U-010 | FR-49 FR-50 FR-51 FR-52 / AC-49 AC-50 AC-51 AC-52、原 AC-CLEAN-001 | P1/T006 | ORACLE-CARD02-ORIGINAL-001；母 PRD 当前样本与 current aggregate/outline consumer 对照 | 原 22 AC 缺证据保持 incomplete |
| U-002-01、U-002-05；CARD-07、D-009/D-011/D-013/D-025 | FR-33 FR-39 FR-42 / AC-33 AC-39 AC-42 | P2/T007 | ORACLE-CARD07-P2-T007；首轮增量/origin/最小入口/重画 | OI-016 共享接口前置 |
| U-002-03、U-002-04；CARD-07、D-015 | FR-34 / AC-34 | P2/T008 | ORACLE-CARD07-P2-T008；完整研究交付 | 不用截断摘要代替全文 |
| U-001、U-002-07、U-002-23/24、R-034；CARD-07、D-002/D-008/D-014/D-017/D-026/D-034 | FR-40 FR-43 / AC-40 AC-43 | P2/T009 | ORACLE-CARD07-P2-T009；顺序、未收敛审查与方案/验收的本阶段用户共同梳理 | unavailable 不写空 findings |
| U-002-07、U-002-20；CARD-07、D-012/D-016/D-017 | FR-36 FR-38 FR-41 / AC-36 AC-38 AC-41 | P2/T010 | ORACLE-CARD07-P2-T010；逐轮替代/自检/问题分级 | 普通问题不占用用户 |
| U-002-06、U-002-12；CARD-07、D-010/D-017/D-020 | FR-35 FR-37 / AC-35 AC-37 | P2/T011 | ORACLE-CARD07-P2-T011；逐字/append-only | 旧正文只读保留 |
| U-002、CARD-07、D-018/D-021/D-023/D-024 | FR-44 FR-45 / AC-44 AC-45 | P2/T012 | ORACLE-CARD07-P2-T012；已知分母/盲重建泄漏 | 已知范围非穷尽 |
| U-001、U-002、PRD-CARD-07 | FR-33 FR-34 FR-35 FR-36 FR-37 FR-38 FR-39 FR-40 FR-41 FR-42 FR-43 FR-44 FR-45 / AC-33 AC-34 AC-35 AC-36 AC-37 AC-38 AC-39 AC-40 AC-41 AC-42 AC-43 AC-44 AC-45 | P3/T013 | ORACLE-CARD07-JOURNEY-001；真实入口目标 RED/具名失败 | 与 T014 同命令，环境失败不算 RED |
| U-001、U-002、PRD-CARD-07、D-002 | FR-33 FR-34 FR-35 FR-36 FR-37 FR-38 FR-39 FR-40 FR-41 FR-42 FR-43 FR-44 FR-45 FR-46 / AC-33 AC-34 AC-35 AC-36 AC-37 AC-38 AC-39 AC-40 AC-41 AC-42 AC-43 AC-44 AC-45 AC-46 | P3/T014 | ORACLE-CARD07-JOURNEY-001；同命令 GREEN/失败保真 | 不以绿汇总替逐 AC 成功 |
| U-005、U-006、U-007、PRD-CARD-02 | FR-47 FR-48 FR-49 FR-50 FR-51 FR-52 / AC-47 AC-48 AC-49 AC-50 AC-51 AC-52 | P3/T015 | ORACLE-CARD07-MATERIAL-TRACE-001；当前物理材料/执行前细度读回 | 弱模型真实 E2E 留 CARD-10 deferred |
| U-001、U-002、U-005、U-006、U-007、PRD-CARD-02、PRD-CARD-07 | FR-33 FR-34 FR-35 FR-36 FR-37 FR-38 FR-39 FR-40 FR-41 FR-42 FR-43 FR-44 FR-45 FR-46 FR-47 FR-48 FR-49 FR-50 FR-51 FR-52 / AC-33 AC-34 AC-35 AC-36 AC-37 AC-38 AC-39 AC-40 AC-41 AC-42 AC-43 AC-44 AC-45 AC-46 AC-47 AC-48 AC-49 AC-50 AC-51 AC-52 | P3/T016 | ORACLE-CARD07-AC-MATRIX-001；每 AC 独立状态/证据矩阵 | 总 oracle 只验矩阵保真，不替各 AC 业务 oracle |
| U-008/U-009、R-032/R-033、D-032/D-033 | FR-53 / AC-53 | P4/T017 | ORACLE-CARD07-P4-SOURCE-001；包内自洽漏中间原话/伪 hash/索引漏项 | 当前 decision-log 逐字层缺失为 material_incomplete |
| U-008/U-009、R-032/R-033、D-032/D-033 | FR-54 / AC-54 | P4/T018 | ORACLE-CARD07-P4-SEMANTIC-001；每轮/独立文件/否定弱化及错绑 | 不可机器判定者留独立语义复核 |
| U-008/U-009、R-032/R-033、D-032/D-033 | FR-55 / AC-55 | P4/T019 | ORACLE-CARD07-P4-PUBLICATION-001；仅声明未执行/发布负例 | runtime 正式接线是前置 |
| U-008/U-009、R-032/R-033、D-032/D-033、PRD-CARD-02 | FR-53 FR-54 FR-55 / AC-53 AC-54 AC-55 | P4/T020 | ORACLE-CARD07-P4-AC-MATRIX-001；22 条原始 AC 状态与质量对照 | 母 PRD 原件或冷读失败不提交 main |

### Global Verification Strategy

本任务当前材料与作者合同的定向入口为 `npx --no-install vitest run tests/contract/post-phase-contract.test.mjs tests/contract/post-phase-official-handler.test.mjs tests/contract/post-cohort-executable-authoring.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --reporter=dot`；它只证明这些命名断言，不自动给任何产品 AC 标 achieved。每个行为 Task 的 RED/GREEN 精确命令、目标失败及证据由该 Task 卡唯一指定。

P4 的独立来源、语义强度与正式调用目标入口分别在 P4/T017～T019；现有测试/文档未等于目标 RED，当前 build-plan 的 stage-end analyzer 缺真实同身份结果，须保持 `incomplete/unavailable`。P4/T020 的 22-AC 审计是 U-008 条件提交判断，不由单一 exit 0 推导。原始 CARD-02 原件及当前质量对照只读保留；用户授权不免除先验证条件。

| 风险维度 | build-plan 预写/指定的证伪方式 | 后续执行与完成边界 |
| --- | --- | --- |
| 原始需求强度 | 在当前 spec 逐项对照母 PRD，特别 AC-33 候选数、AC-38 **每轮**自检、CARD-02 AC-07～09；删一项或弱化限定词须报 source ID。 | P1/P3 只设计和验证材料/测试合同；业务达成由 build-code 实跑证据决定。 |
| 物理与内容合同 | 缺/额外/越界 Phase、index 复制正文、重复 write owner、空全局设计、只有一行 Task、缺动作/符号/目标 RED 的定向 fixture。 | 结构测试 exit 0 仅证明这些断言；独立 reviewer 还须判断“只读 spec+该 Phase 是否能实施”，不能由字数或 ID 集齐代替。 |
| 用户流程/状态 | 最小痛点、研究不可用、零问题、选项不足再发散、过半假设证伪、stale reply、盲重建泄漏、append-only 取代。 | 每个真实受影响行为由 Phase Task 指定同一 `gate_cmd` 的 RED/GREEN、oracle/evidence；不得跑无范围全量回归。 |
| review/质量事实 | post merged packet 交 raw+spec+所有 Phase；模拟 provider unavailable、材料身份漂移、AC 错绑和审查输出无效。 | 首轮 attempt 终态与 findings 原样保留；取消/不可用不复派相同 packet 求 clean，不把审查意见变工作许可证。 |
| 独立执行抽验 | 抽 P1 材料 seam 与 P2 一个用户可观察切片，只给独立执行者当前 spec、索引、该 Phase，要求指出首个代码锚点、目标断言、GREEN、恢复与尚需澄清。 | CARD-10 的真正弱模型 E2E 仍 deferred；本卡只可报告抽验范围，不外推整体可执行。 |

预写测试原件与执行输出必须分开：build-plan 负责适用行为测试文件、目标断言、同命令 RED 的真实观测及 DO NOT TOUCH；build-code 负责同 oracle GREEN。实际命令/输出、provider result、人工确认只在相应阶段的 canonical facts/quality 中记载。尚无原件或目标 RED 时只能说 `incomplete`；不得把计划正文当已运行证据。

## Appendix A — 验收判据（唯一权威）

- [ ] **AC-33 — 真发散**
  - **需求**：FR-33
  - **验证方法**：以模糊需求观察首个发散周期。
  - **通过条件**：首轮发散候选数大于用户原始候选数，且至少一条经 origin 差集确认为非用户原始方向。
  - **失败条件**：候选数未增加，或产物仅为原候选重排、改写、同义扩写。
  - **证据类型**：`test` + `evidence`
- [ ] **AC-34 — 研究完整到达**
  - **需求**：FR-34
  - **验证方法**：核对用户可见摘要和完整引用。
  - **通过条件**：候选、推荐/不推荐、来源和完整材料引用齐全，无固定长度截断。
  - **失败条件**：全文不可回读、候选缺来源，或只交付截断摘要。
  - **证据类型**：`test` + `evidence`
- [ ] **AC-35 — 双层保真**
  - **需求**：FR-35
  - **验证方法**：抽查原始声明、派生项、偏离和原话变更后的依赖项。
  - **通过条件**：原文逐字不变；派生有来源；结论落三档；偏离有原因；受影响派生标待复核。
  - **失败条件**：任一原文被改写、派生无来源、偏离无原因或依赖未失效。
  - **证据类型**：`test` + `evidence`
- [ ] **AC-36 — 动态交互与再发散**
  - **需求**：FR-36
  - **验证方法**：覆盖零问题、真实未决项和选项不足三种路径。
  - **通过条件**：无固定轮次；零问题合法；角度空缺回到发散。
  - **失败条件**：为凑轮次提问、零问题异常或强行收敛。
  - **证据类型**：`test`
- [ ] **AC-37 — Append-only 收敛**
  - **需求**：FR-37
  - **验证方法**：制造结论修正和缺口发现。
  - **通过条件**：旧正文保留，新取代关系与现行结论追加。
  - **失败条件**：旧条目被改写、覆盖或删除。
  - **证据类型**：`test` + `evidence`
- [ ] **AC-38 — 大白话问题卡**
  - **需求**：FR-38
  - **验证方法**：逐轮检查实际问题卡与本轮错误清单自检记录，不用单张样例代替整轮范围。
  - **通过条件**：每轮至少一条替代方案及一份错误自检；问题卡最多 3 个互斥选项，含推荐、含义、后果、风险，语言为大白话。
  - **失败条件**：任一轮无替代方案/错误自检，或选项不互斥、缺风险、堆砌内部黑话。
  - **证据类型**：`test` + `manual`
- [ ] **AC-39 — 最小入口**
  - **需求**：FR-39
  - **验证方法**：只输入模糊需求和痛点。
  - **通过条件**：流程继续；缺失内容标为派生或待核对，不冒充用户原话。
  - **失败条件**：因用户未填完整字段而阻塞，或派生被写成用户事实。
  - **证据类型**：`test`
- [ ] **AC-40 — 顺序与防遗忘**
  - **需求**：FR-40
  - **验证方法**：观察研究、审查、大纲讨论、逐模块收敛顺序和回显；对一个重要/方向/真实模糊的实现方案及一个验收标准，读回 make-decision 中 agent 提议→用户问答→同版模块裁决；对只有后续 spec/AC、没有本阶段用户答复的负例做拒绝。
  - **通过条件**：审查在研究发散之后、大纲讨论之前；定向后才逐模块收敛；每轮回显模块状态；两类讨论在 make-decision 有可回读的用户参与和裁决，普通细节仍由 agent 采用并披露假设。
  - **失败条件**：先定大纲再研究、审查晚于收敛、进度不可见，或仅因后续 spec 含实现方案/验收标准就宣称用户已共同梳理。
  - **证据类型**：`test` + `evidence`
- [ ] **AC-41 — 提问分级**
  - **需求**：FR-41
  - **验证方法**：用重要、方向、模糊、普通问题检查路由。
  - **通过条件**：用户问题全属前三类；普通问题有最小合理假设和披露。
  - **失败条件**：普通问题占用用户，或方向问题被静默决定。
  - **证据类型**：`test`
- [ ] **AC-42 — 可证伪大纲重画**
  - **需求**：FR-42
  - **验证方法**：提供 5 个假设并证伪至少 3 个。
  - **通过条件**：旧大纲标废弃，新版本在用户讨论前产生，并列出被证伪假设。
  - **失败条件**：仅修补旧大纲、静默删除失败假设或未重画即讨论。
  - **证据类型**：`test` + `evidence`
- [ ] **AC-43 — 审查挑战与失败保真**
  - **需求**：FR-43
  - **验证方法**：观察可用和不可用 direction review。
  - **通过条件**：输入含未收敛空间；输出只挑战；不可用保留完整错误事实。
  - **失败条件**：审查替用户选方向/生成候选，或不可用被改为空 findings/通过。
  - **证据类型**：`test` + `evidence`
- [ ] **AC-44 — 已知需求唯一处置**
  - **需求**：FR-44
  - **验证方法**：对完整清单和故意漏一项的清单运行覆盖检查。
  - **通过条件**：完整清单逐项唯一处置、汇总可复算并显示“已知但非穷尽”；漏项负例失败。
  - **失败条件**：漏项放行、重复冲突处置或汇总不可复算。
  - **证据类型**：`test` + `evidence`
- [ ] **AC-45 — Blind reconstruct**
  - **需求**：FR-45
  - **验证方法**：检查正常重建和提前携带当前选择的负例。
  - **通过条件**：重建不含当前选择/推荐/排序；揭示后才可见；负例被拒绝。
  - **失败条件**：重建提前看到已选方案迹象，或负例被接受。
  - **证据类型**：`test`
- [ ] **AC-46 — Post build-plan 冷启动**
  - **需求**：FR-46
  - **验证方法**：post task 仅有 decision-log 时检查 status 和 build-plan 作者链。
  - **通过条件**：status ready，只要求 decision-log；build-plan 可依次生成 spec、各自独立的 Phase 文件和纯指针索引，topology 不含 build-spec。
  - **失败条件**：要求预存 spec、要求运行 build-spec，或任务仍投影五阶段。
  - **证据类型**：`test` + `evidence`
- [ ] **AC-47 — 每 Phase 独立文件与单一权威**
  - **需求**：FR-47
  - **验证方法**：给定至少两个 Phase 的 post task，生成后逐文件核对 `phases/P<n>.md` 的 L0/L1/L2、写集/依赖/消费者、测试/STOP；再核对 `phases/index.md` 每行只指向对应文件。
  - **通过条件**：每个 Phase 有一个可单独读取的物理文件，索引与正文一一对应，索引不复制命令、oracle 或完成事实；spec 含四件翻译和全局实现设计。
  - **失败条件**：Phase 仅是 `plan.md` 内章节、索引指向 plan、缺某个 Phase、或索引复制工程正文。
  - **证据类型**：`test` + `manual`
- [ ] **AC-48 — 正式路径消费同一 Phase 集合**
  - **需求**：FR-48
  - **验证方法**：在 post 和 pre task 各运行正式 status/build-plan 下游材料读取，修改一个 Phase 后比较 material revision；输入缺失、额外和越界 Phase 负例。
  - **通过条件**：post 读取 spec/index/全部独立 Phase，变更任何 Phase 使身份变化；build-code/verify-code 读回同集合；pre/history 四材料仍可读。
  - **失败条件**：post 仍要求 plan/tasks、Phase 被归类为 non-material、缺 Phase 被旧文件代偿、或 pre 误读 post 材料。
  - **证据类型**：`test` + `evidence`
- [ ] **AC-49 — CARD-02 原始需求验收纠偏**
  - **需求**：FR-49
  - **验证方法**：从母 PRD CARD-02 R-002/AC-07/08/09 反向追到本 task 当前 spec、双 Phase 以上原件、索引和正式消费者；执行物理缺件、重复写面及原验收错绑负例。
  - **通过条件**：AC-07 四件 spec 内容可定位；AC-08 每份 Phase 只含本包差异并可独立读回；AC-09 post 不再产 active plan/tasks 双写，目标断言直接证明这三项。
  - **失败条件**：只靠模板关键词或 merged-review 路由测试判通过、仍生成 plan/tasks 正文、或 verify-code 没有当前需求→产物→证据回读结论。
  - **证据类型**：`test` + `evidence` + `manual`
- [ ] **AC-50 — 新材料保持可执行细度**
  - **需求**：FR-50
  - **验证方法**：将 CARD-02 合并前 `plan.md/tasks.md` 的执行前字段逐项映射到当前 spec 的全局设计与一个当前 Phase 的每张 Task 卡；独立执行者仅凭 `spec.md`、该 Phase 和纯指针索引说出首个代码符号/编辑、目标 RED、配对 GREEN、失败恢复。
  - **通过条件**：全局代码锚点、接口/状态/失败、取舍、依赖和验证策略有具体值或带 owner/STOP 的真实 unknown；每 Task 有唯一目标、可定位文件/符号与动作、正负 oracle 和证据；旧执行后状态不复制成第二进度权威，执行者无需猜产品选择或工程接口。
  - **失败条件**：只有标题/ID/一行 `Tasks`、一个 Phase 级命令覆盖多个未定义行为、空泛“改相关文件”、缺目标 RED/恢复，或执行者必须自行设计接口与验收。
  - **证据类型**：`test` + `manual` + `comparison`
- [ ] **AC-51 — 原始需求到失败 oracle 双向闭合**
  - **需求**：FR-51
  - **验证方法**：从用户 U-001～U-007、母 PRD CARD-02 R-002/AC-07～09、CARD-07 FR-33～38 的原文逐项正向定位到 D/FR/AC/P/T/正负 oracle/证据，再从每个 Task 反向追源；故意删一个原始单元、错绑 AC-33/AC-38 或只保留 ID 关键词。
  - **通过条件**：已知 current 范围逐条有同义行为与失败信号；缺项和未决保留 owner/影响；三类负例均报告具体来源 ID、遗漏位置与差异，不能从当前摘要自算“全覆盖”。
  - **失败条件**：原始要求被弱化、无来源任务入计划、错绑测试却标 achieved、漏一条 raw 要求仍返回一致，或只因 ID 集齐就判通过。
  - **证据类型**：`test` + `manual` + `trace`
- [ ] **AC-52 — 作者与消费者保留同一可执行合同**
  - **需求**：FR-52
  - **验证方法**：逐一核对 build-plan 的 authoring skill、template、`skill-deps.yaml`、蓝图/路由、合并审查 packet、最终 analyze 及 build-code/verify-code 的真实消费者；模拟预写测试被实施者静默放宽和 review/执行证据缺失。
  - **通过条件**：post 活跃路径均引用 spec+索引所列物理 Phase，蓝图/路由写回所属 Task 卡；适用行为的预写测试原件可运行且目标 RED 非零来自命名断言，测试及 oracle 有明确禁改和合法变更请求路径；审查包含原始需求与全部 Phase；缺少后续 GREEN/验收原件只报 `incomplete/unavailable`，不宣称已验证弱模型执行。
  - **失败条件**：任一 post 依赖仍要求 active plan/tasks、测试改动未审却 GREEN、review 因错误 packet 不见 Phase、verify-code 只报代码绿却漏原始需求/真实消费者，或缺证据被写成通过。
  - **证据类型**：`test` + `evidence` + `manual`
- [ ] **AC-53 — 认证原文独立分母**
  - **需求**：FR-53
  - **验证方法**：给定认证 worktree 的当前 decision-log，其逐字层有 3 条声明/明确原子单元；从 analyzer 包内同时删去中间一条 `original_requirements` 和 coverage，再模拟索引遗漏、伪造来源 hash 或拿派生摘要充原话。
  - **通过条件**：校验从当前文件原字节/位置独立恢复 3 条分母并反查索引，指出缺失 source ID/位置；伪 hash、索引和作者摘要不能代偿；逐字层不可用报告 `material_incomplete`，无需额外 transcript 或 manifest inventory。
  - **失败条件**：包内 2/2 自洽被标 `consistent`，或者只凭原始需求索引/派生决定自报覆盖而不读逐字层。
  - **证据类型**：`test` + `source bytes/hash` + `manual sample`
- [ ] **AC-54 — 原义强度与 Phase 解决路径**
  - **需求**：FR-54
  - **验证方法**：在 ID/文件/覆盖行均存在时，把“每轮替代与自检”改成“某轮”、独立物理 Phase 改成 plan 章节、否定边界反转、正例挂错 AC/失败 oracle；再从 Phase Task 反查授权来源。
  - **通过条件**：每个反例给出原文 span、spec/Phase 目标位置、被弱化的量词/否定/形态或错绑 oracle，结果非 `consistent`；无法证明同义的边界明确 `unknown` 并交独立语义复核。
  - **失败条件**：仅凭字符串包含、`semantic_match=true`、ID 或绿色测试名就计 covered；没有真实任务动作/负例仍报完整。
  - **证据类型**：`test` + `trace` + `independent semantic review`
- [ ] **AC-55 — build-plan 最后真实分析与条件提交**
  - **需求**：FR-55
  - **验证方法**：在 review 处置和最后材料 revision 后调用正式 post build-plan，读回 step 11 的真实 spec-analyze skill outcome、当前 decision-log 逐字来源/材料身份、结果及既有 quality fact；再只读逐条核母 PRD CARD-02 的全部原始要求与 22 AC 和新旧执行前工作包质量。
  - **通过条件**：当前同身份分析真正执行并发布，缺源/弱化/改材料/未调用均非 pass 且可同 task 修复；仅当 CARD-02 母 PRD 每个原始要求与全部原始 AC 都有同义实现/证据、新 spec/spec-template/phase-template 和当前 Phase 冷读明显优于旧 spec/plan/tasks 时才满足 main 提交前提。
  - **失败条件**：manifest 或 review packet 声称执行却无结果；旧 material revision 的一致结论被复用；22 AC 有任一 incomplete/deferred/unavailable、独立实施者仍需猜接口却提交 main。
  - **证据类型**：`official stage readback` + `quality fact` + `22-AC audit` + `independent comparison`

## 12. 风险、未决与交接

- **RISK-001**：可证伪大纲规则曾失效；过半被证伪仍只修补旧版。影响 AC-42；build-code 用强制重画负例验证。
- **RISK-002**：排序/推荐造成锚定。影响 FR-33/AC-33；以 origin 差集和完整候选可展开缓解。
- **RISK-003**：agent 把方向问题错误降级为普通问题。影响 FR-41/AC-41；假设披露且允许用户推翻。
- **RISK-004**：研究无限发散。影响 FR-34/AC-34；以可用方案与角度空缺是否填满作为停止信号。
- **RISK-005**：CARD-07 与 CARD-04 共享写面冲突。影响 FR-40；实现前必须读取 OI-016 并冻结文件/符号/集成责任。
- **RISK-006**：research 支撑被误称为 review 已验证。影响 FR-43；正式审查事实和内部核对分栏。
- **RISK-007**：移除旧 aggregate 后跨宿主批准绑定能力降低。诚实保留限制，不建立替代控制面。
- **RISK-008**：本任务 cohort 是用户授权的手动例外。影响 AC-46；原值、时间、原因和原 task hash 已保留。
- **RISK-009**：CARD-02 的 post 材料合同涉及作者、身份摘要、正式 handler 与下游多个消费者；只改模板会制造“文件存在但正式路径不消费”的假绿。影响 AC-47～AC-49；用真实双 Phase task 与正式入口逐层回读。
- **DEFER-001（已关闭，保留审计）**：CARD-04 共享写面冻结。U-010/D-035 已指定 owner=CARD-07、artifact=`decision-log.md`、CARD-04=consumer；关闭条件已满足。剩余是 CARD-04 适配与正式 stage evidence，不重新打开共享所有权。

## 13. 业务影响与回归范围

### make-decision 用户流程
- **既有行为**：入口偏严、调研/审查晚、固定轮次、普通问题过多、收敛可能覆盖历史。
- **本需求影响**：最小入口、研究驱动发散、早期挑战、动态问题、append-only 收敛。
- **回归路径**：SCN-001～SCN-010。
- **验收**：AC-33～AC-45。

### WorkflowHub 作者链
- **既有行为**：post build-plan 冷启动已修，但产物仍是 plan 内嵌 Phase + tasks 指针，正式 consumer 固定读四材料。
- **本需求影响**：post build-plan 从 decision-log 冷启动后产 spec、逐 Phase 文件和纯指针索引；pre 历史读取保持。
- **回归路径**：post cold start、双 Phase 真实读回、缺件/额外/越界/漂移负例、pre compatibility。
- **验收**：AC-46～AC-49。

- **可能受冲击的业务规则**：历史/pre 可读、review 失败保真、无新增控制面、任务身份显式。
- **明确无影响**：UI、母 PRD、provider 选型、历史归档内容、CARD-03/04/06 独立职责。

## UI applicability

`N/A — non_ui`。来源：U-002、OI-017、D-029；页面、响应式、视觉、浏览器和截图均不适用。
