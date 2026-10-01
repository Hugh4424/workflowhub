# 调研产出：phase 模板质量差距诊断与改进提案

- 调研对象仓库：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-03-20260919`
- 被诊断文件：`skills/spec-plan/templates/phase-template.md`（全文 56 行）
- 质量标杆：`skills/spec-plan/templates/plan-template.md`（全文 257 行）
- 本文件为只读调研产出，不修改仓库任何文件。

---

## §1 phase 模板现状诊断

### 一、结构（骨架）缺失

**D1｜phase 模板没有「模板版本」标记，plan 模板有。**

- 现状：`skills/spec-plan/templates/phase-template.md` 第 1–6 行只有标题 + 4 个元信息条目（全局规格 / 写入集 / 依赖 / 消费者），**通篇没有版本号字段**。
- 对照：`skills/spec-plan/templates/plan-template.md:3-4` 逐字为
  ```
  - **输入材料**：`[填写：decision-log.md 引用]`、`[填写：spec.md 引用]`
  - **模板版本**：`plan-task.v4`
  ```
- 差距：reader（人和 agent）无法从 phase 文档本身判断它按哪一版模板产出；版本漂移时无法定位。

**D2｜phase 模板没有「材料导航」表，plan 模板第一屏就是导航表。**

- 现状：phase 模板只在第 3 行给了一条 `- **全局规格**: \`spec.md#[稳定目标锚点]\`（全局目标与实现设计）`，把「读什么」压缩成一行。
- 对照：`skills/spec-plan/templates/plan-template.md:6-15` 是完整的一节 `## 材料导航`，含一段说明文字加一张 3 列 4 行表：
  ```
  ## 材料导航

  [填写：根据当前四份材料的实际章节与锚点再生成本表；仅用于定位，正文仍由各自材料负责。M/S/B/P 表示主会话、子代理、后台执行和并行工作在何时读取，不产生第五份权威材料。]

  | 章节 / 材料锚点 | 职责与摘要 | M/S/B/P 读取时机 |
  | --- | --- | --- |
  | `decision-log.md#[填写：实际决策锚点]` | 已确认的方向、范围、理由与非目标 | [填写：读取角色与时机] |
  | `spec.md#[填写：实际 FR/AC 锚点]` | 产品行为、状态、验收判据与失败边界 | [填写：读取角色与时机] |
  ```
- 差距：phase 文档的读者（build-code 的执行者）拿不到「本 phase 与 spec.md / decision-log.md / index.md 的锚点对应关系表」，也无「谁在何时读」的指引。

**D3｜phase 模板没有「速读卡」区，plan 模板有独立的 6 字段速读卡。**

- 现状：phase 模板第 8–10 行 `## L0 — 结果与变更` 正文只有一行括号占位符 `[可观察的结果，以及本 Phase 与其它 Phase 的区别。指向全局目标，不要重复它的完整叙述。]`。
- 对照：`skills/spec-plan/templates/plan-template.md:17-24` 逐字为
  ```
  ## 速读卡

  - **目标**：[填写：完成后的可观察结果]
  - **非目标**：[填写：明确不做什么]（来源：[填写：已确认的来源/决定引用]；决定：[填写：决定编号]）
  - **改动前**：[填写：已核实的当前行为或缺口]
  - **改动后**：[填写：目标行为]
  - **主要风险**：[填写：最可能影响交付的风险]
  - **下一步**：[填写：首个可执行动作或停止条件]
  ```
- 差距：plan 用「目标 / 非目标 / 改动前 / 改动后 / 主要风险 / 下一步」六个固定问题把读者在 10 秒内带到位；phase 的 L0 只有一条自由文本，作者写一句话就能交差，可读性上限被模板本身锁死。

**D4｜phase 模板把「文件边界」压成 L1 里的 3 条平铺 bullet，plan 模板给它独立一节 + 3 个三级标题。**

- 现状：`skills/spec-plan/templates/phase-template.md:16-18` 逐字为
  ```
  - **新增**: [精确路径，或 `N/A — 理由`]
  - **修改**: [精确路径，或 `N/A — 理由`]
  - **禁止改动**: [精确的受保护路径与理由]
  ```
  它们在 `## L1 — 可执行契约` 之下，和「测试策略」「停止」「完成」混在同一串 11 条 bullet 里。
- 对照：`skills/spec-plan/templates/plan-template.md:102-114` 逐字为
  ```
  ## 文件边界

  ### 新增

  - `[填写：精确新增文件路径 / N/A — 理由]`

  ### 修改

  - `[填写：精确修改文件路径]`

  ### 禁止改动

  - `[填写：精确保护文件路径及理由]`
  ```
  并且 `<ul>` 用的是 bullet list（每个路径一行），而不是单行括号。
- 差距：phase 的「新增/修改」被限制成一行文本，多文件时只能堆成逗号串，无法逐文件标注消费者与理由；plan 允许每文件一行。

**D5｜phase 模板完全没有「技术决策 / DEC」区块，plan 模板有结构化的 11 字段决策块。**

- 现状：搜索 phase 模板全文 56 行，**没有出现 `DEC-`、`决策`、`候选方案`、`理由`、`回退方式` 任何字样**。
- 对照：`skills/spec-plan/templates/plan-template.md:116-130` 逐字为
  ```
  ## 技术决策

  ### DEC-001 — [填写：决策名称]

  - **问题**：[填写：真实工程问题]
  - **候选方案**：[填写：候选方案及取舍]
  - **已选**：[填写：复用 / 扩展 / 新增 及选择]
  - **理由**：[填写：为什么是最简单的充分方案]
  - **后果 / 风险**：[填写：代价和风险]
  - **回退方式**：[填写：边界内回退方式]
  - **F10 真实威胁**：[填写：仅「已选」为新增时保留]
  - **F10 既有覆盖**：[填写：仅「已选」为新增时保留]
  - **F10 可绕过**：[填写：仅「已选」为新增时保留]
  - **F10 维护成本**：[填写：仅「已选」为新增时保留]
  - **F10 处置**：[填写：`keep` / `simplify` / `remove`]
  ```
- 差距：一个 Phase 内部的真实工程取舍（例如「为什么这个 Task 用扩展而不是新增」「为什么这条接缝这样冻结」）在 phase 模板里**没有归属章节**，作者只能塞进 `**动作**:` 一句话里，或干脆不写。

**D6｜phase 模板没有任何表格（0 张），plan 模板有 5 张表。**

- 现状：phase 模板 56 行内 `|` 字符出现次数为 0（正文无 markdown 表格）。
- 对照：`skills/spec-plan/templates/plan-template.md` 有 5 张表 —— 材料导航表（L10-15）、复用→扩展→新增表（L49-51）、测试策略表（L137-140）、需求与验证追踪表（L174-176）、治理同步矩阵表（L180-182）。
- 差距：phase 文档最需要的两类信息恰恰天然是表格 ——「AC → Task → gate_cmd → ORACLE → 证据路径」追踪链，和「Task 编号 → 依赖 → 文件所有权」并行表。phase 模板一个都没有，导致这些信息在真实文档里散落在各 Task 卡片内，不可横向比对。

### 二、可阅读性缺失

**D7｜phase 模板的占位符写法与 plan 模板不一致，且没有统一的可检索前缀。**

- 现状：phase 模板用**裸方括号**，例如第 10 行 `[可观察的结果，以及本 Phase 与其它 Phase 的区别。指向全局目标，不要重复它的完整叙述。]`、第 14 行 `[接口、类型、状态迁移、失败语义]`、第 15 行 `[来源、FR 与 AC 编号]`。全文只有第 16、17 行两处出现 `N/A — 理由`。
- 对照：`skills/spec-plan/templates/plan-template.md` **几乎每个占位符都以 `[填写：...]` 开头**，例如第 19–24 行 6 个速读卡字段全部是 `[填写：完成后的可观察结果]`、`[填写：明确不做什么]`…第 57 行 `[填写：用 2–4 个短段落讲清完整技术链路、关键数据流和最小改动方式。]`。
- 差距：`[填写：` 是一个可 grep 的「作者还没填」标记；phase 模板的裸 `[` 与正文中方括号、markdown 链接语法无法区分。实作后果：作者漏填的字段没有统一信号，审查方也无法用一条命令列出所有未填项。

**D8｜phase 模板缺少对「该写多少」的量化指引，plan 模板给了具体字数/条数。**

- 现状：phase 模板第 10 行只说「指向全局目标，不要重复它的完整叙述。」——没有长度锚。第 31 行 `**动作**: [在每个锚点上的有序改动或操作、数据与控制流、兼容边界；要足以让人不必猜产品就找到第一处改动]` 同样只有定性描述。
- 对照：`skills/spec-plan/templates/plan-template.md:57` 逐字为 `[填写：用 2–4 个短段落讲清完整技术链路、关键数据流和最小改动方式。]`；第 142 行还给了大段解释性正文（见 D10）。
- 差距：plan 模板用「2–4 个短段落」把自由文本变成有下界的任务；phase 模板的自由文本字段全部没有下界，作者写一句话即「已填写」，这是「内容量差很远」的直接机制。

**D9｜phase 模板的 L1 是 11 条 bullet 的「平墙」，没有三级标题分组，读者无法折叠定位。**

- 现状：`skills/spec-plan/templates/phase-template.md:12-24` —— `## L1 — 可执行契约` 之下连续 11 条 `- **字段名**: [...]`，从「输入与输出」一直到「风险与回滚」，中间没有任何 `###` 分隔。
- 对照：`skills/spec-plan/templates/plan-template.md` 在每个 `##` 之下都用 `###` 再分组：`## 技术上下文` → `### 全局约束`（L26-28）、`## 方案设计` → `### 总览` / `### 模块职责` / `### 接口、数据与生命周期`（L53-68）、`## 文件边界` → `### 新增` / `### 修改` / `### 禁止改动`（L102-114）、`## 风险与回滚` → `### 工程风险交接`（L152）。
- 差距：phase 的 L1 在真实文档里会膨胀成几百行（每个 Task 卡片 21 个字段），没有分组标题就没有目录结构，阅读器（含 IDE 大纲视图）只能看到一个巨大的 L1。

**D10｜phase 模板几乎没有「说明正文」——全文只有 3 行指导语，plan 模板有成段的方法论正文。**

- 现状：phase 模板的说明性散文**只有第 50–52 行**共 3 行：
  ```
  每个 Task 都完整重复一张 `Tnnn` 卡片。`T001` 只用于全任务的第一个 Task 卡片；
  下一个 Phase 接续编号，而不是重新从 `T001` 开始。不要把多个 Task 压缩成一行、
  借用别的 Phase 的 Task 正文，或把执行状态写进这份由人编写的文件。
  ```
  其余 53 行全部是标题 + 占位符 bullet。
- 对照：`skills/spec-plan/templates/plan-template.md` 有多处成段的方法论正文 —— 第 134–135 行：
  ```
  设计 RED/GREEN，不在 build-plan 执行命令。两者使用同一条 `gate_cmd` 和
  同一个判据身份；`gate_cmd` 只是测试命令，不是工作许可证。
  ```
  第 142 行（一整段）：`规划涉及真实验收时，在现有接口契约和任务卡中绑定 tier、数据来源/样例/场景、逐 AC 判据与原始证据消费者。\`command\` 设计 argv/timeout；\`service\` 设计相对工作树的 module/export/input/timeout；精确 JSON 形状与逐 AC \`entries[].assertions\` 输出见 tasks-template 的交付契约字段。build-plan 只设计，build-code 的认证结果驱动真实执行；verify-code 认证当前执行、普通独立审查与用户确认，三者缺一保持缺失/不可用。`
  第 144 行（一整段）：`审查通过既有入口产生 canonical attempt/result，消费者使用实际引用/哈希认证；partial、provider/transport 失败及缺失 usage/timing 保留原事实。阶段反思使用 v2、唯一显式结果与返回的语义引用/原始哈希，A 复用首件、B 保留 A；原 stage 错误与 reflection_error 分别披露。这些约束写进现有任务输出/证据/恢复栏，不增加执行状态权威。`
