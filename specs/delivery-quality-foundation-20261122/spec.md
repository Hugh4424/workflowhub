# 功能规格：交付质量公共底座

本文件写给七个阶段的实施者、独立审查者、测试执行者与接续者。
读者应能定位真实入口、首改文件、依赖、写集、判定方法和失败恢复。
本文件同时承载产品行为与全局实现设计；Phase 文件只写本阶段增量。

> 写作标准：`skills/material-writing/SKILL.md` 是唯一材料标准。
> `## 实现设计（全局权威）` 及其四个小节名按机器合同原样保留。
> 验收判据只在 Appendix A；执行命令与执行结果归所属 Phase 和任务原件。
> 机器缩写：PRD=产品需求文档，FR=功能需求，AC=验收，PFACT=事实或假设。
> ADR=架构决定记录，CARD=包卡来源，UI=用户界面，CLI=命令行接口。
> JS=JavaScript，JSON=JavaScript 对象表示法。
> RED=目标测试先失败，GREEN=同一测试后通过；HEAD=Git 当前提交。
> NEW/MODIFY/DO NOT TOUCH 分别表示新增、修改和禁止触碰。

## 这是什么，给谁用？

这项交付让 WorkflowHub 的材料、审查、阶段事实、发布与收口真正接上消费者。
它服务计划作者、独立审查者、阶段执行者、发布维护者和最终验收者。
它不交付后续任务的业务规则，也不新增页面、阶段、公共命令或进度系统。

- **功能名**：交付质量公共底座
- **来源**：归档 PRD 任务一、当前 decision-log 的八个包及用户逐包确认
- **状态**：草稿；七阶段大纲已确认，完整计划与实施结果尚未确认

## 一页看懂：谁要什么结果，怎么算通过？

计划作者能读到同包原件，审查者能收到效果问题，阶段读者能看见真实差异。
默认方法、完成声明、安装包、退役入口和最终证据必须与实际行为一致。
每个阶段先自行判真伪，第七阶段再由未参与写作者完整验收全部承诺。

- **需求 1**：现存对象各有已验证接线或已验证退出的去向。
- **需求 2**：计划作者取得同一包的卡、质询、冷读、对抗和真实答复。
- **需求 3**：审查实际收到观察者、时点、证据和用户效果四要素。
- **需求 4**：可比阶段显示写集差异，不可比阶段说明真实原因。
- **需求 5**：新版卡与审查成为默认，旧副本和死对象有真实处置。
- **需求 6**：方向、计划、实施、接续合同都有实际读者。
- **需求 7**：流程原则能指出独立作用、替代的人工动作和撤回条件。
- **需求 8**：独立执行者能用真实入口和故意破坏的对照判假。
- **需求 9**：开工与收口重新枚举当前工程，每张卡边做边验证。
- **最大影响面**：三阶段方法、审查链、任务事实、命令行、发布闭包与收口报告。
- **验收信号**：十二条验收的唯一判据见 Appendix A。
- **非目标**：不做后续任务二至八的业务交付，不改七类公共行为语义。

## 为什么做，给谁用？

现有系统常见的问题是有合同、有文件或有测试，却没有真实消费者。
本任务把“存在”改成可被下一位读者实际使用，并让缺件保持可见。
所有产品目标的权威仍是归档 PRD 与当前 decision-log，本文件不另立目标权威。

### 需求 1：维护者要处理真实对象，而不是关闭存量问题

维护者从当前工程对象出发，将其接到真实消费者或退出旧入口。
输入是开工审计、当前跟踪文件、真实调用者和合同；输出是可回读的处置。
漏报对象、只有登记没有行为、误删活链都属于失败。
实施者提供改动与测试原件，第七阶段验收者按当前版本复核。

### 需求 2：计划作者要拿到用户实际讨论的包

计划作者从正常计划入口沿唯一清单读取五类同包、同批次、同卡版原件。
真实输出是由未参与写作的作者写出的首卡，而不是目录非空。
缺件、换包、异版或总确认代卡时，方向检查失败，计划侧停受影响包。
证据包括真实入口、五件回读、缺件反例和独立首卡。

### 需求 3：独立审查者要判断用户效果并保留角度来源

方向和细节审查的实际指令都追加效果四要素，发现携带受控角度。
角度经解析、两种合并和唯一记录路由保留，供应方或角色不能冒充角度。
审查预算分支在计划阶段按阶段自身触发，不再错误依赖审查角色。
证据包括实发指令、合法与非法角度、合并反例和最终记录。

### 需求 4：阶段审查者要看到申报与实改的差异

三个现有入口传当前阶段身份与裁剪前实际范围，复用同一对账算法。
可比路径显示匹配、漏报和多报；受限、跨库、缺起点或采集失败报不可用。
对账只进入现有事实投影，不写错误、不改退出码、不扩大读权。
证据包括实参、输出、退出码对照和最终审查者读取结果。

### 需求 5：执行者要使用同一版方法，并退出无效旧路

复杂与普通路线使用十一格卡、冷读六问、对抗九问和同人两轮上限。
小改仍保留一张卡和一次冷读，但不要求完整三角色或九问对抗。
历史五列只读；无消费者的对象退出，仍在活链的对象保留并写理由。
证据来自真实 brief、角色回传、公开检查、旧件兼容和退役恢复。

### 需求 6：四类合同要落到实际读取动作

方向合同由计划入口读取，计划合同由材料检查与开工就绪读取。
实施合同由终末证据、风险接受和写集事实读者承接。
接续合同由收口报告与既有交接读者承接；没有读者的栏位不算接通。
证据是正常读取与移除接线后的差异，不是合同文字单独存在。

### 需求 7：原则维护者要知道每条原则为何值得保留

六条原则逐条对应目标坏例、相邻正常场景、真实消费者和人工替代动作。
每条还写撤回条件；只有一般收益、重复提醒或新增表格不算独立作用。
原则维护者与独立读者在收口时判定，证据留在同一份收口报告。

### 需求 8：独立执行者要能用坏例证明检查有效

各阶段从真实入口提供合法例与故意破坏的负控，并保存原始输出。
安装、真实答复或审查服务不可得时，具名记录不可用及恢复条件。
局部单测、静态结构、投影实验或旧绿灯均不能代替真实效果。
第七阶段独立消费前序原件，并执行仍未闭环的必要检查。

### 需求 9：开工和收口都要以当前工程为准

开工审计只作对象键与快照，收口重新枚举当次提交并核逐件哈希。
新增、改版、消失和未被对象行覆盖的文件分别归口到负责包。
每个实施阶段先完成自己的首判，不能把全部发现推迟到最后。
证据是差异名单、逐件版本核对、各阶段首判和最终独立验收记录。

### 背景是什么？

当前八个包已经逐包确认，七阶段顺序也已确认。
本规格采用已确认最小方案：复用现有清单、采集器、检查器、记录路由和终末链。
只有现有能力不能承接时才窄扩展；本任务不需要新服务、存储层或控制面。

轻研究已消除三处冲突：保留并接入 `change-scope`，小改保留一次冷读。
`validateSchema` 旧实现按 `quality/evidence/build-plan/spec-clarify.md:11-15` 退役。
结果 schema 保留；验收证据接终末链，既有 record-route 结果 schema 守卫承接第二消费点。
风险接受复用现有函数并接到终末评估，审查预算分支归入审查接线阶段。
预算字段按 `spec-clarify.md:31-33` 保留 phase_budget 与 acceptance_cost_total。
execution_budget 改为可选人读策略；retry_reserve 并入可选执行策略，不作独立必填。
reviewTier 当前不接不退役；真实生产输入与审查写前断言归后续任务六。

### 已确认事实与假设是什么？

事实 1 已核实：八个包及依赖来自当前 decision-log 和逐包用户答复。
事实 2 已核实：公共入口、任务身份、证据捕获与模块职责沿现有专业合同。
事实 3 已核实：归档审计是开工快照，不能替代收口时的当前版本枚举。
事实 4 属推断：卡与设计所述缺口需实施后复验，本规格不把静态调研当通过。
事实 5 未知：项目库存来源未取得，不能据此声明三源均已排除 UI。
原始请求和已确认写集没有页面改动；库存 owner 补真实原件后再恢复浏览器排除。

## 做成什么样？

十二组场景覆盖正常、空缺、错误、边界、权限与共享写入顺序。
正文只描述旅程和可观察结果；通过、失败与证据判据见 Appendix A。

### 验收 1：同包材料成为计划输入

场景 1 从真实方向产物开始，计划作者读取五件并写出首卡。
缺卡、换包、同号异版、缺冷读、缺对抗或缺答复分别形成负控。
落点是 Phase 1 的任务 1；判据见 Appendix A 的验收 1。

### 验收 2：审查指令和角度全链一致

场景 2 覆盖方向与细节组包、合法角度、非法角度和跨角度同问题。
另核计划阶段预算文案在角色为空或非空时都可达，其它阶段不误入。
落点是 Phase 2 的任务 2；判据见 Appendix A 的验收 2。

### 验收 3：新版默认与轻量边界同时成立

场景 3 覆盖复杂、普通、小改、旧五列、首审、同人复读和第三轮。
无修订可一轮完成；换读者、缺问或旧版冒当前包必须暴露。
落点是 Phase 3 的任务 3；判据见 Appendix A 的验收 3。

### 验收 4：写集对账只报告真实事实

场景 4 覆盖匹配、漏报、多报、空实改、缺参、缺起点、裁剪、跨库和读域不足。
完整采集证明无改动时空集合合法；裁后相同不能冒充匹配。
落点是 Phase 4 的任务 4；判据见 Appendix A 的验收 4。

### 验收 5：步骤声明与实物按类型对齐

