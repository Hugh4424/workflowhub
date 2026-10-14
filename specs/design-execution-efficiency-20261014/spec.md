# 功能规格：让设计出的任务更合理、执行更高质量更高效率（WorkflowHub 自身）

读者：本任务的实施者、独立审查者与验收读者；下游 build-code / verify-code 会话。
读完要能：定位本任务要改的真实文件与符号、每条验收的唯一判据，以及每个 Phase 承接哪条 AC。

- **功能名**：WorkflowHub 设计/执行效率改造（入口代价、分解依据、Phase 闭环、证据减法、停机、决策与实现分界、审查真实性）
- **来源**：`specs/design-execution-efficiency-20261014/decision-log.md`（sha256 `dfeede805dadce67cf9a78592c8b0a7921a2d4a0ad7d86c193c051ed9e605666`，462 行）与任务库 `quality/evidence/raw-requirements/2026-10-14-design-execution-efficiency.md`（用户逐字，sha256 `dd0625840f1867f7e8e3fd84b84bf272c20b33e30432fd73e1a5dd34fe9758c6`）
- **状态**：草稿（build-plan 收口前）；计划确认见阶段末的真实答复记录

## 速读卡（30 秒）

- **一句话需求**：让 WorkflowHub 设计出的任务更合理、执行更高质量更高效率 —— 让代价在人为边界上看得见，让不收敛有终止条件。
- **核心改动点**：
  - 入口（make-decision）真的调用既有规模评估函数，并把「几个独立可交付验收单元、是否含需用户在场或真实凭证的动作、评估真实返回」摆到现有确认边界上
  - Phase 边界改由「可独立交付验收的单元」决定，写集降级为申报；粒度规则补上「何时应当并」的另一半
  - 每个 Phase 自带判据与提交、允许显著标注的「带欠账完成」、需真实环境的判据不押依赖链末端
  - 同一事实（字节相同）不再新写一份；证明范围只写路径 + hash；捕获层与审查输出层按 `deduplication: unknown` 失败安全复用
  - 外部不可重试失败零重试、立即升级并给可直接回复的选项；时间永不构成停止或复位条件
  - 决策材料只留方向与决定；坐标/阈值/字段级方案归 spec 与 Phase 卡；契约面用符号名 + 行为语义
  - 审查「有结论」三条件钉死；OCR 不可用四件齐；冻结字段清单；记录身份不得混淆
- **最大影响面**：make-decision / build-plan / build-code / verify-code 四个 workflow 的方法文本、spec-plan 与 spec-specify 两个模板、wh-review 合同与方法、AGENTS.md 与 standard-workflow 的执行纪律，以及两处已被授权的运行时行为。
- **验收信号**：干跑重演双输入对照表（Phase 数 / 最长链 / 并行宽度 / 写集重叠 / 体量分布 / 判据类型）、逐 AC 判定方式标注齐备、写集表的每一处重叠都有具名先后写者且全图无环、同字节存件次数对照、两处运行时改动的针对性验证输出。

## 来源与决策映射

| 来源 ID | 决定 ID | FR / AC ID | 状态 / 受影响范围 | 未决 / 交接 |
| --- | --- | --- | --- | --- |
| `R-001` | `D-012 / D-029` | `FR-ENTRY-001 / FR-SPLIT-001..003 / FR-BOUNDARY-001..002 / AC-001..004, AC-009` | `current；入口、分解、材料分界` | `AC-003/004 由干跑重演判定` |
| `R-002` | `D-016 / D-017 / D-030` | `FR-CLOSURE-001..002 / FR-TRUTH-001..003 / AC-005..007` | `current；Phase 闭环与审查真实性` | `审查 provider 覆盖事实保持 undetermined` |
| `R-003` | `D-019..D-023 / D-027 / D-028` | `FR-EVIDENCE-001..003 / FR-STOP-001..002 / AC-008, AC-011` | `current；证据减法与停机` | `两处运行时改动需针对性验证（AC-014）` |
| `R-004` | `D-005` | 约束（非目标） | `current；PaperBuilder CARD-05 只读` | `本任务不改病例任何字节` |
| `R-005` | `U-001` | 执行方式约束 | `current；本任务自身执行纪律` | `方向/细节审查各一次已执行` |
| `R-006` | `U-001` | 执行方式约束 | `current；Talk/grill 口径` | `已完成，本阶段不复述` |
| `R-007` | `U-001` | 约束（改造对象） | `current；workflowhub 自身` | `已落定` |
| `R-008` | `D-012 / U-002` | `FR-SPLIT-001..003 / AC-003, AC-004` | `current；切分与写集规则` | `写集表 3 行定序修正见第 10 节` |
| `R-009` | `U-002 / D-017 / D-018` | `FR-CLOSURE-001..003 / AC-005, AC-006, AC-015` | `current；Phase 闭环与提交` | `干跑重演逐条核四件事` |
| `R-010` | `D-008 / D-007` | `FR-PREDECESSOR-001 / AC-013` | `current；前作 29 条 AC 分类` | `产物已在本阶段产出（见第 9 节）` |
| `U-003` | `D-029` | 任务类型 | `current；普通任务` | `不预先分批，Phase 由本阶段决定` |

每条 FR/AC 都能回到本表；范围修订只追加受影响映射与修订说明，不另建需求账本。

## 1. 需求解释：问题与紧迫性

本仓的规则几乎只约束「诚实」——不假绿、不丢来源、不自审——**没有一条约束「规模」**。病例（PaperBuilder CARD-05，本任务全程只读）因此出现：入口规模分诊从未执行；Phase 边界由物理文件唯一所有权而非交付单元决定（22 稿硬切成 27 个 Phase，最长依赖链 10 层）；端到端判据被押在依赖链末端（P25 背 14 条 AC 只跑 2 个 node，P26/P27 的 `gate_cmd` 为 N/A）；证据只增不减（1735 件证据中 146 件与工作树逐字节相同，213 件只有两种内容）；外部不可用（需人在场/权限）被重复采集 43 次而不停机；唯一进度游标 32 小时一步未动。机器满负荷 50+ 小时仍在返工。

这些事实的诊断权重（**具名推断，非实测结论**）：计划分解依据 ≈45%、入口规模分诊缺失 ≈25%、证据/审查无收敛 ≈20%、执行效率 ≈10%。所以本任务的重点是**方法层与两处被授权的运行时行为**，不是执行者态度。

## 2. 背景、目标与范围

### 背景

- 现行 post 材料形态：`make-decision` 写 `decision-log.md`；`build-plan` 写 `spec.md`、独立 `phases/P<n>.md`、纯指针 `phases/index.md`。
- 现行唯一机器消费者：`runtime/stage/stage-content-contracts.mjs` 的 `validatePostPhaseContract`，其唯一运行时调用点在 `tools/cli/stage-runtime.mjs:539`；写集是真实闸门（`:544` 用「声明写集 ∩ 真实 diff」窄化审查包）。
- 现行「唯一所有权」条款：`skills/spec-plan/SKILL.md:41`（`each implementation path has one Phase owner`）与 `skills/spec-plan/templates/phase-template.md:35`（「每个路径全任务只有一个所有者」）。
- 现行豁免机制：`runtime/stage/stage-content-contracts.mjs:393` 的 `serializedPair` 已允许「后写 Phase 是先写者依赖后代」的重复写集；治理文件白名单在 `:172-173`（见 ADR-0036）。
- 现行 OCR 口径：ADR-0035 已删除替代执行者，CONSTITUTION 升至 1.9.3；`runtime/review/ocr-delegation-adapter.mjs:291` 逐字写明未使用替代执行者。
- 本任务自身产出的材料（`decision-log.md`、`GLOSSARY.md` 三条术语、两份 ADR）已在 make-decision 阶段落盘但**尚未提交**（见第 9 节前置事实）。

### 目标

- 入口处「承诺了几个独立可交付验收单元」与「是否含需用户在场或真实凭证的动作」成为可见事实，而不是只在散文里存在。
- Phase 边界由可独立交付验收的单元决定；写集只是申报；粒度规则同时给出「何时应当拆」与「何时应当并」。
- 每个 Phase 自带判据、档位、提交；未达成时用「带欠账完成」显著标注而不是写成 pass。
- 同一事实（字节相同）复用引用而不是再写一份；证明范围只写路径 + hash。
- 外部不可重试失败零重试、立即升级并给可直接回复的选项；同一不可用事实不重复采集；时间不构成停止条件。
- 决策材料只留方向与决定；实现设计归 spec 与 Phase 卡。
- 审查「真的出了结论」有可核的三条件；记录身份不得混淆。
- **全局边界**：不新增门禁、数字阈值、校验器或账本（AC-012）。

### 范围内

- 上表 `R-001 / R-002 / R-003 / R-008 / R-009 / R-010` 六个来源与 `U-001..U-003` 三项变更，落在 `decision-log.md` 的 23 行写集表所辖文件。
- 本任务自身按标准 WorkflowHub 走完五阶段、不跳阶段。

### 非目标

- 不改 `CONSTITUTION.md` 一个字（D-027）。
- 不改动正在运行的 PaperBuilder CARD-05 任务的任何字节（R-004）；不改历史只读材料。
- 不新增第二进度权威、门禁、数字阈值、校验器或账本。
- 不缩减审查并发或轮次，不按任何时长停止审查。
- 不重开前作 `specs/archive/workflowhub-card05-stage-defect-audit-20261012` 的 19+3 块与已改文件（D-005）。
- 不复述 make-decision 已完成的 Talk/Grill，不重新决定方向。

## 3. 用户场景与状态覆盖

### SCN-001：新任务入口的规模分诊真的执行

- **角色**：跑 make-decision 的主会话（执行者）。
- **前提**：任务类型为普通任务且有实际执行目标（现行义务前提已成立）。
- **触发**：走到 make-decision 第 8 步（粗粒度确认）之前的入口评估义务。
- **结果**：调用既有评估函数并留下调用命令与返回原件；「独立可交付验收单元数」「是否含需用户在场或真实凭证的动作」两项事实写入一条既有四字段决定；第 8 步与第 13 步的展示都包含这两项事实及其范围声明；返回 `paused` 时同时给出至少一条可选拆分路线。
- **回写**：AC-001 / AC-002 的判定与本节同步。

### SCN-002：Phase 边界由交付单元决定，写集只作申报

- **角色**：build-plan 作者（本任务自己即为实例）。
- **前提**：`spec.md` 与 `phases/P<n>.md` 已写出。
- **触发**：核对每个 Phase 的边界依据。
- **结果**：每个边界能用「可独立交付验收的单元」逐条解释；跨批次写同一路径的每一处都有具名先写者/后写者与依据；整张写集表的先后关系无环；粒度规则同时含拆与并两半。
- **回写**：AC-003 / AC-004。

### SCN-003：承接 AC 未达成时的 Phase 完成形态

- **角色**：build-code Phase 执行者与独立审查者。
- **前提**：某 Phase 已按自身范围收口，但其承接的 AC 仍未达成。
- **触发**：写该 Phase 的完成结论。
- **结果**：契约头显著标「带欠账完成」，逐条列未达成项、所需条件与具名 owner，且不写 pass。
- **回写**：AC-006。

### SCN-004：外部不可重试失败与同一不可用事实

- **角色**：任何阶段的执行者。
- **前提**：外部依赖给出不可重试失败（许可/授权被拒、权限不足、密钥或登录失效、输入非法、真实资源或真环境不存在）。
- **触发**：第一次观察到该失败。
- **结果**：零重试；按 `AGENTS.md` 既有格式写出「卡在哪、为什么、几条路、代价与风险、可直接回复的选项」；同一失败信号在继续条件未改变时再次出现，不再原地重试（换独立上下文重开一次，仍出现则升级问人）。审查 provider 不可用/失败/超时/取消/无效输出/零成功路/空 findings **不属于**本停机范围，仍按 wh-review 与 `docs/standard-workflow.md` 既有口径处理。
- **回写**：AC-011。

### SCN-005：同一事实不重复存件

- **角色**：执行命令并留证的执行者、审查记录生产者。
- **前提**：同一命令再次产出结果，或同一 provider 再次产生输出；存在可回读的既有原件。
- **触发**：保存证据或 provider 输出。
- **结果**：捕获层仅在命令逐字相同、既有 ref 存在且逐字节比较确立内容相等时复用并写引用；审查输出层仅在同一 provider 内确立字节相等时复用，不跨 provider 去重。字节数相同本身不能证明相等；未做内容比较或无法确立内容相等时保留新件并记 `deduplication: unknown`，不得把该缺口当作复用依据。证明范围只写路径 + hash（三类例外除外）。
- **回写**：AC-008。

