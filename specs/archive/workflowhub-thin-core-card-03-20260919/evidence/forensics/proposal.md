# PaperBuilder 事故 → 一套成体系的改法（三份根因报告合成终稿）

> 来源·产出：card-03 落地流程派发的只读取证子代理（事故取证 / 根因分析；未改仓库任何文件）
> 来源·时间：2026-09-29 19:22（本机 CST，文件 mtime）
> 来源·支撑：支撑 decision-log §17 全部五条机制（M1–M5）的原始方案本体

只读合成，未改任何仓库文件。时间口径：会话起点 `2026-09-25T04:36:55Z`、终点 `2026-09-29T10:30:47Z`、总 101.9 h（`time-and-process.md:10`）。`W` = `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-03-20260919`；`D` = `W/specs/workflowhub-thin-core-card-03-20260919`。下文小时一律以 UTC 起点为原点（§3(a) 有时区裁断）。

## 1 一句话根因

每个阶段的出口条件都是「我的产物写完了」，不是「我的产物跟现实对上了」：于是 `degraded`（三份 stage reflection 全是）、`deferred`（`acceptance/build-code/` 714 份里 704 份）、`missing`、`non_authoritative`（会话第 0.1 h 的 handoff 自称）这些坏消息，在流程上统统等于**放行条**——因为它们被明文设计成「只记录、不阻断」（`D/decision-log.md:111` SD-17、`:112` OI-012）。101.9 h 里唯一让方案真正收缩的力量是用户本人（`bloat-and-guard.md:11`），而用户直到第 100.9 h 才发现。**不是纪律问题，是流程里缺一个「面对坏消息做一次决定」的固定位置。**

## 2 机制清单（5 条，去重后）

### M1 阶段出口对账（计划 ←→ 现实）
- **治**：主根因——出口条件是「写完了」。
- **落点**：`W/workflows/build-plan/SKILL.md` 收尾段，挂在那次**已存在的人为确认对话**上（`design.md:2175` 第一道门）；结论写进该任务自己的 `decision-log.md` 既有决定表一行。
- **读**：`quality/stage-reflection/build-plan/*.json` 的 `status` + 本次 handoff 是否自称 `non_authoritative` + `spec.md` 的 AC 清单。**写**：decision-log 一行原话。
- **新增动作（一次确认，逐字）**：确认题默认答案从「继续」改为必须三选一——「这份计划自己写的成功定义还成立吗？① 修完再进 ② 明确指派缺口负责人后进（写明承接哪些缺口）③ 取消本次执行。」
- **反事实**：**第 0.0 h**。build-plan reflection 于 `2026-09-25T04:32:00Z`（会话开始前 4 分钟）已是 `status=degraded`，handoff 自称 `non_authoritative`（`turncomplete.tsv:47`）。**这是全套里唯一在 101.9 h 开始之前生效的一条。**
- **冲突**：无实质冲突——用的正是 SD-17 保留的第一道人为门（`D/decision-log.md:111`）。不撞 `W/docs/standard-workflow.md:91`「不设统一预算 gate」（不是预算）；不加字段（不碰 `design.md:592` D-FIELD=A）。
- **代价**：每次 build-plan 收尾多一个必答问题（约 1–3 分钟）；选②多写 1 行。

