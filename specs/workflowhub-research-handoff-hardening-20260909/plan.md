# 实现计划：WorkflowHub 调研、阶段状态、自动复盘与交接加固

- **Input**：`specs/workflowhub-research-handoff-hardening-20260909/decision-log.md`、`specs/workflowhub-research-handoff-hardening-20260909/spec.md`
- **Template version**：`plan-task.v4`
- **Planning input status**：`recorded` — 用生产入口（材料键名去掉 `.md` 后缀）重新构建 `stage-input-packet.v1` 成功，`verifyStageInputPacket.ok=true`；此前 `degraded` 所称的"decision-log 缺 material-navigation"是诊断 harness 键名错误，不是材料缺陷（PFACT-011 / D-010）。最终冻结由 stage outcome 按最终材料字节记录；冻结 hash 不写回材料，避免内容寻址自引用。

## 材料导航

| 章节 / 材料锚点 | 职责与摘要 | M/S/B/P 读取时机 |
| --- | --- | --- |
| `decision-log.md#决定` | R-001～R-024、D-001～D-013（含增量模块 F）、非目标和原始 OPEN/DEFER | M/S/B；阶段入口与方向校验 |
| `spec.md#5-功能需求` | 28 个 FR、13 个 AC、29 个场景与失败边界 | S/B/P；设计、实现和验收 |
| `plan.md#solution-design` | 工程方案、单 Phase 文件权威、验证与回滚 | B/P；任务设计与审查 |
| `tasks.md#phase-p1--集成纵切` | 8 组 RED/GREEN 和唯一 FINAL 卡（T017）的执行边界 | B/P；逐卡实施与记录 |

M=make-decision 回看；S=build-spec；B=build-plan/build-code；P=verify-code。

## Quick Read

- **Goal**：将 research 三态事实、execution outcome 投影、review 单源与预算归域、控制面治理（含 verify 发布与根因归并）、五 stage 自动 reflection、四作者 stage current handoff、UI applicability 结构化契约和性能预算收敛到既有 runtime/host 链。
- **Non-goals**：来源：NG-001～NG-012、D-002/D-005/D-006/D-009/D-011/D-012/D-013。不改仓外 handoff/receive-handoff，不新增 stage/public command/gate/selector/ledger，不给 verify-code 生成 handoff，不保存 handoff 历史，不升格 capability proof，不给任务索引或协议错误事实文件补写，不迁移历史坏 review 字节，不退役 `quality/verify.json`，不用删除身份校验换速度。
- **Before**：research 借用 test receipt；多个等价 outcome 被判 conflict 再折叠成 missing；review 预算历史被无关坏记录全局锁死（投影侧 main 已按 `status !== "unavailable"` 收口，仍缺 namespace 归域隔离）；reflection 生产 executor 缺失；handoff 过薄且不在 taskPath；UI applicability 用自由文本被判 `missing`；identity 校验与 official fixture 重复执行放大耗时。
- **After**：正式原件均按 current identity 认证；质量缺口保持 incomplete/unavailable；UI 事实写入与读取同规则；预算历史先归域再判语义；性能落在预算内且边界校验不变；不影响四材料驱动的同 task 修复。
- **Main risk**：`stage-handlers.mjs`、`stage-runtime.mjs`、`stage-runner.mjs`、`material-workspace.mjs`、`workspace.mjs` 是多域 seam；若拆成多 Phase 会发生文件双所有权和中间不可执行状态。
- **Next step**：T001 先用 research 三态和非谓词断言取得真 RED；若 RED 是环境/夹具失败而非目标断言，STOP。

## Technical Context

### Global Constraints

- **Verified facts**：Node `v24.14.0`；认证 worktree branch=`task/workflowhub/workflowhub-research-handoff-hardening-20260909`；2026-09-10 已把 `main` 快进合并进本分支，baseline=`7b95e96dec453923f73988ccc7f1d202c59f90cf`（原 `1195bca0` 不再是分支 HEAD），HEAD tree=`d9c7459532a31a992664faf54845628d8a3b9341`；main 的 3 个提交改了 42 个文件，其中 **14 个落在本计划边界内**（详见「合并后现状与消费者登记」）；research 读取现为 test receipt；reflection deadline 已存在；`tests/final-cutover-guards.red.test.mjs` 仍有 21 条 `it.skip`（其中 `it.skip.each` 展开后共 22 个跳过用例）；生产入口 packet 构建已复现成功（键名去掉 `.md` 后缀，`verify.ok=true`）。
- **Language / runtime**：ESM JavaScript、Node >=24、Vitest；JSON Schema 由既有 Ajv 路径消费。
- **Primary dependencies**：复用 `TaskKernel.publishCanonicalRecord`、`TaskHandle.writeRecordAtomic`、`runStageEndReflection`、`runStageReflection`、既有 wh-review lifecycle 和 stage-agent bridge；不新建 writer/dispatcher。
- **Storage / state**：immutable research/review/outcome/reflection 继续在 taskPath `quality/`；handoff 唯一例外是固定 `<stage>.md` current view，原子覆盖、无历史。
- **Testing**：只跑任务卡列出的定向 contract/integration/E2E 命令；禁止无范围 `vitest`、`npm test`、`test:safe`。
- **Target environment**：WorkflowHub CLI + host Stage Agent bridge；无 Web/UI。
- **Scale / scope**：单个集成 Phase，17 张卡；8 个行为域各一对 RED/GREEN，再加唯一 FINAL（T017）。
- **Unresolved facts**：packet 构建与 UI applicability 已在 2026-09-10 复现修复（PFACT-011/PFACT-012），不再是缺口；剩余未决项为 OPEN-004、OPEN-006、OPEN-010、OPEN-016（OPEN-015 已由本 plan 定稿为 `resolved_by_plan`），owner 分别为 build-plan/build-code，均不阻断同 task 规划与修复。

## Code Anchors

- **Verified anchors**：`runtime/stage/stage-handlers.mjs:NAMESPACE/receipt/testFacts/findingDispositions`；`runtime/stage/completion-predicates.mjs:selectLatestTerminalObservation/deriveStageCompletion/deriveStageOutcomeStatuses`；`runtime/stage/stage-agent-outcome-adapter.mjs:missingOutcome`；`runtime/stage/stage-runner.mjs:runStageEndReflection/scheduleReflection`；`tools/cli/stage-runtime.mjs:stageReflectionPublication/status projection`；`tools/host/workflowhub-stage-agent-bridge.mjs` session lifecycle bridge；`runtime/review/review-record-route.mjs:readCanonicalBudgetHistory/runRound`；`runtime/evidence/stage-content-evidence.mjs:validateReviewBudget`（budget kind 与 `route_repair` 的真实归属）；`runtime/evidence/quality-store.mjs:publishVerifySummary/assertQualityValue`；`runtime/task/material-workspace.mjs:packetSourceEntries/buildStageInputPacket`；`runtime/stage/stage-content-contracts.mjs:sourceConclusion/validateUiApplicability`；`runtime/task/workspace.mjs` 与 `runtime/task/task-kernel-implementation.mjs` 的 identity 校验热点。
- **Existing interfaces**：`publishCanonicalRecord(ref, raw)`；`writeRecordAtomic(ref, value)`；`runStageEndReflection(context, options)`；`runStageReflection(...)`；`deriveStageCompletion(stage, observations)`；`buildStageInputPacket(...)`；`validateUiApplicability(value)`。
- **Read now**：上述 seam、`runtime/task/task-handle.mjs`、`runtime/task/task-kernel-implementation.mjs`、四个 author workflow `skill-deps.yaml`。
- **Must read before task**：T007 直接消费下方已冻结的 21 行 disposition，不在 build-code 重新发明分类；T009 执行前回读 host bridge 真实 session schema；T013 先复现"生产键名 packet 构建成功、错误键名才报错"再改 UI 契约；T015 先量取 Git spawn 与 wall-time 基线再设预算。
- **Context mode**：Full — 横跨 runtime、host、skill/workflow 和 task-store，Lite 会丢失生产消费者。

### OPEN-006 — 21 个历史 skip 的 build-plan disposition

