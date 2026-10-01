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
- P1/T002 另拥有 `skills/architect-code-review/SKILL.md` 的既有 verify-code 替代审查 consumer 文案；包摘要仍归 P2，精确边界见 P1 末节。
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
- 依赖：P1、P2、P3 无前序；P4 依赖 P2、P3（CLI 真实 Phase packet 选择范围由 P3/T006 接线；bundle 与 catalog 的收敛先在 P2 完成，P4 只改 runtime、测试、工具与文档，不改任何 `skills/**` 包内被闭包收录的字节）；P5 依赖 P2、P3（以 `phases/P5.md` 头部与 `phases/index.md` 读取规则为准：P5/T012 依赖 P3 交付 `handoffDeclaration` 的 stage 参数；P5/T014 依赖 P2 把 index 模板标题改回 `## Execution Index`）；P6 依赖 P1…P5。
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
| R-006、R-007、R-008、R-009、R-010、R-012；PRD AC-11…AC-15 | FR-DISP-001 / AC-DISP-001；FR-DISP-002 / AC-DISP-002；FR-DISP-003 / AC-DISP-003；FR-SKL-001 / AC-SKL-001；FR-SKL-002 / AC-SKL-002；FR-SKL-003 / AC-SKL-003；FR-RT-001 / AC-RT-001；FR-RT-002 / AC-RT-002；FR-REV-001 / AC-REV-001；FR-REV-002 / AC-REV-002；FR-FIX-001 / AC-FIX-001；FR-FIX-002 / AC-FIX-002；FR-FIX-003 / AC-FIX-003；FR-FIX-004 / AC-FIX-004；FR-ACC-001 / AC-ACC-001 | P6/T015 | ORACLE-ACC-001；任一 ORACLE 未绿或基线红新增即 RED | P1…P5 |

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

### build-plan 实现领地补正：Phase packet producer

AC-REV-001 的真实 packet 选择范围接线由 P3/T006 修改既有 CLI producer，消费 P4 helper；P4 仍负责请求预检、失效记 unavailable、runtime 选择器与编排判据。P4 依赖 P2、P3，精确职责/符号/反例以当前物理 P3、P4 澄清节为准。此补正修复原计划真实 consumer 遗漏，不增加产品方向、stage、gate、schema field 或公共命令。

## build-plan 消费澄清：P6 既有 service 同次执行逐 AC 输出

本节只补齐 Appendix A 现有 15 个 active AC 的 native 执行材料绑定，不增删 AC、FR、stage、gate、命令、schema 字段或 writer。P1…P5 原任务的实施归属不变；P6/T015 只在一次既有 produceCard03Current service 中按各自已有判据复验并形成每 AC 一行。

post projector 从 acceptance Task 的 Source / FR / AC 取全部 AC，acceptance_data 不新增 acceptance_criterion_ids 字段（现投影拒不支持字段）。P6/T015 Source / FR / AC 与本表沿用 15 项；仍恰好一个 acceptance_role=acceptance 的 Task、一个既有 service scenario、一次有范围的命令组。原 AC-ACC-001 aggregate entry 的全部基线38失败/33文件、8 claimed green、14 ORACLE、PRD11…15、机制21判据不削弱；旧 deriveCard03Entry 单 aggregate 合同保留。producer 在同份实际 raw/report/观察上另产 14 个 criterion-specific entries，不能复制 aggregate achieved 标签充数。

每个 AC 按唯一 ORACLE 前缀及对应具体文件/describe、直接观察匹配真实 assertions，保持 expected/actual 与原 raw 出处。每行 assertions 必须非空且包含本 AC 的实测 seam；原件、目标 leaves 或观察缺失→incomplete，owner仍 P6/T015、reason指出真实缺口。没有对应观察的 AC 不能宣称 achieved；不从历史 Phase receipt 拼装 sameexecution leaf，不手写 acceptance_coverage。既有 private service runner 用声明的 15 IDs 与 15 output rows 的相等集合生成 native sameexecution evidence。

原 aggregate 或逐 AC 行失败保留该行 incomplete/owner/reason；既有 service launcher 导入 export 正常返回数据、逐行认证，不调用 CLI main；CLI main 可如实非零。真实进程失败/异常/超时不得伪造成功。source/material/attempt/run 绑定沿现 consumer；独立 review 的未知、P1 fallback、P2 canonical unavailable、P4旧材料意见保持质量限界，测试 achieved 不等于 provider 质量完成。P6 原 producer/test 两文件落实逐 AC 映射；另由 P6/T015 修改既有 `tests/contract/stage-reflection-e2e-constructed.test.mjs` 补 P5/T012 已批准的 public reflect E2E，标准 runtime/public writer 不改。

