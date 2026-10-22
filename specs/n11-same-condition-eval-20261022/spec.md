# 功能规格：同条件评测与流程缺口修复（N11）

读者：产品规格作者、P1–P9 实施者、独立审查者与终末验收者。
读完要能：定位本任务要交付什么、每条判据在哪、每个 Phase 改哪些文件、哪些事实仍是未知。

> 基于已确认的 decision-log（状态 `confirmed`，2026-10-22 与 2026-10-23 两次真实确认）。
> 本文件承载产品行为与全局实现设计；`phases/P<n>-*.md` 只写各包差异，`phases/index.md` 只存指针。
> 所有可判定验收正文只在 `Appendix A`；主干只保留稳定指针。

- **功能名**：同条件评测与流程缺口修复
- **来源**：`specs/n11-same-condition-eval-20261022/decision-log.md`（R-001…R-008、P-001…P-005、U-001…U-020、OI-001…OI-004、D-001/D-002/D-004）
- **状态**：草稿；计划待用户确认（decision-log「最终确认」不覆盖的五项仍待对应阶段开工前单独确认）

## 速读卡（30 秒）

- **一句话需求**：用改造前后的同条件真实评测检验 N1–N10 修完的流程，并把「逼人跳过验收」的规则与四类没有真实产出方的能力修到可观察。
- **核心改动点**：
  - 验收默认只跑本任务范围内、最小可证伪的测试；跳过必须留痕。
  - 讨论、计划、写集、测试四处加可判据，不让作者单方放宽。
  - 页面、调研、经验写入、归档四项补真实执行入口。
  - 审查通道修到单路卡死不拖死整组、部分结果可消费。
  - 评测侧三个卡点修通后实跑，判定与成本分列，最后端到端串一次。
- **最大影响面**：`skills/` 与 `workflows/` 方法正文、审查聚合运行时、外部 ModelTest 评测链与用户级 provider 配置。
- **验收信号**：21 个 Task 的具名 gate 命令；25 条 AC 逐条判定与证据原件。

## 来源与决策映射

本节回答：每项需求如何回到原始来源和已确认决定。

| 来源 ID | 决定 ID | FR / AC ID | 状态 / 受影响范围 | 未决 / 交接 |
| --- | --- | --- | --- | --- |
| R-001、R-004 | D-001 | FR-REC-004 / AC-N11-11 | current；N1–N10 抽样修复 | 抽样面在 P5 逐项点名 |
| R-002 | D-002 | FR-REC-001 / AC-N11-14、AC-N11-19 | current；审查通道 | 修复点在运行时聚合 |
| R-003 | D-002 | FR-CAP-001 / AC-N11-15 | current；页面生成与打开 | 无 |
| R-004 | D-002 | FR-CAP-002…004 / AC-N11-16…18 | current；调研、经验、归档 | 归档命令归属见 P4/T011 |
| R-005 | D-002 | FR-PLAN-001、FR-PLAN-002 / AC-N11-6 | current；计划质量 | 无 |
| R-006 | D-002 | FR-ACCEPT-001…004、FR-PLAN-003、FR-PLAN-004 / AC-N11-1…4、AC-N11-20 | current；验收与执行质量 | 无 |
| R-007 | D-001 | 全 Phase 末 facts | current；阶段事实 | 无 |
| R-008 | D-001 | FR-DISCUSS-003 / AC-N11-12 | current；沟通纪律 | 方向/细节审查各一次已产生 4 份汇总，但 `material_coverage` 全 undetermined，只能按「未证明读懂」使用；「主会话少读」由本轮子代理调查执行，无独立 AC |
| P-001 | D-001 | FR-EVAL-001、FR-EVAL-002 / AC-N11-22 | current；评测适配 | 接口形态见 PFACT-005 |
| P-002 | D-001 | FR-RUN-001、FR-JUDGE-003 / AC-N11-5、AC-N11-8 | current；同条件实跑 | 基线哈希见 OPEN-01 |
| P-003 | D-004 | FR-JUDGE-002 / AC-N11-7 | current；成本四组 | cacheRead 来源见 PFACT-007 |
| P-004 | D-002 | FR-REC-003 / AC-N11-9 | current；0 项新采用 | 无 |
| P-005 | D-002 | FR-ACCEPT-005 / AC-N11-10 | current；四项禁止 | 无 |
| U-004、U-005 | D-002 | FR-ACCEPT-001…004 / AC-N11-1…4 | current；验收成本 | 无 |
| U-006、U-011 | D-002 | FR-ACCEPT-006 / AC-N11-13 | current；不新增边界 | 新增脚本登记在 P1 |
| U-007、U-010 | D-002 | FR-ACCEPT-004 / AC-N11-4 | current；测试分级 | 无 |
| U-008、U-009、U-014、U-015 | D-002 | FR-DISCUSS-001、FR-DISCUSS-003 / AC-N11-12 | current；讨论与文字标准 | 分档阈值见 OPEN-04 |
| U-013、U-016 | D-002 | FR-DISCUSS-002 / AC-N11-25 | current；跳步可发现 | 跳步的结构原因由 `research-20261022-plan-code-root-cause.md` 提供，作为 P2/T004 输入，不另设 AC |
| U-017 | D-001 | FR-EVAL-001 / AC-N11-22 | current；评测启动 | 账号额度见 OPEN-05 |
| U-018 | D-001 | FR-RUN-001、FR-RUN-002 / AC-N11-5 | current；基线与实跑 | 无 |
| U-019 | D-001 | FR-JUDGE-001 / AC-N11-23 | current；判定规则 | 判官 provider 见 OPEN-02 |
| U-020 | D-001 | FR-E2E-001 / AC-N11-24 | current；整合端到端 | 被测小任务见 OPEN-03 |
| OI-003 | D-001 | FR-RUN-001 / AC-N11-5 | current；基线提交 | 哈希确认见 OPEN-01 |

U-010…U-020 的最小决定在 decision-log 主文尚未回填，权威原件在任务库 `quality/evidence/decision-log-refs/requirement-change-log.md`（U-010 起逐条有来源锚点）；回填 owner 与处理阶段见 OPEN-06，本表按原件使用，不按已回填的主文假设。

每条 FR/AC 都必须能回到本表；范围修订只追加受影响映射与修订说明。

## 1. 需求解释：问题与紧迫性

N1–N10 的交付没有带来可观察的流程改善。用户观察到的具体失效是：审查经常失败、大纲细化被跳过直接进细节审查、细化只问一两个问题就结束；`answer-as-page` 从未真正打开过页面；调研从未真执行；阶段收口写不了经验；spec 很难归档；N1–N10 虽然开发完但问题大量。

根因不是缺少规则文字，而是四类结构性漏洞：验收规则逼人做全量重跑，成本高到只能跳过，于是「通过」失真；能力只有方法文字没有真实产出方；检查只提醒不拦截；大纲细化没有可判完成的最小结构。本任务先用同条件真实评测把效果量出来，同时把这些漏洞修到可观察，否则后续每个任务都会重复同样的失真。

## 2. 背景、目标与范围

### 背景

现有流程已有五个阶段与大量方法正文；N1–N10 分别交付了成本观测、技能目录、审查与测试方法、写作模板、派发回传、骨架与模块讨论、阶段收口、四级路线、十环核验、检查工具接线。已确认决定 D-001 要求在一个复杂任务内完成评测、验收与修复；D-002 把修法限定为「堵口子＋补真实生产者＋改方法模板」三层；D-004 要求旧结论能补就补、补不了如实改判。

评测侧现状：ModelTest 仓存在且工作树干净（HEAD `50af869f`），但最后一次真实运行是 2026-09-16 且结果为 `incomplete`；桥入口已于 2026-10-04 删除（提交 `457299b3`），此后从未验证「删除后能否跑通」。

### 目标

- 让验收规则不再逼人做全量重跑，跳过高成本验收必须留痕。
- 让讨论、计划、写集、测试四处有可判据，作者不能单方放宽。
- 让页面、调研、经验写入、归档四项有真实执行入口。
- 让审查通道在单路卡死或取消时仍能交付部分结果，并让覆盖字段有真实 producer。
- 让评测链真实启动、同条件实跑、匿名双序判定与成本四组分列，最后用真实小任务端到端串一次。

### 范围内

本任务交付 P1–P9 九个独立结果：验收规则、讨论质量、计划与执行质量、流程能力、记录与结论、评测适配、基线与实跑、判定与成本、整合端到端。范围含 `skills/`、`workflows/`、`docs/`、`runtime/`、`tools/cli/`、`tests/` 与本任务材料，以及用户已授权的 ModelTest 评测侧适配与用户级 provider 配置。

> 非目标只在第 10 节维护，避免两份真相。

## 3. 用户场景与状态覆盖

本节回答：谁在什么条件下触发动作，正常与异常结果是什么。

### SCN-001：维护者跑一个 Phase 的验收

- **角色**：build-code 实施者与 verify-code 复核者
- **前提**：当前 Phase 已声明写集与测试面
- **触发**：执行该 Phase 的 gate 命令
- **结果**：只跑本任务范围内、与该 Phase 改动相关的测试；若确需全局重跑，先说明范围与理由并只跑一次；跳过项写 unverified 与影响面
- **回写**：改动落在 P1 的规则与受控负例；判据见 AC-N11-1…4

### SCN-002：用户看一个工作包的讨论

- **角色**：主会话与用户
- **前提**：工作包骨架已给用户看过
- **触发**：进入该工作包讨论
- **结果**：讨论前看到五类分析与「谁来定」分档；讨论后看到 3–5 句大白话复述并可确认或退回
- **回写**：改动落在 P2 的 Talk 方法与 make-decision 步骤；判据见 AC-N11-12

### SCN-003：计划作者写一条需求

- **角色**：build-plan 作者
- **前提**：decision-log 已确认
- **触发**：把需求写成 Task
- **结果**：每条需求有动作、命令与期望；判据改动必须回到用户；Phase 写集与真实 diff 逐路径可对账
- **回写**：改动落在 P3 的 build-plan 方法与校验器；判据见 AC-N11-6、AC-N11-20

### SCN-004：用户点开任务页面

- **角色**：用户
- **前提**：任务库存在可展示材料
- **触发**：请求看页面
- **结果**：生成 HTML 与同名节点文件，真实打开并读回；打不开时明确记「未自动打开」
- **回写**：改动落在 P4 的 answer-as-page 与渲染脚本；判据见 AC-N11-15

### SCN-005：方向存在真实缺口

- **角色**：主会话
- **前提**：make-decision 第 3 步出现真实未知
- **触发**：需要检索外部事实
- **结果**：实际检索并读原文，产出可回读报告；工具不可用如实记 unavailable
- **回写**：改动落在 P4 的 deep-research 与执行脚本；判据见 AC-N11-16