### M2 Phase 收尾三件事：跑一次 / 一个路径 / 三种话（含用户批准①提交）
- **治**：`rootcause-phase-done.md:8-14`——机器只验 `Done` 这行有没有字；578 个 `AC-*` 文件是 17×34 的内容寻址重写、没有 current；词汇表里只有「还没」和「没有」（`covered`/`passed` 各 0 次）。
- **落点**：`W/skills/spec-plan/templates/phase-template.md:30`（`gate_cmd`）、`:32`（`evidence_path`）——两字段**今天就是机器必填**（`:123`/`:125` 写作下限，机器必填=是），只是从没人执行过；提交发生在 `W/workflows/build-code/SKILL.md:249`（`## Work loop`）第 7 条 `:316`。
- **读**：卡片自己写的 `gate_cmd`。**写**：完整原始输出 → 卡片自己写的 `evidence_path`，加一次 `git commit`。
- **新增动作（逐字）**：① 一条命令：跑卡片里的 `gate_cmd`。② 一行字：该 Phase 的验收分母（几条 AC／每条现状）必须能从 `evidence_path` **一个路径**读完，每条只取三个值 `达成` / `未达成（写下一步）` / `退役（写登记行）`。③ 一次提交：`git commit -m "P<n>: <Phase 结果一句话>"`。
- **反事实**：**第 90.6 h** 那条 `git restore --staged --worktree :/`（`2026-09-28T23:11:55Z`，`restores.tsv:1`，194 文件/1474 改动）若前面每 Phase 都有提交，回滚粒度降到「最后一个 Phase 以来的 diff」；**第 36 h 前**（`acceptance/build-code/` 最后一份文件 `Sep 28 06:39`）单一路径会当场显示「36 小时没动」；D2 更早：同一 AC 第 2 次重写就暴露第二个内容寻址文件，不必攒到 34 版。
- **冲突与裁断**：**`coverage-a.md:15` 建议的「Phase 未提交时不得继续下一个 Phase」我判它不成立**——那是自动阻断，正面撞 SD-17「不阻断推进」。降级为：未提交＝记一行事实，**且该 Phase 的 `Done` 不得写成完成**（只限制那句话，依据 `design.md:1630` 引 `workflows/verify-code/SKILL.md:110` 逐字「缺质量事实只限制完成声明，不限制继续验收和修复」）。第二个冲突：`phase-template.md:15` 逐字「不写执行状态」，所以三件事的产物只能落 `evidence_path` 与 git，**不得写进卡片正文**。
- **代价**：每 Phase 一条命令 + 一次 commit + 一行字。

### M3 卡住判据：变了没有，不是几次
- **治**：`rootcause-control.md:16` S7 + `rootcause-phase-done.md:36-49`——单文件 178 次重写（`v2_execution_store.py`，09-28 单日 112 次）、44.5% 失败标记 4 天不降、oracle 不可达仍继续跑。
- **落点**：`W/workflows/build-code/SKILL.md:249`（`## Work loop`）内一行，与 M2 同一时刻。
- **读**：同一条 `gate_cmd` 上一次失败的那一行 + `Done`/`STOP` 里写的下一步。**写**：一行归因。
- **新增动作（一行字，逐字）**：`自上次以来我改了什么：<一句话>；失败签名：与上次相同 / 已变`——**写不出这一行，卡住即成立**。另加人回答一次：「`Done`/`STOP` 里写的下一步，我今天在这个仓库里做得到吗？」做不到 ⇒ 卡在外部条件，不是在推进中。
- **反事实**：形状**第 1.8 h** 首次出现（`v2_execution_store.py` 首次写入 `2026-09-25T06:24:44Z`）；真正值钱的是**第 22.6 h**——build-code reflection `2026-09-26T03:14:02Z` 逐字 `all 17 AC facts missing`，`next_review_trigger` 要「真实交易日」，S3 在同一分钟成立。
- **冲突与裁断**：**我判 `rootcause-control.md:38` 绊线 B 的「同一路径 ≥ N 次且失败标记不低于上一 Phase」不采纳**，改用 `rootcause-phase-done.md:39-41` 的 S1/S2（失败那一行「逐字相同」／退出码「没变」）。理由：N 即使「由本 Phase 自己声明」仍是一个数，撞用户原话「任何阈值都不合理」（`PaperBuilder decision-log.md:21`）；「变了没有」是两次事实的比较，不是阈值。
- **代价**：每 Phase 一行字；答不出时才停。

