# 功能规格：真实答复进入方向、变更与计划首卡

本文件写给七个 Phase 作者、测试蓝图作者、实施者与独立验收者。
读完应能定位产品结果、真实来源、首改符号、写集顺序与唯一验收判据。
下文 AC 指唯一验收判据，FR 指功能需求。
PFACT 指带来源状态的事实或假设，不是运行状态。

> 写作标准：`skills/material-writing/SKILL.md` 是唯一形状标准。
> `## 实现设计（全局权威）` 及其四个小节名按机器合同保留。
> 本文件承载产品行为与全局设计；Phase 只写增量，索引只写指针。
> 当前为计划草稿，不宣称实施、测试、审查或真实首卡已经完成。

## 这是什么，给谁用？

给方向主持人、计划作者和独立验收者一条可回读的真实答复链。
它让承诺保持原来的强度，让变更有人接手，让首卡无需重问已定方向。

- **功能名**：真实答复进入方向、变更与计划首卡。
- **使用者**：命令行 AI 主会话、方向作者、计划作者与独立读者。
- **来源**：当前 decision-log、需求索引及七包已确认方向。
- **状态**：计划草稿；合并后修订版未获用户新版确认，材料维护不授权实施。

## 一页看懂：谁要什么结果，怎么算通过？

用户只说真正需要人决定的事，后续读者能凭原话正确开工。

- 方向主持人先查事实，再把真正取舍交给用户。
- 决定作者保留原话、语气及必须、允许、本次不做、待定四种承诺。
- 验收者只限制受未答影响的条款，并双向核对需求与验收。
- 变更接手者看到失效位置、修改依据、责任人及实际改文。
- 同包读者当场看到讨论、质询、冷读、对抗与完整真实答复。
- 独立计划作者从正常入口写出首卡，缺件时明确受阻而非假接包。
- 最终验证者串读沿途首判，不把回执、文件存在或末端补签当效果。

最大影响面是 Talk、make-decision、两类现有检查器及既有交接。
每条业务判据只在 Appendix A 定义，Phase 不得另写第二份判据。
非目标见「做成什么样？」；任何扩张都回原决定人，不由实施者自答。

## 为什么做，给谁用？

旧流程会把建议写成批准，把缺件留到最后，也会让旧决定继续被消费。
本任务要把真实答复的强度与后续动作接起来，而不是再建一套记录平台。

### 功能需求 1：只问会改变动作的取舍

方向主持人在第 9 步拿到仓库、运行、外部供件和用户取舍候选。
他先查仓库与已有答复，再为每个真取舍写清不同选项的后续动作。
输出是既有问答批次中的问题、类型、答或未答、具体落点四列。
事实题送用户、同动作仍提问或状态展示冒充自动处理均须失败。
包2、包3和包6分别读取答复、未答落点与完整原话。
关联场景 1、事实 1 与验收 1；机器编号见 Appendix B。
来源绑定：R-006、R-001；决定 1；source_status=current。

### 功能需求 2：承诺保持原话、语气与身份

决定作者在真正的决定块内逐行写四种承诺及唯一答复指针。
输入是答复索引、被引原件与完整问题语境，不是代理摘要。
输出能区分用户承诺、具名派生和被否方案；派生不能独自支撑承诺。
截句、删限定语、抬高语气或无来源升级必须被指出。
包3、包4、包6与任务五消费同一来源，不另建承诺段。
关联场景 2、事实 2 与验收 2。
来源绑定：R-003、R-002；决定 2；source_status=current。

### 功能需求 3：原话能支撑下游首卡

计划作者取得的不只是一个来源编号，而是可回读的完整原话与适用对象。
他据此写改什么、不做什么、怎样验、依赖谁与失败怎么退。
只批准测量时点的原话不能被扩成批准阈值。
若总确认被当作包级答复，或首卡仍回问已定方向，对应验收失败。
包2提供来源，包6证明真实消费；历史坏例只作反例，不冒新任务效果。
关联场景 2、6、7与验收 2、8、9。
来源绑定：R-002、R-008；决定 2、6；source_status=current。

### 功能需求 4：未答只限对应验收并双向覆盖

验收作者把未答绑到具体 AC，同时写负责人和恢复条件。
输入是需求索引、决定日志、唯一覆盖矩阵及存在时的 spec。
输出能指出需求无验收、验收无来源、非法新增与无替换关系。
无 spec 时编号差集明确不可用；无关验收不受同一未答影响。
包4、包6、包7消费覆盖结果，任务五保留最终存在性判定。
关联场景 3、事实 3 与验收 3。
来源绑定：R-004；决定 3；source_status=current。

### 功能需求 5：替代可核后才退重复工作

包3只扩展现有链检查，原案第二套差集工具登记为不建。
包4保留人工失效标记，直到消费者能自动更新且原坏例仍被抓。
输入是现役 caller、替代行为和受控负例，不是静态零命中。
输出是明确的保留或不建结论；虚构删除现役工具必须失败。
包7核对退役条件，不能借“工具不存在”宣称退役完成。
关联场景 3、4与验收 4、6。
来源绑定：R-009；决定 3、4；source_status=current。

### 功能需求 6：真实变更定位失效与接手人

方向改变时，材料主会话保留旧决定、修改权、理由、新依据和新旧关系。
同一失效行补标注人、受影响位置与接手人，旧行仍可读且待重做。
检查器只增加读取和缺口提示，不自动推导失效，也不改退出码语义。
漏标、无人接手、邻项误作废或只有标签没有实际改文均须失败。
包6与包7消费变更原件和首卡改文；任务三才固化长期计划规则。
关联场景 4、9、事实 4、7与验收 5、6。
来源绑定：R-005、R-002、R-003；决定 4；source_status=current。

### 功能需求 7：同包当场讨论并保留答复全集

方向主持人在同一包内完成展示、质询、冷读、对抗与真实答复。
第 10 步只处理跨包一致性与新风险，新歧义回到受影响包。
第 11 步只处理已定词汇和难逆权衡，第 12、13 步读取答复全集。
未收敛先整体细审、长答复消失、旧答复误用或跨包风险未回包均失败。
包6读取同包五件，包7读取完整答复和首判原件。
关联场景 5、事实 5 与验收 7。
来源绑定：R-007、R-001；决定 5；source_status=current。

### 功能需求 8：首卡从正常入口真实形成

未参与本包写作的独立计划作者读取同包五件与包级真实答复。
缺件时先写受阻首卡，逐项写缺件类别、责任人和复验条件。
入口齐备后更新同一首卡，写全五项开工内容并实际复读。
错包、同号异版、缺件放行或总确认代卡必须受阻。
包7只消费最终真实首卡；任务三只消费长期规则需求。
关联场景 6、7、事实 6 与验收 8、9。
来源绑定：R-008、R-002；决定 6；source_status=current。

### 功能需求 9：任务一供件按真实行为验收

任务二只消费任务一正常入口交付的同包读取、效果问题和写集对账行为。
同包链接用于包6最终首卡，三条链一起到齐才用于包7联合验收。
测试回执或捕获回执单独不算供件；缺件只停对应 AC。
输入只取当前HEAD与正常可读原件，不跨工作树借字节。
任务二不改任务一所有的 build-plan 入口或审查实现。
关联场景 7、8、事实 6 与验收 9、11。
来源绑定：R-012；决定 6、7；source_status=current。

### 功能需求 10：逐包首判，末端只汇总整链

每包在实施和审查回修后立即判自己的 AC，并留真实正负例。
历史坏例、真实新任务消费与逐条反例分别保存，不能互相替代。
改后第一次真实新工作的证据由P5验收7的实际使用原件产生，
记录真实输入、消费者与业务结果；P7只读引用，缺件时保留覆盖缺口。
包7独立验证者从真实答复串读到首卡，再打开沿途首判原件。
抽走任一包首判、必要任务一行为或负控时，整链必须保持未完成。
包7不重跑全量，不补做包1至包6首次验收。
关联场景 8、事实 7 与验收 10。
来源绑定：R-001、R-010；决定 7；source_status=current。

### 功能需求 11：范围边界本身也要可核

实施者与独立读者能沿真实 diff 核出没有越界写入或第二控制面。
输入是本文件精确写集、真实变更路径和已接受的非目标。
输出保留复用、不建、暂不退役及外部任务边界。
新增阶段、第五种承诺、第二进度权威、无人读清单或例行双原型均失败。
该约束贯穿所有 Phase，由包7作最终范围复核，不另设实施包。
关联场景 8、事实 8、9与验收 12。
来源绑定：R-011；决定 1–7；source_status=non-goal。

### 背景与真实来源是什么？

当前产品目标来自 decision-log，原话强度来自需求索引与公共确认。
PRD 是产品需求文档；归档 PRD 只作已确认来源，不替当前用户发言。
交接只作导航；本规格实际绑定的版本如下，旧摘要不同版时不顶替原文。

| 原件 | 本次绑定与批准边界 |
| --- | --- |
| `decision-log.md` | sha256 `54f0817feaa6cc6a1e5621c621ab6d9681b55098c883efd743e6473906e49d25`；七包决定与跨包边界 |
| `requirement-index.md` | sha256 `18d9115eb5e60d59fd567ca2feea12dcf3fc40fa2df8d5b3c169d3630e2d3f5b`；与当前日志证据索引第554行一致，旧指纹仅作历史 |
| 快进后基线 | HEAD=`ad1f8c302a1e34abdc5c759245223348ef71a637`，含任务一merge `05c07332`；只证代码与归档已到位 |
| 任务一归档收口报告 | `specs/archive/delivery-quality-foundation-20261122/closeout-report.md`；sha256 `eab085c32428faa09ff44a54408ebcafeeb873c46fa1f127aefed67c061e7c77`；最终账9达成、1未完成、2未达成 |
| 规划交接002 | `quality/evidence/handoff/2026-11-23-002-build-plan-handoff.md`；sha256 `3f467fe80dc2525e8884aec0b60d42a1f8aa49fe82f6aa9b531d12f5671ae624`；其供件时点早于本次快进，原件不改 |
| 合并后公开检查085 | `quality/tests/2026-11-23-085-sync-main-current-foundation-check.output`；真实exit 1，指名收敛清单缺指针，`chain_state=unverified`；不是合并失败 |
| `stage-handoff.md` | sha256 `694d73b9787ae5285a90d45ba8c609b2ee655eb6dea7900cd31956c3ec091328`；只作交接摘要 |
| U-014 公共确认 | reply=`确认当前七包方向（推荐）`；不作包6逐包首卡 |
| U-015 公共确认 | reply=`按七个阶段写正式计划（推荐）`；不批准 AC |
| 历史基线原件 037 | 当时日志、答复与决定索引解析成功；不是当前版本或业务验收证明 |
| `testing-blueprint.md` | sha256 `f5dd2273921a6405733944781ce047bc06af4d0963285d968ce5e8ee1008777f`；提供目标命令、输入、判定器与成本设计 |

U-007至U-013历史 Talk 原件的逐字强度仍有来源限制。
本规格不重开方向问答，也不把这些限制扩张成新的产品问题。

## 做成什么样？

七个包各自交出可观察结果，缺件只影响与它直接相关的验收。
场景、事实状态和异常如下；通过与失败正文只在 Appendix A。

### 场景卡怎样连接真实消费者？

| 场景 | 真实输入与动作 | 消费者得到的结果 | 验收与落点 |
| --- | --- | --- | --- |
| 场景 1 | 第 9 步混入仓库题、运行题、供件题与真取舍 | 用户只见真取舍，后续包读到四列 | 验收 1；P1/T001 |
| 场景 2 | 完整原话、截半原句、派生建议与四种承诺 | 决定块保持强度和身份，坏例显名 | 验收 2；P2/T002 |
| 场景 3 | 有绑定未答、无绑定未答、合法与非法新增 | 只限相关 AC，双向覆盖可读 | 验收 3、4；P3/T003 |
| 场景 4 | 旧失效行、新失效行、漏标与邻项反例 | 旧行兼容，新行责任与位置可读 | 验收 5、6；P4/T004 |
| 场景 5 | 同包四样、跨包风险与长答复 | 包内先收敛，答复全集不丢 | 验收 7；P5/T005 |
| 场景 6 | 当前可读卡与缺质询、缺包级答复 | 受阻首卡如实指出谁补什么 | 验收 8；P6/T006 |
| 场景 7 | 正常入口、同版五件与包级真实答复 | 最终首卡五要素齐且不回问方向 | 验收 9；P6/T006 |
| 场景 8 | 沿途首判、任务一行为与抽件负控 | 交接如实可用或具名未完成 | 验收 10、11、12；P7/T007 |
| 场景 9 | 真实 supersede、失效行与首卡改文 | 下游实读并调整受影响首卡 | 验收 6；P4/T004，P6复验 |

