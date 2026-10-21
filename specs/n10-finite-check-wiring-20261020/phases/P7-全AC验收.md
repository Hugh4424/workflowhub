# Phase P7 — 全 AC 验收

读者：本 Phase 实施者、verify-code 终末复核者、独立审查者与用户。
读完要能：找到 36 条 AC 各自的判定方式（30 条机器可重放 + 6 条人工读回）、写作时点档位与证据指针，N9 已合入、待复验的 `incomplete` 路径，以及本卡能证明什么、不能证明什么。

P0 在场（材料选节状态，不是执行进度）：

| 必留内容（P0） | 本卡落点 | 状态 |
| --- | --- | --- |
| 独立结果与对应 FR/AC | 契约头「覆盖 AC」与 T033/T034 的「来源 / FR / AC」 | written |
| 已交付输入/本卡增量 | T033「输入」「动作」、T034「输入」「动作」 | written |
| 实施合同与写入边界 | 契约头「Write set」与 L1「文件边界」 | written |
| 目标命令/oracle/原件位置 | 契约头 gate_cmd／oracle／evidence_path | written |
| 停止/回滚/完成条件 | L1「停止」「完成」「风险与回滚」 | written |

## Phase 契约头

- **Global spec**：`spec.md#Appendix A — 验收判据（唯一权威）`
- **Write set**：`tests/acceptance/n10-finite-check-acceptance.test.mjs`；`docs/research/n10-finite-check-acceptance-runbook.md`
- **Dependency**：P1, P2, P3, P4, P5, P6
- **Consumer**：用户、verify-code、后续维护者、P8
- **gate_cmd**：`npx vitest run tests/acceptance/n10-finite-check-acceptance.test.mjs`
- **oracle**：ORACLE-N10-FINAL-ACCEPTANCE
- **evidence_path**：`quality/evidence/n10-finite-check-wiring-20261020/P7-final-acceptance.json`
- **STOP**：P1–P6 任一 Phase 的 Done、写入集落地或原件缺失、真实材料恢复后字节不一致、命令超时挂起、N9 状态与记录矛盾时停该路径；保已得失败与原件，交对应原 Phase owner 或 N9 owner，不为凑绿改判据或改断言。
- **覆盖 AC**：AC-CHECK-1、AC-CHECK-2、AC-CHECK-3、AC-CHECK-4、AC-CHECK-5、AC-CHECK-6、AC-SOURCE-1、AC-SOURCE-2、AC-SOURCE-3、AC-SOURCE-4、AC-SOURCE-5、AC-SOURCE-6、AC-MATERIAL-1、AC-MATERIAL-2、AC-MATERIAL-3、AC-MATERIAL-4、AC-MATERIAL-5、AC-MATERIAL-6、AC-METHOD-1、AC-METHOD-2、AC-METHOD-3、AC-METHOD-4、AC-SET-1、AC-SET-2、AC-SET-3、AC-SET-4、AC-SET-5、AC-SET-6、AC-PROCESS-1、AC-PROCESS-2、AC-PROCESS-3、AC-PROCESS-4、AC-PROCESS-5、AC-PROCESS-6、AC-PROCESS-7、AC-PROCESS-8（36 条，全部承接）
- **Done**：见下方「Done — 36 条逐条档位」表。每行写 AC 编号、一个档位、一条具名证据路径与非 pass 原因；写作时点无执行事实的记 `unavailable`，N9 已合入但复验未执行的 AC-SET-3、AC-SET-6、AC-PROCESS-8、17 行 9/10 所在的 AC-SET-1、G1 字节所在的 AC-SET-5、待 P1/T005 清零的 AC-CHECK-6 记 `incomplete`。执行时由验收器在同一结构上写 `raw/<AC>.json` 与聚合 JSON 的 `results[]`，T034 复核并落 13 项记录；任何一项没有证据不得记 `pass`，计数不替代逐条。

### Done — 36 条逐条档位（同时是验收固定小节第 4 项的唯一表）

本表是 build-plan 写作时点的档位，不是执行结论：P1–P6 尚未实施，`facts.jsonl` 当前为 1 行 build-plan 阶段行。档位只取 `runtime/evidence/acceptance-evidence-validator.mjs:6` 的既有词表（8 值），本卡不复制、不新增枚举。证据根为任务根 `quality/evidence/n10-finite-check-wiring-20261020/`；`raw/<AC>.json` 由运行器在执行时写入，聚合文件为契约头 evidence_path。

