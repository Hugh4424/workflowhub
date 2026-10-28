# Phase P3 — 同一失败自动换路径，只三类停

读者：P4 证据作者、每个 Phase 的开发子代理、本 Phase 独立审查者。
读完要能：说出同一失败反复或一轮没有新事实时先做什么、换哪条路径、只有哪三类才停；说出四类缺资源分诊各自落到哪条处置。

## Phase 契约头

- **全局规格**：`spec.md#实现设计（全局权威）`
- **写入集**：`workflows/build-code/SKILL.md`；`docs/standard-workflow.md`；`AGENTS.md`；`skills/diagnosing-bugs/SKILL.md`；`docs/architecture/move-map.json`；`tests/contract/auto-recovery.test.mjs`；`tests/contract/n11-acceptance-rules.test.mjs`
- **依赖**：`P2`
- **消费者**：P4 证据作者与每个 Phase 的开发子代理
- **gate_cmd**：`npx vitest run tests/contract/auto-recovery.test.mjs`
- **oracle**：ORACLE-AUTO-RECOVERY
- **evidence_path**：`quality/evidence/workflowhub-build-code-efficiency-verify-merge-20261026/2026-10-26-003-p3-observed-recovery-evidence.json`
- **STOP**：分诊表缺类、第 9 步与表处置不一致、四个文件仍留自动恢复或审查的固定次数/时长上限句（第二次触发、用户独占阻塞问一次、外部不可重试零重试及3–5竞争假设不属于该上限，原规则与断言保留）、或既有契约词被改红时停该路径；保原字节与失败输出，回 T003 动作逐项核，单源表只留 `AGENTS.md` 一张；不改测试断言、不删类求绿；仍不一致交 build-plan owner。
- **覆盖 AC**：AC-RECOVER-001、AC-RECOVER-002、AC-RESULT-003
- **Done**：AC-RECOVER-001 与 AC-RECOVER-002 各写一个档位与一条证据指针；`npx vitest run tests/contract/auto-recovery.test.mjs` 退出 0；四场景处置、原失败保留与不问人三项有具名断言；既有 n11 词组与 `3–5` 断言仍绿；缺一不记 pass。 实际独立回读：**AC-RECOVER-001 — pass**，证据 `quality/evidence/p3-agent-replay/2026-10-26-032-independent-four-case-real-observation.json`（case A）；**AC-RECOVER-002 — pass**，证据 `quality/evidence/p3-agent-replay/2026-10-26-032-independent-four-case-real-observation.json`（四类受控注入）。两项档位均沿 `quality/reviews/2026-10-26-021-p3-independent-final-quality-readback.json` 的独立判断，只在该原四类受控注入范围成立；B/C/D业务仍incomplete，真实外部权限与未来普遍恢复不在此pass内。

## 工作包声明（人读事实）

