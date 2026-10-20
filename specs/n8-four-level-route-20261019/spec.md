# 功能规格：四级任务路线与单阶段轻交付

读者：本任务实施者、独立审查者、verify-code 验收者与后续维护者。
读完要能：定位四级入口判据、四套流程的步骤与材料、轻档实施与审查的接法、收口与验收判据，并区分已核实事实、推断与缺口。

> 基于已确认的 `decision-log.md` 与父 PRD。本文件承载产品行为与全局实现设计；
> Phase 文件只写各自增量，`phases/index.md` 只存指针。产品目标与已接受裁决回原 owner，不在本文件重写。

- **功能名**：四级任务路线与单阶段轻交付
- **来源**：`specs/n8-four-level-route-20261019/decision-log.md` 的 R-001…R-012、U-001…U-012、D-001…D-016、AC-ENTRY/FLOW/MAT/IMPL/CLOSE/REG/ACC；ADR-0051；父 PRD `specs/archive/skills-framework-redesign-20261014/prd.md:438-455`（N8 卡）与 `prd.md:38-49`、`prd.md:51-97`、`prd.md:257`、`prd.md:444-448`、`prd.md:451`
- **状态**：草稿；计划确认前不宣称已确认

## 材料导航

| 材料 / 锚点 | 用途 | 读取时机 |
| --- | --- | --- |
| `decision-log.md#级别与路线` | 唯一级别读取点；四级判据与用户选择 | 开工前；每级流程入口 |
| `decision-log.md#验收面` | AC 交接索引与失败条件 | 写验收、每 Phase 首判 |
| `decision-log.md#要改哪些文件` | 方向级写集与审查面取舍 | 规划与实施前 |
| `docs/adr/0051-light-tasks-complete-inside-make-decision.md` | 单阶段取舍与三项判据 | 改动材料/阶段身份前 |
| `workflows/make-decision/SKILL.md`、`workflows/make-decision/steps.json` | 现有复杂流程 15 步基线 | 改入口路由与流程前 |
| `runtime/task/material-workspace.mjs`、`tools/cli/stage-runtime.mjs` | 材料合同与审查/收口路由的当前实现 | P1/P2/P3 改动前 |
| `core/task-close.mjs`、`skills/stage-closeout/SKILL.md` | 物理交付与确认 stage | P3 改动前 |
| `quality/evidence/2026-10-19-001-n8-research-report.md` | 单阶段与审查身份的既有研究事实 | 设计争议时回读 |

## 速读卡（30 秒）

- **一句话需求**：让四级任务真的少跑不需要的阶段与步骤，同时把轻档的方案、实施、测试、审查与收口在定方向阶段内做完，且不伪造阶段事实。
- **核心改动点**：
  - `make-decision` 入口变路由器，按级别选四套流程；复杂流程沿用 N6 已交付 15 步。
  - 轻档（小改动/普通）在 `make-decision` 内写 spec 与 Phase、实施、跑目标测试；普通再做一次实现审，审查面直接复用 build-code。
  - 收口确认 stage 参数化，`stage-closeout` 接受定方向阶段调用者；冻结测试的改动走一次 TCR 并独立审查。
  - mini-task 独立路线退役，入口评估函数迁入 `make-decision` 并改名。
- **最大影响面**：入口路由、材料合同、审查身份、收口入口、技能目录与历史审查枚举。
- **验收信号**：四路受控任务逐格核调用；轻档的阶段/步骤/必读字节/人工确认低于同范围复杂档；轻档不写 build-code/verify-code 阶段行。

## 来源与决策映射

| 来源 ID | 决定 ID | FR / AC ID | 状态 / 受影响范围 | 未决 / 交接 |
| --- | --- | --- | --- | --- |
| `R-001` | `D-011` | `FR-ENTRY-001 / AC-ENTRY-1` | current；入口推荐 | 无 |
| `R-002` | `D-016` | `FR-ENTRY-001 / AC-ENTRY-1` | current；入口评估函数迁移 | 新函数名本文件定 |
| `R-003` | `D-011` | `FR-ENTRY-001 / AC-ENTRY-3` | current；四级推荐与升级降级 | 无 |
| `R-004` | `D-012` | `FR-CLOSE-001 / AC-CLOSE-1` | current；四级收口接线 | 单阶段收口代码归 P3 |
| `R-005` | `D-011` | `FR-ENTRY-001 / AC-ENTRY-1` | current；入口只用可得事实 | 无 |
| `R-006` | `D-003` | `FR-FLOW-001 / AC-FLOW-1` | current；四套流程 | 无 |
| `R-007` | `D-003` | `FR-FLOW-002 / AC-FLOW-2` | current；普通内部调研与 talk | 无 |
| `R-008` | `D-010` | `FR-REG-001 / AC-REG-1` | current；重判与升级 | 无 |
| `R-009` | `D-011` | `FR-ENTRY-002 / AC-ENTRY-2` | current；拿不准偏重 | 无 |
| `R-010` | `D-002` | `FR-FLOW-003 / AC-FLOW-2` | current；减负判据 | 受控任务待 P7 |
| `R-011` | `D-013` | `FR-ACC-002 / AC-ACC-3` | current；G1 与经验 | N1 成本窗口待准备 |
| `R-012` | `D-013` | `FR-ACC-002 / AC-ACC-4` | current；0 项新增外部采用 | N7 登记缺口未闭 |
| `U-001` | `D-001` | `FR-FLOW-001 / AC-FLOW-3` | current；标准路线 | 无 |
| `U-002` | `D-003` | `FR-FLOW-001 / AC-FLOW-2` | current；单阶段轻档 | 覆盖 prd:49 记录者判断 |
| `U-003` | `D-002` | `FR-ENTRY-002 / AC-ENTRY-4` | current；级别只写决策记录 | 无 |
| `U-004` | `D-004` | `FR-FLOW-001 / AC-FLOW-3` | current；N6 后实施 | N6 已合入 |
| `U-006` | `D-006` | `FR-IMPL-001 / AC-IMPL-2` | current；普通实现审 | 无 |
| `U-007` | `D-007` | `FR-IMPL-001 / AC-IMPL-2` | current；沿用 build-code 审查 | 无 |
| `U-008` | `D-008` | `FR-MAT-001 / AC-MAT-1` | current；轻档产 spec/Phase | 材料合同归 P1 |
| `U-009` | `D-009` | `FR-MAT-001 / AC-MAT-1` | current；验收按单阶段重述 | 无 |
| `U-010` | `D-011` | `FR-ENTRY-001 / AC-ENTRY-2` | current；默认复杂 | 无 |
| `U-011` | `D-003` | `FR-FLOW-001 / AC-FLOW-3` | current；入口路由 | 无 |
| `U-012` | `D-015` | `FR-ENTRY-001 / AC-FLOW-1` | current；四级共用 N6 优化 | 无 |
| `PRD-N8` | `D-012` | `FR-CLOSE-001 / AC-CLOSE-2` | current；各级交付收口归本卡 | TCR 归 P3 |
| `PRD-N8` | `D-016` | `FR-SKILL-001 / AC-MAT-3` | current；31 共用与 mini 退役 | N7 登记缺口不代补 |
| `R-006` | `D-003` | `FR-FLOW-002 / AC-FLOW-4` | current；提问不设上限 | 无 |
| `R-010` | `D-002` | `FR-FLOW-003 / AC-FLOW-2` | current；轻档减负判据 | 受控任务待 P7 |
| `U-007` | `D-007` | `FR-MAT-002 / AC-MAT-2` | current；阶段身份不伪造 | 无 |
| `U-008` | `D-008` | `FR-IMPL-003 / AC-IMPL-1` | current；确认后实施与目标测试 | 无 |
| `U-007` | `D-007` | `FR-IMPL-002 / AC-IMPL-3` | current；小改动无独立审 | 无 |
| `U-008` | `D-008` | `FR-IMPL-003 / AC-IMPL-4` | current；测试失败不交付 | 无 |
| `R-004` | `D-012` | `FR-CLOSE-001 / AC-CLOSE-3` | current；经验每次写 | 业务仓路径待真实收口 |
| `U-012` | `D-015` | `FR-CLOSE-002 / AC-CLOSE-4` | current；驾驶舱四类可用 | 小改动不建页为例外 |
| `U-012` | `D-015` | `FR-CLOSE-002 / AC-CLOSE-5` | current；驾驶舱落点与只读派生 | 页面生成归真实运行 |
| `R-008` | `D-010` | `FR-REG-001 / AC-REG-2` | current；升级只补缺 | 承接映射归 P6 |
| `R-009` | `D-011` | `FR-REG-002 / AC-REG-3` | current；降级需用户 | 无 |
| `R-009` | `D-011` | `FR-REG-002 / AC-REG-4` | current；风险未变不加审 | 无 |
| `U-005` | `D-013` | `FR-ACC-001 / AC-ACC-1` | current；四路真跑 | 受控任务待 P7 |
| `R-008` | `D-010` | `FR-ACC-001 / AC-ACC-2` | current；中途负例 | 负例执行待 P7 |
| `U-005` | `D-013` | `FR-ACC-001 / AC-ACC-5` | current；合法跳过声明 | 无 |
| `PRD-N8` | `D-013` | `FR-ACC-002 / AC-ACC-6` | current；依赖门 | N7 登记未闭 |
| `R-012` | `D-013` | `FR-ACC-002 / AC-ACC-7` | current；外部清单分母 | 真实消费待 P7 |

## 1. 需求解释：问题与紧迫性

四级任务今天只有一张分级表：小改动与普通任务被要求经 `build-code` 轻档承载实施，入口评估又要靠 mini-task 的独立路线；结果是轻任务并不真少跑，阶段、步骤与人工确认没有可核的下限，交付与收口也没接上。用户已确认改口：小改动与普通任务不进入任何其他阶段，方案、实施、测试与适用审查在 `make-decision` 内完成，同时保留文件流转（spec 与 Phase）、普通任务的一次实现审与四级各自的交付/收口/经验接线。没有这层改造，级别推荐只是纸面分类，轻档无法证明真的减负。

## 2. 背景、目标与范围

### 背景

`make-decision` 已由 N6 交付为三段式 15 步，并把四级定义/选择/路由/矩阵留给本卡。当前材料合同在 `make-decision` 只允许 `decision-log.md`，代码审查只认 `build-code`/`verify-code` 阶段，物理收口只挂 `build-prd`/`verify-code`，入口评估函数住在即将退役的 mini-task 技能里。ADR-0040/0041 已定「级别差异用阶段跳过与阶段内矩阵表达」，ADR-0051 记录本次单阶段取舍。依赖事实：N5 与 N6 已交付并合入；N7 的 catalog/notice/reuse 登记缺口未闭（PFACT-009、OPEN-001）。

### 目标

- 入口按交付/验收/用户故事复杂度给出四级推荐、高亮与理由，拿不准往重推，用户可覆盖，级别只写决策记录。
- 四套流程各有显式步骤集，均消费 N6 的调研、大纲、决策、收敛动作；复杂流程保持 15 步。
- 轻档在 `make-decision` 内产出 spec 与 1–2 个 Phase，确认后实施、跑目标测试；普通任务整次实施做一次实现审，审查面与 provider 同 build-code。
- 四级都能收口与交付；确认 stage 可传；经验每次写；驾驶舱按 N6 出页判据使用。
- mini-task 作为独立路线退役，入口能力迁入 `make-decision`。

### 范围内

入口分级与读取点、四套流程正文与步骤表、轻档材料与阶段身份、单阶段实现审、单阶段收口与 TCR、技能清单与退役、重判与升降级、四级验收与成本对照的准备。

## 3. 用户场景与状态覆盖

### SCN-001：小改动任务全流程

- **角色**：主会话与用户。
- **前提**：一个清楚的单点改动，无架构/迁移/权限/安全风险。
- **触发**：从 `make-decision` 起按推荐选小改动。
- **结果**：产极简 spec 与 1 个 Phase；一次确认后实施并跑目标测试；真实 diff 与声明写集逐条比对；反思收口后物理交付；全程只写 `make-decision` 一行阶段事实。
- **回写**：修复或验收后同步本节与 Appendix A 的 AC-IMPL-2、AC-MAT-1。

### SCN-002：普通任务全流程

- **角色**：主会话、独立实现审者与用户。
- **前提**：一个可独立交付验收的结果，但含真实实现。
- **触发**：入口推荐普通任务。
- **结果**：完整大纲、内部调研、`talk-with-zhipeng`、逐模块收敛；produce spec 与 1 个 Phase；方案审一次；一次确认后实施与测试；整次实施做一次实现审；收口与交付。
- **回写**：同步 AC-IMPL-1、AC-IMPL-2、AC-FLOW-2。

