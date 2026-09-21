# R-G：规格文档（spec）的叙事结构与可分解性设计

> **调研目标**：回答一个具体的架构决策问题——决策者已否掉「10 节表单式 spec」（`速读卡/目标与非目标/硬约束/需求/架构/验收/测试/改动范围/未决/覆盖矩阵/附录`），理由是「太工程化，不适合高智力模型拆解成 phase 文件，也不适合阅读和审查」。本报告要找的是：**既能被人流畅阅读与审查、又能被强模型自然拆解成工作包、又不遗漏关键约束**的 spec 结构。
> **方法**：`web_search` + `anysearch_search`（`general.general` / `academic.search` / `academic.preprint`）+ `web_fetch`，配额耗尽后改用 `curl` 直取原文 PDF 与 Crossref/OpenAlex/arXiv/Europe PMC API。**优先一手来源**（官方模板、原始 RFC/PEP/KEP 文本、原始论文、官方风格指南）。
> **生成时间**：2026-09-20。
> **证据分级**：`★实证`＝有数字/样本的论文或实验；`◆一手`＝规范/模板/创始人原文；`◇官方`＝官方文档、官方指南；`○经验`＝从业者框架、当事人叙述、社区轶事；`△外推`＝把别的任务/语言/域的证据迁移到「中文规格拆解」。
> **配套报告**：R-A（SDD 框架文档设计）、R-B（弱模型可执行规格）、R-C（验收与测试设计）、R-D（审查流程设计）、R-E（文档精炼度工程）。本报告**不重复**它们的结论，只在其边界之外补三件事：**叙事骨架的一手体例剖析**、**可分解性（seam）理论**、**人读 vs 机器读的张力**。

---

## 0. 摘要（TL;DR）

1. **被否掉的不是「10 节」，而是「组织轴」。** 一流规格文档都有一条**唯一的线性论证链**（问题→改成什么→为什么这样改→怎么知道改对了），章节是**有序的、后一节依赖前一节**；而 10 节表单是按**信息种类（taxonomy）**切分的**并列容器**，可以任意顺序填、任意顺序读，读者必须自己在脑中重建因果链。**修正方向不是减少章节，而是换轴**（详见 §1）。
2. **七类一流文档的前 1/4 永远是「一段话摘要 + 问题/动机」，且动机被明文要求「不要和方案耦合」。** React RFC 原文：*"enumerate the constraints you are trying to solve without coupling them too closely to the solution you have in mind"*；Rust RFC：*"Any changes to Rust should focus on solving a problem that users of Rust are having"*；PEP 1：*"PEP submissions without sufficient motivation may be rejected"*（◆一手，§2）。
3. **「为什么不这么做 / 还考虑过什么」被制度化为必填，而且被公开称为最重要的章节之一。** Google：*"this section is one of the most important ones as it shows very explicitly why the selected solution is the best given the project goals"*；PEP：记录被否方案 *"prevents people from bringing up the same rejected idea again"*（◆一手，§2）。
4. **存在一个现成的「人读层 / 机器读层」分离范式：Rust RFC 的 Guide-level / Reference-level。** 原文：*"Explain the proposal as if it was already included in the language and you were teaching it to another Rust programmer"*（引导层）＋ *"This is the technical portion… Corner cases are dissected by example. The section should return to the examples given in the previous section"*（参考层）。PEP 的 `How to Teach This`、KEP 的 `User Stories` 是同一思路的不同投影（◆一手，§2、§8）。
5. **可分解性有明确的判据，而且这些判据都**不是**「按文档分类」：** Parnas 1972 反对按 flowchart/处理步骤分解，主张按「**可能变化的设计决策**」分解（◆一手）；Feathers 的 seam＝*"a place where you can alter behavior in your program without editing in that place"*；Team Topologies 的 fracture plane＝*"a natural seam in the software system that allows the system to be split easily into two or more parts"*；实务清单有 Humanizing Work 9 种切分模式与 Cohn 的 SPIDR（○经验）（§3）。
6. **纯结构化流程并不自动提升审查质量，这是本次找到的最硬的反面实证。** Porter/Votta/Basili 1995（48 名研究生 × 16 组 × 3 种方法）：**Checklist 审阅者并不比 Ad Hoc 更有效**；收集会议对缺陷发现率**没有净改善**，且约 **7%** 已发现的缺陷在结构化收集环节丢失；而 **Scenario 方法的团队缺陷发现率显著更高**（0.57/0.45 vs 0.41/0.24，p<0.01）★实证（§4、§5）。
7. **「bullet 更好记」是半个真话，且有边界条件。** Jansen 2014（5 个实验）：bullet 提高**系列条目**回忆，但**降低周边正文回忆**，且条目异质时正效应消失 ★实证。Sweller 认知负荷线：分离的信息源（split-attention）与**重复呈现（redundancy）都损害学习**，且出现 expertise 反转 ★实证（§4）。
8. **把 spec 写成强结构（JSON/表格约束）对推理是负面的。** Tam et al. 2024（EMNLP Industry）：*"significant decline in LLMs' reasoning abilities under format restrictions… stricter format constraints generally lead to greater performance degradation"*；Claude-3-Haiku 在 GSM8K 上 **86.51 → 23.44** ★实证。Valmeekam et al.（NeurIPS 2023）同域直接对比：规划任务上 **自然语言 34.3% vs PDDL 12.5%** ★实证（§6）。
9. **但「叙事优于表格」作为 LLM 输入没有直接实证，且长度证据偏向不利于冗长叙事。** He et al. 2024 根本**没测表格**；格式偏好 model-dependent（GPT-3.5 偏 JSON、GPT-4 偏 Markdown）★实证。ETH《Evaluating AGENTS.md》：上下文文件平均**降低**成功率、成本 **+20%**；IFScale：**500 条指令时最强模型仅 68%** ★实证。所以结论必须写成：**支持「前向顺序」「结论前置」「控制长度与信号密度」「避免强格式约束」；「叙事 vs 表格」标△外推并需自测**（§6、§10）。
10. **场景驱动的证据强度是「窄而硬」**：Scenario 检查方法提升缺陷发现率有 1995 年的对照实验 ★实证；但 **BDD/Gherkin 提升质量没有任何严格对照实证**（166 篇系统映射研究明确说指标缺失、工业评估稀缺）（§5）。
11. **反面案例很多，但必须分清证据等级。** CAIB 2003 只说 PowerPoint 是 NASA 技术沟通问题的**例证**，**没有**认定它是事故根因（强因果是 Tufte 的立场）——引用时不可混同。可核实的一手数字：英国 NPfIT 花了 **£2.7bn** 不代表资金价值、七年只交付 97 套中的 4 套；Franch 2023（12 公司 24 人）**75% 用模板，但只有 17% 引用真标准，64% 只用于版式**，而歧义/不一致/不完整仍是最频繁困难 ★实证（§9）。
12. **最终产出 4 个候选结构**（§11），推荐 **候选 D「薄叙事主干 + 机器可读契约附件」** 作为本项目默认形态，并用 **候选 B 的双层（动机→教学层→参考层）** 作为主干内部结构、**候选 C 的切片**作为参考层的分节轴、**候选 A 的问题先行 + FAQ** 作为开头与风险节。失效条件在 §11 明确列出。

★/◆/◇/○/△ 标记贯穿全文；互相矛盾的证据集中在 **§10**，被证伪或无法核实的流行说法也在 §10。

---

## 1. 问题诊断：被否掉的不是「10 节」，而是「组织轴」

决策者说「太工程化」。这句话可以拆成一个可操作的技术判断，而不是审美偏好。

### 1.1 一份文档只有三种可能的组织轴

| 组织轴 | 章节之间的关系 | 读者的动作 | 典型代表 |
|---|---|---|---|
| **轴 1：信息种类（taxonomy）** | **并列容器**，可任意顺序读、任意顺序填 | 逐格查找「我要的那类信息在哪一格」 | IEEE 830 式 SRS 模板、被否掉的 10 节表单、字段矩阵 |
| **轴 2：论证推进（argument）** | **有序链**，后一节以前一节成立为前提 | 从头读到尾，形成一条因果链 | PR/FAQ、Rust RFC、Shape Up pitch、Amazon 6-pager |
| **轴 3：交付切片（seam）** | **可独立交付/验证的单元**，单元之间靠依赖声明连接 | 按片阅读、按片执行、按片审查 | KEP 的 User Stories、用户故事地图、vertical slice |

**10 节表单属于轴 1。** 这不是「节太多」的问题：RFC 7322 的强制章节比它更多，KEP 模板比它更长，但没人说它们「太工程化」。差别在于**轴**：RFC/KEP 的章节是一条链，表单的章节是一个抽屉柜。

### 1.2 表单式结构为什么同时伤害「拆解」与「审查」

**(a) 并列容器破坏因果链，而因果链正是审查的对象。**
Bezos 2004 年禁 PPT 的内部邮件把机制讲得最直白（◆一手，经 Business Insider 转录）：

> *"Well structured, narrative text is what we're after rather than just text. If someone builds a list of bullet points in word, that would be just as bad as powerpoint."*
> *"The reason writing a 4 page memo is harder than 'writing' a 20 page powerpoint is because the narrative structure of a good memo forces better thought and better understanding of what's more important than what, and how things are related."*
> *"Powerpoint-style presentations somehow give permission to gloss over ideas, flatten out any sense of relative importance, and ignore the innerconnectedness of ideas."*
> （译：我们要的是结构良好的叙事文本，而不只是文字；在 Word 里列一堆 bullet 和 PPT 一样糟。写 4 页备忘录比「写」20 页 PPT 更难，因为好备忘录的叙事结构逼你更好地思考：什么比什么更重要、事物之间如何关联。PPT 式演示给了人许可：含糊带过、抹平相对重要性、忽略想法间的内在联系。）

Bezos 说的是 bullet，但**字段化表格走的是同一条路**：它把「什么比什么更重要」这个判断从文本里抽走，交给列名和填表人去决定。

**(b) 字段化迫使「填空」，而「无内容」与「未想清楚」在表单里长得一模一样。**
NASA 的对照口径是：不完整的部分要登记为 **TBR（To Be Resolved）**，且必须带**理由 + 消除责任人 + 期限**（◆官方，NASA SEH Appendix C）。换言之，**「显式声明未解决」是有成本的、需要署名的动作**；表单式模板里空格填「无」几乎零成本，于是「没想清楚」被伪装成「不适用」。

实证支持这个担忧：Franch et al. 2023（Requirements Engineering，12 家公司 24 名从业者）发现 **18/24（75%）** 使用模板或指南，但模板来源以**组织自定**为主（11/18 = 61%）、**真正引用标准仅 3 人（17%）**，用途以**文档版式 9/14（64%）**居首；而从业者报告的**最频繁困难仍是歧义、不一致、不完整** ★实证。Frattini 2024（REFSQ，工业案例）识别出 **17 个需求质量因素 + 11 个交互效应**，说明「什么算好需求」高度依赖上下文，**难以固化成模板字段** ★实证。

**(c) 按信息种类组织 ⟹ seam 不可见 ⟹ 拆 phase 时必须跨 10 个容器重组。**
这是「不适合高智力模型拆解」的直接机理：拆解者需要的是**边界**，而表单给的是**分类维度**。Parnas 1972 早就论证过同类错误：分解的判据应当是「**可能变化的设计决策**」，而不是「处理流程的步骤」；原文 *"it is almost always incorrect to begin the decomposition of a system into modules on the basis of a flowchart"*（◆一手，详见 §3）。表单式 spec 的 10 个章节，就是文档学意义上的「flowchart 步骤」。

**(d) 结构化程序本身不保证审查质量——这是本次找到的最硬的反证。**
Porter, Votta & Basili 1995（IEEE TSE，48 名计算机研究生、16 个三人小组、每份 SRS 用 Ad Hoc / Checklist / Scenario 三种方法之一）★实证：

- 团队缺陷发现率（Table III 均值）：Scenario **0.57 / 0.45** ＞ Ad Hoc **0.43 / 0.31** ＞ Checklist **0.41 / 0.24**；ANOVA **p < 0.01**；
- 原文结论：***"Checklist reviewers were no more effective than Ad Hoc reviewers"***（清单审阅者并不比无方法审阅者更有效）；
- 原文结论：***"Collection meetings produced no net improvement in the fault detection rate (meeting gains were offset by meeting losses)"***；
- 会议损失率（个人已发现、但在结构化收集会上从未被报告的缺陷占比）**约 6.8%–7.7%** ★实证。

也就是说：**结构化清单既不提升发现率，结构化收集环节还会「谈掉」约 7% 的已发现缺陷。** 真正有效的是 **Scenario**——按**使用场景**组织检查程序。这条证据同时打击「表单式 spec」和「靠覆盖矩阵保证无遗漏」（§5、§10 有边界说明）。

### 1.3 由此得到的修正方向

不是「把 10 节删到 5 节」，而是三条同时做：

1. **主干换成轴 2**（一条线性论证链，章节有序、后节依赖前节）；
2. **正文的分节轴换成轴 3**（按 seam/切片分节，让 phase 边界在正文里可见）；
3. **把轴 1 降级到附录/附件**（需求登记表、覆盖映射、写集、术语——结构化不是被消灭，而是**不再占据读者从头到尾的那条路**）。

---

## 2. 问题 1：七类一流规格文档的叙事骨架（逐一体例剖析）

> 本节所有引文均为**实抓原文逐字**（Q1 取证：11 个原始来源，成功 11/11）。同时列出**三处「广为流传但其实不存在」的引文**，防止后续报告互引造假。

### 2.1 横向对照表：七类文档的骨架顺序

| 类型 | 骨架（按顺序） | 主干一句话 |
|---|---|---|
| **Amazon PR/FAQ** | 标题 → 副标题（客户+收益 1 句）→ 摘要段 → **问题段（客户视角）** → **方案段** → 引语/如何开始 → **External FAQ** → **Internal FAQ**（21 条标准问题） | 客户问题 → 客户价值方案（新闻稿体） → 内外部质疑全清单 |
| **Amazon 6-pager** | Introduction（执行摘要）→ Goals → Tenets → State of the Business → Lessons Learned → Strategic Priorities → Appendix | 背景与教训 → 目标 → 举措（6 页） |
| **Google Design Doc** | Context and scope → **Goals and non-goals** → The actual design（先 overview 后细节）→ **Alternatives considered** → Cross-cutting concerns | 客观背景 → 目标/非目标 → 方案与权衡 → 被否方案 → 横切关注 |
| **Rust RFC** | Summary → **Motivation** → **Guide-level explanation** → **Reference-level explanation** → Drawbacks → Rationale and alternatives → Prior art → **Unresolved questions** → Future possibilities | 问题与用例 → 教学层 → 参考层 → 为什么不 → 为什么是它 → 未决与未来 |
| **Python PEP** | Preamble → Abstract → **Motivation** → **Specification** → **Rationale** → Backwards Compatibility → Security Implications → **How to Teach This** → Reference Implementation → **Rejected Ideas** → Open Issues | 摘要 → 为什么现在不行 → 具体怎么改 → 为何这样改（含反例） → 兼容/安全/教学 → 实现 → 被否/未决 |
| **Kubernetes KEP** | Release Signoff Checklist → Summary → Motivation → Goals/Non-Goals → Proposal → **User Stories** → Notes/Constraints/Caveats → Risks and Mitigations → Design Details → **Test Plan** → **Graduation Criteria** → Upgrade/Downgrade → Version Skew → **PRR 问卷** → Implementation History → **Drawbacks** → **Alternatives** | 摘要+动机 → 提案+用户故事+风险 → 设计+测试+毕业 → 生产就绪问卷 → 历史 → 缺点 → 替代 |
| **React RFC** | Summary → **Basic example** → Motivation → Detailed design → Drawbacks → Alternatives → Adoption strategy → **How we teach this** → Unresolved questions | 摘要+最小示例 → 动机 → 详细设计 → 缺点 → 替代 → 采用 → 教学 → 未决 |
| **IETF RFC（7322）** | First-page header → Title → Abstract → Stream Note → Status of This Memo → Copyright → TOC → **Introduction（动机）** → **Requirements Language（RFC 2119）** → 正文 → IANA → Internationalization → Security → References（Normative/Informative）→ Appendix → Acknowledgements → Contributors → Author's Address | 摘要 → 引言（动机） → 正文（需求语言） → 安全 → 引用 → 附录 |

