# card-03 设计档案 × PaperBuilder build-code 事故（B 组：范围 / 臃肿 / 技能执行 / 验收真相）覆盖判定

> 来源·产出：card-03 落地流程派发的只读取证子代理（事故取证 / 根因分析；未改仓库任何文件）
> 来源·时间：2026-09-29 18:44（本机 CST，文件 mtime）
> 来源·支撑：支撑 decision-log §17/§18 落地范围裁定（B 组：范围 / 臃肿 / 技能执行 / 验收真相）

素材：`/tmp/pb-forensics/{bloat-and-guard,scope-creep,time-and-process,repo-damage}.md`（4 份均存在，均已读）。
被检（只读，未修改任何仓库文件）：`W=/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-03-20260919`，
`W/specs/workflowhub-thin-core-card-03-20260919/decision-log.md`（749 行）、同目录 `design.md`（3418 行）、
`W/skills/spec-plan/templates/phase-template.md`（217 行）、`/Users/Hugh/Hugh/Project/workflowhub/skills/simplicity-guard/SKILL.md`（97 行）、
card-04 继承资产 `specs/archive/workflowhub-thin-core-card-04-20260919/decision-log.md`（2553 行）。

## 一、覆盖判定表

| 编号 | 问题一句话 | 判定 | card-03 侧证据锚点 | 最小补充文本 + 插入位置 | 需拍板 |
| --- | --- | --- | --- | --- | --- |
| R1 | 越界改动：还原前 110/194 文件、275/1474 次改动 0 命中声明写面 | 部分覆盖 | `decision-log.md` §六「写面声明（本轮更新）」；`phase-template.md`「文件边界」→`写入集`（精确路径、不得目录/glob）；`design.md §6.5 禁区与区间收窄`（`:1337`）「禁区（不得作为写面）…」；`design.md §4.15`（`:972`）逐字「本卡据此不设门禁、不加校验、不阻断 build-plan 推进」 | 在 `design.md §4.15` 末追加一句事实纪律（不设门禁）：build-code 收尾时把「本阶段真实 diff 路径」与「Phase 声明写入集」求差集，非空即逐条写进阶段摘要 | 否 |
| R2 | 违反禁改清单：`c1/__init__.py`、`c1/aggregation.py`、`app_services/__init__.py` 属 DO NOT TOUCH 仍被改 | 部分覆盖 | `design.md §6.5` 逐字「`docs/standard-workflow.md:88-92` 一字不动…`勿改这五行`」（引 `decision-log.md:35`(3)）；`phase-template.md`「禁止改动：[精确的受保护路径与理由]」；`design.md:676` `DO NOT TOUCH` 字段保留 | 在 `phase-template.md` L1「禁止改动」行写作下限内联半句：收尾核对「禁止改动」路径是否出现在真实 diff，出现即记为事实并写出理由 | 否 |
| R3 | 未申报新生产文件 7 个（live_runtime_supervisor.py 等） | 部分覆盖 | `design.md:1333` 逐字「本设计**不新建任何生产文件**」；`design.md:1498`「新增文件属新增控制面（`AGENTS.md` 要求登记 consumer/owner）」；`phase-template.md` 契约头「消费者」+ L1「新增」；`design.md §14.16`（`:3343`）九类 a–i「真实消费者/入口不存在」 | 在 `design.md §14.16` 第 9 条九类之后补一类「j 新增文件对账」：列出本 diff 新增路径，逐条须指到 Phase 声明的「新增」清单，否则 finding | 否 |
| R4 | 做进非目标：Historical 补数 + C2 回执 + 恢复屏障（OPEN-003）、封存行情修订、CAS 发布、多 Worker 协调 | 部分覆盖 | `phase-template.md` 速读卡「非目标」+ L0「非目标」；`design.md:450` 逐字「非目标 `:155-159`（两处已声明"唯一权威非目标列表"）」；`design.md:3337`「刻意不搬的计划模板内容（防膨胀、防越权）」 | 在 `design.md §14.13` 的 build-code P2 落点（`workflows/build-code/SKILL.md:16-32`「计划缺口的集中退回」）加一条：本阶段新增行为命中 spec 非目标列表即逐条退回并记 finding | 否 |
| R5 | 权威材料被整体重写：`spec.md`/`decision-log.md`/`P1–P6` delete+add 成执行摘要，用户 09-29T09:29 抗议 | 部分覆盖 | `design.md:1296` 逐字「T 表是 append-only 的答复记录（`decision-log.md:31` 逐字「append-only 语义保留——旧表述一律不改写」）」；`design.md §14.6`（`:2539`）「与既有裁决的冲突处置（三处，不静默覆盖）」；`design.md §4.8`（`:885`）「三处纯文本改动」 | 在 `design.md §1 R11` 已落点（`docs/standard-workflow.md:93` 及之后新增行）追加一句：权威材料（`spec.md`/`decision-log.md`/`phases/**`）只就地增补；确需重写时旧全文原路径保留、不得 delete+add 覆盖，并在 decision-log 记一行替换理由 | **是** |
| R6 | 方案膨胀 4–30 倍：5 项需求→11 模块 / 20 卡 / 154 台账 / 28 报告 / 13 条 U- / 748 KB | 部分覆盖 | `design.md §1.0`（`:51`）「`AGENTS.md` 的写入预算：恰好三条（用户裁决 T-019=B，不得扩张）」+ `:1538` 逐字「明确拒绝条款膨胀」；`design.md §3.2`（`:592`）「为什么不加那 7 个字段（D-FIELD=A 的落点）」；`design.md §14.13`（`:3053`）覆盖检查逐字「零新增文件、零新增 step、零新增 schema 字段、零新增门禁」；`design.md §14.14`（`:3177`）「来源 → 条目 → 落点 → 验证：全覆盖对照审计」 | 在 `skills/plan-eng-review/SKILL.md` 第 9 条「对账总闸」旁加一行规模对账：模块数 / Phase 数 / Task 卡数 / 台账条目数与 decision-log 原始需求条数并列；任一模块不能指到一条原始需求即 finding（落点已在 `design.md §14.16`） | 否 |
| R7 | 中途大退役：11/20 卡（55%）+ 整个 P4 + 旧 17 AC 退役，缩减全由用户逼出 | 未覆盖 | 全卡 `退役` 0 命中；最近的邻接机制只有 G-1「作废批次登记」（`design.md:1646`/`:1936`）与 T-029 归档（`design.md:1288`「`git mv` 进 `docs/archive/retired-root-progress/`」）——前者治并行批次、后者治别人的进度文本，都不是「卡/Phase 退役登记」 | 在 `phase-template.md` 速读卡既有字段的写作下限内联（不新增字段）：`phases/index.md` 对计划生命周期内判定不做的卡/Phase 记一行「退役：编号+日期+理由+是谁要求的」，禁止直接删行 | **是** |
| R8 | simplicity-guard 名存实亡：90 命中仅 1 次真读，0 finding / 0 P0–P3 裁决 / 0 删除建议 | 未覆盖 | `design.md` 全文 `simplicity-guard` 仅 1 处（`:1786`），且是 `workflows/build-plan/SKILL.md:86-92` 的**现状逐字引用**（「`simplicity-guard` and the plan-review lenses inspect the same plan material and…」）；`decision-log.md` 0 命中、`phase-template.md` 0 命中；`phase-template.md` 无 `四阶梯`/`YAGNI`/finding 要求 | 见下方「特别回答」的三条 | 否 |
| R9 | 验收真相缺失：`AC-*.json` 578 deferred / 459 missing；facts `partial`/`incomplete`/`unavailable`；stage-reflection `degraded` | 部分覆盖 | `design.md §9.A`（`:1629`）逐字「取证只采事实、判定必须来自独立上下文（禁止自审自判）」「**不得把「本卡自己声明通过」当判定**」；`design.md:1016`「The phase_review fact remains visible; unavailable limits quality claims and permits same-task repair.」；`design.md §6.5` 更正三引 `docs/standard-workflow.md:334-338`（`retain incomplete facts honestly`）；`phase-template.md`「Done：要诚实下结论还缺哪些 AC、测试、审查与交接证据」、`覆盖上限`、`显式不覆盖` | 在 `design.md §14.13` 的 build-code P6b 落点（`docs/standard-workflow.md:94` 按 Phase 记一行成本数据）同处追加：摘要必须给出本轮 AC 达成 / 未达成 / deferred 的条数；未达成不等于失败，但必须在摘要可见 | 否 |
| R10 | 未验证声明：真实 Databento 查询与费用未验证；浏览器/UI 验收缺席；断网自愈不成立 | 部分覆盖 | `phase-template.md` 速读卡「未决事实：[已知但尚未核实的未知、它的影响、打算在哪个 Task 处理或交给谁]」；`design.md §14.9`（`:2649`）「残留不确定（如实登记，不自行裁决）」；`design.md:2532` 逐字「核不到的东西写成 `unknown` 与它的负责人」；`decision-log.md` §UI applicability（`:699`） | 在 `design.md §2.1` 的 `:165`「验收流程」落点（验收口径索引表）加一句：AC 依赖真实外部服务 / 真实浏览器 / 计费通道者，须写明「已在哪次真实会话、哪条命令验证」；缺席写 `unknown`，不得以单元测试替代 | 否 |
| R11 | 重复交付物：M11「盘中对照七项核查」在 `spec.md:607` 与 `phases/P2.md:163` 逐行重复；「删除清单」12 次含两份「最终」 | 已覆盖 | `phase-template.md` 使用说明逐字「本文件只写**本 Phase 的实现增量**…本文件不复制、不改写、不重述」+「全局产品契约与全局实现设计归 `spec.md`」；`design.md §13.1`/`:1852` 「规则正文只写一处（docs/standard-workflow.md）」；`design.md §14.13.1`（`:3064`）「落点总表（22 个插入点，措辞改动 0 处）」；`design.md §14.13` build-code `P3`「证据只留原始件」（`docs/standard-workflow.md:107-123`） | 无（补齐台账型段落的唯一性属 R6/R12 面） | 否 |
| R12 | 需求变更失控：13 条 U- 变更；M9 被 Talk R1 否掉后又重新纳入（DEV-05）；未核实项被要求「build-plan 必须逐条转成验证任务」 | 部分覆盖 | `decision-log.md` §本卡问答记录（T 表）（`:39`）+ §原始需求（`:90`）+ §范围（`:119`）+ §非目标（`:133`）+ §「十二、产物模板中文化与审查面优化的追加指令」（`:523`）；`design.md §14.10`（`:2669`）「本节自定的三条边界（超出即为越界，施工者不得扩张）」；`design.md §14.0`（`:2165`）12 条 + A5 三条逐条出处；`design.md:61`「`AGENTS.md:14` 就地把派发纪律改写（不新增行）」 | 在 `design.md §14.13` 的 build-code P7 落点（`docs/standard-workflow.md:140` 六项摘要列表之后）加一句文本纪律（不新增条目类型）：中途新增或恢复的需求变化必须写明它推翻了哪条既有决议、由谁推翻；未被用户明确推翻的旧否决不得恢复 | 否 |
| R13 | 需求外任务：20 分钟监控定时任务等外围产物（`.planning/` 24 文件 1934 行、外部 quality 3565 文件 91M） | 部分覆盖 | `design.md §14.10` 边界 3 逐字「**不为中文化新增门禁、stage、gate、schema 或校验模块**」；`design.md §14.13.0` 覆盖检查「零新增文件、零新增 step、零新增 schema 字段、零新增门禁」（`:2883`）；`design.md:1498`「新增文件属新增控制面（`AGENTS.md` 要求登记 consumer/owner）」 | 在 `design.md §14.13` 的 build-code `P7` 落点（`docs/standard-workflow.md:140`）同处追加半句：阶段内产生的非交付产物（计划目录、定时任务、外部镜像目录）须逐条列出路径 + 归属 + 保留/删除，未列出即记为越界事实 | 否 |

