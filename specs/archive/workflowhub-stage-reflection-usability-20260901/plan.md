# 实现计划：stage-reflection 复盘器可用性与信息质量改造

- **Input**：`specs/workflowhub-stage-reflection-usability-20260901/decision-log.md`、`specs/workflowhub-stage-reflection-usability-20260901/spec.md`；当前 SHA-256 见外部 manifest `quality/evidence/material-hashes-20260901.json`（早期 hash 仅保留为历史 provenance）
- **Template version**：`plan-task.v3`
- **Current-material audit**：当前 SHA-256 见外部 manifest `quality/evidence/material-hashes-20260901.json`；仅记录材料 provenance，不是 build-code 或验收授权。

## Quick Read

- **Goal**：复盘器生产可用（reflect 执行闭环 + 诚实五态）、信息质量升级（六类问题 + v2 事实投影）、20 条历史教训一次性正式入库，并让已合入 main 的 M16 消费侧正确识别 v1/v2/可用性事实/历史回放；全部保持既有契约测试绿。
- **Non-goals**：不重建遥测、不改五阶段主骨架语义（runner 仅两处）、不做每任务回填机制、不新增公共行为类、不重建或扩展 M16 data-plane、不改 M16 候选身份/两档阈值/锁与 CAS/趋势区布局、不做行级历史证据/operational_tail/真实业务任务验收（DE-001~004）。本任务不重开 M16 任务，只做已确认消费缺口的必要适配。**现状适配说明**：M16 已合入的 `workflow-evolution` schema/生产模块不是本任务新建；本任务不在 M16 侧新增第二事实源，v2/availability/historical replay 的输入契约由本任务前置任务提供，若实际缺失则按 STOP 处理。来源：D-008、T-011/T-013、G-001。
- **Deletion boundary**：转换适配器为一次性产物，导入验收通过后归档（move-map 登记删除条件）；其余无删除。
- **Before**：无执行器恒假失败；状态三态不可区分"没执行/没触发"；五份工作流 SKILL.md 零提及复盘；历史包契约不兼容未入库；main 已含 M16 data-plane 与 Evolution 页面，但现行消费链只读取 stage-reflection.v1，尚未处理 v2、可用性事实和 historical replay。
- **After**：会话产出判断 → `run --action=reflect` 机器闭环发布；五态如实（记录三态 + 可用性事实两态 + 投影派生）；schema v1 枚举扩展 + v2 三件套；20 条历史教训分项目落库；M16 在不改变既有候选判定和页面布局的前提下正确消费混合输入。
- **Main risk**：会话合规依赖（RISK-001）；M16 已合入但 T010/AC-GOV-002 仍 incomplete/inconclusive（RISK-002）；混合输入所需 v2/availability/historical producer 与 malformed diagnostic 语义缺口；共享 schema/投影器回归（RISK-004）。
- **Next step**：实现与局部回归已完成；当前只做 close 前质量收口。不得把 focused green 当作 release/close；先补正确 session binding 下的 canonical dsh-code-review/outcome 与官方当前快照事实，再按 P7 的 formal browser/release 边界复核。任何需要新增公共行为、第二事实源或改动 M16 判定语义的实现仍立即 STOP。

## Technical Context

### Global Constraints

