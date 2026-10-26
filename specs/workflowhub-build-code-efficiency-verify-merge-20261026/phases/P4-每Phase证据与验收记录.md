# Phase P4 — 每 Phase 一份清单与唯一游标

读者：build-code 实施者、每 Phase 独立审查者、P5 驾驶舱作者与 P12 终末验收作者。
读完要能：只凭本卡与真实原件，重放两张卡，判一个 Phase 是否只有一份执行清单、一个游标、一次成本与一份十环消费记录。

本 Phase 交付一个可独立验收的结果：每个 Phase 只产出一份执行清单与一份验收记录；命令、cwd、退出码、失败、真实 diff 与证据指针都在清单里，原始输出只在失败、差异或外部返回体处留原件，游标按既有writer原位更新，只有一条当前值，成本整个 stage 只记一次。

## Phase 契约头

- **全局规格**：`spec.md#实现设计全局权威`
- **写入集**：`skills/spec-specify/templates/spec-template.md`；`skills/spec-plan/templates/phase-template.md`；`workflows/build-code/SKILL.md`；`workflows/build-plan/SKILL.md`；`docs/standard-workflow.md`；`skills/stage-reflection/SKILL.md`；`runtime/task/task-store.mjs`；`tools/cli/measure-main-agent-cost.mjs`；`runtime/task/final-chain.mjs`；`docs/architecture/move-map.json`；`tests/contract/acceptance-plan.test.mjs`；`tests/contract/evidence-manifest.test.mjs`；`tests/contract/measure-main-agent-cost.node-test.mjs`
- **依赖**：`P3`
- **消费者**：P5 驾驶舱作者、P12 终末验收作者与每个 Phase 的主会话
- **gate_cmd**：`npx vitest run tests/contract/evidence-manifest.test.mjs`
- **oracle**：ORACLE-EVIDENCE-PHASE
- **evidence_path**：`quality/evidence/workflowhub-build-code-efficiency-verify-merge-20261026/P4-evidence-phase.json`
- **STOP**：清单与 `facts.jsonl` 现单行游标或既有 `captureCommand` 回执矛盾、七字段落点与 `runtime/stage/stage-content-contracts.mjs` 的字段名冲突、成本账本出现污染首行、或额外游标限制让既有续跑测试变红时停该处；材料是本卡、`spec.md` 的对应 AC 与真实字节；修复回 T004/T005 原实施 owner 与 build-plan 作者；不改 AC、oracle 或写集求绿。
- **覆盖 AC**：AC-ACCEPT-001、AC-ACCEPT-002、AC-EVID-001、AC-EVID-002、AC-EVID-003、AC-COST-001、AC-RESULT-001
- **Done**：按独立质量owner本次真实消息逐条回填：AC-ACCEPT-001 `pass`（026及144/148三实际AC读回）；AC-ACCEPT-002 `incomplete`（129/131真实尝试及当前缺口记录，真实stage末统一提醒/报告尚未发生，由主会话/root提供、原P4开发回核，出现真实逐条缺口报告后恢复）；AC-EVID-001 `pass`（145独立fixture/143 native三回执与两物理输出，仅受控夹具，162/163全stage真实重复执行偏差另保）；AC-EVID-002 `pass`（145受控P6→P7、单row五字段与拒history）；AC-EVID-003 `pass`（read-trace001及002指针勘误与当前核正材料表，仅本开发公开88命令/40读点，其他actor全集unknown）；AC-COST-001 `incomplete`（两真实样本不代stage记账/末Phase十环，阶段主会话提供真实单次账本及末Phase消费原件，原P4开发届时回核）；AC-RESULT-001 `pass`（两冻结JSON、151/152/154/155及新reader复算143，限相同fixed workunit五实际数可复算可比，不作因果/整体收益）。现有具名原件见下方逐AC表；尚未创建的最终质量原件不预填。

## 工作包声明（人读事实）

- **读集**：`spec.md` 的「实现设计（全局权威）」、AC-ACCEPT-001/002、AC-EVID-001/002/003、AC-COST-001、AC-RESULT-001；`skills/spec-plan/templates/phase-template.md` 契约头与 Tnnn 字段；`runtime/stage/stage-content-contracts.mjs` 第 60–135、500–660 行；`runtime/task/task-store.mjs`；`runtime/task/task-handle.mjs`；`tools/cli/measure-main-agent-cost.mjs`；`runtime/task/final-chain.mjs`；`docs/standard-workflow.md`「证据只留原始件」。
- **定序写主**：P1→P2→P3已先写 `workflows/build-code/SKILL.md`、`docs/standard-workflow.md`、`docs/architecture/move-map.json`，P4消费P3交回字节后继续写。两个模板、`workflows/build-plan/SKILL.md`、`skills/stage-reflection/SKILL.md`、`tools/cli/measure-main-agent-cost.mjs`、`runtime/task/final-chain.mjs`及本Phase新测试由P4在本任务中首写；后继P5–P12仅在各自声明写集重叠时按真实依赖后写，不能倒置为P6/P9先于P4。`runtime/task/task-store.mjs`只读复用，虽保留原申报允许路径，本Phase不改其字节；本Phase同路径唯一writer；先写者未能回读时记unknown及原因，后写者先核真实字节。
- **接口符号清单**：phase_progress 五字段；`appendRecord` 只收 quality 三目录；`captureCommand` 固定写 `quality/tests`；`measure-main-agent-cost --record` 与首笔 `--start-ref`；final-chain 的 RINGS 十环与 `run-checks --task-path`。
- **合并责任**：T004、T005 各由一名开发子代理持笔；冲突以本 Phase 审后提交为基线，失败回原实施会话重做，不沿用失败上下文。
- **progress_cursor**：只指向任务事实库 `facts.jsonl` 的 `phase_progress`，本文件不保存进度值。

