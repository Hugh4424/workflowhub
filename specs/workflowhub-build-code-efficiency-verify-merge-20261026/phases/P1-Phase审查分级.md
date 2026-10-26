# Phase P1 — Phase 审查按风险分级

读者：本 Phase 的实施者、独立审查者、P2 子代理分工作者与每个 Phase 的主会话。
读完要能：按三维证据与低风险正向判据选出审查执行者，写清执行者与来源，并重放四个受控夹具。

## Phase 契约头（文件级字段；runtime 逐字读取）

- **全局规格**: `spec.md#实现设计全局权威`（审查路由、身份与失败语义的唯一指针）
- **写入集**: `workflows/build-code/SKILL.md`；`docs/standard-workflow.md`；`runtime/review/review-policy.mjs`；`skills/wh-review/SKILL.md`；`skills/wh-review/contracts/build-code.md`；`docs/architecture/move-map.json`；`tests/contract/review-tier.test.mjs`；`tests/contract/ocr-delegation-adapter.test.mjs`；`tests/contract/ocr-delegation-route.test.mjs`；`tests/contract/ocr-production-cutover.test.mjs`
- **依赖**: none
- **消费者**: P2 子代理分工作者与每个 Phase 的主会话
- **gate_cmd**: `npx vitest run tests/contract/review-tier.test.mjs`
- **oracle**: ORACLE-REVIEW-TIER
- **evidence_path**: `quality/evidence/workflowhub-build-code-efficiency-verify-merge-20261026/P1-review-tier.json`
- **STOP**: 判据必须引入数字阈值、选择表、动态评分器或第二套审查点才能成立时，停该实现并交 build-plan 作者改契约；OCR 不可用时只记 unavailable 与检测输出，不换执行者；要改审查 schema、OCR 路由或任务事实 writer 时停该处并交对应 owner。
- **覆盖 AC**: AC-REVIEW-001、AC-REVIEW-002
- **Done**: AC-REVIEW-001 由四夹具、终末整卡全审可定位和执行者记录重放；AC-REVIEW-002 由低风险正向判据、三维取数命令、U-020 用户授权记录与无数字阈值重放；两者用 gate_cmd 与 evidence_path 原件判断。build-plan 档位：两条 AC 均为 unavailable（未实施）；owner 为 P1 实施者，build-code 按 gate 结果回填。真实 `ocr --version` 输出必存，不可用记 unavailable；独立审查原件另存。

## 工作包声明（人读事实）

- **读集**: `spec.md`、`decision-log.md`（U-010/U-012/U-020/F2）、`skills/spec-plan/templates/phase-template.md`、`runtime/stage/stage-content-contracts.mjs`、`workflows/build-code/SKILL.md`、`docs/standard-workflow.md`、`runtime/review/review-policy.mjs`、`skills/wh-review/SKILL.md`、`skills/wh-review/contracts/build-code.md`、`docs/architecture/move-map.json`、`tests/contract/ocr-delegation-adapter.test.mjs`、`tests/contract/ocr-delegation-route.test.mjs`、`tests/contract/ocr-production-cutover.test.mjs`
- **定序写主**: P1 是这 10 个路径的第一个写者；同 Phase 一个写主。P2、P3 与 P4 若再改 `workflows/build-code/SKILL.md`、`docs/standard-workflow.md`、`skills/wh-review/SKILL.md` 或 `docs/architecture/move-map.json`，按依赖边后写，先读回本 Phase 已核实状态。
- **接口符号清单**: `reviewTierFor(readings)`、`assertReviewTierRecord(record)`、`REVIEW_EXECUTORS`；仅被 `tests/contract/review-tier.test.mjs`、build-code 第 8 步与 wh-review 合同消费，不新增公共命令。
- **合并责任**: 产出方为 P1 实施者；失败换新执行者重做，保留原失败与 evidence_path 引用。
- **索引一致性**: `phases/index.md` 的 P1 行须与本契约头的写入集、依赖、消费者逐字一致；本 Phase 不改索引。
- **progress_cursor**：只指向任务事实库 `facts.jsonl` 的 `phase_progress`，本文件不保存进度值。

## 速读卡（人读；只写本 Phase 增量）

