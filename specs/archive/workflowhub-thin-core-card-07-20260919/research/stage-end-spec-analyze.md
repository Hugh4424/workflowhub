# stage-end spec-analyze（make-decision）

> 执行契约：`skills/spec-analyze/SKILL.md`（mode=lens-only，delivery=file_only，report-only，不写被检材料）。
> 本报告是**独立语义一致性检查**，只读分析；除本文件外未修改任何被检查文件。
> 严重性口径沿用 SKILL.md：CRITICAL=违反宪法核心要求 / HIGH=冲突或歧义 / MEDIUM=术语漂移或覆盖缺失 / LOW=改进建议。

## 0. 总体结论

**`inconsistent`** —— 卡面 12 条 FR/AC 与用户 7 条关键要求大体有语义落点，审查事实（status/partial/coverage/provider 错误/解析器）经原件逐轮核对**未见美化**；但材料内部存在**成对互斥事实**（同一未闭合项两处相反状态、决策计数 23/26/27、完成判据三处不同、`deferred` 与「不是可延期项」并存、`逐字原文` 列含改写文本），且**覆盖矩阵的 23 条「待裁决」单元从未进入未闭合披露**——与「OI 无 open、可以收口」并存，属真实的语义不一致，不能标 `consistent`。

### 0b. 六段大白话摘要（SKILL.md Result 要求）

1. **当前阶段做了什么**（`stage_work`）：make-decision 阶段为 CARD-07 产出了 26/27 条决策（D-001~D-027）、19 条 OI 大纲、逐字声明层（V-001~V-019）、三档结论表、模块台账、覆盖矩阵指针、承接与不承接清单、收敛检查、Talk 记录（T-001~T-011）。
2. **原始需求覆盖到什么程度**（`requirement_coverage`）：卡面 FR-33~FR-38 / AC-33~AC-38 全部有设计层落点；用户口头要求 7 条中 6 条有落点，**V-010「主会话只做规划、派发、交互」无决策落点**；覆盖矩阵另披露 23 条单元仍为「待裁决」。
3. **与上游产物、语义、证据是否一致**（`upstream_alignment`）：对母 PRD CARD-07 节 semantic 对齐良好；对自身材料存在 12 处两处互斥（见 §3）；4 轮真实审查的 status/partial/coverage/错误码与原件一致，**未被美化**。
4. **当前阶段当场修复了什么**（`current_stage_repairs`）：G1~G8、G19 等 direction 审查修复在材料内可见（映射表步 4 口径、M10 表述、V-011/V-012 标注、收敛检查 acceptance 列、承接清单小节）；G9/G10/G18 的 step 11 后置项由 D-024~D-026 收口。
5. **剩余风险、未决和延期**（`remaining_risks`）：两张处置清单里有 11 条 `deferred` + 7 条 `accepted_risk`；材料的未闭合项摘要只列 6 条，三份披露（材料 / direction 清单 / detail 清单 / 模块台账）条数与内容都不一致。
6. **下游可以直接消费什么、不能自行猜什么**（`next_stage_boundary`）：可直接消费 D-001~D-026、OI 大纲、模块台账、承接与不承接清单；**不得**把「23 条待裁决已处置」「OI 三条全部闭合」「现行结论已含 step 11 三条收口决策」当成事实。

### 0c. 与 SKILL.md 的冲突（如实说明）

SKILL.md 的 **Input boundary** 规定「Read only the current stage packet…Do not request additional files, locate repository files, or infer material that is absent from the packet」。本任务书要求读整卡材料 + `research/` 过程证据 + 仓外 `quality/reviews/` 原件，**范围明显更宽**。按「以 SKILL.md 为准并如实说明冲突」的要求，此处说明：我**遵守**了 SKILL.md 的 lens-only / file_only / report-only / 不写材料 / finding 字段与严重性口径，但**按任务书扩大了读取范围**（否则「审查事实是否被美化」「未提交引用」两类检查在方法上不可能成立）。若严格要求 packet-only，则本报告中 §6（审查事实核对）、§7（未闭合项核对）、§8（未提交引用核对）三项属于越出 packet 边界，应记为 `material_incomplete` 而非语义 finding。

### 0d. 本次**不**计为 gap 的已授权后置项（先核对后排除）

`research/detail-review-findings-disposition.md` 的 **G12**（FR-34/FR-38 的 fixture 与失败断言→build-plan）、**G13**（append-only 机器断言与负向测试→build-plan）、**G15**（OI-007 可执行细则：角度 schema / 候选身份 / 最低数量 / 终止与失败态→build-plan）、**G14 执行层**（79 条逐条处置→build-plan 前）、**G16**（与 CARD-04 写面冻结→build-plan 前，不晚于 build-code），以及卡面「可后置技术项」（错误清单条目、发散候选生成方式），**均不计为 gap**。本文只把「这些后置项的**披露口径不一致**」计为 gap。

---

## 1. 卡面 12 条 FR/AC 逐条核对

落点均用 `文件:节名` 锚定。AC 的 fixture 实跑按母 PRD「五阶段开工说明」归 verify-code，不因本阶段未跑而判不满足（这是母 PRD 明写的阶段分工）。

