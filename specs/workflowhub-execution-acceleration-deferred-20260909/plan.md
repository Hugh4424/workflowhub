# 实现计划：WorkflowHub 执行提速延期项（S3/S4/S7）

- **Input**：`specs/workflowhub-execution-acceleration-deferred-20260909/decision-log.md`、`specs/workflowhub-execution-acceleration-deferred-20260909/spec.md@3c3d772b8c2e84de61f5ab82759bd34e4cf3b92dc4ae4ba3fe1fdbeebd93f638`
- **Template version**：`plan-task.v4`
- **Stage scope**：build-plan Steps 1–8 only；本文只设计，未执行 RED/GREEN、性能测量、实现、review 或不可逆操作。
- **Revision note**：2026-09-10 依 spec §14.1 同步上游三项修订——S7 由「移除 `quality/verify.json` current 权威」改为「核对既有 per-AC 唯一权威与唯一 writer 不被绕过」；新 ADR 编号改为 0027/0028/0029；需求来源认证判为伪需求（DEFER-REQ-AUTH，只登记不交付）。本文全部文件路径、符号与行号已按 merge main 后的工作树重新核对。

## 材料导航

| 材料锚点 | 职责 | 读取时机 |
| --- | --- | --- |
| `decision-log.md#D-001..D-011` | 已批准的四 Phase、权威划分、延期与代价 | M：规划；S：代码锚点只读核验 |
| `spec.md#6-功能需求`、`spec.md#7-验收标准` | FR/AC、状态、失败语义 | M：任务分解；build-code：逐卡 |
| `spec.md#13.4`、`spec.md#3.3` | DEFER-REQ-AUTH 伪需求判定与本任务非目标 | M：边界核对；verify-code：非目标读回 |
| `plan.md#Phase-P1--S3` 至 `#Phase-P4--S7` | 工程边界、顺序、验证与恢复 | build-code：Phase 开始前 |
| `tasks.md#Phase-P1--S3` 至 `#Phase-P4--S7` | 唯一执行卡与完成区 | build-code/verify-code：执行及读回 |

## Quick Read

- **Goal**：按 `S3 → S4-slicing → S4-review-budget → S7` 恰好四个串行 Phase，交付单一来源的测试运行画像证据与 consumer 只读回执、非阻断切片 advisory、既有正式 review 预算链的补齐与死类清理，以及既有 per-AC 唯一权威/唯一 writer 的「不被绕过」核对加四域/close 语义收口。
- **Non-goals**：来源：D-006、D-009、D-010、D-011、spec §3.2/§3.3/§13.4；不做 S5 repair delta、S6 Phase-loop 瘦身、跳过式结果复用或 TIA，不新增 stage/public command/store/gate；不恢复旧 lineage/checkpoint/recovery 控制面；不执行真实远端 push 或真实工作区 cleanup；**不要求认证 make-decision 的需求来源，也不要求宿主写身份绑定 transcript**（DEFER-REQ-AUTH：伪需求，只登记不交付、不产生验收条件）；不删除、不改判既有 `quality/verify.json` per-AC 权威地位。
- **Before**：runtime 已由 main 建立画像契约（`TEST_RUNTIME_PROFILE_NAMES`/`validateTestRuntimeProfile`）与唯一 verify writer 合同，但 advisor 只判 `simple|feature|fullstack`、consumer 在 `tools/cli/run-checks.mjs:111` 复制上限字面量、没有五轮性能证据；plan validator 没有三态 advisory（全仓无 `slice-advisory`/`SIG-*`）；正式 review 预算链已存在但 result-only import provenance 未补齐、`narrow_diff` 死类仍在；status/close 四域与 plan/step/completed 分离尚未闭合。
- **After**：四个 seam 各有唯一 owner、RED→GREEN、证据 capture 与一次独立 Phase review；画像阈值仍只有 runtime 一处来源；S7 结束时生产反向引用扫描逐条可分类且无第二 writer/双写/绕过导入。
- **Main risk**：把已解问题（唯一 writer）重做成移除型控制面，或 S3 复制阈值形成第二画像表；其次是 S4 result-only import 接受伪造/陈旧来源。
- **Next step**：build-code 只能从 T001 开始；任一 STOP 命中时回 owning material，不猜测、不跳 Phase。

## Technical Context

### Global Constraints

- **Verified facts**：Node ESM；当前会话 Node `v24.14.0`；测试采用 Vitest；production/runtime 位于 `runtime/`，CLI 位于 `tools/cli/`，历史 `core/task-close.mjs` 保持 move-map 既有职责；`CONSTITUTION.md` 当前 Version 1.8.0（22 条），`constitution-checklist.md` 22 条。
- **Language / runtime**：JavaScript `.mjs`、Markdown；不得引入新依赖。
- **Primary dependencies**：复用 `validateTestRuntimeProfile`/`TEST_RUNTIME_PROFILE_LIMITS_MS`、`validatePlanTaskContract`、`readCanonicalBudgetHistory`/`validateReviewBudget`、`deriveCurrentProductRelease`、`publishVerifySummary`、现有 acceptance quality facts、close writer/status reader。
- **Storage / state**：四材料仍是工作真相；执行证据只写 task 外置 `quality/tests/`、`quality/evidence/`、`quality/reviews/`；slice 三态现场派生，不新增 store；report immutable。
- **Testing**：只跑卡片列出的 targeted Vitest；禁止无范围 `vitest`/`npm test`/`test:safe`。RED 与 GREEN 使用同命令、同 oracle；失败原始 stdout/stderr 不漂白。
- **Threshold ownership**：测试运行画像的名字、时长上限与能力许可只有一处契约来源（`runtime/stage/stage-content-contracts.mjs` 的画像契约）；`plan.md`/`tasks.md`/`skills/`/新增测试一律不写画像阈值字面量，只读取该来源。
- **Target environment**：认证 worktree；S3 性能在同一基准机、固定 Node/Vitest/成员/worker 画像上执行五个独立进程样本。
- **Scale / scope**：恰好四 Phase；Phase 严格串行，Phase 内 RED→GREEN→一次独立 review 串行。仅 P2/P3/P4 的共享可变 fixture 使用 singleFork/no-fileParallelism；P1 inner 必须按解析出的 worker ceiling 做真实文件级并行，不得用 singleFork 代替。
- **Unresolved facts**：真实 provider 可用性、基准机性能与真实 Phase review 结果目前 `unknown`，只可在 build-code 记录。画像契约声明值与 spec §5.2 产品上限是否一致由 P1 读取比对（不复制数值）；不一致时按 STOP 处理。
- **Conditional research**：`executed`；仅做只读 code-anchor research，核对 owner/consumer/imports/failure/rollback，没有执行测试或联网研究。耐久结论已进入 Code Anchors、Phase Files 和任务 Knowledge；research 不作为许可证。

