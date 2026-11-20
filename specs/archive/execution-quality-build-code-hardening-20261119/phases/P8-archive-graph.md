# Phase P8 — 在交付提交前归档，并记录图更新结果

收口负责人能在隔离仓复放整目录移动、同一交付提交及两路推送，图失败仍留下明确结果。

## 哪些节必须写，哪些可以省？

结果、判据、依据、读集、写主、验证、下游、任务卡和机器字段均已写。
唯一末验收在第 10 段，本段只定所属交付。
模板脚手架与可选例子省略。

## 这一 Phase 交出什么？

收口负责人能在隔离仓复放整目录移动、同一交付提交及两路推送，图失败仍留下明确结果。

- **改动前**：普通收口先合并，再在目标分支另提交归档。终态投影还按该动作序列区分结果。
- **改动后**：当前收口在获授权的任务工作树先移动目录，再提交同批字节。投影从实际证据读回两路推送、目标树与图的分别状态。
- **非目标**：真实外部远端和任务目录的物理收口留终末按已确认范围执行。历史目录、图和失败原件只读。
- **与相邻 Phase 的边界**：第 2 段供不可变交接，第 4 段供隔离资源，第 6 段供冻结和实际写入核账。把受控 Git、图及共享入口读回交下一段。
- **主要风险**：移动材料后旧消费者去原路径读，或把已成功的第一次推送再做一遍。先核原 blob 和真实目标引用，再恢复只缺的动作。
- **下一步**：下一段接收已核的收口接口及老路径保护范围，再接独立签字与声明对账。
- **动手前必读**：从现行入口查到待消费的真实证据，见本文件读集。
- **未决事实**：实际双路远端身份与范围授权由终末用户确认和认证读取确定。隔离仓可在此前执行。图工具实版缺失由图负责人恢复。
- **配套与影响**：配套调整＝`core/task-close.mjs`、`tools/cli/task-close.mjs`、`runtime/stage/current-close-projection.mjs` 与 `skills/stage-close/SKILL.md`；配套迁移＝旧归档与图片只读保留、增量更新替代全量；配套移除＝图提交前更新、全量重抽、每工作树图副本、永久例外表；影响范围＝收口顺序、下一个任务的读回、P9 的声明对账。

### 开工就绪表

开发开工前只跑一次这张表；本段只列收口入口与归档技能的只读条件。

| 命令 | 期望 | 证据 | 机器或人判 | 负责人 |
| --- | --- | --- | --- | --- |
| `git rev-parse --show-toplevel` | 0 | quality/tests/p8-readiness-toplevel.output | 机器 | 计划负责人 |
| `test -f core/task-close.mjs` | 0 | quality/tests/p8-readiness-task-close.output | 机器 | 计划负责人 |
| `test -f skills/stage-close/SKILL.md` | 0 | quality/tests/p8-readiness-stage-close.output | 机器 | 计划负责人 |
| 双路远端身份与收口范围经用户确认 | 与终末确认原件一致 | quality/evidence/p8-readiness-remote-scope.md | 人 | 收口负责人 |

## 这一 Phase 怎么验收？

先由另一执行单元判本段首验。测试退出值仅证明命令曾到达自身结果。
前置与下游的原件只供消费，完整任务的终验在第 10 段。
浏览器不适用。本段只核 Git、回执及图触发结果。

**验收 1 的实施安排｜AC-P9-001**

从认证任务、已验证授权与本地裸仓创建仿真交付，按实际入口走完整动作。独立者先记录源文件 blob 和初始任务/目标引用。
隔离 Git 仓与本地裸远端，固定任务身份。运行用下方精确命令。前期只执行限定分支的本地推送。
查附录 A 对同次提交的判据。破坏一处：仅删源并放旧归档，或漏归档文件，必须返回范围/内容差异。
在同一隔离输入放入旧永久豁免声明，保留当前实际归档义务。
核正常入口拒用它跳归档。完成口径仍按本次具名范围、当前 Git 对象和实际动作判。
分别读取两个授权对象及各自引用。
故障复核用同入口。令目标推送失败后，第一次记录保持，恢复只消费缺失的真实动作。先写交付效果和阴性证据，再交下一段。
判据唯一来源是 `../spec.md#appendix-a--验收判据唯一权威` 对应编号。来源 R-018 / D-009。
证据计划：判什么与怎么判在本段首四行。证据从实际 命令、授权回执、Git 对象与远端引用读回 取得。
由独立 Git 验收者提供并在第 8 段查受控；终末读真实结果留原件。成本类别为隔离接口级。
真实 push 只在获当前范围授权且条件齐后由终末进行。

