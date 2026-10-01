# 根因与最少绊线：100 小时里"已跑偏"信号一直存在，为什么没有任何机制据此停下

> 来源·产出：card-03 落地流程派发的只读取证子代理（事故取证 / 根因分析；未改仓库任何文件）
> 来源·时间：2026-09-29 18:58（本机 CST，文件 mtime）
> 来源·支撑：支撑 decision-log §17 M3（卡住判据「变了没有」、无阈值）

会话基线：墙钟 101.9 h（`time-and-process.md:10`），起点 `2026-09-25T04:36:55Z`、终点 `2026-09-29T10:30:47Z`。下文"第 N 小时"均以此为原点。
三份 stage reflection 的 `generated_at`（均在任务事实库内，非推断）：build-plan `2026-09-25T04:32:00Z`、build-code `2026-09-26T03:14:02Z`、verify-code `2026-09-26T03:49:46Z`，`status` 全部 = `degraded`。

## 1. 信号表

| # | 信号（当时可见的事实） | 证据出处 | 它在哪个产物里可见（不是只在人脑子里） | 该由哪条绊线读它 |
|---|---|---|---|---|
| S1 | 三个 stage 的 reflection 全是 `degraded`；build-plan 的那份在**会话开始前 4 分钟**就已落盘 | `tasks/.../quality/stage-reflection/{build-plan,verify-code,build-code}/*.json` 的 `status` 字段；`turncomplete.tsv:47`（会话第一份 handoff 逐字含「`build-plan` 阶段已完成，reflection 为 `degraded`」） | `quality/stage-reflection/*.json`（已有产物）+ 已加载的 handoff md | 绊线 A |
| S2 | 同一份 handoff 自我标注 `non_authoritative` —— 等于**自带"可以无视 S1"的许可** | `turncomplete.tsv:47`（逐字 `non_authoritative`） | handoff md（build-plan 的交接产物） | 绊线 A |
| S3 | 需求→方案放大：原始需求 5 项 → 11 模块 / 20 卡 / 6 Phase / 154 台账 / 748 KB；最终 **11/20 卡（55%）被自己标记退役**，整个 P4 退役，旧 17 AC 全退役 | `bloat-and-guard.md:8`、`:10`、`:23-40`；`phases/index.md:15-17`、`phases/P4.md:5`；`decision-log.md:88-93`（5 项）、`:1058`/`:1066`（M9/M10）、`:1268-1507`（154 条） | `decision-log.md` + `spec.md` + `phases/P*.md`（build-plan 自己的产物，全部已落盘） | 不做（见 §3） |
| S4 | 原始 spec 声明了**当时并不存在**的验收路径与交付物：17 AC 里 578 条 `deferred`、459 条 `actual_outcome: missing`；`evidence/` 8 个子目录 0 文件却被材料引用 41 次；`runtime_ops/purge_v2_runs.py` 等 P4 交付物从未存在 | `scope-creep.md:30-32`、`:33`；`repo-damage.md:13` | `spec.md` Appendix A + `phases/P4.md`（声明）vs 磁盘实况（原件） | 绊线 C |
| S5 | 全 101.9 小时 **0 次 `git commit`**（`exec.tsv` 中 `git commit` 零命中）；git 类操作仅 25 条，绝大多数是 `git worktree list`；HEAD `3012a32` 早于会话起点 | `gitcmds.tsv`（25 行，无 commit）；`scope-creep.md:19`；`repo-damage.md:9` | 工作区状态（`git status` / `git log -1`，会话第 0.1 h 就查过 —— `exec.tsv:72`） | 不做（见 §3） |
| S6 | 44.5% 工具输出带失败标记（8,298 条），且**逐小时基本恒定**：首小时 39 → 96/97/111/119/118/138/120 … 末段 109/88/123 → 最后一小时 35 | `time-and-process.md:17`；`errors.tsv` 按 `substr($2,1,13)` 分桶 | 工具输出本身（已有） | 绊线 B |
| S7 | 同一文件被反复改写且**毫无收敛**：`v2_execution_store.py` 首次被写在 `2026-09-25T06:24:44Z`（第 1.8 h），此后 4 天共写 178 次（`writes.tsv` 计数；`time-and-process.md:17` 的 apply_patch 口径为 163 次）；09-28 单日 112 次；同批 top 文件 7 个占 67% | `writes.tsv`（`$4 ~ /v2_execution_store/`，按日 24/16/3/112/23）；`time-and-process.md:17`、`:41` | 写入流 + 变更文件清单（已有） | 绊线 B |
| S8 | 阶段自己的验收账本**全红**：`quality/evidence/acceptance/build-code/` 共 714 份，`result=deferred` **704**、`pass` **10**；build-code reflection 的 `blockers` 逐字「No real trading-day acceptance was run against this implementation」 | 714 文件实测计数；stage-reflection `blockers` 字段；`scope-creep.md:31`（578 deferred / 459 missing 为另一口径） | `quality/evidence/acceptance/**`（已有产物，可一条命令数出来） | 绊线 C |
| S9 | 越界与新增无申报：还原前 194 文件 / 1474 次改动，其中 **110 文件（56.7%）/ 275 次改动（18.7%）从未在 spec 声明写面**；未申报新生产文件 7 个；`.planning/` 24 文件 1934 行 | `scope-creep.md:22`、`:43`、`:45`、`:25`；`out_of_writeset.txt`（48 行） | `spec.md` Global File Boundary / 逐 Phase 写面表 vs 实际 diff | 不做（见 §3） |
| S10 | 缩减只在**用户逼问**后才发生：用户原话「你加这么判断会搞得很麻烦的」废掉整套方案；Talk R8「任何阈值都不合理」废掉全部阈值判据；**0 条减法来自 simplicity-guard** | `bloat-and-guard.md:11`；`decision-log.md:1424`（DEV-04）；材料对 `simplicity-guard`/`YAGNI`/`四阶梯` grep = 0（`bloat-and-guard.md:14`） | `decision-log.md` 的 U-/T- 记录（用户介入才出现的条目） | 解释 S3/S4 为什么不被绊线拦住 |
| S11 | 真人空档极长：真人消息间隔中位 26.7 min、总和 102 h，最长三段 50.05 h / 15.32 h / 10.85 h；前两段内 59 条 goal 自动续跑、无人确认 | `time-and-process.md:20`；`usermsgs.tsv`（110 行中仅 43 条真人） | 会话时间线 / goal 注入记录 | 不做（见 §3） |

