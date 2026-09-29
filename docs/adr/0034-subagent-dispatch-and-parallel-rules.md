# ADR-0033：五阶段统一的子代理派发方法与并行规则落地形态

## 状态

已确认（2026-09-26，任务 `workflowhub-thin-core-card-03-20260919` 的 make-decision 阶段）。方向已选，尚未实施。

决定来源：该任务 `specs/workflowhub-thin-core-card-03-20260919/decision-log.md` 的
T-006/T-007/T-010/T-011/T-012/T-014/T-015 与该任务 OI-002/OI-004/OI-010/OI-011。
上位依据：母任务 `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:69-71`
（SD-11 并行规则五件套）与 `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:93-95`
（SD-17 两道人为门与零机器门禁）。

事实依据：三份真实会话审计 `/tmp/wh-card03-session-analysis/s0921a.md`、
`/tmp/wh-card03-session-analysis/s0922a.md`、`/tmp/wh-card03-session-analysis/s0922b.md`；
外部一手调研 `/tmp/wh-card03-session-analysis/research-external-orchestration.md` 与
`/tmp/wh-card03-session-analysis/research-subagent-contract.md`。

## 背景

三份真实会话审计把「成本花在哪」量化了出来。card-02 的 build-code 会话花掉 4.548 亿 input、
10 小时 21 分墙钟，其中真正跑 shell 只占 4.7%；子代理回传的 1.914 亿 input 占全会话 42%，
机制是 21 个子代理全部继承父代理全量转录（`/tmp/wh-card03-session-analysis/s0921a.md:347`、
`/tmp/wh-card03-session-analysis/s0921a.md:416`）。同一会话里 60 秒空转轮询的等待段占墙钟 42%、
占主线程 input 27%（`/tmp/wh-card03-session-analysis/s0921a.md:367`）；card-05 的审计独立得出
同一量级——27% 的 token 花在轮询「完成了没有」（`/tmp/wh-card03-session-analysis/s0922b.md:9`）。
card-07 的审计显示真正的开发在第 56 分钟就基本结束，之后 6 小时 36 分钟消耗在「跨 phase 的
全量快照绑定让任何一处共享文件改动都把四个 Phase 的证据判为过期」引发的重跑上，可回收
60–90 分钟墙钟/会话（`/tmp/wh-card03-session-analysis/s0922a.md:347`）；重复劳动同样可量化——
同一测试文件最多跑 28 次、同一源文件最多重读 26 次（`/tmp/wh-card03-session-analysis/s0921a.md:20`），
重读率 2.9×（379 次读 / 129 个文件）、重复检索 3.3×
（`/tmp/wh-card03-session-analysis/s0922a.md:316`）。

与之对照，SD-11 五件套（`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:70`：
①接口蓝图冻结 ②依赖感知调度 ③中心化验证瓶颈 ④worktree 隔离 ⑤并发上限 2–5 个子代理）
的第 1、4、5 条在三份审计里没有任何对应故障记录；第 3 条方向相反——审计显示验证不是瓶颈，
而是被重复触发：`/tmp/wh-card03-session-analysis/s0922a.md:229` 记录同一
`verify --action=execute --stage=build-code` 逐字重复 28 次、`review --action=record` 9 次，
全部由全量绑定过期触发，而非验证本身供给不足。外部一手证据也把「中心化验证瓶颈」定位为
选择并行时要接受的代价，而不是一条待设计项
（`/tmp/wh-card03-session-analysis/research-external-orchestration.md:541-543`）。

同时，全仓库现状盘点显示五件套的五个关键词在 `workflows/` 下零命中，机制从未落地
（`/tmp/wh-card03-session-analysis/card03-baseline-gap.md:88`）；子代理产出契约在四个阶段技能里
覆盖为零：`AGENTS.md:14-15` 与 `CONSTITUTION.md:144-145` 只写「主会话只收摘要」，
`skills/deep-research/SKILL.md:33-35` 只要求回传「来源、关键证据、冲突、置信度和未决项」——
全仓没有任何一处要求「先落盘再回传」（逐条盘点见
`/tmp/wh-card03-session-analysis/research-subagent-contract.md`）。

## 决定

1. **五阶段统一的子代理派发方法**。`make-decision`、`build-prd`、`build-plan`、`build-code`、
   `verify-code` 五个阶段都按**工作类型**（实施、测试、审查、修复）派发子代理，
   实施、测试、审查各自使用独立上下文。派发单位是工作类型，不是流程 step 序号。
   `workflows/make-decision/SKILL.md:331-360` 的 M/S/B/P 执行模型（M＝主会话、S＝子代理、
   B＝后台、P＝并行）是这一方法的现有记号，本决定把它推广到全部五个阶段。