### SCN-006：阶段收口写经验并归档

- **角色**：阶段主会话
- **前提**：阶段结束且存在值得记的经验
- **触发**：收口
- **结果**：经验写到业务仓 `specs/Improvements.md` 的模块节并读回；归档用一条薄命令完成移动、读回与授权核对
- **回写**：改动落在 P4 的 stage-reflection、stage-closeout 与归档命令；判据见 AC-N11-17、AC-N11-18

### SCN-007：审查两路成功、一路卡死

- **角色**：审查派发者
- **前提**：多路审查中一路无进展
- **触发**：等待或取消
- **结果**：已得意见保留并标 partial 可消费；卡死的一路判终态失败；会话退出；汇总不把已执行结果降为 unavailable
- **回写**：改动落在 P5 的聚合与记录；判据见 AC-N11-14、AC-N11-19

### SCN-008：采用登记与旧结论

- **角色**：维护者
- **前提**：N1–N10 已交付
- **触发**：核对 54 项采用与旧结论
- **结果**：N1/N2 缺失登记补齐或如实记未补；N8「名红实绿」、N10「36/36」、AC-CHECK-6 按事实改正并保留原失败原件
- **回写**：改动落在 P5 的 catalog 登记与纠正记录；判据见 AC-N11-21

### SCN-009：评测链启动

- **角色**：评测执行者
- **前提**：ModelTest 仓与 provider 配置可用
- **触发**：执行固定 cohort 启动命令
- **结果**：任务真实开跑并产出一条真实结果；三卡点修通；已发布资产未改
- **回写**：改动落在 P6；判据见 AC-N11-22

### SCN-010：同条件实跑与判定

- **角色**：评测执行者与判定者
- **前提**：基线与候选代码都可检出
- **触发**：四阶段 × `codex/luna` 各跑一次
- **结果**：失败进分母；匿名双序判定，两次一致才算赢；成本四组分列
- **回写**：改动落在 P7、P8；判据见 AC-N11-5、AC-N11-7、AC-N11-8、AC-N11-23

### SCN-011：整合端到端

- **角色**：用户与阶段主会话
- **前提**：P1–P8 交付完成
- **触发**：用本项目一个真实小问题走完四段
- **结果**：四段真实跑通；失败能归到具体阶段；全 AC 逐条回写
- **回写**：改动落在 P9；判据见 AC-N11-24

### 状态覆盖清单

- [x] **默认态**：SCN-001 的正常验收；SCN-002 的正常讨论
- [x] **空态**：SCN-005 无真实缺口时不启调研；SCN-008 无缺失登记时如实记「未补」而非编造
- [x] **错误态**：SCN-004 页面打不开；SCN-007 审查一路失败；SCN-009 三卡点未修通即启动失败
- [x] **加载态**：N/A — 本任务不改交互式加载视图
- [x] **取消态**：SCN-007 审查取消后部分结果保留
- [x] **边界态**：SCN-010 次数不足或波动过大记「无法下结论」
- [x] **权限态**：SCN-009 ModelTest 写入与用户配置写入按 batch-001 题2 授权；越界即停
- [x] **竞态**：N/A — 本任务无并发共享写入；Phase 写集按依赖定序

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：P1–P9 九个阶段、独立结果与依赖已由用户确认
  - **状态**：`verified`
  - **证据或来源**：`decision-log.md#工作包与决定` 阶段地图（batch-008/009/010 确认）
  - **关联**：FR-ACCEPT-001、FR-DISCUSS-001、FR-PLAN-001、FR-CAP-001、FR-REC-001、FR-EVAL-001、FR-RUN-001、FR-JUDGE-001、FR-E2E-001

- **PFACT-002**：方向审查一路取消后整组判 `unavailable`，已成功的 15 条 findings 保留但被汇总口径丢弃
  - **状态**：`verified`
  - **证据或来源**：`quality/reviews/2026-10-22-005-make-decision-direction.json`；`quality/evidence/reviews/2026-10-22-direction-review-failure.md:13-14`
  - **关联**：FR-REC-001、AC-N11-14

- **PFACT-003**：四份审查汇总的 `material_coverage` 全为 undetermined（`read` 空）
  - **状态**：`verified`
  - **证据或来源**：`quality/reviews/2026-10-22-005/009/013/017-*.json`
  - **关联**：FR-REC-001、AC-N11-14

- **PFACT-004**：逼人全量重跑的规则原文集中在 Phase 模板与 verify-code/build-code 方法，且分级保守升级在 test-routing-advisor
  - **状态**：`verified`
  - **证据或来源**：`skills/spec-plan/templates/phase-template.md:66`、`:67`、`:223`、`:234`、`:237`；`workflows/verify-code/SKILL.md:20`、`:24`、`:25`；`workflows/build-code/SKILL.md:36`、`:40`；`skills/test-routing-advisor/SKILL.md:20`、`:22`、`:43`；`docs/standard-workflow.md:43`
  - **关联**：FR-ACCEPT-001…004、AC-N11-1…4

- **PFACT-005**：ModelTest 三个卡点当前仍存在：桥入口已删、runner 快照 v0.3.0 冻结、`wh_review.profiles` 缺失；且该键被 WorkflowHub 宿主配置显式拒绝（`skills/wh-review/scripts/third-review-host-config.mjs:380`「wh_review.profiles is not supported」），只能经 `MODELTEST_WORKFLOWHUB_CONFIG` 指向独立配置文件
  - **状态**：`verified`
  - **证据或来源**：`evaluation-assets/scripts/build-us07-workflowhub-task.mjs:281`；`tools/cli/stage-runtime.mjs:1360`；`evaluation-assets/runner/workboard-review-queue/v0.3.0/runner-config.json`；`evaluation-assets/scripts/provider-transport.mjs:152`；`evaluation-assets/contracts/us07-current-provider-roster-v1.mjs:37`；`skills/wh-review/scripts/third-review-host-config.mjs:380`；`quality/evidence/decision-log-refs/research-20261022-modeltest-interface.md:15-17`
  - **关联**：FR-EVAL-001、AC-N11-22

- **PFACT-006**：改造前基线提交 `3068cfd0` 存在，是 N1 合并进 main 之前的合并提交
  - **状态**：`verified`
  - **证据或来源**：`git cat-file -t 3068cfd0` 返回 `commit`；`git log -1` 为 2026-10-16 07:38 的合并提交
  - **关联**：FR-RUN-001、AC-N11-5

- **PFACT-007**：成本第④组「调用次数」在 codex 族没有来源，四组里只有三组可从评测通道取得
  - **状态**：`verified`
  - **证据或来源**：`tools/cli/measure-main-agent-cost.mjs:136` 对 codex 族返回 `unsupported_in_this_task`；`research-20261022-modeltest-interface.md:10`（usage 无 cacheRead）
  - **关联**：FR-JUDGE-002、AC-N11-7

- **PFACT-008**：匿名双序判定当前没有任何实现，只有 provider 协议里一句文字
  - **状态**：`verified`
  - **证据或来源**：`grep` 双序/匿名/pairwise 在 `tools/cli`、`skills/*/scripts`、`runtime` 零命中；`skills/wh-review/contracts/provider-protocol.md:22`
  - **关联**：FR-JUDGE-001、AC-N11-23

- **PFACT-009**：54 项采用与 23 项保护的唯一权威在父 PRD；catalog 中 `n1-`、`n2-` 无登记行
  - **状态**：`verified`
  - **证据或来源**：`/Users/Hugh/Hugh/Project/workflowhub/specs/archive/skills-framework-redesign-20261014/prd.md:660`、`:754`；`skills/catalog.yaml` 前缀计数 n1:0、n2:0
  - **关联**：FR-JUDGE-003、FR-REC-002、AC-N11-8、AC-N11-21

- **PFACT-010**：现有机械校验只比对两份声明（Phase 文件 vs index），没有「声明写集 vs 真实 diff」对账
  - **状态**：`verified`
  - **证据或来源**：`runtime/stage/stage-content-contracts.mjs:498`；`runtime/review/review-input-bounds.mjs:43` 只把 diff 裁到写集并静默丢弃集外项
  - **关联**：FR-PLAN-003、AC-N11-20

- **PFACT-011**：真实评测账号与额度未验证；最近一次 provider smoke 状态为 `incomplete`
  - **状态**：`unknown`
  - **负责人、影响**：P6 执行者；影响 FR-EVAL-001、AC-N11-22 与 P7 实跑；P6 开工前重测 smoke
  - **关联**：FR-EVAL-001、AC-N11-22、RISK-03、OPEN-05

- **PFACT-012**：旧代码（`3068cfd0`）在三卡点未修通前无法跑评测
  - **状态**：`inferred`
  - **证据或来源**：代码事实（桥入口缺失、`stage-runtime` 抛错、profiles 缺失）足以判断启动必失败，但本次未实跑；限制是未执行，不宣称已观测失败
  - **关联**：FR-RUN-002、AC-N11-5、RISK-04

- **PFACT-013**：N1–N10 十张卡的交付物与逐卡审计缺口有真实原件
  - **状态**：`verified`
  - **证据或来源**：`quality/evidence/decision-log-refs/audit-20261022-per-card.md:10/30/43/56/69/83/100/114/127/143`
  - **关联**：FR-REC-004、FR-REC-002、AC-N11-11、AC-N11-21

> `unknown` 必须关联 RISK 或 OPEN；不能把推断写成已核实事实。

## 5. 功能需求

### 验收规则（ACCEPT）

使用者执行验收时，默认只跑本任务范围内、与本次改动相关的测试与检查。改动对象是流程本身且局部无法证明时，才允许全局重跑一次，并事先说明范围与理由。测试级别按改动性质选择；判断不了影响面时用最小可证伪集合并记录未知，不再自动升到全链路。跳过高成本验收必须记 `unverified`、原因与影响面，并保留在分母里。

- **FR-ACCEPT-001**：验收默认只跑本任务范围内的测试与检查；全局重跑仅在改动对象是流程本身且局部无法证明时执行一次并事先说明，关联 PFACT-004、SCN-001、AC-N11-1
  - **范围边界**：包括 Phase 级 gate、终末复核与端到端串演；不改变任何真实测试范围
  - **依据**：U-005、D-002
  - **场景**：SCN-001
  - **验收**：AC-N11-1
- **FR-ACCEPT-002**：验收标准、流程、数据与命令在实施前写定并作为交付物；四项缺一即视为未开工，关联 PFACT-004、SCN-001、AC-N11-2
  - **范围边界**：覆盖 spec 测试标准与 Phase 测试策略；不新增资产类型
  - **依据**：U-005、U-007
  - **场景**：SCN-001
  - **验收**：AC-N11-2