场景 5 覆盖固定件、多实例动态引用、错误类型、错任务、多引用和缺方法字段。
目录只作导航；生产者自称完成不能覆盖声明缺口。
两个收敛入口对同一清单和纯十列冷读给同一语义结论。
落点是 Phase 4 的任务 5；判据见 Appendix A 的验收 5。

### 验收 6：干净安装能运行声明的检查与命令

场景 6 从真实安装根运行无参自检和四个文档命令。
删除必需检查器或依赖必须失败；安装态未跑项须具名说明原因。
`status:repair` 退出帮助与路由，既有公共行为语义保持不变。
落点是 Phase 5 的任务 6；判据见 Appendix A 的验收 6。

### 验收 7：终末证据与风险接受被真实读取

场景 7 覆盖合法验收证据、坏证据、有效风险接受、未答和错发现绑定。
坏证据进入既有未完成语义；有效接受绑定当前审查、发现和真实答复。
落点是 Phase 5 的任务 7；判据见 Appendix A 的验收 7。

### 验收 8：旧结构校验实现退出而合同保留

场景 8 按旧路径调用 `validateSchema` 必须失效。
`result.schema.json` 仍可读取，包7不再把旧实现接回审查写入链。
落点是 Phase 5 的任务 8；判据见 Appendix A 的验收 8。

### 验收 9：退役、纠正与恢复一致

场景 9 分登记纠正、真死对象退出、预算字段声明退出三批执行。
`change-scope.mjs` 因阶段四已成为生产采集器而保留，不在删除集合。
冻结名单改动先获独立审查；误删活链必须能被针对性检查抓到并恢复。
落点是 Phase 6 的任务 9 至任务 11；判据见 Appendix A 的验收 9。

### 验收 10：当前对象、版本与四合同可回读

场景 10 以审计对象编号为键，重新枚举当前提交并归并开工快照。
旧哈希、同名异内容、漏来源、裸包号和无读者合同均为负控。
落点是 Phase 7 的任务 12；判据见 Appendix A 的验收 10。

### 验收 11：原则逐条可证伪、可撤回

场景 11 由原则维护者和独立读者逐条复读六条原则。
目标坏例与相邻正常场景必须能区分，收益消失时有明确撤回动作。
落点是 Phase 7 的任务 13；判据见 Appendix A 的验收 11。

### 验收 12：独立完整验收覆盖全部承诺

场景 12 在全部实施完成后，由独立验收者消费前六阶段原件。
逐条核需求、功能、验收、任务、真实结果与覆盖限制，并补跑未闭环坏例。
只交汇总报告或沿用旧版证据不能完成整体验收。
落点是 Phase 7 的任务 14；判据见 Appendix A 的验收 12。

## 打算怎么做？

采用复用优先的窄接线，不建立第二套材料、事实或质量权威。
每一阶段先交一个可独立判真的结果，再把原件交给下一阶段或最终验收。

### 方案 1：既有入口原位接线

方向材料沿唯一清单进入计划；审查角度沿现有记录链传递。
写集采集、声明比较、终末校验和风险接受都复用现有符号与返回投影。
发布只补实际运行闭包，退役同时处理旧入口、登记、测试和恢复。
失败时保留原输出，由对应包 owner 修同一接线，不用默认值或跳过来换绿。

### 方案取舍与明确不做

选择原位接线，因为现有消费者与故障点都已定位，新增统一层只会扩大迁移面。
不新建统一读取层、对象枚举脚本、台账文件、审查轮次或发布扫描器。
不接 `reviewTier`，不新增 `authorize:consume`，不把 `task-bootstrap` 改成新步骤。
不重写历史任务、归档、旧卡、旧报告或既有证据，不运行无范围全量回归。

## 阶段大纲：几个阶段，各交什么？

七个阶段均已获得大纲确认；第七阶段就是唯一独立完整验收阶段。
不设第 0 阶段，因为各任务使用现有 Node、仓库夹具和认证任务捕获链。
共享文件按依赖串行；同阶段内不同工作包也只有真实输入独立时才并行。

| 阶段 | 独立交付 | 依赖 | 下游消费者 |
| --- | --- | --- | --- |
| Phase 1 | 包1同包五件接入计划 | 无 | Phase 2、3、4及计划作者 |
| Phase 2 | 包2效果问题、角度与预算分支 | Phase 1 | Phase 3、6及审查记录读者 |
| Phase 3 | 包4新版默认与小改冷读 | Phase 1、2 | Phase 4、6及逐包作者 |
| Phase 4 | 包3写集对账与包5声明读取 | Phase 1、3 | Phase 5、6及阶段事实读者 |
| Phase 5 | 包7发布、证据、风险接受与旧实现退出 | Phase 4 | Phase 6、7及安装和收口读者 |
| Phase 6 | 包6三批退役与纠正 | Phase 2至5 | Phase 7及维护者 |
| Phase 7 | 包8全量收口、原则与独立完整验收 | Phase 1至6 | 用户、接续者与负责包 owner |

Phase 4 内部先写包3再写包5，避免共享 `stage-runtime` 与检查器并发修改。
Phase 5 必须读回 Phase 4 已核状态；Phase 6 不得撤销其生产接线。
各 Phase 的局部首判不推迟到 Phase 7，Phase 7 也不以汇总签名替代首判。

## 还有什么没定？

以下未决只限制具名条件，不把已确认方向重新打开。
每项在影响的动作前由原 owner 处理；未关闭就保留缺口，不写成通过。

- **未决 1**：旧卡、矩阵与处置表是否重绑新包号；主会话与用户于 Phase 7 报告定稿前决定。
  默认只读不重绑；差异始终按新包名和时点回包。
- **未决 2**：对象粒度已定为审计对象编号，文件仅作覆盖差集；此项已关闭。
  Phase 7 按该口径执行，不重新讨论文件级对象替代。
- **未决 3**：原则第 37 条的六个责任点是否退出；原则维护者于 Phase 7 原则表定稿前确认。
  未确认只影响该半条，其余原则继续判定。
- **未决 4**：是否补建正式开工台账；包1作者与主会话于 Phase 7 枚举前决定。
  默认使用四份审计与对象清单，并明确其只是快照。
- **未决 5**：方向、实施、接续合同缺口由谁修；各合同 owner 于 Phase 7 前承接。
  修不完就逐条记缺口，不能改变两态判定。
- **未决 6**：当前范围已由 `spec-clarify.md:29-30` 关闭：reviewTier 不接不退役。
  其输入 producer、recordTaskReview 分派、recordSimpleReviewRequest 写前 assert 与正负例归后续任务六。
  审查域 owner 承接后续任务；P7 保持具名未闭环，不写已接或已退。
- **未决 7**：历史审查记录与结果结构的兼容范围；审查域 owner 于 Phase 5 退役前核真实样本。
  未核范围保持未知，不宣称全部历史记录通过。
- **未决 8**：安装态两项源码登记检查具名未跑是否可接受；发布 owner 于 Phase 5 开工前确认。
  未接受时，安装覆盖结论保留缺口，不把未跑写成通过。
- **未决 9**：冻结名单测试变更由谁批准；原测试 owner 与独立审查者于 Phase 6 第二批前答复。
  未批准不得修改该冻结断言或启动对应删除。
- **未决 10**：经验投影是否仍需机器件；反思与经验 owner 于 Phase 6 第二批前确认。
  反对时保留或恢复实现，历史人读字节始终不动。
- **未决 11**：风险接受具体入口已定位为终末评估质量读取；运行时 owner 在 Phase 5 验证后关闭。
  未接通前不得称风险接受已被收口消费。
- **未决 12**：已由 `spec-clarify.md:31-33` 的真实用户答复关闭。
  保留 phase_budget 与 acceptance_cost_total；execution_budget 仅可选人读；
  retry_reserve 并入可选执行策略，测试作者随后同步目标测试并保留原失败原件。
- **未决 13**：三角色方法技能接步骤还是退役；make-decision owner 于 Phase 3 定版后决定。
  本任务不擅自新增步骤；无真实消费者前不保留假登记。
- **未决 14**：两个授权别名和只报告模式的去留；授权、写集与声明 owner 于 Phase 4、6 核真实调用。
  `--report` 在人读出口有承接前保留，别名不因静态零引用直接删除。
- **未决 15**：风险接受读取的完成证据归 Phase 5 任务 7；运行时 owner 于收口前提供。
  未答、错发现或无效答复不得被视为接受。
- **未决 16**：旧 `validateSchema` 入口退出归 Phase 5 任务 8；发布与合同 owner 于收口前验证。
  旧入口仍可用或结果结构不可读都阻止该项关闭。
- **未决 17**：预算分支旧角色条件归 Phase 2 任务 2；审查指令 owner 于实施时验证。
  角色为空或非空的真实计划入口都必须到达专用文案。
- **未决 18**：六条原则的独立作用、人工替代与撤回条件归 Phase 7 任务 13。
  原则维护者在报告定稿前补齐；只有一般收益或无撤回条件即失败。
- **未决 19**：项目库存及其中是否存在页面消费者尚未取得可核原件。
  库存 owner 在 Phase 7 最终范围判定前提供真实来源与盘点结果。
  未恢复前，项目库存和浏览器适用性保持 unknown，不影响当前命令行写集继续实施。

## 实现设计（全局权威）

全局方案只扩展现有生产接缝，并保持七类公共行为与历史原件边界。
后端、接口和验收规则分别来自下列专业源，本文件不复制其正文。

- 后端：`specs/backend/architecture.md:11-23`，2026-11-16，运行时 owner。
  采用窄接口、真实 caller、认证任务句柄、明确错误和既有锁边界。
- 接口：`specs/api/contract.md:11-21`，2026-10-25，公共运行时与任务接口 owner。
  保持七类行为、任务身份、create-only 原件及命令退出和取消事实。
- 验收：`specs/acceptance/acceptance.md:11-21`，2026-10-25，任务验收 owner。
  采用逐阶段首判、受影响定向测试、原始捕获和独立质量裁决。
