# 让 AI agent 真的能高质量执行：外部做法与我们的落点

> 来源·产出：card-03 落地流程派发的只读调研子代理（外部调研 / 仓内审计；未改仓库任何文件）
> 来源·时间：2026-09-29 20:27（本机 CST，文件 mtime）
> 来源·支撑：支撑 decision-log §18 E10/E12（续跑先对现实；进展＝交付锚不是动作次数）

只读调研，产出于 `/tmp/pb-audit/`。检索 14 次全部走 `engine: anysearch`，0 次回退。
`⌂ = /Users/Hugh/Hugh/Project/workflowhub`（仓内只读）。
四个落点：`⌂/workflows/build-plan/SKILL.md`、`⌂/workflows/build-code/SKILL.md`、`⌂/skills/spec-plan/templates/phase-template.md`、`⌂/docs/standard-workflow.md`。
已排除 card-03 worktree 已落地机制（M1 三选一、M2 收尾三件事、M3「变了没有」判据、M5 销毁性动作、AC 三词读法）。
**所有「最小改法」均为既有行内的措辞收紧：不新增门禁、字段、schema、确认点、阈值。**

## 1. 做法对照表

| # | 做法 | 外部依据（谁 + URL + 类别） | 防的事故形态 | 落点 | 最小改法（拟改文本） | 多问用户? |
|---|---|---|---|---|---|---|
| 1 | 完成判据开工前就写在外部，且必须是**别人能重放**的检查，不是「我的产物写完了」 | AddyOsmani《Long-running Agents》「Write down the done-condition before the agent starts… so the agent can't quietly redefine done mid-run」 https://addyosmani.com/blog/long-running-agents/ （工程博客，已读全文）；Anthropic《Effective harnesses for long-running agents》 https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents （官方，未直取） | 17 条验收标准 578 deferred、无一条真达成；stage 判据＝产物写完 | `⌂/skills/spec-plan/templates/phase-template.md:23`、`:48` 的 `Done` 行 | `Done` 措辞收紧为「**没参与实现的人能用一条命令重放**的证据；写不出可重放判据的 AC 计入未达成（沿用既有取值），不得记为达成」 | 不会 |
| 2 | 生成与评估分离，且**完成声明的上限＝独立来源的结论** | Anthropic《Building effective agents》evaluator-optimizer 模式 https://www.anthropic.com/engineering/building-effective-agents （官方）；AddyOsmani 同前「models reliably skew positive when they grade their own work… ships at 30% complete with full confidence」 | 代理自述完成；578 deferred 被当成进展 | `⌂/docs/standard-workflow.md:304-307`（build-code 产物/完成边界） | 加一句「**完成声明的上限由独立来源的结论决定**；独立审查 adverse 或 unavailable 时只能声明到该结论允许的程度，其余如实留在失败事实清单」（与该段既有「adverse fact 不阻断同任务修复」并存） | 不会 |
| 3 | 长任务的真实状态活在**对话外**；重入先「对现实」再选活 | Manus《Context Engineering for AI Agents》「treat the file system as the ultimate context」 https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus （一手工程博客）；Anthropic《Effective context engineering for AI agents》 https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents （官方，未直取）；AddyOsmani 同前 checkpoint-and-resume | 194 文件/1474 处被 `git restore` 清空后无人知；50 小时无人发现 | `⌂/workflows/build-code/SKILL.md` 的 `read-current-task-documents` 步骤旁（`steps.json` 第 1 步） | 加一句「续跑或新 session 开头先跑一次能证明 worktree 真实状态的命令（`git status --short` ＋ 本 Phase 的 `gate_cmd` 当前输出），据此宣布『我现在站在哪里』再选下一个未完成 Task；材料与真实代码不一致时以代码为准并如实登记」 | 不会 |
| 4 | 失败信号必须被**读成结论**，不是被记成日志 | Arize《Agent observability》 https://arize.com/guides/ai-agent-handbook/agent-observability/ （厂商指南）；Anthropic《Writing effective tools for AI agents》 https://www.anthropic.com/engineering/writing-tools-for-agents （官方：工具返回要让模型看得出成/败） | 44.5% 工具输出带失败标记却无人处置 | `⌂/workflows/build-code/SKILL.md` 既有六段大白话摘要的 remaining risks 段；`⌂/docs/standard-workflow.md:302-307` | 要求该段必须有一条对**本 Phase 期间出现过的失败信号**的成句解读（「这些信号意味着什么、下一步做什么」）；「这次没有失败信号」是唯一允许的空态写法 | 不会 |
| 5 | 进展信号＝交付锚，不是动作数；拿不出外部锚就按既有卡住判据走 | Cursor《Scaling long-running autonomous coding》「work churning for long periods of time without progress」 https://cursor.com/blog/scaling-agents （厂商研究博客，已读全文）；AddyOsmani 同前「commit progress every meaningful unit of work」 | 101.9 小时 / 18,658 次工具调用 / 0 次提交；「忙」冒充「有进展」 | `⌂/workflows/build-code/SKILL.md:352-357`（M2 已落地三件事旁） | 补一句「一个 Task 结束后拿不出任何**新的外部锚**（一次提交或一份新证据）时，按同文件 `:272-275` 的既有判据处理：自述『自上次以来我改了什么』，写不出即停下报告人」——**不引入次数或时长阈值**，沿用 M3 已声明的「不设阈值」 | 仅在既有卡住判据触发时（同现状） |
| 6 | 上下文接近用满时，正确动作是**结构化交接 + 新上下文重开**，不是继续压缩 | Chroma《Context Rot》 https://www.trychroma.com/research/context-rot （技术报告）；AddyOsmani 同前「treat compaction and context resets as first-class… summarization-as-compaction wasn't enough」 | 长 Phase 中质量随上下文退化；「当前真实状态」多来源互相覆盖 | `⌂/docs/standard-workflow.md:56-93`（通用执行合同） | 加一句「上下文接近用满时写一份交接（当前 Outcome/Task/Done 判据、真实 changed files、最近证据路径、未消化的失败信号），用新上下文从交接重开；交接以工作区事实为准，不复制旧摘要」 | 不会 |
| 7 | 问人只问四类：不可逆 / 方向歧义 / 确实卡住 / 验收边界 | OpenAI《A practical guide to building agents》 https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/ （官方）；Claude Code worktrees 官方文档 https://code.claude.com/docs/en/worktrees | 50 小时无人发现；用户最后才发现代理还在跑 | `⌂/docs/standard-workflow.md` build-plan→build-code 衔接；`⌂/workflows/build-plan/SKILL.md:143-146`（M1 已落地三选一） | 不新增确认点，只在既有「报告给人」处写明这四类何时算数，其余默认自主 | 这条本身不新增；只把已有问法收敛 |
| 8 | 并行/多 session 用独立 worktree；同一路径任何时刻只有一个活跃写者 | Claude Code 官方文档 https://code.claude.com/docs/en/worktrees ；Cursor 同前（每 agent 独立 worktree，PR 合回） | 反复改同一文件 1738 次 patch | `⌂/skills/spec-plan/templates/phase-template.md:4` 的 `Write set` 行 | 既有「one owner per path」补一句「同一路径任何时刻只能有一个活跃写者；需要第二个写者时先交接写权，不并行改」 | 不会 |
| 9 | 长跑要有可观察的消耗事实，而不是无声地烧 | AddyOsmani 同前「without budgets, circuit breakers, and a hard cap on tool spend, an agent can quietly burn through a week's API budget」；arXiv《When Agents Do Not Stop: Uncovering Infinite Agentic Loops》 https://arxiv.org/html/2607.01641v1 （预印本） | 101.9 小时无人发现 | `⌂/workflows/build-code/SKILL.md` 阶段事实段与六段摘要的 current stage work | 把「本阶段已运行的动作数/耗时」如实写下并在摘要里成句读出（**只读事实，不做阻断、不设阈值**） | 不会 |
| 10 | 计划形态 planner→worker→judge；依赖写的是**真实产物**不是编号关系 | Cursor 同前（planners/workers/judges；判官决定一轮是否结束）；Anthropic《Building effective agents》orchestrator-workers；arXiv《Task-Decoupled Planning for Long-Horizon Agents》DAG 子目标 https://arxiv.org/html/2601.07577v1 （预印本） | 计划与实现脱节、验收悬空 | `⌂/workflows/build-plan/SKILL.md`；`⌂/skills/spec-plan/templates/phase-template.md:5` 的 `Dependency` 行 | 不动 DAG 契约，补一句「`Dependency` 写的是**前置 Task 的真实产物**（文件/接口/证据），不是 Task 编号关系；前置产物不存在时该 Task 不成立」 | 不会 |
| 11 | 计划里的「参考性内容」必须可删掉而不改变合同 | Cursor 同前「The right amount of structure is somewhere in the middle… Too much structure creates fragility」；Anthropic《Effective context engineering》「smallest set of high-signal tokens」 | 超详细伪代码写死后，实现一偏离就全盘失焦 | `⌂/skills/spec-plan/templates/phase-template.md:54-56`（L2） | L2 已存在，只需在 L1 里明确「凡不影响 oracle 判定的实现细节一律下沉 L2」 | 不会 |

