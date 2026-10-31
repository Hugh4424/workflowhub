# 决策基线（本次投递摘要）

权威：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md；主题分组：未提供主题分组源。
摘要只帮助审查定位当前承诺。冲突以有源的后续真实答复与决定为准；未决项不当批准。

## 原始需求（51 条）

- 需求 1：交付可执行的多维判据。上下文：prd.md:326；工作包 3（待收敛）。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L133
- 需求 2：交付真实隔离采集与对照。上下文：prd.md:326；工作包 4＋决定 24～27（失败语义待收敛）。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L134
- 需求 3：交付范围与失败表达。上下文：prd.md:326；工作包 2、7（待收敛）。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L135
- 需求 4：问题可定位、责任回修、独立复验。上下文：prd.md:326；工作包 6＋决定 11。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L136
- 需求 5：产品验收者与 `verify-code`（旧验证命令）的消费方式。上下文：prd.md:326；工作包 7（接点重指 build-code 终末段）。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L137
- 需求 6：能对现有真实产品独立验收。上下文：prd.md:326；工作包 1＋决定 5、6；交付已确认，剩复制留痕（未决 21）。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L138
- 需求 7：分「资产本身」与「真实页面使用」两层。上下文：prd.md:327；工作包 3＋决定 12。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L139
- 需求 8：视觉九项逐项点名。上下文：prd.md:327；工作包 3＋决定 12、13（来源已定）。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L140
- 需求 9：体验、行为、a11y、性能、任务成功与视觉分开。上下文：prd.md:327；工作包 3＋决定 5、15＋缺口：真实后端业务（未决 9）。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L141
- 需求 10：覆盖 S5 全部适用状态、压力与环境项。上下文：prd.md:327；工作包 3。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L142
- 需求 11：交付报告表达与消费接口。上下文：prd.md:327；工作包 7。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L143
- 需求 12：不预定旧 schema 名、不新建评测或报告平台。上下文：prd.md:327；范围与非目标；决定 9。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L144
- 需求 13：不擅自动修源设计。上下文：prd.md:327；工作包 6＋范围与非目标。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L145
- 需求 14：核对象健康与身份→备数据→采集→对照→分级定位→最小修复→复验。上下文：prd.md:328；工作包 4、6。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L146
- 需求 15：每个判据有执行方法、成功失败条件、原始证据、责任。上下文：prd.md:328；工作包 3＋决定 8。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L147
- 需求 16：未见与未测跟缺陷分开；工具异常不回空结果。上下文：prd.md:328；工作包 5＋决定 8。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L148
- 需求 17：模糊反馈先定位页面、元素、状态再动作。上下文：prd.md:328；工作包 6。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L149
- 需求 18：责任路由：设计归原型卡、代码归实现卡、诊断与复验归本卡。上下文：prd.md:130；工作包 6＋缺口：实现卡未立项（未决 22）。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L150
- 需求 19：九项与各质量面有可执行清单与报告，接入 frontend-testing（前端测试技能）。上下文：prd.md:329；工作包 7、8。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L151
- 需求 20：URL、来源、状态、视口、工作区、服务可核，console（浏览器控制台）输出可见。上下文：prd.md:329；工作包 4＋决定 24。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L152
- 需求 21：严重度、低保真、缺证据、预算停止沿 S5，小毛病（MINOR）批量真实确认。上下文：prd.md:329；工作包 5、6、7＋决定 10、30、31＋冲突（未决 15）。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L153
- 需求 22：数值与独立观察互补；体验用可证伪任务；性能分别实测。上下文：prd.md:329；工作包 3、5。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L154
- 需求 23：定位反馈、路由责任修复、独立复验、局部三轮与停滞。上下文：prd.md:329；工作包 6＋决定 11。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L155
- 需求 24：若采用 UES（外部工具集），先修证据绑定、严格输入、未知保留、子失败传播。上下文：prd.md:329；缺口：UES 采用范围（未决 10）。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L156
- 需求 25：九项与适用面逐项判据、原始结果、未覆盖说明。上下文：prd.md:330；工作包 3、4＋决定 8、12。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L157
- 需求 26：错环境或未启动报不一致或不可用；没跑视觉标未测。上下文：prd.md:330；工作包 4、5＋决定 8。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L158
- 需求 27：哈希浮窗、长文本、窄容器、缩放、遮挡、键盘焦点等反例要检测与修复。上下文：prd.md:330；工作包 3、6。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L159
- 需求 28：同一数值差异同标尺可重复同级，有负例，分歧保留复核。上下文：prd.md:330；工作包 5＋决定 10、28＋缺口：样例与刻度（未决 7）。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L160
- 需求 29：定位后修复、独立复验与回归、三轮与停滞、原型问题回设计 owner。上下文：prd.md:330；工作包 6＋决定 11。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L161
- 需求 30：未知、空值、失联采集、证据错配不聚合成高分。上下文：prd.md:330；工作包 5＋决定 8、13。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L162
- 需求 31：Figma（设计工具）资产、代码组件、页面布局与操作分别可追溯。上下文：prd.md:330；工作包 3＋决定 8、14＋缺口：无资产（未决 11）。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L163
- 需求 32：明显偏差但任务可完成仍按重要级，不因可操作降级。上下文：prd.md:332；工作包 5＋决定 10。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L164
- 需求 33：预算停止与四类原因分开，未测不计通过。上下文：prd.md:332；工作包 5＋决定 8。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L165
- 需求 34：判定器取真实动作、数值几何、console、性能原件、任务真值。上下文：prd.md:333；工作包 4、5；不等于新增 gate（阶段放行条件）。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L166
- 需求 35：准备依赖：真实运行对象、授权、S5 范围与判据。上下文：prd.md:334；工作包 1＋决定 5、6；剩复制留痕（未决 21）与业务（未决 22）。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L167
- 需求 36：实现依赖：既有前端卡（C01/C03）、隔离 QA、真实浏览器；实现卡非硬前置。上下文：prd.md:335；工作包 1、2、4、8＋决定 21～27（不建第二套浏览器栈）。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L168
- 需求 37：验收依赖：具名真实产品、可复核案例、原 owner 修复、独立复验。上下文：prd.md:336；工作包 1、6＋决定 5、6＋缺口：业务承接（未决 22）。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L169
- 需求 38：合并依赖：引用契约已交付；同测试方法按运行判据 owner 串行。上下文：prd.md:337；工作包 8＋风险节。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L170
- 需求 39：共享责任：采集、评价、定位、复验归本卡，修复归原 owner。上下文：prd.md:338；工作包 1、2＋决定 9、11。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L171
- 需求 40：不拿首屏代业务、不假绑定、不聚合吞未知（unknown）、不拿模拟角色冒真人；缺值不默认 0。上下文：prd.md:340；工作包 5＋决定 8。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L172
- 需求 41：可后置 AEM、大评测平台与全自动评分；九项等五项不得后置。上下文：prd.md:341；范围与非目标。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L173
- 需求 42：最小读取集按 NAV-C07 导航清单；不全读评测套件，不凭命令（CLI）成功推覆盖。上下文：prd.md:342；本任务材料与调研报告覆盖节。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L174
- 需求 43：先锁范围与判据、逐块实测、质量未知不伪造通过、不新增恢复状态机。上下文：prd.md:343；工作包 7＋范围与非目标。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L175
- 需求 44：每个工作包先谈定怎么验：观察什么、什么算成功、什么算失败。上下文：答复 66；067 后条；工作包 11＋决定 43；验收 8。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L176
- 需求 45：每张 Phase 实施前有完整验收设计：对象、环境与数据、用例、预期、执行者、恢复。上下文：答复 66；067 后条；决定 43；验收 8。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L177
- 需求 46：独立测试实际执行代码、接口、界面、端到端与真实数据，并对照标准判效果。上下文：答复 66；067 后条；决定 43；验收 9。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L178
- 需求 47：失败回修、受影响重验、更新用例与结论；有问题的地方必须重测。上下文：答复 66；067 后条；决定 44；验收 9。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L179
- 需求 48：只有本 Phase 的验收标准满足，才能说开发完成。上下文：答复 66；067 后条；决定 44；验收 9。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L180
- 需求 49：改后的方法材料能被没参与写作的人直接接手使用。上下文：答复 65；067 前条；决定 44；验收 10。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L181
- 需求 50：专业问题落到最终稿，程序接入、真实投递、实际效果分别举证。上下文：答复 65；067 前条；决定 44；验收 11。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L182
- 需求 51：材料按十条标准写给读者，机器字段只收在末尾。上下文：答复 67；068；决定 44；验收 10。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L183

## 用户答复（67 条，1 组）

### 用户答复（未提供主题分组）