这些守卫属于已退役 verify-code audit surface；本期不批量 unskip。`retire_with_replacement` 仅在所列 current replacement tests 于 T007/T008 gate 通过后删除原 skip；证据不足项保留 skip 并 `defer`。owner 均为 T007/T008，defer 关闭条件是补齐一对一 current consumer/oracle 后重新 build-plan。

| 原行 | 守卫对象 | disposition | current replacement / 证据 |
| ---: | --- | --- | --- |
| 636 | failing test command → quality fact | retire_with_replacement | `vnext-official-stage-run:1779,1812,1854`；`official-component-receipts:642` |
| 649 | revise_required build-code review audit-only | retire_with_replacement | `vnext-five-stage-current:948,975`；`stage-risk-acceptance:317` |
| 669 | authenticated unavailable build-code review | retire_with_replacement | `vnext-official-stage-run:1184`；`vnext-five-stage-current:1217` |
| 717 | revise_required 是 bound fact 非 pass | retire_with_replacement | `vnext-official-stage-run:972`；`stage-risk-acceptance:317` |
| 765 | unavailable attempt 与 provider pass 矛盾 | defer | 尚无 attempt/result 语义矛盾的一对一 current oracle |
| 790 | unknown formal review verdict | defer | invalid input 已覆盖，但 unknown verdict consumer 未证实 |
| 800 | result 脱离 attempt/provider evidence | retire_with_replacement | `review-record-route:471,604,742` |
| 837 | result pass 但 raw 要 revise | defer | 尚无 raw-output→semantic-verdict 一对一反欺骗断言 |
| 1213 | current review 优先于 legacy accepted | retire_with_replacement | `vnext-five-stage-current:948,975` |
| 1227 | historical unavailable 不擦除 current dispositions | defer | 尚无“不可擦除 current dispositions”精确断言 |
| 1253 | current unavailable 不得复用 historical recorded | retire_with_replacement | `vnext-five-stage-current:948,975`；`vnext-official-stage-run:1184` |
| 1281 | historical/current 都有 finding 仅用 current | retire_with_replacement | `vnext-five-stage-current:948`；`vnext-official-stage-run:972` |
| 1318 | stale recorded review 不用于 current dispositions | retire_with_replacement | `verify-freshness-selection:283`；`vnext-official-stage-run:1158,1238` |
| 1348 | 双 unavailable 时 dispositions missing | defer | unavailable 保真已覆盖，双 unavailable→missing 未覆盖 |
| 1375 | decision-log source ID replay | retire_with_replacement | `official-component-receipts:506`；`stage-handlers:2171-2242` |
| 1409 | 无 legacy build-code acceptance 时 truthful incomplete | retire_with_replacement | `vnext-five-stage-current:933,1061`；`vnext-official-stage-run:1749` |
| 1469 | current AC set empty 不算 covered | retire_with_replacement | `vnext-official-stage-run:1749,1758`；`stage-risk-acceptance:317` |
| 1498 | tests/reviews 不匹配 current workspace | retire_with_replacement | `verify-freshness-selection:42,283`；`vnext-official-stage-run:1158,1238` |
| 1583 | acceptance evidence 缺 criterion identity/schema | retire_with_replacement | `official-component-receipts:276-284`；共享 validator consumers |
| 1594 | duplicate ID / nested hash mismatch | defer | duplicate 已覆盖；nested hash mismatch 尚无同层替代，整项保留 |
| 1606 | failed AC 被记录但不阻断 publication | retire_with_replacement | `official-component-receipts:261-274`；`vnext-five-stage-current:1217` |

结论：`restore=0`、`retire_with_replacement=15`、`defer=6`。这是 OPEN-006 的 build-plan handoff；实施只能按行执行，不能把 `unknown` 当删除证明。（合并后复核：21 条 `it.skip` 仍在原行；`it.skip.each` 在 L1594 展开为 2 个用例，实际跳过 22 个用例。）

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
| --- | --- | --- | --- |
| canonical research publication | extend | `runtime/task/task-kernel-implementation.mjs:publishCanonicalRecord` | 只加 schema/reader/listing，不恢复专用 writer |
| research retry/fallback record | extend | `skills/anysearch/`、`skills/deep-research/SKILL.md` | 统一 attempt 失败语义；宿主真调用仍由 host 能力提供 |
| execution outcome | extend | `deriveStageOutcomeStatuses`、既有 status JSON | 改为语义签名和独立披露，不建 selector/persisted object |
| review consistency | extend | stage-agent lifecycle + `codeReviewFacts` | 修 producer/session event，reader 不反推成功 |
| reflection execution | extend | `stageReflectionPublication`、stage-agent bridge 稳定 outcome ref | bridge 先定稿 outcome；宿主随后生成独立 judgment，并作为 official `run` 的 sibling input 交给既有 stage-end executor seam；不新增 public command |
| current handoff projection | new | `runStageEndReflection` 同一 hook + `writeRecordAtomic` | consumer=用户/下一会话；owner=author stage hook；test=T011/T012；删除条件=连续 3 个 task 的 handoff 读取方为 0（完整消费边扫描 + 人工复核），或读取方改由其他机制承担 |
| control-plane inventory | new | `docs/architecture/move-map.json`、deletion proofs | consumer=实施/验证审查；owner=architecture governance；test=T007/T008；删除条件=move-map 能原生表达同等逐对象处置并且 consumer 已迁移 |
| UI applicability contract | extend | `runtime/stage/stage-content-contracts.mjs:sourceConclusion/validateUiApplicability` | source 改为显式结论并让 writer 复用同一 validator；不新增第五材料、不扩兼容正则 |
| review budget namespace | extend | `runtime/review/review-record-route.mjs:readCanonicalBudgetHistory` | 先归域再判语义；不新增 selector/ledger，不改历史字节 |
| performance budget | extend | `runtime/task/workspace.mjs`、`runtime/task/task-kernel-implementation.mjs`、official fixture 构造 | 单 authenticated operation 内复用已校验身份并共享 fixture；不新增持久缓存 |
| verify publication | extend | `runtime/evidence/quality-store.mjs:publishVerifySummary` + 既有 canonical writer | 指定唯一 writer 并补 canonical guard；不新建第二权威 |
| root-cause gap aggregation | extend | `tools/cli/stage-runtime.mjs` gap 派生 | 在既有 gap 记录上加根因字段；不建第二投影对象 |

## 合并后现状与消费者登记

2026-09-10 把 `main`（`7b95e96d`）快进合并进本分支后，计划按当前代码读取：

- **已部分实现**：review 投影侧已按 `status !== "unavailable"` 收口（`runtime/review/review-record-route.mjs`），source-drift 不再 throw；main 另加 `route_repair` budget kind（`runtime/evidence/stage-content-evidence.mjs`）。**它不替代** FR-REVIEW-003 的 namespace 隔离：`readCanonicalBudgetHistory` 仍是全量校验、首条坏记录即抛，"无关历史→恰好 dispatch 一次"分支仍缺失。
- **仍未实现**：research 三态与 reader、execution 语义签名与 `execution_outcome`、verify 唯一 publisher 与根因归并、reflection 生产 executor、`stage-handoff`、性能预算、UI writer 侧共享 validator。相关任务全部保留。
- **消费者登记（不归本任务修改，也不进任何卡 `gate_cmd`）**：`tests/review/review-managed-lifecycle.test.mjs`、`tests/contract/test-runtime-profile.test.mjs`、`tests/contract/per-ac-material-freshness.test.mjs`、`tests/contract/governance-review-dispatch-boundary.test.mjs`、`tests/acceptance/workflow-execution-current-task.test.mjs`。
- **因此新增 MODIFY 边界**：`runtime/evidence/stage-content-evidence.mjs`、`runtime/review/schemas/attempt.schema.json`（T005/T006）、`tests/contract/host-outcome-bridge.test.mjs`（T010）。

## Solution Design

### Overview

一个集成 Phase 完成八条纵切，因为 `stage-handlers.mjs`、`stage-runtime.mjs`和 `stage-runner.mjs` 同时是多域 seam。任务仍按 producer-before-consumer 串行：先调研事实，再 outcome/review，再治理，最后 reflection/handoff。