## 速读卡（人读；只写本 Phase 增量）

- **本 Phase 结果**：清单、游标、成本、十环四处各只有一个权威；清单是每 Phase 唯一新增的人读证据件。
- **非目标**：不建第二账本、不建第二进度、不改历史证据、不每命令一件；不新增 runtime 公共命令、持久对象或控制面；不把清单变成可写进度权威。
- **改动前**：`phase_progress` 已有且恰五字段，只挂 build-code stage 行，原位替换；`appendRecord` 只收 quality 三个子树；成本入口有 `--record` 但代码无自动触发点，触发写在各 stage 收尾步骤文本；十环来自 final-chain 的 `RINGS`；`index.json` 在代码里不存在。
- **改动后**：每个 Phase 一份清单，列命令、cwd、退出码、失败、真实 diff 与指针；成功输出不各存一件，同字节复用；游标按既有writer原位更新，只有一条当前值；成本只在 stage 末记一次；最后 Phase 消费十环报告。
- **与相邻 Phase 的边界**：P3 交来失败换路径与 `incomplete` 分诊；本 Phase 只定 `incomplete` 的完整字段、结束提醒、清单、游标与成本；P5 读清单与真实 diff，P12 读十环与成本行做对账。
- **主要风险**：原拟在通用store增加回退与base_head拒写规则会误拒既有合法续跑。本次按真实caller澄清为直接复用单行writer，不新增store拒写规则；若实现仍破坏既有续跑或旧任务读回，停冲突路径，保原字节与失败，回原owner修，不改旧测试求绿。
- **下一步**：P5 从本 Phase 清单取节点来源与真实 diff；P12 读十环报告与成本账本行逐条对账。
- **动手前必读**：`spec.md` 的「实现设计（全局权威）」与 Appendix A 七条 AC → `runtime/task/task-store.mjs:61-104` → `runtime/task/task-handle.mjs:107-108` → `tools/cli/measure-main-agent-cost.mjs:389-390`、`:417-455` → `runtime/task/final-chain.mjs:1-4` → `docs/standard-workflow.md:45-49`。
- **未决事实**：既有post task的phase_progress是否存在回退样本未全查，覆盖限制保留。本次不新增store回退拒写规则，不凭未全查推断历史样本合法或非法；T005以既有writer/CLI合同和受控fixture核唯一当前游标，读取到的真实样本与局限如实记入清单。

## 本 Phase 材料导航（人读；只列本 Phase 实际用到的锚点）

| 材料 / 锚点 | 本 Phase 用它做什么 | 读取时机 |
| --- | --- | --- |
| `spec.md#实现设计（全局权威）` | 清单、游标、成本的全局口径 | 写卡前 |
| `spec.md#Appendix A — 验收判据（唯一权威）` | 七条 AC 的判定方式、证据与失败条件 | 写卡前 |
| `runtime/task/task-store.mjs:61-104` | 五字段、原位替换、写入校验的当前字节 | 设计游标规则前 |
| `runtime/task/task-handle.mjs:107-108` | appendRecord 三目录与 captureCommand 落点 | 设计清单写入前 |
| `tools/cli/measure-main-agent-cost.mjs:389-455` | `--record`、首笔 `--start-ref`、账本行 | 设计成本规则前 |
| `runtime/task/final-chain.mjs:1-3` | 十环与状态词表 | 设计十环消费前 |

本次实际读取补充（开发事实，不是独立裁决）：公开源与逐点对账见 `quality/evidence/p4-read-trace/2026-10-26-001-developer-public-read-trace-and-reconciliation.json`，SHA256 `bc6ce44d75c0a31d0d5568a1e456035a56dc497309c382b44ec9acf86974f775`；其cleanup元数据指针由002勘误件核正。父公开started事件ordinal3679/line3680明确映射本开发 `/root/p4_execution` → child `01a17a65-73f6-7cd1-8897-a1ace147e2dc`，child meta同id/parent/path。只取本开发公开工具输入/输出ref/hash、路径和范围，不复制analysis或整session；其它actor完整读集未取得，不代签。实际顺序是13–32方法/专业源，37先候选投影再current/history query、god与affected，49先四完整ID explain再首读实现源。首22候选未排序不能当相关排序；query/affected及部分合并输出真实裁剪，图旧坐标由当前源核正，不冒完整覆盖。未执行图更新、收费抽取或整仓源码正文扫描。