| AC | 档位 | 证据路径 | 非 pass 原因 / 执行时判据（生产 Phase） |
| --- | --- | --- | --- |
| AC-CHECK-1 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-CHECK-1.json` | build-plan 未执行；P1 改后三 CLI 合法输入 exit 0、无模板误报、决策链无 92 条 D-* 假告警，执行时重放三命令。 |
| AC-CHECK-2 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-CHECK-2.json` | build-plan 未执行；P1/P3 用空 decision 根、空材料根、空 catalog 三夹具，须见「没有输入/未检查」且 exit 0。 |
| AC-CHECK-3 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-CHECK-3.json` | build-plan 未执行；P1 六类坏输入须一句人话并 exit 1，不以原始堆栈为唯一输出。 |
| AC-CHECK-4 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-CHECK-4.json` | build-plan 未执行；P1 临时违规点名后撤销，同字节复跑恢复。 |
| AC-CHECK-5 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-CHECK-5.json` | build-plan 未执行；P1/P3 无参数 `run-checks` 仍六段、exit 0，stdout 无材料段/final-chain，stderr 恰一行材料未运行。 |
| AC-CHECK-6 | incomplete | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-CHECK-6.json` | build-plan 未执行；P1/T005 把 3 个既有 OCR 失败清零到 0 failed；未执行前保持 incomplete。 |
| AC-SOURCE-1 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-SOURCE-1.json` | build-plan 未执行；P2 合法根来源段只进 reports，consistency 与总检查 exit 语义不变。 |
| AC-SOURCE-2 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-SOURCE-2.json` | build-plan 未执行；P2 五类受控违规各自点名具体条目/字段，撤销后字节恢复、报告消失。 |
| AC-SOURCE-3 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-SOURCE-3.json` | build-plan 未执行；P2 空文件与 `skills: []` 报「没有来源输入」exit 0，缺 catalog 仍 exit 1。 |
| AC-SOURCE-4 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-SOURCE-4.json` | build-plan 未执行；P2/P5 读回 catalog/notice/registry/bundle 与 Appendix B 的八项登记条件；#13/#15 不采用。 |
| AC-SOURCE-5 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-SOURCE-5.json` | build-plan 未执行；P2 来源段只报告、公共 0/1 不变，新增常驻字节与删除重复有对账。 |
| AC-SOURCE-6 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-SOURCE-6.json` | build-plan 未执行；P5 读回 13 条原文索引（`fetched`/sha256/许可/坐标）、4 份漂移，仓库无 vendored 原文。 |
| AC-MATERIAL-1 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-MATERIAL-1.json` | build-plan 未执行；P3 对 N8/N9 合法材料各 0 error、显式 N2 材料见 2 条既有 error、无参数不跑材料段。 |
| AC-MATERIAL-2 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-MATERIAL-2.json` | build-plan 未执行；P3 空 spec、缺 L1、缺 index 指针行各报具名缺项，撤销后同字节恢复 exit 0。 |
| AC-MATERIAL-3 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-MATERIAL-3.json` | build-plan 未执行；P3 空目录/空文件/缺省材料根报「没有输入/不适用」exit 0，stderr 一行材料未运行，不冒充全绿。 |
| AC-MATERIAL-4 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-MATERIAL-4.json` | build-plan 未执行；P3 轻档报「不适用」exit 0，伪轻档缺 Phase 报真缺 exit 1，级别依据可读。 |
| AC-MATERIAL-5 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-MATERIAL-5.json` | build-plan 未执行；P3 干净 index 模板不再永久误报，真实 index 缺指针仍红。 |
| AC-MATERIAL-6 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-MATERIAL-6.json` | build-plan 未执行；P3 裸 N/A 红、带理由绿、deferred 缺责任卡红，三态可区分。 |
| AC-METHOD-1 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-METHOD-1.json` | build-plan 未执行；P4 读回表每条有 path:line 消费者或「未完成」，正文存在不算读者（语义部分只能人读）。 |
| AC-METHOD-2 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-METHOD-2.json` | build-plan 未执行；P4 受控变异被真实测试/审查指出假绿，撤销后恢复原字节与原结论。 |
| AC-METHOD-3 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-METHOD-3.json` | build-plan 未执行；P4 逐条标 machine/manual/both，人工项不写成机器通过。 |
| AC-METHOD-4 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-METHOD-4.json` | build-plan 未执行；P4 读回 B 块后的 correct/encode notice、swarm consumer-only 登记，仍缺标未完成。 |
| AC-SET-1 | incomplete | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-SET-1.json` | 17 行 #9/#10 已转本次接线验证（N9 已合入，待 P5/T023）、#13/#15 已决定不采用；build-plan 未执行 Appendix B 逐行读回；执行时 17+10 行各恰一种处置后才可改判。 |
| AC-SET-2 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-SET-2.json` | build-plan 未执行；P5 读回 verify-code 三条规则与 stage-reflection 条件指针，全文只一处。 |
| AC-SET-3 | incomplete | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-SET-3.json` | N9 已合入 `b8856e5e`，`--task-path` 可用；本卡复验未执行，保 incomplete，不写已接线。 |
| AC-SET-4 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-SET-4.json` | build-plan 未执行；P7 一条 `run-checks` 覆盖六段加显式材料段、点名问题、可重定向。 |
| AC-SET-5 | incomplete | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-SET-5.json` | G1 严格「字节不增」已被用户覆盖为允许增加（D-015）；build-plan 未测量，执行时逐项给前后字节、理由与分母，仍不声称严格不增。 |
| AC-SET-6 | incomplete | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-SET-6.json` | N9 已合入；十环、prove-it-works、sequence-verifiable-units 与任务参数复验未执行，保持 incomplete，不把合并当交付。 |
| AC-PROCESS-1 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-PROCESS-1.json` | build-plan 未执行；P6 读回第 8 步禁入句、第 5 步只问方向轴、第 7 步仍在前、15 slug 不变，并标真实顺序未验证。 |
| AC-PROCESS-2 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-PROCESS-2.json` | build-plan 未执行；P6 核方向请求的 ref+sha256 或内联字节 sha 与原件一致，U-021 原件在包内；只有口头等价事实记 incomplete。 |
| AC-PROCESS-3 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-PROCESS-3.json` | build-plan 未执行；P6 读回 wh-review 合同「当前选择＝骨架级」，无模块结论、保留 reveal/challenge。 |
| AC-PROCESS-4 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-PROCESS-4.json` | build-plan 未执行；P6 逐文件核 N8 根摘要、更正件三处摘要、normal intake、31 矩阵降档、归档未改，P7 历史仍 incomplete。 |
| AC-PROCESS-5 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-PROCESS-5.json` | build-plan 未执行；P6 的 diff 无新 gate/审批/公共命令/facts 字段/第二权威，0/1 语义不变。 |
| AC-PROCESS-6 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-PROCESS-6.json` | build-plan 未执行；P6 读回重开清单为空、五块标「方向审前确认」、无第二轮方向审。 |
| AC-PROCESS-7 | unavailable | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-PROCESS-7.json` | build-plan 未执行；P6 记录保留 partial/provider 失败/覆盖与 U-025 选择，不写成完整通过。 |
| AC-PROCESS-8 | incomplete | `quality/evidence/n10-finite-check-wiring-20261020/raw/AC-PROCESS-8.json` | N9 已合入；RC-1 已修、RC-2 未修、RC-3 由 P6 设计；受控复验未执行，未解决再设计最小修复，不新增 gate。 |

## 工作包声明（人读事实）

- **读集**：`spec.md` 的 Appendix A、测试标准与全局验证策略；`decision-log.md` 的验收面、D-014/D-015/D-021/D-024、未决项与根因表；P1–P6 实际契约卡与执行原件；`runtime/evidence/acceptance-evidence-validator.mjs`；现有三个 CLI 与 `tests/acceptance/` 的 vitest 写法。
- **定序写主**：本 Phase 两份新增文件各只有一个写者。T033 先写验收器与 runbook；T034 只读执行 T033 并写外置证据，不改仓库文件。两份文件不与 P1–P6 写集重叠。
- **接口符号清单**：无新增生产导出；测试文件内的 `runCommand`、`recordResult`、`writeRaw`、`writeAggregate` 等 helper 为文件内私有，不构成公共接口。runbook 无代码符号。
- **合并责任**：T033 实施者提交两份文件；验收器失败或 runbook 与真实命令不一致时回 T033 同一会话修，不改 P1–P6 的实现。
- **progress_cursor**：只指向任务事实库 `facts.jsonl` 的现有 `phase_progress`，本文件不保存进度值。

## 速读卡（人读；只写本 Phase 增量）

- **本 Phase 结果**：36 条 AC 可由一条命令逐条给出档位；30 条机器可判条件由命令重放，6 条人工读回由具名读者复核；结果与证据写入任务根聚合 JSON 和逐 AC 原件；runbook 交代命令、输入、owner、时点与 N9 已合入/待复验路径。
- **非目标**：不修生产代码、不改 spec/index/其它 Phase、不跑 N8 P7 四路、不做全量回归、不调 provider、不新增 gate/状态机/第二进度权威。
- **改动前**：36 条 AC 散在 Appendix A 与 P1–P6，无统一重放入口；N9 已合入；G1 严格口径已被用户覆盖；`facts.jsonl` 现有 1 行 build-plan 阶段行。
- **改动后**：新增验收器与 runbook；执行时产生 `P7-final-acceptance.json`、两份就绪件与 `raw/<AC>.json`；逐条档位与 N9 `incomplete` 可读。
- **与相邻 Phase 的边界**：P1–P6 产生实现与各自证据；本卡只消费、重放必要未闭环 case、记录结论，不代签上游，也不修上游；失败回原 Phase owner。
- **主要风险**：把 gate GREEN 误读成 36 条全 pass。返工走法是按表逐条看档位与证据，整体结论保持 partial/incomplete，只有真实 `pass` 才计通过。
- **下一步**：verify-code 按 runbook 复核；N9 已合入，复验时只重跑 AC-SET-3、AC-SET-6、AC-PROCESS-8 与相关 9/10 行，其余按既有原件。
- **动手前必读**：`spec.md:702` 起 Appendix A（36 条唯一判据）；`decision-log.md:479` 起验收面；`runtime/evidence/acceptance-evidence-validator.mjs:6`（档位词表）；`tools/cli/run-checks.mjs:114-183`（六段、无参数、唯一 `--task-path`、其它参数 exit 1）；`tests/acceptance/card-02-current.test.mjs:1`（vitest 验收写法）。
- **未决事实**：N9 合并时点未知，影响 E3/E6/F8 与 9/10 两行；G1 严格口径不成立（D-015）但 N11 总评如何判未知；P1–P6 的实际证据文件名在写作时点尚未产生，本卡只引用其契约头与计划产物；spec「需求到任务追踪」已列 P7/T033 与 T034，与本卡任务卡一致；不再有编号差异。

## 本 Phase 材料导航（人读；只列实际打开过的锚点）

| 材料 / 锚点 | 本 Phase 用它做什么 | 读取时机 |
| --- | --- | --- |
| `spec.md#Appendix A — 验收判据（唯一权威）`（`:702` 起） | 36 条 AC 的唯一判据；本卡不复制通过/失败条件 | 写卡与执行前 |
| `spec.md#测试标准`（`:593` 起） | 测试面、命令与 UI 排除 | 写卡前 |
| `decision-log.md#验收面`（`:479` 起） | AC 索引与可观察用例 | 写卡前 |
| `decision-log.md#D-024`（`:587` 起） | N9 后逐项复验的边界 | 写卡前 |
| `runtime/evidence/acceptance-evidence-validator.mjs:6` | 8 值档位词表 | 写表与执行时 |
| `tools/cli/run-checks.mjs:114-183` | 六段聚合、无参数、唯一 `--task-path`、其它参数 exit 1 | 写卡前 |
| `tests/acceptance/card-02-current.test.mjs:1-40` | 本仓 vitest 验收测试写法 | 写 T033 前 |
| `docs/research/n8-four-level-acceptance-runbook.md:1-20` | runbook 的状态声明与证据纪律样式 | 写 T033 前 |
| `skills/spec-plan/templates/phase-template.md:221-252` | 验收 Phase 13 项与判据面写作下限 | 写卡前 |
| `skills/spec-plan/SKILL.md:53-65` | Test design and quality 的末 Phase 义务 | 写卡前 |
| `skills/spec-specify/SKILL.md:146-163` | WR001 写法（结论先行、单权威、不复制） | 写卡前 |