research 纵切新增窄 schema/reader，原件仍由通用 canonical writer 发布。status 只读 current research fact 和 current outcome cohort，不把它们塞进 completion predicates。review 的 skill row 和 integration fact 都从同一 bridge lifecycle 事件派生。

UI applicability 纵切把三输入改成显式结论，并让写入方复用 reader 的同一 validator；review 预算纵切在既有 budget history reader 里先归域再判语义；性能纵切在单次 authenticated operation 内复用已校验身份并共享 official fixture；治理纵切补齐 `quality/verify.json` 的唯一 writer 与 canonical guard，并在既有 gap 记录上按根因归并。

stage-reflection 不在 deterministic runtime 伪造 judgment。bridge 先发布 Stage Agent outcome 并返回稳定 ref/hash；当前宿主必须从该时刻起在 30 秒内用 session/memory executor 生成引用该 ref 的独立 v2 judgment，并在随后 official `run` 里作为 `stage_reflection` sibling input 提交。stage-runtime 将它从 handler input 剥离，runner 在 stage publication 后把原始 value 直接交给 `runStageReflection`；runtime 校验 outcome binding、executor attempt 起止时间和 output hash，不把 JSON 包装成伪 executor。随后同一 hook 调用 `stage-handoff`，两者错误双向隔离。

### Module responsibilities

#### Research reader

- **Responsibility**：按 raw bytes hash、三态 schema 和 current identity 认证 research report，派生唯一披露。
- **Consumes**：`research-report.v1` raw bytes + task/stage/snapshot/material identity。
- **Produces**：`researchFacts()` 和 status `research` object。
- **Must not decide**：不判调研质量 pass，不改 completion predicate。

#### Outcome and review projection

- **Responsibility**：对 authenticated current cohort 求语义签名；让 review 两投影共用 lifecycle 事实。
- **Consumes**：stage outcome immutable records、bridge session events、canonical review ref/hash。
- **Produces**：`execution_outcome`、review skill row、integration review fact。
- **Must not decide**：不挑 winner，不放宽 recorded-only review predicate。

#### Stage-end products

- **Responsibility**：运行真实 reflection executor，然后生成四 author stage 的 current handoff。
- **Consumes**：authenticated stage outcome、official `run` 的独立 `stage_reflection` sibling JSON、reflection terminal result、四材料引用。
- **Produces**：immutable reflection + `quality/evidence/handoff/<stage>.md` current view + 绝对路径摘要。
- **Must not decide**：handoff 不作质量事实，reflection/handoff 不改 stage completion。

#### Material and UI contract

- **Responsibility**：三输入 UI applicability 的显式结论、合并规则与生产 packet 校验入口。
- **Consumes**：decision-log 三输入事实、生产 `buildStageInputPacket` 入口。
- **Produces**：可重算的 `ui`/`non_ui`/`unknown` 事实、冲突与缺失原因。
- **Must not decide**：不默认 `non_ui`，不引入自由文本推断，不改 stage 拓扑。

#### Performance budget

- **Responsibility**：单次 authenticated operation 内的身份校验复用与 official fixture 共享。
- **Consumes**：authenticated operation 边界、身份/快照校验、fixture 构造入口。
- **Produces**：wall-time 与 Git spawn 的可判真预算，以及身份变化负例。
- **Must not decide**：不放宽身份/快照/材料校验，不跨 operation 复用缓存。

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：`research-report.v1`；`execution_outcome{status,blocking:false,attempt_count,completed_attempt_count,refs,diagnostic?}`；official `run` input 增加 plain JSON `stage_reflection` sibling（不是 receipt/fact）；`stage_handoff{status,path,error?}`；UI applicability source 对象新增显式 `conclusion`；budget 读取新增 `namespace{stage,track,kind,phase,subject,current_identity}` 归域结果；gap 记录新增 `root_cause_id/source_layer/owner/derived_views`。
- **Data flow / state**：host tool attempts → research report → canonical writer → research reader/status；outcome records → semantic signature → execution disclosure；review lifecycle → row/fact；budget history → 归域 → 三分支 dispatch 决策；bridge outcome stable ref → host session/memory judgment → official run sibling → stage-end reflection transaction → handoff；identity 校验 → 单 operation 复用 → wall-time/spawn 预算；verify 结果 → 唯一 writer → `quality/verify.json` → 逐 AC 权威。
- **API contract**：N/A — 不新增 HTTP API，仅扩展现有 Node/CLI/bridge 数据合同。
- **UI / external code**：N/A — 当前方向是 non-UI；外部表面仅为 CLI JSON、阶段末文本和文件。
- **Fail-loud behavior**：同 attempt 异字节拒绝写；多语义签名 public failed + diagnostic；无 lifecycle 的 review 保持 missing/unavailable；handoff 覆盖失败警告 stale，不把旧件报 current。

## UI Delivery Contract (仅 UI phase/task 使用)

- **UI applicability**：`non_ui`；N/A — 本任务只改 CLI/runtime/skills/文件产物。
- **Component action**：N/A — 无组件。
- **Real consumer**：N/A — 无页面消费者。
- **State owner**：N/A — 状态由 runtime/task records 拥有。
- **Typed ViewModel**：N/A — 无 UI ViewModel。
- **CSS/token owner**：N/A — 无 CSS/token。
- **Fixture / viewport**：N/A — 使用 Node fixtures，无 viewport。
- **Browser / a11y / performance**：N/A — 无 browser 路径；超时和性能边界由 command/service 测试覆盖。
- **Screenshot handoff**：N/A — 无视觉产物。
- **Coverage limits**：不覆盖 Web/移动端、宿主不可控的外部 provider SLA。
- **N/A / unknown reason**：上游源材料语义明确 non-UI；2026-09-10 已把三输入改为显式结论，reader 返回 `recorded/non_ui`，此前的 `missing` 是 source shape 误判（PFACT-012），已修正、不靠改填 UI 规避。

### Design-gap handoff (不改变 Design.md 权威)

- **design_status**：`acknowledged` — non-UI，无 Design.md 改动。
- **missing_items / reason**：`[]`；产品范围不包含 UI。
- **fallback_visual_basis**：N/A — 无视觉交付。
- **constraints / assumptions**：CLI JSON 字段与 Markdown 路径是唯一用户可见界面。
- **rework_risk / human_confirmation**：若引入 UI，STOP 回 make-decision；当前无 UI 确认需求。
- **current_material_ref / design_revision**：`spec.md#PFACT-014`；Design.md=N/A。
- **visible_labels**：`execution_outcome`、`research`、handoff 绝对路径。
- **preview_refs / fixture_refs / viewport_refs / screenshot_refs**：fixture refs=各 task test fixture；其余 N/A — non-UI。
- **responsive / a11y**：N/A — 无视觉/交互状态。

## File Boundary

### NEW

- `runtime/schemas/research-report.v1.json`
- `runtime/evidence/research-report.mjs`
- `runtime/stage/stage-handoff.mjs`
- `skills/stage-handoff/SKILL.md`
- `skills/stage-handoff/skill-bundle.json`
- `docs/architecture/control-plane-inventory.json`
- `docs/adr/0026-equivalent-stage-outcome-attempts.md`
- `tests/contract/research-report.test.mjs`
- `tests/contract/execution-outcome.test.mjs`
- `tests/contract/control-plane-governance.test.mjs`
- `tests/contract/stage-handoff.test.mjs`
- `tests/contract/ui-applicability-contract.test.mjs`
- `tests/contract/review-budget-namespace.test.mjs`
- `tests/contract/performance-budget.test.mjs`
- `tests/contract/verify-publication.test.mjs`
- `tests/acceptance/workflowhub-research-handoff-hardening.acceptance.mjs`

### MODIFY

