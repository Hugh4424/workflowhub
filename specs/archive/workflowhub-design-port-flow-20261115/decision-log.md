# 决策日志（decision-log）· workflowhub-design-port-flow-20261115

## 任务身份：这是什么任务？

- **任务类型**：普通任务（复杂路线）。
- **原始痛点**：WorkflowHub 现有「有稿」路径只覆盖「拿到设计稿→提炼资产→按规格重做前端」，没有「设计稿可直接复用时快速移植」的步骤。PaperBuilder 一次真实改造证明移植路线能显著减少返工，但做法散落在项目仓库里，没有变成流程、技能和可执行校验。
- **本轮结果**：在 build-plan / build-prd 的有稿分支增加判断与结论载体，用现有提炼技能承载「移植→数据接线→四类校验→目视收敛→规范沉淀」，形成一条可被后续项目照做的链路。
- **不做的事**：不改 PaperBuilder 仓库，不重跑它的门禁，不发布安装包，不改产品代码。
- **来源**：用户原话见 `quality/evidence/decision-log-refs/requirement-index.md#一用户逐字原话`。

## 级别与路线：走哪条路线？

- 推荐级别：复杂
- 用户选择：复杂
- 原 ref：quality/evidence/decision-log-refs/requirement-index.md
- sha256：63701375359b12e42c4829052c8a9e66efdb062fcb6a589551b85bf11ba7b64a
- 入口调用原件：quality/evidence/entry-evaluation-return.json
- scope：WorkflowHub 有稿前端设计稿落地流程；来源：quality/evidence/decision-log-refs/requirement-index.md
- change_kind：流程步骤与技能新增；来源：quality/evidence/decision-log-refs/requirement-index.md
- independent_units：9；来源：quality/evidence/decision-log-refs/requirement-index.md
- risk：major_architecture；来源：quality/evidence/entry-evaluation-return.json
- credentials：false；来源：quality/evidence/decision-log-refs/requirement-index.md
- dependencies：无外部依赖；来源：quality/evidence/decision-log-refs/requirement-index.md
- acceptance：AC-001…AC-011；来源：quality/evidence/decision-log-refs/coverage-matrix-5d.md
- **入口评估实际返回**（原件 `quality/evidence/entry-evaluation-return.json`）：
  - `status`：`paused`
  - `reason`：`mini-task scope includes materially expanded risks: major_architecture; an explicit route choice is required`
  - `expanded_risks`：`["major_architecture"]`
  - `choices`：`["shrink-scope", "create-ordinary-five-stage-task"]`
- **七项输入判级事实**：

| 事实 | 取值 | 依据 |
| --- | --- | --- |
| boundary_clear | false | 变化落在 build-plan / build-prd / build-code / skills / 登记 / 测试多处，边界需收敛 |
| single_outcome | false | 9 个可独立验收单元 |
| limited_impact | false | 改流程方法、技能目录、登记表与契约测试 |
| major_architecture | true | 改变「有稿」分支的判断与执行链，属于流程架构变化 |
| migration | false | 无数据或存储迁移 |
| permission | false | 不涉及权限模型 |
| security | false | 不涉及安全边界 |

- **承诺的独立可交付验收单元数**：9 个（P1…P9）。
- **是否含需要用户在场或真实凭证的动作**：否。
- **实际调用命令**：`node --input-type=module -e 'import {evaluateEntryRoute} from "./workflows/make-decision/scripts/entry-evaluation.mjs"; ...'`。

## 原始需求：要解决什么？

完整逐字与来源类型见 `quality/evidence/decision-log-refs/requirement-index.md`。主文只留最小含义：

| 编号 | 最小含义 | 来源类型 |
| --- | --- | --- |
| R-001 | 读 PRD，找出 UI 前端任务流程的遗漏 | 用户原话 |
| R-002 | 从「策略｜0页面｜B」会话提炼可复用做法 | 用户原话 |
| R-003 | build-plan / build-prd 选「有稿」时，先判断设计稿能否快速套用，避免重做 | 用户原话 |
| R-004 | 新流程要覆盖验证、对比、数据、规范沉淀 | 用户原话 |
| R-005 | 按 WorkflowHub 标准执行，先建 worktree | 用户原话 |
| R-006 | 建立完整 todo list 并执行 | 用户原话 |
| R-007 | 验收标准要保证变更完全可验证 | 用户原话 |
| R-008 | 主会话不做大量阅读/调研，派子代理 | 用户原话 |
| R-009 | 骨架＋方向审查后，逐包收敛再细节审查 | 用户原话 |
| R-010 | 完成后停下汇报，给 stage-handoff 路径 | 用户原话 |
| R-011 | 简洁直白中文，提问用提问工具，白话说明选项/后果/风险 | 用户原话 |
| R-012 | 不用黑话、术语和内部 ID | 用户原话 |

### 后来改了什么，原件在哪里？

- `U-001`：调研范围＝只看本仓。Talk 批次 1。
- `U-002`：交付深度＝流程＋可执行校验。Talk 批次 1。
- `U-003`：五包骨架被打回，要求按会话实现阶段重核坑与经验后再定包。Talk 批次 2。
- `U-004`：设计稿不能用时必须写下一步与负责人。Talk 批次 2。
- `U-005`：八包骨架确认，`就按八个包做`。Talk 批次 3。
- `U-008`：把「逐包收敛质量」加成第 9 包，先改 make-decision 并先做第 9 包，再按新标准重做 P5。Talk 批次 10。
- `U-006`：要求按第 9 步完整重做逐包收敛（十列台账、五类分析、五行表、8 项证据、十格卡、冷读、验收五问），并把两个流程缺口顺手补上：方向审查未派外部模型不算审查；检查器对「已收敛」要求冷读与证据标记。Talk 批次 5。

## UI 范围与设计基准：页面与设计源是什么？

**非 UI 任务**。三源依据：

- `raw_requirement`：用户要改的是 WorkflowHub 的工作流步骤与技能，不是页面、路由或组件。
- `project_inventory`：本仓库没有前端应用与页面路由。
- `planned_or_changed_frontend_fact`：本次不新增或修改任何页面。

因此不写「五行卡」。被新增的能力服务的是别的项目的前端。

## 一共分几个包，每个包是什么？

| 包 | 一句话范围 | 依赖 |
| --- | --- | --- |
| P1 判断与边界 | 先盘旧页三链（功能／接口／入口），逐案决定改造还是重写；再判设计稿能不能用；三档结论；不能用时两条路都列、当场选并写负责人；原型元素清单与例外清单；用户说等确认就只读不动手 | 无 |
| P2 移植与样式 | 移植单元＝外壳＋内容；逐字复制、只改 import、可逐行验证；复制渲染值与交互形态；只编译用到的样式类；作用域与特异性预算；chrome 层归属；三类登记与完整性；生成器由本包唯一写入 | P1 |
| P3 数据与状态 | 样例态是交付物；显式数据档案与默认源；缺失值语义；读失败分档；读超时；写动作真回执；单一事实源；多状态页面；控件不降级；不许自造提示；口径冲突进同一份裁定台账 | P2 |
| P4 校验与验收 | 几何、DOM 结构、来源与生成物覆盖、功能保留四类检查；第五类清单可信度；覆盖矩阵；环境身份与 HEAD 绑定；跳过≠通过；负向自证；跨页一致 | P2／P3／P5 |
| P5 既有功能接线 | 读 P1 的三链清单，直接改移植件接回旧功能与旧接口；逐项找回；新界面复用旧链路不重开；运营态与旧 DOM 钩子不丢；回归通过 | P1／P2 |
| P6 目视对比与返工收敛 | 只截 1440；独立审查者逐条判断差异；不设用户裁判、不设必须清零；硬判据「机器全绿不等于视觉通过」 | P3／P4／P5 |
| P7 协作与写入权 | 协作规则落到 build-code 方法节，消费者是 build-code 主会话；复用 `runtime/interface/record-lock.mjs` 与既有 Git 授权；一树一写者、生成物唯一写者、共享文件冻结、稳定取数、清理 | 贯穿，落点在 build-code |
| P9 逐包收敛质量 | 每包十格人话卡、调研判断、talk 真问答、独立冷读迭代、刹车判据；先做 | 无（先执行） |
| P8 规范沉淀 | 反模式清单每条有门禁对应；新页面八步流程；三处引用与登记；契约测试；设计稿更新同步；数字由命令产出、不写死；测试锚语义不锚行号；真源回退写进决策日志；流程加固：方向审查档位规则＋检查器对「已收敛」要求冷读与证据标记 | P1…P7 |

