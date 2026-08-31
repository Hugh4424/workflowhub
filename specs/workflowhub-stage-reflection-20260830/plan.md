# 实施计划：stage-reflection 每阶段自动复盘器与判断层页面

**Task ID**: `workflowhub-stage-reflection-20260830` | **Date**: 2026-08-30 | **Spec**: [spec.md](./spec.md)
**Input**: 已冻结并经用户确认的 `decision-log.md` 与 `spec.md`（28 FR / 12 AC 为唯一验收源）
**Status**: Phase 1 完成（plan/tasks 已生成，待 Phase 0 硬约束满足后 build-code 执行）

- **状态**：已冻结并经用户确认（2026-08-30），build-code 消费；T0 门禁：m15-retirement 合并 main 后开工

## 速读卡

- **目标**：每个 WorkflowHub 任务的每个 stage（五个 stage 全挂，见"关键裁决记录"）结束时，当前主会话自动做轻量复盘，产出判断层记录归档任务 `quality/stage-reflection/`；落地两补丁（A：human-confirmation v3 含 reply_text+step_slug；B：消费边纯脚本派生）；维护仓外 lessons 索引；重建 M15 全局静态页面（任务视图 + overall pending）。
- **核心策略**：框架层挂载（各 workflow steps.json 把 stage-reflection 声明为 stage 结束 step——`on_stage_end:true` + `blocking:false`——+ skill-deps.yaml 登记 skill；stage-runner 小幅扩展调度语义：无论前置 step 成败都执行、自身失败只记录 outcome 不翻转 stage 完成状态、不阻断 close，不改校验器核心，见裁决 P-002）；单写入源升级 confirmation（禁双写）；消费边零新增埋点；raw_observation 由 runner 机器前奏无条件追加（零 AI，不依赖技能启动）；确定性校验器机器强制核验 remove 双硬信号与 evidence_refs 存在性；失败只落 outcome status 不阻断。
- **Non-goals**：不做 token/耗时/transcript 遥测；不做质量打分/裁决；不做 M16 本体/消融/负例库；不补 per-provider 采集；不做历史回填；不改五阶段主骨架。来源：spec.md §2 非目标、decision-log.md D-011。
- **关键文件**：`runtime/schemas/stage-reflection.v1.json`（新）、`runtime/task/task-kernel-implementation.mjs`（:523 确认写入点）、`runtime/stage/stage-runner.mjs`（:38 白名单 + on_stage_end 调度扩展，不改校验器核心）、`tools/cli/derive-consumption-edges.mjs`（新）、`tools/cli/append-lesson-observation.mjs`（新）、`tools/cli/validate-stage-reflection.mjs`（新，move-map 登记）、`tools/cli/build-reflection-page.mjs`（新）、`skills/stage-reflection/`（新）、五个 `workflows/*/steps.json` + `skill-deps.yaml`、`skills/catalog.yaml`、四处路径白名单、`docs/architecture/move-map.json`。
- **验收入口**：AC-002~AC-010 由构造场景 + contract 测试覆盖；AC-011 由 Phase 0 复核记录覆盖；AC-012 由文档 grep gate 覆盖；AC-001 真实任务端到端允许标注 evidence 来自下一个真实任务（用户抽查确认卡交接），本任务 close 前构造场景覆盖其余 AC。
- **顺序硬约束**：m15-retirement 合并 main 之后才开工 build-code；开工前复核其最终 diff 与保留符号集（AC-011 / D-008 / RISK-005）。

## Technical Context