### 2.2 逐类原文摘录（只抄对「可读 + 可评审」有用的句子）

#### (1) Amazon PR/FAQ —— 「先写新闻稿，再写 FAQ」
骨架顺序固定：**Problem Paragraph → Solution Paragraph(s) → Quotes & Getting Started → External FAQ → Internal FAQ**。

- *"A well-written PR defines a specific objective– a destination where there is a treasure. Think of the FAQ section as the map to that destination and a detailed description of the dragons you will need to slay along your journey."*（好 PR 定义一个有宝藏的目的地；把 FAQ 当作地图和一路上要斩杀的恶龙的详细描述。）
- *"An excellent FAQ demonstrates mastery of every aspect of the product. It should be optimistic but also realistic... It should demonstrate that multiple options were considered."*（优秀 FAQ 展示对产品每个方面的掌握，乐观但务实，并证明考虑过多个选项。）
- *"The first draft of a PR/FAQ should take only a few hours, not a few days."*（初稿只需几小时，不是几天。）

**可评审性设计**：FAQ 是**质疑的预登记**——审查者的工作不是「想出问题」，而是「检查问题是否已被回答」。这与 KEP 的 PRR 逻辑一致（§6.3）。

#### (2) Amazon 6-pager —— 「禁 bullet + 会议静读」
- Bezos 2017 股东信（◆一手）：*"We don't do PowerPoint (or any other slide-oriented) presentations at Amazon. Instead, we write narratively structured six-page memos. We silently read one at the beginning of each meeting in a kind of 'study hall.'"*
- 静读机制的意义（CNBC 2018 转述 Bezos）：备忘录 *"supposed to create the context for what will then be a good discussion"*。

**⚠️ 证据边界**：6-pager 的六节名称（Introduction/Goals/Tenets/State of Business/Lessons Learned/Strategic Priorities）**只有二手来源**（sixpagermemo.com 与 auditless 两处独立转述一致），Amazon **未发布官方模板**；Bezos 2017 股东信只证实「六页」与「静读机制」。

#### (3) Google Design Doc
- *"Design docs are informal documents and thus don't follow a strict guideline for their content. Rule #1 is: Write them in whatever form makes the most sense for the particular project."*
- *"The design doc is the place to write down the trade-offs you made in designing your software. Focus on those trade-offs to produce a useful document with long-term value."*
- *"This isn't a requirements doc. Keep it succinct! … This section should be entirely focused on objective background facts."*（Context 节）
- *"non-goals aren't negated goals like 'The system shouldn't crash', but rather things that could reasonably be goals, but are explicitly chosen not to be goals."*（非目标的定义）
- *"This section should start with an overview and then go into details."*（The actual design 节 → **先总览后细节**的公开原文）
- *"this section is one of the most important ones as it shows very explicitly why the selected solution is the best given the project goals"*（Alternatives considered）
- 长度：*"short enough to actually be read by busy people. The sweet spot for a larger project seems to be around 10-20ish pages."*；增量改进可写 **1–3 页 mini design doc**。
- 评审：*"Reviews can add a lot of value, but they are also a dangerous trap of overhead, so treat them wisely."*；*"The primary value of the review isn't that issues get discovered per-se, but rather that this happens relatively early in the development lifecycle when it is still relatively cheap to make changes."*

**⚠️ 未获取到**：该文全文**没有**「design doc 是 vehicles for discussion（讨论载体）」这句话；最接近的是站点列的 *"Achieving consensus around a design in the organization"*。**不要引用不存在的原句。**

#### (4) Rust RFC —— 本报告最重要的模板（人读层 / 机器读层分离）
全部章节**无标注可选**（除模板头信息）。原文逐字：

- Motivation：*"Any changes to Rust should focus on solving a problem that users of Rust are having. This section should explain this problem in detail, including necessary background. It should also contain several specific use cases where this feature can help a user, and explain how it helps. This can then be used to guide the design of the feature. This section is one of the most important sections of any RFC, and can be lengthy."*
- **Guide-level explanation**：*"Explain the proposal as if it was already included in the language and you were teaching it to another Rust programmer. That generally means: Introducing new named concepts. **Explaining the feature largely in terms of examples.** Explaining how Rust programmers should *think* about the feature, and how it should impact the way they use Rust… Discuss how this impacts the ability to read, understand, and maintain Rust code."*
- **Reference-level explanation**：*"This is the technical portion of the RFC. Explain the design in sufficient detail that: Its interaction with other features is clear. It is reasonably clear how the feature would be implemented. **Corner cases are dissected by example.**"* ＋ *"**The section should return to the examples given in the previous section**, and explain more fully how the detailed proposal makes those examples work."*
- Drawbacks：全文仅一句 —— *"Why should we *not* do this?"*
- Unresolved questions（**限定为三类必答**）：*"What parts of the design do you expect to resolve through the RFC process before this gets merged? What parts of the design do you expect to resolve through the implementation of this feature before stabilization? What related issues do you consider out of scope for this RFC that could be addressed in the future independently of the solution that comes out of this RFC?"*

**为什么这对本任务关键**：Guide-level = **给人读的叙事层**（例子驱动、教心智模型）；Reference-level = **给实现者/拆解者读的规格层**（细节、交互、边界情况）。两层用**同一批例子**串起来（"return to the examples given in the previous section"）。这正好对应本项目的三角色：人读 guide、强模型读 reference 并切 phase、弱模型执行 phase。

#### (5) Python PEP —— 「先规范，后理由」的显式排序
- PEP 1 章节顺序：Abstract → **Motivation** → **Specification** → **Rationale** → Backwards Compatibility → Security Implications → **How to Teach This** → Reference Implementation → **Rejected Ideas** → Open Issues。
- **重要时序事实**：PEP 12 在 **2026-02-22** 明确变更 —— *"The `Rationale` section now comes after the `Specification` section."*（**理由移到规范之后**）。也就是说，「先说改成什么、再说为什么这样改」是**刚刚被官方确认**的排序，而不是「动机 → 理由 → 规范」的直觉顺序。
- Motivation：*"It should clearly explain why the existing language specification is inadequate to address the problem that the PEP solves. ... PEP submissions without sufficient motivation may be rejected."*
- Rationale：*"The rationale fleshes out the specification by describing why particular design decisions were made. It should describe alternate designs that were considered and related work... The rationale should provide evidence of consensus within the community and discuss important objections or concerns raised during discussion."*
- How to Teach This：*"it is helpful to include a section on how to teach users, new and experienced, how to apply the PEP to their work."*
- Rejected Ideas：*"Those rejected ideas should be recorded along with the reasoning as to why they were rejected. This both helps record the thought process behind the final version … as well as preventing people from bringing up the same rejected idea again in subsequent discussions."*
- 流程侧：*"The PEP author is responsible for building consensus within the community and documenting dissenting opinions."*

**可迁移规则**：**Specification 在 Rationale 之前**——先给读者「改成什么样」，再用理由加固。这直接反驳「必须先讲一堆背景和理由才能讲方案」的写法，也解释了为什么长 spec 读起来累：读者在没看到方案前被灌了一堆动机。

#### (6) Kubernetes KEP —— 用户故事 + 测试计划 + 毕业标准
- 模板引导语（◆一手）：*"**Merge early and iterate.** Avoid getting hung up on specific details and instead aim to get the goals of the KEP clarified and merged quickly. The best way to do this is to just start with the high-level sections and fill out details incrementally in subsequent PRs."*
- User Stories 指导语：*"Detail the things that people will be able to do if this KEP is implemented. Include as much detail as possible so that people can understand the 'how' of the system. The goal here is to make this feel real for users without getting bogged down."*
- 真实 KEP 写法（KEP-1880，◆一手）是单句式：*"As a Kubernetes user I want to be able to dynamically increase the number of IPs available for Services."* / *"As a Kubernetes admin I want to have a process that allows me to renumber my Services IPs."*
- Risks and Mitigations：*"What are the risks of this proposal, and how do we mitigate? Think broadly. For example, consider both security and how this will impact the larger Kubernetes ecosystem."*
- Drawbacks：*"Why should this KEP _not_ be implemented?"*；Alternatives：*"What other approaches did you consider, and why did you rule them out?"*
- Test Plan / Graduation Criteria / Upgrade-Downgrade / Version Skew 都是**必填结构位**；未决项用 `<<[UNRESOLVED …]>>` 显式块。

**为什么这对拆解关键**：KEP 的 `User Stories` 是**轴 3（切片）**的官方投影；`Test Plan` + `Graduation Criteria` 把「怎么知道改对了」写进模板；`Drawbacks/Alternatives` 放在**最后**（在 Implementation History 之后）——与 Rust 放在 Unresolved 之前不同，说明**末段顺序可以按团队习惯调整，但它们必须在**。

#### (7) React RFC —— 动机必须与方案解耦
- *"Please focus on explaining the motivation so that if this RFC is not accepted, the motivation could be used to develop alternative solutions. In other words, **enumerate the constraints you are trying to solve without coupling them too closely to the solution you have in mind**."*
- *"This is the bulk of the RFC. Explain the design in enough detail for somebody familiar with React to understand, and for somebody familiar with the implementation to implement. This should get into specifics and corner-cases, and include examples of how the feature is used. Any new terminology should be defined here."*
- Drawbacks：*"Why should we not do this? Please consider: implementation cost… whether the proposed feature can be implemented in user space… the impact on teaching people React… cost of migrating existing React applications (is it a breaking change?). There are tradeoffs to choosing any path. Attempt to identify them here."*

**可迁移规则**：**约束要写在动机里，但不要和方案绑死**。这条同时解决了被否方案的「硬约束」节为什么不讨喜：把约束单独抽成一节、脱离问题语境，就变成了不可协商的教条清单；写在动机里，读者才知道每条约束是从哪个问题里长出来的。

#### (8) IETF RFC —— 正式性来自文体而非章节数
- RFC 7322：*"The ultimate goal of the RFC publication process is to produce documents that are readable, clear, consistent, and reasonably uniform."* 顺序规则：*"Within the body of the memo, the order shown above is strongly recommended. Exceptions may be questioned. Outside the body of the memo, the order above is required."*
- *"The body of the memo and the Abstract must be self-contained and separable. This may result in some duplication of text between the Abstract and the Introduction; this is acceptable."*
- 文体：*"The world of technical publishing has generally accepted rules for grammar, punctuation, capitalization, sentence length and complexity, parallelism, etc. The RFC Editor generally follows these accepted rules as defined by the Chicago Manual of Style (CMOS)…"*
- **RFC 2119 的约束分级**（把「硬约束」写成散文里的标记，而不是单独一节）：MUST/REQUIRED/SHALL = *"an absolute requirement of the specification"*；MUST NOT = *"an absolute prohibition"*；SHOULD/RECOMMENDED = *"there may exist valid reasons in particular circumstances to ignore a particular item, but the full implications must be understood and carefully weighed"*；MAY/OPTIONAL = *"truly optional"*。使用纪律：*"Imperatives of the type defined in this memo must be used with care and sparingly. In particular, they MUST only be used where it is actually required for interoperation or to limit behavior which has potential for causing harm."*

**⚠️ 两处防误引**：
1. RFC 7322 全文**没有**「禁止写成提纲 / 禁用 bullet / 必须散文体」的明文条款；最接近的是 CMOS 的句子长度/复杂度/平行结构要求与 *"readable, clear, consistent"* 目标。
2. RFC 2223 的 58 行/72 字符/禁脚注是**排版**约束，**不是叙事约束**；不要把它当作「RFC 要求叙事」的证据。

### 2.3 七类文档的三条共性规律（可直接用作 spec 模板的骨架判据）

1. **前 1/4 必是「可独立阅读的一段话摘要 + 问题/动机」，且动机被明文禁止与方案耦合**（React RFC 原句、PEP 1「动机不足可直接拒」、Rust「聚焦用户真实问题」、Google「Context 只放客观背景事实」）。
2. **「被否方案 / 缺点 / 未决」几乎总在末段，且被写成必填**：Google 称 Alternatives 是「最重要的章节之一」；PEP 说 Rejected Ideas 能「防止后续讨论反复重提」；Rust 把 Unresolved questions 限定为三类必答；KEP 有 `<<[UNRESOLVED]>>` 块。
3. **阅读机制与文档骨架同等重要，并被写进规则本身**：Amazon 的会议静读、Rust 的 discussion thread、PEP 的 champion + PEP-Delegate、KEP 的 approver + 独立 PRR 团队（*"a separate team, apart from the SIG leads… this slightly 'outsider' view helps identify otherwise missed items"*）。**模板只能保证「信息在纸上」，机制才能保证「信息被读到」。**

---

## 3. 问题 2：可分解性（decomposability）——任务的天然边界（seam）

> 目标：回答「什么样的文档结构让『切分为工作包』变自然」。结论先行：**让 phase 边界在 spec 里可见的唯一办法，是让 spec 的正文分节轴与 seam 对齐**；而 seam 有明确的判据，不是「按模块」「按层」这种直觉分类。

### 3.1 seam 的五类判据（每类附原文）

| # | 判据 | 一句话 | 代表出处（等级） |
|---|---|---|---|
| 1 | **易变的设计决策** | 每个模块隐藏一个「可能变化的设计决策」，接口尽量少暴露该决策 | Parnas 1972, CACM 15(12):1053–1058（◆一手） |
| 2 | **可替换行为点（seam）** | 「不改动该处即可改变行为」的位置；每个 seam 有 enabling point | Feathers, *Working Effectively with Legacy Code* Ch.4, p.31/36（◆一手） |
| 3 | **团队认知负载 / 变化节奏** | 切完后团队更自治、认知负载更低；类型含 bounded context、监管合规、变更节奏、团队地点、风险、性能隔离、技术、用户画像 | Skelton & Pais, *Team Topologies* Ch.6；Conway 1968（◆一手） |
| 4 | **垂直价值切片** | 每个切片贯穿多层、产生**可观察的价值变化** | Wake INVEST 2003、Humanizing Work 9 patterns、Cohn SPIDR（◆/○） |
| 5 | **端到端最小骨架** | 先搭一个贯穿主要架构组件的最小实现，之后并行演化 | Cockburn walking skeleton；Hunt & Thomas tracer bullets（◆一手/○） |

