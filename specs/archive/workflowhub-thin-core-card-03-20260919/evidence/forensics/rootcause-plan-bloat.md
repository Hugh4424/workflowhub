# 根因：build-plan 里"再加一张卡"为什么是局部最优

> 来源·产出：card-03 落地流程派发的只读取证子代理（事故取证 / 根因分析；未改仓库任何文件）
> 来源·时间：2026-09-29 18:58（本机 CST，文件 mtime）
> 来源·支撑：支撑 decision-log §18 E1/E5/E6（一个 Task 一个交付增量、读既有减法载体、切片纪律）

读面（只读）：`workflowhub-workflowhub-thin-core-card-03-20260919/{workflows/build-plan/SKILL.md,workflows/build-plan/steps.json,docs/standard-workflow.md,skills/spec-plan/templates/phase-template.md}`、card-04 归档 `decision-log.md:1911-2043`、PaperBuilder 材料、转录（流式 grep，未整读）。未改任何仓库文件。
下文 `SW:` = `workflowhub-workflowhub-thin-core-card-03-20260919/docs/standard-workflow.md`；`SKILL:` = 同 worktree `workflows/build-plan/SKILL.md`；`PB:` = `PaperBuilder-paperbuilder-live-simulation-durability-post-20260925/specs/paperbuilder-live-simulation-durability-post-20260925/`。

## 1. 机制（根因）

**一句话**：整套 build-plan 规则只朝"覆盖"一个方向打分——不许漏，且允许把"未知"合法地转成工作量；"只加不减"从来不是缺陷，因为**没有任何一条要求、谓词、字段或台账槽位能表达"这一项不需要"**，而"多加一张卡/一条台账"在每一道上都恰好是零风险、可审计、且唯一有机器回报的动作。

五条带出处的具体机制：

1. **唯一硬门奖励"卡多得下去"，不奖励"卡该不该有"**。build-plan 唯一的机器必填是 `validatePostPhaseContract` 的 17 个字段（`SKILL.md:1-60` 段契约；card-04 `decision-log.md:1938` 逐字记为"本卡唯一的'填不出即不能推进'的既有机器必填"），且要求"`### Tnnn` 独立卡，一行 Tasks 不够"（`decision-log.md:1940`）。谓词只有下限：`steps.json:10` 的 `spec-plan` observable_result 要求"each post-cohort Phase 是独立工程权威 + 每条适用行为测试预写并实测目标 RED"，`steps.json:11` 要求"每个 Task 都带 risk/scenario/command/oracle/evidence/coverage limit"。**没有任何谓词、字段或槽位对"多出来的模块/卡/台账"扣分或提问** ⇒ 局部最优第一支点。
2. **"减"没有法定落点，"加"有**。合法的"不做/未知"表达只有 `unknown`/`unavailable`/`incomplete` 三个诚实标记（`SW:294`「核不到的东西写成 `unknown` 与它的负责人」），它们**只吸附到已存在的卡上**；而"这件事不需要"、"这张卡删掉"在 `phase-template.md` 里没有字段（`phase-template.md:39` `非目标`行原文只要求写"本 Phase 明确不做的事"，是**对着 Phase 自己写**，不是对着新发现的对象写）。
3. **"未知"被明文要求转成"任务"，等于把未知变成新增工作量**。四个活谓词**只在漏项方向判缺陷**，无一要求对"多出来的对象"提问：`SKILL.md:198+30`「Cross-check … for omissions, contradictions, orphan tasks, boundary widening, missing two-way traceability」；`SW:288-289`「缺 AC/FR 映射、任务无真实 oracle、文件边界不明、依赖未解决或 DEFER/OPEN 没有 owner/触发条件/消费者/关闭条件时，当前 stage 修复后再交接」；`SW:300-301`「每个行为风险都必须落到可执行任务和真实 oracle **，不能用任务数量、文件列表或测试命令字符串代替设计质量**」（只禁"用数量冒充质量"用了多少张卡，不禁"加卡"）；PB 侧同型条文逐字见证结果：「### F-027 登记的未核实项（**build-plan 必须逐条转成验证任务**）」（`PB:decision-log.md:2113`）——7 条未核实项直接变成任务。
4. **审查产出被折算成"处置表 + 台账条目"，而台账条目按类型逐条登记、只增不减**。`SKILL.md:198+42` 要求 findings 逐条处置为 `fixed/rejected_invalid/accepted_risk/needs_human` 并在同 task 修复；台账槽位由 8 类构成（`PB:decision-log.md:1268-1507` 的 DECL 41/CUR 26/DEF 5/NG 14/OPEN 14/OI 29/RISK 18/DEV 7 = 154），且合并规则只禁"两套账本"、不禁"条目变多"（`PB:decision-log.md:579-584`：F-010 候选池 34 条只允许"折叠/提升/不占号"三种处置 ⇒ 净 +7 OI）。**每条 finding 都有归宿，"删除"不是归宿**。
5. **激励不对称的最终形态：完美的合规计划长得就像臃肿计划，所以没人能报警**。PB 的 20 张卡（`PB:phases/P1.md` 6 + `P2.md` 4 + `P3.md` 2 + `P4.md` 2 + `P5.md` 4 + `P6.md` 2 = 20，实测 grep）每张都有写集、依赖、oracle、RED、风险、覆盖上限；八类台账每条都带 `file:line` 依据；五维覆盖矩阵每格都有凭据（`PB:decision-log.md:1257-1267`）。**膨胀不是失职的产物，是满分合规的产物。**

