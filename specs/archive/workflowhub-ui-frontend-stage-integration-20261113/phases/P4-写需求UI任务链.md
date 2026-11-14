# Phase P4 — 写需求遇到 UI 时排出任务链，后台任务不多一段

本文件写给第 4 段的开发者、独立测试者与第 5 段作者。
读完要能找到要追加的两个时点、任务卡模板改哪里、判据与失败恢复。

## 作者开工五问的答案是什么？

这五问按 `skills/spec-plan/references/authoring-contract.md` 写，答案只管本段。

1. 为谁做：第 4 段开发者（唯一写主）与独立测试者；其次是第 5 段作者。
2. 他拿它干什么：开发者在写需求第 2、4 步追加 UI 任务链条件段，并改 PRD 空卡模板；
   测试者跑新契约测试与既有单文件，留原件。
3. 读到哪里会卡：第 3 段交回的五行卡节名；底座触发条件“跨多页或多任务”；
   哪些既有测试在基线就非零（见「怎么验证？」，读数来自 004 与 031 原件）。
4. 失败怎么恢复：新测试红回第 4 段开发修正文；既有测试出现基线外的新失败名，
   按基线恢复该段再改为追加；需要第二份 PRD 才写得下时停，退回定方向。
5. 哪些话只有内行懂：“前端底座”指先用样例数据和统一数据接口把界面撑起来；
   “接线”指假数据换真数据、假动作换真动作；“五行卡”在下文首现处解释。

## 哪些节必须写，哪些可以省？

本文件按 Phase 模板选节表写满八个必填节与两个条件必填节。

| 二级节 | 状态 | 说明 |
| --- | --- | --- |
| 作者开工五问的答案是什么？ | written | 本段五问短答 |
| 这一 Phase 交出什么？ | written | 结果、非目标、前后状态、边界、风险 |
| 这一 Phase 怎么验收？ | written | 验收 2 一段，另含非 UI 反例检查 |
| 为什么现在做，依据是什么？ | written | 决策记录工作包 2 与第 3 段产出 |
| 开始前读什么？ | written | 写需求三件、PRD 模板、五行卡节名 |
| 每个文件由谁改，先做什么？ | written | 五个写入路径，无跨段共享 |
| 怎么验证？ | written | 新契约测试 RED/GREEN 与既有测试单文件 |
| 下一消费者拿什么继续？ | written | 交第 5 段的 UI 任务链字段名 |
| 验收 Phase 才能做的检查 | not-applicable | 本段不是末验收段，归第 9 段 |
| 每张任务卡怎么写？ | written | 任务 5 一张卡 |
| 机器字段（校验器用，人可跳过） | written | 文件末 |

## 这一 Phase 交出什么？

写需求的作者遇到 UI 任务时，方法会要求他排出设计任务、前端底座、逐任务接线和页面数据清单。
术语：UI 指用户界面（页面、路由、组件、样式）；AC 指规格里的验收条款；FR 指功能需求；RED 指改前先跑出的目标失败；GREEN 指改后同一命令通过；
PRD 指写需求阶段产出的需求文档；JSON、YAML 是步骤表与依赖表的文件格式。

- **本 Phase 结果**：`workflows/build-prd/SKILL.md` 在出任务地图与写完整 PRD 两个时点
  各追加一段 UI 条件正文；PRD 任务卡模板多一组 UI 任务才填的接线、视觉、组件三段。
  两段合起来写页面清单、设计任务、底座、接线、视觉、组件、设计偏差处置与页面数据清单
  （工作包 2「结果」“页面清单”与决定 4“设计偏差处置”）；
  单页且有设计稿时不排设计任务与底座（工作包 2「验收」“单页且有设计稿的样例，不得被强加设计任务或前端底座”）。
- **非目标**：不另写一份 UI PRD；那会成为第二份需求权威（决策记录工作包 2「方案与取舍」）。
  不新增 PRD 作者，不改审查次数；审查加设计角度归第 7 段。
  不给每个 UI 任务都排前端底座；只在跨多页或多任务时排（决定 4）。
- **改动前**：写需求方法只有一句“涉及 UI 用现有方法展示设计”（`workflows/build-prd/SKILL.md:20`）；
  任务地图没有设计任务、底座与接线，验收能只写“页面能用”。