- 差距：plan 模板自己解释「为什么这样填」（RED/GREEN 同一条命令的道理、认证与事实的边界）；phase 模板只给字段名，作者必须靠 SKILL.md 之外的上下文猜意图。

### 三、内容量缺失

**D11｜phase 模板没有「需求与验证追踪」表，plan 模板有 7 列追踪表。**

- 现状：phase 模板 0 张表；FR/AC 只在第 15 行 `- **FR / AC**: [来源、FR 与 AC 编号]` 和 Task 卡第 28 行出现，都是自由文本，无法横向对齐。
- 对照：`skills/spec-plan/templates/plan-template.md:172-176` 逐字为
  ```
  ## 需求与验证追踪

  | 来源 / 决定 | FR | AC | Phase / Task | 依赖 | 精确文件 | 命令 / 判据 |
  | --- | --- | --- | --- | --- | --- | --- |
  | [填写：R*/D*] | [填写：FR-ID] | [填写：AC-ID] | [填写：P1/T001] | [填写：T-ID / 无] | `[填写：精确路径]` | `[填写：命令 / ORACLE-ID]` |
  ```
- 差距：phase 是最贴近执行的文档（含 gate_cmd、ORACLE、证据路径），却反而没有这张表；build-code 要确认「这条 AC 由哪个 Task 的哪条命令证明」时必须逐卡片翻找。

**D12｜phase 模板没有「风险与回滚」的结构化块，plan 模板有具名风险块 + 6 个子字段。**

- 现状：phase 模板第 24 行只有一条：`- **风险与回滚**: [触发条件、影响、缓解办法、可回滚动作]`，且在 L1 内部，与「完成」并列。
- 对照：`skills/spec-plan/templates/plan-template.md:146-160` 逐字为
  ```
  ## 风险与回滚

  - **全局恢复规则**：[填写：只回滚当前实现，保留四份材料和既有质量事实]
  - **不可逆边界**：[填写：需要明确授权的 commit/push/merge/archive/cleanup；无则写 `N/A — 理由`]
  - **恢复负责人**：[填写：失败后由谁执行哪一步]

  ### 工程风险交接

  - **PLAN-RISK-001**：[填写：风险主题]
    - **受影响 ID**：[填写：来源/FR/AC/T-ID]
    - **触发条件**：[填写：何时发生]
    - **后果**：[填写：可观察后果]
    - **缓解或停止**：[填写：最小缓解或停止条件]
    - **处理阶段**：[填写：build-plan / build-code / verify-code]
    - **验证**：[填写：如何证明已处理或仍存在]
  ```
- 差距：phase 的「风险」是一条逗号串，plan 的每条风险有名字（`PLAN-RISK-001`）、受影响 ID、触发条件、后果、缓解、处理阶段、验证 —— 7 个可追踪槽位。phase 文档里的风险无法被下游引用。

**D13｜phase 模板没有「测试策略」表，plan 模板用一张 5 列表把 RED/GREEN 成对呈现。**

- 现状：phase 模板第 20 行 `- **测试策略**: [跨 Task 的行为、状态、错误、权限、并发与接缝风险；每个不相关的维度都要写 \`N/A — 理由\`]`；Task 卡内拆成第 39–44 行 6 条分散的字段（RED/GREEN 门禁命令、预期退出码、RED 目标失败、RED 证据、GREEN 判定器、证据）。
- 对照：`skills/spec-plan/templates/plan-template.md:137-140` 逐字为
  ```
  | 目标 | Task | 角色 | gate_cmd / 预期退出码 | 判据 / 证据路径 |
  | --- | --- | --- | --- | --- |
  | [填写：FR/AC] | [填写：T-ID] | RED | `[填写：可执行命令]` / `[填写：非零]` | `[填写：ORACLE-ID、失败信号、相对任务根路径]` |
  | [填写：FR/AC] | [填写：T-ID] | GREEN | `[填写：同一命令]` / `0` | `[填写：同一 ORACLE-ID、成功/负例、相对任务根路径]` |
  ```
- 差距：phase 把同一条命令的 RED 面与 GREEN 面拆在 6 个 bullet 里，作者极易只填一半；plan 用上下两行强制成对呈现（「`[填写：同一命令]`」「`[填写：同一 ORACLE-ID]`」逐字提示必须一致）。

**D14｜phase 模板没有治理同步与宪法检查区，plan 模板有矩阵表 + 22 条逐项检查。**

- 现状：phase 模板 0 处理。
- 对照：`skills/spec-plan/templates/plan-template.md:178-208` —— `## 治理同步矩阵` 表（列：治理面 / 实际文件 / 变更 或 不变更 / Task 编号 / 理由），和 `## 宪法逐项检查`（第 186 行绑定 JSON `{"artifact_kind":"constitution","ref":"[填写：constitution-checklist.md 引用]","hash":"[填写：真实 SHA-256]","id":"CONSTITUTION","version":"[填写：版本]","clause_count":22}`，随后 F1–F11、Q1–Q3、S1–S8 共 22 条）。
- 差距：Phase 是实际改文件的单位（写入集在 L4），却没有任何治理面登记位；宪法条款若在本 Phase 内被触碰，无处记录。

**D15｜phase 模板没有「知识交接」与「实施顺序 / 依赖与并行」的独立位置。**

- 现状：phase 模板第 19 行 `- **任务顺序**: [全任务唯一且稳定的 Task 编号；按索引里的 Phase 顺序与 Phase 内执行顺序连续编号，接续上一个 Phase 而不是重新开始；显式写出更早的依赖与串行/并行理由]` —— 一段长文本混编「编号规则 + 依赖 + 串并行理由」，无独立章节。
- 对照：`skills/spec-plan/templates/plan-template.md:162-170` 分成两节：
  ```
  ## 实施顺序

  [填写：producer-before-consumer 顺序、Phase 编号和必须串行的原因。]

  ## 依赖与并行

  - **依赖**：[填写：producer → consumer 及串行原因；无则写 `N/A — 理由`]
  - **并行工作**：[填写：独立输入、依赖和文件所有权；无则写 `N/A — 理由`]
  - **外部依赖**：[填写：已核实依赖与缺失语义；无则写 `N/A — 理由`]
  ```
  另有 `plan-template.md:243-245` 的 `### 知识`：`[填写：下一阶段必须知道的已核实事实。]`。
- 差距：phase 模板没有「本 Phase 完成后下一阶段必须知道的已核实事实」这一槽位，跨 Phase 的知识沉淀只能靠 L2 或口头传承。

### 四、SKILL.md（作者指导）暴露的模板缺口

`skills/spec-plan/SKILL.md` 全文仅 30 行，是 phase 作者的唯一指导文件。它提出的要求**明显多于 phase 模板给出的槽位**——模板承载不了指导，这是差距的根因之一。

**D16｜SKILL.md 要求「每个行为 Task 记录 12 项」，phase 模板的 Task 卡没有把它们显式分槽。**

- 出处：`skills/spec-plan/SKILL.md:26` 逐字为
  ```
  Every behavior Task records tier, concrete testing skill, scenario/input, fixture or service, command, expected exit, oracle, test path, actual RED ref or honest unavailable, GREEN evidence path, coverage limit, and STOP.
  ```
- 现状：phase 模板第 35–45 行把这些挤进 8 条 bullet（测试层级/技能、场景/夹具或服务、RED/GREEN 门禁命令、预期退出码、RED 目标失败、RED 证据、GREEN 判定器、证据、覆盖上限、停止/恢复）。
- 差距：SKILL.md 里的 `test path`（本 Task 独占的测试文件路径）在模板中只作为「预写测试」括号内的一句说明出现（`phase-template.md:37`），没有独立字段名；作者漏填时无痕迹。

**D17｜SKILL.md 明确「Phase 只写增量 + 指向 spec.md 的稳定指针」，但模板没写「这里不要重复全局设计」的边界提示。**

- 出处：`skills/spec-plan/SKILL.md:12` 逐字为
  ```
  A Phase contains only its implementation delta and a stable pointer to the global goal in `spec.md`, not a copy of the global design or another Phase.
  ```
  以及 `skills/spec-plan/SKILL.md:10` 说明 `spec.md` 已经拥有 `code anchors, chosen solution, interfaces, global file boundary, dependency graph, source → FR → AC → Phase → oracle trace, risks, rollback, and testing strategy`。
- 现状：phase 模板对「什么该写、什么不该重复」只在第 10 行给了一句 `指向全局目标，不要重复它的完整叙述。`；其余字段**没有一处**声明「此内容归 spec.md，本处只写增量」。
- 差距（对本提案是关键约束）：plan 模板里看起来「更丰富」的章节（技术上下文、方案设计、技术决策、宪法逐项检查、需求与验证追踪、治理同步矩阵），在 post-cohort 里**多数已归 `spec.md`**。因此 phase 模板的提升方向**不能是照搬 plan 的全局章节**（那会造成双写，违反 AGENTS.md 的「post 不生成 plan.md/tasks.md 双写」与「材料形态变化不新增 stage、gate 或第二套进度权威」），而应是：**在不新增权威内容的前提下，把已有字段写实、写满、写清楚，并补足纯阅读性的脚手架**。

**D18｜SKILL.md 用「执行干跑」作为质量判据，模板没有任何干跑提示。**

- 出处：`skills/spec-plan/SKILL.md:28` 逐字为
  ```
  Perform an execution dry-run on each Task card: can an implementer using only current spec, index, and that Phase identify the first symbol to inspect, the first edit, target RED, GREEN, negative case, and recovery without inventing a product choice? Repair any no. Independent findings review and final `spec-analyze` are quality facts, not work permits. Preserve partial and unavailable facts honestly; repair valid findings in this task.
  ```
- 现状：phase 模板第 50–52 行的唯一一段指导语只讲「每个 Task 都要重复卡片、编号连续、不要写执行状态」，**完全没有提「干跑六问」**。
- 差距：作者在模板里看不到验收自己文档的方法，模板因而不具备自我校验的脚手架。

（runtime 契约与契约测试的硬约束见 §2。）

### 五、真实作者写出来的 phase 文档 vs 模板（样例实证）

样例：`specs/archive/workflowhub-thin-core-card-05-20260919/phases/P1.md`（全文 73 行，含 1 张任务卡）。

**D19｜真实作者把「文件级契约头」放在正文最上方，而中文模板没有给这个位置。**
- 样例逐字（`specs/archive/workflowhub-thin-core-card-05-20260919/phases/P1.md:3-11`）：
  ```
  - **Global spec**: `spec.md`
  - **Write set**: `specs/workflowhub-thin-core-card-05-20260919/spec.md`; `docs/adr/0032-review-chain-delegation-and-layer-contract.md`
  - **Dependency**: `none`
  - **Consumer**: P2、P3、P4、P5
  - **gate_cmd**: `npx vitest run tests/contract/post-phase-contract.test.mjs`
  - **oracle**: ORACLE-P1-STRUCTURE phase contract structure and readback.
  - **evidence_path**: `quality/evidence/card05/P1-structure.json`
  - **STOP**: 六要素、FN 真值状态或同型实验输入未能逐项落到可回读原件时停止首次 OCR 接入。
  - **Done**: 合同、来源、十面映射、FN 状态与实验时序可回读；未知保持 unknown，不下 go 结论。
  ```
