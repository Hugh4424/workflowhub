# 功能规格：M7 intake v1（升级 make-decision）

> 基于 SPEC.md。本文件不可覆盖项目级规则。

**功能名**: `m7-intake-v1`
**来源用户故事**: workflowhub roadmap M7（roadmap.md）
**需求权威源**: `tasks/m7-intake-v1/artifacts/decision-log.md`（13 决策 D-M7-1 至 D-M7-13）
**状态**: 草稿

## 速读卡（30 秒看懂这个需求）

- **一句话需求**：把 M6 建的薄骨架 make-decision 升级到 v1 可用——拆出 scope-triage、decision-log 两个组件 skill（各自物理独立、可独立调起），让 make-decision 能真正分流范围、产出正经决策记录；并建仓根 reuse-registry.md 登记 skill 复用信息。
- **核心改动点**（5 条）：
  - 新建 `workflows/scope-triage/` 和 `workflows/decision-log/` 两个组件 skill 目录，各放一份 SKILL.md，按"改造适配"类引入（接 workflowhub stage-result 契约 + 指标，非纯抄）。
  - 升级 `workflows/make-decision/SKILL.md`：内联 scope-triage / decision-log 逻辑摘要，显式写出两个路径引用（`workflows/scope-triage/SKILL.md`、`workflows/decision-log/SKILL.md`），stage-result facts 增加 `decision_log_path` 字段。
  - 两个组件 skill 各自调 collector 指标，stage 字段记自身 skill 名（`scope-triage` / `decision-log`），不统一记 `make-decision`。
  - 新建仓根 `reuse-registry.md`（markdown 表，每 skill 一行：skill 名 + 复用类别 + 来源路径）。
  - CI 冒烟从 5 个 skill 扩到 7 个（字面量数组独立断言），并在已有 five-skills 测试里加 reuse-registry 轻量断言。
- **最大影响面**：workflowhub 首次有 make-decision 真实可用版（scope 分流 + decision-log 收敛），是后续 M8 build-code 的依赖来源（通过 `decision_log_path` 字段读完整决策记录）；不动 agenthub 现有实现。
- **验收信号**：make-decision 执行后 decision-log 存在于 `tasks/<任务>/` 预期路径且含必要章节 → 组件 skill 可独立调起 → make-decision SKILL.md grep 到两路径引用 → collector 记录数 ≥ 本次涉及 skill 数 → reuse-registry 每行含类别 + 来源 → CI 冒烟七段全过。

## 1. 问题陈述

workflowhub 的 make-decision（M6 建的薄骨架）只是空架子，不能真正分流范围（scope-triage）、把已有输入收敛成 decision-log；也无 skill 复用登记表。M6 产出的 make-decision 能调起但 scope 判断和 decision-log 生成均为空提示词占位，下游 M8 build-code 需要从 make-decision 产物中读完整决策记录，现在没有稳定路径字段可供读取。需要在不引入过度工程的前提下，把 make-decision 升级到 v1 可用。

## 2. 背景、目标和边界

### 背景

workflowhub 已有五段薄骨架（M6），宪法 F4/F10 确立"质量靠异源审查+人，不靠运行时 gate"原则。M3 窄契约 stage-result、M4 指标系统 collector.mjs 已就位。本期在这些基础上加深 make-decision 一段。`D-M7-1` 已核实：make-decision（M6 已建）即 roadmap 所指 intake 入口，不需要再建顶层 intake 壳。`D-M7-9` 命名已全局对齐（roadmap.md 的 intake/design/plan/apply/test-acceptance 改为 make-decision/build-spec/build-plan/build-code/verify-code）。

### 目标

- make-decision v1 可用：能 scope 分流 + 把已有输入收敛成 decision-log。
- scope-triage / decision-log 作为组件 skill 物理独立，可被工头/子代理独立调起。
- make-decision stage-result facts 含 `decision_log_path`，供下游 M8 消费。
- 建 reuse-registry.md，登记所有 skill 的复用信息。
- CI 冒烟覆盖七段（含两新组件 skill）。

### 非目标（明确不做）

> 以下逐条继承自 decision-log.md 第 5 节「明确不做」，design/plan/apply 阶段不得逾越。

