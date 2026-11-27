# 功能规格：交付质量闭环——验收只对「问题消失」给结论

本文件写给 build-plan 的 Phase 作者、build-code 的 Phase 执行者、独立审查与测试角色、最终收口者；读完要能定位用户目标、场景、来源与唯一验收判据。

> 写作标准：`skills/material-writing/SKILL.md` 的「材料写作标准（唯一）」是本文件唯一标准；本文件不复述标准，只说明自己的例外。
> 例外一：`## 实现设计（全局权威）` 的节名逐字保留，本节只留标题与一行占位，设计结论由 build-plan 第 6 步写。
> 例外二：验收判据只在 Appendix A；正文、decision-log 与 Phase 卡只给指针，不写第二份判据。
> 术语：gate_cmd（门禁命令）、oracle（判定器）、evidence_path（证据路径）、STOP（模板固定英文标签）、Done（模板固定英文标签）、AC（验收条款编号）、PARA（内联命令输出的段命中比）、UI（界面）按原标签保留；「包」＝decision-log 第 3 段的 WP1–WP10。
> 本文件不产页面：交付物是方法、模板、运行时读取与技能正文，所以「用户旅程」写的是维护者、计划作者、实现者、收口者拿到新规则后的真实动作序列。

## 这是什么，给谁用？

给 WorkflowHub 的每条交付一个能判真假的收尾问题：原来的问题还会不会发生；交付物存在不再是答案。

- **功能名**：交付质量闭环（问题定义 → 存在性 → 根因 → 影响面 → 方案与回退 → 执行证据 → 版本对账 → 问题消失验收），外加持四技能必读的阶段入口与一套发现/拆包技能。
- **来源**：`specs/delivery-quality-acceptance-20261126/decision-log.md`（下称 decision-log）第 2 段问题定义与第 3–4 段十包设计；需求与用户答复原义见 `quality/evidence/decision-log-refs/requirement-index.md` 的 R-001–R-031、U-001–U-031。
- **状态**：规格已按十包卡与 decision-log 收敛，验收条款见 Appendix A；实现设计留白待 build-plan 第 6 步，Phase 划分与命令留待 Phase 卡。
- **读者要完成的三件事**：Phase 作者据此写卡（AC 编号与判法不得改写）；执行者据此交证据（每条 AC 的通过信号与证据落点）；收口者据此判真假（一条命令或一个具名人工步骤）。

## 一页看懂：谁要什么结果，怎么算通过？

一条真实承诺能走完五问闭环，且独立读者能打开它的原件、看见原问题不再发生的读数。

- **需求 1（WP1–WP3）**：立项先把问题写清并判它是否真的存在，再定根因、影响面与可退方案；写不清就带三条带代价的建议交人决定，不硬挡也不悄悄放行。
- **需求 2（WP4–WP5）**：执行每步交出具名文件与读者；同一份证据无论写在哪一行都按同一套四类判法读；卡面状态只解析一次，材料检查、终末链、关单读同一份事实；报告分项必须加得回总数；交付要能看到具体提交。
- **需求 3（WP6）**：每条验收的失败条件指向一个今天能跑出来的读数，而且量原问题的对象；读不出就写明读不出、最近还能查什么、谁补。
- **需求 4（WP7）**：前四个任务在最终合并版本上逐条给结论，旧判据判三态，集成态单独跑。
- **需求 5（WP8–WP9）**：三阶段开工按同一套方法找一手来源、按源条目做覆盖分母、逐条需求过五问再切包；四个阶段入口必须走对应技能，主持人不得自己写卡、自己审、自己判做完；审查只做一次，测试例外必须重跑。
- **最大影响面**：`skills/` 与 `workflows/` 各阶段入口、决策日志与 Phase 卡模板、`runtime/stage/stage-content-contracts.mjs` 与 `runtime/task/delivery-claims.mjs` 的读取、`tools/cli/stage-runtime.mjs`／`task-close.mjs`／`check-stage-steps.mjs` 的读侧、未来所有任务的立项与收口。
- **验收信号**：判据见 Appendix A 的 AC-01 至 AC-19；每条给判法、通过信号、失败信号与证据落点。
- **非目标**：不做页面实现与视觉基线；不建并发验证工具；不回改已关闭任务材料；不新增阶段、gate、确认点或第二套账本；不把门覆盖变成新的失败门。

## 单一事实源

本节是角色数、AC 数、审查轮次、任务数与包数的唯一定义处；卡与技能只引用，不复述第二个值。

| 事实 | 唯一值 | 定义位置 | 消费它的文件 |
| --- | --- | --- | --- |
| 角色数 | 5 个名字（执行者、审查者、开发者、独立审查者、独立测试者）／9 行角色 | 本节 | P1 卡、四份技能 `## 角色`、AC-17、AC-19 |
| AC 条数 | 19 条（AC-01–AC-19） | Appendix A | P8 卡 17 行表、各 Phase 卡「覆盖 AC」 |
| 审查轮次 | 本流程一次、不复审；上限归内核 R1 另计 | 本节与 `skills/unit-kernel/SKILL.md:35` | P2 卡、四阶段入口、AC-15 |
| P9 任务数 | 11 张（T140–T150） | P9 卡 | P9 卡机器字段、追踪表 |
| 包数 | 10 个（WP1–WP10） | decision-log 十包目录 | 覆盖账、AC-18、全部 Phase 卡 |

## 为什么做，给谁用？

交付时说「都验过了」，接手打开发现没东西、版本不对、或问题根本没解决；这一节只留结论与来源，不重写 decision-log 的推理。

### 八要素问题陈述摘要

来源：decision-log 第 2 段 `:49-60` 的五要素表已扩成八要素；逐格原义与首读位置以那里为准。

| 要素 | 一句话结论 | 来源 |
| --- | --- | --- |
| 谁 | 维护者、后续任务的计划作者与实现者、接手交付的人、提需求的用户 | decision-log:53 |
| 什么场景 | 交付声称号称验过，接手时发现没东西、版本不对或问题没解决；用户要反复提醒才找到原始需求 | decision-log:54 |
| 现在怎么坏 | 验收判「交付物存在」不判「问题消失」；根因两说并列无裁决；影响面只写模块名；调研从任务卡出发、覆盖分母自造；执行步骤无具名交付物；报告数字不自洽 | decision-log:55、`:64-72` 的七组读数 |
| 证据 | 七组真实读数：71 条声明路径里 12 条打不开、报告 76≠78 且缺第 13 段清单、任务二承诺全为待定、7 条 incomplete 押在未来事件、AC-P1-006 只验卡面、调研漏 4 条机制、T08 域级读数零命中 | decision-log:64-72 |
| 影响 | 后续任务继续产出形式证据；接手者返工；改革「看起来完成」而下一轮还要重查 | decision-log:57 |
| 不修后果 | 每一轮验收都不可信，质量投入被形式证据吞掉，同类问题已在任务三、任务四重复 | decision-log:58 |
| 成功判据 | 一条真实承诺能走完五问闭环；独立读者能判；历史坏例回放能暴露；新材料缺五要素不能进计划 | decision-log:59 |
| 边界（不做什么） | 不做页面实现；不建并发验证工具；不回改已关闭任务材料；不新增阶段、gate 或第二套账本 | decision-log:60、`:102-105` 的两项例外 |

### 需求组 1：问题定义与存在性（WP1）

问题常被写成方案，且没有证据与频率就无法判断值不值得做。WP1 要求每个新任务立项时写清八件事，并给一条「这问题真的存在吗」的判定（待证／真实／不成立），待证升级人工给三条带代价的建议、由人决定、不硬挡。来源：需求 13、14（R-013/R-014），`quality/evidence/decision-maker/p1/card.md`。

### 需求组 2：根因、影响面与可退方案（WP2、WP3）

根因现在可以几条并列、谁也不拍板，影响面写一句模块名就算合格，出错只能往前修。WP2 要求一条主因加一条可观察的排除解释，判断不了的写有主待证（谁补、最晚裁决点、返工上限）；影响面写四格（调用方、数据兼容、回滚半径、影响量级）。WP3 要求备选与被否、最小可撤单元、回滚分级预演、假设出错清单、单一负责人与时间盒。来源：p2/card.md、p3/card.md。

### 需求组 3：执行证据与版本对账（WP4、WP5）

八步只有两步有固定文件名，上一任务十三段只有十二份清单没人发现；同一份证据两处给不同结论；报告 76≠78 却自称 78；交付只有布尔没有提交号。WP4 给每步一个名字、一处读取与四类结论；WP5 让卡面状态只解析一次、三处读同一份事实，并把报告对账、门覆盖、交付提交、证据复用键接上。来源：p4/card.md、p5/card.md。

### 需求组 4：问题消失验收（WP6）

一条只要求「卡上写出规则唯一新家」的验收，八处重复副本并存也能全过；收口只判「声明可核」。WP6 要求失败条件指向今天可跑的读数、量原问题对象，并给出证伪测试、对照规则、类型化判词与相反原件的处理。来源：p6/card.md；被回放对象见 `specs/archive/delivery-quality-code-20261124/spec.md:1249`。

### 需求组 5：前置验收、调研拆包与阶段入口（WP7、WP8、WP9）

前四个任务已关闭但判词停在各自提交上，没人能回答「还算不算数」；调研从任务卡出发、覆盖分母自造；四个技能写着「必须」，四个阶段入口第一句把它降成「需要时」。WP7 在最终合并版本上逐条给结论并对齐集成态；WP8 把发现与拆包做成必读技能；WP9 把四阶段入口改成必须走对应技能，并定审查只做一次、异源一次、审查结论直连、单元总结与复盘、降上下文成本。来源：p7/card.md、p8/card.md、p9/card.md、p9/design.md:465-491。

### 需求组 6：四技能角色改造与原始需求翻译契约（WP10）

phase-maker、task-maker、run-phase 三个技能现在只有导航与零散读者句，没有可派角色。WP10 要求：phase-maker、task-maker 各派执行者与审查者两角色；run-phase 派开发者、独立审查者、独立测试者三角色（测试与审查分开）。每个角色写清谁、何时派、读什么、交什么、独立性、答不出退回给谁。原始需求必须带原文逐字＋行位＋sha256，并附翻译对照六列（原文句/技能节/角色/原件/读者/失败验收）；冷读加三问、对抗加三问，答不出按阻塞。WP10 先于 WP9：先有角色，入口“必须调用”才有意义。来源：R-024–R-031、U-031、任务 4 P8。

### 背景是什么？

本仓已有 `skills/decision-maker`、`skills/task-maker`、`skills/phase-maker`、`skills/run-phase` 四个技能与 `workflows/*/steps.json` 步骤表；`tests/contract/four-skill-wiring.test.mjs` 已就「四个技能是否真接上」给出五条任务无关断言（读该文件 `:1-30` 的注释）。本次交付不改步骤表与检查器，只改说法、模板字段与既有读侧的判定口径，因此规格以「同一份事实、同一套读法」为主线。

## 功能需求清单（FR）

每条 FR 写「谁在什么场景做什么、可观察结果、失败是什么」并标来源；FR 编号是正文编号，机器编号对照见 Appendix B。

- **FR-01** 八要素问题陈述：计划作者在立项时写出谁／场景／现在怎么坏／证据／影响／不修后果／成功判据／边界八格。可观察结果：材料里八格各有内容，六格写实、两格有句或有可回读指针。失败：只写「交付质量差」这类标签，或把转述当原话。来源：`p1/card.md:15`；R-013。
- **FR-02** 存在性判定：同一作者给一条判定（待证／真实／不成立）与判定人；依据是当场复现或历史记录路径行号。可观察结果：判定行有具名判定人、有时间点；待证时附带三条各带代价的建议。失败：判定人写成作者却按独立判定读；缺项直接放行。干系人确认、反事实两条也要写，缺的记未取得。来源：p1/card.md:14；R-013。
- **FR-03** 期望来源与判据冻结：计划作者在写验收时写明期望来自规格／独立手算／已知结果／参照实现，并标观察点。可观察结果：验收行能指到四类来源之一；冻结后更改留理由。失败：指不出断言观察点却仍写通过条件。观察者、入口、输入、等什么状态四格名要与 AC-01 的判定人字段对齐。来源：R-006、p1/card.md；decision-log:538。
- **FR-04** 竞争根因与排除解释：计划作者在方案前给一条主因加一条可观察的排除解释，并列多因时必须标「多因并存」。可观察结果：根因段落能被独立审查判「已裁决」或「未裁决」。失败：把「人的失误」或症状当根因。来源：p2/card.md:7-14；R-013。
- **FR-05** 影响面四格与有主缺口：同一作者写调用方、数据兼容、回滚半径、影响量级；判不了时写谁补、最晚裁决点、返工上限。可观察结果：影响面四格齐；未知项有 owner 与时限。失败：只写模块名，或留一个「未知」就过。来源：p2/card.md:7-14；R-013。
- **FR-06** 备选、被否与回滚：方案作者在实施前给出备选与被否理由、最小可撤单元、回滚动作与时限、假设出错清单、单一负责人、时间盒；简单任务可只写一条路但必须写「为什么不比较」和谁何时补。可观察结果：缺这些的计划在既有收口缺口清单里被点名并退回补齐，阶段数与确认点数不变。失败：只写「按方案实施」，或把整分支回滚当回滚。来源：p3/card.md:4-14；R-013。
- **FR-07** 八步具名交付物：执行者每步交出具名文件、位置与读者。可观察结果：任一 Phase 的八步在既有步骤表与技能正文里都能找到交付物路径与读者。失败：清单正文写了字、文件不存在仍算通过。来源：p4/card.md:5-11；R-012、R-001。
- **FR-08** 两行同一存在性读法：读侧对阶段卡与验收记录用同一套四类结论（verified／missing／unverified／planned），`verified` 必须绑定本次运行，`unverified` 带诊断子类。可观察结果：同一份引用在两处给同一结论；同名旧文件不算通过。失败：文件在就当已具备；新增第五类或改四类名。来源：p4/card.md:5-11；R-003。
- **FR-09** 缺件与差值进终末结论：读侧把缺件与份数差值写进终末未取得项。可观察结果：缺一份清单时终末结论出现该缺件并置 unknown。失败：只打印、不进任何结论。缺件进终末 unknown/未取得列表，`chain_state` 仍 `unverified`，不得因缺件变 `failed`。来源：p4/card.md:11；R-011。
- **FR-10** 卡面状态一处解析、三处读取：收口者从卡面解析逐条状态（五种写法、同卡冲突、一格多值、子项全 verified 才算通过），材料检查、终末链、关单读同一份事实。可观察结果：删掉一条通过判据的唯一证据引用，三处都能看出来。失败：一处绿、另一处读不到；冲突被静默取一个。来源：p5/card.md:7-15；R-004。
- **FR-11** 报告对账：报告作者让分项和等于总数，并与卡面计数对照。可观察结果：跑任务四报告必须报出自称总数、分项和与差值，并点名差在哪。失败：拿报告自述当总数证据，或把差值当新基线。分项和＝总数，且非 pass 行数另报一次。来源：p5/card.md:11；R-011。
- **FR-12** 门覆盖差集点名：收口者算阶段级「声明／捕获／选中」三个集合的差集并逐个点名未覆盖阶段。可观察结果：差集非空时点名，且不把退出码零当覆盖。失败：只报计数不点名。来源：p5/card.md:11；R-004。
- **FR-13** 交付提交与有界复用：收口者从既有动作读 `source_commit`／`target_commit`；复用证据按命令、输入、范围与仍适用/验证版本判定。可观察结果：只有「已交付＝是」时判未取得；旧提交、旧材料、旧工具链不复用。失败：给任务库文件编提交号，或验证版本不同仍复用。复用结论必须同时写覆盖限制。来源：p5/card.md:11；R-005、R-007；U-018。
- **FR-14** 失败条件量原问题：验收作者给失败条件一个今天能跑出来的读数，且读数量原问题对象。可观察结果：独立审查能据该读数判红。失败：把「卡面写了」「页面能打开」「读口是绿的」「旧记录写着完成」当读数。来源：p6/card.md:7-14；R-002、R-013。
- **FR-15** 证伪测试与对照：同一作者写修复前会红、修复后会绿的断言，并选同期对照或同输入改前/改后（后者写明时间因素限制）。可观察结果：修复前就绿的断言被判「没在测这个缺陷」。失败：把「今天本来就绿」当修好了。写度量方式与观察时间窗，窗的起点是最后一次变更提交。来源：p6/card.md；decision-log:134、`:538-539`。
- **FR-16** 类型化判词与相反原件：验收作者按对象类型（数据、页面、性能、异步、并发、恢复、安装、集成、文档）选观察面；相反原件并列保留并写采信与谁复核；未运行或打不开不算合格。可观察结果：类型判词表里最多一格不适用，且不适用要写理由。失败：把归档目录当同一时刻的对照组；异步认固定延时。七层验收（用户可见／系统行为／数据一致／性能／可维护／回归／回滚）只用适用的层，不适用写理由；性能结论还要读采数脚本实际用了、跳过哪些必需工作。来源：p6/card.md:13；R-008、R-009。
- **FR-17** 前置任务逐条结论与旧判据三态：收口者在前四任务真实编号上逐条给四种结论之一（原件打得开／只剩缺口／文件在但内容对不上／未取得），并给每条旧判据「仍适用／过时／有缺陷」；判「仍适用」的当场做一次人为破坏。可观察结果：结论列不出现本包自己的「通过」，也不留空格子。失败：拿合并前判词或旧提交当交付版本。来源：p7/card.md:7-17；R-001、R-010、R-011。
- **FR-18** 集成态与缺件点名：收口者在最终版本上跑前四任务自己声明过的检查，缺输入写「因缺输入跳过」，任务二缺的承诺记未取得，T08 域级读数缺失点名。可观察结果：单卡通过不外推成整版通过。失败：临时新造命令或改退出码。来源：p7/card.md:13；R-010。
- **FR-19** 调研与拆包技能必读：三阶段（含轻档与子流程）开工按 `skills/task-breakdown/SKILL.md` 找一手来源、按源条目做覆盖分母、逐条需求过五问再切包，切完交每包人话卡。可观察结果：删一条源条目必须报未覆盖；把原话换成转述必须标来源不明。失败：只贴一句摘录当原始证据，或只加步骤清单不要求一手原件。来源：p8/card.md:8-18；R-014；U-013/U-014/U-017。
- **FR-20** 阶段入口必须走技能：四个阶段入口各写一句「必须走某技能」，同段写主持人不得自己写卡、答冷读、代对抗、判做完；被跳过角色要写清本该谁做、为什么没做、谁补、补之前哪条验收不成立。可观察结果：四入口命中同段禁令句，旧出口（需要三角色分开做时／不报缺独立审查／仅复杂任务／可以只写卡）搜不到。失败：只加「必须走」却留着旧出口。来源：p9/card.md:9-19、p9/design.md:469-473；R-015；U-020。
- **FR-21** 审查只做一次：冷读一轮、对抗一轮、异源一个包最多一次；改完不复核、不来回；不逐包向用户确认。可观察结果：限次句只在有「包」这个单位的两处，另三阶段搜不到；「复读」旧口径清零。失败：到限仍循环，或拿同源冷读冒充异源。来源：p9/design.md:477；R-016、R-021、R-023；U-022、U-029。
- **FR-22** 异源复用 wh-review 配置：异源派发复用四份既有配置（decision-maker→make-decision/detail、phase-maker→build-plan、task-maker→build-prd、run-phase→build-code），不重复配置；派不出记 unavailable＋owner＋恢复条件。可观察结果：异源原件可读并带四路状态；未派时记法合规。失败：把不可用写成通过，或另配一套。来源：p9/design.md:477；R-017；U-023。
- **FR-23** 审查结论直连：审查结论落在单元自己目录，主会话只发「读哪个文件、自己判断怎么改」；设计与执行在固定路径原件里写「改了什么／没改为什么」。可观察结果：主会话消息不夹带条数与建议；处置两栏可读。失败：主会话转述审查内容或替设计判断改不改。来源：p9/design.md:484；R-022；U-028。
- **FR-24** 单元总结、复盘与上下文成本：每个单元完成发五句话以内的总结并核四类落盘，齐了直接开下一个（能并发则并发、不空等后台）；每单元记一条复盘（原读数→现读数，或驳回候选＋理由＋保留位置）；派发说明写最小阅读集并回传读了几份几节，token 记未取得。可观察结果：总结可回读且带发出时刻；复盘三句实指、指针当场能打开。失败：总结夹确认请求，或复盘只写「顺利完成」。流程自检说明补校验值，与成本镜头同批；角色摘录、事实缓存、token 预算三项与最小阅读集并列（token 记未取得）；复盘记录逐条对应任务四的五个根因。来源：p9/design.md:478-481；R-018、R-019、R-020；U-026。
- **FR-25** 四技能角色：decision-maker、phase-maker、task-maker 只保留执行者（调研、发散、收敛、设计）与审查者（冷读、对抗、异源）；run-phase 保留开发者、独立审查者、独立测试者三个角色，测试与审查工作不同。每个角色写清谁、何时派、读什么、交什么、独立性、答不出退回给谁。可观察结果：陌生读者只读技能能说出各角色名、各自交什么，并知道 run-phase 的测试为什么不能并进审查。失败：前三份又拆出调研/设计/审查三个角色；run-phase 把测试并进审查；只写「必须独立」没有角色名与六项。执行者交至少三个方向不同的候选，至少一个被否并写适用条件。来源：p10/card.md；R-024–R-026；U-032。
- **FR-26** 角色产物与任务4坏例：角色交出的调研回件、审查原件、Phase 卡/任务卡进既有证据位与 claim `inputs`，`steps.json` 不动；任务4 P8 三个坏例按「谁查的/谁写的/谁签的」判不成立；build-plan 第 6 步绕过 phase-maker 有负控。可观察结果：没有角色原件不得记该步完成；三坏例都判不成立。失败：把角色产物写进 `steps.json`，或声称机器拦住「谁写的卡」。来源：R-027、R-028；U-030。
- **FR-27** 原始需求翻译契约：上下文包带原文逐字＋行位＋sha256；翻译对照六列（原文句/技能节/角色/原件/读者/失败验收）；冷读加三问、对抗加三问，答不出按阻塞。可观察结果：只答「卡里写了/字段齐/流程有」不算过；原文缺行位时冷读判答不出。失败：用「原义」代替原文，或只写流程不写角色。来源：R-029–R-031；U-031。