| 条目 | 落点位置 | 满足？ | 差什么 |
|---|---|---|---|
| **FR-33** 发散产物存在（第一轮即产生扩散候选，含非用户提出的新方向） | `decision-log.md:决策/D-011`（先定角度再按角度填 · origin 差集 · G-4）、`decision-log.md:决策/D-015`（调研=发散引擎）、`decision-log.md:唯一 OI 大纲/OI-007`、`decision-log.md:需求大纲 v1/模块台账` M4 | 满足（机制层） | 角度表细则与「第一轮即产出」的 fixture 断言留 build-plan（G12/G15，已授权）；阶段内无发散产物落盘，`research/divergence-option-space.md` 未进送审包 |
| **FR-34** 研究结论完整到达（无 500 字上限 · 结构化候选清单＋落盘全文＋按需展开） | `decision-log.md:决策/D-015` 第 1/4 条、`decision-log.md:唯一 OI 大纲/OI-006`、`decision-log.md:需求大纲 v1/模块台账` M3 行 | 满足（机制层） | 「取消 500 字回传上限」只出现在 M3 模块描述，**未进入任何决策正文**；可执行到达验收见 G12（已授权） |
| **FR-35** 逐字双层保真＋三档结论＋偏离写明＋原话一改标待复核 | `decision-log.md:逐字声明层`、`decision-log.md:三档结论`、`decision-log.md:决策/D-010 D-017`、`OI-010` | **部分满足** | 材料**自身违反**：`V-013` 列在「逐字原文」列却是带粗体箭头的改写（见 gap H8）；「待复核」机制在材料内零实例 |
| **FR-36** 取消固定轮次与 14 步顺序锁 · 交互按真实未决问题触发 · G-4 | `decision-log.md:决策/D-017` 第 1 条、`D-016`、`OI-009`、`OI-019`、`decision-log.md:拟议方向/流程到现有阶段的映射` 措辞纪律 | 满足 | 与官方 manifest 的顺序偏差已在 `D-002` 代价节登记；round_count 合同实际改写归 build-code |
| **FR-37** 收敛 append-only · 发现缺口只追加不覆盖 | `decision-log.md:决策/D-020`、`OI-008`、`decision-log.md:现行结论` | **部分满足** | 「现行结论」未收录 D-024~D-026（见 gap H4）；逐字层与模块台账发生原地改写且未按「已被取代」登记（见 gap H9） |
| **FR-38** 追问按错误清单自检 · 每轮≥1 替代方案 · Talk/Grill 大白话 | `decision-log.md:决策/D-012`（5 条卡格式）、`D-017` 第 1 条、`OI-009`、`decision-log.md:Talk 记录/T-003` 违规自登记 | 满足（设计层） | 「错误清单」具体条目留 build-plan（卡面授权） |
| **AC-33**（对应 FR-33） | `D-011` 第 3 条（origin 差集＝机器判据）、`OI-007` acceptance/counterexample、`decision-log.md:收敛检查` 方案行 | 满足（设计层） | fixture 实跑归 verify-code |
| **AC-34**（对应 FR-34） | `D-015` 第 4 条（缺出处/路径即未到达）、`OI-006` acceptance、`收敛检查` 验收行 | 满足（设计层） | 全文不被截断的可执行断言见 G12（已授权） |
| **AC-35**（对应 FR-35） | `decision-log.md:逐字声明层`＋`三档结论`＋`D-010/D-017`、`OI-010` | **部分满足** | 同 FR-35：材料内存在被改写的「逐字原文」（V-013），即 AC-35 的失败场景「任一原始声明被改写」 |
| **AC-36**（对应 FR-36） | `D-017` 第 1 条、`OI-019` acceptance/counterexample、`decision-log.md:拟议方向/流程映射` 纪律段 | 满足（设计层） | 无 |
| **AC-37**（对应 FR-37） | `D-020` 第 2 条、`OI-008` counterexample | **部分满足** | 与 FR-37 同：AC-37 失败场景「既有记录被改写」在材料内实际发生过（V-011/V-012 标注、台账 12 行状态） |
| **AC-38**（对应 FR-38） | `D-012` 第 1~5 条、`D-017` 第 1 条、`OI-009` | 满足（设计层） | 同 FR-38（G12 已授权后置） |

**小结**：12 条中 9 条满足（设计层）、3 条部分满足（FR-35/AC-35、FR-37/AC-37 因材料自身违反其要求），无一条完全无落点。

---

## 2. 用户 7 条关键要求逐条核对

| 用户要求（引） | 落点 | 满足？ | 说明 |
|---|---|---|---|
| **「先问清痛点再调研」**（V-004） | `D-013`（最小入口＋持续核对）、`OI-004`、`decision-log.md:三档结论`（标 `接受但有偏离`）、`decision-log.md:拟议方向/流程映射` step 3（痛点澄清先于 step 4 research） | 是（有偏离且已登记） | 偏离＝把「问清」从开工门槛改成持续动作，理由引 V-016 与 R1；三档档位名副其实 |
| **「调研是高级扩散和头脑风暴，不由可证伪问题界定」**（V-018） | `D-015` 第 2/3 条、`OI-006`、`decision-log.md:三档结论`（标 `接受但有偏离`）、映射 step 4 注「范围不由可证伪问题界定」 | 是 | 该条是**用户对自己先前要求的修正**，材料如实登记取代关系 |
| **「不要东一榔头西一棒子 / 先立大纲 / 逐模块」**（V-005/V-006） | `D-014`（台账宿主＋被推翻假设＋每轮回显）、`D-009`（大纲＝可证伪假设）、`decision-log.md:需求大纲 v1` 模块台账＋模块→步骤映射 | 是 | 「先立大纲」有登记偏离（改按可证伪假设）并标 `接受但有偏离`；「逐模块」落 M2/映射表 |
| **「只有重要/方向/模糊找我，普通问题自己定」**（V-019） | `D-016` 第 2/3 条（三类＋5 档影响）、`OI-002`/`OI-003`、`T-008`、`D-017`（四项 agent 自定） | 是 | 三档标 `接受`；D-016 第 2 条给出可核对面 |
| **「大白话 + 标注推荐/不推荐」**（V-009/V-015/V-017） | `D-012` 第 1~5 条（≤3 选项＋推荐＋含义/后果/风险＋不露编号）、`D-015` 第 1 条（推荐/不推荐标记＋一句理由） | 是 | `T-003` 还如实登记了 agent 违规（单题 9 选项、无推荐、带内部编号） |
| **「开头不严进，我说太多反而干扰」**（V-016） | `D-013` 第 1~5 条、`OI-004`、`三档结论`（`接受但有偏离`） | 是 | 逐字原话在 `T-004` 与 `V-016` 双处保留 |
| **「主会话只做规划、派发、交互」**（V-010） | **无决策落点**：`D-001~D-027` 无一条以其为 requirement_id；`需求大纲 v1` 的 M2 关联需求为「U-002-07~14、U-002-16」，不含 17/18；`D-014` 内容（台账/假设/回显）不涉及主会话执行模型；`D-004` 虽在 requirement_ids 写了 U-002-18，但其三条决策（材料分层 / 回显台账 / 禁子代理产大文件）不实现「主会话不做大量阅读执行」 | **否** | 见 gap **H1**、**H2**；`T-008` 也未把该单元列入 agent 自定的四项 |

