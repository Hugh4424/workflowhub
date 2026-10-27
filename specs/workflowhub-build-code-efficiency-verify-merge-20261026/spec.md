# 功能规格：复杂任务三阶段收敛与执行成本控制

读者：实施者、独立审查者、终末验收者与后续维护者。
读完要能：说清这次改了什么、为什么改、每个 Phase 交付哪个可观察结果、每条验收怎么判真假。

- **功能名**：复杂任务三阶段收敛与执行成本控制
- **来源**：当前任务 decision-log（canonical `decision-log.md`，sha256 `aa773bd3db9dd5d1c33737a2a6c0146359218729e02032383d2390343f8e646c`）的七个已收敛工作包 WP1–WP7、U-001…U-024 与 F1–F8 处置；上游原始需求 `quality/evidence/raw-requirements/2026-10-26-user-request.md`（sha256 `9cd8228a36263584669f5086fe14eeda840b9176c1c1560c17be00ccf26361ba`）。
- **状态**：build-plan 计划稿，未经用户确认；七包均未实现、未验证。

本类 P0 必留内容如下，声明与实际内容一致才算在场。

| 必留内容（P0） | 本文件落点 |
| --- | --- |
| 目标场景/需求 | 3. 用户场景与状态覆盖；5. 功能需求 |
| 全局实现设计与边界 | 实现设计（全局权威） |
| 唯一 Appendix A 的成功失败/证据 | Appendix A — 验收判据（唯一权威） |
| 真实验收表面与排除 | 验收流程；测试标准；验收对象 |
| 关键依赖/风险/来源 | 来源与决策映射；全局文件边界与依赖；12. 风险、未决与交接 |

## 速读卡（30 秒）

- **一句话需求**：让复杂任务不再因为验收不可达、审查扇出、空转等待、上下文重建和证据过载而拖成十几天，并把 verify-code 并进 build-code 的最后 Phase，少一个阶段、少一次交接。
- **核心改动点**：
  - 复杂任务只走 make-decision → build-plan → build-code 三阶段；verify-code 不再作为阶段存在，它的 16 项职责逐项搬进 build-code 最后 Phase。
  - 每个 Phase 按风险挑审查执行者、按七步派子代理、按一份清单留证据、按唯一游标续跑。
  - 同一失败或无新事实时自动换路径继续，只有三类情况停下来问人。
  - 当前任务驾驶舱自动生成、自动刷新、自动打开，不再是手拼。
- **最大影响面**：工作流方法（build-code、verify-code、stage-close）、阶段枚举与校验工具、证据与游标实现、驾驶舱渲染链路、相关测试。
- **验收信号**：每个 Phase 有可执行命令与正反判据；终末 Phase 逐条对账 30 条 AC；结果层三条便宜信号给真实数字。

## 来源与决策映射

本节只保存 ID 关系，不复制 decision-log 正文。

| 来源 ID | 决定 ID | FR / AC ID | 状态 / 受影响范围 | 未决 / 交接 |
| --- | --- | --- | --- | --- |
| `后建索引 R-006`、`U-016`、`后建索引 R-007`、`U-004`、`U-008`、`U-021` | `F5`、`F1` | `FR-MERGE-001…004 / AC-MERGE-001…004` | `current；阶段合并与承接` | `旧标签过渡机制见 OI-005` |
| `U-010`、`U-012`、`U-020`、`F2` | `WP1` | `FR-REVIEW-001…002 / AC-REVIEW-001…002` | `current；Phase 审查分级` | `外部 OCR 可用性未验证` |
| `U-018`、`U-019`、`F4` | `WP7` | `FR-PHASE-001…002 / AC-PHASE-001…002` | `current；子代理分工` | `并发上限未取得` |
| `U-003`、`U-009`、`U-013`、`F3`、`OI-003` | `WP2` | `FR-RECOVER-001…002 / AC-RECOVER-001…002` | `current；自动恢复` | `真实权限停点未演练` |
| `U-011`、`U-014`、`U-022`、`OI-009` | `WP3` | `FR-ACCEPT-001…002 / AC-ACCEPT-001…002` | `current；验收前移` | `逐条证据计划模板未产出` |
| `U-017`、`F7`、`F8`、`OI-010` | `WP6` | `FR-EVID-001…003 / AC-EVID-001…003` | `current；证据与游标` | `清单 schema 由本规格定` |
| `U-015`、`F6`、`WP4` | `WP4` | `FR-COCK-001…003 / AC-COCK-001…003` | `current；驾驶舱` | `页面现状未独立复核` |
| `U-016`、`F5`、`后建索引 R-007` | `WP5` | `FR-ROUTE-001…002 / AC-ROUTE-001…002` | `current；阶段路线与关闭改名` | `stage-closeout 改名未执行` |
| `U-006`、`F8`、`U-009` | `WP5`、`F8` | `FR-RESULT-001…002 / AC-RESULT-001…003` | `current；结果层信号与边界` | `基线数字未实测` |
| `U-023`、`U-024` | `WP5` | `FR-CLOSE-001 / AC-CLOSE-001` | `current；关闭交付的 PR 规范化` | `上游技能已按固定 commit 实读` |

## 1. 需求解释：问题与紧迫性

用户报告PaperBuilder的card-05与T02存在设计未发现问题、验收不可达及反复修复的痛点，称两个任务拖成十几天。研究转引的口径为Card-05约9.3天、27个Phase、118个写集、47份build-code审查；T02约63小时、13个Phase、单回合27.2小时。数字保留为待核线索，来源沿当前decision-log「两个任务到底慢在哪（事实）」、OI-008及其研究原ref；本次未核会话全集、计量分账与各统计口径，不能把累计值直接判为浪费。两任务verify-code的结论只到采样原件未见执行（PFACT-002），不推断完整历史绝无执行。

当前采用的设计线索是五类可能放大成本的机制：判据不可达、审查扇出、等待与轮询、上下文重建、证据量过大。它们解释了为什么要做本次有限改造，尚未证明各自净耗时或因果占比；当前decision-log已撤回“不是实现难”、所有等待/同源审查无效、累计token等于浪费等绝对判断。必要工作与浪费比例仍待OI-008核正，不承诺相同结构必定再次耗时十几天。

同时 verify-code 做的事已经不多，把它并进 build-code 最后 Phase 能少一个阶段、少一次交接。但合并不能顺手把终末质量、修复和关闭职责一起丢掉。

## 2. 背景、目标与范围

### 背景

WorkflowHub 现在有五个阶段：make-decision、build-plan、build-code、verify-code、build-prd。四个级别里，小改动和普通任务在 make-decision 内完成，复杂任务走多阶段。阶段枚举在工具与技能里多处出现，verify-code 是其中之一。

本次要动的对象包括：build-code 与 verify-code 的方法正文、stage-closeout 关闭技能、阶段枚举与一致性校验工具、证据与游标实现、驾驶舱渲染链路、以及覆盖这些的测试。decision-log 已确认方向与取舍，但没有确认任何实现。

### 目标

- 复杂任务少一个阶段：只走 make-decision → build-plan → build-code，最后 Phase 承接原 verify-code 的全部 16 项职责。
- 关掉五个可关的放大器：审查按风险分级、同一失败自动换路径、验收前移到每 Phase、每 Phase 一份证据清单、每 Phase 一份子代理分工。
- 驾驶舱从"手动生成器"变成"事件驱动的自动页面"。
- 所有改变都有可执行判据，不靠"设计写了"当实现。

### 范围内

- 七个工作包 WP1–WP7 的实现与验收。
- `stage-closeout` → `stage-close` 的完整改名，verify-code 阶段身份的移除。
- 支撑上述改变的工具、枚举、测试与文档同步。

非目标只在第 10 节维护，避免两份真相。

## 3. 用户场景与状态覆盖

### SCN-001：复杂任务跑到最后 Phase

- **角色**：任务主会话与它派出的开发/审查/测试子代理。
- **前提**：一个复杂任务走到 build-code 最后一个 Phase，实现已冻结。
- **触发**：主会话按最后 Phase 的固定顺序推进。
- **结果**：九段顺序逐段有原件：冻结实现 → spec-analyze → AC/证据对账表 → 终末独立审查 → 修 finding 并定向复验 → 测试充分性与验收对象 → UI/浏览器终验 → 最终 AC 对账和报告 → norm-sync/reflection/成本/页面。
- **回写**：改动落在哪个 Task，就回写该 Task 的 `Done` 与 Appendix A 同号 AC。

### SCN-002：Phase 内审查按风险选执行者

- **角色**：任务主会话。
- **前提**：某 Phase 的开发子代理已确认无待修项。
- **触发**：主会话按三维证据判断本 Phase 风险档。
- **结果**：低风险派独立子代理审查；涉及权限、数据迁移、共享状态、公开合同、真实外部依赖，或改动范围缺证据时改走外部 OCR；终末整卡再做一次完整外部审查。记录写清执行者与来源，子代理不得标成外部异源。

### SCN-003：同一失败反复出现

- **角色**：开发子代理与主会话。
- **前提**：同一测试或同一失败信号第二次出现，或一轮动作没有产出新事实。
- **触发**：子代理按自动恢复规则停下重复动作。
- **结果**：先查根因、先看验收或测试是否过度复杂、给更简单替代，然后换假设或方法或独立上下文继续；原失败原件保留。只有改 AC 或方向、用户独占的阻塞资源、必须由人承担严重风险这三类才回主会话。

### SCN-004：验收拿不到真实条件

- **角色**：Phase 实施者。
- **前提**：某条 AC 需要真实权限、凭证、外部服务或用户在场，而当前没有。
- **触发**：Phase 内实际尝试后仍无法取得。
- **结果**：记 `incomplete`，写清试过什么、卡在哪、谁提供什么、什么条件能补；继续其它安全工作；整个 build-code 结束时统一提醒；可以带缺口进 stage-close，但最终报告逐条列缺口，不宣称完成。

### SCN-005：当前任务页面自动更新

- **角色**：用户与主会话。
- **前提**：任务骨架确认、某包收敛、方向或范围或验收变化、某 Phase 收口、build-code 结束之一发生。
- **触发**：该事件发生。
- **结果**：驾驶舱按当前材料、task facts、真实 diff、测试与审查原件重新生成 15 类节点与主链十环，首次生成和实质变化时自动用系统默认浏览器打开；缺数据的节点标"缺"不编造；打不开就如实报"未自动打开"。

### 状态覆盖清单

- **默认态**：SCN-001；三阶段路线下复杂任务正常走到最后 Phase。
- **空态**：SCN-005；某类节点没有数据时标"缺"，页面仍然生成。
- **错误态**：SCN-002 三维证据缺一项；SCN-003 同一失败第二次出现；都在本节给落点。
- **加载态**：N/A — 本次改动是方法与命令，没有加载视图。
- **取消态**：SCN-003；提供者不可用时按原方法记 unavailable 并继续其它轴。
- **边界态**：SCN-004；验收不可达时记 incomplete 而不是伪造通过。
- **权限态**：SCN-002；涉及权限即升为外部 OCR，不由低风险子代理审。
- **竞态**：SCN-001；同一 Phase 内共享文件只允许一个写主，跨 Phase 同路径按依赖边定序。

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：decision-log 已确认七个工作包方向，且本次未实现任何一个。
  - **状态**：`verified`
  - **证据或来源**：`decision-log.md` 的「已收敛工作包（七个）」与「本次为止」；canonical sha256 `aa773bd3db9dd5d1c33737a2a6c0146359218729e02032383d2390343f8e646c` 为本轮修订实读当前字节；早期来源hash只作历史，不代表当前材料。
  - **关联**：FR-MERGE-001、AC-MERGE-001、SCN-001
- **PFACT-002**：Card-05 与 T02 的 verify-code 没有实际执行；独立核正把结论限定为"采样原件未见执行"。
  - **状态**：`verified`
  - **证据或来源**：`decision-log.md` 的「verify-code 合并（可行性摘要）」引 `quality/evidence/research/2026-10-26-001-bounded-factual-corrections.md`。
  - **关联**：FR-MERGE-001、AC-MERGE-001
- **PFACT-003**：阶段枚举在一致性校验工具里是硬编码列表，当前含 verify-code。
  - **状态**：`verified`
  - **证据或来源**：`tools/cli/check-skill-consistency.mjs` 顶部 `STAGES` 常量，build-plan 作者实读。
  - **关联**：FR-ROUTE-002、AC-ROUTE-002、FR-MERGE-004
- **PFACT-004**：合并本身未必能解释既有 build-code 耗时；是否提速必须由真实方案与验收回答。
  - **状态**：`inferred`
  - **证据或来源**：`decision-log.md` 的「verify-code 合并（可行性摘要）」明确"合并未必解释既有 build-code 耗时"；这是推断，依据是该段对研究结论的限定，未经实测。
  - **关联**：FR-RESULT-001、AC-RESULT-001
