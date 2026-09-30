# 功能规格：CARD-03 全阶段子代理工作方法落地与残留缺陷收口

> 本文件是本实施 task 的全局实现设计权威：目标翻译、架构边界、跨 Phase 接口、依赖与验证策略。每个 Phase 的精确写集、命令和逐 Task 步骤只在对应 `phases/P<n>.md`。
> 验收正文只在 Appendix A；其余章节只引用 AC 编号。

- **功能名**：CARD-03 全阶段子代理工作方法落地与残留缺陷收口
- **来源**：`decision-log.md` R-001…R-020（`:96-117`）、`## 决定`（`:890-906`）、§二十 路线裁决（`:830-844`）；母 PRD `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:299-310`（FR-11…FR-15、AC-11…AC-15）
- **状态**：build-plan 当前草稿

## 速读卡（30 秒）

- **一句话需求**：把“子代理怎么派、主会话干什么、并行怎么声明、接口改了怎么收场”写进五个正式阶段技能；同时在本卡内修掉原本挂给 CARD-05/CARD-06 的残留缺陷（§二十 用户指示：不外转）。
- **核心改动点**：
  - 五阶段 SKILL 方法章节 + AGENTS.md 三条可观察条款；phase 模板加工作包声明字段。
  - skill 包去逐文件 sha、删旧 plan/tasks 模板；运行时跨 Phase 全量快照绑定收缩。
  - 审查编排四项修复（预检、失效记 unavailable、复用、材料收窄），全部用现有入口与现有值表达。
  - 材料集按阶段区分、schema 枚举补齐、删死规则、修既有红。
- **最大影响面**：五阶段技能文本、skill 分发闭包、质量事实写入、review 记录路径。
- **验收信号**：PRD AC-11…AC-15 真实跑有证据；15 条 ORACLE 各有同命令 RED/GREEN；基线红不新增，本卡负责的红转绿。

## 材料导航

| 章节 | 摘要 | 读取时机 |
| --- | --- | --- |
| `decision-log.md#原始需求` | R-001…R-020 原话与处置 | spec 作者、审查 |
| `decision-log.md#二十build-plan-开场范围回收与六条路线裁决2026-09-29` | 用户六条路线裁决与“默认不做” | 所有 Phase 作者、审查 |
| `decision-log.md#决定` | 本卡方案级决定（T-016…T-025） | P1、P3、P4 作者 |
| `spec.md#实现设计全局权威` | 跨 Phase 接口、失败语义、追踪表 | build-plan、build-code |
| `spec.md#appendix-a--验收判据唯一权威` | 15 条 AC 唯一正文 | build-code、verify-code |
| `phases/index.md#execution-index` | P1…P6 纯指针索引 | build-plan、build-code、verify-code |
| `phases/P6.md` | CARD-03 当前范围验收卡 | verify-code |

## 来源与决策映射

| Source ID | Decision ID | FR / AC | 状态 / 影响面 | 未决 / 交接 |
| --- | --- | --- | --- | --- |
| R-001、R-002、R-003、R-005、R-016…R-018 | T-003、T-006、T-007、T-012、T-014、T-019、T-021 | FR-DISP-001 / AC-DISP-001 | current / 五阶段 SKILL、AGENTS.md | 无 |
| R-004、R-008、R-013 | T-008、T-011、T-022、T-004、T-032 | FR-DISP-002 / AC-DISP-002 | current / phase 模板 | 无 |
| CARD-03 小修决定 | T-023、T-027、T-029、T-030、§四 F-9 | FR-DISP-003 / AC-DISP-003 | current / 文档归位 | 无 |
| R-014、R-015、R-019 | T-005、T-010、T-018、§二十 效力 | FR-RT-001、FR-RT-002 / AC-RT-001、AC-RT-002 | current / runtime 证据绑定 | 注意 card-04 C-18 |
| CARD-03 §二十 | 路线 1…6 | FR-FIX-001…004、FR-SKL-001…003、FR-REV-001…002 / 同号 AC | current / runtime、skills、review | 无 |
| R-006…R-010、R-012 | T-002、T-017 | FR-ACC-001 / AC-ACC-001 | current / 最终验收 | 无 |

## 1. 需求解释：问题与紧迫性

实测三处最贵的浪费：子代理出场继承父代理全部对话（约 42% 会话成本）、空转轮询（27.35% 开销）、跨 Phase 全量快照绑定（60–90 分钟/会话）。方法只存在于 decision-log 而没进阶段技能，下一张卡照样重复浪费。§二十 用户明确要求残留缺陷不转给 CARD-05/CARD-06，本卡内完成。

## 2. 背景、目标与范围

- **背景**：CARD-04 已合入（`40421a46`），T-018/T-013 “等 CARD-04 合并”的时点已满足。
- **目标**：五阶段方法文本可核对；残留缺陷与既有红在本卡收口；不新增任何阻断推进的门。
- **范围内**：skeleton 的 T001…T015 全部条目（见追踪表）。
- **范围外**：见第 10 节。

## 3. 用户场景与状态覆盖

### SCN-001：执行者按阶段技能派活

执行者只读某阶段 SKILL 就知道哪类工作派子代理、子代理不整份继承上下文、不空转轮询、修复回原实施子代理。

### SCN-002：make-decision 阶段收尾

只有 `decision-log.md` 时阶段行不再因 `post Phase index is missing` 停在 provisional；build-plan 及以后缺 index 仍报错。

### SCN-003：审查派发

契约不合格的请求派发前就非零退出、不产生 attempt；结果不合格记 `unavailable` 附原因；同三元组已有 semantic 结果时复用。

### 状态覆盖清单

