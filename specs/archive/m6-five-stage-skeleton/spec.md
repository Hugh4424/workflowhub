# 功能规格：M6 五段薄骨架（workflowhub 五个标准 skill）

> 基于 SPEC.md。本文件不可覆盖项目级规则。

**功能名**: `m6-five-stage-skeleton`
**来源用户故事**: workflowhub roadmap M6（agenthub-extraction-program/artifacts/roadmap.md 行 208-233）
**需求权威源**: `tasks/m6-five-stage-skeleton/artifacts/decision-log.md`（14 决策 D1-D14）
**状态**: 草稿

## 速读卡（30秒看懂这个需求）

- **一句话需求**：给 workflowhub 建五个标准 Claude Code skill（/make-decision、/build-spec、/build-plan、/build-code、/verify-code），每个是一份纯提示词，告诉 AI 这个阶段干什么、产什么最小产物、写一条指标，横向串成一条最薄的端到端流程；不搬 agenthub 那套卡流程的 gate 机制。
- **核心改动点**（5 条）：
  - 在 workflowhub `workflows/` 下新建五个子目录，各放一份 SKILL.md（纯提示词，可 /命令 调起）。
  - 每段提示词内置要求：产 stage-result 契约产物（带本段约定的 facts key）+ 写一条指标记录。
  - 给五段各定最小 facts 子 schema（每段 1-2 个 key），防空 object 假绿。
  - 扫描器（复用 check-stage-quality.mjs）能检出未接指标的 skill。
  - 五份 skill 初稿齐全后逐份用 writing-great-skills 优化；registry 各加一条。
- **最大影响面**：workflowhub 仓首次有正式 workflow 阶段骨架，是后续所有里程碑（M7+ 逐段加深）的样板；不动 agenthub 现有实现。
- **验收信号**：五个命令各能调起 → 跑一遍五段，metrics 里五段各有一条记录 → 五段产物都过 stage-result 契约校验 → big/small 两路都跑通 → 扫描器能揪出漏接指标的 skill。

## Clarifications

### Session 2026-06-24

- Q: 每段产物里标识本段产出的 facts key，现在定字面量还是留 plan/apply 定？ → A: design 阶段即定五段各自最小 facts 子 schema（每段 1-2 个语义化 key，见第 6 章「五段 facts 子 schema」表）。D11 原文要求「facts 定每段最小子 schema（每段必含 1-2 个 key）…design 阶段细化」，故由 design 定锚点、plan/apply 据此执行（design-review round-1 blocking 纠偏：原推迟到 plan/apply 属范围漂移，已撤回）。
- Q: 每段写的指标记录最小要含哪些字段？ → A: 复用 M4 现有 metrics 格式，最小含「能标识哪个 skill/哪一段」的信息即可，不另立指标 schema（符合 D13 复用扫描器、F10）。
- Q: AC1「五个命令能分别调起」怎么判定？ → A: 判定 = registry 注册 + SKILL.md 有合法 frontmatter（name/description）可被 Skill 工具发现；端到端「真调起跑一遍通不通」归 verify-code 的人/AI 实跑验收（AC10）。AC1 验「装得上可发现」，AC10 验「真能跑通」，两者分开。

## 1. 问题陈述

workflowhub 仓目前 `workflows/` 下只有实验性 spike 代码，没有任何正式的阶段流程骨架，也没有一个能 /命令 调起的标准 skill。要把 agenthub 沉淀的「五段开发流程」迁移成 workflowhub 的轻量样板，但 agenthub 那套提示词里裹满了 gate/checkpoint/Post-Review Pass 等运行时阻断机制（9.5 万行 gate、过半 commit 在修 gate，已立为宪法 F10 永久反例）。直接照搬会把同样的过度工程负担带进 workflowhub。需要的是：把每段「该阶段干什么」的纯指导提取出来，剥掉机器卡流程的部分，先横向铺齐最薄的能用版。

## 2. 背景、目标和边界

### 背景

agenthub 的 vibecoding workflow 有成熟的五段提示词（intake/design/plan/apply/test-acceptance），但与运行时 gate 深度耦合。workflowhub 已立宪法 F4（质量靠异源审查+人，非阻断质量门）和 F10（自动化按真实收益，不为"机器可校验"本身堆基建），并已删除 check-path-guard CI 护栏、把 findViolation 解耦进 core/protected-paths.mjs 作运行时非阻断提醒（commit 7453d4b，已在 main）。M3 已定窄契约 stage-result，M4 已有指标系统与 check-stage-quality.mjs 扫描器。本期在这些基础上建五段骨架。