### 已核实的事实与假设是什么？

PFACT 是规格事实状态，不是承诺四态，也不是新的运行状态机。

- **事实 1 / PFACT-001：verified。**
  Talk 已有候选重排、取消恢复与内存事实返回；薄适配层不直接写文件。
  证据为 `skills/talk-with-zhipeng/SKILL.md:62-177,244-293`。
  影响功能需求 1 与验收 1。
- **事实 2 / PFACT-002：verified。**
  链检查现读 `决定 N`、来源三字段和 spec 同目录 AC；
  当前语气枚举与命名锚兼容性仍需窄扩展。
  证据为 `check-decision-log-chain.mjs:27-47,137-195,330-465,563-590`。
  影响功能需求 2、3与验收 2。
- **事实 3 / PFACT-003：unknown。**
  包3当前卡仍绑 U-004，详细方案绑定未闭环。
  owner=当前任务主会话组织，质量角色与包3写主在任务内分工；只影响验收 3、4的真实材料首判与退役结论。
  通用实施、合约和P4技术交回可先继续；恢复是核当前卡、真实包3答复与指纹后重跑绑定。
- **事实 4 / PFACT-004：verified。**
  `invalidatedSteps` 当前只返回步骤、阶段与范围，报告投影失效步骤列表。
  证据为 `check-stage-steps.mjs:315-347,2254-2259`。
  影响功能需求 6 与验收 5。
- **事实 5 / PFACT-005：verified。**
  第11步仍含计划骨架与后置质询；第13步“14行”仅指需求索引A表，
  不能据此宣称已证实固定行数读答复。
  证据为 `workflows/make-decision/SKILL.md:322-346`及包5卡。
  影响功能需求 7 与验收 7。
- **事实 6 / PFACT-006：unknown。**
  当前HEAD`ad1f8c30`已含任务一merge`05c07332`；生产入口与代码可复用。
  任务一归档报告最终账为9项达成、1项未完成、2项未达成，
  既有风险接受和外部缺口例外不写成任务二通过。
  本任务同版五件、真实质询、逐包答复和最终独立首卡仍待证；
  085另证当前收敛清单缺指针，属于真实接入缺口，不为规划补挖或改写旧日志。
  owner=当前任务主会话组织，材料作者、独立计划作者与验证者任务内分工；影响验收 9、11。
  恢复只认当前HEAD正常入口可读的同版原件、真实调用与正负例行为。
- **事实 7 / PFACT-007：unknown。**
  首次真实方向变更及其下游实读改文尚未发生。
  owner=当前任务主会话持续组织，真实变更仅在本任务正常工作中发生后取证；只直接影响验收 6及整链对应缺口。
  恢复是真实 supersede 后取得新旧决定、失效行、实读和改文。
- **事实 8 / PFACT-008：verified。**
  本任务为非 UI：原始要求、项目库存和已接受大纲均不落在页面行为。
  证据见「测试计划是什么？」的三源逐项判断；影响全部 Phase。
- **事实 9 / PFACT-009：inferred。**
  复用现有模块比新增协调层更合适；这是依据 caller 与宪法作出的设计推断。
  限制是尚未实施后实测；影响所有写集与验收 12，若真实 caller 不符则回原设计。

### 默认、空、错误与并发状态怎样处理？

- 默认：候选先查事实，承诺保留原语气，检查器读取当前真实字节。
- 空：没有候选可结束该批；无 spec 时 AC 编号对账为 unavailable。
- 错误：原件不可读、来源不匹配、错包和错版本必须显名，不默认成功。
- 加载：N/A——本任务没有页面或异步加载视图；外部等待只记真实限制。
- 取消：Talk 保留已答、未答和暂停原因，恢复先核真实答复再重排。
- 边界：pre/history 只读；新规则只约束新任务和明确升级的当前任务。
  main没有程序化在途时序选择器，裸包号或轮次不是选择依据。
  仅沿同版原记录人工核对时序并保留第9/11步义务；
  不能确认就停对应共享切换并记unknown，不新建兼容机制。
- 权限：外部原件沿 `--source-root` 与认证 task handle，不新增权限。
- 竞态：同文件不同字段仍共享，必须按「代码锚点」后的写序串行。
- 重复执行：只读检查重放当前字节；交接 create-only，不覆盖旧原件。

### 明确不做什么？

不新增技能、阶段、确认点、第五种承诺或第二套进度记录。
不建第二套需求差集、变更账本、未知清单、汇总平台或持久问题队列。
不做自动失效推导，不在自动消费者成立前退人工失效标记。
不回填或迁移历史日志、旧卡、旧答复和旧失效行。
不改 `workflows/build-plan/**`，不写任务三长期规则或施工卡。
不替用户定阈值、独立执行者、风险接受或新增产品承诺。
不做页面、路由、组件、样式、视觉基准、原型或例行双原型。
UI 指页面与交互界面；本任务三源均不涉及 UI 工作。
不在末端补做沿途首判，不跑无范围全量回归。

## 打算怎么做？

复用现有记录与检查器，只扩真实消费者读取的字段和最小报告。
Talk 仍只返回内存事实，主会话写既有问答；材料权威不搬家。

### 方案 1：沿用唯一权威并窄扩展

包1改 Talk 分诊与第 9 步调用说明，不改答复索引七列。
包2在真正决定块内放承诺行，扩链检查读取，不改需求索引字节。
包3扩同一链检查，并只读对照终末既有双扫描；覆盖矩阵仍作语义权威。
包4在同一失效行扩字段，保持旧行、待重做和退出码语义。
包5并线既有步骤，只加一条报告级缺质询提示，不加步骤。
包6只交首卡与真实消费证据，不改计划目录。
包7只改既有收口和交接方法，由现有 producer 保存事实。

选择理由是 P1/P2：现有能力能承接，不需新机制。
被否方案与新控制面保持在不建清单，不留下兼容桥或第二 writer。
失败时只撤受影响 hunk，保留他人改动、原输入与失败原件。

## 阶段大纲：几个阶段，各交什么？

七个 Phase 与七包一一对应，用户已以 U-015 许可按此写正式计划。
每阶段都能独立交付和首判；共享文件按真实依赖串行，不按人拆票。

| 阶段 | 独立交付与核心验收指针 | 依赖及下游 |
| --- | --- | --- |
| P1 只问真取舍 | 四分类、自动作业分诊与当批四列；验收 1 | 无前置；交 P3、P4、P6 |
| P2 原话与承诺 | 四态、来源与派生边界；验收 2 | 无前置；交 P3、P4、P6 |
| P3 未答与覆盖 | 未答限界、双向覆盖与不建第二差集；验收 3、4 | 依赖 P2；交 P4、P6、P7 |
| P4 变更失效 | 失效字段、旧行兼容与真实变更缺口；验收 5、6 | 依赖 P1–P3；交 P5、P6、P7 |
| P5 同包讨论 | 同包四样、完整答复与报告级提示；验收 7 | 依赖 P4；交 P6、P7 |
| P6 真实首卡 | 受阻首卡与最终真实首卡；验收 8、9 | 早期取 P2；最终取 P1–P5及任务一入口 |
| P7 整链交接 | 沿途首判、任务一三链与范围复核；验收 10–12 | 最后；交用户与后续实施者 |

第 0 阶段不采用：没有跨 Phase 共用服务或大型数据集要另备。
共同开工条件只在全局就绪表写一次，不形成额外交付阶段。

## 谁先谁后？

P1与P2可并行，因为本设计把第 9 步相关文字统一交 P1写主。
P1审修后先交第9步/Talk与当批四列技术增量及当时证据缺口；
P4/P6使用这些技术输入不等AC-P1-001最终通过。
P2/P3/P6同批首次读数齐后，由原P1读者复验，不新增状态或测试标准。
P3在P2后写同族模板、链检查和测试；通用正反例不等真实包级绑定。
P3交回通用技术版本后P4可接手，真实材料首判与退役缺口不锁P4。
P4在AC-P4-001首判后交回检查器、测试和方法版本供P5使用。
P5无需等待AC-P4-002的真实变更事件；该事件由P4/P6另行复验。
P6可在P2后准备受阻首卡，但最终首判必须等P1技术交回、P3技术交回、P4技术交回、P5接入。
P7最后只消费首判与必要未闭环项，不把等待变成重跑全量。
技术交回与当前游标只定位工作，不以上游全部判据通过作继续许可；
带真实缺口交回不冒称完成，AC-P4-002仍单独等待真实事件。

任务一已随`05c07332`合入当前HEAD，不再等待笼统供件或重复建设入口。
本任务只复验直接相关行为；其9/1/2最终账与风险例外不自动成为本任务通过。
共享写序与每个路径的前后 writer 见「接口与失败语义」。
全任务最少分七张 Task 卡，每 Phase 一张，连续编号 T001至T007。
blocked_by 只写真实输入或交付依赖，不因编号相邻制造阻塞。

| Phase/Task | 用户可感知结果 | 承接 AC | blocked_by |
| --- | --- | --- | --- |
| P1/T001 | 真取舍与当批四列 | AC-P1-001 | 无，可立即开始 |
| P2/T002 | 原话、四态与派生边界 | AC-P2-001 | 无，可立即开始 |
| P3/T003 | 未答限界、覆盖与受控退役 | AC-P3-001、AC-P3-002 | P2/T002；绑定只限真实材料首判与退役，不阻通用实施和技术交回 |
| P4/T004 | 失效读取、兼容与真实变更合同 | AC-P4-001、AC-P4-002 | P1/T001技术交回、P2/T002、P3/T003技术交回；共享checker已合入，P4/P5同版前提分别核 |
| P5/T005 | 同包四样与答复全集 | AC-P5-001 | P4在AC-P4-001后的技术交回；共享代码已合入，P5同版与旧义务待证，不等P4真实事件 |
| P6/T006 | 受阻首卡与最终真实首卡 | AC-P6-001、AC-P6-002 | 早期取P2；最终取P1/P3/P4技术交回、P5、已合入生产入口及本任务同版五件 |
| P7/T007 | 整链交接、联合供件与范围复核 | 首判引用全部AC，本地承接AC-P7-001/002/003 | P6/T006、P1–P5首判或缺口、任务一报告及任务二授权行为原件；不以上游全过设门 |

当前任务主会话对所有缺口负责组织闭环并负责到底。
文中材料主会话、质量角色、各作者和独立验证者均为本任务内部分工；
任务一报告只是只读历史来源，不存在可转嫁恢复责任的外部负责人。
以下顺序只安排既有Phase内工作，不新增阶段、确认点或测试标准。
新版未确认前只能准备材料；明确批准实施后方可按序执行，准备不等于批准。

1. 当前任务先沿既有方向材料补正路径和原许可路径恢复真实同包清单、
   唯一日志指针及引用，定位缺件，并在任何依赖该材料的首判前完成恢复。
   这些材料不是P5/P6新增代码写集；现阶段只盘点或草拟，正式接入须明确授权。
   只做原材料维护，不补签历史答复，不改历史，本轮不改旧决策正文。
2. P3依据当前设计调用实证纠正可读问题，并对当前字节重做冷读与对抗。
   缺逐包原答时，仅对确会改变动作的决定串行问用户；
   不伪造七个历史答复，也不把整体确认拆成逐包批准。
3. 正常授权的真实首用由当前任务亲自取证：
   P1留同批首次消费；主会话主动安排正当新工作场景供P5留真实工作证据，
   不把本任务旧记录改名充数，没有真实对象就保持未验且不转给任务三。
   P6读同版五件并更新同一首卡，P7读真实效果送达和唯一写集对账；
   作者与独立验证者可按需分工，主会话不因此卸下闭环责任。
4. 真实长答复和真实变更未发生时，当前任务保持未验并写明复验条件；
   主会话持续负责恢复，不降级判据、不伪造事件、不转嫁其它任务。

## 还有什么没定？

剩余未知都有 owner 和恢复条件，不用沉默或推测补齐。

- 未决 1：包3绑定；只限验收 3、4的真实材料首判与退役结论；
  当前任务主会话组织质量角色在该判定前闭环，不阻通用实施、合约或P4技术交回。
