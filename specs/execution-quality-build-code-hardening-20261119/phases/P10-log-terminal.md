# Phase P10 — 给规划与审查可消费的日志，并完成一次总验

下游能从日志、原件和现行阶段完成三次各自的对账，独立验收者能在同批材料上签，然后一次读回实际交付。

## 哪些节必须写，哪些可以省？

结果、判据、依据、读集、写主、验证、下游、任务卡和机器字段均已写。
本段同时是唯一末验收，已写最后检查。
模板脚手架与可选例子省略。

## 这一 Phase 交出什么？

下游能从日志、原件和现行阶段完成三次各自的对账，独立验收者能在同批材料上签，然后一次读回实际交付。

- **改动前**：当前已有 v2 日志、A 表及部分消费者字节。日志链是 advisory，已跑的 baseline 可读性不能证明每条需求实际成为下游输入。
- **改动后**：规划与三类审查消费 v2 源和旧日志各自能解释的范围。对账指向真实输入、独立发现和实施结果。最后一次验收复用上游原件。
- **非目标**：只读旧模板、旧项目问题和历史原件。末段复用上游各段首判，不重新全量测试或再次做独立验收。
- **与相邻 Phase 的边界**：P3 已交当前 v2 模板供件。P7、P8、P9 分别交页面、收口能力、回放与独立对账。P10 首判本包八条（AC-P10-001 至 AC-P10-008）并负责最终聚合全部 26 条。
- **主要风险**：审后关闭表被当作初审输入，或先归档导致读者只认已不存在的原路径。冻结活动字节和原 Git 对象，审后补读回。
- **下一步**：独立验收者签冻结证据，用户确认实际收口范围；关闭消费者完成已授权动作并回读给下一任务。
- **动手前必读**：从现行入口查到待消费的真实证据，见本文件读集。
- **未决事实**：终末活动分钟和外部条件须据真实源量测。真实签字人选身份到执行确认。来源缺失、失败或灰度中断逐项显示，不能提前宣称最终成功。
- **配套与影响**：配套调整＝`skills/material-writing/SKILL.md` 的记录节例外、`skills/spec-plan/scripts/build-decision-baseline.mjs` 与 `skills/wh-review/scripts/review-materials.mjs` 的读取；配套迁移＝v1→v2 逐包迁移、旧 12 包行只作素材；配套移除＝旧 69 个 AC 槽位与索引空槽、旧模板改造方案、包 3 的「唯一十项来源」声明；影响范围＝build-plan 作者与审查者、baseline、四查与覆盖矩阵的读取口径。

## 这一 Phase 怎么验收？

- 防再发（build-plan 审查后）：baseline 对 14 条需求全命中，不只 3 条；每条有 AC 或“已声明不做”。

先由另一执行单元判本段首验。测试退出值仅证明命令曾到达自身结果。
前九段已有首判的结果保各段原证据，详见末段检查。
本段复用阶段 7 页面及截图原件；实际页面观察归第 7 段。本段只读其原件。

**验收 1 的实施安排｜AC-P10-001**

用当前 v2 日志与历史模板样本经同一真实链检查和人工读回，逐包定位设计历程和真实来源。
当前工作树日志和任务库需求索引。独立者读取实质原件，旧日志使用只读样本。
按附录 A 核完整设计。负例：将设计历程压成已决定、缺最初方案或空验收位置，消费者应指名缺失。
同一命令和实际消费者均须读回。链检查报告真实缺口，核其指针与原件。
用当前实际材料及既有调研台账逐项对照问题和权威外部原文。
对每个问题记录可回读的外部同类做法、来源、适用性、处置或具名缺项。
在同一受控对照移去一条来源。若一个抽样或主题泛引仍被判全量覆盖，即失败。
原话或调研缺证显名并记 incomplete，列负责人及可观察的恢复条件。
本轮补研按已定位的原问题范围逐题核。历史逐问题调研、两份历史报告、同版图故障原文与 T8 同工作量可比归因仍缺。
新证据只证明当前补研和实际来源。整项结果由独立验收者按原判据核，缺项沿规格原归口。
故意删掉缺口负责人或用补录盖住历史原件缺失，独立者须指出无归属或掩盖。
真实告警照实保留，链检查退出状态只作提示。
判据唯一来源是 `../spec.md#appendix-a--验收判据唯一权威` 对应编号。来源 R-001 / R-007 / R-022 / D-010。
证据计划：判什么与怎么判在本段首四行。证据从实际 当前日志、索引、链提示与读回原件 取得。
由独立日志验收者提供并在当前材料已可读；本段录真实消费留原件。成本类别为独立读回级。
原件不存在由材料 owner 补或明确缺口。

**验收 2 的实施安排｜AC-P10-002**

