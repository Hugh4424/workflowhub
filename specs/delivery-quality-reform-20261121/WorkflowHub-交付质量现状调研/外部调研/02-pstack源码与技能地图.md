# pstack 怎样让代理按任务选择方法并验证结果？

## 这次读的是哪一版，运行依赖谁？

主题 1。区分公开镜像、Cursor 上游和宿主提供的执行能力。

**pstack 是一套给 agent 读、由宿主提供执行能力的工程工作方法。** 它把“先找到能检验的结果，再写最小的改动，
回真实使用场景复验”落实到任务路由、可重跑的证据和分工。
@backnotprop/pstack 是独立安装镜像。
此次 GitHub 最新提交查询返回镜像 `4a4f41c46c67a006658ac17cef2d092593f6b26a`，提交于 2026-11-19
20:16:07 UTC，manifest 版本 `0.15.44`，同步记录指向 Cursor 上游
`e58dd043600587dbaf58ba315e7f2b38373eeb43`。
上游为 Lauren Tan（poteto）编写的 `cursor/plugins/pstack`，镜像说明 `upstream` 保留原文件，`main`
含兼容映射、安装说明和少量社区修复。
镜像版 `no-comments` 对无法核验的外部约束加 REVIEW 并保留其注释，拒绝某次子审查不终止整轮。
镜像的 statechart 加了 Windows 分支、CRLF 和异常退出清理。
作者的“更少代码、更高质量”属于目标与使用经验。
[镜像提交][s1] · [manifest][s2] · [同步方法][s3] · [同步日志][s4] · [上游提交][s5]

镜像提供普通 Agent Skills 安装入口，Cursor 插件 manifest 注册 `skills/` 与 `agents/`。
上游 Claude Code 插件安装的是同一上游提交中独立生成的 `harness/pstack/` 树。
镜像文档描述用不同宿主的子代理参数、项目技能目录、会话日志和本地 worktree 替代 Cursor 约定。
无子代理时文档规定串行执行，独立作者或跨厂商评委这一层会丢失。
没有 `deslop` 可以手工对照 diff，没有 `control-ui` / `control-cli` 可使用已经存在的浏览器、CDP 或 PTY
驱动。
三者均来自外部 `cursor-team-kit`，`/create-skill` 和 `/loop` 由宿主提供。
Claude adapter 明示跨不了的 Cursor Automations、Bugbot 实时触发或云机器专属动作会记跳过。
[镜像安装与依赖][s6] · [Cursor manifest][s7] · [上游 Claude 构建树][s8] · [宿主映射][s9] ·
[Claude adapter][s10]

## 路由、主会话和专门技能怎样组合？

主题 2。主会话选择方法并负责最后的判断，专门技能与代理只负责各自产物。

- **要点 1。入口和负责方。** 用户给目标与可检验的完成条件。
  接到 `poteto-mode` 的主会话保留 playbook、TODO 和综合判断。
  首轮复述目标与最小改法，选 playbook、抄步骤进 TODO，再按触发调用窄技能。
  直接派发把绝对路径 `worker.md` 放在第一行，`poteto-agent` 再读完整 mode 与按需读原则叶文件。
  `worker.md` 贯穿嵌套派发，限制擅加验收，把已存在于 base 的问题记一行，并要求 PR 报告用证据链接。
  直接 worker 与 routed skill 的 worker 类型由各自文件规定。
  主会话复核 diff，撰写自身结论。
  重试和下一项原则上起新 agent。
  原代理握有难以迁移的未提交修改、checkout 或进程才续它。
  [mode][s11] · [派发规则][s12] · [worker][s13] · [poteto-agent][s14]
- **要点 2。计划深度取决于任务。** 小改可直接进入 Feature 或 Bug fix。
  跨函数边界先定数据形状和调用侧，再摆两种接口/模块方案。
  可运行验证的分歧走一次性 Prototype。
  多 PR 计划单独交可审查的文件，明确依赖、文件、验证和用户评审，等明确开工。
  没有合适脚本、跨切面或无人值守时 `figure-it-out` 先定可证伪谓词、冻结改动前基线、定可独立交付的工作单元，再逐项按假设、最小动作、复测、
  保留或回滚推进。
  [Architect][s15] · [Prototype][s16] · [Multi-phase plan][s17] ·
  [Figure it out][s18]
- **要点 3。模型分工由配置声明，实际席位由宿主决定。** `setup-pstack` 读取可用模型、选择 reasoning budget，写宿主对应
  settings 文件。
  别名 `auto`/`inherit-parent` 继承主模型，旧预算及部分旧模型会迁移。
  该 pin 的 code/prose/judgment 默认起点为 Opus 5.5 xhigh fast，swarm/验证起点为 Opus 5.5
  high fast，普通角色按任务降档或上调至 xhigh。
  Arena / Interrogate 默认 Fable 5.2 high、Opus 5.5 high fast、Gemini 4 Neon high。
  Fable 与 Opus 同属 Anthropic，默认三席对应两个厂商。
  Fable 离开面板仅限用户点名或同 brief 两次 Opus xhigh 未过。
  Arena 的另厂商评委只出一人，模型不可用时按技能的降级路径替代、跳过或披露。
  Claude adapter 会把 Gemini 变为父模型继承，镜像支持安装本身无法证明异厂商对照。
  [配置与旧值处理][s19] · [mode 角色][s12] · [Arena 评委][s20] · [Claude 模型表][s21]