- 未决 2：同包生产入口已合入；本任务同版五件、真实质询、逐包答复、
  最终独立首卡及正常入口实际读数仍待证，影响验收 9。
  owner=当前任务主会话组织材料作者、独立计划作者与读者在任务内补证；
  不从测试或旧总确认代填。
- 未决 3：首次真实变更；影响验收 6及整链对应缺口；
  当前任务主会话保持未验，真实发生后组织复验，不降级或转嫁。
- 未决 4：任务一报告已给出9/1/2最终账；任务二仍需在正常授权下
  复核效果送达、最终review record及唯一写集对账，影响验收 11。
  owner=当前任务主会话组织实际producer与独立验证者；缺真实记录只写对应unavailable。
- 未决 5：独立计划作者与验证者；影响验收 8–11；当前任务主会话在任务内指定。
- 未决 6：性能基线未取得；不设阈值，不阻塞功能首判；当前任务主会话组织首用记录。

若恢复需要改已确认方向、范围或 AC，停止对应路径并交原决定人。
其它安全设计、实施和修复继续，不把局部缺件升级为全任务停摆。

## 实现设计（全局权威）

采用现有 CLI、材料和检查器接缝，不新增公共命令、schema 或持久对象。
CLI 指命令行接口；行号是 2026-11-23 的快照定位。
符号与真实字节才是设计依据，行号漂移不改变合同。

### 代码锚点

实施者先读 caller，再读产出符号与测试，最后才改对应窄分支。

| 路径与符号 | 本次实读事实 | 改动落点 |
| --- | --- | --- |
| `skills/talk-with-zhipeng/SKILL.md` 执行协议、薄适配层 | 候选重排与内存事实返回；sha `599f7e1b…cda9c` | P1 |
| `workflows/make-decision/SKILL.md` 第9、11–14步及失效行 | 合并后sha `c2acefa6…7ef93a`；共享写入仍按P1→P4→P5→P7 | P1→P4→P5→P7 |
| `skills/decision-log/templates/decision-log-template-v2.md` 最终决定、验收 | 当前无四态与失效新槽；sha `e1cf00c5…ce7e` | P2→P3→P4 |
| `tools/cli/check-decision-log-chain.mjs` `decisionSections`、`checkDecisionLogChain`、`reconcileAcs` | 当前签名与 AC 对账已实读；sha `c5a4d1bb…cd13` | P2→P3 |
| `tests/contract/decision-evidence-consumption.test.mjs` 合约例 | 现有决定块与来源用例；sha `b2f0683e…91cc` | P2→P3→P5 |
| `runtime/task/final-chain-runner.mjs` `decisionOriginal`、第984行caller | 已有输入hash、checker hash、双扫描与实际调用；只读保护，P3不改 | 无写入 |
| `tests/contract/final-chain-runner.test.mjs` 终末合约例 | 现有终末消费者测试；sha `64796ea7…6285e` | P3 |
| `workflows/build-plan/SKILL.md` 第1步、`workflows/build-plan/steps.json:8` | 已合入同版五件生产入口；P6人工逐件读取，机器检查只作旁证 | P6只读复用 |
| `tools/cli/check-stage-steps.mjs` `invalidatedSteps`、报告投影 | 合并后sha `256cdf7b…a861`；P4/P5前置版本分别实读，不互相代判 | 任务一已合入；P4→P5 |
| `tests/contract/check-stage-steps.test.mjs` 步骤合约例 | 合并后sha `14dc4342…254b`；共享测试版本仍按Phase首判 | 任务一已合入；P4→P5 |
| `workflows/make-decision/steps.json` 第11–14步 | 合并后sha `452c6a81…8ebf`；旧第9/11步义务另靠同版原记录人核 | 已合入；P5 |
| `workflows/make-decision/step-consumer-design.md` 根步骤表 | 合并后sha `e096b054…dc5`；不以裸包号或轮次推断在途时序 | P5 |
| `skills/stage-handoff/SKILL.md` 信息来源与回读 | 既有十三区块与 create-only 交接；sha `7506cd92…661c5` | P7 |

当前 `checkDecisionLogChain` 输入含 `markdown`、答复索引、来源读取器、
`spec_markdown` 与可选冻结 Git 读取器；CLI 仍用 `--file` 或 `--root`。
外部原件必须显式 `--source-root`，不能改为隐式任意目录扫描。
`reconcileAcs` 只在 spec 有实际文本时工作；无 spec 不制造空集通过。

### 接口与失败语义

数据沿唯一原件向前流动，任何摘要都不能反写或替代来源。
主链路是：真实问题与答复→决定块和覆盖→失效行→同包五件→首卡→交接。

| 接口 | 写者与输入 | 读者与输出 | 失败语义 |
| --- | --- | --- | --- |
| 当批问答四列 | 主会话写候选、事实和真实答复 | P2/P3/P6读答复状态与落点 | 未交接、真未答、已答分开 |
| 决定块四态 | 材料主会话写原话指针和强度 | 链检查与P3/P4/P6读承诺 | 缺源、抬语气、派生冒用户显名 |
| 唯一覆盖矩阵 | 材料主会话写需求、AC或具名缺口 | P4/P6/P7与终末读取 | 无 spec 对账 unavailable |
| 失效行 | 材料主会话写旧新关系与接手人 | 步骤检查、P6/P7读重做范围 | 缺字段只提示，不作废旧行 |
| 同包五件 | 已合入build-plan第1步/`steps.json:8`入口与包5材料生产者供给 | P6独立计划作者人工读同版五件，核任务、包号、批次和卡节sha | 缺件、错包、异版或总确认代卡受阻；checker只旁证 |
| 真实首卡 | P6独立作者写五要素或缺件诊断 | P7与任务三读最终版或限制 | 总确认代卡、回问已定方向失败 |
| 最终交接 | 主会话写沿途首判与真实缺口 | 用户、独立验证者与下一会话 | 抽件保持未完成，不漂白 |

承诺四态只取必须、允许、本次不做、待定。
来源缺口不是第五态；未答保留原问题、owner 与恢复条件。
失效行新增字段只作报告投影，不改既有完成、退出码或历史行语义。
任务一供件只经正常公开入口消费，不创建适配副本或跨树镜像。

#### 全局写集与共享写序是什么？

以下路径是未来实施允许边界，不是本规格作者已经修改的文件。
NEW 表示新增，MODIFY 表示修改既有文件。
仓库路径相对认证工作区；`T/` 路径相对当前任务根。

| 精确路径 | 动作与唯一写主 | 真实消费者与先后依据 |
| --- | --- | --- |
| `skills/talk-with-zhipeng/SKILL.md` | MODIFY；P1开发 | 主会话与 Talk caller |
| `workflows/make-decision/SKILL.md` | MODIFY；各Phase开发依次持笔 | P1→P4→P5→P7；步骤调用与收口 |
| `skills/decision-log/templates/decision-log-template-v2.md` | MODIFY；各Phase开发依次持笔 | P2→P3→P4；同一模板槽位 |
| `tools/cli/check-decision-log-chain.mjs` | MODIFY；P2后P3 | 同一来源与覆盖检查器 |
| `tests/contract/decision-evidence-consumption.test.mjs` | MODIFY；P2→P3→P5 | 同一合约判定器 |
| `tests/contract/final-chain-runner.test.mjs` | MODIFY；P3开发 | 只补现有入口对照，不宣称现有行为目标RED |
| `tools/cli/check-stage-steps.mjs` | MODIFY；任务一交付后P4→P5 | 失效与缺质询共用报告 |
| `tests/contract/check-stage-steps.test.mjs` | MODIFY；任务一交付后P4→P5 | 同一行为 oracle |
| `workflows/make-decision/steps.json` | MODIFY；任务一后P5 | 第11–14步机器定义 |
| `workflows/make-decision/step-consumer-design.md` | MODIFY；P5开发 | 同版完成判据消费者 |
| `skills/stage-handoff/SKILL.md` | MODIFY；P7开发 | 主会话与后续交接读者 |
| `specs/delivery-quality-direction-requirements-20261122/decision-log.md` | MODIFY；材料主会话独占 | P2→P3→P4；P6/P7只读 |
| `T/quality/evidence/decision-log-refs/coverage-matrix-5d.md` | MODIFY；材料主会话 | P3唯一语义覆盖件 |
| `T/quality/evidence/build-plan/first-card.md` | NEW；P6独立计划作者 | P6复验与P7整链 |
| `T/quality/tests/p06-blocked-first-card.readback.md` | NEW；P6独立读者 | 受阻首卡语义与缺口判定 |
| `T/quality/tests/p06-final-first-card.readback.md` | NEW；P6独立读者 | 最终首卡语义与缺口判定 |
| `T/quality/tests/p07-final-acceptance.readback.md` | NEW；P7独立读者 | 既有任务根只读验收证据，不是第二进度账 |

没有新增生产模块、公共 CLI、持久 schema 或第二证据根。
P1实际问答和P7交接由现有 create-only producer 返回真实路径。
这些动态原件不预造固定副本，实际返回路径写入所属 Task 证据。
本轮规划交接与P7将来的产品交付沿各自既有普通流程；
此处只读验收证据不互设前置，也不新增触发条件或机制。

#### 哪些路径明确不能碰？

| 精确路径 | 实读值与保护理由 |
| --- | --- |
| `workflows/build-plan/SKILL.md` | `version: 4.2.0`；第1步生产入口已合入，P6只读复用，不重复建设 |
| `workflows/build-plan/steps.json` | `schema_version=2.0.0`、`stage_slug=build-plan`；第8行五件声明已合入，本任务不改 |
| `runtime/task/final-chain-runner.mjs` | `decisionOriginal`第407–467行及caller第984行已有hash绑定与双扫描；P3只读保护 |
| `T/quality/evidence/decision-log-refs/requirement-index.md` | 当前唯一sha为`18d9115e…f5b`；P2兼容读取，不改字节求绿 |
| `specs/delivery-quality-direction-requirements-20261122/step-consumer-design.md` | canonical 声明覆盖全部 76 步；当前材料只读 |
| `T/quality/evidence/decision-maker/p01/card.md` | 十一格卡，卡末 `source_id=U-004`；历史方向原件 |
| `T/quality/evidence/decision-maker/p02/card.md` | 十一格卡，卡末 `source_id=U-004`；历史方向原件 |
| `T/quality/evidence/decision-maker/p03/card.md` | 十一格卡，卡末 `source_id=U-004`；绑定缺口不得擅改 |
| `T/quality/evidence/decision-maker/p04/card.md` | 十一格卡，卡末 `source_id=U-004`；历史方向原件 |
| `T/quality/evidence/decision-maker/p05/card.md` | 十一格卡，卡末 `source_id=U-004`；历史方向原件 |
| `T/quality/evidence/decision-maker/p06/card.md` | 十一格卡，卡末 `source_id=U-004`；历史方向原件 |
| `T/quality/evidence/decision-maker/p07/card.md` | 十一格卡，卡末 `source_id=U-004`；历史方向原件 |
| `specs/archive/delivery-quality-reform-20261121/prd.md` | 第44行明确非 UI；归档只读 |
| `GLOSSARY.md` | 原为工作树既有未提交改动；用户 2026-11-24 决定随本任务一并交付（内容为「承诺四态」，属 P2 语义） |
| `skills/wh-review/scripts/simple-review-runner.mjs` | 原为工作树既有未提交改动；用户 2026-11-24 决定随本任务一并交付（审查包提示词，不属本任务写集，交付原因单独登记） |
| `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` | 原为工作树既有未提交改动；用户 2026-11-24 决定随本任务一并交付（同上提示词的测试） |

以上实读使用 read/grep/git status/shasum，日期为 2026-11-23。
若开工时实际值不同，先回对应 owner 更新设计，不按本快照覆盖现状。

#### 开工就绪表怎样使用？

build-code 首步实际执行机器项，材料侧只读回同一原件。
人判项未被证据关闭时只限制对应交付，不制造新的总门。