1. **不做 talk/grill/双路调研/方向盲审/debate 的内置深化**（留 M13"make-decision 深化"）。
2. **不纳入 intake-portable-checks**（roadmap 产出物未列；R2 盲审 blocking#2 确认移除）。
3. **不纳入 clarify-lite**（留 M13）。
4. **不新建 intake 顶层壳**（make-decision 已是 roadmap intake 唯一对应入口，D-M7-1）。

## 3. 用户场景和用例

> 角色「编排者」= 在 workflowhub 里驱动一条任务流程的人或主 AI；「子代理」= 被派去执行某段 skill 的助手。

### 场景一：编排者走完整 make-decision（正常路径）

- **角色**：编排者有一段原始需求输入，需要完成 scope 分流和 decision-log 生成。
- **操作步骤**：调起 `/make-decision`，make-decision 内部按提示词步骤执行 scope-triage（分流范围）→ decision-log（收敛产出决策记录）→ 产出 stage-result。
- **预期结果**：`tasks/<任务>/decision-log.md` 存在且含必要章节（7 节）、至少一条含来源证据的决策记录；stage-result facts 含 `decision`、`scope`、`decision_log_path` 三个 key（非空）；collector 记录数 ≥ 本次涉及 skill 数。

### 场景二：子代理独立调起组件 skill（正常路径）

- **角色**：子代理或维护者需要单独跑 scope-triage 或 decision-log。
- **操作步骤**：直接调起 `/scope-triage` 或 `/decision-log`，传入需求文本/上游内容作为输入。
- **预期结果**：scope-triage 产出范围判定结果；decision-log 产出决策内容。各自在 collector 里各留一条独立记录（execution_id 独立），stage 字段分别为 `scope-triage` / `decision-log`，不统一记 `make-decision`。

### 场景三：下游 M8 读 decision_log_path（消费场景）

- **角色**：M8 build-code 阶段的执行者需要读完整决策记录。
- **操作步骤**：从 make-decision 产出的 stage-result 读 `facts.decision_log_path` 字段，定位并读取 decision-log 文件。
- **预期结果**：能通过 `decision_log_path` 字段（形如 `tasks/<任务>/decision-log.md`）定位到完整决策记录文件，不依赖摘要。缺该字段或字段为空即失败。

### 场景四：reuse-registry 可证伪断言（失败场景）

- **角色**：维护者/CI。
- **操作步骤**：构造一行缺少复用类别或来源路径的 registry 条目，跑 five-skills 冒烟测试。
- **预期结果**：测试检出该行不合法，退出失败。删一个 skill 条目后测试仍红（字面量独立断言，不因条目缩减而跟着缩）。

### 场景五：组件 skill 未接指标（失败场景）

- **角色**：维护者/CI。
- **操作步骤**：构造一份漏掉 collector 调用的组件 skill，跑扫描器 check-stage-quality.mjs。
- **预期结果**：扫描器检出该 skill 未接指标，退出码非 0。

### 状态覆盖清单

- [x] **默认态**：场景一（make-decision 完整跑通）。
- [x] **边界态**：场景二（组件 skill 独立调起）+ 场景三（下游 M8 消费路径）。
- [x] **错误态**：场景四（registry 行不合法）+ 场景五（组件 skill 漏接指标）。
- [ ] **加载态**：N/A —— skill 是提示词 + 一次性产物，无异步加载 UI 态。
- [ ] **取消态**：N/A —— 无 gate，不设流程中断/回滚机制。
- [ ] **竞态**：N/A —— make-decision 内 scope-triage → decision-log 串行执行，无并发写同一产物设计。

## 4. 功能需求

> 溯源规则：每条 FR 标注来源 decision-log 决策编号。

#### 叙述层（给人读）

本需求的核心是**升级 make-decision + 新建两组件 skill**。INTK 域定义 make-decision 本体的升级要求——消费关系写法、路径引用约束、stage-result facts 扩展；SCOPE 域定义 scope-triage 组件 skill；DLOG 域定义 decision-log 组件 skill；REG 域定义 reuse-registry.md 及其校验要求；METRIC 域定义三 skill 各自的指标接入规则；CI 域定义 CI 冒烟从 5 扩到 7 并纳入 registry 断言的要求。