### SCN-006：写 Phase 卡时坐标不再当契约

- **角色**：build-plan 作者与本任务自身。
- **前提**：Phase 卡契约头与卡片字段已写出。
- **触发**：核对契约面写法。
- **结果**：契约性字段（写入集、符号、覆盖 AC、Done）只写路径与符号；行号只出现在导航性字段（动手前必读、材料导航、可观察接缝）并被声明为生成时刻提示、漂移不判卡失效；decision-log 不再新增长度、阈值或字段级方案。
- **回写**：AC-009。

### 状态覆盖清单

- [x] **默认态**：SCN-002；本任务自身的 8 个 Phase 与纯指针索引即默认产出。
- [x] **空态**：SCN-001；入口事实缺材料时只写缺口并记 `unassessed` + owner，不空填。
- [x] **错误态**：SCN-003（承接 AC 未达成）、SCN-004（不可重试失败）。
- [x] **加载态**：N/A — 本任务无异步加载视图，只有命令执行与材料读取。
- [x] **取消态**：SCN-004 的复位口径；用户给新答复即复位，时间不构成复位条件。
- [x] **边界态**：SCN-005（同字节 / 字节数相同但内容未知两种边界）。
- [x] **权限态**：SCN-004 的适用范围第 1 行（许可/授权被拒、权限不足、密钥失效）明确在停机范围内；审查 provider 不可用被明确排除。
- [x] **竞态**：SCN-002；同一并行批次内同路径互斥，跨批次靠依赖边定序；无共享写者的并发写不在本任务范围。

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：入口评估函数 `evaluateMiniTaskScope` 现役只有测试在调用，无生产消费者。
  - **状态**：`verified`
  - **证据或来源**：`decision-log.md` M1 收敛段（`skills/mini-task/scripts/mini-task-runner.mjs:91-129`，纯内存函数）；本阶段由 BP-R1 勘察复读（见第 9 节原件）。
  - **负责人、影响**：M1 实施者；决定 M1 的方案是「让已生效的义务真的被执行」而非新增评估。
  - **关联**：FR-ENTRY-001、AC-001、AC-002、RISK-01。

- **PFACT-002**：`serializedPair` 已容忍依赖祖先—后代关系的重复写集，且治理文件白名单存在。
  - **状态**：`verified`
  - **证据或来源**：`runtime/stage/stage-content-contracts.mjs:393`、`:172-173`、`:438-444`；ADR-0036。本阶段由 BP-R2 复读。
  - **负责人、影响**：M2 实施者；决定 M2 的 R3 是「引用既有机制」而不是新增豁免种类。
  - **关联**：FR-SPLIT-002、AC-004、RISK-02。

- **PFACT-003**：写集是真实闸门：审查包 = 声明写集 ∩ 真实 diff。
  - **状态**：`verified`
  - **证据或来源**：`tools/cli/stage-runtime.mjs:539`、`:541-543`、`:544`。本阶段由 BP-R2 复读。
  - **负责人、影响**：全体实施者；决定 Phase 声明的写集不实会直接改变审查覆盖面。
  - **关联**：FR-SPLIT-002、AC-004、AC-005。

- **PFACT-004**：OCR 替代执行者已被 ADR-0035 删除，病例的审查记录**未违反**记录身份口径（原指控系把规则条文当现场事实）。
  - **状态**：`verified`
  - **证据或来源**：`docs/adr/0035-…`、`runtime/review/ocr-delegation-adapter.mjs:291`、`case-diagnosis/V2-ocr-identity.md`。
  - **负责人、影响**：M7 实施者；决定 M7 不得重提「删除替代执行者」，其范围收窄为三项。
  - **关联**：FR-TRUTH-001..003、AC-007、RISK-03。

- **PFACT-005**：现行审查回执中**没有任何 provider 报告已读确认**（`material_coverage` 全为 `undetermined`）；方向审查为 `available-with-failures`，不是通过。
  - **状态**：`verified`
  - **证据或来源**：`quality/reviews/2026-10-14-007-…direction.json`、`…-014-…detail.json`（任务库）。
  - **负责人、影响**：M7 实施者与全体验收读者；覆盖事实不得被写成 read 或通过。
  - **关联**：FR-TRUTH-001、AC-007。

- **PFACT-006**：`GLOSSARY.md` 三条术语、`docs/adr/0038`、`docs/adr/0039` 已在 make-decision 阶段落盘，**尚未提交**。
  - **状态**：`verified`
  - **证据或来源**：`git status --porcelain`：` M GLOSSARY.md`；`?? docs/adr/0038-…`、`?? docs/adr/0039-…`；`?? specs/design-execution-efficiency-20261014/`。
  - **负责人、影响**：P1 实施者；这些字节必须被某个 Phase 的真实提交带走（AC-015），否则会留在未提交状态。
  - **关联**：FR-CLOSURE-003、AC-015、RISK-04。

- **PFACT-007**：`evaluateMiniTaskScope` 返回 `paused` 时的缓解路径在现行方法里没有落点。
  - **状态**：`unknown`
  - **证据或来源**：现行 `workflows/make-decision/SKILL.md` 第 30 行只有「建议与真实路线选择写进原日志」一句；未见拆分路线的展示位。
  - **负责人、影响**：M1 实施者；D-015 要求 `paused` 时同时给出可选拆分路线，落点未核实。
  - **关联**：FR-ENTRY-001、AC-001、OPEN-01。

## 5. 功能需求

### 入口代价浮现（ENTRY）

入口处调用既有的规模评估函数，并把评估真实返回与两项代价事实交给现有的人类边界（第 8 步粗粒度确认、第 13 步方向确认）。不新增要求、不设阈值、不阻断推进。

- **FR-ENTRY-001**：`make-decision` 的入口评估义务必须变成对既有函数的实际调用，并把真实返回（`status` / `reason` / `expanded_risks` / `choices`）连同「承诺的独立可交付验收单元数」「是否含需用户在场或真实凭证的动作」记入「工作包与决定」节的一条既有四字段决定；返回 `paused` 时必须同时给出至少一条可选拆分路线，关联 PFACT-001、PFACT-007、SCN-001、AC-001、AC-002
  - **范围边界**：包括调用记录、四字段决定、第 8 步与第 13 步的展示；不新增节、步骤、字段、门禁或校验器，不改 `high_risk_fact` 的 basis 枚举。
  - **依据**：D-014、D-015、module-design/M1.md。
  - **场景**：SCN-001
  - **验收**：AC-001、AC-002

### 分解依据与写集申报（SPLIT）

Phase 边界由「可独立交付验收的单元」决定；写集是申报结果；粒度规则同时给出拆与并两半。

- **FR-SPLIT-001**：Phase 边界必须能由「可独立交付验收的单元」逐条解释，不得由文件所有权或技术层决定；`phase-template.md:12`「判定规则」必须补上「何时应当并」的另一半（共享同一条判据 / 判定必须看到对方产出 / 必须一起交给同一真实消费者 / 拆开后各自无外部可观察变化，任一成立即应当并），关联 PFACT-002、SCN-002、AC-003
  - **范围边界**：改方法文本与模板，不改 `phase-template.md:12` 的三问与「一个并且就拆」判据，不改 `tests/contract/` 依赖的示例块与 G-2 小节标题。
  - **依据**：D-012、ADR-0038、module-design/M2.md。
  - **场景**：SCN-002
  - **验收**：AC-003

- **FR-SPLIT-002**：写集必须是申报结果而不是切分依据；同一并行批次内同路径互斥；跨批次可写同一路径但须有真实依赖边定序；重叠路径必须在该 Phase 边界处点名先写者、后写者与依据；整张写集表的先后关系必须无环，关联 PFACT-002、PFACT-003、SCN-002、AC-004
  - **范围边界**：包括写集表形态、索引一致性、`serializedPair` 既有机制的引用；不新增运行时豁免种类，不改 `stage-content-contracts.mjs` 的校验规则，不给 `specs/` 加新对象。
  - **依据**：D-012、D-013、ADR-0036、ADR-0038、module-design/M2.md。
  - **场景**：SCN-002
  - **验收**：AC-004

- **FR-SPLIT-003**：切分依据的改动必须同时落到消费它的方法文本（`spec-plan` 方法、`build-plan` 方法、合并审查合同、`plan-eng-review` lens），保证下游读到的是同一口径，关联 SCN-002、AC-003、AC-004
  - **范围边界**：四处既有条款的文字同步；不新增审查轮次、字段或必填门。
  - **依据**：D-012、module-design/M2.md。
  - **场景**：SCN-002
  - **验收**：AC-003、AC-004

### 每 Phase 闭环与判据位置（CLOSURE）

完成判据从「全任务承诺」降回「本 Phase 事实」；需真实环境或用户在场的判据不推到依赖链末端首次产生。

- **FR-CLOSURE-001**：Phase 契约头的 `Done` 必须逐条承接 AC（编号 + 现成 8 值档位 + 具名证据指针），并写「本 Phase 自带判据小结」（自己验了什么 / 没验什么 / 未验项所需条件 + 具名 owner）；未参与该 AC 判定的 Phase 不得为该条写 pass，下游不得替上游补签，关联 SCN-003、AC-005、AC-006
  - **范围边界**：改 `phase-template.md` 判据面与 `build-code` / `verify-code` 方法文本；不新增档位词表（沿用 `runtime/evidence/acceptance-evidence-validator.mjs:6` 的 8 值）。
  - **依据**：D-017、D-018、module-design/M3M7.md。
  - **场景**：SCN-003
  - **验收**：AC-005、AC-006

- **FR-CLOSURE-002**：承接 AC 未达成时允许「带欠账完成」，但必须在 Phase 契约头显著位置标注并逐条列出未达成项、所需条件与具名 owner，永不写成 pass，关联 D-017、SCN-003、AC-006
  - **范围边界**：只定义完成形态与标注义务；不新增机器字段（`带欠账完成` 当前无机器读取点），不阻断收口。
  - **依据**：D-017、module-design/M3M7.md。
  - **场景**：SCN-003
  - **验收**：AC-006

- **FR-CLOSURE-003**：每个 Phase 必须自带开发、测试、独立审查与提交，且提交发生在该 Phase 独立审查之后、Phase 收口时；末 Phase 保留完整端到端串演但不得成为任何 AC 的首次结论产生点，关联 SCN-002、SCN-003、AC-015
  - **范围边界**：提交纪律与验收 Phase 角色；不新增 stage、gate 或审查点，不改变现有授权来源。
  - **依据**：D-018、U-002/R-009、module-design/M3M7.md。
  - **场景**：SCN-002
  - **验收**：AC-015

### 停机与升级（STOP）

- **FR-STOP-001**：外部不可重试失败必须零重试并立即升级问人，按既有格式给出可直接回复的选项；适用范围与排除项必须写成两行（适用范围：许可或授权被拒绝、权限不足、密钥或登录失效、输入非法、真实资源或真环境不存在；排除：审查 provider 不可用、失败、超时、取消、无效输出、零成功路或空 findings），关联 SCN-004、AC-011
  - **范围边界**：只改 `AGENTS.md:41` 之后的适用范围与排除两行，以及 `standard-workflow.md` 的「stage 结束」段；不动 `CONSTITUTION.md`，不缩减审查并发或轮次。
  - **依据**：D-027、D-028、module-design/M4.md。
  - **场景**：SCN-004
  - **验收**：AC-011

- **FR-STOP-002**：反馈路径必须有界：只认「改变继续条件」的事实为新事实；同一失败信号在继续条件未改变时再次出现即判该路径无界，换独立上下文重开一次，仍出现则升级问人；时长永不构成停止或复位条件，关联 SCN-004、AC-011
  - **范围边界**：触发判据与复位条件归本模块；「不再产出同一 unavailable 采集件」归证据减法模块，避免重复写。
  - **依据**：D-028、D-027、module-design/M4.md。
  - **场景**：SCN-004
  - **验收**：AC-011

### 证据减法（EVIDENCE）

- **FR-EVIDENCE-001**：同一事实（字节相同）必须复用既有件并写引用，不得再新写一份；无法确立内容相等时保留新件并记 `deduplication: unknown`（失败安全），关联 SCN-005、AC-008
  - **范围边界**：改 `AGENTS.md` 证据硬规则、`standard-workflow.md`「证据只留原始件」段、`build-code` / `verify-code` 方法文本；`safe-write.mjs` 与 `task-store.mjs` 零改动。
  - **依据**：D-021、D-022、module-design/M5.md。
  - **场景**：SCN-005
  - **验收**：AC-008

