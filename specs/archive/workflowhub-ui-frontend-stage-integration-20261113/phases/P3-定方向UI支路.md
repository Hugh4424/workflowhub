# Phase P3 — 定方向认出 UI 任务，并在决策记录里留下设计依据

本文件写给第 3 段的开发者、独立测试者与第 4–7 段作者。
读完要能找到定方向要追加的 UI 支路、五个写入文件、判据、非 UI 反例与失败恢复。

## 哪些节必须写，哪些可以省？

本文件按 Phase 模板选节表写满八个必填节与两个条件必填节。

| 二级节 | 状态 | 说明 |
| --- | --- | --- |
| 这一 Phase 交出什么？ | written | 结果、非目标、前后状态、边界、风险 |
| 这一 Phase 怎么验收？ | written | 验收 1 一段，含非 UI 反例与失败回修 |
| 为什么现在做，依据是什么？ | written | 决策记录工作包 1 的决定 1–3 |
| 开始前读什么？ | written | 第 2 段交回的三件与触发条件段 |
| 每个文件由谁改，先做什么？ | written | 七个写入路径与先写者第 2 段 |
| 怎么验证？ | written | 同一测试的 RED 与 GREEN，加既有测试单文件 |
| 下一消费者拿什么继续？ | written | 交第 4–7 段的五行卡节名与第 10 步正文 |
| 验收 Phase 才能做的检查 | not-applicable | 本段不是末验收段，归第 9 段 |
| 每张任务卡怎么写？ | written | 任务 4 一张卡 |
| 机器字段（校验器用，人可跳过） | written | 文件末 |

## 这一 Phase 交出什么？

交一条只在 UI 任务时才走的支路：定方向认出页面任务，并在决策记录里写下设计依据。
术语：UI 指用户界面（页面、路由、组件、样式）；AC 指规格里的验收条款；FR 指功能需求；RED 指改前先跑出的目标失败；GREEN 指改后同一命令通过；
JSON、YAML 是步骤表与依赖表的文件格式。

- **本 Phase 结果**：定方向方法第 1 步写三来源判定与五行卡，首问带设计源；
  第 3、5、9 步写设计源四路与无稿须用户选；第 8 步分诊标出 UI 包；
  第 9 步给 UI 包在“数据与状态”“成功失败验收”两格补设计源、对照项、通过失败与反例，
  验收五问加子问“设计源和对照基准可用吗”（工作包 1「方案与取舍」：“第 9 步的验收五问只加一个子问”）；第 10 步细节审查加设计审查镜头；
  第 2、4、11–15 步各追加一行条件式 UI 引用（工作包 1「方案与取舍」“十五步里 UI 任务只多这些动作”一段）：
  第 2 步“UI 任务时调研顺带查现有页面、路由、组件与规范；非 UI 跳过”；
  第 4 步“UI 任务时设计源四路选择与无稿风险并进骨架四查落位；非 UI 跳过”；
  第 11 步“出现 UI 术语或争议时才质询；非 UI 跳过”；
  第 12–15 步“UI 任务时写稿、核对、最终确认、交接各引一行「UI 范围与设计基准」；非 UI 跳过”。
  第 3 步已在四路范围内，另加“设计源或还原口径不清才加外部调研”的条件句，不重复。
  决策记录模板在「原始需求」之后多一节「UI 范围与设计基准」。
  五行卡是五行固定内容：是否 UI 与依据、页面与路由与组件、设计源与提供者与可用时间、
  验收基准、缺什么与风险。
- **非目标**：不做形式化“设计稿可开工”确认，也不加字段（澄清答复第 23 行，
  处置原件 `quality/evidence/build-plan/2026-11-13-005-spec-pending-dispositions.md`第 10–11 行）；
  方向审查不加 UI 问，维持四问（决策记录工作包 5：方向审查不加 UI 问，维持现有四问）；
  `skills/plan-design-review/SKILL.md` 触发条件归第 7 段写入集（本段允许改动的文件清单），本段不碰。
- **改动前**：第 1 步只有一句“按三个来源识别 UI”，不留任何东西，也不问设计稿；
  细节审查不查 UI 需求与设计源是否收敛（决策记录工作包 1「现状缺口」）。
- **改动后**：UI 任务多出五行卡、首问里一个设计源问题、两格补充与一个审查镜头；
  第 6、7 步与基准 998614bd 逐字相同；其余步只多带 UI 前提的条件行，非 UI 任务执行路径无新增动作。
