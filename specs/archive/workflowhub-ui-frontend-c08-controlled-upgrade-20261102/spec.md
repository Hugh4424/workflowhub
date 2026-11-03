# 功能规格：C08 规范与资产受控升级

本文件写给 C08 的实现者、独立测试与审查者、最终验收者和后续任务 owner。
读完要能定位首改文件、真实输入、正反判据、命令与失败恢复，不另猜产品决定。
本文件承载产品行为与全局实现设计；Phase 文件只写各包差异，索引只存指针。
产品目标来自父 PRD 的 C08 卡，方向与取舍来自当前决策日志。
本文件不替换这两份来源，也不把规格保存写成验收通过。

> 写作标准：`skills/material-writing/SKILL.md` 的「材料写作标准（唯一）」。
> 锁定例外：`## 实现设计（全局权威）` 与四个小节名保持原词。
> 判据唯一权威：Appendix A；机器编号对照：Appendix B。
> 状态：规格草稿；尚未取得计划确认；不宣称任何验收已执行。
> 行宽例外：代码锚点、命令、表格与机器绑定行按原字节保留。

材料导航：

- 先读「一页看懂」与「做成什么样」定位结果和落点。
- 实施者读「功能需求」「实现设计（全局权威）」与追踪表。
- 测试与审查者读「测试计划」与 Appendix A。
- 最终验收者读 Appendix A 与「风险和未决」。

## 这是什么，给谁用？

C08 不是页面交付，而是一次真实改动的受控升级。
它从 C03 留下的四个真实入口出发，把“代码已改”补到规范、使用点、测试、复验、后续任务和防跳步通道都跟上。
本任务同时改 PaperBuilder 与 WorkflowHub 两个交付域。
PaperBuilder 域负责五份正文、四入口使用同步、实盘台账源码与测试，以及A-D基础页面复验。
WorkflowHub 域负责步骤消费者、防跳步证据、外部方法和顺序回执。
两域的写集、证据和失败归属分开记，不混成一份执行结论。

读者是下一位实现者、独立测试与审查者、最终验收者、后续任务 owner。
实现者拿它找首改文件、输入、判据、命令与失败恢复。
审查者拿它核来源、边界、反例和证据强度。
最终验收者拿它逐条判 Appendix A。
后续任务 owner 拿它读 C08 更新后的规范版本并采用。

本文几个词先说明。
Phase 是可独立交付验收的一段工作。
oracle 是判真假的判定器。
RED 是改动前的目标断言失败。
GREEN 是同一断言改动后通过。
写集是允许修改的精确文件集合。
两层引用指直接使用点再沿引用查一层。

本文缩写也先说明。
PB 指 PaperBuilder 产品仓。
WH 指 WorkflowHub 工作树。
PRD 指父发布需求卡。
HEAD 指 Git 当前提交。
SLA 指采用时限。
TCR 指测试变更请求。
QA 指页面质量检查。
jsdom 指前端测试用的模拟浏览器环境。
CSS 指样式表；DOM 指页面节点树。
FR 指功能需求编号；AC 指验收编号；API 指接口；URL 指网络地址。
SKILL 指技能方法文件；AUDIT 指材料优化方法的审计模式；OPTIMIZE 指材料优化方法的改进模式。

本任务不接管 C03、C06、C07 的专业正文所有权。
本任务不改 C03 已确认的四个行为语义，只补规则、测试、使用点和最小修复。
本任务不新增外部包，不新增硬门或第二本进度账，不做完整浏览器 QA、无障碍和性能专项。
本任务不把模拟记录页并进来，它留给后续任务 C08-FU-01。

## 一页看懂：谁要什么结果，怎么算通过？

维护者要一条能证明“真实改动被规范、使用点、测试、复验和后续任务接住”的受控升级链。
实现者要能定位首改文件、真实输入、正反判据和失败恢复。
审查者要能看出哪些证据是真实使用、哪些只是文件存在。
最终验收者要能逐条判 12 条验收，不接受把静态文件或同义测试冒成运行通过。

13 条功能需求分五组。
第一组是影响面与规范回写：四个入口、两层消费者、五份正文、四对象、版本上抬。
第二组是代码与使用同步：四入口不重写已正确行为，只补缺口断言；实盘台账成为新消费者。
第三组是独立复验：定向测试、真实页面、独立审查和四个基础页面对象乘六维（24 格）的负例矩阵。
第四组是后续与失败：C08-FU-01 具名安排，五类失败分支保原事实。
第五组是流程与外部：防跳步完成通道、步骤卡内部口径、提问前取数、揭示材料、外部方法、顺序回执。

最大影响面是 PB 的五份规范正文、四个入口的测试与使用点、实盘台账的三处行为与样式，以及 WH 的步骤消费者和前端组件质量方法。
验收信号是 Appendix A 的 12 条判据；正文只给场景、落点和指针。
非目标是新组件库、新外部包、新硬门、全项目监听、完整浏览器 QA、无障碍与性能专项、模拟记录页实现。

## 为什么做，给谁用？

C03 已经把四个行为改进了代码，但规范、使用点、测试缺口和后续消费者没有一起跟上。
只靠代码会让下一位实现者不知道规则在哪、旧行为为什么改、哪些使用点会受影响。
C08 要把“改动”变成“可回读的规则、可复验的使用点和可交接的后续任务”。

本次执行还暴露了流程跳步。
用户要求在当前任务修复完成通道，而不是再加一段提醒。
于是 C08 增加了步骤消费者声明、76 步一致性检查、runner 读副本端到端、三个反例和 PRD 阶段卡支持。
这些要求只提高跳步被发现的概率，不承诺零跳步，也不新增硬门。

四个入口覆盖四类真实风险。
业务日志重置覆盖“筛选变化后旧详情残留”的状态风险。
工作台重试覆盖“定位失败后身份丢失”的恢复风险。
工作台焦点与抽屉几何覆盖“读宽时机不对导致定位被遮挡”的布局风险。
浮层长错误换行覆盖“窄屏长文本溢出”的边界风险。
实盘台账补一个真实新消费者，证明规则不只停在 C03 的两条链。

### 实现者为什么需要一张影响面表？

实现者改文件前要知道旧新行为、原负责人、直接使用点和一层间接使用点。
只查文件名会把“共享抽屉、焦点 hook、CSS owner、路由入口”漏掉。
影响面表让首改文件、禁止范围和未知项在同一处可读。

### 审查者为什么需要分开证据层？

源码、测试、真实页面和独立审查证明的事实不同。
jsdom 能证 DOM 与断言，不能证真实换行、可见焦点和计算几何。
CSS 文本断言只证源码层，不能冒充视觉通过。
审查者要在同一张表里看到每格用了哪一层证据，以及哪一格不适用。

### 最终验收者为什么需要跨任务判据？

验收 5 的采用记录只能由 C08-FU-01 产出。
验收 7 的 PRD 卡由 C08 在 C06 合并后的 main 上补；跨阶段部分按 C06 已交付事实核。
本任务只能判“安排可核”“不可达段记未完成并写 owner 与关闭条件”，不能写成完成。
把跨任务部分写成完成，会让最终验收失去真假。

## 用户怎样走完这条受控升级链？

### 场景 1：实现者先盘清四个入口与两层消费者

角色与触发：实现者拿到 C08 任务，准备改第一个文件。
真实输入：PB HEAD 5df81987 的四个入口源码、相关测试、路由、共享抽屉、焦点模块和样式 owner。
动作与结果：先产出影响表，每行写旧新行为、路径:行号、原负责人、直接使用点、一层间接使用点和未知项。
失败与恢复：只查名称或只查一层时，回任务 1 补读；未知项保留 unknown，交后续任务或 owner 复核。
消费者与证据：P2 规范作者、P3 实现者、独立审查者；影响表加独立读回。
关联：功能需求 1、验收 1、验收 6。

### 场景 2：规范作者按 HEAD 字节回写五份正文

角色与触发：规范作者拿到影响表，准备改 PaperBuilder 的规范正文。
真实输入：`specs/design/components.md`、`layouts.md`、`interaction.md`、`specs/frontend/frontend.md`、`ui-quality.md` 的 HEAD 字节。
动作与结果：九处段落各写一次规则，带上 owner、使用点和版本上抬；同步派生入口的版本列。
失败与恢复：文件 owner 未授权时停该文件、记 unavailable，其余文件继续；版本上抬后没有使用点则回规范 owner 补或标未完成。
消费者与证据：P3/P4 实施者、C08-FU-01；HEAD 差异、版本行、负向检查清单。
关联：功能需求 2、功能需求 3、验收 2、验收 3。

### 场景 3：开发只补缺口断言，不重写已正确行为

角色与触发：开发拿到四入口影响表，准备补测试。
真实输入：四个入口的现有测试、`business-log-page.test.tsx:335-360`、`lifecycle.test.tsx:1100/:1111/:1125/:1164`、`backtest-workbench.test.tsx:218-239`。
动作与结果：入口 2/3 复核已有断言，不重复造同义用例；入口 1 补空态重置的有效断言；入口 4 补换行与断词断言。
失败与恢复：目标断言失败时回本 Phase 开发修；入口 1 的空态断言不能证“清掉打开中的详情”时，改用 `filter_no_result` 渲染断言并写明边界。
消费者与证据：四入口页面 owner、独立测试；定向测试回执、逐入口登记。
关联：功能需求 4、验收 3、验收 11。

### 场景 4：实盘台账成为真实新消费者

角色与触发：用户在实盘台账打开信号详情，然后清除筛选或清除定位。
真实输入：`live-ledger.tsx` 的 `signal`、`triggerRef`、`clear()`、筛选条和告警块。
动作与结果：详情关闭，焦点回到仍存在的筛选控件；长错误在 `.ll-root` 作用域内换行，不改全站 `.lg-warning`。
失败与恢复：焦点控件已卸载时保留现有 h1 回退并记 unknown；共享类回归时回前端工程 owner，收窄选择器或回退该规则。
消费者与证据：台账用户与独立测试；定向测试、CSS文本断言。用户已取消台账页面验收，旧页面缺证仍保原件。
关联：功能需求 5、验收 3、验收 4、验收 11。

### 场景 5：独立测试与审查者做定向复验

角色与触发：实现完成，独立测试与审查者拿到当前 diff 和测试清单。
真实输入：四个入口与实盘台账的改动、五份正文差异、定向测试文件、真实页面环境。
动作与结果：测试者跑受影响用例并留回执；审查者读真实 diff、消费者和负例矩阵；页面观察补 jsdom 不能证的部分。
失败与恢复：环境不可用时记 unavailable，不冒通过；实现问题回本 Phase 开发，需求或验收变化回原决定 owner。
消费者与证据：最终验收者、后续任务；矩阵、测试回执、页面观察、独立审查原件。
关联：功能需求 6、验收 4、验收 6、验收 11。

### 场景 6：后续任务 owner 建卡并采用新版

角色与触发：四入口闭环后，当前主会话在 3 个工作日内建 C08-FU-01。
真实输入：C08 更新后的五份正文版本、模拟记录页的两个真实问题、采用记录模板。
动作与结果：任务卡写名称、owner、触发、排期、SLA、验收人和兜底路径；后续 owner 在 10 个工作日内真实读新版并采用。
失败与恢复：逾期不改验收口径，标未完成并记原因；永久挂起时升级给项目所有者。
消费者与证据：后续任务 owner、最终验收者；任务卡、采用记录。
关联：功能需求 7、验收 5。

### 场景 7：主会话用完成通道发现跳步

角色与触发：主会话开始一步，准备读取当前步骤和下一步。
真实输入：`steps.json`、todo、`step-consumer-design.md`、任务材料根副本。
动作与结果：先读权威表再提问；问题只限当前步或已确认的下一步；完成通道由声明、runner 和反例证明。
失败与恢复：草稿“下一步”与权威表冲突时停在当前步；C06 已合并（`f592096a`）时 PRD 卡由本任务在 main 上补；卡/PRD 段不可达时记 incomplete，写 owner 与关闭条件，不把 main 预存失败当本任务失败。
消费者与证据：主会话、用户、独立测试；声明、测试回执、runner 回执、三反例。
关联：功能需求 9、功能需求 10、验收 7、验收 8。

### 场景 8：外部方法执行与顺序回执复核

角色与触发：规范与代码改完，方法执行者拿到三份外部方法和顺序改动材料。
真实输入：`skills/external/` 的三份固定副本、`skills/frontend-component-quality/SKILL.md`、`steps.json`、`SKILL.md`、TCR 审查。
动作与结果：三份方法真执行并留记录；变更影响方法写进现有前端组件质量方法；AC8/10/12 只读回执复核，不重做顺序改动。
失败与恢复：许可未声明按个人研究记录，不写已获许可；方法正文写入缺 owner 时停该文件、记 incomplete。
消费者与证据：后续任务、方法维护者、最终验收者；三份执行记录、方法差异、测试回执、TCR 审查。
关联：功能需求 11、功能需求 12、功能需求 13、验收 9、验收 10、验收 12。

### 场景 9：五类失败分支保留原事实并交接

角色与触发：规范、代码或证据只完成一部分，或遇到权限、派生、回退和未知消费者。
真实输入：真实失败记录、当前写集、受影响文件清单、未知清单。
动作与结果：按权限不足、派生失败、部分同步、回退不兼容、未知消费者五分支保留原错误、已成功部分和影响范围。
失败与恢复：不报“全部已同步”，不覆盖他人改动，不复活旧权威；不可用分支标未完成。
消费者与证据：实施者、原 owner、最终验收者；分支表、原始失败、受控样例。
关联：功能需求 8、验收 6。

## 做成什么样？

### 验收 1：影响面可定位

场景是四个入口的旧新行为、原负责人和两层引用。
落点是任务 1 与第 1 阶段；判据见 Appendix A 的 AC-C08-1。

### 验收 2：四对象规范与实盘台账都更新

场景是五份正文的九处段落回写，加实盘台账代码和测试。
落点是任务 2～5 与第 2、3 阶段；判据见 Appendix A 的 AC-C08-2。

### 验收 3：四条规则回到唯一源并由真实使用点闭环

场景是规则 1～4 各有一个主对象，四入口和台账真实使用。
落点是任务 2～6 与第 2、3 阶段；判据见 Appendix A 的 AC-C08-3。

### 验收 4：四个基础页面对象乘六维（24 格）的负例矩阵可核

场景是四个C03基础页面对象A-D，逐格写初始状态、操作、断言和证据类型；E台账页面排除。
落点是任务 8 与第 4 阶段；判据见 Appendix A 的 AC-C08-4。

### 验收 5：C08-FU-01 具名安排并可被采用

场景是后续任务卡、SLA、采用记录和兜底路径。
落点是任务 9 与第 5 阶段；判据见 Appendix A 的 AC-C08-5。

### 验收 6：五类失败分支保原事实

场景是权限不足、派生失败、部分同步、回退不兼容、未知消费者。
落点是任务 1、任务 8、任务 13 与第 1、4、6 阶段；判据见 Appendix A 的 AC-C08-6。

### 验收 7：防跳步完成通道可见

场景是 C06 已合并的当前步卡、canonical 76 步、runner 读副本和三个反例。
落点是任务 10 与第 5 阶段；判据见 Appendix A 的 AC-C08-7。

### 验收 8：提问前从权威表取下一步

场景是步骤表、todo 和一次真实提问记录。
落点是任务 11 与第 5 阶段；判据见 Appendix A 的 AC-C08-8。