沿 A 表逐条反查原始需求、答复、决定、验收及未齐 owner。复用本轮已存在的人工原件。
本任务实际索引、现行日志、旧 R 对照。转写和补录各保真实身份。
破坏一条为合并笼统覆盖或退役槽位，独立执行者必须定位缺源和落点。
本轮可读的 A 事实单独记录。未来自动调用须有实际动作和结果，快照读回不代新接口联通。
判据唯一来源是 `../spec.md#appendix-a--验收判据唯一权威` 对应编号。来源 R-001 / R-022 / D-010。
证据计划：判什么与怎么判在本段首四行。证据从实际 A 表、原始来源、复核原件 取得。
由独立材料验收者提供并在当前核源及实现后实际调用留原件。成本类别为独立读回级。
索引旧错引保留原件并回源修，按具名缺口出结论。

**验收 3 的实施安排｜AC-P10-003**

B 在独立阶段材料齐后核包与阶段，C 在实际审查处置后核包内容与发现。经 baseline 实际消费者核关系。
已成的 spec、真实 Phase、审查原件和处置记录。各既有事实只保存一份。
故意换 Phase 归属或把实际断言仍在的 finding 标 fixed，C 应指出真实差异。C 不作为同轮初审的前置。
现有组包先送当前决策 baseline、原始需求及阶段投影。本段不跑空审查，不用历史处置填当前缺口。
判据唯一来源是 `../spec.md#appendix-a--验收判据唯一权威` 对应编号。来源 R-001 / R-012 / R-022 / D-010。
证据计划：判什么与怎么判在本段首四行。证据从实际 B/C 引用、实际组包或审查读回、真实处置证据 取得。
由独立规划审查者提供并在拆卡后与实际处置后各自读回留原件。成本类别为独立读回级。
无真实审查时保未取得范围，先完成可独判的 B。

**验收 4 的实施安排｜AC-P10-004**

用现有四份定向合同用例，证明实际三类审查和规划读取。增加未送正确信息的负例。
固定当前日志、明确的旧日志夹具与该任务实际源码。
用全局验证策略里的真实 baseline 命令输出逐项核需求 1–14。
对照每项编号、实质原文与真文件行位，条目数仅作对账结果。
带标题源以当前日志原位为预期，旧形态用原夹具验证兼容。
破坏一处消费者的组包输入。方向缺最初选择、细节少包、规划漏十项均需具名识别。
带标题的需求条目如被吞，须逐项指出漏项或错位。
独立读者已观察到修前命令退出 0、需求区只列 1–3。
冻结子判据见 `quality/tests/2026-11-19-012-build-plan-prewritten-requirement-oracle.mjs`。
实际修前原件为 `quality/tests/2026-11-19-012-build-plan-requirement-target-red.output`。
它证实带标题需求会漏读；修后的原文和行位、旧形态兼容仍按本段完整验收判。
当次规划审查另投需求 1–14。该独立投递不替 baseline 取得通过。
四套合同真跑后依原件验当前范围。缺 runner 时先补实际任务依赖，不用空跑下载或假结构诊断。
判据唯一来源是 `../spec.md#appendix-a--验收判据唯一权威` 对应编号。来源 R-001 / R-012 / D-010。
证据计划：判什么与怎么判在本段首四行。证据从实际 定向测试及实际投影原件 取得。
由独立合同验收者提供并在实现和按原反馈修复后留原件。成本类别为命令级。
未安装/导入异常算环境失败，不得记目标红。

**验收 5 的实施安排｜AC-P10-005**

逐条把需求 2 的根因排序对回历史审计原件，再对回当前材料问题清单。
本轮已有 T13/T8 审计读回、需求索引 R-007 与 L-07、外部来源指针。
负例：把根因排序压成一句结论，或用主题泛引代替逐问题来源，独立者须指出缺证据。
T8 同工作量可比归因未取得时写具名缺口与 owner，不写成已证。
判据唯一来源是 `../spec.md#appendix-a--验收判据唯一权威` 对应编号。来源 R-002 / R-007 / D-010。
证据计划：判什么与怎么判在本段首四行。证据从实际 根因排序、历史审计读回与外部来源 取得。
由独立日志验收者提供并在当前材料已可读；成本类别为独立读回级。

**验收 6 的实施安排｜AC-P10-006**

读 `skills/material-writing/SKILL.md` 的记录节例外声明原文，核它只扩记录节。
再核同一文件的十一条与普通写作规则未变，v2 模板仍是十项唯一来源。
负例：借例外放宽句长或漏洞检查，或把十项再写成第二份规范，独立者须指出。
写作标准未接纳记录节时记具名缺口与 owner，不用模板在场代过。
判据唯一来源是 `../spec.md#appendix-a--验收判据唯一权威` 对应编号。来源 R-010 / R-011 / D-010。
证据计划：判什么与怎么判在本段首四行。证据从实际 写作标准当前字节与 v2 模板对应节 取得。
由独立日志验收者提供并在第 10 段实现后留原件。成本类别为独立读回级。

