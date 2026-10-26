# Phase P3 — 同一失败自动换路径，只三类停

读者：P4 证据作者、每个 Phase 的开发子代理、本 Phase 独立审查者。
读完要能：说出同一失败反复或一轮没有新事实时先做什么、换哪条路径、只有哪三类才停；说出四类缺资源分诊各自落到哪条处置。

## Phase 契约头

- **全局规格**：`spec.md#实现设计（全局权威）`
- **写入集**：`workflows/build-code/SKILL.md`；`docs/standard-workflow.md`；`AGENTS.md`；`skills/diagnosing-bugs/SKILL.md`；`docs/architecture/move-map.json`；`tests/contract/auto-recovery.test.mjs`
- **依赖**：`P2`
- **消费者**：P4 证据作者与每个 Phase 的开发子代理
- **gate_cmd**：`npx vitest run tests/contract/auto-recovery.test.mjs`
- **oracle**：ORACLE-AUTO-RECOVERY
- **evidence_path**：`quality/evidence/workflowhub-build-code-efficiency-verify-merge-20261026/P3-auto-recovery.json`
- **STOP**：分诊表缺类、第 9 步与表处置不一致、四个文件仍留固定次数或时长句、或既有契约词被改红时停该路径；保原字节与失败输出，回 T003 动作逐项核，单源表只留 `AGENTS.md` 一张；不改测试断言、不删类求绿；仍不一致交 build-plan owner。
- **覆盖 AC**：AC-RECOVER-001、AC-RECOVER-002
- **Done**：AC-RECOVER-001 与 AC-RECOVER-002 各写一个档位与一条证据指针；`npx vitest run tests/contract/auto-recovery.test.mjs` 退出 0；四场景处置、原失败保留与不问人三项有具名断言；既有 n11 词组与 `3–5` 断言仍绿；缺一不记 pass。

## 工作包声明（人读事实）

- **读集**：`spec.md` 的「实现设计（全局权威）」、`FR-RECOVER-001…002`、Appendix A 的 `AC-RECOVER-001…002` 与「需求到任务追踪」P3/T003 行；`skills/spec-plan/templates/phase-template.md` 的契约头与字段说明；`runtime/stage/stage-content-contracts.mjs` 的 `FIELD_LABEL_ALIASES` 与 Phase 卡字段校验；`workflows/build-code/SKILL.md`、`docs/standard-workflow.md`、`AGENTS.md`、`skills/diagnosing-bugs/SKILL.md` 的现状全文；`docs/architecture/move-map.json` 两条相关条目；两份既有相邻契约测试。
- **定序写主**：本 Phase 是写入集六个路径的唯一写主；P2 已交付三角色与七步，P4 只读本 Phase 产物。
- **接口符号清单**：无共享代码符号；符号面是 `AGENTS.md` 的分诊表行、`workflows/build-code/SKILL.md` 第 9 步的处置序列、`skills/diagnosing-bugs/SKILL.md` 第 3 节的假设切换句，以及 `docs/architecture/move-map.json` 条目的 `responsibility`、`consumer`、`owner` 字段。
- **合并责任**：单开发子代理持笔；冲突时以本 Phase 审后提交为基线，后写者重读真实字节。
- **progress_cursor**：只指向任务事实库 `facts.jsonl` 的 `phase_progress`，本文件不保存进度值。

## 速读卡（人读；只写本 Phase 增量）

