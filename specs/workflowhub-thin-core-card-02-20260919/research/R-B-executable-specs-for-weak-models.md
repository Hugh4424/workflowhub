# R-B：为弱模型写可执行规格——技术调研报告

> **调研问题**：如何写规格／计划文档，使较弱或较低智力的 LLM（便宜、快、上下文小、指令遵循弱）能据此写出高质量代码。
>
> **方法**：一手来源优先（厂商官方文档、官方工程博客、论文原文）。每条论断带链接，并标注 **[证据]**（有量化实验或官方可复现声明）或 **[经验]**（社区实践、无对照实验）。存在矛盾证据时单列一节。
>
> **调研日期**：2026-09-20。检索工具：`web_search` / `anysearch_search`（general、academic.search、academic.preprint）/ `web_fetch`。

---

## 0. 结论速览（TL;DR）

如果只记 19 条：

1. **[证据]** 规格歧义会让代码正确率塌方：把完整需求改为「歧义／不一致／不完整」后，多数 Code LLM 的 Pass@1 下降 **35%–52%**，测试通过率下降 **17%–35%**（[HumanEvalComm, TOSEM 2025](https://arxiv.org/abs/2406.00215)）。消除歧义不是锦上添花，是主要矛盾。
2. **[证据]** 但模型**不会主动问**：60% 以上的首次回答仍然是直接写代码而不是提问；歧义点从 1 个增到 3 个时，澄清命中率跌到接近 0（[HumanEvalComm](https://arxiv.org/abs/2406.00215)、[ClarifyCodeBench, 2026](https://arxiv.org/abs/2607.00711)）。**规格必须自己把歧义写死，不能指望模型来问。**
3. **[证据]** 上下文越长越不可靠：关键信息放中间时 GPT-3.5-Turbo 多文档 QA 掉 **20% 以上**，最差情况**低于完全不给文档的闭卷水平（56.1%）**（[Lost in the Middle, TACL 2023](https://arxiv.org/abs/2307.03172)）。
4. **[证据]** 长上下文退化与任务难度无关，是输入长度本身造成的；18 个模型在「重复单词」这种平凡任务上都随长度退化，且**加一个干扰项就掉分**（[Chroma Context Rot, 2025](https://www.trychroma.com/research/context-rot)）。
5. **[证据]** 与上一条呼应：LongMemEval 上「只给相关的 ~300 token 聚焦提示」显著优于「给全量 ~113k token」，跨 Claude/GPT/Gemini/Qwen 全家族成立（同上）。**给少而准 > 给多而全。**
6. **[证据]** 仓库级上下文文件（AGENTS.md / CLAUDE.md）**不是免费午餐**：自动生成的上下文文件平均让解决率**下降约 3%**、推理成本**上涨 20%+**；人手写的只带来约 **+4%** 的边际提升，同样更贵（[Evaluating AGENTS.md, ETH Zurich, 2026](https://arxiv.org/abs/2602.11988)）。
7. **[证据]** 官方立场一致指向「最小高信号」：Anthropic 要求找「**最小的**、高信号的 token 集合」，上下文是有限注意力预算；CLAUDE.md 目标 **<200 行**，超长会导致指令被忽略（[Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)、[Claude Code memory docs](https://code.claude.com/docs/en/memory)）。
8. **[证据]** 弱模型更需要显式指令：OpenAI 官方把 reasoning 模型比作「资深同事」（可只给目标），把普通 GPT 模型比作「**初级同事**（junior coworker），需要明确、精确的指令来产出指定输出」（[OpenAI prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)）。这直接对应「贵模型写规格、便宜模型执行」的分工。
9. **[证据+经验]** 粒度：Spec Kit 官方模板用「**每个任务标注精确文件路径 + `[P]` 并行标记 + 任务归属用户故事 + 每个故事可独立测试**」来定义任务；社区据此收敛出的经验法则是**单任务 1–3 个文件、约一次提交大小**（经验，无对照实验）。
10. **[经验+证据]** 验收必须可执行：Anthropic 明确「给模型一个**能跑的检查**（测试、构建、lint、截图对比）」，否则模型只能以「看起来做完了」为停止信号（[best practices](https://code.claude.com/docs/en/best-practices)）；Kiro 把验收写成 `WHEN…THEN…SHALL` 断言并配 property-based test（[Kiro](https://kiro.dev/docs/specs/best-practices/)）。
11. **[经验]** 渐进式披露是官方推荐机制：路径作用域规则、按需加载的 skill、子代理只回传 1,000–2,000 token 摘要（[Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)、[memory docs](https://code.claude.com/docs/en/memory)）。
12. **[证据]** 少样本示例能降低提示敏感性、提升鲁棒性；官方建议给「**多样、典型的示例**」而不是「一张边界情况清单」（[ProSA, EMNLP 2024](https://aclanthology.org/2024.findings-emnlp.108/)、[Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)）。
13. **[证据]** 「写细」的收益是**任务相关**的：通用题（HumanEval）在很低细节度就饱和，领域专用任务（ParEval）对细节高度敏感（[PartialOrderEval, IJCNLP-AACL 2025](https://aclanthology.org/2025.ijcnlp-long.128/)）；驱动提升的三大要素是**显式 I/O 规格、边界情况处理、显式分步拆解**。细节度对**更小的模型**收益更大（[DETAIL Matters, 2025](https://arxiv.org/abs/2512.02246)）。
14. **[证据]** 测试前置是强杠杆但有上限：把全部可见测试前置平均提升「功能+安全联合成功率」**19.3 个百分点**（2,705 条轨迹），但只改善 9 个条件中的 7 个，且「通过全部可见测试仍会失败于隐藏行为族」（[SecTDD, 2026](https://arxiv.org/abs/2608.09740)）。反过来，**让 LLM 自己生成可执行规格很难**：仓库级最好只有 20.2% 通过率（[CodeSpecBench, 2026](https://arxiv.org/abs/2604.12268)）→ **规格必须由强的一方写**。
15. **[证据]** 在问题陈述里直接附上测试用例，能额外解出 **12.0% 的 MBPP、8.5% 的 HumanEval、7.72% 的 CodeChef** 题目（[TDD & LLM, ASE 2024](https://arxiv.org/abs/2402.13521)）；让模型先生成「实现前就该通过的测试」，在 SWE-bench Lite 上把 SWE-Agent 的精度从基线**翻倍到 47.8%**（[SWT-Bench, NeurIPS 2024](https://arxiv.org/abs/2406.12952)）。这可能是**投入产出比最高的一项规格补充**。
16. **[证据]** 显式类型是高杠杆信号：类型约束解码把编译错误降低 **75.3%（HumanEval）/ 52.1%（MBPP）**，而**未约束时只有 9.0%/4.9% 的失败是语法错误，其余是类型错误**（[Type-Constrained Code Generation, POPL 2025](https://arxiv.org/abs/2504.09246)）→ 规格里写清类型/接口不是装饰。
17. **[证据·重要反例]** 并非所有「更显式」都有效：把任务拆成**固定的分阶段流水线**（定位→修复→验证）而非自由 agent 循环，在 SWE-bench Lite 上以 **$0.70/实例**达到 **32.00%（96/300）**，是当时开源方案最高（[Agentless, PACMSE 2025](https://arxiv.org/abs/2407.01489)）；分层定位（文件→相关元素→编辑点）比直接定位的编辑点准确率高 **约 +8.6 个百分点**。→ **便宜模型尤其受益于固定的分解结构**。
18. **[证据·必须知道]** **同一个 prompt 跑两次会得到不同的代码，且歧义程度可量化**：重复请求中「零次测试输出完全相同的任务」占比 **75.76%（CodeContests）/ 51.00%（APPS）/ 47.56%（HumanEval）**，`temperature=0` 只降低不确定性、**不保证确定性**（[Non-determinism of ChatGPT, TOSEM 2024](https://arxiv.org/abs/2308.02828)）；此外**拼写错误（typo）对输出相似度的破坏远大于同义改写**（[Code Roulette, LLM4Code@ICSE 2026](https://arxiv.org/abs/2506.10204)）。→ 规格的文字卫生与验收的「可重复性」必须显式要求。
19. **[证据·矛盾]** AGENTS.md 的成本方向存在**未解决的矛盾**：基准任务上推理成本 **+20%~23%**（ETH），但真实仓库 PR 上 **端到端 wall-clock −28.64%、输出 token −16.58%**（[On the Impact of AGENTS.md Files, 2026](https://arxiv.org/abs/2601.20404)）。两个独立复制研究都得到**正确率无显著差异**的结论（[两代理消融, 2026](https://arxiv.org/abs/2607.27250)）。详见 §7.5。

---

## 1. 上下文工程（Context Engineering）

### 1.1 官方心智模型

Anthropic 的定义最完整（2025-09-29 官方工程博客，[链接](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)）：

- **上下文工程 > 提示工程**：不只是写好一段 prompt，而是「在推理时**策划与维护最优 token 集合**」，包括系统指令、工具、MCP、外部数据、消息历史。
- **核心目标**：「找到**最小的、可能的**高信号 token 集合，最大化达成期望结果的概率」。
- **注意力预算（attention budget）**：transformer 是 n² 两两关系，长度上升后「捕捉两两关系的能力被摊薄」；模型的注意力模式来自训练分布，而训练中短序列更常见，因此「长上下文依赖」的经验更少。结论是**性能梯度而非硬悬崖**，但检索与长程推理精度下降。
- **上下文腐化（context rot）**：引用 Chroma 的结论——token 数增加，准确回忆能力下降，「这一特征在所有模型上都出现」。
- **「正确高度」（right altitude）**：系统提示有两个失败极端——一端是把脆弱逻辑硬编码进 prompt，另一端是「模糊的高层指导、无法给出具体信号、或**错误假设共享上下文**」。最优解在中间：既具体到能引导行为，又保留足够启发式灵活性。
- **结构化分节**：建议用 `<background_information>`、`<instructions>`、工具指导、输出描述等分节，用 XML 标签或 Markdown 标题划界。
- **示例的用法**：强烈建议 few-shot，但**反对把一堆边界情况塞进 prompt**；应「策划一组多样、典型的示例」。

OpenAI 官方（[prompt engineering guide](https://developers.openai.com/api/docs/guides/prompt-engineering)）给出可直接落到规格文档上的硬规则：

- **消息角色有优先级**：`developer` 指令优先于 `user`；可类比为「函数定义 vs 函数参数」。
- **developer 消息的建议分节与顺序**：Identity → Instructions → Examples → **Context（"usually best positioned near the end of your prompt"）**。
- **重要的模型能力差异**：「reasoning model 像资深同事，给目标即可；**GPT 模型像初级同事，需要明确指令来产出指定输出**」。
- **成本工程**：反复复用的内容放在 prompt 开头以便命中 prompt caching。
- **编码任务具体建议**：定义 agent 角色与工作流、要求用单测/命令验证、给工具调用示例、规定 Markdown 输出规范。

Google 官方的「prompt health checklist」是**规格文档的自检清单**，可直接借用作 §7 的对照表（[Overview of prompting strategies](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/prompts/prompt-design-strategies)）：

| 检查项 | 原文要点 |
|---|---|
| 清晰度 | 「如果你自己对范围、具体步骤、隐含假设产生疑问，那 prompt 大概率不清晰」 |
| 歧义 | 「避免没有具体可测定义的主观或相对限定词」；用「3 句以内」代替「简短」 |
| 缺失关键信息 | 需要文档/政策/数据集时必须显式包含 |
| 冲突/冗余/无关指令 | 逐一审计逻辑矛盾、重复表述、可删除而不影响核心任务的指令 |
| 缺少输出格式 | 「不要让模型猜输出结构」 |
| 任务过多 | 「如果 prompt 要求模型在一次里做多个不同的认知动作，那它承担太多了。拆成独立 prompt」 |
| 欠定任务 | 必须给出**边界情况与异常输入**的处理路径，以及缺失数据的处理方式 |

### 1.2 规格文档的 token 预算（可执行的工程参数）

**官方明确给出的数值**（均为一手来源）：

| 参数 | 数值 | 来源 |
|---|---|---|
| CLAUDE.md 目标长度 | **<200 行**；超过则「消耗更多上下文并**降低遵循度**」 | [Claude Code memory](https://code.claude.com/docs/en/memory) |
| CLAUDE.md 硬上限 | 超过 **4 MiB** 直接跳过 | 同上 |
| `@path` 导入最大深度 | 4 跳；且**导入不省上下文**，仍在启动时加载 | 同上 |
| auto memory 索引加载量 | `MEMORY.md` 前 **200 行或 25KB**（先到者为准） | 同上 |
| 子代理回传摘要 | **1,000–2,000 token** | [Anthropic context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) |
| 工具输出限制示例 | Claude Code 默认把工具响应限制在 **25,000 token** | [Writing tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents) |
| 检索文档数量收益拐点 | 超过 **20 篇**后收益仅 ~1.5%（GPT-3.5-Turbo）/ ~1%（Claude-1.3），而成本线性上升 | [Lost in the Middle §5](https://arxiv.org/abs/2307.03172) |

**推论（经验，但由上述证据直接支撑）**：给弱模型的「执行时上下文」应有明确预算上限，而不是「尽量多塞」。可操作做法是把规格拆成「常驻层（必须每次都在）≤200 行」+「按需层（路径/主题触发）」。

### 1.3 「迷失在中间」及其应对

**原始证据**（Liu et al., TACL 2023，[arXiv:2307.03172](https://arxiv.org/abs/2307.03172)）：

- 任务：多文档问答（k 篇文档中恰有 1 篇含答案）与合成 key-value 检索。
- 结论：**U 型性能曲线**——首因偏置（开头好）+ 近因偏置（结尾好），「当模型必须使用输入上下文**中间**的信息时性能显著退化」。
- 量化：GPT-3.5-Turbo 多文档 QA 性能「可下降 **超过 20%**」； **最差情况下 20/30 文档设置低于闭卷（不给任何文档）的 56.1%**。对照组 oracle 设置为 GPT-3.5-Turbo 88.3%、Claude-1.3 76.1%。
- **扩展上下文模型并没有更好**：16K/100K 版本在共同窗口内曲线几乎重合。
- **查询感知上下文化（query-aware contextualization）**——把 query 同时放在数据**之前和之后**——在合成 KV 检索上把最差 45.6% 提到接近满分；但在多文档 QA 上「几乎没有改变趋势」。

**补充证据**（Chroma「Context Rot」，2025-07，[链接](https://www.trychroma.com/research/context-rot)）：18 个模型；即使在「复制重复单词」这种机械任务上，随输入长度也持续退化；**单个干扰项即降低性能**，4 个干扰项进一步叠加；结构性越连贯的海堆（haystack）反而表现更差，打乱句子顺序在所有 18 个模型上一致提升表现。

**对规格写作的直接含义**：

1. 把**最不可谈判的约束**（接口签名、禁止事项、验收命令）放在规格文档的**最开头**，把**参考性材料**（背景、术语表、附录）放在**最后**；不要在中间埋关键约束。
2. 同一关键约束可以在开头与结尾各出现一次（「recap」策略，Google 官方模板也建议 recap 重申约束与输出格式）。注意这与「消除冗余指令」的检查项存在张力——见 §9。
3. 不要通过「把所有相关文件都塞进去」提升质量。LongMemEval 的聚焦 vs 全量对比说明：**噪声本身就是错误源**。
4. 需要模型「在长材料里找东西」时，把 query 前置+后置，或干脆让模型先用工具定位再读取（just-in-time）。

---

## 2. 规格精度与歧义：量化证据

### 2.1 歧义对正确率的杀伤（强证据）

**HumanEvalComm**（Wu & Fard, ACM TOSEM 2025，[arXiv:2406.00215](https://arxiv.org/abs/2406.00215)）：

- 做法：把 HumanEval 的 164 道题改写为三类缺陷，共 762 条修改：**Ambiguity（歧义）、Inconsistency（不一致）、Incompleteness（不完整）**，还包括两两组合。
- 结果：**多数 Code LLM 的 Pass@1 下降 35%–52%，Test Pass Rate 下降 17%–35%**，在各类别中 75% 以上的数字有统计显著性。
- 行为结果：**60% 以上的首次响应仍然直接生成代码而不是提问**。
- 反例价值：一个只做「先生成代码 → 再针对代码提问 → 带着答案重写」的三轮 agent（Okanagan，基于 ChatGPT-3.5）把 Communication Rate 提升 **58 个百分点**、Good Question Rate 提升 **38 个百分点**，并把 Pass@1 提升 **8 个百分点**、Test Pass Rate 提升 **7 个百分点**。

**ClarifyCodeBench**（Fang et al., 2026，[arXiv:2607.00711](https://arxiv.org/abs/2607.00711)）：

- 做法：从 LiveCodeBench 出发，用**纯删除**方式制造 1–3 个歧义点，共 419 题；每题标注关键澄清问题与标准答案。
- 结果 1：**完整需求 vs 歧义需求，pass@1 绝对下降 7.8–19.8 分**（例如 Claude-Sonnet-4.5：48.8 → 38.2；GPT-5：52.5 → 41.1）。
- 结果 2：**歧义密度上升时澄清能力崩塌**。单个歧义点时最好的 D1-H1 命中率仅 0.30；两个歧义点要求两个都命中时，最好只有 **0.08**；三个歧义点的 D3-H3 **几乎全为 0**。
- 结果 3：**推理能力不等于澄清能力**。开启 thinking 后完整需求 pass@1 上升（Claude 48.8→50.0），但歧义需求 pass@1 反而下降（38.2→34.3）；TKQR 不变（0.12）。
- 结果 4：按歧义类型分层，**Units（单位）与 Numerical Precision（数值精度）最容易澄清（部分模型 100%）**；而 **Collection Semantics（集合语义，≤16.7%）、Comparison Rules（比较/并列规则，≤12.5%）、Ordering & Atomicity（顺序与原子性，多数模型 0%）** 几乎无法澄清。
- 结果 5：模型平均只问 0.24–2.22 轮，`Diff` 几乎全为负——**问得比需要的少**。

### 2.2 歧义分类学（可直接用作规格自检表）

ClarifyCodeBench 的 10 类歧义是按需求质量原则（unambiguity / completeness / verifiability）构造的，**非常适合直接作为规格 review 的 checklist**：

| 歧义类型 | 含义 | 示例澄清问题 |
|---|---|---|
| Terminology | 领域术语未定义、过载或有多种解释 | 网格中 # . ? 各代表什么？ |
| Behavior | 功能/目标/副作用未定 | 该操作是修改原对象还是返回新对象？ |
| Edge Cases | 边界与异常条件未规定 | 无有效解时返回什么？ |
| Indices & Ranges | 索引基数、区间闭合性未定 | 端点是闭区间吗？索引从 0 还是 1 开始？ |
| Ordering & Atomicity | 时序、并发、原子性假设不清 | 这些更新是逐条处理还是原子应用？ |
| Output Format | 输出结构/排版规则缺失 | 每个答案单独一行吗？ |
| Comparison Rules | 比较键、并列打破规则、稳定性未定 | 分数相同时如何排序？ |
| Units | 数量缺单位/量纲约定 | 结果是秒、分还是别的单位？ |
| Collection Semantics | 集合成员资格、更新规则、访问语义不清 | 什么算「活跃」元素？如何取出？ |
| Numerical Precision | 精度、舍入、容差、错误处理不清 | 打印几位小数？ |

> 注意难度分层：**能写成局部显式约束的歧义（单位、精度）模型能澄清；依赖隐含行为逻辑或执行顺序的歧义（集合语义、比较规则、顺序与原子性）模型几乎必错**。所以规格必须为后三类**显式写死**。

### 2.3 官方/工业界的歧义消除流程

**GitHub Spec Kit `clarify` 命令**是一个可直接照搬的、成文的歧义扫描协议（[源码](https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/clarify.md)）。其关键机制：

- **结构化覆盖扫描（coverage map）**，逐类标注 Clear / Partial / Missing，类别包括：功能范围与行为、领域与数据模型、交互与 UX（含 error/empty/loading）、非功能质量属性（性能、可扩展性、可靠性、可观测性、安全隐私、合规）、集成与外部依赖（含失败模式）、边界与失败处理（负路径、限流、并发冲突）、约束与取舍、术语与一致性、完成信号（验收可测性）、占位符与「robust/intuitive」这类无量化形容词。
- **提问预算**：整个会话最多 **5 个**问题；每个问题必须是 2–5 选项的多选，或「≤5 个词的短答」。
- **问题质量硬规则**：必须是完整疑问句；**禁止用主题标签或需求 ID 充当问题**（原文举反例：`Acceptance device/runtime matrix (FR-023)` 是无效的）；问题后必须跟一句「Why it matters」。
- **优先级启发式**：`Impact × Uncertainty` 取前 5；跳过「不实质性影响实现或验证策略」以及纯技术栈/任务拆分类问题。
- **落盘规则**：每次接受答案后，立刻把 `Q: ... → A: ...` 追加到 `## Clarifications` 节，并**就地改写**受影响章节（功能歧义→Functional Requirements；数据形状→Data Model；非功能→可测的成功指标；边界→Edge Cases），**删除被取代的旧表述，不留矛盾文本**。
- **验证闭环**：重跑规格质量 checklist，只翻转确实变化状态的 checkbox，并报告 newly passing / regressions / still unchecked。

**GitHub Spec Kit 官方模板的「什么不该写」**（[spec 模板](https://github.com/github/spec-kit)）：规格聚焦 **WHAT users need and WHY**，**避免 HOW to implement**；未决事项必须写 `[NEEDS CLARIFICATION]` 标记而不是猜。

Spec Kit 的 `spec-driven.md` 自我描述了模板的设计意图，这段话本身就是「为弱模型写规格」的命题陈述（[仓库](https://github.com/github/spec-kit)）：

> 「这些模板充当**约束 LLM 输出的精巧提示**……它们把 LLM 从一个**创意写作者**转变为一名**有纪律的规格工程师**。」

它列出的七条约束机制，几乎逐条对应本报告各章：

1. **✅ 聚焦 WHAT 与 WHY / ❌ 避免 HOW**（技术栈、API、代码结构）——对应 §5 的显式/隐式边界。
2. **强制 `[NEEDS CLARIFICATION: <具体问题>]` 标记**——「**不要猜**：如果 prompt 没说明，就标出来」——对应 §2.3。
3. **把 checklist 当作「规格的单元测试」**——对应 §6.3。
4. **Phase -1 前置门禁**（例如「初始实现最多 3 个项目」「不做投机性的『以后可能需要』」）。
5. **实施计划保持高层可读**，代码示例/详细算法/技术规格必须移到 `implementation-details/` 文件——对应 §3 渐进式披露。
6. **测试优先的文件创建顺序**：contracts → contract → integration → e2e → unit → source。
7. **不要投机性或「可能需要的」功能**。

其「宪法」条款里给出的一条理由直接命中本报告主题：**跨模型一致性**——「不同的 AI 模型产出的代码在架构上互相兼容」。

**AWS Kiro 的 `Analyze Requirements`** 把同类检查产品化，明确列出五类可捕获的缺陷（[Kiro docs](https://kiro.dev/docs/specs/analyze-requirements/)）：逻辑不一致（各自成立但合起来不可能）、歧义（如 "large files"、"fast response times"）、冲突约束、未声明假设、缺失边界情况。并强调它是**跨需求全局推理**，不是逐条检查。

### 2.4 提升规格精度能提升正确率（正面证据）

上面的证据证明「歧义有害」；这一节证明「写得细有益」，且**在什么任务上最有益**。

**More Than a Score / PartialOrderEval**（Zi, Menon, Guha, IJCNLP-AACL 2025，[ACL Anthology](https://aclanthology.org/2025.ijcnlp-long.128/)、[arXiv:2508.03678](https://arxiv.org/abs/2508.03678)）：

- 方法：构造 prompt 的**偏序**（partial order），从「最小信息量」到「最大信息量」逐级增加细节（用 LLM 摘要、段落采样、句块遮蔽等策略生成），在同一 benchmark 上测量 pass@1 如何随 prompt 细节度变化。模型为 Llama-3.x 与 Qwen2.5-Coder。
- **关键结论 1（最重要的粒度洞察）**：**HumanEval 这类通用任务在很低的细节度就饱和**；而**领域专用 benchmark（ParEval-Serial、ParEval-OpenMP）对 prompt 细节高度敏感，准确率平台期来得慢得多**。→ **越陌生、越专业的任务，规格精度的边际收益越大**；对模型训练数据里烂熟的题型，写细几乎无用。
- **关键结论 2（哪些细节最值钱）**：驱动提升的三大要素是——**显式的 I/O 规格（explicit I/O specifications）、边界情况处理（edge-case handling）、显式的分步拆解（explicit stepwise breakdowns）**。这正好对应本报告 §5「必须显式」清单的前几项。

**补强：拆解要「结构化」，不是「更多散文」**。Structured Chain-of-Thought（Li, Li, Li, Jin, TOSEM 2024，[arXiv:2305.06599](https://arxiv.org/abs/2305.06599)）要求模型按**顺序/分支/循环三种程序结构**组织中间步骤，在 HumanEval/MBPP/MBCPP 上比普通 CoT 最高提升 **+13.79% Pass@1**，且人类评估更偏好其产出、对示例选择更鲁棒。→ **规格里给出「步骤结构」（谁在什么条件下做什么）比多写解释性文字有效**。

**DETAIL Matters**（Kim, arXiv:2512.02246，2025-12，[链接](https://arxiv.org/abs/2512.02246)）：

- 用 DETAIL 框架生成多级细节度的 prompt，用 perplexity 量化「细节度」，在 30 个推理任务上测 GPT-4 与 O3-mini。结论：**「细节度提升准确率，对更小的模型和程序性任务尤其明显」**。→ 与 OpenAI 官方的「初级同事」定性一致：**模型越弱，规格越要细**。
- 该文为单作者 preprint，样本量小（30 个任务），引用时宜降权。

**ProSA**（Zhuo et al., Findings of EMNLP 2024，[ACL Anthology](https://aclanthology.org/2024.findings-emnlp.108/)）：提出 PromptSensiScore 度量提示敏感性；结论包括「**提示敏感性随数据集与模型变化，更大的模型更鲁棒**」、「**few-shot 示例可以缓解这种敏感性问题**」、「更高的解码置信度与更强的提示鲁棒性相关」。

**对弱模型规格的含义（证据支持的推论）**：既然弱模型对措辞更敏感，规格应（a）**给 1–3 个规范示例**而不是只给抽象描述；（b）用「错误处理的示例」而不是「要有好的错误处理」这类形容词；（c）固定格式与术语，减少同一概念的不同表述；（d）把预算优先投给 **I/O 规格、边界情况、分步拆解** 这三项，而不是背景叙述。

---

## 3. 渐进式披露与分块

### 3.1 官方机制

Anthropic 的 `just in time` 与 `progressive disclosure`（[链接](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)）：

- **不要预处理全部数据**，而是维护「轻量标识符」（文件路径、存储查询、链接），让 agent **在运行时用工具动态加载**。
- 引用元数据本身携带信号：「`tests/` 下的 `test_utils.py` 与 `src/core_logic/` 下的同名文件暗示不同用途」；目录层级、命名约定、时间戳都是信号。
- 明确承认权衡：「运行时探索比预取慢」，且「没有适当引导，agent 会浪费上下文、误用工具、追死胡同」。
- **混合策略**：Claude Code 采用「CLAUDE.md **直接塞进上下文**，glob/grep 等原语**即时检索**」的混合模式。

Claude Code 官方文档给出**三种加载时机**，可直接映射到规格文档分层（[memory docs](https://code.claude.com/docs/en/memory)）：

| 机制 | 加载时机 | 适合放什么 |
|---|---|---|
| `CLAUDE.md` / `AGENTS.md` | **每次会话启动**（含 `@` 导入，导入**不省 token**） | 每次都要遵守的事实：构建/测试命令、约定、项目布局 |
| `.claude/rules/*.md` + `paths:` frontmatter | **读到匹配文件时**才加载 | 路径/语言/领域专属规则 |
| Skills（`SKILL.md`） | **被调用或判定相关时** | 多步流程、领域知识、只在某些任务用到的内容 |

官方原文的判据非常可用：「如果一条内容只在某一部分代码库相关，就移到 skill 或路径作用域规则里」。

### 3.2 长任务的三件套

Anthropic 给出三种跨上下文窗口的机制，并说明各自适用场景（[链接](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)）：

- **compaction（压缩）**：接近上限时总结并重启窗口。Claude Code 的做法是「保留架构决策、未解决的 bug、实现细节；丢弃冗余工具输出」，续接时附带「最近访问的 5 个文件」。建议「**先把 recall 拉满，再迭代提升 precision**」；最安全的是**清理工具调用结果**。
- **structured note-taking（结构化笔记）**：把笔记持久化到上下文之外（`NOTES.md`、TODO 列表），需要时再拉回来。这是跨 compaction 保持一致性的关键。
- **sub-agent 架构**：子代理在干净窗口里探索数万 token，**只回传 1,000–2,000 token 的浓缩摘要**。Anthropic 的多代理研究系统显示这在复杂研究任务上「相比单代理有显著提升」。

**同源的规模建议**（[Anthropic multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)）：简单事实查找 1 个 agent / 3–10 次工具调用；需要多方向对比时 2–4 个子代理，各 10–15 次调用；超过 10 个子代理仅适合高度复杂任务。

**两条与规格文档直接相关的工程技巧**（Anthropic 多代理系统，[链接](https://www.anthropic.com/engineering/multi-agent-research-system)）：

- **计划持久化**：主代理「先把方案想清楚并**把计划写入 Memory** 以持久化上下文」，因为「**如果上下文窗口超过 200,000 token 就会被截断**」。→ **规格/计划必须以文件形式落盘，而不是留在对话里**；对话上下文会被截断或压缩，文件不会。这也解释了为什么 Anthropic 建议「规格写完后**开一个全新会话去执行它**」（干净的上下文 + 文件作为唯一事实源）。
- **产物式交接（filesystem handoff）**：让子代理把产出写入外部系统，只**回传轻量引用**，而不是把所有内容通过主代理转述。原文警告这会变成「传话游戏」，并且「在历史中复制大块输出会抬高 token 开销」。→ **规格文档应可寻址、可分节引用**（路径 + 章节锚点），让执行者按需读取，而不是全量注入。

**对规格分块的含义**：规格的「常驻层」应只保留每次执行都必需的约束；「流程层」用 skill/规则按需加载；「参考层」（数据模型细节、API 契约、示例代码）以**可寻址的文件**形式存在，让执行者按需 `read`，而不是把全文拼进 prompt。这与 §1.2 的 token 预算共同构成「分块 ≤200 行常驻 + 其余按需」的工程实践。

**Sub-agent 委派契约（可直接照搬为「任务卡字段」）**：Anthropic 明确要求「每个子代理需要**一个目标、一个输出格式、关于工具与来源的指引、以及清晰的任务边界**。没有详细的任务描述，代理会重复劳动、留下空白、或找不到必要信息。」并记录了一个真实失败案例：一个子代理去查 2021 年汽车芯片危机，另外两个在重复调研 2025 年的供应链。→ 这四项正好是 §8 模板中「0. 目标 / 2. 允许改动范围 / 1. 硬约束 / 5. 验收」的来源。

---

## 4. 可达成的粒度

### 4.1 官方模板怎么定义「一个任务」

**GitHub Spec Kit `tasks-template.md`**（官方一手，[raw](https://raw.githubusercontent.com/github/spec-kit/main/templates/tasks-template.md)）给出的任务格式定义：

```
[ID] [P?] [Story] Description
```

- `[ID]`：顺序任务 ID（T001…），**必须写明精确文件路径**。
- `[P]`：可并行标记，含义是「**不同文件、无依赖**」。
- `[Story]`：任务归属的用户故事（US1/US2），用于追踪。
- 组织原则：**按用户故事分组**，目标是「每个故事可独立实现、独立测试、可作为 MVP 增量交付」。
- 阶段结构：Setup → Foundational（**阻塞所有用户故事**的核心基础设施）→ 各用户故事 → Polish。
- 显式反模式：**"Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence."**
- 停止点：每个阶段/故事后设 Checkpoint（「STOP and VALIDATE」）。
- 依赖顺序约定：测试先写且必须先失败；models → services → endpoints；核心实现先于集成。

**Kiro** 的任务模型（[Kiro specs](https://kiro.dev/docs/specs/)）：任务必须是「discrete, trackable」；`tasks.md` 支持**逐条运行或全部运行**；运行全部时 Kiro 会**构建依赖图并分组成 wave**——wave 1 是无依赖任务并发，wave 2 是依赖已满足的任务，逐波推进。

### 4.2 经验法则（明确标注为经验）

- **社区经验**：单任务触碰 **1–3 个文件**，约等于**一次 git 提交**的大小（UltraPlan 类技能与多个 CLAUDE.md 模板的常见表述；无对照实验）。[
  [UltraPlan 描述](https://mcpmarket.com/tools/skills/ultraplan)]
- **社区经验**：Addy Osmani（Google，2026 工作流）：「LLM 在**聚焦提示**下表现最好——一次实现一个函数、修一个 bug、加一个 feature」；并称过度一次性生成会导致「**像 10 个开发者互不沟通**」的不一致与重复（[链接](https://addyosmani.com/blog/ai-coding-workflow/)）。
- **官方口径（较弱）**：Google 检查清单把「一次要求多个不同认知动作」列为反模式，建议拆成独立 prompt（[链接](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/prompts/prompt-design-strategies)）；Anthropic 建议「如果一句话就能描述 diff，就跳过 plan」，反过来说**需要 plan 的门槛是「多文件、你不熟悉、方法不确定」**（[链接](https://code.claude.com/docs/en/best-practices)）。

### 4.3 实测参考点：真实 benchmark 上「一个任务」有多大

ETH Zurich 的 AGENTbench 统计（138 个实例，[arXiv:2602.11988](https://arxiv.org/abs/2602.11988) Table 1）给出了「真实世界可解任务」的实际规模，可作为粒度校准的锚点：

| 统计量 | 均值 | 最小 | 最大 |
|---|---|---|---|
| 代码库文件数 | 3,337 | 157 | 12,660 |
| PR patch 修改行数 | 118.9 | 1 | 219 |
| PR patch 修改文件数 | **2.5** | 1 | 23 |
| 任务描述词数 | 212 | 6 | 500 |
| 上下文文件词数 | 641 | 0 | 2,003 |
| 上下文文件章节数 | 9.7 | 1 | 29 |

**读法**：这些是**成功解出**的真实任务，**平均**改动面是 **2.5 个文件、118.9 行**。同时任务描述平均只有 **212 词**——说明「精确的小规格」在真实场景中够用，冗长的规格并非必要条件。（注：表中为均值；最大改动 23 文件 / 219 行，说明任务规模分布有长尾。）

### 4.4 投入规模的经验分档

Anthropic 在多代理研究系统中把「该投多少 agent / 多少次工具调用」写成了成文的分档规则（[链接](https://www.anthropic.com/engineering/multi-agent-research-system)）：

> 「简单的事实查找只需要 **1 个 agent、3–10 次工具调用**；直接对比可能需要 **2–4 个子代理、各 10–15 次调用**；复杂研究可能用 **10 个以上子代理**，且职责清晰划分。」

同一来源给出成本量级：**agent 任务通常消耗约 4 倍于聊天的 token，多代理系统约 15 倍**；并强调「token 使用量本身就解释了 BrowseComp 评估中 **80% 的性能方差**」。→ **对便宜模型而言，这意味着「把一个任务拆分到多个并行廉价调用」在成本上可行，但要靠规格明确规定边界，否则重复劳动会吃掉收益。**

### 4.5 决定性证据：固定分阶段流水线优于自由 agent 循环

这是本节最值得弱模型规格借鉴的一条实验证据。

**Agentless**（Xia, Deng, Dunn, Zhang, PACMSE 2025，[arXiv:2407.01489](https://arxiv.org/abs/2407.01489)）刻意**不用**自由 agent 循环，而是把任务固化成三段：**定位（localize）→ 修复（repair）→ 验证（validate）**。

- **总体结果**：SWE-bench Lite 上 **32.00%（96/300）**，成本 **$0.70/实例**，为当时开源方案最高。
- **定位阶段的消融（最能说明「粒度」价值）**：

| 定位策略 | 文件级准确率 |
|---|---|
| 仅 prompting | 78.67% |
| embedding，无过滤 | 67.67% |
| embedding + 过滤 | 70.33% |
| **三阶段组合（文件 → 相关元素 → 编辑点）** | **81.67%** |

- **相关元素层级的输入粒度**：skeleton（骨架）格式 **58.33%** vs 整文件 **53.67%** → **给结构化的骨架比给全文更有效**，这与 §1「最小高信号」一致。
- **编辑点层级**：多采样合并 **56.33%** vs 直接从文件级推断 **47.00%** → **显式的中间步骤把上限抬高了约 8.6 个百分点**。

**ACONIC**（Zhou et al., arXiv:2510.07772，2026-01，[链接](https://arxiv.org/abs/2510.07772)）从另一个方向支持同一结论：**由「复杂度/约束诱导」来决定拆分粒度**（而非启发式拍脑袋），在 SAT-Bench 上提升完成率，并在 Spider 上跨难度层级比 Tree-of-Thoughts 高 **3–8 个准确率点**。

**对「一个任务应该多大」的重新表述**：与其追问「几个文件」，不如按 **Agentless 的三段式**把每个任务显式切成「定位 → 修复 → 验证」三个可独立验收的动作，并在任务卡里写明每一步的输入粒度（骨架而非全文）与产出物。这同时解释了为什么固定分解对便宜模型特别有利——**它把「决定怎么做」的自由度从模型手里拿走了**。

### 4.6 结论

- 有证据支持：任务必须**可独立验证**、**文件路径明确**、**依赖关系显式**（Spec Kit / Kiro 的工程约束）。
- 有实测锚点：真实可解任务约 **2–3 文件 / ~120 行**。
- 只有经验支持：「1–3 文件」作为硬上限。合理的做法是把它当**默认预算**而非真理，并在拆分时优先保证「单任务单验证点」。

---

## 5. 显式 vs 隐式：什么必须写进规格

综合 ClarifyCodeBench 的难度分层、HumanEvalComm 的失败类型、Kiro 的 analyze 清单与 Spec Kit 的覆盖分类，可以给出一个**按「模型几乎必错」排序的显式清单**（越靠前越必须写死）。补充一条来自 §2.4 与 §4.4 的量化理由：**显式 I/O 规格、边界情况、分步拆解是细节度收益的三大来源，而其中的「类型」有独立实验支持其高杠杆**——类型约束解码把编译错误降低 75.3%（HumanEval）/ 52.1%（MBPP），且未约束时只有 9.0%/4.9% 的失败属于语法错误（[Type-Constrained Code Generation, 2025](https://arxiv.org/abs/2504.09246)）。

**必须显式（模型自己推不出来的）**

1. **接口签名与数据形状**：函数/端点名、参数与返回类型、字段名与类型、可空性、默认值、唯一性约束。Kiro 与 Spec Kit 都把 `data-model.md` / `contracts/` 列为独立产物。
2. **边界与异常条件**：空输入、越界、无解、超时、并发冲突、限流、部分失败。Google 检查清单直接把「未规定边界情况与异常输入处理」列为 prompt 缺陷。
3. **顺序与原子性**（Ordering & Atomicity）：逐条 vs 批量、是否原子、是否幂等、事务边界。ClarifyCodeBench 中多数模型对此类歧义命中率为 **0%**。
4. **集合与状态语义**（Collection Semantics）：成员资格、更新规则、遍历/取出语义（≤16.7% 命中率）。
5. **比较与并列规则**（Comparison Rules）：比较键、稳定性、tie-break（≤12.5% 命中率）。
6. **单位与数值精度**（Units / Numerical Precision）：量纲、取整、容差、打印位数——这类模型**有能力澄清**，但仍必须写死，因为不写就会静默选一个错值。
7. **输出格式**：结构化输出的 schema、字段顺序、错误码与消息形态。Google：「不要让模型猜输出结构」。
8. **错误处理策略**：抛出 vs 返回 vs 降级；对「不要压制错误」这类根因要求要显式写出（Anthropic 示范："address the root cause, don't suppress the error"）。
9. **禁止事项与边界**：哪些文件/目录/操作绝对不能碰。GitHub 对 2,500+ agent 文件的分析把「三层边界（always / ask first / never）」列为成功文件的共性，其中「Never commit secrets」是最常见的有用约束（[GitHub blog](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/)）。
10. **术语表与规范化**：Spec Kit clarify 专门设「Terminology & Consistency」类别，要求「同一规范术语在所有章节一致」。
11. **验证命令**：确切的可执行命令（含参数），见 §6。

**可留给实现（写进规格反而有害）**

- 内部算法选择、私有辅助函数、循环写法——Spec Kit 模板明写「Focus on WHAT / Avoid HOW」。
- 目录结构清单式的代码库概览——Anthropic 的 `/doctor` 建议「**删掉模型能从代码库推导的内容**：目录布局、依赖清单、架构概览」（[memory docs](https://code.claude.com/docs/en/memory)）；ETH 论文也发现上下文文件「**并不能有效提供代码库概览**」，且不减少「找到相关文件所需的步数」（[arXiv:2602.11988](https://arxiv.org/abs/2602.11988)）。
- 「写干净代码」「注意可维护性」这类无法验证的形容词——直接对应 Google 检查清单的「无量化形容词」与 Spec Kit 的「ambiguous adjectives」。
- 框架/语言的基础用法（模型已知的）。

**一条反直觉但证据充分的规则**：**人类写的上下文文件比 LLM 自动生成的更有用，但仍应「只描述最小必要要求」**。ETH 论文的结论句原文：「unnecessary requirements from context files make tasks harder, and human-written context files should describe only minimal requirements」。

---

## 6. 可验证性：可机器验证 / 可快速核对的验收条目

### 6.1 官方立场：给模型一个能跑的检查

Anthropic best practices 把这条列为首要实践（[链接](https://code.claude.com/docs/en/best-practices)）：

> 「给 Claude 一个它能运行的检查：测试、构建、截图对比。这是『你盯着看』和『你可以走开』的分界线。……没有检查时，『看起来做完了』是唯一信号，**你就成了验证回路**。」

并给出对照表（原文示例）：

| 策略 | Before | After |
|---|---|---|
| 提供验证标准 | "implement a function that validates email addresses" | "write a validateEmail function. example test cases: user@example.com is true, invalid is false, user@.com is false. **run the tests after implementing**" |
| 视觉验证 | "make the dashboard look better" | "[paste screenshot] implement this design. take a screenshot of the result and compare it to the original. list differences and fix them" |
| 处理根因 | "the build is failing" | "the build fails with this error: [paste error]. fix it and verify the build succeeds. **address the root cause, don't suppress the error**" |

**把验收条目写成「可执行的检查命令」而不是「描述」**，是这一节最重要的可操作结论。

### 6.2 学术参考：把测试当作可执行规格（本报告中最强的正向证据）

**Test-Driven Development and LLM-based Code Generation**（Mathews & Nagappan, ASE 2024，[arXiv:2402.13521](https://arxiv.org/abs/2402.13521)）——最干净的「只加测试」对照：

- 把测试用例**加进问题陈述**（不改其他任何内容），额外解出 **12.0% 的 MBPP**、**8.5% 的 HumanEval**，在更难的 CodeChef 集合上 **+7.72%**。
- 追加一轮「运行测试→修复」的补救回路，再增加 **+2.8%（MBPP）/ +3.0%（HumanEval）**。
- 基线（EvalPlus 变体）：GPT-4 为 80.5% MBPP / 82.3% HumanEval。

**TiCoder**（Fakhoury, Naik, Sakkas, Chakraborty, Lahiri, IEEE TSE 2024，[arXiv:2404.10100](https://arxiv.org/abs/2404.10100)）：让用户把意图**形式化为测试**（测试优先），在 4 个 SOTA 模型、2 个 Python 数据集上，**5 轮交互内平均绝对提升 +45.97% pass@1**；15 名程序员的用户研究显示代码评估质量显著更好、认知负荷显著更低。这是目前报告到的最大正确率跃升，**代价是需要交互**。

**ClarifyGPT**（Mu et al., [arXiv:2310.10996](https://arxiv.org/abs/2310.10996)，FSE/PACMSE 2024）：在生成前**显式澄清意图**，人类研究（n=10）中 GPT-4 的 Pass@1 从 **70.96% → 80.80%**；大规模模拟下 GPT-4 平均 **68.02% → 75.75%**、ChatGPT **58.55% → 67.22%**（4 个 benchmark）→ **生成前消解歧义本身值约 +8~12 个 pass@1 点**，与 HumanEvalComm 的 Okanagan 结果互相印证。

**SWT-Bench**（Mündler, Müller, He, Vechev, NeurIPS 2024，[arXiv:2406.12952](https://arxiv.org/abs/2406.12952)）：用**自动生成的 fail-to-pass 测试**过滤生成的修复补丁，以 **20% 的召回率**换取 SWE-Agent **精度翻倍到 47.8%**。→ **测试作为验收标准能大幅削减「假修复」。**

**TDD-Bench Verified**（Ahmed, Hirzel, Pan, Shinnar, Sinha / IBM, arXiv:2412.02883，[链接](https://arxiv.org/abs/2412.02883)）给出一个必要的冷水：**让 LLM 在问题被解决前就写出正确的失败测试仍然很难**——449 个 issue 上，Auto-TDD 的 fail-to-pass 为 21.7%，vs SWE-Agent+ 19.2%、Libro 15.2%；新基准上最好成绩是 GPT-4o 的 23.6%。但有一个重要副产品：**当生成的测试确实是 fail-to-pass 时，覆盖率 >90%（与人类测试相当）；否则 <60%**——可作为「测试是否合格」的自检信号。

**SecTDD**（Liang et al., arXiv:2608.09740，2026-08，[链接](https://arxiv.org/abs/2608.09740)）是目前对「把测试前置为可执行规格」最严谨的安全域对照研究：

- 规模：**2,705 条轨迹、31 个任务实例、3 个安全代码 benchmark、16 个 CWE 类别、2 个模型家族**；使用行为分区的「可见测试 / 隐藏测试」，并保证修复对比的初始候选**逐字节相同**。
- **主结果：把全部可见测试前置展示，平均把「隐藏的功能+安全联合成功率」提升 19.3 个百分点。**
- **重要限制（必须一并引用）**：该收益**只出现在 9 个 benchmark-model 条件中的 7 个，另 2 个条件反而变差**；「通过全部可见测试的候选，在每一种常见制度下仍然会失败于隐藏行为族」。→ **可见测试是强杠杆，但不是完备规格；测试覆盖率决定了它的上限。**
- 反馈形式：在共享候选对比中，**结构化反馈**修复了 80 个初始失败候选且无联合回归；**固定原始反馈**修复 83 个但引入 3 个回归；在其余情形下两者几乎不可区分（6 胜 6 负 453 平）。→ 反馈「结构化」的收益弱于「反馈是否存在」。

**CodeSpecBench**（Chen et al., arXiv:2604.12268，2026-04，[链接](https://arxiv.org/abs/2604.12268)）给出一个反向的重要警示：让 LLM **生成**可执行行为规格（用前置/后置条件表示的 Python 函数）比让它写代码难得多——在 15 个 SOTA 模型上，**仓库级任务最好只有 20.2% 通过率**，且「规格生成显著难于代码生成，强编码能力不必然意味着对意图语义的深层理解」。→ **不要让弱模型去补全规格；规格必须由更强的一方（人或强模型）写。** 这为「贵模型/人写规格、便宜模型执行」的分工提供了直接证据。

**基准数据的可信度警告**（写规格与验收时尤其重要）：

- **SWE-Bench+**（Aleithan et al., [arXiv:2410.06992](https://arxiv.org/abs/2410.06992)）：人工审计 SWE-Agent+GPT-4 的「成功」补丁，**32.67% 存在答案泄漏**（issue/评论里给出了修法）、**31.08% 因测试太弱而可疑**；过滤后解决率从 **12.47% 掉到 3.97%**；**>94% 的 issue 早于 LLM 知识截止**。
- **Agentless** 对 SWE-bench Lite 的审计：**10.0% 的 issue 缺少关键信息、5.0% 含误导性解法、4.3% 直接把标准补丁写在描述里**。

→ 这两条同时说明：**（a）真实世界的 issue/规格质量普遍不合格；（b）基准分数会被坏规格与弱测试系统性高估**。所以「规格写全 + 测试写强」不是可选优化。这也给「验收测试要独立于实现者生成」提供了动机——如果测试由实现者自己写，31% 量级的弱测试会原样通过。

**ETH 论文在构造 AGENTbench 时的测试要求值得照搬**：**用 LLM 生成单测并人工修正过度约束的测试**，最终对新生成测试达到「修改代码 75% 覆盖率」，并明确要求测试「pass for **any** implementation that resolves the described task」——即**验收测试必须只约束规格里写了的、不约束实现细节**。

### 6.3 可机器验证的验收条目写法

**Kiro 的断言式验收**（[Kiro best practices](https://kiro.dev/docs/specs/best-practices/)）：

- 正例行为：`WHEN [condition] THEN the system SHALL [behavior]`
- **回归保护**：`WHEN [condition] THEN the system SHALL CONTINUE TO [existing behavior]`
- 实现：Kiro 为这些断言生成 **property-based tests**，同时验证「修复生效」与「既有行为未被破坏」。

**Spec Kit 的 requirements checklist**（[模板](https://raw.githubusercontent.com/github/spec-kit/main/templates/checklist-template.md)）给出一个关键设计：checklist 是**需求质量**的检查表，不是实现任务的检查表。原文：

> 「`[x]` 意味着该准则已被审阅并满足**需求质量**，**不代表实现工作已完成**。」
> 「`__SPECKIT_COMMAND_IMPLEMENT__` 读取 checklist 的勾选状态作为 gate，且**不得修改标记**。」

即：**把「规格是否可验证」本身变成一份可勾选的、由人/评审者拥有的清单**，与实现进度解耦。这是「可人工快速核对」的组织形式。

**可操作的验收条目规则（综合上面一手材料）**：

1. **每条验收 = 一条命令或一个断言**，形如：`运行 <命令>，期望 <可观测结果>`；不要把验收写成「功能正常」。
2. **只断言规格里写过的行为**；不断言实现细节（否则会像 ETH 论文里说的「over-specified tests」一样惩罚合法实现）。
3. **显式区分"新行为"与"保持不变的行为"**（Kiro 的 `SHALL CONTINUE TO`）。
4. **验收条目要有可追溯 ID**，与规格条目的编号对应（Spec Kit 的 `[Story]` 标记与 requirement id）。
5. **歧义未消解时，宁可标未决，也不要猜**：Spec Kit 强制用 `[NEEDS CLARIFICATION]` 标记，「Don't guess」。
6. **数量约束**：Spec Kit 明确把 checklist 定位为「**规格写作的单元测试**」（"Checklists are UNIT TESTS FOR REQUIREMENTS WRITING"），要求**禁止**写成「Verify the button clicks correctly」这类实现行为验证，改为「'prominent display' 是否被量化为具体的尺寸/位置？」这类**需求质量**问题；要求「**≥80% 的条目必须至少包含一个可追溯引用**」（`[Spec §X.Y]`、`[Gap]`、`[Ambiguity]`、`[Conflict]`、`[Assumption]`）；并给出**软上限：候选条目超过 40 条时按风险/影响排序收敛**——可作为「验收清单不要膨胀到没人核对」的工程量级参考。
7. **报告证据而非断言**：Anthropic 明确「让 Claude 展示证据而不是宣称成功：测试输出、运行了什么命令、返回了什么」。

---

## 7. AGENTS.md / CLAUDE.md 专题：最相关的实证发现

这一节回答「把项目约定写成 agent 上下文文件，到底有没有用」。**结论与业界普遍建议相反，必须谨慎对待。**

### 7.1 ETH Zurich 的大规模对照实验（最关键的证据）

**论文**：Gloaguen, Mündler, Müller, Raychev, Vechev, *Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?*，arXiv:2602.11988（2026-02，[链接](https://arxiv.org/abs/2602.11988)）。

- **方法**：构建新 benchmark **AGENTbench**（138 个实例，12 个**带开发者手写上下文文件**的 Python 仓库）；同时在 SWE-bench Lite（300 题，11 个无上下文文件的热门仓库）上评估。三组设置：**None（无上下文文件）/ LLM（用各 agent 官方推荐的 `/init` 生成）/ Human（开发者手写）**。4 个 agent：Claude Code + Sonnet-4.5、Codex + GPT-5.2、Codex + GPT-5.1 mini、Qwen Code + Qwen3-30B-coder。
- **主要结果**：
  - **LLM 生成的上下文文件**：在 8 个设置中的 5 个造成性能下降；SWE-bench Lite 平均 **−0.5%**，AGENTbench 平均 **−2%**；步数平均增加 2.45 / 3.92 步；**成本平均增加 20% / 23%**。
  - **开发者手写**：平均 **+4%** 成功率，但同样增加步数（平均 +3.34）与成本（最多 +19%）。
  - **更强的模型不会生成更好的上下文文件**：用 GPT-5.2 生成，在 SWE-bench Lite 上平均 +2%，在 AGENTbench 上平均 −3%。
  - **不同生成 prompt（Codex vs Claude Code）没有一致优劣**，敏感度小。
  - **上下文文件不是有效的代码库概览**：有上下文文件时，agent **找到相关文件所需的步数没有实质减少**；100% 的 Sonnet-4.5 生成文件和 95%/99% 的 Qwen3-30B/GPT-5.2 生成文件都被判定含「概览」。
  - **指令确实被遵守了**：上下文文件提到的工具使用频率显著上升（如 `uv` 提到时每实例 1.6 次，未提到时 <0.01 次；仓库专用工具 2.5 次 vs <0.05 次）。**所以性能没提升不是因为模型不听指令。**
  - **原因假设（有证据）**：跟随这些额外指令**让任务变难**。GPT-5.2 的推理 token 平均增加 **22%**（LLM 生成）/ **20%**（手写）。
  - **关键的反转实验**：把代码库里**所有文档（*.md、示例代码、docs/ 目录）删掉**后，LLM 生成的上下文文件反而**平均提升 2.7%**，并且**超过**开发者手写的。→ 说明 LLM 生成的上下文文件**高度冗余于既有文档**；它只在「本来就没文档」的仓库里才有价值。
- **作者结论（原文）**：「unnecessary requirements from context files make tasks harder, and human-written context files should describe only minimal requirements」；并建议「**暂时不要使用 LLM 自动生成的上下文文件**」，只保留最小必要要求（例如「本仓库要用哪个具体工具」）。

### 7.2 内容侧的大规模实证

**Agent READMEs**（Chatlatanagulchai et al., ACM TOSEM 2026，arXiv:2511.12884，2,303 个文件 / 1,925 个仓库，[链接](https://arxiv.org/abs/2511.12884)）：

- 上下文文件**不是静态文档，而是像配置代码一样演化**的、频繁小幅追加的、「复杂、难读」的工件。
- 16 类指令的分布：测试流程 **75.9%**、实现细节 **70.8%**、架构 **68.1%** 最常写。
- **显著缺口**：安全 **14.8%**、性能 **14.5%** 很少被规定——即「功能上够用，但几乎没有 guardrail 保证安全或性能」。→ 这正是一个规格模板可以系统性补上的空白。

**Context Engineering for AI Agents in OSS**（Mohsenimofidi et al., MSR 2026，arXiv:2510.21413，[链接](https://arxiv.org/abs/2510.21413)）：

- 扫描的仓库中**只有 466 个（5%）采用了任何 AI 上下文格式**；分析了 **155 个 AGENTS.md**。
- **平均长度仅 142 词（SD 231）**；**50% 创建后从未修改**，23% 改过 1 次，21% 改过 2–7 次。
- **尚无既定内容结构**；提供上下文的方式差异极大（descriptive / prescriptive / prohibitive / explanatory / conditional 五种语气）。
- → **上下文文件的实践本身很不成熟**：既没有共识模板，大多数文件也没有在被持续维护。这意味着「照抄别人的 AGENTS.md」没有依据。

**Configuration Smells in AGENTS.md**（dos Santos, Costa, Montandon et al., arXiv:2606.15828，2026，[链接](https://arxiv.org/abs/2606.15828)）给出反模式的实际分布：**Lint Leakage 62%** 的文件、**Context Bloat 42%**、**Skill Leakage 35%**。→ 大量真实上下文文件本身就带有可解释「零收益/负收益」的缺陷（尤其 Context Bloat 42%，与 Anthropic「过度指定的 CLAUDE.md 会让模型忽略一半规则」的警告一致）。

### 7.3 ETH 论文的精确数字与方法学提醒

上文 §7.1 的数字在两处需要更精确的表述，引用时请注意：

- **效应量的显著性**：LLM 生成上下文文件造成的解决率变化是 **−0.5%（SWE-bench）/ −2%（CTXbench），且不显著（p=0.87, p=0.37）**；真正**显著的是成本与步数**（+20%/+23% 成本，+2.45/+3.92 步，p<0.001）。开发者手写的是 **+2.4%（p=0.21）**，而「手写优于自动生成」这一比较是显著的（**p=0.038**）。
- ⚠️ **来源内部不一致**：该论文**摘要**声称开发者文件「以平均 7% 的显著幅度优于 LLM 生成的文件」，但**正文表格给出的是 +2.4%（p=0.21）**。**引用时请用正文数字**，不要引用摘要里的 7%。
- 因此正确的表述是：**自动生成上下文文件的主要危害是成本（显著），正确率影响是「略负但不显著」；手写文件的正确率收益很小（约 +2~4%）且统计上不稳健。** 不要把 ETH 的结论说成「上下文文件显著降低正确率」。

### 7.4 官方最佳实践（与上述证据的关系）

- **[agents.md 官方](https://agents.md/)**：无必需字段，就是标准 Markdown；**嵌套文件按目录树就近生效，最近的优先，用户显式指令覆盖一切**；官方给的示例内容集中在 **dev environment tips、testing instructions、PR instructions**（即可执行命令），而不是架构散文。OpenAI 主仓库有 88 个 AGENTS.md。
- **GitHub 对 2,500+ agent 文件的分析**（[blog](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/)）：
  - 「**大多数 agent 文件失败是因为太模糊**」；"You are a helpful coding assistant" 无效，而指定角色 + 精确命令 + 边界 + 示例有效。
  - 六项核心内容：**commands、testing、project structure、code style、git workflow、boundaries**。
  - **命令放前面**（含 flags 与选项，不只是工具名）；**一个真实代码片段胜过三段描述**；三层边界（Always / Ask first / Never）；技术栈要带版本。
- **Anthropic CLAUDE.md 官方口径**：明确给出 ✅ Include / ❌ Exclude 表，Exclude 包括「模型读代码就能知道的一切」「标准语言约定」「详细 API 文档（改为给链接）」「频繁变化的信息」「长篇解释或教程」「逐文件描述」「像『写干净代码』这种自明实践」。并给出可操作的淘汰判据：**「对每一行问：删掉它会不会导致模型犯错？不会就删。」** 以及反模式警告：「**过度指定的 CLAUDE.md：如果太长，Claude 会忽略一半，因为重要规则被淹没在噪声里**」（[best practices](https://code.claude.com/docs/en/best-practices)、[memory docs](https://code.claude.com/docs/en/memory)）。

### 7.5 ⚠️ 未解决的矛盾：真实 PR 上 AGENTS.md 反而更快

这是本报告**最需要主会话注意的一处不确定性**。至少四项独立研究对「上下文文件到底有没有用」给出了不同方向的结论：

| 研究 | 场景 | 结果 |
|---|---|---|
| [ETH Zurich, 2026](https://arxiv.org/abs/2602.11988) | 基准任务（SWE-bench Lite / CTXbench），agent 推理成本 | LLM 生成：正确率 **−0.5%~−2%（n.s.）**，成本 **+20%~23%（p<0.001）**；手写 **+2.4%（p=0.21）** |
| [On the Impact of AGENTS.md Files, 2026](https://arxiv.org/abs/2601.20404) | **10 个仓库、124 个真实 PR**，端到端 | median **wall-clock −28.64%**、**输出 token −16.58%**，「任务完成情况相当」 |
| [两代理消融, 2026](https://arxiv.org/abs/2607.27250) | 2 个前沿 agent、17 个真实任务、**288 次带金标准测试的评估** | Claude：无 53.3% / always_on 55.6% / selective 55.6%，**p=1.000**；Codex：无 **58.8%** / always_on 56.9% / selective 52.9%，**p=0.66**（注意 Codex 是**负向**趋势） |
| [Configuration Smells, 2026](https://arxiv.org/abs/2606.15828) | 真实文件反模式分布 | Lint Leakage 62%、**Context Bloat 42%**、Skill Leakage 35% |

**怎么读这个矛盾**：

1. **指标不同**：ETH 测的是 **agent 推理成本**（token/步数），Lulla 等测的是 **端到端 wall-clock 与输出 token**。二者可以同时为真——上下文文件让 agent 做了更多探索（token 上升），但在真实 PR 流程里因为减少了来回澄清而整体更快。**两者都不能直接推出「代码质量更高」。**
2. **正确率上，四个研究没有给出任何显著正收益**：ETH 的 +2.4% 不显著，消融研究 p=1.000/p=0.66，且 Codex 出现负向趋势。**这是目前证据最一致的部分。**
3. **消融论文自己称证据是「contradictory」的**，并且只覆盖 2 个 agent、3 个仓库、17 个任务——统计功效很低，其「≤10pp / ≤15pp」的边界只是**上界**，不等于零效应。
4. **反模式分布解释了为什么**：42% 的文件有 Context Bloat——真实语料里大多数样本本身就是坏样本，这会稀释任何平均效应。

**给规格写作的可操作结论（保守版）**：

- **不要把「写 AGENTS.md」当成提升正确率的手段**；现有证据不支持这一点。
- 可以把它当作**效率手段**（减少澄清往返、缩短 wall-clock），但要用**你自己仓库的指标**验证，而不是引用别人的结论。
- 若要写，**只写「模型无法从代码推导 + 会改变行为」的最小事实**（构建/测试命令、非常规约定、禁止事项、陷阱），并做**体积预算**（见 §1.2 的 200 行量级）。**Context Bloat 是已量化的头号反模式。**
- 对**弱模型执行者**：把详细要求放在**任务级规格**里而非常驻上下文文件里——任务级规格是每任务变化的、可精确控制预算的；常驻上下文文件是每次都要付成本的。

### 7.6 矛盾与调和

**矛盾**：业界（agents.md、GitHub、Anthropic）普遍鼓励写上下文文件；ETH 的对照实验显示自动生成的有害（成本显著）、手写的只有 +4%（且正文是 +2.4% 不显著）；Lulla 等在真实 PR 上发现 wall-clock 显著下降；两个消融研究都发现正确率无显著差异。

**调和的合理解释（有证据支撑）**：

1. 上下文文件的收益**主要来自它替代了缺失的文档**，而不是来自「写在 AGENTS.md 里」这一形式（§7.1 的反转实验：删光仓库文档后，自动生成的上下文文件反而 +2.7% 且超过手写）。
2. **自动生成 = 冗余 + 增加要求**，两者都推高成本；**手写 = 冗余更少、要求更精准**，因此略正但不显著。
3. **效率提升与正确率提升是两件事**——现有证据支持前者（至少在某些设定下），不支持后者。
4. 因此正确策略是：**只写模型无法从代码库推导、且会改变行为的少数事实**（构建/测试命令、非常规约定、禁止事项、陷阱），**删掉概览、目录树、依赖清单、架构散文**。
5. 对**弱模型**，这个结论应该**更加保守**：弱模型的注意力预算更小、指令遵循更脆弱，冗余内容的边际伤害更大。若执行者本身是便宜模型，Agent 上下文文件应保持极小；把详细要求放在**任务级规格**里，而不是常驻上下文里。

---

## 8. 面向弱模型的规格模板（把上面结论落成结构）

以下是本报告的**综合产物**（属于工程建议，不是某一来源的原文），每一条都在括号里标出依据：

```markdown
# <任务名>（Task <ID>）

## 0. 一句话目标            # 放在最开头（lost-in-the-middle）
<这个任务交付什么，用一句话。>

## 1. 硬约束（不可协商）     # 开头位置 + 显式（Google 检查清单「缺失关键信息」）
- 接口：<精确签名/端点/schema>           （§5 必写项 1）
- 数据结构：<字段名: 类型，可空性，约束>   （§5 必写项 1）
- 单位与精度：<量纲、舍入、容差>          （ClarifyCodeBench 高错但可澄清类）
- 顺序与原子性：<逐条/批量、是否原子/幂等> （ClarifyCodeBench 命中率 0%，必写）
- 集合语义：<成员资格与更新规则>          （命中率 ≤16.7%，必写）
- 比较规则：<比较键、tie-break、稳定性>   （命中率 ≤12.5%，必写）
- 输出格式：<schema 或字段顺序>           （Google「不要让模型猜输出结构」）
- 必须保持不变的行为：<...>               （Kiro SHALL CONTINUE TO）
- 绝对不能做：<文件/目录/操作>            （GitHub 三层边界）

## 2. 允许改动范围           # 文件路径明确（Spec Kit `[ID] [P] [Story] 精确路径`）
- 可修改：<确切路径列表>
- 不得修改：<确切路径列表>
- 新建：<确切路径列表>

## 3. 边界与错误处理          # 显式（Google 检查清单「欠定任务」）
| 情况 | 期望行为 |
|---|---|
| 空/缺失输入 | ... |
| 越界 | ... |
| 无解 | ... |
| 并发冲突 | ... |
| 依赖失败 | ... |

## 4. 示例（1–3 个，典型而非穷举）  # few-shot 降低提示敏感性（ProSA）+ Anthropic 反对边界情况清单
输入 → 输出；错误 → 期望错误形态；一段"好代码"的风格样本

## 5. 验收（全部可执行）        # §6：每条=一条命令或一个断言
- [ ] AC-1 运行 `<命令>`，期望 `<可观测结果>`（对应 FR-001）
- [ ] AC-2 运行 `<测试>`，期望全部通过
- [ ] AC-3 运行 `<构建/lint/类型检查>`，期望退出码 0
- [ ] AC-4 回归：`<既有测试>` 仍通过

## 6. 未决事项（不许猜）        # Spec Kit `[NEEDS CLARIFICATION]`
- [NEEDS CLARIFICATION] <问题>（阻塞点：<为什么它会改变实现>）

## 附录（可按需读取，不必放进 prompt）  # 渐进式披露
- 数据模型全文：`<路径>`
- 接口契约：`<路径>`
- 相关代码：`<路径>`
```

**使用规则（对应 §4 粒度）**：

- 单任务默认预算：**1–3 个文件 / 一次提交 / 一个独立验证点**（经验法则 + AGENTbench 实测锚点：平均 2.5 文件、118.9 行）。
- 任务之间的依赖必须显式（Spec Kit 的 Phase 结构与 Kiro 的 wave 依赖图）；**同文件并发修改是被官方模板点名的反模式**。
- 常驻层（每次都要在上下文里的部分）目标 **≤200 行**；超出的内容下沉为按需读取的附录文件。
- **把任务切成固定三段**（§4.5 的 Agentless 证据）：**定位 → 修复 → 验证**，每段一个可独立验收的产出物；给模型**结构化骨架**而不是整文件全文。
- **第 5 节「验收」优先于第 1 节「硬约束」的散文描述**：能写成测试的，就不要写成句子（§6.2：仅加测试即额外解出 8.5%~12% 的题目）。
- **验收测试必须只约束规格里写过的行为**，不得约束实现细节；且**由非实现者产出或事后独立补齐**（§6.2 的 SWE-Bench+ 警告：31.08% 的「成功」因测试太弱而可疑）。
- **显式要求可重复性**：因为 `temperature=0` 也不保证确定性（同一 prompt 在 HumanEval 上有 47.56% 的任务两次测试输出完全不同），验收条目要么是**确定性断言**，要么显式声明容差（§0 第 18 条）。
- **文字卫生**：拼写错误对输出的破坏远大于同义改写（同条证据）；规格中的标识符、命令、路径必须逐字准确，最好从代码库复制而非手打。
- 术语、命令、路径一旦确定，**全文只用一个写法**（ProSA：few-shot 与一致性降低提示敏感性）。

---

## 9. 冲突与不确定性（不要过度承诺）

| 议题 | 冲突 | 本报告的处理 |
|---|---|---|
| 冗余 vs recap | Google 检查清单要求删除「重复表述」；Google 自己的模板又建议结尾 recap 重申约束与输出格式 | 关键约束可在首尾各出现一次（对抗 lost-in-the-middle），其余内容去重 |
| 上下文文件价值 | 业界普遍推荐 vs ETH 实验：自动生成正确率 **n.s.**、成本 **+20%（显著）**、手写 **+2.4%（n.s.）**；Lulla 等在真实 PR 上 **wall-clock −28.6%**；两个消融研究 **p=1.000 / p=0.66**（Codex 负向） | **正确率上无显著证据**；效率上可能有。标为**未解决的开放问题**（§7.5），只作效率手段并按本地指标验证 |
| 任务粒度硬阈值 | 社区「1–3 文件」流传广，但**无对照实验** | 标为经验；用 AGENTbench 的 2.5 文件/118.9 行作为实测锚点，不宣称因果；改以 Agentless 的固定三段式作为有证据的结构（§4.5） |
| 「给更多上下文更好」 | 常识 vs lost-in-the-middle + context rot + LongMemEval 聚焦/全量对比 | 以后者为据；「给少而准」优先 |
| 澄清 vs 写死 | HumanEvalComm 显示让 agent 提问可提升 8 个点、ClarifyGPT 提升 8~12 个点；ClarifyCodeBench 显示模型极少主动问、且歧义密度一高就崩 | 对弱模型**不依赖提问**，规格写死；提问机制只作为补充回路 |
| AGENTS.md 与 CLAUDE.md | 两者加载优先级不同（Anthropic 默认有 CLAUDE.md 就不读 AGENTS.md） | 见 [Anthropic memory docs](https://code.claude.com/docs/en/memory) 的加载优先级表；跨工具场景用 `@AGENTS.md` 导入 |
| 上下文腐化是否只影响旧模型 | Chroma 测的是 2025 年中的模型；厂商声称新模型更抗干扰 | 论文与官方博客（Anthropic 2025-09）均称该特征「跨所有模型存在」；但对 2026 年的前沿模型，退化幅度未知 |
| 基准分数的可信度 | 常被当作能力证据，但 SWE-Bench+ 显示 **32.67% 的「成功」有答案泄漏、31.08% 测试过弱**；Agentless 审计发现 4.3% 的 issue 直接含标准补丁 | **不要把基准分数当作规格质量的证据**；引用时说明是否已过滤泄漏与弱测试 |
| 来源自身的一致性 | ETH 论文摘要称 **7%**，正文表格为 **+2.4%（p=0.21）** | **采用正文数字**；已在 §7.3 标注该来源内部矛盾 |
| 非确定性 | 普遍假设 `temperature=0` 即可复现；实测 47.56%~75.76% 的任务两次输出不同 | 验收条目需声明容差或使用确定性断言（§0 第 18 条） |

---

## 10. 附录：来源清单

### 一手官方文档 / 官方工程博客

1. Anthropic, *Effective context engineering for AI agents*, 2025-09-29 — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
2. Anthropic, *Claude Code best practices* — https://code.claude.com/docs/en/best-practices
3. Anthropic, *How Claude remembers your project*（CLAUDE.md / AGENTS.md / rules / auto memory）— https://code.claude.com/docs/en/memory
4. Anthropic, *Writing tools for AI agents* — https://www.anthropic.com/engineering/writing-tools-for-agents
5. Anthropic, *How we built our multi-agent research system* — https://www.anthropic.com/engineering/multi-agent-research-system
6. OpenAI, *Prompt engineering*（API 指南）— https://developers.openai.com/api/docs/guides/prompt-engineering
7. OpenAI Help Center, *Best practices for prompt engineering with the OpenAI API* — https://help.openai.com/en/articles/6654000-best-practices-for-prompt-engineering-with-the-openai-api
8. Google, *Overview of prompting strategies*（含 prompt health checklist）— https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/prompts/prompt-design-strategies
9. AGENTS.md 官方站点 — https://agents.md/
10. GitHub Blog（Matt Nigh）, *How to write a great agents.md: Lessons from over 2,500 repositories*, 2025-11-19 — https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/
11. GitHub Spec Kit — https://github.com/github/spec-kit ；`clarify` 命令 — /templates/commands/clarify.md ；任务模板 — /templates/tasks-template.md ；checklist 模板 — /templates/checklist-template.md
12. AWS Kiro, *Specs* / *Analyze Requirements* / *Best practices* — https://kiro.dev/docs/specs/ , /analyze-requirements/ , /best-practices/

### 学术论文 / 技术报告

13. Liu, Lin, Hewitt, Paranjape, Bevilacqua, Petroni, Liang, *Lost in the Middle: How Language Models Use Long Contexts*, TACL 2023 — https://arxiv.org/abs/2307.03172
14. Hong, Troynikov, Huber (Chroma), *Context Rot: How Increasing Input Tokens Impacts LLM Performance*, 2025-07 — https://www.trychroma.com/research/context-rot
15. Wu & Fard, *HumanEvalComm: Benchmarking the Communication Competence of Code Generation for LLMs and LLM Agent*, ACM TOSEM 2025 — https://arxiv.org/abs/2406.00215 ；DOI 10.1145/3715109
16. Fang, Jin, Dong, Li, Zhang, Jin, Li, *ClarifyCodeBench: Evaluating LLMs on Clarifying Ambiguous Requirements for Code Generation*, arXiv:2607.00711 — https://arxiv.org/abs/2607.00711
17. Gloaguen, Mündler, Müller, Raychev, Vechev (ETH Zurich), *Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?*, arXiv:2602.11988 — https://arxiv.org/abs/2602.11988 ；代码 https://github.com/eth-sri/agentbench
18. Chatlatanagulchai et al., *Agent READMEs: An Empirical Study of Context Files for Agentic Coding*, arXiv:2511.12884 — https://arxiv.org/abs/2511.12884
19. Mohsenimofidi, Galster, Treude, Baltes, *Context Engineering for AI Agents in Open-Source Software*, MSR 2026, arXiv:2510.21413 — https://arxiv.org/abs/2510.21413
20. Zhuo, Zhang, Fang, Duan, Lin, Chen, *ProSA: Assessing and Understanding the Prompt Sensitivity of LLMs*, Findings of EMNLP 2024 — https://aclanthology.org/2024.findings-emnlp.108/
21. Zi, Menon, Guha, *More Than a Score: Probing the Impact of Prompt Specificity on LLM Code Generation*, IJCNLP-AACL 2025 — https://aclanthology.org/2025.ijcnlp-long.128/ ；arXiv:2508.03678 ；artifact https://github.com/nuprl/partialordereval
22. Kim, *DETAIL Matters: Measuring the Impact of Prompt Specificity on Reasoning in Large Language Models*, arXiv:2512.02246 — https://arxiv.org/abs/2512.02246
23. Liang, Gan, Ying, Wei, Cui, Ni, *Security Tests as Executable Specifications for LLM Code Generation: Benefits, Trade-offs, and Coverage Limits*（SecTDD）, arXiv:2608.09740 — https://arxiv.org/abs/2608.09740
24. Chen, Dai, Zhu, Wang, Wang, Xu, Yuan, Guo, Wu, *CodeSpecBench: Benchmarking LLMs for Executable Behavioral Specification Generation*, arXiv:2604.12268 — https://arxiv.org/abs/2604.12268
25. Mündler, Müller, He, Vechev, *SWT-Bench: Testing and Validating Real-World Bug-Fixes with Code Agents*, NeurIPS 2024 — https://arxiv.org/abs/2406.12952
26. Yang, Jimenez-Gomez, Wettig, Lieret, Yao, Narasimhan, Press, *SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering*, NeurIPS 2024 — https://arxiv.org/abs/2405.15793
27. Xia, Deng, Dunn, Zhang, *Agentless: Demystifying LLM-based Software Engineering Agents*, PACMSE 2025 — https://arxiv.org/abs/2407.01489
28. Mathews & Nagappan, *Test-Driven Development and LLM-based Code Generation*, ASE 2024 — https://arxiv.org/abs/2402.13521
29. Fakhoury, Naik, Sakkas, Chakraborty, Lahiri, *LLM-Based Test-Driven Interactive Code Generation*（TiCoder）, IEEE TSE 2024 — https://arxiv.org/abs/2404.10100
30. Mu et al., *ClarifyGPT: Empowering LLM-based Code Generation with Intention Clarification*, FSE/PACMSE 2024 — https://arxiv.org/abs/2310.10996
31. Mündler, He, Wang, Vechev, *Type-Constrained Code Generation with Language Models*, Proc. ACM Program. Lang. 2025 — https://arxiv.org/abs/2504.09246
32. Li, Li, Li, Jin, *Structured Chain-of-Thought Prompting for Code Generation*, TOSEM 2024 — https://arxiv.org/abs/2305.06599
33. Ouyang, Zhang, Harman, Wang, *An Empirical Study of the Non-determinism of ChatGPT in Code Generation*, TOSEM 2024 — https://arxiv.org/abs/2308.02828
34. Paleyes, Sendyka, Robinson, Cabrera, Lawrence, *Code Roulette: How Prompt Variability Affects LLM Code Generation*, LLM4Code @ ICSE 2026 — https://arxiv.org/abs/2506.10204
35. Aleithan, Xue, Mohajer, Nnorom, Uddin, Wang, *SWE-Bench+: Enhanced Coding Benchmark for LLMs* — https://arxiv.org/abs/2410.06992
36. Ahmed, Hirzel, Pan, Shinnar, Sinha, *TDD-Bench Verified: Can LLMs Generate Tests for Issues Before They Get Resolved?*（IBM）— https://arxiv.org/abs/2412.02883
37. Zhou, Xu, Liu, Liu, Wang, Wu, *An approach for systematic decomposition of complex LLM tasks*（ACONIC）— https://arxiv.org/abs/2510.07772
38. Lulla, Mohsenimofidi, Galster, Zhang, Baltes, Treude, *On the Impact of AGENTS.md Files on the Efficiency of AI Coding Agents* — https://arxiv.org/abs/2601.20404
39. Khatri, *Do Context Files Help Coding Agents? A Two-Agent Ablation Study on Real Repositories* — https://arxiv.org/abs/2607.27250
40. dos Santos, Costa, Montandon et al., *Configuration Smells in AGENTS.md Files: Common Mistakes in Configuring Coding Agents* — https://arxiv.org/abs/2606.15828

### 被排除/未能验证的来源（不要引用）

- **"Prompting is not all you need"** 作为代码生成论文：不存在；同名研究是 LLM agent 客户行为模拟（arXiv:2503.20749），与本题无关。
- **"CodePrompt"**：仅匹配到源码**分类**任务，非代码生成正确率。
- **"Do Prompt Patterns Affect Code Quality? A First Empirical Study"**（DOI 10.1145/3756681.3756938）：ACM DL 返回 422/403，**未能验证任何数字**。
- **"TDD Governance for Multi-Agent Code Generation via Prompt Engineering"**（arXiv:2604.26615）：是立场/展望论文，**无对照实验数字**，不用于量化论断。

### 方法学限制（影响本报告所有引用）

- ACM DL、ResearchGate、Scribd 在本次调研环境中被反爬拦截；`ai.google.dev` 与 `help.openai.com/6654000` 返回 HTTP 422，分别改用 Google 自有镜像与 web.archive.org 快照。**ACM-only 论文的数字取自其 arXiv 版本**，可能与最终版有差异。
- 多篇关键论文为 **preprint，未经同行评审**（ClarifyCodeBench、SecTDD、CodeSpecBench、所有 AGENTS.md 系列）。本报告已在正文逐条标注「证据」来自 preprint 还是 peer-reviewed。
- ETH 论文存在**来源内部不一致**（摘要 7% vs 正文 +2.4%），已按正文数字引用并标注。

### 社区经验来源（明确标注为经验）

41. Addy Osmani, *My LLM coding workflow going into 2026* — https://addyosmani.com/blog/ai-coding-workflow/
42. GitHub Spec Kit Discussion #1123, *Task-Specific Instruction Templates*（含任务级 playbook 模板）— https://github.com/github/spec-kit/discussions/1123