## 每个包定了哪些决定？

### 工作包 9：逐包收敛质量（先执行）

消费者：后续任务作者

#### D-009 — 把逐包收敛写成能看懂、能被冷读的方案卡

- **被否替代**：只加一句「写详细点」（没法判合格）、新增一轮收敛审查（成本高）、只改模板不改步骤（没人执行）；代价是每包要多写一张卡和一轮冷读。
- **做什么**：在第 9 步现有台账之外，每包写一张十格方案卡：一句话结果、对应需求、现状缺口、方案与取舍、边界、数据和状态、验收、风险与回退、未决、白话复述。卡写人话：标题是读者的问题，第一句是答案，一句一行，不出现未解释的黑话或内部编号。方案与取舍必须写至少一个被否替代及否决理由；验收每条给一个反例；未决没有就写「无」并给理由。写完由没参与的人只读卡冷读五问：改什么、为什么、边界、怎么验、还有什么没定；答不出就改，改到五问全答出。卡存 `quality/evidence/convergence/convergence-cards.md`；冷读记录写进本包五行表的「收敛」格。
- **不做什么**：不新增步骤、不新增审查轮、不新增确认门；不新建第二份收敛材料；不把卡变成填表；不用黑话、内部编号或阶段缩写代替人话；不把同一格式推广到 build-prd/build-plan（另开任务）。
- **风险**：卡变长——每格一句结论；冷读太主观——固定五问；卡变成形式——没有替代、反例、白话三者任一即不合格；改坏现有收敛——回退卡要求，保留十列台账。
- **改动**：`workflows/make-decision/SKILL.md` 第 9 步；`skills/decision-log/templates/decision-log-template.md` 的方案卡节；任务证据区 `convergence-cards.md`。

### 工作包 1：判断与边界

消费者：build-plan 主会话

#### D-001 — 先判「改造还是重写」，再判「稿能不能用」

- **做什么**：先盘旧页的功能、接口、入口三链，逐案决定改造还是重写（不预设默认）；设计稿按可运行性、技术栈、依赖、许可、令牌映射、复用面逐项判断，结论只能三档之一。三档判据如下：
  - **可直接套用**：设计稿能在本机跑起来；技术栈与项目一致或可共存；依赖能装；许可允许；设计令牌能一一映射；页面与组件不需要改设计稿源就能放进项目。
  - **改一改能用**：上述有一项或多项不满足，但都能在项目侧用适配层或令牌映射解决，且不改设计稿源。先判硬条件，任一硬条件命中才判不能用。
  - **不能用**：设计稿不能运行、技术栈不兼容且无法共存、许可不允许、或宿主样式冲突无法隔离——这四条是硬条件，任一命中即不能用。
  用户明确说「等确认再动手」时，只读不动文件。结论写进 build-plan 产出的 `spec.md` 的「设计稿套用结论」节，含判断项、依据、结论、下一步与负责人。判断为「不套用」时，必须同时列出「先补能跑的原型」与「按需求重做」两条并写负责人；缺任一项，build-code 的前置检查拒绝进入施工。
- **不做什么**：不把「有稿」直接等同于「重写前端」；不在结论为空时进入实施；不自行豁免原型元素。
- **被否替代**：被否替代：默认重写（老功能容易丢）、默认改造（新页面难像）；代价是逐案判断更慢。
- **风险**：判断项写虚会变走过场；缓解是每项给判定方法与材料位置，并用夹具案例走一遍。
- **改动**：`workflows/build-plan/SKILL.md` 有稿分支；`workflows/build-prd/SKILL.md` 一句前置记录；`workflows/build-code/SKILL.md` 前置检查。

### 工作包 2：移植与样式

消费者：build-code 实施者

#### D-002 — 用现有提炼技能承载「外壳＋内容」的移植方法，不动既有步骤编号

- **做什么**：把移植方法并进现有 `skills/design-source-extraction/`：新增「移植实施」章节与 `references/port-method.md`，写清移植单元、逐字复制只改 import、复制渲染值与交互形态、只编译用到的样式类、作用域与特异性、chrome 归属、三类登记、手改走单独文件并登记、生成器自证；生成器由 P2 唯一写入；在三个工作流引用。
- **不做什么**：不新建第二个技能；不改 build-plan 与 build-code 的步骤编号（契约测试钉死）；不把移植件当只读——允许直接改，但每处改动必须登记。
- **被否替代**：被否替代：新建独立技能（多一套目录与登记）、只改移植件不登记（会漂移）；代价是提炼与移植耦合。
- **风险**：提炼与移植耦合；边界写死「提炼产出资产，移植消费资产并落到目标页面」；手改不登记会漂移。
- **改动**：`skills/design-source-extraction/SKILL.md` 与 `references/port-method.md`；catalog 描述；skill-deps；不再新增 `skills/design-source-extraction/`。

### 工作包 3：数据与状态

消费者：实施者

#### D-003 — 数据与状态：样例态是交付物，但必须可识别

- **做什么**：没有真实数据时用样例把版式撑满并做页面／区块／值三层标注；原型、合同、验收标准三者冲突时，写进同一份「口径冲突裁定台账」，写明冲突双方、裁定人、结论与影响，不许静默选一边；显式数据档案与默认源；缺失值语义；读失败分档；读超时；写动作只认回执；同一状态一个判定口；控件不降级。
- **不做什么**：不用样例值冒充真实数据；不用自造提示替代不可用控件；不按原型一刀切删项目已有配置。
- **被否替代**：被否替代：全部用样例（不真实）、有源读失败也填样例（会把假当真）；代价是缺数据时页面朴素。
- **风险**：错误码不稳定导致误判；缓解是把分档写成纯函数并对未知码给默认档。
- **改动**：`skills/design-source-extraction/references/data-and-state.md`、`feature-keep.md`。

### 工作包 4：校验与验收

消费者：独立审查者

#### D-004 — 四类机器校验之外，再加「清单可信度」与「环境身份」

