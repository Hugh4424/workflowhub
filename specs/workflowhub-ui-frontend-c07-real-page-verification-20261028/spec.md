## 0. 速读

本节回答：这是什么、给谁用、现在到哪、下一步读哪。读完这一节就可以决定要不要继续读。

**这是什么。** 让 workflowhub 有一种能力：在真实浏览器与真实页面里查出视觉、交互、无障碍、性能、布局与业务问题。查出后能回修，
能由独立角色复验。
它交付的是方法、判据、薄脚本与接线，不是一份只供阅读的判据文档。

**给谁用。** 三类人。实施者按它写判据与脚本；独立测试或审查子代理按它取证与判定；build-code 终末与产品验收者按它消费报告。

**现在到哪。** 材料齐了：本文件、11 个 Phase、35 张任务卡已落盘，执行顺序权威是 `phases/index.md` 的七批次。
代码一行没写，浏览器一次没跑。
两条冻结契约测试当前是 RED。`page-audit-shape.test.mjs` 7 failed；
`page-audit-doc-contract.test.mjs` 11 failed。

**下一步读哪。** 先读第 3 节知道做成什么样；要动手读第 4 节与自己那张 Phase 卡；要判收成读第 5 节。

| 材料 | 用途 | 什么时候读 |
| --- | --- | --- |
| `decision-log.md` | 方向权威：43 条原始需求、64 条答复、42 条决定、未决项与风险 | 改需求或判据前 |
| `phases/index.md` 与 `phases/P<n>-*.md` | 每个包的结果、写集、命令与失败退路 | 动手前 |
| `quality/evidence/decision-log-refs/requirement-index.md` | 43 条原始需求的逐字短引与出处 | 核原义时 |
| `quality/evidence/build-plan/2026-10-29-003-code-anchors-and-consumers.md` | 12 个代码锚点、字节行号与消费者全表 | 写代码前 |
| `specs/<task>/samples/` | 页面层验收对象，C05 的 A、B 两套 | 采集与复验时 |

## 1. 编号速查

本节回答：正文里的中文编号各指什么、英文机器编号退到哪。
需求、答复、功能需求、验收、决定五类机器编号只在附录 A 到 D 与追踪表出现；
正文保留 OPEN-、PFACT-、ORACLE-、P/T 等跨文件锚点。

| 说法 | 指什么 | 权威在哪 |
| --- | --- | --- |
| 需求 1 到需求 43 | 原始需求，来自 PRD 的 C07 卡，共 43 条 | 逐字短引在 `requirement-index.md`；机器编号见附录 A |
| 用户答复 1 到用户答复 64 | 用户在决策阶段给的答复，共 64 条 | decision-log 的变更记录；机器编号见附录 A |
| 验收 1 到验收 7 | 页面验收判据，7 条，唯一权威在第 5 节 | 机器编号与判定器见附录 C |
| 场景 1 到场景 9 | 使用场景，见第 3.4 节 | 第 3.4 节 |
| 方案 1 到方案 6 | 实现方案，见第 4 节 | 第 4 节 |
| 决定 1 到决定 42 | 决策记录，正文只写「决定 n」 | decision-log；编号对照见附录 D |
| `OPEN-xx` | 未决项，owner 与下一步在第 7 节 | 第 7 节 |
| `PFACT-…` | 已核实事实与未知，共 20 条 | 第 2.4 节 |
| `P<n>`、`T0nn` | Phase 与任务卡 | `phases/` |
| `ORACLE-…` | 判定器名字，与追踪表和附录 C 配套 | 附录 C 与各 Phase |

## 2. 需求从哪来

本节回答：43 条原始需求与 64 条用户答复各说了什么、按主题怎么分组、哪几条改过方向、哪些事实已经核实。
本节只给分组与落点，逐字原义在 `requirement-index.md`；没有来源的新增需求必须回 make-decision。

### 2.1 43 条原始需求，按主题分 8 组

本节回答：43 条原始需求按什么主题分组、每组缺什么、缺口归谁。

一句话读法：这 8 组就是"判据、采集、分级、判定、回修、报告、对象、边界"，第 4 节按同样顺序展开。

| 组 | 这组在说什么 | 覆盖的需求 | 缺口与 owner |
| --- | --- | --- | --- |
| 1 判据骨架 | 一套维度、逐维取证、每项有判据与原始结果 | 需求 1、8、15、19、25 | 无缺口 |
| 2 采集与身份 | 真实隔离采集；对象身份可核；console、network、overflow、焦点可见 | 需求 2、14、20、34 | 回退判定点 OPEN-13，owner=判据 owner |
| 3 分级与停止 | 三档严重度、校准负例、预算停止与四类原因分开 | 需求 21、28、32、33 | 刻度值已给，样例资产待建，OPEN-07 |
| 4 判定与业务 | 数值与观察互补、性能实测、页面任务终态、九类反例 | 需求 9、10、22、27 | 真实业务对象缺（OPEN-11）；C06 未立项（OPEN-12） |
| 5 回修与复验 | 定位、责任路由、最小修复、独立复验、轮次 | 需求 4、13、17、18、23、29 | C07 全改属用户例外，OPEN-24 |
| 6 报告与不吞未知 | 报告表达与消费接口；未见与缺陷分开；非法输入不聚合 | 需求 3、11、12、16、26、30 | 无缺口（沿用现 finding 字段） |
| 7 对象与版本 | 两条腿、版本三件套、资产层与页面层分开、最小读取集 | 需求 6、7、31、35、37、42 | 复制留痕 OPEN-21；无 Figma/Storybook OPEN-15；需求 37 缺具名产品 |
| 8 依赖与边界 | 产品验收者、UES 前置、依赖、共享责任、局部风险、可后置、流程边界 | 需求 5、24、36、38、39、40、41、43 | verify-code 接点重指 OPEN-03；UES 许可 OPEN-10；需求 41、43 属边界类，不产生独立任务，靠验收 1、5、6 与第 5.10 节间接覆盖 |

### 2.2 用户答复 64 条，分 6 组

本节回答：64 条用户答复按什么主题分组、各自落在哪一节。

58 条旧答复加 6 条 2026-10-29 新指示（用户答复 59 到 64），按主题合成 6 组。

| 组 | 用户定了什么 | 覆盖的用户答复 | 落在哪 |
| --- | --- | --- | --- |
| A 能力与交付形态 | 要能力不要判据文档；方法归 `plan-design-review` 两模式；走复杂路线；不退役网关 | 用户答复 1、3、5、6、7、13、26、34、36、38、39 | 第 3、4 节 |
| B 浏览器入口与引擎 | 只经网关；默认 ego-lite；装了没开回退并记 `engine-fallback`；选定不切；ego 是本机授权 | 用户答复 2、27、28、29、30、33、37 | 第 4.2 节 |
| C 判据与维度 | 四态；未测不算通过；八维骨架加九维子检查；取值四项；性能作子组；第 7 维只 a11y；第 8 维只核对象 | 用户答复 10、14、16、17、19、20、21、22、24、25 | 第 4.1、4.4 节 |
| D 分级与证据 | 三档加现词；校准负例至少三条；MINOR 规则判定、不要确认；沿用 finding 字段；本地可复制、不写已获 grant | 用户答复 11、12、15、18、31、32、51、52、54、57 | 第 4.3、4.6 节 |
| E 对象与业务 | C05 样本；C07 全改属例外；两条腿；批准与交付分开；200% 与键盘必测；模拟不冒真人 | 用户答复 4、23、35、44、47、49、50、53、55、58 | 第 4.2、4.5 节 |
| F 流程与材料 | 可见面强制；入口四问；调研决策；最终确认即收口；M9 例外；材料提交到 C07 分支；写作契约与读者检查 | 用户答复 8、9、40、41、42、43、45、46、48、56、59、60、61、62、63、64 | 第 6 节与 P9 |

### 2.3 改过方向的三处

本节回答：哪三条早期判断被后来的决定推翻，现在以哪条为准。

- **九维来源**：用户答复 14 时还写"来源未定"；用户答复 16、17、20 之后
  落定为"八维骨架加九维作第 5 维子检查"，OPEN-06 已关闭。
- **MINOR 确认**：S5 要求"批量真实确认"；用户答复 31、32 明确"不要确认"，
  改按决定 25 由规则判定，冲突登记 OPEN-16。
- **采集引擎**：决定 23 只写"本机没有 ego 才回退"；
  决定 27 与用户答复 33 细化为"装了没开也回退并记 `engine-fallback`，
  选定后失败不切"。实现与冻结断言冲突时按用户决定改实现（OPEN-19）。

### 2.4 已核实的事实与未知（20 条）

本节回答：哪些事实已经核实、哪些只是假设、哪些还未知，各自由谁补。

| 编号 | 事实或假设 | 状态 | 一句证据或影响 |
| --- | --- | --- | --- |
| PFACT-001 | C05 的 A、B 样本已交付并合并（`1c0948c3`，归档 `c53c8ecd`） | verified | 对象前置；验收 1～7 |
| PFACT-002 | 交付指针钉 `9efb7e57`；`be7a5673` 作废，少两次修复 | verified | 对象身份；验收 1、2 |
| PFACT-003 | 批准绑 `41eae967` 与交付 `9efb7e57` 是两个版本，必须分开写 | verified | 版本一致性；验收 6 |
| PFACT-004 | 样本 A 需安装与构建，可逐字节复现（`npm ci` 3.421 s、`npm run build` 1.066 s） | verified | 只在 `/tmp` 副本跑过 |
| PFACT-005 | 样本 B 零安装、零构建，三个运行文件即交付物 | verified | 静态服务可直接起 |
| PFACT-006 | C07 副本在 `samples/`，六运行文件 sha256 与钉版一致、合计 525142 B，尚未提交 | verified | 复制留痕 OPEN-21 |
| PFACT-007 | C05 止于 mock；其 17 条限定 pass 与 AC009 fail 不得引用为 C07 结论 | verified | 业务真值缺；验收 5、6 |
| PFACT-008 | 网关在仓内；agent-browser `--run` 两次 `RECEIVER_IDENTITY_CHANGED`，根因在 `browser-qa-session.mjs:525-534` | verified | ego 本机可用；验收 2 |
| PFACT-009 | 外部内容 11 件已落地（5 件 Apache、6 件 grant unknown），本地可复制，对外分发仍禁止 | verified | 不写"已获 grant" |
| PFACT-010 | 仓内无 Figma 实例与 Storybook 运行物；`verify-code` 已退役 | verified | 第 8 维与接线；验收 7 |
| PFACT-011 | 八维现文在 `skills/plan-design-review/SKILL.md:24-53`（63 行，含 10 项反例） | verified | 骨架；验收 1、7 |
| PFACT-012 | C06 未立项，真实后端业务与真值后置 | verified | 责任路由；验收 5、6 |
| PFACT-013 | M10 复审 r3：设计层 7/0、可核层 6/1（R1 仍开），M10 为 partial | verified | 防假绿证据完备性 |
| PFACT-014 | 受控测试页能承载九类反例与四项深度面 | inferred | 页未建；能力可能只在样例上成立 |
| PFACT-015 | build-code 执行时 ego 会话可用 | inferred | 不可用按决定 27 回退；跨引擎读数不可比 |
| PFACT-016 | `samples/` 可直接作 C07 工作副本 | inferred | 取决于 OPEN-21 的提交留痕与目录归属 |
| PFACT-017 | 性能采集方法已定，`collect-perf.mjs` 未实现、无真实读数 | unknown | 缺读数时该项记未测；OPEN-08 |
| PFACT-018 | 视觉刻度与三条负例数值已定，样例资产未产出 | unknown | 缺样例时该面记 incomplete；OPEN-07 |
| PFACT-019 | 真实业务对象与逐页终态脚本缺位，业务成功真值取不到 | unknown | 业务步骤写"未覆盖"；OPEN-11 |
| PFACT-020 | 设计模式没有 URL、console、network 与运行性能可采 | not_applicable | 写"不适用加理由" |

## 3. 我们要做什么

本节回答：做成什么样算成功、哪些在范围内、哪些明确不做、覆盖哪些状态、谁是场景主角。

### 3.1 产品目标

本节回答：用户最终拿到哪几个可验证结果。每条对应第 5 节的一条验收。

1. 真实页面逐维取证：每维有判据、原始结果与未覆盖说明。
2. 采集与身份对得上：错工作区、错服务、错状态或未启动，都能报具体不一致或 unavailable。
3. 适用反例有检测与真实修复；200% 缩放与键盘、焦点顺序必测。
4. 分级可重复：同一明确数值 diff 用同一标尺得出同一档；校准集是三条还原偏差负例加一条阻断档负例。
5. 回修闭环：模糊反馈先定位再修；修复后由同一独立角色复验；轮次与停滞可解释。
6. 失败不伪装成通过：unknown、非法耗时、失联采集、证据错配都不聚合成高分或通过。
7. 对象两条腿可追溯：资产层、代码组件层、页面布局与真实操作分别可追溯。

### 3.2 范围内

本节回答：本期具体交付哪些能力。

- 判据与结果契约：八维骨架、九维子检查与映射、属性取值口径、四态结果、报告表达与消费接口。
- 真实采集与对象身份：唯一网关、引擎选择与回退、最小身份块。另有 console、network、overflow、焦点与清理事实，以及采集失败语义。
- 分级与停止：三档严重度、校准负例、MINOR 规则判定、预算停止与四类原因分开、性能子组、页面任务脚本。
- 回修闭环与复验：定位、责任路由、最小修复、独立复验、轮次与停滞、终末四项复核。
- 交付证据与防假绿：pass 只在全范围、对象版本绑定、引用越界检测、判据自哈希、受控页真注入、四项深度面。对象两条腿是 C07 自建受控测试页（第一腿，
  只作校准）加 C05 样本（第二腿，页面层，止于 mock）。

### 3.3 明确不做

本节回答：什么本期不选，理由与去向是什么。逐条继承 decision-log 的范围与非目标，N 编号保留。

- **N1、N11 不新建评测或报告平台、第二证据库、新 stage，也不做 AEM 与大评测平台**。仓内永久边界禁止第二控制面，
  无可复验日志的评分会变成达标线。去向：复用现有证据 writer 与 `test_evidence`、`test_context`、
  final-report。
- **N2、N3 不改 C05 原工作区与只读归档，也不在 mock 上冒充真实后端业务**：归档只读是仓规；fixture 成功冒充业务通过即假绿。
  去向：取用走复制，业务写"未覆盖"，等 C06。