- **本 Phase 结果**：同一失败反复或一轮没有新事实时，执行者先停重复动作、自动换路径并继续；只有三类停；缺资源按四类分诊落位。
- **非目标**：不改 AC、FR、oracle、写集、方向与验收对象；不设次数或时长上限；不新增状态、字段、第二账本或第二进度权威。
- **改动前**：`AGENTS.md:58` 要求「连续无新事实即停重复续跑，按上条报告」；`docs/standard-workflow.md:57` 写死重开次数，并把再次出现升级问人；`skills/diagnosing-bugs/SKILL.md:38` 写按失败次数停并交人工裁决。三处都会把自动换路径变成问人或固定上限。
- **改动后**：`AGENTS.md`「卡住与升级」有一张三列四行分诊表、三类停与无上限声明；`workflows/build-code/SKILL.md` 第 9 步有「停重复 → 三检查 → 换路径 → 四类分诊 → 零重试与复位 → 不是完成」序列；`docs/standard-workflow.md` 与 `skills/diagnosing-bugs/SKILL.md` 只引用同一张表；`tests/contract/auto-recovery.test.mjs` 用四个受控场景与反向用例判真假。
- **与相邻 Phase 的边界**：P2 交来三角色与七步顺序；本 Phase 只加失败后的换路径与停机规则；`incomplete` 的完整字段、结束统一提醒与缺口报告归 P4。
- **主要风险**：四处正文重复同一规则会写成第二真相，或改掉既有契约词把相邻测试弄红。若返工，替代走法是先跑一次相邻契约测试留基线，再按「先改 `AGENTS.md` 单源表、后改引用」逐文件改，每改一处重跑同一 gate。
- **下一步**：P4 证据作者按本 Phase 的处置记录补齐 `incomplete` 格式、结束提醒与缺口清单。
- **动手前必读**：`AGENTS.md:54-63`；`docs/standard-workflow.md:53-57`；`workflows/build-code/SKILL.md:28`、`:32`、`:39-40`；`skills/diagnosing-bugs/SKILL.md:24`、`:34-46`；`docs/architecture/move-map.json:1621` 与 `:3426`；既有契约测试 `tests/contract/n11-acceptance-rules.test.mjs`、`skills/diagnosing-bugs/__tests__/skill-contract.test.mjs`。
- **未决事实**：`skills/catalog.yaml:835` 的 `design_idea` 仍把失败次数当停机依据，不在本 Phase 写集，由 norm-sync 在 P3 收口登记并交 catalog owner 改。`spec.md` 的 AC-RECOVER 验证段把执行者写成旧编号 P10，本 Phase 按「需求到任务跟踪」的 P3/T003 承接，spec 正文编号由原 owner 统一。

## 本 Phase 材料导航（人读；只列本 Phase 实际用到的锚点）

| 材料 / 锚点 | 本 Phase 用它做什么 | 读取时机 |
| --- | --- | --- |
| `spec.md` 的「实现设计（全局权威）」 | 核全局边界与新增、修改、禁止改动分类 | 开工前 |
| `spec.md` Appendix A `AC-RECOVER-001…002` | 取通过、失败、证据三项判据 | 写卡前 |
| `skills/spec-plan/templates/phase-template.md` 的契约头与「字段说明」 | 核字段名与写作下限 | 写卡前 |
| `runtime/stage/stage-content-contracts.mjs:79`、`:580` | 核中文标签别名与任务卡必填字段 | 写卡前 |
| `workflows/build-code/SKILL.md:28`、`:32`、`:39-40` | 现状：诊断入口、外部零重试、重试自述与「不新建任务或账本」 | T003 动作前 |
| `docs/standard-workflow.md:53-57` | 现状：stage 结束的停机与重开句 | T003 动作前 |
| `AGENTS.md:54-63` | 现状：停机格式与外部不可重试边界 | T003 动作前 |
| `skills/diagnosing-bugs/SKILL.md:24`、`:38`、`:44` | 现状：回路不可用交还控制、按次数停、便宜替代 | T003 动作前 |
| `docs/architecture/move-map.json:1621`、`:3426` | 两条待改条目的字段现状 | T003 动作前 |
| `tests/contract/n11-acceptance-rules.test.mjs`；`skills/diagnosing-bugs/__tests__/skill-contract.test.mjs` | 现有断言锁住的词组，改动必须保留 | T003 动作前 |

## L0 — 结果与变更

`spec.md` 的 `FR-RECOVER-001`、`FR-RECOVER-002` 要求自动换路径、只三类停；现状三处正文却把「没有新事实」变成停给人、把重开次数写死、把失败次数写成停点。执行者遇到同一失败时只能原地重试或中途弹选项，自动换路径不会发生。本 Phase 把规则收成一张表、一条序列，并用一个受控测试锁住四类处置。

