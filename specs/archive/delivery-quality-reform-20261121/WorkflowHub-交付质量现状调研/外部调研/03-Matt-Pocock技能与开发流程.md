# Matt Pocock 的技能怎样让意图、实现和审查接起来？

读取日期为 2026-11-20。
默认分支固定于 `abeeaf95660ba9e8b7c753eb38f441ca707a8823`。
GitHub 返回提交时间为 2026-11-19 13:34:58 UTC。
最新发布为 v1.3.2，指向 `d1478fcb140db0b93c0c8df17bcfd311844749d0`，当前主分支插件清单仍声明 1.3.2。
行为以固定提交的 `SKILL.md` 和随附参考为准，AI Hero 作者文档用于解释动机、常见失败与演化。
固定提交本身新增 CI frontmatter 解析检查，能发现安装器会跳过的语法问题，检查覆盖 YAML 及必填字段。
此次做源码和作者资料核对，无插件安装、实际业务任务、跨宿主对照或效率实测。
[固定提交][s1] · [v1.3.2 发布][s2] · [插件清单][s3] · [CI 解析脚本][s4]

## 技能怎样安装、触发和承接项目配置？

主题 1。用户启动主要流程，代理按需调用工程参考和复用方法。

- 这是一组可组合的短技能。
  主要链路由人调用，每个入口负责当前工件，通用参考由模型加载。
  例：`grill-with-docs`、`to-spec`、`to-tickets`、`implement`、`implement-spec`、
  `handoff` 属于手动启动的入口，`grilling`、`domain-modeling`、`tdd`、`diagnosing-bugs`、
  `codebase-design`、`code-review` 可以被模型或人调用。
  Claude Code frontmatter 与 Codex `agents/openai.yaml` 分别声明关闭隐式调用。
  入口可以调用可复用技能，下一手动入口由人选择。
  v1.3 明示依赖时调用 Skill tool，一次只调用一项，修复仅在文字中提及名字导致依赖漏加载的问题。
  [README][s5] · [触发合同][s6] · [Codex 元数据示例][s7] · [v1.3 作者说明][s8]
- README 分别提供 Claude Code 官方插件市场、Codex 和 Copilot 市场、Gemini 分目录安装以及 skills.sh
  的拷贝安装。
  作者说明插件会自动更新，使用 skills.sh 得到可改副本并手动更新，二者同装会重复。
  清单显式列出 `engineering` 和 `productivity` 的 27 项 promoted 技能，`misc`、`in-progress`、
  `deprecated` 有自己的生命周期并排除在正式清单。
  源码 MIT。
  [安装入口][s9] · [分组约定][s10] · [发布清单][s11] · [LICENSE][s12]
- `setup-matt-pocock-skills` 是项目级的可编辑配置向导。
  查 remotes、`CLAUDE.md` / `AGENTS.md`、域文档、`.scratch/`、安装的 `triage`，再确认并写
  `docs/agents/issue-tracker.md`、`domain.md` 及按条件才有的 `triage-labels.md`，根指令只放指针。
  内带 GitHub、GitLab、本地 Markdown 三套模板，其他 tracker 记录用户描述的操作。
  GitHub/GitLab 选定后要用项目读回确认远端可通，GitHub 模板核发票目标，这是实际出现过误发上游仓后的修正。
  五个默认 triage 角色是 `needs-triage`、`needs-info`、`ready-for-agent`、
  `ready-for-human`、`wontfix`。
  GitHub / GitLab 外部 PR / MR 作为请求面的开关默认关。
  [setup-matt-pocock-skills][s13] · [tracker 维护边界][s14] · [GitHub 模板][s15] ·
  [GitLab 模板][s16]

## 怎样问清楚问题并保存长期决定？

主题 2。用连续澄清达成决定，再把长期术语与取舍写回项目。