- **改动后**：方法第 2 步（出地图）写设计任务与底座的触发条件；第 4 步（完整 PRD）
  写每个 UI 任务的接线、视觉、组件三段与页面数据清单；非 UI 路径原字节不变。
- **与相邻 Phase 的边界**：上游第 3 段交回决策记录模板里「UI 范围与设计基准」节名与五行卡行名；
  本段交给第 5 段 PRD 里的 UI 任务链字段名。
  五行卡是定方向写在决策记录里的五行固定内容：是否 UI 与依据、页面与路由与组件、
  设计源与提供者与可用时间、验收基准、缺什么与风险。
- **主要风险**：改写第 2、4 步受断言保护的原句，打红 `build-prd-review-contract` 或 `card-03-current`。
  替代走法：只在原句后追加 UI 条件句，改坏就按 998614bd 原字节恢复该文件再追加。
- **下一步**：第 5 段开发读本段写好的字段名，写排阶段的 UI Phase 六项。
- **动手前必读**：决策记录「工作包 2：写需求时排出 UI 任务链」；`workflows/build-prd/SKILL.md:17-24`；
  `skills/spec-prd/templates/prd-template.md:91-110`（任务卡与空卡模板）。
- **未决事实**：`unknown` — `steps.json` 第 2、4 步可见结果的现有原句是否被测试逐字锁定，
  尚未逐条核；影响是追加位置可能打红老测试；任务 5 动作第 1 步先读断言再动笔。

## 这一 Phase 怎么验收？

假设本段全部做完、测试也通过，真实规划行为仍可能漏；那部分由第 9 段承接：
用 `docs/examples/c11-ui/v15` 做一次规划读回，冻结判据“无设计任务、无前端底座”，
判定人是第 9 段独立验收者；本段对它只是供件。
供件的意思是：本段只提供材料给后段用，不算本段承接的验收。
本文的“验收 2”“验收 12”等编号就是全局 spec 的 AC-002、AC-012（spec Appendix B 对照），不另有本段内部编号。
本段只证验收 2 的正文契约；验收 12（非 UI 零额外动作的演练）归第 9 段，本段对它是“供件”。

成本账：验收 2 的成本七字段见 spec Appendix A 的 AC-002「成本」，
estimate_min=10，hard_cap_min=30，retry_cap=1。
既有测试单文件 4 个加 skill-deps 四条，估 10 分钟；共享准备 5 分钟；重试预留 10 分钟。

- `acceptance_cost_total=35 active_min`：10 + 10 + 5 + 10，串行。
- `phase_budget={soft_min:30,hard_min:60,source:provisional}`：
  软上限取承接 AC 的 hard_cap_min 之和（AC-002 为 30），硬上限取其两倍；规则未经用户校准。
  本文软上限取承接 AC 的 hard_cap_min 之和，偏保守；
  第 9 段因并入跨段分项改用另一种口径；两套都标 provisional，未经用户校准。
  总账 35 超过软上限 30，未超硬上限 60。根因是 spec「测试计划」规定本段跑四条既有单文件，
  另占 10 分钟；每条判一个不同的受保护面，删任一条就漏掉对应回归，所以不再拆。
- `execution_budget={window_minutes:unknown,command_cap:unknown,wait_cap:unknown,retry_reserve:10}`：
  执行策略未从定方向取得具体答复，交 build-code 按真实任务定。

资源账：全用仓内文件与基线提交 998614bd，不新造样张。
范围账：只证本段写入集（本段允许改动的文件清单）的正文与非 UI 原字节。

**验收 2：写需求方法在两个时点写出 UI 任务链**