- **N4 不写"已获 grant"、不对外分发外部内容**：11 件已落地，其中 6 件 grant unknown；本地研究使用与复制可以，分发仍禁止。
- **N5、N12 无资产处不编造，也不把本任务当产品 UI**：仓内确实无 Figma 与 Storybook；受控页与 C05 样本是测试资产，
  不是产品页面。去向：写"不适用加依据"，不建原型、不走预览确认。
- **N6 不在同一文件上与 C05、C06、C08 并行改写**：同文件写冲突是既有风险；M9 留 C07 属用户例外，仍按共享文件审查。
- **N8 九维不另立体系、不与八维并列成 17 项**：两套维度会让同一问题记两次，缺陷数虚高。
- **N9 不退役 `isolated-browser-qa`，也不把"简化"写成已完成**：六项独有能力不可替代，删改清单仍待落。
- **N10 不静默改发布计划 S5 的文本**。用户"不要确认"与 S5"批量真实确认"冲突。本任务按用户决定执行并登记，不替发布计划 owner 改原文。

### 3.4 九个使用场景

本节回答：谁在什么条件下触发这套能力，正常与异常各看到什么。

| 场景 | 谁、什么条件 | 可观察结果 |
| --- | --- | --- |
| 场景 1 逐维取证 | 测试或审查子代理；对象身份已核 | 每维有判据、原始结果与未覆盖说明 |
| 场景 2 身份不符 | 采集执行者；route、服务或 commit 与声明不符 | 报具体不一致项并停在该对象；能观察的保留 |
| 场景 3 两次定级 | 判据 owner 备样例，独立执行者跑两次 | 两次同级；三条负例落重要档 |
| 场景 4 模糊反馈 | 审查子代理定位；C07 自有副本修复 | finding 有页面、元素、状态、根因与 owner |
| 场景 5 复验与轮次 | 同一独立角色；修复已提交 | 原问题与相关回归都复验；停点可解释 |
| 场景 6 报告消费 | 采集者产事实；审查与终末读摘要 | 逐项四态加证据 ref 加未覆盖，不被吞 |
| 场景 7 脏输入 | 判定执行者；输入含 unknown、空值、失联或错配 | 不聚合为通过；缺值不默认 0 |
| 场景 8 状态与压力 | 采集执行者；对象支持状态切换 | 每项四态；200% 与键盘必测 |
| 场景 9 资产与页面两层 | 采集者与设计资产 owner；仓内无资产 | 三面分别可追溯；无资产写"不适用加依据" |

### 3.5 默认必须成立

本节回答：哪些不变量不用用户重复提出，违反即失败。

- pass 只在全范围通过时给；任何具名范围（仅首屏、仅桌面、仅 A 样本）记 incomplete，禁止"限定 pass"。
- 未测不算通过；不适用必须给依据；不给总分或百分比替代四态。
- 执行者是测试或审查子代理；开发者不自审；复验由同一独立角色做。
- 报告不写"用户已确认、已签字"；只写"按某规则接受"并写明规则。
- C05 的 17 条限定 pass、效果达标、已闭环不得被引用为 C07 结论；C07 只按自己判据。
- 判据只在第 5 节写一次，其它节只引用，不复制通过条件。
- 材料层不写通过结论；"未执行""未测"如实保留。
- 最终确认等于阶段收口：保存确认、读回术语表、生成并读回交接、交付绝对路径；它不是进入下一阶段的许可。
- 提交由主会话在收口时做，提交到 C07 分支、不 push（承接答复 56）。
  提交之前材料只写"未提交"；提交之后再记 commit 与时点。
  影响面是 P8 收口的回写与 PFACT-006，不改变任何一条验收。

### 3.6 为什么本任务不算产品 UI

本节回答：这份材料要不要走 UI 准备。答案是不用，理由是三个来源都为 false。

三个来源是原始需求、项目清单与计划改动的前端事实。判定表与依据在
`2026-10-29-002-ui-applicability-and-norms.md` §1.1。

- 原始需求：43 条是判据、采集、报告、回修与复验能力；"真实页面"是审计对象，不是要交付的页面。
- 项目清单：仓是 CLI 与工作流工具仓，依赖只有 `ajv` 与 `js-yaml`，无前端框架、路由、页面、组件。
- 计划改动：写集是 skills、workflows、tests、受控页夹具与样本副本，无产品 UI 文件。

可证伪条件：原始需求新增产品页面，或写集出现产品 `src/app/pages/components` 与 token，就翻 true。翻 true
后重跑三来源判定。
禁用动作有三条：不建 `specs/<task>/prototype/`，不调用原型渲染与设计源提取，不加预览与展示确认。
仍允许的消费在方法层：build-code 继续把八维与 `frontend-testing`、`isolated-browser-qa` 当审计方法用。
替代可验证项七项：方法正文可执行读回、薄脚本形状、受控页注入、C05 样本审计、对象与版本绑定、非 UI diff、规范消费。它们替代"UI 准备"这一步，
不替代任何验收。

## 4. 方案

本节回答：打算怎么做。六块按依赖顺序排：判据、采集、分级、判定与报告、回修、交付证据。
每块四段：干什么、为什么、怎么验、失败怎样。命令在仓库根执行，注释行写需求与期望。

### 4.1 方案 1：判据与结果契约（需求 1 到 7）

本节回答：页面上判什么、按哪套维度、结果怎么表达、判据接到哪里。

**干什么。** 页面检查只有一套骨架，就是 C05 的八维。八维是业务任务、IA 导航、交互状态、内容数据、视觉规范、响应式布局、无障碍、真实代码交接。
PRD 的九维不另立体系，整体作第 5 维的子检查，按映射表归主维与副维。
每个检查项只取四态：通过、失败、未测、不适用；不适用必须写依据。
报告逐项表达结果，不设总分，不新开材料键，沿用现审查的 finding 字段。
判据正文只有一处，接进三处既有链路。三处是 `plan-design-review` 的页面模式、`frontend-testing` 的指针节、
`build-code` 的冻结前审计。触发按改动面与交付声明判定：改了页面、路由、组件、样式或任务声明 UI 交付就走，不确定默认走。

**为什么。** 两套维度并列会让同一问题记两次，缺陷数虚高，读者也不知道以谁为准。
四态与"pass 只在全范围"是防假绿的底座；没有它，未测会自动变成通过。
总分则把未知抹成一个看起来不错的数字。

**九维怎么归位。** 主维判成败，副维只补证据，同一问题只在一个主维记一次。

| 九维项 | 主维（判成败） | 副维（只补证据） |
| --- | --- | --- |
| layout | 响应式布局 | 视觉规范 |
| typography | 视觉规范 | 无 |
| colors | 视觉规范 | 无障碍 |
| spacing | 视觉规范 | 响应式布局 |
| shadows、borders、radius | 视觉规范 | 无 |
| icons | 视觉规范 | 无障碍 |
| states | 交互状态 | 视觉规范、无障碍 |

**最小读取集（承接原始需求 42）。** 开工前只读四类。
一类是 NAV-C07 指的入口：本卡、S2 与 S4～S7、真实任务的验收与设计、被审对象本身。
二类是现隔离 QA 的方法，三类是所用准则与工具的输入与失败实现，四类按条件读角色方法与 P0 原件。
不读整本评测套件；不凭 CLI 成功推覆盖——命令退出 0 只证命令跑通，不证任何检查项被覆盖。
四类缺一类，相关检查项记"未测"，并写明缺哪类、谁提供、恢复条件；不记通过，也不改记失败。
落点是 P1 的任务 1（T001，判据正文的规范来源要求）与 P5 的任务 3（T014，规范引用可解析）。
读取清单随判据包发布，缺哪类就在报告对应行带缺项 ref 出现。判它的验收在第 5.10 节。

**怎么验。** 七条命令对需求 1 到 7，一条一条跑。

```
# 需求 1：逐维取证与映射（形状契约）
node node_modules/vitest/vitest.mjs run tests/contract/page-audit-doc-contract.test.mjs
# 期望：退出 0；九维、映射行、四态与必测门断言全过（当前 RED：11 failed、退出 1）
# 需求 2：四项取值口径
node -e "const p=require('node:fs').readFileSync('skills/frontend-testing/references/page-audit.md','utf8');for(const k of ['property','declared','rendered','comparison'])if(!p.includes(k))throw new Error('missing '+k);console.log('ok')"
# 期望：退出 0，stdout 单行 ok（当前 RED：判据包不存在）
# 需求 3：四态与依据
node node_modules/vitest/vitest.mjs run tests/contract/page-audit-shape.test.mjs
# 期望：退出 0；四态、证据、未测理由等 7 条断言全过（当前 RED：7 failed）
# 需求 4：报告与消费接口
node skills/frontend-testing/scripts/check-page-audit.mjs --input tests/fixtures/page-audit/report.valid.json
# 期望：退出 0，stdout 单行 JSON 且 ok:true、errors:[]（当前 RED：脚本与夹具未实现）
# 需求 5：三处接线
node node_modules/vitest/vitest.mjs run tests/contract/page-audit-doc-contract.test.mjs -t wiring
# 期望：两条接线断言过（当前 RED：plan-design-review 未引用 page-audit.md）
# 需求 6：触发判定
node -e "const p=require('node:fs').readFileSync('workflows/build-code/SKILL.md','utf8');if(!(p.includes('页面审计')&&p.includes('冻结')))throw new Error('missing trigger wiring');console.log('ok')"
# 期望：stdout ok（当前 RED：有"冻结"9 处、"页面审计"0 处）
# 需求 7：规范来源
node -e "const p=require('node:fs').readFileSync('skills/frontend-testing/references/page-audit.md','utf8');if(!p.includes('规范来源'))throw new Error('missing 规范来源');console.log('ok')"
# 期望：stdout ok（当前 RED：判据包未实现）
```

**失败怎样。** 骨架走偏：把九维当独立维度体系、与八维并列成 17 项、同一问题在多维重复计数、某维无结果却报通过。
状态走偏：未测算成通过、整页不适用吞掉应有覆盖、不适用没有依据、无设计源却声称视觉还原已验。
表达走偏：设总分或百分比、另建报告平台或第二证据库、用组件 story 或首屏截图代替全部、用聚合分抹平未知。
接线走偏：恢复 `verify-code` 旧阶段、给两个模式各建一套字段、把判据复制进各任务 spec。
规范与触发走偏：引用没读过的规范、用过期版本判通过、按调用者标签判触发、把 N/A 当默认、由调用者自报豁免。

### 4.2 方案 2：真实采集与对象身份（需求 8 到 12）

本节回答：真实输出从哪来，怎么证明确实采的是那个对象，失败时报告什么。

**干什么。** 浏览器只经 `isolated-browser-qa` 一个入口；默认 ego-lite，ego 在跑就直接用。
装了没开就回退 agent-browser，并记 `engine-fallback` 的 from、to、reason、probe。选定后失败不换引擎。
每次采集产一个最小身份块，共八项。前四项是 workspace、service、route、state。后四项是 viewport、engine、
engine_session、object_version。采集 console、network、overflow、焦点与清理事实；五类薄脚本由 C07
建，不另起浏览器栈。
采集失败分四类，各有独立语义，不以空结果充当正常报告。对象从只读归档复制到 C07 自有副本，记 commit、sha256 与时点。
批准版本与交付版本分列，两条腿结果分开记。

**为什么。** 没有身份块的结果无法复核，跨引擎读数也不可直接比较。
空结果冒充正常，是最常见的一种假绿。

**怎么验。** 五条命令；最后一条实测已通过。

```
# 需求 8：引擎选择与回退
node node_modules/vitest/vitest.mjs run tests/contract/browser-engine-selection.test.mjs
# 期望：退出 0，50 passed；ego 优先是否已随契约同步见 OPEN-19
# 需求 10：五类事实的采集
node skills/frontend-testing/scripts/collect-console.mjs --cdp-url http://127.0.0.1:9222/json/version --out /tmp/c07-console.json --viewport 1440x900 --state default
# 期望：退出 0；JSON 含 engine、observed_at、object、items、failures 五键（当前 RED：脚本未实现）
# 需求 9：身份块八项（前件：先跑上一条产出文件）
node -e "const o=JSON.parse(require('node:fs').readFileSync('/tmp/c07-console.json','utf8'));for(const k of ['workspace','service','route','state','viewport','engine','engine_session','object_version'])if(!(k in o.object))throw new Error('missing '+k);console.log('ok')"
# 期望：stdout ok（当前 RED：采集脚本未实现）
# 需求 11：采集失败的独立语义
node skills/frontend-testing/scripts/collect-network.mjs --cdp-url http://127.0.0.1:1/json/version --out /tmp/c07-netfail.json
# 期望：failures[0].class 属四类之一，且不以空 items 冒正常（当前 RED：脚本未实现）
# 需求 12：对象版本与六哈希
shasum -a 256 specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/samples/{A/index.html,A/assets/app.js,A/assets/styles.css,B/index.html,B/app.js,B/styles.css}
# 期望：六行 sha256 与钉版逐项相等，六文件合计 525142 B（复制时实测退出 0；P4 修复一处后，被修文件改记修前与修后两个哈希，其余五件仍与钉版相等）
```

**失败怎样。** 入口与引擎：绕过网关直连浏览器、同一 run 混用两引擎、静默换引擎冒充同一事实、把回退当"已可用已证"。
身份：缺身份块、身份项与实际不符仍出结果、用旧截图充当本次产物、缺项填默认值。
采集：只给汇总不给原始输出、漏清理、薄脚本另起第二套栈或新增公共命令。
失败语义：工具异常返回空结果、把"没跑"记成"没问题"、失败后仍出"通过"摘要。
对象：原地改归档、用 `be7a5673`、混两个字节口径、把复制当"已交付"、用受控页冒真实页面。

### 4.3 方案 3：分级、校准与停止（需求 13 到 17）

本节回答：怎么把偏差定成可复核的档位，什么时候必须停，什么情况升级给人。

