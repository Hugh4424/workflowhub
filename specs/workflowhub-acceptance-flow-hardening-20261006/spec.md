# 功能规格：WorkflowHub 验收流程加固（acceptance-flow-hardening）

> 读者：写 `phases/P<n>.md` 的 build-plan 作者、build-code 实施者、verify-code 审查者。
> 读完要能：说出本任务交付哪 14 条需求、22 条验收判据，每条判据由哪个 Phase 的哪张 Task 卡承接，用哪条命令判定。

- **功能名**：workflowhub-acceptance-flow-hardening-20261006
- **来源**：`specs/workflowhub-acceptance-flow-hardening-20261006/decision-log.md`（用户 m01493 确认；Append-only 更正 1–10）
- **状态**：build-plan 草案，待独立审查

## 速读卡（30 秒）

- 本任务把功能验收做成可执行、可判定、可复核、可回写的链路，同时保持薄核心：不新增 stage、gate、审查点、schema、校验器。
- 交付分四个工作包：① 验收流程优化；② card-06 越权删除回收；③ 输出文档精炼；④ make-decision 步骤重构。另加一项配套清理：删除 OI YAML 解析死链。
- 计划分 8 个 Phase。第一波 P1、P2、P3、P5、P6、P7 并发；第二波 P4（等 P1）；第三波 P8 端到端验收（等全部）。
- 证据只绑具名路径，不用哈希或版本追踪质量（U-017）。只跑受影响的针对性测试（`npx --no-install vitest run <file>`）。
- AC 判据的唯一权威是本文 `## Appendix A`；decision-log 的 `## 验收面` 只是交接索引（ADR-019）。AC-AFH-001…020 与日志 AC-01…AC-20 一一同号，AC-AFH-021、022 是 build-plan 新增。

## 来源与决策映射

本节回答：每条需求从哪条用户原始需求来，由哪条决定落地。R/U 编号的逐字原文在 task store `quality/evidence/log-archive-verbatim-and-talk.md`。

| 来源 ID | 决定 ID | FR / AC ID | 状态 / 受影响范围 | 未决 / 交接 |
| --- | --- | --- | --- | --- |
| R-001 需求期确认验收标准与用户故事 | ADR-001、ADR-019 | FR-AFH-001 / AC-AFH-001、AC-AFH-015、AC-AFH-021 | 已接受；decision-log 模板 | 无 |
| R-002 build-plan 的 spec 必须含详细 user case | ADR-001 | FR-AFH-001 / AC-AFH-001（user case 进 decision-log `## 验收面`，每条带「对应 UC」）；本 spec `## 3. 用户场景与状态覆盖` 的 SCN-001…SCN-006 是其落地 | 已接受；decision-log 模板与本 spec 场景卡 | 无 |
| R-001（④ 上位来源，见下方说明） | ADR-024…ADR-029 | FR-AFH-012 / AC-AFH-020 | 已接受；make-decision 三件 | 无 |
| R-003、R-005、R-006、R-009、R-011 每 phase 验收标准、数据前置、根因修复、效果评测、修复复验回写 | ADR-002、ADR-004、ADR-005、ADR-010、ADR-011、ADR-014…ADR-018、ADR-020、ADR-021 | FR-AFH-002 / AC-AFH-002、003、010、011、012、014、016、017 | 已接受；phase 模板 | OPEN-005 在 P3 承接（澄清 Q11） |
| R-004 独立验收 phase 端到端执行 | ADR-002、ADR-009 | FR-AFH-014 / AC-AFH-003、AC-AFH-007 | 已接受；P8 | 无 |
| R-007 verify-code 检查验收产物 | ADR-006、ADR-012、ADR-013 | FR-AFH-004、005、008 / AC-AFH-005、008、009 | 已接受；review 运行时与 verify-code SKILL | 无 |
| U-010 一起修 OI-021（stage-materials.json 两轨 semantic_fields 与 required/optional 不一致）与 OI-022（make-decision.md 契约与 direction 轨校验） | ADR-013 | FR-AFH-005 / AC-AFH-009 | 已接受；P1/T002 | 无 |
| R-010 真实测试、可复核证据、判定结果与风险 | ADR-003、ADR-007、ADR-017 | FR-AFH-003、006、007 / AC-AFH-004、006、013 | 已接受；stage-handoff、两件破损件 | 无 |
| U-018 card-06 回收同做、单独一个 phase | ADR-022 | FR-AFH-009 / AC-AFH-018 | 已接受；28 个既有文件 | 无 |
| U-019 文档按 ASD-STE100 / ISO 24495-1 精炼 | ADR-023 | FR-AFH-010、011、013 / AC-AFH-015、019、021、022 | 已接受；8 个模板与技能、死链 | 无 |
| U-017 不用哈希或版本追踪质量 | ADR-017 | 全部 AC 的证据形态 | 硬约束 | 无 |

④ 没有 U 编号。追踪行用 R-001（需求期讨论）作上位来源；实际授权来源是用户 m01418 的 8 步清单、m01800 与 m01807 的逐项裁定，见 decision-log `### Append-only 更正` 第 9 条（澄清 Q14）。不补造 U 编号。

## 1. 需求解释：问题与紧迫性

本节回答：为什么现在要改。

- CARD-01 的事故是阶段先宣告成功，之后才发现端到端验收从未执行。CARD-03 的终末 P6 只做一次聚合，23 条 AC 有 16 条从未真正执行（F-002）。
- 现状缺三件事：验收标准没有 AC 编号；make-decision 到 build-plan 之间没有验收交接载体；verify-code 被 `runtime/review/stage-materials.json:381-387` 禁止检查验收产物。
- 两件既有破损件仍在：脱敏正则会吃掉 `\d\d:\d\d`；`ac-evidence-summary` 测试 9/9 红且零生产 consumer。
- card-06 两批提交越权删除了 46 项内容，当时没有检查发现。
- 文档输出物越写越长（decision-log 曾达 1,854 行），读者难以定位。

## 2. 背景、目标与范围

本节回答：做到什么算完成，哪些在范围内。

### 背景

验收机制的主要载体是模板与技能散文：`skills/decision-log/templates/decision-log-template.md`、`skills/spec-plan/templates/phase-template.md`、`skills/stage-handoff/SKILL.md`。机器侧只有 review 运行时与 `validatePostPhaseContract`。

### 目标

- 验收面用例 → AC（唯一分母）→ Phase/Task → 证据，关系在模板层锁定。
- 最后一个 Phase 逐条执行全部 AC，每条输出一个 8 值档位和一条独立证据指针。
- verify-code 回执带宿主侧 `conclusion` 与 `coverage`。
- 修好件一，退役件二，零死引用。
- card-06 46 项按 F-024 逐项处置。
- 8 个生成文档的模板与技能按写作规则精炼。
- make-decision 按大纲重排为 15 步，并支持动态新增大纲模块。

### 范围内

- 本文 `### 全局文件边界与依赖` 列出的 57 个写集路径（`phases/index.md` 逐 Phase 列出；含 5 个 task store oracle 脚本、1 个验收 driver 与 `phases/P8.md`）。
- 只改机制，历史任务与在跑任务不回填（ADR-008）。

## 3. 用户场景与状态覆盖

本节回答：谁在什么情况下用到这些改动。

- **SCN-001**
  - **角色**：make-decision 执行者
  - **前提**：任务进入决策收敛
  - **触发**：写 decision-log
  - **结果**：日志有 `## 验收面` 索引表，每条 AC 有判定方式列；下游 build-plan 不用返工找写集
- **SCN-002**
  - **角色**：build-plan 作者
  - **前提**：decision-log 已确认
  - **触发**：写 `phases/P<n>.md`
  - **结果**：契约头有 `覆盖 AC`；最后一个 Phase 是验收 Phase，固定小节齐全；示例卡照抄能过 `validatePostPhaseContract`
- **SCN-003**
  - **角色**：build-code 执行者
  - **前提**：验收 Phase 未完成
  - **触发**：写阶段工作陈述
  - **结果**：只能写 `unverified` 或 `blocked`，不能写 `succeeded`；降级项列 user case、原因、风险承接人
- **SCN-004**
  - **角色**：验收 Phase 执行者与复验者
  - **前提**：某条 AC 失败
  - **触发**：分诊、修复、复验
  - **结果**：修复回到原 owner Phase 的 Task；换上下文复验（F2P+P2P）；回写五项
- **SCN-005**
  - **角色**：verify-code 审查者
  - **前提**：验收产物已产出
  - **触发**：发起 verify-code 审查
  - **结果**：审查面含验收产物；回执含 `conclusion`、`coverage`；空 findings 记 `no_findings_returned`
- **SCN-006**
  - **角色**：make-decision 执行者
  - **前提**：中途出现新需求
  - **触发**：新增大纲模块
  - **结果**：同一日志新增模块，补齐调研、决策、方案与验收标准，不新增步骤