### T015 逐 AC 真实断言映射

| AC | 必需原断言 IDs | 同次实际测试范围 | 未知/失败语义 |
|---|---|---|---|
| AC-DISP-001 | ORACLE-DISP-001:five-dispatch-sections-cite-agents；ORACLE-DISP-001:describe:tests/contract/card03-dispatch-method.test.mjs | tests/contract/card03-dispatch-method.test.mjs / card-03 T001 dispatch method text (ORACLE-DISP-001) | 缺raw/required leaves/对应观察→incomplete；逐行不复制globalgreen，不扩散ACC派发/G1失败。 |
| AC-DISP-002 | ORACLE-DISP-002:phase-template-fields | tests/contract/card03-skill-bundle-closure.test.mjs / T005 ORACLE-DISP-002 phase 模板声明工作包事实字段 | 缺raw/required leaves/对应观察→incomplete；逐行不复制globalgreen，不扩散ACC派发/G1失败。 |
| AC-DISP-003 | ORACLE-DISP-003:root-progress-archived；ORACLE-DISP-003:describe:tests/contract/card03-dispatch-method.test.mjs | tests/contract/card03-dispatch-method.test.mjs / card-03 T002 document realignment (ORACLE-DISP-003)；tests/p0-foundation-contracts.test.mjs | 缺raw/required leaves/对应观察→incomplete；逐行不复制globalgreen，不扩散ACC派发/G1失败。 |
| AC-SKL-001 | ORACLE-SKL-001:no-per-file-sha；ORACLE-SKL-001:file:tests/skill-provenance-strict.test.mjs | tests/skill-provenance-strict.test.mjs；tests/contract/card03-skill-bundle-closure.test.mjs / T003 ORACLE-SKL-001 skill 包只保留运行时聚合摘要；core/__tests__/check-skill-closure.test.mjs | 缺raw/required leaves/对应观察→incomplete；逐行不复制globalgreen，不扩散ACC派发/G1失败。 |
| AC-SKL-002 | ORACLE-SKL-002:retired-templates-absent；ORACLE-SKL-002:skill-closure；ORACLE-SKL-002:file:tests/contract/material-producer-consumer-roundtrip.test.mjs | tests/contract/material-producer-consumer-roundtrip.test.mjs；tests/contract/card03-skill-bundle-closure.test.mjs / T004 ORACLE-SKL-002 旧模板删除且 skill 闭包转绿；tests/integration/distribution-closure.test.mjs；tests/integration/runner-clean-install.test.mjs | 缺raw/required leaves/对应观察→incomplete；逐行不复制globalgreen，不扩散ACC派发/G1失败。 |
| AC-SKL-003 | ORACLE-SKL-003:describe:tests/contract/card03-review-orchestration.test.mjs | tests/contract/card03-review-orchestration.test.mjs / ORACLE-SKL-003 runner reviewer skills follow stage-skill-plan.json | 缺raw/required leaves/对应观察→incomplete；逐行不复制globalgreen，不扩散ACC派发/G1失败。 |
| AC-RT-001 | ORACLE-RT-001:file:tests/contract/card03-runtime-binding.test.mjs | tests/contract/card03-runtime-binding.test.mjs；tests/contract/business-case-source-binding.test.mjs；tests/contract/business-case-catalog.test.mjs；tests/contract/acceptance-result-machine-classes.test.mjs；tests/contract/build-code-case-reconciliation.test.mjs；tests/contract/research-report.test.mjs | 缺raw/required leaves/对应观察→incomplete；逐行不复制globalgreen，不扩散ACC派发/G1失败。 |
| AC-RT-002 | ORACLE-RT-002:no-review-budget-run-field；ORACLE-RT-002:file:tests/contract/review-budget-deletion.test.mjs | tests/contract/review-budget-deletion.test.mjs | 缺raw/required leaves/对应观察→incomplete；逐行不复制globalgreen，不扩散ACC派发/G1失败。 |
| AC-REV-001 | ORACLE-REV-001:describe:tests/contract/card03-review-orchestration.test.mjs | tests/contract/card03-review-orchestration.test.mjs / ORACLE-REV-001 review request precheck, bad results and packet narrowing；tests/contract/card03-runtime-binding.test.mjs | 缺raw/required leaves/对应观察→incomplete；逐行不复制globalgreen，不扩散ACC派发/G1失败。 |
| AC-REV-002 | ORACLE-REV-002:describe:tests/contract/card03-review-orchestration.test.mjs | tests/contract/card03-review-orchestration.test.mjs / ORACLE-REV-002 partial coverage and same-triple reuse | 缺raw/required leaves/对应观察→incomplete；逐行不复制globalgreen，不扩散ACC派发/G1失败。 |
| AC-FIX-001 | ORACLE-FIX-001:make-decision-needs-decision-log-only；ORACLE-FIX-001:file:tests/contract/material-set-per-stage.test.mjs | tests/contract/material-set-per-stage.test.mjs；tests/contract/stage-reflection-e2e-constructed.test.mjs / CARD-03 P6 post decision-only make-decision public reflection (ORACLE-FIX-001) | 缺raw/required leaves/对应观察→incomplete；逐行不复制globalgreen，不扩散ACC派发/G1失败。 |
| AC-FIX-002 | ORACLE-FIX-002:schema-covers-validator；ORACLE-FIX-002:describe:tests/contract/ac-evidence-schema-domain.test.mjs | tests/contract/ac-evidence-schema-domain.test.mjs / ORACLE-FIX-002 ac-evidence-summary schema domain matches the frozen validator；tests/contract/acceptance-result-machine-classes.test.mjs | 缺raw/required leaves/对应观察→incomplete；逐行不复制globalgreen，不扩散ACC派发/G1失败。 |
| AC-FIX-003 | ORACLE-FIX-003:no-c2-irreversible-rules；ORACLE-FIX-003:file:tests/build-code-diff-only.test.mjs | tests/build-code-diff-only.test.mjs | 缺raw/required leaves/对应观察→incomplete；逐行不复制globalgreen，不扩散ACC派发/G1失败。 |
| AC-FIX-004 | ORACLE-FIX-004:file:tests/contract/build-code-apply-contract.test.mjs；ORACLE-FIX-004:file:tests/contract/review-step-forward-progress.test.mjs；ORACLE-FIX-004:file:tests/contract/post-phase-contract.test.mjs；ORACLE-FIX-004:file:tests/contract/phase-quality-handoff.test.mjs；ORACLE-FIX-004:file:tests/contract/verify-code-binding-derivation.test.mjs | tests/contract/build-code-apply-contract.test.mjs；tests/contract/review-step-forward-progress.test.mjs；tests/contract/post-phase-contract.test.mjs；tests/contract/phase-quality-handoff.test.mjs；tests/contract/verify-code-binding-derivation.test.mjs | 缺raw/required leaves/对应观察→incomplete；逐行不复制globalgreen，不扩散ACC派发/G1失败。 |
| AC-ACC-001 | ALL original deriveCard03Entry assertions unchanged, including BASELINE,14 ORACLE,PRD11…15,MECH21 | all existing declared56path scopes,Node-only andclosure; real host dispatch/context repair sources | 缺raw/required leaves/对应观察→incomplete；逐行不复制globalgreen，不扩散ACC派发/G1失败。 |