## L0 — 结果与变更

本任务的真问题是「检查到底能不能抓错」；36 条 AC 是唯一验收面，但今天没有一处能一次重放并留下逐条原件。本 Phase 交验收器与 runbook，把 P1–P6 的命令、输入、证据串成一条可重跑链，并按 Appendix A 逐条给档位；N9 已合入但复验未执行的部分留 `incomplete`，不冒充已接线。

- **结果**：一条 `npx vitest run tests/acceptance/n10-finite-check-acceptance.test.mjs` 能重放 30 条机器可判条件、登记 6 条人工读回，写出 36 条逐 AC 原件与聚合 JSON；runbook 能被未参与实施的人照着执行并复现同一结论。
- **非目标**：不修检查器实现、不改 AC 或用例集合、不跑 N8 P7 四路、不做全量回归、不联网、不调用 provider、不新增验收 runtime。
- **与其它 Phase 的区别**：P1–P6 各自交付实现与局部证据；本卡是 P1–P6 原 36 条 AC 的验收 Phase，只消费、重放必要未闭环 case 与记录结论；P8 另验追加的 4 条 AC，失败仍回原 owner。

## L1 — 可执行契约

### 文件边界

- **新增**：`tests/acceptance/n10-finite-check-acceptance.test.mjs`、`docs/research/n10-finite-check-acceptance-runbook.md`。
- **修改**：N/A — 本卡不修改任何既有文件。
- **禁止改动**：`tools/cli/check-skill-consistency.mjs`、`tools/cli/check-decision-log-chain.mjs`、`tools/cli/run-checks.mjs`（实现归 P1–P3）；`runtime/**`（只读复用，含 `stage-content-contracts.mjs`）；`skills/**`、`workflows/**`（归 P2/P5/P6）；`specs/n10-finite-check-wiring-20261020/spec.md`、`decision-log.md`、`phases/index.md` 与 P1–P6 卡（本卡只读，改了即越权）；`tests/contract/n10-*.test.mjs`（P1–P6 的冻结测试，改断言须走其 TCR）；`tests/contract/ocr-production-cutover.test.mjs`（归 P1/T005）；`tests/contract/ocr-delegation-route.test.mjs` 既有断言；`specs/archive/n8-four-level-route-20261019/phases/P7-四级验收与成本对照.md`（N8 P7 历史只读，D-021）；`specs/archive/**`、`docs/archive/**`、任务库既有原件。理由：各自有 owner 与原件，本卡只做验收，不用改实现或改判据换绿。

### 任务顺序

T033 先交验收器与 runbook；T034 依赖 T033，只读执行并写外置结论。两张卡覆盖同一 gate，但一张交资产、一张交逐条执行事实，不并行改同一文件。