状态覆盖：成功、失败、降级（`deferred`/`unavailable`/`incomplete`）、不确定（`inconclusive`、`flaky`）四态在 SCN-003、SCN-004、SCN-005 覆盖；空、加载中、权限、离线四态不适用，因为本任务无 UI（仓库无 `apps/`、`.tsx`、`.vue`）。

## 4. 产品事实与假设（PFACT）

本节回答：哪些事实已在 HEAD `b954b9a3` 实读核对。

- **PFACT-001**：8 值档位词表在 `runtime/evidence/acceptance-evidence-validator.mjs:6`：`pass`、`fail`、`inconclusive`、`deferred`、`missing`、`inconsistent`、`incomplete`、`unavailable`。只引用词表，不复用该校验器（它含 `SHA256_HEX`）。
- **PFACT-002**：`skills/stage-handoff/SKILL.md:14` 是七值阶段工作陈述；全仓 `succeeded` 置位点为 0。
- **PFACT-003**：`result.schema.json` 顶层 `required` 在 `runtime/review/schemas/result.schema.json:5-12`；当前无 `conclusion`、`coverage`。
- **PFACT-004**：`readTaskTypeFromDecisionLog` 在 `runtime/stage/stage-content-contracts.mjs:234`，只要求 `## 任务身份` 恰一次、`任务类型` 恰一条。
- **PFACT-005**：HEAD 上已红的 7 个测试文件：`skills/wh-review/scripts/__tests__/ac-evidence-summary.test.mjs`、`tests/acceptance/card-03-current.test.mjs`、`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`、`tests/contract/ocr-delegation-route.test.mjs`、`tests/contract/ocr-production-cutover.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`skills/wh-review/__tests__/human-brief-behavioral.test.mjs`。它们不能当目标 RED，也不能当 GREEN 判据。
- **PFACT-006**：`tests/contract/reference-audit.test.mjs:6` 只校验 move-map 字段非空，不校验文件存在。

## 5. 功能需求

本节回答：系统必须做什么。每条 FR 只有一个 owner Task（FR-AFH-009、010 跨卡，已注明）。

- **FR-AFH-001**：decision-log 模板含 `## 验收面` 节，并声明它是交接索引；AC 表含「判定方式（机器/人读）」列。
  - 范围边界：只改 `skills/decision-log/templates/decision-log-template.md`。
  - 依据：R-001、R-002；ADR-001、ADR-019。
  - 场景：SCN-001。
  - 验收：AC-AFH-001。
- **FR-AFH-002**：phase 模板契约头有 `覆盖 AC`；`Done` 写逐条档位；验收 phase 有固定小节（入口准则、数据与环境两份就绪件、五类执行事实、复验、变更批准、分诊与关闭、回写五项、六项结论）；写明失败→分诊→修复回原 owner Task→换上下文复验→回写的闭环。
  - 范围边界：只改 `skills/spec-plan/templates/phase-template.md`；被测试锁定的文字逐字保留。
  - 依据：R-003、R-004、R-005、R-006、R-009、R-011；ADR-002、004、005、011、014–018、020、021。
  - 场景：SCN-002、SCN-004。
  - 验收：AC-AFH-002、003、010、011、012、014、016、017、019。
- **FR-AFH-003**：stage-handoff 写明验收 phase 未完成不置 `succeeded`；降级项列 user case、原因、风险承接人。
  - 范围边界：只改 `skills/stage-handoff/SKILL.md`；不新增字段、facts、状态机、gate。
  - 依据：R-010；ADR-003、ADR-017。
  - 场景：SCN-003。
  - 验收：AC-AFH-004、AC-AFH-013。
- **FR-AFH-004**：verify-code 审查面放开到验收产物；verify-code 回执含宿主侧 `conclusion` 与 `coverage`。
  - 范围边界：`conclusion`/`coverage` 只在 verify-code 回执上必填（schema 条件分支），旧阶段、旧数据不受影响；不出现 provider `verdict`。
  - 依据：R-007；ADR-006。
  - 场景：SCN-005。
  - 验收：AC-AFH-005。
- **FR-AFH-005**：detail 轨与 direction 轨的 `semantic_fields` 与同轨 `required`/`optional` 逐 key 对齐；direction 轨有校验。
  - 范围边界：不新增第二套 key 空间。
  - 依据：R-007、U-010；ADR-013。
  - 场景：SCN-005。
  - 验收：AC-AFH-009。
- **FR-AFH-006**：件一：本机路径脱敏不再吃掉 `\d\d:\d\d` 等正则字面量。
  - 范围边界：`runtime/review/provider-material-projection.mjs:15` 改 1 行，测试补 3–6 行断言。
  - 依据：R-010；ADR-007。
  - 场景：SCN-005。
  - 验收：AC-AFH-006。
- **FR-AFH-007**：件二：`ac-evidence-summary` 退役，零死引用（含 move-map 登记与打包清单）。
  - 范围边界：删实现与测试、清 card-03 harness 引用、改 move-map（澄清 Q2）。
  - 依据：R-010；ADR-007。
  - 场景：SCN-005。
  - 验收：AC-AFH-006。
- **FR-AFH-008**：verify-code SKILL 写明独立功能验收记录与代码审查回执分开成件。
  - 范围边界：改 `workflows/verify-code/SKILL.md`。
  - 依据：R-007；ADR-012。
  - 场景：SCN-005。
  - 验收：AC-AFH-008。
- **FR-AFH-009**：card-06 46 项按 F-024 逐项处置回收（P4/T007、T008、T009 分担）。
  - 范围边界：28 个既有文件，零新建；不重建被删的校验器、认证、receipts、哈希绑定。
  - 依据：U-018；ADR-022。
  - 场景：SCN-002。
  - 验收：AC-AFH-018。
- **FR-AFH-010**：8 个生成文档的模板与技能按 STE100 / ISO 24495-1 精炼：固定骨架、编号写作规则、显式声明「这是写作指引，不是质量门」（P3/T005、P5/T010、P5/T011 分担）。
  - 范围边界：不新增校验器、评分器、字数门。
  - 依据：U-019；ADR-023。
  - 场景：SCN-001、SCN-002。
  - 验收：AC-AFH-015、AC-AFH-019。
- **FR-AFH-011**：decision-log 模板结构按 build-plan 实用观察精炼（F-040 §6：写集表覆盖全部工作包、冲突文件唯一 owner、退役反向引用扫描、精确路径、AC 判定方式列、锚点与改动同行、只列未决项；删除或降为指针的节）。
  - 范围边界：保留 `## 任务身份` 与 `任务类型`。
  - 依据：U-019；ADR-023。
  - 场景：SCN-001。
  - 验收：AC-AFH-021。
- **FR-AFH-012**：make-decision 按大纲重排为 15 步，并支持动态新增大纲模块。
  - 范围边界：只改 `workflows/make-decision/` 三件；不加步数断言；不改 `runtime/`。
  - 依据：R-001（④ 上位来源）；ADR-024–029。
  - 场景：SCN-006。
  - 验收：AC-AFH-020。
- **FR-AFH-013**：删除 `runtime/stage/stage-content-contracts.mjs` 的 OI YAML 解析死链。
  - 范围边界：保留 `readTaskTypeFromDecisionLog`、`readUiApplicabilityFromDecisionLog`、`validatePostPhaseContract` 及其依赖；不改 `package.json`。
  - 依据：U-019；ADR-023（日志瘦身配套）；澄清 Q13。
  - 场景：SCN-001。
  - 验收：AC-AFH-022。
- **FR-AFH-014**：端到端验收 phase 对每条 AC 输出一个 8 值档位和一条独立证据指针。
  - 范围边界：P8 一个 driver 脚本；不新增 gate。
  - 依据：R-004；ADR-002、ADR-009。
  - 场景：SCN-002、SCN-004。
  - 验收：AC-AFH-003、AC-AFH-007。

## 6. 交互与界面

N/A — 本任务无 UI：仓库无 `apps/`、`.tsx`、`.vue`、`.jsx`（decision-log `:475`；澄清 Q16）。

## 7. 数据与持久化

N/A — 不新增持久对象。`result.schema.json` 只在 verify-code 分支加两个宿主侧字段；`facts.jsonl` 只写既有字段（ADR-010、澄清 Q3）。

## 8. 性能、安全与可观测

- 件一修复属于安全职责：provider 不得读到真实宿主路径，同时不得损坏正则字面量。
- 不新增依赖（D-007），不改 `package.json`。

## 9. 迁移与兼容

只改机制，历史任务与在跑任务不回填（ADR-008）。既有 `wh-review-result.v1` 的旧 verify-code 回执在 `conclusion` 与 `coverage` 两项均缺时仍按原形状可读、不回填；任一宿主扩展出现时，两项必须成对并满足现有枚举、类型与计数约束；当前唯一 `review-record-route` 在 verify-code 始终派生两项，既有 `wh-review-attempt.v1` 的旧 `coverage` 不进入 result 宿主扩展分支。

## 10. 明确不做与默认必须成立