#### (1) Parnas 1972：按「会变的东西」分解，不按「处理步骤」分解
- *"The second decomposition was made using 'information hiding' as a criterion. **The modules no longer correspond to steps in the processing.**"*
- *"Every module in the second decomposition is characterized by its knowledge of a design decision which it hides from all others. **Its interface or definition was chosen to reveal as little as possible about its inner workings.**"*
- *"**it is almost always incorrect to begin the decomposition of a system into modules on the basis of a flowchart.** We propose instead that one begins with a list of difficult design decisions or design decisions which are likely to change. Each module is then designed to hide such a decision from the others. Since, in most cases, design decisions transcend time of execution, modules will not correspond to steps in the processing."*
- *"the order in time in which processing is expected to take place should not be used in making the decomposition into modules."*
- 检验标准：一处变更能否局限在单一模块（decomposition 1 里 *"changes in every module"*，decomposition 2 里 *"confined to that module"*）。
- 他列的「likely to change」决策示例：输入格式、数据是否全常驻内存、打包方式、用索引还是实存、一次性还是分散排序。

**对 spec 的直接含义**：**「一段 spec 文本 = 一个被隐藏的决策」是好分节的判据。** 如果某节的存在理由是「它属于验收这一类信息」，它就不是一个 seam；如果它的存在理由是「这个决策一旦变化，只会影响这一处」，它就是一个 seam，也就是一个天然的 phase 候选。

#### (2) Feathers：seam 的正式定义
- *"**A seam is a place where you can alter behavior in your program without editing in that place.**"*（p.31）
- *"Every seam has an **enabling point**, a place where you can make the decision to use one behavior or another."*（p.36）
- 三类 seam：Preprocessing / Link / Object seams；*"The enabling point for a link seam is always outside the program text."*

**对 spec 的直接含义**：可测试性来自 seam；**验收标准能落在哪个 seam 上，phase 就该切在哪**。这也是「预写测试冻结」策略的结构前提（测试必须挂在 seam 上）。

#### (3) Team Topologies：fracture plane 与它的 litmus test
- 定义（◆一手，Ch.6 / 术语表）：*"A fracture plane is a natural seam in the software system that allows the system to be split easily into two or more parts."*
- *"It is usually best to try to align software boundaries with the different business domain areas."*
- 八类 fracture plane：Business Domain Bounded Context / Regulatory Compliance / Change Cadence / Team Location / Risk / Performance Isolation / Technology / User Personas。
- **litmus test**：*"Does the resulting architecture support more autonomous teams (less dependent teams) with reduced cognitive load (less disparate responsibilities)?"*
- 对技术切分的警告：*"these common kinds of technology-driven splits typically introduce more constraints and reduce flow of work rather than improve it."*

**对 spec 的直接含义**：切分是否合格，可以用一句可判定的问句检验：**「切完之后，这一段能不能被单独理解和单独交付，而不需要读者同时记住另外三段？」** 这正是「弱模型执行 phase」的核心约束（R-B/R-E 的「每步自包含」）。

#### (4) 用户故事切分：9 种模式与 SPIDR
- Humanizing Work（Richard Lawrence）9 模式（○经验）：① Workflow Steps ② Operations (CRUD) ③ Business Rule Variations ④ Variations in Data ⑤ Data Entry Methods ⑥ Major Effort ⑦ Simple/Complex ⑧ Defer Performance ⑨ Break Out a Spike。元模式：*"Find the core complexity… Reduce all the variations to one."* 垂直切片定义：*"a work item that delivers a valuable change in system behavior such that you'll probably have to touch multiple architectural layers."*
- Wake INVEST 2003（◆一手原始出处）: I–Independent, N–Negotiable, V–Valuable, E–Estimable, S–Small, T–Testable；垂直切分的比喻：*"Think of a whole story as a multi-layer cake… We want to give the customer the essence of the whole cake, and the best way is to slice vertically through the layers."*
- Cohn SPIDR（◇官方）：Spike / Path / Interfaces / Data / Rules。

#### (5) 端到端最小骨架
- Cockburn walking skeleton（◆一手，经存档）：*"A Walking Skeleton is a tiny implementation of the system that performs a small end-to-end function. It need not use the final architecture, but it should link together the main architectural components."*；与 spike 的差别：*"A walking skeleton… is permanent code, built with production coding habits, regression tests, and is intended to grow with the system."*
- tracer bullets（Hunt & Thomas，○二手转述）：*"A tracer bullet is a thin, end-to-end implementation that connects all the major components of the system. It is production code — not throwaway."*

**对 phase 序列的直接含义**：**phase 0 应是一个 walking skeleton**（贯穿主干的端到端最小闭环），后续 phase 沿 seam 增厚。这比「先做基础设施、再做业务、最后集成」的横向顺序更抗「集成时才暴露接口不匹配」。

#### (6) DSM：用矩阵识别耦合与迭代环（切分后的自检工具）
- DSM Community / MIT 系教程（◇官方）：*"A DSM is a square matrix… that shows relationships between elements in a system"*；两大分析能力：*"clustering (to facilitate modularity) and sequencing (to minimize cost and schedule risk in processes)"*。读法：列＝输入、行＝输出；对角线**上方**＝前向信息流，**下方**＝反馈/迭代（cyclic 称 circuit/cycle）。源头：Steward 1981, IEEE TEM EM-28(3):71–74。
- **用法**：把候选 phase 作为行列，标出「谁改的文件会被谁读」；**对角线下方密集的地方就是强耦合，应合并成一个 phase 或调整边界**；clustering 结果可当模块边界建议。

#### (7) LLM/agent 侧：分解粒度必须匹配执行者能力
- ADaPT（arXiv:2311.05772）★实证：分解策略使成功率 *"up to 28.3% higher in ALFWorld, 27% in WebShop, and 33% in TextCraft"*；强调 *"the importance of multilevel decomposition"*，且能 *"dynamically adjust to the capabilities of the executor LLM as well as to task complexity"*。
- Huang et al. 综述（arXiv:2402.02716）把 LLM-agent 规划分为 Task Decomposition / Plan Selection / External Module / Reflection and Memory。
- **未获取到**：以「最优子任务数 / 天然边界」为自变量的实证论文。现有证据都是「分解策略 vs 基线」的成功率对比，**不能**据此宣称「phase 应切成 N 个」。

### 3.2 把 seam 判据落成 spec 的分节规约（本报告的综合，非现成标准）

| 规约 | 内容 | 依据 |
|---|---|---|
| S1 | spec 正文的每一个二级小节，必须对应**一个被隐藏的决策**或**一个可独立观察的行为变化**；不对应者下沉到附录 | Parnas 1972 |
| S2 | 每个小节必须能回答 litmus test：「只读这一节，能否独立理解并独立交付？」 | Team Topologies |
| S3 | 每个小节的验收必须挂在**可替换行为点（seam）**上，而不是内部实现状态 | Feathers Ch.4；Cucumber「observable output」 |
| S4 | 每个小节必须声明它隐藏/占用了哪些**变化点**（改这里会影响谁），供 DSM 式自检 | Steward 1981 |
| S5 | 存在大量双向依赖的小节必须合并，而不是靠「接口约定」硬拆 | DSM 读法；Conway 1968 |
| S6 | phase 序列的第一个包应是 walking skeleton；其余包沿 seam 增厚 | Cockburn；Hunt & Thomas |
| S7 | 每个小节对应一个**可独立演示的价值变化**，而不是一层技术实现 | INVEST「Valuable」；Humanizing Work vertical slice |

---

## 4. 问题 3：人读 vs 机器读的张力——纯结构化是否损害人的理解与审查质量？

> 结论先行：**「结构化损害理解」是一个过强的说法，证据不支持。** 可支持的准确版本是三条：**(a) 结构化对「检索/比对/清单化」任务有利，对「因果推理/连贯理解」任务不利（存在交叉反转）；(b) bullet 化会把注意力从正文抽走，且条目越异质越失效；(c) 结构化流程不提升审查缺陷发现率，甚至会在收集环节丢失已发现的问题。** 而且有强反证：结构性摘要（structured abstract）被多项研究判定为**更可读、信息更全、更受读者欢迎**（§10.2）。

### 4.1 认知 fit：格式优劣取决于任务类型，存在交叉反转 ★实证

**Vessey & Galletta 1991**（*Cognitive Fit: An Empirical Study of Information Acquisition*, Information Systems Research 2(1):63–84）——把扫描版 PDF OCR 后读到结果表，每格 16 人（约 80 人），任务为财务数据：

| 任务类型 | 表格 | 图形 | 结论 |
|---|---|---|---|
| **符号型任务** | **71.92 s / 4.95（满分 5）** | 127.41 s / 3.89 | 表格在速度与准确度上**全面胜出**（F(1,60)=70.66, p=0.000；F(1,60)=515.20, p=0.000） |
| **空间型任务** | 109.72 s / **4.56** | **77.46 s** / 3.93 | 图形更快（p=0.000），**但表格更准**（p=0.000） |

**读法**：不存在「表格普遍更好」或「散文普遍更好」。**表格适合比较/查找/对齐（符号型），叙事适合理解关系与因果（空间/关系型）。** 这与 R-E §6.4 的实践口径一致，现在有了原始实验支撑。

相邻证据（方向不完全一致，故列在此处）：Cooper & Vallée-Tourangeau 2021（*Memory & Cognition*）★实证：条形图在高低算术能力两组、各难度上都提高列联判断准确度；Barreiro et al. 2025（*Memory & Cognition*）★实证：频率树与带图标列联表比纯数字列联表产生更弱的因果错觉；2022 年 *Public Health* 研究 ★实证：主题地图在**相对风险量级**理解上优于表格，**但表格在绝对风险量级再认上更优**。→ 结论同向：**格式优势是任务特异的。**

### 4.2 bullet 化的真实效果：提高条目回忆，损害正文回忆 ★实证

**Jansen 2014**（*How bulleted lists and enumerations in formatted paragraphs affect recall and evaluation of functional text*, Information Design Journal 21(2):146–162，DOI 10.1075/idj.21.2.06jan）——**5 个实验**，控制条件是「同一组要素写成段落中的枚举」：

- 3 个实验中，bullet 化**提高**读者对「系列条目内容」的回忆；
- 该正效应**在条目异质（heterogeneous）时被削弱**；
- **2 个实验中，bullet 化对「周边正文（surrounding text）内容」的回忆是负效应**；
- 另 2 个实验显示 bullet 化改善读者对文本的**评价**。

→ **「bullet 一定更好记」不成立，且 bullet 会把注意力从正文抽走。** 对一个「约束散落在叙事里」的 spec，这条意味着：**把约束抽成 bullet 清单，读者会记住清单，却更记不住约束是从哪个问题里长出来的**——这正好解释了被否方案里「硬约束」单列一节为什么读起来像教条。

相邻但非 bullet vs 散文的证据（理论依据）：Mar, Li, Nguyen & Ta 2021（*Psychonomic Bulletin & Review* 28(3):732–749，PMC8219577）★实证，**78 个独立样本、N=33,078、150 个效应量**：故事（叙事）比说明文**更易理解、更易回忆**，且对单研究/单效应量稳健。→ **连贯的因果结构本身有记忆优势**，而 bullet 化正是去掉连贯性。

**⚠️ 未获取到**：心理学中作为**独立命名效应**的 "list superiority effect" 原始实验文献（用 Europe PMC 关键词 `bulleted`、`presentation format AND recall`、`list format recall` 均未检索到）。**不要把它当学术结论引用。** 另有 Lyngo Lab 随机对照实验（MTurk, N=400）★非同行评审：三件杂货用 bullet vs 段落，bullet 组平均回忆 **1.98 vs 1.48（+33.4%, p<0.001）**，三项全对率 **34.5% vs 22.7%（p=0.009）**——引用须降级为「行业实验」。

### 4.3 认知负荷：分离与重复都损害学习，且随专业度反转 ★实证

- **split-attention**：互相指涉的信息源空间分离 ⟹ 必须在工作记忆中人工整合 ⟹ 挤占可用于学习的资源。
- **redundancy**：同一信息以两种形式重复呈现 ⟹ 仍需协调 ⟹ 同样有害。**Kalyuga, Chandler & Sweller 2004**（*Human Factors* 46(3):567）★实证：**3 个实验、25 名技术学徒**；同时呈现同一书面+听觉文本相比时间分离或删除一种模式，产生**过量工作记忆负荷**。
- **expertise 反转**：**Yeung, Jin & Sweller 1998**（*Contemporary Educational Psychology*，PMID 9514686）★实证，**5 个实验**：把词汇释义**整合进段落**相比独立词汇表，提高五年级生的**阅读理解**但**降低词汇学习**；实验 3（成人）整合格式**反而降低理解**、提高词汇学习；实验 4（低能力八年级 ESL）出现 expertise 反转。

**映射到「字段矩阵 vs 叙事文本」**：
- 字段矩阵把「字段名—取值」拉近，**缓解 split-attention**；
- 但若矩阵**与叙事段落同时保留同一信息（双写）**，触发 **redundancy**，一样有害；
- 矩阵以牺牲**因果连贯文本**为代价换取可扫描性，而 §4.2 显示连贯叙事本身有记忆优势；
- **expertise 反转**提示：字段矩阵对**新手/低专业度读者**（例如照着 phase 干活的弱模型、第一次读这个 spec 的人）更友好，对**专家**（owner / 强模型）可能反而更低效。

**⚠️ 引用红线**：Sweller, Chandler, Tierney & Cooper 1990 与 Kalyuga, Chandler & Sweller 1999 **只核验了元数据，未读到实验条件与数字**；报告中不得给出这两篇的样本量或统计量。

### 4.4 清单/表单式流程的审查代价：Porter 1995 的量化反面证据 ★实证

（设计细节见 §1.2(d)。这里只列对「审查」的直接含义。）

| 发现 | 数字 | 含义 |
|---|---|---|
| Checklist 审阅者 vs Ad Hoc 审阅者 | 团队检出率 Checklist 0.41/0.24，Ad Hoc 0.43/0.31；原文 *"no more effective"* | **有清单 ≠ 审得更好** |
| Scenario 审阅者 vs 其余 | **0.57 / 0.45**（p<0.01） | **按场景组织的检查程序才提升发现率** |
| 收集会议净增益 | 增益 4.7±1.3% / 3.1±1.1%，损失 6.8±1.6% / 7.7±1.7% | **结构化收集环节「谈掉」约 7% 已发现缺陷** |
| 原文结论 | *"Collection meetings produced no net improvement"* | **会议本身不是质量来源** |

**边界（不可夸大）**：这是 1995 年的实验室研究（48 名计算机研究生），且此处的 "Scenario" 是**面向特定故障类别的阅读/检查程序**，**不等于**「以用户旅程为主线的规格文档」。**未获取到**任何「结构化模板 vs 自由形式」并**专门以「整类未写信息（omission）检出率」为因变量**的受控实验——该命题在可核验开放文献中是**证据缺口**。

补充实证：Zhi et al. 2023（*Heliyon*，PMC10213370）★实证，60 名软件工程学生的受控实验：结构化提问法 EQI 的**平均检出缺陷数高于** perspective-based reading（PBR）。→ 方向相反，说明**「结构化的提问」可能优于「结构化的视角」，但「分类清单」不一定优于「无方法」**。

