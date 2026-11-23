# Phase P5 — 同包当场讨论并保留完整答复

给方向实施者、独立复读者和首卡作者：把讨论留在正在收敛的包，答复按全文交下游。

> 写作只沿 `skills/material-writing/SKILL.md`「材料写作标准（唯一）」。
> 精确命令、路径、引文与机器读取的标题和标签保留原字面。
> `quality/` 引用相对本任务的认证任务根。

## 哪些节必须写，哪些可以省？

保留方法和报告两面有用的内容；本阶段不做末次整体验收。

| 节 | 声明与位置 |
| --- | --- |
| 选节 | `written`：本表区分本地与末验 |
| 交付、开工就绪 | `written`：同包、全文及可用版本 |
| 验收、依据、前读 | `written`：一条验收的机器和人读两面 |
| 文件与写序、验证 | `written`：实际步骤、报告、对照及恢复 |
| 下一消费者、任务卡及机器块 | `written`：原件交回与唯一任务 |
| 末验、脚手架、示例 | `not-applicable`：整体验收归阶段 7，模板示例不落盘 |

## 这一 Phase 交出什么？

用户在同一工作包看到展示、质询、冷读、对抗和真实答复；下游能读到全文。
冷读是没参与写作的人独立复述；对抗是从反例检查方案没覆盖什么。

合入的第 9 步已声明当包讨论；第 11 步仍保留整体细审后的原质询义务。
第 13 步的 14 行指需求索引，不是答复读取上限；实际全文读法仍待核。
把应在包内解决的问题留在第 9 步，不另设确认点或收敛文件。
第 5、6 步继续读同一份攻击自查；第 10 步仍做整体细审。
本阶段改收敛方法和最小报告，不替阶段 6 写首卡或改通用接包入口。
实际第 9 步保独立六问权威；前五问归现检查，第六问归卡的配套格。

风险是文本并线后仍先审后问，或把长答复末尾和跨包风险丢掉。
回退只撤本阶段文本与报告增量；新歧义和缺件回受影响的原包。
任务一默认卡、步骤和检查器随 `05c07332` 纳入 `ad1f8c30`。
在途任务的实际时序、当批逐包原答与改后的真实使用仍待核。
本任务主会话安排恢复和验收，不向任务一或未来任务转交缺口。
新版计划尚未确认；下面只规定获准实施后的顺序，不在本轮执行。
当次答复若只剩占位，不能因已有整体确认而放行本包验收。
先按前读表核流程和报告接缝；阶段 6 接五件，阶段 7 接本地首判原件。

### 开工就绪表

只核本阶段新增前提；全局身份与通用环境仍读规格。

| 命令 | 期望 | 证据 | 机器或人判 | 负责人 |
| --- | --- | --- | --- | --- |
| `test -f workflows/make-decision/steps.json` | 0 | `quality/tests/readiness-p05-steps.output` | 机器 | 阶段 5 写主 |
| 读已合入的默认卡、步骤及阶段 4 交回的共享检查器 | 阶段 4 未交回只停依赖它的写入和观察 | `ad1f8c30`、`05c07332` 与阶段 4 实际交回原件 | 人 | 阶段 5 写主、阶段 4 原写主 |
| 核当前答复索引与真实长答复和逐包原话 | 原件 037 只支持当前基线形状；逐包占位不算原话 | `quality/tests/2026-11-22-037-build-plan-material-repair-baseline-after.json` 与当批原件 | 人 | 本任务主会话 |

## 这一 Phase 怎么验收？

同一条验收结合报告行为与真实讨论回放，两种证据各判自己能观察到的部分。
界面不适用：工作对象是命令行、方法与材料，不读或驱动页面。