### M4 加和删同价：孤儿模块一行论证 + 退役一行登记 + 删除类一行读数
- **治**：`rootcause-plan-bloat.md:8`——整套规则只朝「覆盖」打分，「这项不需要」没有任何槽位，于是「再加一张卡」在每一道上都是零风险且唯一有机器回报的动作。**但「多了不该多的」只有事后证据**（11/20 卡 + 整个 P4 是事后才退役，`bloat-and-guard.md:11`），所以**我不承诺事前砍掉任何具体一张卡**——本机制只保证「该不该有」这个问题第一次被写下来。
- **落点**：build-plan step 6 `spec-plan`（`W/workflows/build-plan/steps.json:10`）产出的 `spec.md` 模块节（一行论证）；该任务 `decision-log.md` 既有决定表（退役行）；`W/skills/plan-eng-review/SKILL.md:50` 第 9 条遗漏类扫描之后（`design.md:3343` §14.16 冻结的落点）；`phase-template.md:39` 非目标行内联半句。**规模读数复用既有载体**：`tools/architecture/complexity-report.mjs` + `tests/contract/repository-inventory.test.mjs` 的 `budget()` + baseline + waiver map（card-04 归档 `decision-log.md:252`/`:280` 承载 D-007，该基线今天已被超限 6/8），**不新写规模规则**。
- **读**：`decision-log.md` 的原始需求矩阵（PB 形态 `PB:decision-log.md:1239` 标题 + `:1241` 表头；`:1246-1253` 其实是需求表 R-004…R-010 行，模块台账在 `:865-1019`）vs 模块清单。**写**：三样各一行。
- **新增动作（逐字）**：① 孤儿模块行（**措辞已改，不再问「追不到什么」，只强制把来源写出来**）：`模块 <M-x> → 对应 <R-xxx 或其它来源>；说不出就必须当场二选一：删除 / 移出本任务`。② 退役登记（**＝用户已批准②**）：`日期 | 哪张（P/T 编号） | 为什么一行 | 谁决定的 | 原承接的需求编号`。③ 审查读数：`删除类 finding：<编号清单>，或 N/A — 无删除`。
- **反事实（已按对抗验证改写，宁缺勿假）**：**不写「砍掉 M9」——该说法判假**，我已独立复核：`PD:1248` R-006 行模块列逐字「模块 **M9/M10**」、`PD:202` OI-12 经用户 m00607 校正后推翻原裁定重新纳入、`PD:955` 逐字「### M9 CPU 治理模块（F-014 正式凭据）」⇒ **M9 有溯源，M4① 在它身上根本不触发，这正是判据该有的行为**。可证的只剩一句：`PD:1076` 逐字「**M9/M10 两个新模块**」、`:1077` 逐字「审查材料必须包含 M9/M10」——强制写出「模块 → 需求」映射后，**「一个需求行 R-006 承载两个新模块」这件事第一次可见**；今天它不可见，因为系统里不存在任何「模块 → R-xxx」的对账（机器、人工都没有）。**这是"暴露"，不是"拦下"，我不声称它一定导致删除。**
- **冲突与裁断**：不新增字段（`design.md:592` D-FIELD=A）⇒ 三样全内联进**既有行**的写作下限；不新建账本（card-04 `B-08`，`workflowhub/specs/archive/workflowhub-thin-core-card-04-20260919/decision-log.md:2036`）⇒ 退役写进既有 `decision-log.md` 表；**card-04 的 `B-01…B-12` 与 `BP-R01…R12` 区间内 `变大|膨胀|行数|文件大小` 零命中，不得被引作「反膨胀条款」**（唯一碰数字的 `:2001` BP-R10 是口径修正）——反膨胀的正主是 D-007/OI-010（`decision-log.md:252`/`:280`），所以本方案**只挂那条既有预算、不造第二套**；不强制 `simplicity-guard` 产出 finding（`W/skills/simplicity-guard/SKILL.md:15-16`、`:74-75`）⇒ 只报读数，且「加载了但零 finding」与「未加载」分开写。
- **代价**：稳态每模块一行、每次退役一行、每轮审查一段；零新增轮次。

### M5 不可逆覆盖前过一次人的手（含用户批准③）
- **治**：`repo-damage.md:` 的 194 文件/1474 改动清零；以及 `spec.md`/`decision-log.md`/`P1–P6` 被 delete+add 成执行摘要（用户 09-29T09:29 抗议）。
- **落点**：`W/skills/spec-plan/templates/phase-template.md:100-107`（`### 风险与回滚`）末行 + `W/workflows/build-code/SKILL.md:249` work loop 收尾。授权依据是既有的第二道人为门「不可逆 Git 授权」（`D/decision-log.md:111` R-014、`design.md:2175`），**不是新门禁**。
- **读**：即将执行的命令。**写**：一次原话确认 + 被丢弃路径清单（写进 M4② 的退役登记行，**不新建文件**）。
- **新增动作（一次确认，逐字）**：`禁止用 git restore/reset/checkout -- :/ 这类整树丢弃工作区，也禁止 delete+add 整体替换 spec.md / decision-log.md / phases/**；确需丢弃时先列出路径清单并取得人的明确授权。`
- **反事实**：**第 90.6 h**（`2026-09-28T23:11:55Z`）那条 `git restore --staged --worktree :/` 会在这里被叫停一次。
- **冲突**：无——正是 SD-17 保留的第二道门。
- **代价**：`### 风险与回滚` 多一句纪律文本；实际确认只在真做不可逆动作时发生。

## 3 冲突与去重账