**局部最优是怎么形成的（可复述的决策链，每步当时都合理）**：一条未核实项出现（`PB:decision-log.md:2113`）→ 它是 `OPEN`，而 `SW:288-289` 判"DEFER/OPEN 没有 owner/触发条件/消费者/关闭条件"是缺陷 → 唯一的合法消解动作是给它一个 owner 和关闭条件 → owner 最自然的载体就是一张卡 → 每张新卡按 `steps.json:11` 自动带来自己的 blueprint/oracle/route/coverage limit → 第 9 步 review 对新增文本再出 findings → findings 逐条处置，每条需要一个归宿（`SKILL.md:198+42`）→ 归宿又写成台账条目（8 类槽位随时可写）→ 回到起点。**这条链上没有任何一步可以被判为"错"，也没有任何一步会因为"东西变多了"而被拦下——直到用户开口。**`PB:decision-log.md:1424`（用户原话「没必要判重吧，直接启动已停用的实时 run 就可以了，**你加这么判断会搞得很麻烦的**」）与 `PB:decision-log.md:21`（Talk R8「**任何阈值都不合理**」）是两次由人从链外打断；`bloat-and-guard.md` 已证全部减法由此而来。

## 2. 四条能在计划阶段防住的机制

### M1（主）——"孤儿模块" 必带一条"不做或另开"的论证
- **一句话**：`spec.md` 的模块清单里，任何**追不到任何一条原始需求**的模块，必须在同一行写明"来源/故障/硬约束 + 为什么不能删或另开任务"，并**当场二选一**：删除，或移出本任务范围。
- **落在哪**：build-plan step 6 `spec-plan`（`steps.json:10`，Phase 文件与 `spec.md` 全局设计同时定稿的那一步）；载体就是 `spec.md` 既有"范围/模块"节，加一张表，不新增文件、不新增 step。
- **读什么→产出什么**：读 `decision-log.md` 的原始需求矩阵（PB 侧形态 = `PB:decision-log.md:1239-1253`，5 条用户需求 → R-001…R-010）与 step 7 模块收敛表；产出两列——`mod → R-xxx`、`孤儿? + 处置`，每个孤儿模块一行论证。
- **代价**：稳态一行/模块；最坏是**本文四条里唯一可能多一轮的**——当某个孤儿被判"删除/移出"时，它已经写进 Phase 文件，要重跑一次 `spec-plan` + `testing-system-blueprint`。不新增 review 轮次（step 9 读表即可），不新增 gate（判错只记事实）。
- **反事实重跑 PaperBuilder**：5 条用户需求（`PB:decision-log.md:88-93`）× 矩阵落地列（`PB:decision-log.md:1246-1253`）逐条对账，11 个模块里**只有 M9（CPU 治理）与 M10（25 提交质量闸）追不到原始需求**——M10 是 R-006 m00607 的用户原话（有矩阵行，不触发），M9 在 Talk R1 被否、只因用户一句 m00607 重新纳入（`PB:decision-log.md:1430` DEV-05）。⇒ 机制会在 step 6 直接砍 M9 一个模块与 `PB:decision-log.md:1058` 的整节；M7（长跑有界内存）追 R-007（`PB:decision-log.md:1251`）、M8 追 R-003，都会触发"来源贴出"这一问。20 张卡里 T003/T004/T005/T018（P1，导出/purge/snapshot/retention/JSON CTE）、T007/T008/T019（P2）、T014/T020（P5）共 **10 张**，在能追到需求的卡里占比最低，正是最先被孤儿论证波及的一批。