- **做什么**：几何、结构、来源与生成物覆盖、功能保留四类检查；比对清单本身要能被复核；读数必须绑定当前 HEAD 与后端身份；跳过≠通过；每条校验要有负向自证。脚本形态定为「通用脚本＋项目配置（探针、清单、对照对）」，不在 workflowhub 内置浏览器探针。
- **不做什么**：不把「人眼看过」当校验；不接受「0 差异＋N 跳过」；不靠写死探针凑绿。
- **被否替代**：被否替代：自动探测配置（猜错不可信）、只给人工清单（不能机器验证）；代价是项目要填七项配置。
- **风险**：门禁假绿是本会话最大教训；缓解是自证用例与独立读者复核。
- **改动**：`skills/design-source-extraction/scripts/`；`tests/contract/` 自证用例。

### 工作包 5：既有功能接线

消费者：实施者

#### D-006 — 既有功能必须接线，不重开一套

- **做什么**：读 P1 的三链清单，旧功能—接口—入口逐项找回；接不上先改旧功能或旧接口联调；真改不动才登记具名缺口、写理由，由 Phase 审查者确认；缺口必须逐项列出，不能静默放弃。
- **不做什么**：不在新页面重写一套已有功能。
- **被否替代**：被否替代：直接登记缺口（等于放弃旧功能）、允许删除（功能真没了）、停下来问用户（不想被打断）；代价是先改旧功能更费工。
- **风险**：旧钩子丢失会让既有测试红；缓解是接线清单与回归。
- **改动**：`skills/design-source-extraction/references/wiring.md`。

### 工作包 6：目视对比与返工收敛

消费者：独立审查者

#### D-005 — 目视对比是验收的另一半

- **做什么**：只截 1440 宽的页面截图，和设计稿并排；由没参与实现的独立审查者逐条判断差异，写「已修复」或「接受及理由」；明确「机器全绿不等于视觉通过」；不要求用户当裁判，不设「必须清零」，也不设「用户说像」。
- **不做什么**：不用门禁全绿代替视觉判断；不把用户拉来当裁判；不为像素无限返工。
- **被否替代**：被否替代：只看机器（漏视觉）、让用户当裁判（全自动流程不该）、必须清零（为像素无限返工）；代价是审查者要逐条判。
- **风险**：目视主观、易反复；缓解是把差异登记成可核清单，返工有收敛判据。
- **改动**：`skills/design-source-extraction/references/visual-review.md`。

### 工作包 7：协作与写入权

消费者：build-code 主会话

#### D-007 — 协作纪律落到 build-code 方法节，复用现有锁

- **做什么**：把协作规则写进 build-code 的方法节（消费者是 build-code 主会话）：一 worktree 一写者；生成物唯一写入者；共享文件冻结；读数只在树稳定后取；对已结束的子代理发消息等于让它重新开工，要先确认。共享文件的写权记录复用 `runtime/interface/record-lock.mjs`，Git 动作复用既有 `git-authorize`。
- **不做什么**：不新建第二套锁或写权账本；不让两个写手同时改共享文件。
- **被否替代**：被否替代：只靠口头约定（会撞）、新建第二套锁（重复控制面）、提交前才检查（发现太晚）；代价是共享文件要先冻结。
- **风险**：并发覆盖会整页崩；缓解是写集与唯一写者。
- **改动**：`workflows/build-code/SKILL.md` 方法节；`skills/design-source-extraction/references/collaboration.md`。

### 工作包 8：规范沉淀与流程加固

消费者：后续任务作者

#### D-008 — 规范沉淀成反模式清单与八步流程

- **做什么**：每条反模式按「现象→根因→哪道校验能抓→正确做法」四列写，只收真实发生且能被校验抓住的项；给新页面八步流程；写设计稿后续更新的同步流程；规范里的数字必须由命令产出、不写死，测试锚语义不锚行号；真实源组数回退写进决策日志，不只写在提交说明。
- **不做什么**：不收理论问题；不收没有门禁对应的条目（有则写明「暂无门禁」与 owner）。
- **被否替代**：被否替代：只写文档不接线（没人用）、只加检查器不改方法（执行者不知道）、把规范写进需求文档（会漂）；代价是要维护登记与契约测试。
- **风险**：清单变成大杂烩；缓解是每条绑定校验或写明缺口。
- **改动**：`skills/design-source-extraction/references/anti-patterns.md`、`skills/design-source-extraction/SKILL.md`。
## 每包交付什么，为什么这样定？

- **P1**：build-plan 有稿分支的判断项、三档结论与载体，build-prd 一句前置，build-code 前置检查。为什么：不在动手前判断，就会把「重做」当默认。
- **P2**：`skills/design-source-extraction/` 的移植方法、样式隔离、登记与生成器。为什么：方法散在项目里无法复用；现有提炼技能能被三个工作流共同调用。
- **P3**：数据分层、样例态、分档、状态纪律。为什么：移植最容易「看起来像、实际假」，必须把真假边界写死。
- **P4**：四类校验＋清单可信度＋环境绑定＋自证用例。为什么：没有机器检查，保真度只能靠人眼。
- **P5**：旧功能三链接线与回归。为什么：这次最大的返工来源就是「搬了壳没搬内容」。
- **P6**：并排截图、独立读者、差异登记与收敛判据。为什么：机器全绿但用户说「差距特别大」是真实发生过的。
- **P7**：协作规则、写权与清理，落点在 build-code。为什么：并发覆盖让整页崩过。
- **P9**：十格人话方案卡、至少一个被否替代、每条验收反例、独立冷读迭代、卡与台账分离。为什么：没有可读、可冷读的卡，收敛会退化成复述需求。
- **P8**：反模式清单、八步流程、三处引用与登记、契约测试、更新同步。为什么：方法不接线就没人调用。

## 验收面

所有 AC 都要有夹具、命令、退出码与执行主体。夹具目录：`tests/fixtures/design-port-sample/`（一个小设计稿：一个页面、一个按钮、一个演示数据源、一份 manifest）。