- 不新增 stage、gate、审查点、schema、校验器、档位词、第二套进度权威。
- 不用哈希或版本追踪质量；证据只绑具名路径。
- 不做 CARD-01 与 CARD-03 回放；不推演 CARD-03 冻结基线（33 文件、38 条失败）。
- 不拿回 F-024 判为不拿回的 5 项：`registry:` 与 `metrics_path:`、deep-research、版本化 JSON 块、`closureCheck`、`architect-code-review`。
- 不改 `runtime/review/review-policy.mjs`（只读核对，澄清 Q4）、`runtime/task/task-store.mjs`（澄清 Q3）、`skills/spec-tasks/templates/index-template.md`（澄清 Q10）。
- 不新增仓库测试文件；task store 的 oracle 脚本是证据件（澄清 Q6）。
- 不跑全量 `vitest`、`npm test`、`test:safe`。

## 澄清记录（spec-clarify）

本节回答：build-plan 遇到的 20 个问题如何裁定。主会话按用户授权「有问题尽量自己判断」裁定，权威记录在 task store `quality/evidence/research/F-040-build-plan-skeleton.md` §1。

| Q | 问题 | 裁定 | 理由 |
| --- | --- | --- | --- |
| Q1 | ②、③ 各单独一个 phase，与「每文件唯一 owner」在 10 个冲突文件上冲突 | 采用 F-038 §二 owner 表；承接项写进 owner Phase 的 Task 卡并标来源工作包（如「承接 ② B05」） | `runtime/stage/stage-content-contracts.mjs:1048-1051` 不许重复写集 |
| Q2 | 改不改 `docs/architecture/move-map.json` | 改：删 `:3214-3222` 的 ac-evidence-summary.mjs 条目，从 `:1088`、`:1096` 消费者列表删 ac-evidence-summary.test.mjs；归 P2 | AC-06 要求零死引用；日志 `:425/:484` 的「不改 move-map」是通用非目标，被 AC-06 具体判据覆盖 |
| Q3 | `runtime/task/task-store.mjs` | 不改 | 行校验 `:65` 拒绝未知字段；ADR-010 只要求写既有字段 |
| Q4 | `runtime/review/review-policy.mjs` | 不进写集，只读核对；实现中发现必须改则 STOP 回主会话 | 它只 import stage-materials.json，无 verify-code 专属逻辑 |
| Q5 | `workflows/build-plan/steps.json` | 改（A05 `completion_evidence[]` 声明字段），归 P4；② 改动面由 27 更正为 28 | F-024 A05 行列了 5 个 steps.json，§二 汇总漏了一个 |
| Q6 | 行为改动的 RED 载体与「不新增测试」 | 每个行为 Phase 在 task store 写 `quality/tests/afh-p<n>-oracle.mjs`（证据件，不进仓库测试套件）；已在写集的仓库测试照日志改 | 「不新增测试」指仓库测试套件 |
| Q7 | AC-04「构造负例重放，断言未置 succeeded」 | 改为人读判据：stage-handoff 规则原文 + P8 走查记录 + 独立审查判定；机器重放不可得，因为需要新 gate | 薄核心：记事实不阻断；ADR-003 只改散文 |
| Q8 | AC-05「正负例各跑一次 verify-code 审查」 | 用 P1 oracle 在 canonical/schema 层构造正例与负例回执校验，不调真实 provider | 只跑受影响针对性测试 |
| Q9 | AC-19「`:198-217` 逐字未改」与「压缩 G-2 示例块」矛盾；`:217-239` 示例卡照抄过不了验证器 | G-2 示例块中被 `tests/contract/post-build-plan-missing-index.test.mjs:331-350` 锁定的 12 行逐字不改；锚点按文字判定，不按行号；T001 示例卡改成能过验证器的写法；字段说明表可压缩 | 测试按文字锁定；错误示例会误导后续 build-plan |
| Q10 | spec-template `:212-223` 提示 U/V/D，验证器只认 R/U/PRD/CARD；FR/AC DOMAIN 单段三位未写明 | P5 改 spec-template 与 `skills/spec-specify/SKILL.md` 写明；index-template 不改 | F-039 §7 不一致 4、5 |
| Q11 | OPEN-005 失败→修复→复验闭环的承接机制 | 写进 phase 模板验收 Phase 固定小节（P3）：分诊（ADR-021）→ 修复回原 owner Phase 的 Task → 换上下文复验（ADR-015，F2P+P2P）→ 回写五项；不新增 stage/gate/审查点 | 日志 OPEN-005 移交条件 |
| Q12 | ADR-027 计划草案骨架在哪一步产出 | 在 step 11 grill 开头产出，作为 grill 输入；不新增步骤 | ADR-024 定 15 步 |
| Q13 | 删死链与 AC-15「不改 `:664` 正则」 | 删整条死链，单独 P7；AC-15 该失败条件解释为「不许让该正则识别 `## 验收面`」 | `:664` 在零调用者函数里；用户此前裁定本次删除 |
| Q14 | ④ 没有 U 编号 | ④ 用 R-001 作上位来源，来源映射写明用户 m01418/m01800/m01807 与日志更正 9 | 不补造 U 编号 |
| Q15 | decision-log 三处已知错误 | 原位修短名表路径，并加 `### Append-only 更正` 第 10 条（已完成） | 下游要能 grep |
| Q16 | UI | 非 UI 任务，step 5 跳过 | 日志 `:475` |
| Q17 | P1 写集是否覆盖 runner focus 与真实回执组装 | P1 写集补 `skills/wh-review/scripts/simple-review-runner.mjs` 与 `runtime/review/review-record-route.mjs`；写集路径总数 55 → 57 | 真实回执与 runner focus 在这两处（`simple-review-runner.mjs:114` FOCUS 表、`:296-300` 渲染；`review-record-route.mjs:99-102` 组装 record），否则 ADR-006 只落在死函数上 |
| Q18 | ADR-024「保留范围分诊与一致性核对两步」（decision-log `:340`）与 15 步计数 | 解释为两项职能保留：范围分诊并入第 1 步（slug 保留 `load-context`，SKILL 方法第 1 条写明含范围分诊），一致性核对是第 14 步；总步数 15 不变 | ADR-024 列表写 15 步且第 1 步明写「载入上下文与范围分诊（现有 load-context 与 triage-scope）」 |
| Q19 | R-002（spec 须含详细 user case）与 U-010（一起修 OI-021、OI-022）在来源映射表无行（F-041 #1） | 补两行，不新增 FR/AC/Phase：R-002 → ADR-001 → FR-AFH-001 / AC-AFH-001（本 spec 场景卡 SCN-001…006 是落地）；U-010 → ADR-013 → FR-AFH-005 / AC-AFH-009（P1/T002） | decision-log `:30`、`:45`、`:463`；ADR-001 引 R-002；ADR-013 承接 OI-021、OI-022 |
| Q20 | AC-AFH-006 死引用零命中的排除范围 | 排除 `specs/archive/**`、`.planning/**`、`docs/archive/**` 与本任务 `specs/workflowhub-acceptance-flow-hardening-20261006/**`；前三处是历史记录，不改；本任务 spec 目录是在描述退役对象本身 | `.planning/` 下是历史审查请求原件，与 `specs/archive/` 同性质，改它等于改写历史；`docs/archive/repository-inventory.tsv` 是 Phase 0 历史清单（HEAD 命中 3 行），P2 STOP 已把它列为非当前；本任务 spec 与 decision-log 必须写出被退役的名字。P2 的扫描与 `afh-p2-oracle.mjs` 全仓扫描用同一排除范围 |
| Q21 | P1/T002 的逐 key 对齐动作与 STOP 泛指投影变化冲突 | 无当前两轨材料 producer 的 8 个孤立 semantic key 按 P1 key 读回表删除；将既有同轨 optional key 补入 semantic_fields。只读 projection；其字段清单随对齐产生的变化不单独触发 STOP。删除会丢失当前真实审查输入或要求改写集外消费者行为时仍 STOP | ADR-013 明确补齐或删除非法 key；FR-AFH-005、AC-AFH-009 要求同轨 key 集一致。P1 只读调查发现 projection 把 fields 入投影且无当前生产调用；原 STOP 不能反过来禁止已确认的对齐目标。方向、FR/AC、生产写集与冻结断言不变 |
| Q22 | P3/T006 显式重列退役英文字段与 thin-core-residue 的可搬运方法零残留要求冲突 | SKILL 用四类完整中文语义明确禁止新记录携带材料快照树、来源摘要、材料修订、新鲜度绑定；不依赖当前 task 的 ADR 编号、不拆字或转义。精确旧名与出处仍在 ADR-017 原文，禁止新字段、reader 或机器新鲜度门；T006 具名读回与冻结测试不变 | ADR-017 的对象是新记录退役绑定，FR-AFH-003 不新增字段，AC-AFH-013 要求新记录零绑定；没有要求可搬运 SKILL 复述旧名。P3 新英文字段说明导致 thin-core-residue 两真实失败，并影响 P6 gate；本条只澄清方法写法，不改变方向、验收或测试 |
| Q23 | P8 入口将 HEAD 相等或仅 P8 差异当条件，与 U-017/跨 Phase 无全量快照绑定冲突 | HEAD 只记录普通执行事实，不以相等、版本或整树对比拦推进。新改动、失败或未解疑点按受影响写集/用例复验，原失败保留；不因纯提交变化重复未受影响检查 | U-017/ADR-017 与全局非目标明确不用哈希或版本追踪质量；项目跨 Phase 只核本 Phase 声明写集。P8 仍消费实际上游验证和逐条 AC 原件，完成判据、FR/AC/冻结测试不变，不新增许可证或扩大测试 |
| Q24 | P4/A04 旧职责名是否要求复活 TaskKernel、以及 T008 已有等义是否双写 | A04 的旧名仅为人读方法职责标记；六信息白名单与13条文本 toContain 恢复，实际保存/回读复用现窄工具，raw原字节保留。SHA不作命名/质量绑定/相等门；不恢复fixture/kernel/runtime对象。T008逐项保已有等义、只补缺失说明，短语锚不替代语义来源 | F-024 A04明定对应文本且不恢复内容寻址，P4禁止executeDeclaredHandoff运行断言/runtime改动；当前旧三函数无生产consumer。F-024多项及硬禁令17要求已有等价不重复；FR-AFH-009/AC-AFH-018按原退役边界保持，不新增方向/写集/测试/控制面 |
| Q25 | P8 先跑聚合再填记录，与 driver recorded() 要求记录非空且不以「未执行」开头形成循环 | 先以已发生上游/准备事实限定 scope，不预填 P8 终末效果；原执行者按原 gate 采一次真实诊断初聚合，缺记录 FAIL 保留；原 owner 按 actual 补 P8 专属记录；另一个上下文按原 L2 同一 gate_cmd 完整执行一次最终 GREEN 复验，再据实补复验与 22 行结论。AC004/AC007 人读来源仍由独立审查判断，driver 只转录 | 保全部 22 验收要求、原 driver 断言/分母/词表/退出语义与原 L2 完整 gate；最终复验重放五上游 oracle 是初 FAIL/新增 P8 记录后的原声明跨 Phase 检查，不是无范围全回归或为追空 findings 重审。两次实际执行各存原件，旧 FAIL 不改 GREEN；不新增 runner、stage、字段、对象或推进门 |