- **与相邻 Phase 的边界**：上游第 2 段交回第 9 步十格方案卡与修好的第 8 步。
  本段在其上追加 UI 支路；交给第 4–7 段的是节名「UI 范围与设计基准」与第 10 步镜头正文。
- **主要风险**：追加时改写了受断言保护的原句，使 `make-decision-flow` 等老测试变红。
  替代走法：只在原句之后另起一句追加；变红就按第 2 段交回的原字节恢复该段再追加。
- **下一步**：第 4 段开发读模板新节名开工；第 7 段开发读第 10 步镜头正文开工。
- **动手前必读**：决策记录「工作包 1：定方向时认出 UI，并留下设计依据」；
  `workflows/make-decision/SKILL.md:102`、`:120`、`:126`、`:136`、`:144`、`:162`、
  `:168`、`:217`、`:227`、`:233`、`:240`、`:245`、`:251`
  （第 1–5、8–15 步锚点）；决策记录工作包 1「方案与取舍」“十五步里 UI 任务只多这些动作”一段（各步 UI 引用原文）；
  `skills/design-source-readiness/SKILL.md:10`、
  `skills/frontend-prototype-render/SKILL.md:10`（「方法」段）。
- **未决事实**：`unknown` — `workflows/make-decision/skill-deps.yaml` 当前未登记
  design-source-readiness 与 frontend-prototype-render（grep 无命中）；
  影响是要新增依赖条目，必须跑 skill-deps 四条检查；在任务 4 动作第 4 步处理。

## 这一 Phase 怎么验收？

假设本段做完、测试也过，真实任务会不会走支路仍没证明；那一面归第 9 段演练第①组。
本段只证验收 1；验收 12（非 UI 零额外动作）归第 9 段，本段的非 UI 基线比对只是“供件”。
供件的意思是：本段只提供材料给后段用，不算本段承接的验收。

成本账：验收 1 的七字段见 spec Appendix A 的 AC-001「成本」，estimate_min=10，hard_cap_min=30，
retry_cap=1。
既有测试单文件十一条加 skill-deps 四条，估 15 分钟；共享准备 5 分钟，重试预留 10 分钟。

- `acceptance_cost_total=40 active_min`：10 + 15 + 5 + 10，串行；只有一个判定面，不并行。
- `phase_budget={soft_min:30,hard_min:60,source:provisional}`：
  软上限取承接 AC 的 hard_cap_min 之和（AC-001 为 30），硬上限取其两倍；规则未经用户校准。
  本文软上限取承接 AC 的 hard_cap_min 之和，偏保守；
  第 9 段因并入跨段分项改用另一种口径；两套都标 provisional，未经用户校准。
  40 超过软上限 30，未超硬上限 60。根因是 spec「测试计划」规定本段跑十一条既有单文件，
  改了 skill-deps.yaml 另跑四条依赖检查，共 15 分钟。
  这些都是单文件、各判一个不同的受保护面，没有重复验证；删任一条就漏掉对应回归面，所以不再拆。
- `execution_budget={window_minutes:unknown,command_cap:unknown,wait_cap:unknown,retry_reserve:10}`：
  执行策略未从定方向取得具体答复，前三项写 unknown，交 build-code 按真实任务定。

资源账：工作区、基线提交 998614bd、主仓 node_modules，全在仓内，不新造样张。
范围账：本条只证本段三件方法正文与模板一节；真实触发归第 9 段。

**验收 1：定方向写出 UI 支路，非 UI 路径原字节不变**

