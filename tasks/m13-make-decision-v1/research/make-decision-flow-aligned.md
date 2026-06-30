# M13 make-decision 流程设计（对齐原始 intake 排序）

> 来源：对齐 agenthub intake.md + intake-review-orchestrator/SKILL.md 原始排序，含用户修正：外部调研条件触发、talk 共三次。
> 本文档是 make-decision skill 的流程规范草稿，非最终 SKILL.md。

---

## 定位

make-decision 负责**保证在做正确的事**——问题、边界、约束必须问清楚再进下游。本阶段不追求快。

流程是薄编排层：按顺序调用独立 skill，每个 skill 封装一个固定子流程。

---

## 步骤排序

### S0：背景扎根（必做）

在开始任何讨论之前，先扎根项目上下文：

1. 读 `project-memory.md`，检查历史经验、反模式、已有决策
2. 读相关 ADR 和已有 `decision-log.md`，确认不重复讨论已定方向
3. 读相关代码：如果用户提到具体功能或文件，先读对应代码和测试，确认当前实现
4. 扫描 conversation history：如果用户已提供详细方案，将已有方案直接作为产出，不重新跑 discovery

**产出完整性自检**（写 artifact 前必须做）：artifact 是否覆盖 conversation 全部设计维度、有无用户问题点被遗漏、产出篇幅相对方案讨论是否明显缩水（缩水=信息丢失）。

---

### S0.5：范围分流 + 建原始需求台账（scope-triage，立案起点必调）

**建原始需求台账（D28，起点建账，所有档不可跳）**：调度的第一动作是把用户原始需求逐条拆成可追踪台账条目，每条状态：`已覆盖` / `待处理` / `已丢弃`。

台账规则：
- 台账贯穿全程，在后续每个用户摘要点（辩论收敛、grill 前、S9 硬性确认）逐条渲染
- 任一环节（三角度审查/talk/debate/scope-triage）把某条原始需求判为丢弃/移出范围，必须在台账登记驳回理由
- **无静默踢出的合法路径**，理由缺失对裁决有强制阻断力
- low-risk 跳步同样保留台账，丢弃项照记理由

`scope-triage` 判断改动规模和复杂度：输入用户需求+拟改路径 → 黑名单匹配+复杂度评估 → 输出轻量档/全套/推荐拆分（含 `risk-level: low|high`）。黑名单命中→强制全套。

**分支**：
- `low` → 照跑 talk（内部短路处理），跳过内部调研/外部调研/盲审/debate，直入 S4→S9-S10（台账仍贯穿）
- `high` → 全序 S1-S10
- 推荐拆分 → 不映射 risk-level，给用户确认

调用完成后追加 journal `skill_called`（skill=scope-triage）。不可跳过。

---

### S1：内部调研（full 档必做，看需求背景+问题）

先大白话告知用户在做什么。

派 **≥3 个子代理**（至少 3 个，规模越大越多）做内部多维调研，整体覆盖五类各有侧重：

| 类别 | 侧重点 |
|------|--------|
| 问题 | 当前存在什么问题、症状与表现 |
| 根因 | 为什么会这样、底层原因 |
| 风险 | 如果动它会出什么问题 |
| 方向 | 可行的解法方向有哪些 |
| 扩展 | 相关联的上下游影响 |

目的：避免单代理盲区。产出汇总后进入 S2 talk#1。

---

### S2：talk#1（基于内部调研，聊外部调研是否需要 + 调研方向）

基于 S1 内部调研结果，与用户做第一次 talk：

- 内部调研发现哪些开放问题？
- 这些问题是否需要外部调研才能回答？
- 如果需要，外部调研方向是什么（搜什么、哪个领域）？

**输出决策**：S2 给出「是否进行外部调研」的明确判断（需要/不需要）。这个决策控制 S3 是否执行。

调用完成后追加 journal `skill_called`（skill=talk-with-zhipeng, round=1）。

---

### S3：外部双路调研（CONDITIONAL — 由 S2 决定是否做；看开放性思路）

**仅当 S2 判断「需要外部调研」时执行**；S2 判断不需要则直接跳到 S4。

基于 S2 确认的调研方向，双路独立取证：