- 正常：材料齐全、审查结果合格、skill 闭包一致。
- 缺失：make-decision 无 spec.md（合法）；build-plan 无 index（报错）。
- 失效：审查结果形状不合格 → `unavailable`；provider 不可用 → `unavailable`，不改写为通过。

## 4. 产品事实与假设（PFACT）

- **PFACT-001**（verified）：`runtime/task/material-workspace.mjs:9` 为 `["decision-log.md","spec.md","phases/index.md"]`，`:13` 抛 `post Phase index is missing`。
- **PFACT-002**（verified）：`runtime/review/schemas/ac-evidence-summary.schema.json:32-34` 的 result 5 值、leaf_result 4 值、status 6 值；`runtime/evidence/acceptance-evidence-validator.mjs:6` 为 8 值。
- **PFACT-003**（verified）：`C2_IRREVERSIBLE_GIT_RULES` 定义在 `workflows/build-code/diff-scanner.mjs:17`，唯一使用点 `:190`。
- **PFACT-004**（verified）：`tools/cli/stage-runtime.mjs:2006` 仍含 `"review_budget"`。
- **PFACT-005**（verified）：`skills/` 下共 39 个 skill 包，其中 26 个带 `files[].sha256`（P2/T003 只清这 26 个），另外 13 个已经不带（anysearch、design-source-readiness、frontend-component-quality、intake-decision-review、plan-ceo-review、plan-design-review、plan-eng-review、requirement-lineage、resolving-merge-conflicts、review、simplicity-guard、ui-project-init、workflowhub-host-protocol）。
- **PFACT-006**（inferred）：`review-record-route.mjs:1305/:1792/:1898` 的 `allowHistoricalPartialCoverage` 缺陷在 CARD-05 之后仍在；由 P4/T009 先核实。

## 5. 功能需求

### 派发方法（DISP）

- **FR-DISP-001**：五个正式阶段 SKILL 各有“按工作类型派子代理”方法章节，引用 AGENTS.md 为唯一权威；AGENTS.md 有三条可观察条款（不整份继承上下文、不空转轮询、跨 Phase 不做全量快照绑定）；G-1 收场两侧落地；修复回原实施子代理连续上下文。依据：R-001/R-002/R-003/R-005，T-012/T-014/T-019。验收：AC-DISP-001。
- **FR-DISP-002**：phase 模板有工作包声明字段（接口符号清单、合并责任、progress_cursor 指针），声明只是事实记录，不阻断派发；修 `:12` MD028、`:14` MD032。依据：R-004/R-013，T-008/T-022。验收：AC-DISP-002。
- **FR-DISP-003**：小修与归位（T-023、F-9、T-027、T-029、T-030、G14）按 skeleton T002 条目落地。验收：AC-DISP-003。

### skill 包（SKL）

- **FR-SKL-001**：skill-bundle 不再存逐文件 sha，只保留运行时计算的聚合摘要。依据：§二十-5。验收：AC-SKL-001。
- **FR-SKL-002**：删除旧 plan/tasks 模板并修引用测试；roundtrip `:15` 与 skill-closure 3 条既有红转绿。依据：§二十-6。验收：AC-SKL-002。
- **FR-SKL-003**：wh-review runner 的必需技能与 `stage-skill-plan.json` 一致，冻结 plan 不改。build-plan 实读现码：runner 只从 plan.required_skills 选技能，`review-materials.mjs:59` 只是全量 diff 前缀，已经一致；本条由测试锁住现状，不改 runner（§18.4 第 2 条的“不一致”说法在现码不成立）。验收：AC-SKL-003。

### 运行时绑定（RT）

- **FR-RT-001**：质量事实与证据校验不再做跨 Phase 全量快照绑定，只绑该 Phase 声明写集；business-case-catalog 用稳定锚点。依据：T-010/T-018。验收：AC-RT-001。
- **FR-RT-002**：`allowedRunFields` 删除 `review_budget`。验收：AC-RT-002。

### 审查编排（REV）

- **FR-REV-001**：派发前契约预检、失效结果记 `unavailable`+原因、异步走现有 review 入口、审查包只收窄选取范围。依据：§二十-4。验收：AC-REV-001。
- **FR-REV-002**：review-record-route 三缺陷核实后修复；同一三元组 semantic 结果复用。验收：AC-REV-002。

### 残留缺陷（FIX）

- **FR-FIX-001**：材料集按阶段区分。依据：§二十-1。验收：AC-FIX-001。
- **FR-FIX-002**：ac-evidence-summary schema 三个枚举覆盖校验器 8 值 + 一致性测试。依据：§二十-2。验收：AC-FIX-002。
- **FR-FIX-003**：删 `C2_IRREVERSIBLE_GIT_RULES` 死规则。依据：§二十-3。验收：AC-FIX-003。
- **FR-FIX-004**：T-031 四条既有红转绿。验收：AC-FIX-004。

### 验收（ACC）

- **FR-ACC-001**：CARD-03 当前范围验收：PRD AC-11…AC-15 真实跑、全部 ORACLE 汇总、基线红不新增。验收：AC-ACC-001。

## 6. 模块划分

- 方法文本层（P1）：`workflows/*/SKILL.md`、`AGENTS.md`、`CONTEXT.md`、`docs/`。
- 分发闭包层（P2）：`skills/**`、resolver、closure 检查、分发打包。
- 证据绑定层（P3）：`runtime/evidence/**`（`quality-fact.mjs` 除外：保留不改、只作来源记录，不在 P3 写集）、stage-runner、stage-runtime CLI。
- 审查层（P4）：`runtime/review/**`、`skills/wh-review/scripts/*.mjs`。
- 材料与扫描层（P5）：material-workspace、diff-scanner。