**Language/Version**: Node.js（>=24）、JavaScript ES modules、JSON/JSONL、Markdown、纯静态 HTML+data.js
**Primary Dependencies**: 现有 workflowhub runtime（stage-runner 通用 step/skill outcome 通道、task-kernel 确认写入点、canonical-evidence-validators）；仓外静态页面蓝本 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub-monitor.html` + data.js 注入模式（只读蓝本）
**Storage**: 文件系统 — 任务 `quality/stage-reflection/<stage>.json`（schema `stage-reflection.v1`）；`quality/confirmations/`（human-confirmation.v3，内联产出无独立 schema 文件）；stage outcome `quality/evidence/stage-outcomes/<stage>/<sha256>.json`（schema `workflowhub-stage-outcomes.v1`，只读消费）；仓外 `<storageRoot>/Projects/<proj>/lessons/<stage>.jsonl`；仓外页面 data.js（freeze 常量 `globalThis.__WH_MONITOR_DATA__`）
**Testing**: `npx vitest run <file>`（tests/contract/ 为主）；RED/GREEN 对（同 gate_cmd、同 oracle）；构造场景端到端；真实任务端到端（AC-001，交接下一真实任务）
**Target Platform**: workflowhub CLI（任意宿主会话；复盘由当前主会话执行，不依赖宿主 transcript 能力）
**Project Type**: AI workflow orchestration tool（skill/prompt + Node.js runtime）
**Constraints**: 公共 runtime 命令仍七类不新增；新生产文件必须登记 move-map（唯一 consumer/owner/删除条件）；禁双写；judgment≠fact；unknown 不伪造；m15-retirement 未合并前不动 build-code。

## Global Constraints

- 公共 runtime 命令仍是 doctor、status、run、review、verify、confirm、authorize 七类；本任务不新增公共命令（四个新 tools/cli 脚本是人工/CI/runner 前奏工具，不是 runtime 公共 behavior）。
- 四份当前材料（decision-log.md、spec.md、plan.md、tasks.md）仍是唯一工作真相，落 worktree `specs/<task-id>/`。
- 判断层输出 `record_kind=judgment`，显式标注"LLM 判断而非机器事实"，禁止质量打分字段；质量裁决仍归 review/verify。
- confirmation 单写入源升级 v3，旧 v1/v2 记录只读兼容、不改写、不回填。
- 消费边派生保守语义：无引用=unknown，不判无用；unknown≠零消费（remove 门槛只认真实零消费）。
- remove_candidate 仅当两个机器硬信号同时成立（零消费 ∧ 人工否定/重复介入≥2）；否则只能 needs_evidence。
- 确定性校验器 `validate-stage-reflection.mjs` 机器强制兜底：remove_candidate 缺任一双硬信号即改写降级为 needs_evidence 并记录降级事实；evidence_refs 悬空引用 → 该判断 confidence 强制非 high、复盘 status 落 degraded。
- 复盘 step 以 `on_stage_end:true` + `blocking:false` 声明：无论前置 step 成败都执行；自身失败/超时只记录 outcome status（failed），不翻转 stage 完成状态、不阻断 close；raw_observation 由 runner 机器前奏无条件追加（先于技能、零 AI 成本，技能超时/未启动/失败时 raw 已落盘），合并写回与复盘成败解耦。
- 历史数据（m15 仓外静态三件套、历史任务）字节级只读，sha256 比对验证（沿用 m15-retirement AC-HISTORY-001 口径）。
- 新生产文件/目录（schema、四个 CLI、skills/stage-reflection/、页面模板）逐一登记 `docs/architecture/move-map.json`（字段 {source,destination,status,sha256_before,bytes,sha256_after,content_change}），写明唯一 consumer/owner/删除条件。

## 关键裁决记录

### 裁决 P-001：verify-code 挂载——五个 stage 全挂

- **冲突事实**：框架契约 `runtime/stage/stage-content-contracts.mjs:3790` 把 verify-code 排除在 authoring stage 之外（该处语义专指 stage-end-spec-analyze 契约）；但用户 R-004 字面为"每个 stage 结束时"，spec §5.1 的 stage 枚举含 verify-code（`make-decision|build-spec|build-plan|build-code|verify-code`）。
- **裁决**：五个 stage 全部挂载 stage-reflection step。
- **理由**：①stage-reflection 走 stage-runner 通用 step/skill outcome 校验通道（F-009），与 spec-analyze 的专用强校验槽无关，通用通道对 verify-code 无技术障碍；②复盘对象是"本 stage 过程"而非 spec 材料链，verify-code 阶段同样有可复盘的人工介入与 step/skill 价值问题；③排除 verify-code 会造成观测盲区，违背 R-004 字面与 R-012 动机；④挂载成本=steps.json 一个 step 条目 + skill-deps 一行，可逆。
- **影响**：steps.json/skill-deps.yaml 修改范围为五个 workflow 而非四个；wiring 测试断言五 stage 全覆盖。

### 裁决 P-002：复盘挂载形态——声明式 stage 结束 step + runner 小幅扩展调度语义

- **冲突事实**：原计划把复盘挂为 steps.json 末尾普通 step。普通 step 语义两头堵：前置 step 失败导致 stage failed 时轮不到复盘 step 执行（失败 stage 无复盘，恰是最需要复盘的场景）；而若让复盘 step 参与 stage 完成判定，复盘自身失败又会拖挂 stage/close，违反 D-009「复盘失败不阻断」。
- **裁决**：steps.json 的 stage-reflection step 增加声明式字段 `on_stage_end: true` + `blocking: false`；stage-runner 小幅扩展调度语义（**不改校验器核心**，只加调度语义）：识别该标记的 step——无论 stage 前置 step 成败都执行它；它自身失败只记录 outcome status，不翻转 stage 完成状态、不阻断 close。
- **理由**：普通 step 语义无法同时满足「失败 stage 也复盘」与「复盘失败不阻断」两条已冻结决策；runner 扩展只加调度语义、不加校验能力、不新增公共命令，薄核心边界不破；用户已拍板确认「runner 小幅扩展」方向。
- **影响**：这是对 D-001（框架层挂载）实现细节的修订而非方向变更；steps.json step 结构由 7 字段扩为 9 字段（两个声明式调度字段，其余 step 省略取默认值 `on_stage_end:false, blocking:true`，既有行为零变化）；新增 T22–T24（runner 扩展 RED/实现/GREEN）；T13 挂载依赖 T24。

### Phase 骨架微调说明

- Phase 1 增加 `tools/cli/append-lesson-observation.mjs` 微型 CLI：spec §4 要求"机器先行（零 AI 成本）无条件追加原始观察"，零 AI 成本必须有一个非 LLM 写入体；20 行级 CLI 满足 M0，且给 lessons JSONL 行格式一个可测试的机器锚点。骨架原文只写"lessons jsonl 读写约定"，此为落实该约定的最小执行体，已登记 move-map。
- Phase 2 与 Phase 1 并行：两者文件面完全不交（Phase 1 动 schemas/白名单/新 CLI；Phase 2 动 task-kernel 写入点与读取方），仅 canonical-evidence-validators.mjs 同文件不同关切（T3 登记白名单 vs T9 读取方兼容），约定 T9 后行并在卡片依赖中串行化该文件——T9 依赖 [T8, T3]，T3 并行字段不含 T9。
- 审查修订（FND-P3/P4/P5/P6）：新增 runner 调度扩展任务 T22–T24（Phase 3，挂载前置，T13 依赖 T24）与确定性校验器任务 T25–T27（Phase 1）；新任务取后续编号以避免全量重编号，任务编号不再与 Phase 单调对应，依赖关系以卡片「依赖/并行」字段为准。
- Phase 6 聚合验证拆为 T20（构造场景 + AC 映射）与 T21（AC-001 真实任务交接 + 用户抽查确认卡）：AC-001 的 evidence 来源口径必须在材料中显式标注，避免把构造场景冒充真实任务背书（M15 空壳教训）。

## Modules, Interfaces, and Data Contracts

### 模块职责

- **复盘判断模块**：`skills/stage-reflection/`（SKILL.md 会话内执行协议 + skill-bundle.json）— 当前主会话在 stage 结束执行；输入三来源（会话记忆、lessons 索引、本 stage step/skill outcome 含两补丁数据）；执行时调用 `derive-consumption-edges.mjs` 派生消费边作为 remove 门槛输入；输出 `quality/stage-reflection/<stage>.json` 落盘后须经 `validate-stage-reflection.mjs` 机器核验（双硬信号强制降级 + evidence_refs 存在性）方为终态。
- **判断层 schema 模块**：`runtime/schemas/stage-reflection.v1.json` — 复盘输出契约（spec §5.1~5.3 定稿为正式 schema）。
- **路径白名单**：`runtime/stage/stage-handlers.mjs:64-71,224`、`runtime/stage/stage-runner.mjs:38`、`runtime/task/task-kernel-implementation.mjs:29,74`、`runtime/evidence/canonical-evidence-validators.mjs:219` — 登记 `quality/stage-reflection/` 为合法任务产物路径。
- **补丁 A 写入点**：`runtime/task/task-kernel-implementation.mjs:523` — confirm 落盘 `human-confirmation.v3`（新增 `reply_text` + `step_slug`）；authorize（:593-602，`irreversible-authorization.v1`）保持不变。
- **补丁 A 读取方**：`runtime/stage/completion-predicates.mjs:534,647`、`runtime/stage/stage-runner.mjs:958`、`runtime/stage/stage-handlers.mjs:990`、`runtime/evidence/freshness.mjs:197`、`runtime/evidence/canonical-evidence-validators.mjs:219`、`core/task-close.mjs:278,565,1348`、`skills/mini-task/scripts/mini-task-runner.mjs:123`、`tools/architecture/public-behavior-baseline.mjs:365` — 全部只读兼容 v1/v2/v3。
- **补丁 B 派生模块**：`tools/cli/derive-consumption-edges.mjs` — 纯脚本从 stage outcome 的 input_refs（字符串数组）/evidence_refs（{ref,sha256} 对象数组）派生消费边，两种形态分别处理；无引用记 unknown。consumer=复盘技能 remove 门槛输入（T11 显式接线）与 build-reflection-page 消费图（T16 显式接线）。
- **runner 调度扩展**：`runtime/stage/stage-runner.mjs` — 识别 `on_stage_end:true` + `blocking:false` 标记的 step：无论 stage 前置 step 成败都执行；其自身失败只记录 outcome status，不翻转 stage 完成状态、不阻断 close；执行复盘技能前机器前奏自动调用 append-lesson-observation。不改校验器核心（裁决 P-002）。
- **复盘机器核验模块**：`tools/cli/validate-stage-reflection.mjs`（move-map 登记）— 确定性校验器：读复盘输出 + 消费边派生结果 + confirmation 记录，逐条核验 remove_candidate 双硬信号（30 天窗口内零消费，**unknown≠零消费**；rejected ∨ 同 step_slug 人工介入≥2 次），缺任一信号**机器强制降级为 needs_evidence**（改写输出并记录降级事实）；evidence_refs 存在性解析（当前 task quality/ 下 outcome/confirmation/evidence 记录），悬空引用 → 该判断 confidence 强制非 high、复盘 status 落 degraded。consumer=复盘流程技能后机器核验与 CI。
- **lessons 机器追加模块**：`tools/cli/append-lesson-observation.mjs` — 向 `<storageRoot>/Projects/<proj>/lessons/<stage>.jsonl` 追加 raw_observation 行；主消费=runner 机器前奏（执行复盘技能前自动调用，零 AI 成本，不依赖主会话是否启动技能；技能超时/未启动/失败时 raw 已落盘）；合并写回（merged_lesson）由复盘会话按 SKILL.md 协议执行。
- **页面投影模块**：`tools/cli/build-reflection-page.mjs` + 静态页面模板 — 遍历各任务 `quality/stage-reflection/*` + lessons 索引 → 生成仓外 data.js；页面单文件、内联 CSS、`document.createElement` 渲染、中文 label 映射、stale/partial/fatal 状态显式、safeRef 防路径注入。

### 接口与数据契约

- steps.json step 结构扩为 9 字段：既有 7 字段 `{step_id,step_slug,order,entry_conditions[],completion_evidence[],observable_result,depends_on[]}` + 声明式调度字段 `on_stage_end`（bool，默认 false）与 `blocking`（bool，默认 true）；顶层 `schema_version 2.0.0`；仅 stage-reflection step 置 `on_stage_end:true, blocking:false`，其余 step 省略取默认值、既有行为零变化（裁决 P-002）。
- skill 登记于 skill-deps.yaml：`{name,path,execution,trigger,bundle,owner,consumer:{target,inputs[],identity[],result}}`。
- `stage-reflection.v1`：`record_kind="judgment"` 固定；`status∈{ok,degraded,failed}`；judgments[] 七取值（六类 + needs_evidence）；interventions[] 的 reply_text 取自 v3 确认记录，旧记录降级为 null 且 confidence≠high；无质量打分字段。
- `human-confirmation.v3` = v2 字段全集 + `reply_text`（非空）+ `step_slug`（非空）；v2 模式内联产出，不新增独立 schema 文件，`runtime/schemas/human-confirmation.v1.schema.json` 只读不动。
- lessons JSONL 两类行：`raw_observation`（机器无条件追加，`merged:false`）与 `merged_lesson`（复盘成功后写回，含 occurrence_count/source_refs/supersedes）；失败时不产生/不更新 merged 行。
- 消费边派生规则：X 的 evidence_refs 任一引用出现在同任务后续 Y 的 input_refs → 边 X→Y；否则 unknown。派生只读重算，不回写历史。
- overall pending 聚合（spec §5.4）：30 天窗口、权重 高=3/中=2/低=1、得分降序→频次降序→最近出现降序；频次按"任务×stage"粒度去重。
- CLI 惯例：ESM + 严格 `--key=value` 白名单 + 入口守卫 + stdout JSON + 失败 exit 1 + `--root` 支持 fixture。

## Implementation Order

0. Phase 0 硬约束复核（T0）——m15-retirement 未合并 main 则一切停下。
1. 数据面测试 RED（T1）。
2. stage-reflection.v1 schema + 路径白名单（T2、T3）。
3. 消费边派生脚本（T4）+ lessons 追加 CLI（T5）→ 数据面 GREEN（T6）；复盘校验器 RED（T25）→ 实现（T26）→ GREEN（T27）。
4. 〔与 1–3 并行〕补丁 A 测试 RED（T7）→ confirm writer v3（T8）→ 读取方兼容（T9，须在 T3 完成后执行）→ 补丁 A GREEN（T10）。
5. 〔runner 扩展可与 1–4 并行〕on_stage_end 调度 RED（T22）→ stage-runner 小幅扩展（T23）→ GREEN（T24）；技能本体（T11）→ 挂载 wiring RED（T12）→ 五 workflow 挂载 + catalog（T13，依赖 T24）→ wiring GREEN（T14）。
6. 页面投影 RED（T15）→ build-reflection-page + 模板（T16）→ 页面 GREEN + 真实浏览器 QA（T17）。
7. 文档修正四处（T18）+ CONTEXT.md 术语（T19）。
8. 构造场景端到端 + AC 全量映射（T20）→ AC-001 交接 + 用户抽查确认卡（T21）。

## Test Strategy

- **RED/GREEN 对**（同 gate_cmd、同 oracle）：T1↔T6（数据面）、T7↔T10（补丁 A）、T12↔T14（挂载 wiring）、T15↔T17（页面投影）、T22↔T24（runner on_stage_end 调度）、T25↔T27（复盘校验器）。每对共享同一测试文件，RED 记录失败事实，GREEN 复跑同命令断言 exit 0。
- **tier 分布**：simple 11（T0、T1、T2、T3、T6、T12、T14、T18、T19、T24、T27）；feature 15（T4、T5、T7、T8、T9、T10、T11、T13、T15、T16、T17、T22、T23、T25、T26）；fullstack 2（T20、T21）。准确分布以 tasks.md 卡片为准：simple 11 / feature 15 / fullstack 2。
- **contract 测试**（tests/contract/）：stage-reflection-schema、stage-reflection-paths、derive-consumption-edges、lessons-jsonl、human-confirmation-v3、stage-reflection-wiring、stage-reflection-skill-contract、build-reflection-page、stage-runner-on-stage-end、validate-stage-reflection。
- **回归**：`tests/e2e/vnext-five-stage-current.test.mjs:460` 等现有 v2 断言随 T9 更新并全量回归（AC-003 兼容证明）。
- **构造场景端到端**（tests/contract/stage-reflection-e2e-constructed.test.mjs）：fixture 任务覆盖 stage completed/failed 双态复盘、复盘失败只落 outcome status 不阻断、remove 门槛可证伪（无信号→校验器机器强制降级 needs_evidence；双信号→remove_candidate 保留）、lessons 生命周期、页面生成。
- **真实任务端到端（AC-001）**：evidence 允许来自下一个真实任务，本任务 close 前以构造场景覆盖其余 AC；T21 产出用户抽查确认卡，AC-001 状态如实标注 `deferred_to_next_real_task`，不伪造。
- **历史只读**：页面测试断言 m15 历史样本 sha256 不变（AC-009）。

## 风险与回滚

- m15-retirement 方案再变（RISK-005）：Phase 0 复核记录其最终 diff；若复核发现与本计划冲突的保留符号变化，停止并同步 spec/plan。
- v3 迁移影响确认流程（RISK-004）：读取方全部只读兼容 + e2e 回归；失败时回退 task-kernel 写入点至 v2，保留 RED 事实。
- 自评偏差（RISK-001）：FR-GATE 机器门槛 + confidence 展示兜底；本任务不做消融（DEFER-002）。
- 页面重成空壳（失败边界②）：T17 oracle 要求 fixture 真实数据驱动渲染断言 + 真实浏览器 QA（两视图三筛选五状态截图/操作日志）；T20 构造场景复验；空数据仅允许 empty 合法态。
- 回滚单位：Phase 1/2/3/4 各自文件面独立，可按 Phase git revert；挂载回滚=移除五个 steps.json 的 step 条目 + skill-deps 行；runner 扩展回滚=git revert stage-runner 调度扩展（校验器核心不受影响）；复盘校验器回滚=删除 validate-stage-reflection.mjs 与 move-map 条目（remove 门槛退回协议约束）。

## FR to AC to Task Traceability

| FR | 主要文件 | 测试/证据 | AC | Task |
| --- | --- | --- | --- | --- |
| FR-TRIG-001~002 | 五个 `workflows/*/steps.json`、`skill-deps.yaml`、`skills/catalog.yaml`、`runtime/stage/stage-runner.mjs`（on_stage_end 调度） | stage-reflection-wiring test + stage-runner-on-stage-end test | AC-001、AC-002 | T12、T13、T14、T22、T23、T24 |
| FR-EXEC-001~002 | `skills/stage-reflection/SKILL.md` | skill-contract test | AC-001、AC-002 | T11 |
| FR-OUT-001~004 | `runtime/schemas/stage-reflection.v1.json`、SKILL.md、`tools/cli/validate-stage-reflection.mjs`（evidence_refs 存在性） | stage-reflection-schema test + validate-stage-reflection test | AC-002 | T1、T2、T6、T11、T25、T26、T27 |
| FR-SEV-001~002 | schema、`tools/cli/build-reflection-page.mjs` | schema test + page test | AC-002、AC-006 | T2、T16 |
| FR-CONF-001~002 | `runtime/task/task-kernel-implementation.mjs:523` + 九处读取方 | human-confirmation-v3 test + e2e 回归 | AC-003 | T7、T8、T9、T10 |
| FR-EDGE-001~002 | `tools/cli/derive-consumption-edges.mjs` | derive-consumption-edges test | AC-004、AC-010 | T1、T4、T6 |
| FR-LESSON-001~004 | `tools/cli/append-lesson-observation.mjs`（runner 机器前奏主消费）、SKILL.md | lessons-jsonl test + stage-runner-on-stage-end test（前奏三场景） | AC-005 | T1、T5、T6、T11、T22、T23、T24 |
| FR-GATE-001~002 | SKILL.md（规则）+ derive 脚本（信号源）+ `tools/cli/validate-stage-reflection.mjs`（机器强制降级） | validate-stage-reflection test + e2e constructed（AC-007 可证伪） | AC-007 | T11、T20、T25、T26、T27 |
| FR-FAIL-001~002 | SKILL.md、`runtime/stage/stage-runner.mjs`（blocking:false 语义） | stage-runner-on-stage-end test + e2e constructed（AC-008） | AC-008 | T11、T20、T22、T23、T24 |
| FR-PAGE-001~006 | `tools/cli/build-reflection-page.mjs` + 页面模板 | build-reflection-page test + 真实浏览器 QA（截图/操作日志） | AC-006、AC-009、AC-010 | T15、T16、T17 |
| FR-DOC-001 | `docs/standard-workflow.md:9`、`workflows/make-decision/SKILL.md:58`、build-spec/build-plan SKILL.md、`AGENTS.md` | grep 复合 gate | AC-012 | T18 |
| FR-TERM-001 | `CONTEXT.md` | grep gate | AC-012 | T19 |
| （过程约束） | m15-retirement 合并复核记录 | quality/evidence/m15-merge-review.md | AC-011 | T0 |
| （端到端） | 构造场景 + 下一真实任务 | e2e constructed + 用户确认卡 | AC-001 | T20、T21 |

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

按项目 22 条宪法（CONSTITUTION.md v1.6.0）逐条对照：

### Framework Principles (F)

- [x] **F1 薄核心** — 复盘能力下沉 `skills/stage-reflection`；runner 仅小幅扩展调度语义（识别 `on_stage_end`/`blocking` 声明式标记：前置成败都执行、自身失败不翻转 stage 状态、不阻断 close），属调度非能力——不新增公共命令、不改校验器核心、判断硬门槛由独立 CLI 校验器承担而非塞入核心（裁决 P-002）。
- [x] **F2 窄契约** — stage-reflection.v1 / human-confirmation.v3 / lessons JSONL / data.js 四个窄契约，各自唯一读写方。
- [x] **F3 物理事实靠机器校验但不阻断** — 白名单登记、outcome 结构校验 fail-loud 记录，不阻断 stage/close。
- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 复盘是 judgment 非裁决；remove 最终裁决归人工 + M16 消融；用户抽查确认卡收口。
- [x] **F5 gate 谨慎添加出事再补无用则移除** — 不新增门禁；复盘失败不阻断（D-009）。
- [x] **F6 统一外置执行记录** — 复盘归档任务 quality/ 随任务保留；lessons 带 task/stage ref 可回溯。
- [x] **F7 推进与不可逆操作不自动越过人** — 本任务无不可逆动作；仓外孤儿目录清理移出本任务范围（见「延期与备注」）；历史数据只读。
- [x] **F8 简单优先** — 重建选仓外静态已证明模式；派生零新增埋点；不读 transcript 全文。
- [x] **F9 可证伪不假绿** — 行为变化全部 RED/GREEN 对；remove 门槛构造证伪用例；unknown/degraded/failed 如实落盘。
- [x] **F10 自动化按真实收益添加** — 四个 CLI 各自有明确 consumer（页面/复盘会话与 runner 前奏/门槛信号/机器核验降级），不堆基建。
- [x] **F11 控制面受限** — 公共命令七类不变；新文件逐一 move-map 登记 consumer/owner/删除条件；steps.json 仅新增两个声明式调度字段（`on_stage_end`/`blocking`，布尔、有默认值、其余 step 省略），是既有 manifest 的调度修饰而非新控制面，登记于裁决 P-002。

### Quality Principles (Q)

- [x] **Q1 记事实而非阻断** — status:failed/degraded 落盘继续；lessons 写回与成败解耦。
- [x] **Q2 gate 三类划分** — 入口校验（白名单/schema）、记录采集（复盘/派生/页面）、人工确认（AC-001 用户抽查）分离。
- [x] **Q3 异源审查加人工把关** — spec 已经独立审查（FND-S1~S3 处置）；plan/tasks 待 build-plan 确认；判断质量由用户审查（AC-001）。

### Skill Principles (S)

- [x] **S1 能用外部就不造轮子** — 复用 stage-runner 通用通道、现有确认写入点、仓外静态页面模式。
- [x] **S2 外部技能可针对项目改造合宪** — 页面蓝本仅作模式参考，投影器/模板为本任务新模块并登记。
- [x] **S3 迭代时保持最新并就地检查** — skill-bundle.json 与 catalog.yaml hash 同步（T13）。
- [x] **S4 自定义技能必须有指标系统** — 复盘产物本身即记录；不恢复 token/耗时遥测（非目标）。
- [x] **S5 自定义技能方便子代理调用省主上下文** — 四个 CLI 可由子代理/CI/runner 前奏调用；复盘在主会话但设计省 token（输入三来源）。
- [x] **S6 自定义技能参考市面方案不闭门造车** — F-012 六流派调研结论落入六类判断与机器门槛设计。
- [x] **S7 一阶段一技能一工作流一文件夹** — skills/stage-reflection 独立文件夹；五 workflow 各自挂载。
- [x] **S8 自定义技能可独立调用可搬运** — 技能不绑宿主（主会话自评，不依赖 Codex/DSH 钩子）。

**Constitution Check Result**: 22/22 clauses addressed. All gates pass. No violations requiring justification.

## Complexity Trade-offs

- **候选方案 A：新增专用强校验槽（类 spec_analyze）** vs **复用通用 step 通道** — 选后者，核心零改动（F-009 已核实通用校验足够）。
- **候选方案 B：独立新 facts 记录人工介入原文** vs **升级 confirmation 单写入源** — 选后者，禁双写（G-001）。
- **候选方案 C：每 step 显式登记消费** vs **outcome 派生** — 选后者，零侵入（G-002）。
- **候选方案 D：复用 m15 投影链** vs **重建** — 选后者，m15 投影链已全拆（F-014/D-008）。

## 删除证明

本任务不删除仓内生产代码，也不删除仓外目录。m15 监控链删除由 m15-retirement 任务负责（不在本任务范围）。m15 历史数据只读不删（AC-009）。

## 延期与备注

- 仓外孤儿目录 `~/Knowledge/Projects/workflowhub/tasks/Projects/`（相对路径拼接残留，F-013⑤）清理**移出本任务范围**（原 T18 删除动作已移除，FND-P2/P9 处置）：本任务不动仓外目录；建议由用户手工处理或由 m15-retirement 会话处理。

## Phase 0: m15-retirement 合并复核（无代码硬约束）

### Goal

确认 m15-retirement 已合并 main；复核其最终 diff 与保留符号集；确认本任务目标文件不依赖被删文件。

### Files

- `quality/evidence/m15-merge-review.md`（NEW，任务追踪目录证据）

### Tasks

- T0

### Verify

合并祖先性检查通过；复核记录含五项证据化核验（见 tasks.md T0，禁止关键词放行）：①main 检出中监控四件套逐文件断言不存在（gate 机器复验 absent 清单）；②保留符号集 grep 断言存在（gate 机器复验 present 清单）；③task-store 分类器状态符合 m15 后期望；④m15 最终 diff 摘要人工复核记录；⑤用户确认记录。五项未齐前 build-code 不得开工。

### Knowledge

m15 监控四件套已删未提交；m15 worktree git 对象库损坏无法看 log——ancestry 检查失败时以远端/用户提供证据替代并如实记录。

### STOP

m15-retirement 未合并 main，或复核发现保留符号集与本计划冲突——停止一切 build-code 工作，同步 spec/plan。

### Done

T0 完成且复核记录落盘。

### Risks and rollback

风险：m15 方案再变（RISK-005）。回滚：本 Phase 无代码改动，仅需修订计划。

## Phase 1: 数据面（schema + 白名单 + 派生脚本 + lessons）

### Goal

落地 stage-reflection.v1 schema、四处路径白名单、消费边派生脚本（补丁 B）、lessons 机器追加 CLI 与 JSONL 约定、复盘确定性校验器（remove 双硬信号强制降级 + evidence_refs 存在性）。

### Files

- `runtime/schemas/stage-reflection.v1.json`（NEW）
- `runtime/stage/stage-handlers.mjs`（MODIFY，:64-71,224 白名单）
- `runtime/stage/stage-runner.mjs`（MODIFY，:38 白名单）
- `runtime/task/task-kernel-implementation.mjs`（MODIFY，:29,74 白名单）
- `runtime/evidence/canonical-evidence-validators.mjs`（MODIFY，:219 白名单）
- `tools/cli/derive-consumption-edges.mjs`（NEW）
- `tools/cli/append-lesson-observation.mjs`（NEW）
- `tools/cli/validate-stage-reflection.mjs`（NEW，move-map 登记）
- `docs/architecture/move-map.json`（MODIFY）
- `tests/contract/stage-reflection-schema.test.mjs`、`stage-reflection-paths.test.mjs`、`derive-consumption-edges.test.mjs`、`lessons-jsonl.test.mjs`、`validate-stage-reflection.test.mjs`（NEW）

### Tasks

- T1、T2、T3、T4、T5、T6、T25、T26、T27

### Verify

T1 RED 记录失败事实后，T6 同 gate_cmd 复跑 exit 0（四个测试文件全绿）；T25 RED 后，T27 同 gate_cmd 复跑 exit 0（校验器测试全绿：双硬信号缺一即机器降级、unknown≠零消费、窗口边界、悬空引用降级）。

### Knowledge

step_outcomes[i].input_refs 为字符串数组、evidence_refs 为 {ref,sha256} 对象数组——派生脚本两种形态分别处理；quality-fact.v1.json 的 stage 枚举写死五阶段且 additionalProperties:false，白名单登记不得把 stage-reflection 文件引入 quality-fact 校验通道。校验器语义：30 天窗口内零消费（unknown≠零消费）∧（rejected ∨ 同 step_slug 人工介入≥2 次），双硬信号缺一即机器强制降级 needs_evidence 并记录降级事实；evidence_refs 悬空 → confidence 强制非 high + status degraded。

### STOP

若白名单登记破坏既有 quality/evidence 校验（回归失败），停止并回退登记，重新评估登记点。

### Done

T6 与 T27 GREEN；move-map 四条新文件登记齐备（schema、三个 CLI）。

### Risks and rollback

风险：登记点行号漂移导致误登记。回滚：git revert 白名单改动 + 删除新文件，保留 T1 RED 事实。

## Phase 2: 补丁 A——human-confirmation v3（与 Phase 1 并行）

### Goal

confirm 写入点升级 v3（reply_text + step_slug）；全部读取方只读兼容 v1/v2/v3；受影响测试断言更新并回归。

### Files

- `runtime/task/task-kernel-implementation.mjs`（MODIFY，:523 写入点；:593-602 authorize 不动）
- 九处读取方（completion-predicates/stage-runner/stage-handlers/freshness/canonical-evidence-validators/core/task-close/mini-task-runner/public-behavior-baseline）（MODIFY）
- `tests/contract/human-confirmation-v3.test.mjs`（NEW）
- `tests/e2e/vnext-five-stage-current.test.mjs`（MODIFY，:460 等断言更新）

### Tasks

- T7、T8、T9、T10

### Verify

T7 RED 后，T10 全量 v3 测试 + v2 消费点 e2e 回归 exit 0（AC-003）。

### Knowledge

v3 跟随 v2 内联模式，不新增独立 schema 文件；`runtime/schemas/human-confirmation.v1.schema.json` 只读不动；独立 authorize（无前置 v3 confirmation）介入归因 reply_text=null 且 confidence≠high。

### STOP

若读取方兼容改造需要改写历史记录，停止——兼容必须只读，改写即违反 provenance 保留。

### Done

T10 GREEN；无 v1/v2 历史记录被改写（抽查 sha256）。

### Risks and rollback

风险：断言更新掩盖真实回归（RISK-004）。回滚：task-kernel 写入点退回 v2 常量，读取方改动整体 revert，保留 RED 事实与断言变更理由清单。

## Phase 3: runner 调度扩展、技能本体与五 stage 挂载

### Goal

stage-runner 小幅扩展 `on_stage_end`/`blocking` 调度语义与 append 机器前奏（不改校验器核心，P-002）；交付 skills/stage-reflection（SKILL.md 会话内执行协议 + skill-bundle.json）；五个 workflow 的 steps.json/skill-deps.yaml 挂载；catalog.yaml 登记。

### Files

- `runtime/stage/stage-runner.mjs`（MODIFY，on_stage_end 调度扩展 + 机器前奏；不改校验器核心）
- `skills/stage-reflection/SKILL.md`、`skills/stage-reflection/skill-bundle.json`（NEW）
- `workflows/make-decision/steps.json`、`workflows/build-spec/steps.json`、`workflows/build-plan/steps.json`、`workflows/build-code/steps.json`、`workflows/verify-code/steps.json`（MODIFY，各增 stage-reflection step，声明 `on_stage_end:true` + `blocking:false`）
- 五个 `workflows/*/skill-deps.yaml`（MODIFY）
- `skills/catalog.yaml`（MODIFY）
- `docs/architecture/move-map.json`（MODIFY）
- `tests/contract/stage-runner-on-stage-end.test.mjs`、`stage-reflection-skill-contract.test.mjs`、`stage-reflection-wiring.test.mjs`（NEW）

### Tasks

- T22、T23、T24、T11、T12、T13、T14

### Verify

T22 RED 后，T24 runner 集成测试 exit 0：前置 step 失败时复盘 step 仍执行、复盘 step 失败 stage 仍 completed、close 照常、技能未启动/超时/失败三场景 raw 已追加；T12 RED 后，T14 wiring 测试 exit 0：五 stage 均含 stage-reflection step（含 `on_stage_end:true` + `blocking:false` 声明）、skill-deps 登记完整、catalog hash 同步；skill-contract 测试断言 SKILL.md 含执行协议必备条款。

### Knowledge

verify-code 全挂裁决见「关键裁决记录 P-001」；挂载形态与 runner 扩展裁决见 P-002；SKILL.md 协议要素：输入三来源、输出六类+needs_evidence、runner 机器前奏追加 raw、derive-consumption-edges.mjs 接线为 remove 门槛输入、validate-stage-reflection.mjs 机器核验降级、失败只落 outcome status 不阻断、degraded 语义、lessons 合并写回协议、interventions 归因降级规则。

### STOP

若挂载导致任一 stage 的既有 step 序列校验失败（entry_conditions/depends_on 冲突），停止并调整 step 顺序而非削弱既有约束。

### Done

T24 与 T14 GREEN；catalog/bundle hash 同步。

### Risks and rollback

风险：未声明 stage 不复盘（D-001 已述，manifest 强约束兜底）；runner 调度扩展影响既有 step 序列（默认值兜底 + e2e 回归）。回滚：移除五个 step 条目 + skill-deps 行 + 删除 skills/stage-reflection/；git revert stage-runner 调度扩展。

## Phase 4: 全局页面重建

### Goal

tools/cli/build-reflection-page.mjs 遍历任务复盘产物 + lessons → 生成仓外 data.js；静态页面模板对标蓝本（两视图 + 三维筛选 + unknown 如实呈现 + judgment 标注 + safeRef）。

### Files

- `tools/cli/build-reflection-page.mjs`（NEW）
- `tools/cli/reflection-page-template.html`（NEW，或等效内联模板文件）
- `docs/architecture/move-map.json`（MODIFY，注明替代 ADR 0012 退役条目、唯一 consumer=用户浏览器/M16 数据输入、owner、删除条件）
- `tests/contract/build-reflection-page.test.mjs`（NEW，含 fixture）

### Tasks

- T15、T16、T17

### Verify

T15 RED 后，T17 同 gate exit 0：data.js freeze 常量注入、§5.4 聚合排序、unknown/empty/degraded/fatal 各态渲染断言、judgment 标注、safeRef 防注入、m15 历史样本 sha256 不变（AC-009）；T17 含真实浏览器 QA：fixture 生成页面后用浏览器实际加载（主会话 agent-browser 技能），操作任务视图/overall pending 两视图与三类筛选，验证 unknown/degraded/failed/fatal/empty 五种状态如实呈现，截图与操作日志落 `quality/evidence/stage-reflection-page-qa/`。

### Knowledge

蓝本要点：`globalThis.__WH_MONITOR_DATA__` freeze 常量 data.js、单文件内联 CSS、document.createElement、中文 label 映射、stale/partial/fatal 显式、safeRef；页面只展示 judgment 不展示为事实；聚合零 AI 成本（M0，AC-010）。

### STOP

若页面生成需要写历史数据目录或引入服务依赖，停止——形态违规，回到纯静态只读设计。

### Done

T17 GREEN；仓外页面用 fixture 数据可打开且各状态如实呈现。

### Risks and rollback

风险：空壳页面（失败边界②）。回滚：删除新模块与 move-map 条目；历史三件套不受影响（只读）。

## Phase 5: 文档修正与术语补录

### Goal

FR-DOC-001 四处文档落点修正；FR-TERM-001 CONTEXT.md 术语补录。

### Files

- `docs/standard-workflow.md`（MODIFY，:9）
- `workflows/make-decision/SKILL.md`（MODIFY，:58）
- `workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`（MODIFY，同条款）
- `AGENTS.md`（MODIFY，治理边界条）
- `CONTEXT.md`（MODIFY，stage-reflection / 判断层 vs 事实层）

### Tasks

- T18、T19

### Verify

grep 复合 gate：四处文档均写死 `specs/<task-id>/` 落点；CONTEXT.md 含两条新术语。

### Knowledge

代码约定一直正确（core/artifact-dir.mjs:73,81-82），本 Phase 零代码改动；m15-retirement 会话的材料迁移由其会话执行，本任务不动；仓外孤儿目录清理移出本任务范围（见「延期与备注」）。

### STOP

若修正措辞被误读为新门禁或改变了 skill 行为语义，停止并重新措辞（只写落点约定）。

### Done

T18、T19 gate 通过（AC-012）。

### Risks and rollback

风险：文档措辞扩散为行为约束。回滚：git revert 文档改动。

## Phase 6: 聚合验证（FINAL）

### Goal

构造场景端到端覆盖 AC-002~AC-012 并产出 AC 全量映射表；AC-001 真实任务端到端交接下一真实任务 + 用户抽查确认卡。

### Files

- `tests/contract/stage-reflection-e2e-constructed.test.mjs`（NEW，含构造 fixture）
- `quality/evidence/stage-reflection-ac-mapping.md`（NEW）
- `quality/evidence/stage-reflection-user-review-card.md`（NEW）

### Tasks

- T20、T21

### Verify

构造场景测试 exit 0（覆盖 SCN-001~006 等价场景：双态复盘、复盘失败、remove 门槛证伪、lessons 生命周期、页面生成）；AC 映射表 12 行齐备且 AC-001 标注 `deferred_to_next_real_task`；用户抽查确认卡落盘。

### Knowledge

AC-001 evidence 允许来自下一个真实任务（D-010）；本任务 close 前构造场景覆盖其余 AC；不得把构造场景冒充真实任务背书（M15 空壳教训）。

### STOP

若任一 AC 无法由构造场景或既有证据覆盖，停止并升级人工决策——不得以 unavailable 判绿。

### Done

T20、T21 完成；AC 映射表 + 用户确认卡落盘，进入 verify-code。

### Risks and rollback

风险：构造场景与真实任务行为漂移。回滚：无代码回滚需求；如实标注 AC-001 待真实任务复核。
