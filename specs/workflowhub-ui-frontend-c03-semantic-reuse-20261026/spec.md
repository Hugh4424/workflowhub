# 功能规格：C03 组件与布局语义化复用

读者：本卡 build-code 实施者、每 Phase 独立审查者、verify-code 终末复核者，以及 C06／C08 的下游读者。
读完要能：说清要交付什么、四类对象各自算什么、两条链落在哪些真实文件与行、每条 AC 用什么判、哪些明确不做。

本文件承载产品行为与全局实现设计；`phases/P<n>.md` 只写各包差异，`phases/index.md` 只存指针。引用 PRD 与 `decision-log.md` 的稳定目标与裁决，不在本文件重写产品目标。

- **功能名**：C03 组件与布局语义化复用
- **来源**：`prd.md:238-255`（C03 卡全文）、`decision-log.md` 的 ADR-001 与 R-001～R-025、T1～T3；用户 2026-10-27 开工答复（`quality/evidence/human-confirmations/2026-10-27-002-build-plan-entry-defaults.md`）
- **状态**：草稿，待当前计划确认

## 速读卡（30 秒）

- **一句话需求**：让原型作者与实现者能讲清现有四类资产怎么用、能复用哪一份、哪里是真缺口，并在两条真实页面上实际用出来。
- **核心改动点**：
  - 四类对象各一条六字段台账：语义、约束与合法配法、来源、实现位置、消费者、未知。
  - 回测工作台与业务日志两条链，逐处写明 reuse／compose／gap，只补真缺口。
  - 五类任务相关反例各给可定位实例；`DOM`／视觉顺序冲突用渲染证据判。
- **最大影响面**：PaperBuilder 两条链的页面组件与布局；workflowhub 的共享资产检查段。
- **验收信号**：台账可回读、改动位置可追、反例可定位、640 像素下关键操作不被遮、外部能力项逐项有结论。

## P0 必留内容与落点

| 必留内容（P0） | 本节落点 | 状态 |
| --- | --- | --- |
| 目标场景/需求 | 3. 用户场景与状态覆盖；5. 功能需求 | written |
| 全局实现设计与边界 | 实现设计（全局权威）；10. 明确不做与默认必须成立 | written |
| 唯一 Appendix A 的成功失败/证据 | Appendix A — 验收判据（唯一权威） | written |
| 真实验收表面与排除 | 验收流程；测试标准；验收对象 | written |
| 关键依赖/风险/来源 | 来源与决策映射；实现设计的全局文件边界；12. 风险、未决与交接 | written |

## 材料导航（可再生成，非权威）

| 材料 | 用途 | 读取时机 |
| --- | --- | --- |
| `decision-log.md` 的 ADR-001、验收面、未决项 | 七包边界与五条验收的口径来源 | 开工前 |
| `quality/evidence/decision-log-refs/requirement-index.md` | R-001～R-025、T1～T3 逐条原义与来源锚 | 需要回读原话时 |
| `quality/evidence/decision-log-refs/coverage-matrix-5d.md` | 每项需求谁承接、缺口 G-01～G-18 | 判缺口归属时 |
| `quality/evidence/research/2026-10-27-internal-object-inventory.md` | 四类对象 `path:line`、七个具体问题、反例起点 | 写台账与反例时 |
| `quality/evidence/research/2026-10-27-external-design-code-mapping.md` | 外部工具与判据的可用性结论 | 判外部能力项时 |
| `prd.md:238-255` | C03 卡 16 字段原文 | 核量词与否定原文时 |
| `/Users/Hugh/Downloads/UI/src` | 设计组件与设计布局的真源 | 设计侧对象与对应时 |

## 来源与决策映射

| 来源 ID | 决定 ID | FR / AC | 状态 / 受影响范围 | 未决 / 交接 |
| --- | --- | --- | --- | --- |
| R-001、R-017、R-018 | ADR-001、ADR-002 | FR-C03-001、FR-C03-002 → AC-C03-1 | current；四类对象与真实调用 | OI-009／OI-010 的分母见 PFACT-002、PFACT-011 |
| R-002、R-006 | ADR-002 | FR-C03-001 → AC-C03-1 | current；台账六字段 | 无 |
| R-003 | ADR-002 | FR-C03-002 → AC-C03-2、AC-C03-3 | current；import／route／孤儿 | 无 |
| R-004、R-007、T2 | ADR-001 | FR-C03-003 → AC-C03-2 | current；两条链选择点 | OI-006 已定案；OI-007 条件性 |
| R-005 | ADR-001 | FR-C03-004 → AC-C03-6 | current；交 C08 清单 | G-10 由 AC-C03-6 补齐 |
| R-008、R-019、R-023 | ADR-001 | FR-C03-005 → AC-C03-3 | current；五类反例 | 第五类归 P4 |
| R-009、R-010 | ADR-001 | FR-C03-006 → AC-C03-4 | current；两层检查与三状态 | PFACT-008 是唯一运行前提风险 |
| R-016、R-021 | ADR-001 | FR-C03-007 → AC-C03-7 | current；共享资产检查段 | G-07 由 P6 定位行段 |
| R-011、R-020、R-023、R-024 | ADR-001、ADR-003 | FR-C03-008 → AC-C03-5 | current；五个外部能力项 | G-05、G-14、G-18 |
| R-011（全量清单）、R-016、R-021、U-001 用户答复 | ADR-001、ADR-003、用户 2026-10-27 答复 | FR-C03-009 → AC-C03-8 | current；全量外部引用逐项台账与登记角色 | 计数口径按实数 8／23／23／66（原件标称 124，逐项 120；差异见研究原件「计数差异」） |
| R-012、R-013、R-014、R-015、R-022、R-025 | ADR-001 | 无独立 FR；作 FR-C03-001～008 的边界 | 流程与边界，见第 10 节 | G-12、G-16 |
| T1、T3 | ADR-001、ADR-002 | 包序与设计源，作 FR-C03-001 的输入 | current | 设计批准仍 unknown（PFACT-009） |

说明：R-010、R-011 的用户原话未外置，本源以 `decision-log.md:78-79` 的转述为准，不冒充逐字原文；R-011 在 PRD 无对应条文（已核 `prd.md:255`）。

## 1. 需求解释：问题与紧迫性

PaperBuilder 前端已有 81 个生产组件、约 10 条路由和 37 个设计源组件，但「名字」和「实际用法」已经分叉：`EquityCurve` 有三处不同语义，`BacktestWorkbench` 只被测试引用、生产零消费者，设计源里 `PerfBlocks` 复用了 `EquityCurve`，代码 `perf-blocks.tsx` 却内联重画了同一条曲线。新来的人读目录会以为自己在复用，实际在重造。

本卡先让现状能被说清，再让现状在两条真实页面上被用出来。只交一份目录或映射表不算完成：判定要求每个复用／组合选择带用途依据和实际使用点。

「规范一致」在本卡的含义：资产语义、合法配法与真实消费者在规范层可核。它**不**要求与设计源像素或几何等同，用户 2026-10-27 明确「不用完全保证和设计一致当验收结论」。PRD 侧无该术语，也未设像素阈值（`prd.md:128`「不新增任意像素百分比门槛」、`:580` 无限像素完美排除继续有效），映射允许非 1:1（`:83`、`:242`）。

## 2. 背景、目标与范围

### 背景

- workflowhub 本仓没有前端应用：`.tsx/.jsx/.vue/.svelte/.css` 全仓为 0，`specs/design`、`specs/frontend` 不存在。真实页面只能在 PaperBuilder（`decision-log.md` 事实表）。
- PaperBuilder `main` 现为 `c9d17631`，有 8 项未提交（5 改＋3 未跟踪）；本卡从该提交拉独立分支与工作树，不带入未提交内容。
- 设计真源是 `/Users/Hugh/Downloads/UI`（用户 2026-10-27 指定，`src` 下 37 个 `.tsx`）。Figma／Code Connect 需付费席位与库文件，本卡不可用；Storybook 在 PaperBuilder 未证存在。
- 共用技能 `skills/frontend-component-quality/SKILL.md` 已有 Component Quality Map 与 Static quality check 两部分；本卡只碰资产侧。

### 目标