**验收 2 的实施安排｜AC-P9-002**

从交接和关闭入口读取图结果。使用同一受控图命令制造实际更新、空差异和超时。
消耗第 2 段的认证交接原件与当前代码变化。使用独立控制的图命令替身只证明流程传播。图语义质量需实际适用图工具。
查附录 A 三态和故障边界。负例：图超时后只剩含糊成功，或关闭被图异常卡住，须可见地失败。
同一次图超时中，沿现认证工作树与材料入口直接读当前 `decision-log.md`。
独立核对读取路径和原始字节均匹配同一认证工作树的当前文件。
图不可用时拒读当前材料，或以旧图、缓存字节代读，均判该反例失败。
在同一坏图输入指向拟生成的每工作树图副本。
核图入口拒绝复制，读回该副本路径未被写入，且它的内容未被用于材料读取。
图失败退回原 owner，保原诊断和收口独立回执。限态替身不确认图质量；当前图缺独立测量时标出恢复条件。
判据唯一来源是 `../spec.md#appendix-a--验收判据唯一权威` 对应编号。来源 R-019 / D-009。
证据计划：判什么与怎么判在本段首四行。证据从实际 图命令原始输出和交接/关闭结果 取得。
由独立图接线验收者提供并在各自真实触发时点；第 8 段先判夹具留原件。成本类别为独立读回级。
图失败继续其它合法动作，不用伪造状态补缺。

**成本、资源和范围**

成本均为预案，来源是实际操作切分和现测试蓝图
`quality/evidence/build-plan/2026-11-19-009-test-blueprint-inputs.md:45–50`。
按现条件完成第一条真运行后校准。硬估不上升为执行超时或通过判据。

| 验收 | 执行者 | 活动分钟 | 硬估分钟 | 重验预留 | 证据档位 | 资源 | 观察或活动来源 |
| --- | --- | ---: | ---: | --- | --- | --- | --- |
| AC-P9-001 | 独立 Git 验收者 | 31 | 45 | 原原因修复后只重验受影响动作 | 隔离接口级 | 真实 close 入口、本地裸仓、独立授权样本 | 准备授权和树指纹约 8，跑正反与两次推送约 15，逐项读回与择一恢复约 8 |
| AC-P9-002 | 独立图接线验收者 | 18 | 29 | 图来源确变后只复验相关触发 | 独立读回级 | 现交接、代码关闭、图命令替身 | 准备三态与坏输入约 5，触发/读回约 7，检查不阻断及原件约 6 |

串行估算 31 + 18 + 共用准备 7 = 56 活动分钟，硬估 45 + 29 + 10 = 84 分钟。
图故障边界与本地关闭同跑，读源可以并行。
共用准备查任务身份、工具和临时根，计一次。各分项含具名受影响复验的预留。
真实远端的权限和范围等待单列，只由终末执行。

## 为什么现在做，依据是什么？

第 2 段供不可变交接，第 4 段供隔离资源，第 6 段供冻结和实际写入核账。把受控 Git、图及共享入口读回交下一段。
`decision-log.md:549–586,645,658`。需求索引旧 R-018/R-019 与当前十段答复。包 9 需要可查归档及两次推送链路。

## 开始前读什么？

先从真实入口和前段不可变交回读现物，再开工。
本表是坐标，行号变化时按对应符号定位。

| 来源 | 到达时点与用途 |
| --- | --- |
| `core/task-close.mjs:309,361,516,642,795–833` | 开工前。查看实际计划校验、现锁、两路发布与现归档顺序。 |
| `tools/cli/task-close.mjs:7,16–50` 与 `runtime/stage/current-close-projection.mjs:166–190` | 开工前。定位已有入口和顺序判读。 |
| `skills/stage-close/SKILL.md:44–54,112–132` 与 `skills/stage-handoff/SKILL.md:18–22` | 开工前。定位交接时点、范围确认及实际归档调用。 |
| `tests/integration/vnext-delivery-close.test.mjs:4` 与 `tests/contract/knowledge-graph-stage-wiring.test.mjs:10` | 开工前。从本地 Git 夹具与图接线设计真反例。 |
| 任务库 `quality/evidence/build-plan/2026-11-19-005-package-by-package-phase-audit.md:23,27–33` 与 `009-test-blueprint-inputs.md:26` | 开工前。核包 9 先交受控能力、实际归档另有时点。 |

## 每个文件由谁改，先做什么？

实施者独占产品代码写入。独立测试作者独占下列测试文件，在实施前准备并冻结断言。
实施者的写权限排除判据、夹具与原始证据。
没有独立观察权限前只记未取得，不凭文件声明认定隔离。

**新增**

