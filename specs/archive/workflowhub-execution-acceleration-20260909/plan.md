# 实现计划：WorkflowHub 执行加速与阻塞削减

- **Input**：`specs/workflowhub-execution-acceleration-20260909/decision-log.md`、`specs/workflowhub-execution-acceleration-20260909/spec.md`
- **Template version**：`plan-task.v4`

## 材料导航

| 锚点 | 职责 | 读取 |
|---|---|---|
| decision-log.md#决定 | 冻结方向/延期 | M/S 接收 phase |
| spec.md#11-验收标准 | 原样 AC/oracle | S/B 实现验证 |
| plan.md#Phase | seam/文件/顺序 | M/S 派发 |
| tasks.md#Phase | 命令/执行事实 | B/P 执行 |

## Quick Read

- **Goal**：必败 review 五秒内零 provider；中断复用；窄 worker；正交 profile；逐 AC 窄容忍。
- **Non-goals**：source: R-008,R-009,R-016,R-017,R-021；decision: D-010：不做 S3–S7，不新增 stage/gate/store，不改 broker internals/close。
- **Before**：同步 review、动态 drift、主会话重上下文；另有 decision-freeze 历史 proof 字段兼容缺陷，作为 runtime 已知事实保留但不冒充本规格 AC。
- **After**：五个独立 seam 逐对 RED/GREEN，最终仅做聚合事实。
- **Main risk**：managed start 与 publication 间重复派发或 stale 绑定。
- **Next step**：P1 先落地唯一 capability-proof executor。

## Technical Context

### Global Constraints

- **Verified facts**：Node ESM；broker 已有 start/status；当前四材料为唯一真相；public runtime 七类。
- **Language / runtime**：Node >=24，Vitest 2.1.9。
- **Primary dependencies**：现有 wh-review/broker/stage bridge/canonical evidence；不新增依赖。
- **Storage / state**：仅既有 quality namespace、attempt/result/broker state。
- **Testing**：只跑列出的 targeted vitest，singleFork/no-fileParallelism；不跑全量。
- **Target environment**：local CLI 与 CI；large profile 仅 CI。
- **Scale / scope**：6 phases；每 phase 一个 seam；≤5 是优化目标，6–10 记录偏离，>10 回决定材料重新切片。
- **Unresolved facts**：真实 task id 由用户在 build-code 后指定；未指定 AC-DELIVERY-001 incomplete。D-008 的仓库 fixture 仅用于合同测试，不替代同一决定要求的真实任务；spec/AC 是本阶段行为权威。

## Code Anchors

- **Verified anchors**：review-record-route managed publication；stage-runner readDecisionFreezeSources；stage-agent bridge runBridge；freshness evaluateFactFreshness。
- **Existing interfaces**：broker start/status/request-id；stage-input-packet.v1；stage outcome；canonical test receipt。
- **Read now**：各 Phase Files 中生产符号及对应测试。
- **Must read before task**：实际 schema/test fixture，只在对应 task brief 内读取。
- **Context mode**：Lite — 每卡一个 seam 与冻结 refs。

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
|---|---|---|---|
| review preflight/recovery | extend | review-record-route/simple-review-runner | 复用唯一 writer 与 broker |
| authenticated route repair budget | extend | review-record-route/stage-content-evidence | canonical history + host-derived route identity；既有预算原生支持后删除专用分支 |
| worker brief/summary | extend | stage bridge/stage-input-packet | 不建 worker store |
| runtime profile | extend | plan-task validator/canonical receipt | 新字段 owner=plan validator，consumer=test executor，原生支持后可删适配 |
| AC freshness | extend | evaluateFactFreshness | 白名单扩展，不建投影 store |

## Solution Design

### Overview

以现有 review route、host bridge、test receipt 与 freshness 投影为四个独立 seam；每个 Phase 先 RED 后 GREEN，终态仍走现有唯一 writer，不新增 public command、gate 或 store。

### Module responsibilities

#### Review route
- **Responsibility**：preflight、managed runtime、closure、唯一终态。
- **Consumes**：review packet、broker start/status。
- **Produces**：canonical attempt/result。
- **Must not decide**：阶段或发布许可。

#### Stage coordination/evidence
- **Responsibility**：角色/brief/summary/profile/freshness 事实。
- **Consumes**：stage packet、host lifecycle、test/AC evidence。
- **Produces**：现有 outcome/receipt/projection。
- **Must not decide**：产品方向或新状态权威。

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：attempt 增 runtime binding/closure/typed diagnostics；packet/summary/profile 扩展现有 schema；budget kind 增内部 `route_repair`，不新增 request/public command 字段。
- **Data flow / state**：preflight→start→status→terminal→atomic closure auth→create-only publish；失败保持 unavailable/incomplete。
- **API contract**：仅消费既有 broker CLI start/status；无新 public command。
- **UI / external code**：N/A — non_ui。
- **Fail-loud behavior**：typed code、原始退出码、unknown 不转 pass。

## File Boundary

### NEW