- 四类对象在声明范围内各自可回读：语义、约束与合法配法、来源、实现位置、消费者、未知。
- 两条链上每个复用／组合／缺口选择都有用途依据与实际使用点，缺口处只做最小改动并交得出改动位置。
- 五类反例各有可定位实例；`DOM`／视觉顺序冲突有渲染证据。
- 五个外部能力项逐项有「采用／按需／不采用＋理由」，并记四处登记状态。
- 外部引用的全量清单（原件标称 124，逐项 120）在 PRD 里逐项有 ID、卡、能力、方式、落点、owner、现状与 catalog 指针；本卡自己的项真正落地并完成登记。

### 范围内

四类对象的语义与真实调用、两条链的真实复用与最小修补、任务相关反例、页面层三状态与 640 像素检查、交 C08 的受影响对象清单、共享资产检查段写入、外部能力项收口，以及 PRD 的外部引用逐项台账与四处登记方法。

## 3. 用户场景与状态覆盖

### SCN-001：实现者要复用回测工作台布局

- **角色**：要改回测页的 PaperBuilder 开发者。
- **前提**：`App.tsx:200-206` 的 `isWorkbench` 分支渲染 `BacktestWorkbenchScreen`；页面即布局，没有单独的 layout 包层。
- **触发**：查「回测工作台由哪些组件组成、哪些是共享的」。
- **结果**：从台账读到 `workbench-screen.tsx` 的组合点与子组件路径;共享项（`AppTopbar`、`ui/equity-curve`）与局部项（`WorkbenchChartPanel` 等）分开列，未知项写明查不到的原因。
- **回写**：台账补该链条目后，同步本节与 `AC-C03-1` 的证据指针。

### SCN-002：实现者要复用业务日志布局

- **角色**：要加业务日志筛选或行交互的开发者。
- **前提**：`App.tsx:129-131` 的 `BusinessLogRoute` 渲染 `BusinessLogPage`；布局在 `business-log-page.tsx:171-193`（`business-log-shell` ＋ `AppTopbar` ＋ `business-log-main`）。
- **触发**：查「日志页外壳归谁、能不能只换表格」。
- **结果**：台账给出外壳、表格滚动容器、抽屉三层的归属与约束；设计侧无对应独立页（设计里 BusinessLog 是 Board 内 tab），差异如实标为对应关系而非缺陷。
- **回写**：同 SCN-001。

### SCN-003：同名异义被当成同一份资产

- **角色**：按名字搜索组件的开发者。
- **前提**：`ui/equity-curve.tsx:27`（points／formatters）、`workbench-panels.tsx:28`（positions／report）、设计源 `EquityCurve.tsx:28`（seed／width／height）。
- **触发**：想复用「权益曲线」。
- **结果**：三处各记独立语义与 prop 形状，不得合并；选择依据写用途，不写名字。
- **回写**：对应 `AC-C03-3` 的同名异义条目。

### SCN-004：孤儿组件被当作现行实现

- **角色**：读代码判断「回测表单在哪」的开发者。
- **前提**：`backtest-workbench.tsx:168` 的 `BacktestWorkbench` 生产零消费者，只被 `f13-security.test.tsx:3`、`backtest-workbench.test.tsx:7` 引用；真实页面组件是 `workbench-screen.tsx`。
- **触发**：按文件名找入口。
- **结果**：台账标出「无生产消费者＋保留原因查不到」，并指向真实入口；未知不记零。
- **回写**：对应 `AC-C03-3` 的未知消费者条目。

### SCN-005：窄容器下关键操作被遮

- **角色**：在 640 像素宽视口使用回测页或日志页的人。
- **前提**：两条链的窄屏终点都是既有 `@media (max-width: 640px)`：`ui/workbench-page.css:79`、`:582`、`:6221`、`:6736`；`ui/business-log-page.css:77`、`:119`，另有 `:106` 的 920px 一档。这是现有查询，不是本卡新设阈值；`specs/design/layouts.md:84` 逐字要求「不写新的默认查询阈值」。工作台里的 `min-width` 只以区间出现（681／721／901／961），全仓不存在 `min-width: 640px`。
- **触发**：打开页面并执行关键操作（提交回测、筛选日志、打开详情）。
- **结果**：关键操作元素在视口内可见且可点；被遮时记为缺口并修，修不了记 unknown 与 owner。
- **回写**：对应 `AC-C03-4`。

### SCN-006：外部能力项要不要引

- **角色**：维护共享前端规范的作者。
- **前提**：PRD `:582-601` 的清单目前是「每卡一行」；2026-09-04 的原件给出四组：①8 整包、②23 行（24 技能）概念、③23 参考、④66 不引；整包落地 0/8；`skills/catalog.yaml` 的登记路径指向不存在的文件（G-18）。
- **触发**：决定本卡把哪些外部方法写进共享技能、哪些不采用，并把全量清单的归属写成可核的账。
- **结果**：PRD 变成逐项台账，每项有来源、版本、许可、范围、方式、落点、四处登记状态与 owner；本卡自己的项真正落地；没有承接卡的项被单列出来。
- **回写**：对应 `AC-C03-5` 与 `AC-C03-8`。

### 状态覆盖清单

- [x] **默认态**：SCN-001、SCN-002 的常规加载完成态。
- [x] **空态**：SCN-002；日志页无记录走 `AsyncStatePanel` 的「暂无可展示的业务日志」，台账记该分支归属。
- [x] **错误态**：SCN-002；日志页 `resolvedState.kind === "error"` 分支带「重新加载」`UiAction`。
- [x] **加载态**：SCN-001、SCN-002；两条链都由 `LazyRouteBoundary` 给加载与错误壳。
- [x] **取消态**：SCN-001；回测任务取消／重试由 `backtest-workbench.test.tsx` 锁住的行为覆盖，页面层按「适用取消恢复」取证。
- [x] **边界态**：SCN-005；640 像素宽。
- [x] **权限态**：N/A — 本卡不改认证与权限；两条链的读权限沿用既有服务端行为。
- [x] **竞态**：N/A — 本卡不新增共享可变状态；`LazyRouteBoundary` 的 `key`／`resetKey` 重建属既有行为，只作为顺序与状态重建反例记录。

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：真实页面在 PaperBuilder，两条链路由已核实。
  - **状态**：`verified`
  - **证据或来源**：`App.tsx:129-131`（`BusinessLogRoute`）、`App.tsx:200-206`（`isWorkbench` 分支渲染 `BacktestWorkbenchScreen`）；2026-10-27 只读核对。
  - **关联**：FR-C03-003、AC-C03-2、AC-C03-4

- **PFACT-002**：PaperBuilder `frontend/src` 共 268 个 `.tsx`，生产 81、测试 187。
  - **状态**：`verified`
  - **证据或来源**：`decision-log.md` 事实表（`find . -name '*.tsx'` 直接清点，2026-10-27）。
  - **关联**：FR-C03-001、AC-C03-1；分母声明见 G-17

- **PFACT-003**：`BacktestWorkbench`（`backtest-workbench.tsx:168`）生产零消费者，但同模块的 `BacktestTopControls`（`:378`）有活消费者。
  - **状态**：`verified`
  - **证据或来源**：相对／别名／默认／动态 import、字符串引用与 index 重导出均已核（`src/index.ts` 不存在）：生产侧只有 `ui-contract.ts:1`、`workbench-header.tsx:3` 的 `BacktestTask` 类型引用；组件本体只被 `f13-security.test.tsx:3`、`backtest-workbench.test.tsx:7` 等 17 处测试直连。`BacktestTopControls` 由 `workbench-screen.tsx:22` 导入、`:2400` 渲染。两者不得混为一谈。
  - **关联**：FR-C03-002、FR-C03-005、AC-C03-3

- **PFACT-004**：`EquityCurve` 有三处不同语义。
  - **状态**：`verified`
  - **证据或来源**：`ui/equity-curve.tsx:27`（`points`，生产 5 处导入：`strategy-equity.tsx:3`、`current-market-workbench.tsx:17`、`workbench-panels.tsx:5`、`strategy-history-data.tsx:28`、`simulation-records-page.tsx:32`）、`workbench-panels.tsx:28`（`positions`，生产侧无外部导入者，只有同文件 `:82` 与 `workbench-screen.test.tsx:5`）、`/Users/Hugh/Downloads/UI/src/components/EquityCurve.tsx:28`（`seed/width/height`，设计源 5 处导入）。三处语义不等价，名字相同不构成复用依据。
  - **关联**：FR-C03-002、FR-C03-005、AC-C03-3