`grill-with-docs` 入口实际只有一行操作，分别调 `grilling` 与 `domain-modeling`。
提问以设计决策组成带依赖的树，每轮问完所有已满足前置条件的决定，编号并给推荐，等用户回答后重算下一轮。
存在依赖的下一问留到下一轮，用户答“是”应当就能接受推荐。
代理派独立上下文查代码、文件或工具能得出的事实，尚在探查只阻挡依赖该事实的分支，其他问题继续。
用户负责决定，树无开放分支且用户确认形成共识之后才行动。
这里是当前版本的分轮机制，早版“一次一个问题”不代表固定提交的做法。
作者也公开说明不设硬问题上限，低价值重复问属于提问质量问题。
[grill-with-docs][s17] · [grilling][s18] · [提问上限的取舍][s19] · [v1.1 历史说明][s20]

`domain-modeling` 把访谈嵌进长期文档。
发现术语冲突就查词条，发现人与代码说法冲突就举出路径与例子，使用具体边缘场景厘清概念关系，术语定下来立即更新纯定义的 `GLOSSARY.md`。
单语境是根词表与 `docs/adr/`，多语境由根 `GLOSSARY-MAP.md` 导到各语境词表及可选的本地 ADR。
ADR 要同时满足代价较高、未来读代码难懂缘由、存在真实取舍三个条件，简短写背景、决定和理由即可。
当前只读写新命名，历史的 `CONTEXT.md` / `CONTEXT-MAP.md` 自 v1.3 改名，混合版本可能在旧文件旁另建空词表。
普通产品细节、数值、负要求仍留在讨论和后续规格。
[domain-modeling][s21] · [词表格式][s22] · [ADR 格式][s23] · [v1.3 迁移说明][s24]

**已观察失败。** 作者文档记载过依赖只加载一半，表现为问得有条理却没写词表，或嵌在别的编排器里访谈成功、写文件静默缺席。
更深的缺口是普通回答没有逐项关联到 spec、ticket 和验证，排序保证、负要求和默认值可能被下一步概括弱化。
连续保留从访谈到规格的上下文，并回读有决定性的条款，是作者当下的处理建议。
可观察成功是代码能答的问题由代理答，定下的术语逐条入词表，确有长期价值才写 ADR。
[AI Hero 作者说明][s25]

## 确认方向后怎样形成规格和可独立交付的票？

主题 3。规格承载一致的意图，票承载可验证的薄切片和依赖。