- **FR-EVIDENCE-002**：证明范围只写路径 + hash，字节留在工作树；例外仅三类（该文件随后会被改动或删除、外部服务返回体、一次性环境读数），关联 SCN-005、AC-008
  - **范围边界**：三类例外必须逐条写明；不加校验器，不做历史清账（历史 515MB 本轮不清）。
  - **依据**：D-021、ADR-0039、module-design/M5.md。
  - **场景**：SCN-005
  - **验收**：AC-008

- **FR-EVIDENCE-003**：捕获层与审查输出层必须落实复用：`tools/cli/stage-runtime.mjs` 已接收但被弃用的 `receipt_ref` / `output_ref` 复用支路必须落实；`runtime/review/review-record-route.mjs` 的同内容 provider 输出（`:87` 与 `:119-127`）必须去重；复用事实按落点分别写进**既有**字段：**捕获层**（`tools/cli/stage-runtime.mjs` 的 `capture-tests`，落 stage 行）写进 stage 行的 `source` 与 `evidence`；**审查输出层**（`runtime/review/review-record-route.mjs`，落 review 记录）写进 review 记录既有的 `discarded_facts`。依据 `runtime/task/task-store.mjs` 的 `STAGE_ROW_KEYS`：stage 行**没有** `discarded_facts` 键（多写未知键会被拒绝），该键只存在于 review 记录；**上游 `decision-log.md` 的 D-022 把两处落点混写，本任务如实登记并用真实 schema 修正，不改写上游字节**，关联 PFACT-003、SCN-005、AC-008、AC-014
  - **范围边界**：只改捕获与审查两处行为及既有落点；D-032 追加授权 `runtime/interface/run-command.mjs` 的私有发布前输出结算接口，由 P5/T014 承接；不减少任何 provider、轮次或并发，不新增字段/账本/控制面，不改 `safe-write.mjs`、`task-store.mjs`。
  - **依据**：D-019、D-022、D-023、module-design/M5.md。
  - **场景**：SCN-005
  - **验收**：AC-008、AC-014

### 决策与实现分界（BOUNDARY）

- **FR-BOUNDARY-001**：`decision-log.md` 只留方向与决定；坐标、阈值与字段级方案下移到 `spec.md` 的代码锚点与 Phase 卡；`make-decision` 第 9 步补粒度限定而不删义务，关联 SCN-006、AC-009
  - **范围边界**：改 `make-decision` 第 9 步、`decision-log` 的「内容边界」与模板示例、`spec-specify` / `spec-plan` 模板承接位；不改已确认的既有 decision-log 字节（只读），不新增第二决策日志。
  - **依据**：D-026、module-design/M6.md。
  - **场景**：SCN-006
  - **验收**：AC-009

- **FR-BOUNDARY-002**：契约面只写符号名 + 行为语义；「改动」字段的精确路径不含行号；行号降级为「生成时刻导航提示、不作契约、漂移不判卡失效」，关联 SCN-006、AC-009
  - **范围边界**：口径统一写在 `phase-template.md` 的字段说明表，不逐卡行内括注；不改 `tests/contract/` 依赖的字段标签与示例块。
  - **依据**：D-026、module-design/M6.md。
  - **场景**：SCN-006
  - **验收**：AC-009

- **FR-BOUNDARY-003**：TCR 边界必须钉死为「按名改已点名的具名常量不触发；改断言/期望方向/评分逻辑仍触发」；冻结 oracle 的「单一来源」按每任务声明一次；`test-asset-governance-rules` 同步为这一边界，关联 SCN-006、AC-010
  - **范围边界**：复用相位卡既有「测试变更请求」字段 + 一份独立审查原件，不新增 schema 或账本。
  - **依据**：D-024、D-025、module-design/M6.md。
  - **场景**：SCN-006
  - **验收**：AC-010

### 审查真实性（TRUTH）

- **FR-TRUTH-001**：审查「真的出了结论」= 三条件同时成立（至少一路真实 `completed && parse_outcome === "ok"` + 有原始件引用 + 未确认项 `undetermined` 与 `discarded_facts` 并存）；`read_confirmed` 未证保持 `null`；不可证一律进 `undetermined` 不进 `read`，关联 PFACT-004、PFACT-005、AC-007
  - **范围边界**：零新增字段；改 `skills/wh-review/SKILL.md` 与两份审查合同；不改历史 review 原件。
  - **依据**：D-016、D-030、module-design/M3M7.md。
  - **场景**：SCN-004 的排除项
  - **验收**：AC-007

- **FR-TRUTH-002**：OCR 不可用时必须四件齐（检测输出 / 原始失败 / 实际执行者 / 覆盖限制）；冻结 8 个禁止自造字段（含 `review_origin`）；`material_coverage` 三键语义固定，关联 PFACT-004、PFACT-005、AC-007
  - **范围边界**：不换执行者、不重提删除替代执行者（ADR-0035 已做）。
  - **依据**：D-016、D-030、module-design/M3M7.md。
  - **场景**：SCN-004 的排除项
  - **验收**：AC-007

- **FR-TRUTH-003**：记录身份不得混淆（schema 版本 ≠ 执行者声明；不得以 OCR 身份记 wh-review 结果）；审查面锚定「本 Phase diff + 本 Phase 承接的 AC」，关联 PFACT-003、PFACT-004、AC-007、AC-014
  - **范围边界**：`runtime/review/review-record-route.mjs` 的记录身份口径；不新增字段，不改 review 文件命名算法。
  - **依据**：D-016、D-030、ADR-0035、module-design/M3M7.md。
  - **场景**：SCN-004 的排除项
  - **验收**：AC-007、AC-014

### 前作未闭合判据与全局边界（PREDECESSOR / GUARD）

- **FR-PREDECESSOR-001**：前作 29 条未闭合 AC 必须逐条分类（可由规划/材料判定关闭 / 须真实运行保持 open），并给出判据、产物位置与具名 owner，关联 SCN-002、AC-013
  - **范围边界**：只产出分类清单与判据，不重开前作材料、不改前作任何字节。
  - **依据**：D-008、R-010、AC-013。
  - **场景**：SCN-002
  - **验收**：AC-013

- **FR-GUARD-001**：本次改动不得引入门禁、数字阈值、校验器或账本；diff 逐处核对，未新增任何一类，关联 AC-012
  - **范围边界**：全局边界，适用于全部 Phase 与全部文件。
  - **依据**：D-004、D-006、D-013、AC-012。
  - **场景**：SCN-002
  - **验收**：AC-012

## 6. 模块划分

- **入口代价浮现**：把既有评估义务变成有消费者的入口事实。对外提供：调用记录 + 两项代价事实 + 真实返回。依赖谁：既有 `evaluateMiniTaskScope`、既有第 8/13 步确认边界。测试边界：调用可回读、缺材料时留具名缺口。
- **分解依据与写集申报**：把 Phase 边界与写集的关系倒过来。对外提供：可解释的边界 + 无环的定序写集表 + 双向粒度规则。依赖谁：既有模板、既有 `serializedPair`、既有合并审查。测试边界：校验器真实输出 + 干跑重演对照表。
- **每 Phase 闭环**：把完成判据降回本 Phase 事实。对外提供：`Done` 逐条档位 + 带欠账完成形态 + 每 Phase 提交。依赖谁：既有 8 值档位词表、既有独立审查点。测试边界：逐条对照记录（按 AC 身份与归属映射）。
- **停机与升级**：给不可重试失败与无界反馈路径一个终止条件。对外提供：适用范围 + 排除 + 零重试升级 + 复位口径。依赖谁：既有 `AGENTS.md` 格式与 wh-review 口径。测试边界：受控不可重试失败场景的处置记录。
- **证据减法**：让「同一事实只留一份」有可执行语义。对外提供：同字节复用判据 + 路径/hash 证明范围 + 两处运行时复用。依赖谁：捕获层既有 stage 行 `source` / `evidence`，审查输出层既有 review 记录 `discarded_facts`，以及既有 `receipt_ref` / `output_ref` 参数。测试边界：sha256 全族比对与存件次数对照 + 针对性运行时验证。
- **决策与实现分界**：把实现设计从决策材料里移出去。对外提供：材料分工口径 + 契约面写法 + TCR 边界。依赖谁：既有 decision-log 节结构、既有相位卡字段。测试边界：材料对照 + 干跑重演的分界判定。
- **审查真实性**：让「出了结论」可核。对外提供：三条件 + 四件齐 + 冻结字段 + 记录身份口径。依赖谁：既有 review 回执形态、既有 OCR 口径。测试边界：review 原件字段核对。
- **终末验收**：唯一末 Phase，逐条复核全部 15 条 AC 并补未闭环 case。对外提供：逐条结论 + 五类执行事实 + 六项结论。依赖谁：前七个 Phase 的原件。

## 7. 关键实体

- **入口代价事实**：
  - **定义**：入口处交给人类边界的四项内容 —— 评估函数真实返回、承诺的独立可交付验收单元数、是否含需用户在场或真实凭证的动作、以及（`paused` 时）可选拆分路线。
  - **字段和约束**：作为一条既有四字段决定的取值写入「工作包与决定」节；缺来源必须写 `unassessed` + 具名 owner，不得空填；不新增字段。
  - **关系**：一条入口决定对应一个 make-decision 任务；被第 8 步与第 13 步的展示消费。
- **定序写集表**：
  - **定义**：本任务 23 个文件各自「谁先落、谁后落」的先后表，先后依据是该文件的条款依赖关系。
  - **字段和约束**：每行给出精确路径、定序写主、各自改什么、所属工作包与决定编号；同一并行批次内同路径互斥；跨批次重叠必须有真实依赖边；全图无环。
  - **关系**：与 `phases/index.md` 的写入集列逐条一致，与每个 Phase 契约头的写入集一致。
- **Phase 卡**：
  - **定义**：一个可独立交付验收单元的完整实施卡（契约头 + 工作包声明 + 速读卡 + 材料导航 + L0/L1/L2 + 卡片）。
  - **字段和约束**：契约头必填 `Global spec` / `Write set` / `Dependency` / `Consumer` / `gate_cmd` / `oracle` / `evidence_path` / `STOP` / `覆盖 AC` / `Done`；卡片 17 个字段由 `runtime/stage/stage-content-contracts.mjs:481-486` 机器读取。
  - **关系**：被 `validatePostPhaseContract` 校验；被 `phases/index.md` 纯指针引用；被 build-code 逐 Phase 消费。
- **审查结论三条件**：
  - **定义**：「有结论」的成立条件集合。
  - **字段和约束**：至少一路真实 `completed && parse_outcome === "ok"`；有原始件引用；未确认项（`undetermined` + `discarded_facts`）并存。零新增字段。
  - **关系**：决定 Phase 的审查面能否记为已出结论；不决定 AC 是否通过。

## 8. 数据和生命周期

- **数据粒度**：一次入口评估 = 一条入口决定；一个 Phase = 一份 Phase 卡 + 一组 Task 卡；一次审查 = 一份 review 原件；一次命令 = 一份证据原件（或一次复用引用）。
- **数据时效**：材料以当前字节为准；行号只作生成时刻导航，漂移不判卡失效；phase_progress 游标只定位续跑位置，不证明完成。
- **缺失或迟到**：入口材料缺 → 只写缺口 + `unassessed` + owner；证据取不到 → `unavailable`；审查未确认 → `undetermined` / `read_confirmed: null`；复用内容相等无法确立 → 保留新件 + `deduplication: unknown`。
- **预览与正式**：干跑重演是对照事实，不是执行结果；本任务自身的真实执行结果是 build-code / verify-code 的事实。
- **当前与历史**：历史 review / evidence / specs 只读保留，不重写、不复制镜像；历史 515MB 证据本轮**不清账**。
- **归属与清理**：证据原件的 owner 是产出它的 Phase；复用只写引用不改原件；删件前的两问只读自证（有无 ref 指向它 / 其字节是否在未被改动的工作树里逐字节存在），答不上来一律按唯一原件保留。

## 9. 兼容性预留