### 目标

- 五个语义化命名的标准 skill 横向齐全、各能独立调起。
- 每段是纯阶段指导提示词，不含 gate/checkpoint 机制段。
- 每段提示词要求 AI 产 stage-result 契约产物 + 写一条指标记录。
- big 路（make-decision→build-spec→build-plan→build-code→verify-code 全走）与 small 路（make-decision→build-code 跳步）两条都能跑通。
- 五份 skill 经 writing-great-skills 优化。

### 非目标（明确不做）

> 以下逐条继承自 decision-log.md「不做范围」（D2/D3/D6/D7 + intake 批准的 out-of-scope）。design 阶段全部继承，apply 不得逾越。

1. **不搬 agenthub 的 gate/checkpoint/审查机制进五份 skill**（D2）——只保留阶段纯指导，剥掉运行时 gate 段。
2. **不在 SKILL.md 里塞执行机制 / 不加 index.mjs / 不为 CI 给 skill 加机器入口**（D3）——skill 是纯提示词，提示词内容可要求 AI 产契约产物，但 SKILL.md 本身不含执行代码。
3. **不新建 skill-summary-report.schema.json**（D6）——摘要回报复用现有 stage-result.contract.json。
4. **不套 workflows/vibecoding/ 中间层**（D7）——直接在 workflows/ 下建五个子目录。
5. **不改 agenthub 现有实现**——只新增 workflowhub 内容。
6. **不把任一段做深**——M6 只交付最薄能用版，加深留 M7+。
7. **不引入运行时质量 gate**（宪法 F4/F10）——质量靠人+异源审查。
8. **不写 pipeline runner 让 CI 真跑端到端五段**（被推翻的旧草稿方向）——端到端串通改为人/AI 实跑验证，CI 只保留最轻契约管道冒烟。
9. **不把契约/指标/扫描器/省 token 摘要（S6）推后到 M7-M9**（旧草稿误砍，已纠偏）——本期均落实。

## 3. 用户场景和用例

> 角色「编排者」= 在 workflowhub 里驱动一条任务流程的人或主 AI；「子代理」= 被派去执行某段 skill 的小助手。

### 场景一：编排者走完整 big 路五段（正常路径）

- **角色**：编排者要交付一个需要完整设计的功能。
- **操作步骤**：依次调起 /make-decision → /build-spec → /build-plan → /build-code → /verify-code，每段把上一段的 stage-result 产物作为输入传给下一段。
- **预期结果**：五段各产出一份合法 stage-result 产物（status/facts 等字段齐全）；每段在 metrics 里各留一条记录；上游产物能被下游正确读到并继续。

### 场景二：编排者走 small 跳步路（边界场景）

- **角色**：编排者要做一个小改动，不需要 spec/plan。
- **操作步骤**：只调 /make-decision，然后直接跳到 /build-code，把 make-decision 的 stage-result 产物直接传给 build-code。
- **预期结果**：build-code 只认上游传来的合法 stage-result 产物（靠 facts 子 schema 约定的 key 拿到输入），不假定 spec/plan 存在，正常执行并产物；这条路也跑得通。

### 场景三：某段产物不认契约（失败场景）

- **角色**：编排者/子代理。
- **操作步骤**：构造某一段产出一个不符合 stage-result 契约的产物（如 facts 为空 object、缺 status 字段）。
- **预期结果**：该产物被契约校验判为失败（不被当成合法产物放行），失败可被发现，不产生"空 object 假绿"。

### 场景四：某段漏接指标（失败场景）

- **角色**：维护者。
- **操作步骤**：构造一份没有写指标记录的 skill，跑扫描器。
- **预期结果**：扫描器（check-stage-quality.mjs）必检出这个未接指标的 skill 并报失败（退出码非 0）；漏接不被检出即视为缺陷。

### 场景五：大输出 skill 调用后的上下文节制（边界场景）

- **角色**：编排者主上下文。
- **操作步骤**：派子代理调一个会产大输出的 skill。
- **预期结果**：子代理回报只给摘要 + 文件路径引用，主上下文不出现大段原文（S6 省 token，复用 stage-result 契约回报摘要）。

### 场景六：引入新机制需过防过度工程关（权限/约束场景）