目标：第 4–7 段作者在定方向方法里读到三源判定、五行卡、首问设计源、设计源四路、
无稿须用户选与第 10 步设计审查镜头，并在模板「原始需求」之后读到「UI 范围与设计基准」一节。
怎么操作：改正文前先写测试并跑 `npx vitest run tests/contract/ui-stage-make-decision.test.mjs`，
得目标 RED；改完再跑同一命令；再逐条跑下方「怎么验证？」列的既有测试单文件。
什么条件：工作区根执行；基线 998614bd；第 2 段已合入；`npx vitest` 解析到主仓 node_modules。
怎样算通过：GREEN 退出 0；断言命中第 1 步三源与五行卡、第 1 步首问含设计源、
四路与“无稿须用户选”、四路各自必填证据（决定 3“设计源固定四路，没有稿必须你自己选”）、第 8 步标 UI 包、第 9 步两格补设计源与验收子问、
steps.json 第 8、9 项同义句、第 10 步设计审查镜头、模板新节；
四路必填证据逐路命中：内部稿写标“可开发”的页面或区块与注解；外部稿写来源、版本、可用范围与验收基准；
沿用页面写页面、路由、版本；无稿写用户所选路线与后果；四路都写来源、负责人、可用时间、验收基准与缺项；
无稿直接实现须有“用户明确接受风险”的答复，未取得不进入直接实现（决定 3：“没有设计稿直接做，必须你明确接受风险”）；
第 2、4、11–15 步各有一行以 UI 前提开头、写明“非 UI 跳过”的引用，steps.json 对应项同义；
第 6、7 步与 `git show 998614bd:<文件>` 原文逐字相同；第 2–5、8–15 步去掉本段新增的条件行后与基线逐字相同；
既有测试单文件不比 004/031 基线差、不新增基线清单外的失败用例名。
故意弄坏一处：测试内对内存副本删掉五行卡“设计源”一行，检查函数必须报出该行缺失；
内存副本给第 6 步加一句“须附设计稿”，基线比对断言必须变红；
内存副本把第 12 步 UI 引用的“UI 任务时”前提删掉、改成无条件句，条件检查必须变红；
内存副本删掉“无稿须用户选”，必须报缺；内存副本删掉外部稿的“版本”必填项，必须报缺；
内存副本把无稿路线写成“直接实现”并删掉“用户明确接受风险”句，条件检查必须变红；内存副本删掉 steps.json 第 9 项的 UI 补格句，必须报缺。
反例只改内存副本，不改磁盘。
非 UI 反例：测试取 998614bd 版各步可见结果与 steps.json 对应 `observable_result`，与改后逐行比：
新增行必须每行都以 UI 前提开头并写“非 UI 跳过”，否则判“非 UI 任务多出动作”；
第 6、7 步多出任何一句、或任一原句被改写，同样判红。
写入集核对：本段开发动笔前第一步在工作区根执行
`git rev-parse HEAD > /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-stage-integration-20261113/quality/tests/<日期>-p3-start-head.txt`；
验收最后在工作区根跑
`test -s /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-stage-integration-20261113/quality/tests/<日期>-p3-start-head.txt && git diff --name-only "$(cat /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-stage-integration-20261113/quality/tests/<日期>-p3-start-head.txt)"..HEAD`，只列本段写入集。
`test -s` 非零（基点文件缺失或为空）即基点缺失，记 incomplete 并停这条核对，不得凭空判过。
真跑还是替代：真跑命令；它只证方法写了，不证真实任务会触发，后者由验收 8 第①组判。
谁判与证据：未参与第 3 段实现的独立测试者，第 3 段审查改完后判；
原件 `quality/tests/<日期>-p3-ui-stage-make-decision-{red,green}.output`。

失败回修与停止：新测试或既有测试变红，回第 3 段开发同一会话修正文，不改测试断言；
要改断言须用户真实答复。修后重跑新测试与变红那条既有测试。
发现非加一个步骤或一道门才写得进时停手，退回定方向。
红测归因：改前新测试因具名句缺失失败算目标 RED；既有测试按基线读数原件判，不比基线差且新增失败名不在基线失败名单里，否则算本段目标行为回归；
找不到 vitest 或 node_modules 算环境失败，另记不算 RED；测试文件语法错算夹具失败，修测试后重取 RED。

## 为什么现在做，依据是什么？

写需求、排阶段、写代码、审查都要读同一份设计依据；它必须先在定方向写出来，下游才有东西可读。

- **结果**：UI 任务在决策记录里留下五行卡，后四段直接读，不另建对象。
- **非目标**：不新建阶段、检查门、第二份 UI 台账或状态对象（决策记录工作包 1 决定 1）。
- **与其它 Phase 的区别**：第 2 段改第 9 步卡的通用形状；本段只追加 UI 才走的条件句。
- **依据**：决策记录工作包 1 决定 1（唯一共享输入）、决定 2（三源）、决定 3（四路）。
- **依据**：澄清答复第 20 行（Q-06）：允许新增可选 UI 字段，只在 UI 任务时非空。
- **依据**：澄清答复第 23 行（Q-09）与处置原件 `quality/evidence/build-plan/2026-11-13-005-spec-pending-dispositions.md`
  第 10–11 行：可开工标记只是设计源里的标注。