**路 A — muyu-search-mcp（本地 MCP 插件）**：
- 必须显式传 `extra_sources>=3`（默认 0 则纯 LLM 幻觉，真实检索来自 Tavily/Firecrawl）
- 完成后调用 `get_sources` 核对真实来源，只看 content/sources_count 不算数
- 若 `get_sources` 无法核实真实来源 → 视为该路失败，停下报告

**路 B — anysearch（开源 skill）**：
- 通用+垂直域搜索+批量并行，真实联网，无需 MCP 服务器
- 可选 API key 提升速率限制；匿名访问可用

**互证规则**：
- 两路结论不一致 → 以可核实真来源的一路为准并登记分歧
- 任一路返回空内容、报错、或无法核实来源 → 当场停下并向用户报告具体哪路缺、缺什么，**不得继续**，不得用执行者自身记忆替代
- 两路都不可用 → 停下报告，不假装完成

产出 `make-decision-background-research.md`，含 4 锚点：`## 内部多维发现`、`## 外部检索来源`、`## 原始需求向下游传递`、`## 两问回答（问题是什么/方向是什么）`。

追加 journal `skill_called`（skill=make-decision-background-research）。

---

### S4：方向设计 + talk#2 收敛（6 维方向确认，方向基线确认衔接点）

基于 S1-S3 产出，用 `talk-with-zhipeng` skill 做第二次 talk，把方向问清楚。最少覆盖六个维度，按问题影响力加权排序（高影响问题先问，每答后重排剩余问题顺序）：

| 维度 | 核心问题 |
|------|---------|
| 问题 | 用户真正想解决什么？（"什么东西坏了/不够好"，不是"想要什么功能"） |
| 用户 | 谁会用到？什么场景下用？ |
| 现状 | 现在怎么解决的？痛点具体是什么？ |
| 最小切口 | 能独立交付的最窄版本是什么？砍掉什么还能解决问题？ |
| 未来适配 | 做完后可能往哪个方向扩展？会不会堵死未来的路？ |
| 风险 | 做这件事最大的不确定性是什么？ |

**方向基线确认**：
1. 方向基线一句话：「改什么、为什么改」
2. 有效发现总结（标注对方向的影响，索引式，不重抄调研文件）
3. **等待用户确认**：未确认则挡住，不允许进入 S5

**落盘原始需求存档（early write，供 framing 读取）**：确认后把用户原始需求/聊天原文落盘为 `make-decision-original-context.md`（不含任何拟定方向）。它是后续 framing-challenge 和方向审查的原始需求权威源，**必须在 framing 之前就位**——framing 在其落盘前不得派发。原始需求台账随 context 同步更新状态。

产出原文保存到 `artifacts/make-decision-consultation.md`。调用完成后追加 journal `skill_called`（skill=talk-with-zhipeng, round=2）。S4 不可跳过，没有其原始输出不得进入 S5。

---

### S5：三角度并行盲审 + 第一次 debate 门控

**前置目的**：方向/框架/范围都没站住前，不让主 agent 钻进实现细节。

三个角度统一走 3rd-review 链（默认异源，非同源降级），各自独立 checkpoint 落盘，各轮独立 reviewer-runtime-id + 独立轮次：

**角度 1 — 方向盲审（intake-direction-review）**：
- 输入：原始需求基线 + 拟定方向（`make-decision-original-context.md` + decision-log 草稿中的拟定方向）
- 禁止包含 framing 审查结论
- 判方向合理性与遗漏

**角度 2 — 框架挑战（intake-framing-challenge）**：
- 输入：**只读原始需求**（`make-decision-original-context.md`），**明文禁止包含任何拟定方向**
- 真盲审，判框架是否站得住
- 这是三角度中输入隔离最严的一路

**角度 3 — 范围盲审（intake-scope-review）**：
- 输入：原始需求 + 四维结论（来自 S4 talk#2），不含 framing/direction 中间结论
- 判范围合理性

**输入隔离硬约束（FR-INTAKE-003）**：
- framing-challenge：只喂原始需求，禁含拟定方向（违规示例：把 framing 审查结论塞进方向盲审 → 前置结论污染后续角度，破坏独立性）
- 三个角度各自从原始材料独立构造输入，结论在汇总时才合并