**验收 7 的实施安排｜AC-P10-007**

十个包逐包读配套四项，至少两包抽到具体文件与消费者。
数据取决策日志第 4 节逐包「配套与影响」节与各 Phase 的配套与影响行。
负例：只有个别包有四项、其余用「沿决策日志」带过、移除项仍写待定，独立者须指出。
缺项写 owner 与补齐时点，不用空白格冒充不适用。
判据唯一来源是 `../spec.md#appendix-a--验收判据唯一权威` 对应编号。来源 R-022 / D-010。
证据计划：判什么与怎么判在本段首四行。证据从实际 逐包配套节、十个 Phase 文件与抽读记录 取得。
由独立规划审查者提供并在第 10 段聚合时留原件。成本类别为独立读回级。

**验收 8 的实施安排｜AC-P10-008**

B 在拆卡后粗查包与阶段，C 在审查处置后细查十项与 findings，逐行核源。
现状是 B/C 的 caller 与检查尚未实现，本条记 incomplete，owner=包 10，时点=build-code 实现后。
负例：Phase 与包错配、需求只在合并句出现、标 fixed 但同一断言仍在，独立者须指出。
审后表不得冒充同轮审前输入；无真实审查时保未取得范围，先完成可独判的 B。
判据唯一来源是 `../spec.md#appendix-a--验收判据唯一权威` 对应编号。来源 R-012 / R-016 / U-022 / D-010。
证据计划：判什么与怎么判在本段首四行。证据从实际 B/C 对账、baseline 输出与审查处置原件 取得。
由独立规划审查者提供并在实施后各自读回留原件。成本类别为独立读回级。

**成本、资源和范围**

成本均为预案，来源是实际操作切分和现测试蓝图
`quality/evidence/build-plan/2026-11-19-009-test-blueprint-inputs.md:45–50`。
按现条件完成第一条真运行后校准。硬估不上升为执行超时或通过判据。

| 验收 | 执行者 | 活动分钟 | 硬估分钟 | 重验预留 | 证据档位 | 资源 | 观察或活动来源 |
| --- | --- | ---: | ---: | --- | --- | --- | --- |
| AC-P10-001 | 独立日志验收者 | 13 | 18 | 源或模板改变后只核影响面 | 独立读回级 | 当前 v2、旧样本、实际链检查 | 读取和对照新旧设计范围约 8，故意折叠设计并核诊断约 5 |
| AC-P10-002 | 独立材料验收者 | 14 | 20 | 纠正来源后复核实际变更行 | 独立读回级 | 当前 A 表、原始请求和确认 | 逐条读原 ref/哈希与 owner 约 9，旧槽与合并反例约 5 |
| AC-P10-003 | 独立规划审查者 | 26 | 38 | 修正已声明差异后复验真实行 | 独立读回级 | 当前阶段、实际组包和审查处置原件 | 粗查 B 约 9，审后核 C、finding 与真实 diff 约 17 |
| AC-P10-004 | 独立合同验收者 | 27 | 42 | 同一实际消费者限定复验 | 命令级 | 现有四合同文件、实际 baseline 和受控坏包 | 冻结并运行定向合同约 15，逐项读实际投影及旧消费者约 12 |
| AC-P10-005 | 独立日志验收者 | 16 | 26 | 根因来源补证后只核影响项 | 独立读回级 | 历史审计原件、当前材料问题、外部来源 | 读根因排序和审计读回约 9，逐项对来源与缺项约 7 |
| AC-P10-006 | 独立日志验收者 | 10 | 16 | 写作标准变化后只核记录节 | 独立读回级 | 写作标准当前字节、v2 模板 | 读记录节与普通规则约 6，核十项唯一来源约 4 |
| AC-P10-007 | 独立规划审查者 | 14 | 22 | 某包补项后只核该包 | 独立读回级 | 逐包配套节、十个 Phase 文件 | 逐包读四项约 9，抽两包核文件与消费者约 5 |
| AC-P10-008 | 独立规划审查者 | 18 | 28 | 修正已声明差异后复验真实行 | 独立读回级 | A/B/C 表、baseline 与审查处置 | 核 B 约 6，审后核 C 与 findings 约 12 |