### M2——"删除/退役"必须是一等条目，且只有下过否决的那一方能推翻否决
- **一句话**：台账条目类型在"新增/保留"之外必须有"退役"这一等条目（编号 + 日期 + 理由 + 是谁要求的）；未经用户明确推翻的旧否决不得恢复。
- **落在哪**：build-plan step 6→7 之间，落 `spec.md`/`phases/index.md` 既有台账；**只登记不阻断**。规则文本本身取自 card-04 已冻结的 `B-12`/`BP-R12` 家族（`workflowhub/specs/archive/workflowhub-thin-core-card-04-20260919/decision-log.md:2040`、`:2017`）。
- **读什么→产出什么**：读上一版材料 + 用户原话；产出"本次删掉了什么"清单，以及每一条恢复项所引用的"是哪位当事人推翻了自己哪一条"。
- **代价**：每轮一行；零新增轮次。
- **反事实重跑 PaperBuilder**：他会把 20 张卡压到 **9 张以内**——`PB:phases/index.md:12-16` 显示 11/20 张卡与整条 P4 是**事后**才被标退役的，机制把这一步前移到计划期：凡"必须证明需要它、否则不写"的卡在写卡前就被砍；同时 M9 不会被悄悄复活（DEV-05 要求引用"用户自己推翻 DECL-08"这条原话，恰好成立，但必须逐字贴出）；OI-19/OI-20 这类"因范围收缩而失去对象"的条目（`PB:decision-log.md:1399-1400`）会被登记为退役而不是无声消失。

### M3——审查必须交付"删除类发现"这一分类计数
- **一句话**：每轮计划审查（`simplicity-guard` / `plan-eng-review` / merged review）除了 findings 总数，必须单独报"删除类 finding = N"并逐条给出"删哪张卡/哪个模块/哪条台账"，每条带 `P0/P1/P2/P3` 之一。
- **落在哪**：`skills/plan-eng-review/SKILL.md` 的第 9 条对账总闸之后（card-03 已冻结的落点 `design.md §14.16`，见 `/tmp/pb-forensics/coverage-b.md` 第 40 行给的位置）；`phase-template.md:39` `非目标`行内联半句"并列出本 Phase 相对上一版删掉的对象；没有就写 `N/A — 无删除`"。
- **读什么→产出什么**：读冻结材料 + 原始需求条数；产出"删除类 finding"清单，即"该删的是否还在"。
- **代价**：每轮多一个段落、每 Phase 多一行；零新增轮次（复用既有第 9 步与处置表）。
- **反事实重跑 PaperBuilder**：PaperBuilder 的 canonical 审查已产出 39 条 findings（`workflowhub/specs/archive/workflowhub-thin-core-card-04-20260919/decision-log.md:1862` 同型交付描述），但**全是"防遗漏"方向**；机制要求其中单列删除类，把 11 张待退役卡 + 整个 P4 变成**审查期**就能给出的编号清单，而不是四天后由用户逼出来。**注意**：机制只要求"报告读数"，不要求"必须有删除类 finding"——`skills/simplicity-guard/SKILL.md:15-16`、`:74-75` 明确"没有这类问题时不制造 finding"；设配额会直接制造假发现。

### M4——步骤清单自身的"删除对账"，在第一张卡之前先跑一次
- **一句话**：从决策材料的每条 OI/handoff 项到计划对象逐条对账；对不上的项只能写 `N/A + 原因` 或删除，**不得转成任务**——即 `PB:decision-log.md:2113` 那句"必须逐条转成验证任务"的镜像条款。
- **落在哪**：`workflows/build-plan/steps.json` 既有 step 序（1→2→3）的空隙处的**文本纪律**，不改拓扑、不加 step；或落 `SW:290-294` 既有"可执行性核对"段落之后一行。
- **读什么→产出什么**：读 `decision-log.md` 的 OI/DEFER/OPEN 清单与原始需求条数；产出"预期对象数 vs 计划对象数"两条数，与差额逐条处置（删除 / `unknown` + owner / `N/A + 原因`）。
- **代价**：每轮一段；零轮次。
- **反事实重跑 PaperBuilder**：F-027 的 7 条未核实项（`PB:decision-log.md:2113`）不再变成 7 个工作项；F-010 候选池 34 条（`PB:decision-log.md:584`）里"属实现细节"的部分按既有合并规则归入执行者裁定项而不是新卡；台账 154 条（`PB:decision-log.md:1268-1507`）里 DEF 5 / OPEN 14 / OI 29 这三类"未来导向"条目会被显式对账，能在计划期写 `unknown + owner` 的就不落成卡。

## 3. 我原来那 11 条补丁里，哪些因此变得多余