## 2. 人机分工

**必须由人做的决定（4 类）**
1. 不可逆/销毁性动作的授权（既有 F7、M5 边界内）。
2. 方向改变：需求歧义两种解读都成立、且无法从材料判定 → 回 `make-decision`，由人定。
3. 验收边界的改变：把 AC 记为退役、或修改冻结的测试断言——等于改「现实对上」的判据本身。
4. 资源继续投入：已无外部锚、写不出「改了什么」时，继续/换路/缩小/取消。

**绝不该打扰人的（5 类）**
1. 测试命令与测试层级的选择（有 `test-routing-advisor`）。
2. 文件内部实现细节、命名、格式、目录内布局。
3. review finding 的处置（`fixed` / `rejected_invalid` / `accepted_risk` 已授权自主）。
4. 单个测试红/绿、单次工具失败、单次 provider 失败。
5. 材料结构问题（回上游 stage 修，不问人）与常规推进步骤。

**问人的最小集合（≤5 条，每条一句问法）**
1. 不可逆动作 —「这一步会不可逆地丢掉/覆盖 X，我做还是不做？」
2. 方向歧义 —「材料里 A 和 B 两种解读都成立，选哪个（或回 make-decision）？」
3. 验收边界 —「AC-xxx 目前只能做到 Y，记为未达成／退役／改冻结断言，你要哪个？」
4. 卡住 —「我卡在 X，不能继续的原因是 Y，有三条路（代价…），你选哪条？」
5. 无外部锚 —「这段时间我说不出改了什么（无新提交/新证据），继续、换路还是停？」