- **结果**：同一失败反复或一轮没有新事实时，执行者先停重复动作，做三检查后自动换路径继续；只有三类停；其余缺资源记 `incomplete` 继续；规则里没有次数或时长上限。
- **非目标**：不改 AC、FR、oracle、写集、方向与验收对象；不新增任务、第二账本或第二进度权威；不重跑历史失败或长任务。
- **与其它 Phase 的区别**：P2 定 Phase 内角色与七步顺序；本 Phase 只定失败后的路径切换与停机边界；P4 定 `incomplete` 的完整字段与结束提醒。

## L1 — 可执行契约

### 文件边界

- **新增**：`tests/contract/auto-recovery.test.mjs`
- **修改**：`workflows/build-code/SKILL.md`；`docs/standard-workflow.md`；`AGENTS.md`；`skills/diagnosing-bugs/SKILL.md`；`docs/architecture/move-map.json`
- **禁止改动**：`runtime/`、`tools/`、`core/` 与全部生产代码；`docs/adr/0001` 至 `docs/adr/0053`、`docs/research/`、`docs/archive/`、`specs/archive/`；`skills/catalog.yaml`、`workflows/build-code/skill-deps.yaml`；`tests/contract/n11-acceptance-rules.test.mjs`、`skills/diagnosing-bugs/__tests__/skill-contract.test.mjs` 与其它既有测试；本任务其它 Phase 文件。理由：写集只含上述六个路径；相邻测试与 catalog 是别处的现状事实，改它们会把本 Phase 的缺口伪装成已完成。

### 任务顺序

只有 T003 一张卡；它是同一次规则修订的连续步骤，不拆成多张票。

### Task graph 与纵向切片

T003 沿「当前正文 → 修订后的四个文件与 move-map 条目 → 真实读取方」切穿：读取方是 `npx vitest run tests/contract/auto-recovery.test.mjs`、P4 证据作者与每个 Phase 的开发子代理。无 Phase 内前置 Task，P2 交付后即可开工。

### 与现有规则的衔接

- **不新建任务**：换路径只改本 Phase 内任务的拆分、顺序、依赖、实现路线、测试路线与证据补齐；同一失败仍归原 Task，不另开任务、不重置 Phase。可自动改的范围只到这些，不碰 AC、FR、oracle、写集、方向与验收对象。
- **不建第二个账本**：处置只写进本 Phase 的 task facts 与既有证据，不新增状态、字段、schema、第二份进度或第二联系人。
- **不覆盖原失败原件**：按 `docs/standard-workflow.md`「证据只留原始件」保留第一次失败的命令、cwd、退出码与原始输出；换路径后变绿也不删、不改写；同字节复用原 ref，字节不同才新写并说明差异。
- **无新事实不等于完成**：停重复只表示不再做同一动作；完成仍按 `Done` 与 AC 判据。不能把「一轮没有新事实」当成 Phase 完成、质量通过或可以宣布完成。
- **三类停的边界**：只有改 AC 或方向、用户独占且阻塞整任务声明交付或 AC 判定的缺资源、必须有人承担严重风险三类停；其余缺资源记 `incomplete` 继续，不在 build-code 中途弹选项；确实无解才要真实资源。

### 测试策略

开工前四要素：验证层为材料合同（静态断言四个真实文件的结构、处置与上限词）加受控场景比对；命令是 `npx vitest run tests/contract/auto-recovery.test.mjs`；预期是该命令退出 0 且每类场景与表一致；失败条件是任一类缺处置、处置被升级成问人、上限句残留或既有契约词被改掉。

| 目标 | Task | 角色 | gate_cmd / 预期退出码 | 判据 / 证据路径 |
| --- | --- | --- | --- | --- |
| 四类缺资源与只三类停的规则在场且一致 | T003 | RED | `npx vitest run tests/contract/auto-recovery.test.mjs` / 非零 | ORACLE-AUTO-RECOVERY / unavailable — build-plan 不实施，由 build-code 补真实 RED |
| 四类缺资源与只三类停的规则在场且一致 | T003 | GREEN | `npx vitest run tests/contract/auto-recovery.test.mjs` / 0 | ORACLE-AUTO-RECOVERY / `quality/evidence/workflowhub-build-code-efficiency-verify-merge-20261026/P3-auto-recovery.json` |

#### 受控故障注入夹具（T003 的四个场景）