- **PFACT-005**：外部 OCR provider 当前是否可用未验证。
  - **状态**：`unknown`
  - **证据或来源**：decision-log 未给 OCR 可用性结论；`workflows/build-code/SKILL.md` 只写不可用时如何记录。
  - **负责人、影响**：P8 实施者先跑 `ocr --version` 并存检测输出；影响 AC-REVIEW-001 的不可用分支。
  - **关联**：FR-REVIEW-001、AC-REVIEW-001、RISK-02
- **PFACT-006**：驾驶舱现状（没被任何会话调用、没有 overview 页面、命令行不自动打开、pageData 靠手拼）来自研究子代理的审计，主 writer 未独立复核。
  - **状态**：`inferred`
  - **证据或来源**：`decision-log.md` 的 WP4「未做/未取得」与 F6；这是推断，依据是上游审计自述未复核。
  - **关联**：FR-COCK-001、AC-COCK-001、RISK-03、OPEN-02
- **PFACT-007**：本仓禁止无范围全量回归，针对性测试命令按文件或目录。
  - **状态**：`verified`
  - **证据或来源**：`AGENTS.md`「测试硬规则」；`package.json` 的 `test:contract`、`test:integration` 等具名 script。
  - **关联**：FR-RESULT-001、AC-RESULT-001

## 5. 功能需求

### 阶段路线与关闭（ROUTE）

- **FR-ROUTE-001**：关闭技能、目录与调用名统一为 `stage-close`；旧名只在历史原件里保留，当前材料与工具里不再有可执行引用，关联 PFACT-001、SCN-001、AC-ROUTE-001
  - **范围边界**：包括目录名、技能名、文档引用、测试断言与调用方；不改关闭流程本身的步骤，不改其它阶段名
  - **依据**：`U-016`、`F5`、`后建索引 R-007`
  - **场景**：SCN-001
  - **验收**：AC-ROUTE-001
- **FR-ROUTE-002**：复杂任务的阶段枚举只含 make-decision、build-plan、build-code；verify-code 不再是可调用阶段，旧任务的 verify-code 材料仍可只读读取，关联 PFACT-003、SCN-001、AC-ROUTE-002
  - **范围边界**：包括阶段枚举常量、技能目录、调用方、测试断言；小改动、普通任务与 build-prd 规划路线不变
  - **依据**：`U-016`、`U-002`、`F1`
  - **场景**：SCN-001
  - **验收**：AC-ROUTE-002
- **FR-ROUTE-003**：工作树里不再有 verify-code 的可调用入口：目录删除、当前引用清零，旧任务材料只读可读，关联 AC-ROUTE-003
  - **范围边界**：只删当前身份；历史记录与旧任务材料保留原样
  - **依据**：`U-016`、`v1主文 R-004`、`F1`
  - **场景**：SCN-001
  - **验收**：AC-ROUTE-003

### 合并与终末承接（MERGE）

- **FR-MERGE-001**：原 verify-code 的 16 项职责逐项在 build-code 最后 Phase 有承接位置、执行者、证据与验收，缺一项不算合并完成，关联 PFACT-001、PFACT-002、SCN-001、AC-MERGE-001
  - **范围边界**：只复杂路线的最后 Phase；小改动与普通任务不套用；不新增检查器
  - **依据**：`后建索引 R-006`、`U-016`、`F1`
  - **场景**：SCN-001
  - **验收**：AC-MERGE-001
- **FR-MERGE-002**：最后 Phase 按固定九段顺序执行，AC 首判仍在各承接 Phase，最后 Phase 只对账，关联 SCN-001、AC-MERGE-002
  - **范围边界**：顺序固定但不新增 stage、gate 或审查点；允许跳过时写明原因与影响面
  - **依据**：`U-016`、`F1`
  - **场景**：SCN-001
  - **验收**：AC-MERGE-002
- **FR-MERGE-003**：新增终末独立审查身份，审查整份交付 diff，可在原 verify-code 审查合同、提示词与判据上修改，关联 SCN-001、AC-MERGE-003
  - **范围边界**：只新增一个终末审查身份；每 Phase 的常规审查不变；不另立 provider 协议
  - **依据**：`U-016`、`F1`
  - **场景**：SCN-001
  - **验收**：AC-MERGE-003
- **FR-MERGE-004**：机制层消费者（阶段枚举、事实存储、审查策略与材料矩阵、schema、close 推导、final-chain、bundle、一致性检查、宿主配置）逐项处置，旧任务只读可读，不残留 4/5 并存枚举，关联 PFACT-003、AC-MERGE-004
  - **范围边界**：只改机制层；文档与工作流正文归 FR-MERGE-005；旧原件不改写
  - **依据**：`F1`、`OI-005`
  - **场景**：SCN-001
  - **验收**：AC-MERGE-004
- **FR-MERGE-005**：方法与文档层消费者（工作流正文、技能正文、治理文档、catalog、旧任务材料读取）逐项迁移到三阶段表述，关联 AC-MERGE-005
  - **范围边界**：只改当前生效材料；`docs/adr`、`docs/research`、归档材料作为历史保留原样
  - **依据**：`F1`、`U-016`
  - **场景**：SCN-001
  - **验收**：AC-MERGE-005
- **FR-STAGE-001**：阶段名单只有一处可执行来源，其余模块与工具从它读取，不再各自复制字面量，关联 PFACT-003、AC-STAGE-001
  - **范围边界**：只收拢阶段名单；不改各模块的阶段语义分支
  - **依据**：`F1` 消费者矩阵与 build-plan 只读核实（历史14模块/15处字面量；当前增加check-stage-steps一模块/一处后为15模块/16处；原AC的14模块保持并额外覆盖增量）
  - **场景**：SCN-001
  - **验收**：AC-STAGE-001

### Phase 审查分级（REVIEW）

- **FR-REVIEW-001**：复杂任务按风险挑 Phase 审查执行者：低风险用独立子代理，高风险或影响说不清改走外部 OCR，终末整卡外部全审；子代理不标成外部异源，关联 PFACT-005、SCN-002、AC-REVIEW-001
  - **范围边界**：只改复杂路线的 Phase 审查选择；小改动与普通任务审查方式不变；不设数字阈值
  - **依据**：`U-010`、`U-012`、`U-020`、`F2`
  - **场景**：SCN-002
  - **验收**：AC-REVIEW-001
- **FR-REVIEW-002**：低风险正向判据在场，三维证据定义可执行，`docs/standard-workflow.md` 现行"不得降审"规则按用户授权修订并记录这是用户选择，关联 SCN-002、AC-REVIEW-002
  - **范围边界**：只改这一条规则与其例外；不新增选择表、动态评分器或第二套审查点
  - **依据**：`U-020`、`F2`
  - **场景**：SCN-002
  - **验收**：AC-REVIEW-002

### Phase 子代理分工（PHASE）

- **FR-PHASE-001**：复杂任务每个 Phase 配 1 个开发、1 个审查、1 个测试子代理；开发是唯一 writer，审查与测试不改代码、测试或材料，关联 SCN-002、AC-PHASE-001
  - **范围边界**：只复杂任务的 build-code Phase；其它子代理按需；不改小改动与普通任务
  - **依据**：`U-018`、`F4`
  - **场景**：SCN-002
  - **验收**：AC-PHASE-001
- **FR-PHASE-002**：Phase 内按七步顺序执行，开发完成并通知后才启动审查与测试，普通 finding 回开发，每 Phase 审后提交一次，迟到 finding 重开同一 Phase，关联 SCN-002、SCN-003、AC-PHASE-002
  - **范围边界**：包括提交点与迟到 finding；push、merge、PR、归档与清理仍归 stage-close
  - **依据**：`U-019`、`F4`
  - **场景**：SCN-002、SCN-003
  - **验收**：AC-PHASE-002

### build-code 自动恢复（RECOVER）

- **FR-RECOVER-001**：同一失败反复或一轮没有新事实时，先停重复动作，自动深研、换假设或方法或独立上下文、修正 Phase 内任务并继续；原失败原件保留，关联 SCN-003、AC-RECOVER-001
  - **范围边界**：可自动改 Phase 内任务拆分、顺序、依赖、实现路线、测试路线与证据补齐；不自动改 AC、FR、oracle、写集、方向与验收对象
  - **依据**：`U-003`、`U-009`、`OI-003`
  - **场景**：SCN-003
  - **验收**：AC-RECOVER-001
- **FR-RECOVER-002**：只有改 AC 或方向、用户独占的阻塞资源、必须由人承担严重风险三类才停；其余缺资源记 `incomplete` 继续；不设次数或时长上限，关联 SCN-003、SCN-004、AC-RECOVER-002
  - **范围边界**：外部不可得零重试；用户在答即复位，时间本身不是复位条件
  - **依据**：`U-013`、`F3`、`OI-003`
  - **场景**：SCN-003、SCN-004
  - **验收**：AC-RECOVER-002

### 验收前移与成本化（ACCEPT）

- **FR-ACCEPT-001**：每条承接 AC 在 build-plan 就写清判什么、怎么判、证据从哪来、谁提供、何时能拿到、成本类别、拿不到怎么办，关联 SCN-004、AC-ACCEPT-001
  - **范围边界**：写进既有 spec 与 Phase 正文，不新增检查器或第二份验收计划
  - **依据**：`U-011`、`U-014`、`OI-009`
  - **场景**：SCN-004
  - **验收**：AC-ACCEPT-001
- **FR-ACCEPT-002**：`incomplete` 必须有真实尝试证据并写清恢复条件；build-code 结束时统一提醒；可以带缺口进 stage-close，但最终报告逐条列缺口、不宣称完成，关联 SCN-004、AC-ACCEPT-002
  - **范围边界**：只约束完成声明，不阻断同任务修复与后续安全工作
  - **依据**：`U-014`、`U-022`、`F5`
  - **场景**：SCN-004
  - **验收**：AC-ACCEPT-002

### 证据、游标与成本（EVID）

- **FR-EVID-001**：每个 Phase 产出一份执行清单，列命令、cwd、退出码、失败、真实 diff 与证据指针；原始输出只在失败、差异、外部返回体等处留原件，同字节复用，关联 SCN-004、AC-EVID-001
  - **范围边界**：不改历史证据，不建第二账本
  - **依据**：`U-017`、`F7`
  - **场景**：SCN-004
  - **验收**：AC-EVID-001
- **FR-EVID-002**：Phase 收口只更新唯一 `phase_progress` 游标，不存历史序列，不建第二进度权威，关联 AC-EVID-002
  - **范围边界**：游标只定位续跑位置，不证明完成，不阻止继续
  - **依据**：`U-017`、`F7`、`OI-010`
  - **场景**：SCN-001
  - **验收**：AC-EVID-002
- **FR-EVID-003**：Phase 卡列本 Phase 实际读到的材料与审查，独立审查核对没有多读整仓，关联 AC-EVID-003
  - **范围边界**：只列本 Phase 用到的锚点；不改索引职责
  - **依据**：`U-017`、`U-019`
  - **场景**：SCN-002
  - **验收**：AC-EVID-003
- **FR-COST-001**：成本在整个 stage 末记一次，同一计量窗口不重复；十环报告在最后 Phase 消费，关联 AC-COST-001
  - **范围边界**：复用既有 `measure-main-agent-cost` 入口；不每 Phase 触发
  - **依据**：`U-017`、`F7`、`F8`
  - **场景**：SCN-001
  - **验收**：AC-COST-001

### 驾驶舱（COCK）

- **FR-COCK-001**：页面按六类事件自动刷新，首次生成和实质变化自动用系统默认浏览器打开，打不开如实报"未自动打开"，关联 PFACT-006、SCN-005、AC-COCK-001
  - **范围边界**：事件驱动，不做常驻监控；不改用户浏览器设置
  - **依据**：`U-015`、`F6`
  - **场景**：SCN-005
  - **验收**：AC-COCK-001
- **FR-COCK-002**：数据从当前材料、task facts、真实 diff、测试与审查原件自动生成 15 类节点与主链十环，缺的标"缺"不编造，关联 SCN-005、AC-COCK-002
  - **范围边界**：只读派生；正文仍留在材料，页面只放短标题、结论与来源指针
  - **依据**：`U-015`、`F6`
  - **场景**：SCN-005
  - **验收**：AC-COCK-002
P5展示澄清（用户当前明确选择）：15kind是可追溯内容词汇，不是15类目录。左侧恰为原始需求req、工作包wp、Task三类及原进度入口；右侧消费真实业务对象和关系，沿最初模板的卡片布局。需求、包、Task各有标题/结果或短状态/关联卡；十环用紧凑状态卡；缺数据用短卡态与来源抽屉说明，不隐藏缺失，也不常驻堆教程、重复免责声明、整份JSON或长路径。详路径、指纹、原报告及完整正文折叠查阅。不能用metadata/前言/导航行冒业务标题，不能以15kind集合或侧车存在代替真实对象完整与页面消费。最初模板来自commit `0fafcb865040c5756cb7e746fbde15c115c02f2b`，唯一已认证原件 `quality/evidence/p5-originals/2026-10-27-009-original-cockpit-template-0fafcb86.html`，SHA256 `1ca1fcb5660ac818f2a39cefc749085b6fb8691d98fbac7bc1551c7d817f2cc0`；d5636412已含解释文字改动，不作最初模板来源。P5负责该完整修复，FR及30条AC原范围保留，事件、安全、只读与十环时点不变。

