# Phase P7 — 审查在 UI 任务时问六件事，并登记设计镜头

本文件写给第 7 段开发者与独立测试者。
读完要能找到改哪四件文件、跑哪条命令，以及失败了交给谁。
作者开工五问沿用 `phases/P6-前端质量判据.md`「作者开工五问的答案是什么？」，本段只补差异：
卡点是第 3 段写的定方向第 10 步与第 6 段写的写代码第 8 步，两者都要先读到再动笔；
“设计镜头”指细节审查时专门看设计源、视觉证据与组件的一组审查问题；
“镜头计划”指 `skills/wh-review/stage-skill-plan.json` 里每个阶段登记的审查轨与镜头。

术语：“写入集”指本段允许改的文件清单；RED 指改正文前应失败的那次测试运行，GREEN 指改后同一测试通过；
AC、FR 是规格附录里验收与需求的机器编号，只出现在卡末；LCP、CLS、INP 是浏览器测的加载与交互速度指标。
## 哪些节必须写，哪些可以省？

本文件按 Phase 模板选节表写必填节与条件必填节。

| 二级节 | 状态 | 说明 |
| --- | --- | --- |
| 这一 Phase 交出什么？ | written | 六问块、三来源触发、细节轨设计镜头 |
| 这一 Phase 怎么验收？ | written | 验收 1 命令部分、验收 2 人读部分 |
| 为什么现在做，依据是什么？ | written | 需求 5、全局验收 5、决定 7 |
| 开始前读什么？ | written | 第 3、5、6 段交接与审查四件 |
| 每个文件由谁改，先做什么？ | written | 五个写入路径，唯一写主 |
| 怎么验证？ | written | 同一测试 RED 与 GREEN，加既有命令改前改后读数 |
| 下一消费者拿什么继续？ | written | 交第 9 段 |
| 验收 Phase 才能做的检查 | not-applicable | 本段不是末验收段，归第 9 段 |
| 每张任务卡怎么写？ | written | 任务 1、任务 2 |
| 机器字段（校验器用，人可跳过） | written | 文件末 |

## 这一 Phase 交出什么？

交出一份在 UI 任务时多问六件事的审查方法，三个阶段问同一套六件、深度不同，不新增审查轮。

- **本 Phase 结果**：审查方法有只在 UI 任务时出现的六问块：
  ①是不是 UI；②设计稿齐不齐；③视觉证据有没有；④前端质量过不过；
  ⑤组件有没有复用和沉淀；⑥功能有没有真接线（原文见决策记录工作包 5「方案与取舍」）。
  写需求时问计划里有没有，排阶段时问验收里有没有，写代码时问实际证据有没有。
  设计审查技能的调用范围补上定方向与写代码；
  它的 UI 触发条件改为按三来源判 UI 适用性（决定 3 归本段，第 3 段不碰）。
  三来源是原始要求里的页面或交互、项目真实路由与组件、已接受计划或实际前端改动；
  任一命中即触发，三来源都缺记“未知”加负责人，不默认非 UI。
  细节审查设计镜头登记进
  定方向审查合同与镜头计划；方向审查维持原四问。
  审查记录写清读了哪些材料、看了哪些页面、哪些没看。
- **非目标**：不新增一轮 UI 审查。决策记录工作包 5「方案与取舍」已否决（“单独加一轮 UI 审查，成本高”），理由是成本高；
  六问挂进现有审查轮即可覆盖。
- **改动前**：审查方法没有 UI 问题；设计审查只覆盖写需求与排阶段；
  代码审查镜头没有设计；审查记录不写看没看页面（决策记录工作包 5「现状缺口」）。
- **改动后**：UI 任务的三处审查各问六件；看不到页面时，截图只支持视觉对照，
  交互、无障碍、性能、控制台与真实接线各项记“未读”或“不可用”，补证据再判。
  非 UI 任务的审查与基线逐字相同。
- **与相邻 Phase 的边界**：上游第 3 段交定方向第 10 步，第 6 段交写代码第 8 步设计审查角度；
  本段交六问块与镜头登记；第 9 段用它跑演练第①、③、④、⑤、⑥组的审查拦截（第⑥组前端质量破坏由第④问判），
  其中“缺视觉证据”由第③组的“删截图与差异”变体判。