**验收 7。**
先比对同包五件，再用「怎么验证？」的定向组证明缺质询提示。
取阶段 4 回交文件、已合入的任务一版本和由本任务主会话组织取得的同包原答。
真实审查缺口批次只证原语境和全文，其正文在原件第 17、19 行。
它不能证明超过十四个物理行；无真实超长答复时，本任务保留该边界未验证。
另按「怎么验证？」冻结超过十四行的受控样本，双步复读并检查截断。
按规格附录 A 判：只缺质询必须点名但不改退出；未收敛仍走原失败路径。
另外将真实长答复尾部屏蔽，或让新风险停在整体细审，读者必须指出。
机器真跑：同断言改前目标失败预期非零、改后 0；基线合法输入预期 0。
人读核时序、旧答复适用对象与全文；不能用关键词缺席代替。
独立测试者与未参与本阶段的读者在实施审修后分别保原始输出及全文回读。
报告问题回阶段 5 写主；主会话核材料占位，未得真答复不宣验收完成。

| 条款 | executor | estimate_min | hard_cap_min | resources（来源） | observation | retry_cap | evidence_tier | 范围及不可再简的原因 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 验收 7 | 独立测试执行者与读者 | 20 | 40 | 本任务主会话组织五件与可得的真实答复；原写主交受控正反例，阶段 4 交同版检查器 | 讨论时序、全文与报告级结果 | 0 | 命令与语义原件级 | 只证本包讨论；报告不能判旧答复是否误用 |

按规格附录 A，机器和人读读数合记 `20 + 0 + 0 = 20 active_min`。
末两项是未另列共享准备和无原样重试；不重复对已含活动计价。
形状：一次同包真实流程及小组合成夹具（S），可直接做已可用面。
阶段预算：软上限与偏差率未确认；硬包络见表，不是质量门。
`execution_budget={window_minutes:unknown,command_cap:unknown,wait_cap:unknown,retry_reserve:unknown}`。
执行预算值未见已确认原答，由主会话回原决定人；单位为分钟或命令数。
用户当批答复、独立审查与本任务阶段 4 技术交回分别列纯等待，不计入活动估算。

## 为什么现在做，依据是什么？

先在包内解决歧义，首卡作者才能从真实材料开工，不回问已定方向。

决定 5 选择复用既有讨论和完整答复索引；原义见归档总需求第 382 行。
大纲许可写正式计划；旧卡卡末的骨架答复不能支持逐包答复效果。
本阶段接阶段 4 的检查器，不改变失效语义；下游判首卡，不在本阶段代判。

## 开始前读什么？

先找第 9 步真实讨论输入，再核同版的机器定义和读者。

| 实读材料或锚点 | 用途 | 读取时机 |
| --- | --- | --- |
| `spec.md` 附录 A 验收 7 与「接口与失败语义」 | 锁住报告级提示及当前写序 | 开工前 |
| `decision-log.md`「包5具体改什么、怎么改、怎么验」；任务根 `quality/evidence/decision-maker/p05/card.md` 第 7 格 | 找顺序、长答复、错用旧答复和跨包反例 | 开工前 |
| `workflows/make-decision/SKILL.md:209–222,310–354`；`workflows/make-decision/steps.json` 第 9–14 步；`workflows/make-decision/step-consumer-design.md:22-24` | 区分当包声明、后段质询、需求索引与真实答复读者 | 首改前 |
| `tools/cli/check-stage-steps.mjs:653–674,865–889,2120–2145,2435–2447`；`tests/contract/decision-evidence-consumption.test.mjs:396–545` | 区分报告级对照与五件原件的失败出口 | 冻结断言前 |
| `quality/evidence/build-plan/testing-blueprint.md:229-258` | 复核同包机器和人读如何分判 | 验收前 |

## 每个文件由谁改，先做什么？

原阶段交回各共享路径后才换写手；保留原报告行为，不重用退出条件。
无新增生产文件；实施修改路径如下。