测试读真实文件字节，解析 `AGENTS.md`「卡住与升级」的三列表，把表里的处置与测试内独立硬编码的四场景期望逐项比对。四场景都从「同一失败第二次出现」开始，差别只在缺什么。

| 场景 | 注入事实 | 期望处置 | 问人 | 该路径 | 原失败原件 |
| --- | --- | --- | --- | --- | --- |
| S1 非阻塞缺资源 | 同一失败第二次出现；缺的是可选样例，不阻塞声明交付与 AC 判定 | 先停重复动作，做三检查后换假设或方法或独立上下文，记 `incomplete` 继续 | 0 次 | 换路径继续 | 保留 |
| S2 用户独占阻塞 | 同一失败第二次出现；缺的资源只有用户能给，且阻塞声明交付或 AC 判定 | 问一次，给可直接回复的选项；其余安全工作继续 | 1 次 | 停下等答复 | 保留 |
| S3 改 AC 或方向 | 根因表明 AC 不可达、验收或测试过度复杂，或方向必须换 | 停，把简化验收或改方向的选项交原 owner | 停并交原 owner | 停该 AC 路径 | 保留 |
| S4 严重风险 | 修复需要有人承担超出既有授权的严重风险 | 停，等人承担风险或改走低风险路径 | 停并等人承担 | 停该路径 | 保留 |

S1 就是 AC-RECOVER-001 的受控注入：测试用三条具名断言分别证明换路径继续、原失败原件保留、过程中不出现问人选项且不弹三选项；S2–S4 证明只有三类停。反向用例在内存里把 S1 的处置改成问人、把用户独占条件去掉「阻塞交付或 AC 判定」，同一检查器必须各报一次错；不写磁盘、不建服务、不用真实凭据，自建临时目录用后删除。

#### 相邻契约保留

既有测试锁住的词组必须原样保留：`workflows/build-code/SKILL.md` 与 `docs/standard-workflow.md` 的「最小可证伪集合」「未知影响面」「全局重跑」「一次」「事先说明」「本 Phase 承接 AC 与声明测试面」；`skills/diagnosing-bugs/SKILL.md` 的「3–5」「一次只测一个变量」。本 Phase 只加规则，不改这些词；任一被改掉即停该路径。

### 覆盖边界

- **覆盖上限**：只证明四个文件的规则在场、四类处置一致、没有上限句、既有契约词保留；不证明真实会话里执行者会照做，不证明真实权限停点、审查并发或成本变化。
- **显式不覆盖**：不演练真实权限或外部服务停点（`spec.md` 已将该项记为未取得）；不证明「不会再反复」；不证明用户会答复；不证明换路径一定找到根因。四场景是材料合同层的受控注入，不是真实会话回放。

### 停止

出现以下任一即停该路径：分诊表缺任一类或与第 9 步处置不一致；四个文件仍留固定次数或时长句；既有契约词被改红；必须改 AC、oracle、写集或方向才能让测试通过。停下后保原字节与失败输出，回 T003 动作逐项核对，单源表只留 `AGENTS.md` 一张；不改测试断言、不删类求绿；确实需要改承诺时交 build-plan owner，按三类停处置。

### 完成

需要四件事实：`npx vitest run tests/contract/auto-recovery.test.mjs` 退出 0；四场景与分诊表逐项一致；两个既有相邻契约测试仍绿；独立审查按真实 `git diff --name-only` 核对只改了写入集六个路径。结论只能到「规则在场且材料层一致」，不能到「真实会话已自动恢复」。

### 风险与回滚

- **风险**：同一规则写进四个文件，措辞漂移成第二真相。
- **影响**：执行者按不同文件得到不同处置，测试只锁住一处。
- **缓解**：`AGENTS.md` 一张表为唯一来源，其余文件只引用不复制；测试按同一表比对四场景；每次只改一个文件并重跑同一 gate。
- **回滚**：回到本 Phase 审后提交点；不整树回退，不改历史原件。
- **触发条件**：同一规则在两个文件出现不同处置，或相邻契约测试因本 Phase 改动变红。

### 交接知识（给下游 Phase 与审查的已核实事实）