| 编号 | 验什么 | 判据与命令 | 执行主体 | 承接包 |
| --- | --- | --- | --- | --- |
| AC-001 | 判断可执行 | 设计稿固定从项目 `specs/design/prototypes/` 读取；夹具另含无旧页、不能用且缺下一步、不能用且缺负责人三种；后两种必须让 build-code 前置检查拒绝施工；用夹具设计稿走判断清单，产出 `judgment.md`；`node skills/design-source-extraction/scripts/check-judgment.mjs --input <judgment.md>` exit 0；字段含三链、六项判断、三档结论、下一步与负责人；夹具含三档各一个样例，三项以上不满足但可适配的样例必须判「改一改能用」 | 主会话 | P1 |
| AC-002 | 移植可逐行验证且样式闭合 | 纯拷贝件与源逐字节一致（只允许 import 行）；直接改过的每条在登记表有类型、原因、位置；未登记即红；`node skills/design-source-extraction/scripts/check-port-manifest.mjs` exit 0；移植件用到的类在生成物中 0 缺失；未使用的类不得进入生成物（注入未使用类必须 exit 1）；生成物重跑字节一致且手改文件保留 | 实施者 | P2 |
| AC-003 | 数据与状态可识别 | `node skills/design-source-extraction/scripts/check-data-discipline.mjs --fixture <d>` exit 0；真实源夹具覆盖加载、成功、空、错误、超时与写回执；样例三层标注可定位；读失败分档纯函数单测通过；样例模式写动作被拒；同一状态只有一个判定口；控件不降级；冲突项在裁定台账有行；真实数据模式下样例残留为 0；样例模式仍可独立存在且写动作被拒 | 实施者 | P3 |
| AC-004 | 四类校验可信 | 四类脚本在夹具上跑：`node skills/design-source-extraction/scripts/check-geometry.mjs --config <c>`、`check-dom-parity.mjs --config <c>`、`check-port-parity.mjs --config <c>`、`check-feature-keep.mjs --config <c>`；几何比计算样式（0.5px 容差）、结构比标签/类名/直接文本/层级、来源扫描未登记文件与未编译类、功能保留比选择器/文本/控件角色；每条有「故意改坏→exit 1、还原→exit 0」记录；出现跳过项时报告显式列「未验证」，该包只能带缺口收口、不能声称全部通过；跳过项的接受由 Phase 独立审查者确认，不接受则补验；读数带 HEAD 与后端身份 | 独立审查者 | P4 |
| AC-005 | 既有功能接线且回归通过 | `node skills/design-source-extraction/scripts/check-wiring.mjs --map <wiring.md>` exit 0；夹具断言旧接口收到预期参数、页面消费真实回执；断开处理器或接错接口必须失败；三链每项为「已接回」或「有理由的缺口」；出现「未接回」时必须有改旧功能的尝试记录与审查者确认；没有记录或确认即失败；旧钩子变更同步测试；受影响测试通过 | 实施者 | P5 |
| AC-006 | 目视对比与返工收敛 | 1440 截图与独立审查者记录在原件，记录含设计对、浏览器/字体/DPR 与差异分类；`check-visual-review.mjs --dir <d>` 校验差异表每行有结论；差异只能是「已修复」或「审查者接受及理由」；出现「未解决」即失败；不得以门禁全绿代替 | 独立审查者 | P6 |
| AC-007 | 协作与收口纪律可核 | `node skills/design-source-extraction/scripts/check-write-set.mjs --dir <d>` exit 0；写集与唯一写者记录由 `record-lock` 产生；`check-write-set.mjs` 校验共享文件只有一个写者；出现双写者即失败；临时文件与会话清理清单存在 | 独立读者 | P7 |
| AC-008 | 规范与接线可核 | `node tools/cli/check-skill-consistency.mjs`、`npx vitest run tests/contract`、`node tools/cli/verify-structure.mjs` 均 exit 0；三处引用可 grep 且端到端夹具有稿路径实际消费判断与移植产物、无稿路径不变；反模式每条有门禁列；设计稿更新同步流程存在；规范内数字均由命令产出（抽一条重跑核对）；测试无行号锚 | 主会话 | P8 |
| AC-009 | 流程缺口已加固 | `npx vitest run tests/contract/check-stage-steps.test.mjs tests/contract/convergence-card-contract.test.mjs` exit 0；make-decision 第 7 步写明「未派发外部模型不算审查，独立子代理不得顶替」；构造缺冷读的已收敛行必红、补齐后绿 | 主会话 | P8 |
| AC-010 | 逐包收敛可读可冷读 | `npx vitest run tests/contract/convergence-card-contract.test.mjs` exit 0（十格名、五问、刹车、十类不合格、十列形状、不新增步骤/轮次）；另用 P5 样例：独立读者只读卡能答五问，记录在 `convergence-cards.md` 与本包五行表 | 独立读者 | P9 |
| AC-011 | 阶段收口可核 | 交接按 stage-handoff 发布并读回；绝对路径存在且 task/stage 对得上；白话汇报与下一步在交接；不催下一阶段 | 主会话 | P8 |

### 验收命令表

| AC | 命令 | 退出码 | 执行主体 |
| --- | --- | --- | --- |
| `AC-001` | `node skills/design-source-extraction/scripts/check-judgment.mjs --input <judgment.md>` | 0 | 主会话 |
| `AC-002` | `node skills/design-source-extraction/scripts/check-port-manifest.mjs --manifest <m> --design-root <d>` | 0 | 实施者 |
| `AC-003` | `node skills/design-source-extraction/scripts/check-data-discipline.mjs --fixture <d>` | 0 | 实施者 |
| `AC-004` | `node skills/design-source-extraction/scripts/check-geometry.mjs --config <c>`；`check-dom-parity.mjs --config <c>`；`check-port-parity.mjs --config <c>`；`check-feature-keep.mjs --config <c>` | 每条 0；改坏 1 | 独立审查者 |
| `AC-005` | `node skills/design-source-extraction/scripts/check-wiring.mjs --map <wiring.md>` | 0 | 实施者 |
| `AC-006` | `node skills/design-source-extraction/scripts/check-visual-review.mjs --dir <d>` | 0 | 独立审查者 |
| `AC-007` | `node skills/design-source-extraction/scripts/check-write-set.mjs --dir <d>` | 0 | 独立审查者 |
| `AC-008` | `node tools/cli/check-skill-consistency.mjs`；`npx vitest run tests/contract`；`node tools/cli/verify-structure.mjs` | 均 0 | 主会话 |
| `AC-009` | `npx vitest run tests/contract/check-stage-steps.test.mjs tests/contract/convergence-card-contract.test.mjs` | 0 | 主会话 |
| `AC-010` | `npx vitest run tests/contract/convergence-card-contract.test.mjs` | 0 | 独立读者 |

### 工作包 1 怎么验收？

- 谁做、做多久：主会话＋实现子代理，预计 0.5 天。
- 靠什么资源：夹具设计稿与本仓现有 build-plan 正文。
- 范围只覆盖本包吗：只证「判断项、结论载体、下一步」，不证移植效果。
- 通过或不通过怎么观察：`check-judgment.mjs` exit 0 或非 0；缺字段会点名。
- 读者能不能照着做：独立读者只看判断清单，能说出「下一步为这个有稿项目做什么」。

### 验收编号怎么对到 spec

AC 编号与包号段在 build-plan 写 spec 时沿用，本阶段不重编号。

### 覆盖结论是什么？

见 `quality/evidence/decision-log-refs/coverage-matrix-5d.md`；断点按调研原件的 A–H 计，F（门禁盲区）由 P4、H（收口纪律）由 P7/P8 承接。

### 收口证据在哪？

任务库根 `quality/evidence/`：入口评估、四份调研、三段深挖、坑到包映射、两次链检查、方向审查与细节审查、确认原件；阶段收口后加 handoff。

## 方向审查处置

方向审查原件：`quality/evidence/direction-review/review.md`。执行者是独立子代理，未派发 wh-review provider；provider 记录未取得，结论是独立判断。