- **PFACT-005**：两条链的窄屏终点是既有 `@media (max-width: 640px)`，不是 `min-width`。
  - **状态**：`verified`
  - **证据或来源**：`ui/workbench-page.css:79`、`:582`、`:6221`、`:6736`；`ui/business-log-page.css:77`、`:119`（另有 `:106` 的 920px）；`workbench-screen.test.tsx:230` 用 `lastIndexOf("@media (max-width: 640px)")` 切块后断言窄屏样式，`equity-block-responsive-scope.test.tsx` 用 CSSOM 在 390／1280 求值。全仓 `min-width: 640px` 零命中。
  - **关联**：FR-C03-006、AC-C03-4

- **PFACT-006**：workflowhub 本仓没有可运行前端，页面层证据只能来自 PaperBuilder。
  - **状态**：`verified`
  - **证据或来源**：`decision-log.md` 事实表（全仓前端文件为 0）与 2026-10-27 只读清点。
  - **关联**：FR-C03-006、AC-C03-2、AC-C03-4

- **PFACT-007**：外部整包落地 0/8；`skills/catalog.yaml` 的 adopted 路径指向不存在的文件。
  - **状态**：`verified`
  - **证据或来源**：`prd.md:599`、`:601`（G-18）；`skills/catalog.yaml:1123`、`:1126-1127` 实测不存在，真实文件在 `skills/frontend-component-quality/upstream/react-best-practices/AGENTS.md`（21 行、860 字节）。
  - **关联**：FR-C03-008、AC-C03-5

- **PFACT-008**：两条链在本机能启动并完成关键操作。
  - **状态**：`inferred`
  - **证据或来源**：代码、依赖（`node_modules` 已装）、`vite`／`vitest`／`playwright` 可执行都在，但本阶段尚未实际启动页面。推断，不是观察事实。
  - **限制**：若启动失败，AC-C03-4 记 unavailable 并按部分交付回问用户，不伪造通过。
  - **关联**：FR-C03-006、AC-C03-4、RISK-01

- **PFACT-009**：设计源是否已获批准、绑定到哪个版本。
  - **状态**：`unknown`
  - **证据或来源**：PB `specs/design/README.md:13` 逐字「当前 Downloads/UI 可读，不证明批准」；`specs/design/layouts.md:16`、`craft.md:86` 只记可读，未记批准；用户 2026-10-27 只指定来源，未声明批准。
  - **负责人、影响**：用户或 PB 设计 owner；本卡不拿「与设计一致」当验收依据，只核规范一致。
  - **关联**：FR-C03-001、AC-C03-1、RISK-02、OPEN-01

- **PFACT-010**：`.equity-line/.equity-fill/.equity-foot` 这套共享曲线样式的单一 owner。
  - **状态**：`unknown`
  - **证据或来源**：4 份 CSS、3 个页面域分别拥有（内部原件 `:159`）；只有真要改这套样式时才需要裁决。
  - **负责人、影响**：用户或 PB 样式 owner；不裁决时只能记 unknown，不改该 CSS。
  - **关联**：FR-C03-003、AC-C03-2、RISK-03、OPEN-02

- **PFACT-011**：设计源 `.tsx` 的 37 与 35 是不同范围，不是同一口径的冲突。
  - **状态**：`verified`
  - **证据或来源**：`/Users/Hugh/Downloads/UI/src` 全量 37 个 `.tsx`＝顶层 2 个（`main.tsx` 之外另 1）+ `components/` 目录 35 个（2026-10-27 直接清点）。
  - **关联**：FR-C03-001、AC-C03-1；原先的「两说」记录作废，理由写在本条

- **PFACT-012**：组件层的「取消恢复」语义。
  - **状态**：`not_applicable`
  - **理由**：PRD 的取消恢复源自页面层状态清单（`prd.md:124`），组件层无独立定义；本卡只在有任务生命周期的链上按既有行为取证（回测任务取消／重试），不新造资产层取消语义。
  - **关联**：FR-C03-006、AC-C03-4

## 5. 功能需求

### 四类对象的语义台账（C03-TRACE）

台账是全部下游判断的输入：实现者按它找入口，审查者按它判覆盖。台账只写两条链用到的对象，其余保留分母。

- **FR-C03-001**：声明范围内每个对象各有一条可回读记录，至少含语义、约束与合法配法、原来源、实现位置、消费者、未知六项；未知必须写「为什么查不到＋该找谁」。未覆盖的对象连同分母一起写理由。
  - **范围边界**：四类对象各按声明范围；不展开 27 个未核设计组件的代码对应。
  - **依据**：R-002、R-006、R-017、R-018（`prd.md:241`、`:243` C03-F1、`:244` AC-C03-1）；ADR-002
  - **场景**：SCN-001、SCN-002
  - **验收**：AC-C03-1

- **FR-C03-002**：核对真实 `wrapper`／`export`／`import`／`route` 与直接、间接使用；不得从设计 `property` 反造代码 `prop`；同名不同义、同名异库各自记录且不合并。
  - **范围边界**：符号级核对，不用正则结果冒全库扫描；动态引用未核要写未核。
  - **依据**：R-003（C03-F2）、R-018、R-022；`prd.md:242`、`:245`
  - **场景**：SCN-003、SCN-004
  - **验收**：AC-C03-1、AC-C03-2、AC-C03-3

### 真实页面里的复用与组合（C03-REUSE）

本卡要真改页面，不是只验证既有用法；但只补真缺口，不为凑改动而动文件。

- **FR-C03-003**：两条链上每个 reuse／compose／gap 选择都有用途依据与实际代码或设计使用点；局部布局不强抽共享组件；改动位置可用「分支＋改动文件清单＋逐处对台账」追回。
  - **范围边界**：只两条链；不碰 PaperBuilder 发布流程；共享曲线样式未获 owner 裁决时只记 unknown。
  - **依据**：R-004、R-007、R-013（C03-F3、AC-C03-2、落地对象选择）；ADR-001
  - **场景**：SCN-001、SCN-002、SCN-005
  - **验收**：AC-C03-2

### 任务相关反例（C03-EXAMPLE）

反例是判定资产「能不能被用对」的证伪手段，不是素材收集。

- **FR-C03-005**：五类反例（同名异义、非法 variant 或 slot 漏内容、陈旧映射、未知 consumer、`DOM`／视觉顺序冲突）各给可定位实例或「本卡范围无实例」的有据结论；未知使用点不记零，视觉相似不记 API 一致。
  - **范围边界**：前四类静态可判；第五类必须渲染证据；修复不在本 FR 内。
  - **依据**：R-008（AC-C03-3）、R-019、R-023；`prd.md:244`、`:252`
  - **场景**：SCN-003、SCN-004
  - **验收**：AC-C03-3

### 页面层可用性与两层检查（C03-PAGE）

资产层与页面层分别判：台账对不能代替页面成功，页面绿也不能替台账。

- **FR-C03-006**：两条链在正常／失败／适用取消恢复下可用；组件与布局各有资产层与页面层检查；640 像素宽下关键操作不被遮；不拿 story 或孤立组件代替页面成功。
  - **范围边界**：视觉与可见性只用真浏览器；不跑全量回归；不替台账判资产层。
  - **依据**：R-009（AC-C03-4）、R-010、R-019；`prd.md:244`
  - **场景**：SCN-005
  - **验收**：AC-C03-4
  - **场景覆盖依据**：E-03与现 spec 的具名操作按并集执行，操作及取消语义见 P4 的 L1。确认004逐字答复只有「确认，继续」；其“接受 E-03”解释与旧交接“接受 fixture 口径”解释相反，已读外置原件未取得前一展示的逐字原件，特定口径选择记 unknown，不据作者解释删掉已有操作。

### 交 C08 的受影响对象（C03-HANDOFF）

- **FR-C03-004**：给出一张受影响对象清单，每项含对象、触发点与可定位位置，C08 按清单能定位到对象；不人工双写精确 API 或 token。
  - **范围边界**：字段级契约留给规格阶段之后的 C08；不承担持续变更链。
  - **依据**：R-005（C03-F4）、R-015（更新能力归 C08）
  - **场景**：SCN-001、SCN-002
  - **验收**：AC-C03-6