**干什么。** 严重度只有三档：阻断、重要、次要；对应 critical 到 blocking、moderate 到 major、minor 到 minor。
处置沿用现有词：已修、驳回、接受风险、需人定、用户已定；复验结果单独记，不写回原 finding 正文。
校准负例至少三条，都是"明显偏差但任务仍可完成"。三条是字体 20 到 17 px、间距 16 到 8 px、颜色 `#1A73E8` 到 `#3A83E8`。
同一明确数值 diff 用同一标尺跑两次必须同级；三条负例必须落重要档。
MINOR 由规则判定，不要求用户签认，报告只写"按某规则接受"。预算停止只说明执行因预算终止；停止原因分开记：工具失败、产品缺陷、资料不足、权限不足。
未测不计通过。
只升级会改变方向、范围、验收或要用户担风险的事，攒批并给一句"不问会怎样"。

**为什么。** 没有校准负例，"重要"就是随手给的档。
把自动判定写成用户确认，等于伪造同意。性能不进定级阈值：它只报原始值与 unknown，不设通过线，三档不吸收耗时数值。

**怎么验。** 六条命令；负例资产与刻度值分开查。

```
# 需求 13：三档与处置词
node -e "const p=require('node:fs').readFileSync('skills/frontend-testing/references/page-audit.md','utf8');for(const k of ['BLOCKER','IMPORTANT','MINOR'])if(!p.includes(k))throw new Error('missing '+k);console.log('ok')"
# 期望：stdout ok（当前 RED：判据包未实现）
# 需求 14：四条校准负例页（三重要一阻断）
node -e "const fs=require('node:fs');for(const f of ['font','spacing','color','blocker'])if(!fs.existsSync('tests/fixtures/page-audit/calibration/'+f+'.html'))throw new Error('missing '+f);console.log('ok')"
# 期望：stdout ok（当前 RED：tests/fixtures/page-audit/ 未建）
# 需求 14：六个刻度值
node -e "const d=require('node:fs').readFileSync('tests/fixtures/page-audit/defects.json','utf8');for(const v of ['20px','17px','16px','8px','#1A73E8','#3A83E8'])if(!d.includes(v))throw new Error('missing '+v);console.log('ok')"
# 期望：stdout ok（当前 RED：夹具未建）
# 需求 15：限定 pass 必须被拒
node node_modules/vitest/vitest.mjs run tests/contract/page-audit-shape.test.mjs -t E_LIMITED_PASS
# 期望：退出 0；coverage_limits 非空时不得 overall 通过（当前 RED：校验器未实现）
# 需求 16：四类停止原因
node -e "const p=require('node:fs').readFileSync('skills/frontend-testing/references/page-audit.md','utf8');for(const k of ['预算停止','工具失败','资料不足','权限不足'])if(!p.includes(k))throw new Error('missing '+k);console.log('ok')"
# 期望：stdout ok（当前 RED：判据包未实现）
# 需求 17：四类升级条件
node -e "const p=require('node:fs').readFileSync('skills/frontend-testing/references/page-audit.md','utf8');for(const k of ['方向','范围','验收','风险'])if(!p.includes(k))throw new Error('missing '+k);if(!p.includes('升级'))throw new Error('missing 升级');console.log('ok')"
# 期望：stdout ok（当前 RED：判据包未实现）
```

**失败怎样。** 定级：自造像素百分比门槛、用工具 threshold 当严重度、把 MINOR 当绿、以"仍能操作"无据降级。
可重复：没有负例就当门槛、一次结果定级、两次不同级仍称可重复。
确认：把自动判定写成用户确认、没有规则依据就放行、以自动化降低判据或吞掉失败。
停止：一份判据出现两处分级来源、把停止写成通过或失败、未测计通过、新设预算门或恢复状态机。
升级：逐条打扰用户、以"攒批"隐瞒已发现缺陷、把升级当默认动作。

### 4.4 方案 4：判定、性能与报告消费（需求 18 到 22，加需求 4）

本节回答：数值与观察怎么互补，性能与业务成功怎么判，报告怎么被下游消费而不吞未覆盖。

**干什么。** 数值、几何与渲染事实，和独立观察事实，两路并排记录；分歧保留复核记录，不取平均。
性能是第 3 维下的「运行性能」子组，不单设维度，也不塞进第 7 维。
性能只报原始值与 unknown。导航三计时是 ttfb、domContentLoadedEventEnd 与 loadEventEnd。每项各跑三次取中位数。
交互用 `performance.mark` 与 `measure`，另记超过 50 ms 的长任务次数与最长值。
业务操作用页面任务脚本加可观察终态判定；HTTP 200、截图或 toast 都不算成功。角色走查按实际需求做，模拟角色只作状态输入，不冒真人研究。
报告逐项写档位、证据 ref 与未覆盖；页面、状态、视口、对象身份写进证据文字，不新增 finding 字段。

**为什么。** 数值能证明差多少，观察能证明能不能用；一方顶替另一方时，缺失的那一侧会被盖住。
把性能并进定级，会让一个耗时数字变成严重度。

**怎么验。** 五条命令，第四条同时查性能采集的字段形状。

```
# 需求 18：数值与观察互补
node -e "const p=require('node:fs').readFileSync('skills/frontend-testing/references/page-audit.md','utf8');for(const k of ['数值','独立观察','平均'])if(!p.includes(k))throw new Error('missing '+k);console.log('ok')"
# 期望：stdout ok（当前 RED：判据包未实现）
# 需求 19：性能只报原始值与 unknown
node skills/frontend-testing/scripts/collect-perf.mjs --cdp-url http://127.0.0.1:9222/json/version --out /tmp/c07-perf.json --viewport 1440x900 --state default
# 期望：退出 0；items[] 只有首屏与交互原始值和 unknown，无 score 或总分（当前 RED：脚本未实现）
# 需求 20：页面任务脚本与可观察终态
node -e "const p=require('node:fs').readFileSync('skills/frontend-testing/references/page-audit.md','utf8');for(const k of ['页面任务脚本','可观察终态','未覆盖'])if(!p.includes(k))throw new Error('missing '+k);console.log('ok')"
# 期望：stdout ok（当前 RED：判据包未实现）
# 需求 21：角色走查与模拟边界
node -e "const p=require('node:fs').readFileSync('skills/frontend-testing/references/page-audit.md','utf8');for(const k of ['角色','模拟'])if(!p.includes(k))throw new Error('missing '+k);console.log('ok')"
# 期望：stdout ok（当前 RED：判据包未实现）
# 需求 22：分歧保留复核
node -e "const p=require('node:fs').readFileSync('skills/frontend-testing/references/page-audit.md','utf8');for(const k of ['分歧','复核'])if(!p.includes(k))throw new Error('missing '+k);console.log('ok')"
# 期望：stdout ok（当前 RED：判据包未实现）
```

**失败怎样。** 判定：只用截图证明 DOM 与 API 语义、用数值替代观察、把两路平均成一个结论。
性能：单设第 10 维、把性能塞进第 7 维、在设计模式造性能结论、拿本地静态服务读数当生产性能、设通过阈值。
业务：用 HTTP 200、截图或 toast 判成功、在 mock 上造真实业务成功、以自动重试重复真实业务写。
角色：模拟角色结论冒真人研究、没有角色对象却编造角色路径。
报告：另建平台、用 story 替全部、聚合分抹平未知、把复验结果写回原 finding 当处置。

### 4.5 方案 5：回修闭环与独立复验（需求 23 到 28）

本节回答：问题怎么被定位、由谁修、修完由谁证明、修不动什么时候停。

**干什么。** 模糊反馈先复现并定位到页面、元素、状态、根因与 owner，再进入修复。
责任按三路分流：设计问题回设计 owner；代码问题在 C07 自有副本修；运行诊断与协调复验归 C07；跨任务规范转 C08。
C07 自有副本就是
`specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/samples/`
的六个运行文件；修复写主是 P4，C05 归档与只读样本不动。
修复只改必要范围；复验原问题与受影响回归，复验者是同一独立角色，不是修复者。
局部最多三轮；一轮没有新增通过项就停，说明原因、缺口与下一条路径。问题清单交用户与设计 owner 并归档，C07 只做自己的复现与独立验收。
终末只复核四项：审计报告、修复记录、受影响面回归、独立复验证据。

**为什么。** "这里不对"不是可修的问题。没有定位就没有最小修复，没有独立复验就没有闭环。

**怎么验。** 六条命令，对应六段闭环。

```
# 需求 23：定位到页面、元素、状态
node -e "const p=require('node:fs').readFileSync('skills/frontend-testing/references/page-audit.md','utf8');for(const k of ['定位','页面','元素','状态'])if(!p.includes(k))throw new Error('missing '+k);console.log('ok')"
# 期望：stdout ok（当前 RED：判据包未实现）
# 需求 24：责任分流与 C07 副本
node -e "const p=require('node:fs').readFileSync('skills/frontend-testing/references/page-audit.md','utf8');for(const k of ['设计','C07','C08','副本'])if(!p.includes(k))throw new Error('missing '+k);console.log('ok')"
# 期望：stdout ok（当前 RED：判据包未实现）
# 需求 25：独立复验与回归
node -e "const p=require('node:fs').readFileSync('skills/frontend-testing/references/page-audit.md','utf8');for(const k of ['独立复验','回归'])if(!p.includes(k))throw new Error('missing '+k);console.log('ok')"
# 期望：stdout ok（当前 RED：判据包未实现）
# 需求 26：轮次与停滞
node -e "const p=require('node:fs').readFileSync('skills/frontend-testing/references/page-audit.md','utf8');for(const k of ['三轮','一轮无新增'])if(!p.includes(k))throw new Error('missing '+k);console.log('ok')"
# 期望：stdout ok（当前 RED：判据包未实现）
# 需求 27：清单与归档
node -e "const p=require('node:fs').readFileSync('skills/frontend-testing/references/page-audit.md','utf8');for(const k of ['清单','归档'])if(!p.includes(k))throw new Error('missing '+k);console.log('ok')"
# 期望：stdout ok（当前 RED：判据包未实现）
# 需求 28：终末四项复核
node -e "const p=require('node:fs').readFileSync('skills/frontend-testing/references/page-audit.md','utf8');for(const k of ['四项','不重跑'])if(!p.includes(k))throw new Error('missing '+k);console.log('ok')"
# 期望：stdout ok（当前 RED：判据包未实现）
```

**失败怎样。** 定位与路由：凭猜测直接改、定位缺失就派修、把"看起来像"当根因。另有擅改源设计、把问题发给已关闭的 C05 owner、
把用户例外写成原分工。
复验：自签复验、只验原问题不验回归、修复顺手改判据或标准。
轮次：反复盲修、无新增仍继续、把三轮当质量结论、新设恢复状态机。
清单与终末：清单发 C05、改判据让问题消失、吞掉未修项、终末首次执行审计、把复核写成全量重跑、缺项却写完成。

### 4.6 方案 6：交付证据与防假绿（需求 29 到 32）

本节回答：用外部件之前要先补什么，怎么防"看起来绿"。

**干什么。** 采用外部采集或计算件之前，先修四类真实缺口：证据绑定、严格输入、未知保留、子失败传播；默认只借方法。
所选实际链要做失败注入，确认子失败向上传播，不被吞成默认值。
含 unknown、空或 false 或 null 耗时、失联采集、证据错配的输入，不聚合成高分或通过；缺值不默认 0。
防假绿六项：pass 只在全范围；对象版本绑定；引用越界检测（五类词表加 override）；判据自哈希；受控页真注入；四项深度面。
四项深度面是 200% 缩放、键盘与焦点、读屏、直接打开文件。读屏作高优先证据，不作必测门；200% 缩放与键盘、焦点是必测门。

**为什么。** 带缺陷接入会把别人的缺口变成自己的通过。
只测成功路径，等于没有验证失败传播。

**怎么验。** 五条命令；第四条拆成两段，覆盖九类预置缺陷。

```
# 需求 29：采用前先修四类缺口
node -e "const p=require('node:fs').readFileSync('skills/frontend-testing/references/page-audit.md','utf8');for(const k of ['证据绑定','严格输入','未知保留','子失败传播'])if(!p.includes(k))throw new Error('missing '+k);console.log('ok')"
# 期望：stdout ok（当前 RED：判据包未实现）
# 需求 30：未知不被聚合
node node_modules/vitest/vitest.mjs run tests/contract/page-audit-shape.test.mjs -t E_UNKNOWN_AGGREGATED
# 期望：退出 0；有未测项时 overall 通过被拒（当前 RED：校验器未实现）
# 需求 31：四态外取值被拒
node node_modules/vitest/vitest.mjs run tests/contract/page-audit-shape.test.mjs -t E_STATE_OUT_OF_ENUM
# 期望：退出 0；四态外取值被拒（当前 RED：校验器未实现）
# 需求 32：受控页九类 region（前五类）
node -e "const t=require('node:fs').readFileSync('tests/fixtures/page-audit/defects.json','utf8');for(const r of ['R1-hash-tooltip','R2-long-text','R3-narrow','R4-zoom','R5-scroll-occlude'])if(!t.includes(r))throw r;console.log('ok')"
# 期望：stdout ok（当前 RED：夹具未建）
# 需求 32：受控页九类 region（后四类）
node -e "const t=require('node:fs').readFileSync('tests/fixtures/page-audit/defects.json','utf8');for(const r of ['R6-hover-bridge','R7-keyboard-focus','R8-reduced-motion','R9-error-permission-repeat'])if(!t.includes(r))throw r;console.log('ok')"
# 期望：stdout ok（当前 RED：夹具未建）
```

**失败怎样。** 采用：带缺陷接入、把未采用当已修、在 grant unknown 上写"已获许可"。
传播：只测成功路径、子失败被吞、以"没采用"代替"没修"。
聚合：unknown 当 0 或跳过、空输出当 pass、用总分掩盖未测。
防假绿：P0 未做却称成立、新增哈希相等门、把受控页当真实页面、用读屏单独判通过或失败。

## 5. 验收

本节回答：七条判据各怎么算通过、什么情况判失败、证据在哪。判据只在这里写一次，别处只引用。
每条给出场景、通过、失败、证据四段，另给判定器、承接 Phase 与拿不到时的写法。精确命令与门留所属 Phase。
未达成项按真实尝试记录：`incomplete：AC-…；试过=<命令与原 ref>；卡在=<真实条件>；谁提供=<真实对象>；恢复条件=<可观察条件>`。
没有真实尝试原 ref 不得记 incomplete；未取得尝试时写 unavailable 与原因。当前七条状态都是 unavailable：未执行。

七条各有一个具名判定器，名字固定、在 Phase 里 grep 得到。
判定器不是门，读法在 P8 的四张卡里；P8 卡内组名与用例见附录 C。

