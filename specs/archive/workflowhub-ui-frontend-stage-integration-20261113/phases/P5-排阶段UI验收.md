# Phase P5 — 排阶段给碰页面的 Phase 写六项 UI 验收

本文件写给第 5 段的开发者、独立测试者、独立读者与第 6 段作者。
读完要能找到排阶段要改的四件与新测试、六项的名字、第 5 步答复标记的改法、判据与失败恢复。

## 作者开工五问的答案是什么？

这五问按 `skills/spec-plan/references/authoring-contract.md` 写，答案只管本段。

1. 为谁做：第 5 段开发者（唯一写主）、独立测试者与读历史样本的独立读者；其次是第 6 段开发。
2. 他拿它干什么：开发者在排阶段第 5、7、9 步与 Phase 模板追加六项、缺源仍审句与答复标记；
   测试者跑新测试；读者读两份历史样本，判有没有误判。
3. 读到哪里会卡：六项与前端质量门五项的原文（决定 5）；
   steps.json 第 5 步 requires_user_reply 改值会不会打红既有测试；两份历史样本路径（spec AC-003 写死）。
4. 失败怎么恢复：断言红回第 5 段开发修正文；既有测试出现基线外的新失败名时停，交主会话；
   读者误判历史样本，回开发改方法措辞，读者重读那份样本。
5. 哪些话只有内行懂：“答复标记”指 steps.json 的 requires_user_reply，true 表示该步要等用户真实答复；
   “缺源仍审”指缺设计源也加设计审查；“六项”在下文首现处列出。

## 哪些节必须写，哪些可以省？

本文件按 Phase 模板选节表写满八个必填节与两个条件必填节。

| 二级节 | 状态 | 说明 |
| --- | --- | --- |
| 作者开工五问的答案是什么？ | written | 本段五问短答 |
| 这一 Phase 交出什么？ | written | 结果、非目标、前后状态、边界、风险 |
| 这一 Phase 怎么验收？ | written | 验收 3 一段，六件加失败回修 |
| 为什么现在做，依据是什么？ | written | 决策记录工作包 3 与答复原件 |
| 开始前读什么？ | written | 第 4 段交接、排阶段三件、Phase 模板、历史样本 |
| 每个文件由谁改，先做什么？ | written | 五个写入路径，无跨段共享 |
| 怎么验证？ | written | 同一测试的 RED 与 GREEN，加历史样本人读 |
| 下一消费者拿什么继续？ | written | 交第 6 段的六项字段名与组件回写位置 |
| 验收 Phase 才能做的检查 | not-applicable | 本段不是末验收段，归第 9 段 |
| 每张任务卡怎么写？ | written | 任务 6 一张卡 |
| 机器字段（校验器用，人可跳过） | written | 文件末 |

## 这一 Phase 交出什么？

交一套排阶段方法：碰页面、路由、组件或样式的 Phase 固定写六项 UI 验收，不碰的一项不多。
术语：UI 指用户界面（页面、路由、组件、样式）；AC 指规格里的验收条款；FR 指功能需求；RED 指改前先跑出的目标失败；GREEN 指改后同一命令通过；
PRD 指写需求阶段产出的需求文档；JSON、YAML 是步骤表与依赖表的文件格式。

- **本 Phase 结果**：`workflows/build-plan/SKILL.md` 第 7 步给 UI Phase 写六项；
  第 9 步三项 UI 事实缺一项、但碰页面仍加设计审查；
  第 5 步答复标记改成“该步需要真实答复”并与正文一致；
  Phase 模板有六项位置与组件回写位置；一条新契约测试判这些句子在、非 UI 路径没变。
- **非目标**：不把六项做成所有 Phase 的必填（决策记录工作包 3「不做什么」）。
  不新增阶段、检查门或审查轮。不写页面代码，也不替代写代码阶段的验收（第 6 段）。
  不追溯判历史任务失败；旧材料缺新字段按“未知”补问（决策记录工作包 3「历史材料」）。
- **改动前**：排阶段第 5 步已有设计稿准备与八维设计审查，但 Phase 验收只写功能。
  第 9 步三项 UI 事实缺一项就不加设计审查；组件没有回写位置。
  `workflows/build-plan/steps.json` 第 5 步 `requires_user_reply` 为 `false`，
  而正文要求取得用户真实答复（本次实读，见「开始前读什么？」）。