- **FR-COCK-003**：页面只读派生，不写任务状态、不做第二进度；环 1–9 在 build-code 最后 Phase 刷新，环 10 记 `skipped`，stage-close 完成后由调用方补终态，关联 SCN-005、AC-COCK-003
  - **范围边界**：环 10 不在 build-code 内做；不新增页面权威
  - **依据**：`F1`、`F6`
  - **场景**：SCN-005
  - **验收**：AC-COCK-003

### 关闭交付（CLOSE）

- **FR-CLOSE-001**：`stage-close` 的 PR 标题与正文按固定上游合同规范化：正文三段齐全，Door 与 Blast Radius 落在 Merge Danger 内，标题用仓内既有提交约定而不是空话，关联 AC-CLOSE-001
  - **范围边界**：只改 PR 标题与正文的内容合同；不改 Git 授权、PR 路由、合并与清理流程
  - **依据**：`U-024`、`F5`、固定 commit 的 `skills/engineering/pr/SKILL.md`
  - **场景**：SCN-001
  - **验收**：AC-CLOSE-001

### 结果层信号与边界（RESULT、BOUND）

- **FR-RESULT-001**：给出三条便宜的结果层信号：成本可复算、AC 可达性干跑、已知失败模式前后计数，关联 PFACT-004、PFACT-007、AC-RESULT-001、AC-RESULT-002、AC-RESULT-003
  - **范围边界**：不跑长任务、不重放 Card-05/T02 逐包
  - **依据**：`F8`、`U-006`
  - **场景**：SCN-001
  - **验收**：AC-RESULT-001、AC-RESULT-002、AC-RESULT-003
- **FR-BOUND-001**：不设固定时间、次数或数量上限；不用测试数量或报告数量当质量，关联 AC-BOUND-001
  - **范围边界**：止损原则保留，但不扩成固定预算
  - **依据**：`U-009`、`U-003`、`F2`
  - **场景**：SCN-003
  - **验收**：AC-BOUND-001
- **FR-BOUND-002**：成功标准是可验收的有限目标，不承诺零复发；不把 `incomplete` 写成完成，关联 AC-BOUND-002
  - **范围边界**：只约束声明，不降低原验收要求
  - **依据**：`U-006`、`U-022`
  - **场景**：SCN-004
  - **验收**：AC-BOUND-002

## 6. 模块划分

| 模块 | 职责 | 依赖 | 实施顺序 |
| --- | --- | --- | --- |
| Phase 执行 | 审查分级、三子代理分工与七步顺序、自动恢复 | 无 | 先：根因先行（U-007） |
| 验收与证据 | 逐条证据计划、incomplete 记录、每 Phase 一份清单、唯一游标、成本 | Phase 执行 | 次 |
| 驾驶舱 | 事件驱动生成、刷新、打开，只读派生 | 验收与证据 | 次 |
| 阶段路线与关闭 | 阶段名单收拢到单一来源；关闭技能改名为 stage-close | 驾驶舱 | 次：合并开始 |
| 合并与终末承接 | verify-code 职责搬进最后 Phase；终末审查身份；机制层与文档层迁移；删阶段身份 | 阶段路线与关闭 | 后 |
| 终末验收 | 逐 AC 对账与结果层三条信号 | 全部 | 最后 |

模块之间依赖单向，没有互相必需的两个模块。实施顺序按 U-007「先修根因、后做阶段合并」：前五个 Phase 修根因，中间六个 Phase 做合并，最后一个 Phase 对账。

## 7. 关键实体

- **阶段枚举**：两套身份分开。正式开发阶段写入枚举只接受 make-decision、build-plan、build-code 三值；全部工作流阶段名单含 build-prd 共四值，build-prd 不写 task stage row。verify-code 在两套里都不再出现。
- **终末职责表**：原 verify-code 的 16 项职责。字段：职责编号 RP-01…RP-16、原判据、并入位置、执行者、证据、验收。约束：16 行齐全，缺一项不算合并完成。
- **Phase 执行清单**：一个 Phase 的单一证据件。字段：命令、cwd、退出码、失败、真实 diff、证据指针。约束：一个 Phase 一份，不每个命令一份。
- **phase_progress 游标**：当前 Phase 的续跑定位。字段：阶段名与 Phase 编号。约束：只定位，不证明完成，不存历史序列。
- **驾驶舱页面**：当前任务的只读派生视图。字段：15 类节点、主链十环、来源指针。约束：缺数据标"缺"，不写任务状态。
- **证据条目**：一份原始事实。字段：路径、字节、命令与退出事实。约束：同字节即同一事实，复用原 ref。

## 8. 数据和生命周期

- **数据粒度**：一个 Phase 一份执行清单；一条 AC 一条结论；一个 task 一个游标。
- **数据时效**：清单与游标随 Phase 收口更新；证据原件写入后不改。
- **缺失或迟到**：缺数据标 `incomplete`、`unavailable` 或 `unknown` 并写恢复条件；不补默认值。
- **预览与正式**：驾驶舱是派生物，不是权威；材料与 task facts 才是权威。
- **当前与历史**：旧任务、旧审查行、旧标签只读保留，不改写、不迁移语义。
- **归属与清理**：证据归任务库当前 task；历史原件不删不覆写。

## 9. 兼容性预留

- **既有消费方**：七类公共命令不变；小改动、普通任务与 build-prd 规划路线不变；旧任务的 verify-code 材料仍可只读读取。
- **命名预留**：`stage-close` 是唯一新名；旧名 `stage-closeout` 只在历史原件出现。
- **容器预留**：N/A — 不新增持久化容器，复用现有 task 目录与 facts。
- **状态预留**：不新增状态枚举；沿用现有七值阶段值与八值验收词表。
- **扩展边界**：本期只做到七包与合并；不承诺零复发、不承诺耗时降到某个数字。

## 10. 明确不做与默认必须成立

### 明确不做

- 不设固定时间、次数或数量上限（`U-009`）。
- 不按文件所有权切 Phase（`ADR-0038`）。
- 不按七个工作包分模块开工：用户已撤回"按五块切实施"，七包只在计划里作为方向与验收信号（`U-005`）。
- 不用 Card-05/T02 逐包回放当验收（成本不可行）。
- 不删必要的质量工作换速度；不取消独立审查。
- 不把 `incomplete`、`unavailable`、`unknown` 写成完成。
- 不新建第五个阶段、第二套进度权威或第二个审查点。

### 默认必须成立

- 四级保持：小改动与普通任务仍在 make-decision 内完成；只有复杂任务走三阶段。
- 复杂任务每个 Phase 仍有且只有一次独立审查。
- 证据原件保留；失败不因重跑变绿而消失。
- 实施者不自审自判质量；子代理不得冒充外部异源。
- 关联 FR-ROUTE-002、FR-REVIEW-001、FR-BOUND-002。

## 验收流程

从 decision-log 的「验收面」交接索引取可观察接口与成功失败边界，再按场景入口定位 FR、Appendix A 的同号 AC、所属 Phase 的 `gate_cmd` 与可回读证据。本节只描述流程，不复制判据。

## 测试标准

开工前四要素清单：本规格每条 FR 与承接 AC 在所属 Phase 卡里写明验证层、命令、预期结果与失败条件。下表按项目自行声明的测试面给适用与排除。

| 测试面 | 适用性 | oracle 与证据类型 | 覆盖 AC | 归属 Phase |
| --- | --- | --- | --- | --- |
| 材料合同（技能/方法正文结构） | 适用 | 具名 vitest 文件断言正文结构与编号；退出码与原始输出 | AC-ROUTE-002、AC-ROUTE-003、AC-STAGE-001、AC-MERGE-001…005、AC-REVIEW-001…002、AC-PHASE-001…002、AC-RECOVER-001…002、AC-ACCEPT-001…002、AC-EVID-001…003 | P1–P4、P7–P11 |
| 工具与枚举一致性 | 适用 | `node tools/cli/check-skill-consistency.mjs --root` 与具名 vitest；退出码与 failures/reports | AC-ROUTE-001…003、AC-STAGE-001、AC-MERGE-004 | P6、P7、P9、P11 |
| 证据与游标行为 | 适用 | 受控 Phase 夹具：多命令一份清单、失败原件保留、游标推进 | AC-EVID-001…003、AC-COST-001 | P4 |
| 驾驶舱端到端 | 适用 | 用当前任务真实材料生成页面、真实浏览器打开并对照模板；截图与 DOM 摘录 | AC-COCK-001…003 | P5 |
| 浏览器视觉对照 | 适用（有具名理由的窄范围） | 只用系统默认浏览器实际打开本任务生成的页面；不做跨浏览器矩阵，理由是本仓无跨浏览器承诺 | AC-COCK-001…003 | P5 |
| 关闭交付 PR 正文（材料合同） | 适用 | 具名 vitest 断言三段与字段位置；真实 PR 样例与缺段负例 | AC-CLOSE-001 | P10 |
| 真实外部 OCR | 条件适用 | provider 真实终态与原始 findings；不可用时记 unavailable | AC-REVIEW-001、AC-MERGE-003 | P1、P12 |

每个要测的面与覆盖 AC 指向所属 Phase 的一条可执行命令；精确命令归各 Phase 卡。

### 验收对象

本节填写本任务实际验收对象与来源；缺项保 null 并写提供者与影响。

- **来源判定**：`raw_requirement` 要求"页面自动生成、刷新、打开"（`quality/evidence/raw-requirements/2026-10-26-user-request.md` 与 decision-log WP4），故 `ui_scope` 为 true；`project_inventory` 见 `skills/answer-as-page/` 与 `tools/cli/`；`planned_or_changed_frontend_fact` 见本规格 FR-COCK-001…003。三源并非全部为 false，因此按 Web 五项核对。
- **执行条件与缺口**：计划验收对象是 P5/T006/T007 生成和刷新的本地 HTML；当前页面与真实运行尚未产生，`service`、`route` 保 null，由 P5 独立测试子代理在生成后沿隔离浏览器 QA 的真实文件 URL 或临时服务入口绑定并保存回执。viewport 已按 P5/P12 规划为桌面 1440×900、窄窗 390×844，规定尺寸不代表已观察。P12 终末验收者只消费这些原件并补必要未闭环 case，执行回执取得前不写浏览器验收通过。

```json
{
  "workspace": "/Users/Hugh/Hugh/Project/workflowhub-workflowhub-build-code-efficiency-verify-merge-20261026",
  "service": null,
  "route": null,
  "state": "build-plan 阶段材料完成；实现与页面未产生",
  "viewport": {
    "desktop": {"width": 1440, "height": 900},
    "narrow": {"width": 390, "height": 844}
  },
  "owner": "P5/T006/T007 独立测试子代理；P12 终末验收者消费原件并补必要未闭环 case"
}
```

## 架构边界

产品边界：阶段数量、每阶段职责、什么算完成、什么必须停下来问人。
工程边界：这些规则落在哪些技能正文、哪个枚举常量、哪些工具与测试。
全局架构方案在「实现设计（全局权威）」维护，各 Phase 只承接自身差异。

## 实现设计（全局权威）

本节记录全局方案。逐 Phase 差异留在各 `phases/P<n>-*.md`。

### 代码锚点

按读序排列。这些都是 build-plan 作者实读过的当前字节，行号只作导航，漂移不判卡失效。

- 阶段名单分散处：`runtime/stage/stage-context.mjs` 的 `bootstrapStage` 白名单；`runtime/task/task-store.mjs` 的 `STAGES` 与 stage row 校验；`runtime/review/review-policy.mjs` 的 `FORMAL_STAGES` 与 `assertReviewIdentity`；`tools/cli/stage-runtime.mjs` 的 `--stage` 校验与 close-plan 确认白名单；`tools/cli/check-skill-consistency.mjs` 顶部 `STAGES`；`tools/cli/check-stage-steps.mjs` 顶部的 5 值阶段名册（main 合并后新增）。
- 终末质量结论：`runtime/review/canonical-review-result.mjs` 的 `deriveVerifyCodeConclusion`；`runtime/review/schemas/result.schema.json` 里按 `stage === "verify-code"` 触发的 conclusion/coverage 条件；`runtime/review/stage-materials.json` 的审查材料矩阵。
- 审查路由：`runtime/review/ocr-delegation-adapter.mjs` 的 `requiredMode = stage === "build-code" ? "full_only" : "single_round"`；`skills/wh-review/scripts/review-materials.mjs` 的 `selectVerifyCodeDiffPaths` 与两份合同打包逻辑；`skills/wh-review/contracts/`。
- 关闭推导：`core/task-close.mjs` 的阶段优先级与 close 阶段推导；`tools/cli/stage-runtime.mjs` 的 close-plan 确认白名单。
- 十环与成本：`runtime/task/final-chain.mjs` 的 `RINGS` 与 `LEVELS`；`runtime/task/final-chain-runner.mjs` 的取数组装；`tools/cli/run-checks.mjs` 的 `--task-path`；`tools/cli/measure-main-agent-cost.mjs` 的 `--record`。
- 任务事实与证据：`runtime/task/task-store.mjs` 的 `writeStageRow` 与 `phase_progress` 校验；`runtime/task/task-handle.mjs` 的 `appendRecord`/`captureCommand`；`runtime/interface/safe-write.mjs` 的 `createRecord`；`runtime/interface/run-command.mjs`。
- 驾驶舱：`skills/answer-as-page/scripts/render-answer-page.mjs` 的 `renderAnswerPage`（`pageData` 只校验不派生、`open` 只注入）；`skills/answer-as-page/templates/overview-template.html` 的 `DATA.kinds` 15 类与 `ANCHOR` 十环映射；`skills/answer-as-page/skill-bundle.json`。
- 关闭技能：`skills/stage-closeout/SKILL.md` 与 `skills/stage-closeout/skill-bundle.json`；引用它的 3 份 `skill-deps.yaml`、`skills/catalog.yaml`、`docs/delivery-closeout-charter.md`。
- 受保护字面：`docs/delivery-closeout-charter.md` 被 `tests/contract/delivery-closeout-charter-contract.test.mjs` 精确锁行；`tests/contract/stage-closeout-step-contract.test.mjs` 与 `tests/contract/delivery-note-contract.test.mjs` 文件头标 Frozen。

