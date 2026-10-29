# Phase P6 — 九条流程缺口各有固定名与断言，且不新增 stage

## L0 — 结果与变更

### 这个 Phase 做什么

给 make-decision 的九条流程缺口各一个固定名、一句可核动作、一条断言。
九条都要在方法正文找得到、在步骤表里有同步字段、在契约测试里被钉住。
步骤数仍是 15，阶段标识仍是 make-decision，不新增 stage、gate 或检查点。

为什么这九条必须在 C07 做、不能等 C08：
- 九条正落在本任务要走的流程上；等 C08 就等于按缺名的流程走完本次任务。
- 入口四问、调研决策、大纲确认现在没有固定名，读到的是一条模糊路径。
- 收口三项没有模板落点，「最终确认」会被当成进入下一阶段的许可。
- 用户已把这九条留在本任务实施并登记为范围例外，挪走即改动该决定。
- 若等到 C08，本任务要带着九个未收敛的流程缺口交付，材料先违一次规则。

### 交付什么

- 方法正文里九条固定名与各一句可核动作。
- 步骤表里对应的同步字段，步骤数不变。
- 决策日志模板与标准工作方法各一处收口口径。
- 一份契约测试：九组逐字断言，加步骤数与阶段标识两条钉死。

九条依次是：入口四级选择、调研决策、大纲确认、方向审查时点、
逐模块台账、细节审查前检查、领域词表读回、可核运行清单、
最终确认即阶段收口。

### 为什么现在做

现在做是因为九条都是同一类毛病：流程里有真实动作，却没名字、没证据、没测试。
本次任务剩下的 Phase 与后续任务都要按这套流程走，越晚改越多材料要回改。
它不依赖任何 Phase，可以立即开始；只动文档与步骤表，失败面在形状。
它也是唯一动流程的 Phase：后面几个 Phase 改脚本、做验收，都不碰它。

## L1 — 可执行契约

### 基本信息

- **全局规格**：`specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/spec.md#5-范围与非目标`。
- **写入集**：
  | 1 | `workflows/make-decision/SKILL.md` |
  | 2 | `workflows/make-decision/steps.json` |
  | 3 | `skills/decision-log/templates/decision-log-template.md` |
  | 4 | `docs/standard-workflow.md` |
  | 5 | `tests/contract/make-decision-flow.test.mjs` |
- **依赖**：`none`。
- **消费者**：tools/cli/check-stage-steps.mjs
- **gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/make-decision-flow.test.mjs`。
- **oracle**：ORACLE-P6-MAKE-DECISION-FLOW。
- **evidence_path**：`quality/evidence/build-code/P6-make-decision-flow.json`。
- **覆盖 AC**：AC-C07-5（借用，验收 1）。
- **STOP**：见「风险、回滚、停点」的风险一条与停点三条，逐条写处置与回原 owner。
- **Done**：一条验收记未执行；完成条件与恢复条件见「完成与交接」。

### 开始前要读什么

- 方法正文全文，268 行；入口路由在 `workflows/make-decision/SKILL.md:19-46`。
- 入口之后的四段：第 3 步 `:82-95`、第 5 步 `:131-136`、第 7 步 `:141-147`、
  第 9 与第 10 步 `:153-167`。
- 收口三段：第 11 步 `:168-172`、第 13 与第 15 步 `:180-195`、
  安全写入与收口 `:208-214`，检查器命令句在 `:210`。
- 步骤表 `workflows/make-decision/steps.json`：15 步，每步四个字段
  `step_id`、`step_slug`、`observable_result`、`completion_evidence`；
  顶层还有 `schema_version`、`stage_slug`、`flows` 三项。
- 决策日志模板：验收面在
  `skills/decision-log/templates/decision-log-template.md:135`，
  外置事实索引在 `:191`。
- 标准工作方法的 `## 当前路线` 段：收口口径写在这里。
- 不动面：契约决定 11 列的公共命令与运行时目录。

### 文件边界与任务

新增一个：
- tests/contract/make-decision-flow.test.mjs

修改四处，都是就地追加：
- workflows/make-decision/SKILL.md，九条固定名与动作句，不动 15 步结构。
- workflows/make-decision/steps.json，第 1、3、5、7、9、10、11、13、15 步
  的观察结果与完成证据追加同义句，步骤数不变。
