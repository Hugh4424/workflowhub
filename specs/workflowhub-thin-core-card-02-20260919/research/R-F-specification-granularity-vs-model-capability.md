# R-F：规格的「规定程度」（prescriptive vs declarative）与模型能力演进

> **决策问题**：phase 文档该写 A 执行手册式（每步写死读什么/改什么/判据/禁止项），还是 B 目标式（只写要达成什么 + 验收），还是 C 混合三层？决策者担忧：「模型一直在快速发展，基于执行手册式的写法，过段时间会不会落伍？」
>
> **方法**：一手来源优先（厂商官方文档、官方 changelog、原始论文）。每条论断标注 **[★证据]**（有量化实验、官方可复现声明或可查证的官方 changelog/设计文档）或 **[○经验/观点]**（社区实践、专家访谈、无对照实验）。矛盾证据单列一节（§9），不强行调和。
>
> **调研日期**：2026-09-20。工具：`web_search` / `anysearch_search`（general、academic.search）/ `web_fetch`。与 R-A（SDD 框架）、R-B（为弱模型写可执行规格）互补：R-B 已覆盖「歧义代价」「测试即规格」「Agentless 结构收益」，本报告**不重复**，只补 R-B 未覆盖的「能力↑时规格该降到多细」这一维度。

---

## 0. 结论速览（TL;DR）

