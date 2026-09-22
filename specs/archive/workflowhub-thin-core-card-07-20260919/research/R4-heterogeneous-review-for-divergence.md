# R4 异源审查用于发散与方向 — 外部调研

- 任务：调研「独立异源审查在『发散』和『方向选择』阶段怎么用才有效」的证据与形态。
- 范围：跨模型/跨 provider 独立审查，用于**发散**与**方向选择**，不用于验收 gatekeeping。
- 证据强度口径：
  - `strong` = RCT / 系统综述 / 元分析 / 大样本预注册复现，或方法透明的多项目工业实证；
  - `medium` = 单篇同行评审研究、有明确设计的大样本观察研究、厂商一手文档；
  - `weak` = 小样本、单一场景、博客/厂商营销页、无法追溯的二手转述。
- 反证纪律：本报告**单列反证与失效条件**。凡与"早审查更好""审查者必须更强""异源必然有益"相冲突的证据，与支持性证据同等收录。

---

## 0. 结论速览（≤12 条，一句话 + 证据强度）

1. **"审查者必须强于 writer"只是方向性倾向，不是单调定律。** CriticBench 在 17 个 LLM、5 个推理域上发现"强模型更擅长批评弱模型"，但**弱模型在自我批评上可以反超强模型**——强弱关系与"批评谁"强相关。`strong`（benchmark，方法透明）
2. **"reviewer 弱于 writer = −8.6pp" 未能追溯到任何一手来源；而"弱审查者看起来差"有一部分是测量假象。** 8 种措辞 × 2 个检索引擎 + 全语料 grep 零命中，该数字应视为**项目内部数字**；同时 ICML 2025 的 350+ 模型研究显示裁判会**系统性高估弱于自己的模型、低估强于自己的模型**，并额外高估同厂商模型——所以强弱效应至少部分是**指标**而非审查行为造成的。`strong`（作为溯源否证 + 机制证据）
3. **同源自审有系统性缺陷，这是异源审查最强的立论基础。** 无外部反馈的内在自我纠正"有时反而使表现变差"；自我偏好偏差随模型自我识别能力**线性增强**。`strong`（ICLR 2024 / 多任务复现）
4. **审查者会被锚定，而且"叫它别被锚定"是无效的。** 单次示例暴露就把"与示例高度相似"从 7% 拉到 50%（Jansson & Smith 1991）；**明确指示"尽量生成不同的想法"也未能降低从众**（Smith, Ward & Schumacher 1993）；**资深法官**会向"自己掷骰子产生、明知随机"的锚点靠拢且"专业与经验并未减弱该效应"（Englich 2006）；LLM 侧 CoT / Reflection / "忽略锚点提示"**都不足以**缓解，缓解需要"从多个角度收集提示"（arXiv:2412.06593）。`strong`
   - **但**：LLM 对**无关**提示的锚定不显著，仅对**带权威框架**的提示显著——而"已选方向"正属于后者（推断，未被直接验证）。
5. **异源聚合的收益是"有条件的"，且有一条根本限制：跨厂商并不等于错误独立。** 正面：PoLL 显示**不同模型族**的小模型面板胜过单个大模型裁判（成本低 7 倍以上、族内偏差更少）；SWRBench 报告多审查聚合使 ACR 的 F1 **最高 +43.67%**（口径为 LLM 评 LLM）。反面（更强）：**ICML 2025（350+ 模型）发现"更大更准的模型即使架构与厂商不同，错误仍高度相关"，两者都错时 60% 一致（随机基线 1/3）**；**arXiv:2605.29800 测得 9 个前沿 LLM（7 个模型族）的面板只等于约 2 张独立票，且"最好的单个裁判打平或超过整个面板"**；强提示单智能体≈最好的多智能体讨论。`strong`
6. **⚠ 审查的"详细程度"是一个危险变量，不是越多越好。** ASE 2026 研究：LLM "frequently misclassify correct code implementation as non-compliant or defective"，且 "more detailed prompt design, particularly with those requiring explanations and proposed corrections, leads to higher misjudgment rates"；Imbue 的对照案例中，weaker fixer 拿到完整 review 细节后从 **16/17 掉到 8/17**，而只给摘要则保持不变。`medium`（前者单篇 2026 研究；后者为厂商 n=15 对照实验）
7. **审查/早期输入"看起来有效"时，往往是在做权衡，而不是免费收益。** 对抗式审查提高决策论证质量但**降低接受度**（魔鬼代言人/辩证质询，Schweiger et al. 1986）；给写作者看**一个 AI 想法**会提高个体产出质量，但**使彼此更相似**（Doshi & Hauser 2024，b = 0.871 / 0.718，P < 0.001 / P = 0.003）。`medium` / `strong`
8. **盲审（信息裁剪）对"审查质量"没有可证实的提升。** Cochrane 综述中 9 项研究"无 concealment 对质量评估结果有影响的证据"；ICLR 从单盲改双盲后声望偏差显著下降，但**未显著改变接收决策**。`strong`
9. **"缺陷发现成本随阶段指数上升"的曲线不可引用。** 常被引的 Pressman 比值是 **1:6.5:15:60–100**，追溯终点是 **1981 年 IBM 内部培训课程笔记**；"IBM Systems Sciences Institute"是**企业培训机构而非研究机构**。"1:10:100" 是其后续流传变体。**连该传统的权威出处（Boehm & Basili 2001）在同一段里都承认对小系统它"more like 5:1 than 100:1"。** `strong`（溯源研究，逐环可复核）
10. **最大规模的现代实证没有发现延迟修复效应。** 171 个真实项目、2006–2014："未发现延迟问题效应的证据；后期解决的工作量并不一致或显著更高。" `strong`（该主题迄今最大样本）
11. **advisory-only 是主流 AI 审查工具的默认（7/7 核验），但实测采纳率比人类审查低一个数量级。** Copilot / CodeRabbit / Greptile / SonarQube / Codacy / Semgrep / CodeGuru **全部默认不阻断**，阻断一律 opt-in；而 TSE 2026（16 个 AI 审查 Action、178 个成熟仓库、**22,326 条 AI 评论**）测得**AI 审查意见的采纳/处置率仅 0.9%–19.2%，人类为 60%**；未被采纳的 50 条回复中 **64%** 是"为现有实现辩护"。审查疲劳方面：临床警报 override **49%–96%**、假阳性 36.5%/39%；但"疲劳随时间增长"被 **Ancker 2017 反驳**——驱动因素是**重复与数量**（每次就诊多一条提醒，接受率降约 30%），不是时间。`strong`
12. **"把审查者审得更好"基本失败；"换一种审查者"才有效。** NeurIPS 2022 的审查质量评估 RCT 显示**人为加长但无信息量**的审查被评为**显著更高质量**，同一审查的多次评估分歧率 **28–32%**；22 项 RCT 的元分析（Bruce 2016）显示**评审人培训不改善质量、checklist 不改善稿件**，而**开放同行评审（问责）SMD 0.14、增加一名统计审查者 SMD 0.58**；评审人之间的一致性本身就低（48 项研究 / 19,443 份稿件，IRR "quite limited"）。`strong`

---

## 1. 审查者强弱关系（含对"异质性收益"的反面证据）

### 1.1 "reviewer 必须强于 writer"——方向性证据

**CriticBench（arXiv:2402.14809）** 是这一问题最直接的一手证据。它在 5 个推理域（数学、常识、符号、代码、算法）、15 个数据集、3 个 LLM 家族、17 个模型上评测 GQC（generation / critique / correction）。

原文关键结论（verbatim）：

> "(4) an intriguing inter-model critiquing dynamic, where stronger models are better at critiquing weaker ones, while weaker models can surprisingly surpass stronger ones in their self-critique."

以及：

> "(1) a linear relationship in GQC capabilities, with critique-focused training markedly enhancing performance"

**更强的一条（直接反驳"审查者必须更强"）**：CriticBench 报告"弱模型作为**外部**批评者，有时比强模型**自我批评**更有效"——即**独立性**可以胜过**强度**：

> "weaker models could sometimes correct the outputs of stronger models more effectively than those models could self-correct"

- 来源：https://arxiv.org/abs/2402.14809
- 强度：`strong`（受控 benchmark；但"强弱"由该 benchmark 内部标定，不能直接外推到"厂商 A 强于厂商 B"）

**读法**：这条证据支持"强审查者审弱产出更有效"，但同时**给出一个反向例外**——在自我批评场景中弱模型可以超过强模型。因此"reviewer 必须强于 writer"应表述为**倾向而非定律**，且强弱的定义域是任务，不是绝对能力。

### 1.2 "−8.6 个百分点"的溯源结果：未找到一手来源

本轮调研（多轮 web + 学术检索，含 8 种措辞 × 2 个检索引擎 + 全语料 grep）**没有找到**任何以百分点形式报告"reviewer 弱于 writer 导致 −8.6pp"的一手研究。上游结论中这一数字**不可引用**；它更像是项目内部测得的数字，**不能被当作外部文献结论**。

**更关键的替代解释：这个效应至少有相当部分是"相关错误"造成的测量假象。**

- **Correlated Errors in Large Language Models**（Kim, Garg, Peng & Garg, ICML 2025, arXiv:2506.07962；350+ LLM）：
  > "each judge **systematically inflates the accuracy of models that are less accurate than itself**, due to correlated errors … each judge **underinflates the accuracy of models that are more accurate than itself** (the judge cannot reward a model for answering correctly on a question it itself answers incorrectly)."
  并且："Judges also **significantly inflate the accuracy of models from the same provider**."
  - 来源：https://arxiv.org/abs/2506.07962（已核验 HTTP 200）
  - 强度：`strong`（ICML 2025，350+ 模型，两个排行榜 + 简历筛选任务）
  - **含义**：当"弱审查者"被用来给"强 writer"打分时，它会**系统性低估**对方——所以"弱审查者看起来无效"有一部分是**指标本身**造成的，不是审查行为本身。同时也说明**同厂商审查者会系统性高估同厂商产出**。

- **Debate Helps Weak Judges Reward Stronger Models**（arXiv:2605.27483）给出了这条规则目前最精确的表述——注意它说的是"critic vs **judge**"，不是"reviewer vs **writer**"：
  > "the critic's classification ability **must exceed** the judge's, and the judge must treat critic speeches as claims to verify rather than testimony to summarize. On the three of five pairings where the condition holds, proposer-critic debate's gains are statistically significant over consultancy … On the two non-responder pairings in our set, debate produces **null effects**"
  - 来源：https://arxiv.org/abs/2605.27483（已核验 HTTP 200）
  - 强度：`medium`（预印本；5 组配对中 3 组有效、2 组零效应）

- **Benchmarks Saturate When The Model Gets Smarter Than The Judge**（arXiv:2601.19532）：Omni-Judge 在评判分歧中"**wrong in 96.4%**"；"As problems become more challenging, we find that increasingly competent judges become essential."
  - 来源：https://arxiv.org/abs/2601.19532（已核验 HTTP 200）
  - 强度：`medium`（预印本；方向清晰，但对象是**评判**而非**审查方向建议**）

**综合读法**：正确表述应为——"当审查者承担**判定/验收**职责时，其能力必须不低于被审对象，否则判定会被相关错误系统性污染；但这条规则（a）只被验证于 critic-vs-judge 场景，（b）在**审查者承担的是'提供不同视角'职责时并不适用**"。

### 1.2b 最接近的可引用替代（弱监督者仍能引出能力）

- Weak-to-strong generalization（arXiv:2312.09390）："when we naively finetune strong pretrained models on labels generated by a weak model, they consistently perform better than their weak supervisors"；PGR（performance gap recovered）"almost universally positive"，NLP 上 >20%（很弱监督者）到 >50%（最大 student），但 **reward modeling 约 10%、chess 约 0**。
  - 来源：https://arxiv.org/abs/2312.09390
  - 强度：`strong`（OpenAI，GPT-4 家族，NLP+chess+reward modeling）
  - **对上游说法的作用**：这是**部分反证**——弱的一方作为监督者/审查者并非只有 −8.6pp 的伤害，而是能引出强模型的一部分真实能力；只是引不满，且**强依赖于任务类型**。

### 1.3 同源自审的失败结构（异源审查的立论基础）

| 发现 | 来源 | 强度 |
|---|---|---|
| "LLMs struggle to self-correct their responses without external feedback, and at times, their performance even degrades after self-correction."（具体：GPT-3.5 CommonSenseQA **75.8 → 38.1**，−37.7；GPT-4 GSM8K 95.5 → 89.0；但**给了 oracle 标签**后 75.9 → 84.3） | Huang et al., ICLR 2024, https://arxiv.org/abs/2310.01798 | `strong` |
| 自我偏好："an LLM evaluator scores its own outputs higher than others' while human annotators consider them of equal quality"；且**自我识别能力与自我偏好强度呈线性相关**（微调实验，因果解释经受控实验检验） | Panickssery et al. 2024, https://arxiv.org/abs/2404.13076 | `strong` |
| CriticGPT：RLHF 训练的批评者在含真实 LLM 错误代码上，**63% 情况下人类更偏好模型批评而非人类批评**；但"Critics can have limitations of their own, including hallucinated bugs that could mislead humans"；**人机混合批评者队伍在幻觉更少的同时抓到与纯 LLM 批评者相近数量的 bug** | McAleese et al. 2024, https://arxiv.org/abs/2407.00215 | `strong` |

**这三条合起来给出异源审查的真正理由**：不是"异源一定更强"，而是**同源自审的失败模式是可预测的**（无外部反馈、自我偏好、幻觉 bug），而异源审查把"外部反馈"这一必要条件补上。

### 1.3b 补充：自我纠正盲点与自审环路的量化

| 发现 | 来源 | 强度 |
|---|---|---|
| **自我纠正盲点（Self-Correction Blind Spot）64.5%**：同一个错误，**外部归因**时模型能改，**自我归因**时改不了——"proving the capability exists but is not activated"。微调 5,306 条纠错轨迹可降低 76.0%；仅追加一个词 "Wait" 可降低 89.3% | Self-Correction Bench, https://arxiv.org/abs/2507.02778（COLM 2026；14 个开源非推理模型） | `strong` |
| **自审环路让计划变差**：LLM 自审 55/100 vs 外部可靠验证器 88/100 vs 不用环路 40/100；且 LLM 验证器 **FPR = 38/45 = 84.45%**（把有效计划判为无效） | Valmeekam et al. 2023, https://arxiv.org/abs/2310.08118 | `strong` |

**机制读法**：Self-Correction Bench 证明自审失败是**激活失败而非能力失败**——模型有能力改，但"自己说的错"不触发纠正。**独立性（由谁指出）比强度（谁更强）更接近这个机制的作用点**，这是"异源"在发散/方向场景的主要立论。

注意 CriticGPT 那条同时是**反证**：审查者会产生**幻觉缺陷**，且必须靠"审查者互审 + 人类"来压制。见 §6。

### 1.4 异质性收益：正面证据

- **PoLL / "Replacing Judges with Juries"（arXiv:2404.18796）**：verbatim "using a PoLL composed of a larger number of smaller models outperforms a single large judge, exhibits less intra-model bias due to its composition of disjoint model families, and does so while being over seven times less expensive."（3 种评审设置 × 6 个数据集）
  - 来源：https://arxiv.org/abs/2404.18796
  - 强度：`strong`
  - **对 CARD-07 语境的关键点**：收益的机制被明确写成 **"disjoint model families"**（模型族不相交），即跨厂商，而非"模型更多"。

- **Doshi & Hauser 2024, Science Advances**：生成式 AI 提升个体创造力但**降低集体内容多样性**（DOI 10.1126/sciadv.adn5290）。该研究支持"同源/AI 单一来源会收敛，需要外部异质来源维持多样性"。
  - 来源：https://doi.org/10.1126/sciadv.adn5290
  - 强度：`strong`（Science Advances，预注册实验设计）
  - 注意：它测的是**人类作者使用 AI 后的集体多样性**，不是"多模型审查"，外推需谨慎。