目标：写需求作者读 `workflows/build-prd/SKILL.md` 与 PRD 模板，能知道 UI 任务要排什么、
接线验收写到多细、页面数据清单归谁写；后台任务读到的步骤与改前一样。
怎么操作：先写测试文件，再在改正文前跑 `npx vitest run tests/contract/ui-stage-build-prd.test.mjs`；
目标 RED 只认具名断言失败，测试文件缺失报错算环境失败；
追加正文后跑同一命令；再跑本段既有测试单文件（见「怎么验证？」）。
什么条件：工作区根执行；node v24.14.0；`npx vitest` 解析到主仓 node_modules；
基线 998614bd；第 3 段已合入，五行卡节名可读。
怎样算通过：命令退出 0；断言命中两个时点（出地图、完整 PRD）、
底座触发条件“跨多页或多任务”、“有稿不排设计任务”、
接线写清页面区域、数据或动作的真假变化与失败态、页面数据清单归 PRD 作者；
页面清单与设计偏差处置两句（工作包 2「结果」与决定 4）；“单页且有设计稿不排设计任务、不排前端底座”句（工作包 2「验收」）；
非 UI 路径的各步可见结果与 `git show 998614bd:workflows/build-prd/SKILL.md` 原文逐字相同。
故意弄坏一处：测试内对内存副本删掉“逐任务接线”句，检查函数必须报出该句缺失；
内存副本把底座条件改成“每个 UI 任务”，断言必须变红；
内存副本删掉“设计偏差处置”句或“单页有稿不排底座”句，必须报缺。
非 UI 反例：内存副本在非 UI 路径加一句“补页面数据清单”，基线比对断言必须变红；
它证明后台任务不多出动作。反例都只改内存副本，不改磁盘。
写入集核对：本段开发动笔前第一步在工作区根执行
`git rev-parse HEAD > /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-stage-integration-20261113/quality/tests/<日期>-p4-start-head.txt`；
验收最后在工作区根跑
`test -s /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-stage-integration-20261113/quality/tests/<日期>-p4-start-head.txt && git diff --name-only "$(cat /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-stage-integration-20261113/quality/tests/<日期>-p4-start-head.txt)"..HEAD`，只列本段写入集。
`test -s` 非零（基点文件缺失或为空）即基点缺失，记 incomplete 并停这条核对，不得凭空判过。
真跑还是替代：命令真跑，证方法写对；真实规划行为由第 9 段用 v15 规划读回证明（供件，不是本段承接）。
谁判与证据：未参与第 4 段写作的独立测试者，第 4 段审查改完后判。
原件 `quality/tests/<日期>-p4-ui-stage-build-prd-{red,green}.output`。

失败回修与停止：新测试变红或既有测试出现基线清单外的新失败用例名，回第 4 段开发同一会话修正文，不改断言求绿；
要改断言须用户真实答复。修后重跑新测试与出新失败的那个既有测试单文件。
需要第二份 PRD 或新增作者才写得下时停手，退回定方向。
红测归因：新测试改前因缺句报具名断言算目标 RED；既有测试按基线读数原件判（final-chain-negatives 基线本来非零），
不比基线差且新增失败名不在基线失败名单里，否则属目标行为回归；
找不到 vitest 算环境失败另记；新测试自身语法错算夹具失败，回开发修测试后重取 RED。

## 为什么现在做，依据是什么？

第 5 段排阶段要读 PRD 里的 UI 任务链字段名，这些字段必须先在写需求方法里定下来。

- **结果**：UI 任务在 PRD 里有设计任务、底座、接线、视觉、组件与页面数据清单的固定去处。
- **非目标**：不写产品 PRD 正文、不写页面代码（决策记录工作包 2「边界」）。
- **与其它 Phase 的区别**：第 3 段写定方向的五行卡；本段读五行卡排任务链；第 5 段排 Phase 六项。
- **依据**：决策记录工作包 2 决定 4“写需求阶段必须安排 UI 任务链”。
- **依据**：spec「阶段大纲」节第 4 段条目：依赖第 3 段，下游是第 5 段。
- **依据**：spec「文件边界」表第 4 段行：本段写入集。

## 开始前读什么？

| 材料或锚点 | 本 Phase 用它做什么 | 读取时机 |
| --- | --- | --- |
| 决策记录「工作包 2」决定 4 | 读决定 4 的必含项与反例 | 开工前 |
| `workflows/build-prd/SKILL.md:17-24` | 找第 2 步（出地图）与第 4 步（完整 PRD）的追加点 | 开工前 |
| `workflows/build-prd/steps.json` 第 2、4 步 | 找可见结果追加点，核原句是否被断言锁定 | 写卡片前 |
| `skills/spec-prd/templates/prd-template.md:91-110` | 找空卡模板与四行验收的追加点 | 写卡片前 |
| `tests/contract/build-prd-review-contract.test.mjs`、`tests/acceptance/card-03-current.test.mjs` | 读受保护原句 | 动笔前 |
| `phases/P3-定方向UI支路.md` 的「下一消费者拿什么继续」 | 读回五行卡节名与行名 | 开工前 |