## 验收流程

本节回答：谁在什么时候判定通过。

1. 每个 Phase 实施前，实施者在 HEAD 跑本 Phase oracle（G-2 Phase 跑读回命令），存 RED 原始输出到 task store `quality/tests/afh-p<n>-oracle.red.txt`。
2. 实施后同一命令 exit 0，即为 GREEN；原始输出另存一份，路径写进 Phase 的 `evidence_path`。
3. P1–P7 全部 GREEN 后，P8 跑 `quality/tests/afh-acceptance.mjs`，对 AC-AFH-001…022 逐条输出档位与证据指针，结论写进 `phases/P8.md` 固定小节。
4. 任一 AC 非 `pass`：分诊 → 修复回原 owner Phase 的 Task → 换上下文复验（F2P+P2P）→ 回写五项。
5. verify-code 做一次独立审查（ADR-009）。人读判据（AC-AFH-004、007 的人读部分）由独立审查判定。

## 测试标准

- 只跑受影响的针对性测试，命令统一 `npx --no-install vitest run <file>`。
- RED 必须是具名断言失败，不能是加载或环境错误。PFACT-005 的 7 个文件不能当 RED 或 GREEN 判据。
- 判定器要求显式通过元素，不许「无失败即通过」，不许用计数代替逐条（ADR-020）。

## 架构边界

- 运行时改动只限 `runtime/review/` 五个文件、`runtime/stage/stage-content-contracts.mjs`（只删死链）、`skills/wh-review/scripts/` 两件脚本。
- 其余改动是模板、技能、workflow 散文与声明字段。
- 不新增公共命令；public runtime 仍为七类。

## 实现设计（全局权威）

### 代码锚点

- 来源边界：本节锚点均在 HEAD `b954b9a3` 实读（task store `quality/evidence/research/F-038-build-plan-writeset-partition.md` §四、`F-039-post-cohort-machine-contract.md`）。
- 现状与目标差异：
  - verify-code forbidden：`runtime/review/stage-materials.json:381-387`（`acceptance_evidence`、`evidence_map`、`final_test_summary`、`quality_verify`、`requirement_replay`）→ 放开验收产物。
  - focus 末句：`runtime/review/review-packet-identity.mjs:13` 与 runner 实际渲染用的 `skills/wh-review/scripts/simple-review-runner.mjs:114` `FOCUS["verify-code"]`（`:296-300` 渲染）→ 两处同改为允许报告验收产物问题（Q17）。
  - 回执组装：`runtime/review/review-record-route.mjs:99-102` → verify-code 阶段调用 `deriveVerifyCodeConclusion` 写入 `conclusion`/`coverage`（Q17）。
  - 回执 schema：`runtime/review/schemas/result.schema.json:5-12` 顶层 required、`:555-577` allOf/if、`:630` `adjudication`、`:638` `wh-review-adjudication.v1` → verify-code 分支加 `conclusion`、`coverage`。
  - 聚合：`runtime/review/canonical-review-result.mjs:361-364` 三元式 → 宿主侧算 `conclusion`，不读 provider `verdict`。
  - key 集：detail `runtime/review/stage-materials.json:35-43` 对 `:269-286`；direction `:12-23` 对 `:240-268`；`skills/wh-review/scripts/review-materials.mjs:167`、`:229-234`、`:384`、`:393-401`。
  - 件一：`runtime/review/provider-material-projection.mjs:15` `LOCAL_HOST_PATH` 盘符分支 `(?<![A-Za-z0-9])` → `(?<![A-Za-z0-9\\])`。
  - 件二：`skills/wh-review/skill-bundle.json:18`；`tests/acceptance/card-03-current.mjs:26`、`:121`、`:131`、`:151`、`:162-163`、`:430`、`:463-475`、`:507`、`:580`、`:805-820`（`:583-584` 是通用展开，不删）；`tests/acceptance/card-03-current.test.mjs:84`、`:140`、`:231`、`:246`、`:381`、`:458`；`docs/architecture/move-map.json:1088`、`:1096`、`:3214-3222`。
  - 交接：`skills/stage-handoff/SKILL.md:14` 七值陈述。
  - phase 模板锁定文字：`skills/spec-plan/templates/phase-template.md:35`、`:43-45`、`:50`、`:54`、G-2 块 12 行（`tests/acceptance/card-03-current.mjs:278-291`、`:25`；`tests/contract/post-build-plan-missing-index.test.mjs:331-350`）。
  - make-decision：`workflows/make-decision/steps.json:4-65`、`:45-49`；`workflows/make-decision/SKILL.md:15-26`、`:21`、`:23`；`workflows/make-decision/skill-deps.yaml:8`；消费者 `runtime/stage/stage-skill-runtime.mjs:84`、`tools/cli/smoke-local-skill-dispatch.mjs:22-27`。
  - 死链：`runtime/stage/stage-content-contracts.mjs:4`（js-yaml，仅 `:320` 使用）、`:10`、`:14`、`:301-370`、`:372`、`:534-645`、`:646`、`:1354-1364`；保留 `:173`、`:234`、`:1010`。
- 读取顺序：先读本文 Appendix A，再读本 Phase 文件，再读上面的锚点。
- 运行条件：Node ESM，vitest 2.1.9（`vitest.config.mjs`，forks 最多 2 个）；无新依赖。

### 接口与失败语义

- 选择的架构方案：散文与声明字段承载验收机制；机器侧只在 review 回执加两个宿主侧字段，并删一条死链。
- 模块职责：
  - `runtime/review/canonical-review-result.mjs` 由 findings 与 provider 状态算 `conclusion`；`coverage` 记被审对象覆盖情况。
  - `skills/wh-review/scripts/review-materials.mjs` 持有 `approved_direction` 逐字节校验与 direction 轨校验。
  - `skills/stage-handoff/SKILL.md` 定义 `succeeded` 前置条件，人读消费。
- 接口与数据流：verify-code 审查材料 → provider findings → 宿主侧 `conclusion`（∈ `pass`、`pass_with_findings`、`needs_revision`、`reject`、`inconclusive`）与 `coverage` → 回执。
- 失败语义：
  - 空 findings 记 `no_findings_returned`，不记 `pass`。
  - 任一 provider 失败记 `inconclusive`。
  - 回执出现 provider `verdict` 字段即 schema 失败。
  - 非 verify-code 回执缺 `conclusion` 仍有效。
  - 验收档位只取 8 值词表；缺数据保持 `incomplete` 或 `unavailable`，不得写成 `pass`。
- 新增控制面：无。`conclusion`/`coverage` 是既有回执上的字段，已在 decision-log OI-020 第 ③ 条登记。

### 全局文件边界与依赖