- `docs/adr/0025-review-dispatch-preflight-boundaries.md`
- `tests/review/review-managed-lifecycle.test.mjs`
- `tests/contract/governance-review-dispatch-boundary.test.mjs`
- `tests/contract/test-runtime-profile.test.mjs`
- `tests/contract/per-ac-material-freshness.test.mjs`
- `tests/acceptance/workflow-execution-current-task.test.mjs`
- `tests/review/review-record-route.test.mjs`

### MODIFY

- `skills/wh-review/scripts/simple-review-runner.mjs`
- `skills/wh-review/scripts/review-provider-client.mjs`
- `runtime/review/review-record-route.mjs`
- `runtime/evidence/stage-content-evidence.mjs`
- `runtime/review/schemas/attempt.schema.json`
- `runtime/stage/stage-handlers.mjs`
- `tests/final-cutover-guards.red.test.mjs`
- `docs/adr/0007-phase-and-integration-review-material-architecture.md`
- `docs/standard-workflow.md`
- `tools/host/workflowhub-stage-agent-bridge.mjs`
- `runtime/task/material-workspace.mjs`
- `runtime/stage/stage-agent-outcome-adapter.mjs`
- `tests/contract/host-outcome-bridge.test.mjs`
- `runtime/stage/stage-content-contracts.mjs`
- `runtime/evidence/canonical-receipt-writer.mjs`
- `runtime/evidence/canonical-evidence-validators.mjs`
- `tools/cli/run-checks.mjs`
- `runtime/evidence/freshness.mjs`
- `runtime/stage/completion-predicates.mjs`

### DO NOT TOUCH
- `runtime/review/schemas/result.schema.json` 与 broker provider internals；结果 schema/协议不变。
- close/verify read model；属于 DEFER-S7。

### Deletion proofs
- **No deletion**：本期不删除现有生产文件、测试、schema、事实或审查历史；所有变更均为现有 seam 的窄扩展或新增定向测试/ADR。
- **Replacement proof**：不新增第二 store、writer、gate、stage 或 public command，因此没有需要迁移或删除的旧控制面。
- **Future cleanup**：仅当 host/test executor 原生提供同一已认证字段时，按 Governance Synchronization Matrix 的 retention 条件删除适配字段；该清理不属于本期。

## Technical Decisions

### DEC-001 — 现有 managed lifecycle 与唯一 writer
- **Problem**：同步等待中断丢结果。
- **Options**：新 store；扩展 route。
- **Selected**：extend review route + broker managed lifecycle。
- **Reason**：最小且已有真实 consumer。
- **Consequence / risk**：需保证 start 恢复与 publication 原子边界。
- **Fallback**：保持 unavailable attempt，不回退同步全量重派。
- **F10 disposition**：keep。

### DEC-002 — 正交运行画像
- **Problem**：test tier 不表达运行资源。
- **Options**：改 tier；新增正交字段。
- **Selected**：extend plan/task/receipt with test runtime profile。
- **Reason**：避免覆盖 simple/feature/fullstack。
- **Consequence / risk**：executor 无 proof 时 AC 不通过。
- **Fallback**：事实 unavailable。
- **F10 disposition**：keep。