- 当前需求：`decision-log.md` 的 U-011/U-014/U-017/U-022 索引与原文边界；`spec.md` 的 EVID/COST/AC-ACCEPT-001/002、AC-EVID-001/002/003、AC-COST-001、AC-RESULT-001；本卡及纯 index。
- 方法与专业：当前 `AGENTS.md`、`workflows/build-code/SKILL.md`、`workflows/build-plan/SKILL.md`、`skills/project-norm-init/SKILL.md#非UI规范与索引`、`skills/knowledge-graph/SKILL.md` 与 `references/knowledge-reuse.md`、`skills/simplicity-guard/SKILL.md#Packet lens contract`、`skills/spec-specify/SKILL.md#技能写作规范（WR001）`；后端 architecture、接口 contract、验收 acceptance/evidence 的现内容；`CONSTITUTION.md`、`constitution-checklist.md`、`skills/norm-sync/SKILL.md` 与 `references/routes.md`。部分早期合并输出截断，适用关键节随后有界回读；不称整份文件均逐字读完。
- T004 真实编辑源：两个模板与 build-plan 方法；前三件 before 原件在 `quality/evidence/p4-before-edit/2026-10-26-001-spec-template.md`、002-phase-template、003-build-plan。原37/48/7标题顺序与字节保留。
- T005 源码接缝：`runtime/task/task-store.mjs` 的五字段/原位覆盖、`runtime/task/task-handle.mjs` 的 openTask/appendRecord/captureCommand、`runtime/interface/run-command.mjs` 的 resolveOutputRef结算、`tools/cli/stage-runtime.mjs` 的 writeBuildCodePhaseProgressCursor/保base策略；`tools/cli/measure-main-agent-cost.mjs` 的 measureSessions/fresh出生证明/CLI/record/human；`runtime/task/final-chain.mjs` 的 RINGS，final-chain-runner只读入口与run-checks输出入口。后两者及store/handle/run-command不改。
- 真实相邻合同：`tests/integration/minimal-task-storage.test.mjs:38-43` 同Phase合法覆盖；`tests/contract/measure-main-agent-cost.node-test.mjs` 的旧130/217及fresh-child/copy合同；`tests/integration/main-agent-cost-closeout.node-test.mjs` 的隔离task/CLI参数与账本夹具；`tests/fixtures/main-agent-cost/dsh-v4.jsonl` 的真实选摘user seq9。历史仅回源 `specs/archive/workflowhub-review-efficiency-20261007/decision-log.md:471-484`，补强单游标与Phase起点，未改历史。
- 原宽声明核正：本节旧稿把TCR022/023/024与P3绑定029并列写为实读，范围过宽。该旧稿原字节保在p4-before-edit的read-trace-correction前件；当时022/023/024主要由原独立actor直接消息交付ref/hash/结论，029仅上游指针，不是本开发开原文件读全文。直接读到的是P3 final-confirmation001、P3清单003的keys投影、独立032局部，以及后来TCR030全文；逐点见读trace。上游结论不冒P4独立质量。
- 原表漏列核正：`runtime/task/load-config.mjs` 前32行、`runtime/evidence/storage-root.mjs` 前21行及环境关键词，`runtime/task/material-workspace.mjs` 仅导航搜索，`tests/integration/main-agent-cost-closeout.node-test.mjs` 25–45行实际夹具，均为本P4隔离成本/原caller研究；不是整仓正文扫描。先前MEMORY.md只作关键词导航，不作当前项目事实。
- 后续独立原件范围：026测试/034修复局部与035指针勘误、033正式OCR、145规范同步各按其actor/范围消费，未逐一审计其它actor native全读集。开发只读这些报告的具名字段或有界投影，不冒其它actor整包全读。

## L0 — 结果与变更

本 Phase 把「每个 Phase 的证据」从散落输出收敛成一份清单，并把续跑与成本各收敛到一个权威：一个游标、一次记录。它接在 P3 的自动恢复之后：恢复可以换路径，但换路径不能换来第二份账本或第二个进度。

- **结果**：每个 Phase 一份执行清单与一份验收记录；命令、cwd、退出码、失败、真实 diff、指针都在清单里；失败/差异/外部返回体留原始字节；游标只前进、不存历史；成本整个 stage 只记一次；最后 Phase 消费十环报告。
- **非目标**：不新建游标，不改清单以外的历史证据，不把十环报告做成第二份进度或第二份对账，不新增检查器。
- **与其它 Phase 的区别**：P3 定失败后怎么走；本 Phase 定走完后留什么、留几份、谁消费；P12 才逐 AC 对账。

## L1 — 可执行契约

### 文件边界

- **新增**：`tests/contract/acceptance-plan.test.mjs`；`tests/contract/evidence-manifest.test.mjs`；`tests/contract/measure-main-agent-cost.node-test.mjs`（既有文件，属修改不属新增，用 node --test 运行）。三个文件都先写并跑一次目标失败，再改方法与实现。
- **修改**：`skills/spec-specify/templates/spec-template.md`；`skills/spec-plan/templates/phase-template.md`；`workflows/build-code/SKILL.md`；`workflows/build-plan/SKILL.md`；`docs/standard-workflow.md`；`skills/stage-reflection/SKILL.md`；`tools/cli/measure-main-agent-cost.mjs`；`docs/architecture/move-map.json`。
- **只读核对**：`runtime/task/task-store.mjs`保留既有五字段校验、build-code限定、单行原位替换及省略游标时保留原值，不加本Phase的回退或同Phase base_head拒写；`tools/cli/stage-runtime.mjs`同Phase自动保base_head的既有策略只读不改。`runtime/task/final-chain.mjs`在写入集内但本Phase不改字节；实读 `RINGS` 与 `run-checks --task-path` 输出，把消费规则写进方法正文，证据里记 unchanged，不为凑写集制造改动。
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

清单与 facts 或既有回执矛盾、模板节名冲突、额外游标限制让既有续跑测试变红、成本账本已有污染首行、move-map 校验失败时，停止该路径并保留原始失败与当前字节；修复回 T004/T005 原实施 owner、build-plan 作者或原运行时 owner；不改 AC、oracle、写集或测试断言求绿，其余安全工作继续。

### 完成

两门 GREEN 各留真实 RED/GREEN 原件、反例与读回；七条承接 AC 各有一个档位和一条具名证据指针；`evidence_path` 的清单写明 commands、cursor_ref、cost 与 final_chain_ref；独立审查核对写集、模板落点与清单没有变成第二账本或第二进度。结论只到「格式与受控行为」这一强度。

### 风险与回滚

- **风险**：把CLI的同Phase基线策略下推成通用store限制，误拒合法原位更新；或清单被当成可写进度、被复制成第二份。
- **影响**：续跑被误拒，或事实出现两个权威，后续 Phase 与 P12 对不上。
- **缓解**：复用既有writer的五字段/类型校验与单行替换，同Phase合法原位更新及base_head覆盖保持，CLI自己的同Phase base保留策略不变；清单只存指针不存可写值。
- **回滚**：按 Phase 审后提交点整卡回退；保留原失败与历史证据，不回退他人字节。
- **触发条件**：既有续跑测试出现非预期失败，或审查发现第二个进度来源。

### 交接知识（给下游 Phase 与审查的已核实事实）