- skills/decision-log/templates/decision-log-template.md，验收面末尾三行，
  外置事实索引一行指针。
- docs/standard-workflow.md，当前路线段加一句「最终确认＝阶段收口」。

只读，不许改：
- 三个子流程的正文与步骤表：归各自负责人，本 Phase 无消费者依据。
- `tools/cli/check-stage-steps.mjs`：只被调用，不修检查器。
- 决策日志、文档审查、交接三个技能的正文。
- 运行时目录与公共命令；任务自身的决策日志。

### T015 — 任务 1：入口四问有固定名，且与步骤 1／3／5／7 同步

这张卡给入口的四个时点各起一个固定名，并让步骤表同步。
四个时点是：开局四级选择、调研决策、大纲确认、方向审查时点。
固定名要落在指定节，出现在别处不算数，测试按二级标题切节。
跳过调研必须写理由，这是硬句，不许留空。

每项必须出现什么：

| 位置 | 必须出现什么 | 出处 |
| --- | --- | --- |
| `SKILL.md:19-46` 入口路由 | 四级表前一句含 `开局四级选择`，推荐一档且可覆盖 | 预写测试 entry 组第 1 例 |
| `SKILL.md:82-95` 第 3 步 | 含 `调研决策`；三选一；跳过必须给理由 | 预写测试 entry 组第 2 例 |
| `SKILL.md:131-136` 第 5 步 | 含 `大纲确认`，说明确认骨架不是最终方向 | 预写测试 entry 组第 3 例 |
| `SKILL.md:141-147` 第 7 步 | 含 `方向审查时点`，位置在大纲确认后、逐模块收敛前 | 预写测试 entry 组第 4 例 |
| `steps.json` 第 1、3、5、7 步 | 两字段含同一固定名 | 步骤表 15 步是唯一分母 |
| 既有结构 | 七条推荐顺序与四级表三列结构一字不动 | 契约决定 11 |

四处怎么落：
- 入口路由节：四级表前加一句，按入口事实推荐一档，用户可覆盖。
- 第 3 步：内部、内部加外部、跳过加理由，三选一，写进当前日志。
- 第 5 步：大纲确认，与第 13 步分工一句话说清。
- 第 7 步：方向审查时点，不改文档审查接口。

步骤表四步的观察结果与完成证据各补一句同义字段。

跑：node node_modules/vitest/vitest.mjs run tests/contract/make-decision-flow.test.mjs -t "entry"
看到：退出 0；四条固定名按节各命中一次；四步字段同步。

如果入口评估合同与固定名冲突：停该条，回原负责人裁定，不改评估函数。
如果固定名只能在别节出现：停，先改节的落点，不靠放宽断言过关。

机器字段（校验器用，人可跳过）：
- **来源 / FR / AC**：U-C07-40、U-C07-41、U-C07-42、D-038；FR-C07-023；AC-C07-5。
- **文件 / 符号**：`workflows/make-decision/SKILL.md`（修改；符号：`## 入口路由` 内四个固定名 `开局四级选择`、`调研决策`、`大纲确认`、`方向审查时点`）；`workflows/make-decision/steps.json`（修改；符号 `step_slug`、`observable_result`、`completion_evidence`）。
- **动作**：四个指定节各加一个固定名与一句动作，同步步骤表四步两字段。
- **输入**：入口路由现状与四级表、步骤表四步现状。
- **输出 / 失败**：四条固定名各在其节且步骤表同步；落错节或只改正文即判红。
- **边界 / 禁止改动**：不改子流程；不改第 1 步入口评估调用；不新增步骤；不改四级表三列结构。
- **依赖**：`none`。
- **测试层级 / 技能**：定向契约测试，按二级标题切节；主技能为规格写作技能。
- **场景 / 夹具或服务**：正常＝当前两文件真实字节；反向＝固定名挪到错节、删一条同步字段。
- **RED/GREEN 门禁命令**：`node node_modules/vitest/vitest.mjs run tests/contract/make-decision-flow.test.mjs -t "entry"`。
- **预期退出码**：RED nonzero; GREEN 0。
- **RED 目标失败**：ORACLE-P6-MAKE-DECISION-FLOW 的 entry 组因缺固定名而失败，`expect(sectionBody).toContain('开局四级选择')` 失败，属目标行为失败。
- **RED 证据**：`unavailable — build-plan 期不执行测试；真实 RED 由 build-code 首次执行写入 quality/tests/<date>-p6-entry.*`。
- **GREEN 判定器**：ORACLE-P6-MAKE-DECISION-FLOW 的 entry 组：四条固定名各在本节命中一次，步骤表同步。
- **证据**：`quality/evidence/build-code/P6-make-decision-flow.json`。
- **停止 / 恢复**：入口评估合同冲突就停，回原负责人裁定，不改评估函数。
- **覆盖上限**：只证明名字与位置，不证明执行者真按四问做了。
- **完成**：一条命令重放；四条固定名按节命中、四步字段同步、无步骤增删。