- **公共行为面**：RUNTIME_BEHAVIORS 七类不变；reflect 作为既有公共行为 `run` 的新 action（`run --action=reflect`）路由到私有内部命令，不新增公共行为类（治理边界，AGENTS.md）。
- **不可变发布**：固定路径 `quality/stage-reflection/<stage>.json` 内容寻址不可变；先到先得；假失败记录永不写入（PFACT-008）。
- **判断≠事实**：机器不生成判断内容；事实投影仅机器可验状态（ADR 0021/0023、D30）。
- **Verified facts**：`runStageEndReflection`（stage-runner.mjs:877-985）完成 prelude→validate→merge→publish 全链；调度点 :1655-1713 仅 handler 成功/失败两路径；executor 注入点 :2122-2123 全仓仅测试注入；`stageReflectionPublication`（stage-runtime.mjs:569-577）无 executor 返回 {} 致恒 failed；`createImmutable` 同字节幂等/异字节 EEXIST；模板 stateNames/stateLabel（template.html:174,179）已含 unavailable 缺 not_scheduled；`readLessonRows`（append-lesson-observation.mjs:107-118）entry_kind 严格枚举；`sourceRefs` :139-144 对象数组 + task_id 匹配合并；`qualityRefExists`（validate-stage-reflection.mjs:90-95）把 #fragment 当路径一部分 → 悬空降级（F-015 实测）。
- **Language / runtime**：Node.js >=24，ESM；Ajv 复用现有 schema 校验；静态 HTML 无框架模板。
- **Primary dependencies**：复用 `runStageEndReflection` 批处理逻辑（抽取共享函数）、`validate-stage-reflection.mjs`、`append-lesson-observation.mjs`、`build-reflection-page.mjs`；不新增 npm 依赖。
- **Storage / state**：复盘记录固定路径不变；新增"复盘可用性事实"写入既有 evidence 区（`quality/evidence/stage-reflection-availability/<sha256>.json` 内容寻址，writer=runner 两处改动）；历史导入落 `Projects/<proj>/lessons/<stage>.jsonl` 与 `Projects/<proj>/quality/evidence/historical-replay-20260901/transcript-index.jsonl`。
- **Testing**：Vitest；契约测试在 tests/contract/；E2E 复用 tests/e2e/stage-reflection-real-task.test.mjs 模式；RED/GREEN 每行为变化成对。
- **Target environment**：本地 CLI + 单机文件系统；DSH/Codex 双宿主（reflect 不依赖 codex 会话）。
- **已核实事实**：M16 消费面已确定并已合入当前分支：`runtime/evidence/workflow-evolution.mjs`（候选/质量税/快照/投影）、`runtime/schemas/workflow-evolution.v1.json`、`tools/cli/build-reflection-page.mjs`、`tools/cli/build-reflection-page-template.html`、`tools/cli/derive-consumption-edges.mjs` 及对应 workflow-evolution/page contract 与 e2e tests。T602/T603 已完成当前任务所需的 `stage-reflection.v2`、availability fact、`historical_replay` mixed-input 消费适配；M16 归档质量事实仍不得被当作本任务 AC 通过。
- **Unresolved facts**：Design.md/Experience.md 缺失（not_ready/not_bindable，non-gating）；T010/AC-GOV-002 的 M16 独立质量事实仍 incomplete/inconclusive。

### Code Anchors

- **Verified anchors**：`runtime/stage/stage-runner.mjs#runStageEndReflection`（877-985）、调度点（1655-1713）、`stageReflectionInput`（2110-2123）；`tools/cli/stage-runtime.mjs#parseArgs`（~558 命令白名单）、`stageReflectionPublication`（569-577）、public 路由表（820-835）；`tools/cli/validate-stage-reflection.mjs#validateReflectionValue`（160）、`qualityRefExists`（90-95）；`tools/cli/append-lesson-observation.mjs#readLessonRows`（107-118）、`sourceRefs`（139-144）、merge（213+）；`runtime/schemas/stage-reflection.v1.json`；`tools/cli/build-reflection-page-template.html`（174/179 stateNames/stateLabel）；`tests/contract/build-reflection-page.test.mjs`；`tests/e2e/stage-reflection-real-task.test.mjs`（executor 注入模式 :242）；`docs/architecture/move-map.json`（add/modify 条目格式）。
- **Read before task**：T201/T202 读 stage-runner.mjs 877-985 与 1655-1713 全文；T501 读离线回填包三文件全文；T601 已读取合入后的 M16 消费侧代码与归档任务状态；T602/T603 复用其实际 seam，不再等待或重复 merge。

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
| --- | --- | --- | --- |
| 复盘机器闭环 | extend | `runStageEndReflection` | 抽取共享函数供 reflect 复用；不另造发布链 |
| 状态词汇 | extend | `stage-reflection.v1.json` + 模板词表 | 枚举兼容扩展；v1 旧记录不受影响 |
| 可用性事实 | new（窄） | evidence 区内容寻址写入 | 固定路径不可占用；无既有载体 |
| v2 事实投影 | new | `runtime/schemas/stage-reflection.v2.json` | v1 冻结语义；三件套独立演进 |
| 页面 | extend | 模板 stateNames/stateLabel + `build-reflection-page.mjs` | 页面已含 M16 Evolution 三分区；本任务仅增加可用性事实读取/派生，不改布局或既有趋势结构 |
| 历史导入 | new（一次性） | 转换适配器脚本 | 契约不兼容必须转换；导入验收后归档删除 |
| M16 消费 | extend | `runtime/evidence/workflow-evolution.mjs`、`runtime/schemas/workflow-evolution.v1.json`、`tools/cli/build-reflection-page.mjs`、`tools/cli/build-reflection-page-template.html`、`tools/cli/derive-consumption-edges.mjs`；相关 candidates/page/governance/e2e contracts | 保持 candidate identity、zero-proof/重复介入两档规则、quality-tax 计算边界、lock/CAS、lifecycle 与趋势区布局；仅增加 stage-reflection v1/v2、availability fact、historical replay 的输入识别/过滤/分层和 malformed diagnostic；不得把 M16 归档 T010 incomplete 误写为通过 |
| 公共行为 | reuse | `run` 行为新增 action | 不新增行为类 |