- **读集**：`spec.md` 的「实现设计（全局权威）」、`FR-RECOVER-001…002`、Appendix A 的 `AC-RECOVER-001…002` 与「需求到任务追踪」P3/T003 行；`skills/spec-plan/templates/phase-template.md` 的契约头与字段说明；`runtime/stage/stage-content-contracts.mjs` 的 `FIELD_LABEL_ALIASES` 与 Phase 卡字段校验；`workflows/build-code/SKILL.md`、`docs/standard-workflow.md`、`AGENTS.md`、`skills/diagnosing-bugs/SKILL.md` 的现状全文；`docs/architecture/move-map.json` 两条相关条目；两份既有相邻契约测试。
- **定序写主**：本 Phase 是写入集七个路径的唯一写主；P2已交付三角色与七步。`tests/contract/n11-acceptance-rules.test.mjs` 仅由P3/T003先修第91行样本路径，P11后写阶段迁移时先读回P3实际字节；P4只读本Phase产物。
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
- **未决事实**：`skills/catalog.yaml:835` 的 `design_idea` 仍把失败次数当停机依据，不在本 Phase 写集，由 norm-sync 在 P3 收口登记并交 catalog owner 改。`spec.md` 当前 AC-RECOVER 验证段与「需求到任务跟踪」均已由 P3/T003 承接，旧 P10 编号说明已过时，本次无需更改 spec。

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
- **修改**：`workflows/build-code/SKILL.md`；`docs/standard-workflow.md`；`AGENTS.md`；`skills/diagnosing-bugs/SKILL.md`；`docs/architecture/move-map.json`；`tests/contract/n11-acceptance-rules.test.mjs`（仅第91行样本路径字面，见本卡窄TCR）
- **禁止改动**：`runtime/`、`tools/`、`core/` 与全部生产代码；`docs/adr/0001` 至 `docs/adr/0053`、`docs/research/`、`docs/archive/`、`specs/archive/`；`skills/catalog.yaml`、`workflows/build-code/skill-deps.yaml`；`skills/diagnosing-bugs/__tests__/skill-contract.test.mjs` 与其它既有测试；本任务其它Phase文件。`tests/contract/n11-acceptance-rules.test.mjs` 仅豁免本卡TCR指定第91行样本路径字面，read helper、所有assert/case/期待/变异负例仍禁止改；归档单spec始终只读。理由：写集仅上述七路径，fixture例外只恢复读取同一字节样本，不能掩盖其它失败；catalog与其它测试仍属原owner。

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

开工前四要素：验证层为材料合同（静态断言四个真实文件的结构、处置与自动恢复或审查的固定次数/时长上限句）加受控场景比对；命令是 `npx vitest run tests/contract/auto-recovery.test.mjs`；预期是该命令退出 0 且每类场景与表一致；失败条件是任一类缺处置、处置被升级成问人、上述上限句残留或既有契约词被改掉；第二次触发、用户独占阻塞问一次、外部不可重试零重试及3–5竞争假设属于触发/分诊/方法数量，保留其原规则与断言，不按上限句误报。

| 目标 | Task | 角色 | gate_cmd / 预期退出码 | 判据 / 证据路径 |
| --- | --- | --- | --- | --- |
| 四类缺资源与只三类停的规则在场且一致 | T003 | RED | `npx vitest run tests/contract/auto-recovery.test.mjs` / 非零 | ORACLE-AUTO-RECOVERY / unavailable — build-plan 不实施，由 build-code 补真实 RED |
| 四类缺资源与只三类停的规则在场且一致 | T003 | GREEN | `npx vitest run tests/contract/auto-recovery.test.mjs` / 0 | ORACLE-AUTO-RECOVERY / `quality/evidence/workflowhub-build-code-efficiency-verify-merge-20261026/2026-10-26-003-p3-observed-recovery-evidence.json` |

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

相邻n11收集失败的窄fixture修复提前P3：原094命令为 `npx vitest run tests/contract/n11-acceptance-rules.test.mjs skills/diagnosing-bugs/__tests__/skill-contract.test.mjs tests/contract/phase-team.test.mjs`，修后须实际复跑并退出0，相邻仍绿承诺不降。独立TCR `quality/reviews/2026-10-26-015-p3-n11-reader-narrow-tcr-independent.md` 只支持读取坐标的一行变化，不证明测试已通过；旧094/096失败不覆盖，复验失败仍按原Done处置。

### 覆盖边界

- **覆盖上限**：只证明四个文件的规则在场、四类处置一致、没有上限句、既有契约词保留；不证明真实会话里执行者会照做，不证明真实权限停点、审查并发或成本变化。
- **显式不覆盖**：不演练真实权限或外部服务停点（`spec.md` 已将该项记为未取得）；不证明「不会再反复」；不证明用户会答复；不证明换路径一定找到根因。四场景是材料合同层的受控注入，不是真实会话回放。

### 停止