- 版本证据：`specs/acceptance/evidence.md:5-13`，2026-10-28，验收专业 owner。
  当前哈希、历史声明与归档绑定分别记录，不用新 HEAD 补写历史身份。

### 代码锚点

实施者按 Phase 顺序读取下列真实文件与符号；行号只作设计时定位。
当前设计来源是各包卡、design 与轻研究，实施前仍须核当次字节。

- Phase 1：`workflows/make-decision/steps.json` 第9、12步。
  `workflows/build-plan/steps.json` 第1步；`tools/cli/check-stage-steps.mjs`。
  `tools/cli/run-checks.mjs` 复用同一清单解析与缺件语义。
- Phase 2：`skills/wh-review/scripts/review-materials.mjs` 的 direction/detail 文本。
  同文件第677至679行附近是预算分支；`runtime/review/review-output.mjs` 解析角度。
  `skills/wh-review/scripts/simple-review-runner.mjs` 与
  `runtime/review/canonical-review-result.mjs` 分别保留配对和 canonical 贡献。
  `runtime/review/review-record-route.mjs` 是唯一记录写主。
- Phase 3：`workflows/make-decision/steps.json` 与普通、小改路线。
  `tools/cli/check-stage-steps.mjs` 和 `tools/cli/run-checks.mjs` 核新版与公开退出。
  `skills/decision-maker/templates/cold-read.md` 记录同一读者与轮次。
- Phase 4：`workflows/build-code/change-scope.mjs` 的
  `capturePreExecutionTaskChangeScope` 提供裁剪前范围。
  `runtime/stage/stage-content-contracts.mjs` 独占对账算法。
  `tools/cli/stage-runtime.mjs` 接受限采集前、阶段审查投影和开工就绪。
  `runtime/task/final-chain-runner.mjs` 与两个检查入口消费声明事实。
- Phase 5：`runtime/distribution/runner-release.mjs` 管理发布清单。
  `runtime/evidence/acceptance-evidence-validator.mjs` 校验终末证据。
  `tools/cli/stage-runtime.mjs` 的 `terminalAssessmentQuality` 读取风险接受。
  `runtime/review/stage-review-disposition.mjs` 继续提供既有校验函数。
  `runtime/review/review-record-route.mjs` 在唯一写盘前承接结果 schema 守卫。
  `runtime/review/schema-validator.mjs` 是待退旧实现。
- Phase 6：`docs/architecture/move-map.json` 承载既有退役登记。
  `tests/contract/stage-registry.test.mjs` 的冻结名单改动须先走测试变更审查。
- Phase 7：`git ls-files` 是当前枚举入口。
  `specs/delivery-quality-foundation-20261122/closeout-report.md` 是唯一报告写集。

### 接口与失败语义

所有接线沿用现有请求、返回投影和任务捕获，不暴露存储或框架内部表示。
缺件、非法输入和不可读来源保持失败；不可用必须带原因与恢复条件。

- **同包材料**：身份由任务、包、批次、卡节和卡节哈希共同确定。
  方向缺件非零；计划检查只报告，计划作者停受影响包且不写假首卡。
- **审查发现**：历史缺角度读作未知；新方向与细节输出缺角度或角度非法不得干净通过。
  同角度可合并但保留全部贡献，不同角度不得合并。
- **写集对账**：完整范围才产生匹配或差异；受限与跨库只报不可用。
  对账不进入错误，不改变既有阶段退出码。
- **步骤声明**：目录只导航，固定件按真实类型读取，动态件核任务与步骤身份。
  零份是缺件，多份合格引用是歧义，不取最新或第一份。
- **发布与校验**：门禁检查缺文件非零，advisory 与具名未跑分开报告。
  坏验收证据进入既有未完成语义；无效风险接受不得改变结论。
- **退役与收口**：旧入口失效与替代可用必须同时验证。
  收口对象只有已验证接上或已验证退出；缺口另列，不能计入通过。
- **新增控制面**：`N/A — 全部复用现有命令、事实、schema 与报告载体`。

全局写边界如下；每个 Phase 的写集只能是相应子集。
新增文件只限已列出的规格、行为测试和收口报告，不新增生产模块。

- **NEW**：`specs/delivery-quality-foundation-20261122/spec.md`。
  `specs/delivery-quality-foundation-20261122/closeout-report.md`。
  `tests/contract/package-material-consumption.test.mjs`。
  `tests/contract/review-effect-lens.test.mjs`。
  `tests/contract/convergence-defaults.test.mjs`。
  `tests/contract/stage-write-set-reconciliation.test.mjs`。
  `tests/contract/step-evidence-contract.test.mjs`。
  `tests/contract/terminal-risk-acceptance.test.mjs`。
  `tests/contract/result-schema-contract.test.mjs`。
  `tests/contract/retirement-registry.test.mjs`。
- **MODIFY，Phase 1**：`workflows/make-decision/steps.json`、
  `workflows/build-plan/steps.json`、`tools/cli/check-stage-steps.mjs`、
  `tools/cli/run-checks.mjs`、`tests/contract/check-stage-steps.test.mjs`、
  `tests/contract/decision-evidence-consumption.test.mjs`。
- **MODIFY，Phase 2**：`skills/wh-review/scripts/review-materials.mjs`、
  `skills/wh-review/scripts/simple-review-runner.mjs`、
  `skills/wh-review/contracts/provider-protocol.md`、`skills/wh-review/SKILL.md`、
  `workflows/make-decision/steps.json`、`runtime/review/review-output.mjs`、
  `runtime/review/canonical-review-result.mjs`、
  `runtime/review/review-record-route.mjs`、`runtime/review/schemas/result.schema.json`、
  `tests/contract/review-materials-contract.test.mjs`、
  `tests/contract/review-axes-contract.test.mjs`、
  `tests/review/review-record-route.test.mjs`。
- **MODIFY，Phase 3**：`workflows/make-decision/SKILL.md`、
  `workflows/make-decision/steps.json`、`workflows/make-decision/skill-deps.yaml`、
  `workflows/make-decision/flows/normal/SKILL.md`、
  `workflows/make-decision/flows/normal/steps.json`、
  `workflows/make-decision/flows/small/SKILL.md`、
  `workflows/make-decision/flows/small/steps.json`、
  `skills/decision-maker/SKILL.md`、`skills/decision-maker/templates/cold-read.md`、
  `skills/decision-maker/templates/adversarial.md`、
  `tools/cli/check-stage-steps.mjs`、`tools/cli/run-checks.mjs`、
  `tests/contract/convergence-card-contract.test.mjs`、
  `tests/contract/module-convergence-card.test.mjs`、
  `tests/contract/check-stage-steps.test.mjs`、
  `tests/contract/decision-evidence-consumption.test.mjs`。
- **MODIFY，Phase 4**：`tools/cli/stage-runtime.mjs`、
  `workflows/build-code/change-scope.mjs`、`tools/cli/check-stage-steps.mjs`、
  `tools/cli/run-checks.mjs`、`runtime/task/final-chain-runner.mjs`、
  `workflows/make-decision/steps.json`、
  `workflows/make-decision/flows/small/steps.json`、
  `workflows/make-decision/flows/normal/steps.json`、
  `workflows/make-decision/flows/planning/steps.json`、
  `workflows/build-prd/steps.json`、`workflows/build-plan/steps.json`、
  `workflows/build-code/steps.json`、
  `specs/delivery-quality-foundation-20261122/step-consumer-design.md`、
  `tests/contract/n11-plan-quality.test.mjs`、
  `tests/contract/light-implementation-review.test.mjs`、
  `tests/contract/check-stage-steps.test.mjs`、
  `tests/contract/build-code-change-scope.test.mjs`、
  `tests/contract/build-code-readiness.test.mjs`。
- **MODIFY，Phase 5**：`runtime/distribution/runner-release.mjs`、
  `tools/cli/run-checks.mjs`、`tools/cli/check-anti-host.mjs`、
  `tools/cli/check-stage-quality.mjs`、`tools/cli/verify-structure.mjs`、
  `tools/cli/stage-runtime.mjs`、`runtime/evidence/acceptance-evidence-validator.mjs`、
  `runtime/task/final-chain-runner.mjs`、`runtime/review/schema-validator.mjs`、
  `runtime/review/review-record-route.mjs`、
  `docs/standard-workflow.md`、`docs/release-support-matrix.md`、`README.md`、
  `GLOSSARY.md`、`tests/integration/runner-clean-install.test.mjs`、
  `tests/contract/release-tree.test.mjs`、`tests/contract/doctor-interface.test.mjs`、
  `tests/stage-risk-acceptance.test.mjs`、
  `tests/contract/status-derivation.test.mjs`、
  `tests/review/review-record-route.test.mjs`、
  `tests/contract/review-public-entrypoints.test.mjs`、
  `tests/contract/code-review-ocr.test.mjs`、
  `tests/contract/stalled-consumer-delta.test.mjs`、
  `tests/contract/terminal-chain.test.mjs`。
- **MODIFY，Phase 6**：`runtime/review/stage-review-disposition.mjs`、
  `docs/architecture/move-map.json`、`docs/architecture/control-plane-inventory.json`、
  `docs/adr/0030-mechanism-simplification-deletion-boundary.md`、
  `skills/catalog.yaml`、`runtime/evidence/workflow-evolution.mjs`、
  `tools/cli/smoke-local-skill-dispatch.mjs`、
  `runtime/evidence/research-report.mjs`、`runtime/review/ocr-delegation-adapter.mjs`、
  `tools/cli/onboard-release.mjs`、`skills/decision-maker/skill-bundle.json`、
  `workflows/build-code/SKILL.md`、`workflows/build-code/steps.json`、
  `workflows/build-plan/steps.json`、`skills/spec-plan/templates/phase-template.md`、
  `docs/standard-workflow.md`、`tests/contract/stage-registry.test.mjs`、
  `tests/contract/lessons-jsonl.test.mjs`、
  `tests/contract/research-report-current.test.mjs`、
  `tests/contract/ocr-delegation-adapter.test.mjs`、
  `tests/contract/onboard-release.test.mjs`、
  `tests/contract/acceptance-plan.test.mjs`、
  `tests/contract/repository-inventory.test.mjs`。