- `runtime/stage/stage-handlers.mjs`
- `runtime/stage/completion-predicates.mjs`
- `runtime/stage/stage-content-contracts.mjs`
- `runtime/review/review-record-route.mjs`
- `runtime/evidence/stage-content-evidence.mjs`
- `runtime/review/schemas/attempt.schema.json`
- `runtime/evidence/quality-store.mjs`
- `runtime/task/material-workspace.mjs`
- `runtime/task/workspace.mjs`
- `runtime/stage/stage-agent-outcome-adapter.mjs`
- `runtime/stage/stage-runner.mjs`
- `runtime/stage/stage-reflect.mjs`
- `runtime/schemas/stage-reflection.v2.json`
- `runtime/task/task-handle.mjs`
- `runtime/task/task-kernel-implementation.mjs`
- `runtime/task/task-kernel.mjs`
- `runtime/evidence/stage-completion-facts.mjs`
- `core/task-close.mjs`
- `core/runtime-mode.mjs`
- `tools/cli/stage-runtime.mjs`
- `tools/host/workflowhub-stage-agent-bridge.mjs`
- `workflows/make-decision/steps.json`
- `workflows/make-decision/skill-deps.yaml`
- `workflows/build-spec/skill-deps.yaml`
- `workflows/build-plan/skill-deps.yaml`
- `workflows/build-code/skill-deps.yaml`
- `skills/workflowhub-host-protocol/SKILL.md`
- `skills/deep-research/SKILL.md`
- `skills/deep-research/skill-bundle.json`
- `skills/anysearch/SKILL.md`
- `skills/anysearch/skill-bundle.json`
- `skills/anysearch/scripts/anysearch_cli.js`
- `skills/anysearch/scripts/anysearch_cli.py`
- `skills/anysearch/scripts/anysearch_cli.sh`
- `skills/anysearch/scripts/anysearch_cli.ps1`
- `skills/catalog.yaml`
- `skills/reuse-registry.md`
- `CONTEXT.md`
- `docs/architecture/move-map.json`
- `tests/contract/status-derivation.test.mjs`
- `tests/contract/stage-completion.test.mjs`
- `tests/contract/host-outcome-bridge.test.mjs`
- `tests/contract/acceptance-execution-tier.test.mjs`
- `tests/integration/quality-store-concurrency.test.mjs`
- `tests/contract/stage-reflection-wiring.test.mjs`
- `tests/contract/stage-runner-reflection.test.mjs`
- `tests/contract/stage-runner-on-stage-end.test.mjs`
- `tests/contract/workflow-synchronization-consumer.test.mjs`
- `tests/e2e/stage-reflection-real-task.test.mjs`
- `tests/stage-interaction-contract.test.mjs`
- `tests/integration/vnext-official-stage-run.test.mjs`
- `tests/review/review-record-route.test.mjs`
- `tests/final-cutover-guards.red.test.mjs`
- `tests/integration/mutation-guards.test.mjs`
- `tests/official-component-receipts.test.mjs`
- `tests/five-stage-facts-v2.test.mjs`
- `core/__tests__/runtime-mode.test.mjs`

### DO NOT TOUCH

- `workflows/*/steps.json` 的 stage/hook 拓扑；唯一允许的 `workflows/make-decision/steps.json` 修改只是 research evidence URI，不增节点。
- `workflows/verify-code/skill-deps.yaml`；DEFER-001 明确排除 verify-code handoff。
- 仓外 handoff/receive-handoff 和历史 task/report bytes；本任务不迁移、不重写。
- public 七类命令集、现有 quality predicates、四材料 schema；不扩宽。

## Technical Decisions

### DEC-001 — 单个集成 Phase

- **Problem**：多个域共享三个核心 seam，分 Phase 会让文件双所有或中间版本不可执行。
- **Options**：按域拆 6 Phase；或单 Phase、6 组串行 RED/GREEN。
- **Selected**：extend 现有集成 seam，单 Phase。
- **Reason**：文件权威唯一，每组任务仍有独立 oracle，FINAL 只聚合一次。
- **Consequence / risk**：Phase 文件列表较长；通过 task boundary 和串行依赖控制。
- **Fallback**：如实施确认可将共享 seam 分离且中间版本可测，回 build-plan 重新划分文件所有权。
- **F10 disposition**：`keep`。

### DEC-002 — reflection 使用 outcome 后置 sibling 注入

- **Problem**：直接 CLI 无 session/memory，deterministic runtime 不能生成判断。
- **Options**：把 judgment 嵌入 outcome；另调 public `reflect`；或先定稿 outcome，再把独立 judgment 作为 official `run` sibling 交给现有 hook。
- **Selected**：outcome 后置 sibling。bridge 仍只产窄 outcome；宿主拿到稳定 ref/hash 后在 30 秒 deadline 内生成 v2 JSON；stage-runtime 剥离 sibling，runner 在 stage publication 后直接把原始 value交给 reflection transaction，并认证唯一 evidence ref/hash、attempt 时限和 output hash。
- **Reason**：嵌入 outcome 会形成内容寻址自引用环；单独公开 `reflect` 不是自动 stage-end。sibling 路径不新增 public command/stage/step，且现有 runner 能保证 publication 后执行。
- **Consequence / risk**：host orchestration 必须严格两步排序并将 sibling 传给随后 official `run`；runtime 只能用 host attempt 时间证据认证 30 秒，不能替宿主执行跨进程 session-memory 模型；缺失、身份错配、超时均 unavailable/failed，原 stage result 不回滚。
- **Fallback**：保留既有 `executor_absent` 真事实，不阻断 stage。
- **F10 disposition**：`keep`。

### DEC-003 — handoff 是唯一 current-view 新机制

- **Problem**：旧 handoff 过薄、不在 taskPath，且不能承担当前结论续接。
- **Options**：改旧仓外 skill；新 immutable report/history；或窄 current projection。
- **Selected**：new `stage-handoff`，只生成固定 `<stage>.md`。
- **Reason**：用户与下一会话是真实 consumer；四材料仍是权威，当前投影不需要历史系统。
- **Consequence / risk**：覆盖失败可留下 stale 旧件；摘要必须明确警告。
- **Fallback**：写失败时返回 unavailable + 预期绝对路径，不更改 reflection/stage 结果。
- **F10 real threat**：跨会话丢失当前结论、坑和唯一下一动作。
- **F10 existing cover**：四材料只提供权威内容，不提供精简 session handoff；旧 skill 落点与内容均不合适。
- **F10 bypassable**：用户可直接回读四材料；handoff 失败不阻断。
- **F10 maintenance cost**：一个 renderer/publisher、一个 skill bundle、四处 dependency 登记与定向测试。
- **F10 disposition**：`keep`。

### DEC-004 — UI applicability 用结构化 producer contract

- **Problem**：自由文本 source 被英文词法规则误判，顶层 `non_ui` 与派生 `ui` 冲突并投影为 `missing`。
- **Options**：补更多中文正则；结构化 source + writer/reader 共享 validator；把 UI 判定移出 decision-log。
- **Selected**：结构化 source + writer 在落盘当下调用 `validateUiApplicability`。
- **Reason**：正则对中文否定不可靠且是永久负担；移出会新增第五材料。
- **Consequence / risk**：需要改 source shape 并补三类负例；source 缺失必须保持 `unknown`，不得默认 `non_ui`。
- **Fallback**：若 reader 拒绝对象 source，回 make-decision 重定形状。
- **F10 disposition**：`keep`。

### DEC-005 — review budget 先归域再判语义

- **Problem**：全历史校验早于 namespace 隔离，无关坏记录让当前请求在 dispatch 前返回 budget unknown。
- **Options**：放宽或跳过所有坏记录；迁移历史坏字节；按 namespace 归域后三分支处置。
- **Selected**：三分支——无关=恰好 dispatch 一次；当前身份损坏=零 dispatch 且报 `REVIEW_RECORD_INCOMPLETE`；不可归域=零 dispatch 且保持 `REVIEW_RETRY_BUDGET_UNKNOWN`。
- **Reason**：既保留 fail-closed，又不把无关历史当全局锁；不迁移、不覆盖历史字节。
- **Consequence / risk**：归域键若靠路径猜测会误判；必须使用可读身份字段，并让三分支各有 dispatch 计数与错误码 oracle。
- **Fallback**：无法证明归域时保持零 dispatch 与 budget unknown。
- **F10 disposition**：`keep`。

### DEC-006 — 性能预算限于单次 authenticated operation