- **改动后**：UI Phase 有六项、设计审查与组件回写位置；
  不改组件的 Phase 在组件沉淀项写“不适用＋理由”（澄清答复第 22 行）；
  第 5 步标记为 `true`；非 UI Phase 路径与基线逐字相同。
  该标记只表示“该步在 UI 路径下需要真实答复”：UI 任务的设计稿确认并入这次答复，不另开确认门。
  非 UI 任务在第 5 步写“不适用＋一句理由”后直接往下走，不等答复、不新增确认；
  这是该步原有产出（基线第 5 步已要求非 UI 记理由），不是额外动作，与验收 12 不冲突。
  依据：决策记录「工作包 3：排阶段时给碰页面的 Phase 六项验收」决定 5 的答复标记修正原意：
  “与正文一致；UI 设计稿确认并入这次答复，不另开确认门”。
- **与相邻 Phase 的边界**：上游第 4 段交来 PRD 的 UI 任务链、接线、页面数据清单字段名。
  本段交给第 6 段六项的字段名与组件回写位置，第 6 段写代码读它们。
- **主要风险**：把第 5 步标记从 `false` 改成 `true` 打红读该标记的既有测试。
  替代走法：按本次实读，读 `requires_user_reply` 的测试只有三件且都读 make-decision：
  `check-stage-steps`、`make-decision-flow`、`n10-process-repair`（行号见「开始前读什么？」）；
  若改后 `check-stage-steps` 仍变红，按该测试实际断言定位，不改测试，交主会话。
- **下一步**：第 6 段开发读本段交接的六项字段名，改写代码第 1、6–9 步。
- **动手前必读**：`phases/P4-写需求UI任务链.md`「下一消费者拿什么继续？」；
  `workflows/build-plan/SKILL.md` 第 5、7、9 步；
  `workflows/build-plan/steps.json` 第 5 步；
  `skills/spec-plan/templates/phase-template.md:196-209`、`:620-680`；
  决策记录「工作包 3：排阶段时给碰页面的 Phase 六项验收」。
- **未决事实**：N/A — 两份历史样本已由 spec AC-003 写死：
  UI 样本 `specs/archive/workflowhub-ui-frontend-c11-gap-repair-20261112/phases/P3-c04-c05-audit.md`；
  非 UI 样本 `specs/archive/n10-finite-check-wiring-20261020/phases/P1-检查内核与报告语义.md`（其第 133、
  271 行写“无页面/路由/组件改动，UI/浏览器面不适用”）。

## 这一 Phase 怎么验收？

假设本段全部做完、测试也通过，历史旧材料是否被误判仍会漏；所以加一次独立读者读历史样本。
本段只证验收 3；它的真实行为由第 9 段演练第②组判，本段对验收 8 只是“供件”。
供件的意思是：本段只提供材料给后段用，不算本段承接的验收。
本文的“验收 3”“验收 8”“验收 12”就是全局 spec 的 AC-003、AC-008、AC-012（spec Appendix B 对照），
不另有本段内部编号。

成本账：验收 3 的成本七字段见 spec Appendix A 的 AC-003「成本」，
estimate_min=25，hard_cap_min=60，retry_cap=1。
共享准备 5 分钟（取基线、核主仓 node_modules），重试预留 15 分钟。
既有测试单文件四条加 `skill-deps.yaml` 四条检查，约 10 分钟，并入同一独立测试者串行。

- `acceptance_cost_total=55 active_min`：25 + 10 + 5 + 15；命令与人读同属一条验收，串行。
- `phase_budget={soft_min:60,hard_min:120,source:provisional}`：
  软上限取承接 AC 的 hard_cap_min 之和（AC-003 为 60），硬上限取其两倍；规则未经用户校准。
  本文软上限取承接 AC 的 hard_cap_min 之和，偏保守；
  第 9 段因并入跨段分项改用另一种口径；两套都标 provisional，未经用户校准。
- `execution_budget={window_minutes:unknown,command_cap:unknown,wait_cap:unknown,retry_reserve:15}`：
  执行策略未从定方向取得具体答复，前三项交 build-code 按真实任务定。

资源账：工作区、基线提交 998614bd、两份历史样本（路径见上方「未决事实」，spec AC-003 写死）；样本复用仓内归档，不新造。
范围账：本条只证排阶段方法与模板写对、非 UI 不变、历史样本不误判；
新任务真实执行归第 9 段。