## 四条实际调用链怎样运行？

主题 3。实现、验证、发布和复盘各有自己的入口和证据出口。

### 实现和修复怎样回到可证伪结果？

- **Bug fix** 从主会话亲自驱动原问题使用界面开始。
  复现不了就合成触发、收紧条件、加观测，只有驱动无法碰到目标时才说明原因向用户取证。
  读调用路径和 `why` 的回归历史产生假设，逐次用运行数据排除，先验证存活的机制，再设计修复。
  跨函数边界进 `architect`，由受限写者改代码。
  最后回相同界面重跑原复现。
  便宜的本地回归才走 `tdd`，先看到预期失败，再修、再跑。
  测试路径昂贵可用最接近的可执行复查。
  交付是根因、修复与失败前后输出。
  级别不同的测试回答不同问题，单元分支绿无法替代原场景。
  [Bug fix][s22] · [TDD][s23]
- **Feature** 先追真实调用、定数据形状，再列阻塞前置、可独立工作、共享写入、最小安全切分四项。
  没有可拆工作保留条目和理由。
  可有多种合理实现形状时，playbook 强制通过 Arena，不能派生子代理的执行者直接拥有 diff 并保持审查分离。
  耦合工作保留单 owner，父层只并行独立产物。
  完成后在匹配场景验证，小单元依次构建、验、提交，争议设计走 Interrogate。
  **Refactoring** 则先把现状钉成 characterization test、snapshot 或对照程序，迁移所有内部 caller
  后同波删除旧 API，在真实产物证明等价。
  有外部兼容依赖时原则本身列明不适用。
  [Feature][s24] · [Refactoring][s25] · [旧 API 原则][s26]
- **Arena / Swarm / Interrogate** 各有可核对的交付。
  Arena 的同题候选在独立写目录产出作品和取舍，独立评委沿事先约定标准评分，主会话全读并选底稿、植入优点、验证。
  收敛时可用共识方案，极度发散时回题面重开。
  Swarm 可分片或赛跑，派发时先写完成条件、SHA、测量方法和竞赛规则。
  SHA 或方法缺失只补派一次，第二次漏报是缺口。
  Interrogate 复用 Arena 的 fan-out 和复验阶段，把指定 diff 和本地未提交变动放进独立 worktree。
  审查员在真实代码上给出命令、实际输出与预期。
  主会话重跑、按意图判定、去除重复根因，输出已证实及淘汰项，无发现也可以是如实结果。
  不代写修复。
  无可执行证据的未来风险与风格意见不在其发现定义内。
  [Arena][s27] · [Swarm][s28] · [Interrogate][s29]
- **源码专项审看另有入口。** Blast radius 找支撑安全性的关键事实，沿依赖 pin、时序、协议与跨层数据验证真正会破的地方。
  它能把未证实事实记在报告。
  No comments 由 Comment Sicko 处理注释与列改造旗标，父会话检查 diff 和证据，限定内修，不因根因在外而扩大范围。
  README 对该 agent 写了 read-only，角色文件却允许删除注释，调用技能也检查其 diff，因此直接采信角色的可写边界更稳。
  公共 API 契约、许可证、确有外部约束等是原技能列出的例外。
  [Blast radius][s30] · [README 角色表述][s31] · [Comment Sicko][s32] ·
  [No comments][s33]

### 怎样创建和维护真实验证？

- **真实行为验证。** `create-verification-skill` 先查仓库的用户入口、启动数据、实用驱动、证据和隔离方式，生成项目本地
  `verify-<app>/SKILL.md` 与 feature map。
  启动用空数据目录也要真正可用，doctor 读进程归属、版本与权限，drive 用真实入口。
  留动作、最终状态和副作用，清理只处理自建实例，证据在清理后仍必须存在。
  生成器交付前跑通 ONE mapped feature，只证明该用法可执行。
  后续 `maintain-verification-skill` 才按 feature 开只读源码波、由主持者串行跑每个功能。
  卡住时记录确切访问前置和已尝试入口。
  发现实际功能坏了记产品回归，维护写集只有验证目录，至多一件已实证修复的 PR。
  [创建验证技能][s34] · [维护验证技能][s35]
- **形式验证。** `create-formal-verification-skill` 从用户受损且测试难触及的单一性质入手。
  并发和步骤顺序默认考虑 TLA+。
  输入空间、内存、溢出等可选直接检查代码的 verifier，缺适配器时可转生成输入驱动真实代码。
  生成物绑定代码文件、函数、同步 commit、边界、假设与可重跑命令。
  必须用人为引入的反例证明检查会失败，再撤掉实验修改。
  维护从旧模型先跑一次起步，再读同步点以来迁移过的代码和新 writer，按现行代码更新模型，重跑并把反例逐步映射回真实代码。
  模型描述有偏差、产品确有 bug、性质有意修改是三种证据路径。
  已过的旧模型无法证明新代码。
  [创建形式验证][s36] · [维护形式验证][s37]