| 命令 | 期望 | 证据 | 机器或人判 | 负责人 |
| --- | --- | --- | --- | --- |
| `git rev-parse --show-toplevel` | 0 | quality/tests/readiness-git.output | 机器 | 计划负责人 |
| `node --version` | 0 | quality/tests/readiness-node.output | 机器 | 环境owner |
| `shasum -a 256 specs/delivery-quality-direction-requirements-20261122/decision-log.md` | 0 | quality/tests/readiness-decision-sha.output | 机器 | 材料主会话 |
| 人工核对当前 decision 与需求索引 sha 同本规格绑定 | 字节不符则具名 stale | quality/evidence/build-plan/source-readiness.md | 人 | 材料主会话 |
| 人工核对HEAD`ad1f8c30`已含任务一merge`05c07332`及当前共享字节 | 合入只解锁代码复用，不解锁行为验收 | quality/tests/2026-11-23-090-sync-main-git-scope-readback.json | 人 | 当前任务主会话 |
| 人工核对包3当前卡、答复与绑定输出 | 未闭环只停P3首判 | quality/evidence/build-plan/p03-binding.md | 人 | 质量负责人 |
| 人工指定独立计划作者与验证者 | 身份与上下文可读 | quality/evidence/build-plan/independent-readers.md | 人 | 质量负责人 |

测试数据优先复用现有合约 fixture 与当前任务原件。
P3/P4临时任务根由同一 Vitest 进程构造和消费。
所属测试现有 `afterEach` 负责清理，失败原件另存。
版本落后即失败：fixture 声明的 checker 字节、材料标题或签名不符即显名。
原始命令输出与失败证据不进临时目录，不由清理例程删除。
本任务不使用 execution-quality 共享数据集，因为现有合约夹具已足够判真伪。

### 需求到任务追踪

每行都指向真实来源、一个交付任务与可证伪判定器。
决定编号只定位方向；原始 R 仍须逐条核语义，编号出现不算覆盖。

| Source | FR | AC | Phase/Task | oracle |
| --- | --- | --- | --- | --- |
| R-001/R-006；决定 1 | FR-ASK-001 | AC-P1-001 | P1/T001 | ORACLE-QUESTION-ROUTING |
| R-002/R-003；决定 2 | FR-COMMIT-001 | AC-P2-001 | P2/T002 | ORACLE-COMMITMENT-SOURCE |
| R-002；决定 2 | FR-ORIGIN-001 | AC-P2-001 | P2/T002 | ORACLE-COMMITMENT-SOURCE |
| R-002/R-008；决定 6 | FR-ORIGIN-001 | AC-P6-001、AC-P6-002 | P6/T006 | ORACLE-FIRST-CARD-FIVE-PARTS |
| R-004；决定 3 | FR-COVER-001 | AC-P3-001 | P3/T003 | ORACLE-BIDIRECTIONAL-COVERAGE、ORACLE-FINAL-COVERAGE-SCAN |
| R-009；决定 3 | FR-RETIRE-001 | AC-P3-002 | P3/T003 | ORACLE-P3-CONTROLLED-RETIREMENT |
| R-009；决定 4 | FR-RETIRE-001 | AC-P4-001 | P4/T004 | ORACLE-INVALIDATED-LINE-FIELDS |
| R-002/R-003/R-005；决定 4 | FR-CHANGE-001 | AC-P4-001、AC-P4-002 | P4/T004 | ORACLE-INVALIDATED-LINE-FIELDS、ORACLE-REAL-CHANGE-HANDOFF |
| R-001/R-007；决定 5 | FR-DISCUSS-001 | AC-P5-001 | P5/T005 | ORACLE-MD-005、ORACLE-FULL-REPLY-READBACK |
| R-002/R-008；决定 6 | FR-CARD-001 | AC-P6-001、AC-P6-002 | P6/T006 | ORACLE-SAME-PACKAGE、ORACLE-FIRST-CARD-FIVE-PARTS |
| R-012；决定 6 | FR-SUPPLY-001 | AC-P6-002 | P6/T006 | ORACLE-SAME-PACKAGE |
| R-012；决定 7 | FR-SUPPLY-001 | AC-P7-002 | P7/T007 | ORACLE-P7-TASK-ONE-BEHAVIOR |
| R-001/R-010；决定 7 | FR-EVIDENCE-001 | AC-P7-001 | P7/T007 | ORACLE-CHAIN-EVIDENCE-COMPLETENESS |
| R-011；决定 7 | FR-SCOPE-001 | AC-P7-003 | P7/T007 | ORACLE-P7-SCOPE-BOUNDARY |

跨包次级指针不改变单阶段承接：原话在P2由决定2保真，在P6由决定6消费。
退役在P3、P4分别承接，任务一同包链与三链分别在P6、P7验收。
R-011仍以决定1–6为范围输入，决定7只负责P7终末范围复核。

反向核对：每个任务均有上述来源，没有为技术层另造孤儿任务。
R-011是非目标，但仍由验收 12 判越界；其它需求都有本地首判与末端引用。
测试蓝图作者只能复核可判性与补测试映射，不能静默新增或弱化 AC。

### 全局验证策略

先在各 Phase 用真实输入首判，再由P7读回原件并执行必要负控。
RED 是改动前目标断言失败，GREEN 是同一断言在改后通过。
同一行为的目标 RED 与 GREEN 必须共用判定器，环境失败另记。

| 验证面 | 适用性与判定器 | 首判与覆盖上限 |
| --- | --- | --- |
| 方法语义与真实问答 | 适用；独立读者按 Appendix A 复读 | P1/P5；命令不代替语义 |
| 来源与覆盖 CLI 合约 | 适用；P2/P3同一 oracle 做 RED/GREEN | 不证明所有历史形状兼容 |
| 步骤与失效 CLI 合约 | 适用；P4/P5在任务一同版上定向测试 | 不证明真实变更已发生 |
| 正常入口与首卡 | 适用；P6独立作者真实消费 | 缺件时只判受阻，不判可接 |
| 整链与前置供件 | 适用；P7读首判、行为和抽件负控 | 只汇总，不补签或全量重跑 |
| 页面、路由、组件与样式 | N/A——三源均证明本任务无该写集与观察对象 | 不建原型、不等 UI 答复 |

P1/P2可并行首判；共享文件受影响时只复跑对应具名用例。
P7固定当前认证工作区，避免旧仓同名命令产生错误读数。
全局材料入口的只读复核命令为
`node tools/cli/run-checks.mjs --workflow-root /Users/Hugh/Hugh/Project/workflowhub-delivery-quality-direction-requirements-20261122 --task-path /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-direction-requirements-20261122`。
它只核当前工作区的材料与任务入口，不证明业务效果或替代各Phase首判。
各Phase卡承接精确argv、参数角色、所读字段和代表性输出的对照；
本spec不另建第二套命令账，定位引用不证明真实调用已发生。
生产入口和公开测试已合入；本任务首卡、正常review record和写集对账
按实存原件取证，缺哪件写哪件，不设置额外供件门。
085的`baseline_commit=d48f657…`是任务登记旧起点，不等于当前HEAD或Phase base；
其`baseline..HEAD`越界枚举含全main，不改元数据或写集求绿。
后续分别核upstream `d48f657…→ad1f8c30`、各Phase真实起点、
工作区既有GLOSSARY及两个simple-review-runner修改的归属。
生产检查若仍只取历史任务基线就保留缺口，手工分离不冒工具已通过。
任何 exit 0 只说明命令结果；业务效果仍须 Appendix A 的观察者结论。
性能没有基线，首用只记录真实耗时，不设置无来源阈值。

## 怎么算通过？

Appendix A 是唯一验收权威；每条都有首判时点、成本、资源和回修。
下文「真跑还是替代」是六件初稿，Phase 作者必须保留同一判据。
测试蓝图可补全真实 argv 与证据指针，但不能自行改变业务对象或强度。

### 验收判据在哪里？

通过、失败和预期证据只在本文件 Appendix A 维护。
正文、Phase、测试蓝图和交接只引用同一 AC，不复制另一套判据。
真实执行结论由独立执行单元写任务事实，不在这份计划预填通过。

### 判定对象怎么与需求对齐？

技术 fixture 只证明检查器能识别坏例，不能替代真实任务消费。
真实首卡、真实变更和任务一供件必须保留原来的业务对象与正常入口。
副本或受控负例只用于证伪；其通过不能冒称真实外部条件已经存在。

### 验收对象是什么？

本任务是纯 CLI 与材料行为，验收对象保留真实工作区、状态和入口。
JSON 是机器可读数据格式；本块是实例，不是执行结果。
三源上下文由测试作者沿下列引用构造，不以本 JSON 自证非 UI。

#### 验收对象

```json
{
  "workspace": "/Users/Hugh/Hugh/Project/workflowhub-delivery-quality-direction-requirements-20261122",
  "state": "命令行材料与定向检查；首卡、真实变更和任务一供件按各AC分别取证",
  "owner": "用户",
  "cli": {
    "command": "node tools/cli/run-checks.mjs --workflow-root /Users/Hugh/Hugh/Project/workflowhub-delivery-quality-direction-requirements-20261122 --task-path /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-direction-requirements-20261122",
    "entry_ref": "project_inventory",
    "sample_ref": "raw_requirement",
    "oracle_ref": "draft_spec"
  }
}
```

`raw_requirement` 指向任务根原始请求及归档 PRD 第44行。
`project_inventory` 指向 build-plan 步骤、当前 AGENTS 目录职责和实际代码入口。
`draft_spec` 指向本 spec、已确认七阶段大纲与 Appendix A。
三源键分别为 raw_requirement、project_inventory、
planned_or_changed_frontend_fact，均须给 ui_scope=false 与真实理由。
验收对象检查本次未执行；真实 spec 发布后由独立执行者运行。
计划落点为 `quality/tests/acceptance-object.input.json`、
`acceptance-object.context.md`、`acceptance-object.output.json` 与实际 capture。
它只证最小结构与引用可解析，不等于环境健康或业务验收。

### 证据计划怎么写？

每条 AC 的六件与三笔账已经包含证据七项的落点。
判什么在目标与关联 FR；怎么判在验证和判定器；来源在资源账。
提供者与时点写在条件及谁判；成本类别在成本账；缺口处理在回修。
证据只保存实际原件，未执行写 incomplete，外部条件缺失写 unavailable。

## 测试计划是什么？

逐条 AC 已给验证层、真实输入、预期和失败信号，Phase 只落实同一设计。
目标 RED 必须由具名断言失败产生；收集、导入和环境失败单独归类。
P2、P3、P4及P5新增检查器行为须先取得目标 RED。
P1方法文字、P5文字部分、P6和P7采用有反例的独立读回，不伪造 RED。
已有用例通过只记本来就通过；P7仍是唯一全AC末验收Phase。

| 需求与验收 | 验证层与数据 | 预期与失败归属 |
| --- | --- | --- |
| R-006／验收 1 | 真实第 9 步候选、问答原件与独立复读 | 真取舍保留；错分回P1方法 |
| R-002/003／验收 2 | 现有合约测试加截句、派生和来源负例 | 同一来源 oracle；坏例未抓到回P2 |
| R-004/009／验收 3、4 | 临时认证任务根、覆盖与终末双扫描 | 非法新增与旧绑定显名；回P3 |
| R-005/009／验收 5、6 | 新旧失效行与真实 supersede 原件 | 兼容与真实改文分开判；回P4/P6 |
| R-007／验收 7 | 同包四样、长答复、未收敛与缺质询反例 | 报告级提示不改退出码；回P5 |
| R-008/012／验收 8、9 | 受阻首卡、同版五件和正常入口 | 缺件不伪接包；当前任务主会话组织材料与入口补证 |
| R-001/010/012／验收 10、11 | 沿途首判、三链行为与抽件负控 | 缺件保持未完成；回原producer |
| R-011／验收 12 | 真实 diff、写集、非目标和三源非 UI 事实 | 越界回对应Phase，不改范围求绿 |

非 UI 三源逐项判断如下，不用调用者标签代替事实。

1. 原始请求：当前 R-001 只要求命令行流程、材料与真实验证；
   其引用归档 PRD 第44行逐字说明无页面、视觉基准或前端设计任务。
2. 项目库存：认证工作区无 `apps/`；现存 `.tsx/.css` 位于文档示例、
   归档样本和测试 fixture，不在本任务读写或观察路径。
   实际 caller 是 Talk、make-decision、CLI checker 与 handoff。
3. 已接受计划：phase-outline 第24行明确无页面、路由、组件或样式改动；
   U-015只许可七阶段正式计划，没有新增 UI 范围。

结论：条件 UI 准备不适用，不建原型，不等待 UI 答复。
若任何 Phase 后来读、驱动或观察页面、路由、组件或样式，立即恢复 UI 方法。

## 有什么风险和未决？

最大风险是形式齐全却效果落空，其次是共享文件覆盖与历史兼容误判。
每个风险都在所属 Phase 首先处理，P7只复核事实与未闭环项。