| 精确路径 | 改动和唯一写主 | 消费者与前后顺序 |
| --- | --- | --- |
| `workflows/make-decision/SKILL.md` | 阶段 5 写主同步第 9、11–14 步 | 阶段 4 交失效说明；阶段 7 后接收口；不覆写阶段 1 分诊 |
| `workflows/make-decision/steps.json` | 阶段 5 写主同步既有步骤产物和完成描述 | 承接已合入的默认卡和步骤；保 slug、状态与其改动 |
| `workflows/make-decision/step-consumer-design.md` | 阶段 5 写主改 `grill-with-docs` 的骨架判据 | 根方法的完成判据读者；不改任务材料下的同名文件 |
| `tools/cli/check-stage-steps.mjs` | 阶段 5 写主在 `p5StrictGaps` 的同包已绑定讨论路径加提示 | 任务一→阶段 4→阶段 5；阶段 7 只读报告 |
| `tests/contract/check-stage-steps.test.mjs` | 当前卡测试作者只在确需时加公共退出语义对照，冻结后开发只读 | 任务一→阶段 4→阶段 5；先核不改阶段 4 冻结断言 |
| `tests/contract/decision-evidence-consumption.test.mjs` | 当前卡测试作者先在既有报告组写正反例，再冻结 | 阶段 2→阶段 3→阶段 5；保来源与覆盖原判据 |

前写者交实际当前文件及测试版本；读取不成记 unknown，冲突回原写主。
代码和测试的授权写入按上述顺序，不由两人并发改同文件不同段。
禁止改 `workflows/build-plan/SKILL.md` 及 `workflows/build-plan/steps.json`。
2026-11-23 实读其 `version: 4.2.0` 与 `schema_version=2.0.0`、`stage_slug=build-plan`。
禁止改答复索引求绿；同日 `shasum` 实读的绑定值见规格原件表。
旧卡、六问文字、十一格和冷读标记继续由原判据读取，不在这里改定义。
进度只指任务事实库原游标；本文件不是进度记录。

## 怎么验证？

同一份受控讨论输入走原报告入口；完整原答另用真实读回作证。
RED 与 GREEN 分别指同一目标断言改前失败与改后通过。

```sh
npx --no-install vitest run tests/contract/decision-evidence-consumption.test.mjs -t "P5 stage-steps evidence gaps" --no-cache --reporter=verbose
node tools/cli/check-stage-steps.mjs --stage=make-decision --task-path=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-direction-requirements-20261122 --material-root=/Users/Hugh/Hugh/Project/workflowhub-delivery-quality-direction-requirements-20261122/specs/delivery-quality-direction-requirements-20261122 --json
node skills/spec-plan/scripts/build-decision-baseline.mjs --decision-log specs/delivery-quality-direction-requirements-20261122/decision-log.md --reply-index /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-direction-requirements-20261122/quality/evidence/decision-log-refs/requirement-index.md
node tools/cli/check-decision-log-chain.mjs --file specs/delivery-quality-direction-requirements-20261122/decision-log.md --source-root /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-direction-requirements-20261122
node skills/decision-maker/scripts/validate-card.mjs /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-direction-requirements-20261122/quality/evidence/decision-maker/p05/card.md --bind --package /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-direction-requirements-20261122/quality/evidence/decision-maker/p05
```

在 `p5Fixture` 的合法输入上，只删讨论原件内拟单独提示的质询内容。
保持原件可读、包与批次绑定及五件声明；不删除质询原件本身。
五件缺质询原件或错绑时，方向检查仍走原有非零出口。
新断言须点名该包「讨论原件缺质询」并验证公开进程仍退出 0。
全收敛正例不产生该提示；保第 2 包未决时「未收敛：」和非零退出。
如果原测试接缝只读返回对象，用现有子进程测试接缝核退出，不从报告猜。
改前仅新提示断言失败才记目标 RED；收集、绑定、导入失败不记目标 RED。
老用例本来通过或跳过各自保真，不为造 RED 回退，也不把跳过算执行。
独立测试作者冻结新增目标用例、输入和期望；实施不得改断言求绿。
改变测试按本卡「测试变更请求」、独立审查及真实用户答复留原件。