## 做成什么样？（用户旅程与状态）

五条旅程都是未来维护者、计划作者、实现者、收口者的真实动作序列；每条给「做完看到什么」，失败长相写在该条末尾。

### 旅程 A：维护者给新任务立项

1. 计划作者从 `workflows/make-decision/SKILL.md` 第 1 步进入，按 `skills/task-breakdown/SKILL.md` 复原原始请求与一手来源（出处、定位、日期、谁说的、什么情境）。
2. 在 `specs/<task-id>/decision-log.md` 第 2 段写出八格问题陈述与判定行；判定由未参与写的审查角色签，轻档才允许作者自判并写明「轻档自判」。
3. 存在性判不出时，把「建议做／建议不做／建议先补哪条读数」三条连同各自代价摆给用户，并停在该处等答复，不硬挡也不放行。
4. 按逐需求五问审一遍，再决定合并、拆分与依赖，按问题切包排序；每包交一张人话卡。

做完看到什么：决策日志第 2 段有两小节（八格＋判定行）与回放记录；每包一张卡。失败长相：八格写成空话，升级建议没有代价，判定人写成作者却按独立判定读。

### 旅程 B：计划作者把修复方案写成能退、能验的样子

1. 打开本任务 decision-log 第 2 段的根因表作为校准样例，写一条主因、一条可观察排除解释与证伪条件；判不了就写有主待证（谁补、最晚裁决点、返工上限）。
2. 写影响面四格；未知项写 owner 与时限，不写一个「未知」。
3. 写备选与被否、最小可撤单元、回滚动作与时限、假设出错清单、单一负责人、时间盒；简单任务只写一条路时补「为什么不比较」与补位人。
4. 写验收条款：每条给失败条件、读数、对照与观察点；写完当场找一个没参与的人按四问试读，答不出就重写那一段。

做完看到什么：计划材料里六项都在，验收条款指得到读数。失败长相：影响面只写模块名；回滚只有一行空壳；验收只写「应当验证」而不给落点。

### 旅程 C：实现者按 Phase 卡执行并交证据

1. 从 Phase 卡的首读符号与首改路径进代码；写集以卡为准。
2. 按 `skills/run-phase/SKILL.md` 八步执行，每步交出具名交付物与读者；证据引用按四类结论读，`verified` 必须对上本次运行的指纹。
3. 任一改动后重跑受影响验收；未重跑不得记该 AC 通过。
4. 单元完成时发五句话以内的总结（交出什么／哪条读数变了／哪个候选被驳回／下次改什么／记录路径＋缺口），核 decision-log、spec、phase、提交四类落盘，齐了直接开下一个单元。

做完看到什么：每份证据都能打开并对上本次运行；总结可回读。失败长相：清单正文有字、文件不存在仍判通过；改了之后沿用旧测试读数。

### 旅程 D：收口者判「问题是否消失」

1. 读卡面状态清单（一处解析的结果），看每条验收的状态、证据引用与冲突；同卡冲突保持「不一致」直到人改卡。
2. 做报告对账：自称总数、分项和、与卡面的差；差值是现象，不当新基线。
3. 算门覆盖差集并点名未覆盖阶段；读交付提交；判证据复用（命令、输入、范围、仍适用、验证版本）。
4. 在最终合并版本上逐条核前四任务承诺，给四种结论之一；旧判据给三态，判「仍适用」的当场做一次人为破坏。
5. 按 Appendix A 逐条判 AC；读不出就写读不出、最近还能查什么、谁补。

做完看到什么：报告里每一格都能指到原件或具名缺口；本包结论里不出现自己的「通过」。失败长相：卡面写通过、证据不存在仍判通过；拿合并前判词当交付版本。

### 旅程 E：四阶段开工与审查只做一次

1. 四个阶段入口的第一段就是「必须走某技能」与「主持人不得自己写卡、答冷读、代对抗、判做完」；想省角色就把四件事写清：本该谁做、为什么没做、谁补、补之前哪条验收不成立。
2. 同一份东西只审一次：冷读一轮、对抗一轮、异源一个包最多一次；到限即停，未闭合写未决＋owner。
3. 审查结论落在单元自己目录；主会话只发指针；设计与执行在固定路径原件里写处置两栏。
4. 改完不再送复审；只有测试例外：被测对象字节一变，执行者重跑受影响验收，回执时刻必须晚于最后一次变更提交。

做完看到什么：四入口同段禁令句在位、旧出口搜不到；异源原件可读或记 unavailable；测试回执比提交新。失败长相：四个入口都写「必须走」，但「小改动不报缺独立审查」还在；主会话消息里夹带 findings。

### 状态与异常行为

判据不写比例与阈值；下表只规定「看到什么现象、读作什么、谁补、什么条件恢复」，全部是可观察的字符串、文件可读性、退出码或真实现象。

| 现象 | 读作什么 | 谁补 | 恢复条件 |
| --- | --- | --- | --- |
| 八格中任一格空着 | 未取得，不判通过 | 计划作者 | 补齐后判定人重签 |
| 存在性判不出（无基线、无复现） | 待证，升级人工给三条带代价建议 | 用户 | 人给答复；答复前不硬挡、不放行 |
| 根因多因并列无裁决 | 未裁决；相关验收不成立 | 计划收口审查角色 | 一条主因，或有主待证三字段齐 |
| 方案无回滚或无被否 | 既有收口缺口清单点名，审查退回补齐 | 计划作者 | 补进缺口清单且不再新增门 |
| 证据文件不在 | `missing` | 执行者 | 交出真实文件 |
| 文件在但读不出 | `unverified`（`unreadable`） | 执行者 | 文件可读或换单一路径 |
| 声明了但没执行 | `planned` | 执行者 | 有执行回执 |
| 内容与本次运行不符 | `unverified`（`content-mismatch`） | 执行者 | 重新生成并与指纹一致 |
| 同一张卡两处状态相反 | 不一致（非通过），保留两个原值 | 卡作者 | 人改卡后重解析 |
| 报告分项和≠总数 | 报差值并点名差在哪 | 报告作者 | 分项和等于总数 |
| 门选中面与声明面差集非空 | 点名未覆盖；绿不算覆盖 | 阶段方法 owner | 补声明或补选中并复跑 |
| 只有「已交付＝是」没有提交号 | 未取得 | 收口者 | 从既有动作读出两个提交号 |
| 旧回执缺输入或验证版本 | unknown，不得复用 | 证据作者 | 补键后重判 |
| 异源审查未派 | unavailable＋owner＋恢复条件，不用同源顶替 | 主会话 | 真实派发一次 |
| 改了之后没有新测试回执 | 该 AC 不得记通过 | 执行者 | 回执时刻晚于最后一次变更提交 |
| 子代理真实 token 无处读 | 未取得 | 主会话 | 宿主可读时补 |
| 历史材料缺新字段 | 未取得／不适用，不回填、不补造 | 该材料 owner | 不适用写理由 |

### 每条验收的落点去哪找

落点由 build-plan 第 6 步的 Phase 卡给出；本文件只固定 AC 编号、判法与信号，Phase 卡只引用同号 AC、不改写判据。包内更细的命令与夹具留在十包卡与其设计原件（`quality/evidence/decision-maker/p1..p10/`），冲突时以本文件 Appendix A 为判真依据。

## 打算怎么做？

复用已有的材料位与读侧，只改说法与判定口径：把八要素写进既有决策日志模板，把五问与拆包写进一个新技能并被三处入口声明，把四类读取开放给阶段卡与终末链共用，把卡面状态解析成一份事实后三处读同一份，把审查限次与结论直连写进四阶段入口与四个技能。

- **为什么这样**：所有失败都来自「同一条结论在不同地方各算一次」；只算一次、三处读同一份，才可能删一条证据三处都可见。
- **放弃什么**：放弃「新增账本／新增检查器／新增阶段」三条最省事的路；放弃把简单任务压成完整三角色；放弃给每条验收加三格再按类型写九类判词。
- **失败怎样**：缺项、冲突、不可读一律写明读作什么、谁补、恢复条件，不编造、不静默取一个；机器到不了「谁写的卡」，就写「不冒充机器拦住」并由人读可见。

## 阶段大纲：几个阶段，各交什么？

1. 阶段边界与数量由 build-plan 第 6 步的 phase-maker 决定，本文件只给依赖与每组交付面。
2. 依赖顺序（来源 decision-log:229、`:672-674`）：WP10 → WP9 → WP8 → WP1 → WP2 → WP3 → WP4 → WP5 → WP6 → WP7，单向无环。
3. 最小切片：WP10（四技能角色改造）→ WP9（先禁止主持人自己干）→ WP8（找对问题）→ WP1（定义与存在性）→ WP4（一条真实承诺交得出证据）→ WP6（判这条问题是否消失）。
4. 需要时加执行建议第 0 阶段：规则见 `workflows/build-plan/SKILL.md` 的相关节；本节不单列 Phase、不称交付。包 10 的 `P1` 是真实交付 Phase（四技能角色改造），不是这里的执行建议第 0 阶段。
5. 每个阶段交出什么、交给谁：按上表依赖，前一组的中间结果写清消费者与读取方式；Phase 卡只写本阶段增量。

## 谁先谁后？

分九段，顺序按 decision-log:228 的包依赖（10 → 9 → 8 → 1 → 2 → 3 → 4 → 5 → 6 → 7）压成八个交付结果：P1 先做角色节，P2 再做入口禁令；P3–P9 各自首判自己的 AC，P8 是唯一末验收（P9 只补包级覆盖与单一事实源，不改 AC-01–AC-17 判法）。

**执行必然串行**：四个 `workflows/*/SKILL.md` 被 3–5 个包共用（`build-code` 最多 5 个 Phase），任一段的判定器都在读这些文件的字节，所以不存在两段并行；但串行不等于切细——切法仍按「一个能独立验收的结果」，不按文件或包数。每段的写集与写主见「实现设计」§5，依赖边见 §6。