- 答复 1：交付含真实检查与回修，不是纯判据文档。上下文：工作包 1、3；Talk:B2。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L195
- 答复 2：浏览器只经 isolated-browser-qa（隔离 QA 网关）静默驱动；链不可用如实标。上下文：工作包 4；未决 2；Talk:A1。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L196
- 答复 3：报告须含多维结果、根因与责任、修复记录、独立复验、失败与未覆盖。上下文：工作包 7；验收面；Talk:A2。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L197
- 答复 4：正式验证在 build-code；原型卡完成后合并进来再验真实页面。上下文：工作包 2、7；风险节；Talk:B1。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L198
- 答复 5：是为 workflowhub 设计完整能力，不是单页修复；要交代怎么做、何时做。上下文：工作包 1；决定 2；Talk:B2。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L199
- 答复 6：测试或审查子代理执行，结果回阶段开发者修；能力与规范须通用、被真实消费。上下文：工作包 6、8；决定 11、33；Talk:B3。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L200
- 答复 7：方法归属：把 plan-design-review（设计审查技能）扩成设计与页面两模式。上下文：工作包 8；决定 38；Talk:C1。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L201
- 答复 8：强制范围：所有有浏览器可见面的任务都强制走。上下文：工作包 7；决定 35；Talk:C2。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L202
- 答复 9：路线基线：按主会话展示的骨架继续。上下文：工作包 1；决定 2；Talk:C3。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L203
- 答复 10：结果取四态；未测算通过即失败；不适用须有据。上下文：工作包 2；决定 8；Talk:D1。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L204
- 答复 11：问题记录沿用现字段；页面、状态、视口、身份写进证据文字；不新开材料键。上下文：工作包 2；决定 9；Talk:D2。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L205
- 答复 12：严重度沿用三档映射；处置沿用现词；复验结果单独记。上下文：工作包 2、5；决定 10；Talk:D3。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L206
- 答复 13：执行者须是测试或审查子代理，开发者不自审；复验同一独立角色；两模式共契约。上下文：工作包 2、6；决定 11；Talk:D4。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L207
- 答复 14：九项来源未定；先调研原型卡（C05）判据并复用现成标准，不新造。上下文：工作包 3、8；由答复 20 关闭；Talk:E1。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L208
- 答复 15：视觉偏差用项目 token 与刻度、明确例子、校准负例定级。上下文：工作包 5；决定 10；Talk:E2。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L209
- 答复 16：页面检查只有一套标准：八维做骨架，九项作第 5 维子检查。上下文：工作包 3；决定 12；Talk:F1。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L210
- 答复 17：取值复用 design-source-extraction 的四项口径，补五项属性口径，不新建 schema。上下文：工作包 3；决定 13；Talk:F2。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L211
- 答复 18：校准负例至少三条；同一偏差同标尺重复跑须同级。上下文：工作包 5；决定 28；验收 4；Talk:F3。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L212
- 答复 19：无设计源时只判能判的，还原度写「不适用加理由」，不声称已验。上下文：工作包 3、5；决定 14；Talk:F4。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L213
- 答复 20：九项来源已定，不再是「待调研或自建」；关闭对应未决。上下文：决定 12、13；Talk:F5。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L214
- 答复 21：性能放第 3 维下的「运行性能」子组；设计模式第 3 维仍只叫「交互与状态」。上下文：工作包 3、5、7；决定 15；Talk:G1。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L215
- 答复 22：第 7 维只装无障碍，不塞性能；对比度、可访问名、焦点归它。上下文：工作包 3；决定 16、17；Talk:G2。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L216
- 答复 23：业务操作用页面任务脚本加可观察终态；mock 上的真实后端业务写未覆盖。上下文：工作包 3、5、6、7；决定 29；Talk:G3。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L217
- 答复 24：九项到八维按给定表映射；主维判成败，副维只补证据、不重复计数。上下文：工作包 3；决定 17；Talk:G4。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L218
- 答复 25：第 8 维页面模式只核对象与代码版本对应；不适用须写理由。上下文：工作包 3；决定 18；Talk:G5。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L219
- 答复 26：启动声明：按标准开始这个复杂任务，先建 worktree，一起调研。上下文：级别与路线；不是选项选择；Talk:H1。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L220
- 答复 27：对象选原型卡正在做的样本；撤回的草稿不算；不改原型卡工作区。上下文：工作包 1；决定 3、4；Talk:H1（H2 见答复 4）。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L221
- 答复 28：保留 isolated-browser-qa，不退役。上下文：工作包 4；决定 21；Talk:I1。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L222
- 答复 29：默认引擎用 ego-lite；本机没有 ego 才用 agent-browser（回退引擎）。上下文：工作包 4；决定 22；Talk:I2。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L223
- 答复 30：简化网关：能交给 ego-browser 的交给它，QA 合同不可替代部分保留。上下文：工作包 4；决定 23；未决 2、5；Talk:I3。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L224
- 答复 31：build-code 的页面检查全自动，不让用户参与确认。上下文：工作包 5、6、7；决定 30；Talk:J1。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L225
- 答复 32：不要确认：既不逐项，也不批量要用户签。上下文：工作包 5、6、7；决定 30、31；未决 15；Talk:J2。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L226
- 答复 33：回退口径：ego 在跑就用；装了没开则回退并记 engine-fallback；选定后失败不切。上下文：工作包 4；决定 24；Talk:K1。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L227
- 答复 34：简化力度取保守简化：留回退、修 bug、browser-use（旧引擎工具）降为可选或 legacy（历史保留）。上下文：工作包 4；决定 27；Talk:K2。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L228
- 答复 35：对象走两条腿：受控页建能力，原型卡（C05）收口前交付样本作第二腿；交不出记未测。上下文：工作包 1；决定 5、6；未决 21；Talk:L1。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L229
- 答复 36：确认收尾六项：修复归属、受控页、强制触发、规范消费、外部内容、报告接入。上下文：工作包 1、3、5、7；决定 6～20、32～37；Talk:M1。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L230
- 答复 37：ego 是用户本机授权工具，记下授权继续用。上下文：工作包 4；决定 25 补注；未决 6；Talk:N1。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L231
- 答复 38：入口路线正式选继续复杂路线，不缩小范围、不改普通五阶段。上下文：级别与路线；已定；Talk:N2。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L232
- 答复 39：任务级别正式选「复杂」。上下文：级别与路线；已定；Talk:O1。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L233
- 答复 40：决策流程有问题，把九条改进并入当前任务。上下文：工作包 9；决定 39、40；Talk:O2/O3。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L234
- 答复 41：分级后、大纲前必须问一次要不要做内外部调研并记录。上下文：工作包 9；已定；Talk:P1。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L235
- 答复 42：调研决策答「够了，按现有调研定大纲」；缺口留未决与风险，不称全覆盖。上下文：工作包 9；已定；Talk:Q1。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L236
- 答复 43：正式页面审计放代码冻结前、最后开发阶段收口；终末只复核。上下文：工作包 7；决定 34；Talk:R1。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L237
- 答复 44：样本合并后修复由本卡全改；原型卡 owner 收清单交接；独立复验同角色。上下文：工作包 1、6；决定 6；未决 17；Talk:R2。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L238
- 答复 45：工作包 9（M9）的流程修复留在本任务实施，属例外；owner 是当前主会话；决策阶段不改技能。上下文：工作包 9；决定 39、40；未决 16；Talk:R3。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L239
- 答复 46：终末只复核四项：审计报告、修复记录、受影响面回归、独立复验证据。上下文：工作包 7；决定 34；验收 5、6；Talk:S1。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L240
- 答复 47：原型卡在开发；用户会通知它的开发代理准备样本并随任务交付。上下文：工作包 1；决定 7；未决 21、17；Talk:S2。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L241
- 答复 48：最终确认等于阶段收口，不是下一阶段许可；不得催下一阶段。上下文：工作包 9；决定 39、40；未决 18；Talk:T1。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L242
- 答复 49：对象版本钉 9efb7e57；be7a5673 作废；c887 与 9efb 字节同但绑 41eae967，分开写。上下文：工作包 1、10；决定 3、42；Talk:U1。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L243
- 答复 50：问题清单交用户与设计 owner 并归档；本卡只做复现与独立验收。上下文：工作包 6；决定 6；Talk:U2。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L244
- 答复 51：本地使用可复制（个人研究）；六件 grant unknown 只影响对外分发；不写已获 grant。上下文：工作包 3；决定 20；Talk:U3。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L245
- 答复 52：不继承、不引用原型卡的 17 项限定通过、效果达标、已闭环；只按自己验收。上下文：工作包 10；决定 7；Talk:U4。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L246
- 答复 53：200% 缩放与键盘焦点必测；读屏未测不作必测门。上下文：工作包 3；决定 36；验收 3；Talk:U5。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L247
- 答复 54：新增第 10 个包（M10）交付证据与防假绿，分 P0、P1、P2 三级。上下文：工作包 10；决定 41、42；Talk:U6。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L248
- 答复 55：批准后界面行为变更：登记差异并取得同意，不默认重展示；两版本分开。上下文：工作包 10；决定 42；Talk:U7。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L249
- 答复 56：材料提交到 C07 分支；主会话稍后执行、不 push；提交前不写已提交。上下文：工作包 9；决定 39；Talk:U8。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L250
- 答复 57：收尾校验并入批准绑定与报告重签发，不新开阶段校验。上下文：工作包 10；决定 41、42；Talk:V1。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L251
- 答复 58：真注入、200% 与键盘、读屏与直接打开文件升最高优先级；读屏作证据不作门。上下文：工作包 10；决定 41；验收 3；Talk:V2。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L252
- 答复 59：材料改进「完全没有实现」，三份材料仍啰嗦、黑话多、结构乱；要彻底解决。上下文：追加节；追加决定 1～3；本日志追加节。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L253
- 答复 60：这些工作放本任务里做，作为一个任务或阶段，不在 build-plan（规划阶段）开发。上下文：追加节；材料为读者写那个 Phase；本日志追加节。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L254
- 答复 61：允许修改两条冻结契约测试里的字面断言。上下文：追加节；去字面断言那个 Phase；`quality/evidence/human-confirmations/2026-10-29-001-allow-frozen-assertion-change.md`。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L255
- 答复 62：不能只在阶段末检查，写时就防；阶段末由没参与写作的独立子代理核对。上下文：追加节；材料为读者写那个 Phase；本日志追加节。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L256
- 答复 63：spec 与 Phase 要让空白上下文子代理拿到项目知识、任务上下文与执行计划。上下文：追加节；材料为读者写、让审查判方案；本日志追加节。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L257
- 答复 64：STE100 与 ISO 24495 的要求有没有告诉写文档的子代理；单行一千字谁都读不动。上下文：追加节；写作契约；本日志追加节。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L258
- 答复 65：允许修本轮自身设计验收、融合后续选择、finding 落最终稿复验、区分接入与投递与实际效果，并提交合并。上下文：工作包 11；决定 43、44；067 前条。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L259
- 答复 66：原需要在三类材料里逐步长成完整验收；先谈每包怎么验；Phase 最重要的是验收标准；独立执行、失败重验，满足验收才称完成。上下文：工作包 11；决定 43、44；验收 8～11；067 后条。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L260
- 答复 67：材料质量只按十条标准衡量：为读者写、一节一问、一句一行、术语首现解释、机器字段收在末尾、不要分级袖标式标题。上下文：工作包 11；决定 44；验收 10；068。来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L261