---

### make-decision 升级（INTK）

- **FR-INTK-001**：make-decision SKILL.md 必须在提示词正文中既写清 scope-triage / decision-log 各自要做什么（内联逻辑摘要），又显式写出路径引用字符串 `workflows/scope-triage/SKILL.md` 和 `workflows/decision-log/SKILL.md`，确保两路径字符串可 grep 到。来源：D-M7-1（O1 消费关系写法，已由 design 敲定）。
  - **场景**：Given make-decision SKILL.md，When grep `workflows/scope-triage/SKILL.md`，Then 有匹配（缺任一路径字符串即失败）。
  - **场景**：Given make-decision SKILL.md，When grep `workflows/decision-log/SKILL.md`，Then 有匹配（缺任一路径字符串即失败）。
- **FR-INTK-002**：make-decision 这一 stage 结束时产一张 stage-result，其 facts 必须含 `decision`、`scope`、`decision_log_path` 三个 key（均非空）；`decision_log_path` 值形如 `tasks/<任务>/decision-log.md`，供下游 M8 build-code 读完整决策记录。来源：D-M7-4（stage-result 一段一张）+ O3（decision_log_path 字段）。
  - **场景**：Given make-decision 执行后的 stage-result，When 校验 facts，Then 含 `decision`、`scope`、`decision_log_path` 三个 key 且均非空（缺任一或空值即失败）。
  - **场景**：Given `decision_log_path` 字段，When 按其路径查文件，Then 文件存在且为本次 decision-log 产物（缺路径或文件不存在即失败）。
- **FR-INTK-003**：make-decision SKILL.md 是纯提示词，不含执行代码，不为 CI 给 make-decision 加机器执行入口；提示词内容要求执行者在跑完后写一条 collector 指标记录。来源：D-M7-8（CI 冒烟按 M6:228 定义，不执行 skill 本身）。
  - **场景**：Given make-decision SKILL.md，When 检查，Then 文件内无可执行 runtime 入口代码，且提示词正文要求写 collector 指标记录。

---

### scope-triage 组件 skill（SCOPE）

- **FR-SCOPE-001**：在 `workflows/scope-triage/` 下建 SKILL.md，定性为 make-decision 的组件 skill，物理独立、可被工头/子代理独立调起；文件头写明来源路径（按"改造适配"类引入，接 workflowhub stage-result 契约 + 指标，非纯抄）。来源：D-M7-2、D-M7-3。
  - **场景**：Given `workflows/scope-triage/SKILL.md` 存在，When 检查，Then 有合法 frontmatter（name/description）可被 Skill 工具发现（缺文件或 frontmatter 非法即失败）。
- **FR-SCOPE-002**：scope-triage SKILL.md 是纯提示词，不含执行代码，不单独产 stage-result；其输入为需求文本/上游内容，输出为范围判定结果（in-scope/out-of-scope 分流）。来源：D-M7-2（组件 skill 不产 stage-result）。
  - **场景**：Given scope-triage SKILL.md，When 检查，Then 无单独 stage-result 产出要求（不误导执行者单独产 stage-result）。
- **FR-SCOPE-003**：scope-triage 独立调起时，调 collector.mjs 写一条独立指标记录，stage 字段填 `scope-triage`（自身 skill 名），不填 `make-decision`。来源：D-M7-2（O2：stage 字段记自身名）、D-M7-5（三 skill 各接指标）。
  - **场景**：Given scope-triage 执行后，When 查 collector 记录，Then 有一条 stage=`scope-triage` 的独立记录（execution_id 独立，stage 字段非 make-decision 即失败）。

---

### decision-log 组件 skill（DLOG）

- **FR-DLOG-001**：在 `workflows/decision-log/` 下建 SKILL.md，定性为 make-decision 的组件 skill，物理独立、可被工头/子代理独立调起；文件头写明来源路径（按"改造适配"类引入）。来源：D-M7-2、D-M7-3。
  - **场景**：Given `workflows/decision-log/SKILL.md` 存在，When 检查，Then 有合法 frontmatter（name/description）可被 Skill 工具发现（缺文件或 frontmatter 非法即失败）。