- 现状模板：`skills/spec-plan/templates/phase-template.md:3-6` 只有 4 条（全局规格 / 写入集 / 依赖 / 消费者），**`gate_cmd`、`oracle`、`evidence_path`、`STOP`、`Done` 一个都不在文件级**（它们只散落在任务卡 L39–44 与 L1 的 停止/完成 L22–23）。
- 差距：runtime 的文件级检查（§2 A11、A12）读的正是这 5 项；样例作者用「顶部契约头」满足它，中文模板把这个位置整体丢了。**这是本提案最重要的一处结构修复。**

**D20｜真实作者在任务卡里自造表格，因为模板没有表格位。**
- 样例逐字（`.../phases/P1.md:56-67`）：`### FN1–FN6 真值冻结位（逐项，不以口述计数代替原件）`，随后是 5 列表头 `| ID | s4 原件 ref/hash | file:line 与 claim | 当前真值状态 | 首次实验前关闭条件 |`，再补一段 `本表是待核验槽位，**不是**六条真值已被认证。…`
- 现状模板：0 张表（见 D6）。
- 差距：模板不给逐项状态表位，作者只能即兴发明；不同作者发明的表结构不同，可读性与可审查性无法复现。

**D21｜真实作者把「软字段」写成不加粗的普通文本，暴露模板把机器字段与人读字段混为一谈。**
- 样例逐字：`.../phases/P1.md:43` `Prewritten test: G-2 N/A — …`、`:44` `Observable seam: decision-log/PRD 原文 → spec/ADR 合同 → P3 adapter、P5 实验判定；…`、`:48` `RED evidence: 尚未执行；当前草稿不得称 RED。`、`:53` `test change request: none。`（四处**都没有加粗标记**）
- 对照：runtime 的 17 项必填字段（§2 A15）**不含** Prewritten test / Observable seam / RED evidence / test change request；而两份额外约束（§2 C2-8）要求模板含 `预写测试`、`RED 证据`、`测试变更请求`。
- 差距：模板把 21 个字段一律写成同级加粗 bullet，作者与审查方无法从版面上区分「机器会拒收的 17 项」与「人读的 4 项」。

**D22｜字段词表有三套且互不重合，模板没有单一事实来源。**
- 三套词表：runtime 必填 17 项英文（§2 A15）、契约测试要求的 10 + 12 项中文（§2 C1-2、C2-3）、现模板列出的 21 项中文（`phase-template.md:28-48`）。
- 差集样例：`预期退出码`（模板 L40）对应 runtime 的 `expected_exit`，但**不在**测试要求的 12 项中文断言里；`可观察接缝`（模板 L38）runtime 与测试都不查；`预写测试`/`RED 证据`/`测试变更请求`（模板 L37、L42、L47）测试要求存在、runtime 不查。
- 差距：模板没有标注「哪几项会被机器拒收」，三张词表的关系只能靠人肉比对。

**D23｜模板缺 Phase 级「验证」位，plan 模板有。**
- 对照逐字（`skills/spec-plan/templates/plan-template.md:239-241`）：
  ```
  ### 验证

  [填写：命令、预期退出码、判据、证据路径；与本 Phase 任务判据对齐。]
  ```
  其英文常量名 `Verify` 见 `runtime/stage/stage-content-contracts.mjs:4492` 的 `PHASE_FIELDS_V3`（该数组逐字为 `["Goal", "Files", "Tasks", "Verify", "Knowledge", "STOP", "Done", "Risks and rollback"]`）。
- 现状：phase 模板没有任何 Phase 级验证/判据槽位，只有任务卡内的 6 条分散字段。
- 差距：phase 文件是离执行最近的材料（含 gate_cmd、oracle、证据路径），反而缺 plan 里已有的这一节。

**D24｜真实文档的内容密度远高于模板占位符暗示的下限。**
- 样例逐字（`.../phases/P1.md:37`，单段 200+ 字）：`**Action**: 逐面列三替换面/七保留面；写六要素（输入、finding schema、超时、unavailable、provider 身份、事实位置），明确 mode validation-only、AC 全文、diff 转写、提示词禁子代理/轮询、去重与来源强度；按 research/card02-merged-review-audit.md 逐项记录 ① 的真实原件及命令/exit 缺口，不重跑；…`
- 样例逐字（`.../phases/P1.md:49`，单段列 6 个判定点）：`**GREEN oracle**: ORACLE-P1-STRUCTURE; 合同六要素和十面 bijection、三项公式/同型输入冻结时点早于候选运行；FN1–FN6 每项有真实原件或 unknown，unknown 不计入找回率；card-02 ① 的 attempt/result/output 可回读，缺失的 CLI 命令/exit 明确 partial。…`
- 现状模板：`phase-template.md:31` 只说 `- **动作**: [在每个锚点上的有序改动或操作、数据与控制流、兼容边界；要足以让人不必猜产品就找到第一处改动]`。
- 差距：模板没有给出「一段该含哪几问、写到多细」的下界，作者会写到远低于样例的水平。

**D25｜build-plan 工作流只规定「必须有」，不规定「写到什么程度」；质量下限完全由模板骨架兜。**
- 出处逐字：`workflows/build-plan/SKILL.md:113-119`（`Before \`spec-plan\` and \`spec-tasks\` execute, the host assembles one frozen \`stage-input-packet.v1\` … \`spec.md\` carries global design; each Phase file is independent and \`phases/index.md\` is regenerable pointers.`）、`:39-44`（post 由 `spec-specify` → `spec-plan` → `spec-tasks` 三段产出，`No post-cohort plan/tasks dual write occurs.`）、`:92-98`（`testing-system-blueprint` 设计 risks/scenarios/oracle/evidence path/coverage limits；`test-routing-advisor` 选具体测试技能）、`:145-148`（`Do not implement production code or claim GREEN here.`）
- 差距：workflow 与 SKILL.md 都只规定 phase 文件**存在**（`phases/P<n>.md`）与其**职责**，从不规定丰富度；模板骨架最薄，产出自然最薄。

**D26｜中文模板的字段标签语言与真实已填写文档、与 runtime 常量三者不一致（最高风险项）。**
- 真实样例用**英文字段标签**：`.../phases/P1.md:3-11`（`Global spec` / `Write set` / `Dependency` / `Consumer` / `gate_cmd` / `oracle` / `evidence_path` / `STOP` / `Done`）、`:34-54`（`Source / FR / AC`、`Inputs`、`Files / symbols`、`Action`、`Outputs / failure`、`Boundary / DO NOT TOUCH`、`Dependency`、`Test tier / skill`、`Scenario / fixture or service`、`RED/GREEN gate_cmd`、`expected_exit`、`RED target failure`、`GREEN oracle`、`Evidence`、`Coverage limit`、`STOP / recovery`、`Done`）。
- runtime 的必填名也是**英文**（§2 A7–A12、A15）。
- 而现模板 `phase-template.md` 的对应标签是**中文**（`写入集` L4、`来源 / FR / AC` L28、`动作` L31、`RED/GREEN 门禁命令` L39、`GREEN 判定器` L43、`覆盖上限` L45、`停止` L22、`完成` L23…）。
- 两份契约测试要求的又恰恰是这些**中文**字串（§2 C1-2、C2-3）。
- 结论与处置：三种可能（① runtime 有字段级别名表，中文标签可用；② 别名表只覆盖章节标题，则中文模板与 runtime 不匹配、翻译引入了真实缺陷；③ runtime 按英文字面匹配，则模板必须回退英文标签）。**我在获准读取的两段内找到的别名表 `PLAN_SECTION_ALIASES`（`runtime/stage/stage-content-contracts.mjs:4471-4489`）只覆盖章节标题，不含字段名**（见 §2 B1）。因此本提案**不改动任何现有字段标签**（零回归），把这条列为 §5 U1，并给出核实办法。

---

## §2 硬约束清单（不可违反）

### A. `validatePostPhaseContract`（`runtime/stage/stage-content-contracts.mjs:7030-7120`，函数体从 7031 行起）

函数签名（`stage-content-contracts.mjs:7031`）：`export function validatePostPhaseContract({ spec, index, phases } = {})`

**A1｜三份输入必须非空。**
- 出处：`stage-content-contracts.mjs:7033-7035`
- 逐字错误消息：`spec.md content is required` / `phases/index.md content is required` / `independent Phase files are required`

**A2｜`phases/index.md` 必须有「执行索引」行。**
- 出处：`stage-content-contracts.mjs:7038-7039`（`executionIndexRows(index)`）
- 逐字错误消息：`phases/index.md requires an Execution Index with Phase pointers`

**A3｜index.md 必须保持纯指针，不得出现命令/判据/证据字段。**
- 出处：`stage-content-contracts.mjs:7040-7042`，判定正则逐字为
  ```
  /^\s*[-*]\s*(?:\*\*)?(?:gate_cmd|expected_exit|oracle|evidence_path)\b/mi
  ```
- 逐字错误消息：`Phase index must remain pointer-only; command, oracle, and evidence belong to Phase files`

**A4｜Phase 编号必须连续 `P1..Pn`，且 index 里的 authority ref 必须是 `phases/P<n>.md`。**
- 出处：`stage-content-contracts.mjs:7049-7052`
- 逐字错误消息：`Phase index must declare contiguous P1..Pn; expected ${expectedId}`、`${expectedId} authority ref must be ${expectedPath}`
- 另：`stage-content-contracts.mjs:7053-7055` 要求 index 行有 `semantic_anchor` 与 `consumer`，逐字为 `${expectedId} semantic anchor is required`、`${expectedId} consumer is required`、`duplicate Phase authority ref: ${row.authority_ref}`

**A5｜phase 文件的 H1 必须是 `# Phase P<n>` 或 `# 阶段 P<n>`。**
- 出处：`stage-content-contracts.mjs:7062`
- 逐字正则：`` new RegExp(`^#\\s+(?:Phase|阶段)\\s+${expectedId}\\b`, "m") ``
- 逐字错误消息：`${expectedPath} must declare Phase ${expectedId}`

**A6｜phase 文件必须同时有三个二级标题：`## L0`、`## L1`、`## L2`。**
- 出处：`stage-content-contracts.mjs:7063-7065`
- 逐字循环与正则：
  ```
  for (const heading of ["L0", "L1", "L2"]) {
    if (!new RegExp(`^##\\s+${heading}\\b`, "m").test(body)) errors.push(`${expectedPath} is missing ${heading}`);
  }
  ```
- 逐字错误消息：`${expectedPath} is missing L0` / `is missing L1` / `is missing L2`
- 注意：只认二级标题 `## L0`；写成 `### L0` 或 `## L0 — xxx` 中 `L0` 后必须紧跟词边界（`L0 —` 合法）。

**A7｜phase 文件（文件级，非卡片级）必须有 `Write set` 字段，且与 index 的 write_set 完全一致。**
- 出处：`stage-content-contracts.mjs:7066-7068`
- 逐字调用：`inlinePaths(fieldValue(body, "Write set") ?? "")`
- 逐字错误消息：`${expectedPath} Write set is missing`、`${expectedPath} write set differs from Phase index`
- 另（7069-7073）：同一路径不得被两个 Phase 声明，逐字为 `${expectedPath} write set duplicates ${path} owned by ${owner}`