- **MODIFY，Phase 7**：只允许 `closeout-report.md`，不得改前六阶段产物。
- **DO NOT TOUCH**：当前 `decision-log.md`、归档 PRD、需求索引及八包卡和设计原件。
  `runtime/interface/runtime-facade.mjs` 保持活链；Phase 6 不得删除它。
  `workflows/build-code/change-scope.mjs` 在 Phase 4 后是受保护生产接线。
  `runtime/review/schemas/result.schema.json` 只允许 Phase 2 增加可选角度字段。
  `runtime/review/review-record-route.mjs` 不得接入待退 `validateSchema`。
  Phase 5 可在该既有写前接缝使用保留 schema 做结果守卫，不新建第二写入者。
  历史任务、历史报告、旧五列文件与失败原件保持原字节。

### 需求到任务追踪

每条来源都有功能、验收、任务和独立判据；反向不存在无来源任务。
当前决定编号为 D-01 至 D-08，本任务未登记 ADR，不改写或虚构 ADR。
Oracle 的期望值来自原始需求与预写测试，不从实现输出反推。

| Source / 决定 | FR | AC | Phase/Task | oracle |
| --- | --- | --- | --- | --- |
| R-001、R-002、R-008、R-009 / D-01 | FR-MAT-001 | AC-MAT-001 | P1/T001 | ORACLE-SAME-PACKAGE |
| R-003、R-005、R-008 / D-02、F4 | FR-REV-001 | AC-REV-001 | P2/T002 | ORACLE-REVIEW-LENS |
| R-005、R-008 / D-04 | FR-CONV-001 | AC-CONV-001 | P3/T003 | ORACLE-CONVERGENCE-VERSION |
| R-004、R-008 / D-03 | FR-SCOPE-001 | AC-SCOPE-001 | P4/T004 | ORACLE-WRITE-SET |
| R-001、R-008、R-009 / D-05 | FR-DECL-001 | AC-DECL-001 | P4/T005 | ORACLE-DECLARED-EVIDENCE |
| R-008、R-009 / D-07 | FR-DIST-001 | AC-DIST-001 | P5/T006 | ORACLE-INSTALLED-RELEASE |
| R-006、R-008 / D-07、F2 | FR-EVID-001 | AC-EVID-001 | P5/T007 | ORACLE-TERMINAL-EVIDENCE |
| R-001、R-005、R-008 / D-07、F3 | FR-SCHEMA-001 | AC-SCHEMA-001 | P5/T008 | ORACLE-SCHEMA-RETIREMENT |
| R-001、R-005、R-008 / D-06 | FR-RETIRE-001 | AC-RETIRE-001 | P6/T009 | ORACLE-RETIREMENT-RECOVERY |
| R-001、R-005、R-008 / D-06 | FR-RETIRE-001 | AC-RETIRE-001 | P6/T010 | ORACLE-RETIREMENT-RECOVERY |
| R-001、R-005、R-008 / D-06 | FR-RETIRE-001 | AC-RETIRE-001 | P6/T011 | ORACLE-RETIREMENT-RECOVERY |
| R-001、R-006、R-008、R-009 / D-08 | FR-CLOSE-001 | AC-CLOSE-001 | P7/T012 | ORACLE-CURRENT-CLOSEOUT |
| R-007、R-008 / D-08、F5 | FR-PRIN-001 | AC-PRIN-001 | P7/T013 | ORACLE-PRINCIPLE-EFFECT |
| R-001–R-009 / D-01–D-08 | FR-FINAL-001 | AC-FINAL-001 | P7/T014 | ORACLE-FULL-ACCEPTANCE |

### 全局验证策略

测试蓝图唯一原件是任务库 `quality/evidence/build-plan/testing-blueprint.md`。
Phase 1至6以 `skills/backend-testing/SKILL.md` 的行为路线为技术预判。
Phase 5另覆盖真实安装发布链；Phase 7独立完整验收全部验收标准。

- **开工分配**：P1先流式重枚举当前对象，并在质量证据中逐对象分配 Phase/Task/AC。
  四份审计与对象清单是 OI-04 的来源快照；本次开工枚举是当前事实，不另建进度账。
- **目标 RED**：行为任务先预写测试，在同一命令下让具名目标断言失败。
  导入、收集、环境或准备失败不算目标 RED；本来就通过须如实记录。
- **GREEN 与冻结**：实施后以同一 oracle 转绿，测试与评分逻辑在 Phase 卡冻结。
  改断言须走既有测试变更请求和独立审查，不能为绿降低判据。
- **手工单元 oracle**：每个任务先用一个真实输入写清独立预期，再跑最小工具。
  正常、失败、取消、权限与边界按场景适用；替身不能替代关键真实接缝。
- **真实捕获**：命令经认证 `captureCommand` 保存 cwd、argv、退出、原输出和引用。
  隔离夹具由同一进程创建、消费和清理；原始证据不随临时目录删除。
- **开工探针与验证分开**：只读就绪探针证明输入和前置可读。
  探针退出0不证明业务行为或验收通过，验证仍按所属 Phase 命令执行。
- **针对性测试**：只跑蓝图和 Phase 卡具名文件，不做无范围全量回归。
  `reference-audit` 的既存基线红不得冒作本任务通过证据。
- **最终聚合**：Phase 7读取前序唯一原件，核当前版本并执行必要未闭环负控。
  主命令为 `node tools/cli/run-checks.mjs --task-path /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-foundation-20261122`。
  只有同版同范围且仍适用的证据可复用；旧绿灯或同名异内容必须重验。
- **不能证明的内容**：本规格未运行任何测试、真实审查、用户答复或干净安装。
  未执行项只能记 `incomplete` 或带原因的 `unavailable`，不得预写通过。

## 怎么算通过？

每条验收必须在所属 Phase 先判，再由 Phase 7 的独立验收者完整复核。
判据、成本、资源、环境和证据计划只以 Appendix A 为准。

### 验收判据在哪里？

Appendix A 逐条写触发、真实输入、观察方法、通过、失败和证据类型。
Phase 文件提供精确命令，执行者在任务事实中补真实结果。
规格保存成功、文件存在、结构可读或命令退出0都不单独证明完成。

### 判定对象怎么与需求对齐？

判定对象是本任务的真实 WorkflowHub 命令行、工作区、任务材料和安装产物。
测试夹具只控制输入，不把被验入口替换成另一个简化实现。
真实用户答复、真实审查记录和真实安装条件不能用合成文本冒充。
若改变对象、判法或验证环境，必须回原需求 owner，而不是由实施者自行放宽。

### 验收对象是什么？

本任务当前目标是命令行与工作区交付，但项目库存来源仍为 unknown。
原始请求只要求流程、运行时和证据质量，没有页面目标。
已确认八包和七阶段也不修改页面、路由、组件或样式。
库存 owner 未提供真实盘点前，不宣称三源均证明非 UI。

`viewport` 的 unknown 值披露库存缺口，不表示已观察到页面或已完成排除。
`entry_ref` 指向接口合同，`sample_ref` 指向需求索引，`oracle_ref` 指向测试蓝图。
调用唯一 producer 时，context.sources 分别使用键 `api_contract`、
`requirement_index` 和 `testing_blueprint`，并绑定上述真实原件。
`checkAcceptanceObject` 的唯一 JS producer 保留在 spec-template，本文件不复制。

机器区供校验器读取，人可跳过；下列对象是当前真实输入，不是运行结果。

#### 验收对象

```json
{
  "workspace": "/Users/Hugh/Hugh/Project/workflowhub-delivery-quality-foundation-20261122",
  "state": "规格与全局设计草稿；实施、安装和验收证据尚未产生",
  "viewport": "unknown — 项目库存来源未取得；当前写集无页面", 
  "owner": "用户",
  "cli": {
    "command": "node tools/cli/stage-runtime.mjs",
    "entry_ref": "api_contract",
    "sample_ref": "requirement_index",
    "oracle_ref": "testing_blueprint"
  }
}
```

### 证据计划怎么写？

每条 Appendix A 验收都写判什么、怎么判、来源、提供者、时点、成本和缺口恢复。
证据由所属任务执行者提供，经认证任务捕获链保存单份原件。
方法与自然语言效果由独立读者判；真实环境项由自动采集取回原件。
拿不到时写真实尝试、卡点、提供者与恢复条件，不把缺口改成通过。

## 测试计划是什么？

项目测试面按真实改动声明，路线预判不替代测试面。
所有测试面都由所属 Phase 给出可执行命令和配对 oracle。

- **运行时与纯函数**：适用角度解析、合并、写集、声明和校验；覆盖验收2、4、5、7。
  采用真实函数和独立预期，限制是纯函数绿不证明真实入口已接。
- **命令行合同**：适用清单缺件、公开退出、路由退役和旧实现退出。
  覆盖验收1至5、8、9，保留真实 argv、cwd、stdout/stderr 和退出码。
- **真实任务消费**：适用独立首卡、复杂与普通 brief、审查记录和风险接受。
  覆盖验收1至3、7，限制是受控 provider 输出不证明在线 provider 质量。
- **安装集成**：适用 Phase 5 的干净安装与必需依赖负控，覆盖验收6。
  缺真实安装条件时记不可用，不以发布投影或临时副本冒通过。
- **独立语义阅读**：适用四合同、六原则与最终完整验收，覆盖验收10至12。
  采用预先固定的阅读协议和坏例；文档可读本身不等于语义通过。
