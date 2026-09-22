# R2 发散的方法与质量 — 外部调研

> 调研范围：发散技法家族、发散质量度量、LLM 发散的实证失效模式、发散→收敛切换条件、人类 brainstorming 群体的经典反证、发散产物的呈现形态。
>
> **方法学说明（重要，影响可复现性）**：
> - 本次会话中 `web_search` / `web_fetch` / `anysearch_search`（含 `academic.search` / `academic.preprint` / `academic.citation`）全部返回上游配额错误（HTTP 402，"total free quota for today"）。因此**未能使用任务指定的检索工具**。
> - 替代路径：直接经 `curl` 调用 OpenAlex API、Crossref REST API、Semantic Scholar Graph API、arXiv API / arXiv abs 页、Europe PMC REST（含 PMC 全文 XML）、Unpaywall、RePEc。所有引用的 DOI / arXiv ID 均由这些接口返回，**未凭记忆书写**。
> - OpenAlex 免费额度在中途耗尽（仅 DOI 直查可用），故 Q1/Q5/Q6 的经典文献主要经 Crossref + Europe PMC 校验；Q3 的 LLM 论文主要经 arXiv abs 页 / arXiv HTML 全文 + Semantic Scholar 校验。
> - 凡本会话**无法取到一手出处的说法**，统一放入第 8 节「不可引用清单」，不进入正文结论。
> - 证据强度标注：`strong` = 对照实验 / 元分析 / 多模型多任务复现；`medium` = 单篇论文、单一数据集、或 2025–2026 新近 preprint；`weak` = 实践框架、博客、无对照的说法。

---

## 0. 结论速览（12 条）

1. 发散技法本质是**可替换的"搜索算子"**：SCAMPER / 形态分析 / TRIZ / 类比迁移 / 随机刺激 / 约束移除，各自只改变候选生成的方向，没有任何一个技法在受控比较中稳定压倒其它。`medium`
2. **形态分析（Zwicky）与 Quality-Diversity（MAP-Elites）是唯一天然产出"覆盖度"的家族**：先显式定义变化维度，再要求维度组合被填充，覆盖度可被直接计算。`medium`（Zwicky 1967 引用 131；MAP-Elites 概念性论文）
3. 设计学里"发散好不好"已有成熟四指标：**novelty / variety / quantity / quality**（Shah, Vargas-Hernandez & Smith 2003，被引 1084）；其中 variety 与 quantity 可完全自动计算。`strong`
4. **语义距离**（SemDis / OCS / GLoVe 或 embedding cosine）是被外部验证过的自动化原创性代理，与人类评分相关，可离线批量计算。`strong`
5. 集合级多样性可用 **distinct-n、self-BLEU、Vendi Score、平均成对 embedding 距离**自动计算；Vendi Score 无需参考分布，输出"有效不同项数"，可直接用于诊断 mode collapse。`strong`（指标本身；作为"创造力"的构念效度仅 `medium`）
6. LLM 的默认失效模式是 **Artificial Hivemind（人工蜂群思维）**：单模型内重复 + 跨模型同质同时存在，规模为 26K 真实开放式查询 + 31,250 条人工标注。`medium`
7. **对齐以多样性换泛化**：RLHF 相对 SFT 在 per-input 多样性上显著下降（EAD distinct-n / Sentence-BERT / NLI 三种度量一致），cross-input 下降较小。`strong`
8. **人机协作呈两级效应**：个体创造力上升、集体多样性下降。Doshi & Hauser 2024（Science Advances）中，使用生成式 AI 点子后故事彼此更相似（一个 AI 点子条件 b=0.871, p<0.001；五个点子条件 b=0.718, p=0.003），相当于人类条件相似度全距的 10.7% / 8.9%。`strong`
9. **多智能体 debate 会主动压低跨会话多样性**：同质 persona 的 debate 语义多样性甚至低于单智能体基线；论文证明"会话内 agent 多样性"是"跨会话输出多样性"的必要条件（Proposition 1）。`medium`（2026-09 新论文 + 形式化论证，非多实验室复现）
10. **persona prompting 不是多样性灵药**：162 个角色 × 2,410 个事实问题上，加 persona 相对无 persona 对照**不提升**客观任务表现；在 debate 中仅靠 domain persona 也无法抵消收敛压力（Hetero MAD 语义多样性仍显著低于保发散变体）。`strong`（前者）/ `medium`（后者）
11. **采样温度不是发散杠杆**：温度 0.0→1.0 对解题类任务表现无统计显著影响（9 个 LLM × 5 种提示法，扫描区间到 1.6，显著无差异的结论覆盖 0.0–1.0）；把温度当作"提高发散"的旋钮，在解题类任务上缺少实证支持。`strong`（原文结论区间）
12. **没有公认的"该停发了"实证阈值**：可用的只有间接信号（覆盖度是否仍在上升、新候选重复率、群体 vs 个人的产出差），且反证明确——choice overload 元分析（63 个条件 / 50 个实验 / N=5,036）平均效应量**近乎为零**且找不到充分条件。`strong`（元分析）/ 停止阈值本身 `weak`

---

## 1. 发散技法横向对比表

**表 A：技法速查**（"产出"指该技法天然生成的结构化物；"代价"指时间、认知负荷、协调成本、以及可观测的副作用）

| 技法 | 一句话机制 | 最适用 | 天然产出 | 主要代价 / 已知副作用 | 一手出处 |
|---|---|---|---|---|---|
| Double Diamond | 两次"发散—收敛"菱形：先探问题空间，再探解空间 | 端到端设计流程的**阶段划分**，不是单点生成技法 | 阶段边界（Discover/Define/Develop/Deliver） | 只给节奏不给算子；每阶段是否真发散无内部度量 | Design Council, The Double Diamond |
| SCAMPER | 7 个固定变换（替代/组合/适应/修改/它用/消除/重排）逐个套在既有对象上 | 已有原型或既有方案的**改造**；用户已给候选时的扩增 | 每个变换 x 个变体 | 强依赖被变换的对象，易产出浅层变体；对"从零起"的空白问题弱 | Eberle, *SCAMPER*（1971/1996；Routledge 重版 DOI 10.4324/9781003423560） |
| How-Might-We（HMW） | 把问题重写成"我们如何能…"的开放式问句，一题多写 | 把模糊需求转成可作答的**问题集** | 一组重述后的问题 | 只是重述，不生成候选方向；重述质量决定性来自写题人 | IDEO Design Kit（实践方法，非论文） |
| 形态分析 Morphological Analysis | 拆出若干**独立参数轴**，每轴列取值，系统枚举组合（形态箱） | 参数可分解的技术/产品方案空间 | 完整的组合矩阵 + 覆盖度 | 组合爆炸；轴不独立时产生大量无意义组合；需要人来剪枝 | Zwicky 1967, DOI 10.1007/978-3-642-87617-2_14 |
| TRIZ | 用矛盾矩阵 + 40 条发明原理，从"技术矛盾"反查历史解 | 有明显工程矛盾的改进问题（更快 vs 更稳） | 原理编号 → 候选解 | 依赖领域矛盾的正确表述；对非工程/社会问题迁移性差 | Terninko et al., *Systematic Innovation: An Introduction to TRIZ*, DOI 10.4324/9781482279160 |
| Brainwriting / 6-3-5 | 6 人各写 3 个想法，5 分钟一轮，纸面轮转，不口头讨论 | 消除口头 brainstorming 的 production blocking | 每轮 18 个书面想法，多轮累积 | 协调轮转需要机制；书面表达对部分人门槛更高 | Wilson 2013, "Brainwriting", DOI 10.1016/b978-0-12-407157-5.00002-6 |
| 六顶思考帽 | 强制切换 6 种视角（事实/情绪/风险/收益/创意/流程） | 把"评估"与"生成"显式分离 | 每顶帽一组的发言/想法 | 是会话协议而非生成算子；并行发言仍会被群体压力钝化 | de Bono, *Six Thinking Hats* (1985)（本会话未取到一手 DOI，见第 8 节） |
| Random stimulus | 引入与问题无关的词/图，强制建立联系 | 卡住时的破固定（defixation） | 由随机词牵引的联想链 | 命中率低、噪音大；需要额外的筛选成本 | de Bono lateral thinking 传统；实践类 `weak` |
| Analogy / metaphor transfer | 从一个源领域抽取关系结构，映射到目标问题 | 需要跨域跳跃的"远迁移" | 源域→目标域的映射与候选 | 表面类比易产生假对应；结构映射需要额外校验 | Gentner 1983, DOI 10.1207/s15516709cog0702_3 |
| Constraint removal / assumption reversal | 显式列出并逐条移除"必须成立"的假设 | 被既有约束锁死的问题 | 每条被移除约束对应一类新解空间 | 约束既是障碍也是创造力的来源，移除过多会失焦 | Acar, Tarakci & van Knippenberg 2019, DOI 10.1177/0149206318805832 |
| Nominal group technique | 个人先独立静默产出 → 汇总 → 再讨论/投票 | 决策与评估阶段的结构化 | 个人清单 + 汇总清单 + 排序 | 需要两阶段组织；把"讨论"后置会损失即时激发 | Delbecq & Van de Ven 1971, DOI 10.2307/255307；Van de Ven & Delbecq 1974, DOI 10.2307/255641 |