每个技术 AC 另有 `<AC>:source-report-readable` expected=true，actual=本行实际报告可解析且无超时/取消/进程错误；`<AC>:required-scope-raw-missing` expected=[]，actual=本行范围缺当前raw清单；`<AC>:required-scope-leaf-failures` expected=[]，actual=本行真实failed/skipped/pending/missing leaves清单。scope断言 `<AC>:scope:<file-or-describe>` expected={status:passed}，actual=本次report的wholeFileStatus/describeStatus。缺描述块不算空绿，assertions非空，禁止placeholder actual。既有global baseline/PRD/G1/21机制断言全部保留在AC-ACC-001，不改变其失败。

已有service launcher导入export后序列化数据，wellformed15rows可让native逐行判leaf；不能主动process.exit(1)把ACACC的事实失败扩散到其他技术行。直接CLI main仍如实exit1；真实运行异常/timeout/cancel/nonzero子过程不洗绿。

### FIX004 同次 consumer 范围补正

`tests/contract/verify-code-binding-derivation.test.mjs` 是 P5/T014 明文消费者且 current89 gate 实际执行。P6 必须将该具名文件加入同一次 FULL_VITEST_FILES/RUN_FILES 和 ORACLE-FIX-004 whole-file 映射，不仅引用历史 P5 receipt。实际范围为 56 logical paths：52 完整 Vitest、3 原受影响选择、1 Node-only；原 55 路径方案保留为历史依据。基线 33 文件、38 失败、8 claimed green 不变。FIX004 omitted/equal/conflict/frozen/nonenumerable/retired nonOCR 与 major OCR 修复负例随真实 current fullfile 执行，缺原raw或leaf仍 incomplete。

## build-plan 工程澄清：implementation receipt rename 双侧生产