---

## 3. 材料内部一致性（两处互斥的对照）

本项目历史上出过「同一材料内两表互斥、机器零报警」的假绿事件（`D-007` 自陈本卡材料当面复现过一次计数互斥）。本次**专门**找，逐对列出：

| # | A 处表述 | B 处表述 | 性质 |
|---|---|---|---|
| C1 | `decision-log.md:现行结论` 节尾注：「**23 条**决策无一条被取代」 | `decision-log.md:现行结论/T-011`：「**26 条**决策全部获得用户最终确认（D-001 ~ D-026）」；`research/module-ledger.md:总览`：「已定决策 **27**（D-001 ~ D-027）」 | 同一事实三个数 |
| C2 | `decision-log.md:审查事实与处置`：「含 **3 条 blocking**」 | `research/direction-review-findings-disposition.md:逐条对照` 实际列出 **5** 条 blocking（R06/R12/R13/B08/B10） | 同表内互斥 |
| C3 | `research/direction-review-findings-disposition.md:三轮的真实执行事实`：第三轮 **32** findings | 任务 `quality/reviews/` 第三轮原件（pair `bd7a6a63`）adjudicated clusters = red **19** + blue **18** = **37**（blocking 6） | 计数不可由原件复算 |
| C4 | `decision-log.md:唯一 OI 大纲/OI-003` acceptance：「本卡 OI 大纲 **19 条全部闭合**」；`decision-log.md:决策/D-016` 风险缓解：「以本卡 OI 大纲的 19 条 OI 全部闭合…为可核对代理」 | `decision-log.md:收敛检查` 验收列：「且 OI **无 open（deferred 允许）**」；`OI 状态汇总`：confirmed 17 + deferred 2；`module-ledger.md:总览`：「OI 收盘 ✅（17 confirmed + 2 deferred）」 | 完成判据互斥（G8 只修了收敛检查一处） |
| C5 | `decision-log.md:唯一 OI 大纲/OI-016` question：「母 PRD 把接口冻结定为**实现依赖，故不是可延期项**」 | 同一条 OI 的 `status: deferred`；`OI 状态汇总` 把 OI-016 列入 deferred | 同一条记录内自相矛盾 |
| C6 | `OI-016.trigger` / `三档结论` / `module-ledger.md:未闭合项`：**build-code 前** | `detail-review-findings-disposition.md:G16` 与 `未闭合项 #8`：**build-plan 前**（不晚于 build-code） | 同一触发条件两种写法 |
| C7 | `decision-log.md:决策/D-011` 第 1 条：「**先与用户确定** 2–3 个变化角度」 | `decision-log.md:决策/D-025`：「变化角度由 **agent 先生成并记录**…**不为定角度单独插入一次交互**」 | 决策间互相否定，且无「已被 D-025 取代」标注 |
| C8 | `decision-log.md:逐字声明层` 编号规则：「V-nnn，**只追加，不修改**」 | 该层 `V-011/V-012` 行被**原地**加了「【索引，非逐字】」标注（`detail-review-findings-disposition.md:G7` 自陈的修法）；`需求大纲 v1` 模块台账 12 行状态由「待定」**原地**改为「已定」（G2 自陈的修法） | 与 `D-020`「旧条目原地保留并标已被取代、禁止原地改写正文」矛盾 |
| C9 | `decision-log.md:三档结论`：「原子台账成本实测 \| **未承接** \| 未实测」 | `decision-log.md:审查事实与处置` 未闭合项 3：「~~原子台账的最小范围论证未做~~ —— **已被取代**：D-021 已闭合」；`module-ledger.md:未闭合项` #2：「✅ **已闭**（D-021）」 | 同一未闭合项两处状态相反 |
| C10 | `decision-log.md:原始需求覆盖矩阵` 来源组表：「U-002 最小需求单元 \| 24 \| **covered** \| M1–M12」 | `research/coverage-matrix.md:交其他卡的处置去向汇总`：把「M2/AX04 主会话执行模型（**U-002-17/18**）」列为向 **CARD-03** 注入项（即交其他卡）；且材料内无任何决策承接 U-002-17 | 同一单元两处处置 |
| C11 | `decision-log.md:审查事实与处置` 未闭合项：6 条 | `direction-review-findings-disposition.md:未闭合项`：6 条（内容不同）；`detail-review-findings-disposition.md:未闭合项`：9 条；`module-ledger.md:未闭合项`：4 条（且把 G9/G15 两项标为已闭） | 四份披露互相不一致 |
| C12 | `decision-log.md:决策/D-016` 第 1 条：「**D-014 的三条**（需求有着落 / 无待复核 / 用户看过放弃清单）」 | `decision-log.md:决策/D-014` 的三条实为「台账宿主 / 被推翻假设须单独列出 / 每轮只回显模块级」 | 交叉引用张冠李戴 |

补充（非互斥但属结构缺陷，见 gap M8）：`decision-log.md:现行结论` 的引句「…历史条目保留在」被从中间切断，文档里出现畸形标题「## 决策`，被取代的在那里标注。」，且 `T-010/T-011` 被插进「现行结论」节内部，把该节与其 23 行结论表切断。

---

## 4. 三档结论的档位核查

**标 `接受` 的条目里，是否有实际发生偏离却未标 `接受但有偏离`？**