- **可执行追踪。** Statechart 接收 TLA+、配置和可选可见状态/箭头映射。
  其启动器选择可运行 TypeScript 的 Node、Bun 或 Deno。
  TS 入口设隔离临时路径并启动 `worker.ts`。
  worker 经 `check` 调用 TLC，经 `compile` 输出原始 TLC 与报告/图，再原子交付。
  源码钉 TLC 1.7.4、JAR 校验值和 Temurin 25，由 mise 获取依赖。
  模型大于 500 states 图只留反例路径，过大而无反例可不出图。
  规则发现第一次违例后，分次对剩余规则设置较小的有限状态探索，报告列未检规则。
  可选 Mermaid 渲染另有外部依赖。
  它产出模型中的最短违例路径，实际代码仍要重演。
  Windows 改动明确落在 TS 入口及输出处理，便捷 shell 启动器仍有 `#!/bin/sh`，因此 Windows 能力应按 TS
  入口和真实运行方式核验。
  [Statechart 用法和限制][s38] · [启动器][s39] · [TS 入口][s40] · [worker][s41] ·
  [TLC 依赖与清理][s42] · [产物][s43] · [图片渲染][s44]

### PR 状态、独立验证与合并怎样分工？

- **Opening a PR → Babysit。** Opening 写短 PR brief 和关联证据，先在独立 worktree 整理小提交，
  打开可审阅 PR。
  它本身不启动 babysit。
  Babysit 先定 drive、threads-only 或 check，再按冲突、评论、CI 排查。
  merge-ready 是停止位置，碰到冲突或 stale base 报 owner，flake 单次重建，来源评论当数据查证。
  这里有实际只读 watcher。
  Bun launcher 启动依赖检查，可能安装锁定依赖，再走 CLI → `GhGitHubReader` 读 GitHub
  PR/check/thread → policy 输出单次状态、可就绪、等待或队列完成。
  普通模式 `READY` 可包含已经 merged 的状态，状态查询退出 0 只代表读数成功。
  监控器的工作是读报告。
  shipping 文件才指定何时、由谁发起合并。
  [Opening a PR][s45] · [Babysit][s46] · [watch-pr][s47] · [依赖安装][s48] ·
  [CLI][s49] · [GitHub reader][s50] · [状态与队列策略][s51] · [队列完成][s52]
- **Shipping。** 每件 PR 由非作者验证者以 base/head 驱动匹配用户路径并记 `PASS`、`PASS+NOTES` 或
  `FAIL`。
  仅从最底未合并 PR 连续通过到停线为止。
  在重排 commit / rebase 后用 `git patch-id` 核对旧裁决是否仍有效，代码差异一律看实际影响。
  测试、文档、lint-only 变动可让具备相同构建产物的旧 lane 延续，变化本身仍重新检查和审查。
  无产物可比的 lane 重跑。
  每次合并读回 PR 实际 merged 且 base 是 trunk，入队不是已落地。
  等待时固定队列，不把后续新增项自动纳入。
  这里同时识别 patch 的行为裁决与提交 SHA 的 CI 健康。
  [Shipping][s53]
- **Autopilot-full / Autopilot-stack。** Full 覆盖获批队列，一 PR 一 owner，由 owner 构建、自证、
  解决并合并。
  在 code-ready head 由作者之外的 swarm 跑检查、真实行为 lane 和 diff 审看。
  主会话核原件，确认未放松闸门。
  大改触发全 swarm，普通改动/rebase 单验证者，纯文案免该次复验，所有新 head 仍各有 CI 证据。
  trunk 实质碰撞才重测/重排，明确停机到所有 owner。
  Stack 在当前 head 已独立验证且 CI 绿处停，交给操作者，只有硬依赖才堆叠。
  当前指令依赖外部 forge 权限、真实可访问的验证面、宿主 loop/cloud 和轨迹储存，本次未验证可用性。
  [Autopilot-full][s54] · [Autopilot-stack][s55]

### 复跑、轨迹与外部自动化怎样衔接？

- **会话内自主推进。** Autonomous run 先定停机谓词，有事件靠 watcher 唤醒，无事件按合理间隔，做一项、跑一次、记录结果。
  无效就弃，停滞切假设，不放宽完成条件。
  `show-me-your-work` 单一追加 TSV 按决策点或每轮记录，支持新 run 的边界，证据列指原产物。
  脚本只追加、净化单行单元格、挡以公式开头的内容。
  技能还要求结束时以本 workspace 的实际 transcript 对账，再由另一厂商模型查证据与遗漏。
  成功可审范围取决于环境能否访问该 transcript 和模型。
  [Autonomous run][s56] · [轨迹约定][s57] · [TSV 脚本][s58]