## Test Strategy

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
|---|---|---|---|---|
| AC-TEST-001/002 | T003/T004 | RED/GREEN or FINAL | `node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p1-profile.json -- npx vitest run tests/stage-plan-task-contract-v3.test.mjs tests/contract/test-runtime-profile.test.mjs tests/contract/official-component-receipts.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / 1→0 or explicit incomplete | ORACLE-P1-PROFILE / quality/tests/p1-profile.json |
| governance semantics | T005/T006 | RED/GREEN or FINAL | `node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p2-governance.json -- npx vitest run tests/contract/governance-review-dispatch-boundary.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / 1→0 or explicit incomplete | ORACLE-P2-GOV / quality/tests/p2-governance.json |
| AC-REVIEW-000..005 | T007/T008 | RED/GREEN or FINAL | `node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p3-review.json -- npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs tests/review/review-record-route.test.mjs tests/integration/wh-review-v3-broker-contract.test.mjs tests/review/review-managed-lifecycle.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / 1→0 or explicit incomplete | ORACLE-P3-REVIEW / quality/tests/p3-review.json |
| AC-REVIEW-006 | T014/T015 | RED/GREEN | 同一 Vitest selection/oracle；初始 RED/GREEN 后，独立 finding 扩展 RED=`quality/tests/p3-route-repair-findings-red.json`、最终 GREEN=`quality/tests/p3-route-repair-findings-green.json` / 1→0 | ORACLE-P3-ROUTE-REPAIR / immutable role-specific receipts |
| AC-COORD-002/003 + role/cap/usage schema | T009/T010 | RED/GREEN or FINAL | `node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p4-coord.json -- npx vitest run tests/contract/host-outcome-bridge.test.mjs tests/contract/material-oracle-context-packet.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / 1→0 or explicit incomplete | ORACLE-P4-COORD / quality/tests/p4-coord.json |
| AC-FRESH-001/002 | T011/T012 | RED/GREEN or FINAL | `node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p5-fresh.json -- npx vitest run tests/contract/per-ac-material-freshness.test.mjs tests/integration/verify-freshness-selection.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / 1→0 or explicit incomplete | ORACLE-P5-FRESH / quality/tests/p5-fresh.json |
| AC-COORD-001/004 + AC-DELIVERY-001 | T013 | FINAL | `node tests/acceptance/workflow-execution-current-task.test.mjs` / 0 or explicit unavailable boundary | ORACLE-FINAL-LOCAL / stdout JSON + targeted receipts |

P1 extends `run-checks.mjs` as the unique capability-proof executor; every later gate uses it. Missing enforcement proof is unavailable, never pass.

## Rollback and Recovery

- **Global recovery rule**：只回滚当前 Phase 生产改动，保留 RED、四材料与 immutable quality facts。
- **Irreversible boundaries**：commit/push/merge/archive/cleanup 均不执行，需另行授权。
- **Recovery owner**：当前 Phase 单 writer；回退后按同命令重建 GREEN。P3 回滚先凭 deterministic request/runtime identity 调用既有 broker status 读取；running 则 cancel，并由 runtime-owned terminal event 在 300s timeout 内收敛；先采集 completed members 后再回滚 schema。timeout 记 unavailable，禁止换 identity 重派。

### Engineering Risk Handoff
- **PLAN-RISK-001**：managed runtime 重复派发
  - **Affected IDs**：FR-REVIEW-002 / AC-REVIEW-003 / T003-T004
  - **Trigger**：start 成功后中断或 status missing。
  - **Consequence**：provider 重复与冲突结果。
  - **Mitigation or STOP**：deterministic identity + table tests；身份不一致 STOP。
  - **Handling Stage**：build-code。
  - **Verification**：同 request/runtime 和至少一个 completed member 复用。
- **PLAN-RISK-002**：profile 只有声明无 enforcement
  - **Affected IDs**：AC-TEST-001 / T009-T010
  - **Trigger**：receipt 无 capability proof。
  - **Consequence**：错误宣称隔离。
  - **Mitigation or STOP**：unavailable/fail closed，不宣称达标。
  - **Handling Stage**：verify-code。
  - **Verification**：负向 capability tests。

## Implementation Order

基础实现顺序 P1→P2→P3→P4→P5→P6；D-012 在当前 provider 阻塞被确认后追加 P3-R，再重做一次 FINAL。profile executor 先落地，治理先于 review behavior，生产写串行。

## Dependencies and Parallelism

- **Dependencies**：P1 提供 capability-proof executor；P2 同步治理；P3 提供 durable review facts；P4 的 host bridge/session recorder 产出 producer-role、dispatch/terminal event 与 usage-ref 绑定，拒绝主会话重任务和第 7 个 worker；P6 local aggregate 只验证当前事实与 unavailable 边界，AC-COORD-001/004 的 live threshold 留待后续 host telemetry；P3/P4 各自扩展既有证据合同。
- **Parallel work**：只读调查最多 3；每 phase worker 总数/峰值<=6；写 owner=1。
- **External dependencies**：broker 可 unavailable；保持事实，不加 fallback provider。

## Requirement and Verification Traceability

| Source | FR | AC | Phase / Task | Command / oracle |
|---|---|---|---|---|
| D-007 D-009 | FR-TEST-001 | AC-TEST-001/002 | P1/T003-T004 | `node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p1-profile.json -- npx vitest run tests/stage-plan-task-contract-v3.test.mjs tests/contract/test-runtime-profile.test.mjs tests/contract/official-component-receipts.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / ORACLE-P1-PROFILE |
| D-004 D-009 | FR-REVIEW-001/004 | governance semantics | P2/T005-T006 | `node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p2-governance.json -- npx vitest run tests/contract/governance-review-dispatch-boundary.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / ORACLE-P2-GOV |
| D-003 D-004 D-005 | FR-REVIEW-001..004 | AC-REVIEW-000..005 | P3/T007-T008 | `node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p3-review.json -- npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs tests/review/review-record-route.test.mjs tests/integration/wh-review-v3-broker-contract.test.mjs tests/review/review-managed-lifecycle.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / ORACLE-P3-REVIEW |
| D-012 | FR-REVIEW-005 | AC-REVIEW-006 | P3-R/T014-T015 | `npx vitest run tests/review/review-record-route.test.mjs -t "T014 authenticated route-repair review budget" --poolOptions.forks.singleFork --no-fileParallelism`，由 run-checks 分别写 RED/GREEN immutable receipt / ORACLE-P3-ROUTE-REPAIR |
| D-002 D-007 D-009 | FR-COORD-001..003 | AC-COORD-002/003 | P4/T009-T010 | `node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p4-coord.json -- npx vitest run tests/contract/host-outcome-bridge.test.mjs tests/contract/material-oracle-context-packet.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / ORACLE-P4-COORD |
| D-006 | FR-FRESH-001 | AC-FRESH-001/002 | P5/T011-T012 | `node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p5-fresh.json -- npx vitest run tests/contract/per-ac-material-freshness.test.mjs tests/integration/verify-freshness-selection.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / ORACLE-P5-FRESH |
| D-002 D-008 D-011 | FR-COORD-001/003 | AC-COORD-001/004 AC-DELIVERY-001 | P6/T013 | `node tests/acceptance/workflow-execution-current-task.test.mjs` / ORACLE-FINAL-LOCAL |