## 7. 关键实体

- 工作包声明：读集、写集、文件 owner、接口符号清单、合并责任（事实记录）。
- 聚合摘要：运行时对 canonical 文件闭包计算的单一 hash，不落逐文件值。
- 审查三元组：审查对象种类、Phase、审查范围。

## 8. 数据和生命周期

进度只在 `facts.jsonl` 的 `phase_progress` 单行游标；phase 文件只放 `progress_cursor` 指针（OI-009、T-032）。审查 attempt/result 档案形态不变。

## 9. 兼容性预留

旧 task、receipt、review、`specs/archive/**` 只读保留；删 per-file sha 后，旧 bundle 记录不回写。

## 10. 明确不做与默认必须成立

### 明确不做

- 退役登记的机器读数、M5 机器拦截、§18.5 两条机器读数（新控制面，违背 SD-17 与 card-04 B-08）。
- `docs/architecture/repository-inventory.tsv`（`tests/contract/repository-inventory.test.mjs:31` 逐字节冻结）。
- `--async`、`--action=collect` 新 CLI 动词；`result_invalid` 新 schema 值。
- 改 `tests/contract/acceptance-result-machine-classes.test.mjs`、`skills/wh-review/stage-skill-plan.json`（冻结不动）；`tests/contract/stage-routing-and-concrete-testing.test.mjs` 只冻结 `:92-93` 那条 `required_skills` 断言，其余断言不冻结——`:188` 那条按 card-04 `34b968c3` 已裁决的行为由 P4/T016 改断言，不把删掉的「独立」加回 `workflows/verify-code/steps.json`。
- 审查工具选型与 OCR 委托、3rd-review broker 健康轮询（CARD-05 本职，已完成）。

### 默认必须成立

- card-04 B-02：不加任何阻塞门；fail-fast 预检是报错，不是 gate。
- card-04 B-06：不加哈希绑定、回执、快照或材料身份门；审查包收窄只是选择范围。
- card-04 B-08：不加 schema 新字段、CLI 动词或控制面；G2 是把已有枚举扩到已冻结的 8 值。
- §十九 铁律：不为消除错误伪造 `spec.md` / `phases/index.md`。

## 验收流程

build-code 按 P1…P5 执行各卡 RED→GREEN，P6 在全部完成后跑 PRD AC-11…AC-15 与 ORACLE 汇总；verify-code 以独立上下文判读 AC-12/AC-13 并复核基线。

## 测试标准

只跑受影响的具名测试文件；每条 ORACLE 同一 gate_cmd 先 RED（目标断言失败）后 GREEN（exit 0）；环境失败不算 RED。

## 架构边界

每个路径只属一个 Phase；跨领地修复在卡片 STOP 中写“需回到 Pn owner”，不扩写集。P4 不在 `skills/wh-review` 下增删文件（那会改 bundle files 列表，属 P2）。

## 实现设计（全局权威）

本节只定义跨 Phase 工程事实与接口；逐 Task 动作与精确命令归对应 Phase L1。未观测的执行事实不写成已通过。

### 代码锚点

| 锚点 | 现状（已核实） | 选择 / owner |
| --- | --- | --- |
| `runtime/task/material-workspace.mjs:9`、`:13` | post 材料集固定三件，make-decision 必报 `post Phase index is missing` | 按阶段区分 / P5 |
| `workflows/build-code/diff-scanner.mjs:17`、`:190` | 死规则仅本文件使用 | 删除 / P5 |
| `runtime/review/schemas/ac-evidence-summary.schema.json:32-34` | 枚举少于校验器 8 值 | 补齐 / P4 |
| `runtime/evidence/acceptance-evidence-validator.mjs:6` | 8 值冻结 | 只读 / 不改 |
| `runtime/review/review-record-route.mjs:1410` | `recordSimpleReviewRequest` 无派发前预检 | 加预检 / P4 |
| `runtime/review/review-record-route.mjs:1305`、`:1792`、`:1898`、`:2134` | partial coverage 与只导入缺陷待核实 | 核实后修 / P4 |
| `runtime/review/review-input-bounds.mjs:7`、`:23` | 不按写集收窄 | 收窄选取 / P4 |
| `skills/wh-review/scripts/review-materials.mjs:59` | 只作全量 diff 前缀；runner 只从 plan 的 required_skills 里选技能，本来就和 plan 一致（P4/T010 已核实，本轮实测通过） | 不改 runner；P4/T010 只用锁定测试断言 runner 与 plan 一致 / P4 |
| `skills/wh-review/scripts/simple-review-runner.mjs` | 坏结果静默入账 | 记 unavailable / P4 |
| `runtime/evidence/quality-fact.mjs:48` | 强制 material_revision + snapshot_tree | 保留不改，只作来源记录（P3 核实裁决：改了会破坏 `qualityFactIdentity` 的事实身份；本卡不在 P3 写集）/ P3 |
| `runtime/evidence/freshness.mjs:56`、`:710` | card-04 C-18 validateAcceptanceEvidence 链 | 保持该链语义 / P3 |
| `tools/cli/stage-runtime.mjs:2006` | 残留 `review_budget` | 删除 / P3 |
| `docs/quality/business-case-catalog.json` | `source.revision` 绑整文件 | 稳定锚点 / P3 |
| `runtime/evidence/check-skill-closure.mjs:703-704` | 3 条既有红 | 转绿 / P2 |
| `skills/spec-plan/templates/phase-template.md` | 无 progress_cursor 与接口符号字段 | 加字段 / P2 |