| 当前技能 | 输入与处理 | 产物与接续 |
| --- | --- | --- |
| `to-spec` | 已完成讨论、当前代码、领域词表和相关 ADR。综合已有决定，避免另开需求访谈。先画测试切入点（seam，即调用者可以观察行为的位置），优先复用既有且尽可能高的公开位置，数量尽量少，向用户确认 | 向配置的 tracker 发一份 spec，打 `ready-for-agent`。模板含问题、方案、用户故事、实施决定、测试决定、范围外与补充说明。具体文件路径和易陈旧片段通常省去，原型能更精确表达的状态机、schema 或类型形状允许少量内联。[to-spec](https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/to-spec/SKILL.md#L7-L73) |
| `to-tickets` | 接受已有计划、规格或对话。有 issue 编号、URL 或路径先取正文与评论。按垂直行为切片，贯穿这项行为实际需要的层，单票可独立演示或验证，大小能放进一个新上下文。先展示交付行为与真实 blockers，用户确认粒度、依赖、应合并或再拆的票后才发布 | 每票一份工件，含可验收条件和依赖。先发 blocker，远端优先原生依赖，来源是现有 issue 时挂为子 issue，默认标 `ready-for-agent`。本地是 `.scratch/<feature-slug>/issues/<NN>-<slug>.md`，数字为依赖顺序，依赖记在票里。技能本身停在票发布，保留父 issue。[to-tickets](https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/to-tickets/SKILL.md#L13-L105) · [本地 tracker 模板](https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/setup-matt-pocock-skills/issue-tracker-local.md#L3-L19) |
| 宽机械变更例外 | 改列名或共享类型会单次撞到众多调用点、切片无法各自保持绿时，先并存新旧，按包或目录分批迁调用点，最后清旧。各迁移票依赖扩张，删除票依赖全部迁移 | 优先每批 CI 都绿。如果单批仍无法做到，沿同样顺序落集成分支，统一以最终集成验证承诺绿。[to-tickets](https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/to-tickets/SKILL.md#L25-L40) |

版本纠偏。
v1.1 用 `to-spec` 取代 `to-prd`，将 `to-plan` 和 `to-issues` 合为 `to-tickets`。
旧文档曾记录本地单个 `tickets.md`，当前固定版本明确单票单文件，作者说明旧共写文件导致争写。
v1.3.2 已补齐 GitHub sub-issue 做法，依赖首选 GitHub 原生边且区分 issue 编号与 database ID，GitLab
高级档支持原生边、不可用时文本退化。
旧项目模板应先读回版本。
[v1.1 变更说明][s20] · [AI Hero 作者说明][s26] · [GitHub tracker 模板][s27] ·
[GitLab 依赖模板][s28]

**已观察失败。** spec 和子票都带 `ready-for-agent`，只靠这个标签轮询的无人值守代理可能把父规格当一张大票捡走。
作者建议轮询排除父规格或拆完移除父标签。
规格没有自动保鲜，架构重构未必适合长用户故事模板。
拆票常见三行改动被拆十余票、按层开票、验收项在基线已成立、或验收项属于别票。
检查每票能演示的行为，以及什么具体观察能使该票在实施起点判失败。
作者建议在同一窗口跑完规格与拆票，避免再次拉取大 issue 内容截断。
小任务可从访谈直接到实施。
[AI Hero 作者说明][s29] · [AI Hero 作者说明][s26] · [ask-matt][s30]

## 实现者和审查者怎样分工？

主题 4。实现围绕一个可观察行为推进，审查独立核标准与规格。

- **`tdd` 是实施者的测试纪律。** 测之前讲清既定公开 seam 各自能捕捉什么、遗漏什么。
  每轮只写一个观察行为的失败测试，先看到红，再写刚好足够的实现，进入下一行为。
  当前的实现循环是 RED→GREEN，重构留给 review 环节。
  测试用真实公开接口观测效果，预期值来自独立规格、算例或已知字面值，mock 限在系统边上，例如外部服务与时钟。
  查数据库私有状态、断言内部调用次数、在断言重抄一遍计算、先批量写想象中的测试，都带来失真的反馈。
  作者文档承认配置、接线、直通委托一类改动缺少内置的“值得走一轮吗”判断。
  [tdd][s31] · [测试例][s32] · [mock 边界][s33] · [AI Hero 作者说明][s34]
- **`implement` 和 `implement-spec` 有两种调度粒度。** 前者读给定票，回报标题消歧，在预同意 seam 跑 TDD，
  定期跑类型和单文件测试，结束时全套一次，调用代码审查后提交当前分支。
  后者每张就绪票一个新实现者、独立 worktree 和分支，实现时跑 TDD，完成前先合入 integration tip，再由 merger
  落到唯一集成分支，新增就绪票继续派。
  全图完成才对集成分支做一次 `code-review` 并派新修复者。
  有 tracker 的 PR 关闭语义或用户要求时才开 draft PR，让它在首个合并之后出现，最终交审。
  否则按 tracker 关闭约定处理。
  作者明示 worktree 把冲突推迟至合并，同字段异名这类语义冲突可能无文本冲突，单大分支也会挤压人审。
  已固定的确定性调度在作者经验里更稳定。
  [implement][s35] · [implement-spec][s36] · [AI Hero 作者说明][s37] ·
  [v1.3 作者说明][s24]
- **`code-review` 分两个互不污染的上下文。** 固定比较引用，核它能解析且三点 diff 非空，查 commit 里的 issue、传入路径、
  分支名相符的本地规格，清楚报告无来源的 Spec 轴。
  Standards 轴拿实际标准文件和一组 Fowler 代码气味（启发式，仓库规则优先，已有工具覆盖的略过），Spec 轴看漏做、超做、看似实现但错误。
  两位子代理在前台并行，报告分别呈现。
  独立性在此指上下文与审看目标，同模型、多模型、独立行为测试是不同属性。
  旁路 `pr` 让人审先看最小图、前后证据和可逆性/影响面。
  `retro` 读真 session，提出导航、工具、指令、信息访问、验证的改善，机械问题归可失败的确定性检查，判断留代码审查。
  [code-review][s38] · [code-review][s39] · [pr][s40] · [retro][s41] ·
  [v1.3 作者说明][s24]

## 遇到硬故障怎样建立有效的反馈？

主题 5。先得到可信的失败信号，才开始解释和修复。

`diagnosing-bugs` 从用户说得清楚的异常或性能回退入手。
六步顺序是建反馈环、复现并缩小、列假设、打探针、修复与回归、清理。
起点是已经跑过的单条命令，能打到真实路径并对具体症状判红、跑得快、能无人运行、重复结果稳定（间歇问题可把复现率提高并固定条件）。
优先现有公开位置的失败测试，也可用 HTTP/CLI/浏览器脚本、回放、最小 harness、差分或二分查找。
人操作是后备，有脚本收反馈。
拿不到该信号，说明已试路径和缺少的环境或脱敏材料，请用户提供所缺信息，诊断停在复现。
逐一删输入/配置/步骤并重跑，留下每个对复现都必要的因素。
[diagnosing-bugs][s42] · [AI Hero 作者说明][s43]

列 3–5 个排序后的可证伪假设，每个有可观测预测，发给用户看后继续，探针每次只变一项，优先断点或小范围带唯一前缀的日志。
性能分支先做基线测量再二分。
回归测试从最小复现迁到能覆盖真实调用模式的位置，先看红再修，若红依赖临时改代码/夹具，先与干净副本决出确实有差异。
修后再跑未缩小原场景。
缺少正确 seam 本身是发现。
过浅单元测试会给错误信心。
结尾核原场景、回归结果或 seam 缺口、临时日志与 harness 清理，并把已验证的根因带到 commit/PR。
对输出和捕获材料先脱敏。
v1.3 取消尾段自动转 architecture，作者路由仍把无 seam 的情形交给人选择后续架构工作。
[diagnosing-bugs][s44] · [v1.3.2 修订说明][s2] · [ask-matt][s45]

## 深模块和架构巡检分别改变什么？

主题 6。深模块降低调用与测试负担，巡检用真实理解阻力确定候选。

`codebase-design` 是给设计者和审查者的参考。
Module 尺度不限，interface 是所有调用者必须知道的东西，包括不变量、调用顺序、错误模式、配置和性能，depth 衡量学会这套
interface 能得到多少行为。
Seam 是 interface 所在且可以替换行为的位置，adapter 是填这个位置的实现。
收益落在调用者少学规则（leverage），维护者把变更、bug 和验证收敛到一起（locality）。
删除测试问“删掉这层，复杂度消失还是扩散到所有调用者”，能只有一个适配器的抽象需要警惕。
公开接口也是行为测试面，内部可由小件与私有 seam 构成。
用代码行数、目录形状推断深度会把问题看错。
[codebase-design][s46] · [AI Hero 作者说明][s47]

`DEEPENING.md` 将依赖分成进程内、可本地替代、跨网络但自有、真正第三方。
进程内可直接验，像 PGLite 类替代在内部 seam 使用，内部自有远程依赖可用生产运输适配器和测试内存适配器，第三方才用注入的 mock。
新公开接口覆盖相同行为后，逐步以接口测试替换已多余的浅层单测。
需要比设计时，`DESIGN-IT-TWICE.md` 指定三个以上新上下文给不同约束（极小入口、最大弹性、常见调用最简，必要时再试端口与适配器）。
每版交 interface 与不变量、调用示例、隐藏的复杂度、依赖策略和取舍，最后按 depth、locality 和 seam 位置给推荐。
[依赖与测试策略][s48] · [多方案设计][s49]

`improve-codebase-architecture` 从用户指方向或 `git log` 热点定范围，让新上下文体验真实理解阻力，
例如一个概念要在许多小模块之间跳转、漏出内部规则、为单测提纯后遗漏深层调用缺陷。
交一份临时 HTML（Tailwind、Mermaid 来自 CDN），每候选列文件、具体阻力、变更方向、可测性、前后图和确信程度，给首选并让用户挑选，再用
grilling 探约束、接口和可保留验证。
若决策涉及域术语或少数长期取舍，同步词表/ADR。
巡检阶段测的是候选价值，产物是设计讨论和候选报告，落代码由后续工作承担。
欠缺网络或宿主子代理能力会影响报告的直接体验与多方案并行。
[improve-codebase-architecture][s50] · [AI Hero 作者说明][s51]

## 上下文什么时候保留，什么时候交接？

主题 7。前半程保持上下文，确有接续边界才传递指向原件的交接。

- **先保真后腾窗。** `ask-matt` 给的顺序为继续（下段需要逐字推理或剩余高质量窗口够用）、在旧上下文可丢弃时清空、确实跨边界时 handoff、
  可全权交给代理的窄工作派子代理、同宿主同目录且仍需人在场时定向压缩。
  常态保留访谈、规格、拆票的连续上下文。
  实施每票新窗，只给规格、票、研究笔记和提交指针。
  这里的约 150k 是作者的经验尺度，未作为模型通用阈值验证。
  上游 AGENTS 还明确写有 Codex 默认继承父会话会破坏隔离的提醒。
  [ask-matt][s52] · [阶段边界决策树][s53] · [仓库子代理规则][s54]
- **`handoff` 的产品是一份携带中的文件。** 只在跨宿主、跨目录、给同事或中途分出一条支线时才优先写它。
  输入补下一会话要解决什么，输出短 Markdown，记录仍在进行的工作、与下一步有关的原因、建议技能及原始资料指针，去敏感信息，默认放 OS 临时目录。
  原型往返是示范用法：在新目录处理问题，再把结论带回活着的原线程。
  已公开的风险是临时文件或其依赖丢失，概括把未经验证的判断变“已完成”，上下文压过后很难找回为什么。
  作者建议在交接前回读并降低不确定说法的确定程度。
  [handoff][s55] · [AI Hero 作者说明][s56] · [prototype][s57]
- **`wayfinder` 应对尚且无法一次想完的决策。** 一个 tracker map 存目的地、简短索引、待澄清范围和范围外，详情各在决策票，
  按任务依赖选择未领且无阻塞票。
  先 claim 后做，每窗通常一票，研究例外可并行。
  研究、原型、访谈、为决策解封的任务分别有输入输出，HITL 票须人真的作答。
  尚无法把问题写清的留在待澄清区。
  已能写清但有依赖的才开票并挂阻塞。
  默认产出已决路线，然后合成 spec 再发实施票。
  以该方法处理清晰单窗小任务会引入编排成本。
  [wayfinder][s58] · [wayfinder][s59] · [ask-matt][s45]
- **文档机制。** `writing-for-agents` 要求指针写清何时读取和去哪里读，正文按步骤与参考分级，只放每条分支都要读的规则，
  其余按使用时机收到链接后。
  同一内容一个权威源，从命令或配置就能低成本读到的事实不重抄成说明。
  可验的完成条件优先，真遇到模型为了下段而草草结束时才通过真实会话边界拆开，inline skill 互调不能制造这个隔离。
  [writing-for-agents][s60] · [writing-for-agents][s61]

## 这些做法怎样与 pstack 和 WorkflowHub 对照？

主题 8。可以按问题复用技能，保留 WorkflowHub 自己的质量角色与权限边界。

- Matt 的前半程可用于比较如何把人类决定变成实现可消耗的规格与小票，pstack 的上游指南另有按任务路由与在真实应用上验证、随后 PR 收敛的操作手册。
  共同点包括真实可重放反馈、独立代理、小范围交付。
  Matt 主流程允许从单窗小改直接实施，也提供任务图汇到一分支。
  pstack 涉及逐 PR 验证和排队交付，两者的集成和放行语义应按各自原件对齐。
  [ask-matt][s30] · [implement-spec][s62] · [pstack 上游指南][s63] ·
  [pstack 验证与交付][s64]
- 对 WorkflowHub 最贴近的是访谈把可查事实和授权决定分工、票的依赖与演示行为、最高可观察 seam 配独立预期、诊断复现环、handoff 指针。
  直接移植整个实施流程会撞到本仓当前三角色、唯一写主、审测结果与证据规则，以及 `implement` 要求收尾跑一次全套测试的差异。
  保持 WorkflowHub 现有阶段完成与证据口径，一次只验证一个方法是否让同类任务更易查错和接续。
  [WorkflowHub 当前方法][s65] · [WorkflowHub 证据规则][s66] · [implement][s67]
- 作者提供一次带 UI 原型、约 47 用户故事和 9 子 issue、约 21,000 行 PR 的公开案例，提到自动审查发现一项标准硬违规和数项范围扩张，
  并为人审拆叠 PR。
  这是作者自报的工作过程，作为存在性例子，不用来推断成功率、耗时或相对 pstack 的优势。
  [作者完整案例][s68]

## 发布清单里还有哪些辅助技能？

主题 9。发布清单也包含配置、提问、教学和人工操作等专项入口。

以下入口明确用于特殊问题，前文已拆解从澄清到交付的主链路。

| 技能 | 适用输入与实际产物 |
| --- | --- |
| [triage](https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/triage/SKILL.md) | 用项目自己的问题流转角色筛请求件，核事实、补信息、交可消费的 brief。外部 PR 纳入与否由配置决定。 |
| [prototype](https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/prototype/SKILL.md) | 行为问题给能自由操作的状态演示，视觉问题给可切换的方案。把回答留给真正的实现。 |
| [wizard](https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/wizard/SKILL.md) | 对确须人动手的步骤生成临时交互向导，明示每步输入与写入位置。 |
| [research](https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/research/SKILL.md) | 用新上下文核第一手资料，交可引用的 Markdown。 |
| [grill-me](https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/productivity/grill-me/SKILL.md) | 直接调用通用 grilling，适合无需项目领域建模的取舍。 |
| [teach](https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/productivity/teach/SKILL.md) | 用学习目的、课程与已知内容记录支持跨会话学习。 |
| [to-questionnaire](https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/productivity/to-questionnaire/SKILL.md) | 把只可由另一人回答的事实与决策整理成问卷，先澄清对象和需要回收的决定。 |
| [wait-what](https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/productivity/wait-what/SKILL.md) | 当前答复没讲清时，使用项目词表和简明表达重讲。 |

## 怎样回查原件？

| 正文编号 | 追踪标识 | 对应正文 |
| --- | --- | --- |
| 主题 1 | invocation-and-setup | 技能怎样安装、触发和承接项目配置？ |
| 主题 2 | grilling-and-domain | 怎样问清楚问题并保存长期决定？ |
| 主题 3 | spec-and-tickets | 确认方向后怎样形成规格和可独立交付的票？ |
| 主题 4 | implementation-and-review | 实现者和审查者怎样分工？ |
| 主题 5 | diagnosis-feedback | 遇到硬故障怎样建立有效的反馈？ |
| 主题 6 | deep-module-design | 深模块和架构巡检分别改变什么？ |
| 主题 7 | context-and-handoff | 上下文什么时候保留，什么时候交接？ |
| 主题 8 | comparative-adoption | 这些做法怎样与 pstack 和 WorkflowHub 对照？ |
| 主题 9 | remaining-promoted-skills | 发布清单里还有哪些辅助技能？ |

[s1]: <https://github.com/mattpocock/skills/commit/abeeaf95660ba9e8b7c753eb38f441ca707a8823>
[s2]: <https://github.com/mattpocock/skills/releases/tag/v1.3.2>
[s3]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/.claude-plugin/plugin.json#L1-L50>
[s4]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/scripts/check-frontmatter.mjs#L1-L46>
[s5]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/README.md#L209-L258>
[s6]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/.agents/invocation.md#L1-L26>
[s7]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/grill-with-docs/agents/openai.yaml#L1-L5>
[s8]: <https://www.aihero.dev/skills/skills-changelog-v13-implement-spec-pr-retro-and-glossary-md#changed-skills-call-the-skill-tool>
[s9]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/README.md#L25-L105>
[s10]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/AGENTS.md#L1-L27>
[s11]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/.claude-plugin/plugin.json#L21-L49>
[s12]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/LICENSE>
[s13]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/setup-matt-pocock-skills/SKILL.md#L9-L120>
[s14]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/.out-of-scope/mainstream-issue-trackers-only.md#L1-L17>
[s15]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/setup-matt-pocock-skills/issue-tracker-github.md#L15-L35>
[s16]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/setup-matt-pocock-skills/issue-tracker-gitlab.md#L15-L35>
[s17]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/grill-with-docs/SKILL.md#L1-L7>
[s18]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/productivity/grilling/SKILL.md#L6-L30>
[s19]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/.out-of-scope/question-limits.md#L1-L18>
[s20]: <https://www.aihero.dev/skills/skills-changelog-v1-1-wayfinder-to-spec-to-tickets-grilling-improvements>
[s21]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/domain-modeling/SKILL.md#L8-L74>
[s22]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/domain-modeling/GLOSSARY-FORMAT.md#L25-L60>
[s23]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/domain-modeling/ADR-FORMAT.md#L1-L46>
[s24]: <https://www.aihero.dev/skills/skills-changelog-v13-implement-spec-pr-retro-and-glossary-md>
[s25]: <https://www.aihero.dev/skills-grill-with-docs>
[s26]: <https://www.aihero.dev/skills-to-tickets>
[s27]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/setup-matt-pocock-skills/issue-tracker-github.md#L5-L19>
[s28]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/setup-matt-pocock-skills/issue-tracker-gitlab.md#L37-L46>
[s29]: <https://www.aihero.dev/skills-to-spec>
[s30]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/ask-matt/SKILL.md#L15-L40>
[s31]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/tdd/SKILL.md#L8-L38>
[s32]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/tdd/tests.md#L3-L76>
[s33]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/tdd/mocking.md#L1-L22>
[s34]: <https://www.aihero.dev/skills-tdd>
[s35]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/implement/SKILL.md#L7-L17>
[s36]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/implement-spec/SKILL.md#L7-L42>
[s37]: <https://www.aihero.dev/skills-implement-spec>
[s38]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/code-review/SKILL.md#L6-L42>
[s39]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/code-review/SKILL.md#L58-L89>
[s40]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/pr/SKILL.md#L6-L42>
[s41]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/retro/SKILL.md#L7-L35>
[s42]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/diagnosing-bugs/SKILL.md#L12-L86>
[s43]: <https://www.aihero.dev/skills-diagnosing-bugs>
[s44]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/diagnosing-bugs/SKILL.md#L88-L138>
[s45]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/ask-matt/SKILL.md#L46-L54>
[s46]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/codebase-design/SKILL.md#L6-L114>
[s47]: <https://www.aihero.dev/skills-codebase-design>
[s48]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/codebase-design/DEEPENING.md#L5-L37>
[s49]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/codebase-design/DESIGN-IT-TWICE.md#L7-L44>
[s50]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/improve-codebase-architecture/SKILL.md#L18-L71>
[s51]: <https://www.aihero.dev/skills-improve-codebase-architecture>
[s52]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/ask-matt/SKILL.md#L19-L40>
[s53]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/ask-matt/PHASE-BOUNDARIES.md#L17-L55>
[s54]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/AGENTS.md#L23-L27>
[s55]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/productivity/handoff/SKILL.md#L1-L16>
[s56]: <https://www.aihero.dev/skills-handoff>
[s57]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/prototype/SKILL.md#L8-L26>
[s58]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/wayfinder/SKILL.md#L7-L80>
[s59]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/wayfinder/SKILL.md#L82-L128>
[s60]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/productivity/writing-for-agents/SKILL.md#L6-L52>
[s61]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/productivity/writing-for-agents/SKILL.md#L54-L81>
[s62]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/implement-spec/SKILL.md#L23-L42>
[s63]: <https://github.com/cursor/plugins/blob/e58dd043600587dbaf58ba315e7f2b38373eeb43/pstack/docs/guide/README.md>
[s64]: <https://github.com/cursor/plugins/blob/e58dd043600587dbaf58ba315e7f2b38373eeb43/pstack/docs/guide/06-verify-and-ship.md>
[s65]: </Users/Hugh/Hugh/Project/workflowhub/docs/standard-workflow.md:29>
[s66]: </Users/Hugh/Hugh/Project/workflowhub/docs/standard-workflow.md:75>
[s67]: <https://github.com/mattpocock/skills/blob/abeeaf95660ba9e8b7c753eb38f441ca707a8823/skills/engineering/implement/SKILL.md#L11-L17>
[s68]: <https://www.aihero.dev/watch-me-ship-a-21-000-line-feature-with-mattpocock-skills~ez95n>