- `tools/cli/check-specs-archive.mjs`。私有只读薄入口，调用现 `archiveReadback`，提供材料对账诊断给收口者。归档能力退出时随入口移除。

**修改**

- `core/task-close.mjs`。现 `validatePlan`、`prepareDeliveryClosePlan`、`executeClosePlan` 与 `inspectDeliveryCloseState` 一起编排归档与提交。
- `tools/cli/task-close.mjs`。`archiveReadback` 投影可查归档内容和两路动作，原 CLI 消费。
- `runtime/stage/current-close-projection.mjs`。`derivePhysicalDeliveryStatus` 用实际新排序证据。原状态读者仍分清未执行和成功。
- `skills/stage-close/SKILL.md`。现收口 caller 消费归档、授权、两推送和图回执。
- `skills/stage-handoff/SKILL.md`。在交接边界读取本阶段文档图更新的实际原件。
- `skills/knowledge-graph/SKILL.md`。图 owner 复用原工具就当前变化作代码或文档更新。
- `workflows/build-code/SKILL.md`。终末 caller 按代码图结果和实际归档读回，参照现终末收尾。
- `docs/architecture/move-map.json`。登记薄入口、唯一消费者、替代和退役条件。

**测试作者独占的修改**

- `tests/integration/vnext-delivery-close.test.mjs`。补整目录归档、双推送回执和部分失败恢复的定向用例。
- `tests/contract/current-close-projection-readback.test.mjs`。补真实动作顺序、旧记录只读及伪归档负例。
- `tests/contract/knowledge-graph-stage-wiring.test.mjs`。补文档与代码图各自触发、失败诊断及不阻断接口的定向用例。

P8 的测试作者先完成归档用例并交当前冻结版本和原始回执。
P9 的测试作者以此为固定输入，只在共享集成文件添加声明反例。
先前断言的变化走既有冻结判据变更流程。

**禁止改动**

- 实施者对上述测试与冻结断言保持只读。
- `spec.md`、当前 `decision-log.md`、Phase 指针、历史材料、旧失败与已保留原件只读。
- 未知忽略字节、主仓现有编辑以及真实远端任务范围从属于各自授权。在本段夹具测试中保持只读。

P2 若先改 `skills/stage-handoff/SKILL.md`，先交认证读回再由本段接图。P6 先交 `workflows/build-code/SKILL.md` 分诊。P5 先交移动职责登记。本段后交收口/终末代码给 P9。共享文件实差异冲突由原唯一实施者处理。
接口符号见逐路径说明。测试准备可并行，任何同一源写入按实际依赖串行。
进度只读现 `facts.jsonl#phase_progress`，该值不能支持质量声明。

## 怎么验证？

独立测试作者先冻结目标断言，再在认证工作树安装现有锁定依赖后跑同一命令。
本次计划中的目标 RED 尚未执行。邻近已有测试入口只是准备线索。
真实 runner 不存在时记配置失败，修设置后再取得目标读数。

`node node_modules/vitest/vitest.mjs run tests/integration/vnext-delivery-close.test.mjs tests/contract/current-close-projection-readback.test.mjs tests/contract/knowledge-graph-stage-wiring.test.mjs -t 'isolated archive before delivery|bounded graph handoff and close'`

- RED 目标：现入口的交付提交没有归档后的整目录，或把失败图误投影成成功。独立 Git 树对账和当前动作检查必须到达目标断言。
- GREEN 目标：同一测试证明完整归档随交付提交，两个本地推送及授权分开可核，错误归档输入和图失败有明确结果。
- 归因：目标断言已抵达且失败才是 RED。收集、未找到测试、导入、夹具和环境失败另列。
  已满足的原行为保原本通过。
- 反例用独立输入和来源期望。不能从当前输出反算预期。
- 失败处理：在尚未提交的自有夹具，只还原本次声明路径。对真实已提交或已推送字节保留实际事实，停有歧义动作，回收口 owner 按实际授权与提交位置恢复。晚到图结果不能改已留原记录。
- 覆盖上限：真实分支/远端不同步、图故障、大小与缓存受限分别报告。夹具可以证明动作与副作用边界，不能证明本任务已真实归档或远端提交。

## 下一消费者拿什么继续？

第 8 段唯一实施者交 `core/task-close.mjs`、`skills/stage-close/SKILL.md`、`workflows/build-code/SKILL.md` 和职责登记的当前字节、受控读回、失败和未验证外部项。第 9 段只接声明与签字读回，不重作归档。


## 每张任务卡怎么写？

下面一张卡从真实输入走到相同消费者的完整可判结果。

### 任务 8：在交付提交前归档，并记录图更新结果