design.md 参考行：T-018 冻结清单 `design.md:1397-1405`；稳定锚点 `design.md:2507-2508`；审查措施 `design.md:3374-3375` 起。

### 接口与失败语义

- **材料集（P5）**：make-decision 只要求 `decision-log.md`；post 且 build-plan 及以后仍要求 `spec.md` + `phases/index.md`，缺失时照旧抛 `post Phase index is missing`。不新增导出命令。
- **schema 枚举（P4）**：result、leaf_result、status 三个枚举都包含校验器 8 值；已有值不删；一致性测试断言“校验器 8 值 ⊆ 每个枚举”。校验器与冻结测试不动。
- **派发前预检（P4）**：`recordSimpleReviewRequest` 入口检查 request/result 恰一、stage 语义字段定义存在、materials 不含语义字段以外的键（不要求全覆盖：design.md:3383 的全覆盖会让 review-material-change-redispatch 现有 10 条只传 approved_spec 的用例变红，build-plan 裁定只拒越界键）、无 host-owned 字段；不要求、不读取 `host_provider`，也不做同源排除或 `minimum_heterologous` 门（decision-log §二十一，已在 build-plan 提前落地）；不过则非零退出并给精确原因，不产生 attempt。这是报错，不是 gate——它落在既有参数校验路径（现码已对 request/result 缺失、宿主字段非零退出），与 `docs/standard-workflow.md:88-92` 禁改区的「review preflight 只记录当前请求的可观测事实，不改变 provider status 的运行时所有权」口径一致：本卡不读不写 provider 健康与状态所有权，禁改区一字不改。
- **失效结果（P4）**：形状不合格的 result 记为现有 `unavailable` 并附原因，不自动重派，不新增状态值。
- **异步（P4 + P1 文本）**：用现有 `review` 入口后台运行，不加 `--async` / `--action=collect`。
- **审查包（P4）**：材料选取范围收窄到该 Phase 声明写集与真实 diff 的交集；不做同一性校验、不拒收阻断。
- **复用（P4）**：同一三元组已有 semantic 结果则复用，不再派发；`unavailable` 也算一次尝试。
- **证据绑定（P3）**：质量事实与证据校验只绑本 Phase 声明写集，不做跨 Phase 全量快照比对；绑定轴用章节编号 / AC 编号稳定锚点。不引入新哈希、回执或快照。
- **skill 闭包（P2）**：bundle 不存 `files[].sha256`；resolver、closure、分发按运行时计算的聚合摘要校验；闭包不一致仍真报失败。
- **失败保真**：provider 失败、unknown、incomplete 如实记录，不改写为通过。

### 全局文件边界与依赖

- 写集按领地划分，一个路径只属一个 Phase，精确路径以各 `phases/P<n>.md` 写集为准。
- 依赖：P1、P2、P3 无前序；P4 依赖 P2（bundle 与 catalog 的收敛先在 P2 完成，P4 只改 runtime、测试、工具与文档，不改任何 `skills/**` 包内被闭包收录的字节）；P5 依赖 P2、P3（以 `phases/P5.md` 头部与 `phases/index.md` 读取规则为准：P5/T012 依赖 P3 交付 `handoffDeclaration` 的 stage 参数；P5/T014 依赖 P2 把 index 模板标题改回 `## Execution Index`）；P6 依赖 P1…P5。
- 跨领地需要时：卡片 STOP 写“需回到 Pn owner”，并报主会话，不扩自己的写集。
- 冻结不动：`runtime/evidence/acceptance-evidence-validator.mjs`、`tests/contract/acceptance-result-machine-classes.test.mjs`、`skills/wh-review/stage-skill-plan.json`、`docs/architecture/repository-inventory.tsv`。另两条**窄化冻结**：`tests/contract/stage-routing-and-concrete-testing.test.mjs` 只有 `:92-93` 继续冻结（`:188` 由 P4/T016 改断言）；`tests/contract/governance-review-dispatch-boundary.test.mjs` 不冻结（`:27` 由 P4/T016 改断言）。

### 需求到任务追踪

每行：来源 → FR → AC → Phase/Task → ORACLE。