### Acceptance cards copied from spec

- [ ] **AC-REVIEW-000**：生命周期、分类与原子边界矩阵
场景：逐项执行 preflight blocked、start success 后中断、running、clean 空 findings、partial、cancelled、status unreadable、expired、missing、material drift，以及 start 前/最后成员后/publication 临界区三处材料 mutation。
验证：每个 case 检查唯一 owner/container、typed code、provider 调用数、runtime/request 复用、closure bytes/hash 和当前投影。
通过：所有 case 精确落到本规格矩阵；clean 空 findings 只形成 clean 候选事实而非 stage pass；三处 mutation 均不发布 stale current result；start 成功后中断可用同 request 幂等找回 runtime。
失败：任一状态被折叠为 clean/pass、重复 provider、丢失成员、错误码不可区分、closure 比较与发布间可插入 stale 写，或 fixture 代替真实复跑。
证据：table-driven integration tests + canonical attempt/result evidence。

- [ ] **AC-REVIEW-001**：静态必败在昂贵派发前结束
场景：SCN-001 中任一可预知无效输入发起审查。
验证：观察耗时、dispatch state、provider attempts 和诊断。
通过：五秒内返回 blocked_before_dispatch，provider 调用数和 provider attempts 均为 0，并有稳定错误码与下一步。
失败：超过五秒、启动任一 provider、只抛无记录异常，或把阻断记成 pass。
证据：test + canonical attempt evidence。

- [ ] **AC-REVIEW-002**：未知健康和 token 上限不被猜成失败或通过
场景：SCN-002 中静态字节合法但可信 limit/health 缺失。
验证：观察边界判定和后续运行事实。
通过：未知显式记录，既不直接拒绝也不声称健康；继续使用可信字节边界。
失败：用字符代理冒充 token、把 unknown 当 unhealthy，或把未知改写为 pass。
证据：contract test + attempt evidence。

- [ ] **AC-REVIEW-003**：中断后复用 managed run
场景：SCN-003 中至少一个 provider 已完成后调用方中断并恢复。
验证：比较恢复前后 request/runtime identity、provider 成员和最终 canonical result。
通过：同一 request identity 返回同一未过期 runtime，至少复用一个已完成成员，终态结果只发布一次。
失败：重新调用所有 provider、丢失已完成成员、产生冲突终态，或扫描历史 latest 猜结果。
证据：integration test + broker status/result evidence。

- [ ] **AC-REVIEW-004**：非材料写入不造成漂移
场景：SCN-004 在 dispatch 期间产生闭包外写入。
验证：比较冻结材料 identity 与最终 result binding。
通过：drift 数为 0，结果正常记录且身份仍匹配。
失败：因闭包外文件变化返回 REVIEW_SOURCE_DRIFT 或丢弃结果。
证据：integration test + canonical review result。

- [ ] **AC-REVIEW-005**：材料漂移留下真实 attempt 并保留成员事实
场景：SCN-005 在 dispatch 期间改变受审材料。
验证：观察 attempt、成员输出和当前结果投影。
通过：写一个 unavailable attempt，明确 drift；已完成成员仍可定位；旧结果不冒充当前。
失败：没有 attempt、删除成员事实、绑定 stale result，或把 drift 当 clean。
证据：integration test + attempt/provider evidence。

- [ ] **AC-REVIEW-006**：受认证 route repair 只增加一次真实失败重试预算
场景：canonical history 中前次同 revision attempt 已真实 dispatch 且所有已选 provider 均失败/取消、无 semantic output；宿主当前 route identity 已变化，并覆盖全部不合格负例。
验证：route 从 canonical history 选 candidate，validator 核对失败分类、route identity 差异与同 revision 次数。
通过：仅合格路径得到 `kind=route_repair` 一次；已消耗真实 round 的其余路径在 provider 调用前拒绝且保留旧失败事实；blocked-before-dispatch 保持既有 initial dispatch 语义。
失败：request 自报、零 provider attempt、非 provider 错误、同 route 或第二次 repair 获得预算。
证据：ORACLE-P3-ROUTE-REPAIR + current canonical attempt fixtures。

- [ ] **AC-COORD-001**：主会话输入占比下降
场景：SCN-010 完整复跑。
验证：以该任务全部输入 token 为分母、main session 输入 token 为分子。
通过：占比低于 25%；无法采集时只记录 unavailable，不宣称达标。
失败：占比不低于 25% 或分母不完整却报告通过。
证据：performance profile evidence。

- [ ] **AC-COORD-002**：worker brief 和窄返回全部合规
场景：SCN-006 中所有 worker 派发。
验证：逐个检查 brief identity/边界和 summary 长度/ref/hash。
通过：100% brief 自足，100% 返回不超过 500 字且含可读 ref 与匹配 sha256。
失败：任一 worker 继承未声明历史、返回轨迹、超长或 ref/hash 不匹配。
证据：contract test + worker lifecycle evidence。

