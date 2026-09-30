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
- **PFACT-005**（verified）：39 个 `skills/*/skill-bundle.json` 带 `files[].sha256`。
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
- 证据绑定层（P3）：`runtime/evidence/**`、stage-runner、stage-runtime CLI。
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
- 改 `tests/contract/acceptance-result-machine-classes.test.mjs`、`skills/wh-review/stage-skill-plan.json`、`tests/contract/stage-routing-and-concrete-testing.test.mjs:92-93`。
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
| `skills/wh-review/scripts/review-materials.mjs:59` | 把 plan-eng-review 当必需 | 对齐 plan / P4 |
| `skills/wh-review/scripts/simple-review-runner.mjs` | 坏结果静默入账 | 记 unavailable / P4 |
| `runtime/evidence/quality-fact.mjs:48` | 强制 material_revision + snapshot_tree | 收缩到写集 / P3 |
| `runtime/evidence/freshness.mjs:56`、`:710` | card-04 C-18 validateAcceptanceEvidence 链 | 保持该链语义 / P3 |
| `tools/cli/stage-runtime.mjs:2006` | 残留 `review_budget` | 删除 / P3 |
| `docs/quality/business-case-catalog.json` | `source.revision` 绑整文件 | 稳定锚点 / P3 |
| `runtime/evidence/check-skill-closure.mjs:703-704` | 3 条既有红 | 转绿 / P2 |
| `skills/spec-plan/templates/phase-template.md` | 无 progress_cursor 与接口符号字段 | 加字段 / P2 |

design.md 参考行：T-018 冻结清单 `design.md:1397-1405`；稳定锚点 `design.md:2507-2508`；审查措施 `design.md:3374-3375` 起。

### 接口与失败语义

- **材料集（P5）**：make-decision 只要求 `decision-log.md`；post 且 build-plan 及以后仍要求 `spec.md` + `phases/index.md`，缺失时照旧抛 `post Phase index is missing`。不新增导出命令。
- **schema 枚举（P4）**：result、leaf_result、status 三个枚举都包含校验器 8 值；已有值不删；一致性测试断言“校验器 8 值 ⊆ 每个枚举”。校验器与冻结测试不动。
- **派发前预检（P4）**：`recordSimpleReviewRequest` 入口检查 request/result 恰一、stage 语义字段定义存在、materials 不含语义字段以外的键（不要求全覆盖：design.md:3383 的全覆盖会让 review-material-change-redispatch 现有 10 条只传 approved_spec 的用例变红，build-plan 裁定只拒越界键）、无 host-owned 字段；不要求、不读取 `host_provider`，也不做同源排除或 `minimum_heterologous` 门（decision-log §二十一，已在 build-plan 提前落地）；不过则非零退出并给精确原因，不产生 attempt。这是报错，不是 gate。
- **失效结果（P4）**：形状不合格的 result 记为现有 `unavailable` 并附原因，不自动重派，不新增状态值。
- **异步（P4 + P1 文本）**：用现有 `review` 入口后台运行，不加 `--async` / `--action=collect`。
- **审查包（P4）**：材料选取范围收窄到该 Phase 声明写集与真实 diff 的交集；不做同一性校验、不拒收阻断。
- **复用（P4）**：同一三元组已有 semantic 结果则复用，不再派发；`unavailable` 也算一次尝试。
- **证据绑定（P3）**：质量事实与证据校验只绑本 Phase 声明写集，不做跨 Phase 全量快照比对；绑定轴用章节编号 / AC 编号稳定锚点。不引入新哈希、回执或快照。
- **skill 闭包（P2）**：bundle 不存 `files[].sha256`；resolver、closure、分发按运行时计算的聚合摘要校验；闭包不一致仍真报失败。
- **失败保真**：provider 失败、unknown、incomplete 如实记录，不改写为通过。

### 全局文件边界与依赖

- 写集按领地划分，一个路径只属一个 Phase，精确路径以各 `phases/P<n>.md` 写集为准。
- 依赖：P1、P2、P3、P5 无前序；P4 依赖 P2（bundle 先不随文件内容变，P4 改 wh-review 脚本才不必碰 bundle）；P6 依赖 P1…P5。
- 跨领地需要时：卡片 STOP 写“需回到 Pn owner”，并报主会话，不扩自己的写集。
- 冻结不动：`runtime/evidence/acceptance-evidence-validator.mjs`、`tests/contract/acceptance-result-machine-classes.test.mjs`、`skills/wh-review/stage-skill-plan.json`、`docs/architecture/repository-inventory.tsv`。

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
| CARD-03 §二十-1、§十九 | FR-FIX-001 / AC-FIX-001 | P5/T012 | ORACLE-FIX-001；make-decision 仍报 index 缺失即 RED | none |
| CARD-03 §二十-3 | FR-FIX-003 / AC-FIX-003 | P5/T013 | ORACLE-FIX-003；死规则仍在即 RED | none |
| CARD-03 T-031 | FR-FIX-004 / AC-FIX-004 | P5/T014 | ORACLE-FIX-004；四条既有红仍失败即 RED | none |
| R-006、R-007、R-008、R-009、R-010、R-012；PRD AC-11…AC-15 | FR-ACC-001 / AC-ACC-001 | P6/T015 | ORACLE-ACC-001；任一 ORACLE 未绿或基线红新增即 RED | P1…P5 |

### 全局验证策略

- 只跑具名文件，禁止无范围 `vitest`、`npm test`、`test:safe`、`test:contract`。
- 定向入口示例：`npx --no-install vitest run tests/contract/material-set-per-stage.test.mjs tests/contract/ac-evidence-schema-domain.test.mjs tests/build-code-diff-only.test.mjs`；skill 闭包：`node runtime/evidence/check-skill-closure.mjs`。
- 每个 Task 的 gate_cmd、RED 目标断言、GREEN 判定器在 Phase 卡中；RED 必须是目标断言失败，夹具/环境失败不算。
- 基线：33 文件 / 15 失败文件 / 38 失败测试 + skill-closure 3 条（`/tmp/card03-bp/red/*.txt`）；本卡负责的转绿，其余不新增。
- 结构测试 exit 0 只证明所测断言；AC-12/AC-13 的主会话读写与并行声明由 verify-code 独立上下文人工判读。

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

## 13. 业务影响与回归范围

- 五阶段执行者：派活方法有了单一文本权威。
- skill 分发：bundle 不再随文件内容变，减少 sha 链重算。
- 质量事实：别的 Phase 改动不再使本 Phase 证据失效。
- 回归范围：各 Phase 写集内测试 + 基线红清单，不跑全量。