| 来源 | FR / AC | Phase / Task | ORACLE / 判据 | 依赖 / 状态 |
| --- | --- | --- | --- | --- |
| R-001、R-002、R-003、R-005、R-016、R-017、R-018；PRD FR-11/12/13/15；CARD-03 T-006、T-007、T-012、T-014、T-019、T-021 | FR-DISP-001 / AC-DISP-001 | P1/T001 | ORACLE-DISP-001；五阶段方法章节与三条可观察条款缺失即 RED | none |
| CARD-03 T-023、T-027、T-029、T-030、§四 F-9、§二十 效力（G14） | FR-DISP-003 / AC-DISP-003 | P1/T002 | ORACLE-DISP-003；旧清单/根目录过程文件/枚举残留即 RED | none |
| CARD-03 §二十-5、T-036 | FR-SKL-001 / AC-SKL-001 | P2/T003 | ORACLE-SKL-001；bundle 仍含逐文件 sha 即 RED | none |
| CARD-03 §二十-6、G22 前提核实、§九 G24 | FR-SKL-002 / AC-SKL-002 | P2/T004 | ORACLE-SKL-002；旧模板存在或 closure 红即 RED | none |
| R-004、R-008、R-013；PRD FR-14；CARD-03 T-008、T-011、T-022、T-032 | FR-DISP-002 / AC-DISP-002 | P2/T005 | ORACLE-DISP-002；模板缺声明字段或 MD028/MD032 即 RED | none |
| R-014、R-015、R-019；CARD-03 T-005、T-010、T-018、§二十 效力 | FR-RT-001 / AC-RT-001 | P3/T006 | ORACLE-RT-001；跨 Phase 全量快照绑定仍生效即 RED | none；守 card-04 C-18 |
| CARD-03 §二十 效力、§十三 | FR-RT-002 / AC-RT-002 | P3/T007 | ORACLE-RT-002；`review_budget` 仍被接受即 RED | none |
| CARD-03 §二十-4、§十三 | FR-REV-001 / AC-REV-001 | P4/T008 | ORACLE-REV-001；坏请求产生 attempt 或坏结果入账即 RED | P2 |
| CARD-03 §二十 效力、A5 I-13 | FR-REV-002 / AC-REV-002 | P4/T009 | ORACLE-REV-002；partial 误判或重复派发即 RED | P2 |
| CARD-03 §18.4 第 2 条、§二十 效力 | FR-SKL-003 / AC-SKL-003 | P4/T010 | ORACLE-SKL-003；runner 必需技能与 plan 不一致即 RED | P2 |
| CARD-03 §二十-2 | FR-FIX-002 / AC-FIX-002 | P4/T011 | ORACLE-FIX-002；枚举缺校验器任一值即 RED | P2 |
| CARD-03 §二十 效力、card-04 `34b968c3`（删除 `host_provider` 与同源排除）、§二十一 | FR-REV-001 / AC-REV-001（沿用 T008 的绑定，不新增 FR/AC） | P4/T016 | ORACLE-REV-001；两条基线红（`governance-review-dispatch-boundary` 1 失败/3、`stage-routing` 1 失败/14）仍失败即 RED | P2 |
| CARD-03 §二十-1、§十九 | FR-FIX-001 / AC-FIX-001 | P5/T012 | ORACLE-FIX-001；make-decision 仍报 index 缺失即 RED | P3 |
| CARD-03 §二十-3 | FR-FIX-003 / AC-FIX-003 | P5/T013 | ORACLE-FIX-003；死规则仍在即 RED | none |
| CARD-03 T-031 | FR-FIX-004 / AC-FIX-004 | P5/T014 | ORACLE-FIX-004；四条既有红仍失败即 RED | P2 |
| R-006、R-007、R-008、R-009、R-010、R-012；PRD AC-11…AC-15 | FR-ACC-001 / AC-ACC-001 | P6/T015 | ORACLE-ACC-001；任一 ORACLE 未绿或基线红新增即 RED | P1…P5 |

### 全局验证策略

- 只跑具名文件，禁止无范围 `vitest`、`npm test`、`test:safe`、`test:contract`。
- 定向入口示例：`npx --no-install vitest run tests/contract/material-set-per-stage.test.mjs tests/contract/ac-evidence-schema-domain.test.mjs tests/build-code-diff-only.test.mjs`；skill 闭包：`node runtime/evidence/check-skill-closure.mjs`。
- 每个 Task 的 gate_cmd、RED 目标断言、GREEN 判定器在 Phase 卡中；RED 必须是目标断言失败，夹具/环境失败不算。
- 基线：33 文件 / 15 失败文件 / 38 失败测试 + skill-closure 3 条（原件 `specs/workflowhub-thin-core-card-03-20260919/evidence/build-plan/red/*.txt`，路径映射见同目录 `evidence/build-plan/README.md`）。其中两条基线红**已指派要修**：`tests/contract/governance-review-dispatch-boundary.test.mjs`、`tests/contract/stage-routing-and-concrete-testing.test.mjs`，归属 P4/T016，不是基线之内静默留红；其余基线红本卡不新增、也不要求转绿。
- 结构测试 exit 0 只证明所测断言；AC-12/AC-13 的主会话读写与并行声明由 verify-code 独立上下文人工判读。
### 机制回读（M1–M5 与 E1–E16；design.md:3424 的 build-plan 阶段复核）

`design.md:3424` 与 `decision-log.md:690` 写明：M1–M5 与 E1–E16 在本卡内是**文本级落地**，进入 `workflows/**`、`skills/**` 后的实际生效路径由 **build-plan 阶段复核**。这一节就是该复核结论：逐条给出落点（行号是 HEAD `8b2ca1d9` 时点的快照，可能随 P1/T001 插入章节而平移；可重复判据是锚点文本，不是行号）、谁在什么时候读它、本卡内可重复运行的验证、以及没生效会不会重演 PaperBuilder 同类事故。

落点行号会随 P1/T001 插入章节而平移，所以可重复形态只锚**文本**、不锚行号：机器形态是 P6/T015 的「机制回读」断言组（21 条，一次跑完），原件写 `quality/tests/card03/P6/mech-readback/anchor-grep.txt`；下面每行的「验证」列给的就是那条锚点文本——逐字复制自落点文件当前内容，可用 `grep -F` 在落点文件里命中。这些落点文件分别归 P1（`workflows/**`、`AGENTS.md`）与 P2（`skills/**` 包字节与 `skills/catalog.yaml`）领地；本复核只读，不改任何落点文件。