## 二、「未覆盖」项按严重度排序

1. **R8 simplicity-guard 未覆盖（最高）**——唯一直接命中「技能挂了名却没执行」的问题；card-03 的整套审查面优化（§14.11–§14.13，16 条提案 22 落点）与第 9 条遗漏类扫描**方向相反**（防遗漏，不防膨胀）。不改则同类事故可原样复现。
2. **R7 卡/Phase 退役无登记机制**——11/20 卡白做，而 card-03 全文 `退役` 0 命中；后果是「做了 55% 不需要的卡」不留任何可核对事实。
3. （无第 3 条未覆盖项；其余 11 项均为部分覆盖，缺口集中在「有声明纪律、缺差集核对」与「缺计数可见性」。）

## 三、特别回答：card-03 有没有机制保证 simplicity-guard 真被执行？

**没有。** 三条判据：(a) `design.md` 全文 `simplicity-guard` 仅 1 处（`:1786`），是既有 `workflows/build-plan/SKILL.md:86-92` 文本的逐字引用，不是执行要求；(b) `decision-log.md`、`phase-template.md` 各 0 命中，`四阶梯`/`YAGNI` 在 card-03 材料 0 命中；(c) card-03 自己设计的审查面优化（`design.md §14.11` `:2827`、`§14.12`、`§14.13`）与 `§14.16` 第 9 条「遗漏类扫描」，**没有任何一条要求该 lens 产出 finding、P0–P3 裁决或删除清单**。