| finding | 严重度 | 处置 | 落点 |
| --- | --- | --- | --- |
| F-01 P7 无落点无消费者、未复用既有锁 | blocker | fixed | P7 落点改为 build-code 方法节；消费者写明；复用 record-lock 与 git-authorize；AC-007 |
| F-02 P1 三档结论与两份清单无载体、无停链门 | blocker | fixed | 结论写进 `spec.md`「设计稿套用结论」；不套用且无下一步时 build-code 拒绝进入；AC-001 |
| F-03 AC-002~007 无目标项目、无夹具 | blocker | fixed | 新增夹具 `tests/fixtures/design-port-sample/`；每条 AC 写命令与执行主体 |
| F-04 AC 缺命令与退出码 | high | fixed | 验收面表补命令、退出码、执行主体 |
| F-05 记录型 AC 可手写造假 | high | fixed | 记录落 JSON 并带哈希；独立读者复核；AC-004/006/007 |
| F-06 P2↔P8 登记验收环 | high | fixed | manifest 与生成器归 P2 唯一写入；P8 只跑校验脚本 |
| F-07 build-prd 入口不落地、build-code 无有稿分支 | high | fixed | build-prd 只记录；build-code 增加前置检查与条件分支；D-001 |
| F-08 无 104 坑→8 包映射 | high | fixed | 新增 `pitfall-to-package-map.md`，逐条映射并单列未覆盖项 |
| F-09 断点记成 5 条实为 A–H，F/H 未处置 | medium | fixed | 覆盖结论改为 A–H；F 归 P4、H 归 P7/P8 |
| F-10 AC-011 与 AC-008 不符、U-005 未进覆盖矩阵 | medium | fixed | AC 统一为 AC-001…008；覆盖矩阵补 U-005 |
| F-11 引用点未具名 | medium | fixed | 三处引用写死：build-plan 第 5 步、build-prd 记录节、build-code 前置检查 |
| F-12 AC-001 无具名案例 | medium | fixed | 夹具设计稿作具名案例 |
| F-13 生成器归属未定 | medium | fixed | P2 唯一写入 |
| F-14 不改母 PRD 无用户确认 | low | needs_human | 在 P8 收敛时问用户 |
| F-15 OI-01 影响 AC-004 可行性 | low | fixed | 脚本定为「通用脚本＋项目配置」，不内置浏览器探针 |
| F-16 审查包材料缺 3 位 | low | fixed | 审查包补齐 selection_rationale、alternatives、key_assumptions |
| F-17 P5 未声明读 P1 三链清单 | low | fixed | P5 依赖改为 P1／P2，并写明读三链清单 |

## 哪些文件由谁改？

| 路径 | 改什么 | 唯一写主 | 依赖 |
| --- | --- | --- | --- |
| `workflows/build-plan/SKILL.md` | 有稿分支加判断项、三档结论与载体 | P1 | 无 |
| `workflows/build-prd/SKILL.md` | 加一句有稿前置记录 | P1 | 无 |
| `workflows/build-code/SKILL.md` | 前置检查、条件分支、协作方法节 | P1／P7 | 无 |
| `workflows/make-decision/SKILL.md` | 第 7 步补「未派发外部模型不算审查」一句 | P8 | 无 |
| `workflows/make-decision/SKILL.md` | 第 9 步十格卡、人话规则、冷读迭代 | P9 | 无 |
| `skills/decision-log/templates/decision-log-template.md` | 方案卡模板与人话写法 | P9 | 无 |
| `quality/evidence/convergence/convergence-cards.md` | 每包十格卡与冷读记录 | P9 | 无 |
| `tools/cli/check-stage-steps.mjs` | 「已收敛」行要求冷读与证据标记 | P8 | 无 |
| `tests/contract/check-stage-steps.test.mjs` | 缺冷读必红、补齐后绿的自证用例 | P8 | 无 |
| `tests/contract/convergence-card-contract.test.mjs` | 十格名、五问、刹车、十类不合格、十列形状的机器校验 | P9 | 无 |
| `skills/design-source-extraction/SKILL.md` | 移植方法章节与八步流程 | P2 | P1 |
| `skills/design-source-extraction/references/port-method.md` | 移植、样式隔离、登记 | P2 | P1 |
| `skills/design-source-extraction/references/data-and-state.md` | 数据分层、分档、状态纪律 | P3 | P2 |
| `skills/design-source-extraction/references/verification.md` | 四类校验、清单可信度、环境绑定 | P4 | P2 |
| `skills/design-source-extraction/references/wiring.md` | 旧功能三链与回归 | P5 | P1／P2 |
| `skills/design-source-extraction/references/visual-review.md` | 并排截图与返工收敛 | P6 | P4 |
| `skills/design-source-extraction/references/collaboration.md` | 单写者、生成物、冻结、清理 | P7 | 无 |
| `skills/design-source-extraction/references/anti-patterns.md` | 反模式清单与更新同步 | P8 | 全部 |
| `skills/design-source-extraction/scripts/*` | 各包自己的校验脚本：P1 check-judgment；P2 check-port-manifest；P3 check-data-discipline；P4 四类检查；P5 check-wiring；P6 check-visual-review；P7 check-write-set | 对应包 | P2 |
| `tests/fixtures/design-port-sample/*` | 夹具设计稿与 manifest | P4 | P2 |
| `skills/catalog.yaml`、`skills/reuse-registry.md` | 更新现有提炼技能的描述与复用登记 | P8 | P2 |
| `docs/architecture/move-map.json` | 登记职责与消费者 | P8 | P2 |
| `skills/*/skill-deps.yaml` | 依赖声明 | P8 | P2 |
| `tests/contract/convergence-card-contract.test.mjs` | 十格卡合同测试 | P9 | 无 |
| `tests/contract/*`（除上一行） | 技能一致性与编号不变的契约测试 | P8 | P2 |

共享文件（catalog、reuse-registry、move-map、skill-deps、tests）统一由 P8 串行写，其他包只读。

## 这次覆盖什么，排除什么？

**覆盖**：WorkflowHub 的有稿判断、移植方法、数据与状态、四类校验、既有功能接线、目视收敛、协作纪律、规范沉淀。

**排除**：

- 修改 PaperBuilder 仓库或重跑它的门禁（只作经验来源）。
- 发布安装包、改 marketplace。
- 修改母 PRD 的卡片清单（待 P8 收敛时与用户确认）。
- 为任意框架造通用移植器；脚本只按配置工作。

## 交付声明

- **本任务声明要做交付**：交付形态为提交任务分支、创建 PR、合并到 main、归档并推送、清理任务分支。
- **声明人**：主会话（session-6c49f0e8-5ee9-4abd-aa58-f6971450589e）。
- **依据**：用户 2026-11-16 在本次会话中明确要求本任务交付包含提交、合并、归档、推送、PR 与清理。
- **当前时点**：尚未到交付时点；提交、PR 与合并尚未发生，交付声明先立，交付事实在交付发生时再补原件。

## 还有什么没定，谁来定？

- `OI-04`：已定——只截 1440；由独立审查者判，不要求用户当裁判。
- `OI-05`：已定——不改母 PRD；只在本任务材料里记录，不扩范围。
- `OI-06`：已定——反模式清单放现有提炼技能的 `references/anti-patterns.md`，由 build-code 方法节与 norm-sync 引用。

## 什么风险交给谁？

- **技能目录膨胀**：新增技能会让目录更重；缓解是明确职责边界与删除条件。承担者：维护者。
- **脚本依赖项目环境**：没有 Node 的项目用不上；缓解是给出降级路径（人工对照清单）。承担者：P4。
- **提炼与移植耦合**：两者并进 `design-source-extraction`；边界写死「提炼产出资产、移植消费资产并落地」。承担者：P2。
- **步骤编号被测试钉死**：不改编号。承担者：P8。
- **门禁假绿**：四类门禁都被证明过会假绿；缓解是负向自证与独立读者复核。承担者：P4。
- **目视返工无底**：没有收敛判据会无限返工；缓解是差异登记与「机器全绿≠视觉通过」分开判。承担者：P6。
- **多写手并发**：共享生成物被覆盖会让整页崩；缓解是一树一写者与冻结。承担者：P7。

### 质量边界

本阶段不涉及高风险用户可见事项（无权限、无安全、无不可逆动作）。最高风险是流程改动影响后续所有有稿任务，因此方向审查与逐包收敛必须真实执行。

## 什么已经退出？

本任务无退役对象。

## 大纲地图