1. **[★证据]** 「过度规格化会惩罚强模型」这个说法**在受控实验中找不到直接支持**：DETAIL 研究（30 任务 × GPT-4/o3-mini × 4 种提示策略）中，细节度从 Level-1 升到 Level-3，所有模型、所有策略的准确率**单调上升**，GPT-4 也不例外（0.60→0.83 baseline、0.72→0.90 CoT）。没有出现「越细越差」的拐点（[DETAIL, arXiv:2512.02246](https://arxiv.org/abs/2512.02246)）。
2. **[★证据]** 真正的「代价」是**收益递减 + 结构性错配**，不是线性伤害：强模型对细节度的**敏感度更低**（GPT-4 在最粗提示下仍有 0.60，o3-mini 只有 0.34），而且任务类型决定细节度收益——数学 +0.47、逻辑 +0.36、代码理解 +0.29，但**常识 +0.08、决策类 +0.02（且「有时略微伤害」）**（同上）。→ 危险不在「写细」，在「对不该写细的任务写细」。
3. **[★证据]** 有**一手、可查证的「旧步骤式指令在新模型上变负收益」案例**，来自 OpenAI 官方 cookbook 收录的 Cursor 工程记录：一段在旧模型上有效的 `<maximize_context_understanding>`「要极度彻底地收集上下文」指令，在 GPT-5 上**反而导致小任务过度调用搜索工具**（模型本来就已经足够自省和主动），团队必须收回该前缀并软化措辞（[GPT-5 prompting guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide)）。这是「规格债」最硬的工业证据。
4. **[★证据]** 官方对能力分层的表述高度一致：OpenAI 把 o 系列叫「规划者（the planners）」、把 GPT 系列叫「干活的（the workhorses，junior coworker）」；对推理模型明确「保持提示简单直接」「避免 CoT 提示」，「think step by step」**可能无益甚至有害**；但同一页也要求「提供明确约束」「把最终目标写得非常具体」（[OpenAI reasoning best practices](https://developers.openai.com/api/docs/guides/reasoning-best-practices)）。→ 官方推荐的不是「少写」，而是**少写路径、多写目标与约束**。
5. **[★证据]** Anthropic 给出了「正确高度（right altitude）」的官方定义：一端是**脆弱、把复杂逻辑硬编码进提示**，另一端是**太笼统、假装有共享上下文**；坏消息是前者「造成脆弱性并随时间增加维护复杂度」，并明确「**更聪明的模型需要的指令工程更少**，agent 可以更自主」，方向是「让智能模型智能地行动，人为策展逐步减少」（[Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)）。
6. **[★证据]** 三层结构**已经被业界提出并命名**：Tessl 的「spec-assisted / spec-driven / spec-centric」三层承诺度模型，以及其 `.impl`（implementation detail）标记机制——实现细节被显式降级为「尽量保留但不压倒规格，规格更新可覆盖它」；同场 Don Syme（GitHub）的结论是「**没有任何一种编码场景，是高层声明式指引 + 护栏 + 边界 + 成功条件不带来帮助的**」（[Tessl: Taming AI agents with specs](https://tessl.io/blog/taming-agents-with-specifications-what-the-experts-say/)）。
7. **[★证据]** 契约与实现的分层在官方文档层面落地：GitHub Spec Kit 于 2026-09 立项并合并「Contract-Driven Development」指南，明确 **产品需求 = 意图行为；接口契约 = 组件间协作方式；每个组件只拥有自己的实现规格与计划，不得复制别的组件的实现计划**；契约由暴露方单方拥有权威版本、消费者参与协商（[spec-kit#4609 / #4616](https://github.com/github/spec-kit/issues/4609)）。
8. **[★证据]** 「规格债务（specification debt / specification overfitting）」在 2026 年成为**学术议题**：Sirqueira & Faciroli 提出「规格悖论」——AI 越能自动生成软件，对正确、完整、可验证、可解释的**人类产出规格**的依赖越大；并点名 risk：automation bias、ambiguity propagation、**Specification Overfitting**、Specification Debt 累积（[arXiv:2608.16618](https://arxiv.org/abs/2608.16618)）。Storey 的「三重债务模型」把 intent debt（外化意图与理由的缺失）与 cognitive debt 并列为 AI 时代的主要风险（[arXiv:2603.22106](https://arxiv.org/abs/2603.22106)）。
9. **[★证据]** 官方对「什么时候必须写死、什么时候给目标」给出了可操作判据：OpenAI 明确要求**区分工具的风险阈值**——「结账和支付工具应有更低的（要求澄清的）不确定性阈值，搜索工具可以极高」；「编码场景里删除文件工具的门槛应远低于 grep」（[GPT-5 prompting guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide)）。这正是「不可逆写死 / 可逆放开」的官方版本。
10. **[○经验]** 「规格应该过期」已有工程共识但缺同行评审证据：「一旦接口、测试、不变量落成，详细的 build plan 就应该开始消失」；「过时的规格比没有规格更糟，它每一轮都主动把 AI 带向错误方向」；「不要写文件/函数级，写模式级」（[Stack Overflow / O'Reilly dispatch, 2026-08-21](https://stackoverflow.blog/2026/08/21/dispatches-from-o-reilly-the-right-amount-of-spec-for-agentic-development/)、[Aviator, 2026-04-09](https://www.aviator.co/blog/tackling-technical-debt-with-spec-driven-ai/)）。
11. **[★证据·关键缺口]** **没有找到任何主流框架官方声称「步骤级指令是给弱模型的过渡方案」**。逐版本核对 spec-kit CHANGELOG（0.11→1.0.8，2026-06→2026-09，共 2,927 行）只看到模板层面的**一致性/可配置性**改动，没有「因模型变强而简化模板」的声明；Kiro changelog 体现的是**相反方向的能力扩张**（长时自主运行、任务并行波次、可切换底层 harness）。→ 决策者担心的「落伍」在**官方声明层面尚无背书**，但在**厂商最佳实践层面已有明确方向**（见发现 4、5）。

---

## 1. Q1｜过度规格化的代价：存在吗？多大？

### 1.1 受控实验给出的答案：没有「越细越差」的拐点

DETAIL（[arXiv:2512.02246](https://arxiv.org/abs/2512.02246)）是本次调研中**唯一一个把「细节度」当自变量、把「模型能力」当分组变量**的受控实验。设计：30 个新造推理任务（数学、逻辑、常识、代码理解、决策），用 GPT-4 把详细版逐步泛化出 3 个细节度（L3 详细 124 token / L1 模糊 57 token），4 种提示策略，2 个模型。

| 模型 / 策略 | 模糊 L1 | 中等 L2 | 详细 L3 |
|---|---|---|---|
| GPT-4 Baseline | 0.60 | 0.70 | **0.83** |
| GPT-4 CoT | 0.72 | 0.81 | **0.90** |
| o3-mini Baseline | 0.34 | 0.51 | **0.68** |
| o3-mini CoT | 0.45 | 0.62 | **0.78** |

**[★证据]** 读法有三条：
- **单调不减**：没有任何一格是「强模型 + 详细 = 变差」。所以「over-specification penalty」在**过程性任务**上不成立。
- **敏感度不对称**：GPT-4 在 L1 就能拿 0.60，o3-mini 只有 0.34；论文原话是 GPT-4「能够通过自主推理内部补偿欠规格」，o3-mini「严重依赖显式外部结构」。→ **能力越强，细节度的边际价值越低**（这是坐标轴上的单调关系，见 §2）。
- **任务类型决定符号**：数学 +0.47、逻辑 +0.36、代码理解 +0.29、常识 +0.08、**决策类 +0.02（论文写明「在某些情况下，详细提示略微损害性能」）**。→ 对开放式/价值判断任务，「过度规格化会约束而非帮助模型推理」有**弱证据支持**。

**方法学警告（必须与数字一起引用）**：该论文是单作者预印本，30 个任务、3 个细节度、2 个模型，作者自陈「缺少消融、超参搜索与重复采样置信区间，结果应作**方向性**而非结论性解读」。不要把它当成定论。

### 1.2 真正有硬证据的三种「代价」（机制不同，不要混为一谈）

**(a) 矛盾/含糊指令的代价 — 最硬**
OpenAI 官方写明：「GPT-5 会以手术级精度遵循指令……**结构不良、包含矛盾或含糊指令的提示对 GPT-5 的伤害比其它模型更大**，因为它会消耗推理 token 去寻找调和矛盾的办法，而不是随机挑一条执行」。官方给了一个真实的医疗排程反例，列出 3 组互相冲突的指令，并说明「解决指令层级冲突后，GPT-5 引出更高效、更高性能的推理」（[GPT-5 prompting guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide)）。
→ **这是「执行手册式」最现实的伤害路径**：手册越长，写出互相冲突条目的概率越高；而**强模型是更容易被这种冲突拖死的一方**，不是更能容忍的一方。

**(b) 旧指令在新模型上反转 — 有工业实证**
Cursor（GPT-5 alpha 测试方）的官方记录：`<maximize_context_understanding>`「要 THOROUGH，回复前确保掌握 FULL picture」这段在旧模型上「worked well」，因为旧模型「需要被鼓励去彻底分析上下文」；在 GPT-5 上「**counterproductive**」——模型本就自省和主动，这段提示导致它在小任务上**反复调用搜索工具**，而内部知识本已足够。修法是移除 `maximize_` 前缀并软化措辞（同上，被 OpenAI 官方 cookbook 收录）。
→ **[★证据]** 这段是**方向性明确的「步骤式指令随能力上升转负」官方记录**，但它**不是对照实验**（无 A/B 数字），量级未知。

**(c) 上下文膨胀的代价 — 与规格粒度强相关**
Anthropic：上下文是有限注意力预算，应追求「**最小的**高信号 token 集合」；并提出「right altitude」的双失败模式（硬的 if-else 逻辑 vs 太笼统）。R-B 已收录 ETH Zurich 的量化结果（自动生成上下文文件平均 −3% 解决率、成本 +20%+；[arXiv:2602.11988](https://arxiv.org/abs/2602.11988)），此处不重复。
→ **[★证据]** 每多写一行步骤都在扣注意力预算；但这条只惩罚**低信号**的冗余，不惩罚**高信号**的细节。

### 1.3 「prompting is not all you need」类结论的正确引用方式

R-B 已核实：以该标题命名的论文（arXiv:2503.20749）研究的是 LLM agent 客户行为模拟，**与代码生成规格无关，不得引用**。本节中真正可引用的替代是：
- **[○经验]** 「你无法用更多文字修复一个错误的规格；规格本身需要被攻击性审查」（[Stack Overflow dispatch](https://stackoverflow.blog/2026/08/21/dispatches-from-o-reilly-the-right-amount-of-spec-for-agentic-development/)）。
- **[★证据]** GPT-5 的指令遵循特性使「矛盾指令」成为一等失败模式（见 1.2a）。

---

## 2. Q2｜能力 ↔ 最优粒度的关系曲线：单调还是倒 U？

**结论：现有证据支持「单调但递减」+「任务类型调制」，不支持「倒 U」。**

1. **[★证据] 单调递减的边际收益。** DETAIL 的模型内比较：GPT-4 从 L1→L3 涨 0.23（baseline），o3-mini 涨 0.34；换个读法，**达到同等准确率所需的细节度，强模型更低**（GPT-4 在 L2 的 0.70 已接近 o3-mini 在 L3 的 0.68）。PartialOrderEval（[IJCNLP-AACL 2025](https://aclanthology.org/2025.ijcnlp-long.128/)、[arXiv:2508.03678](https://arxiv.org/abs/2508.03678)）的补充结论同向：「**更大的模型以更少的提示细节达到更高准确率**」，且通用题（HumanEval）在很低细节度就饱和，领域专用题（ParEval）对细节高度敏感，三大驱动因素是**显式 I/O 规格、边界情况处理、显式分步拆解**。
2. **[★证据] 结构（scaffold）对弱模型的价值更大，且能缩小能力差距。** AgentSpec（UCSD/JHU/UW/UIUC，[arXiv:2606.14674](https://arxiv.org/abs/2606.14674)）在四个具身 benchmark 上：「Scaffolding narrows the backbone gap」——匹配良好的模块化配置让小模型逼近强模型；同一 backend 下换更结构化的 memory，ReAct 从 8.54 升到 30.67。→ **外部结构是弱模型的补偿品，是强模型的冗余品**。
3. **[○经验·官方方向]** Anthropic 明确：「我们已经看到**更聪明的模型需要更少的规定式工程（less prescriptive engineering）**，让 agent 以更多自主性运行」；「随着模型能力提升，agentic 设计将趋势性地让智能模型智能地行动，人为策展逐步减少」（[Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)）。同页给的操作顺序是：**先用最强模型测最小提示，然后只按实际失败模式往回加指令和例子**——这是「从少到多」的官方方法论，与「先写满手册」相反。
4. **倒 U 的候选证据及其弱点。** DETAIL 的决策类任务（+0.02，偶有负向）是唯一形似倒 U 的格子，但（i）幅度在噪声量级，（ii）论文自陈无置信区间，（iii）n=6 任务/类。**不能据此宣称普遍倒 U。**
5. **一个必须写清的替代解释。** 观察到的「强模型不需要细节」可能是**模型内化了细节生成**（它自己会补出 I/O 规格、边界、分解），而不是「细节本身有害」。这个区分对架构含义完全不同：如果是前者，你**删掉步骤不会损失正确率**（只是把工作转回模型）；如果是后者，你**保留步骤会让强模型变差**。目前证据支持前者为主、后者为少数情形（§1.2b）。

---

## 3. Q3｜同一份规格服务不同能力模型：三层结构存在吗？

**存在，且有三种不同形态的一手记录。**

### 3.1 形态一：Tessl 的承诺度三层 + `.impl` 降级标记 **[★证据]**

Guy Podjarny（Tessl CEO）提出的框架（[Tessl 专家访谈记录](https://tessl.io/blog/taming-agents-with-specifications-what-the-experts-say/)）：
- **spec-assisted**（基线）：`CLAUDE.md`、cursor rules、从 registry 取的 usage spec。「它只是帮助——供 agent 干活的信息」，是**指引不是福音**。
- **spec-driven**：承诺保持某部分功能被良好捕获；改动的第一动作是改规格，然后应用到代码。
- **spec-centric**（未来态）：代码可丢弃，规格含一切重要的细节 + 足够的测试引用。

更可操作的是**`.impl` 标记机制**：「有一些实现细节，我们用 `.impl` 标记表示它们是**低重要性**的部分。你应当尽量保留它们以求稳定，但它们**不压倒规格**。」举例：按钮红或绿，规格初期不管；一旦选定就为稳定性保留；但后续规格显式改绿时，**规格赢**。
→ 这直接回答决策者的担忧：**把「怎么做」写成可被覆盖的、有优先级的附注，而不是与目标同权重的正文**。规格更新时，`.impl` 层自动作废，不需要逐条清理。

同场 Don Syme（GitHub 首席研究员）的原则：**「今天没有任何一种编码场景，是高层声明式指引、护栏、边界与成功条件——checked into your repo 定义它是干什么的——不带来帮助的。」** Alan Pope 的做法是「spec 尽量 detail-lite，只写够把 agent 拉回轨道；写框架选择和 API 端点，避免过度规格」。Guy 的粒度判据是：**「太细，你不如直接写代码；太笼统，你失去护栏。」**

### 3.2 形态二：契约驱动开发（CDD）—— 官方落地的「硬约束层」 **[★证据]**

spec-kit issue #4609 / PR #4616（2026-09-16 立项并合并），是本次调研中**唯一一份把层职责写成官方文档的 SDD 框架**：
- **产品需求**：建立**意图行为**（intended behavior）。
- **接口契约**：建立**独立实现的组件如何协作**去交付该行为。契约定义「输入、输出、错误、可观察行为、相关交互与兼容性保证」，形式随接口而定，「schema 有用但不必然能表达全部行为义务」。
- **实现规格与计划**：**每个组件拥有自己的实现规格和计划，对着已达成一致的契约来写；不要复制另一个组件的实现计划。**
- 归属：**一方拥有权威契约**（通常是暴露接口的一方），消费者参与协商变更；同一仓库双方可引用同一定义；跨仓库消费者**钉住已发布版本**，且「不得静默跟随 latest」。
- 验证：provider 侧与 consumer 侧双向验证，「**消费者 mock 不能证明 provider 合规**，必须包含集成验证」。
- 明确区分「发布/合并契约」与「部署了支持它的实现」——**钉住的契约是协议，不是实现已部署的证明**。

→ 这就是「硬约束层」的权威定义：**契约是所有人必须遵守、且可独立验证的层**；实现计划是**可替换、不可跨组件复制**的层。对混合方案的直接启示：**phase 文档里的「改哪个文件、用什么数据结构」属于实现层，不应与验收条件同级，更不应被下游组件复制。**

### 3.3 形态三：官方 CHANGELOG / 提示结构里的事实分层 **[★证据/○经验]**

- **Anthropic**：系统提示「组织成不同 section（`<background_information>`、`<instructions>`、`## Tool guidance`、`## Output description`）」，并说「**随着模型更强，具体格式可能变得不那么重要**」（[context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)）。→ 层存在，但**格式的强制性应随能力下降**，这与三层结构互补：内容分层长期有效，格式强约束是易腐部分。
- **OpenAI GPT-5 cookbook**：给出 `<context_gathering>`（含**明确的 early-stop criteria**：能说出要改的确切内容、top hits 收敛到 ~70% 就停）与 `<persistence>`（提高自主性、不要问澄清）**两套互斥的旋钮**，并说明「如果你愿意最大化规定性，甚至可以设固定工具调用预算」。→ 官方版本就是**同一套层，按需要调松紧**。
- **Kiro**：specs 体系同时提供 **Feature Spec / Bugfix Spec / Quick Spec**（Quick Spec 一次性生成三件产物、无审批门），并支持把 `tasks.md` 解析成**依赖图 + 波次并行**执行；changelog 里长时自主运行能力持续加码（chat turn 上限提到 4 小时、subagent 3 小时、1000 次工具调用）（[kiro.dev/docs/specs](https://kiro.dev/docs/specs/)、[kiro.dev/changelog](https://kiro.dev/changelog/)）。→ **框架自己提供「按任务重量选择规格厚度」的档位**，这本身就是三层结构的产品化。

### 3.4 三层结构的最小可落地形态（综合以上，非任何单一来源的原文）

| 层 | 回答什么 | 谁读 | 可验证性 | 随能力变化的处置 |
|---|---|---|---|---|
| **L0 目标层** | 要达成什么、为什么、非目标 | 所有人 + 所有模型 | 不可机检，人读 | **永不删**（Don Syme 结论） |
| **L1 硬约束层（契约）** | 接口/类型/schema、不变量、错误与失败行为、兼容性、不可逆动作的确认门 | 所有人，模型不得裁量 | 可机检（类型、契约测试、lint）或可独立复核 | 只随接口变更而变更；**版本钉住** |
| **L2 参考步骤层** | 建议的读文件顺序、改动切入点、参考实现 | 弱模型照做；强模型可跳过 | 通常不可机检 | **带 `.impl` 式优先级 + 过期条件**；验收后收缩/删除 |

---

## 4. Q4｜框架演进证据：2024→2026 规格模板是否因模型变强而简化？

**这个问题的答案是「混合」的，必须区分三种证据强度。**

### 4.1 逐版本核对 spec-kit（最硬的一手证据）

**[★证据]** 拉取 `raw.githubusercontent.com/github/spec-kit/main/CHANGELOG.md`（2,927 行，截至 1.0.8 / 2026-09-17）并全量 grep 与 template/prescriptive/granular/detail/rigor/autonomy/file-path 相关的条目。结论：
- **没有**任何条目声明「因为模型变强，简化/移除步骤级指令」。**没有**任何条目把步骤级指令描述为「弱模型的过渡方案」。
- 存在的相关条目全部是**一致性与可配置性**方向：
  - `fix(tasks): require field constraints from data-model.md in generated tasks (#4430)`（1.0.5）——**在 tasks 里增加**来自数据模型的字段约束（方向是「更显式」，不是更少）。
  - `Bound speckit.clarify planning deferral to implementation details (#4507)`（1.0.7）——把 clarify 的「推迟决策」**限定在实现细节范围内**（方向是「把契约层写死，把实现层留白」，与三层结构一致）。
  - `refactor: remove OpenAPI/GraphQL bias from templates (#1652)`、`Cleanup agent-file-template.md (#2579)`、`Remove template version info from CLI (#2081)`、`docs: simplify README around three processes (#4591)`——**去偏见、去冗余**，不是去步骤。
  - 大量 `fix(presets)/feat(extensions)`：模板变成**可组合、可覆盖、可扩展**的对象（prepend/append/wrap 组合策略，#2133）。
- 结论：**spec-kit 没有走「简化模板」路线，而是走「分层 + 可配置 + 结构升级」路线**；其 2026-09 的 CDD 文档（§3.2）正是「把硬约束提炼成契约层」的官方动作。

### 4.2 Kiro

**[★证据]** changelog（截至 2026-09-16）显示的是**能力扩张**而非模板简化：Quick Spec 档位、任务依赖图与波次并行、长期自主运行（turn/timeout/turn 上限上调）、可切换 Claude Code / Codex / KAS 底层 harness、Cloud Configuration 复用。→ **Kiro 的方向是「让 agent 自主跑更久」，不是「把 spec 写得更细」**，这间接支持「框架把工作量从人工步骤转移到模型自主」。但它**没有**声称步骤级指令过时。

### 4.3 其它框架（证据较弱，明确标注）

- **[○经验]** Martin Fowler 站上的 Thoughtworks 评测（Birgitta Böckeler, 2025-10-15，[sdd-3-tools](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)）对 Kiro/spec-kit/Tessl 的实测结论偏负面：「小 bug 用 requirements→design→tasks 是**用大锤砸坚果**」（Kiro 把一个小 bug 变成 4 个用户故事 16 条验收条件）；spec-kit「创建了**大量 markdown 文件**，彼此重复、也与既有代码重复，读起来冗长乏味」；并且「即便有这么多文件、模板、提示、工作流、检查单，agent **最终仍然没有遵守所有指令**」——甚至出现「因为过度热切地遵循某条宪法条款而走过头」。她引用德语词 *Verschlimmbesserung*（越改越糟）质疑这类精细文档的实际收益。**这是 2025-10 的观察，两份工具其后都已迭代，引用时须标注时点。**
- **BMAD v6 / cc-sdd / agent-os**：本次检索到的 BMAD v6 相关材料多为二手博客（token 优化、web bundle 编译），**未能获得官方「因模型变强而简化 spec 模板」的 changelog 证据**；cc-sdd（gotalab）与 agent-os（buildermethods）的官方仓库/changelog **未在本次范围内取得可引用的设计变更声明**。→ **本项标记为「未验证」，不作为决策依据**（R-A 报告已覆盖这些框架的模板形态，请以 R-A 为准）。

### 4.4 对 Q4 的诚实回答

**没有框架官方写下「步骤级指令是给弱模型的过渡方案」。** 最接近的官方表述来自模型厂商而非框架厂商：
- Anthropic：「更聪明的模型需要更少的规定式工程」（§2）。
- OpenAI：o 系列是 planner、GPT 系列是 workhorse/junior coworker；对推理模型「保持提示简单直接」「避免 CoT 提示」（§5）。
→ 决策者担忧的「落伍」，在**框架官方声明层面无背书**，在**模型厂商最佳实践层面已有明确方向**。这个不对称本身就是一条决策信息：**框架的模板设计滞后于模型能力的最佳实践**。

---

## 5. Q5｜Anthropic / OpenAI / Google 官方对「给 agent 多少自主权」的最新建议

### 5.1 OpenAI **[★证据]**

- **能力分层与分工**：「我们训练 o 系列模型（『规划者』）去更长更深入地思考复杂任务……另一方面，我们更低延迟、更低成本的 GPT 模型（『干活的』）是为直接执行设计的。**一个应用可以用 o 系列规划策略，用 GPT 模型执行具体任务，尤其当速度与成本比完美准确率更重要时。**」（[reasoning best practices](https://developers.openai.com/api/docs/guides/reasoning-best-practices)）
- **提示原则（对推理模型）**：保持简单直接；**避免 CoT 提示**（「think step by step」「explain your reasoning」不必要）；用分隔符标注结构；**先试 zero-shot 再试 few-shot**；**提供明确约束**（例：「提出预算低于 $500 的方案」，必须显式写出）；**把最终目标写得非常具体**，并鼓励模型持续推理迭代直到满足成功判据。
- **什么时候写死、什么时候放开（最有价值的一条）**：GPT-5 cookbook 要求明确「停止条件、安全 vs 不安全动作、何时允许交回人类」，并给出**按工具风险设不同不确定性阈值**的官方例子：购物场景 checkout/payment 阈值低（要澄清），search 阈值极高；编码场景 **delete file 的阈值远低于 grep search**。
- **降低 eager 的手段有两类**：参数（`reasoning_effort`）与提示（`<context_gathering>` 的 early-stop criteria、工具预算），并提示「限制上下文收集时，**显式给模型一个 escape hatch**（如『即使不完全正确』），让它更容易满足更短的收集步」。
- **对推理模型的「少写」不等于「不写」**：SWE-Bench verified 的官方 system 指令其实是**高度规定性**的（指定 `apply_patch` 格式、禁止 ls -R/find/grep、要求 triple check、说明隐藏测试存在）。→ **官方对「脆弱可验证的执行接口」同样是写死的**，这与三层结构一致。

### 5.2 Anthropic **[★证据]**

- **workflow vs agent 的判据**：「workflows 是用**预定义代码路径**编排 LLM 与工具的系统；agents 是 LLM **动态决定**自己流程与工具使用的系统。」选择依据：「workflows 为**定义良好的任务**提供可预测性与一致性；agents 在需要**灵活性、需要模型驱动决策**时更好」；agents 适用于「**难以或无法预测所需步数、无法硬编码固定路径**的开放式问题」（[Building effective agents, 2024-12-19](https://www.anthropic.com/engineering/building-effective-agents)）。
- **不要预设框架**：「最成功的实现使用的是简单、可组合的模式而非复杂框架」；「只在明确改善结果时才增加复杂度」。
- **right altitude**（§1.2c）：硬编码复杂逻辑 → 脆弱 + 维护复杂度上升；太笼统 → 缺少具体信号。目标是「**最小**的、能完整勾画期望行为的信息集」，且「最小不一定等于短」。
- **方法论**：先用**最强模型**跑最小提示，观察失败模式，再**针对性**加指令和示例。
- **对「过期规格」的隐含支持**：把上下文按 **just-in-time** 检索（保留轻量标识符如路径、查询，运行时再取），而不是预先把全部细节塞进去；明确「运行时探索比检索预计算数据更慢，但避免了**陈旧索引**问题」。

### 5.3 Google **[★证据]**

- **确定性 vs 动态编排的分岔口**（[Choose a design pattern for your agentic AI system, reviewed 2026-05-28](https://docs.cloud.google.com/architecture/choose-design-pattern-agentic-ai-system)）：
  - **确定性工作流**（步骤事先已知、每次变化不大）→ 用 multi-agent sequential / parallel / iterative refinement，**这些 pattern「不需要模型编排」**。
  - **需要动态编排的工作流**（agent 必须自己决定怎么走，「without a script」）→ 用 single agent / coordinator / hierarchical decomposition / swarm。
- **明确写出硬编排的代价**：sequential pattern「效率的代价是灵活性：**僵化的预定义结构难以适应动态条件或跳过不必要的步骤**」。
- **也明确写出放开的代价**：coordinator「比僵化工作流更灵活，但依赖模型推理，模型调用更多、成本与延迟更高」；loop pattern 的主要风险是**无限循环**，必须精心设计退出条件。
- 注意：Google 这篇是**架构 pattern 选择**指南，**不是提示粒度指南**；把它当「官方支持目标式」是过度解读。它的正确用法是：**先判断任务落在确定性/动态哪一侧，再决定该侧的规格该多硬。**

### 5.4 三家的一致原则（本报告的综合）

> **把「目标 + 边界 + 成功判据 + 不可逆动作的确认门」写死；把「路径」交给模型，路径的写死程度是「你对该模型在该任务上自主性的信任度」的函数，而不是规格的美德。**
> 三家的证据强度不同：OpenAI 的 planner/workhorse 分工与工具阈值是**文档化的官方指引**（无对照实验数字）；Anthropic 的「less prescriptive engineering」是**官方观察陈述**；Google 的分类是**架构选择指南**，需谨慎外推。

---

## 6. Q6｜反证据：目标式对强模型是否也更好？手册式在哪些情况下主动造成伤害？

### 6.1 目标式对强模型更好的证据

| 证据 | 强度 | 内容 |
|---|---|---|
| **[★证据]** Cursor × GPT-5 | 官方工程记录，非对照实验 | 旧模型需要的「要极度彻底地收集上下文」在 GPT-5 上 counterproductive，导致过度工具调用；移除后模型在「依赖内部知识 vs 调用工具」上的判断更好 |
| **[★证据]** OpenAI GPT-5 指令遵循 | 官方声明 | **一致性差、矛盾的提示对强模型伤害更大**（它花推理 token 去调和）；「移除矛盾后，GPT-5 的性能大幅提升且更高效」 |
| **[★证据]** OpenAI 推理模型 | 官方声明 | 「think step by step」等 CoT 提示对推理模型**可能无益甚至有害** |
| **[★证据]** PartialOrderEval | 同行评审（IJCNLP-AACL 2025） | 更大的模型**以更少提示细节**达到更高准确率 |
| **[★证据]** AgentSpec | 预印本，具身域 | RL 训练过的策略在**事后加装的 scaffold**（结构化 memory）下**不升反降**（GRPO Base 5.80 → ReAct+MemoryBank 4.03）——scaffold 与策略的**接口兼容性**比 scaffold 强度更重要；作者结论是策略应与部署时的 scaffold 联合优化 |
| **[★证据]** DETAIL | 预印本，n 小 | 决策/价值类任务上细节度收益 +0.02，且「有时略微伤害」 |
| **[○经验]** Thoughtworks 评测 | 一手实践，单评价者 | 「很多 markdown 文件……最终 agent 并没有遵守所有指令」；「我宁愿 review 代码而不是这些 markdown 文件」；「skeptical that lots of up-front spec design is a good idea, especially when it's overly verbose」 |

### 6.2 手册式主动造成伤害的机制清单（可直接当 check-list）

1. **步骤过时 / 规格债**：**[○经验]**「过时的规格比没有规格更糟，它每一轮都主动把 AI 带向错误方向」（[Aviator](https://www.aviator.co/blog/tackling-technical-debt-with-spec-driven-ai/)）；**[★证据·弱]** 模型对 prefilled 的有缺陷推理链很脆弱：干净 RL 微调后对「含一个受控错误的 CoT 前缀」的鲁棒性**低于未微调基线**（19% vs 20%），因为「常规训练增加了对误导性 prefill 的易感性」（[arXiv:2512.17079](https://arxiv.org/abs/2512.17079)，Qwen3-4B、竞赛数学，域外但机制相关）。
2. **矛盾条目**：**[★证据]** 强模型对矛盾的耐受度**更低**（OpenAI 官方）。
3. **能力错配的指令**：**[★证据]** 旧模型需要的「更彻底」在新模型上成为噪声（Cursor）；**[★证据]** RL 后策略与事后 scaffold 不兼容（AgentSpec）。
4. **注意力预算挤占**：**[★证据]** 上下文有限、随长度退化（Anthropic context rot + R-B 的 Lost-in-the-Middle / Context Rot 条目）；手册越厚，真正要改的那一行越难被注意。
5. **僵化不能跳过**：**[★证据]** Google 官方指出 sequential pattern「难以适应动态条件或**跳过不必要的步骤**」，可能「造成低效处理或更高累计延迟」。
6. **「looks done」的假停止信号**：**[○经验]** 步骤式手册容易让模型以「我把每步都做了」为完成信号，而不是以「验收条件成立」为完成信号（R-B 已收录 Anthropic「给模型一个能跑的检查」的官方立场，此处只做机制归纳）。

### 6.3 反向：目标式主动造成伤害的情况

- **[★证据]** 规格歧义使 Code LLM Pass@1 下降 **35%–52%**，且**模型不会主动澄清**（60%+ 首次回答直接写代码；歧义点从 1 增到 3 时澄清命中率跌至接近 0）——见 R-B §2.1（HumanEvalComm, TOSEM 2025；ClarifyCodeBench 2026）。
- **[★证据]** 让 LLM 自己生成可执行规格很难（仓库级最好 20.2% 通过率，CodeSpecBench 2026）→ **规格必须由强的一方写**（R-B §13–14）。
- **[★证据]** 弱模型在目标式下损失最大：o3-mini 在最粗提示下只有 0.34（DETAIL）。
- **[★证据]** 对**高确定性、可测试**的工作，规格越硬越省钱：「对确定性工作（CRUD、API 集成、数据转换），最优解右移——容易约束、容易测试，更多规格很快就回本，因为减少重复 review 与返工」（[Stack Overflow dispatch](https://stackoverflow.blog/2026/08/21/dispatches-from-o-reilly-the-right-amount-of-spec-for-agentic-development/)）。

---

## 7. Q7｜可验证的中间路线：判据表（本体裁为综合，每条挂一手来源）

**总原则**（Don Syme 的结论，[Tessl](https://tessl.io/blog/taming-agents-with-specifications-what-the-experts-say/)）：**声明式指引 + 护栏 + 边界 + 成功条件，在所有场景都有帮助；步骤是可选加速器。**

### 7.1 逐决策判据（可直接贴进 phase 文档的写作规范）

| 维度 | **写死（进 L1 硬约束层）** | **留给模型（进 L2 参考层或根本不写）** | 一手依据 |
|---|---|---|---|
| **可逆性** | 不可逆/高影响动作：删除文件、支付、checkout、数据库写、发布、越权。必须写**低不确定性阈值**（先澄清/先确认） | 可逆、只读、可重试：grep、搜索、读文件、dry-run。写**高阈值**，鼓励放手做 | OpenAI GPT-5 cookbook 的支付/搜索、delete/grep 阈值对比 **[★]** |
| **接口 vs 实现** | 输入输出、类型、schema、错误与失败行为、可观察行为、兼容性保证 | 内部数据结构、算法选择、私有函数拆分、文件内组织 | spec-kit CDD #4609 **[★]**；Tessl `.impl` 与「vector 还是 array 有时可互换、有时因数据规模而重要」 **[★/○]** |
| **确定 vs 探索** | 确定性工作（CRUD、API 集成、数据转换、迁移）：最优解右移，写细 | 探索性工作（架构选项、研究综合、新想法）：最优解左移，**只写边界不写结果**（必须为真、必须不为真、需要什么证据、哪些决策留给人） | Stack Overflow dispatch 的四分法 **[○]**；Google 确定性 vs 动态编排 **[★]**；Anthropic workflow vs agent 判据 **[★]** |
| **可验证性** | 凡能变成**可执行检查**的（命令、断言、契约测试、property-based test）：必须写，且是最高优先级 | 无法机检的偏好（风格倾向、命名口味）：写成 canonical example，不写成规则清单 | Anthropic「给模型一个能跑的检查」+「策划 diverse canonical examples，反对堆 edge case 清单」 **[★]**；R-B §6 |
| **模型能力** | 弱执行模型：把「怎么找、怎么改、怎么验」全部前移到 L2（Agentless 固定三段流水线在 $0.70/实例达 32.00% 支持这一点） | 强执行模型：跳过 L2，只读 L0+L1；把 L2 当「上一位工程师的笔记」而非命令 | Anthropic less prescriptive **[★/○]**；DETAIL/PartialOrderEval **[★]** |
| **时效** | 契约、不变量、业务理由、非目标、外部契约：**永不删**（Don Syme 的结论） | 详细 build plan、当前类结构描述、三周前的生成计划：**验收后应立即收缩/删除**；否则「模型不是在读一份规格，而是在对互相竞争的真相源做平均」 | Stack Overflow dispatch「spec 应该有保质期」 **[○]**；Aviator「outdated spec worse than no spec」 **[○]** |
| **所有权** | 契约的权威版本**单方拥有**，变更需消费者协商；跨仓**钉版本**，禁止静默跟 latest | 各组件自己的实现计划，**不得跨组件复制** | spec-kit CDD #4609 **[★]** |
| **风险不对称** | 失败**不可观测**或**昂贵**的步骤：写死 | 失败可迅速观测并由下一轮修复的步骤：放开 | OpenAI 工具阈值原则的直接外推 **[★→○]** |

### 7.2 L2 参考步骤层的写法规范（把「手册」变成「可作废的附注」）

综合 §3.1 的 `.impl` 机制与 §7.1 的时效维度，建议：

1. **显式声明优先级**：文档头部写一行「**L2 为参考实现建议；当 L0/L1 或代码现状与之冲突时，以 L0/L1 和代码为准**。L2 不构成验收条件。」
2. **每条参考步骤带过期条件**：例如「若 `src/auth/` 已迁至 `packages/auth/` 则本条作废」。→ 把「规格债」变成**可被机器/人快速判定作废的**，而不是需要逐条维护的。
3. **每步 ≤6 行是合理的**，但要保证 6 行里**至少一行是可验证判据**（否则这一步只是叙述）。这与 R-B 的「每条验收 = 一条命令或一个断言」同源。
4. **不写「当前代码长什么样」的描述性文字**（那是代码的冗余副本，必然过期）；只写**「要出现的最终形态」+「不许出现的形态」**。→ 对应 Stack Overflow dispatch 的「代码不擅长表达的东西才值得留在规格里：业务理由、非目标、安全约束、外部契约、少数不变量」。
5. **写好「判据的判据」**：Anthropic 的「right altitude」要求规定「灵活到能给模型强启发式，具体到能有效引导」。操作化：每条硬约束问一句「**违反它时，我能给出一个失败命令吗？**」不能 → 它其实是建议，移到 L2。

---

## 8. Q8｜时间维度：12 个月后执行手册式会变成负担吗？「规格债」有人讨论吗？

### 8.1 「规格债」已有正式的学术命名与框架

- **[★证据]** **规格悖论（Specification Paradox）**：Sirqueira & Faciroli（2026-08-17）主张，AI 减少写代码的力气，但把复杂度转移到领域理解、需求获取、规格开发、验证、维护与演化；并明确列出风险：automation bias、**ambiguity propagation**、**Specification Overfitting**、**Specification Debt 的累积**。其结论对本题最直接：**「AI 系统越有能力自动生成软件，就越依赖正确、完整、可验证、可解释的、人类产出的规格。」**（[arXiv:2608.16618](https://arxiv.org/abs/2608.16618)）
  - 注意其性质：**立场/讨论论文，不是对照实验**。它提供的是风险命名与议题设定，不含量化。
- **[★证据]** **三重债务模型**：Storey（2026-03，v4）提出 technical debt（代码）/ cognitive debt（人）/ **intent debt**（外化的理由、目标、约束的缺失或侵蚀）。intent debt 的定义几乎就是「规格层该保留什么」的学术版本：「指导人类与 agent 如何演化系统的显式理由、目标与约束的缺失」。（[arXiv:2603.22106](https://arxiv.org/abs/2603.22106)）
- **[○经验]** 工程侧同向共识：Aviator（2026-04）把「outdated or stale specs」列为最常见陷阱之一：「过时的规格比没有规格还糟，它每一轮都主动把 AI 带向错误方向」，并主张「**在同一个 PR 里更新或关闭**被重构/迁移淘汰的规则」、「写模式级而不是文件/函数级」、「specs 需要 ownership model、review rhythm 和 value assessment」（[Aviator](https://www.aviator.co/blog/tackling-technical-debt-with-spec-driven-ai/)）。

### 8.2 12 个月推演：哪些部分会变成负担，哪些不会

**会变成负担的（应现在就设计成可作废）：**
- **描述性文字**（「当前 X 类有 3 个方法」）——与代码冗余，代码一动即过期。
- **能力补偿型指令**（「你必须彻底搜索」「think step by step」「先列出所有相关文件」）——**已有 Cursor×GPT-5 的实证反转**（§1.2b），这是最可能在 12 个月内变成噪声的一类。
- **文件级/函数级锚点**（「改 `foo.py` 第 42 行附近」）——重构即失效，且会诱发「盲从错误步骤」。
- **格式性约束**（「用 XML 标签包住」「必须用这个标题层级」）——Anthropic 已明示「具体格式随着模型更强可能变得不那么重要」。
- **不可执行的「宏观原则」堆砌**——R-B 已收录 ETH 的 −3%/+20% 成本结论。

**不太会变成负担的（可长期保留）：**
- **业务理由与非目标**（代码无法自证的那部分，也就是 intent debt 的反面）。
- **外部契约与不变量**、错误与失败语义。
- **可执行验收条件**（测试、命令、断言）——它随模型变强**只会更划算**（实现越便宜，可执行的「正确性定义」越值钱；[Stack Overflow dispatch](https://stackoverflow.blog/2026/08/21/dispatches-from-o-reilly-the-right-amount-of-spec-for-agentic-development/)）。
- **安全/权限/不可逆动作的确认门**。

**量化推演（本报告自建，标注为推断）：** 按 DETAIL 的敏感度差（o3-mini 在 L1→L3 涨 0.34，GPT-4 涨 0.23，且强模型在 L1 的起点就高 0.26），若 12 个月后的执行模型在该任务族上接近今天强模型的表现，则**「删掉 L2 参考步骤」的预期正确率损失大致落在低个位数到十几个百分点区间，而「保留 L2」的成本是每步的 token 与注意力预算 + 过期即误导的风险**。这个估算**不构成精确预测**，只用于说明数量级：**L2 的收益会衰减，但不会瞬时归零；而它的风险是随时间累积的**。

---

## 9. 矛盾证据（不调和，单列）

1. **「细节度对强模型有害」vs「细节度对强模型有益」。**
   - 有害方证据：Cursor×GPT-5（旧指令 counterproductive，官方记录无对照数字）；DETAIL 决策类任务偶有负向（n 极小、无置信区间）；GPT-5 对矛盾提示更敏感（这是「矛盾」而非「详细」）。
   - 有益方证据：DETAIL 全模型全策略单调上升；PartialOrderEval 的显式 I/O/边界/分步三要素持续有效。
   - **无法调和的点**：两者测的不是同一个自变量。前者测「**冗余的、能力补偿型的**指令」（模型已具备的能力被重复叮嘱），后者测「**信息量的**细节」（I/O 规格、边界、分解）。→ 本报告的处理：把结论写成「**信息量细节有益；能力补偿型指令在能力达标后转负**」，并承认这个二分**目前只有间接证据**，尚无直接实验直接对比这两类细节。
2. **「框架因模型变强而简化」vs「框架在扩张」。**
   - spec-kit：模板层无简化声明，但**新增 CDD 契约层**（结构升级而非简化）。
   - Kiro：Quick Spec 档位（简化路径）与长时自主运行（扩张能力）并存。
   - **不能宣称任何一方赢**：证据支持的是「**分层 + 可选档位**」，不是「单向简化」。
3. **「框架提高规格质量」vs「框架造成评审过载」。**
   - 官方叙事（spec-kit、Kiro）：结构化 markdown 减少歧义、可追踪。
   - Thoughtworks 一手评测（2025-10）：文件过多、彼此重复、agent 仍不遵守、小任务用大锤。
   - **时点差异是真实存在的**：评测基于 2025-09 版本，两家此后均迭代；**不能用 2025-10 的评测否定 2026-09 的设计，也不能用官方 changelog 否定当时的一手体验**。本报告两者都保留。
4. **「规格应常驻」vs「规格应有保质期」。**
   - Storey 的 intent debt 与 Sirqueira 的规格悖论：**必须**有外部化的意图/理由/约束。
   - Stack Overflow dispatch 与 Aviator：**详细 build plan 应随代码落成而消失**，否则模型「在对互相竞争的真相源做平均」。
   - **调和的正确形式不是折中字数，而是分层**：L0/L1 常驻，L2 保质期短。这是本报告倾向 C 方案的核心理由。

---

## 10. 对架构决策的建议

### 10.1 倾向性建议：**选 C（混合三层），但不是「A 与 B 各取一半」，而是「B 为骨架 + A 降级为可作废的附注」**

具体形态（直接对应本仓库 phase 文档）：

- **L0 目标层（必写，永不删）**：一句话目标 + 业务理由 + 非目标。放在文档最前（lost-in-the-middle 规避，R-B 已证）。
- **L1 硬约束层（必写，可机检或可独立复核）**：
  - 接口契约：输入/输出/类型/schema/错误与失败行为/**兼容性保证**（按 spec-kit CDD #4609 的五要素）。
  - 不变量与禁止形态（「必须不为真」）。
  - 不可逆动作的确认门（按 OpenAI 的**风险阈值**原则，不按动作类型一刀切）。
  - 可执行验收：每条 = 一条命令或一个断言（R-B §6）。
  - 若跨组件：**权威契约单方拥有 + 消费者钉版本**，禁止复制他组件的实现计划。
- **L2 参考步骤层（可写，必须显式可作废）**：
  - 每步 ≤6 行**允许**，但**至少一行是可验证判据**。
  - 文档头显式声明优先级：「L2 与 L0/L1 或代码现状冲突时，以 L0/L1 与代码为准；L2 不构成验收条件。」
  - 每条带**过期条件**（触发条件写清，例如路径迁移即作废）。
  - **禁止**写「当前代码长什么样」的描述；只写目标形态。
  - **禁止**写能力补偿型指令（「务必彻底搜索」「逐步思考」「先列出所有文件」）——这是最已被证伪的一类（§1.2b）。

**为什么不是纯 A**：A 的全量沿用会把「信息量细节」与「能力补偿型指令」混在一起，后者已被官方记录为会随能力上升转负；同时 A 的收益在强模型上衰减（DETAIL/PartialOrderEval），而成本（注意力预算、过期误导）持续累积。
**为什么不是纯 B**：工作流里存在**弱执行模型**这一现实约束；DETAIL 显示弱模型在目标式下损失最大（0.34 vs 0.68），R-B 的歧义证据（Pass@1 −35%~−52%）与 Agentless 的结构收益都指向「结构对弱执行者仍是刚需」。纯 B 会把风险全部转移给最弱的一环。
**为什么 C 不是「折中字数」**：C 的关键不是长度分配，而是**层的可验证性与时效性设计**（L1 可机检所以能长期有效；L2 显式可作废所以不会变成债）。

### 10.2 本建议的失效条件（必须与建议一起被审查）

适用本建议的前提是：**执行者是能力明显弱于规划者的模型（异构分工），任务多为确定性/可测试的代码修改，且验收可写成可执行检查。** 出现下列任一情况时，本建议失效或需反转：

1. **执行模型不再明显弱于规划者**（工具链统一到单一强模型）：L2 应立即停止生成，而不是「保留但标注」——因为届时保留 L2 的边际收益趋零，而过期风险不减。**触发判据**：在你们自己的历史 phase 上做一次 A/B——同一批任务分别给「L0+L1」与「L0+L1+L2」给**同一个强模型**跑，若正确率无显著差异而 token 显著上升，就删 L2。
2. **任务转为探索性**（架构选型、研究综合、开放式设计）：按 §7.1「确定性 vs 探索」一行，只写边界不写结果，L2 完全不该存在。
3. **验证成本高于写死成本**：若某类改动无法写出可执行验收，L1 无法成立，此时整个三层结构退化为「另一种散文」，应改用「小步 + 频繁人审」而非加厚文档。
4. **规格无人拥有**：Aviator 的结论——**没有 ownership model 的规格必然漂移**。若无法指定每个 phase 文档的 owner 与 review rhythm，L2 会变成净负债；此时宁可只留 L0+L1。
5. **如果出现「目标式对强模型系统性更好」的受控证据**（目前**没有**这样的实验：DETAIL 是反向的），则应重新权衡；本报告刻意不把这些不存在或已撤回的来源当作依据——**已撤回的 arXiv:2608.21377（Agentic Scaffolding Amplifies Sycophantic Behavior）不得引用**（作者撤稿声明：结果与执行的评估不符、不受支持）。
6. **框架层面若出现官方「步骤层已过时」的声明**（本次调研未发现），应以框架官方迁移指南为准重估；在那之前，以**模型厂商最佳实践**（Anthropic/OpenAI）作为方向指引。

### 10.3 一句话给决策者

> 你担心的「过段时间落伍」是**真实存在的、已有官方一手案例的风险**，但它落伍的**不是「写细」本身，而是「写死路径」和「叮嘱模型已经会做的事」**。所以正确答案不是「要么手册要么目标」的二选一，而是把 phase 文档拆成：**永不删的目标与理由 + 可机检的契约与验收 + 显式声明可作废的参考步骤**。这样 12 个月后你要做的不是重写所有 phase 文档，而是**把 L2 那一段直接删掉**——删得动，就是因为现在就给它写好了过期条件。

---

## 11. 附录：来源清单

### 一手官方文档 / 官方 changelog / 官方工程博客

1. Anthropic, *Effective context engineering for AI agents*, 2025-09-29 — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
2. Anthropic, *Building effective agents*, 2024-12-19 — https://www.anthropic.com/engineering/building-effective-agents
3. OpenAI, *Reasoning best practices*（API 指南，planner/workhorse 分工、避免 CoT 提示、提供明确约束）— https://developers.openai.com/api/docs/guides/reasoning-best-practices
4. OpenAI Cookbook, *GPT-5 prompting guide*（含 Cursor 的 prompt tuning 记录、工具风险阈值、`<context_gathering>`/`<persistence>`）— https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide
5. Google Cloud Architecture Center, *Choose a design pattern for your agentic AI system*, reviewed 2026-05-28 — https://docs.cloud.google.com/architecture/choose-design-pattern-agentic-ai-system
6. GitHub spec-kit, *CHANGELOG.md*（全量拉取核对至 1.0.8 / 2026-09-17）— https://raw.githubusercontent.com/github/spec-kit/main/CHANGELOG.md
7. GitHub spec-kit, *Document Contract-Driven Development for component interfaces*（issue #4609 / PR #4616，2026-09-16）— https://github.com/github/spec-kit/issues/4609
8. AWS Kiro, *Specs*（Feature/Bugfix/**Quick Spec**、任务依赖图与波次并行），页面更新 2026-08-27 — https://kiro.dev/docs/specs/
9. AWS Kiro, *Changelog*（截至 2026-09-16；长时自主运行、harness 可切换）— https://kiro.dev/changelog/
10. Tessl, *Taming AI agents with specs: what the experts say*（Guy Podjarny / Alan Pope / Don Syme 访谈；`.impl` 标记；spec-assisted→spec-driven→spec-centric）— https://tessl.io/blog/taming-agents-with-specifications-what-the-experts-say/

### 学术论文 / 技术报告（含预印本，已逐条标注性质）

11. Kim, *DETAIL Matters: Measuring the Impact of Prompt Specificity on Reasoning in Large Language Models*, arXiv:2512.02246（2025-12-01，单作者预印本，n=30 任务）— https://arxiv.org/abs/2512.02246
12. Zi, Menon, Guha, *More Than a Score: Probing the Impact of Prompt Specificity on LLM Code Generation*, IJCNLP-AACL 2025 / arXiv:2508.03678 — https://arxiv.org/abs/2508.03678 ；artifact https://github.com/nuprl/partialordereval
13. Chen, Shen, Kang et al., *AgentSpec: Understanding Embodied Agent Scaffolds Through Controlled Composition*, arXiv:2606.14674（UCSD/JHU/UW/UIUC，具身域预印本）— https://arxiv.org/abs/2606.14674
14. Xu, Koesdwiady, Bei et al., *Rethinking the Value of Multi-Agent Workflow: A Strong Single Agent Baseline*（Amazon/UT Austin 等，预印本；单 agent 模拟同构多 agent 工作流）— https://arxiv.org/abs/2601.12307
15. Amjith, Dusad, Muramalla, Shah, *Can Large Reasoning Models Improve Accuracy on Mathematical Tasks Using Flawed Thinking?*, arXiv:2512.17079（Qwen3-4B + GRPO；对误导性 prefill 的易感性）— https://arxiv.org/abs/2512.17079
16. Sirqueira & Faciroli, *The Specification Paradox: Rethinking Requirements Engineering in the Age of AI*, arXiv:2608.16618（2026-08-17，立场/讨论论文；Specification Overfitting 与 Specification Debt）— https://arxiv.org/abs/2608.16618
17. Storey, *From Technical Debt to Cognitive and Intent Debt: Rethinking Software Health in the Age of AI*, arXiv:2603.22106（v4, 2026-04-06；三重债务模型、intent debt）— https://arxiv.org/abs/2603.22106
18. 引用 R-B 已核实的证据（不重复展开）：HumanEvalComm TOSEM 2025（歧义 −35%~−52%）、Evaluating AGENTS.md（ETH Zurich, arXiv:2602.11988）、Lost in the Middle（TACL 2023）、Chroma Context Rot 2025、Agentless（PACMSE 2025）、CodeSpecBench（arXiv:2604.12268）、SecTDD（arXiv:2608.09740）——详见 `R-B-executable-specs-for-weak-models.md`。

### 二手 / 经验来源（明确标注）

19. Stack Overflow Blog, *Dispatches from O'Reilly: The right amount of spec for agentic development*, 2026-08-21（四分法最优解、spec 的保质期、multi-agent 需要更强契约）— https://stackoverflow.blog/2026/08/21/dispatches-from-o-reilly-the-right-amount-of-spec-for-agentic-development/ （**二手评论+观点，作者匿名编辑稿**）
20. Aviator, *Tackling Technical Debt with Spec-Driven AI*, 2026-04-09（过时规格比无规格更糟；模式级而非文件级；ownership model）— https://www.aviator.co/blog/tackling-technical-debt-with-spec-driven-ai/ （**厂商博客**）
21. Martin Fowler / Thoughtworks, Birgitta Böckeler, *Understanding Spec-Driven-Development: Kiro, spec-kit, and Tessl*, 2025-10-15（一手使用评测；评审过载、agent 不遵守指令、Verschlimmbesserung）— https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html （**一手体验但单评价者、时点为 2025-09 版本**）

### 排除 / 不得引用（本次调研中确认，勿再引用）

- **arXiv:2608.21377** *Agentic Scaffolding Amplifies Sycophantic Behavior in Large Language Models*：**作者已撤稿**，撤稿声明写明「报告的结果与执行的评估不符且不受支持，该论文不应被引用」。尽管其「capable 模型放大效应更大」的结论看似契合本题，**不得使用**。
- **BMAD v6 / cc-sdd / agent-os 的「因模型变强而简化模板」声明**：本次仅检索到二手博客；**未取得官方 changelog 或设计文档佐证**，故不用于任何结论（框架形态请以 R-A 为准）。
- **「prompting is not all you need」作为代码/规格论文**：不存在（同名研究为 LLM agent 行为模拟，arXiv:2503.20749），R-B 已排除，本报告不引用。

### 方法学限制（影响本报告的所有引用）

- 本次调研的**最强单项证据（DETAIL）是单作者、小样本、无置信区间的预印本**，作者自陈结论应作方向性解读；本报告已在 §1.1、§2 明确标注。
- 「旧指令随能力上升转负」的最硬案例（Cursor×GPT-5）是**官方工程叙述，无对照实验数字**，量级未知。
- spec-kit 与 Kiro 的 changelog 核对只覆盖到 2026-09-17 / 2026-09-16；更早的 2024–2025 模板演进未逐版回溯（R-A 已覆盖模板原文形态）。
- 部分结论（§7.1 判据表、§8.2 推演、§10.1 三层模板）是**本报告基于多来源的综合，不是任何单一来源的原文**，已在对应位置标注。