## Code Anchors

- **S3 verified anchors**：`runtime/stage/stage-content-contracts.mjs:57-62` 导出 `TEST_RUNTIME_PROFILE_NAMES` 与 `TEST_RUNTIME_PROFILE_LIMITS_MS`，`:149-160` 导出 `validateTestRuntimeProfile`（inner/medium/large、时长上限、能力许可与 `ceiling_ms` 越限即拒），既有合同测试 `tests/contract/test-runtime-profile.test.mjs`。`skills/test-routing-advisor/SKILL.md` 与 `scripts/route.mjs` 仍是路由 owner，只输出 `routing_tier=simple|feature|fullstack` 与 rationale，不声明画像。画像 consumer 为 `tools/cli/run-checks.mjs:36,105-131`（`:111` 当前复制上限字面量）与 `runtime/evidence/canonical-evidence-validators.mjs:186-205`；`tests/contract/acceptance-execution-tier.test.mjs` 当前混合 hermetic 与真实边界断言。
- **S4-slicing verified anchors**：`runtime/stage/stage-content-contracts.mjs:5832#validatePlanTaskContract` 是 P2 唯一 producer，build-plan consumer 为 `runtime/stage/stage-handlers.mjs:3544`（结构合同）与 `:3535`（可执行最低合同）；`runtime/stage/stage-handlers.mjs` 与 `tools/cli/stage-runtime.mjs` 也只在 P2 修改，用于把同一 advisory result 接入 handler/status，并提供后续 projection 的通用只读组合点。P3/P4 只测试这些公开 consumer，不再修改它们；因此生产文件不存在跨 Phase writer。全仓当前无 `slice-advisory`、`SIG-FILES`/`SIG-TARGETS`/`SIG-CROSS-PHASE` 或三态实现，本 seam 是完整绿地。
- **S4-review-budget verified anchors**：唯一正式预算链已在 main 落地——`runtime/review/review-record-route.mjs:651#readCanonicalBudgetHistory`、`:779#recordSimpleReviewRequest`、`:886-891` 的 `validateReviewBudget` 调用、`:1123#recordSimpleReviewResult`，登记于 `docs/architecture/control-plane-inventory.json:11`。`runtime/evidence/stage-content-evidence.mjs:254` 仍把死类 `narrow_diff` 列入 `REVIEW_BUDGET_KINDS`，`:349,367-380` 仍有不可达分支；对应测试为 `tests/contract/freeze-classification-budget-usage-protocol.test.mjs:333-338`。
- **S7 verified anchors**：`runtime/stage/completion-predicates.mjs:375-381` 认证 verify summary 自身来源绑定并拒绝 `evidence_ref === "quality/verify.json"` 自指，`:1119-1124` 把 verify summary 作为 per-AC 权威并逐项绑定 material/snapshot；`:1020#deriveCurrentProductRelease` 是 status/close 共用的只读产品发布投影。per-AC producer 为 `runtime/stage/stage-runner.mjs:1691-1711` 与 `:2093-2161`；唯一 canonical writer 为 `runtime/evidence/quality-store.mjs:238-240#publishVerifySummary`；每任务初始化见 `runtime/task/task-store.mjs:250-262`；唯一 writer 合同测试为 `tests/contract/verify-publication.test.mjs:30-81`；登记见 `docs/architecture/control-plane-inventory.json:12`。close/status anchors 为 `core/task-close.mjs`、`tools/cli/stage-runtime.mjs`。
- **Existing interfaces**：quality fact identity 绑定 task/stage/material scope revision/snapshot/evidence；正式 review import 必须绑定既有 immutable attempt；public runtime 仅 doctor/status/run/review/verify/confirm/authorize。
- **Read now**：上述 anchors、对应 targeted tests、ADR 0007/0017/0018/0019/0020/0024、`CONTEXT.md`、`docs/standard-workflow.md`。
- **Must read before task**：每卡列出的 symbols/regions；若文件不存在或签名不符即 STOP。
- **Context mode**：Full — 涉及跨 runtime/review/task/status/close 的边界核对，但每 Phase 仍只读本 seam 文件。

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
| --- | --- | --- | --- |
| runtime profile | reuse（单一权威已存在） | `runtime/stage/stage-content-contracts.mjs:57-62,149-160` | 本任务只补五轮证据、consumer 只读回执与 worker 观测；不新增第二画像表、不在 advisor 复制阈值 |
| acceptance split | narrow extension | `tests/contract/acceptance-execution-tier.test.mjs` | 先拆 hermetic/medium，保留薄真实合同，不建新 runner |
| slicing advisory | extend | `validatePlanTaskContract` + `task risk` | 从现有字段现场派生；不新增 schema/store/gate |
| review budget/import | verify + extend | `readCanonicalBudgetHistory`、`validateReviewBudget` | 唯一预算链不重造；只补齐 result-only provenance 并删除无 producer 的死类 `narrow_diff` |
| product result authority | reuse（不改判、不删除） | `completion-predicates.mjs:375-381,1119-1124` + `quality-store.mjs:238-240` | 只核对唯一 writer 与认证步骤不被绕过；发现第二 writer/双写/绕过导入即 fail-closed |
| physical/status | extend | close writer + status reader | 复用 immutable step/completed 与 live probe，不建恢复状态机 |
| ADR/docs | new documentation only | ADR 0007/0017/0018/0020 | 三份新 ADR（0027/0028/0029）有真实 consumer；若决定被经审查替代则 supersede，不作运行时控制面 |

## Solution Design

### Overview