| 验收 | 判定器（规范名，括号内是审查件别名） | 承接 Phase |
| --- | --- | --- |
| 验收 1 | ORACLE-C07-1（`ORACLE-C07-COVERAGE`） | P1、P2、P5、P8 |
| 验收 2 | ORACLE-C07-2（`ORACLE-C07-IDENTITY`） | P1、P2、P5、P8 |
| 验收 3 | ORACLE-C07-3（`ORACLE-C07-STRESS`） | P1、P3、P4、P7、P8 |
| 验收 4 | ORACLE-C07-4（`ORACLE-C07-GRADE`） | P1、P3、P8 |
| 验收 5 | ORACLE-C07-5（`ORACLE-C07-LOOP`） | P4、P6、P8、P9、P10、P11 |
| 验收 6 | ORACLE-C07-6（`ORACLE-C07-NOAGG`） | P1、P2、P4、P5、P7、P8 |
| 验收 7 | ORACLE-C07-7（`ORACLE-C07-TRACE`） | P4、P8 |

判定规则：每条在 P8 只落两种结论之一——`available`（判过了，按八值词表落具体档位与具名证据）
或 `unavailable`＋具名原因与 owner。
七条全 `unavailable` 时 P8 记未完成，不得收口。

### 验收 1：真实页面逐维取证与未覆盖说明

本节回答：验收 1 怎么算通过、什么情况判失败、证据在哪。

**验收 1 要的是：** 真实页面九维与其它适用质量面有逐项判据、原始结果及未覆盖说明。

场景：1、8。对象是 C05 样本（钉 `9efb7e57`，页面层）或受控测试页（只作校准）。
三宽 1440、1024、640；A 有十态与 `stress=1`，B 有十态加 permission 四值加 role 两值。

通过：八维逐维、第 5 维内九维逐项都有判据与原始结果；每处缺失写明未覆盖及理由。
主副维归属可用映射表复核，且无重复计数；pass 只出现在全范围通过处；所需来源与证据齐备。

失败：任一维无结果却计通过；用截图、首屏、总分或组件 story 替代全部；同一问题在第 5 维与第 3、6、7 维重复计数。
未覆盖只写"未覆盖"不给理由；无设计源却声称视觉还原已验。

证据：逐维结果表，加原始采集输出（几何、渲染、console、network、性能原始值），加未覆盖说明；单份或单组可回读原件。
判定与承接：ORACLE-C07-1／ORACLE-C07-COVERAGE；测试或审查子代理执行，开发者不自审；承接 P1、P2、P5、P8。
组名与用例见附录 C。
拿不到怎么办：缺对象或缺引擎时记 unavailable 或未测，不代填，不写通过。

### 验收 2：身份对不上时报具体不一致或 unavailable

本节回答：验收 2 怎么算通过、什么情况判失败、证据在哪。

**验收 2 要的是：** 错工作区、服务、源或状态，或未启动时，能报具体不一致或 unavailable。

场景：2。对象身份与声明不符、服务未启动、route 或状态不是声称的那个，或采集引擎发生回退。
通过：不一致项被具名报出并停在该对象；未启动报 unavailable；回退事实写进身份块且选定后未再切换。
可观察部分保留为事实；空输出与旧截图未被用于通过。
失败：错环境被报通过；未启动仍出结果；未跑视觉记通过或记失败；旧截图或空输出冒 pass。
静默换引擎冒充同一事实；回退后仍按原引擎口径出结论。
证据：身份块、不一致清单、引擎回退记录、采集失败记录，均为可回读原件。
判定与承接：ORACLE-C07-2／ORACLE-C07-IDENTITY，用"一处人为不一致加一处未启动加一次回退"三类输入；承接 P1、P2、P5、P8。
组名与用例见附录 C。
拿不到怎么办：记 unavailable 并写明缺哪件输入。

### 验收 3：压力与交互反例的真实检测与修复

本节回答：验收 3 怎么算通过、什么情况判失败、证据在哪。

**验收 3 要的是：** 适用反例有检测与真实修复，200% 缩放与键盘、焦点必测。

场景：8。九类反例：64 位哈希浮窗、长文本、窄容器、缩放、滚动或遮挡、hover 桥、键盘与焦点、减少动效、错误或权限或重复操作。
状态面取十态：默认、加载、空、错误、取消、边界、权限、重复操作、部分成功或结果未知、恢复。
压力面取长文本、窄容器、滚动与浮层遮挡、hover 桥与减少动效；数据真实性按样本，不据 fixture 推真实业务。
通过：适用反例有检出与修复证据，修复前后可对比；合法例与不适用项各有依据。
修复归属：修复只发生在 C07 自有副本
`specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/samples/`
的六个运行文件里，写主是 P4；C05 归档不动，受控页只作校准。
200% 缩放与键盘、焦点顺序有实测结果；读屏作为高优先证据单列，不单独判通过或失败。
`file://` 按对象适用性记录；C05 样本没测过就记未测。
失败：机械造所有业务状态；只造不修或修复无复验；200% 或键盘、焦点缺失却写通过。
用读屏单独判通过或失败；受控页结果当真实页面通过；`file://` 未测却写已验；不适用项无依据。
证据：反例注入清单、修复前后原件、复验记录、200% 与键盘焦点实测输出、读屏证据行或未测说明。
判定与承接：ORACLE-C07-3／ORACLE-C07-STRESS 核"检出、修复、复验"三段加两项必测门；测试子代理执行；承接 P1、P3、P4、
P7、P8（P4 只接修复段，它的覆盖验收仍是 5 与 7，不占卡号）。
组名与用例见附录 C。
拿不到怎么办：该条保留未测说明；受控页证据不足按决定 41 记 incomplete。
边界：竞态不适用，本能力只读采集，不共享写入；受控页只算校准，不替代真实页面。

### 验收 4：同一数值 diff 同标尺可重复同级

本节回答：验收 4 怎么算通过、什么情况判失败、证据在哪。

**验收 4 要的是：** 同一明确数值 diff 用同一标尺重复跑得同级；MINOR 由规则判定。

场景：3。同一明确数值 diff 用同一标尺跑两次；校准集是四条负例——三条是明显字体、间距、颜色偏差且任务仍可用，一条是主操作命中区被全屏遮罩接管、任务做不完。
通过：两次得同级；三条还原负例都落重要档、阻断负例落阻断档，各自写明依据；阻断档的依据是可操作性事实（`elementFromPoint` 落在遮罩），不是像素百分比；小偏差清单逐项有处置。
MINOR 逐项写明"按某规则接受"，全文没有"用户已确认、已签字"；分歧项有复核记录，未被平均成通过。
失败：两次不同级仍称可重复；没有负例就当门槛；以"任务仍能完成"把明显偏差降为 MINOR。
把工具 threshold 当严重度；把自动判定写成用户确认；分歧被平均成通过；自造像素百分比门槛。
证据：两次定级记录、四条负例结果（含阻断档的命中测试输出）、MINOR 规则清单与逐项引用、分歧复核记录。
判定与承接：ORACLE-C07-4／ORACLE-C07-GRADE；判据 owner 备样例，独立执行者跑两次；承接 P1、P3、P8。
组名与用例见附录 C。
拿不到怎么办：OPEN-07 未解时该面记 incomplete，不出级别。

### 验收 5：定位后修复，独立复验与相关回归

本节回答：验收 5 怎么算通过、什么情况判失败、证据在哪。

**验收 5 要的是：** 模糊反馈定位后修复，独立复验与相关回归实际执行。

场景：4、5。反馈没有页面、元素、状态指向；修复后由同一独立角色复验；轮次与停滞要可解释。
通过：定位到页面、元素、状态与 owner；修复只改必要范围；原问题与相关回归都有复验记录。
修复归属：最小修复只改 C07 自有副本
`specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/samples/`
的六个运行文件，写主是 P4；C05 归档与只读样本不动。
轮次可数、停点可解释；预算停止与工具失败、产品缺陷、资料不足、权限不足分开记，未测不计通过。
终末只复核四项：审计报告、修复记录、受影响面回归、独立复验证据。
失败：凭猜测反复盲修；开发者自签复验；一轮无新增仍继续；原型问题不回设计 owner。
在 C05 mock 上把业务写成成功；反改判据让问题消失；预算停止被推导成产品成功或失败；终末首次执行审计或声称全量重跑。
证据：finding（含页面、状态、视口、对象身份）、路由与修复记录、独立复验记录。还要回归清单、轮次与停点说明、终末四项原件。
判定与承接：ORACLE-C07-5／ORACLE-C07-LOOP 核"定位、路由、最小修复、独立复验、回归"五段；业务步骤按决定 17 判定，mock
上写未覆盖；承接 P4、P6、P8、P9、P10、P11。
组名与用例见附录 C。
拿不到怎么办：缺环节记 incomplete 并写明缺哪一项。

### 验收 6：未知与非法输入不聚合成通过

本节回答：验收 6 怎么算通过、什么情况判失败、证据在哪。

**验收 6 要的是：** unknown、空或 false 或 null、失联采集、证据错配不聚合成高分或通过。

场景：6、7。输入含 unknown 子项、空或 false 或 null 耗时、失联采集、证据与对象错配。
通过：这些输入不聚合成高分或通过；四态保留；所选链的失败传播经过验证；C05 样本结论止于 mock。
未知与非法值保留为四态之一，而不是 0 或跳过；失联采集不出正常报告；未采用某工具处写明"未修"或"未采用"。
失败：聚合吞 unknown；空值当 0；失联采集出正常报告；证据与对象错配仍出结论。
把"没采用某工具"写成"该工具问题已修"；引用 C05 的限定 pass 或"已闭环"当自己通过；受控页结果冒真实页面。
证据：四类非法输入用例与输出、失败传播记录、未采用对照记录、报告表述核对原件。
判定与承接：ORACLE-C07-6／ORACLE-C07-NOAGG；测试子代理用四类非法输入加一类未采用对照；承接 P1、P2、P4、P5、P7、P8。
组名与用例见附录 C。
拿不到怎么办：记 incomplete 并写明缺哪类用例。

### 验收 7：资产层、代码组件层与页面层分别可追溯

本节回答：验收 7 怎么算通过、什么情况判失败、证据在哪。

**验收 7 要的是：** 资产层、代码组件层、页面布局与真实操作分别可追溯，未覆盖不被吞。

场景：9。仓内无 Figma 实例与 Storybook 运行物；第 8 维在页面模式只核对象与代码、版本对应。
通过：三面各有可回读证据；无 Figma 或 Storybook 处写"不适用加依据"。
Storybook 的 region 关闭、context 未就绪或 todo 被列为未覆盖，而不是通过；对象与代码、版本对应可核。
失败：用组件 story 冒页面验收；region 关闭或 context 未就绪被当通过；todo 被吞。
无资产不写依据；无源却声称视觉还原已验；第 8 维被收缩成跳过对象身份核验。
证据：三面证据链清单、无资产依据说明、未覆盖项清单、对象与代码、版本对应记录。
判定与承接：ORACLE-C07-7／ORACLE-C07-TRACE 逐面核对；审查子代理执行；承接 P4、P8。
组名与用例见附录 C。
拿不到怎么办：无资产面写"不适用加依据"，其余面缺证据记 incomplete。

### 5.8 验收对象与运行参数

本节回答：到底检查哪个真实对象，缺什么输入，参数用哪一组。

结论先行：本任务不是产品 UI，走 CLI 对象分支，不是 Web 五项。对象形状是 `workspace`、`state`、`cli.command`、
`cli.entry_ref`、`cli.sample_ref`、`cli.oracle_ref`、`owner`。
执行事实：`node /tmp/c07-acceptance-object-cli.mjs` 退出 0，返回
`{"ok": true, "missing_fields": []}`，`owner` 归一为"用户"。原件在
`quality/tests/2026-10-29-008-build-plan-acceptance-object-cli.json`，被取代件 007
是 UI 判定更正前的 Web 分支执行，保留不删。边界：`ok:true` 只证明最小字段齐备；它不读文件、不跑命令、不认证来源语义。
样本运行参数：服务 `python3 -m http.server 8123 --bind 127.0.0.1`，cwd 是 `samples/B`；样本
A 先 `npm ci` 再 `npm run build`。
route 取 `/index.html`，A 另有 `#simulation` 与 `#workbench?simId=sim-001`。
viewport 主测 `1440x900`，另测 `1024x768`、`640x960` 与 200% 缩放（必测）。
样本写主：六个运行文件是 A 的 `index.html`、`assets/app.js`、`assets/styles.css` 与 B 的
`index.html`、`app.js`、`styles.css`；修一处缺陷写在 C07 自有副本上，写主是 P4，修前修后与 diff 落
`quality/evidence/build-code/`，C05 归档与只读样本不动。

### 5.9 例外登记：四份契约测试的字面断言可由 P11 改

本节回答：哪条常规被破例、凭什么、破例之后哪些绿要重跑。

- 常规：`tests/contract/page-audit-doc-contract.test.mjs` 与
  `page-audit-shape.test.mjs` 是冻结契约，文件头写着"assertion changes require an
  independently reviewed TCR"；第 3.3 节的范围外条款与第 4 节的失败条件都按这条写。门禁读它们的是 P1（两份都读）、
  P4（读 doc-contract）；P11 是唯一改它们的地方。
- 例外：P11 按用户 2026-10-29 的书面允许改四份契约测试的字面断言——`page-audit-doc-contract.test.mjs`、
  `acceptance-plan.test.mjs`、`n11-plan-quality.test.mjs`、
  `n11-acceptance-rules.test.mjs`，只迁 S 类（模板、表格、错误码这类有明确结构的东西），M 类不迁。允许原件是
  `quality/evidence/human-confirmations/2026-10-29-001-allow-frozen-assertion-change.md`；P11 卡内还要求独立审查意见，两者缺一不得改。
- 连带义务：P11 改断言后，P1、P4 的门禁（含 doc-contract）要按新断言逐条重跑并各自重签证据；P9 的门禁不含这四份冻结测试，仍重跑一次并重签，理由是改断言后上一轮的绿不能当现行结论；P8 的七行档位若引用过"旧断言下的绿"，同样重签。三条重跑命令逐字写在
  `phases/P11-去字面断言.md` 的「改完重跑早先门禁并重签证据」，重签产物落 `quality/evidence/build-code/P11-resign/`（三份加一份 manifest，旧证据标 `superseded_by` 不删）。P11
  之前取得的绿记为"旧断言下的绿"，不得当作现行结论。