相邻的合规实证（外科清单线）★实证：Haynes et al. 2009（NEJM，8 城 8 院，7688 例）死亡 **1.5%→0.8%**（P=0.003）、并发症 **11.0%→7.0%**（P<0.001）；**但** Urbach et al. 2014（NEJM，安大略 101 家医院，215,711 例）调整后死亡 OR **0.91 (0.80–1.03), P=0.13**、并发症 OR 0.97 (P=0.29)，**无改善**；Scotland 2019（BJS，12,667,926 次住院）又报相对死亡率下降 **36.6%**。→ **同一类「清单」在不同实施条件下结论相反**；Fourcade et al. 2012（BMJ Qual Saf，法国 18 个癌症中心、1440 例手术、28,578 个条目）给出机制：**平均使用依从率 90.2%，但平均完成率仅 61.0%**；主要障碍包括清单条目与既有清单**重复**、**填表耗时且无感知收益**、**歧义**、**未纳入清单的风险被忽略**。→ 对 spec 的含义：**清单的完成率 ≠ 清单的有效性；重复与歧义是清单失效的头号原因**（与 R-E 的「单一事实源」「引用不复制」同向）。

### 4.5 本节结论

| 主张 | 判定 | 依据 |
|---|---|---|
| 「纯结构化普遍损害人的理解」 | **过强，不支持** | Vessey 1991 交叉反转；Hartley 结构化摘要研究（§10.2） |
| 「表格适合比对、叙事适合因果」 | **支持** | Vessey 1991；R-E §6.4 |
| 「bullet 让内容更好记」 | **半个真话**：条目记得住、正文记不住 | Jansen 2014（5 实验） |
| 「双写（矩阵 + 叙事同时保留同一信息）」 | **有害** | Kalyuga 2004 冗余效应 |
| 「有清单/矩阵就能审得更全」 | **不支持** | Porter 1995 checklist ≈ ad hoc；会议损失 ~7% |
| 「字段矩阵对新手友好、对专家可能反转」 | **支持但属△外推** | Yeung 1998 expertise 反转（学生/ESL 样本） |

---

## 5. 问题 4：场景/旅程驱动的规格——是否更利于拆解与评审？

> 结论先行：**证据是「窄而硬」**。有 1995 年的对照实验证明**按场景组织的检查程序**显著提升缺陷发现率（★实证）；但**以场景/旅程为主线的规格文档**降低遗漏率或提升评审质量，**没有任何对照实证**；BDD/Gherkin 的质量收益**同样没有严格对照实证**（166 篇系统映射研究明确说指标缺失、工业评估稀缺）。

### 5.1 各框架的骨架与定位

| 框架 | 骨架 | 性质 | 出处 |
|---|---|---|---|
| **BDD / Gherkin** | 场景：`Given` 初始上下文 → `When` 事件 → `Then` 期望结果；用 `Rule` 归组业务规则 | ○经验/规范定义；Dan North 原文称目标是「为分析过程本身定义一门通用语言」 | dannorth.net；cucumber.io/docs/gherkin |
| **Example Mapping** | **4 色卡**（⚠️ 不是 3 色）：黄＝story、**蓝＝规则**、绿＝例子、红＝问题；**约 25 分钟**时间盒 | ○经验 | Matt Wynne, Cucumber 博客 |
| **Impact Mapping** | **Goal（Why）→ Actors（Who）→ Impacts（How behavior changes）→ Deliverables（What）** | ○经验 | impactmapping.org |
| **Job Stories** | `When ___ , I want to ___ , so I can ___`；批评 User Story「用 persona、把实现与动机/结果耦合、忽略情境与焦虑」 | ○经验 | Klement（Intercom 客座文；**原始 Medium 出处未获取到**） |
| **User Journey Map** | 五要素：**Actor；Scenario + Expectations；Journey Phases；Actions, Mindsets, Emotions；Opportunities**（分三层：上＝角色/场景/期望，中＝阶段/行为/想法/情绪，下＝机会/洞察/归属） | ○经验（NN/g 自述为定性方法） | nngroup.com/articles/journey-mapping-101 |
| **Scenario-based RE（学术）** | 用 `exception types` 从**正常事件序列**派生可能的异常事件，从而补遗漏 | ◇方法（有机制设计，无对照数字） | Sutcliffe et al. 1998, IEEE TSE 24(12) |

### 5.2 唯一有明确数字的对照实验：Scenario 检查程序 ★实证

**Porter, Votta & Basili 1995**（设计见 §1.2(d)）——团队缺陷发现率：Scenario **0.57 / 0.45** ＞ Ad Hoc 0.43 / 0.31 ＞ Checklist 0.41 / 0.24（ANOVA p<0.01）。原文：*"Scenario reviewers were more effective at detecting the faults their scenarios are designed to uncover, and **were no less effective at detecting other faults**."*

**为什么这仍然重要**：它证明了「**按使用场景组织检查活动**」比「按缺陷分类清单检查」更能发现缺陷。这是支持「场景作为 spec 主线」的**最强可用实证**，尽管其形式是审查程序而非规格文档。

**不能用它证明什么**：不能外推为「BDD/Gherkin 提升质量」，也不能外推为「用户旅程主线的规格降低遗漏」。

### 5.3 BDD 的实证强度：存在实验，但没有可引用的效果数字；且指标体系缺失

**Binamungu & Maro 2023**（*Behaviour Driven Development: A Systematic Mapping Study*, JSS，arXiv:2305.05567）★实证（文献计量）：覆盖 2006–2021，纳入 **166 篇**；评估方法分布：Example 62、Case Study 54、**Experiment 31**、Experience Report 14、Discussion 11、Rigorous Analysis 3。原文：***"acute shortage of metrics for measuring various aspects of BDD specifications and the processes for producing BDD specifications"***；***"there is a scarcity of BDD research that has been evaluated in industry settings"***。

**实践者调查（问卷，非对照）**：
- Binamungu, Embury & Konstantinou 2018（SANER）★实证：**75 名 BDD 实践者、26 个国家**。收益主要是「领域术语、改善干系人沟通、规格可执行、便于理解代码意图」；风险原文：*"Some teams find that **parts of the system are effectively frozen** due to the challenges of finding and modifying the examples associated with them."* 结论：*"BDD specifications suffer the same maintenance challenges found in automated test suites more generally."*
- Binamungu et al. 2020（LNBIP）★实证：原文 *"as yet **no formal definition** of what makes for a high quality BDD suite has been given"*。
- Islam 2024（Glasgow 博士论文，摘要页）★实证/引用行业数据：*"19% of respondents to the 14th State of Agile annual survey reported using BDD"*。

**⚠️ 未获取到**：Wang & Wagner 2018 / Wang, Degutis & Wagner 2018 / Häsler et al. 2016 三篇 BDD 受控实验的**正文与数字**（green OA 被反爬拦截）。→ **可以引用它们「存在」，不可以引用其数字。**

### 5.4 自然语言 vs 全结构化记法：自然语言更省时、更准 ★实证（弱—中）

**Hoisl, Sobernig & Strembeck 2014**（QUATIC，DOI 10.1109/quatic.2014.19）★实证：**20 名软件从业者**（工程师/测试/研究者），**6 个理解与维护任务**，比较三种 scenario-test 记法：**半结构化自然语言 / 图形 / 全结构化文本**；测正确性、时间成本、模型错误检出。原文结论：*"the participants of our study **spent comparatively less time and completed the tasks more accurately when using the natural-language notation** compared to the other two notations."* **（具体百分比未取到。）**

**这是一条重要的相邻证据**：在「规格类文本」的语境里，**完全结构化并不优于自然语言**——恰好与 §6 的 LLM 侧证据（NL 34.3% vs PDDL 12.5%）同向。

### 5.5 理解性对照实验（存在但数字未取到）

- Hadar et al. 2013（IST 55(10)，被引 47）、Siqueira 2017（IST）：**付费墙，正文未获取到**。
- Gemino & Parker 2009（J. Database Management 20(1)）★实证：带用例图的组 *"developed a significantly higher level of understanding, as measured by performance on the problem solving task"*（**样本量与效应量未取到**）。
- Mustafa 2010（两轮受控实验）★实证：图对「表层理解」任务显著提升，*"diagrams had no effect on users performance in the deep understanding tasks"*。→ **图形帮助表层理解，不帮助深度理解**，与 §4.1 交叉反转一致。

### 5.6 本节结论与「场景主线」的正确用法

| 主张 | 强度 | 依据 |
|---|---|---|
| 场景化缺陷类分工的评审者缺陷发现率更高 | **中—强**（实验室，1995，48 名学生，p<0.01） | Porter 1995 |
| 自然语言 scenario 记法优于图形/全结构化文本 | **弱—中**（20 人受控实验，数字未取到） | Hoisl 2014 |
| BDD/Gherkin 提升质量或降低缺陷 | **无严格对照实证** | Binamungu & Maro 2023（166 篇）；2018 问卷 |
| BDD 改善沟通/可读性 | **弱**（问卷自述） | Binamungu 2018 |
| 旅程图五要素骨架 / Example Mapping 25 分钟 / Gherkin 3–5 步 | **权威从业者框架或经验规则，非实证** | NN/g；Wynne；Cucumber |

**正确用法（本报告的建议）**：**把场景用作「spec 的阅读与检查主线」，不要把它当作「质量保证的已证机制」。** 即：spec 用具体场景讲清「改成什么样」（帮人理解与发现遗漏），验收用场景派生（帮评审者按场景组织检查）；但**不要**宣称「用了 BDD 所以质量更高」。

---

## 6. 问题 5：审查友好性——什么样的结构让审查者快速判断三件事

> 审查者的三个问题：**(1) 需求翻译是否完整？(2) 架构是否合理？(3) 验收是否可执行？** 本节给出**已 fetch 到原文的公开清单**，以及把清单变成结构设计的做法。

### 6.1 可整段复用的公开清单（5 个）

**(1) NASA SEH Appendix C（◇官方，原文已抄录）** — https://www.nasa.gov/reference/appendix-c-how-to-write-a-good-requirement/
- **C.1 用词**：`Shall`=requirement；`Will`=facts or declaration of purpose；`Should`=goal。
- **C.2 编辑清单**：用主动语态；产品需求写「product ABC shall XYZ」；术语一致；带 tolerance（less than / greater than or equal to / plus or minus）；*"Is the requirement free of implementation?（requirements should state WHAT is needed, NOT HOW to provide it）"*；*"Free of descriptions of operations?"*。
- **C.3 General Goodness**：语法正确；**正面陈述**（避免 "shall not"）；TBD 最小化，改用 **TBR + 理由 + 消除责任人 + 期限**；**每条需求附可理解的 rationale 与假设**；放在正确章节。
- **C.4 Validation（十组）**，对审查最有用的三组：
  - **Clarity**：**无不定代词（this/these）与含混词**（as appropriate, etc., and/or, but not limited to）；**一条需求一个想法**（"one subject and one predicate"）。
  - **Traceability**：每条需求必要性检验 *"What is the worst that could happen if the requirement was not included?"*；**双向可追溯**；**可唯一引用（唯一编号）**。
  - **Verifiability/Testability**：能否测试/演示/检查/分析证明满足？**禁用词表**：flexible, easy, sufficient, safe, ad hoc, adequate, accommodate, user-friendly, usable, when required, if required, appropriate, fast, portable, light-weight, small, large, maximize, minimize, robust, quickly, easily, clearly，其他 "-ly" 词、其他 "-ize" 词。

**(2) Westfall《A Requirements Review Checklist》（◇官方，PDF 原文已抽取）**
- 作为**集合**：Complete；Internally & externally consistent；Modifiable；Compliant with the standards。
- **单条需求 8 项**：Unambiguous；Concise；Finite；Measurable；Feasible；**Testable**；**Traceable**；Value-added。
- 完整性展开域：All functions / Needed quality attributes / External interfaces / Data & information / Design constraints / Operational adaptability / System modes / 全部干系人（normal users、power users & operators、novice & occasional users、users with special needs、unfriendly users、customers、suppliers）。
- 第 27 页：***"Testers are excellent candidates for inclusion in requirements review"*** ——**让将来要写测试的人当审查者**，是可执行验收的**机制性**做法（与 R-C 的「测试作者与实现者分离」同向）。

**(3) KEP PRR 问卷（◇官方，原文）** — 6 节 + **每节绑定阶段** + 失败模式四栏模板
- 小节：Feature Enablement and Rollback / Rollout, Upgrade and Rollback Planning / Monitoring Requirements / Dependencies / Scalability / Troubleshooting。
- 每节的适用阶段写死在模板里：alpha＝Feature Enablement and Rollback；beta＝Rollout/Monitoring/Dependencies/Scalability/Troubleshooting 必填；**GA 时「approvers should be able to confirm the previous answers based on experience in the field」**。
- **已知失败模式模板（每条四栏）：Detection（仅凭 metrics 如何发现）/ Mitigations / Diagnostics（日志级别）/ Testing（是否有测试，若无说明原因）。**
- SLO/SLI 示例型答案：5XX ≤1%、cron job 时间偏差 p99 ≤10%、/health 99.9% 返回 200。
- **审查友好性的公开定义**（原文）：最终 approver 无实质意见只有两种解释——*"the reviewer did a great job in finding all the issues"* 或 ***"the KEP author did a great job in answering all the questions up front"***。→ **「审查者无需提问」＝问题已前置回答，这是可操作的审查友好性判据。**

**(4) Rust RFC 的 Unresolved questions（限定三类必答）** 与 **Summary（"One paragraph explanation"）** ——见 §2.2(4)。

**(5) Google Engineering Practices（◇官方，原文已抄录）**
- **What to look for 的顺序**：Design → Functionality → Complexity → Tests → Naming → Comments → Style → Consistency → Documentation → Every Line → Context → Good Things → Summary。原文：***"The most important thing to cover in a review is the overall design of the CL."***（**架构合理性排在最前**）
- Complexity 判据：*"'Too complex' usually means **'can't be understood quickly by code readers.'**"* 并明确警惕 over-engineering。
- Tests：*"Will the tests actually fail when the code is broken?"*；*"a human must ensure that tests are valid."*
- Every Line：*"If it's too hard for you to read the code and this is slowing down the review, then you should let the developer know and **wait for them to clarify it before you try to review it**."*（**读不懂即退回补说明**）
- Summary 的 12 条核对：well-designed / functionality good for users / UI sensible / parallel programming safe / not more complex than needed / **不实现「将来可能需要」的东西** / 有单元测试 / 测试设计良好 / 命名清晰 / 注释解释 why 而非 what / 有文档 / 符合 style guide。
- **小单元**（small-cls）：*"100 lines is usually a reasonable size for a CL, and 1000 lines is usually too large"*；*"A 200-line change in one file might be okay, but spread across 50 files it would usually be too large."*；**审查者可否决**：*"reviewers have discretion to reject your change outright for the sole reason of it being too large."* 理由：小 CL *"Reviewed more quickly"*、*"Reviewed more thoroughly… important points get missed or dropped."*
- **结论前置**（cl-descriptions）：*"summarize the major changes such that readers have a sense of what is being changed **without needing to read the entire CL**"*；**第一行必须能独立成句**（*"should stand alone, allowing readers to skim through code history much faster"*，且按传统写成祈使句），随后空行再接细节；**如有短板必须写明**。反例清单：`Fix bug` / `Fix build.` / `Add patch.` / `Moving code from A to B.` / `Phase 1.`
- 评审标准：*"reviewers should favor approving a CL once it is in a state where it definitely improves the overall code health… even if the CL isn't perfect. **That is the senior principle among all of the code review guidelines.**"*；*"there is no such thing as 'perfect' code—there is only **better** code"*；次要意见前缀 **`Nit:`**。