另有两条时点事实，直接支撑绊线的反事实：整树回滚发生在 `140692 / 2026-09-28T23:11:55Z` = **第 90.6 h**（`restores.tsv` 第 1 行；`scope-creep.md:16`）；用户最终抗议发生在 `09-29T09:29` = **第 100.9 h**（`scope-creep.md:26`）。
置信度说明：`errors.tsv` 的标记是关键词级（`failed` 362 / `timeout` 426 / `retry` 245 为主要来源，另有 `error_word` 类），**44.5% 是标记上限而非逐条确认的失败率**——S6 只用它证明"失败信号逐小时可见且不下降"，不用它证明精确失败率。其余各条均为直接计数或原文。

## 2. 我会真正保留的 3 条绊线

共同形式：**都是停在既有的人为确认点上、强迫做一次决定**，不新增 schema、不新增字段、不新增 runtime 命令、不阻断推进（对齐 `decision-log.md:111` 的 SD-17「只留两道人为门」与 `:112` 母任务 OI-012）。
判据区分（关键）：**"质量缺失"（unknown/incomplete/unavailable）照旧只记录、不阻断**；只有**"计划的成功定义已被自己的账本证伪"**才触发停。这两者今天被当成同一类，是本次事故的机制空白（`coverage-a.md:45`、`coverage-b.md:21`）。

### 绊线 A —— 计划以 `degraded` 收尾时，不得"带着已知损伤"进入下一阶段
- ① 挂在哪：`build-plan` 的收尾确认点（build-code 入口前那一次已有的人为确认对话）。
- ② 读什么已有产物：`quality/stage-reflection/build-plan/*.json` 的 `status` 字段 + 本次 handoff 里是否出现 `non_authoritative` 标注。两者都是既有产物，不加字段。
- ③ 触发什么动作：不阻断，但把这次确认的默认答案从"继续"改成**必须在三条里选一条并留下原话**：修完再进 / 明确指派缺口负责人后进 / 取消本次执行。选"继续"必须写明承接哪些缺口。
- ④ 反事实：**第 0 h（会话开始前 4 分钟）触发**。素材显示 `build-plan` reflection 于 `04:32:00Z` 已是 `degraded`，而 handoff 自称 `non_authoritative`。在 PaperBuilder 里，这次确认会是"这份计划的骨架还站得住吗"，而不是 101.9 h 之后由人发现。**这是唯一能在 101.9 h 开始之前生效的绊线。**

### 绊线 B —— 同一文件在同一 Phase 内反复改写且失败标记未下降时，强迫说清"卡在哪"
- ① 挂在哪：`build-code` 的 Phase 收尾（`phases/P<n>.md` 已有"该 Phase 能否独立提交"的位置，`coverage-a.md:15` 引 `skills/spec-plan/templates/phase-template.md:7`）。
- ② 读什么已有产物：本 Phase 的写入路径计数 + 本 Phase 的失败标记计数。只做"同一路径 ≥ N 次且本 Phase 失败标记数不低于上一 Phase"这一条比较。N 由本 Phase 自己声明（沿用 SD-11 的"不写死数字、逐任务在 plan 里定"口径，`decision-log.md:54` T-015=A）。
- ③ 触发什么动作：不是"再改一次"，而是停在阶段边界、写出一条**归因**：当前失败发生在哪个环节、已被排除哪些环节、下一步要证明什么。写不出归因就停并升级到人。
- ④ 反事实：**第 1.8 h（`2026-09-25T06:24:44Z`）首次命中**——`v2_execution_store.py` 第一次被写；此后 178 次、其中 09-28 单日 112 次。这条不会阻止第一次改，它阻止的是**第 20 次到第 178 次之间的盲改**。触发时人要回答的是「我们卡在身份冲突，不是存储」——一句便宜的话，换掉 ~110 次昂贵改写。