- [ ] **AC-COORD-003**：读并发受限且写单线程
场景：SCN-007 同时安排独立读取与写入。
验证：观察并发峰值、依赖图与写 owner。
通过：默认读并发不超过 3、任何 phase 的 worker 总数和并发峰值均不超过 6；第 7 个请求未派发且返回重新切分；同时写 owner 始终为 1。
失败：超过硬上限、多 writer，或有依赖任务并行写。
证据：contract/integration test + stage outcome evidence。

- [ ] **AC-COORD-004**：长任务无 sleep polling
场景：SCN-010 含一个长运行任务。
验证：统计 main session 从派发到终态的有意义事件及 sleep/poll 调用。
通过：有意义主会话事件不超过 3 且 sleep polling 为 0。
失败：循环 sleep、重复 status 回传淹没主会话，或超过 3 个无必要事件。
证据：performance profile evidence。

- [ ] **AC-TEST-001**：测试画像与 tier 正交且字段完整
场景：SCN-008 检查本任务计划内每个测试。
验证：逐项核对 tier、profile、时长、五类能力/环境声明及 executor 的 capability proof/拒绝事实。
通过：每项同时具有独立 tier/profile；executor 对每项禁用能力给出可认证 enforcement/deny 事实，无法证明时该项 unavailable 且 AC 不通过；inner、medium、large 均遵守本规格边界。
失败：复用 test tier 名称表示时长、字段缺失，或把 unknown 权限视为允许。
证据：contract test + plan analysis evidence。

- [ ] **AC-TEST-002**：性能画像不改变测试行为
场景：对一个受影响测试集合生成本期唯一性能画像。
验证：比较画像前后测试选择、断言语义和结果。
通过：选择与断言不变，记录时长/profile/权限事实；不包含 fixture 或并行度改造。
失败：为达时长删除测试、弱化断言，或声称未实施的提速。
证据：performance profile + targeted test evidence。

- [ ] **AC-FRESH-001**：仅 material revision 变化可复用
场景：SCN-009 中只改变 material revision，其他绑定完全相同。
验证：比较 AC fact 的全部 identity/result/evidence 字段与 provenance。
通过：AC 仍可作为当前结果消费，并保留 source material revision。
失败：拒绝唯一允许的差异，或丢失来源 revision。
证据：contract test + acceptance projection evidence。

- [ ] **AC-FRESH-002**：其他任何差异都必须 stale
场景：分别改变 task、snapshot tree、evidence ref、evidence hash、AC ID、适用输入、结果或来源 provenance（除目标 current material revision 外）。
验证：逐例读取新鲜度结论和原因。
通过：每例均 stale/incomplete 且指出实际变化字段。
失败：任一变化仍复用，或把 stale 改写为 passed。
证据：negative contract tests + projection evidence。

- [ ] **AC-DELIVERY-001**：当前 task 本地 aggregate 覆盖四类行为并保留 live 缺失边界
场景：SCN-010 读取当前认证 task 的 targeted receipts、源码和四份材料；不要求用户提供真实 task。
验证：汇总 AC-REVIEW、AC-COORD、AC-FRESH 和 profile 证据，并检查每个 active AC 有实际 assertion；对没有 host telemetry 的 AC-COORD-001/004 输出 `unavailable` 及原因。
通过：本地合同和逐 AC 绑定均可判真，缺失的真实 task/host usage 明确保留为 unavailable，不把本地 aggregate 当真实运行或统计结论。
失败：遗漏 active AC、读取过期/非零 targeted receipt、伪造 usage，或把 unavailable 写成 live threshold 达标。
证据：current-task aggregate JSON、targeted test receipts 与当前源码/材料身份。

## Governance Synchronization Matrix