冻结同一份输入后，新旧日志读者与 A 表读者各用只读副本，可并行。
B/C 实际对账与合同复跑用各自原件或隔离输入，也可并行。
终末覆盖组（AC-P10-005 至 AC-P10-008）只读同一批已冻结原件，与上面两组并行。
等到实际 findings 和处置才做 C，等待单列，不冒活动时间。
末验再顺接前段原件读回、必要未闭环用例 34/49 分钟。
权限齐且远端没有冲突时，实际归档、两次推送和收尾读回估 22/42 分钟。
该物理动作才占活动时间。用户确认、独立签字和远端响应的纯等待单列。
按 max(13,14) + max(26,27) + max(16,10,14,18) + 34 + 22，预计活动 115 分钟，硬估 181 分钟。
独立席位不可并行时，顺序上界估算 194/301 分钟。
各分项各留一次受影响复验的预算空间，较窄方案已复用 P1–P9 原件。

## 为什么现在做，依据是什么？

P3 已交当前 v2 模板供件。P7、P8、P9 分别交页面、收口能力、回放与独立对账。P10 首判本包四条并负责最终聚合。
`decision-log.md:587–650,645,658` 与任务库 `006-ten-phase-outline-answer.md`、`013-page-preview-and-acceptance-answer.md`。

## 开始前读什么？

先从真实入口和前段不可变交回读现物，再开工。
本表是坐标，行号变化时按对应符号定位。

| 来源 | 到达时点与用途 |
| --- | --- |
| `tools/cli/check-decision-log-chain.mjs:399,739` 与 `skills/spec-plan/scripts/build-decision-baseline.mjs:155,240` | 开工前。核链检查真实输入和已支持参数。 |
| `skills/wh-review/scripts/review-materials.mjs:43–64,255–274,570–600,785` | 开工前。核方向、细节和规划审查实际组包。 |
| `workflows/make-decision/SKILL.md` 的第 13 步与 `workflows/build-plan/SKILL.md:55–74` | 开工前。核 A、B、C 的实际写入、初审和处置时点。 |
| 当前任务库需求索引 R-007 / L-07、决策日志第六节、`quality/evidence/build-plan/2026-11-19-026-history-evidence-recovery.md` | 对账原问题及历史已取得与未取得。 |
| `quality/evidence/build-plan/2026-11-19-028-external-evidence-foundations.md`、`quality/evidence/build-plan/2026-11-19-029-external-evidence-risks.md`、`quality/evidence/build-plan/2026-11-19-030-external-evidence-source-index.md` | 按当前补研的已定位范围回读真实问题、外部出处和适用边界。缺项沿原调研负责人。 |
| `runtime/task/final-chain-runner.mjs:922–944` 与 `workflows/build-code/SKILL.md:152,306–310` | 开工前。复用实际终末报告和 active/archive 读回。 |
| 任务库 `quality/evidence/build-plan/2026-11-19-009-test-blueprint-inputs.md:28` 与 `013-page-preview-and-acceptance-answer.md:14–18` | 开工前。核真实用户范围和证据分级。 |

## 每个文件由谁改，先做什么？

实施者独占产品代码写入。独立测试作者独占下列测试文件，在实施前准备并冻结断言。
实施者的写权限排除判据、夹具与原始证据。
没有独立观察权限前只记未取得，不凭文件声明认定隔离。

**新增**：无，复用现有日志、链检查和审查入口。

**修改**

- `skills/decision-log/SKILL.md`。明确 v2 与历史模板各自的普通读者，保当前唯一日志入口。
- `skills/material-writing/SKILL.md`。落实已批准的记录节例外，保普通写作规则。
- `skills/spec-analyze/SKILL.md`。沿同一方法接 A 真实回读及 B/C 复核。
- `skills/spec-plan/scripts/build-decision-baseline.mjs`。让实际日志、spec 与包级设计投影成为下游输入。
- `skills/wh-review/scripts/review-materials.mjs`。方向、细节和规划各引用实际范围和源。
- `tools/cli/check-decision-log-chain.mjs`。复用原链检查器报告十项及有源缺项，保历史 advisory 语义。
- `workflows/make-decision/SKILL.md`。方向查最初方案与否定来源，细节逐包核完整设计，收口消费 A。
- `workflows/build-plan/SKILL.md`。第六步粗查 B，初审投真实基线和投影，处置后细查 C。

**测试作者独占的修改**

- `tests/contract/spec-analyze-classes.test.mjs`。补 B 表阶段错配、C 表发现处置与原差异不符的定向用例。
- `tests/contract/decision-evidence-consumption.test.mjs`。补 v2 本条输入的实际 A 表、原来源和下游消费断言。
- `tests/contract/review-decision-baseline.test.mjs`。补带标题漏项的定向反例。
  以当前日志的需求原文与行位做逐项对账，并保旧形态的兼容断言。
- `tests/contract/review-materials-contract.test.mjs`。补方向、细节和规划投递各自读到应有原件的定向用例。

P2 的测试作者先交原件与交接断言，P3 的测试作者再交逐包消费断言。
本段测试作者从 P3 的已核文件继续，只补日志与 A 表的实际消费切片。
前两段的冻结断言及原件保原权威，必要变更仍沿既有变更请求。