- **既有消费方**：`validatePostPhaseContract` 的两套字段别名、`phases/index.md` 的 6 列、`tests/contract/post-build-plan-missing-index.test.mjs` 与 `tests/contract/card05-author-material-consumer.test.mjs` 依赖的 `phase-template.md` 示例块与 G-2 小节、`workflows/<stage>/steps.json` 的 `observable_result` 消费方 `runtime/task/portable-workflow-run.mjs:33`。
- **命名预留**：沿用既有字段名与 8 值档位词表；不新增公共命令、schema 或持久对象。
- **容器预留**：N/A — 不新增持久化容器；复用任务库既有 `task.json` / `facts.jsonl` / `quality/` 结构。
- **状态预留**：保留既有的 unknown / unavailable / incomplete / undetermined 语义，不新增状态机。
- **扩展边界**：本期只改上表所辖方法与两处运行时行为；不承诺历史清账、不承诺把写集互斥变成机器强制（D-013）。
- **前置事实（prefactor）**：`GLOSSARY.md` 的三条术语、`docs/adr/0038`、`docs/adr/0039` 已在 make-decision 阶段落盘且**未提交**（PFACT-006）。它们不再是下游 Phase 的写集成员，但必须由本任务的第一个 Phase 通过一次真实提交带走，避免留在未提交状态。

## 10. 明确不做与默认必须成立

### 明确不做

- 不改 `CONSTITUTION.md`（D-027）；不改病例 PaperBuilder CARD-05 任何字节（R-004）。
- 不新增门禁、数字阈值、校验器、账本、第二进度权威。
- 不缩减审查并发或轮次，不按任何时长停止审查，不用 timeout 停审查。
- 不做历史证据清账（历史 515MB / 5954 文件），本轮只改未来行为。
- 不改 `runtime/interface/safe-write.mjs`、`runtime/task/task-store.mjs`、`runtime/stage/stage-content-contracts.mjs` 的行为。
- 不重开前作 19+3 块与已归档前作材料；不重写历史只读材料。
- 不把「写集互斥」变成机器强制（D-013）；不新增运行时豁免种类。
- 不为本任务另建方向 Talk / 第二决策日志；不复述 make-decision 已完成的对话。

### 默认必须成立

- 材料、实施、测试、独立审查与 Git 交付分别报告；质量缺失保持 `unknown` / `unavailable` / `incomplete`，不伪造通过。
- 所有真实 finding（含普通 finding）都要有 `fixed`、`rejected_invalid`、`accepted_risk` 或 `needs_human` 处置及理由；关联 FR-TRUTH-001。
- 原始失败、来源与 provenance 保留单份，不被摘要覆盖；关联 FR-EVIDENCE-001。
- 审查 provider 不可用不改写为质量通过，也不触发外部停机；关联 FR-STOP-001、FR-TRUTH-002。
- 本任务自身的写集表 3 行定序修正必须登记为事实（见第 11 节 OPEN-02），不得静默改写上游已确认材料。

## 验收流程

从当前 `decision-log.md` 的 `## 验收面` 交接索引取可观察接口与成功/失败边界，再从本节场景入口依次定位 FR、`Appendix A` 的同号 AC、所属 Phase 的命令与可回读证据；按 decision-log「外置事实索引」的到达条件读唯一原 ref。本节只描述流程，不复制 AC 的通过或失败判据。

## 测试标准

本任务有两个验收对象：**方法/材料文本**与**两处运行时行为**。

- **方法/材料文本面**：适用。逐面走「具名客观替代」——真实调用既有函数或校验器（`node … evaluateMiniTaskScope` 调用记录、`validatePostPhaseContract` 的真实错误输出、`phases/index.md` 与 Phase 契约头的一致性核对），加独立人读复核语义。G-2 只用于写集全为 `.md` 且明确声明无新增运行行为的 Task；混合交付不整体豁免。
- **运行时行为面**：适用。`tools/cli/stage-runtime.mjs` 的复用支路与 `runtime/review/review-record-route.mjs` 的去重/记录身份按受影响范围做针对性验证（禁全量回归），用配对 oracle 的 RED/GREEN 与真实退出码。
- **浏览器可见面**：不适用 —— 本仓无 `apps/`、无 `.tsx` / `.vue` / `.jsx`，本任务不改任何界面行为；具名理由：改动只落在 Markdown 方法文本、JSON 步骤定义与两处 Node 运行时模块。
- **数据/网络/数据库面**：不适用 —— 本任务不新增持久化、网络调用或数据库访问；运行时改动只涉及本地文件存件与去重。
- 每个要测的面与覆盖 AC 指向该 Phase 的一条可执行命令，保配对 oracle；精确命令留给各 Phase，全局验证策略见「实现设计」节，`Appendix A` 只指同一 oracle 与预期证据。

### 基线既有失败（实测事实，必须与本任务造成的失败分开报告）

在 **HEAD `b66c1348` 且目标仓库文件尚未被本任务修改**的工作树上逐条单跑（原件：任务库 `quality/evidence/build-plan-refs/BP-R6-baseline-gate-measurement.md`）：

- **基线绿（exit 0，可作门禁）**：`tests/contract/task-topology-projection`（9/9）、`tests/contract/post-build-plan-missing-index`（86/86）、`tests/contract/card05-author-material-consumer`（7/7）、`tests/review/review-record-route`（25/25）、`tests/contract/stage-evidence-contract`（2/2）、`tests/contract/narrow-tool-safe-write`（9/9）、`tests/contract/verify-architect-acceptance`（7/7）、`tests/contract/ocr-review-contract-bundle`（20/20）、`tests/integration/mini-task-delivery`（5/5），以及 `node tools/cli/verify-structure.mjs`（exit 0）。
- **基线红（exit 1，不得作门禁，只作事实记录）**：`tests/contract/runtime-facade`（2 条失败：`workflows/build-spec/SKILL.md` 在 HEAD 不存在；runner contract 未按断言 reject）；`tests/contract/thin-core-residue`（2 条失败：已删模块以新路径复活）；`tests/contract/ocr-delegation-route`（7 条失败：私有 runner 未被调用、isolated candidate 4 条、direction material allowlist 缺键）。
- **另一条既有不一致（只登记）**：`tests/acceptance/card-03-current.mjs` 的 E13 锚点把 `adverse`／`unavailable` 写成带反引号，而 `docs/standard-workflow.md` 的真实字节不带反引号，该检查在改动前即不匹配。
- **边界**：以上基线红**不在本任务写集内**，本任务**不修**它们（不扩大范围），但每个 Phase 的收口与终末验收**必须逐条区分**「基线既有失败」与「本任务造成的失败」；把基线红计入本任务的失败或反之，都算错误报告。因此本任务各 Phase 的门禁命令只用上列基线绿命令，或本任务材料自洽的校验器调用；变更本身的判据由各 Task 卡的 RED/GREEN 承担。

## 架构边界

区分产品边界与工程边界：产品边界是本节第 5、6 节的功能域与模块职责；工程边界是 `runtime/`（唯一机器消费者 `stage-content-contracts.mjs`）、`tools/cli/`（`stage-runtime.mjs` 的审查包窄化与复用支路）、`skills/`（方法文本与模板）、`workflows/`（五个阶段的方法与步骤定义）、`docs/`（执行纪律与治理）。真实消费者：本仓后续任务的 make-decision / build-plan / build-code / verify-code 主会话，以及 `validatePostPhaseContract` 这一机器读者。兼容责任：不得让现有 contract 测试与既有材料形态失效（见第 9 节）。全局架构方案在下方「实现设计」维护，各 Phase 只承接自身差异。

## 实现设计（全局权威）

> `spec-plan` 在同一份 `spec.md` 内补齐已核实工程事实与方案。本节消费 decision-log，不再决定产品目标。未核实项写 `unknown — owner / impact / next action`，不以猜测填空。**契约性字段只写路径与符号，不写行号**；行号只作生成时刻导航提示，漂移不判卡失效（D-026）。

### 代码锚点

- **来源边界**：`decision-log.md` 与用户逐字需求只作来源映射，不在本节创建第二份需求账本。
- **现状与目标差异**：现状 Phase 边界由「唯一文件所有权」决定（`skills/spec-plan/SKILL.md` 的 `each implementation path has one Phase owner`、`phase-template.md` 的「每个路径全任务只有一个所有者」），目标改为由「可独立交付验收的单元」决定、写集降级为申报；现状证据只增不减（`appendRecord` 的 `acceptIdentical=false` 语义 + 捕获层明文拒绝复用），目标改为同字节复用并写引用。
- **读取顺序**：先读 `runtime/stage/stage-content-contracts.mjs` 的 `validatePostPhaseContract` 与 `serializedPair`（唯一机器消费者与写集重复判定），再读 `tools/cli/stage-runtime.mjs` 的捕获层与审查包窄化，再读 `runtime/review/review-record-route.mjs` 的 `recordSimpleReviewRequest`，最后读 `runtime/interface/safe-write.mjs` 的 `appendRecord`／`createFileOnce` 语义。
- **代码锚点**（符号名，无行号）：
  - `runtime/stage/stage-content-contracts.mjs`：`validatePostPhaseContract`、`isSharedGovernancePath`、`serializedPair`、`readTaskTypeFromDecisionLog`
  - `tools/cli/stage-runtime.mjs`：`stageRuntimeCliMain` 的 `review:record` 与 `verify:execute` 两条行为、`prepareTaskBoundBuildCodeReviewBundle`、`capture-tests` 私有分支
  - `runtime/interface/run-command.mjs`：`captureCommand` 的私有发布前输出结算接口（D-032）；流式采集仍先产生临时 output，结算发生在原始回执发布前；`reserveOutput`、`publishReceipt` 与 create-only 算法只读不改
  - `runtime/interface/safe-write.mjs`：`appendRecord`、`writeFileAtomic`、`createFileOnce`（**只读**，本任务零改动）
  - `runtime/review/review-record-route.mjs`：`recordSimpleReviewRequest`、`providerFact`、`onProviderOutput`、`providerCoverage`
  - `runtime/task/task-store.mjs`：`REVIEW_ORIGINS`、stage 行的 `evidence`／`material_bytes`／`source`（**只读**，本任务零改动）；`discarded_facts` 归 review 记录 schema／producer（**只读**）
  - `skills/mini-task/scripts/mini-task-runner.mjs`：`evaluateMiniTaskScope`（纯内存，现役只有测试调用）
  - `skills/spec-plan/templates/phase-template.md`、`skills/spec-plan/SKILL.md`、`skills/wh-review/SKILL.md` 与两份审查合同、`skills/decision-log/`、`workflows/*/SKILL.md`
- **运行条件**：Node ESM；测试用既有 vitest（`npx vitest run <单个测试文件>`，`package.json` 无逐文件 script）；**禁全量回归**（`AGENTS.md` 测试硬规则）。本任务无 UI、无网络、无数据库。

### 接口与失败语义

- **选择的架构方案**：先复用、再窄扩展。Phase 边界与证据复用都**复用既有机制**（`serializedPair` 的依赖祖先—后代豁免、捕获层既有 stage 行的 `source`／`evidence`、审查输出层既有 review 记录的 `discarded_facts`、既有 `receipt_ref`／`output_ref` 输入标签、既有 review schema 的 `executor` 枚举），**不新增运行时豁免种类、不新增字段、不新增控制面**。
- **模块职责**：方法文本（`workflows/`／`skills/`／`docs/`）决定「谁在什么条件下做什么」；`runtime/stage/stage-content-contracts.mjs` 只报告结构事实（不是推进门）；`runtime/review/review-record-route.mjs` 是审查记录的**单一 producer**；`tools/cli/stage-runtime.mjs` 是捕获与审查包的私有实现入口。四者都不裁决质量。
- **接口与数据流**：
  - 入口：用户在 make-decision 第 8／13 步看到入口事实与范围声明 ← 主会话调用 `evaluateMiniTaskScope` ← 一条既有四字段决定。
  - 计划：`spec.md` + `phases/P<n>.md` + `phases/index.md` → `validatePostPhaseContract`（写集、依赖、消费者、gate_cmd、oracle、卡片字段）→ `stage-runtime.mjs` 用「声明写集 ∩ 真实 diff」窄化审查包。
  - 证据：命令 → `captureCommand` 流式写本次临时 output → 原始回执发布前的私有输出结算接口，唯一调用者为 `stage-runtime.mjs` capture 分支 → 同任务同目录既有原件真实可读、命令与退出事实一致且**内容相等已确立**时，沿 D-031 仅处理本次未对外引用的临时重复 output，选定既有 canonical ref → 原始回执按既有字段一次发布完整本次事实与正确 `output_ref`。正常 reused/unknown 只进既有 CLI 回复与 stage 行 `source`／`evidence`；不相等或无法确立则保留新件并如实记 unknown。真实结算失败由既有 `error` 槽保留失败，不冒成功。审查输出层仍写 review 记录既有 `discarded_facts`。
  - 审查记录：provider 原始流 → `recordSimpleReviewRequest` → **同一 provider 内、内容相同**的输出复用一份并写引用（**不跨 provider 去重**，见下）。
