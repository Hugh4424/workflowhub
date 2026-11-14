# 功能规格：UI 与前端能力接入四个阶段

本文件写给九个 Phase 的作者、写代码阶段的开发者、独立测试者与独立审查者。
读完要能找到每条需求落在哪个 Phase、怎样验收、失败回哪里修。

> 写作标准：`skills/material-writing/SKILL.md` 的「材料写作标准（唯一）」。
> 例外：`## 实现设计（全局权威）` 与其四个小节名、「验收对象」机器标题按原合同逐字保留。
> 档位八值只引 `runtime/evidence/acceptance-evidence-validator.mjs` 的 `ACCEPTANCE_RESULTS`。

本文件承载产品行为与全局实现设计；Phase 文件只写各段差异，索引只存指针。
产品目标与裁决的权威是决策记录，本文件只给指针，不重写第二份目标。

## 这是什么，给谁用？

这是把上一轮已交付的十一项 UI 与前端能力真正接进四个阶段的规格。
四个阶段指定方向（make-decision）、写需求（build-prd）、排阶段（build-plan）、写代码（build-code）。

- **功能名**：UI 与前端能力接入四个阶段
- **任务**：workflowhub-ui-frontend-stage-integration-20261113
- **工作区**：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-stage-integration-20261113`
- **基线提交**：`998614bd`
- **来源**：决策记录 `specs/workflowhub-ui-frontend-stage-integration-20261113/decision-log.md`
  与九包收敛卡、规格澄清答复、分段大纲答复（路径见「补充材料与术语在哪里？」）。
- **状态**：草稿，待排阶段审查与用户计划确认。

## 一页看懂：谁要什么结果，怎么算通过？

含页面的任务在四个阶段都会被认出、被要求、被验收；不含页面的任务照原样走。

- **需求 1**：定方向时认出 UI，问清设计稿从哪来，留下页面范围与验收基准。
- **需求 2**：写需求时排出设计任务、前端底座、逐任务接线与页面数据清单。
- **需求 3**：排阶段时，碰页面的 Phase 写六项 UI 验收和独立设计审查。
- **需求 4**：写代码时按两个固定尺寸截图对照设计稿，记前端质量与组件沉淀。
- **需求 5**：审查在 UI 材料上多问六件事，记清读了什么、看了哪些页面。
- **需求 6**：上一轮缺口修复（下称 C11）的修好文件进仓库，页面能打开、指纹对得上。
- **需求 7**：一张能力清单写清十一项能力在哪个阶段用、怎么验、什么状态。
- **需求 8**：用真实页面真跑写代码与审查两个入口，六组故意破坏都被对应位置拦住。
- **需求 9**：逐包收敛写成能冷读的十格方案卡。
- **最大影响面**：四个阶段的方法文件与审查方法；所有含 UI 的后续任务。
- **验收信号**：Appendix A 的十二条验收，每条标出承接的 Phase。
- **非目标**：不新增阶段、检查门或审查轮；不重做产品设计；不承诺像素完全一致。

本文术语首现解释：
Phase 是一个能单独交付、单独验收的工作段。
指纹指文件的 sha256 哈希值，改一个字节就会变。
接线指上游产出被下游真实读取，假数据换成真数据、假动作换成真动作。
冷读指没参与写作的人只读材料，回答固定问题。
写集即 Phase 正文里的“写入集”，两词同义，指这一段允许改的文件清单。
超过 80 字的行都含完整路径或整条命令，按写作标准第 5 条的命令例外保原字节，不折断。
UI 指用户看得见、能操作的页面与界面；PRD 指写需求阶段产出的产品需求文档。
RED 指改动前先跑、具名断言失败的测试结果；GREEN 指改完后同一测试通过。
LCP、CLS、INP 是三项页面性能读数：主内容出现耗时、布局跳动量、交互响应耗时。
AGENTS 指仓库根的 `AGENTS.md` 规则文件；OK、FAILED 是 `shasum -c` 每行的原样输出。

## 为什么做，给谁用？

十一项能力都在仓库里，但四个阶段的方法没有在该用的时点调用它们。
用户原话是“所有能力都没有正确接入”“完全是空中楼阁”（原始消息第 6、10 行）。

### 需求 1：定方向要认出 UI 并问设计稿

现在定方向第 1 步只有一句“按三个来源识别 UI”，什么也不留下。
也不问设计稿来源，细节审查不查 UI 需求与设计稿是否收敛。
来源是原始消息第 7 行，决定 1–3（决策记录「工作包 1」节）。

### 需求 2：写需求要排 UI 任务链

现在写需求只有一句“涉及 UI 用现有方法展示设计”，验收只写“页面能用”。
来源是原始消息第 11 行，决定 4（决策记录「工作包 2」节）。

### 需求 3：排阶段的 UI Phase 要有 UI 验收

现在阶段验收只写功能；三项 UI 事实缺一项就不加设计审查；组件没有回写位置。
第 5 步“要不要用户答复”的标记与正文不一致。
来源是原始消息第 8 行，决定 5（决策记录「工作包 3」节）。

### 需求 4：写代码要对照设计稿并记前端质量

现在页面审计只看结构与无障碍，不拿设计稿逐项对照，没有截图与差异。
来源是原始消息第 9 行与变更 4，决定 6（决策记录「工作包 4」节）。

### 需求 5：审查要用上 UI 能力

现在审查方法没有 UI 问题，代码审查没有设计角度，记录不写看没看页面。
来源是原始消息第 12 行，决定 7（决策记录「工作包 5」节）。

### 需求 6：C11 修复要进仓库

C11 修好的文件只在两个不受版本控制的文件夹里。
需求 6 对功能需求 FR-006，由验收 6 判，落第 8 段。
来源是原始消息第 6、10 行与变更 3，决定 8（决策记录「工作包 6」节）。

### 需求 7：能力和阶段的对应要一眼看得出

十一项能力在哪个阶段用、怎么验、什么状态，现在没人一眼看得出。
需求 7 对功能需求 FR-007，由验收 7 与验收 11 判，落第 1 段与第 9 段任务 4（编号 T016）。
来源是原始消息第 6、13 行，决定 9（决策记录「工作包 7」节）。

### 需求 8：改了方法要证明真到页面能跑

前面各段只改方法，没证明真到页面能跑。
需求 8 对功能需求 FR-008，由验收 8 判，落第 9 段任务 1、2（编号 T013、T014）。
来源是原始消息第 10、13 行，决定 10（决策记录「工作包 8」节）。

### 需求 9：逐包收敛要写清方案

现在逐包收敛只复述需求、满篇黑话。
来源是原始消息补充第 23、25 行，决定 11（决策记录「工作包 9」节）。

### 背景是什么？

用户已确认方向与九个工作包（下称包），并同意分九个 Phase 实施。
用户还同意顺手修基线已失败的一条老测试，见分段大纲答复第 22–27 行。

## 做成什么样？

UI 任务在每个阶段多出一小段只在 UI 时出现的内容；非 UI 任务一字不多。
每条验收的判据只在 Appendix A，正文只写场景与落点。

### 用户旅程：一个含页面的任务怎么走完四个阶段？

场景 1：用户提出改一个页面。
定方向第 1 步按三个来源判为 UI，写五行卡，并在第一次提问里问设计稿来源。
三个来源是原始要求里的页面或交互、项目真实路由与组件、已接受计划或实际前端改动。
五行卡是：是不是 UI 与依据；页面、路由、组件；设计源与提供者和可用时间；
验收基准；缺什么与风险。
设计源四路是内部设计稿、外部设计稿、沿用现有页面、无稿；无稿必须用户自己选。

场景 2：写需求读五行卡，排出设计任务（需要时）与前端底座（跨多页或多任务时）。
前端底座指先用样例数据与统一数据接口把界面撑起来。
每个 UI 任务写接线、视觉、组件三段；PRD 作者另写一张页面数据清单。

场景 3：排阶段给碰页面、路由、组件或样式的 Phase 写六项 UI 验收。
六项是设计源、页面路由组件与状态乘视口、视觉对照项、前端质量、
组件复用与沉淀、独立设计审查与证据。

场景 4：写代码按 1440×900 与 390×844 两个尺寸截图，与设计稿并排逐项对照。
逐项写通过、差异或用户接受的偏差；偏差由用户确认，不由实现者自签。
组件沉淀写回目标项目自己的组件规范。

场景 5：各阶段审查对 UI 材料问六件事，代码审查多一个设计镜头。

### 状态与异常：缺东西时怎么走？

- 三个来源都缺：记“未知”加负责人，不默认非 UI。
- 设计源缺失：记可用时间与卡点，不写“已具备”；细节审查必须报缺。
- 无稿直接做：必须有用户接受风险的答复。
- 三项 UI 事实缺一项但 Phase 碰页面：仍加设计审查。
- 测不到的前端质量项（如物理读屏）：记不可用、负责人与恢复条件，不写通过。
- 审查看不到页面：截图只支持视觉对照；交互、无障碍、性能、控制台、接线
  必须有真实运行证据，否则记未读或不可用。
- 历史材料缺新 UI 字段：按“未知”补问，不追判旧任务失败。

### 非 UI 任务怎样保持不变？

非 UI 任务不多一个步骤、一个问题、一个审查镜头、一个必填字段。
这条在每个阶段的验收里各有一个反例，最后在演练里再整体证一次（验收 12）。

### 每条验收落在哪里？

| 验收 | 场景 | 承接 Phase |
| --- | --- | --- |
| 验收 1 | 定方向 UI 支路 | 第 3 段 |
| 验收 2 | 写需求 UI 任务链 | 第 4 段 |
| 验收 3 | 排阶段 UI 验收 | 第 5 段 |
| 验收 4 | 写代码截图对照与前端质量 | 第 6 段 |
| 验收 5 | 审查 UI 六问与设计镜头 | 第 7 段 |
| 验收 6 | C11 修复入库 | 第 8 段 |
| 验收 7 | 能力清单与漂移映射 | 第 1 段 |
| 验收 8 | 两入口真实演练与六组破坏 | 第 9 段 |
| 验收 9 | 逐包收敛方案卡 | 第 2 段 |
| 验收 10 | 修基线红测 | 第 2 段 |
| 验收 11 | 能力清单抽样对账 | 第 9 段 |
| 验收 12 | 非 UI 任务零额外动作 | 第 9 段 |

## 打算怎么做？

只在现有四个阶段的方法文件、审查方法和模板里追加 UI 才出现的段落。
不新增阶段、检查门、审查轮、公共命令或第二份台账。

### 方案 1：在原步骤里加 UI 支路

做什么：每个阶段在已有步骤里加一段以“UI 时”开头的条件正文与证据要求。
为什么这样：新建 UI 专用流程成本高；只加一句无法判（工作包 1–3 各自「被否替代」句）。
怎么验：每段配一个契约测试（读文件正文、断言具名句子），并带删句反例。
失败怎样：测试变红就回同一 Phase 修正文；不改测试换绿。

### 方案 2：只追加，不改写受保护的原句

做什么：现有测试多是“正文必须含某句”的断言，改写原句容易变红。
各 Phase 只追加段落，不改写已被断言保护的句子（轻研究第 25 行）。
例外：第 2 段为修基线红测补一句，不删原句。

### 方案 3：行为由演练证，文字由契约测试证

做什么：第 3–7 段的契约测试只证“方法里写了、条件对了”。
“真的被调用、真的拦住”由第 9 段从真实阶段入口跑演练来证。
为什么这样：没有现成检查器能判“UI 被识别”（轻研究第 41–43 行）。
新检查器会变成新门，违反不新增门的边界。

### 方案 4：C11 入库分两步提交

做什么：先原样镜像一次提交，校验来源指纹；再修旧账一次提交，生成新指纹清单。
为什么这样：来源与交付两份指纹分开，“修过”和“原样”不混成一条。

## 阶段大纲：几个阶段，各交什么？

九段已由用户确认（分段大纲答复第 21–26 行）；第一版五段被用户退回。
第 0 阶段不采用：各段验收数据不同，没有共用的测试环境需统一准备。

- **第 1 段 能力清单先列**：交 `docs/ui-frontend-capabilities.md`，含十一项能力到包的映射
  与 PRD 漂移映射；验收 7；无依赖；可与第 8 段并行；下游是第 2–9 段的范围输入。
- **第 2 段 方案卡收敛办法**：只改定方向第 9 步与决策记录模板，并修基线红测；
  验收 9、10；依赖第 1 段；下游是第 3 段与以后所有逐包收敛。
- **第 3 段 定方向 UI 支路**：改定方向三件与模板；验收 1；依赖第 2 段（同文件）；
  下游是第 4–7 段读五行卡。
- **第 4 段 写需求 UI 任务链**：改写需求三件与 PRD 模板；验收 2；依赖第 3 段；
  下游是第 5 段。
- **第 5 段 排阶段 UI 验收**：改排阶段三件与 Phase 模板；验收 3；依赖第 4 段；
  下游是第 6 段。
- **第 6 段 写代码截图对照与前端质量**：改写代码三件与页面审计口径；验收 4；
  依赖第 5 段；下游是第 7 段。
- **第 7 段 审查 UI 六问与设计镜头**：改审查方法、设计审查技能、审查合同与镜头计划；
  验收 5；依赖第 3、6 段；下游是第 9 段。
- **第 8 段 C11 修复入库**：写 `docs/examples/c11-ui/`；验收 6；
  只依赖第 1 段的清单行；与第 2–7 段无共享文件，可并行；下游是第 9 段。
- **第 9 段 真实演练与清单对账**：在任务证据区跑两入口演练与六组破坏，并抽样对账清单状态列；
  验收 8、11、12；依赖第 1–8 段全部完成。

## 谁先谁后？

第 1 段最先，第 2→3→4→5→6→7 串行，第 8 段与第 2–7 段并行，第 9 段最后。

- 第 2→3 串行：两段都写 `workflows/make-decision/SKILL.md` 与决策记录模板；先写者第 2 段。
- 第 3→7 串行：第 7 段登记细节审查设计镜头，要读第 3 段写好的第 10 步正文。
- 第 4→5→6 串行：后段的 UI 字段读前段产出的字段名（五行卡→任务链→六项）。
- 第 6→7 串行：第 7 段的代码审查设计镜头要接第 6 段写的第 8 步。
- 第 9 段最后：演练要用第 3–8 段的新方法与入库页面，对账要用全部结果。

为什么不能再合到七段以内：按 Phase 模板「判定规则」S1–S4 逐对核过，
九段各有独立验收判据，没有一对满足合并条件。挡住合并的验收是：
第 2、3 段分别由验收 9、10 与验收 1 判，判方案卡与判 UI 支路互不需要看对方产出；
第 1、9 段分别由验收 7 与验收 11 判，前者判清单可读，后者判状态与仓库事实一致；
第 8、9 段分别由验收 6 与验收 8 判，入库指纹不需要演练就能判；
第 4、5、6 段分别由验收 2、3、4 判，各有自己的阶段文件与删句反例。
“前段先交付并独立验收”是后段的固定开工输入，不算 S2。

## 还有什么没定？

方向都已定；剩下的是执行时才能锁定的事实，由对应 Phase 作者核实。

- 未定 1：第 9 段从真实阶段入口跑的精确命令，以及验收 12 用的纯后台样例路径。
  按 `docs/standard-workflow.md`「当前路线」的公开入口；两项都由第 9 段任务 1（编号 T013）核实写进卡。
  核不到记 unknown，写原因与 owner（第 9 段开发），不以猜测填空。
- 未定 2：Downloads/UI 与 v15 页面的区域对应关系未核（轻研究第 67–69 行）。
  第 9 段第一步先写区域映射；对不上时按决定 10 退等价样例，须用户确认。
- 未定 3：C11 入库最终文件清单在第 8 段按指纹清单锁定（工作包 6「未决」：“最终文件清单在包 6 执行时按哈希清单锁定”）。
  许可或体积不清时停这条路径问用户（决定 8「风险」：“不清就停这条路径问你”）。
- 未定 4：新契约测试的文件名在本文写成建议名，第 3–7 段作者可改名，但须保留断言范围。

## 实现设计（全局权威）

复用四个阶段已有的方法文件、步骤表、技能依赖表和审查方法，只追加 UI 条件段。
不新增状态、schema、公共命令或检查门；新文件只有能力清单、C11 示例目录与契约测试。

本节消费决策记录与九包收敛卡，不再决定产品目标。
缺失项写 `unknown — owner / impact / next action`，不以猜测填空。

### 代码锚点

实施者先读本段 Phase 写集里的文件原字节，再读引用它的测试断言，再动笔。

- **来源边界**：决策记录与收敛卡只作来源映射；本文不另建第二份需求账本。
- **现状与目标差异**：各阶段现状缺口见决策记录各包「现状缺口」格；
  目标是每个阶段在原步骤里多一段 UI 条件正文，非 UI 路径原字节不变。
- **运行条件**：node v24.14.0、vitest 2.1.9；工作区无 node_modules，
  `npx vitest` 解析到主仓 `/Users/Hugh/Hugh/Project/workflowhub/node_modules`（轻研究第 98 行）。
  vitest 文件用 `npx vitest run <文件>`，node:test 文件用 `node --test <文件>`，都在工作区根执行。
- **读取顺序与锚点**（行号是 998614bd 的快照，会漂移，不作契约）：

| Phase | 先读的文件与锚点 | 再读的断言 |
| --- | --- | --- |
| 第 1 段 | PRD `specs/workflowhub-ui-frontend-release-20261020/prd.md` 的 C1–C11 段；决策记录「工作包 7」的能力到包最小映射表 | 无既有测试 |
| 第 2 段 | `workflows/make-decision/SKILL.md` 第 8 步（:164）与第 9 步；`steps.json` 第 9 步；模板 | `tests/contract/n10-process-repair.test.mjs` 的 `t026` |
| 第 3 段 | 同上三件的第 1、3、5、9、10 步；`skill-deps.yaml`；`skills/design-source-readiness/SKILL.md`、`skills/frontend-prototype-render/SKILL.md` 触发条件 | `make-decision-flow`、`ui-source-consumption` |
| 第 4 段 | `workflows/build-prd/{SKILL.md,steps.json,skill-deps.yaml}`；`skills/spec-prd/templates/prd-template.md` 任务卡 | `build-prd-review-contract`、`card-03-current` |
| 第 5 段 | `workflows/build-plan/{SKILL.md,steps.json,skill-deps.yaml}` 第 5、7、9 步；`skills/spec-plan/templates/phase-template.md` | `n11-plan-quality`、`acceptance-plan`、`authoring-contract` |
| 第 6 段 | `workflows/build-code/{SKILL.md,steps.json,skill-deps.yaml}` 第 1、6–9 步与终末（:98、:226）；`skills/frontend-testing/references/page-audit.md` | `page-audit-*`、`ui-source-consumption`（「批准原型」句） |
| 第 7 段 | `skills/wh-review/SKILL.md`；`skills/plan-design-review/SKILL.md`（:15）；`skills/wh-review/contracts/make-decision.md`；`skills/wh-review/stage-skill-plan.json:4-27` | `card03-review-orchestration`、`prototype-design-review`、`stage-id-removal` |
| 第 8 段 | 仓外 v15 与载体目录；两份指纹清单；`c11-closeout-index-v2.md:20,44-46,52-56` | 无既有测试 |
| 第 9 段 | 第 1–8 段全部产出；`docs/standard-workflow.md`「当前路线」 | 第 1–8 段的新契约测试 |

### 接口与失败语义

阶段之间只靠材料正文传递 UI 事实：上游写的段落就是下游读的输入，不另建对象。

- **选择的架构方案**：在原步骤追加 UI 条件段；放弃新建 UI 流程（成本高）、
  放弃新检查器（会变新门）、放弃另写 UI PRD（第二权威）。
- **数据流**：定方向五行卡（决策记录「原始需求」之后一节）
  → 写需求读五行卡，产页面清单、UI 任务链、页面数据清单
  → 排阶段读 PRD 与五行卡，产 UI Phase 六项
  → 写代码读六项与设计源，产截图与差异、前端质量记录、组件沉淀结论
  → 审查读以上全部，产六问结论或未读记录。
- **模块职责**：

| 模块 | 消费 | 产出 | 写集所属 Phase |
| --- | --- | --- | --- |
| 定方向方法 | 原始需求、项目页面事实、用户答复 | 五行卡、十格方案卡 | 第 2、3 段 |
| 决策记录模板 | 定方向方法 | 「UI 范围与设计基准」节、方案卡格式 | 第 2、3 段 |
| 写需求方法与 PRD 模板 | 五行卡 | UI 任务链、接线、页面数据清单 | 第 4 段 |
| 排阶段方法与 Phase 模板 | PRD、五行卡 | UI Phase 六项、组件回写位置 | 第 5 段 |
| 写代码方法与页面审计口径 | 六项、设计源 | 截图差异、质量记录、组件沉淀 | 第 6 段 |
| 审查方法、设计审查技能、镜头计划 | 各阶段材料 | 六问结论、设计镜头 | 第 7 段 |
| 能力清单 | 包 1–8 产出 | 十一行能力与漂移映射 | 第 1、9 段 |
| C11 示例目录 | 仓外原件与指纹清单 | 入库文件、来源说明、新指纹清单 | 第 8 段 |

- **兼容**：可以新增可选 UI 字段，只在 UI 任务时非空；已有机器字段含义不改（澄清答复第 20 行）。
  十列台账与五类分析的机器形状不改（工作包 9「边界」：“不改十列台账与五类分析的机器形状”）。
  旧材料缺新字段按“未知”补问，不判旧任务失败（决定 5「历史材料」：“按‘未知’处理并补问，不追溯判旧任务失败”）。
- **组件规范去处**：不在 workflowhub 的 `specs/` 新建 `specs/design/components.md`。
  组件沉淀写回目标项目根下的组件规范；演练时目标项目是演练副本（澄清答复第 21 行）。
- **设计可开工标记**：只是设计源里的标注，不进工作流字段，不做形式确认（澄清答复第 23 行）。
- **失败语义**：缺设计源、缺视觉证据、测不到的质量项都记“未知”或“不可用”加负责人与恢复条件；
  不默认通过，不默认非 UI，不重试掩盖原失败。
- **新增控制面**：`N/A — 不新增命令、schema、状态或门；新契约测试只读文件正文`。
- **新增文件登记**：AGENTS 要求新文件先在 `docs/architecture/move-map.json` 登记。
  主会话处置为既有规则遵从、不是方向变化（任务库 `quality/evidence/build-plan/2026-11-13-005-spec-pending-dispositions.md` 第 1 条）：
  第 1 段是该文件唯一写者，一次追加两条登记；第 8 段不写它，开工前读回第 1 段的登记行。

文件边界（允许写集；同文件只有一个写者，跨段同文件按依赖边定序）：

| Phase | 允许改的文件 | 与谁共享、谁先 |
| --- | --- | --- |
| 第 1 段 | 新建 `docs/ui-frontend-capabilities.md`；新建 `tests/contract/ui-frontend-capabilities.test.mjs`；`docs/architecture/move-map.json` 只追加 `docs/ui-frontend-capabilities.md` 与 `docs/examples/c11-ui/` 两条登记 | 清单第 9 段只改状态列，第 1 段先；move-map 只由第 1 段写，第 8 段读回 |
| 第 2 段 | `workflows/make-decision/SKILL.md`（第 8 步补一句、第 9 步方案卡）、`workflows/make-decision/steps.json`（只改第 9 步可见结果与证据文字）、`skills/decision-log/templates/decision-log-template.md`；新建 `tests/contract/module-convergence-card.test.mjs` | 前三件第 3 段也写，第 2 段先写、第 3 段后写 |
| 第 3 段 | 上列前三件；`workflows/make-decision/skill-deps.yaml`；`skills/design-source-readiness/SKILL.md`、`skills/frontend-prototype-render/SKILL.md` 触发条件段（只这两处；`skills/plan-design-review/SKILL.md` 触发条件归第 7 段）；新建 `tests/contract/ui-stage-make-decision.test.mjs` | 读第 2 段结果后写 |
| 第 4 段 | `workflows/build-prd/{SKILL.md,steps.json,skill-deps.yaml}`；`skills/spec-prd/templates/prd-template.md` 任务卡；新建 `tests/contract/ui-stage-build-prd.test.mjs` | 无共享 |
| 第 5 段 | `workflows/build-plan/{SKILL.md,steps.json,skill-deps.yaml}`；`skills/spec-plan/templates/phase-template.md`；新建 `tests/contract/ui-stage-build-plan.test.mjs` | 无共享 |
| 第 6 段 | `workflows/build-code/{SKILL.md,steps.json,skill-deps.yaml}`；`skills/frontend-testing/references/page-audit.md`；新建 `tests/contract/ui-stage-build-code.test.mjs` | 无共享 |
| 第 7 段 | `skills/wh-review/SKILL.md`；`skills/plan-design-review/SKILL.md`（含触发条件与调用范围，第 7 段是唯一写者）；`skills/wh-review/contracts/make-decision.md`；`skills/wh-review/stage-skill-plan.json`；新建 `tests/contract/ui-stage-review.test.mjs` | 第 3 段写完第 10 步后才开工 |
| 第 8 段 | 新建 `docs/examples/c11-ui/**`（v15 五件、v11/v12 两份样式、载体 `app/ui/` 四件、`SOURCE.md`、`delivery.sha256`，共 13 件） | 无共享 |
| 第 9 段 | `docs/ui-frontend-capabilities.md` 状态列；任务证据区 `quality/evidence/rehearsal/` 与 `quality/tests/` | 第 1 段先写 |

故意不改：`tests/contract/n10-process-repair.test.mjs`（第 2 段只改正文让它转绿）；
PRD 历史正文；C11 原任务目录与仓外原件；`tools/cli/` 下所有检查器。

### 需求到任务追踪

每条原始需求都有功能需求、验收与 Phase；本阶段已执行的需求单列。

| 来源 | 功能需求 | 验收 | Phase/Task | 判定器 |
| --- | --- | --- | --- | --- |
| R-001、R-002、R-006、R-009 | FR-007 | AC-007 | P1/T001 | ORACLE-CAP-LEDGER |
| R-014、R-016、R-012 | FR-009 | AC-009 | P2/T002 | ORACLE-CONV-CARD |
| R-012；分段大纲答复第 23 行，任务库 `quality/evidence/build-plan/2026-11-13-003-phase-outline-answer.md`（sha256 `9e8097662feccb2f676d0603b40451b6863cba90c5ffe41689783e953c11d54f`） | FR-010 | AC-010 | P2/T003 | ORACLE-T026 |
| R-003、U-002 | FR-001 | AC-001 | P3/T004 | ORACLE-MD-UI |
| R-004、R-007、U-002 | FR-002 | AC-002 | P4/T005 | ORACLE-PRD-UI |
| R-004、R-007、U-002 | FR-002 | AC-002 | P9/T017 | ORACLE-PRD-UI |
| R-004、U-004 | FR-003 | AC-003 | P5/T006 | ORACLE-PLAN-UI |
| R-005、U-004 | FR-004 | AC-004 | P6/T007 | ORACLE-CODE-UI |
| R-005、U-004 | FR-004 | AC-004 | P6/T008 | ORACLE-CODE-UI |
| R-008、U-002 | FR-005 | AC-005 | P7/T009 | ORACLE-REVIEW-UI |
| R-008、U-002 | FR-005 | AC-005 | P7/T010 | ORACLE-REVIEW-UI |
| R-002、R-006、U-003 | FR-006 | AC-006 | P8/T011 | ORACLE-C11-HASH |
| R-002、R-006、U-003 | FR-006 | AC-006 | P8/T012 | ORACLE-C11-HASH |
| R-002、R-006、R-009、R-012、U-003、U-004 | FR-008 | AC-008 | P9/T013 | ORACLE-REHEARSAL |
| R-002、R-006、R-009、R-012、U-003、U-004 | FR-008 | AC-008 | P9/T014 | ORACLE-REHEARSAL |
| R-009、R-012 | FR-011 | AC-012 | P9/T015 | ORACLE-NONUI |
| R-001、R-002、R-006、R-009 | FR-007 | AC-011 | P9/T016 | ORACLE-CAP-LEDGER |
| R-001–R-012、R-014、R-016、U-002–U-004 | FR-001、FR-002、FR-003、FR-004、FR-005、FR-006、FR-007、FR-008、FR-009、FR-010、FR-011 | AC-001、AC-002、AC-003、AC-004、AC-005、AC-006、AC-007、AC-008、AC-009、AC-010、AC-011、AC-012 | P9/T018 | ORACLE-FINAL-AC |
| U-001 | 路线事实，无独立功能 | — | — | 决策记录「级别与路线」节：“你选了完整做法” |

需求 12（R-012，可验证）由每条验收的 RED/GREEN 命令与反例承接。
R-010、R-011、R-013、R-015 已在定方向阶段执行，见「已声明不做」。
正文中文编号与机器编号的完整对照见 Appendix B。

### 全局验证策略

文字改动用契约测试证，行为用演练证，入库用指纹证；三者各有反例。

- **契约测试**：读真实文件正文，断言 UI 条件段的具名句子与非 UI 路径原字节。
  同一个测试里另对内存副本删句，断言检查函数报出具名缺口（反例不改磁盘文件）。
- **非 UI 不变**：每个新契约测试用 `git show 998614bd:<文件>` 取基线，
  断言非 UI 路径的步骤可见结果与证据文字与基线逐字相同。
- **RED 与 GREEN**：新契约测试在改正文前先跑，具名断言失败才算目标 RED；
  改完用同一测试 GREEN；未执行不宣称 RED 或 GREEN。
  第 2 段的老测试 RED 在基线已存在（exit 1，T026）。
- **回归**：每段只跑本段写集对应的既有测试单文件（清单见「测试计划是什么？」），不跑全量。
- **最终聚合**：第 9 段逐条读回第 1–8 段原件，判验收 8、11、12。
- **唯一全 AC 末验**：可执行产物的全部验收只在第 9 段任务 6（编号 T018）末验一次，
  判定器 ORACLE-FINAL-AC，覆盖验收 1–12；其余各段只判本段承接的验收。
  末验只跑本任务新增的契约测试文件，不重跑既有测试：既有测试已在各段改前改后各跑一次，
  本末验不重复（用户答复“A 瘦身版”，原件 任务库 `quality/evidence/human-confirmations/2026-11-13-003-build-plan-p9-scope-change.json`）。
- **不能证明的内容**：契约测试不证明阶段真的调用了能力；演练不是产品质量结论；
  不证明 C09 双路径与 C10 发布（原卡不重验）。

## 怎么算通过？

按 Appendix A 逐条核；命令留在所属 Phase 卡，Appendix A 写整条命令供 Phase 作者照抄。

### 验收判据在哪里？

验收判据只在 Appendix A；正文和决策记录只给指针，同一判据不写两处。

### 判定对象怎么与需求对齐？

判定对象是四个阶段的方法文件与一次真实演练，不是某个产品页面。
契约测试判的是方法正文，演练判的是方法被真实执行后的行为；契约测试通过不代表行为达成。
演练用 v15 页面的工作副本，不改入库 v15 交付指纹（澄清答复第 12 行）。

### 验收对象是什么？

被验的页面目标是第 9 段演练里 v15 页面的工作副本，用静态服务打开。
三来源 UI 适用性记录见任务库 `quality/evidence/build-plan/2026-11-13-004-ui-readiness.md`。
端口与工作副本路径由第 9 段卡锁定；下列值来自已确认的演练设计，尚未运行观察。

机器区供校验器读取，人可跳过。

#### 验收对象

```json
{
  "workspace": "/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-stage-integration-20261113",
  "service": "python3 -m http.server（静态服务，根为第 9 段演练副本，即 docs/examples/c11-ui/ 的完整副本）",
  "route": "/v15/2026-11-11-002-t019-v15-pending-busy-index.html",
  "state": "正常数据；改一个值后刷新；数据文件改坏或删除后的失败态",
  "viewport": "1440x900, 390x844",
  "owner": "第 9 段独立验收者（未参与实现）"
}
```

来源：workspace 来自认证工作区；route 来自 v15 文件名（轻研究第 50 行）；
state 来自澄清答复第 12 行；viewport 来自工作包 4「方案与取舍」：“固定 1440×900 与 390×844 两个尺寸”。
未观察范围：端口、工作副本路径、Downloads/UI 的对应区域（「还有什么没定？」未定 2）。

### 证据计划怎么写？

每条验收的七项（判什么、怎么判、证据从哪来、谁提供、何时拿到、成本类别、拿不到怎么办）
写在 Appendix A 该条内；拿不到时写真实尝试、卡点、提供者与恢复条件，不记完成。

## 测试计划是什么？

每段先写新契约测试并跑出 RED，再改正文跑 GREEN，再跑本段既有测试单文件。

| 测试面 | 适用 | 判定器 | 覆盖验收 | 所属 Phase |
| --- | --- | --- | --- | --- |
| 方法正文契约 | 适用 | 新契约测试 | 1–5、9 | 第 2–7 段 |
| 非 UI 原字节 | 适用 | 新契约测试对基线 | 1–5、12 | 第 3–7、9 段 |
| 老测试转绿 | 适用 | `n10-process-repair` | 10 | 第 2 段 |
| 指纹校验 | 适用 | `shasum -a 256 -c` | 6 | 第 8 段 |
| 浏览器可见面 | 适用 | 演练截图与观察协议 | 6、8 | 第 8、9 段 |
| 独立读者冷读 | 适用 | 各段固定题目（见下） | 7、9、11 判定；其余段作材料证据 | 全部九段（见下） |
| 浏览器端到端自动化 | 不适用 | — | — | 理由：页面是静态样例，演练按观察协议截图即可判 |

各段要跑的既有测试单文件（只跑这些，不跑全量）：

- 第 2、3 段：`tests/contract/make-decision-flow.test.mjs`、`tests/contract/make-decision-flows.test.mjs`、
  `tests/contract/n10-process-repair.test.mjs`、`tests/contract/n11-discussion-quality.test.mjs`、
  `tests/contract/light-upgrade-entry.test.mjs`、`tests/contract/authoring-shape.test.mjs`、
  `tests/acceptance/n10-finite-check-acceptance.test.mjs`、`tests/contract/check-stage-steps.test.mjs`、
  `tests/contract/final-chain-runner.test.mjs`；第 3 段另加 `tests/contract/ui-source-consumption.test.mjs`、
  `tests/contract/design-source-extraction-wiring.test.mjs`。
- 第 4 段：`tests/contract/build-prd-review-contract.test.mjs`、`tests/acceptance/card-03-current.test.mjs`、
  `tests/contract/check-stage-steps.test.mjs`、`tests/contract/final-chain-negatives.test.mjs`。
- 第 5 段：`tests/contract/n11-plan-quality.test.mjs`、`tests/contract/acceptance-plan.test.mjs`、
  `tests/contract/authoring-contract.test.mjs`、`tests/contract/check-stage-steps.test.mjs`。
- 第 6 段：`tests/contract/page-audit-report-consumption.test.mjs`、`tests/contract/page-audit-doc-contract.test.mjs`、
  `tests/contract/stage-materials.test.mjs`、`tests/contract/terminal-chain.test.mjs`、
  `tests/contract/ui-source-consumption.test.mjs`。
  其中 `page-audit-doc-contract` 的基线读数见基线表第 026 行（退出 0）；
  第 6 段开发动笔前先跑一次，记 `-before` 原件，改后记 `-after` 原件再比。
- 第 7 段：`tests/contract/card03-review-orchestration.test.mjs`、`tests/contract/prototype-design-review.test.mjs`、
  `tests/contract/page-audit-wiring.test.mjs`、`tests/contract/stage-id-removal.test.mjs`、
  `tests/n2-skill-catalog-portability.test.mjs`。
- 改任一 `skill-deps.yaml` 的段（第 3–6 段）另跑：`node --test tests/contract/ui-skill-contract.test.mjs`、
  `npx vitest run tests/contract/knowledge-graph-stage-wiring.test.mjs`、
  `npx vitest run core/__tests__/local-skill-resolver.test.mjs`、`node tools/cli/check-skill-consistency.mjs --root /Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-stage-integration-20261113`（不带 `--root` 时退出 1 是参数错，不是检查结果）。

冷读覆盖以任务库 `quality/tests/` 下最新一份读者记录为准；该记录开头列明它所读材料的 sha256。
采用前必须核那串 sha256 与当前材料一致；不一致即视为“未覆盖当前版本”，
不得拿旧记录当覆盖依据，须重读后另存新记录。
现有 `2026-11-13-044-build-plan-final-reader-record.md` 读的是 14:23 版材料；
036、037、038、040 更早，只作历史，不作覆盖依据；
未读到的段要在记录里点名，不得默认通过。
冷读题目按段固定，答不出任一问即记 finding 交主会话，不单独决定该条验收通过或失败：
第 1 段用验收 7 的三道抽问；第 2 段用逐包收敛五问（改什么、为什么、边界、怎么验、还剩什么）；
第 6 段两问、第 7 段三问见验收 4、5；第 9 段对账按验收 11 的抽样规则读 5 行原件，未抽到的行记“未逐行核对”，不另设冷读题。
例外：验收 7、9、11 的冷读或人读结论计入该条判定，见各条。

红测归因：基线读数以任务库 `quality/tests/2026-11-13-004-baseline-summary.tsv` 为准；
knowledge-graph-stage-wiring、local-skill-resolver、final-chain-negatives 等在基线已非零，逐条见 004。
check-skill-consistency 以任务库 `quality/tests/2026-11-13-031-baseline-check-skill-consistency-root.output`
带 `--root` 的读数为基线（退出 0）；004 第 019 行不带 `--root`，属命令错，不作基线。
判据是“不比基线差，且改后新出现的失败用例名不在基线失败清单里”；
基线已红的条目改后仍红不算本段回归，新增失败名才算本段目标行为回归。
先写测试文件，再在改正文前跑；目标 RED 只认具名断言失败。
测试文件缺失报 `No test files found`、找不到 vitest 或 node_modules，都算环境失败，另记，不算 RED。
改前改后读数分成 `-before`、`-after` 两份证据；改前由本段开发动笔前取。
写集核对以本段开工时记录的 HEAD 为基点；基点文件放任务库，不放工作区，免得被一起提交。
本段开发动笔前在工作区根跑（命令行，不折行）：
`git rev-parse HEAD > /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-stage-integration-20261113/quality/tests/<日期>-p<n>-start-head.txt`
审查时先用 `test -s` 守卫确认基点文件存在且非空，再列改动：
`test -s /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-stage-integration-20261113/quality/tests/<日期>-p<n>-start-head.txt && git diff --name-only "$(cat /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-stage-integration-20261113/quality/tests/<日期>-p<n>-start-head.txt)"..HEAD`
守卫失败即取不到基点，记 incomplete，不改用基线提交代替。

## 有什么风险和未决？

最可能损害结果的是改写原句打红老测试，以及非 UI 路径被悄悄加了动作。

- **风险 1**：改写受断言保护的原句使老测试变红。缓解：只追加；每段跑本段既有测试单文件。
  回退：按基线原字节恢复该文件。
- **风险 2**：非 UI 任务被硬塞 UI 字段。缓解：每个新契约测试对基线逐字比非 UI 路径；验收 12 演练再证。
- **风险 3**：契约测试通过却没真接线。缓解：第 9 段从真实入口跑六组破坏，不只看生成材料。
- **风险 4**：C11 许可、体积不清污染主仓。缓解：第 8 段先核，不清就停这条路径问用户。
  回退：撤回两次入库提交，仓外文件不变。
- **风险 5**：能力清单成第二权威或过期。缓解：只放一处；维护者写“阶段方法负责人”，能力变更时同步。
- **风险 6**：Downloads/UI 与 v15 对不上。缓解：第 9 段先写区域映射，对不上退等价样例并问用户。
- 回退总表见决策记录「回退与恢复」节；每段回退都是恢复该段写集原字节，再跑本段既有测试。

### 补充材料与术语在哪里？

任务库根（下称任务库）：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-stage-integration-20261113`。

- 原始消息：任务库 `quality/evidence/raw-requirements/2026-11-13-user-message.md`
- 需求摘要：任务库 `quality/evidence/research/2026-11-13-005-build-plan-requirements-digest.md`
- 轻研究：任务库 `quality/evidence/research/2026-11-13-006-build-plan-light-research.md`
- 规格澄清答复：任务库 `quality/evidence/build-plan/2026-11-13-002-spec-clarify-answers.md`
- 分段大纲答复：任务库 `quality/evidence/build-plan/2026-11-13-003-phase-outline-answer.md`
- 九包收敛卡：任务库 `quality/evidence/convergence/convergence-cards.md`
- C11 指纹清单与收口索引：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c11-gap-repair-20261112/quality/evidence/`
- 术语沿 `GLOSSARY.md`；本文新词已在「一页看懂」首现处解释。

## 已声明不做

下列各项有决定原文与 owner，不写成验收；不算覆盖缺口。

| 项 | 决定原文 | owner 与恢复条件 |
| --- | --- | --- |
| C09 原卡重验（双路径、六指标） | 决定 9 映射表 C09 行与决定 10「不重跑 C09 的双路径与六指标」；澄清答复第 7–9 行（用户选“算同意，不重验”） | 原任务；要重跑另开任务 |
| C10 原卡重验（发布、幂等接入、发布包调用） | 决定 9 映射表 C10 行；澄清答复第 7–9 行 | 原任务；要重跑另开任务 |
| C11 的 G8 六段下游回执 | 工作包 6「方案与取舍」：“G8 六段下游回执没修” | C09 P4 原写者；下游真实读六段并留回执 |
| C11 的 N4 审查派发被挡 | 工作包 6「方案与取舍」：“N4 审查派发被挡” | 审查基础设施维护者；派发通道可用并留回执 |
| C11 的 N5 物理读屏 | 工作包 6「方案与取舍」：“N5 物理读屏没做” | 用户或指定可访问性测试者；完成一次真人读屏 |
| C11 的 R2 窄屏页面过长 | 工作包 6「方案与取舍」：“R2 窄屏页面太长，接受并写进说明” | 用户 |
| C12 能力与页面质量验收 | 需求摘要第 101 行；工作包 6「数据与状态」：C12 只是消费者 | 另开任务；触发条件：本任务 build-code 终末收口后，由用户确认另开任务时触发；未触发保持不做 |
| 方案卡推广到写需求、排阶段 | 决定 11「改动」：“写需求与排阶段若要推广同一格式，另开任务” | 另开任务并取得用户确认 |
| PRD 的 C11、C12 文字更新 | 未决 5：“只做台账映射，不改写 PRD 历史正文” | 另开任务；触发条件：本任务 build-code 终末收口后，由用户确认另开任务时触发；未触发保持不做 |
| 恢复 verify-code 阶段 | 决定 9 与「什么已经退出？」节：verify-code 只映射不恢复 | 不做 |
| 方向审查加 UI 问 | 决定 7：“方向审查不加 UI 问，维持现有四问” | 不做，维持四问 |
| 形式化“设计稿可开工”确认 | 决定 3：“不做形式化确认，也不加新字段”；澄清答复第 23 行 | 不做 |
| 第三次细节复核作为通过依据 | 澄清答复第 16 行（用户要求停止，015 只读保留） | 不做 |
| 需求 10、11、13、14、15 的执行 | 决策记录「任务身份」节：需求 10、11、13、14、15 在本阶段执行 | 定方向阶段；已收口 |
| 机器步骤留痕 15 步 unavailable | 决策记录「验收面」节：run-checks 15 步 unavailable，记 incomplete | 定方向阶段主会话；恢复条件：步骤原件可取得后重跑 `node tools/cli/check-stage-steps.mjs --stage=make-decision` 并逐项读回；未恢复保持 incomplete，不挡本任务，不据此称完成 |
| 用户选择 1：走完整做法（复杂路线） | 决策记录「级别与路线」节：“你选了完整做法” | 定方向阶段；已执行 |

## 待决

下列项与原文有张力或超出决策写集；按澄清答复处置不了的，不自改方向，交主会话。

- 待决 1：新文件登记。AGENTS「当前目录职责」要求新增文件先在
  `docs/architecture/move-map.json` 登记职责与消费者；决策写集（决策记录「哪些文件由谁改？」节）
  未列该文件，也未列新契约测试、`skills/frontend-testing/references/page-audit.md`、
  `skills/spec-prd/templates/prd-template.md`、`skills/spec-plan/templates/phase-template.md`
  与两处触发条件技能的精确路径。澄清答复第 19 行允许“build-plan 补齐路径”，
  本文已补后几项。已关闭：主会话按 任务库 `quality/evidence/build-plan/2026-11-13-005-spec-pending-dispositions.md` 第 1 条处置，move-map 归第 1 段写集。
- 待决 2：组件规范去处。决定 6 与未决 4 写“`specs/design/components.md` 或等价源”；
  澄清答复第 21 行定为目标项目根，不在 workflowhub `specs/` 新建。本文按答复写，
  台账 C01、C08 行“规范源”列由第 1 段作者照此写。已关闭：第 1 段已照写。
- 待决 3：未决 6“采纳设计可开工标记”与决定 3“不做形式化确认或新字段”
  字面相反；本文按澄清答复第 23 行理解为设计源内标注。
  已关闭：主会话裁定不属方向变化，依据任务库 `quality/evidence/build-plan/2026-11-13-005-spec-pending-dispositions.md` 第 3 条。

## Appendix A — 验收判据（唯一权威）

每条验收写目标、怎么操作、什么条件、怎样算通过、真跑还是替代、谁判与证据，段末写失败回修与停止。

判定方式只用三个词：`机器可判`、`只能人读`、`需真实环境，可用自动化采集判`。
命令都在工作区根执行；新契约测试文件名是建议名（「还有什么没定？」未定 4）。
证据路径相对任务库根；`<日期>` 由执行者按真实时间填，同字节只留一份原件。
演练路径写成 `quality/evidence/rehearsal/$DAY-…`：`$DAY` 是演练当天日期，
`quality/evidence/` 就是第 9 段卡里 `$EV` 指的任务库证据区。
成本七字段校验器用，人可跳过；分钟是活动执行估算。

- [ ] **AC-001 定方向 UI 支路**：承接 P3；关联 FR-001。
  落点：P3/T004 与 `phases/P3-定方向UI支路.md`；全 AC 末验在 P9/T018。
  判定方式：机器可判（正文契约）；行为另由 AC-008 第①组判。
  目标：定方向方法与模板写出三源判定、五行卡、首问设计源、设计源四路、细节审查设计镜头；
  下游作者能在决策记录「原始需求」之后读到「UI 范围与设计基准」一节。
  怎么操作：先跑 `npx vitest run tests/contract/ui-stage-make-decision.test.mjs`（改正文前）得 RED，
  改完再跑同一命令，再跑「测试计划」第 2、3 段既有测试单文件。
  什么条件：基线 998614bd；第 2 段已合入；主仓 node_modules 可解析 vitest。
  怎样算通过：GREEN 退出 0；断言命中第 1 步三源与五行卡、第 1 步首问含设计源、四路与无稿须用户选、
  第 10 步设计审查镜头、模板一节；非 UI 路径各步可见结果与 `git show 998614bd:` 原文逐字相同。
  UI 任务时第 2、3 步调研顺带查现有页面、路由、组件与规范（需求 3；与第 3 段卡一致）。
  设计源四路各有必填证据句（决定 3「四路逐路写清触发、负责人与证据」）：
  内部稿——设计方在页面或区块标“可开发”并给注解；
  外部稿——来源、版本、可用范围、验收基准；
  沿用现有页面——页面、路由、版本；
  无稿——所选路径（先做原型或设计稿／直接实现）与后果，且须用户明确接受风险。
  失败信号：任一具名断言失败；既有测试单文件出现 004/031 基线清单外的新失败用例名。
  反例：测试内对内存副本删掉五行卡的“设计源”一行，检查函数必须报出该行缺失；
  内存副本删掉外部稿的“版本”，或删掉无稿的“用户明确接受风险”句，检查函数必须报缺；
  内存副本给非 UI 路径加一句 UI 要求，基线比对断言必须变红。
  真跑还是替代：真跑命令；它只证方法写了，不证真实任务会触发，后者由 AC-008 判。
  谁判与证据：未参与第 3 段实现的独立测试者，第 3 段审查改完后判；
  原件 `quality/tests/<日期>-p3-ui-stage-make-decision-{red,green}.output`。
  失败回修与停止：变红回第 3 段开发同一会话修正文，不改测试；
  要改断言须用户真实答复；发现要新增步骤或门时停，退回定方向。
  成本：executor=独立测试者；estimate_min=10；hard_cap_min=30；
    resources=工作区、基线提交、主仓 node_modules；observation=退出码与具名断言输出；
    retry_cap=1；evidence_tier=命令级。
  资源来源：全用仓内文件与基线提交，不新造样张。
  为什么不能再简：一条命令同时判 UI 段存在与非 UI 不变；再简就判不出硬塞。

- [ ] **AC-002 写需求 UI 任务链**：承接 P4；关联 FR-002。
  落点：P4/T005 与 `phases/P4-写需求UI任务链.md`；规划读回 P9/T017 与 `phases/P9-真实演练与对账.md`；全 AC 末验在 P9/T018。
  判定方式：机器可判（正文契约）；行为另由 AC-008 第④组判。
  目标：写需求方法与 PRD 模板在出地图与写完整 PRD 两个时点写 UI 内容：设计任务（需要时）、
  前端底座（跨多页或多任务时）、每个 UI 任务的接线、视觉、组件三段、页面数据清单。
  怎么操作：`npx vitest run tests/contract/ui-stage-build-prd.test.mjs` 先 RED 后 GREEN；
  再跑第 4 段既有测试单文件。
  什么条件：第 3 段已合入（五行卡节名可读）。
  怎样算通过：GREEN 退出 0；断言命中两个时点、底座触发条件“跨多页或多任务”、
  “有稿不排设计任务”、接线写清页面区域与真假变化与失败态、页面数据清单归 PRD 作者、
  页面清单、设计偏差处置；非 UI 路径与基线逐字相同。
  规划读回：第 8 段交付后，第 9 段复用单页有稿样例 `docs/examples/c11-ui/v15`，
  按新写需求方法做一次规划读回；冻结判据是“无设计任务、无前端底座”，
  且页面清单、逐任务接线、页面数据清单、设计偏差处置都在。
  失败信号：任一具名断言失败；验收只写“页面能用”仍通过。
  反例：内存副本删掉“逐任务接线”句，检查函数必须报缺；
  内存副本把底座条件改成“每个 UI 任务”，断言必须变红。
  反例（规划读回）：给 v15 读回结果加一个设计任务或前端底座，读回判定必须判过度规划。
  真跑还是替代：命令真跑，证方法写对；单页有稿的真实规划行为由第 9 段读回证明。
  谁判与证据：独立测试者，第 4 段审查改完后；`quality/tests/<日期>-p4-ui-stage-build-prd-{red,green}.output`；
  规划读回由第 9 段独立验收者判，`quality/evidence/rehearsal/$DAY-v15-prd-readback.md`。
  读回门禁缺件时输出具名信号：`readback-entry-missing`、`readback-file-missing`、
  `readback-verdict-missing`、`readback-overplanned`，
  以及 `readback-页面清单-missing`、`readback-逐任务接线-missing`、
  `readback-页面数据清单-missing`、`readback-设计偏差处置-missing`；判据不变。
  失败回修与停止：回第 4 段开发修；需要第二份 PRD 或新作者时停，退回定方向。
  成本：executor=独立测试者；estimate_min=10；hard_cap_min=30；
    resources=工作区、基线提交；observation=退出码与断言输出；retry_cap=1；evidence_tier=命令级。
  资源来源：仓内文件。
  为什么不能再简：同一命令判触发条件与非 UI 不变。

- [ ] **AC-003 排阶段 UI 验收**：承接 P5；关联 FR-003。
  落点：P5/T006 与 `phases/P5-排阶段UI验收.md`；全 AC 末验在 P9/T018。
  判定方式：机器可判（正文契约）＋只能人读（历史样本）；行为另由 AC-008 第②组判。
  目标：排阶段方法与 Phase 模板给碰页面、路由、组件或样式的 Phase 写六项；
  第 9 步三项 UI 事实缺一项但碰页面仍加设计审查；第 5 步答复标记为“该步需要真实答复”；
  组件沉淀写回写位置和读的人，不改组件时写“不适用＋理由”（澄清答复第 22 行）。
  怎么操作：`npx vitest run tests/contract/ui-stage-build-plan.test.mjs` 先 RED 后 GREEN；
  再跑第 5 段既有测试单文件；独立读者按观察协议读两份历史 Phase 样本：
  UI 样本 `specs/archive/workflowhub-ui-frontend-c11-gap-repair-20261112/phases/P3-c04-c05-audit.md`；
  非 UI 样本 `specs/archive/n10-finite-check-wiring-20261020/phases/P1-检查内核与报告语义.md`
  （该卡第 133、271 行自述无页面、路由、组件改动）。
  什么条件：第 4 段已合入；历史样本只读。
  怎样算通过：GREEN 退出 0；断言命中六项名、缺源仍审句、第 5 步答复标记与正文一致；
  前端质量门五项各有可观察判据（决定 5「前端质量门含组件质量、浏览器验收、响应式、无障碍、性能预算」）：组件质量写复用、抽取、删除；
  浏览器验收写两尺寸能打开、无控制台错误；响应式写无横向滚动、390 宽主操作可达；
  无障碍写键盘可达、焦点可见、可访问名非空、200% 缩放主操作可达不裁切，
  物理读屏做一次并记录，做不了记不可用、负责人与恢复条件；
  性能预算写 LCP 不超过 2.5 秒、CLS 不超过 0.1、INP 不超过 200 毫秒；
  `workflows/build-plan/steps.json` 第 5 步 `requires_user_reply` 由 false 改为 true，
  由新契约测试 `ui-stage-build-plan` 断言（没有既有测试覆盖这一项）；
  非 UI Phase 路径与基线逐字相同；读者判历史 UI 样本按“未知”补问、非 UI 样本不被误判为缺项。
  失败信号：断言失败；读者判历史非 UI 样本缺 UI 字段，或历史 UI 样本被静默跳过。
  反例：内存副本删掉“视觉对照项”，检查函数必须报缺；
  内存副本删掉“性能预算”或“200% 缩放”，检查函数必须报缺；
  内存副本把第 5 步标记改回“不需要回复”或把 `requires_user_reply` 改回 false，断言必须变红。
  真跑还是替代：命令真跑；历史样本判读是人读，不证新任务真实执行。
  谁判与证据：独立测试者与未参与写作的独立读者，第 5 段审查改完后；
  `quality/tests/<日期>-p5-ui-stage-build-plan-{red,green}.output`、`quality/tests/<日期>-p5-history-sample-read.md`。
  失败回修与停止：回第 5 段开发修；要把六项做成所有 Phase 必填时停，退回定方向。
  成本：executor=独立测试者＋独立读者；estimate_min=25；hard_cap_min=60；
    resources=工作区、基线提交、两份历史样本；observation=退出码与读者结论；
    retry_cap=1；evidence_tier=命令级＋人读。
  资源来源：历史样本复用仓内归档，不新造。
  为什么不能再简：历史材料误判只能拿真实旧材料看，命令判不了。

- [ ] **AC-004 写代码截图对照与前端质量**：承接 P6；关联 FR-004。
  落点：P6/T007、P6/T008 与 `phases/P6-前端质量判据.md`；全 AC 末验在 P9/T018。
  判定方式：机器可判（正文契约）；按钮遮挡与质量破坏由 AC-008 第③、⑥组判。
  目标：写代码方法第 1 步读设计源与已批准原型；第 6 步 UI 时按 1440×900、390×844，
  固定浏览器、系统默认字体、缩放 100%、固定数据截图并逐项写通过、差异、用户接受的偏差；
  第 7 步页面审计加组件复用与沉淀结论并写回目标项目组件规范；第 8 步加设计审查角度；
  第 9 步视觉问题同修同复验；终末加对照结论复核；前端质量最小判据含 200% 缩放与物理读屏。
  怎么操作：`npx vitest run tests/contract/ui-stage-build-code.test.mjs` 先 RED 后 GREEN；
  再跑第 6 段既有测试单文件。
  什么条件：第 5 段已合入（六项字段名可读）。
  怎样算通过：GREEN 退出 0；断言命中两尺寸、固定环境、偏差由用户确认不由实现者自签、
  LCP 2.5 秒与 CLS 0.1 与 INP 200 毫秒的来源句（工作包 4「前端质量的最小判据」）、读屏做不了记不可用；
  `ui-source-consumption` 的「批准原型」句仍在；非 UI 路径与基线逐字相同。
  断言还命中前端质量最小判据：无控制台错误、无横向滚动、焦点可见、可访问名非空、
  390 宽主操作不裁切、200% 缩放下主操作可达；以及七项界面判定字段：UI 适用性、UI 合同、
  组件质量图、真实消费者、状态所有者、类型化视图模型、样式令牌所有者（工作包 4「数据与状态」）；
  任一项缺证据即未过，实现者不自签。
  失败信号：断言失败；功能测试通过即判 UI 通过的句子出现。
  反例：内存副本删掉“390×844”，断言必须变红；内存副本加“实现者确认偏差”，断言必须变红；
  内存副本从七项界面判定字段删掉“状态所有者”，断言必须变红。
  真跑还是替代：真跑命令；真实截图与差异由 AC-008 采集。
  谁判与证据：独立测试者按命令与观察项判，第 6 段审查改完后；
  证据：`quality/tests/<日期>-p6-ui-stage-build-code-red.output` 与 `-green.output`、
  既有测试 `quality/tests/<日期>-p6-<测试名>-before.output` 与 `-after.output`、
  `quality/tests/<日期>-p6-start-head.txt`、独立读者冷读记录。
  冷读记录列入证据；第 6 段冷读两问：组件沉淀写到哪个文件；没有可复用组件时写什么。
  答不出任一问即记 finding 由主会话处置，
  但不单独构成本条通过或失败（冷读是决定 11、工作包 9 的材料可读性验收）。
  失败回修与停止：回第 6 段开发修；要求“像素完全一致”或非 UI 截图时停，退回定方向。
  成本：executor=独立测试者；estimate_min=10；hard_cap_min=30；
    resources=工作区、基线提交；observation=退出码与断言输出；retry_cap=1；evidence_tier=命令级。
  资源来源：仓内文件。
  为什么不能再简：同一命令判 UI 段、阈值来源与非 UI 不变。

- [ ] **AC-005 审查 UI 六问与设计镜头**：承接 P7；关联 FR-005。
  落点：P7/T009、P7/T010 与 `phases/P7-审查UI六问.md`；全 AC 末验在 P9/T018。
  判定方式：机器可判（正文契约）；四类缺陷被审出由 AC-008 第①③④⑤组判；
  缺视觉证据由第③组变体（删写代码阶段截图与差异原件）判。
  目标：审查方法有只在 UI 时出现的六问块，三个阶段问法不同；设计审查技能调用范围补定方向与写代码；
  细节审查设计镜头登记进 make-decision 审查合同与镜头计划；方向审查维持四问不加 UI 问；
  审查记录写清读了什么、看了哪些页面、哪些没看；截图只支持视觉对照。
  怎么操作：`npx vitest run tests/contract/ui-stage-review.test.mjs` 先 RED 后 GREEN；
  再跑第 7 段既有测试单文件。
  什么条件：第 3、6 段已合入。
  怎样算通过：GREEN 退出 0；断言命中六问名、镜头计划中 make-decision 细节轨含设计镜头、
  方向轨与基线逐字相同、“材料存在不当已读”句、未看成记未读或不可用。
  失败信号：断言失败；方向审查出现 UI 问。
  反例：内存副本从 `stage-skill-plan.json` 删掉设计镜头，断言必须变红；
  内存副本给方向轨加 UI 问，基线比对必须变红。
  真跑还是替代：真跑命令；真实审查行为由 AC-008 判。
  谁判与证据：独立测试者按命令与观察项判，第 7 段审查改完后；
  证据：`quality/tests/<日期>-p7-ui-stage-review-red.output` 与 `-green.output`、
  既有测试 `quality/tests/<日期>-p7-<测试名>-before.output` 与 `-after.output`、
  `quality/tests/<日期>-p7-start-head.txt`、独立读者冷读记录。
  冷读记录列入证据；第 7 段冷读三问：三处审查各自要问到哪些证据；
  只有截图时交互与无障碍记什么；完整材料是否必须给出发现。
  答不出任一问即记 finding 由主会话处置，
  但不单独构成本条通过或失败（冷读是决定 11、工作包 9 的材料可读性验收）。
  失败回修与停止：回第 7 段开发修；需要新增审查轮时停，退回定方向。
  成本：executor=独立测试者；estimate_min=10；hard_cap_min=30；
    resources=工作区、基线提交；observation=退出码与断言输出；retry_cap=1；evidence_tier=命令级。
  资源来源：仓内文件。
  为什么不能再简：一条命令判六问、镜头登记与方向轨不变。

- [ ] **AC-006 C11 修复入库**：承接 P8；关联 FR-006。
  落点：P8/T011、P8/T012 与 `phases/P8-C11修复入库.md`；全 AC 末验在 P9/T018。
  判定方式：机器可判（指纹）＋需真实环境，可用自动化采集判（页面打开）。
  目标：`docs/examples/c11-ui/` 有 v15 五件、v11/v12 两份样式、载体 `app/ui/` 四件、
  来源说明 `SOURCE.md`、交付指纹清单 `delivery.sha256`，共 13 件；`delivery.sha256` 用 12 行相对路径
  覆盖除它自身外的 12 件；镜像提交上 v15 五件与载体四件按 C11 原清单逐字节等于源，
  两份样式逐件与来源比对并留原件；
  来源与交付两份指纹分开校验；N1–N3、R1、R3 有修复证据，R2 有用户接受说明，
  G8、N4、N5 写未修、负责人与恢复条件；维护者与演练能直接打开 v15。
  R1、R3 按工作包 6「旧账逐条处置」“修”；C11 收口索引第 44–46 行把它们记为待接受风险，
  这是旧写法，以本任务决策为准。
  顺序：先修文件（含 N1–N3、R1、R3）→再改 readme 里的哈希（N2）→最后生成 `delivery.sha256`。
  `delivery.sha256` 只写仓内相对路径，并包含 `SOURCE.md`；
  `SOURCE.md` 记录仓外来源路径属合规，它是来源说明，不是交付路径。
  怎么操作：第一步在镜像提交上跑来源校验：
  `cd docs/examples/c11-ui && shasum -a 256 -c /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c11-gap-repair-20261112/quality/evidence/c11-final-v15.sha256`
  `cd docs/examples/c11-ui/carrier && grep ' app/ui/' /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c11-gap-repair-20261112/quality/evidence/c11-final-carrier.sha256 | shasum -a 256 -c -`
  第二步在修复提交上跑交付校验：`cd docs/examples/c11-ui && shasum -a 256 -c delivery.sha256`；
  两份样式不在 C11 两份清单覆盖范围内，逐件源/入库比对见
  `quality/tests/2026-11-13-p8-fingerprint-check.output` 第 4 段（两份均 MATCH）；
  第三步 `python3 -m http.server --directory docs/examples/c11-ui <端口>`，
  用隔离浏览器打开 `http://127.0.0.1:<端口>/v15/2026-11-11-002-t019-v15-pending-busy-index.html` 截图关键区域。
  什么条件：先跑 `shasum -a 256 /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c11-gap-repair-20261112/quality/evidence/c11-final-v15.sha256 /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c11-gap-repair-20261112/quality/evidence/c11-final-carrier.sha256`，
  输出须与收口索引 `c11-closeout-index-v2.md` 第 61、62 行逐字一致。
  许可未核：两处仓外目录没有许可说明文件，grep 无命中（轻研究第 61 行）；
  决定 8 只写“先核来源、最小文件集与许可”，没有已核出处。影响是能否入库。
  owner 是第 8 段开发者，任务 1 第一步先读两处目录的许可说明；
  恢复条件是取得书面许可或用户书面答复；仍不清就停该路径问用户，不得默认通过。
  体积已核：v15 五件共 52K，载体四件约 27K（轻研究第 50–51 行）。
  怎样算通过：三条校验都退出 0 且每行 OK；两份样式逐件比对全 MATCH；页面关键区域显示；来源说明写任务、仓外路径与两份指纹；
  旧账逐条有处置，没有“已通过”与“没修”混写。
  失败信号：任一行 FAILED；页面空白或报错；目录里出现 node_modules、构建产物或证据快照。
  旧账判据：R1 在 390×844 下代码块自动换行、无横向滚动，截图存 `quality/tests/<日期>-p8-r1-wrap.png`；
  R3 打开 `?state=pending` 入口，1 秒后离开等待态，截图存 `quality/tests/<日期>-p8-r3-pending.png`；
  N3 跑 `grep -nE 'AsyncStatePanel|valueTone' docs/examples/c11-ui/carrier/app/ui/primitives.tsx docs/examples/c11-ui/carrier/app/ui/primitives.css`，
  命中结果与 `SOURCE.md` 写的 N3 处置一致（给使用点或删除、去掉或补复测）。
  反例：在临时副本改 v15 一个字节，交付校验必须报 FAILED；
  临时副本去掉换行样式，R1 观察必须看到横向滚动；去掉定时器，R3 等 1 秒后仍停在等待态；
  `SOURCE.md` 写 N3 已删而 grep 仍命中，必须判不一致；
  删掉来源说明，独立审查必须报；`delivery.sha256` 出现仓外绝对路径，必须判失败。
  红测归因：镜像前缺件、交付清单还没生成导致的非零属夹具失败，不记 RED；
  目标 RED 是临时副本改一个字节后 `shasum -a 256 -c` 报 FAILED。
  真跑还是替代：指纹真跑；页面打开真跑静态服务；载体只是源码示例，不证可运行。
  谁判与证据：独立测试者与独立审查者，第 8 段两次提交后；用户确认范围；
  `quality/tests/<日期>-p8-c11-{source,delivery}-sha256.output`、`quality/tests/<日期>-p8-v15-open.png`。
  失败回修与停止：哈希不符回第 8 段开发查是否误改；许可或体积不清停这条路径问用户。
  成本：executor=独立测试者；estimate_min=20；hard_cap_min=45；
    resources=两份 C11 清单、仓外原件、python3、隔离浏览器；observation=逐行 OK 与截图；
    retry_cap=1；evidence_tier=命令级＋截图。
  资源来源：复用 C11 原清单与原件。
  为什么不能再简：来源与交付必须分开判；页面能打开命令判不了。

- [ ] **AC-007 能力清单与漂移映射**：承接 P1；关联 FR-007。
  落点：P1/T001 与 `phases/P1-能力清单.md`；全 AC 末验在 P9/T018。
  判定方式：机器可判（结构与路径）＋只能人读（冷读）。
  目标：`docs/ui-frontend-capabilities.md` 每项能力一行，写能力、所属阶段、触发条件、产物、验收、
  当前状态、本任务承接、原卡验收归属；C09、C10 行写“不声称已重验”；
  verify-code 对到写代码终末检查，ui-project-init 对到项目规范初始化；维护者是阶段方法负责人；
  组件规范源写“目标项目根下的组件规范”。第 2–9 段作者把它当范围输入。
  怎么操作：`npx vitest run tests/contract/ui-frontend-capabilities.test.mjs`；
  测试读表格，逐行核必填格非空、状态取四值之一、引用的技能与阶段路径在仓库存在；
  再由独立读者只拿清单答三道固定抽问（标准答案都能从清单读出，来源是决定 9 的能力到包映射）：
  问一：C11 缺口修复由哪个包承接、阶段消费者是谁？答：工作包 6，消费者是入库与收口。
  问二：C09 双路径原卡验收归谁、本任务是否重验？答：归原任务，本任务写“不声称已重验”。
  问三：PRD 里的 verify-code 对到哪里？答：写代码阶段的终末检查，只映射、不恢复。
  什么条件：PRD 只读；状态列初值按仓库现状写（多为“未接线”或“部分”）。
  怎样算通过：退出 0；十一项能力全在；两条漂移有去向；读者只看清单答对三问，任一问要翻 PRD 才答得出算没过。
  失败信号：缺行、空格、状态出四值外、引用路径不存在；读者答不出。
  反例：内存副本清空一项触发条件，测试必须报出该行；
  内存副本把一条路径改成不存在的技能，测试必须报；C09 行删“不声称已重验”，测试必须报。
  真跑还是替代：命令真跑；读者冷读是人读。
  谁判与证据：独立测试者与独立读者，第 1 段改完后；`quality/tests/<日期>-p1-capabilities-{red,green}.output`、
  `quality/tests/<日期>-p1-capabilities-cold-read.md`（与第 1 段卡一致）。
  失败回修与停止：回第 1 段开发修；要新增能力或改 PRD 历史时停，退回定方向。
  成本：executor=独立测试者＋独立读者；estimate_min=20；hard_cap_min=45；
    resources=PRD、仓库技能目录；observation=退出码与读者答复；retry_cap=1；evidence_tier=命令级＋人读。
  资源来源：仓内 PRD 与技能目录。
  为什么不能再简：路径存在可机判，读者能否看懂只能人读。

- [ ] **AC-008 两入口真实演练与六组破坏**：承接 P9；关联 FR-008。
  落点：P9/T013、P9/T014 与 `phases/P9-真实演练与对账.md`；全 AC 末验在 P9/T018。
  判定方式：需真实环境，可用自动化采集判。
  目标：用 v15 工作副本与 `/Users/Hugh/Downloads/UI` 设计源，只真跑两个真实入口：写代码阶段与审查阶段；
  定方向、写需求、排阶段三阶段改用第 3、4、5 段契约测试证明（验收 1、2、3 的 GREEN 原件），不再逐阶段留材料。
  与旧口径的差异：决定 10 原写“按新方法走四个阶段”，各阶段都留材料；
  用户 2026-11-13 答复“A 瘦身版”显式收窄为两入口，原件 任务库 `quality/evidence/human-confirmations/2026-11-13-003-build-plan-p9-scope-change.json`；
  旧口径仍留在决策记录原件，本条不改写它。代价：定方向、写需求、排阶段三阶段只有契约测试证据，没有真实走一遍。
  正常路径走完，六组破坏各被指定位置拦住并留信号；用户与最终验收者能回读证据。
  怎么操作：第一步写 Downloads/UI 与 v15 的区域映射；第二步复制 v15 到任务证据区演练副本，
  用 `python3 -m http.server` 打开；第三步走正常路径，再逐组破坏：
  ①删设计源——定方向第 1 步与细节审查报“缺设计源”（定方向侧由验收 1 契约测试证；真跑侧由审查第②问拦）；
  无稿且未记用户接受风险时，不得进入直接实现；
  ②删视觉验收——排阶段第 7、9 步报“缺六项验收”（排阶段侧由验收 3 契约测试证；真跑侧只由写代码第 6 步拦，审查侧不设拦点）；
  ③按钮被遮挡但可点——写代码第 6 步设计对照与审查第③问判失败；
  ③变体：删写代码阶段的截图与差异原件——审查第③问须报“缺视觉证据”；
  ④在演练副本改坏或删除数据文件——页面进入失败态；真跑侧由写代码第 6 步与审查第⑥问拦，写需求接线验收由验收 2 契约测试 GREEN 原件证；
  另改一个数据值，刷新后页面显示新值；
  ⑤复制组件不沉淀——写代码第 7 步与审查第⑤问报“缺组件沉淀结论”；
  ⑥390 宽下键盘到不了主操作（给主按钮加 `tabindex="-1"`）——写代码与审查第④问拦住；只做这一种。
  每组用独立的 v15 副本与独立的演练任务根，互不污染。
  六组破坏全部保留，每组仍须被对应阶段或审查拦住，并留拦住信号（`block-signal.md` 首行“拦住位置：…”），不弱化；
  审查侧拦点覆盖①③④⑤⑥，只有②（缺六项验收）不在审查侧：①→审查第②问，③→第③问，④→第⑥问，
  ⑤→第⑤问，⑥→第④问；②的排阶段侧由验收 3 契约测试证，真跑侧只由写代码第 6 步拦；
  ①的定方向侧由验收 1 反例契约测试证，④的写需求侧由验收 2 的契约测试 GREEN 原件证；
  每组真跑侧按上面各组写明的拦点留信号，审查拦点走审查阶段入口（`review --action=record`）；两侧都缺即本组失败；
  入口被拒记 `unavailable`，本组不算通过。
  入口命令（第 9 段已核）：`node tools/cli/stage-runtime.mjs status --action=begin --stage=<阶段> --project=workflowhub --task=<任务> --task-path=<任务根>`；
  阶段核对：`node tools/cli/check-stage-steps.mjs --stage=<阶段> --task-path=<任务根> --material-root=<材料根>`。
  三份原件 `entry.output`、`stage-checks.output`、`block-signal.md` 只对真跑的两个入口与六组破坏要求。
  正常路径逐项记前端质量结果，写进 `quality/evidence/rehearsal/$DAY-normal/frontend-quality.md`；
  按固定顺序 13 行，每行“项名：结论｜原件路径”，项名与第 9 段任务 2 门禁逐字相同（不带空格）：
  组件质量图、1440无控制台错误、390无控制台错误、无横向滚动、390主操作不裁切可到达、键盘可达、
  焦点可见、可访问名非空、LCP读数、CLS读数、INP读数、200%缩放、物理读屏。
  结论只取“通过”“失败”“不可用”；“不可用”行须写负责人与恢复条件。
  正常路径走完后起一个后续演练任务，留 C02 知识检索采用与 C08 新版规范读取各一次真实记录。
  什么条件：固定浏览器、系统默认字体、缩放 100%、视口 1440×900 与 390×844、固定数据；
  不碰生产数据；入库 v15 交付指纹不变。
  怎样算通过：两个真跑入口与每组破坏都有真实入口调用事实、技能触发、下游读回与拦住信号；
  定方向、写需求、排阶段三阶段的契约测试 GREEN 原件在场；
  改值页面变、坏数据显示失败态。
  200% 缩放或物理读屏缺行，或没有原件却写“通过”，即失败。
  第④组看 `$DAY-group-4/` 下三张截图 `value-changed.png`、`bad-data.png`、`file-deleted.png`，
  依次是新值、失败态、失败态。
  失败信号：只读文档不真跑；手工补写材料；某组没人拦；用示意图代设计源；把 C09、C10 写成已重验。
  反例：删掉设计源仍走完两入口且判通过，必须判失败；删掉视觉验收仍判通过，必须判失败。
  真跑还是替代：真跑；对不上设计源时退等价样例须用户确认，并写明它不能证明什么。
  谁判与证据：用户与未参与实现的独立验收者，第 9 段跑完后；
  六组判定记录 `quality/evidence/rehearsal/$DAY-rehearsal-groups.md`（每项一行，写原件路径与行号）；
  `quality/evidence/rehearsal/` 下 `$DAY-entry/`、`$DAY-normal/`（只含写代码与审查两入口）、`$DAY-followup/`、
  `$DAY-group-1/` 至 `$DAY-group-6/` 与 `$DAY-group-1-variant/`；
  交付指纹前后两份 `quality/tests/$DAY-p9-rehearsal-delivery-sha256-before.output`
  与 `-after.output`（每行 OK）；其余 `quality/tests/$DAY-p9-rehearsal-*.output`。
  失败回修与停止：某组没拦住，回对应 Phase（①→第 3、7 段，②→第 5 段，③⑥→第 6 段，
  ④→第 4、6 段，⑤→第 6、7 段）修方法，不改演练判据；设计源不可用且用户未确认替代时停该路径。
  成本：executor=独立验收者；estimate_min=120；hard_cap_min=240；
    resources=v15 副本、Downloads/UI、python3、隔离浏览器、用户确认；
    observation=入口调用事实、拦住信号、截图；retry_cap=1；evidence_tier=真实环境采集。
  资源来源：复用 C11 v15 与用户给定设计源，不新造样例。
  为什么不能再简：两入口已按用户答复收窄；六组各拦在不同位置，少一组就有一处无证。

- [ ] **AC-009 逐包收敛方案卡**：承接 P2；关联 FR-009。
  落点：P2/T002 与 `phases/P2-方案卡收敛.md`；全 AC 末验在 P9/T018。
  判定方式：机器可判（正文契约）＋只能人读（冷读）。
  目标：定方向第 9 步写十格方案卡与冷读五问，答不出算未收敛；模板有方案卡格式；
  十列台账与五类分析机器形状不变；只改 make-decision。
  怎么操作：`npx vitest run tests/contract/module-convergence-card.test.mjs` 先 RED 后 GREEN；
  独立读者拿收敛卡第 1 包（`convergence-cards.md` 第 27–47 行）只读卡答五问；
  再读旧版“目标：支持 UI；验收：通过”与删掉“方案与取舍”格的副本；
  最后 `test -s /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-stage-integration-20261113/quality/tests/<日期>-p2-start-head.txt && git diff --name-only "$(cat /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-stage-integration-20261113/quality/tests/<日期>-p2-start-head.txt)"..HEAD` 核第 2 段写集
  （基点是本段开工时记录的 HEAD；取不到记 incomplete）。
  什么条件：第 1 段已合入。
  怎样算通过：退出 0；断言命中十格名、五问、“答不出即未收敛”；十列台账字段与基线逐字相同；
  读者对第 1 包答出五问，并指出旧版缺方案、验收、反例；改动文件只在第 2 段写集内。
  失败信号：断言失败；读者答不出；改到写需求或排阶段文件。
  反例：删掉方案格的副本，读者冷读必须失败；内存副本删“白话复述”格，断言必须变红。
  真跑还是替代：命令真跑；冷读是人读，复用现成卡不新造样张。
  谁判与证据：独立测试者与独立读者，用户抽查；`quality/tests/<日期>-p2-convergence-card-{red,green}.output`、
  `quality/tests/<日期>-p2-cold-read.md`。
  失败回修与停止：回第 2 段开发修；要推广到其它阶段时停，另开任务。
  成本：executor=独立测试者＋独立读者；estimate_min=25；hard_cap_min=60；
    resources=工作区、收敛卡；observation=退出码与读者答复；retry_cap=1；evidence_tier=命令级＋人读。
  资源来源：复用收敛卡第 1 包。
  为什么不能再简：冷读能否答出只能人读；删方案反例证它不是走过场。

- [ ] **AC-010 修基线红测**：承接 P2；关联 FR-010。
  落点：P2/T003 与 `phases/P2-方案卡收敛.md`；全 AC 末验在 P9/T018。
  判定方式：机器可判。
  目标：定方向第 8 步补“不可用与用户选择已具名”句，老测试 T026 由红转绿，原句不删。
  怎么操作：改前跑 `npx vitest run tests/contract/n10-process-repair.test.mjs` 得 exit 1；
  改后跑同一命令。
  什么条件：基线 998614bd 已知 1 failed / 23 passed（轻研究第 26 行）。
  怎样算通过：改后退出 0；`git diff 998614bd -- tests/contract/n10-process-repair.test.mjs` 无输出。
  失败信号：仍 exit 1；测试文件被改。
  反例：删掉补的那句再跑，T026 必须重新失败。
  真跑还是替代：真跑。
  谁判与证据：独立测试者；`quality/tests/<日期>-p2-t026-{red,green}.output`。
  失败回修与停止：回第 2 段开发修正文；不改测试。
  成本：executor=独立测试者；estimate_min=5；hard_cap_min=15；
    resources=工作区；observation=退出码；retry_cap=1；evidence_tier=命令级。
  资源来源：既有测试。
  为什么不能再简：已是单条命令。

- [ ] **AC-011 能力清单抽样对账**：承接 P9；关联 FR-007。
  落点：P9/T016 与 `phases/P9-真实演练与对账.md`；全 AC 末验在 P9/T018。
  判定方式：机器可判（结构）＋只能人读（状态与仓库事实对照）。
  目标：清单状态列按第 2–8 段实际结果更新；孤儿能力归到具体修复包并补行为验收；
  C11 行与第 8 段结果一致；C02、C08 各引一份第 9 段后续演练任务留下的采用或读取原件。
  怎么操作：再跑 `npx vitest run tests/contract/ui-frontend-capabilities.test.mjs`；
  独立读者抽 5 行，打开该行引用的阶段文件与演练证据，核状态是否属实（用户答复“A 瘦身版”收窄自逐行 11 条，
  原件 任务库 `quality/evidence/human-confirmations/2026-11-13-003-build-plan-p9-scope-change.json`）。
  抽样规则：抽 4 行能力加 1 条漂移映射——有真实下游的行、状态为“部分”或“未接线”的行（取本任务改动最大、最可疑的一行）、
  C09 或 C10 只接入口的行、孤儿归修复包的行；另从清单的漂移映射小节抽 1 条映射（它不是能力表的行）；
  若某类无对应行写“无”。
  未抽到的行记“未逐行核对”，不声称已核对。
  什么条件：第 1–8 段与 AC-008 已完成。
  怎样算通过：退出 0；抽到的四行能力状态有仓库或演练原件可指；
  抽到的那条漂移映射，目标路径存在且该处正文承接旧名，不按状态判；抽样覆盖五类；
  每项孤儿都归到具体修复包并有行为验收；C02、C08 引的是演练原件；未抽行标“未逐行核对”。
  失败信号：状态与原件不符；孤儿只登记不修；拿“报告存在”代替下游采用。
  反例：把一项未接线写成“已接线”，读者按引用文件必须推翻；
  C02 行删掉演练引用，测试或读者必须报。
  真跑还是替代：命令真跑；状态真伪靠人读原件。
  谁判与证据：未参与写作的独立读者，用户抽查；`quality/tests/<日期>-p9-capabilities-reconcile.md`。
  失败回修与停止：状态不符回第 9 段开发改清单；孤儿回对应 Phase 补；要新增能力时停。
  成本：executor=独立读者；estimate_min=15；hard_cap_min=30；
    resources=清单、阶段文件、演练证据；observation=抽样 5 行对照结论；retry_cap=1；evidence_tier=命令级＋人读。
  资源来源：复用前段产出。
  为什么不能再简：抽样已按用户答复收窄；五类各有不同失真方式，少一类就漏一种。

- [ ] **AC-012 非 UI 任务零额外动作**：承接 P9；关联 FR-011。
  落点：P9/T015 与 `phases/P9-真实演练与对账.md`；全 AC 末验在 P9/T018。
  判定方式：需真实环境，可用自动化采集判。
  目标：一个纯后台样例任务按新方法，与基线方法相比不多步骤、问题、审查镜头或必填字段。
  只真跑写代码与审查两个入口；定方向、写需求、排阶段三阶段由第 3、4、5 段契约测试的非 UI 断言证明。
  怎么操作：第 9 段任务 1（编号 T013）选一个仓内已有的纯后台小任务材料作样例并写死路径；
  核不到记 unknown，写原因与 owner（第 9 段开发）；
  从写代码 `status --action=begin` 与审查 `review --action=record` 两个真实入口跑，记录实际问题与审查镜头；
  同样例在基线 998614bd 的方法下这两处的问题与镜头按方法正文读出，二者逐项对照；
  再跑 `ui-stage-{make-decision,build-prd,build-plan,build-code,review}` 五个契约测试的非 UI 断言；再把该样例错标成 UI，看是否被识别为误判。
  什么条件：第 3–7 段已合入；样例不含页面、路由、组件、样式。
  怎样算通过：两入口的问题与镜头与基线逐项相同，没有出现五行卡、六项或六问块；五个契约测试退出 0；
  错标 UI 被写代码第 1 步或审查识别为误判。
  排阶段第 5 步：非 UI 任务写“不适用＋一句理由”后直接继续，不等答复、不新增确认；
  该步的“需要真实答复”标记只表示 UI 路径下需要答复（与第 5 段卡一致）。
  失败信号：任何阶段出现 UI 问题、UI 字段或设计镜头；错标未被识别；
  非 UI 任务在第 5 步停下等答复。
  反例：在样例的定方向材料里硬加一张五行卡，审查必须指出“非 UI 被硬塞”。
  真跑还是替代：真跑；真实入口不可用记 `unavailable`，本验收不算通过。
  谁判与证据：未参与实现的独立验收者；`quality/evidence/rehearsal/$DAY-nonui/build-code/entry.output`（含写代码与审查两次入口）
  与对照表 `quality/evidence/rehearsal/$DAY-nonui-compare.md`。
  失败回修与停止：哪个阶段多了动作就回承接该阶段的 Phase 修；不改判据。
  成本：executor=独立验收者；estimate_min=45；hard_cap_min=90；
    resources=纯后台样例、基线提交；observation=两入口问题与镜头对照及三阶段契约测试非 UI 断言；retry_cap=1；evidence_tier=真实环境采集。
  资源来源：复用仓内已有样例，不新造。
  为什么不能再简：契约测试只证正文，真实执行是否多问只能跑一次看。

> 判定器映射见「需求到任务追踪」；各 Phase 卡照抄本处命令，不另写第二份判据。

## Appendix B — 需求与编号对照

正文中文编号与机器编号在这里一一对应。

| 正文编号 | 机器编号 | 说明 |
| --- | --- | --- |
| 原始需求第 1–16 条 | R-001–R-016 | 原始消息第 5–25 行；索引见需求摘要第 22–39 行 |
| 变更 1–4 | U-001–U-004 | 决策记录「后来改了什么，原件在哪里？」节 |
| 需求 1 | FR-001 | 定方向 UI 支路 |
| 需求 2 | FR-002 | 写需求 UI 任务链 |
| 需求 3 | FR-003 | 排阶段 UI Phase 六项 |
| 需求 4 | FR-004 | 写代码截图对照与前端质量 |
| 需求 5 | FR-005 | 审查 UI 六问与设计镜头 |
| 需求 6 | FR-006 | C11 修复入库 |
| 需求 7 | FR-007 | 能力清单、漂移映射与对账 |
| 需求 8 | FR-008 | 两入口真实演练 |
| 需求 9 | FR-009 | 逐包收敛方案卡 |
| 修基线红测 | FR-010 | 分段大纲答复第 23 行；任务库 `quality/evidence/build-plan/2026-11-13-003-phase-outline-answer.md`（sha256 `9e8097662feccb2f676d0603b40451b6863cba90c5ffe41689783e953c11d54f`） |
| 非 UI 不变 | FR-011 | 横跨第 3–7、9 段 |
| 验收 1 | AC-001 | 定方向 UI 支路 |
| 验收 2 | AC-002 | 写需求 UI 任务链 |
| 验收 3 | AC-003 | 排阶段 UI 验收 |
| 验收 4 | AC-004 | 写代码截图对照与前端质量 |
| 验收 5 | AC-005 | 审查 UI 六问与设计镜头 |
| 验收 6 | AC-006 | C11 修复入库 |
| 验收 7 | AC-007 | 能力清单与漂移映射 |
| 验收 8 | AC-008 | 两入口真实演练与六组破坏 |
| 验收 9 | AC-009 | 逐包收敛方案卡 |
| 验收 10 | AC-010 | 修基线红测 |
| 验收 11 | AC-011 | 能力清单抽样对账 |
| 验收 12 | AC-012 | 非 UI 任务零额外动作 |
| 第 1 段 | P1 | 能力清单先列 |
| 第 2 段 | P2 | 方案卡收敛办法与修基线红测 |
| 第 3 段 | P3 | 定方向 UI 支路 |
| 第 4 段 | P4 | 写需求 UI 任务链 |
| 第 5 段 | P5 | 排阶段 UI 验收 |
| 第 6 段 | P6 | 写代码截图对照与前端质量 |
| 第 7 段 | P7 | 审查 UI 六问与设计镜头 |
| 第 8 段 | P8 | C11 修复入库 |
| 第 9 段 | P9 | 真实演练与清单对账 |
| 包 1–9 | WP1–WP9 | 决策记录「编号对照」节工作包行 |
| 决定 1–11 | D-001–D-011 | 决策记录「编号对照」节决定行 |
| 风险 1 | RISK-01 | 改写受保护原句打红老测试 |
| 风险 2 | RISK-02 | 非 UI 任务被硬塞 UI 字段 |
| 风险 3 | RISK-03 | 契约测试通过却没真接线 |
| 风险 4 | RISK-04 | C11 许可、体积不清污染主仓 |
| 风险 5 | RISK-05 | 能力清单成第二权威或过期 |
| 风险 6 | RISK-06 | Downloads/UI 与 v15 对不上 |
| 未定 1 | OPEN-01 | 真实入口精确命令与非 UI 样例路径 |
| 未定 2 | OPEN-02 | Downloads/UI 与 v15 区域对应 |
| 未定 3 | OPEN-03 | C11 入库最终文件清单 |
| 未定 4 | OPEN-04 | 新契约测试文件名 |
| 待决 1 | PEND-01 | 新文件登记（已关闭） |
| 待决 2 | PEND-02 | 组件规范去处（已关闭） |
| 待决 3 | PEND-03 | 设计可开工标记（已关闭） |

- **FR-001**：关联 R-003、D-001–D-003、AC-001、AC-012。
- **FR-002**：关联 R-004、R-007、D-004、AC-002、AC-012。
- **FR-003**：关联 R-004、U-004、D-005、AC-003、AC-012。
- **FR-004**：关联 R-005、U-004、D-006、AC-004、AC-012。
- **FR-005**：关联 R-008、D-007、AC-005、AC-012。
- **FR-006**：关联 R-002、R-006、U-003、D-008、AC-006。
- **FR-007**：关联 R-001、R-002、R-006、R-009、D-009、AC-007、AC-011。
- **FR-008**：关联 R-002、R-006、R-009、R-012、U-003、U-004、D-010、AC-008。
- **FR-009**：关联 R-014、R-016、R-012、D-011、AC-009。
- **FR-010**：关联分段大纲答复第 23 行（任务库 `quality/evidence/build-plan/2026-11-13-003-phase-outline-answer.md`（sha256 `9e8097662feccb2f676d0603b40451b6863cba90c5ffe41689783e953c11d54f`））、AC-010。
- **FR-011**：关联 R-009、R-012 与决定 1 成本边界“非 UI 任务零额外步骤”、工作包 1 与 3 的非 UI 反例、AC-012。