**并发与补跑规则**：
- 固定并行三轮，无降级阶梯
- 某轮结果不完整（exit ≠ 0）→ 并行内补跑，不退回串行
- 某轮执行失败（adapter 错误）→ 输出「执行失败」，不阻断其他轮，等待重试

**台账渲染点（grill/细节追问前，D28）**：进 grill 前先逐条渲染原始需求台账（已覆盖/待处理/已丢弃带理由），让用户看清哪些已覆盖、哪些还没考虑到，再钉细节。

**第一次 debate 门控**：
- 触发门槛：方向/框架/范围三轮盲审，blocking finding 数 >2 或存在方向级分歧 → 触发 debate
- 不触发：三轮均无 blocking finding（或 ≤2 且无方向级分歧）→ 直接进入 S6，不触发

**debate 运作要点**：
- debate 走 `/Users/Hugh/Hugh/Project/debate` 外部 skill（照搬依赖）
- debate 不只收敛冲突：丙/丁组产新想法，新想法按 D15 回退判定规则处理
- **红线**：禁止在审查前自造争点触发辩论（仅当前序独立审查产出了真实的方向级分歧才触发）
- debate 裁决结果作为最终判断进入 decision-log 草稿

三个角度完成后，各追加 journal `skill_called` 事件。

---

### S6：给用户看盲审 + debate 结果

盲审（含 debate 裁决，如有触发）完成后，向用户输出结果摘要：

- 三角度各自 verdict（pass / revise_required / escalate_to_human）
- debate 触发与否及裁决摘要（如触发）
- 台账当前状态（已覆盖/待处理/已丢弃带理由）
- 需要用户关注的 blocking finding（如有）

---

### S7：talk#3 → grill → decision-log 草稿 → 审查编排 + 第二次 debate 门控

本步是一条串行流水线，按顺序执行四个子环节：

**S7a — talk#3**：基于 S5-S6 盲审结果，与用户做第三次 talk。目的是把盲审发现的疑问点逐一澄清，为 grill 的逐层追问收窄范围。调用完成后追加 journal `skill_called`（skill=talk-with-zhipeng, round=3）。

**S7b — grill-with-docs-lite 钉细节（框架挑战通过后执行）**：用 `grill-with-docs-lite` 做逐层追问，直到决策树全明确。追问覆盖：产品边界、技术路径、约束条件、反模式检查、验收标准、上游风险预判。

退出条件（三条全满足才退出）：
- 连续 3 个追问用户都能给出明确、不矛盾的回答
- 主 agent 能用自己的话完整复述「做了什么、为什么这样做、不做什么、怎么验证」这四件事
- 不允许在还有模糊点的情况下结束本步

产出原文保存到 `artifacts/make-decision-grill-with-docs.md`。完成后追加 journal `skill_called`（skill=grill-with-docs-lite）。

**S7c — decision-log 草稿（grill 后、审查前，不落盘，附版本锚点）**：从前面各步的原始输出中提取关键决策，生成 decision-log 草稿（**不落盘**）。草稿在审查之前生成，使方向漂移/细节审查有逐条核验的对象。

草稿必须包含 7 节骨架：
1. **原始需求（原文）** — 所有轮次用户批准/拍板原文，逐字保留
2. **问题与目标** — talk 系列提炼：问题、用户、现状、最小切口、风险
3. **决策记录** — 每条七字段：决策内容 / 理由 / 备选项 / 来源类型 / 来源证据 / 用户批准 / 批准证据。`来源类型` 三选一：原文要求 | 衍生 | 新增
4. **假设** — [ASSUMPTION] 标记的推断项
5. **明确不做** — 非目标 + out-of-scope
6. **开放问题** — 还没定的
7. **验收标准** — 可测的成功信号，大白话

版本锚点：草稿 frontmatter 必须包含 `version: draft`（落盘后替换为当前 git commit hash）。`来源类型=新增` 且 `用户批准=否` 的决策只能留在「开放问题」或「明确不做」节。

**S7d — 审查编排 intake-review-orchestrator + 第二次 debate 门控**：调用 `intake-review-orchestrator` skill，审查对象 = S7c 生成的 decision-log 草稿。