- **失败语义**：
  - 入口材料缺失 → 写缺口 + `unassessed` + 具名 owner，不空填、不阻断。
  - 写集与索引不一致 / 不安全路径 / 未定序重叠 → `validatePostPhaseContract` 报真实错误，**只记事实**；本任务要求自己的材料零错误。
  - 内容相等无法确立（既有件不可读、字节数不同、命令不同）→ 保留新件 + `deduplication: unknown`；**不得**据「命令相同 + 字节数一致」判定为重复（DF-08）。来源优先级：上游 D-022 的旧弱条件与混写目标受后续 DF-08 内容相等要求及本阶段实读 schema 限制；捕获写 source/evidence、review 写 discarded_facts。只在本 spec 登记更正，不覆盖决策/审查原字节。
  - 审查 provider 不可用/失败/超时/取消/无效输出/零成功路/空 findings → 如实记 unavailable／incomplete，**不换执行者、不属于外部停机适用范围、不缩减并发或轮次、不按时长停止**。
  - OCR 不可用 → 四件齐 + `read_confirmed` 保持 `null` + 不可证一律进 `undetermined`。
- **新增控制面**：N/A — 不新增公共命令、schema、持久对象、账本或第二进度权威。捕获层复用是本任务在 `stage-runtime.mjs` 内新增的**私有实现分支**（不是第八类公共命令），其触发输入是既有 `receipt_ref`／`output_ref` 标签。D-032 私有接口职责登记：唯一 consumer 为 `tools/cli/stage-runtime.mjs` capture 分支，writer 为 P5/T014，文件既有 owner 为 move-map 的 `B0/P1 / MT-1-004`（当前实读）；承接输出结算并替代发布后改写/删除原始回执的错误 seam，不新增公共入口。验证沿冻结 T014 命令、既有采集/证据契约及相关失败路径；当该 consumer 退役或经独立审查的既有实现已承接同一职责且消费者完成改接时，删除本私有扩展；直接消费者仍存在时保留。`reserveOutput`／`publishReceipt`、create-only 与其它现有消费者行为保持既有口径。
- **跨 provider 去重的边界（重要，如实登记）**：`tests/contract/ocr-delegation-route.test.mjs` 逐字断言「each provider owns both original streams, **no cross-provider hash-dedupe authority**」。因此 D-019／D-023 授权的「同内容 provider 输出不重复存件」在实现上**收窄为同一 provider 内、内容相同的输出**（`providerFact` 与 `onProviderOutput` 对同一 provider 产生的同一份内容）；跨 provider 同内容**不去重**。这是对既有测试所固化决定的尊重，不是范围扩大。

### 全局文件边界与依赖

- **新增**：`N/A — 本任务不新增仓库文件`。`docs/adr/0038-decomposition-follows-deliverable-units.md` 与 `docs/adr/0039-evidence-scope-path-and-hash.md` 已在 make-decision 阶段新增（前置事实 PFACT-006），不再是下游 Phase 的写集成员。
- **修改**（20 条，取自 `decision-log.md` 的 23 行写集表减去 3 条前置已落盘：`GLOSSARY.md`、两份 ADR）：
  `AGENTS.md`；`docs/standard-workflow.md`；`workflows/make-decision/SKILL.md`；`workflows/make-decision/steps.json`；`skills/decision-log/SKILL.md`；`skills/decision-log/templates/decision-log-template.md`；`skills/spec-plan/SKILL.md`；`skills/spec-plan/templates/phase-template.md`；`skills/spec-specify/templates/spec-template.md`；`workflows/build-plan/SKILL.md`；`workflows/build-code/SKILL.md`；`workflows/verify-code/SKILL.md`；`skills/wh-review/SKILL.md`；`skills/wh-review/contracts/build-plan.md`；`skills/wh-review/contracts/build-code.md`；`skills/wh-review/contracts/verify-code.md`；`skills/plan-eng-review/SKILL.md`；`docs/architecture/test-asset-governance-rules.md`；`tools/cli/stage-runtime.mjs`；`runtime/review/review-record-route.mjs`
  另加终末验收 Phase 自己回写的材料：`specs/design-execution-efficiency-20261014/spec.md`、`specs/design-execution-efficiency-20261014/phases/index.md` 与七个 `phases/P<n>-*.md`。