- `AGENTS.md:58` 当前把「连续无新事实」直接导向停止与报告；`docs/standard-workflow.md:57` 当前写固定重开次数并把再次出现升级问人；`skills/diagnosing-bugs/SKILL.md:38` 当前按失败次数停并交人工裁决。三处是本 Phase 必须替换的现状字节。
- `workflows/build-code/skill-deps.yaml` 已登记 `diagnosing-bugs`，触发词是 `actual_failure_reproduction_before_hypothesis`；本 Phase 复用步骤 2 的同一读取，不新增技能依赖或 trigger。
- `skills/catalog.yaml:835` 的 `design_idea` 仍把失败次数当停机依据，不在本 Phase 写集；由 norm-sync 在 P3 收口登记，交 catalog owner 改。
- `tests/contract/n11-acceptance-rules.test.mjs` 锁住 `workflows/build-code/SKILL.md` 与 `docs/standard-workflow.md` 的「最小可证伪集合」「未知影响面」「全局重跑」「一次」「事先说明」「本 Phase 承接 AC 与声明测试面」；`skills/diagnosing-bugs/__tests__/skill-contract.test.mjs` 锁住「3–5」与「一次只测一个变量」。改正文必须保留这些词。
- `docs/architecture/move-map.json:1621` 是 `skills/diagnosing-bugs/SKILL.md` 条目，`:3426` 是 `workflows/build-code/SKILL.md` 条目；两条都有 `responsibility`、`owner`、`consumer`、`delete_condition`。
- `spec.md` 的 AC-RECOVER 验证段仍把执行者写成旧编号 P10；本 Phase 按「需求到任务跟踪」的 P3/T003 承接，不改 spec 正文。

### T003 — 自动换路径与四类分诊