## Solution Design

### Overview

`reflect` 闭环 = 新深模块 `runtime/stage/stage-reflect.mjs`（校验判断输入 schema → 复用 prelude/validate/merge/publish 共享函数 → 原子边界：先暂存 lessons、发布成功才提交）+ `stage-runtime.mjs` 私有命令 `reflect` + 公共路由 `run:reflect`。runner 两处改动（均在 `runtime/stage/stage-runner.mjs` 的复盘调度/发布流，即 runStageEndReflection 及其调用点；`stageReflectionPublication` 位于 stage-runtime.mjs、只是 executor 供给包装，不是改动点）：①无 executor 时不发布失败记录，改落 unavailable 可用性事实（executor_absent）；②preflight/身份/启动失败与中断路径落 not_scheduled 可用性事实。`stage-runtime.mjs` 仅新增私有命令 reflect 与公共路由 run:reflect。页面徽章派生优先级：固定路径记录 status > 可用性事实 > 从未启动派生规则 > unknown（派生读取在投影器，见 P4；FND-P02/P03/P05 修复）。

### 状态转移实施（FR-STATE-002）

| 路径 | 固定路径记录 | 可用性事实 | 页面徽章 |
| --- | --- | --- | --- |
| 判断执行+验证通过/降级 | ok/degraded | — | 记录 status |
| 判断执行+验证失败 | failed | — | failed |
| 运行结束+无执行器 | 不写 | unavailable（executor_absent） | unavailable |
| preflight/身份/启动失败/中断/未启动 | 不写 | not_scheduled（对应原因码） | not_scheduled |
| 事后补记（路径空闲） | 真实记录 | 事实保留为历史 | 记录 status |

### 失败恢复（FR-EXEC-004）

validate → lessons 暂存 → 固定路径发布 → lessons 提交。非法输入零副作用；同字节幂等；异字节冲突明确报错不覆盖；发布成功+合并失败→记录 degraded + 合并失败事实；发布失败→lessons 不提交。

### 历史导入（FR-IMPORT-001~005）

一次性转换器按 §7.2 映射契约逐条转换 → 全量预演（validate-stage-reflection）→ 分项目落库（幂等键=项目+阶段+原行标识+内容哈希；条目级原子回滚）→ 介入提取（20/20 凭证，LLM 分析低置信度标注）→ severity 校准留理由。证据索引文件落正式 evidence 区（文件级引用）。

### M16 消费（FR-M16-001，已合入基线后的本任务增量）

M16 已通过 `cdafb4446` 合入，当前分支已快进至 `fff255c78`（后者仅归档 M16 四份材料）。实际消费链为 `build-reflection-page.mjs` 装配 `observations`/`consumer_proofs`/`interventions`，调用 `workflow-evolution.mjs` 的 inventory → refresh → tax → current projection；既有页面模板包含建议行动/仅供参考/质量税三分区。M16 归档 T001–T009 为 completed，但 T010/AC-GOV-002 仍 `incomplete/inconclusive`，只作质量事实。