人读先核原卡展示、质询五段、独立冷读、对抗和真正包答，再查整体细审时点。
真实答复见 `quality/evidence/decision-log-refs/talk/2026-11-22-review-gap-batch-005.md:15-19`。
同一受控答复逐行写十六个物理行，在第十五行放有意义的适用限定。
先定位第 12、13 步实际读取原答的路径与产物；两步均须定位并复述该限定。
未观察到实际读取或截断时照实记录，不把需求索引的行数当作截断证据。
对同一输入只提供前十四行，任一步漏掉限定均失败；受控结果不冒真实结果。
真实超长答复到时，由本任务安排沿同协议复验两步。
未出现时继续可做部分，不用显示换行或受控反例冒真实超长答复。
基线的 `--decision-log` 指日志，`--reply-index` 指绑定索引；输出为正文旁证。
步骤输出读 `convergence.gaps` 和进程退出，基线不替步骤实际消费。
第 11 步只续办已定词汇和难逆权衡，保原 Grill 覆盖与退出，不重问全包。
第 12、13 步逐条读索引和原话；第 14 步并列未覆盖与已答，只作原有确认。
相同问题和同一适用对象才可复用旧答；新歧义和风险退受影响原包。
冷读不降频，除非原方法要求的真实连续同包原件可回读。

#### 在途任务怎样保留原义务？

已合入的默认卡只说明当前卡形状，不等于在途任务的实际时序。
`convergenceChecklistGaps` 按裸「包 N」标题或轮次字段识别当前材料。
旧五件标题无轮次沿既有读取；材料分流不决定第 9／11 步时序。
仅沿实际第 9 步证据读取未完义务，不重贴标签，不用卡指纹当选择器。
旧任务用实际第 9 步记录、当时步骤定义及未完义务，沿旧时序完成。
冻结旧第 9 步已完、旧第 11 步待做的输入，按原义务完成质询再到收口。
同输入强迫重做第 9 步或跳过旧第 11 步，各作一项负控，独立读者必须拒绝。
新任务沿当前默认采用同包时序；已明确升级的在途任务逐项核未完义务。
找不到可回读的在途依据时，兼容保未判；本任务主会话停对应共享切换并查原记录。
不建版本字段、选择层、历史回退分支或第二工作流。

临时输入沿现 Vitest 同进程生命周期，按认证命名与原合同在 `finally` 清理。
原始测试、真实答复和失败由既有 capture 单独保留，不随夹具删去。
若只缺质询造成非零、或未收敛意外放行，停相应分支。
原写主对照阶段 4 交回版，只撤本卡的提示与必要文本改动区块。
保其他写主的调整、当前真实原答和失败；恢复后只复跑受影响正反例。
需新增步骤、改变退出强度或换验收口径时，交原决定人处理该路径。

## 本 Phase 自带判据小结

- 验了什么：gate 18 passed（`quality/tests/p05-evidence-gaps.green2.output`）；只缺质询点名且 exit 0；五件缺件/错绑、未收敛、错序、跨包与旧批次答复仍走原非零出口；`质询：无／未取得` 算缺失。
- 没验什么：真实逐包答复、超 14 行真实件、第 12/13 步全集读回（均 incomplete/unavailable）。
- 未验项条件与 owner：真实逐包答复由用户产生；长答复读回与独立首判由未参与读者执行。

## 下一消费者拿什么继续？