### 共享资产检查段（C03-SHARED-SEG）

- **FR-C03-007**：把台账里的资产语义写成 `skills/frontend-component-quality/SKILL.md` 的资产检查段，先交资产输入部分给 C06，不改工程检查段，不新建规范目录。
  - **范围边界**：只改资产侧；工程侧（Static quality check）归 C06；不新增检查器。
  - **依据**：R-016、R-021（`prd.md:249`、`:250`）、R-017
  - **场景**：SCN-006
  - **验收**：AC-C03-7

### 外部能力项的逐项收口（C03-EXTERNAL）

- **FR-C03-008**：对 PRD `:590` C03 行的五个外部能力项逐项给「采用／按需／不采用＋理由」，并记录四处登记状态；不搬整包，不把 21 行派生摘要当完整源，未核实的能力按不可用写。
  - **范围边界**：不引入整包；本卡 C03 登记条目与 G-18 路径修正由 P7 承接（确认003），P6仅写资产段；C06其它条目与整包保持只读。
  - **依据**：R-011、R-020、R-023、R-024；`prd.md:584`、`:590`、`:599`、`:601`
  - **场景**：SCN-006
  - **验收**：AC-C03-5

### 外部引用的逐项台账与登记（C03-EXTERNAL-LEDGER）

- **FR-C03-009**：PRD 的外部引用清单从「每卡一行」改成「每个外部能力一行」的逐项台账，每行八个字段：稳定 ID、所属卡、能力原名、引用方式、落点（文件＋稳定节）、owner、现状、catalog 指针（来源、版本、许可只在 `catalog.yaml`，不在 PRD 重复）。对原件里 ①8／②23／③23／④66（原件标称 124，逐项实数 120）的每一项给出承接卡或「无承接卡＋建议 owner」；同时把「新增或变更外部内容时谁负责写哪一处」写成角色分工，而不是把同一事实抄四份。本卡自己判为采用或按需的项，必须在资产段与登记处真正落地，不能只写结论。
  - **范围边界**：只写 PRD 的该节与属于 C03 的登记条目；C06 的 8 条整包只标「C06 未立项」与 owner，不代做；不改 `skills/external/` 的整包内容。
  - **登记角色（不新增第四份权威）**：PRD 该节＝计划台账（哪张卡引什么、现状）；`skills/catalog.yaml`＝唯一机器权威（来源、版本、许可）；`skills/reuse-registry.md` 与人读索引＝指针；`AGENTS.md`＝导航一行。依据 `docs/adr/0046-single-source-registration-authority.md:7`、`GLOSSARY.md:217-218`；PRD `:584` 的「四处同改」原句需按此分工改写，改法由本卡执行并留记录，不新增第四份登记权威。
  - **依据**：U-001 用户答复（`decision-log.md:90-100`）、R-011、R-016、R-021；`prd.md:582-601`；用户 2026-10-27 答复「全改、按实数」
  - **场景**：SCN-006
  - **验收**：AC-C03-8

## 6. 模块划分

需求捆绑多个可独立验收的能力，按下面六个模块分开交付；依赖单向无环。

- **语义台账（C03-TRACE）**：负责把四类对象的现状变成可回读记录。对外提供台账原件与分母声明。依赖：PaperBuilder 只读与设计源只读。测试边界：每条记录有六个字段，未知带责任人与原因。
- **真实页面复用（C03-REUSE）**：负责在两条链上做选择与最小修补。对外提供改动后的分支状态与逐处对账。依赖：语义台账。
- **静态反例（C03-EXAMPLE）**：负责四类静态可判反例的可定位实例。对外提供反例台账。依赖：真实页面复用（原因：以改动后的当前状态为准）。
- **页面层检查（C03-PAGE）**：负责三状态、两层检查与窄容器。对外提供浏览器断言与定向测试证据。依赖：静态反例。
- **交下游（C03-HANDOFF）**：负责受影响对象清单。对外提供清单原件。依赖：真实页面复用与页面层检查。
- **规范与外部收口（C03-SHARED-SEG、C03-EXTERNAL、C03-EXTERNAL-LEDGER）**：负责共享资产检查段写入、五个外部项逐项结论、以及全量外部引用的逐项台账与四处登记。对外提供段内正文、逐项记录与登记后的文件状态。依赖：语义台账（写段）、逐项结论（台账的 C03 行）、资产段（收口核对）。合并理由：外部结论与全量台账是同一判定对象、同一消费者，拆开会让同一判据判两次。

## 7. 关键实体

- **资产记录（四类各一）**：
  - **定义**：一个真实对象在台账中的一行。
  - **字段和约束**：语义、约束与合法配法、来源、实现位置、消费者、未知；未知必填「为什么查不到」与「该找谁」；`path:line` 只作定位，漂移不判记录失效。
  - **关系**：一条记录可对应多条反例；一条反例只归一类。
- **复用选择（reuse／compose／gap）**：
  - **定义**：两条链上一处具体用法决定。
  - **字段和约束**：用途依据、真实使用点、选择结果三选一、改动位置或「无缺口」。
  - **关系**：每个选择引一条资产记录。
- **反例**：
  - **定义**：一处能被指到具体位置的错误用法或误认风险。
  - **字段和约束**：类别、`path:line` 或渲染证据、为什么算反例、影响面。
  - **关系**：前四类静态判，第五类必须有渲染证据。
- **受影响对象条目**：
  - **定义**：交给 C08 的一行更新输入。
  - **字段和约束**：对象、触发点、定位；不写字段级 API 或 token 值。

## 8. 数据和生命周期

- **数据粒度**：一个对象一行；一条链一组选择；一个反例一条。
- **数据时效**：台账以开工时读到的真实代码为准；代码后续变动不改写已存原件，新事实另存。
- **缺失或迟到**：对象查不到就记 unknown 与责任人；不补默认值、不猜路径。
- **预览与正式**：本卡不产预览态数据；页面检查用真实页面与真实状态。
- **当前与历史**：决策阶段原件只读；本阶段新增证据各存一份，不覆盖历史。
- **归属与清理**：台账与证据归本任务证据目录；PaperBuilder 侧只留代码与 `specs/` 正文，不留临时工件。

## 9. 兼容性预留

- **既有消费方**：PaperBuilder 既有路由、组件 props 与样式命名保持；两条链的对外行为不因最小改动而变。workflowhub 侧既有 `frontend-component-quality` 读者（C06、实施者）按原节读，资产段只增不改工程段。
- **命名预留**：不新增 public 组件名；不把局部布局抽成共享组件。
- **容器预留**：N/A — 不新增持久化容器或运行时对象。
- **状态预留**：不新增状态机；页面状态沿用既有 `UiAsyncState`。
- **扩展边界**：本卡只保证两条链与声明范围；其余对象保留分母，不承诺全库语义。

## 10. 明确不做与默认必须成立

### 明确不做

本节是唯一非目标清单；上游批准的排除逐条继承，不重复。

- 不建跨项目统一组件库、不做万能中间表示（IR）、不做全库或全项目语义整理（`prd.md:253`；R-014）。
- 不新建组件库或第二套设计系统，不新建 workflowhub 的设计或前端规范目录（R-016、ADR-001）。
- 不改 PaperBuilder 的发布流程配置（R-013）。
- 不承担持续变更链与更新能力——那是 C08 的能力，本卡只交更新输入（`prd.md:248`；R-015）。
- 不做原创设计方案——那是 C05（`prd.md:241`）。
- 不搬任何外部整包：8 条整包归 C06（当前 0/8、未立项），本卡只做逐项台账与属于 C03 的登记（R-011、`prd.md:599`）。
- 不新增第二个检查器或第二个登记权威：登记以 `skills/catalog.yaml` 为唯一机器权威（ADR-0046、GLOSSARY.md:217-218）；任务内的证据检查脚本只服务本卡。
- 不把 27 个未核设计组件的代码对应纳入本轮；不把 81 个生产组件里未覆盖的 69 个算作已整理（G-03、G-17）。
- 不把「与设计完全一致」当判据：本卡只判规范一致，不判像素或几何等同（用户 2026-10-27 答复；`prd.md:128`、`:580`）。
- 不把旧覆盖表当四对象 16 格：`prd.md:605-610` 的 16 格只作对照，本卡逐个对象声明覆盖与否，不宣称 16 格已齐（R-022）。