**禁止改动**

- 实施者对上述测试与冻结断言保持只读。
- `spec.md`、当前 `decision-log.md`、Phase 指针、历史材料、旧失败与已保留原件只读。
- 未知忽略字节、主仓现有编辑以及真实远端任务范围从属于各自授权。在本段夹具测试中保持只读。

P3 早交 v2 模板和已接消费者。P4/P5 先交 `workflows/build-plan/SKILL.md`，P10 后接 A/B/C。
P2 先交链检查的来源读回，P3 先交新旧日志入口与 make-decision 产出。以 P8/P9 收口读回为输入，不改其写集。
接口符号见逐路径说明。测试准备可并行，任何同一源写入按实际依赖串行。
进度只读现 `facts.jsonl#phase_progress`，该值不能支持质量声明。

## 怎么验证？

独立测试作者先冻结目标断言，再在认证工作树安装现有锁定依赖后跑同一命令。
组合 Vitest 及其余目标断言尚待预写与运行。已取得的单项目标 RED 见上方 012 原件。
真实 runner 不存在时记配置失败，修设置后再取得目标读数。

`node node_modules/vitest/vitest.mjs run tests/contract/spec-analyze-classes.test.mjs tests/contract/decision-evidence-consumption.test.mjs tests/contract/review-decision-baseline.test.mjs tests/contract/review-materials-contract.test.mjs -t 'v2 log evidence through actual consumers|phase and findings reconcile against v2'`

- RED 目标：实际审查/规划消费者将本日志落点丢成旧槽位，漏合法原需求或不发现伪造处置。用冻结检查触发可命名的目标断言。
- GREEN 目标：实际入口逐条消费当前日志和旧日志，负例可定位；B/C 落点与真实发现、源码和阶段引用一一可核。
- 归因：目标断言已抵达且失败才是 RED。收集、未找到测试、导入、夹具和环境失败另列。
  已满足的原行为保原本通过。
- 反例用独立输入和来源期望。不能从当前输出反算预期。
- 失败处理：新解析或投递失真时只撤相关写入，旧模板及真实错投和失败保存。归档与推送发生后只补真实读回或授权后修复，不覆写已签字原件。
- 覆盖上限：最小合同复放不代外部 provider 的理解、失去的历史原件、真实签字或物理交付；真实页面行为及排版截图复用 P7 原件。

## 下一消费者拿什么继续？

P10 交单份既有终末报告、独立签字、授权确认、物理结果、图与下次读取路径。当前资料先冻结，后置读回按事实挂同一报告来源，任何不可比或失效保持其档位。


## 验收 Phase 才能做的检查

最终验收一次消费当前十段的实际原件，执行必要的未闭环用例，再读回获授权的实际关闭。

1. 核阶段 1–9 的 Done、真实写集与任务事实。
   证据按各段的 Done 指向实际不可变原件，逐条记录实读或缺失。
2. 将第 4 段隔离数据就绪和第 5 段环境就绪的已有真实证据逐件读回。
   终末引用其各自的 `quality/evidence/` 原件。
   已记录的 stdout 优先引用，不复制为第二证据。缺项保原状态。
3. 本段技术执行只触本仓认证任务与隔离样本。
   真实关闭由现有主会话按当前权限核实际账户、具名任务分支、目标分支、远端、范围和 Git 提交位置。
   权威是 `skills/stage-close/SKILL.md` 第 6 节下适用的同一次真实范围确认。
   两次推送各自留独立授权/消费与远端引用记录。
   实际允许范围以届时读取为准，配置未核、凭据失败和远端漂移停止该步。
4. 独立验收者先以当前任务、写集、材料指纹和原件匹配首判。
   终验只补未闭环子条件。角色证据分别来自各段的独立测试、独立审查与真实消费者。
   具名证据矩阵和计划档位详见本文件 Done，不提前标通过。
5. 留实际 runner、版本、命令、工作目录、执行者、退出值、信号、超时及原输出。
   区分缺环境、目标失败、恢复、首次失败后转通过及原本就通过。
6. 效果基线取相同输入的实际已冻结读数。行为依据原有判据，任何计数、指纹或退出都只佐证范围。
   欠缺匹配输入或可比成本时，按风险项出具名缺口。
   页面效果引用 P7 的真实页面与需要排版的截图，终验读其原件。
7. 至少取具名目标失败转绿和合法旧用例保持通过的原件。
   复验人与修复人保持不同上下文。只重跑影响套件，未覆盖范围列名。
   适用的测试资产治理档位按原规范记，不作本计划判据。
8. 测试变更按 TCR 保真实批准、影响、原件和复验。
   改业务判据另需真实用户答复。没有变更时用无及依据记入现有原件。