| 风险 | 触发与后果 | 缓解、回退与验证 |
| --- | --- | --- |
| 风险 1 问题错分 | 事实题送人或真取舍漏问 | 撤P1分诊hunk，保失败问答，重放合法例与坏例 |
| 风险 2 承诺拔高 | 截句或派生变必须，用户未批事项进入AC | 回P2撤严格分支，保旧输出与原话，独立复读 |
| 风险 3 覆盖误判 | 合法新增被挡或漏需求 | 回P2完成版检查，恢复人工覆盖，暂停退役 |
| 风险 4 失效误判 | 旧行报错、邻项误作废或无人接手 | 撤新增读取，保原解析与历史行，重跑新旧例 |
| 风险 5 讨论形式化 | 未收敛先细审、长答复丢失 | 恢复原步骤文本，跨包风险回包，不消缺口 |
| 风险 6 假接包 | 缺件或总确认仍放行首卡 | 撤可接表述，按任务一同版字段重出合同 |
| 风险 7 汇总漂白 | 未发生或不可用被写成已验 | 该行改回真实档位，保原失败并停止完成声明 |
| 风险 8 并发覆盖 | 多writer抢同一路径 | 按本spec顺序交回当前原件，冲突回前writer |
| 风险 9 成本未知 | 多读字段或独立复读超出预期 | 记真实活动成本，不静默砍审查或设假阈值 |

未决项及关闭条件见「还有什么没定？」与 Appendix B。
只有改方向、AC、用户独占阻塞资源或严重风险才停对应路径。

### 补充材料与术语在哪里？

材料导航只作定位，不是第二权威。
需求与决定读 decision-log；原话读需求索引和公共确认。
真实 caller 读「代码锚点」；首改与写序读「接口与失败语义」。
测试输入与判定读 Appendix A；执行结果只读任务 quality 原件。

首判是该包实施和审查回修后第一次真实验收。
同包五件是方案卡、质询、冷读、对抗与真实答复。
首卡是计划作者拿到的第一段可执行工作说明，不是方向方案卡副本。
受阻首卡是缺件诊断产物，不等于可接包，也不等于产品失败。

## Appendix A — 验收判据（唯一权威）

每条承诺都可由实现上下文之外的独立执行单元判定。
下列成本是活动估算，不是实测；失败回修不删除原始失败。

- [ ] **AC-P1-001**：真实第 9 步只向用户呈现真取舍，
  当批四列能被包2、包3和包6按字段与时点消费。
  关联 FR-ASK-001；来源 R-001、R-006与决定 1。
  判定方式：只能人读；判定时点：P1实现与独立审查回修后先记录当时档位及证据缺口；
  P2/P3/P6同批首次读数齐后由原P1读者复验，技术交回不等待该复验完成。
  落点：P1/T001；P7只读回首判，不首次代判。
  目标：证明用户在真实问答中不再回答可查事实，下游找得到答复去向。
  怎么操作：独立读者先取当批候选和实际发卡，再读问答原件与答复索引。
  P2、P3、P6接手者从各自实际入口打开同一批四列，记录读取字段、时点与采用落点；
  P2是后续补证的消费者，不把这次读取变成P2开工前置；
  P3/P6同样可先消费技术增量，实际读数只用于后续原读者复验。
  机器旁证先核卡形状，再核步骤报告：
  `node skills/decision-maker/scripts/validate-card.mjs /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-direction-requirements-20261122/quality/evidence/decision-maker/p01/card.md --json`。
  `node tools/cli/check-stage-steps.mjs --stage=make-decision --task-path /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-direction-requirements-20261122 --material-root /Users/Hugh/Hugh/Project/workflowhub-delivery-quality-direction-requirements-20261122/specs/delivery-quality-direction-requirements-20261122 --json`。
  什么条件：当前任务真实候选、主会话问答批次与已核仓库事实；
  由P1写主和材料主会话提供，缺真实问答则本条 incomplete；
  没有自然发生的真取舍时不为验收制造用户问题。
  真跑还是替代：真实问答与命令都真跑；机器输出只作旁证，不替代读者。
  谁判与证据：未参与P1写作的独立读者读完整批次、实际发卡和原始JSON，
  并读P2/P3/P6同批首次读取原件；未发生的消费保持未验证，不代判其业务结果。
  结论写 `quality/tests/p01-question-routing.readback.md`。
  范围账：只证P1分诊与四列，不把包2/3/6自己的结果当P1承接。
  资源账：复用当前任务候选与既有问答件，不造新平台或持久队列。
  成本账：executor=独立读者；estimate_min=12；hard_cap_min=24；
    resources=真实候选、问答批次、仓库事实、卡校验与步骤检查器；
    observation=实际发卡、四列与下游读取时点；retry_cap=0；evidence_tier=语义原件级。
  资源来源：P1写主提供实际入口，材料主会话提供唯一问答原件。
  为什么不能再简：只看步骤JSON无法发现同动作假选择或自动作业误配。
验证：ORACLE-QUESTION-ROUTING 对照候选分类、选项后续动作、真实答复和四列；
  故意把“某文件在哪”送用户，或把“只看状态”写成自动处理，必须失败。
  以指向错误批次的落点作负控；受控遮住一个落点时，相关读取报告缺口，
  其余读取继续，不能用另一批次的成功读取掩盖同批交接缺口。
通过：可查事实被实际查证，真取舍有不同后续动作并得到真实答复；
  四列及包2/3/6读取字段、时点可回读，未答不冒已交接。
失败：事实题仍问人、同动作仍提问、缺落点、未交接冒未答、
  状态展示冒自动处理，或只有命令退出而读者无法指出真实消费。
证据：真实批次、聊天原件、答复索引、命令原件、P2/P3/P6同批读取原件、
  错批与遮蔽落点负控、独立首判记录。
  失败回修：回P1原写主修分诊或第9步说明；保留失败问答，
  重放原坏例和合法真取舍；若需改方向或问题类型定义则停该路径回决定人。

- [ ] **AC-P2-001**：决定块中的四种承诺都能回读完整原话，
  派生和被否方案分列，截句或身份、语气错误会被识别。
  关联 FR-COMMIT-001、FR-ORIGIN-001；来源 R-002、R-003与决定 2。
  判定方式：只能人读；判定时点：P2实现与独立审查回修后立即首判。
  落点：P2/T002；机器合约与独立语义对照共同成立。
  目标：证明用户能认出自己的承诺，建议不会被升级成要求。
  怎么操作：先跑同一合约命令，再由独立读者对照问题、完整答复和决定块。
  `npx --no-install vitest run tests/contract/decision-evidence-consumption.test.mjs -t "reads mapped 决定 N blocks at h3/h4 and checks their tone|承重承诺|需索引指针" --no-cache --reporter=verbose`。
  真实材料再经公开入口复核：
  `node tools/cli/check-decision-log-chain.mjs --file specs/delivery-quality-direction-requirements-20261122/decision-log.md --source-root /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-direction-requirements-20261122`。
  什么条件：唯一开工索引为`18d9115e…f5b`，与当前日志认证声明一致；
  旧指纹只作历史。决定块和旧编号映射由材料主会话提供；
  缺真实决定正文或来源时不得用空索引行求绿。
  真跑还是替代：合约真跑，语气与截句语义由人读；两者不可互相替代。
  谁判与证据：独立测试执行者保存命令，另一未参与读者核完整原句；
  结论写 `quality/tests/p02-real-source.readback.md`。
  范围账：只证P2来源与承诺，不把P6真实首卡当本Phase交付。
  资源账：复用当前索引、公共确认和历史阈值坏例，不改索引求绿。
  成本账：executor=独立测试执行者与读者；estimate_min=18；hard_cap_min=36；
    resources=当前索引、决定块、原始答复、目标合约测试；
    observation=具名机器错误与原句语义对照；retry_cap=0；evidence_tier=命令与语义原件级。
  资源来源：材料主会话给真实决定块，测试作者给可重放负例。
  为什么不能再简：连续字符串匹配不能发现删掉限定语后的语义拔高。
验证：ORACLE-COMMITMENT-SOURCE 要求必须、允许、本次不做有用户原话，
  待定关联未答、负责人和恢复条件；派生进入承诺须另有批准者与时点；
  错锚、非连续原文或声称完整却对不上选定原件者，由机器目标断言先RED、实施后以同断言取GREEN；
  仍连续但删除限定语、抬高承诺强度者，由独立人判且必须判失败，不要求生成机器目标RED；
  派生冒用户由机器核来源分级及来源三字段，身份与语境由独立人判，两类证据不得互替。
通过：四态、身份、语气、连续原文与完整语境一致，被否方案仍在原位置；
  无决定条目、无来源和假映射均被显名。
失败：建议或阈值冒批准、语气抬高、限定语丢失、无来源承诺、
  第五态出现，或目标用例未真正执行却被当作验证。
证据：`quality/tests/p02-commitment.red.output`、
  `quality/tests/p02-commitment.green.output`、真实链输出、
  当前决定块、完整原话与 `quality/tests/p02-real-source.readback.md`。
  失败回修：机器读取问题回P2检查器写主，材料问题回材料主会话；
  修后只重跑受影响用例和原坏例，不改需求索引或断言求绿。

- [ ] **AC-P3-001**：未答只限制绑定的验收，需求与验收双向覆盖，
  非法新增和无规格空对账均被明确识别。
  关联 FR-COVER-001；来源 R-004与决定 3。
  判定方式：只能人读；判定时点：P2交回后先判通用合约，真实材料在绑定闭环后补判。
  落点：P3/T003；绑定未闭环只保留真实材料首判缺口，不停止通用实施、合约或P4技术交回。
  目标：证明真实阻塞不被删除，无关验收也不被同一未答拖住。
  怎么操作：先在P2交回版本冻结并执行通用正反例，再做真实链复核。
  P3现有写主只在既有允许覆盖件路径内把题名改为可识别“覆盖矩阵”，
  经现有入口重获签名；runner不写，旧题名保留失败对照。
  包3绑定只用于真实材料首判，不是通用实现或测试的开工许可。
  `node skills/decision-maker/scripts/validate-card.mjs /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-direction-requirements-20261122/quality/evidence/decision-maker/p03/card.md --bind --package /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-direction-requirements-20261122/quality/evidence/decision-maker/p03`。
  `npx --no-install vitest run tests/contract/decision-evidence-consumption.test.mjs -t "^P03 coverage " --no-cache --reporter=verbose`。
  `npx --no-install vitest run tests/contract/final-chain-runner.test.mjs -t "^P03 final chain " --no-cache --reporter=verbose`。
  `node tools/cli/check-decision-log-chain.mjs --file specs/delivery-quality-direction-requirements-20261122/decision-log.md --source-root /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-direction-requirements-20261122`。
  什么条件：通用面只需P2交回共享文件与临时认证任务根fixture；
  真实材料面另需质量负责人核当前包3卡、真实答复与绑定输出。
  fixture 由同一测试进程创建和清理；绑定缺口不抹掉通用技术结果，也不冒真实首判。
  真跑还是替代：新链检查行为以同一断言取目标RED/GREEN；
  现有final-chain-runner只补合法当前输入与过期输入的入口对照，
  已成立行为记本来就通过，不伪造目标RED；弱化替换与同源重复由独立读者补判。
  谁判与证据：独立测试执行者在两命令后保存原始输出，
  独立读者写 `quality/tests/p03-coverage.readback.md`。
  范围账：只证P3覆盖与未答限界；任务五最终存在性不在本包承接。
  资源账：复用现有索引、覆盖件、链检查与终末扫描，不建第二差集。
  成本账：executor=独立测试执行者与读者；estimate_min=20；hard_cap_min=40；
    resources=P2交回版本、绑定输出、临时认证任务根、覆盖矩阵；
    observation=未答两面、非法新增、无spec与终末扫描结果；retry_cap=0；evidence_tier=命令与语义原件级。
  资源来源：包3写主提供fixture，材料主会话提供唯一覆盖件。
  为什么不能再简：编号对账无法判合法新增、语义弱化或无关AC被误限。
验证：ORACLE-BIDIRECTIONAL-COVERAGE 要求合法新增有真实承诺、批准者、
  影响和不可替代理由；ORACLE-FINAL-COVERAGE-SCAN 核需求索引与覆盖矩阵双扫描。
  旧覆盖题名必须让终末保持覆盖缺口；更新后的decision-log `--file`单扫
  不得掩盖终末未读到覆盖件，也不得以runner已有代码冒新证据。
  删除确认件、删需求落点、加入无依据AC与无spec分别显名。
  错绑对照保持问题与两个有效AC编号不变，只把指针换到无关项；
  独立读者从原承诺指出实际依赖，真正受阻项不得因形式绑定有效而被隐藏。