- 逐条看 23 行：6 条 FR 行、3 条「接受但有偏离」（先问清 ×2 行、先设计大纲 ×2 行、调研范围修正 ×1 行，共 5 行标偏离）、4 行 `未承接`，其余为 `接受`。
- **发现 1 处档位不足**：`FR-35` 行标 `接受` 且「改了什么」为空，但材料**自身**的逐字层把 `V-013` 这个改写文本放进「逐字原文」列（而真实逐字是 `V-001`），这正是 `AC-35` 的失败场景；按同一张表的纪律（「`接受但有偏离` 必须写明改了什么与为什么」），这至少应登记为偏离或未承接。→ gap **H8**。
- **发现 1 处可疑**：`FR-36` 标 `接受`，但正式 direction 审查位置相对官方 manifest 被前移（`D-002` 代价节自陈「与官方 manifest 顺序存在偏差」）。该偏差属「对官方流程的偏离」而非「对 FR-36 的偏离」，`D-002` 已单独登记，**不计为档位问题**。
- **标 `未承接` 的 4 条**：owner 与触发条件**都具体**（79 条→本卡/build-plan 前；写面冻结→本卡+CARD-04/build-code 前；生效时点→本卡/card-02 合并后；原子台账成本实测→本卡/build-plan 前）。但其中「写面冻结」的触发与 `detail:G16` 互斥（C6）、「原子台账成本实测」与已闭合声明互斥（C9）——**问题在一致性，不在 owner/触发的具体性**。
- 另：`三档结论` 表含 **2 对逐字重复行**（「先问清楚原始痛点和需求」与「『先问清楚…』→ 最小入口…」；「先设计大纲…」与「『先设计大纲再发散』→ 大纲是可证伪假设」），两对的内容、档位、为什么、落点决策几乎逐字相同，使「23 条」含重复。→ gap M3。

---

## 5. OI 处置与决策的一致性

19 条 OI 的 `selected_disposition` 与对应决策总体语义一致（OI-001↔D-005/018/019、OI-004↔D-013、OI-006↔D-015、OI-008↔D-016/020、OI-009↔D-017/016/012、OI-010↔D-010/017、OI-011↔D-018/021/023、OI-012↔D-010、OI-014↔D-018/022、OI-015↔D-011/015/017/021/023、OI-017↔D-017/019、OI-018↔D-001、OI-019↔D-016/017 均语义吻合）。**发现 5 处不一致**：

| OI | 不一致处 | 交叉证据 |
|---|---|---|
| **OI-003** | acceptance「19 条 OI 全部闭合」与其自身 status 汇总（17 confirmed+2 deferred）、`收敛检查`（deferred 允许）、`D-016` 风险缓解条互相矛盾 | §3 C4 |
| **OI-005** | question 问的是「大纲先行＋逐模块＋有顺序有节奏＋防遗忘**分别**落成什么机制」，`selected_disposition` 只回答「大纲＝可证伪假设」一项；另外三项的实际落点（`D-014`）未出现在 evidence 中 | `OI-005` question/selected_disposition/evidence |
| **OI-007** | disposition 写「先定 2 到 3 个变化角度再按角度填满」，未说明**由谁定**；`D-011` 写「先与用户确定」，`D-025` 改为「agent 先生成并记录」。OI 记录停在 D-011 口径 | §3 C7 |
| **OI-013** | disposition/acceptance 只列允许的 3 个 key；`D-026` 声称「三处表述（in-10 / D-002 风险注 / OI-013 acceptance）统一到本条（未收敛选项空间写入 `objective_facts`）」，但三处**均未**写明该落点；`拟议方向 in-10` 仍表述为「输入为『一个当前方向对象 + 未收敛选项空间』」，读起来像独立字段（会触发 `MATERIAL_FORBIDDEN`） | `D-026` 后果节 vs `拟议方向` 范围 in-10 / `D-002` 风险 / `OI-013` acceptance |
| **OI-016** | 自身 question 声明「不是可延期项」但 `status: deferred`，且触发时点两处不同 | §3 C5、C6 |

另：`OI-014` acceptance（负向测试真报失败）在 `status: confirmed` 下无阶段内证据，实际执行归 build-code（`D-018`）。这属**阶段分工**（本卡只定义校验什么），不计为 OI↔决策矛盾，仅记为 LOW（见 §9 L1）。

---

## 6. 审查事实核对（逐轮，含真实 status）

**核对对象**：任务 `workflowhub-thin-core-card-07-20260919/quality/reviews/`（`attempts/` 8 个 attempt.json、`results/` 7 份 result.json、`reports/` 12 份，含 4 份 pair 汇总报告 `d74607f3`/`d051affd`/`da56fd4b`/`d22f33c9`）。**核对方法**：逐份解析 pair 汇总报告的 `partial`/`semantic_status`/`coverage`、逐 attempt 的 provider `status` 与 `error.code`、逐 result 的 `adjudication.clusters`，再与材料 `审查事实与处置` 表逐格比对。

| 轮次（pair） | 材料陈述 | 原件实测 | 一致？ |
|---|---|---|---|
| direction 1（`7c6c6231`，material `80534277`） | red `available` / blue `available` / partial **false** / 30 findings / 「送审包含 agent 侧 bug（outline 全 null、raw 重复）」 | pair 报告 `d74607f3`：`partial:false`、red 与 blue report 均 `semantic_status=available, coverage=satisfied`；3 provider 全 `completed`；clusters red 15 + blue 16 = **31**；原件确有 blocking「17 条 OI category/source/question 全 null」与「raw U-002/U-003 重复」两条 | status/partial/bug 描述**一致**；条数 30 vs 31 **差 1**（口径未披露） |
| direction 2（`bbe6a827`，material `48994faf`） | red `unavailable` / blue `available` / partial **true** / 13 findings / red：`kimi/coding`+`antigravity/flash`=`PROVIDER_RESULT_INVALID`；`codex/luna`=`REVIEW_WAIT_EXCEEDED`（20 分钟超时，**broker 未取消**） | pair 报告 `d051affd`：`partial:true`；red report `semantic_status=unavailable, coverage=incomplete`；attempt `83ad29b3`：kimi/antigravity `failed` + `PROVIDER_RESULT_INVALID`，codex `running`；result 级 `error={code:REVIEW_WAIT_EXCEEDED, message:"…within **1200000 ms**; the broker was **NOT** cancelled and may still complete"}`；blue 13 clusters | **完全一致**（含 20 分钟、broker 未取消、无 pass 语义） |
| direction 3（`bd7a6a63`，material `04398d20`） | red `available coverage=satisfied` / blue `available coverage=satisfied` / partial **false** / 32 findings（材料另注「含 3 条 blocking」）/ 「唯一干净轮」 | pair 报告 `da56fd4b`：`partial:false`；两份 role report 均 `available`/`satisfied`；clusters red **19**（含 4 blocking）+ blue **18**（含 2 blocking）= **37**；`direction` 处置清单实际列 **5** 条 blocking | status/partial/coverage **一致**；条数 32 vs 37、blocking 3 vs 5 **不一致** |
| detail（`8605366f`，material `1470df4d`） | red 与 blue 均 `available`、`coverage=satisfied`、`partial=false`；33 findings = RED 19（1 blocking/16 major/2 minor）+ BLUE 14（4 blocking/8 major/2 minor） | pair 报告 `d22f33c9`：`partial:false`、双 `available`/`satisfied`；clusters red **19** = `{blocking:1, major:16, minor:2}`、blue **14** = `{blocking:4, major:8, minor:2}` | **逐格完全一致** |