9. 原 owner 先复现，独立者分诊及复查。失败留真实输入、版本、影响、处置与关闭身份。
   有未解决的重大风险保持缺口，等负责者修复或由用户按现行合同承担风险。

关闭顺序为冻结与独立签字，用户确认实际物理范围，然后按授权归档、同次提交、推送并读回。
原签字对应的材料移动时按冻结对象或认证 archive 读同一字节。
后发生的 PR、推送、图和清理原件由现行收口段记录并回读至同一总验。
无关历史、真实库及全量回归不在本段操作面。

## 每张任务卡怎么写？

下面一张卡从真实输入走到相同消费者的完整可判结果。

### 任务 10：给规划与审查可消费的日志，并完成一次总验

为什么做：下游能从日志、原件和现行阶段完成三次各自的对账，独立验收者能在同批材料上签，然后一次读回实际交付。
交付什么：规划与三类审查消费 v2 源和旧日志各自能解释的范围。对账指向真实输入、独立发现和实施结果。最后一次验收复用上游原件。
不做什么：只读旧模板、旧项目问题和历史原件。末段复用上游各段首判，不重新全量测试或再次做独立验收。
前置：先读取冻结输入及前段真实供件，见本文件读集。
怎么做：按共享写主先后，接现有入口并以独立反例固定失败。
怎么验收：跑上方受影响命令，按附录 A 的预期及命名目标断言回读。
证据：分别留 RED 原失败、GREEN 与其真实条件。
下游（含何时停）：独立验收者签冻结证据，用户确认实际收口范围；关闭消费者完成已授权动作并回读给下一任务。 缺一个具名原件时转原负责人处理。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T010
- **来源 / FR / AC**: R-001、R-007、R-012、R-022、U-022，FR-WH-010，AC-P10-001, AC-P10-002, AC-P10-003, AC-P10-004, AC-P10-005, AC-P10-006, AC-P10-007, AC-P10-008。下游能从日志、原件和现行阶段完成三次各自的对账，独立验收者能在同批材料上签，然后一次读回实际交付。
- **输入**: 当前日志、规格和前段实际原件。P3 已交当前 v2 模板供件。P7、P8、P9 分别交页面、收口能力、回放与独立对账。P10 首判本包四条并负责最终聚合。
- **文件 / 符号**: `skills/decision-log/SKILL.md`；`skills/material-writing/SKILL.md`；`skills/spec-analyze/SKILL.md`；`skills/spec-plan/scripts/build-decision-baseline.mjs`；`skills/wh-review/scripts/review-materials.mjs`；`tools/cli/check-decision-log-chain.mjs`；`workflows/make-decision/SKILL.md`；`workflows/build-plan/SKILL.md`；`tests/contract/spec-analyze-classes.test.mjs`；`tests/contract/decision-evidence-consumption.test.mjs`；`tests/contract/review-decision-baseline.test.mjs`；`tests/contract/review-materials-contract.test.mjs`。
  逐路径说明点名实际符号与读者。未知入口须回相同 owner 核查。
- **动作**: 从 P3 交回的唯一 v2 模板和当前真实日志开工。先在链检查器内部核 v2 十项及来源，原 advisory 入口保历史读法。普通调用不因新增格式丢旧原件。
  在 baseline 与三类现审查组包入口接好真实输入。方向保最初方案、谁否与缘由。
  细节逐包核真实内容。规划投递完整设计和原需求范围，确保没有仅摘要自指。
  baseline 保留带标题条目的来源和正文。测试从现有 CLI 输出逐项匹配原位及实质内容。
  消费现有调研台账和当前材料问题，按 AC-P10-001 逐项读权威外部来源、适用性和处置。
  缺项保真实记录与补证负责人。当前只读对照及具名反例，不重启旧方向阶段。
  沿现有方法，make-decision 末核 A，并区分本轮人工已有的 A 与后来自动化。build-plan 拆卡毕核 B，审前用当前真实基线与投影，审查后按实际 findings 细核 C。
  最后一次聚合阶段 1–9 的具名原件，执行当前需要补的正负链路。冻结实际材料后交独立验收者签；用户再按现合同确认真实收口对象范围。授权后实际归档和推送，最后读取真实结果及图回执。
  归档读回复用 owner 已有 active/archive 选择和同一对象字节，不写回历史。依同一最终报告引用已发生后置原件，不额外新增报告和收口许可。
- **输出 / 失败**: 规划与三类审查消费 v2 源和旧日志各自能解释的范围。对账指向真实输入、独立发现和实施结果。最后一次验收复用上游原件。 新解析或投递失真时只撤相关写入，旧模板及真实错投和失败保存。归档与推送发生后只补真实读回或授权后修复，不覆写已签字原件。
- **边界 / 禁止改动**: 冻结测试与原始证据不可写。只读旧模板、旧项目问题和历史原件。末段复用上游各段首判，不重新全量测试或再次做独立验收。
- **依赖**: P1, P2, P3, P4, P5, P6, P7, P8, P9
- **测试层级 / 技能**: feature / `backend-testing`。接口、跨模块和独立语义读回。
  精确命令见成对门禁命令，页面与生产外部权限的覆盖边界见正文。