最小可落地的三条补充（均为文本纪律，不新增门禁/schema/字段，合 SD-17+OI-013）：

1. **插 `skills/spec-plan/templates/phase-template.md` 速读卡「非目标」行**（该行原文「[本 Phase 明确不做的事，防止范围膨胀]」）：在同一行的写作下限里内联「并列出本 Phase 相对上一版删掉的对象（能力/字段/卡/文件）；没有就写 `N/A — 无删除`」。→ 不新增字段，避开 D-FIELD=A「不加 7 个字段」的既定裁决。
2. **插 `skills/plan-eng-review/SKILL.md` 第 9 条的九类 a–i 之后、`## Result` 之前**（该落点已由 `design.md §14.16`（`:3343`）冻结，此处只加一类）：新增一类「j 该删的是否还在」——一对不上原始需求（P0）、二仓库/标准库已有能力重复（P1）、三只凭「以后可能需要」加入（P0）、四只增不删的旧抽象/兼容层/文字；每条 finding 必须带 `P0｜P1｜P2｜P3` 之一，且动作只能取「删除 / 复用 / 缩小」。
3. **插 `docs/standard-workflow.md:140`（六项摘要列表之后；card-03 已冻结的 build-code `P7` 落点）**：摘要必须写明本轮 simplicity-guard lens 是否被加载、产出几条 finding；「加载了但零 finding」与「未加载」必须区分，不得混写。→ 只要求读数，不要求必须有 finding（后者会违反 `skills/simplicity-guard/SKILL.md:15-16`、`:74-75`「没有这类问题时，不制造 finding…不输出 verdict」的自身契约）。

