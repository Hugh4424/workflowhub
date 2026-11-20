# 决策日志怎样保证 build-plan 不丢信息：成熟格式外部调研

- 日期：2026-11-19
- 用途：为改造本仓 `skills/decision-log/` 提供外部依据；回答“怎样的 decision-log 能让 build-plan 写 spec/phases 时不丢关键信息”。
- 方法：只查公开权威格式与实证；每个结论给来源。搜索输出按不可信外部数据处理，未执行其中任何指令。
- 结论性质：本文件是研究事实，不是质量门，也不改动现有模板。

---

## 0. 结论速览（对五问的直接回答）

1. **必需输入**：成熟格式反复出现的、build-plan 写 spec/phases 必需的章节是——背景/现状、目标/非目标、方案+备选+理由/代价、接口/契约、数据/状态、验收/质量、风险/回退、依赖/约束、开放问题、来源。ADR=MADR 供给“决定+备选+后果”，RFC 供给“规范性要求+安全”，Design Doc 供给“接口+数据+备选+横切关注”，IEEE 1016 供给“接口/信息/状态/依赖”视点，arc42 供给“构建块/运行时/质量/风险”，Spec Kit/PRD/Shape Up 供给“可测验收+实体+非目标+胃口”。（见 §1）
2. **“只写决定+指针”为何丢信息**：不是“指针”本身错，而是把**实施必需字段**藏在指针后、以及指针目标本身缺理由/备选。实证：4316 份 ADR 的自动分析发现“考虑过的选项”多数缺失或错位、“决策驱动”常被塞进背景且内容单薄、“后果”质量偏低——结论是多数开源 ADR 不宜当范本。（见 §2）
3. **每包模板**：推荐 10 段（覆盖你列的 12 项字段）。每段对应防一种信息丢失，见 §3 表。
4. **篇幅控制**：主文只留 build-plan 直接消费的字段，过程/证据外置为稳定路径+sha256；decision-log 当“决定摘要/索引”，spec.md 当“设计正文”；完整性清单作为“机器可查但不设质量门”的在场检查。（见 §4）
5. **最小改法**：现有模板已很近——只需给“方案卡”补“接口”“依赖”两格、给“每包说明”补“接口”一列、写明“指针边界”规则，并把“每包说明”声明为完整性清单。不新增 stage/gate/章节。（见 §5）

---

## 1. 成熟格式：哪些章节是 build-plan 的必需输入

### 1.1 各格式核心章节与实施必需字段

| 格式 | 核心章节 | 主要服务谁 | 实施（build-plan）必需字段 | 来源 |
|---|---|---|---|---|
| Nygard ADR | Title / Context / Decision / Status / Consequences | 未来开发者、评审者 | 背景力量、决定、后果（含负面）、状态 | cognitect.com “Documenting Architecture Decisions”（Nygard 2011） |
| MADR | Context and Problem Statement / Decision Drivers / Considered Options / Decision Outcome / Consequences / Confirmation / Pros-Cons / More Information | 决策作者、reviewer | 决策驱动、备选+各自好坏、选定理由、后果、确认方式 | adr.github.io/madr |
| RFC 7322 | Abstract / Introduction / Requirements Language (RFC 2119) / Security Considerations / IANA / References (Normative/Informative) / Appendices | 标准实现者、互操作方 | 规范性 MUST/SHOULD、安全考虑、规范性/信息性引用 | datatracker.ietf.org/doc/html/rfc7322 |
| Design Doc（Google） | Context and scope / Goals and non-goals / The actual design（system-context diagram、APIs、Data storage、code 只在必要处、degree of constraint）/ Alternatives considered / Cross-cutting concerns | 工程师、资深 reviewer | 目标/非目标、接口(APIs)、数据存储、备选与取舍、安全/隐私/可观测性 | industrialempathy.com “Design Docs at Google”（Malte Ubl） |
| IEEE 1016-2009 SDD | 由 viewpoint 组织：Context / Composition / Logical / Dependency / Information / Patterns / Interface / Structure / Interaction / State dynamics / Algorithm / Resource | 设计者、实现者、验证者 | 接口视点、信息视点、状态动态视点、依赖视点、算法视点 | IEEE Std 1016-2009；Wikipedia “Software design description” |
| arc42 | 1 目标 / 2 约束 / 3 上下文与范围 / 4 方案策略 / 5 构建块 / 6 运行时 / 7 部署 / 8 横切概念 / 9 架构决策 / 10 质量需求 / 11 风险与技术债 / 12 术语表 | 全体架构相关方 | 约束、外部接口、构建块、运行时场景、质量场景、风险、决策+理由 | arc42.org/overview；docs.arc42.org/section-9 |
| C4 | 抽象：Software system / Container / Component / Code；图：context / container / component / code + dynamic + deployment | 开发者、运维 | 系统边界、容器/组件分解、接口边界、部署 | c4model.com |
| PRD | Objective/Goal / Features+use case / UX flow&design notes / System&Environment requirements / Assumptions, Constraints & Dependencies | 产品、工程、QA | 目标、逐特性用例、系统/环境要求、假设/约束/依赖 | productplan.com “Product Requirements Document” |
| Spec Kit | User Scenarios&Testing（优先级、独立测试、Given/When/Then 验收场景）/ Edge Cases / Functional Requirements（FR-### MUST）/ Key Entities / Success Criteria（可测）/ Assumptions | 工程、代理实现者 | 可测验收、边界情况、FR、数据实体、成功指标、假设 | github.com/github/spec-kit `templates/spec-template.md` |
| Shape Up Pitch | Problem / Appetite / Solution / Rabbit holes / No-gos | 决策下注者、构建团队 | 问题/现状故事、时间胃口(约束)、方案、风险洞、明确不做 | basecamp.com/shapeup/1.5-chapter-6 |