2. **修复回到原实施子代理**。「连续上下文」＝回到**同一个子代理会话**继续
   （允许该会话中途被上下文压缩），并附上审查/测试发现的原文；不为同一份实现另起新执行者。
   派发与回收由主会话做；主会话不承担大量阅读与编辑，只做派发、回收与交互类技能执行。
3. **并行规则的重排**。SD-11 五件套全部保留，但降为并列条款之一；四条有实测数字支撑的纪律
   提升为**同等权重正文**：① 禁止子代理继承父代理全部对话（实测占一次会话 42% 成本，
   `/tmp/wh-card03-session-analysis/s0921a.md:347`）② 取消空转轮询（实测 27%，
   `/tmp/wh-card03-session-analysis/s0921a.md:367`、
   `/tmp/wh-card03-session-analysis/s0922b.md:9`）③ 把跨 phase 的全量快照绑定收窄到该 phase
   声明的写集（实测 60–90 分钟/会话，`/tmp/wh-card03-session-analysis/s0922a.md:347`）
   ④ 禁止重复读同一文件、重复跑同一测试
   （`/tmp/wh-card03-session-analysis/s0921a.md:20`、
   `/tmp/wh-card03-session-analysis/s0922a.md:316`）。这四条写入五阶段共用纪律，
   不新增 stage、gate 或材料。
4. **并发写成区间，不写死数字**。SD-11 的「2–5」作为**区间约束**写进五阶段共用纪律；
   具体每个任务开几个并发，在 build-plan 的并行方案里逐任务定。外部一手依据：
   Claude Code 官方文档 `Start with 3-5 teammates for most workflows`、
   `Three focused teammates often outperform five scattered ones`，并明确并发度
   **不随任务数线性增长**（`If you have 15 independent tasks, 3 teammates is a good starting point.`；
   `/tmp/wh-card03-session-analysis/research-external-orchestration.md:148-149`）。
5. **接口清单是事实记录，不是冻结门禁**。SD-11 第 1 条「接口蓝图冻结」降级为
   「**接口符号清单（事实记录）**」；未声明或声明不实（实跑读写越出声明集）＝**验收失败事实**，
   如实记录，**不阻断派发**。这与 SD-17 及母任务 OI-012「新系统只有两道人为门」对齐。
   外部证据同向：真实已合并 PR 对里的接口干扰率仅 1/834 ≈ 0.12%，作者明说该数字不能用于
   估计现实发生率（`/tmp/wh-card03-session-analysis/research-external-orchestration.md:357-361`）；
   唯一被量化验证的修复手段是事后告知，不是事前冻结（见下条）。
6. **补上并发方广播已完成改动**。每个工作包完成时，把「我改动了哪些对外符号」广播给仍在运行
   的并发方。这是唯一有外部实测数字支撑的冲突缓解手段——arXiv:2609.25396：
   「描述并发改动已完成的一条消息恢复了 82% 的运行」——而 SD-11 五件套原先完全没有这一条
   （`/tmp/wh-card03-session-analysis/research-external-orchestration.md:359`、
   `/tmp/wh-card03-session-analysis/research-external-orchestration.md:517`、
   `/tmp/wh-card03-session-analysis/research-external-orchestration.md:581`）。
   引用该论文时必须带上作者限定：构造场景的高干扰率不可用于估计现实发生率
   （`/tmp/wh-card03-session-analysis/research-external-orchestration.md:361`）。
7. **合并责任归产出方**。产出方自己提交、自己开 PR，不由主会话统一合并；发布失败也不是回滚，
   而是如实上报发布到了哪里。失败时**换一个新执行者重做，不回滚**已完成的部分
   （外部一手做法，`/tmp/wh-card03-session-analysis/research-external-orchestration.md:191-194`、
   `/tmp/wh-card03-session-analysis/research-external-orchestration.md:210-214`）。
8. **worktree 隔离的配套清单**。每 worktree 需重装依赖、把 gitignored 的 `.env` 之类搬进新
   worktree、**禁止 symlink 依赖**、分支独占改为 detached HEAD、磁盘占用是 O(N) 的真实成本
   因而需要清理
   （`/tmp/wh-card03-session-analysis/research-external-orchestration.md:288-292`、
   `/tmp/wh-card03-session-analysis/research-external-orchestration.md:305-307`、
   `/tmp/wh-card03-session-analysis/research-external-orchestration.md:314-317`、
   `/tmp/wh-card03-session-analysis/research-external-orchestration.md:554-555`）。