Native build-code 实跑在 P6 service 之前暴露既有 production receipt 不一致：同一 baseline/source 下 producer 默认 rename 的 tracked --name-only 只列 destination，consumer 的 --no-renames exact changed-set 列 old deletion 与 new addition。五个 root progress rename 源被生产者遗漏；旧 implementation.changed 101 与实际 106 的失败原件、原 receipt/diff/hash 保留，不能修 baseline 或改 consumer 接受不完整 changed。

此根因回 P3/T006 既有 canonical receipt source/auth 接线 owner。新增声明领地仅 existing `runtime/evidence/canonical-receipt-writer.mjs` 的 `currentImplementationReceipt` tracked-path 命令；唯一生产 consumer 是 `runtime/stage/stage-handlers.mjs#authenticatedImplementationChanged` 的 exact set 校验。最小修改给 tracked git diff --name-only 明确 --no-renames，依现 normalizeRuntimeOnlyPaths 去重/排序及现真实 baseline/source，不改 public API/namespace/schema/object/receipt writer。现 binary patch 命令保持原样；不无依据改 patch，也不放宽 diff/source/hash 验证。

测试只在原 P3 写集、既有 56 inventory 的 `tests/contract/card03-runtime-binding.test.mjs` 追加 describe `CARD-03 implementation receipt rename sides`，复用 existing withPublicPhaseFixture 与 writeCurrentImplementationReceipt→stageRuntimeCliMain(run) 的真实 consumer。临时 Git baseline 在 prepare 前真实 seed oldrename/delete 文件；随后 real rename/delete/add 并声明 physical Phase old/new/delete/add paths。正例 producer.changed exact bothsides、真实 public run 认证成功；负例以新的 content-addressed attacker receipt clone 只去 old rename path而保原 diff/source，真实 strict consumer 必须拒绝。原 canonical receipt/diff bytes/hash 不动，不把攻击 clone 当修复原件；无新测试文件、库存仍 56。

定向新增 RED/GREEN gate：`npx --no-install vitest run tests/contract/card03-runtime-binding.test.mjs -t "CARD-03 implementation receipt rename sides"`。保留旧 101 native fail raw，不覆盖；失败回原 P3 owner。此 gate 只覆盖此次 producer/root cause；原 P3 literal7-file gate 与 runtime-binding whole-file promise 原样保留，具名受影响集合和 P6 实際56路径 service消费不被窄case替代。测试事实不是 provider pass；不可借修复重绑任何旧review/test material轴。owner=P3/T006；consumer=既有 implementation.changed exact auth；保留条件=此 receipt producer/consumer contract 存在，替代或删除时同独立审查同步移除。

## build-plan 既有 consumer 夹具澄清：显式 retry/budget/narrow-diff 材料键

Native P6 同次56路径完整执行已真实暴露 `tests/contract/freeze-classification-budget-usage-protocol.test.mjs` 两条新增失败：`does not trust caller-only retry, budget, or narrow-diff fields` 与 `redispatches changed material and accepts one explicit retry`。两者在调用 provider/retry policy之前由 `recordSimpleReviewRequest` 当前 semantic_fields 预检拒绝 `materials.implementation`（真实 caller :475/:518；consumer :1455）。这不是预算权限改变，测试 bytes 当前等于 HEAD；原完整执行及两失败原文/hash保留，不追加到冻结38、不把targeted7混进冻结38。

owner=P4/T008 请求语义预检与 T009 同材料复用/changedmaterial消费；唯一新增声明文件为上面 existing test，已在现56库存，不增第57文件。只把两个 it 的请求夹具材料键 implementation→implementation_summary（共6处 before/after/third，原value逐字不改），它是当前 build-code/integration 现行语义字段；request 不声明phase，因此不使用 build-code/phase 材料表。不得改 producer、runtime semantic_fields/schema、retry/budget/narrow-diff permission 或 canonical provider角色/身份。

所有原 it 名、assertions/count保留：changedmaterial dispatch2与显式retry第三dispatch/readback复用；caller changed/budget/无basis retry及narrow_diff必须仍blocked_before_dispatch/REVIEW_RETRY_NOT_ADMITTED且dispatch1。不能删或放宽assertion洗绿；若换合法输入后实际policy不同，保真新失败回原 owner，不预认测试通过。

新增受影响具名 RED/GREEN gate：`npx --no-install vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs -t "does not trust caller-only retry, budget, or narrow-diff fields|redispatches changed material and accepts one explicit retry"`。当前完整56路径那两真实TypeError是原始RED，GREEN定向执行两it，全部原P4 literal两文件 gate承诺与其原27真实绿色原件保留，不机械全回归。测试修复不改变旧provider/currentmaterial轴，旧review仍immutable/stale，初始forkall=false/role上下文与G1unknown等方法事实独立保留，不靠这两技术测试改成人为达成。

## build-plan 真实 consumer 澄清：Git diff 路径前缀失败边界