**材料「材料契约自检」表的独立复核**（我在读-only 前提下用原型解析器实跑 `specs/workflowhub-thin-core-card-07-20260919/decision-log.md`）：

- `readTaskTypeFromDecisionLog` → `"普通任务"` ＝ 材料陈述 ✓
- `analyzeDecisionOutline` → `ok=false`，`errors.length=17`，**全部**为 `OI OI-0xx core interaction proof is unavailable`（与材料「非 proof 类错误 0」「17 条 core interaction proof is unavailable 属预期」✓）
- `analyzeDecisionConvergence` → `ok=true`，`errors=0` ＝ 材料陈述 ✓

**结论：审查事实未被美化。** 具体依据：(1) 唯一失败轮（direction 2）被如实写成 `unavailable`/`partial:true`/`coverage=incomplete`，且把 `REVIEW_WAIT_EXCEEDED`、1200000 ms、「broker 未取消」逐字保留；(2) 三次 provider `PROVIDER_RESULT_INVALID` 未被改写为通过；(3) `analyzeDecisionOutline` **没有**被写成 overall passed，17 条 proof 缺失被显式披露为「预期项」且不伪造成绑定；(4) detail 轮的 findings 计数与严重性分布与原件**逐格吻合**；(5) 材料反复声明「审查是 advice，不是门禁」「三轮均未产出 pass 语义」。**唯二需要修的**是 §3 C2/C3 的条数与 blocking 数披露（一个方向是**低报**，不是把失败写成成功）。

---

## 7. 未闭合项披露核对

| 来源 | 条数 | 内容 |
|---|---|---|
| `decision-log.md:审查事实与处置` | 6 | OI-007 细则 / 79 条 / 原子台账已闭 / R01+B02 reveal 协议 / R04 角度提供者 / 三个前置冻结 / 第二轮 red 无结果 / 无 pass |
| `research/direction-review-findings-disposition.md:未闭合项` | 6 | G1 机制层 / G6 执行层 / G9 / G18 / 第一轮独有未列 / 第二轮 red 无结果 |
| `research/detail-review-findings-disposition.md:未闭合项` | 9 | G9 / G10 / G18 / G12 / G13 / G15 / G14 / G16 / OI-018 |
| `research/module-ledger.md:未闭合项` | 4 | 79 条 / 三个前置冻结（其余两条标已闭） |

**不一致要点**：
1. **decision-log 摘要漏项**：detail 清单里的 **G12、G13、G11、G17、G20、G18** 在 `decision-log.md:审查事实与处置` 的未闭合项清单中**完全不出现**（G16/G14 以「三个前置冻结」「79 条」间接覆盖）。G11/G17/G20 是 `accepted_risk`（不是「已解决」），按 `D-027`「收口声明必须携带两张未闭合清单」的口径，摘要不完整。
2. **两张清单自身过期**：detail 清单把 G9/G10/G18 标「未闭合，触发=step 11」，但 step 11 已由 **D-024/D-025/D-026** 收口；`module-ledger.md:官方步骤进度` 也仍把 step 10 标「🔄 已派发」、step 11 标「⏳」，与 `T-010/T-011` 已完成互斥。
3. **`deferred`/`accepted_risk` 与材料披露的对应关系**：direction 清单 3 条 accepted_risk（B01/B17→G9、R12/B08→G18）与 detail 清单 4 条 accepted_risk（G11×2 blocking、G17、G20）中，材料只覆盖了 G9/G18 两类；G11（送审包证据范围）/G17（`requires_user_decision` 全 true）/G20（执行顺序歧义）**未以风险条目形式出现在材料里**（G17 的相关事实在 `D-016` 里，G20 的结论在 `D-013`+映射表里，但都没有被标为「已接受的剩余风险」）。

---

## 8. 「未提交引用」使用核查

`detail-review-findings-disposition.md:G11`（含 1 条 blocking）明确：`coverage-matrix.md`、findings 处置、解析器结果**不在送审 bundle 内**，风险是「审查者只能看到提交的 bytes」，缓解措施是「在阶段末披露中单列『未提交引用不得作为验收事实』」。

核查结果：
- **缓解措施未落盘**。整份 `decision-log.md` 中**没有**这样一条单列披露；最接近的只是 `承接与不承接清单/给其他卡的输入注入义务` 里 CARD-10 行的四个字「送审包证据范围」。→ gap M7。
- **未提交引用仍被当作可核对依据使用**：`decision-log.md:收敛检查` 的「可执行验收」列把 `research/divergence-option-space.md`、`research/coverage-matrix.md` 写成「数据来源」；`原始需求覆盖矩阵` 节以「（来源：`research/coverage-matrix.md`，机器逐行核实）」为计数依据；`D-005/D-006/D-007` 的 derived_from 大量指向 `research/I1`、`I2`、`R1~R4`。这些文件全部不在送审包内，审查者无法核验。
- **材料对「未实现/未独立复跑」有部分诚实声明**（应予肯定）：`D-007` 风险节写明「`coverage-matrix.md` 的『本卡承接 383』是**文本级溯源**判定，未跑测试、未重放 review、未独立复跑『未接线/死代码』的 grep 结论…该 383 不能当作『已实现』」；`D-006` 也登记了本卡自身两处事实勘误。故本条不是「拿未核验结论冒充已核验」，而是**G11 承诺的披露动作缺失**＋**验收数据来源越出送审范围**。