本任务 P6 不改 M16 的 candidate identity、zero-consumption/重复介入两档规则、quality-tax 原有计算边界、lock/CAS、lifecycle 或趋势区布局。T602 先在现有 M16 contracts/fixture 上固定 FR-M16-001 五行 mixed-input RED（v1 旧/新状态、v2、historical replay、malformed），并保留 M16 既有回归；T603 再在 `build-reflection-page.mjs` 的输入归一化及必要时 `workflow-evolution.mjs` 的消费入口实现识别/过滤/分层与错误事实。若 v2/availability/historical producer 仍不存在，按 STOP 回到既有 spec/decision，不臆造第二事实源；历史回放必须 reference_only 且不进 quality-tax 分母，availability 不计入判断/趋势，单条 malformed 局部跳过并记录 diagnostic。

### Component Quality Map（UI，frontend-component-quality 事实）

- entry：component=复盘状态徽章词表（模板 stateNames/stateLabel）；action=`extend-state-or-variant`（新增 not_scheduled 态）；real_consumers=[monitor 任务视图阶段卡徽章渲染]；state_owner=模板 stateLabel 映射；typed_view_model=`__WH_MONITOR_DATA__.tasks[].stages[].reflection.status`；css_token_owner=模板内联 `state-*` 徽章类（not_scheduled 复用 unavailable 既有样式，不新增 token）；story_or_test_update=tests/contract/build-reflection-page.test.mjs 状态断言与 fixture。兼容性影响=旧记录显示不变；删除条件=N/A（词汇随枚举生命周期）。

## Phases

### Phase P0 — 基线同步与前置核验

- **Goal**：记录并核验当前任务分支已与 main 的 M16 基线对齐，确认 M16 消费面与独立质量边界，决定 Phase P6 排期。
- **Files**：无新增；git provenance 与只读核验。
- **Tasks**：T001
- **Verify**：记录 `eeb9dfa12 → cdafb4446 → fff255c78` provenance；当前已合入基线后执行/记录 `npm test` 与 `npm run check`，不把依赖缺失当作通过；M16 归档状态事实记录。
- **Knowledge**：`fff255c78` 仅归档 M16 材料；M16 真实实现已在其父级 merge/后续加固提交中合入；M16 T010/AC-GOV-002 仍 incomplete/inconclusive。
- **STOP**：若需要改动 M16 判定语义、趋势区布局或新增第二事实源，停止并回到 spec/decision；不重复 merge。
- **Done**：基线已合入且当前 HEAD 与 main 同为 `fff255c78`；实际 M16 消费面与质量边界已登记；测试结果按真实 exit 记录。
- **Risks and rollback**：合并基线可能带来回归；保留原始测试失败与 provenance，不覆盖用户未提交材料。

### Phase P1 — schema 与验证器

- **Goal**：v1 枚举扩展 + 可用性事实 $defs + v2 三件套 schema + 验证器完整性规则，全部带正负例 fixture。
- **Files**：**MODIFY** `runtime/schemas/stage-reflection.v1.json`、`tools/cli/validate-stage-reflection.mjs`、`tests/contract/validate-stage-reflection.test.mjs`（或既有对应契约测试）；**NEW** `runtime/schemas/stage-reflection.v2.json`、`tests/fixtures/stage-reflection/v2-*.json`；**DO NOT TOUCH** 发布链、页面、M16。
- **Tasks**：T101（RED）、T102（GREEN）
- **Verify**：契约测试 RED→GREEN；旧记录 fixture 回归绿。
- **STOP**：枚举扩展破坏任一旧 fixture → 停止并复查兼容性。
- **Done**：五态词汇与三件套 schema 冻结；验证器完整性规则生效。
- **Risks and rollback**：schema 仅扩展不改义；回滚=还原两文件。

### Phase P2 — 执行闭环与调度语义