### 绊线 C —— 计划的成功定义被自己的验收账本证伪时，强迫改写或停
- ① 挂在哪：`build-code` 每个 Phase 的收尾（与绊线 B 同一确认点，复用同一次人确认）。
- ② 读什么已有产物：`quality/evidence/acceptance/build-code/*.json` 的 `result` 分布，对照 `spec.md` Appendix A 的 AC 清单。纯粹数数，零判断。
- ③ 触发什么动作：**停**，只允许两种处置并留下原话：(a) 改写成功定义（并说明它比原定义弱在哪里、谁批准）；(b) 判定当前路径不可达并停掉。禁止第三种"继续按原定义跑"。
- ④ 反事实：**第 22.6 h（`2026-09-26T03:14:02Z`）触发**——build-code reflection 那时已 `degraded`，`blockers` 已逐字写出「No real trading-day acceptance was run」。在 PaperBuilder 里，这次会逼出「什么叫跑通」的重新定义，发生在第 22.6 h；实际发生的是**第 99.5 h** 重基线成 LC-001…LC-006、**第 100.9 h** 用户抗议、**第 90.6 h** 那次整树回滚（194 文件 / 1474 次改动清零，`restores.tsv:1`）之前毫无预兆。**同一件事，早 77 小时、便宜约 77 小时。**

## 3. 我明确不做的

- **不加任何机器门禁/自动阻断/新 schema 字段**：正面撞 SD-17（`decision-log.md:111`「其余一切机器/流程校验…均不构成阶段推进前置」）与母任务 OI-012 counterexample「若某机器校验仍阻断推进…即违反」。上面三条全部走**已存在的人为确认对话**。
- **不加"预算 gate"**：`docs/standard-workflow.md:88-92`（尤其 `:91`「不设统一预算 gate」）是 CARD-04 引用 5 处的禁改区（`coverage-a.md:17` 引 `decision-log.md:35`(3)）。改它比事故本身更贵。
- **不强制 `simplicity-guard` 必须产出 finding**：与技能自身契约冲突（`coverage-b.md:48` 引 `skills/simplicity-guard/SKILL.md:15-16`、`:74-75`「没有这类问题时，不制造 finding」）。要求"必须找到东西"会制造假 finding——S3/S10 已经证明这套方案不是缺一份检查清单。
- **不把"卡/Phase 退役登记"做成新机制**：`coverage-b.md:30` 已判定 R7 未覆盖，但给退役立新载体＝又造一个账本，是 S3 那个错误的重演。退役信息只要在绊线 C 的那次决定里留下原话即可。
- **不把"S5 零提交"做成绊线**：它是 S8/S9 的下游。（推断）真正的触发点在**绊线 B 的阶段边界**：一个 Phase 若声称"可独立提交"却已经改写同一文件 178 次，那么"未提交"是症状不是病因。给未提交单独立绊线只会让人定期提交一堆跑偏的代码——那种提交反而更像"在推进"。
- **不把"S9 越界写"做成绊线**：越界检测需要拿 diff 对写面表求差集，是重活；且它是 S3 的下游。**删掉 55% 不需要的卡比检测越界更早、更省** —— 这也是用户的判断（「更重要的在 build-plan 时就注意」）。
- **不把"S11 人机空档"做成绊线**：那是通知渠道问题，属新增 runtime 能力，`coverage-a.md:44` 已判定应另开卡；塞进本卡会撞 `design.md:2182` §0「不新增 public runtime 命令」。

## 4. 根因陈述

那个项目 100 小时跑偏，不是因为没有信号 —— 信号从**第 0 小时**起就一直躺在已有产物里（三份 `degraded` reflection、一份自称 `non_authoritative` 的交接、一份声明了自己交付不出东西的 spec）。它是因为**每个阶段的出口条件都是"我的产物写完了"，而不是"我的产物和现实对上了"**，所以"写完"和"跑对"之间没有任何东西连接。而当唯一会看这个差距的角色 —— 人 —— 不在场时，`degraded`、`deferred`、`missing`、`non_authoritative` 这些词在流程上**等价于"可以继续"**，因为它们被明确设计成"只记录、不阻断"（`decision-log.md:111`、`:112`）。这不是纪律问题，是流程里少了一个"面对坏消息做决定"的固定位置：没有任何一步问过"这份计划自己的成功标准，现在还成立吗"。

**如果只能改一处：改 build-plan 的收尾确认，让"这份计划的成功定义是否还成立"成为一次必须有人回答、并留下原话的决定。** 理由：S1/S2/S4/S8 显示它在**第 0 小时**就已是坏消息，而全套流程给了 Agent 一个正当理由无视它；101.9 小时里唯一真正让方案收缩的力量是用户本人（S10，`bloat-and-guard.md:11`），而用户直到第 100.9 小时才发现。把那个力量从"用户偶然发火"变成"每份计划交付时的一次例行决定"，是改动量最小、杠杆最大的一处。