- **浏览器端到端**：`unknown — 项目库存原件未取得；库存 owner 核实前不写 N/A`。
- **覆盖率**：`N/A — 本任务没有已核覆盖率工具与阈值来源，不以覆盖率代替 oracle`。

## 有什么风险和未决？

最主要风险是半接线、共享写入互相覆盖、误删活链和旧证据假绿。
未决项及其 owner、时点与恢复条件已在正文逐项列出。

- **风险 1**：只改合同或文件存在，真实消费者仍读不到。
  触发是真实入口没有目标产出；由对应 Phase owner 修接线并重跑同一坏例。
- **风险 2**：共享文件并发修改导致覆盖或语义漂移。
  触发是越过 Phase 依赖写同一路径；立即停止后写者，回读先写者已核状态再继续。
- **风险 3**：目录、advisory、具名未跑或退出0被误读为完成。
  触发是报告与真实执行不一致；保留缺口并由独立者按原入口判假。
- **风险 4**：安装隐藏依赖、真实 provider 或用户答复不可得。
  触发是干净安装或真实成功例无法执行；具名记不可用及恢复条件，不改跳过。
- **风险 5**：退役误删活链或冻结测试被改绿。
  触发是替代失败或未经批准改断言；停止该批，恢复原字节并独立复验。
- **风险 6**：包号双套、哈希过期或对象改版造成错误归口。
  触发是只写裸包号或引用旧哈希；按包名和时点回包，重算受影响行。
- **风险 7**：最终验收只复述前序摘要，未读当前原件。
  触发是证据无当前版本绑定；Phase 7 必须重读并补跑必要负控。

### 补充材料与术语在哪里？

材料导航只是可再生成指针，不替代原件或建立第二份进度权威。
开工先读当前 decision-log、需求索引和所属包卡；实施前再读该包 design。

- 产品目标：`specs/archive/delivery-quality-reform-20261121/prd.md:272-333`。
- 当前决定：`specs/delivery-quality-foundation-20261122/decision-log.md` 第3至5段。
- 逐字需求：任务库 `quality/evidence/decision-log-refs/requirement-index.md`。
- 包材料：任务库 `quality/evidence/decision-maker/p01` 至 `p08`。
- 点状研究：任务库 `quality/evidence/build-plan/light-research.md`。
- 测试蓝图：任务库 `quality/evidence/build-plan/testing-blueprint.md`。
- 证据身份：任务库 decision-log 第6段及当前任务真实捕获原件。

### 调研来源如何承接

本任务只采用已核一手外研的可观察判据，不从归档转述新增功能。
逐域采用关系如下；固定版本、hash 与行位由 `research/external-methods-applicable.md` 回读。

| 调研域 | 采用的一手外研原件 | 当前落点或不适用理由 |
| --- | --- | --- |
| 原则总纲 | `principle-prove-it-works` pin 4a4f41c4，L3/L9；`create-verification-skill` 同 pin，L30/L40 | P7与AC-FINAL-001：真实产物、实际差分、清理后证据仍可读 |
| 01 Lauren Tan | 原 X 帖与完整音视频均未取得，归档转写未作一手采用 | 不接当前功能或 AC；若后续任务研究其方法，须先取得真实来源 |
| 02 pstack 源码与技能地图 | `principle-sequence-verifiable-units` pin 4a4f41c4，L9/L11/L13 | P1至P6与各自 AC：当前小单元先判再前进；未取 eval.md，不采用其自述对照 |
| 05 状态反例与可重跑验收 | `hillclimb.md` pin 4a4f41c4，L8/L14；`prove-it-works` L9/L11 | P1至P6的目标负控与同命令复跑；不把计数或覆盖率当语义通过 |
| 06 真实调用链与审查分工 | `create-verification-skill` L27/L30/L36；`automations/benny/FOR_AGENTS.md` 同 pin，L19/L35 | P2/AC-REV-001、P5/AC-DIST-001、P7/AC-FINAL-001：真实入口、覆盖清单与失败边界 |
| 08§4 测量与证据有效性 | `create-verification-skill` L28/L40；`prove-it-works` L9；`hillclimb.md` L8 | P7/AC-CLOSE-001与AC-FINAL-001：版本、范围、替代环境和缓存证据限制 |

这些来源只约束既有 Phase 的判定与证据，不增加自动作业、新审查轮或后续业务。
未取得原件的域保持未采用，不以二手摘要补齐。

“同包”指同一任务、包号、讨论批次、当前卡节和卡节内容指纹。
“裁剪前范围”指尚未按申报写集过滤的实际改动集合。
“oracle”指独立于实现、能判断结果真假的预期与比较方法。
“负控”指故意破坏一个必要条件，检查必须由通过变为失败或未证实。

## Appendix A — 验收判据（唯一权威）

以下十二条是全部承诺的唯一验收权威。
判定者均为实现与材料写作之外的独立执行单元，不要求用户亲自操作。
成本分钟是未校准的规划估算，不是历史实测；超过硬上限先回作者缩减重复验证。
`active_min` 不吸外部等待；external_blocked/incomplete/延期按原字段单列，不设硬 cap。
`retry_cap=1` 只允许修正夹具或输入后重跑同命令，目标行为失败须回原实现修复。
证据路径是计划落点，不表示这些文件已经产生或已经通过。

- [ ] **AC-MAT-001**：计划作者真实消费同包五件并写出首卡。
  关联 FR-MAT-001。
判定方式：只能人读；判定时点：Phase 1 实现、独立审查及真实方向输入就绪后。
落点：P1/T001 与 `phases/P1.md`；精确命令由该 Phase 给出。
验证：P1先完成开工流式枚举和逐对象 Phase/Task/AC 分配，再由独立计划作者写首卡。
删除当前卡、缺质询、缺对抗和总确认代卡分别作负控。
环境与数据：认证工作区、真实方向任务、唯一清单与当前包五件原件。
谁判：未参与方向材料和首卡写作的独立计划作者；测试执行者保存机器负控。
承接：P1/T001 首判及 `quality/tests/same-package-materials.output`、真实首卡。
成本：executor=独立计划作者与测试执行者；estimate_min=25（规划估算）；
  hard_cap_min=60（规划上限）；resources=现有任务材料、Node、认证捕获链；
  observation=五件回读、首卡内容、负控退出；retry_cap=1；evidence_tier=命令级加人读。
资源来源：复用当前任务真实包材料；缺合法清单由方向 owner 产生，不用夹具冒真实效果。
为什么不能再简：文件存在不能证明作者读到同包并改变首卡。
通过：五件同包同版可回读，独立作者写出正确首卡。
缺卡、缺质询、缺对抗及总确认代卡均使方向检查非零且计划侧不写首卡。
失败：换包、异版、总确认代卡、缺任一材料仍可接包，或只有目录与检查记录没有首卡。
证据：开工枚举摘要与差集、逐对象分配原件、五件哈希、负控和独立首卡。
  分配原件为 `quality/evidence/build-plan/opening-object-assignment.md`。

- [ ] **AC-REV-001**：实发审查含效果四要素，角度与预算分支全链正确。
  关联 FR-REV-001。
判定方式：机器可判；判定时点：Phase 2 目标 RED 后及实现、审查修复后。
落点：P2/T002 与 `phases/P2.md`。
验证：生成 direction/detail 实发文本，驱动合法、非法和跨角度发现并核最终记录。
历史缺 lens 记录应可读且为 unknown；新 direction/detail 分别缺 lens 不得干净通过。
另以角色为空和非空跑计划预算分支，以非计划阶段作相邻反例。
环境与数据：现有组包器、受控 provider 输出、配对与 canonical 输入、唯一记录路由。
谁判：独立测试执行者，核原始输出而非只看 schema。
承接：P2/T002 首判及 `quality/tests/review-effect-lens.output`。
成本：executor=独立测试执行者；estimate_min=25（规划估算）；
  hard_cap_min=60；resources=现有组包与记录入口、受控发现、Node；
  observation=实发文本、合并结果、最终记录和分支输出；retry_cap=1；evidence_tier=命令级。
资源来源：仓内现有审查链和可就地构造的发现，不需真实在线 provider。
为什么不能再简：只测最终字段会漏掉实发指令、合并或唯一写盘的丢损。
通过：第⑤问及四要素实际送达，角度和全部来源可反查，跨角度不合并，预算条件正确。
历史缺 lens 读 unknown，新 direction/detail 缺 lens 均不成干净通过。
失败：只改合同、非法角度有效、贡献丢失、跨角度误合并、新输出缺 lens 假绿或旧预算条件存在。
证据：实发指令、目标 RED/GREEN、解析与两种合并输出、最终记录及原始 provider 引用。

- [ ] **AC-CONV-001**：复杂、普通和小改路线使用已确认的默认与冷读边界。
  关联 FR-CONV-001。
判定方式：只能人读；判定时点：Phase 3 实现与两个公开检查修复后。
落点：P3/T003 与 `phases/P3.md`。
验证：取得复杂和普通真实 brief/回传，核同人两轮；小改核一卡与一次冷读。
以缺第六问、缺第九问、删第十一格、修订后无同人复读、换读者和第三轮作负控。
两个公开 CLI 各留真实调用、原始输出和退出码。
环境与数据：三条现有路线、当前包卡、审查模板、公开检查和旧五列只读样本。
谁判：独立测试执行者与未参与模板写作的路线读者。
承接：P3/T003 首判及 `quality/tests/convergence-defaults.output`。
成本：executor=独立测试执行者；estimate_min=25（规划估算）；
  hard_cap_min=60；resources=现有路线、模板、真实包材料和公开检查；
  observation=brief、回传、检查报告和退出；retry_cap=1；evidence_tier=命令级加人读。