**验收 3：碰页面的 Phase 有六项，缺设计源也审，第 5 步不吞答复**

目标：Phase 作者读排阶段方法与 Phase 模板，能写出 UI Phase 六项与组件回写位置；
非 UI Phase 作者读到的路径与改前一字不差。
六项是：设计源引用、页面／路由／组件与状态乘视口、视觉对照项、
前端质量门、组件复用与沉淀、独立设计审查与证据（决策记录工作包 3 决定 5）。
怎么操作：先写测试文件，
再在改正文前跑 `npx vitest run tests/contract/ui-stage-build-plan.test.mjs`；
目标 RED 只认具名断言失败，测试文件缺失报错算环境失败；改完再跑同一命令；
再跑第 5 段既有测试单文件与 `skill-deps.yaml` 检查（命令见「怎么验证？」）；
最后把两份历史样本交独立读者，按下面观察协议读：
UI 样本 `specs/archive/workflowhub-ui-frontend-c11-gap-repair-20261112/phases/P3-c04-c05-audit.md`；
非 UI 样本 `specs/archive/n10-finite-check-wiring-20261020/phases/P1-检查内核与报告语义.md`。
什么条件：工作区根执行；node v24.14.0；`npx vitest` 解析到主仓 node_modules；
基线 998614bd；第 4 段已合入；历史样本只读。
怎样算通过：命令退出 0；断言命中六项名、“三项 UI 事实缺一项但碰页面仍加设计审查”句、
第 5 步 `requires_user_reply` 为 `true` 且正文写“该步需要真实答复”、
组件沉淀写回写位置和读的人、不改组件写“不适用＋理由”；
前端质量门写出五项内容，各带可观察判据：组件质量、浏览器验收、响应式、
无障碍（含 200% 缩放与读屏，读屏做不了记不可用）、性能预算（决定 5：“前端质量门含组件质量、浏览器验收、响应式、无障碍、性能预算”；
澄清答复第 25 行）；
非 UI Phase 路径各步可见结果与 `git show 998614bd:` 原文逐字相同；
既有测试单文件不比 004/031 基线差、不新增基线清单外的失败用例名。
读者判历史 UI 样本按“未知”补问、非 UI 样本不被判缺 UI 字段。
故意弄坏一处：测试内对内存副本删掉“视觉对照项”，检查函数必须报出该项缺失；
内存副本删掉前端质量门的“性能预算”或“200% 缩放”，必须报出该项缺失；
内存副本把第 5 步正文标记改回“不需要回复”，或把 `workflows/build-plan/steps.json` 第 5 步
`requires_user_reply` 改回 `false`，断言都必须变红（spec AC-003 反例）。
非 UI 反例：内存副本给非 UI Phase 路径加一句“须写设计源引用”，基线比对断言必须变红，
证明非 UI Phase 不多出动作。以上反例就是「场景」字段列出的各处，只改内存副本，不改磁盘。
写入集核对：本段开发动笔前第一步在工作区根执行
`git rev-parse HEAD > /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-stage-integration-20261113/quality/tests/<日期>-p5-start-head.txt`；
验收最后在工作区根跑
`test -s /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-stage-integration-20261113/quality/tests/<日期>-p5-start-head.txt && git diff --name-only "$(cat /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-stage-integration-20261113/quality/tests/<日期>-p5-start-head.txt)"..HEAD`，只列本段写入集。
`test -s` 非零（基点文件缺失或为空）即基点缺失，记 incomplete 并停这条核对，不得凭空判过。
真跑还是替代：命令真跑；历史样本判读是人读，不证新任务真实执行。
谁判与证据：未参与第 5 段实现的独立测试者与独立读者，第 5 段审查改完后判。
测试原件 `quality/tests/<日期>-p5-ui-stage-build-plan-{red,green}.output`；
人读原件 `quality/tests/<日期>-p5-history-sample-read.md`，记读者身份、两份样本路径、判词原文。
观察协议：读者只拿改后的排阶段方法与两份样本；
UI 样本被写成“按未知补问”且未被静默跳过算过；
非 UI 样本被判“缺 UI 字段”或被要求补六项算没过。