| 条目 | 落点（文件:行） | 谁在什么时候读它 | 本卡内可重复运行的验证（锚点文本） | 未生效会重演什么 |
| --- | --- | --- | --- | --- |
| M1 计划交付三选一 | `workflows/build-plan/SKILL.md:143-146`；`docs/standard-workflow.md:281-283` | build-plan 主会话在既有确认点 step 12 `publish-result-and-confirm` 提问时读；后者由人读 | P6/T015 机制回读断言组（M1）：锚点文本「确认问题按**三选一**提出」 | 计划带着已知缺口默认通过，三选一话术与「未答不阻断」都失效，缺口到下游才暴露 |
| M2 收尾三件事 | `workflows/build-code/SKILL.md:288-291`（人读三词）、`:352-357`（按字面跑 route 与 gate_cmd／原始输出写 evidence_path／交付锚＝一次 commit） | build-code 主会话在每个 Phase 收尾时读；runtime 侧由 `validatePostPhaseContract`（`runtime/stage/stage-content-contracts.mjs:7247`、`:7250`、`:7293`、`:7566`、`:8012`）强制 `gate_cmd` 与 `evidence_path` 非空 | P6/T015 机制回读断言组（M2）：锚点文本「执行本 Phase 记录的那条 route 与其 `gate_cmd`，命令按字面跑，不换成别的命令，也不用全量回归代替」 | PaperBuilder 会话里这条判据最早在第 26.3 h 就能触发（比实际早 64.3 h）：不会「按字面跑 gate_cmd、原始输出写 evidence_path、拿一次 commit 当交付锚」 |
| M3 卡住判据 | `workflows/build-code/SKILL.md:272-275`（自述一行「自上次以来我改了什么」＋失败信号「与上次相同／已变」，无阈值；升级纪律复用 `AGENTS.md:32-37`） | build-code 主会话在重试前读；人按 `AGENTS.md` 的升级纪律处置 | P6/T015 机制回读断言组（M3）：锚点文本「重试前自述一行并写进本 Phase 的 task facts」 | 最早第 22.62 h 就能判卡住（比实际早 79.3 h）；没有这一行，同一失败信号被反复重试 |
| M4 加减同价 | `skills/plan-eng-review/SKILL.md:78-83`；`skills/spec-plan/templates/phase-template.md:123`/`:125`（机器必填锚）；`skills/decision-log/templates/decision-log-template.md:314-325`；`AGENTS.md:68` | plan-eng-review 审查时读第一条；build-plan 写 Phase 文件时按模板槽位填；make-decision 主会话写退役登记时读模板 | P6/T015 机制回读断言组（M4）：锚点文本「加删同价的读数（report-only）」 | 只加不删：删除类 finding 不报数、退役登记缺「原来的需求编号」，材料与需求持续膨胀 |
| M5 销毁性动作 | `workflows/build-code/SKILL.md:379-383`（适用既有 F7 不可逆授权边界，纪律条款） | build-code 主会话在执行整树丢弃或整体替换权威材料前读 | P6/T015 机制回读断言组（M5）：锚点文本「整树丢弃类动作（`git restore/reset/checkout -- :/`）与 delete+add 整体替换权威材料属于**销毁性动作**」；`grep -rn "git checkout" runtime/ tools/cli/` 实测零命中（没有机器拦截点，如实登记） | PaperBuilder 会话的危险动作最早在第 90.58 h／96.46 h 出现：销毁性动作被当成阶段确认的一部分顺带授权 |
| E1 Task 粒度 | `skills/spec-plan/SKILL.md:14` | spec-plan 技能写作时读 | P6/T015 机制回读断言组（E1）：锚点文本「One Task is one user-perceivable delivery increment」 | 每条风险与未验证项都升格成一张卡，卡片数只增不减 |
| E2 被取代的全文不留活文件 | `skills/spec-plan/SKILL.md:12` | spec-plan 技能写作时读 | P6/T015 机制回读断言组（E2）：锚点文本「A superseded full-text body does not stay in this file either」（旧句已删，不得加回：被取代的正文由 git 与既有 archives 承载） | 活文件里堆多份互相取代的正文，读者分不清当前权威 |
| E3 删绝对化半句 | `skills/decision-log/SKILL.md:24-25` | decision-log 技能写作时读 | P6/T015 机制回读断言组（E3）：锚点文本「The main document and every accepted omission use the same」（旧绝对化半句已删，不得加回：本句只陈述两者同用一份 `decision-entry.v1` shape） | 全部登记等重，减法载体不可读 |
| E4 load-bearing finding | `skills/decision-log/SKILL.md:148` | decision-log 技能写作时读 | P6/T015 机制回读断言组（E4）：锚点文本「load-bearing review finding, and load-bearing decision.」 | review finding 噪音淹没真正承重的发现 |
| E5 输入装配读三类减法载体 | `workflows/build-plan/SKILL.md:202` | build-plan 主会话装配输入时读 | P6/T015 机制回读断言组（E5）：锚点文本「is a legitimate registration, not a gap to close.」 | accepted「不做」被当成待补缺口，反复回炉 |
| E6 切片两条件 | `workflows/build-plan/SKILL.md:292` | build-plan 主会话切片时读 | P6/T015 机制回读断言组（E6）：锚点文本「the split must pass two checks — there is at least one slice」 | 超出一次可读上限时继续往同一份里写，而不是把问题拆小 |
| E7 非目标定义 | `skills/spec-plan/templates/phase-template.md:39` | build-plan 写 Phase 文件时按模板槽位填 | P6/T015 机制回读断言组（E7）：锚点文本「本来可以成为要做的目标、但本 Phase 明确不选的项，写清不选的理由；不要写成否定句」 | 非目标写成否定句或拿「防止范围膨胀」当理由，下游无法判断本可做什么 |
| E8 主要风险写替代走法 | `skills/spec-plan/templates/phase-template.md:43` | 同上 | P6/T015 机制回读断言组（E8）：锚点文本「最可能让本 Phase 返工的一件事，以及**若因它返工，替代走法是什么**」 | 真因它返工时不知道该换哪条路 |
| E9 验收项能一条命令重放 | `skills/spec-plan/templates/phase-template.md:34`、`:185` | build-plan 写 Phase 文件时填；verify-code 判读时读 | P6/T015 机制回读断言组（E9）：锚点文本「验收项必须写成**没参与实现的人能用一条命令重放**的判据」 | 写不出重放命令的验收项被记成达成 |
| E10 续跑先对现实 | `workflows/build-code/SKILL.md:256` | build-code 主会话续跑第一步读 | P6/T015 机制回读断言组（E10）：锚点文本「续跑的第一步是**先对现实**：跑 `git status --short`，再跑本 Phase」 | 照材料而不是照现实续跑（材料与代码冲突时没按「代码赢」） |
| E11 remaining risks 成句解读 | `workflows/build-code/SKILL.md:367` | build-code 主会话写六段摘要时读 | P6/T015 机制回读断言组（E11）：锚点文本「`remaining risks` 段必须对本期**失败信号**给一句成句解读」 | 失败信号只被罗列，不给成句解读 |
| E12 进展＝交付锚 | `workflows/build-code/SKILL.md:357`（自指 `:272-275`） | build-code 主会话报进展时读 | P6/T015 机制回读断言组（E12）：锚点文本「**进展 = 交付锚**（新提交或新证据），不是动作次数」 | 进展按动作次数计，拿不出外部锚也继续 |
| E13 完成声明的上限 | `docs/standard-workflow.md:305` | verify-code 与完成声明时读 | P6/T015 机制回读断言组（E13）：锚点文本「**完成声明的上限 = 独立来源的结论**；该结论为 `adverse` 或 `unavailable` 时，只能声明到该结论允许的程度」 | `adverse`/`unavailable` 时被声明成更强结论（只限措辞、不阻断同任务内修复） |
| E14 simplicity-guard 调用点与输出形态 | `skills/simplicity-guard/SKILL.md:93-106`（新节「写作流程中的调用点与输出形态」） | spec-specify／spec-plan 两个写作点与审查点调用时读 | P6/T015 机制回读断言组（E14）：锚点文本「的结论在写作流程里有三处调用点，全部落在既有字段上，不新增产物或字段」 | 减法没有调用点，写了也没人读，空态「已读，无可删内容」被当成失败 |
| E15 spec-specify 调用点 | `skills/spec-specify/SKILL.md:46` | spec-specify 技能写作时读 | P6/T015 机制回读断言组（E15）：锚点文本「self-check with `simplicity-guard`'s core questions (has this layer earned its place」 | 核心问题不在写作点自检，臃肿进入下游 |
| E16 spec-plan 调用点 | `skills/spec-plan/SKILL.md:20` | spec-plan 技能写作时读 | P6/T015 机制回读断言组（E16）：锚点文本「run the same self-check with `simplicity-guard`'s core questions」 | 同上，减法纪律停在文本层 |