### Task graph 与纵向切片

T033 是 tracer bullet：真实输入（三个 CLI、N8/N2 材料、临时受控夹具）→ 运行器原件（`raw/<AC>.json`）→ 聚合证据（`P7-final-acceptance.json`）→ 真实消费者（T034、verify-code、用户）；不存在的 UI/数据库层不铺假层。T034 沿同一入口切穿 13 项结论与 N9 分支，不另建第二套验收入口。P1–P6 是固定开工输入，不是本卡并行写集；本卡不因编号相邻造依赖，依赖边来自真实证据消费。

### 测试策略

| 目标 | Task | 角色 | gate_cmd / 预期退出码 | 判据 / 证据路径 |
| --- | --- | --- | --- | --- |
| 36 条 AC 可逐条重放并留下诚实档位 | T033 | 验收资产（不制造目标 RED） | `npx vitest run tests/acceptance/n10-finite-check-acceptance.test.mjs` / GREEN 0；RED unavailable（不制造目标 RED） | ORACLE-N10-FINAL-ACCEPTANCE / `quality/evidence/n10-finite-check-wiring-20261020/P7-final-acceptance.json`（写作时点 unavailable） |
| 13 项结论、N9 待复验档位与逐条判定 | T034 | 验收执行（只读消费） | 同上 / GREEN 0；RED unavailable（不制造目标 RED） | ORACLE-N10-FINAL-ACCEPTANCE / 同上聚合 + `P7-data-readiness.json`、`P7-environment-readiness.json` |

面声明：CLI 行为与退出面（测）、材料合同面（测）、来源登记数据面（测）、静态文档读回面（测）、N9 接口面（测，已合入，按真实 CLI 复验）、真实 provider 与 N8 四路（不测，理由：不在本卡授权，且 provider 行为有独立 owner）、UI/浏览器（不适用 — 本卡无页面，PFACT-007）。RED 说明：验收 Phase 不制造目标 RED；本卡新增验收器而非被测行为，build-plan 阶段未执行，RED 证据记 `unavailable — build-plan 未执行，不为验收器伪造 RED`，执行事实由 build-code/verify-code 产生。

### 覆盖边界

- **覆盖上限**：只证明 36 条 AC 在本次真实输入上的可机判条件与读回结论；gate GREEN 只表示逐条原件与聚合结构有效、没有把非 pass 记成 pass，不表示 36 条全部通过。整体结论按表内档位，非 pass 即整体不得宣 full acceptance。
- **显式不覆盖**：N9 十环在合入前的行为、G1 严格「字节不增」、真实 provider 语义质量、N8 四路真实执行、N11 评测效果、全仓其它失败、用户最终确认与最终 close。

### 停止

P1–P6 任一 Done/写集/原件缺失、真实材料恢复后字节不一致、命令超时或挂起、N9 状态与记录矛盾时，停该路径并保原件；交对应原 Phase owner（实现/证据）或 N9 owner（接口/合并），在本卡记 `incomplete`/`missing` 与 owner，不以改判据或改断言恢复。

### 完成

完成需要：两份文件落地且 gate GREEN；36 条 AC 各有 raw 原件、档位与一条证据路径；13 项结论落盘；N9 相关 AC 未执行时保持 `incomplete` 且写明 owner 与重跑时点；非 pass 逐条写原因；无任何未执行项被记 `pass`；独立审查按真实 `git diff --name-only` 核写集。完成只说「验收器与逐条结论可复核」，不说「36 条全过」。

### 风险与回滚

- **风险**：验收器把 `incomplete`/`unavailable` 记成 `pass`，或把 gate GREEN 当整体通过。
- **影响**：整卡在无真实证据时被宣布验收完成，假绿进入 verify-code。
- **缓解**：表内档位逐条来自命令/原件；无证据的 AC 不得 `pass`；N9 相关未执行时 `incomplete`，执行后按实跑档位；T034 结论单列整体 partial/incomplete。
- **回滚**：回退两份新增文件，保留原失败、缺口与 owner；不整树 checkout，不改历史原件。
- **触发条件**：任一 pass 行找不到对应 raw 原件，或任一 N9 行无原始 stdout 却被写成 pass，或 gate 在缺少 P1–P6 原件时仍 exit 0。

### 验收 Phase 固定小节

1. **入口准则**：执行前逐条核对 P1–P6 的契约头 Done、写集落地（`git diff --name-only` 是否仍是 spec 边界子集）与原件可读；六项全满足才进入逐条判定，缺一项记 `incomplete` 并写 owner。写作时点六项均为 `unavailable — build-plan 未实施`，证据分别写入聚合 JSON 的 `entrance.P1…P6`。

| Phase | 核对项（Done / 写集 / 原件） | 写作时点结果 | 证据路径（执行时） |
| --- | --- | --- | --- |
| P1 | `tests/contract/n10-check-core.test.mjs` GREEN；AC-CHECK-1…AC-CHECK-6 证据（含 T005 0 failed）；写集 ⊆ spec 边界 | unavailable — 待 build-code | `P7-final-acceptance.json`（`entrance.P1`） |
| P2 | `tests/contract/n10-source-registry.test.mjs` GREEN；AC-SOURCE-1…AC-SOURCE-5 证据；写集不越 catalog/notice/registry 边界 | unavailable — 待 build-code | `P7-final-acceptance.json`（`entrance.P2`） |
| P3 | `tests/contract/n10-material-contract.test.mjs` GREEN；AC-MATERIAL-1…AC-MATERIAL-6 证据；未改 `validatePostPhaseContract` 行为 | unavailable — 待 build-code | `P7-final-acceptance.json`（`entrance.P3`） |
| P4 | `tests/contract/n10-method-readback.test.mjs` GREEN；AC-METHOD-1…AC-METHOD-4 证据；未改 N3/N7 已交付方法 | unavailable — 待 build-code | `P7-final-acceptance.json`（`entrance.P4`） |
| P5 | `tests/contract/n10-source-disposition.test.mjs` GREEN；AC-SET-1…AC-SET-6 证据（E4/E5 结论归 P7）；9/10 行本次接线验证有原因 | unavailable — 待 build-code | `P7-final-acceptance.json`（`entrance.P5`） |
| P6 | `tests/contract/n10-process-repair.test.mjs` GREEN；AC-PROCESS-1…AC-PROCESS-7 证据；未改 N8 P7 历史 | unavailable — 待 build-code | `P7-final-acceptance.json`（`entrance.P6`） |