### T016 — 任务 2：逐模块台账与细节审查前检查可核

这张卡给两处判断各起一个固定名，并把停点写成可执行的句子。
一处是逐模块台账：每包一行，状态只取已答、事实可定、待你定。
另一处是细节审查前检查：先跑步骤检查器，有未收敛的包就停。
停不是失败也不是通过，恢复条件是收敛后重跑。

每项必须出现什么：

| 位置 | 必须出现什么 | 出处 |
| --- | --- | --- |
| `SKILL.md:153-167` 第 9 步 | 含 `逐模块台账`；每包一行与三种状态取值 | 预写测试 ledger 组第 1 例 |
| `SKILL.md:153-167` 第 10 步 | 含 `细节审查前检查` 与「未收敛即停」句 | 预写测试 ledger 组第 2 例 |
| `SKILL.md:210` | 检查器命令字面唯一：`node tools/cli/check-stage-steps.mjs --stage=make-decision --task-path=<任务目录>` | 预写测试 ledger 组第 3 例 |
| `steps.json` 第 9、10 步 | 两处固定名与停点一句 | 步骤表 15 步是唯一分母 |
| 既有结构 | 第 9 步五段顺序与包边界判据不动 | 契约决定 11 |

两处怎么落：
- 第 9 步：把现有五行小表与八项证据指针命名为逐模块台账。
- 第 10 步：把先跑检查器、有未收敛包就停命名为细节审查前检查。
- 步骤表第 9、10 步同步固定名与停点一句。

检查器只报告、退出 0；本卡不加参数，也不改它的退出语义。

跑：node node_modules/vitest/vitest.mjs run tests/contract/make-decision-flow.test.mjs -t "ledger"
看到：退出 0；两处固定名各在本节；停点句含「停」与恢复条件。

如果检查器现读字段与同步假设不符：停，回维护者取真实字段后再写。
如果停点被写成「视情况」：整段撤回，停点必须可执行。

机器字段（校验器用，人可跳过）：
- **来源 / FR / AC**：R-C07-23、U-C07-40、D-038；FR-C07-025；AC-C07-5。
- **文件 / 符号**：`workflows/make-decision/SKILL.md`（修改；符号 `逐模块台账`、`细节审查前检查`）；`workflows/make-decision/steps.json`（修改；符号 `steps[8]`、`steps[9]` 的两字段）。
- **动作**：两处判断各加固定名与可执行停点句，同步步骤表两处字段。
- **输入**：第 9 步的五段小表与八项指针、第 10 步现文、检查器调用句。
- **输出 / 失败**：两处固定名各在其节、停点含停与恢复条件；停点含糊即判红。
- **边界 / 禁止改动**：不新增检查器参数；不改检查器；不改第 9 步五段顺序与包边界判据。
- **依赖**：`T015`（同一文件串行，且第 9 步要用第 5 步的确认语义）。
- **测试层级 / 技能**：定向契约测试；主技能为规格写作技能。
- **场景 / 夹具或服务**：正常＝当前两文件；反向＝停点改成继续观察、删掉命令字面。
- **RED/GREEN 门禁命令**：`node node_modules/vitest/vitest.mjs run tests/contract/make-decision-flow.test.mjs -t "ledger"`。
- **预期退出码**：RED nonzero; GREEN 0。
- **RED 目标失败**：ORACLE-P6-MAKE-DECISION-FLOW 的 ledger 组因缺固定名而失败，`expect(step9).toContain('逐模块台账')` 失败，属目标行为失败。
- **RED 证据**：`unavailable — 同上，真实 RED 由 build-code 首次执行写入 quality/tests/<date>-p6-ledger.*`。
- **GREEN 判定器**：ORACLE-P6-MAKE-DECISION-FLOW 的 ledger 组：两固定名命中、停点句含停与恢复条件、命令字面唯一。
- **证据**：`quality/evidence/build-code/P6-make-decision-flow.json`。
- **停止 / 恢复**：检查器现读字段不符就停，回维护者取真实字段后再写。
- **覆盖上限**：不证明台账被执行；只证明形状与停点句在场。
- **完成**：一条命令重放；两固定名、停点句、命令字面三项命中。