### 验收 9：三份外部方法真执行，方法正文写入现有方法

场景是变更影响、材料优化、token 检查，加方法正文写入。
落点是任务 12 与第 5 阶段；判据见 Appendix A 的 AC-C08-9（含方法正文写入）。

### 验收 10：方向审查揭示材料缺一即阻断

场景是四份揭示材料、MATERIAL_INCOMPLETE 和回归 5/5。
落点是任务 11 与第 5 阶段；判据见 Appendix A 的 AC-C08-10。

### 验收 11：四入口测试与使用点闭环

场景是四入口各有新断言或基础页面观察，台账保留新增源码与定向测试，不再要求其页面观察。
落点是任务 5～8 与第 3、4 阶段；判据见 Appendix A 的 AC-C08-11。

### 验收 12：make-decision 顺序调整有只读回执

场景是 steps.json、方法、消费者声明、五个测试和 TCR 审查。
落点是任务 11 与第 5 阶段；判据见 Appendix A 的 AC-C08-12。

## 系统要处理哪些状态与异常？

默认：四个入口和实盘台账在正常数据下保持 C03 已确认行为。适用。
空：业务日志 `filter_no_result`、实盘无匹配信号、C08-FU-01 未建时的空任务位。适用；空态断言只证重置生效，不冒充清掉打开中的详情。
加载：业务日志加载更多、工作台定位等待、实盘读回刷新。适用；C08 不新增加载态，只在竞态中证旧响应不回填。
错误：工作台定位失败、浮层长错误、实盘读回或权限错误、规范文件无写权限。适用；每类保留原错误与恢复 owner。
取消：工作台切换目标或关闭抽屉使旧定位失效；业务日志重置使旧列表响应失效。适用。
取消的 N/A：入口 D 的浮层长错误没有异步取消路径；写 `N/A — 理由：无请求可取消`，并做负向检查。
边界：窄屏 320/375、平板 768、桌面 1280；长错误、长标题、76 步计数。适用；未观察的视口记 not_observed。
权限：规范正文 owner 授权、PaperBuilder 写权限、外部副本许可。适用；失败走权限分支，不覆盖他人改动。
竞态：请求世代、导航序号、旧响应、抽屉重开两次几何。适用；断言旧响应不回填，几何按实际宽度重算。

## 哪些事实已确认，哪些仍未知？

以下事实只支撑对应需求，不把计划写成已执行结果。
未知事实绑定到具名风险与未决项；编号对照见 Appendix B。

### 事实 1：四个入口的行为代码已在 PB HEAD

状态：`verified`。
依据：`business-log-page.tsx:170-173`、`workbench-screen.tsx:2140/:2149/:1692`、`ui/workbench-page.css:845`。
影响：功能需求 1、功能需求 4、功能需求 6；验收 1、验收 3、验收 11。

### 事实 2：入口 2 与入口 3 已有身份、迟到响应和 0.6 几何断言

状态：`verified`。
依据：`workbench-screen.lifecycle.test.tsx:1100`、`:1111`、`:1125`、`:1164`。
影响：功能需求 4、功能需求 6；验收 3、验收 11。
结论：不重写这些用例，只做既有覆盖复核和真实页面观察。

### 事实 3：入口 1 空态拿不到“打开中的详情”

状态：`inferred`。
依据：当前 `business-log-page.tsx:188` 仅在成功应用查询后清详情，编辑筛选只改草稿；`:190` 空态重置只证明重置生效，不能冒清掉打开详情。旧 `:179/:181` 是 7723c321 历史坐标。
限制：静态读源码，未跑页面；结论是断言口径，不是产品行为变化。
影响：功能需求 4；验收 11；绑定风险 8。

### 事实 4：入口 4 现有测试只证错误文本与浮层存在

状态：`verified`。
依据：`backtest-workbench.test.tsx:218-239` 断错误文本和 `.backtest-top-popover` 存在，无换行或断词断言。
限制：jsdom 不算布局；换行只能用 CSS 文本断言或真实浏览器。
影响：功能需求 4、功能需求 6；验收 4、验收 11。

### 事实 5：实盘台账没有定位失败与重试入口

状态：`verified`。
依据：`live-ledger.tsx` 全文无 retry/locate 失败入口；`clear()` 在 `:256`，`signal` 在 `:137`，抽屉在 `:376`。
影响：功能需求 5；验收 3、验收 4、验收 11。
结论：规则 2 只落工作台，实盘只落规则 1、规则 4 和焦点条款。

### 事实 6：实盘焦点断开时回退到页面标题

状态：`verified`。
依据：`modal-focus.ts:27-38` 的 `restoreFocus`；`:29` 检查连接与禁用，`:33` 回退 `main h1, h1`。
影响：功能需求 5；验收 3、验收 4、验收 11。
结论：缺陷是“静默落到 h1”，不是“焦点丢到 body”。

### 事实 7：共享 `.lg-warning` 有 10 个文件 26 处

状态：`verified`。
依据：`ui/live-presentation.css:35` 是基础规则；全 `frontend/src` grep 计数 10 文件 26 处。
影响：功能需求 5；验收 4、验收 11。
结论：改选择器必须用 `.ll-root` 父级限定，不改全站类。

### 事实 8：五份正文与九处段落锚点可读

状态：`verified`。
依据：`components.md:11/:35`、`layouts.md:57/:71/:80`、`interaction.md:44`、`frontend.md:64/:102`、`ui-quality.md:12`；版本行见各文件头。
影响：功能需求 2、功能需求 3；验收 2、验收 3。
结论：design.md 与 craft.md 不主承接；不适用与理由写 `specs/design/README.md:11/:16` 的 ②⑦ 行，不写本体。

### 事实 9：PB 当前主树干净；旧 97 项保留为历史

状态：`verified`。
依据：当前 PB HEAD 5df81987，`git status --porcelain` 无输出（0 项）。原 PB HEAD 7723c321 的 97 项、specs 5 处修改和 87 个原型删除为历史观察；调查原件 `quality/evidence/2026-11-02-010-c08-p1-baseline-investigation.md` 保留。
影响：功能需求 1、功能需求 2、功能需求 8；验收 1、验收 2、验收 6。
结论：读规范按 HEAD 字节；建干净工作树是 P3 前置。

### 事实 10：canonical 117 行（76 步声明）与材料根副本 body 相同

状态：`verified`。
依据：`workflows/make-decision/step-consumer-design.md` sha256 `6713365e…`，材料根副本 sha256 `3676bdd0…`；副本多 6 行本地头。
影响：功能需求 9；验收 7。
结论：测试只证声明覆盖；runner 读副本另证。

### 事实 11：C06 当前步卡已交付并合并

状态：`verified`。
依据：main `f592096a`（C06 PR #22）与 `591664e2`（C06 材料归档）；C08 分支 `5a9f1679` 已吸收 main（main 是 HEAD 的祖先，C08 分支尚未合入 main）；`780d5e2f` 是 C06 分支提交。
影响：功能需求 9、功能需求 10；验收 7。
结论：C06 卡与 runner 可用；PRD 阶段段由 C08 的 P5/T010 在 main 上补并验证；只消费 main。C06 交付时 main 有预存失败（OCR 16 条、review-materials 3 条），C08 分支已迁移测试并全绿（19→0，未改生产代码），main 本身未回写。

### 事实 12：三份外部方法副本可读，许可状态不同

状态：`verified`。
依据：`skills/external/README.md:7-39`；两份未声明许可，`design-tokens` 为 Apache-2.0。
影响：功能需求 12；验收 9。
结论：按个人研究记录；不新增包，不执行脚本，不写已获许可。

### 事实 13：设计源机器提炼件缺失

状态：`unknown`。
负责人：build-plan 与 build-code；影响：设计源引用与 AC2/AC3/AC4 的证据。
事实：PB 与任务库按名检索 0 命中 `design-source-extraction.json`；未做全仓扫描。
绑定：未决 6、风险 6；功能需求 2、功能需求 3；验收 2、验收 3、验收 4。

### 事实 14：AC10 与 AC12 的改动已提交（`3769e64c`）

状态：`verified`。
依据：`workflows/make-decision/steps.json` 第 13/14 步是 `stage-end-spec-analyze`/`approve-decision`；`workflows/make-decision/SKILL.md:233/:238`；改动已在 `3769e64c` 提交，并随 `5a9f1679` 合并提交。
影响：功能需求 10、功能需求 11、功能需求 13；验收 8、验收 10、验收 12。
结论：只读回执复核，不再开实施任务。

### 事实 15：C08-FU-01 尚未建立

状态：`verified`。
依据：任务库 `tasks/` 下无 `C08-FU-01` 目录。
影响：功能需求 7；验收 5。
结论：任务 9 建卡；采用记录 pending，owner=C08-FU-01。

### 事实 16：本任务同时改 PaperBuilder 与 WorkflowHub

状态：`verified`。
依据：验收 1～6、11 落 PB；验收 7、8、9、10、12 落 WH；决策日志与父 PRD 的 C08 卡。
影响：功能需求 1、功能需求 9、功能需求 12；验收 1、验收 7、验收 9。
结论：一份 spec 两域分节，写集按仓分列。

### 事实 17：模拟记录页不在 C08 实施范围

状态：`not_applicable`。
理由：决定 4 把该页留给后续任务 C08-FU-01；C08 只安排，不改其代码。
影响：功能需求 7；验收 5。

## 功能需求是什么？

### 功能需求 1：先盘清四个入口与两层消费者

实现者在改任何文件前，先拿到四个入口的旧新行为、原负责人和直接/一层间接使用点。
真实输入是 PB HEAD 5df81987 的四个入口源码、相关测试、路由、共享抽屉、焦点模块与样式 owner。
可观察结果是影响表；每行有路径:行号、直接使用点、一层间接使用点、未知项。
失败是只写文件名或只查一层；未知被写成零；把全仓扫描当穷尽。
消费者是 P2 规范作者、P3 实现者、独立审查者；证据类型是影响表加独立读回。
关联：事实 1、事实 2、事实 5、场景 1、验收 1、验收 6。

### 功能需求 2：四对象在五份正文各写回一次

设计组件、设计布局、前端组件、前端布局各有一个主对象；五份正文承担九处段落回写。
规则 1 落 `components.md` 的组合原则与浮层焦点段；规则 3 落 `layouts.md` 三处，焦点接缝落 `interaction.md`。
规则 2 落 `frontend.md` 第 5 节；规则 4 落 `frontend.md` 第 7 节，验证判据落 `ui-quality.md`。
四条规则的使用点逐条点名。
规则 1=业务日志两个重置入口加实盘台账。
规则 2=工作台重试（既有实现与 lifecycle:1100/:1125/:1164，加 P4 页面观察）。
规则 3=工作台抽屉几何（1692/1702/1704 与 lifecycle:1111，加 P4 页面观察）加实盘台账焦点条款。
规则 4=工作台浮层（845 与 backtest 测试）与实盘台账 `.ll-root` 换行。
规则 2、3 不新增产品代码；新版本的使用证据是复验既有使用点与页面观察。
不把它写成“无使用点”，也不新增获批偏差。
`design.md` 与 `craft.md` 不主承接；不适用与理由写 `specs/design/README.md:11/:16` 的 ②⑦ 行，不写本体；不新建第六份规范。
可观察结果是五份正文的真实差异、段落名、owner 与使用点。
失败是只有标题、只改一份或把规则写两处。
消费者是 P3/P4 的实现与验证者、C08-FU-01；证据类型是 HEAD 差异、版本行与使用点。
关联：事实 8、事实 13、场景 2、验收 2、验收 3。

### 功能需求 3：版本上抬与负向检查

实际改动的正文在回写后上抬人读版本，并写 owner、回写段与使用点。
版本上抬是正常源更新，不是 overlay；只有确认不存在获批偏差或 overlay 时才写“不适用”。
存在获批偏差或 overlay 时逐项登记 owner、版本、使用点和旧依据，不静默切换。
负向检查要证明旧值源、旧采用依据、旧消费者仍可读，没有暗换。
四条规则的使用点见功能需求 2；版本上抬后逐条核这些使用点。
规则 2、3 不新增产品代码；证据是既有使用点复验与页面观察，不新增获批偏差。
可观察结果是版本行、回写段与使用点；失败是上抬无 owner/使用点，只写“不适用”不做负向检查，或存在偏差/overlay 却不登记。
消费者是原规范 owner 与后续任务；证据类型是版本记录、负向检查清单与真实差异。
关联：事实 8、场景 2、验收 2、验收 3。

### 功能需求 4：四入口行为不重写，只补缺口断言

入口 1、2、3 的新行为代码已在 HEAD；入口 4 的换行规则已在 `ui/workbench-page.css:845`。
C08 不重写这些行为；入口 1 补空态重置的有效断言，入口 4 补换行与断词断言。
入口 2、3 已有目标身份、旧请求失效和 0.6 几何断言，只做既有覆盖复核与真实页面观察，不重复造同义用例。
每入口至少一条新断言或一次真实页面使用观察；入口 1 的空态断言只证重置生效，不冒充“清掉打开中的详情”。
入口 1 的焦点判据是重置关闭详情后焦点落在仍存在的筛选触发控件（筛选开关或重置按钮）。
原控件已移除时保留 h1 回退，记 unknown 与原因。
若该断言 RED，任务 6 可在 `business-log-page.tsx` 做最小焦点修复，不改 C03 四个行为语义。
消费者是四入口的页面 owner、独立测试；证据类型是定向测试回执、页面观察与逐入口登记。
关联：事实 1、事实 2、事实 3、事实 4、场景 3、验收 3、验收 11。

### 功能需求 5：实盘台账成为真实新消费者

实盘台账在清除筛选或清除定位时关闭信号详情，焦点回到仍存在的筛选控件。
长错误块在台账父级作用域内允许正常换行与任意断词，不改全站 `.lg-warning`。
选择器用 `.ll-root` 限定；已知共享面 10 文件 26 处作为免回归基线。
可观察结果是 `clear()` 覆盖 `:310`、`:367`、`:369` 三个用户触发点；`:210` 场景替换已先清详情。
失败是只改“清除筛选”一处、焦点仍落 h1、或改全站类导致其他 live 页回归。
消费者是实盘台账页用户与独立测试；证据类型是定向测试、CSS文本断言。台账页面验收已由用户取消，不删源码与测试。
关联：事实 5、事实 6、事实 7、场景 4、验收 3、验收 4、验收 11。

### 功能需求 6：独立定向复验与四个基础页面对象乘六维负例矩阵

独立测试者跑受影响定向用例，独立审查者读真实 diff 与消费者。
真实页面观察只覆盖 jsdom 不能证明的焦点、几何与换行。
当前四个基础页面对象是四个C03入口A-D，共24格；E台账页面不验收，台账源码、规范使用点与定向测试仍保留。
设计组件、设计布局、前端组件、前端布局、使用点另作对象面，在验收 2 与验收 3 判，不混入 24 格。
六维是 slot/覆盖、状态保留、DOM/焦点、溢出、取消恢复、未改行为。
每格写初始状态、操作、断言与证据类型；不适用要写理由和负向检查。
失败是空格子、用组件 story 代替页面、只跑 jsdom 或只改一处代替四入口。
消费者是最终验收者与后续任务；证据类型是矩阵、定向测试回执、页面观察、独立审查原件。
关联：事实 1、事实 4、事实 5、场景 5、验收 4、验收 6、验收 11。

### 功能需求 7：后续真实任务 C08-FU-01 具名并安排采用