### SCN-003：复杂任务与规划任务

- **角色**：主会话与用户。
- **前提**：四级中较重或只出计划的路线。
- **触发**：入口推荐复杂或规划任务。
- **结果**：复杂流程走 N6 已交付 15 步并进入 `build-plan → build-code → verify-code`；规划流程两次确认、任务卡收敛、不产 spec/Phase、不做实施。
- **回写**：同步 AC-FLOW-3。

### SCN-004：中途扩层或出现未知风险

- **角色**：实施者与用户。
- **前提**：实施后真实 diff/影响超出原判级，或出现原判级没有的风险。
- **触发**：实施者按真实改动与影响证据判断。
- **结果**：暂停该路径，用真实证据重新推荐，回用户真实选择；升级只补未做步骤与适用审查，已写代码补一次代码审；不重做已完成调研。
- **回写**：同步 AC-REG-1、AC-REG-2。

### SCN-005：用户要求降级

- **角色**：用户与主会话。
- **前提**：用户明确要求降到更轻级别。
- **触发**：用户真实选择。
- **结果**：记录理由与新范围后生效；代理只能建议，不自动降级；风险未变时保持原档且不擅自加审。
- **回写**：同步 AC-REG-3、AC-REG-4。

### SCN-006：目标测试失败

- **角色**：实施者。
- **前提**：轻档实施后目标测试非零。
- **触发**：真实执行记录显示具名断言失败。
- **结果**：暂停物理交付，修到目标测试通过；无法修时保材料与失败原件，回到用户选择，不把失败任务交付。
- **回写**：同步 AC-IMPL-4。

### SCN-007：驾驶舱出页与更新

- **角色**：主会话与任务读者。
- **前提**：四级任一路线推进到骨架确认、包细化、范围变化或 Phase 定稿/收口。
- **触发**：到达 N6 出页判据或更新时点。
- **结果**：按出页判据生成或更新页面与同名 `.nodes.json`；小改动不建页是具名例外；未产生的内容写「尚未产生＋到时会填什么」；页面只读派生。
- **回写**：同步 AC-CLOSE-4、AC-CLOSE-5。

### 状态覆盖清单

- [ ] **默认态**：SCN-001–SCN-003 的无风险任务
- [ ] **空态**：轻档尚未产生 Phase 或驾驶舱内容时，材料按缺口写明，不造占位；见 SCN-007
- [ ] **错误态**：SCN-006 目标测试失败；SCN-004 风险扩层
- [ ] **加载态**：N/A — 本任务无异步界面或加载视图
- [ ] **取消态**：取消保留当前材料与未答项，不回滚已完成产物；见 SCN-004
- [ ] **边界态**：普通任务 1–2 个 Phase；超过一个可独立交付验收单元时应推荐规划；见 SCN-002
- [ ] **权限态**：确认、授权与最终 close 仍由用户独占；代理不改已确认方向；见 SCN-005
- [ ] **竞态**：同一页面与同一材料由唯一写主串行更新，不新增并发控制面；见 SCN-007

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：`make-decision` 当前材料只允许 `decision-log.md`，写 spec/phases 会被拒绝
  - **状态**：`verified`
  - **证据或来源**：`runtime/task/material-workspace.mjs:39-41`（stage 为 make-decision 时返回 `["decision-log.md"]`）；`tools/cli/stage-runtime.mjs:36-49`（post build-plan 才放行 spec/index/Phase）
  - **关联**：FR-MAT-001、AC-MAT-1、RISK-001
- **PFACT-002**：代码审查身份要求 `build-code`/`verify-code` 阶段且 post 需 spec、index 与 Phase 契约
  - **状态**：`verified`
  - **证据或来源**：`runtime/review/review-policy.mjs:67-99`；`tools/cli/stage-runtime.mjs:319-324`（phase scope 判定）、`:606-628`（post Phase 投影读取 spec/index/Phase 并核写集）
  - **关联**：FR-IMPL-001、AC-IMPL-2、RISK-002
- **PFACT-003**：审查记录保存为 `quality/reviews/` 下的原件，不由审查动作写阶段事实行；但质量投影要求审查结果的 stage 等于阶段行 stage
  - **状态**：`verified`
  - **证据或来源**：`tools/cli/stage-runtime.mjs:1256-1259` 的 `recordSimpleReviewRequest` 落盘路径；阶段行由 `runtime/task/task-store.mjs:69-76` 的 stage 写入承担，审查路径不调用它；`tools/cli/stage-runtime.mjs:1159` 的 `result.stage !== row.stage` 会抛出 `review result differs from current row identity`
  - **关联**：FR-MAT-002、AC-MAT-2、RISK-002
- **PFACT-004**：物理收口确认 stage 当前硬编码 `verify-code`
  - **状态**：`verified`
  - **证据或来源**：`core/task-close.mjs:402`（记录 confirmation 写 `stage: "verify-code"`）、`:413`（校验 `value.stage !== "verify-code"`）；`tools/cli/stage-runtime.mjs:1344`（只有 `--stage=verify-code` 才路由 close plan）
  - **关联**：FR-CLOSE-001、AC-CLOSE-2、RISK-003
- **PFACT-005**：有一份冻结契约测试把 stage-closeout 的可调用阶段钉在 `build-prd`/`verify-code`
  - **状态**：`verified`
  - **证据或来源**：`tests/contract/stage-closeout-skill.test.mjs:21`（`expect(new Set(entry.used_by_stages)).toEqual(new Set(['build-prd', 'verify-code']))`）
  - **关联**：FR-CLOSE-001、AC-CLOSE-2、RISK-003
- **PFACT-006**：入口评估函数当前住在 mini-task 技能内，被 N6 第 1/8 步与模板、测试消费
  - **状态**：`verified`
  - **证据或来源**：`skills/mini-task/scripts/mini-task-runner.mjs:91`；消费者 `workflows/make-decision/SKILL.md:40`、`workflows/make-decision/steps.json` 第 1 步、`skills/decision-log/templates/decision-log-template.md:93`、`skills/spec-plan/templates/phase-template.md:20`、`tests/integration/mini-task-delivery.test.mjs:5`
  - **关联**：FR-ENTRY-001、FR-SKILL-001、AC-ENTRY-1、AC-MAT-3
- **PFACT-007**：31 个跨级共用技能各只有一份 `skills/<name>/SKILL.md`，技能目录没有级别维
  - **状态**：`verified`
  - **证据或来源**：`skills/catalog.yaml`（`used_by_stages`，无级别字段）；`skills/reuse-registry.md`；N8 决策记录「M3 已知事实」与 `prd.md:95` 的 31 项分组
  - **关联**：FR-SKILL-001、AC-MAT-3、RISK-004
- **PFACT-008**：轻档实现审可用 `build-code` 的 phase 审查面记录整工作区 diff，且不产生 `build-code` 阶段行
  - **状态**：`inferred`
  - **证据或来源**：由 PFACT-002、PFACT-003 的代码阅读与 D-（单阶段实施与审查）方向推出；`tools/cli/stage-runtime.mjs:606-628` 在缺少 `phase_id` 时会因取不到写集而拒绝，需在 P2 放行；未在真实轻任务上实跑
  - **关联**：FR-IMPL-001、AC-IMPL-2、RISK-002
- **PFACT-009**：N7 的 catalog/notice/reuse 登记缺口仍在，约 42 项外部方法的真实消费数未测
  - **状态**：`unknown`
  - **证据或来源**：N8 决策记录「未决项」「关键事实」；`prd.md:97` 声明 31 是设计集合数、实际调用数未测
  - **负责人、影响**：N7 owner 闭登记；影响 AC-ACC-4、AC-ACC-6 的最终判定，不影响 P1–P6 实施
  - **关联**：FR-ACC-002、AC-ACC-4、OPEN-001
- **PFACT-010**：本机代码审查执行者可用，版本满足现有门槛
  - **状态**：`verified`
  - **证据或来源**：`ocr --version` 输出 `open-code-review v1.13.1`；门槛见 `skills/wh-review/SKILL.md` 的 `>=1.12.9`
  - **关联**：FR-IMPL-001、AC-IMPL-2
- **PFACT-011**：成本计量按阶段取样，当前 `make-decision` 会跳过 Phase 与 spec 的字节
  - **状态**：`verified`
  - **证据或来源**：`tools/cli/measure-main-agent-cost.mjs:340-342`（按 stage 取样，`make-decision` 只取阶段既有材料）；对照 `runtime/task/material-workspace.mjs:39-49`
  - **关联**：FR-FLOW-003、AC-FLOW-2、AC-ACC-3、RISK-005
- **PFACT-012**：三份冻结契约测试把 stage-closeout 的可调用阶段钉在 `build-prd`/`verify-code`
  - **状态**：`verified`
  - **证据或来源**：`tests/contract/stage-closeout-step-contract.test.mjs:1,77`（文件头声明 frozen/DO NOT TOUCH）；`tests/contract/stage-closeout-skill.test.mjs:21`；`tests/contract/delivery-closeout-charter-contract.test.mjs:38-40`；数据源 `skills/catalog.yaml:199`
  - **关联**：FR-CLOSE-001、AC-CLOSE-2、RISK-003
- **PFACT-013**：驾驶舱只有方法与模板，没有 runtime 生成器；`answer-as-page` 未进 make-decision 的 skill-deps，catalog 的 `used_by_stages` 为空
  - **状态**：`verified`
  - **证据或来源**：`skills/answer-as-page/SKILL.md:12,40,48`（出页判据与落点）；`skills/catalog.yaml:1121-1126`；`workflows/make-decision/skill-deps.yaml:1-35` 无该条目；调用点只有 `workflows/make-decision/SKILL.md:117`
  - **关联**：FR-CLOSE-002、AC-CLOSE-4、RISK-007

## 5. 功能需求

### 入口分级（ENTRY）

入口先用原始需求与七项真实风险推荐级别，第一次真实问答同时给出推荐、高亮与理由，用户可覆盖；级别、理由与选择只写决策记录，后续流程、实施/审查、收口与验收读同一节。

- **FR-ENTRY-001**：入口必须按「规划任务性质 → 交付/验收范围超过一个任务 → 任一架构/迁移/权限/安全风险 → 默认复杂 → 普通 → 小改动 → 事实缺失按复杂」的顺序推荐级别，并在同一决策记录写入推荐、理由、用到的入口事实与用户真实选择；判据只用入口可得事实，不得使用实施后才产生的 diff 或 Phase 数；入口评估复用现有函数与风险事实，不新增任务字段、不改 `TASK_TYPES` 受控值，关联 PFACT-006、SCN-001、AC-ENTRY-1
  - **范围边界**：包括判级、记录、读取点与函数迁移；不含按文件数/行数打分
  - **依据**：ADR-0040、ADR-0051、`prd.md:440-443`
  - **场景**：SCN-001、SCN-002、SCN-003
  - **验收**：AC-ENTRY-1、AC-ENTRY-2、AC-ENTRY-3
- **FR-ENTRY-002**：拿不准、事实缺失或用户未答时推荐复杂并保留未选事实；流程步骤、实施/审查、收口与验收各自读取「级别与路线」一节，读不到时按复杂路线处理并记缺口，不静默降档，关联 PFACT-006、SCN-001、AC-ENTRY-4
  - **范围边界**：包括读取点与失败行为；不含新增持久状态
  - **依据**：`prd.md:442`、`prd.md:49`
  - **场景**：SCN-001、SCN-005
  - **验收**：AC-ENTRY-2、AC-ENTRY-4

### 四套流程（FLOW）

`make-decision` 入口是路由器；选定级别后选用对应流程，四套流程各有显式步骤表，共用 N6 的调研、大纲、决策与收敛动作。

- **FR-FLOW-001**：入口按级别路由到小改动、普通、复杂、规划四套流程；复杂流程保持 N6 已交付 15 步；小改动与普通在阶段内完成方案、实施、测试、适用审查与收口；规划两次确认、不产 spec/Phase、不做实施；每套流程有可核步骤表与一次确认/两次确认的具名理由，关联 PFACT-006、SCN-001、AC-FLOW-1
  - **范围边界**：包括路由、步骤表、确认次数与流程文件；不含新增 stage
  - **依据**：`prd.md:44-49`、U-011、D-003
  - **场景**：SCN-001、SCN-002、SCN-003
  - **验收**：AC-FLOW-1、AC-FLOW-3