- **Benny 是单独的休眠配置包。** `FOR_AGENTS.md → setup-benny → 两份运营 skill`。
  需把包合并至目标仓，仓内启用 pstack 共享依赖并确认新 agent 可读，秘密与用户配置留在包外，材料提交后由人审后启用。
  第一条 Cursor Automation 读 Slack 问题原线程及附件，分类、查 tracker 重复、只对明确新 bug 建票，然后仅在原线程打
  verdict marker。
  第二条等待可信 marker，已有 owner 或候选 PR 时不抢改，优先验证。
  可驱动时经配置 control adapter / feature map 在真实 UI 两次复现，获取媒体和只读状态交叉证据，至多一次有界修复，
  前后证明满足时只开 draft。
  Slack 坐标、tracker、控制或 feature map 不明即停，子代理不得获 Slack 凭证或发帖。
  与普通 worker 的 ready PR 对照，Benny 自己规定了 draft。
  `automate-me` 是把个人工作方式写成另一个 mode 的技能，`make-bot-ui` 是另有宿主 webhook、秘密交接和
  Tailscale 需求的单独流程。
  [Benny 入口][s59] · [设置][s60] · [分类][s61] · [复现和修复][s62] · [Automate me][s63] ·
  [Make bot UI][s64]


### 怎样判断改技能真的改善了代理行为？

先把想改的文件和成功行为写清，用自然用户请求跑隔离候选。
pstack 的 eval 不在候选请求里透露被测条件、其他候选和评价标准。
评委匿名看产物，两个版本用同一尺度，主会话还要读真实结果。
主持者在授权的当前工作区核会话中实际读过哪些文件，再看代码形状和运行证据。
这使「模型说它遵循了规则」与「它真的走过调用链」可以分别验证。
源码中有候选的模型设定，验证技能本身时可控制模型、基准和可用工具。
[正式评估步骤][pstack-eval]

## 固定提交有哪些可用入口和原则？

主题 4。技能负责动作，原则约束选择，执行流程把它们按任务串起来。

入口、工具与运营技能 34 个，原则 24 个，playbook 22 个。
所有条目的正文均在固定提交读回。
计数以该提交 README 的三组有索引文件为口径，另核了 mode 内嵌原则与 playbook 名单。
Benny 的 manifest 注册范围外有三个运营技能另列，`poteto-agent` 与 `comment-sicko` 是两份代理定义。
下面概述各条的输入与输出。
[技能索引][s65] · [原则索引][s66] · [playbook 索引][s67] · [注册范围][s7]

### 这 34 个技能分别产出什么？