- **Problem**：`worktreeRoot` getter 每次读取都重新校验，official fixture 被重复构造，整文件超过 180 秒。
- **Options**：把慢文件塞进常规 gate；只修测试侧；生产单 operation 复用 + 测试共享 fixture + 预算 oracle。
- **Selected**：生产单 operation 复用已校验身份 + 测试共享 fixture + wall-time/Git spawn 预算。
- **Reason**：既不削弱身份边界校验，也把反馈环拉回可接受区间。
- **Consequence / risk**：缓存跨 operation 会漏掉身份变化；必须保留 mutation/identity-change 负例。
- **Fallback**：预算无法满足时保持真实 partial/unavailable，不用删校验换绿。
- **F10 disposition**：`keep`。

## Test Strategy

下表只设计，build-plan 不执行 RED/GREEN。每对使用同命令、同 oracle ID 和同 evidence path。路由独立判定为 `fullstack-slice-testing`。

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
| --- | --- | --- | --- | --- |
| Research AC-RESEARCH-001～003 | T001/T002 | RED/GREEN | `npx vitest run tests/contract/research-report.test.mjs tests/contract/status-derivation.test.mjs` / `1`、`0` | `ORACLE-RESEARCH` / `quality/tests/workflowhub-research-handoff-hardening/T001-T002.json` |
| Execution AC-EXECUTION-001/002 | T003/T004 | RED/GREEN | `npx vitest run tests/contract/execution-outcome.test.mjs tests/contract/stage-completion.test.mjs tests/contract/status-derivation.test.mjs tests/integration/vnext-official-stage-run.test.mjs` / `1`、`0` | `ORACLE-EXECUTION` / `quality/tests/workflowhub-research-handoff-hardening/T003-T004.json` |
| Review AC-REVIEW-001/002 | T005/T006 | RED/GREEN | `npx vitest run tests/contract/review-budget-namespace.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/review/review-record-route.test.mjs` / `1`、`0` | `ORACLE-REVIEW` / `quality/tests/workflowhub-research-handoff-hardening/T005-T006.json` |
| Governance AC-GOVERNANCE-001/002 | T007/T008 | RED/GREEN | `npx vitest run tests/contract/control-plane-governance.test.mjs tests/contract/verify-publication.test.mjs tests/integration/quality-store-concurrency.test.mjs tests/final-cutover-guards.red.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/e2e/vnext-five-stage-current.test.mjs tests/stage-risk-acceptance.test.mjs tests/review/review-record-route.test.mjs tests/contract/verify-code-binding-derivation.test.mjs tests/integration/verify-freshness-selection.test.mjs tests/official-component-receipts.test.mjs` / `1`、`0` | `ORACLE-GOVERNANCE` / `quality/tests/workflowhub-research-handoff-hardening/T007-T008.json` |
| Reflection AC-REFLECTION-001 | T009/T010 | RED/GREEN | `npx vitest run tests/contract/stage-reflection-wiring.test.mjs tests/contract/stage-runner-reflection.test.mjs tests/e2e/stage-reflection-real-task.test.mjs tests/stage-interaction-contract.test.mjs` / `1`、`0` | `ORACLE-REFLECTION` / `quality/tests/workflowhub-research-handoff-hardening/T009-T010.json` |
| Handoff AC-HANDOFF-001 | T011/T012 | RED/GREEN | `npx vitest run tests/contract/stage-handoff.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs tests/contract/workflow-synchronization-consumer.test.mjs` / `1`、`0` | `ORACLE-HANDOFF` / `quality/tests/workflowhub-research-handoff-hardening/T011-T012.json` |
| Material AC-MATERIAL-001 | T013/T014 | RED/GREEN | `npx vitest run tests/contract/ui-applicability-contract.test.mjs` / `1`、`0` | `ORACLE-MATERIAL` / `quality/tests/workflowhub-research-handoff-hardening/T013-T014.json` |
| Performance AC-PERFORMANCE-001 | T015/T016 | RED/GREEN | `npx vitest run tests/contract/performance-budget.test.mjs tests/contract/acceptance-execution-tier.test.mjs` / `1`、`0` | `ORACLE-PERFORMANCE` / `quality/tests/workflowhub-research-handoff-hardening/T015-T016.json` |
| 13 AC aggregate | T017 | FINAL | `node tests/acceptance/workflowhub-research-handoff-hardening.acceptance.mjs` / `0` | `ORACLE-FINAL` / `quality/tests/workflowhub-research-handoff-hardening/T017.json` |

- **Risk dimensions**：行为结果；身份/hash/状态流；失败/超时/恢复；批准边界；并发/原子覆盖；跨模块 seam；provenance/可观测性；UI 事实形状与冲突；预算归域误判；wall-time/spawn 放大。UI/a11y N/A。
- **Fixtures/services**：临时 task store、可控 host bridge session、同/异语义 outcome、recorded/unavailable/missing review、无关/当前/不可归域三类坏预算历史、reflection timeout/error/absent、handoff write-failure fixture、结构化/冲突/缺失三类 UI 事实、单 operation 身份变化负例；每测试负责清理自己创建的临时目录。
- **Coverage limits**：外部 anysearch/provider 真 SLA 不可由仓内 fixture 证明；AC-RESEARCH-003 还需宿主真实失败/兜底 smoke，未执行时保持 partial/unavailable。性能预算数值已由 OPEN-015 定稿（单 fixture ≤ 15 秒、`-t` 回归 ≤ 60 秒、Git spawn 低于 T015 基线），本表只固定 oracle 与测量维度。

## Rollback and Recovery

- **Global recovery rule**：只回滚本任务实现，保留四材料、旧 immutable facts 和失败证据；不批量重写 task store。
- **Irreversible boundaries**：commit/push/merge/archive/cleanup 均需独立明确授权，本计划不授权。
- **Recovery owner**：build-code 执行者在受影响 task 卡边界内回退当次代码；用户方向变化回 make-decision，规格变化回 build-spec。

### Engineering Risk Handoff

- **PLAN-RISK-001**：宿主生产 reflection/research 能力不能被 fixture 代替。
  - **Affected IDs**：R-001、R-002、R-018；FR-RESEARCH-003、FR-RESEARCH-004、FR-REFLECTION-001、FR-REFLECTION-002；AC-RESEARCH-003、AC-REFLECTION-001；T001/T002/T009/T010/T017。
  - **Trigger**：只有 schema/DI fixture 通过，但真 Stage Agent 未交付 session judgment 或真 fallback 未执行。
  - **Consequence**：本地合同可绿，真用户路径仍 unavailable。
  - **Mitigation or STOP**：FINAL 必须消费真 bridge/executor 与宿主 smoke 证据；无证据就保持 partial/unavailable，不声称 AC 通过。
  - **Handling Stage**：build-code 实现，verify-code 独立核验。
  - **Verification**：T017 的逐 AC JSON 和 canonical raw stdout/stderr/evidence refs。

- **PLAN-RISK-002**：把"material navigation 缺失"当成真缺口会误导实现。
  - **Affected IDs**：R-021；FR-MATERIAL-002；AC-MATERIAL-001；T013。
  - **Trigger**：继续按错误键名或手写对象判断 packet readiness。
  - **Consequence**：把可用材料误判为 degraded，或反过来用绕过路径掩盖真实缺口。
  - **Mitigation or STOP**：以生产 `buildStageInputPacket`（键名去掉 `.md` 后缀）为唯一判据，已复现 `verify.ok=true`；STOP=用手写对象或错误键名代替生产入口。
  - **Handling Stage**：build-plan 更正陈述，build-code 以生产入口验证。
  - **Verification**：生产入口构建 + `verifyStageInputPacket.ok=true`，且 `plan.md`/`tasks.md` 不再出现 navigation 缺失陈述。
- **PLAN-RISK-003**：性能缓存跨边界复用导致身份变化漏检。
  - **Affected IDs**：R-023；FR-PERFORMANCE-001；AC-PERFORMANCE-001；T015/T016。
  - **Trigger**：缓存作用域超出单次 authenticated operation，或跳过写入边界校验。
  - **Consequence**：fail-loud 被削弱，身份/快照漂移不可见。
  - **Mitigation or STOP**：缓存严格限于单 operation 并保留 mutation/identity-change 负例；STOP=提速后校验被跳过。
  - **Handling Stage**：build-code。
  - **Verification**：身份变化与跨 operation 负例均非零退出。