### 1.5 异质性收益：反面证据（本节是全报告最关键的反证之一）

- **⭐⭐ 相关错误跨越厂商与架构边界，且越强的模型越相关。** Kim, Garg, Peng & Garg, ICML 2025, arXiv:2506.07962（350+ LLM，两个排行榜 + 一个简历筛选任务）：
  > "**Crucially, however, larger and more accurate models have highly correlated errors, even with distinct architectures and providers.**"
  > "on one leaderboard dataset, models **agree 60% of the time when both models err**"（随机选择错误答案只有 1/3）
  并且："relative self-preferencing can occur across different models from the same family."
  - 来源：https://arxiv.org/abs/2506.07962（已核验 HTTP 200）
  - 强度：`strong`（ICML 2025，350+ 模型）
  - **含义（对异源审查最根本的挑战）**：**"不同厂商 ⇒ 独立上下文 ⇒ 独立错误"这条推理链在实证上不成立**。错误相关性主要由**同厂商、同基座架构、相近规模**驱动，但**即使是不同架构、不同厂商的大模型，错误仍然高度相关**。而且**你会优先挑的那些最强模型，恰恰是彼此最相关的**。任何"异源审查"的有效性主张都必须先处理这条。

- **"Rethinking the Bounds of LLM Reasoning: Are Multi-Agent Discussions the Key?"（arXiv:2402.18272）**：verbatim "a single-agent LLM with strong prompts can achieve almost the same performance as the best existing discussion approach on a wide range of reasoning tasks and backbone LLMs... We observe that the multi-agent discussion performs better than a single agent **only when there is no demonstration in the prompt**."
  - 来源：https://arxiv.org/abs/2402.18272（已核验标题与摘要）
  - **⚠ 归属更正**：本报告早期误将本文当作 "Should we be going MAD?"。两者是**两篇不同论文**，但**结论方向一致**：
- **"Should we be going MAD? A Look at Multi-Agent Debate Strategies for LLMs"（arXiv:2311.17371）**：verbatim "**multi-agent debating systems, in their current form, do not reliably outperform** other proposed prompting strategies, such as self-consistency and ensembling using multiple reasoning paths."
  - 来源：https://arxiv.org/abs/2311.17371（已核验标题与摘要）
  - 强度：`strong`（两篇独立论文，方向一致）
  - **含义**：多主体异构讨论的增益**大部分可被"单主体 + 好提示"复现**；当上下文里已经有示例/示范时，多主体的优势消失。这是对"异源审查天然优于单源"的**直接反证**。

- **多智能体系统的"多样性坍缩"（Diversity Collapse）**：arXiv:2604.18005（ACL 2026 Findings）：
  > "a compute efficiency paradox, where **stronger, highly aligned models yield diminishing marginal diversity** despite higher per-sample quality"
  > "**group-size scaling yields diminishing returns** and dense communication topologies accelerate premature convergence"
  结论：坍缩"arises primarily from the **interaction structure**"（即来自交互结构本身，不是模型不够强）。
  - 来源：https://arxiv.org/abs/2604.18005（已核验 HTTP 200）
  - 强度：`medium`（预印本/conference findings）
  - **含义**：**把多个强模型放进同一个交互结构里，反而会提前收敛**。如果审查被组织成"多轮讨论/互看彼此输出"，这与发散的目的事与愿违。

- **多样性指标不是集合增益的有效预测器**：Kuncheva & Whitaker 2003, *Machine Learning* 51:181–207，DOI `10.1023/A:1022859003006`。论文 Table 9 的平均"多样性/准确率"秩相关仅 **0.08–0.30**（6 个实验/数据单元），且极端情况下为**负**（如 −0.43、−0.95）。原文："the relationship between diversity and accuracy is weak"。
  - 来源：DOI `10.1023/A:1022859003006`
  - 强度：`strong`（经典实证，被广泛复现）
  - **含义**：**"我们让审查者更异质"本身不是有效性的证据**；异质性与收益的关系弱且可为负。

- **Hong & Page 2004 有镜像定理**：arXiv:2307.04709（"Fatal errors and misuse of mathematics in the Hong-Page Theorem and Landemore's epistemic argument"）给出一个"**Ability trumps diversity**"的对偶定理，并对该定理的四个假设给出反例。
  - 来源：https://arxiv.org/abs/2307.04709
  - 强度：`medium`（working paper）
  - **含义**：**"多样性胜过能力"是假设依赖的结论，不是普适定律**。引用 Hong & Page 时必须带上这个限定。

- **PoLL 的收益是"同等或更好 + 更便宜 + 偏差更少"，不是"异源必然发现更多真实问题"。** 论文卖点是成本与偏差，**不是召回率提升**。把它读成"异源提高缺陷发现率"是过度解读。`medium`（同一来源的边界条件）

- **Generative AI Paradox（arXiv:2311.00059）**：模型"can outperform humans in generation"但"consistently fall short of human capabilities in measures of understanding"，且生成与理解的相关性更弱、对对抗输入更脆。
  - 来源：https://arxiv.org/abs/2311.00059
  - 强度：`strong`
  - **含义**：**"验证比生成容易"这个常被默认的前提不成立**。如果审查本质是"理解/验证"任务，那么"更强的生成者 ⇒ 更好的审查者"这条推理链本身就是可疑的。

- **现场证据（有答案键，但 n=1 代码库）**：Shopware 的多模型实验（Martin Bens, 2026-08-05，https://www.shopware.com/en/news/an-experiment-with-ai-agents/）：7 个已知缺陷下，Sol 3/7、Terra 3/7（**不同的三个**）、Luna 1/7；**最小的模型 Luna 独有地读了已安装库的源码**；"Sol marked every finding as blocking … makes those labels useless"；"The families disagreed where it mattered: one overturned a decision the other had let stand."；同一运行重复 6 次时，某个需要读库源码的缺陷**只在 1/6 次中出现**。
  - 强度：`weak`（n=1 代码库，非 benchmark，作者自述）
  - **含义**：这是**唯一一条"不同模型抓到不同子集"的现场证据**，方向支持异质性；但样本量太小，**不能单独作为结论依据**。
---

## 2. 用于发散的审查形态对比（含 prompt 设计证据）

> 本节区分三类形态：(A) 对抗式（找错/攻击）；(B) 替代式（要求给出别的选项）；(C) 聚合式（多审查者合并）。形态之间的证据强度差异很大。

### 2.1 adversarial ideation / red teaming / devil's advocate

- **devil's advocacy / dialectical inquiry（Schweiger, Sandberg & Ragan 1986, Academy of Management Journal）**：DOI `10.2307/255859`（JSTOR https://www.jstor.org/stable/255859），被引 751。
  - 该研究的经典结论：辩证质询与魔鬼代言人都比"共识法"产生**更高质量的假设与建议**，但成员**接受度/满意度更低**。
  - 强度：`medium`（高被引经典，但为**模拟决策任务的实验室研究**；1990s 有后续分歧结论）
  - 后续/扩展：`10.1006/obhd.1995.1070`（Devil's Advocacy and Dialectical Inquiry Effects on Face-to-Face and Computer-Mediated Group Decision Making, 1995，被引 90）；`10.1177/105960119101600207`（1991，被引 108）。
  - **对发散审查的直接含义**：对抗式审查的收益与"被接受"是两个独立变量，且历史上呈负相关。见 §4。
  - **口径提醒**：本报告未取得该文的正文（JSTOR 付费墙），上述结论为该领域标准转述；**引用具体数字前应核对原文**。

- **LLM red teaming**：Perez et al. 2022（arXiv:2202.03286）、Ganguli et al. 2022（arXiv:2209.07858）是让模型生成对抗性输入来发现另一模型失效的成熟形态。其定位是**发现失效模式（安全面）**，不是"给产品方向建议"。
  - 强度：`strong`（作为"用模型做对抗生成"这一形态的存在性证据）
  - **边界**：red teaming 的产出是攻击样本，不是方向选项；迁移到"方向建议"需要额外的形态改造，这一改造本身缺少对照研究。

### 2.2 alternative-generating review（要求给出替代方案而非挑错）

- **Critique→Correction 的形态证据**：Tyen et al. 2024（arXiv:2311.08516）"LLMs cannot find reasoning errors, but can correct them given the error location"——即**定位错误**与**纠正错误**是两种可分离能力，且后者更容易。
  - 强度：`strong`（对能力可分离性的证据）
  - **含义**：如果把审查者直接要求成"给出替代方案（纠正）"，可能比要求它"定位错误"更可行——但这与"审查者是否真能找到你没想到的方向"是两个问题。

- **多评审者面板作为"替代来源"**：PoLL（§1.4）。其价值在于用**不相交模型族**引入不同的先验，而非在单一先验内做更多采样。`strong`

- **缺口**：本轮**没有找到**针对"要求审查者产出替代方案 vs 要求审查者挑错"的**直接对照实验**（同一输入、同一模型、两种指令、比较产出质量）。这一形态在工程实践中普遍（如设计评审、需求评审中的 "alternatives analysis"），但**缺少可引用的 A/B 证据**。

- **⚠ 反向证据（重要）：要求"解释 + 提出修正"会显著提高误判率。** "Are LLMs reliable code reviewers? systematic overcorrection in requirement conformance judgement", *Automated Software Engineering* 2026, DOI `10.1007/s10515-026-00638-5`。verbatim（摘要）：
  > "LLMs frequently misclassify correct code implementation as non-compliant or defective. Surprisingly, we find that more detailed prompt design, particularly with those requiring explanations and proposed corrections, leads to higher misjudgment rates, highlighting critical reliability issues for LLM-based code assistants."
  该文提出的缓解方案是 **Fix-guided Verification Filter**：把"模型提出的修正"当作**可执行的反事实证据**，用基准测试与规范约束的增强测试去验证原实现与修正实现（而不是相信模型的解释）。
  - 来源：DOI `10.1007/s10515-026-00638-5`
  - 强度：`medium`（单篇 2026 年同行评审研究，被引尚低；但设计上与"prompt 复杂度 → 误判率"直接对照）
  - **对 Q3 的含义**：这与"要求至少 N 个替代方案 / 要求列出被否方案 / 要求给出修正"这一整类提示词设计**方向相反**。至少存在一个已发表的对照结果显示：**更详细的、要求解释与修正的提示，会提高误判率**。任何"用提示词逼出替代方案"的做法，都必须先处理这个反证。

### 2.3 blind review / 信息裁剪

| 发现 | 来源 | 强度 |
|---|---|---|
| 9 项研究"无证据表明**审查者/作者身份隐藏**（concealment）影响质量评估结果" | Jefferson et al., Cochrane Review, DOI 10.1002/14651858.MR000016.pub3 | `strong`（系统综述） |
| ICLR 从单盲改双盲后，**最知名作者的评分显著下降**，但**未显著改变接收决策**；双盲下被拒论文的引用数更高（说明双盲更好地识别了低质量论文）；同时"评分量表从 10 分改 4 分"这一看似无关的改动**很可能显著降低了声望偏差** | arXiv:2101.02701（5027 篇 ICLR 投稿） | `strong` |
| 双盲降低偏见的证据"limited and mixed" | 同上（作者自述） | `strong` |
| **受控信息不对称实验**：单盲评审人竞标（bid）的论文**少 22%**，且更可能推荐接收**知名作者**（odds **1.63**）、**顶尖大学**（**1.58**）、**顶尖公司**（**2.10**）的论文 | Tomkins, Zhang & Heavlin 2017, *PNAS*, DOI `10.1073/pnas.1707323114`（被引 448；WSDM，15.6% 接收率，每篇 4 名评审人） | `strong` |
| ⚠ **同一研究存在数值冲突**：Le Goues et al. 2018 CACM 引用**同一个 WSDM 研究**时给出的倍数是 **1.76 / 1.67**，与上表的 1.63/1.58 **不一致** | 见下条 | `medium`（作为"引用时需注明来源版本"的提示） |
| **匿名化有效但不完美，且因果含糊**：ASE/OOPSLA/PLDI 上 **70–86%** 的评审没有作者猜测、**74–90%** 没有**正确**猜测（ASE 90.2% / OOPSLA 74.4% / PLDI 81.0%）；**但在 OOPSLA 与 PLDI，没有任何猜测的论文反而更不容易被接收**（p ≤ .05）。作者同时披露："all conferences' review processes were chaired by—and this Viewpoint is written by—researchers who **support** double-blind review" | Le Goues et al. 2018, *Communications of the ACM*, DOI `10.1145/3208157` | `medium`（大样本真实数据，但非随机；且作者披露立场偏向） |
| **⚠ 盲审的"作者身份"维度正在被 LLM 击穿**：只用**标题 + 摘要**（且论文发表于模型训练之后），LLM"**collapse anonymity more efficiently than humans**, with belief concentrating onto a small subset of plausible authors drawn from pools of five domain expert candidates"；该脆弱性"persists even when stylistic and bibliographic cues are excluded" | arXiv:2608.05157, "Large Language Models Threaten Double-blind Review" | `medium`（预印本；5 候选强制选择任务偏易，"集中信念"≠"识别出作者"） |
| 双盲在某一期刊使**女性第一作者比例上升 7.9 个百分点**，且同期可比单盲期刊无对应变化；但该推断被**正式质疑**，作者亦有回应 | Budden et al. 2008, *TREE*, DOI `10.1016/j.tree.2007.07.008`（被引 404）；质疑/回应见 DOI `10.1016/j.tree.2008.04.001` | `medium`（自然实验，非随机；**质疑与回应的具体统计论证本轮未取得全文，不予转述**） |
| "开放同行评审"**不是单一构念**：文献中 **122 个定义**归结为 **7 个特征的 22 种不同配置** | Ross-Hellauer 2017, *F1000Research*, DOI `10.12688/f1000research.11369.2`（被引 253） | `medium` |

**结论形态**：盲审（裁掉作者/来源信息）能减少**与质量无关的偏差**，但**没有证据表明它提高审查质量本身**。对"异源审查"的类比含义：裁掉"是谁写的"可能减少偏见；但**裁掉"已选方向"是否提高发散质量，是另一个未被上述研究覆盖的问题**——见 §3 的锚定证据。此外，**当审查者本身是模型时，"裁掉名字"这一操作的信息论价值下降**（arXiv:2608.05157）。

### 2.4 多审查者聚合：多数投票 vs 全量收集

- **聚合优于单一大模型（正面）**：PoLL（§1.4），`strong`。
- **投票定理在相关投票下失效（理论反证）**：Condorcet 陪审团定理依赖投票独立性；Ladha 1992（"The Condorcet Jury Theorem, Free Speech, and Correlated Votes"）表明**投票相关性会破坏定理的结论**。
  - 来源：DOI `10.2307/2111584`（Ladha 1992, *American Journal of Political Science* 36(3), 被引 318）
  - 强度：`strong`（理论 + 形式化）
  - **对异源审查的含义**：多数投票的收益取决于**错误的独立性**。这正是"跨厂商异源"在理论上优于"同厂商多实例"的地方——但**本轮未找到直接测量"跨厂商错误相关性 vs 同厂商错误相关性"的一手研究**（见 §6 缺口）。