正式 P4 normal result 的 `F-9e8642ea7dd5`（minor）经独立实际消费者调查成立：`compactReviewDiff` 的唯一本次生产消费者是现有 public review packet source projection（tools/cli/stage-runtime.mjs:616），其既有 Git diff producer 未固定 prefix、继承合法 Git config。真实 `git diff --no-prefix` 或 `git -c diff.noprefix=true diff` 可产出无 a/b 的 header，当前 gitDiffPath 对裸 token 与 quoted 解码后 token 均 slice(2)，可能静默腐败路径导致错选/空选。当前普通默认配置未出现该反例，不把任意 caller fake diff 伪称真实 Git 原件；原 canonical review、provider输出/FID/三条 rejected_invalid 与 unknownpair/unavailable事实全部保留。

owner=P4/T008 的现 `runtime/review/review-input-bounds.mjs#gitDiffPath` 和 `compactReviewDiff`。最小修正统一对 raw unquoted token、或完整 quoted/octal 解码得到的 path，先检查以 `a/` 或 `b/` 起始，满足后才 slice(2)；不满足则明确 TypeError（invalid Git section/path prefix），不得静默返回错误或空 path，不得声称缩范围成功。保持 default-full behavior、header两token验证、既有escape/octet错误边界，Unicode/空格/octals/rename old+new 任侧选择原语义不变。不得改真正 Gitproducer flags、skills包字节/摘要、canonical writer或publicreview接口；不新file/schema/store/command。

测试唯一复用现 P4/56 inventory `tests/contract/card03-review-orchestration.test.mjs`，新增 describe `CARD-03 Git diff path prefix boundary`。真实 temporary Git repo seed/commit/改文件后用 git diff --no-prefix 或 -c diff.noprefix=true 获取完整原始输出，保 stdout/实际argv/exit的真实fixture来源；该 raw 直接传现 compactReviewDiff(writeSet) 必须明确拒绝，而不是 wrong/empty selection。至少两个负例轴：裸 no-prefix普通路径；quoted no-prefix 路径（真实非ASCII/可编码字符使Git quote header，实际 token 解码后仍缺前缀）。同一真实输出提供错误/空选择原风险；不得只用手写 malformed header 替代真实 producer负例。既有 normal Git前缀、Unicode/octals/space/rename两侧与完整sections断言一字不删；正例证明合法解码路径仍可选择。原任务计数只记录真实stdout，不虚报固定新增数量。

独立新增受影响 RED/GREEN gate：`npx --no-install vitest run tests/contract/card03-review-orchestration.test.mjs -t "CARD-03 Git diff path prefix boundary"`。原作者先写真实负例，独立 RED 保现silent corruption失败及原 raw；最小helper修后由独立tester GREEN。不改变原 P4 twofile literal gate 承诺；定向通过后仍执行该原命令，其他无源变化的具名范围不机械重复。库存仍56，冻结baseline33/38、8claimed原常量不动。失败回原p1 P4owner，禁止放宽权限/类型错误或删断言洗绿；如问题需要改技能包producer则 STOP 回其原owner，不能擅扩。

## build-plan 领地澄清：P6 承接 P5/T012 的真实 decision-only reflection

P5.md:56 已要求 P6/T015 证明 post make-decision 只有 decision-log.md 时，真实 `run --action=reflect --stage=make-decision` 退出 0。原 pure materialFilesForCohort 观察不能代替此 E2E；既有全材料 build-spec direct runStageEndReflection 构造测试也不能代替 public CLI 路径。

本项 allowed_files/write_set/per-file owner=P6/T015：`tests/acceptance/card-03-current.mjs`、`tests/acceptance/card-03-current.test.mjs`、`tests/contract/stage-reflection-e2e-constructed.test.mjs`；第三文件归 MODIFY，前两文件原 NEW 归属保留。allowed_symbols 限既有 `produceCard03Current`/`deriveTechnicalEntries`/`TECHNICAL_AC_SCOPES` 的 FIX001 同次 scope 接线、P6 unit coverage 正负例、reflection 测试 `runnerFixture` optional post/decision-only 配置、现 `reflectionValue` v2/current-binding 复用，以及具名 describe `CARD-03 P6 post decision-only make-decision public reflection (ORACLE-FIX-001)`。不新增 exported helper、文件、命令、schema、writer、持久权威或 gate。

在隔离真 Git/tempTask 夹具中写真实 post/vnext-single-write 身份，仅 decision-log.md 存在；使用当前真实 fixture task/workspace/snapshot/material 绑定的执行判断，经现 public CLI executed-judgment reflect 路径。正例退出 0 且 stage_row_write 可回读/no stage_row_error，并证明未伪造 spec/index；后续 build-plan/build-code 缺 index 负例仍 fail-loud。fixture executor 仅证明构造端到端，不冒充生产 task/session 的反思。旧完整材料 fixture 默认行为与原 cases 保留。