- **FR-FLOW-002**：四级都必须消费 N6 的调研、大纲、决策、收敛动作，深度可减、动作不可无；普通任务必须含内部调研与 `talk-with-zhipeng`；任何级别不写死问题数或轮数，收敛以真实未决清零为准，关联 PFACT-007、SCN-002、AC-FLOW-2
  - **范围边界**：包括流程内的动作顺序与深度；不含复制方法正文
  - **依据**：`prd.md:55-57`、U-012、D-015
  - **场景**：SCN-001、SCN-002
  - **验收**：AC-FLOW-1、AC-FLOW-2、AC-FLOW-4
- **FR-FLOW-003**：轻档实际调用的阶段、步骤、必读字节与人工确认必须低于同范围复杂档；跳过是不调用而不是空跑；小改动与普通的一次确认是对 N6 两次确认的降级，降级理由写在流程正文，关联 PFACT-001、SCN-001、AC-FLOW-2
  - **范围边界**：包括确认次数、调用与跳过事实；不含成本数值口径（归 N1）
  - **依据**：`prd.md:444-446`、D-003
  - **场景**：SCN-001、SCN-002
  - **验收**：AC-FLOW-2

### 轻档材料与阶段身份（MAT）

轻档在定方向阶段内写 spec 与 1–2 个 Phase，材料要能被确认、实施、实现审、收口与升级消费；阶段事实仍只有一行。

- **FR-MAT-001**：`make-decision` 材料合同必须允许写与读 `spec.md` 与 `phases/`；轻档产出 spec 与 1–2 个 Phase，承载目标、写集、验收、oracle 与测试命令；复杂流程材料需求不变；总则、材料合同、artifact 路由与相关测试同步登记该覆盖，关联 PFACT-001、SCN-001、AC-MAT-1
  - **范围边界**：包括材料允许集合与登记；不含新增材料类型
  - **依据**：U-008、D-008、D-014、`prd.md:49`
  - **场景**：SCN-001、SCN-002
  - **验收**：AC-MAT-1
- **FR-MAT-002**：轻档只记 `make-decision` 一行阶段事实；spec/Phase 是材料，不是阶段事实；不得伪造 `build-code`/`verify-code` 行；实现审记录挂 `build-code` 审查名下而任务阶段不变，报告写清差异，关联 PFACT-003、SCN-001、AC-MAT-2
  - **范围边界**：包括阶段行与审查记录的事实边界；不含审查身份新枚举
  - **依据**：U-007、D-007、D-016
  - **场景**：SCN-001、SCN-002
  - **验收**：AC-MAT-2

### 单阶段实施与审查（IMPL）

确认后实施，目标测试真实执行；普通任务整次实施做一次实现审，直接复用 build-code 的审查面、材料与 provider；小改动不设独立审查轴。

- **FR-IMPL-001**：普通任务的实现审必须使用 build-code 的审查面与材料/provider，覆盖整次实施的真实工作区 diff，记录挂 build-code 审查名下；任务阶段仍是定方向且不写 build-code 阶段行；报告写清「审查面是 build-code、任务阶段没跑 build-code」；不新增 mini 规则，关联 PFACT-002、PFACT-008、PFACT-010、SCN-002、AC-IMPL-2
  - **范围边界**：包括审查请求、材料与记录；不含新增审查阶段或 kind
  - **依据**：U-006、U-007、D-006、D-007、`prd.md:445`
  - **场景**：SCN-002
  - **验收**：AC-IMPL-2
- **FR-IMPL-002**：小改动不设独立审查轴，用目标测试回执与真实 diff 和声明写集的逐条比对兜底；越界写或测试失败如实记录，不混入通过结论，关联 PFACT-001、SCN-001、AC-IMPL-3
  - **范围边界**：包括写集比对与越界记录；不含新增审查通道
  - **依据**：D-006、AC-IMPL-3
  - **场景**：SCN-001
  - **验收**：AC-IMPL-3
- **FR-IMPL-003**：确认后实施；目标测试真实执行并留回执；目标测试失败时暂停物理交付，修到通过或取得用户明确的剩余风险接受并记录后才能继续，关联 PFACT-003、SCN-001、SCN-006、AC-IMPL-1
  - **范围边界**：包括实施顺序、测试回执与失败阻断；不含测试框架更换
  - **依据**：`prd.md:444`、D-008
  - **场景**：SCN-001、SCN-006
  - **验收**：AC-IMPL-1、AC-IMPL-4

### 收口与交付（CLOSE）

每次阶段末做反思收口（不做 Git）；物理交付在实现与审查完成后做（提交/推送/PR/合并/归档/清理）；确认 stage 可按实际阶段传；经验每次写；驾驶舱按 N6 出页判据使用。

- **FR-CLOSE-001**：物理收口必须接受定方向阶段的调用者：确认 stage 参数化、`stage-closeout` 增加定方向调用者、普通 PR 正文读 spec；不伪造 `verify-code`；冻结测试的改动走一次 TCR 并独立审查；反思收口与物理交付分开，同级四级各有交付、交接与经验接线，关联 PFACT-004、PFACT-005、SCN-001、AC-CLOSE-1
  - **范围边界**：包括确认 stage、调用者、PR 正文与 TCR；不含新增 stage
  - **依据**：`prd.md:441`、`prd.md:447-448`、D-012、E 模块取舍
  - **场景**：SCN-001、SCN-002、SCN-003
  - **验收**：AC-CLOSE-1、AC-CLOSE-2、AC-CLOSE-3
- **FR-CLOSE-002**：每次收口写业务仓 Improvements，无发现写具名依据；驾驶舱按 answer-as-page 出页判据与四类时点更新，小改动不建页是具名例外；页面与同名 `.nodes.json` 放在调用者指定位置，缺环标「缺」，未产生写「尚未产生＋到时会填什么」，顶部带决策记录指纹，页面只读派生，关联 PFACT-007、SCN-007、AC-CLOSE-4
  - **范围边界**：包括经验与页面时点/落点；不含新增进度账本
  - **依据**：U-012、D-015、N6 answer-as-page 交付
  - **场景**：SCN-007
  - **验收**：AC-CLOSE-4、AC-CLOSE-5

### 技能与退役（SKILL）

四套流程各自列必需/按需/跳过技能；跨级共用技能只有一份定义；mini-task 独立路线退役。

- **FR-SKILL-001**：四套流程正文各自列本级的必需/按需/跳过技能与未触发理由；按 31 个跨级共用技能逐项核对同名只有一份定义、没有 lite/level 副本；mini-task 的独立任务/工作树/交付路线、入口技能文件、catalog/reuse/skill-deps 条目、收口模式与相关集成测试退役删除；入口评估函数迁入 `workflows/make-decision/scripts/` 并改名，同步调用点与测试；历史 `mini_task.*` 审查身份与 schema 枚举按用户 Grill 选择删除，旧审查文件可能无法再校验作为已接受风险记录，关联 PFACT-006、PFACT-007、SCN-001、AC-MAT-3
  - **范围边界**：包括技能清单、迁移与删除；不含新增中央矩阵文件
  - **依据**：U-007、D-016、`prd.md:95-97`、`prd.md:447`
  - **场景**：SCN-001、SCN-003
  - **验收**：AC-MAT-3

### 重判与升降级（REG）

实施后真实影响超出原判级或出现未知风险时，按真实证据重新推荐并回用户选择；升级只补未做；降级需用户。

- **FR-REG-001**：实施者按真实改动与影响证据判断；发现跨层/未知风险时暂停该路径，用真实证据重新推荐并回用户选择；升级保留已完成的方向、方案、spec/Phase 与实施，只补未做阶段与适用审查，已写代码补一次代码审，不重做调研；同一决策记录追加变更并保留旧判断，关联 PFACT-008、SCN-004、AC-REG-1
  - **范围边界**：包括触发、记录与升级承接；不含自动改级
  - **依据**：`prd.md:442`、D-010、G 模块
  - **场景**：SCN-004
  - **验收**：AC-REG-1、AC-REG-2
- **FR-REG-002**：只有用户明确选择才降级，代理只能建议；风险未变时保持原级别与原路线，不因「看起来大」擅自加审，判断证据写进决策记录，关联 PFACT-008、SCN-005、AC-REG-3
  - **范围边界**：包括降级门槛与对照；不含审查方自行改级
  - **依据**：`prd.md:442`、D-010
  - **场景**：SCN-005
  - **验收**：AC-REG-3、AC-REG-4

### 验收与成本（ACC）

四级受控任务真实跑一遍，逐格核调用；中途负例与风险未变对照都要有；G1 用完整 N1 成本对照；外部方法按真实消费去重计数。

- **FR-ACC-001**：用仓库内受控任务真实跑小改动、普通、复杂、规划四路，逐格核必需/按需/跳过调用；不以外史回放或静态表代替；小改动中途扩跨层/未知风险要有重新推荐、用户选择与只补缺的真实负例；风险未变对照组保持原档且无独立审，关联 PFACT-009、SCN-004、AC-ACC-1
  - **范围边界**：包括受控任务、执行记录与负例；不含成本口径
  - **依据**：`prd.md:257`、`prd.md:444`、D-013、U-005
  - **场景**：SCN-001、SCN-002、SCN-003、SCN-004
  - **验收**：AC-ACC-1、AC-ACC-2、AC-ACC-5
- **FR-ACC-002**：G1 用完整 N1 成本对照同范围四级；外部方法按 31 个共用技能清单与 54 项采用表为分母逐项标触发/合法跳过/未交付，约 42 项是推导值不是新分母；N7 未登记项等登记后再验收、不记已消费；合法跳过写清跳过项、理由与规则依据，关联 PFACT-009、SCN-003、AC-ACC-3
  - **范围边界**：包括成本对照与外部清单；不含替 N7 补登记
  - **依据**：`prd.md:444`、`prd.md:448`、`prd.md:451`、`prd.md:97`
  - **场景**：SCN-003
  - **验收**：AC-ACC-3、AC-ACC-4、AC-ACC-6、AC-ACC-7

## 6. 模块划分

| 模块 | 负责什么 | 对外提供什么 | 依赖谁 | 本任务落地 |
| --- | --- | --- | --- | --- |
| 入口分级 | 推荐级别、理由、读取点 | 决策记录「级别与路线」与入口函数 | 现有风险事实与入口评估 | P4、P5 |
| 四套流程 | 路由与显式步骤表 | `workflows/make-decision/flows/` 与根清单 | N6 15 步、轻档材料与审查 | P5 |
| 轻档材料 | spec/Phase 的允许与登记 | 材料合同、artifact 路由、总则 | `material-workspace` 与 stage-runtime | P1 |
| 实现审 | 整次实施一次代码审 | build-code 审查面记录 | 审查策略、OCR、Phase 契约 | P2 |
| 收口交付 | 确认 stage、调用者、PR 正文 | `stage-closeout` 定方向入口与 TCR | `core/task-close`、冻结测试 | P3 |
| 技能与退役 | 技能清单与 mini 退役 | catalog/reuse/notice、迁移函数 | 现有目录与审查枚举 | P4 |
| 重判升降级 | 触发、记录、升级承接 | 流程正文中的重判节 | 真实 diff 与影响证据 | P6 |
| 验收与成本 | 四路真跑与对照 | 受控任务、运行手册、成本对照 | N1、N7 | P7 |

每个模块的测试边界：入口分级与流程按步骤表与可核事实验；材料与审查按合同测试验；收口按 close plan 与 TCR 验；退役按目录、schema 与测试验；验收按真实运行记录验。

## 7. 关键实体

- **级别**：
  - **定义**：小改动、普通、复杂、规划四级，独立于任务性质的 `TASK_TYPES`
  - **字段和约束**：只存在决策记录「级别与路线」一节；不进 `task.json`、不进阶段行
  - **关系**：一个任务恰一个级别；重判追加变更而不覆盖旧判断
- **流程步骤集**：
  - **定义**：每套流程的显式步骤表与产物、进下一步条件
  - **字段和约束**：步骤 slug 稳定；阶段事实仍一行；不新增 facts 字段
  - **关系**：根清单指向三套子流程；复杂流程留在根
- **材料集合**：
  - **定义**：某阶段允许读写的材料文件名
  - **字段和约束**：`decision-log.md`、`spec.md`、`phases/index.md` 与索引列出的 Phase 文件；不允许目录或 glob
  - **关系**：Phase 文件必须被索引列出，否则视为未索引材料