通过：绑定未答只使对应AC受限，无绑定未答保留owner与恢复；
  双向覆盖可读，合法新增可解释，无spec编号对账明确 unavailable。
失败：无关AC被限制、真实阻塞被删、非法新增通过、空集合冒已算差集、
  旧覆盖标题或旧checker指纹被当当前证据，或弱化替换未被发现。
证据：`quality/tests/p03-coverage.red.output`、
  `quality/tests/p03-coverage.green.output`、`quality/tests/p03-final-chain.output`、
  绑定原件、覆盖件新题名与签名、旧题名失败对照、错绑语义对照及
  `quality/tests/p03-coverage.readback.md`。
  失败回修：解析问题回P3写主，绑定问题回质量负责人；
  需要改方案或AC则回决定人，其它包继续。

- [ ] **AC-P3-002**：第二差集只登记不建，重复人工对账只在替代可核后退出。
  关联 FR-RETIRE-001；来源 R-009与决定 3。
  判定方式：只能人读；判定时点：P3实现与审查回修后首判。
  落点：P3/T003；与验收 3共用真实替代证据。
  目标：证明减少的是重复维护，而不是把退役声明当成删除事实。
  怎么操作：独立读者核现役对象、真实diff、替代正负例和不建登记；
  另在既有记录定位实际人工动作、执行者、调用时点与恢复位置，
  用同一坏例对照该动作和替代检查，不用泛称“重复人工对账”代替对象。
  辅助命令沿用验收 3的两条具名合约，不新增扫描器。
  什么条件：不建第二工具可由真实diff独立判；实际人工退役另需动作原件与等价证据。
  找不到现行动作或等价证据时保留人工核对，只判不建第二工具；历史归档只读。
  真跑还是替代：真实diff与合约真跑，退役语义由人读。
  谁判与证据：未参与P3的读者在同一首判时点写退役段，
  落 `quality/tests/p03-coverage.readback.md`。
  范围账：只判第二差集和重复人工覆盖，不判包4人工失效标记退役。
  资源账：现有caller、git diff与验收 3证据，无新增工具。
  成本账：executor=独立读者；estimate_min=8；hard_cap_min=16；
    resources=现役caller、真实diff、不建登记、替代负例；
    observation=保留/不建理由与消费者可核行为；retry_cap=0；evidence_tier=语义原件级。
  资源来源：P3写主与材料主会话提供真实路径和决定位置。
  为什么不能再简：静态搜索没有命中不能证明没有动态消费者。
验证：ORACLE-P3-CONTROLLED-RETIREMENT 先列现役`reconcileAcs`及终末caller，
  再核新增能力是否唯一；故意加入第二个差集命令或提前删除人工覆盖，必须失败。
  没有实际人工动作、执行者、时点及恢复位置的原件时，不作该动作已退役结论。
通过：第二差集没有成为新维护面，现役对账保留，
  替代能抓同一坏例后才停止对应重复人工步骤。
失败：虚构删除现役工具、留下无消费者新工具、替代不可读或提前退役。
证据：真实diff、caller清单、不建登记、替代负例首判，以及实际人工动作与等价证据；
  后两者未取得时明确保留人工核对。
  失败回修：回P3写主撤新增工具或恢复人工核对，保原失败并定向复验。

- [ ] **AC-P4-001**：旧失效行仍可读且待重做，新行补责任与影响信息，
  缺字段只提示且不改变既有退出语义。
  关联 FR-CHANGE-001、FR-RETIRE-001；来源 R-003、R-005、R-009与决定 4。
  判定方式：机器可判；判定时点：P4在任务一同版上实现与审查回修后首判。
  落点：P4/T004；真实变更效果另由验收 6判定。
  目标：证明增加责任信息不会误伤历史行或扩大失效范围。
  怎么操作：在当前HEAD合并版本上运行具名合约并核旧行、缺字段和邻项。
  `npx --no-install vitest run tests/contract/check-stage-steps.test.mjs -t "invalidated line fields" --no-cache --reporter=verbose`。
  什么条件：共享checker已随`05c07332`合入当前HEAD；
  P4仍须实读当前checker/test与P1/P3技术交回，P4/P5前置共享版本并不相等。
  合入不证明任一Phase首判；具体同版输入不可读时只将该面记unavailable。
  真跑还是替代：同一命令真跑目标RED/GREEN；环境或收集失败不算目标RED。
  谁判与证据：独立测试执行者保存输出并核报告，
  结果写 `quality/tests/p04-invalidated.green.output`。
  随后在所属Phase既有交接段交回检查器、测试和方法版本供P5持笔；
  技术交回不冒称P4整阶段或AC-P4-002真实事件已完成。
  范围账：只证P4解析、报告和兼容，不用fixture冒真实变更已发生。
  资源账：复用c06旧行形状、现有步骤报告和合约测试，不建依赖图。
  成本账：executor=独立测试执行者；estimate_min=20；hard_cap_min=40；
    resources=任务一同版checker、旧/新失效行fixture、目标合约；
    observation=旧行待重做、缺字段提示与邻项保持；retry_cap=0；evidence_tier=命令级。
  资源来源：P4写主提供fixture，当前HEAD提供共享版本，主会话组织同版核读。
  为什么不能再简：只测新行会漏掉历史兼容与邻项误作废。
验证：ORACLE-INVALIDATED-LINE-FIELDS 要求阶段和重做范围置于新字段前，
  字段值不混用分隔符；c06旧行、缺接手人、漏标与邻项反例分别读取。
  删除新行“标注人”而不报缺口时，目标断言必须失败。
通过：旧行不抛错且仍待重做；新行的标注人、修改权、理由、新依据、
受影响位置与接手人可读；缺字段进入报告而不改退出语义，人工标记未提前退役。
失败：旧行判坏或判回完成、未知阶段被跨阶段推断、邻项误作废、
  新增自动推导、第二变更账本或任务一未交付却伪报验证。
证据：`quality/tests/p04-invalidated.red.output`、
  `quality/tests/p04-invalidated.green.output`、旧新行输入与报告JSON。
  失败回修：回P4原写主撤新增读取或修解析，保留旧字段和失败；
  重跑同一新旧例，不改历史行或测试期望求绿。

- [ ] **AC-P4-002**：首次真实方向变更后，受影响首卡被实际阅读并修改，
  新旧决定、失效责任与改文能逐件回读。
  关联 FR-CHANGE-001；来源 R-002、R-005与决定 4。
  判定方式：只能人读；判定时点：首次真实supersede发生后由P4/P6联合首判。
  落点：P4/T004供失效内容，P6/T006供实际首卡改文。
  目标：证明变更被下游接手，而非只改状态或标签。
  怎么操作：独立计划作者先从旧新决定独立列出全部受影响位置，
  再逐处对照失效行、接手人和实际改文，不以可能漏标的失效行定义完整影响集合。
  独立读者按变更前原件、失效行、改文和真实答复顺序复读。
  公开入口辅助命令为
  `node tools/cli/check-stage-steps.mjs --stage=make-decision --task-path=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-direction-requirements-20261122 --material-root=/Users/Hugh/Hugh/Project/workflowhub-delivery-quality-direction-requirements-20261122/specs/delivery-quality-direction-requirements-20261122 --json`。
  什么条件：真实用户变更尚未发生；当前为 unavailable，
  owner=当前任务主会话持续组织复验，恢复条件是真实supersede在本任务正常工作中发生；
  未发生即保持未验，不制造事件或转嫁责任。
  真跑还是替代：必须真实事件与真实改文；合成fixture只能证验收 5，不能代本条。
  谁判与证据：未参与变更实施的独立读者在改文后判定，
  结论写 `quality/tests/p04-real-change.readback.md`。
  范围账：只证这次真实变更的下游接手，不扩成自动推导或长期能力。
  资源账：需要真实旧新决定、修改权、新依据、失效行和首卡版本，不能就地伪造。
  成本账：executor=独立计划作者与读者；estimate_min=25；hard_cap_min=50；
    resources=真实supersede、失效行、首卡前后字节与实读记录；
    observation=受影响内容实际改变且邻项保留；retry_cap=0；evidence_tier=真实原件级。
  资源来源：真实变更发起人和材料主会话提供原件，P6作者提供改文。
  为什么不能再简：标签和步骤状态不能证明下一位理解并调整了工作。
验证：ORACLE-REAL-CHANGE-HANDOFF 要求实读与改文同时存在；
  抽掉任一原件，本条必须保持未完成；故意把相邻有效项一并作废，读者必须指出。
  多落点对照只漏第二处改文时也必须指出；受控对照可验证判法，
  但不能代替真实多落点事件及其实际改文。
通过：旧决定、修改权、理由、新依据、新旧关系和接手人完整；
  受影响首卡实际改变，邻项保留，实读与改文可回读。
失败：只有失效字段或步骤状态、无人接手、漏标、邻项误作废、
  用合成变更冒首次真实事件，或没有真实首卡改文。
证据：真实答复、旧新决定、变更记录、失效行、逐落点实读与首卡改文；
  另存只漏第二处的受控对照，且不把它当真实事件。
  失败回修：材料缺项回材料主会话，首卡未改回P6独立作者；
  若未发生就保缺口，不为验证制造方向变化。

- [ ] **AC-P5-001**：同包当场完成展示、质询、冷读、对抗与真实答复，
  答复全集保留，未收敛包不能先整体细审。
  关联 FR-DISCUSS-001；来源 R-001、R-007与决定 5。
  判定方式：只能人读；判定时点：P5实现与审查回修后立即首判。
  落点：P5/T005；缺质询机器提示与完整语义共同核对。
  目标：证明讨论发生在该包实际收敛时，长答复和跨包风险不丢。
  怎么操作：回放同包顺序并运行现有P5及新增“全收敛”“只缺质询”用例。
  另从第12/13步实际读取结果定位第15个物理行之后的有效内容；
  只打开完整文件对照，不能证明这两个步骤实际越过了旧读取边界。
  `npx --no-install vitest run tests/contract/decision-evidence-consumption.test.mjs -t "P5 stage-steps evidence gaps" --no-cache --reporter=verbose`。
  再跑基线与P4交回后的步骤检查器，观察全文、缺质询报告与未收敛失败。
  `node skills/spec-plan/scripts/build-decision-baseline.mjs --decision-log specs/delivery-quality-direction-requirements-20261122/decision-log.md --reply-index /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-direction-requirements-20261122/quality/evidence/decision-log-refs/requirement-index.md`。
  什么条件：P4已交回共享文件，任务一checker和默认卡代码已合入；
  P5自身同版首判与P4版本不互代，旧第9/11步义务仍待证。
  真实长答复U-005只证语境与全文，不证明超过14个物理行。
  材料主会话另供超过14个物理行的真实答复；未取得则该边界未验证，
  受控长行样本只补回归，不冒充真实读回。
  main没有程序化在途时序选择器，裸包号或轮次不作依据；
  仅沿同版原记录人工核时序，不能确认就停对应共享切换并记unknown。
  真跑还是替代：合约与步骤命令真跑；顺序、旧答复适用和长答复由人读。
  谁判与证据：未参与P5的独立读者读同包五件与完整答复索引，
  结论写 `quality/tests/p05-full-reply.readback.md`。
  改后第一次真实新工作的输入、实际消费者和业务结果由本次P5实际使用原件产生；
  当前任务主会话主动安排正当新工作场景，不把本任务旧记录改名充数。
  没有真实对象即保持未验且不转给任务三；P7只读引用，
  当前任务旧答复或后补首卡不能顶替。
  范围账：只证P5同包过程，不替代包6真实首卡或任务一行为。
  资源账：复用当前问答、卡、冷读、对抗与答复索引，不建收敛清单副本。
  成本账：executor=独立测试执行者与读者；estimate_min=20；hard_cap_min=40；
    resources=同包五件、真实U-005长答复、未收敛与缺质询fixture、同版checker；
    observation=包内顺序、答复全集与报告级缺口；retry_cap=0；evidence_tier=命令与语义原件级。
  资源来源：材料主会话提供同包原件，P5写主提供受控负例。
  为什么不能再简：机器不读全部语义，单看报告无法发现旧答复误用。