2. **两份就绪件**：数据就绪件 `quality/evidence/n10-finite-check-wiring-20261020/P7-data-readiness.json` 与环境就绪件 `quality/evidence/n10-finite-check-wiring-20261020/P7-environment-readiness.json` 各自成件并写 `status`。写作时点事实：数据侧 N8/N9/N2 归档材料、基线 reds 原件、`source-originals-index.json` 已存在，P1–P6 实现输出与受控夹具尚未产生，status `incomplete`；环境侧 worktree、分支、Node v24.14.0、vitest 2.1.9、HEAD `b8856e5e` 已实读，N9 已合入、P1–P6 代码未实现，status `incomplete`。前置 Phase 在各自 Done 里补能设计的数据；本卡只补并标来源档位，不伪造缺失数据。

3. **授权边界**：目标环境为本机 worktree `/Users/Hugh/Hugh/Project/workflowhub-n10-finite-check-wiring-20261020` 与任务根 `quality/evidence/n10-finite-check-wiring-20261020/`，无外部账号、无网络、无 provider。副作用白名单：只读 CLI；只写任务根证据（聚合、raw、两份就绪件）；临时根建在 `os.tmpdir()` 且单次 ≤ 10 个、`finally` 删除；真实材料只读并做字节恢复比较。明确禁止：改生产代码/测试断言/spec/index/其它 Phase、跑全量回归、联网抓原文、调 provider、重跑 N8 P7 四路、把证据写入仓库或覆盖历史原件。授权有效期为本 build-code P7 实施与 verify-code 复核会话，过期重取授权；agent 全自动执行，不设人工确认。失败即停：仓库写集外出现改动、真实材料无法恢复、命令超时/挂起、N9 状态与记录矛盾。

4. **逐条结论**：契约头「Done — 36 条逐条档位」表即本节唯一结论表，36 行对应 36 条 AC，每行一个档位、一条证据路径；档位只引用既有 8 值词表，不另写枚举。缺证据保留缺口，不读成通过；非 `pass` 不计通过；结论行数与 AC 条数相等，不用计数替代逐条。执行时由验收器写 `raw/<AC>.json` 与聚合 `results[]`，T034 复核并写 13 项记录，在六项结论中说明整体 partial/incomplete。

5. **五类执行事实**：逐条记命令与参数、cwd 与执行者、exit code 与 signal 与 timeout、原始输出落点、机器可读测试报告（`npx vitest` 的 JSON reporter，runner 版本 2.1.9、Node v24.14.0）。`refs` 各标 `execution_record`、`machine_report`、`trace`、`screenshot`、`coverage`、`mutation`、`contract_check`、`red_original`、`negative_control` 之一：CLI 运行记 `execution_record`，vitest JSON 记 `machine_report`，临时违规与撤销记 `negative_control`，D2 变异记 `mutation`，F 静态断言记 `contract_check`，AC-CHECK-6 的 P1/T005 前后输出记 `red_original` 与 `machine_report`；`screenshot`/`coverage` 为 N/A（无 UI、不以覆盖率判通过）。首次失败、重跑通过标 `flaky`、档位记 `inconclusive`，不得记 `pass`。

6. **效果评测**：比较基线取 P1–P6 改动前同命令输出，指标为受控违规被点名数、合法输入误红数；`work` 是本次真实执行的命令/夹具次数，`error` 是相对 Appendix A 独立 oracle 的漏报/误报，分开记样本数、变更数与未测工程成本。正例为合法材料（三 CLI、N8/N2 材料）exit 0，负例为五类来源违规、空/坏输入与临时缺段；具名原始输出为 `raw/<AC>-*.stdout.txt`。冻结输入、指标与停止条件后一次只改一处并测量；本任务为确定性 CLI，无不稳定噪声，但仍不以测试数量或覆盖率判通过。本仓无 UI（worktree 无 `apps/`、无 `.tsx`/`.vue`/`.jsx`），但不能免掉代码与接口面。写作时点未执行，结论 `unavailable`；执行时按真实原件填，收益未越过可观察差异则记 `inconclusive`。

7. **复验四项**：若验收出现失败并修复，复验者须是未参与该修复的独立执行者（具名 subagent 或另一 provider），与修复者上下文不同；F2P 为修复前失败的目标用例清单，P2P 为同文件其余用例加直接消费方清单，两者计数都须大于 0；回归范围限该 Phase 契约测试与三 CLI 合法命令，并说明为何是本次修改的保守超集；三档判分 F2P=1 且 P2P=1 记 FULL，0<F2P<1 且 P2P=1 记 PARTIAL，其余 NO，PARTIAL 不得记 `pass`，分母为 0 不判通过，修复者自述不算复验证据。写作时点无修复事件，记 `unavailable` 与 owner；发生失败即按第 13 项闭环。

8. **变更批准**：本次 AC 与用例集合无增删改，理由是本卡 36 条原样承接 `spec.md#Appendix A`，不新增、不降档、不合并。若执行中发现必须改，登记 `Change Request ID`、`Impact Assessment`、`Approval Status`、`Closure Notes/Verification Status`，批准者须非实现者且非同一上下文；纯重构不改既有测试，改 AC 等于改承诺，须用户重新确认。当前无变更行，不填假批准。

9. **分诊与关闭**：失败先复现，分诊者不是实现者，保留步骤与结果。最低字段为 `Defect ID`、描述、是否可复现、`Version detected`、`Severity`、`Priority`、`Disposition`（初值 `Pending`）；终值只取 `Fixed`、`Won'tFix`、`Deferred`、`AcceptedRisk`、`Duplicate`、`NotABug`、`Referred`。不修的值写理由与风险接受人署名；关闭留 `Closed by`、`Date closed`、`Change reference`、`Test reference`、`Closure Notes/Verification Status`。写作时点无失败事件，表为空并写明「尚无失败，未执行」；出现失败按此表登记，不用「无失败即通过」代替。

10. **回写五项**：① `spec.md` 场景卡——无变更（本卡写集不含 spec；执行发现 SCN 缺事实交 spec owner）；② `spec.md` AC 表——无变更（36 条原样引用，改 AC 须用户重新确认）；③ phase 契约 `覆盖 AC`——无变更（已列 36 条，若改由 build-plan owner 与 index 同步）；④ `facts.jsonl` 既有字段——本卡不手工新增字段，阶段行由 build-code/verify-code 运行时写入（当前 1 行 build-plan 阶段行是实读事实）；⑤ 本次修复记录——无失败修复事件时写「无 — 理由」，有则按第 9/13 项登记并附原件。每项写「哪条 case 改了、为什么、改后判定（取既有 8 值词表）」；本卡写作时点五项均无变更，执行时核对后才记 `pass`，缺一项不算闭环。

