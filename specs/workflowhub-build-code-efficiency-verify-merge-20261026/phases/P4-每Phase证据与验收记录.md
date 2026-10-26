# Phase P4 — 每 Phase 一份清单与唯一游标

读者：build-code 实施者、每 Phase 独立审查者、P5 驾驶舱作者与 P12 终末验收作者。
读完要能：只凭本卡与真实原件，重放两张卡，判一个 Phase 是否只有一份执行清单、一个游标、一次成本与一份十环消费记录。

本 Phase 交付一个可独立验收的结果：每个 Phase 只产出一份执行清单与一份验收记录；命令、cwd、退出码、失败、真实 diff 与证据指针都在清单里，原始输出只在失败、差异或外部返回体处留原件，游标只前进一格，成本整个 stage 只记一次。

## Phase 契约头

- **全局规格**：`spec.md#实现设计全局权威`
- **写入集**：`skills/spec-specify/templates/spec-template.md`；`skills/spec-plan/templates/phase-template.md`；`workflows/build-code/SKILL.md`；`workflows/build-plan/SKILL.md`；`docs/standard-workflow.md`；`skills/stage-reflection/SKILL.md`；`runtime/task/task-store.mjs`；`tools/cli/measure-main-agent-cost.mjs`；`runtime/task/final-chain.mjs`；`docs/architecture/move-map.json`；`tests/contract/acceptance-plan.test.mjs`；`tests/contract/evidence-manifest.test.mjs`；`tests/contract/measure-main-agent-cost.node-test.mjs`
- **依赖**：`P3`
- **消费者**：P5 驾驶舱作者、P12 终末验收作者与每个 Phase 的主会话
- **gate_cmd**：`npx vitest run tests/contract/evidence-manifest.test.mjs`
- **oracle**：ORACLE-EVIDENCE-PHASE
- **evidence_path**：`quality/evidence/workflowhub-build-code-efficiency-verify-merge-20261026/P4-evidence-phase.json`
- **STOP**：清单与 `facts.jsonl` 现单行游标或既有 `captureCommand` 回执矛盾、七字段落点与 `runtime/stage/stage-content-contracts.mjs` 的字段名冲突、成本账本出现污染首行、或回退校验让既有续跑测试变红时停该处；材料是本卡、`spec.md` 的对应 AC 与真实字节；修复回 T004/T005 原实施 owner 与 build-plan 作者；不改 AC、oracle 或写集求绿。
- **覆盖 AC**：AC-ACCEPT-001、AC-ACCEPT-002、AC-EVID-001、AC-EVID-002、AC-EVID-003、AC-COST-001、AC-RESULT-001
- **Done**：前两条 AC 用 `npx vitest run tests/contract/acceptance-plan.test.mjs` 退出 0 加模板与夹具读回判定；后五条用 `npx vitest run tests/contract/evidence-manifest.test.mjs` 退出 0，加清单、facts、成本账本与十环报告原件读回判定；每条再给一条具名证据指针，档位只取 `runtime/evidence/acceptance-evidence-validator.mjs` 的八值词表；未取得写 unavailable 或 incomplete 并留原因、恢复条件与 owner，不预填 pass。

## 工作包声明（人读事实）

- **读集**：`spec.md` 的「实现设计（全局权威）」、AC-ACCEPT-001/002、AC-EVID-001/002/003、AC-COST-001、AC-RESULT-001；`skills/spec-plan/templates/phase-template.md` 契约头与 Tnnn 字段；`runtime/stage/stage-content-contracts.mjs` 第 60–135、500–660 行；`runtime/task/task-store.mjs`；`runtime/task/task-handle.mjs`；`tools/cli/measure-main-agent-cost.mjs`；`runtime/task/final-chain.mjs`；`docs/standard-workflow.md`「证据只留原始件」。
- **定序写主**：P1→P2→P3已先写 `workflows/build-code/SKILL.md`、`docs/standard-workflow.md`、`docs/architecture/move-map.json`，P4消费P3交回字节后继续写。两个模板、`workflows/build-plan/SKILL.md`、`skills/stage-reflection/SKILL.md`、`runtime/task/task-store.mjs`、`tools/cli/measure-main-agent-cost.mjs`、`runtime/task/final-chain.mjs`及本Phase新测试由P4在本任务中首写；后继P5–P12仅在各自声明写集重叠时按真实依赖后写，不能倒置为P6/P9先于P4。本Phase同路径唯一writer；先写者未能回读时记unknown及原因，后写者先核真实字节。
- **接口符号清单**：phase_progress 五字段；`appendRecord` 只收 quality 三目录；`captureCommand` 固定写 `quality/tests`；`measure-main-agent-cost --record` 与首笔 `--start-ref`；final-chain 的 RINGS 十环与 `run-checks --task-path`。
- **合并责任**：T004、T005 各由一名开发子代理持笔；冲突以本 Phase 审后提交为基线，失败回原实施会话重做，不沿用失败上下文。
- **progress_cursor**：只指向任务事实库 `facts.jsonl` 的 `phase_progress`，本文件不保存进度值。