**可用性证据（技法之间的横向比较本身很薄）**

- 有一项用 repertory grid 的实证研究比较了使用者视角下各创造力技法在 idea generation 中的实际帮助，属于"用户感知效用"而非"产出质量对照"。DOI 10.1111/caim.12424（被引 18）`medium`
- Osborn 式 brainstorming 的四条规则本身被专门质疑过（质量、从众、冲突三方面），说明"经典规则=有效"的假设并不自动成立。DOI 10.7771/1932-6246.1093 `medium`
- 效果最强的"技法"证据反而来自**组合与约束**类干预，而不是单一技法：CoT 提示 + 异构 persona/约束注入可把 LLM 产品点子的多样性提高到接近人类水平；跨供应商池化点子同样有效。SSRN 10.2139/ssrn.4526071 / arXiv 2607.27553 `medium`

**各技法的可操作步骤（外部出处中的操作粒度）**

- **Double Diamond**：Design Council 官方框架页给出 Discover → Define → Develop → Deliver 四段与两次菱形；它是流程骨架，不规定每段内部的生成算子。
- **SCAMPER**：逐字符对应 Substitute / Combine / Adapt / Modify / Put to another use / Eliminate / Reverse，每一步是对既有对象做一次定向变换。
- **HMW**：把需求陈述改写成"How might we …"；通常一次生成多条重述，再挑出可作答的。
- **形态分析**：① 识别并命名互不重叠的参数轴；② 每轴列出取值；③ 交叉枚举形成形态箱；④ 用一致性/可行性规则剪枝；⑤ 对保留格点做评估。
- **TRIZ**：① 把问题表述为"改善 A 导致 B 变差"的技术矛盾；② 查矛盾矩阵定位发明原理编号；③ 按原理生成候选；④ 用理想最终结果（IFR）筛选。
- **6-3-5**：6 人 × 3 想法 × 5 分钟，轮转 6 次，共 108 个槽位；参与者只写不改，避免口头阻塞。
- **六顶思考帽**：按帽色轮流发言，白（事实）/红（直觉）/黑（风险）/黄（收益）/绿（创意）/蓝（流程控制）。
- **Random stimulus**：取一个无关词 → 强制列出其属性 → 逐属性问"这在目标问题上意味着什么"。
- **Analogy transfer**：先找源域 → 抽关系结构（而非表面属性）→ 映射 → 校验哪些映射成立。
- **Constraint removal**：穷举"我们默认必须成立的事" → 逐条假设它不成立 → 记录由此打开的解空间。
- **Nominal group technique**：① 个人静默书面产出；② 轮转记录（不讨论）；③ 逐条澄清；④ 独立排序/投票；⑤ 汇总讨论。

---

## 2. 发散的度量方法（含可自动计算的指标）

### 2.1 设计学：四指标基线（可人工也可自动）

Shah, Vargas-Hernandez & Smith (2003, *Design Studies*, 被引 1084, `strong`) 给出 ideation effectiveness 的四类度量，至今仍是引用基线：

| 指标 | 定义 | 可否自动 |
|---|---|---|
| Quantity | 候选总数 | 可全自动 |
| Variety | 候选落在多少个**不同类别/功能分支**上 | 半自动（需分类轴；可用聚类/嵌入+人工抽检替代） |
| Novelty | 候选相对既有方案/参照集的新颖程度 | 半自动（需参照集 + 语义距离或 LLM 评审） |
| Quality | 候选在技术可行性与效果上的评分 | 需人评或 LLM-as-judge（后者有校准风险） |

其后续精化版本见 DOI 10.1016/j.destud.2009.07.002（被引 184）。DOI: 10.1016/s0142-694x(02)00034-0

### 2.2 语义距离（semantic distance）：最成熟的自动化原创性代理

- **SemDis**：把提示与作答分别映射为向量，用余弦距离度量"语义远程度"，作为原创性的自动化评分平台；被验证与人类评分相关。DOI 10.3758/s13428-020-01453-w（被引 322，`strong`）
- 该指标对 AUT（Alternative Uses Task）等任务有专门的信度建议：DOI 10.1080/10400419.2022.2025720（被引 104）
- **OCS / GLoVe 语义距离**被用作 AI vs 人类发散思维研究的主指标：Haase & Hanel 2024 用该法给出 GPT-4 与 N=151 人类的对照数字（AUT "fork"：人类 M=0.79, SD=0.04 vs GPT-4 M=0.84, SD=0.02；AUT "rope"：人类 0.68 vs GPT-4 0.79）。DOI 10.1038/s41598-024-53303-w `strong`
- **语义距离不是终点**：用 LLM 做发散思维自动评分显著优于纯语义距离。DOI 10.1016/j.tsc.2023.101356（被引 201，`medium`）
- 面向创意/点子生成的其他语义度量：DOI 10.1016/j.knosys.2018.03.016（被引 60）；novelty 计算评估在众包中的检验：DOI 10.1080/10400419.2023.2187544 `medium`

### 2.3 集合级多样性：可自动计算（不针对单条质量，而针对"这一批候选"）

| 指标 | 定义 | 关键性质 | 出处 | 强度 |
|---|---|---|---|---|
| distinct-n | 一批文本中不重复 n-gram 的比例 | 简单、便宜；**对长度有偏** | Li et al. 2016, DOI 10.18653/v1/n16-1014（被引 2072） | `strong`（指标） |
| EAD（expectation-adjusted distinct-n） | 修正长度偏置后的 distinct-n | 被 RLHF 多样性研究采用以"去掉偏向短输出的偏置" | Kirk et al., arXiv 2310.06452 引用 Liu et al. 2022 | `medium` |
| self-BLEU | 用一批输出中的一条作假设、其余作参考算 BLEU，取平均；**越低越多样** | 事实标准；Texygen 平台原生化 | Zhu et al. 2018, DOI 10.1145/3209978.3210080（被引 420） | `strong`（指标） |
| Vendi Score | 相似度矩阵特征值的 Shannon 熵的指数 = "有效不同项数" | **不需要参考分布**；用户自定义相似度函数；可直接测 mode collapse | Friedman & Dieng, arXiv 2210.02410 | `strong`（指标） |
| Sentence-BERT 平均成对余弦距离（1 − 平均相似度） | 语义层面的集合多样性 | 与人类多样性判断对齐（Tevet & Berant 2021 外部验证） | Kirk et al., arXiv 2310.06452 | `strong` |
| NLI diversity | 用 NLI 模型数一对输出间 entailment vs contradiction，矛盾多则更diverse | 逻辑层面多样性 | Kirk et al., arXiv 2310.06452（引 Stasaski & Hearst 2022） | `medium` |
| 平均成对 embedding 余弦相似度（越高越同质） | 用于测"集体同质化" | 人机协作研究主指标 | Doshi & Hauser, DOI 10.1126/sciadv.adn5290 | `strong` |
| 覆盖度（coverage）/ illumination | 候选落在设计空间网格中的格点数 | Quality-Diversity 传统；可度量"设计空间覆盖" | MAP-Elites, arXiv 1504.04909 | `medium` |

### 2.4 新颖性 / 可行性 / 语义距离的联合评分

- **LiveIdeaBench** 用 5 个维度评科学点子：originality、feasibility、fluency、flexibility、clarity，1,180 关键词 × 22 领域 × 40+ 模型；结论是这些能力**无法由通用智能指标预测**。arXiv 2412.17596 `medium`
- **IdeaBench** 用 GPT-4o 按用户指定质量指标（如 novelty、feasibility）排序，再算相对排名的 "Insight Score"。arXiv 2411.02429 `medium`
- 人评作为金标准的规模上限案例：Si et al. 招募 100+ NLP 研究者做盲评，才得到"LLM 点子被判更新颖（p<0.05）、可行性略弱"的统计显著结论。arXiv 2409.04109 `strong`

### 2.5 度量选择上的已知坑

- **"diversity" 一词在文献中是碎片化的**，其规范目标随任务而变；同一批输出在"事实性"语境下多样性是 bug，在"创意"语境下是 feature。arXiv 2604.01504 `medium`
- distinct-n / self-BLEU 对文本长度敏感，跨长度比较需要 EAD 类修正（Kirk et al. 明确说明用 EAD 消除偏向短输出的偏置）。
- 语义距离高 ≠ 有用：可行性/可执行性必须单独测（Si et al. 的"更新颖但略弱可行"；SSRN 10.2139/ssrn.4526071 的"AI 点子平均质量更高但集合级多样性更低"）。