- `phase_progress` 恰五字段且只挂 build-code；原位替换，不存历史序列；`index.json` 在代码里不存在，不是本 Phase 依赖。
- **本次游标策略澄清**：原计划owner按主会话确认修正超出spec/AC的store额外拒写策略。依据 `spec.md` 的FR-EVID-002/AC-EVID-002只要求当前唯一游标、无历史序列/第二权威且不阻续跑；冲突原件 `quality/evidence/p4-contract/2026-10-26-001-cursor-base-head-conflict.md` 保留。`tests/integration/minimal-task-storage.test.mjs:38–43` 合法同P9/T023→T024可覆盖base_head，`tools/cli/stage-runtime.mjs:1070–1080` 自行保同Phase基线；二者是不同入口合同，不加task特例。采用simplicity-guard的已有能力直接复用路径：不改runtime、旧测试、五字段、spec或AC，不降低唯一当前游标的判定；新evidence-manifest尚未写、无冻结RED调整，后续由实施者按同一原AC取真实RED/GREEN，未执行不冒通过。影响仅撤销额外拒写实现策略，原失败保留，清单仍只引用现有writer原件。
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
- **文件 / 符号**：`workflows/build-code/SKILL.md`（符号：「方法」第 5、10、12 步与「阶段收口中的成本」段）；`docs/standard-workflow.md`（符号：「证据只留原始件」新增「每 Phase 一份执行清单」小节、「stage 结束」）；`skills/stage-reflection/SKILL.md`（符号：「方法」第 3、5 步）；`runtime/task/task-store.mjs`（只读复用：validateCursor、writeStageRow，不改运行时）；`tools/cli/measure-main-agent-cost.mjs`（符号：human、recordMeasurement）；`docs/architecture/move-map.json`（符号：task-store、measure-main-agent-cost、final-chain 三条目的 module_consumers）；`tests/contract/evidence-manifest.test.mjs`（符号：ORACLE-EVIDENCE-PHASE 主测试）；`tests/contract/measure-main-agent-cost.node-test.mjs`（符号：ORACLE-EVIDENCE-PHASE 成本一次测试）。
- **动作**：① 在 `docs/standard-workflow.md`「证据只留原始件」加「每 Phase 一份执行清单」：判定唯一清单字段为 `phase_id`、`task_ids`、`cursor_ref`、`commands`、`failures`、`diffs`、`evidence_refs`、`materials`、`reviews`、`acceptance`、`cost`、`final_chain_ref`；命令行记 argv、cwd、`exit_code`、起止与时长；失败行记 `failure_signature` 与原件 ref；diff 行记 `git diff --name-only` 与 `--numstat` 的实际路径、统计与原件 ref；清单每 Phase 一份，Phase 收口原子写、审后冻结，后续不改历史清单。② 写明原件与复用：同一命令再跑且内容比较成立同字节时，用既有 `resolveOutputRef` 指回首次原件，不新增物理副本；字节不同或候选不可读时保留新件并记 `deduplication: unknown`；失败、差异、外部返回体、范围证据与一次性环境读数保留原始字节；成功且无字节需要的输出不进清单证据指针。清单只投影 facts、回执与 quality 原件，不建第二账本。③ 直接复用task-store既有writer：五字段与只挂build-code不变，显式合法游标原位覆盖、省略游标时保留原值，facts仅一条当前游标且不存历史序列；本Phase不新增按Phase先后或同Phase base_head变化拒写的store规则。真实CLI只接受phase_id/task_id并自动保留同Phase base_head的策略维持原样；清单只存cursor_ref，不复制可写进度值。④ 在 build-code 第 5 步指向该小节并写「本 Phase 只多一份清单」；第 12 步成本段固定为整个 stage 末一次 `measure-main-agent-cost --record`，首笔带 `--start-ref`，不每 Phase 触发；理由：计量窗口是 stage 级，Phase 收口时看不到完整墙钟与等待，每 Phase 记会重复切碎同一窗口，且首笔要真实开工事件；收口前按 T004 的格式统一提醒 `incomplete`。⑤ 在 measure 入口打印结果层五数的实际值与账本行号（墙钟、输入/输出 token、steps、子代理调用），失败项保留 `unavailable:<reason>`；不新增字段、账本或命令。⑥ 十环消费：最后 Phase 跑 `node tools/cli/run-checks.mjs --task-path <任务根>`，把 stdout 存成一份原件，并在对账里引用；环 1–9 取真实状态，环 10 在 build-code 记 `skipped`、stage-close 后由调用方补终态；不改 final-chain 代码。⑦ 材料清单：Phase 卡的「本 Phase 材料导航」只列实际打开的锚点与审查原件，独立审查用 `git diff --name-only` 与实际读取记录核对没有多读整仓，缺材料写缺与用途。⑧ move-map 只给三条目加新测试 consumer，不新增条目、不改 owner 与 delete_condition。⑨ 先写两个具名测试：临时 git worktree 加 post task 夹具，三条命令（成功、同字节重复、exit 7 失败）、P6→P7 游标与一笔成本行，断言一份清单、失败原件保留、重复复用、facts 单游标、账本单行、十环报告可消费。
- **输入**：T004 的七字段与 `incomplete` 格式；`facts.jsonl` 现有 `phase_progress` 五字段；`runtime/task/task-handle.mjs` 的 `appendRecord` 三目录与 `captureCommand` 落点；`tools/cli/measure-main-agent-cost.mjs` 的 `--record`、`--start-ref` 与 27 列账本；`runtime/task/final-chain.mjs` 的 RINGS 与 `run-checks --task-path`；`index.json` 在代码里不存在，不作依赖。
- **输出 / 失败**：正例是清单一份、facts 一条当前游标、账本一行、十环报告一份，两个具名测试 0。失败信号：出现第二份清单、历史序列、第二条进度、同 stage 第二行成本或重复成功输出各存一件 → 非零；历史序列数组、缺字段或字段类型非法的游标 → 既有writer拒绝且原字节不变；合法同Phase游标覆盖仍成功且只有当前一条；字节不同却冒充复用 → 记 `deduplication: unknown` 并保留新件。
- **边界 / 禁止改动**：不建第二账本或第二进度；不改历史证据与旧账行；不改 `runtime/interface/run-command.mjs`、`runtime/task/task-handle.mjs` 的既有语义；不新增 runtime 公共命令、持久对象或控制面；不动 `docs/adr/**`、`specs/archive/**`；不把清单写成可被续跑读取的进度权威。
- **依赖**：T004；本卡消费其七字段与 `incomplete` 格式，在其写完后开始，避免同一路径先后两个 writer。
- **测试层级 / 技能**：证据与游标行为、工具与枚举一致性；主技能 backend-testing；不涉及 UI 与外部 provider。
- **场景 / 夹具或服务**：夹具=临时 git worktree、post task、三条命令（成功、同字节重复成功、exit 7）、P6→P7 游标、一笔成本行；正例逐项断言；负例=游标含历史序列数组或非法五字段形状、第二份清单、同stage第二行，各自非零或被拒；正例另核既有同Phase合法原位覆盖及CLI同Phase base保留，不能把它们错当负例。搭建与清理都在 tmp，`finally` 删。
- **RED/GREEN 门禁命令**：`npx vitest run tests/contract/evidence-manifest.test.mjs`。
- **预期退出码**：RED nonzero；GREEN 0。
- **RED 目标失败**：ORACLE-EVIDENCE-PHASE 的断言「一个 Phase 恰一份清单、重复成功输出复用同一原 ref、失败输出保留、facts 只有一条当前游标、stage 账本只有一行、十环报告可被最后 Phase 消费」在方法与fixture未落地前失败；历史序列或非法游标形状、第二份清单、第二行成本三个负例必须非零或被拒，合法同Phase覆盖保持成功。
- **RED 证据**：unavailable — build-plan 不实施，由 build-code 补真实 RED。
- **GREEN 判定器**：ORACLE-EVIDENCE-PHASE；同一命令退出 0，正例逐项命中，负例各自被拒；十环报告由真实 `run-checks --task-path` 输出且环 10 为 `skipped`；历史序列数组或非法五字段形状必须由既有writer给出TypeError且不改原字节；合法同Phase原位更新、只留当前一条和CLI保base策略均保持。
- **证据**：RED/GREEN 原始输出、清单、facts、账本与十环报告原件存 `quality/evidence/workflowhub-build-code-efficiency-verify-merge-20261026/P4-evidence-phase.json` 所引路径；本文件不填执行状态。
- **停止 / 恢复**：本Phase游标fixture或方法与既有store/CLI续跑合同冲突、成本账本已有污染首行、move-map 校验失败或十环报告不可读时停该处；回 P4 实施 owner 与原 owner 核真实字节；不改测试、判据或写集求绿。
- **覆盖上限**：不证明真实长任务成本降低或零复发；不证明每个 Phase 实际照做；不证明外部 provider 可用；不证明 P12 会按本卡消费（P12 自证）。
- **完成**：RED/GREEN 原件、三个负例、清单/facts/账本/十环读回与独立审查齐备；AC-EVID-001/002/003、AC-COST-001、AC-RESULT-001 按原判据各写档位与证据指针；成本五数给真实数字，不以百分比或估计代替。