实现顺序是 producer-before-consumer。P1 先把 acceptance 测试按能力边界拆成 inner/medium，把画像 consumer 收敛到同一来源，再由可执行五轮 runner 生成性能证据并观测 worker 上限；不新增画像表，也不把 advisor 变成画像 owner。P2 实现 plan/tasks slicing contract、自检 CLI 与 contract tests，并独占 handler/public CLI 的通用只读 advisory/status 组合点，读取精确文件、Phase Verify.Target、跨 Phase 文件交集与 task risk marker，恒定 exit 0。P3 不重造预算链，只验证唯一正式预算 owner、补齐 result-only import provenance、删除死类 `narrow_diff`，并一次写齐 ADR0028 与 ADR0007 的精确修订。P4 通过独立 current/close projection module 把「既有 per-AC 权威 + 唯一 writer 不被绕过」的核对、四域 status、close plan/step/completed 分离与同计划恢复一次收敛，并由 P2 已冻结的通用 CLI renderer 读取该 projection；不改 public CLI，不删除既有 writer，不保留双权威过渡期。

### Module responsibilities

#### S3 profile evidence owner

- **Responsibility**：证明唯一画像契约被所有 consumer 只读消费，并产出五轮独立进程性能事实与 worker 上限观测。
- **Consumes**：画像契约声明（名字/上限/能力）、changed_files、worker 解析结果、member manifest。
- **Produces**：路由 JSON 引用、性能 receipt、consumer 反向引用回执。
- **Must not decide**：测试是否可跳过、Phase 是否可推进、画像阈值的新数值。

#### S4 slicing owner

- **Responsibility**：现场派生三信号和 `within_budget|explained_overage|unexplained_overage`。
- **Consumes**：plan/tasks 已有字段与精确 marker。
- **Produces**：validator fact/status diagnostics，恒定 exit 0。
- **Must not decide**：工作许可、质量 pass 或第二持久状态。

#### S4 review budget owner

- **Responsibility**：核对正式派发前 canonical history 与唯一预算裁决，并认证 result-only import 的完整 provenance。
- **Consumes**：request identity、material/snapshot/evidence、existing attempt 与 raw provider outputs。
- **Produces**：canonical attempt/result 或 `authoritative:false` external fact。
- **Must not decide**：review 语义质量或裸命令花费。

#### S7 current/close owner

- **Responsibility**：核对既有 per-AC 唯一权威与唯一 writer 不被绕过；四域 status；close plan/step/completed 分离与同计划恢复读回。
- **Consumes**：current authenticated build-code|verify-code `AC-*` facts、verify summary 认证结果、close immutable records/live probes。
- **Produces**：work_progress/stage_quality/product_release/physical_delivery 与唯一 completed result。
- **Must not decide**：删除既有 per-AC 权威、新增第二 writer、把质量事实变许可证或跳过人工授权。

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：slice marker 精确为 `slice-advisory: reason="..."; impact="..."; owner="..."; recheck="..."`；import provenance 至少含 request key/identity、task/stage/subject/phase、material id/revision、snapshot/source tree、authenticated evidence ref/hash、provider adapter/source/config/model、每个 raw output ref/hash、report/result ref/hash；画像与阈值字段只从既有画像契约读取。
- **Data flow / state**：RED 先固定失败；GREEN 最小实现；capture 保存 raw+structured；独立 Phase review 一次。missing/stale/tie/conflict/read failure 均保留为 missing/unknown/unavailable/incomplete。
- **API contract**：N/A — 不新增 HTTP/API；只收窄现有函数和 public CLI 行为。
- **UI / external code**：N/A — decision 明确 `non_ui`，不做 browser/screenshot/component map。
- **Fail-loud behavior**：结构/身份/provenance/写入错误拒绝 canonical publication；第二 writer、双写或绕过唯一 writer 的导入一律 fail-closed；切片超限只诊断且 exit 0；质量缺失不伪造成通过。

## File Boundary

### NEW

- `tests/contract/acceptance-execution-inner.test.mjs`
- `tests/contract/acceptance-execution-medium.test.mjs`
- `tests/contract/runtime-profile-consumer-readback.test.mjs`
- `tools/cli/measure-test-runtime-profile.mjs`
- `tools/cli/validate-current-plan-tasks.mjs`
- `tests/contract/review-public-entrypoints.test.mjs`
- `runtime/stage/current-close-projection.mjs`
- `tests/contract/four-domain-close-status.test.mjs`
- `tests/contract/verify-authority-boundary.test.mjs`
- `tests/contract/final-current-snapshot.test.mjs`
- `tools/cli/produce-final-current-snapshot.mjs`
- `docs/adr/0027-test-feedback-runtime-profile.md`
- `docs/adr/0028-plan-slicing-and-review-budget.md`
- `docs/adr/0029-current-ac-and-close-state.md`

### MODIFY