**A8｜phase 文件（文件级）必须有 `Dependency` 字段，且只能引用更早的 Phase。**
- 出处：`stage-content-contracts.mjs:7074-7083`，逐字调用 `fieldValue(body, "Dependency")`
- 逐字错误消息：`${expectedPath} dependency must match the index and reference only earlier Phase IDs`
- 细节（7075）：若值里有反引号，取反引号内的第一个内容作为依赖文本；`WITHOUT_PREDECESSOR` 命中时视为无前置依赖。

**A9｜phase 文件必须有一个包含字符串 `spec.md` 的 `Global spec` 指针。**
- 出处：`stage-content-contracts.mjs:7084`
- 逐字调用与消息：`if (!fieldValue(body, "Global spec")?.includes("spec.md")) errors.push(`${expectedPath} requires a stable spec.md pointer`)`

**A10｜phase 文件的 `Consumer` 必须与 index 行的 consumer 逐字一致（仅忽略结尾的 `。；;` 与空白）。**
- 出处：`stage-content-contracts.mjs:7085-7088`
- 逐字代码：
  ```
  const consumer = fieldValue(body, "Consumer")?.replace(/[。；;\s]+$/u, "").trim();
  if (!consumer || consumer !== row.consumer?.replace(/[。；;\s]+$/u, "").trim()) {
    errors.push(`${expectedPath} consumer differs from Phase index`);
  }
  ```
- 逐字错误消息：`${expectedPath} consumer differs from Phase index`

**A11｜phase 文件必须有可执行的 `gate_cmd`，以及以 `ORACLE-` 开头的 `oracle`。**
- 出处：`stage-content-contracts.mjs:7089-7093`
- 逐字代码与消息：
  ```
  const command = fieldValue(body, "gate_cmd");
  const oracle = fieldValue(body, "oracle");
  if (!hasExecutableCommand(command) || !/^ORACLE-[A-Z0-9-]+/.test(oracle ?? "")) {
    errors.push(`${expectedPath} requires an executable gate_cmd and oracle`);
  }
  ```
- 注意：`oracle` 的值必须**以 `ORACLE-` 开头**（后面接大写字母/数字/连字符），前面不能有反引号或别的字。

**A12｜phase 文件必须有 `STOP`、`Done`、`evidence_path` 三个字段，缺一不可。**
- 出处：`stage-content-contracts.mjs:7094-7096`
- 逐字代码与消息：
  ```
  if (!fieldValue(body, "STOP") || !fieldValue(body, "Done") || !fieldValue(body, "evidence_path")) {
    errors.push(`${expectedPath} requires STOP, Done, and evidence_path`);
  }
  ```
- 注意：这是**文件级**查找（`body`），不是卡片级；`evidence_path` 这个名字在三份模板的任何中文字段名里都不直接出现，是否被别名表覆盖见下文 B 节。

**A13｜phase 文件必须至少有一张独立的 `### Tnnn` 任务卡。**
- 出处：`stage-content-contracts.mjs:7099-7101`，逐字代码：
  ```
  const l1 = body.split(/^##\s+L1\b[^\n]*\n/m)[1]?.split(/^##\s+L2\b/m)[0] ?? "";
  const cards = markdownSections(l1, 3).filter(({ heading }) => /^T\d+\b/.test(heading));
  if (cards.length === 0) errors.push(`${expectedPath} requires independent ### Tnnn task cards; one-line Tasks is insufficient`);
  ```
- 逐字错误消息：`${expectedPath} requires independent ### Tnnn task cards; one-line Tasks is insufficient`
- 注意：卡片只在 **L1 段内**被扫描（L1 开始到 L2 之前）。任务卡必须放在 `## L1` 与 `## L2` 之间，放在 L2 之后不会被识别。

**A14｜任务卡标题必须是 `### Tnnn — 结果` 形式（三个以上数字 + 破折号 + 非空白字符）。**
- 出处：`stage-content-contracts.mjs:7103-7106`
- 逐字正则：`heading.match(/^(T\d{3,})\s+[—–-]\s+\S/)?.[1]`
- 逐字错误消息：`${expectedPath} task card requires stable ### Tnnn — outcome heading`
- 另（7108-7109）：Task 编号全任务唯一，逐字为 `${expectedPath} duplicate task card ${taskId} owned by ${taskOwners.get(taskId)}`

**A15｜每张任务卡必须有 17 个字段，字段名逐字如下。**
- 出处：`stage-content-contracts.mjs:7110-7116`
- 逐字代码：
  ```
  const required = [
    "Source / FR / AC", "Files / symbols", "Action", "Inputs", "Outputs / failure",
    "Boundary / DO NOT TOUCH", "Dependency", "Test tier / skill", "Scenario / fixture or service",
    "RED/GREEN gate_cmd", "expected_exit", "RED target failure", "GREEN oracle",
    "Evidence", "STOP / recovery", "Coverage limit", "Done",
  ];
  const fields = Object.fromEntries(required.map((field) => [field, fieldValue(cardBody, field)]));
  ```

**A16｜17 个字段的值必须「具体」，占位符与裸 TBD 会被判失败。**
- 出处：`stage-content-contracts.mjs:7117-7120`
- 逐字代码与消息：
  ```
  for (const field of required) {
    const value = fields[field];
    if (!value || /^(?:TBD|TODO|待补充|\[|N\/A\s*$)/i.test(value)) {
      errors.push(`${expectedPath} ${taskId} task card missing concrete ${field}`);
  ```
- 逐字错误消息：`${expectedPath} ${taskId} task card missing concrete ${field}`
- **关键推论**：值以 `[` 开头 → 直接失败；值恰好是 `N/A`（`N/A\s*$`，即 `N/A` 后只剩空白）→ 直接失败。所以「N/A — 理由」这种带理由的写法**可以通过**，而模板里的 `[精确路径，或 \`N/A — 理由\`]` 这种方括号占位符**必须被作者替换掉**。

**A17｜`validatePostPhaseContract` 内出现的全部 `fieldValue(...)` 调用（本段 6850–7120 逐条清点）。**
- 文件级（`body`）：`fieldValue(body, "Write set")`（7066）、`fieldValue(body, "Dependency")`（7074）、`fieldValue(body, "Global spec")`（7084）、`fieldValue(body, "Consumer")`（7085）、`fieldValue(body, "gate_cmd")`（7089）、`fieldValue(body, "oracle")`（7090）、`fieldValue(body, "STOP")`（7094）、`fieldValue(body, "Done")`（7094）、`fieldValue(body, "evidence_path")`（7094）
- 卡片级（`cardBody`）：`fieldValue(cardBody, field)`（7116），`field` 遍历 A15 的 17 个名字。
- 本段（6850–7030）其余函数**不含** `fieldValue` 调用：`validateSpecAnalyze`（6909）、`resolvePhaseTaskIds`（6917）、`validateTasksOnlyCompletionSeam`（6941）分别基于 `markdownSections` / `taskBlocks` / `completionZone` / `taskCompletionFact` / `parseJsonField` 工作。6850–7030 段内另出现的辅助符号：`nonEmptyString`、`hasMarkdownHeadings`、`stageAnalyzeFinding`、`sameIds`、`identifiers`、`inlinePaths`、`hasExecutableCommand`、`WITHOUT_PREDECESSOR`、`SHA256_HEX`、`ACCEPTANCE_CRITERION_ID`、`executionIndexRows`、`markdownSections`、`taskBlocks`。

### B. 别名表与模板版本常量（`stage-content-contracts.mjs:4380-4530`）

**B1｜这一段里唯一的「别名表」是 `PLAN_SECTION_ALIASES`，它管的是 plan 的章节标题，不是 phase 的字段名。**
- 出处：`stage-content-contracts.mjs:4471-4489`，逐字开头为
  ```
  const PLAN_SECTION_ALIASES = Object.freeze({
    "Quick Read": [/速读卡/, /Quick Read/i],
    "Technical Context": [/Technical Context/i, /技术上下文/],
    ...
    "Constitution Check": [/Constitution Check/i, /宪法逐项检查/],
    "Complexity Trade-offs": [/Complexity Trade-offs/i, /候选方案.*取舍.*复杂度/],
  });
  ```
- 其中与 phase 有关的可复用先例：`"Test Strategy": [/Test Strategy/i, /场景优先级与独立测试/, /测试策略/]`（4482）、`"Rollback and Recovery": [/Rollback and Recovery/i, /风险与回滚/]`（4483）、`"Implementation Order": [/Implementation Order/i, /依赖与并行/, /实施顺序/]`（4480）。
- **注意**：这张表覆盖的是 `PLAN_SECTIONS` / `PLAN_SECTIONS_V3` 里的章节名（`stage-content-contracts.mjs:4445-4470`），**不包含** `Write set`、`Global spec`、`Consumer`、`Dependency`、`STOP`、`Done`、`evidence_path` 这些字段级名字。字段级别名表不在我获准读取的两段之内（见 §5 不确定项 U1）。

**B2｜`PHASE_FIELDS` / `PHASE_FIELDS_V3` 是「plan.md 里 Phase 小节」的字段集（8 项）。**
- 出处：`stage-content-contracts.mjs:4490-4493`，逐字为
  ```
  const PHASE_FIELDS = Object.freeze(["Goal", "Files", "Tasks", "Verify", "Knowledge", "STOP"]);
  const PHASE_FIELDS_V3 = Object.freeze([
    "Goal", "Files", "Tasks", "Verify", "Knowledge", "STOP", "Done", "Risks and rollback",
  ]);
  ```
- 这 8 项与 `skills/spec-plan/templates/plan-template.md:210-257` 的 `## Phase P1 —` 块逐一对得上：`### 目标`(212)、`### 文件`(228)、`### 任务`(235)、`### 验证`(239)、`### 知识`(243)、`### 停止`(247)、`### 完成`(251)、`### 风险与回滚`(255)——**中文标题对上英文常量名**，说明这套常量名存在别名解析（解析层不在本段内）。

**B3｜`TASK_FIELDS` / `TASK_FIELDS_V3` 是 tasks 卡字段集，与 phase 的 17 项任务卡字段是两套不同契约。**
- 出处：`stage-content-contracts.mjs:4494-4503`，逐字为
  ```
  const TASK_FIELDS = Object.freeze([
    "ID", "动作", "精确文件", "输入", "输出", "依赖", "并行",
    "FR", "AC", "gate_cmd", "expected_exit", "oracle", "evidence_path",
  ]);
  const TASK_FIELDS_V3 = Object.freeze([
    "ID", "Phase", "goal", "design_state", "versioned_refs", "输入", "依赖", "并行",
    "FR", "AC", "动作", "精确文件", "boundary", "输出", "Knowledge",
    "verification_role", "paired_task", "gate_cmd", "expected_exit", "oracle",
    "evidence_path", "STOP", "recovery", "task risk",
  ]);
  ```
- **关键观察**：这两个常量里**中英混排**（`动作`、`精确文件`、`输入`、`输出`、`依赖`、`并行` 与 `gate_cmd`、`expected_exit`、`oracle`、`evidence_path` 并列）。这证明 runtime 的字段名常量可以逐字持有中文标签 —— 与 §2-A 里 `validatePostPhaseContract` 用的是**纯英文**名字（`"Write set"`/`"Global spec"`/`"Consumer"`/`"STOP"`/`"Done"`/`"evidence_path"`）形成对照。

**B4｜模板版本常量只有一个体系：`plan-task.v3` / `plan-task.v4`，没有 phase 模板版本常量。**
- 出处：`stage-content-contracts.mjs:4510-4512`，逐字为
  ```
  const PLAN_TASK_V3 = "plan-task.v3";
  const PLAN_TASK_V4 = "plan-task.v4";
  const SUPPORTED_PLAN_TASK_TEMPLATE_VERSIONS = new Set([PLAN_TASK_V3, PLAN_TASK_V4]);
  ```