#### 附加条款（T005） 的冻结比较基线与复算

P4/T005 是 AC-COST-001、AC-RESULT-001 的 producer；P12 仅消费。T005 先用既有 measureSessions 对同一受控工作单元的原规则运行原件产出 `quality/evidence/workflowhub-build-code-efficiency-verify-merge-20261026/P4-cost-baseline.json`，留源 session 绝对 ref、sha256、窗口起止、输入工作单元、工具版本/HEAD、墙钟/输入token/输出token/steps/子代理调用五数及缺失原因；基线经独立读回后冻结字节。再用同一单元的新规则运行产出 `P4-cost-current.json`（同一目录），条件差异逐项披露；不把历史 T02 长任务拿来冒同条件实验。两次原件均由原 measure 入口得数，验证者复跑只读命令，不重复 --record。命令 `node --test tests/contract/measure-main-agent-cost.node-test.mjs` 期望 0，测试以两个独立加载的不可变会话输入调用 measureSessions 并核与原始事件一致；基线缺失、窗口不可比或任一数字 unavailable 时该 AC 保未完成，不能估计补齐。把输入/输出token分开计为五数，不增指标。真实 stage 末一次 --record 与受控比较的只读复算分开，后者不追加账本。

#### 附加条款（T005） 的复算命令绑定

两次运行各在清单已有 commands 行保存可直接重放的完整 argv：`node tools/cli/measure-main-agent-cost.mjs --session=<该运行真实session绝对路径> --from=<该运行真实ISO起点> --until=<该运行真实ISO终点>`，上述三个值由 T005 执行时从真实会话取得并替换后保存，不把尖括号命令当执行记录；未取得则 unavailable。验证者按该真实 argv 只读复算，对照两个冻结JSON的五数与源sha256；任一差异逐项暴露，不通过重选窗口换绿。本卡原编写时没有运行的事实保留为历史；当前两次真实只读argv及原窗口已在 P4-cost-baseline.json / P4-cost-current.json 冻结，151/152与154/155原回执输出相同复用。后继修复复算只追加真实新回执，不改两JSON、窗口或重跑worker。

### 本 Phase 冻结测试处置核正