---

## 3. LLM 发散失效模式与对策

> 表中"数字"均为论文原文可核对数值或原文规模描述。

### 3.1 主表

| # | 模式 | 证据 / 数字 | 出处 | 可选对策（原文报告或文献报告） | 强度 |
|---|---|---|---|---|---|
| F1 | **Artificial Hivemind / 跨模型同质**：单模型内重复 + 不同模型产出高度相似 | 26K 真实开放查询（含 brainstorm & ideation 等 6 大类 17 子类）；31,250 条人工标注、每例 25 位标注者；确认 intra-model repetition 与 inter-model homogeneity 同时存在 | arXiv 2510.22954（Artificial Hivemind） | 用开放式真实查询而非窄任务评测；把"跨模型同质"作为独立指标测；作者主张长期同质化是 AI 安全风险 | `medium` |
| F2 | **对齐（RLHF）压低输出多样性** | RLHF 相对 SFT 在 per-input 多样性上**显著**下降、cross-input 下降较小；三种度量（EAD distinct-n / Sentence-BERT / NLI）方向一致；两个 base model × 摘要与指令跟随两类任务 | arXiv 2310.06452（Kirk et al.） | 任务需要多样性时优先 SFT/未对齐模型；把"泛化 vs 多样性"当显式权衡而非免费午餐 | `strong` |
| F3 | **mode collapse 的数据层根因：typicality bias** | 偏好数据中标注者系统性偏好"典型/熟悉"文本；此偏置在完美 reward model 与完美优化下仍会导致 mode collapse | arXiv 2510.01171（Verbalized Sampling） | **Verbalized Sampling**（让模型口述一个响应分布及其概率，如"生成 5 个笑话及各自概率"）：创意写作多样性提升 **1.6–2.1×**；人类评估分数 +**25.7%**；恢复 base model 多样性的 **66.8%**；事实性与安全性不降 | `medium`（单篇，但含人评 + 多任务） |
| F4 | **人机协作的集体同质化**（个体↑、集体↓） | 使用 AI 点子后故事与同条件平均故事更相似：1 个 AI 点子 b=**0.871**, p<**0.001**；5 个点子 b=**0.718**, p=**0.003**；相当于人类条件相似度全距（8.10 分）的 **10.7% / 8.9%** | DOI 10.1126/sciadv.adn5290（Doshi & Hauser 2024, Science Advances；PMC11244532 全文） | 作者框架为"社会困境"：个体理性导致集体收窄；缓解方向为保留人类自产成分、避免单一 AI 点子源 | `strong` |
| F5 | **LLM 作为创意支持工具造成群体层面语义同质化** | 36 人对照实验（有效 33 人）：ChatGPT 条件下点子与"全体点子平均嵌入"的距离 M=**.24** (SD=.07)，Oblique Strategies 条件 M=**.28** (SD=.08)，t(32)=**2.154**, p=**0.038**, d=**0.47**；但**个体层面无差异**（p=0.352, d=0.12） | DOI 10.1145/3635636.3656204 / arXiv 2402.01536（Anderson et al., Creativity & Cognition 2024） | 结论指向"同质化来自 LLM 给不同用户相似点子"，而非个体固着增强；给用户展示"模型在该语境下倾向给什么"被报告为可用缓解 | `strong` |
| F6 | **多智能体 debate 主动抑制跨会话多样性** | Homo MAD 的语义多样性**最低、低于单智能体基线**；保发散变体（Creative-MAD）语义 +**26.2%**、词汇 +**24.0%**（Qwen3-8B），Gemma-3-12B 上 +**23.3% / +24.0%**；Hetero MAD（仅靠 domain persona）语义仍低 **19.7% / 16.5%**；Proposition 1：会话内 agent 多样性是跨会话输出多样性的必要条件 | arXiv 2609.00683 | 两种干预：**Cognitive Lens Assignment**（把每个 agent 锚定到持久且各异的认知模式，抗 identity drift）+ **Embedding-based Peer Selection**（只让 agent 看到语义上最远的同伴，抗多数派牵引）；"Voting（N 个独立响应 + 同一 judge 共识）多样性≈Direct"，说明**收敛来自 debate 动态本身而非共识机制** | `medium` |
| F7 | **LLM 群体出现类人从众与共识求同** | 4 种"社会"配置（easy-going / overconfident × debate / reflection）在 3 个数据集上显示 conformity 与 consensus reaching，与社会科学理论一致 | DOI 10.18653/v1/2024.acl-long.782 / arXiv 2310.02124（Zhang et al., ACL 2024） | 把 agent 的"人格/思考模式"作为显式变量而不是装饰 | `medium` |
| F8 | **debate 可致准确率随时间下降（为迎合而放弃正确推理）** | 实验显示 debate 过程中准确率可下降，**即使更强的模型在数量上占多数**；模型频繁从正确答案转向错误答案，偏好 agreement 而非 challenge | arXiv 2509.05396（Talk Isn't Always Cheap） | 需要给 agent 抵抗"有说服力但错误"的激励或机制；把 sycophancy / social conformity 当独立失败因子测 | `medium` |
| F9 | **vanilla MAD 常不如简单多数投票，且同质 agent 下期望正确率不变** | 理论：同质 agent + 均匀信念更新时 debate 保持期望正确率不变，因此无法可靠提升；跨 6 个推理 QA benchmark，加"多样性初始化 + 置信度调制"后稳定优于 vanilla MAD 与 majority vote | arXiv 2601.19921 | 多样性感知的**初始候选池选择** + 让 agent 表达校准置信度并据此更新 | `medium` |
| F10 | **同质初始化导致 agent 走同一条推理路径、退化为多数投票** | DynaDebate：现有方法"unguided initialization"使 agents 采纳相同推理路径与相同错误，debate 退化为简单多数投票 | arXiv 2601.05746 | 专用 Path Generation Agent 生成多样且带自适应冗余的路径；以步骤级逻辑批判替代结果投票；分歧时触发工具验证 | `medium` |
| F11 | **agent 数量/温度不足以制造认知差异** | Creative-MAD 的机制分析：agents 仅靠 temperature sampling 区分、无稳定推理锚点 → identity drift；全连接同伴暴露 → majority pull，会话内多样性单调衰减 | arXiv 2609.00683（§4） | 结构性差异（认知模式、同伴选择）比采样噪声更有效 | `medium` |
| F12 | **persona / 角色 prompt 对客观任务无增益** | 162 个角色（6 类人际关系 × 8 个专长领域）× 4 个模型族 × 2,410 个事实问题：加 persona 相对无 persona 对照**不提升**表现；persona 的性别/类型/领域会改变预测；逐个问题挑"最佳 persona"能提升准确率，但**自动识别最佳 persona 做不到，常常不如随机选** | DOI 10.18653/v1/2024.findings-emnlp.888 / arXiv 2311.10054 | 若目的是"提高答对率"，persona 不是可靠工具；若目的是"提高候选方向覆盖"，则应把它当**多样性干预**而非**质量干预**（见 F13） | `strong` |
| F13 | **persona / 约束 / 跨源池化可恢复多样性，但达不到人类水平** | 8 项研究：（1）LLM 产品点子平均质量高于人类、进入 top 10% 的概率是人类 **7 倍**；（3)(4) AI 点子在**单条层面更新颖度更低**、**集合层面多样性更低**；（5）回顾既有 LLM 创造力研究，**全部**显示更低的点子多样性；（7）更晚的模型版本多样性更高但仍低于人类；跨供应商池化 + prompt engineering（CoT、异构 persona、约束注入）+ 广探索型 creative agent 可把多样性提到**接近人类水平**；（8）利用 AI 近零边际成本**扩大点子数量可持续提升设计空间覆盖度，逼近人类覆盖度** | SSRN 10.2139/ssrn.4526071 / arXiv 2607.27553 | 可选手段：跨供应商池化、异构 persona、约束注入、CoT、creative agent、单纯放量 | `medium` |
| F14 | **温度对解题类任务几乎无效** | 9 个流行 LLM × 5 种 prompt engineering 技术，温度扫描 0.0→1.6；结论：**0.0–1.0 内温度变化对解题表现无统计显著影响**，且该结论跨模型、跨提示法、跨问题域泛化（>1.0 区间的具体行为以原文为准，本会话未取到分温度点数值） | DOI 10.18653/v1/2024.findings-emnlp.432 / arXiv 2402.05201 | 不要用温度作为"发散度"的主控旋钮；需要发散应改 prompt 结构（VS、异构视角） | `strong`（对 0.0–1.0 区间） |
| F15 | **self-consistency 的目标是收敛而非发散** | 自洽性通过采样多条推理路径后**多数投票**取最一致答案来提升准确率——机制上就是收敛操作 | DOI 10.48550/arxiv.2203.11171（Wang et al. 2022, 被引 721） | 与发散目标是反向的；把它放在"收敛/验证"环节而非"发散"环节更符合其机制 | `strong`（机制层面） |
| F16 | **解码策略对多样性的影响有系统比较，但没有单一赢家** | TACL 2022 系统比较各类 decoding 策略的多样性与质量取舍 | DOI 10.1162/tacl_a_00502（被引 42） | 需要按任务在"质量—多样性"帕累托前沿上选点；top-p（nucleus）的原始动因是避免退化，不是最大化多样性（DOI 10.48550/arxiv.1904.09751） | `medium` |
| F17 | **多轮 peer 暴露导致 agent 视角被多数派覆盖** | DynaDebate/Creative-MAD 均把"全连接同伴"列为同质化机制；EPS 的消融显示"过滤同伴信号"比"改初始化"更能减缓衰减（EPS-only 起始多样性低但衰减最慢） | arXiv 2609.00683（§7.2） | 限制 agent 上下文中的同伴集合（按语义距离选peer） | `medium` |
| F18 | **固定视角 prompt 会产出稳定但同质的输出（fixation）** | IDEAFix：任务表述与属性选择显著影响表现，简单提示策略能提升原创性，但**跨模型的输出同质化持续存在** | arXiv 2606.00875 | 用受控的任务变体 + 属性选择 + defixation prompt 组合评测，而不是单点 prompt 调参 | `medium` |
| F19 | **单纯"再想更多"在实验文献中不是独立变量，但有间接证据** | 直接测"追加要求再生成 N 个"的对照实验，本会话未找到一手论文（见第 8 节）。间接证据：（a）放量可提升设计空间覆盖度（F13-研究8）；（b）检索增强的迭代规划使**唯一新颖点子数提升 3.4×**、top-rated 点子数 **≥2.5×**（170 篇种子论文，Swiss Tournament） | F13 出处；arXiv 2410.14255（Nova） | 可选的"再发散一轮"实现方式：改变知识输入（检索/新证据）或改变视角结构，而不是原样重复同一 prompt | `medium`（间接）/ 直接证据缺失 `unknown` |
| F20 | **收敛压力下 agent 立刻"动作固着"** | MUTATE 基准：面对即时收敛压力，前沿 LLM 落入 immediate action fixation，action-level divergence 不提升；把"无约束发散候选生成"与"约束选择"分离后显著改善 | arXiv 2605.28465 | 在流程上把发散与约束筛选**物理分离**成两个阶段 | `medium` |
| F21 | **权重/激活层面的 mode collapse 可用免训练方法缓解** | CreativityNeuro：DAT 上最多提升 **14 个人类百分位**；N=720 人评的 AUT 与 Task Task 上 originality/surprise/creativity 显著提升；三种任务上均降低 mode collapse 度量；activation steering 在 DAT 上相当但不迁移到 AUT/Task Task | arXiv 2607.01433 | 权重空间对比引导（无需行为数据/重训/梯度微调） | `medium` |
| F22 | **"AI 比人类更有创造力"是任务依赖的，且与人机同质化不矛盾** | GPT-4 在 AUT / Consequences / Divergent Associations 三类任务上，控制流利度后比人类更原创、更精细（AUT fork：0.84 vs 0.79；rope：0.79 vs 0.68） | DOI 10.1038/s41598-024-53303-w | 单条质量高与集合多样性低可以同时成立，指标必须分开测 | `strong` |
| F23 | **对生成批次的"新颖性"判定会系统性偏向 LLM** | 100+ NLP 研究者盲评：LLM 点子被判**更新颖**（p<0.05）、可行性略弱；作者同时指出 LLM 自评失败与"生成多样性不足"是待解问题 | arXiv 2409.04109 | 新颖性人评本身困难；需要 end-to-end（真做出来）验证 | `strong`（对"更新颖"这一结论） |
| F24 | **多智能体并非一定更好：加"更多 agent"要有结构差异** | VirSci 用角色化科学家团队在科学点子上超过 SOTA；但 F6/F9/F10 显示无结构差异的 debate 会退化。两者合读：**agent 数不是自变量，结构差异才是** | arXiv 2410.09403 vs arXiv 2609.00683 / 2601.19921 | 需要显式的差异机制（角色/视角/路径/同伴选择） | `medium` |
| F25 | **安全对齐会挤压创意多样性（跨目标冲突）** | 框架性分析：优化一个规范目标（如 safety）会无意中损害人口学表征或创意多样性；四类规范语境（epistemic / interactional / societal / safety）互为交叉影响 | arXiv 2604.01504 | 把"多样性"当上下文相关属性而非模型固有属性；按任务目标选定度量 | `medium` |
| F26 | **RL 目标本身可以被设计成保多样性** | Group-Aware RL for Output Diversity（2025-11）——把组级信息并入 RL 目标以提高输出多样性 | arXiv 2511.12596 | 训练侧干预（相对 inference-time 干预成本更高） | `medium`（新，未复现） |