### 接口与失败语义

**选择的架构方案**

1. 先收拢再删。阶段名单现在有 15 个模块 16 处字面量副本、5 个 schema 枚举、1 份审查矩阵（main 合并后新增 `tools/cli/check-stage-steps.mjs` 这一处 5 值名册）。直接在各处删 `verify-code` 会让这些定义点各改各的，且下一个阶段变更会重复同样的痛。因此先建一个窄模块 `runtime/stage/stage-registry.mjs` 导出阶段集合与两类身份（正式开发阶段、含 build-prd 的全部工作流阶段），其余模块改为从它读取。
2. 先并存再收缩（expand–contract）。新增终末审查身份时保留旧 verify-code 路径可用；等机制层、材料层、测试层都迁完，最后一步才删除阶段身份与目录。
3. 三条硬冲突按「身份」而不是「阶段名」判定：
   - 审查路由：`ocr-delegation-adapter.mjs` 现在按阶段名决定 `full_only` 与 `single_round`。改为按审查身份决定：build-code 每 Phase 审查用 `full_only`，终末审查身份用 `single_round`。阶段名只作记录。
   - 终末结论：`result.schema.json` 现在按 `stage === "verify-code"` 要求 conclusion/coverage。改为按终末审查身份要求；`deriveVerifyCodeConclusion` 更名为终末结论 producer，语义不变。
   - 关闭推导：`core/task-close.mjs` 的阶段优先级从 verify-code 改为 build-code 终末；`stage-runtime.mjs` 的 close-plan 确认白名单加入 build-code。
4. 历史只读：旧任务的 `verify-code` stage row、旧审查、旧材料仍可读取。读取路径不因新枚举而拒绝旧值——新枚举约束写入，旧值在读取时按历史接受。

**模块职责与数据流**

终末主合同复用 `skills/wh-review/contracts/build-code.md`，按review_scope区分phase/terminal；P8保全旧终末全部条款，P11同步迁走双加载/manifest/bundle后退旧verify合同，真实consumer与负例见两卡。

阶段名单只从 `stage-registry.mjs` 出 → 各模块与 CLI 读取 → 写入时校验、读取时放宽。终末审查身份由 `review-policy.mjs` 校验，`stage-materials.json` 提供材料矩阵，`wh-review` 打包，`ocr-delegation-adapter.mjs` 选路由。证据与游标仍由 `task-store.mjs` 与 `task-handle.mjs` 承担，不新增第二写路径。驾驶舱从 `render-answer-page.mjs` 出发，新增一个只读派生器把当前材料、task facts、真实 diff、测试与审查原件转成 15 类节点，再由渲染器写 HTML 与侧车。

**驾驶舱对象与关系消费（P5已有写集内修复）**

数据producer沿当前具名材料/索引读取真实需求身份及原话；本任务主需求卡集合明确采用后建索引R-001至R-013共13项，逐项保命名空间及raw:5/7/9来源，索引只导航且其历史状态不是当前事实。v1主文R-001至R-006仅为来源对照及明确映射的别名，不重复增加6卡、不按同号猜合并；同原件段支持多条已声明需求，不按行号自行去重或拆新卡，摘要不冒逐字原话。逐工作包标题段提取目标/边界/做法；当前任务WP1–WP7必须逐一存在。Task仅取索引中真实Phase文件的严格 `### Tnnn — 标题`，当前应T001–T015，不吸补充说明/测试变更请求；FR、AC只取唯一正文定义和Appendix A，不取导航或映射行当对象内容。对象ID、标题、短结论、归属和src逐项可回指真实段落，缺字段标缺，不用kind首匹配凑一条。

req→WP→Task仅按材料显式命名空间ID/ref及WP→AC→Task声明的可回指join建立有向追溯；goal/dec/ires/eres等依据关系只在明确采用时接sideEdges。Phase→Task沿已知包含关系；文件改动/测试原件可作明确归属Task的上下文，不能凭同Task推逐文件覆盖。未知归属保持短态或任务级卡，不按位置、标题词猜或全连接。复用现pageData、renderer组件与材料合同reader，不增加永久索引、第二进度或新runtime控制面；只用15类词汇与原十环。

三类详情的有源消费：req呈真实需求摘要/原话入口、明确工作包卡与采用依据；wp呈目标/边界/方案、相关规格/AC/Phase/Task及风险卡；task呈任务结果/步骤、所属Phase、声明文件与实际改动分开、测试/审查/验收卡。其它kind在这些详情内按真实关系消费；未归属对象以明确任务级/归属未取得卡展示，不冒当前req/wp/task的依赖。所有细节保来源抽屉，不以造边解决可达性。已确认三类目录优先于此前15类侧栏误判。

**接口与失败语义**

- 写阶段事实时，未知阶段仍是硬错误（保留现有抛错）。
- 读历史阶段值时，旧值接受并在来源里标为历史，不伪造为新阶段。
- 终末审查身份缺失时，终末结论不能生成；记 `unavailable` 而不是回退到 build-code 每 Phase 审查。
- OCR 不可用时，按现有口径记 `unavailable` 并保留检测输出，不换执行者。
- 驾驶舱生成失败时，页面不生成、报真实错误；打开失败输出「未自动打开」并给原因。
- 证据写入失败保留原始错误与目标路径，不声称已保存。

**新增控制面**

只有一个：`runtime/stage/stage-registry.mjs`。责任是阶段名单的唯一可执行来源；owner 是阶段运行时；实际模块读取方16个：当前15个副本模块（历史14个＋check-stage-steps）及final-chain；5份schema及矩阵只做配套迁移，不冒模块import消费；替代关系是取代当前15模块/16处字面量副本的执行来源；5份schema与矩阵仍按各自合同配套，不混算副本数；删除条件是阶段集合再次只有一个干净定义点且无读者需要它。不新增公共命令、不新增持久对象、不新增第二进度。

驾驶舱新增的派生器是窄扩展，不是控制面：它只读，不写任务状态，输出只到调用方指定目录。

### 全局文件边界与依赖

**新增（精确路径）**

- `docs/adr/0055-complex-task-three-stage-merge.md`
- `runtime/stage/stage-registry.mjs`
- `skills/answer-as-page/scripts/build-page-data.mjs`
- `skills/answer-as-page/scripts/open-page.mjs`
- `skills/stage-close/SKILL.md`
- `skills/stage-close/skill-bundle.json`
- `tests/acceptance/final-account.test.mjs`
- `tests/contract/acceptance-plan.test.mjs`
- `tests/contract/auto-recovery.test.mjs`
- `tests/contract/cockpit-autogen.test.mjs`
- `tests/contract/cockpit-event.test.mjs`
- `tests/contract/evidence-manifest.test.mjs`
- `tests/contract/phase-team.test.mjs`
- `tests/contract/review-tier.test.mjs`
- `tests/contract/stage-close-pr-contract.test.mjs`
- `tests/contract/stage-close-rename.test.mjs`
- `tests/contract/stage-id-removal.test.mjs`
- `tests/contract/stage-materials.test.mjs`
- `tests/contract/stage-mechanism.test.mjs`
- `tests/contract/stage-registry.test.mjs`
- `tests/contract/terminal-chain.test.mjs`

- `tests/contract/status-derivation.test.mjs`（既有CLI/status行为测试，P10首次终末原件consumer）

**修改或删除（精确路径；逐 Phase 决定具体动作）**

- `AGENTS.md`
- `CLAUDE.md`
- `CONSTITUTION.md`
- `GLOSSARY.md`
- `README.md`
- `constitution-checklist.md`
- `contracts/facts-subschema.json`
- `core/task-close.mjs`
- `docs/architecture/move-map.json`
- `docs/architecture/real-entry-inventory.md`
- `docs/architecture/test-asset-governance-rules.md`
- `docs/contracts/card-01-stage-material-interface.md`
- `docs/delivery-closeout-charter.md`
- `docs/standard-workflow.md`
- `runtime/distribution/skill-bundle-release.mjs`
- `runtime/evidence/workflow-evolution.mjs`
- `runtime/review/canonical-review-result.mjs`
- `runtime/review/ocr-delegation-adapter.mjs`
- `runtime/review/review-packet-identity.mjs`
- `runtime/review/review-policy.mjs`
- `runtime/review/review-record-route.mjs`
- `runtime/review/schemas/attempt.schema.json`
- `runtime/review/schemas/result.schema.json`
- `runtime/review/schemas/stage-materials.schema.json`
- `runtime/review/stage-materials.json`
- `runtime/review/stage-review-disposition.mjs`
- `runtime/schemas/human-confirmation.v1.schema.json`
- `runtime/schemas/risk-acceptance.v1.json`
- `runtime/stage/stage-context.mjs`
- `runtime/task/final-chain-runner.mjs`
- `runtime/task/final-chain.mjs`
- `runtime/task/task-store.mjs`
- `skills/answer-as-page/SKILL.md`
- `skills/answer-as-page/scripts/render-answer-page.mjs`
- `skills/answer-as-page/skill-bundle.json`
- `skills/answer-as-page/templates/overview-template.html`
- `skills/architect-code-review/SKILL.md`
- `skills/catalog.yaml`
- `skills/decision-log/SKILL.md`
- `skills/decision-log/templates/decision-log-template.md`
- `skills/design-source-extraction/SKILL.md`
- `skills/diagnosing-bugs/SKILL.md`
- `skills/norm-sync/SKILL.md`
- `skills/project-norm-init/SKILL.md`
- `skills/reuse-registry.md`
- `skills/review/SKILL.md`
- `skills/spec-analyze/SKILL.md`
- `skills/spec-plan/templates/phase-template.md`
- `skills/spec-specify/SKILL.md`
- `skills/spec-specify/templates/spec-template.md`
- `skills/stage-closeout/SKILL.md`
- `skills/stage-closeout/skill-bundle.json`
- `skills/stage-handoff/SKILL.md`
- `skills/stage-reflection/SKILL.md`
- `skills/wh-review/SKILL.md`
- `skills/wh-review/contracts/build-code.md`
- `skills/wh-review/contracts/provider-protocol.md`
- `skills/wh-review/contracts/verify-code.md`
- `skills/wh-review/manifest.json`
- `skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`
- `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`
- `skills/wh-review/scripts/review-materials.mjs`
- `skills/wh-review/scripts/third-review-host-config.mjs`
- `skills/wh-review/skill-bundle.json`
- `skills/wh-review/stage-skill-plan.json`
- `skills/workflowhub-host-protocol/SKILL.md`
- `specs/Improvements.md`
- `specs/acceptance/README.md`
- `specs/acceptance/acceptance.md`
- `tests/acceptance/card-03-current.mjs`
- `tests/acceptance/card-03-current.test.mjs`
- `tests/close/cleanup-resume-finalize.test.mjs`
- `tests/close/close-authorization-outcome-ref-guard.test.mjs`
- `tests/close/close-contract.test.mjs`
- `tests/contract/acceptance-matrix-references.test.mjs`
- `tests/contract/acceptance-object-cli.test.mjs`
- `tests/contract/acceptance-object-required-fields.test.mjs`
- `tests/contract/answer-as-page-skill.test.mjs`
- `tests/contract/card05-close-cli-mechanism.test.mjs`
- `tests/contract/close-remote-branch-cleanup.test.mjs`
- `tests/contract/close-sidecar-and-archive.test.mjs`
- `tests/contract/delivery-closeout-charter-contract.test.mjs`
- `tests/contract/delivery-note-contract.test.mjs`
- `tests/contract/design-source-extraction-wiring.test.mjs`
- `tests/contract/final-chain-declarations.test.mjs`
- `tests/contract/final-chain-negatives.test.mjs`
- `tests/contract/final-chain-runner.test.mjs`
- `tests/contract/knowledge-graph-stage-wiring.test.mjs`
- `tests/contract/knowledge-reuse-norm-wiring.test.mjs`
- `tests/contract/light-close-confirm.test.mjs`
- `tests/contract/light-route-controlled-fixture.test.mjs`
- `tests/contract/make-decision-flows.test.mjs`
- `tests/contract/measure-main-agent-cost.node-test.mjs`
- `tests/contract/n10-process-repair.test.mjs`
- `tests/contract/n10-source-disposition.test.mjs`
- `tests/contract/n10-source-registry.test.mjs`
- `tests/contract/n11-acceptance-rules.test.mjs`
- `tests/contract/n11-capability-gaps.test.mjs`
- `tests/contract/narrow-tool-human-confirm.test.mjs`
- `tests/contract/ocr-delegation-adapter.test.mjs`
- `tests/contract/ocr-delegation-route.test.mjs`
- `tests/contract/ocr-production-cutover.test.mjs`
- `tests/contract/runtime-facade.test.mjs`
- `tests/contract/stage-closeout-skill.test.mjs`
- `tests/contract/stage-closeout-step-contract.test.mjs`
- `tests/contract/verify-architect-acceptance.test.mjs`
- `tests/contract/verify-code-dsh-public-run.test.mjs`
- `tests/contract/verify-code-page-refresh.test.mjs`
- `tests/contract/workspace-binding.test.mjs`
- `tests/fixtures/light-route-controlled/README.md`
- `tests/fixtures/light-route-controlled/tasks.json`
- `tests/host-independence.test.mjs`
- `tests/integration/main-agent-cost-closeout.node-test.mjs`
- `tests/integration/minimal-task-storage.test.mjs`
- `tests/integration/runner-clean-install.test.mjs`
- `tests/integration/vnext-delivery-close.test.mjs`
- `tests/metrics-smoke.test.mjs`
- `tests/verify-code-design-alignment.test.mjs`
- `tools/cli/check-skill-consistency.mjs`
- `tools/cli/check-stage-steps.mjs`
- `tools/cli/measure-main-agent-cost.mjs`
- `tools/cli/n11-pairwise-judge.mjs`
- `tools/cli/smoke-local-skill-dispatch.mjs`
- `tools/cli/stage-runtime.mjs`
- `workflows/build-code/SKILL.md`
- `workflows/build-code/skill-deps.yaml`
- `workflows/build-plan/SKILL.md`
- `workflows/build-prd/SKILL.md`
- `workflows/build-prd/skill-deps.yaml`
- `workflows/make-decision/SKILL.md`
- `workflows/make-decision/flows/normal/SKILL.md`
- `workflows/make-decision/flows/normal/steps.json`
- `workflows/make-decision/flows/planning/SKILL.md`
- `workflows/make-decision/flows/small/SKILL.md`
- `workflows/make-decision/flows/small/steps.json`
- `workflows/make-decision/skill-deps.yaml`
- `workflows/verify-code/SKILL.md`
- `workflows/verify-code/capture.mjs`
- `workflows/verify-code/metrics-writer.mjs`
- `workflows/verify-code/skill-deps.yaml`
- `workflows/verify-code/steps.json`