### 默认必须成立

- 只覆盖两条链用到的对象；未覆盖的保留分母并写理由（G-17）。
- 未知必须带「为什么查不到＋该找谁」，不记零、不记「无」。
- 名称相同不构成复用证据；同形异义、同名异库、陈旧映射不合并（`prd.md:242`）。
- 视觉与可见性只用真浏览器取证；story 或孤立组件不能代替页面成功（`prd.md:244`）。
- 窄屏判据引用两条链既有的 `@media (max-width: 640px)`，不新设阈值（`specs/design/layouts.md:84`）。
- 页面层检查不跑全量回归，只跑受影响面，未知影响面如实记（AGENTS 测试硬规则）。
- 每个 Phase 的写入集只含本 Phase 申报的精确路径；共享路径由先写者交回状态。
- 质量事实缺失（unavailable／unknown／incomplete）不阻断同任务修复，也不被写成通过。

## 验收流程

从 `decision-log.md` 的 `## 验收面` 取可观察接口与成功失败边界（AC-C03-1～4＋外部引入逐项），按 SCN 入口定位 FR、`Appendix A` 同号 AC、所属 Phase 的 `gate_cmd` 与可回读证据；条件原件按该日志的外置事实索引回读。本节只描述流程，不复制判据。

## 测试标准

开工前四要素（验证层、命令或数据、预期结果、失败条件）逐条落在各 Phase 卡片；本节声明测试面与 oracle，命令留在所属 Phase。

项目测试面与本卡适用性：

- **静态核对面**（适用）：台账字段、`path:line` 可回读、同名异义不合并、反例可定位。oracle：`ORACLE-C03-LEDGER`，判法是逐条对照真实文件；证据类型是台账原件与核对输出。
- **定向单元测试面**（适用）：受影响组件与页面的既有测试在改动后仍通过，并为缺口修法写目标测试。oracle：`pnpm --dir frontend exec vitest run src/<目标文件>` 退出 0；命令形态取自 `Makefile:61-64` 与 `frontend/src/toolchain-pnpm.test.ts:30-35` 的统一口径（根 `package.json` 仍用 `npm --prefix`，与本卡无关，不碰）。证据是原始输出。
- **类型与构建面**（适用）：`pnpm --dir frontend run typecheck` 与 `pnpm --dir frontend run build`。oracle 是退出 0；证据是原始输出。构建面只针对被改动的链做一次，不跑全量回归。注：`frontend/package.json:6-19` 没有 `test` 与 `lint` 脚本，vitest 配置在 `frontend/vite.config.ts:19-31`，无独立 `vitest.config.ts`。
- **真浏览器页面面**（适用）：两条链在 640 像素与桌面宽度下的关键操作可见性与可点性；主测试技能 `skills/isolated-browser-qa/SKILL.md`，oracle：关键操作元素边界不越视口且 `visible`。
- **浏览器端到端回归面**（不适用）：PaperBuilder 的 `test:e2e` 与 `test:t01` 等 playright 套件依赖真实后端与夹具，本卡不改后端；改为定向页面断言，理由是不跑与本卡无关的全量回归。若后续需要，由 C07 承担。
- **设计源比对面**（部分适用）：只核规范一致与语义对应，不核像素；理由见第 1 节与 PFACT-009。
- **无障碍面**（有限适用）：沿用既有 `ui/primitives` 的焦点与 `Escape` 行为测试，不新增全站 audit；理由是本卡不改交互模型。

### 验收对象

```json
{
  "workspace": "/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c03-semantic-reuse-20261026",
  "service": "PaperBuilder frontend（Vite 7 + React 19），`pnpm --dir frontend exec vite --port <端口>` 本地服务",
  "route": "/?strategy_version_id=<id>&workbench=1 与 /business-logs 两条链",
  "state": "正常、失败、适用取消恢复；页面试次含 640 像素与桌面宽度",
  "viewport": "640×900 与 1440×900",
  "owner": "用户"
}
```

三源适用性（本卡为 UI）：`raw_requirement` = 用户 2026-10-27 答复与 PRD C03 卡，`ui_scope: true`；`project_inventory` = PaperBuilder 真实路由与组件清单，`ui_scope: true`；`planned_or_changed_frontend_fact` = 本 spec 的实现设计节，`ui_scope: true`。三源均为 true，因此走 Web 五项对象，不走 CLI 分支。

对象检查按模板唯一 `checkAcceptanceObject` 执行，输入与返回存 `quality/evidence/acceptance-object/`。

## 架构边界

产品边界：本卡的产品产出是「能被读懂的资产说明＋能被验证的真实用法」，不是组件库或设计系统。工程边界：真实代码改动只发生在 PaperBuilder 两条链；workflowhub 侧只改共享技能的一个段。设计、代码、API、布局各有原 owner，本卡维护的是对应与选型契约，不接管资产质量。

## 实现设计（全局权威）

### 代码锚点

行号是生成时刻快照，会漂移，不作契约；契约面是点名的符号与行为语义。

- **来源边界**：PRD 与 `decision-log.md` 只作来源映射，不在本节建第二份需求账本。
- **现状与目标差异**：现状是「名字可搜、语义不清、复用靠猜」；目标是每个对象有记录、每条链有选择、每类反例有实例。
- **读取顺序**：先读 `frontend/src/App.tsx` 的路由分派（`:129-131` 业务日志、`:192-206` 回测分支），再读两条链的页面组件（`workbench-screen.tsx`、`business-log-page.tsx:171-193`），再读共享原语（`ui/primitives.tsx:19/38/71/86/101/105/138/185/221`），最后读设计源 `/Users/Hugh/Downloads/UI/src/components/`。
- **代码锚点**：
  - 回测链：`App.tsx:14` 懒加载 `./workbench-screen` → `:205` 渲染 `BacktestWorkbenchScreen`（`workbench-screen.tsx:575`）→ `:2573` 的 `WorkbenchScreen` 是布局壳（`<main className="app pb-ui-app pb-ui-workbench-screen">`）。组合点：`WorkbenchHeader`（`workbench-header.tsx:35`，用于 `:2383`）、`BacktestTopControls`（`backtest-workbench.tsx:378`，用于 `:2400`）、`WorkbenchChartPanel`（`workbench-chart-panel.tsx:72`，用于 `:2414`）、`WorkbenchTabs`（`workbench-tabs.tsx:41`，用于 `:2447`）、`WorkbenchPerformancePanel`／`WorkbenchPositionList`（`workbench-panels.tsx:58`／`:121`，用于 `:2472`／`:2478`）、`WorkbenchPositionDrawer`（`workbench-overlays.tsx:57`，用于 `:2504`）、`WorkbenchDialogs`（`workbench-dialogs.tsx:38`，用于 `:2545`）。页面即布局，没有单独的 layout 包层。
  - 业务日志链：`App.tsx:129-131` 的 `BusinessLogRoute` → `business-log-page.tsx`（`BusinessLogPage` 默认导出 `:220`，布局外壳在 `BusinessLogView:152` 的 `:171-193`，`BusinessLogFilters` `:196`、`BusinessLogRow` `business-log-components.tsx:52`、`BusinessLogDetailDrawer` `business-log-components.tsx:82`）。
  - 共享与孤儿：`ui/equity-curve.tsx:27`（共享曲线）、`workbench-panels.tsx:28`（同名 wrapper）、`backtest-workbench.tsx:168`（孤儿组件，`BacktestTopControls` 在 `:378`）、`perf-blocks.tsx:76`（`ValueCurve` 内联重画，`:63` `seededValues`）、`app-topbar.tsx:256`。
  - 设计源：`/Users/Hugh/Downloads/UI/src/components/EquityCurve.tsx:28`、`PerfBlocks.tsx:2`（import 复用）、`Board.tsx:248`（业务日志在 Board 内 tab）。设计源是 Figma Make 导出的 Vite 原型：组件全部 default export，无测试、无类型检查脚本，`src` 只有 `components/` 与 `imports/`，token 只在 `index.css:5-8` 的 `@theme`。
  - 规范源：PB `specs/design/components.md`（`PB-COMP-ROOT` 起）、`specs/design/layouts.md`（`PB-LAYOUT-RESPONSIVE:79`）、`specs/design/README.md`（`PB-NORM-SOURCES:1`）、`specs/frontend/frontend.md`（`PB-FE-RENDER:34`）、`specs/frontend/ui-quality.md`。目录层面 `frontend/src` 没有 `components/` 与 `layouts/`：共享组件在 `ui/`，布局由各页面文件的壳承担。