FIX001 在原 pure function/ORACLE 断言之外，必须从同一次 service 实际 report/raw 消费 `tests/contract/stage-reflection-e2e-constructed.test.mjs / CARD-03 P6 post decision-only make-decision public reflection (ORACLE-FIX-001)`；缺该 describe、raw 或实际叶子，或 skipped/failed/pending/timeout/error 均 incomplete，不能用旧 receipt、build-code native 或 reflection draft 填充。producer 单元 target RED 验证漏此 coverage；若新 runtime E2E 初始已 GREEN，记录真实初始 GREEN，禁止破坏运行时制造 RED。

该文件已在当前52 full Vitest库存，56logical/52full+3restricted+Node 不变；原15AC、33baseline、38冻结失败、8claimed、14ORACLE、21MECH与ACACC全部原断言不变。独立测试先具名 E2E 正负例与 P6 unit；fixture 修改影响旧cases时再复验该既有整文件。真实 native aggregate 的旧失败与完整原件保留，新执行仍需明确授权与当前来源，测试不等独立审查通过。

补充 aggregate 同次覆盖：新增 E2E 不能只进入 TECHNICAL_AC_SCOPES。沿现有 ORACLE_DESCRIBES/deriveCard03Entry 机制追加 `ORACLE-FIX-001:describe:tests/contract/stage-reflection-e2e-constructed.test.mjs`，expected={status:passed}，actual 来自本次真实 `CARD-03 P6 post decision-only make-decision public reflection (ORACLE-FIX-001)` describe；原 AC-ACC-001 全部旧断言保持不改。FIX001 技术行也独立要求同次 scope/report/raw/process/leaf，不能复制 aggregate 结论。新增 unit 反例覆盖 E2E missing/skipped/failed 时 FIX001 与 ACC 的该新增断言均真实失败；存在且所有 leaves passed 时两行该断言真实匹配，ACC 的既有 native/context/G1 adverse/unknown 仍如实 incomplete。新增断言不修改原15AC/14ORACLE、冻结38或门槛。

## build-plan 领地澄清：P3 当前 stage-end acceptance mapping 格式消费

已有 `buildPostAcceptanceChainRows` 被 `currentPostBuildCodeSpecAnalyze` 调用时，固定4列/numeric FR-AC/D标题 reader 无法读当前已批准5列 Source ID/Decision ID/FR / AC/状态/交接与 T 表/typed FR-AC。只在现 consumer 兼容当前物理材料，不重编号/转写批准决定，不新 schema/quality authority/public command。

allowed_files/write_set/per-file owner=P3/T006：既有 `runtime/stage/stage-runner.mjs` 的 `buildPostAcceptanceChainRows`（其内部 mapping header、精确ID族、现decisionLog决定项提取与 coverage_limits 分支）；`currentPostBuildCodeSpecAnalyze` 核既有调用传入真实spec/decisionLog/census；仅可按 `phases/P3.md#build-plan-领地澄清p3-当前-stage-end-已有原生事实投射`消费同次已存在的 acceptance_execution 与其绑定逐 AC 原件，不扩来源集合或制造 refs；以及既有 `tests/contract/census-upstream-authoring.test.mjs` 的具名 describe `CARD-03 stage-end acceptance mapping current headers (ORACLE-RT-001)`。原 census/template tests 保持。该测试已在52full/56logical库存，库存不变。

按表头辨识来源/Source ID、决策/Decision ID、FR与AC分列或组合；legacy4 numeric/D路径原样保留；当前5列仅消费明确FR/AC列，状态/交接列不可误作ID。typed FR-DISP-001/AC-DISP-001等ID保持原名，同族明确有界range才展开，未知语法/歧义表头显式 MATERIAL_INCOMPLETE coverage_limits，不默认成功。legacyD标题仍可回读；当前T仅从认证当前材料明确问答表的问题id/用户选择/选择含义/来源或明确决定项回读，T存在不证明新humanconfirmation；未知T/D不写decision_ids且缺口可见。

R只作追踪边，逐条有效R→U/V边仍必须经 deriveDecisionLogOriginalSourceCensus 的严格来源认证：当前真实source unit、原始bytes/hash/line/speaker及明确index引用都须成立。census其它边的局部错误不得抹去这条已认证边；整体census缺口仍保留，不能宣称完整可信。无census/未知R/未知source保持 source_ids 空或对应缺口，禁止把R当U/V、AI改写当用户逐字来源。真实source census材料由既有materialowner另据原件处理，本生产修复不生成census。缺file_symbol/独立anchors/gate/test/review/stage_end/业务semantic事实仍显式unknown/material_incomplete，不填伪ref消错误。