- `tools/cli/run-checks.mjs`
- `tests/contract/acceptance-execution-tier.test.mjs`
- `runtime/stage/stage-content-contracts.mjs`
- `runtime/stage/stage-handlers.mjs`
- `tools/cli/stage-runtime.mjs`
- `tests/stage-plan-task-contract-v3.test.mjs`
- `tests/contract/status-derivation.test.mjs`
- `runtime/review/review-record-route.mjs`
- `runtime/evidence/stage-content-evidence.mjs`
- `skills/wh-review/scripts/wh-review-cli.mjs`
- `tests/review/review-record-route.test.mjs`
- `tests/contract/freeze-classification-budget-usage-protocol.test.mjs`
- `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- `docs/adr/0007-phase-and-integration-review-material-architecture.md`
- `runtime/stage/completion-predicates.mjs`
- `runtime/task/task-store.mjs`
- `runtime/evidence/quality-store.mjs`
- `core/task-close.mjs`
- `docs/architecture/control-plane-inventory.json`
- `docs/adr/0017-stage-quality-fact-freshness-scope.md`
- `CONTEXT.md`
- `docs/standard-workflow.md`
- `tests/contract/plan-acceptance-task-gate.test.mjs`
- `tests/close/close-contract.test.mjs`
- `tests/close/cleanup-resume-finalize.test.mjs`
- `tests/integration/vnext-delivery-close.test.mjs`
- `tests/verify-code-facts.test.mjs`
- `tests/integration/minimal-task-storage.test.mjs`
- `tests/integration/projection-replacement.test.mjs`

### DO NOT TOUCH

- `quality/verify.json` historical instances — audit-only，不改写历史 bytes，也不删除该权威。
- `docs/adr/0018-single-close-delivery.md`、`docs/adr/0019-canonical-quality-ownership-and-compatibility.md`、`docs/adr/0020-close-five-actions-quality-transcription.md`、`docs/adr/0024-remove-host-session-binding.md` — 继续有效。
- `core/` 其他文件、顶层 `schemas/`、新 public command/store/gate — 未证明需要。
- S5、S6、TIA/reuse 范围 — D-010 明确延期。
- 宿主 transcript / 需求来源认证（DEFER-REQ-AUTH）— 伪需求，本任务不新增认证控制面、不要求身份绑定写入。

## Technical Decisions

### DEC-001 — 四个串行单 seam Phase

- **Problem**：跨 seam 并行会混淆权威与 review 事实。
- **Options**：合并；并行；四 Phase 串行。
- **Selected**：reuse current stage loop；四 Phase 串行。
- **Reason**：直接满足 FR-GOV-06，且 producer-before-consumer。
- **Consequence / risk**：总历时更长，但失败可定位。
- **Fallback**：只回滚当前 Phase，保留前序事实。
- **F10 disposition**：keep。

### DEC-002 — S4 advisory 不新增控制面

- **Problem**：需暴露大卡风险但不得形成 gate。
- **Options**：新 store/schema；硬拒绝；现有字段现场派生。
- **Selected**：extend existing validator/status。
- **Reason**：最窄且无第二权威。
- **Consequence / risk**：提醒可能被忽略；status 必须显示。
- **Fallback**：回滚派生逻辑，保留 task risk 原文。
- **F10 disposition**：simplify。

### DEC-003 — S7 维持既有唯一权威，只核对不被绕过

- **Problem**：merge main 后 per-AC 权威与唯一 writer 已成立；旧「移除 current 权威」方向会重做已解问题并制造双写风险。
- **Options**：移除既有权威与 writer；另建第二份产品结果；保留既有唯一权威与唯一 writer 并核对不被绕过。
- **Selected**：reuse the existing per-AC authority and its single canonical writer；本任务只做边界核对、四域与 close 语义收口。
- **Reason**：与 D-006 和 `tests/contract/verify-publication.test.mjs` 的既有合同一致；避免历史分支与双写。
- **Consequence / risk**：仍可能有一条被绕过的落盘路径，因此反向引用扫描必须逐条分类 current/audit_only/test_only，未分类即失败。
- **Fallback**：只在该文件已归属的 Phase 内做最小 fail-closed 收敛；若需要删除既有权威或新增 writer 才能自洽，STOP 回 make-decision。
- **F10 disposition**：keep existing authority。

### DEC-004 — final current snapshot 是 evidence，不是新 authority

- **Problem**：T013 需要可执行 aggregate 与逐 active AC 断言，但不得新增 current store。
- **Selected**：P4 的 `produce-final-current-snapshot.mjs` 只消费 canonical spec 与 immutable/current evidence，把 JSON 写入既有 `quality/tests/final/`；owner=final validator/capture，consumer=verify-code acceptance readback，替代原叙述式 T013，删除条件=既有 acceptance aggregate 原生提供同等 active-AC set equality、完整 production scan 与 evidence hash 语义。
- **Active AC rule**：解析 canonical spec 中全部规范性 `#### AC-*` 标题，并显式并入顶层规范清单中的 `AC-GOV-001`；若同 ID 重复、缺失、无法分类或 tasks copied list 与派生集合不等，aggregate 失败。每个 active AC 恰有一条 assertion；`unknown|unavailable|incomplete|conflict` 不映射为 pass。
- **F10 disposition**：reuse existing quality evidence base。

## Test Strategy

独立 test-routing-advisor 建议已在独立上下文产出：P1/P2/P3=`feature / backend-testing`，P4 与 FINAL=`fullstack / fullstack-slice-testing`（跨 task store/status/close/CLI 基础设施链）；只设计，未执行。

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
| --- | --- | --- | --- | --- |
| S3 全部 FR/AC | T001/T002 | RED/GREEN | `npx vitest run tests/contract/acceptance-execution-tier.test.mjs tests/contract/acceptance-execution-inner.test.mjs tests/contract/acceptance-execution-medium.test.mjs tests/contract/runtime-profile-consumer-readback.test.mjs tests/contract/test-runtime-profile.test.mjs skills/test-routing-advisor/__tests__/skill-contract.test.mjs --fileParallelism --maxWorkers="$RESOLVED_WORKER_CEILING"` / 1→0 | `ORACLE-S3` 同时断言 legacy assertion multiset 守恒、至少两个 inner 文件时间重叠、`2≤actual_workers≤ceiling`、禁用能力调用为零、所有 consumer 只读同一画像来源且无复制阈值；`quality/tests/S3/{red,green}/result.json` |
| S3 五轮性能 | T014 | CAPTURE | `node tools/cli/measure-test-runtime-profile.mjs --profile-json="$PROFILE_JSON" --inner-manifest="$INNER_MANIFEST" --medium-manifest="$MEDIUM_MANIFEST" --runs=5 --output="$TASK_DIR/quality/evidence/performance-profile/S3.json"` / 0 或诚实 nonzero/incomplete | `ORACLE-S3-PERF`；固定成员、每轮独立进程、transform cache 清理、真实文件并行/worker observation、raw refs/hash、max/p95/阈值（阈值取自单一来源） |
| S4 slicing 全部 FR/AC | T004/T005 | RED/GREEN + current self-check | `npx vitest run tests/stage-plan-task-contract-v3.test.mjs tests/contract/status-derivation.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`，随后 `node tools/cli/validate-current-plan-tasks.mjs --spec=specs/workflowhub-execution-acceleration-deferred-20260909/spec.md --plan=specs/workflowhub-execution-acceleration-deferred-20260909/plan.md --tasks=specs/workflowhub-execution-acceleration-deferred-20260909/tasks.md --output="$TASK_DIR/quality/evidence/S4-slicing/current-tasks-self-check.json"` / 1→0，self-check 恒定 0 | `ORACLE-S4S`；current state 不是 `unexplained_overage` 且 zero cross-Phase file producer；材料 hashes/readback 匹配 |
| S4 budget 全部 FR/AC | T007/T008 | RED/GREEN | `npx vitest run tests/review/review-record-route.test.mjs tests/contract/freeze-classification-budget-usage-protocol.test.mjs tests/contract/review-public-entrypoints.test.mjs tests/contract/review-budget-namespace.test.mjs tests/review/review-managed-lifecycle.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / 1→0 | `ORACLE-S4R` 覆盖 public `review --action=record` 与 bare CLI、唯一预算链、导入 provenance 全字段与死类删除；`quality/tests/S4-review-budget/{red,green}/result.json` |
| S7 全部 FR/AC | T010/T011 | RED/GREEN | `npx vitest run tests/contract/four-domain-close-status.test.mjs tests/contract/verify-authority-boundary.test.mjs tests/contract/verify-publication.test.mjs tests/contract/per-ac-material-freshness.test.mjs tests/contract/acceptance-execution-producer.test.mjs tests/contract/control-plane-governance.test.mjs tests/contract/execution-outcome.test.mjs tests/close/close-contract.test.mjs tests/close/cleanup-resume-finalize.test.mjs tests/integration/vnext-delivery-close.test.mjs tests/verify-code-facts.test.mjs tests/integration/minimal-task-storage.test.mjs tests/integration/projection-replacement.test.mjs tests/contract/plan-acceptance-task-gate.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / 1→0 | `ORACLE-S7`；`quality/tests/S7/{red,green}/result.json` |
| 当前快照聚合 | T013 | FINAL | `node tools/cli/produce-final-current-snapshot.mjs --task-id=workflowhub-execution-acceleration-deferred-20260909 --spec=specs/workflowhub-execution-acceleration-deferred-20260909/spec.md --plan=specs/workflowhub-execution-acceleration-deferred-20260909/plan.md --tasks=specs/workflowhub-execution-acceleration-deferred-20260909/tasks.md --task-dir="$TASK_DIR" --output="$TASK_DIR/quality/tests/final/current-snapshot.json"` / 0 | `ORACLE-FINAL`；producer 由 `tests/contract/final-current-snapshot.test.mjs` 验证，先分别执行四组 targeted routes 与 `tests/contract/plan-acceptance-task-gate.test.mjs`，再消费 raw refs，不把全局 singleFork 当 aggregate |