| Surface | Actual files | Task | Owner → consumer | retention |
|---|---|---|---|---|
| capability-proof executor/profile receipt | `tools/cli/run-checks.mjs`; `runtime/evidence/canonical-receipt-writer.mjs` | T003-T004 | test infra → every gate | remove only after native replacement |
| ADR 0025/ADR0007/standard workflow | `docs/adr/0025-review-dispatch-preflight-boundaries.md`; `docs/adr/0007-phase-and-integration-review-material-architecture.md`; `docs/standard-workflow.md` | T005-T006 | governance writer → review users | retain approved semantics |
| managed review lifecycle | `runtime/review/review-record-route.mjs`; `runtime/stage/stage-handlers.mjs` | T007-T008 | review route → attempt/result consumers | no second store |
| worker telemetry/summary | `tools/host/workflowhub-stage-agent-bridge.mjs` | T009-T010 | host bridge → stage outcome/P6 | remove adapter after native host support |
| AC freshness | `runtime/evidence/freshness.mjs` | T011-T012 | evidence writer → completion projection | retain narrow whitelist |
| broker internals | protected provider files | none | broker → review adapter | no change |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"bf61be16d4d67c582258e7731a335cdca20749764d5a18607f4cd8e98c26ebcb","id":"CONSTITUTION","version":"current","clause_count":22}`
- **F1**：通过设计约束：扩展现有 seam、单 writer、显式 consumer/evidence/STOP，不新增 gate/store/stage。
- **F2**：通过设计约束：扩展现有 seam、单 writer、显式 consumer/evidence/STOP，不新增 gate/store/stage。
- **F3**：通过设计约束：扩展现有 seam、单 writer、显式 consumer/evidence/STOP，不新增 gate/store/stage。
- **F4**：通过设计约束：扩展现有 seam、单 writer、显式 consumer/evidence/STOP，不新增 gate/store/stage。
- **F5**：通过设计约束：扩展现有 seam、单 writer、显式 consumer/evidence/STOP，不新增 gate/store/stage。
- **F6**：通过设计约束：扩展现有 seam、单 writer、显式 consumer/evidence/STOP，不新增 gate/store/stage。
- **F7**：通过设计约束：扩展现有 seam、单 writer、显式 consumer/evidence/STOP，不新增 gate/store/stage。
- **F8**：通过设计约束：扩展现有 seam、单 writer、显式 consumer/evidence/STOP，不新增 gate/store/stage。
- **F9**：通过设计约束：扩展现有 seam、单 writer、显式 consumer/evidence/STOP，不新增 gate/store/stage。
- **F10**：通过设计约束：扩展现有 seam、单 writer、显式 consumer/evidence/STOP，不新增 gate/store/stage。
- **F11**：通过设计约束：扩展现有 seam、单 writer、显式 consumer/evidence/STOP，不新增 gate/store/stage。
- **Q1**：通过设计约束：扩展现有 seam、单 writer、显式 consumer/evidence/STOP，不新增 gate/store/stage。
- **Q2**：通过设计约束：扩展现有 seam、单 writer、显式 consumer/evidence/STOP，不新增 gate/store/stage。
- **Q3**：通过设计约束：扩展现有 seam、单 writer、显式 consumer/evidence/STOP，不新增 gate/store/stage。
- **S1**：通过设计约束：扩展现有 seam、单 writer、显式 consumer/evidence/STOP，不新增 gate/store/stage。
- **S2**：通过设计约束：扩展现有 seam、单 writer、显式 consumer/evidence/STOP，不新增 gate/store/stage。
- **S3**：通过设计约束：扩展现有 seam、单 writer、显式 consumer/evidence/STOP，不新增 gate/store/stage。
- **S4**：通过设计约束：扩展现有 seam、单 writer、显式 consumer/evidence/STOP，不新增 gate/store/stage。
- **S5**：通过设计约束：扩展现有 seam、单 writer、显式 consumer/evidence/STOP，不新增 gate/store/stage。
- **S6**：通过设计约束：扩展现有 seam、单 writer、显式 consumer/evidence/STOP，不新增 gate/store/stage。
- **S7**：通过设计约束：扩展现有 seam、单 writer、显式 consumer/evidence/STOP，不新增 gate/store/stage。
- **S8**：通过设计约束：扩展现有 seam、单 writer、显式 consumer/evidence/STOP，不新增 gate/store/stage。

## Phase P1 — 测试运行画像合同与证据

### Goal

以一个 consumer seam 完成 FR-TEST-001，可由 ORACLE-P1-PROFILE 判真。

### Files

- **NEW**：`tests/contract/test-runtime-profile.test.mjs`
- **MODIFY**：`runtime/stage/stage-content-contracts.mjs`、`runtime/evidence/canonical-receipt-writer.mjs`、`runtime/evidence/canonical-evidence-validators.mjs`、`tools/cli/run-checks.mjs`
- **DO NOT TOUCH**：`skills/wh-review/scripts/review-result-writer.mjs`、`runtime/review/schemas/result.schema.json`、broker provider internals；避免第二 writer/schema/协议。

### Tasks

- RED：增加 ORACLE-P1-PROFILE profile 字段、权限拒绝与 before/after 语义相等失败断言。
- GREEN：最小扩展现有 seam 使同一命令通过。

### Verify

`node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p1-profile.json -- npx vitest run tests/stage-plan-task-contract-v3.test.mjs tests/contract/test-runtime-profile.test.mjs tests/contract/official-component-receipts.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；RED expected_exit=1，GREEN expected_exit=0；oracle=ORACLE-P1-PROFILE；evidence=quality/tests/p1-profile.json。

### Knowledge

只消费冻结 spec、前序 GREEN 事实和列出的 existing anchors；质量事实不是工作许可证。

### STOP

需要新 stage/store/gate、修改 DO NOT TOUCH、弱化断言或超出当前 FR/AC 时返回 plan/spec owner。

### Done

同命令 RED→GREEN、全部 AC-TEST-001 AC-TEST-002 有真实断言、证据保留原始退出码。

### Risks and rollback

Affected=AC-TEST-001 AC-TEST-002；风险是扩大控制面；只回滚本 Phase 实现并保留测试与历史事实。

## Phase P2 — 治理精确同步

### Goal

仅创建 ADR 0025 并修订两个批准冲突位置；ORACLE-P2-GOV 证明无第三处语义变化。

### Files

- **NEW**：`docs/adr/0025-review-dispatch-preflight-boundaries.md`、`tests/contract/governance-review-dispatch-boundary.test.mjs`
- **MODIFY**：`docs/adr/0007-phase-and-integration-review-material-architecture.md`、`docs/standard-workflow.md`
- **DO NOT TOUCH**：其他 ADR/治理语义；只允许 spec 的两个冲突位置。