- **FR-ACCEPT-003**：跳过高成本验收必须记 `unverified`＋原因＋影响面并保留分母，不得记 pass，关联 PFACT-004、SCN-001、AC-N11-3
  - **范围边界**：适用于所有 AC 与测试面；不改变通过判据强度
  - **依据**：U-005
  - **场景**：SCN-001
  - **验收**：AC-N11-3
- **FR-ACCEPT-004**：测试级别按改动性质选择；判断不了影响面时用最小可证伪集合并记录未知，不自动升全链路，关联 PFACT-004、SCN-001、AC-N11-4
  - **范围边界**：改 `test-routing-advisor` 的保守升级规则；不新增分级档位
  - **依据**：U-007、U-010
  - **场景**：SCN-001
  - **验收**：AC-N11-4
- **FR-ACCEPT-005**：四项禁止（不新造评测台、不扫宿主会话、不恢复旧 snapshot 兼容桥、不建常驻 eval 技能）各有受控负例或检查，关联 PFACT-004、SCN-001、AC-N11-10
  - **范围边界**：负例只检查本任务实际改动；不扩大到全仓禁令
  - **依据**：P-005、U-006
  - **场景**：SCN-001
  - **验收**：AC-N11-10
- **FR-ACCEPT-006**：不新增技能、标准或模板；实现脚本可以新增，但必须登记唯一消费者、责任人与删除条件，关联 PFACT-009、SCN-001、AC-N11-13
  - **范围边界**：技能/标准/模板零新增；脚本按 U-011 允许
  - **依据**：U-006、U-011
  - **场景**：SCN-001
  - **验收**：AC-N11-13

### 需求讨论（DISCUSS）

每个工作包讨论前先展示代理已判断的五类结论与「谁来定」分档；讨论后用 3–5 句大白话复述结果，取得用户确认。用户可见文字按简明语言标准写，默认读者是没读过本项目、注意力有限的人。阶段末核对能点名缺了哪一步。

- **FR-DISCUSS-001**：每个工作包按五类分析（语义与解释权、目标与边界、成败与风险、验收与证据成本、影响面与顺序）逐类标「已答/事实可定/待你定」；讨论前展示、讨论后复述并确认，关联 PFACT-001、SCN-002、AC-N11-12
  - **范围边界**：覆盖复杂任务 make-decision 的逐工作包讨论；build-code 不逐步展示
  - **依据**：U-008、U-009
  - **场景**：SCN-002
  - **验收**：AC-N11-12
- **FR-DISCUSS-002**：跳步能被发现：阶段末核对能点名缺哪一步，15 行步骤产物齐全可读，关联 PFACT-001、SCN-002、AC-N11-25
  - **范围边界**：用现有 steps 清单与 final-chain 覆盖事实；不新增阻断门
  - **依据**：U-013、U-016
  - **场景**：SCN-002
  - **验收**：AC-N11-25
- **FR-DISCUSS-003**：用户可见文字采用简明语言核心思想：先结论、短句、主动语态、一次一个动作、不用术语与内部编号（非用不可当场解释），关联 PFACT-001、SCN-002、AC-N11-12
  - **范围边界**：覆盖用户可见提问、复述与交接；不改变内部材料写法
  - **依据**：U-014、U-015、R-008
  - **场景**：SCN-002
  - **验收**：AC-N11-12

### 计划与执行（PLAN）

需求要落成「动作＋命令＋期望」三件套，不允许占位句；判据不能由方案作者单方放宽，改动必须取得用户真实答复；Phase 声明的写集要与真实 diff 逐路径对账，越界与「列了没改」都被报出；测试要能抓到行为被改坏。

- **FR-PLAN-001**：每条需求在 spec 与 Phase 里落成动作、命令与期望；`TBD`/`待补充`/占位符不得冒充内容，关联 PFACT-004、SCN-003、AC-N11-2
  - **范围边界**：覆盖 spec 层与 Task 卡；不改变已有判据语义
  - **依据**：R-005、R-006、U-006
  - **场景**：SCN-003
  - **验收**：AC-N11-2
- **FR-PLAN-002**：判据不可由方案作者单方放宽；改动需用户真实答复并留原件，关联 PFACT-004、SCN-003、AC-N11-6
  - **范围边界**：覆盖 AC 与冻结测试；不扩大写权限
  - **依据**：R-005、D-002
  - **场景**：SCN-003
  - **验收**：AC-N11-6
- **FR-PLAN-003**：Phase 声明写集与真实 diff 逐路径对账，越界与「列了没改」都被报出，关联 PFACT-010、SCN-003、AC-N11-20
  - **范围边界**：复用既有 build-code capture 返回的 `changed_paths` 事实（receipt 持久字节不含该字段，实读 `tests/contract/build-code-change-scope.test.mjs:61`）；不新增第二账本
  - **依据**：R-006、U-010
  - **场景**：SCN-003
  - **验收**：AC-N11-20
- **FR-PLAN-004**：测试能抓到行为被改坏：改动前先有具名目标 RED，改坏受控负例能被测试报出，关联 PFACT-004、SCN-003、AC-N11-4
  - **范围边界**：覆盖行为类 Task；纯文档按 G-2 具名豁免
  - **依据**：R-006
  - **场景**：SCN-003
  - **验收**：AC-N11-4

### 流程能力（CAP）

页面、调研、经验写入与归档四项要有真实执行入口：能生成、能打开、能读回；打不开或工具不可用时如实记。

- **FR-CAP-001**：页面能真生成并打开：产出 HTML 与同名节点文件，真实打开并读回；打不开记「未自动打开」，关联 PFACT-013、SCN-004、AC-N11-15
  - **范围边界**：复用既有模板与节点文件 schema；不新建展示平台
  - **依据**：R-003、D-002
  - **场景**：SCN-004
  - **验收**：AC-N11-15
- **FR-CAP-002**：调研能真执行：有真实缺口时实际检索并读原文，产出可回读报告；工具不可用如实记，关联 PFACT-013、SCN-005、AC-N11-16
  - **范围边界**：复用宿主已批准的检索能力；不新增调研平台
  - **依据**：R-004、D-002
  - **场景**：SCN-005
  - **验收**：AC-N11-16
- **FR-CAP-003**：经验写到业务仓 `specs/Improvements.md` 的项目/模块节并读回，不写任务流水，关联 PFACT-013、SCN-006、AC-N11-17
  - **范围边界**：沿用 stage-reflection 的写入与判重；不新建经验库
  - **依据**：R-004、D-002
  - **场景**：SCN-006
  - **验收**：AC-N11-17
- **FR-CAP-004**：归档能真执行：一条薄命令完成移动、读回与授权核对，不建平台，关联 PFACT-013、SCN-006、AC-N11-18
  - **范围边界**：复用既有 `task-close` 归档动作；不新增公共命令
  - **依据**：R-004、D-002
  - **场景**：SCN-006
  - **验收**：AC-N11-18

### 记录与结论（REC）

审查通道要在单路卡死时交付部分结果；采用登记与旧结论按事实纠正；十环要有 producer；缺口按影响面抽样修复。

- **FR-REC-001**：审查单路卡死不拖死整组；取消后已得意见保留并标 partial 可消费；方向审查有覆盖字段，关联 PFACT-002、PFACT-003、SCN-007、AC-N11-14、AC-N11-19
  - **范围边界**：改聚合与记录语义，不改 provider 身份与协议
  - **依据**：R-002、U-012
  - **场景**：SCN-007
  - **验收**：AC-N11-14、AC-N11-19
- **FR-REC-002**：采用登记补齐或如实记未补；旧结论按事实改正并保留原失败原件，关联 PFACT-009、PFACT-013、SCN-008、AC-N11-21
  - **范围边界**：只改结论与登记，不改历史原件
  - **依据**：D-004、R-004
  - **场景**：SCN-008
  - **验收**：AC-N11-21
- **FR-REC-003**：十环中环 2 有真实 producer，其余环如实记未修；「0 项新采用」有资料索引与父 PRD 行为证据，关联 PFACT-009、SCN-008、AC-N11-9
  - **范围边界**：补 producer，不新增环或状态
  - **依据**：P-004、N9 交付
  - **场景**：SCN-008
  - **验收**：AC-N11-9
- **FR-REC-004**：缺口按影响面抽样修复：用户可感知影响优先，每类至少 1 项，其余记未修，关联 PFACT-013、SCN-008、AC-N11-11
  - **范围边界**：不逐卡全验、不做全量回归
  - **依据**：U-004、U-005、OI-004
  - **场景**：SCN-008
  - **验收**：AC-N11-11

### 评测适配（EVAL）

ModelTest 三个卡点修通：接口改为当前 API（async、`activation_cohort`、无桥）、runner 出新快照、补 `wh_review.profiles`。只改适配层，不改已发布资产。

- **FR-EVAL-001**：三卡点修通：绑定改当前 API、runner 出新快照、为 ModelTest 提供可读的 provider profiles（独立配置文件经 `MODELTEST_WORKFLOWHUB_CONFIG` 指向，不改宿主共享配置的形状）；任务真实开跑并产出一条真实结果，关联 PFACT-005、PFACT-011、SCN-009、AC-N11-22
  - **范围边界**：只改适配层与配置；不改评测契约与已发布资产
  - **依据**：P-001、U-017
  - **场景**：SCN-009
  - **验收**：AC-N11-22
- **FR-EVAL-002**：评测链只改适配层，已发布资产（releases、frozen-releases、v0.3.0 runner 快照）保持只读，关联 PFACT-005、SCN-009、AC-N11-22
  - **范围边界**：新版本另立 ref；不覆盖旧版本
  - **依据**：P-001、父 PRD 558 行
  - **场景**：SCN-009
  - **验收**：AC-N11-22

### 基线与实跑（RUN）

改造前基线用 `3068cfd0`；四个有效阶段 × `codex/luna` 各跑一次；失败进分母；范围外声明未覆盖。旧代码跑不动时如实写「无法对比」。

- **FR-RUN-001**：基线用 `3068cfd0`，四阶段 × `codex/luna` 实跑，失败进分母，覆盖边界声明，关联 PFACT-006、SCN-010、AC-N11-5
  - **范围边界**：只跑四个有效阶段与一个通道；不外推全 cohort
  - **依据**：U-003、U-018、P-002
  - **场景**：SCN-010
  - **验收**：AC-N11-5