- 边界：例外只覆盖断言的字面形式，不覆盖判据语义；P11 不得借迁移缩小覆盖范围、不得删 M 类断言、不得换 oracle 凑绿。

### 5.10 边界与依赖类需求怎么算满足

本节回答：几条不像功能的原始需求由谁承接、落在哪个 Phase 的哪张卡、怎么算满足、怎么算失败。
它们不产生独立任务，靠下表点名的验收与卡间接覆盖；每行给可观察的判据，不写"应予以覆盖"这类空话。

| 原始需求 | 谁承接、落在哪 | 算满足（可观察） | 算失败（可证伪） |
| --- | --- | --- | --- |
| 需求 41 可后置项与不得后置项 | 边界类，不产生独立任务；靠验收 1 与验收 6 间接覆盖；"不做 AEM 与大评测平台"落在 3.3 的 N1、N11 | 八维逐维都有结果，没有哪一维因成本整维缺席；采集失败四类各有具名出口；3.3 的 N1 只出现在范围外与风险两处 | 以预算或成本为由把整维、采集失败语义或定向修复后置，同时仍写通过；把 AEM、大评测平台或全自动评分写进范围 |
| 需求 42 最小读取集 | 设计在 4.1 的"最小读取集"一段；卡是 P1 任务 1（T001）与 P5 任务 3（T014） | 判据包有读取清单四类；`node node_modules/vitest/vitest.mjs run tests/contract/page-audit-consumption.test.mjs` 退出 0 且三键齐，清单条目在 `cited_norms` 里；某类缺失时该检查项记"未测"并带缺项 ref | 读完整个评测套件才算读过；凭一条 CLI 退出 0 就写"覆盖已证"；读取清单缺失仍判通过 |
| 需求 43 五阶段开工与不新增状态机 | 边界类，不产生独立任务；靠验收 5 与验收 6 间接覆盖；"不新增恢复状态机"写在 4.3 与 4.5 的失败面 | 先锁范围与判据、再逐块实测；轮次与停点可数；质量未知处只出现未测或 unavailable，禁词扫描为零；`runtime/` 在写集表里只有 P9 校验器一处 | 未知被写成通过；为回修新开阶段、状态或恢复机；未跑先写"已验" |
| 需求 36 实现依赖 | 落在 4.2 的引擎与对象口径；卡是 P2 任务 1（T004）与 P8 任务 1（T021） | C06 未立项不阻塞：报告每条对象结论都带 `object_version`；C05 的 17 条限定 pass 与作废版 `be7a5673` 不出现在任何通过表述里；旧对象结果不被标成 C06 新页面结论 | 把 C06 未立项写成本任务阻塞；拿旧对象或作废版结果冒新页面结论；把未登记引擎的读数当同一事实 |
| 需求 38 合并依赖 | 落在第 6 节的共享路径串行；卡是 P1 任务 3（T003）与 P8 任务 1（T021） | 第 6 节三处共享路径的先后与 `phases/index.md` 依赖列逐字一致；合同脚本的依赖校验 `valid:true`；材料无"P1 全停""评分许可"字样 | 同一文件出现两个写主；恢复 P1 全停或评分许可；把 C06 或 C08 未交付写成阻塞条件 |

## 6. 计划

本节回答：十一个 Phase、35 张任务卡谁先谁后、每张卡交付什么、并行与汇合在哪。
执行顺序与依赖只认 `phases/index.md`：七批次依次是（一）P6、P1；（二）P9、P2；（三）P10、P3；（四）P4；（五）P5（待 P4
完成后）；（六）P7、P11；（七）P8。同批次可并行，跨批次按依赖边串行，逐条边见索引表的「依赖」列；本节不另写一套顺序。
共享路径按依赖边串行：`skills/frontend-testing/skill-bundle.json` 由 P1、P2、P5、P7 依次追加；
`docs/architecture/move-map.json` 由 P5、P7 依次登记；
`skills/decision-log/templates/decision-log-template.md` 由 P6 先写、P9 后写。
汇合点是两条冻结契约由红转绿，加上 P8 的逐条验收；汇合只补受影响集成，不重跑无关面。

### 计划 1 · P1 判据与共用契约

本节回答：这张卡交付什么、依赖谁、去哪读。
结果：判据正文、形状校验器与三处指针接线落地。
依赖：无。
读者入口：`phases/P1-判据与共用契约.md`。
卡：T001 判据正文与 R1 到 R4 定义；T002 薄校验器六类码拒收、退出码三分；T003 指针与登记接线，八维一字不改。

### 计划 2 · P2 真实采集与失败语义

本节回答：这张卡交付什么、依赖谁、去哪读。
结果：唯一入口可用，五个采集器产出带身份块的事实，四类失败有独立语义。
依赖：P1。
读者入口：`phases/P2-真实采集与失败语义.md`。
卡：T004 回退可达，身份在 `get cdp-url` 之后重解析；T005 五个薄脚本，统一输出与四类失败；T006 网关保守简化与登记（SKILL
主流程、cleanup、reference、bundle）。

### 计划 3 · P3 受控测试页与校准负例

本节回答：这张卡交付什么、依赖谁、去哪读。
结果：受控页装齐九类缺陷，四条校准负例可回读，其中一条是阻断档。
依赖：P1。
读者入口：`phases/P3-受控测试页与校准负例.md`。
卡：T007 九类预置缺陷，清单按五个字段可机读；T008 四条负例页（三重要一阻断）与自洽契约测试，六个刻度值可回读。

### 计划 4 · P4 报告接入与回修闭环

本节回答：这张卡交付什么、依赖谁、去哪读。
结果：build-code 与 review 两处消费规则可读，报告表达有静态契约。
依赖：P1。
读者入口：`phases/P4-报告接入与回修闭环.md`。
卡：T009 build-code 触发句、冻结前审计段与终末四项复核；T010 review 镜头一节可执行的摘要消费规则；T011
报告表达与消费的静态契约，弱断言加强到同句同块。

### 计划 5 · P5 审计编排入口与规范消费证明

本节回答：这张卡交付什么、依赖谁、去哪读。
结果：一个编排入口串起采集与校验，规范消费有事实记录。
依赖：P1、P2、P4。
读者入口：`phases/P5-审计编排入口与规范消费证明.md`。
卡：T012 参数与身份校验、引擎锁定可复放；T013 五个采集调用、四类失败传播与未知不聚合；T014 规范引用可解析、三处指针一致（事实，不做门）。

### 计划 6 · P6 make-decision 流程九条修复

本节回答：这张卡交付什么、依赖谁、去哪读。
结果：入口四问、逐模块台账、收口口径三处改进落地。
依赖：无。
读者入口：`phases/P6-make-decision流程九条修复.md`。
卡：T015 入口四问有固定名，与步骤 1、3、5、7 同步；T016 逐模块台账与细节审查前检查可核；T017 grill 与术语表、运行清单、
"最终确认即阶段收口"。

### 计划 7 · P7 交付证据与防假绿实现

本节回答：这张卡交付什么、依赖谁、去哪读。
结果：引用越界检测、版本绑定与三例校准可跑。
依赖：P1、P2、P4、P5。
读者入口：`phases/P7-交付证据与防假绿实现.md`。
卡：T018 五类词表、允许与阻断、override；T019 白名单、改名等价、重签发 delta 与判据自哈希；T020 三例校准、override
样张与证据指针。

### 计划 8 · P8 全 AC 终验

本节回答：这张卡交付什么、依赖谁、去哪读。
结果：七条判据逐条可重放，缺口如实列出。
依赖：P1 到 P7。
读者入口：`phases/P8-全AC终验.md`。
卡：T021 入口准则与两份就绪件可读；T022 三条判据的离线可重放判据；T023 需真实环境与用户在场的未闭环 case；T024 七行档位、
六项结论与五项回写。

### 计划 9 · P9 材料为读者写

本节回答：这张卡交付什么、依赖谁、去哪读。
结果：读者检查、校验器收紧、三模板改形、结构读数与写作契约落地。
依赖：P1、P6。
读者入口：`phases/P9-材料为读者写.md`。
卡：T025 读者检查进第 11 步并固定记录形态；T026 校验器三态推进：先留痕、再收紧、最后翻转默认；T027 三个模板先叙述后字段、编号只出现一次；
T029 结构读数一条命令报四个数、只报不拦；T030 样板一好一坏加两行前后读数；T031 作者开工前的写作契约；T032 阶段末核对扩到"读者可用"。
去字面断言那张卡已移到 P11（T036），因为它要改 P1 的冻结测试。

### 计划 10 · P10 让审查判方案

本节回答：这张卡交付什么、依赖谁、去哪读。
结果：审查材料换成决定基线，四条轴带替代方案，重跑对照 finding 类型。
依赖：P9。
读者入口：`phases/P10-让审查判方案.md`。
卡：T033 材料掉过来，决定基线进包、PRD 降为可选摘录；T034 四条轴替换自洽检查，finding 必须带替代方案；T035 重跑一次比较
finding 类型，还是 0 就判未成立。

### 计划 11 · P11 去字面断言

本节回答：这张卡交付什么、依赖谁、去哪读。
结果：四份契约测试的字面断言迁成 S 类结构断言，同一坏输入仍红。
依赖：P1。
读者入口：`phases/P11-去字面断言.md`。
卡：T036 去字面断言，只迁 S 类并自证同坏输入仍红。
例外登记的原文在第 5.9 节。

## 实现设计（全局权威）

本节回答：用什么架构、接口、代码与验证策略实现上面这些产品行为。本节消费 PRD 与 decision-log，不再决定产品目标。

行号是 2026-10-29 对 HEAD `fa56dbc6` 的实读快照，会漂移，只作定位辅助；契约面是点名的符号与行为语义。
每项缺失写 unknown 加 owner、影响与下一步，不以猜测填空。

### 代码锚点

本节回答：实现前先读哪些真实文件、看哪些符号、谁会因为改动失败。

现状与目标差异：仓内没有页面审计判据正文、形状校验器、五个采集器和受控测试页。
`workflows/build-code/SKILL.md` 全文 `审计` 命中 0 次，只有 N/A 与 unavailable 二分。目标是把它们新建，并在既有方法上插入接线。

读取顺序：先 `skills/frontend-testing/SKILL.md`（判据主语与消费口），再 `skills/plan-design-review/SKILL.md`（八维骨架），再 `workflows/build-code/SKILL.md`（触发与终末），最后 `skills/isolated-browser-qa/*`（采集入口）。
运行条件：Node `v24.14.0`；vitest 入口 `node_modules/vitest/vitest.mjs`；契约测试跑法 `node node_modules/vitest/vitest.mjs run <具名文件>`；静态服务 `python3 -m http.server`。

| # | 文件 | 规模 | 关键锚点（HEAD 实读） | 直接 consumer |
| --- | --- | --- | --- | --- |
| 1 | `skills/plan-design-review/SKILL.md` | 6689 B／63 行 | 八维 `:36-43`；Check `:24-47`；Result `:49-53`；证据级 `:32` | `tests/contract/prototype-design-review.test.mjs:5-8`；`ui-source-consumption.test.mjs:38-39` |
| 2 | `skills/frontend-testing/SKILL.md` | 2656 B／34 行 | UI 交付合同 `:10-14`；build-code 实际消费 `:16-20`；行为测试方法 `:22-24` | `workflows/build-code/skill-deps.yaml:12-14`；`tools/cli/run-checks.mjs:104-110` |
| 3 | `skills/review/SKILL.md` | 6518 B／68 行 | Check `:36-46`；Evidence handling `:48-54`；finding 白名单 `:54`；返回 JSON `:58` | `tests/contract/ocr-review-contract-bundle.test.mjs:153-160` |
| 4 | `workflows/build-code/SKILL.md` | 52067 B／218 行 | 方法 7 `:37-38`；终末承接 `:132-134`；九段清单 `:136-144`；RP 表 `:148-165`；final-report `:168` | `workflows/build-code/steps.json`；`node tools/cli/check-stage-steps.mjs --stage=build-code` |
| 5 | `workflows/build-code/skill-deps.yaml` | 3389 B／120 行 | skills 15 条 `:2-50`；runtime_capabilities `:52-90`；trigger `:12-14` | `workflows/build-code/SKILL.md:112` |
| 6 | `skills/isolated-browser-qa/SKILL.md` | 14845 B／161 行 | Core Rules `:19-21`；Engine Router `:27-29`；Output Contract `:110-116`；Bundled Resources `:122-134` | `__tests__/skill-contract.test.mjs:41-52`；`browser-engine-selection.test.mjs:11-13` |
| 7 | `skills/isolated-browser-qa/scripts/browser-qa-session.mjs` | 47331 B／562 行 | runNativeQa `:171-342`；runEgoWorkspace `:347-365`；recordEngineFallback `:427-430`；selectBrowserEngine `:431-442`；身份 bug `:525-534` | `browser-engine-selection.test.mjs:74-76`、`:81` |
| 8 | `skills/isolated-browser-qa/scripts/browser-qa-tickets.mjs` | 6362 B／57 行 | 六个导出：safeError `:5`；validateEndpoint `:6-11`；makeScope `:12-22`；connectCdp `:23-38`；filterTargetCookies `:39-48`；transferTargetCookies `:49-57` | `browser-qa-session.mjs:9`（只用五个） |
| 9 | `skills/isolated-browser-qa/scripts/browser-qa-cleanup.sh` | 10974 B／327 行 | `ego-lite)` 拒清理 `:10-15`；agent-browser 与 browser-use `:16`；python 主体 `:23-326`；退出判定 `:319-326` | `browser-engine-selection.test.mjs:13` |
| 10 | `tests/contract/browser-engine-selection.test.mjs` | 15779 B／91 行（33 个 it） | 静态断言 `:11-16`；selection `:25-31`；只读包装 `:43-48`；probe 分类 `:52-53`；ego 生命周期 `:62-66`；entry `:74-76`、`:81`；收据 `:84-91` | 本文件自己的跑法 |
| 11 | `tests/contract/page-audit-shape.test.mjs` | 9566 B／160 行（未跟踪） | 目标路径 `:16`；`--input` 子进程 `:35`；退出码契约 `:6`；六码用例 `:91-139`；合法例 `:141-159` | 冻结，DO NOT TOUCH |
| 12 | `tests/contract/page-audit-doc-contract.test.mjs` | 6901 B／114 行（未跟踪） | 判据包路径 `:13`；九维 `:16`；四态 `:17`；失败四类 `:18`；校准负例 `:19`；映射表 `:41-52`；必测门 `:68-78`；接线 `:104-113` | 冻结，DO NOT TOUCH |