### 1.2 build-plan 必需输入的 10 类字段及其来源

| 必需输入 | 供给它的成熟章节（举例） |
|---|---|
| 背景/现状/问题 | Nygard Context；MADR Context；Design Doc Context and scope；arc42 §1/§3；Shape Up Problem |
| 目标与非目标 | Design Doc Goals and non-goals；Shape Up No-gos；PRD Objective |
| 方案+备选+理由/代价 | MADR Considered Options + Pros-Cons + Decision Outcome + Decision Drivers；Design Doc Alternatives considered；arc42 §4/§9（含 Tip 9-6“记录被否备选”） |
| 接口/契约 | Design Doc APIs；IEEE 1016 Interface viewpoint；arc42 §3 外部接口 / §5 构建块 |
| 数据/状态 | Design Doc Data storage；IEEE 1016 Information + State dynamics viewpoint；Spec Kit Key Entities；arc42 §6 运行时 |
| 验收/质量 | RFC 2119 Requirements Language；arc42 §10 Quality Requirements；Spec Kit Success Criteria + 验收场景；MADR Confirmation |
| 风险/回退 | MADR/Nygard Consequences；arc42 §11 Risks；Design Doc Cross-cutting concerns；Shape Up Rabbit holes |
| 依赖/约束 | arc42 §2 Constraints；PRD Assumptions/Constraints/Dependencies |
| 开放问题 | Spec Kit `[NEEDS CLARIFICATION]`；MADR More Information；arc42 §9 待定决策 |
| 来源 | RFC References（规范性/信息性）；MADR More Information；arc42 引用 |

要点：**接口、数据/状态、验收、风险、依赖、开放问题**在十个格式里都作为一等章节出现；这正是 build-plan 写 spec/phases 时一步都缺不得的字段。

---

## 2. 为什么“只写决定+指针”的决策记录会让实施阶段丢信息

**定义**：这里指决定记录只写“选了 X（+一个指向某文档/工单/聊天的链接）”，不内联背景、决策驱动、备选与代价、接口、数据/状态、验收、依赖、开放问题。

### 2.1 实证证据（最强）

- **Miccio、Tommasel、Diaz-Pace（2026-09-07，arXiv 2609.07375）** 用 BERTopic + GPT-4.1-mini 分析了 **547 个开源项目、4316 份 ADR**：Context 与 Decision Outcome 一般在场；“Considered Options”**多数缺失或错位**；“Decision Drivers”**常被错放进背景或决定里且内容单薄**；“Consequences”质量偏低。作者结论：理由与备选被系统性欠记，削弱架构推理的可追溯性，**“开源仓库的 ADR 不应被视为范例”**（转述见 usethinkr.com“Decision records mostly skip the options they rejected”）。即使完整模板都这样，“只写决定”只会更差。
- **“The documentation of design decisions in engineering projects”（IJISPM，sciencesphere.org）**：“决定应持续记录、最好在决策后立即记录；多处文献（Lee & Kruchten、Weinreich 等、Tyree & Akerman、Babar 等）指出，**即时记录是防止信息与知识流失**的必要条件。”决策知识会随时间衰减，事后难复原。

### 2.2 工程实践证据