- 新增：task store `quality/tests/afh-p1-oracle.mjs`、`afh-p2-oracle.mjs`、`afh-p4-oracle.mjs`、`afh-p6-oracle.mjs`、`afh-p7-oracle.mjs`、`afh-acceptance.mjs`；`specs/workflowhub-acceptance-flow-hardening-20261006/phases/P8.md`。仓库内不新增生产文件或测试文件。
- 删除：`skills/wh-review/scripts/ac-evidence-summary.mjs`、`skills/wh-review/scripts/__tests__/ac-evidence-summary.test.mjs`。
- 修改：按 `phases/index.md` 写集逐 Phase 列出；每个路径只有一个 owner Phase。P1 写集含 `skills/wh-review/scripts/simple-review-runner.mjs` 与 `runtime/review/review-record-route.mjs`（Q17）。
- 禁止改动：`runtime/review/review-policy.mjs`、`runtime/task/task-store.mjs`、`runtime/evidence/acceptance-evidence-validator.mjs`、`skills/spec-tasks/templates/index-template.md`、`package.json`、`CONSTITUTION.md`、`docs/architecture/test-asset-governance-rules.md`、`specs/archive/**`。
- 全局依赖：P4 依赖 P1（ADR-012 引用 P1 定下的 `conclusion`/`coverage` 名称）；P8 依赖 P1–P7；其余无依赖。
- 文件归属：10 个冲突文件按 F-038 §二 owner 表；承接项写在 owner Phase 的 Task 卡。
- 回滚与恢复：只回退本任务新增的模板节、字段与回执字段，不迁移历史材料（ADR-008）；`result.schema.json` 字段新增不可逆性高，必须与聚合面同改。

### 需求到任务追踪

| 来源 / 决定 | 原义行为/强度 | FR / AC | Phase / Task | 正例 + 负例判据 / oracle / 依赖 |
| --- | --- | --- | --- | --- |
| R-007 / ADR-006 | verify-code 审查面含验收产物；回执宿主侧结论 | FR-AFH-004 / AC-AFH-005 | P1/T001 | 正例＝verify-code 回执含 `conclusion`、`coverage` 且 schema 通过；负例＝缺字段、含 `verdict`、空 findings 记 `pass` 均被拒；oracle＝ORACLE-AFH-T001-REVIEW-CONCLUSION；依赖＝无 |
| R-007 / ADR-013 | 材料 key 集逐 key 对齐，direction 轨有校验 | FR-AFH-005 / AC-AFH-009 | P1/T002 | 正例＝两轨无「两者都不含」的 key；负例＝direction 非法 key 被校验拒绝；oracle＝ORACLE-AFH-T002-MATERIAL-KEYS；依赖＝T001 |
| R-010 / ADR-007 | 件一：脱敏不吃正则字面量 | FR-AFH-006 / AC-AFH-006 | P2/T003 | 正例＝`\d\d:\d\d` 原样保留；负例＝`C:\Users\x` 仍被脱敏；oracle＝ORACLE-AFH-T003-REDACTION；依赖＝无 |
| R-010 / ADR-007 | 件二退役，零死引用 | FR-AFH-007 / AC-AFH-006 | P2/T004 | 正例＝`ac-evidence-summary`、`ORACLE-FIX-002`、`AC-FIX-002` 全仓零命中（排除 `specs/archive/**`、`.planning/**`、`docs/archive/**` 与本任务 `specs/workflowhub-acceptance-flow-hardening-20261006/**`，澄清 Q20）；负例＝任一残留命中即失败；oracle＝ORACLE-AFH-T004-RETIRE-SUMMARY；依赖＝无 |
| R-003、R-004、R-005、R-006、R-009、R-011、U-019 / ADR-002、004、005、010、011、014–018、020、021、023 | phase 模板契约头、Done 档位、验收固定小节、闭环、精炼 | FR-AFH-002、FR-AFH-010 / AC-AFH-002、AC-AFH-003、AC-AFH-010、AC-AFH-011、AC-AFH-012、AC-AFH-014、AC-AFH-016、AC-AFH-017、AC-AFH-019 | P3/T005 | 正例＝读回 `覆盖 AC` 与固定小节各标题，锁定文字逐字在；负例＝锁定测试失败或任一小节缺失；oracle＝ORACLE-AFH-T005-PHASE-TEMPLATE；依赖＝无 |
| R-010 / ADR-003、ADR-017 | `succeeded` 前置条件；降级项承接人；承接 ② B05 | FR-AFH-003 / AC-AFH-004、AC-AFH-013 | P3/T006 | 正例＝SKILL 原文含前置条件与降级三要素；负例＝退役字段出现或无承接人要求；oracle＝ORACLE-AFH-T006-HANDOFF；依赖＝无 |
| R-007、U-018 / ADR-012、ADR-022 | verify-code 功能验收记录独立成件；workflows 回收 | FR-AFH-008、FR-AFH-009 / AC-AFH-008、AC-AFH-018 | P4/T007 | 正例＝F-024 workflows 项逐项读回、build-prd 测试恢复断言通过；负例＝5 个不拿回项出现即失败；oracle＝ORACLE-AFH-T007-WORKFLOW-PULLBACK；依赖＝P1 |
| U-018 / ADR-022 | skills 11 个 md 回收 | FR-AFH-009 / AC-AFH-018 | P4/T008 | 正例＝F-024 skills 项逐项读回；负例＝`skills/wh-review/SKILL.md` sha256 读回被加强即失败；oracle＝ORACLE-AFH-T008-SKILLS-PULLBACK；依赖＝无 |
| U-018 / ADR-022 | standard-workflow 恢复「专业质量」一节（回收 A27） | FR-AFH-009 / AC-AFH-018 | P4/T009 | 正例＝`### 专业质量` 一节位于 `## build-code 测试与质量` 与 `### 证据只留原始件` 之间、A27 原句在场；负例＝`### 证据只留原始件`、`### stage 结束` 被改或既有行被删即失败；oracle＝ORACLE-AFH-T009-PRO-QUALITY；依赖＝无 |
| R-001、U-019 / ADR-001、ADR-019、ADR-023、ADR-029 | decision-log 模板 `## 验收面`、结构精炼；承接 ② A15/A26、B02，④ ADR-029 | FR-AFH-001、FR-AFH-010、FR-AFH-011 / AC-AFH-001、AC-AFH-015、AC-AFH-021 | P5/T010 | 正例＝模板含 `## 验收面` 与判定方式列、`## 任务身份` 保留；负例＝`readTaskTypeFromDecisionLog` 读模板失败或 `runtime` 出现 `验收面`；oracle＝ORACLE-AFH-T010-DECISION-LOG-TEMPLATE；依赖＝无 |
| U-019 / ADR-019、ADR-023 | 其余 5 件精炼；承接 ② B07、B16，① 指回句 | FR-AFH-010 / AC-AFH-015、AC-AFH-019 | P5/T011 | 正例＝5 件含编号写作规则与「写作指引，不是质量门」声明；负例＝必保锚点改坏即失败；oracle＝ORACLE-AFH-T011-DOC-REFINE；依赖＝T010 |
| R-001 / ADR-024–ADR-029 | make-decision 15 步与动态模块；承接 ② A05–A24 | FR-AFH-012 / AC-AFH-020 | P6/T012 | 正例＝15 步顺序与日志一致、`step_id` 连续；负例＝顺序错或 trigger 仍为 `after_outline_talk`；oracle＝ORACLE-AFH-T012-STEP-ORDER；依赖＝无 |
| U-019 / ADR-023 | 删除 OI YAML 解析死链 | FR-AFH-013 / AC-AFH-022 | P7/T013 | 正例＝死链导出不存在、保留函数行为不变；负例＝card-10 校验不再 ok 或任务类型读不出；oracle＝ORACLE-AFH-T013-DEAD-CHAIN；依赖＝无 |
| R-004 / ADR-002、ADR-009 | 端到端逐条档位与证据指针；重放 AC-AFH-001…022 | FR-AFH-014 / AC-AFH-003、AC-AFH-007 | P8/T014 | 正例＝22 行各一个 8 值档位加具名证据路径；负例＝缺行、词表外档位或计数代替逐条即失败；oracle＝ORACLE-AFH-T014-ACCEPTANCE；依赖＝P1、P2、P3、P4、P5、P6、P7 |

### 全局验证策略