## 每个文件由谁改，先做什么？

- **新增**：`tests/contract/ui-stage-build-prd.test.mjs`。唯一 writer 是第 4 段开发；
  消费者是独立测试者。
- **修改**：`workflows/build-prd/SKILL.md`，只在第 2、4 步原句后追加 UI 条件段。
- **修改**：`workflows/build-prd/steps.json`，第 2、4 步可见结果只追加 UI 句，不改既有键。
- **修改**：`workflows/build-prd/skill-deps.yaml`，只在 UI 任务时用到既有设计源准备与原型渲染技能才登记；
  没有新依赖就不改，并在回传写明“未改＋理由”。
- **修改**：`skills/spec-prd/templates/prd-template.md`，只在空卡模板加 UI 任务才填的三段。
- **禁止改动**：`workflows/make-decision/**` 与决策记录模板，归第 2、3 段，本段只读。
- **禁止改动**：`workflows/build-plan/**` 与 Phase 模板，归第 5 段。
- **禁止改动**：既有测试文件只跑不改；判据是不比 004/031 基线差，新增失败用例名不在基线清单内。

本段写入集与其它段无共享（spec「文件边界」表第 4 段行写“无共享”）；只有第 4 段开发持笔，无并行组。

- **读集**：上表六处锚点。
- **定序写主**：同批次只有第 4 段开发；无跨段共享路径。
- **接口符号清单**：N/A — 只改 Markdown、JSON 与 YAML 正文，测试只读文件。
- **合并责任**：第 4 段开发提交；冲突回第 4 段开发。
- **progress_cursor**：只指向任务事实库 `facts.jsonl` 的 `phase_progress`，本文件不保存进度值。

## 怎么验证？

用改后真实文件跑同一新契约测试，RED 看具名断言报缺，GREEN 看退出 0；再跑既有测试单文件。

开工前四要素：验证层是正文契约测试；命令见下表；预期 RED 非零、GREEN 退出 0；
失败条件是具名断言失败，或既有测试出现基线清单外的新失败用例名。

| 目标 | Task | 角色 | gate_cmd 与预期退出码 | 判据与证据路径 |
| --- | --- | --- | --- | --- |
| 两个时点写出 UI 任务链，非 UI 不变 | 任务 5 | RED | `npx vitest run tests/contract/ui-stage-build-prd.test.mjs` 非零 | ORACLE-PRD-UI 与 `quality/tests/<日期>-p4-ui-stage-build-prd-red.output` |
| 两个时点写出 UI 任务链，非 UI 不变 | 任务 5 | GREEN | 同命令退出 0 | ORACLE-PRD-UI 与 `quality/tests/<日期>-p4-ui-stage-build-prd-green.output` |

既有测试单文件按任务库 `quality/tests/2026-11-13-004-baseline-summary.tsv` 判：
不比基线差，且新增失败名不在基线输出原件的失败名单里。
基线本来非零的是 `final-chain-negatives`、`knowledge-graph-stage-wiring`、
`local-skill-resolver`，属既有失败；
`check-skill-consistency` 以 031 原件带 `--root` 的读数为基线（尾部 exit 0），004 中不带
`--root` 那行是命令错，不作基线：

- `npx vitest run tests/contract/build-prd-review-contract.test.mjs`
- `npx vitest run tests/acceptance/card-03-current.test.mjs`
- `npx vitest run tests/contract/check-stage-steps.test.mjs`
- `npx vitest run tests/contract/final-chain-negatives.test.mjs`
- 改了 `skill-deps.yaml` 才另跑：
  `node --test tests/contract/ui-skill-contract.test.mjs`、
  `npx vitest run tests/contract/knowledge-graph-stage-wiring.test.mjs`、
  `npx vitest run core/__tests__/local-skill-resolver.test.mjs`、
  `node tools/cli/check-skill-consistency.mjs --root /Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-stage-integration-20261113`。

覆盖上限：只证方法与模板写了 UI 条件段、非 UI 原字节不变。
显式不覆盖：不证真实 PRD 作者会照做，不证接线真的生效；单页有稿的真实规划由第 9 段 v15 读回判，其余由第 9 段演练判。

失败了怎么办：新测试红回第 4 段开发补句；既有测试红说明改到了受保护原句，按基线恢复后改为追加。