| 用途 | 技能 | 输入 → 可见产物 |
| --- | --- | --- |
| 入口与输入 | [`poteto-mode`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/SKILL.md) | 目标与完成条件 → 路由、TODO、核证据后的结果 |
| 入口与输入 | [`setup-pstack`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/setup-pstack/SKILL.md) | 宿主模型列表、预算和确认 → 按角色写 settings，可选安装项目本地验证技能 |
| 入口与输入 | [`poteto-help`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-help/SKILL.md) | 想做什么或卡在哪里 → 指向已安装技能、playbook 或原指南，给可发的下一条提示 |
| 入口与输入 | [`in-your-own-words`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/in-your-own-words/SKILL.md) | 含糊目标 → 用自己的话重述意图与待解决的问题 |
| 入口与输入 | [`sharpen`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/sharpen/SKILL.md) | 现有任务 → 提升证据、方法、材料与独立验证要求的改写提示，范围保持 |
| 入口与输入 | [`figure-it-out`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/figure-it-out/SKILL.md) | 任务无合适路由 → 为该项设计并运行可审的逐项检验流程 |
| 理解与交接 | [`how`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/how/SKILL.md) | 源码疑问 → 读真实调用，解释作用、架构、职责。默认一只读子代理 |
| 理解与交接 | [`why`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/why/SKILL.md) | 历史原因 → 引入及历次变更的 commit/PR 讨论，注明作者原意、推断和空白 |
| 理解与交接 | [`teach`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/teach/SKILL.md) | 想理解整个变更 → 并取 how/why 后用循序图和解释拼成一份材料 |
| 理解与交接 | [`recall`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/recall/SKILL.md) | 最近一段工作 → 本 workspace 会话、共享记录与现存 Git/PR/issue 核对后给简短当前态 |
| 理解与交接 | [`ketchup`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/ketchup/SKILL.md) | 本聊天从用户上条消息以来进展 → 证据、小图与可独立决策的待办 |
| 理解与交接 | [`ketchup-video`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/ketchup-video/SKILL.md) | 同类进展 → 从真实素材生成有字幕视频，待决事项继续用正文列出 |
| 设计、实现与评审 | [`architect`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/architect/SKILL.md) | 跨边界实现 → 两种 caller/签名/模块形状与单一状态所有者，大分歧升级 Arena |
| 设计、实现与评审 | [`arena`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/arena/SKILL.md) | 同一复杂产物 → 独立候选、他厂商评委（有条件）、一个合成并已检验的产物 |
| 设计、实现与评审 | [`swarm`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/swarm/SKILL.md) | 覆盖多个独立切片或竞速 → 明确切片/赛制、结果、缺口与退出 |
| 设计、实现与评审 | [`interrogate`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/interrogate/SKILL.md) | 指定 diff 或设计 → 对抗复现与主会话重跑，输出证实与淘汰发现 |
| 设计、实现与评审 | [`blast-radius`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/blast-radius/SKILL.md) | 小改可能破坏隐蔽消费者 → 找安全性所赖事实，从代码指针走到能跑的证明 |
| 设计、实现与评审 | [`tdd`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/tdd/SKILL.md) | 用户要求或便宜本地回归 → 失败前、修复、通过后，保留验证限制 |
| 设计、实现与评审 | [`no-comments`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/no-comments/SKILL.md) | 待审 diff → 注释筛选、外部规则 REVIEW、限定内修和可执行约束提案 |
| 设计、实现与评审 | [`typescript-best-practices`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/typescript-best-practices/SKILL.md) | TS/TSX → 品牌类型、数据联合、边界解析、穷举和公共行为测试的语法映射 |
| 验证与证据 | [`benchmark-checklist`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/benchmark-checklist/SKILL.md) | 性能声称或选择 → 核 limiter、生产调参、量级、错误、复现、全链相关性及真实工作发生 |
| 验证与证据 | [`create-verification-skill`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/create-verification-skill/SKILL.md) | 没有项目真实行为验证入口 → 项目本地 verify skill、功能索引和自测证据 |
| 验证与证据 | [`maintain-verification-skill`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/maintain-verification-skill/SKILL.md) | 有真实行为 feature map → 源码波 + 实际驱动，clean/changed/blocked |
| 验证与证据 | [`create-formal-verification-skill`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/create-formal-verification-skill/SKILL.md) | 高代价性质、测试难跑全 → 验证器、可败对照、范围和同步点 |
| 验证与证据 | [`maintain-formal-verification-skill`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/maintain-formal-verification-skill/SKILL.md) | 覆盖代码更新 → 跟踪移动、新 writer 和合同变化，判模型漂移或实际 bug |
| 验证与证据 | [`statechart`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/statechart/SKILL.md) | TLA+ 规范及配置 → TLC 结果、Mermaid 与可复述的路径 |
| 验证与证据 | [`show-me-your-work`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/show-me-your-work/SKILL.md) | 长任务/无人运行 → 追加 TSV、会话对账和异厂商审看 |
| 写作与长期改进 | [`unslop`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/unslop/SKILL.md) | 用户答复或材料 → 去空话、模糊指代和重复，保事实和语气 |
| 写作与长期改进 | [`bro`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/bro/SKILL.md) | 上条消息 → 去术语重写 |
| 写作与长期改进 | [`technical-writing`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/technical-writing/SKILL.md) | 文档、RFC、PR 和 commit → 先选 Diátaxis 类型，再沿 Google 文档、STE、Global English 写规则 |
| 写作与长期改进 | [`reflect`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/reflect/SKILL.md) | 本会话重复失误与纠偏 → 有效/拒绝/待办，批准后写项目或用户技能副本 |
| 写作与长期改进 | [`correct`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/correct/SKILL.md) | 同类错误至少出现两次 → 优先架构、类型、lint/CI，再行为测试、最后文档。对真旧错误证明会拦 |
| 写作与长期改进 | [`automate-me`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/automate-me/SKILL.md) | 本工作区近期会话和用户提问 → 按实际习惯起草或维护一个 mode，走作者工具、unslop 和用户反馈 |
| 写作与长期改进 | [`make-bot-ui`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/make-bot-ui/SKILL.md) | 现有宿主可配 webhook 的控制页 → server 端发送和 secret 交接、tailnet 验证 |

### 这 22 条执行流程分别适用什么情况？