`tools/cli/measure-test-runtime-profile.mjs` 是 P1 可执行 receipt producer：固定 inner 文件各五次、固定 inner 集合五次（真实文件级并行且 worker 不越上限）、medium 集合五次；每轮清 Vitest transform cache、不清 OS page cache。`ORACLE-S3-PERF` 要求 receipt 记录单一画像来源声明的时长上限并逐项比对（inner 单文件最大值、inner 集合 nearest-rank p95(n=5)、medium 集合最大值与 p95），同时记录 machine/Node/Vitest/cache/member manifest hashes/cold/five raw values/max/p95/threshold/resolved+actual workers/per-file timing/overlap/exits/signals/raw refs。n=1、fake、旧 receipt 或同进程循环均失败。

## Deletion Proofs

- S3、S4-slicing 与 close 状态投影没有需要删除的独立持久对象：**不涉及删除**；验证以生产反向引用扫描证明没有第二画像表、第二 store、双写或遗留 authority。
- S4-review-budget 删除死类 `narrow_diff` 时，删除证明要求生产反向引用为零、正式 dispatch 仍只有唯一 budget owner、裸调用保持非权威；若仍发现 current consumer，立即 STOP，不用兼容双写过渡。
- S7 **不删除**既有 per-AC 权威、`publishVerifySummary` 或每任务初始化路径；删除证明的对象是「第二 writer、双写与绕过唯一 writer 的导入路径」——要求这些路径的反向引用为零且被 fail-closed 拒绝，历史 `quality/verify.json` bytes 原样只读保留。

## Rollback and Recovery

- **Global recovery rule**：只回滚当前 Phase 的实现/fixture，保留四材料、RED、失败、review 与 immutable facts；修复后只重跑受影响 targeted route。
- **Irreversible boundaries**：commit/push/merge/archive/cleanup 均需另行真实人工授权；本计划不授权。
- **Recovery owner**：各 Phase 唯一 owner；方向错回 make-decision，规格歧义回 build-spec，卡片/命令错回 build-plan，环境不可用记录 attempt。

### Engineering Risk Handoff

- **PLAN-RISK-001**：S7 边界核对遗漏隐藏的第二 writer/绕过路径，或误把既有唯一权威当成待移除对象。
  - **Affected IDs**：D-006/D-007；FR-S7-01..16；AC-S7-01..19；T010..T013。
  - **Trigger**：生产 scan 出现无法分类为 current/audit_only/test_only 的命中，或出现第二 writer/双写/绕过导入，或四域/close fixture 矛盾。
  - **Consequence**：产品发布事实不可信，或误删既有权威造成双写与历史冲突。
  - **Mitigation or STOP**：认证步骤 readback + `tests/contract/verify-publication.test.mjs` 合同 + targeted matrix + production reverse-reference scan；发现未知落盘路径即 STOP 回 build-plan，绝不删除既有 writer 来自救。
  - **Handling Stage**：build-code，verify-code 复核。
  - **Verification**：ORACLE-S7/ORACLE-FINAL、raw scan 与 status→failure→resume→status evidence。

## Implementation Order

`P1 S3 → P2 S4-slicing → P3 S4-review-budget → P4 S7`。每 Phase 固定 `RED → GREEN（含 capture）→ REVIEW`；下一 Phase 依赖前一 Phase review fact 已真实记录（可为 unavailable，但不得伪 pass）。P1 先拆 test 后收敛 consumer；P4 所有四域/close reader 在同一 GREEN 一次切换，但不删除既有 per-AC 权威与唯一 writer。

## Dependencies and Parallelism

- **Dependencies**：P2 依赖 P1；P3 依赖 P2；P4 依赖 P3；T013 依赖四 Phase 的实现与 review facts。
- **Parallel work**：Phase 与任务调度无并行，四 Phase 串行；卡片 `并行=否` 仅描述调度。唯一例外是 P1 测试进程内部必须真实文件级并行并受解析出的 worker ceiling 约束；P2/P3/P4 的共享可变 fixtures 仍 singleFork/no-fileParallelism。四 Phase 的生产文件集合两两不交叉（含只读消费者登记也不重复），最终 self-check 预期 `SIG-CROSS-PHASE=0`。
- **External dependencies**：真实 review provider 与基准机可能 unavailable；如实记录，不阻止同 task 修复，但不能宣称 Phase/交付完成。

## Requirement and Verification Traceability