- **FR-RUN-002**：旧代码跑不动时如实写「无法对比」，不拿别的数据凑，关联 PFACT-012、SCN-010、AC-N11-5
  - **范围边界**：只影响结论强度，不阻断流程修复交付
  - **依据**：U-018
  - **场景**：SCN-010
  - **验收**：AC-N11-5

### 判定与成本（JUDGE）

同一对答案正反各判一次，两次一致才算赢，否则平局；次数不足或波动过大记「无法下结论」。成本四组分列，cacheRead 与 wall_s 不劣化，steps 或 cacheRead 至少一项下降。54/23 只读复核逐项成表。

- **FR-JUDGE-001**：匿名双序判定：同一对答案正反各判一次，两次一致才算赢，否则平局；不足写无法下结论，关联 PFACT-008、SCN-010、AC-N11-23
  - **范围边界**：判定器新建脚本；不改 provider 协议
  - **依据**：U-019、P-002
  - **场景**：SCN-010
  - **验收**：AC-N11-23
- **FR-JUDGE-002**：成本四组分列（等待时间、输入/输出/缓存读取、步骤数、调用次数）；cacheRead 与 wall_s 不劣化，steps 或 cacheRead 至少一项下降；缺来源记 unavailable，关联 PFACT-007、SCN-010、AC-N11-7
  - **范围边界**：只取本任务前后实跑轨迹与 N1 主 Agent 观测；不借外部数据
  - **依据**：P-003、G1/AC-012
  - **场景**：SCN-010
  - **验收**：AC-N11-7
- **FR-JUDGE-003**：54/23 只读复核逐项成表，缺任一项不得称全验，关联 PFACT-009、SCN-010、AC-N11-8
  - **范围边界**：只读复核，不做首次搬迁/首验
  - **依据**：P-002、U-002
  - **场景**：SCN-010
  - **验收**：AC-N11-8

### 整合端到端（E2E）

用本项目一个真实小问题走完讨论、方案、实施、验收四段，失败能归到具体阶段；全 AC 逐条回写。

- **FR-E2E-001**：用真实小任务走完四段，失败能归到具体阶段；只验证连通性，不重判各阶段 AC，关联 PFACT-001、SCN-011、AC-N11-24
  - **范围边界**：真实小任务与被测对象按 OPEN-03 确认后执行
  - **依据**：U-020、U-007
  - **场景**：SCN-011
  - **验收**：AC-N11-24

> 新需求使用 `FR-DOMAIN-NNN`；来源只认 R-、U-、PRD-、CARD- 开头编号；每条 FR 至少连接一个 PFACT、SCN 和 AC。

## 6. 模块划分

| 模块 | 负责什么 | 对外提供什么 | 依赖谁 | 测试边界 |
| --- | --- | --- | --- | --- |
| 验收规则 | 定义默认验收范围、分级与跳过留痕 | 方法正文与受控负例测试 | 既有 Phase 模板与 verify-code 方法 | 负例：改坏规则能否报出 |
| 需求讨论 | 定义五类分析与讨论前后动作 | Talk 方法、make-decision 步骤、步骤覆盖检查 | 既有 Talk 方法 | 一个简包与一个繁包真实走一遍 |
| 计划质量 | 三件套、判据锁、写集对账 | build-plan 方法、校验器、负例测试 | 既有 receipt 事实 | 越界与列了没改两类负例 |
| 流程能力 | 页面、调研、经验、归档 | 四个真实入口 | 既有模板与运行时 | 四项真实操作各一次 |
| 记录与结论 | 审查部分结果、覆盖字段、登记与纠正 | 聚合语义、catalog 行、纠正记录 | 既有 review 运行时 | 受控卡死用例＋真实一次 |
| 评测适配 | 三卡点修通 | 适配后的 ModelTest 脚本与配置 | ModelTest 仓与用户配置 | 真实一次启动 |
| 评测执行 | 基线与四阶段实跑 | 实跑原件与轨迹 | P6 适配 | 单次实跑原件 |
| 判定与成本 | 双序判定、成本四组、54/23 表 | 判定脚本、成本表、复核表 | P7 实跑结果 | 判定可复算 |
| 整合验收 | 真实小任务四段 | 端到端原件与全 AC 回写 | P1–P8 交付 | 一次真实任务全程 |

## 7. 关键实体

- **验收声明**：一个 Phase 的写集、测试面、gate 命令与期望退出码。约束：写集是精确文件路径；同一路径只能有一个 Phase 持笔，跨 Phase 共享须有真实依赖边。
- **审查汇总记录**：一次审查的各路 provider 结果、状态、findings 与覆盖事实。约束：`status` 只取 `available`/`available-with-failures`/`unavailable`/`incomplete`；`material_coverage` 三键只取 `read`/`unread`/`undetermined`。
- **评测运行**：一次固定 cohort 运行，含 stage、provider、attempt、产物与轨迹引用。约束：已发布资产不可覆盖；新快照另立 ref。
- **判定对**：同一输入下基线与候选的两份答案。约束：正反各判一次，两次一致才算赢。

## 8. 数据和生命周期

- **数据粒度**：一次验收对应一个 Phase 的声明；一次审查对应一个请求；一次评测对应一个 stage × provider 的 attempt。
- **数据时效**：验收声明随材料版本变化；审查与评测原件一次写定、只追加。
- **缺失或迟到**：缺声明即该 Phase 未开工；缺 provider 结果即该路 unavailable；缺评测结果即无法下结论。
- **预览与正式**：草稿材料与已确认材料分开；本 spec 在用户确认前保持草稿。
- **当前与历史**：历史原件只读；纠正旧结论用新记录，不覆写原失败。
- **归属与清理**：材料归任务库与工作树；评测产物归 ModelTest 输出根；清理只在用户授权后执行。

## 9. 兼容性预留

- **既有消费方**：make-decision、build-plan、build-code、verify-code 四个阶段方法与现有校验器；改正文不改变它们的调用契约。
- **命名预留**：沿用既有状态值、覆盖三键与 receipt 字段；不新增枚举。
- **容器预留**：N/A — 不新增持久化容器或 schema。
- **状态预留**：沿用 `facts.jsonl` 现有 stage 行与 `phase_progress` 游标；不新增状态机。
- **扩展边界**：本期只修方法正文、聚合语义、适配层与脚本；不承诺新的公共命令或评测平台。

## 10. 明确不做与默认必须成立

### 明确不做

- 不新造评测平台、不扫宿主会话、不恢复旧 snapshot 兼容桥、不建常驻 eval 技能（P-005）。
- 不新增 stage、公共 runtime 命令（七类之外）或第二进度权威（D-002）；`tools/cli/` 下的实现脚本按 U-011 允许并须登记。
- 不新增技能、标准或模板；只修现有文件（U-006）。
- 不设时间/token/数量阈值作为验收限制（U-005）。
- 不改归档任务与旧报告；不替各卡做 54 项采用的首次搬迁或首验（U-002）。
- 不改 ModelTest 已发布资产与冻结快照（父 PRD 558 行）。
- 不把局部评测结果外推为全 cohort 收益（U-003）。
- 不跑九面辅助对照（`wh-review-adversarial/v1`）：需 baseline/candidate 各三仓根与两份 config，当前只有一个 worktree，缺 TaskHandle 报 `TASK_BINDING_UNAVAILABLE`；本次记 unavailable，不逐面冒充已覆盖（OPEN-07）。

### 默认必须成立

- 每个 Phase 的写集是精确路径且与 index 一致；关联 FR-PLAN-003、AC-N11-20。
- 每条 AC 有可回读证据路径；缺证据如实保留缺口，不读成通过；关联 FR-ACCEPT-003、AC-N11-3。
- 用户确认只覆盖实际展示范围，不构成 Git 授权；关联 decision-log「最终确认」。

## 验收流程

从当前 decision-log 主文的 `## 验收面` 交接索引取可观察接口与成功失败边界，再从场景入口依次定位 FR、`Appendix A` 的同号 AC、所属 Phase 命令与可回读证据；按其外置事实索引的到达条件读唯一原 ref。本节只描述流程，不复制 AC 的通过或失败判据。

## 测试标准

本任务按项目自行声明的测试面逐面给 oracle、证据类型与覆盖边界：

- **方法正文类改动**（`skills/*/SKILL.md`、`workflows/*/SKILL.md`、模板、`AGENTS.md`、`docs/standard-workflow.md`）：用契约测试读真实字节断言关键约束在场，配受控负例；主测试技能 `backend-testing`。理由：正文是唯一载体，测试只能证明声明在场与负例可判，不能证明模型会照做。
- **运行时与脚本改动**（`runtime/stage`、`runtime/review`、`runtime/task`、`tools/cli`、`skills/*/scripts`）：用 Node 测试直接调用真实函数与真实 CLI，配具名反向用例；主测试技能 `backend-testing`。
- **外部评测链**（ModelTest）：用一次真实启动与产物读回；主测试技能 `backend-testing`；不重复跑历史 cohort。
- **整合端到端**：P9 一次真实小任务全程；不重判各阶段 AC。
- **浏览器可见面**：本任务无浏览器端到端要求；页面验收是「生成＋打开＋读回」，用宿主浏览器能力观察，不列浏览器 E2E 测试，理由是本仓无前端应用（无 `apps/`、无 `.tsx`/`.vue`）。

每个要测的面与覆盖 AC 指向所属 Phase 的一条可执行命令；精确命令留在各 Phase。

### 验收对象

本节回答：哪个真实对象被检查，缺什么输入，谁提供或执行。

本任务三来源均为非 UI：原始要求是流程修复与评测（R-001…R-008），当前库存无前端应用与路由，已接受计划只改方法与脚本。因此按 CLI 对象检查。

对象数据与执行结果保存在任务库 `quality/tests/2026-10-23-001-build-plan-acceptance-object.json`；三来源引用与实际读取范围同件记录，`ui_applicability` 三项均为 false 并各带来源与理由。

| 项 | 值 | 来源 |
| --- | --- | --- |
| workspace | 本任务 worktree | 认证工作区 |
| state | `execution: not_run`，材料为当前 spec | 当前材料 |
| cli.command | `node tools/cli/run-checks.mjs --task-path <认证任务根>` | answer-as-page 数据源命令 |
| cli.entry_ref | `decision-log.md#工作包与决定` | 当前 decision-log |
| cli.sample_ref | `spec.md#Appendix A — 验收判据（唯一权威）` | 当前 spec |
| cli.oracle_ref | `phase_authorities#/P1` | 当前 Phase 契约头 |
| owner | build-plan 作者 | 本文件 |

`checkAcceptanceObject` 的唯一 producer 在 `skills/spec-specify/templates/spec-template.md` 的 marker 之后，本 spec 只填对象与来源安排，不复制该函数。对象检查只证明最小输入存在与引用可解析，不证明环境健康或业务效果。