## 3. 不该抄

1. **每个 Task 都强制过一遍多层审查。** 反证：Cursor 明确删掉了 integrator 角色——「created more bottlenecks than it solved」，并总结「Many of our improvements came from removing complexity rather than adding it」（https://cursor.com/blog/scaling-agents）。
2. **给 agent 写超详细伪代码、把所有决策预写死进计划。** 反证：Cursor「Too much structure creates fragility」；Anthropic 上下文工程要求「smallest set of high-signal tokens」（https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents）。我们模板自己的 L2「removable reference」就是这个道理，不该反向加厚 L1。
3. **「阶段必须全部通过」当硬门。** 反证：Anthropic 的 harness 必须专门加 test ratchet，把「删改测试以让它变绿」明写为不可接受（https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents）——硬门正是这样被绕过的；Goodhart/规格博弈同样指向这点（https://matthopkins.com/business/goodharts-law-ai-agents/）。
4. **用「有没有漏」的覆盖清单当完成判据。** 反证：578 个 deferred 正是「条目齐了」与「现实对上了」脱钩的产物；厂商侧的观察是同类的——评估必须能说「不达标」，否则只会产出「看起来完成了」（https://www.technologyreview.com/2026/08/03/1141009/heres-why-ai-agents-lie-and-cheat-to-reach-their-goals/）。
5. **用 token 数、工具调用数、时长、改动文件数当进展指标。** 反证：Cursor 描述的 churn（长期无进展的忙碌）与 AddyOsmani 的失控预算烧钱场景；可观测性指南强调的是带成/败语义的 trace，不是计数（https://arize.com/guides/ai-agent-handbook/agent-observability/）。

## 4. 未核实 / 存疑

- **官方文档，可直接引用**：Anthropic《Building effective agents》《Writing effective tools for AI agents》；OpenAI《A practical guide to building agents》；Claude Code worktrees 官方文档；Chroma《Context Rot》（技术报告）。
- **已抓到全文**：AddyOsmani《Long-running Agents》、Cursor《Scaling long-running autonomous coding》。
- **未抓到全文（fetch failed，仅有搜索片段与二手转述，具体措辞存疑、机制层面一致）**：Anthropic《Effective context engineering for AI agents》《Effective harnesses for long-running agents》（后者另有镜像转述 https://businessdatasolutions.github.io/ai-wiki/sources/2025-11-26-anthropic-effective-harnesses-long-running-agents ）、OpenAI practical guide PDF、Google Agents Companion / Agent Quality 白皮书（只见 PDF 镜像 https://github.com/sameeerjadhav/google-agents-resources/blob/main/White%20Papers/4%20Agent%20Quality.pdf ）、Manus 长文（仅搜索摘要）。
- **只有博客/厂商说法，作旁证而非依据**：escalation 设计类文章（https://gptagent.ai/blog/design-your-escalation-rules/ 、https://www.brthls.com/magazine/human-escalation-design-when-to-ask-for-help-en ）、AgentLiar 类「假完成」检测器、Goodhart for agents 评论文章。
- **检索引擎**：14 次 `advanced_search` 全部 `engine: anysearch`，无一次回退；`web_fetch` 对 anthropic.com 三次失败（网络层，非引擎问题）。

Open objectives: 无（本卡为只读调研，交付本文件与给上级的摘要即为完成）。