- **风险**：追加句落在被逐字锁定的原句中间，既有测试出现基线外新失败用例。
- **影响**：写需求阶段的老合同被破坏，后续任务的 PRD 审查读不到原句。
- **缓解**：动笔前先读两份既有测试的断言，只在段末追加。
- **回滚**：第 4 段开发只撤回变红文件里本段追加的 hunk，按 998614bd 原字节恢复，保留其它文件改动。
- **补救与交接**：恢复后换追加位置，重跑新测试与出新失败的既有测试。
- **触发条件**：任一既有测试单文件出现基线清单外的新失败用例名。
  `final-chain-negatives` 基线本来非零（004 第 022 行），只看它是否新增失败用例。

## 下一消费者拿什么继续？

第 5 段作者从本段取 PRD 里 UI 任务链的字段名，写排阶段 UI Phase 六项的来源。

- **第 5 段开发**：读 `workflows/build-prd/SKILL.md` 第 2、4 步追加段与 PRD 模板 UI 三段的字段名。
- **第 9 段**：读本段 GREEN 原件，演练第④组按这些字段判写需求是否排出接线。
- 未完成项：真实规划行为未证，交第 9 段用 v15 规划读回承接；`skill-deps.yaml` 是否改由开发回传写明。

执行建议（只是建议，是否采用由 build-code 定）：本段只有一个写主，测试一人即可。

## 每张任务卡怎么写？

### 任务 5：在写需求两个时点追加 UI 任务链

为什么做：写需求作者遇到 UI 时不知道要排设计、底座与接线，对应需求 4、需求 7 与验收 2。
交付什么：方法第 2、4 步与 PRD 模板多出 UI 条件段；缺句时新契约测试具名报缺。
不做什么：不改定方向与排阶段文件，不另写 UI PRD，不改既有测试。
前置：第 3 段已合入，从 `phases/P3-定方向UI支路.md` 下游节读回五行卡节名；依赖任务 4。
怎么做：先写新契约测试并跑出 RED，再在第 2 步原句后追加底座与设计任务的触发条件。
怎么验收：跑新契约测试 RED 非零、GREEN 0，再跑四个既有测试单文件不比 004/031 基线差、不新增基线清单外的失败用例名。
证据：RED 与 GREEN 原件放任务库 `quality/tests/`；证据不证真实规划会照做，那一面归第 9 段 v15 读回。
下游（含何时停）：第 5 段读字段名；需要第二份 PRD 或新作者时停，退回定方向。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T005
- **来源 / FR / AC**：决策记录工作包 2 决定 4（写需求阶段必须安排 UI 任务链）；R-004、R-007、U-002；FR-002；
  AC-002。
  底座只在跨多页或多任务时排；有稿不排设计任务；接线必须写页面区域、真假变化与失败态。
- **输入**：第 3 段（T004）交回的五行卡节名；`workflows/build-prd/SKILL.md:17-24` 原字节；
  `skills/spec-prd/templates/prd-template.md:91-110`；基线 998614bd；
  执行 owner 是第 4 段开发，开工时点是第 3 段合入后。
- **文件 / 符号**：新增 `tests/contract/ui-stage-build-prd.test.mjs`，符号：
  测试内检查函数 checkBuildPrdUi 与基线比对；
  修改 `workflows/build-prd/SKILL.md`，符号：第 2、4 步正文；
  修改 `workflows/build-prd/steps.json`，符号：第 2、4 项 observable_result；
  修改 `workflows/build-prd/skill-deps.yaml`，符号：依赖条目，无新依赖则不改；
  修改 `skills/spec-prd/templates/prd-template.md`，符号：N/A — 非代码模板，只改「任务卡」空卡模板。
- **动作**：0. 本段开发动笔前第一步在工作区根执行
  `git rev-parse HEAD > /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-stage-integration-20261113/quality/tests/<日期>-p4-start-head.txt`，失败即停手记 incomplete；1. 读两份既有测试的断言，标出受保护原句。
  2. 写新契约测试：读真实文件断言具名句；`git show 998614bd:` 取基线比非 UI 路径；
  内存副本删“逐任务接线”、底座改“每个 UI 任务”、非 UI 路径加 UI 句、删“设计偏差处置”、删“单页有稿不排底座”（即「场景」字段列出的各处反例）
  ；跑出 RED。
  3. 第 2 步原句后追加设计任务与底座触发条件；第 4 步追加接线、视觉、组件三段、页面清单、设计偏差处置与页面数据清单；
  第 2 步写明单页有稿不排设计任务与底座。
  4. `steps.json` 第 2、4 步可见结果追加对应 UI 句；PRD 模板空卡加 UI 三段。
  5. 跑新测试得 GREEN，再跑既有测试单文件。