- **Goal**：reflect 闭环 + runner 两处改动 + 状态转移矩阵 + 失败恢复矩阵落地。
- **Files**：**NEW** `runtime/stage/stage-reflect.mjs`、`tests/contract/stage-reflect.test.mjs`、`tests/fixtures/stage-reflect/*`；**MODIFY** `tools/cli/stage-runtime.mjs`（私有命令 + run:reflect 路由）、`runtime/stage/stage-runner.mjs`（两处最小改动）、`docs/architecture/move-map.json`（add/modify 登记）、`tests/contract/stage-runner-reflection.test.mjs`（或既有）；**DO NOT TOUCH** RUNTIME_BEHAVIORS 七类、TaskKernel、页面。
- **Tasks**：T201（RED）、T202（GREEN）
- **Verify**：转移矩阵五行 fixture + 失败恢复矩阵五行 fixture 全绿；既有 e2e（注入 executor）不回归。
- **Knowledge**：createImmutable 同字节幂等/异字节 EEXIST；原子边界=暂存→发布→提交。
- **STOP**：需要第八种公共行为或改动阶段状态机 → 退回 spec。
- **Done**：reflect 可用；无执行器不再假失败；未触发路径有事实。
- **Risks and rollback**：runner 改动面超限 → 回滚两处改动重来。

### Phase P3 — 技能与文档

- **Goal**：复盘技能重写（六类问题结构化 + 机器链一致）+ 五份工作流与标准流程文档补阶段末指令。
- **Files**：**MODIFY** `skills/stage-reflection/SKILL.md`、`skills/stage-reflection/skill-bundle.json`（如声明变化）、`workflows/*/SKILL.md` ×5、`docs/standard-workflow.md`、`tests/contract/stage-reflection-skill-contract.test.mjs`；**DO NOT TOUCH** steps.json 拓扑。
- **Tasks**：T301
- **Verify**：技能契约测试绿；指令与实际命令行为一致性人工核对（AC-EXEC-003）。
- **STOP**：技能描述需要机器链不支持的能力 → 退回 spec。
- **Done**：六类问题契约与五处指令生效。
- **Risks and rollback**：文档漂移 → 契约测试断言关键句。

### Phase P4 — 页面最小生效面

- **Goal**：not_scheduled 词表 + 契约测试同步 + 旧记录 fixture 回归。
- **Files**：**MODIFY** `tools/cli/build-reflection-page-template.html`（词表）、`tools/cli/build-reflection-page.mjs`（仅新增可用性事实读取与派生：扫描 evidence 区、按 (task,stage) 定位、派生优先级=固定路径记录 > 可用性事实 > 从未启动派生规则 > unknown；不改布局/视图/趋势区数据流）、`tests/contract/build-reflection-page.test.mjs`、`tests/fixtures/`（页面 fixture）；**DO NOT TOUCH** M16 趋势区、任务视图其他字段、投影器既有数据装配语义。
- **Tasks**：T401（RED）、T402（GREEN）
- **Verify**：五态渲染断言 + 旧记录 fixture 绿。
- **Done**：页面五态如实显示。
- **Risks and rollback**：样式缺失 → 复用 unavailable 类，不新增 token。

### Phase P5 — 一次性历史导入

- **Goal**：20 条教训转换落库（分项目）+ 证据文件落库 + 介入提取（20/20 凭证）+ severity 校准核验。
- **Files**：**NEW** `tools/cli/import-historical-reflection.mjs`（一次性，用后归档）、`tests/contract/import-historical-reflection.test.mjs`、`tests/fixtures/historical-import/*`；**WRITE（仓外存储）** `Projects/workflowhub/lessons/*.jsonl`、`Projects/paperbuilder/lessons/*.jsonl`（或离线标注）、`Projects/*/quality/evidence/historical-replay-20260901/transcript-index.jsonl`；**MODIFY** `docs/architecture/move-map.json`（add + 归档条件）。
- **Tasks**：T501（RED）、T502（GREEN 转换器）、T503（介入提取）、T504（执行导入+断言）
- **Verify**：20/20 落库断言、幂等/回滚用例、证据引用无悬空、提取凭证 20/20。
- **STOP**：离线包缺失/损坏 → 停止并报告（不重建数据）。
- **Done**：20 条正式落库且全部 AC-IMPORT 通过；转换器归档。
- **Risks and rollback**：条目级原子回滚；失败不污染正式 lessons。

### Phase P6 — M16 消费改进（基线已合入，质量事实仍独立）

