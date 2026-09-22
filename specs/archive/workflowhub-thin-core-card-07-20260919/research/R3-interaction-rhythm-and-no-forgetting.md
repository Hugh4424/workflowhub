# R3 交互节奏与防遗忘 — 外部调研

> **调研范围**：多轮问答流程如何在「有顺序、有节奏」与「参与者不丢线索」之间取得平衡。本文只汇总外部证据与实践形态，不含对 CARD-07 的设计建议、排序或推荐。
>
> **证据强度标注**：`strong` = 同行评审实验/系统综述/规范原文；`medium` = 权威实践准则、单一案例研究、观察性研究；`weak` = 实践者博客/厂商文档/无数据断言。
>
> **工具与证据边界（诚实声明）**：本次调研期间，通用网页搜索引擎（Brave / DuckDuckGo / Startpage / Mojeek / Ecosia / Yandex / Google / 所有试过的 searx 实例）全部返回 CAPTCHA 或 429；AnySearch 系工具（`web_search` / `web_fetch` / `academic.search`）的每日免费额度在会话开始时即已耗尽；OpenAlex 免费 IP 额度在中途耗尽。出版商正文页（ScienceDirect、ACM DL、IEEE Xplore、Springer、SAGE、Wiley、BMJ、PNAS、NEJM、BMC、DOAJ、HAL、Wayback Machine、ResearchGate）全面被 403 / Cloudflare / Anubis 拦截。实际可用的通道为：**Crossref REST API、Semantic Scholar Graph API（约 14 秒间隔）、Europe PMC REST API、Unpaywall、arXiv `abs` 页、Wikipedia API、Hacker News Algolia**，以及**直接 curl 抓取可公开访问的一手原文页面**（NN/g、cognitect.com、adr.github.io、martinfowler.com、gdpr-info.eu、PLoS Medicine、psychclassics 授权镜像、prisma-statement.org、IHI、nature.com、sas.upenn.edu 等）。
>
> 因此本文的证据基础偏向「能抓到原文的一手来源」。**本文引用的每一个 DOI 均已通过 Crossref API 逐条验证可解析**（共验证 130+ 条，其中修正了 2 处错误 DOI，见 §9）。凡未能取得原文的条目，一律在文中或第 9 节标为「仅核实题录」，**未做推测填充**。部分缺口是工具封锁所致，不等于文献不存在——具体清单见附录 B。

---

## 0. 结论速览（12 条）

1. **「一轮放几件事」有直接实验数据**：矩阵式题目的行数由 5 → 10 → 20 递增时，**流失率与自评难度单调上升**；两轮研究（N=2,492 / N=2,570）综合最优为约 5 行 × 5 列。— `strong`（Grady, Greenspan & Liu 2018, *Social Science Computer Review*）
2. **同屏题数越多，项目无回答越多，但作答越快、版面评价越差**：同屏 1 / 4 / 10 / 40 题的实验中，非回答率随同屏题数上升。— `strong`（Toepoel, Das & van Soest 2009, *Field Methods*）
3. **逐题对话式 vs 批量表格式有正面对照**：chatbot 逐题交互相比 web 批量问卷，受访者更倾向给出**有区分度的回答、更少 satisficing**，数据质量更高。— `strong`（Kim, Lee, Gweon et al. 2019, CHI）
4. **总量层面：长度与应答率负相关，但这个证据被作者本人强限定；且元分析显示最强因子不是长度**。Rolstad et al. 2011（32 篇报告、20 篇纳入）发现总体关联（P ≤ 0.0001），但同质性检验 P = 0.03，作者明确表示「内容与长度无法分离」，建议**按内容而非长度**决策。行为基线：1,963 名受试者中约 **10% 几乎立刻流失**，此后**每 100 道题再流失约 2%**。反证：网络调查响应率的元分析中，最强预测因子是**联系次数、个性化联系与预联系**，不是长度。— `strong` / `medium-strong`（Rolstad et al. 2011；Hoerger 2010；Cook, Heath & Thompson 2000）
5. **议程与会议质量正相关，但只是横断自评相关**：18 项会议设计特征中 9 项显著预测会议质量，其中包括**议程使用**；n=367，48 小时内回忆最近一次会议。— `medium-strong`（Cohen, Rogelberg, Allen & Luong 2011, *Group Dynamics*）
6. **议程/结构先行有明确的实验反证：设计固着（design fixation）**。先给例子或既有结构会显著提高产出对既有属性的重复度，并**可观察到对想法质量的负面影响**。— `strong`（Jansson & Smith 1991，被引 994；Cardoso & Badke-Schaub 2011 有对照组实验）
7. **「目标先行」不必然增加发散量**：价值导向思维（先明确目标再生成方案）组产生**更少**的想法，但想法的**创造性与创新性评分更高**。— `medium`（Selart & Johansen 2011, *Creativity and Innovation Management*）
8. **决策台账最成熟的规范形态是 ADR 的 status / superseded 生命周期 + 单调编号 + 旧记录不删**；但其同行评审实证是负面信号：ADR 采纳率仍低，**约 50% 使用 ADR 的仓库只有 1–5 条**。— `strong`（Nygard 2011 原始定义；Buchgeher et al. 2023, *IEEE Access* MSR 研究）
9. **追溯矩阵（RTM）的结构性病灶不是工具而是「生产者 ≠ 消费者」**：最早的系统实证把主要障碍定位为「建立追溯的人」与「使用追溯的人」需求冲突。— `strong`（Gotel & Finkelstein 1994, ICRE，被引 1,200+）
10. **摘要会被当成全部**：摘要中的 spin 会**因果性**抬高临床医生对疗效的判断（随机对照试验，N=300 名临床医生）；现行报告规范因此要求摘要自带证据局限。— `strong`（Boutron et al. 2014, *JCO* SPIIN RCT；Beller et al. 2013 PRISMA for Abstracts Item 9）
11. **「决策疲劳」不足以支撑因果断言，且「结构化」本身不是效果来源**：原始法官研究自己只说 "suggest" 且**未测量疲劳**；模拟再分析显示陡降大部分是统计假象（但只解释 15%–45%）；2025 年注册报告在大规模医护数据上**零结果**（BF0+ > 22）；自我损耗多实验室重复 **d = 0.04，CI 跨零**。清单/交接框架的效果只在**其设计目标内**成立（I-PASS 相对降 23%/30%，9 站点中 6 个显著；安大略省 101 家医院、~21.5 万例 **未**显著改善）。— `strong`（Glöckner 2016；Andersson et al. 2025；Hagger et al. 2016；Urbach et al. 2014；Sotto et al. 2021）
12. **人机交互侧**：给 AI 加解释**不降低、反而提高**接受率（与正确性无关）；多轮对话使被测 LLM 平均性能下降 **约 39%**，且「走错一步后不会恢复」；LLM 的谄媚倾向**集中在主观题**，客观题会抵抗用户暗示。— `strong` / `medium-strong` / `medium`（Bansal et al. 2021 CHI；Laban et al. 2025 arXiv；Ranaldi & Pucci 2023 arXiv）

---

## 1. 提问节奏：批量 vs 顺序（含每轮问题数建议与依据）

### 1.1 理论基线：为什么会「问得越多、答得越差」