- **输出 / 失败**：UI 条件段可读，新测试退出 0；缺句、底座条件写错、非 UI 路径被加句时具名报出；
  回滚只撤回本段追加的 hunk。
- **边界 / 禁止改动**：`workflows/make-decision/**`、决策记录模板归第 2、3 段；
  `workflows/build-plan/**` 与 Phase 模板归第 5 段；既有测试文件不改。
- **依赖**：T004
- **测试层级 / 技能**：正文契约（测，关联 AC-002，命令见门禁）；非 UI 原字节（测，同命令）；
  浏览器面（不测，本段无页面）；主测试技能 backend-testing。
- **场景 / 夹具或服务**：正例是改后真实文件字节；反例是内存副本删“逐任务接线”、底座改“每个 UI 任务”、非 UI 路径加 UI 句、
  删“设计偏差处置”、删“单页有稿不排底座”；
  基线由 `git show 998614bd:` 取，不落盘；无搭建与清理。
- **RED/GREEN 门禁命令**：`npx vitest run tests/contract/ui-stage-build-prd.test.mjs`
- **预期退出码**：RED nonzero; GREEN 0；RED 须是缺 UI 条件句的具名断言，找不到 vitest 算环境失败另记。
- **RED 目标失败**：ORACLE-PRD-UI；断言第 2 步含“跨多页或多任务”，改前缺句而失败。
- **GREEN 判定器**：ORACLE-PRD-UI 两个时点与底座条件、有稿不排设计任务、接线三项、
  页面数据清单归属、页面清单、设计偏差处置、单页有稿不排底座均命中，非 UI 路径与基线逐字相同；「场景」字段列出的各处内存反例均报红。
- **证据**：`quality/tests/<日期>-p4-ui-stage-build-prd-red.output`、
  `quality/tests/<日期>-p4-ui-stage-build-prd-green.output`
- **覆盖上限**：不证真实 PRD 作者照做（单页有稿规划读回归第 9 段），不证接线生效，不证审查加设计角度（归第 7 段）。
- **停止 / 恢复**：既有测试出现基线外新失败用例时回第 4 段开发按基线恢复后改为追加；
  需要第二份 PRD 或新作者时停，退回定方向；不改断言求绿。
- **完成**：前置（不作完成条件）：开工基点文件已记，写入集核对命令以 `test -s` 起头跑过；新测试真跑并留 RED 与 GREEN 原件；
  四个既有测试单文件不比 004/031 基线差、不新增基线清单外的失败用例名。
  完成条件（只写效果）：独立测试者用同一命令重放 GREEN；「场景」字段列出的各处反例均变红；
  第 5 段能从方法正文读到 UI 任务链字段名。

## 机器字段（校验器用，人可跳过）

- **全局规格**：`spec.md#实现设计全局权威`
- **写入集**：`workflows/build-prd/SKILL.md`；`workflows/build-prd/steps.json`；
  `workflows/build-prd/skill-deps.yaml`；
  `skills/spec-prd/templates/prd-template.md`；
  `tests/contract/ui-stage-build-prd.test.mjs`
- **依赖**：P3
- **消费者**：第 5 段作者、第 9 段演练
- **gate_cmd**：`npx vitest run tests/contract/ui-stage-build-prd.test.mjs`
- **oracle**：ORACLE-PRD-UI
- **evidence_path**：planned:
  `quality/tests/<日期>-p4-ui-stage-build-prd-green.output`
- **STOP**：需要第二份 PRD 或新作者时停，退回定方向；测试红回第 4 段开发修正文，不改断言。
- **覆盖 AC**：AC-002
- **Done**：前置（不作完成条件）：开工基点文件已记，写入集核对命令以 `test -s` 起头跑过；门禁命令真跑，RED 与 GREEN 原件在；
  四个既有测试单文件不比 004/031 基线差、不新增基线清单外的失败用例名。
  完成条件（只写效果）：AC-002 由独立测试者重放 GREEN，「场景」字段列出的各处反例变红；档位未执行记 incomplete。