- **主要风险**：改动定方向审查合同时误动方向轨，让方向审查多出 UI 问。
  替代走法：方向轨一字不碰，只在细节轨追加设计镜头；测试用基线逐字比对方向轨。
- **下一步**：第 9 段演练者用本段方法审演练材料。
- **动手前必读**：`spec.md` 的「文件边界」与验收 5；决策记录工作包 5「审查加 UI 六问」全节；
  `skills/wh-review/SKILL.md`「输入与方法」「输出和失败边界」；
  `skills/plan-design-review/SKILL.md:15`；
    `skills/wh-review/contracts/make-decision.md`；
  `skills/wh-review/stage-skill-plan.json:4-27`。
- **未决事实**：`unknown` — 第 3 段第 10 步与第 6 段第 8 步的最终正文要等两段合入才能读；
  影响是镜头引用的步骤名可能对不上；任务 1 开工时核实，对不上回原段开发者。

## 这一 Phase 怎么验收？

假设本段全部实现、命令全部通过，真实审查能否审出缺陷仍会漏。
那部分由第 9 段演练第①、③、④、⑤、⑥组判，本段只证审查方法与登记写全了。

六件写法见 `workflows/build-plan/SKILL.md` 的「设计每个 Phase 的验收」；
判据唯一权威是 `spec.md` Appendix A 的验收 5，本节只照抄命令并展开。

**验收 1：六问块、镜头登记写全，方向轨不变**

目标：审查方法有只在 UI 时出现的六问块，三个阶段问法不同；
镜头计划里定方向细节轨含设计镜头；方向轨与基线逐字相同；
审查记录要求写读了什么、看了哪些页面、哪些没看，并有“材料存在不当已读”句。

怎么操作：在工作区根依次跑下列单文件命令。

```bash
npx vitest run tests/contract/ui-stage-review.test.mjs
npx vitest run tests/contract/card03-review-orchestration.test.mjs
npx vitest run tests/contract/prototype-design-review.test.mjs
npx vitest run tests/contract/stage-id-removal.test.mjs
npx vitest run tests/contract/page-audit-wiring.test.mjs
npx vitest run tests/n2-skill-catalog-portability.test.mjs
npx vitest run tests/contract/build-prd-review-contract.test.mjs
npx vitest run tests/contract/n10-process-repair.test.mjs
```

`page-audit-wiring` 与 `n2-skill-catalog-portability` 照 `spec.md`「测试计划」第 7 段补入：
前者读 `plan-design-review`，后者读 `stage-skill-plan.json`，都在本段写入集里。
本段不改任何 `skill-deps.yaml`，所以不跑 skill-deps 四条检查。

第一条改正文前跑一次得 RED，改后跑一次得 GREEN；其余只在改前、改后各跑一次。

什么条件：第 3、6 段已合入；node v24.14.0、vitest 2.1.9；`npx vitest` 解析到主仓依赖；
基线提交 998614bd。基线读数逐条见 任务库 `quality/tests/2026-11-13-004-baseline-summary.tsv` 与 `quality/tests/2026-11-13-031-baseline-check-skill-consistency-root.output` 原件。
本段命令里基线就非零的是 `card03-review-orchestration`、`stage-id-removal`、
`n10-process-repair`，属既有失败；
`n10-process-repair` 第 2 段修后应为 0，本段改前先记当时读数；
`page-audit-wiring`、`n2-skill-catalog-portability` 不在基线表里，改前先跑并留读数原件。

怎样算通过：GREEN 退出 0，断言命中六问名、三个阶段各自的问法、
镜头计划中定方向细节轨含设计镜头、方向轨与基线逐字相同、“材料存在不当已读”句、
“没看成记未读或不可用、不算通过”句、截图只支持视觉对照句；
第③④⑤问读第 6 段七项界面判定字段，逐个点名，缺任一项记发现、不算通过；
第③问写“缺截图或差异原件即报缺视觉证据”；
设计审查技能触发条件写三来源、任一命中即触发、三来源都缺记“未知”不默认非 UI；
其余命令不比改前读数差：退出码不由 0 变非零，改后的失败测试名都已在改前读数里；
改前就非零的条目，出现改前没有的新失败名即判回归。
方向轨比对：测试用 `git show 998614bd:skills/wh-review/stage-skill-plan.json` 取原文，
解析后断言方向轨对象与基线深相等；合同文件方向审查段逐行与基线相同。