- 验证策略：每个 Phase 一个 gate_cmd；行为 Phase 跑 task store oracle 脚本，脚本内部只调针对性 vitest；G-2 Phase 用读回命令或针对性 vitest。
- 波次：第一波 P1、P2、P3、P5、P6、P7 并发（写集不相交）；第二波 P4（等 P1）；第三波 P8（等 P1–P7）。
- RED/GREEN 设计：
  - 行为 Phase 的 RED 在 HEAD 实跑，exit 1 且失败的是具名断言；原始输出存 task store `quality/tests/afh-p<n>-oracle.red.txt`。
  - P1：`node "$AFH_TASK_DIR/quality/tests/afh-p1-oracle.mjs"`
  - P2：`node "$AFH_TASK_DIR/quality/tests/afh-p2-oracle.mjs"`
  - P3：G-2 读回 + `npx --no-install vitest run tests/contract/post-build-plan-missing-index.test.mjs tests/contract/thin-core-residue.test.mjs tests/integration/runner-clean-install.test.mjs`
  - P4：`node "$AFH_TASK_DIR/quality/tests/afh-p4-oracle.mjs"`
  - P5：G-2 读回 + `npx --no-install vitest run tests/contract/post-build-plan-missing-index.test.mjs tests/contract/thin-core-residue.test.mjs`
  - P6：`node "$AFH_TASK_DIR/quality/tests/afh-p6-oracle.mjs"`
  - P7：`node "$AFH_TASK_DIR/quality/tests/afh-p7-oracle.mjs"`
  - P8：`node "$AFH_TASK_DIR/quality/tests/afh-acceptance.mjs"`
- 针对性测试清单（HEAD 基线绿，改后必须仍绿）：
  - P1：`npx --no-install vitest run tests/contract/card03-review-orchestration.test.mjs tests/contract/review-materials-contract.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs tests/contract/build-prd-review-contract.test.mjs`
  - P2：`npx --no-install vitest run skills/wh-review/scripts/__tests__/material-redaction.test.mjs skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs tests/contract/repository-inventory.test.mjs`；`tests/contract/reference-audit.test.mjs` 在 HEAD 已红，列为基线红，不作判据；`tests/acceptance/card-03-current.test.mjs` 在 HEAD 加载失败，只做静态读回。
  - P3：`npx --no-install vitest run tests/contract/post-build-plan-missing-index.test.mjs tests/contract/thin-core-residue.test.mjs tests/integration/runner-clean-install.test.mjs`
  - P4：`npx --no-install vitest run tests/contract/build-prd-review-contract.test.mjs tests/contract/thin-core-residue.test.mjs tests/integration/runner-clean-install.test.mjs`
  - P5：`npx --no-install vitest run tests/contract/thin-core-residue.test.mjs tests/contract/post-build-plan-missing-index.test.mjs`
  - P6：`npx --no-install vitest run tests/contract/thin-core-residue.test.mjs tests/contract/material-set-per-stage.test.mjs tests/contract/review-input-bounds-portability.test.mjs`
  - P7：`npx --no-install vitest run tests/contract/post-build-plan-missing-index.test.mjs tests/contract/thin-core-residue.test.mjs tests/integration/runner-clean-install.test.mjs`
- 最终聚合：P8 driver 逐条输出 AC-AFH-001…022 各一行；任一非 `pass` 时 exit 1。材料自检：`node "$AFH_TASK_DIR/quality/evidence/research/F-039-validate-post.mjs" "$REPO" specs/workflowhub-acceptance-flow-hardening-20261006` 必须 ok。
- 不能证明的内容：不实证证明新机制能拦住 CARD-01/CARD-03 那批事故（不回放，ADR-009）；人读判据（AC-AFH-004 等）只由独立审查判定，没有机器重放；文档精炼质量靠人读自检。
- 风险维度与不适用理由（按 testing-system-blueprint 至少检查项；只指向已有 Phase 与 oracle，不新增 gate；层级判定见 task store `quality/evidence/research/F-043-test-routing.md`）：
  - 行为结果：P1 ORACLE-AFH-T001/T002、P2 ORACLE-AFH-T003/T004、P6 ORACLE-AFH-P6-STEP-ORDER、P7 ORACLE-AFH-P7-DEAD-CHAIN 的正例与负例；P8 ORACLE-AFH-P8-ACCEPTANCE 逐条重放 AC-AFH-001…022。
  - 状态/数据流：P1 回执 `conclusion`/`coverage` 由宿主推导写入 record（ORACLE-AFH-T001-REVIEW-CONCLUSION）；P1 两轨材料 key 集（ORACLE-AFH-T002-MATERIAL-KEYS）；P4 steps.json 新增声明字段不改读取方（ORACLE-AFH-P4-PULLBACK）。
  - 错误/恢复：P1 direction 轨缺必填 key 抛 `MATERIAL_INCOMPLETE`（ORACLE-AFH-T002-MATERIAL-KEYS）；各卡 STOP / 恢复行；P8 driver 词表读不到时 exit 2 记 setup 失败（不算 RED）。取消不适用：本任务不改可取消的长任务。
  - 权限/安全：P2 脱敏（ORACLE-AFH-T003-REDACTION，宿主路径仍脱敏负例）；不改认证授权，Git 授权面只读。
  - 并发/原子性：不适用——不改锁、事务或并发写；同文件串行由 P1 T001→T002 顺序与 index 写集唯一 owner 保证。
  - 跨模块 seam：P1 schema↔runner focus↔record-route（ORACLE-AFH-T001-REVIEW-CONCLUSION 与 `runner-clean-install` 基线）；P2 Runner 发布清单 `skill-bundle.json`（ORACLE-AFH-T004-RETIRE-SUMMARY）；P4←P1 字段名；P6 `step_id`↔`smoke-local-skill-dispatch` 断言（ORACLE-AFH-P6-STEP-ORDER）；P7 保留函数↔card-10 校验（ORACLE-AFH-P7-DEAD-CHAIN）。
  - 可观测性/来源：每个 oracle 的 RED/GREEN 原始输出各存一份于 task store `quality/tests/`；P8 每条结论带证据路径；review 原件只由 review-record-route 保存。
  - UI：不适用——本任务无 UI 改动；P3 模板只写 UI 判据要求（AC-AFH-010），不产生加载、空、错误或可访问性状态。

## Appendix A — 验收判据（唯一权威）

本节回答：每条 AC 怎样判定。`$REPO` 指仓库根，`$AFH_TASK_DIR` 指 task store。证据只绑具名路径，不用哈希或版本。

- [ ] **AC-AFH-001**：decision-log 模板含 `## 验收面` 节并声明为交接索引；本任务 decision-log 的 `## 验收面` 20 条逐条六项非空。关联 FR-AFH-001；来源 R-001；对应日志 AC-01。
验证：`bash -c 'grep -n "^## 验收面" skills/decision-log/templates/decision-log-template.md && sed -n "/^## 验收面/,/^## 风险/p" specs/workflowhub-acceptance-flow-hardening-20261006/decision-log.md'`（机器读回）
通过：模板命中 `## 验收面` 且该节有「索引」声明；日志节内 AC-01…AC-20 共 20 行，每行六项非空。
失败：模板缺该节，或任一行缺字段，或编号不连续。
证据：读回命令原始输出，存 P5 `evidence_path`。

- [ ] **AC-AFH-002**：phase 模板契约头有 `覆盖 AC` 字段，且按新模板写的本任务材料通过 `validatePostPhaseContract`。关联 FR-AFH-002；来源 R-003；对应日志 AC-02。
验证：`bash -c 'grep -n "覆盖 AC" skills/spec-plan/templates/phase-template.md'`；`node "$AFH_TASK_DIR/quality/evidence/research/F-039-validate-post.mjs" "$REPO" specs/workflowhub-acceptance-flow-hardening-20261006`（机器）
通过：模板契约头命中 `覆盖 AC`；自检输出 `ok: true`，exit 0。
失败：字段缺失，或自检 exit 1。
证据：两条命令原始输出，存 P3 与 P8 `evidence_path`。

- [ ] **AC-AFH-003**：验收 Phase 的 gate_cmd 对每条 AC 输出恰好一个 8 值档位和一条独立证据指针。关联 FR-AFH-014、FR-AFH-002；来源 R-004；对应日志 AC-03。
验证：`node "$AFH_TASK_DIR/quality/tests/afh-acceptance.mjs"`（机器）
通过：输出 22 行，每行一个 AC 编号、一个 `runtime/evidence/acceptance-evidence-validator.mjs:6` 词表内档位、一条具名路径；全部 `pass` 时 exit 0。
失败：行数不等于 22，或出现词表外档位，或用计数代替逐条，或缺证据路径。
证据：driver 原始输出，存 P8 `evidence_path`。

- [ ] **AC-AFH-004**：验收 Phase 未完成（含失败修复复验闭环）时，build-code 阶段工作陈述不写 `succeeded`。关联 FR-AFH-003；来源 R-010；对应日志 AC-04。
验证：人读判据（澄清 Q7）：读 `skills/stage-handoff/SKILL.md` 规则原文；读 P8 走查记录；独立审查判定。机器重放不可得，因为需要新 gate，违反非目标。
通过：SKILL 原文写明 `succeeded` 的三条前置条件（user case 全部执行完、宿主侧结论已算出、证据指针已写），未满足只能写 `unverified` 或 `blocked`；P8 走查记录确认本任务交接遵守该规则；独立审查判 pass。
失败：规则缺任一前置条件，或本任务在 P8 未完成时写了 `succeeded`。
证据：SKILL 改后原文路径、`phases/P8.md` 走查小节、独立审查回执路径。