失败回修与停止：断言变红、既有测试变红或读者误判，回第 5 段开发同一会话修正文，不改断言求绿；
要改断言须用户真实答复。修后重跑同一命令与变红的既有测试单文件，读者重读失败那份样本。
要把六项做成所有 Phase 必填时停，退回定方向。
红测归因：改前具名断言失败算目标 RED；找不到 vitest 或 node_modules 算环境失败，另记不算 RED；
测试文件自身语法错算夹具失败；既有测试按任务库基线读数原件
`quality/tests/2026-11-13-004-baseline-summary.tsv` 判：不比基线差，且新增失败名不在基线失败名单里；
否则算本段目标行为回归。

## 为什么现在做，依据是什么？

第 4 段写好了 PRD 的 UI 任务链，排阶段要据它给碰页面的 Phase 写出可判的 UI 验收。
不改这段，写代码阶段拿到的 Phase 只有功能验收，没有设计源和对照项可依。

- **结果**：碰页面的 Phase 有六项、设计审查与组件回写位置；非 UI 不多；第 5 步不吞答复。
- **非目标**：不对所有 Phase 加 UI 字段；不新增审查轮。
- **与其它 Phase 的区别**：第 4 段写 PRD 任务链；本段写 Phase 验收；第 6 段写代码对照与质量证据。
- **依据**：决策记录工作包 3 与决定 5。
- **依据**：澄清答复第 22 行（Q-08）：UI Phase 固定出现组件沉淀，不改组件写“不适用＋理由”。
- **依据**：澄清答复第 20 行（Q-06）：允许新增可选 UI 字段，不改已有机器字段含义。
- **依据**：spec「谁先谁后？」：第 4→5→6 串行，后段 UI 字段读前段字段名。

## 开始前读什么？

| 材料或锚点 | 本 Phase 用它做什么 | 读取时机 |
| --- | --- | --- |
| `phases/P4-写需求UI任务链.md` 的「下一消费者拿什么继续」 | 读 UI 任务链、接线、页面数据清单的字段名 | 开工前 |
| 决策记录「工作包 3」 | 读六项、三项 UI 事实、第 5 步标记的决定原文 | 开工前 |
| `workflows/build-plan/SKILL.md` 第 5、7、9 步 | 定位追加点；第 5 步正文已要求真实答复 | 写卡前 |
| `workflows/build-plan/steps.json` 第 5 步 | 本次实读 `requires_user_reply = false` | 写卡前 |
| `skills/spec-plan/templates/phase-template.md:196-209`、`:620-680` | Phase 正文与 Task 卡里放六项的位置 | 写卡前 |
| `tests/contract/check-stage-steps.test.mjs:948` | 本次实读：该断言只读 make-decision 的答复标记 | 改标记前 |
| `tests/contract/make-decision-flow.test.mjs:141`、`:166` | 本次实读：只核 make-decision 步骤的键名含该字段，不读值 | 改标记前 |
| `tests/contract/n10-process-repair.test.mjs:37` | 本次实读：只核 make-decision 步骤的键形状，不读值 | 改标记前 |
| `specs/archive/workflowhub-ui-frontend-c11-gap-repair-20261112/phases/P3-c04-c05-audit.md` | 历史 UI 样本，只读，交读者 | 交读者前 |
| `specs/archive/n10-finite-check-wiring-20261020/phases/P1-检查内核与报告语义.md` | 历史非 UI 样本，只读；第 133、271 行写 UI 面不适用 | 交读者前 |

## 每个文件由谁改，先做什么？

- **新增**：`tests/contract/ui-stage-build-plan.test.mjs`。唯一 writer 是第 5 段开发；
  消费者是独立测试者与第 9 段。文件名是 spec 建议名，可改，须保留断言范围（spec 未定 4）。
- **修改**：`workflows/build-plan/SKILL.md`，在第 5、7、9 步追加 UI 条件段，不改写受断言保护的原句。
- **修改**：`workflows/build-plan/steps.json`，第 5 步 `requires_user_reply` 改 `true`，
  第 7 步可见结果追加 UI 六项一句；其它步与字段不动。
- **修改**：`workflows/build-plan/skill-deps.yaml`，只追加本段实际消费的既有技能登记；
  无需新登记则不改并在提交说明写理由。
- **修改**：`skills/spec-plan/templates/phase-template.md`，加六项与组件回写位置，
  标明只在 UI Phase 写。