## 速读卡（人读；只写本 Phase 增量）

- **本 Phase 结果**：清单、游标、成本、十环四处各只有一个权威；清单是每 Phase 唯一新增的人读证据件。
- **非目标**：不建第二账本、不建第二进度、不改历史证据、不每命令一件；不新增 runtime 公共命令、持久对象或控制面；不把清单变成可写进度权威。
- **改动前**：`phase_progress` 已有且恰五字段，只挂 build-code stage 行，原位替换；`appendRecord` 只收 quality 三个子树；成本入口有 `--record` 但代码无自动触发点，触发写在各 stage 收尾步骤文本；十环来自 final-chain 的 `RINGS`；`index.json` 在代码里不存在。
- **改动后**：每个 Phase 一份清单，列命令、cwd、退出码、失败、真实 diff 与指针；成功输出不各存一件，同字节复用；游标只前进一格；成本只在 stage 末记一次；最后 Phase 消费十环报告。
- **与相邻 Phase 的边界**：P3 交来失败换路径与 `incomplete` 分诊；本 Phase 只定 `incomplete` 的完整字段、结束提醒、清单、游标与成本；P5 读清单与真实 diff，P12 读十环与成本行做对账。
- **主要风险**：回退与 base_head 校验过严，把既有续跑测试或旧任务读成红；返工走法是先只保留方法规则与测试、撤回 store 校验，再按真实 facts 样本窄化。
- **下一步**：P5 从本 Phase 清单取节点来源与真实 diff；P12 读十环报告与成本账本行逐条对账。
- **动手前必读**：`spec.md` 的「实现设计（全局权威）」与 Appendix A 七条 AC → `runtime/task/task-store.mjs:61-104` → `runtime/task/task-handle.mjs:107-108` → `tools/cli/measure-main-agent-cost.mjs:389-390`、`:417-455` → `runtime/task/final-chain.mjs:1-4` → `docs/standard-workflow.md:45-49`。
- **未决事实**：既有 post task 的 `phase_progress` 中是否存在回退样本未全查；影响 T005 的回退校验可能拒写；开工时按真实 facts 抽查并在清单记样本与结论。

## 本 Phase 材料导航（人读；只列本 Phase 实际用到的锚点）

| 材料 / 锚点 | 本 Phase 用它做什么 | 读取时机 |
| --- | --- | --- |
| `spec.md#实现设计（全局权威）` | 清单、游标、成本的全局口径 | 写卡前 |
| `spec.md#Appendix A — 验收判据（唯一权威）` | 七条 AC 的判定方式、证据与失败条件 | 写卡前 |
| `runtime/task/task-store.mjs:61-104` | 五字段、原位替换、写入校验的当前字节 | 设计游标规则前 |
| `runtime/task/task-handle.mjs:107-108` | appendRecord 三目录与 captureCommand 落点 | 设计清单写入前 |
| `tools/cli/measure-main-agent-cost.mjs:389-455` | `--record`、首笔 `--start-ref`、账本行 | 设计成本规则前 |
| `runtime/task/final-chain.mjs:1-3` | 十环与状态词表 | 设计十环消费前 |

## L0 — 结果与变更

本 Phase 把「每个 Phase 的证据」从散落输出收敛成一份清单，并把续跑与成本各收敛到一个权威：一个游标、一次记录。它接在 P3 的自动恢复之后：恢复可以换路径，但换路径不能换来第二份账本或第二个进度。

- **结果**：每个 Phase 一份执行清单与一份验收记录；命令、cwd、退出码、失败、真实 diff、指针都在清单里；失败/差异/外部返回体留原始字节；游标只前进、不存历史；成本整个 stage 只记一次；最后 Phase 消费十环报告。
- **非目标**：不新建游标，不改清单以外的历史证据，不把十环报告做成第二份进度或第二份对账，不新增检查器。
- **与其它 Phase 的区别**：P3 定失败后怎么走；本 Phase 定走完后留什么、留几份、谁消费；P12 才逐 AC 对账。

## L1 — 可执行契约