- [ ] **AC-AFH-005**：verify-code 审查面放开到验收产物；verify-code 回执含宿主侧 `conclusion` 与 `coverage`；空 findings 记 `no_findings_returned`。关联 FR-AFH-004；来源 R-007；对应日志 AC-05。
验证：`node "$AFH_TASK_DIR/quality/tests/afh-p1-oracle.mjs"`（机器；澄清 Q8：在 canonical/schema 层构造正例与负例回执，不调真实 provider）
通过：`stage-materials.json` 的 verify-code `forbidden` 不再含验收产物 key；正例回执通过 schema 与 canonical 校验；负例（缺 `conclusion`、缺 `coverage`、含 provider `verdict`、空 findings 记 `pass`）全部被拒；非 verify-code 旧回执仍通过；exit 0。
失败：任一断言 FAIL。
证据：oracle 原始输出，存 P1 `evidence_path`。

- [ ] **AC-AFH-006**：件一修实后 `\d\d:\d\d` 不再被脱敏；件二退役后零死引用。关联 FR-AFH-006、FR-AFH-007；来源 R-010；对应日志 AC-06。
验证：`node "$AFH_TASK_DIR/quality/tests/afh-p2-oracle.mjs"`（机器；内部调 `npx --no-install vitest run skills/wh-review/scripts/__tests__/material-redaction.test.mjs` 并做全仓引用扫描）
通过：material-redaction 测试 exit 0，且新增断言覆盖 `\d\d:\d\d` 保留与盘符路径仍脱敏；`ac-evidence-summary`、`ORACLE-FIX-002`、`AC-FIX-002` 在排除 `specs/archive/**`、`.planning/**`、`docs/archive/**` 与本任务 `specs/workflowhub-acceptance-flow-hardening-20261006/**`（历史记录与本任务对退役对象的描述，不改；澄清 Q20）之后零命中（含 `docs/architecture/move-map.json`、`skills/wh-review/skill-bundle.json`、`tests/acceptance/card-03-current.mjs` 与其 `.test.mjs`）；`tests/acceptance/card-03-current.mjs:583-584` 的通用展开仍在。
失败：脱敏仍吃掉正则字面量，或任一死引用命中，或通用展开被删。
证据：oracle 原始输出，存 P2 `evidence_path`。

- [ ] **AC-AFH-007**：decision-log `### OI-020 治理登记` 12 条每条六项齐全，且零引用扫描与 Runner 发布清单可读回。关联 FR-AFH-014；来源 R-004；对应日志 AC-07。
验证：机器扫描 + 人读：`node "$AFH_TASK_DIR/quality/tests/afh-acceptance.mjs"` 的 AC-AFH-007 行读回 12 行登记表与 task store `quality/evidence/log-archive-moved-sections.md` 的六项原文；独立审查逐条核对。
通过：12 条（① 至 ⑫）六项全部非空；零引用扫描输出与 Runner 发布清单路径存在；独立审查判 pass。
失败：任一登记缺项，或本任务新增契约条目无登记。
证据：driver 原始输出、独立审查回执路径。

- [ ] **AC-AFH-008**：verify-code SKILL 写明独立功能验收记录与代码审查回执分开成件，各有路径，记录逐条给结论与证据指针。关联 FR-AFH-008；来源 R-007；对应日志 AC-08。
验证：`node "$AFH_TASK_DIR/quality/tests/afh-p4-oracle.mjs"` 的 ADR-012 断言（机器读回 `workflows/verify-code/SKILL.md`）
通过：SKILL 原文含「功能验收记录独立成件」「不得由代码审查回执替代」「判定来源件是功能验收记录」三条，并引用 P1 定下的 `conclusion`、`coverage`。
失败：任一条缺失，或允许以代码审查回执充当功能验收记录。
证据：oracle 原始输出，存 P4 `evidence_path`。

- [ ] **AC-AFH-009**：detail 轨与 direction 轨 `semantic_fields` 与同轨 `required`/`optional` 逐 key 一致，direction 轨有校验，`approved_direction` 校验归属与 `draft_spec_or_acceptance` 来源写明。关联 FR-AFH-005；来源 R-007；对应日志 AC-09。
验证：`node "$AFH_TASK_DIR/quality/tests/afh-p1-oracle.mjs"` 的 key 集断言（机器）
通过：两轨各自 `semantic_fields` 等于同轨 `required ∪ optional`；direction 轨非法 key 被校验拒绝，且 direction 轨缺必填 key 的请求经公开入口 `buildReviewMaterials` 被拒（`MATERIAL_INCOMPLETE`，oracle 断言 `direction-validation-wired`）；`skills/wh-review/contracts/make-decision.md` 含 `draft_spec_or_acceptance` 来源与 `approved_direction` 归属说明；针对性测试 `tests/contract/review-materials-contract.test.mjs` exit 0。
失败：仍有 key 两者都不含，或 direction 轨无校验。
证据：oracle 原始输出，存 P1 `evidence_path`。

- [ ] **AC-AFH-010**：phase 模板要求验收结论带五类执行事实、`refs` 形态分类、重跑通过记 `flaky`/`inconclusive`、效果评测写对比基线与指标、无 UI 时写具名判据。关联 FR-AFH-002；来源 R-005；对应日志 AC-10。
验证：机器读回模板 `bash -c 'grep -n "执行事实\|flaky\|效果评测\|UI" skills/spec-plan/templates/phase-template.md'`；P8 自身执行事实按此写作，由 `afh-acceptance.mjs` 读回。
通过：模板验收小节列出五类执行事实、九类 `refs` 形态、`flaky` 规则、效果评测三要素、UI 判据要求；`phases/P8.md` 每条结论旁有五类执行事实。
失败：模板缺任一要素，或 P8 结论只有摘要、出现哈希或版本相等判定、用覆盖率或测试数量当通过判据。
证据：读回原始输出、`phases/P8.md` 路径。

- [ ] **AC-AFH-011**：phase 模板要求复验者与修复者上下文不同、同时列 F2P 与 P2P 且计数均大于 0、写明回归范围是保守超集。关联 FR-AFH-002；来源 R-011；对应日志 AC-11。
验证：机器读回模板复验小节；P8 若有修复则读回复验记录（同 AC-AFH-010 方法）。
通过：模板写明四项与 FULL/PARTIAL/NO 三档，PARTIAL 不得记 `pass`；P8 复验记录（若有）四项齐备。
失败：模板缺任一项，或复验由修复者本人判定，或分母为 0 判通过。
证据：读回原始输出、`phases/P8.md` 复验小节。

- [ ] **AC-AFH-012**：phase 模板要求 AC 或用例变更有独立审查批准、`Rationale for Change`、`Impact Assessment`。关联 FR-AFH-002；来源 R-011；对应日志 AC-12。
验证：机器读回模板变更批准小节；P8 变更记录读回。
通过：模板含三项与「批准者非实现者、非同一上下文」；P8 无变更时写「无加理由」，有变更时三项齐备。
失败：模板缺任一项，或出现静默改 AC。
证据：读回原始输出、`phases/P8.md` 变更小节。

- [ ] **AC-AFH-013**：stage-handoff 要求证据以具名路径对应、降级项有风险承接人署名、handoff 列出降级 user case；新记录不含退役绑定字段。关联 FR-AFH-003；来源 R-010；对应日志 AC-13。
验证：机器读回 `skills/stage-handoff/SKILL.md`；退役字段零命中扫描 `bash -c 'grep -rn "snapshot_tree\|source_digest\|material_revision\|freshness" specs/workflowhub-acceptance-flow-hardening-20261006 skills/stage-handoff/SKILL.md'`。
通过：SKILL 含三条声明性要求；扫描零命中（本文与 decision-log 中作为禁用说明的引用除外，需逐条人读确认）。
失败：缺承接人要求，或新记录出现退役字段、`rebind`、`reopen`、`replacement review`、哈希或版本相等判定。
证据：读回与扫描原始输出，存 P3 与 P8 `evidence_path`。

- [ ] **AC-AFH-014**：phase 模板的验收 Phase 固定小节含六项结论、入口准则逐条核对、数据就绪件与环境就绪件各一份且各写 status。关联 FR-AFH-002；来源 R-004；对应日志 AC-14。
验证：机器读回模板固定小节；P8 读回自身六项与两份就绪件路径。
通过：模板列出六项（评估含局限、偏差、未充分测试特性、未解决事件逐条、残留风险、签核对象）与两份就绪件；P8 六项逐项非空，两份就绪件在 task store `quality/evidence/` 下各自存在。
失败：缺任一项，或以夹具描述代替就绪件，或新增独立验收报告文件类型。
证据：读回原始输出、`phases/P8.md`、两份就绪件路径。