- **审查记录**：
  - **定义**：一次审查的原始 JSON 与 provider 事实
  - **字段和约束**：保存于 `quality/reviews/`；`review_origin` 只由阶段事实写入；审查动作不写阶段行
  - **关系**：轻档实现审记录挂 build-code 名下，任务阶段仍是 `make-decision`
- **收口确认**：
  - **定义**：用户对展示的 close plan 的逐字答复
  - **字段和约束**：`quality/evidence/human-confirmations/` 下的原件；stage 按任务实际阶段记录，不伪造
  - **关系**：close plan 与其确认绑定同一份字节与同一 remote 身份

## 8. 数据和生命周期

- **数据粒度**：一个任务一份决策记录、一份 spec、一组 Phase、若干审查原件与确认原件。
- **数据时效**：材料随阶段推进增量写入；历史材料只读；审查与确认原件不可改写。
- **缺失或迟到**：缺材料按缺口写具体项与 owner，不造占位；缺成本记录写「本阶段无记录」及原因，不填 0。
- **预览与正式**：spec/Phase 是计划材料，不是执行许可；审查、测试、证据是质量事实，不是继续工作许可证。
- **当前与历史**：历史 `mini_task.*` 审查身份与原件按 D-016 删除枚举、保留原件；旧审查文件可能无法再校验，作为已接受风险。
- **归属与清理**：任务材料与工作区归任务；最终 close 的归档/删除走一次真实范围确认，代理不代办。

## 9. 兼容性预留

- **既有消费方**：复杂流程的材料需求、pre/history 的 `plan.md`/`tasks.md` 只读路径、既有审查身份（除 `mini_task.*`）与 build-code 审查质量不变。
- **命名预留**：入口函数在 `workflows/make-decision/scripts/entry-evaluation.mjs` 改名后保持返回语义；`choices` 中的 mini 品牌随路线退役改名，旧值保留在历史决策记录。
- **容器预留**：N/A — 不新增持久化容器或第二进度账本。
- **状态预留**：阶段事实、审查结果与 close 确认的形状不放宽；只把确认 stage 从常量变为按实际阶段取值。
- **扩展边界**：本期不改 `TASK_TYPES`、不新增 stage、不改评分逻辑；N9 的合法跳过事实仍走人读声明与现有阶段行。
- **历史枚举处理**：`mini_task.*` 审查枚举按 D-016 与 2026-10-20 用户再次确认删除；16 个历史任务、398 个 attempt/result 文件可能无法再校验，作为已接受后果记录。decision-log 的 F 模块汇总与 OI-006 仍写「只读保留」，与 D-016、AC-MAT-3 的删除口径不一致；本规格按 D-016 与最新交接执行，并在风险节保留该冲突与理由。

## 10. 明确不做与默认必须成立

### 明确不做

- 不新增 stage、评分 gate、第二进度权威、双写、永久兼容桥或历史运行分支；来源 `prd.md:132-134`、D-002。
- 不把轻档再分流到 `build-code`/`build-prd`/`verify-code`；来源 U-002/D-003（这是对 `prd.md:49` 记录者设计判断的显式覆盖）。
- 不新维护一份 mini-task 审查规则；来源 U-007。
- 不替 N7 补 catalog/notice/reuse 首次落点；来源 `prd.md:447`、PFACT-009。
- 不改 `skills/answer-as-page/*` 本体，只按其出页判据调用；来源 N8 决策记录「明确不写」。
- 不以「无 spec 省负担」：轻档产 spec 是为承接验收与写集，不是增加负担；来源 `prd.md:444` 与 D-008 并读。

### 本卡减法（G1）

本卡不是只加规则：删除 mini-task 独立路线（技能 3 个文件、审查 kind、close 模式、catalog/reuse/skill-deps 条目与约 10 个受影响测试），删除入口评估在旧技能里的归属；没有新增 stage、没有新增审查 kind、没有新增步骤运行时、没有新增第二进度对象。加法只有三套流程正文、一个入口评估模块与随之替换的测试。删减口径与依据见 decision-log D-016 与「退役登记」；净成本对照归 P7 的 G1（消费完整 N1），当前记 unavailable。

### 默认必须成立

- 轻档只写 `make-decision` 一行阶段事实；审查记录不产生 build-code 阶段行；关联 FR-MAT-002/AC-MAT-2。
- 目标测试失败不进入物理交付；关联 FR-IMPL-003/AC-IMPL-4。
- 拿不准、事实缺失、未答一律推荐复杂并保未选；关联 FR-ENTRY-001/AC-ENTRY-2。
- 任何级别不写死问题数或轮数；关联 FR-FLOW-002/AC-FLOW-4。

## 验收流程

从当前 `decision-log.md` 的 `## 验收面` 取 AC 编号与可观察接口，按本文件「来源与决策映射」定位 FR、`Appendix A` 的同号 AC、所属 Phase 的命令与可回读证据；到达条件满足时沿决策记录「外置事实索引」读唯一原件。本节只描述流程，不复制通过或失败判据。

## 测试标准

本任务测试面由本项目自行声明，路由档位只作技术预判：

- **材料合同面**：真实调用 `materialFilesForCohort` 与 stage-runtime artifact 分支，检查 `make-decision` 放行 `spec.md`/`phases/`、复杂流程需求不变；oracle 与新测试命令见 P1；覆盖 AC-MAT-1、AC-MAT-2。
- **审查路由面**：真实构造 post 轻任务上下文，调用 `review --action=record --stage build-code` 的请求组装与 `phaseReviewSourceProjection`，检查缺 `phase_id` 时返回整工作区 diff 且记录落在 `quality/reviews/`；命令见 P2；覆盖 AC-IMPL-2、AC-IMPL-3。
- **收口面**：真实调用 close plan 构建与确认路径，检查确认 stage 随实际阶段、`acceptedConfirmation` 接受同 stage、冻结测试按 TCR 更新；命令见 P3；覆盖 AC-CLOSE-1…3。
- **技能与退役面**：`checkSkillConsistency` 与目录/引用扫描，检查 31 共用单定义、mini 路线无当前消费者；命令见 P4；覆盖 AC-MAT-3。
- **流程步骤面**：读取 `steps.json` 与三套 flow 步骤表，检查 slug、产物与进入条件齐全，四级共用动作在场；命令见 P5；覆盖 AC-ENTRY-1…4、AC-FLOW-1…4。
- **重判面**：检查流程正文的触发、记录与升级承接节，及 build-plan 状态在轻档材料下的可读；命令见 P6；覆盖 AC-REG-1…4。
- **真实运行面**：四路受控任务、中途负例、风险未变对照、G1 与外部清单；由 P7 准备并在真实会话中执行；覆盖 AC-ACC-1…7。

浏览器可见面：本任务不新增浏览器界面；驾驶舱页面由 `skills/answer-as-page` 生成静态 HTML，其验收按页面读回与出页判据，不做浏览器端到端。

### 验收对象

本任务的对象是仓库内 CLI 与材料，不是 Web 页面。三源事实按实际材料核对：原始要求是四级路线与 CLI/流程行为，HTML 驾驶舱是既有生成器产物；当前库存没有前端应用、没有路由清单，只有 `skills/answer-as-page` 的静态模板；已接受计划不新增或修改任何前端文件。三项 `ui_scope` 均为 false 且理由有来源，故走 CLI 对象分支。

| 来源键 | ui_scope | 理由 | source_ref |
| --- | --- | --- | --- |
| `raw_requirement` | false | 用户原始要求是四级任务路线、轻档减负与收口，不是浏览器页面；驾驶舱是既有静态产物 | `raw_requirement` |
| `project_inventory` | false | 仓库无 `apps/`、无前端路由与组件消费者；`skills/answer-as-page/SKILL.md` 只产静态 HTML 与节点侧车 | `project_inventory` |
| `planned_or_changed_frontend_fact` | false | 本计划写集不含任何前端文件，P1–P7 不新增页面或组件 | `planned_or_changed_frontend_fact` |

CLI 分支对象（owner 缺省为用户）：

```json
{
  "workspace": "/Users/Hugh/Hugh/Project/workflowhub-n8-four-level-route-20261019",
  "state": "build-plan 已写 spec 与独立 Phase，待 build-code 按 Phase 实施",
  "cli": {
    "command": "node node_modules/vitest/vitest.mjs run tests/contract/light-material-set.test.mjs",
    "entry_ref": "entry",
    "sample_ref": "sample",
    "oracle_ref": "oracle"
  },
  "owner": "用户"
}
```

对象检查已按 `skills/spec-specify/templates/spec-template.md` 的唯一 `checkAcceptanceObject` 在 Node VM 空上下文执行一次：`ok=true`、`missing_fields=[]`；对象输入、三源引用与实际读取范围/内容 hash、返回结果与执行原件保存在任务证据 `quality/evidence/2026-10-20-001-build-plan-acceptance-object.json`。`ok=true` 只证明最小字段存在，不证明业务或环境效果。命令与样本取自 P1 的真实测试与受控夹具，oracle 指向本规格的验收判据。

## 架构边界

产品边界是四级任务路线、材料与审查的可观察行为；工程边界是 `runtime/` 的材料、审查与阶段事实，`tools/cli/` 的公共命令，`workflows/` 的方法正文。全局架构方案在「实现设计」维护，各 Phase 只承接自身差异。

## 实现设计（全局权威）

### 代码锚点

- **来源边界**：PRD 与决策记录只作来源映射，不在实现设计中另建需求账本。
- **现状与目标差异**：现状是 `make-decision` 只许 `decision-log.md`（PFACT-001）、代码审查只认 build-code/verify-code（PFACT-002）、收口确认钉死 verify-code（PFACT-004）、入口函数住在 mini-task（PFACT-006）；目标是放开轻档材料、让轻档实现审复用 build-code 面、把确认 stage 参数化、把入口函数迁走并退役 mini 路线。
- **读取顺序**：先读 `runtime/task/material-workspace.mjs` 的 `materialFilesForCohort`，再读 `tools/cli/stage-runtime.mjs` 的 `isDesignArtifact`、`phaseReviewSourceProjection`、`confirm` 分支；收口读 `core/task-close.mjs` 的 `buildDefaultPrDescription`、`confirmClosePlan`、`acceptedConfirmation`；退役读 `skills/mini-task/scripts/mini-task-runner.mjs` 与 `runtime/review/review-policy.mjs`。
- **代码锚点**：`materialFilesForCohort(activationCohort, materials, { stage })`（`runtime/task/material-workspace.mjs:39`）；`isDesignArtifact(stage, name, activationCohort)`（`tools/cli/stage-runtime.mjs:42`）；`phaseReviewSourceProjection(context, request, source, attachmentRoot, reviewReadScope)`（`tools/cli/stage-runtime.mjs:606`）；`confirmClosePlan({ taskDir, planRef, outcome, replyText })`（`core/task-close.mjs:398`）；`acceptedConfirmation(c, planRef, confirmationRef, expectedPlan)`（`core/task-close.mjs:411`）；`evaluateMiniTaskScope(input)`（`skills/mini-task/scripts/mini-task-runner.mjs:91`）。行号是生成时刻快照，会漂移，不作契约。
- **运行条件**：Node `v24.14.0`；测试经 `node node_modules/vitest/vitest.mjs run <files>`；代码审查执行者 `ocr v1.13.1`。

### 接口与失败语义