资源来源：复用本任务卡与既有旧件；负控在隔离夹具中构造并清理。
为什么不能再简：只数问题会漏掉路线、同一读者、公开退出和小改合法边界。
通过：无修订一轮与修订后同人第二轮可过，小改一卡一次冷读可过，旧件只读。
失败：删格缺问、修订无复读、第三轮或换读者未被两个公开 CLI 非零拒绝。
证据：五份定向合同测试、真实 brief 与回传、两个 CLI 原件和旧件哈希不变记录。

- [ ] **AC-SCOPE-001**：三个入口只读报告真实写集对账或不可比原因。
  关联 FR-SCOPE-001。
判定方式：机器可判；判定时点：Phase 4 的包3实现与独立审查后。
落点：P4/T004 与 `phases/P4.md`。
验证：在完整采集路径构造匹配、漏报、多报；再分别移除参数、起点和完整范围。
环境与数据：真实 Git 工作区、当前 Phase 起点、既有采集器和三个生产入口。
谁判：独立测试执行者，另由阶段审查读者确认能读到同一事实。
承接：P4/T004 首判及 `quality/tests/write-set-reconciliation.output`。
成本：executor=独立测试执行者；estimate_min=30（规划估算）；
  hard_cap_min=70；resources=现有工作区、受控改动文件、采集器与检查器；
  observation=实参、对账投影、退出码和读取范围；retry_cap=1；evidence_tier=命令级。
资源来源：在受控工作区制造可删除的真实改动，不注入伪造全集。
为什么不能再简：算法单测不能证明三个入口传参、裁剪前范围和退出保持。
通过：可比路径显示正确差异，受限等路径带原因不可用，差异不改错误或退出码。
失败：裁后名单冒可比、缺参报无差异、越权采集、最终读者读不到或退出语义改变。
证据：三入口实参与原输出、匹配/漏报/多报、各不可用负控和调用者对照。

- [ ] **AC-DECL-001**：完成声明按真实类型与身份读取，两个收敛入口语义一致。
  关联 FR-DECL-001。
判定方式：机器可判；判定时点：Phase 4 的包5实现与三阶段合法样本就绪后。
落点：P4/T005 与 `phases/P4.md`。
验证：删固定件、改错 kind、错任务、多动态引用、删方法字段并核真实判定变化。
用同一清单分别跑两个收敛入口，再让纯十列已收敛缺冷读。
环境与数据：七张现有步骤表、任务事实、真实原件、材料根唯一义务表。
谁判：独立测试执行者；三阶段方法读者确认合法路径可达。
承接：P4/T005 首判及 `quality/tests/declared-evidence.output`。
成本：executor=独立测试执行者；estimate_min=35（规划估算）；
  hard_cap_min=80；resources=现有步骤表、任务事实与受控隔离夹具；
  observation=完成状态、具名缺口、两入口结论和退出；retry_cap=1；evidence_tier=命令级。
资源来源：复用当前步骤与既有原件；无合同的目录保留 owner 缺口，不造空文件。
为什么不能再简：只看 JSON 回显或一个入口会漏掉类型分派、身份和双 reader 漂移。
通过：合法具名与唯一动态引用可完成，坏类型和错身份失败，目录与生产者自述不盖缺口。
失败：目录可满足完成、多引用取最新、缺字段静默回落、两入口同清单结论不同。
证据：两入口报告与退出、六个动态槽事实行、三阶段义务读取及逐条目录去向。

- [ ] **AC-DIST-001**：真实安装包含所需检查与命令，失效和未跑边界清楚。
  关联 FR-DIST-001。
判定方式：需真实环境，可用自动化采集判；判定时点：Phase 5 发布实现后。
落点：P5/T006 与 `phases/P5.md`。
验证：在真实干净安装根跑无参自检和四个文档命令，删除必需检查器后复跑。
七类公共入口分别给正常例与非法 action 负控；真实条件缺失时具名不可用。
环境与数据：当前发布产物、锁定依赖、真实 npm 安装、realpath 后的运行器路径。
谁判：独立发布测试执行者，区分门禁、advisory 和经确认的具名未跑。
承接：P5/T006 首判及 `quality/tests/installed-release.output`。
成本：executor=独立发布测试执行者；estimate_min=40（规划估算）；
  hard_cap_min=90；resources=发布清单、包锁文件、npm 缓存或可用安装环境；
  observation=安装输出、逐项检查、退出与恢复；retry_cap=1；evidence_tier=真实环境级。
资源来源：现有发布器与依赖；真实安装不可用时记不可用，不以投影替代通过。
为什么不能再简：清单或构建成功不能证明安装后子进程及其隐藏依赖可运行。
通过：正常安装自检成功且逐项报告，删除必需件非零并点名，恢复后同命令成功。
七类入口各有正常与负控结论，四文档命令各有独立原件；不可得项带原因不可用。
失败：只改文档、缺件静默跳过、advisory 被当门禁、入口漏验或四命令证据混入一份。
证据：真实安装与运行输出、发布差、删除/恢复负控、七类矩阵和四份命令调用原件。

- [ ] **AC-EVID-001**：验收证据校验与风险接受进入既有终末消费点。
  关联 FR-EVID-001。
判定方式：需真实环境，可用自动化采集判；判定时点：Phase 5 终末链接线后。
落点：P5/T007 与 `phases/P5.md`。
验证：合法与坏验收证据进入真实终末链，并以去掉校验调用的变异作负控。
风险接受绑定当前审查、发现和真实答复，再测未答与错发现。
环境与数据：真实任务、终末条目、当前审查与发现、有效用户答复原件。
谁判：独立测试执行者与收口读者；实施者不得自签接受。
承接：P5/T007 首判及 `quality/tests/acceptance-evidence-and-risk.output`。
成本：executor=独立测试执行者；estimate_min=25（规划估算）；
  hard_cap_min=60；resources=现有终末链、校验器、风险接受函数和真实答复；
  observation=坏证据拒绝、未完成结论和接受绑定；retry_cap=1；evidence_tier=真实环境级。
资源来源：复用当前审查与发现；有效答复未产生时该效果条件保持未完成。
为什么不能再简：直接单测校验器不能证明生产链调用，也不能证明风险接受被读取。
通过：合法证据可消费，坏证据不冒通过，有效接受被收口读取，无效答复不被接受。
失败：校验只存在测试中、变异后仍拒绝、未答或错发现被视为有效接受。
证据：终末原始报告、正负例、变异负控、风险接受原件与当前审查绑定。

- [ ] **AC-SCHEMA-001**：旧 validateSchema 实现退出，结果结构合同仍可读。
  关联 FR-SCHEMA-001。
判定方式：机器可判；判定时点：Phase 5 旧实现退役及受影响调用清理后。
落点：P5/T008 与 `phases/P5.md`。
验证：按旧模块路径和符号调用应失败；读取并解析保留的结果 schema。
在真实 record-route 分别写合法与坏记录，并以去掉结果 schema 守卫作变异负控。
历史样本兼容范围由原 owner 单列，旧实现不得被重新接入。
环境与数据：当前工作区、旧实现原路径、保留 schema、既有审查记录样本。
谁判：独立测试执行者与审查合同读者。
承接：P5/T008 首判及 `quality/tests/schema-retirement.output`。
成本：executor=独立测试执行者；estimate_min=20（规划估算）；
  hard_cap_min=50；resources=现有 schema、记录样本与 Node；
  observation=旧入口错误、schema 可读和写链导入；retry_cap=1；evidence_tier=命令级。
资源来源：复用现有 schema 与真实历史样本，不新建第二生产校验器。
为什么不能再简：只删文件不核保留合同与调用方，会留下断链或误删数据合同。
通过：旧实现入口失效，结果 schema 可解析且仍发布。
record-route 合法记录可写、坏记录被拒，去掉守卫后坏记录在变异中可写以证明负控有效。
失败：旧入口仍可用、schema 不可读、写前守卫缺失或变异无效、历史缺口被隐藏。
证据：旧入口失败、schema 读取、record-route 正负例与变异、历史样本限制。

- [ ] **AC-RETIRE-001**：三批纠正与退役退出真实旧面，替代、历史和恢复均成立。
  关联 FR-RETIRE-001。
判定方式：机器可判；判定时点：Phase 6 每批实现后分别首判，批次末汇总。
落点：P6/T009–T011 与 `phases/P6.md`。
验证：按批跑具名测试；旧文件路径报模块不存在，活文件不再含已退声明。
在隔离工作区做删除与恢复，误删活门面必须被合同测试发现。
环境与数据：Git 原字节、冻结名单批准、真实历史清单与经验候选、当前生产接线。
谁判：独立测试执行者；冻结断言另由原测试 owner 与独立审查者批准。
承接：P6/T009–T011 各批首判；对象恢复与预算声明分别留独立输出。
  路径为 `quality/tests/retirement-recovery.output`、`quality/tests/budget-declarations.output`。
成本：executor=独立测试执行者；estimate_min=40（规划估算）；
  hard_cap_min=90；resources=现有登记、测试、Git 对象库和隔离工作区；
  observation=旧入口失败、替代可用、历史读取与恢复哈希；retry_cap=1；evidence_tier=命令级。
资源来源：复用现有历史样本与 Git 字节，不搬归档、不保存目录快照。
为什么不能再简：登记或静态搜索不能证明旧入口失效、活链保留和误删可恢复。
通过：三批各过受影响测试，旧入口真退、替代可用、历史可读、恢复字节一致。
phase_budget 与 acceptance_cost_total 保留；execution_budget 可选人读，retry_reserve 并入策略。
失败：误删 change-scope、保留字段或活链，强制可选字段，未经批准改断言或恢复不一致。
证据：三批删前/删后/恢复输出、登记与测试差异、历史读取和恢复哈希。
  T011 独立证据为 `quality/tests/budget-declarations.output`。