- **本 Phase 结果**: 复杂任务的每个 Phase 按风险挑审查执行者并留下可核记录，P2 与各 Phase 主会话可直接复用。
- **非目标**: 不改小改动与普通任务的审查方式；不取消终末整卡外部全审；不新增第二套审查点；不设数字阈值或选择表。
- **改动前**: `docs/standard-workflow.md:33` 明写「本轮缺同 cohort 真实质量，仍每 Phase 审、不降对照或投入、不增选择表/动态评分器/selector」；`workflows/build-code/SKILL.md:38` 只写「正常使用 OCR」。
- **改动后**: 低风险走独立子代理；高风险或影响说不清走外部 OCR；终末整卡外部全审；记录写执行者、来源与三维读数。
- **与相邻 Phase 的边界**: 本 Phase 先交审查选择，P11 最后交身份删除与旧值读取；本 Phase 只加审查执行者选择与记录；P2 消费它派发子代理。
- **主要风险**: 判据写成不可执行的否定句或靠数字大小，选择不可重放；替代走法是把每条判据改成可核事实与三维命令原读数。
- **下一步**: P2 子代理分工作者按本规则派发，每个 Phase 主会话按记录格式留原件。
- **动手前必读**: `spec.md#实现设计全局权威` 的审查路由段；`docs/standard-workflow.md:29`；`workflows/build-code/SKILL.md:38`；`runtime/review/review-policy.mjs:22`。
- **未决事实**: 外部 OCR 可用性未验证；影响面机器判定口径未成品，当前只用直接调用方与关键路径的人工可核读数，影响说不清即升外部 OCR。

## 本 Phase 材料导航（人读；只列本 Phase 实际用到的锚点）

| 材料 / 锚点 | 本 Phase 用它做什么 | 读取时机 |
| --- | --- | --- |
| `spec.md#实现设计全局权威` | 取审查路由按身份判定、终末审查身份与失败语义 | 开工前 |
| `skills/spec-plan/templates/phase-template.md` | 取契约头、L0/L1/L2 与 Tnnn 字段写法 | 写卡前 |
| `runtime/stage/stage-content-contracts.mjs:500` | 核对 Phase 合同实际必填字段与写集解析 | 写卡前 |
| `workflows/build-code/SKILL.md:38` | 读第 8 步现状，定位要替换的「正常使用 OCR」 | 动手前 |
| `docs/standard-workflow.md:29` | 读现行不降审规则与三审查点 | 动手前 |
| `runtime/review/review-policy.mjs:3`、`:22` | 读 `FORMAL_STAGES` 与 `assertReviewIdentity` 入口 | 动手前 |
| `skills/wh-review/SKILL.md` 的「输出和失败边界」 | 取执行者、来源与原件的记录口径 | 改合同前 |
| `tests/contract/ocr-delegation-adapter.test.mjs`、`tests/contract/ocr-delegation-route.test.mjs`、`tests/contract/ocr-production-cutover.test.mjs` | 读现有路由断言，决定增补位置 | 改测试前 |

没列进本表的材料不凭印象引用；列进来的每条锚点在写卡片时都实际打开过。

## L0 — 结果与变更

复杂任务的每个 Phase 仍只有一次独立审查，但执行者按风险挑：低风险用独立子代理，高风险或影响说不清走外部 OCR，终末整卡固定外部全审。记录写清执行者与来源，子代理是独立上下文但不是外部异源，不得写成 OCR 结果。这是用户 U-020 明确授权现在就启用的选择，不是代理自行降审；`docs/standard-workflow.md` 的现行限制按此改写并保留授权记录。

- **结果**: 复杂任务每个 Phase 的审查执行者按风险选出并可复算；执行者记录区分「独立子代理」与「外部 OCR」；终末整卡外部全审可定位。
- **非目标**: 不设数字阈值；不新增选择表、动态评分器或 selector；不改小改动与普通任务的审查方式；不取消终末整卡外部全审。
- **低风险判据**: 五条正向判据加范围条件。权限或安全面、数据迁移或不可逆面、共享状态或并发面、公开合同或关键路径面、真实外部依赖面逐面实读为「无」并写本次可核读数；改动局限在单一模块且直接消费者已知有限。任一不满足即外部 OCR；判定不接收百分比、分数或数量阈值。
- **与其它 Phase 的区别**: P8 承接终末审查身份，P9 承接身份校验，P11 承接三阶段身份与旧值读取；本 Phase 只决定同一个每 Phase 审查由谁执行、怎么记录。

## L1 — 可执行契约

### 文件边界

