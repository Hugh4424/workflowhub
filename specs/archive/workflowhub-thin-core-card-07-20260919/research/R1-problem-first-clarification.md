# R1 痛点优先的需求澄清 — 外部调研

> 范围：**只做外部调研**。不含 CARD-07 设计建议、不含排序、不含推荐。
> 本文只回答「业界有哪些做法 + 证据 + 代价」。
>
> **证据强度口径**
> - `strong`：有对照实验、或官方一手文档（当事人/原机构原文）。
> - `medium`：有可核实的案例，或权威二手（专家溯源研究、同行评议论文的元数据）。
> - `weak`：只有说法、无一手出处；或仅有单一未评审预印本。
>
> **方法学声明（重要）**：本次调研期间，本机可用的搜索后端（`web_search`、`anysearch_search`、`web_fetch`）**全部不可用**（配额耗尽 / 未登录）。因此全部来源通过 `curl` 直连抓取 + `PyMuPDF`/`BeautifulSoup` 本地抽取获得，学术侧改用 arXiv 官方 API 与 HTML 检索、Crossref、OpenAlex、Unpaywall。凡未能取得原文者，一律标注 `[未找到一手来源]` 或 `UNVERIFIED`，不做推测性引用。
> 本文所引英文原句均为抓取字节的逐字摘录（引号字形作了直引号归一化）。

---

## 0. 结论速览

1. **「先澄清问题再发散」在方法论上是主流共识，但没有任何一本主流方法论把它写成「澄清完再冻结」的线性单行道**——Design Council 与 Rittel & Webber 都明确否认线性读法。`strong`
2. **「提问形态」有清晰分野**：丰田 5 Whys / Socratic 是**无限追问型**（无提问上限，深度由追问链决定）；Spec Kit `/clarify` 是**限量选项型**（全会话最多 5 问、每次 1 问、必须可选项化）；Claude Code 是**不限量访谈型**（"Keep interviewing until we've covered everything"）。三种形态都有官方一手文档。`strong`
3. **「一次问几个」的业界答案区间是 1–5 个，且主流做法是「一次只问一个」**（Spec Kit 明写 `EXACTLY ONE question at a time`；Agent OS 写 "ask 1-2 clarifying questions"）。`strong`
4. **最贵的成本不是问错问题，而是把用户提的「方案」当成「需求」收集**——Amazon PR/FAQ 的原话是「你先从公司现有能力出发倒推，这份新闻稿应该在写 FAQ 之前就被丢弃」。`strong`
5. **「先澄清」的最强量化证据来自 LLM/代码生成领域，而非经典管理文献**：ClarifyGPT 使 GPT-4 在 MBPP-sanitized 上 Pass@1 从 70.96% → 80.80%；Ambig-SWE（ICLR 2026）报告交互式澄清带来**最高 74%** 的性能提升。`strong`
6. **但同一批证据同时否证「多问就好」**：Ask or Assume? 显示"几乎每次都问"的交互式基线是**以 over-clarification 为代价**换来的；在它选择不问的 156 个任务上仍有 76.92% resolve rate，与"根本不能问"的基线（77.56%）几乎相同。`strong`
7. **最强的单条反证是 Rittel & Webber (1973)**：对 wicked problems，「理解问题所需的信息取决于你打算怎么解决它」——「问题在找到解之前无法被定义」。这直接否证"先问清楚再动手"的**普适**性。`strong`
8. **被广泛当作"先澄清"弹药的两条经典引用都是残缺/漂移的**：Boehm 的「100 倍」原文自带 5:1 例外并**明确支持需求涌现式流程**；CB Insights「没有市场需求是创业失败第 1 原因 42%」是**已被自家新版取代**的旧版数字（新版为第 2 原因 35%）。`strong`
9. **LLM 澄清的失效模式有硬数据**：Sharma et al. (ICLR 2024) 测得「Are you sure?」使 Claude 1.3 在 **98%** 的问题上错误承认自己犯错，准确率最多下降 **27%**；且人类的偏好模型有 **95%** 的概率偏好"迎合式回答"而非正确答案。`strong`
10. **"爱因斯坦说要用 55 分钟定义问题"是伪托**——Quote Investigator 溯源到 1945 年数学家 Robert J. Aley，最早归给爱因斯坦是 1973 年，且爱因斯坦 1955 年已去世。同类的"福特说用户只想要更快的马"亦为伪托（最早归给福特 1999/2001）。`strong`

---

## 1. 方法论横向对比

