# Phase P1 — 临时工作命令会回收，并保住原始证据

本文件给本段唯一开发writer、独立测试/审查者和下游消费者。
Phase是可独立交付验收的一段；当前只写未确认草稿，不保存执行状态。
全局目标和唯一验收见spec.md；本文件只写本段增量与可执行协议。

## 哪些节必须写，哪些可以省？

本段必要章节均written，具体输入和动作在下文；唯一末验收节不适用。
机器标签和精确路径/命令保原字面，属于材料行宽例外。

| 章节组 | 当前安排 |
| --- | --- |
| 结果/验收/依据/读源 | written；当前输入和验收首判在本段 |
| 文件责任/验证/任务卡/机器字段 | written；同一writer和同一判定器 |
| 下一消费者 | written；只列本段实际交付 |
| 验收Phase专属检查 | not-applicable；唯一末段为P6 |

## 这一 Phase 交出什么？

临时工作命令会回收，并保住原始证据，让所有后续临时夹具作者、P4发布作者与独立验收者拿真实产物继续。

- **本 Phase 结果**：原方法让下一作者先分类再创建，并把命令、清理和失败保全作为同一增量交付。
- **非目标**：只证明本任务新产临时工作命令的消费与回收边界；不证明历史残留规模/磁盘节省，不重做provider TTL或正式证据清理。简单优先取现owner复用或窄接线，不加控制面。
- **改动前**：temp-dir已有完整同步owner与受控回收；作者只有泛称“临时目录清理”，没有明确分类和消费范式。
- **改动后**：原方法让下一作者先分类再创建，并把命令、清理和失败保全作为同一增量交付。
- **与相邻 Phase 的边界**：输入是已合主线当前源；本段可独立验收，P4消费已交付接口/方法。
- **主要风险**：把交付包或provider packet当scratch删除；返工时收窄到已记录的本任务新产可再生路径，默认保留未知项。
- **下一步**：下游按“下一消费者”节读真实交付和限制。
- **动手前必读**：runtime/interface/temp-dir.mjs:45–127；tests/contract/temp-dir.test.mjs:10–95；spec-plan现Design and boundary；Phase模板场景/夹具和停止/恢复；研究004:10–39、70–99。
- **未决事实**：当前计划/预算未确认；真实执行资源在本段开工核，缺项回具名owner。

## 这一 Phase 怎么验收？

本段独立首判spec Appendix A所指验收，不把效果推到最终段。

成本账：验收11活动20 + 验收10本段首读5 + 共享准备5 + 重验预留5 = 35活动分钟。
逐条七字段及资源来源由spec Appendix A承载，本处只重算本段。
资源账：现temp-dir、真实Node进程、当前任务专用前缀和隔离父根；没有用户数据；原始stdout从开始capture到任务库。
范围账：本段只判断临时工作命令会回收，并保住原始证据；最终组合和其余AC只交供件。
`phase_budget={soft_min:unknown,hard_min:unknown,variance_threshold:unknown,source:provisional proposal}`。
`execution_budget={window_minutes:unknown,command_cap:unknown,wait_cap:unknown,retry_reserve:unknown}`。
预算和S/M/L仍提案，未取得真实来源，不能填模板120/240/1.5。
用户等待、审查等待、环境等待各记实际owner/来源/恢复，与活动分钟分账。
本段非UI：只消费CLI/方法/文件和隔离进程，不观察页面或样式。

1. 验收标准：只引用Appendix A的本段首判，判定器见任务卡；不重写第二份通过/失败。
2. 场景：正常退出；目标断言失败；SIGINT/SIGTERM保原signal/exit；受控SIGKILL后下次足龄死PID回收；
并发活PID/权限不明PID不删；TMPDIR别名与任意符号链根；目录被替换；交付包/原始失败/provider-TTL保留。
3. 环境与数据：现temp-dir、真实Node进程、当前任务专用前缀和隔离父根；没有用户数据；原始stdout从开始capture到任务库。
搭建和清理同作用域，原始输出留任务库。
4. 用例与预期：正常及每个具名反例走下文同一范围命令；有效RED须到目标assertion，GREEN后独立按原AC判效果。
5. 谁判与承接：开发通知实现就绪后，主会话才派不同上下文只读测试/审查；所有后续临时夹具作者、P4发布作者与独立验收者消费原件。
6. 失败回修与重验：独立消费者找不到同进程入口、清理改变业务失败、误删未知字节或现helper反例不满足时，停止该回收路径；回P1原writer修方法/测试，
底座真缺口先回材料owner核写集，原错误不删。同一原writer修，受影响独立方只复验原问题及最小回归。