故意弄坏一处：内存副本从 `stage-skill-plan.json` 删掉设计镜头，断言必须变红；
内存副本给方向轨加一条 UI 问，基线比对必须变红；
内存副本把“材料存在不当已读”改成“材料存在即已读”，断言必须变红；
内存副本删掉第③问的“缺视觉证据”句，或删掉七项字段中的“样式令牌所有者”，断言必须变红；
内存副本把设计审查技能触发条件删回只看一个来源，或把“三来源都缺”改成默认非 UI，断言必须变红。

红测归因：改前 RED 若因缺六问名、缺镜头登记等断言失败，记目标行为失败；
若因测试文件不存在、JSON 解析失败或 `git show` 取不到基线，记夹具或环境失败，不算 RED；
方向轨比对改前就通过，记本来就通过；`n10-process-repair` 若改前已红，
记第 2 段遗留，不算本段 RED，交第 2 段开发者。

真跑还是替代：真跑命令；真实审查行为由第 9 段判。

谁判与证据：未参与实现的独立测试者，在第 7 段审查问题改完后判；
`quality/tests/<日期>-p7-ui-stage-review-red.output`、
`quality/tests/<日期>-p7-ui-stage-review-green.output`，
其余命令改前、改后各留一份：`quality/tests/<日期>-p7-<测试名>-before.output` 与 `-after.output`；
改前读数由本段开发者动笔前取，before 文件首行写取数时点与当时 HEAD；
判定在审查时做，由独立测试者对照两份原件，不让后跑的覆盖先跑的。

**验收 2：看不到页面时审查者知道记什么**

目标：只读审查方法的人能说出看不到页面时怎么记、三个阶段各问多深。

怎么操作：观察协议。独立读者只读 `skills/wh-review/SKILL.md` 新增六问块，回答三问：
写需求、排阶段、写代码三处审查各问到什么证据；
只有截图时，交互与无障碍两项记什么；完整材料是否必须给出发现。
再核写入集：本段开发动笔前先在工作区根跑 `git rev-parse HEAD > /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-stage-integration-20261113/quality/tests/<日期>-p7-start-head.txt`，记下本段开工提交；
基点文件放任务库（路径相对任务库根是 `quality/tests/<日期>-p7-start-head.txt`），不放工作区，免得被一起提交。
审查时跑 `test -s /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-stage-integration-20261113/quality/tests/<日期>-p7-start-head.txt && git diff --name-only "$(cat /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-stage-integration-20261113/quality/tests/<日期>-p7-start-head.txt)"..HEAD`，只看本段开工后的改动；
`test` 非零即基点缺失，本条记 incomplete，不得把空输出当成“只列本段写入集”判过。
开工提交由本段开发者在动笔前记录；记录失败或文件读不到时停手，本条记 incomplete，不改用 998614bd 代替。

什么条件：第 7 段改完；读者未参与写作。

怎样算通过：写入集只在本段五件文件内。
冷读只进证据，不单独构成本条通过或失败（以 spec 验收 5 为准）：读者答出三种深度、
只有截图时交互与无障碍记“未读”或“不可用”并补证据再判、完整材料允许没有发现，记可读；答不出记 finding 交主会话处置。
故意弄坏一处：在临时副本删掉“截图只支持视觉对照”句，读者应答不出第二问并指出缺句；未指出时记 finding。

红测归因：冷读只进证据，读者答不出记 finding 交主会话处置，不单独判本条通过或失败；
基点文件 `test -s` 非零或 `git diff` 读不到提交属环境失败，记 incomplete。

真跑还是替代：人读，按三问复读；`git diff` 真跑。

谁判与证据：独立读者；`quality/tests/<日期>-p7-review-cold-read.md`。