- **禁止改动**：`CONSTITUTION.md`（D-027）；`runtime/stage/stage-content-contracts.mjs`；`runtime/interface/safe-write.mjs`；`runtime/task/task-store.mjs`；`runtime/interface/run-command.mjs` 的 D-032 批准范围之外（`reserveOutput`／`publishReceipt`／create-only 算法仍禁止改）；`runtime/review/schemas/result.schema.json`；`specs/archive/**`；既有 `quality/reviews/**` 与 `quality/evidence/**` 原件（只读保留，不重写、不镜像）；`docs/adr/0035-*`／`0036-*`（既有决定，只引用）；本仓之外的 PaperBuilder CARD-05 全部字节（R-004）。
- **收敛次序与施工次序**：上游 D-009 的 M2→M1→M3+M7、再 M5/M6/M4 是 make-decision 细化讨论的次序，不是文件施工依赖。当前 DAG 按已确认 spec-clarify Q1 的真实编辑依赖排；P1 先定义入口事实、P2 再消费该输入，M3/M7 讨论绑定但 M7 施工须消费 M5 的输出语义与 M6 的模板边界。这解释讨论顺序与施工顺序的差别，方向原件不改。
- **入口图事实的交接**：M1 的独立交付数与用户在场动作由 P1 保证，依赖图／最长链／并行宽度由 P2 双输入重演与本 spec DAG 产出；均作为既有计划确认的可见输入，不添加计算平台或阈值。P1 不能把未计算的图事实虚写已显示，P2 补齐后交同一人类边界读回。
- **全局依赖（8 个 Phase 的真实 DAG，无环）**：
  - `P1`（依赖 `none`）与 `P3`（依赖 `none`）是两个根：写集互斥、无真实依赖，可并行。
  - `P2` ← P1（同写 `workflows/make-decision/SKILL.md`，定序 M1→M2）
  - `P4` ← P3（同写 `workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`docs/standard-workflow.md`，定序 M3→M4）
  - `P5` ← P4（同写 `AGENTS.md`、`docs/standard-workflow.md`、两份 workflow，定序 M4→M5）
  - `P6` ← P2、P5（同写 `skills/spec-plan/templates/phase-template.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`）
  - `P7` ← P6（同写 `skills/spec-plan/templates/phase-template.md`、`docs/standard-workflow.md`、`runtime/review/review-record-route.mjs`）
  - `P8` ← P1…P7（终末验收，覆盖全部 15 条 AC）
  最长链 6（P3→P4→P5→P6→P7→P8）；最大并行宽度 2（批次一 = P1∥P3）。**每 Phase 自带提交**（AC-015）与单工作树的提交可分性约束下，实际派发可按拓扑序串行，也可在提交可分离时并行批次一；依赖事实不变。
- **文件归属（定序写主，全图无环）**：
  | 文件 | 定序写主 | 依据 |
  | --- | --- | --- |
  | `AGENTS.md` | P4 → P5 | 上游同序；治理白名单路径（ADR-0036） |
  | `docs/standard-workflow.md` | P3 → P4 → P5 → P7 | 上游顺序一致（M3→M4→M5→M7） |
  | `workflows/make-decision/SKILL.md` | P1 → P2 → P6 | 上游同序（M1→M2→M6） |
  | `workflows/make-decision/steps.json` | P1 | 单写者 |
  | `skills/decision-log/SKILL.md` | **P1 → P6** | **偏离上游「M6 → M1」**，见下 |
  | `skills/decision-log/templates/decision-log-template.md` | P1 → P6 | 上游同序 |
  | `skills/spec-plan/SKILL.md` | P2 | 单写者 |
  | `skills/spec-plan/templates/phase-template.md` | P2 → P6 → P7 | 上游同序 |
  | `skills/spec-specify/templates/spec-template.md` | P6 | 单写者 |
  | `workflows/build-plan/SKILL.md` | P2 → P6 | 上游同序 |
  | `workflows/build-code/SKILL.md` | **P3 → P4 → P5 → P6** | **偏离上游「M3 → M5 → M4 → M6」**，见下 |
  | `workflows/verify-code/SKILL.md` | **P3 → P4 → P5** | **偏离上游「M3 → M5 → M4」**，见下 |
  | `skills/wh-review/SKILL.md` | P7 | 单写者 |
  | `skills/wh-review/contracts/build-plan.md` | P2 | 单写者 |
  | `skills/wh-review/contracts/build-code.md` | P7 | 单写者 |
  | `skills/wh-review/contracts/verify-code.md` | P7 | 单写者 |
  | `skills/plan-eng-review/SKILL.md` | P2 | 单写者 |
  | `docs/architecture/test-asset-governance-rules.md` | P6 | 单写者 |
  | `tools/cli/stage-runtime.mjs` | P5 | 单写者 |
  | `runtime/interface/run-command.mjs` | P5/T014 | D-032：仅私有发布前输出结算接口 |
  | `runtime/review/review-record-route.mjs` | P5 → P7 | 上游同序 |
  | `specs/…/spec.md`、`phases/index.md`、`phases/P1..P7` | P8 | 终末验收回写 |
- **三处定序偏离的登记（对应 AC-004 的判据与 OPEN-02）**：上游 `decision-log.md` 的「定序写主」列存在**两处环**——① `M1 → M2 → M6`（`workflows/make-decision/SKILL.md`）与 `M6 → M1`（`skills/decision-log/SKILL.md`）互斥；② `M4 → M5`（`AGENTS.md`、`docs/standard-workflow.md`）与 `M5 → M4`（两份 workflow）互斥。build-plan 按**真实编辑依赖**选定全局顺序 `M1 → M2 → M3 → M4 → M5 → M6 → M7`，据此改写上表 3 行：`skills/decision-log/SKILL.md` 改为 P1→P6（两处编辑落在不同节：M1 补「入口事实与 U 最小索引」口径、M6 改「内容边界」节，无文本依赖）；两份 workflow 改为 M3→M4→M5（M4 定义「外部不可重试失败」的适用范围与「同一不可用事实」，M5 定义「同一事实＝字节相同」的复用判据，唯一真实语义方向是 M4 先于 M5）。**上游 `decision-log.md` 字节不改**；本登记即事实。
- **回滚与恢复**：每个 Phase 的改动都是方法文本或窄扩展的私有实现分支，回滚＝退回该 Phase 的 hunk（`git revert` 或按 Phase 提交粒度回退），不覆盖其它 Phase 的改动、不改历史原件。新增的复用分支若判定条件不成立，失败安全是「保留新件 + `deduplication: unknown`」，即退化为现状行为，不需要回滚。

### 需求到任务追踪

| 来源 / 决定（decision-log ID/位置；适用时附上游引用） | 原义行为 / 强度 | FR / AC | Phase / Task | 正例 + 负例判据 / 证据（含 oracle 编号） | 依赖 / 状态 |
| --- | --- | --- | --- | --- | --- |
| `R-001` / `D-014` | 入口义务变成对既有函数的实际调用，真实返回记入一条既有四字段决定 | FR-ENTRY-001 / AC-001、AC-002 | P1/T001 | ORACLE-P1-ENTRY：真实调用命令与返回可回读；无调用记录或无来源即失败 | 无 |
| `R-001` / `D-014`、`D-015` | 第 8 步与第 13 步的展示包含入口三项事实与范围声明；`paused` 时给出可选拆分路线 | FR-ENTRY-001 / AC-001、AC-002 | P1/T002 | ORACLE-P1-ENTRY：展示记录含三项事实；缺失或 `paused` 无拆分路线即失败 | 无 |
| `R-001` / `D-015` | 干跑重演入口：真实调用既有函数并产出入口事实与展示记录 | FR-ENTRY-001 / AC-001、AC-002 | P1/T003 | ORACLE-P1-ENTRY：调用原件与展示记录双证据；用聚合计数代替逐项事实即失败 | 无 |
| `R-001`、`R-008` / `D-012` | 切分依据由交付单元决定、写集降级为申报；跨批次重叠须具名先后写者 | FR-SPLIT-001、FR-SPLIT-002 / AC-003、AC-004 | P2/T004 | ORACLE-P2-SPLIT：规则正文与审查合同口径一致且引用 ADR-0036／0038；仍由文件所有权主导即失败 | P1/T001、P1/T002、P1/T003 |
| `R-008` / `D-012` | 粒度规则补上「何时应当并」的另一半（S1–S4 与误用反例） | FR-SPLIT-001、FR-SPLIT-003 / AC-003、AC-004 | P2/T005 | ORACLE-P2-SPLIT：并的判据带具名对象；规则仍单向（只有拆没有并）即失败 | P1/T001、P1/T002、P1/T003 |
| `R-008` / `D-012`、`D-013` | 双输入干跑重演对照表、调用既有校验器读写集重复判定、先后图无环核对 | FR-SPLIT-002、FR-SPLIT-003 / AC-003、AC-004 | P2/T006 | ORACLE-P2-SPLIT：校验器真实输出无未定序重叠且环检测为空；存在未定序重叠即失败 | P1/T001、P1/T002、P1/T003 |
| `R-009`、`U-002` / `D-018` | 完成判据降回本 Phase 事实：`Done` 逐条承接 AC＋档位＋证据指针；未参与判定的 Phase 不得写 pass | FR-CLOSURE-001 / AC-005、AC-006、AC-015 | P3/T007 | ORACLE-P3-CLOSURE：规则正文含三条禁止；下游替上游补签即失败 | 无 |
| `R-009` / `D-017` | 承接 AC 未达成时的「带欠账完成」显著标注形态，永不写成 pass | FR-CLOSURE-002 / AC-005、AC-006、AC-015 | P3/T008 | ORACLE-P3-CLOSURE：受控场景记录＋契约头形态；无标注 completed 或写成 pass 即失败 | 无 |
| `R-009`、`U-002` / `D-018` | 末 Phase 只复核、不作首次结论点；每 Phase 自带提交且提交在审查之后 | FR-CLOSURE-003 / AC-005、AC-006、AC-015 | P3/T009 | ORACLE-P3-CLOSURE：`git log`／`git show --stat` 可核提交事实；提交推迟到末端即失败 | 无 |
| `R-003` / `D-027` | 适用范围与排除项两行（不改 `CONSTITUTION.md`） | FR-STOP-001 / AC-011 | P4/T010 | ORACLE-P4-STOP：两行齐备且排除项明确；把审查 provider 不可用纳入停机即失败 | P3/T007、P3/T008、P3/T009 |
| `R-003` / `D-028` | 零重试升级、无界反馈路径换上下文一次、时间不构成停止或复位条件 | FR-STOP-002 / AC-011 | P4/T011 | ORACLE-P4-STOP：触发与复位口径成文；按时长停止或复位即失败 | P3/T007、P3/T008、P3/T009 |
| `R-003` / `D-027`、`D-028` | 受控不可重试失败场景的处置记录核对（同时承接 FR-STOP-002 的无界路径与复位口径） | FR-STOP-001、FR-STOP-002 / AC-011 | P4/T012 | ORACLE-P4-STOP：处置记录零重试并给可直接回复选项；重复采集同一不可用事实即失败 | P3/T007、P3/T008、P3/T009 |
| `R-003` / `D-021` | 证据纪律「同一事实＝字节相同」与证明范围只写路径＋hash（三类例外逐条写明） | FR-EVIDENCE-001、FR-EVIDENCE-002 / AC-008、AC-014 | P5/T013 | ORACLE-P5-EVIDENCE：材料对照＋三类例外；证明范围仍搬字节即失败 | P4/T010、P4/T011、P4/T012 |
| `R-003` / `D-022` | 捕获层复用支路：确立内容相等才复用，否则保留新件并记 `deduplication: unknown` | FR-EVIDENCE-003 / AC-008、AC-014 | P5/T014 | ORACLE-P5-EVIDENCE：针对性运行时验证输出；据「命令相同＋字节数一致」判定重复即失败 | P4/T010、P4/T011、P4/T012 |
| `R-003` / `D-019`、`D-023` | 审查输出层同一 provider 同内容去重（不跨 provider、不动 record 唯一性） | FR-EVIDENCE-003 / AC-008、AC-014 | P5/T015 | ORACLE-P5-EVIDENCE：既有测试保持＋新行为配对 RED/GREEN；跨 provider 去重即失败 | P4/T010、P4/T011、P4/T012 |
| `R-001` / `D-026` | 第 9 步粒度限定、`decision-log` 内容边界与模板承接位（不删义务） | FR-BOUNDARY-001 / AC-009、AC-010 | P6/T016 | ORACLE-P6-BOUNDARY：分工口径落在方法文本；实现设计仍内联在决策材料即失败 | P2/T004、P2/T005、P2/T006、P5/T013、P5/T014、P5/T015 |
| `R-001` / `D-026` | 契约面只写符号名＋行为语义；行号降为生成时刻导航提示 | FR-BOUNDARY-002 / AC-009、AC-010 | P6/T017 | ORACLE-P6-BOUNDARY：字段说明表口径＋本任务契约性字段无行号；出现被当契约的行号即失败 | P2/T004、P2/T005、P2/T006、P5/T013、P5/T014、P5/T015 |
| `R-001` / `D-024`、`D-025` | TCR 边界两半（具名常量先点名才不触发）＋冻结 oracle 单一来源每任务一次 | FR-BOUNDARY-003 / AC-009、AC-010 | P6/T018 | ORACLE-P6-BOUNDARY：规则正文两半齐备；出现改名绕开或逐 oracle 记账面即失败 | P2/T004、P2/T005、P2/T006、P5/T013、P5/T014、P5/T015 |
| `R-002` / `D-016` | 「有结论」三条件、OCR 不可用四件齐、`material_coverage` 三键语义 | FR-TRUTH-001、FR-TRUTH-002 / AC-007、AC-014 | P7/T019 | ORACLE-P7-TRUTH：review 原件字段核对；无原始件的 conducted 或覆盖写成 read 即失败 | P6/T016、P6/T017、P6/T018 |
| `R-002` / `D-030` | 冻结字段逐个点名（从真实 schema 导出）＋记录身份锚点（不改行为） | FR-TRUTH-002、FR-TRUTH-003 / AC-007、AC-014 | P7/T020 | ORACLE-P7-TRUTH：清单带导出依据且既有 `executor` 行为不变；字段自造即失败 | P6/T016、P6/T017、P6/T018 |
| `R-002` / `D-030` | 审查面锚定「本 Phase diff＋本 Phase 承接的 AC」；判据面补判定方式标注与 `Done` 档位 | FR-TRUTH-003 / AC-007、AC-014 | P7/T021 | ORACLE-P7-TRUTH：合同与模板口径可核；审查面仍随 Phase 数量膨胀即失败 | P6/T016、P6/T017、P6/T018 |
| `R-001`、`R-009`、`R-010`、`U-002` / `D-007`、`D-008`、`D-012`、`D-017`、`D-018` | 逐 AC 结论与验收 Phase 固定小节；逐 AC 首次结论点核对、计划自洽四项、全局边界、前作分类复核、每 Phase 提交事实 | FR-GUARD-001、FR-PREDECESSOR-001、FR-CLOSURE-001、FR-CLOSURE-003、FR-SPLIT-002 / AC-005、AC-012、AC-013、AC-015 | P8/T022 | ORACLE-P8-ACCEPT：逐条对照全表＋diff 逐处核对；用计数相等判通过即失败 | P1/T001、P2/T004、P3/T007、P4/T010、P5/T013、P6/T016、P7/T019 |
| `R-003`、`R-002` / `D-019`、`D-023`、`D-030` | 两处运行时改动的针对性验证复核与未闭环 case 的真实入口 | FR-EVIDENCE-003、FR-TRUTH-003 / AC-014、AC-008、AC-007 | P8/T023 | ORACLE-P8-ACCEPT：针对性验证输出原件＋未闭环 case 具名入口；以干跑冒充代码行为验证即失败 | P1/T001、P2/T004、P3/T007、P4/T010、P5/T013、P6/T016、P7/T019 |

### 全局验证策略

- **验证策略**：本任务有两类验收对象——**方法/材料文本**与**两处运行时行为**。方法文本面用「具名客观替代」：真实调用既有函数（`evaluateMiniTaskScope`）、真实调用既有校验器（`validatePostPhaseContract`）读其对**本任务自身材料**的输出、真实跑受影响范围的既有契约测试、独立人读复核语义；运行时行为面用配对 oracle 的 RED/GREEN 与真实退出码。**干跑重演只覆盖方法文本效果，不证明代码行为**（AC-014 明写）。
- **RED/GREEN 设计**：
  - 行为 Task（`tools/cli/stage-runtime.mjs`、`runtime/review/review-record-route.mjs`）用同一判定器编号的配对门禁：改动前目标断言真实失败（RED，非 setup/环境失败），改动后同命令退出 0（GREEN）；受影响范围的既有测试作为保守超集一并跑。
  - 各 Phase 的回归命令只采用「基线既有失败」小节中已实测为绿的受影响检查：方法文本与审查合同面用 `verify-architect-acceptance`／`ocr-review-contract-bundle`，模板面用 `post-build-plan-missing-index`／`card05-author-material-consumer`，运行时面用 `review-record-route`／`stage-evidence-contract`／`narrow-tool-safe-write`；具体命令以各 Phase 卡为准。`runtime-facade`、全量 `thin-core-residue`、`ocr-delegation-route` 基线红只保留事实，不作为预期 0 的回归命令。P6 的 `thin-core-residue -t "skills/workflows 文本不含"` 是已实测 exit 0 的限定子集，不把全文件的既有失败改写为绿。计划自洽调用既有 `validatePostPhaseContract`，不新增校验器；行为变化由 T014/T015 的自包含内联断言承担，旧绿回归不冒充新行为的 RED。
  - 纯文档 Task（写路径全为 `.md` 且确无新增运行行为）按 G-2 做可证伪读回：不制造仪式性 RED，改用具名既有检查 + 可复放的判定对象，并如实披露「结构接纳不等于 GREEN」。
- **全局可执行命令**：从认证工作树根运行 `node tools/cli/verify-structure.mjs`（只核结构，基线 exit 0）；本任务的完整材料、承接与档位读回运行 P8 契约头的相对路径 `gate_cmd`。两处新增行为分别运行 P5/T014 与 P5/T015 的内联门禁，针对性回归为 `npx vitest run tests/review/review-record-route.test.mjs tests/contract/stage-evidence-contract.test.mjs tests/contract/narrow-tool-safe-write.test.mjs`。结构绿不能代替行为或语义结论。
- **最终聚合**：由终末验收 Phase（P8）逐条消费各承接 Phase 的原件，按 `Appendix A` 逐条给档位与具名证据指针；逐条结论行数＝AC 条数，非 `pass` 一律不计通过，不用计数替代逐条。
- **承接与首次观察的区分**：契约头 `覆盖 AC` 声明该 Phase 交付的方法/功能面，不把每个遵守全局规则的执行 Phase 都扩成该方法的作者。AC-012/AC-015 的方法由 P3 交付，全局边界与每 Phase 提交在 P1 开始逐 Phase 观察，P8 只汇总复核；P1 没有因此新增实施路径。AC-014 在 P5 实测两处行为，在 P7 核记录身份，两者分面不重复签同一事实；AC-005/AC-013 材料侧首点为当前 build-plan 主会话。机器 crosswalk 解析 unknown 时保留未知，首次结论与 owner 的归属按逐条人读表核，不从覆盖计数或正则推定。
- **不能证明的内容**：本规格不证明真实仓库路径在实施后仍然存在、不证明真实施工已完成、不证明真实用户效果；干跑重演不产生真实执行事实；改文不证明行为改变（`OPEN-03`）。

## Appendix A — 验收判据（唯一权威）

本节的 AC 编号与 `decision-log.md` 的 `## 验收面` 同号（AC-001…AC-015）。每条给出判定方式、判定时点、执行 owner、所需条件、验证/通过/失败/证据。**判定方式标记词表固定为三个：`机器可判` / `只能人读` / `需真实环境+用户在场`；标记的唯一权威位置是本节**，Phase 卡不得另写一份（避免病例的 AC 编号双轨）。