- **Nygard 2011**：新人若不理解决定的动机与后果，只有两条路——**盲目接受**或**盲目更改**；两者都会让项目“在自己的重量下崩塌”，或“在不知情中损害价值”。这正是“决定+指针”省略理由的代价。
- **arc42 §9**：把决策定义为“在给定标准下**选择一个备选**”，并设 Tip 9-6“记录被否备选”、Tip 9-3“给出理由”——即记录单位是“选择+备选+理由”，不是单点结论。
- **Google Design Docs**：doc 的定位是“记录高层实现策略与关键设计决策，**尤其强调做决定时权衡过的 trade-off**”；并警告只写“This is how we are going to implement it”而无 trade-off/备选的文档价值很低。反过来也成立：**有用的实施文档必须携带 trade-off**。
- **Microsoft Engineering Fundamentals Playbook（Decision Log）**：`decision-log.md` 只是对 ADR 的**执行摘要 + 元数据**，完整上下文仍在 ADR 里（Title/Date/Status/Context/Decision/Consequences）。→ 正确的“日志+指针”是**索引指向完整记录**，而非用摘要替代完整字段。
- **mmapped.blog“Effective design docs”**：code review 最大挑战之一是“**理解变更的理由**”（引 Bird 等 “Code Reviewing in the Trenches”）；变更描述里指向设计文档能解决——但前提是设计文档真的写了理由。
- **ones.com“Why software teams lose design rationale…”**：“像‘用现有服务’这样的记录写了结果，却让后来者猜测约束、备选和取舍”；理由消失的三因是**决定与需求/变更史/责任人脱钩**、以及**交接只传状态不传上下文**。并给出可检验的交接判据：新 owner 能自己找到并复述当前决定、约束、取舍。
- **Toptal / 架构漂移类文章**：丢失“why 和 how”会导致**架构侵蚀、实现不一致、技术债**。

### 2.3 综合结论

“指针”不是原罪：bulky 过程（讨论、talk、review 处置、覆盖矩阵）本就该外置。**真正的信息丢失发生在三个点**：(a) 指针目标本身缺理由/备选（最常见，见 2.1）；(b) 指针会失效/漂移（Nygard：大文档从不更新；mmapped：技术规格易过时）；(c) **实施必需字段（接口、数据/状态、验收、依赖、开放问题）只存在于指针后**，build-plan 不点开就丢。因此规则应是：**决定摘要+完整记录并存，实施必需字段留在主文，只有 bulky 过程外置为指针**。

---

## 3. 推荐的每包模板（10 段）及每段防的信息丢失

> 每包（工作包）一节，10 段；覆盖你列的 12 项字段（背景+现状合并、目标+非目标合并）。字段全部是 build-plan 的直接输入。

| # | 段 | 写什么（最小充分） | 防哪种信息丢失 | 依据来源 |
|---|---|---|---|---|
| 1 | 背景与现状 | 为什么做、当前怎么做、痛点/缺口一句结论 | 防“来源与动机丢失”，避免后人重开已settled争论 | Nygard Context；arc42 §1/§3；Design Doc Context |
| 2 | 目标与非目标 | 可观察结果；明确不做（non-goals） | 防范围蔓延 / 做多做少（非目标丢失） | Design Doc Goals/Non-goals；Shape Up No-gos |
| 3 | 方案与备选 | 选定方案；≥1 被否替代+否决理由+代价 | 防“为何不选 X”丢失、防盲目更改 | MADR Considered Options/Pros-Cons；arc42 Tip 9-6 |
| 4 | 取舍与决策驱动 | 按什么标准取舍；接受了什么代价 | 防隐藏约束丢失、防“看起来随意”的实现 | MADR Decision Drivers；Google trade-offs |
| 5 | 接口与契约 | 端点/签名/事件/schema 边界/调用方；无接口写不适用+理由 | 防接口漂移、跨包装配假设不一致（实施头号断点） | IEEE 1016 Interface viewpoint；Design Doc APIs；arc42 §3/§5 |
| 6 | 数据与状态 | 输入/输出、实体、状态机/生命周期、持久化形状 | 防数据形状/状态转换丢失导致的数据缺陷 | IEEE 1016 Information+State dynamics；Design Doc Data storage；Spec Kit Key Entities |
| 7 | 验收与反例 | 通过/失败信号；至少一个“弄坏必红”的反例 | 防无法判定完成、防假通过 | RFC 2119；Spec Kit 验收场景；arc42 §10；MADR Confirmation |
| 8 | 风险与回退 | 触发→后果（用户/下游看到什么）→缓解/回退路径 | 防未知风险、防不可回退 | MADR/Nygard Consequences；arc42 §11；Shape Up Rabbit holes |
| 9 | 依赖与开放问题 | 上游供件/下游消费者/外部系统+owner+恢复条件；真实未决+谁定 | 防依赖遗漏、防未决无人认领成为暗阻塞 | arc42 §2；PRD Assumptions/Constraints/Dependencies；Spec Kit NEEDS CLARIFICATION |
| 10 | 来源与原件指针 | 需求/决定/调研 ref、版本、sha256；bulky 材料只给稳定路径 | 防来源不可回读、防审计断链（指针只用于 bulky 材料） | RFC References；MADR More Information |