- **选择的架构方案**：扩展现有材料合同与审查/收口路由，把轻档能力接进现有 owner，不新增 stage、不新增审查 kind、不新增进度对象；mini 路线删除，入口能力迁入 `make-decision`。
- **简化自检**：按 `skills/simplicity-guard/SKILL.md` 的核心问题核过——这一层是否挣得其位、能否由既有能力承载。结论是：材料、审查、收口都复用现有 owner 的窄扩展（材料集合、审查投影、确认 stage），不新建轻交付技能、不新建审查通道、不新增步骤运行时；新增文件只有入口评估模块、三套流程正文与测试，各有真实消费者与删除条件。
- **模块职责**：`materialFilesForCohort` 决定某阶段允许的材料集合 → artifact 分支据此放行写入；`recordTaskReview` 组装 build-code 审查请求与材料 → `phaseReviewSourceProjection` 决定 reviewer 看到的 diff 与合同事实 → `quality/reviews/` 保存原件；`confirmClosePlan` 记录确认、`acceptedConfirmation` 校验确认 → 物理收口按 close plan 执行。
- **接口与数据流**：材料集合（文件名数组）→ artifact 写入/读取；审查请求（stage/scope/materials）→ 审查包 → 原件；close plan（确认 stage 由任务阶段事实推导）→ 确认原件 → 收口动作。材料与审查不写阶段事实；阶段事实仍由阶段末写入。轻档实现审的请求走 `stage=build-code`、`review_scope=phase`，且**不传 `phase_id`**：现有唯一审查事实 producer `runtime/review/review-record-route.mjs` 的 `subject` 接受这一缺省 Phase 请求（省略或 null；空串与非法 Phase ID 仍拒绝），保持 `subject_kind=phase`、`review_kind=null` 及现有身份；错误 stage/scope 或非 phase subject_kind 仍拒绝。结果 schema 由 `result.schema.json#/allOf/0/then` 承接同一身份：仅在现有 `review_scope=phase` 条件内，对显式 `stage=build-code` 且 `review_kind=null` 的组合允许 `phase_id=null`；`subject_kind` 仍为 phase，字符串仍须匹配 `^P[1-9][0-9]*$`；其他组合继续要求合法 Phase 字符串。此时 `phaseReviewSourceProjection` 不按 Phase 写集裁剪、也不强制完整 post 材料合同，reviewer 读到整工作区 diff 与调用方给的 `approved_spec`、`acceptance_criteria`、`test_evidence`；`thinQuality` 接受「`make-decision` 阶段行引用 `build-code` 审查结果」这一条具名跨面记录，其余 stage 不一致仍抛错。
- **失败语义**：材料集合出现未索引 Phase、写集越界、确认 stage 与任务实际阶段不一致、目标测试非零、TCR 未经独立审查时，分别以具体错误拒绝，不静默放行；轻档审查在缺 `phase_id` 时不因缺少完整 spec 合同而被拒绝，但缺 `approved_spec`、`acceptance_criteria` 或 `test_evidence` 任一项仍拒绝；`thinQuality` 只放行 `make-decision` 行引用 `build-code` 审查这一种跨面组合，其它组合保持原错误；缺环境或 provider 不可用如实记 unavailable。
- **新增控制面**：N/A — 复用既有材料合同、审查路由、收口入口与技能目录，不新增公共命令或持久化对象。

### 全局文件边界与依赖