**(6) ATAM（SEI/CMU，◇官方，原文已抄录）** — 用于「架构是否合理」
- 定义：*"a method for evaluating software architectures **relative to quality attribute goals**"*；规模：*"typically takes **three to four days**"*。
- 九步（摘）：1 Present the ATAM；2 Present business drivers；3 Present architecture；4 Identify architectural approaches（**identified but not analyzed**）；5 **Generate quality attribute utility tree**（elicited, specified down to scenarios, annotated with stimuli and responses, **prioritized**）；6 Analyze architectural approaches（识别 risks / sensitivity points / tradeoff points）；7 Brainstorm and prioritize scenarios（投票排序）；8 Analyze again（用高排名场景作 test cases 确认）；9 Present results。
- **产出（审查者可直接对的抓手）**：utility tree；场景集合及映射到架构的子集；quality-attribute-specific questions 及回答；**risks 集合**；**non-risks 集合**；**risk themes**。

**⚠️ 未获取到**：Karl Wiegers 的公开 checklist（processimpact.com 全 404）；IEEE 830-1998 八项特征的公开原文（IEEE SA 页只有摘要，八项在付费正文）；SEI Lightweight Architecture Evaluation（404）。**引用「好的 SRS 八特征」时必须标为需购标准或转述。**

### 6.2 把「三个审查问题」映射成 spec 的结构位

| 审查者的问题 | 结构位 | 判据（可逐条核） | 依据 |
|---|---|---|---|
| **需求翻译是否完整？** | 需求登记 + 双向 ID + 动机节（含用例/场景） | 每条需求有唯一 ID、有 rationale、有假设；双向可追溯；**孤儿＝缺陷**；TBR 带责任人+期限 | NASA C.3/C.4；Westfall；R-E §9.3 |
| **架构是否合理？** | 方案节 + **被否方案节（必填）** + 横切关注点 | 有 alternatives 且说明为何排除；有 risks / **non-risks** / sensitivity / tradeoff points；有「影响代码可读/可维护」的讨论 | Google（Alternatives 最重要）；ATAM；Rust/React/KEP 模板 |
| **验收是否可执行？** | 验收/测试节 | EARS 规则集：**零或多前置条件、零或一个触发器、一个系统名、一个或多个响应**；Given/When/Then 的 Then 必须是**可观察输出**（不是数据库里的记录）；禁用不可判定词表 | EARS 原文；Cucumber 原文；NASA C.4 |

**三条结构性「审查友好」设计（有原文依据）**：
1. **结论前置，且首行独立可读**：Google CL description 第一行规则；Rust `Summary`＝one paragraph；IETF 摘要必须 *"self-contained and separable"*（并明确接受摘要与引言重复）。
2. **先总览后细节**：Google *"This section should start with an overview and then go into details."*
3. **让读者不需要开会就能审**：Amazon 会议静读（*"create the context for what will then be a good discussion"*）；KEP 的「作者把问题前置答完」定义；Porter 1995 的「会议净增益≈0」就是反证——**别把理解责任推给会议**。

---

## 7. 问题 6：强模型做任务分解时的输入形态偏好

> **总警告**：本节全部证据为**英文基准任务**（Super-NaturalInstructions 子集、MMLU/HumanEval/FIND、GSM8K、Blocksworld 等），**没有任何一篇报告中文 prompt 的格式/顺序/位置实验**；也**没有任何实验直接比较「叙事性中文规格」vs「表格化中文规格」**。迁移到本项目一律是 **△外推**。

### 7.1 可以主张的（有数字）

| # | 结论 | 数字 | 来源（★实证） |
|---|---|---|---|
| 1 | 仅改格式就能造成巨大波动；**无普适最优格式** | LLaMA-2-13B 最高 **76 点**；50+ 任务均值 **≈10 点**、中位 **7.5 点**；微观扰动（`passage:{}` vs `passage {}`）**0.043 → 0.826** | Sclar et al., FormatSpread, ICLR 2024, arXiv:2310.11324 |
| 2 | Markdown/JSON/YAML/纯文本**没有单一赢家**；**弱模型更敏感** | 代码翻译波动最高 **40%**；FIND 上 Markdown→纯文本 **+200%**；HumanEval 上 JSON→纯文本 **>300%**；GPT-3.5 偏 JSON、GPT-4 偏 Markdown；GPT-3.5 在 Markdown 与 JSON 间只有 **16% 答案完全一致** | He et al. 2024, arXiv:2411.10541（**未测表格**） |
| 3 | **顺序敏感，前向顺序最好** | 乱序掉 **>30%**；GPT-3.5/Gemini 从 **>65% 掉到 <25%**；原文 *"the forward order consistently achieves the best performance"* | Chen et al., ICML 2024, arXiv:2402.08939 |
| 4 | **位置敏感：首尾好、中间差** | 首↔中落差 **≈15.6 / 22.0 / 22.9** 点（10/20/30 文档）；20/30 文档时**低于无文档基线 56.1%** | Liu et al., TACL 2024, arXiv:2307.03172 |
| 5 | **自然语言输入在规划上优于形式化表示** | Blocksworld 600 例：GPT-4 **NL 206/600 (34.3%) vs PDDL 75/600 (12.5%)**；原文 *"GPT-4 performs better with natural language prompts … as opposed to PDDL prompts"* | Valmeekam et al., NeurIPS 2023, arXiv:2305.15771 |
| 6 | **强格式约束（尤其输出侧）损害推理** | GSM8K 加 JSON schema：Claude-3-Haiku **86.51 → 23.44**；GPT-3.5 **75.99 → 49.25**；原文 *"stricter format constraints generally lead to greater performance degradation in reasoning tasks"* | Tam et al., EMNLP 2024 Industry, arXiv:2408.02442 |
| 7 | 但**「先自由推理、再转 JSON」几乎无损** | NL-to-Format 相比无约束几乎不掉；机制是 JSON-mode 下 GPT-3.5 **100%** 把 `answer` 键排在 `reason` 之前 | 同上 |
| 8 | **上下文/指令越多越差** | AGENTS.md：LLM 生成文件 **−0.5%/−2%** 成功率、成本 **+20%/+23%**；原文 *"unnecessary requirements from context files make tasks harder"*；IFScale：**500 条指令时最强模型仅 68%**（gpt-4o 15.4%、gpt-4o-mini 10.4%）；Chroma Context Rot：**18 个模型性能随输入长度一致下降** | arXiv:2602.11988；arXiv:2507.11538；Chroma 报告 |

### 7.2 任务分解方法的输入形态（顺带证据）

- **Least-to-Most（ICLR 2023, arXiv:2205.10625）**★实证：输入是**纯自然语言 few-shot 示例，无 schema**（阶段 1 用 8 条「长问题→子问题串」示例，阶段 2 用 14 条）；SCAN length split 上 **L2M 99.7% vs CoT 16.2%**；泛化到比示例更难的问题；但**分解 prompt 不跨域泛化**（*"A new prompt must be designed to demonstrate decomposition"*）。
- **Decomposed Prompting（ICLR 2023, arXiv:2210.02406）**★实证：decomposer prompt 用**自然语言**说明「用哪些子任务」，输出子查询 + handler 标签（如 `Q1:[split] … Q2:(foreach)[str_pos] …`），handler 可再分解或替换为符号函数——**结构上与 Parnas「接口抽象、隐藏实现」同构**。
- **Plan-and-Solve（ACL 2023, arXiv:2305.04091）**★实证：**zero-shot，无任何示例**，只替换触发句（*"Let's first understand the problem and devise a plan… then carry out the plan step by step"*）；平均 **76.7 vs Zero-shot-CoT 70.4**；100 例抽样中 90 例确实生成了 plan。
- **Successive Prompting（EMNLP 2022）**★实证：**迭代式自然语言 in-context 分解**（*"iteratively break down a complex task into a simple task, solve it, and then repeat"*）；few-shot DROP 上比同监督 SOTA 提升 **~5% absolute F1**。

### 7.3 官方输入结构指引（◇官方，已取到原文）

- **Anthropic**：*"structure prompts with XML tags … Wrapping each type of content in its own tag (`<instructions>`/`<context>`/`<input>`) reduces misinterpretation"*；best practice＝*"consistent, descriptive tag names"* + *"nest tags when content has a natural hierarchy"*。长上下文：*"Put longform data at the top … above your query, instructions, and examples"*；*"Queries at the end can improve response quality by up to 30 percent"*。
- **OpenAI**：Markdown + XML 用于标出 *"logical boundaries"*；context *"best positioned near the end of your prompt"*。**OpenAI 官方从未就「schema 约束输出是否伤推理」表态**（structured-outputs 指南全文无 "reasoning" 命中）。
- **Anthropic 上下文哲学**：*"Context is a critical but finite resource"* / *"attention budget"* / 要 *"smallest possible set of high-signal tokens"*；明确反对 *"stuff a laundry list of edge cases"*。
- **⚠️ 未获取到**：传闻中的「there's no canonical best way」在现行 Anthropic 页面**查无此句**，勿引用。

### 7.4 本节结论：这些证据**支持**什么、**不支持**什么

| 结论 | 判定 |
|---|---|
| 「结论/前提**前置**，前向顺序」 | **支持**（Chen 2024；Lost in the Middle） |
| 「**避免强制格式约束**（尤其输出侧）」 | **支持**（Tam 2024） |
| 「不要为了『结构化』而牺牲自然语言」 | **支持**（Valmeekam：NL 34.3% vs PDDL 12.5%） |
| 「**控制总长度与信号密度**」 | **支持**（ETH；IFScale；Context Rot） |
| 「**格式必须恒定**（同一文档类型永远同一套字段/顺序）」 | **支持**（格式敏感性 + 无普适最优） |
| **「叙事优于表格」作为 LLM 输入** | **不支持（无直接实证）**，只能△外推 |
| 「表格一定更差」 | **不支持**：He et al. **没测表格**；格式偏好 model-dependent |

**推荐的稳妥表述**：给强模型拆解的输入应当是**自然语言、结构恒定、结论前置、单主题分节、总量受控、不强制格式**——这些都有实证；而「叙事 vs 表格」本身属于**必须在本地自测的开放问题**（建议做法：同一份 spec 做叙事版/表格版/JSON 版三版 A/B，报告拆解结果的准确率与方差）。

---

## 8. 问题 7：规格的「故事线」——spec as narrative 的实践与框架

### 8.1 支持面（◆一手/○经验）

- **Ron Jeffries《Card, Conversation, Confirmation》(2001)**：*"User stories have three critical aspects. We can call these Card, Conversation, and Confirmation."*；*"**The card does not contain all the information that makes up the requirement.** Instead, the card has just enough text to identify the requirement, and to remind everyone what the story is."*；*"The requirement itself is communicated from customer to programmers through conversation."*
- **Jeff Patton《User Story Mapping》**：*"We're building a map that lets us tell a really big story about the system. Build the map in a way that helps you tell the story."*；***"the order you'd explain the behavior of the system in is the correct order"***；backbone 最前面的故事 *"describe the smallest possible system… This is what Alistair Cockburn refers to as the 'walking skeleton.'"*
- **Mike Cohn**：*"That sentence is a reminder to have a conversation; the full requirement emerges through the conversation that follows."*；*"The written story is a reminder. The real requirement emerges through conversation, examples, rules, sketches, tests, and decisions."*
- **Impact Mapping 的动机句**：*"**Project plans and requirements documents are often shopping lists of features, without any context why such things are important.**"*
- **学术脉络**：RE 界的成熟术语是 **scenario-based RE**（Sutcliffe 1998/2003；Alexander & Maiden 2004），而「narrative RE」作为独立流派的文献较薄。较新的综述 Sporsem, Dingsøyr & Stol 2025 的题名即主张：**用户故事是协调多方的「边界物（boundary object）」，以叙事形态承载**（JSS 2026, DOI 10.1016/j.jss.2025.102693）。**⚠️ 上述两处只有书目/DOI 核实，未获取到逐字引文。**

### 8.2 反面证据：叙事对「检索/复用」是不利的（重要，必须成对呈现）

- **Mark Baker《Every Page Is Page One》**（○经验，但论证清晰）：*"A fact is a single point of data… A narrative is an orchestrated and annotated parade of facts."*；*"**It is not the job of a narrative to provide concierge service to every individual reader.**"*；把所有人塞进一条叙事相当于 *"pick every single reader up at their door and deposit them exactly at their destination, while forcing every one of them to ride the bus the whole way through every pickup point"*；*"**Facts should not be buried in dubious narratives where they are less discoverable than in references.**"*；*"**References are databases. Topics are narratives.**"*
- **OASIS DITA 规范**（◇官方，topic-based authoring 阵营）：*"In DITA, a topic is the basic unit of authoring and reuse."*；*"a DITA topic is a titled unit of information that can be understood in isolation and used in multiple contexts"*；*"**Content is readable when accessed from an index or search, not just when read in sequence as part of an extended narrative.** Since most readers do not read technical and business-related information from beginning to end, topic-oriented information design ensures that each unit of information can be read independently."*；并**禁用过渡语**：*"A context-free topic avoids transitional text. Phrases like 'As we considered earlier…' or 'Now that you have completed the initial step…' make little sense if a topic is reused in a new context."*

**综合判定**：这不是「谁对谁错」，而是**读者进入方式不同**：
- 从头读到尾的读者（owner 审查、强模型首次拆解）→ **叙事最优**（Bezos、Patton、Mar 2021 元分析）；
- 定向查找某个事实的读者（弱模型执行 phase、回头核对某条约束）→ **topic/reference 最优**（Baker、DITA、cognitive fit）。

**这直接给出「叙事主干 + 结构化附件」之所以成立的**理论**依据**：两种结构的服务对象不同，**不是二选一，而是分工**——主干服务线性读者，附件服务检索读者；但**同一事实不得在两边各写一遍**（否则触发 §4.3 的 redundancy 效应与 R-E 的重复成本）。

### 8.3 现成的链式框架（「问题→现状→要改成什么→为什么→怎么知道改对了」）

| 框架 | 链条 | 缺口 |
|---|---|---|
| **Shape Up pitch**（◇官方） | **Problem**（*"The best problem definition consists of a single specific story that shows why the status quo doesn't work."*）→ **Appetite**（*"Stating the appetite and embracing it as a constraint"*）→ **Solution**（*"The core elements… easy for people to immediately understand"*）→ **Rabbit holes** → **No-gos** | 没有「怎么知道改对了」 |
| **Rust RFC**（◆一手） | Summary → Motivation（问题+用例）→ Guide-level → Reference-level → Drawbacks → Rationale → Unresolved | 没有显式验收节 |
| **Kubernetes KEP**（◆一手） | Summary/Motivation → Proposal（含 User Stories）→ Risks → Design Details → **Test Plan** → **Graduation Criteria** → Drawbacks → Alternatives | 有「怎么知道改对了」，但无「现状故事」 |
| **Google Design Doc**（◆一手） | Context and scope（现状事实）→ Goals and non-goals（改成什么/为什么）→ The actual design（方案与 trade-off）→ Alternatives considered | 验收靠外部（测试设计另文） |
| **Shape Up + KEP 合并**（本报告综合） | **问题（一个具体故事）→ 现状为什么不行 → 改成什么（含非目标与预算）→ 具体机制 → 为什么这样改（含被否方案）→ 怎么知道改对了（场景化验收+毕业标准）→ 未决/风险** | —— |

**结论**：**没有任何单一官方框架同时覆盖完整六段**；但每段都有 ≥1 个一流模板提供原文骨架。这正是 §11 候选结构的设计空间。

---

## 9. 问题 8：反面案例——表单式/矩阵式/模板驱动规格的失败与抱怨