- **⭐⭐ 决定性反证：9 个裁判只等于约 2 张独立票。** arXiv:2605.29800，"Nine Judges, Two Effective Votes: Correlated Errors Undermine LLM Evaluation Panels"（已核验 HTTP 200）。9 个前沿 LLM、**7 个模型族**、3 个 NLI 数据集（每项 100 条人工标注）：
  > 面板"only about **2 independent votes**' worth of information"；约**四分之三**的名义独立性丢失；面板准确率比"独立投票理想值"低 **8–22 个百分点**；**"the best single judge matches or outperforms the full panel across all conditions"**；聚合算法即便知道正确答案也只能弥合"at most **11%**"的差距。
  用 Kish effective sample size 与 Condorcet 零模型测量；在提示变体、温度、CoT 以及成对偏好任务（RewardBench）上稳健。
  - 来源：https://arxiv.org/abs/2605.29800
  - 强度：`medium`–`strong`（多数据集、多方法、显式有效样本量指标；**预印本，尚未独立复现**）
  - **含义（与 PoLL 冲突，必须并读）**：**"多找几个不同厂商的模型当审查者"在信息量上可能只等于约 2 个独立意见，而且最好的单个裁判就能打平整个面板。** 这是对"异源面板"最直接的量化打击，且与 §6.1 的 ICML 2025 相关错误结果互相印证。
- **PoLL vs "Nine Judges" 的冲突处理**：PoLL（arXiv:2404.18796）报告"面板 > 单个大裁判、偏差更少、成本 1/7"；"Nine Judges"（arXiv:2605.29800）报告"最佳单裁判 ≥ 全面板、有效独立票仅约 2"。两者**测量目标不同**（前者测与人类判断的一致性 + 成本 + intra-model bias；后者测有效独立性 + 相对独立投票理想值）。**本报告不裁定哪一方对**，但要求任何引用 PoLL 的场合同时标注这条反证。`strong`（作为"证据冲突"的结论）

### 2.5 prompt / 协议设计的对照证据（Q3 核心）

> 本节回答"如何让审查者提供新方向而不是挑错"。**正反两侧都有对照实验，且结论并不一致。**

**（a）有效的方向：明确、量化地"要求更多"**

- **⭐ 直接挑战（direct challenge）显著有效，而"请审阅一下"是最弱干预**：Bond, Carlson & Keeney 2008, *Management Science*, DOI `10.1287/mnsc.1070.0754`（"Generating Objectives: Can Decision Makers Articulate What They Want?"，被引 176）。三组实验：
  > 深度审阅（deep review + 明确挑战）新增 **M = 2.77** 个目标，而简单的"review your list"仅新增 **M = 0.55**，**t(103) = 5.46**；给出**上位类别名**使生成集合增加 **>30%**；作者建议"挑战人们把清单大约翻倍"；并指出参与者**首次尝试通常只列出自己相关目标的 30–50%**。
  原文："one of the most effective ways of inducing decision makers to generate additional relevant objectives is a **direct challenge to do so, quantified in terms of a target number**"。
  - 强度：`medium`–`strong`（三组实验，显式对比弱/强诱导提示）
  - **含义**：这是**"要求至少 N 个替代方案"最有力的正面证据**。同时它给出一个关键警告：**把审查框成"请审阅"（simple review）会得到最弱的结果**——即"挑错"式框架本身就压制产出。
- **给出"缺失的类别名"有效**：同上（类别名使生成集合 +>30%）——这是**"指出缺失的选项类别"这一提示设计的直接量化支持**。
- **"考虑反面"优于"保持公正"**：Lord, Lepper & Preston 1984, *JPSP*, DOI `10.1037/0022-3514.47.6.1231`（被引 450）。考虑反面指令"had greater corrective effect than more demand-laden alternative instructions to **be as fair and unbiased as possible**"。
  - 强度：`medium`（经典；**本项目未取得该文表格数据，具体均值未核验**）
- **不只是"反面"——任何"另一个可行解释"都能去偏**：Hirt & Markman 1995, *JPSP*, DOI `10.1037/0022-3514.69.6.1069`（被引 300+）。3 组实验（Study 1：326 人招募、307 人分析）："debiasing occurred in **all** multiple explanation conditions, including those that did **not** involve the opposite outcome"；机制是"spontaneous consideration of additional alternatives"。
  - 强度：`medium`–`strong`
  - **含义**：**"要求给出替代方案"不必要求"给出相反方案"**；要求"第二个合理解释"即可触发去偏。
- **"辩证式自举"（dialectical bootstrapping）：第二个"不同知识来源"的估计 + 取平均**：Herzog & Hertwig 2009, *Psychological Science*, DOI `10.1111/j.1467-9280.2009.02271.x`（被引 193）："improved accuracy by **4.1 percentage points**, surpassing mere reliability gains"；"Participants displayed a **72% benefit rate**"。
  - 强度：`medium`（**数字来自二手摘要页，非原文表格，视为部分核验**）
  - **含义**：增益的前提是第二个估计来自**不同知识**——**重复同样的推理不会有增益**。这是"多来源"而非"多轮次"的最清晰量化支持。
- **启发式提示（Design Heuristics / TRIZ）提高方案数量与新颖性**：Yilmaz, Daly, Seifert & Gonzalez, *Design Studies*, DOI `10.1016/j.destud.2016.05.001`。文中报告一项受控研究中"encouraging the use of transformation principles and facilitators resulted in the generation of **25% more concepts**"（Weaver et al. 2009）。
  - 强度：`medium`（**数字为综述内二手转述**，多项为课堂研究，效应量异质）

**（b）失效条件：强制"多列替代方案"可能反噬**

- **⭐⭐ 随机现场实验：强制使用"竞争假设分析"（ACH）既没提高准确性，还降低了内部一致性**：Dhami, Belton & Mandel 2019, *Applied Cognitive Psychology*, DOI `10.1002/acp.3550`。**50 名在职情报分析师**随机分配：
  > 选对假设：ACH **36%**（9/25）vs 对照组 **33%**（8/25），χ²(1, N=49) = 0.04, **p = .845**（无显著差异）；ACH 组更可能给出并列排名（**80% vs 19%**，p < .001），且**更不一致**地应用自己的证据评分规则（**4% vs 44%**，p = .003）。
  - 强度：`strong`（随机化、在职专业人员、概率化真值、预注册编码方案、同行评审）
  - **含义**：**这是"强制枚举替代方案"这一类协议最重要的失败条件**：它改变了**过程**指标（考虑了更多证据项），但**没有改变准确性**，并**损害了一致性**。而且该实验的**对照组本身已经在做替代生成**（被要求指出最重要的信息项）。
- **⭐⭐ 反噬条件：让人列"很多"替代反而会摧毁去偏效果**：Sanna, Schwarz & Stocker 2002, *JEP: LMC*, DOI `10.1037/0278-7393.28.3.497`（被引 90）。让被试生成 **2 条 vs 10 条**反事实想法：
  > "No significant hindsight effects were obtained when participants listed only a few counterfactual thoughts, a task subjectively experienced as **easy**."（即：列 2 条**有效**去偏；列 10 条**没有**同样效果，因为"主观困难度"本身被当作信息使用）
  - 强度：`medium`（同行评审、多研究项目；小样本实验室，"10 条"是协议特定的边界）
  - **含义**：**"至少给出 N 个替代方案"里的 N 不是越大越好**。当 N 高到让审查者感到"凑数困难"时，去偏效果可能消失甚至反转。这与 (a) 中 Bond et al. 的"翻倍即可"建议**方向一致但边界不同**，两者应并读。
- **结构化分析技术的一般性批评**：Chang, Berdini, Mandel & Tetlock 2018, *Intelligence and National Security*, DOI `10.1080/02684527.2017.1400230`。核心论点：SAT 把偏差当作**单向**的，但偏差是**双向**的，压制一种偏差会触发它的镜像；并且"no one has ever actually tested whether decomposition is adding or subtracting **noise** from the analytic process"。
  - 强度：`medium`（同行评审，权威作者；但它是**论证**而非测量）
- **"角色扮演的魔鬼代言人"弱于"真实的异议者"**：Nemeth, Connell, Rogers & Brown 2001, *Journal of Applied Social Psychology*, DOI `10.1111/j.1559-1816.2001.tb02481.x`（被引 84）；Nemeth et al. 2004（DOI `10.1002/ejsp.210`）转述："we have evidence that such **role-playing techniques do not stimulate creative thought** and solutions as does **authentic dissent**"。
  - 强度：`medium`（2004 为二手转述；2001 一手未取得全文）
  - **含义**：**"指定一个审查者扮演魔鬼代言人"与"存在真实分歧"是两件事**；前者可能不产生发散收益。
- **⚠ 数量 ≠ 质量：想法选不出来**：Rietzschel, Nijstad & Stroebe 2006, *JESP*, DOI `10.1016/j.jesp.2005.04.005`（被引 291）：名义组（nominal groups）比互动组产生**更多、更原创**的想法，**但最终被选中的想法质量没有差异**，而且"**idea selection was not significantly better than chance**"。
  - 强度：`strong`（2×2 生成/选择分离设计，直接检验"数量→质量"链）
  - **含义**：**这是对"多要几个替代方案就能改善方向选择"的最强反驳**：更多候选并不等于更好的选择；**选择环节本身接近随机**。如果审查的产出进入一个接近随机的选择过程，增加候选的边际价值有限。
- **头脑风暴损失的真实规模（作为量级参照）**：Mullen, Johnson & Salas 1991 元分析，*Basic and Applied Social Psychology*, DOI `10.1207/s15324834basp1201_1`。18 篇文章 / 20 项研究：**数量** k=34 检验、2,577 人 / 844 组，combined Z = 15.324，mean r = **.572**（d≈1.40）；**质量** k=9、638 人 / 244 组，combined Z = 10.592，mean r = **.558**（d≈1.34）。
  - 强度：`strong`（作为人类面对面头脑风暴的元分析）；`medium`（作为 LLM 协议指南——所有研究都是人类、多为 1970–80 年代）

**（c）Q3 的净结论**

- **正面**：明确、量化的"再给 N 个"、给类别名、"考虑另一个合理解释"、"第二个不同知识来源的估计并取平均"，都有对照证据。
- **反面**：N 过大反而失效（Sanna 2002）；强制枚举替代方案的随机现场实验**没有提高准确性且降低一致性**（Dhami 2019）；**更多候选不改善最终选择**（Rietzschel 2006）；**要求解释与修正会提高误判率**（§2.2 的 ASE 2026）；**把完整审查细节交给较弱执行者会造成回归**（§6.2 的 Imbue 2026）。
- **因此**："要求至少 N 个替代方案 / 列出被否方案 / 指出缺失类别"是一组**有正反两侧对照证据、且边界条件明确的做法**，**不能**被表述为已证实有效。



- **⭐ 多审查聚合的最强量化证据（正面）：SWRBench。** arXiv:2509.01494，"Benchmarking and Studying the LLM-based Code Review"，构建 1000 个**人工核验**的 GitHub PR（PR 级、含完整项目上下文）。verbatim（摘要）：
  > "Our systematic evaluation of mainstream ACR tools and LLMs on SWRBench reveals that current systems underperform, and ACR tools are more adept at detecting functional errors. Subsequently, we propose and validate a simple multi-review aggregation strategy that significantly boosts ACR performance, **increasing F1 scores by up to 43.67%**."
  - 来源：https://arxiv.org/abs/2509.01494
  - 强度：`medium`（预印本；1000 PR 人工核验是强度来源，但"multi-review aggregation"的具体构成需读全文确认——**引用前应核对它聚合的是同模型多次采样还是跨模型**）
  - **边界**：论文自述的评估方法是"objective LLM-based evaluation method that aligns strongly with human judgment (~90 agreement)"，即**用 LLM 评 LLM**；F1 提升幅度受该评估口径影响。
  - 另一条同样重要的结论："ACR tools are more adept at detecting **functional errors**"——即现有 AI 审查工具**偏向功能错误**，对方向性/设计性问题能力更弱。这与 Bacchelli & Bird 2013 关于"评审实际产出低层级问题"的结论方向一致。

---

## 3. 审查时机：早 vs 晚（含锚定/框架锁定证据）

### 3.1 支持"早审查"的证据链

1. **锚定效应是普遍且强的认知偏差**：Tversky & Kahneman 1974, Science, DOI `10.1126/science.185.4157.1124`（被引 24,285）。
   - 强度：`strong`（奠基性研究，数十年复现）
2. **示例暴露会显著限制创造性产出（design fixation）——有具体效应量**：Jansson & Smith 1991, Design Studies 12(1):3–11, DOI `10.1016/0142-694X(91)90003-F`（被引 994）。给一个示例设计后再生成：
   - 吸盘方案 **6% → 54%**；轮胎栏杆方案 **15% → 48%**；"与示例高度相似" **7% → 50%**；
   - 防溢杯的**灵活性 0.95 → 0.85**、**原创性 0.64 → 0.53**；
   - 即使**明确禁止**使用示例中的某一类方案（吸管），该类方案仍从 **1% → 17%**；
   - 该研究**用 13 名职业工程师做了复现**。
   - 强度：`medium`–`strong`（经典设计研究；上述百分比为**镜像扫描件的描述性均值**，本项目未能核验其推断统计量）
3. **⭐ 锚定无法用"努力指令"消除**：Smith, Ward & Schumacher 1993, *Memory & Cognition*, DOI `10.3758/BF03202751`（被引 522）。总体从众效应 F(1,92) = 8.13（toys）/ 12.50（creatures）；**23 分钟延迟并未降低它**；**明确指示"尽量生成不同的想法"也未能降低从众**（t(76) = 2.89）；反过来指示"与示例一致"会提高从众。
   - 强度：`strong`
   - **这是 Q3 最重要的一条反证**：**告诉审查者"别被已选方向锚定"是无效的**。这一结论直接削弱"用提示词约束来获得新颖方向"这类做法。
4. **专家也不能免疫，且锚点可以完全无关**：Englich, Mussweiler & Strack 2006, *Personality and Social Psychology Bulletin*, DOI `10.1177/0146167205282152`（"Playing Dice With Criminal Sentences: The Influence of **Irrelevant** Anchors on Experts'..."，被引 390）。**资深法官**会向一个**他们自己掷骰子产生、明知是随机**的锚点靠拢；verbatim："**Expertise and experience did not reduce this effect.**"
   - 强度：`strong`
   - **含义**：审查者不会因为"更专业/更强"而免疫锚定。
3. **LLM 同样被锚定，且提示词层面的缓解无效**：arXiv:2412.06593 / DOI `10.1007/s42001-025-00435-2`（Journal of Computational Social Science, 2025）。verbatim：
   > "Our findings highlight the sensitivity of LLM responses to biased hints. At the same time, our experiments show that, to mitigate anchoring bias, one needs to collect hints from comprehensive angles to prevent the LLMs from being anchored to individual pieces of information, while simple algorithms such as Chain-of-Thought, Thoughts of Principles, Ignoring Anchor Hints, and Reflection are not sufficient."
   - 来源：https://arxiv.org/abs/2412.06593
   - 强度：`medium`（实验研究，已同行评审）
   - **⚠ 重要限定（来自同一论文）**：该研究发现 LLM 对**无关**提示的锚定效应**不显著**——只有**带有专家/权威框架**的提示才产生显著锚定。这与人类（Englich 2006：无关锚点对专家也有效）**方向不同**。
   - **对本场景的含义**：审查输入里的"已选方向"不是无关锚点，它是**被明确标注为"已选定"的方案**——即带有权威框架，正好落在该研究认定的**高风险类别**里。但这一推断本身**未被直接实验验证**。
4. **谄媚（sycophancy）会把审查推向"确认"**：Sharma et al. 2023（arXiv:2310.13548），verbatim "five state-of-the-art AI assistants consistently exhibit sycophancy across four varied free-form text-generation tasks"；**给模型一个预先给定的候选信念会让准确率最多下降 27%**（LLaMA 2）；模型在被质疑时会放弃原本正确且自信的答案。
   - 强度：`strong`