出现以下任一即停该路径：分诊表缺任一类或与第 9 步处置不一致；四个文件仍留自动恢复或审查的固定次数/时长上限句（第二次触发、用户独占阻塞问一次、外部不可重试零重试及3–5竞争假设不属于该上限，原规则与断言保留）；既有契约词被改红；必须改 AC、oracle、写集或方向才能让测试通过。停下后保原字节与失败输出，回 T003 动作逐项核对，单源表只留 `AGENTS.md` 一张；不改测试断言、不删类求绿；确实需要改承诺时交 build-plan owner，按三类停处置。

### 完成

需要四件事实：`npx vitest run tests/contract/auto-recovery.test.mjs` 退出 0；四场景与分诊表逐项一致；两个既有相邻契约测试仍绿；独立审查按真实 `git diff --name-only` 核对只改了写入集七个路径（n11测试仅窄TCR路径字面例外）。结论只能到「规则在场且材料层一致」，不能到「真实会话已自动恢复」。

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

- **来源 / FR / AC**：`U-003`「止损原则，不扩成总时长或固定审查预算」、`U-009`「撤回固定时长，不设固定时间」、`U-013`「AC 改动停问；先查根因、简化验收，实在无解再要真实资源」、`F3`「三类停收窄为改 AC 或方向、用户独占阻塞资源、严重风险；其余缺资源记 incomplete 继续」、`OI-003`；`FR-RECOVER-001`「同一失败反复或一轮没有新事实时先停重复动作，自动深研、换假设或方法或独立上下文、修正 Phase 内任务并继续，原失败原件保留」、`FR-RECOVER-002`「只有三类才停，其余缺资源记 incomplete 继续，不设次数或时长上限」；`AC-RECOVER-001`、`AC-RECOVER-002`。 补充承接 `AC-RESULT-003`（真实执行要求见下节，原成功/失败判据不变）。
- **输入**：`spec.md` 的 FR 与 AC 原文、`skills/spec-plan/templates/phase-template.md` 的字段说明、P2/T002 交付的三角色与七步顺序、四个文件与 move-map 的改前真实字节；四场景由测试作者独立写死。无外部提供者、无真实凭据需求，输入全部来自本任务既有材料。
- **文件 / 符号**：`workflows/build-code/SKILL.md`；`docs/standard-workflow.md`；`AGENTS.md`；`skills/diagnosing-bugs/SKILL.md`；`docs/architecture/move-map.json`；`tests/contract/auto-recovery.test.mjs`；`tests/contract/n11-acceptance-rules.test.mjs`（仅第91行样本reader路径字面）。符号面：`AGENTS.md`「卡住与升级」的三列分诊表与三类停句；`workflows/build-code/SKILL.md` 第 9 步的处置序列与自述行；`docs/standard-workflow.md`「stage 结束」的引用段；`skills/diagnosing-bugs/SKILL.md` 第 1、3 节的换假设与四类分诊；move-map 两条目的 `responsibility`、`owner`、`consumer`；新测试的四个场景常量与检查器。
- **动作**：①`AGENTS.md`「卡住与升级」把「连续无新事实即停重复续跑，按上条报告」改成「先停重复动作，再查根因、看验收或测试是否过度复杂、给更简单替代；仍有解就自动深研、换假设或方法或独立上下文、修正 Phase 内任务并继续，原失败原件保留；无新事实不是完成」；加三列四行分诊表、三类停、不设次数或时长上限；外部不可重试（许可或授权被拒绝、权限不足、密钥失效、输入非法、真实资源或环境不存在）零重试，立即报告并停该路径，其余安全工作继续，用户给新答复即复位，时间不构成复位条件；把「立即报告并给可直接回复的选项」收窄为「阻塞声明交付或 AC 判定时才按用户独占阻塞问一次，其余记 `incomplete` 并在 Phase 记录里报告」。②`docs/standard-workflow.md`「stage 结束」把「无新事实则停止重复、不自动续跑空转」与「换独立上下文重开、仍出现则升级问人」换成指向同一张表的三类停与无上限换路径；保留「时长本身永远不构成停止条件，时间不构成复位条件」、未取得答复不算同意、provider 排除句；不复写表。③`workflows/build-code/SKILL.md` 第 2 步加一句「同一失败第二次出现或一轮没有新事实时，先回第 9 步停重复动作再查根因」；第 5 步外部不可重试句改为按第 9 步四类分诊落位；第 9 步把重试自述段改成六段序列：停重复并写自述行 → 三检查 → 换路径清单（深研、换假设、换方法、换独立上下文、修正 Phase 内任务拆分/顺序/依赖/实现路线/测试路线/证据补齐）→ 四类分诊落位 → 外部零重试与用户新答复复位 → 无上限声明与「无新事实不是完成」，并写死不新建任务、不建第二个账本、不覆盖原失败原件。④`skills/diagnosing-bugs/SKILL.md` 第 1 节「回路无法建立…交还控制」改成四类分诊，保留「禁止猜测修复」；第 3 节删掉按失败次数停并交人工裁决的句子，改为同一失败或一轮无新事实时先停重复、再换竞争假设或探针或独立上下文继续，原失败与探针输出保留，不设次数上限；保留「3–5」个竞争假设与「一次只测一个变量」。⑤`docs/architecture/move-map.json` 的 `skills/diagnosing-bugs/SKILL.md` 条目 `responsibility` 加「自动恢复的换假设/换方法/换上下文与保留原失败」、`consumer` 加「方法 9 自动换路径」、`owner` 加 `P3/T003`；`workflows/build-code/SKILL.md` 条目 `responsibility` 写明方法 2 诊断与方法 9 自动恢复；两条的 `delete_condition` 与 `retention_basis` 原义不改。⑥先写 `tests/contract/auto-recovery.test.mjs`：读四个文件与 move-map 的真实字节，解析 `AGENTS.md` 分诊表，比对硬编码的四场景期望；做上限词扫描、既有契约词保留断言、内存变异反向用例。⑦按本卡窄TCR仅修 `tests/contract/n11-acceptance-rules.test.mjs` 第91行：`specs/n11-same-condition-eval-20261022/spec.md` → `specs/archive/n11-same-condition-eval-20261022/spec.md`；不改read helper、describe/it、required四词、missing检查器、expect或变异负例，不复制/创建/改写归档样本，不skip/catch ENOENT或返回默认空串。改后先核diff除该literal外逐字相同，再按“相邻契约保留”原命令复验；暴露其它失败回原作者，不扩大此TCR。
- **输出 / 失败**：输出是四类分诊表、第 9 步序列、两处引用、假设切换句、move-map 条目与新测试。失败信号是任一类缺失或处置与表不一致、上限句残留、原失败保留句缺失、既有契约词被改红，命令非零并指名断言。非法输入是改到写入集外、改既有测试断言、把非阻塞缺资源升级成问人。无临时服务或持久化副作用；内存变异不落盘。
- **边界 / 禁止改动**：`runtime/`、`tools/`、`core/` 与全部生产代码；`docs/adr/0001` 至 `docs/adr/0053`、`docs/research/`、`docs/archive/`、`specs/archive/`；`skills/catalog.yaml`、`workflows/build-code/skill-deps.yaml`；`skills/diagnosing-bugs/__tests__/skill-contract.test.mjs`；本任务其它Phase文件。`tests/contract/n11-acceptance-rules.test.mjs` 只允许本卡TCR的第91行样本路径字面修复，其helper、assert、case、期待与变异负例不动，`specs/archive/`保持只读；其余禁止边界保留，不能伪装缺口已完成。
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
- **证据**：计划路径 `quality/evidence/workflowhub-build-code-efficiency-verify-merge-20261026/2026-10-26-003-p3-observed-recovery-evidence.json`；RED 原件、GREEN 原件与四场景注入记录由执行者按「证据只留原始件」各存一份；本卡未执行，不把计划路径当结果。
- **覆盖上限**：只证明材料层规则在场与四类处置一致；不证明真实会话执行、真实权限或外部服务停点、审查并发、成本变化或用户答复；四场景不证明未来所有失败都被覆盖。
- **停止 / 恢复**：缺类、两处处置不一致、上限句残留、既有契约词被改红，或必须改 AC 或写集才能过时停；保原字节与失败输出，回 T003 动作核对真实字节；只在原 Phase 修，不改测试断言、不静默回退到旧规则。
- **测试变更请求**：窄fixture例外，独立只读意见 `quality/reviews/2026-10-26-015-p3-n11-reader-narrow-tcr-independent.md`；只允许 `tests/contract/n11-acceptance-rules.test.mjs` 第91行样本路径旧→archive。独立意见已核归档单spec与搬迁前 `2f4742451fbc5d9421325add09ecab90333df398^` 旧路径逐字相等，仅绑定该文件；保 `ORACLE-N11-ASSET-FIRST`、全部断言/case/期待/负例及归档字节，不授权其它改动。`skills/diagnosing-bugs/__tests__/skill-contract.test.mjs`仍不改，新auto-recovery冻结oracle不变；094收集失败与096基线缺失原件继续保留，未实际复验前不记n11或相邻GREEN。
- **完成**：AC-RECOVER-001 与 AC-RECOVER-002 各一条档位与证据指针；`npx vitest run tests/contract/auto-recovery.test.mjs` 退出 0 可重放；四场景、原失败保留与不问人有具名断言；两个既有相邻契约测试仍绿；独立审查按真实 `git diff --name-only` 核对只改七个声明路径（n11测试仅上述literal例外）。缺一不记 pass。