## 四、不建议补充的项及理由

- **R9 的「578 deferred / 459 missing」数字本身**：那是 PaperBuilder 的任务事实，不是 card-03 可设计的对象；card-03 已有「事实/判定分离、不得自证通过」（`design.md §9.A`）。把它变成阈值即新门禁，触 SD-17/OI-012（`design.md §14.0:2175`）。
- **R3 的 7 个具体文件名、R7 的「整个 P4 / 旧 17 AC 清单」**：皆属 PaperBuilder 仓路径与任务事实，不属 workflowhub 设计面。
- **R11 的「M11 两份重复的具体合并动作」**：card-03 已有三条同向机制（`phase-template.md` 不复制不改写不重述、`§13.1` 规则正文只写一处、「证据只留原始件」`docs/standard-workflow.md:107-123`），再加一条就是重复建设本身。
- **R8 中「lens 必须有 finding」的硬断言**：与 `skills/simplicity-guard/SKILL.md:15-16`、`:74-75` 冲突，且会变成新的推进前置。
- **为 R12 新增 `U-`/反悔裁决条目类型**：触 `card-04 decision-log.md:2038` `B-08`「不得新建 schema / CLI 动词 / 控制面」，只能走文本纪律（见表中 R12 行）。

## 五、无法判定项

- **R4 的「CAS 发布 / 多 Worker 协调 / per-run ingress 队列」**：card-03 材料无这些概念的同名载体，无法判断是否被某条既有条款以别的名字覆盖。
- **R5 的「09-29 用户抗议 + 代理自认替换」是否落入 card-03 某条纪律**：全卡无「权威材料禁止整体替换」明文；判定取决于把 `design.md:1296` 的 append-only 外延读多宽，按文本严格读＝未明文禁止（故表中给「部分覆盖」而非「已覆盖」）。
- **R12 的 `DEV-05` 条目形态**：卡-04 继承资产里 `BP-R01…R12`（`card-04 decision-log.md:1927`）与 card-03 的 T 行是否同一形态，材料未给映射，无法判定。