- 任务身份：这是什么任务？
- 级别与路线：走哪条路线？
- 原始需求：要解决什么？
- UI 范围与设计基准：页面与设计源是什么？
- 一共分几个包，每个包是什么？
- 每个包定了哪些决定？
- 每包交付什么，为什么这样定？
- 验收面
- 方向审查处置
- 哪些文件由谁改？
- 这次覆盖什么，排除什么？
- 还有什么没定，谁来定？
- 什么风险交给谁？
- 什么已经退出？
- 外置事实索引

## 端到端接线

| 环节 | 触发 | 生产者 | 产物 | 消费者 | 读不到时 |
| --- | --- | --- | --- | --- | --- |
| build-prd 选有稿 | 任务书出现设计稿 | build-prd 作者 | 决策日志「UI 范围与设计基准」一行 | build-plan 主会话 | 记「设计源未定」并停该分支 |
| build-plan 判断 | 进入有稿分支 | build-plan 主会话 | `spec.md`「设计稿套用结论」＋判断文件 | build-code 主会话 | 缺结论时 build-code 拒绝进入 |
| build-code 取用 | 开工前 | build-code 主会话 | 读取结论与三链清单 | 实施者 | 结论为「不能用」且无下一步时停止 |
| 移植实施 | 结论为「可直接套用／改一改能用」 | 实施者 | 移植件、manifest、样式生成物 | P4 校验、P5 接线 | 未登记即红 |
| 校验 | 移植完成 | P4 脚本 | 四类报告＋负向自证记录 | P6 目视、审查者 | 脚本红即失败；缺配置/环境不可用记未验证或不可用，由审查者确认 |
| 目视 | 校验通过 | P6 独立审查者 | 并排截图＋差异表 | 独立审查者判定 | 缺截图即失败 |
| 沉淀 | 收口前 | P8 | 反模式、八步流程、登记、契约测试 | 后续任务作者 | 缺一条即未完成 |

## 工具与降级

- 校验脚本支持 Node ≥20；项目侧必须提供最小配置：设计稿根目录、移植目录、manifest 路径、作用域选择器、几何探针、DOM 对照对、功能保留清单。
- 三种状态必须分开，不混用：
  - 缺配置项：跳过该项，报告写 `unverified`，整体 exit 0；Phase 审查者确认接受，不能声称全部通过。
  - 环境不可用（没有 Node、没有浏览器）：该项写 `unavailable`，整体 exit 0；报告列出原因，Phase 审查者确认接受。
  - 脚本错或断言红：exit 1，Phase 失败，不许跳过。
- 项目没有 Node 或没有可运行设计稿时，退回人工对照清单，并在结论里写明「脚本未执行」，不算通过。
- 工具化比对可用无头浏览器取计算样式；验收档位仍走既有浏览器验收方法（ego-lite），两者分工写进方法正文，不混用。

## 适配层边界

- 设计稿源只读；自动生成的样式不手改（手改走单独文件并登记）；移植件本身允许直接改，但每处改动必须登记。
- 旧功能接线通过外层适配组件完成：在移植件外包一层容器，把旧 API、旧状态、旧 DOM 钩子接到移植件的 props 上；适配层单独登记，不写进移植件。
- 设计稿内含硬编码演示数据或内部事件时，允许直接改移植件：把数据改成 props 或项目数据源、把事件接到旧接口，每处改动必须在登记表写类型、原因、位置；不改设计稿源。

## 回退与里程碑

- 回退判据：新链路误报、旧流程被破坏、或移植失败时，停用新增引用即可回到原「有稿重做」路径；新增文件可整体移除，旧 build-plan 步骤不加删除线。
- 回退责任：build-code 主会话执行停用；P8 负责移除登记；目标项目删除生成物后按旧流程重做。
- 里程碑：M1＝P9＋P1＋P2（收敛方法、判断、移植）；M2＝P3＋P5（数据与接线）；M3＝P4（四类校验）；M4＝P6＋P7＋P8（目视、协作、沉淀）。每个里程碑可独立停。

## P7 用现有锁的能力与失败处置

- 复用 `runtime/interface/record-lock.mjs` 的任务根锁与记录锁；共享源码与生成物写前必须持锁，锁不覆盖的写入即失败；写集记录只是证据，不替代实际加锁。
- 锁获取失败：停止写入，报告持锁者与等待原因，不重试覆盖。
- 写者中断：保留已写字节，重新取数前先确认树稳定。
- 违规写入：按现有记录锁失败事实处理，不静默回滚。

## P8 反模式与数字纪律

- 反模式清单位置：`skills/design-source-extraction/references/anti-patterns.md`；由 build-code 方法节与 norm-sync 引用，保证全局可见。
- 规范里的数字必须由命令产出；写「某日实测」并给命令，不写死。
- 测试锚语义不锚行号；行号变化不使测试红。
- 真实源组数回退写进决策日志，不只写在提交说明。

## 正式方向审查处置（2026-11-15）

正式审查原件：`quality/reviews/2026-11-15-007-make-decision-direction.json`；三路 provider 均 completed，findings 36 条，0 条 blocking。按主题归组处置：

| 组 | 涉及 finding 主题 | 处置 | 落点 |
| --- | --- | --- | --- |
| G1 | 104 条坑无逐条映射 | fixed | `quality/evidence/pitfall-to-package-map.md`（接住 81、只沾边 16、未覆盖 7，未覆盖项已并入 P1/P3/P7/P8） |
| G2 | 缺端到端接线表 | fixed | 「端到端接线」节 |
| G3 | 原始需求与 AC 未映射、验收无失败出口 | fixed | 「原始需求到验收」表；AC-005/006/007 增加失败即失败判据 |
| G4 | 脚本运行环境、探针、浏览器分工未定 | fixed | 「工具与降级」节 |
| G5 | P7 假定 record-lock 足够、无失败处置 | fixed | 「P7 用现有锁的能力与失败处置」节 |
| G6 | P8 反模式无载体 | fixed | 「P8 反模式与数字纪律」节 |
| G7 | P2 与 P5 缺适配层 | fixed | 「适配层边界」节 |
| G8 | P1 不可用分支悬空 | fixed | D-001：两条路都列、当场选、写负责人；缺则拒绝开工 |
| G9 | P3 未被 P4／P6 消费 | fixed | 依赖拓扑改为 P4←P2/P3/P5，P6←P3/P4/P5 |
| G10 | P4 功能保留未依赖 P5 | fixed | 同上 |
| G11 | P6 视口、读者、收敛阈值未定 | needs_human | 在 P6 收敛时问用户 |
| G12 | 无回退、无中间里程碑 | fixed | 「回退与里程碑」节 |
| G13 | P2 未与「扩展现有技能」比较 | fixed | D-002：选扩展现有提炼技能，不新建；代价是提炼与移植耦合，边界写死 |
| G14 | P1 三档无判据与反例 | fixed | D-001 三档判据＋夹具三档样例 |
| G15 | P3 无真实源夹具、演示数据残留 | fixed | AC-003 增加真实源夹具（成功／空／错误／超时）与演示数据扫描 |
| G16 | P4 配置契约与缺配置行为未定 | fixed | 「工具与降级」：最小配置七项，缺项跳过并记录，审查者确认 |
| G17 | P8 只靠 grep，不能证明链路生效 | fixed | AC-008 增加端到端夹具：从有稿选择→判断→施工→校验；无稿路径不变 |
| G18 | 验收允许「记录了但没做」通过 | fixed | AC-005/006/007 失败出口；P6 未解决差异不得收口 |
| G19 | 适配例子缺失 | fixed | 「适配层边界」含硬编码演示数据与内部事件的例子 |
| G20 | P7 中断恢复未写 | fixed | 「P7 用现有锁的能力与失败处置」 |
| G21 | 工具化比对与 ego-lite 冲突 | fixed | 「工具与降级」：比对用无头浏览器，验收走既有浏览器验收 |
| G22 | 原 AC-001…AC-011 对照缺失 | fixed | 下方「原始需求到验收」表 |