### 3.2 关于"多个 agent 到底提升还是降低多样性"的合读

外部证据分成两层，彼此不矛盾：

1. **质量层**：debate/多智能体能提升推理与部分创意任务的输出质量（arXiv 2410.09403；arXiv 2609.00683 也确认所有 MAD 变体在质量上优于单智能体基线）。`medium`
2. **多样性层**：debate 的收敛设计**跨独立运行**压低多样性，同质 persona 的 debate 语义多样性甚至**低于单智能体**；Hetero persona 只能部分恢复。`medium`
3. 决定性机制：跨会话多样性受**会话内 agent 多样性**约束（Proposition 1）；而"Voting（同样 N 个独立响应 + 同一共识机制）多样性≈Direct"把罪因定位到 debate 动态本身。
4. 与人类群体文献的一致性：人类互动群体同样在"数量"上输给名义群体，只在"过程满意度"上占优（第 5 / 6 节）。

---

## 4. 发散→收敛的切换条件与停止规则

**结论先行**：本会话未找到任何被反复验证的"发散应停止于第 N 个候选"的实证阈值。可用的只有**信号类别**与**代价对照**。

### 4.1 可选的停止信号（按证据可得性列出，不构成推荐）

| 信号类别 | 具体可操作形式 | 外部证据 | 强度 |
|---|---|---|---|
| **覆盖度是否仍在上升** | 把候选映射到预设参数轴/网格，记录已填充格点比例随时间的变化；未饱和则继续 | Achieved：放量可持续提升设计空间覆盖度、逼近人类覆盖度（SSRN 10.2139/ssrn.4526071 研究 8）；QD 传统用 illumination/coverage 作为目标本身（arXiv 1504.04909） | `medium` |
| **新候选重复率 / 边际新颖度** | 每轮新增候选与既有集合的最大语义相似度分布；相似度趋近饱和 = 边际收益下降 | 语义距离 / embedding 相似度是可计算代理（DOI 10.3758/s13428-020-01453-w；DOI 10.1126/sciadv.adn5290） | `medium`（指标强、阈值弱） |
| **候选被"再发现"的比例** | 同 prompt 多次采样，计算 Top-K 重叠；重叠高说明分布模式已耗尽 | distinct-n / self-BLEU / Vendi Score 可量化（DOI 10.18653/v1/n16-1014；DOI 10.1145/3209978.3210080；arXiv 2210.02410） | `medium` |
| **边际想法质量** | 记录"第 k 个候选"的质量曲线，看是否已进入平台 | Girotra 等的理论把 best-idea 质量分解为平均质量、数量、方差、辨识能力四项（DOI 10.1287/mnsc.1090.1144） | `medium` |
| **评估能力是否已饱和** | 群体/评审者对候选质量的分辨力是否还在提升 | 混合结构（个人先独立再合议）在"产生更多/更好点子"与"更好辨识质量"上都优于纯团队（同上） | `medium` |
| **时间/成本预算** | 固定 token/时间预算 | Renze & Guven 显示调温度不是有效杠杆（DOI 10.18653/v1/2024.findings-emnlp.432）；无"最优轮数"证据 | `weak` |

### 4.2 过早停止的代价（有证据）

- 设计固着（design fixation）：先看到的示例会显著限制后续解空间，是"过早收敛"的实验范式本身。DOI 10.1016/0142-694x(91)90003-f（被引 994）；后续研究议程 DOI 10.1016/j.destud.2017.02.001 `strong`（对固着现象）/ `medium`（对"何时算过早"）
- 他人的点子会诱发 collaborative fixation，直接压低后续产出。DOI 10.1002/acp.1699（被引 264）`medium`
- 收敛压力下 LLM agent 出现 immediate action fixation，且"先无约束发散、再约束选择"可显著改善。arXiv 2605.28465 `medium`
- 约束并非纯负面：约束同时**使能**与**限制**创造力，移除约束不是单调收益。DOI 10.1177/0149206318805832（被引 342–437）`strong`（综述层面）