| ID | 名字 | 一句话可判真假的结果 | 依赖 | 覆盖 AC | 覆盖包 | 写集摘要 | 判定器（谁／何时／用哪份产出） |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | 四技能角色改造 | decision-maker、phase-maker、task-maker 只保留执行者（调研/发散/收敛/设计）与审查者（冷读/对抗/异源）；run-phase 保留开发者/独立审查者/独立测试者三个角色，测试与审查分开。四份技能各有 `## 角色` 表，共 9 行（3×2＋3），每角色六项齐；三句反写清零；上下文包带原文逐字＋行位＋sha256 与翻译对照六列；冷读三问、对抗三问在位；任务 4 三个坏例判不成立。 | 无（起点） | AC-17 | WP10 | `skills/decision-maker/SKILL.md`、`skills/phase-maker/SKILL.md`、`skills/task-maker/SKILL.md`、`skills/run-phase/SKILL.md`；`skills/decision-maker/templates/package-context.md`；任务 4 三个坏例只读 | 实现者提交后：读四份技能的角色表与六项；`grep -c "## 角色"` 四份各 1；三句反写 grep 无输出；翻译六列可读；任务 4 三坏例按“谁查的/谁写的/谁签的”判不成立；`git diff --stat workflows/*/steps.json` 为空。 |
| P2 | 入口禁令与一次审查 | 四个阶段入口第一段都写着「必须走某技能＋必须派角色」；make-decision/build-prd/build-plan 派执行者/审查者，build-code 派开发者/独立审查者/独立测试者且同段有「主会话不得自己写卡／答冷读／代对抗／判做完」，四条旧出口整句搜不到；「复读」在该技能 0 命中，「最多派一次异源」只在有「包」这个单位的两处命中。 | P1 | AC-14、AC-15、AC-16 | WP9 | `workflows/make-decision/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-prd/SKILL.md`、`skills/decision-maker/SKILL.md`、`skills/phase-maker/SKILL.md`、`skills/run-phase/SKILL.md`（收尾节）、`skills/task-maker/SKILL.md`、`skills/stage-reflection/SKILL.md`、`workflows/make-decision/flows/small/SKILL.md` | 实现者提交后、独立审查前：跑 AC-14 的四条内联 `PARA` 与旧出口 grep、AC-15 的六条读数、`node --test tests/contract/four-skill-wiring.test.mjs`；AC-16 由独立审查角色读 `quality/evidence/reflection/unit-*.md`、`p9/replay/dispatch-sample-reply.md`、`closeout-cost-lens.md`。全部用 P2 提交的字节。 |
| P3 | 拆包技能接线 | 删掉一条源条目会被报未覆盖；三处入口能搜到 `task-breakdown`，六处指针指向同一文件同一锚；新接线测试退 0，且四个根 `steps.json` 与 `12aaa211` 逐字节相同。 | P2 | AC-13 | WP8 | `skills/task-breakdown/SKILL.md`＋4 份 references、`tests/contract/task-breakdown-wiring.test.mjs`、`skills/catalog.yaml`、`skills/reuse-registry.md`、三处入口前言、三个子流程 `steps.json` | 实现者提交后：`test -r skills/task-breakdown/SKILL.md`、三处 `grep -n "task-breakdown"`、`node tools/cli/build-skill-manifests.mjs --check --root=$(pwd)`、`node --test tests/contract/task-breakdown-wiring.test.mjs`；四条回放由独立审查角色读 `quality/evidence/p8-replay/`。 |
| P4 | 计划层三问闭环 | 拿一份只有任务卡的新立项材料，能判出「八格缺哪格、问题存在与否、主因是否裁决、影响面四格齐不齐、缺回滚是否被缺口清单点名」；阶段数、确认点与四条根 `steps.json` 不变。 | P3 | AC-01、AC-02、AC-03 | WP1、WP2、WP3 | `skills/decision-log/templates/decision-log-template-v2.md`、`docs/standard-workflow.md`、`skills/spec-plan/templates/phase-template.md`（`:211`／`:502`／`:528-533`／`:680`／`:704`）、`workflows/build-code/SKILL.md`（`:178`）、`workflows/build-plan/SKILL.md`（`:44`／`:101` 后新行）、`workflows/make-decision/SKILL.md`（`:114`／`:137`／`:222` 邻域）、`skills/decision-maker/SKILL.md`（`:85` 邻域） | 实现者提交后：AC-03 跑 `BASE=12aaa211` 两条 `git diff --stat`（①空、②非空）＋缺口清单读数；AC-01／AC-02 由独立审查角色读 `quality/evidence/p1-replay/`、`p2-replay/` 与 `decision-log:76-86`，逐格写判词。 |
| P5 | 执行证据契约 | 同一份证据写在阶段卡与验收记录两处给同一结论；五条夹具依次输出 `verified`／`missing`／`unverified(unreadable)`／`unverified(no-run-binding)`／`unverified(content-mismatch)`；缺一份清单会进终末未取得项。 | P4 | AC-04、AC-05 | WP4 | `runtime/stage/stage-content-contracts.mjs`（`:279` 加 `export`）、`tools/cli/stage-runtime.mjs`（`:1891` 改调）、`tools/cli/run-checks.mjs`（`:544`）、`runtime/task/final-chain-runner.mjs`（`:417`）、`tests/contract/final-chain-runner.test.mjs`（只改 `ordinaryContractFixture` 三处夹具，期望零改；不弱化 `:417`）、`skills/run-phase/SKILL.md`（八步正文） | 实现者提交后：五夹具命令＋`grep -c '^export function'` = 12＋`node --check`；AC-04 由独立审查角色读 `skills/run-phase/SKILL.md` 八步与 `quality/evidence/p4-replay/` 的任务四 13 段点名。 |
| P6 | 版本对账与门覆盖 | 卡面 78 条能解析出逐条状态，同一份事实在三处读同一结论；报告必须报「自称 78、分项和 76、差 2」；只有「已交付＝是」判未取得；门覆盖差集非空时逐个点名。 | P5 | AC-06、AC-07、AC-08 | WP5 | `runtime/stage/stage-content-contracts.mjs`（`acCardStatuses`＋`:1428` 的 `ac_status`）、`core/task-close.mjs`（`:805` facts）、`runtime/task/delivery-claims.mjs`（`:450` 前新增导出 `applyRefVerdicts`）、`tools/cli/run-checks.mjs`（输出段）、`runtime/task/final-chain-runner.mjs`（`:417` 第二次） | 实现者提交后：`--task-path` 跑逐条状态（含任务四副本删引用后三处同结论）、三份记录跑交付与复用判定、门覆盖三集合；独立审查角色读 `quality/evidence/p5-replay/` 与那张冲突清单。 |
| P7 | 问题消失验收 | 归档 AC-P1-006 被判不合格且理由指向「失败条件只量卡面文字」；修复前就绿的检查被判「没在测这个缺陷」；未运行或打不开的记未取得，不记合格。 | P6 | AC-09、AC-10、AC-11 | WP6 | `skills/spec-specify/SKILL.md`（`:164-197`）、`skills/run-phase/SKILL.md`（`:74-82`）、`workflows/build-code/SKILL.md`（`:327`／`:331`／`:334`）、`skills/spec-plan/templates/phase-template.md`（`:237`／`:554` 加「读数」格） | 实现者提交后：`node tools/cli/rule-tables.mjs check --root .` 的 exit 1／12 条与 `grep -c "读数"`；AC-09／10／11 由独立审查角色读 `quality/evidence/p6-replay/` 四例与归档 `spec.md:1249`。 |
| P8 | 前置任务与全 AC 收口 | 在最终合并版本上，前四任务 127 条逐条只有四种结论、结论列没有本包自己的「通过」；旧判据三态齐且「仍适用」被当场破坏变红；集成态只跑前四任务声明过的命令；全部 17 条 AC 在最终字节上给出结论。 | P7 | AC-12（首判）＋ AC-03／04／06／13／14／15 的最终字节重跑；其余 AC 消费首判原件一次 | WP7 | `skills/stage-close/SKILL.md`（`:12` 邻域）、`workflows/build-code/SKILL.md`（`:386` 邻域） | 独立审查角色在最终提交后：读 `quality/evidence/p7-replay/` 的判词表／三态表／集成态读数表，跑 `grep -n "T08"`，重跑上列 6 条 AC 的命令并逐条给结论。 |
| P9 | 包级覆盖补齐与根治 | 交付包级覆盖账（10 个包节、97 行四值、40 行缺口带 owner）、五处卡面漂移同值、四处根治各在唯一文件，并首判 AC-18／AC-19；只改卡面词面与 spec 一致性，不改 AC-01–AC-17 判法、不改已完成 Phase 交付字节。 | P8 | AC-18（首判）、AC-19（首判）；AC-13①② 只读复核未被动；其余 AC 只登记判点缺口 | WP1–WP10（全包覆盖） | `spec.md`、`phases/P1`–`P8` 四张卡的漂移句、`skills/phase-maker/SKILL.md`、`workflows/build-plan/SKILL.md`、`skills/wh-review/SKILL.md`、任务根 `quality/evidence/build-plan/package-coverage-ledger.md` | 独立审查角色在本段提交后：读覆盖账与五处卡面实际字节，跑 P9 卡 `gate_cmd`（ORACLE-P9-PACKAGE-COVERAGE）与五条验收读数，逐条判 AC-18／AC-19 与四处根治。 |

切超过 9 段时不必写合并理由——本计划恰为 9 段；把 P4 再拆成两段的被否理由、以及把 P2–P8 七段并成三段的被否理由见「实现设计」§11。包 10 的 P1 是真实交付，不是执行建议第 0 阶段；执行建议第 0 阶段不适用（`workflows/build-plan/SKILL.md` 的规则未触发）。（节号沿用原编号：§2 与 §4 的内容分别在「代码锚点」与「接口与失败语义」两节内，§11 不存在，回指按原编号读。）

## 还有什么没定？

未决都写真实owner与恢复条件；判不了的记 unknown，不编造。

- **未决 1（OPEN-01）**：任务二逐包承诺原话未取得（decision-log:695 OI-2）。影响：WP7 只能记未取得。谁定：用户；恢复条件＝用户给出七包逐包原话。
- **未决 2（OPEN-02）**：存在性频率无法从现有材料得出（decision-log:694 OI-1）。影响：WP1 只能记「真实，频率未知」。谁定：后续任务补真实读数。
- **未决 3（OPEN-03）**：`task-breakdown` 是被三阶段原生吸收还是长期外挂（decision-log:696 OI-3）。影响：删除条件待定。谁定：WP9 收口时按技能消费者与删除条件定。
- **未决 4（OPEN-04）**：包 9 异源审查未跑（p9/design.md:500 U4、decision-log:698 OI-5）。影响：AC-15 只能按「记法合规」判，不按「有原件」判。谁定：主会话；恢复条件＝真实派发一次。
- **未决 5（OPEN-05）**：新增四组需求（R-018–R-023）只有主会话转述、无一手指令原话（p9/design.md:502 U6）。影响：不影响判据，只影响来源强度。谁定：主会话补到需求索引。
- **未决 6（OPEN-06）**：判定者独立性口径两处不同步（decision-log:538 要求比较≠交付者；p6/card.md 记用户裁决「不记谁来判」只覆盖包 6）。影响：本文件把「独立判定者」写成具名不适用（见 Appendix B），不据此判 AC。谁定：主会话统一两处措辞。
- **未决 7（OPEN-07）**：子代理真实 token 无 producer（p9/design.md:497 U1）。影响：WP9 的上下文成本只能报「读了几份几节」。谁定：主会话。

## 实现设计（全局权威）

本节是本次实现的全局设计唯一权威（写集列以 `phases/index.md` 的「唯一写集权威」为准，本节写集表与索引一致）：十包设计在此压成一份代码锚点、接口、写集、依赖、追踪与测试安排。Phase 卡只写本 Phase 的增量并回指本节，不复制正文。

读法：`文件:行` 全部取认证 worktree 工作树当前字节（HEAD `12aaa211` ＋ 两处未提交改动），2026-11-26 实读，可 `sed -n '<行>p' <文件>` 复核。十包卡与本节冲突以本节为准；本节与 Appendix A 冲突以 Appendix A 为准（`spec.md:371`）。本任务是文本＋运行时读取改造，不含页面、路由或视觉产物。

### 1. 实读基线与七处纠正

以下七处是十包卡或本轮 recon 与实读不符的地方，Phase 卡不得照抄旧值。

| # | 声称 | 实读（2026-11-26） | 处置 |
| --- | --- | --- | --- |
| K1 | `stage-content-contracts.mjs` 有 14 个 `export function`，改后 16 | `grep -c '^export function'` = **11**；末行 `:1544` 另有 1 个 `export { … }` | P5 只新增 1 个导出（`checkEvidencePath`），改后 **12**；搜索根函数保持私有，不扩导出面 |
| K2 | 验证器「保持纯形状」可用 `grep -n 'fs'` 核，改前 0 | `grep -c 'fs'` = **5**，全是 `refs`/`Of` 之类子串；真实导入只有 `:1 import { SHA256_HEX }` | 判据改为 `grep -c 'node:fs'` = 0（改前改后都为 0），旧命令会假红 |
| K3 | `skills/decision-maker/SKILL.md` 的「复读」只需改 `:273-274` | 「复读」实读 **15 处**：`:75`、`:169`、`:171`、`:187`、`:249`、`:250`、`:265`、`:273`、`:274`、`:289`、`:325`、`:366`、`:407`、`:428`、`:452` | AC-15③ 要 `grep -c '复读'` = 0，P2 必须全清 15 处，不是改两句 |
| K4 | `skills/stage-reflection/SKILL.md` 已有「原读数 → 现读数」可改为指针 | 实读 **0 命中**（`grep -n '原读数'` 无输出） | AC-16② 要它命中的是**新建句子**，写进该文件 `:28-55` 的「单元复盘记录」节 |
| K5 | `check-skill-consistency.mjs:429` 是入口 `--root` 校验 | `:429` 实读 `if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {` | 不作为任何 AC 的判点；`check-skill-consistency` 只按整条命令退出码用 |
| K6 | 四个技能收尾节在 `phase-maker:134-139`、`run-phase:119-125`、`task-maker:128-133` | 标题实读 `phase-maker:132`、`run-phase:117`、`task-maker:126`，节体到各自下一个 `## ` | P2 按 `132-138`／`117-124`／`126-132` 写 |
| K7 | `build-code/integration` 聚焦句在 `simple-review-runner.mjs:106-114` | 该文件不存在；真身 `runtime/review/review-packet-identity.mjs:17`（`REVIEW_FOCUS` 表 `:10-18`） | 只作缺口登记，不进本任务写集；`review-policy.mjs:8` 的 `["phase", TERMINAL]` 仍成立 |

另有三条硬提醒，写 Phase 卡时必须照办：①包 5 的 `acCardStatuses`／`facts.ac_status`／`source_commit`／`target_commit`／复用键**全是新建**，首改位置只能写插入点，不得写成「改现有定义」（全仓 `grep -rn 'ac_status\|source_commit'` 在生产代码 0 命中，仅 `runtime/review/schemas/attempt.schema.json:34-36` 有同名异义键）；②包 4 的「同一读 helper」今天不存在——`checkEvidencePath` 在 `stage-content-contracts.mjs:279` 是私有 `function`，「新增导出 ＋ 让 `tools/cli/stage-runtime.mjs:1891` 改调同一函数」是一个动作，不是「复用已有导出」；③包 9 的 F15 文件名错误见 K7。

### 代码锚点

本次主要代码锚点：`runtime/stage/stage-content-contracts.mjs`、`tools/cli/run-checks.mjs`、`runtime/task/final-chain-runner.mjs`。

#### A. 计划层材料（P4）

| # | 文件:行 | 现状（逐字／性质） | 动作 |
| --- | --- | --- | --- |
| A1 | `skills/decision-log/templates/decision-log-template-v2.md:50-56` | `:50 ### 原始需求`、`:51 正文用「需求 1、需求 2」这种中文编号，一行一条。`、`:53-56` 四列表 `\| 编号 \| 原义 \| 来源 \| 落到哪个包 \|` | 在「原始需求」节内加两小节（八格问题陈述＋判定行），写成续行/表后形状，**不新增 `###` 子标题、不加列**，以免撑破 `check-decision-log-chain.mjs:702` 的 `DESIGN_ITEMS` 十项与 `build-decision-baseline.mjs:52-54` 的标题收集 |
| A2 | `skills/decision-log/templates/decision-log-template-v2.md:56` 之后 | 根因与影响面今天无载体（`grep -c '根因' workflows/make-decision/SKILL.md` = 0） | 加「根因状态＋影响面四格」节，作全仓唯一正文 |
| A3 | `docs/standard-workflow.md:86` | `判断不了影响面时用最小可证伪集合并记录未知影响面。`（逐字，全仓 3 处同句） | 改为「写清谁补、最晚裁决点、返工上限」，此处留正文 |
| A4 | `workflows/build-code/SKILL.md:178` | 同句命中 | 改成指针（指向 A3），删正文 |
| A5 | `skills/spec-plan/templates/phase-template.md:502` | 同句命中 | 改成指针（指向 A3），删正文 |
| A6 | `phase-template.md:680`、`:704` | `\| 为什么做 \| 来源 / FR / AC \|`；占位行 `为什么做：[写清本卡解决谁的什么问题…]` | 「为什么做」节加五要素摘要一句，不改列名 |
| A7 | `phase-template.md:211` | `- **主要风险**：最可能让本 Phase 返工的一件事，以及**若因它返工，替代走法是什么**。` | 加「假设已经出错」一行（谁、何时、看到什么信号） |
| A8 | `phase-template.md:528-533` | 风险块六行：`:528 风险`、`:529 影响`、`:530 缓解`、`:531 回滚`、`:532 补救与交接`、`:533 触发条件` | 保留六行，`回滚`行补「最小可撤单元／退一次多久」；不删行 |
| A9 | `workflows/build-plan/SKILL.md:44` | `1. <a id="step-read-current-materials"></a>读取当前决策及已有材料`（逐字） | 第 1 步提取项加「读问题陈述与判定」 |
| A10 | `workflows/make-decision/SKILL.md:114`、`:137`、`:222` | 三个步骤锚（`:114 step-load-context`、`:137 step-outline-hypothesis-talk`、`:222 step-module-convergence`） | 各加一句：第 1 步产物带八格、第 2 步问题来源、第 9 步待证升级交人 |
| A11 | `skills/decision-maker/SKILL.md:44-45`、`:451` | `:45 可以只写卡加一次冷读，不强制三个角色，但缺口要写清谁补。`；`:451` 同义 | 轻档口径收成 `:85` 一处；`:45`／`:451` 改指针。**:45 的「可以只写卡」必须消失**（AC-14② 的 grep 面） |
| A12 | `workflows/make-decision/flows/small/SKILL.md:57` | `…不做完整三角色、不强制对抗九问、不设独立审查轴，也不误报缺独审或漏冷读。` | 归 P2 唯一写；改成指向 `:85` 的缺口四件，删降级句 |
| A13 | `workflows/build-plan/SKILL.md:101` | `缺口清单非空时 build-plan 不许收口，补齐后只复核受影响需求。`（逐字） | **逐字不动（DO NOT TOUCH）**；在 `:101` 之后另起一行加「收口核四项」一句，不覆盖原字节 |
| A14 | `core/task-close.mjs:484`、`tests/contract/stage-close-pr-contract.test.mjs:19` | `Door`／`Blast Radius` 的非空正则与夹具（逐字） | **DO NOT TOUCH**：影响面四格不改这里，只在计划侧写 |