C08-FU-01 名称是“模拟记录页恢复规则同步”，负责人是后续任务 owner，当前主会话建卡。
创建触发是四入口闭环后 3 个工作日内；SLA 是建卡后 10 个工作日内产出采用记录。
采用记录要真实读 C08 更新后的五份正文版本并实际使用；同任务重放、保存成功、推给 C09 都不算。
C08 内可判安排六项是否可核；采用记录未产时 AC5 记 incomplete，不记 pass；只有真实读新版并采用的记录在场才 pass。
失败是只写页面名、无 owner/SLA、永久挂起、把 pending 当通过，或把 AC5 挂到 PB Phase 承接。
消费者是后续任务 owner 与最终验收者；证据类型是任务卡、计划文本、采用记录。
关联：事实 15、事实 17、场景 6、验收 5。

### 功能需求 8：五类失败分支保留原事实与范围

五分支是权限不足、派生失败、部分同步、回退不兼容、未知消费者。
每分支写触发、保留、禁止覆盖、恢复责任与可执行路径；不可用分支标未完成。
缺声明样例只证步骤通道，不证资产同步失败分支；受控缺证据样例单独记。
失败是用“不可用原因”替代分支验证、覆盖他人改动、把未知当零或报“全部已同步”。
消费者是实施者、原 owner、最终验收者；证据类型是分支表、原始失败、受控样例。
关联：事实 9、事实 10、事实 11、场景 9、验收 6。

### 功能需求 9：防跳步完成通道复用 C06 卡

C08 复用 C06 的当前步执行卡，不另造卡机制。
本阶段补 canonical 76 步声明、76 步一致性测试与 PRD 阶段卡支持。
第一层静态证据是 canonical 声明 76 步与 87/87 一致性测试。
第二层是 runner 读材料根副本并判 completed。
三个反例是副本缺失、副本陈旧、坏声明；三者都不能静默通过。
C06 已合并；PRD 卡由 C08 在 main 上补并验证；卡/runner 不可达时按真实结果记 incomplete，写 owner 与关闭条件。
失败是把 87/87 当完成通道、把缺副本当通过、把坏声明降级。
消费者是主会话、独立测试、最终验收者；证据类型是声明、测试回执、runner 回执与三反例。
关联：事实 10、事实 11、场景 7、验收 7。

### 功能需求 10：步骤卡只在内部，提问前从权威表取下一步

步骤卡是主会话内部执行卡，不逐步展示；用户只在骨架确认、最终确认、真卡住三处介入。
提问前先读 `steps.json` 与 todo 的当前步和下一步，不从草稿句子取数。
问题只限当前步或已确认的下一步；冲突时停在当前步或改问当前步。
R-011 的逐字原话未取得，来源是决策日志变更 4；owner 用户，记录口径不冒充逐字。
消费者是主会话与用户；证据类型是步骤表、todo、一次真实提问记录。
关联：事实 14、场景 7、验收 7、验收 8。

### 功能需求 11：方向审查的揭示材料校验

四份揭示材料是已选方向、备选、理由、关键假设；缺任一即阻断。
公共入口报 MATERIAL_INCOMPLETE，不派发、不静默降级；四份齐全才进入 reveal 和 challenge。
回归测试 5/5 通过；本任务不重跑方向审查，只做只读回执复核。
揭示材料合同说明的落点是 `skills/wh-review/SKILL.md:24` 的 MATERIAL_INCOMPLETE 与 `:32` 的四份揭示材料合同；回归测试是 `make-decision-direction-reveal.test.mjs`；说明由第 5 阶段任务 11 作者补。
失败是把问题版当揭示包、缺材料仍派发、或用审查意见代替用户确认。
消费者是方向审查调用者与用户；证据类型是测试回执、缺失/齐全两例、揭示包路径。
关联：事实 14、场景 8、验收 10。

### 功能需求 12：三份外部方法真执行，方法正文写入现有方法

三份方法是变更影响与定向更新、材料优化、设计 token 检查。
按仓内固定副本执行，不新增包、不执行脚本。
变更影响方法以影响表为输入，复核直接/间接与未知，不重做第二份影响表。
材料优化方法对五份正文做一次可读性审计，只修真实缺口，不改产品决定。
token 方法只做“检查已存在”一步，不生成或替换 token。
两份未声明许可按个人研究记录，不写已获许可。
决定 8 另要求把“变更影响与定向更新”写进 `skills/frontend-component-quality/SKILL.md` 的 Component Quality Map；这是 AC-C08-9 的方法正文部分，不扩大三方法执行主体。
失败是只读方法名、把写入当执行、写许可已获、执行脚本或新增包。
消费者是后续任务与方法维护者；证据类型是三份执行记录、方法正文差异、许可口径。
关联：事实 12、事实 13、场景 8、验收 9。

### 功能需求 13：make-decision 顺序调整的只读回执

新顺序是 13 `stage-end-spec-analyze`、14 `approve-decision`、15 `closeout`。
15 步与 76 步计数不变。
旧第 13 步“确认收口”是旧顺序下的确认，不当作新顺序最终确认。
最终确认看 spec-analyze 结果和最终稿。
顺序改动已在 `3769e64c` 提交；C08 只归档证据与独立读回，不再开实施任务。
失败是只改 SKILL 不改 steps.json、改计数、复用旧确认或没有 TCR。
消费者是后续阶段主会话；证据类型是 steps.json/SKILL 差异、五个测试回执、TCR 审查、确认原件。
关联：事实 14、场景 8、验收 12。

## 打算怎么做？

### 方案 1：一份 spec 两域分节，复用现有事实

本规格只写一份，PaperBuilder 域与 WorkflowHub 域分节写。
来源只读当前决策日志、父 PRD 的 C08 卡、任务库研究原件和 PB HEAD 字节。
不另写 plan/tasks，不建第二份决策日志，不复制上游摘要当证据。
四入口复用 C03 已落地的代码与测试，不抽新组件库，不新增公共 API。

### 方案 2：只改实盘台账三处，四入口只补缺口断言

主要的 PB 产品代码改动是实盘台账的 `clear()`、焦点目标和告警样式。
四入口的行为代码已在 HEAD；入口 1 焦点断言若 RED，只做最小焦点修复。
C08 只补入口 1 与入口 4 的缺口断言。
入口 2、3 已有断言，只做既有覆盖复核和真实页面观察，不重复造同义用例。
这是本任务的最小有效路径：没有真实缺陷的地方不重写，避免用测试数量冒充质量。

### 方案 3：五份正文按 HEAD 字节回写九处段落

五份正文是设计组件、设计布局、交互、前端工程和前端质量。
九处段落是 `components.md:11/:35`、`layouts.md:57/:71/:80`、`interaction.md:44`、`frontend.md:64/:102`、`ui-quality.md:12`。
每条规则只写一处主权威；`interaction.md` 只做规则 3 的焦点接缝，不设第二权威。
`design.md` 与 `craft.md` 不主承接；不适用与理由写 `specs/design/README.md:11/:16` 的 ②⑦ 行，不写本体；不新建第六份规范。
版本按原文件格式上抬；派生入口 `specs/design/README.md` 的对应版本行同步更新。

### 方案 4：三层复验与 24 格矩阵

第一层是受影响定向测试，证明 DOM、状态和断言。
第二层是真实页面观察，证明焦点、几何、换行和窄屏溢出。
第三层是独立代码审查，读真实 diff、消费者和未改行为。
矩阵用四个基础页面对象A-D乘六个维度，共24格；每格写初始状态、操作、断言和证据类型。
组件 story 不算页面证据；CSS 文本断言只算源码层，不算视觉通过。

### 方案 5：防跳步复用 C06 卡，静态与 runner 两层证据

静态层是 canonical 76 步声明和 87/87 一致性测试。
运行层是 runner 读任务材料根副本，按序推进并判 completed。
三个反例是副本缺失、副本陈旧、坏声明；三者都不能静默通过。
C06 已合并；PRD 阶段卡由 C08 在 main 上补；不可达时记 incomplete，写 owner 与关闭条件。
不新增硬门、退出码、第二本进度账或逐步展示。

### 方案 6：外部方法手动执行，方法正文写进现有方法

三份方法按仓内固定副本手动执行，不运行上游脚本，不新增包。
变更影响方法以影响表为输入，复核直接、间接和未知，不重做第二份影响表。
材料优化方法对五份正文做一次可读性审计，只修真实缺口，不改产品决定。
token 方法只做“检查已存在”一步，不生成或替换 token。
决定 8 的方法正文写进 `skills/frontend-component-quality/SKILL.md`，并入 AC-C08-9。

### 方案 7：AC8、AC10、AC12 只读回执，不重做顺序

AC10 与 AC12 的顺序、揭示材料校验已在 `3769e64c` 提交。
C08 只重跑测试、归档回执、做独立读回，不再开实施任务。
AC8 需要一次真实提问记录；没有就记 incomplete，写 owner 与关闭条件。
这样避免把“已实现”重复实施成第二套改动。

### 方案边界：哪些简化已经成立？

不新增外部包、硬门、退出码、第二本进度账、全项目监听或自动双向同步器。
不抽新共享组件、钩子或组件库；实盘台账只做局部修复。
不做完整浏览器 QA、无障碍专项、性能专项或模拟记录页实现。
不接管 C03、C06、C07 的专业正文所有权。
不重写四入口已正确的行为；不把 87/87 测试当完成通道恢复。
两域写集按仓分列，证据不混；任务库只放证据，不建第二套产品材料。

### 设计源就绪与缺口

设计组件 `components.md` 可绑定，版本 1.0，段落可读。
设计布局 `layouts.md` 可绑定；当前原型源为PB仓根相对 `specs/design/prototypes/实盘UI/`，版本与历史见 PB `specs/design/README.md:25-27`。旧 87 个删除为历史观察；当前可读不证明设计批准。
前端工程 `frontend.md` 可绑定，版本 `2026.10.14.draft1`，条款偏原则。
交互 `interaction.md` 可绑定；质量 `ui-quality.md` 可绑定。
`design.md` 与 `craft.md` 本次不主承接；不适用与理由写 `specs/design/README.md:11/:16` 的 ②⑦ 行，不写本体；`design.md:24` 的 47 个 root 角色与 `tokens-base.css` 的 33 条声明有计数差异，本次不引该数，owner 原 token owner 核。
`design-source-extraction.json` 在 PB 与任务库按名检索 0 命中；本次不伪造该机器件，缺口记未决 6。

## 谁先谁后？

第 1 阶段先做影响面，任务 1 产出四个入口的旧新行为、两层消费者和未知清单。
没有前置；它是后续规范、代码和复验的共同输入。

第 2 阶段做五份正文，任务 2 写组件，任务 3 写布局与交互，任务 4 写前端工程与质量。
任务 2、3 改不同文件，可并行；任务 4 依赖任务 2、3 的版本结果，并同步 README 的派生版本行。
第 2 阶段依赖第 1 阶段的影响表。

第 3 阶段做代码与测试，任务 5 改实盘台账，任务 6 补四入口缺口断言。
任务 5、6 改不同文件，可并行；第 3 阶段依赖第 2 阶段的规则落点。
实盘台账只改 `clear()`、焦点目标与 `.ll-root` 告警样式，不碰共享 hook。
入口 1 焦点断言 RED 时，任务 6 可在 `business-log-page.tsx` 做最小焦点修复，不改 C03 语义。

第 4 阶段做独立复验，任务 7 跑定向测试，任务 8 做真实页面与负例矩阵。
两任务可并行；第 4 阶段依赖第 3 阶段的代码与测试就绪。
任务 8 的矩阵用第 2 阶段的规则和第 3 阶段的实现，不另立第二份判据。

第 5 阶段做后续与流程，任务 9 建 C08-FU-01，任务 10 做防跳步证据，任务 11 做只读回执，任务 12 做外部方法。
四任务写不同路径，可并行；第 5 阶段依赖第 2 阶段，仅任务 9 等第 4 阶段的四入口闭环。
任务 9 的建卡触发是任务 7、8 闭环后 3 个工作日内。
任务 11 的输入含 `skills/wh-review/SKILL.md:24/:32` 合同文字与 reveal 回归测试；证据含合同说明落点；说明由 P5 作者补。

第 6 阶段做失败分支与整卡验收，任务 13 先做五分支，任务 14 再逐条验收与交接。
任务 14 依赖任务 13；第 6 阶段依赖第 5 阶段。
任务 14 只消费前序原件，补必要未闭环 case，不重跑已闭合的全量。

共享路径按真实依赖定序。
任务 2、3 不改同一文件；任务 4 在两者之后写 README 版本行，先写者是任务 2、3，后写者是任务 4，依据是版本值。
任务 5、6 改不同测试或源码文件；任务 10、11、12 改不同路径。
任务库证据按文件名区分，不并行写同一文件；同一文件没有两个写者。

## 还有什么没定？

### 未决 1：PaperBuilder 的 C08 干净工作树还没建

负责人：当前主会话。
影响：第 2、3、4 阶段的写集、diff 和真实页面都以干净树为准；未建树时不能开始代码改动。
关闭条件：从用户选择的当前 PB main 新建干净工作树，核当前主树与隔离树状态、同基线和差异关系；记录实际 HEAD，旧 97 项仅保历史。

### 未决 2：C06 已合并；PRD 段与预存测试

状态：C06 合并已关闭（`f592096a`）；预存测试已由 C08 分支修复。
负责人：C06 任务/维护者；C08 的 PRD 段由当前主会话在 P5/T010 完成。
影响：验收 7 的 PRD 段可执行；C06 交付时 main 的 OCR 16 条与 review-materials 3 条失败已由 C08 分支迁移测试并全绿（19→0），但 main 未回写，不能写成 main 全绿。
关闭条件：C08 T010 交付 PRD 段；预存测试已修，main 回写由后续交付承接。

### 未决 3：C08-FU-01 未建，采用记录 pending

负责人：当前主会话建卡，后续任务 owner 采用。
影响：采用记录未产时验收 5 记 incomplete，不记 pass；只有真实读新版并采用的记录在场才判 pass。
关闭条件：四入口闭环后 3 个工作日内建卡，建卡后 10 个工作日内产出采用记录；逾期升级给项目所有者。

### 未决 4：两份外部方法许可未声明

负责人：项目所有者。
影响：方法执行记录只能按个人研究口径写，不能写已获许可或可再分发。
关闭条件：取得真实许可答复，或保留个人研究记录并承担风险。

### 未决 5：真实页面证据未产

负责人：第 4 阶段测试者与主会话。
影响：验收 4、6、11 的页面部分只能记 unavailable 或 incomplete，不能用 jsdom 代替。
关闭条件：用真实服务、真实路由和规定视口完成观察；环境不可用时保留尝试、卡点、提供者与恢复条件。

### 未决 6：design-source-extraction 缺件与原型批准未知

负责人：build-plan 与 build-code。
影响：设计源引用不能引机器提炼件；当前仓内原型可读，但批准范围仍未证明。
关闭条件：补 `design-source-extraction.json`，或按 design-source-readiness 手工列八类并明写缺件；原型按当前PB仓根相对 `specs/design/prototypes/实盘UI/` 与设计入口取得版本字节，可读不冒批准。

### 未决 7：R-011 逐字原话未取得

负责人：用户与主会话。
影响：功能需求 10 和验收 8 只能引决策日志变更 4，标记“原话未取得”。
关闭条件：补录逐字原话，或保留未取得口径并由用户确认。