- [ ] **AC-CLOSE-001**：收口报告对当前对象、版本与四合同作可回读两态判定。
  关联 FR-CLOSE-001。
判定方式：只能人读；判定时点：前六阶段完成、当前提交和证据固定后。
落点：P7/T012 与 `phases/P7.md`。
验证：独立者读取 P1 开工分配，再流式消费 `git ls-files -z` 并与审计对象键归并。
只留范围摘要、差集和哈希，并核开工至收口的 Phase/Task/AC 分配差异。
当前对象树不得保存完整清单；历史变更由不带目录 pathspec 的 `git diff --name-only` 归并。
开工提交与快照绑定读 `quality/evidence/decision-maker/p08/card.md:35`。
四合同与六原则按 P7 的具体行复读；旧哈希、第三态、裸包号和无读者作负控。
环境与数据：最终提交、四份开工审计、对象清单、前六阶段原件和真实合同读者。
谁判：未参与收口报告写作的独立验收者，逐条签可读结论与限制。
承接：P7/T012 及 `closeout-report.md` 的对象、差异、版本和四合同各节。
成本：executor=独立验收者；estimate_min=45（规划估算）；
  hard_cap_min=100；resources=当前 Git 树、开工快照、哈希工具与质量原件；
  observation=差异归包、逐件字节和合同读取；retry_cap=1；evidence_tier=命令级加人读。
资源来源：全部复用当前工程与任务原件，不新建枚举器或整树清单。
为什么不能再简：只读审计或汇总不能发现新增、改版、消失和同名异内容。
通过：纳入完成声明的每对象只有与其证据一致的一种处置，版本同版，四合同有真实读者。
任何未决对象都另列缺口并使本项不通过，不以第三态计入完成。
失败：缺口冒充第三态通过、旧证据冒当前、漏来源、差异回错包或合同只有栏位。
证据：计数与差异名单、逐件哈希、四合同读取回执和独立复核记录。

- [ ] **AC-PRIN-001**：六条原则逐条证明独立作用、人工替代和撤回条件。
  关联 FR-PRIN-001。
判定方式：只能人读；判定时点：Phase 7 原则表定稿前及独立复核时。
落点：P7/T013 与 `phases/P7.md`。
验证：原则维护者与独立读者逐条核目标坏例、相邻正常场景、消费者和撤回动作。
以无候选变化的二手建议、重复强制和只有一般收益的描述作负控。
环境与数据：六条原则原出处、本任务真实改动、当前消费者与失败原件。
谁判：原则维护者负责内容，独立验收者按同一协议复核，不由作者自判。
承接：P7/T013 及 `closeout-report.md` 的原则证据表。
成本：executor=原则维护者与独立验收者；estimate_min=25（规划估算）；
  hard_cap_min=60；resources=现有原则、真实流程案例与消费原件；
  observation=坏例区分、人工替代与撤回动作；retry_cap=1；evidence_tier=人读原件。
资源来源：复用本任务六个阶段的真实案例；缺真实作用的原则不写成保留。
为什么不能再简：只列原则收益不能证明它独立改变行为，也不能指导撤回。
通过：每条保留或退出均有独立证据、被替代人工动作和可执行撤回条件。
失败：无人消费、重复已有规则、只有一般收益、缺撤回条件或未经确认退出责任点。
证据：六条原则证据表、目标坏例与相邻场景、维护者决定和独立复核。

- [ ] **AC-FINAL-001**：独立完整验收覆盖九条需求与全部前序验收。
  关联 FR-FINAL-001。
判定方式：只能人读；判定时点：全部实施、局部首判和必要修复完成后。
落点：P7/T014 与 `phases/P7.md`；主检查命令由该 Phase 给出。
验证：独立验收者逐条从需求到功能、任务、真实输出回读，核全部反例与限制。
对缺当前版本、缺真实条件或未闭环的项执行必要补跑；仍缺则具名不通过。
环境与数据：最终工作区与提交、前六阶段唯一原件、当前规格和七份 Phase。
谁判：未参与任何实施与材料写作的独立验收者；主会话只汇总真实结论。
承接：P7/T014、`quality/tests/independent-full-acceptance.md` 与最终收口报告。
成本：executor=独立验收者；estimate_min=60（规划估算）；
  hard_cap_min=120；resources=全部前序原件、真实 CLI、必要安装与用户答复；
  observation=逐条验收结论、负控和未覆盖项；retry_cap=1；evidence_tier=真实环境级加人读。
资源来源：优先复用同版同范围原件，只补必要未闭环案例，不重复全量回归。
为什么不能再简：单份汇总或局部通过不能证明九条需求与所有异常面均闭环。
通过：每条验收有当前真实结果、独立结论与证据，必要负控有效，缺口未被写成通过。
失败：只交摘要、旧版绿灯冒当前、任一需求无承接、任一适用反例未判或失败被掩盖。
证据：逐条验收矩阵、真实命令与阅读原件、补跑结果、覆盖限制和最终独立结论。

## Appendix B — 需求与编号对照

本表是正文中文编号与机器编号的唯一对照。
任务编号在整个计划中连续，Phase 文件只展开对应任务正文。

| 正文编号 | 机器编号 | 说明 |
| --- | --- | --- |
| 需求 1 | R-001 | 全部对象真实去向 |
| 需求 2 | R-002 | 同包材料进入计划 |
| 需求 3 | R-003 | 审查效果问题 |
| 需求 4 | R-004 | 写集只报告 |
| 需求 5 | R-005 | 默认版本与退役 |
| 需求 6 | R-006 | 四合同真实读者 |
| 需求 7 | R-007 | 原则可证伪可撤回 |
| 需求 8 | R-008 | 独立真实入口验收 |
| 需求 9 | R-009 | 当前枚举与边做边验 |
| 场景 1 | SCN-001 | 同包首卡 |
| 场景 2 | SCN-002 | 审查效果与角度 |
| 场景 3 | SCN-003 | 默认与轻量路线 |
| 场景 4 | SCN-004 | 写集可比与不可比 |
| 场景 5 | SCN-005 | 声明与实物 |
| 场景 6 | SCN-006 | 干净安装 |
| 场景 7 | SCN-007 | 终末证据与风险接受 |
| 场景 8 | SCN-008 | 旧实现退役 |
| 场景 9 | SCN-009 | 三批退役恢复 |
| 场景 10 | SCN-010 | 当前收口 |
| 场景 11 | SCN-011 | 原则判定 |
| 场景 12 | SCN-012 | 最终完整验收 |
| 事实 1 | PFACT-001 | 八包已确认 |
| 事实 2 | PFACT-002 | 专业合同已读 |
| 事实 3 | PFACT-003 | 审计只是快照 |
| 事实 4 | PFACT-004 | 静态缺口待复验 |
| 事实 5 | PFACT-005 | 项目库存与 UI 适用性未知 |
| 功能需求 1 | FR-MAT-001 | 同包材料消费 |
| 功能需求 2 | FR-REV-001 | 审查效果与角度 |
| 功能需求 3 | FR-CONV-001 | 默认版本 |
| 功能需求 4 | FR-SCOPE-001 | 写集对账 |
| 功能需求 5 | FR-DECL-001 | 声明读取 |
| 功能需求 6 | FR-DIST-001 | 安装发布 |
| 功能需求 7 | FR-EVID-001 | 终末证据与风险接受 |
| 功能需求 8 | FR-SCHEMA-001 | 旧校验实现退出 |
| 功能需求 9 | FR-RETIRE-001 | 三批退役纠正 |
| 功能需求 10 | FR-CLOSE-001 | 当前对象与四合同 |
| 功能需求 11 | FR-PRIN-001 | 原则证据 |
| 功能需求 12 | FR-FINAL-001 | 完整独立验收 |
| 验收 1 | AC-MAT-001 | 同包首卡验收 |
| 验收 2 | AC-REV-001 | 审查全链验收 |
| 验收 3 | AC-CONV-001 | 默认路线验收 |
| 验收 4 | AC-SCOPE-001 | 写集验收 |
| 验收 5 | AC-DECL-001 | 声明验收 |
| 验收 6 | AC-DIST-001 | 安装验收 |
| 验收 7 | AC-EVID-001 | 终末证据验收 |
| 验收 8 | AC-SCHEMA-001 | 旧实现退出验收 |
| 验收 9 | AC-RETIRE-001 | 退役恢复验收 |
| 验收 10 | AC-CLOSE-001 | 当前收口验收 |
| 验收 11 | AC-PRIN-001 | 原则验收 |
| 验收 12 | AC-FINAL-001 | 全量最终验收 |
| 风险 1 | RISK-01 | 半接线 |
| 风险 2 | RISK-02 | 共享写冲突 |
| 风险 3 | RISK-03 | 假绿 |
| 风险 4 | RISK-04 | 真实环境缺口 |
| 风险 5 | RISK-05 | 误删与冻结测试 |
| 风险 6 | RISK-06 | 版本与包号漂移 |
| 风险 7 | RISK-07 | 最终只读摘要 |
| 未决 1 | OPEN-01 / OI-01 | 旧材料是否重绑 |
| 未决 2 | OPEN-02 / OI-02 | 对象粒度已关闭 |
| 未决 3 | OPEN-03 / OI-03 | 原则责任点退出 |
| 未决 4 | OPEN-04 / OI-04 | 开工台账 |
| 未决 5 | OPEN-05 / OI-05 | 三合同缺口 owner |
| 未决 6 | OPEN-06 / OI-06 | 审查分级范围 |
| 未决 7 | OPEN-07 / OI-07 | 历史审查兼容 |
| 未决 8 | OPEN-08 / OI-08 | 安装具名未跑 |
| 未决 9 | OPEN-09 / OI-09 | 冻结测试批准 |
| 未决 10 | OPEN-10 / OI-10 | 经验机器投影 |
| 未决 11 | OPEN-11 / OI-11 | 风险接收入口 |
| 未决 12 | OPEN-12 / OI-12 | 预算字段指向 |
| 未决 13 | OPEN-13 / OI-13 | 方法技能去向 |
| 未决 14 | OPEN-14 / OI-14 | 别名与报告模式 |
| 未决 15 | OPEN-15 / OI-15 | 风险接受证据 |
| 未决 16 | OPEN-16 / OI-16 | 旧校验实现退出 |
| 未决 17 | OPEN-17 / OI-17 | 预算分支条件 |
| 未决 18 | OPEN-18 / OI-18 | 原则完整证据 |
| 未决 19 | OPEN-19 | 项目库存与 UI 适用性待核 |
| 任务 1 | T001 | 同包材料接入 |
| 任务 2 | T002 | 审查效果与预算分支 |
| 任务 3 | T003 | 默认版本与冷读 |
| 任务 4 | T004 | 写集对账 |
| 任务 5 | T005 | 声明读取 |
| 任务 6 | T006 | 安装发布与 repair 退役 |
| 任务 7 | T007 | 验收证据与风险接受 |
| 任务 8 | T008 | 旧校验实现退出 |
| 任务 9 | T009 | 登记纠正 |
| 任务 10 | T010 | 真死对象退役 |
| 任务 11 | T011 | 预算字段声明退役 |
| 任务 12 | T012 | 当前对象版本与四合同 |
| 任务 13 | T013 | 原则证据 |
| 任务 14 | T014 | 独立完整验收 |