| Playbook | 触发 | 关键动作与输出 |
| --- | --- | --- |
| [`investigation`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/investigation.md) | 只读问题 | 追源码，动机转 why，给带来源的解释或取舍建议。涉及代码改动再重路由 |
| [`bug-fix`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/bug-fix.md) | 缺陷 | 原场景和根因证据确定后修复，同场景前后输出，按成本决定新增回归测试 |
| [`perf-issue`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/perf-issue.md) | 单次性能问题 | 采基线、找耗时来源，测改后 trace，给数值、差量和原件 |
| [`hillclimb`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/hillclimb.md) | 持续优化单指标 | 固定可区分信号的基准与回归检查，每轮一个假设、一次测量、保留或回滚。输出决策 TSV、尝试数和停线 |
| [`runtime-forensics`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/runtime-forensics.md) | 现场症状 | 采 CPU/heap/CDP 等信号，现场验证机制映射源码。输出诊断 |
| [`trace-forensics`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/trace-forensics.md) | 已有采样产物 | 转可查询数据，沿采样、线程或引用链定位。无成对采集时标强假设 |
| [`feature`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/feature.md) | 新行为 | 先数据/接口和吞吐拆分，再由受限 worker 实现，真实路径验收 |
| [`refactoring`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/refactoring.md) | 结构调整 | 先固定行为，删重再改结构，迁全 caller，交等价证明 |
| [`prototype`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/prototype.md) | 可低成本试出来的设计分歧 | 用隔离草图实际观察数个变体，返回证据与推荐，选定方案交 Feature |
| [`visual-parity`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/visual-parity.md) | 两实现视觉一致 | 固定全状态截图基线，逐组件检查图像差分。非零有证据地追，不改 oracle |
| [`authoring-a-skill`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/authoring-a-skill.md) | 技能新增/修改 | 用宿主作者工具，核 frontmatter、文件和引用，结构变化走测试 |
| [`eval`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/eval.md) | 技能或提示对照 | 同一自然任务、隔离环境、候选不知试验，异模型评委盲评。查真实 transcript 回检技能链 |
| [`babysit`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/babysit.md) | PR 状态/清障 | 先声明 drive、threads-only 或 check。到 merge-ready 止 |
| [`shipping`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/shipping.md) | 已绿 PR 栈要落地 | 独立用户场景裁决绑定 patch，按连续区间自底合并并读回 |
| [`autonomous-run`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/autonomous-run.md) | 长任务无人值守 | 先定退出谓词，事件唤醒或间隔检查，迭代与追加决策证据 |
| [`autopilot-full`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/autopilot-full.md) | 多独立 PR 已获开工与相应合并授权 | 每 PR 一 owner，作者外 swarm，修变更按证据复查，落地追踪 |
| [`autopilot-stack`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/autopilot-stack.md) | 一批 PR 达可交付状态 | 独立验证且当前 head 绿后停，真实依赖才堆叠，交操作者 |
| [`session-pickup`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/session-pickup.md) | 续具体中断会话 | 读取原轨迹和目前 Git，找恢复点，按目标复验承接结论 |
| [`pause-safely`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/pause-safely.md) | 操作者明确暂停 | 处理到原子边界，保留在制 work，写工作树外续跑指针 |
| [`multi-phase-plan`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/multi-phase-plan.md) | 多阶段或多 PR，需要独立计划 | 依赖、文件写集、单位验证、真实行为、性能和人为评审，等明确开工 |
| [`worktree-cleanup`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/worktree-cleanup.md) | 回收 worktree 或模拟器空间 | 先脚本盘点，再核置顶/活跃/未提交状态，清安全集并回读空间 |
| [`opening-a-pr`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/opening-a-pr.md) | 实施结束要交付 PR | 独立工作树、小提交、短 briefing、证据指针，开 ready PR |

### 这 24 条原则怎样影响执行？

| 位置 | 原则 | 约束 |
| --- | --- | --- |
| 核心 | [`laziness-protocol`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-laziness-protocol/SKILL.md) | 删除冗余，决定有唯一来源，取解决问题的最小 diff |
| 核心 | [`foundational-thinking`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-foundational-thinking/SKILL.md) | 逻辑前查读写模式，先定类型/数据和后续共用脚手架 |
| 核心 | [`redesign-from-first-principles`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-redesign-from-first-principles/SKILL.md) | 把新要求当初始条件重看设计，逐步交付并补全部引用 |
| 核心 | [`attack-the-premise`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-attack-the-premise/SKILL.md) | 同一前提下两次未过同一验证，先写下该前提并用可区分观测证伪 |
| 核心 | [`subtract-before-you-add`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-subtract-before-you-add/SKILL.md) | 构建前移除死重、冗余校验和空引用 |
| 核心 | [`minimize-reader-load`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-minimize-reader-load/SKILL.md) | 缩短追踪层数与需记忆的可变状态 |
| 核心 | [`outcome-oriented-execution`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-outcome-oriented-execution/SKILL.md) | 可逆且有明示边界的计划内迁移允许有意的阶段性断点，结尾检真实状态 |
| 核心 | [`experience-first`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-experience-first/SKILL.md) | 由用户、API caller、下一维护者的使用体验确定实现目标 |
| 核心 | [`exhaust-the-design-space`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-exhaust-the-design-space/SKILL.md) | 陌生设计做 2–3 个原型并列比较 |
| 核心 | [`build-the-lever`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-build-the-lever/SKILL.md) | 非琐碎工作优先做小而可重跑的脚本、生成器或验证，先拿一单元试 |
| 架构 | [`model-the-domain`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-model-the-domain/SKILL.md) | 用状态机、类型/表/索引表达真实域结构，分支少时保持直白 |
| 架构 | [`boundary-discipline`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-boundary-discipline/SKILL.md) | 在 CLI/配置/外部 API 等边界解析。内部以类型和纯逻辑为主 |
| 架构 | [`type-system-discipline`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-type-system-discipline/SKILL.md) | 要求编译器排除非法状态、错传的原始值和未处理变体 |
| 架构 | [`make-operations-idempotent`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-make-operations-idempotent/SKILL.md) | 依据现场与目标差收敛，前次中断处不成为隐含依赖 |
| 架构 | [`migrate-callers-then-delete-legacy-apis`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-migrate-callers-then-delete-legacy-apis/SKILL.md) | 没有外部兼容要求的迁移，所有 caller 更新与删旧 API 同波 |
| 架构 | [`separate-before-serializing-shared-state`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-separate-before-serializing-shared-state/SKILL.md) | 先分不同事实的写目标，真共享才用单写者、锁或 CAS |
| 验证 | [`prove-it-works`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-prove-it-works/SKILL.md) | 直接运行真实功能或检查实际数据，留下可重跑的证据 |
| 验证 | [`fix-root-causes`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-fix-root-causes/SKILL.md) | 沿运行找首个错的决定。若异常状态本身非法，回到生产它的地方 |
| 验证 | [`sequence-verifiable-units`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-sequence-verifiable-units/SKILL.md) | 每一步都有已知起点、一个改动、一种检验，按可证顺序交付 |
| 验证 | [`test-behavior-not-implementation`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-test-behavior-not-implementation/SKILL.md) | 坏行为应打红、换内部仍绿。预期从要求推出，走公共接口 |
| 验证 | [`explain-the-number`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-explain-the-number/SKILL.md) | 先定义决策、噪声和阈值，保样本散布、限速因素并排除错误测量 |
| 委派 | [`guard-the-context-window`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-guard-the-context-window/SKILL.md) | 批量源料留给分工，主上下文只收结论和原件指针 |
| 委派 | [`never-block-on-the-human`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-never-block-on-the-human/SKILL.md) | 可逆动作自行决定后说明，产品方向与不可逆动作仍留人决 |
| 元规则 | [`encode-lessons-in-structure`](https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-encode-lessons-in-structure/SKILL.md) | 重复提醒优先编码为结构约束，只有必须判断的事项留文字 |