- [ ] **AC-AFH-015**：spec 模板 Appendix A 保留「唯一权威」与四行式；decision-log 模板 `## 验收面` 声明为索引；两处 AC 编号同号；`runtime/` 零新增校验器。关联 FR-AFH-001、FR-AFH-010；来源 R-001；对应日志 AC-15。
验证：`bash -c 'grep -rn "验收面" runtime tools tests config workflows; test $? -eq 1'`；读回 `skills/spec-specify/templates/spec-template.md` 与 decision-log 模板；比对本文 AC-AFH-001…020 与日志 AC-01…AC-20 编号（机器）。
通过：grep 零命中；spec 模板含「唯一权威」与 `验证：`/`通过：`/`失败：`/`证据：`；两处编号一一对应。
失败：`## 验收面` 被当作第二套判据权威，或新增 schema、校验器、测试，或 `runtime/stage/stage-content-contracts.mjs:664` 的正则被改成识别 `## 验收面`（删除死链不算违反，澄清 Q13）。
证据：命令原始输出，存 P5 `evidence_path`。

- [ ] **AC-AFH-016**：phase 模板写明防自证五条禁令，判定器要求显式通过元素。关联 FR-AFH-002；来源 R-010；对应日志 AC-16。
验证：机器读回模板防自证段；P8 driver 逐条输出（不是计数）。
通过：模板含五条禁令与「判定器不得用无失败即通过」；P8 输出 22 行逐条结论。
失败：缺任一禁令，或 P8 用计数代替逐条，或把 `incomplete`/`unavailable`/`missing`/`unverified` 写成 `pass`。
证据：读回原始输出、P8 driver 原始输出。

- [ ] **AC-AFH-017**：phase 模板要求失败先分诊，`Disposition` 落在自定词表，关闭留痕齐全，回写五项齐全。关联 FR-AFH-002；来源 R-006；对应日志 AC-17。
验证：机器读回模板分诊与关闭小节；P8 若有失败则读回分诊记录。
通过：模板含分诊最低字段集、7 值 Disposition 词表、关闭留痕五项、回写五项，并写明「修复回到原 owner Phase 的 Task」（澄清 Q11）；分诊者不等于实现者。
失败：缺任一项，或未分诊即修，或 Disposition 在词表外。
证据：读回原始输出、`phases/P8.md` 分诊小节。

- [ ] **AC-AFH-018**：card-06 46 项按 F-024 逐项处置，28 个既有文件改到位，零新建，5 个不拿回项不出现，硬禁令 17 条逐条满足。关联 FR-AFH-009；来源 U-018；对应日志 AC-18。
验证：`node "$AFH_TASK_DIR/quality/tests/afh-p4-oracle.mjs"`（机器：46 项逐项读回 + `git status --porcelain` 无新增仓库文件 + 5 项不拿回扫描）
通过：46 项各有处置且与 task store `quality/evidence/research/F-024-pullback-consolidated-ledger.md` §一 一致；`config/workflowhub.yaml` 无 `registry:`、`metrics_path:`；decision-log 模板无 `workflowhub-research-candidate-delivery.v1`；`skills/workflowhub-multica-sync/scripts/multica-skill-sync.mjs` 无 `closureCheck`；`npx --no-install vitest run tests/contract/build-prd-review-contract.test.mjs` exit 0。
失败：任一项无处置或与 F-024 不一致，或新增文件、gate、校验器、必填字段、schema，或写回哈希或版本相等判定。
证据：oracle 原始输出、`git diff --name-only` 原始输出，存 P4 `evidence_path`。

- [ ] **AC-AFH-019**：8 个生成文档的模板与技能有固定骨架与编号写作规则清单，清单含「这是写作指引，不是质量门」与允许的例外；F-026 §四 必保锚点逐条不变。关联 FR-AFH-010；来源 U-019；对应日志 AC-19。
验证：机器读回 8 个文件的 `读者：`、`读完要能：`、`## 补充材料`、写作指引声明；锁定测试 `npx --no-install vitest run tests/contract/post-build-plan-missing-index.test.mjs`。
通过：8 个文件各自命中骨架与声明；phase 模板被锁定文字逐字在（按文字判定，不按行号，澄清 Q9）；锁定测试 exit 0；`git status --porcelain` 无新增文件。
失败：新增任何校验器、评分器、字数门，或任一必保锚点改坏。
证据：读回与测试原始输出，存 P3 与 P5 `evidence_path`。

- [ ] **AC-AFH-020**：`workflows/make-decision/steps.json` 是 15 步，顺序与 decision-log ④ 清单一致，`step_id` 连续；SKILL 写明大纲是可修改假设、两次审查的 Kill/Recycle 权限、grill 对象、动态新增模块。关联 FR-AFH-012；来源 R-001；对应日志 AC-20。
验证：`node "$AFH_TASK_DIR/quality/tests/afh-p6-oracle.mjs"`（机器）
通过：15 个 step 名称顺序与 decision-log `:316-330` 一致，`step_id` 为 1…15；`skill-deps.yaml` 的 trigger 与新顺序一致；SKILL 命中 ADR-025…029 五条语义；无步数硬编码断言；thin-core-residue、material-set-per-stage、review-input-bounds-portability 三个测试 exit 0。
失败：顺序不一致、`step_id` 不连续、细节审查被拆成两级、新增 schema 或 gate。
证据：oracle 原始输出，存 P6 `evidence_path`。

- [ ] **AC-AFH-021**：decision-log 模板按 F-040 §6 落地：写集表八列与计数自校、冲突文件唯一 owner、退役反向引用扫描、精确路径、AC 判定方式列、锚点与改动同行、只列未决项；删除或降为指针的节已处理；`## 任务身份` 保留。关联 FR-AFH-011；来源 U-019；build-plan 新增。
验证：机器读回 `skills/decision-log/templates/decision-log-template.md`；`node --input-type=module -e` 调 `readTaskTypeFromDecisionLog` 读模板示例。
通过：七项新增要求逐条命中；`整体成败怎么算`、Supersedes、Talk 批次到落点、过程产物落点、独立退役登记节、治理登记长表已删除或降为一行指针；`## 任务身份` 恰一次；`## UI 判定` 节存在（`readUiApplicabilityFromDecisionLog` 读取，`runtime/stage/stage-content-contracts.mjs:173-174`）。
失败：任一新增项缺失，或 `## 任务身份` 被删，或 `## UI 判定` 节缺失。
证据：读回原始输出，存 P5 `evidence_path`。

- [ ] **AC-AFH-022**：OI YAML 解析死链删除后，`readTaskTypeFromDecisionLog` 与 `validatePostPhaseContract` 行为不变，死链导出不存在。关联 FR-AFH-013；来源 U-019；build-plan 新增。
验证：`node "$AFH_TASK_DIR/quality/tests/afh-p7-oracle.mjs"`（机器）
通过：F-039 脚本对 `specs/archive/workflowhub-thin-core-card-10-20260919` 仍 `ok: true`；本任务 decision-log 仍读出 `普通任务`；`analyzeDecisionOutline`、`analyzeDecisionConvergence`、`validateDecisionLogContract`、`DECISION_OUTLINE_FRAMEWORK_NODES`、`DECISION_OUTLINE_FIXED_CATEGORIES` 不再导出；`js-yaml` 不再被该文件 import；`package.json` 未改；post-build-plan-missing-index、thin-core-residue、runner-clean-install exit 0。
失败：任一断言 FAIL。
证据：oracle 原始输出，存 P7 `evidence_path`。

## 12. 风险、未决与交接

- **RISK-AFH-001**：验收 Phase 退化成计数（重演 CARD-03 P6）。缓解：AC-AFH-003、016 要求逐条；owner：P8 执行者与独立审查。
- **RISK-AFH-002**：P1 schema 字段新增不可逆。缓解：只在 verify-code 条件分支必填，与聚合面同改；owner：P1 实施者。
- **RISK-AFH-003**：P4 回收与 P3/P5/P6 的承接项散在不同 Phase，可能漏项。缓解：P4 oracle 按 F-024 46 项逐项读回，承接项由 owner Phase 卡标来源工作包；owner：P4 与 P8。
- **RISK-AFH-004**：P7 删死链误删保留函数的依赖。缓解：删前逐个确认 helper 无保留函数调用；P7 oracle 用 card-10 归档回归；owner：P7 实施者。
- **RISK-AFH-005**：并发 Phase 写作口径不一（Consumer 文字、oracle 名）导致材料自检失败。缓解：本文追踪表的 oracle 名与 `phases/index.md` 的 Consumer 文字是唯一口径；owner：主会话汇总。
- **OPEN-AFH-001**：`runtime/review/review-policy.mjs` 若实现中证明必须改，STOP 回主会话（澄清 Q4）。
- 已知限制：不回放 CARD-01/CARD-03；AC-AFH-004 无机器重放；文档精炼质量靠人读。这些限制不因针对性测试与独立审查通过而抵消。

## 13. 业务影响与回归范围

- 影响下游：所有新任务的 decision-log、spec、phase 写作；verify-code 回执消费方。
- 回归范围：`### 全局验证策略` 的针对性测试清单。HEAD 已红的 7 个文件不计入回归判据，改动后其状态只记事实。