- **运行条件**：Node 与 pnpm 已装；PaperBuilder `frontend/node_modules` 存在，`tsc`／`vitest`／`vite`／`playwright` 可执行；端口由执行者自选并记入证据。本阶段未执行任何命令，命令可用性的依据是脚本字面存在与二进制存在，不是运行结果。

### 接口与失败语义

- **选择的架构方案**：复用既有页面与组件，只补真缺口；共享资产语义写进既有技能的一个段，不新建组件库或规范平台。放弃「新建统一语义层」的做法，理由是没有第二个真实消费者，属无收益新增。
- **模块职责**：台账消费只读代码与设计源 → 选择消费台账 → 页面检查消费真实页面 → 清单与收口消费前序产物。四者都不裁决质量。
- **接口与数据流**：只读源码／设计源 → 台账（六字段） → 两条链的选择与最小改动 → 浏览器断言与定向测试 → 受影响清单 → 共享段与外部项结论。无新持久化，无运行时状态。
- **失败语义**：页面起不来、浏览器不可用、对象查不到、共享样式无 owner 时，如实记 unavailable／unknown 并写明 owner 与下次动作；不重试到底、不用截图替代、不把未知当零。
- **新增控制面**：N/A — 使用既有技能段、既有测试与既有证据目录，无新控制面。

### 全局文件边界与依赖

路径前缀约定：`PB` = `/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c03-semantic-reuse-20261026`（分支 `task/PaperBuilder/workflowhub-ui-frontend-c03-semantic-reuse-20261026`，基线 `main@c9d17631`）；`WH` = 本任务认证工作树 `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c03-semantic-reuse-20261026`；`EV` = 任务库 `quality/`。

- **新增**：
  - `WH/specs/workflowhub-ui-frontend-c03-semantic-reuse-20261026/spec.md`（本文件，已存在）
  - `WH/specs/workflowhub-ui-frontend-c03-semantic-reuse-20261026/phases/P1-四类对象台账.md`
  - `WH/specs/workflowhub-ui-frontend-c03-semantic-reuse-20261026/phases/P2-两条链复用与组合.md`
  - `WH/specs/workflowhub-ui-frontend-c03-semantic-reuse-20261026/phases/P3-静态反例.md`
  - `WH/specs/workflowhub-ui-frontend-c03-semantic-reuse-20261026/phases/P4-页面层验收.md`
  - `WH/specs/workflowhub-ui-frontend-c03-semantic-reuse-20261026/phases/P5-交下游受影响对象.md`
  - `WH/specs/workflowhub-ui-frontend-c03-semantic-reuse-20261026/phases/P6-共享资产检查段.md`
  - `WH/specs/workflowhub-ui-frontend-c03-semantic-reuse-20261026/phases/P7-外部引用台账与登记.md`
  - `WH/specs/workflowhub-ui-frontend-c03-semantic-reuse-20261026/phases/P8-全AC终末验收.md`
  - `WH/specs/workflowhub-ui-frontend-c03-semantic-reuse-20261026/phases/index.md`
  - `EV/evidence/…` 与 `EV/tests/…` 下的台账、反例、断言、清单、核对记录
- **修改**：
  - `PB/frontend/src/workbench-screen.tsx`（回测链，最小缺口）
  - `PB/frontend/src/business-log-page.tsx`（业务日志链，最小缺口）
  - `PB/frontend/src/ui/workbench-page.css`、`PB/frontend/src/ui/business-log-page.css`（仅当缺口需要样式；共享曲线类除外）
  - `PB/frontend/src/workbench-screen.test.tsx`、`PB/frontend/src/business-log-page.test.tsx`（为缺口写目标断言；只加不删既有用例）
  - `PB/specs/design/components.md`、`PB/specs/design/layouts.md`（项目语义，只追加两条链的对象，不重写已有段落）
  - `WH/skills/frontend-component-quality/SKILL.md`（仅资产检查段／`## Component Quality Map` 与新增资产检查小节）
  - `WH/specs/workflowhub-ui-frontend-release-20261020/prd.md`（只改「逐卡外部引用清单」一节：改成逐项台账 + 四处登记方法节；其它段落不动）
  - `WH/skills/catalog.yaml`（只加 C03 的派生参考条目与修 G-18 的路径；不碰 C01／C06 的条目）
  - `WH/skills/reuse-registry.md`（只加外部引用登记方法的指针行与 C03 行）
  - `WH/AGENTS.md`（只加规范索引里的一行外部引用指针）
- **禁止改动**：
  - `WH/skills/external/**` — 整包内容归 C06（当前 0/8、未立项），本卡不搬任何整包。
  - `WH/skills/frontend-testing`、`WH/skills/wh-review`、`WH/skills/ui-project-init` 等 ② 类宿主 — 它们的并入归后续卡，本卡只登记「宿主是否存在」。
  - `PB/frontend/src/ui/primitives.tsx` 与 9 个共享 primitive 的签名 — 改动会波及 `ui/ui-contract.test.ts` 与多处消费者；本卡只读。
  - `PB/frontend/src/backtest-workbench.tsx` — 孤儿组件，删或改都要独立决定与消费者证明；本卡只记录。
  - `.equity-line/.equity-fill/.equity-foot` 规则本身 — owner 未定（PFACT-010）；要改先取裁决。
  - `PB/frontend/package.json`、`PB/Makefile`、`PB/frontend/tsconfig.json`、`PB/frontend/vite.config.ts` — 工具链口径由 `frontend/src/toolchain-pnpm.test.ts` 门禁锁定；改它们会动门禁本身。
  - PaperBuilder 发布流程配置与 `pnpm-lock.yaml`。
- **全局依赖**：`PB` 工作树必须在 P1 开工前存在，命令 `git -C /Users/Hugh/Hugh/Project/PaperBuilder worktree add -b task/PaperBuilder/workflowhub-ui-frontend-c03-semantic-reuse-20261026 /Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c03-semantic-reuse-20261026 c9d17631`；基线必须是 `c9d17631`，未提交的 8 项不进分支。
- **文件归属**：`PB` 两条链的每个文件在任一时刻只有一个持笔者（P2）；`WH/skills/frontend-component-quality/SKILL.md` 只由 P6 写；P1 只读 `PB/specs/design/*` 以外的代码。
- **共享路径定序**：两条链由原P2 producer先写，P4验收writer对PB只读并取证，P5只读引用。当前P4的036实际恢复失败所引窄修待独立材料确认：仅原P2 implement独占workbench-screen.tsx及workbench-screen.lifecycle.test.tsx，交回后P4验收者再复验；这是同一producer职责，不整体放开P4源码写权，不重开P2／改AC。P1写PB/specs/design/components.md、layouts.md，P2只读它们补台账不重复写。
- **回滚与恢复**：改动只落在独立分支；回滚＝在该分支上 `git checkout -- <该文件>` 或 revert 单次提交，不丢弃其它改动、不改历史。

### 需求到任务追踪

从 `decision-log.md` 的 `## 验收面` 与 R-、U- 编号逐条核对；每个 Task 一行，列出来源、FR、AC、oracle 与判据。反向检查：每个 FR 至少一条 AC 与一个 Task，每个 Task 都有来源。