---

## 9. gap 清单

字段对齐 SKILL.md「每个 finding 需 type / source_artifact / target_artifact / fr_or_task_id / anchor / impact / suggested_correction / disposition」。`disposition` 一律为 `pending_main_agent_review`（本 lens 只报不改）。

### HIGH（11 条）

| # | 位置（文件:节名） | 问题 | type | source→target | 关联 ID | 严重性 | 建议修法 |
|---|---|---|---|---|---|---|---|
| **H1** | `decision-log.md:逐字声明层` / `:三档结论` / `:决策/D-004` / `:需求大纲 v1（模块台账）` | 用户要求 **V-010「主会话只做规划、派发、交互，不做大量阅读执行」（= U-002-17/18）无任何决策落点**：D-001~D-027 无一条以 U-002-17 为 requirement_ids；M2 关联需求不含 17/18；D-014 不涉及执行模型；D-004 虽写 U-002-18 但三条决策不实现该要求 | missing_coverage | `decision-log.md:逐字声明层`（V-010/U-002-17/18）→ `decision-log.md:决策` | V-010；U-002-17/18 | HIGH | 二选一：①新增一条决策明确主会话执行模型（含「谁派发、谁阅读、上下文上限」的可核对面）；②在三档结论补一行 `未承接`，写清 owner 与触发（如交 CARD-03 并注明注入物） |
| **H2** | `decision-log.md:原始需求覆盖矩阵` vs `research/coverage-matrix.md:交其他卡的处置去向汇总` | 同一单元两处处置：来源组表称 U-002 24 条**全部 covered→M1–M12**；覆盖矩阵把「M2/AX04 主会话执行模型（U-002-17/18）」列入**注入 CARD-03**（交其他卡）。读者按材料表会以为已由本卡承接 | inconsistency | `research/coverage-matrix.md` → `decision-log.md:原始需求覆盖矩阵` | U-002-17/18 | HIGH | 在来源组表把 U-002 拆出「交其他卡 2 条」，或在覆盖矩阵与材料内统一为「本卡承接 M2/AX04，派发方法分量交 CARD-03」，并让两处数字可互推 |
| **H3** | `decision-log.md:现行结论`（节尾注） / `:现行结论/T-011` / `research/module-ledger.md:总览` | 决策计数 **23 / 26 / 27** 三处互斥；且第 27 条 D-027 的正文又说「26 条决策」 | inconsistency | `research/module-ledger.md` → `decision-log.md:现行结论` | D-001~D-027 | HIGH | 统一为实际条数（D-001~D-027，其中 D-027 为收口元决策），并同步现行结论、T-011、承接清单、module-ledger 四处数字 |
| **H4** | `decision-log.md:现行结论` | `D-020` 定义「现行结论」为「现在生效的结论」，但该节的结论表只列 **D-001~D-023**，**未收录 step 11 的 D-024/D-025/D-026**；同节尾注据此断言「无一条被取代」 | inconsistency | `decision-log.md:决策/D-024~D-026` → `decision-log.md:现行结论` | FR-37；D-020 | HIGH | 追加 D-024/D-025/D-026 三行（append-only，不删旧行），并把尾注改为「26/27 条中 D-011 第 1 条已由 D-025 修正」 |
| **H5** | `OI-003.acceptance` / `decision-log.md:收敛检查` / `:唯一 OI 大纲/OI 状态汇总` / `:决策/D-016` 风险 | 完成判据互斥：OI-003 与 D-016 要求「**19 条 OI 全部闭合**」，而收敛检查与 OI 状态汇总是「**OI 无 open（deferred 允许）**」（17 confirmed + 2 deferred）。G8 的修复只落了收敛检查一处 | inconsistency | `detail-review-findings-disposition.md:G8` → `OI-003.acceptance`、`D-016` | OI-003；D-016；FR-35 | HIGH | 把 OI-003.acceptance 与 D-016 风险缓解条一并改为「OI 无 open（deferred 允许，deferred 项 owner/trigger 见 OI 记录）」，并同步 module-ledger |
| **H6** | `OI-016`（question 与 `status`、`trigger`） / `detail-review-findings-disposition.md:G16` | 同一条 OI 自述「母 PRD 把接口冻结定为**实现依赖，故不是可延期项**」却标 `status: deferred`；触发时点两处不同（OI-016/三档结论=**build-code 前**；G16/未闭合项 #8=**build-plan 前**） | inconsistency | `detail-review-findings-disposition.md:G16` → `OI-016` | OI-016；母 PRD 实现依赖节 | HIGH | 二者取一：把 status 改为 confirmed（把冻结动作本身写进 build-plan 前的前置）或把 question 改为「可延期」；并统一 trigger 为一处（建议 build-plan 前，不晚于 build-code，与母 PRD「实现依赖」一致） |
| **H7** | `decision-log.md:决策/D-011` 第 1 条 vs `:决策/D-025` | 角度提供者两处互斥（「先与用户确定」vs「agent 先生成、用户可否决」），D-011 未按 `D-020` 标「已被 D-025 修正」；现行结论尾注「无一条被取代」据此不成立 | inconsistency | `decision-log.md:决策/D-025` → `decision-log.md:决策/D-011` | FR-33/AC-33；OI-007；D-020 | HIGH | 按 append-only 在 D-011 第 1 条旁加「已被 D-025 修正（角度由 agent 生成、用户可否决）」；同步 OI-007 的 selected_disposition |
| **H8** | `decision-log.md:逐字声明层`（V-013 行） | V-013 处于「**逐字原文**」列，实为带粗体/箭头/压缩的重述（真实逐字是 V-001）；该层自述「只放用户原话，逐字、不改写、不加解释」，且 AC-35 的失败场景正是「任一原始声明被改写」。G7 只处理了 V-011/V-012 | fidelity_violation | `decision-log.md:逐字声明层` → 同层 V-013 | FR-35；AC-35；OI-010 | HIGH | 把 V-013 改标【索引/重述，非逐字，不参与保真核对】并指向 V-001；或把 V-001 原文整段复制过来（但不得与 V-001 冲突） |
| **H9** | `decision-log.md:逐字声明层`（编号规则） / `:需求大纲 v1（模块台账）` / `:决策/D-020` | 材料自定「V-nnn **只追加，不修改**」「禁止原地改写正文，改动的条目原地保留并标『已被 X 取代』」，但实际发生了原地改写：V-011/V-012 行加标注（G7）、模块台账 12 行状态「待定→已定」（G2），且都未登记「已被取代/修正」关系 | inconsistency | `detail-review-findings-disposition.md:G2/G7` → `D-020`；`逐字声明层` 规则 | FR-37；AC-37；D-020 | HIGH | 二选一：①按 D-020 补「已被 X 取代/修正」标注，并把原值留在取代行；②明确宣布「视图/状态列的实时刷新不属于 D-020 的『正文条目』」，并在规则处写清这一例外 |
| **H10** | `research/coverage-matrix.md:待裁决清单` / `decision-log.md:原始需求覆盖矩阵` / `:审查事实与处置` | 覆盖矩阵披露 **23 条「待裁决」单元**（含 U-22「送审 decision-log SHA 不一致」、A-046「三个 revision 指哪三个」等仍未裁决项），但：①材料仍报「待裁决 23」；②其中 MOD-M9（OI-012 已 confirmed）、ML-06/ML-07（D-005/D-006 已写入）等至少 3 条**在矩阵口径下已闭合却未更新**；③这 23 条**没有进入任何未闭合披露**，也没有 owner/触发 | stale_snapshot + undisclosed_open | `research/coverage-matrix.md:待裁决清单` → `decision-log.md:审查事实与处置`、`:原始需求覆盖矩阵` | D-007；D-023；SD-15 | HIGH | 逐条刷新 23 条状态（已闭合/仍待裁决），把「仍待裁决」项按 SKILL.md 检查 5 写全 owner/trigger，并在 `审查事实与处置` 的未闭合项里单列该集合 |
| **H11** | `decision-log.md:审查事实与处置`（轮次表处置汇总） vs `research/direction-review-findings-disposition.md:逐条对照` | 「第三轮 32 条…含 **3 条 blocking**」与处置清单实际 **5 条 blocking** 互斥；且第三轮原件 adjudicated clusters = **37**（red 19 + blue 18，blocking 6），32 条不可由保留原件复算，去重/合并口径未披露（第一轮 30 vs 原件 31 同理）。`D-007` 自定「计数必须能被读者用表内数字自行验算」 | inconsistency | `quality/reviews/results/*` → `decision-log.md:审查事实与处置`；`direction-review-findings-disposition.md` | FR-35；D-007 | HIGH | 在两张处置清单写明「条数=跨 red/blue 去重后的 finding 数」及去重规则；修正 blocking 计数为实际值；或直接改用原件的 adjudicated cluster 数 |