- **FR-DLOG-002**：decision-log SKILL.md 是纯提示词，不含执行代码，不单独产 stage-result；其输入为需求文本/已有输入，输出为收敛后的决策内容（落 `tasks/<任务>/decision-log.md`，含必要章节 7 节、至少一条含来源证据的决策记录）。来源：D-M7-2（组件不产 stage-result）、D-M7-6（产物落 `tasks/<任务>/`）。
  - **场景**：Given decision-log 执行后，When 查 `tasks/<任务>/decision-log.md`，Then 文件存在、含 7 节结构、至少一条决策记录含来源证据（空文件或占位符内容即失败）。
- **FR-DLOG-003**：decision-log 独立调起时，调 collector.mjs 写一条独立指标记录，stage 字段填 `decision-log`（自身 skill 名），不填 `make-decision`。来源：D-M7-2（O2）、D-M7-5。
  - **场景**：Given decision-log 执行后，When 查 collector 记录，Then 有一条 stage=`decision-log` 的独立记录（execution_id 独立，stage 字段非 make-decision 即失败）。
- **FR-DLOG-004**：decision-log 产物中引入时清掉 agenthub 源件内的"intake 阶段第 N 步"引用等 agenthub 专属元素（属改造工作）。来源：D-M7-6（改造工作要求）。
  - **场景**：Given decision-log 产出的 `tasks/<任务>/decision-log.md`，When 检查，Then 无 agenthub intake 阶段序号引用（残留即失败）。

---

### reuse-registry（REG）

- **FR-REG-001**：在仓根新建 `reuse-registry.md`，格式为 markdown 表，每个 skill 单独一行，含三列：skill 名、复用类别（三类枚举之一：外部改造适配 / 自研 / 其他平台原生）、来源路径（外部写路径，自研写 none）。来源：D-M7-7。
  - **场景**：Given `reuse-registry.md`，When 解析 markdown 表，Then 本里程碑引入的每个 skill 各有一行（缺任一 skill 行即失败）。
- **FR-REG-002**：reuse-registry.md 中每行必须含合法复用类别枚举值（三类之一）和非空来源路径字段；缺类别或类别非枚举值或来源为空即失败。来源：D-M7-7、D-M7-11（轻量断言校验）。
  - **场景**：Given 任一 registry 行缺类别枚举值，When 跑 five-skills 冒烟测试断言，Then 测试失败。
  - **场景**：Given 任一 registry 行来源路径为空，When 跑断言，Then 测试失败。

---

### 指标接入（METRIC）

- **FR-METRIC-001**：make-decision、scope-triage、decision-log 三个 skill 各自调 collector.mjs 写一条独立指标记录，各自一条（三条总计），各自含 execution_id、skill_version、tokens、duration_ms 等标准字段。来源：D-M7-5（三 skill 各接指标）、D-M7-4a（collector 与 stage-result 是两套独立机制）。
  - **场景**：Given make-decision 执行后（含两组件 skill 均被调起），When 查 collector 记录，Then 记录数 ≥ 本次涉及 skill 数（make-decision + 实际调起的组件 skill，各一条），任一 skill 缺记录即失败。
- **FR-METRIC-002**：scope-triage 和 decision-log 各自 collector 记录的 stage 字段必须分别为 `scope-triage` 和 `decision-log`，不能统一填 `make-decision`（便于按 skill 分析使用情况）。来源：D-M7-2（O2）。
  - **场景**：Given scope-triage 执行后的 collector 记录，When 查 stage 字段，Then 值为 `scope-triage`（非 `make-decision` 即失败）。
  - **场景**：Given decision-log 执行后的 collector 记录，When 查 stage 字段，Then 值为 `decision-log`（非 `make-decision` 即失败）。
- **FR-METRIC-003**：扫描器 check-stage-quality.mjs 扩展为能检出三个 skill 中任一未接指标的情况（退出码非 0 并指出该 skill）。来源：D-M7-5（三 skill 各接指标）；扫描器机制继承自 M6 既有 check-stage-quality.mjs（非 decision-log 决策条目，是 M6 已有基建的复用）。
  - **场景**：Given 构造一份漏接 collector 调用的组件 skill，When 跑扫描器，Then 退出码非 0 并指出该 skill（漏检即失败）。

---

### CI 冒烟与注册（CI）