获准实施后，本任务主会话先组织核实并恢复唯一收敛清单和可回读的原件指针。
沿既有第 9 步和当前决策日志的外置指针维护，由本任务原材料写主执行。
不另造清单，不改历史原件，也不将恢复动作纳入本阶段产品代码写集。
能从实际原件补齐的先补；缺真实答复保缺口，不抄总体确认或占位。
只在仍有真实取舍时，由主会话按已定包序逐包问，办完当包再进下一包。
阶段 6 取当前包的五件、答复全文和准确指针，不取历史模板答复。
阶段 7 取本地首判、负控与限制，以及阶段 5 交回的实际工作流字节。
本任务主会话安排阶段 5 主持人从改后正常第 9 步处理首个自然出现的真实新工作。
独立读者在验收 7 原件记入口、输入、实际消费者和业务结果，供阶段 7 只读。
尚未自然出现时，本任务保留该实证未验；由首个真实新工作触发复验。
不拿旧问答、夹具或末段补写替代。
没有实际同包答复时，交具名缺口、责任人和复验条件，不交可接声明。

## 每张任务卡怎么写？

一张任务卡把同包步骤、报告字段和全文读回接成同一结果。

### 任务 5：在讨论当场收敛该包

为什么做：落到整个方向细审后才问，会漏掉当包影响和原答限定语。
交付什么：用户当包看到讨论、收到原答；读者能按全集找到它。
不做什么：不加步骤、状态、重复收敛件或硬失败，也不接管卡版本。
前置：阶段 4 验收 5 交技术版，不等真实变更；默认卡、步骤和检查器从已合入版本读取。
怎么做：先固定缺质询断言，再缩小第 11 步并同步步骤判据。
怎么验收：同时看定向机器和全文读回，任一坏例漏报都不能判过。
证据：保实际输出、讨论、真实问答与回读；历史绿只作对照。
下游（含何时停）：版本不实停共享路径，逐包原答缺失由本任务主会话核真实来源，只有真取舍才逐包问。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T005
- **来源 / FR / AC**: R-001、R-007；决定 5；FR-DISCUSS-001、AC-P5-001。包内完成收敛与真实答复，未收敛不先整体细审，答复读全集而非截行。
- **输入**: P4/T004 的 AC-P4-001 技术交回，已合入的任务一默认卡及步骤；本任务主会话组织五件与 U-005 真实全文，超十四物理行的真实件未取得，旧占位不作原话。
- **文件 / 符号**: `workflows/make-decision/SKILL.md`、`workflows/make-decision/steps.json`、`workflows/make-decision/step-consumer-design.md` 的既有步骤；`tools/cli/check-stage-steps.mjs` 符号 `p5StrictGaps`；`tests/contract/check-stage-steps.test.mjs` 与 `tests/contract/decision-evidence-consumption.test.mjs` `p5Fixture`、既有报告组。
- **动作**: 先冻结全收敛、只缺质询与未收敛对照；在同包已绑定讨论中补报告级点名。梳理第 9、11–14 步及根对照说明，保第 5、6 步同源与第 10 步整体用途。另修同一 CLI 的「报告级提示被退出谓词误吃」问题（同一判读面的缺陷归位修复，不改变任何退出语义）。
- **输出 / 失败**: 现有报告点名「讨论原件缺质询」但不改退出；错序、错用原答、截断或跨包问题不回原包均由独立读者具名。夹具回收不覆盖业务失败。
- **边界 / 禁止改动**: 规格判据、冻结测试、旧卡、真实原话、答复索引、任务一通用入口与红线切换；不新增阶段、确认或硬失败。
- **依赖**: blocked_by P4 技术交回；不等 AC-P4-002 真实事件。已合入版本只约束共享路径；实际时序以当次原件核实。
- **测试层级 / 技能**: `feature`；backend-testing；公开 CLI 报告合约与独立材料读回，命令见验证节；无 UI、在线服务、数据库或新 schema。
- **场景 / 夹具或服务**: 现 `p5Fixture` 同进程造受控输入，按既有生命周期清理；全收敛、只缺质询、未决且细审已启动；真实答复截尾、超十四物理行的双步对照、旧第 9 步后续质询及收口、错用旧答及跨包风险分别读回。
- **RED/GREEN 门禁命令**: `npx --no-install vitest run tests/contract/decision-evidence-consumption.test.mjs -t "P5 stage-steps evidence gaps" --no-cache --reporter=verbose`
- **预期退出码**: RED nonzero; GREEN 0。只缺质询的入口仍 0，未收敛保原非零；语义结论不由退出码产生。
- **RED 目标失败**: ORACLE-MD-005；只有「其余材料合法时，缺质询未点名」断言失败是目标 RED。夹具/配置、环境、未收集或本来通过分开。
- **GREEN 判定器**: ORACLE-MD-005；补齐时无新增缺口，只缺质询时点名且仍 0，未收敛仍失败。ORACLE-FULL-REPLY-READBACK 另判时序和全文正反例。
- **证据**: RED/GREEN 已落盘：`quality/tests/p05-evidence-gaps.red.output`、`quality/tests/p05-evidence-gaps.red.receipt.json`、`quality/tests/p05-evidence-gaps.green.output`、`quality/tests/p05-evidence-gaps.green2.output`（GREEN 实测 18 passed | 110 skipped）；人读回读 `quality/tests/p05-full-reply.readback.md`（真实讨论回放面 unavailable、超 14 物理行真实件未取得）。设计期的 `p05-discussion.*`、`p05-baseline.output` 从未落盘，改指上述实际原件、不建副本；设计件 `p05/card.md:11` 的「11 passed / 78 skipped」是设计期预期，以本条实测为准。设计期三条 grep 期望里，`grep -n "14 行"` 与 `grep -n "计划草案骨架"` 仍命中方法正文（`SKILL.md:344,351`；`SKILL.md:328,331`、`steps.json:182`），`grep -n "以真实计划骨架逐项质询"` 已无输出；命中的是正文义务句，不删内容凑空，该三条不再作本 Phase 验收门槛。
- **覆盖上限**: 只证本次同包过程与全文读取，历史报告、编排绿灯和真实首卡不互替。
- **停止 / 恢复**: 版本不符或阶段 4 未交回只停相应路径；退出回归或邻项误报回原写主撤本卡增量；真实答复缺失由本任务主会话核恢复条件；改方向或验收回决定人。
- **完成**: 前置（不作完成条件）：同一具名命令与辅助命令真实读回。完成条件（只写效果）：独立判当包真实收敛、全文及故意弄坏的路径；材料未得如实保缺口。