11. **六项结论**：① 评估与局限——本卡写作时点只完成验收设计与结构，36 条尚无执行事实，gate 未运行；② 与计划的偏差及原因——spec 追踪行已列 P7/T033 与 T034，与本卡任务卡一致；N9 已合入但 E3/E6/F8 复验未执行，只能 `incomplete`；③ 未充分测试的特性及原因——十环、provider 语义、G1 严格口径、N8 四路、真实用户旅程均未测，各有独立 owner/条件；④ 未解决事件——17 行 9/10、F8 复验、RC-2 修复、G1 严格口径、PRD 10 红与实测 3 红差异，逐条留 owner；⑤ 残留风险——把资产/绿门当整体通过、N9 字段漂移、字节分母漏项、临时夹具污染；⑥ 签核对象——用户做最终确认，verify-code 做终末复核，本卡不自签、不代替独立审查。

12. **防自证五禁令**：不用授权文本验证授权文本（授权只写边界，不产出 AC 档位）；不删到测试变绿、不改断言消音、不重跑到绿（失败保原件，修复回原 owner）；黄金清单改动由另一主体批准（AC/用例集合变更走第 8 项，非实现者批准）；不用计数代替逐条（36 行逐条判定，不用「36/36」或测试数代替）；不把 `incomplete`、`unavailable`、`missing`、`unverified` 写成 `pass` 或 `succeeded`。判定器必须要求显式通过元素，不用「无失败即通过」：每条 `pass` 必须有 raw 原件、命令 exit 与具名证据，缺一即非 pass。

13. **失败修复复验闭环**：失败 → 第 9 项分诊（分诊者非实现者）→ 根因调研 → 修复回到原 owner Phase 的 Task → 换上下文复验（第 7 项，F2P 加 P2P）→ 第 10 项回写五项。降级项 `deferred`、`unavailable`、`incomplete` 同段写风险承接人署名与重跑条件（N9 相关为 N9 owner + verify-code；G1 为 P7 owner + 用户/N11 判读）。闭环复用既有 Phase 与 Task，不新增 gate、报告类型或第二进度权威；本轮无失败修复事件，闭环链保留待用。

### 判据面标注与逐条档位

`spec.md#Appendix A` 的 36 条 AC 在本卡按原「验证 / 通过 / 失败」行归并判定方式，不新建第二套判据；Appendix A 未逐条写三个固定自然语言词，本卡只作阅读定位，不改写原判据：

- **机器可判**：AC-CHECK-1…AC-CHECK-6、AC-SOURCE-1…AC-SOURCE-6、AC-MATERIAL-1…AC-MATERIAL-6、AC-SET-1、AC-SET-2、AC-SET-4、AC-SET-5、AC-PROCESS-1…AC-PROCESS-5——本任务内一条命令可重放真假；N9 合入后 AC-SET-3、AC-SET-6、AC-PROCESS-8 也由同一命令机器判定，合计 30 条。
- **只能人读**：AC-METHOD-1、AC-METHOD-3、AC-METHOD-4（真实消费者与人工/机器分界）、AC-METHOD-2（假绿是否被真实审查指出）、AC-PROCESS-6、AC-PROCESS-7（记录真实性与覆盖）——语义可用性，命令输出不单独构成结论。
- **需真实环境+用户在场**：无——本任务没有真实外部环境判据；N9 已合入，AC-SET-3、AC-SET-6、AC-PROCESS-8 只需本机命令与 N9 交付原件，不需用户全程在场；未执行时 `incomplete`。

Done 逐条档位仍以契约头同一张表为准；独立审查按本卡实际 diff 与承接 AC 核对证据形式与覆盖限制，不按散文自述签结论。

### T033 — 全 AC 验收运行器与 runbook