#### B. 入口禁令与一次审查（P2）

| # | 文件:行 | 现状（逐字） | 动作 |
| --- | --- | --- | --- |
| B1 | `workflows/make-decision/SKILL.md:282-283` | `需要三角色分开做时走 \`skills/decision-maker/SKILL.md\``；`不强制完整三角色或九问，不报缺独立审查。` | 换为「必须走 `skills/decision-maker/SKILL.md`」＋同段「主会话不得自己写卡、答冷读、代对抗、判做完」；AC-14② 的四条旧句之一必须整句消失 |
| B2 | `workflows/build-code/SKILL.md:208`、`:215` | `仅复杂任务的 build-code Phase 固定 1 开发、1 审查、1 测试`；`主会话只核对四项` | `:208` 换为「每 Phase 必须走 `skills/run-phase/SKILL.md`」；`:215` 保留四项并为「主会话不得自己执行 Phase」的句形样板 |
| B3 | `workflows/build-plan/SKILL.md:70`、`:77` | 第 6 步 `step-spec-plan`、第 7 步 `step-testing-system-blueprint` 段首（逐字见实读） | 各加「设计 Phase 必须走 `skills/phase-maker/SKILL.md`；主会话不得自己写 Phase 卡」 |
| B4 | `workflows/build-prd/SKILL.md:19`、`:41` | `方法条款：本阶段第 4 步消费 \`skills/task-maker/SKILL.md#expand-task-section\``；`:41` 是第 4 步内的 `sectional-review` 句式 | 同段加「必须走 `skills/task-maker/SKILL.md`」＋主会话禁令 |
| B5 | `skills/decision-maker/SKILL.md:85`、`:268-278` | `:85` 缺口四件唯一定义；`:268 ## 审查怎么走（两轮封顶）`，`:273 同一人复读`、`:274 两轮封顶` | `:85` 留作缺口四件唯一正文；`:268-278` 改「一次即结论」，并清掉全文 15 处「复读」（K3）；同节加字面句 `最多派一次异源` |
| B6 | `workflows/make-decision/SKILL.md:268-278` 邻域 | 决策阶段入口的审查节 | 加字面句 `最多派一次异源`（AC-15① 要求两处都命中），且不得在 build-plan／build-code／build-prd 出现同句（AC-15②） |
| B7 | `skills/phase-maker/SKILL.md:132-138`、`skills/run-phase/SKILL.md:117-124`、`skills/task-maker/SKILL.md:126-132` | 三处「收尾：单元复盘记录」节 | 各补一句「下一位读者是谁」并写单元总结五条上限 |
| B8 | `skills/stage-reflection/SKILL.md:28-55` | 「单元模式：单元复盘记录」节，无「原读数」（K4） | 新建三句下限，含逐字 `原读数 → 现读数`（AC-16② 的 grep 目标） |
| B9 | `tests/contract/four-skill-wiring.test.mjs:1-30` | 四技能接线契约（已存在，五条任务无关断言） | **DO NOT TOUCH**；P2／P3／P8 只跑它，`node --test` 必须退 0 |
| B10 | `skills/wh-review/scripts/third-review-host-config.mjs:325` | `const required = stage === "build-code" ? "full_only" : "single_round";` | **DO NOT TOUCH**：四份异源配置复用，不另配一套 |

#### C. 执行证据契约（P5）

| # | 文件:行 | 现状（逐字／性质） | 动作 |
| --- | --- | --- | --- |
| C1 | `runtime/stage/stage-content-contracts.mjs:279` | `function checkEvidencePath(token, roots, taskRecordRoot) {`（**无 export**，私有；唯一调用点 `:1170`） | 加 `export`；实现体不改（返回 `{status, resolved\|reason}` 的形状保持） |
| C2 | `tools/cli/stage-runtime.mjs:1891` | `try{validateAcceptanceEvidence(candidate,\`acceptance ${entry.id}\`);}` | 改为调 C1 的同一函数（新 import ＋ 同一行改调）；一行内完成，不新增第二处判断 |
| C3 | `runtime/stage/stage-content-contracts.mjs:239`、`:256` | `function evidenceSearchRoots(reviewReadScope, materialPath) {`、`function readableEvidenceRoots(roots) {`（均私有） | **保持私有**（K1：导出面只加 1） |
| C4 | `runtime/stage/stage-content-contracts.mjs:839` | `export function readinessFingerprint({ phasePath = "", rows = [], cwd = process.cwd() } = {})` | **DO NOT TOUCH**：作为「绑本次运行」的既有先例引用，不改 |
| C5 | `runtime/evidence/acceptance-evidence-validator.mjs:1`、`:9`、`:29` | 唯一导入 `:1 import { SHA256_HEX } from "./canonical-utils.mjs";`；`:9` 八值表；`:29` 纯形状声明 | **DO NOT TOUCH**：判「未加 fs」用 `grep -c 'node:fs'` = 0（K2） |
| C6 | `tools/cli/run-checks.mjs:534`、`:543-544` | `function runFailureRecordChecks(root, facts, recordRoot)`；`:543` 拼 `execution-checklist-<phase>.md`；`:544 if (!existsSync(checklist)) continue;` | 把 `continue` 换成「记一条缺件结论」（不改退出码、不改函数签名） |
| C7 | `runtime/task/final-chain-runner.mjs:417` | `let applicable=checked.phase_count === phases.length && same(checked.fr_coverage?.accepted_ids,expectedFrs) && same(checked.ac_coverage?.accepted_ids,expectedAcs);` | 追加 `evidence_paths` 的 missing／unverified 判定（同一行表达式内，不新起函数） |
| C8 | `skills/run-phase/SKILL.md:37-101` | 八个步骤锚（`grep -c '<a id="step-'` = **8**），每步正文 | 每步补「具名交付物路径 ＋ 读者」；**锚标签逐字不动**（`workflows/build-code/steps.json` 8 条 `skill` 依赖它们） |
| C9 | `core/task-close.mjs:1308`、`:1301`、`:1325` | `const { runFinalChainCheck } = await import("../runtime/task/final-chain-runner.mjs");`；`async function assertDeclaredStepsComplete`；`throw failure("STEP_EVIDENCE_INCOMPLETE", …)` | **DO NOT TOUCH**：终末承接已有，P5 只改 C7 |

#### D. 版本对账与门覆盖（P6）

| # | 文件:行 | 现状（性质） | 动作 |
| --- | --- | --- | --- |
| D1 | `runtime/stage/stage-content-contracts.mjs:1428` | `const facts = Object.freeze({`（逐字），`:1444` 是 `ac_coverage:` 键 | 在 `facts` 对象内**插入新键** `ac_status`（不改任何既有键；`ac_coverage` 原样保留） |
| D2 | 同文件，`:839-901` 之后、`:902 export function legacyReadinessChanges` 之前 | 此处是 readiness 纯函数区，无 fs 依赖 | **新增** `export function acCardStatuses(markdown)`（纯函数：五种写法、同卡冲突、一格多值、子项全 verified） |
| D3 | `core/task-close.mjs:778`、`:805` | `:778 let sourceCommit = task ?? actions.filter(...).at(-1)?.source_head ?? …`；`:805 const facts = { delivery_committed: sourceAvailable && …` | 在 `:805` 的 `facts` 对象内**插入** `source_commit`／`target_commit`（值来自 `:778` 的 `sourceCommit` 与既有 `target_head`，`:1244` 的 completed 行已有该键）；`delivery_committed` 布尔保留不改 |
| D4 | `runtime/task/delivery-claims.mjs:232`、`:326` | `const DECLARED_GATE = /^[ \t]*[-*][ \t]+\*\*gate_cmd\*\*[ \t]*[:：][ \t]*…/gm;`（逐字见 `:232`）；`export function gateIdentityFromCapture({ phases, command, phaseId = null } = {})` | **DO NOT TOUCH** 两处；在 `:450` claim 区之前**新增导出** `declaredGateCoverage({ phases, captures })`，内部只调这两处 |
| D5 | 同文件，`:450` 之前（与 D4 同插入区） | claim 区起于 `:450`，`claim_codes` 在 `:607` | **新增** `evidenceReuseKey({ argv, cwd, inputs, scope, tool })` 与 `verificationVersion` 判定（`started_at/ended_at` 不进 key） |
| D6 | `tools/cli/run-checks.mjs:691` | `async function runMaterialChecks(root, { stage } = {}) {` | 在输出段追加 D4／D5 的读数（不新建 CLI；`--task-path` 与 `--material-root` 两模式已存在，见 `:22`／`:48-51`／`:61`） |
| D7 | `runtime/task/final-chain-runner.mjs:417` | 同 C7 的那一行 | P6 在 C7 交付后**第二次**改同一行表达式，加 `ac_status` 读取 |
| D8 | `runtime/task/delivery-claims.mjs:360`、`:384`、`:607` | `gate_unbound`／`gate_unwrap_depth` 读点、`claim_codes:` | **DO NOT TOUCH**：三个已登记字段只消费不改 |
| D9 | `tools/cli/stage-runtime.mjs:1163-1199` | `:1166 gate_unbound: gateIdentity.unbound,`、`:1167 gate_unwrap_depth: gateIdentity.depth,` | **DO NOT TOUCH** |

#### E. 拆包技能（P3）

| # | 路径 | 性质 | 动作与消费者 |
| --- | --- | --- | --- |
| E1 | `skills/task-breakdown/SKILL.md` | **NEW** | 一份方法正文（九条：问题陈述／存在性／根因假设／影响面／修复选项／问题消失验收／逐需求五问／覆盖／停止条件）；消费者＝三处入口前言声明 ＋ 三个子流程 `steps.json` 的 `skill` 指针 ＋ `check-stage-steps.mjs:1430` 的 `DESIGNATED_STEP_SKILLS` 读取 |
| E2 | `skills/task-breakdown/references/问题陈述模板.md` | **NEW** | 八格模板；只给格名与内核指针，不抄 `unit-kernel/SKILL.md:94` 十一格判据 |
| E3 | `skills/task-breakdown/references/存在性判据.md` | **NEW** | 三态（待证／真实／不成立）与升级三建议的条件 |
| E4 | `skills/task-breakdown/references/根因影响验收清单.md` | **NEW** | 一条主因＋一条排除解释；影响面四格；读数与对照 |
| E5 | `skills/task-breakdown/references/逐需求五问审查表.md` | **NEW** | 五问逐条落点，供切包排序 |
| E6 | `tests/contract/task-breakdown-wiring.test.mjs` | **NEW** | 六处指针（三根前言＋三子流程）都指向同一文件同一锚；断链报红 |
| E7 | `skills/catalog.yaml:288` 邻域 | MODIFY | 加一条技能登记；**实读形状含 `used_by_stages`**（`:296`），不止 recon 列的八项 |
| E8 | `skills/reuse-registry.md:26` 邻域 | MODIFY | 「阶段入口」表加一行（照 `:26` decision-maker 行形制） |
| E9 | `workflows/make-decision/SKILL.md` 前言段、`workflows/build-plan/SKILL.md` 前言段、`workflows/build-prd/SKILL.md` 前言段 | MODIFY | 各一句「必须按 `skills/task-breakdown/SKILL.md` 做，轻档同样」——**这是 AC-13② 的 grep 面** |
| E10 | `workflows/make-decision/flows/small/steps.json`、`…/normal/steps.json`、`…/planning/steps.json` | MODIFY | 各加一处 `"skill": "skills/task-breakdown/SKILL.md#…"`（实读三份今天 `grep -c '"skill"'` = 0，是真新增，不占位） |
| E11 | `workflows/make-decision/steps.json`、`…/build-plan/steps.json`、`…/build-code/steps.json`、`…/build-prd/steps.json` | **DO NOT TOUCH** | 见写集 §5「AC-03① 冲突」：这四份一改，AC-03① 的 `git diff --stat $BASE` 必然非空 |

#### F. 问题消失验收（P7）

| # | 文件:行 | 现状 | 动作 |
| --- | --- | --- | --- |
| F1 | `skills/spec-specify/SKILL.md:164-197` | `### 验收标准怎么写才可实现` 起于 `:164`（不是 `:160`），节尾 `:197`；`:185` 是「硬规则：一条验收如果在当前任务、当前资源、当前预算下不可能被判为通过，」 | 加六句硬规则（读数＋观察点、读不出三分支、期望产不出→判据不可执行、对照规则、相反原件并列、类型只决定观察面），本节即全仓唯一正文 |
| F2 | `skills/run-phase/SKILL.md:74-82` | `## 第 6 步：核验收与 UI` 起段 | 加一句指回 F1，不复制正文 |
| F3 | `workflows/build-code/SKILL.md:327`、`:331`、`:334` | `:327` RP-11 行；`:331` RP-15 行；`:334` 终末第 8 段 final-report 段首 | 两处各加「读数」指过去一句；`:334` 与 P6 同段，串行且 P6 先 |
| F4 | `skills/spec-plan/templates/phase-template.md:237`、`:554` | `:237 ## 这一 Phase 怎么验收？`；`:554 ## 验收 Phase 才能做的检查` | 两处表格各加一格「读数／还没观察＋等什么＋谁在什么步骤重跑」 |
| F5 | `tools/cli/rule-tables.mjs:33`、`tools/cli/check-replay.mjs:22` | `const PACKAGE_ROOT = …`；`export const REPLAY_VERDICTS = Object.freeze(["target_red", … "target_green", …])` | **DO NOT TOUCH**：`target_green` 是既有名字（AC-10 直接用），红读数是既有的（`node tools/cli/rule-tables.mjs check --root .` 实跑 exit 1／12 条） |

#### G. 前置任务与集成态（P8）

| # | 文件:行 | 现状 | 动作 |
| --- | --- | --- | --- |
| G1 | `skills/stage-close/SKILL.md:12` | `复杂任务的 build-code caller 提供唯一实际 final-report 的 ref/sha256，不猜最新文件。` | 第 1 节末加两小段：旧判据三态＋人为破坏、集成态一行；只加不改 `:12` |
| G2 | `workflows/build-code/SKILL.md:386` | `首判来源与当前适用分开：… 当前终末 raw 每条 current_applicability …` | 旁加一句指针「旧判据三态与集成态读数见 `skills/stage-close/SKILL.md`」，不改原句 |
| G3 | 前四任务材料与域卡锚点（`specs/archive/delivery-quality-code-20261124/`、`…/delivery-quality-plan-20261123/`、`quality/evidence/decision-maker/p7-replay/`） | 实读存在 | **DO NOT TOUCH**：只读回放与点名缺口，不改锚、不回填 |

### 3. 选定方案

一句话：**同一份结论只算一次，三处读同一份**，其余全部落在既有材料位与既有读取入口上。

- **D1 单一事实**：卡面逐条状态由一个纯函数 `acCardStatuses` 解析一次，结果放进已有的 `facts` 对象（`stage-content-contracts.mjs:1428`），材料检查、终末链、关单读同一份。放弃「各入口各算一次」与「新增第二本状态账本」。
- **D2 同一读 helper**：把已有但私有的 `checkEvidencePath`（`:279`）导出，让任务分支的 `stage-runtime.mjs:1891` 调同一函数，两行同一套四类结论。放弃「新建通用读取模块」（多一个公开文件与一轮迁移）与「只让纯形状验证器去读文件」（会弄坏安装链）。
- **D3 问题消失写进验收写作正文**：`spec-specify:164-197` 六句硬规则是全仓唯一正文，三处指过去。放弃「每条验收再加三格＋九类判词」（多数类型无对象，等于七行写不适用）。
- **D4 交付与复用**：关单 `facts` 加两个提交号（新键，取自 `:778` 的既有派生），复用键取 `argv+cwd+inputs+scope+tool`，另判 `verification_version` 与 `still_applicable`。放弃「给任务库文件编提交号」与「把时间戳塞进身份」。
- **D5 入口只改第一句**：四入口各一句「必须走某技能」＋同段主会话禁令，旧的四条降级句只删不加。放弃「新增事后检查器」（要新判定与新测试，且与用户「不要主要靠事后检查」相反）。
- **D6 审查只做一次＋单元效率**：冷读一轮、对抗一轮、异源一个包最多一次；测试是唯一例外（改完必须重跑）。放弃「两轮封顶＋复读」（AC-15③ 要求「复读」在该文件 0 命中）。
- **D7 拆包方法只写一份**：`skills/task-breakdown/` 一份正文，六处指针读它。放弃「三阶段各抄一份」（必然漂移）。