- **(a) 时区口径冲突（必须改数，不是修辞）**：`rootcause-phase-done.md:16` 把 build-code reflection 记成第 ~14.6 h、把回滚记成第 ~82.6 h；`rootcause-control.md:22`/`:46` 同一两件事记第 22.6 h / 90.6 h。算术：`04:36:55Z` → reflection `2026-09-26T03:14:02Z` = 22.62 h；→ 回滚 `2026-09-28T23:11:55Z` = 90.58 h。phase-done 用 CST 12:36:51 当起点、又把 `Z` 结尾的回滚时间当 CST，**系统性低 8 h**。裁断：采 UTC 口径，phase-done 的「救回 ≈87 h」更正为 **≈78 h**（22.6 → 100.9）。
- **(b) 绊线 B ↔ S1/S2**：同一现象的两种判据形态，取不带 N 的 S 形态（理由见 M3）。
- **(c) 绊线 C ↔ D1–D3**：不是重复，是「判断点」与「证据可读性」两层。没有 D1–D3，绊线 C 根本读不出东西（`acceptance/build-code/` 内除 `AC-*` 与 `<逻辑名>-<64hex>.json` 外没有任何 index/current 指针，`rootcause-phase-done.md:10`）。裁断：C 的 build-code 半段并入 M2 的触发条件、**不单列**；C 的 build-plan 半段并入 M1。
- **(d) 绊线 A ↔ M1**：完全同一件事，合并，保留 A 的「三条里选一条并留下原话」措辞。
- **(e) M1 ↔ M4**：都读同一张「模块 → 原始需求」表。裁断：M1 管「多余的模块」，M4 管「未知被转成任务」（`PB:decision-log.md:2113`「build-plan 必须逐条转成验证任务」的镜像条款），共用一张表、**不各立一条**——分开写就是防膨胀本身变成新膨胀。
- **(f) M2 的提交 ↔ `rootcause-control.md:54`「不把 S5 零提交做成绊线」**：不矛盾。用户批准的是**存档动作**（无条件、每 Phase 一次），被否决的是**绊线**（不因「没提交」而停）。故提交进 M2，不单独立条。
- **(g) M3 ↔ `coverage-a.md:20`（P6 尾差）**：「同一命令连续两次带失败标记时不得原样重跑」是 M3 的同义句，合并，只留 M3 一行。
- **(h) M2 的删词 ↔ 既有 reader 链（最容易踩的一处）**：`deferred` 在 `decision-log.md` 处置列里是**合法取值**——`runtime/stage/stage-content-contracts.mjs` 的 `#analyzeDecisionConvergence`（原记 `:3657`、现 `:3881`）要求处置列命中 `/(?:covered|accepted_omission|deferred|rejected|non.?goal|延期|拒绝|覆盖|已接受)/i`，删它会打红 make-decision 的 `requirement_coverage`（`D/decision-log.md` 补充登记第六节实测）。裁断：删词**只删验收分母的 `deferred`**，decision-log 处置列一字不动。
- **(i) 报告②的 M9 反事实经对抗验证判假，已剔除**：`rootcause-plan-bloat.md` 的【4】声称「11 个模块里只有 M9 追不到原始需求，砍掉它可连带砍掉 10 张退役卡」。我已独立复核并判假——M9 有用户溯源（`PD:1248` R-006 模块列逐字「模块 **M9/M10**」；`PD:202` OI-12 经 m00607 重新裁定纳入；`PD:955` M9 有正式凭据），且模块覆盖矩阵覆盖 M1–M11 全部（`PD:1239` 标题 + `:1241` 表头；报告所引 `:1246-1253` 其实是需求表 R-004…R-010 行）。「10 张退役卡挂 M9」亦假（父 agent 对抗验证 `verify-rootcause.md` 逐条验真，我未独立复核：`PD:49` 只退役 T018/T019/T020 三张；T003/T004/T005 属另一归档任务 `specs/archive/paperbuilder-phase-foundation-m1-close/tasks.md:31-33`；T014 是孤儿代码 `spec.md:613`；T007/T008 是当前 build-code 的 P2 Phase 卡）。**故 M4① 的价值重写为「强制把映射写出来」，不再承诺砍任何具体模块。**

## 4 被砍掉的（最终裁定）

口径：`coverage-b.md` 表 13 项（R1–R13），其中 R11 自己判「无补充」（`:23`），实际补丁 12 条；`rootcause-plan-bloat.md:52` 记作 11 条，我不改它的结论、只把分母说清。