| Source / decision | FR | AC | Phase / Task | Depends on | Exact files | Command / oracle |
| --- | --- | --- | --- | --- | --- | --- |
| R-009; D-002/D-003/D-008 | FR-S3-01..13 | AC-S3-01..11 | P1/T001-T003（含 T014） | none | 画像 consumer + split acceptance tests + ADR0027 | S3 targeted / ORACLE-S3 |
| R-010; D-004/D-008 | FR-S4S-01..07 | AC-S4S-01..09 | P2/T004-T006 | T003 | validator/handler/status/tests/ADR0028 | slicing targeted / ORACLE-S4S |
| R-010; D-005/D-008 | FR-S4R-01..09 | AC-S4R-01..12 | P3/T007-T009 | T006 | review route/budget/tests/ADR0007+0028 | review targeted / ORACLE-S4R |
| R-013; D-006/D-007/D-008 | FR-S7-01..16 | AC-S7-01..19 | P4/T010-T013 | T009 | completion/quality/task/close/status/tests/ADR0017+0029/docs | S7 targeted+scan / ORACLE-S7/FINAL |
| D-001/D-009/D-010/D-011 | FR-GOV-01..07 | AC-GOV-01..06 | 四 Phase；T001-T014 | serial | 三 ADR、CONTEXT、standard workflow | 每 Phase oracle + FINAL |

## Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| runtime profile | `tools/cli/run-checks.mjs`, `docs/adr/0027-test-feedback-runtime-profile.md`（`runtime/stage/stage-content-contracts.mjs` 画像契约本体保持现状；该文件的切片相关修改归 P2） | change | T001-T003（含 T014） | 唯一画像来源保持 runtime 契约；advisor 只保留路由权威；不新增第二画像表 |
| slicing/review | `docs/adr/0028-plan-slicing-and-review-budget.md`, `docs/adr/0007-phase-and-integration-review-material-architecture.md` | change | T004-T009 | 精确 supersede 冲突文字 |
| AC/close | `docs/adr/0029-current-ac-and-close-state.md`, `docs/adr/0017-stage-quality-fact-freshness-scope.md`, `docs/architecture/control-plane-inventory.json`, `CONTEXT.md`, `docs/standard-workflow.md` | change | T010-T013 | 四域与 close 三义；per-AC 权威与唯一 writer 保留并登记 |
| constitution | `CONSTITUTION.md`, `constitution-checklist.md` | no change | all | 实现现有原则，不新增条款 |
| requirement-source auth | `runtime/evidence/host-session-transcript.mjs`, `tools/host/workflowhub-stage-agent-bridge.mjs` | no change | all | DEFER-REQ-AUTH 判为伪需求，只登记不交付 |

## Build-plan review disposition（12/12）

来源：`quality/reviews/results/build-plan-simple-45f54b77-b199-5d4d-ab4f-8204aa0f1bab.json`（外置 task 目录；原件不可变）。本表只记录当前 canonical plan/tasks 的处置，不覆盖 provider 原文；10 major + 2 minor 均明确 `fixed`，无 `rejected_invalid`。2026-09-10 上游方向修订后，凡涉及 S7 移除型表述或以 advisor 为画像 owner 的条目，其对象已按 spec §14.1 与 D-006/D-009 改写，finding 本身保持已处置。