失败回修与停止：断言失败或写入集超出，回第 7 段开发者修正文，修后重跑同一命令；读者答不出记 finding 交主会话处置，
由原判定者重报；不改测试判据求绿。
需要新增审查轮或给方向审查加 UI 问时停，退回定方向原 owner。
同一原因两次失败，先停重复动作，按 AGENTS「卡住与升级」三检查后再改方法。

### 这些验收全部做完要多久、需要谁？

- **成本账**：本段验收 1、2 都属全局验收 5；全局验收 5 引 Appendix A 七字段：executor=独立测试者；
  estimate_min=10；
  hard_cap_min=30；resources=工作区、基线提交；observation=退出码与断言输出；
  retry_cap=1；evidence_tier=命令级。资源来源：仓内文件。
  本段验收 2 冷读是全局验收 5「未看成记未读」判据的人读部分，就地估 10 分钟，来源是本节作者估算。
- **冷读与验收的关系**：冷读记录进本段证据；它是否进入全局验收的判定，以 `spec.md` 附录 A 为准。
- **资源账**：工作区、主仓 node_modules、基线 998614bd；全在仓内，不需就地造。
- **范围账**：两条都证本段交付；真实审查审出四类缺陷是给第 9 段的“供件”（本段只提供材料，验收归另一段）。
- 两条可并行：测试者跑命令，读者冷读，互不写入。
- `acceptance_cost_total=5 + 10 + max(10,10) + 10 = 35 active_min`：共享准备 5 记开工提交；
  改前读数 10；改后 10 与冷读 10 并行；重试预留 10 够整组命令重跑一次；作者估算，非实测。
- 超软上限 30、未超硬上限 60。根因是既有命令改前改后各跑一次；不拆，理由同第 6 段：基点须同一写入集同一开发者。
- `phase_budget={soft_min:30,hard_min:60,variance_threshold:1.5,source:provisional}`。
- 软上限口径：本文软上限取承接验收的 hard_cap_min 之和（偏保守），标 provisional；第 9 段口径不同，见该段。
- `execution_budget={window_minutes:unknown,command_cap:unknown,wait_cap:unknown,retry_reserve:10}`；
  前三项定方向答复未给，回定方向 owner 补，不在此补默认值。
- 用户等待：无。审查等待：第 7 段独立审查，单列，不计入活动分钟。

## 为什么现在做，依据是什么？

第 3–6 段已在四个阶段写出 UI 产物，没有审查去问它们，产物写了也没人判真假。

- **结果**：三处审查在 UI 任务时问六件事，定方向细节审查有设计镜头。
- **非目标**：不新建审查器、不新增审查轮或状态字段。
- **与其它 Phase 的区别**：本段只改审查方法与登记；各阶段自身步骤归第 3–6 段。
- **依据**：需求 5；验收 5；决定 7「审查必须问 UI 六问」；用户 2026-11-13 方向审查不加 UI 问。

## 开始前读什么？

| 材料或锚点 | 本 Phase 用它做什么 | 读取时机 |
| --- | --- | --- |
| 决策记录工作包 5「审查加 UI 六问」全节 | 六问原文、三阶段问法、看不到页面怎么办 | 开工前 |
| 第 3 段写的定方向第 10 步 | 设计镜头核对的对象 | 任务 1 开工前 |
| 第 6 段写的写代码第 8 步 | 代码阶段设计镜头接回点 | 任务 1 开工前 |
| `skills/wh-review/stage-skill-plan.json:4-27` | 找定方向两条轨，只改细节轨 | 任务 2 开工前 |
| `skills/plan-design-review/SKILL.md:15` 与触发条件段 | 补调用范围，改三来源触发 | 任务 2 开工前 |
| `phases/P5-排阶段UI验收.md`「下一消费者」所指排阶段第 9 步 | 读“缺一项仍加设计审查”句，作六问输入 | 任务 1 开工前 |

## 每个文件由谁改，先做什么？