### MEDIUM（8 条）

| # | 位置 | 问题 | type | 关联 ID | 严重性 | 建议修法 |
|---|---|---|---|---|---|---|
| **M1** | `decision-log.md:审查事实与处置` 未闭合项 / `research/direction-review-findings-disposition.md:未闭合项` / `research/detail-review-findings-disposition.md:未闭合项` / `research/module-ledger.md:未闭合项`＋`:官方步骤进度` | 四份未闭合披露条数/内容互不一致（6/6/9/4）；decision-log 摘要漏 G12/G13/G11/G17/G20/G18；detail 清单把已由 D-024~D-026 收口的 G9/G10/G18 仍标「未闭合，触发 step 11」；module-ledger 仍把 step 10 标「已派发」、step 11 标「⏳」 | inconsistency | D-027；G9/G10/G18 | MEDIUM | 以 detail 清单为基准刷新三处：标注 step 11 三项已闭、补 G11/G12/G13/G17/G20、同步 module-ledger 的 step 进度 |
| **M2** | `decision-log.md:决策/D-026` vs `:拟议方向（范围 in-10）` / `:决策/D-002` 风险 / `OI-013.acceptance` | D-026 声称「三处表述统一到本条（未收敛选项空间写入 `objective_facts`）」，但三处均未写明该落点；in-10 仍读作「方向对象 + 未收敛选项空间」两个输入 | inconsistency | D-026；OI-013；FR-33 | MEDIUM | 在三处各补一句「未收敛选项空间以 `objective_facts` 自由文本承载；`convergence_outline` 仍 questions-only」，或把 in-10 的表述改为「(见 D-026)」 |
| **M3** | `decision-log.md:三档结论` | 表内 2 对逐字重复行（「先问清楚原始痛点和需求」与「『先问清楚…』→ 最小入口…」；「先设计大纲…」与「『先设计大纲再发散』→ 大纲是可证伪假设」），内容/档位/为什么/落点几乎相同，使「23 条」含重复 | duplicate | FR-35；U-002-01/02；U-002-10/11 | MEDIUM | 合并重复行（保留带「→ 修正后形态」的一行），在表头注明合并关系；同步 module-ledger 的「三档结论 23 条」 |
| **M4** | `decision-log.md:三档结论`（原子台账成本实测行） vs `:审查事实与处置` 未闭合项 3 / `research/module-ledger.md:未闭合项` #2 | 同一项两处状态相反：三档结论标 `未承接（未实测）`，另两处标「已被取代/已闭（D-021）」 | inconsistency | D-021；第三轮 B01/B17 | MEDIUM | 统一为「最小范围论证已由 D-021 闭合；成本**实测**仍为未承接，owner/触发=本卡/build-plan 前」，两处同口径 |
| **M5** | `decision-log.md:唯一 OI 大纲/OI-005` | question 覆盖「大纲先行＋逐模块＋有顺序有节奏＋防遗忘」四项，selected_disposition 只答「大纲＝可证伪假设」，evidence 未引 D-014 | underdefined | OI-005；U-002-07~14/16 | MEDIUM | 补写后三项的落点（D-014 三条）并加入 evidence，或把 question 收窄为只问大纲形态 |
| **M6** | `decision-log.md:决策/D-016` 第 1 条 | 把「D-014 的三条」标为「需求有着落 / 无待复核 / 用户看过放弃清单」，与 D-014 正文（台账宿主 / 被推翻假设须列出 / 每轮只回显模块级）不符 | inconsistency | D-014；D-016 | MEDIUM | 改为引用 D-014 的真实三条，或明确写出这三条收敛子判据的出处（若来自 M5/放弃清单，应指向 D-020） |
| **M7** | `decision-log.md:审查事实与处置` / `:收敛检查` / `:原始需求覆盖矩阵` / `:承接与不承接清单` | G11 承诺的「阶段末单列『未提交引用不得作为验收事实』」未落盘；同时 `收敛检查` 把未送审的 `research/coverage-matrix.md`、`divergence-option-space.md` 写作「可执行验收的数据来源」 | unsubmitted_reference | G11（B10 blocking）；D-004 | MEDIUM | 在 `审查事实与处置` 新增一条单列披露（原文照 G11 的缓解措辞），并在收敛检查表注「数据来源为未送审支撑文件，仅作本卡内部核对」 |
| **M8** | `decision-log.md:现行结论`（节首引句与节内嵌套） | 结构破损：引句「…历史条目保留在」被从中间切断，文档出现畸形标题「## 决策`，被取代的在那里标注。」，且 T-010/T-011 被插进「现行结论」节内部，使该节与紧随其后的 23 行结论表被切断；机器解析依赖标题定位时结果不确定 | structural | FR-37；D-020 | MEDIUM | 修复引句（还原为完整一句，把指向 `## 决策` 的代码引用转义/换写法），并把 T-010/T-011 移出「现行结论」节或明示为节内子块 |