需求索引是只读方向快照，build-plan 不再写入或重排其答复。
当前验收与功能映射以 Appendix A、Appendix 本附录为准。
当前新增问答以 `quality/evidence/build-plan/spec-clarify.md` 为准。
来源限制：decision-log:450-451 的决定索引重复，`:557` 的“未决14项”与
`:424-441` 实际18行不一致；以实际18行和现行决定正文为准，owner 为方向材料作者。
本规格另列 OPEN-19 库存缺口；build-plan 不改 decision-log，也不冒称上述源文本已修。
旧 AC 与决定编号只读保留，以下映射不改变历史原义。

- 旧 AC-01 → AC-RETIRE-001、AC-CLOSE-001、AC-PRIN-001、AC-FINAL-001。
- 旧 AC-03 → AC-MAT-001、AC-CONV-001；旧 AC-04 → AC-REV-001。
- 旧 AC-05 → AC-SCOPE-001；旧 AC-07 → AC-REV-001、AC-CONV-001、AC-RETIRE-001。
- 旧 AC-08 → 当前十二项验收，由 AC-FINAL-001 负责独立聚合。
- D-01 → FR-MAT-001／AC-MAT-001；D-02 → FR-REV-001／AC-REV-001。
- D-03 → FR-SCOPE-001／AC-SCOPE-001；D-04 → FR-CONV-001／AC-CONV-001。
- D-05 → FR-DECL-001／AC-DECL-001；D-06 → FR-RETIRE-001／AC-RETIRE-001。
- D-07 → FR-DIST-001、FR-EVID-001、FR-SCHEMA-001 及其同名 AC。
- D-08 → FR-CLOSE-001、FR-PRIN-001、FR-FINAL-001 及其同名 AC。
- reviewTier → 后续任务六；owner=审查域负责人。当前函数只有测试消费者，
  生产固定 OCR，且缺 risks/scope/readings 的真实生产者；本任务不新增输入合同。
  输入 producer、recordTaskReview 分派、recordSimpleReviewRequest 写前 assert 及正负例均后续承接。
- R-001 包归属：包1→P1/T001；包5→P4/T005；包6→P6/T009–T011；
  包8→P7/T012–T014。对象收口不得以旧索引缺少包1为由漏掉该归属。

五件原文口径来自 p01 卡与设计，不由当前计划另造替代材料。
以下每项都必须绑定当前任务、包号、讨论批次、卡节及卡节哈希。

- 方案卡：清单指向的本包卡节及摘要；整份日志、旧卡节和总确认不代替。
- 质询：本包五段讨论原件或锚点，含展示、复述、用户原话和批次。
- 冷读：清单指向的当前冷读原件及摘要；首轮旧件只作历史对照。
- 对抗：本包九问、阻塞项和处置记录，并绑定本包卡版与批次。
- 真实答复：本包用户原话原件或独立锚点；设计者复述和聊天回执不代替。

以下 PFACT 是唯一事实与假设记录；状态字段互斥。

- **PFACT-001**：status=verified；evidence=当前 decision-log 第3至5段及 U-021至U-028。
  affected=FR-MAT-001 至 FR-FINAL-001；AC-MAT-001 至 AC-FINAL-001。
- **PFACT-002**：status=verified；evidence=后端、接口、验收专业源的版本与真实接缝。
  affected=FR-SCOPE-001、FR-EVID-001、FR-DIST-001；
  AC-SCOPE-001、AC-EVID-001、AC-DIST-001。
- **PFACT-003**：status=verified；evidence=归档 PRD:272-284 与包8卡附录 A。
  affected=FR-CLOSE-001、FR-FINAL-001；AC-CLOSE-001、AC-FINAL-001。
- **PFACT-004**：status=inferred；inference=卡与 design 记录的静态现状，实施后须复验。
  限制=本规格未运行代码、测试、真实审查或安装。
  affected=FR-MAT-001至FR-FINAL-001；AC-MAT-001至AC-FINAL-001。
- **PFACT-005**：status=unknown；unknown=project_inventory 的可核 source_ref 尚未取得。
  owner=项目库存 owner；恢复条件=提供真实库存来源并核页面消费者。
  affected=FR-MAT-001至FR-FINAL-001；AC-MAT-001至AC-FINAL-001；关联 OPEN-19。
  当前写集无前端，但浏览器与项目库存不得据此写成不适用。

以下 FR 是唯一功能需求与来源绑定记录。
`source_status=current`；D 编号是当前 decision-log 决定，不是新增 ADR。

- **FR-MAT-001**：source=R-001、R-002、R-008、R-009、U-021、CARD-p01；decision=D-01。
  关联 PFACT-001、PFACT-004；SCN-001；AC-MAT-001；P1/T001。
  行为是开工对象枚举分配、五件同包读取、缺件退回与独立首卡；不新增进度账。
- **FR-REV-001**：source=R-003、R-005、R-008、U-022、CARD-p02；decision=D-02、F4。
  关联 PFACT-001、PFACT-004；SCN-002；AC-REV-001；P2/T002。
  行为是效果问题、受控角度、多贡献保留和计划预算分支；其它阶段不新增强制角度。
- **FR-CONV-001**：source=R-005、R-008、U-016、U-025、CARD-p04；decision=D-04。
  关联 PFACT-001、PFACT-004；SCN-003；AC-CONV-001；P3/T003。
  行为是复杂与普通新版、小改一卡一次冷读、历史只读与公开失败传播。
- **FR-SCOPE-001**：source=R-004、R-008、U-018、U-023、CARD-p03；decision=D-03。
  关联 PFACT-002、PFACT-004；SCN-004；AC-SCOPE-001；P4/T004。
  行为是裁剪前范围三入口接线与只报告，不扩大读权或改退出。
- **FR-DECL-001**：source=R-001、R-008、R-009、U-024、CARD-p05；decision=D-05。
  关联 PFACT-002、PFACT-004；SCN-005；AC-DECL-001；P4/T005。
  行为是具名件、动态身份、类型比较、三阶段义务与两个收敛 reader 对齐。
- **FR-DIST-001**：source=R-008、R-009、U-027、CARD-p07；decision=D-07。
  关联 PFACT-002、PFACT-004；SCN-006；AC-DIST-001；P5/T006。
  行为是真实安装闭包、门禁与未跑报告、文档命令和 repair 退役。
- **FR-EVID-001**：source=R-006、R-008、U-019、U-027、CARD-p07；decision=D-07、F2。
  关联 PFACT-002、PFACT-004；SCN-007；AC-EVID-001；P5/T007。
  行为是终末验收证据校验与风险接受真实读取，不接旧 validateSchema。
- **FR-SCHEMA-001**：source=R-001、R-005、R-008、U-027、CARD-p07；decision=D-07、F3。
  关联 PFACT-002、PFACT-004；SCN-008；AC-SCHEMA-001；P5/T008。
  行为是旧实现入口退出、结果 schema 保留、record-route 写前守卫与历史限制披露。
- **FR-RETIRE-001**：source=R-001、R-005、R-008、U-020、U-026、CARD-p06；decision=D-06。
  关联 PFACT-001、PFACT-004；SCN-009；AC-RETIRE-001；P6/T009–T011。
  行为是三批纠正、真死退出、预算声明按真实消费者修正和恢复；change-scope 保留。
  phase_budget/acceptance_cost_total 保留，execution_budget 可选人读，retry_reserve 并入策略。
- **FR-CLOSE-001**：source=R-001、R-006、R-008、R-009、U-028、CARD-p08；decision=D-08。
  关联 PFACT-003、PFACT-004；SCN-010；AC-CLOSE-001；P7/T012。
  行为是当前枚举、两态、逐件版本与四合同读取；不在验收阶段修代码。
- **FR-PRIN-001**：source=R-007、R-008、U-028、CARD-p08；decision=D-08、F5。
  关联 PFACT-003、PFACT-004；SCN-011；AC-PRIN-001；P7/T013。
  行为是六原则的独立作用、人工替代、撤回与真实消费者判定。
- **FR-FINAL-001**：source=R-001至R-009、U-004、U-028、CARD-p08；decision=D-01至D-08。
  关联 PFACT-001至PFACT-005；SCN-012；AC-FINAL-001；P7/T014。
  行为是独立消费全部前序原件、必要补跑、披露限制与不掩盖缺口。