- [ ] **AC-001**：干跑重演入口：方法是否产出「承诺的独立可交付验收单元数」「是否含需用户在场或真实凭证的动作」与既有评估函数的真实返回；关联 FR-ENTRY-001、PFACT-007、SCN-001
  判定方式：只能人读。判定时点：P1 收口时（首次结论点，非末 Phase）。执行 owner：M1 实施者；独立复核：P8。所需条件：病例输入材料（只读）+ 可执行的 `evaluateMiniTaskScope` + 第 8/13 步展示记录。
  验证：在本次任务内对病例输入做干跑重演，真实调用既有评估函数并记录调用命令、退出码与返回原件；按新方法文本投影出「入口三项事实 + 范围声明」，形成展示记录；`paused` 时同批给出至少一条可选拆分路线。三项事实与展示记录由未参与实施的人读复核。
  通过：三项事实在入口产出并在第 8 步与第 13 步形式下均可读到；返回 `paused` 时同时给出至少一条可选拆分路线；每条事实都有来源（命令 + 返回原件落点）。
  失败：任一事实缺失、无来源、未展示；或 `paused` 而未给拆分路线；或用聚合计数代替逐项事实。
  证据：干跑重演材料（入口投影与展示记录）+ 评估函数调用原件；本节的执行状态由 build-code 的执行事实填写。
- [ ] **AC-002**：入口是否以可核方式记录既有评估函数的真实返回；关联 FR-ENTRY-001、PFACT-001、SCN-001
  判定方式：机器可判。判定时点：P1 收口时（首次结论点）。执行 owner：M1 实施者；独立复核：P8。所需条件：可执行的函数调用 + 落盘位置可读。
  验证：核对入口决定条目里是否含调用命令、返回原件路径与落点，并回读该落点确认可读；命令与返回按同一 oracle 配对。
  通过：记录含调用命令、返回原件与落点且能回读；返回内容与原件一致。
  失败：无调用记录，或返回内容无来源，或落点不可读。
  证据：入口决定条目 + 输出原件（单份）。
- [ ] **AC-003**：干跑重演产出的 Phase 边界由「可独立交付验收的单元」决定；关联 FR-SPLIT-001、FR-SPLIT-003、PFACT-002、SCN-002
  判定方式：只能人读。判定时点：P2 收口时（首次结论点）。执行 owner：M2 实施者（build-plan 主会话）；独立复核：P8。所需条件：双输入干跑重演（原始 PRD 需求版 + 最终范围版）+ 病例实测数据（只读）。
  验证：对两条输入分别按新规则产出 Phase 边界，形成对照表（Phase 数 / 最长链 / 并行宽度 / 写集重叠 / 体量分布 / 判据类型），与病例实测并列；每个边界能用交付单元逐条解释；粒度规则含「何时应当并」。
  通过：边界可由交付单元逐条解释；粒度规则含拆与并两半且并的判据带具名对象；对照表与病例实测并列可见。
  失败：仍能观察到由文件所有权主导的边界；粒度规则仍单向（只有拆、没有并）。
  证据：对照表 + 规则正文 diff（单份原件）。
- [ ] **AC-004**：跨批次写同一路径时的合法性；关联 FR-SPLIT-002、FR-SPLIT-003、PFACT-002、PFACT-003、SCN-002
  判定方式：机器可判。判定时点：P2 收口时（首次结论点）。执行 owner：M2 实施者；独立复核：P8。所需条件：写集表、Phase 契约头、`phases/index.md` 三者一致；`validatePostPhaseContract` 可执行。
  验证：跑真实校验器读取其输出（`write set duplicates` / `serializedPair` 判定）；逐条核对每一处重叠是否有具名先写者、后写者与依据；按依赖边做环检测，确认全图无环。
  通过：重叠路径均有真实依赖边与具名先/后写者；校验器输出无未定序重叠；环检测结果为空。
  失败：存在未定序重叠；或需新增运行时豁免种类；或先后图存在环而未被登记。
  证据：写集表 + 边界段 + 校验器真实输出 + 环检测输出。
- [ ] **AC-005**：干跑重演**按 AC 身份与归属映射**逐条核四件事（不用聚合计数）：①每条 AC 有判定方式标记且标记数＝总 AC 数；②末 Phase 首次结论数＝0；③`Done` 档位数＝承接数；④`gate_cmd = N/A` 且覆盖 AC 非空数＝0；且无重复归属、无遗漏 AC；关联 FR-CLOSURE-001、FR-SPLIT-002、SCN-002、SCN-003
  判定方式：机器可判（逐条对照脚本输出全表 + 人读复核）。判定时点：材料侧首次结论在 build-plan 收口时（P8 之外，非首末冲突）；执行事实侧在 build-code 各 Phase 收口后由承 Phase 复核。执行 owner：verify-code 承接（终末复核）+ build-plan 主会话（材料侧首次核对）。所需条件：`spec.md` 的 AC 正文、每个 Phase 契约头的 `覆盖 AC` 与 `Done`、`gate_cmd`。**材料侧首次核对原件**：任务库 `quality/evidence/build-plan-refs/plan-conformance-check.md`。该生成时刻记录①标记 15/15、②末 Phase 首次结论数 0、③AC 点名 29/29、④覆盖非空且 gate 缺失为 0，列出 **10** 处写集重叠的定序写者。其③仅核了 AC 点名，**未证明档位数**；不得沿用其「四项成立」作为最终结果。唯一审查指出此缺陷后，P8/T022 补逐 AC 档位读回，原作者修复缺档/否定词多档；本阶段最终命令原始输出留在任务库 `quality/tests/`，由阶段 facts 引用，旧原件保留不覆写。四项最终结论还包含首次结论归属的人读半，不以正则或计数相等代替。
  验证：按 AC 编号 ↔ 承接 Phase ↔ 标记 ↔ 档位做逐条对照，输出**全表**而不是计数；四项各自独立核对，计数相等不能代替逐条。
  通过：四项全部成立，且无重复归属、无遗漏 AC。
  失败：任一条不成立，或出现重复归属/遗漏 AC（计数相等也不能判通过）。
  证据：材料侧逐条对照记录（`quality/evidence/build-plan-refs/plan-conformance-check.md`）+ 终末验收 Phase 的复核记录（两件分开，后者不代替前者）。
- [ ] **AC-006**：承接 AC 未达成时的 Phase 完成形态；关联 FR-CLOSURE-001、FR-CLOSURE-002、SCN-003
  判定方式：只能人读。判定时点：P3 收口时（首次结论点，用受控场景核对形态）；每个真实出现该形态的 Phase 收口时复核。执行 owner：M3 实施者；独立复核：P8。所需条件：规则文本 + 一个承接 AC 未达成的场景（真实发生或受控重演）。
  验证：核对契约头是否显著标「带欠账完成」、是否逐条列未达成项与条件与具名 owner、是否避免了 pass；用受控场景构造一次并留存记录。
  通过：形态齐备且不写 pass；未达成项逐条可核。
  失败：出现无标注的 completed；或写成 pass；或只标注不列未达成项。
  证据：Phase 卡 + 受控场景记录 + 审查原件。
- [ ] **AC-007**：审查记录真实性；关联 FR-TRUTH-001..003、PFACT-004、PFACT-005
  判定方式：机器可判。判定时点：P7 收口时（首次结论点）。执行 owner：M7 实施者；独立复核：P8。所需条件：真实 review 原件（本任务自身的 build-plan 合并审查回执）。
  验证：核对「有结论」三条件是否同时成立；核对 `read_confirmed` 未被证时保持 `null`；核对 `material_coverage` 三键语义与 `undetermined` 未被写成 `read`；核对 8 个冻结字段未出现自造取值。
  通过：三条件同时成立；OCR 不可用（若发生）四件齐；无自造字段值。
  失败：出现无原始件的 `conducted`；覆盖被写成 `read`；字段自造。
  证据：review 原件（单份）。
- [ ] **AC-008**：证据同字节不新写；关联 FR-EVIDENCE-001..003、PFACT-003、SCN-005
  判定方式：机器可判。判定时点：P5 收口时（首次结论点）。执行 owner：M5 实施者；独立复核：P8。所需条件：sha256 全族比对能力 + 两处运行时改动的针对性验证。
  验证：对同族证据做 sha256 逐一比对（反制「抽查代替全族」的失效），统计同字节存件次数；核对证明范围是否只写路径 + hash（三类例外除外）；核对捕获层与审查输出层是否按 D-022/D-019/D-023 复用并写引用。
  通过：同字节复用并写引用；证明范围只写路径 + hash；两处复用行为按判据成立。
  失败：同字节再次新写；或证明范围仍搬字节；或复用判据被写成「命令相同 + 字节数一致即重复」。
  证据：存件统计对照表（**不设阈值**）+ 复用事实记录 + 针对性验证输出。
- [ ] **AC-009**：决策材料与实现设计分界；关联 FR-BOUNDARY-001、FR-BOUNDARY-002、SCN-006
  判定方式：只能人读。判定时点：P6 收口时（首次结论点）。执行 owner：M6 实施者；独立复核：P8。所需条件：新规则文本 + 本任务自身 Phase 卡契约面 + 上游 decision-log（只读）。
  验证：核对 decision-log 侧不再新增长度/阈值/字段级方案（坐标、阈值、字段级方案归 spec 与 Phase 卡）；核对本任务 Phase 卡的契约性字段（写入集、符号、覆盖 AC、Done）不含被当契约的行号；核对行号只出现在导航性字段且被声明为生成时刻提示；对上游 decision-log 只核「未被新增实现设计」，不回溯改写已确认字节。
  通过：材料分工口径落在方法文本；本任务契约性字段只写路径与符号；行号降级口径写在 `phase-template.md` 字段说明表。
  失败：仍出现被当契约的行号；或实现设计仍内联在决策材料新增内容里；或契约面写字段级方案。
  证据：材料对照记录 + 规则正文 diff。
- [ ] **AC-010**：TCR 边界；关联 FR-BOUNDARY-003、SCN-006
  判定方式：只能人读。判定时点：P6 收口时（首次结论点）。执行 owner：M6 实施者；独立复核：P8。所需条件：规则文本 + 相位卡字段说明。
  验证：核对「按名改已点名具名常量不触发 TCR」与「改断言/期望方向/评分逻辑仍触发」两半是否都在；核对冻结 oracle 的单一来源是否按每任务声明一次；核对是否避免了「逐 oracle 记账面」复现。
  通过：两半边界明确；单一来源按任务声明一次；未新增 schema 或账本。
  失败：出现改名绕开（常量未被先点名）；或逐 oracle 记账面复现。
  证据：规则正文 + 相位卡字段说明。
- [ ] **AC-011**：外部不可重试失败；关联 FR-STOP-001、FR-STOP-002、SCN-004
  判定方式：只能人读。判定时点：P4 收口时（首次结论点，用受控不可重试失败场景）。执行 owner：M4 实施者；独立复核：P8。所需条件：规则文本 + 一个真实的不可重试失败场景（输入非法或权限不足即可构造）。
  验证：在受控场景下核对处置是否零重试、是否立即升级并给出可直接回复的选项、是否按既有格式写清「卡在哪/为什么/几条路/代价与风险」；核对同一失败信号再次出现时是否换上下文一次、仍出现即升级；核对审查 provider 不可用是否被正确排除；核对时间未被当作停止或复位条件。
  通过：零重试 + 立即升级并给出可回复选项；排除项未被误纳入停机；时间未构成停止/复位条件。
  失败：重复采集同一不可用事实；或把审查 provider 不可用也停机；或按时长停止/复位。
  证据：停机报告 + 处置记录 + 规则正文 diff。
- [ ] **AC-012**：全局边界：本次改动是否引入门禁/阈值/校验器/账本；关联 FR-GUARD-001
  判定方式：机器可判。判定时点：每个 Phase 收口时核对自身 diff（首次结论点＝P1 收口）；P8 汇总复核全部 diff。执行 owner：全体实施者；独立复核：P8。所需条件：本任务全部改动的 diff。
  验证：`git diff --name-only` 与本任务写集逐条比对；逐处核对是否新增门禁、数字阈值、校验器或账本四类中的任一类。
  通过：diff 逐处核对，未新增任何一类。
  失败：出现任一类新增。
  证据：改动 diff 与规则正文 + 逐 Phase 的 diff 核对记录。
- [ ] **AC-013**：R-010 前作 29 条未闭合 AC 的逐条可判性分类；关联 FR-PREDECESSOR-001
  判定方式：只能人读。判定时点：build-plan 收口时（首次结论点，在本阶段产出，不落到末 Phase）。执行 owner：build-plan 主会话；独立复核：P8。所需条件：前作任务库与归档材料的只读访问。
  验证：产出分类判据 + 逐条清单（可由规划/材料判定关闭 / 须真实运行保持 open）+ 产物位置 + 具名 owner；逐条给出材料依据。
  通过：分类判据可被第三方按材料复核；逐条清单齐全；产物位置与 owner 具名。
  失败：只给规则不给清单；或未指明 owner 与产物位置。
  证据：分类清单原件（本阶段产出的单份原件）。**类别不是关闭结论**：用户选定口径 A 的 16 条属于可用规划/材料判定的候选，不能写成 16 条已关闭；其中 AC-C05AUD-07 的「由用户数」条件仍待用户/独立复核，具名 owner 为用户与 P8/T022，不由本会话自证。7 条须真实运行保持 open；另 6 条只保留前作受控 bounded pass，真实业务效果仍 open。分类产物完整与前作 AC 真正关闭分开报告，不改前作任何字节。