为什么这样：七个真实失败读数（71 条里 12 条打不开、报告 76≠78、AC-P1-006 只验卡面、7 条 incomplete 押未来、T08 零命中、调研漏 4 条、单元无复盘）都是「同一条结论在不同地方各算一次」的同构。只算一次、三处读同一份，才可能「删一条证据三处都可见」。

### 接口与失败语义

| 接口 | 产出者 | 消费者（真实调用点） | 失败时 |
| --- | --- | --- | --- |
| `checkEvidencePath(token, roots, taskRecordRoot)`（新增导出，`stage-content-contracts.mjs:279`） | P5 | `tools/cli/stage-runtime.mjs:1891`（改调）＋既有 `:1170` | 返回 `{status:"missing",reason}`／`unverified`＋`reason`；沿用现私有实现，不抛新异常、不改四类名 |
| `facts.ac_status`（新键，`:1428` 内） | P6 | `tools/cli/run-checks.mjs`（材料检查）、`runtime/task/final-chain-runner.mjs:417`（终末链）、`core/task-close.mjs`（关单） | 字段缺 → 三处同记 `未取得`，不各自重算、不静默取一个 |
| `acCardStatuses(markdown)`（新增导出） | P6 | 只在 `facts` 生成处调用一次 | 解析不出 → 该条 `unknown`；总数与逐条数不等 → 输出差值；冲突条永远算「不一致」并保留两个原值 |
| `source_commit`／`target_commit`（新键，`core/task-close.mjs:805` 内） | P6 | 关单 reader、`tools/cli/check-delivery-claims.mjs` | 只有布尔 → `未取得`；源提交不是合并目标祖先 → 点名；不给任务库文件编提交号 |
| `declaredGateCoverage({phases, captures})`（新增导出，`delivery-claims.mjs:450` 前） | P6 | `tools/cli/run-checks.mjs` 输出段 | 差集非空 → 逐个点名；带未替换占位符 → 判「不可执行」；退出码零不当覆盖 |
| `evidenceReuseKey(...)`／`verificationVersion`（新增导出） | P6 | 同上 | 缺 `inputs` 或版本 → `unknown` 且不得复用；范围/时点变 → 只判 `partial` 并列出受影响项 |
| `skills/task-breakdown/SKILL.md`＋4 份 references | P3 | 三处入口前言、三个子流程 `steps.json`、`check-stage-steps.mjs:1430`／`:1852`（当次读取回执） | 文件不可读／锚不解析 → 该步走既有 `skillLoadFailure` 记「未判定」，不静默放行 |
| `tests/contract/task-breakdown-wiring.test.mjs` | P3 | `node --test`（审查与终末） | 非 0 → 接线断，回 P3 补；不靠旧卡或空集顶替 |

### 5. 全局写集（逐路径三态）

同一时刻只有一个写主：该 Phase 的实现者。跨 Phase 的先后按表序，任一步都不并行；前写者交回后后写者接手。

| 路径 | 三态 | 唯一写主（Phase） | 先后与依据 |
| --- | --- | --- | --- |
| `skills/decision-log/templates/decision-log-template-v2.md` | MODIFY | P4 | 包 1／包 2 合一后只有一个写主；两节同段，分两次写必然互相覆盖 |
| `docs/standard-workflow.md` | MODIFY | P4 | 全任务唯一写者（`:86`） |
| `skills/spec-plan/templates/phase-template.md` | MODIFY | P4 → P7 | P4 写 `:211`／`:502`／`:528-533`／`:680`／`:704`；P7 写 `:237`／`:554` 的验收表。依据：两批行不重叠，但 AC-02／AC-03 的人读判词以 P4 字节为准，P7 落地后这两条不重判，只重跑 AC-09／10／11 |
| `workflows/make-decision/SKILL.md` | MODIFY | P2 → P3 → P4 | P2 写 `:282-283` 与审查节、P3 写文件前言段、P4 写 `:114`／`:137`／`:222`。依据：AC-14① 的 `PARA` 命令按空行分段读整段，同段被两次改会让命中比变化，所以每次改完由后写者重跑该命令；P2 的读数以 P2 提交字节为准 |
| `workflows/build-plan/SKILL.md` | MODIFY | P2 → P3 → P4 | P2 写 `:70`／`:77`、P3 写前言段、P4 写 `:44` 与 `:101` 之后新行。依据：AC-03② 要本文件 `git diff --stat` 非空（正控），而 `:101` 逐字不动是 AC-03 的人读判点 |
| `workflows/build-code/SKILL.md` | MODIFY | P2 → P4 → P6 → P7 → P8 | P2 写 `:208`／`:215`、P4 写 `:178`、P6 写 `:334`、P7 写 `:327`／`:331`／`:334`、P8 写 `:386`。依据：`:334` 是同一段（终末第 8 段），P6 先落字段、P7 后加「读数」指针；AC-14① 在本文件上判 `PARA`，最终字节归 P8 重跑 |
| `workflows/build-prd/SKILL.md` | MODIFY | P2 → P3 | P2 写 `:19`／`:41` 邻域、P3 写前言段。依据：`:19` 与 `:41` 同属「方法条款」段族，AC-13② 的三处 grep 必须在 P3 之后一次读定 |
| `skills/decision-maker/SKILL.md` | MODIFY | P1 → P2 | P1 把三个角色小节改成执行者/审查者两角色，并清 `:187`／`:325` 的三角色残留；P2 写入口/限次句并清「复读」；P1 先落，P2 按标题重定位 |
| `skills/phase-maker/SKILL.md` | MODIFY | P1 → P2 | P1 写 `:45` 后角色节；P2 写 `:132-138` 入口/限次句；`:47 <a id="八步"></a>` 逐字不动 |
| `skills/run-phase/SKILL.md` | MODIFY | P1 → P5 → P7 → P2 | P1 写 `:35` 后执行三角色节；P5 写八步正文（`:37-101`，最大改动）、P7 写 `:74-82`、P2 写 `:117-124`。依据：P1 角色节先落，P7 的「读数」句落进 P5 重写的第 6 步；八个步骤锚逐字不动 |
| `skills/task-maker/SKILL.md` | MODIFY | P1 → P2 | P1 写 `:40` 后角色节；P2 写 `:126-132` 限次句；`:52`／`:103` 两锚逐字不动 |
| `skills/stage-reflection/SKILL.md` | MODIFY | P2 | 唯一写者（`:28-55`） |
| `skills/decision-maker/templates/package-context.md` | MODIFY | P1 | 唯一写者；加原文三件（逐字/行位/sha256）＋翻译对照六列＋冷读三问/对抗三问 |
| `skills/spec-specify/SKILL.md` | MODIFY | P7 | 唯一写者（`:164-197`） |
| `skills/stage-close/SKILL.md` | MODIFY | P8 | 唯一写者（`:12` 邻域＋第 1 节末） |
| `runtime/stage/stage-content-contracts.mjs` | MODIFY | P5 → P6 | P5 加 `:279` 的 `export`、P6 加 D2 函数与 `:1428` 的 `ac_status`。依据：P6 的逐条状态要消费 P5 的四类结论，不只是同文件冲突 |
| `tools/cli/stage-runtime.mjs` | MODIFY | P5 | 唯一写者（`:1891`）；`:1163-1199` 的 gate-results 不动 |
| `runtime/evidence/acceptance-evidence-validator.mjs` | DO NOT TOUCH | — | `:1` 唯一导入 `canonical-utils.mjs`；`grep -c 'node:fs'` = 0（K2）。2026-11-26 实读 |
| `tools/cli/run-checks.mjs` | MODIFY | P5 → P6 | P5 改 `:544` 缺件结论、P6 在 `runMaterialChecks`(`:691`) 输出段接 D4／D5。依据：同一函数体，且 AC-04 的缺件点名要先于 AC-06 的三处结论 |
| `runtime/task/final-chain-runner.mjs` | MODIFY | P5 → P6 | P5 改 `:417` 的 `applicable`、P6 第二次改同一行加 `ac_status`。依据：同一行表达式，必须串行 |
| `tests/contract/evidence-path-existence.test.mjs` | MODIFY | P5 | 只改受四态影响的断言前提（7 例补内容指纹，另补 3 例：无锚／字节不符／打不开）；唯一写者 |
| `tests/contract/run-checks-evidence-summary.test.mjs` | MODIFY | P5 | 只改受摘要行新增「未验证」影响的期望（2 例）；唯一写者 |
| `tests/contract/final-chain-runner.test.mjs` | MODIFY | P5 | 只改 `ordinaryContractFixture` 三处夹具、期望零改；不弱化 `:417` 的四态合取项；唯一写者 |
| `core/task-close.mjs` | MODIFY | P6 | 唯一写者（`:805` facts）；`:484`、`:778`、`:1244`、`:1301`、`:1325` 逐字不动 |
| `runtime/task/delivery-claims.mjs` | MODIFY | P6 | 唯一写者（`:450` 前新增导出）；`:232`、`:326`、`:360`、`:384`、`:607` 逐字不动 |
| `skills/task-breakdown/SKILL.md` | NEW | P3 | 唯一写者 |
| `skills/task-breakdown/references/问题陈述模板.md` | NEW | P3 | 唯一写者 |
| `skills/task-breakdown/references/存在性判据.md` | NEW | P3 | 唯一写者 |
| `skills/task-breakdown/references/根因影响验收清单.md` | NEW | P3 | 唯一写者 |
| `skills/task-breakdown/references/逐需求五问审查表.md` | NEW | P3 | 唯一写者 |
| `tests/contract/task-breakdown-wiring.test.mjs` | NEW | P3 | 唯一写者 |
| `tests/contract/four-skill-wiring.test.mjs` | DO NOT TOUCH | — | `:1-30` 注释五条断言；2026-11-26 实读 |
| `skills/catalog.yaml` | MODIFY | P3 | 唯一写者（`:288` 邻域）；实读形状含 `used_by_stages`（`:296`） |
| `skills/reuse-registry.md` | MODIFY | P3 | 唯一写者（`:26` 邻域） |
| `workflows/make-decision/flows/small/steps.json` | MODIFY | P3 | 唯一写者；实读 `grep -c '"skill"'` = 0 |
| `workflows/make-decision/flows/normal/steps.json` | MODIFY | P3 | 同上 |
| `workflows/make-decision/flows/planning/steps.json` | MODIFY | P3 | 同上 |
| `workflows/make-decision/steps.json` | DO NOT TOUCH | — | 实读 `"skill"` 4 条；AC-03① 要求 `$BASE` 比对为空 |
| `workflows/build-plan/steps.json` | DO NOT TOUCH | — | 实读 1 条：`:89 "skill": "skills/phase-maker/SKILL.md#八步"`；同上 |
| `workflows/build-code/steps.json` | DO NOT TOUCH | — | 实读 8 条；同上 |
| `workflows/build-prd/steps.json` | DO NOT TOUCH | — | 实读 1 条：`:48 "skill": "skills/task-maker/SKILL.md#expand-task-section"`；同上 |
| `tools/cli/check-stage-steps.mjs` | DO NOT TOUCH | — | 实读 `:1430 const DESIGNATED_STEP_SKILLS = new Map([`、`:1852 if (!binding) return skillLoadFailure(...` |
| `runtime/review/stage-materials.json` | DO NOT TOUCH | — | 实读 `"version": "wh-review-stage-materials.v2"`（8240 字节） |
| `runtime/review/review-policy.mjs` | DO NOT TOUCH | — | `:8 const REVIEW_SCOPES = new Set(["phase", TERMINAL_REVIEW_SCOPE]);` |
| `runtime/review/review-packet-identity.mjs` | DO NOT TOUCH | — | `:17` 是 `build-code/integration` 聚焦句真身（K7） |
| `skills/wh-review/scripts/third-review-host-config.mjs` | DO NOT TOUCH | — | `:325` `full_only`／`single_round` 判定 |
| `skills/unit-kernel/SKILL.md` | DO NOT TOUCH | — | `:94` 是十一格唯一正文归口 |

**§5 待补 6 类已登记文件（只登记，owner＝spec owner）**：`flows/small/SKILL.md`、`dispatch.mjs`、5 个 `p5-*.test.mjs`、`skill-bundle.json`、`repo-skills.manifest.json`、`vitest.config.mjs` 已由 `phases/index.md` 登记，§5 尚未列入，待 spec owner 补齐；本节不改这些文件的写主。

**AC-03① 与包 8 的冲突已按 Appendix A 裁决**：AC-03① 要求 `git diff --stat 12aaa211 --` 四个根 `steps.json` 输出为空，而包 8 卡写「三处根步骤清单第 1 步挂技能」。AC 是唯一权威，因此 **P3 不改四个根 `steps.json`**，必读声明落在三处入口 `SKILL.md` 的前言（正是 AC-13② 的 grep 面）与三个子流程 `steps.json`（不在 AC-03① 的比对面内）。这是对包 8 卡「根清单挂指针」的收窄，理由与替代已写进 P3 的边界；若 owner 判 AC-03① 应让位，须由 spec owner 改 AC 或出豁免，Phase 作者不得自改。

### 6. 依赖图

P1 → P2：P1 落四技能角色表与上下文包模板；P2 的入口句引用角色名与派发时点。P1 是起点，P2–P8 依赖它。

包级（边＝真实输入，不是编号相邻）：

```
P1 ──> P2 ──> P3 ──> P4 ──> P5 ──> P6 ──> P7 ──> P8 ──> P9
 起点：P1（四份技能角色表与上下文包模板）；P1 是唯一起点，P2–P9 依赖它
 终点：P9 是本任务最后一段，交覆盖账、AC-18／AC-19 与四处根治
 每条边＝真实输入：后一段读的正是前一段落下的字节（逐边见下方 Phase 级边表）
```

Phase 级（每条边写真实输入）：

| 边 | 真实输入 |
| --- | --- |
| P1 → P2 | P1 落四技能角色表与上下文包模板；P2 的入口句引用角色名与派发时点（起点边缘） |
| P2 → P3 | P2 改定的三处入口前言段字节；P3 的 `task-breakdown` 指针必须落进这些段而不冲掉禁令句（正控：P2 的 `PARA` 命令仍命中） |
| P2 → P4 | `skills/decision-maker/SKILL.md` 的 `:85` 缺口四件唯一正文（P4 的轻档句指向它） |
| P3 → P8 | `skills/task-breakdown/SKILL.md` 与三个子流程指针（AC-13① ② 在最终字节重跑） |
| P4 → P6 | `skills/spec-plan/templates/phase-template.md` 的验收表位置（P7 的「读数」格插在同一表）＋ `:101` 缺口清单句（AC-03 判点） |
| P5 → P6 | `checkEvidencePath` 的导出与四类结论（`acCardStatuses` 判每条证据引用时读它，不另写第二套） |
| P5 → P8 | 八步具名交付物（AC-04 首判）与终末 `evidence_paths` 判定（AC-12 的前置判词表读同一形态） |
| P6 → P7 | `facts.ac_status`（交收对账表那一格读逐条状态） |
| P6 → P8 | 三处同一结论＋两个提交号（AC-12 的集成态读数与 AC-07 的复判都读它） |
| P7 → P8 | 六句硬规则的唯一正文位置（AC-09／10／11 的判词口径） |
| P8 → P9 | P8 交回 17 行表与两处正文；P9 消费它做覆盖账与 AC-18／AC-19 首判，不再重跑 P8 |

### 7. 来源 → FR → AC → Phase → oracle 追踪

原 `## 需求到任务追踪`（`:226-278`）不在本次写集；任务级追踪以下方同名节为准，回填 owner＝spec owner。

### Code Anchors

`runtime/stage/stage-content-contracts.mjs`、`tools/cli/run-checks.mjs`、`runtime/task/final-chain-runner.mjs`。

### 需求到任务追踪

每条 R 落到 FR 与 AC；每行一个任务，oracle 与 Phase 卡机器字段一致。