- **新增**: `tests/contract/review-tier.test.mjs`（四夹具、终末全审、OCR 不可用与记录来源的单一 gate 测试）
- **修改**: `workflows/build-code/SKILL.md`、`docs/standard-workflow.md`、`runtime/review/review-policy.mjs`、`skills/wh-review/SKILL.md`、`skills/wh-review/contracts/build-code.md`、`docs/architecture/move-map.json`、`tests/contract/ocr-delegation-adapter.test.mjs`、`tests/contract/ocr-delegation-route.test.mjs`、`tests/contract/ocr-production-cutover.test.mjs`
- **禁止改动**: `runtime/review/schemas/result.schema.json`（执行者枚举与终末结论归 P9，本 Phase 不新增字段或枚举）；`runtime/review/ocr-delegation-adapter.mjs`（OCR 派发与不可用口径归路由 owner，P1 只读）；`runtime/review/review-record-route.mjs`、`runtime/task/task-store.mjs`（审查事实与游标 writer 不变）；`runtime/review/stage-materials.json`；`workflows/make-decision/**`、`workflows/build-prd/**`（小改动、普通任务与规划路线审查方式不变）；`docs/adr/**`、`docs/research/**`、`docs/archive/**`、`specs/archive/**`（历史与归档原件只读）；标 Frozen 的测试只在具名变更请求下改。

### 任务顺序

单卡 T001，无并行 Task；按「读现状 → 补测试取 RED → 改判定与正文 → 改 OCR 测试 → 注册 move-map → 跑 gate」执行。本 Phase 无前置 Phase，核当前工作区后即可开工。

### 测试策略

开工前四要素：验证层为材料合同加定向 vitest 契约；命令见下方表；预期结果是四个夹具、终末全审、OCR 不可用与记录来源断言全部通过；失败条件是任一夹具结论相反、子代理被记成外部异源、出现数字阈值或文档规则缺用户授权。只跑本 Phase 范围，不跑全量、不跑长任务。

| 目标 | Task | 角色 | gate_cmd / 预期退出码 | 判据 / 证据路径 |
| --- | --- | --- | --- | --- |
| 按风险选审查执行者并记录来源 | T001 | RED | `npx vitest run tests/contract/review-tier.test.mjs` / nonzero | ORACLE-REVIEW-TIER / `unavailable — build-plan 不实施，由 build-code 补真实 RED` |
| 按风险选审查执行者并记录来源 | T001 | GREEN | `npx vitest run tests/contract/review-tier.test.mjs` / 0 | ORACLE-REVIEW-TIER / `quality/evidence/workflowhub-build-code-efficiency-verify-merge-20261026/P1-review-tier.json` |

四个受控夹具与固定结论：

- 低风险：五个风险面逐面实读为「无」，改动局限单一模块且直接消费者已知有限，三维读数可读；期望独立子代理。
- 高风险：任一面实读为「有」（例：改权限校验或数据迁移写路径）；期望外部 OCR，不被低风险判据吞掉。
- 影响证据缺失：改动范围与大小可读，但影响维为 undetermined（直接调用方读不出）；期望外部 OCR，记录 undetermined 与原因。
- 单调性：同一低风险基线重复判定结论相同；仅把一维扩增（例：新增一个关键路径消费者）时期望只升不降为外部 OCR，不得回到更轻。
- 终末整卡：即使其余读数指向低风险，期望固定外部 OCR 全审，不被沿途低风险审查替代。
- OCR 不可用：`ocr --version` 为 ENOENT 或低于 1.12.9 时记 unavailable 与检测输出，执行者不变、不伪造 provider_results，不把子代理记成 OCR。

记录固定写三项（写入本次审查记录正文，不新增持久 schema 字段或枚举）：执行者（独立子代理或外部 OCR）、来源（独立子代理写派发身份与上下文隔离，外部 OCR 写 route 与 provider 引用）、三维读数（`git diff --name-only` 列路径，直接调用方与关键路径，`git diff --numstat` 分列增删、二进制记不可核、不以净 0 抵消）。外部 OCR 另带 provider 终态；独立子代理不写 `ocr` 身份。判据只用具名事实，不接收百分比、分数或数量阈值。

### 覆盖边界