5. **LLM 判断对顺序/上下文高度脆弱**：MT-Bench（arXiv:2306.05685）——GPT-4 裁判仅 **65.0%** 顺序一致、**30.0%** 偏向第一个（GPT-3.5 为 46.2% / 50.0%；Claude-v1 为 23.8% / **75.0%**）。Wang et al. 2023（arXiv:2305.17926，"Large Language Models are not Fair Evaluators"）：**仅靠重排答案顺序**，就让 Vicuna-13B 在 **66/80** 个查询上"击败"ChatGPT。
   - 强度：`strong`
   - **含义**：审查者看到的**内容顺序与呈现方式**本身就会改变结论，与"审查是否客观"无关。
6. **LLM 也会出现"固着"**：arXiv:2602.20408（"Examining and Addressing Barriers to Diversity in LLM-Generated Ideas"）——"LLMs exhibit fixation just as humans do, where early outputs constrain subsequent ideation."
   - 强度：`medium`（预印本）

**小结（支持早审查的最强链条）**：Smith/Ward/Schumacher 1993 证明**指令无法消除锚定** + Jansson & Smith 1991 证明**单次示例暴露就有大效应** + Englich 2006 证明**专家不免疫** + arXiv:2412.06593 证明**LLM 侧提示词缓解无效、需"多角度收集"**。合起来支持"在锚点形成前介入"优于"事后要求审查者保持开放"。


### 3.2 反对"早审查"的证据链

1. **"越早越便宜"的经验基础不成立（最强反证）**：Menzies, Nichols, Shull & Layman, "Are delayed issues harder to resolve? Revisiting cost-to-fix of defects throughout the lifecycle", Empirical Software Engineering, DOI `10.1007/s10664-016-9469-x`，arXiv:1609.04886。verbatim 摘要：
   > "This paper tests for the delayed issue effect in 171 software projects conducted around the world in the period from 2006-2014. To the best of our knowledge, this is the largest study yet published on this effect. We found no evidence for the delayed issue effect; i.e. the effort to resolve issues in a later phase was not consistently or substantially greater than when issues were resolved soon after their introduction."
   并且："DIE is not some constant across all projects. Rather, DIE might be an historical relic that occurs intermittently only in certain kinds of projects."
   - 强度：`strong`（该主题最大样本）
2. **⭐ 连这条曲线的"官方"出处自己都给了反例**：Boehm & Basili 2001, *Computer*, DOI `10.1109/2.962984`（"Top 10 list [software development]"，被引 488）在同一段里既陈述了 100× 的说法，**也**说对小规模非关键系统它"**more like 5:1 than 100:1**"。
   - 强度：`strong`（IEEE Computer；作者即成本曲线传统的代表人物）
   - **含义**：即便是这条曲线的权威出处，其适用范围也被自己限定为**大型关键系统**；把它外推到"AI 工作流的方向决策"是**超出适用范围**。
3. **"延迟评审"确实会漏掉一类问题**：Bacchelli & Bird 2013, ICSE, DOI `10.1109/ICSE.2013.6606617`（"Expectations, outcomes, and challenges of modern code review"，被引 885）——现代代码评审的主要产出是**可读性/风格/小缺陷**，设计层面的问题占比低。
   - 强度：`strong`（Microsoft 现场研究）
   - **含义**："早审查"抓到设计问题的说法，与"评审实际产出什么"的实证不一致：评审抓设计问题的能力本身就被高估。SWRBench（§2.4）独立复现了同一方向："ACR tools are more adept at detecting functional errors"。
4. **加长但无信息量的审查被评为更高质量**：PLOS ONE 2025（§5.1），RCT。说明"审查得更早/更多"这类形式变量会被评估者误读为质量。
5. **"早"意味着上下文更少**：§2.3 的双盲证据显示裁掉信息能减少偏差，但**没有提升质量的证据**。如果早期审查 = 信息更少，那么它并不自动更好。
6. **⭐ 本场景最贴题的反证：早输入买到的是质量，代价是发散。** Doshi & Hauser 2024, *Science Advances*, DOI `10.1126/sciadv.adn5290`：给写作者看**一个 AI 想法**后，个体故事质量提升，但**故事之间的相似度上升**（b = **0.871**, P < 0.001；b = **0.718**, P = 0.003，分别相当于纯人类基线的 **10.7% / 8.9%**）。
   - 强度：`strong`（Science Advances，预注册）
   - **含义**：这是"早输入 = 免费收益"假设的**直接反证**——**存在质量与多样性的权衡**。用户倾向的"早审查以改善发散"很可能实际买到的是一部分质量 + 一部分**同质化**。
7. **⚠ 没有任何研究检验本项目真正关心的那个场景**：检索结论是——**不存在**"审查者同时看到原始需求 + 已选方向 + 收敛大纲，且处于收敛前"这一构型的对照研究。所有证据都是**类比**（设计固着、司法锚定、LLM 顺序偏差、AI 创意同质化），**外推本身是推断而非实证**。
   - 强度：`strong`（作为"证据缺口"的结论）
   - **纪律要求**：本报告与该项目的任何后续引用，都**不能**把上述类比写成"已证明早期审查更好/更差"。


### 3.3 反向证据：过早评估不必然压制发散

- **⭐ Nemeth et al. 2004 的实测数字与直觉相反**：*European Journal of Social Psychology*, DOI `10.1002/ejsp.210`（"The liberating role of conflict in group creativity: A study in two countries"）。**被指示去辩论/批评**的组产生的想法**多于**"不许批评"组和无指示组：组内想法数 **19.78 / 23.65 / 24.82**；总产出 **5.86 / 7.59 / 8.26**；在美国与法国均复现。
  - 强度：`strong`（两国复现，直接对照）
  - **含义**：**"任何早期批评都会压制发散"被直接证伪**。这与"defer judgment 规则"的经典主张冲突，说明该规则缺少稳固实证支持。
- **评估焦虑影响"数量/类别"，但不影响"新颖性"**：*Frontiers in Psychology* 2019, DOI `10.3389/fpsyg.2019.01459`（被引 14）——评估焦虑与他人想法暴露**减少了想法的数量与类别数**，但**明确没有影响新颖性**。
  - 强度：`medium`
  - **含义**：如果目标指标是**新颖性**（发散质量）而不是**数量**，那么"早审查压制发散"的担忧**强度下降**。这是关键的**口径依赖**。
- **设计固着是"权衡"而非"纯害"**：Sio, Kotovsky & Cagan 2015 元分析（*Design Studies*, DOI `10.1016/j.destud.2015.04.004`，被引 173）：示例可能**限制方案多样性**，同时也**提升方案的质量与新颖性**。
  - 强度：`strong`（元分析；**本项目只取得二手引述，未核验其合并效应量**）
- **"他人的想法会窄化你的发散"这一最贴题研究存在但未能核验**：Kohn & Smith, "Collaborative fixation: Effects of others' ideas on brainstorming", *Applied Cognitive Psychology*, DOI `10.1002/acp.1699`（被引 200）。**全文渠道全部被拦截，本报告未取得其数据**，故不作为证据使用，仅登记其存在。
- **"defer judgment"/"no criticism" 这条头脑风暴规则缺少稳固实证，而且机制被指错了**：Diehl & Stroebe 1987, JPSP, DOI `10.1037/0022-3514.53.3.497`（被引 1,339），**四个实验**。实验 3 的结论"raises doubts about **evaluation apprehension** as a major explanation"；实验 4："**production blocking** accounted for most of the productivity loss of real brainstorming groups"。
  - 强度：`strong`（四项汇聚实验，JPSP，该领域权威解释）
  - **含义（对形态设计的直接影响）**：**生产力损失的机制是"结构性的"（发言阻塞），不是"情绪性的"（怕被批评）**。因此对应的修法是**结构性的**——先各自独立生成、再汇总——而不是"请大家先别批评"。这正好是"独立上下文、各自产出、之后合并"这一形态的实证依据。
- **整个设计固着文献无法被汇成一条干净规则**：Vasconcelos & Crilly 2016 的方法学批评指出，25 项可比研究"show great variety in the methods used and the results obtained"。
  - 强度：`medium`

### 3.4 缺陷成本曲线的溯源与适用性（明确不可引用的部分）

**流传说法**："缺陷修复成本在设计阶段 : 发布后 = 1:10:100"（或 1:10:100:1000），常被归于「IBM Systems Sciences Institute」。

**溯源结果（逐环可复核）**：

- 可追溯到的**原始书目**是 Roger S. Pressman《Software Engineering: A Practitioner's Approach》中的一条引用：
  > [IBM81] "Implementing Software Inspections," course notes, IBM Systems Sciences Institute, IBM Corporation, 1981
- Pressman 书中的比值是 **1 : 6.5 : 15 : 60–100**（设计 : 测试前 : 测试中 : 发布后），**不是 1:10:100**。
- Laurent Bossavit（Morendil）的溯源研究结论，verbatim：
  > "the Institute was a corporate training program, not a research body; as such it is inappropriate to cite the source of the ratios as 'an IBM study' or 'a study by the IBM Systems Science Institute', in the total absence of any claim that the Institute was the primary source"
  以及：
  > "the original project data, if any exist, are not more recent than 1981, and probably older; and could be as old as 1967."
  - 来源（一手溯源）：https://gist.github.com/Morendil/ebfa32d10528af04e2ccb8995e3cb4a7
  - 后续"Pressman 比值"专文：https://gist.github.com/Morendil/6d664bf990c17ea0f88f9bb0cc403c64
  - 背景著作：https://leanpub.com/leprechauns
- 该引用链的**放大器**是 2006 年 iSixSigma 的一篇文章（Mukesh Soni, "Defect Prevention: Reducing Costs and Enhancing Quality"），它用主动语态写成"The Systems Sciences Institute at IBM **has reported** that..."，同时**没有引用 Pressman**，从而把"课程笔记里的说法"升级成了"IBM 的研究结论"。Bossavit 另外指出该说法内部算术不自洽。
  - 强度：`strong`（作为"该数字不可引用"的结论）
- **旁证（独立于 Bossavit 的公开质疑）**：Hillel Wayne, "I ❤️ Science"（https://buttondown.email/hillelwayne/archive/i-ing-hate-science/）；The Register, 2021-07-22, "Bugs expense bs"（https://www.theregister.com/2021/07/22/bugs_expense_bs/）。两者均记录了同一条无法溯源的引用链。`medium`（二手，但独立）
- **Fagan 1976 到底测了什么**：IBM Systems Journal, DOI `10.1147/sj.153.0182`（被引 1,072）是一份 **IBM 经验报告**：审查的缺陷检出效率 **82%**、程序员节省 **25%**、每 KLOC 错误数比 walkthrough 对照组少 **38%**。但它**没有随机化、没有对照组设计**，并且它**直接断言**了成本前提而非测量成本比。
  - 强度：`medium`（作为"审查流程有效性"的证据）；`weak`（若被当作成本曲线证据）
  - **纪律**：把它当作"跨阶段修复成本比"的证据是**偷换**。
- **更好的可引用替代**：
  - Boehm & Basili 2001, *Computer*, DOI `10.1109/2.962984`——同一段里既给出 100× 说法，**也**承认对小系统"more like 5:1 than 100:1"。
  - Menzies et al. 2017（见 §3.2）——**未发现**延迟修复效应（171 项目）。

**本节结论**：`1:10:100` 与其同族比值（`1:6.5:15:60-100`）**不应作为证据引用**；`1:10:100` 甚至在数值上都不是原始形式。可以引用的替代表述是"该曲线在文献中广泛流传但溯源不支持"。

---

## 4. advisory-only 审查的有效性、采纳率与审查疲劳

### 4.1 主流工具的默认形态：全部 advisory（厂商一手文档，7/7）

**核验结果：7 个工具/平台中 7 个默认不阻断；阻断一律是显式 opt-in。**

| 工具 | 默认行为 | 阻断如何开启 | 强度 |
|---|---|---|---|
| **GitHub Copilot code review** | 默认只留 `Comment` review，不是 `Approve` 也不是 `Request changes`；"Approvals are off by default"；**不计入必需批准** | 需另配 "Optional merge gating with rulesets" | `strong` |
| **GitHub 平台本身** | 无任何默认阻断 | 必须在 branch protection 里开启 "Require status checks" / "Require conversation resolution" | `strong` |
| **CodeRabbit** | request-changes 工作流"is **disabled by default**" | 需在 `Reviews → Behaviour → Request changes workflow` 显式启用 | `strong` |
| **Greptile** | "Posts findings … as PR comments with suggested fixes" | auto-approve 是 **opt-in BETA**，仅 5/5 low-risk，文档写"Do not enable it broadly" | `strong` |
| **SonarQube / SonarCloud** | quality gate 计算 pass/fail | 文档措辞为"It **can be used to** block the merge"——强制由使用者负责 | `strong` |
| **Codacy** | 默认 gate policy 自动应用 | 但"report the pull request status … and **optionally** block merging" | `strong` |
| **Semgrep** | 三种模式 Monitor / Comment / Block；默认规则集从 **Monitor** 起步——**finding 根本不出现在 PR 上** | 需显式改 rule mode 为 Block（退出码 1） | `strong` |
| **Amazon CodeGuru Reviewer** | 仅 PR 评论，无阻断；且**对新用户已停用**："As of November 7, 2025, you can't create new repository associations" | 不适用 | `strong` |

- 来源：各厂商官方文档（GitHub Docs、docs.coderabbit.ai、greptile.com/docs、docs.sonarsource.com、docs.codacy.com、semgrep.dev/docs、aws.amazon.com/codeguru）
- **GitHub Copilot 文档另外给出审查疲劳的机制证据**（同一页）：
  > "When re-reviewing a pull request, Copilot may repeat the same comments again, even if they have been dismissed with the 'Resolve conversation' button or downvoted with the thumbs down (👎) button."
- 且 Copilot 对每条评论标注 `High`/`Medium`/`Low` 严重度——即"严重度分级"是内置形态。
- **⚠ 与上游说法的一致性**：上游称"5 个主流 AI 审查工具全部默认 advisory"。本轮独立核验了 **7 个**，结论**一致**（7/7 默认不阻断）。可引用；但引用时应说明是"逐厂商文档核验"，而不是笼统的"业界共识"。

### 4.2 采纳率：审查意见被采纳的比例（本节是全报告对 advisory-only 最不利的一节）

- **⭐⭐ 最强的一组数字：AI 审查意见的采纳率比人类审查低一个数量级。** "How Effective Are AI-Based Code Review Actions?"（TSE 2026；已于本轮下载并读取 PDF 原文）。**16 个 AI 代码审查 GitHub Action、718 个匹配仓库中 178 个成熟仓库（≥50 PR）、共 22,326 条 AI 生成审查评论**：
  > "the addressing rate of AI-generated review comments (**0.9%–19.2%**) still lags behind human review comments (**60%**). Overall, hunk-level review actions exhibit a higher addressing rate (**6.5%–19.2%**) compared to file-level actions (**0.9%–4.2%**)."
  另外：**37.1%** 的成熟仓库声明了 action 却**没有产生任何评论**（声明与使用之间存在落差）。
  - 来源：https://assets.empirical-software.engineering/pdf/tse26-ai-code-review.pdf（本轮已下载 2.65 MB PDF 并提取原文）
  - 强度：`strong`（大样本、真实仓库、两阶段分类框架）
  - **含义**：**这是"advisory-only"最直接的坏消息**——不是"意见被讨论"，而是**只有 1%–19% 的 AI 审查意见最终导致代码改动**（人类审查为 60%）。
- **不采纳时发生了什么（同一研究）**：对 50 条"未被采纳"的 AI 评论的开发者回复分类：
  > **Defending the Change 64%**（开发者解释为何不采纳 AI 建议）、**Prompting Reflection 14%**、Assessing Tool Capabilities 12%、Willingness to Follow 10%。
  - **含义**：不采纳**不是沉默忽略**，而是**被明确反驳**（64%）。约 **14%** 确实触发了反思——即 advisory 审查**确实会引发讨论**，但讨论结果多为"维持原实现"。