### Tasks

- T005 RED：写治理差异断言。
- T006 GREEN：应用精确两处修订。

### Verify

`node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p2-governance.json -- npx vitest run tests/contract/governance-review-dispatch-boundary.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；1→0；evidence=`quality/tests/p2-governance-green.json`。

### Knowledge

保留 non-gate 与 runtime-owned polling；ADR 0025 只解释批准例外。

### STOP

出现第三处治理语义修改或形成统一 budget gate 时停止。

### Done

三个文件边界内精确变更，contract test 为 0。

### Risks and rollback

误扩治理范围；回滚三个文件并保留 RED。

## Phase P3 — 审查预检与可恢复生命周期

### Goal

以一个 consumer seam 完成 FR-REVIEW-001 FR-REVIEW-002 FR-REVIEW-003 FR-REVIEW-004，可由 ORACLE-P3-REVIEW 判真。

### Files

- **NEW**：`tests/review/review-managed-lifecycle.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/review-provider-client.mjs`、`runtime/review/review-record-route.mjs`、`runtime/review/schemas/attempt.schema.json`、`runtime/stage/stage-handlers.mjs`、`tests/final-cutover-guards.red.test.mjs`
- **DO NOT TOUCH**：`skills/wh-review/scripts/review-result-writer.mjs`、`runtime/review/schemas/result.schema.json`、broker provider internals；避免第二 writer/schema/协议。

### Tasks

- RED：增加 ORACLE-P3-REVIEW 失败断言。
- GREEN：最小扩展现有 seam 使同一命令通过。

### Verify

`node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p3-review.json -- npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs tests/review/review-record-route.test.mjs tests/integration/wh-review-v3-broker-contract.test.mjs tests/review/review-managed-lifecycle.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；RED expected_exit=1，GREEN expected_exit=0；oracle=ORACLE-P3-REVIEW；evidence=quality/tests/p3-review.json。

### Knowledge

只消费冻结 spec、前序 GREEN 事实和列出的 existing anchors；质量事实不是工作许可证。

### STOP

需要新 stage/store/gate、修改 DO NOT TOUCH、弱化断言或超出当前 FR/AC 时返回 plan/spec owner。

### Done

同命令 RED→GREEN、全部 AC-REVIEW-000 AC-REVIEW-001 AC-REVIEW-002 AC-REVIEW-003 AC-REVIEW-004 AC-REVIEW-005 有真实断言、证据保留原始退出码。

### Risks and rollback

Affected=AC-REVIEW-000 AC-REVIEW-001 AC-REVIEW-002 AC-REVIEW-003 AC-REVIEW-004 AC-REVIEW-005；风险是扩大控制面；只回滚本 Phase 实现并保留测试与历史事实。

## Phase P4 — 主会话与窄 worker 协调

### Goal

实现 FR-COORD-001..003 的角色/brief/summary/cap 与 telemetry producer；ORACLE-P4-COORD 仅判 AC-COORD-002/003，指标由 P6 判真。

### Files

- **NEW**：N/A — no new file
- **MODIFY**：`tools/host/workflowhub-stage-agent-bridge.mjs`、`runtime/task/material-workspace.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`tests/contract/host-outcome-bridge.test.mjs`
- **DO NOT TOUCH**：`skills/wh-review/scripts/review-result-writer.mjs`、`runtime/review/schemas/result.schema.json`、broker provider internals；避免第二 writer/schema/协议。

### Tasks

- RED：增加 ORACLE-P4-COORD 失败断言。
- GREEN：最小扩展现有 seam 使同一命令通过。

### Verify

`node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p4-coord.json -- npx vitest run tests/contract/host-outcome-bridge.test.mjs tests/contract/material-oracle-context-packet.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；RED expected_exit=1，GREEN expected_exit=0；oracle=ORACLE-P4-COORD；evidence=quality/tests/p4-coord.json。

### Knowledge

只消费冻结 spec、前序 GREEN 事实和列出的 existing anchors；质量事实不是工作许可证。

### STOP

需要新 stage/store/gate、修改 DO NOT TOUCH、弱化断言或超出当前 FR/AC 时返回 plan/spec owner。

### Done

同命令 RED→GREEN、全部 AC-COORD-002 AC-COORD-003 有真实断言、证据保留原始退出码。

### Risks and rollback

Affected=AC-COORD-002 AC-COORD-003；风险是扩大控制面；只回滚本 Phase 实现并保留测试与历史事实。

## Phase P5 — 逐 AC 新鲜度

### Goal

以一个 consumer seam 完成 FR-FRESH-001，可由 ORACLE-P5-FRESH 判真。

### Files

- **NEW**：`tests/contract/per-ac-material-freshness.test.mjs`
- **READ-ONLY CONSUMER**：`tests/integration/verify-freshness-selection.test.mjs`
- **MODIFY**：`runtime/evidence/freshness.mjs`、`runtime/stage/completion-predicates.mjs`
- **DO NOT TOUCH**：`skills/wh-review/scripts/review-result-writer.mjs`、`runtime/review/schemas/result.schema.json`、broker provider internals；避免第二 writer/schema/协议。

### Tasks