## 架构边界

产品边界：本任务交付的是流程行为与评测结论，不是新运行时能力。工程边界：方法正文归 `skills/` 与 `workflows/`；校验与聚合归 `runtime/`；命令归 `tools/cli/`；测试归 `tests/`；评测适配归外部 ModelTest 仓；用户级 provider 配置归 `~/.config/workflowhub/config.json`。全局方案见「实现设计」。

## 实现设计（全局权威）

### 代码锚点

- **来源边界**：原始需求与 decision-log 只作来源映射；本节的代码事实来自 2026-10-23 对基线 `4768ef52` 的实际读取，行号是生成时刻导航，会漂移，不作契约；契约面由点名的符号与行为语义构成。
- **读取顺序**：先读 `docs/standard-workflow.md` 的「build-code 测试与质量」与「证据只留原始件」，再读 `workflows/verify-code/SKILL.md`、`workflows/build-code/SKILL.md`、`skills/spec-plan/templates/phase-template.md`、`skills/test-routing-advisor/SKILL.md`；随后读 `skills/talk-with-zhipeng/SKILL.md` 与 `workflows/make-decision/SKILL.md` 的 15 步；再读 `runtime/stage/stage-content-contracts.mjs` 的 `validatePostPhaseContract`、`runtime/review/review-record-route.mjs` 的 `providerCoverage`、`skills/wh-review/scripts/simple-review-runner.mjs` 的终态判定。
- **代码锚点**：
  - 验收规则：`phase-template.md` 的「验收 Phase 固定小节」第 3、4、5 项；`verify-code/SKILL.md` 的「测试充分性与检查可信度」；`test-routing-advisor/SKILL.md` 的 simple/feature/fullstack 与保守升级句。
  - 讨论质量：`talk-with-zhipeng/SKILL.md` 的「5 四维」「8 大白话」「4 收敛」；`make-decision/SKILL.md` 第 4 步 `outline-revision-check` 与第 10 步 `detail-advice`；`workflows/make-decision/steps.json`。
  - 计划质量：`workflows/build-plan/SKILL.md` 第 7、9、10 步；`runtime/stage/stage-content-contracts.mjs:413` 的 `validatePostPhaseContract`；`tools/cli/check-stage-quality.mjs`。
  - 流程能力：`skills/answer-as-page/SKILL.md` 与 `templates/overview-template.html`；`skills/deep-research/SKILL.md` 的 R0–R5；`skills/stage-reflection/SKILL.md` 的「用户选择后的归口」；`skills/stage-closeout/SKILL.md` 的归档段；`tools/cli/task-close.mjs` 与 `core/task-close.mjs`。
  - 记录与结论：`skills/wh-review/scripts/simple-review-runner.mjs:1734`、`:1837`、`:511`；`runtime/review/review-record-route.mjs:248`、`:73-76`；`runtime/task/final-chain-runner.mjs:747-757`；`skills/catalog.yaml` 的 `absorbed:` 块。
  - 评测适配：`evaluation-assets/scripts/build-us07-workflowhub-task.mjs:236-245`、`:281`；`run-us07-workflowhub-cohort.mjs:1187`；`provider-transport.mjs:152`；`us07-current-provider-roster-v1.mjs:37`；`runner/workboard-review-queue/v0.3.0/runner-config.json`；`verify-runner-snapshot.mjs:31-43`。
  - 判定与成本：`tools/cli/measure-main-agent-cost.mjs:25-26`、`:136`、`:174`；`docs/research/n8-four-level-acceptance-runbook.md`。
- **运行条件**：Node ≥ 24、`npx vitest`、git；评测需 ModelTest 仓与 `codex/luna` 可用；页面验收需宿主浏览器能力。

### 接口与失败语义

- **选择的架构方案**：只改方法正文与既有运行时函数，不新增 stage、公共命令或控制面；新脚本只承载本任务必须的执行入口（页面渲染、调研记录、双序判定），每个都登记唯一消费者、owner 与删除条件。
- **模块职责**：方法正文定义行为；校验器与聚合器执行机械检查；脚本执行真实动作；Phase 卡声明写集与命令。
- **接口与数据流**：
  - 验收规则：读 Phase 模板与 verify-code 正文，产出「默认最小＋一次例外＋跳过留痕」的规则文本与负例测试。
  - 讨论质量：读 Talk 方法与 make-decision 步骤，产出五类分析与前后展示的规则；步骤覆盖由 `run-checks --task-path` 输出缺失步骤。
  - 计划质量：`validatePostPhaseContract` 增加「声明写集 vs capture 返回的 `changed_paths`」对账，输出越界与未改项清单。
  - 审查通道：聚合器把每路终态独立记录；任一路取消不再覆盖整组状态；已得 findings 保留为 partial；覆盖字段由 broker 路写 `read`/`unread`。
  - 评测适配：ModelTest 绑定改为当前 async API 与 `activation_cohort="post"`，不再引用已删桥；runner 出新快照；配置补 `wh_review.profiles`。
  - 判定与成本：判定脚本读两份答案，正反各判一次；成本表按四组分列，缺来源写 unavailable。
- **失败语义**：缺材料、缺 provider、缺凭据、缺写集对账输入都明确失败并记 unavailable；不重试不可重试类；不把失败写成通过。
- **新增控制面**：N/A — 无新 stage、无新公共命令、无第二进度权威。

### 全局文件边界与依赖

- **新增**：
  - `tests/contract/n11-acceptance-rules.test.mjs`（P1）
  - `tests/contract/n11-discussion-quality.test.mjs`（P2）
  - `tests/contract/n11-plan-quality.test.mjs`（P3）
  - `tests/contract/n11-capability-gaps.test.mjs`（P4）
  - `tests/contract/n11-review-channel.test.mjs`（P5）
  - `skills/answer-as-page/scripts/render-answer-page.mjs`（P4）
  - `skills/deep-research/scripts/research-run.mjs`（P4）
  - `tools/cli/n11-pairwise-judge.mjs`（P8）
  - `docs/research/n11-modeltest-adaptation-runbook.md`（P6）
  - `docs/research/n11-evaluation-baseline-runbook.md`（P7）
  - `docs/research/n11-judge-and-cost.md`（P8）
  - `tests/acceptance/n11-eval-run-check.test.mjs`（P7）
  - `tests/contract/n11-pairwise-judge.test.mjs`（P8）
  - `tests/acceptance/n11-integration-acceptance.test.mjs`（P9）
  - `docs/research/n11-integration-runbook.md`（P9）
  - 外部仓新件（不在本仓 move-map，登记在 P6 runbook 与证据）：`/Users/Hugh/Hugh/Project/ModelTest/evaluation-assets/test-fixtures/us07-workflowhub/task-input-v2.json`、`/Users/Hugh/Hugh/Project/ModelTest/evaluation-assets/runner/workboard-review-queue/v0.4.0/runner-config.json`
- **修改**：见各 Phase 契约头；全局不重复声明。
- **禁止改动**：
  - `specs/n11-same-condition-eval-20261022/decision-log.md`：本阶段唯一决策权威，改它等于改需求。
  - `specs/archive/**` 与 `docs/archive/**`：历史只读。
  - `specs/n10-finite-check-wiring-20261020/**`：旧任务材料只读；旧结论纠正另立记录。
  - ModelTest `evaluation-assets/releases/index-v0.json`、`frozen-releases/**`、`runner/workboard-review-queue/v0.3.0/**`：已发布资产不可覆盖。
  - `workflows/build-code/capture.mjs`、`workflows/verify-code/capture.mjs`、`runtime/interface/**`：本任务不改捕获与安全写入实现。
- **全局依赖**：P1 → P2/P3/P4/P5/P6；P1–P6 → P7；P7 → P8；P1–P8 → P9。P2/P3/P4/P5/P6 写集互斥，可并行；P7 需要 P6 的适配与 P1–P5 的流程修复；P9 消费全部上游原件。
- **文件归属**：每个修改路径只由一个 Phase 持笔；跨 Phase 同路径不存在。
- **回滚与恢复**：任一 Phase 的改动失败时只回退该 Phase 的 hunk，保留其它 Phase 与历史原件；不覆盖已发布评测资产。

### 需求到任务追踪