- **PLAN-RISK-004**：按错误机制给任务索引或协议错误事实文件补写。
  - **Affected IDs**：R-024；FR-GOVERNANCE-006；AC-GOVERNANCE-002；T007/T008。
  - **Trigger**：以"消除空数组"为名给 `index.json.facts`/`facts.jsonl` 增加写入。
  - **Consequence**：形成无人读取的第二权威与双写。
  - **Mitigation or STOP**：以真实 reader 链为准，用负向存在性证据验收；STOP=出现第二权威。
  - **Handling Stage**：build-code 评审拒绝。
  - **Verification**：负向存在性证据 + `verify-publication` 负例。

## Implementation Order

T001→T002（research producer/reader）→T003→T004（execution 投影）→T005→T006（review lifecycle + 预算归域）→T007→T008（控制面处置 + verify 发布 + 根因归并）→T009→T010（真 reflection executor）→T011→T012（reflection 后 handoff）→T013→T014（UI applicability 结构化契约）→T015→T016（性能预算）→T017（唯一 aggregate）。全部顺序属于 Phase P1，串行原因是共享 runtime seam 且后者消费前者事实。

## Dependencies and Parallelism

- **Dependencies**：research reader 先于 status；semantic outcome 先于 review/stage completion 投影；review 生产者与预算归域先于 governance 删除死门；verify 发布先于根因归并展示；reflection terminal 先于 handoff；UI 契约与性能预算先于 FINAL；八域均先于 FINAL。
- **Parallel work**：N/A — `stage-handlers.mjs`、`stage-runtime.mjs`、`stage-runner.mjs`、`material-workspace.mjs`、`workspace.mjs` 以及共享 integration test 使文件不独立，不声称 `[P]`。
- **External dependencies**：Stage Agent 宿主需提供真实 session/memory judgment 和 web_search/web_fetch；缺失时为 diagnostic unavailable，不伪造。

## Requirement and Verification Traceability

| Source / decision | FR | AC | Phase / Task | Depends on | Exact files | Command / oracle |
| --- | --- | --- | --- | --- | --- | --- |
| R-001/R-002/R-014/R-015; D-001/D-002/D-003 | FR-RESEARCH-001、FR-RESEARCH-002、FR-RESEARCH-003、FR-RESEARCH-004 | AC-RESEARCH-001、AC-RESEARCH-002、AC-RESEARCH-003 | P1/T001→T002 | none | `runtime/evidence/research-report.mjs`、`runtime/stage/stage-handlers.mjs`、`tools/cli/stage-runtime.mjs` | research contract command / `ORACLE-RESEARCH` |
| R-013/R-018; D-004/D-005; Clarify 1A | FR-EXECUTION-001、FR-EXECUTION-002、FR-EXECUTION-003、FR-EXECUTION-004 | AC-EXECUTION-001、AC-EXECUTION-002 | P1/T003→T004 | T002 | `runtime/stage/completion-predicates.mjs`、`tools/cli/stage-runtime.mjs` | execution contract command / `ORACLE-EXECUTION` |
| R-017/R-018; D-006; R-022/D-011 | FR-REVIEW-001、FR-REVIEW-002、FR-REVIEW-003 | AC-REVIEW-001、AC-REVIEW-002 | P1/T005→T006 | T004 | `runtime/stage/stage-agent-outcome-adapter.mjs`、`runtime/review/review-record-route.mjs`、`runtime/evidence/stage-content-evidence.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs` | review integration command / `ORACLE-REVIEW` |
| R-016/R-018; D-007; R-024/D-013 | FR-GOVERNANCE-001、FR-GOVERNANCE-002、FR-GOVERNANCE-003、FR-GOVERNANCE-004、FR-GOVERNANCE-005、FR-GOVERNANCE-006、FR-GOVERNANCE-007 | AC-GOVERNANCE-001、AC-GOVERNANCE-002 | P1/T007→T008 | T006 | `docs/architecture/control-plane-inventory.json`、`runtime/stage/stage-handlers.mjs`、`runtime/evidence/quality-store.mjs`、`tools/cli/stage-runtime.mjs`、`tests/final-cutover-guards.red.test.mjs` | governance contract command / `ORACLE-GOVERNANCE` |
| R-018; D-008 | FR-REFLECTION-001、FR-REFLECTION-002 | AC-REFLECTION-001 | P1/T009→T010 | T008 | `runtime/stage/stage-runner.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs` | reflection command / `ORACLE-REFLECTION` |
| R-003/R-004/R-005/R-006/R-007/R-019/R-020; D-009; Clarify 2B | FR-HANDOFF-001、FR-HANDOFF-002、FR-HANDOFF-003、FR-HANDOFF-004 | AC-HANDOFF-001 | P1/T011→T012 | T010 | `runtime/stage/stage-handoff.mjs`、`skills/stage-handoff/SKILL.md`、`runtime/stage/stage-runner.mjs` | handoff command / `ORACLE-HANDOFF` |
| R-021; D-010 | FR-MATERIAL-001、FR-MATERIAL-002 | AC-MATERIAL-001 | P1/T013→T014 | T012 | `runtime/stage/stage-content-contracts.mjs`、`runtime/task/material-workspace.mjs`、`tests/contract/ui-applicability-contract.test.mjs` | UI contract command / `ORACLE-MATERIAL` |
| R-023; D-012 | FR-PERFORMANCE-001、FR-PERFORMANCE-002 | AC-PERFORMANCE-001 | P1/T015→T016 | T014 | `runtime/task/workspace.mjs`、`runtime/task/task-kernel-implementation.mjs`、`tests/contract/performance-budget.test.mjs` | performance command / `ORACLE-PERFORMANCE` |
| R-008/R-009/R-010/R-011/R-012 过程约束；全部 D/OPEN | 全部 28 FR | 全部 13 AC | P1/T017 | T016 | `tests/acceptance/workflowhub-research-handoff-hardening.acceptance.mjs` | final command / `ORACLE-FINAL` |
| OPEN-004 | FR-REFLECTION-001、FR-REFLECTION-002 | AC-REFLECTION-001 | T009/T010 | T008 | `tools/host/workflowhub-stage-agent-bridge.mjs` | production bridge executor + 30s failure oracle |
| OPEN-006 | FR-GOVERNANCE-003、FR-GOVERNANCE-005 | AC-GOVERNANCE-001 | T007/T008 | T006 | `tests/final-cutover-guards.red.test.mjs` | 21-row disposition oracle |
| OPEN-010 | FR-GOVERNANCE-001、FR-GOVERNANCE-004、FR-GOVERNANCE-005 | AC-GOVERNANCE-001 | T007/T008 | T006 | `docs/architecture/control-plane-inventory.json` | inventory completeness oracle |
| DEFER-001 | N/A — verify-code handoff 不在本期 | N/A | 后续 make-decision | none | `workflows/verify-code/skill-deps.yaml` DO NOT TOUCH | 触发=用户要求五 stage handoff；关闭=新决定+验收 |
| DEFER-002 | N/A — `muyu-search-mcp` 退役不在本期 | N/A | 后续工具能力任务 | none | N/A — 不改本仓路由 | 触发=需第二仓内通道；关闭=真能力审计+用户选择 |

## OPEN/DEFER 交接索引

每个未决/延期项都带负责人、触发、去向与关闭条件；下游阶段不得自行猜测。