- **Goal**：在已合入的 M16 消费链上，按 FR-M16-001 识别 v1/v2/可用性事实/历史回放并保持 M16 原有判定与页面布局不变；M16 既有 contracts 保绿。
- **Files**：**READ/CONSUME** `runtime/evidence/workflow-evolution.mjs`、`runtime/schemas/workflow-evolution.v1.json`、`tools/cli/build-reflection-page.mjs`、`tools/cli/build-reflection-page-template.html`、`tools/cli/derive-consumption-edges.mjs`；**MODIFY** 以 T602/T603 实际 RED 证明的最小消费入口为准，优先 page-builder 输入归一化，必要时才改 evolution 深模块过滤；**NEW** mixed-input fixture/contract 仅在现有 M16 tests 无合适 seam 时新增；**DO NOT TOUCH** M16 archive materials, candidate identity, zero-proof/repeat thresholds, quality-tax 既有分母规则（仅排除本 spec 明确的 historical replay/availability 输入）、lock/CAS/lifecycle、Evolution 三分区布局。
- **Tasks**：T601（事实核验/消费面登记）、T602（mixed-input RED）、T603（消费适配 GREEN）
- **Verify**：T602 五行期望逐项 RED→T603 GREEN；M16 focused contracts（candidates/page/ledger/governance/final aggregate/e2e）与现有 page/template contracts 回归；依赖可用时再执行 `npm test`/`npm run check`。
- **STOP**：若 v2/availability/historical producer 不存在、需要新增公共行为/第二事实源、或必须改 M16 判定语义/趋势布局，停止并回既有 spec/decision；M16 T010/AC-GOV-002 incomplete 不得伪造为通过。
- **Done**：AC-M16-001 仅在 mixed-input 五行 oracle、回归测试与独立事实边界均满足后通过；merge 本身不构成完成。
- **Risks and rollback**：现行 M16 只消费 stage-reflection.v1，适配可能涉及 schema/input envelope；回滚=还原本任务消费侧与 fixture，保留 M16 原实现和质量 provenance。

### Phase P7 — 最小真机验证（聚合卡）

- **Goal**：构造场景跑通全链四类路径（成功/失败/未调度/验证失败）+ AC-VERIFY 汇总。
- **Files**：**NEW** `tests/e2e/stage-reflect-real-chain.test.mjs`（复用 real-task E2E 模式）。
- **Tasks**：T701
- **Verify**：四类路径结果与预期一致；失败路径真报失败；页面与 M16 消费可见。
- **Done**：AC-VERIFY-003/004 通过。
- **Risks and rollback**：验证假绿 → F9 违反，STOP 并修验证本身。

## 测试蓝图（testing-system-blueprint）

- **风险→场景**：假失败占路径（P2 转移矩阵 fixture）；不可变冲突（恢复矩阵 fixture）；schema 回归（旧记录 fixture）；导入污染（幂等/回滚用例）；LLM 合规盲区（P7 真机全链）；M16 混合输入误计（P6 fixture）。
- **Oracle**：每个 Phase 的 gate_cmd 只断言目标行为；负例保留（非法输入拒绝、悬空降级、移除门槛）。
- **证据路径**：`quality/tests/<task-phase>/` 下每卡一份 gate 结果 JSON。
- **覆盖边界**：不证明跨主机/NFS；不证明真实业务任务复盘质量（DE-001）；不证明 M16 业务收益。
- **独立审查执行安排**（FND-P06 修复）：build-code 阶段按既有 skill-deps 执行 phase/integration 独立审查（wh-review）；verify-code 执行代码审查（dsh-code-review 既有路径）；本计划不另设审查任务卡，T701 仅做事实汇总核对（AC-VERIFY-002）。
- **test-routing-advisor**（独立运行，2026-09-01）：P3=simple（纯文档，仅跑钉文档的既有契约测试：stage-reflection-skill-contract/check-skill-updates 等）；P1=feature（backend-testing：stage-reflection-schema/validate-stage-reflection 契约测试，v1 枚举兼容+v2 三件套正负样本）；P2=feature 高端（backend-testing 幂等/并发/持久化维度+TDD：runner-contract、interrupted-same-task-recovery 模式，tmpdir FS harness+冲突/崩溃 fixture，public-behavior-baseline 回归防公共路由越界）；P4=feature 低端（frontend-testing 状态维度+页面契约测试，全状态枚举渲染 fixture，静态模板免浏览器）；P5=feature（backend-testing 幂等/回滚/坏行，混合 JSONL fixture；severity 校准属判断性质量走独立 review 不靠测试）；P6=feature（backend-testing+workflow-evolution/page contracts，优先复用 `build-reflection-page.mjs`/`workflow-evolution.mjs` 现有 seam，依赖 T601/T102/T402/T504，保持 M16 merge provenance 与 T010 incomplete 事实）；P7=fullstack（fullstack-slice-testing+isolated-browser-qa，扩 stage-reflection-real-task E2E，四类路径构造输入+facts 断言+截图证据）。**仓库事实校正**：tests/unit/ 不存在，单测级能力在 tests/contract/ 与 tests/integration/。