- **场景 / 夹具或服务**: 同进程分离仅供读取的实际任务原件和可再生的历史样本。反例只写临时副本，清理只触拥有路径。真实计划和原始审查件保留。
  超时或 SIGINT/TERM 按现有流程关闭拥有的子进程并保初错。
  SIGKILL 后下次只对已验证 owner、路径及节点身份的可再生残留做受控回收。
  仍活进程、符号链接、节点身份变化或未知目录保留并具名报告。
- **RED/GREEN 门禁命令**: `node node_modules/vitest/vitest.mjs run tests/contract/spec-analyze-classes.test.mjs tests/contract/decision-evidence-consumption.test.mjs tests/contract/review-decision-baseline.test.mjs tests/contract/review-materials-contract.test.mjs -t 'v2 log evidence through actual consumers|phase and findings reconcile against v2'`
- **预期退出码**: RED nonzero; GREEN 0。
  目标未收集、无依赖或夹具无效只算环境/准备失败。
- **RED 目标失败**: ORACLE-LOG-V2-TERMINAL。用冻结检查逐项匹配真实原文与行位。
  若 CLI 退出成功但吞掉带标题需求，则具名断言失败。
  旧槽位错接与伪造处置沿各自原反例判定。
- **RED 证据**: 已取得的单项目标 RED 见上方 012 原件。组合 Vitest 及其余目标断言尚待预写与运行，组合证据由测试作者留 `quality/tests/log-terminal-red.output`。
- **GREEN 判定器**: ORACLE-LOG-V2-TERMINAL。同一命令逐条对回当前需求来源原位和文本，且旧形态可读。
  条目数量仅记录对账读数。B/C 落点与真实发现、源码和阶段引用一一可核。
- **证据**: `quality/tests/log-terminal-red.output`、`quality/tests/log-terminal-green.output` 及 `quality/tests/log-terminal-effects.output` 是计划逻辑原件指针。
  实际执行记录从任务库原件读，不补造当前状态。
- **覆盖上限**: 最小合同复放不代外部 provider 的理解、失去的历史原件、真实签字或物理交付；真实页面行为及排版截图复用 P7 原件。
- **停止 / 恢复**: 新解析或投递失真时只撤相关写入，旧模板及真实错投和失败保存。归档与推送发生后只补真实读回或授权后修复，不覆写已签字原件。 连接、权限或身份不符时停对应动作，不做无依据重试。
- **完成**: 前置（不作完成条件）：状态、精确命令和冻结判据可读。
  完成条件（只写效果）：下游能从日志、原件和现行阶段完成三次各自的对账，独立验收者能在同批材料上签，然后一次读回实际交付。
  独立者按相同附录 A 判原件、坏对照和审查处置，缺口报告实际名称。

## 机器字段（校验器用，人可跳过）