- **角色**：执行 build-spec / build-plan 的子代理。
- **操作步骤**：在 spec / plan 阶段试图引入一个新的自动化机制 / 新依赖 / 新状态机。
- **预期结果**：提示词内置的防过度工程硬约束（F10）要求执行者显式回答"这个机制解决的真实问题是否大于其开发与长期维护成本"，过不了关就不引入；该约束以提示词文字形式存在，不是运行时 gate。

### 状态覆盖清单

- [x] **默认态**：需覆盖 → 场景一（big 路正常走完）。
- [x] **空态**：需覆盖 → 场景三（facts 空 object 被契约判失败）。
- [x] **错误态**：需覆盖 → 场景三 + 场景四（产物不认契约 / 漏接指标）。
- [ ] **加载态**：N/A —— skill 是提示词 + 一次性产物，无异步加载 UI 态。
- [ ] **取消态**：N/A —— 本期不设流程中断/回滚机制（无 gate）。
- [x] **边界态**：需覆盖 → 场景二（small 跳步路）+ 场景五（大输出节制）。
- [x] **权限态**：需覆盖 → 场景六（引入新机制需过 F10 关）。
- [ ] **竞态**：N/A —— 五段串行执行，本期无并行同写同一产物的设计。

## 4. 功能需求

> 溯源规则：标"来源：decision-log 决策 N"的 FR 对应 decision-log 中"来源类型=新增"的决策。

#### 叙述层（给人读）

本需求的核心是**五份纯提示词 skill**，它们共享同一套契约与指标接线。SKILL 域定义五段本体——每段是一份能 /命令 调起的标准 skill，内容是从 agenthub 对应阶段提示词提取的纯阶段指导，命名语义化、横向齐全。CONTRACT 域规定每段产物必须过 stage-result 窄契约，并给每段定最小 facts 子 schema，让"产了什么事实"可被校验、防空 object 假绿，也让下游能靠约定 key 拿到上游输入。METRIC 域规定每段跑完写一条指标记录，并让扫描器能揪出漏接指标的段。WIRING 域管"装得上、调得起、串得通"——registry 注册、命令调起、big/small 两路端到端贯通、大输出节制。ANTIBLOAT 域把宪法 F10 防过度工程约束以提示词文字注入 build-spec/build-plan。OPT 域要求五份初稿齐全后逐份用 writing-great-skills 优化。

#### 编号字段层（给机器追溯）

### 五段 skill 本体（SKILL）

- **FR-SKILL-001**：在 workflowhub `workflows/` 下建五个子目录 make-decision / build-spec / build-plan / build-code / verify-code，各放一份 SKILL.md。命名即 /命令名，语义化动词+名词。来源：decision-log 决策 D1/D5/D7。
  - **场景**：Given workflows/ 下五目录齐全，When 用户输入任一 /命令，Then 对应 skill 被调起。
  - **场景**：Given 缺任一段目录或某段调不起，When 验收，Then 判失败（缺段即 blocking）。
- **FR-SKILL-002**：每份 SKILL.md 内容是纯阶段指导（从 agenthub 对应五段提示词提取"该阶段干什么"），剥掉 gate / checkpoint / Post-Review Pass 等运行时阻断机制段。来源：decision-log 决策 D2。
  - **场景**：Given 任一 SKILL.md，When 检查内容，Then 不含 gate/checkpoint/Post-Review 机制段（残留即失败）。
- **FR-SKILL-003**：每份 SKILL.md 是纯提示词，不含执行代码、不加 index.mjs、不为 CI 给 skill 加机器入口；但提示词内容要求 AI 在干活时产契约产物 + 写指标。来源：decision-log 决策 D3。
  - **场景**：Given 任一 SKILL.md，When 检查，Then 文件内无可执行 runtime 入口代码，且提示词正文要求产 stage-result 产物与写指标。
- **FR-SKILL-004**：五段横向齐全，不缺任一段。
  - **场景**：Given 五段集合，When 清点，Then 恰好五段 make-decision/build-spec/build-plan/build-code/verify-code 全在。

### 窄契约与 facts 子 schema（CONTRACT）

- **FR-CONTRACT-001**：五段产物都用现有 stage-result 契约校验，不新建 skill-summary schema。来源：decision-log 决策 D6/D14。
  - **场景**：Given 任一段产出 stage-result 产物，When 用 stage-result.contract.json 校验，Then 合法产物通过。
  - **场景**：Given 构造一段不认契约的产物（缺 status / facts 非法），When 校验，Then 判失败（不放行）。