- **依据**：分段大纲答复第 13 行：与第 2 段同改两件，先 2 后 3。

## 开始前读什么？

| 材料或锚点 | 本 Phase 用它做什么 | 读取时机 |
| --- | --- | --- |
| `phases/P2-方案卡收敛.md` 的「下一消费者拿什么继续？」 | 读第 2 段交回的三件当前原件与第 9 步十格名 | 开工前 |
| 决策记录「工作包 1」 | 读五行卡、三源、四路与成本边界原文 | 写测试前 |
| `workflows/make-decision/SKILL.md:102`、`:217` | 读第 1 步与第 10 步原句，定追加位置 | 动笔前 |
| `skills/design-source-readiness/SKILL.md:10` | 读「方法」段的触发条件原句 | 改触发条件前 |
| `skills/frontend-prototype-render/SKILL.md:10` | 同上 | 改触发条件前 |
| `tests/contract/make-decision-flow.test.mjs`、`ui-source-consumption.test.mjs` | 读受保护原句，避免改写 | 动笔前 |
| `docs/ui-frontend-capabilities.md` 的 C04、C05 行 | 读本段承接的能力范围 | 开工前 |

## 每个文件由谁改，先做什么？

本段唯一 writer 是第 3 段开发；先写新测试取 RED，再改正文。

- **新增**：`tests/contract/ui-stage-make-decision.test.mjs`，消费者是独立测试者与第 9 段。
- **修改**：`workflows/make-decision/SKILL.md`，在第 1–5、8–15 步原句后追加 UI 条件句；
  第 2、4、11–15 步只追加一行条件式引用，原句不改、不加字段（工作包 1「方案与取舍」“十五步里 UI 任务只多这些动作”一段）；
  消费者是定方向执行者与第 7 段。
- **修改**：`workflows/make-decision/steps.json`，只在第 1–5、8–15 项
  `observable_result` 末尾追加 UI 条件句。
  第 2、4、11–15 项也落：各项可见结果是该步正文的同义投影，只改正文会让两处不一致。
  第 2 段只写第 9 项，所以第 2、4、11–15 项本段是唯一写者；第 9 项仍按下面先后规则。
  第 8、9 项入范围的依据：决策记录工作包 1“第 8、9 步只对 UI 包”一句点名第 8、9 步；两格“数据与状态”“成功失败验收”
  是第 9 步五类分析列，`SKILL.md:169` 与 steps.json 第 9 项可见结果都写这组列；第 8 项是分诊，标出 UI 包。
  第 9 项先写者是第 2 段（方案卡句），本段后写，只在第 2 段字节之后追加 UI 补格句。
- **修改**：`skills/decision-log/templates/decision-log-template.md`，在「原始需求」节之后加一节；
  消费者是第 4 段写需求方法。
- **修改**：`workflows/make-decision/skill-deps.yaml`，登记设计源准备与原型渲染两个依赖。
- **修改**：`skills/design-source-readiness/SKILL.md`、
  `skills/frontend-prototype-render/SKILL.md`，
  只改「方法」段的触发条件，加“定方向第 1 步判为 UI 时”。
- **禁止改动**：`tests/contract/n10-process-repair.test.mjs` 等既有测试，只跑不改。
- **禁止改动**：`skills/plan-design-review/SKILL.md`，归第 7 段。
- **禁止改动**：第 2 段写的第 8 步补句与第 9 步十格方案卡，不改写，只在其后追加。

跨段共享路径的先后：`workflows/make-decision/SKILL.md`、
`workflows/make-decision/steps.json`、
`skills/decision-log/templates/decision-log-template.md` 三件先写者是第 2 段，后写者是本段。
依据是 spec「谁先谁后？」节“第 2→3 串行：两段都写 `workflows/make-decision/SKILL.md`
与决策记录模板；先写者第 2 段”与分段大纲答复第 13 行；同文件不同步仍算共享。
第 2 段交回三件的已核实当前字节；本段开工前读回，读不回写 unknown 与原因，不阻断。
本段在第 2 段字节之上只追加，不改第 2 段的句子。