- **FR-CI-001**：five-skills-present 测试从 5 个 skill 扩到 7 个——新增 `scope-triage`、`decision-log`——使用字面量数组逐个独立断言每个 skill 的存在性（make-decision、build-spec、build-plan、build-code、verify-code、scope-triage、decision-log 七个名字各自字面量断言，不能用遍历变量列表的写法，否则删掉某个 skill 后测试会跟着缩、永远不红）。来源：D-M7-7（O4，五 skills 5→7）、D-M7-8（CI 冒烟定义）。
  - **场景**：Given 七个 skill 全在，When 跑 five-skills-present 测试，Then 通过。
  - **场景**：Given 删掉 `scope-triage` 目录，When 跑测试，Then 测试红（字面量断言，缩 1 个即失败，不跟着缩）。
- **FR-CI-002**：在已有的 five-skills/冒烟测试里加 reuse-registry 轻量断言（校验 reuse-registry.md 每行含复用类别枚举值 + 来源路径非空），不新建独立 CI 脚本/job。来源：D-M7-7、D-M7-11（折中：不建独立基建，顺手加断言）。
  - **场景**：Given reuse-registry.md 任一行缺合法类别，When 跑冒烟测试，Then 该断言失败（不建独立 job，在已有测试里拦）。
- **FR-CI-003**：CI 冒烟按 M6:228 定义，只压契约管道（验 make-decision 产出走 stage-result 契约、断链即失败），不执行 skill 本身、不为 skill 加机器执行入口。来源：D-M7-8。
  - **场景**：Given CI 配置，When 检查，Then CI 冒烟不含任何 skill 执行入口（有即失败）。

## 5. 模块划分

> 各模块之间靠 stage-result 产物（文件）+ collector 记录单向传递，是窄契约耦合。

### make-decision SKILL.md（升级）

- **负责什么**：升级后的 make-decision 纯提示词，内联 scope-triage / decision-log 逻辑摘要，显式路径引用两组件，要求执行者产 stage-result（facts 含 decision + scope + decision_log_path）+ 写 collector 指标。
- **对外接口**：产 stage-result 产物（落本 task 目录），供下游 build-spec / build-code 读取；facts.decision_log_path 供 M8 读完整 decision-log。
- **依赖谁**：依赖 scope-triage 和 decision-log 组件 skill（提示词引用）、stage-result 契约、collector.mjs。

### scope-triage SKILL.md（新增）

- **负责什么**：范围分流组件 skill，判断哪些需求 in-scope / out-of-scope，输出判定结果供 make-decision 消费或单独使用。
- **对外接口**：范围判定结果（文本）+ collector 指标记录（stage=`scope-triage`）。
- **依赖谁**：依赖 collector.mjs；不依赖 stage-result（不单独产）。
- **测试边界**：可独立测（frontmatter 合法性 + collector 记录 stage 字段），深模块。

### decision-log SKILL.md（新增）

- **负责什么**：决策记录生成组件 skill，把已有输入收敛成正式 decision-log 文件（落 `tasks/<任务>/`），输出决策内容供 make-decision 消费或单独使用。
- **对外接口**：`tasks/<任务>/decision-log.md` 文件 + collector 指标记录（stage=`decision-log`）。
- **依赖谁**：依赖 collector.mjs；不依赖 stage-result（不单独产）。
- **测试边界**：可独立测（frontmatter 合法性 + 产物路径合法 + collector stage 字段），深模块。

### reuse-registry.md（新增）

- **负责什么**：全仓 skill 复用登记表，markdown 表格，每 skill 一行（skill 名 + 复用类别 + 来源路径）。
- **对外接口**：markdown 文件，供人工核对 + CI 冒烟断言读取。
- **依赖谁**：无（纯静态文档）。
- **测试边界**：在已有 five-skills 冒烟测试里加断言（行格式校验），不建独立 CI job。

### CI 冒烟（扩展）

- **负责什么**：seven-skills-present 断言 + stage-result 契约校验 + metric-scan（token 存在）+ reuse-registry 行格式校验。
- **对外接口**：测试文件（修改已有 five-skills-present 测试）。
- **依赖谁**：依赖 workflowhub 目录树 + reuse-registry.md。