- **FR-CONTRACT-002**：给五段各定最小 facts 子 schema（每段 1-2 个语义化 key，键集见第 6 章「五段 facts 子 schema」表），约束 facts 不得为空 object 且必含本段约定 key，防空 object 假绿、支撑 small 跳步路按 key 取输入。来源：decision-log 决策 D11。
  - **场景**：Given 某段 facts 为空 object，When 按该段 facts 子 schema 校验，Then 判失败。
  - **场景**：Given 某段 facts 含约定 key，When 校验，Then 通过。
- **FR-CONTRACT-003**：small 跳步路下，build-code 只认上游传来的合法 stage-result 产物（靠 facts 子 schema 约定 key 拿到输入），不假定 spec/plan 产物存在。来源：decision-log 决策 D12。
  - **场景**：Given 只有 make-decision 产物，When 调 build-code，Then 它从 make-decision 产物的约定 key 读到输入并执行，不因缺 spec/plan 而失败。

### 指标与扫描器（METRIC）

- **FR-METRIC-001**：每段 skill 跑完写一条指标记录到 metrics（复用 M4 指标系统，路径见 config 的 metrics_path）。记录最小含「能标识哪个 skill / 哪一段」的信息，复用现有 metrics 格式，不另立指标 schema（见 Clarifications Q2）。
  - **场景**：Given 跑完五段，When 查 metrics，Then 五段各有一条指标记录。
  - **场景**：Given 某段未写指标，When 验收，Then 该段缺记录即失败。
- **FR-METRIC-002**：扫描器（复用/扩展 check-stage-quality.mjs）能检出未接指标的 skill。来源：decision-log 决策 D13。
  - **场景**：Given 构造一份漏接指标的 skill，When 跑扫描器，Then 退出码非 0 并指出该 skill。
  - **场景**：Given 五段都正确接指标，When 跑扫描器，Then 退出码 0。

### 装配与端到端串通（WIRING）

- **FR-WIRING-001**：五段各往 config/workflowhub.yaml 的 registry 追加一条（component_id / workflow / path 三字段格式）。来源：intake 原始上下文（registry 接入要求）。
  - **场景**：Given registry，When 注册后查，Then 五段各有一条条目。
- **FR-WIRING-002**：big 路（五段全走）与 small 路（make-decision→build-code 跳步）两条端到端都能跑通，上游产物能传到下游。
  - **场景**：Given big 路顺序调五段，When 走完，Then 每段产物被下段正确读到，无 error、无断链。
  - **场景**：Given small 路跳过 spec/plan，When 走完，Then 链路贯通不断。
  - **场景**：Given 任一段 error / 无产物 / 产物传不到下段，When 实跑，Then 判失败。
- **FR-WIRING-003**：大输出 skill 经子代理调用后，主上下文只增加摘要 + 文件路径引用，不出现大段原文（S6 省 token，复用 stage-result 契约回报摘要）。来源：decision-log 决策 D6（S6 本期落实）。
  - **场景**：Given 派子代理调大输出 skill，When 回报，Then 主上下文仅见摘要+路径，无原文大段。

### 防过度工程注入（ANTIBLOAT）

- **FR-ANTIBLOAT-001**：宪法 F10 防过度工程约束以提示词文字形式注入 build-spec 和 build-plan：引入新机制 / 新依赖 / 新状态机前，执行者须显式回答"真实收益是否大于开发与长期维护成本"，过不了关不引入。注入形态为提示词文字，不是运行时 gate。来源：decision-log 决策 D10。
  - **场景**：Given build-spec/build-plan 提示词，When 检查，Then 含 F10 防过度工程硬约束段。
  - **场景**：Given 该约束，When 检查其形态，Then 是提示词文字（无阻断式 gate 实现）。

### 优化（OPT）

- **FR-OPT-001**：五份 SKILL.md 初稿齐全后，逐份用 writing-great-skills 技能优化。来源：decision-log 决策 D4。
  - **场景**：Given 五份初稿，When 各跑 writing-great-skills，Then 五份都经过优化（任一未过即失败）。

## 5. 模块划分

> 五段 skill 之间靠 stage-result 产物（文件）单向传递，是窄契约耦合。

### 五段 skill 提示词（make-decision / build-spec / build-plan / build-code / verify-code）