- **新增**：`tests/contract/ui-stage-review.test.mjs`，写主是第 7 段开发者，消费者是独立测试者。
- **修改**：`skills/wh-review/SKILL.md`、`skills/plan-design-review/SKILL.md`、
  `skills/wh-review/contracts/make-decision.md`、
    `skills/wh-review/stage-skill-plan.json`；
  唯一写主是第 7 段开发者；消费者是各阶段独立审查者与第 9 段演练者。
- **禁止改动**：第 3 段写的定方向三件（只读第 10 步）、第 6 段写代码三件（只读第 8 步）、
  其它阶段审查合同、`tools/cli/` 下检查器、全部既有测试。
- **故意不改**：方向轨与方向审查四问一字不改，理由是用户 2026-11-13 决定；
  `contracts/build-prd.md`、`build-plan.md`、`build-code.md` 不改，六问块写在审查方法里由三阶段共用，
  避免同一问题三处定义。
- **共享与先后**：`contracts/make-decision.md` 与镜头计划只有本段写；
  它们引用的定方向第 10 步正文由第 3 段先写完，本段后读。
- **依赖**：第 3、6 段（读其正文，不写其文件）。
- **可并行面**：与第 8 段无共享文件，可并行；本段内先任务 1 再任务 2。
- **回退办法**：去掉六问块与细节轨设计镜头条目，按提交撤回本段 hunk；方向轨本来未动。

## 怎么验证？

用工作区真实字节跑新契约测试，改前看断言失败，改后看退出 0，再跑既有测试，按改前读数防回退。

开工前四要素：验证层是正文契约测试；命令见验收 1；预期 RED 非零、GREEN 0；
失败条件是断言失败或既有测试比改前读数差。

| 目标 | 任务 | 角色 | 命令与预期退出码 | 判据与证据路径 |
| --- | --- | --- | --- | --- |
| 六问与镜头写全 | 任务 1 | RED | 新测试非零 | 判据 ORACLE-REVIEW-UI；`p7-ui-stage-review-red.output` |
| 六问与镜头写全 | 任务 2 | GREEN | 新测试 0 | 判据 ORACLE-REVIEW-UI；`p7-ui-stage-review-green.output` |
| 既有审查不回退 | 任务 2 | 回归 | 既有测试不差于改前读数 | `p7-<测试名>-before.output` 与 `-after.output` |

覆盖上限：只证明审查方法与登记写了这些内容，不证明真实审查会审出缺陷。
显式不覆盖：真实审查行为、非 UI 任务审查实际不多问，归第 9 段。

失败了怎么办：断言失败回第 7 段开发者修正文；夹具失败回写测试的人；
目标断言未到达时不得改判定器求绿。

## 下一消费者拿什么继续？

第 9 段演练者用本段六问块审写代码与审查两个真跑入口的演练材料（定方向、写需求、排阶段三阶段由第 3、4、5 段契约测试证明），并用方向轨不变核非 UI 零额外动作。

- 交回：五件文件的提交、RED 与 GREEN 原件、既有测试改前改后输出、冷读记录。
- 未完成项：真实审查审出四类缺陷未做，归第 9 段，不在此宣称。

## 每张任务卡怎么写？

### 任务 1：先写会失败的审查 UI 契约测试