## L2 — 可删除参考

实现落地后可删。保留两条提示：①先给 `AGENTS.md` 加分诊表并只在那里写四类处置，再改其余三处引用，避免先改引用时无源可指；②四个场景的期望值在测试里独立写死，不从正文反向生成，否则测试会跟着错误正文一起错。

## 补充材料

- 上游方向：`specs/workflowhub-build-code-efficiency-verify-merge-20261026/decision-log.md` 的 `WP2`、`F3`、`U-003`、`U-009`、`U-013`、`OI-003`。
- 判据原文：`spec.md` 的 `FR-RECOVER-001`、`FR-RECOVER-002` 与 Appendix A 的 `AC-RECOVER-001`、`AC-RECOVER-002`。
- 现状字节：`AGENTS.md`「卡住与升级」、`docs/standard-workflow.md`「stage 结束」、`workflows/build-code/SKILL.md` 方法第 2/5/9 步、`skills/diagnosing-bugs/SKILL.md` 第 1/3/4 节。

## 执行记录（开发初确认，独立验收未做）

- **规则锚**：`spec.md` `FR-RECOVER-001`「同一失败反复或一轮没有新事实时，先停重复动作」；`FR-RECOVER-002`「只有改 AC 或方向、用户独占的阻塞资源、必须由人承担严重风险三类才停」；Appendix A `AC-RECOVER-001`、`AC-RECOVER-002`；`decision-log.md`「F3 — WP2/WP3 缺资源优先级」。
- **材料变更影响**：原 owner 的四行上限澄清保留；本次仅在本节记开发执行事实，不改 spec/index/FR/AC/oracle/其它 Phase。此前开发实施的是原六路径；本次fixture例外使当前声明写集为七路径，新增路径尚待按窄TCR实施与复验；P1 分级、P2 三角色与七步顺序保留。源码与正文变化不扩大材料范围。
- **实际改动与故意未改**：四类分诊表唯一写在 `AGENTS.md`；其它三个正文引用该表，build-code 方法2/5/9接入，diagnosing-bugs 保反馈回路/根因护栏并移除按次数交人工裁决，两条 move-map 保原删除条件与保留依据。未改 catalog（既有三次失败停止表述留原 owner）、生产代码和相邻测试。
- **开发测试事实**：`quality/tests/2026-10-26-090-p3-auto-recovery-red.json` 为目标 RED（16 failed/3 passed，收集有效）；冻结测试 SHA256 `725981ba036bd5bb4ed84746b69c43cf11ecf082fdda87b710fff76e2d49eed5`。修正恢复序列自述的提前用词后，`093-p3-auto-recovery-green.json` 为19/19；最终 `095-p3-final-target-contracts.json` 为19目标+3诊断契约通过。`094-p3-neighbor-contracts.json` 中P2 50/50和诊断3/3通过，但n11相邻文件收集失败，整条命令exit1，不记该文件通过。
- **失败与未覆盖**：n11测试读取不存在的 `specs/n11-same-condition-eval-20261022/spec.md`；`096-p3-scope-preservation.json` 核该路径在P2基线a917053d也不存在、n11测试字节未改，保当时不可用事实；本次经窄TCR登记由P3/T003先修该fixture坐标并实际复验（尚未执行、不冒成功），P11仅后续承接阶段迁移并读回此基线；不造源文件、不改断言、不重复同一收集失败。覆盖仅材料规则/四类受控输入及内存反向变异，不证明真实权限停点、真实会话自动恢复、provider或成本。
- **图与规范**：准备期图查询先于源阅读但只在当时工具输出；086–089为后续补充有界查询原件，不倒称首次发现。query预算截断及图新鲜度限制保留；历史只取仍适用的provider排除、外部零重试和时间不复位，不继承历史重开一次上限。非UI三专业源版本2026-10-25，按backend-testing材料合同路线；无UI/数据库/真实服务执行面。
- **规范同步准备**：已读norm-sync及主题路由，当前尚无本Phase独立验证原件，不提前写新专业规范/索引或清退经验；catalog遗留表述保在原卡未决项，由catalog owner承接。P3收口前独立验证后再依同方法判断，不以开发GREEN冒规范同步完成。
- **开发初确认**：六实施路径已实现，目标自测通过，已冻结停写等待独立测试与正式审查；AC与Done未由开发自签，Git未执行。普通finding回本实施会话，原RED与失败原件保留。