- **人类审查内部：高遵从率，但很少发现 bug。** Sadowski et al. 2018, *ICSE-SEIP*, DOI `10.1145/3183519.3183525`（Google，**900 万次 reviewed changes**）：
  > "**>80% of all changes involve at most one iteration of resolving comments**"（人类建议遵从率很高）；但在 44 名受访者中，**"Only 2 respondents said the comments had found a bug"**。
  - 强度：`strong`
- **人类审查的产出构成：主要是改进建议，不是缺陷。** Bacchelli & Bird 2013, ICSE, DOI `10.1109/ICSE.2013.6606617`（570 条评论）：
  - 缺陷类评论仅排**第 4**（78 条 = **14%**）；代码改进类 **165 条 = 29%** 为最主要产出。
  - 强度：`strong`
  - **含义**：把"审查"当作"发现方向性/缺陷性问题"的机制，与人类审查的实际产出结构不符（与 §3.2、SWRBench 互相印证）。
- **"更好决策"与"更高接受度"在经典研究中是分离的**：Schweiger et al. 1986/1989（§2.1）——对抗式审查提高论证质量但**降低接受度**。`medium`
- **AI 审查的偏好受"熟悉度"与"PR 严重度"调节**：arXiv:2505.16339（WirelessCar 现场研究 + 现场实验）verbatim："AI-led reviews are overall more preferred, while still being conditional on the reviewers' familiarity with the code base, as well as on the severity of the pull request."；同期记录的顾虑是"false positives and trust issues"。`medium`

### 4.3 审查疲劳 / 警报疲劳的量化证据

| 数字 | 出处 | 强度 |
|---|---|---|
| 临床警报被 override 的比例 **49%–96%**（例外：高等级过量警报 27%） | van der Sijs et al. 2006, JAMIA, DOI `10.1197/jamia.M1809`（被引 881） | `strong` |
| 两项研究中 **36.5% / 39%** 的警报是**假阳性** | 同上 | `strong` |
| **override 率在 5 年内从约 50% 升到 75%**（遵从度下降） | 同上 | `strong`（**时间维度的信任衰减**） |
| "overriding did not result in adverse drug events in **more than 97%** of cases" | 同上 | `strong`（**误报主导**是 override 的合理原因） |
| 接受率随**每次就诊的提醒数量**增加而下降约 **30%**；重复提醒每增加 5 个百分点，接受率再降约 **10%** | Ancker et al. 2017, *BMC Med Inform Decis Mak*, DOI `10.1186/s12911-017-0430-8`（被引 584） | `strong` |
| ⚠ **反证：新部署的提醒并未随时间推移出现响应率下降** —— 即"疲劳"的驱动因素是**重复与数量**，不是**时间流逝** | 同上（Ancker 2017） | `strong` |

- **机制读法（重要的口径修正）**：van der Sijs 给出"5 年 50%→75%"这一时间维度的观察，但 **Ancker 2017 用 112 名临床医生的数据反驳了"时间导致衰减"的解释**，把驱动因素定位为**提醒的重复度与单次就诊的提醒总量**。
  - 因此"审查疲劳随时间自然增长"这一说法**不应引用**；可引用的是"**重复/数量**会显著降低接受率"。
- **静态分析与信任丧失（advisory 的天花板）**：Google **Tricorder**（ICSE 2015）：对**建议性（advisory）** 的审查期 finding，**有效误报率必须 <10%**；对**会阻断构建**的 finding，要求 **≈0%**；精确率门槛 ≥90%；并明确写道"warnings shown when building are often ignored"、"this trust is **quickly lost**"。
  - 强度：`strong`（Google 一手工业报告）
  - **含义**：**这是"advisory-only"最强的一条反对证据**——Google 的结论不是"advisory 就够了"，而是**两层设计**：advisory 配 <10% 误报预算，阻断配 ≈0% 误报预算。任何 advisory-only 设计都必须回答"误报预算设在哪"。
- **开发者不使用静态分析的原因（机制，无百分比）**：Johnson et al. 2013, ICSE, DOI `10.1109/ICSE.2013.6606613`：20 名开发者中 **14 名**把**假阳性**与**输出呈现方式**列为采纳障碍。
  - 强度：`medium`（小样本定性；**该文未给出百分比结论**）
- **评审者工作负载与缺陷的关联**：McIntosh et al. 2014, MSR, DOI `10.1145/2597073.2597076`（Qt/VTK/ITK）：低 review coverage / participation 的变更，**发布后缺陷多出最多 2 个和 5 个**；coverage 低于 0.29（VTK）/ 0.6（Qt）时至少 1 个缺陷。
  - 强度：`strong`（关联）；`medium`（因果）
  - **⚠ 缺口**：**"多少条评论之后开发者开始忽略"这一 workload 阈值，本轮未找到任何研究**。

---

## 5. meta-review / review-of-reviews

### 5.1 最强的一手证据：NeurIPS 2022 审查质量评估 RCT

**"Peer reviews of peer reviews: A randomized controlled trial and other experiments"**，PLOS ONE 2025，DOI `10.1371/journal.pone.0320444`。

- 设计：NeurIPS 2022，(meta)-reviewers 与作者被邀请自愿评估已提交论文所收到的审查。
- RCT：把审查**人为加长**（加入大量**无信息量**内容），对照组看原审查，实验组看加长版。
- 结果（verbatim，来自摘要）：
  > "We find that lengthened reviews are scored (statistically significantly) higher quality than the original reviews."
  > "we find that authors are positively biased towards reviews recommending acceptance of their own papers, even after controlling for confounders"
  > "We also measure disagreement rates between multiple evaluations of the same review of **28% – 32%**, which is comparable to that of paper reviewers at NeurIPS."
  > "Our results suggest that the various problems that exist in reviews of papers – inconsistency, bias towards irrelevant factors, miscalibration, subjectivity – also arise in reviewing of reviews."
- 强度：`strong`（RCT + 大规模观察数据）
- **对本调研的含义**：给审查**再加一层审查**并不能自动净化审查质量；被加进来的那一层会继承同样的偏差（长度偏好、立场偏好、分歧、主观性）。

### 5.2 最强的"meta-review 有效"证据：ICLR 2025 大规模 RCT

**"A large-scale randomized study of large language model feedback in peer review"**，*Nature Machine Intelligence* 2026，DOI `10.1038/s42256-026-01188-x`。

- 干预：**Review Feedback Agent**，"a system leveraging **multiple large language models** to improve review clarity, specificity and actionability by providing automated feedback on vague comments, content misunderstandings and unprofessional remarks **to reviewers**"。
- 规模：ICLR 2025，**20,000+ 篇评审**的随机对照研究。
- 结果（verbatim，摘要）：
  > "**27%** of reviewers who received automated feedback updated their reviews, incorporating over **12,000 suggestions**."
  > "Blinded evaluation confirmed that revised reviews receiving feedback were **more informative**."
  > "The intervention led to substantially longer reviews (**80 additional words** among updaters) and increased engagement during rebuttals, with **6% longer** author responses and **5.5% longer** reviewer replies."
- 强度：`strong`（Nature 系列，20,000+ 评审的 RCT）
- **⚠ 但必须与 §5.1 并读**：(a) 本干预的目标是**清晰度/具体性/可操作性**（针对"模糊评论、内容误解、不专业措辞"），**不是**判定审查质量或正确性；(b) "更长"在本研究里被当作**正面**指标，而 §5.1 的 RCT 恰好证明"更长"会被**误判为更高质量**——两项研究的"长度"含义相反，不能互相印证；(c) 它用的是**多个 LLM**，即干预本身是异源的。
- **结论**：meta-review 的**有效形态是"改进审查的表述质量"**，而不是"判定审查的质量高低"。

### 5.3 同行评审质量干预的系统综述

**Bruce et al. 2016, BMC Medicine**，DOI `10.1186/s12916-016-0631-5`（"Impact of interventions to improve the quality of peer review of biomedical journals: a systematic review and meta-analysis"，22 项 RCT，被引 180）。详细数字见 **§5.6**。`strong`

### 5.4 编辑同行评审本身的有效性：Cochrane 综述

**Jefferson et al., "Editorial peer review for improving the quality of reports of biomedical studies"**，DOI `10.1002/14651858.MR000016.pub3`。

verbatim：

> "At present, little empirical evidence is available to support the use of editorial peer review as a mechanism to ensure quality of biomedical research. However, the methodological problems in studying peer review are many and complex. At present, the absence of evidence on efficacy and effectiveness cannot be interpreted as evidence of their absence."

同一综述中与 §2.3 直接相关的两条：

> "no evidence of effect of the well-researched practice of reviewer and/or author concealment on the outcome of the quality assessment process (9 studies)"
> "There is no evidence that referees' training has any effect on the quality of the outcome (1 study)."

- 强度：`strong`（Cochrane 系统综述）
- **注意措辞纪律**：作者明确写了"absence of evidence ≠ evidence of absence"。引用时**不能**写成"同行评审无效"。

### 5.5 冗余审查者的边际价值，以及"单个审查者"的可靠性上限

- **评审人之间的一致性本身就是低的（比上面的 grant review 更广的证据）**：Bornmann, Mutz & Daniel 2010, *PLoS ONE* 5(12):e14331, DOI `10.1371/journal.pone.0014331`（"A Reliability-Generalization Study of Journal Peer Reviews: A Multilevel Meta-Analysis of Inter-Rater Reliability and Its Determinants"，被引 178）。**48 项研究、70 个信度系数、19,443 份稿件**（平均每项研究 311 份）。结论 verbatim：
  > "According to our meta-analysis the IRR of peer assessments is **quite limited** and needs improvement (e.g., reader system)."
  > "Studies that report a **high** level of IRR are to be considered **less credible** than those with a low level of IRR."
  - 来源：https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0014331（已核验；**原文的均值以公式/图片给出，本报告未能提取精确数值**——具体 ICC ≈0.34 / κ ≈0.17 的说法请勿直接引用）
  - 强度：`strong`（作为"评审人一致性低"的结论）；`medium`（若引用具体系数）
  - **旁证**：ACL 2023 的 Krippendorff α（soundness）≈ **0.233**；PeerRead（arXiv:1804.09635）记录 NIPS 2014 的**两个独立委员会在 >25% 的接收/拒绝决策上不一致**。
  - **含义**：**"再加一个独立审查者"不会自动买到可靠性**——因为可靠性瓶颈在评审人一致性，而一致性很低。
- **单评审人的可靠性远低于常规可接受线（grant review 域）**：Hesselberg et al. 2025, *PLoS ONE* 20(5):e0322696, DOI `10.1371/journal.pone.0322696`（registered report protocol，其文献综述汇总）：
  > "One of the first studies that assessed the agreement of grant peer review found single rater intraclass correlations between **0.17 and 0.37**"
  另有：奥地利科学基金 23,414 条评分的 ICC = **0.26**；挪威某基金的 ICC = **0.29**。常规可接受阈值为 **0.75**；按 Spearman–Brown 推算，达到该阈值需要 **6–15 名评审人**。
  - 来源：https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0322696（已核验 HTTP 200）
  - 强度：`strong`（对"单个审查者 ICC"的汇总；注意这是 protocol 的文献综述而非新实验）
  - **含义**：**"一个审查者"在可靠性意义上几乎不构成"审查"**。这既支持"多审查者"的必要性，也说明**单个审查者的输出只能被当作"一条意见"**。
- **⭐ 冗余的价值是"有调节变量的"，不是无条件的**：Waffenschmidt et al. 2019, *BMC Medical Research Methodology*, DOI `10.1186/s12874-019-0782-0`（single vs double screening，被引 479）。**单次筛选漏掉中位数 5% 的研究（范围 0–58%）**；但**专家单筛漏 3%、无经验者单筛漏 13%**；在 7 个影响评估案例中有 3 个会改变结论。
  - 强度：`strong`
  - **含义**：第二个审查者的边际价值**强烈依赖审查者的经验水平**——对新手价值大，对专家接近 0。对 LLM 审查的类比含义：**"再加一个审查者"的收益取决于它与第一个审查者的能力/偏差差异，而不是"多一个"本身**。
- **AI 审查工具的能力缺口**：SWRBench（arXiv:2509.01494）"ACR tools are more adept at detecting functional errors"——即现有 AI 审查**偏向功能错误**，对方向性问题能力更弱。`medium`

### 5.6 同行评审质量干预：训练无效，但"换一种审查者"和"问责"有效

- **Bruce et al. 2016, *BMC Medicine*, DOI `10.1186/s12916-016-0631-5`（22 项 RCT 的元分析，被引 180）**：
  - **对评审人做培训 → 不改善审查质量**；**checklist → 不改善稿件**；
  - **开放同行评审（问责）→ 有帮助，SMD 0.14**；
  - **增加一名统计审查者 → 有帮助，SMD 0.58**（远大于培训）。
  - 强度：`strong`
  - **含义（对 meta-review 的直接含义）**：**"把审查者训得更好"失败，"加一个不同类型的审查者"成功**。这与 CriticGPT 的"人机混合批评者"结论方向一致。
- **Schroter et al. 2004, *BMJ*, DOI `10.1136/bmj.38023.700775.AE`（RCT，被引 200）**：培训使质量评分 2.56 → 2.85（差 **0.29**，CI 0.14–0.44），但作者判定"**not of editorial significance and was not maintained in the long term**"。
  - 强度：`strong`
  - **含义**：即使培训有统计显著效果，**幅度也不具编辑意义且不持久**。这是"审查者也被审"（通过培训）最直接的失败证据。
- **meta-review 确实会改变决策（但无准确性反事实）**：ACL 2023 PC report（https://aclanthology.org/2023.acl-long.911.pdf）记录："despite noisy scores and high disagreement, the mechanism of ACs and SACs does '**rescue**' many papers with one negative review"。
  - 强度：`strong`（作为"决策被改变"的事实）
  - **⚠ 关键限定**：**没有准确性反事实**——我们不知道被"救回"的论文是否本该被接收。引用时不能写成"meta-review 提高了决策质量"。
- **CriticGPT 的 meta-review 形态是"不同批评者的集成"，不是"更好的批评者"**：arXiv:2407.00215——模型批评在 **63%** 的情况下比人类批评更受偏好；在标为 "flawless" 的数据上，**有批评时发现"降低评分的问题"24%，无批评时仅 6%**；但批评者会**幻觉 bug**；且"human-machine teams of critics and contractors catch **similar numbers** of bugs to LLM critics while **hallucinating less**"。
  - 强度：`strong`
  - **含义**：**meta-review 的有效形态是"引入一个不同来源的批评者来压制幻觉"，不是"给审查者打分/排名"。**


---

## 6. 反证与失效条件

> 本节是报告的核心之一。以下每一条都是"让独立异源审查失效或变有害"的已证机制。

### 6.1 同源/相关错误的盲点

- **自我识别 → 自我偏好（线性）**：Panickssery et al. 2024（arXiv:2404.13076）。同源审查者不仅偏好自己的产出，而且**越能识别出"这是我的"就越偏好**；GPT-4 自我识别准确率 **73.5%**。`strong`
- **⭐ 相关错误跨越厂商与架构边界**：Kim et al., ICML 2025（arXiv:2506.07962），350+ LLM。"larger and more accurate models have **highly correlated errors, even with distinct architectures and providers**"；"models agree **60%** of the time when both models err"（随机基线 1/3）；同厂商模型间相关性更高，且"relative self-preferencing can occur across different models from the same family"。`strong`
  - **这是"异源"最强的一条反证**：如果错误来自共享的训练语料/共享的对齐过程，那么换厂商并不能买到独立性；而换厂商能买到的只是"不同但同样相关的先验"。