**禁止改动**

- `docs/adr/0001` 至 `docs/adr/0053`、`docs/research/`、`docs/archive/`、`specs/archive/`、`specs/workflowhub-ui-frontend-release-20261020/`：历史与归档原件，只读。
- `tests/acceptance/n10-finite-check-acceptance.test.mjs`、`tests/acceptance/n11-eval-run-check.test.mjs`、`tests/e2e/design-source-extraction-acceptance.test.mjs`、`tests/contract/ocr-ac006-wallclock.test.mjs`：历史证据或长墙钟测试，不改不跑。
- `node_modules/`、`graphify-out/`、`.omc/`、`.planning/`：不是运行时来源。
- `runtime/interface/runtime-facade.mjs`：公共面七类不变，本次不动。
- 标 Frozen 的测试文件只在该 Phase 卡点名并通过测试变更请求后修改，不许顺手改。

**全局依赖**

`P1 → P2 → P3 → P4 → P5 → P6 → P7 → P8 → P9 → P10 → P11 → P12` 串行。理由有三：`docs/architecture/move-map.json` 与 `workflows/build-code/SKILL.md` 被多个 Phase 改到，需真实依赖边定序；阶段身份必须在终末承接落地后才能收缩；终末验收必须在全部 Phase 之后。相邻边界的先后写者与依据写在各 Phase 的「工作包声明」。

**文件归属与回滚**

同一 Phase 内每个写入路径只有一个写主。回滚按 Phase 回退到上一个审后提交点，不整树回退、不改历史原件。

### 原十一类消费者与迁移落点

按 decision-log F1 原十一类逐行保留分母，不以重新分组冒覆盖。

| 原消费者类 | 首写/后写与结果 | 验证 |
| --- | --- | --- |
| review-policy | P6 单源、P8 terminal、P9 收缩 | stage-registry / terminal-chain / stage-mechanism |
| stage-materials | P8 身份及schema同改、P9 去阶段、P11 改合同ref | terminal-chain / stage-mechanism / stage-id-removal |
| final-chain | P6 单源、P9 终末身份 | stage-registry / stage-mechanism |
| task-store | P4 游标、P6 单源、P9 写当前读历史 | evidence-manifest / stage-registry / stage-mechanism |
| catalog/contracts | P7 改关闭名、P8 承接、P10 当前描述、P11 去旧登记 | close-rename / terminal-chain / stage-materials / stage-id-removal |
| bundle/release | P6 单源、P7 改名、P9 阶段消费、P11 删入口登记 | stage-registry / close-rename / stage-mechanism / stage-id-removal |
| check-skill-consistency | P6/P9 单源接入、P10 正文、P11/P12 整仓核对 | 原命令实际退出与逐项诊断 |
| tests | P7–P11 各自具名测试/TCR、P12 聚合 | 各卡gate及冻结清单 |
| CI/发布 | P6 分发/宿主名单读取、P9 发布入口枚举；只核仓内当前消费者，不执行发布 | stage-registry / stage-mechanism；未实际CI/发布保持未验证 |
| 其他项目 | P9 两份对外schema、P10 对外说明；外仓不写 | stage-mechanism / stage-materials；外仓执行未知，缺口不冒覆盖 |
| close 调用方 | P7 改名、P9 推导、P10 最终报告reader/PR合同、P11 删旧入口 | close-rename / stage-mechanism / stage-materials / stage-id-removal |

### 冻结测试实读与变更边界

2026-10-26 用 Python read_text 实读下列声明写集文件的前1100字符，匹配 Frozen/frozen/冻结/DO NOT TOUCH；这些是当前冻结清单，不把未扫描写集外文件声称无保护。

- `tests/contract/acceptance-matrix-references.test.mjs`：// Frozen build-plan target test. DO NOT TOUCH after the recorded target RED; changes require an explicit reviewed request.
- `tests/contract/acceptance-object-cli.test.mjs`：// C01 P7 frozen oracle: the acceptance-object minimum check must be executable and wired.
- `tests/contract/acceptance-object-required-fields.test.mjs`：// C01 frozen oracle: execute the template-owned producer, never a test-local checker.
- `tests/contract/card05-close-cli-mechanism.test.mjs`：// Planning-only frozen oracle: accepted N18 detail contract, U012 scope, N12 until and source021.
- `tests/contract/delivery-closeout-charter-contract.test.mjs`：// Frozen build-plan target test. DO NOT TOUCH after the recorded target RED; changes require an explicit reviewed request.
- `tests/contract/delivery-note-contract.test.mjs`：// Frozen build-plan target test. DO NOT TOUCH after the recorded target RED; changes require an explicit reviewed request.
- `tests/contract/final-chain-negatives.test.mjs`：// Frozen production, PLAN oracle and real task materials are read-only.
- `tests/contract/final-chain-runner.test.mjs`：// Independent test owner; frozen build-prd/PLAN tests remain read-only.
- `tests/contract/knowledge-reuse-norm-wiring.test.mjs`：// Build-plan target oracle; production writers must not edit these assertions.
- `tests/contract/make-decision-flows.test.mjs`：// ORACLE-FLOW-STEPS — P5/T007–T009. Independent frozen material oracle.
- `tests/contract/measure-main-agent-cost.node-test.mjs`：// Frozen build-plan target tests. DO NOT TOUCH after recorded target RED; changes require an explicit reviewed request.
- `tests/contract/narrow-tool-human-confirm.test.mjs`：// build-plan 预写测试（冻结）：断言变更须走 test change request + 独立审查
- `tests/contract/stage-closeout-step-contract.test.mjs`：// Frozen build-plan target test. DO NOT TOUCH after the recorded target RED; changes require an explicit reviewed request.
- `tests/integration/main-agent-cost-closeout.node-test.mjs`：// Frozen build-plan target tests. DO NOT TOUCH after recorded target RED; changes require an explicit reviewed request.

`tests/contract/n10-process-repair.test.mjs`：第45、62行的 frozen material 原断言与TCR074受保护负例（2026-10-26 用 rg -n 实读），P10 仍走具名TCR。

计划只允许各卡具名 TCR 与独立审查后改对应断言，ORACLE身份与失败强度不变；本轮只修计划，不写任何测试。P7/P9/P10/P11 的清单以此实读路径对照，不能把 Frozen 误作直接改写许可。

### 本轮有界设计复核

本轮直接复用 `skills/spec-plan/SKILL.md#Task graph 与 tracer bullet` 的同一纵切完整交付与 `#Design and boundary` 的生产者先于消费者规则；实读 P8/P9 当前卡及 attempt/stage-materials/result 三份真实schema，确认terminal矩阵键需要同Phase schema配套，故把最小兼容增量提前P8、阶段收缩仍在P9。没有改变七包方向、AC强度或冻结测试。图导航本轮未执行，不声称取得图覆盖或收益；沿既有当前源定位，不更新图、不收费抽取。浏览器验收对象、service/route执行时绑定、两个viewport与owner/时点见P5和P12对应小节；页面尚未产生保真实。

### 需求到任务追踪