## 6. 关键实体

- **make-decision stage-result 产物**（make-decision 这一 stage 结束产一张）：
  - `status`：success / failed / unknown。
  - `facts.decision`：本次拍板的方向/结论（非空）。
  - `facts.scope`：范围边界（做什么/不做什么，非空）。
  - `facts.decision_log_path`：完整 decision-log 文件的稳定路径，形如 `tasks/<任务>/decision-log.md`（非空，供 M8 消费）。
  - `error_code` / `retryable` / `missing_items` / `user_decision` / `reason`：沿用现有 stage-result.contract.json 其余字段。
- **组件 skill collector 指标记录**（scope-triage / decision-log 各一条）：
  - `execution_id`：独立（每次调起唯一）。
  - `stage`：`scope-triage` 或 `decision-log`（各自名，不统一记 make-decision）。
  - `skill_version`、`tokens`、`duration_ms`、`rework_rounds`、`human_intervention`：collector.mjs 标准字段。
- **reuse-registry.md 行**（每 skill 一行）：
  - skill 名（七个之一）。
  - 复用类别（三类枚举：外部改造适配 / 自研 / 其他平台原生）。
  - 来源路径（外部写路径，自研写 none）。

## 7. 数据和生命周期

- make-decision stage-result 产物：每次执行时产出，作为下游 build-spec / build-code 输入，生命周期随本次流程；落盘位置由 make-decision 提示词约定（落本 task 目录）。
- decision-log 产物：落 `tasks/<任务>/decision-log.md`，长期保留，供下游 M8 + 人工回溯。
- collector 指标记录：三条（make-decision + scope-triage + decision-log），追加写入全局 metrics_path，长期累积。
- reuse-registry.md：静态文档，随代码提交长期保留，每次新增 skill 追加一行。
- 本期不涉及数据库 / 迁移 / 多版本数据演进。

## 8. 兼容性预留

本期不切片，标"本期不涉及"。make-decision SKILL.md 是升级（非新建），facts key 新增 `decision_log_path` 属 additive 扩展（原有 `decision`/`scope` 保留）。两组件 skill 是新增目录，不影响已有五段。reuse-registry.md 是新增文件，不改现有任何契约。

## 9. 不做和隐性必达

> 不做范围见第 2 章「非目标」4 条（继承 decision-log.md 第 5 节）。以下是默认隐性必达条件：