## 原始需求到验收

| 需求 | 验收 |
| --- | --- |
| R-001 读 PRD 找流程遗漏 | 调研原件 `prd-gap-inventory.md`；无独立 AC |
| R-002 从会话提炼经验 | `port-practice-extraction.md`、`session-mine-1/2/3.md`；无独立 AC |
| R-003 有稿先判断、避免重做 | AC-001、AC-002 |
| R-004 验证、对比、数据、规范沉淀 | AC-003、AC-004、AC-005、AC-006、AC-007、AC-008 |
| R-005 按标准建 worktree | 分支与 bootstrap 原件；过程约束 |
| R-006 完整 todo 并执行 | 主会话 todo；过程约束 |
| R-007 变更完全可验证 | AC-001…AC-011 均有命令或可观察原件 |
| R-008 主会话不大量阅读 | 子代理派发与回传原件；过程约束 |
| R-009 骨架、方向审、逐包收敛后再细节审查 | AC-010 |
| R-010 停下汇报并给 handoff 路径 | AC-011 |
| R-011 白话沟通、提问用工具 | Talk 批次原件；过程约束 |
| R-012 不用黑话与内部编号 | 用户可见输出；过程约束 |
| U-001 只看本仓调研 | 九包调研判断；P1…P9 |
| U-002 流程＋可执行校验 | AC-004、AC-008、AC-009 |
| U-003 按会话实现阶段重核再定包 | 三份 `session-mine-*.md`；包划分 5→9 |
| U-004 不能用时写下一步与负责人 | AC-001 |
| U-005 八包骨架确认 | 决策日志过程记录；Talk 3 |
| U-006 重做逐包收敛并加固两个流程缺口 | AC-009、AC-010 |
| U-007 设计稿固定放 `specs/design/prototypes/` | AC-001、AC-002 |
| U-008 加第 9 包、先改 make-decision 再重做 P5 | AC-010；Talk 10 |

## 逐包收敛执行校正（2026-11-15）

用户指出：逐包收敛仍是「问几个选择题＋补一张卡」，没有按第 9 步执行。核对后确认三个根因：

1. **收敛台账格式不符合机器合同**：第一列用了 `P1…P8` 和散文，检查器只认数字包号行；字段格必须引用 `D-00x`／`AC-00x`／`WPn`／`OI-xx`，散文不算证据。
2. **决策日志没有 `工作包 N` 小节**：检查器从这些小节取权威模块集合；没有小节就得到空集合，收敛台账再全也读不到。
3. **没有在声称收敛前跑 `check-stage-steps`**：把「问过用户」当成「已收敛」，没有让检查器逐包核对。

已做的校正：

- 决策日志改为 8 个 `### 工作包 N：名称` 小节，每节含 `消费者：` 行与 `#### D-00x — 标题` 决定正文。
- 收敛台账改为数字包号行，字段格引用 `D-00x`／`AC-00x`／`WPn`；状态列按真实进度写。
- 后续按新标准重做 P5～P9：九包十格卡、逐包冷读、逐包用户确认、调研判断齐备；检查器已读到 9 个模块，`complete=true，gaps=[]`。
- 后续不再以「问过问题」声称收敛；每包必须有五类分析、五行表、8 项证据、十格卡、冷读记录，检查器读到该模块后才写「已收敛」。

## 细节审查处置（2026-11-15）

正式审查原件：`quality/reviews/2026-11-15-011-make-decision-detail.json`；三路 provider completed，findings 21 条，1 条 blocking。逐组处置：

| 组 | 问题 | 处置 | 落点 |
| --- | --- | --- | --- |
| D1 | 阻断：材料仍写 P5 待确认、P6～P8 未做 | fixed | 「逐包收敛执行校正」改为九包已确认、检查器 `complete=true` |
| D2 | P2 技能归属与只读/直改矛盾 | fixed | D-002 改为并进现有提炼技能、直接改并逐处登记；AC-002 同步 |
| D3 | P4 缺配置跳过 vs 失败矛盾 | fixed | AC-004 统一为「跳过列未验证、审查者确认、不得称全部通过」 |
| D4 | P5 缺口 vs 只有已接回矛盾 | fixed | AC-005 统一为「已接回或有理由缺口＋改旧功能尝试记录＋审查者确认」 |
| D5 | 投影键 1～9 与包号错位 | fixed | 重建 projection.json / projection.md，键 1～9 对应 P1～P9 |
| D6 | 覆盖矩阵缺 P9、AC-009/010、U-006/7/8 | fixed | 覆盖矩阵补齐 |
| D7 | P1 三项以上可修复时无结论 | fixed | D-001 加硬条件优先；AC-001 加三档样例与多不满足反例 |
| D8 | 脚本全归 P4 形成验收环 | fixed | 各包自己的校验脚本归对应包；P4 只保留四类检查 |
| D9 | 端到端仍写用户最终判断 | fixed | 改为独立审查者判定 |
| D10 | P2/P5 硬编码数据无法替换 | fixed | D-002 明确允许直接改移植件，逐处登记；不改设计稿源 |
| D11 | AC-001/003/008 缺具体场景 | fixed | 补三档样例、真实源成功/空/错/超时、端到端有稿/无稿路径 |
| D12 | 需求索引缺 U-006 与定位 | fixed（部分） | 补 U-006；逐字原话在需求索引第一节，Talk 原件按批次存放；hash 级定位留 build-plan 补 |
| D13 | 里程碑 M1 含依赖未满足的 P4 | fixed | M1＝P9＋P1＋P2；M2＝P3＋P5；M3＝P4；M4＝P6＋P7＋P8 |

未重派审查：范围未变，按 make-decision「未变范围不为追空 findings 重派」处理；修复后由收口前核对与最终确认复核。

## 工作包分诊与 grill 读回（第 8、11 步）

### 分诊

九个工作包都写一到三句范围，按已有风险、优先级与入口事实分诊如下：

| 包 | 复杂度 | 先补调研还是直接收敛 | 理由 |
| --- | --- | --- | --- |
| P9 逐包收敛质量 | 复杂 | 先补调研 | 参照任务的标准要读原卡与三轮冷读 |
| P1 判断与边界 | 复杂 | 补内部调研 | 三档判据要结合 PRD 缺口与会话判断类坑 |
| P2 移植与样式 | 复杂 | 补内部调研 | 要核现有提炼技能与会话移植实践 |
| P3 数据与状态 | 复杂 | 补内部调研 | 缺源与读失败的分档有口径冲突 |
| P4 校验与验收 | 复杂 | 补内部调研 | 四类门禁假绿事实要先读 |
| P5 既有功能接线 | 复杂 | 补内部调研 | 65 区块审计与旧钩子事实要先读 |
| P6 目视对比 | 中等 | 直接收敛 | 只截 1440，审查者判，规则简单 |
| P7 协作与写入权 | 简单 | 直接收敛 | 复用现有记录锁与 Git 授权，无新机制 |
| P9 逐包收敛质量 | 每包十格人话卡、调研判断、talk 真问答、独立冷读迭代、刹车判据；先做 | 无（先执行） |
| P8 规范沉淀 | 复杂 | 补内部调研 | 104 条坑、登记与契约测试要逐项接 |