9. **子代理产出契约**：**先落盘 → 只回摘要与 ref → 按子问题增量**。四个阶段技能现在都没有
   这条，需要补（术语定义见 `CONTEXT.md` 的「子代理工作方法术语」节）。
10. **三条执行卫生写成可观察形态**，其余条款保持原则性短措辞：① 禁止子代理继承父代理全部
    对话 ② 禁止空转轮询 ③ 「声明不实怎么被发现」——给独立审查一条可执行的核对动作
    （把声明的读集/写集与实跑读写逐项对照），使「声明不实＝验收失败事实」不沦为只靠人工
    判读的口号。

## 理由（ADR 三项判据）

- **难以反转**：五阶段统一派发方法与四条通用纪律一旦写进 `AGENTS.md` 与五个阶段技能，
  就成为常驻上下文的一部分；后续任务按它工作，改回来要重新评估全部下游约定，
  并有实测成本对照。
- **无背景会意外**：未来读者会问「为什么 SD-11 五件套明明是需求还降成并列条款」
  「为什么接口清单不再叫冻结」「为什么并发是一个区间」。没有本文，这些看起来像执行走样，
  而不是有意取舍。
- **真实取舍**：存在可行替代（维持五件套为主交付、把实测根因另立新卡、沿用已有术语、
  由主会话统一合并、整条绑定修补推迟给后续卡），且每条都被具体理由否决，不是因为没考虑。

## 被否决的替代方案

- **维持五件套为主交付**：五件套的第 1、4、5 条在三份审计里没有对应故障，第 3 条方向相反；
  照字面把它们做成待设计项会引入三家主流 agent 团队都没有的机制。
- **把实测根因另立新卡**：根因（子代理继承全量对话、空转轮询、全量绑定、重复读跑）正是本卡
  方法面要落地的内容，另立新卡等于让本卡交付一个已知有浪费的方法。
- **沿用仓库已有的「阶段协调者 / Phase 执行者」措辞而不立「子代理」**：那套措辞把职责绑在
  `build-code` 的 Phase 序号上，与「按工作类型派发、五阶段统一」不是同一件事；两套词并存会
  让同一职责有两种叫法，正是审计反复认定的「同一判据两处权威」根因。
- **把「声明不实」交给主会话事后人工判读**：主会话正是声明方，自审自判违反独立来源原则，
  而且没有可核对的动作。
- **由主会话统一合并**：制造单点集成瓶颈，且与「产出方自己发布」的外部一手做法相反。
- **整条快照绑定修补取消、完全交给后续的薄核心删除卡**：审计显示这一条单独就吃掉
  60–90 分钟墙钟/会话；全部推迟等于让本卡交付的方法保留已知的重复触发源。

## 影响与边界

- 本 ADR 只记录方法面方向与取舍；它**不**改变五个 stage 的拓扑、质量门或 `CONSTITUTION.md`
  条款，也不新增 stage、public command、材料、门禁或确认点。
- **本卡的时间边界**：用户已明确本卡**现在只做 make-decision**；`build-plan` 推迟到 CARD-04
  交付并合并进主干之后。因此本卡在 make-decision 阶段**不实际改任何 `workflows/*/SKILL.md`**，
  只产出接口与方法面的冻结候选与计划。与 CARD-04 的写面碰撞由**时间错开**消解，
  不需要现在交涉。
- 落地时的已知代价如实登记：`workflows/make-decision/SKILL.md:357` 现有的固定并行上限
  （研究 4 / debate 4 / 红蓝 2）要与「2–5 区间」对齐；`AGENTS.md` 是常驻上下文文件，
  新增条款必须克制。
- 术语侧同步：`CONTEXT.md` 新增「子代理（subagent）」与「子代理产出契约」两条，
  明确与既有「技能」「阶段协调 / Phase 执行」「Phase 审查」区分。
- 未覆盖项如实保留：该领域最强的量化实证只覆盖成对 patch，3 个以上并发方的语义干扰无数据；
  「声明制」本身的收益也仍未被量化验证
  （`/tmp/wh-card03-session-analysis/research-external-orchestration.md:369`、
  `/tmp/wh-card03-session-analysis/research-external-orchestration.md:633`）。