## 为什么现在做，依据是什么？

temp-dir已有完整同步owner与受控回收；作者只有泛称“临时目录清理”，没有明确分类和消费范式，因此本段交付有当前消费者。
全局需求与取舍沿decision-log及spec，不在这里重开方向或替用户批准。
来源是R-027、R-004；decision-log ADR-002/004，本段判据指向spec Appendix A。

## 开始前读什么？

先读spec全局设计与本段Appendix A，再按以下真实锚点看首改和反例。
runtime/interface/temp-dir.mjs:45–127；tests/contract/temp-dir.test.mjs:10–95；
spec-plan现Design and boundary；Phase模板场景/夹具和停止/恢复；研究004:10–39、70–99。
这些源由作者2026-11-16用read/grep实读；精确签名/字段逐字清单在spec代码锚点。
任务库两份研究004/005只提供导航，关键接口仍读当前源。
禁止范围的原始合同取当前源，不把历史摘要冒现实现。

## 每个文件由谁改，先做什么？

本段唯一开发writer按下表逐文件交付，审查和测试只读。
路径是未来实施写集，本轮没有修改这些生产/测试/方法文件。

| 路径 | 动作类别与责任 | 真实消费者/输入 |
| --- | --- | --- |
| `skills/spec-plan/SKILL.md` | modify；在原Design and boundary/Test design and quality指明四类生命周期及作者交付义务；保原合同和首判 | 本段唯一writer；所有后续临时夹具作者、P4发布作者与独立验收者，输入见本段真实源 |
| `skills/spec-plan/templates/phase-template.md` | modify；在场景/夹具、输出/失败、停止/恢复现字段加入可执行同进程范式及崩溃恢复反例，不加字段 | 本段唯一writer；所有后续临时夹具作者、P4发布作者与独立验收者，输入见本段真实源 |
| `workflows/build-plan/SKILL.md` | modify；原第6/7步调用当前作者规则，要求独立消费者实跑；只导航不复制规则 | 本段唯一writer；所有后续临时夹具作者、P4发布作者与独立验收者，输入见本段真实源 |
| `tests/contract/phase-scratch-lifecycle.test.mjs` | new；消费真实temp-dir和当前方法包，加入正常/异常/可捕获取消/死PID/符号链接及原件保全反例 | 本段唯一writer；所有后续临时夹具作者、P4发布作者与独立验收者，输入见本段真实源 |

- **新增**：`tests/contract/phase-scratch-lifecycle.test.mjs`。
- **修改**：`skills/spec-plan/SKILL.md`；`skills/spec-plan/templates/phase-template.md`；`workflows/build-plan/SKILL.md`。
- **退役**：N/A — 现temp-dir继续承接，不删底座。
- **禁止改动**：spec全局禁止写集；本段尤其不改runtime/interface/temp-dir.mjs及provider TTL owner，已有owner承接。

本段与其它交付的结果独立，但新增测试/生产文件须先登记同一move-map，依真实前后writer串行。
共享登记先写者为本段，P2拿当前move-map及本段生命周期规则后续写；模板由本段先交当前规则，P4测试作者消费同进程临时范式；
真实helper接口保持原owner。
冲突回本段原writer修自己hunk；未知状态如实保unknown，禁整树恢复或另建锁账本。
新文件逐项职责/consumer见表；生产新文件先登记move-map再实现。
替代与删除条件：仅当本表实际消费者均已由经独立核验的替代承接后退役，历史原件保留。

新增文件创建前先由本段writer修改`docs/architecture/move-map.json`，
登记上表新增项的职责、实际consumer、测试和全部consumer迁移后的删除条件。
本段写主独占该登记动作；不新增另一份职责账本。