| 裁定 | 条目 | 理由（file:line） |
| --- | --- | --- |
| **砍（3）** | R1 越界差集、R3 新增文件对账 | `rootcause-control.md:55` 逐字：删掉 55% 不需要的卡比检测越界更早、更省；M4 让「加」有成本 |
| | R13 非交付产物清单 | `design.md:163` R5 + `design.md:2361` I-9 已覆盖，`coverage-a.md:45`/`:46` 已判过度登记 |
| **改指向（1）** | R6 规模对账 | 不砍、也不新写规则：规模读数一律引**既有 budget 事实**（`tools/architecture/complexity-report.mjs` + `tests/contract/repository-inventory.test.mjs`，card-04 `decision-log.md:252`/`:280` 承载 D-007）；另立一条文本＝第二份正文，撞 `D/decision-log.md:327` counterexample「出现第二份规则正文（副本漂移）」 |
| **吸收（8）** | R2→M2 收尾同一眼看；R4→M4①；R5→M5；R7→M4②（＝用户批准②）；R8→M4③；R9/R10→M2②；R12→M4②「谁决定的」栏 | 全部落地为 5 个机制里的具体动作，**不再单独立项** |
| **判无补充** | R11 | `coverage-b.md:23` 已判已覆盖 |

三份报告里我不采纳的条目：`rootcause-control.md:52`（不强制 simplicity-guard 产 finding）、`:50`/`:51`（不加机器门禁与预算 gate）、`rootcause-control.md:53`（不把退役做成新机制）——**前两条全采纳；第三条我改编**：载体不新建（进 `decision-log.md` 既有表），但动作要保留（用户已批准②）。`rootcause-plan-bloat.md:61`（M4 只到模块/Phase 层，不再下沉）、`:62`（退役不能变成顺手砍真需求的许可证——反例是 P4「大扫除」这个真需求被整体砍掉，`PB:phases/P4.md:5`）、`:63`（不设配额、加载了零发现与未加载分开写）、`:64`（不许要求「每个 OI 必须有落点」）——全采纳。**`rootcause-plan-bloat.md:41`（M3 要求「删除类 finding = N」）部分不采纳**：改成「列出编号，或写 `N/A — 无删除`」，避免出现一个可被当 KPI 的数字栏。**我判不成立的一条**：`coverage-b.md:19`（R7 行）建议退役行写进 `phases/index.md` 并「禁止直接删行」——`design.md:702` 引 `skills/spec-tasks/SKILL.md:8` 逐字判其 `not … a progress ledger`，退役是**决定**不是进度；裁断：只写 `decision-log.md` 一处，index.md 只留一句指针（`rootcause-phase-done.md:54` 同判）。

## 5 用户已批准 3 条的落点

| 批准项 | 落点（file:line） | 逐字措辞 | 写面判定 |
| --- | --- | --- | --- |
| ① 每完成一个 Phase 提交一次 | `W/workflows/build-code/SKILL.md:249`（`## Work loop`）收尾 `:316` 之后 | `每个 Phase 收尾必须落一个提交：先跑该卡片写的 gate_cmd，把完整原始输出写到该卡片写的 evidence_path，再 git commit；提交信息第一行 "P<n>: <Phase 结果一句话>"。提交不证明对错，只保证存档与下一 Phase 审查可直接 git diff。未提交时记一行事实，其 Done 不得写成完成。` | 属 card-03 写面（T-014=A 已列该文件），但**须等 CARD-04 合并进 main**（`D/decision-log.md:55` T-013 逐字「build-plan 会等到 card-04 交付合并进来后再进行」），挂起碰撞按时间错开消解 |
| ② 中途不做留一行登记 | 写进**每个任务自己的** `decision-log.md` 既有决定表；权威措辞落 `W/docs/standard-workflow.md:140` 之后 | M4② 的 5 栏格式。**不得**写进 `phases/P<n>.md`（`phase-template.md:15`）或 `phases/index.md`（`design.md:702`） | 属 card-03 写面（P7 落点 `design.md` §14.13） |
| ③ 危险操作人工确认 | `W/skills/spec-plan/templates/phase-template.md:100-107` 末行 + `W/workflows/build-code/SKILL.md:249` | M5⑤ 逐字。依据 `D/decision-log.md:111` 第二道人为门 | phase-template 属 card-03 写面（T-008=A）；**改模板后必须同批刷新 `skills/spec-plan/skill-bundle.json:11` 与 `skills/catalog.yaml:335`**，否则 `runtime/adapters/local-skill-resolver.mjs:110` 抛 `bundle sha256 mismatch: templates/phase-template.md`，并打红 `tests/skill-provenance-strict.test.mjs:25`/`:26` 与 `tests/contract/spec-stage-artifact-closure.test.mjs:118`（`D/decision-log.md` T-008 风险栏逐字） |