以 `coverage-b.md` 表内 11 条"最小补充文本"为口径（R1–R6、R8–R13 中供实施的那些）：
- **多余（M1 取代）**：R1「阶段收尾 diff 路径 ∖ 声明写入集求差集」、R3「新增文件对账：列出本 diff 新增路径逐条须指到 Phase 声明的『新增』清单」、R6「规模对账：模块/Phase/卡/台账条目数与 decision-log 原始需求条数并列」。⇒ 它们都是**报告类差集**，靠事后浮现；M1 把同一条数**绑在门禁点上**（`spec-plan` 的必经产物），比"阶段收尾记一行"强，故这三条不必再单独立项。
- **多余（M2 取代）**：R7「`phases/index.md` 记一行『退役：编号+日期+理由+是谁要求的』」（M2 的机制 ① 就是它，且升格为一等条目类型）、R12 后半句「未被用户明确推翻的旧否决不得恢复」（M2 的机制 ② 就是它）。
- **多余（M4 取代）**：R8 的第 3 条补丁「build-code 摘要必须写明本轮的量」——它把问题扔到 build-code 去观测；M4 在计划期就问"预期对象数 vs 计划对象数"，观测点前移，故该条只剩"披露"功能。
- **不多余（M1–M4 都不覆盖，建议保留）**：R2（禁改路径收尾核对——它治的是越界，不是膨胀）、R4（新增行为命中 spec 非目标列表即退回）、R5（权威材料只就地增补、禁止 delete+add 整体替换）、R9（摘要必须给 AC 达成/未达成/deferred 条数）、R10（AC 依赖真实外部服务/浏览器/计费者须写明"在哪次真实会话、哪条命令验证过"）、R13（非交付产物路径 + 归属 + 保留/删除）。
- **净结果**：11 条里 6 条（R1/R3/R6/R7/R12 + R8-③）被 M1–M4 覆盖或前移，只剩 5 条各自独立的补丁；且 M1–M4 全部落在既有 carrier（`spec.md`、`phases/index.md`、既有审查、`steps.json` 既有步骤）上，不新增 dependency、schema、字段或门禁——符合 card-04 `B-01…B-12`（`workflowhub/specs/archive/workflowhub-thin-core-card-04-20260919/decision-log.md:2029-2040`）。

## 4. 风险：机制自己会不会变成新的臃肿/新的门禁

- **M1 会被"数字游戏"绕过**：作者会把新工作塞进**已计入的卡**里（改卡不增数），卡变胖而计数不变。边界：M1 只回答"这个模块该不该存在"，管不住单卡内部膨胀；要补只能靠"卡 → 原始需求"的同一张表在卡层面再问一次——**再往下就会变成给每张卡加字段，那正是被 `design.md:592` 判掉的方向**。**因此 M1 的边界是"只到模块/Phase 层"，不要再下沉。**
- **M2 会变成"顺手砍掉真需求"的许可证**：退役条目一旦有正式槽位，砍卡的边际成本就变低。边界：删除必须带"已跑过的验证证据/这是否消耗了真实资源"（`PB:phases/P4.md:5` 的 P4 就是"清理"这种真需求被整体砍掉的反例——用户要大扫除，计划里却先立再废）。取证材料的数字不写进机制：**不设阈值**，只要求逐条论证。
- **M3 最容易腐烂**：把"删除类 finding 计数"当 KPI，就会直接制造假发现（用户已明确"任何阈值都不合理"，`PB:decision-log.md:21` 同轮的另一句正是废掉全部阈值判据）。边界：**只报告读数，不设配额、不设通过条件**；"加载了但零发现"与"未加载"必须分开写（这正是 `bloat-and-guard.md` 里 simplicity-guard 名义提及 90 命中 / 0 finding 的教训）。
- **M4 有反向压力**：不落成卡就没有载体、没有成本，于是"每个明确项都得有个家"的老习惯会把清单推回"一项一张卡"。边界：M4 只对账**数量与归属**，不许要求"每个 OI 必须有落点"（那会退回 `SW:288-289` 的缺陷面）。
- **四条共同的边界（必须写死在机制文本里）**：① 不新增门禁，判错只记事实、不阻断（宪法与 `AGENTS.md`「质量/进度事实不是许可证」）；② 不新增文件、字段、schema 或 step——全部落在 `spec.md`、`phases/index.md`、既有审查与既有步骤上；③ 不设任何数字阈值，只有"逐条给理由"；④ 不撤销"唯一机器必填"（17 字段 + 独立 `### Tnnn` 卡）：那是用户花在定位入口和必需字段上的钱，本条根因的杠杆是补齐**反方向**（把"这项不需要"变成一等对象），而不是拆掉正方向。