- **覆盖上限**: 四夹具只证明选择一致、记录字段可核、终末全审可定位；不证明低风险审查质量不降、不证明子代理发现能力等同外部 OCR、不证明真实 OCR 可用。
- **显式不覆盖**: 真实外部 OCR 的发现质量与可用性；长任务耗时；小改动与普通任务审查；终末审查的实际执行（归终末 Phase）。

### 停止

- 判据必须引入数字阈值、选择表、动态评分器或第二套审查点才能通过时，停该设计，交 build-plan 作者改契约，不改 AC 自证。
- OCR 不可用：记 unavailable 与检测输出，保留原执行者，不换执行者；高风险与终末审查留缺口交终末验收者。
- 要改审查 schema、OCR 路由或任务事实 writer 时停该处，交对应 Phase owner；其余安全工作继续，不静默越界。

### 完成

需要 `tests/contract/review-tier.test.mjs` 退出 0；evidence_path 保存四夹具输入、实际结论、记录原件与 `ocr --version` 输出；`docs/standard-workflow.md` 读回含 U-020 授权、正向判据与三维命令；`runtime/review/review-policy.mjs` 暴露同一判定与记录校验；三份 OCR 测试的按档断言通过；独立审查原件可定位。真实 OCR 未跑时该项保持 unavailable，不写 pass。

### 风险与回滚

- **风险**: 判据写成不可执行的否定句，或选择依赖数字大小；触发条件是 review-tier 对判据字段与数值输入的断言失败；影响是 AC-REVIEW-002 不过、选择不可重放；缓解是逐面写可核事实与三维命令原读数；回滚到本 Phase 审后提交点。
- **风险**: 子代理审查被记成外部异源；触发条件是记录校验断言失败；影响是来源失真、AC-REVIEW-001 不过；缓解是执行者与来源双记录、外部 OCR 必须有 provider 终态；回滚同上。
- **触发条件**: gate 非零且指向规则或记录断言，或审查发现要改 AC、方向、写集；出现即回退本 Phase diff，不整树回退、不改历史原件。

### 交接知识（给下游 Phase 与审查的已核实事实）

- `docs/standard-workflow.md:33` 的现行规则含「其余输入相同时任一维扩增不得更轻，内容类型不免审」「同输入机械同结论仍未达」「终末完整审」；改写时保留这些约束与终末全审，只把「本轮缺同 cohort 真实质量，仍每 Phase 审、不降对照或投入」的限制换成 U-020 授权规则，并记录这是用户选择。
- `runtime/review/review-policy.mjs:3` 的 `FORMAL_STAGES` 与 `:22` 的 `assertReviewIdentity` 是身份校验唯一入口；新增 tier 判定只消费身份结果，不复制阶段名单，P2 从同一导出读取。
- 三份 OCR 测试已引用现成 adapter 与 route 入口，增补按档断言不改既有 provider 失败与不可用口径。

### T001 — 按风险选审查执行者