目标RED：header-aware5列typed/T且trusted构造census的原consumer ID丢失；legacy4numeric/D正例保；未知header/source/decision负例和无censusR拒绝；同族range正例与异族/反向/超界/不完整语法负例；无同次已认证原生事实的纯映射 fixture 仍不得生成 richchain 字段，必须保持原始缺口。新负例不得伪造生产用户census；仅明确标记unit构造材料。独立定向命令 `npx --no-install vitest run tests/contract/census-upstream-authoring.test.mjs -t "CARD-03 stage-end acceptance mapping current headers"`；修复后独立复验该既有wholefile及受影响P3 gate，按新实测失败决定范围，不重复native/全量测试。

## build-plan 领地补充：P3 原始来源 census R-index 当前 T 决策词法

同一 currentPostBuildCodeSpecAnalyze → buildPostAcceptanceChainRows → deriveDecisionLogOriginalSourceCensus 真实 producer 链中，census R-index 原正则只读 D-000，当前已批准 T-000 决策使真实 R→U/V 边被忽略。P3/T006 allowed_files/write_set 增加既有 `runtime/stage/stage-content-contracts.mjs`；allowed_symbols 仅 `deriveDecisionLogOriginalSourceCensus` 内 R-index row 的既有 decision token 词法（legacy D 与 current T，R 本身按实际已声明词法原样保留），不改其他 census/schema/parser。owner=P3 原实施者；consumer=既有 stage-end buildPostAcceptanceChainRows/currentPostBuildCodeSpecAnalyze；替代/删除条件=该既有 census/index consumer 经独立审查替换或删除时同步移除。

不生成 D alias 替 T、不重编号 R/U/V/T，不加字段/export/writer/命令。R-index 的 T 只是原 decision 字段词法，回读决定认证仍归 stage-runner current mapping consumer，不证明 humanconfirmation。U/V 仍只来自有真实引用的用户原话，source_units 原始bytes/hash/line/speaker/aliases保持；design-derived R 合法 trace row 仍 source_refs=[]，不能变用户verbatim，也不能让 buildPostAcceptanceChainRows 的 source_ids 填 R。无真实原文保持 unavailable/unknown，材料owner另处理原始来源，不由代码修复伪造。

测试沿已有P3领地 `tests/contract/census-upstream-authoring.test.mjs` 新describe `CARD-03 census current T index preserves original sources (ORACLE-RT-001)`：明确unit构造U引用＋T index经真实canonical derive可得原R/sourceRefs/T（当前T被漏是真RED）；D legacy不变；design-derived R无U引用 sourceRefs空且不增加原始requirement计数，stage-end trace保持空source_ids/显式缺口；未知U/非用户V/来源别名与原bytes保护负例保，不生成任何当前task假census。既有52full/56logical库存不变。

补充 R-index 决策列表词法：既有 decision 字符串字段允许多个明确 D/T 决策 ID 列表，按原单元格字面（含分隔符）保留，不造 decision、不改为数组或新增字段；legacy multi-D/current multi-T/mixed明确D-T列表同等读取。未知 token/畸形列表显式 census errors，仍非质量许可；词法识别不认证未知T/D，回读决定由既有 stage-runner 独立校验，source_refs/U-V原始字节与speaker语义不变。真实当前20R列表不得为reader改成singleT，18design-derived边保持空source_refs/unknown，4V无可证明R边/hostnative未认证限制继续不足。

## build-plan 领地澄清：P3 当前 stage-end 已有原生事实投射

spec-clarify `trigger=false`；零新增方向选择。锁定产品方向、现有 AC、机器与人写事实分离、原始来源及独立质量语义保持。仅将当前 stage-end 已经认证的原生逐 AC scenario/actual outcome 接入既有消费者；gate/test_result 仅在唯一 scope、真实同次 child 与当前材料 expected_exit/oracle 可绑定时投射，缺失保持不足。缺来源、独立锚点、review或stage_end事实不得合成；本项不构成整链完整或新确认。