## 需求与答复的附带原文

这是一个普通任务：给 workflowhub 建一套能验真实页面的能力，不是修一个页面。
任务编号是 workflowhub-ui-frontend-c07-real-page-verification-20261028。
目标仓是 `/Users/Hugh/Hugh/Project/workflowhub`，认证 worktree 以 task.json 为准。
任务库根是 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/` 下的同名目录。
本日志里的相对路径都相对任务库根解析，不能按工作区当前目录解析。
当前阶段是 build-code（构建阶段）内的「原需求验收纠偏」设计。
原 make-decision（决策阶段）的记录保持它写下时的样子，不追改成今天的说法。
入口规模与路线评估的取值只写在「级别与路线」一节，这里不复制。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L31-L40

发布计划在 C07 卡上写了 43 条要求：6 条结果与重心、7 条范围、5 条流程、
6 条功能、9 条验收、10 条判定器与依赖边界。
本轮用户原话又拆出 8 条：需求 44 到 51，来源是答复 65 到 67。
下面一条一行，前 43 条在前，本轮 8 条在表尾。
来源列只写 `prd.md:行`，指目标仓的发布计划原文件：
`specs/workflowhub-ui-frontend-release-20261020/prd.md`。
落点只写工作包与决定；写「缺口」的地方是还没人接的那部分。
逐字短引、类型与依赖在需求索引原件里，路径见「外置事实索引」。
本日志用角色名代替卡号：C05 是原型卡，C06 是实现卡，C08 是发布卡，C07 是本任务。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L120-L130

用户在过程中给了 67 次答复，每一次都改变了某处判断，下面一条一行。
答复 1～58 的原件是 Talk 批次；答复 59～64 的原件是本日志的追加节。
答复 65、66 的原件是 067 的前条与后条；答复 67 的原件是 068。
067、068 里的原生消息 ID 都没取得，原件中已标注，本表不补造。
答复 14 已被答复 20 关闭：九项来源已定，不再是「待调研」。
本任务不另存同名的 `requirement-change-log.md`；其余原件就是唯一来源。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L185-L192

本轮把答复 66、67 的要求并入当前决定，而不是只记一笔变更。
怎么验的写法见每个工作包的「怎么验这个包」，写作标准见决定 44。
逐字短引、类型与依赖在需求索引第 7 节，路径见「外置事实索引」。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L262-L266

## 已记录决定

#### 决定 1 — 写成一处方法加一个薄校验脚本，不新建技能包

- **做什么**：只写一处方法正文，加一个只查形状的薄脚本，接到现有阶段上。
  - 被拒的两条路是：只扩前端测试技能；新建一个独立技能包。
  - 理由是现成技能已有真实消费者，另建包会多一份要维护的重复正文。
  - 用户说过不要每个任务都新建一种东西，这与调研的三条路比价一致。
  - 依据：`research/2026-10-28-005-…` 第 2 节、`research/2026-10-28-002-…` 第 7 节。
  - 薄脚本只查身份块、维度必填、四态枚举、证据引用、未测理由。
  - 它拒绝总分，也拒绝把未知值聚合成通过；它不判内容好坏。
- **不做什么**：不新增公共命令，不建报告平台或第二证据库。
  - 也不把判据复制进各任务 spec：复制一次就多一份要同步的正文。
- **风险**：薄脚本通过容易被当成质量通过，形状齐而内容空。
  - 缓解：脚本不参与验收判定，只在报告里报形状，判定仍由独立执行者做。
- **改动**：要改 `skills/frontend-testing/*`（判据与脚本落点待收敛）、
  `skills/review/SKILL.md`、`workflows/build-code/SKILL.md`。
  - 行与符号待写集。
  - 落在「判据与共用契约」与「报告接入与回修闭环」两个 Phase，写主是方法 owner。

证据：原件：`research/2026-10-28-002-c07-internal-capability.md` 第 7 节；Talk:B3。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L300-L319

#### 决定 2 — 路线基线就按已展示的十二节骨架继续

- **做什么**：按主会话展示过的十二节骨架推进材料，后续材料沿用同一骨架。
  - 被拒的是入口评估给的两条路：缩小范围，或改走普通五阶段。
  - 理由是用户先说过「按这个骨架继续」，后来又正式选定继续复杂路线。
  - 依据：两次答复的原文在 Talk 批次原件里，方向一致，没有第三种读法。
- **不做什么**：不因为骨架被确认，就当成路线也被确认。
  - 骨架管材料长什么样，路线管走几段；两者分开确认。
- **风险**：若后来真改走缩小范围，工作包要重排，已写的落点会失效。
  - 缓解：本日志只在级别与路线一节记路线，包里只引用，不各自表态。
- **改动**：只改材料形态，也就是本日志、需求索引、覆盖矩阵与 Talk 批次。
  - 不改代码，也不改任何已确认的判据。

证据：Talk:C3、Talk:N2；原件：`refs/talk/2026-10-28-c07-direction.md`。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L320-L334

#### 决定 3 — 验收对象钉在 9efb7e57 的 A/B 两套样本上

- **做什么**：取原型卡合并后的 A/B 两套样本，提交号钉在
  9efb7e577a62d36393caedfb30fc35bf3cb80834，正文简称 9efb7e57。
  - 被拒的两个版本是 be7a5673，以及字节相同但绑定别的提交的 c887。
  - 理由是 be7a5673 少了后两次修复；c887 虽与 9efb 同字节，
    但原型卡认可时绑的是 41eae967，两个引用必须分开写。
  - 这是用户直接给的版本选择，不是代理按新旧猜的。
- **不做什么**：不声称这两套样本等于真实产品，它们是 mock，没有真实后端。
- **风险**：把两个提交的字节数混用，会让证据对不上。
  - 六个文件与字节都写在下面的改动里，41eae 口径的 525086 字节不混用。
- **改动**：对象与版本声明；样本在原型卡归档里，只读，A 与 B 各一套。
  - A 三个运行文件与 sha256：页面 fa35dedb…、脚本 2f6c12d5be76…（442619 字节）、
    样式 99c22f99…；脚本与源码逐字节一致。
  - B 三个运行文件：页面 38b20b2f…、脚本 a9821904…、样式 ee996492…。
  - 六个文件合计 525142 字节，是交付指针 058 的口径；
    另一份记录（767）写 525086 字节，是 41eae 口径，两者不可混用。
  - 写主是当前主会话；落「判据与共用契约」与「报告接入」。

证据：Talk:U1；原件：`research/2026-10-29-010-c05-sample-usability.md`。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L335-L355

#### 决定 4 — 归档只读，取用就是复制到自有位置再提交

- **做什么**：归档目录一律只读；取用等于复制到本任务可写位置，再提交。
  - 被拒的两条路是：在归档原地改；只读引用而不复制。
  - 理由是归档是历史原件，原地改会毁证据；只读引用又承载不了后续修复。
  - 复制后记 commit、sha256 与时点，三样齐了才算取用完成。
- **不做什么**：不在归档里修问题，也不把归档当工作副本。
- **风险**：复制可能字节漂移，后续证据就对不上原件。
  - 缓解：复制后校验 sha256 并留痕；这件事本身还没做完，记在未决 21。
- **改动**：取用与提交的写法；落在「判据与共用契约」与本包相关 Phase。
  - 写主是当前主会话，执行时机是收口前。

证据：Talk:U1、Talk:U8；原件：`research/2026-10-29-011-c07-decision-impact.md`。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L356-L369

#### 决定 5 — 对象走两条腿：自建受控页加真实样本

- **做什么**：自建受控页先证明能力建得起来、验得动；真实样本作第二腿。
  - 被拒的是：只等真实样本；或只用自建页。
  - 理由是只等样本会让能力空转；只用自建页则能力可能只活在样例上。
  - 原型卡已交付并合并，第二腿已经成立，不再是有条件的前提。
- **不做什么**：不把「已交付」当「已验证」，也不继承原型卡的通过结论。
- **风险**：样本是 mock，没有真实后端，业务类结论只能记未覆盖。
  - 缓解：两条腿的结果分开记录，缺哪条就说缺哪条，不互相顶替。
- **改动**：对象状态与两腿写法；落「判据与共用契约」与「受控测试页」两个 Phase。

证据：Talk:L1、Talk:U1；原件：`research/2026-10-29-010-c05-sample-usability.md`。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L370-L382

#### 决定 6 — 样本合并后由本任务全改，问题清单交用户与设计 owner

- **做什么**：在自有工作副本里改问题，清单交用户与设计 owner，并归档留证。
  - 被拒的是：按发布计划把修复交回原型卡 owner；或只诊断不修。
  - 理由是原型卡 owner 已关闭，交回去没人接；本任务手上有副本，
    也要做独立复验，所以修复与复验必须同在一处。
  - 这是对发布计划分工的明确例外，用户点了头，不是代理自己扩权。
- **不做什么**：不改原型卡原工作区与归档，也不做真实业务写。
- **风险**：接收方变成用户，响应可能延迟；没人接时修复等于没有回执。
  - 缓解：清单归档留证，用未决 17 跟踪交付与交接。
- **改动**：交接对象、清单与复验记录；落「判据与共用契约」与「受控测试页」。
  - 写主是当前主会话，修复执行仍在 build-code。

证据：Talk:U2、Talk:R2；原件：`research/2026-10-29-011-c07-decision-impact.md`。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L383-L397

#### 决定 7 — 交付状态改记「已交付并合并」，旧的兜底说法转历史

- **做什么**：把原型卡的交付状态记成已交付并合并，交付指针 058，
  合并提交是 1c0948c3 与 c53c8ecd。
  - 被拒的是继续记「未交付」并保留兜底。
  - 理由是事实已经变了；继续写未交付，会让后续阶段按错的起点做。
- **不做什么**：不写「样本已验证」，也不继承限定的通过与效果达标结论。
- **风险**：旧兜底说法散在多处，改一处漏一处会让读者读到两个状态。
  - 缓解：只在交付状态处写一次，其它节引用；提醒件保留为历史，不删。
- **改动**：交付状态与提醒件；原「待定」项转为已定（见「已定 2」）。
  - 写主是当前主会话；不动原型卡材料。

证据：Talk:U1、Talk:U2。
原件：`quality/evidence/handoff/c05-sample-delivery-notice.md`。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L398-L412

#### 决定 8 — 结果取四态，未测算通过就算失败

- **做什么**：检查项结果与展示都用四态：通过、失败、未测、不适用。
  - 机器字段也取四态；整体摘要与终末验收结论各走各自的原接口。
  - 被拒的三条路是：沿用旧八值词表直接展示；只留通过与失败两态；
    把八值塞进检查项。
  - 理由是三层各有层次；硬做一一映射会造出没有来源的换算。
  - 实读记录：核过检查脚本的状态枚举与主阶段脚本的结果字段，本次不改接口。
- **不做什么**：不允许「限定通过」——只看首屏、只看桌面、只看一套样本，
  一律记未测；「不适用」必须给依据，不能当逃路。
  - 薄脚本只校验机器字段，不判展示文本，也不判内容对不对。
- **风险**：把整体结果放进检查项，会违反原接口，下游读不了。
  - 缓解：各自按自己的字段消费，不新增枚举，也不做自动转换。
- **改动**：判据正文的结果列、薄脚本的枚举校验；落「判据与共用契约」。
  - 写主是判据 owner；不改运行时接口。

证据：Talk:D1。
原件：`research/2026-10-28-005-workflowhub-test-review-integration.md` 第 5.3 节。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L438-L456

#### 决定 9 — 问题记录沿用现有字段，不新开材料键

- **做什么**：页面问题记在现有问题字段里：严重度、源码锚点、问题、建议、证据、根因。
  - 页面、状态、视口、对象身份写进证据文字，不另开字段。
  - 被拒的是新建一套页面审计 schema。
  - 理由是现审查链路已被消费，新 schema 会造出第二份问题账本。
  - 而且现有审查输出只接受仓库相对路径，硬造结构化槽位会被拒。
- **不做什么**：不新开材料键，不写成 provider_results，不冒充 OCR（用读屏与截图判断的独立执行者）身份。
- **风险**：页面问题常没有单一源码锚点，硬塞路径会失真。
  - 缓解：以最近的源码文件作锚点，路由、状态与视口放进证据文字。
- **改动**：报告与审查材料的写法；无 schema 变更。
  - 唯一写主是方法正文 owner；落「判据与共用契约」。

证据：Talk:D2。
原件：`research/2026-10-28-005-workflowhub-test-review-integration.md` 第 5 节。
该件第 27 行记着：现有输出只接受仓库相对路径。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L457-L473

#### 决定 10 — 严重度沿用三档，处置沿用现词，复验另记

- **做什么**：三档是阻断、重要、次要，对应审查侧的严重、中等、次要。
  - 处置用五个现词：已修、驳回、接受风险、需人定、用户已定。
  - 定级依据是项目 token 与刻度，加明确例子，加校准负例。
  - 被拒的是：自造像素百分比门槛；引外部评分线。
  - 理由是现词已被审查与报告消费，换词会让历史问题读不通。
- **不做什么**：不把复验结果写回原问题正文当处置，复验单独记一行。
- **风险**：校准负例还没产出，同一差异可能两次不同级。
  - 缓解：先备负例再定级；负例不足时该面保持未测，不出级别（未决 7）。
- **改动**：分级规则与例子集写进方法正文；落「判据与共用契约」。

证据：Talk:D3、Talk:E2；原件：PRD `prd.md:128`、`prd.md:330`。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L474-L487

#### 决定 11 — 执行者只能是测试或审查子代理，开发者不自审

- **做什么**：测试或审查子代理独立执行，复验也用同一角色。
  - 两种模式共用这套契约；设计模式没有 URL 与 console 时写不适用加理由。
  - 被拒的是：开发者自己执行并自评；主会话代跑。
  - 理由是自评把发现与验收合成一个人，等于没有独立结论；
    主会话代跑则绕开 build-code 的三角色分工。
- **不做什么**：不新增第四条审查线，也不改执行器与工具。
- **风险**：独立执行者与终末审查是两条事实，混写会互相顶替。
  - 缓解：两者并排保留，不取平均，各自引原件。
- **改动**：派发与审查口径；落「报告接入与回修闭环」。
  - 审查必读镜头与触发段由写集落，写主是阶段方法 owner。

证据：Talk:D4。
原件：`research/2026-10-28-005-workflowhub-test-review-integration.md` 第 1 节。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L488-L503

#### 决定 12 — 页面检查只有一套标准：八维做骨架

- **做什么**：八维是骨架，九个视觉项作第 5 维的子检查。
  - 八维现名：业务任务、信息架构与导航、交互与状态、内容与数据、
    视觉与规范、响应式布局、无障碍、真实代码与交接。
  - 现文在 `skills/plan-design-review/SKILL.md` 的八维节，含十项反例。
  - 被拒的是：自建九项体系；只借外部概念不落判据。
  - 理由是两套骨架并列会让同一问题算两次；八维已在计划层被引用，
    九项恰好能装进第 5 维：几何接布局与间距，token 与渲染接字体颜色，
    组件接图标与状态。
- **不做什么**：不改八维定义——那是设计侧原文，本任务只引用，不重写。
- **风险**：边界写不死时同一问题会多维多记，缺陷数虚高。
  - 缓解：把归属唯一维度写进判据包，问题去重按根因，不按标题。
- **改动**：判据正文的骨架节、九项子检查与边界表；落「判据与共用契约」。
  - 写主是判据 owner。

证据：Talk:F1。
原件：`research/2026-10-28-004-c05-design-audit-generalization.md` 第 1 节。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L531-L549

#### 决定 13 — 取值口径复用四项，缺的五项补属性口径

- **做什么**：取值沿用四项口径：属性、声明值、渲染值、比对结果。
  - 八维没覆盖的间距、阴影、边框、圆角、图标，补一份属性清单：
    取哪些 CSS 属性、在哪个状态与视口取。
  - 被拒的是新建一套采集与对照 schema。
  - 理由是上游契约（C04）已交付且正在被消费，第二套 schema 会产生两份真相；
    补属性清单属于扩展，不属于新标准。
- **不做什么**：不改上游契约语义；补充口径与它冲突时交 C04 的方法 owner。
- **风险**：冲突没发现时会出现两套写法，执行者随手选一套。
  - 缓解：只在四项口径内扩属性清单，冲突就地登记，不留口头约定。
- **改动**：判据正文的属性清单与状态视口取法；落「判据与共用契约」。

证据：Talk:F2；原件：`research/2026-10-28-002-c07-internal-capability.md` 第 2 节。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L550-L564

#### 决定 14 — 没有设计源时只判能判的，还原度写不适用

- **做什么**：能判的是项目规范、token、内部一致性、状态与布局。
  - 设计还原度写「不适用加理由」，不得声称视觉还原已验。
  - 被拒的是：用内部一致性冒充还原度；用截图对照冒设计基准。
  - 理由是没有基准就没有还原度的判据，硬判等于造结论。
- **不做什么**：不把「没有设计稿」扩成整页不适用，那会逃过其它检查。
- **风险**：逐维判定麻烦，容易被一次性整体标不适用。
  - 缓解：逐维判适用性，只有还原度一项不适用，其余照判并写依据。
- **改动**：判据正文的适用性规则与报告写法；落「判据与共用契约」。

证据：Talk:F4；原件：本日志决定 8 的四态与「不适用须有据」。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L565-L577

#### 决定 15 — 性能放第 3 维下的「运行性能」子组

- **做什么**：页面模式的第 3 维叫「交互、状态与运行性能」。
  - 下分两组：行为与状态、运行性能；取首屏与交互耗时。
  - 设计模式的第 3 维仍叫「交互与状态」，性能写不适用加理由。
  - 被拒的是：单设第 10 个维度；塞进第 7 维无障碍。
  - 理由是性能是交互过程的一部分，和状态一起读才有意义；
    单设维度会让两套骨架并列，塞进无障碍会污染它的边界。
- **不做什么**：不在两处各写一份性能判据，只写在第 3 维。
- **风险**：两种模式第 3 维名称不同，容易被读成两套骨架。
  - 缓解：方法正文写明「同一维，页面模式多一个运行性能子组」。
- **改动**：判据正文的维度命名、子组与适用性；报告按第 3 维两组列。
  - 落「判据与共用契约」与「报告接入与回修闭环」。

证据：Talk:G1；原件：本日志决定 17 的映射表。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L578-L593

#### 决定 16 — 第 7 维只装无障碍，不塞性能

- **做什么**：第 7 维只留无障碍；对比度、可访问名、键盘焦点归它。
  - 其余颜色、图标、状态按映射归主副维。
  - 被拒的是：第 7 维统收颜色、图标、状态与性能。
  - 理由是第 7 维一旦收进视觉项，同一问题就在第 5 维与第 7 维各记一次。
- **不做什么**：不把性能放这里（见决定 15），也不让第 7 维变成第二个视觉维。
- **风险**：对比度天然横跨颜色与无障碍，归属容易摇摆。
  - 缓解：归第 7 维主判，第 5 维只补证据，不重复计数。
- **改动**：判据正文的第 7 维范围与归属表；落「判据与共用契约」。

证据：Talk:G2；原件：本日志决定 17。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L594-L606

#### 决定 17 — 映射表写死：主维判成败，副维只补证据

- **做什么**：一张固定的映射表，加一条规则：主维判成败，副维只补证据。
  - 布局归第 6 维主、第 5 维副；字体归第 5 维；颜色归第 5 维主、第 7 维副。
  - 间距归第 5 维主、第 6 维副；阴影、边框、圆角归第 5 维。
  - 图标归第 5 维主、第 7 维副；状态归第 3 维主，第 5 与第 7 维副。
  - 被拒的是：九项与八维并列成十七项；按维数加权算总分。
  - 理由是加权总分会把「没测」洗成「分数还行」。
- **不做什么**：不新增字段，不做第二张映射表。
- **风险**：映射没落正文时执行者会随手归维，同一问题两种归属。
  - 缓解：写 spec 时把表逐条落进判据正文与字段说明。
- **改动**：判据正文映射表与问题的维度归属写法；落「判据与共用契约」。

证据：Talk:G4；原件：本日志决定 12 的边界表。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L607-L621

#### 决定 18 — 第 8 维在页面模式只核对象与代码版本对应

- **做什么**：页面模式第 8 维核工作区、commit、构建、路由与代码的对应关系。
  - 交接受理面不适用时写「不适用加理由」。
  - 被拒的是照设计模式全文重做一次交接审查。
  - 理由是页面模式验的是运行中的页面，不是设计交接文档；
    重做全文会让第 8 维变成第二份设计审查。
- **不做什么**：不把对象身份块省掉；它是最小必填，缺了就是未测。
- **风险**：收缩后被跳过，页面与代码版本对不上也没人发现。
  - 缓解：对象身份块必填，身份不符直接判未测。
- **改动**：判据正文第 8 维范围与报告写法；落「判据与共用契约」。

证据：Talk:G5；原件：本日志决定 8 的「不适用须有据」。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L622-L635

#### 决定 19 — 每个判据必须引它实际读过的规范来源

- **做什么**：判据要写路径、节与版本，缺失即未测。
  - 报告另列一节：本次实际读了哪些规范、用在哪。
  - 被拒的是只写「按项目规范」。
  - 理由是规范存在不等于规范在用；没有来源列就核不出用的是哪一版。
- **不做什么**：不在本任务私改规范；规范缺口交规范同步（norm-sync）
  与后续发布卡处理。
- **风险**：来源多时报告会变长，读者跳读。
  - 缓解：只列本次实际消费的条目与用法，不抄规范正文。
- **改动**：判据正文的来源列与报告的规范消费节；落「判据与共用契约」
  与「审计编排入口与规范消费证明」。

证据：Talk:L1 附带的规范消费要求；原件：本日志决定 12 的骨架来源。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L636-L650

#### 决定 20 — 外部内容已整件落地；本地可复制，对外禁分发

- **做什么**：11 件外部内容加 LICENSE 已整件落地，目录记作已吸收。
  - 其中五件是 Apache 许可，六件许可未知。
  - 本地研究使用与复制可以做；对外分发与再发布禁用。
  - 被拒的是：继续写「只借概念、未引入」；或写「许可已获」。
  - 理由是材料已在用这些方法，写未引入不实；写许可已获也不实。
- **不做什么**：不写许可已获，不对外分发，不因本地可用就改许可登记。
- **风险**：许可状态被误读成已授权，对外分发时无法证明来源。
  - 缓解：保留「许可未知」的事实与目录记录，六件单列。
- **改动**：外部内容前提与许可写法；落「判据与共用契约」。
  - 写主是当前主会话；不改许可登记。

证据：Talk:U3；原件：`research/2026-10-29-011-c07-decision-impact.md`。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L651-L665

#### 决定 21 — 保留 isolated-browser-qa，当唯一入口

- **做什么**：网关继续做唯一入口，管引擎选择、会话生命周期、截图与快照、
  清理与输出契约。
  - 被拒的是：退役网关让每个技能直连浏览器；另建一套采集栈。
  - 理由是隔离、单引擎单会话、证据、清理这四件事没有第二个地方承担；
    拆开就是四条链路各写一套清理逻辑。
- **不做什么**：不新增第二条采集链，也不让各技能自己连浏览器。
- **风险**：网关当前不可用会把整条采集链堵死。
  - 缓解：默认与回退顺序（决定 22、24），加根因收尾（未决 2）。
- **改动**：方法正文与采集身份块；落「真实采集与失败语义」。
  - 入口代码改不改由诊断结论定，写主是工具 owner。

证据：Talk:I1；原件：本日志决定 25 的六项能力。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L695-L709

#### 决定 22 — 默认 ego-lite，本机没有 ego 才退回 agent-browser

- **做什么**：默认用 ego-lite；本机没有 ego 时退回 agent-browser。
  - 选中的引擎与版本写进采集身份块。
  - 被拒的是默认 agent-browser：它在本机会崩，默认它等于默认不可用。
  - 理由是 agent-browser 在本机会崩，默认它等于默认不可用；ego-lite 已被证明能采，三段真实运行都是零退出。
- **不做什么**：不在同一次运行里混用两个引擎，也不静默换引擎冒充同一事实。
- **风险**：两个引擎读数不同，证据不可比。
  - 缓解：身份块记引擎与版本；跨引擎不直接比较（未决 1）。
- **改动**：引擎选择与身份块写法；落「真实采集与失败语义」。

证据：Talk:I2；原件：本日志决定 25。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L710-L722

#### 决定 23 — 简化方向：能交给 ego-browser 的交出去，合同留住

- **做什么**：能交给 ego-browser 的大部分交给它；合同里的四件事保留。
  - 四件事是隔离、单引擎单会话、证据与清理、输出契约。
  - 不为 agent-browser 保留用不上的生命周期。
  - 被拒的是：不动；或把 agent-browser 相关代码全删。
  - 理由是网关里有一半代码在伺候 agent-browser；但合同换不来。
- **不做什么**：不写成「简化已完成」；诊断回来前不删改合同字段。
- **风险**：简化过头会丢掉隔离与清理语义，采集变成没人管的一次性脚本。
  - 缓解：先诊断、后出删改清单，逐条给替代与影响。
- **改动**：方向进材料；落「真实采集与失败语义」；本阶段不动代码。

证据：Talk:I3。
原件：`research/2026-10-28-007-browser-collection-diagnosis.md` 第 3 节。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L723-L737

#### 决定 24 — 装了没开也回退，并记回退四要素

- **做什么**：ego 在跑就直接用；装了没开就回退 agent-browser，并记 engine-fallback 四要素。
  - 四要素是从哪来（from）、到哪去（to）、为什么（reason）、探针结果（probe）。
  - 被拒的是「只有没安装才回退」这条原口径。
  - 理由是用户实际遇到的是装了没开，按安装与否判断等于让任务卡住；
    回退留证才能让复验者知道这次读数换过引擎。
- **不做什么**：选定引擎后失败也不再切换，避免一次运行出现两份读数。
  - 也不再问用户用哪个引擎；报告写清这次用了哪个即可。
- **风险**：ego 会显示窗口与光标，可能影响焦点与人工观察。
  - 缓解：要完全静默时显式用 agent-browser，并把这个事实记进身份块。
- **改动**：引擎选择、身份块写法，以及会话脚本的回退判据与未运行失败码。
  - 落「真实采集与失败语义」；写主是工具 owner。

证据：Talk:K1。
原件：`research/2026-10-28-007-browser-collection-diagnosis.md` 第 2 节。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L738-L754

#### 决定 25 — 保留网关，理由是它有六项别处没有的能力

- **做什么**：保留网关，靠六项合同能力：视口 CDP（Chrome 调试协议）、computed style、boundingBox、语义快照、整页截图、finish 清理。
  - 被拒的是：能力交回上层技能后连合同一起退役。
  - 理由是这六项是判据要的原始读数，上层技能没有对应承诺；
    退役后它们会散落到各处脚本里。
- **不做什么**：不把本机授权写成项目许可登记；许可未登记留在未决 6。
- **风险**：保留网关要继续付维护成本。
  - 缓解：保守简化只压专属长流程，不删合同能力。
- **改动**：技能的边界节与合同节；落「真实采集与失败语义」。
  - 用户说过 ego 是本机授权工具；这句只作本机授权，不作许可登记。

证据：Talk:I1、Talk:N1。
原件：`research/2026-10-28-007-browser-collection-diagnosis.md` 第 2 节。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L755-L769

#### 决定 26 — 修身份 bug，让回退引擎真的可用

- **做什么**：把身份抓取挪到取 CDP 地址之后再重解析，以这条修法为主。
  - 备选是放宽带宽、只核对后台进程行未变；先不采用。
  - 根因是第一次执行 `get cdp-url` 时 Chrome 以新进程、新配置目录重启；
    脚本先抓身份、再取地址、再复查，三次必然不相等。
  - 抓身份早于取地址，等于拿旧身份核对新进程。
- **不做什么**：不动宿主与引擎，不换浏览器栈；修完也不写「回退已证可用」。
- **风险**：复查语义放宽可能放过真的换了身份。
  - 缓解：保留端点一致性校验与失败码，复验放 build-code。
- **改动**：`skills/isolated-browser-qa/scripts/browser-qa-session.mjs` 的身份抓取与复查段；
  落「真实采集与失败语义」。
  - 还要处理两次进程快照带来的第二层缺陷；测试同步见未决 3。
  - 验证方式是同一探针复跑，加一次真实运行（未决 2）。

证据：原件：`research/2026-10-28-007-browser-collection-diagnosis.md` 第 2 节。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L770-L786

#### 决定 27 — 简化力度取「保守简化」：ego 主流程加回退附录

- **做什么**：保留回退并修身份 bug；browser-use 降为可选、按历史保留。
  - 压掉 agent-browser 专属的长流程与重复说明。
  - 新增 ego 主流程：取上下文、体检、确认在跑、建任务空间、采集、收尾。
  - 再加五类薄采集脚本：console、network、overflow、perf、a11y，由本卡建。
  - 被拒的是激进简化：删掉 agent-browser 全部路径。
  - 理由是回退是唯一降级手段，一次删干净就没有退路；旧脚本还在被用。
- **不做什么**：不整删票据脚本的导出；会话脚本依赖它四个函数：
  范围构造、安全错误、端点校验、调试连接。
  不一次删旧脚本；不新建第二套浏览器栈或第二证据库。
- **风险**：删压长流程会碰坏回退路径。
  - 缓解：先保导出与回退、再删说明，逐项给替代。
- **改动**：`skills/isolated-browser-qa/SKILL.md` 的网关正文、会话脚本、票据脚本、清理脚本（裁 browser-use 分支）
  与引擎选择契约测试。
  - 落「真实采集与失败语义」；写主是工具 owner，行与符号待写集。

证据：Talk:K2。
原件：`research/2026-10-28-007-browser-collection-diagnosis.md` 第 3 节。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L787-L806

#### 决定 28 — 至少三条校准负例，同一差异同标尺须同级

- **做什么**：备三条校准负例：明显的字体偏差、间距偏差、颜色偏差。
  - 三条都「任务仍可完成」，仍定为重要级；同标尺跑两次须同级。
  - 被拒的是只写分级原则、不给样例。
  - 理由是没有负例，分级就没有可核的锚点；没有可重复性，
    同一处问题两次会得出两个级别。
- **不做什么**：不以「任务还能操作」降为次要，不把工具阈值当严重度。
- **风险**：三条只覆盖字体、间距、颜色，挡不住布局崩坏类误判。
  - 缓解：执行时按需补同类负例；补不齐就记缺口，不降低标准。
- **改动**：判据包的负例节与验收 4 的可观察用例；落「判据与共用契约」。
  - 不新增 schema；写主是判据 owner。

证据：Talk:F3；原件：PRD `prd.md:330`；本日志决定 10 的定级依据。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L836-L850

#### 决定 29 — 业务操作按页面任务脚本加可观察终态判成败

- **做什么**：每步写清操作、页面终态，以及错误、权限、取消、恢复四类判据。
  - 被拒的是看 HTTP 200，或看截图与提示条。
  - 理由是两者都只说明请求回来了，不说明用户的任务做成了。
  - 样本上的多角色与权限只能当未测的合法输入，不能当业务真值。
- **不做什么**：模拟页面上的真实后端业务一律写未覆盖，不得冒充；
  不用同一脚本重复真实业务写。
- **风险**：终态判据写松会把失败吞成成功。
  - 缓解：每步给可观察终态，并给失败、取消、恢复三类判据。
- **改动**：判据正文的业务任务脚本节与报告的未覆盖写法。
  - 落「判据与共用契约」；写主是判据 owner。

证据：Talk:G3；原件：PRD `prd.md:329`，S7 业务定义在 `prd.md:155-161`。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L851-L865

#### 决定 30 — 页面检查全自动跑，小毛病按规则判、不要用户确认

- **做什么**：能按项目规范、token、校准负例判定的，直接判该修或可接受。
  - 判完写进报告，并写明按哪条规则接受。
  - 被拒的是逐项确认，和发布计划写的批量真实确认。
  - 理由是用户两次明确说不要确认；自动判定不等于用户签认。
- **不做什么**：不写「用户已确认」或「已签字」；没有规则依据时不放行。
  - 不因自动化降低判据，也不吞掉失败。
- **风险**：自动判定会自我放宽，尤其在可接受与该修的边界上。
  - 缓解：规则与负例成文，报告逐项写规则，独立审查可复核为什么接受。
- **改动**：判据与报告写法；落「判据与共用契约」与「报告接入」。
  - 与发布计划的冲突如实登记在未决 15，不改发布计划。

证据：Talk:J1、Talk:J2；原件：PRD `prd.md:128`、`prd.md:329`。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L866-L880

#### 决定 31 — 只升级四类事，并攒到一次说

- **做什么**：只在四类事上升级：判不了的、会改方向的、会改范围或验收的、
  要用户担风险的；并且攒成一批说。
  - 被拒的是每发现一条就问；或全部自己定。
  - 理由是逐条问会把全自动变成人肉审批；全部自己定会把风险决定藏起来。
- **不做什么**：不把普通小毛病或已有规则可判的偏差升级成确认；
  不以「攒一次」为由隐瞒已发现的缺陷。
- **风险**：攒批会延迟真正需要用户的事。
  - 缓解：升级项按四类分级，每条附一句「不问会怎样」。
- **改动**：派发、交接与报告写法；升级清单随报告给出。
  - 落「报告接入与回修闭环」；写主是阶段方法 owner。

证据：Talk:J1、Talk:J2；原件：本日志决定 30。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L881-L895

#### 决定 32 — 自建受控测试页，预置已知缺陷

- **做什么**：自建少量测试页，预置视觉、无障碍、性能、交互四类缺陷。
  - 用来校准，也用来走「发现、修复、复验」闭环。
  - 可借原型卡已修缺陷的形态，但缺陷本身自己造。
  - 已知缺陷必须可复现、可修、可复验。
  - 被拒的是：只等真实页面；新建评测平台。
  - 理由是真实页面还没到手，能力不能空等；借形态不等于借结论，
    缺陷要自己造，才敢说自己能发现。
- **不做什么**：不把测试页当产品页验收，不让预置缺陷变成必过样例，
  测试资产不进产品代码路径。
- **风险**：自建页与真实页面差异大，能力可能只在样例上成立。
  - 缓解：真实样本作第二腿（决定 5），两条腿的结果分开记录。
- **改动**：测试资产目录与校准负例清单；落「受控测试页与校准负例」。
  - 路径由写集定；写主是判据 owner。

证据：Talk:L1；原件：本日志决定 28。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L896-L913

#### 决定 33 — 检查由测试或审查子代理做，结果回开发者修

- **做什么**：测试或审查子代理独立执行，结果回报阶段开发者修复。
  - 修完复验原问题与相关回归，复验仍由同一独立角色做。
  - 被拒的是：开发者自评；新建第四条审查线。
  - 理由是这与 build-code 的三角色与七步顺序一致，不额外造流程；
    开发者自评等于让出题人自己判卷。
- **不做什么**：不改执行器，不新增审查线，也不让主会话代跑。
- **风险**：终末没有独立执行者时，审计会退化成开发自证。
  - 缓解：不可用时记「未取得」并披露执行者身份，不拿自证冒充。
- **改动**：build-code 的派发与审查材料口径；落「报告接入与回修闭环」。
  - 业务步骤按决定 29 的脚本执行；页面检查全自动，只攒批升级四类事。

证据：Talk:B3。
原件：`research/2026-10-28-005-workflowhub-test-review-integration.md` 第 1 节。
该件第 33–35 行写三角色与七步时序。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L941-L957

#### 决定 34 — 正式审计放代码冻结前，终末只复核四项

- **做什么**：正式审计放在代码冻结前、最后一个开发阶段收口时做一次。
  - 终末只复核四项：审计报告、修复记录、受影响面回归、独立复验证据。
  - 被拒的是：终末第一次做；每个阶段都做。
  - 理由是冻结后就改不动了，闭环只能空转；每阶段都做成本翻倍，
    而且阶段内页面还在变。
- **不做什么**：不为审计新增阶段或 gate；不写「终末全量复跑」。
  - 终末缺任一项就记未测或不完整。
- **风险**：阶段收口时问题集中暴露，时间不够只能带缺口。
  - 缓解：阶段内可选冒烟提前暴露；正式审计范围由冻结前那次固定。
- **改动**：build-code 技能的终末段与方法段；落「报告接入与回修闭环」。
  - 行与措辞待写集；写主是阶段方法 owner。
  - 本条改写过旧决定：旧文写「终末正式审计加阶段内冒烟」，已作废。

证据：Talk:R1、Talk:S1；原件：PRD `prd.md:328`。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L984-L1000

#### 决定 35 — 有浏览器可见面的任务都强制走

- **做什么**：声明写集含浏览器可见面的任务都强制走这套检查。
  - 没有可见面才写不适用，并引写集作依据。
  - 被拒的是：按调用者标签判断；由任务自报要不要走。
  - 理由是标签与自报都能绕过检查；写集是可核的声明，骗不了人。
- **不做什么**：不扩大到无可见面的任务，也不把不适用当默认。
- **风险**：强制后每个任务多一次采集、脚本与复验，成本上升。
  - 缓解：审计包一次一页复用，冒烟从简。
- **改动**：build-code 的触发段与依赖清单（是否改待定）；落「报告接入」。
  - 写主是阶段方法 owner。

证据：Talk:C2。
原件：`research/2026-10-28-005-workflowhub-test-review-integration.md` 第 1 节。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L1001-L1015

#### 决定 36 — 触发按改动面与交付声明判定，拿不准就走

- **做什么**：改了页面、路由、组件、样式，或声明交付界面与页面，就走。
  - 拿不准时默认走；纯后端、文档、配置任务可豁免，但必须写理由。
  - 被拒的是：只看标签；只在任务自称界面任务时才走。
  - 理由是第二条会漏掉「改了样式却没说」的任务；三条都能从材料核。
- **不做什么**：不新增阶段或 gate；这条只是决定 35 的判定口径细化。
- **风险**：拿不准就走会抬高成本。
  - 缓解：冒烟从简，审计包按页面范围复用。
- **改动**：build-code 触发段与依赖清单；落「报告接入与回修闭环」。

证据：Talk:L1 附带要求；原件：本日志决定 35。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L1016-L1028

#### 决定 37 — 报告逐项给证据，摘要嵌既有材料

- **做什么**：报告按八维逐项给档位、证据引用与未覆盖说明。
  - 检查项结果用决定 8 的四态；整体摘要与终末验收各沿原接口。
  - 写清引擎、工具、会话、视口、状态与未测原因。
  - 审计摘要放进现有的 test_evidence 与 test_context，不新开材料键。
  - 被拒的是：新建报告平台；另开独立证据目录。
  - 理由是白名单只认这两个键，新键会被链路直接忽略；
    另开目录会造出第二份真相。
- **不做什么**：不写「用户已确认小毛病」；不让 OCR 凭截图重判视觉。
  - 分工是浏览器执行者产事实，OCR 与审查做判断。
- **风险**：摘要内联在既有材料里容易漏字段。
  - 缓解：薄脚本校验形状，缺字段就报。
- **改动**：报告写法与审查材料口径、审查技能的消费规则；落「报告接入」。

证据：Talk:L1 附带要求。
原件：`research/2026-10-28-005-workflowhub-test-review-integration.md` 第 1 节。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L1029-L1046

#### 决定 38 — 在现版技能上扩页面模式，不重写八维

- **做什么**：在 plan-design-review 的现版上扩出页面模式；契约与清单只写一处。
  - 现版已被原型卡改成八维，含十项反例，位置在技能正文的八维节。
  - 被拒的是：本卡新建页面检查方法；另写一份到 frontend-testing。
  - 理由是同一件事写成两份，下一任务就会引用旧的那份；
    两模式共用契约还能省掉一套字段。
- **不做什么**：不重写八维，不覆盖现版，不另建第二个技能。
- **风险**：同一文件后续可能被再次改动，两次写会互相覆盖。
  - 缓解：写入前读现版并记来源，按 owner 串行（未决 14）。
- **改动**：`skills/plan-design-review/SKILL.md` 的页面模式节；落「判据与共用契约」。
  - 写集按现行号；写主是方法 owner。

证据：Talk:C1、Talk:U3。
原件：`research/2026-10-28-004-c05-design-audit-generalization.md` 第 4 节。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L1073-L1088

#### 决定 39 — 范围取方法加模板，实现在本任务做

- **做什么**：改 make-decision 技能、步骤清单、决策日志模板，必要时加标准方法文档。
  - 实现放本任务的 build-code，make-decision 只规划。
  - 被拒的是只改模板，或只改技能。
  - 理由是只改模板会留下「步骤顺序没变」；只改技能则模板仍在教旧写法。
- **不做什么**：不改 runtime，不新增阶段、gate 或第二进度，不改事实 schema，
  不在 make-decision 改技能文件，也不追溯改写旧任务材料。
  - 这是对「跨任务规范交发布卡」的明确例外；用户选了留在这里（答复 45）。
- **风险**：模板与步骤变更会影响所有任务的材料形状。
  - 缓解：向后兼容旧材料、旧编号不重排、用现有步骤校验器核。
- **改动**：上述四个文件；落「决策流程九条修复」。
  - owner 是当前主会话，审查按共享文件审查；写主在 build-code。

证据：Talk:O2/O3、Talk:R3；原件：`workflows/make-decision/steps.json`。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L1114-L1129

#### 决定 40 — 每个模块五段记录，写完立即发布并读回

- **做什么**：每模块按五段记：调研、发散、收敛、就地讨论、定验收。
  - 每格一句结论、一个原件指针、一个模块批次号。
  - 简单无歧义直接定并告知，不重复问已定的事。
  - 只有会改方向、范围、验收或风险的复杂歧义才单独标出交用户。
  - 被拒的是：全部做完再一次性写。
  - 理由是攒到最后会丢中间结论，顺序偏差也无处可查；
    写完就读回，才能发现材料没落盘。
- **不做什么**：不在确认文案里写「进入下一阶段」，也不催下一阶段。
  - 收口动作是：保存用户真实确认、读回术语表、生成并读回 handoff（阶段交接件）、
    把 handoff 绝对路径交付用户。
- **风险**：模块多时频繁发布成本高。
  - 缓解：按模块小步提交，优先正确性与可读回。
- **改动**：模板的模块台账节与技能的执行顺序；落「决策流程九条修复」。
  - 运行清单在确认、收口、交接三处写死顺序。

  用户先后给了十条要求，原文要点如下（逐字在追加节与原件里）。
  - 开局四级选择，含推荐与理由。
  - 分级后、大纲前必须问一次要不要做内外部调研，并记录范围、
    为什么、跳过会缺什么、谁决定。
  - 大纲确认后才做方向审查。
  - 逐模块收敛：只问复杂歧义，简单直接定并告知。
  - 复杂模块判断要不要做内外部调研；模块调研格要与开局决策对得上。
  - 所有模块收敛后才做细节审查。
  - 细节审查后做对抗式追问，并更新术语表（GLOSSARY）。
  - 每步、每模块立即写日志并读回。
  - 根因与运行清单，防止跳步。
  - 最终确认与下一阶段分开，确认文案不得写进入下一阶段。

  本任务实际调研清单（按新要求补记）如下。
  - 内部：发布计划与 S5 到 S7、前序卡、仓库能力与接入点、
    浏览器链与失败事实、原型卡生命周期与交付状态。
  - 外部：九个视觉项、无障碍、性能、行为方法与工具，以及许可与版本。
  - 专项：原型卡判据通用化、浏览器采集诊断、样本交付路径。
  - 顺序偏差：实际调研做在「分级后先问调研决策」之前。
    现已补问并取得答复；缺口留在未决与风险里，不写成全覆盖。

  大纲在 2026-10-28 定稿为九块：定位与形态、共用契约、判据矩阵、
  真实采集、判定与分级、回修闭环、报告与接入、规范复用、流程修复。
  用户用「按现有调研定大纲」答复；这不算方向审查通过。

  修正后的执行顺序：分级、调研决策、大纲确认、方向审查、逐模块台账、
  细节审查、对抗追问与术语表、最终确认；后续不得再抢跑。

  根因是主会话把「最终确认」误当成「进入下一阶段的许可」，
  示例确认文案也带同样倾向；正确顺序是先收口，再让用户决定下一阶段。

  八项可核的验收：开局四级选择有记录、开局调研决策有记录、
  大纲确认有原文、逐模块台账可核、细节审查前检查成立、
  追问后术语表有更新、无新 gate、未来任务的确认选项不含下一阶段。

证据：Talk:O2/O3；原件：本日志每个工作包的五段表。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L1130-L1183

#### 决定 41 — 防假绿保原职责，真注入与可访问性压力升最高优先级

- **做什么**：判据、版本、gate、报告一起改，并分三级推进。
  - 真注入、200% 缩放与键盘焦点、读屏与直接打开文件升最高优先级，
    作验收 3 的直接证据；读屏缺环境时按答复 53 记未测，不冒必测通过。
  - 五项结构能力是：判据三态化、对象版本三件套、引用越界检测、
    gate 谓词改成材料身份加尾随白名单加改名等价、冻结判据自哈希进报告。
  - 判据三态化指：通过仅当全范围通过；具名范围（只看首屏、只看桌面、
    只看一套样本）一律记未测，禁止限定通过。
  - 引用越界检测指：原件自述「不能证明」或「未执行」时，不得据此判通过，
    除非有人工覆盖记录。
  - 被拒的是：只改报告口径；只改 gate 谓词。
  - 理由是原型卡三类问题都出在口径与绑定上，不在报告排版；
    只改一处会留下另一处照旧。
- **不做什么**：不新增阶段、gate 或第二证据库，不修原型卡历史欠账，
  也不把它的限定通过当输入。
- **风险**：改判据口径会牵动现有验收与报告，短期出现两份说法。
  - 缓解：先三态化再改 gate，逐项留差异，差异写进报告。
- **改动**：批准绑定、变更、审查覆盖与报告差异沿原 owner 改；
  真注入不再低优先级延期；业务优先级不等模板自报，程序绿不代真实效果。
  - 分级沿用原定：P0 是上面五项结构能力；P1 四项是 S6 事件台账前置、
    批准绑定版本加变更登记、审查覆盖回执与终态保存、报告重签发差异；
    P2 三项是受控页真注入反例、深度面显式化、规范消费登记（交 C08 发布卡）。
  - 实际证据落在「受控测试页与校准负例」与「全验收终验」两个 Phase；
    「交付证据与防假绿实现」只承接自身引用与版本检查。
  - 深度面与跨任务规范登记保原去向；写主是防护 owner。

证据：Talk:U6；原件：`research/2026-10-29-012-c05-root-cause.md` 第 2 节。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L1212-L1240

#### 决定 42 — 版本三件套，批准版与交付版分开写

- **做什么**：所有对象与报告绑三件套：commit、sha256、时点；变则失效。
  - 批准版是 41eae967，交付版是 9efb7e57，两处引用分开写。
  - 批准后界面行为有变更时，只登记差异并取得同意，不默认重新展示。
  - 被拒的是：只记一个版本号；批准后行为变了就重新展示。
  - 理由是一个版本号说不清批准的与交付的差在哪；
    默认重展示等于把已批准的东西又变成新的。
- **不做什么**：不把两个版本写成一个，不静默改已批准的行为。
- **风险**：批准状态仍可能漂移，漂移后没人发现。
  - 缓解：变更登记、同意记录，加三件套绑定。
- **改动**：报告与材料的版本块、变更登记写法；落「交付证据与防假绿实现」。
  - 实现方式仍未定（未决 20）；写主是防护 owner。

证据：Talk:U1、Talk:U7；原件：`research/2026-10-29-011-c07-decision-impact.md`。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L1241-L1256

#### 决定 43 — 验收在方案之前，原需贯穿每个承接位置

- **做什么**：每个工作包先和用户谈清怎么验，再谈做什么。
  - 要谈的是：观察得到的结果、正反场景、环境与数据、范围、判定者、
    失败了怎么修。
  - spec 里只有一处验收正文，给成功、失败与证据；Phase 在动手前
    把详细验法展开；独立测试真执行，失败回修再重验。
  - 原需原文与真实更正才是语义依据；候选验收与派生基线不能替代它们。
  - 本决定承接需求 44、45、46：逐包验法、Phase 验收设计、独立执行。
  - 新增的方法目标正式归验收 8～11，由「逐需验收与真实完成」首判；
    原七条页面验收的含义保留，不倒签旧材料。
  - 被拒的是只加字段、只加必读、只加声明检查。
  - 理由是这些做法仍可能放过「计划全都实现了，但原需没满足」。
  - 沿现原体系与调用方最小修，不新增 gate、阶段、台账或分母。
- **不做什么**：不写第二份验收正文；不拿页面验收 5 的形状当作者质量判据
  （作者质量有自己的验收条目，见验收 10、11）。
  - 不写只有编号、没有含义的分级标题；不把行宽当成写入拒绝条件。
- **风险**：验法谈不清时，执行者会自己发明标准，或退回只跑命令。
  - 缓解：每个包写出失败长什么样与谁判；缺这两样就算没谈完。
- **改动**：本日志的验收面、spec 的验收正文与「逐需验收」这个 Phase。
  - 写主是决策作者与 spec 作者；测试记录由独立执行者写。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L1285-L1306

#### 决定 44 — 当前规则融合，满足验收才称开发完成

- **做什么**：先讲任务故事、结果依赖、取舍与失败边界，再回核完整来源。
  - 材料质量只按十条标准衡量：为读者写；一节一问、首句直答；
    一句一行、一行不超过 80 字（命令与表格行除外）；一段只讲一件事；
    术语首现解释、全文一个词；表只放对照；机器字段收到文末；
    正文用中文编号；不出现只有编号、没有含义的分级标题；不凑格式删内容。
  - 本决定承接需求 47、48、49、50、51：回修重验、完成口径、
    材料可用、问题落稿、十条标准；对应验收 9、10、11。
  - 专业问题改到最终稿，由原受影响读者复验；程序接入、真实投递、
    实际写作效果三种结论分别消费各自的独立证据。
  - 开发交接只能说「实现就绪、待独立审测」；全部适用标准满足，
    才能说这个 Phase 开发完成。
  - 可以保缺口收口、交付，并继续安全修复与提交，但不能冒满足验收。
  - 旧决定被本条覆盖的部分有三处，含义如下。
    - 覆盖「借页面验收 5 的形态当作者质量判据」：作者质量现在有
      验收 10 与 11 两条自己的条目，对象是材料与读者动作。
    - 覆盖「gate 命令加冷读就是真判据」：两者只作形状与可用性证据，
      效果要另有一次真实方法消费。
    - 覆盖「四条硬指标按 300 字、60 字这类数字」：行宽按第 5 条 80 字，
      且它是写作标准，不是写入拒绝条件。
- **不做什么**：不加字数或条数配额，不新开评分器，不倒改历史材料。
- **风险**：标准写成口号，材料照旧长，验收 10 无人真做。
  - 缓解：验收 10 要求一位没参与写作的读者实际接手；做不到就记未取得。
- **改动**：本日志正文、spec 与各 Phase 的人读正文；写主是材料作者。
  - 本包的反例是真实发生过的：错判完成、选择没融合、修后沿用旧绿、
    单位写错却算通过；它们留作下一次的检查点，不当已修好。
  - 完整的外部试写仍由用户自己验；具体验法要回复后才能定，作者不代答。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L1307-L1335

- **追加决定 1**：质量要求要进可复用层，而且必须有失败面。
  只有建议、没有检查点的，不算解决。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L1467-L1468

- **追加决定 2**：校验器默认收紧（必填），只有读归档材料时显式传诊断模式；
  按材料路径识别，不用队列标签当开关。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L1469-L1470

- **追加决定 3（当前）**：作者先读唯一写作规范，并解释结果与失败恢复。
  用户已撤人为字数、字符、行宽、条数门；旧 300 与 60 不再有效。
  撤限来源是 `quality/evidence/build-code/2026-10-30-013-p10-…`；
  非空、类型、身份、来源保护保持不变。
  STE100 与 ISO 24495 的 19 条可检查规则并进写作规则集，作第 13 条，
  不新建第二份规范。
  - 本轮更正：行宽按用户 2026-10-30 第 5 条恢复为 80 字，
    它是写作标准，不是写入拒绝条件；旧数字门仍不恢复。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L1471-L1478

- **追加决定 4**：审查要审方案。需求进包；四条轴是需求成立性、
  验收充分性、方案合理性、可执行性；两路分工；
  每条意见带替代方案与覆盖范围。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L1479-L1481

- **追加决定 5**：阶段末兜底。spec-analyze 的六类之后加第七类「读者可用」，
  接进 build-plan 第 11 步；收口前对当前 spec 与全部 Phase 真跑一次。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L1482-L1483

- **追加决定 6**：不动四样东西：页面审计的七条验收、既有阶段与 gate、
  公共命令七类、原型卡历史材料。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L1484-L1485

- **追加决定 7（补充）**：审查材料装反了，要换。
  - 查证：build-plan post 剖面的必填项含原始需求全文（20 万字节以上），
    禁止项却含已批准规格，也就是决策日志；八个合法键里没有它的位置。
  - 这是分层遗留：post 用草稿规格取代 pre（前置审查）的已批准规格，
    决策日志从来没有独立键。
  - 决定：加一个决策基线键并列为必填；原始需求改可选，默认只投本卡摘录；
    审查轴换成四条；文本自洽交给脚本；意见必须带替代方案与覆盖范围；
    STE100 与 ISO 24495 只落核心思想、不写标准名；用当前材料重跑验证。
来源：specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/decision-log.md#L1486-L1494