- **来源 / FR / AC**：R-009（全部声明适用 consumer、合法/负例/零输入及恢复结果；G1 完整 N1；不等 N11 代本卡首次检测验收）、R-017（每张卡边做边验证）、D-014（重跑复用总检查）、D-024（N9 后逐项复验）、D-026（既有红清零）/ FR-SET-005（维护者一次重跑）、FR-SET-006（字节核算）、FR-SET-007（N9 后复验）/ AC-CHECK-1、AC-CHECK-2、AC-CHECK-3、AC-CHECK-4、AC-CHECK-5、AC-CHECK-6、AC-SOURCE-1、AC-SOURCE-2、AC-SOURCE-3、AC-SOURCE-4、AC-SOURCE-5、AC-SOURCE-6、AC-MATERIAL-1、AC-MATERIAL-2、AC-MATERIAL-3、AC-MATERIAL-4、AC-MATERIAL-5、AC-MATERIAL-6、AC-METHOD-1、AC-METHOD-2、AC-METHOD-3、AC-METHOD-4、AC-SET-1、AC-SET-2、AC-SET-3、AC-SET-4、AC-SET-5、AC-SET-6、AC-PROCESS-1、AC-PROCESS-2、AC-PROCESS-3、AC-PROCESS-4、AC-PROCESS-5、AC-PROCESS-6、AC-PROCESS-7、AC-PROCESS-8（AC-SET-4 为主，36 条全部由运行器逐条覆盖）。
- **输入**：`spec.md#Appendix A` 的 36 条判据与测试标准；`decision-log.md#验收面`；P1–P6 的契约测试与执行原件（执行时从任务事实引用）；三个 CLI 的当前入口；任务根 `quality/evidence/n10-finite-check-wiring-20261020/`；AC-CHECK-6 基线 `quality/tests/2026-10-20-n10-baseline-reds.output` 与 P1/T005 的 `2026-10-21-n10-p1-t005-{red,green}.output`（任务根）；AC-SOURCE-6 索引 `quality/evidence/source-originals/source-originals-index.json`（任务根，实读存在）；N8/N2 材料。写作时点 P1–P6 输出与受控夹具尚未产生，输入状态 `incomplete`。
- **文件 / 符号**：`tests/acceptance/n10-finite-check-acceptance.test.mjs`（vitest；文件内私有 helper `runCommand`、`recordResult`、`writeRaw`、`writeAggregate`、`assertClean`、`assertZeroInput`、`assertBadInput`、`assertRestored`、`assertN9Branch`）；`docs/research/n10-finite-check-acceptance-runbook.md`；符号：上述 helper 均为文件内私有，无生产导出。
- **动作**：①在测试文件顶部固定 36 条 AC 清单与 A–F 分组，通过 AC 编号引用 `spec.md#Appendix A`，不复制通过/失败条件。②实现命令包装：`spawnSync(process.execPath, [script, ...args], {cwd: worktreeRoot, encoding: "utf8", timeout: 120000})`，逐条记 argv、cwd、执行者、status/signal/timed_out、stdout/stderr；超时记 `inconclusive` 并停该路径。③实现临时夹具：`mkdtempSync(join(tmpdir(), "n10-acceptance-"))`，复制最小 catalog/notice/registry/decision-log/N8 材料，`finally` 删除；真实材料只读，恢复用字节比较（`cmp`/sha256），单次 ≤ 10 个临时根。④按组执行：A 组三 CLI 合法/零/坏/违规/恢复、无参数六段、A6 读 P1/T005 的 red/green 原件与基线；B 组合法来源报告、五类受控违规、空来源、八项登记读回、13 条原文索引；C 组 N8/N2/空/轻档/伪轻档/干净模板/三态 skip；D 组消费 P4 读回表与变异原件；E 组 Appendix B 逐行、figure-it-out 落点、N9 分支、一次 `run-checks` 重定向、字节表；F 组 P6 文档与静态断言读回、N9 后复验分支。⑤N9 分支：固定 cwd=认证 worktree，`node tools/cli/run-checks.mjs --task-path <N10 任务根>` 执行一次；exit 0 时解析单份 JSON，核 rings 1..10、五态、分母公式、`material_root` 以 `/specs/n10-finite-check-wiring-20261020` 结尾、缺环负例 exit 0、任务不可读 exit 2，不符记 `inconsistent`；exit 1 unsupported 表示 N9 接线回退，记 `inconsistent`，不记 incomplete 求绿。F8 读 P6 的受控复验记录与 RC-1/2/3 三态；P7 不调 provider，P6 未执行记 `incomplete`。⑥写 `raw/<AC>.json`（含命令、exit、stdout 落点、判定与原因）与聚合 `P7-final-acceptance.json`（36 条 `results[]`、`entrance`、`effect`、`reverification`、`change_approval`、`triage`、`writeback`、`conclusions`）；聚合 result 只取既有 8 值词表。⑦断言诚实性：36 行不缺；无证据不得 `pass`；N9 相关未执行时 E3/E6/F8 为 `incomplete`，执行后按真实档位；出现 `fail`/`inconsistent` 时 gate 非零。⑧写 runbook：命令、输入、owner、时点、证据命名、清理、限制、失败分诊与 N9 已合入/待复验路径；含契约头的 gate_cmd、oracle、evidence_path。
- **输出 / 失败**：合法输入通过时 gate 退出 0，任务根出现聚合、两份就绪件与 36 份 raw；输入缺失时对应 AC 记 `missing`/`incomplete` 并写 owner，不静默跳过；命令与 AC 判据矛盾时记 `fail`/`inconsistent` 并退出非零；临时目录与真实材料在 `finally` 恢复，失败也保留原始输出。
- **边界 / 禁止改动**：不修改 P1–P6 的生产代码与测试、不改 spec/index/其它 Phase、不改 N8 P7 历史、不跑全量回归、不联网、不调 provider；不新增公共命令、schema 或运行时状态。
- **依赖**：P1, P2, P3, P4, P5, P6（真实输入与证据）；本 Phase 内无更早 Task，可立即开始。
- **测试层级 / 技能**：acceptance + integration / `backend-testing`；面为 CLI 行为与退出、材料合同、来源登记数据、静态读回、N9 接口事实；UI/浏览器不适用（无页面），数据库/部署无改动。
- **场景 / 夹具或服务**：正例为当前合法材料与三 CLI；反例为五类来源违规、空/坏输入、临时缺段/裸 N/A/deferred 缺卡、N9 缺环与不可读任务；夹具建在 `os.tmpdir()`，`finally` 删除，真实材料前后字节比较。
- **预写测试**：`tests/acceptance/n10-finite-check-acceptance.test.mjs` 是本 Task 的产物与验收器同一文件，作者为本 Phase 实施者；build-plan 只固定 36 条清单、命令与档位词表引用，不预写测试正文，也不在测试里重写 AC 通过条件。
- **可观察接缝**：P1–P6 命令与证据（producer）→ 任务根 `quality/tests/`、`quality/evidence/` 的已持久化原件 → P7 `raw/<AC>.json` 与聚合 JSON（consumer=T034/verify-code/用户）。我是怎么知道的：`tools/cli/run-checks.mjs:165-181` 当前参数分支（N9 已接线）；`runtime/evidence/acceptance-evidence-validator.mjs:6` 是既有档位词表；`spec.md:702` 起是 Appendix A；任务根 `quality/tests/2026-10-20-n10-baseline-reds.output`、`quality/evidence/source-originals/source-originals-index.json` 经 `find` 实读存在；`tests/acceptance/card-02-current.test.mjs:1` 是本仓 vitest 验收写法。
- **RED/GREEN 门禁命令**：`npx vitest run tests/acceptance/n10-finite-check-acceptance.test.mjs`
- **预期退出码**：GREEN 0；RED 不制造目标 RED（验收器没有改动前应失败的实现，RED 证据 unavailable）；执行时结构或诚实性断言失败才退出码 1，不是目标 RED。
- **RED 目标失败**：ORACLE-N10-FINAL-ACCEPTANCE；本卡不制造目标 RED。执行时若验收器把非 pass 记成 pass、36 行缺失、N9 行未执行却写 `pass`、或受控违规未被点名，同一测试的诚实性断言失败；这不是被测行为的 RED。
- **RED 证据**：`unavailable — build-plan 未执行；不为验收器伪造 RED`。执行时保留首次失败原件，归因记目标行为失败/夹具或环境失败/本来通过。
- **GREEN 判定器**：ORACLE-N10-FINAL-ACCEPTANCE；同命令退出 0 表示 36 条逐条原件与聚合结构有效、无 pass 缺证据、N9 行按真实执行档位（未执行则 `incomplete`）；反向行为（把 `incomplete` 记 `pass`、删行、改断言）会使同一命令失败。
- **证据**：计划 `quality/evidence/n10-finite-check-wiring-20261020/P7-final-acceptance.json` 与 `raw/AC-*.json`；写作时点均为预期路径，实际原件由执行者留；不把不存在写成已执行。
- **覆盖上限**：验收器不证明 provider 语义、真实用户效果、N8 四路、N11 评测或全仓无其它失败；gate GREEN 不等于 36 条全 pass。
- **停止 / 恢复**：P1–P6 原件缺失、临时夹具污染真实材料、命令超时或 N9 状态矛盾时停该路径；保原失败，回对应 owner 修；不改判据求绿。
- **测试变更请求**：none — 本卡新增测试文件，不改任何冻结测试；P1–P6 测试若需改，走其自身 TCR，不在本卡。
- **完成**：两份文件落地且 gate GREEN；36 份 raw 与聚合齐全；N9 分支按已合入的真实 CLI 可判；runbook 含命令、输入、owner、时点、清理与 incomplete 路径；任何 pass 都能被未参与实施的人用一条命令重放。