### 未决 8：design.md 的 47 个 root 角色与 tokens-base 的 33 条声明有计数差异

负责人：原 token owner。
影响：设计源计数不能当本次判据；引用会带来错误数量断言。
关闭条件：原 owner 逐行核对并给出结论；本次不引该数、不改 `design.md`。

## 实现设计（全局权威）

全局设计复用现有代码、测试和规范入口，不新增产品源文件或公共接口。
本节消费父 PRD 与决策日志，不再决定产品目标。
每项缺失写 `unknown — owner / impact / next action`，不以猜测填空。
精确命令和局部停止条件由所属 Phase 卡承接。
Phase 写集里的 `paperbuilder/` 前缀指 PaperBuilder 干净工作树根（build-code 从 PB main 5df81987 新建，实际路径由 P1 建树命令与任务事实记录）；其余路径相对本任务 worktree 或任务根。

### 代码锚点

**来源边界**：产品目标读父 PRD 的 C08 卡，取舍读当前决策日志，代码事实读 PB HEAD 5df81987。
**PB 基线**：HEAD 5df81987（完整 SHA 5df81987031ad4f37716779a29feda901cfb9e59），当前主树 0 项未提交；C08 独立树分支 `task/paperbuilder/c08-spec-sync`，路径 `/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c08-controlled-upgrade-20261102`，按该树 HEAD 字节读规范。旧 7723c321/97 项留作历史。
**读取顺序**：先读四入口源码与测试，再读共享抽屉、焦点模块、样式 owner，最后读五份正文的版本行与段落锚。

**入口 1：业务日志重置后清详情**
- `frontend/src/business-log-page.tsx:170-173`：`resetFilters` 先清 `detailRecord`，再调 `onResetFilters`。
- 焦点修复边界：若入口 1 焦点断言 RED，只改关闭详情前的 `triggerRef` 目标，不改清详情与筛选重置语义。
- `frontend/src/business-log-page.tsx:188`：编辑筛选只改草稿，成功应用查询才清详情；这是当前 C06 生命周期，旧 179 事实不继续套用。
- `frontend/src/business-log-page.tsx:190`：空态重置按钮，条件是 `filter_no_result`。
- `frontend/src/business-log-page.tsx:188`：筛选面板重置，收包装后的 `resetFilters`。
- `frontend/src/business-log-page.tsx:335-344`：页面级重置更新草稿、查询与 URL，不碰视图内详情；视图包装负责清详情。
- `frontend/src/business-log-page.tsx:358`：页面把重置回调传入 `BusinessLogViewInternal`，由视图包装清详情。
- `frontend/src/business-log-page.tsx:205`：挂载 `BusinessLogDetailDrawer`。
- `frontend/src/business-log-components.tsx:82-89`：抽屉签名；`:89` 是空记录守卫，不是 `:82`。
- `frontend/src/business-log-components.tsx:114`：用 `UiDrawer`，class `business-log-detail-drawer`。
- `frontend/src/ui/primitives.tsx:221`：`UiDrawer`；`:225-231` 调 `useDrawerFocus`。
- `frontend/src/modal-focus.ts:98-125`：`useDrawerFocus`；`:117` Escape 返回，`:123` 卸载返回。
- `frontend/src/App.tsx:157`：`/business-logs` 路由；`:129-130` 是 `BusinessLogRoute`。

**入口 2：工作台定位失败后重试**
- `frontend/src/workbench-screen.tsx:2140`：`retryChartFocus`；`:2141` 无目标返回。
- `frontend/src/workbench-screen.tsx:2142-2146`：同目标在开状态时直接重焦。
- `frontend/src/workbench-screen.tsx:2147`：异目标走 `navigateToPosition`。
- `frontend/src/workbench-screen.tsx:2149-2156`：统一导航；`:2150` 切换保护，`:2151` 递增 attempt，`:2154-2155` 写身份，`:2156` 定位。
- `frontend/src/workbench-screen.tsx:2440`：重试按钮，条件 `chartFocusRetryTarget`。
- `frontend/src/workbench-screen.tsx:2547`：`nav` 起始；`:2548` 上一个、`:2549` 下一个、`:2550` 亏损。
- `frontend/src/workbench-screen.tsx:1205`：`canSwitchDrawerTarget`；`:2134` 写 `drawerTriggerRef`；`:2545` 传给抽屉。

**入口 3：工作台图表焦点与抽屉几何**
- `frontend/src/workbench-screen.tsx:1692`：`focusChartOnPosition`；`:1693-1694` 校验当前导航。
- `frontend/src/workbench-screen.tsx:1702`：`visibleChartFraction` 延迟求值。
- `frontend/src/workbench-screen.tsx:1704`：读 `.position-comment-drawer` 宽度；`:1705` 夹在 0.45～1。
- `frontend/src/workbench-screen.tsx:1740`、`:1763`：在 rAF 内消费比例。
- `frontend/src/ui/workbench-page.css:1548`：工作台抽屉宽 `min(680px, calc(100vw - 24px))`；基类在 `ui/feature-components.css:23`。
- `frontend/src/workbench-screen.tsx:2588`：根类 `pb-ui-workbench-screen`。
- 现有断言：`workbench-screen.lifecycle.test.tsx:1111`，600/240 得 0.6。

**入口 4：浮层长错误换行**
- `frontend/src/ui/workbench-page.css:845`：唯一新增规则，`white-space: normal; overflow-wrap: anywhere; min-width: 0; max-width: 100%`。
- `frontend/src/ui/workbench-page.css:843`：基础态 `max-width: 180px`；`:947` 父级 `white-space: nowrap`。
- `frontend/src/backtest-workbench.tsx:649`：compact 浮层内错误块；`:635` 浮层；`:628` compact 根。
- `frontend/src/backtest-workbench.tsx:679`：非 compact 错误块；生产不可达，测试可达（`:80`、`:121` 渲染）。
- `frontend/src/backtest-workbench.tsx` 由 `workbench-screen.tsx:2414` 以 `compact` 传入。
- `frontend/src/ui/workbench-page.css:1922` 浮层宽 300px；`:2040` 窄屏 `min(300px, calc(100vw - 20px))`。
- 现有断言：`backtest-workbench.test.tsx:218-239` 只证错误文本与浮层存在。

**实盘台账**
- `frontend/src/live-ledger.tsx:104`：`LiveLedger`；`:106` `triggerRef`；`:137` `signal`；`:311` 根 `div.ll-root`。
- `frontend/src/live-ledger.tsx:256`：`clear` 清 9 项筛选与 deep，不碰 `signal`。
- `frontend/src/live-ledger.tsx:310`：清除定位按钮，调用 `clear`。
- `frontend/src/live-ledger.tsx:367`：清除筛选按钮；`:369` 再点已选差异类型时调 `clear`。
- `frontend/src/live-ledger.tsx:210`：场景替换时调 `clear`；`:207-208` 已先 `setSignal(null)` 并清 `triggerRef`。
- `frontend/src/live-ledger.tsx:350`：错误块 `.lg-warning`；`:360` 忽略参数告警也用 `.lg-warning`。
- `frontend/src/live-ledger.tsx:376`：`UiDrawer`，`open={signal!==null}`，传 `triggerRef`。
- `frontend/src/modal-focus.ts:27-38`：`restoreFocus`；`:29` 检查连接与禁用，`:33` 回退 `main h1, h1`。
- `frontend/src/ui/live-presentation.css:35`：`.lg-warning` 基础规则，无换行/断词声明。
- `frontend/src/ui/live-presentation.css:36`：760px 断点。
- `frontend/src/ui/live-ledger.css:196`：`.ll-drawer` 宽 `min(480px,100vw)`。
- 共享面：`.lg-warning` 在 10 个文件 26 处；选择器必须用 `.ll-root` 限定。

**测试锚点**
- `frontend/src/business-log-page.test.tsx:335-360`：筛选面板重置清旧详情；`:136-160`：抽屉打开、Escape 关闭、焦点回行。
- `frontend/src/workbench-screen.lifecycle.test.tsx:1066`：重试组；`:1100` 恢复 position-2；`:1111` 0.6 几何；`:1125` 六变体；`:1164` 五变体迟到成功/失败；`:846` 未保存评论保护。
- `frontend/src/backtest-workbench.test.tsx:218-239`：compact 错误文本与浮层。
- `frontend/src/ledger-signal-filter-state.test.tsx:23`：已点“清除筛选”，是新增断言落点；`:10` render，`:15` signalRows。
- `frontend/src/live-ledger-locator.test.tsx:129`：键盘打开详情后 Escape 回行。
- `frontend/src/live-pages.test.tsx:1189`：场景重置关旧抽屉与深链。
- `frontend/src/config-risk-error-presentation.test.tsx:74/:76`：compact 无 `.lg-warning`，非 compact 有。
- `frontend/src/live-cockpit.test.tsx:945`：重复比较不取 `.lg-warning` 类。
- `frontend/vite.config.ts:20-28`：jsdom，单线程；`frontend/package.json:8`：`dev` 是 `vite`。
- `frontend/playwright.config.ts:20-30`：真实浏览器需要端口与 `PAPERBUILDER_F6_STORAGE_ROOT`。

**五份正文的九处段落**
- `specs/design/components.md:4` 版本 1.0；`:11` PB-COMP-OWNERS；`:35` PB-COMP-OVERLAYS；目标版本 1.1。
- `specs/design/layouts.md:5` 版本 2026.10.14-layouts.1；`:57` PB-LAYOUT-GROWTH；`:71` PB-LAYOUT-OVERLAYS；`:80` PB-LAYOUT-RESPONSIVE；目标版本 2026.11-02-layouts.2。
- `specs/design/interaction.md:4` 版本 2026.10.14.1；`:44` PB-INT-FOCUS；目标版本 2026.11-02.1。
- `specs/frontend/frontend.md:5` 版本 2026.10.14.draft1；`:64` PB-FE-LIFECYCLE；`:102` PB-FE-STYLES；目标版本 2026.11-02.draft2。
- `specs/frontend/ui-quality.md:4` 版本 2026.10.14.1；`:12` PB-UI-QUALITY-LAYERS；目标版本 2026.11-02.1。
- 派生入口 `specs/design/README.md:12-15` 的 ③④⑤⑥ 版本列随五份正文同步；不独立起版本。
- `specs/design/README.md:11/:16` 的 ②⑦ 行写 design/craft 不适用与理由；不写 `design.md` 与 `craft.md` 本体。

**WorkflowHub 锚点**
- `workflows/make-decision/step-consumer-design.md`：canonical 声明，117 行（76 步声明）；sha256 `6713365e…`。
- `specs/workflowhub-ui-frontend-c08-controlled-upgrade-20261102/step-consumer-design.md`：材料根副本，123 行，多 6 行本地头；sha256 `3676bdd0…`。
- `workflows/make-decision/steps.json` 第 13/14/15 步：`stage-end-spec-analyze`、`approve-decision`、`closeout`。
- `workflows/make-decision/SKILL.md:233/:238`：第 13/14 步方法正文。
- `tests/contract/check-stage-steps.test.mjs`：87 个一致性测试。
- `tests/contract/final-chain-runner.test.mjs:97-105`：临时材料根 fixture；`:146` 写声明。
- `runtime/task/final-chain-runner.mjs:901`：`runFinalChainCheck`；`:1002` 返回 `chain_state` 与 `workflow_steps`。
- `skills/frontend-component-quality/SKILL.md:25-31`：消费者盘点之后、C03 资产检查之前，新增“变更影响与定向更新”小节。
- `skills/external/README.md:7-39`：三份外部方法的固定版本与许可；`skills/external/spec-driven-production/SKILL.md:101` 与 `references/execution.md:60` 是变更影响方法；`skills/external/material-agent-readiness-eval-markdown/SKILL.md:108/:136` 是 AUDIT/OPTIMIZE；`skills/external/design-tokens/SKILL.md:17` 是“检查已存在”。

**读回差异与取舍**
- 入口 2、3 的身份、迟到响应和 0.6 几何已有断言；不重写，只复核。
- 入口 1 当前 `:188` 成功应用查询先清详情，`:190` 空态在返回后呈现；编辑草稿并不清详情。空态断言只证重置生效，不冒清掉打开详情。
- 实盘台账没有定位失败/重试入口；规则 2 只落工作台。
- 实盘焦点不是“丢到 body”，是静默回退 h1；缺陷描述按代码写。
- 实盘 `clear()` 还有 `:310` 清除定位调用点，研究读回未列；修复放 `clear()` 内覆盖 `:310/:367/:369`。
- 五份正文按决策日志，不把 `design.md`、`craft.md` 算主承接；不适用与理由写 README ②⑦ 行；九处段落是八组回写中布局拆两段。
- 共享 `.lg-warning` 有 10 文件 26 处；选择器用 `.ll-root` 限定。
- 入口 4 的 `:679` 生产不可达、测试可达；CSS 断言必须写 popover 后代选择器。
- 87/87 一致性测试已在 main 存在；76 步复核是重跑，不是新写。
- 实盘详情来自冻结快照，无独立详情请求；取消恢复格写 N/A 加负向检查，或改用场景替换读回证据。
- `design.md:24` 的 47 与 `tokens-base.css` 的 33 有计数差异；本次不引该数。

**全局写边界**
- PB 修改：`paperbuilder/frontend/src/live-ledger.tsx`、`paperbuilder/frontend/src/ui/live-presentation.css`、`paperbuilder/frontend/src/ledger-signal-filter-state.test.tsx`、`paperbuilder/frontend/src/business-log-page.test.tsx`、`paperbuilder/frontend/src/backtest-workbench.test.tsx`、`paperbuilder/frontend/src/live-ledger-warning-wrap.test.tsx`（新增）。
- PB 条件修改：`paperbuilder/frontend/src/business-log-page.tsx`，仅入口 1 焦点断言 RED 时改焦点目标，不改 C03 行为语义；`paperbuilder/frontend/src/workbench-screen.lifecycle.test.tsx`，条件只允许“夹具/导入修复 + 焦点断言所需的最小条件断言”；未满足记未改与理由。
- PB 规范修改：`paperbuilder/specs/design/components.md`、`paperbuilder/specs/design/layouts.md`、`paperbuilder/specs/design/interaction.md`、`paperbuilder/specs/frontend/frontend.md`、`paperbuilder/specs/frontend/ui-quality.md`、`paperbuilder/specs/design/README.md`。
- WH 修改：`skills/frontend-component-quality/SKILL.md`。
- WH 条件修改：`tests/contract/check-stage-steps.test.mjs`，条件只允许“计数/声明断言不一致时最小修”；未满足记未改与理由；与 C06 卡测试区分。
- 任务库新增：C08-FU-01 任务卡、影响表、测试回执、页面观察、矩阵、方法执行记录、失败分支记录、最终验收与交接。
- PB 只读：`paperbuilder/frontend/src/live-ledger-locator.test.tsx`、`paperbuilder/frontend/src/live-pages.test.tsx`、`paperbuilder/frontend/src/config-risk-error-presentation.test.tsx`、`paperbuilder/frontend/src/live-cockpit.test.tsx`。
- PB 禁止改：其余 8 个含 `.lg-warning` 的文件、`paperbuilder/frontend/src/ui/primitives.tsx`、`paperbuilder/frontend/src/modal-focus.ts`、`paperbuilder/frontend/src/ui/workbench-page.css:845`、`paperbuilder/frontend/src/business-log-page.tsx` 的 C03 行为语义、`paperbuilder/frontend/src/workbench-screen.tsx` 的 C03 行为、`paperbuilder/frontend/src/simulation-records-page.tsx`。
- WH 禁止改：C06 的卡代码/测试、`runtime/task/final-chain-runner.mjs` 生产逻辑、外部方法副本字节。
- 条件写集只在对应条件满足时生效，默认只读。
- 不新增产品源文件；新增测试只限上列 `live-ledger-warning-wrap.test.tsx`，其余新增文件只在任务库证据区。