| 来源 / 决定 | 原义行为/强度 | FR / AC | Phase / Task | 正例 + 负例判据 / 证据 | 依赖 / 状态 |
| --- | --- | --- | --- | --- | --- |
| U-005 / D-002 | 默认只跑本任务测试；全局重跑一次并说明 | FR-ACCEPT-001 / AC-N11-1 | P1/T001 | ORACLE-N11-ACCEPT-SCOPE：规则文本含默认最小与一次例外，负例断言「无说明全量重跑」被拒；契约测试原件 | P1；规则改完可验 |
| U-005 / D-002 | 验收资产开工前齐备，四项缺一即未开工 | FR-ACCEPT-002 / AC-N11-2 | P1/T002 | ORACLE-N11-ASSET-FIRST：模板含四要素清单，负例缺命令时测试报出；契约测试原件 | P1；同上 |
| U-005 / D-002 | 跳过记 unverified＋原因＋影响面 | FR-ACCEPT-003 / AC-N11-3 | P1/T001 | ORACLE-N11-SKIP-VISIBLE：规则文本含三要素，负例把跳过写成 pass 被拒 | P1；同上 |
| U-007、U-010 / D-002 | 分级按改动；判断不了用最小可证伪集合 | FR-ACCEPT-004 / AC-N11-4 | P1/T001 | ORACLE-N11-TIER-MINIMAL：删掉自动升全链路的规则句，负例断言歧义不再升 fullstack | P1；同上 |
| U-006 / P-005 | 四项禁止各有负例 | FR-ACCEPT-005 / AC-N11-10 | P1/T002 | ORACLE-N11-ASSET-FIRST：四条检查各有一个受控负例 | P1；同上 |
| U-006、U-011 / D-002 | 不新增技能/标准/模板；脚本登记 | FR-ACCEPT-006 / AC-N11-13 | P1/T002 | ORACLE-N11-ASSET-FIRST：`git diff --name-only` 逐路径核，新增脚本须有登记行 | P1；同上 |
| U-008、U-009 / D-002 | 五类分析、前后展示、复述确认 | FR-DISCUSS-001 / AC-N11-12 | P2/T003 | ORACLE-N11-FIVE-CATEGORIES：两个工作包各走一遍的真实记录 | P1 → P2；规则可验 |
| U-013、U-016 / D-002 | 跳步能被点名 | FR-DISCUSS-002 / AC-N11-25 | P2/T004 | ORACLE-N11-STEP-COVERAGE：删一步后阶段末报出缺哪步 | P1 → P2；同上 |
| U-014、U-015 / D-002 | 用户可见文字大白话 | FR-DISCUSS-003 / AC-N11-12 | P2/T005 | ORACLE-N11-PLAIN-LANGUAGE：真实回复可读性由用户判断；契约测试核标准在场 | P1 → P2；同上 |
| R-005、R-006 / D-002 | 动作＋命令＋期望；禁占位 | FR-PLAN-001 / AC-N11-2 | P3/T006 | ORACLE-N11-CRITERIA-LOCK：缺命令或缺期望的卡被拒 | P1 → P3；规则可验 |
| R-005 / D-002 | 判据不可单方放宽 | FR-PLAN-002 / AC-N11-6 | P3/T006 | ORACLE-N11-CRITERIA-LOCK：改 AC 需用户答复原件的负例 | P1 → P3；同上 |
| R-006 / U-010 | 写集与真实 diff 对账 | FR-PLAN-003 / AC-N11-20 | P3/T007 | ORACLE-N11-WRITESET-DIFF：越界与列了没改两类负例 | P1 → P3；同上 |
| R-006 / D-002 | 测试能抓行为被改坏 | FR-PLAN-004 / AC-N11-4 | P3/T007 | ORACLE-N11-WRITESET-DIFF：受控负例改坏行为后测试失败 | P1 → P3；同上 |
| R-003 / D-002 | 页面生成并打开 | FR-CAP-001 / AC-N11-15 | P4/T008 | ORACLE-N11-PAGE-OPEN：真实生成＋打开＋读回 | P1 → P4；能力可验 |
| R-004 / D-002 | 调研真执行 | FR-CAP-002 / AC-N11-16 | P4/T009 | ORACLE-N11-RESEARCH-RUN：一次真实调研报告 | P1 → P4；同上 |
| R-004 / D-002 | 经验写到模块节并读回 | FR-CAP-003 / AC-N11-17 | P4/T010 | ORACLE-N11-IMPROVEMENTS：真实写入＋读回 | P1 → P4；同上 |
| R-004 / D-002 | 归档一条命令完成 | FR-CAP-004 / AC-N11-18 | P4/T011 | ORACLE-N11-ARCHIVE-RUN：真实归档一份并读回 | P1 → P4；同上 |
| R-002 / U-012 | 单路卡死不拖死整组 | FR-REC-001 / AC-N11-14 | P5/T012 | ORACLE-N11-PARTIAL-REVIEW：受控卡死用例返回 partial | P1 → P5；聚合可验 |
| R-002 / U-012 | 取消后会话退出、部分结果可消费 | FR-REC-001 / AC-N11-19 | P5/T012 | ORACLE-N11-PARTIAL-REVIEW：取消后进程退出且 findings 保留 | P1 → P5；同上 |
| R-001 / P-004 | 十环有 producer；0 项新采用 | FR-REC-003 / AC-N11-9 | P5/T013 | ORACLE-N11-TEN-RINGS：环 2 有 producer 且资料索引无新增 | P1 → P5；同上 |
| D-004、R-004 | 采用登记补齐；旧结论纠正 | FR-REC-002 / AC-N11-21 | P5/T014 | ORACLE-N11-REGISTRY-CONCLUSION：catalog 行与纠正记录读回 | P1 → P5；同上 |
| U-004、OI-004 | 按影响面抽样修复 | FR-REC-004 / AC-N11-11 | P5/T014 | ORACLE-N11-REGISTRY-CONCLUSION：抽样表每类至少 1 项 | P1 → P5；同上 |
| P-001 / U-017 | 三卡点修通 | FR-EVAL-001 / AC-N11-22 | P6/T015 | ORACLE-N11-EVAL-BINDING：绑定改当前 API 后启动不再抛旧接口错 | P1 → P6；外部仓可验 |
| P-001 / U-017 | 新快照与 profiles | FR-EVAL-002 / AC-N11-22 | P6/T016 | ORACLE-N11-EVAL-SNAPSHOT：新快照校验通过、profiles 可读 | P1 → P6；同上 |
| U-017 | 真实一次启动 | FR-EVAL-001 / AC-N11-22 | P6/T017 | ORACLE-N11-EVAL-START：真实开跑并产出一条结果 | P1 → P6；同上 |
| U-003、U-018 / P-002 | 基线＋四阶段×一个通道实跑 | FR-RUN-001 / AC-N11-5 | P7/T018 | ORACLE-N11-SAME-CONDITION：单次实跑原件与分母 | P6 → P7；评测可验 |
| U-018 | 旧代码跑不动如实写无法对比 | FR-RUN-002 / AC-N11-5 | P7/T018 | ORACLE-N11-SAME-CONDITION：无法对比时的具名原因 | P6 → P7；同上 |
| U-019 / P-002 | 匿名双序判定 | FR-JUDGE-001 / AC-N11-23 | P8/T019 | ORACLE-N11-PAIRWISE：正反两次判定原件可复算 | P7 → P8；判定可验 |
| U-002 / P-002 | 54/23 只读复核 | FR-JUDGE-003 / AC-N11-8 | P8/T019 | ORACLE-N11-PAIRWISE：逐项表可回读 | P7 → P8；同上 |
| U-002 / P-003 | 成本四组分列 | FR-JUDGE-002 / AC-N11-7 | P8/T020 | ORACLE-N11-COST-4GROUP：四组指标各带来源，缺组记 unavailable | P7 → P8；同上 |
| U-020、U-007 | 四段整合端到端 | FR-E2E-001 / AC-N11-24 | P9/T021 | ORACLE-N11-E2E-FOUR：一次真实任务全程原件 | P1–P8 → P9；末 Phase |

### 全局验证策略

- **验证策略**：方法正文改动用契约测试读真实字节并配受控负例，统一入口是 `npx vitest run tests/contract/n11-acceptance-rules.test.mjs` 与各 Phase 的同类契约测试；运行时与脚本改动用 Node 测试直调真实函数与 CLI；外部评测链用一次真实启动与产物读回（`node tools/cli/n11-pairwise-judge.mjs` 只消费其结果）；末 Phase 用真实小任务串一次并逐条回写 AC。方法正文测试只能证明声明在场与负例可判，不证明模型照做。
- **RED/GREEN 设计**：每个行为类 Task 在实现前先写目标测试并实跑 RED，命名断言失败才算目标 RED；同一 oracle 做 GREEN。规则类改动同样先写负例测试：改坏规则或缺失约束时测试必须失败。
- **最终聚合**：P9 逐条消费 P1–P8 的证据原件，执行必要未闭环 case，按 25 条 AC 逐条给档位；非 pass 项写原因与 owner。
- **不能证明的内容**：不证明真实用户长期效果、不证明全 cohort 收益、不证明未跑过的阶段与通道；`material_coverage` 全 undetermined 时结论只能按「未证明读懂」使用。

## Appendix A — 验收判据（唯一权威）

本节回答：每条承诺如何验证、通过、失败并留下证据。decision-log 主文的 `## 验收面` 只交接可观察接口与成功失败边界；判据以本节为准，AC 编号同号。每条 AC 用四行式。

### 父 PRD N11 继承与偏离记录

父 PRD（`/Users/Hugh/Hugh/Project/workflowhub/specs/archive/skills-framework-redesign-20261014/prd.md:540-559`）的 N11 要求逐条对照如下，偏离只来自用户已确认的 U-002/U-003/U-005 与 2026-10-23 评测口径，不来自本 spec 自选。

| 父 PRD N11 要求 | 处置 | 落点 |
| --- | --- | --- |
| 复用 US-07 固定 cohort 与已发布资产 | 继承 | P6、P7 |
| 修 task_dir/runner 接口、旧 snapshot、profiles 三个阻塞 | 继承 | P6、AC-N11-22 |
| 实际根阶段与全部声明适用 stage | U-003 收窄为四个有效阶段 × `codex/luna` | P7、AC-N11-5 |
| 九面辅助对照 | 本次不跑，记 unavailable；理由：需 baseline/candidate 各三仓根与两份 config，当前只有一个 worktree，缺 TaskHandle 报 `TASK_BINDING_UNAVAILABLE` | 明确不做、OPEN-07 |
| 失败分母完整 | 继承 | AC-N11-5 |
| 匿名同尺独立 judge | 继承 | P8、AC-N11-23 |
| 真实轨迹与成本 | 继承 | P7、P8 |
| 同 cohort 连续 N≥3 审查收益规则 | 被 2026-10-23 评测口径取代：前后各跑一次、报告实际次数、不足记无法下结论 | P7、AC-N11-5 |
| 逐卡既有结论只读汇总 | 继承为 54/23 逐项表与旧结论纠正 | P8、P5、AC-N11-8、AC-N11-21 |
| 54 采用与 23 保护只读复核 | 继承 | P8、AC-N11-8 |
| G1/AC-012 四组指标与不劣化 | 继承 | P8、AC-N11-7 |
| 不新造评测台、不扫宿主会话、不恢复旧 snapshot 兼容桥、不建常驻 eval 技能 | 继承 | P1、AC-N11-10 |
| 不改 ModelTest 已发布资产 | 继承 | P6、AC-N11-22 |
| 额度/登录/真实资源缺失保 unavailable | 继承 | RISK-03、OPEN-05 |
| G1「每卡做减法并验证成本」 | 继承为各 Phase 的非目标与写集收缩；不另设减法配额 | P1–P9 非目标、AC-N11-7 |
| U-002 覆盖父 PRD「不替前卡补首验」，本任务做行为验收并按发现修复 | 继承；54 项采用的首次搬迁/首验仍不做 | U-002、AC-N11-8、AC-N11-11 |

**build-plan 判据细化（待用户计划确认，不改 decision-log 历史）**：AC-N11-12 补入 U-008 已确认的「骨架必须给用户看一次」；AC-N11-13 的负例/检查按覆盖矩阵记的 U-006 缺口补入（U-006 原文只确认「不新增技能/标准/模板」，负例要求来自 U-011 与 AGENTS 治理条）；AC-N11-7 明确第④组在 codex 族无来源时记 unavailable 而非跳过，第②组无本任务前后值时同样记 unavailable 并写 inconclusive；AC-N11-5 明确「四阶段」按 make-decision、build-plan、build-code、verify-code 取，`build-spec` 已退役。以上只补已确认要求与具名缺口，不放宽任何原条件。