| 来源（decision-log / PRD） | 原义行为与强度 | FR | AC | Phase/Task | oracle 与判据 |
| --- | --- | --- | --- | --- | --- |
| R-001、R-002、R-006、R-017、R-018 | 四类对象各一条六字段记录，路径可回读；缺「未知」原因即失败 | FR-C03-001、FR-C03-002 | AC-C03-1 | `P1/T001` | ORACLE-C03-P1-LEDGER |
| R-002、R-003、R-018 | 设计侧记录与设计到代码对应两端可核；设计 property 当代码 prop 即失败 | FR-C03-001、FR-C03-002 | AC-C03-1 | `P1/T002` | ORACLE-C03-P1-LEDGER |
| R-004、R-007、R-013 | 回测链每个 reuse／compose／gap 有用途依据与真实使用点，缺口改动可追 | FR-C03-003 | AC-C03-2 | `P2/T003` | ORACLE-C03-P2-REUSE |
| R-003、R-004、R-007、R-013 | 业务日志链同上，整条 diff 逐处对上台账 | FR-C03-003 | AC-C03-2 | `P2/T004` | ORACLE-C03-P2-REUSE |
| R-008、R-019、R-023 | 四类静态反例各一条 `path:line`，或带检索范围的无实例结论 | FR-C03-005 | AC-C03-3 | `P3/T005` | ORACLE-C03-P3-STATIC-EXAMPLES |
| R-019、R-023 | 每条实例可回读、每个无实例结论有检索范围 | FR-C03-005 | AC-C03-3 | `P3/T006` | ORACLE-C03-P3-STATIC-EXAMPLES |
| R-009、R-010 | 回测链正常／失败／取消恢复三状态各有用例 | FR-C03-006 | AC-C03-4 | `P4/T007` | ORACLE-C03-P4-PAGE |
| R-009、R-010 | 业务日志链三状态各有用例 | FR-C03-006 | AC-C03-4 | `P4/T008` | ORACLE-C03-P4-PAGE |
| R-008、R-009、R-010 | 640 像素下全部具名关键操作可见可点，并有 DOM 与视觉顺序对照 | FR-C03-005、FR-C03-006 | AC-C03-3、AC-C03-4 | `P4/T009` | ORACLE-C03-P4-PAGE |
| R-005 | 清单每项有对象、触发点、定位，且有一次非作者读回 | FR-C03-004 | AC-C03-6 | `P5/T010` | ORACLE-C03-P5-HANDOFF |
| R-016、R-021 | 资产段小节可回读，工程段节级哈希不变 | FR-C03-007 | AC-C03-7 | `P6/T011` | ORACLE-C03-P6-ASSET-SEGMENT |
| R-011、R-020、R-023、R-024 | 五项逐条结论与各登记处状态可回读 | FR-C03-008 | AC-C03-5 | `P7/T012` | ORACLE-C03-P7-EXTERNAL |
| U-001、R-011、R-016、R-021 | 台账分母 8／23／23／66 对齐，四处登记各按角色可读 | FR-C03-009 | AC-C03-8 | `P7/T013` | ORACLE-C03-P7-EXTERNAL |
| R-011、U-001 | 八条 AC 各一行档位与证据指针 | FR-C03-001、FR-C03-002、FR-C03-003、FR-C03-004、FR-C03-005、FR-C03-006、FR-C03-007、FR-C03-008、FR-C03-009 | AC-C03-1、AC-C03-2、AC-C03-3、AC-C03-4、AC-C03-6、AC-C03-7、AC-C03-8、AC-C03-5 | `P8/T014` | ORACLE-C03-P8-ACCEPTANCE |

### 全局验证策略

- **验证策略**：行为面用「同一命令 RED→GREEN」加真浏览器断言；台账面用逐条对照真实文件的静态核对；外部面用逐项结论表。不证明跨卡效果，不替 C08 的更新能力。
- **RED/GREEN 设计**：每个 P2 改动的行为，先在 `frontend/src` 下写具名目标断言（例如某组件在 640 像素下无横向溢出），同一条 `pnpm exec vitest run <文件>` 先失败后通过；台账与文档面用可证伪的读回检查（字段齐、路径存在、同号一致），不制造仪式性 RED。
- **最终聚合**：P8 逐条消费 P1～P7 原件核对 AC-C03-1～8，只执行未闭环 case。
- **不能证明的内容**：不证明设计批准、不证明全库语义、不证明 C08 的更新链、不证明跨项目可搬运。

## Appendix A — 验收判据（唯一权威）

- [ ] **AC-C03-1**：四类对象在声明范围各自有可回读的语义、来源、实现位置与未知；只有名字或截图即失败。关联 FR-C03-001、FR-C03-002。
验证：读 `quality/evidence/` 的台账原件，逐条打开其 `path:line` 与设计源文件核对；对 81 个生产 `.tsx` 的分母与未覆盖清单核对理由；执行者是对照真实文件的人或脚本，输入是台账原件与仓库当前字节。
通过：四类对象各有记录且六字段非空；未知项带「为什么查不到＋该找谁」；分母与未覆盖理由可核；每条 `path:line` 指向真实存在的对象。
失败：任一对象缺语义或来源；只给名字、目录或截图；未知记为「无」；分母被省略；`path:line` 指向不存在的文件。
证据：台账原件 `quality/evidence/P1-ledger.json` 与分母声明；核对输出存 `quality/tests/`。

- [ ] **AC-C03-2**：两条链上每个复用／组合／缺口选择有用途依据与真实使用点，并交出改动位置；只有目录或映射文件即失败。关联 FR-C03-002、FR-C03-003。
验证：取 PaperBuilder 分支名与 `git diff --name-only`，逐处对台账条目；对「无缺口」的结论核其依据；执行者是实施者以外的人，输入是分支真实 diff 与选择记录。
通过：每个选择有用途依据、真实使用点与改动位置或明确无缺口；diff 中每处改动对得上台账条目；`.equity-*` 未被无裁决改动。
失败：只交目录或映射表；选择无用途依据；diff 有台账解释不了的改动；在本卡范围外改文件。
证据：分支名＋`git diff --name-only` 原件、逐处对账记录，存 `quality/evidence/P2-reuse.json`。

- [ ] **AC-C03-3**：五类任务相关反例各能定位，或给出「本卡范围无实例」的有据结论；未知使用点当零、视觉相似当 API 一致即失败。关联 FR-C03-005。
验证：逐类读反例原件的 `path:line` 或渲染证据并打开原文核对；第三、四类若查实无实例，核其检索范围与结论；执行者是取证者以外的人。
通过：五类各有实例或具名无实例结论；静态四类有 `path:line`；第五类有渲染证据；未知项标未知。
失败：某类只写「无」而无检索范围；把未核当零；用视觉相似冒充 API 一致；`path:line` 不可回读。
证据：反例台账与检索范围记录，存 `quality/evidence/P3-counterexamples.json`。

- [ ] **AC-C03-4**：两条链在正常／失败／适用取消恢复下可用；组件与布局各有资产层与页面层检查；640 像素下关键操作不被遮；story 或孤立组件不能代页面成功。关联 FR-C03-006。
验证：用真浏览器在 640×900 与 1440×900 打开两条链，执行关键操作（回测：返回策略列表、重试定位、提交回测；业务日志：刷新列表、重置筛选／重新加载、加载更早日志、筛选日志、打开详情），读元素边界、可见性与真实交互结果；配定向 `vitest`；非作者做一次语义核对；执行者是实施者以外的人。
通过：正常、失败及适用取消恢复各有用例；P4逐项覆盖具名操作，按真实状态 owner 核取消与恢复，导航和重置只判其实际语义；关键操作可见可点；资产层与页面层各有一份证据；640 像素下无关键操作越视口或被遮。
失败：只交 story 或孤立组件；关键操作被遮；某状态无用例；用截图代替断言。
证据：浏览器断言输出与定向测试原始输出，存 `quality/evidence/P4-page.json` 与 `quality/tests/c03-browser-assertions.mjs` 的运行原件。

- [ ] **AC-C03-5**：PRD `:590` 的五个外部能力项逐项给「采用／按需／不采用＋理由」，并记录四处登记状态；不搬整包。关联 FR-C03-008。
验证：读逐项结论原件，对照 `prd.md:590` 的五项核对分母；核四处登记（PRD 表、`catalog.yaml`、`reuse-registry.md`、`AGENTS.md` 索引）各自状态；执行者是核对者，输入是结论原件与四处真实文件。
通过：五项各一行且理由具体；四处状态各写明「已更新／未更新＋owner」；未核能力标不可用。
失败：漏项；只写「不采用」无理由；把 21 行派生摘要当完整源；宣称已改 `catalog.yaml` 而实际未改。
证据：逐项结论与登记状态记录，存 `quality/evidence/P7-external.json`。

- [ ] **AC-C03-6**：交 C08 的受影响对象清单每项含对象、触发点与可定位位置，C08 按清单能定位；不双写精确 API 或 token。关联 FR-C03-004。
验证：按清单逐项在仓库中定位对象；另请一名未参与本卡的读者按清单复定位；执行者是复定位读者。
通过：每项都能定位；清单不含字段级 API／token 值；有读回复定位记录。
失败：任一项定位不到；清单复制了精确 API 或 token；无读回记录。
证据：清单原件与读回记录，存 `quality/evidence/P5-handoff.json`。