## 怎么验证？

先冻结本段目标行为，再用同一命令保存RED/GREEN；独立消费才给效果结论。

```bash
node node_modules/vitest/vitest.mjs run tests/contract/phase-scratch-lifecycle.test.mjs tests/contract/temp-dir.test.mjs
```

该命令是计划；具名预写测试按本轮授权补写，实际结果以后附原件为准，其它完整行为测试仍未执行，不冒RED或GREEN。
实施owner先落可收集目标测试，setup/导入/空收集故障只记原失败，不当目标RED。
新方法消费协议缺创建/使用/回收同作用域，独立作者产出的例子无法在失败后保护capture并回收；具名assertion检查该真实效果；
现helper已通过的部分保原基线，不强造RED。
独立作者实际运行的例子按Appendix A验收11的生命周期与保留规则呈现显式成功元素，坏归属/活PID/符号链接保留，原业务失败仍读得到。
自动检查只证其断言覆盖；独立方法/宿主消费者按Appendix A原条件复放。
S/M/L沿spec提案：本段S真实helper和本次受控进程，不是用户已选数据策略。
正式执行经task.captureCommand/appendRecord保存argv/cwd/exit/signal/time/raw-ref。
目标测试冻结后改断言走同卡TCR与独立批准；只读声明不冒物理隔离已建立。

## 每张任务卡怎么写？

本段只有一个用户可感知增量，同交付的创建、实现、测试与交接留在一张卡内。

### 任务 1：临时工作命令会回收，并保住原始证据