### 文件边界

- **新增**：`tests/contract/acceptance-plan.test.mjs`；`tests/contract/evidence-manifest.test.mjs`；`tests/contract/measure-main-agent-cost.node-test.mjs`（既有文件，属修改不属新增，用 node --test 运行）。三个文件都先写并跑一次目标失败，再改方法与实现。
- **修改**：`skills/spec-specify/templates/spec-template.md`；`skills/spec-plan/templates/phase-template.md`；`workflows/build-code/SKILL.md`；`workflows/build-plan/SKILL.md`；`docs/standard-workflow.md`；`skills/stage-reflection/SKILL.md`；`runtime/task/task-store.mjs`；`tools/cli/measure-main-agent-cost.mjs`；`docs/architecture/move-map.json`。
- **只读核对**：`runtime/task/final-chain.mjs` 在写入集内但本 Phase 不改字节；实读 `RINGS` 与 `run-checks --task-path` 输出，把消费规则写进方法正文，证据里记 unchanged，不为凑写集制造改动。
- **禁止改动**：`docs/adr/**`、`docs/research/**`、`docs/archive/**`、`specs/archive/**` 历史只读；`runtime/interface/run-command.mjs` 与 `runtime/task/task-handle.mjs` 的既有采集/写入语义；`runtime/interface/runtime-facade.mjs` 的公共七类命令；不新增生产文件、第二账本、第二进度权威或第二套审查点。

### 任务顺序

T004 → T005，串行。T005 消费 T004 的七字段与 `incomplete` 格式，并把 build-code 收尾提醒接到已定格式上；两卡写集不重叠，同一 `evidence_path` 只由 T005 在收口时写一次。没有可并行的第二条路径。

### 测试策略

收口消费（既有检查，本 Phase 不改其退出语义）：每个 Phase 收口运行 `node tools/cli/check-stage-steps.mjs --stage=build-code --task-path=<任务目录>`，逐项读缺口；`run-checks` 的步骤缺口已不再影响退出码（`stepCoverageExit` 恒返回 0），因此不得据 exit 0 判定步骤齐全，只能读报告里的 `missing_steps`。

开工前四要素：每条承接 AC 写明验证层、命令、预期结果与失败条件。本 Phase 只跑两个具名契约文件，不跑全量。

| 目标 | Task | 角色 | gate_cmd / 预期退出码 | 判据 / 证据路径 |
| --- | --- | --- | --- | --- |
| 七字段证据计划与 `incomplete` 记录可核 | T004 | RED | `npx vitest run tests/contract/acceptance-plan.test.mjs` / 非零 | ORACLE-ACCEPT-PLAN / unavailable — build-plan 不实施，由 build-code 补真实 RED |
| 同上 | T004 | GREEN | `npx vitest run tests/contract/acceptance-plan.test.mjs` / 0 | ORACLE-ACCEPT-PLAN / `quality/evidence/workflowhub-build-code-efficiency-verify-merge-20261026/P4-evidence-phase.json` 的 acceptance 行 |
| 一份清单、唯一游标、成本一次、十环消费 | T005 | RED | `npx vitest run tests/contract/evidence-manifest.test.mjs` / 非零 | ORACLE-EVIDENCE-PHASE / unavailable — build-plan 不实施，由 build-code 补真实 RED |
| 同上 | T005 | GREEN | `npx vitest run tests/contract/evidence-manifest.test.mjs` / 0 | ORACLE-EVIDENCE-PHASE / 同一 evidence_path 的 commands、cursor_ref、cost、final_chain_ref 行 |

### 覆盖边界

- **覆盖上限**：只证明模板字段、store 游标约束、清单结构与复用规则、成本入口输出在受控夹具中成立；不证明真实长任务照做，也不证明耗时或成本降低。
- **显式不覆盖**：外部 OCR 可用性、真实用户旅程、真实权限停点、全部 Phase 的合规性、AC 的首次判定（归各承接 Phase，P12 只对账）。

### 停止

清单与 facts 或既有回执矛盾、模板节名冲突、回退校验让既有续跑测试变红、成本账本已有污染首行、move-map 校验失败时，停止该路径并保留原始失败与当前字节；修复回 T004/T005 原实施 owner、build-plan 作者或原运行时 owner；不改 AC、oracle、写集或测试断言求绿，其余安全工作继续。

### 完成

两门 GREEN 各留真实 RED/GREEN 原件、反例与读回；七条承接 AC 各有一个档位和一条具名证据指针；`evidence_path` 的清单写明 commands、cursor_ref、cost 与 final_chain_ref；独立审查核对写集、模板落点与清单没有变成第二账本或第二进度。结论只到「格式与受控行为」这一强度。