- 对应 `skills/spec-plan/templates/plan-template.md:4` 的 `- **模板版本**：\`plan-task.v4\``。
- 推论：给 phase 模板加一个「模板版本」行**不会命中任何现有校验**（没有任何 phase 版本常量）——但它也**不受任何校验保护**，属于纯人读文字。

**B5｜宪法条款清单常量（供 phase 文档万一要写宪法检查时对齐）。**
- 出处：`stage-content-contracts.mjs:4513-4518`，逐字为
  ```
  const CURRENT_CONSTITUTION_CLAUSE_IDS = Object.freeze([
    // Deliberate governance snapshot: update this list with constitution-checklist.md.
    "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11",
    "Q1", "Q2", "Q3",
    "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8",
  ]);
  ```

**B6｜`markdownSections` 的实现细节（决定卡片怎么被扫到）。**
- 出处：`stage-content-contracts.mjs:4520-4530`，逐字为
  ```
  function markdownSections(document, level, prefix = "") {
    const lines = document.split(/\r?\n/);
    const marker = "#".repeat(level);
    const prefixes = (Array.isArray(prefix) ? prefix : [prefix]).filter(Boolean);
    const indexes = [];
    for (let index = 0; index < lines.length; index += 1) {
      const match = lines[index].match(new RegExp(`^${marker}\\s+(.+?)\\s*$`));
      if (match && (prefixes.length === 0 || prefixes.some((item) => match[1].startsWith(item)))) {
        indexes.push({ index, heading: match[1] });
      }
    }
  ```
- 与本提案相关的推论：三级标题必须**顶格**写 `### Tnnn — ...`（正则锚定行首 `^###`），标题行尾的空格被裁掉；`Tnnn` 后面必须是 ` — ` 分隔（见 A14）。

### C. 两份契约测试对 phase 模板的断言

两份测试都是**对模板文件本身的静态文本断言**（`readFileSync` + `toContain` / `toMatch`），不跑 runtime。

#### C1｜`tests/contract/post-cohort-authoring-files.test.mjs`

**C1-1｜`全局规格` 必须出现在 `spec.md` 之前。** 出处：`tests/contract/post-cohort-authoring-files.test.mjs:16`，逐字：
```
expect(template).toMatch(/全局规格[\s\S]*spec\.md/);
```

**C1-2｜模板必须逐字包含这 10 个字符串。** 出处：`tests/contract/post-cohort-authoring-files.test.mjs:17-19`，逐字：
```
for (const field of ["L0", "L1", "L2", "写入集", "依赖", "停止", "RED/GREEN 门禁命令", "判定器", "覆盖上限", "禁止改动"]) {
  expect(template, field).toContain(field);
}
```
注意 `RED/GREEN 门禁命令` 中 `RED/GREEN` 与 `门禁命令` 之间**有一个半角空格**，必须逐字一致。

**C1-3｜模板必须不包含 `plan.md`。** 出处：`post-cohort-authoring-files.test.mjs:20`，逐字：`expect(template).not.toContain("plan.md");`

**C1-4｜模板必须不包含 `tasks.md`。** 出处：`post-cohort-authoring-files.test.mjs:21`，逐字：`expect(template).not.toContain("tasks.md");`

（同文件 24-34 行约束的是 `skills/spec-tasks/templates/index-template.md`，不是 phase 模板，但给出了一组**保留词**：index 模板禁止出现 `gate_cmd`、`expected_exit`、`oracle`、`evidence_path`、`execution status`、`门禁命令`、`预期退出码`、`判定器`、`证据路径`、`执行状态`（`post-cohort-authoring-files.test.mjs:31-33`）。推论：`判定器` / `门禁命令` 属于「phase 文件专属词」，不得出现在 index。）

#### C2｜`tests/contract/post-cohort-executable-authoring.test.mjs`

**C2-1｜模板里必须有一行以 `### Tnnn — ` 开头（em dash + 空格）。** 出处：`tests/contract/post-cohort-executable-authoring.test.mjs:26`，逐字：`expect(template).toMatch(/^### Tnnn — /m);`

**C2-2｜「任务卡区域」的定义 = 第一个 `### Tnnn — ` 之后、第一个 `## L2` 之前的全部文本。** 出处：`tests/contract/post-cohort-executable-authoring.test.mjs:27`，逐字：
```
const taskCard = template.split("### Tnnn — ")[1]?.split("## L2")[0];
```
**这是本提案最强的结构约束**：所有卡片级断言都只在这个区间内检查，卡片内容必须放在 `### Tnnn —` 与 `## L2` 之间。

**C2-3｜任务卡区域必须逐字包含这 12 个加粗字段标签。** 出处：`tests/contract/post-cohort-executable-authoring.test.mjs:29-33`，逐字：
```
for (const field of [
  "来源 / FR / AC", "文件 / 符号", "动作", "输入", "输出 / 失败",
  "依赖", "RED/GREEN 门禁命令", "RED 目标失败", "GREEN 判定器",
  "证据", "停止 / 恢复", "覆盖上限",
]) expect(taskCard, field).toContain(`**${field}**`);
```
即必须逐字出现 `**来源 / FR / AC**`、`**文件 / 符号**`、`**动作**`、`**输入**`、`**输出 / 失败**`、`**依赖**`、`**RED/GREEN 门禁命令**`、`**RED 目标失败**`、`**GREEN 判定器**`、`**证据**`、`**停止 / 恢复**`、`**覆盖上限**`（每个字段名两侧各两个星号）。

**C2-4｜任务卡区域内必须出现 `第一处改动`。** 出处：`post-cohort-executable-authoring.test.mjs:34`

**C2-5｜任务卡区域内必须出现 `同一个判定器编号`。** 出处：`post-cohort-executable-authoring.test.mjs:35`

**C2-6｜模板必须不包含 `one-line results`。** 出处：`post-cohort-executable-authoring.test.mjs:36`

**C2-7｜模板必须包含 `下一个 Phase 接续编号`。** 出处：`post-cohort-executable-authoring.test.mjs:39`

**C2-8｜模板必须逐字包含这 4 个字符串。** 出处：`post-cohort-executable-authoring.test.mjs:73-75`，逐字：
```
for (const field of ["预写测试", "RED 证据", "禁止改动", "测试变更请求"]) {
  expect(template).toContain(field);
}
```

**C2-9｜模板不得引入 `plan.md` / `tasks.md` 的替代写法。** 出处（同文件 42-58 行）断言 `workflows/build-plan/skill-deps.yaml` 里 `spec-plan`、`testing-system-blueprint`、`test-routing-advisor` 的 `consumer.inputs` 必须含 `artifacts.phase_authorities` 且不得含 `artifacts.plan.md`、`artifacts.tasks.md`。**推论：phase 文档及其模板在措辞上不得把自己描述成 plan/tasks 的产物。**

**C2-10｜spec 模板拥有全局设计（phase 不得重复）。** 出处：`post-cohort-executable-authoring.test.mjs:8-19` —— `skills/spec-specify/templates/spec-template.md` 必须含 `## 实现设计（全局权威）` 与 `## Appendix A`，且该区间内必须含 `### 代码锚点`、`### 接口与失败语义`、`### 需求到任务追踪`、`### 全局验证策略`，以及 `原始 PRD/用户要求`、`来源 / 决定`、`Phase / Task`、`正例 + 负例判据 / 证据`、`失败语义`、`新增`、`修改`、`禁止改动`。

#### C3｜两份测试共同锁定的「模板必须包含」清单（本提案的硬边界）

| # | 必须包含（逐字） | 出处 |
| --- | --- | --- |
| 1 | `全局规格` 在 `spec.md` 之前 | 测试一:16 |
| 2 | `L0`、`L1`、`L2` | 测试一:17 |
| 3 | `写入集` | 测试一:17 |
| 4 | `依赖` | 测试一:17 |
| 5 | `停止` | 测试一:17 |
| 6 | `RED/GREEN 门禁命令` | 测试一:17、测试二:31 |
| 7 | `判定器` | 测试一:17 |
| 8 | `覆盖上限` | 测试一:17、测试二:32 |
| 9 | `禁止改动` | 测试一:17、测试二:74 |
| 10 | `### Tnnn — ` 行首 | 测试二:26 |
| 11 | `**来源 / FR / AC**` | 测试二:30 |
| 12 | `**文件 / 符号**` | 测试二:30 |
| 13 | `**动作**` | 测试二:30 |
| 14 | `**输入**` | 测试二:30 |
| 15 | `**输出 / 失败**` | 测试二:30 |
| 16 | `**依赖**` | 测试二:30 |
| 17 | `**RED/GREEN 门禁命令**` | 测试二:31 |
| 18 | `**RED 目标失败**` | 测试二:31 |
| 19 | `**GREEN 判定器**` | 测试二:31 |
| 20 | `**证据**` | 测试二:32 |
| 21 | `**停止 / 恢复**` | 测试二:32 |
| 22 | `**覆盖上限**` | 测试二:32 |
| 23 | `第一处改动`（卡区内） | 测试二:34 |
| 24 | `同一个判定器编号`（卡区内） | 测试二:35 |
| 25 | `下一个 Phase 接续编号` | 测试二:39 |
| 26 | `预写测试` | 测试二:73 |
| 27 | `RED 证据` | 测试二:73 |
| 28 | `测试变更请求` | 测试二:73 |

**必须不包含**：`plan.md`、`tasks.md`、`one-line results`。

**必须满足的形状**：`### Tnnn —` 与 `## L2` 之间必须同时出现上表 11–24 的全部内容。

---

## §3 改进提案

### §3.1 设计原则（先定分层，再写骨架）

1. **机器字段与人读内容分层，并且版面上可区分**。机器字段一律用 `- **字段名**: ` 的行内标签形式（沿用现模板的 ASCII 冒号与空格，零回归）；人读内容只出现在三处：文件顶部的使用说明引用块、`## 速读卡`、以及 `### 字段说明` 表——都不使用行内加粗标签形式，避免被当成值。
2. **补齐 runtime 已经在读、但模板没给位置的文件级字段**。`gate_cmd` / `oracle` / `evidence_path` / `STOP` / `Done` 是 §2 A11、A12 逐字读取的文件级字段，**不是新字段**；真实样例 `.../phases/P1.md:7-11` 正是把它们放在 `# Phase Pn` 之后的顶部契约头里。现模板把这五项丢在任务卡里或干脆没有，本提案把位置补回来。
3. **不改任何现有中文字段标签**。§2 C1-2、C2-3 逐字要求这批中文字串，改动会直接让两份契约测试变红；同时 §5 U1（字段级别名表是否存在）未核实，改语言风险不可控。因此本草案的标签与新内容全部是**增量**。
4. **保留 `[填写：…]` 之外的裸 `[...]` 占位符**（与现模板一致）。裸 `[` 开头正好会被 §2 A16 的 `^(?:TBD|TODO|待补充|\[|N\/A\s*$)` 拒收——**漏填不会被静默放过**，这是刻意保留的安全网，不是缺陷。
5. **丰富度靠加三个结构块实现**，不动机器契约：任务卡前的 `### 字段说明` 表（每个字段的 runtime 规范名、是否机器必填、写作下限）、`## 速读卡`（速读区）、以及一张完整填好的 `#### 示例` 卡片（用例示范）。示例用四级标题，不会被 `markdownSections(l1, 3)`（§2 B5）当成任务卡。
6. **表格位置**：`### 测试策略` 表沿用 plan 模板 `plan-template.md:132-144` 的 5 列骨架，用 `[填写：同一命令]` / `[填写：同一个判定器编号]` 强制 RED/GREEN 成对——这是把 plan 模板已被验证的质量手法搬过来，不新增任何校验。