| 来源 / 决定 | 原义行为/强度 | FR / AC | Phase / Task | 正例 + 负例判据 / 证据 |
| --- | --- | --- | --- | --- |
| `U-016`/`F5`/`后建索引 R-007` 关闭改名 | 关闭技能完整改名为 stage-close，旧名只留历史 | `FR-ROUTE-001` / `AC-ROUTE-001` | `P7/T009` | `ORACLE-CLOSE-RENAME`：`skills/stage-close/SKILL.md` 存在且全仓无活动旧名引用；负例是只改目录名 |
| `U-016`、`F1` 消费者矩阵与 build-plan 只读核实 | 阶段名单只有一处来源 | `FR-STAGE-001` / `AC-STAGE-001` | `P6/T008` | `ORACLE-STAGE-REGISTRY`：14 个模块改为读取同一导出；负例是仍各自复制字面量 |
| `U-016`/`F1`/`后建索引 R-006` 16 项职责 | 最后 Phase 承接 16 项并固定九段顺序，新增终末审查身份 | `FR-MERGE-001` `FR-MERGE-002` `FR-MERGE-003` / `AC-MERGE-001` `AC-MERGE-002` `AC-MERGE-003` | `P8/T010` | `ORACLE-TERMINAL-CHAIN`：16 行五列齐全、九段有序、终末身份可调用；负例是某行只写「收口时处理」 |
| `U-016`/`F1`/`OI-005` 机制层消费者 | 机制层消费者逐项处置，无 4/5 并存 | `FR-ROUTE-002` `FR-MERGE-004` / `AC-ROUTE-002` `AC-MERGE-004` | `P9/T011` | `ORACLE-STAGE-MECHANISM`：枚举与 schema 只剩三阶段、close 与路由按身份判定；负例是仍按阶段名分支 |
| `U-016`/`F1` 方法与文档层 | 工作流与技能正文迁到三阶段，旧任务只读 | `FR-MERGE-005` / `AC-MERGE-005` | `P10/T012` | `ORACLE-STAGE-MATERIALS`：正文与 catalog 一致、历史原件未改；负例是把历史 ADR 一起改写 |
| `U-016`/`F1` 身份删除 | 全仓无 verify-code 可调用入口，旧任务只读可读 | `FR-ROUTE-003` / `AC-ROUTE-003` | `P11/T014` | `ORACLE-STAGE-ID-REMOVAL`：目录删除、引用清零、旧任务读取成功；负例是删掉旧材料 |
| `U-010`/`U-012`/`U-020`/`F2` 审查分级 | 按风险挑审查执行者，子代理不冒充异源 | `FR-REVIEW-001` `FR-REVIEW-002` / `AC-REVIEW-001` `AC-REVIEW-002` | `P1/T001` | `ORACLE-REVIEW-TIER`：四夹具结论与规则一致；负例是把子代理记成外部异源 |
| `U-018`/`U-019`/`F4` 子代理分工 | 三子代理、唯一 writer、七步顺序与提交点 | `FR-PHASE-001` `FR-PHASE-002` / `AC-PHASE-001` `AC-PHASE-002` | `P2/T002` | `ORACLE-PHASE-TEAM`：顺序夹具与唯一 writer 可证；负例是审查先于开发完成启动 |
| `U-003`/`U-009`/`U-013`/`F3` 自动恢复 | 同一失败自动换路径，只三类停 | `FR-RECOVER-001` `FR-RECOVER-002` / `AC-RECOVER-001` `AC-RECOVER-002` | `P3/T003` | `ORACLE-AUTO-RECOVERY`：四类注入各自处置正确；负例是出现固定重试次数 |
| `U-011`/`U-014`/`U-022` 验收前移 | 逐条证据计划与 incomplete 记录 | `FR-ACCEPT-001` `FR-ACCEPT-002` / `AC-ACCEPT-001` `AC-ACCEPT-002` | `P4/T004` | `ORACLE-ACCEPT-PLAN`：七字段齐全、缺口带尝试证据；负例是无证据记 incomplete |
| `U-017`/`F7`/`F8` 证据与成本 | 每 Phase 一份清单、唯一游标、成本一次、十环消费 | `FR-EVID-001` `FR-EVID-002` `FR-EVID-003` `FR-COST-001` `FR-RESULT-001` / `AC-EVID-001` `AC-EVID-002` `AC-EVID-003` `AC-COST-001` `AC-RESULT-001` | `P4/T005` | `ORACLE-EVIDENCE-PHASE`：多条命令一份清单、游标推进、成本只记一次；负例是每命令一件 |
| `U-015`/`F6` 驾驶舱生成 | 自动生成 15 类节点与十环，缺失标缺 | `FR-COCK-002` / `AC-COCK-002` | `P5/T006` | `ORACLE-COCKPIT-GEN`：真实材料生成 15 类与十环；负例是缺节点被编造 |
| `U-015`/`F6` 驾驶舱事件 | 事件驱动刷新、自动打开、环 10 时点 | `FR-COCK-001` `FR-COCK-003` / `AC-COCK-001` `AC-COCK-003` | `P5/T007` | `ORACLE-COCKPIT-EVENT`：真实事件触发打开、环 10 记 skipped；负例是仍需手动跑命令 |
| `U-024`、`F5` 关闭交付 PR | PR 标题与正文按固定上游合同规范化 | `FR-CLOSE-001` / `AC-CLOSE-001` | `P10/T013` | `ORACLE-CLOSE-PR`：三段齐全、Door 与 Blast Radius 在 Merge Danger 内；负例是只剩两行 |
| `U-006`/`F8`/`U-009` 结果与边界 | 真实可达性尝试、失败模式观察及终末边界独立检查 | `FR-RESULT-001` `FR-BOUND-001` `FR-BOUND-002` / `AC-RESULT-002` `AC-RESULT-003` `AC-BOUND-001` `AC-BOUND-002` | `AC-RESULT-002→P4/T004`；`AC-RESULT-003→P3/T003`；两条 `AC-BOUND→P12/T015` | 原owner聚合前实际执行并独立核；P12仅两named终末边界首判。ORACLE-FINAL-ACCOUNT消费原件，不用估计代替真实观察 |

### 全局验证策略

- **验证策略**：每个 Phase 一条具名 vitest 命令作为 `gate_cmd`，用真实文件与真实字节判断；跨 Phase 的整仓一致性用 `node tools/cli/check-skill-consistency.mjs --root "$PWD"` 与 `node tools/cli/verify-structure.mjs`。只跑受影响文件，不跑全量。代表命令：`npx vitest run tests/contract/terminal-chain.test.mjs`。
- **RED/GREEN 设计**：每个行为 Task 先写具名测试文件，跑一次目标断言失败并保存原始输出，再实施到同一断言通过。build-plan 阶段不写实现，因此本规格的 Task 卡把 RED 证据如实标为 `unavailable — build-plan 不实施`，由 build-code 首个动作补真实 RED。
- **冻结与测试变更**：标 Frozen 的测试文件只能通过测试变更请求修改，并留一份独立审查原件；按名改 Phase 卡点名的既有常量取值不触发变更请求。
- **最终聚合**：`P12/T015` 逐条消费沿途结论原件对账，只复核与补必要未闭环 case，不代做业务功能或上游 AC 的首次判定。仅 AC-BOUND-001（最终方法版本边界）与 AC-BOUND-002（真实最终报告/交接边界）允许在其真实终末对象产生时由独立reader首次检查；不得把此例外扩为业务功能首次交付或延期验收。
- **不能证明的内容**：不证明外部 OCR provider 可用，不证明用户业务效果，不证明耗时降低到某个数字；这三项分别记 `unavailable`、需真实旅程、不承诺。

```sh
node tools/cli/check-skill-consistency.mjs --root "$PWD"
```

## Appendix A — 验收判据（唯一权威）

每条 AC 的判定方式只在这里定义。`机器可判` 表示本任务内一条命令可重放真假；`只能人读` 表示判据是语义可用性；`需真实环境+用户在场` 表示真实外部环境产生判据且用户在场。

- [ ] **AC-ROUTE-001**：关闭技能与目录名为 `stage-close`，当前材料与工具里没有可执行的 `stage-closeout` 引用；旧名只在历史原件出现。判定方式：机器可判。
验证：P7 实施者在真实工作树对全仓做引用扫描并跑具名测试；独立审查者重放同一命令核对结果，不读旧聊天结论。
通过：`skills/stage-close/SKILL.md` 存在；除历史目录与历史任务材料外，扫描命中为 0；具名测试退出 0。
失败：仍有当前技能、工具、测试或治理文档引用 `stage-closeout`；或只改目录名而未改引用与测试。
证据：P7 的证据路径下保存扫描原始输出与测试回执，各一份原件。

- [ ] **AC-ROUTE-002**：机制层的阶段写入只接受 make-decision、build-plan、build-code；verify-code 不再是可写阶段，读取仍接受旧任务里的旧值。判定方式：机器可判。
验证：P9 实施者读真实枚举来源并跑具名测试；验证者用同一命令重放，另取一个旧任务目录实际读取其 verify-code 阶段事实。
通过：写入路径拒绝 verify-code；读取旧任务成功；一致性校验工具退出 0。
失败：仍能按 verify-code 写入新阶段；或读旧任务报错。
证据：P9 证据路径下的枚举原始输出、测试回执与旧任务读取结果。

- [ ] **AC-ROUTE-003**：工作树里没有 verify-code 的可调用入口：目录删除、当前引用清零，而旧任务材料仍能只读读出。判定方式：机器可判。
验证：P11 实施者在真实工作树做全仓引用扫描并跑具名测试；验证者重放同一扫描，并实际读取一个旧任务的 verify-code 材料。
通过：`workflows/verify-code` 目录不存在；当前范围内命中为 0；旧任务 material 读取成功。
失败：仍有可调用入口；或删掉历史材料导致旧任务不可读。
证据：P11 证据路径下的扫描输出、测试回执与旧任务读取原件。

- [ ] **AC-STAGE-001**：阶段名单只有一处可执行来源，原本 14 个各自复制字面量的模块改为从同一导出读取，行为不变。判定方式：机器可判。
验证：P6 实施者建注册表并改消费方，加具名测试；验证者核对残留字面量副本数与各消费方的读取方式，并跑一次行为对照。
通过：可执行定义点只有一处；消费方全部改为读取该导出；行为对照与改前一致。
失败：仍有模块自持字面量；或行为发生变化。
证据：P6 证据路径下的定义点扫描、消费方清单与行为对照回执。

- [ ] **AC-MERGE-005**：当前生效的工作流正文、技能正文与治理文档一致只讲三阶段；历史 ADR、研究文档与归档材料保持原样。判定方式：机器可判。
验证：P10 实施者按分组迁移并加具名测试；验证者读真实文件核对三阶段表述，并核对历史文件的字节未变。
通过：当前材料一致三阶段；历史文件字节未变；正文绑定的测试退出 0。
失败：仍有当前材料写四阶段；或把历史文档一起改写。
证据：P10 证据路径下的正文读回、历史文件字节核对与测试回执。

- [ ] **AC-MERGE-001**：原 verify-code 的 16 项职责在最后 Phase 逐项有承接位置、执行者、证据与验收。判定方式：机器可判。
验证：P8 实施者按 RP-01…RP-16 编号把承接表写进最后 Phase 的方法正文；验证者跑具名测试核对 16 个编号与四列齐全。
通过：16 行齐全，每行有并入位置、执行者、证据与验收；缺项数为 0。
失败：少于 16 行；或某行只写"在收口阶段处理"这类无执行者、无证据的含糊承接。
证据：P8 证据路径下的承接表读回与测试回执。

- [ ] **AC-MERGE-002**：最后 Phase 按固定九段顺序执行，AC 首判仍在各承接 Phase，最后 Phase 只对账；build-code 作为最后阶段不再产出阶段交接，改由最终报告承担人读关闭记录。判定方式：机器可判。
验证：P8 实施者写顺序清单并加具名测试；验证者核对顺序文本与 AC 归属规则，抽查一条 AC 的首次判定点不在最后 Phase，并核对最后阶段没有 stage-handoff 产物。
通过：九段顺序齐全且有序；方法正文明确最后 Phase 不对任何 AC 做首次判定；最后阶段以最终报告收口，不再产出阶段交接。
失败：顺序缺失或乱序；或允许最后 Phase 为某条 AC 首次给结论；或仍要求最后阶段产出阶段交接。
证据：P8 证据路径下的顺序读回、归属抽查记录与最终报告样例。

- [ ] **AC-MERGE-003**：存在终末独立审查身份，审查整份交付 diff，可在原 verify-code 审查合同上修改。判定方式：机器可判。
验证：P8 实施者在审查合同与阶段材料里登记该身份；验证者用真实审查调用参数核对审查范围是整份交付 diff 而非单 Phase diff。
通过：审查身份可被调用并指明整份交付 diff；原 verify-code 审查合同字段被复用或明确替代。
失败：终末审查仍按单 Phase 范围；或新增了第二套 provider 协议。
证据：P8 证据路径下的审查合同读回与一次真实调用参数的原始记录。

- [ ] **AC-MERGE-004**：11 类消费者逐项有处置，旧任务只读可读，不残留 4/5 并存枚举。判定方式：机器可判。
验证：P9 实施者按 F1 的 11 类消费者写处置表并跑一致性检查；验证者重放检查并扫描是否存在同时接受 4 阶段与 5 阶段的枚举分支。
通过：11 类逐项有处置；一致性检查退出 0；无 4/5 并存分支。
失败：任一消费者无处置；或存在同时接受两套阶段数的分支。
证据：P9 证据路径下的处置表、检查回执与并存枚举扫描输出。

- [ ] **AC-REVIEW-001**：复杂任务按风险挑 Phase 审查执行者；低风险独立子代理、高风险或影响说不清走外部 OCR、终末整卡外部全审；子代理不冒充外部异源。判定方式：机器可判。
验证：P1 实施者写选择规则与执行者记录字段，用四个受控夹具实跑；验证者用同一夹具重放并核对记录里的执行者身份字样。
通过：四个夹具结论与规则一致；执行者记录区分"独立子代理"与"外部 OCR"；终末整卡全审可定位。
失败：任一夹具结论与规则相反；或子代理审查被记成外部异源；或引入数字阈值。
证据：P1 证据路径下的四夹具输入、实际结论与记录原件。

- [ ] **AC-REVIEW-002**：低风险正向判据在场，三维证据可执行，`docs/standard-workflow.md` 的"不得降审"规则按用户授权修订并记录这是用户选择。判定方式：机器可判。
验证：P1 实施者改规则正文并留用户授权引用；验证者读真实文件核对五条低风险判据与三维证据定义，并确认授权来源是 U-020 而不是代理自判。
通过：五条正向判据在场；三维证据各有可执行取数方式；规则改动处引用真实用户授权；没有新增选择表或动态评分器。
失败：判据写成否定句或无法执行；或把降审记成代理自行决定；或新增第二套审查点。
证据：P1 证据路径下的规则读回、授权引用与三维取数命令输出。

- [ ] **AC-PHASE-001**：复杂任务每个 Phase 有 1 开发、1 审查、1 测试子代理；开发是唯一 writer；审查与测试不改代码、测试或材料。判定方式：机器可判。
验证：P2 实施者写角色与写权限规则、并加受控 Phase 夹具；验证者重放夹具并核对角色记录与真实改动文件是否为单写主。
通过：三角色齐全；夹具里审查与测试执行前后的文件字节不变；记录里只有一个 writer。
失败：审查或测试改了文件；或出现两个 writer。
证据：P2 证据路径下的夹具输入、改动前后字节与角色记录。