| 命题 | 来源 | 强度 |
|---|---|---|
| 当「最优回答」需要大量认知投入时，受访者会退而给出「够用就好」的回答，即 satisficing；表现为（1）信息检索/整合不完整或有偏，或（2）完全不检索不整合 | Krosnick 1991, *Applied Cognitive Psychology*，DOI [10.1002/acp.2350050305](https://doi.org/10.1002/acp.2350050305)，被引 2,476 | `strong` |
| 原文摘要逐字：「when optimally answering a survey question would require substantial cognitive effort, some repondents simply provide a satisfactory answer instead. This behaviour, called satisficing, can take the form of either (1) incomplete or biased information retrieval and/or information integration, or (2) no information retrieval or integration at all.」 | 同上 | `strong` |
| 综述将 satisficing 与问卷设计（题目难度、顺序、数量）直接挂钩 | Krosnick 1999, *Annual Review of Psychology*，DOI [10.1146/annurev.psych.50.1.537](https://doi.org/10.1146/annurev.psych.50.1.537)，被引 1,761 | `strong` |

**含义**：satisficing 是「一次问太多」的机制性解释——不是态度问题，而是认知负荷超过阈值后的策略性降级。

### 1.2 每轮批量大小的直接实验证据

**（a）矩阵题行数：5 / 10 / 20 的对照实验** — `strong`

- 来源：Grady, R. H., Greenspan, R. L., & Liu, M. (2018). *What Is the Best Size for Matrix-Style Questions in Online Surveys?* **Social Science Computer Review**. DOI [10.1177/0894439318773733](https://doi.org/10.1177/0894439318773733)
- 逐字（摘要）：「Results for **row size** revealed **dropout rate and reported survey difficulty increased as row size increased**. For column size, seven columns increased the completion time of the survey, while three columns produced lower scale reliability. There was no interaction between row and column size. **The best overall size tested was a 5 × 5 matrix.**」
- 设计：Study 1 N = 2,492，20 道题，变化行数（5/10/20）× 列数（3/5/7）；Study 2 N = 2,570，用单一 20 题量表跨页复现行数效应，结论一致（「participant survey ratings were still best in the five-row condition」）。
- 产出指标同时覆盖**数据质量**（straightlining、题目跳过率、内部一致性）与**体验**（流失率、体验评分、完成时长）。
- **注意**：这里的「5」是**矩阵题的行数**，单位是 survey item，不是访谈议题数。把它换算成「一轮问几个议题」是**类比**，不是该研究的结论。

**（b）同屏题数：1 / 4 / 10 / 40 的对照实验** — `strong`

- 来源：Toepoel, V., Das, M., & van Soest, A. (2009). *Design of Web Questionnaires: The Effects of the Number of Items per Screen*. **Field Methods**. DOI [10.1177/1525822x08330261](https://doi.org/10.1177/1525822x08330261)
- 逐字（摘要）：「Four different formats are used, with **one, four, ten, and forty items** and headers on a screen. The authors find no effect of format on the arousal index, but **nonresponse increases with the number of items appearing on a single screen**. Having multiple items on a screen **shortens the duration of the interview but negatively influences the respondent's evaluation of the questionnaire layout**.」
- **含义**：批量提问有一个真实的速度收益，代价是数据完整性与体验评价——这是一个明确的 trade-off，而不是单向劣势。

**（c）翻页 vs 滚动（长页面）** — `strong`

- 来源：Peytchev, A., Couper, M. P., McCabe, S. E., & Crawford, S. D. (2006). *Web Survey Design: Paging versus Scrolling*. **Public Opinion Quarterly**. DOI [10.1093/poq/nfl028](https://doi.org/10.1093/poq/nfl028)
- 设计：2003 年对 21,000+ 名本科生的调查，约 10,000 名应答者中 10% 被分配到可滚动版本（每个主要板块一个长表单），其余分到翻页版本（题目无需滚动即可见）；问卷最多 268 道题。
- 结果指标：各类非回答、单变量与双变量测量性质、以及应答者负担的代理指标（**原文摘要未给出方向性结论**，仅描述设计）。
- 相关后续：Mavletova & Couper (2014), *Journal of Survey Statistics and Methodology*, DOI [10.1093/jssam/smu015](https://doi.org/10.1093/jssam/smu015)（移动端 scrolling vs paging 对中途退出、项目无回答、完成时长的影响）— `medium-strong`

**（d）网格 vs 逐题（item-by-item）** — `medium-strong`

- Mavletova, A., Couper, M. P., & Lebedev, D. (2017). *Grid and Item-by-Item Formats in PC and Mobile Web Surveys*. **Social Science Computer Review**. DOI [10.1177/0894439317735307](https://doi.org/10.1177/0894439317735307)
- 摘要逐字（节选）：「While grids or matrix questions are a widely used format in PC web surveys, there is **no agreement on the format in mobile web surveys**. We conducted a two-wave experiment in an opt in panel in Russia, varying the question format (**grid format and item-by-item format**) and device respondents used for survey completion (smartphone and PC).」
- 摘要逐字（节选）：「While grids or matrix questions are a widely used format in PC web surveys, there is **no agreement on the format in mobile web surveys**. We conducted a two-wave experiment in an opt in panel in Russia, varying the question format (**grid format and item-by-item format**) and device respondents used for survey completion (smartphone and PC). The 1,678 respondents completed the survey in the assigned conditions in the first …」
- **注意**：本次未取得该文的结果方向，只取得设计描述。**不要把「逐题更好」归给该文。**

### 1.3 长流程的总量效应

| 命题 | 来源 | 强度 |
|---|---|---|
| 问卷长度与应答率存在总体关联（应答率随长度下降），但同质性检验 P = 0.03，作者警告「内容与长度无法分离」；结论是**按内容而非长度**选择工具 | Rolstad, S., Adler, J., & Rydén, A. (2011). *Response Burden and Questionnaire Length: Is Shorter Better? A Review and Meta-analysis*. **Value in Health**. DOI [10.1016/j.jval.2011.06.003](https://doi.org/10.1016/j.jval.2011.06.003)。32 篇报告，20 篇纳入 meta 分析（Europe PMC 摘要原文） | `strong` |
| 逐字（Europe PMC 摘要）：「In the meta-analysis, **a general association between response rate and questionnaire length was found (P ≤ 0.0001)**. Response rates were lower for longer questionnaires, but because the **P value for test of homogeneity was P = 0.03, this association should be interpreted with caution because it is impossible to separate the impact of content from length of the questionnaires.**」「Given the inherently problematic nature of comparing questionnaires of various lengths, **it is preferable to base decisions on use of instruments on the content rather than the length per se.**」 | 同上 | `strong` |
| 流失的行为基线：1,963 名学生、六项网络研究；**约 10% 几乎立刻流失，之后每 100 道题再流失约 2%** | Hoerger, M. (2010). *Participant Dropout as a Function of Survey Length in Internet-Mediated University Studies*. **Cyberpsychology, Behavior, and Social Networking**. DOI [10.1089/cyber.2009.0445](https://doi.org/10.1089/cyber.2009.0445)（摘要逐字：「Results indicated that **10% of participants could be expected to drop out of these studies nearly instantaneously, with an additional 2% dropping out per 100 survey items include…**」） | `medium-strong` |
| 长度对**参与率与应答质量指标**的影响（web survey） | Galesic, M., & Bosnjak, M. (2009). **Public Opinion Quarterly**. DOI [10.1093/poq/nfp031](https://doi.org/10.1093/poq/nfp031)。**题录已核实（POQ 2009，Crossref 被引 942 / Semantic Scholar 被引 1,246），但本次未能取得摘要或任何结果数字** | 存在性 `strong`；结果 `未核实` |
| 长度对回答质量的影响（更早的经典） | Herzog, A. R., & Bachman, J. G. (1981). *Effects of Questionnaire Length on Response Quality*. **Public Opinion Quarterly**. DOI [10.1086/268687](https://doi.org/10.1086/268687)。仅核实题录 | 存在性 `strong`；结果 `未核实` |
| 「中途退出（breakoff）」被单列为独立研究问题 | Peytchev, A. (2009). *Survey Breakoff*. **Public Opinion Quarterly**. DOI [10.1093/poq/nfp014](https://doi.org/10.1093/poq/nfp014)。仅核实题录 | 存在性 `medium` |

### 1.4 顺序式（逐题对话）vs 批量式的正面对照

| 命题 | 来源 | 强度 |
|---|---|---|
| **chatbot 逐题交互 > web 批量问卷**：chatbot 组更倾向给出有区分度的回答、更少 satisficing，数据质量更高；这一效应在「随意/口语化」语气下更强，且只在 chatbot 条件下出现 | Kim, S., Lee, J., & Gweon, G. (2019). *Comparing Data from Chatbot and Web Surveys: Effects of Platform and Conversational Style on Survey Response Quality*. **CHI 2019**. DOI [10.1145/3290605.3300316](https://doi.org/10.1145/3290605.3300316) | `strong` |
| 逐字（摘要）：「We found that **the participants in the chatbot survey, as compared to those in the web survey, were more likely to produce differentiated responses and were less likely to satisfice; the chatbot survey thus resulted in higher-quality data.** Moreover, when a casual conversational style is used, the participants were less likely to satisfice—although such effects were only found in the chatbot condition.」 | 同上 | `strong` |
| chatbot 在**开放式回答质量**上优于静态问卷：5,200+ 条自由文本，chatbot 组在 Gricean Maxims 的 informativeness / relevance / specificity / clarity 上显著更好，参与度更高 | Xiao, Z., Zhou, M. X., Liao, Q. V., et al. (2020). *Tell Me About Yourself: Using an AI-Powered Chatbot to Conduct Conversational Surveys*. **ACM TOCHI** 27(3). DOI [10.1145/3381804](https://doi.org/10.1145/3381804) | `strong` |
| **边界**：上述对照的对照组是**静态问卷**，不是人类访谈者；它证明的是「对话式优于表单式」，**不能**推出「AI 追问优于人类追问」。 | — | — |
| **重要反证**：网络调查响应率的元分析中，**最强预测因子不是问卷长度**，而是联系次数、个性化联系与预联系 | Cook, C., Heath, F., & Thompson, R. L. (2000). *A Meta-Analysis of Response Rates in Web- or Internet-Based Surveys*. **Educational and Psychological Measurement** 60(6). DOI [10.1177/00131640021970934](https://doi.org/10.1177/00131640021970934)，被引 1,553。逐字：「**The number of contacts, personalized contacts, and precontacts are the factors most associated with higher response rates** in the Web studies that are analyzed.」 | `medium-strong` |
| 网络 vs 其他模式的响应率：网络低约 11 个百分点（45 项实验比较） | Daikeler, A., Bošnjak, M., & Lozar Manfreda, K. (2019). *Web Versus Other Survey Modes: An Updated and Extended Meta-Analysis*. **JSSAM**. DOI [10.1093/jssam/smz008](https://doi.org/10.1093/jssam/smz008) | `medium-strong` |

### 1.5 问题顺序、依赖与分组

**（a）顺序本身会改变答案** — `strong`（理论） / `medium`（操作性证据）

- Schwarz, N., & Strack, F. (1991). *Context Effects in Attitude Surveys: Applying Cognitive Theory to Social Research*. **European Review of Social Psychology**. DOI [10.1080/14792779143000015](https://doi.org/10.1080/14792779143000015) — 问题顺序通过改变可及性（accessibility）与包含/排除标准改变后续判断。
- 经典专著：Schuman, H., & Presser, S. (1981). *Questions and Answers in Attitude Surveys*. Academic Press.（本次仅核实到 1982/1983 年的书评记录，DOI [10.2307/3151742](https://doi.org/10.2307/3151742)、[10.2307/2578327](https://doi.org/10.2307/2578327)）— `medium`（存在性）
- 背景理论专著：Tourangeau, R., Rips, L. J., & Rasinski, K. (2000). *The Psychology of Survey Response*. Cambridge University Press.（本次仅核实到相关章节 DOI [10.1093/acprof:oso/9780199747047.003.0004](https://doi.org/10.1093/acprof:oso/9780199747047.003.0004)）— `medium`（存在性）

**（b）自由回忆先于具体提问 —— 顺序影响信息产量的最硬证据** — `strong`

- Geiselman, R. E., Fisher, R. P., MacKinnon, D. P., & Holland, H. L. (1985). *Eyewitness memory enhancement in the police interview: Cognitive retrieval mnemonics versus hypnosis*. **Journal of Applied Psychology** 70(2). DOI [10.1037/0021-9010.70.2.401](https://doi.org/10.1037/0021-9010.70.2.401)，被引 235
- Geiselman, R. E., Fisher, R. P., MacKinnon, D. P., et al. (1986). *Enhancement of Eyewitness Memory with the Cognitive Interview*. **The American Journal of Psychology**. DOI [10.2307/1422492](https://doi.org/10.2307/1422492)，被引 186
- **要义**：认知访谈（Cognitive Interview）是一套**有强制顺序**的问询协议——先让受访者自由回忆（open-ended free recall），再进入具体问题。这一顺序被设计出来正是为了避免具体问题「锚定」并压制回忆。这是「先扩散再收敛」在问询领域的原始依据。
- **注意**：该文献领域是目击者记忆，不是需求工程；外推需谨慎。

**（c）分组到「独立决策轴」的理论依据** — `strong`（理论，非实验）

- Keeney, R. L., & Raiffa, H. *Decisions with Multiple Objectives: Preferences and Value Tradeoffs*. Cambridge University Press（1993 重印版）。DOI [10.1017/cbo9781139174084](https://doi.org/10.1017/cbo9781139174084)，被引 2,388
- 该书的方法论核心是：先把决策问题**分解**为若干目标/属性，检验属性之间的**偏好独立性（preferential independence）**，再在各属性上做价值权衡。这为「把互不依赖的决策轴归为一批、把有依赖的决策后置」提供了形式化依据。
- **未取得**：该书中关于「提问顺序」的操作性建议原文。

**（d）价值/目标先行（outline-first）的实证 —— 同时是支持与反证** — `medium`

- Selart, M., & Johansen, S. T. (2011). *Understanding the Role of Value‐Focused Thinking in Idea Management*. **Creativity and Innovation Management**. DOI [10.1111/j.1467-8691.2011.00602.x](https://doi.org/10.1111/j.1467-8691.2011.00602.x)，被引 60
- 逐字（摘要）：「The results revealed that **employees in the value‐focused thinking condition (VFT) produced fewer ideas**. Thus, value‐focused thinking (VFT) is **not only able to facilitate ideation fluency but also to constrain it**. Factors such as cognitive effort and motivation may play a part here. However, **the quality of the ideas was judged to be higher in terms of creativity and innovativeness.**」
- **双向含义**：先结构（先定目标）会**降低发散数量**、**提高想法质量评分**。这与「大纲先行」的直觉一致，也与「一直在收敛，没帮我扩散」这一痛点在机制上吻合。

### 1.6 成熟的结构化多轮问询协议（可借鉴的「节奏」形态）

| 协议 | 结构特征 | 来源 | 强度 |
|---|---|---|---|
| **Delphi** | 「a series of questionnaires in depth **interspersed with controlled opinion feedback**」——多轮问卷 + 受控反馈，直到共识或稳定 | Dalkey, N., & Helmer, O. (1963). *An Experimental Application of the DELPHI Method to the Use of Experts*. **Management Science** 9(3). DOI [10.1287/mnsc.9.3.458](https://doi.org/10.1287/mnsc.9.3.458)，被引 4,285 | `strong` |
| Delphi 停止准则主观、可用共识度与稳定性指标判断 | Holey, E. A., Feeley, J. L., Dixon, J., et al. (2007). **BMC Medical Research Methodology**. DOI [10.1186/1471-2288-7-52](https://doi.org/10.1186/1471-2288-7-52)，被引 572 | `strong` |
| Delphi 操作方法综述 | Trevelyan, E., & Robinson, N. (2015). **European Journal of Integrative Medicine**. DOI [10.1016/j.eujim.2015.07.002](https://doi.org/10.1016/j.eujim.2015.07.002)，被引 768 | `strong` |
| **Nominal Group Technique (NGT)** | 明确的**分阶段序列**：先静默生成 → 逐一轮流陈述（round-robin，一次一条）→ 讨论澄清 → 独立排序/投票。轮流机制的设计目的正是**抑制主导、防止遗漏** | Harvey, N., & Holmes, C. A. (2012). *Nominal group technique: An effective method for obtaining group consensus*. **International Journal of Nursing Practice** 18(2). DOI [10.1111/j.1440-172x.2012.02017.x](https://doi.org/10.1111/j.1440-172x.2012.02017.x)，被引 648 | `medium-strong` |
| **认知访谈 (CI)** | 强制顺序：自由回忆 → 开放式提问 → 具体问题 → 倒序/换视角重述 | Geiselman & Fisher 等，见 §1.5(b) | `strong`（在记忆领域内） |

### 1.7 需求工程侧的实证基础

| 命题 | 来源 | 强度 |
|---|---|---|
| 需求获取技术的**有效性**有系统综述级别的实证积累 | Davis, A., Dieste, O., Hickey, A., et al. (2006). *Effectiveness of Requirements Elicitation Techniques: Empirical Results Derived from a Systematic Review*. **RE'06**. DOI [10.1109/re.2006.17](https://doi.org/10.1109/re.2006.17)。**仅核实题录，未取得结论** | 存在性 `strong`；结果 `未核实` |
| 需求获取技术存在「成熟度」维度，成熟度被认为与获取效果相关；综述纳入 140 篇研究，结论按产品类型、干系人特征、信息类型分类 | Pacheco, C., García, I., & Reyes, M. (2018). *Requirements elicitation techniques: a systematic literature review based on the maturity of the techniques*. **IET Software**. DOI [10.1049/iet-sen.2017.0144](https://doi.org/10.1049/iet-sen.2017.0144)，被引 138 | `medium` |
| 逐字（摘要）：「This research paper found **140 studies** to answer these questions. The findings describe **which elicitation techniques are effective and in which situations they work best**, taking into account the product which must be developed, the stakeholders' characteristics, the type of information obta…」 | 同上 | `medium` |
| 需求获取访谈中**歧义**的可检测性 | Spoletini, P., Ferrari, A., Bano, M., et al. (2018). *Interview Review: An Empirical Study on Detecting Ambiguities in Requirements Elicitation Interviews*. **LNCS**. DOI [10.1007/978-3-319-77243-1_7](https://doi.org/10.1007/978-3-319-77243-1_7)，被引 13 | `medium` |

### 1.8 本节小结：关于「每轮问几个问题」的可用证据

- **有直接、可复现的实验数字**，但单位是 survey item / matrix row，不是访谈议题：最优约 **5 行**（Grady et al. 2018）；同屏题数越少越好，代价是耗时上升（Toepoel et al. 2009）；总量层面 **10% 即刻流失 + 每 100 题 2%**（Hoerger 2010）。
- **顺序式（逐题对话）在数据质量上优于批量式**，有两项独立实验支持（Kim et al. 2019；Xiao et al. 2020），但对照组是静态表单而非人类访谈者。
- **总长度与应答率的关系存在，但被 meta 分析作者本人限定为「无法与内容分离」**（Rolstad et al. 2011）。另有元分析显示强预测因子是**联系次数 / 个性化联系 / 预联系**而非长度（Cook et al. 2000），因此**不能把「越短越好」当作已确立结论**。
- **顺序本身有独立效应**（Schwarz & Strack 1991），且在认知访谈中「先自由回忆后具体提问」是被实证支持的强制顺序（Geiselman & Fisher）。
- **分组到独立决策轴的做法有形式化理论依据**（Keeney & Raiffa），但**未取得**关于「提问顺序」的操作性建议原文。
- **未取得**：任何针对「AI agent 主导的多轮访谈每轮应含几个议题」的直接实验。该问题的现有证据全部来自问卷方法学与访谈方法学，属于**跨域类比**。

---

## 2. 议程先行：收益与反证

### 2.1 收益侧证据

| 命题 | 来源 | 强度 |
|---|---|---|
| **议程使用**显著预测会议质量。18 项设计特征中 9 项显著，横跨 temporal / physical / procedural / attendee 四类；本研究「验证并大幅扩展」了此前关于**议程使用**、会议准时、设施质量、主持人身份与会议质量相关的研究 | Cohen, M. A., Rogelberg, S. G., Allen, J. A., & Luong, A. (2011). *Meeting design characteristics and attendee perceptions of staff/team meeting quality*. **Group Dynamics: Theory, Research, and Practice**. DOI [10.1037/a0021549](https://doi.org/10.1037/a0021549)，被引 146 | `medium-strong`（n=367 横断自评，非实验） |
| 逐字（摘要）：「The results demonstrated that **9 of the design characteristics**, spanning all 4 categories of design characteristics (i.e., temporal, physical, procedural, and attendee), **significantly predicted perceptions of meeting quality**. Furthermore, this study validated and greatly extended previous research showing that **agenda use, meeting punctuality, facility quality, and meeting facilitator status relate to meeting quality.**」 | 同上 | `medium-strong` |
| 会议设计特征与感知会议有效性（更早的实证） | Leach, D. J., Rogelberg, S. G., Warr, P. B., & Burnfield, J. L. (2009). *Perceived Meeting Effectiveness: The Role of Design Characteristics*. **Journal of Business and Psychology**. DOI [10.1007/s10869-009-9092-6](https://doi.org/10.1007/s10869-009-9092-6)，被引 161。**本次仅取得题录；其结论经由上条 Cohen 摘要的转述得到间接支持** | `medium` |
| **会中互动过程的微观编码**：92 场真实团队会议录像，用 act4teams 编码。功能性互动（**问题解决型互动、行动计划**）越多的团队对会议越满意；会议越好，团队生产率越高 | Kauffeld, S., & Lehmann-Willenbrock, N. (2011/2012). *Meetings Matter*. **Small Group Research**. DOI [10.1177/1046496411429599](https://doi.org/10.1177/1046496411429599)，被引 260+ | `medium-strong` |
| 逐字（Crossref 摘要）：「Teams that showed more functional interaction, such as **problem-solving interaction and action planning**, were significantly more satisfied with their meetings. **Better meetings were associated with higher team productivity.**」 | 同上 | `medium-strong` |
| 会前因素与设计特征的文献综述（章节） | Odermatt, I., König, C. J., & Kleinmann, M. (2015). *Meeting Preparation and Design Characteristics*. Cambridge University Press. DOI [10.1017/cbo9781107589735.004](https://doi.org/10.1017/cbo9781107589735.004)，被引 21 | `medium` |
| **问题结构化方法（PSM）**在真实场景中被广泛应用并有实践评估文献 | Mingers, J., & Rosenhead, J. (2004). *Problem structuring methods in action*. **European Journal of Operational Research**. DOI [10.1016/s0377-2217(03)00056-0](https://doi.org/10.1016/s0377-2217(03)00056-0)。Crossref 被引 583 / Semantic Scholar 被引 724。**仅核实题录，未取得摘要** | 存在性 `strong`；结果 `未核实` |
| **结构化冲突优于共识**：使用辩证质询（DI）或魔鬼代言（DA）的群体在**建议与假设的质量**上显著优于共识组；DI/DA 组的产出还显著优于组内最佳个人，共识组则无显著差异 | Schweiger, D. M., & Sandberg, W. R. (1989). *The utilization of individual capabilities in group approaches to strategic decision‐making*. **Strategic Management Journal**. DOI [10.1002/smj.4250100104](https://doi.org/10.1002/smj.4250100104)，被引 167 | `strong` |
| 逐字（Crossref 摘要）：「the DI and DA groups yielded **significantly higher quality recommendations and assumptions** than the average of the individuals in the respective groups, whereas the C groups did not. Moreover, **the recommendations and assumptions of the DI groups and the recommendations of the DA groups significantly exceeded those of the best individual** in the respective groups. There were no significant differences for the C groups.」 | 同上 | `strong` |
| 原始比较研究（DI vs DA vs 共识） | Schweiger, D. M., Sandberg, W. R., & Ragan, J. W. (1986). **Academy of Management Journal**. DOI [10.2307/255859](https://doi.org/10.2307/255859)，Crossref 被引 555 / Semantic Scholar 被引 751。**未取得摘要** | 存在性 `strong`；结果 `未核实` |
| 魔鬼代言/辩证质询对个人 vs 群体、面对面 vs 计算机中介的影响 | Schwenk, C., & Valacich, J. S. (1994). **OBHDP**. DOI [10.1006/obhd.1994.1057](https://doi.org/10.1006/obhd.1994.1057)；Valacich, J. S., & Schwenk, C. (1995). **OBHDP**. DOI [10.1006/obhd.1995.1070](https://doi.org/10.1006/obhd.1995.1070)。**均未取得摘要** | 存在性 `medium` |

### 2.2 反证：议程/结构先行可能造成的伤害

**（a）设计固着（design fixation）——本节最强的反证** — `strong`

- Jansson, D. G., & Smith, S. M. (1991). *Design fixation*. **Design Studies** 12(1). DOI [10.1016/0142-694x(91)90003-f](https://doi.org/10.1016/0142-694x(91)90003-f)。**被引 994**。这是该概念的奠基实验：在发散任务前展示一个（含缺陷的）示例，会显著提高产出对示例特征的复制。
- Cardoso, C., & Badke‐Schaub, P. (2011). *The Influence of Different Pictorial Representations During Idea Generation*. **The Journal of Creative Behavior**。DOI [10.1002/j.2162-6057.2011.tb01092.x](https://doi.org/10.1002/j.2162-6057.2011.tb01092.x)，被引 84。逐字（摘要）：「once designers start generating new solution ideas to design problems, **they often become too attached to some of the examples they encounter.** Inadequate and excessive repetition of key attributes (e.g. object features, principles) from existing solutions has been termed **design fixation**. … The findings demonstrate **high levels of repetition of particular key attributes in the outcome generated by the treatment groups, when compared to a control condition**. The results also show that such attribute repetition **led to the occurrence of design fixation, with a visible detrimental impact for particular aspects of the ideas generated.**」
- Chrysikou, E. G., & Weisberg, R. W. (2005). *Following the Wrong Footsteps: Fixation Effects of Pictorial Examples in a Design Problem-Solving Task*. **Journal of Experimental Psychology: LMC** 31(5). DOI [10.1037/0278-7393.31.5.1134](https://doi.org/10.1037/0278-7393.31.5.1134)，被引 153
- 综述：Vasconcelos, L. A., & Crilly, N. (2016). *Inspiration and fixation: Questions, methods, findings, and challenges*. **Design Studies**. DOI [10.1016/j.destud.2015.11.001](https://doi.org/10.1016/j.destud.2015.11.001)，被引 158。（**仅核实题录**）
- **对本议题的含义**：先给出大纲/结构 = 先给出一个"示例框架"。设计固着文献表明，这会在统计上可测地压缩解空间，并提高对既有属性的复制率。这是「议程先行」在**发散阶段**的机制性代价。

**（b）对固着效应本身的质疑（反证的反证）** — `medium`

- Purcell, A. T., Williams, G., Gero, J. S., & Colbron, B. (1993). *Fixation effects: do they exist in design problem solving?* **Environment and Planning B: Planning and Design**. DOI [10.1068/b200333](https://doi.org/10.1068/b200333)，被引 47。**仅核实题录**——标题本身即表明该效应曾被质疑。

**（c）议程的「遗漏框架」效应** — `strong`（理论，跨域类比）

- McCombs, M. E., & Shaw, D. L. (1972). *The Agenda-Setting Function of Mass Media*. **Public Opinion Quarterly**. DOI [10.1086/267990](https://doi.org/10.1086/267990)，**被引 5,790**。议程设置理论的核心命题是：被列入议程的议题会被公众判定为更重要——**其反面是：未列入议程的议题在认知上被系统性忽略**。
- **注意**：这是大众传播领域、以媒体为对象的研究。把它用于「会议议程会让人只回答被问到的问题」是**类比**，不是原研究的结论；引用时必须标明是类比。

**（d）框架效应：同一问题的不同表述导致偏好反转** — `strong`

- Tversky, A., & Kahneman, D. (1981). *The Framing of Decisions and the Psychology of Choice*. **Science** 211(4481). DOI [10.1126/science.7455683](https://doi.org/10.1126/science.7455683)，**被引 12,072**。逐字（摘要）：「The psychological principles that govern the perception of decision problems and the evaluation of probabilities and outcomes produce **predictable shifts of preference when the same problem is framed in different ways. Reversals of preference are demonstrated** in choices regarding monetary outcomes, both hypothetical and real, and in questions pertaining to the loss of human lives.」
- **含义**：议程不仅决定「讨论什么」，还通过措辞决定「怎么被判断」。

**（e）刻意规划 vs 涌现：战略研究对「计划锁定」的经典论证** — `strong`

- Mintzberg, H., & Waters, J. A. (1985). *Of strategies, deliberate and emergent*. **Strategic Management Journal** 6(3). DOI [10.1002/smj.4250060306](https://doi.org/10.1002/smj.4250060306)，**被引 2,887**。逐字（摘要）：「**Deliberate and emergent strategies may be conceived as two ends of a continuum** along which real‐world strategies lie. … various types of strategies uncovered in research. These include strategies labelled **planned, entrepreneurial, ideological, umbrella, process, unconnected, consensus and imposed.**」
- **含义**：真实世界中的有效战略多位于「刻意」与「涌现」之间；仅有刚性议程的一端会系统性丢失涌现成分。

**（f）价值先行会压低发散数量** — `medium`（同 §1.5(d)）

- Selart & Johansen 2011：VFT 组产生**更少**想法。这是「先定大纲再发散」这一流程的直接代价证据。

### 2.3 「结构化议程 + 开放溢出通道」的混合形态（有来源者）

| 形态 | 结构 | 来源 | 强度 |
|---|---|---|---|
| **受控反馈轮次** | 每轮结构化问卷 → 汇总反馈给全体 → 下一轮修订；发散轮与收敛轮交替 | Dalkey & Helmer 1963（见 §1.6） | `strong` |
| **静默生成 + 轮流陈述 + 后置讨论** | 先各自写下（避免锚定）→ round-robin 每人一条（保证覆盖）→ 再开放讨论 → 独立投票 | Harvey & Holmes 2012（见 §1.6） | `medium-strong` |
| **自由回忆 → 开放式 → 具体问题** | 明确的「先扩散后收敛」顺序协议 | Geiselman & Fisher（见 §1.5(b)） | `strong` |
| **结构化冲突（DI / DA）** | 指定角色做对抗性论证，把「开放溢出」制度化 | Schweiger & Sandberg 1989；Schweiger et al. 1986 | `strong`（质量）/ 存在性 |
| **开放空间（Open Space Technology）** | 无固定议程、由参与者自组织议题 | Owen, H. (1998). *The Human Side: R&D Meetings in Open Space*. **Research-Technology Management**. DOI [10.1080/08956308.1998.11671225](https://doi.org/10.1080/08956308.1998.11671225)。**仅核实题录，无效果证据** | `weak` |
| **会前准备与设计特征** | 会前分发材料/议程的综合评述 | Odermatt et al. 2015 | `medium` |

**未找到任何研究**：关于「parking lot / 溢出议题清单」是否帮助会议参与者不丢线索的实证。Crossref 检索该词返回的全部是停车场工程文献（此结论来自本次独立检索，并被另一路并行检索复核）。这是一个**明确的文献空白**。

---

## 3. 决策台账 / 进度可视化的成熟形态

> 本节来源经两路独立检索交叉核对；所有引文均标注了原始抓取位置。

### 3.1 ADR（Architecture Decision Record）——最规范的「决策台账」形态

| 命题 | 来源 | 强度 |
|---|---|---|
| ADR 的原始动机就是「决策背后的理由难以追踪」 | Nygard, M. (2011). *Documenting Architecture Decisions*. https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions | `medium-strong` |
| 逐字：「**One of the hardest things to track during the life of a project is the motivation behind certain decisions.**」 | 同上 | `medium-strong` |
| **状态生命周期含 superseded / deprecated，且要求指向替代者** | 同上 | `strong` |
| 逐字：「A decision may be '**proposed**' if the project stakeholders haven't agreed with it yet, or '**accepted**' once it is agreed. **If a later ADR changes or reverses a decision, it may be marked as 'deprecated' or 'superseded' with a reference to its replacement.**」 | 同上 | `strong` |
| **编号单调递增、不复用；被推翻的旧记录保留并标记** | 同上 | `strong` |
| 逐字：「ADRs will be **numbered sequentially and monotonically. Numbers will not be reused.**」「If a decision is reversed, we will **keep the old one around, but mark it as superseded.** (It's still relevant to know that it was the decision, but is no longer the decision.)」 | 同上 | `strong` |
| **「decision log」= 全部 ADR 的集合**，是社区标准术语 | adr.github.io — https://adr.github.io/ | `medium` |
| 逐字：「**The collection of ADRs created and maintained in a project constitute its decision log.**」 | 同上 | `medium` |
| 已接受的 ADR 不可修改，只能被取代 | Fowler, M. *Architecture Decision Record*. https://martinfowler.com/bliki/ArchitectureDecisionRecord.html | `medium` |
| 逐字：「**Once an ADR is accepted, it should never be reopened or changed - instead it should be superseded.** That way we have a clear log of decisions and how long they governed the work.」 | 同上 | `medium` |
| 模板生态中 **Status 字段**是稳定共性 | joelparkerhenderson/architecture-decision-record（GitHub，17k stars）— https://github.com/joelparkerhenderson/architecture-decision-record | `weak-medium` |

**ADR 的关键反证（同行评审实证）** — `strong`

- Buchgeher, G., et al. (2023). *Using Architecture Decision Records in Open Source Projects—An MSR Study on GitHub*. **IEEE Access**. DOI [10.1109/ACCESS.2023.3287654](https://doi.org/10.1109/ACCESS.2023.3287654)
- 逐字：「Our results show that **the adoption of ADRs is still low**, although the number of repositories using ADRs is increasing every year. **About 50% of all repositories with ADRs contain just one to five ADRs** suggesting that **the concept has been tried but not yet definitively adopted.**」
- 逐字：「In repositories that use ADRs more systematically, we observed that **recording decisions is a team activity conducted by two or more users over a longer period of time.** In most repositories the template proposed by Michael Nygrad is used.」
- **失败模式**：台账类实践的典型死法是**启动后停滞**，而不是从未启动。

**ADR 可访问性的自认局限** — `medium`

- Nygard 逐字：「One potential objection is that **keeping these in version control with the code makes them less accessible for project managers, client stakeholders, and others who don't live in version control** like the development team does.」
- Fowler 页逐字：「Some folks also feel that **keeping ADRs in git makes it too hard for non-developers to work with them.**」
- **含义**：「人类可读」若被等同于「开发者可读」，台账对非开发者不可达。

**ADR 收益证据的原始强度非常低** — `weak`

- Nygard 逐字：「We've been using this format on a few of our projects since early August. That's not a very long time in the global sense, but early feedback from both clients and developers has been quite positive. In that time, we've had **six to ten developers** rotate through projects using ADRs. All of them have stated that they appreciate the degree of context they received by reading them.」
- **n ≈ 6–10，无对照、无量化**。任何「ADR 已被证明有效」的强断言都超出原始来源。

### 3.2 项目管理中的「登记册 / 日志」家族

| 命题 | 来源 | 强度 |
|---|---|---|
| PRINCE2 用一整套登记册 + 日志承载未决事项：Project Log、Daily log、Issue register、Lessons log、Quality register、Risk register、Product register | PRINCE2 wiki, *Management Products (Templates)* — https://prince2.wiki/management-products/ | `medium` |
| **PRINCE2 哲学明确允许合并**：「there's no need to have a one to one relationship between the management products and physical realities: **you can merge multiple management products into a single entity** (e.g., issue register and risk register), or split one into multiple entities」 | 同上 | `medium` |
| 逐字清单：「Project Log — Daily log — Issue register — Lessons log — Quality register — Risk register — Product register」 | 同上 | `medium` |
| **RAID log 没有稳定规范定义**：D = Dependencies 或 Decisions；A = Assumptions 或 Actions | Asana, *RAID log* — https://asana.com/resources/raid-log | `weak` |
| 逐字：「A RAID log is a project management tool used to track **Risks, Assumptions (or Actions), Issues, and Dependencies (or Decisions)** throughout a project.」 | 同上 | `weak` |
| 风险登记册实务存在「文化认同与工具集成」的落地困难 | Wickham, L. (2025). *Risk Registers in Practice*. DOI [10.1201/9781003646082-14](https://doi.org/10.1201/9781003646082-14)（**0 引用，未读正文**） | `weak` |

**重要**：PRINCE2 官方管理产品清单里**没有**「RAID log」这一项。本次调研**未能找到 RAID log 的原始出处**——因此**不应引用任何关于 RAID 起源的断言**。

### 3.3 燃烧图 / 累积流量图（CFD）

| 命题 | 来源 | 强度 |
|---|---|---|
| CFD 的规范定义就是「各状态数量 + 总量」的人类可读视图。PMBOK 7（PMI）：「chart indicating features completed over time, features in other states of development, and those in the backlog」 | Wikipedia, *Cumulative flow diagram*（转引 PMBOK 7th ed.）— https://en.wikipedia.org/wiki/Cumulative_flow_diagram | `medium`（转引，未核 PMBOK 原文） |
| CFD 派生指标在工业案例中被实践者认为有用，尤其**并行任务多**的复杂产品 | Petersen, K., et al. (2011). *Measuring the flow in lean software development*. **Software: Practice and Experience**. DOI [10.1002/spe.975](https://doi.org/10.1002/spe.975) | `medium-strong`（单案例） |
| 逐字：「An evaluation of the measures in an **industrial case study** showed that **practitioners found them useful** and identify improvements based on the measurements… the practitioners found the measures useful in seeing the progress of development for **complex products where many tasks are executed in parallel.**」 | 同上 | `medium-strong` |

**燃烧图的三条已知失真** — `medium`（机制性说明，来源为带引用的百科条目，未回溯其 footnote）

1. **剩余数可被系统性偏置**：逐字「if a team constantly overestimates time requirements, **the progress will always appear ahead of schedule**. If they constantly underestimate time requirements, **they will always appear behind schedule.**」
2. **y 值并非「总数 − 已完成」**：逐字「Its y-value is the sum of effort of remaining work after the past period. (**This is in general not equal to subtracting recently completed amount of work from the last point, but only if the total work remained constant.**)」——**范围蔓延会让剩余数不降甚至上升**。
3. **「理想线」本身被质疑**：逐字「Some people take issue with calling this an 'ideal' line, as **it's not generally true that the goal is to follow this line. This line is a mathematical calculation based on estimates, and the estimates are more likely to be in error than the work.**」

- 另有专门提出「燃烧图需要替代方案」的论文（标题即否证）：DOI [10.4156/jdcta.vol3.issue3.15](https://doi.org/10.4156/jdcta.vol3.issue3.15)（`weak`，仅核实题录，3 次引用）

### 3.4 需求追溯矩阵（RTM）与轻量追溯

**「生产者 ≠ 消费者」是被最早实证定位的结构性病灶** — `strong`

- Gotel, O. C. Z., & Finkelstein, A. C. W. (1994). *An analysis of the requirements traceability problem*. **ICRE 1994**. DOI [10.1109/ICRE.1994.292398](https://doi.org/10.1109/ICRE.1994.292398)。开放 PDF：http://discovery.ucl.ac.uk/749/1/2.2_rtprob.pdf。被引 1,200–1,518
- 逐字：「**Despite many advances, RT remains a widely reported problem area by industry.** We attribute this to inadequate problem analysis.」
- 逐字：「These indicated that **the main barrier is due to an establish and end-use conflict.** By this, we mean that **the 2 main parties involved (i.e., those in a position to make it possible and those who require it to assist their work), have conflicting problems and needs**」
- 逐字：「• **Individual efforts are ad hoc and localised**, whereas a … • **Poor feedback regarding best practice**, and little dedicated [support]」（PDF 文本抽取存在断行，已核对上下文）
- **含义**：这是「RTM 退化为没人读的官僚产物」最有力的学术解释——**填台账的人不是看台账的人**。这不是 UI 问题。

**RTM 的人类可读形态** — `weak-medium`

- Wikipedia, *Traceability matrix* — https://en.wikipedia.org/wiki/Traceability_matrix
- 逐字：「In software development, **a traceability matrix (TM) is a document, usually in the form of a table**, used to assist in determining the completeness of a relationship by correlating any two baselined documents using a many-to-many relationship comparison.」「**Large values imply that the relationship is too complex and should be simplified.**」
- （半）自动化追溯工具产业采纳率长期偏低：Demi, S., Sánchez-Gordón, M., & Colomo-Palacios, R. (2020). DOI [10.6084/m9.figshare.12085038.v1](https://doi.org/10.6084/m9.figshare.12085038.v1)。逐字：「despite the technological advances, previous studies have reported **low adoption rate of (semi-)automated requirements traceability in industry.**」— `medium`（SLR，该记录 0 引用，未读全文）

### 3.5 「完成」的可枚举化：Definition of Done

- Schwaber, K., & Sutherland, J. (2020). *The Scrum Guide*. https://scrumguides.org/docs/scrumguide/v2020/2020-Scrum-Guide-US.pdf
- 逐字：「The Definition of Done **creates transparency** by providing everyone a shared understanding of what work was completed as part of the Increment. **If a Product Backlog item does not meet the Definition of Done, it cannot be released or even presented at the Sprint Review. Instead, it returns to the Product Backlog for future consideration.**」
- 强度：`strong`（规范性权威原始文件）；但这是**应然规定**，不是效果实证。
- 实务观点（无数据）：Mike Cohn, *Definition of Done in Scrum* — https://www.mountaingoatsoftware.com/agile/scrum/artifacts/definition-of-done。逐字：「If a team says a product backlog item is done, but testing, integration, security review, documentation, or browser support remains unfinished, the team has not created as much progress as it appears. **The unfinished work is still there. It is just hidden.**」— `weak`

### 3.6 「被取代 / 变更」是否帮助理解？——**本议题最重要的空白**

- 「变更感知（change awareness）」是被单列的研究问题，说明「显示改了什么」需要专门设计：Tam, J., & Greenberg, S. (2006). *A framework for asynchronous change awareness in collaborative documents and workspaces*. **Int. J. Human-Computer Studies**. DOI [10.1016/j.ijhcs.2006.02.004](https://doi.org/10.1016/j.ijhcs.2006.02.004)。**仅核实题录**（未取得摘要/全文）— `medium`（存在性）
- 与「标注变更」最接近的可引用实验证据是「受限高亮提升阅读理解」：CHI 2024, DOI [10.1145/3613904.3642314](https://doi.org/10.1145/3613904.3642314)。**仅核实题录，未取得摘要与效应量** — `medium-strong`（存在性）
- **明确结论**：「显示『已被 X 取代』到底帮助还是干扰理解」这一具体问题，**本次未能找到任何实证答案**。这是本报告最重要的证据空白之一。
- 不要引用：Ramesh 1998（CACM，DOI [10.1145/290133.290147](https://doi.org/10.1145/290133.290147)）与 Ramesh & Jarke 2001（DOI [10.1109/32.895989](https://doi.org/10.1109/32.895989)）的具体结论——付费墙，无摘要。

### 3.7 「人一次能记住多少未决事项」的唯一相关实证

- Masicampo, E. J., & Baumeister, R. F. (2011). *Consider it done! Plan making can eliminate the cognitive effects of unfulfilled goals*. **JPSP**. DOI [10.1037/a0024192](https://doi.org/10.1037/a0024192)，Crossref 被引 91。**仅核实题录**（未取得摘要/全文）— `medium-strong`（存在性）
- Masicampo, E. J., & Baumeister, R. F. (2011). *Unfulfilled goals interfere with tasks that require executive functions*. **JESP**. DOI [10.1016/j.jesp.2010.10.011](https://doi.org/10.1016/j.jesp.2010.10.011)，被引 57。**仅核实题录** — `medium-strong`（存在性）
- **边界**：这两条支持「**把未决事项显式写下来**有认知收益」，**不**支持「显示一个精确的剩余数字有收益」。把后者归给它们是过度外推。

---

## 4. 长流程中的上下文丢失与对抗手段

> 本节由独立并行检索产出，工具受限条件下的可用通道为 Crossref / Unpaywall / Europe PMC / PMC / 直接抓取。凡未读到原文的条目均标为「仅核实题录」。

### 4.1 「决策疲劳」：原始主张及其被大幅削弱的过程

| 命题 | 来源 | 强度 |
|---|---|---|
| **原始现象**：以色列假释委员会的有利裁决比例在**每个决策时段内从约 65% 逐渐降到接近 0**，休息后**骤回约 65%** | Danziger, S., Levav, J., & Avnaim-Pesso, L. (2011). *Extraneous factors in judicial decisions*. **PNAS** 108(17). DOI [10.1073/pnas.1018033108](https://doi.org/10.1073/pnas.1018033108)（PMC3084045；PMID 21482790；被引 ~1,433） | 存在性 `strong`；**因果解释 `contested`** |
| 逐字：「We find that **the percentage of favorable rulings drops gradually from ≈ 65% to nearly zero within each decision session and returns abruptly to ≈ 65% after a break.**」 | 同上 | `strong` |
| **作者的措辞是 "suggest"，且该研究没有测量饥饿或心理损耗**，只把用餐休息当作时段分界。逐字：「Our findings **suggest** that judicial rulings can be swayed by extraneous variables that should have no bearing on legal decisions.」 | 同上 | `strong`（措辞边界） |
| **PNAS 评论（标题即「被忽略的因素」）** | Weinshall-Margel, K., & Shapard, J. (2011). *Overlooked factors in the analysis of parole decisions*. **PNAS** 108(42). DOI [10.1073/pnas.1110910108](https://doi.org/10.1073/pnas.1110910108)（PMC3198355；被引 62）。**原文未能取得**（PNAS 403、PMC 网络层拦截、Europe PMC fullTextXML 500） | 存在性 `strong`；内容 `仅二手逐字` |
| 其核心论点的逐字转述（转引自 Glöckner 2016）：「They argue, among other things, that **the downward trend might be due to the fact that, within each session, unrepresented prisoners usually go last and are less likely to be granted parole than prisoners who are represented by attorneys.**」 | 同上（转引） | `medium`（二手） |
| **原始作者的回复**：主张控制律师代理后趋势依然存在 | Danziger, S., Levav, J., & Avnaim-Pesso, L. (2011). *Reply to Weinshall-Margel and Shapard: Extraneous factors in judicial decisions persist*. **PNAS** 108(42). DOI [10.1073/pnas.1112190108](https://doi.org/10.1073/pnas.1112190108)（PMC3198336）。**原文未取得** | `weak`（仅题录 + 二手转述） |
| **替代解释的模拟检验：陡降大部分可由「理性时间管理 + 选择性脱落」的统计假象解释** | Glöckner, A. (2016). *The irrational hungry judge effect revisited: Simulations reveal that the magnitude of the effect is overestimated*. **Judgment and Decision Making** 11(6), 601–610. DOI [10.1017/s1930297500004812](https://doi.org/10.1017/s1930297500004812)，被引 55 | `strong`（对原始数据的模拟再分析） |
| 逐字：「A simulation shows that the observed influence of order **can be alternatively explained by a statistical artifact resulting from favorable rulings taking longer than unfavorable ones.** An effect of similar magnitude would be produced by a (hypothetical) **rational judge who plans ahead minimally and ends a session instead of starting cases that he or she assumes will take longer directly before the break.**」 | 同上（摘要） | `strong` |
| 逐字（全文）：「The simulations show that **the seemingly dramatic drop of favorable rulings from 65% to almost 0% towards the end of each session does not conclusively indicate bias or error in judicial decision making.**」「Hence, the analyses by DLA **do not provide conclusive evidence** for the hypothesis that extraneous factors influence legal rulings.」 | 同上（全文：https://www.sas.upenn.edu/~baron/journal/16/16823/jdm16823.html） | `strong` |
| **Glöckner 自己承认假象只能解释一部分**：逐字「In sum, **rational time management and selective dropout — although potentially being important — can explain the findings by DLA only in parts.**」「the remaining effects of rational time management could be estimated to **account for a drop of 15% to 45% only.**」 | 同上 | `strong` |
| 逐字（方法学建议）：「**censoring artificially increases selective dropout**, and therefore **it should not be used when analyzing the effect of ordinal position on favorability rulings.**」 | 同上 | `strong` |
| **正确读法**：被削弱的是**原始因果解释与效应量级**，**不是「任何顺序效应都不存在」**。Glöckner 明确列出了自己模拟解释不了的残留（模拟起点有利率 45% vs 原始 65%；无法解释时段内的时间效应；曲线形状细节不同）。 | — | — |
| **主张直接弃用该发现**（先验合理性论证，非独立数据再分析） | Lakens, D. (2017). *Impossibly hungry judges*. The 20% Statistician（博客）。http://daniellakens.blogspot.com/2017/07/impossibly-hungry-judges.html。逐字：「I think we should dismiss this finding, simply because **it is impossible**.」「As psychologists, **we shouldn't teach or cite this finding, nor use it in policy decisions** as an example of psychological bias in decision making.」「There are simply **no plausible psychological effects that are strong enough** to cause the data pattern in the hungry judges study.」 | `medium`（博客，未同行评审） |
| 该博文引 Glöckner 的效应量换算：「A drop of favorable decisions from 65% in the first trial to 5% in the last trial as observed in DLA is equivalent to **an odds ratio of 35 or a standardized mean difference of d = 1.96**」 | 同上 | `medium` |
| **2025 年注册报告：在大规模医护实地数据中未发现决策疲劳** | Andersson 等 (2025). *No evidence for decision fatigue using large-scale field data from healthcare*. **Communications Psychology**. DOI [10.1038/s44271-025-00207-8](https://doi.org/10.1038/s44271-025-00207-8) | `strong`（注册报告；贝叶斯） |
| 逐字：「The results consistently showed **relative support for the statistical null hypothesis of no difference in decision-making depending on fatigue (BF0+ > 22 for all main tests)**. We thus **found no evidence for decision fatigue.**」「Whereas these results don't preclude the existence of a weaker or more nuanced version of decision fatigue or more context-specific effects, they **cast serious doubt on the empirical relevance of decision fatigue as a domain general effect** for sequential decisions in healthcare and elsewhere.」 | 同上 | `strong` |
| **构念本身缺乏可操作化** | Pignatiello, G. A., Martin, R. J., & Hickman, R. L. (2018). *Decision fatigue: A conceptual analysis*. **Journal of Health Psychology**. DOI [10.1177/1359105318763510](https://doi.org/10.1177/1359105318763510)。逐字：「A search of the term 'decision fatigue' was conducted across seven research databases, which yielded **17 relevant articles**. … However, **the extant literature failed to adequately describe consequences of decision fatigue.**」 | `medium` |
| 医护决策疲劳系统综述（**存在，结论未能证实**） | Maier 等 (2025). **Health Psychology Review**. DOI [10.1080/17437199.2025.2513916](https://doi.org/10.1080/17437199.2025.2513916)，被引 17 | `weak`（仅题录） |
| **「自我损耗」的多实验室注册重复失败** | Hagger, M. S., et al. (2016). *A Multilab Preregistered Replication of the Ego-Depletion Effect*. **Perspectives on Psychological Science** 11(4). DOI [10.1177/1745691616652873](https://doi.org/10.1177/1745691616652873) | `strong`（**失败**重复） |
| 逐字：「Multiple laboratories (**k = 23, total N = 2,141**) conducted replications of a standardized ego-depletion protocol… Meta-analysis of the studies revealed that the size of the ego-depletion effect was small with 95% confidence intervals (CIs) that encompassed zero (**d = 0.04, 95% CI [−0.07, 0.15]**).」 | 同上 | `strong` |
| 边界：使用**单一**标准化范式（Sripada 等），不能完全排除其他损耗操作。 | 同上 | — |
| 发表偏倚校正后损耗效应接近零（二手转述） | Carter, E. C., & McCullough, M. E. (2013). *Is ego depletion too incredible?* **Behavioral and Brain Sciences** 36(6). DOI [10.1017/S0140525X13000952](https://doi.org/10.1017/S0140525X13000952) | `medium` |
| 原始主张（「做出选择会损害后续自我控制」） | Vohs, K. D., et al. (2008). **JPSP** 94(5). DOI [10.1037/0022-3514.94.5.883](https://doi.org/10.1037/0022-3514.94.5.883)，被引 ~1,150。**摘要未能取得** | 存在性 `strong`；内容 `未核实` |

**结论**：**「决策疲劳」作为一个已确立的一般性因果机制，证据是不充分的（inadequately supported），不应作为硬前提引用。** 可引用的只有：现象本身（Danziger 2011，作者措辞为 suggest）、两条针对性的方法学反驳（Weinshall-Margel & Shapard；Glöckner）、一篇 2025 年注册报告的零结果（BF0+ > 22）、以及 ego depletion 的多实验室失败重复（d = 0.04，CI 跨零）。

**仍可用的替代证据（不依赖决策疲劳机制）**：
- 问卷长度 → 应答率下降（Rolstad et al. 2011，见 §1.3）— `strong`（含作者限定）
- 长度 → 流失的行为曲线（Hoerger 2010，10% + 2%/100 题）— `medium-strong`
- 受访疲劳：同一学年内多次调查会显著压低后续调查的响应率 — Porter, S. R., et al. (2004). *Multiple surveys of students and survey fatigue*. **New Directions for Institutional Research**. DOI [10.1002/ir.101](https://doi.org/10.1002/ir.101)，被引 320。逐字：「This chapter reviews the literature on survey fatigue and summarizes a research project that indicates that **administering multiple surveys in one academic year can significantly suppress response rates in later surveys.**」— `medium`
- satisficing 随认知负荷上升（Krosnick 1991）— `strong`
- **重要反证**：网络调查响应率的元分析中，**最强预测因子不是问卷长度**，逐字「**The number of contacts, personalized contacts, and precontacts are the factors most associated with higher response rates** in the Web studies that are analyzed.」— Cook, C., Heath, F., & Thompson, R. L. (2000). **Educational and Psychological Measurement** 60(6). DOI [10.1177/00131640021970934](https://doi.org/10.1177/00131640021970934)，被引 1,553 — `medium-strong`。**该摘要未把问卷长度列为主因，常被误引。**
- 网络 vs 其他模式的响应率：网络低约 11 个百分点（45 项实验比较）— Daikeler, A., Bošnjak, M., & Lozar Manfreda, K. (2019). **JSSAM**. DOI [10.1093/jssam/smz008](https://doi.org/10.1093/jssam/smz008) — `medium-strong`

### 4.2 跨会话、跨班次的信息交接（临床 handover 是最成熟的领域）

| 命题 | 来源 | 强度 |
|---|---|---|
| **SBAR 的起源**（Situation–Background–Assessment–Recommendation），由 Kaiser Permanente of Colorado 的 Michael Leonard 等人开发 | Institute for Healthcare Improvement (IHI), *SBAR Tool*. https://www.ihi.org/resources/tools/sbar-tool-situation-background-assessment-recommendation | 起源事实 `strong` |
| 逐字：「**Michael Leonard, MD**, Physician Leader for Patient Safety, along with colleagues Doug Bonacum and Suzanne Graham at **Kaiser Permanente of Colorado** … developed this technique.」「SBAR (Situation-Background-Assessment-Recommendation) is an **easy-to-remember, concrete communication mechanism for framing any conversation, especially critical ones**, requiring a clinician's immediate attention and action」 | 同上 | `strong` |
| **重要边界**：IHI 该页是**工具页，不提供任何效果量证据**。**不可据此声称 SBAR 改善结局。** | 同上 | — |
| SBAR 证据综述（**存在，内容未能证实**） | Shahid, S., & Thomas, S. (2018). *SBAR Communication Tool for Handoff in Health Care – A Narrative Review*. **Safety in Health**. DOI [10.1186/s40886-018-0073-1](https://doi.org/10.1186/s40886-018-0073-1)，被引 127。**摘要未取得** | `weak`（仅题录） |
| **I-PASS：医疗错误率相对下降 23%，可预防不良事件相对下降 30%** | Starmer, A. J., et al. (2014). *Changes in Medical Errors after Implementation of a Handoff Program*. **NEJM** 371:1803–1812. DOI [10.1056/NEJMsa1405556](https://doi.org/10.1056/NEJMsa1405556)（PMID 25372088） | `medium-strong`（前瞻性干预、9 院、10,740 例入院；**非随机、无平行对照**） |
| 逐字：「In **10,740 patient admissions**, the medical-error rate decreased by **23%** from the preintervention period to the postintervention period (**24.5 vs. 18.8 per 100 admissions, P<0.001**), and the rate of preventable adverse events decreased by **30%** (**4.7 vs. 3.3 events per 100 admissions, P<0.001**). The rate of nonpreventable adverse events did not change significantly (3.0 and 2.8 events per 100 admissions, P=0.79). **Site-level analyses showed significant error reductions at six of nine sites.**」 | 同上 | `medium-strong` |
| 逐字（**最贴近「会话开始时回述状态」的部分**）：「Across sites, significant increases were observed in the inclusion of **all prespecified key elements in written documents and oral communication during handoff (nine written and five oral elements; P<0.001 for all 14 comparisons)**. There were **no significant changes … in the duration of oral handoffs (2.4 and 2.5 minutes per patient, respectively; P=0.55)**」 | 同上 | `medium-strong` |
| **边界**：23%/30% 是**相对**降幅（绝对降幅为每 100 例入院 5.7 例）；9 个站点只有 6 个显著；原文措辞是 "was associated with"，非因果。 | 同上 | — |
| **反证：安大略省强制推行手术安全清单未显著改善死亡率或并发症** | Urbach, D. R., et al. (2014). *Introduction of Surgical Safety Checklists in Ontario, Canada*. **NEJM** 370:1029–1038. DOI [10.1056/NEJMsa1308261](https://doi.org/10.1056/NEJMsa1308261)（PMID 24620866） | `strong`（101 家医院、~21.5 万例、行政数据近全样本、自然实验） |
| 逐字：「**101 hospitals** performed **109,341 and 106,370 procedures**, respectively. The adjusted risk of death … was 0.71% … before … and 0.65% … afterward (**odds ratio, 0.91; 95% CI, 0.80 to 1.03; P=0.13**). The adjusted risk of surgical complications was 3.86% … before and 3.82% … afterward (**odds ratio, 0.97; 95% CI, 0.90 to 1.03; P=0.29**).」「**Implementation of surgical safety checklists in Ontario, Canada, was not associated with significant reductions in operative mortality or complications.**」 | 同上 | `strong` |
| **WHO 手术安全清单原始多中心研究：死亡 1.5% → 0.8%，住院并发症 11.0% → 7.0%** | Haynes, A. B., et al. (2009). **NEJM** 360:491–499. DOI [10.1056/NEJMsa0810119](https://doi.org/10.1056/NEJMsa0810119)（PMID 19144931） | `medium`（8 城 8 院前后对照，非随机；存在时间趋势/霍桑效应风险） |
| 逐字：「The rate of death was **1.5%** before the checklist was introduced and declined to **0.8%** afterward (**P=0.003**). Inpatient complications occurred in **11.0%** of patients at baseline and in **7.0%** after introduction of the checklist (**P<0.001**).」 | 同上 | `medium` |
| **调和两者的元-元分析：清单只对「设计目标内」的指标有效** | Sotto, K. T., et al. (2021). *Impact of the WHO Surgical Safety Checklist Relative to Its Design and Intended Use: A Systematic Review and Meta-Meta-Analysis*. **JACS**. DOI [10.1016/j.jamcollsurg.2021.08.692](https://doi.org/10.1016/j.jamcollsurg.2021.08.692)，被引 78 | `medium-strong`（20 篇系统综述 + 24 项前后对照观察研究） |
| 逐字：「**The WHO SSC positively impacts the things it was explicitly designed to address and does not positively impact things it was not explicitly designed for.**」「Twenty systematic reviews were included for qualitative thematic analysis.」「Deep vein thrombosis was the only postoperative outcome assessed that did not favor use of the WHO SSC.」 | 同上 | `medium-strong` |
| **含义**：**标准化本身不是效果来源；被标准化的内容与真实投入才是。** | — | — |

### 4.3 中断、任务恢复与跨会话记忆（HCI 侧）

> **诚实警告**：本小节所有论文的**题录与引用量已核实**（Crossref），但 **ACM DL / Wiley / Springer 正文页对本次调研全面 403，且均非开放获取**，因此**没有任何逐字引文**。特别是常被引用的「打断后平均需要 X 分钟回到任务」这类具体数字，**本次无法核实到一手来源，下游不应引用。**

| 命题 | 来源 | 强度 |
|---|---|---|
| 「目标记忆」的激活模型（任务恢复时程的理论基础） | Altmann, E. M., & Trafton, J. G. (2002). *Memory for goals: an activation-based model*. **Cognitive Science** 26(1), 39–83. DOI [10.1207/s15516709cog2601_2](https://doi.org/10.1207/s15516709cog2601_2)，被引 440 | 存在性 `strong`；内容 `未核实` |
| 中断后恢复任务存在可测量的**恢复时程**（resumption lag），并有过程模型 | Altmann, E. M., & Trafton, J. G. (2007). *Timecourse of recovery from task interruption: Data and a model*. **Psychonomic Bulletin & Review** 14(6). DOI [10.3758/bf03193094](https://doi.org/10.3758/bf03193094)，被引 140 | `strong`（题录） |
| 碎片化工作的性质（经典 CHI 研究） | Mark, G., Gonzalez, V. M., & Harris, J. (2005). *No task left behind?: examining the nature of fragmented work*. **CHI 2005**. DOI [10.1145/1054972.1055017](https://doi.org/10.1145/1054972.1055017)。Crossref 被引 335 / Semantic Scholar 567。**无逐字引文** | 存在性 `strong`；内容 `未核实` |
| 计算环境中的打断与任务活动恢复 | Iqbal, S. T., & Horvitz, E. (2007). *Conversations Amidst Computing: A Study of Interruptions and Recovery of Task Activity*. DOI [10.1007/978-3-540-73078-1_43](https://doi.org/10.1007/978-3-540-73078-1_43)。**无逐字引文** | 存在性 `strong`；内容 `未核实` |
| **人们如何描述「找不到回去的路」** | Teevan, J. (2007). *"Where'd it go?": How people ask after lost Web information*. **ASIS&T** 44(1). DOI [10.1002/meet.1450440269](https://doi.org/10.1002/meet.1450440269)。逐字（摘要）：「This paper investigates the way people described the difficulties they encountered when returning to information on the Web. … including that **the path originally taken to get to the information target is commonly referred to during its re-retrieval**, and that **the temporal aspects of when the information was last seen were only important when** …」 | `medium`（定性） |
| 查询日志中的重新查找（大规模） | Tyler, S. K., & Teevan, J. (2010). *Large scale query log analysis of re-finding*. **WSDM 2010**. DOI [10.1145/1718487.1718512](https://doi.org/10.1145/1718487.1718512)，被引 90。**无逐字引文** | 存在性 `medium`；内容 `未核实` |
| 个人信息管理 / 「把找到的东西留住」 | Jones, W., Bruce, H., & Dumais, S. (2001). *Keeping found things found on the web*. **CIKM 2001**. DOI [10.1145/502585.502607](https://doi.org/10.1145/502585.502607)，被引 91。**无逐字引文** | 存在性 `medium`；内容 `未核实` |
| **不可引用**：Teevan 等 *How people re-find information when the web changes* —— **Crossref 无 DOI，疑为 MSR-TR，未能证实**。 | — | `未核实` |

### 4.4 对抗手段及其证据

| 手段 | 命题 | 来源 | 强度 |
|---|---|---|---|
| **强制回述关键要素的交接框架（最硬的正面证据）** | 见 §4.2 I-PASS：14 项（9 书面 + 5 口头）预设关键要素的纳入率**全部**显著提高（P<0.001 for all 14 comparisons），同时**口述交接时长没有显著变化**（2.4 → 2.5 分钟/病人，P=0.55） | Starmer et al. 2014 | `medium-strong` |
| **边界（重要）** | 该干预是一个**整包（bundle）**——含助记符、培训、观察与反馈。**无法把效果归因于「会话开始时回述状态」这一单独成分。****本次未能找到「recap 作为独立干预」的任何效果证据。** | — | — |
| **清单** | 见 §4.2：清单本身不等于效果（Haynes 2009 vs Urbach 2014 vs Sotto 2021） | — | — |
| **外部记忆 / 认知卸载** | 认知卸载综述（将认知负荷转移到外部载体被视为**适应性**策略，而非缺陷） | Risko, E. F., & Gilbert, S. J. (2016). *Cognitive Offloading*. **Trends in Cognitive Sciences** 20(9). DOI [10.1016/j.tics.2016.07.002](https://doi.org/10.1016/j.tics.2016.07.002)，被引 1,212。**摘要未能取得** | 存在性 `strong`；内容 `未核实` |
| **生成效应**：「自己生成的信息比读到的记得更牢」是被确立的现象 | Slamecka, N. J., & Graf, P. (1978). *The generation effect: Delineation of a phenomenon*. **JEP: Human Learning and Memory** 4(6). DOI [10.1037/0278-7393.4.6.592](https://doi.org/10.1037/0278-7393.4.6.592)，被引 813。**摘要未能取得** | 存在性 `strong`；内容 `未核实` |
| **外部化会削弱对该内容本身的记忆**（「谷歌效应」） | Sparrow, B., Liu, J., & Wegner, D. M. (2011). *Google Effects on Memory*. **Science** 333(6043). DOI [10.1126/science.1207745](https://doi.org/10.1126/science.1207745)，被引 1,196 | 存在性 `strong`；**具体效应遭重复失败** |
| 逐字（Crossref 收录的摘要全文，仅此一句）：「Owing to Internet search, **we are more likely to encode 'where' aspects of memory rather than 'what.'**」 | 同上 | `medium` |
| **重复失败** | Hesselmann, G. (2020). *No conclusive evidence that difficult general knowledge questions cause a "Google Stroop effect". A replication study*. **PeerJ** 8:e10325. DOI [10.7717/peerj.10325](https://doi.org/10.7717/peerj.10325) | `strong` |
| 逐字：「the 'Google Stroop effect' **could not be replicated in two recent replication attempts** as part of a large replicability project. After the failed replication was published in 2018, **the first author of the original study pointed out some problems with the design of the failed replication.** In our study, we therefore aimed to replicate the 'Google Stroop effect' with a research design closer to the original experiment. **Our results revealed no conclusive evidence** in favor of the notion that the concept of the Internet or internet access (via computers or smartphones) is automatically activated when participants are faced with hard trivia questions.」 | 同上 | `strong` |
| **精确边界** | 失败的是「Google Stroop 效应」（互联网概念自动激活），**不是** Sparrow 2011 的 **where/what 部分**。两方向的说法（「已证实」/「已被证伪」）都不准确。**必须分开表述。** | — | — |
| **反复总结是否导致信息衰减（最接近的直接证据）** | ABBEL: *Learning Natural-Language Belief States for Memory-Efficient Interaction*. arXiv:[2512.20111](https://arxiv.org/abs/2512.20111) | `medium`（预印本；对象是 LLM 智能体记忆，**非人类会议**） |
| 逐字：「Recent work reduces context lengths by instead conditioning decision-making agents on **recursively updated natural-language summaries**, which are concise and interpretable. **However, they underperform agents with access to the full context**, suggesting that they fail to generate sufficient summaries.」「we analyze the belief states generated by frontier models under ABBEL across five domains, and **verify that performance is often degraded due to omitting or incorrectly updating information.**」 | 同上 | `medium` |
| 递归摘要树中的冗余节点反而损害下游问答 | DTCRS: *Dynamic Tree Construction for Recursive Summarization*. arXiv:[2604.07012](https://arxiv.org/abs/2604.07012)。逐字：「summary trees often contain **a large number of redundant summary nodes**, which not only increase construction time but **may also negatively impact question answering**. Moreover, **recursive summarization is not suitable for all types of questions.**」 | `weak-medium`（预印本） |
| **`Model collapse`（作为类比）** | Shumailov, I., et al. (2024). *AI models collapse when trained on recursively generated data*. **Nature** 631, 755–759. DOI [10.1038/s41586-024-07566-y](https://doi.org/10.1038/s41586-024-07566-y) | `strong`（同行评审）/ **仅可作类比** |
| 逐字：「We find that indiscriminate use of model-generated content in training causes **irreversible defects** in the resulting models, in which **tails of the original content distribution disappear**. We refer to this effect as 'model collapse'」「In **early** model collapse, the model begins **losing information about the tails of the distribution**; in **late** model collapse, the model converges to a distribution that carries little resemblance to the original one, often with **substantially reduced variance**.」 | 同上 | `strong` |
| **边界**：这是**模型训练分布**问题，**不是人类会议纪要摘要**问题。论文亦指出 "access to the original data distribution is crucial"。**引用时必须标明是类比。** | 同上 | — |

### 4.5 「把人从丢失上下文中救回来」——证据空白的清单

以下是本次调研**明确未能找到**的（不是不存在，而是未找到；部分原因是出版商封锁）：

1. **「会话开始时 recap / 状态回述」作为独立干预的效果证据**。最强证据是 I-PASS/SBAR 这类整包 bundle，**无法把效果拆到 recap 这一个成分**。
2. **「可检索历史 / 可搜索会议记录是否降低失去线索感」的任何实证研究**。
3. **「会议纪要反复摘要导致人类信息衰减」的直接研究**（最近的只有 LLM 智能体记忆 ABBEL 与模型崩溃，均为类比）。
4. **需求获取或纵向访谈中「参与者丢失上下文」的定量证据**（Crossref 检索无直接测量该现象的高质量研究）。
5. **打断研究中的具体时间数字**（如「平均 11 分钟/25 分钟回到任务」）——ACM/Wiley/Springer 全面 403，均非 OA，**一手来源无法核实，请勿引用**。
6. **SBAR 综述（Shahid & Thomas 2018）的具体发现**；**Maier 等 2025 系统综述的结论方向**。
7. **Weinshall-Margel & Shapard 2011 与 Danziger 回复的原文逐字引文**。

### 4.6 可引用的、不依赖争议机制的对抗逻辑

- **把未决事项显式写下来有认知收益**（Masicampo & Baumeister 2011，两条独立题录，见 §3.7）— `medium-strong`（存在性）
- **写出计划（而不只是记住目标）可消除未完成目标对后续任务的干扰** — 同上
- **边界**：这两条**不**支持「显示一个精确的剩余数字」的有效性；也不支持任何具体的进度 UI 形态。
- **「自己生成的内容记得更牢」有确立的现象支持**（生成效应，Slamecka & Graf 1978）— 存在性 `strong`
- **「外部化会削弱记忆」这一常见推论证据受损**（Google Stroop 重复失败；认知卸载在文献中反被视为适应性策略）— 两个方向都不可过度断言

---

## 5. 渐进披露：摘要 + 全文的平衡

> 本节由独立并行检索产出。

### 5.1 渐进披露的原始定义与推荐

| 命题 | 来源 | 强度 |
|---|---|---|
| 逐字定义：「**Progressive disclosure defers advanced or rarely used features to a secondary screen, making applications easier to learn and less error-prone.**」 | Nielsen, J. (2006). *Progressive Disclosure*. NN/g — https://www.nngroup.com/articles/progressive-disclosure/ | `medium` |
| 逐字推荐：「**Initially, show users only a few of the most important options. Offer a larger set of specialized options upon request. Disclose these secondary features only if a user asks for them**, meaning that most users can proceed with their tasks without worrying about this added complexity.」 | 同上 | `medium` |
| **NN/g 自己给出的两条硬性前提**：「**You must get the right split between initial and secondary features. You have to disclose everything that users frequently need up front**, so that they have to progress to the secondary display only on rare occasions.」/「label the button or link in a way that sets clear expectations for what users will find when they progress to the next level. (In other words, **the progression should have strong information scent.**)」 | 同上 | `medium` |
| **NN/g 的收益断言没有任何实证引用**：「Progressive disclosure thus **improves 3 of usability's 5 components: learnability, efficiency of use, and error rate.**」「**Research says** that these are groundless worries…」——**以 "Research says" 引述但未给出任何具体研究、作者或 DOI** | 同上 | `weak`（未支撑断言） |

### 5.2 反证：把信息藏起来的代价

| 命题 | 来源 | 强度 |
|---|---|---|
| **折叠会降低用户对该信息的知晓度**：逐字「**Hiding content behind navigation diminishes people's awareness of it.** An extra step is required to see the information. Headings and titles must be descriptive and enticing enough to motivate people to 'spend' clicks on them. **When content is hidden, people might ignore information.**」「Accordions increase interaction cost. **Readers treat clicks like currency**… it doesn't take many wasted clicks to escalate people's reaction to full-blown defiance.」 | Loranger, H. (2014). *Accordions Are Not Always the Answer for Complex Content on Desktops*. NN/g — https://www.nngroup.com/articles/accordions-complex-content/ | `medium` |
| 同文给出的边界条件：「**If people need to open the majority of subtopics to have their questions answered or to get the full story then an accordion is not the way to go. In this situation, it's better to expose all the content at once.**」 | 同上 | `medium` |
| **信息气味理论**：逐字「The information scent of a source of information … represents **the user's imperfect estimate of the value that the source will deliver** to the user, derived from a representation of the source.」「if people have a question, they will decide which webpage to go to based on their estimate of (1) how likely it is that the page will provide an answer to their question, and (2) how long it's going to take to get the answer」 | Budiu, R. (2020). *Information Scent*. NN/g — https://www.nngroup.com/articles/information-scent/ | `medium` |
| 原始学术出处（信息觅食理论） | Pirolli, P., & Card, S. (1999). *Information foraging*. **Psychological Review** 106(4). DOI [10.1037/0033-295x.106.4.643](https://doi.org/10.1037/0033-295x.106.4.643)，被引 1,263。**仅核实存在与地位，未取得原文命题** | `strong`（存在性） |
| **「按需展开」在真实场景系统性失败的最硬数字**：逐字「An experimental survey (**N = 543**) … Results reveal **74% skipped PP**, selecting the 'quick join' clickwrap. … average PP reading time was **73 seconds**. … **98% missed NameDrop TOS 'gotcha clauses'** about data sharing with the NSA and employers, and about providing a first-born child as payment for SNS access.」 | Obar, J. A., & Oeldorf-Hirsch, A. (2018). *The biggest lie on the Internet*. **Information, Communication & Society**. DOI [10.1080/1369118x.2018.1486870](https://doi.org/10.1080/1369118x.2018.1486870)，被引 655 | `strong` |
| 普通网页一次访问**最多读 28% 的词，20% 更可能** | Nielsen, J. (2008). *How Little Do Users Read?* NN/g — https://www.nngroup.com/articles/how-little-do-users-read/（底层数据 Weinreich et al., *ACM ToW* 2(1), 2008） | `medium`（NN/g 自承样本「above-average intelligence」，外推用词是 "likely"） |

### 5.3 执行摘要的误读风险

| 命题 | 来源 | 强度 |
|---|---|---|
| **摘要中的 spin 会因果性抬高临床医生对疗效的判断**（两臂平行组 RCT，N=300，盲法）：逐字「For abstracts with spin, the experimental treatment was rated as being more beneficial (**mean difference, 0.71; 95% CI, 0.07 to 1.35; P = .030**) … **Spin in abstracts can have an impact on clinicians' interpretation of the trial results.**」 | Boutron, I., Altman, D. G., Hopewell, S., et al. (2014). SPIIN RCT. **J Clin Oncol**. DOI [10.1200/jco.2014.56.7503](https://doi.org/10.1200/jco.2014.56.7503)，被引 229 | `strong`（但效应量不大，CI 下界 0.07 接近 0） |
| **spin 沿摘要 → 新闻稿 → 新闻逐级传播**：逐字「'Spin' … was identified in **28 (40%) scientific article abstract conclusions** and in **33 (47%) press releases**. … the only factor associated with 'spin' in the press release was 'spin' in the article abstract conclusions (**RR 5.6, [95% CI 2.8–11.1], p<0.001**). Findings of RCTs based on press releases were **overestimated for 19 (27%) reports**. … based on the news item was **overestimated for ten (24%) reports**.」 | Yavchitz, A., Boutron, I., Bera, M., et al. (2012). **PLoS Medicine** 9(9). DOI [10.1371/journal.pmed.1001308](https://doi.org/10.1371/journal.pmed.1001308)，被引 207 | `strong`（关联设计，非因果） |
| **规范方明确假设「读者常常只凭摘要」**：逐字「Clear, transparent, and sufficiently detailed abstracts … are important, **because readers often base their assessment of a trial solely on information in the abstract.**」 | Hopewell, S., Clarke, M., Moher, D., et al. (2008). *CONSORT for reporting RCTs in journal and conference abstracts*. **PLoS Medicine** 5(1). DOI [10.1371/journal.pmed.0050020](https://doi.org/10.1371/journal.pmed.0050020)，被引 470 | `strong`（规范制定前提，**未给出量化数据**） |
| **现行规范要求摘要自带证据局限**：逐字「**Item 9: Strengths and limitations of evidence.** Brief summary of strength and limitations of evidence (e.g., inconsistency, imprecision, indirectness, or risk of bias, other supporting or conflicting evidence). **The abstract should briefly describe the strengths and limitations of the evidence across studies.**」 | Beller, E. M., Glasziou, P. P., Altman, D. G., et al. (2013). *PRISMA for Abstracts*. **PLoS Medicine** 10(4). DOI [10.1371/journal.pmed.1001419](https://doi.org/10.1371/journal.pmed.1001419)，被引 622 | `strong`（规范要求） |
| **边界**：这是「**应该怎么写**」的规定，**不是**「写了局限读者就不会误读」的效果证据。该效果**未被本次调研证实**。 | — | — |
| PRISMA 2020 确认存在 abstract checklist | Page, M. J., et al. (2021). **BMJ** 372:n71. DOI [10.1136/bmj.n71](https://doi.org/10.1136/bmj.n71)；https://www.prisma-statement.org/prisma-2020。**仅确认规范存在，未取得条目原文** | `strong`（作为规范） |

### 5.4 信息保持与结构

| 命题 | 来源 | 强度 |
|---|---|---|
| **分段原则（segmenting principle）** 确为多媒体学习中反复验证的独立原则 | Mayer, R. E. *Segmenting Principle*, in *Multimedia Learning*（Cambridge UP）。DOI [10.1017/9781316941355.015](https://doi.org/10.1017/9781316941355.015)。**仅核实原则与出处，未取得原文表述或效应量** | `medium` |
| 该原则在自主学习情境下仍有边界争议 | DOI [10.1002/acp.3560](https://doi.org/10.1002/acp.3560) | `medium` |
| **信号原则（signaling principle）**：用标题/线索标出结构 | Mayer, R. E. *Signaling Principle*, in *Multimedia Learning*. DOI [10.1017/9781316941355.010](https://doi.org/10.1017/9781316941355.010)。**未取得原文表述，不能断言效果大小** | `weak/medium` |
| **先行组织者（advance organizer）** 是更早的经典主张 | Ausubel, D. P. (1960). **Journal of Educational Psychology**. DOI [10.1037/h0046669](https://doi.org/10.1037/h0046669)，被引 847。**无逐字引文**，且长期存在可重复性争议（另见 DOI [10.2307/1169964](https://doi.org/10.2307/1169964)，1979） | `strong`（存在性） |

### 5.5 本节的关键空白

- **未能找到任何**关于渐进披露对任务绩效/错误率/满意度影响的**受控实验**。最接近的是 Muralidhar, Belloum & Ashok (2025), *Operationalizing selective transparency using progressive disclosure in AI clinical diagnosis systems*, **Int. J. Human-Computer Studies**, DOI [10.1016/j.ijhcs.2025.103591](https://doi.org/10.1016/j.ijhcs.2025.103591)——**仅确认存在（被引 13），无法核实其任何结论**（ScienceDirect captcha、S2 abstract 为 null、HAL 镜像被拦截）。
- **未能找到**「abstract-only 读者比 full-text 读者更严重高估疗效」的直接对照实验。可证实的是**间接路径**：SPIIN RCT（spin 抬高解读）+ Yavchitz（spin 传播）。**请勿声称存在此类对照实验。**
- **未能找到**「Manager's Summary / Policy brief 中决策者只读摘要」的实证。
- **未能找到**任何专门研究「summary + appendix」结构在合同/论文/技术文档中理解效果的工作。
- **注意同名不同物**：医学教育中的 "progressive disclosure questions (PDQ)"（DOI [10.1186/s13104-015-1603-0](https://doi.org/10.1186/s13104-015-1603-0)）指分步揭示病例信息的考题，与 UI 交互模式同名但不同物，**不可互相引证**。

---

## 6. 人机交互特有失效模式（人类侧 / agent 侧）

> 本节由独立并行检索产出。26 条发现，其中 17 条含直接抓取的逐字引文。

### 6.1 人类侧

| 命题 | 来源 | 强度 |
|---|---|---|
| **「误用」自动化 = 过度依赖，会导致监控失效或决策偏差** | Parasuraman, R., & Riley, V. (1997). *Humans and automation: Use, misuse, disuse, abuse*. **Human Factors** 39(2). DOI [10.1518/001872097778543886](https://doi.org/10.1518/001872097778543886)，Crossref 被引 3,610 | `strong` |
| 逐字：「**Misuse refers to over reliance on automation, which can result in failures of monitoring or decision biases.**」 | 同上 | `strong` |
| **自动化偏见同时产生遗漏错误与执行错误，且训练或指令无法消除** | Parasuraman, R., & Manzey, D. H. (2010). *Complacency and bias in human use of automation: An attentional integration*. **Human Factors** 52(3). DOI [10.1177/0018720810376055](https://doi.org/10.1177/0018720810376055)，被引 1,316 | `strong` |
| 逐字：「**Automation bias results in making both omission and commission errors** when decision aids are imperfect. Automation bias occurs in **both naive and expert participants, cannot be prevented by training or instructions**, and can affect decision making in individuals as well as in teams.」 | 同上 | `strong` |
| **重要细化**：作者主张它不是纯粹的决策偏差——「it also depends on **attentional processes** similar to those involved in automation-related complacency.」**降低多任务负荷可能优于「告诫用户不要盲信」。** | 同上 | `strong` |
| 自动化偏见的系统综述（频率、中介因素、缓解因素） | Goddard, K., Roudsari, A., & Wyatt, J. C. (2012). **JAMIA** 19(1). DOI [10.1136/amiajnl-2011-000089](https://doi.org/10.1136/amiajnl-2011-000089) | `strong`（范围）/ **频率数字 `不可引用`** |
| 逐字（Europe PMC 摘要）：「Of **13 821 retrieved papers, 74 met the inclusion criteria**.」+「User factors such as cognitive style, decision support systems (DSS), and task specific experience mediated AB, as did attitudinal driving factors such as **trust and confidence**. Environmental mediators included **workload, task complexity, and time constraint**. Mitigators of AB included implementation factors such as **training and emphasizing user accountability**, and DSS design factors such as **the position of advice on the screen, updated confidence levels attached to DSS output, and the provision of information versus recommendation**.」 | 同上 | `strong` |
| **算法厌恶**：人们在看到算法出错后会错误地弃用算法 | Dietvorst, B. J., Simmons, J. P., & Massey, C. (2015). *Algorithm aversion*. **JEP: General** 144(1). DOI [10.1037/xge0000033](https://doi.org/10.1037/xge0000033)，被引 2,637 | `strong` |
| **算法欣赏（反证）**：六个实验中，外行对**算法建议**的采纳**高于**对人的建议 | Logg, J. M., Minson, J. A., & Moore, D. A. (2019). *Algorithm appreciation*. **OBHDP** 151. DOI [10.1016/j.obhdp.2018.12.005](https://doi.org/10.1016/j.obhdp.2018.12.005)，被引 1,806 | `strong` |
| **关键边界**：逐字「**algorithm appreciation waned when: people chose between an algorithm's estimate and their own** (versus an external advisor's; Experiment 3) and **they had expertise in forecasting** (Experiment 4).」——「AI 质询产品负责人」的结构正好落在欣赏消退的区间。 | 同上 | `strong` |
| 对生成式 AI 的**更高信心**与**更少批判性思考**相关 | Lee, H.-P., Sarkar, A., Tankelevitch, L., et al. (2025). *The Impact of Generative AI on Critical Thinking*. **CHI '25**. DOI [10.1145/3706598.3713778](https://doi.org/10.1145/3706598.3713778) | `medium-strong`（**自报问卷**，N=319、936 例；非行为实验，不可升级为因果） |
| 逐字：「**higher confidence in GenAI is associated with less critical thinking**, while higher self-confidence is associated with more critical thinking.」 | 同上 | `medium-strong` |
| **道德褶皱区（moral crumple zone）**：责任被错误归给对自动化系统仅有有限控制的人类 | Elish, M. C. (2019). **Engaging Science, Technology, and Society** 5. DOI [10.17351/ests2019.260](https://doi.org/10.17351/ests2019.260)，被引 238 | `strong`（引文准确性）/ 概念/案例分析，**非实验** |
| 逐字：「I introduce the concept of a **moral crumple zone** to describe how responsibility for an action may be misattributed to a human actor who had limited control over the behavior of an automated or autonomous system… the human in a highly complex and automated system may become simply a component—accidentally or intentionally—that **bears the brunt of the moral and legal responsibilities** when the overall system malfunctions.」 | 同上 | `strong`（概念） |
| **责任缺口** | Matthias, A. (2004). *The responsibility gap*. **Ethics and Information Technology** 6(3). DOI [10.1007/s10676-004-3422-1](https://doi.org/10.1007/s10676-004-3422-1)。**仅核实题录，未取得原文** | 存在性 `medium` |
| **重要限定**：Matthias 讨论的是**学习型自动机**造成的归因缺口，**不等于**心理学意义上的「责任扩散」。不可混为一谈。 | — | — |
| 默认应答倾向（acquiescence / yes-saying）是可测量的**作答风格** | Baumgartner, H., & Steenkamp, J.-B. E. M. (2001). **Journal of Marketing Research** 38(2). DOI [10.1509/jmkr.38.2.143.18840](https://doi.org/10.1509/jmkr.38.2.143.18840)，被引 998。**仅核实题录** | 存在性 `medium` |
| 社会赞许性与默认应答的联合建模 | Steenkamp, J.-B. E. M., De Jong, M. G., & Baumgartner, H. (2010). **JMR** 47(2). DOI [10.1509/jmkr.47.2.199](https://doi.org/10.1509/jmkr.47.2.199)，被引 361 | `medium` |
| 认知反思测验（CRT） | Frederick, S. (2005). **Journal of Economic Perspectives** 19(4). DOI [10.1257/089533005775196732](https://doi.org/10.1257/089533005775196732)，被引 3,919。**仅核实存在，未取得原文** | 存在性 `medium` |
| **CRT 的效力争议**：CRT 题目同时需要**数字能力**才能答对 | Sinayev, A., & Peters, E. (2015). **Frontiers in Psychology** 6:532. DOI [10.3389/fpsyg.2015.00532](https://doi.org/10.3389/fpsyg.2015.00532)。逐字：「**CRT items also require numeric ability to be answered correctly**」 | `medium` |

### 6.2 Agent 侧

| 命题 | 来源 | 强度 |
|---|---|---|
| **谄媚（sycophancy）是当前一线助手的普遍行为，部分由人类偏好数据驱动** | Sharma, M., Tong, M., Korbak, T., et al. (Anthropic) (2023/ICLR 2024). *Towards Understanding Sycophancy in Language Models*. arXiv:[2310.13548](https://arxiv.org/abs/2310.13548) | `strong` |
| 逐字：「We first demonstrate that **five state-of-the-art AI assistants consistently exhibit sycophancy across four varied free-form text-generation tasks**… when a response matches a user's views, it is more likely to be preferred. Moreover, **both humans and preference models (PMs) prefer convincingly-written sycophantic responses over correct ones a non-negligible fraction of the time.**」 | 同上 | `strong` |
| **谄媚有明确边界——它命中的是主观题**：逐字「LLMs have sycophantic tendencies when answering queries that involve **subjective opinions** and statements that should elicit a contrary response based on facts. **In contrast, when faced with math tasks or queries with an objective answer, they, at various scales, do not follow the users' hints** by demonstrating confidence in generating the correct answers.」 | Ranaldi, L., & Pucci, G. (2023). arXiv:[2311.09410](https://arxiv.org/abs/2311.09410) | `medium`（arXiv，未同行评审） |
| **产品决策是主观题 → 正好落在风险最集中的区间。** | — | — |
| 更大的 LM 更会**重复用户偏好的答案**；RLHF 有时使情况更糟 | Perez, E., Ringer, S., Lukošiūtė, K., et al. (2022). arXiv:[2212.09251](https://arxiv.org/abs/2212.09251)。逐字：「**Larger LMs repeat back a dialog user's preferred answer ("sycophancy")**… We also find some of the first examples of **inverse scaling in RL from Human Feedback (RLHF), where more RLHF makes LMs worse.**」 | `medium-strong` |
| **多轮对话使 LLM 性能平均下降约 39%，且走错一步后不会恢复** | Laban, P., Hayashi, K., Zhou, C., & Neville, J. (2025). arXiv:[2505.06120](https://arxiv.org/abs/2505.06120) | `medium-strong`（大规模、200k+ 模拟对话；**预印本**；对话为**模拟**） |
| 逐字：「all the top open- and closed-weight LLMs we test exhibit significantly lower performance in multi-turn conversations than single-turn, with **an average drop of 39% across six generation tasks**. … **LLMs often make assumptions in early turns and prematurely attempt to generate final solutions, on which they overly rely.** In simpler terms, we discover that **when LLMs take a wrong turn in a conversation, they get lost and do not recover.**」 | 同上 | `medium-strong` |
| **长上下文的位置效应**：相关信息位置变化会显著影响性能 | Liu, N. F., Lin, K., Hewitt, J., et al. (2024). **TACL** 12. DOI [10.1162/tacl_a_00638](https://doi.org/10.1162/tacl_a_00638)（预印本 arXiv:[2307.03172](https://arxiv.org/abs/2307.03172)），被引 1,304 | `strong` |
| 逐字：「We find that **performance can degrade significantly when changing the position of relevant information**」 | 同上 | `strong` |
| **边界**：该文任务是多文档问答与键值检索，**不是**对话。把它外推为「访谈后段内容会被忽略」是**类比**，不是已验证结果。 | — | — |
| 幻觉综述（NLG，经典） | Ji, Z., Lee, N., Frieske, R., et al. (2023). **ACM Computing Surveys** 55(12). DOI [10.1145/3571730](https://doi.org/10.1145/3571730)，被引 4,466 | `strong`（作为综述） |
| 幻觉综述（LLM，配套引文） | Huang, L., Yu, W., Ma, W., et al. (2023). *A Survey on Hallucination in Large Language Models*. arXiv:[2311.05232](https://arxiv.org/abs/2311.05232) | `strong`（存在性） |
| 逐字（Ji et al. 摘要，Crossref 截断处）：「Natural Language Generation (NLG) has improved exponentially in recent years thanks to the development of sequence-to-sequence deep learning technologies such as Transformer-based language models… However, it is also apparent…」 | Ji et al. 2023 | `strong` |
| **明确空白**：**未找到任何量化「agent 编造用户回复」或「LLM 虚构引用」的研究。** | — | — |
| **沉默 / 不作为不构成同意**（GDPR 序言第 32 条） | https://gdpr-info.eu/recitals/no-32/ | `strong`（法律文本） |
| 逐字：「**Silence, pre-ticked boxes or inactivity should not therefore constitute consent.**」「Consent should be given by a **clear affirmative act** establishing a freely given, specific, informed and unambiguous indication of the data subject's agreement…」 | 同上 | `strong` |
| **边界**：这是**法律规范**，不是实证发现——它不证明 agent 实际会把沉默当同意。将其用作对话 agent 的设计原则是**类比**，需标注。 | — | — |
| **明确空白**：**未找到任何 HCI 关于对话智能体从沉默推断同意的实证研究。** | — | — |
| **chatbot 问卷优于静态问卷（反证）**：5,200+ 条自由文本，chatbot 组在参与度与 Gricean Maxims（informativeness, relevance, specificity, clarity）上显著更好 | Xiao, Z., Zhou, M. X., Liao, Q. V., et al. (2020). **ACM TOCHI** 27(3). DOI [10.1145/3381804](https://doi.org/10.1145/3381804)，被引 185 | `strong` |
| **边界**：测量的是开放式**问卷回答质量**，不是「追问是否问对了东西」；对照组是静态 Qualtrics 问卷，**不是人类访谈者**。**它不能证明 AI 追问优于人类追问。** | — | — |
| LLM 生成需求获取**访谈脚本** | Görer, B., & Aydemir, F. B. (2023). **IEEE RE Workshops (REW)**. DOI [10.1109/rew57809.2023.00015](https://doi.org/10.1109/rew57809.2023.00015)，被引 33。**仅核实题录，未取得摘要或失败模式** | `medium`（存在性） |
| **明确空白**：**未找到任何关于 LLM 生成「貌似合理但错误的需求」或「锚定人类」的实证研究。** | — | — |
| **解释不降低、反而提高接受率**（与正确性无关） | Bansal, G., Wu, T., Zhou, J., Fok, R., Nushi, B., Kamar, E., Ribeiro, M. T., & Weld, D. (2021). *Does the Whole Exceed its Parts? The Effect of AI Explanations on Complementary Team Performance*. **CHI '21**. DOI [10.1145/3411764.3445717](https://doi.org/10.1145/3411764.3445717)（预印本 arXiv:[2006.14779](https://arxiv.org/abs/2006.14779)），被引 582 | `strong` |
| 逐字：「While we observed **complementary improvements from AI augmentation**, they were **not increased by explanations**. Rather, **explanations increased the chance that humans will accept the AI's recommendation, regardless of its correctness.**」 | 同上 | `strong` |
| **认知强制（cognitive forcing）能降低过度依赖，但有用户体验代价** | Buçinca, Z., Malaya, M. B., & Gajos, K. Z. (2021). *To Trust or to Think*. **CSCW**. arXiv:[2102.09692](https://arxiv.org/abs/2102.09692) | `strong`（N=199 预注册） |
| 逐字：「Adding explanations to the AI decisions **does not appear to reduce the overreliance** and some studies suggest that it might even increase it.」「the results demonstrate that **cognitive forcing significantly reduced overreliance** compared to the simple explainable AI approaches. **However, there was a trade-off: people assigned the least favorable subjective ratings to the designs that reduced the overreliance the most.**」 | 同上 | `strong` |

---

## 7. 反证与失效条件（汇总）

### 7.1 提问节奏

1. **批量提问有一个真实的速度收益**：同屏题数增加会**缩短**作答时长，代价是项目无回答率上升与版面评价变差（Toepoel et al. 2009）。不是单向劣势。
2. **「越短越好」被 meta 分析作者本人否定**：Rolstad et al. 2011 同质性 P=0.03，作者明确说「内容与长度无法分离」，并建议**按内容而非长度**决策。
3. **「逐题优于批量」的对照组是静态表单，不是人类访谈者**（Kim et al. 2019；Xiao et al. 2020）。不能推出「AI 追问优于人类追问」。
4. **矩阵「5 行最优」的边界**：Grady et al. 只测了 5/10/20 行与 3/5/7 列，未测 1–4 行；「5」是**被测范围内的最优**，不是理论最优。
5. **顺序效应的方向不是单向的**：Schwarz & Strack 的语境效应包括同化与对比两种方向，不存在「正确顺序」的通用规则。
6. **认知访谈的强制顺序证据来自目击者记忆领域**，外推到需求工程属类比。

### 7.2 议程先行

1. **议程与会议质量只是横断自评相关**（Cohen et al. 2011，n=367，48 小时内回忆），**非实验、非因果**。
2. **设计固着明确反证结构先行的发散代价**（Jansson & Smith 1991；Cardoso & Badke-Schaub 2011 有对照组；Chrysikou & Weisberg 2005）。
3. **固着效应本身曾被质疑**（Purcell et al. 1993，标题即「do they exist?」）——效应不是无争议的。
4. **价值先行会压低想法数量**（Selart & Johansen 2011）——「先定大纲」有可测的发散代价。
5. **议程的遗漏框架效应**：McCombs & Shaw 1972 的议程设置理论是**大众传播**领域的、以媒体为对象的研究；用于「议程让人只回答被问到的问题」是**类比**。
6. **框架效应导致偏好反转**（Tversky & Kahneman 1981）——议程措辞本身会改变判断。
7. **刻意规划与涌现是连续谱**（Mintzberg & Waters 1985）——刚性议程会系统性丢失涌现成分。
8. **结构化冲突提高质量证据成立（Schweiger & Sandberg 1989）**，但**本次未能核实**「结构化方法降低成员满意度/接受度」这一常被引述的反面结论——Schweiger et al. 1986 原文未取得。
9. **「parking lot（溢出议题清单）」没有任何实证研究**。

### 7.3 决策台账

1. **台账的典型死法是启动后停滞**，不是从未启动（Buchgeher et al. 2023：约 50% 仓库只有 1–5 条 ADR）。
2. **ADR 收益的原始证据是 n≈6–10 的自报轶事**（Nygard 2011）。无对照、无量化。
3. **「人类可读」易被等同于「开发者可读」**：Nygard 与 Fowler 均自认 git 中的 ADR 对 PM/客户干系人不可达。
4. **追溯的结构性病灶是「生产者 ≠ 消费者」**（Gotel & Finkelstein 1994）——**若填台账的人不是看台账的人，台账必然退化**。
5. **追溯实践碎片化**：逐字「Individual efforts are ad hoc and localised」「Poor feedback regarding best practice」。
6. **（半）自动化追溯工具采纳率长期偏低**（Demi et al. 2020）。
7. **朴素台账公式在长跑流程中失真**：燃烧图 y 值「in general not equal to subtracting recently completed amount of work」，范围蔓延会让剩余数不降。
8. **剩余数可被系统性偏置**：长期高估 → 永远显得提前；长期低估 → 永远显得滞后。
9. **「理想线」被质疑**：「it's not generally true that the goal is to follow this line」。
10. **RAID 没有稳定规范定义**（D = Dependencies 或 Decisions）→ 跨组织不可比，统计口径漂移。
11. **PRINCE2 官方体系本身允许合并登记册**（「you can merge multiple management products into a single entity」）——「必须分类齐全」不是标准要求。
12. **本次未找到**「RAID / 风险登记册沦为没人读的官僚产物」的任何可靠实证来源；只有泛泛的「cultural buy-in and tool integration」挑战。
13. **「显示『已被 X 取代』是否帮助或干扰理解」——没有任何实证答案。** 两个最有价值的候选（Tam & Greenberg 2006；CHI 2024 受限高亮）都只核实到题录。

### 7.4 长流程上下文丢失

1. **「决策疲劳」作为一个一般性构念，证据不足以支撑因果断言**：原始研究自己的措辞是 "suggest"，且**没有测量饥饿或心理损耗**（Danziger et al. 2011）；PNAS 同期评论指出分析中被忽略的因素（Weinshall-Margel & Shapard 2011，仅核实题录）；**模拟再分析显示陡降大部分可由「理性时间管理 + 选择性脱落」的统计假象解释**（Glöckner 2016）；2025 年**注册报告在大规模医护实地数据上直接零结果（BF0+ > 22）**（Andersson et al. 2025）。**不应作为硬前提引用。**
2. **但不可反过来说「已被证伪」**：Glöckner 自己承认假象只解释 **15%–45%** 的降幅（"can explain the findings by DLA only in parts"），并列出模拟解释不了的残留。正确表述是**原始因果解释不成立、效应量被高估**，而非「效应不存在」。
3. **「自我损耗」作为机制基本未被重复**：23 实验室、N=2,141，**d = 0.04，95% CI [−0.07, 0.15] 跨零**（Hagger et al. 2016）。任何「心理资源耗尽导致会末草率」的机制解释都缺乏支撑。
4. **构念缺乏可操作化**：概念分析只找到 17 篇相关文献，且 "the extant literature failed to adequately describe consequences of decision fatigue"（Pignatiello et al. 2018）。
5. **「问卷越长响应率越低」不是元分析支持的最强因子**：Cook et al. 2000 列出的是联系次数、个性化联系、预联系。该结论常被误引。
6. **清单没有普适效果**：Haynes et al. 2009（死亡 1.5%→0.8%）与 Urbach et al. 2014（101 家医院、~21.5 万例、OR 0.91 [0.80–1.03]、P=0.13）结论相反；Sotto et al. 2021 调和为「**只对设计目标内有效**」。I-PASS 也只在 9 个站点中的 6 个显著。**标准化本身不是效果来源。**
7. **「会话开始时 recap」没有独立证据**：最强证据是 I-PASS/SBAR 这类整包 bundle，**无法把效果拆到 recap 这一个成分**。
8. **外部化有正反两面且证据受损**：生成效应支持「自己生成记得更牢」；「外部化降低对被外部化内容的记忆」的常见推论所依赖的 **Google Stroop 效应在两次重复 + 一次改进设计的重复中均失败**（Hesselmann 2020），而认知卸载在文献中反被视为**适应性**策略（Risko & Gilbert 2016）。
9. **「反复总结会退化」没有针对人类会议纪要的直接研究**：最接近的是 LLM 智能体记忆（ABBEL：递归摘要智能体的表现**劣于**全上下文智能体，原因是 "omitting or incorrectly updating information"）与 `Model collapse`（Nature 2024），**两者都只能作类比**。
10. **递归摘要的边界**：摘要树中的冗余节点 "may also negatively impact question answering"，且 "recursive summarization is not suitable for all types of questions"（DTCRS）。
11. **HCI 侧的具体时间数字（「平均 11 分钟/25 分钟」）本次无法核实到一手来源**——ACM/Wiley/Springer 全面 403 且均非 OA。**请勿引用。**

### 7.5 渐进披露

1. **渐进披露的收益断言没有任何可核验的实证引用**（NN/g 2006 以 "Research says" 引述，无作者无 DOI）。这是本节最重要的负面发现。
2. **NN/g 自己承认折叠会降低信息知晓度**——默认失败模式是「藏了 = 用户永远看不到」。
3. **信息气味是硬约束**：低信息气味的二级入口等价于信息删除。
4. **在 ToS/隐私政策场景，按需披露已被证明系统性失效**（74% 跳过、98% 漏掉陷阱条款）。
5. **摘要确实会被当成全部**（CONSORT 前提假设 + SPIIN RCT + Yavchitz 传播链），但**正确对策是「摘要自带局限」，且该对策的效果本身未被验证**。
6. **「分段/结构化有帮助」的学术根基研究的是学习材料**；外推到「执行摘要 + 正文 + 附录」的企业文档结构属**未经检验的类推**。
7. **「报告阅读存在 primacy effect」没有任何应用于长文档阅读的研究**——属未经证实的类推。

### 7.6 人机交互失效模式

1. **算法欣赏 > 算法厌恶**（Logg et al. 2019，六实验）；但**欣赏在「人在算法与自己的判断之间选择」以及「人有专业经验」时消退**——正是「AI 质询产品负责人」的结构。
2. **「算法厌恶」可能是假设性elicitation的产物**：Logg & Schlund 2024, DOI [10.2139/ssrn.4687557](https://doi.org/10.2139/ssrn.4687557)（预印本，`weak-medium`）逐字：「When making judgments, people consistently utilize algorithmic advice more than human advice. In contrast, hypotheticals produce unstable preferences… suggesting that **algorithm aversion may be less stable than previous research leads us to believe.**」
3. **AI 增强确实产生了互补性提升**（Bansal et al. 2021）——失败的只是「解释能进一步增加互补性」。
4. **过度依赖是可降低的**：认知强制有效（Buçinca et al. 2021），代价是主观满意度下降。
5. **chatbot 问卷在参与度与 Gricean 质量上优于静态问卷**（Xiao et al. 2020）——这是对 AI 访谈的**正面**证据，常被反向误引。
6. **谄媚有边界**：客观/数学任务会抵抗用户暗示（Ranaldi & Pucci 2023）。风险集中在主观任务。
7. **临床决策支持总体改善绩效，尽管引入新错误**（Goddard et al. 2012 摘要：「Although most research shows overall improved performance with use, there is often a failure to recognize the new errors that CDSS can introduce.」）。
8. **自动化偏见部分根植于注意过程，不是纯决策偏差**（Parasuraman & Manzey 2010）——降低多任务负荷可能优于「告诫不要盲信」。
9. **「Google Stroop 效应」重复失败**（见 7.4.3）。

---

## 8. 对 CARD-07 的可落地含义（只列「有哪些做法可选」，不排序、不推荐）

> 以下仅列出**在文献中出现过的做法选项**及其证据锚点。**不做排序、不做推荐、不判断适用性。**

**A. 每轮投放量的控制形态**
- 固定上限的批量（如「每轮不超过 N 项」）——锚点：Grady et al. 2018（行数 5/10/20 的流失与难度曲线，最优落在 5）
- 按屏幕/批次切分（同屏少题 vs 多题）——锚点：Toepoel et al. 2009；Peytchev et al. 2006（翻页 vs 滚动）
- 逐题顺序推进——锚点：Kim et al. 2019；Xiao et al. 2020（对话式 vs 静态表单）
- 按总量预算而非轮次预算（如「每 100 题 2% 流失」的曲线）——锚点：Hoerger 2010
- 不设固定轮次，按未决问题触发——**本次未找到直接实证**；CARD-07 的 FR-36 属该类，但外部证据不覆盖

**B. 顺序与依赖的编排形态**
- 先自由发散、后具体收敛的强制顺序——锚点：Geiselman & Fisher 认知访谈
- 按依赖关系做前置/后置（前置未定则不展开后置）——锚点：Keeney & Raiffa（偏好独立性理论）；**操作性建议未取得**
- 静默生成 → 轮流陈述 → 开放讨论 → 独立确认的序列——锚点：Harvey & Holmes 2012（NGT）
- 多轮问卷 + 受控反馈的迭代序列——锚点：Dalkey & Helmer 1963（Delphi）
- 结构化对抗角色（魔鬼代言 / 辩证质询）——锚点：Schweiger & Sandberg 1989；Schweiger et al. 1986
- 每轮回显当前状态（recap）——**本次未找到直接实证**

**C. 议程 / 大纲的生成与使用形态**
- 会前定议程并逐项推进——锚点：Cohen et al. 2011；Leach et al. 2009
- 大纲先行（先目标后方案）——锚点：Selart & Johansen 2011（**同时给出数量下降的证据**）
- 大纲作为「可被修改的临时结构」而非锁定框架——锚点：Mintzberg & Waters 1985（刻意 vs 涌现连续谱）
- 结构化议程 + 溢出议题通道（parking lot 类）——**本次未找到任何实证**
- 无固定议程的自组织形态（Open Space）——锚点：Owen 1998（`weak`，无效果证据）

**D. 决策台账 / 进度可视化的形态**
- 逐条决策记录 + 状态字段（proposed / accepted / superseded）+ 指向替代者的链接——锚点：Nygard 2011；Fowler；ADR 模板生态
- 单调编号、不复用、旧记录保留——锚点：Nygard 2011
- 全部记录的集合构成「决策日志」——锚点：adr.github.io
- 矩阵式追溯表（RTM）——锚点：Wikipedia traceability matrix；**成本收益实证缺失**
- 累积流量式视图（各状态数量 + 总量）——锚点：PMBOK 7 转引；Petersen et al. 2011（单案例）
- 燃烧式剩余量视图——锚点：**注意三条已知失真**（估算偏置、总量变动、理想线误用）
- 登记册合并为单一实体——锚点：PRINCE2 wiki 明确允许
- 「完成」的显式定义（Definition of Done）——锚点：Scrum Guide 2020
- 把未决项显式写下来——锚点：Masicampo & Baumeister 2011（两条）
- 让台账的生产者同时是消费者——锚点：Gotel & Finkelstein 1994

**E. 渐进披露的呈现形态**
- 摘要 + 可按需展开的全文——锚点：Nielsen 2006
- 摘要自带证据局限——锚点：PRISMA for Abstracts Item 9
- 分层分段（segmenting）——锚点：Mayer segmenting principle（**外推到企业文档属类比**）
- 用标题/线索标出结构（signaling）——锚点：Mayer signaling principle
- 全部内容一次展开（适用于「多数子项都需要看」的场景）——锚点：Loranger 2014 给出的边界条件
- 强信息气味的入口标签——锚点：Budiu 2020；Pirolli & Card 1999

**F. 人机协作的防失效形态**
- 降低多任务负荷（针对自动化偏见的注意机制）——锚点：Parasuraman & Manzey 2010
- 认知强制（要求用户先给出自己的判断再看 AI 建议）——锚点：Buçinca et al. 2021（**有主观满意度代价**）
- 提供信息而非直接给建议；显示置信度；强调用户问责——锚点：Goddard et al. 2012 摘要列举的 mitigators
- 显式确认（把沉默排除在同意之外）——锚点：GDPR Recital 32（**法律规范，非实证**）
- 对主观题保持额外警惕——锚点：Ranaldi & Pucci 2023
- 防止「前几轮假设被过度依赖」——锚点：Laban et al. 2025

---

## 9. 不可引用清单

> 以下均为流传很广、但经本文核实后**流行版本超出原始来源**（或**无法核实**）的说法。

### 9.1 「人一次只能记住 7±2 件事」——**原始文献明确否认**

原始文献：Miller, G. A. (1956). *The Magical Number Seven, Plus or Minus Two: Some Limits on Our Capacity for Processing Information*. **Psychological Review** 63, 81–97。本文已抓取全文（授权镜像 http://www.musanim.com/miller1956/）。**Miller 实际说的是：**

1. **他把这个数字视为对自己的「迫害」**，逐字：「My problem is that **I have been persecuted by an integer.** For seven years this number has followed me around, has intruded in my most private data, and has assaulted me from the pages of our most public journals.」
2. **他明确警告不要把三种「七」混为一谈**，逐字：「there is a span of absolute judgment that can distinguish about seven categories and that there is a span of attention that will encompass about six objects at a glance. What is more natural than to think that all three of these spans are different aspects of a single underlying process? **And that is a fundamental mistake**, as I shall be at some pains to demonstrate.」
3. **他把两类限制严格区分**，逐字：「**Absolute judgment is limited by the amount of information. Immediate memory is limited by the number of items.**」「In spite of the coincidence that the magical number seven appears in both places, the span of absolute judgment and the span of immediate memory are **quite different kinds of limitations**.」
4. **他明确承认「chunk」没有清楚定义**，逐字：「The contrast of the terms bit and chunk also serves to highlight the fact that **we are not very definite about what constitutes a chunk of information.**」
5. **他的核心主张是容量可以「变大」而不是上限是 7**，逐字：「Since the memory span is a fixed number of chunks, **we can increase the number of bits of information that it contains simply by building larger and larger chunks**, each chunk containing more information than before.」
6. **他最终怀疑 7 只是巧合**，逐字：「I suspect that it is only a **pernicious, Pythagorean coincidence.**」

后续修正：Cowan, N. (2001). *The magical number 4 in short-term memory*. **Behavioral and Brain Sciences** 24(1)。DOI [10.1017/s0140525x01003922](https://doi.org/10.1017/s0140525x01003922)，被引 4,689。逐字：「Miller (1956) summarized evidence that people can remember about seven chunks in short-term memory (STM) tasks. However, **that number was meant more as a rough estimate and a rhetorical device than as a real capacity limit.** Others have since suggested that there is a more precise capacity limit, but that it is only three to five chunks. The present target article brings together a wide variety of data on capacity limits suggesting that **the smaller capacity limit is real.**」「**A single, central capacity limit averaging about four chunks is implicated**」

同时注意 Cowan 自己的限定，逐字：「Capacity limits will be useful in analyses of information processing **only if the boundary conditions for observing them can be carefully described.**」

**因此不可引用为**：
- 「UI 菜单最多放 7 项」
- 「人在任何场景下只能跟踪 7 个未决事项」
- 「7±2 是工作记忆容量上限」

**原文不支持，且方向相反（Miller 的重点是 chunking 可以扩展容量）。**

**另一个不可引用项**：「chunking 让人能记住更多**条独立的项**」——Miller 原意是 chunk **变大**、每个 chunk 含更多 bit，而 **chunk 数量上限不变**。

### 9.2 「渐进式披露是 Nielsen / Carroll 提出的」——**归属不成立**

- Nielsen 2006 是**权威准则化表述**，但他自己称之为既有惯例，逐字：「long been one of application design's primary guidelines」；文中**没有声称自己发明了这个术语**。
- **Carroll 的可确证贡献是「极简主义教学 / Nurnberg Funnel」**（DOI [10.1109/hicss.1990.205259](https://doi.org/10.1109/hicss.1990.205259)；[10.7551/mitpress/4616.003.0003](https://doi.org/10.7551/mitpress/4616.003.0003)），**本次未能找到任何一手文献把 "progressive disclosure" 一词归给他**。
- 维基百科给出的最早构想是 Woolsey 1985，但措辞是「**what could be considered as** the seminal idea」，且其 References 段落在 API 返回中为空，**原始文献无法追溯**。
- **正确表述**：Nielsen (2006) 给出了该模式的权威准则化表述；**术语的正式起源尚无一手证据可确证**。

### 9.3 「NN/g 说渐进式披露提升绩效」——**未附任何研究引用**

NN/g 原文确实写「Progressive disclosure thus improves 3 of usability's 5 components: learnability, efficiency of use, and error rate.」并写「Research says…」，但**通篇未给出任何具体研究、作者或 DOI**。引用时必须标注这是**设计准则断言**，不是实证结论。

### 9.4 「To Trust or to Think」不是 Bansal 的论文——**归属错误**

- **Buçinca, Z., Malaya, M. B., & Gajos, K. Z. (2021). *To Trust or to Think*. CSCW.** arXiv:[2102.09692](https://arxiv.org/abs/2102.09692)
- **Bansal, G., et al. (2021). *Does the Whole Exceed its Parts?* CHI.** DOI [10.1145/3411764.3445717](https://doi.org/10.1145/3411764.3445717)
- 两篇是不同论文、不同发现。简报若把二者合并，属引用错误。

### 9.5 Goddard et al. 2012 的「自动化偏见发生率」百分比——**不可引用**

该文摘要实际只给出「Of 13 821 retrieved papers, 74 met the inclusion criteria」加中介/缓解因素清单。**本次未能取得全文**（OA PDF、PMC、Europe PMC fullTextXML 全部失败）。**不要引用任何「自动化偏见发生率为 X%」的数字。**

### 9.6 「Twitter 上 59% 的分享链接从未被点击」——**具体数字不可核实**

论文存在：Gabielkov, M., Ramachandran, A., Chaintreau, A., & Legout, A. (2016). *Social Clicks: What and Who Gets Read on Twitter?* DOI [10.1145/2896377.2901462](https://doi.org/10.1145/2896377.2901462)，被引 313。但**摘要被出版商 elide，ACM DL 被拦截，HAL 镜像被反爬拦截**，任何具体百分比**无法逐字核实**。**请勿引用具体数字。**

### 9.7 「报告阅读存在 primacy effect，所以执行摘要最重要」——**未经证实的类推**

只有经典记忆心理学文献（Postman & Phillips 1965, DOI [10.1037/h0022013](https://doi.org/10.1037/h0022013)）。**没有找到任何把序列位置效应应用于长文档/报告阅读行为的研究。**

### 9.8 「RAID log 源自 PRINCE2 / OGC」——**未能证实**

PRINCE2 官方管理产品清单里**没有**「RAID log」（只有 Project Log、Daily log、Issue register、Lessons log、Quality register、Risk register、Product register）。**不要引用任何关于 RAID 起源的断言。**

### 9.9 「燃烧图是 Scrum 官方定义的一部分」——**不成立**

Scrum Guide 2020 中**没有** burndown chart。Scrum 的「剩余工作可见」载体是 Sprint Backlog 及其 commitment（Sprint Goal）。**不要把 burndown 说成 Scrum 规范的一部分。**

### 9.10 「存在『abstract-only 读者 vs full-text 读者』的直接对照实验」——**不存在（本次未找到）**

可证实的是**间接路径**：SPIIN RCT（摘要 spin 因果性抬高疗效判断）+ Yavchitz（spin 从摘要传播到新闻稿与新闻）。**请勿声称存在此类对照实验。**

### 9.11 「决策疲劳已被证明会降低长流程中的回答质量」——**证据不足**

见 §4.1 与 §7.4.1–7.4.4。四个独立问题：(1) 原始研究措辞是 "suggest" 且**没有测量疲劳**；(2) PNAS 评论指出被忽略的因素；(3) Glöckner 2016 的模拟显示陡降大部分是统计假象（但只解释 15%–45%）；(4) 2025 年注册报告在大规模医护数据上零结果（BF0+ > 22）。**不应作为硬前提引用。**

**同样不可引用为**：「饥饿法官效应已被证伪」——Glöckner 的结论是效应**被高估**、原始分析 "do not provide conclusive evidence"，不是「不存在」。

### 9.11b 「WHO 手术安全清单可普遍降低死亡率与并发症」——**不成立**

Urbach et al. 2014 在 101 家医院、约 21.5 万例上未发现显著改善（OR 0.91，95% CI 0.80–1.03，P=0.13）。Sotto et al. 2021 的元-元分析结论是「**只对设计目标内有效**」。**清单的效果取决于内容与真实投入，不取决于「有清单」这件事本身。**

### 9.11c 「I-PASS 把医疗错误降低 23%」当作绝对降幅——**错误**

这是**相对**降幅；绝对降幅为每 100 例入院 5.7 例（24.5 → 18.8）。且 9 个站点中只有 **6 个**显著。

### 9.11d 「问卷越长响应率越低（元分析证实）」——**常被误引**

Cook, Heath & Thompson (2000) 的摘要列出的最强预测因子是「**联系次数、个性化联系、预联系**」，**未把问卷长度列为主因**。

### 9.12 「Google 效应证明外部记录会让人遗忘」——**精确边界**

失败的是「Google Stroop 效应」（互联网概念自动激活），**不是** Sparrow 2011 的 where/what 部分（「更可能编码『在哪』而非『是什么』」）。两个方向的说法（「已证实」/「已被证伪」）都不准确，**必须分开表述**。

### 9.13 「Skitka et al. 1999 / Matthias 2004 / Risko & Gilbert 2016 / Paulhus 1984 / Frederick 2005 / Baumgartner & Steenkamp 2001 的具体措辞」

以上文献**仅核实题录**（作者、期刊、年份、DOI、引用数），**未能取得正文或摘要**。若需引用其具体结论，须另找可访问来源。**尤其**：Paulhus 1984 的原始章节未能定位，只找到 PsycTESTS 量表记录（DOI [10.1037/t58985-000](https://doi.org/10.1037/t58985-000)、[10.1037/t08059-000](https://doi.org/10.1037/t08059-000)）——**不可用量表记录代替理论出处**。

### 9.14 「Breaking the Silence: Progress and Prospects of Chatbot Interviews」——**未能定位，不要引用**

### 9.15 「仅核实题录」的条目清单

**可以引用其存在、出处与地位，不可引用其具体结论或效应量**，除非另行取得原文。

Galesic & Bosnjak 2009 / Herzog & Bachman 1981 / Peytchev 2009 / Davis et al. 2006 / Mingers & Rosenhead 2004 / Schweiger et al. 1986 / Leach et al. 2009 / Jansson & Smith 1991 / Vasconcelos & Crilly 2016 / Pirolli & Card 1999 / Görer & Aydemir 2023 / Tam & Greenberg 2006 / CHI 2024 受限高亮 / **Altmann & Trafton 2002** / **Mark, Gonzalez & Harris 2005** / **Iqbal & Horvitz 2007** / **Tyler & Teevan 2010** / **Jones, Bruce & Dumais 2001** / **Risko & Gilbert 2016** / **Slamecka & Graf 1978** / **Vohs et al. 2008** / **Shahid & Thomas 2018** / **Maier et al. 2025（Health Psychology Review）** / **Pignatiello et al. 2018（引文已取得，但构念分析本身未通读）** / **Weinshall-Margel & Shapard 2011** / **Danziger et al. 2011 回复**

### 9.16 「需求获取/纵向访谈中参与者丢失上下文的定量证据」——**不存在（本次未找到）**

另一路并行检索在 Crossref 上未找到任何直接测量该现象的高质量研究。**不要把问卷方法学的流失率数据说成「访谈中参与者丢线索」的证据**——这是跨域类比。

### 9.17 「打断后平均需要 N 分钟回到任务」——**数字不可核实**

Mark/Gonzalez/Harris 2005、Altmann & Trafton 2002/2007、Iqbal & Horvitz 2007、Tyler & Teevan 2010、Jones/Bruce/Dumais 2001 的**题录与引用量已核实**，但 ACM DL / Wiley / Springer 正文页全面 403 且均非 OA，**没有任何逐字引文**。流传的「11 分钟」「25 分钟」这类数字**本次无法核实到一手来源，请勿引用**。

---

## 10. 来源清单

### 10.1 提问节奏 / 问卷方法学 / 需求工程

| # | 来源 | URL / DOI | 强度 |
|---|---|---|---|
| 1 | Krosnick 1991, *Response strategies for coping with the cognitive demands of attitude measures in surveys*, Applied Cognitive Psychology | https://doi.org/10.1002/acp.2350050305 | strong |
| 2 | Krosnick 1999, *Survey Research*, Annual Review of Psychology | https://doi.org/10.1146/annurev.psych.50.1.537 | strong |
| 3 | Krosnick, Holbrook & Berent 2001, *The Impact of "No Opinion" Response Options on Data Quality*, POQ | https://doi.org/10.1086/341394 | strong |
| 4 | Grady, Greenspan & Liu 2018, *What Is the Best Size for Matrix-Style Questions in Online Surveys?*, Social Science Computer Review | https://doi.org/10.1177/0894439318773733 | strong |
| 5 | Toepoel, Das & van Soest 2009, *Design of Web Questionnaires: The Effects of the Number of Items per Screen*, Field Methods | https://doi.org/10.1177/1525822x08330261 | strong |
| 6 | Peytchev, Couper, McCabe & Crawford 2006, *Web Survey Design: Paging versus Scrolling*, POQ | https://doi.org/10.1093/poq/nfl028 | strong |
| 7 | Mavletova & Couper 2014, *Mobile Web Survey Design: Scrolling versus Paging*, JSSAM | https://doi.org/10.1093/jssam/smu015 | medium-strong |
| 8 | Mavletova, Couper & Lebedev 2017, *Grid and Item-by-Item Formats in PC and Mobile Web Surveys*, SSCORE | https://doi.org/10.1177/0894439317735307 | medium-strong |
| 9 | de Bruijne & Wijnant 2014, *Improving Response Rates and Questionnaire Design for Mobile Web Surveys*, POQ | https://doi.org/10.1093/poq/nfu046 | medium |
| 10 | Peytchev & Hill 2009, *Experiments in Mobile Web Survey Design*, SSCORE | https://doi.org/10.1177/0894439309353037 | medium |
| 11 | Rolstad, Adler & Rydén 2011, *Response Burden and Questionnaire Length: Is Shorter Better?*, Value in Health | https://doi.org/10.1016/j.jval.2011.06.003 | strong |
| 12 | Hoerger 2010, *Participant Dropout as a Function of Survey Length*, Cyberpsychology, Behavior, and Social Networking | https://doi.org/10.1089/cyber.2009.0445 | medium-strong |
| 13 | Galesic & Bosnjak 2009, *Effects of Questionnaire Length on Participation and Indicators of Response Quality in a Web Survey*, POQ | https://doi.org/10.1093/poq/nfp031 | 存在性 strong（结果未核实） |
| 14 | Herzog & Bachman 1981, *Effects of Questionnaire Length on Response Quality*, POQ | https://doi.org/10.1086/268687 | 存在性 strong（结果未核实） |
| 15 | Peytchev 2009, *Survey Breakoff*, POQ | https://doi.org/10.1093/poq/nfp014 | 存在性 medium |
| 16 | Clifford & Jerit 2015, *Do Attempts to Improve Respondent Attention Increase Social Desirability Bias?*, POQ | https://doi.org/10.1093/poq/nfv027 | medium |
| 17 | Kim, Lee & Gweon 2019, *Comparing Data from Chatbot and Web Surveys*, CHI | https://doi.org/10.1145/3290605.3300316 | strong |
| 18 | Xiao, Zhou, Liao et al. 2020, ACM TOCHI 27(3) | https://doi.org/10.1145/3381804 | strong |
| 19 | Schwarz & Strack 1991, *Context Effects in Attitude Surveys*, European Review of Social Psychology | https://doi.org/10.1080/14792779143000015 | strong |
| 20 | Schuman & Presser 1981, *Questions and Answers in Attitude Surveys*（书评记录） | https://doi.org/10.2307/3151742 ; https://doi.org/10.2307/2578327 | medium（存在性） |
| 21 | Tourangeau, Rips & Rasinski 2000, *The Psychology of Survey Response*（相关章节） | https://doi.org/10.1093/acprof:oso/9780199747047.003.0004 | medium（存在性） |
| 22 | Geiselman, Fisher, MacKinnon & Holland 1985, J. Applied Psychology | https://doi.org/10.1037/0021-9010.70.2.401 | strong |
| 23 | Geiselman, Fisher, MacKinnon et al. 1986, American Journal of Psychology | https://doi.org/10.2307/1422492 | strong |
| 24 | Keeney & Raiffa, *Decisions with Multiple Objectives* | https://doi.org/10.1017/cbo9781139174084 | strong（理论） |
| 25 | Selart & Johansen 2011, *Understanding the Role of Value-Focused Thinking in Idea Management* | https://doi.org/10.1111/j.1467-8691.2011.00602.x | medium |
| 26 | Dalkey & Helmer 1963, *An Experimental Application of the DELPHI Method*, Management Science | https://doi.org/10.1287/mnsc.9.3.458 | strong |
| 27 | Holey, Feeley & Dixon 2007, BMC Medical Research Methodology | https://doi.org/10.1186/1471-2288-7-52 | strong |
| 28 | Trevelyan & Robinson 2015, European Journal of Integrative Medicine | https://doi.org/10.1016/j.eujim.2015.07.002 | strong |
| 29 | Harvey & Holmes 2012, *Nominal group technique*, Int. J. Nursing Practice | https://doi.org/10.1111/j.1440-172x.2012.02017.x | medium-strong |
| 30 | Davis, Dieste, Hickey et al. 2006, *Effectiveness of Requirements Elicitation Techniques*, RE'06 | https://doi.org/10.1109/re.2006.17 | 存在性 strong（结果未核实） |
| 31 | Pacheco, García & Reyes 2018, *Requirements elicitation techniques: a systematic literature review*, IET Software | https://doi.org/10.1049/iet-sen.2017.0144 | medium |
| 32 | Spoletini, Ferrari, Bano et al. 2018, *Interview Review*, LNCS | https://doi.org/10.1007/978-3-319-77243-1_7 | medium |

### 10.2 议程先行 / 会议 / 结构化决策

| # | 来源 | URL / DOI | 强度 |
|---|---|---|---|
| 33 | Cohen, Rogelberg, Allen & Luong 2011, *Meeting design characteristics and attendee perceptions of staff/team meeting quality*, Group Dynamics | https://doi.org/10.1037/a0021549 | medium-strong |
| 34 | Leach, Rogelberg, Warr & Burnfield 2009, *Perceived Meeting Effectiveness*, J. Business and Psychology | https://doi.org/10.1007/s10869-009-9092-6 | medium（存在性） |
| 35 | Kauffeld & Lehmann-Willenbrock 2011/2012, *Meetings Matter*, Small Group Research | https://doi.org/10.1177/1046496411429599 | medium-strong |
| 36 | Odermatt, König & Kleinmann 2015, *Meeting Preparation and Design Characteristics*, CUP | https://doi.org/10.1017/cbo9781107589735.004 | medium |
| 37 | Mingers & Rosenhead 2004, *Problem structuring methods in action*, EJOR | https://doi.org/10.1016/s0377-2217(03)00056-0 | 存在性 strong（结果未核实） |
| 38 | Schweiger, Sandberg & Ragan 1986, AMJ | https://doi.org/10.2307/255859 | 存在性 strong（结果未核实） |
| 39 | Schweiger & Sandberg 1989, *The utilization of individual capabilities in group approaches to strategic decision-making*, SMJ | https://doi.org/10.1002/smj.4250100104 | strong |
| 40 | Schwenk & Valacich 1994, OBHDP | https://doi.org/10.1006/obhd.1994.1057 | 存在性 medium |
| 41 | Valacich & Schwenk 1995, OBHDP | https://doi.org/10.1006/obhd.1995.1070 | 存在性 medium |
| 42 | Jansson & Smith 1991, *Design fixation*, Design Studies | https://doi.org/10.1016/0142-694x(91)90003-f | strong |
| 43 | Cardoso & Badke-Schaub 2011, *The Influence of Different Pictorial Representations During Idea Generation*, J. Creative Behavior | https://doi.org/10.1002/j.2162-6057.2011.tb01092.x | strong |
| 44 | Chrysikou & Weisberg 2005, JEP:LMC | https://doi.org/10.1037/0278-7393.31.5.1134 | strong |
| 45 | Vasconcelos & Crilly 2016, *Inspiration and fixation*, Design Studies | https://doi.org/10.1016/j.destud.2015.11.001 | 存在性 strong（结果未核实） |
| 46 | Purcell, Williams, Gero & Colbron 1993, *Fixation effects: do they exist?*, Environment and Planning B | https://doi.org/10.1068/b200333 | 存在性 medium |
| 47 | McCombs & Shaw 1972, *The Agenda-Setting Function of Mass Media*, POQ | https://doi.org/10.1086/267990 | strong |
| 48 | Tversky & Kahneman 1981, *The Framing of Decisions and the Psychology of Choice*, Science | https://doi.org/10.1126/science.7455683 | strong |
| 49 | Mintzberg & Waters 1985, *Of strategies, deliberate and emergent*, SMJ | https://doi.org/10.1002/smj.4250060306 | strong |
| 50 | Owen 1998, *R&D Meetings in Open Space*, Research-Technology Management | https://doi.org/10.1080/08956308.1998.11671225 | weak |
| 51 | Klein 2008, *Performing a Project Premortem*, IEEE Engineering Management Review | https://doi.org/10.1109/emr.2008.4534313 | medium |

### 10.3 决策台账 / 进度可视化 / 追溯

| # | 来源 | URL / DOI | 强度 |
|---|---|---|---|
| 52 | Nygard 2011, *Documenting Architecture Decisions* | https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions | medium-strong |
| 53 | adr.github.io, *Architectural Decision Records* | https://adr.github.io/ | medium |
| 54 | Fowler, *Architecture Decision Record* | https://martinfowler.com/bliki/ArchitectureDecisionRecord.html | medium |
| 55 | joelparkerhenderson/architecture-decision-record (GitHub) | https://github.com/joelparkerhenderson/architecture-decision-record | weak-medium |
| 56 | Buchgeher et al. 2023, *Using Architecture Decision Records in Open Source Projects*, IEEE Access | https://doi.org/10.1109/ACCESS.2023.3287654 | strong |
| 57 | PRINCE2 wiki, *Management Products (Templates)* | https://prince2.wiki/management-products/ | medium |
| 58 | Asana, *RAID log* | https://asana.com/resources/raid-log | weak |
| 59 | Wickham 2025, *Risk Registers in Practice* | https://doi.org/10.1201/9781003646082-14 | weak |
| 60 | Wikipedia, *Burn down chart* | https://en.wikipedia.org/wiki/Burn_down_chart | medium |
| 61 | Wikipedia, *Cumulative flow diagram*（转引 PMBOK 7） | https://en.wikipedia.org/wiki/Cumulative_flow_diagram | medium |
| 62 | Petersen et al. 2011, *Measuring the flow in lean software development*, SPE | https://doi.org/10.1002/spe.975 | medium-strong |
| 63 | *Improving Software Development Using Scrum Model…*, JDCTA 2009 | https://doi.org/10.4156/jdcta.vol3.issue3.15 | weak |
| 64 | Gotel & Finkelstein 1994, *An analysis of the requirements traceability problem*, ICRE | https://doi.org/10.1109/ICRE.1994.292398 ; http://discovery.ucl.ac.uk/749/1/2.2_rtprob.pdf | strong |
| 65 | Demi, Sánchez-Gordón & Colomo-Palacios 2020 | https://doi.org/10.6084/m9.figshare.12085038.v1 | medium |
| 66 | Wikipedia, *Traceability matrix* | https://en.wikipedia.org/wiki/Traceability_matrix | weak-medium |
| 67 | Schwaber & Sutherland 2020, *The Scrum Guide* | https://scrumguides.org/docs/scrumguide/v2020/2020-Scrum-Guide-US.pdf | strong |
| 68 | Cohn, *Definition of Done in Scrum* | https://www.mountaingoatsoftware.com/agile/scrum/artifacts/definition-of-done | weak |
| 69 | Tam & Greenberg 2006, *A framework for asynchronous change awareness*, IJHCS | https://doi.org/10.1016/j.ijhcs.2006.02.004 | medium（存在性） |
| 70 | CHI 2024, *Constrained Highlighting in a Document Reader can Improve Reading Comprehension* | https://doi.org/10.1145/3613904.3642314 | medium-strong（存在性） |
| 71 | Masicampo & Baumeister 2011, *Consider it done!*, JPSP | https://doi.org/10.1037/a0024192 | medium-strong（存在性） |
| 72 | Masicampo & Baumeister 2011, *Unfulfilled goals interfere with tasks that require executive functions*, JESP | https://doi.org/10.1016/j.jesp.2010.10.011 | medium-strong（存在性） |
| 73 | Ramesh 1998, CACM | https://doi.org/10.1145/290133.290147 | 不可引用结论 |
| 74 | Ramesh & Jarke 2001, IEEE TSE | https://doi.org/10.1109/32.895989 | 不可引用结论 |

### 10.4 长流程上下文丢失

| # | 来源 | URL / DOI | 强度 |
|---|---|---|---|
| 75 | Danziger, Levav & Avnaim-Pesso 2011, *Extraneous factors in judicial decisions*, PNAS | https://doi.org/10.1073/pnas.1018033108 | 存在性 strong；因果 contested |
| 76 | Weinshall-Margel & Shapard 2011, *Overlooked factors in the analysis of parole decisions*, PNAS（**原文未取得**） | https://doi.org/10.1073/pnas.1110910108 | 存在性 strong；内容仅二手 |
| 76b | Danziger et al. 2011, *Reply to Weinshall-Margel and Shapard*, PNAS（**原文未取得**） | https://doi.org/10.1073/pnas.1112190108 | weak（仅题录） |
| 76c | Glöckner 2016, *The irrational hungry judge effect revisited*, Judgment and Decision Making | https://doi.org/10.1017/s1930297500004812 ; https://www.sas.upenn.edu/~baron/journal/16/16823/jdm16823.html | strong（模拟再分析） |
| 76d | Lakens 2017, *Impossibly hungry judges*（博客） | http://daniellakens.blogspot.com/2017/07/impossibly-hungry-judges.html | medium（未同行评审） |
| 76e | Andersson et al. 2025, *No evidence for decision fatigue using large-scale field data from healthcare*, Communications Psychology | https://doi.org/10.1038/s44271-025-00207-8 | strong（注册报告） |
| 76f | Pignatiello, Martin & Hickman 2018, *Decision fatigue: A conceptual analysis*, J. Health Psychology | https://doi.org/10.1177/1359105318763510 | medium |
| 76g | Maier et al. 2025, Health Psychology Review（**结论未核实**） | https://doi.org/10.1080/17437199.2025.2513916 | weak（仅题录） |
| 76h | Carter & McCullough 2013, *Is ego depletion too incredible?*, BBS | https://doi.org/10.1017/S0140525X13000952 | medium |
| 76i | Porter et al. 2004, *Multiple surveys of students and survey fatigue*, New Directions for Institutional Research | https://doi.org/10.1002/ir.101 | medium |
| 76j | Cook, Heath & Thompson 2000, *A Meta-Analysis of Response Rates in Web- or Internet-Based Surveys*, EPM | https://doi.org/10.1177/00131640021970934 | medium-strong |
| 76k | Daikeler, Bošnjak & Lozar Manfreda 2019, *Web Versus Other Survey Modes*, JSSAM | https://doi.org/10.1093/jssam/smz008 | medium-strong |
| 77 | Hagger et al. 2016, *A Multilab Preregistered Replication of the Ego-Depletion Effect*, PPS | https://doi.org/10.1177/1745691616652873 | strong（失败重复） |
| 78 | Vohs et al. 2008, JPSP（**摘要未取得**） | https://doi.org/10.1037/0022-3514.94.5.883 | 存在性 strong |
| 79 | IHI, *SBAR Tool*（**工具页，无效果量**） | https://www.ihi.org/resources/tools/sbar-tool-situation-background-assessment-recommendation | medium |
| 79b | Shahid & Thomas 2018, *SBAR Communication Tool for Handoff in Health Care*, Safety in Health（**结论未核实**） | https://doi.org/10.1186/s40886-018-0073-1 | weak（仅题录） |
| 80 | Starmer et al. 2014, *Changes in Medical Errors after Implementation of a Handoff Program*, NEJM | https://doi.org/10.1056/NEJMsa1405556 | medium-strong（非随机） |
| 80b | Sotto et al. 2021, *Impact of the WHO Surgical Safety Checklist Relative to Its Design and Intended Use*, JACS | https://doi.org/10.1016/j.jamcollsurg.2021.08.692 | medium-strong |
| 81 | Altmann & Trafton 2007, *Timecourse of recovery from task interruption*, PBR | https://doi.org/10.3758/bf03193094 | strong（题录） |
| 81b | Altmann & Trafton 2002, *Memory for goals: an activation-based model*, Cognitive Science（**无逐字引文**） | https://doi.org/10.1207/s15516709cog2601_2 | 存在性 strong |
| 81c | Mark, Gonzalez & Harris 2005, *No task left behind?*, CHI（**无逐字引文**） | https://doi.org/10.1145/1054972.1055017 | 存在性 strong |
| 81d | Iqbal & Horvitz 2007, *Conversations Amidst Computing*（**无逐字引文**） | https://doi.org/10.1007/978-3-540-73078-1_43 | 存在性 strong |
| 81e | Teevan 2007, *"Where'd it go?"*, ASIS&T | https://doi.org/10.1002/meet.1450440269 | medium（定性） |
| 81f | Tyler & Teevan 2010, *Large scale query log analysis of re-finding*, WSDM | https://doi.org/10.1145/1718487.1718512 | 存在性 medium |
| 81g | Jones, Bruce & Dumais 2001, *Keeping found things found on the web*, CIKM | https://doi.org/10.1145/502585.502607 | 存在性 medium |
| 82 | Haynes et al. 2009, *A Surgical Safety Checklist to Reduce Morbidity and Mortality in a Global Population*, NEJM | https://doi.org/10.1056/NEJMsa0810119 | medium（前后对照） |
| 83 | Urbach et al. 2014, *Introduction of Surgical Safety Checklists in Ontario, Canada*, NEJM | https://doi.org/10.1056/NEJMsa1308261 | strong（反证） |
| 84 | Risko & Gilbert 2016, *Cognitive Offloading*, TiCS（**摘要未取得**） | https://doi.org/10.1016/j.tics.2016.07.002 | 存在性 strong |
| 84b | Slamecka & Graf 1978, *The generation effect*, JEP:HLM（**摘要未取得**） | https://doi.org/10.1037/0278-7393.4.6.592 | 存在性 strong |
| 85 | Sparrow, Liu & Wegner 2011, *Google Effects on Memory*, Science | https://doi.org/10.1126/science.1207745 | 存在性 strong / 部分效应失败 |
| 86 | Hesselmann 2020, PeerJ | https://doi.org/10.7717/peerj.10325 | strong |
| 87 | Shumailov et al. 2024, *AI models collapse when trained on recursively generated data*, Nature | https://doi.org/10.1038/s41586-024-07566-y | strong（**仅可作类比**） |
| 87b | ABBEL: *Learning Natural-Language Belief States for Memory-Efficient Interaction*（递归摘要退化） | https://arxiv.org/abs/2512.20111 | medium（预印本） |
| 87c | DTCRS: *Dynamic Tree Construction for Recursive Summarization* | https://arxiv.org/abs/2604.07012 | weak-medium（预印本） |

### 10.5 渐进披露 / 摘要

| # | 来源 | URL / DOI | 强度 |
|---|---|---|---|
| 88 | Nielsen 2006, *Progressive Disclosure*, NN/g | https://www.nngroup.com/articles/progressive-disclosure/ | medium（准则）/ weak（收益断言） |
| 89 | Loranger 2014, *Accordions Are Not Always the Answer…*, NN/g | https://www.nngroup.com/articles/accordions-complex-content/ | medium |
| 90 | Budiu 2020, *Information Scent*, NN/g | https://www.nngroup.com/articles/information-scent/ | medium |
| 91 | Budiu 2024, *Memory Recognition and Recall*, NN/g | https://www.nngroup.com/articles/recognition-and-recall/ | medium |
| 92 | Nielsen, *10 Usability Heuristics* | https://www.nngroup.com/articles/ten-usability-heuristics/ | medium |
| 93 | Nielsen 2008, *How Little Do Users Read?*, NN/g | https://www.nngroup.com/articles/how-little-do-users-read/ | medium |
| 94 | Pirolli & Card 1999, *Information foraging*, Psychological Review | https://doi.org/10.1037/0033-295x.106.4.643 | 存在性 strong |
| 95 | Obar & Oeldorf-Hirsch 2018, *The biggest lie on the Internet*, ICS | https://doi.org/10.1080/1369118x.2018.1486870 | strong |
| 96 | Boutron et al. 2014, SPIIN RCT, JCO | https://doi.org/10.1200/jco.2014.56.7503 | strong |
| 97 | Yavchitz et al. 2012, PLoS Medicine | https://doi.org/10.1371/journal.pmed.1001308 | strong |
| 98 | Hopewell et al. 2008, CONSORT for abstracts, PLoS Medicine | https://doi.org/10.1371/journal.pmed.0050020 | strong |
| 99 | Beller et al. 2013, PRISMA for Abstracts, PLoS Medicine | https://doi.org/10.1371/journal.pmed.1001419 | strong |
| 100 | Page et al. 2021, PRISMA 2020, BMJ | https://doi.org/10.1136/bmj.n71 ; https://www.prisma-statement.org/prisma-2020 | strong（规范） |
| 101 | Mayer, *Segmenting Principle*, Multimedia Learning | https://doi.org/10.1017/9781316941355.015 | medium（存在性） |
| 102 | Mayer, *Signaling Principle*, Multimedia Learning | https://doi.org/10.1017/9781316941355.010 | weak-medium |
| 103 | Ausubel 1960, J. Educational Psychology | https://doi.org/10.1037/h0046669 | 存在性 strong |
| 104 | Muralidhar, Belloum & Ashok 2025, IJHCS | https://doi.org/10.1016/j.ijhcs.2025.103591 | 存在性 medium（结论不可核实） |
| 105 | Bakos, Marotta-Wurgler & Trossen 2014, J. Legal Studies | https://doi.org/10.1086/674424 | 存在性 medium（结论未取得） |
| 106 | Carroll 1990, *An overview of minimalist instruction*, HICSS | https://doi.org/10.1109/hicss.1990.205259 | medium |
| 107 | Gabielkov et al. 2016, *Social Clicks*, ACM | https://doi.org/10.1145/2896377.2901462 | 存在性 medium（数字不可核实） |
| 108 | Wikipedia, *Progressive disclosure* | https://en.wikipedia.org/wiki/Progressive_disclosure | weak |

### 10.6 人机交互失效模式

| # | 来源 | URL / DOI | 强度 |
|---|---|---|---|
| 109 | Parasuraman & Riley 1997, Human Factors | https://doi.org/10.1518/001872097778543886 | strong |
| 110 | Parasuraman & Manzey 2010, Human Factors | https://doi.org/10.1177/0018720810376055 | strong |
| 111 | Goddard, Roudsari & Wyatt 2012, JAMIA | https://doi.org/10.1136/amiajnl-2011-000089 | strong（范围）/ 数字不可引用 |
| 112 | Skitka, Mosier & Burdick 1999, IJHCS | https://doi.org/10.1006/ijhc.1999.0252 | 存在性 medium（内容未核实） |
| 113 | Dietvorst, Simmons & Massey 2015, *Algorithm aversion*, JEP:General | https://doi.org/10.1037/xge0000033 | strong |
| 114 | Logg, Minson & Moore 2019, *Algorithm appreciation*, OBHDP | https://doi.org/10.1016/j.obhdp.2018.12.005 | strong |
| 115 | Logg & Schlund 2024, SSRN | https://doi.org/10.2139/ssrn.4687557 | weak-medium |
| 116 | Lee, Sarkar, Tankelevitch et al. 2025, CHI | https://doi.org/10.1145/3706598.3713778 | medium-strong（自报） |
| 117 | Elish 2019, *Moral Crumple Zones*, ESTS | https://doi.org/10.17351/ests2019.260 | strong（引文）/ 概念 |
| 118 | Matthias 2004, *The responsibility gap*, Ethics and IT | https://doi.org/10.1007/s10676-004-3422-1 | 存在性 medium |
| 119 | Bansal et al. 2021, CHI | https://doi.org/10.1145/3411764.3445717 ; https://arxiv.org/abs/2006.14779 | strong |
| 120 | Buçinca, Malaya & Gajos 2021, CSCW | https://arxiv.org/abs/2102.09692 | strong |
| 121 | Sharma, Tong, Korbak et al. 2023/ICLR 2024 | https://arxiv.org/abs/2310.13548 | strong |
| 122 | Ranaldi & Pucci 2023 | https://arxiv.org/abs/2311.09410 | medium |
| 123 | Perez, Ringer, Lukošiūtė et al. 2022 | https://arxiv.org/abs/2212.09251 | medium-strong |
| 124 | Laban, Hayashi, Zhou & Neville 2025 | https://arxiv.org/abs/2505.06120 | medium-strong |
| 125 | Liu, Lin, Hewitt et al. 2024, *Lost in the Middle*, TACL | https://doi.org/10.1162/tacl_a_00638 ; https://arxiv.org/abs/2307.03172 | strong |
| 126 | Ji, Lee, Frieske et al. 2023, ACM Computing Surveys | https://doi.org/10.1145/3571730 ; https://arxiv.org/abs/2202.03629 | strong |
| 127 | Huang, Yu, Ma et al. 2023 | https://arxiv.org/abs/2311.05232 | strong（存在性） |
| 128 | GDPR Recital 32 | https://gdpr-info.eu/recitals/no-32/ | strong（法律规范） |
| 129 | Görer & Aydemir 2023, IEEE REW | https://doi.org/10.1109/rew57809.2023.00015 | 存在性 medium |
| 130 | Frederick 2005, CRT, JEP | https://doi.org/10.1257/089533005775196732 | 存在性 medium |
| 131 | Sinayev & Peters 2015, Frontiers in Psychology | https://doi.org/10.3389/fpsyg.2015.00532 | medium |
| 132 | Baumgartner & Steenkamp 2001, JMR | https://doi.org/10.1509/jmkr.38.2.143.18840 | 存在性 medium |
| 133 | Steenkamp, De Jong & Baumgartner 2010, JMR | https://doi.org/10.1509/jmkr.47.2.199 | medium |
| 134 | Miller 1956, *The Magical Number Seven, Plus or Minus Two*, Psychological Review（授权全文镜像） | http://www.musanim.com/miller1956/ | strong |
| 135 | Cowan 2001, *The magical number 4 in short-term memory*, BBS | https://doi.org/10.1017/s0140525x01003922 | strong |
| 136 | Postman & Phillips 1965 | https://doi.org/10.1037/h0022013 | 存在性 medium |
| 137 | Sinayev & Peters 2015（见 131） | — | — |

---

### 附录：本次调研的明确证据空白（汇总）

1. **没有任何关于**「AI agent 主导的多轮访谈每轮应含几个议题」的直接实验。
2. **没有任何关于**「parking lot / 溢出议题清单」的实证研究。
3. **没有任何实证答案**回答「显示『已被 X 取代』是否帮助或干扰理解」。
4. **没有任何**渐进披露对任务绩效/错误率/满意度影响的受控实验被成功取得。
5. **不存在**（本次未找到）「abstract-only 读者 vs full-text 读者」直接对照实验。
6. **没有任何**关于「Manager's Summary / Policy brief 中决策者只读摘要」的实证。
7. **没有任何**专门研究「summary + appendix」结构理解效果的工作。
8. **没有任何**研究量化「agent 编造用户回复」或「LLM 虚构引用」。
9. **没有任何** HCI 研究关于对话智能体从沉默推断同意。
10. **没有任何**关于 LLM 生成「貌似合理但错误的需求」或「锚定人类」的实证。
11. **未取得**「反复总结导致**人类**会议纪要信息衰减」的直接研究（最近的只有 LLM 智能体记忆 ABBEL 与模型崩溃，均为类比）。
12. **未取得** Schweiger et al. 1986 原文，因此「结构化方法降低成员满意度」这一常被引述的结论**无法核实**。
13. **未能取得** Weinshall-Margel & Shapard 2011 与 Danziger 2011 回复的原文逐字引文（PNAS 403；PMC 网络层拦截；Europe PMC fullTextXML 500）；Glöckner 2016 的摘要与全文已取得。
14. **未能证实** RAID log 的起源。
15. **未能证实** Galesic & Bosnjak 2009 / Herzog & Bachman 1981 / Peytchev 2009 的具体结果数字。
16. **未能取得任何**关于「会话开始时 recap / 状态回述」作为**独立干预**的效果证据。最强证据是 I-PASS/SBAR 整包 bundle，无法拆分成分。
17. **未能取得任何**关于「可检索历史 / 可搜索会议记录是否降低失去线索感」的实证研究。
18. **未能取得任何**需求获取或纵向访谈中「参与者丢失上下文」的定量证据。
19. **未能核实** HCI 打断研究中流传的具体时间数字（如「11 分钟」「25 分钟」）的一手来源——ACM DL / Wiley / Springer 全面 403 且均非 OA。**下游不应引用这些数字。**
20. **仅核实题录、未取得内容**的 HCI 论文：Altmann & Trafton 2002、Mark/Gonzalez/Harris 2005、Iqbal & Horvitz 2007、Tyler & Teevan 2010、Jones/Bruce/Dumais 2001、Risko & Gilbert 2016、Slamecka & Graf 1978、Vohs et al. 2008。
21. **仅核实题录**：Shahid & Thomas 2018（SBAR 综述）、Maier et al. 2025（医护决策疲劳系统综述）。

---

### 附录 B：本次调研的工具限制（影响证据覆盖度）

**全部被 CAPTCHA / 429 / 403 拦截**：Brave、Bing、DuckDuckGo、Startpage、Mojeek、Ecosia、Yandex、Google、所有试过的 searx 实例；ScienceDirect、ACM DL、IEEE Xplore、Springer、SAGE、Wiley、BMJ、PNAS、NEJM、BMC、DOAJ、HAL、Wayback Machine、researchgate。

**额度耗尽**：AnySearch（web_search / web_fetch / academic.search 共用一个每日免费额度，本会话开始时即耗尽）；OpenAlex 免费 IP 额度（中途耗尽，重置于 UTC 午夜）。

**可用通道**：Crossref REST API、Semantic Scholar Graph API（约需 14 秒间隔）、Europe PMC REST API、Unpaywall、arXiv `abs` 页、Wikipedia API、Hacker News Algolia，以及**直接 curl 抓取可公开访问的一手原文**（NN/g、cognitect.com、adr.github.io、martinfowler.com、gdpr-info.eu、PLoS Medicine、psychclassics 授权镜像 musanim.com、prisma-statement.org、IHI、nature.com、sas.upenn.edu 等）。

**结论**：第 4 节（HCI 打断/重新查找）与第 5 节（渐进披露的受控实验）的缺口**主要来自工具封锁，而非文献不存在**。在有正常检索通道时，建议优先复核：§9.17（HCI 时间数字）、§5.5（渐进披露受控实验）、§4.5（recap 独立效果）。