### 接口与失败语义

**不改公共接口**：不新增 API、schema、存储、权限、路由或持久对象；两域只改现有页面、测试、规范正文和方法正文。
**实盘 `clear()` 契约**：关闭详情前把 `triggerRef` 指向仍挂载的筛选控件（`select[aria-label="时段筛选"]`），再调 `setSignal(null)`，再重置筛选；三个用户触发点共用这一条路径。
**焦点返回契约**：`useDrawerFocus` 在 cleanup 读 `triggerRef.current`；连接且未禁用则聚焦，否则回退 h1；C08 不改该 hook。
**入口 1 焦点契约**：重置关闭详情后焦点到仍存在的筛选触发控件；原控件已移除时保留 h1 回退，记 unknown 与原因。
**告警样式契约**：`.ll-root .lg-warning` 允许正常换行与任意断词，加 `min-width: 0; max-width: 100%`；不改全局 `.lg-warning`。
**规范版本契约**：只在实际改动后上抬；版本格式沿原文件；README 只同步对应行，不独立起版本。
**两域证据契约**：PB 的设计/代码证据与 WH 的步骤/方法证据分列；同一结论不得只在另一域有证据。
**步骤通道契约**：runner 读材料根副本；副本缺失、陈旧或坏声明都判不可用，不判 completed；静态测试只证声明覆盖。
**PRD 卡契约**：C06 已合并；PRD 段由 C08 在 main 上补并验证；不可达时记 incomplete，不伪造卡代码。
**外部方法契约**：固定副本、固定版本、许可状态如实；不运行脚本，不新增包；token 只检查不生成。
**方法正文契约**：写进 `skills/frontend-component-quality/SKILL.md` 的 Component Quality Map，不新建技能、阶段或 gate。
**失败语义**：权限不足停该文件并记 unavailable。
派生失败保留源文件与旧派生；部分同步列成功/失败清单。
回退不兼容保旧版本与失败证据；未知消费者记 unknown，不扫全仓冒充穷尽。
**新增控制面**：`N/A — 复用现有页面、测试、规范入口和 runner，无新控制面`。

### 需求到任务追踪

每条来源都有功能需求、验收、任务和判定器；编号出现不等于覆盖，具体行为与反例在正文和 Appendix A。

| Source | FR | AC | Phase/Task | ORACLE |
| --- | --- | --- | --- | --- |
| R-001、R-002、R-003、R-004 | FR-C08-001 | AC-C08-1、AC-C08-6 | P1/T001 | ORACLE-P1-IMPACT |
| R-001、R-006、R-013 | FR-C08-002、FR-C08-003 | AC-C08-2、AC-C08-3 | P2/T002 | ORACLE-P2-COMPONENTS |
| R-001、R-006、R-013 | FR-C08-002、FR-C08-003 | AC-C08-2、AC-C08-3 | P2/T003 | ORACLE-P2-LAYOUTS |
| R-001、R-006、R-013 | FR-C08-002、FR-C08-003 | AC-C08-2、AC-C08-3 | P2/T004 | ORACLE-P2-FRONTEND |
| R-005、R-006、R-013 | FR-C08-004、FR-C08-005 | AC-C08-3、AC-C08-4、AC-C08-11 | P3/T005 | ORACLE-P3-LEDGER |
| R-003、R-013 | FR-C08-004 | AC-C08-3、AC-C08-4、AC-C08-11 | P3/T006 | ORACLE-P3-ENTRY-TESTS |
| R-007、R-013 | FR-C08-006 | AC-C08-4、AC-C08-11 | P4/T007 | ORACLE-P4-TESTS |
| R-007、R-013 | FR-C08-006 | AC-C08-4、AC-C08-6、AC-C08-11 | P4/T008 | ORACLE-P4-MATRIX、ORACLE-P4-PAGES |
| R-001、R-005 | FR-C08-007 | AC-C08-5 | P5/T009 | ORACLE-P5-FU01 |
| R-009、R-010 | FR-C08-009 | AC-C08-7 | P5/T010 | ORACLE-P5-GUARD |
| R-011、R-012、R-014 | FR-C08-010、FR-C08-011、FR-C08-013 | AC-C08-8、AC-C08-10、AC-C08-12 | P5/T011 | ORACLE-P5-RECEIPTS |
| R-008 | FR-C08-012 | AC-C08-9 | P5/T012 | ORACLE-P5-METHODS |
| R-001 | FR-C08-008 | AC-C08-6 | P6/T013 | ORACLE-P6-FAILURES |
| R-001、R-002、R-003、R-004、R-005、R-006、R-007、R-008、R-009、R-010、R-011、R-012、R-013、R-014 | FR-C08-001、FR-C08-002、FR-C08-003、FR-C08-004、FR-C08-005、FR-C08-006、FR-C08-007、FR-C08-008、FR-C08-009、FR-C08-010、FR-C08-011、FR-C08-012、FR-C08-013 | AC-C08-1、AC-C08-2、AC-C08-3、AC-C08-4、AC-C08-5、AC-C08-6、AC-C08-7、AC-C08-8、AC-C08-9、AC-C08-10、AC-C08-11、AC-C08-12 | P6/T014 | ORACLE-P6-ACCEPT |

任务 14 的来源、FR、AC 已逐字展开；T014 卡照抄这一行，不用范围写法。
判定器索引：
- `ORACLE-P1-IMPACT`：影响表加 PB 路径:行号独立读回。
- `ORACLE-P2-COMPONENTS`：`components.md` 差异、版本行、两个使用点。
- `ORACLE-P2-LAYOUTS`：`layouts.md` 三处与 `interaction.md` 焦点接缝。
- `ORACLE-P2-FRONTEND`：`frontend.md` 两节、`ui-quality.md` 验证层、README 版本行。
- `ORACLE-P3-LEDGER`：实盘 `clear()` 关闭详情、焦点回筛选控件、`.ll-root` 换行。
- `ORACLE-P3-ENTRY-TESTS`：入口 1 空态重置、入口 4 换行/断词、入口 2/3 复核。
- `ORACLE-P4-TESTS`：受影响定向测试的独立执行回执。
- `ORACLE-P4-MATRIX`：四个基础页面对象乘六维（24 格）矩阵逐格四要素。
- `ORACLE-P4-PAGES`：真实页面的焦点、几何、换行、窄屏观察。
- `ORACLE-P5-FU01`：C08-FU-01 卡、SLA、采用记录。
- `ORACLE-P5-GUARD`：76 步声明、87/87、runner 副本 E2E、三反例、PRD 段。
- `ORACLE-P5-RECEIPTS`：AC8/10/12 的只读回执与真实提问记录。
- `ORACLE-P5-METHODS`：三份方法执行记录、方法正文差异、许可口径。
- `ORACLE-P6-FAILURES`：五分支表、原始失败、受控样例。
- `ORACLE-P6-ACCEPT`：12 条 AC 逐条结果与交接。

### 全局验证策略

先跑受影响定向用例，不跑无范围全量。
运行前导出 `PAPERBUILDER_WORKTREE=<第 1 阶段干净树根>`；主工作区只是形状，build-code 用干净树。
PB 定向命令：
`bash -lc 'cd $PAPERBUILDER_WORKTREE/frontend && pnpm exec vitest run src/business-log-page.test.tsx src/workbench-screen.lifecycle.test.tsx src/backtest-workbench.test.tsx src/ledger-signal-filter-state.test.tsx src/live-ledger-locator.test.tsx src/live-ledger-warning-wrap.test.tsx src/config-risk-error-presentation.test.tsx src/live-cockpit.test.tsx'`
入口 1 单跑：
`bash -lc 'cd $PAPERBUILDER_WORKTREE/frontend && pnpm exec vitest run src/business-log-page.test.tsx'`
入口 4 单跑：
`bash -lc 'cd $PAPERBUILDER_WORKTREE/frontend && pnpm exec vitest run src/backtest-workbench.test.tsx'`
实盘台账单跑：
`bash -lc 'cd $PAPERBUILDER_WORKTREE/frontend && pnpm exec vitest run src/ledger-signal-filter-state.test.tsx src/live-ledger-locator.test.tsx src/live-ledger-warning-wrap.test.tsx'`
WH 76 步复核：
`bash -lc 'cd /Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c08-controlled-upgrade-20261102 && ../workflowhub/node_modules/.bin/vitest run tests/contract/check-stage-steps.test.mjs'`
WH 顺序回执：
`bash -lc 'cd /Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c08-controlled-upgrade-20261102 && ../workflowhub/node_modules/.bin/vitest run tests/contract/make-decision-flow.test.mjs tests/contract/make-decision-flows.test.mjs tests/contract/n10-process-repair.test.mjs tests/contract/n11-discussion-quality.test.mjs tests/contract/check-stage-steps.test.mjs'`
WH 揭示材料回归：
`bash -lc 'cd /Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c08-controlled-upgrade-20261102 && ../workflowhub/node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs'`
runner 读副本回执：
`cd /Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c08-controlled-upgrade-20261102 && node --input-type=module -e "import {runFinalChainCheck} from './runtime/task/final-chain-runner.mjs'; const r=runFinalChainCheck({taskPath:'/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c08-controlled-upgrade-20261102',materialRoot:'/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c08-controlled-upgrade-20261102/specs/workflowhub-ui-frontend-c08-controlled-upgrade-20261102'}); console.log(JSON.stringify({chain_state:r.chain_state,steps:r.workflow_steps.map(s=>[s.step_slug,s.state])}))"`
规范字节与差异：
`bash -lc 'cd $PAPERBUILDER_WORKTREE && git diff -- specs/design/components.md specs/design/layouts.md specs/design/interaction.md specs/frontend/frontend.md specs/frontend/ui-quality.md specs/design/README.md'`
`bash -lc "cd $PAPERBUILDER_WORKTREE && git show HEAD:specs/design/components.md | nl -ba | sed -n '1,45p'"`
写作读数：
`bash -lc 'cd /Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c08-controlled-upgrade-20261102 && node skills/spec-plan/scripts/check-authoring-budget.mjs specs/workflowhub-ui-frontend-c08-controlled-upgrade-20261102/spec.md'`
基础页面：第4阶段实际打开产品路由与同生产组件，允许注明来源的受控数据、故障和长文案；不要求真实行情、实盘模拟、平台凭据或正式worker/manifest匹配。实际服务基址与隔离方式如实记录，存储根有则记录、无则说明，不作真实数据验收前置；精确命令由Phase卡给出。

RED 归因：
- 实盘台账的新断言在 HEAD 应失败（目标行为失败）：清除筛选后详情仍开、焦点落 h1、`.ll-root .lg-warning` 无换行声明。
- 入口 1、4 的新断言可能本来就通过，因为行为已在 HEAD；记为“本来就通过”，不造仪式性 RED。
- 入口 2、3 的既有断言本来就是通过，只复核。
- 任一断言若因导入、环境或夹具失败，记夹具/环境失败，不冒目标 RED。
- 不为凑 RED 改断言、回退代码或放宽判据。

最终聚合：
- 任务 14 只读消费任务 1～13 的原件，补必要未闭环 case。
- 12 条 AC 逐条记通过、失败、部分、不可用或未完成及原因。
- AC5 的采用记录、AC7 的跨阶段段、AC9 的许可未知分别保留 pending/incomplete/unknown。
- 不用聚合分数吞掉单条失败，不用文件存在替代行为，不用另一条 AC 的证据补缺口。

不能证明的内容：
- 不做完整浏览器 QA、无障碍专项、性能专项或全量回归。
- C06 已合并；跨阶段部分按实际交付与 main 预存失败记录，不写成 main 全绿。
- C08-FU-01 的采用不在 C08 内完成。
- 两份外部方法的许可未声明，不能证明可再分发。
- `design-source-extraction.json` 缺失，不能证明设计源机器件完整。
- jsdom 不能证明真实换行、可见焦点和计算几何；CSS 文本断言只证源码层。
- 不证明 C03 已确认的行为语义发生变化；C08 不改这些语义。

## 怎么算通过？

按 Appendix A 的同一判定器逐条核；精确命令留所属 Phase，证据计划写七项。
正文只给场景、落点和指针，不复制判据；Appendix A 是唯一权威。

### 验收判据在哪里？

验收判据只在 Appendix A：通过条件、失败条件、来源和证据都写在那里。
正文、追踪表和决策日志交接只给指针，例如“判据见 Appendix A 的 AC-C08-4”。
同一份判据写两处必然漂移，读者不知道听哪个。

### 判定对象怎么与需求对齐？

PB域页面判定对象仅为A-D基础UI：业务日志与回测工作台四入口；台账源码与测试仍另按既有条款判，不验收台账页面。
WH 域判定对象是步骤消费者、runner、顺序方法、揭示材料校验和外部方法记录。
jsdom 测试只证 DOM、状态和断言；真实页面只证焦点、几何、换行和窄屏。
CSS 文本断言只证源码层，不证真实换行；组件 story 不证页面。
AC5 的采用记录、AC7 的跨阶段段是跨任务判据，C08 内只判安排与不可达段。
判定对象改变、判法改变或验证环境改变时，回原决定 owner，不在本规格自行放宽。

### 验收对象是什么？

验收对象同时包含 PaperBuilder 页面目标和当前任务材料工作区。
页面目标来自实际产品路由与页面入口；数据可受控。当前用户决定见 `quality/evidence/2026-11-03-102-c08-user-basic-page-acceptance-scope.json`：只验A-D基础UI，取消E台账页面及所有真实/实盘模拟数据资格要求。任务材料工作区来自认证worktree和任务库。
未取得的服务、存储根或视口如实标未知，不用示例地址或尺寸填充。

#### 验收对象

```json
{
  "workspace": "/Users/Hugh/Hugh/Project/PaperBuilder-workflowhub-ui-frontend-c08-controlled-upgrade-20261102",
  "service": "PaperBuilder 前端 Vite 开发服务（frontend/package.json 的 dev 脚本；build-code 用真实端口与启动命令）",
  "route": "/business-logs；回测工作台四基础入口（A-D，不含台账页面E）",
  "state": "业务日志重置详情与焦点；工作台定位失败重试；按实际测量公式取抽屉几何；浮层长错误换行。允许受控输入，不要求真实/实盘模拟数据",
  "viewport": "主档320与1280；375/768及未观察高度具名保留，不新增必测",
  "owner": "用户"
}
```

三源如下。
原始要求：`source_ref=decision-log.md`；理由：需求 1～14 明确要求真实使用点、四入口、台账和后续任务；限制：R-011 逐字原话未取得。
项目库存：`source_ref=context_map#/project_inventory`；理由：PB 路由 `App.tsx:157`、实盘入口 `live-cockpit.tsx:123`、四入口文件、共享抽屉与焦点、测试配置和 CSS owner 实际可读；限制：未扫动态路由与其他仓消费者。
已接受计划或实际前端改动：`source_ref=draft_spec`；理由：C03 三提交 `ba3441ad`、`f2009120`、`3de22971` 在 HEAD 祖先，四入口行为是既成事实；实盘三处是 planned，不写成已实现。
对象检查沿 `skills/spec-specify/templates/spec-template.md` 的唯一 producer；本节只给真实输入与三源，不复制 checker。
`ok` 只证最小字段存在，不证服务健康、环境可用或页面通过。