待新建（尚无锚点，只有约定路径）：`skills/frontend-testing/references/page-audit.md`、`check-page-audit.mjs`、五个 `collect-*.mjs`、`run-page-audit.mjs`、`tests/fixtures/page-audit/`（受控页、`defects.json`、四条校准页）。
前两个路径已被冻结测试钉死（`page-audit-doc-contract.test.mjs:13`、`page-audit-shape.test.mjs:16`），其余由各 Phase 命令消费。
其余 consumer 与逐字读取事实在 `2026-10-29-003-code-anchors-and-consumers.md` 表一与 §2。

### 接口与失败语义

本节回答：输入如何变成输出，非法或缺失输入怎样失败，哪些历史约束不得违反。

- **架构**：判据正文一处，形状校验器一处，五个只读采集器，一个编排器；接到 `plan-design-review` 页面模式、`frontend-testing` 指针节、`build-code` 冻结前审计三处。不新建技能包，不新增公共命令。
- **职责链**：采集器只产事实，校验器只核形状、不裁决视觉，编排器组包并写身份块，审查与终末消费。审查者不重跑采集。
- **校验器 CLI**：`node skills/frontend-testing/scripts/check-page-audit.mjs --input <report.json>`。退出 `0` 表示形状合法，`2` 表示驳回，其它非零是脚本自身失败，不得当驳回结论。
- **校验器输出**：stdout 恰好一行 JSON，形如 `{"ok":bool,"errors":[{"code":"E_...","path":"...","message":"..."}]}`。
- **六类必驳码**：`E_TOTAL_SCORE`、`E_MISSING_EVIDENCE`、`E_MISSING_UNTESTED_REASON`、`E_LIMITED_PASS`、`E_UNKNOWN_AGGREGATED`、`E_STATE_OUT_OF_ENUM`。
- **五个采集器 CLI**：`node <script> --cdp-url <url> --out <json> [--viewport WxH] [--state <名>]`；统一输出 `{"engine","observed_at","object","items","failures"}`；`failures[].class` 属四类；五个身份值由编排器经五个 `PAGE_AUDIT_*` 环境变量传入，不占命令行参数；缺任一项在连接 CDP 前退 2、不写件、不置 `null`（见 P5「编排器到采集器的身份传递」）。`collect-console`、`collect-network` 另认 `PAGE_AUDIT_WINDOW_DIR`、`PAGE_AUDIT_TARGET_ID`、`PAGE_AUDIT_WINDOW_ID` 三个环境变量，用于同一次导航窗口（见 P5「同一次导航的采集窗口」）。
- **失败到状态的映射**：`NOT_STARTED`（服务或页面未起）到 unavailable 加对象未就绪；`UNREACHABLE`（CDP 失联）到未测并保留已观察。
- **同上的两类**：`TOOL_ERROR`（脚本自异常）到 unavailable，且不得写"未测"；`IDENTITY_MISMATCH`（receiver 身份不符）到 unavailable 加修复指引。四类都不吞已观察事实，也不返回空结果冒正常。
- **编排器 CLI**：`node skills/frontend-testing/scripts/run-page-audit.mjs --cdp-url <url> --state <名> --viewport WxH --out <json>`，另加五个身份参数 `--workspace`、`--service`、`--route`、`--object-version`、`--engine-session` 与三个可选参数 `--engine`、`--collector-root`、`--judgments`；**参数表唯一权威是 `phases/P5-审计编排入口与规范消费证明.md` 的「命令行参数分三层」**，本文件只留参数名，不复写取值规则。串五个采集器、补身份块、调校验器；五个身份值由编排器从命令行解析后逐个注入五个采集器子进程的五个环境变量（名称、对象键与判据见 P5 的「编排器到采集器的身份传递」），缺任一项退出 2、零采集器调用、不写报告；console 与 network 不各跑一次：编排器先并发起两个采集器，两个 ready 后对同一页面目标发唯一一次导航，再用 `finish` 同时收尾，两份输出以同一 `loader_id` 证明同一次导航（见 P5「同一次导航的采集窗口」）；overflow、perf、a11y 依次各一次；退出码其余部分与校验器同义。
- **报告形状**：`{object, criteria[], coverage_limits[], summary:{overall}}`；`criteria[]` 项是 `{id, dimension, state, evidence:[{ref, sha256}], untested_reason?}`；`state` 属四态。证据项统一带 `ref` 与 `sha256`，与 `runtime/evidence/acceptance-evidence-validator.mjs` 的 `{ref, sha256}` 消费合同一致；不新增 schema 文件，不写 `visual-diff-report.v1` 旧名。
- **引擎选择与回退判定点**：`selectBrowserEngine` `:431-442` 先按显式值直返，不探测；`auto` 下探测 PATH 的 `ego-browser`，失败原因 `executable-missing`。
- **回退记录**：ego 在跑直接用；装了没开回退 agent-browser 并记 `engine-fallback{from,to,reason,probe}`（`recordEngineFallback` `:427-430`）；选定后失败不切换。探测失败按 `TOOL_ERROR` 记，不静默回退。
- **口径裁定**：现实现 `browser-qa-session.mjs:505` 与冻结断言在 `auto` 且有 fallback 时抛 `EGO_EXISTING_MODE_NO_IMPLICIT_LAUNCH`，与 U-C07-33、D-027 冲突。裁定是按用户决定改实现，不改用户决定，且先改测试断言再改实现（OPEN-19）。
- **历史约束**：ADR-0031 身份检查不得降级；ADR-0048 隔离与票据禁区不得删；ADR-0033 不许总结或漂白失败；ADR-0055 终末只在 build-code 末 Phase；ADR-0044 禁配对评审；ADR-0047 不设成本上限。
- **身份块最小集**：前四项是 workspace、service、route、state。后四项是 viewport、engine、engine_session、object_version。缺项报具体缺项，不填默认值。
- **数据与生命周期**：一次采集对应一个对象与一个状态，跨状态不合并；每次重采不缓存；截图与 JSON 必须同一时点。console 与 network 共用一次导航窗口：先两个 ready、再唯一一次导航、最后同时收尾；窗口内不重试、不补第二次导航。
- **同上**：缺失或迟到按四类失败映射为 unavailable 或未测，不补默认值；报告落 `quality/evidence/` 即不可变，重签发是新增原件并保留旧件。
- **清理**：采集会话在 finish 时清理；ego 分支不能用 `cleanup.sh`（其 `:10-15` 明确拒清理），以 finish 回执为等价物。
- **证据落点约束**：AC 证据 ref 必须形如 `quality/evidence/...` 且带 `sha256`（`runtime/evidence/acceptance-evidence-validator.mjs:5`、`:35`）。因此报告本体只落 `quality/evidence/`，审查侧只以材料指针出现，不新增 finding 字段。
- **兼容性**：既有消费方是 `plan-design-review` 的 4 组 verbatim 断言、`build-code` 的 20 多条契约断言、`review` 的 finding 白名单、`acceptance-evidence-validator` 的 ref 形状；新增文本不得删旧句。
- **新增控制面**：无。不新增 stage、gate、公共命令或第二证据库。

### 需求到任务追踪

本节回答：每条需求落到哪张任务卡、由哪个判定器判。共 35 行，与 35 张任务卡一一对应（每行一个任务号，含 P11/T036；P9 的卡号跳过 T028，因为它移到 P11 成了 T036），映射关系不改。

| 源 | FR | AC | Phase/Task | ORACLE | 说明 |
| --- | --- | --- | --- | --- | --- |
| R-C07-01、R-C07-07、R-C07-08、R-C07-15、R-C07-25、R-C07-27、U-C07-18 | FR-C07-001、FR-C07-002、FR-C07-003、FR-C07-007、FR-C07-013、FR-C07-014、FR-C07-015、FR-C07-016、FR-C07-017、FR-C07-026、FR-C07-032 | AC-C07-1、AC-C07-2、AC-C07-4、AC-C07-6 | P1/T001 | ORACLE-C07-CONTRACT | 任务 1：写判据正文 |
| R-C07-02、R-C07-09、R-C07-15、U-C07-18 | FR-C07-004、FR-C07-005 | AC-C07-1、AC-C07-4 | P1/T002 | ORACLE-C07-CONTRACT | 任务 2：写形状校验器 |
| R-C07-03、R-C07-15、U-C07-18 | FR-C07-006 | AC-C07-1 | P1/T003 | ORACLE-C07-CONTRACT | 任务 3：接线与登记 |
| R-C07-02、R-C07-20、R-C07-36、U-C07-33 | FR-C07-008、FR-C07-009 | AC-C07-2 | P2/T004 | ORACLE-C07-COLLECT | 任务 1：回退可达，身份在取 cdp-url 之后重解析 |
| R-C07-02、R-C07-03、R-C07-14、R-C07-16、R-C07-20、R-C07-30 | FR-C07-009、FR-C07-010、FR-C07-011 | AC-C07-1、AC-C07-2、AC-C07-6 | P2/T005 | ORACLE-C07-COLLECT | 任务 2：五个薄采集脚本，统一输出与四类失败语义 |
| R-C07-02、R-C07-20、R-C07-36 | FR-C07-008、FR-C07-010 | AC-C07-2 | P2/T006 | ORACLE-C07-COLLECT | 任务 3：网关保守简化与登记 |
| R-C07-27、U-C07-58 | FR-C07-013、FR-C07-032 | AC-C07-3 | P3/T007 | ORACLE-C07-FIXTURES | 任务 1：受控页装齐九类预置缺陷，清单按五个字段可机读 |
| R-C07-28、R-C07-32、U-C07-53 | FR-C07-014 | AC-C07-4 | P3/T008 | ORACLE-C07-FIXTURES | 任务 2：四条校准负例页（三重要一阻断）与自洽契约测试，六个刻度值可回读 |
| R-C07-05、U-C07-43 | FR-C07-028、FR-C07-026、FR-C07-023、FR-C07-025、FR-C07-006 | AC-C07-5 | P4/T009 | ORACLE-C07-WIRING | 任务 1：build-code 触发句、冻结前审计段与终末四项复核可回读 |
| R-C07-31、R-C07-39 | FR-C07-032、FR-C07-027 | AC-C07-7 | P4/T010 | ORACLE-C07-WIRING | 任务 2：review 镜头有一节可执行的页面审计摘要消费规则 |
| R-C07-29、R-C07-30、U-C07-52 | FR-C07-031、FR-C07-028、FR-C07-024 | AC-C07-5、AC-C07-6、AC-C07-7 | P4/T011 | ORACLE-C07-WIRING | 任务 3：报告表达与消费的静态契约测试 |
| R-C07-20、R-C07-14 | FR-C07-009 | AC-C07-2 | P5/T012 | ORACLE-P5-ORCH | 任务 1：参数与身份校验、引擎锁定可复放 |
| R-C07-02、R-C07-03、R-C07-30 | FR-C07-010、FR-C07-011、FR-C07-030、FR-C07-031 | AC-C07-6、AC-C07-1 | P5/T013 | ORACLE-P5-ORCH | 任务 2：五个采集调用、四类失败传播与未知不聚合 |
| R-C07-42、R-C07-01 | FR-C07-007 | AC-C07-1 | P5/T014 | ORACLE-P5-NORM-CONSUMPTION | 任务 3：规范引用可解析，三处指针指向同一节 |
| U-C07-40、U-C07-41、U-C07-42 | FR-C07-023 | AC-C07-5 | P6/T015 | ORACLE-P6-MAKE-DECISION-FLOW | 任务 1：入口四问有固定名，且与步骤 1／3／5／7 同步 |
| R-C07-23、U-C07-40 | FR-C07-025 | AC-C07-5 | P6/T016 | ORACLE-P6-MAKE-DECISION-FLOW | 任务 2：逐模块台账与细节审查前检查可核 |
| U-C07-48、U-C07-40 | FR-C07-028 | AC-C07-5 | P6/T017 | ORACLE-P6-MAKE-DECISION-FLOW | 任务 3：领域词表读回、可核运行清单与收口三项 |
| R-C07-30、R-C07-40、U-C07-54 | FR-C07-032 | AC-C07-6 | P7/T018 | ORACLE-P7-M10 | 任务 1：引用越界检测，五类词与覆盖记录 |
| R-C07-06、R-C07-35 | FR-C07-012、FR-C07-029、FR-C07-032 | AC-C07-6、AC-C07-3 | P7/T019 | ORACLE-P7-M10 | 任务 2：版本绑定，白名单、改名等价与判据自哈希 |
| R-C07-30、R-C07-40、U-C07-58 | FR-C07-032 | AC-C07-6、AC-C07-3 | P7/T020 | ORACLE-P7-M10 | 任务 3：三例校准、覆盖样张与证据指针 |
| R-C07-35、R-C07-05 | FR-C07-005、FR-C07-028 | AC-C07-5、AC-C07-1 | P8/T021 | ORACLE-P8-ACCEPTANCE | 任务 1：入口准则与两份就绪件可读 |
| R-C07-25、R-C07-26、R-C07-30 | FR-C07-003、FR-C07-009、FR-C07-031、FR-C07-018、FR-C07-019、FR-C07-021 | AC-C07-1、AC-C07-2、AC-C07-6 | P8/T022 | ORACLE-P8-ACCEPTANCE | 任务 2：三条验收的离线可重放判据 |
| R-C07-27、R-C07-31、U-C07-53、U-C07-58 | FR-C07-001、FR-C07-012、FR-C07-027、FR-C07-020 | AC-C07-3、AC-C07-4、AC-C07-7、AC-C07-5 | P8/T023 | ORACLE-P8-ACCEPTANCE | 任务 3：需真实环境与用户在场的未闭环 case（第七组为两次定级） |
| R-C07-28、R-C07-31 | FR-C07-004、FR-C07-013、FR-C07-032、FR-C07-022 | AC-C07-4、AC-C07-7、AC-C07-6 | P8/T024 | ORACLE-P8-ACCEPTANCE | 任务 4：七行档位、六项结论与五项回写 |
| U-C07-40 | FR-C07-032 | AC-C07-5 | P9/T025 | ORACLE-C07-AUTHORING | 读者检查进第 11 步，且有固定记录形态 |
| U-C07-40 | FR-C07-032 | AC-C07-5 | P9/T026 | ORACLE-C07-AUTHORING | 校验器分三态推进：先留痕，再对当前材料收紧，最后翻转默认 |
| U-C07-40 | FR-C07-001 | AC-C07-5 | P9/T027 | ORACLE-C07-AUTHORING | 三个模板先叙述、后字段，编号只出现一次 |
| U-C07-40 | FR-C07-032 | AC-C07-5 | P9/T029 | ORACLE-C07-AUTHORING | 结构读数：一条命令报四个数，只报不拦 |
| U-C07-40 | FR-C07-001 | AC-C07-5 | P9/T030 | ORACLE-C07-AUTHORING | 样板：一好一坏，加两行前后读数 |
| U-C07-40 | FR-C07-001 | AC-C07-5 | P9/T031 | ORACLE-C07-AUTHORING | 作者开工前的写作契约：写的时候就别出问题 |
| U-C07-40 | FR-C07-032 | AC-C07-5 | P9/T032 | ORACLE-C07-AUTHORING | 把阶段末核对扩到"读者可用"，并接进 build-plan 第 11 步 |
| U-C07-59、U-C07-62 | FR-C07-032 | AC-C07-5 | P10/T033 | ORACLE-C07-REVIEW | 材料掉过来：决定基线进包，PRD 降为可选摘录 |
| U-C07-59、U-C07-63 | FR-C07-032 | AC-C07-5 | P10/T034 | ORACLE-C07-REVIEW | 四条轴替换自洽检查，finding 必须带替代方案 |
| U-C07-59、U-C07-62 | FR-C07-032 | AC-C07-5 | P10/T035 | ORACLE-C07-REVIEW | 重跑一次，比较 finding 类型；还是 0 就判未成立 |
| U-C07-61 | FR-C07-004 | AC-C07-5 | P11/T036 | ORACLE-C07-TCR | 任务 1：迁 S 类断言并自证仍红 |