### 4.3 无限发散的代价（有证据与反证）

- **收益递减的证据较弱**：Girotra 等的框架说明 best-idea 质量随数量提升，而"数量多但平均差"并不直接等价于"应停止"。DOI 10.1287/mnsc.1090.1144 `medium`
- **反证 1：choice overload 找不到充分条件**。63 个条件 / 50 个已发表与未发表实验 / N=5,036，平均效应量**近乎为零**，研究间方差可观，但**无法确定充分条件**。"选项太多必然损害决策"不成立。DOI 10.1086/651235 `strong`
- **反证 2：Iyengar & Lepper 的经典"果酱研究"（24 vs 6 种）是该领域最常被引的正面证据**，但其效应在元分析中未能稳定复现。DOI 10.1037/0022-3514.79.6.995（被引 2906）`strong`（单研究）/ 与元分析合读应视为条件性
- **反证 3：ChatGPT 推荐场景下 choice overload 被重新检验**，结论与经典零售情境不完全一致。DOI 10.1016/j.jretconser.2023.103494 `medium`
- **成本侧**：无限发散的真实代价体现在评估负担与注意力，而非"选项数量"本身；关于呈现方式的研究见第 5 节。

### 4.4 与"批次规模"相关的正面证据

- 利用近零边际成本放量可持续提升覆盖度（SSRN 10.2139/ssrn.4526071 / arXiv 2607.27553 研究 8）`medium`
- Nova 的迭代规划 + 外部知识检索把**唯一新颖点子数提升 3.4×**、top-rated 点子 **≥2.5×**（170 篇种子论文 + Swiss Tournament）arXiv 2410.14255 `medium`
- 这两条支持"继续发散仍有收益"的机制是**改变输入/视角**，而不是"再要 10 个"。

---

## 5. 发散产物的呈现形态（对人类决策者的锚定效应）

### 5.1 锚定：一手证据

- **锚定效应的原始范式**：即使锚值明显随机，判断也会被拉向锚值；调整通常不充分。DOI 10.1126/science.185.4157.1124（被引 24285）`strong`
- **调整不足的机制**：人们从锚点出发调整，并在"看起来合理"处停止——这是"给推荐会锚定决策者"的理论基础。DOI 10.1111/j.1467-9280.2006.01704.x（被引 717）`strong`
- **AI 建议的锚定与自动化偏误**：放射科医生在被告知建议来自 AI 时**整体给出更低质量评分**，但**任务专长较低者不会**折扣 AI 建议；收到不准确建议时诊断准确率显著变差，**且与建议声称的来源无关**。DOI 10.1038/s41746-021-00385-9（被引 478）`strong`
- **AI 建议引入的锚定偏误可被显式建模与平衡**（CHI 2022 提出 AI-moderated decision-making 以捕捉并平衡序贯决策中的锚定）。DOI 10.1145/3491102.3517443 `medium`
- **AI 推荐中的认知偏误综述**（2025）。DOI 10.1145/3765766.3765887 `medium`

### 5.2 选项数量

- 元分析结论：**平均效应近乎为零**，且无充分条件；因此"选项数量上限"没有普适的实证数值。DOI 10.1086/651235 `strong`
- 反面单研究：24 vs 6 种果酱的经典实验支持"更多选择降低购买意愿/满意度"。DOI 10.1037/0022-3514.79.6.995 `strong`（单研究）
- LLM 推荐情境下重新检验 choice overload。DOI 10.1016/j.jretconser.2023.103494 `medium`

### 5.3 是否排序 / 是否给推荐

- **排序与锚定直接耦合**：任何"第一个/最佳"的呈现都构成锚（§5.1）。可选的呈现取向在文献中有两条相反做法：
  - 先呈现推荐/默认 → 与锚定一致，影响方向明确但可能压缩独立判断（DOI 10.1126/science.185.4157.1124）
  - 先让决策者独立形成判断再暴露推荐 → 与"独立产出 ≥ 互动群体"的证据方向一致（见 §6 的 nominal group 证据）
- **"群体更适合选择、个人更适合产生"**：混合结构不仅产生更多/更好点子，也更善于**辨识**点子质量；而"在他人点子上继续搭建"被报告为适得其反。DOI 10.1287/mnsc.1090.1144 `medium`
- **创意支持工具的收敛/评估环节**在文献中被单列为待解决问题。DOI 10.1145/3591196.3596821 `medium`
- **会话线索提升主题多样性**：LLM 驱动的对话线索在不同会议形态下都提高了所生成点子的**主题多样性**。DOI 10.1145/3715928.3737486 `medium`
- **"是否给推荐"本身的可选设计空间**（外部做法集合，不含排序）：
  - 给推荐 + 给推荐理由（可追溯的来源）
  - 给推荐 + 同时给出被淘汰候选及淘汰理由
  - 不给推荐，只给候选 + 维度化评分
  - 不给推荐，先要求决策者写下自己的方向，再展示候选
  - 分组轴呈现（按机制/代价/风险分组）而非线性列表
  - 分批呈现（先给一类，再展开下一类）
  - 全部展开 vs 折叠按需展开（信息量—注意力权衡；无直接对照实验证据，`weak`）

### 5.4 一个与呈现相关的失败模式

- ChatGPT 用户产生了**更多、更详细**的点子，但**对点子的责任感更低**。DOI 10.1145/3635636.3656204 `strong`
  → 呈现形态不仅影响判断，也影响"谁觉得这是自己的决定"。

---

## 6. 反证与失效条件

> 本节集中列出与"多做发散/多上 agent 就会更好"相反或限定条件成立的证据。

### 6.1 经典 brainstorming 群体有效性（Q5）

| 发现 | 内容 | 出处 | 强度 |
|---|---|---|---|
| Production blocking | 群体成员轮流发言时，等待期间遗忘/被阻断，是 productivity loss 的主要来源之一 | Diehl & Stroebe 1987, DOI 10.1037/0022-3514.53.3.497（被引 1919） | `strong` |
| 三种损失机制 | 群体产出低于同人数个人之和，归因于 **social loafing / free riding**、**evaluation apprehension**、**production blocking** | DOI 10.1037/0022-3514.53.3.497；DOI 10.1037/0021-9010.76.1.137（Unblocking brainstorms） | `strong` |
| 元分析整合 | productivity loss 在多项研究上稳定存在 | Mullen, Johnson & Salas 1991, DOI 10.1207/s15324834basp1201_1（被引 522–824） | `strong` |
| 元分析整合本身被质疑 | 有专门文章质疑"部分大于整体"的推理（primary vs meta-analytic evidence） | DOI 10.1207/s15324834basp1201_3 | `medium` |
| 认知模型解释 | SIAM 模型：轮次转换（production blocking）同时干扰知识激活与想法产出；他人点子有助于激活相关知识；认知失败决定持久性、满意度与乐趣 | Nijstad & Stroebe 2006, DOI 10.1207/s15327957pspr1003_1 | `medium` |
| 电子化可解阻 | 电子 brainstorming 组比非电子组更有产出；但**名义组与互动组的产出无差异**；**互动组对过程的感受更好** | DOI 10.1037/0021-9010.76.1.137 | `strong` |
| 工业界大规模复现 | 4 天真实企业问题上，个人**至少**与群体产出同样多的电子点子；在 originality / feasibility / effectiveness 三个质量维度上**个人显著更好**；结论是"聚合个人电子响应优于召集电子群体" | DOI 10.1177/0018720809343587 | `strong` |
| 电子群体 brainstorming 元分析 | 媒体/媒介属性对群体互动收益有决定性影响 | DOI 10.1016/j.chb.2005.07.003（被引 164–223） | `medium` |
| 群体优于个人的条件 | 当任务/绩效定义为"**最佳**点子的质量"时，结构很关键：混合结构（先个人后合议）在产生数量、质量与质量辨识力上均优于纯团队；且**"在他人点子上搭建"是反效果的** | Girotra, Terwiesch & Ulrich 2010, DOI 10.1287/mnsc.1090.1144（被引 718–764） | `strong` |
| 群体 vs 个人早期综述 | 任务需要"ideational proficiency"时，群体表现的系统性劣势早有综述 | DOI 10.1002/ejsp.2420030402（被引 417） | `strong` |
| 名义群体技术 | 结构化"个人先写 → 汇总 → 讨论"流程在委员会决策中优于互动群体 | DOI 10.2307/255307；DOI 10.2307/255641 | `strong` |
| 面对面 vs 虚拟 | 虚拟沟通**抑制**创意点子产生，但提升选择性注意（对事实类任务有利） | DOI 10.1038/s41586-022-04643-y（被引 303） | `strong` |
| 后续演进 | 该问题域在 2010 年有系统性再评估（"Beyond Productivity Loss…"） | DOI 10.1016/s0065-2601(10)43004-x | `medium` |