| Source | FR | AC | Phase/Task | ORACLE |
| --- | --- | --- | --- | --- |
| R-024、R-025、R-026 | FR-25 | AC-17 | P1/T001 | ORACLE-P1-DM-ROLES |
| R-024 | FR-25 | AC-17 | P1/T002 | ORACLE-P1-DM-OLDNAME |
| R-027 | FR-25、FR-26 | AC-17 | P1/T003 | ORACLE-P1-DISPATCH |
| R-024 | FR-25 | AC-17 | P1/T004 | ORACLE-P1-PHASE-ROLES |
| R-024、R-025 | FR-25、FR-27 | AC-17 | P1/T005 | ORACLE-P1-TASK-ROLES |
| R-026 | FR-25 | AC-17 | P1/T006 | ORACLE-P1-RUN-ROLES |
| R-029、R-030 | FR-27 | AC-17 | P1/T007 | ORACLE-P1-TRANSLATION |
| R-028、R-031 | FR-26 | AC-17 | P1/T008 | ORACLE-P1-JUDGMENTS |
| R-028、R-031 | FR-26 | AC-17 | P1/T009 | ORACLE-P1-NEGATIVE-CONTROL |
| R-024、R-031 | FR-25、FR-26、FR-27 | AC-17 | P1/T010 | ORACLE-P1-FOUR-SKILL-ROLES |
| R-016、R-021、R-015 | FR-20、FR-21 | AC-14、AC-15 | P2/T012 | ORACLE-P2-DECISION-ONE-REVIEW |
| R-015、R-016、R-021、R-022 | FR-20、FR-21、FR-23 | AC-14、AC-15 | P2/T013 | ORACLE-P2-MAKEDECISION-ENTRY |
| R-015、R-016、R-021 | FR-20、FR-21、FR-25 | AC-14、AC-17 | P2/T014 | ORACLE-P2-BUILDCODE-ENTRY |
| R-015、R-018、R-019、R-020 | FR-20、FR-24 | AC-14、AC-16 | P2/T015 | ORACLE-P2-BUILDPLAN-ENTRY |
| R-015、R-016、R-021 | FR-20、FR-21 | AC-14 | P2/T016 | ORACLE-P2-BUILDPRD-ENTRY |
| R-018、R-019、R-020 | FR-24 | AC-16 | P2/T017 | ORACLE-P2-REFLECTION-SECTION |
| R-018、R-019、R-020 | FR-24 | AC-16 | P2/T018 | ORACLE-P2-THREE-CLOSEOUTS |
| R-015、R-016、R-021 | FR-20、FR-21 | AC-14 | P2/T019 | ORACLE-P2-SMALL-FLOW |
| R-015 | FR-20 | AC-14 | P2/T020 | ORACLE-P2-READINGS |
| R-016、R-021、R-017、R-022、R-023 | FR-21、FR-22、FR-23 | AC-15 | P2/T021 | ORACLE-P2-AC15-READINGS |
| R-018、R-019、R-020 | FR-24 | AC-16 | P2/T022 | ORACLE-P2-UNIT-RECORD |
| R-018、R-019、R-020 | FR-24 | AC-16 | P2/T023 | ORACLE-P2-DISPATCH-COST |
| R-015、R-016、R-021、R-018、R-019、R-020 | FR-20、FR-21、FR-24 | AC-14、AC-15、AC-16 | P2/T024 | ORACLE-P2-NEGATIVE-READER |
| R-014 | FR-19 | AC-13 | P3/T025 | ORACLE-P3-SKILL-BODY |
| R-014 | FR-19 | AC-13 | P3/T026 | ORACLE-P3-REFS |
| R-014 | FR-19 | AC-13 | P3/T027 | ORACLE-P3-REGISTRATION |
| R-014 | FR-19 | AC-13 | P3/T028 | ORACLE-P3-ENTRY-POINTER |
| R-014 | FR-19 | AC-13 | P3/T029 | ORACLE-P3-FLOW-SKILL |
| R-014 | FR-19 | AC-13 | P3/T030 | ORACLE-P3-WIRING-TEST |
| R-014 | FR-19 | AC-13 | P3/T031 | ORACLE-P3-DERIVED-REFRESH |
| R-014 | FR-19 | AC-13 | P3/T032 | ORACLE-P3-REPLAY-R1R2 |
| R-014 | FR-19 | AC-13 | P3/T033 | ORACLE-P3-REPLAY-R3R4 |
| R-014 | FR-19 | AC-13 | P3/T034 | ORACLE-P3-PACKAGE-CARDS |
| R-014 | FR-19 | AC-13 | P3/T035 | ORACLE-P3-NEGATIVE-READER |
| R-013 | FR-01、FR-02、FR-03 | AC-01 | P4/T040 | ORACLE-P4-TEMPLATE-EIGHT |
| R-013 | FR-04、FR-05 | AC-02 | P4/T041 | ORACLE-P4-TEMPLATE-ROOT |
| R-013 | FR-04、FR-05 | AC-02 | P4/T042 | ORACLE-P4-SINGLE-BODY |
| R-013 | FR-05、FR-06 | AC-02、AC-03 | P4/T043 | ORACLE-P4-PHASE-REVERSIBLE |
| R-013 | FR-04、FR-05 | AC-02 | P4/T044 | ORACLE-P4-BUILD-CODE-POINTER |
| R-013 | FR-04、FR-05、FR-06 | AC-02、AC-03 | P4/T045 | ORACLE-P4-PLAN-FOUR-CHECKS |
| R-013 | FR-01、FR-02 | AC-01 | P4/T046 | ORACLE-P4-MAKE-DECISION-THREE |
| R-013 | FR-01、FR-03 | AC-01 | P4/T047 | ORACLE-P4-LIGHT-POINTER |
| R-013 | FR-01、FR-02、FR-03 | AC-01 | P4/T048 | ORACLE-P4-P2-REPLAY |
| R-013 | FR-04、FR-05 | AC-02 | P4/T049 | ORACLE-P4-ROOTCAUSE-REPLAY |
| R-013 | FR-06 | AC-03 | P4/T050 | ORACLE-P4-NO-NEW-GATE |
| R-013 | FR-01、FR-03、FR-06 | AC-01、AC-02、AC-03 | P4/T051 | ORACLE-P4-NEGATIVE-READER |
| R-001、R-012 | FR-07 | AC-04 | P5/T060 | ORACLE-P5-RUN-PHASE-EIGHT-PATHS |
| R-003 | FR-08 | AC-05 | P5/T061 | ORACLE-P5-EVIDENCE-PATH-FOUR-STATES |
| R-003 | FR-08 | AC-05 | P5/T062 | ORACLE-P5-AGGREGATE-SAME-SHAPE |
| R-003 | FR-08 | AC-05 | P5/T063 | ORACLE-P5-ACCEPTANCE-ENTRY-REFS |
| R-003、R-011 | FR-08、FR-09 | AC-05 | P5/T064 | ORACLE-P5-MATERIAL-SUMMARY-VISIBLE |
| R-011 | FR-09 | AC-04 | P5/T065 | ORACLE-P5-CONTRACT-ORIGINAL-FOUR-STATES |
| R-011 | FR-09 | AC-04 | P5/T066 | ORACLE-P5-TERMINUS-MISSING-CHECKLIST |
| R-003、R-011 | FR-08、FR-09 | AC-04、AC-05 | P5/T067 | ORACLE-P5-CONTRACT-TESTS-GREEN |
| R-003 | FR-08 | AC-05 | P5/T068 | ORACLE-P5-FIVE-FIXTURES |
| R-003 | FR-08 | AC-05 | P5/T069 | ORACLE-P5-TWO-PLACES-SAME-ANCHOR |
| R-012、R-001 | FR-07 | AC-04 | P5/T070 | ORACLE-P5-EIGHT-STEPS-STAT |
| R-012、R-003、R-011 | FR-07、FR-08、FR-09 | AC-04、AC-05 | P5/T071 | ORACLE-P5-NEGATIVE-CONTROLS |
| R-004、R-011 | FR-10、FR-11 | AC-06 | P6/T080 | ORACLE-P6-CARD-STATUS-PARSE |
| R-004、R-005、R-007、R-011 | FR-11、FR-12、FR-13 | AC-06、AC-07、AC-08 | P6/T081 | ORACLE-P6-DELIVERY-READSIDE |
| R-005、R-007 | FR-13 | AC-07 | P6/T082 | ORACLE-P6-CLOSE-COMMITS |
| R-004、R-011 | FR-10、FR-11 | AC-06 | P6/T083 | ORACLE-P6-MATERIAL-OUTPUT |
| R-004 | FR-10、FR-11 | AC-06 | P6/T084 | ORACLE-P6-TERMINAL-RECOMPUTE |
| R-004 | FR-10 | AC-06 | P6/T085 | ORACLE-P6-THREE-SITES |
| R-004 | FR-10、FR-11 | AC-06 | P6/T086 | ORACLE-P6-ARCHIVE-NO-GATE |
| R-005、R-007、R-011 | FR-11、FR-13 | AC-06、AC-07 | P6/T087 | ORACLE-P6-REPORT-REUSE |
| R-004 | FR-12 | AC-08 | P6/T088 | ORACLE-P6-GATE-COVERAGE |
| R-004、R-011 | FR-10、FR-11 | AC-06、AC-07、AC-08 | P6/T089 | ORACLE-P6-CLOSE-SKILL-LINE |
| R-004、R-005、R-007、R-011 | FR-10、FR-12、FR-13 | AC-06、AC-07、AC-08 | P6/T090 | ORACLE-P6-NEGATIVE-READER |
| R-002 | FR-14、FR-15、FR-16 | AC-09、AC-10 | P7/T100 | ORACLE-P7-SIX-RULES |
| R-002 | FR-14 | AC-09 | P7/T101 | ORACLE-P7-STEP6-READOUT |
| R-002 | FR-14、FR-15 | AC-09、AC-10 | P7/T102 | ORACLE-P7-TERMINAL-READOUT |
| R-002 | FR-14 | AC-09 | P7/T103 | ORACLE-P7-CARD-READOUT |
| R-001 | FR-06 | AC-03 | P7/T104 | ORACLE-P7-TIMEBOX |
| R-002 | FR-14、FR-15 | AC-09 | P7/T105 | ORACLE-P7-ARCHIVE-VERDICT |
| R-002 | FR-15 | AC-10 | P7/T106 | ORACLE-P7-ALREADY-GREEN |
| R-008、R-009 | FR-16 | AC-11 | P7/T107 | ORACLE-P7-FOUR-CASES |
| R-013 | FR-01、FR-06、FR-14、FR-16 | AC-09、AC-10、AC-11 | P7/T108 | ORACLE-P7-SAME-NUMBERS |
| R-010、R-011 | FR-17 | AC-12 | P8/T120 | ORACLE-P8-TABLE-127 |
| R-010、R-011 | FR-17 | AC-12 | P8/T121 | ORACLE-P8-PATH-RULES |
| R-010、R-011 | FR-17 | AC-12 | P8/T122 | ORACLE-P8-COLUMNS-114 |
| R-010、R-011 | FR-17 | AC-12 | P8/T123 | ORACLE-P8-KEY-12-COLLISIONS |
| R-010、R-011 | FR-17 | AC-12 | P8/T124 | ORACLE-P8-CONTENT-46 |
| R-010、R-011 | FR-17 | AC-12 | P8/T125 | ORACLE-P8-DEPTH-LAYERS |
| R-010、R-011 | FR-17 | AC-12 | P8/T126 | ORACLE-P8-HEADER-BINDING |
| R-010、R-011 | FR-17 | AC-12 | P8/T127 | ORACLE-P8-TABLE-HYGIENE |
| R-010、R-011 | FR-17 | AC-12 | P8/T128 | ORACLE-P8-3STATE-BREAK |
| R-010、R-011 | FR-18 | AC-12 | P8/T129 | ORACLE-P8-T08-GAP |
| R-010、R-011 | FR-18 | AC-12 | P8/T130 | ORACLE-P8-INTEGRATION-41 |
| R-010、R-011 | FR-18 | AC-12 | P8/T131 | ORACLE-P8-INTEGRATION-RUN |
| R-010、R-011 | FR-18 | AC-12 | P8/T132 | ORACLE-P8-UNREADABLE-3 |
| R-010、R-011 | FR-17 | AC-12 | P8/T133 | ORACLE-P8-ALL-AC-17 |
| R-010、R-011 | FR-17 | AC-03 | P8/T134 | ORACLE-P8-RERUN-6 |
| R-010、R-011 | FR-17、FR-18 | AC-12 | P8/T135 | ORACLE-P8-STAGE-CLOSE-PROSE |
| R-010、R-011 | FR-18 | AC-12 | P8/T136 | ORACLE-P8-BUILD-CODE-POINTER |
| R-010、R-011 | FR-17 | AC-12 | P8/T137 | ORACLE-P8-SIX-TOKENS |
| R-010、R-011 | FR-18 | AC-12 | P8/T138 | ORACLE-P8-NOT-A-CHECKER |
| R-010、R-011 | FR-17 | AC-12 | P8/T139 | ORACLE-P8-CLOSEOUT |

### 全局验证策略

统一用 `node tools/cli/run-checks.mjs --stage=build-plan --material-root=specs/delivery-quality-acceptance-20261126`、`node --test tests/contract/four-skill-wiring.test.mjs` 与 `git diff --stat 12aaa211 -- workflows/*/steps.json`；逐条 AC 的判法只在 Appendix A，Phase 卡只引用同号。

## 怎么算通过？

按 Appendix A 的同一判据逐条核；命令或具名步骤写在那里，证据计划写七项，Phase 卡只引用同号 AC。

### 验收判据在哪里？

验收判据只在 Appendix A：场景、判法、通过信号、失败信号、证据落点都写在那里。正文与 decision-log 只给指针，例如「判据见 AC-05」。同一份判据写两处必然漂移；本文件不复制十包卡的命令细节，只在 Appendix A 给判真口径，包内夹具与更细命令回各包卡与设计原件。

### 判定对象怎么与需求对齐？

判定对象是被验的业务行为：方法是技能正文与入口的一句可搜文本，模板是字段存在与否，运行时是同一份事实的读取结论。不要求同一物理库或文件；降级到副本时，按原 AC 已确定的等价隔离边界使用。需求说 A、验收在 B 上判，B 通过不代表 A 达成，这一条在每个「具名人工步骤」的判定者说明里重复一次。

### 验收对象

```json
{
  "workspace": "/Users/Hugh/Hugh/Project/workflowhub-delivery-quality-acceptance-20261126",
  "service": "workflowhub 仓库内命令行入口与技能正文（node --test tests/contract/four-skill-wiring.test.mjs、node tools/cli/check-stage-steps.mjs、grep 读入口句）",
  "route": "N/A — 本任务无页面与路由，判定对象是仓库文件与命令行读取结论",
  "state": "分支 task/workflowhub/delivery-quality-acceptance-20261126，开工基线 12aaa211；实现前，十包卡与 decision-log 已收敛、代码未改",
  "viewport": "N/A — 无页面，无视口",
  "owner": "用户",
  "cli": {
    "command": "node --test tests/contract/four-skill-wiring.test.mjs",
    "entry_ref": "run_phase_skill",
    "sample_ref": "phase_template",
    "oracle_ref": "spec_appendix_a"
  }
}
```

来源表（`entry_ref`／`sample_ref`／`oracle_ref` 指向的真实文件；任务库原件见 Appendix B 的来源清单）：

| key | 真实文件 |
| --- | --- |
| `run_phase_skill` | `skills/run-phase/SKILL.md` |
| `phase_template` | `skills/spec-plan/templates/phase-template.md` |
| `spec_appendix_a` | `specs/delivery-quality-acceptance-20261126/spec.md` 的 Appendix A |

非 UI 声明来源：本任务的原始请求与 decision-log:43-45 明写「非 UI，只改方法、模板、运行时读取与交付材料，不产生页面、路由、组件或视觉基准」；`service`／`route`／`viewport` 三格因此按真实情况写 N/A，不以「有脚本」冒充有页面。

### 证据计划怎么写？

证据计划把判定义务分到既有 Task 字段，不另建验收计划；七项缺一项不得开工。

- 判什么：Appendix A 的 AC-01 至 AC-19 各一条判真结论。
- 怎么判：机器可判的用 Appendix A 写死的命令；只能人读的用那里写死的具名人工步骤（谁读、读哪几节、看到什么算通过）。
- 证据从哪来：单份原件落 `quality/evidence/` 下各包回放目录（`p1-replay/` … `p9/replay/`）与 `quality/tests/`；原始输出、退出码、判词各一份，不贴进材料正文。
- 谁提供：各包实现者产出读数，独立审查或测试角色判读；同一人不得既产又判。
- 何时能拿到：对应 Phase 的实现提交之后、独立审查之前。
- 成本类别：命令级（grep／node 单命令）或文档级（具名人工步骤）。
- 拿不到怎么办：按真实尝试记 `incomplete`（写判定者、观察协议、证据落点）或 `unavailable`（写原因与恢复条件）；机器判据无真实尝试原 ref 不得记 incomplete。

未达成项写法：`incomplete：AC-XX；试过=<命令与原 ref>；卡在=<真实条件>；谁提供=<真实对象>；恢复条件=<可观察条件>`。可带缺口进 stage-close；最终报告逐条列缺口，不宣称完成。