- 回读口径：21 条逐条按上表锚点文本可重复运行；M2 另有 runtime 既有强制点承担机器侧；M5 明确没有机器拦截点（`design.md:3448-3449` 如实登记），不假装已机器化。E14 是唯一净增行数的一处（`skills/simplicity-guard/SKILL.md` ＋15 行），其余落点全部净 0（`design.md:3471`）。
- M2／M3／M5 行的小时数（`26.3`／`64.3`、`22.62`／`79.3`、`90.58`／`96.46`）取自沙盘回放 `specs/workflowhub-thin-core-card-03-20260919/evidence/forensics/replay.md`（原点＝转录首行 `2026-09-25T04:36:55.403Z`）；它们**不在** `design.md`／`decision-log.md` 正文里，也不是本节下面 §15／§16 那套落地依据与哈希链的一部分。
- 落地依据与哈希链（改前→改后）见 `design.md` §15/§16 与 `decision-log.md` §十七/§十八；本节的复核对象是「文本是否真在指定文件、是否有人读、能不能重复验证」，不重新裁决机制本身。

## Appendix A — 验收判据（唯一权威）

- [ ] **AC-DISP-001**：五阶段派发方法落地
验证：读五个正式阶段 SKILL 与 AGENTS.md，跑 `tests/contract/card03-dispatch-method.test.mjs`。
通过：五个 SKILL 各有方法章节并引用 AGENTS.md；AGENTS.md 三条可观察条款齐；G-1 在 build-plan/build-code 两侧各写各的角色并交叉引用；有修复回原实施子代理条款。
失败：任一阶段缺章节、条款只是原则无可核对动作、G-1 只写一侧。
证据：`test` + 文本锚点。

- [ ] **AC-DISP-002**：phase 模板工作包声明字段
验证：读 `skills/spec-plan/templates/phase-template.md` 并跑对应契约测试。
通过：含接口符号清单、合并责任、progress_cursor 字段，标明是事实记录不阻断派发；`:12`、`:14` 无 MD028/MD032。
失败：字段缺失、写成派发前置、出现第二处进度状态值。
证据：`test`。

- [ ] **AC-DISP-003**：小修与归位
验证：核对 T002 所列锚点，跑 `tests/p0-foundation-contracts.test.mjs`。
通过：CONTEXT.md、make-decision SKILL、stage-atomic-step-inventory、build-plan SKILL 按决定改完；五个根目录过程文件已 git mv 到 `docs/archive/retired-root-progress/`；build-code SKILL 有 finding 分级消费。
失败：任一项未改或引用断链。
证据：`test` + git diff。

- [ ] **AC-SKL-001**：去逐文件 sha
验证：扫描 39 个 skill-bundle.json，跑 skill 闭包与分发测试。
通过：无 `files[].sha256`；聚合摘要仍能发现文件篡改。
失败：残留逐文件 sha，或闭包对篡改不报错。
证据：`test` + `node runtime/evidence/check-skill-closure.mjs` 退出码。