**对"AI 多智能体发散"的可迁移含义（证据层面，不含设计建议）**

- 与人类群体一致，**同质 agent 的互动会引入 production blocking 的类比物**：等待/上下文被同伴占满、多数派牵引、以及"在别人点子上搭建反而变差"（Girotra 的 counterproductive buildup 与 Creative-MAD 的 majority pull 是同一现象的两个领域版本）。`medium`
- **"过程满意度高"不等于"产出高"**：人类互动组在感受上更好但产出不更好（DOI 10.1037/0021-9010.76.1.137）；LLM 场景中对应的风险是"multi-agent 让人觉得更全面"。
- **个人独立产出 + 事后聚合**在两类文献中都是稳健的强基线（人类：Human Factors 2009；LLM：Voting 的多样性≈Direct，arXiv 2609.00683），因此任何多 agent 方案必须先与"独立 N 次 + 聚合"对照。

### 6.2 其它失效条件

- **对齐/训练侧的多样性—泛化权衡无法免费绕过**：RLHF 泛化更好但多样性更低。arXiv 2310.06452 `strong`
- **persona 的效果可"大体随机"**：自动挑最佳 persona 常常不如随机选。DOI 10.18653/v1/2024.findings-emnlp.888 `strong`
- **温度不是旋钮**：0.0–1.0 无显著影响。DOI 10.18653/v1/2024.findings-emnlp.432 `strong`
- **debate 可以有害**：准确率下降，即使强模型占多数。arXiv 2509.05396 `medium`
- **单条新颖 ≠ 集合多样**：两个方向可以同时朝相反方向变化（AI 更原创 vs 更同质）。DOI 10.1038/s41598-024-53303-w vs DOI 10.1126/sciadv.adn5290 `strong`
- **同质化的个体层面 vs 群体层面解耦**：ChatGPT 使群体层面显著同质化，但个体层面**无显著差异**。DOI 10.1145/3635636.3656204 `strong`
- **人评本身不可靠**：新颖性判断对专家也困难；LLM 自评失败。arXiv 2409.04109 `strong`
- **"多样性"的规范方向随任务反转**：事实性任务中多样性 = hallucination 风险。arXiv 2604.01504 `medium`
- **约束移除不是单调收益**：约束同时使能与限制。DOI 10.1177/0149206318805832 `strong`

---

## 7. 对 CARD-07 的可落地含义（只列「有哪些做法可选」）

> 本节仅列出外部文献中出现过的**做法类别**及其证据与代价，**不排序、不推荐、不含 CARD-07 的具体设计**。顺序无含义。

### 7.1 生成侧（改变候选来源）

| 做法 | 外部证据 | 代价 |
|---|---|---|
| 显式参数轴 + 组合枚举（形态分析式） | Zwicky 1967, DOI 10.1007/978-3-642-87617-2_14 | 组合爆炸；需剪枝规则；轴须近似独立 |
| 固定变换算子逐个套用（SCAMPER 式） | DOI 10.4324/9781003423560 | 依赖被变换对象；易产浅层变体 |
| 结构化视角/认知模式强制（六顶帽、Cognitive Lens） | arXiv 2609.00683（CLA） | 需要为每视角写清"锚点"；视角数增多 → 协调成本 |
| 异构 persona / 角色注入 | SSRN 10.2139/ssrn.4526071（研究 7）；doi 10.18653/v1/2024.findings-emnlp.888（反证：对客观任务无增益） | 只提升覆盖不提升正确率；persona 选择本身可能是噪声 |
| 跨模型/跨供应商池化 | SSRN 10.2139/ssrn.4526071（研究 7） | 多份成本；结果需要归一化 |
| 检索/外部证据驱动的迭代规划 | arXiv 2410.14255（3.4× 唯一新颖点子） | 检索延迟与成本；需要规划器 |
| 随机刺激 / 类比远迁移 | Gentner 1983, DOI 10.1207/s15516709cog0702_3；random stimulus 层面 `weak` | 命中率低，筛选成本高 |
| 约束移除 / 假设反转 | DOI 10.1177/0149206318805832（约束双面性） | 可能失焦；约束本身是创造力来源 |
| 口述分布式采样（Verbalized Sampling） | arXiv 2510.01171（1.6–2.1×，恢复 66.8% base 多样性） | 需要模型按要求输出概率；效果随模型能力增强 |
| 权重/激活空间引导（免训练） | arXiv 2607.01433（DAT +14 百分位） | 需要权重访问；activation steering 不迁移 |

### 7.2 编排侧（改变 agent 间信息流）

| 做法 | 外部证据 | 代价 |
|---|---|---|
| agent 间部分连接（只暴露语义上最远的同伴） | arXiv 2609.00683（EPS） | 需要嵌入计算与选择逻辑；连接策略需调参 |
| 会话内视角保持（防 identity drift） | arXiv 2609.00683（CLA） | 需要持久化每个 agent 的认知锚点 |
| 多样性感知的初始候选池选择 | arXiv 2601.19921 | 需要先有多个候选才能选；额外一轮 |
| 过程级（步骤级）批判替代结果投票 | arXiv 2601.05746 | token 成本上升；需要结构化步骤表示 |
| 显式置信度表达与调制 | arXiv 2601.19921 | 需要校准；未校准的置信度有害 |
| 专用路径生成 agent + 自适应冗余 | arXiv 2601.05746 | 额外 agent 成本 |
| 独立 N 次生成 + 事后聚合（对照基线） | arXiv 2609.00683（Voting 多样性≈Direct）；DOI 10.1177/0018720809343587（人类侧） | 需要聚合规则 |
| 发散与约束选择物理分离成两阶段 | arXiv 2605.28465（ReDNA） | 流程变长；阶段边界需定义 |
| 个人先独立 → 再合议（混合结构） | DOI 10.1287/mnsc.1090.1144 | 两阶段组织成本 |
| 禁止/限制"在他人点子上搭建" | DOI 10.1287/mnsc.1090.1144（buildup counterproductive） | 会损失连带激发效应（SIAM 指出他人点子也有激活价值，DOI 10.1207/s15327957pspr1003_1） |
| 限制 agent 数量 | arXiv 2410.09403（多 agent 增益）vs arXiv 2609.00683（多样性抑制） | 权衡在质量与多样性之间 |

### 7.3 停止/切换侧

| 做法 | 外部证据 | 代价 |
|---|---|---|
| 覆盖度饱和判据（网格填充率） | arXiv 1504.04909；SSRN 10.2139/ssrn.4526071 研究 8（覆盖度随量上升） | 需要预先定义变化轴；轴错则判据失效 |
| 新候选重复率 / 边际语义距离判据 | DOI 10.3758/s13428-020-01453-w；arXiv 2210.02410 | 阈值无实证标准 |
| 批次间 Top-K 重叠判据 | DOI 10.1145/3209978.3210080（self-BLEU）；DOI 10.18653/v1/n16-1014（distinct-n） | 长度偏置需修正 |
| 固定预算（token/时间/候选数上限） | 无支持特定数值的证据（第 4 节） | 可能与真实饱和点不符；choice overload 元分析提示数量本身无普适最优（DOI 10.1086/651235） |
| 追加一轮的触发条件 | 直接证据缺失（见第 8 节）；间接：改变输入/视角比重复 prompt 有效（arXiv 2410.14255） | 需要可判定的触发规则 |

### 7.4 度量侧（可自动计算，供质量度量选型）

| 指标 | 可自动 | 出处 | 代价/限制 |
|---|---|---|---|
| Quantity / Variety | 是 | DOI 10.1016/s0142-694x(02)00034-0 | Variety 需分类轴，纯自动聚类会漂移 |
| Novelty（语义距离） | 是 | DOI 10.3758/s13428-020-01453-w | 需参照集；高距离 ≠ 有用 |
| Feasibility | LLM-as-judge 或人评 | arXiv 2411.02429；arXiv 2412.17596 | judge 校准风险（arXiv 2510.22954 显示 judge 在特异性偏好上校准差） |
| distinct-n / EAD | 是 | DOI 10.18653/v1/n16-1014；arXiv 2310.06452 | 长度偏置；语法层 |
| self-BLEU | 是 | DOI 10.1145/3209978.3210080 | 越低越多样；同样受长度影响 |
| Vendi Score | 是 | arXiv 2210.02410 | 需要选相似度函数；结果随其变化 |
| 平均成对 embedding 距离 / 相似度 | 是 | DOI 10.1126/sciadv.adn5290；DOI 10.1145/3635636.3656204 | 语义层；嵌入模型选择影响结果 |
| NLI diversity | 是 | arXiv 2310.06452 | 需额外 NLI 模型；逻辑层 |
| 覆盖度 / illumination | 是 | arXiv 1504.04909 | 需要变化轴定义 |
| 人类标注（金标准） | 否 | arXiv 2409.04109（100+ 专家） | 昂贵；专家间一致性有限 |