### 窄fixture修复后冻结（开发事实，待独立核验）

- 当前实施写集为七路径；另有P3执行材料、index/P11原计划owner配套共十路径。index/P11由原计划owner写，开发未改其字节；原七步、FR/AC、oracle及全局161路径分母保持。
- 按独立窄TCR015，只将n11测试第91行样本reader的旧spec路径改为archive同spec；除该literal外前后逐字相同，所有helper/assert/case/期待/负例保留。归档单spec SHA256 `97b427d4712ba18393093724cdf85338aa8584da3ba1ff84907e7c1a0b1bbc6a` 不变，单文件与搬迁前字节绑定不推整归档或权利。
- 实际复验：`quality/tests/2026-10-26-097-p3-neighbor-fixture-replay.json` 原094同命令exit0，n11 48 +诊断3 +P2 50，共101通过；`quality/tests/2026-10-26-098-p3-final-target-gate.json` 目标19通过。094原失败、096基线缺件事实保留；前节“尚未执行/不可用”是修复前事实，不代表当前相邻结果。
- 当前证据唯一指针以本卡契约头 `evidence_path` 为准，指向本次实际返回原件；001开发初确认清单只留历史，未覆写或复制raw输出，不作为第二当前清单。
- 冻结：目标测试 SHA256 `725981ba036bd5bb4ed84746b69c43cf11ecf082fdda87b710fff76e2d49eed5` 未变；P2七步正文及后续字节保持；开发再度初确认并停写，等独立测试与唯一正式OCR/补充轴。AC/Done和规范同步完成不由开发自签，未执行Git。