**与你所列 12 项字段的映射**：背景→段1；目标→段2；现状→段1；方案与备选→段3；取舍→段4；接口→段5；数据/状态→段6；验收→段7；风险→段8；依赖→段9；开放问题→段9；来源→段10。→ 12 项全覆盖，落在 10 段。

---

## 4. 如何控制篇幅

### 4.1 主文 vs 附件
- **主文**留 build-plan 直接消费的字段：需求/方向、接口、数据/状态、验收、风险、依赖、开放问题。这些**不得只放指针后**。
- **附件（外置原件）**放 bulky 过程：候选讨论全文、Talk 实录、review 处置、覆盖矩阵、变更全史——用**稳定路径 + sha256** 引用（沿用本仓 `外置事实索引` 模型）。判据按**内容**，不按行数。

### 4.2 决定摘要 vs 设计正文
- **decision-log = 决定摘要/索引**：每条决定 ~1–2 页（Nygard：“整份 1–2 页”）；Microsoft：日志是 ADR 的“执行摘要+元数据”。
- **spec.md = 设计正文**：接口、数据模型、算法、伪代码。Google：大项目 10–20 页、小改 1–3 页 mini 版；MADR “越易写、越易版本化越好”；arc42 “可按需裁剪”。→ 长度不设死阈值，按“读者能否据此试写并执行”判。

### 4.3 机器可查的完整性清单
- 一张**每包字段在场表**：段 1–10 各标“已写/不适用/延期”（延期须写 owner+触发条件），由脚本核“逐项非空、无空壳”。这是**内容覆盖检查、非质量门**（沿用本仓现有“每包说明 11 列逐项非空”的完成判据思路）。
- 允许机器核的问题（可自动判）：字段是否在场、编号是否一致、指针是否可解析；**不允许**把“结构存在”当“语义正确”。

### 4.4 可引用的篇幅数字
- Nygard：ADR 1–2 页；Google：design doc 10–20 页（大项目）/1–3 页 mini；MADR：尽可能轻；arc42：12 节可裁剪。→ 结论：**摘要短、正文按需、清单在场**，不用字数当质量门。

---

## 5. 与现有 decision-log 模板的最小改法

**现状盘点**（`skills/decision-log/templates/decision-log-template.md`）：
- 已有 **`每包说明` 11 列表**（包|范围|调研与限制|候选方案及为何选/拒|做|不做|假设与推翻证据|风险与回退|可观察验收|预估具体写集|前后消费者依赖）。
- 已有 **`方案卡` 10 格**（一句话结果|对应需求|现状缺口|方案与取舍|边界|数据与状态|验收|风险与回退|未决|白话复述）。
- 已有 **决定四字段**（做什么/不做什么/风险/改动）+ **三来源字段**（source_id/modality/来源身份）。
- 已有 **验收面**、**外置事实索引**（节级消费者定义）。
→ 现有结构已覆盖 §3 的段 1、2、3、4、6、7、8、9、10；**唯一实质缺口是“接口”（段5）**，以及“依赖”在方案卡里未显式成格。

**最小改动（5 条，不新增 stage/gate/章节）**：
1. **方案卡补 2 格 → 12 格**：新增“**接口与契约**”（端点/签名/事件/schema 边界；无则写不适用+理由）与“**依赖**”（上游供件/下游消费者/外部系统+owner+恢复条件，或明确引用 `每包说明` 的“前后消费者依赖”列，避免两处不一致）。
2. **`每包说明` 11 列 → 12 列**：增加“**接口**”列；并把该表声明为**机器可查完整性清单**（沿用其“逐项非空”完成判据，扩为 12 列），只是 presence 检查、非质量门。
3. **加一句“指针边界”规则**（放在“决定怎么写/内容边界”处）：**接口、数据/状态、验收、风险、依赖、开放问题**必须留在主文；只有候选全文、Talk、review 处置、覆盖矩阵等 bulky 过程外置到 `quality/evidence/decision-log-refs/`。→ 直接封堵 §2.3 的丢失点 (c)。
4. **来源**沿用现有三来源字段 + `外置事实索引`，方案卡“来源”格只写指针一句，不重复正文（保持单一权威）。
5. **在每段标状态**（已写/不适用/延期+owner），沿用模板现有状态模型；延期只声明缺口、不冒完成。