### 证据计划怎么写？

七项是判什么、怎么判、证据从哪来、谁提供、何时能拿到、成本类别、拿不到怎么办。
缺一项不得开工；不另建第二份验收计划。
拿不到时写真实尝试、卡点、提供者与恢复条件，不把缺口记为完成。

示例：判什么=入口 1 空态重置后重置回调发生且详情节点为空。
怎么判=ORACLE-P3-ENTRY-TESTS 核新用例；证据从哪来=单份 vitest 回执。
谁提供=测试作者；何时能拿到=P3 命令退出后；成本类别=命令级。
拿不到怎么办=记 incomplete，写尝试、卡点、提供者与恢复条件。
未达成项按真实尝试记录：`incomplete` 要写试过什么、卡在什么真实条件、谁提供、恢复条件；`unavailable` 要给原因与恢复条件。
机器判据没有真实尝试 ref 时不得记 incomplete；语义判定未执行可记 incomplete，但要写判定者、观察协议与证据落点。

## 测试计划是什么？

测试面按真实交付选择，每个要测的面在所属 Phase 配一条可执行命令与判定器。
本规格先固定输入、预期证据和覆盖限制，精确命令由 Phase 卡给出。

| 测试面 | 适用或排除理由 | 判定器与证据 | 覆盖验收 | 所属 Phase 命令 |
| --- | --- | --- | --- | --- |
| PB 业务日志 jsdom | 适用：入口 1 状态、空态与焦点 | ORACLE-P3-ENTRY-TESTS；vitest 回执 | 验收 3、11 | `pnpm exec vitest run src/business-log-page.test.tsx` |
| PB 工作台 jsdom | 适用：入口 2/3 身份、迟到响应、0.6 几何 | ORACLE-P3-ENTRY-TESTS；vitest 回执 | 验收 3、11 | `pnpm exec vitest run src/workbench-screen.lifecycle.test.tsx` |
| PB 回测浮层 jsdom 与 CSS 文本 | 适用：入口 4 源码层；真实换行另测 | ORACLE-P3-ENTRY-TESTS；CSS 文本断言 | 验收 4、11 | `pnpm exec vitest run src/backtest-workbench.test.tsx` |
| PB 实盘台账 jsdom | 适用：清除筛选/定位、焦点、CSS 文本 | ORACLE-P3-LEDGER；vitest 回执 | 验收 3、4、11 | `pnpm exec vitest run src/ledger-signal-filter-state.test.tsx src/live-ledger-locator.test.tsx src/live-ledger-warning-wrap.test.tsx` |
| PB 共享告警回归 | 适用：不改全站 `.lg-warning` | vitest 回执 | 验收 4、11 | `pnpm exec vitest run src/config-risk-error-presentation.test.tsx src/live-cockpit.test.tsx` |
| PB 真实页面 | 需真实环境：焦点、几何、换行、窄屏 | ORACLE-P4-PAGES；页面观察记录 | 验收 4、6、11 | 由 Phase 卡给；实际产品页面与注明来源的受控输入；存储根仅实际使用时记录 |
| WH 76 步与 runner | 适用：声明、副本、三反例 | ORACLE-P5-GUARD；测试与命令回执 | 验收 7 | `vitest run tests/contract/check-stage-steps.test.mjs` 加 runner 命令 |
| WH 顺序与揭示 | 适用：顺序、揭示材料 | ORACLE-P5-RECEIPTS；测试回执 | 验收 8、10、12 | 五个顺序测试加 reveal 测试 |
| 规范差异与版本 | 适用：五份正文与 README | ORACLE-P2-COMPONENTS/LAYOUTS/FRONTEND；git diff/HEAD | 验收 2、3 | `git diff` 与 `git show HEAD:` |
| 外部方法 | 适用：三份执行记录 | ORACLE-P5-METHODS；执行记录 | 验收 9 | 手动方法；不执行脚本 |
| 浏览器 a11y、性能、完整 QA | 排除：用户选择不做专项；具名理由：C08 只做定向页面观察 | 不作为判据 | N/A | 不安排 |
| 组件 story | 排除：不能替页面验证 | 不作为判据 | N/A | 不安排 |

浏览器可见面没有在本任务安排完整端到端测试，原因是用户已选定定向页面观察边界。
真实页面至少覆盖 320 与 1280；375/768 在同一会话抽检，未观察的视口逐项记 not_observed。
判定前读取既有测试资产治理规则；判定身份与样本身份保持独立。

## 有什么风险和未决？

最可能损害结果的是把静态文件、同义测试或单页改动放大成完整升级。
每项风险有触发、后果、缓解或停止、负责人、处理阶段和验证。

### 风险 1：PB 脏树把未提交字节带进规范

触发是直接在主工作区改或引 working tree 字节；后果是规范引非隔离树字节或混入其它改动；旧 87 个删除只保历史。
缓解是只读 HEAD 字节、从 main 建干净工作树、改前核 diff；负责人是当前主会话。
处理阶段是 P1、P2、P3；验证是 `git status`、`git diff --name-only` 与影响表。
关联未决 1。

### 风险 2：C06 交付时 main 的预存测试失败（C08 分支已修）

触发是 C06 交付后 main 的 OCR 16 条与 review-materials 3 条测试失败；后果是 C08 的防跳步/runner 证据可能被误当 main 全绿。
缓解是 C08 分支把两组测试迁到 `build-code + terminal` 并跑绿（19→0），只改测试、不改生产代码；main 未回写，仍不能写 main 全绿。
负责人是 C08 当前主会话；处理阶段是 P5；验证是 `2026-11-03-004-main-red-tests-fixed.md` 的两文件 0 failed 回执。
关联追加决定 11 与未决 2。

### 风险 3：C08-FU-01 逾期或只写页面名

触发是四入口闭环后未建卡，或建卡后没有采用记录；后果是验收 5 无法闭合。
缓解是 3 个工作日建卡、10 个工作日采用、逾期升级；不改验收口径。
采用记录未产时 AC5 记 incomplete，不记 pass；只有采用记录在场才判 pass。
负责人是当前主会话与后续任务 owner；处理阶段是 P5、P6；验证是任务卡、SLA 与采用记录。
关联未决 3。

### 风险 4：外部许可被写成已获许可

触发是把公开可读当许可，或把个人研究当再分发授权；后果是记录口径失真。
缓解是两份未声明许可如实写、按个人研究记录、不新增包、不执行脚本。
负责人是项目所有者；处理阶段是 P5；验证是执行记录的来源、版本、许可与使用点。
关联未决 4。

### 风险 5：真实页面环境不可用，页面证据缺失

触发是服务、端口或 `PAPERBUILDER_F6_STORAGE_ROOT` 不可用；后果是验收 4、6、11 的页面部分只能记 unavailable。
缓解是保留尝试、卡点、提供者与恢复条件，不用 jsdom、CSS 文本或截图名称冒页面通过。
负责人是 P4 测试者与主会话；处理阶段是 P4、P6；验证是页面观察记录与环境条件。
关联未决 5。

### 风险 6：设计源机器件与原型缺件

触发是 `design-source-extraction.json` 缺失，或当前具名原型不可读（旧删除已恢复，不继续声称当前缺件）；后果是设计源引用不完整。
缓解是按 design-source-readiness 手工列八类，原型用 `git show HEAD:` 取字节，明写缺件。
负责人是 build-plan 与 build-code；处理阶段是 P2、P4；验证是来源清单、字节与缺口说明。
关联未决 6。

### 风险 7：共享 `.lg-warning` 选择器泄漏

触发是直接改 `.lg-warning` 基础规则；后果是其他 8 个文件、23 处使用点回归。
缓解是用 `.ll-root` 父级限定，跑 `config-risk-error-presentation.test.tsx` 与 `live-cockpit.test.tsx` 回归。
负责人是前端工程 owner；处理阶段是 P3、P4；验证是选择器文本、定向测试与页面观察。
关联事实 7。

### 风险 8：静态证据冒运行或完成

触发是用 87/87、CSS 文本、文件存在或同义测试当运行/完成；后果是最终验收失真。
缓解是分层记证据、写 RED 归因、页面缺失记 unavailable、跨任务段记 pending。
负责人是实施者、独立测试与最终验收者；处理阶段是 P3～P6；验证是证据类型与 AC 逐条结果。
关联事实 3、事实 4、事实 10、事实 14。

### 补充材料与术语在哪里？

推导、原始输出和被否方案只放具名原件，正文按路径与节锚回读。
父 PRD 是 `specs/workflowhub-ui-frontend-release-20261020/prd.md` 的 C08 卡。
当前取舍是 `specs/workflowhub-ui-frontend-c08-controlled-upgrade-20261102/decision-log.md`。
代码与设计读回是任务库 `quality/evidence/research/2026-11-02-build-plan-code-and-design-readback.md` 与 `2026-11-02-build-plan-requirements-readback.md`。
C06 形状参考是 `workflowhub-workflowhub-ui-frontend-c06-spec-driven-implementation-20261031/specs/workflowhub-ui-frontend-c06-spec-driven-implementation-20261031/spec.md`（只读，不照抄）。
外部方法许可见 `skills/external/README.md`；领域术语见 `GLOSSARY.md`。
新术语在本规格「这是什么」首现解释；下游交接写明消费者、输入原件、触发条件和未完成项的恢复动作。

## Appendix A — 验收判据（唯一权威）

12 条验收在交付阶段首判，在任务 14 末验。
`机器可判` 指一条命令可重放真假。
`只能人读` 指独立执行单元按协议判断语义。
`需真实环境，可用自动化采集判` 指真实环境产生并自动取回判据。
本附录不写执行状态；实际结果由 build-code 终末和任务事实发布。

- [ ] **AC-C08-1**：四个入口各有旧新行为、原负责人、直接与一层间接使用点和未知项。
  关联 FR-C08-001。
  来源：R-001、R-002、R-003、R-004；决定=决定 1、2、3；source_status=current。
  判定方式：只能人读；判定时点：第 1 阶段任务 1 完成后首判，任务 14 末验。
  落点：第 1 阶段任务 1；末验第 6 阶段任务 14；精确命令由 Phase 卡给出。
  环境与数据：PB HEAD 5df81987、四个入口源码与测试、路由、共享抽屉/焦点/样式、git 状态。
  谁判：未参与实现的独立读者；末验者只读首判原件与必要复放。
验证：读影响表，逐入口核旧新行为、路径:行号、直接使用点、一层间接使用点和未知项；回读 PB 文件确认坐标。
通过：四个入口齐全；每入口至少一个直接与一个一层间接使用点；未知项保留 unknown；写明不扫全仓；写明 PB 头与脏树。
失败：只写文件名或只查名称；未知被写成零；把全仓扫描当穷尽；把 C03 候选交接当已验收；漏掉实盘台账这个新消费者。
证据：预期为影响表、独立读回件、PB HEAD 与 diff 状态；实际路径由执行者发布，本字段不是执行结果。

- [ ] **AC-C08-2**：四对象规范与实盘台账都更新，五份正文有真实差异。
  关联 FR-C08-002、FR-C08-005。
  来源：R-001、R-006、R-013；决定=决定 5、10；source_status=current。
  判定方式：只能人读；判定时点：第 2 阶段任务 2～4 完成后首判，任务 14 末验。
  落点：第 2 阶段任务 2～4，第 3 阶段任务 5；末验任务 14；精确命令由 Phase 卡给出。
  环境与数据：PB HEAD 的五份正文与 README、实盘台账源码与测试。
  谁判：未参与实现的独立读者；末验者只读首判原件与必要复放。
验证：读五份正文与 README 的 diff，逐处核规则、owner、使用点和版本；读实盘台账三处改动与测试。
  对象面是设计组件、设计布局、前端组件、前端布局、使用点；它不是 24 格矩阵的列，四对象写回与使用点另判。
通过：五份正文九处段落有真实差异；版本按原格式上抬；README ②⑦ 行写 design/craft 不适用与理由；实盘台账三处有代码与测试。
  派生同步只做 token 副本检查，不生成新派生生成物；来源=决定 8 与 `2026-11-02-build-plan-requirements-readback.md` 歧义 D；owner 项目所有者。
失败：只改 Markdown 或只改一页；没有 owner/使用点；版本未上抬；README ②⑦ 行无解释；实盘台账缺席。
  生成新派生件或把 token 检查写成生成。
证据：预期为 HEAD 差异、版本行、定向测试回执与页面观察；实际路径由执行者发布。

- [ ] **AC-C08-3**：四条规则回到唯一源，由四入口和实盘台账真实使用点闭环。
  关联 FR-C08-002、FR-C08-003、FR-C08-004、FR-C08-005。
  来源：R-001、R-006、R-013；决定=决定 5、10；source_status=current。
  判定方式：只能人读；判定时点：第 3 阶段完成后首判，任务 14 末验。
  落点：第 2 阶段任务 2～4，第 3 阶段任务 5～6；末验任务 14。
  环境与数据：五份正文、四入口测试与页面、实盘台账代码与测试、版本记录。
  谁判：未参与实现的独立读者；末验者只读首判原件与必要复放。
验证：逐条核规则 1～4 的主对象、owner、使用点和版本；做 F3 负向检查。
  对象面同 AC-C08-2；四条规则的使用点另判，不混入 24 格矩阵。
  逐条核使用点：规则 1 业务日志两个重置入口加台账；规则 2 工作台重试既有实现与页面观察。
  规则 3 工作台几何与台账焦点；规则 4 工作台浮层与台账换行。
  规则 2、3 不新增产品代码；证据是既有使用点复验与页面观察；不写成无使用点，不新增获批偏差。
通过：每条规则只有一个主权威；确认不存在获批偏差或 overlay 时才写不适用，并做负向检查。
  存在获批偏差或 overlay 时逐项登记 owner、版本、使用点和旧依据。
  四条规则的使用点逐条可核；规则 2、3 是既有使用点复验与页面观察，不是无使用点；没有新增获批偏差。
  上游升级按 S3 比较，不自动追 HEAD；经验候选与批准规则分开，不把候选当批准。
  父 PRD 的“不因知识候选就改 MUST”和 R-001 的“任务触发”落点：知识候选只作证据，不直接改 MUST；只有任务触发才启动升级，非任务触发不扩大规范。
  版本有实际使用点；AC3 不依赖 C08-FU-01。
失败：同一条规则两处权威；不适用没有负向检查。
  存在偏差或 overlay 却不登记；自动追 HEAD；把经验候选当批准规则。
  因知识候选直接改 MUST；把非任务触发的知识候选写成默认升级。
  版本上抬没有使用点；只改文档；AC3 等 C08-FU-01 才闭环。
证据：预期为版本记录、四入口测试回执、页面观察和负向检查清单；实际路径由执行者发布。

- [ ] **AC-C08-4**：四个C03基础页面对象A-D乘六维负例矩阵（24格）可核；用户取消E台账页面验收。
  关联 FR-C08-006。
  来源：R-001、R-003、R-007；决定=决定2、6、10及追加决定14；当前用户范围来源 `quality/evidence/2026-11-03-102-c08-user-basic-page-acceptance-scope.json`；source_status=current。
  判定方式：需真实环境，可用自动化采集判；判定时点：第 4 阶段任务 8 完成后首判，任务 14 末验。
  落点：第 4 阶段任务 8；末验任务 14；精确命令由 Phase 卡给出。
  环境与数据：A-D初始状态、操作、定向测试、实际产品页面和独立审查；允许注明来源的受控数据/故障/长文案。真实行情、实盘模拟、LIVE_SIM、平台凭据、正式worker/manifest匹配不再是验收前置。
  谁判：未参与实现的独立测试与审查者；末验者只读首判原件与必要复放。