P9 的 8 行来源都用 U-C07-40。原因是 DEC-AUTH-001 尚未登记进 requirement-index（OPEN-28、OPEN-32）。这里用同类先例作可解析来源。

### 全局验证策略

本节回答：各风险靠哪些命令覆盖，最终怎么逐条验收，哪些事这套验证证明不了。

- **仓级结构**：`node tools/cli/run-checks.mjs`，只作结构支撑，不进判据判定。
- **五个验证面**：面 1 契约测试的证据是 `quality/tests/` 下运行输出原件（退出码加断言清单），只证形状与接线文本，不证判据语义。
- **面 2 端到端**：不新增；既有 `tests/e2e/prototype-design-journey.sh` 属 C05 面，对本任务判据零覆盖。
- **面 3 真实浏览器**：证据是审计包 JSON、截图与身份块；样本止于 mock，200% 与键盘必测。
- **面 4 文档读回**：证据是读回记录（读者身份、读回文本、复述要点）；人工判断，不作机器门。
- **面 5 结构检查**：证据是退出码与输出；不能证明判据语义、脚本行为或任一判据达成。
- **读回命令**：`grep -n '^- \*\*AC-C07-' specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/spec.md`，打印七条判据行，供独立读者逐条复述。
- **编排入口**：`node skills/frontend-testing/scripts/run-page-audit.mjs --cdp-url <url> --state default --viewport 1440x900 --out <json>`，先补五个身份参数 `--workspace`、`--service`、`--route`、`--object-version`、`--engine-session`（参数与取值规则见 `phases/P5-审计编排入口与规范消费证明.md` 的参数表，两处指同一个接口），五个身份值逐个传给五个采集器；console 与 network 同窗口并发、两 ready 后唯一一次导航（协议见 P5「同一次导航的采集窗口」）；缺任一项退出 2、零采集器调用、不写报告（传递通道见 P5「编排器到采集器的身份传递」），不给默认值；退出码其余部分与校验器同义。
- **合法与非法对照**：`check-page-audit.mjs --input report.valid.json` 退出 0；同一脚本跑 `report.invalid.json` 退出 2，错误码属六类。两侧当前均 RED。
- **RED 与 GREEN**：RED 已录，exit 1、18 failed，原件是 `quality/tests/2026-10-29-001-build-plan-page-audit-red.txt`。GREEN 判定是同一命令、同一文件退出 0 且断言清单全过，不得换 oracle 或缩小范围凑绿。
- **最终聚合**：末验收 Phase 逐条消费第 5 节判据与面 1、面 3 的原件；`run-checks` 只作结构支撑。
- **不能证明什么**：形状合法不等于判据语义正确；接线断言命中不等于方法被真实执行；受控页通过不等于真实页面通过；样本读数不等于生产性能。
- **禁止无范围全量回归**：禁止裸 vitest、`npm test`、`test:safe`；每条命令必须带具名文件或具名范围，例外须写明原因与范围。

影响面与回归范围：

| 回归路径 | 命令 | 期望 |
| --- | --- | --- |
| 仓级检查 | `node tools/cli/run-checks.mjs` | 退出 0；本阶段未执行，结果 unknown |
| 两条冻结契约 | `node node_modules/vitest/vitest.mjs run tests/contract/page-audit-shape.test.mjs tests/contract/page-audit-doc-contract.test.mjs` | 实施后退出 0（当前 RED：7 failed 加 11 failed） |
| 引擎选择 | `node node_modules/vitest/vitest.mjs run tests/contract/browser-engine-selection.test.mjs` | 实测退出 0，50 passed |

受影响面三处：`workflows/build-code/SKILL.md`、`skills/plan-design-review/SKILL.md`、`skills/frontend-testing/`（SKILL 加判据正文加脚本）。
无影响面：`runtime/**`（P9 的校验器改动是唯一例外）、`tools/cli` 公共命令、`runtime/review/stage-materials.json`、`facts.jsonl` 与 review schema、C05 归档与工作区、两个冻结测试。
本次不是产品 UI 变更，回归只跑受影响面，不做全量回归。

## 7. 风险与未决

本节回答：哪些触发可能损害结果、哪些输入还没定、各自谁负责。

### 7.1 风险

本节回答：八类风险各会造成什么后果、在哪个阶段由谁处理。风险不是门，它说明后果与去向。

| 风险 | 触发与后果 | 处理阶段与 owner | 覆盖原编号 |
| --- | --- | --- | --- |
| 对象与版本漂移 | 复制时字节漂移；批准与交付混写；gate 全树相等在尾随与改名场景必失败 | 复制后即核 sha256；两版本分开写；白名单加改名等价加重签发 delta。owner=主会话与首张契约卡 | RISK-01、RISK-15、RISK-16、RISK-20 |
| 浏览器链不可用 | 引擎或"本机没有 ego"判定点不清，采集在任何引擎上都不复现 | 先定失败语义与回退判定点，再实现。owner=工具 owner 与判据 owner | RISK-02 |
| 同文件写冲突 | 同一技能文件被 C05、C06、C08 同时改，出现重复或覆盖 | 按 owner 串行，写入前读现版。owner=各文件 owner | RISK-03 |
| 维度重复计数 | 同一问题在第 5 维与第 3、6、7 维各记一次，缺陷数虚高 | 按映射表写死主副维与归属。owner=判据 owner | RISK-04 |
| 成本与货架化 | 强制范围抬高成本被规避；判据写完没人引用，下一任务重造 | 审计包一次一页复用、冒烟从简；消费方写死三处。owner=方法 owner | RISK-05、RISK-07 |
| 样例与真实页差异 | 负例资产缺、受控页与真实页差异大、C05 止于 mock 被当业务成功、业务真值缺 | 两腿分开记，受控页只作校准，缺真值记 incomplete。owner=判据 owner 与用户 | RISK-06、RISK-08、RISK-09、RISK-14、RISK-21 |
| 时点与范围 | 冻结后改代码使审计过期；终末只复核四项漏项；流程顺序偏差被当合规 | 改代码复跑受影响审计；四项必须齐；偏差记事实不作结论。owner=build-code 终末与主会话 | RISK-10、RISK-17、RISK-18 |
| 例外与确认口径 | 两处例外未登记；方向审查 partial 被当通过；收口被写成下一阶段入口；S5 旧口径判缺确认 | 登记 OPEN-23、OPEN-24；保留原 ref 与失败；确认只等于阶段收口。owner=主会话 | RISK-11、RISK-12、RISK-13、RISK-19 |

### 7.2 未决项

本节回答：12 组未决各缺什么、当前状态、谁下一步做什么。逐组列出覆盖的 OPEN 编号，不删项、不改编号。

| 未决 | 问题 | 状态 | owner 与下一动作 |
| --- | --- | --- | --- |
| OPEN-01、OPEN-02、OPEN-21 | 入口路线与对象交付：复杂路线已选；样本合并与钉版已确认；复制留痕已做、提交未做 | confirmed，提交未做 | 主会话提交副本并记 commit 与时点 |
| OPEN-03、OPEN-04、OPEN-23、OPEN-25 | build-code 接线位置、C05 同文件写冲突、M9 例外、收口动作清单 | 接线已定，例外待登记 | build-plan 落写集；主会话在规范 owner 处登记例外 |
| OPEN-05、OPEN-13、OPEN-19 | agent-browser 身份修复、采集失败语义与回退判定点、引擎断言同步 | 根因与语义已定，实现待验 | build-code 复跑同一探针与一次真实 `--run`；工具 owner 写同步清单 |
| OPEN-06、OPEN-07、OPEN-08、OPEN-09 | 九维来源、视觉刻度与容差、性能采集方法、MINOR 确认 | 06 与 09 已关闭；07、08 值已给、资产待建 | 判据 owner 建三条负例页；实施 Phase 建 `collect-perf.mjs` |
| OPEN-10、OPEN-17 | UES 与外部内容采用范围、ego 许可登记 | open，不阻断本地 | 用户与主会话给代价对比；catalog owner 决定 |
| OPEN-11、OPEN-12、OPEN-16、OPEN-24 | 业务 oracle 对象与真值、C06 未立项、S5 确认冲突、C07 全改的交付与交接 | 形态与归属已定，对象与真值缺 | 主会话与用户定对象；发布计划 owner 改 S5 或登记例外 |
| OPEN-14、OPEN-15 | 规范被真实消费的证明方式、无 Figma 与 Storybook 的 N/A 依据写法 | 范式已定，检查待验收 | 主会话与规范 owner 定证明方式；设计资产 owner 实施阶段核对 |
| OPEN-18、OPEN-20、OPEN-26 | C05 专用脚本切 ego 会断、薄脚本路径与登记、M10 脚本与测试路径 | 20 与 26 路径已定，实现待做 | 实施 Phase 建脚本并登记 bundle；C08 承接迁移 |
| OPEN-22 | 开局调研决策补问 | confirmed，够了 | 用户已答，缺口留 OPEN 与风险 |
| OPEN-27 | 批准绑定与变更登记的实现方式 | 路径已定，实现待做 | 首张契约卡实施，复用 final-report 的 materials 与 hash |
| OPEN-28、OPEN-32 | DEC-AUTH-001 与用户答复 59 到 64 是否登记进 requirement-index 与 decision-log | open | 材料 owner 提，用户定 |
| OPEN-29、OPEN-30、OPEN-31 | 改校验器的影响面、读者检查单次成本、`prose_contract` 何时翻成默认必填 | open | 主会话与 runtime owner；翻转条件是十一张 Phase 的 35 张卡都补出正文段落 |

### 7.3 追加决定：材料为读者写

本节回答：2026-10-29 这条追加决定改变了什么、边界在哪、什么情况才算成立。

用户在 2026-10-29 直接指示：C05 提过也做过方案，但 C07 的材料仍然差，要求在 C07 里新建决定与任务彻底解决。
决定原件是 `2026-10-29-026-decision-authoring-quality.md`（DEC-AUTH-001），落地为 P9 的
T025 到 T032。

- 它不属于 43 条原始需求：来源是用户当日指示，未登记进 requirement-index；
  登记由材料 owner 决定，不冒充新需求。
  它也不改 7 条页面判据：P9 借用验收 5 的形态，对象是材料不是页面；
  真判据是它自己的 gate 命令与冷启动复述记录。
- 它动一处 runtime：`runtime/stage/stage-content-contracts.mjs` 的"17 字段硬错"降级为诊断，
  新增"每卡必须有正文"硬错。这是本任务唯一改 runtime 的地方。
- 双形态验证：历史材料（`task_count=15`）与当前 35 张卡都要继续 `ok=true`，否则不得提交。
- 未成立前不算解决：四条证据缺一即未达成——前后读数、冷启动复述记录、同坏输入仍红、样板材料。写作契约四条硬指标是单行不超过 300 字、单句不超过
  60 字、缩写首现解释、每节开头一句结论。

## 附录 A — 中文编号与机器编号对照

本节回答：正文的「需求 n」与「用户答复 n」各对应哪个机器编号。
正文只写中文编号；下面两张表各分左右两组，按编号查。
机器编号只在附录 A、B、C 与实现设计的追踪表出现。

| 需求 | 机器编号 | 需求 | 机器编号 |
| --- | --- | --- | --- |
| 需求 1 | `R-C07-01` | 需求 23 | `R-C07-23` |
| 需求 2 | `R-C07-02` | 需求 24 | `R-C07-24` |
| 需求 3 | `R-C07-03` | 需求 25 | `R-C07-25` |
| 需求 4 | `R-C07-04` | 需求 26 | `R-C07-26` |
| 需求 5 | `R-C07-05` | 需求 27 | `R-C07-27` |
| 需求 6 | `R-C07-06` | 需求 28 | `R-C07-28` |
| 需求 7 | `R-C07-07` | 需求 29 | `R-C07-29` |
| 需求 8 | `R-C07-08` | 需求 30 | `R-C07-30` |
| 需求 9 | `R-C07-09` | 需求 31 | `R-C07-31` |
| 需求 10 | `R-C07-10` | 需求 32 | `R-C07-32` |
| 需求 11 | `R-C07-11` | 需求 33 | `R-C07-33` |
| 需求 12 | `R-C07-12` | 需求 34 | `R-C07-34` |
| 需求 13 | `R-C07-13` | 需求 35 | `R-C07-35` |
| 需求 14 | `R-C07-14` | 需求 36 | `R-C07-36` |
| 需求 15 | `R-C07-15` | 需求 37 | `R-C07-37` |
| 需求 16 | `R-C07-16` | 需求 38 | `R-C07-38` |
| 需求 17 | `R-C07-17` | 需求 39 | `R-C07-39` |
| 需求 18 | `R-C07-18` | 需求 40 | `R-C07-40` |
| 需求 19 | `R-C07-19` | 需求 41 | `R-C07-41` |
| 需求 20 | `R-C07-20` | 需求 42 | `R-C07-42` |
| 需求 21 | `R-C07-21` | 需求 43 | `R-C07-43` |
| 需求 22 | `R-C07-22` | — | — |