为什么做：没有先红的测试，就证明不了六问与镜头登记真被断言读到；对应验收 5。
交付什么：新文件 `tests/contract/ui-stage-review.test.mjs`。
它读审查方法、设计审查技能、定方向审查合同与镜头计划，断言六问名、
三阶段问法、细节轨设计镜头、“材料存在不当已读”、未看成记未读或不可用、截图只支持视觉对照、
设计审查技能按三来源触发且三来源都缺不默认非 UI；
用 `git show 998614bd:<文件>` 断言方向轨对象深相等、合同方向段逐行相同。
测试内按验收 1「故意弄坏一处」列出的各处反例建内存副本，各自必须失败。
不做什么：不改既有测试；不调用审查 provider；不新增 CLI。
前置：第 3、6 段已合入；主仓 node_modules 可解析。
怎么做：动笔前先记开工基点到 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-stage-integration-20261113/quality/tests/<日期>-p7-start-head.txt` 并取改前读数；
先读两段新正文与四件原文，再写断言；跑一次，确认红在断言而非夹具。
怎么验收：`npx vitest run tests/contract/ui-stage-review.test.mjs` 改前非零，
失败指向缺失的六问或镜头；方向轨比对改前通过，具名记“本来就通过”。
证据：命令、cwd、退出码与原始输出留 `p7-ui-stage-review-red.output` 单份原件。
下游（含何时停）：任务 2 让它转绿；红在夹具时停手修夹具，不进任务 2。

**校验器用，人可跳过**

- **任务编号**：T009
- **来源 / FR / AC**：R-008、U-002 / FR-005 / AC-005
- **文件 / 符号**：`tests/contract/ui-stage-review.test.mjs`；符号：
  `describe("ui-stage-review")` 下的六问与触发断言、方向轨基线深相等比对与验收 1 列出的各处反例
- **动作**：0. 本段开发动笔前第一步在工作区根执行 `git rev-parse HEAD > /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-stage-integration-20261113/quality/tests/<日期>-p7-start-head.txt`，再跑全部既有命令取改前读数存 `-before.output`（首行写时点），失败即停手记 incomplete。1. 新建正文契约测试，含方向轨基线比对与验收 1 列出的各处反例。
- **输入**：P3 第 10 步、P6 第 8 步正文；四件审查文件；基线 998614bd。
- **输出 / 失败**：改前非零且失败指向六问或镜头断言；夹具失败另记，不算 RED。
- **边界 / 禁止改动**：既有测试、`tools/cli/**`、P3 与 P6 写入集。
- **依赖**：P3、P6
- **测试层级 / 技能**：contract / backend-testing
- **场景 / 夹具或服务**：工作区真实正文为正例；验收 1 列出的各处内存反例为负例。
- **RED/GREEN 门禁命令**：`npx vitest run tests/contract/ui-stage-review.test.mjs`
- **预期退出码**：RED nonzero; GREEN 0
- **RED 目标失败**：ORACLE-REVIEW-UI 断言失败：改正文前缺六问名、三阶段问法、细节轨设计镜头、三来源触发、不当已读句或未读记法，
  退出非零；方向轨比对改前通过记本来就通过
- **GREEN 判定器**：ORACLE-REVIEW-UI
- **证据**：`planned: quality/tests/<日期>-p7-ui-stage-review-red.output`；
  开工基点 `quality/tests/<日期>-p7-start-head.txt`（相对任务库根）
- **停止 / 恢复**：夹具或环境失败停手修夹具；不改判据求绿。
- **覆盖上限**：只证正文与登记，不证真实审查行为。
- **完成**：前置（不作完成条件）：命令跑过并留原件。完成条件（只写效果）：测试能区分写全与缺六问或动了方向轨的审查材料，验收 1 列出的各处反例各自变红。

### 任务 2：在审查方法里追加六问块并登记设计镜头

为什么做：各阶段 UI 产物要有独立审查判真假，否则“材料存在”会被当成“已读过”；对应验收 5。
交付什么：`skills/wh-review/SKILL.md` 追加“仅 UI 任务时”的六问块，
每问写输入、适用阶段、通过或失败信号与证据；第③④⑤问读第 6 段七项界面判定字段，
缺一项即发现；第③问缺截图或差异原件即报“缺视觉证据”；并写三阶段问法：
写需求问计划里有没有，排阶段问验收里有没有，写代码问实际证据有没有。
写清三种结果：有问题；没问题但写清看了什么；没看成记未读或不可用、不算通过。
写清看不到页面时截图只支持视觉对照，交互、无障碍、性能、控制台与接线须真实运行证据，补齐再判。
`plan-design-review/SKILL.md` 调用范围补定方向与写代码；
它的 UI 触发条件改为按三来源判适用性：任一命中即触发，三来源都缺记“未知”加负责人，不默认非 UI；
`contracts/make-decision.md` 细节审查段追加设计镜头，核 UI 需求是否收敛、设计源是否确认、验收是否可判；
`stage-skill-plan.json` 定方向细节轨登记设计镜头，写代码设计镜头接回设计审查技能。
不做什么：不动方向轨与方向四问；不新增审查轮；不让实现者自审。
前置：任务 1 的 RED 原件已存。
怎么做：每个文件先读原字节，在锚点后追加；每改一个文件跑一次任务 1 命令看断言推进。
怎么验收：验收 1 新测试退出 0、既有测试不比改前读数差；验收 2 写入集核对通过，冷读记录进证据（答不出记 finding，不单独判本条）。
证据：`p7-ui-stage-review-green.output`、既有测试改前改后输出、冷读记录。
下游（含何时停）：交第 9 段；须改方向轨或新增审查轮才能满足时停，退回定方向原 owner。

**校验器用，人可跳过**

- **任务编号**：T010
- **来源 / FR / AC**：R-008、U-002 / FR-005 / AC-005
- **文件 / 符号**：`skills/wh-review/SKILL.md`、`skills/plan-design-review/SKILL.md`、
  `skills/wh-review/contracts/make-decision.md`、
  `skills/wh-review/stage-skill-plan.json`；符号：N/A — Markdown/JSON 正文，
  节名为 wh-review「输入与方法」后的 UI 六问块、plan-design-review 触发条件段、make-decision 合同细节审查段、
  stage-skill-plan.json 的 wh-review/make-decision-detail 条目
- **动作**：只追加六问块、调用范围、三来源触发条件与细节轨设计镜头；方向轨与原句不变。
- **输入**：T009 RED 原件；决策记录工作包 5「审查加 UI 六问」全节；P3、P6 正文。
- **输出 / 失败**：T009 转绿；既有测试不差于改前读数；任一变差即失败。
- **边界 / 禁止改动**：方向轨、其它阶段审查合同、既有测试、`tools/cli/**`。
- **依赖**：T009
- **测试层级 / 技能**：contract / backend-testing
- **场景 / 夹具或服务**：工作区真实正文与 JSON。
- **RED/GREEN 门禁命令**：`npx vitest run tests/contract/ui-stage-review.test.mjs`
- **预期退出码**：RED nonzero（任务 1 改正文前读数）; GREEN 0（本卡改完后同一命令）
- **RED 目标失败**：ORACLE-REVIEW-UI 断言失败：与任务 1 同一命令同一判定器，改前缺六问与镜头而非零；本卡完成后同一断言转 0
- **GREEN 判定器**：ORACLE-REVIEW-UI
- **证据**：`planned: quality/tests/<日期>-p7-ui-stage-review-green.output`；
  其余既有测试各留 `quality/tests/<日期>-p7-<测试名>-before.output` 与 `-after.output`
- **停止 / 恢复**：须改方向轨或新增审查轮时停，退回定方向 owner。
- **覆盖上限**：只证正文与登记；真实审查行为归 P9。
- **完成**：前置（不作完成条件）：验收 1 全部命令与冷读留原件。完成条件（只写效果）：UI 任务的三处审查者能按同一套六件、不同深度判材料，
  看不到页面时记未读；非 UI 审查与方向轨与基线逐字相同。


## 机器字段（校验器用，人可跳过）

- **全局规格**：`spec.md#实现设计全局权威`
- **写入集**：`skills/wh-review/SKILL.md`、`skills/plan-design-review/SKILL.md`、
  `skills/wh-review/contracts/make-decision.md`、
    `skills/wh-review/stage-skill-plan.json`、
  `tests/contract/ui-stage-review.test.mjs`
- **依赖**：P3、P6
- **消费者**：各阶段独立审查者；P9 演练者
- **gate_cmd**：`npx vitest run tests/contract/ui-stage-review.test.mjs`
- **oracle**：ORACLE-REVIEW-UI
- **evidence_path**：`planned: quality/tests/<日期>-p7-ui-stage-review-green.output`
  （尚未执行；RED 原件同目录 `-red.output`）
- **STOP**：夹具或环境失败保原错误交写测试者；须动方向轨或新增审查轮时停。
- **覆盖 AC**：AC-005
- **Done**：前置（不作完成条件）：RED、GREEN、既有测试改前改后与冷读原件齐。完成条件（只写效果）：UI 任务的审查问六件、深度随阶段不同、
  看不到页面记未读；方向轨与非 UI 审查与基线逐字相同。