- **来源 / FR / AC**：`U-003`「止损原则，不扩成总时长或固定审查预算」、`U-009`「撤回固定时长，不设固定时间」、`U-013`「AC 改动停问；先查根因、简化验收，实在无解再要真实资源」、`F3`「三类停收窄为改 AC 或方向、用户独占阻塞资源、严重风险；其余缺资源记 incomplete 继续」、`OI-003`；`FR-RECOVER-001`「同一失败反复或一轮没有新事实时先停重复动作，自动深研、换假设或方法或独立上下文、修正 Phase 内任务并继续，原失败原件保留」、`FR-RECOVER-002`「只有三类才停，其余缺资源记 incomplete 继续，不设次数或时长上限」；`AC-RECOVER-001`、`AC-RECOVER-002`。
- **输入**：`spec.md` 的 FR 与 AC 原文、`skills/spec-plan/templates/phase-template.md` 的字段说明、P2/T002 交付的三角色与七步顺序、四个文件与 move-map 的改前真实字节；四场景由测试作者独立写死。无外部提供者、无真实凭据需求，输入全部来自本任务既有材料。
- **文件 / 符号**：`workflows/build-code/SKILL.md`；`docs/standard-workflow.md`；`AGENTS.md`；`skills/diagnosing-bugs/SKILL.md`；`docs/architecture/move-map.json`；`tests/contract/auto-recovery.test.mjs`。符号面：`AGENTS.md`「卡住与升级」的三列分诊表与三类停句；`workflows/build-code/SKILL.md` 第 9 步的处置序列与自述行；`docs/standard-workflow.md`「stage 结束」的引用段；`skills/diagnosing-bugs/SKILL.md` 第 1、3 节的换假设与四类分诊；move-map 两条目的 `responsibility`、`owner`、`consumer`；新测试的四个场景常量与检查器。
- **动作**：①`AGENTS.md`「卡住与升级」把「连续无新事实即停重复续跑，按上条报告」改成「先停重复动作，再查根因、看验收或测试是否过度复杂、给更简单替代；仍有解就自动深研、换假设或方法或独立上下文、修正 Phase 内任务并继续，原失败原件保留；无新事实不是完成」；加三列四行分诊表、三类停、不设次数或时长上限；外部不可重试（许可或授权被拒绝、权限不足、密钥失效、输入非法、真实资源或环境不存在）零重试，立即报告并停该路径，其余安全工作继续，用户给新答复即复位，时间不构成复位条件；把「立即报告并给可直接回复的选项」收窄为「阻塞声明交付或 AC 判定时才按用户独占阻塞问一次，其余记 `incomplete` 并在 Phase 记录里报告」。②`docs/standard-workflow.md`「stage 结束」把「无新事实则停止重复、不自动续跑空转」与「换独立上下文重开、仍出现则升级问人」换成指向同一张表的三类停与无上限换路径；保留「时长本身永远不构成停止条件，时间不构成复位条件」、未取得答复不算同意、provider 排除句；不复写表。③`workflows/build-code/SKILL.md` 第 2 步加一句「同一失败第二次出现或一轮没有新事实时，先回第 9 步停重复动作再查根因」；第 5 步外部不可重试句改为按第 9 步四类分诊落位；第 9 步把重试自述段改成六段序列：停重复并写自述行 → 三检查 → 换路径清单（深研、换假设、换方法、换独立上下文、修正 Phase 内任务拆分/顺序/依赖/实现路线/测试路线/证据补齐）→ 四类分诊落位 → 外部零重试与用户新答复复位 → 无上限声明与「无新事实不是完成」，并写死不新建任务、不建第二个账本、不覆盖原失败原件。④`skills/diagnosing-bugs/SKILL.md` 第 1 节「回路无法建立…交还控制」改成四类分诊，保留「禁止猜测修复」；第 3 节删掉按失败次数停并交人工裁决的句子，改为同一失败或一轮无新事实时先停重复、再换竞争假设或探针或独立上下文继续，原失败与探针输出保留，不设次数上限；保留「3–5」个竞争假设与「一次只测一个变量」。⑤`docs/architecture/move-map.json` 的 `skills/diagnosing-bugs/SKILL.md` 条目 `responsibility` 加「自动恢复的换假设/换方法/换上下文与保留原失败」、`consumer` 加「方法 9 自动换路径」、`owner` 加 `P3/T003`；`workflows/build-code/SKILL.md` 条目 `responsibility` 写明方法 2 诊断与方法 9 自动恢复；两条的 `delete_condition` 与 `retention_basis` 原义不改。⑥先写 `tests/contract/auto-recovery.test.mjs`：读四个文件与 move-map 的真实字节，解析 `AGENTS.md` 分诊表，比对硬编码的四场景期望；做上限词扫描、既有契约词保留断言、内存变异反向用例。
- **输出 / 失败**：输出是四类分诊表、第 9 步序列、两处引用、假设切换句、move-map 条目与新测试。失败信号是任一类缺失或处置与表不一致、上限句残留、原失败保留句缺失、既有契约词被改红，命令非零并指名断言。非法输入是改到写入集外、改既有测试断言、把非阻塞缺资源升级成问人。无临时服务或持久化副作用；内存变异不落盘。
- **边界 / 禁止改动**：`runtime/`、`tools/`、`core/` 与全部生产代码；`docs/adr/0001` 至 `docs/adr/0053`、`docs/research/`、`docs/archive/`、`specs/archive/`；`skills/catalog.yaml`、`workflows/build-code/skill-deps.yaml`；`tests/contract/n11-acceptance-rules.test.mjs`、`skills/diagnosing-bugs/__tests__/skill-contract.test.mjs`；本任务其它 Phase 文件。理由是这些是历史原件、别处 owner 的现状事实或不在写集，改了会把缺口伪装成已完成。
- **依赖**：`P2`；承接 P2 交付的三角色与七步，本 Phase 只在其后加失败后的换路径与停机规则；Phase 内无更早 Task。
- **测试层级 / 技能**：材料合同（技能/方法正文结构，适用）；主测试技能 `skills/backend-testing/SKILL.md` 的「行为测试与证伪」「执行事实」；不涉及 UI、浏览器、数据库或外部服务；相邻检查是两个既有契约测试，只核保留、不改。
- **场景 / 夹具或服务**：正常用例是 S1–S4 四个受控场景（见上表）；反向用例是把 S1 的处置改成问人、把用户独占条件去掉阻塞条件，检查器必须各报错；搭建为只读真实文件与内存变异，不建服务、不用凭据；清理为删除自建临时目录（如测试用到）。
- **预写测试**：`tests/contract/auto-recovery.test.mjs` 由 T003 作者在改正文前写好并先跑一次目标断言失败；Phase 内冻结，改动需测试变更请求。
- **可观察接缝**：产出方是 `AGENTS.md` 的分诊表与四个文件的修订字节 → 已持久化产物是仓库内修订后的正文与 `docs/architecture/move-map.json` 条目 → 真实读取方是 `npx vitest run tests/contract/auto-recovery.test.mjs` 与每个 Phase 的开发子代理（读 `workflows/build-code/SKILL.md` 第 9 步）。我是怎么知道的：写卡时实读 `AGENTS.md:58`、`docs/standard-workflow.md:57`、`workflows/build-code/SKILL.md:39-40`、`skills/diagnosing-bugs/SKILL.md:38` 与 move-map 两条目；gate 未执行，本卡不宣称已执行。
- **RED/GREEN 门禁命令**：`npx vitest run tests/contract/auto-recovery.test.mjs`；RED 与 GREEN 共用这一条，范围只有本文件。
- **预期退出码**：RED nonzero；GREEN 0。
- **RED 目标失败**：ORACLE-AUTO-RECOVERY 断言：改动前 `AGENTS.md` 没有三列分诊表、第 9 步仍按失败次数停并交人工裁决，四场景比对与缺类检查必须非零失败；setup 或导入失败不算目标 RED，另记。
- **RED 证据**：unavailable — build-plan 不实施，由 build-code 补真实 RED
- **GREEN 判定器**：ORACLE-AUTO-RECOVERY；同一命令退出 0，四场景与表一致、S1 的换路径与不问人为真、S2–S4 各自只落三类停中的一种；具名反向行为是内存里把 S1 处置改成问人时同一检查器报错。
- **证据**：计划路径 `quality/evidence/workflowhub-build-code-efficiency-verify-merge-20261026/P3-auto-recovery.json`；RED 原件、GREEN 原件与四场景注入记录由执行者按「证据只留原始件」各存一份；本卡未执行，不把计划路径当结果。
- **覆盖上限**：只证明材料层规则在场与四类处置一致；不证明真实会话执行、真实权限或外部服务停点、审查并发、成本变化或用户答复；四场景不证明未来所有失败都被覆盖。
- **停止 / 恢复**：缺类、两处处置不一致、上限句残留、既有契约词被改红，或必须改 AC 或写集才能过时停；保原字节与失败输出，回 T003 动作核对真实字节；只在原 Phase 修，不改测试断言、不静默回退到旧规则。
- **测试变更请求**：none — 新增测试文件；既有 `tests/contract/n11-acceptance-rules.test.mjs` 与 `skills/diagnosing-bugs/__tests__/skill-contract.test.mjs` 不改，正文保留其断言词。
- **完成**：AC-RECOVER-001 与 AC-RECOVER-002 各一条档位与证据指针；`npx vitest run tests/contract/auto-recovery.test.mjs` 退出 0 可重放；四场景、原失败保留与不问人有具名断言；两个既有相邻契约测试仍绿；独立审查按真实 `git diff --name-only` 核对只改六个路径。缺一不记 pass。

## L2 — 可删除参考

实现落地后可删。保留两条提示：①先给 `AGENTS.md` 加分诊表并只在那里写四类处置，再改其余三处引用，避免先改引用时无源可指；②四个场景的期望值在测试里独立写死，不从正文反向生成，否则测试会跟着错误正文一起错。

## 补充材料

- 上游方向：`specs/workflowhub-build-code-efficiency-verify-merge-20261026/decision-log.md` 的 `WP2`、`F3`、`U-003`、`U-009`、`U-013`、`OI-003`。
- 判据原文：`spec.md` 的 `FR-RECOVER-001`、`FR-RECOVER-002` 与 Appendix A 的 `AC-RECOVER-001`、`AC-RECOVER-002`。
- 现状字节：`AGENTS.md`「卡住与升级」、`docs/standard-workflow.md`「stage 结束」、`workflows/build-code/SKILL.md` 方法第 2/5/9 步、`skills/diagnosing-bugs/SKILL.md` 第 1/3/4 节。