- [ ] **AC-PHASE-002**：七步顺序可核，开发完成前不启动审查与测试，普通 finding 回开发，每 Phase 审后提交一次，迟到 finding 重开同一 Phase。判定方式：机器可判。
验证：P2 实施者写七步与提交点，加受控顺序夹具；验证者重放夹具核对时间戳顺序与提交次数，并核对主会话只做四项检查。
通过：夹具证明顺序不可颠倒；提交点恰在审后一次；普通 finding 只回开发；迟到 finding 在原 Phase 重开。
失败：审查在开发完成前启动；或出现多提交点；或迟到 finding 被丢到终末审。
证据：P2 证据路径下的顺序夹具记录、提交回执与 finding 往返记录。

- [ ] **AC-RECOVER-001**：同一失败反复或一轮无新事实时自动换路径继续，原失败保留，不弹三选项。判定方式：机器可判。
验证：P3 实施者写自动恢复规则并做受控故障注入；验证者重放注入，核对是否换路径继续、原失败原件是否保留、是否出现问人选项。
通过：注入后换路径继续；原失败原件可读；过程没有停下来问人。
失败：同一失败原地重试；或原失败被覆盖；或中途弹选项。
证据：P3 证据路径下的注入输入、收敛路径与失败原件。

- [ ] **AC-RECOVER-002**：只三类停机；缺资源按四类分诊；不设次数或时长上限。判定方式：机器可判。
验证：P3 实施者写停机与缺资源分诊规则，注入四类场景各自验证；验证者重放并核对每类的处置与是否问人。
通过：非阻塞缺资源记 `incomplete` 继续；用户独占阻塞问一次；改 AC 或方向停；严重风险停；规则里没有次数或时长上限。
失败：出现固定重试次数、固定时长或预算；或把非阻塞缺资源升级成问人。
证据：P3 证据路径下四类场景的注入与处置记录。

- [ ] **AC-ACCEPT-001**：每条承接 AC 有逐条证据计划，含判什么、怎么判、证据来源、谁提供、何时能拿到、成本类别、拿不到怎么办。判定方式：机器可判。
验证：P4 实施者把七个字段写进 spec 与 Phase 卡的既有验收正文，并加具名测试；验证者抽三条 AC 核对七字段齐全且指向真实提供者。
通过：抽查的每条 AC 七字段齐全，提供者与取得时点是真实对象；缺字段数为 0。
失败：缺任一字段；或字段写成占位；或提供者不是真实对象。
证据：P4 证据路径下的抽查记录与测试回执。

- [ ] **AC-ACCEPT-002**：`incomplete` 有真实尝试证据与恢复条件；build-code 结束统一提醒；可带缺口进 stage-close 但最终报告逐条列缺口、不宣称完成。判定方式：机器可判。
验证：P4 实施者写记录格式与结束提醒规则；验证者读真实材料核对一条 `incomplete` 是否带尝试证据与恢复条件，并核对最终报告的缺口列。
通过：`incomplete` 带尝试证据与恢复条件；结束时出现统一提醒；报告逐条列缺口且无"已完成"字样。
失败：无尝试证据就记 `incomplete`；或结束时无提醒；或把带缺口的任务写成完成。
证据：P4 证据路径下的记录读回与报告片段。

- [ ] **AC-EVID-001**：每个 Phase 一份执行清单，列命令、cwd、退出码、失败、真实 diff、证据指针；原始输出只在失败、差异、外部返回体等处留原件；同字节复用。判定方式：机器可判。
验证：P4 实施者写清单结构与写入规则，做受控 Phase 夹具：一个 Phase 跑多条命令；验证者重放夹具，核对清单只有一份、成功输出不各存一件、失败输出保留原件。
通过：多条命令只产出一份清单；失败与差异有原件；重复成功输出复用原 ref。
失败：每个命令一份文件；或失败输出未留；或同字节重复写新件。
证据：P4 证据路径下的夹具清单、原件清单与复用记录。

- [ ] **AC-EVID-002**：Phase 收口只更新唯一 `phase_progress` 游标，不存历史序列，不建第二进度权威。判定方式：机器可判。
验证：P4 实施者在受控夹具里连推两个 Phase；验证者读 task facts，核对只存在一条当前游标且没有历史序列数组。
通过：游标推进可读；facts 里没有历史序列；没有第二个进度来源。
失败：出现历史序列；或出现第二个进度权威。
证据：P4 证据路径下两次推进后的 facts 读回。

- [ ] **AC-EVID-003**：Phase 卡列本 Phase 实际读到的材料与审查，独立审查核对没有多读整仓。判定方式：机器可判。
验证：P4 实施者在 Phase 卡加材料清单；验证者取一个真实 Phase，比对清单与实际读过的文件集合。
通过：清单与实际读过的集合一致；审查能给出"没多读整仓"的依据。
失败：清单缺失；或清单与实际读取不一致且无解释。
证据：P4 证据路径下的清单与比对记录。

- [ ] **AC-COST-001**：成本在整个 stage 末记一次，同一窗口不重复；十环报告在最后 Phase 消费。判定方式：机器可判。
验证：P4 实施者把成本触发点固定在 stage 末并让最后 Phase 消费十环报告；验证者跑一次真实计量，核对只有一次记录与一条十环消费记录。
通过：同一次 stage 只出现一次成本记录；最后 Phase 有十环消费记录。
失败：每 Phase 触发成本；或十环报告未被消费。
证据：P4/T005 证据路径下的计量原始输出与十环消费记录。

- [ ] **AC-RESULT-001**：成本可复算：用既有 `measure-main-agent-cost` 在受控一次运行与冻结基线上算出墙钟、token、steps 与子代理调用次数，并报告实际数字。判定方式：机器可判。
验证：P4 实施者在真实任务上跑一次，记录比较基线与指标；验证者用同一入口复算并对照两份读数。
通过：五个指标都有实际数字；基线与本次条件可比；结论写明未观测部分。
失败：只给百分比无原始数字；或基线未实测。
证据：P4/T005 证据路径下的两次数值原始输出。

- [ ] **AC-COCK-001**：页面按六类事件自动刷新，首次生成与实质变化自动用系统默认浏览器打开，打不开如实报"未自动打开"。判定方式：机器可判。
验证：P5 实施者接事件触发与打开逻辑，用一个真实事件实跑；验证者核对打开动作来自事件而非手动命令，并核对打开失败时的提示文字。
通过：真实事件触发生成与打开；打开失败时输出"未自动打开"；证据显示触发源是事件。
失败：仍需手动跑命令；或打开失败被写成成功。
证据：P5 证据路径下的事件输入、打开动作与浏览器实际截图。

- [ ] **AC-COCK-002**：数据从当前材料、task facts、真实 diff、测试与审查原件自动生成 15 类节点与主链十环；缺的标"缺"不编造。判定方式：机器可判。
验证：P5 实施者接数据源并生成页面；验证者逐个节点核对来源指针，并构造一个缺数据场景看是否标"缺"。
通过：15 类节点齐全且各有来源指针；十环齐全；缺数据节点显示"缺"。
失败：节点靠手拼；或缺失节点被编造内容。
证据：P5 证据路径下的页面、节点来源表与缺数据场景截图。
说明：本条15类指有源内容词汇，目录仍为req/wp/task三类＋原进度入口。逐节点核对必须核实际具名身份、数量、标题/内容、归属与来源，并从三类主详情的卡片/来源抽屉实际消费；不是只核DATA.kind集合。缺失/归属未知用短卡态，不伪关系或伪通过；P5按最初模板与两viewport验收，旧15类侧栏/边恒空断言沿本卡窄TCR纠正，不改变本条原成功失败口径。

- [ ] **AC-COCK-003**：页面只读派生，不写任务状态、不做第二进度；环 1–9 在 build-code 最后 Phase 刷新，环 10 记 `skipped`，stage-close 完成后由调用方补终态。判定方式：机器可判。
验证：P5 实施者把环 10 时点写进方法并留调用方；验证者核对 build-code 内环 10 为 `skipped`，且页面不写任何 task facts。
通过：build-code 内环 10 为 `skipped`；stage-close 后有补终态记录；页面写入只到派生目录。
失败：页面写了任务状态；或环 10 在 build-code 内被标成完成。
证据：P5 证据路径下的两时点页面与写入路径记录。

- [ ] **AC-CLOSE-001**：`stage-close` 的 PR 标题与正文按固定上游合同规范化：正文含 Summary、Evidence、Merge Danger 三段，Door 与 Blast Radius 落在 Merge Danger 内，标题用仓内既有提交约定且不是空话；缺段时按既有 `PR_DESCRIPTION_INCOMPLETE` 报错。判定方式：机器可判。
验证：P10 实施者改 `skills/stage-close/SKILL.md` 的 PR 内容合同并加具名测试；验证者用一份真实 PR 样例逐段核对三段、两个字段位置与标题形状，再构造一份缺 Merge Danger 的负例。
通过：三段齐全；Door 与 Blast Radius 在 Merge Danger 段内；标题符合仓内 `type(scope): summary` 形状且不是 update/changes 这类空话；缺段被报为 PR_DESCRIPTION_INCOMPLETE。
失败：正文仍只有 Door 与 Blast Radius 两行；或标题仍是空话；或缺段不报错直接建 PR。
证据：P10/T013 证据路径下的真实样例、负例与测试回执。

- [ ] **AC-RESULT-002**：AC 可达性干跑：拿一个真实 Phase 的 AC，逐条标本地可判、需人、需外部，实际尝试本地检查并记录哪些 `incomplete`、为什么、恢复条件。判定方式：机器可判。
验证：原 P4/T004 evidence owner 在 P12 聚合前对一个真实 Phase 的承接 AC 逐条标注并实际尝试；独立验证者核对标注与尝试记录一致。P12只消费该首判原件；当前原件未取得，不由映射生成通过。
通过：每条 AC 有标注；本地可判的真的跑了；`incomplete` 有原因与恢复条件。
失败：只标注不尝试；或把需外部条件写成已通过。
证据：原 P4/T004 保存的标注表、实际尝试命令回执与独立首判原件；P12只留其引用。

- [ ] **AC-RESULT-003**：已知失败模式前后计数：在 T02 十三 Phase 静态表上标出旧规则会重复审或重复修复的次数，与新规则预期对比；或做一次受控"无新事实"注入，记录换路径次数与是否回用户。判定方式：机器可判。
验证：原 P3/T003 recovery owner 在 P12 聚合前做静态表标注或注入实验，二者任选其一并说明选择理由；独立验证者核对计数来源与结论。P12只消费该首判原件；当前原件未取得，旧恢复材料不自动满足本条。
通过：给出真实计数或真实注入记录；结论不夸大为"已消除"。
失败：用主观估计代替计数；或把一次注入写成普适保证。
证据：原 P3/T003 保存的真实静态表或注入记录及独立首判原件；P12只留其引用。

- [ ] **AC-BOUND-001**：不设固定时间、次数或数量上限；不用测试数量或报告数量当质量。判定方式：只能人读。
验证：P12在最终方法版本冻结后由独立读者读本规格、七个工作包方法与新增规则的精确版本，逐处找固定预算与计数替代质量的表述；这是终末版本边界的具名首次检查例外，不允许业务AC延期。
通过：全文没有固定次数、时长或数字阈值；质量判断都指向真实判据而非计数。
失败：出现固定重试次数、固定时长或"测试越多越好"这类计数替代。
证据：读者标注清单与所读文件路径；不留数量配额。

- [ ] **AC-BOUND-002**：成功标准是可验收的有限目标，不承诺零复发；不把 `incomplete` 写成完成。判定方式：只能人读。
验证：P12真实最终报告及交接产生后，独立读者按实际ref/hash读其固定字节，核对是否出现"彻底避免""零复发""已完成"这类超出证据的表述。
通过：结论停在证据支持的强度；缺口逐条列出。
失败：出现零复发或彻底避免的承诺；或带缺口仍写完成。
证据：独立读者原始结论、所读报告/交接实际路径与hash。唯一不可变最终报告生成时如实记本条待后置独立检查；检查后由现有stagefacts与最终人答并列引用报告和reader结论闭本条，不覆报告、不机械生成report2追验循环。实质内容错误保原finding并正常修复留新原件，不因报告保留生成时pending而否认之后真实独立结果。

## 12. 风险、未决与交接

- **RISK-01**：合并后终末质量下降
  - **受影响 ID**：FR-MERGE-001、AC-MERGE-001
  - **触发条件**：16 项里有几项被写成"在收口时处理"
  - **后果**：终末审查与修复职责实际丢失，问题拖到交付后
  - **缓解或停止**：承接表逐项带执行者、证据与验收；缺一项不算完成
  - **处理阶段**：P8 承接与独立审查；P12 对账
  - **验证**：核对 16 行五列齐全，抽三条实际执行
- **RISK-02**：外部 OCR 不可用导致审查降级
  - **受影响 ID**：FR-REVIEW-001、AC-REVIEW-001
  - **触发条件**：`ocr` 不存在或版本低于 1.12.9
  - **后果**：高风险 Phase 只剩同源子代理审查
  - **缓解或停止**：如实记 `unavailable`，保留检测输出；不换执行者冒充异源
  - **处理阶段**：P1/P8 开工检测，P12 消费真实原件
  - **验证**：检测输出可读，不可用时记录完整