- **禁止改动**：`workflows/build-prd/**` 归第 4 段；`workflows/build-code/**` 归第 6 段；
  `skills/wh-review/**`、`skills/plan-design-review/SKILL.md` 归第 7 段；
  `specs/archive/**` 历史样本只读；`tools/cli/` 检查器不改（spec「故意不改」）。

本段写入集（本段允许改动的文件清单）与其它段无共享路径，没有跨段先后登记。
Phase 模板只有本段写；`authoring-contract.md` 不在写入集，只跑它的既有测试。

- **读集**：上表七处锚点。
- **定序写主**：同批次只有第 5 段开发；第 4 段写 PRD 模板、本段写 Phase 模板，路径不重叠。
- **接口符号清单**：N/A — 改的是方法正文、步骤 JSON 与模板，测试只读文件。
- **合并责任**：第 5 段开发提交五件；冲突回第 5 段开发。
- **progress_cursor**：只指向任务事实库 `facts.jsonl` 的 `phase_progress`，本文件不保存进度值。

## 怎么验证？

用改后五件的真实字节跑同一条新测试：RED 看具名断言失败，GREEN 看退出 0；再跑既有测试单文件。

开工前四要素：验证层是正文契约加非 UI 基线比对加历史样本人读；
命令见下表；预期新测试 RED 非零、GREEN 0；既有测试不比 004/031 基线差，新增失败名不在基线清单；
失败条件是具名断言失败、既有测试出现基线清单外的新失败名，或读者误判历史样本。

| 目标 | Task | 角色 | gate_cmd 与预期退出码 | 判据与证据路径 |
| --- | --- | --- | --- | --- |
| 六项、缺源仍审、第 5 步标记 | 任务 6 | RED | `npx vitest run tests/contract/ui-stage-build-plan.test.mjs` 非零 | ORACLE-PLAN-UI 与 `quality/tests/<日期>-p5-ui-stage-build-plan-red.output` |
| 六项、缺源仍审、第 5 步标记 | 任务 6 | GREEN | 同一命令 0 | ORACLE-PLAN-UI 与 `quality/tests/<日期>-p5-ui-stage-build-plan-green.output` |

既有测试单文件（只跑这些；基线四条都是 0，判据仍是不比基线差、新增失败名不在基线失败名单里）：

```bash
npx vitest run tests/contract/n11-plan-quality.test.mjs
npx vitest run tests/contract/acceptance-plan.test.mjs
npx vitest run tests/contract/authoring-contract.test.mjs
npx vitest run tests/contract/check-stage-steps.test.mjs
```

改了 `skill-deps.yaml` 时另跑（基线本来非零的是 `knowledge-graph-stage-wiring`、
`local-skill-resolver`；
`check-skill-consistency` 以 031 原件带 `--root` 的读数为基线，尾部 exit 0；按同一判据比）：

```bash
node --test tests/contract/ui-skill-contract.test.mjs
npx vitest run tests/contract/knowledge-graph-stage-wiring.test.mjs
npx vitest run core/__tests__/local-skill-resolver.test.mjs
node tools/cli/check-skill-consistency.mjs --root /Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-stage-integration-20261113
```

浏览器可见面：不适用，本段只改方法正文与模板，页面行为归第 9 段演练。
覆盖上限：只证方法与模板写了六项、缺源仍审与正确标记，非 UI 路径没变，历史样本不被误判。
显式不覆盖：不证新任务排阶段时真的写出六项，不证写代码阶段真的读它们；都归第 9 段。

失败了怎么办：

- **风险**：追加 UI 段时改写了 `n11-plan-quality` 等测试保护的原句。
- **影响**：排阶段既有契约失效，后续段读不到原合同。
- **缓解**：只追加，不改原句；改完逐个跑既有测试单文件。
- **回滚**：第 5 段开发只撤回本卡受影响 hunk，按 998614bd 原字节恢复该文件，保留其它四件。
- **补救与交接**：恢复后重新追加，重跑新测试与变红的既有测试；仍不通过交主会话。
- **触发条件**：任一既有测试单文件非零，或新测试的非 UI 基线比对断言变红。

## 下一消费者拿什么继续？

第 6 段写代码按本段写好的六项字段名接截图对照与前端质量证据。

- **第 6 段开发**：读 `workflows/build-plan/SKILL.md` 第 7 步六项字段名原文与模板组件回写位置。
- **第 7 段开发**：读第 9 步“缺一项仍加设计审查”句，作审查 UI 六问的输入之一。
- **第 9 段**：读本段 GREEN 原件、两份历史样本路径与读者判词，演练第②组复用。
- 未完成项：读者人读未执行时记 `incomplete`，第 9 段不据此判通过。