当前实读受保护路径：`tests/contract/measure-main-agent-cost.node-test.mjs`。此逐路径清单补齐前文按数量的简述；各文件的原 ORACLE 与负例强度保持。路径/名称常量按卡中具名范围处理，任何断言表达式、判定或评分变化先在本卡 TCR 字段写旧/新断言、原因与旧失败ref，并取得独立审查原件；未取得只停该断言改动，不改保护标记求绿。本轮不修改测试；实施者不能凭本清单自行放宽 AC。

### T004 当前任务三条实际 AC 抽查输入

下列是本任务既有 AC 的证据计划，不改 spec Appendix A 的成功/失败条件。提供者是本次真实角色，取得时点区分本 Phase 与真实 stage 末；独立测试者据原件判断，不凭本表自签通过。

#### AC-ACCEPT-001
证据计划：判什么=本任务三条承接AC七字段齐全且提供者真实；怎么判=独立测试者读本节三样本并重放ORACLE-ACCEPT-PLAN；证据从哪来=quality/tests/2026-10-26-129-p4-t004-acceptance-plan-red.output与131-p4-t004-acceptance-plan-green.output及本节原文；谁提供=P4开发/root/p4_execution提供模板与样本，独立/root/p4_independent_test读回；何时能拿到=本P4开发完成且独立测试明确回报后；成本类别=命令级与只读材料抽查；拿不到怎么办=保未达成并由P4开发补字段或真实原ref，不改AC

#### AC-ACCEPT-002
证据计划：判什么=真实incomplete带尝试与恢复且stage末提醒和报告逐条列缺口；怎么判=独立测试者核下行真实尝试并在真实stage末由原P4开发回核统一提醒与报告；证据从哪来=quality/tests/2026-10-26-129-p4-t004-acceptance-plan-red.output及最终真实build-code报告，后者当前未产生；谁提供=P4开发/root/p4_execution提供格式和初判，主会话/root在stage末提供真实报告，原P4开发回核并由独立/root/p4_independent_test核原片段；何时能拿到=尝试原件当前可读，结束提醒与报告仅真实stage结束时；成本类别=命令级加stage末只读核对；拿不到怎么办=当前incomplete，保结束提醒与报告缺口及原P4 owner回核，不把P12当首次判定
incomplete：AC-ACCEPT-002；试过=npx vitest run tests/contract/acceptance-plan.test.mjs -t ORACLE-ACCEPT-PLAN 原 ref quality/tests/2026-10-26-129-p4-t004-acceptance-plan-red.output，目标缺字段后修复见131原件；卡在=真实build-code尚未结束，统一提醒和最终报告未产生；谁提供=主会话/root提供真实stage末报告，原P4开发/root/p4_execution回核；恢复条件=真实stage结束出现统一提醒与逐条缺口报告，独立/root/p4_independent_test核原片段

#### AC-EVID-002
证据计划：判什么=facts只有一条当前phase_progress且无历史序列；怎么判=独立测试者重放evidence-manifest具名fixture的两个Phase并读facts；证据从哪来=本Phase后续唯一清单的cursor_ref与具名测试原件，当前测试未实施；谁提供=P4开发/root/p4_execution提供复用既有task-store的fixture（不改store），独立/root/p4_independent_test执行读回；何时能拿到=T005开发完成并独立测试回报时；成本类别=临时post task命令级；拿不到怎么办=保未取得与原P4开发修复owner，不另建游标或改判据

### T005 测试变更请求（待独立审查，不授权改断言）