| 用户答复 | 机器编号 | 用户答复 | 机器编号 |
| --- | --- | --- | --- |
| 用户答复 1 | `U-C07-01` | 用户答复 33 | `U-C07-33` |
| 用户答复 2 | `U-C07-02` | 用户答复 34 | `U-C07-34` |
| 用户答复 3 | `U-C07-03` | 用户答复 35 | `U-C07-35` |
| 用户答复 4 | `U-C07-04` | 用户答复 36 | `U-C07-36` |
| 用户答复 5 | `U-C07-05` | 用户答复 37 | `U-C07-37` |
| 用户答复 6 | `U-C07-06` | 用户答复 38 | `U-C07-38` |
| 用户答复 7 | `U-C07-07` | 用户答复 39 | `U-C07-39` |
| 用户答复 8 | `U-C07-08` | 用户答复 40 | `U-C07-40` |
| 用户答复 9 | `U-C07-09` | 用户答复 41 | `U-C07-41` |
| 用户答复 10 | `U-C07-10` | 用户答复 42 | `U-C07-42` |
| 用户答复 11 | `U-C07-11` | 用户答复 43 | `U-C07-43` |
| 用户答复 12 | `U-C07-12` | 用户答复 44 | `U-C07-44` |
| 用户答复 13 | `U-C07-13` | 用户答复 45 | `U-C07-45` |
| 用户答复 14 | `U-C07-14` | 用户答复 46 | `U-C07-46` |
| 用户答复 15 | `U-C07-15` | 用户答复 47 | `U-C07-47` |
| 用户答复 16 | `U-C07-16` | 用户答复 48 | `U-C07-48` |
| 用户答复 17 | `U-C07-17` | 用户答复 49 | `U-C07-49` |
| 用户答复 18 | `U-C07-18` | 用户答复 50 | `U-C07-50` |
| 用户答复 19 | `U-C07-19` | 用户答复 51 | `U-C07-51` |
| 用户答复 20 | `U-C07-20` | 用户答复 52 | `U-C07-52` |
| 用户答复 21 | `U-C07-21` | 用户答复 53 | `U-C07-53` |
| 用户答复 22 | `U-C07-22` | 用户答复 54 | `U-C07-54` |
| 用户答复 23 | `U-C07-23` | 用户答复 55 | `U-C07-55` |
| 用户答复 24 | `U-C07-24` | 用户答复 56 | `U-C07-56` |
| 用户答复 25 | `U-C07-25` | 用户答复 57 | `U-C07-57` |
| 用户答复 26 | `U-C07-26` | 用户答复 58 | `U-C07-58` |
| 用户答复 27 | `U-C07-27` | 用户答复 59 | `U-C07-59` |
| 用户答复 28 | `U-C07-28` | 用户答复 60 | `U-C07-60` |
| 用户答复 29 | `U-C07-29` | 用户答复 61 | `U-C07-61` |
| 用户答复 30 | `U-C07-30` | 用户答复 62 | `U-C07-62` |
| 用户答复 31 | `U-C07-31` | 用户答复 63 | `U-C07-63` |
| 用户答复 32 | `U-C07-32` | 用户答复 64 | `U-C07-64` |

## 附录 B — 功能需求清单（32 条）

本节回答：32 条功能需求各是什么、来源在哪、由哪条验收承接。
正文不写功能需求编号；机器追踪用这里的编号，行首格式固定。

- **FR-C07-001**：按唯一骨架逐维取证，九维按映射表归主/副维（原 F1.1；源 R-C07-01/07/08/10/25/27/31；验收 1）
- **FR-C07-002**：九维取值复用四项口径，并对未覆盖项补属性清单（原 F1.2；源 R-C07-08；验收 1）
- **FR-C07-003**：检查项取四态，未测不计通过，不适用须有依据（原 F1.3；源 R-C07-15/16/25/40；验收 1、6）
- **FR-C07-004**：报告逐项表达并给消费接口，不设总分、不新开材料键（原 F1.4；源 R-C07-11/12/25/39；验收 1、2）
- **FR-C07-005**：判据接入既有链路，`verify-code` 退役后接点重指 build-code 终末段（原 F1.5；源 R-C07-05/19/36/38；验收 1、5）
- **FR-C07-006**：强制触发按改动面与交付声明判定，不确定默认走（原 F1.6；源 R-C07-19；验收 1、2）
- **FR-C07-007**：每判据引用实际读取的规范或 token 来源，缺失或过期即未测（原 F1.7；源 R-C07-42；验收 1、7）
- **FR-C07-008**：浏览器只经唯一网关，引擎顺序固定且选定后不切换（原 F2.1；源 R-C07-02/20/36；验收 2）
- **FR-C07-009**：每次采集产出八项最小身份块（原 F2.2；源 R-C07-14/20/34；验收 2）
- **FR-C07-010**：采集 console、network、overflow、焦点与清理事实（原 F2.3；源 R-C07-02/20；验收 2）
- **FR-C07-011**：采集失败有独立语义，不以空结果充正常报告（原 F2.4；源 R-C07-03/16/26；验收 2、6）
- **FR-C07-012**：对象取用有固定路径与版本三件套，批准与交付版本分开（原 F2.5；源 R-C07-06/35/37；验收 1、2、7）
- **FR-C07-013**：严重度按三档映射，处置沿用现词，复验单独记（原 F3.1；源 R-C07-21/32；验收 4）
- **FR-C07-014**：校准负例至少三条，同一偏差同标尺重复跑得同级（原 F3.2；源 R-C07-27/28/32；验收 4）
- **FR-C07-015**：MINOR 由规则判定，不要求用户签认（原 F3.3；源 R-C07-21；验收 4）
- **FR-C07-016**：低保真、缺证据与预算停止沿 S5，四类原因分开、未测不计通过（原 F3.4；源 R-C07-21/33；验收 5、6）
- **FR-C07-017**：只升级会改变方向、范围、验收或要用户担风险的事（原 F3.5；源 R-C07-21；验收 4）
- **FR-C07-018**：数值、几何、渲染与独立观察互补，不互相顶替、不取平均（原 F4.1；源 R-C07-09/22/34；验收 1、4）
- **FR-C07-019**：性能作第 3 维「运行性能」子组，只报原始值与 unknown（原 F4.2；源 R-C07-22；验收 1）
- **FR-C07-020**：业务操作用页面任务脚本加可观察终态判定（原 F4.3；源 R-C07-09；验收 5）
- **FR-C07-021**：角色走查按需做，模拟角色不冒真人研究（原 F4.4；源 R-C07-09；验收 3）
- **FR-C07-022**：模型观察分歧保留复核，不强行平均成通过（原 F4.5；源 R-C07-28；验收 4）
- **FR-C07-023**：模糊反馈先定位到页面、元素、状态与根因再动作（原 F5.1；源 R-C07-04/14/17；验收 5）
- **FR-C07-024**：责任按设计、代码、运行诊断分流，C07 样本修复属用户例外（原 F5.2；源 R-C07-13/18/37/39；验收 5）
- **FR-C07-025**：最小修复后由同一独立角色复验原问题与相关回归（原 F5.3；源 R-C07-04/23/29；验收 5）
- **FR-C07-026**：轮次与停滞有明确边界（原 F5.4；源 R-C07-23/33；验收 5）
- **FR-C07-027**：问题清单交用户或设计 owner 并归档，不反改判据（原 F5.5；源 R-C07-37/39；验收 5）
- **FR-C07-028**：终末只复核四项，不重跑全量审计（原 F5.6；源 R-C07-23/29；验收 5）
- **FR-C07-029**：采用外部采集或计算件前，先修四类真实缺口（原 F6.1；源 R-C07-24；验收 6）
- **FR-C07-030**：所选实际链及其失败传播必须验证（原 F6.2；源 R-C07-24/30；验收 6）
- **FR-C07-031**：未知、非法耗值、失联采集与证据错配不聚合成通过（原 F6.3；源 R-C07-30/40；验收 6）
- **FR-C07-032**：交付证据与防假绿六项落地（原 F6.4；源 R-C07-30；验收 3、6）

## 附录 C — 验收清单（7 条）

本节回答：7 条验收的机器编号、判定器、P8 组名与用例各是什么。
每条一行，行首格式固定；正文只写验收 n。

- **AC-C07-1**：真实页面九维与其它适用质量面有逐项判据、原始结果及未覆盖说明；判定器 ORACLE-C07-1（审查件别名 `ORACLE-C07-COVERAGE`）；P8 卡内组名 AC-C07-1；用例 UC-C07-1。
- **AC-C07-2**：错工作区、服务、源或状态，或未启动时，能报具体不一致或 unavailable；判定器 ORACLE-C07-2（审查件别名 `ORACLE-C07-IDENTITY`）；P8 卡内组名 AC-C07-2；用例 UC-C07-2。
- **AC-C07-3**：适用反例有检测与真实修复，200% 缩放与键盘、焦点必测；判定器 ORACLE-C07-3（审查件别名 `ORACLE-C07-STRESS`）；P8 卡内组名 AC-C07-3；用例 UC-C07-3。
- **AC-C07-4**：同一明确数值 diff 用同一标尺重复跑得同级；MINOR 由规则判定；判定器 ORACLE-C07-4（审查件别名 `ORACLE-C07-GRADE`）；P8 卡内组名 AC-C07-4；用例 UC-C07-4。
- **AC-C07-5**：模糊反馈定位后修复，独立复验与相关回归实际执行；判定器 ORACLE-C07-5（审查件别名 `ORACLE-C07-LOOP`）；P8 卡内组名 AC-C07-5；用例 UC-C07-5。
- **AC-C07-6**：unknown、空或 false 或 null、失联采集、证据错配不聚合成高分或通过；判定器 ORACLE-C07-6（审查件别名 `ORACLE-C07-NOAGG`）；P8 卡内组名 AC-C07-6；用例 UC-C07-6。
- **AC-C07-7**：资产层、代码组件层、页面布局与真实操作分别可追溯，未覆盖不被吞；判定器 ORACLE-C07-7（审查件别名 `ORACLE-C07-TRACE`）；P8 卡内组名 AC-C07-7；用例 UC-C07-7。

## 附录 D — 术语、决定索引与原件指针

本节回答：术语去哪查、42 条决定各属哪一类、原始件在哪。
这里只给指针，不复写定义。

### D.1 术语

本节回答：本文用到的 11 个术语，各自的唯一权威位置在哪。

| 术语 | 唯一权威位置 |
| --- | --- |
| 限定 pass | `GLOSSARY.md:95` |
| 对象版本三件套 | `GLOSSARY.md:98` |
| 页面审计 | `GLOSSARY.md:202` |
| 受控测试页 | `GLOSSARY.md:205` |
| 四态 | `GLOSSARY.md:208`；机器字段映射见 D-007 |
| 八维、九维与主副维 | D-011、D-018；PRD:327 的九维名单 |
| `engine-fallback` | D-027；CONTRACT-4 |
| `coverage_limits` | CONTRACT-2 与 `tests/contract/page-audit-shape.test.mjs` |
| BLOCKER、IMPORTANT、MINOR | CONTRACT-6 |
| 身份块最小集 | CONTRACT-5 |
| 证据绑定、严格输入、未知保留、子失败传播 | R-C07-24 与 decision-log 工作包⑩ |

### D.2 决定索引

本节回答：42 条决定各属哪一类、正文的「决定 n」怎么对上。
正文的「决定 n」指 decision-log 的 `D-0nn`；例如决定 25 就是 `D-025`。
下面按主题分组，逐条正文回 `decision-log.md#工作包与决定`。

- 交付形态与边界：D-001、D-008、D-024、D-030、D-038。
  判据标准：D-004、D-011、D-012、D-014、D-015、D-016、D-017、D-018、D-019。
- 结果与状态：D-007、D-009、D-013、D-025、D-037。
  采集与引擎：D-022、D-023、D-027、D-028、D-029。
- 对象与版本：D-020、D-021、D-031、D-032、D-033、D-042。
  触发与升级：D-005、D-026、D-034。
- 规范与证据：D-035、D-036、D-041。
  时点与收口：D-002、D-003、D-010、D-039、D-040。路线：D-006。

### D.3 变更记录与原件

本节回答：这版改了什么、原始件在哪。

- 本版（2026-10-29 第三轮）：正文改用中文编号，需求、用户答复、验收、场景、方案五类；
  英文编号退到附录 A、B、C。追踪表与实现设计不动。
  对照记录在 `2026-10-29-050-spec-id-strip.md`。
- 本版（2026-10-29 第二轮）：按独立审查 `2026-10-29-048-new-standard-review.md` §3 的七条阻断项修计划面——
  11 个 Phase、35 张任务卡与当时的六批次顺序收成一套，补第 5.9 节的冻结断言例外登记，
  编排入口参数改为引用 P5 参数表，回修改归 P4 的自有副本；
  逐条记录在 `2026-10-29-049-blocker-fixes.md`。32 条需求、7 条判据不变，追踪表仍 35 行。
- 本版（2026-10-29）：按 `2026-10-29-034-rewrite-design.md` 重排结构与措辞；
  32 条需求、7 条判据与 35 行追踪表不变。
  依据是 DEC-AUTH-001 与 decision-log 追加节，对照记录在 `2026-10-29-035-spec-rewrite-report.md`。
- 上一版（同日早）：1,422 行、10 节；六个模块加附录 A；本版把机器字段退到附录与追踪表。
- 原件一：43 条原始需求逐字短引在 `requirement-index.md`，覆盖与缺口在 `coverage-matrix-5d.md`。
- 原件二：UI 适用性在 `2026-10-29-002-ui-applicability-and-norms.md`，
  代码锚点在 `2026-10-29-003-code-anchors-and-consumers.md`，
  接口契约在 `2026-10-29-004-builder-scope-decisions.md` 的 CONTRACT-1 到 11。
- 原件三：样本钉版在 `2026-10-29-001-c05-sample-copy-pin.md`，
  阶段调研是 `009` 到 `012` 四件，材料审计是 `021` 与 `030`。