### T017 — 任务 3：领域词表读回、可核运行清单与收口三项

这张卡把收口的三个事实落进三处文档，并让运行清单与步骤表对齐。
三个事实是：确认原件、领域词表读回、交接的绝对路径。
清单必须 15 行，每行一个步骤标识与一行完成判据，与步骤表逐字相同。
收口只说明这一步做完了什么，不是下一阶段的入口，也不催下一阶段。

每项必须出现什么：

| 位置 | 必须出现什么 | 出处 |
| --- | --- | --- |
| `SKILL.md:168-172` 第 11 步 | 领域词表读回句：变更就地写入并读回，或给有来源的不变理由 | 预写测试 closeout 组第 1 例 |
| `SKILL.md:208-214` 收口段 | 含 `可核运行清单`，15 行与步骤表逐字一致 | 预写测试 runlist 组 |
| `SKILL.md:180-195` 第 13、15 步 | 含 `最终确认＝阶段收口`，三个事实各有落点 | 预写测试 closeout 组第 2 例 |
| 模板 `:135` 验收面 | 三行：确认原件、领域词表读回、交接绝对路径 | 预写测试 closeout 组第 3 例 |
| 模板 `:191` 外置事实索引 | 一行指向确认原件的位置负责人 | 预写测试 closeout 组第 4 例 |
| 标准工作方法 `## 当前路线` | 一句同义口径，不复制方法与字段，不新增门 | 预写测试 closeout 组第 5 例 |

四处怎么落：
- 第 11 步加领域词表固定名与读回句。
- 收口段加 15 行清单，作为唯一可核清单。
- 第 13、15 步写最终确认＝阶段收口，三个事实各自有落点。
- 模板两处与标准工作方法各补一处，不改其它小节。

清单与步骤表双向比对，少一行就判红。

跑：node node_modules/vitest/vitest.mjs run tests/contract/make-decision-flow.test.mjs -t "closeout"
看到：退出 0；三处收口同名；清单 15 行与步骤标识双向相等。

如果模板已被别的写者改过：停，先读回当前字节再写三行，不覆盖他人改动。
如果标准工作方法被写成第二条标准：撤回那句，只留一句口径。