- **RISK-03**：驾驶舱做成第二个进度权威
  - **受影响 ID**：FR-COCK-003、AC-COCK-003
  - **触发条件**：页面写入 task facts 或自存状态
  - **后果**：两处进度不一致，审查与续跑失去唯一权威
  - **缓解或停止**：页面只读派生，写入只到派生目录
  - **处理阶段**：P5 实施与审查；P12 对账
  - **验证**：核对页面写入路径，确认不碰 task facts
- **OPEN-01**：16 项职责的编号与原文对应关系需在 P8 落地时逐条回读原 verify-code 正文
  - **受影响 ID**：FR-MERGE-001、AC-MERGE-001
  - **负责人**：对应首次承接 Phase 实施者
  - **影响**：编号与原文错配会让承接表看起来齐全但实际漏项
  - **处理阶段**：P8 首判；P12 仅对账
  - **关闭条件或停止**：16 条编号逐条指向原正文的真实段落，且能回读
- **OPEN-02**：驾驶舱现状未由本 writer 独立复核
  - **受影响 ID**：FR-COCK-001、AC-COCK-001
  - **负责人**：对应首次承接 Phase 实施者
  - **影响**：可能按错误现状设计，改完仍不可用
  - **处理阶段**：P5 开工先实读真实调用链
  - **关闭条件或停止**：给出真实调用点与缺口清单后才动手

## 13. 业务影响与回归范围

- **既有行为**：复杂开发路线四阶段（make-decision、build-plan、build-code、verify-code）；全局五种工作流阶段还含 build-prd；四级审查方式、七类公共命令、证据与游标现状。
- **本需求影响**：复杂开发路线从四阶段降到三阶段；全局工作流阶段从五种降到四种，build-prd 规划路线保留；审查执行者按风险选择；证据粒度变粗但保留原件；新增终末审查身份。
- **回归路径**：小改动与普通任务的材料与审查方式不变；build-prd 规划路线不变；旧任务材料只读可读。
- **可能受冲击的业务规则**：任何按阶段名分支的代码与测试；任何列 verify-code 的文档索引；任何引用 `stage-closeout` 的调用方。
- **明确无影响**：公共命令的数量与语义不变；不新增持久对象；不改历史证据。

## 决策日志落地对照

本节回答：decision-log 里的每条原始需求、每个用户答复、每个工作包，在本规格里落到哪一条，哪些已经在前序阶段完成、哪些不属于本阶段实施。缺落点就是缺口，不许含糊带过。

### 后建索引 R-001…R-013 与 v1 主文 R-001…R-006

| 来源 | 原义 | 落点 | 状态 |
| --- | --- | --- | --- |
| v1 R-001 / 后建 R-001 | 两任务设计、执行、验收、修复的严重问题与耗时痛点 | 第 1 节「需求解释」；复盘已在 make-decision 完成 | 已消费，不重复调研 |
| v1 R-002 / 后建 R-002、R-004 | 查清 build-code 长耗时与 token 浪费根因 | 第 1 节的五个放大器；PFACT-004 明确只到机制线索 | 只作设计输入，不承诺定论 |
| 后建 R-003 | 每任务至少四个子代理做四类研究 | make-decision 的执行事实 | 前序已完成 |
| v1 R-003 / 后建 R-005 | 优化 WorkflowHub 避免同类复发 | 全部 12 个 Phase | 本规格承接 |
| 后建 R-006 / v1 R-004 | verify-code 全部工作迁入末 Phase，含验证、全局审查、架构师审查、修复、测试 | AC-MERGE-001、AC-MERGE-003 | 本规格承接 |
| 后建 R-007 | 少一个 stage，末尾无 handoff | AC-ROUTE-002、AC-ROUTE-003、AC-MERGE-002 | 本规格承接 |
| 后建 R-008 / v1 R-005 | 查可行性及 build-plan、build-code 的修改 | 实现设计的「接口与失败语义」三条硬冲突 | 本规格承接 |
| 后建 R-009 / v1 R-006 | 先 worktree、从 make-decision 起、不跳阶段 | 任务身份：认证 worktree 与 `task/workflowhub/...` 分支 | 已发生 |
| 后建 R-010 | 内外研究、大纲、发散、逐模块 Talk、方案与验收收敛 | make-decision 的交付 | 前序已完成 |
| 后建 R-011 | 中文大白话、Talk/Grill 用提问工具、说明选项后果风险 | 本阶段的沟通方式；材料本身保持合同语言 | 持续执行 |
| 后建 R-012 | 方向与细节异源建议各一次，细节须在收敛后 | 方向建议已做；本次细节只做一次独立合并审查，终末再做一次外部审查 | 本阶段执行 |
| 后建 R-013 | 确认后停下汇报内容、进度、下一步并给 handoff 路径 | 本阶段收口时执行 | 本阶段执行 |

### U-001…U-022

| 来源 | 最小决定 | 落点 |
| --- | --- | --- |
| U-001 | 一个任务、多 Phase 验收 | 一个 task、12 个 Phase |
| U-002 | 普通开发目标是三 stage | AC-ROUTE-002、AC-ROUTE-003 |
| U-003 | 4 小时无进展只是止损原则，不扩成预算 | AC-BOUND-001、AC-RECOVER-002 |
| U-004 | 末阶段不交接；当前交接不取消 | AC-MERGE-002；本阶段照常出交接 |
| U-005 | 撤回按五块切实施 | 「明确不做」第 3 条 |
| U-006 | 可验收的有限目标，不承诺零复发 | AC-BOUND-002 |
| U-007 | 先修根因、后做阶段合并 | Phase 顺序：前五个 Phase 修根因，中间六个 Phase 做合并，最后一个 Phase 对账 |
| U-008 | build-code、build-prd 作末阶段不交接；全部完成后关闭 | AC-MERGE-002；关闭由 stage-close 承接 |
| U-009 | 不设固定时间；先确认完整大纲 | AC-BOUND-001 |
| U-010 | 四级不变；复杂任务按风险挑 Phase 审查 | AC-REVIEW-001 |
| U-011 | 每 Phase 验收不得超大、要计成本；verify-code 职责逐项理清 | AC-ACCEPT-001、AC-COST-001、AC-MERGE-001 |
| U-012 | WP1 五项选定 | AC-REVIEW-001 |
| U-013 | WP2 停点与准备前移 | AC-RECOVER-002 |
| U-014 | WP3 不拆任务、缺口记 incomplete | AC-ACCEPT-001、AC-ACCEPT-002 |
| U-015 | WP4 五项选定 | AC-COCK-001、AC-COCK-002、AC-COCK-003 |
| U-016 | WP5 合并、删阶段身份、关闭留外面、改名 stage-close | AC-ROUTE-001 至 AC-ROUTE-003、AC-MERGE-001 至 AC-MERGE-005 |
| U-017 | WP6 清单、Phase 卡材料、成本 stage 末一次 | AC-EVID-001 至 AC-EVID-003、AC-COST-001 |
| U-018 | WP7 三角色、唯一 writer | AC-PHASE-001 |
| U-019 | Phase 内七步顺序 | AC-PHASE-002 |
| U-020 | 授权低风险子代理审查，同步改规则并记录用户选择 | AC-REVIEW-002 |
| U-021 | 最终报告作关闭记录，不再出阶段交接 | AC-MERGE-002 |
| U-022 | 允许带 incomplete 进 stage-close，报告列缺口 | AC-ACCEPT-002 |
| U-023 | 宪法条文同步授权，原则不变 | P10 条文同步（`CONSTITUTION.md`、`constitution-checklist.md`） |
| U-024 | PR 标题与正文规范化 | AC-CLOSE-001 |

### WP1…WP7 与 F1…F8

| 来源 | 落点 |
| --- | --- |
| WP1 审查分级 | AC-REVIEW-001、AC-REVIEW-002 |
| WP2 自动恢复 | AC-RECOVER-001、AC-RECOVER-002 |
| WP3 验收前移 | AC-ACCEPT-001、AC-ACCEPT-002 |
| WP4 驾驶舱 | AC-COCK-001、AC-COCK-002、AC-COCK-003 |
| WP5 合并 | AC-ROUTE-001 至 AC-ROUTE-003、AC-MERGE-001 至 AC-MERGE-005 |
| WP6 证据与游标 | AC-EVID-001 至 AC-EVID-003、AC-COST-001 |
| WP7 子代理分工 | AC-PHASE-001、AC-PHASE-002 |
| F1 16 项职责基线与消费者矩阵 | AC-MERGE-001、AC-MERGE-004 |
| F2 规则例外与低风险正向判据 | AC-REVIEW-002 |
| F3 缺资源优先级 | AC-RECOVER-002 |
| F4 Phase 收口与提交点 | AC-PHASE-002 |
| F5 关闭合同 | AC-MERGE-002、AC-ROUTE-001 |
| F6 页面事件验收 | AC-COCK-001 |
| F7 WP6 快照同步 | 已由 make-decision 写回；本规格 AC-EVID-001 至 AC-EVID-003 承接实现 |
| F8 结果层三条信号 | AC-RESULT-001、AC-RESULT-002、AC-RESULT-003 |

### 未决项状态

| OI | 状态 | 说明 |
| --- | --- | --- |
| OI-001、OI-002、OI-004、OI-006、OI-008、OI-011、OI-012 | 前序已确认或已关闭 | 本阶段按 make-decision 结论执行，不重问 |
| OI-003 | 方向已确认 | 由 AC-RECOVER-002 承接实现与演练 |
| OI-005 | 未决 | 由 AC-MERGE-004、AC-MERGE-005 的消费者矩阵逐项处置 |
| OI-007 | 方向已确认 | 由 AC-MERGE-001 的 16 项承接表承接 |
| OI-009 | 方向已确认 | 由 AC-ACCEPT-002 承接实现 |
| OI-010 | 方向已确认 | 由 AC-REVIEW-001 与 AC-EVID-001 至 AC-EVID-003 承接 |
| OI-013 | 材料层已关闭 | 顺序夹具由 AC-PHASE-002 承接 |
| OI-014 | 已确认，实施未做 | 由全部 Phase 与终末对账承接 |

## 补充材料

- decision-log 正本：`specs/workflowhub-build-code-efficiency-verify-merge-20261026/decision-log.md`
- 七包收敛摘要与覆盖：任务库 `quality/evidence/wp-decisions-summary-20261026.md`、`quality/evidence/decision-log-refs/coverage-matrix-5d.md`
- 审查与核正原件：任务库 `quality/evidence/reviews/detail-advice-20261026.md`、`quality/evidence/research/2026-10-26-001-bounded-factual-corrections.md`

### 当前任务终末时点澄清

本任务以上两条具名边界例外明确覆盖当前 `workflows/build-code/SKILL.md` 及P8旧绝对“任何AC不得末Phase首判”句；P10/T012负责在原方法owner正文同步，当前计划修复不提前改生产方法。其余AC仍由原承接Phase聚合前真实执行、独立判定；P8既有接口验收与历史证据不重签。四条当前首判原件均未取得，不把计划归属当执行事实。

### P10/T012终末质量事实的唯一status consumer补缺

FR-MERGE-001/002与AC-MERGE-001/002已有终末16职责要求不变。当前status只按单review投影incomplete、work_status只表材料ready，缺综合独立终末原件reader；P10同方法producer首次接通。唯一可选stage事实 `terminal_assessment_ref:{ref,sha256}` 由现run互斥输入保存，由现status读取已有独立reader普通原件及唯一不可变final-report；完整严格合同/具名RED/GREEN见P10/T012同名节，不在spec复制字段规则。选择原row白名单/私有校验，不改未被此路径消费的旧facts-subschema，不新完成对象/公共命令/状态机/历史账本。status只投影不作推进或交付许可证；旧原review结论、provider原件与覆盖限制保留，修后独立复验闭合与原外审结论分列，不自动accepted_risk。P9原三根因实现、其他stage和无ref旧回退不受本新增consumer影响。本节为root已决定的必要缺口修复，不改变业务FR/AC成功阈值；当前未实施、未生成原件、未验收。原两个生产路径全局已存在，只补既有status测试一条精确路径。

P10终末status的真实下游同时接通原通用监控builder→原模板：builder调用既有公共status得到归一DTO，阶段栏/顶部/linked primary显示同一有限结论，Task原交付/验收分列；renderer十环report不被伪作task_status。无新终末ref保持P5已验证原投影，不复制裁决、不读最新报告猜状态。三既有精确路径及安装Runner/注册taskpath/具名渲染正反验证见P10/T012“同一status DTO接通通用监控页面”，全局路径已存在不重复登记。

P10/T013同次接通既有 `core/task-close.mjs` preparePr真实consumer：当前默认稿已具三段/BeforeAfter，补现validator字段归Merge Danger、标题及Door分类的实际校验缺口；具名owned prepareDeliveryClosePlan正反测试沿P10既有stage-close-pr-contract/TCR，保历史原件/授权与close语义。全局core路径已存在，索引仅P10补该原owner，不新增parser或公共接口。