- **隐性必达 1**：不改 agenthub 现有实现，所有改动落 workflowhub 仓。
- **隐性必达 2**：不引入运行时阻断式 gate（宪法 F4/F10），collector 记录和 stage-result 是两套独立机制（D-M7-4a），不混用。
- **隐性必达 3**：项目检查命令与测试套件全绿（含 M6 既有改动，本期不得回退）。
- **隐性必达 4**：宪法保持 21 条、F10 在册，既有运行时非阻断提醒（protected-paths）不破坏。
- **隐性必达 5**：可证伪、不假绿（宪法 F9）——每条验收必须能在"为假时"被检出；FR-CI-001 的字面量断言是实现此约束的机制（禁止用遍历清单代替）。
- **隐性必达 6**：roadmap.md 命名全局对齐（D-M7-9：intake/design/plan/apply/test-acceptance 改为 make-decision/build-spec/build-plan/build-code/verify-code）。**改名范围仅限 roadmap.md 文档**；workflowhub 代码里 intake 是正式 stage 名（FIVE_STAGES、契约值 intake->design、contract-freeze 测试、workflows/_spike/*.mjs、README/CONTEXT/CONSTITUTION），改名牵连契约+测试+CI，经用户拍板（design 阶段）暂不改、出 M7 范围、另起独立 task。代码级 intake 改名不在本期 apply 范围内。

## 10. 验收清单及未决问题

> 逐条来自 decision-log 第 7 节验收标准（6 条），均带失败判据、均可判真伪，并细化为 FR 可追溯。

### 验收检查（success_criteria）

- [ ] **AC1**：**M7 验收（契约/记录层，机器可查）**：make-decision SKILL.md 正确指令产出 `tasks/<任务>/decision-log.md`——该产物契约由 decision-log 组件 skill 定义（完整 7 节结构 + 至少一条含非空来源证据字段的决策记录），且 make-decision 的 stage-result facts 含非空 `decision_log_path` 指向该路径。验证方式（参考，非 oracle）：核对 SKILL.md 契约 + facts-subschema，通过标准是文件/契约状态而非命令执行结果（M7 无机器执行入口，见 FR-INTK-003 / D-M7-8）。反向（M7）：产物契约缺任意节、缺来源证据字段、或 decision_log_path 空/占位符，即失败。**M8+ 运行时 oracle（deferred）**：实际跑一次 make-decision 产出真实 decision-log.md 文件并按上述结构核对，依赖 M8+ 集成入口届时坐实。← FR-DLOG-002 / FR-INTK-002
- [ ] **AC2**：三个 skill 目录状态为：`workflows/make-decision/SKILL.md`、`workflows/scope-triage/SKILL.md`、`workflows/decision-log/SKILL.md` 各自存在 + frontmatter 含合法 name/description 字段 + 可被 Skill 工具发现（2/2 组件 skill 路径均可独立调起）。反向：任一 skill 目录缺失、frontmatter 非法或缺 name/description、或不可被 Skill 工具发现，即失败。← FR-SCOPE-001 / FR-DLOG-001 / FR-INTK-003
- [ ] **AC3**：**M7 验收（契约/记录层，机器可查）**：make-decision / scope-triage / decision-log 三个 SKILL.md 各被指令写一条独立 collector 记录（metric wiring 完整：recordSkeleton + updateOwnResult + collector.mjs 引用 + stage 字面量正确），故一次完整流程的记录数契约 ≥ 实际调起 skill 数（各一条，上限 3 条），每条 execution_id / stage / skill_version 字段非空。验证方式（参考，非 oracle）：核 scanSkillMetrics 扫描 + metric-scan 测试，通过标准是 metric wiring 契约状态而非命令执行结果（M7 无机器执行入口，见 FR-CI-003 / D-M7-8）。反向（M7）：任一 skill metric wiring 不全、stage 字面量错、或契约字段空，即失败。**M8+ 运行时 oracle（deferred）**：实际跑一次产真实 collector 记录并按记录数核对，依赖 M8+ 集成入口届时坐实。← FR-METRIC-001
- [ ] **AC4**：reuse-registry.md 状态为：本里程碑引入的 7 个 skill 各有一行 + 每行复用类别属于枚举三值（外部改造适配 / 自研 / 其他平台原生）+ 每行来源路径非空（外部写路径，自研写 none）。反向：缺任意 skill 行、类别非枚举值、或外部 skill 来源路径为空，即失败（在 five-skills 冒烟测试里字面量断言，不建独立脚本，见 FR-CI-002）。← FR-REG-001 / FR-REG-002 / FR-CI-002
- [ ] **AC5**：**M7 验收（文件/记录契约层）**：make-decision SKILL.md 文件内状态为：路径字符串 `workflows/scope-triage/SKILL.md` 和 `workflows/decision-log/SKILL.md` 均以字面量形式存在于文件正文中（2/2 路径均在场）；且 scope-triage 与 decision-log 两组件 SKILL.md 各被指令写一条 stage 字面量分别为 `scope-triage` / `decision-log` 的独立 collector 记录（独立 execution_id 由各组件 skill 指令保证，stage 字面量由 scanner 可证伪守护）。反向（M7）：任一路径字符串缺失、或任一组件 stage 字面量错/wiring 不全，即失败。验证方式（参考，非 oracle）：可用字符串搜索辅助核对，但通过标准是文件状态而非命令执行结果（M7 无机器执行入口，见 FR-INTK-003 / D-M7-8）。**M8+ 运行时 oracle（deferred）**：实际跑后 collector 记录中两组件各有独立 execution_id（2/2），依赖 M8+ 集成入口届时坐实。← FR-INTK-001 / FR-SCOPE-003 / FR-DLOG-003
- [ ] **AC6**：冒烟测试套件状态为：4/4 谓词全部满足——①seven-skills-present：7 个 skill 名字面量独立断言均在场（删任一 skill 目录则 1/7 断言为假即红）；②stage-result 契约形状：make-decision 产出的 stage-result facts 含 decision、scope、decision_log_path 三个非空 key（3/3 key 在场）；③metric-scan：三个 skill 的 collector 记录中 tokens 字段均非空（3/3 记录 tokens 在场）；④reuse-registry 行格式：7 行各满足类别枚举 + 来源非空（7/7 行合法）。反向：任一谓词不满足（缺 skill、缺 key、tokens 为空、行格式非法），即冒烟失败。验证方式（参考，非 oracle）：可运行测试套件辅助核对，但通过标准是上述状态谓词均为真而非"测试命令执行成功"。← FR-CI-001 / FR-CI-002 / FR-CI-003

### 未决风险和问题

- **~~未决 1（roadmap.md 改名范围）—— 已决~~**：design 阶段已完成全局审计。roadmap.md 内约 26 处 intake（M6/M7/M10/M13/X4 段）属本次改名范围；workflowhub 代码侧的 intake 字面量已逐一枚举（verify-structure.mjs FIVE_STAGES、component-output.contract.json 的 intake->design 契约值、contract-freeze.test.mjs 断言、workflows/_spike/*.mjs、README/CONTEXT/CONSTITUTION），经用户拍板暂不改、出 M7 范围。apply 阶段只改 roadmap.md，不触代码侧。
- **~~未决 2（组件 skill 概念扩展性）—— 已决~~**：「组件 skill」是 M7 新引入概念（D-M7-2），其定义写入 workflowhub `CONTEXT.md`（或 `SPEC.md`），**不动宪法 21 条**。核心定义：组件 skill 是从属于某一顶层 skill 的可独立调起子流程，不单独产 stage-result，只产 collector 指标记录；来源/消费关系由顶层 skill 提示词显式引用路径字符串声明。apply 阶段在 CONTEXT.md 补此定义段，防后续 M8+ 执行者对"组件 skill 是否单独产 stage-result"产生歧义。

## 11. 影响范围

> 按合约：本项目只改动 workflowhub 仓，不碰 Multica 路由/API/shared 组件。

### 新增文件（workflowhub 仓）

- `workflows/scope-triage/SKILL.md` — 新增 scope-triage 组件 skill
- `workflows/decision-log/SKILL.md` — 新增 decision-log 组件 skill
- `reuse-registry.md` — 新增仓根 skill 复用登记表

### 修改文件（workflowhub 仓）

- `workflows/make-decision/SKILL.md` — 升级：内联两组件逻辑摘要 + 显式路径引用 + facts 扩展 `decision_log_path`
- `config/workflowhub.yaml` — scope-triage / decision-log 两个组件 skill 注册进 registry（Phase 1 T003、Phase 2 T007）
- `contracts/facts-subschema.json` — make-decision.required_keys 追加 decision_log_path（FR-INTK-002，Phase 3 T010）
- `tests/facts-subschema.test.mjs` — decision_log_path 的红/绿测试（Phase 3 T009）
- `tests/metric-scan.test.mjs` — 三 skill 指标接入扫描测试（FR-METRIC-003，Phase 5 T018）
- `/Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/agenthub-extraction-program/artifacts/roadmap.md`（Knowledge 仓，**不在 workflowhub 仓**）— 命名全局对齐（intake→make-decision 等，D-M7-9；仅改 roadmap.md 文档约 26 处 M6/M7/M10/M13/X4 段命名，代码级 intake 改名出 M7 范围）
- 已有 five-skills/冒烟测试文件 — five-skills-present 从 5 扩到 7（字面量断言）+ 加 reuse-registry 轻量断言
- `scripts/check-stage-quality.mjs` — 扩展为能检出三个 skill（make-decision、scope-triage、decision-log）中任一未接指标（FR-METRIC-003，D-M7-5）
- `CONTEXT.md` — 补充「组件 skill」概念定义段（已决 2，D-M7-2）

### 不涉及

- agenthub 全部现有实现（零改动）
- workflowhub 宪法条目（保持 21 条不变，不追加任何条目）
- Multica 路由 / API / shared 组件（零改动）
- contracts/stage-result.contract.json（复用现有契约，不新建 schema，D-M7-4）
- workflowhub 代码里 intake 作为 stage 名/契约值（FIVE_STAGES、intake->design 等）——本期不改，另起独立 task