### 风险与回滚

- **风险**：回退校验与 `tools/cli/stage-runtime.mjs` 的真实写路径冲突；清单被当成可写进度或被复制成第二份。
- **影响**：续跑被误拒，或事实出现两个权威，后续 Phase 与 P12 对不上。
- **缓解**：只校验显式写入的新游标；同一 Phase 允许原位更新；清单只存指针不存可写值。
- **回滚**：按 Phase 审后提交点整卡回退；保留原失败与历史证据，不回退他人字节。
- **触发条件**：既有续跑测试出现非预期失败，或审查发现第二个进度来源。

### 交接知识（给下游 Phase 与审查的已核实事实）

- `phase_progress` 恰五字段且只挂 build-code；原位替换，不存历史序列；`index.json` 在代码里不存在，不是本 Phase 依赖。
- `appendRecord` 只收 `quality/evidence`、`quality/reviews`、`quality/tests`；`captureCommand` 固定写 `quality/tests`；别处不能新增证据目录。
- 成本账本 `main-agent-cost.md` 每行 27 列；首笔必须 `--start-ref`，已有账行不重置起点；同阶段续测只能是非重叠窗口，不是同一窗口重记。
- 十环顺序为原始需求、decision-log、调研方案、方案、spec、phase、代码实现、测试验证、最终审查、提交 PR；build-code 内环 10 记 `skipped`。

### T004 — 逐条证据计划与缺口记录