- **生成的强不等于理解的强**：Generative AI Paradox（arXiv:2311.00059）。若审查被当作"验证"，则"生成强 ⇒ 审查强"的推理不成立。`strong`
- **投票定理在相关投票下失效**：Ladha 1992, *American Journal of Political Science* 36(3), DOI `10.2307/2111584`。**错误越相关，聚合收益越小**——理论上这是"跨厂商"的立足点，但 2506.07962 表明**实证上厂商边界并不提供足够的独立性**。`strong`（理论）
- **多样性坍缩**：arXiv:2604.18005（ACL 2026 Findings）——"stronger, highly aligned models yield diminishing marginal diversity"；"dense communication topologies accelerate premature convergence"；坍缩来自**交互结构**而非模型不足。`medium`
- **审查者输出同质化**："Do AI Reviewers Converge?"（OpenReview `NdDKcU9HlU`；1,943 篇人类评审 vs 10,172 篇 LLM 评审，5 个 LLM，509 篇 ICLR 论文）：LLM 评审"substantially more praise-heavy, and more semantically similar across unrelated papers"。
  - 强度：`medium`（**仅取得摘要**；OpenReview 全文被反爬拦截，未能核验正文）
- **多样性指标与增益关系弱**：Kuncheva & Whitaker 2003，DOI `10.1023/A:1022859003006`，秩相关仅 0.08–0.30，极端可为负。`strong`

### 6.2 审查本身会引入损害

- **幻觉缺陷（hallucinated bugs）**：CriticGPT（arXiv:2407.00215）明确记录批评者会编造听起来合理的 bug，"could mislead humans into making mistakes they might otherwise have avoided"。**人机混合审查队伍在幻觉更少的同时抓到的 bug 数量与纯 LLM 批评者相近**——即压制幻觉需要额外的人力结构。`strong`
- **"非对称自审"（小模型当批评者）把代码改坏**："One Step Forward, Two Steps Back: Regression Errors and Cost Inefficiencies in LLM Iterative Refinement for Code Generation"，ICLR 2026（OpenReview `LeFnGXqPhG`）：在 LiveCodeBench 上"the framework fails to reliably improve Pass@1 scores and **often degrades them** due to **hallucination-induced regression errors**. Critics **hallucinated flaws in functionally correct code**, prompting the actor to introduce bugs into valid solutions… **exacerbated by smaller critics**."
  - 强度：`medium`（**仅取得摘要**；OpenReview 全文被反爬拦截。这是"弱审查者有害"最直接的一条，但**未能核验正文数字**）
  - **含义**：弱审查者不只是"效果差"，它会产生**幻觉缺陷**并驱动下游引入**真实缺陷**——即负收益。
- **⚠ 更弱的执行者 + 更详细的审查 = 灾难性回归（"overreach"）**：Imbue, "How AI code review can make correct code worse", 2026-04-29, https://imbue.com/blog/2026-04-29-how-ai-code-review-can-make-correct-code-worse（已核验 HTTP 200；下列数字逐条核对原文）。
  - 对照实验：取 **15 个 implementer 已完全通过全部测试的任务**，跑代码审查后让 fixer 处置。**reviewer 在 15 个正确任务中的 8 个上提了问题**（`test_coverage` 6 个："Add tests for this new functionality"；`logic_error`/`runtime_error_risk` 2 个）。
  - 单任务对照（SWE-bench Pro，`instance_ansible__ansible-4c5ce5a1`）：Opus implementer **16/17**；Claude Code Review 提了 3 个质量问题（selinux ctypes 内存泄漏 / 双句号 typo / 死代码）。随后交给 **Sonnet fixer**：
    - **summary-only**（把评论从 >6k 字符裁到 <1k）：新增 `freecon()`、改 typo、删死代码，**4 行源码改动，分数不变 16/17**（p2p 7/8，f2p 9/9）。
    - **full details**（保留 `<details>` 推理，>6k 字符）：**"Restructured the selinux integration across 8 files with 113 lines, resulting in a score of 8/17; all 9 f2p tests now fail. Δ=-8."**
  - 作者命名该现象为 **overreach**："the extended bug analysis gives Sonnet enough context to invent its own approach and get it wrong."
  - 强度：`weak`–`medium`（厂商自建实验，n=15 对照 + 单任务深挖；非同行评审，但公开了 diff 与可复核数字）
  - **含义**：**审查的"详细程度"本身是一个危险变量**：把完整推理细节交给较弱的执行者会诱发 overreach。这条同时是 §2/§3（prompt 设计）的重要反证。
- **自我纠正导致性能下降**：Huang et al. 2024（arXiv:2310.01798）——无外部反馈时"performance even degrades after self-correction"（GPT-3.5 CommonSenseQA 75.8→38.1）。`strong`
- **无信息量的长度被误判为质量**：PLOS ONE 2025（§5.1）——加长审查被评为显著更高质量。**审查形式（长度、篇幅）会污染对审查质量的判断**。`strong`
- **系统性过度纠正（overcorrection）**："Are LLMs reliable code reviewers? systematic overcorrection in requirement conformance judgement", *Automated Software Engineering* 2026, DOI `10.1007/s10515-026-00638-5`。verbatim：LLMs "frequently misclassify correct code implementation as non-compliant or defective"；且"more detailed prompt design, particularly with those requiring explanations and proposed corrections, leads to higher misjudgment rates"。
  - 强度：`medium`
  - **含义**：审查者会对**正确的产出**报缺陷；而且**越要求它解释和提修正，误判越多**。这是"审查有害"最直接的一手证据，且方向与"让审查者给替代方案"的做法相反。
- **AI 审查工具偏功能错误，不偏方向错误**：SWRBench（arXiv:2509.01494）"ACR tools are more adept at detecting functional errors"。若把方向性判断交给这类审查形态，能力与任务不匹配。`medium`
- **人类专家评审同样漏检严重问题**：Schroter et al. 2008, *J R Soc Med*（RCT，**607 名 BMJ 评审人**，每篇测试稿植入 **9 个重大 + 5 个次要**方法学错误）。verbatim："At baseline (Paper 1) reviewers found an average of **2.58 of the nine major errors** (SD 1.9) … The mean number of errors reported was similar for the second and third papers, 2.71 and 3.0, respectively."；"The interventions had small effects."（即培训几乎无用）
  - 来源：https://www.bmj.com/sites/default/files/attachments/resources/2011/07/what-errors-do-peer-reviewers-detect.pdf（**直连返回 403，须经 `r.jina.ai` 读取**；本报告已通过该途径逐字核验）
  - 强度：`strong`（RCT，607 人，三个测试稿）
  - **含义**："审查能发现问题"这一前提在人类专家身上本身就很弱（约 29% 的重大错误检出率）；把审查当作可靠的质量机制是错的。

### 6.3 多主体讨论的增益被高估

- **MAD 的增益可被"单主体 + 强提示"复现**：arXiv:2402.18272（"Rethinking the Bounds of LLM Reasoning"）。`strong`
- **独立复现：MAD 不可靠地优于自一致性**：arXiv:2311.17371（"Should we be going MAD?"）——"multi-agent debating systems, in their current form, do not reliably outperform other proposed prompting strategies, such as self-consistency and ensembling using multiple reasoning paths"。`strong`
- **"多数压力压制独立纠正"**：arXiv:2511.07784（2025）——"majority pressure suppresses independent correction"。`medium`
- **"早审查必然压制发散"不是定论**：Nemeth et al. 2004，DOI `10.1002/ejsp.210`——冲突可以**促进**发散思维。`medium`

### 6.4 本轮明确未找到证据的缺口（不得编造）

1. **"reviewer 弱于 writer = −8.6pp" 的一手来源**：未找到。
2. ~~跨厂商模型的错误相关性对照~~ → **本轮已找到**：arXiv:2506.07962（ICML 2025，350+ LLM）测的就是跨厂商/跨架构的错误相关性。**但它给出的是反证而非支持**：不同架构与不同厂商的大模型错误仍高度相关（详见 §1.5、§6.1）。**仍缺**的是"厂商边界 vs 同厂商边界"的**成对效应量**（论文给出的是相关性的驱动因素排序，不是"A 厂商 vs B 厂商"的边际对比）。
3. **"要求审查者产出替代方案" vs "要求审查者挑错"的对照实验**：未找到；只有**反向**证据（DOI `10.1007/s10515-026-00638-5`：要求解释与修正 → 误判率更高）。
4. **"多数投票" vs "全量收集（并集）"在捕获罕见问题上的对照**：未找到。
5. **"早期审查（未收敛）vs 晚期审查（草案已成）"的直接 A/B**：未找到以"CARD-07 式审查"为对象的对照研究；现有证据只能由锚定/design fixation/成本曲线三组间接证据拼合。
6. **审查疲劳在代码评审场景的量化阈值**（几条评论之后开发者开始忽略）：未找到可靠阈值数字。
7. ~~"误报率 → 信任衰减"的函数形式~~ → **本轮部分找到**：Ancker et al. 2017（DOI `10.1186/s12911-017-0430-8`）给出**按"每次就诊提醒条数"的线性效应**（每条 −30%；重复率每 +5pp 再 −10%），并**否定**了"随时间衰减"。**仍缺**的是"**误报率**"（而非提醒数量）到信任的直接函数。
8. **"要求审查者产出替代方案"会提高还是降低误判率的完整机制**：只有 DOI `10.1007/s10515-026-00638-5` 一条 2026 年研究给出"要求解释与修正 → 误判率更高"，被引尚低，**需要独立复现**。
9. **SWRBench 的 "multi-review aggregation" 是否跨模型**：摘要未说明聚合的是**同模型多次采样**还是**跨厂商模型**；这决定了它能否作为"异源聚合"的证据。**引用前必须读全文确认。**
10. **两份 OpenReview 论文的正文**（ICLR 2026 `LeFnGXqPhG`；"Do AI Reviewers Converge?" `NdDKcU9HlU`）：被反爬拦截，本报告只取得摘要级信息，**引用时须标注"摘要级"**。
11. **"reviewer 与 writer 能力差"的剂量-反应研究**：未找到。现有最接近的是 critic-vs-**judge**（arXiv:2605.27483）与 judge-vs-**被评模型**（arXiv:2601.19532），**都不是** reviewer-vs-writer。
12. **没有任何研究把审查意见分成"改变方向"与"行级修改"并分别测采纳率**：这是 Q5"方向性建议是否被采纳"的直接证据缺口，现有结论靠三角互证（TSE 2026 的整体采纳率 + Bacchelli & Bird 的评论类型分布）。
13. **没有任何研究把 meta-review 用在 AI 代码审查上**：全部 §5 证据借自生物医学同行评审、系统综述筛选与 LLM 批评研究。
14. **"多数投票 vs 全量/并集收集"在捕获罕见问题上的直接对照**：未找到（最接近的是 arXiv:2605.29800、arXiv:2510.01499 与 pass@k 类证据）。
15. **"要求列出被否方案及理由"这条具体提示**：**无任何受控研究**；最接近的是 Dhami 2019 的**对照组本身就在做这件事**且与强制 ACH 打平。
16. **Sio et al. 2015 的合并效应量**：付费墙，仅有二手引述；**Kohn & Smith 的 collaborative fixation**（DOI `10.1002/acp.1699`）全文全部渠道 403，未取得数据。
17. **Jansson & Smith 1991 的推断统计量**：本报告引用的百分比来自镜像扫描件的 OCR 描述性均值，**推断统计未核验**。
18. **Tomkins 2017 与 Le Goues 2018 对同一 WSDM 研究给出的倍数冲突**（1.63/1.58 vs 1.76/1.67）：**未解决**，引用时须注明版本。


### 6.5 失效条件清单（何时不该跑审查 / 审查会失效）

- 审查者已经看到"已选方向"，而**上下文里没有任何反锚定结构**（多个独立角度）→ 锚定 + 谄媚会把审查推向确认。`medium`–`strong`
- 审查被要求"找错"而非"给替代"→ 能力上更接近"定位错误"，而"LLMs cannot find reasoning errors"（arXiv:2311.08516）。`strong`
- 审查产出被当作**质量分数**而非**事实清单**→ 长度/形式偏好会污染评估（§5.1）。`strong`
- 同源审查（同模型自审）→ 自我偏好 + 共享先验。`strong`
- 审查意见**无出处锚点**（无法定位到材料行号）→ 幻觉缺陷不可验证。`strong`（CriticGPT 的幻觉 bug 问题）
- 警报/评论**重复且不可抑制**（Copilot 文档记录 dismissed 后仍会重复）→ 审查疲劳。`medium`（厂商文档）
- 审查**只在很晚的阶段跑**且被期望发现方向问题 → 与"评审实际产出低层级问题"的实证冲突（Bacchelli & Bird 2013）。`strong`
- **审查输入包含"已选方向"且上下文里已有示例/示范** → MAD 的增益条件消失（arXiv:2402.18272："only when there is no demonstration in the prompt"）。`strong`
- **把审查产出组织成"多轮互相可见的讨论"** → 交互结构本身会加速过早收敛（arXiv:2604.18005）。`medium`
- **把完整审查推理细节交给较弱的执行者** → overreach/回归（Imbue 2026；16/17 → 8/17）。`weak`–`medium`
- **假设"换厂商就买到了错误独立性"** → 实证上不成立（arXiv:2506.07962）。`strong`

---

## 7. 对 CARD-07 的可落地含义（只列「有哪些做法可选」，不排序、不推荐）

> 本节按要求**只列出可选做法**，不做推荐、不排序、不给出 CARD-07 的具体设计建议。

**关于"审查者强弱"**
- 可选：不对 reviewer 与 writer 设定强制强弱序，只要求**记录**两者的 provider/model 身份，使强弱关系成为可观测事实。
- 可选：把"审查者是否强于 writer"作为**分层条件**（收集该维度的事实），而非门禁。
- 可选：在弱审查者场景下，把产出定位为"不同先验带来的候选视角"，而非"权威判定"。
- 可选：把"审查者是否强于 writer"与"审查者承担的是**判定**职责还是**视角**职责"分开登记（现有证据表明强弱规则只在 critic-vs-judge 类判定场景被验证）。
- 可选：记录审查者与 writer 是否同厂商/同基座，作为"错误相关性"的代理事实。

**关于"审查用于发散"的形态**
- 可选：对抗式（red team / devil's advocate）——产出攻击性/反驳性清单。
- 可选：替代式（alternative-generating）——要求产出替代方向而非缺陷清单。
- 可选：聚合式（多审查者）——多数投票 / 并集收集 / 面板式（不同模型族）三种子形态。
- 可选：盲化式——裁剪作者/来源信息；裁剪或不裁剪"已选方向"。
- 可选：混合式——多人机混合（LLM 批评者 + 人类过滤幻觉）。
- 可选：独立并行（各审查者互不可见）vs 多轮互看讨论——两种交互结构在"多样性坍缩"证据下有不同的预期表现。

**关于 prompt/协议设计**
- 可选：要求"至少 N 个替代方案"。
- 可选：要求"列出被否方案及理由"。
- 可选：要求"指出缺失的选项类别/维度"。
- 可选：要求"每条意见必须带材料锚点（文件+行号）"。
- 可选：显式提供"多角度收集"结构（多次独立收集再合并），以对抗锚定。
- 可选：把"审查者不得复述已选方向"写成显式约束。
- 可选：不设产出形式（长度/条数）下限，以免形式偏好污染质量判断。
- 可选：限定审查产出的**详细程度**（摘要级 vs 完整推理细节）——现有证据显示详细程度会影响下游执行者的行为。
- 可选：要求审查者的"修正建议"必须可被判据/测试证伪（Fix-guided verification 形态），而非只作为文本建议。