为什么做：temp-dir已有完整同步owner与受控回收；作者只有泛称“临时目录清理”，没有明确分类和消费范式，本卡按全局验收补消费者拿不到的结果。
交付什么：原方法让下一作者先分类再创建，并把命令、清理和失败保全作为同一增量交付；失败保具名原因和原始输出。
不做什么：只证明本任务新产临时工作命令的消费与回收边界；不证明历史残留规模/磁盘节省，不重做provider TTL或正式证据清理。
前置：无更早任务阻塞，可从已合主线当前源开始；当前草稿仍待计划真实确认。
怎么做：从上表第一条首改路径开始，按下面有序动作切穿真实输入、方法/接口、测试和消费者。
步骤1：先在原作者方法定位“选择最小方案”和场景/夹具字段，让作者逐项分类：可删scratch、最终交付包、正式原始证据、provider 
packet及其独立TTL。
步骤2：写同进程Node例子：从现temp-dir导入createTrackedTempDir，try中创建并消费，finally中dispose；
命令stdout/stderr从开始由task.captureCommand保存。不能把Node只用于输出路径后立刻退出再让shell消费。
步骤3：本任务专用前缀必须由已认证task身份与用途决定，并在当次capture记录真实canonical根和前缀；禁止把通用wh-或任意旧/tmp当回收范围。
SIGKILL残留无法即时清理，下次仅对本任务已记录新产命名空间调用cleanupStaleTempDirs。
步骤4：验证marker.owner/prefix/pid/uid/dev/ino与足龄边界，活PID/EPERM未知PID/换inode/符号链接保留；
默认24小时不是新任务TTL。受控测试可传olderThanMs和pidAlive，但真运行仍用真实PID探针。
步骤5：Node版本先实读；使用现同步helper，不默认Node24.4+专属API。TMPDIR可含平台别名，传root前realpath，
任意用户符号链根仍拒绝。
步骤6：独立作者none上下文从原方法接受本任务临时配置/发布负例，写一份普通执行片段并实际运行；只增加方法文字/静态字符串不能证明作者消费。
执行前保护本轮原始输出，取消先drain/provider settle，再dispose。
怎么验收：运行本卡范围命令并由独立上下文消费真实产物；效果按Appendix A，不把exit代效果。
证据：本卡RED/GREEN及独立消费原件放任务quality下，计划位置不冒已产出。
下游（含何时停）：所有后续临时夹具作者、P4发布作者与独立验收者读取现交付；独立消费者找不到同进程入口、清理改变业务失败、
误删未知字节或现helper反例不满足时，停止该回收路径；回P1原writer修方法/测试，底座真缺口先回材料owner核写集，原错误不删。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T001
- **来源 / FR / AC**：R-027、R-004；decision-log ADR-002/004；FR-C10-010、FR-C10-009；AC-C10-011、AC-C10-010；结果为临时工作命令会回收，并保住原始证据，失败和保留强度沿Appendix A。
- **输入**：当前spec/decision和已合主线具名源；producer为本段唯一writer，consumer为所有后续临时夹具作者、P4发布作者与独立验收者；独立测试在实现就绪后取得当前产物和原始输出。
- **文件 / 符号**：`skills/spec-plan/SKILL.md`；`skills/spec-plan/templates/phase-template.md`；`workflows/build-plan/SKILL.md`；`tests/contract/phase-scratch-lifecycle.test.mjs`；`docs/architecture/move-map.json`；符号：现方法Design and boundary、Phase场景/夹具及停止/恢复；新测试ORACLE-SCRATCH-LIFECYCLE（拟新增）。
- **动作**：从上表第一条首改路径开始，按下面有序动作切穿真实输入、方法/接口、测试和消费者。；步骤1：先在原作者方法定位“选择最小方案”和场景/夹具字段，让作者逐项分类：可删scratch、最终交付包、正式原始证据、provider ；packet及其独立TTL。；步骤2：写同进程Node例子：从现temp-dir导入createTrackedTempDir，try中创建并消费，finally中dispose；；命令stdout/stderr从开始由task.captureCommand保存。不能把Node只用于输出路径后立刻退出再让shell消费。；步骤3：本任务专用前缀必须由已认证task身份与用途决定，并在当次capture记录真实canonical根和前缀；禁止把通用wh-或任意旧/tmp当回收范围。；SIGKILL残留无法即时清理，下次仅对本任务已记录新产命名空间调用cleanupStaleTempDirs。；步骤4：验证marker.owner/prefix/pid/uid/dev/ino与足龄边界，活PID/EPERM未知PID/换inode/符号链接保留；；默认24小时不是新任务TTL。受控测试可传olderThanMs和pidAlive，但真运行仍用真实PID探针。；步骤5：Node版本先实读；使用现同步helper，不默认Node24.4+专属API。TMPDIR可含平台别名，传root前realpath，；任意用户符号链根仍拒绝。；步骤6：独立作者none上下文从原方法接受本任务临时配置/发布负例，写一份普通执行片段并实际运行；只增加方法文字/静态字符串不能证明作者消费。；执行前保护本轮原始输出，取消先drain/provider settle，再dispose。
- **输出 / 失败**：原方法让下一作者先分类再创建，并把命令、清理和失败保全作为同一增量交付；独立消费者找不到同进程入口、清理改变业务失败、误删未知字节或现helper反例不满足时，停止该回收路径；回P1原writer修方法/测试，底座真缺口先回材料owner核写集，原错误不删。
- **边界 / 禁止改动**：本段写集之外只读；全局底座/PRD/上游材料/旧报告不可写，防第二owner和历史漂白。
- **依赖**：none
- **测试层级 / 技能**：当前spec测试面；生命周期/方法消费；主技能backend-testing为build-plan预判，实际build-code按真实diff选；UI本段不适用，真实页面在P6。
- **场景 / 夹具或服务**：正常退出；目标断言失败；SIGINT/SIGTERM保原signal/exit；受控SIGKILL后下次足龄死PID回收；并发活PID/权限不明PID不删；TMPDIR别名与任意符号链根；目录被替换；交付包/原始失败/provider-TTL保留；搭建/清理同进程，原始输出外置。
- **预写测试**：实跑现helper的正常/异常/INT/TERM/KILL与保护基线；本轮测试回执另附。原本通过不算新增方法GREEN；独立作者按方法产命令/实际证据分离、足龄/标记替换/应用drain仍需具名原件。
- **可观察接缝**：独立作者实际Node进程的结束/保留结果，现helper是接缝；漏掉的范围见覆盖上限。
- **RED/GREEN 门禁命令**：`node node_modules/vitest/vitest.mjs run tests/contract/phase-scratch-lifecycle.test.mjs tests/contract/temp-dir.test.mjs`
- **预期退出码**：RED nonzero; GREEN 0；目标assertion到达前的setup错误不是RED。
- **RED 目标失败**：ORACLE-SCRATCH-LIFECYCLE；新方法消费协议缺创建/使用/回收同作用域，独立作者产出的例子无法在失败后保护capture并回收；具名assertion检查该真实效果；现helper已通过的部分保原基线，不强造RED。
- **RED 证据**：planned: `quality/tests/p1-t001-red.output`；未执行，后续本卡测试owner提供真实目标失败与源码/测试来源。
- **GREEN 判定器**：ORACLE-SCRATCH-LIFECYCLE；独立作者实际运行的例子按Appendix A验收11的生命周期与保留规则呈现显式成功元素，坏归属/活PID/符号链接保留，原业务失败仍读得到；具名反例不得被当成功。
- **证据**：planned: `quality/tests/p1-t001-green.output`；planned: `quality/evidence/p1-scratch-lifecycle-effect.md`；成本类别为命令级/文件级及独立语义读回，具体七字段见Appendix A。
- **覆盖上限**：只证明本任务新产临时工作命令的消费与回收边界；不证明历史残留规模/磁盘节省，不重做provider TTL或正式证据清理。
- **停止 / 恢复**：独立消费者找不到同进程入口、清理改变业务失败、误删未知字节或现helper反例不满足时，停止该回收路径；回P1原writer修方法/测试，底座真缺口先回材料owner核写集，原错误不删。
- **测试变更请求**：无已发生变更；新目标测试冻结后如需改断言，原writer交独立审查批准并保原oracle。
- **完成**：前置（不作完成条件）：范围命令可收集并留真实exit/raw。完成条件（只写效果）：独立执行者按Appendix A首判AC-C10-011、AC-C10-010的真实效果及反例，读回原件并交下游；语义未执行记incomplete并保判定者/协议/计划落点；当前计划未实施，不把本卡声明填成pass。