- **负责什么**：各自阶段的纯指导提示词 + 要求 AI 产契约产物与写指标。
- **对外接口**：上游产 stage-result 产物 → 下游读其 facts 约定 key 作输入。
- **依赖谁**：依赖 stage-result 契约（CONTRACT）、指标系统（METRIC）、registry（WIRING）。
- **测试边界**：单段可独立调起测「能调起 + 产合法产物 + 写指标」（深模块）；端到端串通需人/AI 实跑（环境模块）。

### stage-result 契约 + facts 子 schema

- **负责什么**：校验各段产物结构合法、facts 非空且含约定 key。
- **对外接口**：contracts/stage-result.contract.json + 五段各自 facts 子 schema 约定。
- **依赖谁**：无（已有契约文件，本期只补 facts 子 schema 约定）。
- **测试边界**：可独立测（喂合法/非法产物看判定），深模块。

### 指标扫描器（check-stage-quality.mjs 复用）

- **负责什么**：检出未接指标的 skill。
- **对外接口**：CLI 跑扫描，退出码 0/非0。
- **依赖谁**：metrics 目录 + scripts。
- **测试边界**：可独立测（--self-test 注入漏接样本），深模块。

### registry 装配（config/workflowhub.yaml）

- **负责什么**：注册五段，让命令可被发现/调起。
- **对外接口**：YAML registry 数组。
- **依赖谁**：五段 SKILL.md 路径。
- **测试边界**：可独立测（解析 + 条目计数）。

## 6. 关键实体（涉及数据时必填）

- **stage-result 产物**（每段产出一份）：
  - `status`：success / failed / unknown —— 本段是否成功。
  - `facts`：开放 object，但本期给每段约定最小子 schema（1-2 个 key），不得为空。
  - `error_code` / `retryable` / `missing_items` / `user_decision` / `reason`：契约其余字段（沿用现有 stage-result.contract.json）。
- **指标记录**（每段跑完一条，写入 metrics_path）：
  - 至少能标识"哪个 skill / 哪一段产出了这条记录"，供扫描器判断是否漏接。
- **registry 条目**（每段一条）：
  - `component_id` / `workflow` / `path` 三字段。

### 五段 facts 子 schema（D11：每段最小 1-2 个语义化 key，design 阶段锚定）

> facts 仍是开放 object，但每段必含下表约定的 key（非空）；下游按这些 key 取上游输入。key 名为设计级约定锚点，apply 落地时字段含义不得偏离本表语义。

| 段（skill） | 必含 key | 语义 |
|---|---|---|
| make-decision | `decision` | 本次拍板的方向/结论（small 跳步路 build-code 的输入锚点） |
| make-decision | `scope` | 范围边界（做什么/不做什么） |
| build-spec | `spec_ref` | 产出的 spec 定位（下游 plan 读取锚点） |
| build-spec | `requirements` | 功能需求清单或计数 |
| build-plan | `plan_ref` | 产出的 plan 定位 |
| build-plan | `tasks` | 拆出的任务清单或计数 |
| build-code | `changed` | 本段改动的产物清单 |
| build-code | `tests` | 测试执行结论（通过/失败计数） |
| verify-code | `verdict` | 验收结论 |
| verify-code | `evidence_ref` | 验收证据定位 |

约束：每段产物的 facts 至少含该段上表 key 且值非空；缺 key 或空值 → 契约校验判失败（防空 object 假绿，FR-CONTRACT-002）。

## 7. 数据和生命周期（数据驱动需求时必填）

- stage-result 产物：每段执行时产出，作为下游输入，生命周期随本次流程；落盘位置由各段提示词约定（与 M5 同模式落本 task 目录 / tmp）。
- 指标记录：追加写入全局 metrics（落盘位置由 config 的 metrics_path 配置项决定），长期累积，供扫描器与后续分析读取。
- 本期不涉及数据库 / 迁移 / 多版本数据演进。

## 8. 兼容性预留

本期不切片，标"本期不涉及"。五段命名已定终态（不预留改名），registry 三字段格式沿用现有约定（不预留新字段）。facts 子 schema 是新增约定但属本期落地，非未来预留。

## 9. 不做和隐性必达

> 不做范围见第 2 章「非目标」9 条（已逐条继承 decision-log 不做范围）。以下是默认隐性必达条件：