验证：逐格核初始状态、操作、断言和证据类型；每对象至少一条测试或页面证据；不适用格写理由与负向检查。
  入口 1 的状态保留格写：重置后界面按重置后的筛选值显示，不残留旧查询值；详情为空。
  decision-log 验收 4 的“筛选值保留”按本规格解释为“按重置后的筛选值显示，不残留旧查询值”；焦点目标为仍存在的筛选项；台账目标 `select[aria-label="时段筛选"]`仅保留为源码/测试合同，不属本页面验收；裁决见 `quality/evidence/2026-11-02-008-prototype-adjudication.md`（主会话裁决，已写）；decision-log 旧措辞不改，已知跨材料差异，以 spec 与本件为准。
  入口 1 的焦点格写：重置关闭详情后焦点落在仍存在的筛选触发控件（筛选开关或重置按钮）。
  原控件已移除时保留 h1 回退，记 unknown 与原因。
通过：A-D四个基础页面对象乘六维24格齐全，原状态、焦点、几何、错误/溢出判据保留；未改行为不回归。
  入口 1 焦点到仍存在的筛选触发控件；原控件移除时有 h1 回退与 unknown 记录。
  E台账页面不进入当前分母；旧E缺证保留为历史，不标成通过。浏览器迟到竞态未观察仍逐项标明，由T007原定向测试承接对应行为，不另增浏览器竞态或视口要求。
  独立代码审查原件在场：读 P2/P3 真实 diff、P1 两层消费者、P4 矩阵与未改行为，findings 与处置可核。
  任务 14 在逐条结论前消费该原件，缺原件不得判通过。
失败：空格子；用组件story代替页面；没有原主档窄屏或溢出；没有实际产品页面；矩阵漏掉A-D任一基础对象；把受控输入冒自然后端/实盘事实。
  入口 1 要求焦点回被移除的触发行；把 h1 回退当通过；写成保留重置前的筛选值。
  缺独立代码审查原件或 findings 未处置。
证据：预期为矩阵、定向测试回执、页面观察、独立代码审查原件（findings 与处置）。
  任务 14 在逐条结论前消费，缺原件不支持 pass；实际路径由执行者发布。

- [ ] **AC-C08-5**：C08-FU-01 在 C08 计划里具名安排，采用记录决定 AC5 能否判通过。
  关联 FR-C08-007。
  来源：R-001、R-005；决定=决定 4；source_status=current（安排）、deferred（采用记录）。
  判定方式：只能人读；判定时点：第 5 阶段任务 9 完成后首判，任务 14 末验。
  落点：第 5 阶段任务 9；末验任务 14；精确命令由 Phase 卡给出。
  环境与数据：C08 计划文本、任务库任务卡、C08 更新后的五份正文版本、采用记录。
  谁判：未参与实现的独立读者；末验者只读首判原件与必要复放。
验证：核名称、owner、创建触发、排期、SLA、验收人和兜底路径；核任务卡是否建立；核采用记录是否真实读新版并实际使用。
通过：安排六项齐全可核；只有真实读 C08 更新后的五份正文版本并实际使用的采用记录在场，AC5 才判 pass。
  采用记录未产时 AC5 记 incomplete，不记 pass；缺记录时写 owner=C08-FU-01 与关闭条件。
失败：只写页面名；无 owner 或 SLA；永久挂起；把 pending 当通过；把安排六项当采用完成。
  同任务重放、保存成功或推给 C09 被当采用；AC5 被用来阻塞 AC3。
证据：预期为计划文本、任务卡和采用记录；没有采用记录时证据只支持 incomplete，不支持 pass；实际路径由执行者发布。

- [ ] **AC-C08-6**：权限不足、派生失败、部分同步、回退不兼容、未知消费者都保原事实与范围。
  关联 FR-C08-008。
  来源：R-001；依据=工作包 6（decision-log.md:298-328）；source_status=current。
  判定方式：只能人读；判定时点：第 6 阶段任务 13 完成后首判，任务 14 末验。
  落点：第 1 阶段任务 1、第 4 阶段任务 8、第 6 阶段任务 13；末验任务 14。
  环境与数据：真实失败记录、当前写集、受影响文件清单、未知清单、一个受控缺证据样例。
  谁判：未参与实现的独立读者；末验者只读首判原件与必要复放。
验证：逐分支核触发、保留、禁止覆盖、恢复责任和可执行路径；核原失败与已成功部分；核未知清单与检索范围。
通过：五分支齐全；原错误、已成功部分和未授权改动原样保留；不报全部已同步；不复活旧权威；未知保留 unknown；缺声明样例只证步骤通道。
失败：用“不可用原因”替代分支验证；覆盖他人改动；报“全部已同步”；把未知当零；受控样例被扩成全部真实生命周期。
证据：预期为分支表、原始失败和受控样例；实际路径由执行者发布。

- [ ] **AC-C08-7**：防跳步完成通道可见，静态声明与 runner 两层证据分开。
  关联 FR-C08-009、FR-C08-010。
  来源：R-009、R-010；决定=决定 9、11；source_status=current（静态/runner/C06 卡）；PRD 段由 C08 补。
  判定方式：机器可判（静态与 runner）加只能人读（C06 卡/PRD 段与不展示）。
  判定时点：第 5 阶段任务 10 完成后首判，任务 14 末验。
  落点：第 5 阶段任务 10；末验任务 14；精确命令由 Phase 卡给出。
  环境与数据：canonical 声明、材料根副本、`steps.json`、`check-stage-steps.test.mjs`、`runFinalChainCheck`、三份临时反例。
  谁判：未参与实现的主会话外独立执行者；末验者只读首判原件与必要复放。
验证：重跑 76 步与 87/87；用现有 `runFinalChainCheck`/`check-stage-steps` 在当前仓跑 runner 读副本 E2E；用 `check-stage-steps --stage=build-prd --step=1 --card` 读取当前 PRD 卡。
  构造副本缺失、副本陈旧、坏声明三反例；C06 已合并，核当前步卡与 PRD 段（卡探测输出 + 6 个 build-prd step_slug 覆盖）；核逐步展示。
通过：canonical 117 行（76 步声明）与副本 body 相同；87/87 只证声明覆盖。
  runner 读到 completed；三反例分别报错、判 stale、报错。
  runner 不可达时按运行结果记 incomplete，不把 C06 当 runner 前提；其余三反例可在当前 runner/副本上做的照做。
  C06 已合并；PRD 段由 T010 交付，交付物是卡探测输出、6 个 build-prd step_slug 与声明覆盖；C06 交付时 main 的 OCR/review-materials 预存失败已由 C08 分支修测试（19→0），不并入本 AC，不写成 main 全绿；runner 不可达按实际结果记 incomplete。
  不得用 87/87 或静态声明冒充；无逐步展示。
失败：把 87/87 当完成通道；副本缺失静默通过；陈旧副本判 completed；坏声明降级成通过。
  把 C06 已合并当 main 全绿；把预存测试当本 AC 的通过或失败；把 PRD 段无代码称交付；把 runner 不可达全推给 C06。
  PRD 卡无代码却称交付；用户看到逐步步骤卡。
证据：预期为 canonical 与材料根副本两处字节、测试回执、runner 回执、三反例记录、C06 合并事实、PRD 卡探测输出与 6 个 build-prd step_slug、预存测试修复回执；实际路径由执行者发布。

- [ ] **AC-C08-8**：提问前从 steps.json 和 todo 取下一步，问题只限当前步或已确认下一步。
  关联 FR-C08-010。
  来源：R-011；依据=决策日志变更 4；source_status=current；逐字原话未取得。
  判定方式：只能人读；判定时点：第 5 阶段任务 11 完成后首判，任务 14 末验。
  落点：第 5 阶段任务 11；末验任务 14；精确命令由 Phase 卡给出。
  环境与数据：`steps.json`、todo、一次真实提问记录、草稿“下一步”冲突反例。
  谁判：未参与实现的独立读者；末验者只读首判原件与必要复放。
验证：核提问前读取顺序、问题范围、冲突处置和真实记录；核材料没有逐步展示。
  受控冲突场景：固定 steps.json、todo 与一份给出不同下一步的草稿，记录提问前实际读取顺序与最终问题。
通过：先读当前步和下一步；固定 steps.json、todo 与不同下一步草稿的受控场景在场。
  下一步只从权威表取；问题只限当前步或已确认下一步；冲突时停在当前步，不按草稿跨步。
  有一次真实提问记录；无逐步展示。
失败：从草稿句子取下一步；问题跨未确认步骤；没有真实记录；只写规则不做；用户看到逐步步骤卡。
证据：预期为步骤表、todo 和真实提问记录；没有真实提问时记 incomplete，写 owner 与关闭条件。

- [ ] **AC-C08-9**：三份外部方法真执行，并把变更影响与定向更新写入现有前端组件质量方法。
  关联 FR-C08-012。
  来源：R-008 与决定 7、决定 8；source_status=current；许可未知。
  判定方式：只能人读；判定时点：第 5 阶段任务 12 完成后首判，任务 14 末验。
  落点：第 5 阶段任务 12；末验任务 14；精确命令由 Phase 卡给出。
  环境与数据：`skills/external/` 三份固定副本、`skills/frontend-component-quality/SKILL.md:25-31`、五份正文、任务库记录。
  谁判：未参与实现的独立读者；末验者只读首判原件与必要复放。
验证：核三份方法执行记录、来源与固定版本、许可口径、使用点；核 token 只检查不生成；核没有新增包或执行脚本。
    核 `skills/frontend-component-quality/SKILL.md` 新增小节的位置、输入、输出、失败语义、来源、owner 和使用点。
    核没有新建技能、阶段或 gate；R-008 只要求使用方法，写入部分单列为决定 8 的来源。
通过：三份方法有真实执行记录；变更影响方法以影响表为输入；材料优化只修真实缺口；token 只检查；两份未声明许可如实写；没有新增包或脚本。
    小节写在消费者盘点之后、C03 资产检查之前；写清影响表、直接/间接消费者、未知与失败；有来源、版本、owner 和真实使用点。
失败：只读方法名；把方法正文写入当执行；写“已获许可”；新增包；生成或替换 token；只引用不执行。
    没有写入方法正文；新建独立技能；新增阶段或 gate；没有来源、owner 或使用点。
证据：预期为三份执行记录、许可口径、token 检查输出、方法正文差异和来源记录；实际路径由执行者发布。

- [ ] **AC-C08-10**：方向审查揭示材料缺一即阻断，四份齐全才进入 reveal。
  关联 FR-C08-011。
  来源：R-012、U-026；依据=工作包 0；source_status=current。
  判定方式：机器可判；判定时点：第 5 阶段任务 11 完成后首判，任务 14 末验。
  落点：第 5 阶段任务 11；末验任务 14；精确命令由 Phase 卡给出。
  环境与数据：揭示包、`make-decision-direction-reveal.test.mjs`、`skills/wh-review/SKILL.md:24/:32` 合同文字、缺失与齐全两例。
  谁判：未参与实现的独立执行者；末验者只读首判原件与必要复放。
验证：重跑回归 5/5；核缺失时公共入口报 MATERIAL_INCOMPLETE 且不派发；四份齐全才进入 reveal 和 challenge。
  核揭示材料合同说明落点（`skills/wh-review/SKILL.md:24/:32`）与回归测试。
通过：缺失被阻断；不派发、不静默降级；四份齐全进入 reveal；回归 5/5。
  揭示包路径可读；合同说明落点可读（`skills/wh-review/SKILL.md:24/:32`）。
失败：缺材料仍派发；部分材料被当齐全；只写规则不跑测试；合同说明落点缺失；用审查意见代替用户确认。
证据：预期为测试回执、缺失/齐全两例、揭示包路径和合同说明落点；实际路径由执行者发布。

- [ ] **AC-C08-11**：四个C03入口有测试或基础页面使用观察；台账保留新增源码与定向测试，不再要求台账页面观察。
  关联 FR-C08-004、FR-C08-005、FR-C08-006。
  来源：R-013；决定=决定 10；source_status=current。
  判定方式：需真实环境，可用自动化采集判；判定时点：第 3、4 阶段完成后首判，任务 14 末验。
  落点：第 3 阶段任务 5～6，第 4 阶段任务 7～8；末验任务 14。
  环境与数据：四入口测试、台账定向测试、A-D基础页面与逐入口登记；页面可用受控输入，不要求真实行情/实盘模拟数据。
  谁判：未参与实现的独立测试与审查者；末验者只读首判原件与必要复放。
验证：逐入口核新断言或页面观察；入口 1 用重置生效或 `filter_no_result` 渲染断言；入口 2/3 复核既有断言；入口 4 用 CSS 文本或真实浏览器；台账用新增源码/定向测试承接，页面观察按用户新决定取消。
通过：每入口都有新断言或页面观察；入口 1 不冒充“清掉打开中的详情”。
  入口 2/3 不重复造同义用例；入口 4 有换行/断词证据。
  台账源码与测试仍有清除筛选关详情与焦点返回，不将取消页面验收读成删除实现或免测试。
  独立代码审查原件在场：读 P2/P3 真实 diff、P1 两层消费者、P4 矩阵与未改行为，findings 与处置可核。
  任务 14 在逐条结论前消费该原件，缺原件不得判通过。
失败：一处改动代替四入口；重复同义用例；入口 1 用空态冒充清详情；入口 4 只证文本存在；台账源码/定向测试缺席。
  缺独立代码审查原件或 findings 未处置。
证据：预期为定向测试回执、页面观察、逐入口登记、独立代码审查原件（findings 与处置）。
  任务 14 在逐条结论前消费，缺原件不支持 pass；实际路径由执行者发布。

- [ ] **AC-C08-12**：make-decision 顺序调整有只读回执，13/14/15 与 76 步计数一致。
  关联 FR-C08-013。
  来源：R-014、U-027；依据=工作包 0；source_status=current。
  判定方式：机器可判；判定时点：第 5 阶段任务 11 完成后首判，任务 14 末验。
  落点：第 5 阶段任务 11；末验任务 14；精确命令由 Phase 卡给出。
  环境与数据：`steps.json`、`SKILL.md`、`step-consumer-design.md`、五个顺序测试、TCR 审查、确认原件。
  谁判：未参与实现的独立执行者；末验者只读首判原件与必要复放。
验证：核 steps.json 与 SKILL 表一致；重跑五个测试；读 TCR 审查；核旧第 13 步确认未被当新最终确认。
通过：13 是 spec-analyze、14 是 approve-decision、15 是 closeout。
  15 步与 76 步计数不变；五个测试通过；TCR approved。
  最终确认在 spec-analyze 之后。
失败：只改 SKILL 不改 steps.json；计数改变；测试未跑；复用旧确认；没有 TCR。
证据：预期为 steps.json/SKILL 差异、五个测试回执、TCR 审查和确认原件；实际路径由执行者发布。

## Appendix B — 需求与编号对照

正文中文编号与机器编号在这里一一对应。
来源到功能需求的完整去向见「需求到任务追踪」；本附录只做对照和机器绑定。