## 下一消费者拿什么继续？

所有后续临时夹具作者、P4发布作者与独立验收者取得本段真实当前字节、适用原件和未完成条件，再做自己的增量。
交同进程临时命令与四类生命周期规则；失败原输出留任务库，不能把它们放入scratch交付。
读不到具名产物时保具体owner/影响/恢复，不把来源摘要当执行证明。

## 任务编号怎样对照？

这里只定位本段卡片，不复制执行状态。

| 正文 | 机器编号 | 唯一交付 |
| --- | --- | --- |
| 任务1 | T001 | 临时工作命令会回收，并保住原始证据 |

## 机器字段（校验器用，人可跳过）

- **全局规格**：`spec.md#实现设计（全局权威）`
- **写入集**：`skills/spec-plan/SKILL.md`；`skills/spec-plan/templates/phase-template.md`；`workflows/build-plan/SKILL.md`；`tests/contract/phase-scratch-lifecycle.test.mjs`；`docs/architecture/move-map.json`
- **依赖**：none
- **消费者**：所有后续临时夹具作者、P4发布作者与独立验收者
- **gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/phase-scratch-lifecycle.test.mjs tests/contract/temp-dir.test.mjs`
- **oracle**：ORACLE-SCRATCH-LIFECYCLE
- **evidence_path**：planned: `quality/evidence/p1-scratch-lifecycle-effect.md`
- **STOP**：独立消费者找不到同进程入口、清理改变业务失败、误删未知字节或现helper反例不满足时，停止该回收路径；回P1原writer修方法/测试，底座真缺口先回材料owner核写集，原错误不删。
- **覆盖 AC**：AC-C10-011、AC-C10-010
- **Done**：前置（不作完成条件）：目标命令/原件可读。完成条件（只写效果）：AC-C10-011、AC-C10-010在本段由独立执行者按同一判据首次判断，效果/反例和原件引用逐条写任务facts；当前仅计划未执行，机器目标RED/GREEN未取得不报通过；语义判定未执行记incomplete，owner为本段独立测试/审查者，协议见验收节，计划证据为`quality/evidence/p1-scratch-lifecycle-effect.md`；外部资源不可得须具名原因与恢复。