- **范围**：仅 `tests/contract/measure-main-agent-cost.node-test.mjs` 的 Codex 调用计数与 fresh child 出生证明；既有 token 累计差分、DSH 与缺报反例保持。
- **旧行为原件**：`quality/tests/2026-10-26-132-p4-t005-frozen-old-counts-both-cases.output` 与同名 `.json`；真实命令 `node --test --test-name-pattern "WINDOW Codex cumulative same-thread delta|COUNTS mixed" tests/contract/measure-main-agent-cost.node-test.mjs` 退出 0，两case通过，只证明旧断言当前成立，不称新行为 RED。早次130仅命中mixed一case，保历史，不冒两case覆盖。新断言 RED 在独立批准后执行并留原件。
- **旧断言→新断言**：原第130行三个 counts 都为 `missing:unsupported_in_this_task` → toolCalls/commandCalls 仍原断言，subagentCalls 原最小选摘夹具含ordinal缺口改为 unavailable:incomplete_count_source；完整真实 response_item 记录、可验证 call_id 时按 collaboration 的 spawn_agent/followup_task 去重计数；无调用的完整已证明本会话窗口为0，缺ID、冲突同call_id或来源缺失为 unavailable。原第217行 mixed family 标题与 toolCalls 不可得断言保留，commandCalls 仍 unsupported，不把 DSH 子集当混合完整值；只新增分离的 subagentCalls 混合计数断言。send_message 不算子代理调用；namespace错误不认 collaboration；followup_task 不冒 turns；steps 仍 codexResponseItems，dshSteps 不变。
- **新反例**：同call_id同体重复只计一次、不同体冲突 unavailable、缺call_id unavailable、错误namespace不计、send_message不计、完整零调用与缺源不同、分页/继承边界不明保不可得。
- **真实兼容缺口**：`codexFreshChildBirth` 当前硬限 `0.163.0-alpha.10.2`，P3真child `01a17989-d95f-71e2-b22f-7ef1e9e1b2c9` 为 `0.164.0-alpha.11.1`；真实绑定原件 `quality/evidence/p3-agent-replay/2026-10-26-029-four-native-final-bindings.json` 首 binding。`codexFreshRootBirth` 第246行的+1ms例外限原版本（不影响同tick通路），child保原版本覆盖，新增该已观察版本同证明条件正例；当前root实证task_started与header同tick，走原同tick通路无需改版本guard，保原+1ms例外及未知版本拒绝；未知版本、parent不匹配、缺started/call/birth或fork_turns不为none的负例仍拒绝，不能改header或把首usage冒出生零值。正式复算必须用真实父/子事件与只读计量入口。
- **受控比较**：两次 fresh none 同工作单元、同计量实现，旧/新分别指方法规则；先baseline运行、原生session与完整argv/窗口/hash/五数落原件并由独立reader复算冻结，再跑current；缺任一真实数保 AC 未达成，不估补。不提前 --record。
- **精确断言预览**：`quality/evidence/p4-tcr/2026-10-26-002-frozen-cost-assertion-proposal-corrected.md`，SHA256 `464ed10b33f6a17cb55f166bdb5cf09610d665160056a9af2fd2830d2cd0b906`；未应用，完整旧/新表达式和新case供独立审查。
- **审后Desktop漏计TCR**：Standards原文 `quality/evidence/2026-10-26-135-p4-standards-supplement-original.md` 指出现行COST202完整一spawn却available0；真实旧行为 `quality/tests/2026-10-26-158-p4-desktop-spawn-old-undercount-behavior.output` SHA256 `53280dd8df8559d26d9bdd729c1f000d0098c7fc2faf92ba56946c8702a8ca9d`。旧断言没有覆盖Desktop计数，本次不删除或替换旧断言；新增逐表达式见 `quality/evidence/p4-tcr/2026-10-26-007-desktop-attempt-count-exact-assertions-corrected.md` SHA256 `85f470c2eb840e311595a5a5816c6d802a67c50f1e4e168baf7e57c9433eb84b`：root1/child0/total1、同ID去重和冲突不可得、双brief两ID计2、失败无child但稳定尝试ID计1/缺ID不可得、缺链/错sender/turn/未知表达式不可得、按started_at原窗口计数、modern/Desktop共存与同ID工具冲突不可合并。原出生成功证明不放宽、stage ledger不改。独立原件 `quality/reviews/2026-10-26-030-p4-desktop-count-tcr-independent-review.json` SHA256 `cd87185d1b142c4534023ed06462c07ed166c61cc48462ab5c2cb4a9da7e0c54` 已仅批准007具体表达式；修改前先留目标RED，原共同packet134/审查旧字节不改。修后原两组固定argv/窗口只读复算，冻结JSON/worker/窗口不变。
- **私有出生证明context TCR**：003设计与005精确CLI表达式由 `quality/reviews/2026-10-26-024-p4-proof-context-tcr-review.json`，SHA256 `dee5304534d141952b6e5b47faa049874bfceedb22767f14ec2ce567ba8eed9d` 独立窄审；139真实RED，140同命令GREEN，仅证明受控fixture与原CLI语义，不代真实old/new比较。
- **精确reason核正**：136真实失败为27pass/1fail，既有metricSum汇总reason为incomplete_sources，故仅将新增精确reason断言从totals定位到sessions[0]，保totals unavailable。独立原件 `quality/reviews/2026-10-26-023-p4-t005-reason-target-tcr-independent-review.json` SHA256 `9d3129e4d59bab5d294c1ad4662b21b6b387b78b8fb785ec340f8ee9ff3b5ccc` 批准；不改生产聚合语义求绿。
- **独立审查引用**：`quality/reviews/2026-10-26-022-p4-t005-frozen-cost-tcr-independent-review.json`，SHA256 `89d0159723d74412963470ec9c7df3511374e93513cdfdba06fd8ab6c894571c`；仅批准preview002具体表达式，不证明实施质量、成本AC或未见的私有context方案。

### 当前执行事实与待回核（未作开发最终确认）