- **来源 / FR / AC**: `U-010`、`U-012`、`U-020`、`F2` / `FR-REVIEW-001`、`FR-REVIEW-002` / `AC-REVIEW-001`、`AC-REVIEW-002`；决定：复杂任务每个 Phase 按风险挑审查执行者，低风险用独立子代理、高风险或影响说不清走外部 OCR、终末整卡外部全审；记录执行者与来源，子代理不冒充外部异源；U-020 授权现在启用并记录这是用户选择、不是代理降审；不设数字阈值。
- **文件 / 符号**: `workflows/build-code/SKILL.md` 符号：第 8 步审查条款；`docs/standard-workflow.md` 符号：三审查点与结论真实性段；`runtime/review/review-policy.mjs` 符号：`REVIEW_EXECUTORS`、`reviewTierFor`、`assertReviewTierRecord`；`skills/wh-review/SKILL.md` 符号：审查执行者与来源记录条款；`skills/wh-review/contracts/build-code.md` 符号：审查执行者与来源小节；`docs/architecture/move-map.json` 符号：新增 `tests/contract/review-tier.test.mjs` 条目；`tests/contract/review-tier.test.mjs` 符号：四夹具与 ORACLE-REVIEW-TIER 断言；`tests/contract/ocr-delegation-adapter.test.mjs` 符号：按档执行者与不可用断言；`tests/contract/ocr-delegation-route.test.mjs` 符号：按档路由断言；`tests/contract/ocr-production-cutover.test.mjs` 符号：终末与按档断言。
- **动作**: ① 开工先跑 `ocr --version` 并存检测输出；ENOENT 或低于 1.12.9 记 unavailable，不换执行者。② 先写 `tests/contract/review-tier.test.mjs` 的目标断言并取得真实 RED。③ 在 `runtime/review/review-policy.mjs` 加 `REVIEW_EXECUTORS`（记录字样，不是 schema 枚举）与 `reviewTierFor`：单条确定性规则，不是选择表或动态评分器；输入为五个风险面的具名事实、范围条件两项、三维读数状态；任一风险面为「有」、范围不满足或任一维不可读即外部 OCR；终末固定外部 OCR；同输入同结论，扩维只升不降；接收数字或评分输入抛错。④ 加 `assertReviewTierRecord`：外部 OCR 记录须带 provider 终态，独立子代理记录不得写 `ocr` 身份或伪造 provider_results；执行者、来源、三维读数三项缺一即失败。⑤ 改写 `docs/standard-workflow.md` 规则：写入 U-020 授权与「这是用户选择、不是代理自行降审」，每 Phase 仍审一次；写明三维证据取数命令与任一维缺失或不可读或不可核即外部 OCR；保留任一维扩增不得更轻、内容类型不免审、同输入同结论、终末完整审；去掉缺 cohort 降审句；不设数字阈值、不增选择表或动态评分器或 selector，小改动与普通任务不变。⑥ 更新 `workflows/build-code/SKILL.md` 第 8 步与 `skills/wh-review` 两处正文和合同，要求记录执行者与来源、子代理不写 OCR 身份、OCR 不可用照旧记 unavailable，终末整卡外部全审。⑦ 在三份 OCR 测试补按档断言：低风险不产生 OCR 身份，高风险与终末走外部 OCR，不可用保留原始失败与检测输出。⑧ 在 `docs/architecture/move-map.json` 登记新测试的职责、owner、消费者与删除条件。⑨ 跑 gate 并按「证据只留原始件」留原件。
- **输入**: 只读输入是 decision-log 的 `U-010`/`U-012`/`U-020`/`F2` 与本任务 spec 的 AC-REVIEW-001/002；本 Phase 的实际输入是主会话开工时的五个风险面事实、范围条件、三维原读数与 `ocr --version` 输出。producer 为 P1 实施者；consumer 为 P2 与每个 Phase 主会话；夹具在测试内联构造，不依赖外部服务。
- **输出 / 失败**: 输出风险判定纯函数与记录校验、改写后的规则正文、新合同条款、move-map 条目与 gate 测试。失败语义：风险面或范围输入为数字或评分时抛错，不静默按低风险；任一风险面命中、范围不满足或三维不可读时正常升为外部 OCR；独立子代理记录带 `ocr` 身份或 provider_results 时记录校验抛错；OCR 不可用时记录 unavailable 与检测输出，不冒充通过；同输入两次结论不同则 gate 失败。
- **边界 / 禁止改动**: 不改 `runtime/review/ocr-delegation-adapter.mjs`、`runtime/review/review-record-route.mjs`、`runtime/review/schemas/result.schema.json`、`runtime/task/task-store.mjs`、`runtime/review/stage-materials.json`（路由、记录 writer 与执行者枚举归各自 owner，本 Phase 不新增 schema 字段或枚举）；不改小改动、普通任务与规划路线的审查正文；不改 `docs/adr/**`、`docs/archive/**`、`specs/archive/**` 历史原件；不动标 Frozen 测试。
- **依赖**: none；单卡，无其它 Task 依赖；本 Phase 是计划起点，开工前只核真实工作区与分支。
- **测试层级 / 技能**: 材料合同加定向 vitest 契约；主技能 `skills/backend-testing/SKILL.md` 的「行为测试与证伪」「执行事实」；不跑全量、不跑长任务、不跑真实外部 OCR，条件分支只断言记录与不可用事实。
- **场景 / 夹具或服务**: 四个受控夹具定义见「测试策略」：低风险到独立子代理；高风险到外部 OCR；影响维 undetermined 到外部 OCR；同输入同结论且一维扩增只升不降；另加终末整卡到外部 OCR，OCR 不可用到 unavailable。夹具在 `tests/contract/review-tier.test.mjs` 内内联构造输入与期望，不读写真实工作树、不调外部服务；如需临时文件，结束清理自建目录。
- **预写测试**: `tests/contract/review-tier.test.mjs`（新文件）先写四夹具、终末全审、OCR 不可用与记录来源断言，取得真实 RED 后再实现；本卡不把未执行写成 GREEN。
- **可观察接缝**: 实读 `runtime/review/review-policy.mjs:3` 的 `FORMAL_STAGES` 与 `:22` 的 `assertReviewIdentity` 确认现有入口；`workflows/build-code/SKILL.md:38` 是当前每 Phase 审查条款；`docs/standard-workflow.md:33` 是现行降审规则。产出方是 `reviewTierFor`，持久产物是审查记录原件与 evidence_path，读取方是 gate 测试、build-code 第 8 步与 P2 主会话。
- **RED/GREEN 门禁命令**: `npx vitest run tests/contract/review-tier.test.mjs`
- **预期退出码**: RED nonzero; GREEN 0
- **RED 目标失败**: ORACLE-REVIEW-TIER 的断言在实现前失败：四夹具结论、终末全审定位、记录来源与文档授权检查均不通过；`reviewTierFor` 缺失时按导出断言失败，导入失败另记 setup，不算目标 RED。
- **RED 证据**: unavailable — build-plan 不实施，由 build-code 补真实 RED
- **GREEN 判定器**: ORACLE-REVIEW-TIER：四夹具结论与规则一致，终末整卡固定外部 OCR，OCR 不可用保留 unavailable 与检测输出，记录区分独立子代理与外部 OCR；同一输入重复判定同结论、扩维只升不降；把子代理记成外部异源、引入数字阈值或取消终末全审时退出非零。
- **证据**: `quality/evidence/workflowhub-build-code-efficiency-verify-merge-20261026/P1-review-tier.json` 保存夹具输入、实际结论、记录原件、`ocr --version` 输出与 gate 原始输出；RED 与 GREEN 原件各存一份，同字节复用。
- **覆盖上限**: 只证明本 Phase 的选择规则、记录字段与文档授权可重放；不证明低风险审查质量、不证明子代理发现能力、不证明真实 OCR 可用或终末审查已执行。
- **停止 / 恢复**: 规则需要数字阈值、选择表、动态评分器或第二套审查点才能一致时，停该实现交 build-plan 作者改契约；OCR 不可用时保留 unavailable 与原执行者，不换执行者、不伪造异源；记录字段与现有 schema 冲突时停该处，改用现有原件引用或交 build-plan 作者，不越界改 schema。修复回原 Task，原失败保留。
- **测试变更请求**: none — 三份既有测试未标 Frozen，只增按档断言；实施中若确需改 Frozen 文件，停该处并按测试变更请求与独立审查处理。
- **完成**: AC-REVIEW-001 由四夹具、终末全审定位与执行者记录重放；AC-REVIEW-002 由正向判据、三维命令、U-020 授权与无数字阈值重放；另需 gate 退出 0、真实 `ocr --version` 输出、独立审查原件与 evidence_path 可读。未参与实现的人能用同一命令重放；未执行的 OCR 分支保持 unavailable，不写 pass。