验证：ORACLE-MD-005 核收敛顺序与报告级质询缺口，
  ORACLE-FULL-REPLY-READBACK 核 U-005 全文及跨包回包。
  故意留下未收敛包再启动整体细审，或删去长答复尾部，
  或把旧答复用于不同对象，或让跨包风险不回原包，均必须失败。
  受控负向在第14个物理行之后放有效内容；第12/13步实际读取若仍截断须指出。
  途中旧任务从旧第9步继续到收口的对照须保原义务，不因新时序重问或漏问。
  仅缺本任务讨论报告槽且五件原件及绑定合法时，报告须具名并正常退出；
  任务一五件声明引用的质询原件缺失或错绑仍是原硬失败非零，
  不得并入报告级提示，也不得为统一退出而改写原反例。
通过：同包四样和真实答复在同批可回读，第11步不再重问全包，
  第12/13步读全集，第14步展示未覆盖与已答，缺质询只作报告级提示。
失败：质询后置、未收敛先审、长答复消失、总确认代包答复、
  旧答复误用、跨包风险未回包，或把跳过用例当已执行。
证据：同包五件、U-005答复全集、
  `quality/tests/p05-discussion.red.output`、
  `quality/tests/p05-discussion.green.output`、
  `quality/tests/p05-baseline.output`、超过14物理行的真实读取或具名缺口、
  改后第一次真实新工作实际使用原件、旧第9步继续到收口的兼容对照、
  报告槽正常退出与质询缺件/错绑硬失败对照、
  `quality/tests/p05-full-reply.readback.md`。
  失败回修：回P5原写主修步骤或提示，材料缺件回原生产者；
  不改变退出码求绿，需要新步骤或确认点时停并回决定人。

- [ ] **AC-P6-001**：在最终入口供件未到前，独立计划作者能写出真实受阻首卡，
  明确缺件、责任人与复验条件，不把它写成可接包。
  关联 FR-CARD-001、FR-ORIGIN-001；来源 R-002、R-008与决定 6。
  判定方式：只能人读；判定时点：P6早期切片完成后立即首判。
  落点：P6/T006；产物为 `quality/evidence/build-plan/first-card.md` 初版。
  目标：证明缺件能转化为可执行恢复，而不是沉默、假接包或回问方向。
  怎么操作：未参与本包写作的作者先核既有方向交接合同中的逐件输入、
  生产者、版本引用、消费者与缺件诊断，再读当前包2卡、冷读、对抗与公共确认，
  写首卡开头和缺件诊断；对照样例只供负控，不冒充真实供件。
  什么条件：当前真实原件可读；缺质询与包级真实答复如实列出；
  U-014只作整体方向，不能代替包级答复。
  真跑还是替代：真实材料试写与独立复读；不是正常最终入口的替代通过。
  谁判与证据：主会话在P2切片前指定独立作者，质量owner指定不同读者；
  结论写 `quality/tests/p06-blocked-first-card.readback.md`。
  范围账：只证受阻首卡，不证任务一入口、最终五件齐或长期计划规则。
  资源账：复用现有p02原件与公共确认，缺件不伪造、不造AC。
  成本账：executor=独立计划作者与读者；estimate_min=10；hard_cap_min=20；
    resources=当前卡、冷读、对抗、公共确认与缺件诊断协议；
    observation=受阻结论、缺件类别、责任人和复验条件；retry_cap=0；evidence_tier=真实原件级。
  资源来源：材料主会话提供原件，质量负责人提供独立身份。
  为什么不能再简：只写缺件清单不能证明计划作者能形成可恢复的首卡。
验证：ORACLE-FIRST-CARD-FIVE-PARTS 核已能确定的首卡内容与受阻边界；
  故意把U-014或“确认七包骨架”当包级答复并写“五件齐、可接包”，必须失败；
  删除责任人或复验条件，读者也必须指出。
  同源历史对象没有验收编号时，必须点名需求、缺口和恢复责任人；
  写成不适用或自造编号必须被拒绝，当前真实首卡正例不变。
通过：首卡如实受阻，五要素中已能确定的内容有来源，
  每个缺件写类别、责任人和复验条件，已定方向未被重问。
失败：受阻被写成可接或产品失败、缺件诊断不全、样例冒验收、
  总确认代卡、虚构来源或仍回问已定方向。
证据：首卡初版、所读原件清单、同源旧对象无验收编号对照、真实缺口与
  `quality/tests/p06-blocked-first-card.readback.md`。
  失败回修：回P6独立作者修首卡，材料错配回材料主会话；
  若需改变首卡产品范围则回决定人，其它Phase继续。

- [ ] **AC-P6-002**：任务一同包入口与本任务同版五件就绪后，
  独立计划作者从正常入口形成最终真实首卡且不回问已定方向。
  关联 FR-CARD-001、FR-SUPPLY-001；来源 R-008、R-012与决定 6。
  判定方式：只能人读；判定时点：P1/P3/P4技术交回、P5接入、
  已合入生产入口上的本任务同版行为产生后。
  落点：P6/T006；P7只消费最终首卡和独立回读。
  目标：证明下一位能从真实答复独立开工，而非从样例或总确认猜工作。
  怎么操作：从 `workflows/build-plan/SKILL.md` 第1步及
  `workflows/build-plan/steps.json:8` 的生产入口接包，
  独立计划作者人工逐件读方案卡、质询、冷读、对抗和真实答复，
  核同任务、包号、讨论批次、当前卡节及sha256，再更新同一首卡。
  最终首卡判定前保存本入口对P1当批四列的首次实际读数并交原P1读者；
  正常接包使用P1技术增量，不等待P1最终验收通过。
  下列公开测试和baseline只作旁证，不代替人工阅读或首卡产生。
  `npx --no-install vitest run tests/contract/package-material-consumption.test.mjs -t "^ORACLE-SAME-PACKAGE public material consumption" --no-cache --reporter=verbose`。
  `node skills/spec-plan/scripts/build-decision-baseline.mjs --decision-log specs/delivery-quality-direction-requirements-20261122/decision-log.md --reply-index /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-direction-requirements-20261122/quality/evidence/decision-log-refs/requirement-index.md`。
  什么条件：生产入口已含在当前HEAD`ad1f8c30`，无需重复建设；
  本任务同版五件中的真实质询、逐包答复、卡节指纹及最终独立首卡仍待证。
  当前任务正常入口实际调用的argv/cwd/exit/output尚未产生，
  owner=当前任务主会话组织材料角色与独立计划作者；只按真实同版行为恢复，
  不设置额外供件门，也不转移闭环责任。
  真跑还是替代：生产入口、人工五件阅读和首卡必须真跑；
  公开测试与baseline均只作旁证，不证明入口消费或独立首卡效果。
  谁判与证据：独立计划作者写卡，另一独立读者核版本、原话和五要素；
  结论更新 `quality/tests/p06-final-first-card.readback.md`。
  范围账：只证本次真实接卡，不证任务三长期入口或施工卡规则。
  资源账：复用已合入生产入口，另需本任务同版五件与独立作者；
  不能用测试fixture、自造入口或任务一报告代替真实首卡。
  成本账：executor=独立计划作者与读者；estimate_min=25；hard_cap_min=50；
    resources=已合入生产入口、同版五件、包级答复、旁证CLI；
    observation=正常入口消费、五要素和回问分类；retry_cap=0；evidence_tier=真实原件级。
  资源来源：当前任务只读复用已合入入口；主会话组织材料角色供五件、
  质量角色安排独立读者，不把任一分工当外部责任。
  为什么不能再简：受阻首卡和基线成功都不能证明正常入口真实可接。
验证：ORACLE-SAME-PACKAGE 核同包同版与错包、缺件、异版负控；
  总确认代卡必须受阻；ORACLE-FIRST-CARD-FIVE-PARTS 核首卡实质内容和回问分类。
  塞入无真实决定正文的索引行即使使命令成功，也必须判失败。
  同源历史对象缺验收编号时仍须点名需求、缺口和恢复责任人；
  不适用或自造编号不得因正常入口其它字段齐全而放行。
通过：正常入口读到同版五件和本包真实答复，首卡写全五要素；
  查代码、补外部件和新取舍被正确区分，已定方向没有重问。
失败：缺件仍放行、错包或异版通过、基线假绿被当接包、
  真实首卡字节或独立回读缺失、任务一供件未到却宣称完成。
证据：入口输出、五件与版本、最终首卡、P1当批四列首次实际读数、
  同包公开测试与基线原件、同源旧对象无验收编号对照及
  `quality/tests/p06-final-first-card.readback.md`。
  失败回修：当前任务主会话组织定位已合入入口的本任务调用、五件和首卡问题；
  材料错配回任务内材料角色，首卡回P6作者，不转交任务一或其它外部owner。
  当前缺件只停本条及依赖它的整链，不拖垮验收 8或其它包。

- [ ] **AC-P7-001**：最终交接逐包引用首判、负控和覆盖限制，
  独立验证者能从真实答复读到首卡，抽件会保持整链未完成。
  关联 FR-EVIDENCE-001；来源 R-001、R-010与决定 7。
  判定方式：只能人读；判定时点：P6最终首判及其余首判到齐后。
  落点：P7/T007，是唯一全AC末验收Phase；不首次代判上游AC。
  目标：证明用户拿到能打开、能分辨已验与未发生的交接。
  怎么操作：独立验证者选一条真实答复串读决定、覆盖、五件和首卡，
  再逐包打开首判，并读取P5验收7产生的改后第一次真实新工作实际使用原件。
  分别抽走首判、真实变更或负控；另屏蔽一件已由AC-P7-002核过的任务一行为原件，
  交接须点名对应链和缺口，保留原首判，不重跑任务一。
  辅助命令为
  `node tools/cli/run-checks.mjs --workflow-root /Users/Hugh/Hugh/Project/workflowhub-delivery-quality-direction-requirements-20261122 --task-path /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-direction-requirements-20261122`。
  `node tools/cli/check-stage-steps.mjs --stage=make-decision --task-path=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-direction-requirements-20261122 --material-root=/Users/Hugh/Hugh/Project/workflowhub-delivery-quality-direction-requirements-20261122/specs/delivery-quality-direction-requirements-20261122 --json`。
  什么条件：P1–P6首判、真实首卡与P5真实新工作实际使用原件；
  P5原件、首次真实变更或任务二授权行为未产生时，只保留对应整链缺口，不在末端补造。
  真跑还是替代：真实原件串读和抽件负控；只读聚合不冒端到端重跑。
  谁判与证据：质量负责人指定未参与任何包实施的验证者，
  在最终交接发布前判定，结果写既有交接与
  `quality/tests/p07-final-acceptance.readback.md`。
  范围账：只汇总已有首判和必要未闭环项，不补做上游验证或全量测试。
  资源账：复用各包原始证据、真实首卡和现有handoff，不建汇总平台。
  成本账：executor=独立验证者；estimate_min=20；hard_cap_min=40；
    resources=真实答复、P1–P6首判、最终首卡、负控与现有CLI；
    observation=可打开链路、缺件点名和停止汇报；retry_cap=0；evidence_tier=真实原件级。
  资源来源：各Phase owner交首判，P6交首卡，主会话交当前handoff。
  为什么不能再简：单个最终链报告没有包维度，exit 0不能发现漂白。
验证：ORACLE-CHAIN-EVIDENCE-COMPLETENESS 要求抽走任一包首判、
  已验任务一行为原件或负控时，整链必须点名对应缺件；
  负控通过屏蔽读取实现，不删除原文件。把真实变更、真实首卡标成未发生以外的已验，必须失败。
通过：历史坏例、真实新任务和反例分别可定位；逐包首判与限制可读；
  停止汇报有大白话进度、下一步和可打开交接路径，长期缺口仍保留。
失败：末端补签冒首判、回执冒行为、缺件仍称整链完成、
  抽件不改变结论、全量重跑替代阅读或停止汇报要素缺失。
证据：各包首判指针、P5真实新工作原件、串读记录、抽件与任务一屏蔽负控、
  当前handoff与 `quality/tests/p07-final-acceptance.readback.md`。
  失败回修：缺哪件回原producer，交接漂白回P7主会话；
  不在P7重修所有包，缺真实事件保持真实缺口。