- [ ] **AC-SKL-002**：删旧模板与闭包红转绿
验证：检查两个旧模板文件，跑 roundtrip 测试与 closure 检查。
通过：两个模板已删，引用测试已改且通过；roundtrip `:15` 与 closure 3 条红转绿。
失败：模板仍在、测试仍引用，或红仍在。
证据：`test`。

- [ ] **AC-SKL-003**：review runner 与 plan 一致
验证：跑 wh-review 材料相关测试与 stage-routing 冻结测试。
通过：runner 必需技能与 `stage-skill-plan.json` 一致，由锁定测试断言；冻结 plan 与测试未改且通过。
失败：改了冻结文件，或 runner 选了 plan.required_skills 以外的必需技能。
证据：`test`。

- [ ] **AC-RT-001**：运行时绑定收缩
验证：跑 `tests/contract/card03-runtime-binding.test.mjs`。
通过：别的 Phase 的文件变化不会使本 Phase 质量事实失效；本 Phase 写集变化仍能被发现；business-case-catalog 用稳定锚点；C-18 链测试仍绿。
失败：跨 Phase 全量快照仍参与比对，或写集内变化不再被发现，或新增哈希/回执门。
证据：`test`。

- [ ] **AC-RT-002**：删除 review_budget 残留
验证：跑 `tests/contract/review-budget-deletion.test.mjs`。
通过：`allowedRunFields` 不含 `review_budget`，测试通过。
失败：仍接受该字段。
证据：`test`。

- [ ] **AC-REV-001**：审查编排修复
验证：跑 `tests/contract/card03-review-orchestration.test.mjs`。
通过：坏请求非零退出且不产生 attempt；坏结果记 `unavailable` 附原因且不自动重派；无新 CLI 动词与新 schema 值；审查包只含写集与 diff 交集。
失败：任一反例成立，或引入阻断门/同一性校验。
证据：`test`。

- [ ] **AC-REV-002**：route 缺陷与复用
验证：先核实三缺陷现状，再跑对应测试。
通过：partial coverage 不再被历史标记放行；同三元组已有 semantic 结果时不再派发；已被 CARD-05 修掉的项如实记“本来就通过”。
失败：缺陷仍在，或同三元组重复派发。
证据：`test`。

- [ ] **AC-FIX-001**：材料集按阶段区分
验证：跑 `tests/contract/material-set-per-stage.test.mjs`。
通过：make-decision 只有 decision-log.md 时不报错；build-plan 起缺 index 仍报 `post Phase index is missing`。
失败：make-decision 仍报错，或后续阶段不再要求 index。
证据：`test`。

- [ ] **AC-FIX-002**：schema 枚举补齐
验证：跑 `tests/contract/ac-evidence-schema-domain.test.mjs` 与冻结测试。
通过：三个枚举都含校验器 8 值；一致性测试通过；冻结测试未改且通过。
失败：缺任一值或改了校验器/冻结测试。
证据：`test`。

- [ ] **AC-FIX-003**：删死规则
验证：跑 `tests/build-code-diff-only.test.mjs` 并搜索常量名。
通过：常量与使用点已删，测试保持绿。
失败：常量仍在或测试转红。
证据：`test`。

- [ ] **AC-FIX-004**：T-031 既有红转绿
验证：跑 `tests/contract/build-code-apply-contract.test.mjs` 与 `tests/contract/review-step-forward-progress.test.mjs`。
通过：`:15`、`:31`、`:57`、`:97` 四条均通过，且未删断言充数。
失败：任一仍红，或以删断言代替修复。
证据：`test`。

- [ ] **AC-ACC-001**：CARD-03 当前范围验收
验证：跑 `tests/acceptance/card-03-current.test.mjs`，并由独立上下文判读 PRD AC-11…AC-15。
通过：PRD AC-11…AC-15 各有真实证据或明确不适用理由（build-prd）；14 条 ORACLE 汇总全绿；基线红不新增，本卡负责的转绿。
失败：任一 ORACLE 未绿、基线红新增、自审自判，或用计划正文冒充执行证据。
证据：`test` + `evidence` + 独立审查记录。

## 12. 风险、未决与交接

- **status 枚举词汇不同**：status 现为 passed/failed 一套，补 8 值会出现两套词并存；P4 作者核实消费方后在卡片风险里写明，不删现有值。
- **G16 现状未知**：CARD-05 之后可能已修；P4/T009 先读回，已修的归类“本来就通过”。
- **C-18 链**：P3 改 freshness 时必须保持 `validateAcceptanceEvidence` 行为，其测试列入 P3 回归。
- **跨领地修复**：任何 Phase 发现要改别人的文件，写 STOP 并回报主会话。
- **残余风险 3-a（审查派发；与 design.md 的「残余风险 3」不是同一条）**：材料写少了不会被拦——派发前预检只拒不在 `semantic_fields` 里的越界键，不要求材料键全覆盖（`runtime/review/schemas/stage-materials.schema.json:73` 对这些字段没有“必填”标记，加标记＝新 schema 字段，撞 B-08），所以包不齐也可能派发成功、随后返回零发现，是 43% 空 attempt 的一个来源。按 SD-17 如实登记、不阻断推进；完整裁决见 `phases/P4.md:170`。原拟登记到 `design.md` §16.4 残余风险列表，但 `design.md` 不在任何 Phase 的 Write set 里、没有合法 writer，故登记到本材料。

## 13. 业务影响与回归范围

- 五阶段执行者：派活方法有了单一文本权威。
- skill 分发：bundle 不再随文件内容变，减少 sha 链重算。
- 质量事实：别的 Phase 改动不再使本 Phase 证据失效。
- 回归范围：各 Phase 写集内测试 + 基线红清单，不跑全量。