### 7.5 呈现侧

| 做法 | 外部证据 | 代价 |
|---|---|---|
| 给推荐 / 给默认 | 锚定效应成立（DOI 10.1126/science.185.4157.1124；DOI 10.1111/j.1467-9280.2006.01704.x）；AI 建议锚定 + 低专长者不折扣 AI（DOI 10.1038/s41746-021-00385-9） | 压缩独立判断 |
| 不给推荐，只给维度化评分 | 群体更适合辨识质量（DOI 10.1287/mnsc.1090.1144） | 决策者负担上升 |
| 先让决策者自陈方向，再展示候选 | 与 nominal group 证据方向一致（DOI 10.2307/255307） | 增加一次交互 |
| 分组轴呈现 / 分批展开 | 主题多样性可由线索提升（DOI 10.1145/3715928.3737486） | 需要设计分类轴 |
| 候选数量上限 | 平均效应为零、无充分条件（DOI 10.1086/651235）；经典单研究支持小集合（DOI 10.1037/0022-3514.79.6.995） | 两种做法各有反证 |
| 明示"哪些是模型给的" | 责任感差异（DOI 10.1145/3635636.3656204）；AI 来源标签影响评分（DOI 10.1038/s41746-021-00385-9） | — |
| 给出被淘汰候选及理由 | 收敛/评估环节被列为待解决问题（DOI 10.1145/3591196.3596821） | 呈现膨胀 |

---

## 8. 不可引用清单

> 以下条目在本会话中**未能取得可核对的一手出处**，或属于被广泛转述但原始来源/数值无法验证。**不要在 CARD-07 文档中作为事实引用。**

1. **"brainstorming 群体比同人数个人少产约 50% 想法"** —— 该数值在教科书与二手资料中广泛流传，本会话在 Diehl & Stroebe 1987、Mullen 1991 的可获取元数据与 Europe PMC 全文中**未取到该具体百分比**。可引用的只有方向性结论（群体少于个人之和）与三种机制。若需数值，必须先取得原文。
2. **Rohrbach 1969 关于 6-3-5 brainwriting 的原始出版物** —— 未找到可核对 DOI 或原始书目；仅找到 2013 年二手书章（DOI 10.1016/b978-0-12-407157-5.00002-6）。技法本身可引该书章，**不可把 1969 年原始出处写成已验证事实**。
3. **de Bono,《Six Thinking Hats》(1985) 与《Lateral Thinking》(1970) 的原始版本** —— Crossref 未返回原书 DOI；只找到 1988 年对该书的期刊评介（DOI 10.1590/s0034-75901988000100011）与若干应用研究。引用时应写"书（版本以出版社信息为准）"而**不要编造 DOI**。
4. **Osborn,《Applied Imagination》(1953) 的原始版本** —— Crossref 检索未返回原书条目。可引二手讨论（DOI 10.7771/1932-6246.1093），不可声称已核实原书页码/表述。
5. **Design Council "Double Diamond 于 2004 年提出" 的年份** —— 官方框架页可访问，但本会话抓取到的页面文本**未陈述提出年份**。不要引用具体年份。
6. **"让 LLM『再想 10 个』能显著提升新颖性"** —— 本会话**未找到直接对照实验**。可用的是间接证据（放量提升覆盖度 SSRN 10.2139/ssrn.4526071；检索增强迭代规划 3.4× arXiv 2410.14255）。**不可表述为"已被实验证明追加提示有效"**。
7. **"self-BLEU 一定惩罚短文本 / distinct-n 一定偏好长文本" 的定量幅度** —— 方向性偏置在 Kirk et al. 中被以"使用 EAD 以去除偏向短输出的偏置"的方式提及，但本会话未取到系统的量化对照。只可写"文献为此使用 EAD 等修正"，不可给幅度数字。
8. **"24 种选项导致购买率下降 X%"** —— Iyengar & Lepper 2000 的经典数值未在本会话取到原文（DOI 已验证，全文未取）。不要引用具体百分比。
9. **Wikipedia / 博客 / 厂商文档中关于"多智能体一定提升创造力"或"多智能体一定降低多样性"的单边断言** —— 本报告第 3 节显示两层结论并存，任何单边断言均与本会话证据不符。
10. **arXiv 2607.27553 / SSRN 10.2139/ssrn.4526071 中"7 倍更容易进 top 10%"的具体统计口径** —— 摘要给出该数字，但本会话**未取到全文**（arXiv HTML v1/v2 均 404）。引用时应标注"据摘要"，不可扩写为其它统计量。
11. **本报告未逐条取用但出现在检索结果中的条目**（仅列出以免被误当已核实）：arXiv 2405.13012（Divergent Creativity in Humans and LLMs）、DOI 10.1038/s41598-025-25157-3、DOI 10.1038/s41598-025-21398-4、DOI 10.1002/jocb.70022、arXiv 2605.00435、arXiv 2609.16454、arXiv 2602.07464、arXiv 2602.06665、arXiv 2601.06116。这些**未在本报告中作为结论依据**。
12. **检索工具限制**：`anysearch_search` / `web_search` / `web_fetch` 本次全部因配额返回 402，故**没有使用任务指定工具链**。所有一手校验均通过 OpenAlex / Crossref / Semantic Scholar / arXiv / Europe PMC / Unpaywall / RePEc 的公开 API 完成。若需要更完整的学术覆盖（尤其非 OA 期刊全文），应在配额恢复后重跑一次。

---

## 9. 来源清单（URL / DOI）

### 9.1 发散技法与流程框架

| 条目 | 标识 |
|---|---|
| Design Council, The Double Diamond | https://www.designcouncil.org.uk/our-resources/the-double-diamond/ |
| Zwicky, The Morphological Approach to Discovery, Invention, Research and Construction (1967) | DOI 10.1007/978-3-642-87617-2_14 |
| Eberle, SCAMPER（Routledge 重版） | DOI 10.4324/9781003423560 |
| Terninko, Zusman & Zlotin, Systematic Innovation: An Introduction to TRIZ | DOI 10.4324/9781482279160 |
| Wilson, "Brainwriting", in *Brainstorming and Beyond* (2013) | DOI 10.1016/b978-0-12-407157-5.00002-6 |
| Gentner, Structure-mapping: A Theoretical Framework for Analogy (1983) | DOI 10.1207/s15516709cog0702_3 |
| Acar, Tarakci & van Knippenberg, Creativity and Innovation Under Constraints (2019) | DOI 10.1177/0149206318805832 |
| Delbecq & Van de Ven, Nominal Versus Interacting Group Processes (1971) | DOI 10.2307/255307 |
| Van de Ven & Delbecq, Effectiveness of Nominal, Delphi, and Interacting Group Decision Making (1974) | DOI 10.2307/255641 |
| Users' perspective on how creativity techniques help in idea generation (2021) | DOI 10.1111/caim.12424 |
| Quality, Conformity, and Conflict: Questioning the Assumptions of Osborn's Brainstorming Technique (2011) | DOI 10.7771/1932-6246.1093 |
| The Idea Machine: LLM-based Expansion, Rewriting, Combination, and Suggestion of Ideas (2022) | DOI 10.1145/3527927.3535197 |

### 9.2 度量方法

| 条目 | 标识 |
|---|---|
| Shah, Vargas-Hernandez & Smith, Metrics for measuring ideation effectiveness (2003) | DOI 10.1016/s0142-694x(02)00034-0 |
| Refined metrics for measuring ideation effectiveness (2009) | DOI 10.1016/j.destud.2009.07.002 |
| Beaty & Johnson, SemDis (2021) | DOI 10.3758/s13428-020-01453-w |
| Beyond semantic distance: Automated scoring of divergent thinking with LLMs (2023) | DOI 10.1016/j.tsc.2023.101356 |
| Semantic Distance and the Alternate Uses Task (2022) | DOI 10.1080/10400419.2022.2025720 |
| Li et al., A Diversity-Promoting Objective Function for Neural Conversation Models (2016) | DOI 10.18653/v1/n16-1014 |
| Zhu et al., Texygen (2018) | DOI 10.1145/3209978.3210080 |
| Wiher et al., On Decoding Strategies for Neural Text Generators (2022) | DOI 10.1162/tacl_a_00502 |
| Friedman & Dieng, The Vendi Score | arXiv 2210.02410 |
| Mouret & Clune, Illuminating search spaces by mapping elites | arXiv 1504.04909 |
| Enhancing user creativity: Semantic measures for idea generation | DOI 10.1016/j.knosys.2018.03.016 |
| Testing Computational Assessment of Idea Novelty in Crowdsourcing | DOI 10.1080/10400419.2023.2187544 |
| LiveIdeaBench | arXiv 2412.17596 |
| IdeaBench | arXiv 2411.02429 |
| Magic, Madness, Heaven, Sin: LLM Output Diversity framework | arXiv 2604.01504 |
| Probing the "Creativity" of LLMs: divergent semantic association | DOI 10.18653/v1/2023.findings-emnlp.858 |