> **引用纪律**：本节按证据等级分档。**「CAIB 认定 PowerPoint 导致哥伦比亚号失事」是过度归因**；**「文档超过 N 页就没人读」没有同行评审来源**。这两条不得作为论据。

### 9.1 CAIB 2003：结构化简报使风险在层级中丢失【官方调查】

原文：CAIB, *Report Volume I*, 2003-08, 第 7 章 "Engineering by Viewgraphs"（p.191–192），全文 PDF 已下载核对（21,404 行正文）。

- （p.191）*"At many points during its investigation, the Board was surprised to receive similar presentation slides from NASA officials in place of technical reports. The Board views the endemic use of PowerPoint briefing slides instead of technical papers as **an illustration of the problematic methods of technical communication at NASA**."*
- （p.191）*"As information gets passed up an organization hierarchy... key explanations and supporting information is filtered out. In this context, it is easy to understand how a senior manager might read this PowerPoint slide and not realize that it addresses a life-threatening situation."*
- （p.201）*"The choice of headings, arrangement of information, and size of bullets on the key chart **served to highlight what management already believed**. The uncertainties and assumptions that signaled danger dropped out of the information chain..."*
- 数字：初始损伤评估简报被大幅删减后仍需 **40 分钟**，到任务管理团队时被再砍成 **3 分钟**议题（p.193）；Boeing 幻灯片原文 *"Volume of ramp is 1920cu in vs 3 cu in for test"*；Tufte 分析被 CAIB 整页转载：vague 词 *"significant/significantly"* **同页使用 5 次**，含义从「可探测」到「全员死亡」到「640 倍差距」。
- **关键限定**：CAIB 把 PowerPoint 定性为沟通问题的**例证（illustration）**，**并未认定它是事故根因**（根因是组织/安全文化）。Tufte 本人主张更强的「工具固有缺陷」论。**引用时不可把 Tufte 的因果强度安到 CAIB 头上。**

### 9.2 大型政府 IT 项目：可核实的只有部分【官方审计】

- **英国 NHS NPfIT**（NAO 2011-05-18, HC 888）：已花 **£2.7bn**「不代表资金价值」，对剩余 **£4.3bn**「没有信心」；北部/中部/东部**七年只交付 97 套中的 4 套**给急症医院，追赶需**每月超过 2 套**；系统到位后「主要提供行政收益而非预期临床收益」。NAO 负责人原文：*"This is yet another example of a department **fundamentally underestimating the scale and complexity** of a major IT-enabled change programme."*
- **FAA Advanced Automation System (AAS)**：⚠️ **GAO/OIG 一手原文 403 未获取到**；现有数字（ISSS 组件 1990 年一年 **500+ 次需求变更** → **150,000 行代码重写、$242M**；实际 **$700–900/行** vs 预期 $500/行；估算 1988 年 $4.8B → 1994 年最高 **$7B**）来自 SEBoK 案例库**转引一手审计**，只能作二级引用。
- **FBI Virtual Case File**：⚠️ 全文抓取失败（403）；可引的只有失败事实与金额（2000 年启动、**2005 年 4 月废弃**、成本「超过 $170 million」）。**「因规格文档形式而失败」这一因果说法未能从一手文本核实，不建议单独引用。**
- **IRS modernization：属被证伪案例**（GAO-25-107611, 2025-09）：23 个现代化项目中多数**按期交付**；FY2024 实际支出约 **$1.5B，比计划少 $512M**；20/23 份计划**完整满足**关键要素。**不能**把它当规格灾难引用。

### 9.3 学术：模板的副作用——用了模板，语义问题仍在【同行评审论文】

**Franch et al. 2023**（*The state-of-practice in requirements specification*, Requirements Engineering 28:377–409，全文已核对）★实证：
- 样本：**12 家瑞典 IT 公司、24 名从业者**。
- **18/24（75%）** 使用模板或指南；来源以**组织自定**为主（11/18 = 61%），方法论/工具各 4 人（22%），**真正引用标准仅 3 人（17%）**。
- 用途：**文档版式 9/14（64%）**、需求属性 7/14（50%）、写作指南 7/14（50%）。
- 逐字：*"the company templates are not compliant to the ISO standards and so on"*；一位受访者提到公司有 *"a set of over 100 rules on how to write requirements"*；另一位：*"a lot of needs related to how to write requirements, but nothing still implemented in my company"*。
- **核心结论**：从业者**仍主要依赖自然语言**；最频繁困难是**歧义、不一致、不完整**——**模板并未消除语义问题**。

**Femmer et al. 2017**（*Rapid quality assurance with Requirements Smells*, JSS；OA arXiv:1611.08847）★实证：把 code smell 迁移为 Requirements Smells（基于 ISO 29148 缺陷分类），工具 Smella 在 3 个工业 + 1 个高校案例评估：**自动检测平均 precision 59%、recall 82%，方差很大**；*"some smells were not clearly distinguishable"*。→ **对「用模板 + 自动检查当质量门」的直接反证：precision 仅 59%。**

**Frattini 2024**（REFSQ，arXiv:2402.00594）★实证：识别出 **17 个需求质量因素 + 11 个交互效应**；逐字：*"Requirements quality defects like ambiguous statements can result in incomplete or wrong features and even lead to budget overrun or project failure."* → **「什么算好需求」高度依赖上下文，难以固化为模板字段。**

### 9.4 合规式打勾（tick-box / ritualization）【同行评审论文 + 患者安全机构】

**Facey et al. 2024**（*The ritualisation of the surgical safety checklist and its decoupling from patient safety goals*, Sociology of Health & Illness 46(6):1100–1118）★实证（摘要已核对）：
- 制度背景逐字：*"Canadian health authorities subsequently made SSC use a **mandatory organisational practice, with public reporting of safety indicators for compliance tied to... reimbursements for surgical procedures**."*
- 结论逐字：*"Two rituals, one improvised and one scripted, comprised C&C's SSC ceremony... This ceremony produced **causally opaque links to patient safety goals** and reproduced OR/medical culture."*
- AHRQ PSNet 摘要（◇官方）：*"the SCC tends to be completed as a **perfunctory task**, not to improve patient safety."*
- **注意**：WHO 清单**本身有效**（Haynes 2009 等）；负面证据指向**「强制合规 + 报销挂钩」导致仪式化**，而非清单本身无效。**不要写成「清单没用」。**

### 9.5 社区真实抱怨（○经验/轶事，非实证）

- HN 2009-07-30（id=732824）*"nobody reads design documents. In fact... I made a habit of inserting the line 'I will pay $5 to anyone who reads this sentence' into the center of any document over 50 pages. **In 10 years of development nobody ever asked for their money.**"*
- HN 2024-12-15（id=42426205）*"The biggest issue that I've had with design docs, is that **nobody reads them; even if required by their employer**."*
- HN 2024-07-31（id=41119993）：工程师 *"write design docs as **checkbox items** rather than because they are needed"*。
- HN 2016-07-13（id=12083167）：为应付「遵循流程」的外部要求而伪造产物 —— *"fake project plans, fake task lists, **fake design documents**"*。
- Lucas Fernandes da Costa, *Design docs considered harmful*（2026-02-17，当事人一手叙述）：*"It describes a system that doesn't exist. It was outdated by the second sprint and abandoned by the third. **Fourteen people commented on it. Nobody updated it.**"*；*"The doc's job was never to guide the implementation. **Its job was to get sign-off.**"*；*"A design doc review cycle at most companies takes **one to two weeks**."*

### 9.6 AI/SDD 时代的抱怨：结构化规格产出「过多文本」【当事人一手叙述 + 论文】

**Zaninotto (marmelab), 2025-11-12，《Spec-Driven Development: The Waterfall Strikes Back》**：
- 数字：用 GitHub spec-kit 做「在计时应用里显示当前日期」这个小需求，产出 **8 个文件、1,300 行文本**（Kiro 示例为 requirements.md / design.md / tasks.md 三件套）。
- 逐字：***"Markdown Madness**: SDD produces too much text... developers spend most of their time reading long Markdown files, hunting for basic mistakes hidden in overly verbose, expert-sounding prose."*
- 逐字：***"Systematic Bureaucracy**: ... Specs contain many repetitions, imaginary corner cases, and overkill refinements. **It feels like they were written by a picky clerk.**"*
- 逐字：*"The trade-off (**spending 80% of your time reading instead of thinking**) is, in my opinion, not worth it."*
- 具体失效：agent 把 "verify implementation" 标记为完成，**却没写一个单元测试**，只写了手工测试说明——即**填表式完成**。
- ⚠️ **社区并非一边倒**：该文 HN 讨论（id=45935763，225 分/191 评论）中有人主张「The spec is the problem」，也有人认为 spec 作为 LLM 上下文入口有效。**引用时应呈现分歧。**

**社区轶事（HN 2026-03-15, id=47392707）**：*"a lot of management LOVES to use Claude to generate **50 page design documents, PRDs**, etc., and send them to us to 'please review as soon as you can'. **Nobody reads it, not even the people making it.**"*（若有人读，也是**别人的 Claude 在读**。）

### 9.7 本节「不能引用」清单

| 流行说法 | 状态 |
|---|---|
| 「CAIB 认定 PowerPoint 导致哥伦比亚号失事」 | **过度归因**：原文只说「例证」 |
| 「文档超过 X 页就没人读」的百分比 | **无同行评审来源**，仅轶事 |
| 「FBI VCF 因规格文档形式而失败」 | **一手未获取到**（403），只能引失败事实与金额 |
| 「FAA AAS 的 GAO 报告」 | **GAO 站点 403**，只能二级引用 SEBoK 转引 |
| 「IRS 现代化是规格灾难」 | **被 GAO-25-107611 (2025) 事实性否定** |
| 「WHO 外科清单无效」 | **不成立**；负面证据指向强制合规导致仪式化 |

---

## 10. 矛盾证据与「不可引用」清单（单列）

### 10.1 成对矛盾（不要在报告里只挑一边）

| 主题 | 方向 A | 方向 B | 本报告的处置 |
|---|---|---|---|
| **结构化 vs 叙事（人）** | bullet 提高条目回忆（Jansen 2014，3/5 实验；Lyngo N=400 +33.4%）；结构化摘要更可读、更信息全、更受读者欢迎（Hartley 2004 综述） | bullet **降低周边正文回忆**（Jansen 2014，2/5 实验）；条目异质时正效应消失；**格式优势随任务类型交叉反转**（Vessey 1991） | **按任务分工**：检索/比对/清单 → 结构化；因果/取舍/取舍理由 → 叙事 |
| **表格 vs 图形 vs 散文（人）** | 表格在符号型任务上速度与准确度全面胜出（Vessey 1991） | 图形在空间型任务更快；频率树/图标表比纯数字表更少因果错觉（Barreiro 2025）；主题地图在相对风险上优于表格（Public Health 2022） | **不存在通用赢家**；只按「读者要做的判断类型」选格式 |
| **清单/结构化流程（审查）** | 结构化提问法 EQI 平均检出缺陷数高于 PBR（Zhi 2023） | **Checklist 不优于 Ad Hoc**；会议净增益≈0、损失 ~7%（Porter 1995） | **区分「结构化的提问」与「分类清单」**：前者可能有效，后者不自动有效 |
| **清单（外科）** | Haynes 2009：死亡 1.5%→0.8%；Scotland 2019：相对下降 36.6% | Urbach 2014：OR 0.91 (0.80–1.03) P=0.13，无改善 | **实施条件决定成败**（Fourcade 2012：依从 90.2% 但完成率仅 61%） |
| **认知负荷** | split-attention：分离的信息源损害学习 | redundancy：**整合/重复也不总是更好**；Yeung 1998 理解↑而词汇学习↓，且 expertise 反转 | **两种错误都要避免**：既不要把人逼着跨节整合，也不要主干与附件双写 |
| **BDD 有效性** | 存在 31 项 Experiment（166 篇映射研究） | 原文 *"acute shortage of metrics"*、工业评估稀缺；**本报告未取得任何一篇的可用数字** | **判定为「无严格对照实证」**，但不否认沟通价值 |
| **场景主线** | Porter 1995：Scenario 检查程序显著提升缺陷发现率（p<0.01） | 没有任何实验证明「以场景/旅程为主线的规格文档」降低遗漏 | **支持「场景作为阅读/检查主线」，不支持「场景是已证的质量机制」** |
| **叙事文档** | 叙事文本更易理解与回忆（Mar 2021 元分析，N=33,078）；Bezos/Patton | **Baker/DITA：叙事对检索与复用不利**，事实应放 reference | **不二选一**：主干叙事 + 附件 reference，同一事实只写一次 |
| **AGENTS.md 类上下文文件** | 开发者手写版 **+4%** 成功率 | LLM 生成版 **−0.5%/−2%**，成本 +20% | **结论是「只写最小必要事实」**，不是「不要写文档」（R-B 已详述） |

### 10.2 支持「结构化有益」的正面反证（必须收录，否则报告偏颇）

**Hartley 2004**（*Current findings from research on structured abstracts*, J Med Libr Assoc 92(3):368–371，PMC442180）——结构性摘要（Objective/Methods/Results/Conclusions）的综述 ★实证：
- 与传统的连续散文摘要相比，结构性摘要：**包含更多信息**（有效性达标的比较研究均支持，除 1 项）、**更易读**（研究 2/3/13）、**更易检索**（研究 3/14，但部分研究质疑）、**可能更易回忆**（研究 18）、**便于会议论文评审**（研究 5/6/19，其中 McIntosh 等报告评审人「less frustrated」）、**普遍受读者与作者欢迎**（研究 1–3/11/19/20）。
- 代价：**更长**——前 11 项研究加权平均 **+21%**；3 项「独立发表版本」的有效比较为 **+40%/+30%/+29%（加权 35%）**；有编辑抱怨这种格式 *"too rigid… a straightjacket that is inappropriate for all journal articles"*。
- 方法论限定：*"no such studies on this issue have been reported"*（可读性优势**没有**用独立发表版本做过有效检验）；回忆优势*"was not the case when the abstracts were equated for length and readability"*；且**没有任何研究比较过「完整文章」采用结构性/传统摘要的效果**。
- 作者结论：结构性摘要**是改进**，因为 *"the format requires that the authors organize and present their findings in a systematic way"*，并且这种一致性由**排版**变得显眼。

**这条为什么关键**：它证明**结构化在「短、摘要型、检索导向」的内容上是被实证支持的**，而**不是**在所有文档上都坏。它同时给了「长度代价」的精确量级（+21%~+35%）与「僵化」的抱怨。→ 这正好支持「薄叙事主干 + 结构化附件」：**附件就是那份「结构性摘要」的角色**，但**主干不该被它取代**。

### 10.3 明确不可引用 / 已证伪清单

见 §9.7；另加：
- **"list superiority effect"**：未找到可核验原始文献（§4.2）。
- **Anthropic「there's no canonical best way」**：现行页面查无此句（§7.3）。
- **industrialempathy「design doc 是 vehicles for discussion」**：全文无此原句（§2.2(3)）。
- **RFC 7322「禁止写成提纲/禁 bullet」**：全文无此条款（§2.2(8)）。
- **Sweller 1990 / Kalyuga 1999 的实验数字**：仅核验元数据，**不得引用其样本量或统计量**（§4.3）。
- **Votta 1993 的「会议增益 3.9±0.7%」**：系从 Porter 1995 技术报告转引，须写「据 Porter et al. 1995 转引」。
- **Wiegers 公开 checklist / IEEE 830 八项特征原文 / SEI Lightweight Architecture Evaluation**：未获取到。
- **BDD 三篇受控实验（Wang & Wagner 2018 等）的数字**：未获取到正文。
- **"超过 N 页就没人读"的百分比**：无同行评审来源。