### 测试计划是什么？

按本任务真实交付面声明测试面，逐面写适用或具名不适用理由、判定器、证据类型与覆盖边界。

| 测试面 | 为何适用或具名排除 | 判定器、证据与覆盖边界 |
| --- | --- | --- |
| 技能正文与阶段入口的可搜文本 | 适用：交付物就是这些句子 | Appendix A 的 grep 命令与内联 node 命令；只证句子在位，不证执行者照做 |
| 四技能接线契约 | 适用：已有任务无关契约测试 | `node --test tests/contract/four-skill-wiring.test.mjs`；证声明、读取回执与负例，不证谁写的卡 |
| 运行时读取（四类结论、卡面状态、对账） | 适用：改的是读侧判定 | 各包夹具分类与副本回放；不证历史材料被回改 |
| 模板字段（决策日志、Phase 卡） | 适用：字段存在与下限 | 正坏样张逐格判；不证未来作者都照着写 |
| 历史材料回放 | 适用：本次的核心证伪手段 | 任务四 13 段、报告 76≠78、AC-P1-006、T08 零命中；回放判词落 `quality/tests/` |
| 前置任务逐条核 | 适用：WP7 交付 | 127 行判词表与集成态读数；单卡通过不外推 |
| 浏览器端到端、视觉基线 | 具名不适用：本任务无页面、无路由、无视觉基准（decision-log:43-45） | 未来有页面的任务按其域规则另立 |
| 并发与性能实测 | 具名不适用：本任务只改读侧判定，不新增并发或性能承诺 | 若未来引入，按 p6 卡的类型判词另立 |

测试范围与全量回归禁令以 `docs/standard-workflow.md` 的 build-code 测试与质量段为执行底座；本节只声明面，不新增 stage 或 gate。

## 有什么风险和未决？

最可能损害结果的是「新句子在位但没人照做」，以及把机器证到的范围说过头。

- **风险 1（RISK-01）形式主义回潮**：八格写成空话、升级建议没有代价、单元复盘只写「顺利完成」。触发是审查只查有没有写、不读内容。缓解是用历史坏例回放校准（AC-01、AC-09）；由各包审查角色在对应 Phase 处理。
  验证：拿只写标签的坏样张回放，判词必须是不合格。
- **风险 2（RISK-02）把机器证到哪说过头**：入口与技能正文声称「五件绑定证明角色已派」，而它只核原件齐与审查者不同人。缓解是把「不冒充机器拦住」写成必写句并由 AC-14 的机械部分查肯定式；由 WP9 实现者在对应 Phase 处理。
- **风险 3（RISK-03）老材料大面积变红**：绑定本次运行会让旧材料从 `verified` 掉到 `unverified`。缓解是只诊断、不回填，旧材料记 unknown；由 WP4、WP5 在各自 Phase 处理。
- **风险 4（RISK-04）两处判据漂移**：包卡命令细节与本 Appendix 冲突。缓解是命令留 Phase 卡、判真口径只在本 Appendix；由 phase-maker 在写卡时消解并记理由。

### 补充材料与术语在哪里？

推导、原始输出与被否方案只放具名原件，正文按路径与节锚点回读，不复制长段原文。

- **推导与证据原件**：`quality/evidence/decision-log-refs/requirement-index.md`（R-001–R-031、U-001–U-031）、`quality/evidence/decision-log-refs/coverage-matrix-5d.md`（覆盖与缺口）、`quality/evidence/decision-maker/p1..p10/`（十包卡与设计原件）、`quality/evidence/research/2026-11-26-001..021`（调研原件）。
- **术语**：项目术语见 `GLOSSARY.md`；本文件新增「问题消失验收」「存在性判定」两词，含义取 p6 卡与 p1 卡，未改术语表。
- **交接**：下游消费者是 build-plan 第 6 步的 phase-maker 与 build-code 各 Phase；输入原件即上列路径；未完成项的恢复动作见「还有什么没定」与 Appendix B 的具名不适用。

## Appendix A — 验收判据（唯一权威）

每条给：场景、判定方式（三词之一）、判法（一条可整条跑的命令，或一个具名人工步骤）、通过信号、失败信号、证据落点、关联 FR。冲突时以本 Appendix 为准；AC 变更只重判受影响条目。

- [ ] **AC-01 新任务有八要素问题陈述与一条存在性判定**
  场景：计划作者给一个新任务立项，材料里只有任务卡、没有一手来源。
  判定方式：只能人读。
  判法：独立审查角色读 `skills/decision-log/templates/decision-log-template-v2.md` 的第 2 段与 `quality/evidence/p1-replay/sample-good.md`、`sample-bad.md`，逐格对照 `quality/evidence/decision-maker/p1/design.md` 3.1 的第三列。辅助读数：`grep -c "存在性" skills/decision-log/templates/decision-log-template-v2.md` 必须有输出（退出码 0）。
  通过：好样张八格齐、六格必写真、两格有句或可回读指针；判定行有具名判定人与时间点；坏样张被判「升级人工」并给出三条各带代价的建议；判定人不是写作者，或明写「轻档自判」（判定者独立性口径见文末「具名不适用」的「独立判定者字段」条，两处互指，不裁决哪套为准；OPEN-06）。
  失败：任一必写格为空；判定行缺判定人；坏样张被放行；建议不足三条或没有代价；作者自判却按独立判定读。
  证据：`quality/evidence/p1-replay/` 下好/坏样张与回放记录，判词落 `quality/tests/`。关联 FR-01、FR-02、FR-03；包卡 AC-P1-01..05。
  成本：executor=独立审查角色；estimate_min=20；hard_cap_min=45；resources=模板、两份样张、p1 设计第三列；observation=逐格判词与升级建议；retry_cap=1；evidence_tier=文档级。

- [ ] **AC-02 根因已裁决，影响面四格有主**
  场景：拿父任务旧材料与本任务 decision-log 的根因表回放。
  判定方式：只能人读。
  判法：独立审查角色读 `decision-log.md` 第 2 段 `:76-86` 与 `quality/evidence/decision-maker/p2/design.md` 的四句判据，对两份旧材料各写一句判词；再读一份真实改动的影响面，核对是否写出调用方、数据兼容、回滚半径与影响量级。命令辅助：`grep -n "证伪条件" skills/decision-log/templates/decision-log-template-v2.md` 必须有输出。
  通过：两份旧材料都被判「未裁决」并指出哪条不能被现有材料排除；影响面四格齐，未知项带 owner 与最晚裁决点；待证三字段齐。
  失败：判成「已裁决」；用「如果将来出现 X」当排除证据；影响面只有一个词；待证缺谁补或时限仍算合格。
  证据：`quality/evidence/p2-replay/` 两份回放记录与搜索记录。关联 FR-04、FR-05；包卡 AC-P2 各项。
  成本：executor=独立审查角色；estimate_min=25；hard_cap_min=50；resources=父任务旧材料、decision-log 第 2 段、p2 设计；observation=两句回放判词与影响面四格；retry_cap=1；evidence_tier=文档级。

- [ ] **AC-03 计划缺回滚会被点名，但不新增门**
  场景：拿一张没有回滚、没有被否的新卡走既有计划收口与审查退回。
  判定方式：机器可判。
  判法：`BASE=12aaa211`；①`git diff --stat $BASE -- workflows/make-decision/steps.json workflows/build-plan/steps.json workflows/build-code/steps.json workflows/build-prd/steps.json tools/cli/check-stage-steps.mjs runtime/review/stage-materials.json` 输出为空；②`git diff --stat $BASE -- workflows/build-plan/SKILL.md` 必须非空（基线有效性正控，证明是同一基线在比）。人工部分：审查角色读缺口清单，确认缺回滚那张卡被点名并退回补齐。
  通过：①为空、②非空；缺口清单点名且只走既有收口与审查退回；阶段数、确认点数与退出码没变。
  失败：需要新增检查器或确认点才拦得住；或②为空（基线错，①作废）。
  证据：两条 diff 输出与缺口清单读数，落 `quality/tests/`。关联 FR-06；包卡 AC-P3-01。
  成本：executor=实现者；estimate_min=10；hard_cap_min=20；resources=开工基线提交、四个步骤表；observation=两条 git diff 与缺口清单；retry_cap=1；evidence_tier=命令级。

- [ ] **AC-04 执行八步每步有具名交付物与读者**
  场景：拿上个任务的 13 段材料跑材料检查。
  判定方式：只能人读。
  判法：独立审查角色打开 `skills/run-phase/SKILL.md` 的八步，逐步核对是否写出交付物路径、位置与读者；用任务四归档材料跑一次任务侧检查。辅助读数：`grep -c "读者" skills/run-phase/SKILL.md` 必须有输出。
  通过：八步都有具名交付物与读者；任务四 13 段材料被点名「缺第 13 段清单」，第 1–12 段不点名；缺件进入终末结论。
  失败：任一步只写「输出一段说明」；缺第 13 段没被点名；清单正文有字、文件不存在仍判通过。
  证据：八步核对表与任务侧检查输出，落 `quality/evidence/p4-replay/`。关联 FR-07、FR-09；包卡 AC-P4-01、AC-P4-07。
  成本：executor=独立审查角色＋实现者；estimate_min=25；hard_cap_min=60；resources=run-phase 技能正文、任务四 13 段材料；observation=八步核对表与点名行；retry_cap=1；evidence_tier=文档级。

- [ ] **AC-05 同一份证据两处同一结论，且绑定本次运行**
  场景：五份夹具路径分别对应五种真实情形。
  判定方式：机器可判。
  判法：对 `quality/evidence/p4-replay/fixtures.json` 里的五条夹具跑一次两处共用的读取入口（`runtime/stage/stage-content-contracts.mjs` 的导出函数；确切调用形式由 Phase 卡写定，本处固定的只有五条输入与五条期望输出），逐条打印状态与诊断子类。五条输入依次是：带本次指纹且存在、已删除、改成打不开、同名但不带指纹、指纹不符。
  通过：五条依次输出 `verified`、`missing`、`unverified`（`unreadable`）、`unverified`（`no-run-binding`）、`unverified`（`content-mismatch`）；同一 ref 写在阶段卡与验收记录两处时结论相同，并给同值锚（同一路径＋同一指纹或同一 run 绑定）；只靠同参自证不算。
  失败：文件在就判 `verified`；同名旧文件算通过；新增第五类或改四类名；两处结论不同。
  证据：命令原始输出与夹具清单，落 `quality/evidence/p4-replay/`。关联 FR-08；包卡 AC-P4-02..05。
  成本：executor=实现者；estimate_min=15；hard_cap_min=35；resources=五份夹具、两个读取入口；observation=五条状态字符串；retry_cap=1；evidence_tier=命令级。

- [ ] **AC-06 卡面状态只解析一次，报告对账报出差值**
  场景：拿任务四归档材料跑一次卡面状态解析与报告对账。
  判定方式：机器可判。
  判法：用该包接进既有事实生成处的逐条状态入口，对任务四材料跑一次（命令由 Phase 卡给出，必须带 `--task-path`）；再在任务根的副本上删掉一条通过判据的唯一证据引用后重跑材料检查、终末链、关单三处。
  通过：输出含任务四报告的自称总数、分项和与差值（现象是「自称 78、分项和 76、差 2」这一行），并点名两条互相冲突的卡；删引用后三处都给同一结论（不再通过）；一格两状态那条按最差档记未完成并保留两个原值。
  失败：输出只给一个「全部通过」；三处有一处读不到；冲突被静默取一个；把 76 当基线。
  证据：两次输出与副本路径，落 `quality/evidence/p5-replay/`。关联 FR-10、FR-11；包卡 AC-P5-01..03。
  成本：executor=实现者；estimate_min=30；hard_cap_min=70；resources=任务四材料副本、三个读取入口；observation=对账那一行与三处结论；retry_cap=1；evidence_tier=命令级。

- [ ] **AC-07 交付看得到提交，证据复用有界**
  场景：一条只有「已交付＝是」的记录、一条旧提交记录、一条同命令同输入但验证版本不同的记录。
  判定方式：机器可判。
  判法：对三份记录各跑一次复用与交付判定入口（命令由 Phase 卡给出，必须读同一份合同事实）。
  通过：只有布尔无提交号判未取得；源提交不是合并目标祖先时点名；验证版本不同判不复用；同命令同输入同范围且验证版本全同判可复用；旧回执缺输入或版本记 unknown 且不得复用。
  失败：布尔为真就算已交付；给任务库文件编提交号；验证版本不同仍复用；缺输入仍复用。
  证据：三条判定输出，落 `quality/evidence/p5-replay/`。关联 FR-13；包卡 AC-P5-04。
  成本：executor=实现者；estimate_min=20；hard_cap_min=45；resources=三份记录、复用判定入口；observation=四类复用结论与未取得；retry_cap=1；evidence_tier=命令级。

- [ ] **AC-08 门覆盖差集被点名**
  场景：卡面上声明了门命令，但门实际选中的测试比声明面窄。
  判定方式：机器可判。
  判法：跑一次阶段级门覆盖入口（命令由 Phase 卡给出），读三个集合与差集；再按该入口输出逐个核对未覆盖阶段是否被点名。
  通过：差集非空时逐个点名未覆盖阶段；带未替换占位符的声明门被判「不可执行」并点名；退出码零不被当作覆盖。
  失败：只报计数不点名；把「选中一条」当覆盖；差集非空仍写覆盖完成。
  证据：门覆盖输出与差集清单，落 `quality/evidence/p5-replay/`。关联 FR-12；包卡 AC-P5-05。
  成本：executor=实现者；estimate_min=20；hard_cap_min=40；resources=卡面声明门、门捕获原件；observation=三个集合与点名行；retry_cap=1；evidence_tier=命令级。

- [ ] **AC-09 失败条件量的是原问题，不是文件里的那句话**
  场景：回放上个代码任务的 AC-P1-006（`specs/archive/delivery-quality-code-20261124/spec.md:1249`）。
  判定方式：只能人读。
  判法：独立审查角色按本任务新写法读该条验收，写一句判词，说明它的失败条件量的是什么物件；再读 `skills/spec-specify/SKILL.md` 的验收写作节，确认新写法要求「读数＋观察点」。辅助读数：`grep -c "读数" skills/spec-specify/SKILL.md` 必须有输出。
  通过：该条被判不合格，理由指向「失败条件只量卡面文字／期望产不出来」；新写法要求每条失败条件给出今天能跑的读数，读不出时写原因、最近的既有检查与谁补。
  失败：判成合格；判词只说「缺行」而不说量错对象；新写法仍允许「卡上写了」当通过。
  证据：判词与回放记录，落 `quality/tests/`。关联 FR-14；包卡 AC-P6-02。
  成本：executor=独立审查角色；estimate_min=20；hard_cap_min=40；resources=归档规格 1249 行、spec-specify 验收写作节；observation=一句判词与理由；retry_cap=1；evidence_tier=文档级。

- [ ] **AC-10 修复前会红，修复后才会绿**
  场景：拿一条修复前就绿的既有检查，按冻结口径判。
  判定方式：只能人读。
  判法：选一条今天本来就退 0 的既有检查，连同 `argv`、退出码与原输出存档；再按该包冻结的回放口径判；辅助命令：`node tools/cli/rule-tables.mjs check --root .`（同类红读数示例，源出 `p6/card.md`）。
  通过：判词写「没在测这个缺陷」并指到那条绿读数；修复后的绿另有回执，且回执里有修复前红的同一断言。
  失败：把「今天本来就绿」当修好了；只用搜索字面冒充红绿；把同类红读数当作被回放那条验收的对象。
  证据：绿回放记录与红读数输出，落 `quality/evidence/p6-replay/`。关联 FR-15；包卡 AC-P6-03、AC-P6-06。
  成本：executor=独立测试角色；estimate_min=20；hard_cap_min=45；resources=既有检查与 `rule-tables` 入口；observation=退出码、原输出、判词；retry_cap=1；evidence_tier=命令级。

- [ ] **AC-11 类型判词与相反原件并列保留**
  场景：四组回放——两份相反原件、一次未运行、一次无基线页面、一次无作业模型的异步。
  判定方式：只能人读。
  判法：独立审查角色按 p6 卡的四例逐例读原文与读数，各写一句结论：采信哪份、谁复核、为什么；未运行或打不开的记未取得；无基线或无作业身份时，有承诺记未验证／未取得，只有无承诺或无对象才记不适用。
  通过：四例各有结论；相反原件两份都在、采信与复核人具名；未运行不算合格；类型不适用写理由。
  失败：只留一份原件；把没跑当合格；异步认固定延时；把「有承诺缺证据」写成不适用。
  证据：四例回放记录，落 `quality/evidence/p6-replay/`。关联 FR-16；包卡 AC-P6-05。
  成本：executor=独立审查角色；estimate_min=25；hard_cap_min=50；resources=两份相反原件、未运行记录、p6 卡；observation=四句结论；retry_cap=1；evidence_tier=文档级。