- T004：129真实目标RED（模板缺七字段）→131结构GREEN；新增三条实际AC样本133暴露提供者缺项，补真实独立提供者后134三case通过。前后原件均保，不把旧GREEN冒新case执行。
- T005：138真实目标RED（方法缺清单字段，native集成case已通过）→141两caseGREEN；补native receipt不悬空/非法history/isolated账本重复首ref反例后143两case通过。135计数/0.164真实RED；136实际27pass/1fail为reason对象层错误，经TCR023独审核正后137二十八case通过。139 proof-context真实RED→140原命令通过。
- 独立测试：`quality/reviews/2026-10-26-026-p4-independent-tests-oracle-v2.json` SHA256 `d5801ad24a741100eaf0f9eea24c84a3a06d0359c37131ea79714d55f754c71d`；144 acceptance 3、145 evidence 2、146成本196、147相邻closeout34、148字面-t gate3均退出0且无截断。测试边界含真实native三回执ref、物理输出两件、失败7、单游标及孤立task账本单行；不把fixture绿当真实stage或成本效果。
- 收口步骤事实：149 `check-stage-steps` 真实退出0但 `complete=false`，12步未留痕/义务unknown，WP1–WP7清单与choice/research/ring9等真实缺口沿026原文保留。exit0不冒步骤齐。
- 历史采样时核心冻结：measure `10f4be04f849c627e0f5bb8e6cb55f86d2e4ed48b084fc9ea10e7ab363faa97c`（保原观测，不冒当前SHA）；当前方法真实单文件原件 `quality/evidence/p4-benchmark-methods/2026-10-26-001-current-build-code-frozen-original.md` SHA256 `77302ad47e1529b06cf41de531586397d49a300504eab52a46d39711e14771b5`。store、handle、run-command、final-chain保持原字节；不以改store或旧测试消除原冲突。
- 当前真实成本：P4-cost-baseline.json SHA `95105e2240c9b0ad57813af03fc34ccd6458ab6706e8640b3129c8b2d39d2758`、P4-cost-current.json SHA `c28ed526d4044c15aa6b5236dab7a93a75a7c2da643bceebe63460e624b8780b` 已冻结并各自原argv独立复算；按ms/input/output/codexResponseItems/subagentCalls为61212/501235/2898/24/0与53917/367049/2896/22/0。读法/brief长短、current批读截断、fixture部分步骤存在真实差异，不作因果或整体收益结论。143夹具通过只限该fixture，真实曾生成的162/163重复原件等执行偏差保留不删、不扩大为全stage同字节复用完成。
- 未到时点：真实stage末成本未record、统一结束提醒及最终报告未产生、末Phase十环未消费；AC-ACCEPT-002/AC-COST-001当前保incomplete，由原P4开发在各真实时点回核，P12只复核不接首次判断。AC-RESULT-001待独立质量owner判断两次已冻结真实原件的可比性与充分性；其余AC等待独立review按原判据裁决，开发不自签pass。
- 当前正式审查：033-build-code-phase-p4.json SHA `a7c410faf396b163571dbdd78af09f837d0e386bac2af4a08a3815fd32c92b90` 是已发生的旧字节OCR，两provider completed、parse_outcome=ok；Codex同Desktop major、Kimi0。Codex read0/undetermined25，Kimi11/14，read_confirmed null 保原。Standards135同根因处置单列；Spec136有限0不冒整包通过。
- 当前修复：measure SHA `e39697a10c44ddd4cd8892f2f8695ed6d321f38628c2ed02a5636782b14d9d36`；159目标RED→160定向43pass→161单文件210pass。独立034-p4-desktop-fix-independent-check.json SHA `b5bb911e7a2c5ad8ce93c22b4913bd4cd1879ef82b42513007dafcd956c10e35` 的164/165为43+4pass，在声明fixture范围核Desktop finding fixed；035-p4-check-tcr-pointer-correction.json SHA `f68920ddf4eb796a798a51df61fa04064b2a533af00187ffe83b5d849788cec6` 只核正034中030路径，不改原件。两组固定样本在新工具下的复算由原designer另留事实，不覆盖冻结JSON。
- 当前保全/清理与规范：144-p4-benchmark-preservation-cleanup-map.json SHA `03f8b2a0c5fd7287609d08114f4e48d8c92a7129fe6047524c97278cce233483` 保存逐件永久原件映射，原tmp refs只作历史；166-p4-owned-benchmark-temp-cleanup.json 实际exit0，tmp已清，不再访问冒活。145-p4-norm-sync-no-extra-delta-readback.json SHA `020e5fb894b020b8a15eea35640b010935ef0003b2d22513420e616326145f38` 是原规范owner在本Phase的无额外delta读回，保其16源/范围，不冒开发代验。
- 尚未执行：Git、真实stage --record、真实最终十环消费与最终开发确认。独立质量owner尚在按七条原AC核当前材料；本节只记原事实，不自签AC/Done。

### 独立逐 AC 判定回填（当前已收到真实结论）

来源：独立质量owner `/root/p4_standards` 在本实施会话及主会话的当前真实最终判法消息；本段回填该结论，不由开发另签。最终持久质量原件尚未创建，因此本段和清单只引用已存在的原件。原AC成功/失败条件不变。

| AC | 结论与覆盖 | 具名既有证据 | 缺口／恢复 owner与条件 |
| --- | --- | --- | --- |
| AC-ACCEPT-001 | pass；模板与三条真实AC七字段、具名provider/时点 | `quality/reviews/2026-10-26-026-p4-independent-tests-oracle-v2.json`；`quality/tests/2026-10-26-144-p4-independent-acceptance.json`；148字面gate | 不证明真实provider以后一定按时交付 |
| AC-ACCEPT-002 | incomplete；当前格式和真实尝试可回读，真实stage末尚未发生 | 129/131原回执与本卡真实incomplete行；026局限 | 主会话/root在真实stage末提供统一提醒与逐条缺口报告，原P4开发回核，独立owner核原片段后恢复；不把带缺口报告写完成 |
| AC-EVID-001 | pass；仅原AC受控fixture | `quality/tests/2026-10-26-145-p4-independent-evidence.json`；143 fixture native readback | `quality/evidence/2026-10-26-143-p4-fixed-reader-original-window-replay.json` 明载162/163漏用resolver产生同字节重复件，原回执已引用，保留不删；不能扩成全stage每次已去重 |
| AC-EVID-002 | pass；受控单row与五字段 | 145独立fixture的P6→P7及非法history拒写；026 | 不把游标当完成权威；store原有合法覆盖未改 |
| AC-EVID-003 | pass；本开发bounded公开88命令/40读点与校正卡 | `quality/evidence/p4-read-trace/2026-10-26-001-developer-public-read-trace-and-reconciliation.json` 及002指针勘误 | 其他actor全集unknown；保截断、旧图坐标、首22未排序、上游ref不冒直接原文读取；不扩大原样本 |
| AC-COST-001 | incomplete；方法与fixture可核，真实stage记账/最终十环未发生 | 两冻结cost JSON只证明样本；本卡当前缺口；026/034局限 | 阶段主会话在真实stage末一次原入口record并读回账本；末Phase作者提供真实十环消费；原P4开发届时回核。ledger/final-chain当前均null，不能预造ref |
| AC-RESULT-001 | pass；同一fixed workunit真实五数可复算、可比 | P4-cost-baseline.json / P4-cost-current.json；151/152与154/155；新reader原窗口复算143 | 单对样本、不同读法/brief长短、current批读截断及fixture细节；不作因果、全任务或委派收益结论 |

新reader复算143（SHA `e7436271f8f40e8f0adf814305bf884c02fa3dd82ebf37b546b30e7a4b739a60`）实际用e396工具和原argv/窗口得到两组五数不变，并核原prefix；不覆盖两冻结JSON、不换worker/窗口。162/163原生输出虽然同字节重复，但已有immutable receipt引用，按事实保留。144永久保全映射及166真实清理已完成；后续reader沿映射永久源，不访问删除的tmp。145规范读回无新增专业delta；当前只有最终manifest待本次原子创建，最终质量reader随后局部回读，开发最终确认仍等待其真实保存原件。

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