---

## 11. spec 结构的 4 个候选（骨架 / 优点 / 代价 / 适用场景 / 失效条件）

> 四个候选都满足「人可读 + 强模型可拆 + 不遗漏约束」三目标的**不同侧重**。它们不是互斥的：§11.5 给出推荐组合。

### 11.1 候选 A：PR/FAQ 型（问题先行叙事）

**骨架**

```markdown
# <变更名>
1. 一段话（≤5 行）      给谁 / 解决什么 / 改完什么样 / 为什么现在做
2. 问题                 一个具体故事：今天发生什么、为什么不行、证据是什么
3. 目标与非目标          非目标 = 本可以是目标但被明确排除的（不是"不该崩溃"这种）
                         含预算/appetite：花多少、由此约束方案规模
4. 改完后的世界          仿佛已经做完，向使用者讲解它；例子驱动；新术语在此定义
5. 方案主干             按能力/职责分小节；每节 = 一个被隐藏的决策
6. 怎么知道改对了        场景化验收 + 可执行判据（命令/断言/观察点）
7. 质疑与风险            外部质疑（使用者会问什么）+ 内部质疑（成本/运营/安全）
                         + 被否方案及排除理由
8. 未决                 每条带消除条件 / 责任人 / 期限（TBR 语义）
附录 A  需求登记：R-ID / 一句话 / 验收判据 / 覆盖切片 / 状态
附录 B  覆盖与追溯：只放指针，不复制正文
```

**优点**
- 人类阅读最顺：问题先行是被三处独立原文确认的共识（Shape Up *"The best problem definition consists of a single specific story that shows why the status quo doesn't work"*；PR/FAQ 的 Problem Paragraph；Google 的 Context＝客观背景事实）。
- 审查者**首屏即可判断「值不值得做」**，不必读完细节（Google CL description 的「首行独立可读」同理）。
- FAQ 把「质疑」变成**预登记**：审查者从「想问题」变成「检查问题是否已被回答」——这正是 KEP 对审查友好性的公开定义。
- 「问题与方案永远同框」（Shape Up 原文：*"It's critical to always present both a problem and a solution together"*），天然阻止「方案先行」的坏讨论。

**代价**
- 没有用户可感流程的变更（纯内部契约、删除、重构）会退化成**硬凑故事**。
- 叙事容易膨胀；而长度证据（ETH −0.5%/−2%、IFScale 500 条指令 68%）**偏向不利于冗长文本**。
- 「约束不遗漏」需要额外机制（ID + 附录），否则约束散在叙事里会被漏读。

**适合**：有明确消费者/用户行为变化的变更；需要 owner 做 go/no-go 的变更。

**失效条件**：没有可命名的「问题故事」（纯重构/契约删除/内部清理）；或变更小到叙事成本不成比例。

---

### 11.2 候选 B：Rust RFC 双层型（教学层 + 参考层）

**骨架**

```markdown
1. 摘要            一段话，可独立阅读（IETF 要求 Abstract "self-contained and separable"）
2. 动机            问题 + 具体用例（允许长；明文禁止与方案耦合）
3. 教学层           仿佛已经做完，向新人讲解它：
                   - 引入新命名概念
                   - 主要用例子解释
                   - 读者应该"怎么想"这件事
                   - 对既有代码可读/可维护的影响
4. 参考层           技术部分，按 seam 分小节：
                   - 与既有部分的交互清晰
                   - 实现路径合理清晰
                   - 边界情况用例子剖析
                   - 回到教学层的同一批例子，说明细节如何让它们成立
5. 缺点            为什么不（Rust 原文全文仅一句 "Why should we not do this?"）
6. 理由与被否方案    为什么这是最优；考虑过什么、为何排除；先例
7. 未决            三类必答：合并前解决什么 / 实现中解决什么 / 明确出界的是什么
附录               验收用例、需求登记、写集
```

**优点**
- **官方原文可抄**，且「人读层 / 机器读层」分离是现成的（guide-level / reference-level），与本项目三角色（人审 / 强模型拆 / 弱模型执行）一一对应。
- 教学层可直接当 **owner 审查的主文档**；参考层可直接当**强模型拆 phase 的输入**——拆解者只需要在参考层的 seam 小节里找边界。
- Drawbacks / Rationale / Alternatives 是**必填结构位**，审查友好性有制度保障。
- 不依赖「用户旅程」，对基础设施/协议/契约类变更更自然。

**代价**
- 两层**可能重复**（Rust 自己就要求 reference 回到 guide 的例子；IETF 甚至明文接受摘要与引言重复）。而对 LLM 与人都存在冗余代价（Kalyuga 2004；R-E 的重复成本）。
- 「教学层」这个读者角色在纯内部工具项目里可能不存在，需要翻译成「使用/运维叙事」。
- 约束散落在两层散文里，需要 MUST/SHOULD 标记（RFC 2119）来兜底。

**适合**：协议、接口、机制类变更；有「实现者」读者；需要写清「与既有部分的交互」。

**失效条件**：变更小（两层的固定成本不成比例）；没有稳定的「教学层」读者；两层无法共享同一批例子（此时会退化成两份互不相干的文档）。

---

### 11.3 候选 C：切片主线型（章节 = 工作包候选）

**骨架**

```markdown
0. 契约头（≤1 页）
   一句话 / 目标 / 非目标 / 跨切面硬约束（内嵌 MUST/SHOULD）/ 整体验收口径

1..N 每个切片（每片 ≤1 页）：
   - 场景      现状（今天会发生什么）→ 期望（改完后发生什么）
   - 边界理由   为什么切在这里：隐藏了哪个变化点、谁会受影响
   - 改动面    写集（文件级）+ 依赖（等哪个切片）
   - 验收      可执行判据（命令 / 断言 / 可观察输出）
   - 不做      本切片明确排除的相邻行为

N+1. 全局风险与未决
附录  切片地图（依赖/并行视图）、需求登记
```

**优点**
- **可分解性最强**：章节即工作包候选，phase 边界在 spec 正文里直接可见——这正是被否的 10 节表单做不到的。
- 每片自包含 → 弱模型执行的上下文最小（与 R-B/R-E 的「每步自包含」一致）。
- 审查可**按片抽查**；写集/依赖能直接喂给 DSM 式耦合自检与「无重复契约」检查（与 decision-log T-010 直接兼容）。
- 验收天然场景化 → 接上 §5 的唯一强实证（Scenario 检查程序）。

**代价**
- **最大的风险是退化成「按模块/按层横切」的伪切片**：Parnas 明确论证按处理步骤分解几乎总是错的；Humanizing Work 也明确区分 vertical slice 与 horizontal slice。
- 跨片约束、术语一致性、全局架构合理性**无处安放**，容易每片重复（违反单一事实源）。
- 切片数量多时，人无法在脑中保持全局地图（NN/g 与「小 CL」证据都偏向更少、更小的单元）。

**适合**：能切成垂直价值切片、且有明确可观察行为变化的变更。

**失效条件**：横切契约型变更（改一个字段到处都变）；切片间双向依赖密集（DSM 对角线下方密集）——此时应合并切片或改用候选 B；切片数 >7±2。

---

### 11.4 候选 D：薄叙事主干 + 机器可读契约附件（双读）

**骨架**

```markdown
主干（≤3 页，线性论证链，人从头读到尾）
  1. 问题          一个具体故事 + 现状为什么不行
  2. 改成什么      含非目标 / 不做清单 / 预算
  3. 为什么这样改   被否方案与取舍；关键约束内嵌于此（MUST/SHOULD 标记）
  4. 具体机制      按 seam 分小节；每节 = 一个被隐藏的决策 + 与既有部分的交互
  5. 怎么知道改对了 场景化验收 + 可执行判据
  6. 未决与风险    每条带消除条件 / 责任人 / 期限

契约附件（结构化、可解析、单一事实源；人只在需要时跳转）
  A. 需求登记：R-ID / 一句话 / 验收判据 / 覆盖切片 / 状态
  B. 写集与依赖：切片 → 文件 → 依赖
  C. 未决表：ID / 消除条件 / 责任人 / 期限
  D. 覆盖指针：R-ID → 切片（只放指针，不复制正文）

附录  被否方案详述、来源、术语表
```

**优点**
- **同时服务两类读者**：线性读者读主干（叙事/因果），检索读者跳附件（topic/reference）——直接实现 §8.2 的综合判定，且不与 cognitive fit 冲突（符号型任务用表格、关系型任务用叙事）。
- **结构化不消失，只是降级**：被否方案里 10 节的内容**一个都没丢**，只是搬到了正确的轴上（见 §12.1 映射表）。
- 主干短（≤3 页）→ 直接对冲长度证据；附件不占主干阅读路径 → 避免 split-attention。
- 可脚本检查（事实证据，非门禁）：R-ID 孤儿、写集交集冲突、未决缺责任人或期限、附件与主干 ID 一致性。
- 与 decision-log 已定的 T-010（phase 自声明写集/依赖）与 T-014（纯指针索引）**天然兼容**。

**代价**
- **双读有双写风险**：同一事实在主干与附件各写一次，直接违反 CARD-02 的「单一权威/无重复契约」目标；附件与主干不一致时不易发现。
- 主干要真的「薄」需要预算与检查，否则会退化成又一个长文档。
- 附件一旦被当成「可选的表格」，就会被跳过——需要明确「什么时候必须跳附件」的指针（弱模型执行时几乎总要）。

**适合**：本项目默认形态（人审 + 强模型拆 + 弱模型执行）；需要「结构化不丢、叙事不丢」的场景。

**失效条件**：**没有机制保证附件与主干一致**（会制造新的双写——这是本候选最大的失效条件）；团队不跑检查；或变更复杂到主干 3 页装不下（应升格为候选 B 的两层，或拆成多份 spec）。

### 11.5 四个候选的一句话对比、推荐倾向与失效条件

| 候选 | 一句话 | 可读性（人） | 可分解性（强模型） | 无遗漏（约束） | 主要失效条件 |
|---|---|---|---|---|---|
| **A PR/FAQ 型** | 问题先行、质疑预登记的新闻稿 | **最强** | 中（靠方案主干分节） | 中（约束散在叙事） | 没有问题故事（纯重构/契约变更） |
| **B RFC 双层型** | 教学层给人、参考层给实现者的官方范式 | 强 | **强**（参考层 seam 分节） | 强（Drawbacks/Rationale/Unresolved 必填） | 变更小；两层重复；无「教学层」读者 |
| **C 切片主线型** | 章节即工作包，边界在正文里可见 | 中（全局感弱） | **最强** | 弱（跨片约束无处安放） | 横切契约变更；切片强耦合；切片数过多 |
| **D 薄主干 + 契约附件** | 叙事主干给人、结构化附件给机器 | **强** | **强** | **强**（ID + 可检查） | **附件与主干不一致 → 变成新的双写** |

**推荐倾向**：**候选 D 作为默认信封**，内部按以下方式吸收 A/B/C 各自的强项——

1. **主干内部结构用 B 的四拍**：问题/动机 → 改成什么（含非目标）→ 为什么这样改（含被否方案）→ 具体机制（按 seam 分小节）；保留 Rust 的「参考层回到教学层同一批例子」这条纪律。
2. **开头用 A 的「一个具体故事 + 非目标」**，末段用 A/KEP 的「质疑预登记 + 未决带消除条件」。
3. **主干第 4 节的分节轴用 C**：小节 = 可独立交付/验证的切片；每片声明写集、依赖、不做。
4. **被否 10 节里剩下的结构化内容全部进 D 的契约附件**（§12.1）。

**推荐组合的失效条件（若出现，按此降级/升格）**：

| 触发条件 | 应对 |
|---|---|
| 附件与主干出现同一事实的两份表述且无人检查 | **立刻停止双读**，把该事实只留在附件，主干改为指针 |
| 主干的机制节无法按切片切（横切契约型变更） | 退回**候选 B**（不分片，按机制层分节） |
| 变更小（主干 <1 页即可说清） | 只用**候选 A 的 1–4 + 6**，附件仅留需求登记 |
| 变更是多个可独立交付的行为变化且彼此独立 | 用**候选 C 作为主体**（主干退化为契约头） |
| 主干 3 页装不下 | 升格为**多份 spec**（每份各自 D），而不是让主干膨胀 |

---

## 12. 落到本项目：被否的 10 节去哪了，以及与 R-A…R-E / decision-log 的衔接

### 12.1 被否 10 节 → 候选 D 的映射表（内容一个都没丢，换的是轴）

| 被否的节 | 去 D 的哪里 | 组织轴变化 |
|---|---|---|
| 0 速读卡 | 主干第 1 段「一段话」（≤5 行） | 轴 1 → **轴 2 的开头**（结论前置，首行独立可读） |
| 1 目标与非目标 | 主干第 2 节 | 轴 1 → 轴 2（非目标必须写「为什么不是目标」） |
| 2 硬约束 | **内嵌**到主干第 3/4 节相关句子（MUST/SHOULD 标记）＋ 附件 C 的指针 | 轴 1 的独立教条节 → **轴 2 的语境化标记**（RFC 2119） |
| 3 需求（双向追溯） | 附件 A 需求登记表 | 轴 1 → **轴 1（降级到附件）** |
| 4 架构方案 | 主干第 4 节（机制，按 seam 分小节） | 轴 1 → **轴 3** |
| 5 验收四段式 | 主干第 5 节（场景化验收） | 轴 1 → 轴 2 的收尾（并接 §5 的场景检查证据） |
| 6 测试标准 | 主干第 5 节的可执行判据（细节下沉到 phase） | 轴 1 → 轴 3 的就地判据 |
| 7 改动范围（NEW/MODIFY/DO NOT TOUCH） | 每片的「改动面/不做」＋ 附件 B 写集表 | 轴 1 的全局表 → **轴 3 的逐片声明** |
| 8 未决事项 | 主干第 6 节 ＋ 附件 C 未决表 | 保留，但加 **TBR 语义**（理由/责任人/期限） |
| 9 覆盖矩阵 | 附件 D 覆盖指针 | 轴 1 的矩阵 → **纯指针**（对齐 decision-log T-014） |
| 附录 | 附录（被否方案详述、来源、术语） | + **被否方案从附录升格为主干第 3 节** |

**一句话**：**10 节里没有一节是「错的」，错的是它们全都平铺在同一条阅读路径上。**

### 12.2 与 decision-log 既有决议的兼容性

| 既有决议 | 与候选 D 的关系 |
|---|---|
| **T-009 spec 信息架构**（待 R-A/R-E/R-G 回收后定） | 本报告即 T-009 的输入；建议按 §11.5 的组合定稿 |
| **T-010 并行/写集/依赖**（phase 自声明 + 紧凑索引汇总） | 候选 D 的附件 B 与 C 的「每片声明改动面/依赖」**直接一致** |
| **T-012 decision-log 设计**（ADR 风格 + 保留来源链） | spec 主干第 3 节「为什么这样改」**只放决策指针（D-###）**，理由正文留在 decision-log（引用不复制） |
| **T-014 紧凑索引**（纯指针表，不复制正文） | 候选 D 的附件 D 就是该索引在 spec 侧的对应物 |
| **T-008 文档长度预算**（软目标 + 结构规则；引用不复制） | 候选 D 的「主干 ≤3 页」需要一个软预算；附件不计入主干预算 |
| **T-013 phase 文档形态**（执行手册式 vs 目标式，待 R-F） | 候选 D **不预设** phase 内部写法；它只保证 phase 的**边界与判据**在 spec 里可见（R-F 可独立决定 phase 正文风格） |
| **SD-17 / 无机器门禁** | §12.3 的检查项一律作为**事实证据**，不阻断推进 |