framing-challenge 已在 S5 前置跑过，本步不重复跑，只执行漂移/盲点/细节三类审查：

1. **方向轮·漂移对照（必跑）**：拿「原始需求基线 + decision-log 草稿中的拟定方向」逐条对照，标出哪条需求没被覆盖/被曲解
2. **盲点轮（按信号追加）**：漂移对照发现明显遗漏或隐藏前提时追加
3. **细节轮（按信号追加）**：前轮发现涉及边界和验收细节时追加

orchestrator 做 debate 评估时，必须读回 S5 前置 framing-challenge 的落盘结果；framing 的方向级 blocking 优先列入，不被漂移对照「覆盖良好」压制。

**第二次 debate 门控**：
- intake-review-orchestrator 产出 `severity:blocking` finding → 触发第二次 debate
- 无 blocking finding → 不触发

**防漏阀留痕（格式固定）**：审查中出现 blocking 级反对 → 必须留痕，格式：
```
反对 X：<反对的具体内容>
决定 Y：<用户最终决定>
理由 Z：<决定的理由>
```
不阻断流程，但留痕必须完整可追溯。未留痕 → decision-log 不得标「落盘完整」。

**台账渲染点②（辩论收敛后，D28）**：debate/审查裁决收敛后逐条渲染原始需求台账；任一环节把某条需求判为丢弃，必须在台账登记驳回理由。

调用完成后追加 journal `skill_called`（skill=intake-review-orchestrator）。

---

### S8：同步 CONTEXT 和 ADR

各步（含审查）完成后，检查并更新项目文档：

1. **检查 CONTEXT.md**：如不存在但有值得记录的上下文（新术语、澄清的边界、修正的假设）→ 创建；已存在 → 检查是否需要新增/修正术语、概念、边界定义
2. **判断是否需要 ADR**：scope-triage / talk 系列 / framing-challenge / grill / intake-review-orchestrator 中是否产生了设计决策（技术选型、架构取舍、明确不做的方向）→ 写入 `specs/<feature>/decisions/` 或项目级 ADR
3. **检查 project-memory.md**：是否发现可迁移的经验或反模式 → 更新

---

### S9：方向确认 hard gate（唯一 hard gate，用户明确批准）

输出方向确认让用户批准（格式如下）：

```
## 方向确认
### 原始需求摘要
<100 字内，用户视角的问题>
### 拟设计方案 vs 解决的具体问题
| 方案 | 解决什么问题 | 原始需求有明确说吗？ |
|------|------------|------------------|
| <feature A> | <问题描述> | ✅ 原始需求明确要求 |
| <feature B> | <问题描述> | ❌ 从上下文衍生 |
### 本次不做的方向
<1-3 条明确不做的>
### 原始需求台账逐条核对（D28）
逐条渲染台账：每条标 已覆盖 / 待处理 / 已丢弃；已丢弃必须带理由，无理由挡住本步批准。
### 验收标准摘要
<3-5 条，大白话，用户能判断"做对了">
```

**要求**：
- 每个方案必须标注「原始需求明确要求」或「从上下文衍生」
- 附上 decision-log 草稿全文，让用户一并审查来源类型是否准确
- 存在「从上下文衍生」的方案时，必须额外追问用户：「这个方案对吗？还是我们理解偏了？」
- 用户必须明确说「同意」才能进入 S10；「继续」「好的」「看起来可以」不算确认，必须继续追问直到拿到明确批准

---

### S10：落盘 decision-log（用户批准后，落盘失败即停）

用户在 S9 明确批准后，调用 `decision-log` skill 将草稿写入 `artifacts/decision-log.md`。

**落盘失败即停**：调用失败或写入文件校验不通过，必须立即停止并输出错误，不允许降级或绕过。

**版本锚点硬关卡**：落盘后的 `decision-log.md` 必须包含 frontmatter `version: <current-git-commit>`。

追加 journal `skill_called`（skill=decision-log）。落盘后 decision-log.md 成为后续所有阶段的**唯一原始需求权威源**。

---

## 横切质量机制

以下机制贯穿全流程，除标注外均为**记录态非 blocking**：