- **读集**：上表七处锚点。
- **定序写主**：同批次只有第 3 段开发；跨段重叠见上方先后登记。
- **接口符号清单**：N/A — 改的是 Markdown、JSON 与 YAML 正文，测试只读文件，无共享函数。
- **合并责任**：第 3 段开发提交七件；冲突回第 3 段开发。
- **progress_cursor**：只指向任务事实库 `facts.jsonl` 的 `phase_progress`，本文件不保存进度值。

## 怎么验证？

用改后真实正文与 998614bd 基线跑同一测试：RED 看具名句缺失，GREEN 看退出 0、新增行都带 UI 前提、第 6、7 步与基线逐字相同。

开工前四要素：验证层是正文契约；命令见下表；预期 RED 非零、GREEN 0；失败条件是具名断言失败或既有测试变红。

| 目标 | Task | 角色 | gate_cmd 与预期退出码 | 判据与证据路径 |
| --- | --- | --- | --- | --- |
| 定方向写出 UI 支路 | 任务 4 | RED | `npx vitest run tests/contract/ui-stage-make-decision.test.mjs` 与非零 | ORACLE-MD-UI 与 `quality/tests/<日期>-p3-ui-stage-make-decision-red.output` |
| 定方向写出 UI 支路 | 任务 4 | GREEN | 同一命令与 `0` | ORACLE-MD-UI 与 `quality/tests/<日期>-p3-ui-stage-make-decision-green.output` |

改后逐条跑这些既有测试单文件，判据是不比基线差，且新增失败名不在基线输出原件的失败名单里。
基线读数原件是任务库 `quality/tests/2026-11-13-004-baseline-summary.tsv`；
本表里基线本来非零的是 n10-finite-check-acceptance、
final-chain-runner、knowledge-graph-stage-wiring、local-skill-resolver、
check-skill-consistency；
n10-process-repair 基线非零（T026），第 2 段合入后应为 0：

```bash
npx vitest run tests/contract/make-decision-flow.test.mjs
npx vitest run tests/contract/make-decision-flows.test.mjs
npx vitest run tests/contract/n10-process-repair.test.mjs
npx vitest run tests/contract/n11-discussion-quality.test.mjs
npx vitest run tests/contract/light-upgrade-entry.test.mjs
npx vitest run tests/contract/authoring-shape.test.mjs
npx vitest run tests/acceptance/n10-finite-check-acceptance.test.mjs
npx vitest run tests/contract/check-stage-steps.test.mjs
npx vitest run tests/contract/final-chain-runner.test.mjs
npx vitest run tests/contract/ui-source-consumption.test.mjs
npx vitest run tests/contract/design-source-extraction-wiring.test.mjs
node --test tests/contract/ui-skill-contract.test.mjs
npx vitest run tests/contract/knowledge-graph-stage-wiring.test.mjs
npx vitest run core/__tests__/local-skill-resolver.test.mjs
node tools/cli/check-skill-consistency.mjs --root /Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-stage-integration-20261113
```

覆盖上限：只证方法与模板写了 UI 支路且非 UI 原字节不变。
显式不覆盖：不证真实任务会触发支路（归第 9 段），不证设计源真的可用。

失败了怎么办：

- **风险**：追加句落在受断言保护的原句中间，`make-decision-flow` 或 `n10-process-repair` 变红。
- **影响**：定方向既有契约失效，第 2 段刚转绿的 T026 可能重新变红。
- **缓解**：只在原句后另起一句；每改一个文件跑一次相关单文件。
- **回滚**：第 3 段开发只撤回本段追加的 hunk，恢复到第 2 段交回的字节，保留第 2 段内容与失败原件。
- **补救与交接**：恢复后重新追加，重跑新测试与变红那条既有测试。
- **触发条件**：任一既有测试单文件改后非零，或基线比对断言报非 UI 路径变化。

## 下一消费者拿什么继续？

第 4–7 段按下面三件开工，原件都在本段写入集里。

- **第 4 段开发**：读模板新节名「UI 范围与设计基准」与五行卡五个行名，写需求方法按此节名读。
- **第 5 段开发**：读五行卡“设计源”“验收基准”两行，排阶段的缺源仍审句引用这两行。
- **第 7 段开发**：读 `workflows/make-decision/SKILL.md` 第 10 步追加的设计审查镜头原句，在镜头计划里登记。
- **第 9 段**：读本段 GREEN 原件与非 UI 基线比对结果，作演练第①组与验收 12 的输入。
- 未完成项：真实触发未证明，记 `incomplete`，由第 9 段演练承接。