### §3.2 `phase-template.md` 全文草案（可直接落盘替换）

```markdown
# Phase P<n> — [这一 Phase 的一个可独立验收的结果]

> **怎么用这份文件**（人读，落盘后可删）：
> 1. 本文件只写**本 Phase 的实现增量**，以及指向 `spec.md` 全局目标的稳定指针。全局产品契约与全局实现设计归 `spec.md`，本文件不复制、不改写、不重述。
> 2. 本文件由人编写，**不写执行状态**。跑没跑过、RED 有没有真的出现、GREEN 是否成立，属于任务事实库，不属于本文件。
> 3. 同一 Phase 的每个 Task 各占一张完整卡片，编号在全任务内唯一；卡片区（`### Tnnn` 三级标题开始，到 `## L2` 之前）是机器逐字检查的区域。
> 4. 被检查的字段值留空、写成 `TBD` / `TODO` / `待补充`、或以 `[` 开头都会被拒收。确实不适用时写 `N/A — 一句理由`（裸 `N/A` 同样被拒收）。
> 5. 下面五个字段名保持英文：`gate_cmd` / `oracle` / `evidence_path` / `STOP` / `Done`。它们由 runtime 按字面名读取，**不要翻译**。
> 6. 落盘时把标题里的 `P<n>` 换成真实编号（例如 `# Phase P3`）：runtime 按 `# Phase P3` 逐字校验文件身份。
>
> **模板版本（仅供人读，runtime 不解析）**：`phase-file.v1`

## Phase 契约头（文件级字段；runtime 逐字读取）

- **全局规格**: `spec.md#[稳定目标锚点]`（全局目标与实现设计的唯一权威指针）
- **写入集**: `[精确文件路径]`；`[精确文件路径]`（只写精确路径，不得写目录、模块名或 glob；每个路径全任务只有一个所有者；必须与 `phases/index.md` 逐条一致）
- **依赖**: `[更早的 Phase 编号，例如 P1；没有就写 none]`（只能引用更早的 Phase；串行时写明理由；必须与 `phases/index.md` 一致）
- **消费者**: [真实的下游读取方或组件]（必须与 `phases/index.md` 的 consumer 逐字一致）
- **gate_cmd**: `[本 Phase 级可执行命令，例如 npx vitest run tests/xxx.test.mjs]`（必须是一条能直接执行的命令）
- **oracle**: ORACLE-[P 编号与主题，全大写、连字符分隔，例如 P1-STRUCTURE]（整段必须以 `ORACLE-` 开头）
- **evidence_path**: `[相对任务根的证据路径，例如 quality/evidence/<task-id>/P1-structure.json]`
- **STOP**: [什么情况停下来、找谁、怎么修]（与 L1 的「停止」写同一件事，不许两处互相矛盾）
- **Done**: [要诚实下结论还缺哪些 AC、测试、审查与交接证据]（与 L1 的「完成」写同一件事）

## 速读卡（人读；只写本 Phase 增量，不复制 `spec.md`）

- **本 Phase 结果**：[一句话说清交付什么、谁受益]
- **非目标**：[本 Phase 明确不做的事，防止范围膨胀]
- **改动前**：[已核实的当前状态与痛点]
- **改动后**：[改动完成后的可观察状态]
- **与相邻 Phase 的边界**：[上游给了什么、本 Phase 交给下游什么]
- **主要风险**：[最可能让本 Phase 返工的一件事]
- **下一步**：[本 Phase 结束后，谁接着做什么]

## L0 — 结果与变更

[3–8 行讲清本 Phase 要改变的结果、为什么现在做、以及它与全局目标的关系。指向全局目标，不要重复它的完整叙述。]

- **结果**: [可验收的结果，用外部可观察的语言写]
- **非目标**: [明确排除的范围]
- **与其它 Phase 的区别**: [本 Phase 与相邻 Phase 的分界]

## L1 — 可执行契约

### 文件边界

- **新增**: [精确路径，或 `N/A — 理由`]
- **修改**: [精确路径，或 `N/A — 理由`]
- **禁止改动**: [精确的受保护路径与理由；逐条写清为什么本 Phase 不能碰它]

### 任务顺序

[全任务唯一且稳定的 Task 编号；按索引里的 Phase 顺序与 Phase 内执行顺序连续编号，接续上一个 Phase 而不是重新开始；显式写出更早的依赖与串行/并行理由。每个 Task 都必须有自己的卡片，不得把多个 Task 压成一行，也不得只留一个空的「任务」小节。]

### 测试策略

| 目标 | Task | 角色 | gate_cmd / 预期退出码 | 判据 / 证据路径 |
| --- | --- | --- | --- | --- |
| [填写：本 Phase 要保护的行为] | T001 | RED | [填写：同一命令] / `[填写：非零退出码]` | [填写：同一个判定器编号] / — |
| [填写：同一行为] | T001 | GREEN | [填写：同一命令] / `0` | [填写：同一个判定器编号] / `[填写：证据路径]` |

[跨 Task 的行为、状态、错误、权限、并发与接缝风险；每个不相关的维度都要写 `N/A — 理由`。写上测试层级与所选的具体测试技能、场景、夹具或服务。RED 必须来自真实执行记录；取不到就诚实写 `unavailable — 理由`，不得把草稿说成 RED。]

### 覆盖边界

- **覆盖上限**: [整份 Phase 证据最多能确立什么、覆盖到什么程度；防止用「全量绿」代替判据]
- **显式不覆盖**: [整份 Phase 证据无法确立的东西与原因；Task 级限制仍写在各自卡片里]

### 停止

[条件、负责的材料与修复路径。不要写「继续观察」这类无法执行的话。]

### 完成

[要诚实下结论所需的 AC、测试、审查与交接证据，以及结论只能到什么强度。]

### 风险与回滚

- **风险**: [可证伪的风险，写触发条件而不是形容词]
- **影响**: [最坏后果]
- **缓解**: [现在做什么降低概率或影响]
- **回滚**: [怎么退回上一个已知良好状态]
- **触发条件**: [什么信号出现就执行回滚]

### 字段说明（人读；runtime 不解析本节，也不产生任何质量结论）

下表把每个机器读的字段与其 runtime 规范名、是否会被逐字检查、以及写作下限放在一起。**机器必填=是**的字段留空或写成占位符会被拒收；**否**的字段写不写不改变任何校验结果，但它们是人读质量的来源。

| 位置 | 字段 | runtime 规范名 | 机器必填 | 写作下限 |
| --- | --- | --- | --- | --- |
| 契约头 | 全局规格 | `Global spec` | 是 | 必须出现 `spec.md` |
| 契约头 | 写入集 | `Write set` | 是 | 精确文件路径，不得目录/glob |
| 契约头 | 依赖 | `Dependency` | 是 | 更早的 Phase 编号或 `none` |
| 契约头 | 消费者 | `Consumer` | 是 | 真实读取方，与索引一致 |
| 契约头 | gate_cmd | `gate_cmd` | 是 | 一条可执行命令 |
| 契约头 | oracle | `oracle` | 是 | 以 `ORACLE-` 开头 |
| 契约头 | evidence_path | `evidence_path` | 是 | 相对任务根的路径 |
| 契约头 | STOP | `STOP` | 是 | 停止条件 + 材料 + 修复路径 |
| 契约头 | Done | `Done` | 是 | 结论所需的 AC/测试/审查/交接证据 |
| L1 | 输入与输出 | —（合并进 Task 卡） | 否 | 接口、类型、状态迁移、失败语义 |
| L1 | FR / AC | —（合并进 Task 卡） | 否 | 来源、FR 与 AC 编号 |
| L1 | 新增 / 修改 | — | 否 | 精确路径或 `N/A — 理由` |
| L1 | 禁止改动 | — | 否（契约测试要求字段名存在） | 精确受保护路径 + 理由 |
| L1 | 任务顺序 | — | 否 | 编号列表 + 依赖理由 |
| L1 | 测试策略 | — | 否 | 每个不相关维度写 `N/A — 理由` |
| L1 | 覆盖边界 | — | 否 | 上限 + 显式不覆盖 |
| L1 | 停止 / 完成 | —（文件级同名由契约头承担） | 否 | 条件与材料，不得互相矛盾 |
| L1 | 风险与回滚 | — | 否 | 触发条件、影响、缓解、回滚 |
| 卡片 | 来源 / FR / AC | `Source / FR / AC` | 是 | 逐字来源编号/位置 + 决定 + FR/AC；不得只写编号不写内容 |
| 卡片 | 文件 / 符号 | `Files / symbols` | 是 | 精确路径或符号/签名，未知项写负责人与停止条件 |
| 卡片 | 动作 | `Action` | 是 | 有序改动、数据与控制流、兼容边界；足以让人不必猜产品就找到第一处改动 |
| 卡片 | 输入 | `Inputs` | 是 | 上游材料、产出它的 Task、已核实的接口或夹具；独立 Task 写 `none` 并给理由 |
| 卡片 | 输出 / 失败 | `Outputs / failure` | 是 | 可观察结果 + 非法输入与失败信号 + 清理/回滚效果 |
| 卡片 | 边界 / 禁止改动 | `Boundary / DO NOT TOUCH` | 是 | 精确受保护范围 + 为什么不能改 |
| 卡片 | 依赖 | `Dependency` | 是 | Task 编号或 `none`、上游产物、文件所有权、串行/并行理由 |
| 卡片 | 测试层级 / 技能 | `Test tier / skill` | 是 | `simple` / `feature` / `fullstack` 之一 + 恰好一个具体测试技能 |
| 卡片 | 场景 / 夹具或服务 | `Scenario / fixture or service` | 是 | 正常用例 + 具名反向用例 + 搭建与清理 |
| 卡片 | 预写测试 | —（runtime 不查；契约测试要求字段名存在） | 否 | 独占测试文件、目标断言、作者；不适用时给理由、风险与客观替代 |
| 卡片 | 可观察接缝 | —（runtime 与契约测试都不查） | 否 | 既有产出方、已持久化产物、真实读取方、来源分母；不存在就先冻结接口 |
| 卡片 | RED/GREEN 门禁命令 | `RED/GREEN gate_cmd` | 是 | 目标 RED 与配对 GREEN 共用同一条有范围的命令 |
| 卡片 | 预期退出码 | `expected_exit` | 是 | RED：具名断言产生的非零退出码（setup 失败不算）；GREEN：0 |
| 卡片 | RED 目标失败 | `RED target failure` | 是 | 稳定的判定器编号 + 改动前必须失败的确切断言 |
| 卡片 | RED 证据 | —（runtime 不查；契约测试要求字段名存在） | 否 | 真实命令、退出码、失败断言、输出引用与材料身份；没有就是 `unavailable` |
| 卡片 | GREEN 判定器 | `GREEN oracle` | 是 | 同一个判定器编号 + 通过信号 + 具名反向行为 |
| 卡片 | 证据 | `Evidence` | 是 | 相对任务根的 RED 与 GREEN 证据引用 |
| 卡片 | 覆盖上限 | `Coverage limit` | 是 | 本 Task 的证据无法确立的东西 |
| 卡片 | 停止 / 恢复 | `STOP / recovery` | 是 | 精确的不匹配或未知项、负责修复的人与材料、安全恢复方式；不得静默回退 |
| 卡片 | 测试变更请求 | —（runtime 不查；契约测试要求字段名存在） | 否 | 显式理由、旧/新断言、此前的 RED 证据、独立审查引用；否则写 `none` |
| 卡片 | 完成 | `Done` | 是 | AC 结果、目标测试、反向用例、证据/回读与审查事实 |

