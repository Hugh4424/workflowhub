# R-E：技术规格类文档的「精炼度 / 信息密度 / 可读性 / 无遗漏」工程方法

> 调研目标：为 decision-log（决策）、spec（实施前翻译）、phase（工作包差异）三类文档给出**可直接抄用的精炼规则**，同时不损失关键信息，并保证"较弱模型照着写也能出高质量代码"。
> 方法：`web_search` + `anysearch_search`（academic / general）+ `web_fetch`，优先官方风格指南、原始模板、原始论文。
> 生成时间：2026-09-19。所有论断后附来源；一手来源与二手经验分别标注。

---

## 0. 摘要（TL;DR）

1. **"精炼"不等于"写得少"，而是"单位长度承载的可判定信息多"。** 学术上把信息密度拆成四个可度量的缺陷维度：Fallacy（表述不可靠）、Difficulty（太浅无信息）、Redundancy（删掉一部分仍能得出同一结论）、Diversity（多条重复同一信息）；信息密度 ∝ (1−Fallacy)·Difficulty·(1−Redundancy)·Diversity（[arXiv:2503.10079](https://arxiv.org/html/2503.10079v1)）。**"Redundancy"这一条可以直接当删减规则用：某句删掉后文档仍能推出同一结论，它就该删。**
2. **三大风格指南里唯一真正的"精简规则"是删词、不是删信息。** Strunk & White 第 17 条 "Omit needless words"：一句话里不应有赘词，一段里不应有赘句（[原文](https://needlesswords.com/2020/09/02/on-omitting-needless-words/)）；Google 指南给了具体手法：条件前置、主动语态、第二人称、描述性链接文字（[Highlights](https://developers.google.com/style/highlights)）；中文侧最硬的是句长/段长数字上限（见 §8）。
3. **长度经验法则有公开锚点。** Google Design Doc：大项目甜点 10–20 页，增量改进用 **1–3 页 mini design doc**（[Design Docs at Google](https://www.industrialempathy.com/posts/design-docs-at-google/)）；Amazon 六页备忘录**恰好 6 页、无 bullet、无图、无 fluff**，PR-FAQ 是"新闻稿 + FAQ"两段式（[PR/FAQ](https://workingbackwards.com/resources/working-backwards-pr-faq/)、[六页备忘录解剖](https://writingcooperative.com/the-anatomy-of-an-amazon-6-pager-fc79f31a41c9)）。
4. **ADR 是 decision-log 的精确对标，且已被证明"极短即可不丢信息"。** Nygard 模板只有 5 节：Title/Status/Context/Decision/Consequences（[原始模板](https://github.com/architecture-decision-record/architecture-decision-record/blob/main/locales/en/templates/decision-record-template-by-michael-nygard/index.md)）；MADR 的 **minimal 模板只有 3 节必填**：Context and Problem Statement / Considered Options / Decision Outcome（[minimal 模板原文](https://raw.githubusercontent.com/adr/madr/develop/template/adr-template-minimal.md)）。实践者给的长度口径是：**"一页幻灯片几句话就够；再刁钻的问题也就几页"**（[ADR creation anti-patterns](https://ozimmer.ch/practices/2023/04/03/ADRCreation.html)）。
5. **渐进式披露是"概览 → 细节 → 附录"的工程化机制，Diátaxis 是它的文档学版本。** 初始层只放核心，二次层按需展开；**超过 2 层可用性会掉**（[NN/g](https://www.nngroup.com/articles/progressive-disclosure/)）。Diátaxis 四象限（tutorial/how-to/reference/explanation）可直接映射为"README/流程/spec 参考段/decision-log 理由"（[diataxis.fr](https://diataxis.fr/)），且它明确区分**功能性质量**（准确、完整、一致、有用、精确——可测量）与**深层质量**（好用、有flow——只能判断）（[Quality](https://diataxis.fr/quality/)）。
6. **"无遗漏"靠结构保证，不靠写长。** 手段有四类：模板必填项、需求质量属性清单（INCOSE/ISO 29148）、可追溯矩阵（requirement → test）、评审清单。NASA 的《How to Write a Good Requirement》给了一份**可以直接抄的 4 张清单**：术语、编辑、通用良好性、需求验证（覆盖 clarity/completeness/compliance/consistency/traceability/correctness/verifiability…）（[NASA SEH Appendix C](https://www.nasa.gov/reference/appendix-c-how-to-write-a-good-requirement/)）。
7. **省略必须显式化。** NASA 的口径：不完整的部分要登记为 **TBD/TBR**，且 TBR 必须带"为什么、谁负责、何时消除"；**"未说"与"显式声明不做"是两回事**——后者是 non-goals/deferred，前者是遗漏（同 NASA 来源；Google design doc 的 Goals/non-goals 同理）。
8. **文档格式对 LLM 准确率的影响是实测存在的，且对弱模型影响更大。** 同一内容换 plain text/Markdown/JSON/YAML，GPT-3.5 在代码翻译任务上差异可达 ~40%（某数据集 Markdown→plain text 提升 200%）；**GPT-4 明显更鲁棒**，且**不存在通用最优格式**（[arXiv:2411.10541](https://arxiv.org/html/2411.10541v1/)）。结论：**给弱模型用的 spec/phase 必须"格式恒定、字段固定、关键信息靠前"**。
9. **"把所有东西都写进上下文文件"已被证伪。** ETH 的 AGENTS.md 实验：LLM 生成的上下文文件平均**降低**任务成功率（SWE-bench Lite −0.5%、AGENTbench −2%）、**成本 +20% 以上**；人工写的仅 +4%；根因是"**多余的 requirements 让任务变难**"；且上下文文件**并没有起到有效的仓库概览作用**（[arXiv:2602.11988](https://arxiv.org/html/2602.11988v1/)）。可抄的结论：**只写"读代码读不出来的最小必要事实"，不复述目录结构、不复述 `package.json`。**
10. **长上下文有"中间塌陷"。** 关键信息放在长文档中部会被显著忽略（U 形曲线，[Lost in the Middle](https://arxiv.org/abs/2307.03172)）。所以**首屏给结论、尾部给附录、中间只放同一主题的细节**。
11. **可读性公式（Flesch/Gunning Fog）不宜作为工程门禁。** 七个理由：不可靠、不有效、不看词义、年级水平对成人无意义、假设连续段落、为分数改写会丢连贯性、高分≠有用（[Effortmark + Ginny Redish](https://www.effortmark.co.uk/readability-formulas-seven-reasons-to-avoid-them-and-what-to-do-instead/)）。**中文可读性工具（AlphaReadabilityChinese，词/句/义 9 指标）仍在起步阶段**（[来源](https://www.researchgate.net/publication/379452433_AlphaReadabilityChinese_A_tool_for_the_measurement_of_readability_in_Chinese_texts_and_its_applications_AlphaReadabilityChinesehanyuwenbenkeduxinggongjukaifayuyingyong)）。**替代方案是硬上限**：句 ≤20 字最佳 / 20–29 可接受 / ≥40 一律不接受，逗号长句 ≤100 字；段落一主题、≤7 行、50–200 字、不超 250 字（[中文技术文档写作规范](https://nageoffer.com/docs/convention/doc/tech/)、[zh-style-guide](https://zh-style-guide.readthedocs.io/zh-cn/latest/)）。

---

## 1. 信息密度与冗余

### 1.1 定义：三个层次

| 口径 | 定义 | 可操作性 |
|---|---|---|
| 通用技术写作 | "单位长度文本里承载的**与决策相关**的信息量；只有在信息准确且可理解时才有意义"（[The Rank Collective](https://therankcollective.com/glossary/information-density)） | 弱：无法直接测量 |
| 通讯写作 | "一定量文本里塞进的**相关信息**的量"（[Sarah Cordivano](https://medium.com/sarah-cordivano/better-communication-high-information-density-662fe8bfa8d6)） | 弱 |
| 学术（可计算） | 信息密度 = 样本能反映的**有洞察力信息**的体量；可从信息熵推导为 `E(I) ∝ (1−Fallacy)·Difficulty·(1−Redundancy)·Diversity`（[arXiv:2503.10079](https://arxiv.org/html/2503.10079v1)） | **强：四个维度各自可判定** |

学术口径虽然是给 benchmark 用的，但**四个维度可以逐条翻译成文档审校问题**（这是本报告最有价值的一条迁移）：

| 维度 | 原义 | 文档审校问法 |
|---|---|---|
| Fallacy | 样本表述不严谨，反映的信息不可靠 | 这句话有没有不可验证的形容词、指代不明的代词、混装多个主张？ |
| Difficulty | 太简单，所有模型都能答对，没有信息量 | 这条内容读者/模型**不读也能做对**吗？那就是 no-op，删。 |
| Redundancy | 只看一部分信息就能答对，其余是冗余 | 删掉这句/这段，结论还推得出来吗？能，就删。 |
| Diversity | 多条样本过于相似，信息重叠 | 这两条是不是同一个意思写了两次？合并或引用。 |

补充理论支撑：**Uniform Information Density**（均匀信息密度）假设语言产出倾向于把信息在信号上**均匀分布**，而不是一会儿极密一会儿极疏（[Jaeger 2010, PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC2896231/)）。这解释了为什么"重点简写、次要点展开"违反直觉地**降低**了可读性——它让信息密度曲线尖峰化。

### 1.2 冗余的两种形态（必须分别对待）

- **Duplication（重复）**：同一个意思出现在两处。代价是维护成本 + 该意思在文档层级里被"虚高加权"（[writing-for-agents 技能：Pruning / single source of truth](/Users/Hugh/.agents/skills/writing-for-agents)）。
- **Scattering（分散）**：一个意思被切碎散落在多处。它的反面是 **Co-location（同处）**：一个概念的**定义、规则、例外**必须放在同一个标题下（同上）。

两者检测方法不同：重复靠"同一事实字符串/同一结论句出现两次"检测；分散靠"读某一段时是否必须跳到别处才能读懂"检测。

### 1.3 可操作的删减规则

| 规则 | 表述 | 来源 |
|---|---|---|
| R-DEL-1 | **删词不删信息**：一句里没有赘词，一段里没有赘句——"这和一个画家不画多余的线条、一个工程师不造多余的零件的理由相同" | Strunk & White 第 17 条（[原文](https://needlesswords.com/2020/09/02/on-omitting-needless-words/)） |
| R-DEL-2 | **说过一次就不再说**：同一文档中**勿重复表达同一事物** | [zh-style-guide 简洁清晰](https://zh-style-guide.readthedocs.io/zh-cn/latest/%E8%AF%AD%E8%A8%80%E9%A3%8E%E6%A0%BC/%E7%AE%80%E6%B4%81%E6%B8%85%E6%99%B0.html) |
| R-DEL-3 | **引用不复制**：不要把接口定义、data schema 整段贴进文档——它们冗长、含无关细节、并且会快速过时；只写与设计/权衡相关的部分 | Google Design Docs（[来源](https://www.industrialempathy.com/posts/design-docs-at-google/)） |
| R-DEL-4 | **不复述环境**：目录结构、脚本名、`--help` 输出这类"一眼可查"的事实不要缓存进文档；只写"查不出来的"：不成文约定、选择背后的理由、配置不会承认的坑 | writing-for-agents 技能（Cache 一节） |
| R-DEL-5 | **删整句而不是修词**：一句话若通不过"它是否改变行为（vs 默认行为）"的检验，删掉整句，而不是从里面抠词 | writing-for-agents 技能（no-ops） |
| R-DEL-6 | **否定改肯定**：用肯定句表达同一意思；避免双重否定 | [中文技术文档写作规范](https://nageoffer.com/docs/convention/doc/tech/)；NASA 也要求 requirement "stated positively" |
| R-DEL-7 | **条件前置**：先写条件，再写指令 | [Google Highlights](https://developers.google.com/style/highlights) |
| R-DEL-8 | **主动语态 + 明确主语**：让"谁做什么"无法被误读 | Google Highlights；中文规范"尽量用主动时态，阐述清楚主语和宾语" |
| R-DEL-9 | **每段一个主题**，中心句放段首 | [zh-style-guide 段落](https://zh-style-guide.readthedocs.io/zh-cn/latest/%E6%96%87%E6%A1%A3%E7%BB%93%E6%9E%84%E6%A0%B7%E5%BC%8F/%E6%AE%B5%E8%90%BD.html) |
| R-DEL-10 | **形容词/副词逐个过堂**：能否删掉？能否被证据支持？（删不掉的才留） | [ADR anti-patterns: Sales Pitch](https://ozimmer.ch/practices/2023/04/03/ADRCreation.html) |
| R-DEL-11 | **先图表、后句子**：技术描述类主题不要只用段落陈述 | [zh-style-guide 段落](https://zh-style-guide.readthedocs.io/zh-cn/latest/%E6%96%87%E6%A1%A3%E7%BB%93%E6%9E%84%E6%A0%B7%E5%BC%8F/%E6%AE%B5%E8%90%BD.html) |
| R-DEL-12 | **定稿后通读一遍全文删一遍**：把对表达意思没有作用的字、词、句删去 | [zh-style-guide 简洁清晰](https://zh-style-guide.readthedocs.io/zh-cn/latest/%E8%AF%AD%E8%A8%80%E9%A3%8E%E6%A0%BC/%E7%AE%80%E6%B4%81%E6%B8%85%E6%99%B0.html) |

### 1.4 「引用 vs 复制」的判定（面向 LLM 的修正版）

Google 的规则是"复制会过时，所以引用"。但**面向 LLM 的文档不能无脑引用**：模型不会自己点链接，除非文档明确要求它去读（"context pointer"机制，见 §6.5）。因此判定规则应改为：

| 事实类型 | 处理 | 理由 |
|---|---|---|
| **契约事实**（接口签名、字段名、错误码、验收命令、测试名） | **复制**，且只复制"本条决策/本 phase 需要的那几行" | 弱模型执行时依赖精确字面量；且它是稳定契约，不易过时 |
| **解释/理由/权衡** | 写在 decision-log，spec/phase **引用 ID 不复述** | 复述会让"谁说了算"出现两个权威 |
| **可查的环境事实**（目录树、脚本清单、依赖版本） | **引用路径**，并要求执行者现场读取 | 缓存会 stale；AGENTS.md 实验证明这类概览"并不有效" |
| **长表格/大段代码** | **移到附录或独立文件**，正文只留结论 + 指针 | 中间塌陷效应 + 上下文成本 |

---

## 2. 文档长度控制

### 2.1 公开经验法则一览

| 文档类型 | 长度口径 | 一手来源 |
|---|---|---|
| Google Design Doc | 大项目甜点 **10–20 页**；超出就该拆问题；**增量改进可用 1–3 页 mini design doc**（做同样的事，只是更简洁、更聚焦） | [Design Docs at Google](https://www.industrialempathy.com/posts/design-docs-at-google/) |
| Amazon 六页备忘录 | **恰好六页**；无 bullet、无图、无 fluff；靠完整句子叙述；会议开始时集体静读约 30 分钟 | [The Anatomy of an Amazon 6-pager](https://writingcooperative.com/the-anatomy-of-an-amazon-6-pager-fc79f31a41c9)、[CNBC 报道](https://www.cnbc.com/2018/04/23/what-jeff-bezos-learned-from-requiring-6-page-memos-at-amazon.html) |
| Amazon PR-FAQ | 两段式：**Press Release（1 页级叙述）+ FAQ**；FAQ 分 internal / customer，含风险、假设、里程碑 | [Working Backwards](https://workingbackwards.com/resources/working-backwards-pr-faq/)、[Product School 模板](https://productschool.com/blog/product-fundamentals/prfaq) |
| ADR | 一句话 slide 到几页；**MADR minimal = 3 节必填** | [ADR anti-patterns](https://ozimmer.ch/practices/2023/04/03/ADRCreation.html)、[MADR](https://adr.github.io/madr/) |
| 中文段落 | **50–200 字**，尽量不要超过 **250 字**；≤7 行 | [zh-style-guide](https://zh-style-guide.readthedocs.io/zh-cn/latest/%E6%96%87%E6%A1%A3%E7%BB%93%E6%9E%84%E6%A0%B7%E5%BC%8F/%E6%AE%B5%E8%90%BD.html) |
| 中文句子 | 标点间隔 **≤20 字最佳**，20–29 可接受，30–39 需语义明确，**≥40 不接受**；逗号长句总长 ≤100 字 | [中文技术文档写作规范](https://nageoffer.com/docs/convention/doc/tech/) |

### 2.2 Google Design Doc 的可迁移结构

原文列出的"事实上的清单"（[来源](https://www.industrialempathy.com/posts/design-docs-at-google/)）：

| 章节 | 关键约束（原文口径） |
|---|---|
| Context and scope | **不是需求文档**；只写客观背景事实；读者已有知识可假定，细节用链接；**保持简洁** |
| Goals and non-goals | 简短 bullet；**non-goals ≠ 否定式目标**（"系统不应该崩"不是 non-goal），而是"本是合理目标但被显式排除的" |
| The actual design | 先概览后细节；**这里是写 trade-off 的地方** |
| Alternatives considered | 列出被否方案与各自权衡；原文称这是**最重要的章节之一** |
| Cross-cutting concerns | 安全/隐私/可观测性；可由独立文档承接，正文**引用而不展开** |

**何时不写**：如果方案不 ambiguous（问题或解法都不复杂），写文档价值很低；如果文档变成 "implementation manual"（只说怎么做、不谈权衡与备选），不如直接写代码。

**长度控制的机制**（从原文抽取，不用数字也能用）：
- 超长 → 拆成多个可管理的子问题；
- 每个主题用"概览 + 细节"两层，细节可折叠；
- 独立主题（隐私/安全）用独立文档承接，主文档只放指针。

### 2.3 Amazon 的两条反向教训

- 六页备忘录**禁止 bullet**，因为完整句子才逼出因果链（"no bullet-point lists, no graphics, no fluff"）。
- **对照**：本工具的 spec/phase 是给模型执行的，恰恰相反——**该用 bullet/表格**，因为执行要的是可枚举的原子项。**结论：体裁决定形式。叙事型文档禁 bullet，执行型文档必须结构化。** 这是把 Amazon 经验迁到 AI 工作流时最容易搞反的一点。

---

## 3. ADR：极短决策文档（decision-log 的直接对标）

### 3.1 Nygard 模板（5 节，13 行）

```
# Title
## Status      — proposed / accepted / rejected / deprecated / superseded
## Context     — 我们看到的、促成这个决定或变更的问题是什么？
## Decision    — 我们提议/正在做的变更是什么？
## Consequences— 因为这个变更，什么变得更容易或更难做了？
```
（[原始模板](https://github.com/architecture-decision-record/architecture-decision-record/blob/main/locales/en/templates/decision-record-template-by-michael-nygard/index.md)）

注意 **Consequences 的问法是"更容易/更难做什么"**，而不是"优缺点"——它逼出**可观察的后果**，而不是形容词。

### 3.2 MADR：三级模板，按需取用

MADR 4.0 提供三种粒度（[MADR 官网](https://adr.github.io/madr/)）：

| 模板 | 内容 | 适用 |
|---|---|---|
| **minimal** | 3 节必填：Context and Problem Statement / Considered Options / Decision Outcome（+可选 Consequences） | 大多数决策 |
| **bare** | 全部章节，但无解释文字（空壳） | 熟手、工具生成 |
| **full** | 全部章节 + 每节填写指引 + 可选元数据（status/date/decision-makers/consulted/informed） | 新手、模板分发 |

**minimal 模板原文**（可直接抄，[raw](https://raw.githubusercontent.com/adr/madr/develop/template/adr-template-minimal.md)）：

```markdown
# {short title, representative of solved problem and found solution}
## Context and Problem Statement
{两到三句话，或用一个小故事；可以用问题形式表述；链接到 issue/board；明确决策范围。}
## Considered Options
* {title of option 1}
* {title of option 2}
## Decision Outcome
Chosen option: "{title of option 1}", because {justification}.
### Consequences
* Good, because {…}
* Bad, because {…}
```

两个可迁移的设计决策：
1. **Context 限"两到三句话"**——这是全模板唯一有硬数字的字段，说明 MADR 认为**背景是最容易膨胀的地方**。
2. **Considered Options 只列标题，Pros/Cons 是可选章节**——默认不展开，需要时才展开。

### 3.3 长度与好坏实践（含 11 个反模式）

一手来源：[How to create ADRs — and how not to](https://ozimmer.ch/practices/2023/04/03/ADRCreation.html)。

**长度口径（原文）**：
> "Watch the word count of an ADR as it evolves. Sometimes, one presentation slide with few sentences is enough to provide an AD executive summary. However, more wicked problems may require more elaborate decision rationale, up to a few pages."

**七条好实践**（原文归纳）：
1. 按**架构显著性与后果严重性**排序，只记录至少解决一条架构显著需求的决策；
2. 高影响决策不要为"灵活性"而拖延（代价难撤销的决策不能等到第 n 个 sprint）；
3. **优先记录元质量**（可观测性、可反应性）而非假定长期目标（可扩展性）；
4. 决策要**扎根于真实需求与经验**，不要 vendor bashing / 甩锅 / 讽刺；
5. **投资编辑质量与合适长度**（错别字、标点也算）；
6. 无简单答案时**分阶段决策**（短期妥协 + 中期方案 + 长期愿景，三条 justification 各带时间窗）；
7. **披露置信度**（可以存疑，评审者会尊重诚实）。

**ADR Author Pledge 七条**（可直接改写成 decision-log 的写作纪律）：按架构显著性排优先级；**选定一个模板并坚持**；**尺寸得当**；显式呈现 decision question / criteria / options / outcome / consequences(good and bad)；**每个 issue 至少考虑两个选项**；坦诚披露成熟度与置信度。

**11 个反模式**（原文列举，可直接做评审清单）：

| 反模式 | 含义 | 修法 |
|---|---|---|
| Fairy Tale / Wishful Thinking | 只有 pros 没有 cons；truism / tautology | 补代价 |
| Sales Pitch | 营销语言、夸张、形容词堆砌 | 每个形容词问"能否删/能否举证"；细节用超链接 |
| Free Lunch Coupon / Candy Bar | 不写后果，或只写无害后果（尤其长期后果） | 补"什么变难了" |
| Dummy Alternative | 造一个不可能成立的选项来衬托首选 | 列真实存在的备选 |
| Sprint / Rush | 只考虑一个选项、只谈短期 | 至少两个有效备选；补中长期后果 |
| Tunnel Vision | 只看局部（如只看 API 提供方，不看调用方；只看开发，不看运维） | 显式提到运维/维护者，补 manageability / evolvability 判据 |
| Maze | 跑题，讨论与本决策无关的细节 | 重构，把无关部分移到附录或 parking lot |
| Blueprint or Policy in Disguise | 写得像菜谱或法条，细节过多、语气命令式 | 改写成"活动日志"语气，缩短 |
| **Mega-ADR** | 把大量架构信息塞进多页 ADR，当文档主文档用 | 细节设计移到独立文档 |
| Novel / Epic | 把整份 SAD 塞进一份 ADR | 同上 |
| Magic Tricks | 假问题制造紧迫感、问题-方案错配、伪精确加权评分 | 删除并重写 |

### 3.4 迁移到 decision-log 的即时可抄规则

- **每条决策一个块，块内固定 5 字段**：`ID / Status / Context(≤3 句) / Decision(1 句 + 1 句理由) / Consequences(≥1 good, ≥1 bad)`；可选 `Confirmation`（怎么验证已落实）。
- **背景是最易膨胀字段** → 硬上限（沿用 MADR 的"2–3 句"）。
- **Options 默认只列标题**；Pros/Cons 仅在被质疑或高风险时展开。
- **正文不出现 JSON/大表**：机器可读的结构体移到独立文件，正文只留 ID + 一句话结论 + 指针（对应 §6.1 的"格式恒定"原则）。
- **元评论（"本表在调研前建立…"、"如与母 PRD 冲突…"）不进正文**：它既不是决策也不是事实，属于流程噪音；应移入专门的"流程备注"附录或直接删。

---

## 4. 渐进式披露（progressive disclosure）与 Diátaxis

### 4.1 机制

NN/g 的原始定义（[Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)）：

- 初始只展示**少量最重要的选项**；次级/专用选项只在用户索取时展示。
- 好处同时作用于新手（聚焦、少犯错）与专家（少扫无关项）；改善 learnability / efficiency / error rate 三项。
- **两条必须做对**：(a) 初始层与次级层的切分正确——频繁需要的必须在前；(b) **从主层到次层的路径必须显而易见**（机制简单 + 标签给人明确预期）。
- **超过 2 层普遍可用性差**；若需要 3 层以上，应该先考虑简化设计。

IBM 的技术内容设计指南也把 progressive disclosure 列为独立模式，并要求"每一层都按各自指南设计，并放在更大的信息架构中考量"（[IBM](https://www.ibm.com/docs/en/technical-content?topic=practices-progressive-disclosure)）。

### 4.2 Diátaxis 四象限

Diátaxis 把文档按**用户需求**分四类（[diataxis.fr](https://diataxis.fr/)）：

| 象限 | 服务需求 | 性质 |
|---|---|---|
| Tutorial（教程） | 学习 | 引导式、有步骤、保证成功 |
| How-to guide（操作指南） | 完成具体任务 | 目标导向、可跳过 |
| Reference（参考） | 查阅信息 | **准确、完整**、中立、结构化 |
| Explanation（解释） | 理解 | 允许离题、允许被丢弃 |

**关键性质**（[Diátaxis Quality](https://diataxis.fr/quality/)）：
- 功能性质量（accuracy / completeness / consistency / usefulness / precision）是**相互独立的**："文档可以准确但不完整，可以完整但不准确也不一致，可以准确完整一致但没用"——**这四者必须分别检查**。
- 功能性质量**可测量**（例如 completeness），深层质量只能**判断**。
- Diátaxis **不能提供**功能性质量，但能**暴露**功能性质量的缺口：例如"reference 的结构应反映代码结构"会让文档缺口变得可见。
- **把解释性文字从 tutorial 里搬出去，常常会暴露"读者被丢下自己想办法"的段落**——这是一个很有用的缺口探测手法，可直接迁移到 spec（把理由搬进 decision-log 后，spec 里"没有说明可执行动作"的地方会暴露）。

### 4.3 三层组织规则（概览 / 细节 / 附录）

| 层 | 内容 | 位置 | 长度约束 |
|---|---|---|---|
| L0 概览 | 是什么、给谁、边界、当前状态、下一步 | 文件头 20 行内 | ≤10 行 |
| L1 主体 | 每条决策/需求/工作包，**同处（co-located）**的定义+规则+例外 | 正文 | 每单元 ≤15 行 |
| L2 细节 | 长表、原始证据、完整 schema、历史 | 附录或独立文件，正文留指针 | 不设上限 |

**从 L1 下沉到 L2 的判定**（写进规则让模型可判）：
- 只有**部分读者/分支**需要 → 下沉（Diátaxis 的 reference/explanation 分界）；
- **每个分支都需要** → 留在 L1；
- 属于"为什么"（理由、权衡、历史）→ 下沉到 decision-log 或附录；
- 属于"做什么、做到什么算完" → 必须留在 L1。

### 4.4 映射到三类文档

| Diátaxis 象限 | 在本工具中的落点 | 不该放什么 |
|---|---|---|
| Tutorial | （不需要） | — |
| How-to | phase 文档（工作包差异、执行步骤） | 架构理由、备选方案讨论 |
| Reference | spec 的契约段（字段、接口、验收命令、测试标准） | 叙事性铺垫、营销式目标陈述 |
| Explanation | decision-log（决策与方向、权衡、被否方案） | 可执行步骤（应指到 phase） |

**这条映射本身就是"防重叠"的机制**：同一信息只允许出现在它所属的象限；出现在别处就必须是**指针**而不是副本。

---

## 5. 「无遗漏」的保障机制

### 5.1 五类机制与各自覆盖的遗漏类型

| 机制 | 防的遗漏 | 成本 |
|---|---|---|
| 模板必填项（required fields） | 忘了写某类字段 | 极低，可脚本校验 |
| 质量属性清单（INCOSE / ISO 29148 / NASA） | 字段写了但不合格 | 低，可做评审清单 |
| 覆盖矩阵 / 可追溯矩阵 | 有需求没测试、有测试没需求 | 中，可脚本生成 |
| 评审清单（review checklist） | 人/模型漏看 | 低 |
| 显式 TBD/TBR 台账 | 把"没写"伪装成"写完了" | 低 |

### 5.2 需求质量属性（可作 spec 的字段级验收）

**ISO/IEC/IEEE 29148** 定义了"好需求"的构造、属性与特征，是需求工程的标准口径（[ISO](https://www.iso.org/obp/ui/#iso:std:iso-iec-ieee:29148:ed-2:v1:en)、[IEEE SA](https://standards.ieee.org/standard/29148-2018.html)）；其前身 **IEEE 830-1998** 描述了好 SRS 的**内容与质量**并给出多种 SRS 大纲（[IEEE SA](https://standards.ieee.org/standard/830-1998.html)）。

**NASA 的同类清单**（[Appendix C](https://www.nasa.gov/reference/appendix-c-how-to-write-a-good-requirement/)）更细、可直接抄。其验证清单的八组检查项：

- **Clarity**：清晰无歧义；**没有不定代词（this / these）与模糊词（as appropriate, etc., and/or, but not limited to）**；简洁；**一条需求只表达一个想法**；**一个主语一个谓语**。
- **Completeness**：尽可能完整；**未完成的部分登记为 TBD/TBR 并维护完整清单**；检查是否漏掉这些领域：functional, performance, interface, environment（开发/制造/测试/运输/存储/运行）, facility, transportation, training, personnel, operability, safety, security, appearance/physical characteristics, design；**所有假设必须显式**。
- **Compliance**：层级正确（system/segment/element/subsystem）；**不含实现细节**（只说什么，不说怎么做）；不含操作描述；不含人员/任务分配。
- **Consistency**：不自相矛盾、与相关系统不矛盾；术语一致（与项目词表一致，关键术语进 glossary）。
- **Traceability**：每条需求都有必要（"如果去掉它，最坏会发生什么？"）；**双向可追溯**到上层需求/目标/约束；**每条可被唯一引用（唯一编号）**。
- **Correctness**：需求正确、假设正确、技术可行。
- **Functionality / Performance / Interfaces / Maintainability / Reliability**：功能必要且**合起来充分**；性能含容差且现实；内外接口清晰必要充分一致；可维护性**可测量可验证**；可靠性可测量可验证，含错误检测/上报/处理/恢复需求与不希望事件的响应。
- **Verifiability / Testability**：能否通过测试/演示/检查/分析证明满足？在需求所在层级能否验证？**是否含不可验证词汇**——NASA 直接列了黑名单：`flexible, easy, sufficient, safe, ad hoc, adequate, accommodate, user-friendly, usable, when required, if required, appropriate, fast, portable, light-weight, small, large, maximize, minimize, robust, quickly, easily, clearly` 以及**其他 `-ly` 词、其他 `-ize` 词**。
- **Data Usage**：don't-care 条件是否真的 don't-care，且是否显式。

**编辑清单**（同源，可做格式检查）：
- 使用正确术语：**Shall = 需求；Will = 事实或目的声明；Should = 目标**；
- 人员需求句式 `responsible party shall perform …`（主动语态）；产品需求句式 `product ABC shall XYZ`；
- 一致术语；**定性/性能值必须带容差**（小于/大于等于/±/3σ RSS）；
- **无实现**（说 what 不说 how；问"你为什么需要这条需求"，答案常指向真正的需求）；
- **无操作描述**（"操作员 shall…"几乎总是操作陈述，不是需求）。

**通用良好性清单**：语法正确；无错别字/拼写/标点错误；符合项目模板与风格；**用肯定句**（避免 "shall not"）；TBD 最小化——**宁可给最佳估计并标 TBR**，且 TBR 必须带理由 + 消除动作 + 责任人 + 时限；**需求必须伴随可理解的 rationale 与假设**；放在正确章节（不塞附录）。

### 5.3 覆盖矩阵 / 可追溯矩阵

需求可追溯矩阵（RTM）是"把需求与其他工件（测试、issue、源码）关联起来的结构化信息工件"，用于双向追溯与变更影响分析（[Perforce](https://www.perforce.com/resources/alm/requirements-traceability-matrix)、[Jama](https://www.jamasoftware.com/requirements-management-guide/requirements-traceability/requirements-traceability-matrix-pros-and-cons/)）。

**最小可用形态**（一行一条需求，可脚本校验）：

| R-ID | 需求一句话 | 验收判据（可执行） | 测试/证据 ID | phase | 状态 |
|---|---|---|---|---|---|
| R-001 | … | `npm run x` 退出码 0 | T-001 | P1 | covered / TBR |

三条硬规则：
1. **每一行必须有非空验收判据**（否则违反 NASA 的 verifiability）；
2. **每个 phase 必须至少映射一条 R-ID**，每个 R-ID 必须至少映射一个 phase（双向无孤儿）；
3. **状态只能是 covered / TBR / deferred**，其中 deferred **必须写 reason + 触发条件**。

### 5.4 显式省略：TBD / TBR / non-goals / deferred

这是"精炼但不遗漏"的枢纽机制。四者语义不同，不能混用：

| 标记 | 含义 | 必带字段 |
|---|---|---|
| **non-goal** | 本可以是目标，但被显式排除 | 排除理由（一句话） |
| **deferred** | 现在不做，将来可能做 | 触发条件（什么情况下重开） |
| **TBD** | 值待定（尽量避免） | 谁定、何时定 |
| **TBR** | 用最佳估计先占位，待解决 | 理由 + 消除动作 + 责任人 + 时限 |

来源：non-goals 的定义见 [Google Design Docs](https://www.industrialempathy.com/posts/design-docs-at-google/)；TBD/TBR 的字段要求见 [NASA Appendix C](https://www.nasa.gov/reference/appendix-c-how-to-write-a-good-requirement/)。

**判定规则**：文档里出现"暂时不写""详见后续"但**没有**上述四种标记之一 → 判为**遗漏**，不是精炼。

### 5.5 评审清单

ADR 评审有官方姊妹篇与 prompt 模板（[ADR review](https://ozimmer.ch/practices/2023/04/05/ADRReview.html)、[Zenodo ADR review prompt](https://zenodo.org/records/20830043)）；Google 的代码审查清单（Design / Functionality / Complexity / Tests / Naming / Comments / Style / Consistency / Documentation / Every Line / Context / Good Things）是同构模板，其中两条对计划类文档尤其适用（[What to look for](https://google.github.io/eng-practices/review/reviewer/looking-for.html)）：
- **Complexity**：警惕 over-engineering——只解决现在确知要解决的问题；
- **Good Things**：明确要求指出做得好的地方。

**评审清单的最小集**（综合上述，可 5 分钟过一遍一份 spec/phase）：
1. 每条需求/决策是否**唯一编号**、**单一主张**、**无不可验证词**？
2. 每条需求是否有**可执行验收判据**？
3. 是否存在"两个权威"（同一事实在两处且措辞不同）？
4. 是否有 R-ID ↔ phase 的**孤儿**？
5. 所有省略是否用 non-goal/deferred/TBD/TBR 标记？
6. 假设是否显式？
7. 是否有段落超过字数上限、句子超过字数上限？
8. 是否复述了环境（目录树、脚本清单）？

---

## 6. 面向 LLM 的文档优化

### 6.1 格式对准确率的影响（实证）

**Microsoft/MIT 的 prompt format 研究**（[arXiv:2411.10541](https://arxiv.org/html/2411.10541v1/)）：
- 同一内容格式化为 plain text / Markdown / JSON / YAML，**GPT-3.5 在代码翻译任务上最好与最差格式差约 40%**；某数据集上 Markdown→plain text 提升 200%。
- **GPT-4 系列明显更鲁棒**（CMD ≤0.036，GPT-3.5 高达 0.176）。
- **不存在通用最优格式**：GPT-3.5 偏好 JSON，GPT-4 偏好 Markdown；跨模型最优格式的 IoU < 0.2。
- 一致性也低：GPT-3.5 在 MMLU 上 Markdown 与 JSON 之间只有 **16% 的答案完全一致**。

**对本任务的直接结论**：
1. **格式选择对弱模型的影响 > 对强模型**（因为强模型更鲁棒）。既然 build-code/verify-code 用弱模型，**spec/phase 的格式必须固定且简单**。
2. **不存在"最优格式"，只有"恒定格式"**——既然无法为每个模型调优，那么**同一文档类型永远用同一套字段与结构**，让弱模型每份文件都走同一解析路径。
3. 相关但不同的证据：LLM 对**细粒度格式扰动**（分隔符、大小写、冒号个数）也敏感（[Sclar et al. 2023](https://arxiv.org/abs/2310.11324)）。

### 6.2 上下文文件实验：写多了会变差

**ETH Zurich《Evaluating AGENTS.md》**（[arXiv:2602.11988](https://arxiv.org/html/2602.11988v1/)），138 个真实任务 × 4 个 agent：

| 设置 | 成功率 | 步数 | 成本 |
|---|---|---|---|
| 无上下文文件 | 基线 | 基线 | 基线 |
| **LLM 生成**的上下文文件 | **−3%（SWE-bench Lite −0.5%，AGENTbench −2%）** | **+2.45 / +3.92 步** | **+20% / +23%** |
| **开发者手写**的上下文文件 | **+4%** | +3.34 步 | 最多 +19% |

其他可直接抄的结论：
- **根因是"上下文文件里多余的 requirements 让任务变难"**（原文："unnecessary requirements from context files make tasks harder"）；证据是 reasoning token 增加 22%/14%。
- **上下文文件并没有起到有效的仓库概览作用**：它没有减少 agent 找到相关文件所需的步数。
- **指令一定被遵循**：提到 `uv` 时使用率 1.6 次/任务，未提到时 <0.01 次。→ **写进去的要求一定会被执行，所以"多余要求"的代价是实打实的。**
- **把仓库里的 `.md`/`docs/` 全部删掉后**，LLM 生成的上下文文件反而**提升 2.7%**——说明它的价值主要来自"替代缺失的文档"，而不是"补充已有文档"。→ **重复既有文档 = 纯成本。**
- 研究者建议：**只包含最小必要要求**（例如"本仓库用哪个工具"），并建议暂时不要用 LLM 自动生成的上下文文件。

### 6.3 长上下文的位置效应

**Lost in the Middle**（[Liu et al. 2023/2024](https://arxiv.org/abs/2307.03172)）：模型对上下文**开头与结尾**的信息利用最好，**中部显著变差**（U 形）。工程结论：
- 关键结论、验收判据、禁止事项 → **放文件头部或尾部**；
- 长文档必须分节，且每节都要有"本节结论"首句；
- 不要把关键约束埋在文档正中间。

### 6.4 表格 vs 散文

- 结构化表格对 LLM 仍是难点：不同表格的结构与格式定义方式各异，tabular data 与自然语言之间存在 gap（[Table Meets LLM, WSDM'24](https://arxiv.org/html/2305.13062v4)）。
- **对本任务的实践口径**：
  - **约束/映射/矩阵类**（R-ID ↔ test ↔ phase）→ 表格（列少、列名固定、一行一事实）；
  - **因果/理由类**（为什么选 A 不选 B）→ 散文短句（表格会压掉因果链）；
  - **不要**把大段散文塞进表格单元格；**不要**用表格承载"需要读者理解推理"的内容。

### 6.5 面向 agent 的写作杠杆（工程化清单）

来自本地技能 [writing-for-agents](/Users/Hugh/.agents/skills/writing-for-agents)（agent 文档写作参考，与上述实证结论方向一致）：

| 杠杆 | 规则 |
|---|---|
| **context pointer（指针）** | 常驻上下文里只放"名称 + 触发分支"；材料放外部文件，指针的**措辞**决定模型何时去读它。措辞太弱 = 变异性 bug。 |
| **两种负载** | context load（常驻上下文的每轮成本）vs cognitive load（人要知道有哪些文档）。材料越往下沉，越省 context load，越贵 cognitive load。 |
| **信息层级** | 1) 文件内步骤 → 2) 文件内参考 → 3) 披露出去的参考（指针）。**每个分支都要用的内联，只有部分分支用的下沉。** |
| **completion criterion（完成判据）** | 每一步都要有"怎么算做完"；判据要**可检查 + 穷尽**。"每个修改过的 model 都有交代"比"产出一份变更清单"要求更强。 |
| **leading word（领头词）** | 用一个预训练里已有的紧凑概念（`tight`、`red`、`fog of war`）锚定一整片行为，比用一句话描述更省 token 且更稳。 |
| **pruning** | 单一事实源；环境本身就是事实源，复述它就是 cache；逐句检查 no-op；警惕 **sediment**（旧层沉积）。 |
| **negation 反模式** | 用禁令引导会把被禁行为拉进上下文（"不要想大象"）。**尽量正面表述目标行为**；禁令只作无法正面表述的硬护栏。 |

**组合成弱模型可执行的 phase 步骤模板**（综合本节）：

```markdown
### P1-03 <动作名>            <!-- 领头词优先，动词开头 -->
- 读：`spec.md#R-014`、`src/x.ts`        <!-- 指针，不复制内容 -->
- 改：`src/x.ts`（仅 X 类改动）           <!-- 精确路径 + 边界 -->
- 判据：`npm run t -- x.test.ts` 退出码 0  <!-- 可执行的完成判据 -->
- 不许：改动接口签名                       <!-- 最小护栏，尽量正面表述 -->
- 验收映射：R-014                          <!-- 无孤儿 -->
```

---

## 7. 反模式清单（症状 → 检测 → 修法）

综合 ADR 反模式（[来源](https://ozimmer.ch/practices/2023/04/03/ADRCreation.html)）、中文规范（[来源](https://nageoffer.com/docs/convention/doc/tech/)）、AGENTS.md 实验（[来源](https://arxiv.org/html/2602.11988v1/)）与写作杠杆（[技能](/Users/Hugh/.agents/skills/writing-for-agents)）：

| # | 反模式 | 症状（可检测） | 修法 |
|---|---|---|---|
| 1 | **双权威（duplication）** | 同一事实在两处，措辞不同 | 保留一处，另一处改为指针 |
| 2 | **环境缓存** | 正文出现目录树、脚本清单、依赖版本 | 删除，改为"现场读取"指令 |
| 3 | **摘要膨胀** | 文件头概览 >10 行，且与正文重复 | 概览只留"是什么/边界/下一步" |
| 4 | **Mega-ADR / Novel** | 单条决策块超过 1 页，或塞了完整架构 | 细节移出，正文只留 5 字段 |
| 5 | **Blueprint / Policy in Disguise** | 命令式语气 + 过多细节，读起来像菜谱 | 改为事实陈述（"选择 X，因为…"） |
| 6 | **Fairy Tale** | 只有好处没有代价 | 强制 ≥1 条 Bad consequence |
| 7 | **Free Lunch** | 无 consequences，或只有无害后果 | 补"什么变难了"，尤其长期后果 |
| 8 | **Dummy Alternative** | 备选明显不可行 | 列真实备选 |
| 9 | **Sprint / Rush** | 只有一个选项；只谈近期 | ≥2 个有效备选 + 中长期后果 |
| 10 | **Tunnel Vision** | 只看开发不看运维/维护 | 补 manageability / evolvability 判据 |
| 11 | **Maze** | 段落主题与本节标题不匹配 | 移到附录或删除 |
| 12 | **Sales Pitch** | 形容词/副词密度高，无可举证 | 每个形容词过堂 |
| 13 | **Pseudo-accuracy** | 无意义的加权评分（`4×vendor_independence + …`） | 删除，改为定性判断 + 置信度 |
| 14 | **一逗到底 / 长句** | 单句 >40 字；逗号长句 >100 字 | 断句，补代词衔接 |
| 15 | **多中心段落** | 一段有多个主题；段落 >250 字 | 一段一主题，中心句前置 |
| 16 | **不可验证词汇** | 出现 fast / robust / user-friendly / 尽量 / 合理 / 适当 | 换成可测量判据（NASA 黑名单） |
| 17 | **否定式引导** | 大量"不要/不得/禁止" | 改写成目标行为（正面表述） |
| 18 | **未标记省略** | "暂不展开""见后续"但无 non-goal/deferred/TBD/TBR | 补标记与字段 |
| 19 | **指代不明** | 大量"其/该/此/这"且找不到先行词 | 写出具体名词 |
| 20 | **流程元评论** | 正文出现"本表在调研前建立""如与母任务冲突则…" | 移入流程附录或删除 |
| 21 | **假精确** | 用 % 或分数描述无法测量的东西 | 定性 + 置信度 |
| 22 | **Sediment（沉积）** | 历史层叠加，无人敢删 | 按 relevance 逐行判定，删过期层 |

---

## 8. 可读性度量

### 8.1 英文公式及其失效

| 公式 | 计算什么 | 输出 |
|---|---|---|
| Flesch Reading Ease | 平均句长 + 平均音节/词，长词权重更高 | 0–100 |
| Flesch-Kincaid | 同上，长句权重更高 | 年级水平 |
| SMOG | ≥3 音节词的百分比（需 ≥30 句） | 年级水平 |
| Gunning Fog | 平均句长 + 长词百分比 | 年级水平 |
| Dale-Chall | 平均句长 + 词是否在"四年级已知词表"上 | 年级水平 |

（[Effortmark](https://www.effortmark.co.uk/readability-formulas-seven-reasons-to-avoid-them-and-what-to-do-instead/)）

**七个不应采用的理由**（原文）：不可靠（不同公式/不同程序给出不同分）；不有效（readability ≠ legibility ≠ 理解）；不考虑词义（`wave`/`waive` 同分）；年级水平对成人无意义；假设被测对象是连续段落（表单/列表/图片页无法评分）；**为提分改写会损害连贯性**（Duffy & Kabance 实验：句子变短 + 词变简单后，分数降了 6 个年级，但**理解度没有提升**，因为改后失去了 cohesion）；高分不代表有用。

### 8.2 中文的替代

- **中文可读性测量起步晚**：现有研究多聚焦英文公式，汉语研究"尚处于起步阶段"，且多用词汇/句法表层特征（[AlphaReadabilityChinese](https://www.researchgate.net/publication/379452433_AlphaReadabilityChinese_A_tool_for_the_measurement_of_readability_in_Chinese_texts_and_its_applications_AlphaReadabilityChinesehanyuwenbenkeduxinggongjukaifayuyingyong)，含词汇/句法/语义三维共 9 个指标）。
- **因此中文场景不应用英文公式（其音节/词表假设不成立）**，而应用**结构硬上限**。

### 8.3 推荐替代：可检查的硬上限

| 指标 | 阈值 | 来源 |
|---|---|---|
| 句子（标点间） | ≤20 字最佳；20–29 可接受；30–39 需语义明确；**≥40 不接受** | [中文技术文档写作规范](https://nageoffer.com/docs/convention/doc/tech/) |
| 逗号长句总长 | ≤100 字 或 正文 3 行 | 同上 |
| 句子（zh-style-guide） | ≤100 字 | [zh-style-guide 句子](https://zh-style-guide.readthedocs.io/zh-cn/latest/%E6%96%87%E6%A1%A3%E7%BB%93%E6%9E%84%E6%A0%B7%E5%BC%8F/%E5%8F%A5%E5%AD%90.html) |
| 段落长度 | 50–200 字，尽量 ≤250 字 | [zh-style-guide 段落](https://zh-style-guide.readthedocs.io/zh-cn/latest/%E6%96%87%E6%A1%A3%E7%BB%93%E6%9E%84%E6%A0%B7%E5%BC%8F/%E6%AE%B5%E8%90%BD.html) |
| 段落行数 | ≤7 行（ruanyf 口径：≤4 行为最佳） | [中文技术文档写作规范](https://nageoffer.com/docs/convention/doc/tech/) |
| 标题层级 | ≤4 级；一级标题下不得直接出现三级；避免孤立编号；下级不重复上级名 | 同上 |
| 决策块 | ≤15 行（MADR minimal 等价体） | 由 §3.2 推导 |
| 单文件概览段 | ≤10 行 | §4.3 |

**这些是可以写成脚本的**（按标点切句、统计字数、统计标题层级、检查孤立标题），比可读性公式更可靠，且不依赖语言假设。

---

## 9. 可直接抄用的规则清单

### 9.1 通用 12 条（三类文档都适用）

1. **一个文件一个权威**：同一事实只在一处定义；其他地方只放指针（ID + 一句话）。发现两处不同措辞 = 缺陷。
2. **每单元固定字段**：同一文档类型的每个块用同一套字段名与顺序；缺字段要显式写 `N/A + 理由`，不能省略。
3. **说不出来就当没写**：每条需求/决策/步骤必须有**可执行的验收判据**（命令、断言、可观察状态）。
4. **禁止不可验证词**：`尽量/合理/适当/快速/友好/健壮/flexible/robust/easy/sufficient` 等一律替换或删除。
5. **省略必须标记**：只用 `non-goal（含理由）/ deferred（含触发条件）/ TBD（谁何时定）/ TBR（理由+消除动作+责任人+时限）` 四种。
6. **删掉后结论不变 → 删**（Redundancy 判定）；删掉后行为不变 → 删（no-op 判定）。
7. **不缓存环境**：目录树、脚本清单、依赖版本不进文档；改为"读 X 文件"。
8. **句 ≤20 字（硬上限 40）**，**段 ≤200 字（硬上限 250）**，一段一主题，中心句前置。
9. **关键信息靠前靠后**：约束与判据放文件头/节首；附录放尾部；不埋中间。
10. **正面表述**：写"要做 X"而不是"不要做 Y"；禁令只留无法正面化的硬护栏（且必须与正面目标同时出现）。
11. **每节一个"结论句"**：首句给出该节结论，细节在后。
12. **定稿删一遍**：通读全文，删除对表达没有作用的字、词、句，并同步检查是否有信息因此丢失（丢失则补标记，不补字数）。

### 9.2 decision-log 专用

1. 每条决策一个块，固定字段：`ID / Status / Context(≤3 句) / Decision(1 句结论 + 1 句理由) / Consequences(≥1 good + ≥1 bad) / Confirmation(可选)`。
2. **每条决策 ≤15 行**；超过就把细节移到附录并留指针。
3. **只记录至少解决一条"架构显著需求"的决策**，按后果严重性排序。
4. **≥2 个真实备选**；备选默认只列标题，Pros/Cons 仅在高风险时展开。
5. **每条决策必须可被唯一引用**（ID），且被 spec/phase 引用时**只引用 ID，不复述内容**。
6. 禁止：只有好处没代价、假备选、加权伪精确评分、营销形容词。
7. 机器可读的结构体（JSON）**不进正文**：移入独立文件，正文只留 ID + 结论句 + 指针。
8. 流程元评论（"本表在何时建立""如冲突则…"）移入专门的流程附录或删除。

### 9.3 spec 专用

1. 结构按 Diátaxis 的 **Reference** 组织：按被实现物的结构来组织章节，让缺口可见。
2. **全局 ≤1–3 页（增量任务）**；超出则拆分主题或把细节下沉附录。
3. 每个需求一行，字段固定：`R-ID / 一句话需求（单主语单谓语）/ 验收判据（可执行）/ 覆盖 phase / 状态(covered|TBR|deferred)`。
4. **禁止实现细节**：写 what，不写 how；写 how 的部分属于 phase。
5. **禁止操作描述与人员/任务分配**（属于 phase / SOW）。
6. **性能/定性值必须带容差**（≤/≥/±）。
7. **每条需求要有 rationale 与假设**（假设显式化）。
8. 双向可追溯：每个 R-ID 至少一个 phase；每个 phase 至少一个 R-ID；**孤儿 = 缺陷**。
9. **接口/schema 只复制"本条需求需要的那几行"**，其余引用路径。
10. non-goals 单独一节，且写"为什么不是目标"。

### 9.4 phase 专用

1. **只写差异**：引用 spec 的 R-ID，不重述背景、理由、架构。
2. **每个 phase ≤1 页**；每个步骤 ≤6 行。
3. 步骤固定字段：`读（指针）/ 改（精确路径 + 边界）/ 判据（可执行命令 + 期望结果）/ 不许（最小护栏）/ 验收映射（R-ID）`。
4. **完成判据必须可检查且穷尽**：写"每个 X 都有对应测试"而不是"加上测试"。
5. **每个步骤的判据不得依赖上一个步骤的隐含状态**（弱模型会丢上下文）。
6. 需要长表（映射矩阵、字段清单）时放附录，正文留指针。
7. 禁止在 phase 里出现"为什么"的长篇解释（引到 decision-log 的 ID）。
8. 格式恒定：**同一 phase 文件永远同一套字段与顺序**（依据 §6.1 的格式敏感性）。

### 9.5 可脚本化的检查（把规则变成门禁以外的事实）

| 检查 | 实现 | 不算通过不算失败？ |
|---|---|---|
| 句长 >40 字计数 | 按 `。！？；` 切句，去标点计字数 | 事实，记录 |
| 段落 >250 字计数 | 按空行切段 | 事实，记录 |
| 标题层级 >4 或跳过层级 | 解析 `#` 前缀 | 事实，记录 |
| 不可验证词命中 | 关键词表（NASA 黑名单 + 中文对应词） | 事实，记录 |
| R-ID 孤儿 | 提取 R-ID 集合与 phase 引用集合，求差 | 事实，记录 |
| 重复事实（近似重复句） | 句级相似度 > 阈值 | 事实，记录 |
| 决策块行数 >15 | 按标题切块计数 | 事实，记录 |

（与项目宪法一致：这些是**事实证据**，不是推进许可证。）

---

## 10. 来源清单

**风格指南 / 写作规范**
- Strunk & White 第 17 条：<https://needlesswords.com/2020/09/02/on-omitting-needless-words/>
- Google developer documentation style guide — Highlights：<https://developers.google.com/style/highlights>；Word list：<https://developers.google.com/style/word-list>；Write for a global audience：<https://developers.google.com/style/translation>
- Microsoft Writing Style Guide：<https://learn.microsoft.com/en-us/style-guide/welcome/>
- 中文技术文档写作规范（阮一峰 document-style-guide 转载）：<https://nageoffer.com/docs/convention/doc/tech/>；原仓：<https://github.com/ruanyf/document-style-guide>
- 中文技术文档写作风格指南：<https://zh-style-guide.readthedocs.io/zh-cn/latest/>
- Plain language guidelines：<https://plainlanguage.gov/guidelines/audience/>

**长度与结构**
- Design Docs at Google：<https://www.industrialempathy.com/posts/design-docs-at-google/>
- Amazon 六页备忘录解剖：<https://writingcooperative.com/the-anatomy-of-an-amazon-6-pager-fc79f31a41c9>；CNBC 报道：<https://www.cnbc.com/2018/04/23/what-jeff-bezos-learned-from-requiring-6-page-memos-at-amazon.html>
- Working Backwards PR/FAQ：<https://workingbackwards.com/resources/working-backwards-pr-faq/>；Product School PRFAQ 模板：<https://productschool.com/blog/product-fundamentals/prfaq>

**ADR**
- Nygard 模板：<https://github.com/architecture-decision-record/architecture-decision-record/blob/main/locales/en/templates/decision-record-template-by-michael-nygard/index.md>
- MADR 官网：<https://adr.github.io/madr/>；MADR minimal 模板 raw：<https://raw.githubusercontent.com/adr/madr/develop/template/adr-template-minimal.md>
- AD 实践与反模式索引：<https://adr.github.io/ad-practices/>
- How to create ADRs — and how not to：<https://ozimmer.ch/practices/2023/04/03/ADRCreation.html>；评审篇：<https://ozimmer.ch/practices/2023/04/05/ADRReview.html>

**渐进式披露 / Diátaxis**
- NN/g Progressive Disclosure：<https://www.nngroup.com/articles/progressive-disclosure/>
- IBM progressive disclosure：<https://www.ibm.com/docs/en/technical-content?topic=practices-progressive-disclosure>
- Diátaxis：<https://diataxis.fr/>；Quality：<https://diataxis.fr/quality/>

**需求质量与「无遗漏」**
- ISO/IEC/IEEE 29148:2018：<https://www.iso.org/obp/ui/#iso:std:iso-iec-ieee:29148:ed-2:v1:en>；IEEE SA 页：<https://standards.ieee.org/standard/29148-2018.html>
- IEEE 830-1998：<https://standards.ieee.org/standard/830-1998.html>
- NASA SEH Appendix C — How to Write a Good Requirement：<https://www.nasa.gov/reference/appendix-c-how-to-write-a-good-requirement/>；Requirements Verification Matrix：<https://www.nasa.gov/seh/appendix-d_requirements-verification-matrix>
- INCOSE Guide to Writing Requirements V4（summary sheet）：<https://www.incose.org/docs/default-source/working-groups/requirements-wg/guidetowritingrequirements/incose_rwg_gtwr_v4_summary_sheet.pdf>
- Requirements Traceability Matrix：<https://www.perforce.com/resources/alm/requirements-traceability-matrix>；<https://www.jamasoftware.com/requirements-management-guide/requirements-traceability/requirements-traceability-matrix-pros-and-cons/>

**信息密度 / 可读性**
- Information Density Principle for MLLM Benchmarks：<https://arxiv.org/html/2503.10079v1>
- Uniform Information Density（Jaeger 2010）：<https://pmc.ncbi.nlm.nih.gov/articles/PMC2896231/>
- Information density 通用定义：<https://therankcollective.com/glossary/information-density>；<https://medium.com/sarah-cordivano/better-communication-high-information-density-662fe8bfa8d6>
- Readability formulas: seven reasons to avoid them：<https://www.effortmark.co.uk/readability-formulas-seven-reasons-to-avoid-them-and-what-to-do-instead/>
- AlphaReadabilityChinese：<https://www.researchgate.net/publication/379452433_AlphaReadabilityChinese_A_tool_for_the_measurement_of_readability_in_Chinese_texts_and_its_applications_AlphaReadabilityChinesehanyuwenbenkeduxinggongjukaifayuyingyong>

**面向 LLM 的文档**
- Does Prompt Formatting Have Any Impact on LLM Performance?：<https://arxiv.org/html/2411.10541v1/>
- Quantifying LMs' sensitivity to spurious features in prompt design（Sclar et al.）：<https://arxiv.org/abs/2310.11324>
- Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?：<https://arxiv.org/html/2602.11988v1/>（benchmark 代码：<https://github.com/eth-sri/agentbench>）
- Lost in the Middle：<https://arxiv.org/abs/2307.03172>
- Table Meets LLM：<https://arxiv.org/html/2305.13062v4>
- 本地技能：writing-for-agents（`/Users/Hugh/.agents/skills/writing-for-agents`）