## 每张任务卡怎么写？

### 任务 4：给定方向加 UI 才走的支路，并在决策记录留下五行卡

为什么做：后四段要读同一份设计依据，现在定方向不留任何 UI 事实，对应 FR-001、AC-001。
交付什么：定方向第 1–5、8–15 步、steps.json 对应项与模板写出 UI 支路；缺句时新测试具名报出。
不做什么：不改非 UI 路径原句，不碰第 2 段写的句子与 `skills/plan-design-review/SKILL.md`。
前置：第 2 段交回的三件当前字节；依赖任务 2、任务 3。
怎么做：先写新测试取 RED，再在第 1 步原句后追加三源判定与五行卡句。
怎么验收：跑本卡门禁命令，RED 非零、GREEN 0，再跑既有测试单文件不比 004/031 基线差、不新增基线清单外的失败用例名。
证据：RED 与 GREEN 原件各一份；它们不证明真实任务会触发支路。
下游（含何时停）：第 4–7 段读节名与第 10 步正文；非加步骤或门才写得进时停手，退回定方向。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T004
- **来源 / FR / AC**：决策记录工作包 1 决定 1–3；R-003、U-002；FR-001；AC-001。
  三源任一命中即按 UI 处理，三源都没有须写非 UI 理由；无稿必须用户自己选；非 UI 零额外步骤、问题与镜头。
- **输入**：第 2 段（任务 2、任务 3）交回的 `workflows/make-decision/SKILL.md`、`steps.json`、
  模板三件当前字节；基线 998614bd 原文；决策记录工作包 1；能力清单 C04、C05 行。
  producer 是第 2 段开发，consumer 是本段开发；执行 owner 是第 3 段开发，开工前读回。
- **文件 / 符号**：修改 `workflows/make-decision/SKILL.md`，符号：第 1–5、
  8–15 步锚点 step-load-context 至 step-closeout；
  修改 `workflows/make-decision/steps.json`，符号：第 1–5、8–15 项的 observable_result；
  修改 `skills/decision-log/templates/decision-log-template.md`，符号：N/A — 非代码模板，
  「原始需求」节后加一节；
  修改 `workflows/make-decision/skill-deps.yaml`，符号：两条依赖条目；
  修改 `skills/design-source-readiness/SKILL.md`、
  `skills/frontend-prototype-render/SKILL.md`，符号：N/A — 非代码，只改「方法」段触发条件；
  新增 `tests/contract/ui-stage-make-decision.test.mjs`，符号：
  测试内检查函数 checkMakeDecisionUi。
- **动作**：0. 本段开发动笔前第一步在工作区根执行
  `git rev-parse HEAD > /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-stage-integration-20261113/quality/tests/<日期>-p3-start-head.txt`，失败即停手记 incomplete；1. 先写测试：读七处真实正文，断言具名句；对内存副本做下方「场景」列出的各处反例；
  用 `git show 998614bd:<文件>` 取基线，逐字比非 UI 路径；跑门禁命令留 RED。
  2. 第 1 步原句后追加三源判定、五行卡与首问设计源；三源都缺记“未知”加负责人，不默认非 UI。
  3. 第 3、5 步追加设计源四路与无稿须用户选；第 8 步追加“分诊标出 UI 包”；
  第 9 步在第 2 段方案卡段之后追加 UI 包两格补充与验收五问子问；第 10 步追加设计审查镜头；
  第 2、4、11–15 步各追加一行“UI 任务时……；非 UI 跳过”的引用，
  内容照决策记录工作包 1「方案与取舍」“十五步里 UI 任务只多这些动作”一段；
  第 5 步四路逐路写必填证据与负责人，无稿直接实现须先记用户明确接受风险（决定 3“设计源固定四路，没有稿必须你自己选”）。
  4. steps.json 第 1–5、8–15 项 `observable_result` 末尾追加同义条件句（第 9 项排在第 2 段句后）；
  skill-deps.yaml 登记两个依赖。
  5. 模板「原始需求」节后加「UI 范围与设计基准」一节，写五行；两处技能触发条件加定方向判为 UI 时。
  6. 跑门禁命令取 GREEN，再跑既有测试单文件。
- **输出 / 失败**：UI 任务读得到五行卡与四路；非 UI 路径逐字不变；缺句、多句或既有测试出现基线外新失败都具名报出。
  回滚只撤本段追加 hunk，恢复到第 2 段交回字节。