## 每张任务卡怎么写？

### 任务 6：让碰页面的 Phase 有六项验收，第 5 步不吞答复

为什么做：Phase 作者现在只能写功能验收，碰页面的 Phase 没有设计源与对照项，对应需求 4 与 AC-003。
交付什么：排阶段方法与 Phase 模板写出六项、缺源仍审、组件回写位置；第 5 步标记为需要答复；失败是任一句缺失或非 UI 路径变了。
不做什么：不改写需求、写代码与审查的文件，不把六项做成所有 Phase 必填，不改历史样本。
前置：第 4 段 任务 5 已合入，从 `phases/P4-写需求UI任务链.md` 交接的字段名与 998614bd 基线开始。
怎么做：先读 spec 写死的两份历史样本，再写新测试取 RED，然后在第 7 步追加六项、改第 5 步标记。
怎么验收：跑本卡门禁命令，RED 非零、GREEN 0；再跑四个既有测试单文件；独立读者读两份样本。
证据：RED、GREEN 原件与历史样本人读原件各一份；它不证明新任务真的写出六项。
下游（含何时停）：第 6 段读六项字段名；要把六项推到所有 Phase 时停，退回定方向。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T006
- **来源 / FR / AC**：决策记录工作包 3 与决定 5（碰页面、路由、组件或样式的 Phase 固定六项，
  非 UI Phase 不写；三项缺一项但碰页面仍加设计审查；第 5 步答复标记改成“该步需要真实答复”）；
  R-004、U-004；FR-003；AC-003。
- **输入**：T005 交付的 PRD UI 任务链字段名（`phases/P4-写需求UI任务链.md` 交接节）；
  998614bd 基线的排阶段三件与 Phase 模板；两份历史样本按 spec AC-003：
  `specs/archive/workflowhub-ui-frontend-c11-gap-repair-20261112/phases/P3-c04-c05-audit.md`、
  `specs/archive/n10-finite-check-wiring-20261020/phases/P1-检查内核与报告语义.md`。
  执行 owner 是第 5 段开发；独立测试者与读者在审查改完后判。
- **文件 / 符号**：新增 `tests/contract/ui-stage-build-plan.test.mjs`，符号：
  测试内检查函数 checkBuildPlanUi；
  修改 `workflows/build-plan/SKILL.md`，符号：第 5、7、
  9 步锚点 step-conditional-ui-readiness、step-testing-system-blueprint、
  step-merged-review；
  修改 `workflows/build-plan/steps.json`，符号：第 5 项 requires_user_reply；
  修改 `workflows/build-plan/skill-deps.yaml`，符号：依赖条目，无新依赖则不改；
  修改 `skills/spec-plan/templates/phase-template.md`，符号：N/A — 非代码模板，加六项与组件回写位置。
- **动作**：0. 本段开发动笔前第一步在工作区根执行
  `git rev-parse HEAD > /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-stage-integration-20261113/quality/tests/<日期>-p5-start-head.txt`，失败即停手记 incomplete；1. 只读 spec AC-003 写死的 UI 与非 UI 两份历史样本，核两路径存在，不另选、不改样本。
  2. 写新测试：读五件真实字节，断言六项名、缺源仍审句、第 5 步标记 `true`、组件回写位置、“不适用＋理由”、前端质量门五项内容；
  用 `git show 998614bd:<文件>` 比非 UI 路径逐字相同；对内存副本做「场景」字段列出的各处反例。
  3. 改前跑门禁命令取 RED。4. 在第 7 步追加六项段，第 9 步追加缺源仍审句，第 5 步正文写“该步需要真实答复”。
  5. 把 steps.json 第 5 步 `requires_user_reply` 改 `true`。6. 模板加六项与组件回写位置，
    前端质量门展开五项，标“只在 UI Phase 写”。
  7. 跑门禁命令取 GREEN，再跑四个既有测试单文件；改了 skill-deps.yaml 时跑四条依赖检查。
- **输出 / 失败**：五件正文含六项与正确标记，新测试退出 0；
  删任一项名、标记改回 `false`、非 UI 路径加 UI 句，都由新测试具名报出；回滚只撤本卡 hunk。