- **新增**：`workflows/make-decision/flows/small/SKILL.md`、`workflows/make-decision/flows/small/steps.json`、`workflows/make-decision/flows/normal/SKILL.md`、`workflows/make-decision/flows/normal/steps.json`、`workflows/make-decision/flows/planning/SKILL.md`、`workflows/make-decision/flows/planning/steps.json`、`workflows/make-decision/scripts/entry-evaluation.mjs`、`tests/contract/entry-evaluation.test.mjs`、`tests/contract/light-material-set.test.mjs`、`tests/contract/light-implementation-review.test.mjs`、`tests/contract/light-close-confirm.test.mjs`、`tests/contract/make-decision-flows.test.mjs`、`tests/contract/light-upgrade-entry.test.mjs`、`tests/contract/light-route-controlled-fixture.test.mjs`、`tests/fixtures/light-route-controlled/README.md`、`tests/fixtures/light-route-controlled/tasks.json`、`docs/research/n8-four-level-acceptance-runbook.md`。
- **修改**：`runtime/review/schemas/result.schema.json`（P2：仅 allOf[0].then 的 phase_id 条件；P4 后写 mini 枚举退役须保全本条件）；`tests/contract/review-public-entrypoints.test.mjs`（P2：仅经独立 TCR 审查后修订缺 Phase 冻结断言）；`runtime/review/review-record-route.mjs`（P2：`subject` 的缺 `phase_id` 分支）；`runtime/task/material-workspace.mjs`、`tools/cli/stage-runtime.mjs`、`tools/cli/measure-main-agent-cost.mjs`、`core/task-close.mjs`、`tools/cli/task-close.mjs`、`runtime/review/review-policy.mjs`、`runtime/review/stage-materials.json`、`runtime/review/ocr-delegation-adapter.mjs`、`runtime/review/schemas/attempt.schema.json`、`runtime/review/schemas/result.schema.json`、`runtime/review/schemas/stage-materials.schema.json`、`AGENTS.md`、`GLOSSARY.md`、`docs/standard-workflow.md`、`docs/architecture/move-map.json`、`skills/catalog.yaml`、`skills/reuse-registry.md`、`skills/wh-review/SKILL.md`、`skills/wh-review/skill-bundle.json`、`skills/wh-review/stage-skill-plan.json`、`skills/decision-log/templates/decision-log-template.md`、`skills/spec-plan/templates/phase-template.md`、`skills/stage-closeout/SKILL.md`、`docs/delivery-closeout-charter.md`、`workflows/make-decision/SKILL.md`、`workflows/make-decision/steps.json`、`workflows/make-decision/skill-deps.yaml`、`tests/contract/material-set-per-stage.test.mjs`、`tests/contract/material-workspace.test.mjs`、`tests/acceptance/card-03-current.mjs`、`tests/acceptance/card-03-current.test.mjs`、`tests/contract/stage-closeout-skill.test.mjs`、`tests/contract/stage-closeout-step-contract.test.mjs`、`tests/contract/delivery-closeout-charter-contract.test.mjs`、`tests/contract/review-materials-contract.test.mjs`、`tests/contract/ocr-delegation-route.test.mjs`、`tests/contract/card03-review-orchestration.test.mjs`、`tests/contract/verify-architect-acceptance.test.mjs`、`tests/host-independence.test.mjs`、`tests/review/review-record-route.test.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/scripts/review-semantic-projection.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/third-review-host-config.mjs`、`skills/wh-review/scripts/__tests__/review-semantic-projection.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`tests/close/close-contract.test.mjs`、`tests/close/cleanup-resume-finalize.test.mjs`、`tests/contract/close-remote-branch-cleanup.test.mjs`、`tests/contract/card05-close-cli-mechanism.test.mjs`、`tests/contract/card05-planning-gap-behavior.test.mjs`、`tests/contract/close-sidecar-and-archive.test.mjs`、`tests/integration/vnext-delivery-close.test.mjs`、`specs/n8-four-level-route-20261019/spec.md`、`specs/n8-four-level-route-20261019/phases/P3-单阶段收口与PR正文.md`、`specs/n8-four-level-route-20261019/phases/index.md`。
- **删除**：`skills/mini-task/SKILL.md`、`skills/mini-task/scripts/mini-task-runner.mjs`、`skills/mini-task/skill-bundle.json`、`skills/wh-review/contracts/mini-task-design.md`、`skills/wh-review/contracts/mini-task-implementation.md`、`tests/integration/mini-task-delivery.test.mjs`、`tests/integration/mini-task-a-resume.test.mjs`。
- **P4 实际材料投影**：同卡补规则锚、TCR-P4-RETIRE-MINI、执行原件与覆盖边界，`phases/index.md` 同步写集指针；本段只登记材料修改，不改变FR/AC、D-016或RISK-008。
- **禁止改动**：`skills/answer-as-page/*`；`specs/archive/**` 与 `docs/archive/**`；历史 review/facts 原件；父 PRD；`runtime/task/portable-workflow-run.mjs`（N9 十环事实不在本卡）；`.planning/**` 与 `graphify-out/**` 历史材料。
- **全局依赖**：P1（材料）→ P2（审查）→ P3（收口）→ P4（退役与入口函数）→ P5（路由与流程）→ P6（重判）→ P7（验收）；同一路径跨 Phase 共用时前写者先交付并交回已核实状态。
- **P2 材料修复写集**：`specs/n8-four-level-route-20261019/spec.md`、`specs/n8-four-level-route-20261019/phases/P2-整次实施一次实现审.md`、`specs/n8-four-level-route-20261019/phases/index.md` 与本卡五个实现/测试路径同列 P2 实际审查写集；仅同步既有范围、源锚和解析合同，不改方向或验收判据。材料 owner 串行持笔，后续 Phase 继承当前正文再按其本身边界修改。
- **文件归属**：`tools/cli/stage-runtime.mjs` 依 P1→P2→P3→P4 顺序各持笔一次；`skills/catalog.yaml` 依 P3→P4 顺序；`workflows/make-decision/` 依 P4→P5→P6 顺序。
- **本机配置运维例外**：P4 同向本机运维例外：真实 loader `runtime/review/ocr-delegation-adapter.mjs#loadTrustedOcrConfig` 与 `skills/wh-review/scripts/third-review-host-config.mjs#loadTrustedThirdReviewConfig` 默认消费 `/Users/Hugh/.config/workflowhub/config.json`。D-016 已批准 mini 路线及身份退役；现宿主遗留 `wh_review.mini_task` 的 design/implementation 导致新 loader 报 unsupported，删该退休键是完整实施的必要收尾，不是新方向。授权源为当前用户完整实施 N8 并自行解决问题的指令（主会话本次派发转述），及 decision-log D-016；仅删除根对象下 `wh_review.mini_task`，保留 routes、stages、non_stage、provider 凭据及其余配置语义。该绝对本机路径只作本段人读运维例外，不进入相对机器写集，不新增 writer、schema、gate 或永久迁移接口。
- **配置执行与恢复**：唯一配置写主为 phase_p4；复用 `runtime/interface/record-lock.mjs#withLock`，锁目录 `/Users/Hugh/.config/workflowhub`、锁名 `n8-mini-task-config`、`waitMs:0`；复用 safe-write 原子/create-only 原语，私密唯一备份定为 `/Users/Hugh/.config/workflowhub/config.json.n8-mini-task-retired-20261020.bak`（已核不存在；执行时再次核且拒覆盖）；主会话已确认 N7 仅写其隔离 worktree 三登记文件、无本机配置写主，已派 doc 路由启动时加载 trusted 配置，后续不动态重读。本次操作前重新核文件为普通非 alias 单链接文件，读当前 hash 并在写前比对；只在本机权限 0600 的唯一新备份保留原文件完整字节，备份不进任务审查包、不复制秘密值至 evidence。局部删除该 JSON 成员，解析比对除该键外深层语义完全一致；保原权限并原子替换，冲突或解析/比对失败即停该修改，不覆盖别人写入。既有 migrateWhReviewConfig 还会删 profiles/priority，不用于本次单键退役。恢复只从本次私密原字节备份，在确认当前 hash 仍为本次写后 hash 且无后续写入时原子恢复；不覆盖后来的合法配置。记录只留备份绝对路径/hash、字段名、删除后字段不存在、其余语义相等和 loader 预检结果，不输出 provider/route/凭据值。测试 050 的244pass/1skip仅隔离fixture通过，真实宿主须删除后读回loader才可称可用；不以此宣 provider 审查质量。
- **回滚与恢复**：各 Phase 独立提交；材料/审查/收口改动失败时回退该 Phase 的 hunk，不覆盖其他 Phase 改动；删除类改动以 git 历史恢复。

### 需求到任务追踪

| 来源 / 决定 | 原义行为 / 强度 | FR / AC | Phase / Task | 正例 + 负例判据 / 证据 | 依赖 / 状态 |
| --- | --- | --- | --- | --- | --- |
| `R-001` / `D-011` | 四级推荐可见、可覆盖、判据只用入口事实 | `FR-ENTRY-001` / `AC-ENTRY-1` | P4/T005 | ORACLE-ENTRY-FUNCTION：真实返回 status/reason/risks 与记录字段齐备；缺事实返回 paused 且不冒适合 | P4 先行；current |
| `R-005` / `D-011` | 入口不用尚未发生的 diff/Phase 数 | `FR-ENTRY-001` / `AC-ENTRY-1` | P5/T007 | ORACLE-ENTRY-ROUTE：路由正文只引用入口可得事实；用人造 diff 判级的反例必须失败 | P5；current |
| `R-009` / `D-011` | 拿不准、未答、缺事实推荐复杂 | `FR-ENTRY-002` / `AC-ENTRY-2` | P5/T007 | ORACLE-ENTRY-ROUTE：未答场景输出复杂并保留未选；默认小改动的反例失败 | P5；current |
| `R-003` / `D-011` | 推荐、高亮、理由同次问答呈现且可覆盖 | `FR-ENTRY-001` / `AC-ENTRY-3` | P5/T007 | ORACLE-ENTRY-ROUTE：步骤表含同次展示与覆盖；缺理由的反例失败 | P5；current |
| `U-003` / `D-002` | 级别只写决策记录，消费者各读同节 | `FR-ENTRY-002` / `AC-ENTRY-4` | P5/T007 | ORACLE-ENTRY-ROUTE：四类消费者读取点各就位；读不到按复杂并记缺口 | P5；current |
| `U-011` / `D-003` | 入口路由到四套流程，各有显式步骤表 | `FR-FLOW-001` / `AC-FLOW-3` | P5/T007 | ORACLE-FLOW-STEPS：根清单与三套 flow 步骤 slug/产物/进入条件齐备；单套硬套的反例失败 | P5；current |
| `R-006` / `D-003` | 四级都消费 N6 调研/大纲/决策/收敛 | `FR-FLOW-002` / `AC-FLOW-1` | P5/T008 | ORACLE-FLOW-STEPS：三套流程均含四动作与 N6 优化；缺动作的反例失败 | P5；current |
| `R-006` / `D-003` | 四套流程各有显式步骤表与确认次数 | `FR-FLOW-001` / `AC-FLOW-3` | P5/T008 | ORACLE-FLOW-STEPS：两套轻档步骤与确认次数吻合；单套硬套反例失败 | P5；current |
| `U-012` / `D-015` | 驾驶舱四类可用、小改动不建页 | `FR-CLOSE-002` / `AC-CLOSE-4` | P5/T009 | ORACLE-FLOW-CABIN：出页判据与时点、例外与空状态齐备；小改动建页的反例失败 | P5；current |
| `U-012` / `D-015` | 驾驶舱落点与只读派生 | `FR-CLOSE-002` / `AC-CLOSE-5` | P5/T009 | ORACLE-FLOW-CABIN：落点、owner、指纹与缺失写法齐备；反写进度的反例失败 | P5；current |
| `U-007` / `D-016` | 四套流程各自列技能清单、31 共用一份定义 | `FR-SKILL-001` / `AC-MAT-3` | P5/T009 | ORACLE-FLOW-STEPS：三套清单三档齐全；双份定义反例失败 | P5；current |
| `R-006` / `D-003` | 规划两次确认、不产 spec/Phase、不做实施 | `FR-FLOW-001` / `AC-FLOW-3` | P5/T009 | ORACLE-FLOW-STEPS：规划 11 步两次确认；产 spec/Phase 反例失败 | P5；current |
| `R-010` / `D-002` | 轻档调用、步骤、字节、确认低于复杂档 | `FR-FLOW-003` / `AC-FLOW-2` | P5/T008 | ORACLE-FLOW-STEPS：步骤表与确认次数可核、跳过是不调用；空跑反例失败 | P5；current |
| `R-007` / `D-003` | 普通含内部调研与 talk，提问不设上限 | `FR-FLOW-002` / `AC-FLOW-4` | P5/T008 | ORACLE-FLOW-STEPS：普通步骤含调研与 talk、无固定问答数；写死轮数反例失败 | P5；current |
| `U-008` / `D-008` | 轻档产 spec 与 1–2 个 Phase | `FR-MAT-001` / `AC-MAT-1` | P1/T001 | ORACLE-LIGHT-MATERIALS：材料集合放行 spec/phases 且写受控；拒写反例失败 | P1；current |
| `U-007` / `D-007` | 轻档只记一行阶段事实，不伪造 build-code 行 | `FR-MAT-002` / `AC-MAT-2` | P1/T001 | ORACLE-LIGHT-MATERIALS：material 放行不产生阶段行；伪造阶段行反例失败 | P1；current |
| `U-006` / `D-006` | 普通整次实施一次实现审，复用 build-code 面 | `FR-IMPL-001` / `AC-IMPL-2` | P2/T002 | ORACLE-LIGHT-IMPL-REVIEW：审查请求经 review-record-route.subject 走已有 build-code/phase 面、记整工作区 diff；缺阶段行校验与非法身份反例 | P2；current |
| `U-007` / `D-007` | 不新增 mini 审查规则与审查轴 | `FR-IMPL-002` / `AC-IMPL-3` | P2/T002 | ORACLE-LIGHT-IMPL-REVIEW：审查 kind 集合不含 mini、缺省不产生独立轴 | P2；current |
| `U-006` / `D-006` | 目标测试真实执行、留回执 | `FR-IMPL-003` / `AC-IMPL-1` | P5/T008 | ORACLE-FLOW-STEPS：实施后步骤要求目标测试命令与回执；跳过测试反例失败 | P5；current |
| `U-008` / `D-008` | 测试失败不交付 | `FR-IMPL-003` / `AC-IMPL-4` | P5/T008 | ORACLE-FLOW-STEPS：失败暂停物理交付并回用户；失败仍交付反例失败 | P5；current |
| `R-004` / `D-012` | 四级收口、交接与经验接线 | `FR-CLOSE-001` / `AC-CLOSE-1` | P3/T003 | ORACLE-LIGHT-CLOSE：反思与物理分离、四级调用者可读；合成一次收口反例失败 | P3；current |
| `U-003` / `D-002` | 收口消费者读级别与路线，读不到按复杂并记缺口 | `FR-ENTRY-002` / `AC-ENTRY-4` | P3/T004 | ORACLE-LIGHT-CLOSEOUT：closeout 调用者读点与回退写清；缺读点反例失败 | P3；current |
| \`PRD-N8\` / \`D-012\` | 单阶段确认 stage 随实际阶段、不伪造 verify-code | \`FR-CLOSE-001\` / \`AC-CLOSE-2\` | P3/T003 | ORACLE-LIGHT-CLOSE：确认记录 stage 跟随任务阶段；钉死 verify-code 反例失败 | P3；current |
| `PRD-N8` / `D-012` | 单阶段收口可用、冻结测试走 TCR | `FR-CLOSE-001` / `AC-CLOSE-2` | P3/T004 | ORACLE-LIGHT-CLOSEOUT：确认 stage 随实际阶段、TCR 有独立审查；钉死 verify-code 反例失败 | P3；current |
| `R-011` / `D-013` | 每次收口写经验，无发现写具名依据 | `FR-CLOSE-001` / `AC-CLOSE-3` | P3/T004 | ORACLE-LIGHT-CLOSEOUT：收口正文含经验与具名依据；空文件反例失败 | P3；current |
| `U-007` / `D-016` | mini 路线退役、入口函数迁入并改名 | `FR-SKILL-001` / `AC-MAT-3` | P4/T005 | ORACLE-ENTRY-FUNCTION：新模块导出新名、旧模块删除、调用点同步；旧名冒用失败 | P4；current |
| `U-007` / `D-016` | 31 共用单一定义、审查枚举删除 | `FR-SKILL-001` / `AC-MAT-3` | P4/T006 | ORACLE-ENTRY-FUNCTION：目录与枚举扫描零残留；双份定义或残留枚举失败 | P4；current |
| `R-008` / `D-010` | 重判触发、升级只补缺、已写代码补审 | `FR-REG-001` / `AC-REG-1` | P6/T010 | ORACLE-REG-ROUTE：重判节含证据与承接；自动改级反例失败 | P6；current |
| `R-008` / `D-010` | 升级保留已完成、不重做调研 | `FR-REG-001` / `AC-REG-2` | P6/T010 | ORACLE-REG-ROUTE：升级承接清单齐备；重跑调研反例失败 | P6；current |
| `R-009` / `D-011` | 降级必须用户选择 | `FR-REG-002` / `AC-REG-3` | P6/T010 | ORACLE-REG-ROUTE：降级只由用户选择；代理自动降反例失败 | P6；current |
| `R-009` / `D-011` | 风险未变保持原档、不加审 | `FR-REG-002` / `AC-REG-4` | P6/T010 | ORACLE-REG-ROUTE：风险未变对照无独立审；凭标签加审反例失败 | P6；current |
| `U-005` / `D-013` | 四路受控任务真跑、逐格核调用 | `FR-ACC-001` / `AC-ACC-1` | P7/T011 | ORACLE-ACCEPTANCE-RUN：四路执行记录齐备；静态表代替失败 | P7；current |
| `R-008` / `D-010` | 中途负例：重新推荐、用户选择、只补缺 | `FR-ACC-001` / `AC-ACC-2` | P7/T011 | ORACLE-ACCEPTANCE-RUN：负例记录含证据与选择；不重判失败 | P7；current |
| `R-011` / `D-013` | G1 用完整 N1 成本对照 | `FR-ACC-002` / `AC-ACC-3` | P7/T012 | ORACLE-ACCEPTANCE-RUN：四级阶段/步骤/字节/确认对照齐备；单轻路线替代失败 | P7；current |
| `R-012` / `D-013` | 约 42 项外部消费、N7 未登记不记已消费 | `FR-ACC-002` / `AC-ACC-4` | P7/T012 | ORACLE-ACCEPTANCE-RUN：分母与逐项状态齐备；N7 项记已消费失败 | P7；current |
| `U-005` / `D-013` | 合法跳过写清项、理由与依据 | `FR-ACC-001` / `AC-ACC-5` | P7/T011 | ORACLE-ACCEPTANCE-RUN：跳过声明与阶段行一致；新增机器字段失败 | P7；current |
| `R-012` / `D-013` | 依赖门：N6 已合入、N7 未闭不做最终验收 | `FR-ACC-002` / `AC-ACC-6` | P7/T012 | ORACLE-ACCEPTANCE-RUN：依赖状态与阻塞记录齐备；提前宣布完成失败 | P7；current |
| `R-012` / `D-013` | 外部清单分母 31 技能＋54 项采用表 | `FR-ACC-002` / `AC-ACC-7` | P7/T012 | ORACLE-ACCEPTANCE-RUN：分母来源与推导值区分；以 15 项为分母失败 | P7；current |
| `R-002` / `D-016` | 复用现有入口评估与风险事实，不重造观测 | `FR-ENTRY-001` / `AC-ENTRY-1` | P4/T005 | ORACLE-ENTRY-FUNCTION：新模块返回语义与旧函数一致；重造观测的反例失败 | P4；current |
| `U-001` / `D-001` | 本任务按标准五阶段执行、不跳阶段 | `FR-FLOW-001` / `AC-FLOW-3` | P5/T007 | ORACLE-FLOW-STEPS：四套流程各有步骤表；跳阶段反例失败 | P5；current |
| `U-002` / `D-003` | 小改动与普通不进入其他阶段 | `FR-FLOW-001` / `AC-FLOW-2` | P5/T008 | ORACLE-FLOW-STEPS：轻档阶段数为 1、无阶段流转；转 build-code 反例失败 | P5；current |
| `U-004` / `D-004` | 先完成设计、N6 合入后实施 | `FR-FLOW-001` / `AC-FLOW-3` | P5/T007 | ORACLE-FLOW-STEPS：复杂 15 步以 N6 交付为基线；旧 15 步反例失败 | P5；current |
| `U-009` / `D-009` | 本卡验收按单阶段重述 | `FR-MAT-001` / `AC-MAT-1` | P1/T001 | ORACLE-LIGHT-MATERIALS：材料合同按单阶段放行并登记覆盖；两边同时宣称反例失败 | P1；current |
| `U-010` / `D-011` | 按交付/验收/用户故事判断、默认复杂 | `FR-ENTRY-001` / `AC-ENTRY-2` | P5/T007 | ORACLE-FLOW-STEPS：判断顺序与默认复杂可读；按文件数打分反例失败 | P5；current |

### 全局验证策略

- **验证策略**：材料与路由用合同测试（`node node_modules/vitest/vitest.mjs run <受影响文件>`）；收口用 close 相关测试与 TCR 原件；退役用目录/枚举扫描与一致性检查 `node tools/cli/check-skill-consistency.mjs`；四级减负与中途负例用受控任务真实运行记录；G1 消费完整 N1 成本观测。
- **RED/GREEN 设计**：每个 Phase 先写目标测试并实跑目标 RED（具名断言失败），冻结该测试为 `DO NOT TOUCH`，实施后同一命令 GREEN；纯文档改动按 G-2 给客观替代与具名风险，不制造仪式性 RED。
- **最终聚合**：P7 作为唯一末验收 Phase，逐条消费前序 Phase 原件与运行记录，按 Appendix A 的 31 条 AC 逐条判；未取得真实运行条件的 AC 记 incomplete 并写 owner 与时点。
- **不能证明的内容**：合同测试不证明真实 AI 会话会按步骤表执行；四路真跑不证明 G1 成本结论；静态 HTML 页面读回不证明业务效果；这些由 P7 的真实运行与用户确认承担。

每个 Phase 指向 `spec.md#实现设计全局权威`，不复制本节；每个 Task 写自己的第一步动作、同命令 RED/GREEN 与失败 oracle。

## Appendix A — 验收判据（唯一权威）

- [ ] **AC-ENTRY-1**：从决策记录能读出四级判定、理由、用到的入口事实与用户选择；判据只用入口可得事实，不使用实施后才产生的 diff 或 Phase 数；关联 FR-ENTRY-001
验证：P4/T005 与 P5/T007 的实施者提供迁移后的入口函数与新流程步骤表；独立执行者真实调用入口函数并读决策记录「级别与路线」一节，核判据顺序、字段与来源；缺Node或函数不可读时记录具体缺口，不冒已验证
通过：同一次调用给出推荐级别、理由与所用入口事实，决策记录同节可复现该判定；判据不含 diff/Phase 数；用户选择与覆盖可读
失败：用实施后事实判级、默认落小改动、推荐无理由，或记录只有级别没有入口事实与来源
证据：入口函数的真实调用命令、退出码与返回原件，以及决策记录该节的原文引用；本节不填执行状态

- [ ] **AC-ENTRY-2**：拿不准、事实缺失或用户未答时推荐复杂，并保留未选事实与缺口；不得默认小改动；关联 FR-ENTRY-001、FR-ENTRY-002
验证：P5/T007 的流程步骤表与 P4/T005 的函数返回；独立执行者构造缺一项风险事实与未答两种输入，读推荐结果与记录缺口
通过：两种输入都推荐复杂并写明缺什么、保留未选；记录含用户真实答复或明确未答
失败：缺事实落到普通或小改动；未答被当作同意；缺口不写
证据：两种输入的真实调用与记录原文；本节不填执行状态

- [ ] **AC-ENTRY-3**：第一次真实问答同时给出推荐、高亮与理由；用户可覆盖，覆盖后按新级别执行；关联 FR-ENTRY-001
验证：P5/T007 的步骤表与记录方法；独立读者消费实际展示材料与决策记录，核推荐、高亮、理由同次出现且覆盖有记录
通过：同一问答含推荐与理由；覆盖后记录写清新级别、理由与来源
失败：推荐与问答分两次；无理由；覆盖后仍按旧级别执行
证据：展示材料与决策记录该节；本节不填执行状态

- [ ] **AC-ENTRY-4**：流程步骤、实施/审查、收口、验收各自读取「级别与路线」一节；读不到时按复杂路线处理并记缺口，不静默降档；关联 FR-ENTRY-002
验证：P5/T007 与 P3/T004 的材料各含读取点与失败行为；独立执行者检查四处读取点与读不到时的记录方式
通过：四处读取点在所属材料中可定位；读不到的行为写清按复杂并记缺口
失败：任一消费者不读；读不到时静默降档或默认继续
证据：四处读取点的材料原文；本节不填执行状态

- [ ] **AC-FLOW-1**：四级都消费 N6 的调研、大纲、决策、收敛动作（深度可减、动作不可无）；复杂流程按 N6 已交付 15 步，含第 5 步骨架确认、第 6/12 步判断链检查、第 9 步五段小表、第 15 步反思收口；关联 FR-FLOW-001、FR-FLOW-002
验证：P5/T008、P5/T009 的流程正文与步骤表；独立读者按步骤 slug 与产物逐项核对四动作与 N6 新增项
通过：四套流程都含四动作对应步骤与产物；复杂流程 15 步与 N6 交付一致
失败：轻档缺调研/大纲/收敛动作；复杂流程少了 N6 新增步骤；以深度小为由删除动作
证据：四套步骤表与流程正文原文；本节不填执行状态

- [ ] **AC-FLOW-2**：轻档实际调用的阶段、步骤、必读字节、人工确认低于同范围复杂档；跳过是不调用不是空跑；普通档有真实内部调研；关联 FR-FLOW-002、FR-FLOW-003
验证：P5/T008 的步骤表与 P7/T011 的受控任务运行记录；独立执行者按同范围比较四级调用与确认次数
通过：轻档阶段数 1、步骤与确认次数低于复杂档；内部调研有真实读取与结论
失败：空跑占位、扣步骤但不减调用、内部调研写空 skipped、以复制技能充数
证据：受控任务运行记录与步骤表；本节不填执行状态

- [ ] **AC-FLOW-3**：四套流程各有显式步骤表；小改动一次确认无独立审查；普通一次方案审＋一次确认＋一次代码审；规划先骨架确认、再方向审、再任务卡收敛与细节审、第二次确认，不产 spec/Phase；单次确认写明是对 N6 两次确认的降级理由；关联 FR-FLOW-001
验证：P5/T007、T008、T009 的步骤表；独立读者逐套核对步骤顺序、确认次数与产物
通过：四套步骤表齐备且与 AC 描述一致；降级理由可读
失败：缺步骤表、确认次数不符、规划产 spec/Phase 或做实施
证据：四套步骤表原文；本节不填执行状态

- [ ] **AC-FLOW-4**：任何级别不得写死问题数或轮数；收敛以真实未决清零为准；关联 FR-FLOW-002
验证：P5/T008 的流程正文；独立读者搜固定问题数/轮数与收敛判据
通过：正文无固定问答数；收敛判据是未决项清零并有零未决时的写法
失败：写死问题数或轮数；以问答轮数当收敛
证据：流程正文原文；本节不填执行状态

- [ ] **AC-MAT-1**：小改动产极简 spec 加 1 个 Phase，普通产 spec 加 1–2 个 Phase；写集、验收、oracle/测试命令可读；覆盖 N6 材料边界有记录；关联 FR-MAT-001
验证：P1/T001 的材料合同测试与 AGENTS.md 登记；独立执行者真实调用 `materialFilesForCohort` 与 artifact 分支，读 spec/Phase 的实际结构与登记文字
通过：make-decision 放行 spec.md 与 phases；轻档材料含写集、AC、oracle 与命令；总则写明覆盖与理由
失败：写 spec/Phase 被拒；材料缺写集或 oracle；无覆盖登记
证据：新测试的真实输出与 AGENTS.md 该段原文；本节不填执行状态

- [ ] **AC-MAT-2**：轻档只记 make-decision 一行阶段事实；不伪造 build-code/verify-code 行；spec/Phase 是材料不是阶段事实；关联 FR-MAT-002
验证：P1/T001 与 P2/T002 的测试；独立执行者在真实轻任务路径上读 facts 行与审查记录，核无 build-code 行且审查记录存在
通过：facts 只有 make-decision 行；审查记录在 quality/reviews 且阶段字段为 build-code 审查面、任务阶段仍定方向
失败：写 build-code/verify-code 阶段行；把 spec 当阶段事实；审查记录缺失或身份矛盾
证据：facts.jsonl 与审查记录原件；本节不填执行状态

- [ ] **AC-MAT-3**：四套流程各自有技能清单；31 个共用技能各只有一份定义；mini-task 路线退役且历史审查原件只读保留，审查枚举按 D-016 删除；未触发条件项写理由；关联 FR-SKILL-001
验证：P4/T006 的目录与枚举扫描、P5 的流程技能清单；独立执行者运行一致性检查并逐项核 31 个技能与清单
通过：一致性检查通过；31 名单每项有清单落点或未触发理由；mini 路线无当前消费者，枚举已删，原件只读
失败：同名多份定义；未触发却调用；mini 路线仍有当前消费者或枚举残留；删除历史原件
证据：一致性检查原文与目录/枚举扫描结果；本节不填执行状态

- [ ] **AC-IMPL-1**：确认后实施；目标测试真实执行并留回执；小改动做真实改动与声明写集比对；关联 FR-IMPL-003
验证：P5/T008 的步骤表与 P7/T011 的真实运行；独立执行者读实施步骤、测试回执与写集比对记录
通过：实施在确认之后；目标测试有命令、退出与回执；diff 与声明写集逐条比对
失败：先实施后确认；测试未执行或回执缺失；写集不比对
证据：实施与测试原件、写集比对记录；本节不填执行状态

- [ ] **AC-IMPL-2**：整次实施一次代码审，直接复用 build-code 审查面与材料/provider；审查记录挂 build-code 名下，任务阶段仍是定方向、不写 build-code 阶段行，报告写清差异；不新增 mini 规则；关联 FR-IMPL-001
验证：P2/T002 的审查路由测试；独立执行者用 post 轻任务上下文发起一次 build-code 面审查，读请求材料、diff 范围、记录位置与 facts 行
通过：一次审查覆盖整次实施 diff；材料含 spec、AC 与测试证据；记录在 quality/reviews 且 facts 无 build-code 行；报告写明审查面与阶段差异
失败：按 Phase 逐次审；缺 diff 或 AC 材料；写出 build-code 阶段行；回退到 mini 规则
证据：审查请求、记录原件与 facts 行；本节不填执行状态

- [ ] **AC-IMPL-3**：小改动不得出现独立审查轴；越界写或测试失败如实记录；关联 FR-IMPL-002
验证：P2/T002 的审查身份测试与 P5/T008 的小改动步骤表；独立执行者核小改动流程无审查步骤、越界有记录
通过：小改动流程无独立审查；越界与失败都有具名记录
失败：小改动引入独立审；越界不记或混进通过
证据：步骤表与记录；本节不填执行状态

- [ ] **AC-IMPL-4**：目标测试失败时暂停物理交付；修到通过，或用户明确接受剩余风险并记录后才继续；关联 FR-IMPL-003
验证：P5/T008 的步骤表与失败路径；独立执行者构造失败输入读流程行为与记录
通过：失败进入暂停与修复；用户接受时写清风险与责任人
失败：失败仍交付；或用户未答复即继续
证据：失败路径记录与用户答复原件；本节不填执行状态

- [ ] **AC-CLOSE-1**：每次阶段末做反思收口（归纳、经验、交接、成本，不做 Git）；物理交付在实现与审查完成后做（提交、PR、合并、归档、清理）；两者分开；关联 FR-CLOSE-001
验证：P3/T003 的收口材料；独立读者核对反思与物理的步骤、产物与顺序
通过：两类收口分别可定位、顺序正确、四级都有调用者
失败：合成一次；物理交付提前在审查前；某级无收口入口
证据：收口方法正文与调用记录；本节不填执行状态

- [ ] **AC-CLOSE-2**：确认 stage 可按实际阶段传；普通 PR 正文读 spec；stage-closeout 有定方向调用者；不伪造 verify-code；冻结测试改动走一次 TCR 并独立审查；关联 FR-CLOSE-001
验证：P3/T003 与 T004 的代码、测试与 TCR 原件；独立执行者构造轻任务 close plan 并确认，读确认 stage、PR 正文与 TCR 审查
通过：轻任务确认记录 stage 为 make-decision；PR 正文取 spec；冻结测试的改动有 TCR 与独立审查
失败：仍强制 verify-code；PR 正文非 spec；直接改冻结测试无 TCR
证据：close plan、确认原件、TCR 与审查原件；本节不填执行状态

- [ ] **AC-CLOSE-3**：四级每次收口都写业务仓 Improvements；无发现写具名依据；越界记不可用，不回落工具仓；关联 FR-CLOSE-001
验证：P3/T004 的收口正文与 P7 的真实收口记录；独立读者核每次收口的经验条目与依据
通过：每次收口都有经验或具名无发现依据；越界写不可用
失败：空文件；只在工具仓留空文件；越界沉默
证据：业务仓 Improvements 与收口记录；本节不填执行状态

- [ ] **AC-CLOSE-4**：按 answer-as-page 出页判据决定是否出页；出页后按四类时点更新；小改动不建页是具名例外；不新增进度账本；关联 FR-CLOSE-002
验证：P5/T009 的驾驶舱步骤与例外；独立读者核出页判据、四类时点、例外理由
通过：判据、时点与例外在流程正文可读；小改动不建页有理由
失败：无条件建页；时点缺失；新增进度账本
证据：流程正文原文；本节不填执行状态

- [ ] **AC-CLOSE-5**：页面与同名 `.nodes.json` 在调用者指定位置（默认任务库证据区）、同一页面 owner 串行更新；缺环标「缺」，未产生写「尚未产生＋到时会填什么」，顶部带 decision-log 指纹；页面只读派生；关联 FR-CLOSE-002
验证：P5/T009 的落点与写法；独立读者按 N6 answer-as-page 合同核落点、owner、指纹与缺失写法
通过：落点与 owner 明确；缺失与未产生写法符合合同；页面不反写进度
失败：默认写到仓库内；多写者并发；反写进度或伪造数据
证据：页面与 `.nodes.json` 路径、流程正文；本节不填执行状态

- [ ] **AC-REG-1**：实施者按真实改动/影响证据判断；发现跨层/未知风险暂停并回用户；关联 FR-REG-001
验证：P6/T010 的重判节；独立读者核触发证据、暂停与回用户
通过：触发条件与证据可读；暂停有记录并回用户选择
失败：按标签判断；发现风险仍继续；不回用户
证据：流程正文与真实记录；本节不填执行状态

- [ ] **AC-REG-2**：升级保留已完成，只补未做阶段与审查；已写代码补一次代码审；不重做调研；关联 FR-REG-001
验证：P6/T010 的升级承接清单与 P3 的收口调用；独立读者核承接项与补审
通过：升级清单写明保留项、补做项与代码补审；调研不重跑
失败：重做已完成阶段；不补代码审；丢掉已产材料
证据：升级承接节与记录；本节不填执行状态

- [ ] **AC-REG-3**：只有用户明确选择才降级；代理不得自动降；关联 FR-REG-002
验证：P6/T010 的降级节；独立读者核选择来源与记录
通过：降级有用户真实选择与理由；代理仅建议
失败：代理自动降级；无用户答复即降
证据：用户答复与决策记录；本节不填执行状态

- [ ] **AC-REG-4**：风险未变保持原小档且无独立审；不得凭「看起来大」加审；关联 FR-REG-002
验证：P6/T010 的对照节与 P7/T011 的风险未变对照运行；独立读者核对照记录
通过：风险未变任务保持原档且无独立审；判断证据写进记录
失败：凭主观加审；擅自升级
证据：对照运行记录与决策记录；本节不填执行状态

- [ ] **AC-ACC-1**：受控任务跑小改动/普通/复杂/规划四路，逐格核实际调用；不用历史回放或静态表代替；关联 FR-ACC-001
验证：P7/T011 的受控任务与运行手册；执行者按真实会话记录逐格核阶段、步骤、确认与技能调用
通过：四路都有真实运行记录与逐格核对；跳过项有声明
失败：用静态表或旧记录代替；只跑一路
证据：四路运行记录原件；本节不填执行状态

- [ ] **AC-ACC-2**：小改动扩跨层/未知风险要走真实影响证据、重新推荐、用户选择、只补缺；未重判仍免审或自行改级加审均失败；风险未变对照保持原小档且无独立审；关联 FR-ACC-001
验证：P7/T011 的负例与对照运行；独立执行者读证据、推荐、选择与补做记录
通过：负例走全链；对照保持原档
失败：未重判、自行改级、或对照被加审
证据：负例与对照运行记录；本节不填执行状态

- [ ] **AC-ACC-3**：G1 按阶段/步骤/字节/确认次数对照，消费完整 N1；不以四路真跑单独代替成本；关联 FR-ACC-002
验证：P7/T012 的成本对照表与 N1 观测原件；独立读者核四指标与来源窗口
通过：四指标齐全且引用完整 N1；口径与窗口写明
失败：缺指标；用单路或静态估算代替；不引用 N1
证据：成本对照与 N1 原件引用；本节不填执行状态

- [ ] **AC-ACC-4**：约 42 项外部方法实际消费清单；N6 已交付，N7 未登记项等登记后再验收，不记已消费；关联 FR-ACC-002
验证：P7/T012 的外部清单；独立读者按 31 技能清单与 54 项采用表核逐项状态
通过：逐项标触发/合法跳过/未交付；N7 项标等待
失败：把 N7 未登记项记已消费；以 15 项为分母
证据：外部清单与登记引用；本节不填执行状态

- [ ] **AC-ACC-5**：决策记录/交接写清跳过项、理由与规则依据；最终核对读人读声明与现有阶段行，不新增机器字段；关联 FR-ACC-001
验证：P7/T011 的跳过声明与阶段行读回；独立读者核声明与阶段行一致
通过：跳过项有理由与依据；读回只用声明与现有阶段行
失败：跳过无理由；新增 skip 字段或第二进度对象
证据：跳过声明与阶段行读回；本节不填执行状态

- [ ] **AC-ACC-6**：N6 已合入；N7 登记缺口由 N7 owner 关闭，N8 不代补；N7 未闭合前不做最终验收；关联 FR-ACC-002
验证：P7/T012 的依赖状态记录；独立读者核 N6/N7 状态与最终验收时点
通过：依赖状态与阻塞写明；最终验收时点不早于 N7 闭合
失败：提前宣布最终完成；替 N7 补登记
证据：依赖状态记录与 N7 登记引用；本节不填执行状态

- [ ] **AC-ACC-7**：以 31 个跨级共用技能清单加 54 项采用表（含 N6 新增 answer-as-page）为权威分母，逐项标触发/合法跳过/未交付；约 42 项是推导值，不是新分母；关联 FR-ACC-002
验证：P7/T012 的分母来源与逐项状态；独立读者核分母与推导
通过：分母来源可读；推导值与分母区分；逐项状态齐备
失败：以 15 项或 42 项为新分母；不区分推导值
证据：分母原件与逐项清单；本节不填执行状态

## 12. 风险、未决与交接

- **RISK-001**：材料合同放宽后，复杂流程被误放宽
  - **受影响 ID**：PFACT-001、FR-MAT-001、AC-MAT-1
  - **触发条件**：`materialFilesForCohort` 按阶段一刀切返回全量材料而未保留复杂流程需求
  - **后果**：复杂流程的必需材料校验失去意义，读者误以为复杂流程也要写 spec
  - **缓解或停止**：允许集合与必需集合分开；复杂流程需求不变；读不到时按复杂并记缺口
  - **处理阶段**：P1
  - **验证**：材料合同测试同时断言轻档放行与复杂流程需求不变
- **RISK-002**：实现审记录被误读为跑过 build-code 阶段
  - **受影响 ID**：PFACT-002、PFACT-003、FR-IMPL-001、AC-IMPL-2
  - **触发条件**：审查记录与阶段事实同名字段混用，或 facts 出现 build-code 行；或质量投影按 `result.stage !== row.stage` 拒绝轻档记录
  - **后果**：读者以为实现了阶段流转，或轻档任务永远拿不到质量事实
  - **缓解或停止**：报告固定写清审查面与阶段差异；测试断言无 build-code 阶段行；`thinQuality` 只放行 `make-decision` 行引用 `build-code` 审查这一种组合；读不到就按缺失记录
  - **处理阶段**：P2
  - **验证**：审查路由测试断言 facts 无 build-code 行、记录存在且质量投影可通过
- **RISK-006**：轻档 spec 被完整 post 材料合同挡在实现审之外
  - **受影响 ID**：PFACT-002、PFACT-008、FR-IMPL-001、AC-IMPL-2
  - **触发条件**：审查路径在缺 `phase_id` 时仍强制 `validatePostPhaseContract`，要求轻档 spec 具备完整实现设计、追踪表与 FR/AC 定义
  - **后果**：普通任务无法做实现审，只能退化为无审或写超出「极简 spec 最小节」的材料
  - **缓解或停止**：P2 在缺 `phase_id` 时不裁剪 diff、不强制完整合同；材料仍要求 spec、AC 与测试证据；若该路径不可行，回到用户重新选择审查通道
  - **处理阶段**：P2
  - **验证**：审查路由测试用真实极简 spec 走通，且缺 `approved_spec` 等必需材料时仍拒绝
- **RISK-007**：驾驶舱接线缺口被当成已可用
  - **受影响 ID**：PFACT-013、FR-CLOSE-002、AC-CLOSE-4
  - **触发条件**：只改流程正文，不把 `answer-as-page` 补进 make-decision 的技能依赖与调用点
  - **后果**：四类任务「都能用驾驶舱」只停留在文字，真实会话不加载方法
  - **缓解或停止**：P5 同步补 skill-deps 与流程技能清单；页面不存在时写「尚未产生」；不伪造页面证据
  - **处理阶段**：P5
  - **验证**：流程技能清单与 skill-deps 一致；页面缺失时收口记录写缺口
- **RISK-003**：收口确认 stage 参数化后，复杂任务仍按 verify-code 校验
  - **受影响 ID**：PFACT-004、PFACT-005、FR-CLOSE-001、AC-CLOSE-2
  - **触发条件**：确认 stage 推导取错（例如按最近阶段行而非真实任务阶段），或 TCR 未取得独立审查
  - **后果**：轻任务无法确认收口，或确认记录与 plan 不符被拒
  - **缓解或停止**：stage 由任务阶段事实确定性推导；TCR 附独立审查原件；不一致时拒绝消费并显示实际 plan
  - **处理阶段**：P3
  - **验证**：close 测试覆盖轻任务与复杂任务两条确认路径
- **RISK-004**：mini 退役删到历史校验
  - **受影响 ID**：PFACT-007、FR-SKILL-001、AC-MAT-3
  - **触发条件**：删除面超出当前消费者，或把历史原件当可删物
  - **后果**：旧审查文件无法再校验（已接受），或历史原件被删（不可接受）
  - **缓解或停止**：删除前留一次引用扫描；只删当前枚举与技能文件，不删历史原件；残留引用逐项修
  - **处理阶段**：P4
  - **验证**：目录/枚举扫描与历史原件存在性检查
- **RISK-005**：轻档减负落成纸面
  - **受影响 ID**：FR-FLOW-003、AC-FLOW-2、AC-ACC-1
  - **触发条件**：流程写死更少步骤但调用不减少，或受控任务未准备
  - **后果**：减负不可核，验收只能报 unknown
  - **缓解或停止**：受控任务与运行手册在 P7 前准备；逐格核调用；缺运行记录记 incomplete 并写 owner
  - **处理阶段**：P7
  - **验证**：四路运行记录逐格核对
- **RISK-008**：mini 审查枚举的口径冲突被误当已裁决
  - **受影响 ID**：PFACT-007、FR-SKILL-001、AC-MAT-3、RISK-004
  - **触发条件**：读者只读 decision-log 的 F 模块汇总或 OI-006 的「只读保留」，把删除当成未决或反过来
  - **后果**：退役范围摇摆，或历史枚举去留无据
  - **缓解或停止**：本规格按 D-016 与 2026-10-20 最新交接执行删除；冲突原文位置：decision-log 的 557、635、666、704、738 行仍写「只读保留／不改 review-policy/schema」，与本条采纳的 D-016 删除口径冲突；P4 保留引用扫描与历史原件存在性检查；用户如改口径，回 make-decision 改决定再改计划
  - **处理阶段**：P4
  - **验证**：P4 的引用扫描为空且历史原件仍在；spec 与交接均引用 D-016 与本条

- **OPEN-001**：N7 的 catalog/notice/reuse 登记缺口未闭
  - **受影响 ID**：PFACT-009、FR-ACC-002、AC-ACC-4、AC-ACC-6
  - **负责人**：N7 owner
  - **影响**：外部清单的 N7 项只能标等待，不能记已消费；最终验收不能早于 N7 闭合
  - **处理阶段**：P7
  - **关闭条件或停止**：N7 登记闭合后重跑外部清单；未闭合前不宣布整卡最终验收

## 13. 业务影响与回归范围

### 复杂流程与既有审查

- **既有行为**：复杂任务仍走 make-decision 15 步 → build-plan → build-code → verify-code；代码审查质量与 provider 不变；pre/history 材料只读。
- **本需求影响**：材料允许集合放宽只影响定方向阶段；审查路由只新增缺 `phase_id` 的整工作区分支；确认 stage 从常量改为按实际阶段取值。
- **回归路径**：复杂流程材料需求断言、build-code 审查既有测试、close 既有测试在 P1–P3 的 gate 中保留并跑通。
- **验收**：AC-MAT-2、AC-IMPL-2、AC-CLOSE-2 的负例与既有测试。

- **可能受冲击的业务规则**：审查身份枚举、收口确认校验、技能目录与 move-map 登记；不得改动 `TASK_TYPES` 与历史原件。
- **明确无影响**：`skills/answer-as-page/*` 本体、父 PRD、归档材料、N9 十环事实、N1 成本观测实现。

## 补充材料

- 决策记录：`specs/n8-four-level-route-20261019/decision-log.md`
- ADR：`docs/adr/0051-light-tasks-complete-inside-make-decision.md`
- 研究：`quality/evidence/2026-10-19-001-n8-research-report.md`（任务库）
- 覆盖矩阵：`quality/evidence/decision-log-refs/coverage-matrix.md`（任务库）
- 方向审查/细节审查：`quality/reviews/2026-10-19-005-make-decision-direction.json`、`2026-10-19-010-make-decision-detail.json`