- [ ] **AC-12 前四任务逐条有结论，旧判据三态，集成态单独读**
  场景：在最终合并版本上做一次前置任务收口。
  判定方式：只能人读。
  判法：独立审查角色读那张逐条判词表，核对结论列只出现四种结论之一、没有本包自己的「通过」；对判「仍适用」的旧判据当场做一次人为破坏；再读集成态读数表，核对是否只跑前四任务自己声明过的命令。命令辅助：`grep -n "T08" quality/evidence/p7-replay/` 必须能在回放记录里搜到点名。
  通过：每条承诺的结论列都填着四种结论之一，没有空格子；一条今天打不开的原件被判缺件；「文件在但内容对不上」的情形被判得出来；旧判据三态齐且「仍适用」有破坏后变红的记录；集成态写出缺输入与不一致；任务二记未取得；T08 域级读数缺失被点名。
  失败：拿合并前判词或旧提交当交付版本；把只查了路径写成真读了内容；单卡绿外推成整版绿；结论列出现「通过」。
  证据：判词表、三态表、集成态读数表与破坏记录，落 `quality/evidence/p7-replay/`。关联 FR-17、FR-18；包卡 AC-P7-01..12。
  成本：executor=独立审查角色；estimate_min=60；hard_cap_min=120；resources=四任务规格与报告、最终合并提交、既有门命令；observation=四种结论、三态判词、集成态读数；retry_cap=1；evidence_tier=文档级。

- [ ] **AC-13 调研与拆包必读，分母等于源条目**
  场景：删一条源条目、把一条原话换成转述、把一个派生件当基线各跑一次。
  判定方式：只能人读。
  判法：①`test -r skills/task-breakdown/SKILL.md`；②`grep -n "task-breakdown" workflows/make-decision/SKILL.md workflows/build-plan/SKILL.md workflows/build-prd/SKILL.md` 三处都必须搜到；③读 `quality/evidence/p8-replay/` 的四条回放记录。辅助：`node --test tests/contract/four-skill-wiring.test.mjs` 必须仍退 0（接线未被改坏）。
  通过：技能文件可读且被三处声明；删一条源条目后覆盖表报未覆盖；原话换成转述后标「来源不明」；派生件基线回放能报出「17 条里 4 条不在」；每包人话卡节数等于包数、八格齐、卡上无未解释编号。
  失败：删条后差集为空仍报完整；技能里抄了内核逐条判据；入口句被改成「需要时／轻档不适用」而契约测试没红。
  证据：四条回放记录与注册命令输出，落 `quality/evidence/p8-replay/`。关联 FR-19；包卡 AC-P8 各项。
  成本：executor=实现者＋独立审查角色；estimate_min=40；hard_cap_min=90；resources=源条目清单、覆盖表、四份回放；observation=差集与非空结论；retry_cap=1；evidence_tier=命令级。

- [ ] **AC-14 四阶段入口必须走技能，旧出口已删**
  场景：静态读四个阶段入口，再用已存在的接线契约跑一次。
  判定方式：机器可判。
  判法：①对每个入口跑内联命令（去 `*` 与反引号后，按空行分段，判含同义词的段里是否出现 `主会话不`／`主会话不得`）：
  `node -e 'const fs=require("fs");const t=fs.readFileSync(process.argv[1],"utf8").replace(/[*`]/g,"").split(/\n\s*\n/);const re=/必须走|必须调用|必须按[^。]{0,20}走|一律走/;const p=t.filter(x=>re.test(x));console.log(process.argv[1],p.length?"PARA="+p.filter(x=>/主会话(不|不得)/.test(x)).length+"/"+p.length:"NO-PARA")' <入口文件>`
  四个文件是 `workflows/make-decision/SKILL.md`、`workflows/build-prd/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`。②`grep -n "需要三角色分开做时\|不报缺独立审查\|仅复杂任务\|可以只写卡" workflows/make-decision/SKILL.md workflows/build-code/SKILL.md workflows/make-decision/flows/small/SKILL.md skills/decision-maker/SKILL.md` 必须无输出（退出码 1）。③`node --test tests/contract/four-skill-wiring.test.mjs` 必须退 0。
  通过：四个文件都输出 `PARA=n/n`（同一空行段内既有同义词又有禁令）；②无输出；③退 0。
  失败：出现 `NO-PARA` 或 `PARA=0/n`；②有命中（旧出口还在）；③红。
  证据：四条 `PARA` 输出、②的 grep 结果与③的测试输出，落 `quality/evidence/decision-maker/p9/replay/`。关联 FR-20；包卡 AC-P9-01、AC-P9-02、AC-P9-05。
  成本：executor=实现者；estimate_min=10；hard_cap_min=25；resources=四份入口正文、四份步骤表、接线契约测试；observation=PARA 比值、grep 退出码、测试退出码；retry_cap=1；evidence_tier=命令级。

- [ ] **AC-15 审查只做一次，异源一次，结论直连不转述**
  场景：读限次句、跑四路异源原件、读一份通知样例与处置两栏。
  判定方式：机器可判。
  判法：①`grep -n "最多派一次异源" skills/decision-maker/SKILL.md workflows/make-decision/SKILL.md` 两处都必须搜到；②同样的搜法在 `workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/build-prd/SKILL.md` 三处必须搜不到（退出码 1）；③`grep -c "复读" skills/decision-maker/SKILL.md` 必须输出 0（退出 1）；`workflows/make-decision/SKILL.md` 同样无命中；其它技能不要求清零，保留原义；④`test -r quality/evidence/decision-maker/p9/heterologous.md`，或该文件不存在时读同目录记法（`unavailable`＋owner＋恢复条件）；⑤读 `quality/evidence/decision-maker/p9/replay/review-notice-sample.md`，只能有一行、含相对路径与「自己判断」，且 `grep -nE "条发现|严重度|必须改"` 无输出；⑥处置两栏：`quality/evidence/decision-maker/p<N>/review.md` 的「## 处置」节里 `grep -c "改了什么"` 与 `grep -c "没改"` 各必须有输出。
  通过：①都在、②都没有、③输出 0（退出 1）、④原件可读或记法合规、⑤通知最小、⑥两栏可读且指针 `test -r` 为真；④⑤⑥ 未取得时记未取得＋owner，不挡其它 AC，Done 只判有证据的项。
  失败：限次句出现在不该有的三处；「复读」仍在；异源未派却写成通过；通知夹带条数或建议；处置只有一栏。
  证据：六条读数与通知样例，落 `quality/evidence/decision-maker/p9/replay/`。关联 FR-21、FR-22、FR-23；包卡 AC-P9-06、AC-P9-12、AC-P9-13。
  成本：executor=实现者；estimate_min=15；hard_cap_min=40；resources=两份技能正文、三份入口、异源原件、通知样例；observation=搜到／搜不到、文件可读性、两栏；retry_cap=1；evidence_tier=命令级。

- [ ] **AC-16 单元总结可回读、复盘三句实指、上下文成本有读数**
  场景：读一条单元记录、一份派发说明与一两份回传。
  判定方式：只能人读。
  判法：①`test -r quality/evidence/reflection/unit-*.md`（至少一条），头部含总结原文五条、发出时刻（`%Y-%m-%d %H:%M`）与会话标识；②`grep -n "原读数 → 现读数" skills/stage-reflection/SKILL.md` 必须搜到，且四个技能里搜不到（指针化）；③`grep -nE "读了 ?[0-9]+ ?份" quality/evidence/decision-maker/p9/replay/dispatch-sample-reply.md` 必须搜到；④读 `quality/evidence/decision-maker/p9/replay/closeout-cost-lens.md`，三类读数齐、耗时写「未取得」。
  通过：①总结可回读且五条与人话一致；②三句下限只在复盘技能一处；③派发说明有五段与最小阅读集、回传报出读了几份几节；④成本镜头三类读数为真实现象。
  失败：总结夹确认请求；复盘只有「顺利完成」；成本镜头写无源估时；四个技能里各写一套复盘下限。
  证据：单元记录、派发说明与回传、成本镜头报告，落 `quality/evidence/reflection/` 与 `quality/evidence/decision-maker/p9/replay/`。关联 FR-24；包卡 AC-P9-07..11。
  成本：executor=实现者＋独立审查角色；estimate_min=20；hard_cap_min=45；resources=单元记录、派发样例、成本报告；observation=五条原文、读数、三类成本读数；retry_cap=1；evidence_tier=命令级。

- [ ] **AC-17 四技能角色与原始需求翻译契约**
  场景：读四份技能、上下文包模板与任务 4 三个坏例。
  判定方式：人读＋命令。
  判法：①`grep -c "## 角色" skills/decision-maker/SKILL.md skills/phase-maker/SKILL.md skills/task-maker/SKILL.md skills/run-phase/SKILL.md` 四份各 1；②decision-maker/phase-maker/task-maker 各两行（执行者/审查者），run-phase 三行（开发者/独立审查者/独立测试者），合计 9 行；每行六项（谁/何时派/读什么/交什么/独立性/答不出退回）；③run-phase 的测试与审查分开，不能把测试并进审查；④三句反写按真实旧句整行搜不到：phase-maker「本技能只消费交回的输入。」、task-maker「同一作者；本技能承接…不换作者。」、run-phase「本技能不另派调研。」；附改动前三行 diff；⑤`skills/decision-maker/templates/package-context.md` 有原文逐字、行位、sha256 三件与翻译对照六列；⑥冷读三问、对抗三问在位；⑦任务 4 三个坏例按「谁查的/谁写的/谁签的」判不成立；⑧`git diff --stat workflows/*/steps.json` 为空。
  通过：①各 1；②9 行六项可读；③测试/审查分列；④无输出；⑤六列可读；⑥两处问句在位；⑦三坏例都判不成立；⑧空。
  失败：前三份又拆出三个角色；run-phase 把测试并进审查；只写「必须独立」没有角色名；把角色产物写进 `steps.json`；用「原义」代替原文；三坏例判过一条；声称机器拦住「谁写的卡」。
  证据：四份技能改动前后行位、上下文包模板、任务 4 三坏例判词，落 `quality/evidence/p10-replay/`。关联 FR-25–FR-27；包卡 AC-P10。
  成本：executor=实现者＋独立审查角色；estimate_min=40；hard_cap_min=90；resources=四份技能、上下文包模板、任务 4 三坏例；observation=9 行与六项、测试/审查分列、三句反写、六列、三坏例；retry_cap=1；evidence_tier=文档级。

- [ ] **AC-18 包级问题与方案全覆盖**
  场景：读包级覆盖账、10 个包的问题/方案行、8 份 Phase 卡。
  判定方式：人读＋命令。
  判法：①覆盖账有 10 个「## 包 N」节、97 行四值（覆盖/部分/缺/未取得）无空格；②每个「缺/部分」有 owner 与恢复条件；③每个包的问题与方案至少一条被某 Phase/Task/AC 消费；④四值外无词，结论列不出现「通过」；⑤审计 §2.2 判缺的每一件与 §6 的每一行，都在账里指到消费点、修复任务或具名缺口之一，三者都指不到时该条只能记部分，不得判 pass。
  通过：①10 节 97 行；②缺口有主；③10/10 有消费；④无第五值；⑤缺件行都指到消费点或修复任务。
  失败：只写包名不写消费位；缺口无 owner；把「部分」写成「通过」；缺件行只有 owner 而没有消费点或修复任务。
  证据：`quality/evidence/build-plan/package-coverage-ledger.md`；关联 P9 卡。
- [ ] **AC-19 单一事实源一致**
  场景：读 spec「单一事实源」表与 P1/P2/P8、三份技能里的同一数值。
  判定方式：机器可判。
  判法：①`spec.md` 有「## 单一事实源」节，五事实各一行（角色数、AC 数、轮次、任务数、包数）；②AC 条数与表同值；③P1 五个名字（执行者、审查者、开发者、独立审查者、独立测试者）各 ≥1 处、`六个名字` 0 命中；④P2「冷读最多两轮／内核上限两轮」0 命中、`上限归内核 R1` 仍在；⑤P8 卡不出现「16 条 AC」字样（只许出现在「17＝16＋1」的算式里）、判 AC-01–AC-17 共 17 条并出 17 行表；AC-18／AC-19 由 P9 首判、P8 消费，全文 19 条与单一事实源同值。
  通过：①五行非空；②同值；③五个名字各 ≥1、`六个名字` 0（0/5）；④0/≥4；⑤0 处「16 条 AC」、17 条/17 行、19 条同值。
  失败：卡上另写一套数；表外有第二份定义。
  证据：spec 表、P1/P2/P8 卡、三份技能；关联 P9 卡。

### 反向破坏（必做一次，证明判据会红）

按顺序做出下列破坏，观察指定断言变红，然后复原；破坏只在副本或临时目录里做，不改交付字节，做完记位置。

1. 把 AC-14 对应的旧出口句加回 `workflows/make-decision/SKILL.md`（例如「小改动不报缺独立审查」）→ AC-14 ② 必须从「无输出」变成有命中（grep 退出码 0），AC-14 判失败。若它仍无输出，AC-14 判据失效。
2. 把 `skills/run-phase/SKILL.md` 第 8 步交付物改成不存在的文件名，或删掉那份被引用的文件 → AC-05 必须把该条判 `missing`，AC-04 的终末结论必须出现该缺件。若仍判 `verified`，AC-05 判据失效。
3. 删掉一条通过判据的唯一证据引用 → AC-06 三处读取必须都报同一结论（不再通过）。若有一处仍通过，AC-06 判据失效。

## Appendix B — 需求与编号对照

正文编号与机器编号在这里一一对应；机器编号是 Phase 卡与证据引用的稳定键。

| 正文编号 | 机器编号 | 说明 |
| --- | --- | --- |
| 需求组 1–6 | WP1–WP10 | 十包，见 decision-log 第 3 段 |
| 旅程 A–E | JOURNEY-A..E | 立项、计划、执行、收口、阶段入口 |
| 状态表各行 | STATE-01..STATE-17 | 现象→读作→谁补→恢复条件，按表行序编号 |
| 功能需求 | FR-01..FR-27 | 见「功能需求清单」 |
| 验收条款 | AC-01..AC-19 | 见 Appendix A |
| 风险 | RISK-01..RISK-04 | 见「有什么风险和未决」 |
| 未决 | OPEN-01..OPEN-07 | 见「还有什么没定」 |

### 来源与原件清单

- **FR-01–FR-03**：`quality/evidence/decision-maker/p1/card.md`、`quality/evidence/talk/2026-11-26-p1-p2-p3-answers.md`；关联 AC-01、AC-09。
- **FR-04–FR-05**：`quality/evidence/decision-maker/p2/card.md`、decision-log:76-86；关联 AC-02。
- **FR-06**：`quality/evidence/decision-maker/p3/card.md`；关联 AC-03。
- **FR-07–FR-09**：`quality/evidence/decision-maker/p4/card.md`、`runtime/stage/stage-content-contracts.mjs`；关联 AC-04、AC-05。
- **FR-10–FR-13**：`quality/evidence/decision-maker/p5/card.md`、`runtime/task/delivery-claims.mjs`、`tools/cli/task-close.mjs`；关联 AC-06–AC-08。
- **FR-14–FR-16**：`quality/evidence/decision-maker/p6/card.md`、`specs/archive/delivery-quality-code-20261124/spec.md:1249`；关联 AC-09–AC-11。
- **FR-17–FR-18**：`quality/evidence/decision-maker/p7/card.md`、`quality/evidence/talk/2026-11-26-p7-t08-answer.md`；关联 AC-12。
- **FR-19**：`quality/evidence/decision-maker/p8/card.md`；关联 AC-13。
- **FR-20–FR-24**：`quality/evidence/decision-maker/p9/card.md`、`quality/evidence/decision-maker/p9/design.md:465-491`、`tests/contract/four-skill-wiring.test.mjs`；关联 AC-14–AC-16。
- **FR-25–FR-27**：`quality/evidence/decision-maker/p10/card.md`、`quality/evidence/decision-maker/p10/design.md`；关联 AC-17。
- **术语**：`GLOSSARY.md`；本文件两处新词的定义位置见「补充材料与术语在哪里」，不在此重复。

### 具名不适用

- **独立判定者字段**：不作为本文件的 AC。理由：用户 2026-11-26 裁决「不要记谁来判了，纯粹是过度设计」，只覆盖包 6；decision-log:538 仍写比较判定者≠交付者，两处未同步（OPEN-06）。本文件因此只要求「审查角色不参与写作」，不要求判定者字段；同步由主会话完成。（与 AC-01 的判定人条件互指，不裁决哪套为准；OPEN-06 未决。）
- **页面、视觉、并发、性能实测**：本任务无页面与路由、无并发或性能承诺（decision-log:43-45、p6 卡未决）；不设 AC，写明理由。
- **Codex 适配器回退（U-019）**：属前置修复，已由 decision-log:682-688 与 `quality/evidence/codex-adapter-fix/` 承接；不并入本任务 AC。