- **来源 / FR / AC**：`U-011`「每条承接 AC 写清判什么、怎么判、证据从哪来、谁提供、何时能拿到、成本类别、拿不到怎么办」、`U-014`「`incomplete` 必须有真实尝试证据与恢复条件，build-code 结束统一提醒」、`U-022`「可带缺口进 stage-close，但最终报告逐条列缺口、不宣称完成」；`FR-ACCEPT-001`、`FR-ACCEPT-002`；`AC-ACCEPT-001`、`AC-ACCEPT-002`。
- **证据计划**：判什么=每条承接 AC 的可观察结果；怎么判=AC 的判定方式加所属 Phase 的 `gate_cmd`；证据从哪来=AC「证据」行与 Phase 清单条目；谁提供=Phase 实施者、独立审查者与用户；何时能拿到=Phase 执行时与 stage 收口；成本类别=命令级、受控运行级、真实环境级或人在场级；拿不到怎么办=AC「失败」行加 `incomplete` 四件。
- **文件 / 符号**：`skills/spec-specify/templates/spec-template.md`（符号：Appendix A 每条 AC 的「证据」行与「验收流程」）；`skills/spec-plan/templates/phase-template.md`（符号：Tnnn 卡的「来源 / FR / AC」后新增「证据计划」字段、「停止 / 恢复」）；`workflows/build-plan/SKILL.md`（符号：「方法」第 7、9 步）；`tests/contract/acceptance-plan.test.mjs`（符号：ORACLE-ACCEPT-PLAN 测试块）。
- **动作**：① 在 spec 模板的每条 AC「证据」行后加一行 `证据计划：判什么=…；怎么判=…；证据从哪来=…；谁提供=…；何时能拿到=…；成本类别=…；拿不到怎么办=…`，值写真实对象与时点，七项缺一不算填写；七个字段分别落在既有节：首句、判定方式与「验证」、「证据」、执行 owner、「验证」时点、「测试标准」测试面、「失败」与 `incomplete`。② 在 spec 模板「验收流程」加 `incomplete` 记录格式：`incomplete：AC-…；试过=<命令与原 ref>；卡在=<真实条件>；谁提供=<真实对象>；恢复条件=<可观察条件>`；无「试过」原 ref 不得记 `incomplete`，可以带缺口进 stage-close，但最终报告逐条列缺口、不写完成。③ 在 phase 模板 T 卡「来源 / FR / AC」后加「证据计划」一栏，七项按本卡既有节取值：判什么→来源 / FR / AC；怎么判→测试层级 / 技能与 RED/GREEN 门禁命令；证据从哪来→证据与契约头 `evidence_path`；谁提供→输入；何时能拿到→依赖与输入；成本类别→场景 / 夹具或服务；拿不到怎么办→停止 / 恢复与覆盖上限；并在模板的「字段说明」表加一行「证据计划」，写作下限写清这七项指向本卡既有节。④ 在 phase 模板的收口正文写清：build-code 结束统一提醒逐条列 `incomplete`，每条带尝试 ref、阻塞条件、提供者与恢复条件；最终报告逐条列缺口、不宣称完成。⑤ 在 `workflows/build-plan/SKILL.md` 第 7 步要求每条承接 AC 落七字段、缺一项不得开工；第 9 步自查七字段与 `incomplete` 记录，缺项进本轮盘点事实。⑥ 先写 `tests/contract/acceptance-plan.test.mjs`：读两个模板真实字节与一张夹具 Phase 卡，逐条断言七标签、`incomplete` 四件与「无尝试 ref 拒绝」的负例。不新增检查器，不建第二份验收计划。
- **输入**：decision-log「验收前移」段（`U-011`、`U-014`、`U-022`）；`spec.md` 的 AC-ACCEPT-001/002 与「测试标准」测试面表；两个模板与 `workflows/build-plan/SKILL.md` 的当前字节。无上游 Task；可独立开始，P3 的 `incomplete` 分诊只作 Phase 级前置。
- **输出 / 失败**：正例是模板各出现七字段与 `incomplete` 四件、`acceptance-plan.test.mjs` 退出 0。失败信号：任一 AC 缺字段、`incomplete` 无「试过」原 ref、值写成占位或非真实提供者，测试非零；模板节名与 `runtime/stage/stage-content-contracts.mjs` 的既有字段名冲突时停。夹具在临时目录建、`finally` 清理，不碰真实任务库。
- **边界 / 禁止改动**：不改 AC 判据、`spec.md` 正文与既有测试断言；不新建检查器或第二份验收计划；不改 `docs/adr/**`、`specs/archive/**`；不新增 runtime 字段；模板只加人读字段，不改 runtime 读取的既有字段名。
- **依赖**：none — 本卡是所在 Phase 的第一张卡，前一个 Phase 的交付只作 Phase 级前置，不构成本卡输入边。
- **测试层级 / 技能**：材料合同（技能/方法正文结构）；主技能 spec-plan；不涉及 UI、数据库、网络或真实外部服务。
- **场景 / 夹具或服务**：正例=真实模板的一条 AC 加一张夹具 Phase 卡，七字段齐全、`incomplete` 带 `试过=quality/tests/…` 与恢复条件；负例一=删掉「成本类别」，断言失败；负例二=`incomplete` 只写「拿不到」，断言失败；负例三=提供者写成占位，断言失败。夹具在 tmp 目录建、`finally` 删。
- **RED/GREEN 门禁命令**：`npx vitest run tests/contract/acceptance-plan.test.mjs -t "ORACLE-ACCEPT-PLAN"`。
- **预期退出码**：RED nonzero；GREEN 0。
- **RED 目标失败**：ORACLE-ACCEPT-PLAN 的断言「每条承接 AC 七字段齐全、`incomplete` 带真实尝试 ref 与恢复条件」在模板未改前失败；删「成本类别」、去掉「试过」ref、写占位提供者的负例必须非零。
- **RED 证据**：unavailable — build-plan 不实施，由 build-code 补真实 RED。
- **GREEN 判定器**：ORACLE-ACCEPT-PLAN；同一命令退出 0，正例七字段逐项命中，三个负例各自被拒；不把占位文字、编号或文件存在当字段。
- **证据**：RED/GREEN 原始输出、夹具与模板读回存 `quality/evidence/workflowhub-build-code-efficiency-verify-merge-20261026/P4-evidence-phase.json` 的 acceptance 行所引原件；本文件不填执行状态。
- **停止 / 恢复**：模板节名或字段名与 `runtime/stage/stage-content-contracts.mjs` 现状冲突、或同路径被其它 Phase 先写时停本卡；回 build-plan 作者与 P4 实施 owner 核当前字节后再改；不改 AC 求绿。
- **覆盖上限**：只证明模板结构与夹具语法；不证明真实提供者按时提供、不证明 build-code 实际执行提醒、不证明人类读者理解，也不证明任何真实 AC 已达成。
- **完成**：RED/GREEN 原件、三个负例、模板读回与独立审查齐备；AC-ACCEPT-001/002 按原判据各写 pass 或 `incomplete` 并带原因、恢复条件与 owner；写不出可重放判据的项算未达成。

### T005 — 一份清单、唯一游标、成本一次