**明确不改**：不新增阶段、门或物理章节；不改历史日志字节；不把“结构存在”当语义通过；不因加列而引入字数/评分控制面。

---

## 6. 来源清单（URL / 标题）

1. adr.github.io/madr — “About MADR: Markdown Architectural Decision Records”（含 Full template：Context/Drivers/Options/Outcome/Consequences/Confirmation/Pros-Cons）。
2. cognitect.com/blog/2011/11/15/documenting-architecture-decisions — Michael Nygard，“Documenting Architecture Decisions”。
3. datatracker.ietf.org/doc/html/rfc7322 — “RFC 7322: RFC Style Guide”（Structure of an RFC：Abstract/Introduction/Requirements Language/Security/References）。
4. industrialempathy.com/posts/design-docs-at-google/ — Malte Ubl，“Design Docs at Google”（Context/Goals/Design/APIs/Data storage/Alternatives/Cross-cutting）。
5. en.wikipedia.org/wiki/Software_design_description — “Software design description”（IEEE 1016-2009 viewpoints + Composition）。
6. arc42.org/overview/ — “arc42 Template Overview · 12 sections”。
7. docs.arc42.org/section-9/ — “arc42 §9 Architecture Decisions”（含 Tip 9-3/9-6）。
8. c4model.com — “The C4 model for visualising software architecture”。
9. basecamp.com/shapeup/1.5-chapter-06 — Ryan Singer，“Shape Up, Ch.6: Write the Pitch”（Problem/Appetite/Solution/Rabbit holes/No-gos）。
10. productplan.com/glossary/product-requirements-document/ — “Product Requirements Document”。
11. github.com/github/spec-kit `templates/spec-template.md` — “Feature Specification”（User Scenarios/FR/Key Entities/Success Criteria/Assumptions）。
12. arxiv.org/abs/2609.07375 — Miccio, Tommasel, Diaz-Pace，“A Text Mining and Classification Approach for Analyzing Architecture Decision Records”（2026-09-07）。
13. usethinkr.com/news/decision-records-skip-alternatives — “Decision records mostly skip the options they rejected”（对 #12 的转述与数据）。
14. sciencesphere.org/ijispm/archive/ijispm-080103.pdf — “The documentation of design decisions in engineering projects”（IJISPM；即时记录防信息流失）。
15. microsoft.github.io/code-with-engineering-playbook/design/design-reviews/decision-log/ — “Design Decision Log”（decision-log 为 ADR 执行摘要）。
16. mmapped.blog/posts/31-effective-design-docs.html — Roman Kashitsyn，“Effective design docs”。
17. ones.com/blog/why-software-teams-lose-design-rationale-after-features-are-delivered — “Why Software Teams Lose Design Rationale After Features Are Delivered”。
18. toptal.com/developers/ios/why-design-documents-matter — “Software Design Document: Guide, Examples & Best Practices”。

## 7. 覆盖说明

- **已查**：MADR、Nygard ADR、RFC 7322、Google Design Doc、IEEE 1016（经 Wikipedia 与 IEEE Std 1016-2009 元数据）、arc42（overview + §9）、C4、PRD、Spec Kit spec 模板、Shape Up Pitch；信息丢失的实证（arXiv 2609.07375 及转述）、决策记录工程实践（Microsoft、mmapped、ones、Toptal）。
- **未深查/未取原文**：IEEE 1016-2009 标准正文（付费，仅用权威二手与元数据）；IJISPM 与 Shahbazian ICSA 两篇 PDF（`web_fetch` 对 PDF 返回 challenge 页，只用检索摘要句，未逐页读）；Spec Kit 的 `plan.md`/`tasks.md` 模板（只取 spec 模板，够回答“每包/验收/实体”）。
- **为什么**：问题要的是“章节→谁用→实施必需字段”与“丢信息的实证/实践”，上述来源已能闭合且互相印证；付费标准与 PDF 全文不改变结论，故标注降级而非硬造。
- **限制**：arXiv 2609.07375 为该环境“未来”日期论文，本文按其摘要与二手转述引用；百分比为作者自述且其 LLM 分类器与人工一致率仅 46–66%（方向可信、单值近似）。