### 9.3 LLM 发散失效模式

| 条目 | 标识 |
|---|---|
| Artificial Hivemind: The Open-Ended Homogeneity of Language Models | arXiv 2510.22954 |
| Doshi & Hauser, Generative AI enhances individual creativity but reduces the collective diversity of novel content (Science Advances 2024) | DOI 10.1126/sciadv.adn5290（全文 PMC11244532） |
| Anderson et al., Homogenization Effects of LLMs on Human Creative Ideation (C&C 2024) | DOI 10.1145/3635636.3656204 / arXiv 2402.01536 |
| Kirk et al., Understanding the Effects of RLHF on LLM Generalisation and Diversity | arXiv 2310.06452 |
| Verbalized Sampling: How to Mitigate Mode Collapse and Unlock LLM Diversity | arXiv 2510.01171 |
| Renze & Guven, The Effect of Sampling Temperature on Problem Solving in LLMs | DOI 10.18653/v1/2024.findings-emnlp.432 / arXiv 2402.05201 |
| Zheng et al., When "A Helpful Assistant" Is Not Really Helpful: Personas in System Prompts | DOI 10.18653/v1/2024.findings-emnlp.888 / arXiv 2311.10054 |
| Nguyen et al., Creative Generation via Multi-Agent Debate: Does Debate Suppress Diversity? | arXiv 2609.00683 |
| DynaDebate: Breaking Homogeneity in Multi-Agent Debate | arXiv 2601.05746 |
| Talk Isn't Always Cheap: Understanding Failure Modes in Multi-Agent Debate | arXiv 2509.05396 |
| Demystifying Multi-Agent Debate: The Role of Confidence and Diversity | arXiv 2601.19921 |
| Zhang et al., Exploring Collaboration Mechanisms for LLM Agents: A Social Psychology View (ACL 2024) | DOI 10.18653/v1/2024.acl-long.782 / arXiv 2310.02124 |
| Liang et al., Encouraging Divergent Thinking in LLMs through Multi-Agent Debate | arXiv 2305.19118 |
| Si, Yang & Hashimoto, Can LLMs Generate Novel Research Ideas? | arXiv 2409.04109 |
| Nova: Iterative Planning and Search for Novelty and Diversity | arXiv 2410.14255 |
| VirSci: Many Heads Are Better Than One | arXiv 2410.09403 |
| IDEAFix: Evaluation Framework for Creative Defixation Prompting | arXiv 2606.00875 |
| CreativityNeuro: Steering Weights to Improve Divergent Thinking and Reduce Mode Collapse | arXiv 2607.01433 |
| Beyond One Path: Evaluating and Enhancing Divergent Thinking in Interactive LLM Agents (MUTATE / ReDNA) | arXiv 2605.28465 |
| Group-Aware Reinforcement Learning for Output Diversity in LLMs | arXiv 2511.12596 |
| Wang et al., Self-Consistency Improves Chain of Thought Reasoning | DOI 10.48550/arxiv.2203.11171 |
| Holtzman et al., The Curious Case of Neural Text Degeneration | arXiv 1904.09751 |
| Haase & Hanel, AI is more creative than humans on divergent thinking tasks (Sci Rep 2024) | DOI 10.1038/s41598-024-53303-w（全文 PMC10858891） |
| AI and Its Impact on Creativity and Diversity (LLM-Generated Product Ideas) | SSRN DOI 10.2139/ssrn.4526071 / arXiv 2607.27553 |

### 9.4 群体 brainstorming 与停止规则

| 条目 | 标识 |
|---|---|
| Diehl & Stroebe, Productivity loss in brainstorming groups (1987) | DOI 10.1037/0022-3514.53.3.497 |
| Mullen, Johnson & Salas, Productivity Loss in Brainstorming Groups: A Meta-Analytic Integration (1991) | DOI 10.1207/s15324834basp1201_1 |
| Can a Part be Greater Than the Whole?（对元分析的质疑） | DOI 10.1207/s15324834basp1201_3 |
| Unblocking brainstorms (J Applied Psychology 1991) | DOI 10.1037/0021-9010.76.1.137 |
| Nijstad & Stroebe, How the group affects the mind: SIAM (2006) | DOI 10.1207/s15327957pspr1003_1 |
| Stroebe, Nijstad & Rietzschel, Beyond Productivity Loss in Brainstorming Groups (2010) | DOI 10.1016/s0065-2601(10)43004-x |
| Girotra, Terwiesch & Ulrich, Idea Generation and the Quality of the Best Idea (2010) | DOI 10.1287/mnsc.1090.1144 |
| Toubia, Idea Generation, Creativity, and Incentives (2006) | DOI 10.1287/mksc.1050.0166 |
| The medium matters: meta-analysis of electronic group brainstorming | DOI 10.1016/j.chb.2005.07.003 |
| Improving extreme-scale problem solving (Human Factors 2009) | DOI 10.1177/0018720809343587 |
| Group versus individual performance on ideational proficiency: A review (1973) | DOI 10.1002/ejsp.2420030402 |
| Jansson & Smith, Design fixation (1991) | DOI 10.1016/0142-694x(91)90003-f |
| Where next for research on fixation, inspiration and creativity in design? (2017) | DOI 10.1016/j.destud.2017.02.001 |
| Collaborative fixation: Effects of others' ideas on brainstorming (2010) | DOI 10.1002/acp.1699 |
| Virtual communication curbs creative idea generation (Nature 2022) | DOI 10.1038/s41586-022-04643-y |
| The nominal group as a research instrument (1972) | DOI 10.2105/ajph.62.3.337 |

### 9.5 呈现形态与锚定

| 条目 | 标识 |
|---|---|
| Tversky & Kahneman, Judgment under Uncertainty (Science 1974) | DOI 10.1126/science.185.4157.1124 |
| Epley & Gilovich, The Anchoring-and-Adjustment Heuristic (2006) | DOI 10.1111/j.1467-9280.2006.01704.x |
| Iyengar & Lepper, When choice is demotivating (2000) | DOI 10.1037/0022-3514.79.6.995 |
| Scheibehenne, Greifeneder & Todd, Can There Ever Be Too Many Options? (2010) | DOI 10.1086/651235 |
| Do as AI say: susceptibility in deployment of clinical decision-aids (2021) | DOI 10.1038/s41746-021-00385-9 |
| AI-Moderated Decision-Making: Capturing and Balancing Anchoring Bias (CHI 2022) | DOI 10.1145/3491102.3517443 |
| Cognitive Bias in AI Recommendations (HAI 2025) | DOI 10.1145/3765766.3765887 |
| Cueing the Crowd: LLM-Driven Conversational Cues Increase Topical Diversity (CI 2025) | DOI 10.1145/3715928.3737486 |
| Decisions with ChatGPT: Reexamining choice overload (2023) | DOI 10.1016/j.jretconser.2023.103494 |
| CSTs and Convergent Thinking: A Preliminary Review (C&C 2023) | DOI 10.1145/3591196.3596821 |
| The effectiveness of nudging: meta-analysis (PNAS 2021) | DOI 10.1073/pnas.2107346118 |
| Idea crowdsourcing platforms: idea quality and number of submitted ideas (2023) | DOI 10.1016/j.dss.2023.114041 |

### 9.6 检索接口（方法学留痕）

- OpenAlex：`https://api.openalex.org/works`（免费额度中途耗尽）
- Crossref：`https://api.crossref.org/works`
- Semantic Scholar Graph：`https://api.semanticscholar.org/graph/v1/paper/search`（限流频繁）
- arXiv API / abs 页 / HTML 全文：`http://export.arxiv.org/api/query`、`https://arxiv.org/abs/<id>`、`https://arxiv.org/html/<id>`
- Europe PMC（含 PMC 全文 XML）：`https://www.ebi.ac.uk/europepmc/webservices/rest/`
- Unpaywall：`https://api.unpaywall.org/v2/<doi>`
- RePEc/IDEAS：`https://ideas.repec.org/`