- **来源 / FR / AC**：`U-017`「每个 Phase 一份执行清单，原始输出只在失败、差异、外部返回体留原件，同字节复用；成本整个 stage 末记一次」、`F7`「证据过载与成本重复」、`F8`「三条结果层信号」、`U-006`「可验收的有限目标」；`FR-EVID-001`、`FR-EVID-002`、`FR-EVID-003`、`FR-COST-001`、`FR-RESULT-001`；`AC-EVID-001`、`AC-EVID-002`、`AC-EVID-003`、`AC-COST-001`、`AC-RESULT-001`。
- **证据计划**：判什么=每 Phase 一份清单、唯一当前游标、本 Phase 材料如实、stage 成本一行、结果层五数可复算、十环报告被最后 Phase 消费；怎么判=清单与 facts/账本读回加两个具名测试；证据从哪来=清单、`facts.jsonl`、`quality/tests` 原件、`main-agent-cost.md` 与 `run-checks` stdout；谁提供=Phase 主会话、独立审查者、P12；何时能拿到=Phase 收口、stage 末与最终对账；成本类别=命令级加一次受控运行加真实账本；拿不到怎么办=`incomplete` 四件。
- **文件 / 符号**：`workflows/build-code/SKILL.md`（符号：「方法」第 5、10、12 步与「阶段收口中的成本」段）；`docs/standard-workflow.md`（符号：「证据只留原始件」新增「每 Phase 一份执行清单」小节、「stage 结束」）；`skills/stage-reflection/SKILL.md`（符号：「方法」第 3、5 步）；`runtime/task/task-store.mjs`（符号：validateCursor、writeStageRow）；`tools/cli/measure-main-agent-cost.mjs`（符号：human、recordMeasurement）；`docs/architecture/move-map.json`（符号：task-store、measure-main-agent-cost、final-chain 三条目的 module_consumers）；`tests/contract/evidence-manifest.test.mjs`（符号：ORACLE-EVIDENCE-PHASE 主测试）；`tests/contract/measure-main-agent-cost.node-test.mjs`（符号：ORACLE-EVIDENCE-PHASE 成本一次测试）。
- **动作**：① 在 `docs/standard-workflow.md`「证据只留原始件」加「每 Phase 一份执行清单」：判定唯一清单字段为 `phase_id`、`task_ids`、`cursor_ref`、`commands`、`failures`、`diffs`、`evidence_refs`、`materials`、`reviews`、`acceptance`、`cost`、`final_chain_ref`；命令行记 argv、cwd、`exit_code`、起止与时长；失败行记 `failure_signature` 与原件 ref；diff 行记 `git diff --name-only` 与 `--numstat` 的实际路径、统计与原件 ref；清单每 Phase 一份，Phase 收口原子写、审后冻结，后续不改历史清单。② 写明原件与复用：同一命令再跑且内容比较成立同字节时，用既有 `resolveOutputRef` 指回首次原件，不新增物理副本；字节不同或候选不可读时保留新件并记 `deduplication: unknown`；失败、差异、外部返回体、范围证据与一次性环境读数保留原始字节；成功且无字节需要的输出不进清单证据指针。清单只投影 facts、回执与 quality 原件，不建第二账本。③ 在 task-store 的显式写入路径加窄校验：已有游标时拒绝回退到更早 Phase、拒绝改同一 Phase 的 `base_head`；五字段与只挂 build-code 不变，不存历史序列；清单只存 `cursor_ref`，不复制可写值。④ 在 build-code 第 5 步指向该小节并写「本 Phase 只多一份清单」；第 12 步成本段固定为整个 stage 末一次 `measure-main-agent-cost --record`，首笔带 `--start-ref`，不每 Phase 触发；理由：计量窗口是 stage 级，Phase 收口时看不到完整墙钟与等待，每 Phase 记会重复切碎同一窗口，且首笔要真实开工事件；收口前按 T004 的格式统一提醒 `incomplete`。⑤ 在 measure 入口打印结果层五数的实际值与账本行号（墙钟、输入/输出 token、steps、子代理调用），失败项保留 `unavailable:<reason>`；不新增字段、账本或命令。⑥ 十环消费：最后 Phase 跑 `node tools/cli/run-checks.mjs --task-path <任务根>`，把 stdout 存成一份原件，并在对账里引用；环 1–9 取真实状态，环 10 在 build-code 记 `skipped`、stage-close 后由调用方补终态；不改 final-chain 代码。⑦ 材料清单：Phase 卡的「本 Phase 材料导航」只列实际打开的锚点与审查原件，独立审查用 `git diff --name-only` 与实际读取记录核对没有多读整仓，缺材料写缺与用途。⑧ move-map 只给三条目加新测试 consumer，不新增条目、不改 owner 与 delete_condition。⑨ 先写两个具名测试：临时 git worktree 加 post task 夹具，三条命令（成功、同字节重复、exit 7 失败）、P6→P7 游标与一笔成本行，断言一份清单、失败原件保留、重复复用、facts 单游标、账本单行、十环报告可消费。
- **输入**：T004 的七字段与 `incomplete` 格式；`facts.jsonl` 现有 `phase_progress` 五字段；`runtime/task/task-handle.mjs` 的 `appendRecord` 三目录与 `captureCommand` 落点；`tools/cli/measure-main-agent-cost.mjs` 的 `--record`、`--start-ref` 与 27 列账本；`runtime/task/final-chain.mjs` 的 RINGS 与 `run-checks --task-path`；`index.json` 在代码里不存在，不作依赖。
- **输出 / 失败**：正例是清单一份、facts 一条当前游标、账本一行、十环报告一份，两个具名测试 0。失败信号：出现第二份清单、历史序列、第二条进度、同 stage 第二行成本或重复成功输出各存一件 → 非零；回退游标或改同一 Phase 的 `base_head` → 写入被拒；字节不同却冒充复用 → 记 `deduplication: unknown` 并保留新件。
- **边界 / 禁止改动**：不建第二账本或第二进度；不改历史证据与旧账行；不改 `runtime/interface/run-command.mjs`、`runtime/task/task-handle.mjs` 的既有语义；不新增 runtime 公共命令、持久对象或控制面；不动 `docs/adr/**`、`specs/archive/**`；不把清单写成可被续跑读取的进度权威。
- **依赖**：T004；本卡消费其七字段与 `incomplete` 格式，在其写完后开始，避免同一路径先后两个 writer。
- **测试层级 / 技能**：证据与游标行为、工具与枚举一致性；主技能 backend-testing；不涉及 UI 与外部 provider。
- **场景 / 夹具或服务**：夹具=临时 git worktree、post task、三条命令（成功、同字节重复成功、exit 7）、P6→P7 游标、一笔成本行；正例逐项断言；负例=回退 P7、第二份清单、同 stage 第二行，各自非零或被拒。搭建与清理都在 tmp，`finally` 删。
- **RED/GREEN 门禁命令**：`npx vitest run tests/contract/evidence-manifest.test.mjs`。
- **预期退出码**：RED nonzero；GREEN 0。
- **RED 目标失败**：ORACLE-EVIDENCE-PHASE 的断言「一个 Phase 恰一份清单、重复成功输出复用同一原 ref、失败输出保留、facts 只有一条当前游标、stage 账本只有一行、十环报告可被最后 Phase 消费」在方法与校验未改前失败；回退游标、第二份清单、第二行成本三个负例必须非零或被拒。
- **RED 证据**：unavailable — build-plan 不实施，由 build-code 补真实 RED。
- **GREEN 判定器**：ORACLE-EVIDENCE-PHASE；同一命令退出 0，正例逐项命中，负例各自被拒；十环报告由真实 `run-checks --task-path` 输出且环 10 为 `skipped`；回退游标必须给出 TypeError，不静默改写。
- **证据**：RED/GREEN 原始输出、清单、facts、账本与十环报告原件存 `quality/evidence/workflowhub-build-code-efficiency-verify-merge-20261026/P4-evidence-phase.json` 所引路径；本文件不填执行状态。
- **停止 / 恢复**：游标校验与 `tools/cli/stage-runtime.mjs` 的现状冲突、成本账本已有污染首行、move-map 校验失败或十环报告不可读时停该处；回 P4 实施 owner 与原 owner 核真实字节；不改测试、判据或写集求绿。
- **覆盖上限**：不证明真实长任务成本降低或零复发；不证明每个 Phase 实际照做；不证明外部 provider 可用；不证明 P12 会按本卡消费（P12 自证）。
- **完成**：RED/GREEN 原件、三个负例、清单/facts/账本/十环读回与独立审查齐备；AC-EVID-001/002/003、AC-COST-001、AC-RESULT-001 按原判据各写档位与证据指针；成本五数给真实数字，不以百分比或估计代替。