### 正式OCR020发现初处置（回放前事实）

- kimi/coding minor：新auto-recovery测试未登记属实；只在现有move-map追加唯一role:test条目，列实际owner、gate/独立reader消费者、材料检查职责及替代测试完整承接后删除条件；P2 phase-team登记已存在且完整，不改它。修复事实原件 `quality/evidence/p3-findings/2026-10-26-001-ocr-minor-registration-fix.json`，独立闭环未由开发自签。
- codex/luna major：材料19断言不能证明真实换路径、保原失败及是否问人，当前仍未解决；待独立p3_test设计与主会话实际受控AI工作单元回放。禁止用硬编码route脚本冒真实恢复，不自签AC-RECOVER或Done，不因多数票或审查完成宣称通过。
- 未改冻结19断言，故本次无测试TCR；n11既有窄TCR015及097/098结果保留。当前002证据清单是修复前执行事实，此处补充不同字节修复原件，不复制原输出、不重派正式OCR；major结果齐后再由主会话组织唯一当前清单。

### 当前证据汇总（真实受控回放后，待独立终判）

- 本卡 `evidence_path` 已指向本次实际append返回原件；该清单汇合032真实四agent观察、020/113正式OCR及覆盖限制、111/112同源两轴、109/099/100独立测试、015/105窄TCR/配套，以及minor登记修复001。此前001/002清单和本节以前的“未取得/待回放”只留当时事实，不是并行当前权威。
- 独立观察 `quality/evidence/p3-agent-replay/2026-10-26-032-independent-four-case-real-observation.json`：A消费宿主注入的106/107同失败后，自主改实际app输入路径，111得到total6、112继续安全工作且不问人；B仅113受控question一次并114安全工作，无伪造token或重试；C由115交原owner、116安全工作，不改承诺；D由117请求风险决定、118安全工作，未reset。B/C/D业务仍incomplete是受控场景内正确停相应路径的结果，不冒外部资源已可得。
- 032独立核四actor公开工具轨迹、初始唯一派发、scope/input/helper/method字节及原失败原件，亦核minor登记新增1且P2等旧条目保持。这里仅引用独立观察事实，不由开发自签OCR finding closed、AC或Done；待p3_review独立最终判断。
- 覆盖边界：A初始重复失败由宿主注入，不证明actor自主决定最初重试；B/C/D spy未联系真实人，不证明真实权限/外部服务已取得；部分全文读取有截断但相关段落可见；有限四例不证明未来全部失败、无限时长无上限行为、provider恢复或成本。冻结19测试与归档/实现字节保持，未运行新测试或Git。
- 规范同步/最终AC/提交原件尚未取得，不预填ref；临时回放工作区清理由主会话单独处理，本作者未清理。