| 机制 | 说明 | 性质 |
|------|------|------|
| 原始需求台账 D28 | 逐条 已覆盖/待处理/已丢弃带理由，无静默踢出，丢弃必须有理由，全程渲染 | 记录态（丢弃无理由时有强制阻断力） |
| 方向基线确认 | S4 talk#2 后、S5 盲审前，挡住未确认的流程推进 | 记录态（未确认挡住流程，但不是 machine gate） |
| 三角度输入隔离 | framing 只喂原始需求禁含拟定方向；三路各自独立构造输入 | 记录态（违规即破坏独立性，审查员检查） |
| 防漏阀留痕（反对X决定Y理由Z） | blocking 级反对必须留痕，未留痕 decision-log 不得标落盘完整 | 记录态（缺失阻断落盘标记） |
| 新想法回退判定 D15 | 动摇当前方向的新想法 → 判回退点→大白话告知→确认后重跑；被取代方向按「已丢弃带理由」登记台账，不静默删除 | 记录态（需用户确认回退判定） |
| 双路返空即停 | muyu/anysearch 任一路返空/不可用即停下报告，不用自身记忆替代 | 记录态（停下等人处理） |
| 交互简洁硬约束 | 一次只问一个问题 + ≤4 选项 + 大白话（每选项≤15字，禁止术语堆砌） | 记录态（审查员检查，不做自动 gate） |
| 唯一 hard gate | S9 用户明确批准「同意」 | **硬性 blocking**（唯一机器强制门控） |

---

## 步骤顺序总览

```
S0    背景扎根（project-memory/ADR/decision-log/代码/conversation history + 产出完整性自检）
S0.5  scope-triage + 建原始需求台账 D28（全档必调，低风险可跳 S1-S5 盲审部分）
S1    内部调研（≥3 子代理，五类：问题/根因/风险/方向/扩展）              [full 档]
S2    talk#1（基于内部调研，聊外部调研是否需要 + 调研方向）               [full 档]
S3    外部双路调研（CONDITIONAL—由 S2 决定；muyu + anysearch 双路互证）  [full 档，条件触发]
S4    方向设计 + talk#2 六维方向确认 + 方向基线确认 + 落盘 make-decision-original-context.md
S5    三角度并行盲审（方向/框架/范围，输入隔离）+ 第一次 debate 门控      [full 档]
S6    给用户看盲审/debate 结果
S7    talk#3 → grill-with-docs-lite → decision-log 草稿（7节，不落盘）
      → intake-review-orchestrator（漂移/盲点/细节）+ 第二次 debate 门控
S8    同步 CONTEXT / ADR / project-memory
S9    方向确认 hard gate（唯一强制门控，用户明确批准「同意」，台账逐条核对）
S10   落盘 decision-log
```

---

## Required Skills 映射

| skill | 步骤 | 档位 | 来源分类 |
|-------|------|------|---------|
| scope-triage | S0.5 | 所有档 | workflowhub 已有 |
| talk-with-zhipeng (round=1) | S2 | full 档 | 基于 gstack office-hours + superpowers brainstorming 优化，新增问题权重自研 |
| make-decision-background-research (muyu+anysearch) | S3 | full 档，条件触发 | muyu 照搬接入（须修参数坑）+ anysearch 照搬开源 |
| talk-with-zhipeng (round=2) | S4 | 所有档 | 同上 |
| intake-direction-review（3rd-review 异源） | S5 | full 档 | 3rd-review 异源，默认异源非同源降级 |
| intake-framing-challenge（3rd-review 异源） | S5 | full 档 | 3rd-review 异源，输入隔离最严 |
| intake-scope-review（3rd-review 异源） | S5 | full 档 | 3rd-review 异源 |
| debate | S5/S7 | full 档（条件触发） | 外部 repo 照搬依赖 |
| talk-with-zhipeng (round=3) | S7a | full 档 | 同上 |
| grill-with-docs-lite | S7b | full 档 | OMC grill-with-docs 薄壳优化 |
| intake-review-orchestrator | S7d | full 档 | 漂移/盲点/细节三轮 |
| decision-log | S10 | 所有档 | workflowhub 已有 |