## 文档与实际调用哪里不同，本次核到哪一层？

主题 5。装入技能只保证能读到说明，真实依赖和执行边界仍以调用原件为准。

- 镜像独立安装简表把 `interrogate` 放在可独立安装项，其正文明确要求 `arena` 与 `in-your-own-words`。
  `swarm` 等还会参考 `poteto-mode` 中的 Subagents，不安装 mode 会丢失角色策略。
  组合时按实际调用路径核依赖。
  Opening 文件笼统写所有 playbook 结束时调用。
  Investigation、Pause safely、Multi-phase plan 等有明确不同出口，应以具体 playbook 的边界为准。
  [简表][s68] · [Interrogate 调用][s69] · [Swarm 路由][s70] · [Opening][s71] ·
  [只读例外][s72] · [计划出口][s17]
- 多模型出现于候选生成、对抗找边界、评委和轨迹审看，实际行为证明落到可执行重跑。
  `Interrogate` 会滤掉无法执行的风险，而 `Blast radius` 能显式留下未证明项，调用者要先决定需要哪种产物。
  工程原则中“小改和消减复杂度”“非小改先造可重跑工具”和“验收目标优先”存在张力，各 playbook 给了具体取舍，例如 TDD 跳过重型测试、
  视觉一致性不改基线、原型以观察来决策。
  [Interrogate][s73] · [Blast radius][s74] · [最小改动][s75] · [可重跑工具][s76] ·
  [真实产物][s77]
- 本节是固定版本的文档和脚本静态阅读。
  脚本路径、输入、输出、退出与外部依赖均来自对应源码。
  这次未安装插件、运行脚本或打到 Cursor/Claude/Codex 的执行面，未验证模型可用性、GitHub PR 行为、Slack/tracker
  实现、Windows 状态图运行或任务成功率，也没有实测覆盖率、成本或质量提升的数字。
  源码指南中的例子反映设计用法。
  [流程指南][s78] · [验证与交付指南][s79] · [宿主映射][s9]

## 怎样回查原件？

| 正文编号 | 追踪标识 | 对应正文 |
| --- | --- | --- |
| 主题 1 | pinned-version-and-host | 这次读的是哪一版，运行依赖谁？ |
| 主题 2 | route-and-dispatch | 路由、主会话和专门技能怎样组合？ |
| 主题 3 | end-to-end-chains | 四条实际调用链怎样运行？ |
| 主题 4 | complete-catalog | 固定提交有哪些可用入口和原则？ |
| 主题 5 | cross-check-limits | 文档与实际调用哪里不同，本次核到哪一层？ |
| 要点 1 | pstack-composition-1 | 目标与主领 |
| 要点 2 | pstack-composition-2 | 按任务决定计划 |
| 要点 3 | pstack-composition-3 | 分角色模型配置 |