- **全局规格**: `spec.md#实现设计全局权威`
- **写入集**: `skills/decision-log/SKILL.md`；`skills/material-writing/SKILL.md`；`skills/spec-analyze/SKILL.md`；`skills/spec-plan/scripts/build-decision-baseline.mjs`；`skills/wh-review/scripts/review-materials.mjs`；`tools/cli/check-decision-log-chain.mjs`；`workflows/make-decision/SKILL.md`；`workflows/build-plan/SKILL.md`；`tests/contract/spec-analyze-classes.test.mjs`；`tests/contract/decision-evidence-consumption.test.mjs`；`tests/contract/review-decision-baseline.test.mjs`；`tests/contract/review-materials-contract.test.mjs`
- **依赖**: P1, P2, P3, P4, P5, P6, P7, P8, P9
- **消费者**: 独立终末验收者、用户与下一任务
- **gate_cmd**: `node node_modules/vitest/vitest.mjs run tests/contract/spec-analyze-classes.test.mjs tests/contract/decision-evidence-consumption.test.mjs tests/contract/review-decision-baseline.test.mjs tests/contract/review-materials-contract.test.mjs -t 'v2 log evidence through actual consumers|phase and findings reconcile against v2'`
- **oracle**: ORACLE-LOG-V2-TERMINAL
- **evidence_path**: planned: `quality/tests/log-terminal-effects.output`
- **STOP**: 新解析或投递失真时只撤相关写入，旧模板及真实错投和失败保存。归档与推送发生后只补真实读回或授权后修复，不覆写已签字原件。 缺外部权限或绑定失配停该动作。
- **覆盖 AC**: AC-P1-001, AC-P1-002, AC-P2-001, AC-P2-002, AC-P3-001, AC-P3-002, AC-P3-003, AC-P8-001, AC-P8-002, AC-P4-001, AC-P4-002, AC-P5-001, AC-P5-002, AC-P6-001, AC-P6-002, AC-P9-001, AC-P9-002, AC-P7-001, AC-P7-002, AC-P10-001, AC-P10-002, AC-P10-003, AC-P10-004, AC-P10-005, AC-P10-006, AC-P10-007, AC-P10-008
- **Done**: 前置（不作完成条件）：命令与冻结原件可读。完成条件（只写效果）：下游能从日志、原件和现行阶段完成三次各自的对账，独立验收者能在同批材料上签，然后一次读回实际交付。
  AC-P1-001 incomplete（计划，待证据）→ `phases/P1-skill-loading.md` 的 Done 指向实际单份原件。
  AC-P1-002 incomplete（计划，待证据）→ `phases/P1-skill-loading.md` 的 Done 指向实际单份原件。
  AC-P2-001 incomplete（计划，待证据）→ `phases/P2-evidence-handoff.md` 的 Done 指向实际单份原件。
  AC-P2-002 incomplete（计划，待证据）→ `phases/P2-evidence-handoff.md` 的 Done 指向实际单份原件。
  AC-P3-001 incomplete（计划，待证据）→ `phases/P3-package-decisions.md` 的 Done 指向实际单份原件。
  AC-P3-002 incomplete（计划，待证据）→ `phases/P3-package-decisions.md` 的 Done 指向实际单份原件。
  AC-P3-003 incomplete（计划，待证据）→ `phases/P3-package-decisions.md` 的 Done 指向实际单份原件。
  AC-P8-001 incomplete（计划，待证据）→ `phases/P4-test-data.md` 的 Done 指向实际单份原件。
  AC-P8-002 incomplete（计划，待证据）→ `phases/P4-test-data.md` 的 Done 指向实际单份原件。
  AC-P4-001 incomplete（计划，待证据）→ `phases/P5-readiness.md` 的 Done 指向实际单份原件。
  AC-P4-002 incomplete（计划，待证据）→ `phases/P5-readiness.md` 的 Done 指向实际单份原件。
  AC-P5-001 incomplete（计划，待证据）→ `phases/P6-repair-cycle.md` 的 Done 指向实际单份原件。
  AC-P5-002 incomplete（计划，待证据）→ `phases/P6-repair-cycle.md` 的 Done 指向实际单份原件。
  AC-P6-001 incomplete（计划，待证据）→ `phases/P7-progress-page.md` 的 Done 指向实际单份原件。
  AC-P6-002 incomplete（计划，待证据）→ `phases/P7-progress-page.md` 的 Done 指向实际单份原件。
  AC-P9-001 incomplete（计划，待证据）→ `phases/P8-archive-graph.md` 的 Done 指向实际单份原件（计划 `quality/tests/archive-graph-effects.output`）。
  AC-P9-002 incomplete（计划，待证据）→ `phases/P8-archive-graph.md` 的 Done 指向实际单份原件（计划 `quality/tests/archive-graph-effects.output`）。
  AC-P7-001 incomplete（计划，待证据）→ `phases/P9-evidence-signoff.md` 的 Done 指向实际单份原件（计划 `quality/tests/claims-replay-effects.output`）。
  AC-P7-002 incomplete（计划，待证据）→ `phases/P9-evidence-signoff.md` 的 Done 指向实际单份原件（计划 `quality/tests/claims-replay-effects.output`）。
  AC-P10-001 incomplete（计划，尚未执行）→ `quality/tests/log-terminal-effects.output` 中对应原件，执行后回读。
  AC-P10-002 incomplete（计划，尚未执行）→ `quality/tests/log-terminal-effects.output` 中对应原件，执行后回读。
  AC-P10-003 incomplete（计划，尚未执行）→ `quality/tests/log-terminal-effects.output` 中对应原件，执行后回读。
  AC-P10-004 incomplete（计划，尚未执行）→ `quality/tests/log-terminal-effects.output` 中对应原件，执行后回读。
  AC-P10-005 incomplete（计划，尚未执行）→ `quality/tests/log-terminal-effects.output` 中对应原件，执行后回读。
  AC-P10-006 incomplete（计划，尚未执行）→ `quality/tests/log-terminal-effects.output` 中对应原件，执行后回读。
  AC-P10-007 incomplete（计划，尚未执行）→ `quality/tests/log-terminal-effects.output` 中对应原件，执行后回读。
  AC-P10-008 incomplete（计划，尚未执行；owner=包 10，时点=build-code 实现后）→ `quality/tests/log-terminal-effects.output` 中对应原件，执行后回读。