为什么做：收口负责人能在隔离仓复放整目录移动、同一交付提交及两路推送，图失败仍留下明确结果。
交付什么：当前收口在获授权的任务工作树先移动目录，再提交同批字节。投影从实际证据读回两路推送、目标树与图的分别状态。
不做什么：真实外部远端和任务目录的物理收口留终末按已确认范围执行。历史目录、图和失败原件只读。
前置：先读取冻结输入及前段真实供件，见本文件读集。
怎么做：按共享写主先后，接现有入口并以独立反例固定失败。
怎么验收：跑上方受影响命令，按附录 A 的预期及命名目标断言回读。
证据：分别留 RED 原失败、GREEN 与其真实条件。
下游（含何时停）：下一段接收已核的收口接口及老路径保护范围，再接独立签字与声明对账。 缺一个具名原件时转原负责人处理。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T008
- **来源 / FR / AC**: R-018 / D-009，FR-WH-009，AC-P9-001, AC-P9-002。收口负责人能在隔离仓复放整目录移动、同一交付提交及两路推送，图失败仍留下明确结果。
- **输入**: 当前日志、规格和前段实际原件。第 2 段供不可变交接，第 4 段供隔离资源，第 6 段供冻结和实际写入核账。把受控 Git、图及共享入口读回交下一段。
- **文件 / 符号**: `tools/cli/check-specs-archive.mjs`；`core/task-close.mjs`；`tools/cli/task-close.mjs`；`runtime/stage/current-close-projection.mjs`；`skills/stage-close/SKILL.md`；`skills/stage-handoff/SKILL.md`；`skills/knowledge-graph/SKILL.md`；`workflows/build-code/SKILL.md`；`docs/architecture/move-map.json`；`tests/integration/vnext-delivery-close.test.mjs`；`tests/contract/current-close-projection-readback.test.mjs`；`tests/contract/knowledge-graph-stage-wiring.test.mjs`。
  逐路径说明点名实际符号与读者。未知入口须回相同 owner 核查。
- **动作**: 先从 `validatePlan` 看当前普通路径，归档动作移到本次交付提交之前。只在认证任务工作树锁内建目标，先检查原目录边界、索引和目标引用。
  移动整目录并按已确认路径暂存，提交前核暂存中没有其它字节。提交前以原相对路径、模式和 Git blob 摘要核每个对象，受保护材料、未授权的同目录字节与目标冲突须具名拒绝。
  提交、任务分支推送、受支持的 PR/合并、目标分支推送依各自现授权执行。不同分支及当前 Git 提交位置各自绑定授权。同一个确认可以供授权来源，两条回执仍分别保存。
  让 `archiveReadback` 和 `derivePhysicalDeliveryStatus` 读取真实顺序、树、远端引用及动作。旧原件保持旧身份，只读保留。失败后根据实际只读原件恢复，不重复已完成推送。
  让交接调用当前变化的文档图更新，关闭只调代码图。复用现有源码范围和缓存判定。接收更新、无变化和失败的实际结果并留原件。超时保诊断，合法收口继续。
- **输出 / 失败**: 当前收口在获授权的任务工作树先移动目录，再提交同批字节。投影从实际证据读回两路推送、目标树与图的分别状态。 在尚未提交的自有夹具，只还原本次声明路径。对真实已提交或已推送字节保留实际事实，停有歧义动作，回收口 owner 按实际授权与提交位置恢复。晚到图结果不能改已留原记录。
- **边界 / 禁止改动**: 冻结测试与原始证据不可写。真实外部远端和任务目录的物理收口留终末按已确认范围执行。历史目录、图和失败原件只读。
- **依赖**: P2, P4, P6
- **测试层级 / 技能**: fullstack / `fullstack-slice-testing`。在既有隔离 Git 环境核双路授权、归档提交及故障读回。
  精确命令见成对门禁命令，页面与生产外部权限的覆盖边界见正文。
- **场景 / 夹具或服务**: 在同进程生成临时普通 Git 仓、独立裸远端、源任务目录与必要的模板授权样本。只允许本地路径，移除 network remote。用现有 fixture 在 finally 清理。
  超时或 SIGINT/TERM 按现有流程关闭拥有的子进程并保初错。
  SIGKILL 后下次只对已验证 owner、路径及节点身份的可再生残留做受控回收。
  仍活进程、符号链接、节点身份变化或未知目录保留并具名报告。
- **RED/GREEN 门禁命令**: `node node_modules/vitest/vitest.mjs run tests/integration/vnext-delivery-close.test.mjs tests/contract/current-close-projection-readback.test.mjs tests/contract/knowledge-graph-stage-wiring.test.mjs -t 'isolated archive before delivery|bounded graph handoff and close'`
- **预期退出码**: RED nonzero; GREEN 0。
  目标未收集、无依赖或夹具无效只算环境/准备失败。