**关于时机**
- 可选：只在发散之后跑一次。
- 可选：只在草案已成之后跑一次。
- 可选：两处都跑（发散后 + 草案后），并记录两次的产出差异。
- 可选：在发散后跑，但**不把已选方向**放进审查输入。
- 可选：在发散后跑，且**把未收敛的选项空间**放进审查输入。
- 可选：把审查产出单独保存为"未采用候选池"，与最终方向分开记录。
- 可选：记录审查意见的"锚点敏感度"事实（同一审查在给/不给已选方向两种输入下的产出差异）——作为一种自测形态。

**关于 advisory-only**
- 可选：审查产出只作为事实记录，不进入任何 pass/fail 判定。
- 可选：记录"采纳/不采纳 + 理由"，作为事实而非质量分数。
- 可选：为不采纳的审查意见保留原始 provenance（不被摘要覆盖）。
- 可选：对审查意见做去重/抑制重复，以降低审查疲劳。
- 可选：对审查意见做严重度标注，但不据此改变阻断语义。

**关于 meta-review**
- 可选：不做 meta-review。
- 可选：做 meta-review，但把它的产出也当作"事实"而非"更高质量的判定"。
- 可选：用"审查者互审"仅用于**压制幻觉缺陷**（CriticGPT 形态），不做质量排名。
- 可选：记录审查者之间的分歧率，作为不确定性事实。

---

## 8. 不可引用清单

> 以下说法流传极广但**本轮无法支持其可引用性**。引用它们会把项目结论建立在无法溯源的数字上。

| # | 不可引用说法 | 问题 | 可引用的替代 |
|---|---|---|---|
| 1 | **"缺陷修复成本 1:10:100"（或 1:10:100:1000）**，归于「IBM Systems Sciences Institute」 | 溯源终点是 **1981 年 Pressman 教科书引用的一条 IBM 内部培训"course notes"**；IBM Systems Science Institute 是**企业培训机构，不是研究机构**；源头数据"if any exist"不晚于 1981、可能早至 1967；"1:10:100" 在数值上**也不是原始形式**（原始为 1:6.5:15:60–100）；该说法经 2006 年 iSixSigma 文章被改写成"IBM has reported" | 引用 Bossavit 的溯源 gist（https://gist.github.com/Morendil/ebfa32d10528af04e2ccb8995e3cb4a7 与 https://gist.github.com/Morendil/6d664bf990c17ea0f88f9bb0cc403c64）作为**"该曲线不可引用"的证据**；成本相关的可引用实证用 Menzies et al. 2017（DOI 10.1007/s10664-016-9469-x） |
| 2 | **"reviewer 弱于 writer 为 −8.6 个百分点"** | 8 种措辞 × 2 个检索引擎 + 全语料 grep = **零命中**；无可复核的测量定义（测什么指标？哪个 benchmark？）。**该数字没有任何外部来源，应视为项目内部数字，不得写成"文献表明"** | 用 CriticBench（arXiv:2402.14809）"weaker models could sometimes correct the outputs of stronger models more effectively than those models could self-correct" 描述方向性；用 arXiv:2605.27483 的 critic-vs-judge 前置条件作为最接近的精确表述；**全程不给百分点** |
| 3 | **"更正式的评审带来更低故障率"** | 上游 DORA 相关结论指向"无证据支持"；本轮未取得 DORA 一手报告中的对应表述逐字引用 | 只能引"缺乏证据"这一否定性结论，且需绑定具体 DORA 报告版本/章节；在取得一手引用前**不写成"评审有效"或"评审无效"** |
| 4 | **"严重性越高误报率越高（high 15% vs critical 0%）"** | 本轮未找到该具体数字的一手出处；机制方向（高严重度更少误报）在直觉上反而相反，需要原始测量口径 | 在取得一手来源前，只写"误报与严重度分布是需要实测的事实"，不引用任何具体百分比 |
| 5 | **"5 个主流 AI 审查工具全部默认 advisory"** | 本轮仅**直接核验了 GitHub Copilot code review** 的默认行为（一手文档 verbatim）；其余 4 个工具的默认行为需各自一手文档 | 逐个工具引其官方文档原文（Copilot 已可引）；未核验的不合并成"全部" |
| 6 | **"越早发现问题越便宜，成本随阶段指数上升"** | 同 #1；且最大规模实证（171 项目）**未发现** delayed issue effect | 用 Menzies et al. 2017 替代；讨论时明确区分"直觉/流程主张"与"可引用实证" |
| 7 | **"盲审提高审查质量"** | Cochrane 综述：9 项研究**无** concealment 对质量评估结果有效果的证据；ICLR 双盲只降低了声望偏差、未显著改变接收决策 | 引"盲审减少与质量无关的偏差"（arXiv:2101.02701；Cochrane DOI 10.1002/14651858.MR000016.pub3），**不**说"提高质量" |
| 8 | **"同行评审已被证明无效"** | Cochrane 原文明确写了 "the absence of evidence on efficacy and effectiveness cannot be interpreted as evidence of their absence" | 引用时必须带上这句限定 |
| 9 | **"多智能体/多模型讨论必然优于单模型"** | arXiv:2402.18272（"Rethinking the Bounds of LLM Reasoning"）：单主体强提示≈最佳讨论方案；多主体只在**不给示例**时更好。arXiv:2311.17371（"Should we be going MAD?"）：MAD"do not reliably outperform … self-consistency"。**注意这两篇是不同论文，不要混引** | 引"增益可被单主体+强提示复现"这一限定结论 |
| 10 | **"魔鬼代言人能提高决策质量"（无条件）** | Schweiger et al. 1986 的收益伴随**接受度下降**；且为实验室模拟任务 | 引用时同时给出"质量↑ / 接受度↓"两面 |
| 11 | **"defer judgment（延迟判断）是头脑风暴的实证规则"** | 该规则源自 Osborn 的规范主张；Diehl & Stroebe 1987 确立的是"生产力损失"机制（blocking/评估焦虑/搭便车），**不等价于"批评压制创意"**；Nemeth et al. 2004 给出反向证据 | 引 Diehl & Stroebe 1987（DOI 10.1037/0022-3514.53.3.497）说明机制，明确区分规范主张与实证 |
| 12 | 各类**内容农场/AI 生成页面**（如本次检索中出现的 `reworkcost.com`、`budgetoverrun.com`、`kiwiqa.ai` 等"成本曲线解释"页） | 无作者、无原始出处、彼此转抄，且多在重复 #1 的错误归因 | 不使用；改用一手溯源与同行评审来源 |
| 13 | **"要求审查者至少给出 N 个替代方案 / 列出被否方案 / 给出修正，就能得到更好的方向建议"** | 本轮**没有找到**支持该提示词设计的对照实验；相反，`10.1007/s10515-026-00638-5` 报告"要求解释与提出修正的详细提示，**提高**了误判率" | 只能写成"是一种待验证的做法"，并绑定那条反向证据；**不能**写成已证实有效 |
| 14 | **"多模型审查能提高缺陷召回"**（作为 PoLL 的推论） | PoLL 的收益是"同等或更好 + 偏差更少 + 成本低 7 倍"，**不是召回率提升**；把它读成召回提升是过度解读 | 引 PoLL 时只写它的原话（成本、intra-model bias、disjoint model families） |
| 15 | **"不同厂商的模型 = 独立的错误来源"** | arXiv:2506.07962（ICML 2025，350+ 模型）："larger and more accurate models have **highly correlated errors, even with distinct architectures and providers**"；两者都错时 **60%** 一致（随机基线 1/3） | 只能说"跨厂商**减少**了同一性（同厂商/同基座/同规模的相关性更高）"，**不能**说"跨厂商 = 独立"。任何"异源所以能互补"的主张都必须带上这条限定 |
| 16 | **"多个强模型讨论会带来更多发散"** | arXiv:2604.18005（ACL 2026 Findings）："stronger, highly aligned models yield diminishing marginal diversity"；"dense communication topologies accelerate premature convergence" | 引"多样性坍缩"原文，并说明坍缩来自**交互结构**；不要把"多模型"等同于"更发散" |
| 17 | **"多样性（异质性）本身就是好审查的设计原则"** | Kuncheva & Whitaker 2003（DOI 10.1023/A:1022859003006）：多样性/准确率秩相关仅 **0.08–0.30**，极端为负；Hong–Page 有"Ability trumps diversity"对偶定理（arXiv:2307.04709） | 把"异质性"当作**待检验的假设**而非设计前提；必须同时测量它是否真的带来收益 |
| 18 | **"把完整审查细节交给执行者，就会修得更好"** | Imbue 2026-04-29 对照案例：weaker fixer + full review detail → 16/17 → **8/17**；summary-only 则维持 16/17 | 只能引"审查详细程度是一个需要实测的变量"，并绑定那条反向证据 |
| 19 | **"前瞻性后见（premortem 类）能让人们多生成 30% 的理由"** | 广泛流传的 "+30%"，**未能追溯到一手表格**；原始研究（Mitchell, Russo & Pennington 1989, DOI `10.1002/bdm.3960020103`）的摘要只确认"prospective hindsight 是一种真实操控、理由数量随确定性变化" | 只能引"该效应存在"（一手、被引 87）；**不得引用 +30%** |
| 20 | **"数量孕育质量"（quantity breeds quality）** | 源自 Osborn 1957 的**规范主张**，**无一手实证支持**；Diehl & Stroebe 1987 与 Rietzschel 2006 把它的适用范围限制在**生成**，**不适用于选择**（选择接近随机） | 引 Rietzschel 2006（DOI `10.1016/j.jesp.2005.04.005`）"idea selection was not significantly better than chance" |
| 21 | **"要求审查者列出被否方案及理由"能改善结果** | **未找到任何受控研究**检验这条具体指令。最接近的是 Dhami 2019 的**对照组指令本身就是"说明为何否定了其他假设"**，而该对照组在准确性上与强制的 ACH 组**打平** | 只能写成"未验证的做法"；并绑定 Dhami 2019（DOI `10.1002/acp.3550`）作为反证 |
| 22 | **引用 Cicchetti 1991 的具体信度系数** | 出版商摘要把数值省略，剑桥页面只给参考文献，**本轮未取得其系数** | 改用 Bornmann, Mutz & Daniel 2010（DOI `10.1371/journal.pone.0014331`）的"IRR quite limited"结论；并注明原文均值以公式/图片给出、未提取 |
| 23 | **⚠ 种子文献本身的错误（不得传播）**：Ancker 2017 的 DOI 写作 `10.1186/s12911-017-0455-z` | 该 DOI 是**另一篇论文**（中文临床术语相关）。正确 DOI 为 **`10.1186/s12911-017-0430-8`**（本轮已核验：题目为 "Effects of workload, work complexity, and repeated alerts on alert fatigue in a clinical decision support system"） | 使用正确 DOI |
| 24 | **⚠ Tyser et al. "AI-Driven Review Systems" 的 arXiv 号写作 2404.16066** | 2404.16066 是另一篇（社媒 LSTM）论文；正确为 **arXiv:2408.10365**（本轮已核验标题） | 使用 arXiv:2408.10365 |
| 25 | **⚠ Kesselheim 2011 的期刊归属写成 Arch Intern Med** | Kesselheim 2011 是 *Health Affairs*，DOI **`10.1377/hlthaff.2010.1111`**（本轮已核验）；Arch Intern Med 那篇是 Isaac 2009（DOI `10.1001/archinternmed.2008.551`） | 分别引用，勿混 |
| 26 | **⚠ "Wessel 2022, Please Don't Comment on My Code"** | **未能找到该标题的论文**；同年的真实论文是 Wessel et al. 2022, "Quality gatekeepers: investigating the effects of code review bots on pull request activities", *EMSE*, DOI **`10.1007/s10664-022-10130-9`**（本轮已核验） | 使用真实标题与 DOI |

---

## 9. 来源清单

> 标注：`[P]` = 同行评审/预印本一手研究；`[D]` = 厂商/机构一手文档；`[S]` = 二手溯源或综述。
> 所有 URL 均在本轮调研中实际抓取过。

### 9.1 审查者强弱与自审失败
- `[P]` CriticBench — arXiv:2402.14809 — https://arxiv.org/abs/2402.14809
- `[P]` Huang et al., "Large Language Models Cannot Self-Correct Reasoning Yet", ICLR 2024 — https://arxiv.org/abs/2310.01798
- `[P]` Panickssery et al., "LLM Evaluators Recognize and Favor Their Own Generations" — https://arxiv.org/abs/2404.13076
- `[P]` McAleese et al., "LLM Critics Help Catch LLM Bugs" (CriticGPT) — https://arxiv.org/abs/2407.00215
- `[P]` Burns et al., "Weak-to-Strong Generalization" — https://arxiv.org/abs/2312.09390
- `[P]` West et al., "The Generative AI Paradox" — https://arxiv.org/abs/2311.00059

### 9.2 异质性与聚合
- `[P]` Verga et al., "Replacing Judges with Juries" (PoLL) — https://arxiv.org/abs/2404.18796
- `[P]` "Rethinking the Bounds of LLM Reasoning: Are Multi-Agent Discussions the Key?" — https://arxiv.org/abs/2402.18272
- `[P]` "Should we be going MAD? A Look at Multi-Agent Debate Strategies for LLMs" — https://arxiv.org/abs/2311.17371
- `[P]` "Beyond Majority Voting: LLM Aggregation by Leveraging Higher-Order Information" — https://arxiv.org/abs/2510.01499
- `[P]` Kamoi et al. 2024 TACL, "When Can LLMs Actually Correct Their Own Mistakes? A Critical Survey of Self-Correction" — https://arxiv.org/abs/2406.01297
- `[P]` Ladha, "The Condorcet Jury Theorem, Free Speech, and Correlated Votes" — DOI 10.2307/2111460
- `[P]` Doshi & Hauser, Science Advances 2024 — DOI 10.1126/sciadv.adn5290
- `[P]` Hong & Page, PNAS 2004（diversity trumps ability）— DOI 10.1073/pnas.0403723101