## 机器字段（校验器用，人可跳过）

- **全局规格**: `spec.md#实现设计全局权威`
- **写入集**: `workflows/make-decision/SKILL.md`；`workflows/make-decision/steps.json`；`workflows/make-decision/step-consumer-design.md`；`tools/cli/check-stage-steps.mjs`；`tests/contract/check-stage-steps.test.mjs`；`tests/contract/decision-evidence-consumption.test.mjs`
- **依赖**: P4
- **消费者**: P6 独立计划作者；P7 整链验证者
- **gate_cmd**: `npx --no-install vitest run tests/contract/decision-evidence-consumption.test.mjs -t "P5 stage-steps evidence gaps" --no-cache --reporter=verbose`
- **oracle**: ORACLE-MD-005；全文与顺序由 ORACLE-FULL-REPLY-READBACK 判
- **evidence_path**: `quality/tests/p05-evidence-gaps.green2.output`；`quality/tests/p05-full-reply.readback.md`
- **STOP**: 同版或真实答复缺失只停相应观察；本任务先补可核原件，真实超长件到时复验；无在途时序依据由本任务主会话停对应共享切换并查原记录；退出回归回本阶段原写主；方向或验收变更回决定人。
- **覆盖 AC**: AC-P5-001
- **Done**: 前置（不作完成条件）：具名命令、原输出和退出可回读。完成条件（只写效果，按 8 值档位逐条承接 AC）：AC-P5-001：incomplete；证据 quality/tests/p05-evidence-gaps.green2.output（机器面 18 passed）、quality/tests/p05-full-reply.readback.md（真实回放面 unavailable）；未通过原因：逐包真实答复仍是 {ans} 占位、超 14 行真实答复未取得、第 12/13 步全集读回未做。