- [ ] **AC-014**：两处运行时改动（`stage-runtime.mjs` 复用支路、`review-record-route.mjs` 去重与记录身份）的验证；关联 FR-EVIDENCE-003、FR-TRUTH-003、PFACT-003
  判定方式：机器可判。判定时点：P5 收口时（`stage-runtime.mjs` 复用支路）与 P7 收口时（记录身份与 `:87` 去重）。执行 owner：M5 实施者（P5）、M7 实施者（P7）；独立复核：P8。所需条件：既有针对性契约/单元测试路径 + 可跑的运行时模块。
  验证：走受影响范围的契约/单元验证（**禁全量回归**），核对复用支路与去重行为；写明干跑重演只覆盖方法文本效果，不冒充代码行为验证。
  通过：针对性运行时验证通过并留有输出原件；方法文本效果与代码行为分别报告。
  失败：以干跑重演冒充代码行为验证；或未做针对性验证。
  证据：针对性验证输出原件（两处各一份）。
- [ ] **AC-015**：每个 Phase 自带提交；关联 FR-CLOSURE-003、PFACT-006、SCN-002
  判定方式：机器可判。判定时点：P1 收口时（首次结论点＝第一个 Phase 的提交事实）；每个 Phase 收口时各自核对；P8 汇总。执行 owner：各 Phase 实施者；独立复核：P8。所需条件：`git log` / `git show --stat` 可读；每个 Phase 的审查回执。
  验证：核对每个 Phase 的提交是否在审查之后、该 Phase 收口时完成；核对提交内容是否等于该 Phase 声明写集；核对 make-decision/build-plan 的前置未提交字节是否已被第一个 Phase 的提交带走。
  通过：每个 Phase 都有可核提交事实，且提交在审查之后。
  失败：把提交推迟到末端；或 Phase 完成而无提交事实；或前置字节仍留在未提交状态。
  证据：提交记录（`git log` / `git show --stat`）+ Phase 卡。

> 每条 AC 的判定方式标记齐全（15/15）；没有一条 AC 把首次结论点放在末 Phase（AC-005 的材料侧首次核对、AC-013 的产出均在 build-plan 收口，AC-012/AC-015 的首次核对在 P1 收口）。

## 12. 风险、未决与交接

- **RISK-01**：入口事实写了但没人看，重演「义务存在却从未执行」
  - **受影响 ID**：PFACT-001、PFACT-007、FR-ENTRY-001、AC-001、AC-002
  - **触发条件**：第 8/13 步的展示未包含入口事实，或展示记录缺失
  - **后果**：入口代价继续不可见，规模失控复发
  - **缓解或停止**：把消费者钉在既有的人类边界上（第 8 步粗粒度确认 + 第 13 步方向确认）；看不到时在既有判据里留具名缺口，不阻断、不新增对象
  - **处理阶段**：P1
  - **验证**：干跑重演入口的展示记录与评估函数调用原件
- **RISK-02**：写集表先后图存在环，导致「定序写主」无法真正定序
  - **受影响 ID**：PFACT-002、PFACT-003、FR-SPLIT-002、AC-004
  - **触发条件**：同一文件被多个工作包按互相矛盾的顺序声明（本任务已实测存在两处环，见 OPEN-02）
  - **后果**：跨批次重叠无法定序，或不得不新增运行时豁免种类
  - **缓解或停止**：本任务由 build-plan 在自己的写集表上给出全局无环顺序并登记偏离；不新增运行时豁免种类，不改上游已确认材料
  - **处理阶段**：P2
  - **验证**：环检测输出 + 校验器真实输出
- **RISK-03**：M4 的停机措辞被读成「限并发 / 限轮次 / 按时长停」，撞上用户逐字否决
  - **受影响 ID**：PFACT-004、FR-STOP-001、AC-011
  - **触发条件**：适用范围排除项写得不够死，或出现时长条件
  - **后果**：触碰硬约束，重复历史否决
  - **缓解或停止**：用「适用范围 + 排除」两行钉死，明文写「不因此限制审查并发或轮次，也不按任何时长停止审查」
  - **处理阶段**：P4
  - **验证**：规则正文核对（受控场景记录 + 独立人读）
- **RISK-04**：本任务自身变成长期大任务，重演病例病症
  - **受影响 ID**：PFACT-006、FR-CLOSURE-003、AC-015
  - **触发条件**：Phase 数膨胀、写集表继续加码、把提交推迟到末端
  - **后果**：周期不可预期
  - **缓解或停止**：Phase 边界按可独立交付验收单元；每 Phase 自带提交；不做历史清账；不新增门禁
  - **处理阶段**：P1–P8
  - **验证**：Phase 数与最长链对照表 + 每 Phase 提交事实
- **OPEN-01**：`paused` 时「可选拆分路线」的展示落点尚未核实
  - **受影响 ID**：PFACT-007、FR-ENTRY-001、AC-001
  - **负责人**：M1 实施者
  - **影响**：可能落到一个新增的展示位，违反「不新增节/步骤」的边界
  - **处理阶段**：P1
  - **关闭条件或停止**：在既有第 8/13 步的展示正文内找到落点并读回；找不到就如实记 open + owner，不新增节
- **OPEN-02**：上游写集表的「定序写主」列存在两处环，build-plan 需在自己的写集表上修正
  - **受影响 ID**：PFACT-002、FR-SPLIT-002、AC-004
  - **负责人**：build-plan 主会话（本阶段）
  - **影响**：3 行顺序被改写；若不登记会把上游已确认材料与实际执行不一致隐藏
  - **处理阶段**：build-plan（本阶段）
  - **关闭条件或停止**：在 spec 与写集表里逐行登记偏离（原顺序 → 实际顺序 → 依据），并把环检测输出留档；**不改**上游 decision-log 的字节
- **OPEN-03**：干跑重演只覆盖方法文本效果，不证明真实行为改变
  - **受影响 ID**：AC-003、AC-005、AC-008
  - **负责人**：verify-code 承接
  - **影响**：可能把「改文」当成「改了行为」
  - **处理阶段**：build-code / verify-code
  - **关闭条件或停止**：在结论里分别报告「方法文本效果」与「真实执行事实」；真实效果留给后续真实任务读回

## 13. 业务影响与回归范围

### 方法文本与模板

- **既有行为**：Phase 卡与 spec 的字段、`validatePostPhaseContract` 的校验、contract 测试对模板示例块与 G-2 小节的切分消费。
- **本需求影响**：字段的**含义**与**义务**变化（写集降级为申报、粒度双向、判据标注、带欠账完成、行号降级），字段名与机器读取点不变。
- **回归路径**：`npx vitest run tests/contract/post-build-plan-missing-index.test.mjs` 与 `npx vitest run tests/contract/card05-author-material-consumer.test.mjs`（受影响范围的针对性测试，非全量）。
- **验收**：AC-003、AC-004、AC-005、AC-009、AC-010。

### 两处运行时行为

- **既有行为**：捕获层 `tools/cli/stage-runtime.mjs:1119` 已接收 `receipt_ref` / `output_ref`，`:1123-1124` 明文拒绝复用；`runtime/review/review-record-route.mjs:87` 与 `:119-127` 对同内容 provider 输出各写一份。
- **本需求影响**：落实复用支路、按同内容去重；捕获层复用事实写进既有 `source` 与 `evidence`，审查输出层复用事实写进既有 `discarded_facts`；不减少 provider / 轮次 / 并发。
- **回归路径**：按受影响范围跑既有契约/单元测试，**禁全量回归**（AGENTS.md 测试硬规则）。
- **验收**：AC-008、AC-014。

### 其它在跑的 workflowhub 任务

- **可能受冲击的业务规则**：若 `runtime/` 的两处改动被其它并发任务共享的 checkout 读到，会改变它们的存件行为；这是「减少同一事实的存件次数」，不是减少事实。
- **明确无影响**：PaperBuilder CARD-05 不在本仓，只读；`CONSTITUTION.md`、`safe-write.mjs`、`task-store.mjs`、`stage-content-contracts.mjs` 不改；无迁移、认证或外部服务变更。

## 补充材料

- 决策权威：`specs/design-execution-efficiency-20261014/decision-log.md`（本文件不重写其决定正文）。
- 唯一逐字需求：任务库 `quality/evidence/raw-requirements/2026-10-14-design-execution-efficiency.md`。
- 模块设计原件：任务库 `quality/evidence/decision-log-refs/module-design/`（M1–M6，六份）。
- 病例诊断原件：任务库 `quality/evidence/decision-log-refs/case-diagnosis/`（D1–D5、R-A、R-A-r5、R-B、V1、V2 + `repro/`）。
- 本次唯一合并审查的逐条处置：任务库 `quality/evidence/build-plan-refs/2026-10-14-001-review-dispositions.md`（20 条逐项，修复仅指计划材料缺陷；原始 review 不改写，coverage 仍 undetermined）。
- 本阶段原件与派发记录：任务库 `quality/evidence/build-plan-refs/`（`dispatches.md`、BP-R1…BP-R5 勘察报告、`BP-R6-baseline-gate-measurement.md` 基线门禁测量、`authoring-contract.md` 写作与机器契约、`clarify-2026-10-14.md` 真实问答、`predecessor-29ac-judgeability.md` 即 AC-013 产物、`plan-conformance-check.md` 即 AC-004／AC-005 材料侧首次结论记录）；以及任务库 `quality/tests/2026-10-14-001-build-plan-test-blueprint.md`（step 7／8 读回记录）与 `quality/reviews/2026-10-14-019-build-plan-document.json`（build-plan 合并审查回执）。
- 覆盖矩阵：任务库 `quality/evidence/decision-log-refs/coverage-matrix-5d.md`。该 make-decision 生成时刻原件曾把 AC-013 分类产物记为待产生；本阶段已产出的分类原件优先解释当前事实，旧矩阵/requirement-change-log 保留历史不回写，不能据旧「未确认/未产出」撤销 D-029 真实答复或当前分类产物。
- **执行可证伪与覆盖上限**：P5/T014 内联测试实传第一次的候选 refs，P5/T015 的自动检查当前只覆盖 onProviderOutput 复用；providerFact、跨 provider、零字节/record 不变量另按 Task 的具名实际反例与回归消费，未执行不扩称通过。P1/T003 命令只核入口条款、夹具与函数返回；两处展示的来源/可读性由同卡 Done 的独立人读承担。P4 的 git status 只定位改动，G-2 语义由 Done 的逐条读回与受控非法输入报告核对，不把 ENOENT 称行为目标 RED。P8 字符串档位计数和 validator 全文 FR/AC 统计只报结构事实，不能代替档位语义/首次归属/业务覆盖，后续真实验收保持未知直到相应原件产生。
- **病例（PaperBuilder CARD-05）只读输入的绝对路径**（供 P2/T006 的双输入干跑重演与各 Phase 的对照使用；**只读，禁止改动任何字节**）：
  - 病例当前材料：`/Users/Hugh/Hugh/Project/PaperBuilder-paperbuilder-v3-card-05-live-activation-gate/specs/paperbuilder-v3-card-05-live-activation-gate/`（`decision-log.md`、`spec.md`、`handoff.md`、`phases/` 27 个 Phase 加索引）
  - 病例外置任务库：`/Users/Hugh/Hugh/Knowledge/Projects/PaperBuilder/tasks/paperbuilder-v3-card-05-live-activation-gate/`
  - 两条输入的口径：**原始需求侧**取病例任务库与外置材料里的原始需求陈述；**最终范围侧**取病例 `spec.md` + `decision-log.md` + `phases/`。已实测的病例数字口径见任务库 `case-diagnosis/D2-decision-audit.md` 与 `D3-plan-audit.md`（两份原件对「写集路径总数」分别记 118 与 189，**并列保留、不合成一个数**）。
  - 病例的 82MB codex 会话记录（`~/.codex/sessions/2026/10/12/rollout-2026-10-12T08-27-19-01a12d81-bc36-7be3-b676-6acbbbd94bbc.jsonl`）**只作只读聚合输入，禁止整份保存**。
- 外置事实索引与到达条件：`decision-log.md` 的「外置事实索引」节。