- RED：增加 ORACLE-P5-FRESH 失败断言。
- GREEN：最小扩展现有 seam 使同一命令通过。


### Verify

`node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p5-fresh.json -- npx vitest run tests/contract/per-ac-material-freshness.test.mjs tests/integration/verify-freshness-selection.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；RED expected_exit=1，GREEN expected_exit=0；oracle=ORACLE-P5-FRESH；evidence=quality/tests/p5-fresh.json。

### Knowledge

只消费冻结 spec、前序 GREEN 事实和列出的 existing anchors；质量事实不是工作许可证。

### STOP

需要新 stage/store/gate、修改 DO NOT TOUCH、弱化断言或超出当前 FR/AC 时返回 plan/spec owner。

### Done

同命令 RED→GREEN、全部 AC-FRESH-001 AC-FRESH-002 有真实断言、证据保留原始退出码。

### Risks and rollback

Affected=AC-FRESH-001 AC-FRESH-002；风险是扩大控制面；只回滚本 Phase 实现并保留测试与历史事实。

## Phase P6 — 当前 task 本地 aggregate 与缺失边界

### Goal

读取当前认证 task 的 targeted facts，逐 AC 判真本地合同；缺失 host telemetry 显式保持 unavailable，不把本地 aggregate 当真实任务或 live 指标达标。

### Files

- **MODIFY**：`tests/acceptance/workflow-execution-current-task.test.mjs`
- **DO NOT TOUCH**：真实 provider/host task、usage log、fixtures 和 runtime public contract；本地 aggregate 不能伪造 live telemetry。

### Tasks

- T013 FINAL：读取当前 task 的 targeted receipts、源码和材料身份，聚合全部 active AC；对 host telemetry 缺失保留 unavailable。

### Verify

`node tests/acceptance/workflow-execution-current-task.test.mjs`；expected_exit=0；oracle=ORACLE-FINAL-LOCAL；evidence=`stdout JSON + current targeted receipts`。

### Knowledge

n=1/live threshold 不在本地 aggregate 中宣称；host telemetry 缺失必须显式 unavailable。

### STOP

缺任一 active AC、本地 receipt 非零/不可读、材料/源码身份不一致，或有人要求把 unavailable 写成 live pass。

### Done

所有 active AC 都有本地 assertion；缺失 live telemetry 的 AC 明确标记 unavailable，不能扩写成真实任务证据。

### Risks and rollback

误把本地合同当真实运行证据；失败保留原始输出，真实 task/host usage 另行认证，不重派昂贵 provider。

## Phase P3-R — 受认证 route repair 单次预算

### Goal

用既有 review route/budget seam 完成 FR-REVIEW-005，使真实 provider 失败后的实际路由修复可重试一次，同时所有伪修复与非 provider 失败保持阻断。

### Files

- **MODIFY**：`runtime/review/review-record-route.mjs`、`runtime/evidence/stage-content-evidence.mjs`、`tests/review/review-record-route.test.mjs`、`tests/acceptance/workflow-execution-current-task.test.mjs`
- **DO NOT TOUCH**：broker provider internals、review result schema、public command、第二 store/gate；request 不新增 repair assertion。

### Tasks

- T014 RED：增加合格路径与全部负例，确认旧实现不能表达 `route_repair`。
- T015 GREEN：最小扩展 canonical candidate derivation 与 budget validator。
- T016 FINAL：重采当前 targeted receipts/local aggregate，并按当前材料修订发起一次正式 integration review；provider 仍失败时保留 unavailable。

### Verify

RED：`node tools/cli/run-checks.mjs --runtime-profile=inner --evidence-path=quality/tests/p3-route-repair-current.json -- npx vitest run tests/review/review-record-route.test.mjs -t "T014 authenticated route-repair review budget" --poolOptions.forks.singleFork --no-fileParallelism`，expected_exit=1；独立 finding 补测用 `quality/tests/p3-route-repair-findings-red.json` 再形成 4 个目标 RED。最终 GREEN 使用同一 selection/oracle 与 immutable `quality/tests/p3-route-repair-findings-green.json`，expected_exit=0。首次无 `-t` 的整文件试跑被 inner 60s ceiling 终止，保留 `quality/tests/p3-route-repair.json` 作为非目标失败诊断，不计 RED。FINAL 复用 ORACLE-FINAL-LOCAL 并读取新 receipt。

### Knowledge

只信 canonical prior attempt 和宿主当前 route；request 字段、配置 mtime、人工文字说明都不是 repair 证据。phase review 继续按每 material revision 一次。

### STOP

需要新增 public recovery/reopen、放宽到 `provider_attempts=[]`/协议/材料/漂移错误、无法认证 provider 成员或需要第二次同 revision repair 时停止并保留 unavailable。

### Done

AC-REVIEW-006 RED→GREEN；同 revision 合格路径只获得一次预算，所有负例 provider 调用数为 0；最终事实按真实 provider 结果记录。

### Risks and rollback

Affected=AC-REVIEW-006；风险是重复昂贵 provider。回滚 P3-R 生产分支即可恢复严格旧预算；保留 RED/GREEN 与历史 attempts，不改写旧失败。