- **AC-N11-1**：任一验收项只覆盖本任务范围内的测试/检查；改动流程本身或整任务交付时如实说明并只跑一次（P9 例外）
验证：判定方式：机器可判；执行者跑本 Phase 的 gate 命令与受影响测试，读范围说明；输入是本任务 worktree 与任务库材料；执行 owner 是 build-code 实施者，verify-code 复核；时点是每个 Phase 验收时。改动对象是流程本身时另写一条说明记录。
通过：命令只选与本任务改动相关的测试文件；全局重跑有事先说明且只出现一次；范围说明与真实命令一致。
失败：要求全仓测试、无说明的全流程重跑或服务重启；范围说明与实际命令不一致；把整任务重跑当默认。
证据：`quality/tests/` 下每个 Phase 的命令、cwd、退出码与范围说明原件。

- **AC-N11-2**：每条需求在开工前已写清验证层（静态/定向测试/一次端到端/人工）、命令或数据、预期结果、失败条件；四项缺一即未开工
验证：判定方式：机器可判；核对 spec 测试标准与每个 Phase 的测试策略；输入为当前 spec 与 Phase 卡；执行 owner 是 build-plan 作者，build-code 复核；时点是 Phase 开工前。
通过：每条 AC 的测试面有验证层、命令、预期与失败条件；缺项时该 Phase 不开工。
失败：开工后才补资产、四项缺一仍开工、用占位句冒充资产。
证据：spec 的「测试标准」与各 Phase「测试策略」原件；缺项清单。

- **AC-N11-3**：高成本验收未执行时记 unverified＋原因＋影响面，保留在分母
验证：判定方式：机器可判；检查验收记录中被跳过的项；输入为各 Phase 验收记录；执行 owner 是实施者，verify-code 复核。
通过：每个跳过项都有 unverified、原因与影响面，且仍计入分母。
失败：记 pass、静默跳过或不计入分母。
证据：验收记录原件与分母清单。

- **AC-N11-4**：测试分级不再自动升全链路；判断不了影响面时用最小可证伪集合并记录未知
验证：判定方式：机器可判；读 `test-routing-advisor` 规则与受控负例；执行 `npx vitest run tests/contract/n11-acceptance-rules.test.mjs`；输入为规则正文与负例夹具。
通过：规则文本不再含「判断不了就升全链路」；负例证明歧义场景选最小集合并记录未知。
失败：规则仍要求自动升全链路；负例缺失或失败。
证据：`quality/tests/` 下该测试的退出码与输出原件。

- **AC-N11-5**：改造前后同条件对比：四阶段 × `codex/luna`，匿名双序，失败进分母，覆盖边界声明
验证：判定方式：需真实环境+用户在场；读 P7 实跑原件与 P8 判定原件；输入是基线 `3068cfd0` 与候选代码；执行 owner 是 P7/P8 执行者。
通过：四阶段各跑一次并留轨迹；失败计入分母；覆盖边界写明只覆盖这四个阶段与该通道；旧代码跑不动时写「无法对比」及原因；匿名双序判定按 AC-N11-23 执行，证据指向 P8 判定原件。
失败：见模型名、剔除失败、外推全 cohort、用别的数据凑。
证据：`cohort-summary.json`、逐 attempt 产物与轨迹引用。

- **AC-N11-6**：判据不可由方案作者单方放宽；改动需用户真实答复
验证：判定方式：机器可判；读 P3 规则与负例；输入为 AC 与冻结测试；执行 owner 是 build-plan 作者。
通过：改 AC 或冻结测试必须附用户答复原件；负例证明自改被判失败。
失败：自改判据后直接实施；把审查建议当用户答复。
证据：负例测试输出与真实答复原件。

- **AC-N11-7**：成本对照四组分列：①等待时间 ②输入/输出/缓存读取 ③步骤数 ④调用次数；cacheRead 与 wall_s 不劣化，且 steps 或 cacheRead 至少一项下降
验证：判定方式：需真实环境+用户在场；读 P8 成本表与前后轨迹；输入是本任务前后实跑原件与 N1 主 Agent 观测；执行 owner 是 P8 执行者。
通过：四组各带来源；第④组在 codex 族无来源时写 unavailable 并说明；第②组 cacheRead 无本任务前后值时该组记 unavailable，结论记 inconclusive，不用 N1 台账充数；结论满足不劣化与至少一项下降；不足写 inconclusive。
失败：任一项劣化、两项都无下降仍宣收益、用别人数据顶替、缺组静默省略。
证据：成本表原件与轨迹引用。

- **AC-N11-8**：54/23 只读复核逐项表可回读；缺任一项不得称全验
验证：判定方式：只能人读；读 P8 逐项表与父 PRD 原件；输入为 `prd.md:660` 与 `:754` 逐行条目；执行 owner 是 P8 执行者。
通过：逐项表覆盖 54 与 23 的每一条并给处置；缺项显式列出。
失败：在本任务首次搬迁或首验；缺项仍称全验。
证据：逐项表原件与缺项清单。

- **AC-N11-9**：「0 项新采用」有资料索引与父 PRD 行为证据
验证：判定方式：机器可判；读 P5 的 catalog diff 与 N11 资料索引；输入是 `skills/catalog.yaml` 与父 PRD `:555`；执行 owner 是 P5 实施者。
通过：`git diff --name-only` 与 catalog 内容证明无新增外部采用；资料索引给出行级证据。
失败：新增外部采用或未给证据。
证据：catalog diff 与资料索引原件。

- **AC-N11-10**：四项禁止各有受控负例或检查
验证：判定方式：机器可判；执行 P1 的负例测试并读检查输出；输入为四项禁令；执行 owner 是 P1 实施者。
通过：四条各有一个负例，改坏任一约束时测试失败。
失败：只有文字声明、无负例。
证据：测试输出与负例夹具。

- **AC-N11-11**：缺口修复按影响面抽样：用户可感知影响优先，每类至少 1 项，其余记未修
验证：判定方式：只能人读；读 P5 抽样表与修复原件；输入是逐卡审计缺口；执行 owner 是 P5 实施者。
通过：每类至少 1 项修复或具名未修；抽样面与影响面对应。
失败：逐卡全验或全量回归；抽样表缺失。
证据：抽样表与修复 diff。

- **AC-N11-12**：每个工作包五类分析并逐类标「已答/事实可定/待你定」；讨论前展示判断与谁来定；讨论后用大白话复述并确认；骨架先给用户看一次；提问用工具、选项说清后果与风险；至少两个工作包（一简一繁）各走一遍；build-code 不逐步展示
验证：判定方式：只能人读；读 P2 的真实讨论记录与用户答复；输入是下一张复杂任务的两个工作包（一简一繁），本任务自身的讨论早于 P2 改动，不能替代；执行 owner 是主会话。
通过：两个工作包的记录都含五类分析、分档、前后展示与复述；骨架在细节讨论前已展示；build-code 无逐步展示。
失败：零问题收口且无依据、1–2 问代替、只用一个包冒充全部、讨论前不展示、讨论后不复述、把 build-code 拉来逐步确认。
证据：讨论记录与用户答复原件。

- **AC-N11-13**：不新增技能/标准/模板；新增实现脚本须登记唯一消费者、责任人与删除条件；有负例或检查
验证：判定方式：机器可判；`git diff --name-only` 逐路径核；读 P1 登记与负例；执行 owner 是 P1 实施者，verify-code 复核。
通过：无新增技能/标准/模板；每个新增脚本在 `docs/architecture/move-map.json` 有登记行（外部仓新件按 P6 runbook 与证据登记，不适用 move-map）；负例证明未登记脚本被报出。
失败：未经同意新增，或把新增藏进现有文件之外的路径；登记缺消费者或删除条件。
证据：`git diff --name-only` 原件、move-map 登记行与负例输出。

- **AC-N11-14**：审查通道卡死与部分结果：一路卡住时其余路结果可返回且可消费；取消后已得意见保留并标 partial；方向审查有覆盖字段
验证：判定方式：机器可判；执行 P5 受控卡死用例并读真实审查一次；输入是多路审查请求；执行 owner 是 P5 实施者。
通过：卡死一路判终态失败，其余路 findings 可读并标 partial；汇总状态为 `available-with-failures`，不被覆写为 unavailable；覆盖字段有 producer。
失败：卡住即整体 unavailable、结果丢失、覆盖永为 undetermined。
证据：受控用例输出与真实审查记录原件。

- **AC-N11-15**：页面能真生成并打开：生成页面与同名节点文件；真实打开并读回；打不开记「未自动打开」并按降级算
验证：判定方式：需真实环境+用户在场；执行页面渲染脚本并读回；输入是当前任务库材料；执行 owner 是 P4 实施者。
通过：HTML 与 `.nodes.json` 同时生成；页面真实打开；内容读回与材料一致。
失败：只生成不打开却算全部达标；节点文件缺失。
证据：生成件路径、打开记录与读回原件。

- **AC-N11-16**：调研能真执行：有真实缺口时能实际检索并读原文；工具不可用如实记
验证：判定方式：需真实环境+用户在场；执行一次真实调研并读报告；输入是真实缺口；执行 owner 是 P4 实施者。
通过：报告含真实检索结果与原文引用；工具不可用时记 unavailable 与原因。
失败：只有方法文字、从未真实执行。
证据：调研报告原件与工具状态。

- **AC-N11-17**：经验写到业务仓 `specs/Improvements.md`，按项目/模块分节，写完读回
验证：判定方式：需真实环境+用户在场；执行一次真实写入并读回；输入是本次真实经验；执行 owner 是 P4 实施者。
通过：条目在模块节内；读回内容与写入一致。
失败：写成任务流水、路径错误、写完不读回。
证据：写入 diff 与读回原件。

- **AC-N11-18**：归档能真执行：用薄命令完成移动、读回、授权核对；不建平台
验证：判定方式：需真实环境+用户在场；执行一次真实归档并读回；输入是当前任务材料；执行 owner 是 P4 实施者。
通过：一条命令完成移动；归档后读回成功；授权核对有原件。
失败：只有人读步骤、无可用操作。
证据：命令、退出码、读回与授权原件。

- **AC-N11-19**：审查会话退出与部分结果：取消/超时后会话退出；部分结果可消费并标 partial；不得冒充完整结论
验证：判定方式：机器可判；执行 P5 受控取消用例；输入是多路审查；执行 owner 是 P5 实施者。超时分支当前不可达：provider 客户端默认无 timeout，且 `skills/wh-review/SKILL.md` 的 Long-review 约定不新增 timeout；该分支记 unavailable 与原因，不以「不再轮询」冒充超时退出。
通过：取消后进程退出且退出码可读；部分 findings 保留；结论标 partial。
失败：进程不退、结果丢失、partial 被当完整通过。
证据：进程退出记录与部分结果原件。