- **隐性必达 1**：不改 agenthub 现有实现，所有改动落 workflowhub 仓。
- **隐性必达 2**：不引入运行时阻断式 gate（宪法 F4/F10），F10 约束只以提示词文字存在。
- **隐性必达 3**：项目检查命令与测试套件全绿（含 F10 / 删护栏的既有改动，本期不得回退）。
- **隐性必达 4**：宪法保持 21 条、F10 在册、check-path-guard 已删且 core/protected-paths.mjs 运行时非阻断提醒在位（既有状态，本期不得破坏）。
- **隐性必达 5**：可证伪、不假绿（宪法 F9）——契约校验、指标扫描器、端到端实跑的每条验收都要能在"为假时"被检出。

## 10. 验收清单及未决问题

> 逐条来自 decision-log 验收标准（12 条，均带失败判据），全部可判真伪。

### 验收检查（success_criteria）

- [ ] **AC1**：五个命令能分别调起 = registry 已注册 + 各 SKILL.md 有合法 frontmatter（name/description）可被 Skill 工具发现（任一缺段/未注册/frontmatter 非法即失败；端到端真跑归 AC10）。← FR-SKILL-001/004 / FR-WIRING-001
- [ ] **AC2**：每段内容是纯阶段指导，不含 gate/checkpoint/Post-Review 机制段（残留即失败）。← FR-SKILL-002
- [ ] **AC3**：五份 skill 都经 writing-great-skills 优化（任一未过即失败）。← FR-OPT-001
- [ ] **AC4**：五段横向齐，不缺任一段（缺即失败）。← FR-SKILL-004
- [ ] **AC5**：跑五段后 metrics 里五段各有一条指标记录（任一段无记录即失败）。← FR-METRIC-001
- [ ] **AC6**：扫描器能检出未接指标的 skill（漏接不被检出即失败）。← FR-METRIC-002
- [ ] **AC7**：五段都通过 stage-result 契约校验 + 各段 facts 含第 6 章约定 key 且非空（正样例：build-code 的 facts 含 `changed`+`tests` 非空 → 通过；反样例：facts 为 `{}` 或缺约定 key → 判失败）。任一段不认契约或缺约定 key 即失败。← FR-CONTRACT-001/002
- [ ] **AC8**：big / small 跳步两路均可跑通（任一路断即失败）。← FR-WIRING-002 / FR-CONTRACT-003
- [ ] **AC9**：大输出 skill 调用后主会话只增加摘要+文件引用，无大段原文（有原文即失败）。← FR-WIRING-003
- [ ] **AC10**：人/AI 实际调一遍五段串通，任一段 error / 无产物 / 产物传不到下段即失败。← FR-WIRING-002
- [ ] **AC11**：项目检查命令与测试套件全绿（含 F10/删护栏改动）。← 隐性必达 3
- [ ] **AC12**：宪法 F10 在册（21 条），check-path-guard 已删且运行时非阻断提醒保留。← 隐性必达 4

### 未决风险和问题

- **未决 1（接线隐患，非本设计问题）**：host events 当前按全局 task-id（m5）记 skill_called，可能影响 AC5 指标记录的归属判断。处置策略：本期 M6 的指标记录由各段 skill 提示词直接写 metrics_path（workflowhub 自己的指标系统），不依赖 agenthub host events；agenthub host events 接线隐患属遗留问题，在 build-code 阶段验证指标写入路径时确认 workflowhub 指标链路独立、不受其影响。
- **未决 2**：spec 质量是否覆盖所有场景、FR 是否完整，无法自动验证（design-review 人工/异源把关）。

## 11. 影响范围（业务性质）

> 只写业务，不写文件路径/代码符号。

- **新增能力**：workflowhub 首次拥有可 /命令 调起的五段开发流程骨架，编排者可按 big/small 两路驱动一条最薄端到端流程。
- **受影响的已有功能**：workflowhub 的 registry（新增五条注册）、指标系统（新增五段写入）、契约校验（新增五段 facts 子 schema 约定）、质量扫描器（扩展为能检漏接指标）。这些是既有模块的增量接入，不改其对外语义。
- **不受影响**：agenthub 全部现有功能（本期零改动）；workflowhub 宪法（保持 21 条不变）；既有运行时非阻断提醒（protected-paths）。
- **需回归路径**：项目检查命令与既有测试套件（确认既有 F10/删护栏改动与本期新增不破坏既有绿）。
- **业务规则冲击**：确立"质量靠人+异源审查、不靠运行时 gate"为 workflowhub 流程骨架的实现范式（F4/F10 落地样板），后续 workflow 比照本骨架建设。