| Finding ID | Severity | Disposition | Current execution fact |
| --- | --- | --- | --- |
| F-2b226299b0f0 | major | fixed | T013 仍为 producer-backed snapshot；active-AC set equality、逐 AC assertion 与 evidence hash 认证明确。 |
| F-403c117ca680 | major | fixed | T005 保留 canonical spec/plan/tasks 自检 CLI、hash/readback/state/exit receipt。 |
| F-41a550488518 | minor | fixed | tier suite 拆分为 T001 的 inner/medium readback；旧数字作废，RED 前重新采集 expanded test-name multiset。 |
| F-5a5f522bdf7c | major | fixed | P1 以只读消费者登记 spec-tasks/build-plan/build-code/package CI，改为 consumer 同一来源回执而非复制画像。 |
| F-676edd9b4204 | major | fixed | ADR0028 whole-file 唯一 owner=P3，一次写齐 slicing/budget 与 ADR0007 exact supersedes，并由 ORACLE-S4R 验证。 |
| F-8ad104209384 | major | fixed | S3 移除 singleFork/no-fileParallelism，要求真实 overlap 与解析出的 worker ceiling；串行旗标仅留共享 fixtures。 |
| F-903fa2d28c6f | major | fixed | P2 独占 handler/CLI 通用只读组合点；P4 独占 projection/status test；生产 file sets 交集为零。 |
| F-c7b0569539a1 | major | fixed | T014 与 executable five-run receipt producer 保留，阈值改为从单一画像来源读取。 |
| F-dddd091bd963 | major | fixed | P3 gate 覆盖 public review action 与 bare CLI 的 call-count/non-authoritative/history isolation。 |
| F-f210de7d3e77 | major | fixed | 与 F-903fa2d28c6f 同根；通过 unique whole-file Phase ownership 消除交叉，不以 marker 豁免。 |
| F-f8a8a220f75c | minor | fixed | `acceptance-execution-tier.test.mjs` 明确纳入 T001/T002/T013 前置 S3 route。 |
| F-fc84a5136313 | major | fixed | review-budget seam 与完整 ADR0028 均归 P3，不再跨 owner 或由 P2 代写。 |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"7d028c2919d2ef7749489d4a716be273a0dd986e7ea795a6b052c25a8d5dc12f","id":"CONSTITUTION","version":"1.8.0","clause_count":22}`
- **F1**：重活留在技能/review/task owners，runtime 只投影/编排。
- **F2**：四个窄 seam，完整 provenance 与逐 AC facts，不暴露内部状态。
- **F3**：四材料决定可工作；publication 结构另行 fail-loud。
- **F4**：每 Phase 一次异源 review；finding 不锁死同 task 修复。
- **F5**：slice 恒定 exit 0；不新增 gate。
- **F6**：测试/review/performance 写既有外置 quality 底座。
- **F7**：build-plan 确认与不可逆 authorize 分离；non_ui 无设计确认。
- **F8**：reuse→extend；唯一 writer 保留，第二 writer/双写不新增。
- **F9**：RED、负例、冲突、读写失败均可证伪，不漂白。
- **F10**：只扩展已有测试/validator；三份 ADR 非运行时自动化。
- **F11**：advisory/quality facts 不成为许可证，控制面不扩张。
- **Q1**：缺失/unavailable 可继续修复但不得报完成。
- **Q2**：推进、publication 与完成事实分离。
- **Q3**：Phase review 独立上下文；结构 validator 不冒充质量裁决。
- **S1**：复用 Vitest、现有 advisor/review/status/close 能力。
- **S2**：advisor 在项目内保持路由权威，不扩成画像 owner。
- **S3**：本任务不做外部 skill 更新；仅就地核当前版本，N/A — 无外部升级范围。
- **S4**：profile/performance 指标进入统一 quality evidence。
- **S5**：重扫描、路由建议与 review 可独立子代理执行。
- **S6**：N/A — 不新建通用技能；采用现有测试实践。
- **S7**：不新增 stage/workflow；四 Phase 是 build-code 内实现阶段。
- **S8**：advisor 保持文件输入/JSON 输出、无宿主隐式依赖。

## Complexity Trade-offs

- 选择 14 个主编号卡并增加 T014 capture 子卡（每 Phase RED/GREEN/REVIEW，末尾一个 FINAL），比把四 seam 压成大卡更长，但满足单 seam/独立 evidence/review，且没有新增运行时对象。
- P4 文件数超过 10 是已解释的单 Phase 超限：四域、close 分离与边界核对必须一次收敛；P4 使用独立 projection/status/authority-boundary test，不与 P2/P3 共享生产文件，不拆成第五 Phase。
- S4-review-budget provenance 字段多，但都是认证已有 immutable result 所必需；删减会产生伪造旁路。
- S3 只新增证据与 consumer 回执，因此不需要改动画像契约文件本身；代价是画像阈值现状与 spec §5.2 产品上限的差异必须以读取比对方式显式记录，而不是在本计划写死数值。

## Phase P1 — S3

### Goal

先拆 acceptance 测试，再把画像 consumer 收敛到同一来源并交付五轮独立性能证据与 worker 上限观测；advisor 只保留路由权威，不新增画像表。

### Files

- **NEW**：`tests/contract/acceptance-execution-inner.test.mjs`, `tests/contract/acceptance-execution-medium.test.mjs`, `tests/contract/runtime-profile-consumer-readback.test.mjs`, `tools/cli/measure-test-runtime-profile.mjs`, `docs/adr/0027-test-feedback-runtime-profile.md`
- **MODIFY**：`tools/cli/run-checks.mjs`, `tests/contract/acceptance-execution-tier.test.mjs`
- **READ-ONLY CONSUMER**：`skills/test-routing-advisor/SKILL.md`, `skills/test-routing-advisor/scripts/route.mjs`, `skills/test-routing-advisor/__tests__/skill-contract.test.mjs`, `tests/contract/test-runtime-profile.test.mjs`, `skills/spec-tasks/SKILL.md`, `workflows/build-plan/SKILL.md`, `workflows/build-plan/skill-deps.yaml`, `workflows/build-code/SKILL.md`, `workflows/build-code/skill-deps.yaml`, `package.json`, `tests/contract/spec-stage-artifact-closure.test.mjs`, `tests/contract/build-code-apply-contract.test.mjs` — owner T003（只读回执，不写入）
- **DO NOT TOUCH**：S4/S7 owner files；`runtime/stage/stage-content-contracts.mjs` 画像契约本体；S5/S6/reuse。

### Tasks

- T001 RED：先拆测试并固定 consumer 同一来源、hermetic/medium、真实并行与性能 receipt 失败。
- T002 GREEN：收敛 consumer 到单一来源，执行五次独立测量并 capture。
- T014 CAPTURE：跑五轮协议并写不可变 receipt。
- T003 REVIEW：一次独立 S3 Phase review，保留 actual ref/status。

### Verify

Target=S3 FR/AC + GOV；同 ORACLE-S3 targeted command；RED=1、GREEN=0；证据 `quality/tests/S3/`、`quality/evidence/performance-profile/S3.json`。

### Knowledge

画像契约是唯一来源；advisor 是路由权威；inner 不得触网/DB/fs/child_process；medium 真实边界不可用 mock 证明；不复用旧结果。

### STOP

拆分导致用例丢失、真实边界无法归属、需要第二画像表或第二阈值来源、五样本环境不固定或命令空跑时停止回 build-plan/build-spec。

### Done

只有 RED、同命令 GREEN、完整五次性能 receipt、原始输出和一次独立 review 均有真实事实时完成；阈值失败保持未完成。

### Risks and rollback

错误拆分可掩盖真实能力；回滚本 Phase 文件，不改前序材料/历史 evidence。

## Phase P2 — S4-slicing

### Goal

从现有卡字段现场派生三信号/三态并在 status 显示，解析错误与 unexplained 均 exit 0、非 gate；用可执行命令自检 canonical tasks。

### Files

- **NEW**：`tools/cli/validate-current-plan-tasks.mjs`
- **MODIFY**：`runtime/stage/stage-content-contracts.mjs`, `runtime/stage/stage-handlers.mjs`, `tools/cli/stage-runtime.mjs`, `tests/stage-plan-task-contract-v3.test.mjs`, `tests/contract/status-derivation.test.mjs`
- **DO NOT TOUCH**：review budget owner 与 per-AC authority；不新增 store/schema/gate。

### Tasks

- T004 RED：固定文件/target/跨 Phase/marker/exit-0/status 失败矩阵。
- T005 GREEN：扩展 validator 与 status，串行 readback 本任务 tasks。
- T006 REVIEW：一次独立 slicing Phase review。

### Verify

Target=S4-slicing FR/AC + GOV；共享 status/current fixture，唯一命令 singleFork/no-fileParallelism；ORACLE-S4S；证据 `quality/tests/S4-slicing/`。

### Knowledge

`task risk` 原文唯一持久事实；状态现场派生；通过 seam-specific tests/projections 消除跨 Phase file producers，canonical self-check 不得为 `unexplained_overage` 且 `SIG-CROSS-PHASE=0`。

### STOP

需要第二状态、硬拒绝推进、改变 marker 语法或 shared fixture 被并行运行时停止。

### Done

三态/所有 parse 负例/status readback 都可见且 exit 0，并记录一次独立 review；advisory 不称质量 pass。

### Risks and rollback

提醒可能被忽略；回滚派生代码但保留 marker 原文与 RED 事实。

## Phase P3 — S4-review-budget

### Goal

核对正式派发预算只有一个 owner；合法复用不耗预算；result-only 只有完整 immutable provenance 才可 current；删除死类 `narrow_diff`。

### Files

- **NEW**：`docs/adr/0028-plan-slicing-and-review-budget.md`（whole-file owner=P3；完整记录 P2 已冻结 slicing 决定与本 Phase review-budget 决定）、`tests/contract/review-public-entrypoints.test.mjs`
- **MODIFY**：`runtime/review/review-record-route.mjs`, `runtime/evidence/stage-content-evidence.mjs`, `skills/wh-review/scripts/wh-review-cli.mjs`, `tests/review/review-record-route.test.mjs`, `tests/contract/freeze-classification-budget-usage-protocol.test.mjs`, `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`, `docs/adr/0007-phase-and-integration-review-material-architecture.md`
- **READ-ONLY CONSUMER**：`tests/contract/review-budget-namespace.test.mjs`, `tests/review/review-managed-lifecycle.test.mjs` — owner T009（只读回执，不写入）
- **DO NOT TOUCH**：P2 slicing producer/status 实现与其 owner 文件、provider immutable 原始输出。

### Tasks

- T007 RED：固定唯一预算链、复用、preflight、死类与全 provenance import 矩阵。
- T008 GREEN：补齐 result-only provenance、删除死类，capture 一次正式请求来源链（不得额外发 provider）。
- T009 REVIEW：一次独立 budget/provenance Phase review。

### Verify

Target=S4-review-budget FR/AC + GOV；ORACLE-S4R；证据 `quality/tests/S4-review-budget/` 与 `quality/evidence/S4-review-budget/formal-request-provenance.json`。

### Knowledge

唯一预算链已由 main 落地（inventory:11），本 Phase 只补齐与删除；完整 provenance 逐字段认证；任一缺失/mismatch/stale/tamper 都只能 authoritative:false；provider failure 不伪 pass。

### STOP

发现第二正式 dispatch owner、无法认证 existing attempt/raw output、需以摘要替代来源或需新增 public command/store 时停止。

### Done

同命令 RED/GREEN、一次且仅一次真实正式 request readback（若 provider unavailable 则如实记录）、完整 provenance matrix、死类无生产路径和一次独立 review 有事实。

### Risks and rollback

字段漏验会允许伪导入；回滚当前 route 变更但不恢复 `narrow_diff` 为 current 旁路，不改 immutable attempts。

## Phase P4 — S7

### Goal

核对既有 per-AC 唯一权威与唯一 writer 不被绕过（第二 writer/双写/绕过导入 fail-closed）；status 四域齐全；close plan/step/completed、失败恢复与 existing workspace 语义一致。

### Files

- **NEW**：`runtime/stage/current-close-projection.mjs`, `tests/contract/four-domain-close-status.test.mjs`, `tests/contract/verify-authority-boundary.test.mjs`, `tests/contract/final-current-snapshot.test.mjs`, `tools/cli/produce-final-current-snapshot.mjs`, `docs/adr/0029-current-ac-and-close-state.md`
- **MODIFY**：`runtime/stage/completion-predicates.mjs`, `runtime/task/task-store.mjs`, `runtime/evidence/quality-store.mjs`, `core/task-close.mjs`, `docs/architecture/control-plane-inventory.json`, `tests/contract/plan-acceptance-task-gate.test.mjs`, `tests/close/close-contract.test.mjs`, `tests/close/cleanup-resume-finalize.test.mjs`, `tests/integration/vnext-delivery-close.test.mjs`, `tests/verify-code-facts.test.mjs`, `tests/integration/minimal-task-storage.test.mjs`, `tests/integration/projection-replacement.test.mjs`, `docs/adr/0017-stage-quality-fact-freshness-scope.md`, `CONTEXT.md`, `docs/standard-workflow.md`
- **READ-ONLY CONSUMER**：`tests/contract/verify-publication.test.mjs`, `tests/contract/per-ac-material-freshness.test.mjs`, `tests/contract/acceptance-execution-producer.mjs`, `tests/contract/acceptance-execution-producer.test.mjs`, `tests/contract/control-plane-governance.test.mjs`, `tests/contract/execution-outcome.test.mjs`, `tests/contract/stage-handoff.test.mjs`, `tests/contract/performance-budget.test.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/stage/stage-agent-outcome-adapter.mjs` — owner T012（只读回执，不写入）
- **DO NOT TOUCH**：历史 `quality/verify.json` bytes 与既有权威地位、ADR0018/0019/0020/0024、真实 existing workspace、P2 的 `tools/cli/stage-runtime.mjs`、S5/S6/reuse。

### Tasks

- T010 RED：先写齐唯一权威不被绕过、四域、close、failure-resume 与 scan 失败矩阵。
- T011 GREEN：收敛四域/close 分离与只读 projection、登记 inventory 与文档，保留既有唯一权威与 writer。
- T012 REVIEW：一次独立 S7 boundary/close Phase review。
- T013 FINAL：当前快照一次 aggregate targeted verification + production scan。

### Verify

Target=S7 全部 FR/AC + GOV + 四 seam aggregate；ORACLE-S7/ORACLE-FINAL；证据 `quality/tests/S7/`、`quality/evidence/S7/`、`quality/tests/final/current-snapshot.json`。

### Knowledge

仅 current/authenticated build-code|verify-code `AC-*` facts；latest tie/bad time/conflict/missing/stale fail-closed；唯一 writer 之外的落盘路径 fail-closed；physical 四域不替代质量；confirm-before-authorize 不变。

### STOP

生产 scan 有无法分类的第二 writer/落盘路径、需要删除既有权威或新增 writer、close 要覆写 immutable failure、existing workspace 将被删除或真实授权缺失时停止。

### Done

同命令 GREEN、生产 scan 逐条分类且无第二 writer/双写/绕过导入、隔离 `status→cleanup failure→resume same plan→status` 与 existing workspace evidence、一次独立 review 和 T013 全覆盖事实齐全。

### Risks and rollback

`slice-advisory: reason="S7 四域、close 分离与边界核对必须同一 Phase 收敛以避免来回改同一批 reader；本 Phase 独占 current-close projection 与 four-domain/authority-boundary fixture，不写其它 Phase 的生产文件"; impact="单卡文件超过10，执行和审查成本上升但无跨Phase文件producer"; owner="S7 current/close owner"; recheck="T013 complete production scan、四域矩阵和同计划恢复全部有当前证据后复查"`
回滚只限本 Phase 未发布的当前实现；禁止删除既有 per-AC 权威或唯一 writer；若核对需要改动本 Phase 之外的生产文件，保持失败事实并回 build-plan。