## 6 能力边界（诚实）

- **不把失败变成成功**：17 条 AC 要真实交易日（`rootcause-phase-done.md:67` 逐字 `local tests do not prove live continuity`）。这套改法只把「卡在一个做不到的 oracle 上」从 101.9 h 压到第 22.6 h 说清楚。
- **防不住人不在场**：M1/M2/M3 的出口都是「一次人回答」，而实测真人消息最长空档 50.05 h（`time-and-process.md:20`）。人不回答时机制只留一行 `awaiting_user`。建通知渠道是新增 runtime 能力，撞 `design.md:2182` §0，**应另开卡**（`coverage-a.md:44`）。
- **防不住把胀塞进已计入的卡**：M4 只到模块/Phase 层，卡变胖而计数不变（`rootcause-plan-bloat.md:61`）；再下沉就要给每张卡加字段，撞 `design.md:592`。
- **防不住「人自己点头继续」**：本方案只保证坏消息必须被读一次，不保证读的人拒绝。
- **不覆盖**：越界写检测、材料三副本、悬空引用（`evidence/` 8 个空目录被引用 41 次）——属 `coverage-a.md:13`/`:24`/`:22` 面，理由见 §4。
- **不覆盖「缩减只在用户逼问后才发生」的根源**：本方案只给出「删除类读数」这一个弱杠杆。

## 7 落地清单

| # | 文件 → 行 | 加什么 | 写面 |
| --- | --- | --- | --- |
| 1 | `W/skills/spec-plan/templates/phase-template.md:30`/`:32` 写作下限 | M2 ①②（跑一次 + 一个路径 + 三种话） | card-03 已声明（T-008=A）。改后须刷 bundle 哈希（见 §5③） |
| 2 | `W/skills/spec-plan/templates/phase-template.md:39` | 非目标行内联半句「并列出本 Phase 相对上一版删掉的对象；没有就写 `N/A — 无删除`」 | 同上 |
| 3 | `W/skills/spec-plan/templates/phase-template.md:100-107` 末行 | M5 逐字禁令 | 同上 |
| 4 | `W/workflows/build-code/SKILL.md:249`（Work loop） | M2 三件事 + M3 一行字 + M1/M5 引用 | card-03 已声明（T-014=A）；等 CARD-04 合并 |
| 5 | `W/workflows/build-plan/SKILL.md` 收尾 + `W/workflows/build-plan/steps.json:10` | M1 三选一确认题 + M4① 孤儿模块行 | card-03 已声明，但**推迟到 CARD-04 合并进 main 之后**（T-013） |
| 6 | `W/skills/plan-eng-review/SKILL.md:50` 之后 | M4③ 删除类读数 | 设计落点已冻结（`design.md:3343` §14.16），但 `D/decision-log.md` 的写面声明**未列此文件**——落地前须补一行写面声明，否则本方案自己就在示范「未申报写面」 |
| 7 | `W/docs/standard-workflow.md:140` 之后 | 六项摘要加「本轮 AC 达成/未达成/退役条数」+ M4③ 读数 | card-03 已声明（P7）。**禁改区 `:88-92`（尤其 `:91`）一字不动** |
| 8 | 各任务自己的 `decision-log.md` 决定表 | M4② 退役登记行 | 既有载体，不新建 |
| — | **另开卡** | 人机通知渠道（`coverage-a.md:44`）；越界差集检测（若用户要，`coverage-a.md:13`） | 撞 `design.md:2182` §0，不入本卡 |

## 8 待用户拍板（4 条）

1. build-plan 收尾那次确认，要不要把「默认继续」改成「必须在三条里选一条」——这是唯一能在第 0 小时生效的一条。
2. 验收账本里删掉 `deferred` 这个词（只删验收结果值，旧材料不追溯，decision-log 处置列不动），行不行？
3. 退役登记行要不要「原承接的需求编号」这一栏——多写五个字，换掉「这 17 条需求现在归谁」这个永远答不出来的问题。
4. 危险操作人工确认的边界：只覆盖「整树丢弃工作区 + 权威材料整体重写」，还是也要覆盖 force push、删分支、删任务目录？