| 正文编号 | 机器编号 | 说明 |
| --- | --- | --- |
| 需求 1 | R-001 | 任务触发的受控升级 |
| 需求 2 | R-002 | 主线用四个真实改动入口 |
| 需求 3 | R-003 | 四个入口全做 |
| 需求 4 | R-004 | 两层引用，不扫全仓 |
| 需求 5 | R-005 | 实盘台账与模拟记录页分工 |
| 需求 6 | R-006 | 规则进共享规范，代码进实盘台账 |
| 需求 7 | R-007 | 定向测试、真实页面、独立审查 |
| 需求 8 | R-008 | 外部方法沿用 |
| 需求 9 | R-009；U-025 | 流程执行防跳步 |
| 需求 10 | R-010 | 步骤卡只在内部 |
| 需求 11 | R-011 | 提问前从权威表取下一步 |
| 需求 12 | R-012；U-026 | 方向审查揭示材料校验 |
| 需求 13 | R-013 | 四入口使用同步 |
| 需求 14 | R-014；U-027 | make-decision 顺序调整 |
| 场景 1 | SCN-C08-001 | 影响面盘查 |
| 场景 2 | SCN-C08-002 | 规范回写与版本 |
| 场景 3 | SCN-C08-003 | 四入口补缺口断言 |
| 场景 4 | SCN-C08-004 | 实盘台账新消费者 |
| 场景 5 | SCN-C08-005 | 独立定向复验 |
| 场景 6 | SCN-C08-006 | 后续任务采用 |
| 场景 7 | SCN-C08-007 | 防跳步与提问 |
| 场景 8 | SCN-C08-008 | 外部方法与顺序回执 |
| 场景 9 | SCN-C08-009 | 失败分支与交接 |
| 事实 1 | PFACT-001 | 四入口行为已在 HEAD |
| 事实 2 | PFACT-002 | 入口 2/3 已有断言 |
| 事实 3 | PFACT-003 | 入口 1 空态限制 |
| 事实 4 | PFACT-004 | 入口 4 测试缺口 |
| 事实 5 | PFACT-005 | 实盘无规则 2 入口 |
| 事实 6 | PFACT-006 | 实盘焦点回退 h1 |
| 事实 7 | PFACT-007 | 共享告警面 |
| 事实 8 | PFACT-008 | 五份正文九处段落 |
| 事实 9 | PFACT-009 | PB 脏树与干净 frontend |
| 事实 10 | PFACT-010 | 76 步 canonical 与副本 |
| 事实 11 | PFACT-011 | C06 已合并；预存测试已修 |
| 事实 12 | PFACT-012 | 外部方法与许可 |
| 事实 13 | PFACT-013 | 设计源机器件缺失 |
| 事实 14 | PFACT-014 | AC10/AC12 改动已提交 |
| 事实 15 | PFACT-015 | C08-FU-01 未建 |
| 事实 16 | PFACT-016 | 两域交付 |
| 事实 17 | PFACT-017 | 模拟记录页不在 C08 |
| 功能需求 1 | FR-C08-001 | 影响面与两层消费者 |
| 功能需求 2 | FR-C08-002 | 四对象规范回写 |
| 功能需求 3 | FR-C08-003 | 唯一源与版本上抬 |
| 功能需求 4 | FR-C08-004 | 四入口使用同步与测试 |
| 功能需求 5 | FR-C08-005 | 实盘台账新消费者 |
| 功能需求 6 | FR-C08-006 | 独立复验与负例矩阵 |
| 功能需求 7 | FR-C08-007 | 后续任务采用 |
| 功能需求 8 | FR-C08-008 | 失败与边界五分支 |
| 功能需求 9 | FR-C08-009 | 防跳步完成通道 |
| 功能需求 10 | FR-C08-010 | 步骤卡内部口径与提问前取数 |
| 功能需求 11 | FR-C08-011 | 方向审查揭示材料 |
| 功能需求 12 | FR-C08-012 | 外部方法执行 |
| 功能需求 13 | FR-C08-013 | 顺序调整 |
| 验收 1 | AC-C08-1 | 影响面 |
| 验收 2 | AC-C08-2 | 规范与台账更新 |
| 验收 3 | AC-C08-3 | 唯一源与使用点 |
| 验收 4 | AC-C08-4 | 负例矩阵 |
| 验收 5 | AC-C08-5 | 后续任务安排 |
| 验收 6 | AC-C08-6 | 五类失败分支 |
| 验收 7 | AC-C08-7 | 防跳步通道 |
| 验收 8 | AC-C08-8 | 提问前取数 |
| 验收 9 | AC-C08-9 | 外部方法与方法正文写入 |
| 验收 10 | AC-C08-10 | 揭示材料校验 |
| 验收 11 | AC-C08-11 | 四入口闭环 |
| 验收 12 | AC-C08-12 | 顺序调整 |
| 风险 1 | RISK-01 | PB 脏树 |
| 风险 2 | RISK-02 | C06 交付时预存测试失败，C08 分支已修 |
| 风险 3 | RISK-03 | C08-FU-01 逾期 |
| 风险 4 | RISK-04 | 外部许可 |
| 风险 5 | RISK-05 | 真实页面缺失 |
| 风险 6 | RISK-06 | 设计源缺件 |
| 风险 7 | RISK-07 | 选择器泄漏 |
| 风险 8 | RISK-08 | 静态证据冒运行 |
| 未决 1 | OPEN-01 | PB 干净工作树 |
| 未决 2 | OPEN-02 | C06 合并与 PRD 卡 |
| 未决 3 | OPEN-03 | C08-FU-01 采用 |
| 未决 4 | OPEN-04 | 外部许可 |
| 未决 5 | OPEN-05 | 真实页面证据 |
| 未决 6 | OPEN-06 | 设计源机器件与原型 |
| 未决 7 | OPEN-07 | R-011 逐字原话 |
| 未决 8 | OPEN-08 | token 计数漂移 |
| 阶段 1 | P1 | 影响面 |
| 阶段 2 | P2 | 五份规范回写 |
| 阶段 3 | P3 | 代码与测试 |
| 阶段 4 | P4 | 独立复验 |
| 阶段 5 | P5 | 后续与流程 |
| 阶段 6 | P6 | 整卡验收与交接 |
| 任务 1 | T001 | 影响面与两层消费者 |
| 任务 2 | T002 | components.md 回写 |
| 任务 3 | T003 | layouts.md 与 interaction.md 回写 |
| 任务 4 | T004 | frontend.md、ui-quality.md 与 README |
| 任务 5 | T005 | 实盘台账三处与测试 |
| 任务 6 | T006 | 四入口缺口断言与复核 |
| 任务 7 | T007 | 定向测试回执 |
| 任务 8 | T008 | 真实页面与负例矩阵 |
| 任务 9 | T009 | C08-FU-01 建卡与采用安排 |
| 任务 10 | T010 | PRD 卡、76 步复核、runner E2E、三反例 |
| 任务 11 | T011 | AC8/10/12 只读回执 |
| 任务 12 | T012 | 方法正文写入与外部三方法执行 |
| 任务 13 | T013 | 五类失败分支与未知消费者证据 |
| 任务 14 | T014 | 12 条 AC 逐条验收与交接 |

### 未决编号对照

本规格未决 1～8 按实际内容对应 decision-log 的未决项，不按示例序号硬套；不新增未决。
本规格未决 3 才是 C08-FU-01，对应 decision-log 未决 13/4；示例中的未决 6=decision-log 13 不适用本文编号。

| 本规格未决 | decision-log 未决 | 说明 |
| --- | --- | --- |
| 未决 1 | 未决 2 | PB 干净工作树 |
| 未决 2 | 未决 1、未决 5 | C06 已合并；预存测试已修；步骤副本绑定由 AC-C08-7/T010 覆盖 |
| 未决 3 | 未决 13、未决 4 | C08-FU-01 未建；采用记录未产 |
| 未决 4 | 未决 6 | 两份外部方法许可未声明 |
| 未决 5 | 未决 10、未决 11 | C03 运行证据未产；AC4/6/7 未执行 |
| 未决 6 | 无直接对应 | decision-log 未决 3 已由本规格九处段落落盘；设计源缺件为本规格新增具体缺口 |
| 未决 7 | 未决 8 | R-011 逐字原话未取得 |
| 未决 8 | 无直接对应 | decision-log 未决 9 细节审查覆盖不完整；token 计数为本次新发现 |

decision-log 其余未决的去向：
未决 3 已由本规格九处段落落盘；未决 5 由 AC-C08-7/T010 覆盖。
未决 7 运行时硬门仍开放，owner 用户，本规格不新增。
未决 9 保留决策日志；未决 11 的 AC4/6/7 由本规格 AC-C08-4/6/7 承接。
未决 12 由 AC-C08-3/11 覆盖；未决 13 与未决 4 归本规格未决 3。

以下功能需求绑定是机器追踪区（校验器用，人可跳过）。
每条保留原始来源、当前决定、事实、场景和验收去向。

- **FR-C08-001**：关联 PFACT-001、PFACT-002、PFACT-005、PFACT-016，SCN-C08-001，AC-C08-1、AC-C08-6。
  来源绑定：source=R-001、R-002、R-003、R-004；decision=决定 1、2、3；
  source_status=current；state=影响面与未知；acceptance=AC-C08-1、AC-C08-6。
- **FR-C08-002**：关联 PFACT-008、PFACT-013，SCN-C08-002，AC-C08-2、AC-C08-3。
  来源绑定：source=R-001、R-006、R-013；decision=决定 5、10；
  source_status=current；state=规范回写与版本；acceptance=AC-C08-2、AC-C08-3。
- **FR-C08-003**：关联 PFACT-008，SCN-C08-002，AC-C08-2、AC-C08-3。
  来源绑定：source=R-001、R-006、R-013；decision=决定 5、10；
  source_status=current；state=版本上抬与负向检查；acceptance=AC-C08-2、AC-C08-3。
- **FR-C08-004**：关联 PFACT-001、PFACT-002、PFACT-003、PFACT-004，SCN-C08-003，AC-C08-3、AC-C08-11。
  来源绑定：source=R-003、R-013；decision=决定 10；
  source_status=current；state=四入口缺口断言；acceptance=AC-C08-3、AC-C08-11。
- **FR-C08-005**：关联 PFACT-005、PFACT-006、PFACT-007，SCN-C08-004，AC-C08-3、AC-C08-4、AC-C08-11。
  来源绑定：source=R-005、R-006、R-013；decision=决定 4、5、10；
  source_status=current；state=实盘台账新消费者；acceptance=AC-C08-3、AC-C08-4、AC-C08-11。
- **FR-C08-006**：关联 PFACT-001、PFACT-004、PFACT-005，SCN-C08-005，AC-C08-4、AC-C08-6、AC-C08-11。
  来源绑定：source=R-001、R-007、R-013；decision=决定 6、10；
  source_status=current；state=复验与矩阵；acceptance=AC-C08-4、AC-C08-6、AC-C08-11。
- **FR-C08-007**：关联 PFACT-015、PFACT-017，SCN-C08-006，AC-C08-5。
  来源绑定：source=R-001、R-005；decision=决定 4；source_status=current（安排）、deferred（采用记录）；
  journey=后续任务；state=采用 pending；acceptance=AC-C08-5。
- **FR-C08-008**：关联 PFACT-009、PFACT-010、PFACT-011，SCN-C08-009，AC-C08-6。
  来源绑定：source=R-001；依据=工作包 6（decision-log.md:298-328）；
  source_status=current；state=五类失败；acceptance=AC-C08-6。
- **FR-C08-009**：关联 PFACT-010、PFACT-011，SCN-C08-007，AC-C08-7。
  来源绑定：source=R-009、R-010；decision=决定 9；
  source_status=current（静态/runner/C06 卡）；state=完成通道；acceptance=AC-C08-7。
- **FR-C08-010**：关联 PFACT-014，SCN-C08-007，AC-C08-7、AC-C08-8。
  来源绑定：source=R-011；依据=决策日志变更 4；
  source_status=current（逐字原话未取得）；state=提问前取数；acceptance=AC-C08-7、AC-C08-8。
- **FR-C08-011**：关联 PFACT-014，SCN-C08-008，AC-C08-10。
  来源绑定：source=R-012、U-026；依据=工作包 0；
  source_status=current；state=揭示材料校验；acceptance=AC-C08-10。
- **FR-C08-012**：关联 PFACT-012、PFACT-013，SCN-C08-008，AC-C08-9。
  来源绑定：source=R-008；decision=决定 7、8；
  source_status=current（许可 unknown）；state=外部方法与方法正文；acceptance=AC-C08-9。
- **FR-C08-013**：关联 PFACT-014，SCN-C08-008，AC-C08-12。
  来源绑定：source=R-014、U-027；依据=工作包 0；
  source_status=current；state=顺序回执；acceptance=AC-C08-12。

事实影响绑定如下，保证每条事实都能回到功能需求与验收。
未知事实的风险与未决绑定已在正文逐项写明。

- PFACT-001：FR-C08-001、FR-C08-004、FR-C08-006；AC-C08-1、AC-C08-3、AC-C08-4、AC-C08-11。
- PFACT-002：FR-C08-001、FR-C08-004、FR-C08-006；AC-C08-3、AC-C08-11。
- PFACT-003：FR-C08-004；AC-C08-11；RISK-08。
- PFACT-004：FR-C08-004、FR-C08-006；AC-C08-4、AC-C08-11。
- PFACT-005：FR-C08-001、FR-C08-005、FR-C08-006；AC-C08-3、AC-C08-4、AC-C08-11。
- PFACT-006：FR-C08-005；AC-C08-3、AC-C08-4、AC-C08-11。
- PFACT-007：FR-C08-005；AC-C08-4、AC-C08-11；RISK-07。
- PFACT-008：FR-C08-002、FR-C08-003；AC-C08-2、AC-C08-3。
- PFACT-009：FR-C08-001、FR-C08-002、FR-C08-008；AC-C08-1、AC-C08-2、AC-C08-6。
- PFACT-010：FR-C08-008、FR-C08-009；AC-C08-6、AC-C08-7。
- PFACT-011：FR-C08-008、FR-C08-009、FR-C08-010；AC-C08-6、AC-C08-7。
- PFACT-012：FR-C08-012；AC-C08-9。
- PFACT-013：FR-C08-002、FR-C08-003、FR-C08-012；AC-C08-2、AC-C08-3、AC-C08-4、AC-C08-9；OPEN-06、RISK-06。
- PFACT-014：FR-C08-010、FR-C08-011、FR-C08-013；AC-C08-8、AC-C08-10、AC-C08-12。
- PFACT-015：FR-C08-007；AC-C08-5。
- PFACT-016：FR-C08-001、FR-C08-009、FR-C08-012；AC-C08-1、AC-C08-7、AC-C08-9。
- PFACT-017：FR-C08-007；AC-C08-5。




### build-code 当前基线事实修订（2026-11-03）

用户原话“采用当前 main”，确认原件 `quality/evidence/human-confirmations/2026-11-02-003-build-code-baseline-current-main.json`。独立最小 TCR 意见 `quality/evidence/2026-11-02-009-c08-baseline-independent-assessment.md`；调查 `quality/evidence/2026-11-02-010-c08-p1-baseline-investigation.md`。本次只更新环境、失效锚与入口1生命周期事实；功能、AC、写集和覆盖上限不变。旧原型删除、旧97与旧HEAD不作为当前事实或通过条件。