### Tnnn — [下一个全局唯一的 Task 编号与一个可观察结果]

- **来源 / FR / AC**: [可观察结果；当前 decision-log 的逐字来源编号/位置（适用时附上游 PRD 引用）、决定、FR 与 AC 编号；保留量词、否定、顺序与失败强度；不得只写编号不写内容]
- **输入**: [当前材料引用、产出它的 Task、已核实的接口或夹具；若本 Task 独立，写 `none` 并给理由]
- **文件 / 符号**: [本 Phase 写入集内的新增/修改路径；既有符号/签名/消费者与核实来源；未知项要写明负责人与停止条件]
- **动作**: [在每个锚点上的有序改动或操作、数据与控制流、兼容边界；要足以让人不必猜产品就找到第一处改动]
- **输出 / 失败**: [可观察的接口、schema 或状态结果，非法输入与失败信号，清理或回滚效果]
- **边界 / 禁止改动**: [精确的受保护文件或范围；以及为什么本 Task 不能改它们]
- **依赖**: [Task 编号或 `无`、上游产出物、文件所有权与串行/并行理由]
- **测试层级 / 技能**: [`simple|feature|fullstack`；恰好一个适用的具体测试技能]
- **场景 / 夹具或服务**: [正常用例与具名的反向用例；搭建与清理]
- **预写测试**: [本 Task 独占的测试文件、目标断言与作者；build-plan 在实现之前写好它；若 G-2 不适用，给出理由、风险与客观替代]
- **可观察接缝**: [本 AC 对应的既有产出方、已持久化的产物、真实读取方/消费者、来源分母，以及缺失或非法的语义；若不存在，先设计与冻结这个接口，并让该 AC 保持未完成，而不是去测文本]
- **RED/GREEN 门禁命令**: [本 Task 的目标 RED 与配对 GREEN 共用同一条可执行、有范围的命令；若确实不适用，说明理由并给出客观替代]
- **预期退出码**: [RED：由具名目标断言产生的非零退出码，不是 setup 失败；GREEN：0]
- **RED 目标失败**: [稳定的判定器编号，以及改动之前必须失败的那条确切断言或拒绝；setup 或收集失败不算 RED]
- **RED 证据**: [来自既有任务事实的真实 build-plan 命令、退出码、失败断言、输出/引用与材料身份；没有真实执行记录就是「不可用」，不是 RED]
- **GREEN 判定器**: [同一个判定器编号；改动之后的通过信号，以及具名的反向行为]
- **证据**: [相对任务根的计划 RED 与 GREEN 证据引用；真实结果属于任务事实库]
- **覆盖上限**: [本 Task 的证据无法确立的东西]
- **停止 / 恢复**: [精确的不匹配或未知项、负责修复的人与材料、安全恢复方式；不得静默回退]
- **测试变更请求**: [若冻结测试必须改动：显式理由、旧/新断言、此前的 RED 证据、独立审查引用；否则写 `none`]
- **完成**: [要诚实下结论所需的 AC 结果、目标测试、反向用例、证据/回读，以及任何审查事实]

#### 示例：一张填满的 T001 卡片（人读，只示范结构；内容与你的仓库无关，照抄形状、不要照抄文字）

- **来源 / FR / AC**: FR-004 / AC-004-2「配置读取失败必须给出可定位的错误，而不是默认值」；来源 `decision-log.md` 的 2026-03-02 决定条目与上游 PRD 引用，保留「必须报错、不得回退默认值」的否定强度。
- **输入**: `spec.md` 的配置章节引用；T000 已产出的 `config.schema.json`；`tests/fixtures/config/broken.json`。
- **文件 / 符号**: 修改 `src/config/load.ts:41-88` 的 `loadConfig()`；新增错误类型 `ConfigParseError`；消费者 `src/cli/main.ts:12`。
- **动作**: 先在第一处改动——`loadConfig()` 的 `catch` 分支——去掉回退默认值的路径，改为抛出携带 `file:line` 的 `ConfigParseError`；再让 `src/cli/main.ts` 在顶层捕获并打印该错误、以退出码 `2` 结束；不得改动 schema 字段名。
- **输出 / 失败**: 合法配置返回完整对象；解析失败抛出 `ConfigParseError` 且 `message` 含 `file:line`；进程退出码 `2`；不写任何部分结果到磁盘。
- **边界 / 禁止改动**: 不许改 `config.schema.json` 的字段名与 `src/config/defaults.ts`；因为它们被 P1 的冻结契约引用。
- **依赖**: `none`（本 Task 独立，前置于 T002）。
- **测试层级 / 技能**: `feature`；`vitest`。
- **场景 / 夹具或服务**: 正常用例 `tests/fixtures/config/ok.json`；反向用例 `broken.json`（第 7 行缺少 `name`）；无外部服务；用例后清理临时目录。
- **预写测试**: `tests/config/load.test.mjs`（本 Task 独占），断言「抛出 `ConfigParseError` 且 `message` 含 `broken.json:7`」；由作者在实现前写好。
- **可观察接缝**: 既有产出方 `loadConfig()`；已持久化产物 `config.schema.json`；真实读取方 `src/cli/main.ts`；来源分母为 2 个夹具；缺失语义＝文件不存在时抛 `ENOENT` 包装后的同类错误。
- **RED/GREEN 门禁命令**: `npx vitest run tests/config/load.test.mjs`（RED 与 GREEN 共用同一条）。
- **预期退出码**: RED：`1`（断言失败）；GREEN：`0`。
- **RED 目标失败**: 判定器 `ORACLE-P3-CONFIG-ERROR`；改动前必须失败的确切断言＝`expect(() => loadConfig(broken)).toThrow(ConfigParseError)`。
- **RED 证据**: `quality/evidence/<task-id>/P3-config-red.json`（真实命令、退出码、失败断言与输出引用）；尚未执行时写 `unavailable — 尚未取得真实 RED`。
- **GREEN 判定器**: 同一个判定器编号 `ORACLE-P3-CONFIG-ERROR`；通过信号＝上述命令退出码 `0`；反向行为＝`ok.json` 仍能加载且字段不变。
- **证据**: `quality/evidence/<task-id>/P3-config-green.json`；真实结果属于任务事实库。
- **覆盖上限**: 不覆盖并发写入与 Windows 路径分隔符；这两项留给 P4。
- **停止 / 恢复**: 若 `broken.json` 的失败信号不稳定，停止并交给配置模块作者用 `config.schema.json` 复核；不得放宽断言换绿。
- **测试变更请求**: `none`。
- **完成**: `AC-004-2` 的正反用例都通过、RED 与 GREEN 证据可回读、`load.ts` 与 `main.ts` 的改动已由独立审查确认。

### 编号与交接

每个 Task 都完整重复一张 `Tnnn` 卡片。`T001` 只用于全任务的第一个 Task 卡片；下一个 Phase 接续编号，而不是重新从 `T001` 开始。不要把多个 Task 压缩成一行、借用别的 Phase 的 Task 正文，或把执行状态写进这份由人编写的文件。本 Phase 的编号与写入集必须与 `phases/index.md` 的指针逐条一致。

## L2 — 可删除参考

[只在实现期间有用的非权威提示。写明在什么条件下删掉本节不会改变 L0/L1。]
```

### §3.3 约束 → 草案行对照表

下表左侧的约束编号与逐字内容见 §2。草案行号以 §3.2 代码块内第 1 行为 `1`（报告第 656 行 = 草案第 1 行）。

| 约束（出处） | 草案行 | 满足方式 |
| --- | --- | --- |
| A5／H1 必须是 `# Phase P<n>` 或 `# 阶段 P<n>`（`stage-content-contracts.mjs:7062`） | 1 | 逐字沿用 `# Phase P<n> — […]`；实测把 `P<n>` 换成 `P1` 后命中 `^#\s+(?:Phase\|阶段)\s+P1\b`，模板期不命中（见 §4 R1） |
| A6／必须同时有 `## L0`、`## L1`、`## L2`（`:7063-7065`） | 35 / 43 / 183 | 三行二级标题逐字沿用现模板 |
| A7／文件级 `Write set`（`:7066`） | 16 | `写入集`（与现模板逐字一致） |
| A8／文件级 `Dependency`（`:7074`） | 17 | `依赖` |
| A9／`Global spec` 且含 `spec.md`（`:7084`） | 15 | `- **全局规格**: \`spec.md#[稳定目标锚点]\`` |
| A10／`Consumer` 与 index 行逐字一致（`:7085`） | 18 | `消费者` |
| A11／文件级 `gate_cmd` + `oracle`（须 `ORACLE-` 开头，`:7089-7090`） | 19 / 20 | **新增**（现模板缺）：`- **gate_cmd**: \`[本 Phase 级可执行命令，例如 npx vitest run tests/xxx.test.mjs]\``、`- **oracle**: ORACLE-[P 编号与主题…]`；实测英文字面名命中 |
| A12／文件级 `STOP`、`Done`、`evidence_path`（`:7094`） | 22 / 23 / 21 | **新增**（现模板缺）；实测英文字面名命中 |
| A13／至少一张独立 `### Tnnn` 卡（`:7099-7101`） | 131 | `### Tnnn — [下一个全局唯一的 Task 编号与一个可观察结果]` |
| A14／卡标题 `### Tnnn — 结果`（`:7103`） | 131 | `Tnnn` + em dash + 空格 + 结果占位符 |
| A15／卡内 17 个字段逐字（`:7110-7115`） | 133–153 | 现模板的 21 条卡片标签原样保留、全部落在 17 项之内；每条都是 `- **中文标签**: ` 形式 |
| A16／值不得是 `TBD`/`TODO`/`待补充`/`[` 开头/裸 `N/A`（`:7119`） | 全文字段值 | 未填写时全部以裸 `[` 开头 → 刻意被判失败（实测 0/17）；把 `[`→`（` 模拟填写后 17/17 通过；使用说明第 7 行明示该机制 |
| A17／本段全部 `fieldValue(...)` 参数 | 15–23 | 同上：四个中文标签 + 五个英文字面名 |
| B4／没有 phase 模板版本常量（`:4510-4512` 只有 `plan-task.v3/v4`） | 11 | 只写一行**人读**版本号 `phase-file.v1`，不注册进任何 runtime 常量、不引入新版本体系 |
| B6／`markdownSections` 只认三级标题、须顶格（`:4520+`） | 131（卡片）；85 / 155 | 卡片保持三级且顶格；`### 字段说明`（85）落在 `## L1` 之前、`#### 示例`（155）是四级 → 都不会被当成任务卡 |
| C1-1／`全局规格` 必须出现在 `spec.md` 之前（测试一:16） | 15 | 同一行内先标签后 `spec.md` |
| C1-2／10 个字串（测试一:17-19） | L0 35、L1 43、L2 183、`写入集` 16、`依赖` 17(亦见 139/795)、`停止` 69(亦见 151)、`RED/GREEN 门禁命令` 144、`判定器` 148(亦见 124/147)、`覆盖上限` 150(亦见 66)、`禁止改动` 49(亦见 138) | 逐字包含，实测 10/10 PASS |
| C1-3 / C1-4／不得含 `plan.md`、`tasks.md`（测试一:20-21） | — | 全文无此二词（实测 `toContain` 为 false） |
| C2-1／有一行以 `### Tnnn — ` 开头（测试二:26） | 131 | 实测出现次数 = 1 |
| C2-2／卡区 = 首个 `### Tnnn — ` 到首个 `## L2`（测试二:27） | 131 → 183 | 卡区 53 行，示例卡（155–177）也落在区内 |
| C2-3／12 个加粗标签（测试二:29-33） | 133 `**来源 / FR / AC**`、134 `**输入**`、135 `**文件 / 符号**`、136 `**动作**`、137 `**输出 / 失败**`、139 `**依赖**`、144 `**RED/GREEN 门禁命令**`、146 `**RED 目标失败**`、148 `**GREEN 判定器**`、149 `**证据**`、150 `**覆盖上限**`、151 `**停止 / 恢复**` | 实测 12/12 PASS |
| C2-4／卡区含 `第一处改动`（测试二:34） | 136（动作字段的机器占位符内）+ 160（示例） | 落在机器字段本体，不只靠示例 |
| C2-5／卡区含 `同一个判定器编号`（测试二:35） | 148（GREEN 判定器）+ 172（示例） | 同上 |
| C2-6／不得含 `one-line results`（测试二:36） | — | 实测 `toContain` 为 false |
| C2-7／含 `下一个 Phase 接续编号`（测试二:39） | 179 | 逐字在「编号与交接」段 |
| C2-8／4 个字串（测试二:73-75） | `预写测试` 142(亦见 118)、`RED 证据` 147(亦见 123)、`禁止改动` 49/138(亦见 103)、`测试变更请求` 152(亦见 128) | 实测 4/4 PASS |
| C2-9／不得把自己描述成 plan/tasks 的产物（测试二:42-58 推论） | 4 | 使用说明第 1 条只说「本文件只写本 Phase 的实现增量」+ 指向 `spec.md`；全文无 plan/tasks 措辞 |
| C2-10／全局设计归 `spec.md`，phase 不重复（测试二:8-19） | 4 / 15 / 25 | 使用说明与速读卡标题均逐字声明「只写本 Phase 增量，不复制 `spec.md` 的全局设计」 |