### 12.3 与兄弟报告的边界与一处修正建议

- **R-A（SDD 框架）**：Spec Kit 的 spec 是**按信息种类**组织的（User Scenarios & Testing / Requirements / Success Criteria），Kiro 是 Requirements/Design/Tasks 三件套。**它们与本报告的候选 D 不冲突，但也不足以支撑「表单式」**——Spec Kit 的 `User Scenarios & Testing` 恰恰是轴 3 的投影，说明业界最好实践也把场景放在正文靠前位置。
- **R-B（弱模型可执行规格）§8 模板骨架**（`0目标/1硬约束/2改动范围/3边界与错误/4示例/5验收/6未决/附录`）：**该骨架是轴 1 倾向的**（按信息种类平铺）。它不是错的——它面向的是**phase 文档**（弱模型执行），而本报告面向的是**spec 文档**（人审 + 强模型拆）。**修正建议**：spec 用候选 D；**phase 文档继续用 R-B 的固定字段骨架**（弱模型的格式恒定性要求，见 §7.1 第 1/2 条）。两者分工不同，不要互相搬。
- **R-E §9.3 spec 专用规则**中的「结构按 Diátaxis Reference 组织；每个需求一行、字段固定：`R-ID / 一句话 / 验收判据 / 覆盖 phase / 状态`」：**该规则应只约束候选 D 的附件 A**，不应约束主干。否则等于把表单塞回正文，正是决策者否掉的东西。
- **R-E §6.4**（约束/映射用表格、因果/理由用散文）与**本报告 §4.1**（cognitive fit 交叉反转）**一致**，本报告为其补上了原始实验。
- **R-D §7**（公开的规格审查清单）与本报告 §6 互为补充：R-D 从「审查流程」角度，本报告从「结构位」角度。
- **R-C**（EARS/Gherkin/四段式验收）在候选 D 里落点为主干第 5 节 + 各片的「验收」槽位。

### 12.4 建议的检查项（事实证据，不是门禁）

| 检查 | 实现 | 性质 |
|---|---|---|
| 主干是否超预算 | 按「主干」标记范围内计行/计字 | 事实，记录 |
| R-ID 孤儿 | 附件 A 的 R-ID 集合 vs 附件 B/D 的引用集合求差 | 事实，记录 |
| 附件与主干的 ID 一致性 | 主干提到的 R-ID 必须存在于附件 A；反之附件 A 的每条必须被主干或切片引用 | 事实，记录 |
| 未决项缺责任人或期限 | 解析附件 C 的列 | 事实，记录 |
| 切片写集交集 | 附件 B 的「切片 → 文件」求交集（非空即耦合信号） | 事实，记录 |
| 不可判定词命中 | NASA C.4 禁用词表 + 中文对应词（R-C 的黑名单） | 事实，记录 |
| 被否方案节是否为空 | 主干第 3 节的最小长度 | 事实，记录 |

---

## 13. 来源清单、方法与局限

### 13.1 一手来源（本报告直接引用其原文）

**官方模板 / 规范 / 风格指南**
- Rust RFC 模板：<https://raw.githubusercontent.com/rust-lang/rfcs/master/0000-template.md>
- Kubernetes KEP 模板：<https://raw.githubusercontent.com/kubernetes/enhancements/master/keps/NNNN-kep-template/README.md>；真实 KEP-1880：<https://raw.githubusercontent.com/kubernetes/enhancements/master/keps/sig-network/1880-multiple-service-cidrs/README.md>；KEP 流程：<https://kubernetes.dev/resources/keps/1194/>；PRR：<https://github.com/kubernetes/community/blob/master/sig-architecture/production-readiness.md>
- Python PEP 1：<https://peps.python.org/pep-0001/>；PEP 12：<https://peps.python.org/pep-0012/>
- React RFC 模板：<https://raw.githubusercontent.com/reactjs/rfcs/main/0000-template.md>
- IETF RFC 7322：<https://www.rfc-editor.org/rfc/rfc7322.txt>；RFC 2119：<https://www.rfc-editor.org/rfc/rfc2119.txt>；RFC 2223：<https://www.rfc-editor.org/rfc/rfc2223.txt>
- Amazon PR/FAQ（前高管 Bill Carr & Colin Bryar）：<https://workingbackwards.com/resources/working-backwards-pr-faq/>；Bezos 2017 股东信：<https://www.aboutamazon.com/news/company-news/2017-letter-to-shareholders>；Bezos 2004 邮件转录：<https://www.businessinsider.com/jeff-bezos-email-against-powerpoint-presentations-2015-7>
- Google Design Docs（Malte Ubl）：<https://www.industrialempathy.com/posts/design-docs-at-google/>
- Google Engineering Practices：<https://google.github.io/eng-practices/review/reviewer/>、<https://google.github.io/eng-practices/review/reviewer/looking-for.html>、<https://google.github.io/eng-practices/review/reviewer/standard.html>、<https://google.github.io/eng-practices/review/developer/small-cls.html>、<https://google.github.io/eng-practices/review/developer/cl-descriptions.html>
- NASA SEH Appendix C：<https://www.nasa.gov/reference/appendix-c-how-to-write-a-good-requirement/>
- SEI ATAM：<https://www.sei.cmu.edu/library/architecture-tradeoff-analysis-method-collection/>
- EARS（原作者站）：<https://alistairmavin.com/ears/>；Cucumber Gherkin：<https://cucumber.io/docs/gherkin/reference/>
- Shape Up Ch.6 Write the Pitch：<https://basecamp.com/shapeup/1.5-chapter-06>
- Impact Mapping：<https://www.impactmapping.org/drawing.html>
- NN/g Journey Mapping 101：<https://www.nngroup.com/articles/journey-mapping-101/>
- OASIS DITA 1.2 archSpec：<https://docs.oasis-open.org/dita/v1.2/os/spec/archSpec/topicdefined.html>
- DSM 介绍：<https://dsmweb.org/introduction-to-dsm/>
- Team Topologies ISH：<https://teamtopologies.com/key-concepts-content/finding-good-stream-boundaries-with-independent-service-heuristics>
- Humanizing Work 切分指南：<https://www.humanizingwork.com/the-humanizing-work-guide-to-splitting-user-stories/>；Wake INVEST：<https://xp123.com/invest-in-good-stories-and-smart-tasks/>；Cohn SPIDR：<https://www.mountaingoatsoftware.com/agile/five-simple-but-powerful-ways-to-split-user-stories>；Cohn User Stories：<https://www.mountaingoatsoftware.com/agile/user-stories>
- Jeffries 三 C：<https://ronjeffries.com/xprog/articles/expcardconversationconfirmation/>；Patton：<https://jpattonassociates.com/the-new-backlog/>；Mark Baker：<https://everypageispageone.com/2012/09/19/narrative-and-fact-in-tech-comm/>
- Conway 1968：<https://www.melconway.com/Home/Committees_Paper.html>；Cockburn walking skeleton（存档）：<https://wiki.c2.com/?WalkingSkeleton>
- Parnas 1972 开放 PDF：<https://wstomv.win.tue.nl/edu/2ip30/references/criteria_for_modularization.pdf>；Feathers Ch.4 节选：<https://www.informit.com/articles/article.aspx?p=359417>
- CAIB Report Vol I：<https://ehss.energy.gov/deprep/archive/documents/0308_caib_report_volume1.pdf>
- NAO NPfIT 2011：<https://www.nao.org.uk/reports/the-national-programme-for-it-in-the-nhs-an-update-on-the-delivery-of-detailed-care-records-systems/>
- GAO-25-107611（IRS）：<https://files.gao.gov/reports/GAO-25-107611/index.html>

**论文 / 预印本**（全部为本次实抓或元数据核验）
- Porter, Votta & Basili 1995, IEEE TSE 21(6)：<https://doi.org/10.1109/32.391380>（开放技术报告全文：<https://drum.lib.umd.edu/items/96204769-6905-4196-b903-709ad81148ee>）
- Vessey & Galletta 1991, ISR 2(1):63–84：<https://doi.org/10.1287/isre.2.1.63>
- Jansen 2014, Information Design Journal 21(2):146–162：<https://doi.org/10.1075/idj.21.2.06jan>
- Mar, Li, Nguyen & Ta 2021, Psychon Bull Rev 28(3):732–749：<https://pmc.ncbi.nlm.nih.gov/articles/PMC8219577/>
- Kalyuga, Chandler & Sweller 2004, Human Factors 46(3):567：<https://pubmed.ncbi.nlm.nih.gov/15573552/>；Yeung, Jin & Sweller 1998：<https://pubmed.ncbi.nlm.nih.gov/9514686/>
- Hartley 2004, J Med Libr Assoc 92(3):368–371：<https://pmc.ncbi.nlm.nih.gov/articles/PMC442180/>
- Haynes et al. 2009, NEJM 360(5):491–499：<https://pubmed.ncbi.nlm.nih.gov/19144931/>；Urbach et al. 2014, NEJM 370(11):1029–1038：<https://pubmed.ncbi.nlm.nih.gov/24620866/>；Scotland 2019, BJS：<https://pubmed.ncbi.nlm.nih.gov/30993676/>；Fourcade et al. 2012, BMJ Qual Saf：<https://pmc.ncbi.nlm.nih.gov/articles/PMC3285141/>；Fridrich et al. 2022：<https://pmc.ncbi.nlm.nih.gov/articles/PMC9131675/>
- Facey et al. 2024, Sociology of Health & Illness 46(6):1100–1118：<https://doi.org/10.1111/1467-9566.13746>；AHRQ PSNet 评述：<https://psnet.ahrq.gov/issue/ritualisation-surgical-safety-checklist-and-its-decoupling-patient-safety-goals>
- Franch et al. 2023, Requirements Engineering 28:377–409：<https://doi.org/10.1007/s00766-023-00399-7>
- Femmer et al. 2017, JSS：<https://arxiv.org/abs/1611.08847>；Frattini 2024, REFSQ：<https://arxiv.org/abs/2402.00594>；Zhi et al. 2023, Heliyon：<https://pmc.ncbi.nlm.nih.gov/articles/PMC10213370/>
- Sclar et al., FormatSpread, ICLR 2024：<https://arxiv.org/abs/2310.11324>
- He et al. 2024：<https://arxiv.org/abs/2411.10541>
- Chen et al., ICML 2024：<https://arxiv.org/abs/2402.08939>
- Liu et al., Lost in the Middle, TACL 2024：<https://arxiv.org/abs/2307.03172>
- Valmeekam et al., NeurIPS 2023：<https://arxiv.org/abs/2305.15771>；PlanBench：<https://arxiv.org/abs/2206.10498>；LLM+P：<https://arxiv.org/abs/2304.11477>；TIC：<https://arxiv.org/abs/2402.06608>
- Tam et al., EMNLP 2024 Industry：<https://arxiv.org/abs/2408.02442>｜<https://aclanthology.org/2024.emnlp-industry.91/>
- Zhou et al., Least-to-Most：<https://arxiv.org/abs/2205.10625>；Khot et al., DecomP：<https://arxiv.org/abs/2210.02406>；Wang et al., Plan-and-Solve：<https://arxiv.org/abs/2305.04091>；Dua et al., Successive Prompting：<https://aclanthology.org/2022.emnlp-main.81/>
- Huang et al. 规划综述：<https://arxiv.org/abs/2402.02716>；ADaPT：<https://arxiv.org/abs/2311.05772>
- Binamungu & Maro 2023, JSS（BDD 系统映射）：<https://arxiv.org/abs/2305.05567>；Binamungu et al. 2018, SANER：<https://doi.org/10.1109/saner.2018.8330207>；Hoisl et al. 2014, QUATIC：<https://doi.org/10.1109/quatic.2014.19>；Sutcliffe et al. 1998, IEEE TSE 24(12)：<https://doi.org/10.1109/32.738340>
- ETH Zurich《Evaluating AGENTS.md》：<https://arxiv.org/abs/2602.11988>；IFScale：<https://arxiv.org/abs/2507.11538>
- Anisotropy/structured-output 侧：见 §7.3 的 Anthropic/OpenAI 官方页

**当事人一手叙述 / 行业**
- marmelab《Spec-Driven Development: The Waterfall Strikes Back》：<https://marmelab.com/blog/2025/11/12/spec-driven-development-waterfall-strikes-back.html>（HN 讨论 <https://news.ycombinator.com/item?id=45935763>）
- Lucas Fernandes da Costa《Design docs considered harmful》：<https://lucasfcosta.com/blog/design-docs>
- Westfall《A Requirements Review Checklist》（PDF）：<https://s3.amazonaws.com/kajabi-storefronts-production/sites/69255/themes/3204533/downloads/k8J40awtSje3EVLFttkv_A_Requirements_Review_Checklist.pdf>

### 13.2 方法

- 5 路并行子代理取证（Q1 骨架 / Q2+Q7 seam+narrative / Q3+Q4 认知+场景 / Q5+Q6 审查清单+LLM 输入 / Q8 反面案例），主会话只收摘要与笔记文件，逐条核对引文与 URL。
- 搜索与抓取 API 配额在过程中耗尽（HTTP 402），子代理改用 `curl` 直取原文 PDF + Crossref/OpenAlex/arXiv/Europe PMC/HN Algolia API 完成取证；**未真正取到的内容一律标注「未获取到」，不代拟引文**。
- 主要笔记文件（可复核）：`/tmp/spec-research/Q1-narrative-skeletons.md`（骨架）、`Q2Q7-seams-narrative.md`（seam + narrative）、`_subA-cognition-inspection.md`（结构化 vs 人）、`_subB-scenario-driven.md`（场景/旅程）、`Q5Q6-review-and-LLM-decomposition.md`（审查清单 + LLM 输入）、`Q8-failure-cases.md`（反面案例）。

### 13.3 局限（影响本报告所有结论）

1. **无中文实证**：§7 的全部格式/顺序/位置证据来自**英文基准任务**，没有任何一篇中文 prompt 实验；迁移到「中文规格拆解」一律是△外推。
2. **无「叙事 vs 表格」的直接实验**：He et al. 未测表格；「叙事优于表格」在本报告中被明确标为**无直接实证**。
3. **人读侧的证据多为实验室学生样本**（Porter 1995 为 48 名研究生；Westfall/Jansen/Hoisl 的样本分别为从业者或学生，量级 20–80），外推到「项目 owner 审查自己的 spec」需谨慎。
4. **BDD/旅程/Example Mapping 的收益基本是经验框架**，唯一强实证（Porter 1995）研究的是**审查程序**而非**规格文档形态**。
5. **「被否方案 / 缺点 / 未决」的必填性来自一流模板的共识**，但没有实验证明「必填」比「不填」产生更好的项目结果——这是设计判断，不是实证结论。
6. **本报告的候选结构（§11.5 的组合）是本报告的综合与建议，不是任何官方标准**；其中「主干 ≤3 页」「附件与主干的 ID 一致性检查」等阈值与规则属于工程判断，需在本项目内自测（建议按 §7.4 的三版 A/B 方法）。