## 来源 → FR → AC → 任务 → oracle 映射

| Source/Decision | FR | AC | Tasks | Oracle |
| --- | --- | --- | --- | --- |
| D-001/F-001/F-008 | FR-EXEC-001/002/003/004 | AC-EXEC-001~004 | T201/T202/T301/T701 | 闭环发布+转移/恢复矩阵断言 |
| D-002/G-001/F-003 | FR-STATE-001/002 | AC-STATE-001/002 | T101/T102/T201/T202 | 五态词汇+转移矩阵 fixture |
| D-006/R-101 | FR-STATE-003 | AC-STATE-003 | T401/T402 | 页面五态渲染断言 |
| D-003/G-002/F-007/013/014/015 | FR-IMPORT-001~005 | AC-IMPORT-001~005 | T501~T504 | 20/20 落库+幂等回滚+凭证 |
| D-004/T-007/F-009 | FR-QUALITY-001/002/003 | AC-QUALITY-001~003 | T101/T102/T301/T701 | 六类区块+三件套+完整性规则 |
| D-005/T-015/R-101 | FR-M16-001 | AC-M16-001 | T601~T603 | 混合输入期望表+M16 契约绿 |
| D-007/T-014 | （验收域） | AC-VERIFY-001~004 | T701+全量 | 测试绿+审查+真机验证+非阻断 |

## 简洁与工程透镜（步骤 5-6 inline）

- **simplicity-guard**：复用优先全表满足（执行闭环复用 runStageEndReflection；页面复用词表；E2E 复用 real-task 模式）；唯一新建深模块=stage-reflect（无可复用执行入口）与一次性转换器（契约不兼容必须转换）；无占位性能力。
- **plan-eng-review**：最脆点=runner 两处改动与不可变路径交互（用转移/恢复矩阵 fixture 锁定）；M16 已合入但 mixed-input 消费适配仍需 T602/T603，且 T010/AC-GOV-002 质量事实不完整；转换器一次性身份在 move-map 登记归档条件。

## 独立审查事实与处置（build-plan 步骤 9-10，2026-09-01）

- **审查事实**：wh-review build-plan——status=**available**，outcome=partial；3 家有效返回（kimi/coding 258s / opencode-v4flash 243s / antigravity-flash 59s 无 findings 为有效空结果）；codex/luna 失败（PUBLIC_RESULT_INVALID：输出含私有绝对路径被过滤，如实保留）；material_id=1c147907455da4ff095bf30720d62b0e869da38b4a32d2d254b347c545127f07；runtime_id=7a82917d-f1ab-4bc1-a230-1d9b1f32933b；findings 共 8 条（5 major + 3 minor）。