- 承诺的独立可交付验收单元数：9。
- 是否含需要用户在场或真实凭证的动作：否；只有最终确认需要用户答复。
- 入口评估真实返回：`paused`，`expanded_risks=["major_architecture"]`，`choices=["shrink-scope","create-ordinary-five-stage-task"]`；拆分路线「只做 P1」已记录在更小可逆选项。
- 分诊不改变已确认骨架顺序；P9 先做，其余按依赖走。

### Grill 与领域读回

- 进入逐包收敛前的 grill 检查：方向、范围、验收三项都有真实答复（骨架、调研范围、交付深度、逐包确认），无新问题。
- 领域读回：`设计源` 已在 GLOSSARY 第 158 行定义；`有稿/无稿` 是 build-plan 既有用词，不新造；`移植件`、`样例态`、`已收敛` 是本方法内部工作词，在 `skills/design-source-extraction/SKILL.md` 与决策日志就地解释，不升为跨项目领域词。
- 结论：无 GLOSSARY 变更；无新 ADR（D-001…D-009 已覆盖，不另立架构决定）。

## Spec-analyze 核对（第 13 步）

- 链检查：`check-decision-log-chain` 对需求索引、覆盖矩阵各跑一次，均 exit 0；只有一条「需求索引无 decision 条目」的 advisory，该文件本来只放需求与来源，不含决定。
- 材料检查：`run-checks --material-root ... --stage=make-decision` exit 0；材料结构错误 0；本阶段未要求 spec.md/phases，不判阶段完成。
- 一致性核对（决定 vs 用户答复）：
  - P1 逐案定、结论写实施规格、不能用两条路都列、用户说等确认只读 → D-001／AC-001。
  - P2 并进现有提炼技能、直接改移植件、手改走单独文件并登记 → D-002／AC-002。
  - P3 默认真实、无源才样例、读失败只报缺、冲突台账、真实接通删样例 → D-003／AC-003。
  - P4 七项配置、缺项跳过并记录、审查者接受、无头取样式 → D-004／AC-004。
  - P5 先改旧功能联调、真改不动才缺口、钩子同步测试、受影响测试 → D-006／AC-005。
  - P6 只截 1440、独立审查者判、修好或书面接受、不设用户裁判与清零 → D-005／AC-006。
  - P7 复用现有锁、共享文件冻结、稳定取数、收尾清理 → D-007／AC-007。
  - P8 反模式、八步流程、三处引用、登记、契约测试、更新同步、两个流程缺口 → D-008／AC-008、AC-009。
  - P9 十格卡、调研判断、talk-with-zhipeng、冷读迭代、不新增步骤或轮次 → D-009／AC-010。
- 结论：未发现决定与用户答复不一致；advisory 不影响方向、范围或验收；不改变级别与路线。

## 第二轮细节审查处置（2026-11-15）

原件：`quality/reviews/2026-11-15-015-make-decision-detail.json`；三路 completed，findings 26，1 条 blocking。按主题处置：

| 组 | 问题 | 处置 | 落点 |
| --- | --- | --- | --- |
| E1 | 阻断：需求索引无逐条原文 ref+sha 与答复位置；U-006 只映射 P9 | fixed | 需求索引第六节补 ref+sha 表；覆盖矩阵 U-006 映射 P8/P9 |
| E2 | P2 仍有「新建技能」残留 | fixed | 全文统一为扩展现有提炼技能；G13 改为选现有技能 |
| E3 | P4 缺配置、环境不可用、脚本失败三种状态混用 | fixed | 「工具与降级」三种状态分列；AC-004 同步 |
| E4 | P5 缺口由审查者确认可能放过旧功能丢失 | accepted_risk | 用户明确全自动、不要本人拍板；保留「先改旧功能、真改不动才具名缺口＋审查者确认」，缺口逐项列出 |
| E5 | 投影 source_ref 指向不存在的路径 | fixed | 统一为 `quality/evidence/convergence/convergence-cards.md` |
| E6 | 覆盖矩阵漏 P5/P7；R→AC 表缺 AC-002/005/007/009/010 | fixed | 覆盖矩阵与需求到验收表补齐 |
| E7 | OI-04/05/06 仍未闭环 | fixed | 三条均已给结论 |
| E8 | 决策正文缺被否替代 | fixed | D-001～D-008 各补一条被否替代与代价 |
| E9 | AC 缺完整命令与夹具 | fixed | 新增「验收命令表」；AC-001/002/003/004/005/006/007/008/009/010 均有命令与退出码 |
| E10 | P6 缺设计对、环境身份、差异判据 | fixed | AC-006 补设计对、浏览器/字体/DPR、差异分类 |
| E11 | P7 写者中断无接管规则 | fixed | 半成品隔离、不得进校验、接管者重新生成或废弃 |
| E12 | P9 刹车与十类不合格未在 D-009 定义 | fixed | D-009 引用方法正文并写明刹车与十类；AC-010 同步 |
| E13 | 方案卡、冷读、用户确认原件未对齐 | fixed | 卡与冷读在 `quality/evidence/convergence/`；确认在 `talk/` 与决策日志过程记录 |
| E14 | P1 无旧页、缺下一步、缺负责人无夹具 | fixed | AC-001 增加三种夹具与前两种必须拒绝施工 |
| E15 | P2 未使用类可能被全量编译 | fixed | AC-002 增加未使用类不得进生成物、注入必须 exit 1 |
| E16 | P3 样例残留未限定模式 | fixed | 真实数据模式样例残留 0；样例模式独立存在且写被拒 |

未重派第三轮：第二轮修复后范围未变；第三轮由用户明确要求后单独派发。

## 外置事实索引

基准目录：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-design-port-flow-20261115`。

- 确认原件：回读任务库根 `quality/evidence/human-confirmations/` 的唯一 ref。
- 需求索引：`quality/evidence/decision-log-refs/requirement-index.md`
- 覆盖矩阵：`quality/evidence/decision-log-refs/coverage-matrix-5d.md`
- 逐包收敛台账：`quality/evidence/decision-log-refs/2026-11-15-005-convergence-checklist.md`
- 逐包方案卡：`quality/evidence/convergence/2026-11-15-005-convergence-cards.md`
- Talk 批次：`quality/evidence/decision-log-refs/talk/`
- 入口评估返回：`quality/evidence/entry-evaluation-return.json`
- 调研原件：`quality/evidence/prd-gap-inventory.md`、`workflow-step-inventory.md`、`port-practice-extraction.md`、`stage-material-requirements.md`
- 会话深挖原件：`quality/evidence/session-mine-1.md`、`session-mine-2.md`、`session-mine-3.md`
- 坑到包映射：`quality/evidence/pitfall-to-package-map.md`（104 条：接住 81、只沾边 16、未覆盖 7）
- 坑到包映射：`quality/evidence/pitfall-to-package-map.md`
- 方向审查：`quality/evidence/direction-review/review.md`
- 细节审查：`quality/evidence/detail-review/`
- 步骤证据清单指针：`workflows/make-decision/steps.json`

旧编号对照：本任务无旧编号。