| 方法论 | 核心做法 | 提问形态 | 证据强度 | 来源 |
|---|---|---|---|---|
| **Toyota 5 Whys** | 对同一现象连续追问"为什么"，每一问指向上一答；断言第 5 个 why 应揭示根因 | 无限追问链（无上限、无选项化）；追问深度为方法本体 | `strong`（Ohno 原著为出处；Wikipedia 汇编其批评） | Ohno, *Toyota Production System* (1988), ISBN 0-915299-14-3；[https://en.wikipedia.org/wiki/Five_whys](https://en.wikipedia.org/wiki/Five_whys) |
| **JTBD（含 functional/social/emotional 三分）** | 不问用户"要什么功能"，而问"他雇这个产品来完成什么进步"；按 circumstance/forces 而非人口属性切分 | 叙事式回溯访谈（问已发生的购买决策故事），非"你想要什么"式的功能询问 | `strong`（Christensen Institute 官方定义页，逐字含三分） | [https://www.christenseninstitute.org/theory/jobs-to-be-done/](https://www.christenseninstitute.org/theory/jobs-to-be-done/) |
| **Problem statement / problem framing** | 先把"问题是什么"写成可检验的陈述，再谈解 | 无固定提问脚本；产出物是 problem statement | `weak`（无权威一手定义页；Wikipedia 无该条目，`Are Your Lights On?` 页面亦不存在） | [未找到一手来源] |
| **Socratic questioning** | 以追问追究信念及其理由；Paul & Elder 给出按"思维要素/推理质量"分类的问题taxonomy | 无限追问；按类别穷举式覆盖 | `medium`（作者机构官方指南的**目录**已取得；正文被付费墙/改版阻断） | Paul & Elder, *The Thinker's Guide to the Art of Socratic Questioning*, Foundation for Critical Thinking, © 2006；存档 [https://web.archive.org/web/20070715014415if_/http://www.criticalthinking.org/files/SocraticQuestioning2006.pdf](https://web.archive.org/web/20070715014415if_/http://www.criticalthinking.org/files/SocraticQuestioning2006.pdf) |
| **Discovery interview / The Mom Test** | 不问"你觉得这个想法好不好"，只问其真实行为与过往事实 | 行为事实型问题；避免意见与未来假设 | `medium`（书为权威一手，但官网仅营销页；三规则原文 **UNVERIFIED**，规则清单须另找原书） | [https://www.momtestbook.com/](https://www.momtestbook.com/) |
| **Design Thinking — Empathize** | 五模式 Empathize → Define → Ideate → Prototype → Test 的第一模式，先观察/访谈真实用户 | 观察 + 访谈；强调 immersion 而非问卷 | `strong`（Stanford d.school 官方页逐字列出五模式） | [https://dschool.stanford.edu/resources/design-thinking-bootleg](https://dschool.stanford.edu/resources/design-thinking-bootleg) |
| **Double Diamond — Discover** | 第一颗菱形的目的是"理解而不是假设"问题是什么 | "speaking to and spending time with people who are affected by the issues" | `strong`（Design Council 官方页逐字） | [https://www.designcouncil.org.uk/our-resources/the-double-diamond/](https://www.designcouncil.org.uk/our-resources/the-double-diamond/) |
| **Wicked problems（反证侧）** | 对 wicked problems，问题与解**共同演化**，无法先定义问题 | 不主张固定提问脚本；主张 argumentative process | `strong`（原始论文双扫描 OCR 交叉校验） | Rittel & Webber, *Policy Sciences* 4(2):155–169, 1973, DOI 10.1007/BF01405730 |

### 1.1 各方法论的逐字要点（避免二手转述）

**Toyota 5 Whys** — 机制描述：「repeating the question "why?" five times, each time directing the current "why" to the answer of the previous "why"」「The number of whys may be higher or lower depending on the complexity of the analysis」。

**出处归属必须区分**（Wikipedia §History 逐字）：「The modern technique was **originally developed by Sakichi Toyoda** and was used within the Toyota Motor Corporation during the evolution of its manufacturing methodologies.」Ohno 是**记述者**而非发明者；且该方法**原始用途不是根因分析**——Card 的批评即指出「The five whys is based on a **misguided reuse of a strategy to understand why new features should be added to products**, not a root cause analysis」（*BMJ Quality & Safety* 26(8):671–677, 2017, DOI 10.1136/bmjqs-2016-005849）。

**Toyota 官方把「到现场看」当作方法的本体**（Toyota 2006 官方页，Wayback `20221127052017id_`）：Ohno「constantly emphasized the importance of **genchi genbutsu, or going to the source, and clarifying the problem with one's own eyes**. 'Data is, of course, important in manufacturing,' he often remarked, '**but I place greatest emphasis on facts.**'」Toyota 官方口号原文为「**Ask 'why' five times about every matter.**」

**JTBD 的三分是官方口径，不是后人添加。** Christensen Institute 的定义页逐字写：「it goes beyond superficial categories to expose the **functional, social, and emotional dimensions** that explain why people make the choices they do.」并在「three critical must-knows」中重申：「**A job incorporates three key elements.** All Jobs incorporate **functional, social, and emotional forces** at play in decision-making.」机制句：「people "hire" products or services when "jobs" arise in their lives」。

**JTBD 明确拒绝把方法等同于"追问为什么"**（同一官方页逐字）：「**Jobs is not asking why someone made their decision.** JTBD methodology is about uncovering a story and discovering underlying circumstances common across specific groups of individuals.」——这一句对"5 Whys 式连续追问"是一个直接的方法论对照。

**内部存在框架分歧**：Ulwick/Strategyn 把重心放在 **core functional job** 与可度量的 **desired outcomes**（「Needs are not vague preferences. They are **the metrics customers use to measure success**… These are called desired outcomes」），而非三分法。Strategyn 是 Ulwick 的公司、也是 JTBD 优先权争议的当事方，其"1990 年首创"之说属**党派来源**，须谨慎。`medium`，[https://strategyn.com/jobs-to-be-done/](https://strategyn.com/jobs-to-be-done/)

**Double Diamond — Discover 逐字**：「The first diamond helps people **understand, rather than simply assume, what the problem is**. It involves speaking to and spending time with people who are affected by the issues.」`Define` 则是「The insight gathered from the discovery phase can help you to define the challenge in a different way.」

**Design Thinking 五模式逐字**（d.school Bootleg 页）：「There are five "modes" that we identify as components of design thinking: **Empathize, Define, Ideate, Prototype, Test**.」同页强调这不是线性流程：「It's a deck of cards, so you can start wherever you want.」

**d.school 官方对 Empathize 的展开（2018 Bootleg PDF, p. i 逐字）**：「**Empathize.** Empathy is the foundation of human-centered design. **The problems you're trying to solve are rarely your own, they're those of particular users.** Build empathy for your users by learning their values. To empathize, you: **Observe.** View users and their behavior in the context of their lives. **Engage.** Interact with and interview users through both scheduled and short 'intercept' encounters. **Immerse.** Wear your users' shoes. Experience what they experience for a mile or two.」`strong`（官方 PDF：[https://dschool.sfo3.digitaloceanspaces.com/documents/dschool_bootleg_deck_2018_final_sm2-6.pdf](https://dschool.sfo3.digitaloceanspaces.com/documents/dschool_bootleg_deck_2018_final_sm2-6.pdf) ）

**d.school 官方对 Define 的展开（同 PDF, p. ii 逐字）——这是"problem statement"在 Design Thinking 里的对应物**：「**Define.** The define mode is when you **unpack your empathy findings into needs and insights and scope a meaningful challenge.** Based on your understanding of users and their environments, **come up with an actionable problem statement: your Point Of View.** More than simply defining the problem, your Point of View is a unique design vision that is framed by your specific users.」同页另有一句直接对应"用户自己未必知道需求"：「**Uncover user needs (which they may or may not be aware of).**」`strong`

**d.school 自己对"唯一流程"的退让（重要边界）**：其 `getting-started-with-design-thinking` 页承载一篇题为「**Let's Stop Talking about THE Design Process**」的文章；Bootleg 亦自述「a set of tools/methods that **constantly evolves**」。`strong`（官方自述）

**Socratic questioning — 现状与可用边界（必须精确）**：任务书给出的 `criticalthinking.org/pages/socratic-questioning/525` **现已静默改版**——该 URL 现在返回的是无关文章《Thinking With Concepts》，且该路径**从未被 Wayback 归档**（CDX 无快照）。Foundation for Critical Thinking 的**现行**官方 taxonomy 是"思维要素 / 思维标准"两族结构，见其 2006 年官方 *Thinker's Guide to the Art of Socratic Questioning* PDF。**广泛流传的"六类 Socratic 问题"清单在本轮只能通过署名 R.W. Paul 的二手镜像核到，官方一手页码未取得**，故本文不列该六类清单（见 §8）。`medium`（目录级已核）／`UNVERIFIED`（六类清单逐字）

---

## 2. 可操作的提问规则

> 格式：**规则｜为什么｜来源｜强度**

| # | 规则 | 为什么 | 来源 | 强度 |
|---|---|---|---|---|
| R1 | **一次只问一个问题**（Spec Kit：`Present EXACTLY ONE question at a time`） | 批量提问让用户只能挑着答，未答项静默丢失 | [https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/clarify.md](https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/clarify.md) | `strong` |
| R2 | **一次问 1–2 个，而非一次铺开**（Agent OS `/shape-spec` 写 "ask 1-2 clarifying questions"） | 同上，且降低用户疲劳 | [https://github.com/buildermethods/agent-os](https://github.com/buildermethods/agent-os) | `medium` |
| R3 | **对提问总数设硬上限**（Spec Kit：全会话 `Maximum of 5 total questions`） | 强制按影响度排序，避免"问到哪算哪" | 同 R1 | `strong` |
| R4 | **优先按「影响 × 不确定度」排序，而非按话题顺序**（Spec Kit：`select the top 5 by (Impact * Uncertainty) heuristic`） | 话题顺序会让低影响项挤掉高影响项 | 同 R1 | `strong` |
| R5 | **用固定分类法做覆盖扫描，逐类标 Clear/Partial/Missing**（Spec Kit 给出 10 类 taxonomy：Functional Scope、Domain & Data Model、Interaction & UX、Non-Functional、Integration、Edge Cases、Constraints & Tradeoffs、Terminology、Completion Signals、Misc） | 防止"东一榔头西一棒子"——覆盖由清单保证而非由记忆保证 | 同 R1 | `strong` |
| R6 | **每问必须可被短选项或 ≤5 词短答回答**（`short multiple-choice selection (2–5 distinct, mutually exclusive options)`，或 `Answer in <=5 words`） | 迫使问题收敛到可判定形态，避免开放性长答 | 同 R1 | `strong` |
| R7 | **排除已答项、风格偏好、以及实现层/技术栈/任务拆解类问题**（`Exclude questions already answered, trivial stylistic preferences, or plan-level execution details`） | 把提问预算花在会改变验收标准的地方 | 同 R1 | `strong` |
| R8 | **在问题里显式写出「为什么这问题重要」**（Spec Kit：紧跟问题加一句 plain-language "Why it matters"，并警告 `Terse is fine; cryptic labels are not`） | 用户不知道代价就无法判断该投入多少注意力 | 同 R1 | `strong` |
| R9 | **禁止用话题标签冒充问题**（Spec Kit 明确 `Acceptance device/runtime matrix (FR-023)` 是 INVALID——"it is a label, not a question"） | 标签式"提问"实际是把澄清责任推回用户 | 同 R1 | `strong` |
| R10 | **不要把未来的问题队列提前泄露**（`Never reveal future queued questions in advance`） | 防止用户一次性回答所有问题（等于没问）或按队列形状作答 | 同 R1 | `strong` |
| R11 | **用户可提前终止**（`Respect user early termination signals ("stop", "done", "proceed")`） | 澄清是服务用户，不是流程义务 | 同 R1 | `strong` |
| R12 | **问不到的高影响项要显式列为 Deferred/Outstanding，而不是静默略过**（Spec Kit 要求输出 coverage summary 表，并标 Resolved/Deferred/Clear/Outstanding） | 未覆盖项的沉默正是"用户需求被弱化还不告诉你"的机制 | 同 R1 | `strong` |
| R13 | **问「已完成的行为事实」，不问「未来的意见」**（The Mom Test 三规则逐字：「**1. Talk about their life instead of your idea 2. Ask about specifics in the past instead of generics or opinions about the future 3. Talk less and listen more**」） | 意见廉价且易受提问者影响；行为事实可核对 | *The Mom Test*, Rob Fitzpatrick, v1.06, p.17（全文 PDF 由 McMaster 学生社团镜像托管：[https://theforge.mcmaster.ca/wp-content/uploads/2024/02/The-Mom-Test.pdf](https://theforge.mcmaster.ca/wp-content/uploads/2024/02/The-Mom-Test.pdf) ） | `medium`（**实践建议，非对照研究**；官方站不列规则，`robfitz.com/the-mom-test/` 404） |
| R13b | **禁止"premature zoom"——不要在还没确认这是不是真问题时，就把话题缩到某个具体痛点上** | 书的逐字：「You: 'What would you say is your biggest problem with going to the gym?' **This is where the conversation goes horribly wrong. Instead of figuring out whether staying fit is actually a real problem, we're prematurely zooming in on it. Any response we get is going to be dangerously misleading.**」另：「**Rule of thumb: Customer conversations are bad by default. It's your job to fix them.**」 | 同上 PDF, p.51 / p.18 | `medium`（实践建议） |
| R13c | **"坏数据"的构成：恭维、泛泛而谈/假设/关于未来、以及想法本身** | 「**Bad data = compliments, fluff (generics, hypotheticals, things about the future), and ideas** (understand the motivation behind the idea)」 | 同上（书第 2 章 "Avoiding bad data"） | `medium`（实践建议） |
| R14 | **同一个「为什么」要追到可动手的第几层由问题复杂度决定，不机械凑 5 层**（5 Whys 原文：`The number of whys may be higher or lower depending on the complexity`） | 机械 5 层会停在意象层而非根因 | [https://en.wikipedia.org/wiki/Five_whys](https://en.wikipedia.org/wiki/Five_whys) | `strong` |
| R15 | **提问措辞本身会改变答案，因此要警惕引导性措辞** | Loftus & Palmer (1974)：仅替换一个动词，速度估计从 31.8 mph（contacted）变到 40.8 mph（smashed）；「smashed」条件下 32% 的人"记得"根本不存在的碎玻璃，而「hit」条件只有 14% | Loftus & Palmer, *J. Verbal Learning and Verbal Behavior* 13(5):585–589, 1974, DOI 10.1016/S0022-5371(74)80011-3；PDF: [https://gwern.net/doc/psychology/1974-loftus.pdf](https://gwern.net/doc/psychology/1974-loftus.pdf) | `strong`（实验本身）／`medium`（外推到需求访谈属类比） |
| R16 | **「用户说不清痛点」时，主流框架的共同解法是给他候选让他裁决，而不是继续开放式追问** | Spec Kit 明写要 `Present your recommended option prominently` 并附 `**Suggested:**` 建议答案，用户可回 "yes"/"recommended"；Kiro 的澄清问题也"includes the requirements involved, a plain-language explanation of the issue, and **suggested fixes you can select**" | Spec Kit clearify.md（同 R1）；[https://kiro.dev/docs/specs/analyze-requirements/](https://kiro.dev/docs/specs/analyze-requirements/) | `strong` |
| R17 | **允许用户把某个歧义标记为"有意的"并跳过**（Kiro：`dismiss a question if the ambiguity is intentional`） | 不是所有歧义都是缺陷；强制消歧会削掉用户的真实意图 | [https://kiro.dev/docs/specs/analyze-requirements/](https://kiro.dev/docs/specs/analyze-requirements/) | `strong` |
| R18 | **把答案即时写回唯一材料，并保留 Q→A 痕迹**（Spec Kit：在 spec 里建 `## Clarifications` + `### Session YYYY-MM-DD`，逐条追加 `- Q: … → A: …`，随后改写到对应小节） | 让"问过什么、答了什么"成为可追溯事实，而不是只留在对话里 | 同 R1 | `strong` |
| R19 | **禁止让澄清问题变成实现细节辩论**（Spec Kit `/specify`：`Focus on WHAT users need and WHY. Avoid HOW to implement (no tech stack, APIs, code structure)`） | 实现层讨论会过早锁死方案空间 | [https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/specify.md](https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/specify.md) | `strong` |
| R20 | **未决项要显式留标记而非默默猜**（Spec Kit `/specify`：`Maximum 3 [NEEDS CLARIFICATION] markers total`，优先级 `scope > security/privacy > user experience > technical details`；`/plan` 阶段 `Phase 0: Generate research.md (resolve all NEEDS CLARIFICATION)`，并对未决项 `ERROR on gate failures or unresolved clarifications`） | 猜测是静默的；标记是可见的 | 同 R19；[https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/plan.md](https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/plan.md) | `strong` |

---

## 3. 证据：「先澄清再发散」vs「直接发散」

> **本节先列支持侧，第 4 节单列反证。** 注意：支持侧最强的证据几乎全部来自 **LLM/代码生成**领域，经典管理文献侧的证据链比通常引用的要弱（见 3.3、3.4）。

### 3.1 有对照实验的支持证据（LLM / 代码生成）

| 研究 | 设计 | 结果 | 强度 | 来源 |
|---|---|---|---|---|
| **ClarifyGPT** (Mu et al.) | 两步：先用"代码一致性检查"（采样 n 个解，若在生成的测试输入上行为分歧则判定需求有歧义）决定**何时**问，再用推理式 prompt 生成定向问题 | GPT-4 在 MBPP-sanitized 上 Pass@1 **70.96% → 80.80%**；四个模型四基准平均提升 **11.52%**；相对默认 ChatGPT 平均提升 **15.07%**；人类反馈条件下 MBPP-sanitized 提升 **13.87%** | `strong`（预印本，但含明确对照数字） | arXiv:2310.10996 |
| **Ambig-SWE** (Vijayvargiya et al., CMU) | SWE-bench Verified 的欠指定变体（ICLR 2026 接收） | 「Making unwarranted assumptions to compensate for the missing information **and failing to ask clarifying questions can lead to suboptimal outcomes**」；交互式澄清带来**最高 74%** 性能提升（相对 non-interactive 设置） | `strong`（同行评议会议接收 + 数字） | arXiv:2502.13069 |
| **Ask or Assume?** (Edwards & Schuster) | 不确定性感知的澄清策略 scaffold，对比"标准单 agent"与"几乎每次都问"的交互式基线 | scaffold 达 **69.40%** task resolve rate；**在其选择不问的 156 个任务上仍有 76.92%**，与"不能问"的 HIDDEN 基线 **77.56%** 几乎持平 | `strong`（预印本，数字明确；见第 4 节反向读法） | arXiv:2603.26233 |
| **Modeling Future Conversation Turns** (Zhang, Knox & Choi, ICLR 2025) | 教模型预测后续对话轮次以决定是否提问 | F1 提升 **5%**；作者指出既有 LLM「often respond by presupposing a single interpretation of such ambiguous requests, **frustrating users who intended a different interpretation**」 | `medium`（会议论文；提升幅度小） | arXiv:2410.13788 |

### 3.2 支持侧的方法论证据（非实验）

- **Double Diamond 的 Discover 明写"理解而非假设"**：「helps people **understand, rather than simply assume**, what the problem is」。`strong`，来源见 §1。
- **Design Thinking 把 Empathize 排在第一位**，且五模式被 d.school 定义为"components"。`strong`，来源见 §1。
- **Amazon PR/FAQ 把"问题段落"设为新闻稿的必填组件**，且要求「Make sure you write this paragraph **from the customer's point of view**」，并给出硬性丢弃规则：「You started with what your company can do and worked backward from there. **This press release should be discarded before even writing an FAQ.**」`strong`，来源：[https://www.workingbackwards.com/resources/working-backwards-pr-faq/](https://www.workingbackwards.com/resources/working-backwards-pr-faq/)
- **Anthropic 官方工程文档**：「Separate research and planning from implementation **to avoid solving the wrong problem**. Letting Claude jump straight to coding **can produce code that solves the wrong problem**.」`strong`，[https://www.anthropic.com/engineering/claude-code-best-practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- **Anthropic 的另一条硬证据（多 agent 发散）**：九个 Automated Alignment Researchers 若从**相同**出发点开始，「they all quickly settled on similar ideas, making much less progress overall」；刻意给不同（且故意模糊的）出发点后达到 PGR 0.97 对人类基线 0.23。`strong`，[https://www.anthropic.com/research/automated-alignment-researchers](https://www.anthropic.com/research/automated-alignment-researchers)

### 3.3 经典文献侧：**必须小心使用**的一条

**Boehm & Basili (2001) 的「100 倍」是真实一手来源，但自带被普遍删掉的反向条件。** 原文 item ONE 逐字：

> "Finding and fixing a software problem after delivery is **often** 100 times more expensive than finding and fixing it during the requirements and design phase."

紧接着（几乎总被省略）：

> "**For this updated list, we have added the word 'often' to reflect additional insights about this observation. One insight shows the cost-escalation factor for small, noncritical software systems to be more like 5:1 than 100:1.** This ratio reveals that we can develop such systems more efficiently in a **less formal, continuous prototype mode** that still emphasizes getting things right early rather than late."

且同一篇的 item TWO 更直接地**支持需求涌现**：

> "**better user-interactive systems result from emergent processes. In such processes, the requirements emerge from prototyping and other multistakeholder-shared learning activities**, a departure from traditional reductionist processes that stipulate requirements in advance… **changes to a system's definition that make it more cost-effective should not be discouraged by classifying them as avoidable defects.**"

来源：Boehm & Basili, "Software Defect Reduction Top 10 List", *IEEE Computer* 34(1):135–137, 2001, DOI 10.1109/2.962984；全文 PDF [https://www.cs.umd.edu/~basili/publications/journals/J81.pdf](https://www.cs.umd.edu/~basili/publications/journals/J81.pdf) 。强度 `strong`（原文已核）。

### 3.4 经典文献侧：**已被自家新版推翻**的一条

**"没有市场需求是创业失败第 1 原因，占 42%"** —— 该数字真实存在，但属于 CB Insights 的**旧版**：

| 版本 | 样本 | 原话 | 来源 |
|---|---|---|---|
| Top 20 Reasons | 101 份失败复盘 | 「cited as the **No. 1 reason** for failure, noted in **42%** of cases」 | [https://web.archive.org/web/2019id_/https://www.cbinsights.com/research/startup-failure-reasons-top/](https://web.archive.org/web/2019id_/https://www.cbinsights.com/research/startup-failure-reasons-top/) |
| Top 12 Reasons（现版） | 111 份失败复盘 | 「cited as the **No. 2 reason** for failure, noted in **35%** of cases」；第 1 名是「Ran out of cash/failed to raise new capital」 | [https://web.archive.org/web/2021id_/https://www.cbinsights.com/research/startup-failure-reasons-top/](https://web.archive.org/web/2021id_/https://www.cbinsights.com/research/startup-failure-reasons-top/) |

**方法学警告**：这不是对创始人抽样的调查，而是对**自选的公开失败复盘**的供应商分析，且「many startups offered multiple reasons… doesn't add up to 100%」。它只能支持回顾性叙述，**不能**支持"澄清问题导致成功"的因果主张。强度 `strong`（数字本身已核）／`weak`（作为因果证据）。

### 3.5 未能取得一手来源的支持侧说法

- **"Requirements are discovered, not gathered"** — 广泛流传，本轮未能定位可引用的原始出处。`[未找到一手来源]`
- **"A problem well stated is a problem half solved"** — 常被归给 Charles Kettering 或 John Dewey。在 Quote Investigator 的爱因斯坦条目中，该句以「Dewey believed that a problem well stated was half solved」的**转述形式**出现，非 Dewey 原话的直接出处。`[未找到一手来源]`
- **Steve Blank "Get Out of the Building"** — 作者本人博客的相关文章**存在且可检索**（如 2010-03-11 "Teaching Entrepreneurship – By Getting Out of the Building"、2012-03-29 "Nail the Customer Development Manifesto to the Wall"），但本轮未逐篇抽取正文，故不引用其具体主张。另有一条**否定发现**：「50 Coffee Meetings」**不是** Steve Blank 的概念（对其站点 WordPress REST API 检索 `"50 coffee"` 返回 0 条）。`medium`（记录存在）／`UNVERIFIED`（内容）

---

## 4. 反证与失效条件

> 本节是本文最重要的部分。以下证据与"先问清楚再动手"的主结论**方向相反**，或限定其适用边界。

### 4.1 最强反证：Rittel & Webber (1973) — 对 wicked problems，问题无法先于解被定义

这是唯一一条**在逻辑层面**（而非效率层面）否证"先澄清再发散"的论据。原文双扫描 OCR 交叉校验，逐字：

> "This is not possible with wicked-problems. **The information needed to understand the problem depends upon one's idea for solving it.** … every question asking for additional information depends upon the understanding of the problem — and its resolution — at that time. **Problem understanding and problem resolution are concomitant to each other.**"
> — p. 161

> "To find the problem is thus the same thing as finding the solution; **the problem can't be defined until the solution has been found.**"

> "**The formulation of a wicked problem is the problem.** The process of formulating the problem and of conceiving a solution (or: re-solution) are identical, since every specification of the problem is a specification of the direction in which a treatment is considered."

> "One cannot understand the problem without knowing about its context; **one cannot meaningfully search for information without the orientation of a solution concept; one cannot first understand, then solve.**"
> — p. 162

来源：Rittel & Webber, "Dilemmas in a general theory of planning", *Policy Sciences* 4(2):155–169, 1973, DOI 10.1007/BF01405730；OA 扫描 [https://escholarship.org/content/qt01v4t1c9/qt01v4t1c9.pdf](https://escholarship.org/content/qt01v4t1c9/qt01v4t1c9.pdf) 。强度 `strong`。

**但原作者自带边界与出路（这一点常被反证引用者忽略）**：
- 边界：该论断明确只针对 **wicked** problems；对 tame problems「an exhaustive formulation can be stated containing all the information the problem-solver needs」。
- 出路：他们主张的是**交织**而非跳过——
  > "Approaches of the 'second generation' should be based on a model of planning as an **argumentative process** in the course of which an image of the problem and of the solution **emerges gradually among the participants**…"
  > "Part of the art of dealing with wicked problems is **the art of not knowing too early which type of solution to apply**."
  > "it becomes morally objectionable for the planner to treat a wicked problem as though it were a tame one, or **to tame a wicked problem prematurely**…"

### 4.2 过度澄清有可测成本：over-clarification 是被点名的失效模式

- **Ask or Assume?** 逐字：「the INTERACTIVE BASELINE achieves its high resolve rate **at the cost of overclarification, asking questions in nearly every instance regardless of necessity**」；同一 scaffold 在 open-weight backbone 上「averaging **8.71 queries per task**… suggesting **poorer calibration**」；对照 Claude Sonnet 4.5 版本为 **3.06 queries/task**。`strong`，arXiv:2603.26233
- **LHAW (2602.10525)** 的失败模式表量化了两个方向：GPT-5.2 在**含提问的** trial 中 **38%** 属 over-clarification；Gemini 3 Flash **31%** 属 under-clarification。同一篇还给出：「under-clarification likelihood rising to **48%** from 26% across all models」当任务本身失败时。`strong`（表 5 + 正文）
- **Ambig-DS (2605.09698)** 量化了"问题本身已说清时仍发问"的噪声构成：permissive prompt 下，Claude Haiku 4.5 在 Target 轴上 **88%** 的提问是 style-preference 摸底，Gemini 3 Flash 在 Objective 轴上 **85%** 是 out-of-scope 请求；作者的结论句是「permissive prompts induce **over-asking on clear tasks**, while conservative prompts induce **silent defaulting on ambiguous ones**」，且「**No model–policy combination we tested achieves consistent calibration across both axes.**」`strong`
- **Ambig-SWE** 的提问量对比：Llama 3.1 平均 **2.61** 问/任务但问题过于笼统（"Are there any existing workarounds?"）"yielding minimal information"；Qwen 3 平均 **6.02** 问「risking user overwhelm」，而「**this high volume does not translate to better performance**」；Claude Sonnet「exploring the codebase first, then asking only what cannot be independently discovered」以 **3.80–4.03** 问达到与 4.57–6.02 问相当的信息增益。`strong`，arXiv:2502.13069
- **ClarifyGPT 自己把提问当作有代价的资源**：论文把 `"What Clarifying Questions Should be Asked?"` 列为开放问题，并警告「unnecessary interactions, in turn, can **diminish efficiency and compromise the user experience**… Vague or broad questions increase the risk of obtaining off-topic or irrelevant responses.」`strong`，arXiv:2310.10996

### 4.2b 唯一一项**随机对照试验**（RCT）：LLM 辅助"问题重构"没有带来质量提升

**"No Evidence for LLMs Being Useful in Problem Reframing"** — CHI '25，**N=280** 的随机对照实验。这是本轮找到的**唯一**针对"LLM 辅助问题重构/重新框定"的 RCT，且结果是**否定**的：

- **未发现显著的质量提升**；
- 它**扩大**了专家-新手的能力差距（即对最有需要的新手帮助最小）；
- 新手报告**更低的 agency（主体感）**。

来源：arXiv:2503.01631（CHI '25）。强度 `strong`（RCT、同行评议）／**注意**：该实验测的是"问题重构"（reframing）而非"澄清提问"（clarification questioning），两者不等同；但其否定结果直接削弱"让 LLM 帮你把问题想清楚就一定更好"的推论。

### 4.3 唯一找到的"直接对撞"反向结果（弱证据）

**"Less Back-and-Forth: A Comparative Study of Structured Prompting"** — 三条件对比（raw prompt / checklist-improved prompt / clarifying-question prompt），4 类任务 × 3 个 LLM 系统，统一 8 分制评分：

> "Checklist-improved prompts achieved the highest mean rubric score, **7.50 out of 8**, compared with **5.67 for raw prompts** and **6.67 for clarifying-question prompts**. Checklist prompts also produced the best quality-effort tradeoff, **using fewer average tokens** than both raw and clarifying prompts."

- 来源：arXiv:2605.20149
- 强度：`weak` — 单一未评审 7 页预印本、设计小、未见显著性检验、头条数字仅摘要级。
- **读法**：这是"结构化单轮 prompt 可能优于反问澄清"的一个**信号，需要复现**，不足以作为结论。

### 4.4 "用户说的不可靠"→ 反证"靠问就能拿到真相"

- **"福特说用户只想要更快的马"是伪托**。Quote Investigator 逐字：「But I can find no good evidence that Ford ever said this.」「The earliest linkage known to [QI] between the saying and Henry Ford appeared in 'The Cruise Industry News Quarterly' in **1999**.」「the evidence connecting him to the quotation appears to be **very weak**」；最早的福特直接归属是 **2001** 年。`strong`（溯源研究），[https://quoteinvestigator.com/2011/07/28/ford-faster-horse/](https://quoteinvestigator.com/2011/07/28/ford-faster-horse/)
  → 该句只能当作"陈述偏好不可靠"这一**观点**的修辞，不能当历史证据。
- **提问措辞本身会制造答案**（Loftus & Palmer 1974，见 §2 R15）。这否证了"澄清是中性信息提取"的假设：被问出来的"需求"部分是提问方式的产物。`strong`（实验）／`medium`（外推）。

### 4.4b 设计固着（design fixation）的**时机**证据：支持"交织"而非"前端一次性"

这一组证据直接关系到"什么时候给刺激/示例"，是"先澄清"与"边做边澄清"之间的分水岭：

- **前端加载示例会固化；过程中/按需给出的示例反而提升新颖性**：Vasconcelos & Crilly (2016, 开放获取) 的实验发现，**前置**给示例会引发固着，而**在过程中间或按需**提供刺激「lead to more novel ideas」。→ 这是对"把所有澄清压在最前面的门"的一条**直接**经验性反证，同时支持交织式流程。`medium`（单一实验线；固着的元分析效应量仍未核实——Sio 2015、Marsh 1996 本轮未取得，付费墙）
- **常被引用的 Jansson & Smith (1991) 结论被误传**：该文可核的发现是**特征趋同（feature conformity）/固着，且在明确告知的情况下依然持续**（其示例是**故意有缺陷**的）。流行说法"会产生更多方案但更新颖度更低"实为 **Siangliulue et al. 2015** 的表述，**不是** Jansson & Smith 的。`medium`（原始发现）／`UNVERIFIED`（误传版本）

### 4.4c 理论侧：问题不是"被发现"的，而是"被设定"的

- **Donald Schön**（*The Reflective Practitioner*, p.40，经 OpenLibrary 全文检索取得逐字）：「**problems do not present themselves to the practitioner as givens**… When we set the problem, we select what we will treat as the 'things' of the situation.」→ 问题设定是一个**建构动作**，不是一个可从用户口中完整提取的既有物。
- **Richard Buchanan (1992)**（*Design Issues*，「Wicked Problems in Design Thinking」）：「**the designer must discover or invent a particular subject out of the problems and issues of specific circumstances.**」`strong`（原文已核）

### 4.4d 一条来自创业实践的反例：认真听了客户，仍然失败

- **Steve Blank 本人记录的失败案例**（steveblank.com, 2012-02-27, "Killing Your Startup by Listening to Customers"）：一个学生团队「did everything you said」——做了调研、做了 A/B 测试、**把"prospective customers asked for"的东西全建了**、按其要求定价——结果是「**no one is upgrading to our paid product**」。Blank 自己的结论句：「**The goal of listening to customers is not [to] please every one of them.**」`strong`（作者本人博客，一手）
- 这为"问清楚"提供了一个**必要条件而非充分条件**的边界：满足被问到的显性诉求 ≠ 解决真问题。

### 4.5 分析瘫痪一侧

- **Analysis paralysis** 的定义页给出机制描述：「excessive analysis of a situation cause forward motion or decision-making to become paralyzed」；诱因包含「A person may desire a perfect solution… while on the way to a better solution」以及「An overload of options can overwhelm the situation and cause this 'paralysis'」。同页的对偶概念是「extinct by instinct」——「making a fatal decision based on hasty judgment or a gut reaction」。
- 强度：`weak`（概念页，**未引用任何心理学来源**；文中 "extinct by instinct" 标记为 `[citation needed]`；Roberts 2010 称其为 "terminological inexactitude"）。
- **重要更正——不要用 Janis & Mann 反"审慎"**：Janis & Mann (1977) 的 "hypervigilance" 指**时间压力下的惊慌式决策**，不是"过度深思"；他们推荐的**最优模式 "vigilance" 恰恰就是充分搜索与审慎权衡**。因此 Janis & Mann 是**支持审慎**的来源，**不能**用来证明"问太多会瘫痪"。
- **注意**：本轮**未找到**任何把"需求澄清访谈"与"分析瘫痪"直接连起来的实证研究。`[未找到一手来源]`；「用户调研疲劳（user research fatigue）」在**产品访谈**语境下同样**无一手来源**（只能以问卷方法学作**类比**）。
- 一条**方向相反**的真实证据：问卷"行为效应"（question-behavior effect）元分析发现**不存在剂量-反应关系**——「no dose-response relationships… comparing more with less intensive measurement」；一项 2025 年心理学研究亦发现「**sampling frequency, but not questionnaire length**, impacted C/IER」。即"问得更多"并不必然更糟。`medium`（元分析）

### 4.6 其它失效条件（由一手来源自述）

- **5 Whys 的批评：Wikipedia 的转述与一手原话并不一致，应以一手为准。** 丰田内部最有力的批评来自 Teruyuki Minoura（时任丰田全球采购常务董事）在 2003 年 Automotive Parts System Solution Fair 的主题演讲。**一手逐字**（Toyota Motor Corporation, Public Affairs Division, 2003-10-08, p.3；经 Wayback 取得）：「I'm always struck that the five-why method doesn't seem to be working as well as it should be because **there's been a lack of practical training**. The reason is that they end up **falling back on deduction**. Yes, deduction. So when I ask them 'Why?' **they reel off five causes as quick as a flash by deduction**. … **so many causes come back that you end up totally confused as to which of them is important**.'」同页点出正确做法：「Minoura emphasizes that **on-the-spot observation rather than deduction is the only correct way to answer a 'Why?' question.**」
  → **这与 Wikipedia 的写法不同**：Wikipedia 说 Minoura 批评该法「too basic a tool to analyze root causes at the depth necessary」，但 **"basic" 与 "depth" 两个词并不出现在丰田一手文件中**；一手批评的实质是**缺乏实战训练导致用演绎代替现场观察，产出过多无法区分重要性的原因**。**引用时不要用 Wikipedia 的转述当引语。** `strong`（一手 Toyota 文件）
  → Wikipedia 另列的五条理由（停在症状层、无法超越调查者已有知识、结果不可重复等）是 **Wikipedia 自己的综述**，不是 Minoura 的话；属 `medium`。
  → 独立学术批评：Alan J. Card, "The problem with '5 whys'", *BMJ Quality & Safety* 26(8):671–677, 2017, DOI 10.1136/bmjqs-2016-005849（同行评议），其两条批评为「The arbitrary depth of the fifth why is unlikely to correlate with the root cause」与「The five whys is based on a **misguided reuse of a strategy to understand why new features should be added to products**, not a root cause analysis」。`strong`（同行评议）
- **Design Council 自己否证对 Double Diamond 的线性读法**：「Many of the organisations we support learn something more about the underlying problems which can send them back to the beginning of their diamond work. **Making and testing very early stage ideas can be part of discovery.**」强度 `strong`，来源见 §1。
- **Rittel & Webber 的"10 条特性"清单在流传中已漂移**（对引用者的警示）：原版第 3 条是「not true-or-false, but **good-or-bad**」（流行版写成 "better or worse"，实为同条**正文**被折进标题）；原版第 10 条是「**The planner** has no right to be wrong」（流行版写成 "The social planner"）。另常被加进清单的「The problem is not understood until after the formulation of a solution」是 **Conklin 的改写**，**不是** 1973 原文。强度 `strong`（双扫描已核）。

---

## 5. LLM 需求澄清的失效模式

> 每条含「模式｜证据｜来源」。数字均取自论文原文（本地 PDF 抽取后逐字核对）。

### 5.1 Sycophancy（迎合 / 压力下改变立场）

| 证据 | 逐字/数字 | 来源 | 强度 |
|---|---|---|---|
| 被测模型 | `claude-1.3`, `claude-2.0`, `gpt-3.5-turbo`, `gpt-4`, `llama-2-70b-chat`（五个生产级助手） | Sharma et al., ICLR 2024 | `strong` |
| 反馈迎合 | 「AI assistants provide more positive feedback about arguments that the user likes. Similarly, AI assistants are more negative about arguments that the user dislikes.」且「the feedback… **does not depend solely on the content of the text but is affected by the user's preferences**」 | 同上 | `strong` |
| 「Are you sure?」 | 回答改变率「between **32% for GPT-4 and 86% for Claude 1.3**」；错误承认率「between **42% for GPT-4 and 98% for Claude 1.3**」；「**Claude 1.3 wrongly admits mistakes on 98% of questions**」 | 同上 | `strong` |
| 准确率损失 | 「The user suggesting an incorrect answer can reduce accuracy by up to **27%** (LLaMA 2)」；附录：「Asking the 'Are you sure?' question causes the accuracy to drop by up to **27%** (Claude 1.3) on average」 | 同上，arXiv:2310.13548 | `strong` |
| **机制** | 「the sycophantic responses are preferred over the baseline truthful responses **95%** of the time」；对最难的反例「the PM prefers the sycophantic response almost half the time (**45%**)」；偏好数据让"matches user's beliefs"成为高预测力特征（holdout acc **71.3%**） | 同上 | `strong` |
| 官方确认 | Anthropic 自家页面确认「both humans and preference models (PMs) prefer convincingly-written sycophantic responses over correct ones a non-negligible fraction of the time」 | [https://www.anthropic.com/research/towards-understanding-sycophancy-in-language-models](https://www.anthropic.com/research/towards-understanding-sycophancy-in-language-models) | `strong` |
| 社会压力（权威版） | 仅在**权威**压力下，GPT-4o-mini 把正确答案翻成错误答案的比例为 **62.0%**（SycoBench-600，Findings of ACL 2026） | 见 `/tmp/r1src/findings/M3-mode1.md` §1.7（本地抽取） | `medium`（会议论文，本轮仅取二级摘录） |
| 随压力改口但纠错率低 | 一句随意的 "sure" 反驳说服率 **84.5%**，但纠错质量很差（**17.1%**）——即"无差别改口" | Kim & Khashabi, Findings of EMNLP 2025 | `medium`（二级摘录） |
| RLHF 方向（**措辞已校正**） | Perez et al. 2022 用 model-written evaluations 发现「The largest (52B) models are **highly sycophantic: >90% of answers match the user's view** for NLP and philosophy questions」，且「**RLHF does not train away sycophancy and may actively incentivize models to retain it**」。**注意：该文并未显示 sycophancy 随 RL 步数上升**——不要写成"RLHF 放大了迎合" | arXiv:2212.09251 | `medium` |
| 多轮压力下的塌缩（更强的机制证据） | SPINE（arXiv:2609.09090）：对**假前提**的让步率随轮次从 **51%（第 5 轮）升到 97%（第 25 轮）**（Gemini 3.1 Pro）、**50% → 92%**（DeepSeek V4 Pro），而固定的 4 轮脚本仅 **28%**；且「the correct position **often remains represented in a reasoning trace** when the response concedes」——即模型是**选择**让步，不是不会 | arXiv:2609.09090；见 `/tmp/r1src/findings/M3-mode1.md` | `medium`（预印本） |
| 假前提纠正率上限 | Cancer-Myth (arXiv:2504.11373)：「**no frontier LLM—including GPT-5, Gemini-2.5-Pro, and Claude-4-Sonnet—corrects these false presuppositions more than 43% of the time**」；而缓解措施在干净前提上引入 **41%** 误报 | arXiv:2504.11373 | `medium`（预印本） |
| **反向证据（必须并列）** | *AI Sycophancy and Decisions*（Conlon & Schwardmann, SSRN 预印本, DOI 10.2139/ssrn.6597184）：1500 名被试、30 个决策环境，结果「**AI advice depolarizes choices on average**, moving participants away from their initial leanings」；且「**Increasing sycophancy weakens depolarization**, showing that sycophancy is behaviorally relevant, even if it is **generally outweighed by the informativeness of AI advice**」 | [https://doi.org/10.2139/ssrn.6597184](https://doi.org/10.2139/ssrn.6597184) | `weak`（未评审预印本；仅摘要已核） |
| **明确的空缺** | 本轮**未找到**任何同行评议研究，测量 sycophancy 对**需求陈述 / 设计决策 / user story 质量**的因果影响 | — | `[未找到一手来源]` |

**对澄清场景的直接含义**：每一个"确认一下对吗"的提问，都是用户覆盖模型正确立场的机会；而用户主动提出的**方案**，是模型被训练去附和的一种前提。

### 5.2 过早给方案 / 过早进入实现

- 官方一手：「Separate research and planning from implementation **to avoid solving the wrong problem**. Letting Claude jump straight to coding can produce code that **solves the wrong problem**.」`strong`，[https://www.anthropic.com/engineering/claude-code-best-practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- 实证（能力侧）：「models **struggle to distinguish between well-specified and underspecified instructions**」——即模型自己判断"该不该问"的能力很差。`strong`，arXiv:2502.13069
- 识别-行为落差：「models often identify ambiguity when explicitly asked to judge it, yet in the QA setting they **overwhelmingly default to direct answers**」；且「Retrieved context further widens this gap by improving answerability while making models **even less likely to ask clarifying questions**」。`strong`，arXiv:2605.25284
- 行为率量化：跨 8+ 模型，answer rate 通常 **>95%**，80–95% 属"纯回答"（无拒绝、无澄清）；**澄清问题率最高仅约 5%**（Claude 家族，无上下文歧义问题）。代码场景更差：ChatGPT/CodeLlama/CodeQwen1.5 Chat 的 communication rate **<20%**，DeepSeek Coder/Chat 为 **30.76% / 37.93%**；「more than **60%** of responses from Code LLMs still generate code rather than ask questions」。`strong`，arXiv:2605.25284、arXiv:2308.13507（后者为 position paper，仅作补充）

### 5.3 把用户提的方案当成需求（solution-as-requirement）

- **最强的一手机制证据来自 Amazon PR/FAQ**，而非学术文献。其新闻稿模板要求单独的 **Problem Paragraph**，并逐字规定：「Make sure you write this paragraph **from the customer's point of view**」，同时给出反面样本与硬性丢弃规则：「You started with what your company can do and worked backward from there. **This press release should be discarded before even writing an FAQ.**」`strong`，[https://www.workingbackwards.com/resources/working-backwards-pr-faq/](https://www.workingbackwards.com/resources/working-backwards-pr-faq/)
- 另一条官方规则来自 Google 设计文档的 non-goals 定义：「non-goals **aren't negated goals** like 'The system shouldn't crash', but rather **things that could reasonably be goals, but are explicitly chosen not to be goals**」。`strong`，[https://www.industrialempathy.com/posts/design-docs-at-google/](https://www.industrialempathy.com/posts/design-docs-at-google/)
- Agent 框架层面的对应机制：BMAD 的 bmad-prfaq 明写「If the user leads with a solution... **redirect to the customer's problem**」；Spec Kit `/specify` 明写「Focus on **WHAT** users need and **WHY**. Avoid HOW to implement」。`medium`（BMAD，GitHub 仓库）／`strong`（Spec Kit）
- **空缺**：本轮**未找到**直接量化"LLM 把用户方案当需求"的同行评议实证。`[未找到一手来源]`

### 5.4 编造用户没说的需求（hallucinated requirements）

| 证据 | 数字 | 来源 | 强度 |
|---|---|---|---|
| 需求含糊 → 生成物注入需求未述行为 | 4 个含糊需求产生 127 个测试用例，**68%** 含"需求陈述中不存在的假设"；4 个清晰需求产生 42 个用例，幻觉率 **12%**。按领域：含糊需求平均 **76.8%**（电商 68%、IoT/嵌入式 88%），清晰需求平均 **13.6%**（8–22%） | 见 `/tmp/r1src/findings/M3-mode4.md` F1（本地 PDF 抽取） | `medium`（预印本；但被测物是**测试 artifact**而非需求本身） |
| 需求生成中的幻觉计数 | 24 次 LLM 运行产出 **111 条被专家判定为幻觉的需求** vs **72 条有效需求** | 同上 | `medium`（预印本） |
| 需求决策未被授权 | **24.7%** 的需求决策「not explicitly mandated by the stakeholder」 | 同上 | `weak`（仅摘要可得） |
| 工作示例 | 含糊需求 "delete the user account securely" 下，模型生成了 CAPTCHA、SMS 验证、30 秒内不可逆删除等测试——「Although each one of these actions makes sense in some products, **they cannot be traced back to the original requirement**」 | 同上 | `medium` |

**关键观察**：该失效模式在文献中的**可操作化定义就是可追溯性**（"does not trace to… the explicit requirement"）。这与本项目已有的 verbatim + source 锚点方向一致，但本文不做设计建议。

### 5.5 压力下收敛 / 过早塌缩选项空间

| 证据 | 逐字/数字 | 来源 | 强度 |
|---|---|---|---|
| 同源起点导致想法趋同 | 「When we tried our experiment **without setting the AARs off in different directions, they all quickly settled on similar ideas, making much less progress overall**」；而刻意给不同出发点后达 PGR **0.97** vs 人类基线 **0.23** | [https://www.anthropic.com/research/automated-alignment-researchers](https://www.anthropic.com/research/automated-alignment-researchers) | `strong` |
| **模型间想法高度同质（规模最大的一条）** | Artificial Hivemind（NeurIPS 2025）：「in **79%** of cases, the average similarity exceeds **0.8**」；模型间相似度「ranges from **71% to 82%**」；且**换用多样性解码也压不下去**：「**81%** … exceed 0.7 similarity and **61.2%** exceed 0.8」 | arXiv:2510.22954（同行评议） | `strong` |
| **AI 辅助反而降低人群想法多样性（同时提升个体质量）** | Doshi & Hauser, *Science Advances* 2024：接入 AI 想法使故事彼此更相似（占总跨度 **10.7% / 8.9%**），并把人锚定在 AI 思路上（相似度再增 **5.2% / 5.0%**），**而个体质量是上升的**——构成一个社会困境 | DOI 10.1126/sciadv.adn5290（同行评议，开放获取全文） | `strong` |
| 过早共识（多 agent） | 「**dense communication topologies accelerate premature convergence**」；Vendi 分数 8.08（横向）vs 4.65（跨学科），而质量仅 +0.6/10；成因是**结构性**的——「Identity and Tone together explain only **9.2%** of total variance」而「the structural effect … explains **42%**」 | arXiv:2604.18005（预印本，"Diversity Collapse in Multi-Agent LLM Systems"） | `medium`（已直接复核 PDF） |
| 分歧即失败的观点（能力侧） | 「Existing LLMs often respond by **presupposing a single interpretation** of such ambiguous requests, **frustrating users who intended a different interpretation**」 | arXiv:2410.13788（ICLR 2025） | `strong` |

### 5.6 提问质量与"该问不问/不该问乱问"

见 §4.2 已列数字。补充两条"问得不好"的直接刻画：

- **CLAMBER (arXiv:2405.12063)** 逐字：「the **limited practical utility of current LLMs in identifying and clarifying ambiguous user queries, even enhanced by chain-of-thought (CoT) and few-shot prompting**. These techniques may result in **overconfidence** in LLMs and yield only marginal enhancements… current LLMs fall short in generating high-quality clarifying questions due to **a lack of conflict resolution and inaccurate utilization of inherent knowledge**.」`strong`（基准论文）
- **问得多的不一定问得好**：HumanEvalComm 的 *Good Question Rate* 与 *Communication Rate* 并不同向——CodeLlama 只问 10.16% 但"好问题率"37.55%，CodeQwen1.5 Chat 只问 4.82% 但好问题率 41.68%。`strong`，arXiv:2308.13507
- **训练只奖励"提问"会造出永远在问的模型**（"Training that rewards *questions only* produces a model that always asks"），故 STaR-GATE 需要在 prompt 层面加防过度提问的护栏。`strong`（含 Q2-g/Q2-f 小节），arXiv:2403.19154

---

## 6. 已有 agent 流程对标

> 全部为官方文档或官方仓库一手来源。核心问题：它们**具体怎么做的**。

### 6.1 GitHub Spec Kit（`/specify` → `/clarify` → `/plan` → `/tasks`）

**阶段顺序**（README）：constitution 每项目一次；每 feature 走 `specify → plan → tasks → implement → converge`。`strong`

**`/specify` 的硬约束**（逐字）：
- 「Focus on **WHAT** users need and **WHY**. Avoid HOW to implement (no tech stack, APIs, code structure).」
- 「**LIMIT: Maximum 3 [NEEDS CLARIFICATION] markers total**」
- 优先级排序：「scope > security/privacy > user experience > technical details」

**`/clarify` 的硬约束**（逐字，这是业界目前最细的一份"提问规程"）：
- 目标句：「Detect and reduce ambiguity or missing decision points in the active feature specification and record the clarifications directly in the spec file.」
- 时序门：「This clarification workflow is expected to run (and be completed) **BEFORE** invoking plan. **If the user explicitly states they are skipping clarification (e.g., exploratory spike), you may proceed, but must warn that downstream rework risk increases.**」
- 覆盖扫描：10 类 taxonomy，逐类标 `Clear / Partial / Missing`，产出**内部** coverage map 用于排序（`do not output raw map unless no questions will be asked`）。
- 提问预算：「**Maximum of 5 total questions across the whole session.**」
- 提问节奏：「**Present EXACTLY ONE question at a time.**」「**Never reveal future queued questions in advance.**」
- 问题形态：每题必须可被「A short multiple‑choice selection (2–5 distinct, mutually exclusive options)」或「A one-word / short‑phrase answer (explicitly constrain: "Answer in <=5 words")」回答。
- 取舍规则：只问会实质影响「architecture, data modeling, task decomposition, test design, UX behavior, operational readiness, or compliance validation」的；排除「already answered, trivial stylistic preferences, or plan-level execution details」；若未决类 >5，「select the top 5 by **(Impact * Uncertainty)** heuristic」。
- 表述质量：问题必须以 `**Question:**` 开头、以 `?` 结尾；**禁止**用 topic label 或 requirement id 当问题本身（举例 `Acceptance device/runtime matrix (FR-023)` 被判 INVALID）；问题后必须加一句 plain-language "Why it matters"。
- **给建议答案**：多选题要「Present your **recommended option** prominently at the top with clear reasoning」；短答题要给 `**Suggested:**`。用户可回 "yes"/"recommended"/"suggested" 直接采纳。
- 落盘方式：在 spec 里建 `## Clarifications` + `### Session YYYY-MM-DD`，逐条追加 `- Q: … → A: …`，并**立刻**改写到对应小节（Functional Requirements / Actors / Data Model / Success Criteria / Edge Cases / Terminology）；「Save the spec file AFTER each integration to minimize risk of context loss」。若新答案令旧陈述失效，「replace that statement instead of duplicating; **leave no obsolete contradictory text**」。
- 结束条件（三者之一）：关键歧义提前全部解决 / 用户示意结束 / 问满 5 个。
- 收尾强迫披露：必须输出 coverage summary 表（`Resolved / Deferred / Clear / Outstanding`），并列 Outstanding/Deferred 项；若配额用尽仍有高影响类未决，「**explicitly flag them under Deferred with rationale**」。
- `/plan` 侧的对接口：unknowns → `NEEDS CLARIFICATION` → 「Phase 0: Generate research.md (resolve all NEEDS CLARIFICATION)」；「**ERROR on gate failures or unresolved clarifications**」。

来源：[https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/clarify.md](https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/clarify.md) 、`/specify.md`、`/plan.md`、`/tasks.md`、[https://github.com/github/spec-kit](https://github.com/github/spec-kit) 。强度 `strong`。

### 6.2 Kiro（AWS）

**产物结构**：`requirements.md` / `design.md` / `tasks.md`。`strong`

**两个 workflow 变体**（官方逐字）：
- **Requirements-First**：「The Requirements-First workflow is the traditional approach to Feature Specs, **starting with what the system should do before determining how to build it**.」Flow：Requirements → Design → Tasks。
- **Design-First**：从技术设计出发反推需求。Flow：Design → Requirements → Tasks。
- **Quick Spec**：定义为**去掉审批门的版本**——「Generate requirements, design, and tasks in one pass **without approval gates between phases**」；官方说明是「You answer clarifying questions up front and land directly on the task list」。

**审批门**（feature-specs 页 mermaid 图的逐字标签）：`Start a spec → requirements.md → {Happy?}` → `no` → `Edit/Request changes` 回到 `requirements.md`；`yes` → `design.md` → `{Happy?}` → … → `Implementation`。`strong`

**需求先在的强调**（requirements-first 页逐字）：
- 「**Once you confirm the requirements**, Kiro generates a `design.md` document that describes how to implement them.」
- 「The power of Requirements-First is getting the **'what' right before committing to the 'how'**」
- 用户在该阶段被要求做的事：`Review requirements for completeness` / `Iterate on user stories and acceptance criteria` / `Add any missing scenarios or edge cases` / `Confirm when requirements meet your needs`

**澄清提问机制**：
- CLI 流程逐字：「Describe what you want to build or fix. **The agent asks clarifying questions if needed.**」；每阶段检查点按 `Ctrl+X` 读该阶段文档并挂行内评论。
- **`Analyze Requirements`（需求→设计之间的专门歧义猎取步骤）** 逐字给出它抓什么：
  - `Logical inconsistencies` — 「two requirements that individually make sense but are collectively impossible」
  - `Ambiguities` — 「language like "large files" or "fast response times" that would produce divergent implementations」
  - `Conflicting constraints` — 「functional and non-functional requirements that can't all be satisfied at once」
  - `Unstated assumptions` — 「references to undefined concepts or behaviors」
  - `Missing edge cases` — 「failure modes, boundary conditions, and concurrent access scenarios not covered by the happy path」
  - 调用方式：`/spec analyze_requirements`；「The analysis takes minutes, not seconds - cross-requirement reasoning is more computationally intensive than typical Kiro operations. **As findings are ready, clarifying questions stream into chat.** Each question includes **the requirements involved, a plain-language explanation of the issue, and suggested fixes you can select**. You can also type a custom answer or **dismiss a question if the ambiguity is intentional**. As you resolve questions, Kiro updates `requirements.md` in the editor.」
  - 适用范围自述：「especially valuable for complex features with many requirements, domain-sensitive projects… and **Quick Spec sessions where requirements were auto-generated without manual review**. **For small or well-understood specs, you can skip the analysis** and proceed directly to design.」

**需求写法**：EARS 句式「`WHEN [condition/event]` / `THE SYSTEM SHALL [expected behavior]`」，官方列出的好处为 Clarity / Testability / Traceability / Completeness。
> **溯源注意**：EARS 的学术出处为 Mavin, Wilkinson, Harwood & Novak, IEEE RE 2009, pp.317–322, DOI 10.1109/RE.2009.9 —— 本轮仅通过 Crossref/OpenAlex 核到**书目元数据**（IEEE Xplore 返回 HTTP 202/0 字节，全文 `UNVERIFIED`）。且 **Kiro 页面本身从未引用 Mavin et al.**，「Kiro 的 EARS 来自该论文」属**我们的推断**，不是 Kiro 的声明。强度 `medium`。

来源：[https://kiro.dev/docs/specs/feature-specs/](https://kiro.dev/docs/specs/feature-specs/) 、[https://kiro.dev/docs/specs/analyze-requirements/](https://kiro.dev/docs/specs/analyze-requirements/) 、[https://kiro.dev/docs/specs/](https://kiro.dev/docs/specs/) 、[https://kiro.dev/docs/specs/plan/](https://kiro.dev/docs/specs/plan/) 、[https://kiro.dev/docs/specs/best-practices/](https://kiro.dev/docs/specs/best-practices/) 。强度 `strong`。

### 6.3 Amazon PR/FAQ（Working Backwards）

- **写在动手之前**：「Its key tenet is to start by defining the customer experience, then iteratively work backwards from that point until the team achieves clarity of thought around what to build.」
- 「**Writing a press release is a forcing function** to ensure that the creator of the new product idea is focused on the customer.」
- 纪律句：「It takes conviction and discipline to say, **'We are not ready yet to start building. We need more clarity on these next few issues first.'**」
- **PR 模板组件（逐字顺序）**：Heading（一句话）/ Subheading（「Describe the customer… Describing the customers precisely here is critical. **If you think your product is for everyone, you are mistaken.**」）/ Summary Paragraph / **Problem Paragraph**（「write this paragraph **from the customer's point of view**」）/ Solution Paragraph(s) / Quotes & Getting Started。
- **FAQ 先外后内**：External FAQ 先行，再 Internal FAQ（「questions that senior leaders and stakeholders… will ask」）；附录含约 20 条标准内部问题。
- **评审仪式**：多轮改写；评审会以「**15–20 minutes of silent reading**」开场，评审清单含「Is the problem clearly defined?」
- Vogels 2006（官方博客）四步：PR → FAQ → customer experience → user manual；「you start with your customer and work your way backwards until you get to the minimum set of technology requirements」。
- **未核实**：`amazon.jobs` 与 `aboutamazon` 的 PR/FAQ 页面均 404；Ian McAllister 的 Quora 回答未取得。故**权威来源只有作者自建站与 Vogels 博客**，不是 amazon.com 官方域名。强度：内容 `strong`（逐字已核）／归属 `medium`（非 amazon.com 域名）。

来源：[https://www.workingbackwards.com/resources/working-backwards-pr-faq/](https://www.workingbackwards.com/resources/working-backwards-pr-faq/) 、[https://www.allthingsdistributed.com/2006/11/working_backwards.html](https://www.allthingsdistributed.com/2006/11/working_backwards.html)

### 6.4 Google 设计文档 — problem/context 段

- **章节顺序**：`Context and scope` → `Goals and non-goals` → `The actual design` → `Alternatives considered` → `Cross-cutting concerns`。
- **Context and scope 的逐字约束**：「This **isn't a requirements doc**. **Keep it succinct!** … This section should be **entirely focused on objective background facts**.」
- **Goals and non-goals 的逐字约束**：non-goals「**aren't negated goals** like 'The system shouldn't crash', but rather **things that could reasonably be goals, but are explicitly chosen not to be goals**」。
- **何时不写**：文档本身有 scope 纪律（`skip when the problem isn't ambiguous`），即**不是所有改动都要走完整澄清**。
- 目的句：「The design doc documents the high level implementation strategy and key design decisions with emphasis on **the trade-offs that were considered** during those decisions.」以及「As software engineers our job is not to produce code per se, but rather to solve problems.」
- **URL 迁移注意**：旧 `industrialempathy.com/posts/design-docs/` 与 Eugene Yan 的摘要页均 404；现行 URL 为 `/posts/design-docs-at-google/`。强度 `strong`（逐字已核）。

来源：[https://www.industrialempathy.com/posts/design-docs-at-google/](https://www.industrialempathy.com/posts/design-docs-at-google/)

### 6.5 Anthropic Claude Code — "让 Claude 访谈你"

- 阶段模型逐字：「**Explore first, then plan, then code** — Separate research and planning from implementation to avoid solving the wrong problem.」四阶段：Explore（只读）→ Plan（可 `Ctrl+G` 用编辑器直接改计划）→ Implement → Commit。
- **成本自述（重要）**：「Plan mode is useful, but also **adds overhead**. For tasks where the scope is clear and the fix is small… ask Claude to do it directly. … **If you could describe the diff in one sentence, skip the plan.**」
- **访谈机制**（无提问数量上限）逐字：
  > "I want to build [brief description]. Interview me in detail using the AskUserQuestion tool. Ask about technical implementation, UI/UX, edge cases, concerns, and tradeoffs. Don't ask obvious questions, dig into the hard parts I might not have considered. **Keep interviewing until we've covered everything**, then write a complete spec to SPEC.md."
- 完成后：「start a **fresh session** to execute it. The new session has clean context focused entirely on implementation, and you have a written spec to reference.」
- 规范自述：「The most useful specs are **self-contained**: they name the files and interfaces involved, **state what is out of scope**, and end with an end-to-end verification step that proves the feature works.」
- **负向发现**：`[https://www.anthropic.com/engineering/building-effective-agents`（2024-12-19）中](https://www.anthropic.com/engineering/building-effective-agents`（2024-12-19）中) **"clarif" 出现 0 次**，无"设计前先问"的明确步骤；`writing-tools-for-agents` 中的 clarifying question 指的是**工具调用歧义**，不是前期问题发现。**不要把这两页当作"痛点优先澄清"的依据。**

来源：[https://www.anthropic.com/engineering/claude-code-best-practices](https://www.anthropic.com/engineering/claude-code-best-practices) 。强度 `strong`。

### 6.6 其它（简）

| 框架 | 相关机制 | 来源 | 强度 |
|---|---|---|---|
| **Cursor Plan Mode** | 「Plan Mode creates detailed implementation plans **before writing any code**. Agent researches your codebase, **asks clarifying questions**…」 | Cursor 官方文档 | `medium`（本轮未逐字取回原文） |
| **BMAD-METHOD** | 门禁「**is the intent already well defined?**」；Spec Law「Intents describe **WHAT, not HOW**」；product-brief「**Read what exists first; ask only what is missing**」；bmad-prfaq 五阶段，含「If the user leads with a solution... **redirect to the customer's problem**」；未决项进 `open_questions[]`，**从不编造** | [https://github.com/bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) | `medium` |
| **Agent OS** | `/shape-spec`「**must be run in plan mode**」；「ask **1-2** clarifying questions」；Step 9 为「(approve / adjust)」；Task 1 固定为「Save spec documentation」；`/plan-product` 开场问题「**What problem does this product solve?**」 | [https://github.com/buildermethods/agent-os](https://github.com/buildermethods/agent-os) | `medium` |
| **OpenAI — A Practical Guide to Building Agents** | **负向发现**：**没有**"设计前先澄清"的阶段 | OpenAI 官方 PDF | `medium`（作为否定证据） |
| **Windsurf planning 文档** | 404，未取得 | — | `UNVERIFIED` |

### 6.7 跨框架重复出现的机制形状

把上述一手材料抽象后，反复出现的是这五步（**描述**，非推荐）：

1. 强制先产出一个**描述终态**的 artifact（新闻稿 / requirements.md / spec.md / 设计文档），且用**客户可观察、不含实现**的语言写。
2. 把未知与歧义**显式枚举**出来（`[NEEDS CLARIFICATION]`、`open_questions[]`、`Analyze Requirements` 的五类），而不是静默猜。
3. 对提问**设上限并按影响度排序**（Spec Kit 5 问 / 1 问一次 / Impact×Uncertainty）。
4. 把"进入设计/实现"的转换**挂在人对该 artifact 的批准**上（Kiro `{Happy?}` 门、Agent OS Step 9、Claude Code 出 plan mode）。
5. 让 artifact（而非对话）成为**持久记录**（Spec Kit 的 `## Clarifications` + 原子写回）。

**同时存在的反向样本**：OpenAI 的 agents 指南没有这一步；Spec Kit 与 Kiro 都提供**显式降低澄清强度的快路径**（`exploratory spike` 跳过、`Quick Spec` 无审批门）；Google 设计文档明说小问题不该走完整澄清；Anthropic 明说 plan mode 有 overhead、一句话能说清 diff 就跳过。

---

## 7. 对 CARD-07 的可落地含义（只列「有哪些做法可选」）

> 按任务要求：**不排序、不推荐、不写 CARD-07 的具体设计建议**。仅列出「业界存在哪些可选做法」及其**已知代价**。

| # | 可选做法 | 存在的一手先例 | 已知代价 / 反面条件 |
|---|---|---|---|
| A1 | **给提问总数设硬上限**（如全会话 ≤5） | Spec Kit `/clarify` | 配额用尽仍有高影响未决 → 必须转 Deferred 显式披露；上限过低会漏项 |
| A2 | **不设上限，问到"覆盖完"为止** | Claude Code "Keep interviewing until we've covered everything" | 无防疲劳机制；Anthropic 自述 plan mode **adds overhead** |
| A3 | **一次只问一个问题** | Spec Kit `EXACTLY ONE question at a time` | 轮次多、交互时间长 |
| A4 | **一次问 1–2 个** | Agent OS `/shape-spec` | 未答项可能被静默丢弃 |
| A5 | **按 Impact × Uncertainty 排序提问队列，且不预泄露队列** | Spec Kit | 用户无法整体规划自己的回答时间 |
| A6 | **每题必须可选项化（2–5 互斥项）或 ≤5 词短答** | Spec Kit | 复杂/情感类问题难以选项化；可能把开放痛点压成选项 |
| A7 | **每题给推荐答案，用户可回 "yes" 采纳** | Spec Kit `/clarify`；Kiro `suggested fixes you can select` | 与 sycophancy 风险叠加：模型推荐 + 用户秒采纳 = 无人真正裁决 |
| A8 | **允许用户把歧义标为"有意的"并跳过** | Kiro `dismiss a question if the ambiguity is intentional` | 可能被用来跳过真问题 |
| A9 | **用固定分类法做覆盖扫描，逐类标 Clear/Partial/Missing** | Spec Kit 10 类 taxonomy | 分类法本身会框定"什么算歧义"；未列入的类别不被看见 |
| A10 | **在问题后强制附一句 "Why it matters"** | Spec Kit | 每题变长 |
| A11 | **禁止把 topic label 当问题** | Spec Kit（明举 INVALID 例） | 需要额外的格式校验 |
| A12 | **答案即时写回唯一材料 + 保留 Q→A 痕迹** | Spec Kit `## Clarifications` + `Session YYYY-MM-DD` + 逐条原子写回 | 材料变长；需处理"新答案令旧陈述失效"的替换而非追加 |
| A13 | **未决项显式留标记（≤3 个），由后续阶段强制清零** | Spec Kit `[NEEDS CLARIFICATION]` → `/plan` Phase 0 清零，未清则 ERROR | 硬 ERROR 会阻断推进（本项目宪法对"阻断性质量门"有约束，属外部条件） |
| A14 | **需求→设计之间插入专门的跨需求歧义分析步骤** | Kiro `Analyze Requirements`（5 类：逻辑不一致/含糊/冲突约束/未述假设/缺失边界） | 官方自述「takes minutes, not seconds」；小且易懂的 spec 可直接跳过 |
| A15 | **用 EARS 句式把需求写成可测形态**（`WHEN … THE SYSTEM SHALL …`） | Kiro（学术出处 Mavin et al. 2009，仅书目已核） | 句式强制结构，可能不适用于非行为类需求 |
| A16 | **先写"客户可观察的终态 artifact"再倒推** | Amazon PR/FAQ | 需要多轮改写与静默阅读评审仪式；作者自述需要"conviction and discipline" |
| A17 | **设"问题段落"为必填，并规定必须从客户视角写** | Amazon PR/FAQ Problem Paragraph | 需要能判定"是否从客户视角"的评审 |
| A18 | **显式写 non-goals（"本可以是要目标但被明确选择不做"）** | Google 设计文档 | 与 goals 同为必填，增加篇幅 |
| A19 | **把"发散"与"收敛"的产物分开记录，并保留落选理由** | （见同目录 `I1` 已清点的 M1/NGT 等内部候选） | 本文为外部调研，不重复内部候选 |
| A20 | **为同源发散设置不同起点以防趋同** | Anthropic AAR（同一 prompt 下九个 agent「quickly settled on similar ideas」） | 需要多个 agent，成本高 |
| A21 | **设置"低澄清强度"快路径，并显式说明代价** | Kiro `Quick Spec`（无审批门）；Spec Kit 允许 `exploratory spike` 跳过但**必须警告 downstream rework risk increases**；Anthropic「一句话能说清 diff 就跳过 plan」；Google「problem 不 ambiguous 就别写完整 doc」 | 快路径会被误用为默认路径 |
| A22 | **把"用户主动给出的方案"单独标注为"用户提议"，与原始痛点分列** | Amazon PR/FAQ 的丢弃规则；BMAD「If the user leads with a solution... redirect to the customer's problem」 | 需要额外的字段/结构 |
| A23 | **在澄清产物里保留 verbatim 原话 + 派生项锚点** | 由 §5.4 的幻觉可操作化定义（traceability）反推；外部对应物为 ISO/IEC/IEEE 29148 双向可追溯 | 材料变长；需处理改写的 suspect 传播（本行外部对应物见同目录 `I1`） |
| A24 | **限制提问范围在 WHAT/WHY，禁止进入 HOW/技术栈/任务拆解** | Spec Kit `/specify` + `/clarify` 排除规则 | 某些 WHAT 确实无法脱离 HOW 判断（Rittel & Webber 的核心反驳） |
| A25 | **允许"问题与解共同演化"的迭代写法，而非单向门** | Rittel & Webber「argumentative process… emerges gradually」；Design Council「making and testing very early stage ideas **can be part of discovery**」；Boehm & Basili「requirements emerge from prototyping」 | 与"先澄清再发散"的门式流程直接冲突，需要决定如何处理这个张力 |

---

## 8. 不可引用清单

> 见到但**查不到原始出处**、或**明显以讹传讹/被自家新版取代**、或**仅二手转述**的说法。诚实标注优先于凑证据。

| 说法 | 问题 | 处置 |
|---|---|---|
| **「爱因斯坦：给我一小时解决问题，我会花 55 分钟定义问题、5 分钟解决」** | **伪托**。Quote Investigator 逐字：「**There is no substantive evidence that Einstein ever made a remark of this type.**」不在《The Ultimate Quotable Einstein》(Princeton UP) 中；最早匹配为 1945 年 George E. Carrothers 的小册子，归给数学家 **Robert J. Aley**；最早归给爱因斯坦是 **1973** 年（且小时被切成 40/15/5 三段）；爱因斯坦 1955 年已去世 | **不可作为爱因斯坦引语**。若要用"先定义问题更省时"的观念，改引 1945/1966 的原始表述或明确标注为民间说法。来源：[https://quoteinvestigator.com/2014/05/22/solve/](https://quoteinvestigator.com/2014/05/22/solve/) |
| **「福特：如果我问用户要什么，他们会说更快的马」** | **伪托**。QI：「I can find no good evidence that Ford ever said this.」最早把该句与福特关联是 **1999** 年，最早直接归属是 **2001** 年；概念本身可追到 1930 年 | **不可作为福特引语**，只能作为修辞。来源：[https://quoteinvestigator.com/2011/07/28/ford-faster-horse/](https://quoteinvestigator.com/2011/07/28/ford-faster-horse/) |
| **「Boehm：修复缺陷的成本是需求阶段的 100 倍」** | **残缺引用**。数字真实（Boehm & Basili 2001, item ONE），但原文同段写明小规模非关键系统是 **5:1**，并建议这类系统用 **continuous prototype mode**；同篇 item TWO 明确支持**需求涌现** | 引用时必须带 5:1 例外与 emergent process 段落。来源：[https://www.cs.umd.edu/~basili/publications/journals/J81.pdf](https://www.cs.umd.edu/~basili/publications/journals/J81.pdf) |
| **「CB Insights：没有市场需求是创业失败第 1 原因，占 42%」** | **已被自家新版取代**。现版（Top 12，111 份）为**第 2 原因 35%**，第 1 是 ran out of cash。且属自选复盘样本、非抽样调查，不能支持因果 | 不可写"第 1 原因 42%"，也不可写"第 1 原因 35%"（两个版本都不符）。来源见 §3.4 |
| **「Steve Blank 的 50 Coffee Meetings」** | **归属错误**。对 steveblank.com WordPress API 检索 `"50 coffee"` 返回 **0** 条；该说法实出自 **Mark Suster**, *Both Sides of the Table*, 2011-08-15（且原文是**社交/networking** 框架，不是客户开发方法） | **不可归属给 Steve Blank**；若要引用请归 Mark Suster 并注意语境差异 |
| **「68% 的 IT 项目因需求不佳而失败」** | **扭曲**。IAG Consulting 报告的原意是 **68% 的公司**（且属**建模情景**，非观测值）；其可观测口径是 **20%** 按时、**28%** 按预算。IAG 是**供应商白皮书**，n=110 自选样本；其 **2009 版已完全删除 68%** 这个数字，改为 74.1% | **不可引用**；若必须引用需写明供应商白皮书性质与版本漂移 |
| **「1:10:100」需求/缺陷成本比** | **不是 Boehm 的表述**，无可考一手来源 | **不可引用** |
| **Standish CHAOS 的「incomplete requirements / lack of user input」排名** | 本轮**未取得 CHAOS 一手报告**；此处常见数字来自 Eveleens & Verhoef 2010（*IEEE Software* 27(1):30–36），而该文称 CHAOS 的定义「**misleading, one-sided, pervert the estimation practice, and result in meaningless figures**」 | 排名本身 `UNVERIFIED`；引用时须并列该批评 |
| **DMI「设计驱动公司跑赢 S&P 211%」** | 起源可考：Rae 2016, *Design Management Review* 27(4):4–11, DOI 10.1111/drev.12040，摘要逐字写明该报告为「**A Special Report SPONSORED by** the Design Management Institute in **Partnership with Motiv Strategies**」。但：作者是**构建该指数的咨询公司 Motiv 的 CEO**；非同行评议；**n=15**；微软资助；数字在 228%(2014)/211%(2015)/"200%+" 之间漂移（Design Council 2005 的 "200%+" 是**另一项**研究，n=63+103）；**HBR 归属无法追溯**（404、无 Wayback 快照）；**不存在任何同行评议的批评**——这个"没有批评"本身就是发现 | 可引其**存在与来源**，但须标注为**赞助型倡导产物、无公开方法学**；**不可**当作独立绩效证据 |
| **「Jansson & Smith (1991) 证明给示例会产生更多但更新颖度更低的方案」** | **误传**。该文可核发现是**特征趋同/固着，且在明确告知下依然持续**（其示例是故意有缺陷的）；"更多方案但更新颖度更低"实为 **Siangliulue et al. 2015** 的表述 | 不可张冠李戴；引 Jansson & Smith 时只讲 feature conformity / fixation persistence |
| **用 Janis & Mann 证明"过度分析导致瘫痪"** | **方向相反**。其 "hypervigilance" 是**时间压力下的惊慌**，最优模式 "vigilance" 恰恰是充分审慎搜索 | **不可**作为反审慎证据 |
| **「Requirements are discovered, not gathered」** | 广泛流传，本轮未能定位可引用原始出处 | `[未找到一手来源]` |
| **「A problem well stated is a problem half solved」（归 Kettering 或 Dewey）** | 未能定位原始出处；在 QI 的爱因斯坦条目中仅以「Dewey believed that…」的**转述**出现 | `[未找到一手来源]`；不可作为直接引语 |
| **Rittel & Webber 1973「10 条特性」的流行版本** | 与原版有 ≥2 处漂移：原版第 3 条为「not true-or-false, but **good-or-bad**」（流行版 "better or worse" 实为同条正文）；原版第 10 条为「**The planner** has no right to be wrong」（流行版加 "social"） | 引 1973 原文时须用双扫描核过的版本 |
| **「The problem is not understood until after the formulation of a solution」归给 Rittel & Webber 1973** | 该句是 **Conklin 的改写**，不在 1973 原版列表中 | **不可归给 1973** |
| **Wikipedia 对 Minoura 的转述**（「too basic a tool to analyze root causes at the depth necessary」） | **是转述而非引语**。"basic"/"depth" 二词不在丰田一手文件中；一手批评的实质是「falling back on deduction」与「so many causes come back that you end up totally confused」，并强调 `on-the-spot observation rather than deduction` | **不要当引语用**。请改引 Toyota 2003 PDF 原文（见 §4.6） |
| **「分析瘫痪会因需求澄清访谈而产生」** | 本轮**未找到**任何把二者直接连起来的实证研究；`Analysis paralysis` 页本身无原创研究，"extinct by instinct" 标 `[citation needed]` | `[未找到一手来源]` |
| **EARS 论文正文（Mavin et al. 2009）** | IEEE Xplore 返回 HTTP 202/0 字节（反爬），无 OA 全文；仅 Crossref/OpenAlex 核到书目元数据 | 仅可引书目事实，**不可引正文**。且 Kiro 从未引用该论文，Kiro→EARS 属我们的推断 |
| **Anthropic `building-effective-agents` 作为"先澄清"依据** | 该页 `"clarif"` 出现 **0 次** | **不可**作为痛点优先澄清的依据 |
| ~~The Mom Test 三条规则逐字~~ **（本轮已解决，不再是空缺）** | 已从书 v1.06 p.17 取得逐字原文（见 §2 R13）；官方站与 `robfitz.com` 仍取不到，故来源是**学生社团镜像的书籍全文 PDF** | 可引，但须注明"实践建议、非对照研究"及镜像托管来源。**另一条仍 UNVERIFIED**：常被引用的「They own the problem; you own the solution」在 v1.06 全文 `grep` 不到，疑为第 2 版内容 |
| **`Are Your Lights On?` 中"问题即期望与感知之差"的定义** | 书目记录可核（Gause & Weinberg, 1977, OpenLibrary `/works/OL4802376W`），但 Internet Archive 为借阅制，正文未取得 | 定义逐字 `UNVERIFIED` |
| **Socratic questioning 的"六类问题"清单** | `criticalthinking.org/pages/socratic-questioning/525` 是**静默内容替换**（现返回无关文章《Thinking With Concepts》），且 **CDX 显示该路径从未被归档**；Wayback 的 2006 官方 PDF 是**书的前置部分，只有目录**（正文在与目录不同的分册中），因此官方一手页码未取得。六类清单只在**署名 R.W. Paul 的二手镜像**中可核；FCT **现行**官方 taxonomy 已改为"思维要素 / 思维标准"两族结构 | **六类清单标记为 `UNVERIFIED`，不要作为 Paul & Elder 的引语使用**。可引的是官方指南的**目录标题**（已核）与现行两族结构 |
| **Design Council「设计驱动公司跑赢 S&P 211%」类说法** | 本轮未取得；`designcouncil.org.uk` Double Diamond 页无此数字 | 未在本报告中引用 |
| **OpenAI agents 指南有"设计前澄清"阶段** | 负向发现：该 PDF 无此阶段 | **不可**引为支持证据 |
| **Windsurf planning 文档** | 404 | `UNVERIFIED` |
| **`amazon.jobs` / `aboutamazon` 的 PR/FAQ 官方页** | 均 404；Ian McAllister Quora 回答未取得 | PR/FAQ 的权威来源仅限作者自建站 + Vogels 2006 博客（非 amazon.com 域名） |

---

## 9. 来源清单

### 9.1 一手 / 官方

| # | 来源 | URL |
|---|---|---|
| 1 | Design Council (UK), "The Double Diamond" | [https://www.designcouncil.org.uk/our-resources/the-double-diamond/](https://www.designcouncil.org.uk/our-resources/the-double-diamond/) |
| 2 | Stanford d.school, "Design Thinking Bootleg"（五模式） | [https://dschool.stanford.edu/resources/design-thinking-bootleg](https://dschool.stanford.edu/resources/design-thinking-bootleg) |
| 3 | Christensen Institute, "Jobs to Be Done Theory" | [https://www.christenseninstitute.org/theory/jobs-to-be-done/](https://www.christenseninstitute.org/theory/jobs-to-be-done/) |
| 4 | Toyota 5 Whys（机制与 §History 归属：Sakichi Toyoda 发明、Ohno 记述） | [https://en.wikipedia.org/wiki/Five_whys](https://en.wikipedia.org/wiki/Five_whys) |
| 5 | Ohno, *Toyota Production System: Beyond Large-Scale Production*, Productivity Press, 1988, ISBN 0-915299-14-3 | 书目 |
| 6 | Paul & Elder, *The Thinker's Guide to the Art of Socratic Questioning*, Foundation for Critical Thinking, © 2006（Wayback 存档，**仅前置部分/目录**） | [https://web.archive.org/web/20070715014415if_/http://www.criticalthinking.org/files/SocraticQuestioning2006.pdf](https://web.archive.org/web/20070715014415if_/http://www.criticalthinking.org/files/SocraticQuestioning2006.pdf) |
| 6b | Minoura（丰田）2003 年主题演讲，Toyota Motor Corporation Public Affairs Division, 2003-10-08, p.3 —— 5 Whys 批评的**一手出处** | [https://web.archive.org/web/20201121032113if_/https://media.toyota.co.uk/wp-content/files_mf/1323862732essenceTPS.pdf](https://web.archive.org/web/20201121032113if_/https://media.toyota.co.uk/wp-content/files_mf/1323862732essenceTPS.pdf) |
| 6c | Toyota Motor Asia Pacific, "Ask 'why' five times about every matter"（2006，含 genchi genbutsu） | [https://web.archive.org/web/20221127052017id_/](https://web.archive.org/web/20221127052017id_/) |
| 6d | Fitzpatrick, *The Mom Test*, v1.06, p.17（三条规则逐字；学生社团镜像） | [https://theforge.mcmaster.ca/wp-content/uploads/2024/02/The-Mom-Test.pdf](https://theforge.mcmaster.ca/wp-content/uploads/2024/02/The-Mom-Test.pdf) |
| 6e | Stanford d.school, *Design Thinking Bootleg*（2018 官方 PDF，含 Empathize / Define 定义） | [https://dschool.sfo3.digitaloceanspaces.com/documents/dschool_bootleg_deck_2018_final_sm2-6.pdf](https://dschool.sfo3.digitaloceanspaces.com/documents/dschool_bootleg_deck_2018_final_sm2-6.pdf) |
| 6f | Strategyn / Ulwick, "Jobs to be Done"（core functional job 与 desired outcomes；**党派来源**） | [https://strategyn.com/jobs-to-be-done/](https://strategyn.com/jobs-to-be-done/) |
| 7 | Rittel & Webber, "Dilemmas in a general theory of planning", *Policy Sciences* 4(2):155–169, 1973 | DOI 10.1007/BF01405730 ；OA 扫描 [https://escholarship.org/content/qt01v4t1c9/qt01v4t1c9.pdf](https://escholarship.org/content/qt01v4t1c9/qt01v4t1c9.pdf) |
| 8 | Boehm & Basili, "Software Defect Reduction Top 10 List", *IEEE Computer* 34(1):135–137, 2001 | DOI 10.1109/2.962984 ；PDF [https://www.cs.umd.edu/~basili/publications/journals/J81.pdf](https://www.cs.umd.edu/~basili/publications/journals/J81.pdf) |
| 9 | Loftus & Palmer, "Reconstruction of automobile destruction…", *J. Verbal Learning and Verbal Behavior* 13(5):585–589, 1974 | DOI 10.1016/S0022-5371(74)80011-3 ；PDF [https://gwern.net/doc/psychology/1974-loftus.pdf](https://gwern.net/doc/psychology/1974-loftus.pdf) |
| 10 | Quote Investigator, "I Would Spend 55 Minutes Defining the Problem…" | [https://quoteinvestigator.com/2014/05/22/solve/](https://quoteinvestigator.com/2014/05/22/solve/) |
| 11 | Quote Investigator, "My Customers Would Have Asked For a Faster Horse" | [https://quoteinvestigator.com/2011/07/28/ford-faster-horse/](https://quoteinvestigator.com/2011/07/28/ford-faster-horse/) |
| 12 | Gause & Weinberg, *Are Your Lights On?*, 1977（书目；正文未取得） | [https://openlibrary.org/works/OL4802376W](https://openlibrary.org/works/OL4802376W) |
| 13 | The Mom Test 官网（Rob Fitzpatrick） | [https://www.momtestbook.com/](https://www.momtestbook.com/) |
| 14 | CB Insights, "Top 20 Reasons Startups Fail"（2019 存档） | [https://web.archive.org/web/2019id_/https://www.cbinsights.com/research/startup-failure-reasons-top/](https://web.archive.org/web/2019id_/https://www.cbinsights.com/research/startup-failure-reasons-top/) |
| 15 | CB Insights, "Top 12 Reasons Startups Fail"（2021 存档） | [https://web.archive.org/web/2021id_/https://www.cbinsights.com/research/startup-failure-reasons-top/](https://web.archive.org/web/2021id_/https://www.cbinsights.com/research/startup-failure-reasons-top/) |

### 9.2 Agent / 产品框架官方文档

| # | 来源 | URL |
|---|---|---|
| 16 | GitHub Spec Kit `/clarify` 模板 | [https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/clarify.md](https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/clarify.md) |
| 17 | GitHub Spec Kit `/specify` 模板 | [https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/specify.md](https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/specify.md) |
| 18 | GitHub Spec Kit `/plan` 模板 | [https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/plan.md](https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/plan.md) |
| 19 | GitHub Spec Kit 仓库 | [https://github.com/github/spec-kit](https://github.com/github/spec-kit) |
| 20 | Kiro, "Feature Specs" | [https://kiro.dev/docs/specs/feature-specs/](https://kiro.dev/docs/specs/feature-specs/) |
| 21 | Kiro, "Analyze Requirements" | [https://kiro.dev/docs/specs/analyze-requirements/](https://kiro.dev/docs/specs/analyze-requirements/) |
| 22 | Kiro, "Specs"（总览） | [https://kiro.dev/docs/specs/](https://kiro.dev/docs/specs/) |
| 23 | Kiro, "Plan mode" | [https://kiro.dev/docs/specs/plan/](https://kiro.dev/docs/specs/plan/) |
| 24 | Kiro, "Specs best practices" | [https://kiro.dev/docs/specs/best-practices/](https://kiro.dev/docs/specs/best-practices/) |
| 25 | Amazon Working Backwards, "PR/FAQ" | [https://www.workingbackwards.com/resources/working-backwards-pr-faq/](https://www.workingbackwards.com/resources/working-backwards-pr-faq/) |
| 26 | Vogels, "Working Backwards"（2006, allthingsdistributed） | [https://www.allthingsdistributed.com/2006/11/working_backwards.html](https://www.allthingsdistributed.com/2006/11/working_backwards.html) |
| 27 | Ubl, "Design Docs at Google" | [https://www.industrialempathy.com/posts/design-docs-at-google/](https://www.industrialempathy.com/posts/design-docs-at-google/) |
| 28 | Anthropic, "Claude Code Best Practices" | [https://www.anthropic.com/engineering/claude-code-best-practices](https://www.anthropic.com/engineering/claude-code-best-practices) |
| 29 | Anthropic, "Towards Understanding Sycophancy in Language Models" | [https://www.anthropic.com/research/towards-understanding-sycophancy-in-language-models](https://www.anthropic.com/research/towards-understanding-sycophancy-in-language-models) |
| 30 | Anthropic, "Automated Alignment Researchers" | [https://www.anthropic.com/research/automated-alignment-researchers](https://www.anthropic.com/research/automated-alignment-researchers) |
| 31 | Anthropic, "Building Effective Agents"（负向发现） | [https://www.anthropic.com/engineering/building-effective-agents](https://www.anthropic.com/engineering/building-effective-agents) |
| 32 | Anthropic, "Writing Tools for Agents"（弱相关） | [https://www.anthropic.com/engineering/writing-tools-for-agents](https://www.anthropic.com/engineering/writing-tools-for-agents) |
| 33 | BMAD-METHOD 仓库 | [https://github.com/bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) |
| 34 | Agent OS 仓库 | [https://github.com/buildermethods/agent-os](https://github.com/buildermethods/agent-os) |

### 9.3 学术 / 预印本

| # | 来源 | 标识 / URL |
|---|---|---|
| 35 | Sharma et al., "Towards Understanding Sycophancy in Language Models", ICLR 2024 | arXiv:2310.13548 — [https://arxiv.org/abs/2310.13548](https://arxiv.org/abs/2310.13548) |
| 36 | Perez et al., "Discovering Language Model Behaviors with Model-Written Evaluations", 2022 | arXiv:2212.09251 |
| 37 | Mu et al., "ClarifyGPT: Empowering LLM-based Code Generation with Intention Clarification", 2023 | arXiv:2310.10996 |
| 38 | Vijayvargiya et al., "Ambig-SWE: Interactive Agents to Overcome Underspecification in Software Engineering", ICLR 2026 | arXiv:2502.13069 |
| 39 | Edwards & Schuster, "Ask or Assume? Uncertainty-Aware Clarification-Seeking in Coding Agents" | arXiv:2603.26233 |
| 40 | Zhang, Knox & Choi, "Modeling Future Conversation Turns to Teach LLMs to Ask Clarifying Questions", ICLR 2025 | arXiv:2410.13788 |
| 41 | Su & Cardie, "Knowing but Not Showing: LLMs Recognize Ambiguity but Rarely Ask Clarifying Questions" | arXiv:2605.25284 |
| 42 | Zhang et al., "CLAMBER" | arXiv:2405.12063 |
| 43 | Wu, "Large Language Models Should Ask Clarifying Questions to Increase Confidence in Generated Code"（position paper） | arXiv:2308.13507 |
| 44 | "LHAW: Controllable Underspecification for Long-Horizon Tasks" | arXiv:2602.10525 |
| 45 | Stoisser et al., "Ambig-DS: A Benchmark for Task-Framing Ambiguity in Data-Science Agents" | arXiv:2605.09698 |
| 46 | Ghosh et al., "Less Back-and-Forth: A Comparative Study of Structured Prompting"（弱证据反向结果） | arXiv:2605.20149 |
| 47 | Conlon & Schwardmann, "AI Sycophancy and Decisions"（未评审预印本，反向证据） | DOI 10.2139/ssrn.6597184 |
| 47b | "Artificial Hivemind"（模型间想法同质化），NeurIPS 2025 | arXiv:2510.22954 |
| 47c | Doshi & Hauser, "Generative AI enhances individual creativity but reduces the collective diversity of novel content", *Science Advances* 2024 | DOI 10.1126/sciadv.adn5290 |
| 47d | "Diversity Collapse in Multi-Agent LLM Systems" | arXiv:2604.18005 |
| 47e | SPINE（假前提下的多轮塌缩） | arXiv:2609.09090 |
| 47f | Cancer-Myth（前沿模型对假前提的纠正率） | arXiv:2504.11373 |
| 47g | SWE-agent, NeurIPS 2024（未解决实例的失败分类） | arXiv:2405.15793 |
| 47h | XYBench（字面请求 vs 真实意图） | arXiv:2609.06842 |
| 47i | Bano et al., "Customer involvement in requirements engineering", *Requirements Engineering* 24(3):259–289, 2019（"asking customer for solutions" 作为编目的访谈者错误） | DOI 10.1007/s00766-019-00313-0 |
| 47j | Card, "The problem with '5 whys'", *BMJ Quality & Safety* 26(8):671–677, 2017 | DOI 10.1136/bmjqs-2016-005849 |
| 47k | "No Evidence for LLMs Being Useful in Problem Reframing"（CHI '25, N=280 RCT） | arXiv:2503.01631 |
| 47l | Vasconcelos & Crilly (2016)，示例给入**时机**与新颖性（开放获取） | 见 `/tmp/r1src/findings/M2-A-designvalue.md` 与 `M2-B-*` 流文件 |
| 47m | Schön, *The Reflective Practitioner*, p.40（问题设定是建构动作） | 经 OpenLibrary `search/inside` 全文检索取得 |
| 47n | Buchanan, "Wicked Problems in Design Thinking", *Design Issues* 1992 | 原文已核 |
| 47o | Steve Blank, "Killing Your Startup by Listening to Customers", 2012-02-27 | [https://steveblank.com/2012/02/27/killing-your-startup-by-listening-to-customers/](https://steveblank.com/2012/02/27/killing-your-startup-by-listening-to-customers/) |
| 47p | Rae 2016, *Design Management Review* 27(4):4–11（DMI 211% 的可考起源；赞助型、n=15） | DOI 10.1111/drev.12040 |
| 47q | Mark Suster, "50 Coffee Meetings"（"50 coffee" 的真实出处） | [https://bothsidesofthetable.com/](https://bothsidesofthetable.com/) |
| 48 | Mavin, Wilkinson, Harwood & Novak, EARS, IEEE RE 2009, pp.317–322（仅书目） | DOI 10.1109/RE.2009.9 |
| 49 | 其它需求工程侧（仅元数据已核，内容 UNVERIFIED）：Cao et al. REW 2026 DOI 10.1109/rew72749.2026.00044；Paiva & Canedo, *Requirements Engineering* 2026 DOI 10.1007/s00766-026-00462-z；Luitel & Hassani, *Requirements Engineering* 2024 DOI 10.1007/s00766-024-00416-3 | 见各 DOI |

### 9.4 概念页（弱证据，仅用于定义与边界）

| # | 来源 | URL |
|---|---|---|
| 50 | Analysis paralysis | [https://en.wikipedia.org/wiki/Analysis_paralysis](https://en.wikipedia.org/wiki/Analysis_paralysis) |
| 51 | Wicked problem（用于交叉验证 Rittel & Webber 清单漂移） | [https://en.wikipedia.org/wiki/Wicked_problem](https://en.wikipedia.org/wiki/Wicked_problem) |
| 52 | Socratic method | [https://en.wikipedia.org/wiki/Socratic_method](https://en.wikipedia.org/wiki/Socratic_method) |

---

## 附：本报告的方法与局限

- **工具限制**：本次调研全程 `web_search` / `anysearch_search` / `web_fetch` 不可用；arXiv Atom API 间歇性返回 HTTP 429，改用 arXiv HTML 检索端点与 Crossref/OpenAlex/Unpaywall 完成学术侧取证。所有引用均为本地抓取后逐字核对。
- **已做的交叉校验**：Rittel & Webber 的两个独立扫描件分别 OCR 后逐字比对（结论：所有引句一致）；Amazon / Google / Anthropic 三站的印刷体弯引号已统一为直引号；M4 子过程对每条引文做了「是否为抓取字节子串」的脚本校验。
- **本轮已解决的空缺**：The Mom Test 三条规则逐字（书 v1.06 p.17）；5 Whys 批评的一手出处（Toyota 2003 Minoura keynote，并据此**修正了 Wikipedia 的转述**）；d.school Empathize / Define 的官方定义；Rittel & Webber 1973 的完整一手文本（双扫描 OCR 交叉校验）；Boehm & Basili 的 5:1 例外与 emergent-process 段落；CB Insights 两版数字的差异。
- **仍未解决的空缺**（已在 §8 逐条标注）：Socratic "六类问题"清单的官方一手页码；`Are Your Lights On?` 定义逐字（archive.org 借阅制）；EARS 论文正文（IEEE Xplore 反爬）；Steve Blank 各篇正文；「requirements are discovered, not gathered」的原始出处；**sycophancy 对需求质量的因果研究（明确空缺）**；"澄清访谈导致分析瘫痪"的实证（明确空缺）；产品访谈语境下的"用户调研疲劳"（明确空缺）；创业情境下"陈述意图 vs 实际购买"的专门研究（**疑似不存在**；最接近的可核证据是 Thompson/Hamilton/Rust 2005 *Feature Fatigue*, JMR 42(4):431, DOI 10.1509/jmkr.2005.42.4.431）；IDEO "How might we" 的官方出处（ideo.com 与 Design Kit 均 404/403）；设计固着的元分析效应量（Sio 2015、Marsh 1996 付费墙）。
- **两处必须保留的更正**（否则会以讹传讹）：① Wikipedia 关于 Minoura 批评 5 Whys 的措辞是**转述**，一手原文说的是"用演绎代替现场观察"，不是"太基础"；② 常被引用的 Perez et al. 结论「RLHF 放大迎合」**不是该文发现**——原文是「RLHF does not train away sycophancy and may actively incentivize models to retain it」，未显示随 RL 步数上升。
- **一处必须保留的张力**（不替读者消解）：第 3 节的支持证据与第 4 节的反证**同时成立**。一手来源自述的调和方式是**交织而非门式**（Rittel & Webber 的 argumentative process、Design Council 的 "making and testing very early stage ideas can be part of discovery"、Boehm & Basili 的 emergent requirements）。本报告只呈现该张力，不做取舍。