#### 附加条款（T005） 的冻结比较基线与复算

P4/T005 是 AC-COST-001、AC-RESULT-001 的 producer；P12 仅消费。T005 先用既有 measureSessions 对同一受控工作单元的原规则运行原件产出 `quality/evidence/workflowhub-build-code-efficiency-verify-merge-20261026/P4-cost-baseline.json`，留源 session 绝对 ref、sha256、窗口起止、输入工作单元、工具版本/HEAD、墙钟/输入token/输出token/steps/子代理调用五数及缺失原因；基线经独立读回后冻结字节。再用同一单元的新规则运行产出 `P4-cost-current.json`（同一目录），条件差异逐项披露；不把历史 T02 长任务拿来冒同条件实验。两次原件均由原 measure 入口得数，验证者复跑只读命令，不重复 --record。命令 `node --test tests/contract/measure-main-agent-cost.node-test.mjs` 期望 0，测试以两个独立加载的不可变会话输入调用 measureSessions 并核与原始事件一致；基线缺失、窗口不可比或任一数字 unavailable 时该 AC 保未完成，不能估计补齐。把输入/输出token分开计为五数，不增指标。真实 stage 末一次 --record 与受控比较的只读复算分开，后者不追加账本。

#### 附加条款（T005） 的复算命令绑定