[s1]: <https://github.com/backnotprop/pstack/commit/4a4f41c46c67a006658ac17cef2d092593f6b26a>
[s2]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/plugin.json#L1-L18>
[s3]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/MIRROR.md#L1-L45>
[s4]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/SYNC-LOG.md>
[s5]: <https://github.com/cursor/plugins/commit/e58dd043600587dbaf58ba315e7f2b38373eeb43>
[s6]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/README.md#L32-L74>
[s7]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/.cursor-plugin/plugin.json#L22-L30>
[s8]: <https://github.com/cursor/plugins/tree/e58dd043600587dbaf58ba315e7f2b38373eeb43/harness/pstack>
[s9]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/SKILL.md#L102-L112>
[s10]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/docs/harness/claude-code.md#L15-L68>
[s11]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/SKILL.md#L9-L33>
[s12]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/SKILL.md#L84-L100>
[s13]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/worker.md#L1-L11>
[s14]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/agents/poteto-agent.md#L2-L10>
[s15]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/architect/SKILL.md#L7-L11>
[s16]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/prototype.md#L3-L14>
[s17]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/multi-phase-plan.md#L3-L11>
[s18]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/figure-it-out/SKILL.md#L9-L52>
[s19]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/setup-pstack/SKILL.md#L8-L78>
[s20]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/arena/SKILL.md#L11-L32>
[s21]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/docs/harness/claude-code.md#L31-L47>
[s22]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/bug-fix.md#L3-L15>
[s23]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/tdd/SKILL.md#L7-L42>
[s24]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/feature.md#L3-L21>
[s25]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/refactoring.md#L3-L16>
[s26]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-migrate-callers-then-delete-legacy-apis/SKILL.md>
[s27]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/arena/SKILL.md#L9-L48>
[s28]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/swarm/SKILL.md#L18-L43>
[s29]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/interrogate/SKILL.md#L9-L31>
[s30]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/blast-radius/SKILL.md#L13-L50>
[s31]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/README.md#L292-L300>
[s32]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/agents/comment-sicko.md#L14-L32>
[s33]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/no-comments/SKILL.md#L13-L24>
[s34]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/create-verification-skill/SKILL.md#L9-L44>
[s35]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/maintain-verification-skill/SKILL.md#L9-L39>
[s36]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/create-formal-verification-skill/SKILL.md#L9-L43>
[s37]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/maintain-formal-verification-skill/SKILL.md#L22-L58>
[s38]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/statechart/SKILL.md#L11-L82>
[s39]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/statechart/scripts/statechart#L1-L29>
[s40]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/statechart/scripts/statechart.ts#L90-L177>
[s41]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/statechart/scripts/worker.ts#L8-L34>
[s42]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/statechart/scripts/run.ts#L43-L102>
[s43]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/statechart/scripts/pipeline.ts#L57-L75>
[s44]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/statechart/references/render.md>
[s45]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/opening-a-pr.md#L3-L9>
[s46]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/babysit.md#L3-L10>
[s47]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/scripts/watch-pr/watch-pr>
[s48]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/scripts/bootstrap.ts#L17-L62>
[s49]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/scripts/watch-pr/cli.ts#L82-L150>
[s50]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/scripts/watch-pr/github.ts#L441-L504>
[s51]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/scripts/watch-pr/policy.ts#L423-L498>
[s52]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/scripts/watch-pr/policy.ts#L713-L812>
[s53]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/shipping.md#L3-L12>
[s54]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/autopilot-full.md#L3-L25>
[s55]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/autopilot-stack.md#L3-L8>
[s56]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/autonomous-run.md#L3-L13>
[s57]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/show-me-your-work/SKILL.md#L9-L82>
[s58]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/show-me-your-work/scripts/log.sh#L6-L42>
[s59]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/automations/benny/FOR_AGENTS.md#L5-L36>
[s60]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/automations/benny/skills/setup-benny/SKILL.md>
[s61]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/automations/benny/skills/triage-issue-reports/SKILL.md>
[s62]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/automations/benny/skills/reproduce-and-fix-issues/SKILL.md>
[s63]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/automate-me/SKILL.md#L7-L13>
[s64]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/make-bot-ui/SKILL.md#L9-L55>
[s65]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/README.md#L189-L240>
[s66]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/README.md#L302-L336>
[s67]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/README.md#L145-L171>
[s68]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/README.md#L42-L65>
[s69]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/interrogate/SKILL.md#L11-L25>
[s70]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/swarm/SKILL.md#L18-L33>
[s71]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/opening-a-pr.md#L1-L9>
[s72]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/investigation.md#L5-L14>
[s73]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/interrogate/SKILL.md#L15-L31>
[s74]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/blast-radius/SKILL.md#L31-L48>
[s75]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-laziness-protocol/SKILL.md>
[s76]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-build-the-lever/SKILL.md>
[s77]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/principle-prove-it-works/SKILL.md>
[s78]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/docs/guide/README.md#L3-L36>
[s79]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/docs/guide/06-verify-and-ship.md>
[pstack-eval]: <https://github.com/backnotprop/pstack/blob/4a4f41c46c67a006658ac17cef2d092593f6b26a/skills/poteto-mode/playbooks/eval.md>