### T034 — 逐条执行与结论

- **来源 / FR / AC**：R-009、D-024 / FR-SET-005、FR-SET-007 / AC-SET-3、AC-SET-6、AC-PROCESS-8 为主；AC-SET-4、AC-SET-5 的结论亦在本卡（P5 只交输入），A1–F8 全部逐条结论。
- **输入**：T033 交付的验收器与 runbook；P1–P6 的 Done、测试/审查原件与任务事实；N9 merge 状态与 9/10 两行；`facts.jsonl` 现有阶段行；基线 reds 与 source-originals 索引。写作时点输入为 `incomplete`（P1–P6 未实施）。
- **文件 / 符号**：只读复核 `tests/acceptance/n10-finite-check-acceptance.test.mjs` 与 `docs/research/n10-finite-check-acceptance-runbook.md`（本 Phase 写集内文件，T034 不修改）；符号：无。结论写入任务根聚合 JSON、两份就绪件与逐 AC 原件，不写仓库。
- **动作**：按第 1–13 项顺序执行并落盘：①核 P1–P6 入口准则；②确认数据/环境两份就绪件 status；③按授权边界执行；④逐条跑 36 AC 并写档位；⑤记五类执行事实；⑥按第 6 项填效果评测（基线、指标、正负例、单位）；⑦按第 7 项记复验（无修复时写 `unavailable` 与 owner）；⑧按第 8 项核变更（本次无）；⑨按第 9 项分诊（无失败时写明）；⑩按第 10 项核回写五项；⑪写六项结论；⑫执行防自证核对；⑬出现失败按第 13 项回原 owner 修复并换上下文复验。结论写聚合 JSON 的 `conclusions` 与六项，六项非空；整体结论只能是表格实际档位，不得写「全绿」「全部通过」。
- **输出 / 失败**：执行完成时聚合 JSON 有 36 条档位、13 项记录与六项结论；有 `incomplete`/`unavailable` 时整体记 partial/incomplete 并写 owner；有 `fail`/`inconsistent` 时 gate 非零并按第 9/13 项登记；缺输入时记缺口，不伪造执行。
- **边界 / 禁止改动**：不改 spec/AC/用例集合/其它 Phase/index/facts 字段；不新增 gate、报告类型、状态机或第二进度权威；不替原 owner 修实现；不把自己写成独立审查者。
- **依赖**：T033（运行器与 runbook）；无其它本 Phase 前置。
- **测试层级 / 技能**：acceptance / `backend-testing`；面同 T033，另加结论与回写读回；UI/浏览器不适用。
- **场景 / 夹具或服务**：正例为 P1–P6 原件齐全、N9 已合入时十环/缺环/任务参数可跑；反例为 N9 接线回退（inconsistent）、某前置原件缺失（入口准则不满足）、受控违规未被点名（fail）、字节无法恢复（停）；不新建真实业务夹具。
- **预写测试**：N/A — 不新增测试；复用 T033 的验收器。运行器需修改时回 T033 owner，不在 T034 改断言。
- **可观察接缝**：T033 的 `raw/<AC>.json` 与聚合 JSON（producer）→ T034 逐条结论与六项（consumer=verify-code/用户）；阶段行由运行时写 `facts.jsonl`（当前实读 1 行 build-plan stage row）。我是怎么知道的：`facts.jsonl` 路径与 1 行经 `wc -l` 实读；`run-checks.mjs:165-181` 是 N9 已接线现状；`spec.md:702` 是判据来源。
- **RED/GREEN 门禁命令**：`npx vitest run tests/acceptance/n10-finite-check-acceptance.test.mjs`
- **预期退出码**：GREEN 0；RED 不制造目标 RED（只消费与重放，RED 证据 unavailable）；执行时结构或诚实性断言失败才退出码 1，不是目标 RED。
- **RED 目标失败**：ORACLE-N10-FINAL-ACCEPTANCE；N/A — 理由：验收 Phase 只消费与重放，不制造目标 RED；执行时结构/诚实性断言失败才使 gate 非零。
- **RED 证据**：`unavailable — build-plan 未执行；执行事实由 build-code/verify-code 产生`。
- **GREEN 判定器**：ORACLE-N10-FINAL-ACCEPTANCE；同命令退出 0 且聚合/raw/两份就绪件可读、36 行无 pass 缺证据、N9 行 `incomplete`、六项结论非空。
- **证据**：`quality/evidence/n10-finite-check-wiring-20261020/P7-final-acceptance.json`、`P7-data-readiness.json`、`P7-environment-readiness.json`、`raw/AC-*.json`；写作时点为预期路径。
- **覆盖上限**：同 T033；此外不证明独立审查已完成、不证明用户最终确认或 close。
- **停止 / 恢复**：前置证据缺失、N9 状态矛盾、失败未分诊或结论被迫改档时停；回对应 owner 或 T033，保原件与缺口，不改判据。
- **测试变更请求**：none — 不修改任何测试或 AC/用例集合。
- **完成**：36 条逐条档位、13 项记录、两份就绪件与六项结论落盘；N9 相关 AC 保持 `incomplete` 并写重跑条件；非 pass 逐条有原因；整体结论如实 partial/incomplete；独立审查后交 verify-code/用户。

## L2 — 可删除参考

实现期间可参考 `tests/acceptance/card-02-current.test.mjs` 的 vitest 组织方式与 `docs/research/n8-four-level-acceptance-runbook.md` 的状态声明；删掉本节不改变 L0/L1。

## 补充材料

- `spec.md#Appendix A — 验收判据（唯一权威）`：36 条原文，含验证/通过/失败/证据四行。
- `decision-log.md#验收面` 与 `#D-024`：AC 索引与 N9 后复验边界。
- `runtime/evidence/acceptance-evidence-validator.mjs`：8 值档位词表；本卡只引用，不复制。
- `tests/acceptance/card-02-current.test.mjs`、`docs/research/n8-four-level-acceptance-runbook.md`：写法与 runbook 样式，仅作参考，不是本卡证据。