#### 附加条款（T02） 静态表验收

四夹具之外，T001 必须消费任务库 `quality/evidence/research/T02 任务设计复盘.md` 与其所指 `PaperBuilder-paperbuilder-architecture-t02-capacity-fact-floor/specs/paperbuilder-architecture-t02-capacity-fact-floor/phases/index.md` 的十三行。逐 Phase 留原写集/直接消费者/关键风险依据、旧规则执行者、新规则执行者、选择理由与来源指针；证据不足逐行选外部 OCR，不推测低风险。表落本 Phase 现有 `evidence_path` 的 `t02_phase_table`，P12 只引用该原件，不把任选注入替代本项。动作由 T001 实施者执行；命令 `npx vitest run tests/contract/review-tier.test.mjs`，期望退出 0，十三行各有可回读来源且结论可复算；缺一行、无证据却选低风险或删除高风险依据的负例必须非零。历史来源不可读时该条件 unavailable，保留四夹具覆盖，不捏造十三行。

## L2 — 可删除参考

四个夹具的对象名、临时输入字段名与记录样例可在实施时调整；删掉本节不改变 L0/L1 的判据，也不改变 gate。上游决定只供核对，不在本文件另立权威。

## 补充材料

- 验收判据：`spec.md` 的 Appendix A AC-REVIEW-001、AC-REVIEW-002。
- 用户决定原件：`decision-log.md` 的 U-020 与 F2。