- **RED 目标失败**: ORACLE-CLOSE-ARCHIVE-GRAPH。现入口的交付提交没有归档后的整目录，或把失败图误投影成成功。独立 Git 树对账和当前动作检查必须到达目标断言。
- **RED 证据**: unavailable — 目标断言未预写、未运行。待测试作者留 `quality/tests/archive-graph-red.output` 的实际原件。
- **GREEN 判定器**: ORACLE-CLOSE-ARCHIVE-GRAPH。同一测试证明完整归档随交付提交，两个本地推送及授权分开可核，错误归档输入和图失败有明确结果。
- **证据**: `quality/tests/archive-graph-red.output`、`quality/tests/archive-graph-green.output` 及 `quality/tests/archive-graph-effects.output` 是计划逻辑原件指针。
  实际执行记录从任务库原件读，不补造当前状态。
- **覆盖上限**: 真实分支/远端不同步、图故障、大小与缓存受限分别报告。夹具可以证明动作与副作用边界，不能证明本任务已真实归档或远端提交。
- **停止 / 恢复**: 在尚未提交的自有夹具，只还原本次声明路径。对真实已提交或已推送字节保留实际事实，停有歧义动作，回收口 owner 按实际授权与提交位置恢复。晚到图结果不能改已留原记录。 连接、权限或身份不符时停对应动作，不做无依据重试。
- **完成**: 前置（不作完成条件）：状态、精确命令和冻结判据可读。
  完成条件（只写效果）：收口负责人能在隔离仓复放整目录移动、同一交付提交及两路推送，图失败仍留下明确结果。
  独立者按相同附录 A 判原件、坏对照和审查处置，缺口报告实际名称。

## 机器字段（校验器用，人可跳过）

- **全局规格**: `spec.md#实现设计全局权威`
- **写入集**: `tools/cli/check-specs-archive.mjs`；`core/task-close.mjs`；`tools/cli/task-close.mjs`；`runtime/stage/current-close-projection.mjs`；`skills/stage-close/SKILL.md`；`skills/stage-handoff/SKILL.md`；`skills/knowledge-graph/SKILL.md`；`workflows/build-code/SKILL.md`；`docs/architecture/move-map.json`；`tests/integration/vnext-delivery-close.test.mjs`；`tests/contract/current-close-projection-readback.test.mjs`；`tests/contract/knowledge-graph-stage-wiring.test.mjs`
- **依赖**: P2, P4, P6
- **消费者**: P9 与 stage-close
- **gate_cmd**: `node node_modules/vitest/vitest.mjs run tests/integration/vnext-delivery-close.test.mjs tests/contract/current-close-projection-readback.test.mjs tests/contract/knowledge-graph-stage-wiring.test.mjs -t 'isolated archive before delivery|bounded graph handoff and close'`
- **oracle**: ORACLE-CLOSE-ARCHIVE-GRAPH
- **evidence_path**: planned: `quality/tests/archive-graph-effects.output`
- **STOP**: 在尚未提交的自有夹具，只还原本次声明路径。对真实已提交或已推送字节保留实际事实，停有歧义动作，回收口 owner 按实际授权与提交位置恢复。晚到图结果不能改已留原记录。 缺外部权限或绑定失配停该动作。
- **覆盖 AC**: AC-P9-001, AC-P9-002
- **Done**: 前置（不作完成条件）：命令与冻结原件可读；档位据 `quality/reviews/2026-11-20-final-ac-reconciliation.md` §10.2（sha256 `e93d6741…`）。
  完成条件（只写效果）：AC-P9-001：partial——隔离仓四项通过条件成立（整目录与交付同一提交、源不再活动、字节一致、两路 push 在夹具），真实任务分支/目标分支推送与远端读回未发生；证据 `quality/reviews/2026-11-20-p8-spec-axis.md:13`；缺口 owner=收口负责人，恢复=用户授权后真实 close + 两路 push 回执 + 远端读回。
  AC-P9-002：fail——首判 fail（「无变化」语义错、交接图回执为 0）；能力已由 `core/task-close.mjs:249-253`、`skills/stage-handoff/SKILL.md:24-32` 补齐，但本任务 handoff 图回执仍为 0，无真实 close 图回执与复审；证据 `quality/reviews/2026-11-20-p8-spec-axis.md:14`；缺口 owner=图/收口负责人，恢复=发布本任务 handoff 图回执与真实 close 图回执后复审。