两次运行各在清单已有 commands 行保存可直接重放的完整 argv：`node tools/cli/measure-main-agent-cost.mjs --session=<该运行真实session绝对路径> --from=<该运行真实ISO起点> --until=<该运行真实ISO终点>`，上述三个值由 T005 执行时从真实会话取得并替换后保存，不把尖括号命令当执行记录；未取得则 unavailable。验证者按该真实 argv 只读复算，对照两个冻结JSON的五数与源sha256；任一差异逐项暴露，不通过重选窗口换绿。现阶段没有运行，真实argv未产生。

### 本 Phase 冻结测试处置核正

当前实读受保护路径：`tests/contract/measure-main-agent-cost.node-test.mjs`。此逐路径清单补齐前文按数量的简述；各文件的原 ORACLE 与负例强度保持。路径/名称常量按卡中具名范围处理，任何断言表达式、判定或评分变化先在本卡 TCR 字段写旧/新断言、原因与旧失败ref，并取得独立审查原件；未取得只停该断言改动，不改保护标记求绿。本轮不修改测试；实施者不能凭本清单自行放宽 AC。

## L2 — 可删除参考

清单形状示例（字段名固定，值按真实任务替换；删本节不改变 L0/L1）：

```json
{
  "phase_id": "P4",
  "task_ids": ["T004", "T005"],
  "cursor_ref": "facts.jsonl#<build-code row>",
  "commands": [
    { "argv": ["npx", "vitest", "run", "tests/contract/evidence-manifest.test.mjs"], "cwd": "<worktree>", "exit_code": 0, "started_at": "<ISO>", "duration_ms": 0, "output_ref": null }
  ],
  "failures": [
    { "command_seq": 2, "failure_signature": "exit 7; <first failing line>", "original_output_ref": "quality/tests/<date>-<seq>-<slug>.output" }
  ],
  "diffs": [
    { "command": "git diff --name-only", "cwd": "<worktree>", "exit_code": 0, "paths": ["<path>"], "numstat_ref": "quality/tests/<date>-<seq>-diff-numstat.output" }
  ],
  "evidence_refs": [
    { "ref": "quality/tests/<date>-<seq>-<slug>.output", "bytes": 0, "sha256": "<64 hex>", "kept_because": "failure" }
  ],
  "materials": [{ "ref": "spec.md#实现设计（全局权威）", "purpose": "全局口径" }],
  "reviews": [{ "ref": "quality/reviews/<record>", "executor": "independent-subagent" }],
  "acceptance": [{ "ac": "AC-EVID-001", "tier": "incomplete", "evidence_ref": "quality/tests/<...>", "gap": { "tried": "<ref>", "blocked_on": "<条件>", "provided_by": "<对象>", "recover_when": "<条件>" } }],
  "cost": { "ledger_ref": "main-agent-cost.md#<row>", "window": { "from": "<ISO>", "until": "<ISO>" } },
  "final_chain_ref": "quality/evidence/workflowhub-build-code-efficiency-verify-merge-20261026/P12-final-chain.json"
}
```

- 成本账本每行 27 列；结果层只读该行与基线行，不另算、不只报百分比。
- 十环由 `runtime/task/final-chain.mjs` 的 `RINGS` 定义；报告入口是 `tools/cli/run-checks.mjs --task-path`，退出码由步骤覆盖派生，不等同质量通过。

## 补充材料

- 全局权威：`spec.md` 的「实现设计（全局权威）」、Appendix A 七条 AC 与「需求到任务追踪」P4 两行。
- 上游事实：decision-log 的 `U-011`、`U-014`、`U-017`、`U-022`、`F7`、`F8`；P3 的 Phase 卡与 `incomplete` 分诊表。
- 本 Phase 只写本文件；代码、测试与真实 RED/GREEN 由 build-code 按两张卡落地。