### 9.3 用于发散的审查形态
- `[P]` Schweiger, Sandberg & Ragan 1986, AMJ — DOI 10.2307/255859 — https://www.jstor.org/stable/255859
- `[P]` "Devil's Advocacy and Dialectical Inquiry Effects on Face-to-Face and Computer-Mediated Group Decision Making" 1995 — DOI 10.1006/obhd.1995.1070
- `[P]` Nemeth et al. 2004, "The liberating role of conflict in group creativity" — DOI 10.1002/ejsp.210
- `[P]` Diehl & Stroebe 1987, JPSP — DOI 10.1037/0022-3514.53.3.497
- `[P]` "Beyond Productivity Loss in Brainstorming Groups" 2010 — DOI 10.1016/s0065-2601(10)43004-x
- `[P]` Tyen et al., "LLMs cannot find reasoning errors, but can correct them..." — https://arxiv.org/abs/2311.08516
- `[P]` "Are LLMs reliable code reviewers? systematic overcorrection in requirement conformance judgement", *Automated Software Engineering* 2026 — DOI 10.1007/s10515-026-00638-5
- `[P]` "Benchmarking and Studying the LLM-based Code Review" (SWRBench, 1000 人工核验 PR；multi-review aggregation F1 +43.67%) — https://arxiv.org/abs/2509.01494
- `[P]` Wang et al. 2022, "Self-Consistency Improves Chain of Thought Reasoning" — https://arxiv.org/abs/2203.11171
- `[P]` Bond, Carlson & Keeney 2008, "Generating Objectives…", *Management Science*（直接挑战 M=2.77 vs 简单 review M=0.55，t(103)=5.46；类别名 +>30%）— DOI 10.1287/mnsc.1070.0754
- `[P]` Lord, Lepper & Preston 1984, "Considering the opposite", *JPSP* — DOI 10.1037/0022-3514.47.6.1231（**仅摘要级**）
- `[P]` Hirt & Markman 1995, "Multiple explanation", *JPSP* — DOI 10.1037/0022-3514.69.6.1069
- `[P]` Sanna, Schwarz & Stocker 2002, "When debiasing backfires", *JEP:LMC*（列 10 条反而失效）— DOI 10.1037/0278-7393.28.3.497
- `[P]` Dhami, Belton & Mandel 2019, "The 'analysis of competing hypotheses' in intelligence analysis", *Applied Cognitive Psychology*（50 名分析师 RCT；36% vs 33%，p=.845）— DOI 10.1002/acp.3550
- `[P]` Chang, Berdini, Mandel & Tetlock 2018, *Intelligence and National Security* — DOI 10.1080/02684527.2017.1400230
- `[P]` Herzog & Hertwig 2009, "The Wisdom of Many in One Mind", *Psychological Science* — DOI 10.1111/j.1467-9280.2009.02271.x（**数字为二手，部分核验**）
- `[P]` Nemeth, Connell, Rogers & Brown 2001, *J. Applied Social Psychology* — DOI 10.1111/j.1559-1816.2001.tb02481.x
- `[P]` Rietzschel, Nijstad & Stroebe 2006, "Productivity is not enough", *JESP* — DOI 10.1016/j.jesp.2005.04.005
- `[P]` Mullen, Johnson & Salas 1991, "Productivity Loss in Brainstorming Groups: A Meta-Analytic Integration" — DOI 10.1207/s15324834basp1201_1
- `[P]` Yilmaz, Daly, Seifert & Gonzalez 2016, "Evidence-based design heuristics for idea generation", *Design Studies* — DOI 10.1016/j.destud.2016.05.001
- `[P]` Tomkins, Zhang & Heavlin 2017, PNAS — DOI 10.1073/pnas.1707323114
- `[P]` arXiv:2608.05157, "Large Language Models Threaten Double-blind Review" — https://arxiv.org/abs/2608.05157
- `[P]` Perez et al., "Red Teaming Language Models with Language Models" — https://arxiv.org/abs/2202.03286
- `[P]` Ganguli et al., "Red Teaming Language Models to Reduce Harms" — https://arxiv.org/abs/2209.07858

### 9.4 盲审 / 信息裁剪
- `[P]` Jefferson et al., Cochrane Review — DOI 10.1002/14651858.MR000016.pub3
- `[P]` "Does double-blind peer review reduce bias? Evidence from a top computer science conference" (ICLR, 5027 papers) — https://arxiv.org/abs/2101.02701
- `[P]` Tomkins, Zhang & Heavlin 2017, PNAS — DOI 10.1073/pnas.1707323114
- `[P]` Budden et al. 2008, TREE — DOI 10.1016/j.tree.2007.07.008
- `[P]` Le Goues et al. 2018, "Effectiveness of anonymization in double-blind review", *Communications of the ACM* — DOI 10.1145/3208157
- `[P]` Ross-Hellauer 2017, F1000Research — DOI 10.12688/f1000research.11369.2

### 9.5 时机 / 锚定 / 成本曲线
- `[P]` Tversky & Kahneman 1974, Science — DOI 10.1126/science.185.4157.1124
- `[P]` Jansson & Smith 1991, Design Studies 12(1):3–11 — DOI 10.1016/0142-694X(91)90003-F
- `[P]` Smith, Ward & Schumacher 1993, Memory & Cognition — DOI 10.3758/BF03202751
- `[P]` Englich, Mussweiler & Strack 2006, *Personality and Social Psychology Bulletin*（无关锚点对法官有效）— DOI 10.1177/0146167205282152
- `[P]` Sio, Kotovsky & Cagan 2015, *Design Studies*（示例作用的元分析）— DOI 10.1016/j.destud.2015.04.004
- `[P]` Kohn & Smith, *Applied Cognitive Psychology*（Collaborative fixation；**未取得全文**）— DOI 10.1002/acp.1699
- `[P]` *Frontiers in Psychology* 2019（评估焦虑影响数量/类别但不影响新颖性）— DOI 10.3389/fpsyg.2019.01459
- `[P]` Wang et al. 2023, "Large Language Models are not Fair Evaluators" — https://arxiv.org/abs/2305.17926
- `[P]` Zheng et al. 2023, MT-Bench — https://arxiv.org/abs/2306.05685
- `[P]` arXiv:2602.20408, "Examining and Addressing Barriers to Diversity in LLM-Generated Ideas" — https://arxiv.org/abs/2602.20408
- `[P]` Boehm & Basili 2001, *Computer*（"more like 5:1 than 100:1"）— DOI 10.1109/2.962984
- `[S]` Hillel Wayne, "I ❤️ Science" — https://buttondown.email/hillelwayne/archive/i-ing-hate-science/
- `[S]` The Register, 2021-07-22, "Bugs expense bs" — https://www.theregister.com/2021/07/22/bugs_expense_bs/
- `[P]` "Anchoring Bias in Large Language Models: An Experimental Study" — https://arxiv.org/abs/2412.06593 / DOI 10.1007/s42001-025-00435-2
- `[P]` Sharma et al., "Towards Understanding Sycophancy in Language Models" — https://arxiv.org/abs/2310.13548
- `[P]` Menzies, Nichols, Shull & Layman 2017, EMSE — DOI 10.1007/s10664-016-9469-x / https://arxiv.org/abs/1609.04886
- `[P]` Bacchelli & Bird 2013, ICSE — DOI 10.1109/ICSE.2013.6606617
- `[P]` Fagan 1976, IBM Systems Journal — DOI 10.1147/sj.153.0182
- `[S]` Bossavit, "The IBM Systems Science Institute" — https://gist.github.com/Morendil/ebfa32d10528af04e2ccb8995e3cb4a7
- `[S]` Bossavit, "Pressman Ratios" — https://gist.github.com/Morendil/6d664bf990c17ea0f88f9bb0cc403c64
- `[S]` Bossavit, "The Leprechauns of Software Engineering" — https://leanpub.com/leprechauns

### 9.6 advisory-only / 采纳率 / 审查疲劳
- `[D]` GitHub Copilot code review 文档（默认 Comment、不计入必需批准、重复评论）— https://docs.github.com/en/copilot/using-github-copilot/code-review/using-copilot-code-review
- `[P]` van der Sijs et al. 2006, JAMIA（49–96% override；50%→75% 五年趋势）— DOI 10.1197/jamia.M1809
- `[P]` "Rethinking Code Review Workflows with LLM Assistance" (WirelessCar) — https://arxiv.org/abs/2505.16339
- `[P]` Johnson et al. 2013, ICSE — DOI 10.1109/ICSE.2013.6606613
- `[P]` McIntosh et al. 2014, MSR — DOI 10.1145/2597073.2597076
- `[P]` Sadowski et al. 2018, "Modern code review: a case study at Google" — DOI 10.1145/3183519.3183525
- `[P]` Waffenschmidt et al. 2019, BMC Med Res Methodol（单筛漏 5%；专家 3% vs 新手 13%）— DOI 10.1186/s12874-019-0782-0
- `[P]` **"How Effective Are AI-Based Code Review Actions?" TSE 2026**（16 个 Action / 178 成熟仓库 / 22,326 条 AI 评论；AI 采纳 0.9–19.2% vs 人类 60%；未被采纳回复中 64% 为"defending the change"）— https://assets.empirical-software.engineering/pdf/tse26-ai-code-review.pdf
- `[P]` Ancker et al. 2017, *BMC Med Inform Decis Mak*（接受率 −30%/条、−10%/5pp；**反驳时间性衰减**）— DOI 10.1186/s12911-017-0430-8
- `[P]` Google Tricorder, ICSE 2015（advisory 误报上限 <10%；阻断 ≈0%；"this trust is quickly lost"）— DOI 10.1109/icse.2015.76（Sadowski et al., "Tricorder: Building a Program Analysis Ecosystem"）
- `[P]` Wessel et al. 2022, "Quality gatekeepers…", *EMSE* — DOI 10.1007/s10664-022-10130-9
- `[D]` CodeRabbit request-changes workflow（默认关闭）— https://docs.coderabbit.ai/pr-reviews/request-changes-workflow
- `[D]` Semgrep rule modes（默认 Monitor，privacy 不出现在 PR）— https://semgrep.dev/docs/semgrep-code/policies
- `[D]` SonarQube quality gate — https://docs.sonarsource.com/sonarqube-server/latest/quality-standards-administration/managing-quality-gates/introduction-to-quality-gates/
- `[D]` Greptile docs（默认仅评论；auto-approve 为 beta）— https://www.greptile.com/docs
- `[D]` Codacy quality gates（"optionally block merging"）— https://docs.codacy.com/repositories-configure/quality-gates/
- `[D]` Amazon CodeGuru Reviewer（无阻断；2025-11-07 起停止新用户）— https://docs.aws.amazon.com/codeguru/

### 9.7 meta-review / review-of-reviews
- `[P]` "Peer reviews of peer reviews: A randomized controlled trial and other experiments", PLOS ONE 2025 — DOI 10.1371/journal.pone.0320444 — https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0320444
- `[P]` Bruce et al. 2016, BMC Medicine — DOI 10.1186/s12916-016-0631-5
- `[P]` Cicchetti 1991, Behavioral and Brain Sciences — DOI 10.1017/S0140525X00065675
- `[P]` Schroter et al. 2008, "What errors do peer reviewers detect, and does training improve their ability to detect them?", *J R Soc Med*（607 名 BMJ 评审人；9 个植入重大错误，检出 2.58 个）— https://www.bmj.com/sites/default/files/attachments/resources/2011/07/what-errors-do-peer-reviewers-detect.pdf
- `[P]` Hesselberg et al. 2025, PLoS ONE 20(5):e0322696（grant peer review 单评审人 ICC 0.17–0.37；阈值 0.75）— DOI 10.1371/journal.pone.0322696
- `[P]` "A large-scale randomized study of large language model feedback in peer review", *Nature Machine Intelligence* 2026（ICLR 2025，20,000+ 评审；27% 评审人更新了评审）— DOI 10.1038/s42256-026-01188-x — https://www.nature.com/articles/s42256-026-01188-x

### 9.8 相关错误、评审者强弱与"审查有害"（Q1/Q7 补充）
- `[P]` Kim, Garg, Peng & Garg, "Correlated Errors in Large Language Models", ICML 2025 — https://arxiv.org/abs/2506.07962
- `[P]` "Benchmarks Saturate When The Model Gets Smarter Than The Judge"（Omni-Judge 分歧中 96.4% 判错）— https://arxiv.org/abs/2601.19532
- `[P]` "Debate Helps Weak Judges Reward Stronger Models"（critic 能力须超过 judge；5 组配对中 3 组有效、2 组零效应）— https://arxiv.org/abs/2605.27483
- `[P]` "Self-Correction Bench"（64.5% 自我纠正盲点）— https://arxiv.org/abs/2507.02778
- `[P]` Valmeekam et al. 2023, "Can Large Language Models Really Improve by Self-critiquing Their Own Plans?"（自审 55% vs 外部验证器 88%；验证器 FPR 84.45%）— https://arxiv.org/abs/2310.08118
- `[P]` "Diversity Collapse in Multi-Agent LLM Systems", ACL 2026 Findings — https://arxiv.org/abs/2604.18005
- `[P]` "Fatal errors and misuse of mathematics in the Hong-Page Theorem..."（"Ability trumps diversity" 对偶定理）— https://arxiv.org/abs/2307.04709
- `[P]` Kuncheva & Whitaker 2003, *Machine Learning* 51:181–207 — DOI 10.1023/A:1022859003006
- `[P]` "One Step Forward, Two Steps Back: Regression Errors and Cost Inefficiencies in LLM Iterative Refinement for Code Generation", ICLR 2026 — https://openreview.net/forum?id=LeFnGXqPhG（**摘要级**）
- `[P]` "Do AI Reviewers Converge?"（1,943 人类评审 vs 10,172 LLM 评审）— https://openreview.net/forum?id=NdDKcU9HlU（**摘要级**）
- `[P]` "Debate ... majority pressure suppresses independent correction" — https://arxiv.org/abs/2511.07784
- `[S]` Imbue, "How AI code review can make correct code worse", 2026-04-29（16/17 → 8/17 回归案例）— https://imbue.com/blog/2026-04-29-how-ai-code-review-can-make-correct-code-worse
- `[S]` Martin Bens (Shopware), "An experiment in working with multiple AI models", 2026-08-05 — https://www.shopware.com/en/news/an-experiment-with-ai-agents/

---

## 附：本报告的检索方法与限制

- **检索通道**：本轮开始时 `web_search` / `anysearch_search` / `web_fetch` 三个托管检索通道**全部因配额耗尽返回 HTTP 402**；Grok `x_search` 未登录。因此本报告的全部内容通过**直连 HTTP** 取得：Crossref REST API、Semantic Scholar Graph API、arXiv 导出 API 与 `arxiv.org/abs` 直取、PubMed/Europe PMC E-utilities、DuckDuckGo（经 `r.jina.ai` 代理渲染）、Brave Search HTML、`r.jina.ai` 正文与 **PDF** 抽取（含本地 pymupdf 对两个扫描件做 OCR）、以及厂商文档直取。
- **通道故障记录（逐条）**：`anysearch`（含 `web_search`/`web_fetch`）全程 402；`x_search` 未登录；OpenAlex 免费日配额在调研中期被同 IP 全网耗尽（"$0 remaining, resets midnight UTC"）；Brave 在中后期对本次 IP 返回人机校验页（固定 73,902 字节的 bot 页）；arXiv 导出 API 与 `r.jina.ai` 均多次返回 429。上述故障均通过换通道规避，未影响结论；**这本身意味着本报告不是"穷尽式"检索**。
- **核验纪律**：所有引用的 **DOI 均通过 Crossref 逐条解析确认**（并在此过程中发现并修正了 3 个错误 DOI：Ladha、Le Goues、Smith/Ward/Schumacher）；所有引用的 **arXiv ID 均通过抓取 `arxiv.org/abs` 确认标题**；所有厂商默认行为均取自**厂商自己的文档页面**。
- **四路并行取证**：本报告由 4 条独立检索线并行产出（Q1/Q7 审查者强弱与反证；Q2/Q3 发散形态与提示词设计；Q4 时机与成本曲线；Q5/Q6 advisory 与 meta-review），各线的一手原始摘录分别保存在 `/tmp/r4/{A,B,C,D}-*.md`。**主报告只保留经交叉核验或以原文核实过的条目**；凡某条只有单线来源且未能核验者，已在正文中降级标注或移入 §8。
- **未做的事**：没有做系统性综述式检索（未穷尽数据库、未做 PRISMA 式筛选）；`anysearch` 的 `min_citations` / `sort=cited_by_count` 参数因配额不可用，故证据强度以"来源类型 + Crossref/S2 引用计数 + 设计类型"近似判断，**不是正式的 GRADE 评级**。
- **失败即记录**：凡"未找到一手来源"的说法，均已在 §6.4 与 §8 显式登记，未用相似说法填充；凡只取得摘要级信息的来源（两份 OpenReview 论文、Lord 1984、Herzog & Hertwig 2009），均已在原文处标注。
- **本报告不能支持的三类推断**（防止过度外推）：
  1. 把"人类头脑风暴/设计固着/司法锚定"的效应直接当作"LLM 审查者在本项目场景中的效应"；
  2. 把"代码审查"的采纳率数字直接当作"方向性审查建议"的采纳率（**没有任何研究把审查意见分成"改变方向"与"行级修改"并分别测采纳率**）；
  3. 把"更早/更晚"当作单一变量（实际至少同时包含：信息量、锚点强度、上下文长度、执行者能力四个变量）。
