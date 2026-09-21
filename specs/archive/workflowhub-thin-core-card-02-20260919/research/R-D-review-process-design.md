# R-D：AI 辅助开发中的代码/计划审查（review）流程设计

> 调研目标：为一个"有证据门槛但不阻断推进"的审查机制提供可落地的一手依据。
> 方法：`web_search` + `anysearch_search`（academic）+ `web_fetch`，优先官方文档与原始论文。
> 生成时间：2026-09-19。所有论断后附来源链接；厂商自述与第三方实测分别标注。

---

## 0. 摘要（TL;DR）

1. **主流工程实践早已放弃"审查=门禁"的模型。** Google 的审查标准是"只要这个变更确实让系统整体健康度变好，就倾向于批准，即使它不完美"（[eng-practices](https://google.github.io/eng-practices/review/reviewer/standard.html)）；Amazon 用"单向门/双向门"区分决策，可逆决策只要求约 70% 的信息就通过（[AWS Executive Insights](https://aws.amazon.com/executive-insights/content/how-amazon-defines-and-operationalizes-a-day-1-culture/)）；**核对 5 个主流 AI 审查工具的官方文档，全部默认 advisory，阻断必须显式开启**（§2.2）。
2. **可落地的形态是"证据管线 + 分级处置"，不是"闸门"。** 把审查拆成 Observation（事实）→ Finding（判定+严重性+证据）→ Disposition（fixed / accepted-risk / deferred / rejected）三段；分段记录缺失保持 `unknown`，缺失本身不阻断推进，只阻断"宣称完成"。
3. **严重性 ≠ 置信度。** 第三方实测中，某工具 `critical` 级误报 0%（6/6），但 `high` 级误报高达 15%——高严重性标签必须绑定更强的证据要求，而不是更强的阻断力（[dev.to 679 findings 实测](https://dev.to/_vjk/best-ai-code-reviewer-in-2026-we-ran-4-in-parallel-for-3-weeks-146-prs-679-findings-1c0f)）。
4. **"多厂商模型交叉审查必然更好"已被部分证伪。** 一手论文显示收益是**方向不对称**的：Reviewer 明显强于 Writer 时收益最大，反向则显著变差（−8.6pp）；且 350+ 模型评测显示"厂商不同 ≠ 错误独立"——越强的模型错误相关性越高（[arXiv:2607.21656](https://arxiv.org/abs/2607.21656)；[arXiv:2506.07962](https://arxiv.org/abs/2506.07962)）。
5. **审查的边际收益递减且可量化。** 人工审查的甜点是 200–400 LOC / 60–90 分钟（70–90% 缺陷发现率）；AI 审查评论有 60–70% 从未被开发者处理（[arXiv:2510.05450](https://arxiv.org/html/2510.05450v1)）。审查预算应按"错误成本"分配，而非平均分配。
6. **"加流程换稳定"被 DORA 反向证伪。** DORA 明确"没有证据支持更正式的外部评审带来更低的 change failure rate"，且"用更多流程回应稳定性问题会让事情更糟"；change failure rate 是**滞后指标**，应做事后度量而非事前门（[dora.dev](https://dora.dev/capabilities/streamlining-change-approval/)）。

---

## 1. 主题一：计划/设计审查（写代码之前）

### 1.1 Google：设计文档评审

一手来源：Malte Ubl，*Design Docs at Google*（[industrialempathy.com](https://www.industrialempathy.com/posts/design-docs-at-google/)）。

**设计文档的定位与收益**（原文列举）：在改动还便宜时早期发现设计问题；就设计达成组织共识；确保横切关注点被考虑；把资深工程师的判断规模化；形成组织记忆。

**结构（事实上的清单）**：

| 章节 | 要求 |
|---|---|
| Context and scope | 只讲客观背景事实，不是需求文档 |
| Goals and non-goals | non-goals 指"本可以是目标但被显式排除的"，不是否定式目标 |
| The actual design | 重点是**权衡（trade-offs）**，不是实现手册 |
| Alternatives considered | 列出被否方案及各自权衡；原文称这是最重要的章节之一 |
| Cross-cutting concerns | 安全、隐私、可观测性等；Google 强制要求独立的 privacy design doc 与 security review |

**长度**：大项目甜点 10–20 页；存在 1–3 页的 "mini design doc"，用于增量改进。

**何时不写**：如果解决方案不 ambiguous（问题或方案都不复杂），写文档价值很低；如果文档变成 "implementation manual"（只说怎么做，不谈权衡与备选），那不如直接写代码。

**生命周期**：创建与快速迭代 → 评审（可能多轮）→ 实现与迭代 → 维护与学习。

**最关键的一句（直接支撑"不阻断"）**：
> "Reviews can add a lot of value, but they are also a dangerous trap of overhead, so treat them wisely. … Engineers can mitigate this by seeking the most crucial feedback directly and **not blocking progress on wider review**."

即：**正式评审会议是可选的高开销形态；阻塞式等待是已知反模式，作者应主动只取"最关键的意见"然后继续。**

另一处关键判断：评审的首要价值**不是 issue 被发现了**，而是"发现得相对早、改动还便宜"（"The primary value of the review isn't that issues get discovered per-se, but rather that this happens relatively early in the development lifecycle when it is still relatively cheap to make changes."）。

**审什么**：Google 的代码审查清单（[What to look for in a code review](https://google.github.io/eng-practices/review/reviewer/looking-for.html)）可作为 spec/plan 审查清单的同构模板——Design / Functionality / Complexity / Tests / Naming / Comments / Style / Consistency / Documentation / Every Line / Context / Good Things。其中两条对"计划审查"尤其适用：

- **Complexity**：特别警惕 over-engineering——"只解决现在确知要解决的问题，不要解决你猜测未来可能需要的问题"。
- **Good Things**：明确要求指出做得好的地方（"Sometimes it's even more valuable, in terms of mentoring, to tell a developer what they did right"）——这是审查"不阻断"文化的一部分。

### 1.2 Google：代码审查的标准（"证据门槛"的原始表述）

一手来源：[The Standard of Code Review](https://google.github.io/eng-practices/review/reviewer/standard.html)。

原文的核心规则：

> "In general, reviewers should favor approving a CL once it is in a state where it **definitely improves the overall code health** of the system being worked on, **even if the CL isn't perfect**."

这正是一个**有门槛但不阻断**的定义：门槛是"可判定地使整体变好"，而不是"没有缺陷"。配套规则：

- "there is no such thing as 'perfect' code—there is only *better* code"；不应为打磨细节而延迟数天/数周。
- 不重要的意见必须用 `Nit:` 前缀标注，让作者知道**可以忽略**。
- 唯一的硬边界：**"Nothing in this document justifies checking in CLs that definitely *worsen* the overall code health"**（紧急情况除外）。即：门槛防的是"变差"，不是"不够好"。
- 冲突解决：先达成共识 → 面对面/视频 → 升级（TL / maintainer / EM），**"Don't let a CL sit around because the author and the reviewer can't come to an agreement."**（不许因为分歧而无限期搁置）
- 设计类分歧的裁决依据是**原则与数据**，不是个人偏好："Technical facts and data overrule opinions and personal preferences."

### 1.3 Amazon：PR/FAQ 与设计评审

一手来源：Colin Bryar & Bill Carr（前 Amazon 高管），[The Amazon Working Backwards PR/FAQ Process](https://workingbackwards.com/concepts/working-backwards-pr-faq-process/)；Amazon/AWS 官方文化材料 [Elements of Amazon's Day 1 Culture](https://aws.amazon.com/executive-insights/content/how-amazon-defines-and-operationalizes-a-day-1-culture/)。

**PR/FAQ 的结构**：Press Release（Heading / Subheading / Summary / Problem / Solution / Quotes & Getting Started）+ FAQ（External FAQ + Internal FAQ）。Internal FAQ 的必答项就是一份评审清单（原文 Appendix 2），关键几条：

- 客户今天用什么方案解决这个问题？我们的方案凭什么让人**改变行为**？
- 在哪个维度上更好/更便宜/更快？TAM 与回报是否足够？
- 为了做成，需要解决哪些**困难的**问题（商业、工程、法律、UI）？需要建立哪些新能力？
- **"What assumptions need to be true for this product to be successful"**（哪些假设必须为真）
- **"What are the top three reasons this product will not succeed"**（最可能失败的三个原因）

**评审会议的形态**：文档**会前不发**，会上静读 15–20 分钟（边读边在文档里写批注），再用约 40 分钟讨论。作者原文强调：会议目标不是"把想法卖出去换一个批准"，而是 **"truth-seeking vs. selling"** 与 **"improving vs. deciding"**——评审人是来提问和给反馈的。

**评审人（7 问清单）**：客户是否清晰？问题是否清晰？方案是否解决该问题？客户是否会改变行为？在哪个维度更好/更便宜/更快？TAM 与回报是否够大？将面临哪些约束或问题（商业、资源、技术、法律）？

**决策**：文档达到一定完成度后做 go / no-go；未通过时原文给出 5 类具体原因与后续动作（差异化不足、TAM 太小、投入高风险大、存在未解问题、需排优先级）。

**双向门（two-way door）——最直接的"不阻断"依据**（AWS 官方）：

> "When we see a two-way door decision, and have enough evidence and reason to believe it could provide a benefit for customers, we simply walk through it. You want to encourage your leaders and employees to act with **only about 70% of the data they wish they had**—waiting for 90% or more means you are likely moving too slow."

单向门（重大且通常不可逆）才需要"deep and careful analysis"。

**代价与警示**：原文坦承 PR/FAQ 流程在 Amazon 最成功的产品上耗时**数月**（AWS 的 S3/EC2 从 2004 识别到 2006 发布，其中一年多用于写与评审 PR/FAQ）。对 AI 辅助开发场景，这必须被压缩——但"哪些假设必须为真""最可能失败的三个原因"这两个问题应保留。

### 1.4 AI 辅助开发中的 spec/plan 审查：GitHub Spec Kit（SDD）

一手来源：[github/spec-kit](https://github.com/github/spec-kit)。

流程：**Constitution（每项目一次）→ specify → plan → tasks → implement → converge（每 feature）**；并明确要求 **"Invoke each `/speckit-*` skill in your agent's chat, one at a time, and review the result before continuing."**（每一步产物都要先被审阅再继续）。另有可选的质量关卡：clarification、checklists、consistency analysis。

两个可复用的设计：

- **Bug fixing 流程**（assess → fix → test）产出 verdict：`verified` / `partial` / `failed`，并且原文写死一句：**"Missing verification is not a successful fix."** 这正是"有证据门槛但不阻断"的正确姿态：可以推进，但**不能把"未验证"记录为"通过"**。
- **Idea assessment 流程**（intake → research → define → shape → decide）产出 `go` / `needs-clarification` / `kill`；原文明确"用文档化理由停下来也是一个有效结果"。

### 1.5 谁审、审什么、评审清单长什么样（跨来源汇总）

| 维度 | Google design doc | Amazon PR/FAQ | Spec Kit SDD |
|---|---|---|---|
| 何时审 | 实现前，设计成形且讨论空间还大时 | 立项前（写 PR 之后、写 FAQ 迭代中） | specify/plan 产出后、写代码前 |
| 谁审 | 先同团队最懂的人 → 再广团队/资深评审会 | 先经理+跨职能同侪（~10 人）→ 再高管 | 主会话 + 独立上下文审查者 |
| 审什么 | 权衡、备选方案、横切关注点 | 客户/问题/方案/差异化/TAM/风险与假设 | 规格一致性、checklist、跨产物一致性 |
| 阻断力 | 无（明确反对阻塞式等待） | go/no-go 由决策者做出（是决策，不是质量门） | 不阻断；但缺失验证不得记为通过 |
| 典型清单长度 | 5 个章节 + 12 条 code review 清单 | 评审人 7 问 + 20 条 Internal FAQ（另 4 条 External FAQ） | 各阶段模板 + 可选 checklists |

---

## 2. 主题二：AI 代码审查工具

### 2.1 官方文档：审查粒度、严重性分级、降噪与阻断能力

**CodeRabbit**（[官方文档](https://docs.coderabbit.ai/guides/code-review-overview)）

- **粒度**：新 PR 做 full comprehensive review；后续 commit 做 incremental review（"focus on newly added changes … Maintains conversation context"）。结合 50+ 开源 linter/安全扫描器与"code graph analysis"做跨文件/跨仓库上下文。
- **类型标签（6 类）**：Security & Privacy、Stability & Availability、Data Integrity & Integration、Functional Correctness、Performance & Scalability、Maintainability & Code Quality。
- **严重性分级（5 级）**：🔴 Critical（系统失效/安全/数据丢失）、🟠 Major（影响功能或性能）、🟡 Minor（应处理但不致命）、🔵 Trivial（低影响改进）、⚪ Info（无需行动）。
- **降噪机制**：`@coderabbitai pause / resume / resolve`；[Learnings](https://docs.coderabbit.ai/knowledge-base/learnings) 从团队反馈中学习（即"把被驳回的意见变成不再重复的规则"）。
- **官方对噪音的定义**（[Measuring what matters](https://www.coderabbit.ai/blog/measuring-what-matters-in-the-age-of-ai-assisted-development)）："**A low acceptance rate would indicate noise.** A high rate indicates trusted, actionable feedback." 官方建议按 severity 与 category 分别看 acceptance rate——"若 Security 的接受率低，可能说明该类别误报多"。
- **阻断力**：作为 GitHub check 运行，是否阻断由仓库 branch protection 决定，产品本身定位为审查者而非门禁。

**Graphite Diamond**（[官方文档](https://graphite.com/docs/ai-review-comments)）

- **粒度**：在 PR 的相关代码行上留 inline comment，每条包含"问题描述 + 为什么重要 + 具体修法"；超出 200,000 字符的 PR 不分析（**显式范围界定**）。
- **问题类型**：logic bugs、edge cases、security vulnerabilities、performance issues、**accidentally committed code**（调试语句、测试数据、注释掉的代码、临时绕过）。
- **官方度量口径**：issues found / issues accepted / **acceptance rate** / PRs reviewed / **downvote rate**，并按 category 拆分接受率；另有 Rules & exclusions 的效果度量。
- **阻断力**：advisory；作者可像处理同事评论一样 commit suggestion。

**Greptile**（[Custom Standards & Rules](https://www.greptile.com/docs/code-review/custom-standards)）：通过 custom standards/rules 让工具执行团队自己的命名约定与架构模式——即**把"团队既有事实标准"沉淀为可复用规则**，这是误报控制的主要抓手。

**Cursor Bugbot**（[官方文档](https://cursor.com/docs/bugbot)）：分析 PR diff，对每次 PR 更新自动运行，留评论并给修复建议；有 personal settings 可配置。

**GitHub Copilot code review**（[官方文档](https://docs.github.com/copilot/using-github-copilot/code-review/using-copilot-code-review)）：用 GitHub Actions 运行 agentic 审查能力；是否作为 required status check 阻断由仓库配置决定。

> **覆盖度说明**：CodeRabbit 与 Graphite 的官方文档已逐页核对（含严重性分级与度量口径）；Greptile / Cursor Bugbot / GitHub Copilot code review 已在§2.2 补充核对到官方配置文档层面。另外，**Amazon CodeGuru Reviewer 与 GitHub Copilot code review 均未找到同行评审的接受率/精度研究**（见 §10）。

### 2.2 官方分级标签与"advisory / 可阻断"开关对照

这一节是对 §2.1 的补强，全部来自官方文档（含配置参考页）。

**官方严重性标签对照表**

| 工具 | 官方标签 | 是否自带处置语义 | 来源 |
|---|---|---|---|
| CodeRabbit | `critical` / `major` / `minor` / `trivial` 四档（`info`、`none` 在排名之外）；Overview 另用 **p1–p4 优先级带 + merge readiness**（Ready / Caution / Risky / **Blocked**） | 部分——merge readiness 的 `Blocked` 是事实上的处置态 | [Change Stack findings](https://docs.coderabbit.ai/change-stack/findings) |
| Greptile | **P0 Critical「Must fix before merging」/ P1 High「Should fix」/ P2 Medium「Consider fixing」**；另有 **PR 级 0–5 Confidence Score** | **是**——标签文本直接写出处置动词 | [First PR review](https://www.greptile.com/docs/code-review/first-pr-review) |
| Cursor Bugbot | **无独立分级表**；analytics/API 的 `severity` 仅 `high` / `medium`；规则示例区分 **blocking / non-blocking** Bug | 是（blocking/non-blocking 二分） | [Bugbot docs](https://cursor.com/docs/bugbot) |
| GitHub Copilot | `High` / `Medium` / `Low` | 否 | [Use code review](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/request-a-code-review/use-code-review) |
| Graphite Diamond | **未获取到**（官方文档通篇无 severity/critical/P0，只有问题类别） | 否 | [AI review comments](https://graphite.com/docs/ai-review-comments) |

> 值得注意：**Greptile 是唯一把处置动词写进严重性标签本身的工具**（"Must fix before merging"），而 CodeRabbit 的 `findings` 页与 `overview` 页给出的分级并不完全一致（4 档排名 vs 5 档含 Info）。**跨工具拼装分级体系时，这一点必须先统一。**

**阻断力开关（官方文档确认）**

| 工具 | 默认行为 | 如何变为阻断 |
|---|---|---|
| CodeRabbit | **advisory**（`reviews.request_changes_workflow` 默认 `false`） | 开 `request_changes_workflow: true`；Pre-Merge Check mode 设 `error`（另有 `off` / `warning`）（[配置文档](https://docs.coderabbit.ai/pr-reviews/request-changes-workflow)） |
| Cursor Bugbot | **advisory**——findings → check 结论 `neutral`，官方原话：**"requiring the status alone does not block merges"** | 启用 fail-on-unresolved-issues 后才产出 `failure` |
| GitHub Copilot | **advisory**——默认只留 Comment review，不计入 required approvals；approvals 功能默认关闭且为 public preview | 官方明确把"block merge until all comments addressed"列为**不支持**，只能用 approvals 去满足 required-approval 规则 |
| Graphite Diamond | **advisory**（文档只描述它"alongside human reviewers"，无 check / fail-on 说明） | 未获取到 |
| Greptile | `statusCheck` 默认 `true`（会发 check） | current 文档**未定义** request-changes/blocking 模式；是否阻断取决于 branch protection 是否把它设为 required（未获取到明文定义）（[配置参考](https://www.greptile.com/docs/code-review/greptile-config-reference)） |

**结论**：**五个工具全部默认 advisory；"阻断"是一个需要显式开启的配置项，而不是默认语义。** 这与 §4.2 的 GitHub required-check 机制完全一致，也直接支持"审查默认不阻断"的设计取向。

**精度/误报率的官方口径（注意均为自述或厂商自办评测）**

| 工具 | 数字 | 性质 |
|---|---|---|
| CodeRabbit | F1 51.2%、precision 49.2%、recall 53.5%（第三方 Martian Code Review Bench，但由 CodeRabbit 引用发布） | 厂商引用，[链接](https://www.coderabbit.ai/blog/coderabbit-tops-martian-code-review-benchmark) |
| Greptile | 82% catch rate | **厂商自办 benchmark**，非独立评测，[链接](https://www.greptile.com/benchmarks) |

→ 再次印证 §10 的判断：**厂商公布的精度数字缺少独立复现**，不能直接作为流程阈值依据。

**官方降噪机制对照（补全 §2.4 的原始清单）**

| 工具 | 官方机制 |
|---|---|
| CodeRabbit | `profile` quiet / chill / assertive（默认 chill）；`path_filters` + 内置默认忽略清单；`path_instructions`；Learnings（`scope` auto/global/local、`approval_delay`）；`auto_review` 过滤（`ignore_title_keywords`、labels、`ignore_usernames`、drafts 默认不审）；`review_details` 会**列出被抑制的评论** |
| Greptile | `strictness` 1–3（默认 2）；`commentTypes`（logic/syntax/style）；`ignorePatterns`（只跳审查、不跳索引）；`rules.md` 与 `rules[]`（severity low\|medium\|high）；学习系统（只由 👍/👎 训练，同类型被忽略 3+ 次则抑制） |
| Cursor Bugbot | **读取已有 PR 评论以避免重复建议**；rules（`.cursor/BUGBOT.md`、team/repo/learned/manual、scoped paths）；effort levels |
| GitHub Copilot | 排除文件清单（lock / generated / `*.d.ts` / `*.min.js` 等）；自定义指令（`.github/copilot-instructions.md`、`AGENTS.md`、`.github/instructions/**/*.instructions.md`、`CLAUDE.md`/`GEMINI.md`/`REVIEW.md`）；effort Lite/Balanced；👎 反馈；官方承认 **re-review 可能重复已 resolve 的评论** |
| Graphite Diamond | comment exclusions（自然语言"不要评论"）；custom prompts / glob 引用仓库文档；PR 级过滤（作者/路径/label/标题/分支）；**无**去重与 confidence 阈值文档 |

**一个可直接照抄的设计模式——"永不抑制清单"**：Greptile 在大量"可抑制"配置之外，硬编码了一组**任何学习/忽略规则都不能压制的类别**：安全漏洞、内存泄漏、死循环、空指针、用户输入校验缺失。这正是"降噪不能把门槛降到零"的正确实现，也回答了"哪些证据永远必须被记录"。（来源：[Greptile 配置参考](https://www.greptile.com/docs/code-review/greptile-config-reference)）

**两个共同缺口（对设计有直接影响）**

1. **没有任何工具在官方文档中提供 confidence 阈值配置**——即"低于某置信度就不报"这个最自然的门槛旋钮，行业里并不存在；替代物是 severity 分层、strictness 档位与学习抑制。
2. **没有工具提供正式的 "out of scope" 章节**——范围界定靠 `path_filters` / `ignorePatterns` / 排除清单这类机制隐式表达。**这意味着"哪些不审"必须由使用方自己显式定义（对应 §11 清单的 A13）。**
3. Copilot 的审查范围官方表述是 "reviews pull request diffs and metadata"，**没有**字面的 "only changed lines"；Bugbot 的 "only report high-confidence" 类设置**未获取到**。

### 2.3 第三方实测数据（146 PR / 679 findings / 4 reviewer 并行 3.5 周）

来源：[We Ran 4 in Parallel for 3 Weeks](https://dev.to/_vjk/best-ai-code-reviewer-in-2026-we-ran-4-in-parallel-for-3-weeks-146-prs-679-findings-1c0f)（数据集开源：[pr-review-bench](https://github.com/vlad-ko/pr-review-bench)；作者供职于其中一家厂商，已披露；N=1 代码库）。

| 工具 | findings（PR 数） | 密度 | 误报率 | 一键可应用修复 | 平均首条延迟 |
|---|---|---|---|---|---|
| CodeRabbit | 281（82） | 3.4/PR | 2.3% | 68.3% 带 unified diff | 9.5 min |
| Sentry Seer | — | 2.6/PR | critical 0%（6/6）；**high 15%** | 0%（纯文字） | 3.7 min |
| Greptile | 120（55） | 2.2/PR | 0%（118/120 被"Fixed in"；口径见原文） | 32.5% 带 suggestion | 4.9 min |
| Cursor BugBot | 128（50） | 2.6/PR | 4.8% | 0%（仅"Fix in Cursor"深链） | — |

**三条对设计最关键的发现**：

1. **严重性越高，误报率往往越高**：原文结论是 "higher severity tiers tend to have higher false-positive rates. This is the bug-prediction tradeoff in concentrated form."（例外是 Seer 的 `critical` 6/6）。→ **不能把 severity 直接映射为阻断力。**
2. **审查者之间几乎不重叠**：617 个 (file, line) 坐标中，**93.4% 只被一个 reviewer 发现**，6.0% 被两个，0.6% 被三个，**四个同时命中 0 次**。→ 加第二个 reviewer 是**增量**而非重复；但代价是别的维度（见下）。
3. **多轮循环会吞掉收益**：CodeRabbit 在 fix-push 后会再次审查，非平凡 PR 平均要 **5–6 轮** review 循环；CodeRabbit 的 `pending/success` 状态在单次审查中会翻转 2–4 次，作者不得不"改成等待固定窗口"。→ **审查频率本身就是成本项**，需要显式预算。

另有独立厂商评测提醒：跨厂商的 severity 词汇不可直接比较（CodeRabbit: critical/major/minor；Seer: critical/high/medium/low；Greptile: P1/P2），**"用统一口径重新标注 679 条 finding"是引入分级体系时必须先做的事**（原文 methodology footnote）。

### 2.4 降噪与"不阻断"的设计模式（跨工具汇总）

从官方文档与实测中可提炼出 8 条可直接复用的模式：

| # | 模式 | 具体做法 | 来源 |
|---|---|---|---|
| N1 | **范围界定** | 只审变更内容；显式声明不审的情形（Graphite：PR > 200,000 字符不分析） | [Graphite](https://graphite.com/docs/ai-review-comments) |
| N2 | **置信度分层** | 维护一个"最高置信层"，并**要求该层精度最高**（Seer 的 `critical`：6/6 零误报；而 `high` 层 15% 误报） | [dev.to 实测](https://dev.to/_vjk/best-ai-code-reviewer-in-2026-we-ran-4-in-parallel-for-3-weeks-146-prs-679-findings-1c0f) |
| N3 | **报告一次、只更新处置** | 同一 finding 不因 fix-push 重报；避免 5–6 轮 review 循环与状态翻转 | 同上 |
| N4 | **学习回路** | 把被驳回/被证伪的意见沉淀为规则：CodeRabbit [Learnings](https://docs.coderabbit.ai/knowledge-base/learnings)、Greptile [Custom Standards](https://www.greptile.com/docs/code-review/custom-standards)、Graphite [Rules & exclusions + downvote rate](https://graphite.com/docs/ai-review-comments) | 各官方文档 |
| N5 | **显式暂停/裁决命令** | `@coderabbitai pause / resume / resolve`——把控制权交给被审者 | [CodeRabbit](https://docs.coderabbit.ai/guides/code-review-overview) |
| N6 | **中性的检查结论** | `neutral` 表示"有内容但不阻断"。**但实测警告：GitHub 把 `neutral` 渲染成灰色方块，人眼会读成"通过"**——一次"明显失败的 PR 差点因此被合并"。→ 如果采用中性态，必须同时改变其可见性（例如在摘要里显式计数） | [dev.to 实测](https://dev.to/_vjk/best-ai-code-reviewer-in-2026-we-ran-4-in-parallel-for-3-weeks-146-prs-679-findings-1c0f) |
| N7 | **findings 要命名失败模式，不要用模板化标题** | 同样的 verdict，Greptile 的标题直接写出用户可见后果，CodeRabbit 用统一的"⚠️ Potential issue / 🟠 Major"横幅——前者可被直接行动，后者只说明"这里有问题" | 同上 |
| N8 | **把系统视图与代码视图连起来** | 按语义层重排 diff（Change Stack）+ 影响范围图（Blast Radius），让审查者能验证每条论断而不用从文件树重建变更 | [CodeRabbit](https://www.coderabbit.ai/blog/software-factory-review-gate) |
| N9 | **"永不抑制"硬底线** | 无论学习/忽略规则如何配置，某几类 finding 永远必须被记录：安全漏洞、内存泄漏、死循环、空指针、用户输入校验缺失 | [Greptile 配置参考](https://www.greptile.com/docs/code-review/greptile-config-reference) |
| N10 | **把被抑制的内容也列出来** | CodeRabbit 的 `review_details` 会列出 suppressed comments——降噪动作本身可审计，而不是静默丢弃 | [CodeRabbit](https://docs.coderabbit.ai/guides/code-review-overview) |

N6 与 N7 是本次调研里最"反直觉但值钱"的两条：**"不阻断"的表达方式本身会决定它是否被忽略。** N9/N10 则是"降噪不越界"的一对：**噪声要压，但压了什么必须留痕，且有一组类别永远不许压。**

**共性缺口（官方文档层面）**：没有任何工具提供 **confidence 阈值**配置；也没有工具提供正式的 **out of scope** 章节——"哪些不审"必须由使用方自己显式定义（对应 §11 清单的 A13）。

---

## 3. 主题三：多模型异构审查（heterogeneous review）

### 3.1 一手论文：收益是方向不对称的，跨模型并不必然更好

**Xiang, Zhang, Zhang, Xu，*Cross-Model LLM Code Review: Should you use Claude to review Codex or vice versa?***，[arXiv:2607.21656](https://arxiv.org/abs/2607.21656)（Agentic SE @ KDD'26）。

- **设置**：116 个 LiveCodeBench hard/medium 任务（全部 2025 年后发布，规避数据污染）；Claude Opus 4.7 与 Codex GPT-5.5；6 个条件（双 solo 基线 + 双跨模型方向 + 双同模型方向）；reviewer 只能静态审查、**不能执行测试**；high reasoning effort；McNemar 检验 + BH 校正。
- **结果（通过率变化）**：

| 条件 | 变化 | 显著性 |
|---|---|---|
| Claude 审 Codex（跨模型，弱→强） | 71.6% → **89.7%（+18.1pp）** | p_BH = .001 ✅ |
| Codex 自审（同模型） | 71.6% → **84.5%（+12.9pp）** | p_BH = .022 ✅ |
| Codex 审 Claude（跨模型，强→弱） | 91.4% → **82.8%（−8.6pp）** | p_BH = .046 ❌ |
| Claude 自审（同模型） | 91.4% → 91.4%（+0.0） | n.s. |

- **回归率**：Codex 审 Claude（AO）最高 11.2%，并丢失 13 个原本通过的案例。
- **成本/延迟**：Claude solo 帕累托最优；Claude 自审（AA）是"零收益 + 72% 成本 + 58% 延迟"的被支配方案。净修复成本约 $1.40/个（OA）与 $0.95/个（OO）。
- **作者的自我限定**（重要，引用时须一并给出）：AO 与 OA 的直接对比 **p_BH = .1444，不显著**；本实验设计**无法分离"审查方向"与"审查者/被审者基线能力差"**；结论与 [Olausson et al., *Is Self-Repair a Silver Bullet for Code Generation?*（ICLR 2024）](https://arxiv.org/abs/2306.09896) 关于 LLM 自修复的发现一致——**reviewer 强于 writer 时收益最大**。样本仅 116 题、单一模型对、竞赛题而非仓库级任务、单一 prompt。

**可直接落地的推论**：异构审查的价值主张应改为"**当审查者能力显著高于生产者时**，引入独立审查者（无论是否同源）能提高正确率；**审查者弱于生产者时审查会净损害**"。厂商口中"不同厂商模型交叉审查必然更好"**没有一手证据支持，且被该论文部分证伪**。

### 3.2 同源偏差：为什么"独立来源"仍值得做（但机理尚无定论）

两篇代表工作给出**量化**结论，但机理彼此冲突：

- [Wataoka et al., *Self-Preference Bias in LLM-as-a-Judge*（arXiv:2410.21819）](https://arxiv.org/abs/2410.21819)：提出基于 Equal Opportunity 的量化指标；在 Chatbot Arena 33k 对话、8 个模型上测得 **GPT-4 自偏好 0.520**（recall 0.945 vs 0.425），Demographic Parity 口径 **0.749**；GPT-3.5 仅 0.191、Vicuna-7b 0.052，dolly/stablelm 为负。**其归因是困惑度（perplexity）**——模型偏好低困惑度文本，与是否自生成无关。
- [Panickssery et al., *LLM Evaluators Recognize and Favor Their Own Generations*（NeurIPS 2024, arXiv:2404.13076）](https://arxiv.org/abs/2404.13076)：**自识别能力与自偏好强度呈线性相关**（GPT-3.5 微调后 Kendall τ 由 0.41 → 0.74/0.82；GPT-4 对自身摘要识别率 0.71 vs 随机 0.5），并用控制实验排除了因果反向。

**结论**：用不同来源的模型做审查/裁决，**主要价值在于削弱同源偏差**，而不是保证正确率提升。但需注意两文归因不一致（困惑度 vs 自识别），因此"换模型消除偏见"的强度是一个**开放问题**。这与 §2.3 的实测一致：不同工具/模型的 finding 集合高度互补（93.4% solo），但互补 ≠ 每个都可信。

### 3.3 LLM ensemble / 多智能体辩论：三条被证伪的直觉

| 流行直觉 | 证据状态 | 来源 |
|---|---|---|
| "多个模型辩论/集成必然优于单模型" | **被证伪**：多智能体辩论当前形式**不能可靠优于** self-consistency / 多路径集成，且对超参极敏感（需调参后才可能超越） | [Smit et al., arXiv:2311.17371](https://arxiv.org/abs/2311.17371) |
| "调用次数/审查者越多越好" | **被证伪（非单调）**：随 LM 调用数增加，Vote / Filter-Vote 性能**先升后降**，源于任务内难度多样性 | [Chen et al., arXiv:2403.02419](https://arxiv.org/abs/2403.02419) |
| "换个厂商就拿到独立意见" | **被强烈削弱**：350+ 模型大规模评测显示错误高度相关（某榜单双方出错时 60% 一致），且**越强越准的模型错误相关性越高，即便架构与厂商不同** | [Kim et al., ICML'25, arXiv:2506.07962](https://arxiv.org/abs/2506.07962) |
| （反向证据）异构结构本身有价值 | **支持**：27 个模型、1.7M 次评测显示同构 → 异构 MAS 免改结构即可提分（chatbot-only MATH +8.4%；chatbot-reasoner AIME +47%） | [X-MAS, arXiv:2505.16997](https://arxiv.org/abs/2505.16997) |

补充：[arXiv:2503.13505](https://arxiv.org/html/2503.13505v3) 是七类集成方法的**综述**而非新一手实验；[arXiv:2511.07267](https://arxiv.org/pdf/2511.07267) 指出 MAD 的价值更多在**提供可核查的推理证据**而非单纯提升判定准确率——这条与"证据门槛"的设计方向一致。

**工程侧警示**：交叉审查可能形成**确认偏误回路**（两个模型都同意同一个错误模式），上述错误相关性数据正是其量化表现。

---

## 4. 主题四：审查不阻断 —— "证据门槛（evidence threshold）"如何定义

### 4.1 门槛的定义：审查结论要"算数"所需的最小证据集合

综合 Google（"definitely improves overall code health"）、Amazon（"two-way door + 70% 信息"）、Spec Kit（"Missing verification is not a successful fix"），可给出一个可操作的三层定义：

| 层 | 内容 | 缺失时的状态 | 是否阻断 |
|---|---|---|---|
| **L1 Observation（事实）** | 机器可复现的原始证据：命令、exit code、文件路径+行号、diff/commit hash、日志片段 | `unavailable` | 否 |
| **L2 Finding（判定）** | Observation → 结论的推理链 + 严重性 + 与 spec/plan 条目的对应关系 | `incomplete` | 否 |
| **L3 Disposition（处置）** | `fixed` / `accepted-risk` / `deferred` / `rejected(false-positive)`，含责任人与时间 | `unknown` | 否（但阻断"宣称完成"） |

**证据门槛（evidence threshold）的可判定形式**（建议直接写进流程）：

> 一个 finding 只有在同时满足 (a) 引用了可复现的最小命令或精确代码位置、(b) 映射到 spec/plan 的某个条目（可追踪）、(c) 给出严重性的判定依据 时，才进入"必须响应"队列；否则进入"记录但不要求响应"队列。

这与 NASA 的 TBR 机制同构（见 §7）：**门槛的作用是区分"必须处理"与"记录在案"，不是区分"能否继续"。**

### 4.2 不阻断的五种既有机制

1. **required vs 非 required check（含"留痕放行"三态）**：只有被显式设为 required 的状态检查才阻断合并，而 required check 本身允许 `successful` / `skipped` / **`neutral`** 三态通过——`neutral` 就是"留痕但放行"（[GitHub branch protection 官方文档](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)；注意官方文档并未使用 "advisory check" 一词，这是社区叫法）。→ 审查工具的默认定位应是"非 required + 中性结论"。
2. **Conventional Comments 的 decoration**：`suggestion (non-blocking)` / `issue (blocking)` / `(if-minor)`——用**显式装饰符**把"是否阻断"从标签里分离出来，并且格式可被机器解析（`{"label":…,"decorations":[…]}`）。原文明确："A comment with `(non-blocking)` **should not** prevent the subject under review from being accepted."；`nitpick` / `thought` / `note` **天然非阻断**，`chore` 则是"正式接受前必须做"（[conventionalcomments.org](https://conventionalcomments.org/)）。
3. **Google 的 `Nit:` 前缀**：不重要的意见必须打标，作者可选择忽略；纯教学性评论也必须标 Nit 或注明非必须解决（[standard](https://google.github.io/eng-practices/review/reviewer/standard.html)）。
4. **事后触发而非事前门：SRE error budget policy 与 PRR**。Google SRE 的 error budget policy 是**事后触发**：只有当预算被超支才暂停发布，且明示"这不是惩罚"，**P0 与安全修复仍可放行**（[SRE Workbook: Error Budget Policy](https://sre.google/workbook/error-budget-policy/)）。Production Readiness Review（PRR）的产出是"与开发团队协商出的改进优先计划"，**不是通过/否决门**（[SRE Book: Evolving SRE Engagement Model](https://sre.google/sre-book/evolving-sre-engagement-model/)）。
5. **风险接受（accepted risk / exception）的形式化**：NASA NPR 8000.4C 把 risk acceptance 绑定到**具名角色与权限层级**（项目/中心/任务支持局、技术当局 concurrence、异议走 formal dissent）（[NPR 8000.4C Chapter 2](https://nodis3.gsfc.nasa.gov/displayDir.cfm?Internal_ID=N_PR_8000_004C_&page_name=Chapter2)）；带期限的例外有成熟模板：FedRAMP POA&M 规定 Critical/High 30 天、Moderate 90 天、Low 180 天，不可修复项与供应商依赖项作为 **open risk 需定期复评**（[FedRAMP POA&M](https://www.fedramp.gov/legacy/playbook/csp/authorization/poam/)）。这正是 workflowhub `accepted_risk` 语义的行业对应物：**owner + 理由 + 到期/复审条件，缺一不可。**

补充：项目级的"必须修 vs 可延后"也有成熟样本——

| 项目 | 机制 | 可借鉴点 |
|---|---|---|
| LLVM（[CodeReview](https://llvm.org/docs/CodeReview.html)） | 需**显式** approval；"不要假设沉默即通过"；不打算阻断必须明说；支持 **conditional acceptance**（先合入 + 后续 patch） | conditional acceptance = 带条件的推进 |
| Chromium（[code_reviews](https://chromium.googlesource.com/chromium/src/+/main/docs/code_reviews.md)） | `+1`=LGTM、`−1`=不应原样提交；owner 必须批准；有 **Owners-Override** 破门机制与仅限可验证改动（clean revert、翻译）的 Rubber Stamper | 破门机制必须存在且被记录 |
| Kubernetes（[PR guide](https://www.kubernetes.dev/docs/guide/pull-requests/)） | `/hold` 与 WIP 阻断；`/lgtm`（reviewer）与 `/approve`（approver）**分离**，二者齐备后 Tide 才合并；PR 超 90 天自动关闭 | 把"技术通过"与"归属批准"拆成两个正交信号 |
| Mozilla（[archive](https://www-archive.mozilla.org/hacking/code-review-faq)） | `review+` / `review−` flag | 最简二态 |

### 4.3 反模式与反证：门槛一旦变成闸门会发生什么

- **DORA 的实证反证（最强的一条）**：change fail rate 被定位为 instability 的**滞后指标**（事后度量），而非事前门；DORA 研究显示**外部 CAB / 审批委员会对软件交付性能有负面影响**，且明确写道"**没有证据支持更正式的外部评审带来更低的 change failure rate**"，以及"**用更多流程回应稳定性问题会让事情变得更糟**"（[DORA metrics guide](https://dora.dev/guides/dora-metrics/)、[Streamlining change approval](https://dora.dev/capabilities/streamlining-change-approval/)）。
- **排队与上下文切换**：Google 明确指出等待正式评审会议"can significantly slow down the development process"；小 CL 指南把"等待 review 期间不阻塞自己"当作作者的基本技能（[small-cls](https://google.github.io/eng-practices/review/developer/small-cls.html)）。
- **审查轮次通胀**：多 reviewer 并行会把 PR 推到 5–6 轮 review 循环（§2.3）。
- **警告疲劳的度量困难**：一项涵盖 22 篇系统综述的医疗领域研究指出，其中**只有 1 篇给出了 alert fatigue 的操作定义**，建议以"适当响应率相对基线持续显著下降"作为度量（[PMC13385993](https://pmc.ncbi.nlm.nih.gov/articles/PMC13385993/)）。→ 工程流程中也应显式定义"什么算疲劳"，否则无法判断门槛是否过紧。
- **诚实的证据缺口**：**工程领域"quality gate 阻塞成本"的一手量化数据未能找到**——目前只有 DORA 的定性负面结论。任何声称"闸门导致 X% 效率损失"的数字都应视为未经证实。

### 4.4 唯一值得保留的窄阻断集

综合上述，阻断应当被限制在一个**三条件同时成立**的窄集合：

1. 动作**不可逆**（Amazon 的 one-way door：数据删除/迁移、发布、外部契约变更）；
2. 属于**高错误成本类别**（安全、隐私、客户数据、公共接口）；
3. 该决策点上**证据缺失**（`unavailable`，而非"证据显示有缺陷"）。

其余一切情况一律 advisory + 强制记录。这个设计同时满足"有证据门槛"（门槛决定记录与响应义务）与"不阻断推进"（门槛不决定流程状态）。

可参照的成熟豁免规则：Google SRE 在发布冻结期**仅 P0 与安全修复**可越过（[error budget policy](https://sre.google/workbook/error-budget-policy/)）。

---

## 5. 主题五：finding 的严重性分级与处置绑定

### 5.1 行业分级体系对照

| 体系 | 级别 | 是否自带处置语义 |
|---|---|---|
| CodeRabbit（[findings 官方](https://docs.coderabbit.ai/change-stack/findings)） | `critical` / `major` / `minor` / `trivial`（`info`/`none` 不在排名内）+ p1–p4 优先级带 + merge readiness（Ready/Caution/Risky/**Blocked**） | 部分——`Blocked` 是事实上的处置态 |
| Greptile（[官方](https://www.greptile.com/docs/code-review/first-pr-review)） | **P0 "Must fix before merging" / P1 "Should fix" / P2 "Consider fixing"** + PR 级 0–5 Confidence Score | **是**——标签文本直接写出处置动词 |
| Conventional Comments（[规范](https://conventionalcomments.org/)） | label: praise / nitpick / suggestion / issue / todo / question / thought / chore / note；decoration: `(blocking)` / `(non-blocking)` / `(if-minor)` | **是**——阻断性由 decoration 显式声明；`nitpick`/`thought`/`note` 天然非阻断，`chore` 是"接受前必须做" |
| Google（[eng-practices](https://google.github.io/eng-practices/review/reviewer/standard.html)） | `Nit:` 前缀 = 非强制 | 是（仅两档） |
| GitHub Copilot（[官方](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/request-a-code-review/use-code-review)） | High / Medium / Low | 否 |
| Cursor Bugbot（[官方](https://cursor.com/docs/bugbot)） | 无分级表；analytics/API 仅 `high`/`medium`；规则层面区分 blocking / non-blocking | 是（二分） |
| OWASP Risk Rating（[官方](https://community.owasp.org/OWASP_Risk_Rating_Methodology)） | Likelihood × Impact 各 0–9 → Low / Medium / High / Critical 矩阵 | 部分——明确"**并非所有风险都值得修**"；技术影响高但业务影响低时应整体降级 |
| Microsoft MSRC Bug Bar（[官方](https://www.microsoft.com/en-us/msrc/sdlbugbar)） | Critical / Important / Moderate / Low | **是**——分级直接决定修复时限；可因 user interaction 等原因降级 |
| CISA KEV（[BOD 22-01](https://www.cisa.gov/news-events/directives/bod-22-01-reducing-significant-risk-known-exploited-vulnerabilities-revoked)） | 按"是否已被在野利用"而非 CVSS 分数决定修复时限（2021 年前分配 CVE 者 6 个月、其余 2 周）；**不发豁免** | 是——且明确 **CVSS 高分 ≠ 已被利用（<4% 的 CVE 曾被公开利用）** |
| 通用工程实践 | P0/P1/P2/P3 或 blocker / critical / major / minor / nit | 常见做法是 P0 阻断，其余记录 |

**关键观察**：成熟做法普遍把"**严重性**"与"**阻断性**"拆成两个正交维度。严重性描述影响面；阻断性是一个**显式声明**（decoration / required check / accepted risk），且默认应为非阻断。合并两者是噪音与摩擦的主要来源。

另一个关键观察来自 CISA 与 OWASP：**级别的意义取决于它触发什么动作**。CISA 放弃"按 CVSS 分数排序"，改按"是否已被在野利用"分配修复时限——即**用可观测的证据（exploited）替代对影响面的主观估计**。这为审查分级提供了重要思路：能用事实替代估计的地方，就用事实。

### 5.2 建议的分级 → 处置绑定矩阵

| 级别 | 判定依据（证据要求） | 处置 | 是否阻断推进 |
|---|---|---|---|
| **blocker** | 不可逆动作 + 高错误成本类别 + 证据缺失；或 `definitely worsen`（Google 的唯一硬边界） | 修复，或由人签署 `accepted-risk`（owner + 理由 + 过期/复审条件） | **仅在窄集合内阻断**（§4.4） |
| **major** | 功能正确性/契约破坏，且有可复现证据（命令/失败用例/精确代码位置）。**Greptile 的官方措辞可直接借用：P0「Must fix before merging」/ P1「Should fix」/ P2「Consider fixing」** | 同 task 内修复；未修则记为 `open`（保持可见，不冻结流程） | 否 |
| **minor** | 可维护性、命名、一致性、文档 | 记入待办或按 `(if-minor)` 交给作者裁量 | 否 |
| **info / nit** | 风格偏好、教学性建议、praise | 仅记录 | 否 |

### 5.3 分级必须校准：证据强度 ≥ 严重性

实测数据反对"高严重性 = 高可信"（§2.3）。落地要求：

- **高严重性 tier 必须有更高的证据门槛**：`blocker`/`critical` 必须附可复现命令或失败用例，否则自动降级为 `major` 或 `question`。
- **建立误报反馈回路**：CodeRabbit 的 [Learnings](https://docs.coderabbit.ai/knowledge-base/learnings)、Greptile 的 [custom standards](https://www.greptile.com/docs/code-review/custom-standards)、Graphite 的 [Rules & exclusions + downvote rate](https://graphite.com/docs/ai-review-comments) 都是"把被证伪的意见沉淀为不再重复的规则"。**没有这个回路，分级就只是随机数。**
- **不要跨体系比较 severity 词汇**（§2.3 methodology footnote）。

---

## 6. 主题六：审查的经济性 —— 成本 vs 收益

### 6.1 公开数字

| 数据点 | 数值 | 来源 |
|---|---|---|
| 开发者投入代码审查的时间占比 | **10–15%** | [arXiv:2510.05450](https://arxiv.org/html/2510.05450v1)（引 Prior work） |
| 人工审查最优批次 | **200–400 LOC**，60–90 分钟 | [SmartBear / Cisco 研究](https://smartbear.com/learn/code-review/best-practices-for-peer-code-review/) |
| 该批次下的缺陷发现率 | **70–90%** | 同上 |
| 审查速度上限 | **< 500 LOC/小时**（更快则缺陷密度显著下降） | 同上 |
| 单次审查时长上限 | **≤ 60 分钟**（此后表现下降） | 同上 |
| 每小时的缺陷发现数 | 约 **15 个/小时**；平均 **32 defects/kLOC**；**61% 的评审零缺陷**；94% 的评审 < 20 defects/hour；检视 >450 LOC/h 时 87% 的案例缺陷密度低于平均（注意 15/h 与 32/kLOC 口径不同） | Cisco 案例，经 [二手转述](https://mikeconley.ca/blog/2009/09/14/smart-bear-cisco-and-the-largest-study-on-code-review-ever/)（原始 PDF 未能获取） |
| 轻量审查 vs 正式审查 | 轻量审查耗时 **< 正式审查的 20%，发现的缺陷一样多** | SmartBear（正式 inspection 平均 9 小时/200 LOC、最多 6 人） |
| 抽查比例 | 抽查 **20%–33%** 的代码即可降低缺陷密度，且时间开销极小 | 同上（"Ego Effect"） |
| 缺陷类评论占比 | 实际审查评论中**只有 14%** 与缺陷相关 | Bacchelli & Bird, *Modern Code Review*, ICSE 2013（经 [DX / Brian Houck 引述](https://newsletter.getdx.com/p/what-are-code-reviews-even-for)） |
| 审查评论本身的质量 | 739 条人工审查评论中 **292 条（39%）根本不是质量问题**；266 条重构类评论中 ChatGPT 仅命中 **8%**；整体 10% 完全匹配、23% 匹配或部分匹配；LLM 评论量约为人类的 **2.4×**，其中 40% 的未匹配评论被判定为有意义 | [arXiv:2602.11925（ICPC'26）](https://arxiv.org/html/2602.11925v1) |
| LLM 审查评论的解决率 | readability **43.3%**、bugs **41.9%**、maintainability **36.2%**、design **28.6%**；**60–70% 未被解决** | [arXiv:2510.05450](https://arxiv.org/html/2510.05450v1)（Atlassian 1,007 仓库 + OSS；4,000 条 LLM 评论） |
| **AI 审查的工业实测（有用率/解决率）** | Google AutoCommenter：**有用率仅 54%**（开发者反馈）/ 60%（独立评分），过滤后 66%/74% 才达 80% 上线目标；**解决率 ≈40%**；仅 **3.9%** 的变更文件被评论；A/B 中审查时长**无统计显著变化** | [AIware'24, DOI 10.1145/3664646.3665664](https://doi.org/10.1145/3664646.3665664) |
| ↑ | Meta MetaMateCR：ActionableToApplied **仅 19.7%**（GPT-4o 10.5%）；把补丁直接展示给 reviewer 使审查**慢 >5%** | [arXiv:2507.13499](https://arxiv.org/abs/2507.13499)（预印本，未见同行评审版） |
| ↑ | Atlassian RovoDev：**38.70%** 评论被解决，PR 周期 −30.8% | [ICSE-SEIP'26, DOI 10.1145/3786583.3786851](https://doi.org/10.1145/3786583.3786851) |
| ↑ | ByteDance BitsAI-CR：**75.0% 精度**；Go 语言评论过期率 26.7% | [FSE Companion'25, DOI 10.1145/3696630.3728552](https://doi.org/10.1145/3696630.3728552) |
| **反证：高解决率也可能更慢** | Cihan et al.：**73.8%** 评论被解决，但 **PR 关闭时长由 5h52m 升至 8h20m**，并出现错误审查、多余修改、无关评论 | [ICSE 2025 SEIP, arXiv:2412.18531](https://arxiv.org/abs/2412.18531) |
| Agent 代码审查评论的实际接受情况 | 54,791 条 agent 评论 / 342 仓库：解决率 Copilot **72.9%**、Cursor ~67%、**Codex ~53%**；**>72% 的驳回源于"有意设计决策"** | [arXiv:2607.21997](https://arxiv.org/abs/2607.21997) |
| 人类审查者的"有用密度" | **65.5%**（63–69% 跨项目稳定）；评审者熟悉该文件时 71–74%，**首次接触仅 32–37%**；评论在一行内触发修改者有用率 88%；带 "Won't fix" 的 92% 无用 | [Bosu, Greiler & Bird, MSR 2015](https://doi.org/10.1109/MSR.2015.21)（149 万条评论） |
| 人类审查的注意力分配 | 可维护性:功能性 ≈ **75:25**；**7–35% 的评论被丢弃**；评论接受率在不同项目差异巨大（ConQAT 93%/91% vs **GROMACS 仅 65%**）；最常见类别是代码注释（20%）与标识符（10%） | [Beller et al., MSR 2014](https://doi.org/10.1145/2597073.2597082) |
| 审查动机与实际的错位 | 发现缺陷是 44% 管理者 / 44% 程序员的首要动机，但"缺陷"类评论**仅列第四（14%）**，"代码改进"最多（29%）；**91%** 认为熟悉陌生代码耗时是主要挑战 | [Bacchelli & Bird, ICSE 2013](https://doi.org/10.1109/ICSE.2013.6606617) |
| 厂商对"噪音"的判据 | acceptance rate 低于约 50% 即视为噪音信号 | [CodeRabbit 官方](https://www.coderabbit.ai/blog/measuring-what-matters-in-the-age-of-ai-assisted-development) |
| 多 reviewer 的增量价值 | 93.4% 的 finding 只被一个 reviewer 发现；4 个从未收敛于同一行 | [dev.to 实测](https://dev.to/_vjk/best-ai-code-reviewer-in-2026-we-ran-4-in-parallel-for-3-weeks-146-prs-679-findings-1c0f) |
| 冗余审查的成本 | Claude 自审组：**+0.0pp 收益，+72% 成本，+58% 延迟** | [arXiv:2607.21656](https://arxiv.org/abs/2607.21656) |
| 效率在交付链上衰减 | 编码活动的 AI 增益大，但项目/发布环节增益小（weak-link 问题） | [NBER w35275, Writing Code vs. Shipping Code](https://www.nber.org/papers/w35275)（经 [CodeRabbit 综述](https://www.coderabbit.ai/blog/software-factory-review-gate) 转述） |
| 正式审批流程的收益 | **没有证据支持更正式的外部评审带来更低的 change failure rate**；外部 CAB/审批委员会对交付性能有负面影响 | [DORA](https://dora.dev/capabilities/streamlining-change-approval/) |
| 代码检查 vs TDD | code inspection 比 TDD 更能减少缺陷，**但成本也更高**；TDD 相比传统编程并不更有效（摘要层面仅定性结论） | [IEEE TSE 2012](https://www.computer.org/csdl/journal/ts/2012/03/tts2012030547/13rRUwdIOTO) |

### 6.2 由此得到的四条经济性结论

1. **审查预算是有限资源，应按"错误成本"分配。** 原文表述（CodeRabbit：*review depth should follow the cost of error*）与 Google 的 `small CL` 规则（一次 ≤400 LOC、≤60 分钟、超阈值应拆分或抽样）方向一致。
2. **瓶颈在审查轮次而非单条 finding。** 5–6 轮 review 循环 + 每轮多次状态翻转会显著拉长 lead time；**"报告一次、处置一次"比"每轮都重报"更经济**。
3. **"未解决的 finding"是默认状态，不是异常。** 60–70% 的 LLM 评论未被处理是实测常态，AI 审查的有用率/解决率整体落在 **20–75%** 区间（Google AutoCommenter 54–60%、Meta 19.7%、Atlassian 38.7%、ByteDance 75%）。流程设计必须让"未解决"成为**可记录、可查询、可接受**的状态，而不是失败。
4. **不要假设 AI 审查会节省人工审查时间。** Google 的 A/B 实验中，审查时长与迭代次数**没有统计显著变化**；Meta 甚至报告展示补丁使审查变慢 >5%；Cihan et al. 观察到 PR 关闭时长从 5h52m 升到 8h20m。审查的收益更可能体现在**缺陷前置发现**与**知识分布**上，而非直接的工时节省——因此 ROI 论证应基于"避免的返工成本"，而不是"省下的审查小时数"。

---

## 7. 主题七：规格审查清单（公开的"好规格"标准）

### 7.1 IEEE 830-1998：好 SRS 的八项质量属性

来源：[IEEE SA 830-1998](https://standards.ieee.org/standard/830-1998.html)。八项属性：**correct、unambiguous、complete、consistent、ranked for importance and stability、verifiable、modifiable、traceable**。该标准已被 ISO/IEC/IEEE 29148 取代，但属性仍是事实基准（[说明](https://github.com/geraldthewes/prd-wiki/blob/main/wiki/standards/ieee-830.md)）。

其中**verifiable** 与 **traceable** 是"证据门槛"在规格层的直接对应：每条需求都必须能够被测试/演示/检查/分析，并且双向可追溯到上层目标与下层实现。

### 7.2 ISO/IEC/IEEE 29148:2018

来源：[ISO 官方条目](https://www.iso.org/obp/ui/#iso:std:iso-iec-ieee:29148:ed-2:v1:en)、[29148 解读](https://www.modernrequirements.com/blogs/iso-29148-explained/)。它定义"好需求"的构造，并区分**单条需求的特性**（necessary、unambiguous、complete、singular、feasible、verifiable、correct、conforming）与**需求集的特性**（complete、consistent、feasible、comprehensible）。近年已有工作尝试用 NLP 自动量化这九项特性（[Well-Formed Quality of System Requirements … ISO 29148-2018](https://www.researchgate.net/publication/385802396_Well-Formed_Quality_of_System_Requirements_for_Verifying_to_ISO_29148-2018_A_Natural_Language_Processing_NLP_Based_Framework_and_Quantitative_Metric)）。

### 7.3 NASA SE Handbook Appendix C（最可操作的清单）

来源：[NASA — How to Write a Good Requirement](https://www.nasa.gov/reference/appendix-c-how-to-write-a-good-requirement/)。它是公开材料中**最接近"可直接机器化"**的清单：

- **C.1 术语语义**：`shall` = 需求；`will` = 事实/目的声明；`should` = 目标。（可直接作为规格解析规则。）
- **C.2 编辑清单**：主动语态、一致的术语、**定性/性能值必须带容差**、**free of implementation（说 What 不说 How）**、free of operations（需求不是活动描述）。
- **C.3 通用良好性清单**：语法与拼写、符合模板、正向陈述（避免 "shall not"）、**TBD 最小化——更好的是给出最佳估计并标记为 TBR，同时写明消除 TBR 的责任人、方法与期限**、必须附可理解的 rationale 与假设、位置正确。
- **C.4 校验清单（13 组）**：Clarity / Completeness / Compliance / Consistency / Traceability / Correctness / Functionality / Performance / Interfaces / Maintainability / Reliability / **Verifiability-Testability** / Data Usage。
  - Clarity 反例：模糊代词（this/these）、"as appropriate"、"etc."、"and/or"、"but not limited to"；要求**一句一需求、一个主语一个谓语**。
  - Traceability：每条需求必须**双向可追踪**且**可被唯一引用（唯一编号）**。
  - Verifiability：**给出了"不可验证词"清单**——flexible, easy, sufficient, safe, ad hoc, adequate, accommodate, user-friendly, usable, when required, if required, appropriate, fast, portable, light-weight, small, large, maximize, minimize, robust, quickly, easily, clearly，以及其他 `-ly` / `-ize` 结尾的词。

### 7.4 把规格清单变成审查机制

- **可直接机器化的三条**：`shall/will/should` 语义检查；不可验证词表扫描；需求唯一编号 + 双向追踪矩阵。
- **TBR 机制是"不阻断"的规格层原型**：不要求把未知写成 TBD（那会卡住），而是"给出最佳估计 + 标记为待解决 + 指定责任人与期限"。这与 §4.1 的 `unavailable`/`incomplete` 分层完全同构。
- **注意区分证据类型**：可验证性不等于"必须有测试"，NASA 明确可通过 test / demonstrate / inspect / analyze 四种方式之一满足。

---

## 8. 学术证据总表

| 研究 | 结论要点 | 链接 |
|---|---|---|
| Xiang et al., *Cross-Model LLM Code Review*（2026, KDD'26 Agentic SE） | 跨模型审查收益方向不对称；reviewer 弱于 writer 时 −8.6pp；冗余审查零收益高成本 | [arXiv:2607.21656](https://arxiv.org/abs/2607.21656) |
| Goldman et al., *What Types of Code Review Comments Do Developers Most Frequently Resolve?*（2025, Atlassian+Melbourne） | LLM 评论解决率 28.6%–43.3%；60–70% 未解决；LLM 与人类关注类型互补；bug 类评论在 LLM 输出中偏少 | [arXiv:2510.05450](https://arxiv.org/html/2510.05450v1) |
| Vijayvergiya et al., *AI-Assisted Assessment of Coding Practices in Modern Code Review*（Google AutoCommenter, AIware'24） | 有用率 54%/60%，过滤后 66%/74%；解决率 ≈40%；仅 3.9% 变更文件被评论；审查时长无显著变化 | [DOI 10.1145/3664646.3665664](https://doi.org/10.1145/3664646.3665664) |
| Cihan et al.（ICSE 2025 SEIP） | 73.8% 评论被解决，但 PR 关闭时长 5h52m→8h20m；出现错误审查与无关评论 | [arXiv:2412.18531](https://arxiv.org/abs/2412.18531) |
| Meta MetaMateCR（2025，预印本） | ActionableToApplied 19.7%；展示补丁使审查慢 >5% | [arXiv:2507.13499](https://arxiv.org/abs/2507.13499) |
| Atlassian RovoDev（ICSE-SEIP'26） | 38.70% 评论被解决，PR 周期 −30.8% | [DOI 10.1145/3786583.3786851](https://doi.org/10.1145/3786583.3786851) |
| ByteDance BitsAI-CR（FSE Companion'25） | 75.0% 精度；Go 语言评论过期率 26.7% | [DOI 10.1145/3696630.3728552](https://doi.org/10.1145/3696630.3728552) |
| *Go Home Copilot, You're Drunk*（2026） | 54,791 条 agent 评论 / 342 仓库；解决率 Copilot 72.9%、Cursor ~67%、Codex ~53%；>72% 驳回源于"有意设计决策" | [arXiv:2607.21997](https://arxiv.org/abs/2607.21997) |
| Olausson et al., *Is Self-Repair a Silver Bullet for Code Generation?*（ICLR 2024） | 自修复收益取决于模型自身能力——支撑"reviewer 强于 writer 才有效" | [arXiv:2306.09896](https://arxiv.org/abs/2306.09896) |
| Smit et al.（2024） | 多智能体辩论**当前形式不能可靠优于** self-consistency/多路径集成，且对超参极敏感 | [arXiv:2311.17371](https://arxiv.org/abs/2311.17371) |
| Chen et al.（2024） | 随 LM 调用数增加，Vote / Filter-Vote 性能**先升后降**（非单调） | [arXiv:2403.02419](https://arxiv.org/abs/2403.02419) |
| Kim et al.（ICML 2025） | 350+ 模型错误高度相关（双错时 60% 一致）；越强的模型错误相关性越高，**跨厂商亦然** | [arXiv:2506.07962](https://arxiv.org/abs/2506.07962) |
| X-MAS（2025） | 反向证据：27 模型 / 1.7M 评测，同构→异构 MAS 免改结构可提分（MATH +8.4%、AIME +47%） | [arXiv:2505.16997](https://arxiv.org/abs/2505.16997) |
| Sadowski et al., *Modern Code Review: A Case Study at Google*（ICSE-SEIP 2018） | 12 访谈 + 44 问卷 + **900 万**变更日志；Google 审查实践的实证刻画 | [DOI 10.1145/3183519.3183525](https://doi.org/10.1145/3183519.3183525) |
| Bacchelli & Bird, *Expectations, Outcomes, and Challenges of Modern Code Review*（ICSE 2013） | 缺陷发现是 44% 管理者/44% 程序员的首要动机，但"缺陷"类评论**仅列第四（14%，78/570）**，"代码改进"最多（29%）；**91%** 认为熟悉陌生代码耗时是挑战 | [DOI 10.1109/ICSE.2013.6606617](https://doi.org/10.1109/ICSE.2013.6606617) |
| Bosu, Greiler & Bird, *Characteristics of Useful Code Reviews*（MSR 2015） | 149 万条评论 / 19 万 review requests；**有用密度 65.5%**（63–69% 跨项目稳定）；熟悉该文件者 71–74% vs 首次 32–37%；一行内触发修改者 88%；带 "Won't fix" 的 **92% 无用** | [DOI 10.1109/MSR.2015.21](https://doi.org/10.1109/msr.2015.21) / [PDF](http://cabird.com/pubs/bosu2015useful.pdf) |
| Beller et al., *Modern code reviews in open-source projects: which problems do they fix?*（MSR 2014） | 可维护性:功能性 ≈ **75:25**；**7–35% 评论被丢弃**；接受率 ConQAT 93%/91% vs **GROMACS 65%**；最常见为代码注释（20%）与标识符（10%） | [DOI 10.1145/2597073.2597082](https://doi.org/10.1145/2597073.2597082) |
| Pascarella et al., *Information Needs in Contemporary Code Review*（CSCW 2018） | 审查者的信息需求；上下文缺失是主要障碍 | [DOI 10.1145/3274404](https://doi.org/10.1145/3274404) |
| Badampudi et al., *Modern Code Reviews—Survey of Literature and Practice*（TOSEM 2023） | 现代代码审查的系统性综述 | [DOI 10.1145/3585004](https://doi.org/10.1145/3585004) |
| Wataoka et al., *Self-Preference Bias in LLM-as-a-Judge*（arXiv:2410.21819） | GPT-4 自偏好 **0.520**（recall 0.945 vs 0.425），DP 口径 0.749；GPT-3.5 仅 0.191，dolly/stablelm 为负；**归因于困惑度**（与是否自生成无关） | [arXiv:2410.21819](https://arxiv.org/abs/2410.21819) / [OpenReview](https://openreview.net/forum?id=Ns8zGZ0lmM) |
| Panickssery et al., *LLM Evaluators Recognize and Favor Their Own Generations*（NeurIPS 2024） | 自识别能力与自偏好**线性相关**（τ 0.41→0.74/0.82；GPT-4 识别自身摘要 0.71 vs 随机 0.5）；与上条**机理不一致** | [arXiv:2404.13076](https://arxiv.org/abs/2404.13076) / [NeurIPS](https://neurips.cc/virtual/2024/poster/96672) |
| Ashiga et al., *Ensemble Learning for LLMs*（IEEE TAI，**综述**） | 七类集成方法的分类学；非新一手实验 | [arXiv:2503.13505](https://arxiv.org/html/2503.13505v3) |
| *Beyond Detection: Evidence-based Multi-Agent Debate* | MAD 的价值偏向"提供可核查推理"而非单纯提升判定率 | [arXiv:2511.07267](https://arxiv.org/pdf/2511.07267) |
| 代码检查 vs TDD 的缺陷削减收益（IEEE TSE 2012） | 代码检查比 TDD 更有效，但成本也更高；摘要层面仅定性结论 | [IEEE CSDL](https://www.computer.org/csdl/journal/ts/2012/03/tts2012030547/13rRUwdIOTO) |

**易混淆、不可相互替代的文献**：`CodeReviewer`（[arXiv:2203.09095](https://arxiv.org/abs/2203.09095)）是模型+数据集论文，**不是**落地接受率研究；`TestGen-LLM`（[arXiv:2402.09171](https://arxiv.org/abs/2402.09171)）是测试生成，**不是**代码审查；GitHub Copilot 补全的 33%/20% 接受率**不能**当作 review 评论接受率。

---

## 9. 面向"有证据门槛但不阻断推进"的落地建议

### 建议 A：把审查产出拆成三段互不耦合的记录

`observation`（事实，机器采集）→ `finding`（判定 + severity + 证据引用 + spec 条目映射）→ `disposition`（`fixed` / `accepted-risk` / `deferred` / `rejected`）。

- 段与段之间不互相阻断；每段可有独立的 `unknown` / `unavailable` / `incomplete` 状态。
- **缺失只约束"能否宣称完成"，不约束"能否继续"。** 这与 Spec Kit 的 "Missing verification is not a successful fix" 和 NASA 的 TBR 机制同构。
- 已有事实（provenance、原始 review 事实、失败事实）必须保留，不被摘要覆盖——这与"事实不是许可证"的项目宪法一致。

### 建议 B：evidence threshold 的最小定义 + 窄阻断集

- **门槛（进入"必须响应"队列）**：同时满足 ① 可复现的最小命令或精确代码位置；② 映射到 spec/plan 的某个可追踪条目；③ 严重性判定依据。三者缺一 → 进入"记录但不要求响应"队列。
- **阻断仅限三条件同时成立**：不可逆动作 ∧ 高错误成本类别（安全/隐私/客户数据/公共接口）∧ 证据缺失。其余一律 advisory。
- **"留痕放行"应是一等状态**：对标 GitHub required check 的三态通过（`successful` / `skipped` / **`neutral`**），审查结论应有明确的"中性=有内容但不阻断"语义，而不是被迫在"通过/失败"之间二选一。
- **带风险推进必须显式化**：`accepted-risk` 记录必须含 owner + 理由 + 到期或复审条件（安全领域的成型做法）。可直接借用 FedRAMP POA&M 的默认时限结构（Critical/High 30 天、Moderate 90 天、Low 180 天）作为起点，并规定到期未复审即重新进入可见队列（[FedRAMP](https://www.fedramp.gov/legacy/playbook/csp/authorization/poam/)；[NASA NPR 8000.4C](https://nodis3.gsfc.nasa.gov/displayDir.cfm?Internal_ID=N_PR_8000_004C_&page_name=Chapter2) 的具名角色模型）。
- **自建"永不抑制"硬底线**：行业里没有任何工具提供 confidence 阈值配置（§2.2），所以"哪些证据永远必须记录"必须由我们显式定义。可直接照抄 Greptile 的类别集合作为起点：安全漏洞、内存泄漏、死循环、空指针、用户输入校验缺失——**这些类别的 finding 不允许被任何降噪规则压制**。
- **降噪动作本身要可审计**：被抑制/被忽略的内容必须能列出（对标 CodeRabbit 的 `review_details` 会列出 suppressed comments），否则"不阻断"会退化成"看不见"。

### 建议 C：分级 → 处置矩阵 + 校准回路

- 采纳 §5.2 的矩阵；核心规则是**严重性与阻断性正交**，阻断性靠显式声明（等价于 Conventional Comments 的 `(blocking)` / `(non-blocking)` decoration）而非级别推导。
- **高严重性必须绑定更强的证据要求**（`blocker` 必须附可复现命令/失败用例），因为实测中 high 级误报率可高于 critical。
- **必须建立误报反馈回路**：记录每个 severity 的 rejected/false-positive 率并定期重校准；把被证伪的模式沉淀为不再重复的规则（Learnings / custom standards / rules & exclusions 的行业对应物）。

### 建议 D：审查预算按"错误成本"分配

- 单次审查设上限（对标 Google：约 400 LOC / 60 分钟；超阈值改为抽样或分层审查——SmartBear 实测抽查 20–33% 即可降低缺陷密度）。
- **明确把"审查轮次"当成本项**：同一 finding 只报告一次，后续只更新处置状态，避免 5–6 轮 review 循环带来的通胀。
- **多模型/多审查者的默认配置是 1 个主审查者 + 1 个异构补充审查者**；实测显示 finding 集合高度互补（93.4% solo），但收益取决于审查者相对生产者的能力（reviewer 弱于 writer 时可能为负），且"厂商不同 ≠ 错误独立"（错误相关性在强模型间更高）。这是可证伪的配置，应在自有代码库上用 [pr-review-bench](https://github.com/vlad-ko/pr-review-bench) 这类开源口径自测，而不是采信厂商宣称的数字。
- **不要用"审查者数量"当质量指标**，而用"每个 finding 的处置率"与"误报率"。

---

## 10. 证据不足或被证伪的流行说法

| 说法 | 状态 | 依据 |
|---|---|---|
| "AI 审查工具默认会卡住合并" | **与官方文档相反**：核对 5 个工具（CodeRabbit / Bugbot / Copilot / Graphite / Greptile）**全部默认 advisory**，阻断都需要显式开启（CodeRabbit `request_changes_workflow: true`；Bugbot fail-on-unresolved-issues）；Copilot 官方把"block merge until all comments addressed"列为**不支持** | §2.2 各官方文档 |
| "不同厂商模型交叉审查必然更好" | **被部分证伪**：收益方向不对称，Codex 审 Claude 显著为负（−8.6pp）；同模型自审也可能有正收益（+12.9pp） | [arXiv:2607.21656](https://arxiv.org/abs/2607.21656) |
| "换个厂商就拿到独立意见" | **被强烈削弱**：350+ 模型评测显示错误高度相关（双错时 60% 一致），**越强的模型错误相关性越高，跨厂商亦然** | [arXiv:2506.07962](https://arxiv.org/abs/2506.07962) |
| "多模型辩论/集成必然优于单模型" | **被证伪**：MAD 当前形式不能可靠优于 self-consistency，且对超参极敏感；调用数增加时性能**先升后降**（非单调） | [arXiv:2311.17371](https://arxiv.org/abs/2311.17371)；[arXiv:2403.02419](https://arxiv.org/abs/2403.02419) |
| "同源模型集成收益递减" | **未找到专门量化论文**（只有错误相关性与调用数非单调两个邻近证据，不等于直接测量） | 本次调研未获取 |
| "审查者越多越好" | **证据不支持**：finding 互补但成本/延迟上升；冗余审查可零收益 +72% 成本 | 同上；[dev.to 实测](https://dev.to/_vjk/best-ai-code-reviewer-in-2026-we-ran-4-in-parallel-for-3-weeks-146-prs-679-findings-1c0f) |
| "高严重性 finding 更可信" | **被数据反对**：某工具 high 级误报 15%，critical 级 0% | 同上（dev.to） |
| "AI 审查能显著减少审查工作量" | **证据混合**：Google A/B 实验中审查时长与迭代次数**无统计显著变化**；Meta 报告展示补丁使审查**慢 >5%**；Cihan et al. 报告 PR 关闭时长 5h52m→8h20m | [AIware'24](https://doi.org/10.1145/3664646.3665664)；[arXiv:2507.13499](https://arxiv.org/abs/2507.13499)；[arXiv:2412.18531](https://arxiv.org/abs/2412.18531) |
| "厂商公布的准确率/误报率" | **多为自述，缺独立复现**：CodeRabbit 引用的 Martian Bench（F1 51.2% / precision 49.2% / recall 53.5%）由其自己发布；Greptile 的 82% catch rate 出自**自家 benchmark 页**；Microsoft ">90% PR"仅见 devblog、无精度指标；**Amazon CodeGuru Reviewer 与 GitHub Copilot code review 未找到同行评审的接受率/精度研究** | [CodeRabbit](https://www.coderabbit.ai/blog/coderabbit-tops-martian-code-review-benchmark)；[Greptile](https://www.greptile.com/benchmarks)；本次调研 |
| "审查评论越多越好" | **被数据反对**：LLM 评论 60–70% 未被解决；厂商自认 acceptance < ~50% 即噪音；AI 审查解决率整体落在 **20–75%** 区间 | [arXiv:2510.05450](https://arxiv.org/html/2510.05450v1)；[CodeRabbit](https://www.coderabbit.ai/blog/measuring-what-matters-in-the-age-of-ai-assisted-development) |
| "正式评审会议是设计审查的必要形态" | **被一手实践反对**：Google 明确称其为开销陷阱，建议直接取最关键意见、不阻塞更广范围的评审 | [industrialempathy](https://www.industrialempathy.com/posts/design-docs-at-google/) |
| "有 quality gate 才能保证质量" | **未找到支持性一手证据**；相反，Google/Amazon 的成文规则都指向"门槛判定改善而非完美"与"70% 信息即走"；DORA 更明确"没有证据支持更正式的外部评审带来更低 change failure rate" | [Google](https://google.github.io/eng-practices/review/reviewer/standard.html)；[AWS](https://aws.amazon.com/executive-insights/content/how-amazon-defines-and-operationalizes-a-day-1-culture/)；[DORA](https://dora.dev/capabilities/streamlining-change-approval/) |
| "加更多审批/流程能提升稳定性" | **被 DORA 反向证伪**："用更多流程回应稳定性问题会让事情更糟"；change failure rate 是**滞后指标**，适合做事后度量而非事前门 | [DORA metrics](https://dora.dev/guides/dora-metrics/) |
| "闸门阻塞会造成可量化的效率损失" | **证据缺口**：未能找到工程领域的一手量化数据，仅有 DORA 的定性结论；引用任何具体百分比都属未证实 | 本次调研未获取 |
| "CVSS/严重性高分意味着必须优先修" | **被 CISA 的政策选择反证**：<4% 的 CVE 曾被公开利用；CISA 按"是否已在野利用"而非分数分配修复时限 | [CISA BOD 22-01](https://www.cisa.gov/news-events/directives/bod-22-01-reducing-significant-risk-known-exploited-vulnerabilities-revoked) |

---

## 11. 可直接使用的审查清单（plan/spec 审查版）

综合 Google design doc 结构、Google code review 清单、Amazon PR/FAQ 7 问与 Internal FAQ、Spec Kit 阶段产物、IEEE 830 / ISO 29148 / NASA Appendix C，压缩成一份**可判定**的清单。每条都要求给出"判定规则 / 反例 / 证据链接"三项中的前三列。

| # | 检查项 | 判定规则 | 不合格的反例 | 证据 |
|---|---|---|---|---|
| A1 | **问题定义清晰** | 能用一句话描述"谁、在什么场景、遇到什么问题" | 只有方案没有客户/问题；"提升体验"之类无对象描述 | 需求原文链接 |
| A2 | **目标与非目标明确** | goals 与 non-goals 都列出；non-goals 是"本可以但不是目标"的项 | 只有 goals；non-goals 写成"系统不应崩溃" | spec 章节链接 |
| A3 | **备选方案与被否理由** | 至少 2 个备选；每个给出权衡与被否原因 | 只有唯一方案，无权衡讨论 | design 文档 |
| A4 | **假设显式化** | 每条关键假设单独列出，并标注"若为假会怎样" | 假设隐含在方案描述里 | 列出假设清单 |
| A5 | **失败原因前三** | 明确写出最可能导致失败的 3 个原因 | 无风险章节，或只写"风险可控" | Amazon Internal FAQ 要求 |
| A6 | **可验证性** | 每条需求可用 test / demonstrate / inspect / analyze 之一验证；给出验证方式 | 出现 NASA 不可验证词：flexible / easy / sufficient / robust / quickly / user-friendly / appropriate / etc. | [NASA C.4](https://www.nasa.gov/reference/appendix-c-how-to-write-a-good-requirement/) |
| A7 | **无歧义** | 一句一需求；一个主语一个谓语；无模糊代词与 and/or | "系统应尽可能快地处理数据并保持稳定" | NASA C.4 Clarity |
| A8 | **可追踪** | 每条需求有唯一编号，且双向可追溯到上层目标 | 需求不可编号、无法映射到目标 | IEEE 830 traceable |
| A9 | **完整性（含 TBR）** | 未知项不写 TBD，写"最佳估计 + TBR + 消除责任人 + 期限" | 大量 TBD 无归属、无期限 | NASA C.3 |
| A10 | **free of implementation** | 只描述 What，不描述 How | 需求里写死具体库/表结构/算法 | NASA C.2 Compliance |
| A11 | **跨切面覆盖** | 安全、隐私、数据、可观测性、失败恢复各自有明确结论 | 完全未提及其中任一项 | Google cross-cutting concerns |
| A12 | **可逆性判定** | 标注该决策是"单向门"还是"双向门"；双向门不要求完整证据 | 对可逆决策要求完整论证后再动 | [AWS Day 1](https://aws.amazon.com/executive-insights/content/how-amazon-defines-and-operationalizes-a-day-1-culture/) |
| A13 | **范围界定** | 明确本次不审什么（如生成代码、数据文件、超阈值变更） | 无边界，审查者被迫逐行读自动生成物 | Graphite 的 200k 字符上限即此类 |
| A14 | **验证缺口显式化** | 未验证的部分必须标为 `partial` / `unverified`，不得记为通过 | 把"没跑测试"当作"测试通过" | Spec Kit: "Missing verification is not a successful fix" |

**使用规则**：A1–A5 在 spec/plan 定稿前检查一次；A6–A11 在实现前检查一次；A12–A14 在每次"推进决定"时检查。**任何一项不合格都只产生一条 finding（带证据），不产生阻断**——阻断只发生在 §4.4 的三条件窄集合上。

---

## 12. 参考链接汇总

**官方文档 / 一手实践**
- Google eng-practices：[The Standard of Code Review](https://google.github.io/eng-practices/review/reviewer/standard.html)｜[What to look for in a code review](https://google.github.io/eng-practices/review/reviewer/looking-for.html)｜[Small CLs](https://google.github.io/eng-practices/review/developer/small-cls.html)
- [Design Docs at Google](https://www.industrialempathy.com/posts/design-docs-at-google/)
- Amazon：[Working Backwards PR/FAQ](https://workingbackwards.com/concepts/working-backwards-pr-faq-process/)｜[Elements of Amazon's Day 1 Culture](https://aws.amazon.com/executive-insights/content/how-amazon-defines-and-operationalizes-a-day-1-culture/)｜[AWS Operational Readiness Reviews (ORR)](https://docs.aws.amazon.com/wellarchitected/latest/operational-readiness-reviews/operational-readiness-reviews.pdf)
- [Google SRE — Production Readiness Review](https://sre.google/sre-book/evolving-sre-engagement-model/)
- [github/spec-kit（Spec-Driven Development）](https://github.com/github/spec-kit)
- [Conventional Comments](https://conventionalcomments.org/)
- [AI code review 工具](https://docs.coderabbit.ai/guides/code-review-overview)｜[CodeRabbit Learnings](https://docs.coderabbit.ai/knowledge-base/learnings)｜[Graphite AI review comments](https://graphite.com/docs/ai-review-comments)｜[Greptile Custom Standards](https://www.greptile.com/docs/code-review/custom-standards)｜[Cursor Bugbot](https://cursor.com/docs/bugbot)｜[GitHub Copilot code review](https://docs.github.com/copilot/using-github-copilot/code-review/using-copilot-code-review)
- AI 工具的分级与阻断开关（§2.2 一手来源）：[CodeRabbit Change Stack findings](https://docs.coderabbit.ai/change-stack/findings)｜[CodeRabbit request-changes-workflow](https://docs.coderabbit.ai/pr-reviews/request-changes-workflow)｜[Greptile First PR review（P0/P1/P2 + Confidence Score）](https://www.greptile.com/docs/code-review/first-pr-review)｜[Greptile 配置参考（永不抑制清单 / strictness / 学习系统）](https://www.greptile.com/docs/code-review/greptile-config-reference)｜[Copilot：请求代码审查（High/Medium/Low）](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/request-a-code-review/use-code-review)
- 厂商自述的精度数字（**非独立评测**）：[CodeRabbit 引用 Martian Bench](https://www.coderabbit.ai/blog/coderabbit-tops-martian-code-review-benchmark)｜[Greptile 自家 benchmark（82% catch rate）](https://www.greptile.com/benchmarks)
- 规格质量：[IEEE 830-1998](https://standards.ieee.org/standard/830-1998.html)｜[ISO/IEC/IEEE 29148:2018](https://www.iso.org/obp/ui/#iso:std:iso-iec-ieee:29148:ed-2:v1:en)｜[NASA Appendix C](https://www.nasa.gov/reference/appendix-c-how-to-write-a-good-requirement/)｜[NASA Appendix N — Technical Peer Reviews/Inspections](https://www.nasa.gov/seh/appendix-n-guidance-on-technical)
- 经济性：[SmartBear Best Practices for Code Review](https://smartbear.com/learn/code-review/best-practices-for-peer-code-review/)｜[DX: What are code reviews even for?](https://newsletter.getdx.com/p/what-are-code-reviews-even-for)｜[CodeRabbit: Measuring what matters](https://www.coderabbit.ai/blog/measuring-what-matters-in-the-age-of-ai-assisted-development)｜[CodeRabbit: A software factory needs a review gate it can trust](https://www.coderabbit.ai/blog/software-factory-review-gate)
- 不阻断与风险接受：[Google SRE Error Budget Policy](https://sre.google/workbook/error-budget-policy/)｜[Google SRE — Production Readiness Review](https://sre.google/sre-book/evolving-sre-engagement-model/)｜[DORA metrics](https://dora.dev/guides/dora-metrics/)｜[DORA — Streamlining change approval](https://dora.dev/capabilities/streamlining-change-approval/)｜[NASA NPR 8000.4C Ch.2](https://nodis3.gsfc.nasa.gov/displayDir.cfm?Internal_ID=N_PR_8000_004C_&page_name=Chapter2)｜[FedRAMP POA&M](https://www.fedramp.gov/legacy/playbook/csp/authorization/poam/)｜[OWASP Risk Rating Methodology](https://community.owasp.org/OWASP_Risk_Rating_Methodology)｜[MSRC Bug Bar](https://www.microsoft.com/en-us/msrc/sdlbugbar)｜[CISA BOD 22-01 (KEV)](https://www.cisa.gov/news-events/directives/bod-22-01-reducing-significant-risk-known-exploited-vulnerabilities-revoked)
- 项目级 review 政策：[LLVM Code Review](https://llvm.org/docs/CodeReview.html)｜[Chromium code_reviews](https://chromium.googlesource.com/chromium/src/+/main/docs/code_reviews.md)｜[Kubernetes pull requests](https://www.kubernetes.dev/docs/guide/pull-requests/)｜[Mozilla Code Review FAQ (archive)](https://www-archive.mozilla.org/hacking/code-review-faq)
- 第三方实测：[4 AI reviewers, 146 PRs, 679 findings](https://dev.to/_vjk/best-ai-code-reviewer-in-2026-we-ran-4-in-parallel-for-3-weeks-146-prs-679-findings-1c0f)｜[pr-review-bench 数据集](https://github.com/vlad-ko/pr-review-bench)

**学术**
- [arXiv:2607.21656 Cross-Model LLM Code Review](https://arxiv.org/abs/2607.21656)
- [arXiv:2510.05450 What Types of Code Review Comments Do Developers Most Frequently Resolve?](https://arxiv.org/html/2510.05450v1)
- [DOI 10.1145/3183519.3183525 Modern code review (Sadowski et al.)](https://doi.org/10.1145/3183519.3183525)
- [DOI 10.1109/MSR.2015.21 Characteristics of Useful Code Reviews](https://doi.org/10.1109/msr.2015.21)
- [DOI 10.1145/2597073.2597082 Modern code reviews in open-source projects](https://doi.org/10.1145/2597073.2597082)
- [DOI 10.1145/3274404 Information Needs in Contemporary Code Review](https://doi.org/10.1145/3274404)
- [DOI 10.1145/3585004 Modern Code Reviews—Survey of Literature and Practice](https://doi.org/10.1145/3585004)
- [DOI 10.1145/3664646.3665664 AI-Assisted Assessment of Coding Practices](https://doi.org/10.1145/3664646.3665664)
- [Self-Preference Bias in LLM-as-a-Judge（arXiv:2410.21819）](https://arxiv.org/abs/2410.21819)｜[OpenReview](https://openreview.net/forum?id=Ns8zGZ0lmM)｜[NeurIPS 2024: LLM Evaluators Recognize and Favor Their Own Generations（arXiv:2404.13076）](https://arxiv.org/abs/2404.13076)
- [arXiv:2311.17371 Multi-agent debate vs self-consistency](https://arxiv.org/abs/2311.17371)｜[arXiv:2403.02419 调用数非单调](https://arxiv.org/abs/2403.02419)｜[arXiv:2506.07962 错误相关性](https://arxiv.org/abs/2506.07962)｜[arXiv:2505.16997 X-MAS 异构 MAS](https://arxiv.org/abs/2505.16997)｜[arXiv:2306.09896 Self-Repair Silver Bullet](https://arxiv.org/abs/2306.09896)
- [arXiv:2503.13505 Ensemble Learning for LLMs（综述）](https://arxiv.org/html/2503.13505v3)｜[arXiv:2511.07267 Evidence-based Multi-Agent Debate](https://arxiv.org/pdf/2511.07267)
- [arXiv:2602.11925 — LLM 生成的审查评论与人工评论匹配度（ICPC'26）](https://arxiv.org/html/2602.11925v1)
- AI 审查工业实测：[Google AutoCommenter (AIware'24)](https://doi.org/10.1145/3664646.3665664)｜[Meta MetaMateCR (arXiv:2507.13499)](https://arxiv.org/abs/2507.13499)｜[Atlassian RovoDev (ICSE-SEIP'26)](https://doi.org/10.1145/3786583.3786851)｜[ByteDance BitsAI-CR (FSE Companion'25)](https://doi.org/10.1145/3696630.3728552)｜[Cihan et al. (ICSE 2025 SEIP, arXiv:2412.18531)](https://arxiv.org/abs/2412.18531)｜[Go Home Copilot, You're Drunk (arXiv:2607.21997)](https://arxiv.org/abs/2607.21997)
- 易混淆（本次不作为审查接受率证据）：[CodeReviewer (arXiv:2203.09095)](https://arxiv.org/abs/2203.09095)｜[TestGen-LLM (arXiv:2402.09171)](https://arxiv.org/abs/2402.09171)
- [NBER w35275 Writing Code vs. Shipping Code](https://www.nber.org/papers/w35275)