### 本 Phase 自带判据小结与开发最终确认

- **独立结论来源**：`quality/reviews/2026-10-26-021-p3-independent-final-quality-readback.json` 已回读020两条finding为fixed、AC-RECOVER-001/002在原四类受控注入范围pass；开发仅据独立原件回填，不自创质量结论。
- **两finding处置**：codex/luna major由真实四child受控行为观察032补足，原材料19断言不改称行为回放；kimi/coding minor由 `quality/evidence/p3-findings/2026-10-26-001-ocr-minor-registration-fix.json` 补唯一登记，旧P2等条目保持。两条fixed均引用021独立复核；正式020与覆盖限制不覆写、不重派OCR。
- **自己验了什么**：开发090目标RED保留，098本Phase `gate_cmd` 原件目标19通过；097相邻命令101通过。独立099目标19与100邻接101实际exit0，原件经109及021读回。032与021另核A换实际输入路径后total6、零问人和保原失败，B仅问一次，C交原owner，D零reset，四案继续安全工作；不把静态字面检查替代这些观察。
- **没验什么与档位**：真实用户/权限/凭证/外部账本能力 `unavailable`，受控spy的delivered:false不冒真人交互；provider恢复与真实成本 `unavailable`；未来全部失败及无限时长恢复 `inconclusive`。A的首次两次失败由宿主预注入，不证明actor自主决定最初重试；部分整份方法读取截断，仅相关段落可观察，不冒全文已读。B/C/D业务验收仍为 `incomplete`，不在本卡改pass。
- **未验条件及owner**：真实外部能力须用户/实际资源owner提供真实权限、资源和范围，由主会话组织实际验收；provider/成本与未来会话效果由后继任务执行者提供相应真实输入和原件，本Phase不承诺。catalog既有“三次失败停止”仍由catalog owner承接，不清退原未决。
- **规范同步**：实际 `quality/evidence/2026-10-26-115-p3-norm-sync-no-extra-delta-readback.json` 核定无额外专业delta；现有唯一分诊表及原专业指针承接，未空写规范/索引或经验，不把四受控case升级成真实外部能力规范。
- **开发最终确认**：已收到独立测试109/032及审查021两方明确报告，均已实际回读；两条020finding由独立来源判fixed，无待实施修复项、无未解释测试失败。七实施路径、冻结19断言、归档、index/P11保持本轮既有字节；本次只补卡事实。当前证据仍仅003，未建新manifest；P3审后commit尚未执行，不填未来SHA/ref。本作者停写交主会话核四项后提交。