机器字段（校验器用，人可跳过）：
- **来源 / FR / AC**：U-C07-48、U-C07-40、D-038；FR-C07-028；AC-C07-5。
- **文件 / 符号**：`workflows/make-decision/SKILL.md`（修改；符号 `grill 与领域词表读回`、`可核运行清单`、`最终确认＝阶段收口`）；`workflows/make-decision/steps.json`（修改；符号 `steps[10]`、`steps[12]`、`steps[14]`）；`skills/decision-log/templates/decision-log-template.md`（修改；符号 `确认原件`、`GLOSSARY 读回`、`handoff 绝对路径`）；`docs/standard-workflow.md`（修改；符号 `## 当前路线` 一句）。
- **动作**：加读回句、15 行清单与收口三处口径，清单与步骤表双向对齐。
- **输入**：第 11 步与领域维护段、收口段、模板两节、标准方法当前路线段。
- **输出 / 失败**：三处同名同义、清单 15 行对齐；漏行或留待填即判红。
- **边界 / 禁止改动**：不新增 stage 或 gate；不改交接与反思技能正文；不改确认原件路径负责人；不改标准方法其它小节。
- **依赖**：`T016`（同一文件串行；清单引用的步骤名由前两张卡定稿）。
- **测试层级 / 技能**：定向契约测试，含行解析；主技能为规格写作技能。
- **场景 / 夹具或服务**：正常＝三个文件真实字节；反向＝清单少一行、模板留待填、标准方法多一条门。
- **RED/GREEN 门禁命令**：`node node_modules/vitest/vitest.mjs run tests/contract/make-decision-flow.test.mjs -t "closeout"`。
- **预期退出码**：RED nonzero; GREEN 0。
- **RED 目标失败**：ORACLE-P6-MAKE-DECISION-FLOW 的 closeout 组因模板缺行而失败，`expect(template).toContain('handoff 绝对路径')` 失败，属目标行为失败。
- **RED 证据**：`unavailable — 同上，真实 RED 由 build-code 首次执行写入 quality/tests/<date>-p6-closeout.*`。
- **GREEN 判定器**：ORACLE-P6-MAKE-DECISION-FLOW 的 closeout 与 runlist 组：三处同名、清单 15 行双向相等、标准方法恰一句。
- **证据**：`quality/evidence/build-code/P6-make-decision-flow.json`。
- **停止 / 恢复**：模板被别人改过就停，读回当前字节后重写三行，不覆盖他人改动。
- **覆盖上限**：不证明词表读回与交接真发生过；只证明三处口径在场且一致。
- **完成**：一条命令重放；三处收口、清单 15 行、标准方法一句三项命中。

### 写主与并行

唯一开发写手是本 Phase 的实施子代理，测试与审查只读。
三个任务串行：前两张卡改同一个正文与步骤表，同文件不同字段仍共享。
第三张卡要用前两张卡定稿的步骤名，所以排在最后。
五个路径互不重叠，也没有跨 Phase 共享路径。
若步骤表与子流程的消费者报不一致：回本 Phase 修，不改子流程。

### 怎么验证

门禁命令：node node_modules/vitest/vitest.mjs run tests/contract/make-decision-flow.test.mjs
期望：退出 0。
判定器：ORACLE-P6-MAKE-DECISION-FLOW。
证据：quality/evidence/build-code/P6-make-decision-flow.json。
不证明什么：不证明执行者真按九条做了，也不证明真人答复被读到。

### 风险、回滚、停点

最大的风险是把九条写成新流程分支：多加一步就改了阶段形状。
触发条件是测试发现步骤数不是 15，或出现新的一级流程节。
缓解是九条只以固定名加一句动作落进既有步骤，步骤数当断言钉死。
回滚只撤九条固定名与步骤表对应字段，保留既有 15 步原文。
无法回滚时把冲突那条交原负责人，其余八条保留。

停点三条：
- 某条要求新增步骤才能承载：停该条，保原正文，冲突写进证据交原负责人。
- 步骤表结构变化：停，回检查器维护者确认读取方式，不猜字段。
- 被要求改子流程：停，记无消费者依据，回原负责人。

### 完成与交接

一条验收记「未执行」，原因与恢复条件写清。
- 验收 1（定位、最小修复、独立复验）：未执行，计划期只有计划，
  契约测试尚未写入；恢复条件是 build-code 真跑门禁并落九组断言原件。

完成条件：九组断言在真跑里先红后绿；步骤数仍 15、阶段标识未变；
命令与退出码原件在场；独立审查按实际改动核写集。
交接：步骤检查器继续只读步骤表，不因本 Phase 改退出语义；
方法读者按九个固定名回读，材料作者不再重述九条。

## L2 — 可删除参考

这一节给人核对用，不参与执行。
- 代码锚点与逐字事实见
  `quality/evidence/build-plan/2026-10-29-003-code-anchors-and-consumers.md`。
- 契约决定 11：不动的面，公共命令与运行时目录。
- 工作树基准：HEAD `fa56dbc6`，2026-10-29 实读；方法正文 268 行，
  步骤表 15 步。
- 九条固定名的英文别名只在实现期给测试正则用，不入正文。
- 步骤表的追加句建议放观察结果末句，避免前移改变首句匹配。
- 标准工作方法那句话建议放当前路线段末。