- **边界 / 禁止改动**：既有测试只跑不改；`skills/plan-design-review/SKILL.md` 归第 7 段；
  第 2 段的第 8 步补句与第 9 步十格方案卡不改写；不加机器必填字段，可选 UI 字段只在 UI 任务时非空。
- **依赖**：T002、T003
- **测试层级 / 技能**：正文契约（测，AC-001，门禁命令）；非 UI 原字节（测，基线比对，同一命令）；
  既有回归（测，单文件列表）；浏览器面不测，理由是本段只改方法正文；主测试技能 backend-testing。
- **场景 / 夹具或服务**：正例是改后七件真实字节；反例是内存副本删五行卡“设计源”行、
  给第 6 步加“须附设计稿”、删“无稿须用户选”、删 steps.json 第 9 项 UI 补格句、把第 12 步引用改成无条件句、删外部稿“版本”、
  无稿直接实现删风险接受句；基线取 998614bd；反例不写盘，无需清理。
- **RED/GREEN 门禁命令**：`npx vitest run tests/contract/ui-stage-make-decision.test.mjs`
- **预期退出码**：RED nonzero; GREEN 0；RED 须是具名句缺失，vitest 解析失败算环境失败另记。
- **RED 目标失败**：ORACLE-MD-UI；断言第 1 步含五行卡与首问设计源，改前正文无此句而失败。
- **GREEN 判定器**：ORACLE-MD-UI 具名句全命中、新增行都带 UI 前提、四路必填证据与无稿风险接受句命中、第 6、7 步与基线逐字相同；
  各内存反例（含无条件引用）报具名缺口。
- **证据**：`quality/tests/<日期>-p3-ui-stage-make-decision-red.output`、
  `quality/tests/<日期>-p3-ui-stage-make-decision-green.output`
- **覆盖上限**：不证真实任务触发支路，不证设计源可用，不证第 7 段镜头登记。
- **停止 / 恢复**：第 2 段交回字节读不回时写 unknown 并按当前 HEAD 读，不阻断；
  非加步骤或门才写得进时停，交定方向；既有测试红回第 3 段开发同一会话修，不改断言。
- **完成**：前置（不作完成条件）：开工基点文件已记，写入集核对命令以 `test -s` 起头跑过；门禁命令真跑，RED 与 GREEN 原件在，
  既有测试单文件不比 004/031 基线差、不新增基线清单外的失败用例名。
  完成条件（只写效果）：AC-001 的下游作者在模板与第 1、10 步读到五行卡、四路与镜头；
  各内存反例被具名报出；第 2、4、11–15 步引用都带 UI 前提，第 6、7 步与基线逐字相同；真实触发记 `incomplete`，归第 9 段。

## 机器字段（校验器用，人可跳过）

- **全局规格**：`spec.md#实现设计全局权威`
- **写入集**：`workflows/make-decision/SKILL.md`；
  `workflows/make-decision/steps.json`；
  `skills/decision-log/templates/decision-log-template.md`；
  `workflows/make-decision/skill-deps.yaml`；
  `skills/design-source-readiness/SKILL.md`；
  `skills/frontend-prototype-render/SKILL.md`；
  `tests/contract/ui-stage-make-decision.test.mjs`
- **依赖**：P2
- **消费者**：第 4–7 段作者、第 9 段演练
- **gate_cmd**：`npx vitest run tests/contract/ui-stage-make-decision.test.mjs`
- **oracle**：ORACLE-MD-UI
- **evidence_path**：planned:
  `quality/tests/<日期>-p3-ui-stage-make-decision-green.output`
- **STOP**：非加步骤或门才写得进时停，退回定方向；测试红回第 3 段开发修正文，不改断言；
  环境失败另记，不算 RED。
- **覆盖 AC**：AC-001
- **Done**：前置（不作完成条件）：开工基点文件已记，写入集核对命令以 `test -s` 起头跑过；门禁命令真跑，RED 与 GREEN 原件在，
  既有测试单文件不比 004/031 基线差、
  不新增基线清单外的失败用例名。
  完成条件（只写效果）：AC-001 的五行卡、四路、镜头与模板一节可读，各处内存反例被具名报出，
  非 UI 路径逐字不变；证据 `quality/tests/<日期>-p3-ui-stage-make-decision-green.output`；
  真实触发 `incomplete`，归第 9 段。