### 聚合前原owner回核：AC-RESULT-003（T003）

由本Phase原recovery owner 在P12真实聚合前任选T02十三Phase真实静态表标注计数或受控无新事实注入，说明选择理由，记录真实计数／换路径次数与是否回用户，由独立验证者核原件；不得把旧四replay或材料测试直接当本条通过。沿spec该AC原通过／失败判据，保存实际执行原件及独立首判，交P12引用。当前首判原件未取得、未执行本项；既有Done结论仅保原覆盖范围，不追签本条、不修改旧manifest或历史验收。此项只补原Task的结果检查职责，不新增Task、生产写集、gate或进度对象；原owner不可用须如实披露，不由P12代签。

#### AC-RESULT-003 实际首判回读（本次新增事实）

- **AC-RESULT-003 — pass（限本次受控注入）**：独立首判原件 `quality/evidence/p3-result003/2026-10-27-006-independent-ac-result003-first-verdict.json`，SHA256 `4b7d068778aa15fb056e05b6d89415354aa8db0e7bee4ca18fd66ef85a632cbd`；实际执行与计数原件 `quality/evidence/p3-result003/2026-10-27-005-actual-injection-count-readback.json`，SHA256 `8ab9d10fe7a1eba3aad7d1213667830776abb0859521171efb7d1f54dcfffeb6`。选择新的受控无新事实注入而非T02历史静态表，避免估算历史重复次数；不复用旧四replay验收冒签。
- **真实计数与效果**：初始宿主同失败注入2次（`quality/tests/2026-10-27-315-p3-agent-replay-verify.json`、`quality/tests/2026-10-27-316-p3-agent-replay-verify.json`，两份原输出逐字相同）；新actor实际路径切换1次、交接后旧失败重试0次、业务verify1次（`quality/tests/2026-10-27-317-p3-agent-replay-verify.json`，exit0、`{"total":6}`）；独立安全工作成功（`quality/tests/2026-10-27-318-p3-agent-replay-safe.json`，exit0、safe marker实际字节可读）。
- **是否回用户**：question、owner、risk-request及其它用户决策工具/消息均0，未回用户索取决定；完成后向父代理交结果不算决策请求。006独立读取全部7次公开工具调用、native315–318及前后app/保护输入字节后复算，不只信question_count或actor自报。
- **覆盖限制**：初始两失败由宿主预注入，不证明actor自主决定最初重复；部分源读取输出截断，仅所见相关段落与版本绑定可核；只覆盖这一个有限本地可选资源场景，不保证未来全部失败、无限时长恢复、真人权限/provider/外部能力或成本改善，不写“已消除”。独立首判只由P12引用，不扩大原恢复目标；上段“未取得/未执行”为本次执行前的规划事实，原规则、历史Done、manifest与旧验收原件保持不改。