**实测方法**：从本报告 §3.2 的 ```markdown 围栏内切出草案文本，用两份契约测试的真断言逐条跑（node 脚本，零写入）。结果：**32 条断言全 PASS**；文件级英文字面名命中 `gate_cmd`、`oracle`、`evidence_path`、`STOP`、`Done`，未命中 `Global spec`、`Write set`、`Dependency`、`Consumer`；卡区 17 个英文字面名命中 **(none)** —— 这两点写进 §4 R2、R3 与 §5 U1。**注意：这不等同于仓库测试已绿**（见 §5 U7）。

---

## §4 风险与不做的事

### §4.1 提案可能引入的风险

| # | 风险 | 触发条件 | 处置 |
| --- | --- | --- | --- |
| R1 | A5 的 H1 校验失败 | 作者落盘时忘了把 `P<n>` 换成真实编号（`P1`/`P3`…） | 使用说明第 9 行逐字提醒；这是现模板同样存在的风险，非新增（实测：`# Phase P<n>` 不命中、`# Phase P3` 命中） |
| R2 | 文件级 `Global spec`/`Write set`/`Dependency`/`Consumer` 若被 runtime 按**英文字面名**读取，则取不到值 | `fieldValue` 实现为字面名匹配（§5 U1 未核实） | 草案只把 `gate_cmd`/`oracle`/`evidence_path`/`STOP`/`Done` 五个字面名补上（实测命中）；**另四个仍只有中文标签**——与现模板同等，属未修好的残留风险，不能声称已修好 |
| R3 | 卡片级 17 个字段的英文字面名命中数为 0 | 同上：若 runtime 按字面名读卡片字段 | 卡片契约完全依赖别名层（§2 B 段未找到字段级别名表→§5 U1）。**反方向的风险更大**：把中文标签改成英文会让 §2 C2-3 的十二个加粗标签立刻变红，因此本提案明确不改标签（§4.2 N1） |
| R4 | 新增的 `## Phase 契约头`、`## 速读卡`、`### 字段说明`、`#### 示例` 被其它校验器误读 | 存在本报告未读到的 phase 校验器/消费者 | 已核实 `validatePostPhaseContract` 的卡片扫描只在 `## L1`…`## L2` 之间、且只认三级标题，故 85 与 155 不会被当卡片；其它消费者未核实（§5 U2/U3） |
| R5 | `## 速读卡` 与 plan 模板同名 | 若某处对 phase 文件套用 plan 的 `PLAN_SECTION_ALIASES`（其中有 `/速读卡/`），可能按 plan 的 6 字段口径去断言 phase 的速读卡 | 草案速读卡是 7 条自定人读字段、标题内逐字标注「人读；只写本 Phase 增量」；若确有此消费者，改名为 `## 本 Phase 速读` 即可规避（无任何断言依赖此名，§5 U9） |
| R6 | 模板本身永远不能通过 A16 | 保留裸 `[` 占位符 → 未填写即被拒 | 这是刻意的安全网（§3.1 原则 4）；若需要「能过校验的样例」，用草案 155–177 的 `#### 示例`，而不是把模板填成假数据 |
| R7 | 示例里的具体文字被照抄进真实文档 | 作者直接复制 `src/config/load.ts` / `ORACLE-P3-CONFIG-ERROR` | 示例标题与使用说明均逐字写了「内容与你的仓库无关，照抄形状、不要照抄文字」；仍属人为风险 |
| R8 | §3.3 对照表的行号失效 | 草案被增删任何一行 | 行号绑定 185 行版本；改稿后必须重跑校验（重跑脚本曾一次性给出全部行号与 32 条断言结果） |
| R9 | 后续维护者往说明文字里写「不要写 `plan.md`」这类句子，会让 C1-3/C1-4 变红 | 禁用词的任何出现位置（含人读说明） | 现有草案实测无命中；该陷阱应写进模板使用说明，提醒维护者 |
| R10 | 本报告的验证口径 ≠ 仓库测试为绿 | 断言是我用 node 脚本在报告内的文本副本上复现的；未跑任何仓库测试（只读硬规则 + 禁全量回归） | 落盘后必须真跑 `tests/contract/post-cohort-authoring-files.test.mjs` 与 `tests/contract/post-cohort-executable-authoring.test.mjs`（§5 U7） |

### §4.2 明确决定不做的改动

| # | 不做的事 | 理由 |
| --- | --- | --- |
| N1 | 不把中文字段标签改成英文 | 会直接让 §2 C1-2 的 10 个字串与 C2-3 的 12 个加粗标签变红；且字段级别名机制未核实（§5 U1），风险不可控 |
| N2 | 不新增或改名任何被 runtime 解析的字段/标签 | 任务硬约束：不得引入新门禁、新 stage、新 gate、新校验字段。草案只补 runtime **本来就在读**的五个文件级字面名（A11/A12） |
| N3 | 不新增 phase 模板版本常量 | §2 B4：runtime 只有 `plan-task.v3/v4` 体系，没有 phase 版本体系；草案第 11 行只是人读版本号，不注册进常量、不新增 `SUPPORTED_*` 项 |
| N4 | 不动 `phases/index.md` 模板 | 本次范围只有 phase 模板；index 另有自己的禁词断言（`gate_cmd`/`expected_exit`/`oracle`/`evidence_path`/`执行状态` 等），混改会互相污染 |
| N5 | 不改 `plan-template.md` | 它是本次的质量标杆，只作对照；改它会同时移动 §1 全部对照引用的行号 |
| N6 | 不把 plan 的 `## 材料导航`/`## 技术决策`/`## 需求与验证追踪`/`## 治理同步矩阵`/`## 宪法逐项检查` 整块搬进 phase 模板 | §1 D17：post 的 phase 只写增量与指针，全局设计归 `spec.md`（§2 C2-10）；搬过来会造成双写，并与 C2-9「不得把自己描述成 plan/tasks 产物」的语义冲突 |
| N7 | 不新增任何「必须」级别的人读要求 | 草案「字段说明」表的列名是「写作下限」，且标题内逐字声明「runtime 不解析本节，也不产生任何质量结论」——避免制造新的软门禁（宪法：记录事实而非阻断） |
| N8 | 不修改仓库任何文件 | 本任务只读；草案以文本形式交付，是否落盘由父代理决定 |

---

## §5 不确定项

- **U1｜是否存在「字段级别名表」把中文标签映射到 runtime 的英文字面名** —— 我读到的 `runtime/stage/stage-content-contracts.mjs:4380-4530` 只有**章节级** `PLAN_SECTION_ALIASES`（且只覆盖 plan 章节标题），没有字段级别名；`fieldValue(...)` 的实现体（字面名匹配还是走别名）**没读到**（不在 6850–7120 与 4380–4530 两段内）。影响 §4 R2/R3：四个文件级字段与全部 17 个卡片字段的语言问题悬而未决。
- **U2｜是否还有其它校验器/消费者会读 phase 文件的二级/三级标题或新增的人读区块** —— 只核实了 `validatePostPhaseContract` 与两份契约测试；§4 R4/R5 因此无法排除。
- **U3｜`PHASE_FIELDS` / `PHASE_FIELDS_V3` 的消费点** —— 只读到常量定义（`:4490-4493`），没读到谁在什么条件下读它；不确定 v3 的 `Done`/`Risks and rollback` 是否也作用在 post 的 phase 文件上。
- **U4｜`skills/spec-plan/templates/` 目录下的其它模板文件（尤其 index 模板）的真实文件名与内容** —— 清单外未读；本报告对 index 的约束全部转述自两份契约测试的断言文本。
- **U5｜真实 phase 文档的样本量只有 1** —— 只读了 `specs/archive/workflowhub-thin-core-card-05-20260919/phases/P1.md` 的前 120 行，且它属 **archive（历史）**，未必等于 post 当前最新实践。§1 的 D19–D26 不能推广为「所有真实 phase 文档都长这样」。
- **U6｜`validatePostPhaseContract` 在 7120 行之后还有没有进一步校验** —— 未读；本报告 §2-A 只覆盖 6850–7120 段。
- **U7｜未跑任何仓库测试** —— §3.3 的 32 条断言是我从报告内代码块切出草案、用 node 脚本复现真断言得到的，**不等于** `tests/contract/post-cohort-*.test.mjs` 真的绿；落盘后仍需真跑一次（同样地，禁全量回归，只跑这两条针对性契约测试）。
- **U8｜占位符风格未与团队确认** —— plan 模板统一用 `[填写：…]`，现 phase 模板用裸 `[...]`；草案混用了两者（机器字段用裸 `[` 以保留 A16 拒收效果，人读表格填写槽用 `[填写：…]`）。这是有意设计，但未获确认。
- **U9｜`## 速读卡` 这个章节名在 post phase 语境里是否已被占用** —— plan 模板有同名章节；未核实是否有消费者按名字取它。若冲突，改名不影响任何断言（没有任何断言要求 phase 模板出现「速读卡」）。
- **U10｜「加说明文字能否真的让作者写得更丰富」是未验证假设** —— `workflows/build-plan/SKILL.md` 只读了前 200 行，没看到它对 phase 文档丰富度有任何要求（§1 D25）；本提案的可读性收益依赖作者（人或 agent）愿意读这些说明，未经实测。

---

## 小结

§1 诊断 26 条（D1–D26）｜§2 硬约束 38 条（A 17 + B 6 + C 15，其中 C3 为 28 项逐字清单汇总）｜§3 草案 185 行（另含 §3.3 对照表 24 行）｜§4 风险 10 条（R1–R10）+ 不做 8 条（N1–N8）｜§5 不确定项 10 条（U1–U10）。