- [ ] **AC-C03-7**：共享技能资产检查段写入后可回读，且工程检查段未被改动。关联 FR-C03-007。
验证：读 `skills/frontend-component-quality/SKILL.md` 当前字节，对照改动前版本；核资产段内语义与台账一致、工程段（`## Static quality check`）逐字未变；执行者是未参与写入的读者。
通过：资产段含两条链的资产检查规则与来源标注；工程段无改动；无新建规范目录。
失败：改了工程段；新增第二个检查器或目录；段内语义与台账冲突。
证据：改动前后对照与读回记录，存 `quality/evidence/P6-shared-segment.json`。

- [ ] **AC-C03-8**：PRD 的外部引用清单是逐项台账（每个外部能力一行），四组分母按实数 8／23／23／66；每行八个字段（稳定 ID、卡、能力、引用方式、落点、owner、现状、catalog 指针）非空；「新增或变更外部内容时谁写哪一处」成文且不新增第四份登记权威。关联 FR-C03-009。
验证：读 `prd.md` 该节的当前字节，逐组核行数与 `quality/evidence/research/2026-10-27-external-citation-inventory.md` 的分母对齐；随机抽 5 行回核其上游来源与落点文件；核 `catalog.yaml`（机器权威）、`reuse-registry.md`（指针）、`AGENTS.md`（导航）三处是否各按角色存在对应内容，且 PRD 节没有冒充机器权威；执行者是未参与写入的读者，输入是四份文件、清单原件与审计原件。
通过：四组分母为 8／23／23／66 且逐项成行；每行八个字段非空（缺的写「未取得」或「无承接卡＋建议 owner」）；catalog 指针可解析；三处各按角色可读；方法节写的是「谁写哪一处」而非「同一事实抄四份」；C03 判为采用或按需的项在资产段与登记处都能找到。
失败：仍有「每卡一行」的粗表；行数与分母不符；有行缺字段且未标未取得；声称改了某处而该处无对应字节；把 PRD 节写成第二份机器登记；新增第四份登记权威。
证据：台账原件就是改后的 PRD 该节；对照与抽核记录存 `quality/evidence/P7-external.json`。

## 12. 风险、未决与交接

- **RISK-01**：两条链在本机跑不起来。
  - **受影响 ID**：PFACT-008、FR-C03-006、AC-C03-4
  - **触发条件**：`vite` 启动失败、服务端依赖缺失、页面白屏
  - **后果**：页面层证据取不到，AC-C03-4 只能记 unavailable
  - **缓解或停止**：先只读启动一次并记原始输出；不因失败改仓库配置。跑不起来就记 unavailable 并按部分交付回问用户
  - **处理阶段**：build-code P4
  - **验证**：启动输出与失败原因原件
- **RISK-02**：把「与设计一致」当验收依据。
  - **受影响 ID**：PFACT-009、AC-C03-1
  - **触发条件**：拿设计稿或截图当批准
  - **后果**：越过用户本次「只核规范一致」的口径
  - **缓解或停止**：判据只到规范层；视觉差异只作佐证
  - **处理阶段**：全部 Phase
  - **验证**：Appendix A 每条的验证行与证据
- **RISK-03**：改了共享曲线样式影响其它页面域。
  - **受影响 ID**：PFACT-010、FR-C03-003
  - **触发条件**：`.equity-line/.equity-fill/.equity-foot` 被改
  - **后果**：`current-market-workbench`、`simulation-pages`、`strategy-pages`、`workbench-page` 四个域的视觉与行为受冲击
  - **缓解或停止**：不改该套样式；要改先取 owner 裁决，否则记 unknown
  - **处理阶段**：build-code P2
  - **验证**：diff 中不含该套选择器
- **RISK-04**：把 PRD 台账当成第二份登记权威，或反过来只改 PRD 就宣称「已登记」。
  - **受影响 ID**：PFACT-007、FR-C03-008、FR-C03-009、AC-C03-5、AC-C03-8
  - **触发条件**：把同一份来源事实抄进 PRD、catalog、registry、AGENTS 四份；或只改 PRD 就宣称落地
  - **后果**：与 `docs/adr/0046:7`、`GLOSSARY.md:217-218` 的「一处机器权威、来源三层、不新增第四份登记」冲突，并制造四份会互相漂移的副本
  - **缓解或停止**：按角色分工写：PRD＝计划台账、catalog＝机器权威、registry／人读索引＝指针、AGENTS＝导航；PRD `:584` 的原句按此改写并留记录
  - **处理阶段**：build-code P7
  - **验证**：PRD 节里没有冒充机器权威的内容；catalog 条目可解析；三处指针可读
- **OPEN-01**：设计源批准与绑定状态（PFACT-009）
  - **负责人**：用户或 PB 设计 owner
  - **影响**：不能拿设计一致当通过依据
  - **处理阶段**：不阻断；需要时问
  - **关闭条件或停止**：取得真实批准声明后才可改口径
- **OPEN-02**：共享曲线样式单一 owner（PFACT-010）
  - **负责人**：用户或 PB 样式 owner
  - **影响**：只有要改该样式时才影响 P2
  - **处理阶段**：build-code P2 开工时判
  - **关闭条件或停止**：取得裁决，或确认不改
- **OPEN-03**：已关闭。设计源 `.tsx` 的 37 与 35 是两个范围（顶层 2 + `components/` 35），不存在两说冲突；证据见 PFACT-011。原「P1 首日再清点一次」的动作保留为核对，不再是未决项。
- **RISK-05**：外部引用清单写完，但承接卡不存在，账目清楚了事还是没人做。
  - **受影响 ID**：FR-C03-009、AC-C03-8
  - **触发条件**：① 的 8 条整包挂在未立项的 C06；② 的 23 行宿主里有 3 个目录在现仓不存在；③ 的 23 项没有承接卡
  - **后果**：台账看起来齐了，但每一项都没有执行者，下一张卡仍要重新发现这件事
  - **缓解或停止**：逐项写「承接卡或『无承接卡＋建议 owner』」，不写成已安排；在交接与 PRD 里把「无承接卡」计数单列
  - **处理阶段**：build-code P7
  - **验证**：PRD 台账里每行的 owner 列；无承接卡的项数在交接里可回读
- **交接**：持续变更链与更新能力归 C08；原创设计归 C05；`catalog.yaml` 登记修归 C06 或规范同步；回测/日志以外的页面域不在本卡。

## 13. 业务影响与回归范围

### 两条链的页面行为

- **既有行为**：回测工作台与业务日志页按既有路由与状态机工作；`ui/primitives`、`ui/equity-curve` 的对外签名与行为不变。
- **本需求影响**：只补真缺口的最小改动；若某链查实无缺口，记部分交付并回问，不造改动。
- **回归路径**：改动后跑该链的既有测试（`workbench-screen.test.tsx`、`business-log-page.test.tsx` 必跑；`ui/equity-curve.test.tsx`、`ui/primitives.test.tsx` 仅在本卡实际改了对应文件时纳入 P2 的 gate）；另跑 `typecheck`；不跑全量。
- **验收**：AC-C03-2 的 diff 对账与 AC-C03-4 的页面断言。

- **可能受冲击的业务规则**：两条链的可见文案、行交互与任务生命周期状态；共享 primitive 的焦点行为只读检查。
- **明确无影响**：后端 API、发布流程、认证权限、其它页面域（本轮不碰）。

## 补充材料

- 决策与需求原义：`decision-log.md`、`quality/evidence/decision-log-refs/requirement-index.md`、`quality/evidence/decision-log-refs/coverage-matrix-5d.md`
- 内部盘点：`quality/evidence/research/2026-10-27-internal-object-inventory.md`
- 外部做法：`quality/evidence/research/2026-10-27-external-design-code-mapping.md`
- 规范落点：`quality/evidence/research/2026-10-27-norm-landing-and-index.md`
- 开工答复原件：`quality/evidence/human-confirmations/2026-10-27-002-build-plan-entry-defaults.md`
- 方向与细节审查原判：`quality/evidence/reviews/2026-10-27-c03-direction-review.md`、`2026-10-27-c03-detail-review.md`