| finding_id | 内容 | status | 处置 |
| --- | --- | --- | --- |
| FND-P01（kimi major） | P5 依赖宿主机路径夹具（离线包/transcripts），build-code 可能取不到 | **fixed** | T501 首动作=验证包存在并清点哈希（路径更正为 /Users/Hugh/Downloads/...），缺失即 STOP 如实报告 |
| FND-P02（kimi major） | runner 两处改动误记到 stageReflectionPublication（实属 stage-runtime） | **fixed** | plan/tasks 明确：改动点在 stage-runner.mjs 的 runStageEndReflection 及调度调用点；stage-runtime 仅加 reflect 命令与路由 |
| FND-P03（opencode major） | 可用性事实只有 writer 没有 reader：投影器禁改+M16 gated → 页面无法派生 unavailable/not_scheduled | **fixed（真实设计缺口）** | spec FR-STATE-002/003 修复：投影器新增"可用性事实读取与派生"（第四处改动）；plan P4 边界与 T401/T402 同步 |
| FND-P04（opencode major） | severity 校准无产出者（T504 只核验、T503 只介入） | **fixed** | T503 扩责：主会话逐条校准并写 severity_reason+出现次数证据；独立 review 抽查而非替代产出 |
| FND-P05（opencode major） | "从未启动"路径无写入方（runner 不经过） | **fixed** | 转移表拆分：从未启动=投影派生规则（同任务后续有 outcome 且本阶段三无），runner 保持两处上限；T401 fixture 覆盖 |
| FND-P06（opencode minor） | AC-VERIFY-002 独立审查执行者未指定 | **fixed** | plan 测试蓝图写明：wh-review/dsh-code-review 由 build-code/verify-code 既有步骤执行，T701 仅汇总 |
| FND-P07（opencode minor） | T701 gate 只跑新 e2e，"全量绿"无门禁 | **fixed** | T701 gate_cmd 增加 npm test 全量门禁 |
| FND-P08（opencode minor） | AC-STATE-001 仍写"旧四态"与 FR-STATE-001 矛盾 | **fixed** | spec AC-STATE-001 改为"既有三态记录不受影响" |

- 无 rejected/needs_human：8 条全部为计划/规格级修补，不涉及方向变更。

## 最终一致性检查（build-plan 步骤 11，spec-analyze 手动口径，2026-09-01）

官方 record-spec-analyze 因 DSH 无认证链不可用（如实保留）；手动执行 spec-analyze 七项检查：

1. 来源映射：R-001~R-009 → D-001~D-008 → 16 FR → 16 AC → 16 任务卡，双向可追溯（plan 映射表 + 任务卡 source_refs）✓
2. 四材料一致：decision-log/spec/plan/tasks 对五态模型、导入契约、M16 边界、非目标的表述一致（本轮审查修复后复核）✓
3. 无孤儿任务/范围扩大：每卡有 FR/AC 来源；FR-EXEC-004 来源已登记（FND-S07 细化 D-001）；无计划外产物 ✓
4. 每 Phase/任务有 tier、测试技能、场景、命令、expected exit、oracle、fixture、证据路径、STOP、覆盖边界 ✓
5. DEFER/OPEN 交接：DE-001~004（owner/触发/关闭条件）齐全；OPEN-01 已由 T601 按 merge provenance+direct consumer surface 关闭，但 T010/AC-GOV-002 仍 incomplete/inconclusive；OPEN-02 已在 build-spec 关闭 ✓
6. 证据 vs 推断区分：路由表/审查、M16 merge 与 T010 状态为真实外部事实；T602/T603 已执行并有 mixed-input focused gate，但不伪造完整 M16 quality/release 通过 ✓
7. 发现项已本地修复：8/8 fixed ✓

- 结论：build-plan 语义覆盖通过（手动口径）；认证口径 unavailable 如实保留。

## 当前执行状态更正（2026-09-03）

- 本计划已进入实现后收口，不再停在“build-code 前”：T501/T502/T503/T504、T601、T602、T603 已按任务卡完成；P6 focused gate 为 130/130，P7 real-chain 聚焦测试为 4 文件/33 测试，`npm run check` 与 `npm run test:exclusive` 通过。
- P7 仍是 `partial`：浏览器证据只有 isolated-browser-qa smoke，不是正式四路径验收；修复后的最终 provider aggregate 未重跑（遵守 verify-code 不重复 provider 的审查契约）；canonical dsh/session 事实不可用。
- close 前必须在正确绑定的新 WorkflowHub session 中完成 canonical dsh-code-review stage outcome，并由官方运行时重新绑定当前快照的测试/审查/验收事实；在此之前 `product_release_status=not_released`，不能把本地 gate 当作 release 或 close 许可。