- **边界 / 禁止改动**：`workflows/build-prd/**`、`workflows/build-code/**`、
  `skills/wh-review/**`、
  `skills/plan-design-review/SKILL.md` 归其它段；`specs/archive/**` 只读；
  `tools/cli/**` 不改。
- **依赖**：T005
- **测试层级 / 技能**：正文契约（测，AC-003，门禁命令）；非 UI 基线比对（测，同一命令）；
  历史样本人读（测，观察协议）；浏览器（不测，本段无页面）；主测试技能 backend-testing。
- **场景 / 夹具或服务**：正例是改后五件真实字节；反例是内存副本删“视觉对照项”、删“性能预算”、删“200% 缩放”、标记改回 `false`、
  正文标记改回“不需要回复”、
  非 UI 路径加 UI 句；基线由 `git show 998614bd:` 取；无临时文件需清理。
- **RED/GREEN 门禁命令**：`npx vitest run tests/contract/ui-stage-build-plan.test.mjs`
- **预期退出码**：RED nonzero; GREEN 0；RED 须是六项名或标记的具名断言失败，vitest 找不到算环境失败另记。
- **RED 目标失败**：ORACLE-PLAN-UI；改前第 7 步无“视觉对照项”、第 5 步标记为 `false`，具名断言失败。
- **GREEN 判定器**：ORACLE-PLAN-UI 六项名、缺源仍审句、第 5 步标记 `true` 与正文一致、组件回写位置与前端质量门五项内容齐，
  非 UI 路径与基线逐字相同；各内存反例各自报出具名缺口。
- **证据**：`quality/tests/<日期>-p5-ui-stage-build-plan-red.output`、
  `quality/tests/<日期>-p5-ui-stage-build-plan-green.output`、
  `quality/tests/<日期>-p5-history-sample-read.md`
- **覆盖上限**：只证方法与模板正文；不证新任务真实执行，不证写代码阶段消费六项。
- **停止 / 恢复**：既有测试变红且无法只追加解决时停，交主会话，不改测试；
  要把六项推到所有 Phase 时停，退回定方向；历史样本路径读不到时停该人读路径，交主会话核 spec，不另选替代样本。
- **完成**：前置（不作完成条件）：开工基点文件已记，写入集核对命令以 `test -s` 起头跑过；门禁命令真跑，RED 与 GREEN 原件在；
  四个既有测试单文件不比 004/031 基线差、
  不新增基线清单外的失败用例名。
  完成条件（只写效果）：Phase 作者能从方法读出六项并写出组件回写位置；「场景」字段列出的各处反例各被报出；
  非 UI 路径没变；读者判历史 UI 样本按“未知”补问、非 UI 样本不被误判；人读未执行记 `incomplete`。

## 机器字段（校验器用，人可跳过）

- **全局规格**：`spec.md#实现设计全局权威`
- **写入集**：`workflows/build-plan/SKILL.md`；`workflows/build-plan/steps.json`；
  `workflows/build-plan/skill-deps.yaml`；
  `skills/spec-plan/templates/phase-template.md`；
  `tests/contract/ui-stage-build-plan.test.mjs`
- **依赖**：P4
- **消费者**：第 6 段开发、第 7 段开发、第 9 段演练
- **gate_cmd**：`npx vitest run tests/contract/ui-stage-build-plan.test.mjs`
- **oracle**：ORACLE-PLAN-UI
- **evidence_path**：planned:
  `quality/tests/<日期>-p5-ui-stage-build-plan-green.output`
- **STOP**：要把六项做成所有 Phase 必填时停，退回定方向；测试红回第 5 段开发修正文，不改断言；
  既有测试红且只追加解决不了时交主会话。
- **覆盖 AC**：AC-003
- **Done**：前置（不作完成条件）：开工基点文件已记，写入集核对命令以 `test -s` 起头跑过；门禁命令真跑，RED 与 GREEN 原件在；
  四个既有测试单文件不比 004/031 基线差、
  不新增基线清单外的失败用例名。
  完成条件（只写效果）：AC-003 命令判六项、缺源仍审、第 5 步标记一致与非 UI 不变，
  证据 `quality/tests/<日期>-p5-ui-stage-build-plan-green.output`；
  历史样本人读证据 `quality/tests/<日期>-p5-history-sample-read.md`，未执行记 `incomplete`。