- **AC-N11-20**：计划写集与真实改动对账：Phase 声明写集与真实 diff 逐路径一致；越界与「列了没改」都被报出
验证：判定方式：机器可判；执行 P3 对账检查；输入是 Phase 写集与 build-code capture 返回的 `changed_paths`；执行 owner 是 P3 实施者。
通过：越界路径被点名；声明未改路径被点名；一致时输出通过。
失败：只声明不对账，或越界不报。
证据：对账输出原件与两类负例。

- **AC-N11-21**：采用登记与旧结论纠正：N1/N2 缺失登记补齐或如实记未补；旧结论按事实改正且保留原失败原件
验证：判定方式：机器可判；读 catalog 与纠正记录；输入是 N1/N2 登记与 N8/N10/AC-CHECK-6 原声明；执行 owner 是 P5 实施者。
通过：N1/N2 要么有登记行要么有具名未补记录；旧结论按事实改判且原失败原件仍在。
失败：登记缺而称完整、旧结论照旧。
证据：catalog diff、纠正记录与原失败原件路径。

- **AC-N11-22**：评测适配可启动：三个卡点修通；任务真实开跑并产出一条真实结果；只改适配层
验证：判定方式：需真实环境+用户在场；执行固定 cohort 启动命令；输入是 ModelTest 仓与 `codex/luna`，provider profiles 由 `MODELTEST_WORKFLOWHUB_CONFIG` 指向的独立配置提供；执行 owner 是 P6 实施者。
通过：绑定使用当前 API 且不引用已删桥；新快照校验通过；profiles 在 ModelTest 读取点可读且未改宿主共享配置形状；真实开跑产出 `cohort-summary.json` 与一条 attempt 结果。
失败：仍依赖已删模块或缺失配置；改了已发布资产；未真实开跑。
证据：启动命令、退出码、`cohort-summary.json` 与逐 attempt 产物。

- **AC-N11-23**：判定规则：同一对答案正反各判一次，两次一致才算赢；不足写无法下结论
验证：判定方式：只能人读；执行判定脚本并读判定原件；输入是 P7 的答案对；执行 owner 是 P8 实施者。
通过：每对答案有正反两次判定；一致记赢，不一致记平局；样本不足记无法下结论。
失败：只判一次、事后补规则、把不足写成结论。
证据：判定原件与复算命令。

- **AC-N11-24**：整合端到端：用本项目一个真实小问题走完四段（讨论/方案/实施/验收）；失败能归到具体阶段
验证：判定方式：需真实环境+用户在场；执行 P9 真实任务全程；输入是确认后的小任务；执行 owner 是主会话。
通过：四段都有真实产出；失败能指到具体阶段与证据。
失败：只跑脚本、用模拟任务、失败无法归属。
证据：四段产出原件与失败归因记录。

- **AC-N11-25**：跳步能被发现：故意少做一步时，阶段末核对能点名缺哪步；15 行产物齐全可读
验证：判定方式：机器可判；执行 P2 受控负例（删一行步骤产物）并读阶段末核对输出；输入是 make-decision 步骤清单。
通过：核对输出点名缺失步骤；未删时 15 行齐全可读。
失败：跳步后无任何提示。
证据：负例输出与完整清单原件。

> 验收判据停留在产品层；全局 oracle 映射见「需求到任务追踪」，精确命令留给所属 Phase。

## 12. 风险、未决与交接

- **RISK-01**：验收规则改动被读成放宽质量
  - **受影响 ID**：FR-ACCEPT-001…004、AC-N11-1…4
  - **触发条件**：只删规则句、不补最小可证伪与跳过留痕
  - **后果**：验收变松，问题被漏过
  - **缓解或停止**：规则与负例同时交付；负例必须能证明改坏会被报出
  - **处理阶段**：P1
  - **验证**：`tests/contract/n11-acceptance-rules.test.mjs` 的负例输出

- **RISK-02**：审查聚合修复只改文档不改代码
  - **受影响 ID**：FR-REC-001、AC-N11-14、AC-N11-19
  - **触发条件**：只改 `skills/wh-review/SKILL.md` 不动聚合实现
  - **后果**：真实卡死仍整组 unavailable
  - **缓解或停止**：必须改 `simple-review-runner.mjs` 终态判定与 `review-record-route.mjs` 记录语义
  - **处理阶段**：P5
  - **验证**：受控卡死用例与真实审查一次

- **RISK-03**：评测账号或额度不可用
  - **受影响 ID**：FR-EVAL-001、FR-RUN-001、AC-N11-22、AC-N11-5
  - **触发条件**：provider smoke 仍为 unavailable
  - **后果**：评测记 unavailable，只能交付流程修复
  - **缓解或停止**：P6 开工前重测 smoke；不可用只停评测路径，其余继续
  - **处理阶段**：P6/P7
  - **验证**：smoke 原件与评测记录

- **RISK-04**：旧代码跑不动导致无法对比
  - **受影响 ID**：FR-RUN-002、AC-N11-5
  - **触发条件**：三卡点修通后基线仍无法启动
  - **后果**：同条件结论只能写「无法对比」
  - **缓解或停止**：如实记录原因与影响面，不拿别的数据凑
  - **处理阶段**：P7
  - **验证**：基线启动尝试的原始失败

- **RISK-05**：修改被判越界
  - **受影响 ID**：全 Phase
  - **触发条件**：改到写集外或已发布资产
  - **后果**：该块回退，保留其余
  - **缓解或停止**：逐 Phase 声明写集，对账检查报出越界
  - **处理阶段**：P1–P9
  - **验证**：写集对账输出

- **RISK-06**：范围膨胀导致 9 阶段烂尾
  - **受影响 ID**：全 Phase
  - **触发条件**：发现新问题不断追加
  - **后果**：已点名事项做不完
  - **缓解或停止**：只做已点名事项，超出即停问用户，未做记未验证
  - **处理阶段**：全阶段
  - **验证**：抽样表与未做清单

- **OPEN-01**：基线提交哈希 `3068cfd0` 用户未逐字确认
  - **受影响 ID**：FR-RUN-001、AC-N11-5
  - **负责人**：用户
  - **影响**：基线选错则同条件对比不成立
  - **处理阶段**：P7 开工前
  - **关闭条件或停止**：用户确认哈希或给出替代基线；未答保持未决，不按推荐自动执行

- **OPEN-02**：P8 判官与平局的具体规则未定
  - **受影响 ID**：FR-JUDGE-001、AC-N11-23
  - **负责人**：用户
  - **影响**：判官选择改变结论强度
  - **处理阶段**：P8 开工前
  - **关闭条件或停止**：用户确认判官与平局规则；未答保持未决

- **OPEN-03**：P9 被测小任务未定
  - **受影响 ID**：FR-E2E-001、AC-N11-24
  - **负责人**：用户
  - **影响**：任务过大则端到端无法收口
  - **处理阶段**：P9 开工前
  - **关闭条件或停止**：用户点名小任务；未答保持未决

- **OPEN-04**：P2 分档阈值（何为「影响大/有歧义」）未答
  - **受影响 ID**：FR-DISCUSS-001、AC-N11-12
  - **负责人**：用户
  - **影响**：分档不清会让该问的没问
  - **处理阶段**：P2 开工前
  - **关闭条件或停止**：用户给出判据；未答时按「答错会改验收或改范围」执行并记录

- **OPEN-05**：评测账号/额度未核
  - **受影响 ID**：FR-EVAL-001、AC-N11-22
  - **负责人**：P6 执行者
  - **影响**：不可用则评测路径停
  - **处理阶段**：P6 开工前
  - **关闭条件或停止**：重测 smoke 并留原件

- **OPEN-06**：decision-log 两处台账回填与 OI-004 状态
  - **受影响 ID**：无直接 AC；影响来源一致性
  - **负责人**：make-decision 作者（本阶段无写权限）
  - **影响**：覆盖矩阵与 decision-log 表述不一致
  - **处理阶段**：由 make-decision 作者在下次编辑时回填；本阶段只记录
  - **关闭条件或停止**：台账补 U-006…U-020 与 OI-004 状态

- **OPEN-08**：材料根检查不传跨仓 review scope，P6 的绝对写集会被判 unsafe
  - **受影响 ID**：FR-EVAL-001、AC-N11-22
  - **负责人**：verify-code 复核者与 P6 执行者
  - **影响**：`run-checks --material-root` 复核本任务时会报 P6 写集 unsafe；生产审查路径 `stage-runtime review` 会传 `pb` scope，不受影响
  - **处理阶段**：P6 开工前确认复核方式；材料根复核改用带 scope 的 `validatePostPhaseContract` 调用并留原件
  - **关闭条件或停止**：以 `node /tmp/n11-validate.mjs` 等价的带 `pb` scope 调用 `validatePostPhaseContract({spec,index,phases,reviewReadScope})` 退出 0 且 errors 为空为关闭；本阶段已留两次运行原件 `quality/tests/2026-10-23-002-build-plan-post-phase-contract.json`（无 scope 12 错、带 scope 0 错）

## 13. 业务影响与回归范围

### 验收与流程行为

- **既有行为**：现有四个阶段方法与校验器按当前规则运行
- **本需求影响**：验收默认范围变小、跳过必须留痕；讨论与计划增加可判据；审查聚合与记录语义变化；四项能力补入口
- **回归路径**：每个 Phase 的 gate 命令与受影响测试；`run-checks`、`check-skill-consistency`、`validatePostPhaseContract` 保持原退出语义
- **验收**：各 Phase 的覆盖 AC

- **可能受冲击的业务规则**：`skills/wh-review/SKILL.md` 的状态与覆盖三键语义；`catalog.yaml` 的登记形状；ModelTest 评测契约的调用方式
- **明确无影响**：不改运行时公共命令数量、不新增 stage、不改已发布评测资产、不改历史归档材料

## 补充材料

- 决策与来源：`specs/n11-same-condition-eval-20261022/decision-log.md`；`quality/evidence/decision-log-refs/requirement-change-log.md`
- 逐卡审计：`quality/evidence/decision-log-refs/audit-20261022-per-card.md`
- 审查失败原件：`quality/evidence/reviews/2026-10-22-direction-review-failure.md`；处置 `quality/evidence/decision-log-refs/review-dispositions.md`
- 评测链调研：`quality/evidence/decision-log-refs/research-20261022-modeltest-interface.md`
- 4 份 `docs/research/n11-*.md` runbook 是任务执行辅助，不是技能、标准或模板（U-006 不适用）；各自唯一消费者为对应 Phase 执行者与 verify-code，删除条件见 P1/T002 的 move-map 登记。
- 覆盖矩阵：`quality/evidence/decision-log-refs/coverage-matrix-5d.md`