- [ ] **AC-P7-002**：任务一同包接卡、效果问题与阶段写集三条链
  都以正常入口正负例和行为原件进入联合验收。
  关联 FR-SUPPLY-001；来源 R-012与决定 6、7。
  判定方式：只能人读；判定时点：P7整链确认前，
  当前HEAD与任务一最终报告可读且任务二正常入口实际取证后。
  落点：P7/T007；同包链也供验收 9，其它两链不阻塞P1–P5。
  目标：证明前置质量看的是实际行为，不是测试回执或捕获回执。
  怎么操作：同包链从已合入生产入口核错包/缺件与同版五件；
  任务一报告的验收1未达成及外部缺口例外只作限制，不写成通过。
  效果链只读任务二授权实施中正常`review-record-route`产生的最终`result_ref`，
  对照方向与细节请求的合法lens、findings及discarded_facts，
  确认效果问题实际送达并进入最终记录，测试清单或任务一报告不代此记录。
  写集链复用`phaseReviewChangeScope`与`reconcileWriteSetDiff`唯一对账，
  取当前Phase匹配的`base_head`和裁剪前`changeScope.changed_paths`，
  再读`contract_facts.write_set_reconciliation`；不建第二对账。
  什么条件：当前HEAD已含任务一，归档报告为9达成、1未完成、2未达成；
  验收7无真实风险接受，验收1/10外部缺口例外都不是任务二通过。
  任务二正常review record、当前Phase base_head及裁剪前changeScope按实存原件取；
  受限读域、缺base_head或Git采集失败只记unavailable，不扩域、不造空差异。
  真跑还是替代：复用已合入能力和任务二正常授权行为；
  不重跑任务一全链，不补造review record、对账或真实风险接受。
  谁判与证据：P7独立验证者在最终交接前逐链写结论和原件路径，
  汇总到 `quality/tests/p07-final-acceptance.readback.md`。
  范围账：只证任务一三链供件，不把任务一所有开发范围并入任务二。
  资源账：复用当前HEAD、任务一归档报告713–738最终账、
  任务二正常review record与现有写集对账；不能用fixture或旧摘要替代。
  成本账：executor=独立验证者；estimate_min=20；hard_cap_min=40；
    resources=当前HEAD、任务一最终报告、任务二正常review record、Phase对账与真实argv；
    observation=错包/缺件、指令送达与写集对账的实际差别；retry_cap=0；evidence_tier=真实环境级。
  资源来源：任务一归档报告只作只读历史来源；当前任务主会话组织本任务producer
  产生正常行为，独立验证者只读当前原件，主会话负责闭环到底。
  为什么不能再简：回执存在不能证明消费者实际读到或行为发生变化。
验证：ORACLE-P7-TASK-ONE-BEHAVIOR 要求删除效果问题指令、
  移除写集所需参数、传入错包或缺件时，对应行为必须可辨；
  只交一份成功回执必须失败。
  方向或细节未送达、最终result_ref缺失时效果保持未验证；
  写集缺base_head、裁剪前范围或受限读域时保持unavailable，
  不用裁剪后diff、085旧任务基线或手工扩域代替现有对账。
通过：三条链分别有正常入口正例、负例和行为原件，
  状态按实写入交接，缺件只影响本条及依赖它的整链。
失败：任一链只有回执、负控无差别、跨树借未提交字节、
  缺参仍称可用，或任务一未交付却判本条通过。
证据：任务一归档报告713–738、当前生产入口、任务二正常review `result_ref`、
  当前Phase base_head与裁剪前changeScope对账、真实argv/cwd/exit/output及独立结论。
  失败回修：任务一历史报告只读且不作责任转移；当前任务主会话组织本任务
  入口、review或对账producer修复，保留真实缺口，不改历史或唯一对账实现。

- [ ] **AC-P7-003**：真实改动没有越过精确写集和已接受非目标，
  非 UI 三源结论与实际消费者保持一致。
  关联 FR-SCOPE-001；来源 R-011与决定 1–7。
  判定方式：只能人读；判定时点：P7最终范围复核。
  落点：P7/T007；各Phase先自核，本条款只作最终独立复核。
  目标：证明没有借实施新增第二控制面、页面工作或无人消费机制。
  怎么操作：独立读者分别列upstream `d48f657…→ad1f8c30`、
  各Phase真实`base_head`范围及既有GLOSSARY和两个simple-review-runner修改归属。
  再读取真实 `git diff --name-only`与现有capture中的完整相关补丁，
  逐路径对照全局写集并检查允许文件内新增公共行为。
  085旧登记任务基准产生的全main越界清单保持事实，不改元数据或写集求绿；
  手工分离只解释范围，不把仍取旧基线的生产检查写成通过。
  材料主会话从既有任务根写入回执与原件记录提供实际外置写入清单，
  与允许的固定路径和动态producer逐项对照，包括P7自身只读证据；
  缺外置写入证据时范围保持unknown，不新建第二账。
  什么条件：主会话提供真实实施起终点与完整未裁剪diff；
  环境或历史不可读处记 unknown，不按缺失推断合规。
  真跑还是替代：真实git输出与原文复读；不用文件数量或目录快照代替。
  谁判与证据：未参与实施的读者在P7写范围结论，
  证据汇入 `quality/tests/p07-final-acceptance.readback.md`。
  范围账：只核本任务实际变化与声明边界，不审无关历史或全仓架构。
  资源账：复用完整相关补丁、现有capture、任务根写入回执、当前spec和真实caller；
  不建目录快照、外置写入镜像或范围扫描平台。
  成本账：executor=独立读者；estimate_min=4；hard_cap_min=8；
    resources=完整相关补丁、任务根回执、精确写集、非目标、非UI三源与caller；
    observation=逐路径归属与新增公共行为检查；retry_cap=0；evidence_tier=语义原件级。
  资源来源：主会话给起终点，各Phase writer解释真实路径。
  为什么不能再简：文件存在或测试绿不能发现越界与第二控制面。
验证：ORACLE-P7-SCOPE-BOUNDARY 要求在受控diff加入新公共命令、
  页面样式或第二进度文件时，读者指出其无来源并退回对应owner。
  另以允许路径内隐藏新增公共行为、只在任务根新增第二记录作负控；
  路径本身获准不能替新增行为授权，仓库无差异也不能覆盖任务根副作用。
通过：每路径有授权来源、writer和消费者；没有新阶段、第五态、
  第二需求/进度权威、无人读清单、原型或页面路由组件样式工作。
失败：越界写入、伪造diff范围、把归档样本算本任务UI、
  新增无消费者机制，或以非UI标签跳过实际页面观察。
证据：完整相关补丁、逐路径对账、任务根实际外置写入清单、两类范围负控、
  三源引用和独立范围结论；缺外置证据处保留unknown。
  失败回修：越界回对应Phase原writer，范围争议回决定人；
  不删他人改动或重写历史，恢复后只复核受影响路径。

> 各 Phase 的精确 gate 与本地 STOP 可细化，不能改变上述业务判据。
> STOP 是停止该路径并回指定 owner 的条件，不是新增运行状态。
> 验收 6、9、11的外部缺口只影响自己及明确的下游整链结论。

## Appendix B — 需求与编号对照

正文中文编号与机器编号在这里一一对应；本表是唯一编号对照表。

| 正文编号 | 机器编号 | 说明 |
| --- | --- | --- |
| 需求 1 | R-001 | 逐包边做边验与真实入口 |
| 需求 2 | R-002 | 原话首卡与变更更新人 |
| 需求 3 | R-003 | 承诺四态与派生边界 |
| 需求 4 | R-004 | 未答限界与合法新增 |
| 需求 5 | R-005 | 真实变更与失效关系 |
| 需求 6 | R-006 | 只问真取舍 |
| 需求 7 | R-007 | 同包讨论与完整答复 |
| 需求 8 | R-008 | 首卡五要素 |
| 需求 9 | R-009 | 替代可核后退役 |
| 需求 10 | R-010 | 三类证据与整链 |
| 需求 11 | R-011 | 非目标与范围边界 |
| 需求 12 | R-012 | 任务一真实供件 |
| 场景 1 | SCN-001 | 第9步混合候选 |
| 场景 2 | SCN-002 | 原话与承诺坏例 |
| 场景 3 | SCN-003 | 未答与双向覆盖 |
| 场景 4 | SCN-004 | 新旧失效行 |
| 场景 5 | SCN-005 | 同包四样与长答复 |
| 场景 6 | SCN-006 | 受阻首卡 |
| 场景 7 | SCN-007 | 最终真实首卡 |
| 场景 8 | SCN-008 | 整链与抽件负控 |
| 场景 9 | SCN-009 | 首次真实变更 |
| 事实 1 | PFACT-001 | Talk现有caller |
| 事实 2 | PFACT-002 | 链检查现有合同 |
| 事实 3 | PFACT-003 | 包3绑定未知 |
| 事实 4 | PFACT-004 | 失效行现状 |
| 事实 5 | PFACT-005 | 同包步骤现状 |
| 事实 6 | PFACT-006 | 首卡与任务一供件未知 |
| 事实 7 | PFACT-007 | 首次真实变更未知 |
| 事实 8 | PFACT-008 | 非UI三源事实 |
| 事实 9 | PFACT-009 | 复用设计推断 |
| 功能需求 1 | FR-ASK-001 | 真取舍分诊 |
| 功能需求 2 | FR-COMMIT-001 | 原话与四态 |
| 功能需求 3 | FR-ORIGIN-001 | 原话支撑首卡 |
| 功能需求 4 | FR-COVER-001 | 未答与覆盖 |
| 功能需求 5 | FR-RETIRE-001 | 可核后退役 |
| 功能需求 6 | FR-CHANGE-001 | 变更失效接手 |
| 功能需求 7 | FR-DISCUSS-001 | 同包当场讨论 |
| 功能需求 8 | FR-CARD-001 | 真实首卡 |
| 功能需求 9 | FR-SUPPLY-001 | 任务一行为供件 |
| 功能需求 10 | FR-EVIDENCE-001 | 首判与整链 |
| 功能需求 11 | FR-SCOPE-001 | 范围与非目标 |
| 验收 1 | AC-P1-001 | 真取舍与四列 |
| 验收 2 | AC-P2-001 | 原话与承诺 |
| 验收 3 | AC-P3-001 | 未答与双向覆盖 |
| 验收 4 | AC-P3-002 | 受控退役 |
| 验收 5 | AC-P4-001 | 失效解析与兼容 |
| 验收 6 | AC-P4-002 | 首次真实变更接手 |
| 验收 7 | AC-P5-001 | 同包讨论与全集 |
| 验收 8 | AC-P6-001 | 受阻首卡 |
| 验收 9 | AC-P6-002 | 最终真实首卡 |
| 验收 10 | AC-P7-001 | 整链首判汇总 |
| 验收 11 | AC-P7-002 | 任务一三链联合验收 |
| 验收 12 | AC-P7-003 | 范围与非UI复核 |
| 风险 1 | RISK-01 | 问题错分 |
| 风险 2 | RISK-02 | 承诺拔高 |
| 风险 3 | RISK-03 | 覆盖误判 |
| 风险 4 | RISK-04 | 失效误判 |
| 风险 5 | RISK-05 | 讨论形式化 |
| 风险 6 | RISK-06 | 假接包 |
| 风险 7 | RISK-07 | 汇总漂白 |
| 风险 8 | RISK-08 | 并发覆盖 |
| 风险 9 | RISK-09 | 成本未知 |
| 未决 1 | OPEN-01 | 包3绑定 |
| 未决 2 | OPEN-02 | 同包入口与五件 |
| 未决 3 | OPEN-03 | 首次真实变更 |
| 未决 4 | OPEN-04 | 任务一三链 |
| 未决 5 | OPEN-05 | 独立执行者 |
| 未决 6 | OPEN-06 | 性能基线 |

- **FR-ASK-001**：关联 PFACT-001、SCN-001、AC-P1-001。
- **FR-COMMIT-001**：关联 PFACT-002、SCN-002、AC-P2-001。
- **FR-ORIGIN-001**：关联 PFACT-002、SCN-002/006/007、AC-P2-001、AC-P6-001/002。
- **FR-COVER-001**：关联 PFACT-003、SCN-003、AC-P3-001。
- **FR-RETIRE-001**：关联 PFACT-003/004、SCN-003/004、AC-P3-002、AC-P4-001。
- **FR-CHANGE-001**：关联 PFACT-004/007、SCN-004/009、AC-P4-001/002。
- **FR-DISCUSS-001**：关联 PFACT-005、SCN-005、AC-P5-001。
- **FR-CARD-001**：关联 PFACT-006、SCN-006/007、AC-P6-001/002。
- **FR-SUPPLY-001**：关联 PFACT-006、SCN-007/008、AC-P6-002、AC-P7-002。
- **FR-EVIDENCE-001**：关联 PFACT-007、SCN-008、AC-P7-001。
- **FR-SCOPE-001**：关联 PFACT-008/009、SCN-008、AC-P7-003。