### LOW（3 条）

| # | 位置 | 问题 | type | 关联 ID | 严重性 | 建议修法 |
|---|---|---|---|---|---|---|
| **L1** | `decision-log.md:收敛检查` 验收行 / `OI-014.acceptance` | 负向校验器与本表「可执行验收」在本阶段**不可执行**（接线归 build-code，D-018），却与其余三行并列呈现；表下注虽声明「不构成完成宣据」，仍易被读成已具备执行条件 | underdefined | OI-014；D-018；AC-33..38 | LOW | 在该行加「本阶段仅定义；执行归 build-code（D-018）」一句 |
| **L2** | `decision-log.md:三档结论`（FR-34 行） | FR-34 标 `接受`、「改了什么」为空，但「取消 500 字回传上限」未进入任何决策正文，只出现在 M3 模块描述 | missing_coverage | FR-34/AC-34；D-015 | LOW | 在 D-015 第 1 条补「取消 500 字回传上限（技能文本层）」，或把 FR-34 行标为 `接受但有偏离` |
| **L3** | `decision-log.md:决策/D-002` 风险 | 引用 provider 失败史（`antigravity/flash` 曾 `AUTHENTICATION_FAILED`、`kimi/coding` 曾 `RATE_LIMITED`）在本卡 4 轮原件中无对应记录、未给锚点，属未验证的外部历史断言 | unsupported_claim | D-002 | LOW | 补锚点（外部 task/时间）或改为「本卡未复现，仅作历史提示」 |

### 计数

`CRITICAL 0 / HIGH 11 / MEDIUM 8 / LOW 3 = 22 条`。

### 未发现问题的范围（明确写「未发现」，不凑数）

- **审查事实美化**：未发现（见 §6，五条依据）。唯一相关问题是条数/blocking 数披露不一致（H11），方向是**低报**而非把失败写成成功。
- **provider 失败被改写为质量通过**：未发现；`unavailable`/`partial`/`timeout`/`PROVIDER_RESULT_INVALID`/`REVIEW_WAIT_EXCEEDED` 均原样保留。
- **卡面 FR/AC 完全无落点**：未发现（12 条均有落点，3 条为部分满足）。
- **`research/` 未提交文件被冒充为审查意见**：未发现；`D-008` 已把非配置通道产物降级为「发散素材」并在 `research/notes-dsh-divergence-nonauthoritative.md` 头部写死性质。
- **已授权的 build-plan 后置项**：G12/G13/G14/G15/G16 未计为 gap（见 §0d）。

---

## 10. 方法局限

1. **读取范围越出 SKILL.md 的 packet-only 边界**（见 §0c）。若严格 packet-only，本报告 §6/§7/§8 应改为 `material_incomplete`。
2. **`research/coverage-matrix.md` 的 515 行未逐行复核**；我只核了它的表 A/§3/§4/§5 汇总、组数（G01–G24 实测存在，物理顺序 G01…G12、G14、G13、G15…G24 与材料声明一致）、算术（383+13+96=492；492+23+0=515；来源组构成 188+24+6+12+109+72+9+7+62+26=515 均自洽）。**材料「24 个来源组」与来源组表只列 15 行的差异**属已知口径（12 行按「组」计数、明细在支撑文件），未计为 gap。
3. **审查 findings 的「去重口径」未在材料中给出**，我按原件 `adjudication.clusters` 计数复算；若材料用的是别的合并规则，H11/C3 的数字差可能被解释为口径差异——但材料未写明口径本身仍是 gap。
4. **未跑任何测试、未重放 review、未复跑 grep 结论**（沿用 `D-007` 自陈的边界）；解析器只在原型函数上实跑（read-only），未走完整 stage publication。
5. **未读取 card-02 兄弟 worktree 材料**，故无法独立核验「79 条」的实体与「三个 revision」；这些在本报告中按材料自陈处理，并已在 H10 中作为未裁决项归位。
6. **行号一律未使用**（按材料的语义锚点纪律与任务书要求）；若后续材料结构变动，`文件:节名` 锚点仍可用，但 §3 C12 提到的 D-014/D-016 交叉引用需按内容复核。
7. 本报告未对被检查文件做任何修改；唯一新增文件是本报告本身，以及（仓外、一次性）`/tmp/verify-parsers.mjs` 解析器复跑脚本。