唯一工程正文见 [P3 当前 stage-end 已有原生事实投射](phases/P3.md#build-plan-领地澄清p3-当前-stage-end-已有原生事实投射)；符号、字段、测试、负例及 RED/GREEN 范围仅由该 Phase 原件承载。

## build-plan 领地澄清：当前根因修复范围与质量分离

本节仅承接用户已授权的同task根因修复，不重跑build-plan、不改决定或15个active AC，不进入verify-code。P3/T006负责既有 `runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-handlers.mjs` 与 `runtime/stage/completion-predicates.mjs` 的条件gate、有效anchor、逐边来源/逐AC投射、implementation与质量完成分离及当前canonical验收复用；具体边界见 [P3 根因修复](phases/P3.md#build-plan-领地澄清p3-当前根因修复)。P6/T015只承接逐AC scoped事实与aggregate限制，见 [P6 根因修复消费](phases/P6.md#build-plan-领地澄清p6-根因修复消费与冻结库存)。owner、consumer与替代/删除条件均复用这些现有职责，不新增public命令、schema、store、gate或进度权威。

新增focused反例领地归P3/T006：`tests/contract/card03-conditional-acceptance-contract.test.mjs`、`tests/contract/card03-projection-root-causes.test.mjs`、`tests/contract/card03-completion-separation.test.mjs`；邻接真实public consumer仍用既有 `tests/contract/card03-runtime-binding.test.mjs`。新增文件职责登记到move-map由当前实施owner处理。这三文件属于根因修复额外范围，不追加或重写P6冻结52full/56logical库存、33baseline/38失败/8claimed、14ORACLE/21MECH原件；额外GREEN不得漂白历史native/review/方法事实。

仅metadata/材料修订不证明实现已变或所有FR已完成；implementation evidence、implementation_completion、acceptance execution及stage质量分别表达，缺质量保持incomplete/unknown/unavailable。同material_revision/snapshot_tree/scenario只可复用已认证canonical验收原件，无候选或material/snapshot/scenario正常变化时回现有真实执行；候选原件hash/schema/identity损坏时拒绝受影响事实写入并显式报错，仍允许同task修复，不创建cache对象、不跨Phase放宽同一性。不靠本材料更新发新确认或补造证据。

## build-plan 领地澄清：当前受影响验收发布输入

spec-clarify `trigger=false`；无方向变化。本轮仅落实用户已授权的当前受影响验收、既有run真实发布及reflection/handoff，不新增确认、不重跑build-plan、不进入verify-code。唯一私有输入映射及工程正文见 [P6 本轮受影响验收输入](phases/P6.md#build-plan-领地澄清p6-本轮受影响验收输入)；P6原producer与单元测试owner消费该单行物理声明，不复制路径/pattern为第二registry。四runtime根因职责仍归P3；三新focused文件单独canonical测试，不冒入原冻结库存。

## build-plan 领地澄清：当前 verify-code 准备契约

spec-clarify `trigger=false`；本次只补清当前 normal verify-code 请求与已有替代审查文案，不改变产品方向或重跑 build-plan。P4/T008 承接 `runtime/review/stage-materials.json` 的 `surfaces.verify-code.semantic_fields` 唯一漏项及既有 ORACLE-REV-001 的真实正常 request roundtrip/非法键负例，工程正文见 [P4 正常 verify-code 请求语义字段](phases/P4.md#build-plan-领地澄清p4-正常-verify-code-请求语义字段)。P1/T002 仅承接 `skills/architect-code-review/SKILL.md` 对既有 `recordDshCodeReviewResult` → `authenticatedArchitectFallbackResult` → `receipts.quality_review` 的 consumer 文案，见 [P1 既有 Architect 替代审查文案](phases/P1.md#build-plan-领地澄清p1-既有-architect-替代审查文案)。

不新增 public 命令、schema 字段、store、gate、fallback 机制、确认或正式 review/native 执行；其他 stage 材料字段不放宽，坏请求仍在派发前明确失败。Task facts、decision-log、索引及旧 review 原件不由此补正改写；技术修复与定向 GREEN 不能替代当前独立终末审查或 verify-code 完成结论。

P1 文案最终字节后，P2/T003 沿原 `skills/catalog.yaml` 写集串行同步 architect-code-review 单 entry 的既有 `local_bundle_hash` 与 `local_changes` consumer 文案，唯一摘要值源仍为 `validateSkillBundle(...).bundleHash`；精确 consumer、检查与删除条件见 [P2 当前 Architect 文案聚合摘要](phases/P2.md#build-plan-领地澄清p2-当前-architect-文案聚合摘要)。不增加逐文件摘要或第二套 hash 体系。

默认full范围、15active AC及其完整required oracle/scopes不变。定向实跑只产生本轮具名scope事实；未覆盖required IDs/scopes、原失败与raw原因保留，原AC不满足仍incomplete→unknown。既有native reader负责认证及发布，不用局部GREEN或execution完成替代implementation/质量完整；无新public command/schema/store/gate或持久权威。owner、唯一consumer、测试、替代/删除条件按P6原件登记；本材料澄清不含执行、GREEN或质量裁决。