| item | 内容 | 状态 / 负责人 / 触发 / 去向 / 关闭条件 |
| --- | --- | --- |
| OPEN-001 | research 事实 NAMESPACE 与 receipt kind 命名 | 状态=resolved；负责人=build-code 验证；触发=spec 已给出命名；去向=build-code T001/T002 实施；关闭条件=runtime 校验通过 |
| OPEN-002 | anysearch 失败回执的单次/总时限数值 | 状态=resolved；负责人=build-code 验证；触发=spec 已定稿数值；去向=build-code T001/T002 实施；关闭条件=时限与失败行为证据通过 |
| OPEN-003 | "内容等价"的精确比对字段 | 状态=resolved；负责人=build-code 验证；触发=spec 已定稿字段；去向=build-code T003/T004 实施；关闭条件=针对性测试通过 |
| OPEN-004 | reflection executor 实现方式 | 状态=open；负责人=build-plan；触发=plan 定入口与超时；去向=build-code T009/T010；关闭条件=plan 明确入口/超时/失败隔离/验证 |
| OPEN-005 | stage-handoff 在 reflection hook 内的调用点与 13 区块字段名 | 状态=resolved；负责人=build-code 验证；触发=spec 已定字段表；去向=build-code T011/T012；关闭条件=handoff 生成通过 |
| OPEN-006 | 21 处 skip 守卫逐条分类结果 | 状态=open；负责人=build-plan；触发=plan 出清单；去向=build-code T007/T008；关闭条件=每条有恢复/退役/延后结论 |
| OPEN-007 | execution_outcome 字段形状与 ambiguous 取值 | 状态=resolved；负责人=build-code 验证；触发=spec 已定形状；去向=build-code T003/T004；关闭条件=AC-EXECUTION-002 可核验 |
| OPEN-008 | 调研缺口披露字段的具体形状 | 状态=resolved；负责人=build-code 验证；触发=spec 已定形状；去向=build-code T001/T002；关闭条件=AC-RESEARCH-002 可核验 |
| OPEN-009 | envelope skill 行修复方案 | 状态=resolved；负责人=build-code 验证；触发=spec 已定方案；去向=build-code T005/T006；关闭条件=两套投影结论一致有测试 |
| OPEN-010 | 控制面清单格式与分期边界 | 状态=open；负责人=build-plan；触发=plan 定格式与 P0/P1/P2；去向=build-code T007/T008；关闭条件=清单格式与分期写入 plan |
| OPEN-011 | research-report 的独立复核 | 状态=resolved_with_partial；负责人=make-decision 主会话已完成；触发=R5 复核已执行；去向=build-spec 承接 partial；关闭条件=sidecar hash 可回读且 findings 原样保留 |
| OPEN-012 | spec-analyze 剩余 LOW 登记项 | 状态=resolved；负责人=build-code 验证；触发=spec 附录已对账；去向=build-code；关闭条件=对账说明写入 spec 附录 |
| OPEN-013 | UI applicability source 结构字段名与三类负例 fixture | 状态=resolved（字段名留实现）；负责人=build-code 验证；触发=spec 已定合并规则；去向=build-code T013/T014；关闭条件=AC-MATERIAL-001 通过 |
| OPEN-014 | review budget namespace 分类键与最小可读身份 | 状态=resolved（分类键规则已定）；负责人=build-code 验证；触发=spec 已定三分支语义；去向=build-code T005/T006；关闭条件=AC-REVIEW-002 通过 |
| OPEN-015 | 性能预算数值与 Git spawn / wall-time oracle 形式 | 状态=resolved_by_plan（本 plan 定稿：单 fixture wall-time ≤ 15 秒、`-t` 回归 ≤ 60 秒、Git spawn 次数低于 T015 记录基线）；负责人=build-plan 已定稿；触发=plan 已给出数值与测量方式；去向=build-code T015/T016 验证；关闭条件=基线测量 + 四条 oracle（① 单 fixture wall-time ≤ 15 秒；② `-t` 精确回归 ≤ 60 秒；③ 同 operation 内 Git spawn 低于 T015 记录基线；④ 身份变化/跨 operation 负例非零退出）全过 |
| OPEN-016 | `quality/verify.json` 生产 publisher 实现点与 canonical guard 方案 | 状态=open；负责人=build-plan；触发=plan 定方案；去向=build-code T007/T008；关闭条件=第二写入者负例通过 |
| DEFER-001 | verify-code 的 stage-handoff | 状态=deferred；负责人=后续任务；触发=用户要求五阶段全覆盖；去向=未来 handoff 范围决策；关闭条件=新决定与真实验收 |
| DEFER-002 | `muyu-search-mcp` 是否正式退役 | 状态=deferred；负责人=后续调研能力任务；触发=需要第二条仓内检索通道；去向=未来工具路由治理；关闭条件=真实能力审计与用户选择 |
| 合并稿（无 DEFER id） | 后续任务合并稿是仓外只读输入，不属本任务交付 | 状态=not_a_deliverable；负责人=external（用户自行管理）；触发=用户后续决定；去向=不在本任务交付；关闭条件=不适用（只读输入） |

## Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| research contract | `runtime/schemas/research-report.v1.json`、`runtime/evidence/research-report.mjs`、`workflows/make-decision/skill-deps.yaml` | change | T001/T002 | 替代 test receipt 借道，唯一 reader/consumer |
| outcome/review | `runtime/stage/completion-predicates.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs` | change | T003–T006 | 执行事实与质量谓词分离，review 修 producer |
| control-plane register | `docs/architecture/control-plane-inventory.json`、`docs/architecture/move-map.json`、`core/runtime-mode.mjs` | change | T007/T008 | 补 owner/consumer/delete condition，删死门/僵尸 |
| stage-end workflow | `runtime/stage/stage-runner.mjs`、`skills/stage-handoff/SKILL.md`、四 author `skill-deps.yaml` | change | T009–T012 | 复用唯一 hook，不新增 steps 节点 |
| public command topology | `tools/cli/stage-runtime.mjs` | no change to command set | T001–T012 | 只扩展现有 status/run 数据与 service injection |
| reflection sibling input | `tools/cli/stage-runtime.mjs`、`skills/workflowhub-host-protocol/SKILL.md` | change existing run payload only | T009/T010 | owner=当前 host；consumer=`stageReflectionPublication`→`runStageEndReflection`；不是 receipt/fact；删除条件=同职责的审查后 host-executor contract 取代 |
| UI contract | `runtime/stage/stage-content-contracts.mjs`、`runtime/task/material-workspace.mjs`、decision-log `## UI applicability` | change source shape + shared validator | T013/T014 | producer=make-decision；consumer=packet readiness 与 UI 判定；删除条件=经审查的替代机制 |
| review budget namespace | `runtime/review/review-record-route.mjs`、`runtime/evidence/stage-content-evidence.mjs`、`runtime/review/schemas/attempt.schema.json` | change | T005/T006 | 先归域再判语义；历史坏字节只读保留；保留已合并的 `route_repair` kind |
| performance budget | `runtime/task/workspace.mjs`、`runtime/task/task-kernel-implementation.mjs`、official fixture 构造 | change existing validation scope only | T015/T016 | 缓存限于单 authenticated operation；不放宽身份校验 |
| verify publication | `runtime/evidence/quality-store.mjs`、`tools/cli/stage-runtime.mjs` | change | T007/T008 | 唯一 writer + canonical guard；gap 按根因归并 |
| four-material authority | `specs/workflowhub-research-handoff-hardening-20260909/*.md` | no runtime change | T017 | 计划不新增第五份权威 |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"bf61be16d4d67c582258e7731a335cdca20749764d5a18607f4cd8e98c26ebcb","id":"CONSTITUTION","version":"2026-08-30","clause_count":22}`
- **F1**：核心只做窄认证/编排，research/handoff 重逻辑落 evidence/skill 模块。
- **F2**：新接口仅 research reader、execution disclosure、official run reflection sibling、handoff result、UI source 结论字段、budget 归域结果与 gap 根因字段。
- **F3**：四材料仍决定工作；hash/identity/原子写错误 fail-loud。
- **F4**：review 是独立建议事实，finding 不锁死同 task 修复。
- **F5**：删零消费死门，不新增质量门。
- **F6**：正式原件继续外置 taskPath 记录并认证当次 current identity。
- **F7**：build-plan 最后等待用户真实确认；本期无 UI/不可逆操作授权。
- **F8**：优先复用 canonical writer、atomic writer、hook、bridge 和现有 status。
- **F9**：unavailable/partial/missing 保持非绿，不用 fixture 伪造宿主完成。
- **F10**：仅 handoff current view 和 inventory 为有真消费者的最小新增；2026-09-10 增量不新增控制面，只修既有对象的形状、写入者与展示。
- **F11**：每个保留/新控制面都列 producer、consumer、owner、失败与删除条件；verify 写入者与 gap 根因归并同样登记。
- **Q1**：质量事实不作准入；缺真 smoke/review/AC 不宣称完成。
- **Q2**：工作、publication 结构和完成证明分离。
- **Q3**：实现后仍需异源 review 与用户确认，本地验证不冒充 verdict。
- **S1**：检索兜底用宿主 web_search/web_fetch，不再造 provider。
- **S2**：anysearch/deep-research 按项目失败语义改造。
- **S3**：skill bundle/catalog/reuse registry 同步当前版本与来源。
- **S4**：stage-handoff 指标为 13 区、一 next action、current binding、write/readback 和 failure isolation。
- **S5**：stage-handoff 仅读指针包，便于新会话/子代理最小回读。
- **S6**：复用已有仓外 handoff 经验但不照搬其过薄结构。
- **S7**：stage-handoff 一技能一目录，挂现有 hook 而不新增 workflow stage。
- **S8**：skill 不依赖 Codex/Claude 私有 transcript，只消费显式 packet/session 事实。

## Phase P1 — 集成纵切

### Goal

八个行为域按真实 producer→reader→status/hook→consumer 全链打通，无新 stage/gate/public command，最后一次聚合输出 13 个 AC 的可比较 JSON。

### Files

- **NEW**：`runtime/schemas/research-report.v1.json`、`runtime/evidence/research-report.mjs`、`runtime/stage/stage-handoff.mjs`、`skills/stage-handoff/SKILL.md`、`skills/stage-handoff/skill-bundle.json`、`docs/architecture/control-plane-inventory.json`、`docs/adr/0026-equivalent-stage-outcome-attempts.md`、`tests/contract/research-report.test.mjs`、`tests/contract/execution-outcome.test.mjs`、`tests/contract/control-plane-governance.test.mjs`、`tests/contract/stage-handoff.test.mjs`、`tests/contract/ui-applicability-contract.test.mjs`、`tests/contract/review-budget-namespace.test.mjs`、`tests/contract/performance-budget.test.mjs`、`tests/contract/verify-publication.test.mjs`、`tests/acceptance/workflowhub-research-handoff-hardening.acceptance.mjs`
- **MODIFY**：`runtime/stage/stage-handlers.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/stage/stage-content-contracts.mjs`、`runtime/review/review-record-route.mjs`、`runtime/evidence/stage-content-evidence.mjs`、`runtime/review/schemas/attempt.schema.json`、`runtime/evidence/quality-store.mjs`、`runtime/task/material-workspace.mjs`、`runtime/task/workspace.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-reflect.mjs`、`runtime/schemas/stage-reflection.v2.json`、`runtime/task/task-handle.mjs`、`runtime/task/task-kernel-implementation.mjs`、`runtime/task/task-kernel.mjs`、`runtime/evidence/stage-completion-facts.mjs`、`core/task-close.mjs`、`core/runtime-mode.mjs`、`tools/cli/stage-runtime.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`、`workflows/make-decision/steps.json`、`workflows/make-decision/skill-deps.yaml`、`workflows/build-spec/skill-deps.yaml`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-code/skill-deps.yaml`、`skills/workflowhub-host-protocol/SKILL.md`、`skills/deep-research/SKILL.md`、`skills/deep-research/skill-bundle.json`、`skills/anysearch/SKILL.md`、`skills/anysearch/skill-bundle.json`、`skills/anysearch/scripts/anysearch_cli.js`、`skills/anysearch/scripts/anysearch_cli.py`、`skills/anysearch/scripts/anysearch_cli.sh`、`skills/anysearch/scripts/anysearch_cli.ps1`、`skills/catalog.yaml`、`skills/reuse-registry.md`、`CONTEXT.md`、`docs/architecture/move-map.json`、`tests/contract/status-derivation.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/contract/host-outcome-bridge.test.mjs`、`tests/contract/acceptance-execution-tier.test.mjs`、`tests/integration/quality-store-concurrency.test.mjs`、`tests/contract/stage-reflection-wiring.test.mjs`、`tests/contract/stage-runner-reflection.test.mjs`、`tests/contract/stage-runner-on-stage-end.test.mjs`、`tests/contract/workflow-synchronization-consumer.test.mjs`、`tests/e2e/stage-reflection-real-task.test.mjs`、`tests/stage-interaction-contract.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`、`tests/review/review-record-route.test.mjs`、`tests/final-cutover-guards.red.test.mjs`、`tests/integration/mutation-guards.test.mjs`、`tests/official-component-receipts.test.mjs`、`tests/five-stage-facts-v2.test.mjs`、`core/__tests__/runtime-mode.test.mjs`
- **DO NOT TOUCH**：不增改任何 workflow step/hook 拓扑；不改 `workflows/verify-code/skill-deps.yaml`、仓外 handoff/receive-handoff、历史 task/report bytes、public 七类命令集、现有 quality predicates 或四材料 schema。

### Tasks

- `T001→T002`：research 三态、超时/重试/授权兜底和非谓词披露。
- `T003→T004`：等价 outcome completed，真冲突/ambiguous failed，execution 不进 quality missing。
- `T005→T006`：review recorded/unavailable/missing 三态在 row/fact 单源一致，且预算历史先归域再判语义（无关/当前/不可归域三分支）。
- `T007→T008`：逐对象 inventory、21 skip 处置、stale identity 修复、死门删除、登记同步，以及 verify 唯一写入者与 gap 根因归并。
- `T009→T010`：五 stage 真实 reflection executor 自动运行且失败非阻断。
- `T011→T012`：四 author stage 在 reflection 终态后原子覆盖 current handoff 并打印绝对路径。
- `T013→T014`：UI applicability 三输入结构化、共享 validator 与生产 packet 入口。
- `T015→T016`：单 authenticated operation 内身份校验复用、fixture 共享与 wall-time/spawn 预算。
- `T017`：一次 current-snapshot aggregate，输出每个 AC 恰好一条断言组。

### Verify

ORACLE-FINAL — 每个 active AC 恰好一个 entry，expected/actual 可比较，缺口不被漂白。

- **Command**：`node tests/acceptance/workflowhub-research-handoff-hardening.acceptance.mjs`
- **expected_exit**：`0`
- **oracle**：`ORACLE-FINAL`；exit 0 只表示 JSON 报告生成；`entries` 覆盖 13 个 AC 且各有 verdict，每个 expected/actual 可比较，并保留宿主 smoke/review 的 unavailable/partial；仅十三项全 passed 时总 verdict 才是 passed。
- **evidence_path**：`quality/tests/workflowhub-research-handoff-hardening/T017.json`。

### Knowledge

handoff 是可替换 current view，其余 report/fact immutable；execution outcome 只是 status 披露；UI 事实写入与读取同规则、缺失保持 `unknown`；预算历史先归域再判语义、历史坏字节只读；性能预算不改变任何身份校验；research/reflection/review 缺失均不是工作准入证，但不得被报成完成。

### STOP

- RED 不是目标 assertion 失败，而是环境/命令/夹具失败。
- 需要新 stage、public command、selector、quality predicate、自动 handoff 发现或 verify-code handoff。
- host 未在 bridge outcome ref 稳定后生成/提交 sibling judgment；如实 `executor_absent`，不在 runtime 合成；只有需要新 public command/stage 时才返回 make-decision。
- 某 skip 无法证明 consumer/replacement；保留 `defer` 而不删除/恢复。
- 出现给任务索引/协议错误事实文件补写、退役 `quality/verify.json`、迁移历史坏字节或以放宽身份校验换速度的方案。

### Done

8 对 RED/GREEN 都有目标失败与定向 GREEN；T017 执行一次；普通独立 review、逐 AC evidence、host smoke 和剩余限制均按真实状态记录。任一缺失时 Phase 可实报 partial/incomplete，不伪造通过。

### Risks and rollback

- **Affected IDs**：全部 FR/AC，重点 PLAN-RISK-001～004。
- **Trigger**：中间 seam 不可执行、外部宿主无事实、handoff 覆盖留 stale、死门删除有真 consumer、缓存越界或按错误机制补写。
- **Consequence**：status 失真、真调用缺失、跨会话误读或回归。
- **Mitigation**：严格串行，每对保留负例，只删有反向引用证据的对象，缓存限于单 operation。
- **Rollback**：回退当次任务修改，保留新旧 immutable evidence；handoff stale 文件不报 current。
