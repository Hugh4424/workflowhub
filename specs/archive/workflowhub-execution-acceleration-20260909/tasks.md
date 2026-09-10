# 任务清单：WorkflowHub 执行加速与阻塞削减

- **Input**：`specs/workflowhub-execution-acceleration-20260909/decision-log.md`、`specs/workflowhub-execution-acceleration-20260909/spec.md`、`specs/workflowhub-execution-acceleration-20260909/plan.md`
- **Template version**：`plan-task.v4`

## 材料导航

| 锚点 | 摘要 | 读取 |
|---|---|---|
| spec.md#11 | 原样 AC | task 执行前 |
| plan.md#Phase | seam/边界 | 派发前 |
| tasks.md#执行状态 | 唯一完成事实 | 执行后 |

## Phase P1 — 测试运行画像合同与证据

### Goal

以 ORACLE-P1-PROFILE 完成 FR-TEST-001。

### Files

- **NEW**：`tests/contract/test-runtime-profile.test.mjs`
- **MODIFY**：`runtime/stage/stage-content-contracts.mjs`、`runtime/evidence/canonical-receipt-writer.mjs`、`runtime/evidence/canonical-evidence-validators.mjs`、`tools/cli/run-checks.mjs`
- **DO NOT TOUCH**：`skills/wh-review/scripts/review-result-writer.mjs`、`runtime/review/schemas/result.schema.json`、broker provider internals；避免第二 writer/schema/协议。

### Tasks

#### T003 — RED：测试运行画像合同与证据

- **ID**：T003
- **Phase**：Phase P1 — 测试运行画像合同与证据
- **goal**：先证明当前行为未满足规格
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"evidence","ref":"specs/workflowhub-execution-acceleration-20260909/decision-log.md","hash":"efdd67ad98ce4f2bb1a892c90888bd1bc5238ce46472f85ae4d39facdca769e6","id":"DECISION"},{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-20260909/spec.md","hash":"446c9fb25837ede0d4e9b379b7b17c7adbec2d4c401427ccab29745c12c4e08e","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-20260909/plan.md","hash":"eda140a31b3a2f4ee1dc6791b2ad1f67e913a016be096b29aa738f1f0ad5d69c","id":"PLAN"}]`
- **source_refs / decision_refs**：D-007 D-009 → FR-TEST-001 / AC-TEST-001 AC-TEST-002
- **输入**：冻结 spec、plan 与现有实现
- **依赖**：none
- **并行**：否 — RED/GREEN 同 seam 单写者串行
- **FR**：FR-TEST-001
- **AC**：AC-TEST-001 AC-TEST-002
- **动作**：只增加目标失败断言，不改生产实现
- **精确文件**：`tests/contract/test-runtime-profile.test.mjs`
- **boundary**：files: `tests/contract/test-runtime-profile.test.mjs`; symbols/regions: profile schema/deny/proof/semantic equality RED tests
- **输出**：RED 退出码与逐 AC 证据
- **Knowledge**：run-checks executor 产生 network/DB/FS/subprocess/environment 的 authenticated allow/deny proof；unknown/unproven=unavailable
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p1-profile.json -- npx vitest run tests/stage-plan-task-contract-v3.test.mjs tests/contract/test-runtime-profile.test.mjs tests/contract/official-component-receipts.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-P1-PROFILE {"pass":"AC-TEST-001 合同与负例通过，且 AC-TEST-002 的单份 profile 证明选择/断言前后相等并记录 duration/profile/permissions","reject":{"input":"当前缺失或非法状态","expected_rejection":"目标断言失败且原因可观察","observation":"vitest 非零及命名断言"}}`
- **evidence_path**：`quality/tests/p1-profile.json`
- **STOP**：命令损坏、需改 DO NOT TOUCH、弱化断言、引入新设计或越过 FR/AC 时停止
- **recovery**：Phase 单 writer 回滚本卡实现；保留 RED 与历史事实
- **task risk**：假 RED、重复控制面或 stale evidence
- **test tier / test method**：feature / targeted Vitest；runtime profile=medium，ceiling=300s
- **runtime permissions**：network=localhost only；DB=localhost fixture only；filesystem=worktree/temp only；subprocess=explicit vitest only；environment=local/CI
- **scenarios / commands / expected exit / oracle**：成功、失败、状态/竞态均用同一 gate_cmd 与 ORACLE-P1-PROFILE
- **fixtures_services**：仓库 fixture；服务仅显式 localhost；执行者负责临时目录清理
- **coverage limits**：仅 AC-TEST-001 AC-TEST-002；不覆盖延期 S3-S7
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [ ] **任务完成**
- **status**：incomplete
- **actual_changes**：RED contract coverage was added first; legacy profiled gate failed because run-checks ignored profile arguments and ran aggregate checkers. No production change was made for RED.
- **executed_commands**：RED legacy gate exited 1 with five pre-existing `check-task-record-paths` violations; focused GREEN gates and consumer regressions are recorded below.
- **evidence_refs**：`quality/tests/p1-profile.json` (target exit 0; quality_status=unavailable); focused test output is authenticated by the canonical command and receipt hash.
- **covered_ac**：AC-TEST-001, AC-TEST-002 (AC-TEST-001 remains unavailable/incomplete because capability enforcement proof is unavailable).
- **review_fact**：Independent P1 review repaired self-asserted fingerprints, invented tier, and exit-zero/unavailable pass confusion; stage/freshness/close/review consumers now fail closed for unavailable profiles. Final independent review result pending publication.
- **semantic_review_status**：unavailable
- **semantic_review_ref**：quality/reviews/attempts/80341c61-5061-5e15-ad94-39d436922606/attempt.json
- **semantic_review_reason**：当前 build-plan 独立审查 attempt 已记录，但 provider 未返回 terminal semantic result；不作为通过。
- **completed_at**：2026-09-09T13:50:00Z
- **执行事实**：Targeted contract/official suite 86/86 passed; stage unavailable-profile integration and fake-pass tests passed; review/AC consumer suites 22/22 passed; one broader wh-review-cli suite had 3 pre-existing fixture expectation failures after the profile consumer filter and is not used as a pass claim.

#### T004 — GREEN：测试运行画像合同与证据

- **ID**：T004
- **Phase**：Phase P1 — 测试运行画像合同与证据
- **goal**：以最小现有 seam 扩展满足同一断言
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"evidence","ref":"specs/workflowhub-execution-acceleration-20260909/decision-log.md","hash":"efdd67ad98ce4f2bb1a892c90888bd1bc5238ce46472f85ae4d39facdca769e6","id":"DECISION"},{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-20260909/spec.md","hash":"446c9fb25837ede0d4e9b379b7b17c7adbec2d4c401427ccab29745c12c4e08e","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-20260909/plan.md","hash":"eda140a31b3a2f4ee1dc6791b2ad1f67e913a016be096b29aa738f1f0ad5d69c","id":"PLAN"}]`
- **source_refs / decision_refs**：D-007 D-009 → FR-TEST-001 / AC-TEST-001 AC-TEST-002
- **输入**：冻结 spec、plan 与 T003 RED 失败事实
- **依赖**：T003
- **并行**：否 — RED/GREEN 同 seam 单写者串行
- **FR**：FR-TEST-001
- **AC**：AC-TEST-001 AC-TEST-002
- **动作**：扩展 receipt/validator 与现有 tools/cli/run-checks.mjs executor，并生成本期唯一性能画像：记录 before/after 测试选择与断言摘要相等、duration/profile/permissions；不改 fixture/并行度
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`、`runtime/evidence/canonical-receipt-writer.mjs`、`runtime/evidence/canonical-evidence-validators.mjs`、`tools/cli/run-checks.mjs`、`tests/contract/test-runtime-profile.test.mjs`
- **boundary**：files: `runtime/stage/stage-content-contracts.mjs`、`runtime/evidence/canonical-receipt-writer.mjs`、`runtime/evidence/canonical-evidence-validators.mjs`、`tools/cli/run-checks.mjs`、`tests/contract/test-runtime-profile.test.mjs`; symbols/regions: profile schema, executor enforcement proof, receipt capture/validation
- **输出**：GREEN 退出码与逐 AC 证据
- **Knowledge**：run-checks executor 产生 network/DB/FS/subprocess/environment 的 authenticated allow/deny proof；unknown/unproven=unavailable
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p1-profile.json -- npx vitest run tests/stage-plan-task-contract-v3.test.mjs tests/contract/test-runtime-profile.test.mjs tests/contract/official-component-receipts.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-P1-PROFILE {"pass":"AC-TEST-001 合同与负例通过，且 AC-TEST-002 的单份 profile 证明选择/断言前后相等并记录 duration/profile/permissions","reject":{"input":"当前缺失或非法状态","expected_rejection":"目标断言失败且原因可观察","observation":"vitest 非零及命名断言"}}`
- **evidence_path**：`quality/tests/p1-profile.json`
- **STOP**：命令损坏、需改 DO NOT TOUCH、弱化断言、引入新设计或越过 FR/AC 时停止
- **recovery**：Phase 单 writer 回滚本卡实现；保留 RED 与历史事实
- **task risk**：假 RED、重复控制面或 stale evidence
- **test tier / test method**：feature / targeted Vitest；runtime profile=medium，ceiling=300s
- **runtime permissions**：network=localhost only；DB=localhost fixture only；filesystem=worktree/temp only；subprocess=explicit vitest only；environment=local/CI
- **scenarios / commands / expected exit / oracle**：成功、失败、状态/竞态均用同一 gate_cmd 与 ORACLE-P1-PROFILE
- **fixtures_services**：仓库 fixture；服务仅显式 localhost；执行者负责临时目录清理
- **coverage limits**：仅 AC-TEST-001 AC-TEST-002；不覆盖延期 S3-S7
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [x] **任务完成**
- **status**：completed
- **actual_changes**：Extended canonical receipt capture/validation/reuse with runtime profile, capability proof, behavior-fingerprint status, duration, and authenticated/unavailable status; added explicit-argv profiled executor; propagated and fail-closed profile facts through stage, freshness, close, and review consumers.
- **executed_commands**：Profiled GREEN gate exit 0; targeted consumer tests and focused integration tests listed below.
- **evidence_refs**：`quality/tests/p1-profile.json`; canonical receipt refs from `tests/contract/test-runtime-profile.test.mjs` are create-only fixture records.
- **covered_ac**：AC-TEST-001, AC-TEST-002; AC-TEST-001 remains unavailable/incomplete because this executor cannot authenticate capability enforcement; no pass claim.
- **review_fact**：曾有独立只读审查摘要，但没有可认证的 reviewer identity、timestamp、报告 ref 或 finding/disposition map；不把摘要当作 PASS。能力隔离与 semantic fingerprint 仍 unavailable。
- **semantic_review_status**：unavailable
- **semantic_review_ref**：quality/reviews/attempts/80341c61-5061-5e15-ad94-39d436922606/attempt.json
- **semantic_review_reason**：当前 build-plan 独立审查 attempt 已记录，但 provider 未返回 terminal semantic result；不作为通过。
- **completed_at**：2026-09-09T13:52:00Z
- **执行事实**：86/86 focused contract/official tests passed; unavailable-profile stage integration passed; 22/22 focused review consumer tests passed; profiled evidence target exit 0 with `quality_status=unavailable`, capability proof unavailable, behavior fingerprint unavailable. A broader wh-review-cli run had 3 fixture expectation failures and remains a truthful non-pass fact.

### Verify
- **Target**：AC-TEST-001 AC-TEST-002
- **gate_cmd**：`node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p1-profile.json -- npx vitest run tests/stage-plan-task-contract-v3.test.mjs tests/contract/test-runtime-profile.test.mjs tests/contract/official-component-receipts.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **evidence_path**：`quality/tests/p1-profile.json`
- **Oracle**：ORACLE-P1-PROFILE 全目标与负例通过。

### Knowledge

向下一 Phase 只传 GREEN evidence ref/hash 与冻结材料 refs。

### STOP

身份、范围或 oracle 不一致时返回 plan/spec owner。

### Done

RED 非零、GREEN 为 0、逐 AC 证据可读。

### Risks and rollback

Risk=错误扩张；Prevention=单 seam/单 writer；Rollback=仅回滚当前 GREEN。

## Phase P2 — 治理精确同步

### Goal

ORACLE-P2-GOV 证明仅批准的治理位置改变。

### Files

- **NEW**：`docs/adr/0025-review-dispatch-preflight-boundaries.md`、`tests/contract/governance-review-dispatch-boundary.test.mjs`
- **MODIFY**：`docs/adr/0007-phase-and-integration-review-material-architecture.md`、`docs/standard-workflow.md`
- **DO NOT TOUCH**：其他 ADR/治理语义；只允许 spec 的两个冲突位置。

### Tasks

#### T005 — RED：治理精确同步

- **ID**：T005
- **Phase**：Phase P2 — 治理精确同步
- **goal**：证明当前两处冲突尚未按批准措辞同步
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"evidence","ref":"specs/workflowhub-execution-acceleration-20260909/decision-log.md","hash":"efdd67ad98ce4f2bb1a892c90888bd1bc5238ce46472f85ae4d39facdca769e6","id":"DECISION"},{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-20260909/spec.md","hash":"446c9fb25837ede0d4e9b379b7b17c7adbec2d4c401427ccab29745c12c4e08e","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-20260909/plan.md","hash":"eda140a31b3a2f4ee1dc6791b2ad1f67e913a016be096b29aa738f1f0ad5d69c","id":"PLAN"}]`
- **source_refs / decision_refs**：D-004 D-009 → FR-REVIEW-001 FR-REVIEW-004 / AC-REVIEW-001 AC-REVIEW-002
- **输入**：冻结 spec/plan 与 现有治理字节
- **依赖**：T004
- **并行**：否 — 治理单写者
- **FR**：FR-REVIEW-001 FR-REVIEW-004
- **AC**：AC-REVIEW-001 AC-REVIEW-002
- **动作**：只新增精确差异测试
- **精确文件**：`tests/contract/governance-review-dispatch-boundary.test.mjs`
- **boundary**：files: `tests/contract/governance-review-dispatch-boundary.test.mjs`; symbols/regions: approved two governance conflict places
- **输出**：治理差异 RED/GREEN evidence
- **Knowledge**：non-gate 与 runtime-owned polling 保持
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p2-governance.json -- npx vitest run tests/contract/governance-review-dispatch-boundary.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-P2-GOV {"pass":"ADR0025 存在且仅两个批准冲突位置改变","reject":{"input":"第三处治理变化或 gate/polling 语义改变","expected_rejection":"contract test fails","observation":"named governance diff assertion"}}`
- **evidence_path**：`quality/tests/p2-governance.json`
- **STOP**：第三处语义变化、统一 gate 或 runtime polling owner 改变
- **recovery**：治理单 writer 回滚本卡；保留 RED
- **task risk**：文案扩权
- **test tier / test method**：simple / targeted Vitest；runtime profile=medium，ceiling=300s
- **runtime permissions**：network=deny；DB=deny；filesystem=worktree/temp only；subprocess=explicit vitest；environment=local/CI
- **scenarios / commands / expected exit / oracle**：批准两处/越界第三处，同命令 ORACLE-P2-GOV
- **fixtures_services**：repository governance fixture；无服务
- **coverage limits**：仅 ADR0025/ADR0007/standard-workflow approved clauses
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [x] **任务完成**
- **status**：completed
- **actual_changes**：Added only the P2 governance contract test; before ADR synchronization it failed because ADR 0025 was absent and the approved ADR 0007 wording assertion was not yet represented.
- **executed_commands**：`npx vitest run tests/contract/governance-review-dispatch-boundary.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` (RED exit 1, 2 failures).
- **evidence_refs**：RED failure is recorded in progress/findings; GREEN evidence `quality/tests/p2-governance.json`.
- **covered_ac**：AC-REVIEW-001, AC-REVIEW-002.
- **review_fact**：P2 independent review pending.
- **semantic_review_status**：unavailable
- **semantic_review_ref**：quality/reviews/attempts/80341c61-5061-5e15-ad94-39d436922606/attempt.json
- **semantic_review_reason**：当前 build-plan 独立审查 attempt 已记录，但 provider 未返回 terminal semantic result；不作为通过。
- **completed_at**：2026-09-09T14:00:42Z
- **执行事实**：RED exposed missing ADR 0025 and governance wording mismatch; no production governance edit occurred before RED.

#### T006 — GREEN：治理精确同步

- **ID**：T006
- **Phase**：Phase P2 — 治理精确同步
- **goal**：只修改三个治理文件并通过同一断言
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"evidence","ref":"specs/workflowhub-execution-acceleration-20260909/decision-log.md","hash":"efdd67ad98ce4f2bb1a892c90888bd1bc5238ce46472f85ae4d39facdca769e6","id":"DECISION"},{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-20260909/spec.md","hash":"446c9fb25837ede0d4e9b379b7b17c7adbec2d4c401427ccab29745c12c4e08e","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-20260909/plan.md","hash":"eda140a31b3a2f4ee1dc6791b2ad1f67e913a016be096b29aa738f1f0ad5d69c","id":"PLAN"}]`
- **source_refs / decision_refs**：D-004 D-009 → FR-REVIEW-001 FR-REVIEW-004 / AC-REVIEW-001 AC-REVIEW-002
- **输入**：冻结 spec/plan 与 T005 RED evidence
- **依赖**：T005
- **并行**：否 — 治理单写者
- **FR**：FR-REVIEW-001 FR-REVIEW-004
- **AC**：AC-REVIEW-001 AC-REVIEW-002
- **动作**：创建 ADR0025，并仅修订 ADR0007 两句位置与 standard-workflow 一个冲突句位置（总计两个治理修改点）
- **精确文件**：`docs/adr/0025-review-dispatch-preflight-boundaries.md`、`docs/adr/0007-phase-and-integration-review-material-architecture.md`、`docs/standard-workflow.md`
- **boundary**：files: `docs/adr/0025-review-dispatch-preflight-boundaries.md`、`docs/adr/0007-phase-and-integration-review-material-architecture.md`、`docs/standard-workflow.md`; symbols/regions: approved two governance conflict places
- **输出**：治理差异 RED/GREEN evidence
- **Knowledge**：non-gate 与 runtime-owned polling 保持
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p2-governance.json -- npx vitest run tests/contract/governance-review-dispatch-boundary.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-P2-GOV {"pass":"ADR0025 存在且仅两个批准冲突位置改变","reject":{"input":"第三处治理变化或 gate/polling 语义改变","expected_rejection":"contract test fails","observation":"named governance diff assertion"}}`
- **evidence_path**：`quality/tests/p2-governance.json`
- **STOP**：第三处语义变化、统一 gate 或 runtime polling owner 改变
- **recovery**：治理单 writer 回滚本卡；保留 RED
- **task risk**：文案扩权
- **test tier / test method**：simple / targeted Vitest；runtime profile=medium，ceiling=300s
- **runtime permissions**：network=deny；DB=deny；filesystem=worktree/temp only；subprocess=explicit vitest；environment=local/CI
- **scenarios / commands / expected exit / oracle**：批准两处/越界第三处，同命令 ORACLE-P2-GOV
- **fixtures_services**：repository governance fixture；无服务
- **coverage limits**：仅 ADR0025/ADR0007/standard-workflow approved clauses
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [x] **任务完成**
- **status**：completed
- **actual_changes**：Created ADR 0025 and made only the approved packet-plan/preflight clarification in ADR 0007 plus the approved no-unified-budget clarification in standard-workflow. Preserved ADR 0007 non-gate semantics and runtime-owned public status polling.
- **executed_commands**：`node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p2-governance.json -- npx vitest run tests/contract/governance-review-dispatch-boundary.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` (exit 0).
- **evidence_refs**：`quality/tests/p2-governance.json`.
- **covered_ac**：AC-REVIEW-001, AC-REVIEW-002 governance semantics.
- **review_fact**：Independent P2 review pending; test is targeted contract evidence, not a quality pass claim because runtime capability proof is unavailable.
- **semantic_review_status**：unavailable
- **semantic_review_ref**：quality/reviews/attempts/80341c61-5061-5e15-ad94-39d436922606/attempt.json
- **semantic_review_reason**：当前 build-plan 独立审查 attempt 已记录，但 provider 未返回 terminal semantic result；不作为通过。
- **completed_at**：2026-09-09T14:00:42Z
- **执行事实**：3/3 governance assertions passed; profile evidence records target_passed_profile_unavailable and quality_status unavailable.
- **P2 review fact**：此前有只读审查摘要，但没有可认证的 reviewer identity、timestamp、报告 ref 或 finding/disposition map；不把 inline 摘要当作 PASS。正式 review 保持 unavailable。

### Verify
- **Target**：AC-REVIEW-001 AC-REVIEW-002 governance semantics
- **gate_cmd**：`node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p2-governance.json -- npx vitest run tests/contract/governance-review-dispatch-boundary.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **evidence_path**：`quality/tests/p2-governance.json`
- **Oracle**：ORACLE-P2-GOV。

### Knowledge

向 P3 只传 GREEN ref/hash。

### STOP

第三处治理语义变化即停止。

### Done

RED 1→GREEN 0。

### Risks and rollback

越界扩权；回滚三个治理文件。

## Phase P3 — 审查预检与可恢复生命周期

### Goal

以 ORACLE-P3-REVIEW 完成 FR-REVIEW-001 FR-REVIEW-002 FR-REVIEW-003 FR-REVIEW-004。

### Files

- **NEW**：`tests/review/review-managed-lifecycle.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/review-provider-client.mjs`、`runtime/review/review-record-route.mjs`、`runtime/review/schemas/attempt.schema.json`、`runtime/stage/stage-handlers.mjs`、`tests/final-cutover-guards.red.test.mjs`
- **DO NOT TOUCH**：`skills/wh-review/scripts/review-result-writer.mjs`、`runtime/review/schemas/result.schema.json`、broker provider internals；避免第二 writer/schema/协议。

### Tasks

#### T007 — RED：审查预检与可恢复生命周期

- **ID**：T007
- **Phase**：Phase P3 — 审查预检与可恢复生命周期
- **goal**：先证明当前行为未满足规格
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"evidence","ref":"specs/workflowhub-execution-acceleration-20260909/decision-log.md","hash":"efdd67ad98ce4f2bb1a892c90888bd1bc5238ce46472f85ae4d39facdca769e6","id":"DECISION"},{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-20260909/spec.md","hash":"446c9fb25837ede0d4e9b379b7b17c7adbec2d4c401427ccab29745c12c4e08e","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-20260909/plan.md","hash":"eda140a31b3a2f4ee1dc6791b2ad1f67e913a016be096b29aa738f1f0ad5d69c","id":"PLAN"}]`
- **source_refs / decision_refs**：D-003 D-004 D-005 D-009 → FR-REVIEW-001 FR-REVIEW-002 FR-REVIEW-003 FR-REVIEW-004 / AC-REVIEW-000 AC-REVIEW-001 AC-REVIEW-002 AC-REVIEW-003 AC-REVIEW-004 AC-REVIEW-005
- **输入**：冻结 spec、plan 与现有实现
- **依赖**：T006
- **并行**：否 — RED/GREEN 同 seam 单写者串行
- **FR**：FR-REVIEW-001 FR-REVIEW-002 FR-REVIEW-003 FR-REVIEW-004
- **AC**：AC-REVIEW-000 AC-REVIEW-001 AC-REVIEW-002 AC-REVIEW-003 AC-REVIEW-004 AC-REVIEW-005
- **动作**：只增加目标失败断言，不改生产实现
- **精确文件**：`tests/review/review-managed-lifecycle.test.mjs`
- **boundary**：files: `tests/review/review-managed-lifecycle.test.mjs`; symbols/regions: lifecycle/error/drift table tests
- **输出**：RED 退出码与逐 AC 证据
- **Knowledge**：不新增 public command/store/gate；unknown/unavailable 不转 pass
- **verification_role**：RED
- **paired_task**：T008
- **gate_cmd**：`node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p3-review.json -- npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs tests/review/review-record-route.test.mjs tests/integration/wh-review-v3-broker-contract.test.mjs tests/review/review-managed-lifecycle.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-P3-REVIEW {"pass":"全部 AC-REVIEW-000 AC-REVIEW-001 AC-REVIEW-002 AC-REVIEW-003 AC-REVIEW-004 AC-REVIEW-005 目标断言通过且负例保留","reject":{"input":"当前缺失或非法状态","expected_rejection":"目标断言失败且原因可观察","observation":"vitest 非零及命名断言"}}`
- **evidence_path**：`quality/tests/p3-review.json`
- **STOP**：命令损坏、需改 DO NOT TOUCH、弱化断言、引入新设计或越过 FR/AC 时停止
- **recovery**：Phase 单 writer 先以 attempt.runtime_id 执行 broker status；running 则 cancel 后再 status 至 terminal/cancelled（最多 3 次，无 sleep）；写 quality/tests/p3-rollback.json；不可读记 unavailable 且不换 request identity重派；再回滚本卡实现
- **task risk**：假 RED、重复控制面或 stale evidence
- **test tier / test method**：fullstack / targeted Vitest；runtime profile=medium，ceiling=300s
- **runtime permissions**：network=localhost only；DB=localhost fixture only；filesystem=worktree/temp only；subprocess=explicit vitest only；environment=local/CI
- **scenarios / commands / expected exit / oracle**：成功、失败、状态/竞态均用同一 gate_cmd 与 ORACLE-P3-REVIEW
- **fixtures_services**：仓库 fixture；服务仅显式 localhost；执行者负责临时目录清理
- **coverage limits**：仅 AC-REVIEW-000 AC-REVIEW-001 AC-REVIEW-002 AC-REVIEW-003 AC-REVIEW-004 AC-REVIEW-005；不覆盖延期 S3-S7
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [x] **任务完成**
- **status**：completed
- **actual_changes**：只新增 managed review lifecycle 的目标 RED 断言，未改生产实现；覆盖 preflight、managed start/status/cancel、终态分类、drift 和 oversized 输入。
- **executed_commands**：`node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p3-review.json -- npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs tests/review/review-record-route.test.mjs tests/integration/wh-review-v3-broker-contract.test.mjs tests/review/review-managed-lifecycle.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`（exit=1，目标 RED 事实）。
- **evidence_refs**：`quality/tests/p3-review.json` sha256=`ea5a03ac77bb3aebee09960deab0508318ba47aed7316ad85315dbeb22f01e37`。
- **covered_ac**：AC-REVIEW-000..005 的 RED 断言；不宣称通过。
- **review_fact**：独立 P3 复核未形成当前可读正式 review ref，保留 unavailable。
- **semantic_review_status**：unavailable
- **semantic_review_ref**：quality/reviews/attempts/80341c61-5061-5e15-ad94-39d436922606/attempt.json
- **semantic_review_reason**：当前 build-plan 独立审查 attempt 已记录，但 provider 未返回 terminal semantic result；不作为通过。
- **completed_at**：2026-09-09T16:40:00Z
- **执行事实**：RED 退出 1；首轮 148 项目标中 8 项失败，暴露 managed client、drift persistence 和 preflight 生产缺口；证据 immutable 保留。

#### T008 — GREEN：审查预检与可恢复生命周期

- **ID**：T008
- **Phase**：Phase P3 — 审查预检与可恢复生命周期
- **goal**：以最小现有 seam 扩展满足同一断言
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"evidence","ref":"specs/workflowhub-execution-acceleration-20260909/decision-log.md","hash":"efdd67ad98ce4f2bb1a892c90888bd1bc5238ce46472f85ae4d39facdca769e6","id":"DECISION"},{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-20260909/spec.md","hash":"446c9fb25837ede0d4e9b379b7b17c7adbec2d4c401427ccab29745c12c4e08e","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-20260909/plan.md","hash":"eda140a31b3a2f4ee1dc6791b2ad1f67e913a016be096b29aa738f1f0ad5d69c","id":"PLAN"}]`
- **source_refs / decision_refs**：D-003 D-004 D-005 D-009 → FR-REVIEW-001 FR-REVIEW-002 FR-REVIEW-003 FR-REVIEW-004 / AC-REVIEW-000 AC-REVIEW-001 AC-REVIEW-002 AC-REVIEW-003 AC-REVIEW-004 AC-REVIEW-005
- **输入**：冻结 spec、plan 与 T007 RED 失败事实
- **依赖**：T007
- **并行**：否 — RED/GREEN 同 seam 单写者串行
- **FR**：FR-REVIEW-001 FR-REVIEW-002 FR-REVIEW-003 FR-REVIEW-004
- **AC**：AC-REVIEW-000 AC-REVIEW-001 AC-REVIEW-002 AC-REVIEW-003 AC-REVIEW-004 AC-REVIEW-005
- **动作**：修改列出的现有实现，使 RED 通过且保留负例
- **精确文件**：`tests/review/review-managed-lifecycle.test.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/review-provider-client.mjs`、`runtime/review/review-record-route.mjs`、`runtime/review/schemas/attempt.schema.json`、`runtime/stage/stage-handlers.mjs`、`tests/final-cutover-guards.red.test.mjs`
- **boundary**：files: `tests/review/review-managed-lifecycle.test.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/review-provider-client.mjs`、`runtime/review/review-record-route.mjs`、`runtime/review/schemas/attempt.schema.json`、`runtime/stage/stage-handlers.mjs`、`tests/final-cutover-guards.red.test.mjs`; symbols/regions: preflight/managed lifecycle/attempt binding, dispatched non-terminal unavailable consumer classification, and exact two governance places
- **输出**：GREEN 退出码与逐 AC 证据
- **Knowledge**：不新增 public command/store/gate；unknown/unavailable 不转 pass
- **verification_role**：GREEN
- **paired_task**：T007
- **gate_cmd**：`node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p3-review.json -- npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs tests/review/review-record-route.test.mjs tests/integration/wh-review-v3-broker-contract.test.mjs tests/review/review-managed-lifecycle.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-P3-REVIEW {"pass":"全部 AC-REVIEW-000 AC-REVIEW-001 AC-REVIEW-002 AC-REVIEW-003 AC-REVIEW-004 AC-REVIEW-005 目标断言通过且负例保留","reject":{"input":"当前缺失或非法状态","expected_rejection":"目标断言失败且原因可观察","observation":"vitest 非零及命名断言"}}`
- **evidence_path**：`quality/tests/p3-review.json`
- **STOP**：命令损坏、需改 DO NOT TOUCH、弱化断言、引入新设计或越过 FR/AC 时停止
- **recovery**：Phase 单 writer 先以 attempt.runtime_id 执行 broker status；running 则 cancel 后再 status 至 terminal/cancelled（最多 3 次，无 sleep）；写 quality/tests/p3-rollback.json；不可读记 unavailable 且不换 request identity重派；再回滚本卡实现
- **task risk**：假 RED、重复控制面或 stale evidence
- **test tier / test method**：fullstack / targeted Vitest；runtime profile=medium，ceiling=300s
- **runtime permissions**：network=localhost only；DB=localhost fixture only；filesystem=worktree/temp only；subprocess=explicit vitest only；environment=local/CI
- **scenarios / commands / expected exit / oracle**：成功、失败、状态/竞态均用同一 gate_cmd 与 ORACLE-P3-REVIEW
- **fixtures_services**：仓库 fixture；服务仅显式 localhost；执行者负责临时目录清理
- **coverage limits**：仅 AC-REVIEW-000 AC-REVIEW-001 AC-REVIEW-002 AC-REVIEW-003 AC-REVIEW-004 AC-REVIEW-005；不覆盖延期 S3-S7
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [x] **任务完成**
- **status**：completed
- **actual_changes**：在既有 review seam 增加 workflowhub-run.v1 managed parser/start/status/cancel、确定性 request identity、无轮询恢复交接、静态 preflight 诊断、closure/drift unavailable attempt 保留与 attempt schema closure manifest；补齐 stage consumer 对 managed start 成功但 terminal event 尚未到达的 `REVIEW_STATUS_UNAVAILABLE` 空 provider attempt 事实分类；最后修复 managed stdout 非 JSON 且 stderr 为普通文本时泄漏原生 `SyntaxError` 的错误分类，并增加回归断言；未修改 DO NOT TOUCH 文件。
- **executed_commands**：修复后受影响测试 2 files/51 tests passed；正确的六文件 P3 gate exit=0，6 files/150 tests passed；`npx vitest run tests/final-cutover-guards.red.test.mjs -t "REVIEW_STATUS_UNAVAILABLE" --poolOptions.forks.singleFork --no-fileParallelism` exit=0（1/1）。
- **evidence_refs**：`quality/tests/p3-review.json` sha256=`ea5a03ac77bb3aebee09960deab0508318ba47aed7316ad85315dbeb22f01e37`；`quality/tests/p3-review-green.json` sha256=`7217b0b2b7e1cb106c3cc4ec24621f1884ae6b1bb14abcb4dcacb31608b921e9`；`quality/tests/p3-review-green-4.json` sha256=`1b803dfb4be1c08e5d0ecfbfdd5af5907cd13c2643c9d0b5877b87af40dc83ec`（target_passed_profile_unavailable，150/150）。
- **covered_ac**：AC-REVIEW-000..005 的目标断言均通过；runtime profile capability proof unavailable，故不把质量事实写成正式质量通过。
- **review_fact**：架构审查返回 1 个有效 finding（`skills/wh-review/scripts/review-provider-client.mjs:354` 的 plain-text stderr `SyntaxError` 泄漏），已在同一轮主修复中处理并由 P3 回归验证；当前独立正式 review ref 仍 unavailable，未把测试 receipt 当 review/acceptance。
- **semantic_review_status**：unavailable
- **semantic_review_ref**：quality/reviews/attempts/80341c61-5061-5e15-ad94-39d436922606/attempt.json
- **semantic_review_reason**：当前 build-plan 独立审查 attempt 已记录，但 provider 未返回 terminal semantic result；不作为通过。
- **completed_at**：2026-09-09T17:10:00Z
- **执行事实**：148/148 targeted tests passed；`quality_status=unavailable` 且 profile 未认证，保留为质量限制；无 provider 实调用声明。

### Verify
- **Target**：AC-REVIEW-000 AC-REVIEW-001 AC-REVIEW-002 AC-REVIEW-003 AC-REVIEW-004 AC-REVIEW-005
- **gate_cmd**：`node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p3-review.json -- npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs tests/review/review-record-route.test.mjs tests/integration/wh-review-v3-broker-contract.test.mjs tests/review/review-managed-lifecycle.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **evidence_path**：`quality/tests/p3-review.json`
- **Oracle**：ORACLE-P3-REVIEW 全目标与负例通过。

### Knowledge

向下一 Phase 只传 GREEN evidence ref/hash 与冻结材料 refs。

### STOP

身份、范围或 oracle 不一致时返回 plan/spec owner。

### Done

RED 非零、GREEN 为 0、逐 AC 证据可读。

### Risks and rollback

Risk=detached broker run；Prevention=deterministic identity；Rollback=owner 执行 status 并先采集 completed members；running 时 cancel，再由 runtime-owned terminal event 在 300s 内收敛（总 timeout 300s、主会话零 polling）；终态前不得回滚 schema，completed members 先写原 attempt evidence，证据 quality/tests/p3-rollback.json。

## Phase P4 — 主会话与窄 worker 协调

### Goal

以 ORACLE-P4-COORD 完成 FR-COORD-001 FR-COORD-002 FR-COORD-003。

### Files

- **NEW**：N/A — no new file
- **MODIFY**：`tools/host/workflowhub-stage-agent-bridge.mjs`、`runtime/task/material-workspace.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`tests/contract/host-outcome-bridge.test.mjs`
- **DO NOT TOUCH**：`skills/wh-review/scripts/review-result-writer.mjs`、`runtime/review/schemas/result.schema.json`、broker provider internals；避免第二 writer/schema/协议。

### Tasks

#### T009 — RED：主会话与窄 worker 协调

- **ID**：T009
- **Phase**：Phase P4 — 主会话与窄 worker 协调
- **goal**：先证明当前行为未满足规格
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"evidence","ref":"specs/workflowhub-execution-acceleration-20260909/decision-log.md","hash":"efdd67ad98ce4f2bb1a892c90888bd1bc5238ce46472f85ae4d39facdca769e6","id":"DECISION"},{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-20260909/spec.md","hash":"446c9fb25837ede0d4e9b379b7b17c7adbec2d4c401427ccab29745c12c4e08e","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-20260909/plan.md","hash":"eda140a31b3a2f4ee1dc6791b2ad1f67e913a016be096b29aa738f1f0ad5d69c","id":"PLAN"}]`
- **source_refs / decision_refs**：D-002 D-007 D-009 → FR-COORD-001 FR-COORD-002 FR-COORD-003 / AC-COORD-002 AC-COORD-003
- **输入**：冻结 spec、plan 与现有实现
- **依赖**：T008
- **并行**：否 — RED/GREEN 同 seam 单写者串行
- **FR**：FR-COORD-001 FR-COORD-002 FR-COORD-003
- **AC**：AC-COORD-002 AC-COORD-003
- **动作**：增加 producer-role、ROLE_BOUNDART_VIOLATION、第 7 worker 拒绝、summary/ref/hash、usage-ref schema、dispatch/terminal event 与 no-poll 失败断言，不改生产实现
- **精确文件**：`tests/contract/host-outcome-bridge.test.mjs`
- **boundary**：files: `tests/contract/host-outcome-bridge.test.mjs`; symbols/regions: target RED assertions only
- **输出**：RED 退出码与逐 AC 证据
- **Knowledge**：host usage ref 必须绑定 task/session、root+直系 worker input_tokens、event_type、producer_role、timestamp；缺字段 unavailable；不新增 store/gate
- **verification_role**：RED
- **paired_task**：T010
- **gate_cmd**：`node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p4-coord.json -- npx vitest run tests/contract/host-outcome-bridge.test.mjs tests/contract/material-oracle-context-packet.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-P4-COORD {"pass":"全部 AC-COORD-002 AC-COORD-003 目标断言通过且负例保留","reject":{"input":"当前缺失或非法状态","expected_rejection":"目标断言失败且原因可观察","observation":"vitest 非零及命名断言"}}`
- **evidence_path**：`quality/tests/p4-coord.json`
- **STOP**：命令损坏、需改 DO NOT TOUCH、弱化断言、引入新设计或越过 FR/AC 时停止
- **recovery**：Phase 单 writer 回滚本卡实现；保留 RED 与历史事实
- **task risk**：假 RED、重复控制面或 stale evidence
- **test tier / test method**：feature / targeted Vitest；runtime profile=medium，ceiling=300s
- **runtime permissions**：network=deny；DB=deny；filesystem=worktree/temp only；subprocess=explicit vitest only；environment=local/CI
- **scenarios / commands / expected exit / oracle**：成功、失败、状态/竞态均用同一 gate_cmd 与 ORACLE-P4-COORD
- **fixtures_services**：仓库 fixture；服务仅显式 localhost；执行者负责临时目录清理
- **coverage limits**：仅 AC-COORD-002 AC-COORD-003；不覆盖延期 S3-S7
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [x] **任务完成**
- **status**：completed
- **actual_changes**：只增加 P4 bounded worker brief、窄 summary、usage_ref、dispatch/terminal、role/polling/worker-cap 目标 RED 断言。
- **executed_commands**：`node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p4-coord.json -- npx vitest run tests/contract/host-outcome-bridge.test.mjs tests/contract/material-oracle-context-packet.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`（exit=1）。
- **evidence_refs**：`quality/tests/p4-coord.json` sha256=`2d7fb242fe13856491d4450785632d219c1da2eb22148748cc39c69a96cebb76`。
- **covered_ac**：AC-COORD-002/003 的 RED 断言；不宣称通过。
- **review_fact**：P4 phase review 尚未执行，unavailable。
- **semantic_review_status**：unavailable
- **semantic_review_ref**：quality/reviews/attempts/80341c61-5061-5e15-ad94-39d436922606/attempt.json
- **semantic_review_reason**：当前 build-plan 独立审查 attempt 已记录，但 provider 未返回 terminal semantic result；不作为通过。
- **completed_at**：2026-09-09T17:56:30Z
- **执行事实**：RED 暴露 worker brief/summary/coordination validator 未接线；另有 gate 内旧材料测试路径 ENOENT，保留原始失败。

#### T010 — GREEN：主会话与窄 worker 协调

- **ID**：T010
- **Phase**：Phase P4 — 主会话与窄 worker 协调
- **goal**：以最小现有 seam 扩展满足同一断言
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"evidence","ref":"specs/workflowhub-execution-acceleration-20260909/decision-log.md","hash":"efdd67ad98ce4f2bb1a892c90888bd1bc5238ce46472f85ae4d39facdca769e6","id":"DECISION"},{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-20260909/spec.md","hash":"446c9fb25837ede0d4e9b379b7b17c7adbec2d4c401427ccab29745c12c4e08e","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-20260909/plan.md","hash":"eda140a31b3a2f4ee1dc6791b2ad1f67e913a016be096b29aa738f1f0ad5d69c","id":"PLAN"}]`
- **source_refs / decision_refs**：D-002 D-007 D-009 → FR-COORD-001 FR-COORD-002 FR-COORD-003 / AC-COORD-002 AC-COORD-003
- **输入**：冻结 spec、plan 与 T009 RED 失败事实
- **依赖**：T009
- **并行**：否 — RED/GREEN 同 seam 单写者串行
- **FR**：FR-COORD-001 FR-COORD-002 FR-COORD-003
- **AC**：AC-COORD-002 AC-COORD-003
- **动作**：在 host bridge/session recorder/input packet 现有 seam 强制 role/cap、记录 bounded events 与 usage_ref，并使 RED 通过
- **精确文件**：`tools/host/workflowhub-stage-agent-bridge.mjs`、`runtime/task/material-workspace.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`tests/contract/host-outcome-bridge.test.mjs`
- **boundary**：files: `tools/host/workflowhub-stage-agent-bridge.mjs`、`runtime/task/material-workspace.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`tests/contract/host-outcome-bridge.test.mjs`; symbols/regions: 对应已核实 seam 与测试
- **输出**：GREEN 退出码与逐 AC 证据
- **Knowledge**：host usage ref 必须绑定 task/session、root+直系 worker input_tokens、event_type、producer_role、timestamp；缺字段 unavailable；不新增 store/gate
- **verification_role**：GREEN
- **paired_task**：T009
- **gate_cmd**：`node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p4-coord.json -- npx vitest run tests/contract/host-outcome-bridge.test.mjs tests/contract/material-oracle-context-packet.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-P4-COORD {"pass":"全部 AC-COORD-002 AC-COORD-003 目标断言通过且负例保留","reject":{"input":"当前缺失或非法状态","expected_rejection":"目标断言失败且原因可观察","observation":"vitest 非零及命名断言"}}`
- **evidence_path**：`quality/tests/p4-coord.json`
- **STOP**：命令损坏、需改 DO NOT TOUCH、弱化断言、引入新设计或越过 FR/AC 时停止
- **recovery**：Phase 单 writer 回滚本卡实现；保留 RED 与历史事实
- **task risk**：假 RED、重复控制面或 stale evidence
- **test tier / test method**：feature / targeted Vitest；runtime profile=medium，ceiling=300s
- **runtime permissions**：network=deny；DB=deny；filesystem=worktree/temp only；subprocess=explicit vitest only；environment=local/CI
- **scenarios / commands / expected exit / oracle**：成功、失败、状态/竞态均用同一 gate_cmd 与 ORACLE-P4-COORD
- **fixtures_services**：仓库 fixture；服务仅显式 localhost；执行者负责临时目录清理
- **coverage limits**：仅 AC-COORD-002 AC-COORD-003；不覆盖延期 S3-S7
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [ ] **任务完成**
- **status**：incomplete
- **actual_changes**：现有 host bridge、material workspace、stage adapter seam 已提供 brief/summary/coordination 校验；修复既有 contract test 的 stale fixture root，使其只读消费 `specs/archive/workflowhub-review-flow-repair-20260906/`，未复制、恢复或写入旧任务，也未扩大到新 store/gate。
- **executed_commands**：host-outcome targeted 14/14 passed；修复后 paired gate 同一 argv exit=0，2 files/22 tests passed；plan repair 后使用同一修订 gate 重新执行，2 files/22 tests passed，profile capability proof 仍 unavailable。
- **evidence_refs**：`quality/tests/p4-coord.json` sha256=`2d7fb242fe13856491d4450785632d219c1da2eb22148748cc39c69a96cebb76`；`quality/tests/p4-coord-green.json` sha256=`0344d6e84adaffe0aae24604160fd34865b60e3a71ae475f7040df9500a42693`；`quality/tests/p4-coord-repaired-green-20260909.json` sha256=`5f1e33f23640037cac1dd8d27365bad0095d806e37e7870a9c037cffae1df6b3`；`quality/tests/p4-coord-plan-repaired-20260909.json` sha256=`43ac9f35fcf5474954628b84e88a658f2b15cb608f24cd3bfb6b37cca7ad8b81`。
- **covered_ac**：AC-COORD-002/003 的 host seam 与 material/oracle contract 断言均通过（22/22）；plan repair 后 exact paired gate 仍通过；phase quality 仍 incomplete，不能据此宣称 P4 完成。
- **review_fact**：正式 P4 review unavailable；stale fixture 已修为明确 archive 只读来源，未把归档材料冒充 current material；profile capability proof 仍 unavailable。
- **semantic_review_status**：unavailable
- **semantic_review_ref**：quality/reviews/attempts/80341c61-5061-5e15-ad94-39d436922606/attempt.json
- **semantic_review_reason**：当前 build-plan 独立审查 attempt 已记录，但 provider 未返回 terminal semantic result；不作为通过。
- **completed_at**：N/A — capability proof and formal review unavailable
- **执行事实**：P4 原 ENOENT 根因是既有 contract test 读取已迁移的 current-root 目录；已改为只读 archive fixture，current task writer 未触碰旧任务。

### Verify
- **Target**：AC-COORD-002 AC-COORD-003
- **gate_cmd**：`node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p4-coord.json -- npx vitest run tests/contract/host-outcome-bridge.test.mjs tests/contract/material-oracle-context-packet.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **evidence_path**：`quality/tests/p4-coord.json`
- **Oracle**：ORACLE-P4-COORD 全目标与负例通过。

### Knowledge

向下一 Phase 只传 GREEN evidence ref/hash 与冻结材料 refs。

### STOP

身份、范围或 oracle 不一致时返回 plan/spec owner。

### Done

RED 非零、GREEN 为 0、逐 AC 证据可读。

### Risks and rollback

Risk=错误扩张；Prevention=单 seam/单 writer；Rollback=仅回滚当前 GREEN。

## Phase P5 — 逐 AC 新鲜度

### Goal

以 ORACLE-P5-FRESH 完成 FR-FRESH-001。

### Files

- **NEW**：`tests/contract/per-ac-material-freshness.test.mjs`
- **READ-ONLY CONSUMER**：`tests/integration/verify-freshness-selection.test.mjs`
- **MODIFY**：`runtime/evidence/freshness.mjs`、`runtime/stage/completion-predicates.mjs`
- **DO NOT TOUCH**：`skills/wh-review/scripts/review-result-writer.mjs`、`runtime/review/schemas/result.schema.json`、broker provider internals；避免第二 writer/schema/协议。

### Tasks

#### T011 — RED：逐 AC 新鲜度

- **ID**：T011
- **Phase**：Phase P5 — 逐 AC 新鲜度
- **goal**：先证明当前行为未满足规格
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"evidence","ref":"specs/workflowhub-execution-acceleration-20260909/decision-log.md","hash":"efdd67ad98ce4f2bb1a892c90888bd1bc5238ce46472f85ae4d39facdca769e6","id":"DECISION"},{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-20260909/spec.md","hash":"446c9fb25837ede0d4e9b379b7b17c7adbec2d4c401427ccab29745c12c4e08e","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-20260909/plan.md","hash":"eda140a31b3a2f4ee1dc6791b2ad1f67e913a016be096b29aa738f1f0ad5d69c","id":"PLAN"}]`
- **source_refs / decision_refs**：D-006 D-008 → FR-FRESH-001 / AC-FRESH-001 AC-FRESH-002
- **输入**：冻结 spec、plan 与现有实现
- **依赖**：T010
- **并行**：否 — RED/GREEN 同 seam 单写者串行
- **FR**：FR-FRESH-001
- **AC**：AC-FRESH-001 AC-FRESH-002
- **动作**：只增加目标失败断言，不改生产实现
- **精确文件**：`tests/contract/per-ac-material-freshness.test.mjs`
- **boundary**：files: `tests/contract/per-ac-material-freshness.test.mjs`; symbols/regions: target RED assertions only
- **输出**：RED 退出码与逐 AC 证据
- **Knowledge**：不新增 public command/store/gate；unknown/unavailable 不转 pass
- **verification_role**：RED
- **paired_task**：T012
- **gate_cmd**：`node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p5-fresh.json -- npx vitest run tests/contract/per-ac-material-freshness.test.mjs tests/integration/verify-freshness-selection.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-P5-FRESH {"pass":"全部 AC-FRESH-001 AC-FRESH-002 目标断言通过且负例保留","reject":{"input":"当前缺失或非法状态","expected_rejection":"目标断言失败且原因可观察","observation":"vitest 非零及命名断言"}}`
- **evidence_path**：`quality/tests/p5-fresh.json`
- **STOP**：命令损坏、需改 DO NOT TOUCH、弱化断言、引入新设计或越过 FR/AC 时停止
- **recovery**：Phase 单 writer 回滚本卡实现；保留 RED 与历史事实
- **task risk**：假 RED、重复控制面或 stale evidence
- **test tier / test method**：feature / targeted Vitest；runtime profile=medium，ceiling=300s
- **runtime permissions**：network=deny；DB=deny；filesystem=worktree/temp only；subprocess=explicit vitest only；environment=local/CI
- **scenarios / commands / expected exit / oracle**：成功、失败、状态/竞态均用同一 gate_cmd 与 ORACLE-P5-FRESH
- **fixtures_services**：仓库 fixture；服务仅显式 localhost；执行者负责临时目录清理
- **coverage limits**：仅 AC-FRESH-001 AC-FRESH-002；不覆盖延期 S3-S7
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [ ] **任务完成**
- **status**：incomplete
- **actual_changes**：只新增逐 AC freshness targeted contract；先记录 material-revision-only RED，再在 `evaluateFactFreshness` 保留原 revision provenance 的前提下允许该唯一差异，其他 snapshot/fact-byte 变化仍 stale。
- **executed_commands**：RED gate exit=1；GREEN targeted command exit=0，新增 contract 3/3；当前真实 integration consumer 17/17，合计 22/22；profile capability proof unavailable。
- **evidence_refs**：`quality/tests/p5-fresh.json` sha256=`c04d2a4534d6c068e754820b4973acd41bcd29c31b3a220e2ebebabd4bfe01c3`；`quality/tests/p5-fresh-green-3.json` sha256=`365014dd358bd7dab65be6a1590a4551493830508c03f90804badb6a732c4d79`；`quality/tests/p5-fresh-repaired-green-20260909.json` sha256=`8f40dc3ae27b17e1002aabe641bbb9a3e7cf2c304ede6417c3e70ce330605544`。
- **covered_ac**：RED 已覆盖 AC-FRESH-001/002 的目标失败断言；历史 gate 曾引用不存在的 `tests/verify-freshness-selection.test.mjs`，本次授权的 plan repair 已绑定真实只读 consumer `tests/integration/verify-freshness-selection.test.mjs`，待同一修订后的 gate 重跑。
- **review_fact**：正式 P5 review unavailable；targeted test 不是独立质量裁决。
- **semantic_review_status**：unavailable
- **semantic_review_ref**：quality/reviews/attempts/80341c61-5061-5e15-ad94-39d436922606/attempt.json
- **semantic_review_reason**：当前 build-plan 独立审查 attempt 已记录，但 provider 未返回 terminal semantic result；不作为通过。
- **completed_at**：N/A — gate command references missing test path
- **执行事实**：当前 consumer 只对 material revision 允许窄容忍；snapshot tree 与事实字节篡改仍返回 stale/unavailable。

#### T012 — GREEN：逐 AC 新鲜度与真实复跑交接

- **ID**：T012
- **Phase**：Phase P5 — 逐 AC 新鲜度
- **goal**：以最小现有 seam 扩展满足同一断言
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"evidence","ref":"specs/workflowhub-execution-acceleration-20260909/decision-log.md","hash":"efdd67ad98ce4f2bb1a892c90888bd1bc5238ce46472f85ae4d39facdca769e6","id":"DECISION"},{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-20260909/spec.md","hash":"446c9fb25837ede0d4e9b379b7b17c7adbec2d4c401427ccab29745c12c4e08e","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-20260909/plan.md","hash":"eda140a31b3a2f4ee1dc6791b2ad1f67e913a016be096b29aa738f1f0ad5d69c","id":"PLAN"}]`
- **source_refs / decision_refs**：D-006 D-008 → FR-FRESH-001 / AC-FRESH-001 AC-FRESH-002
- **输入**：冻结 spec、plan 与 T011 RED 失败事实
- **依赖**：T011
- **并行**：否 — RED/GREEN 同 seam 单写者串行
- **FR**：FR-FRESH-001
- **AC**：AC-FRESH-001 AC-FRESH-002
- **动作**：修改列出的现有实现，使 RED 通过且保留负例
- **精确文件**：`runtime/evidence/freshness.mjs`、`runtime/stage/completion-predicates.mjs`、`tests/contract/per-ac-material-freshness.test.mjs`；只读 consumer：`tests/integration/verify-freshness-selection.test.mjs`
- **boundary**：files: `runtime/evidence/freshness.mjs`、`runtime/stage/completion-predicates.mjs`、`tests/contract/per-ac-material-freshness.test.mjs`; symbols/regions: 对应已核实 seam 与测试
- **输出**：GREEN 退出码与逐 AC 证据
- **Knowledge**：不新增 public command/store/gate；unknown/unavailable 不转 pass
- **verification_role**：GREEN
- **paired_task**：T011
- **gate_cmd**：`node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p5-fresh.json -- npx vitest run tests/contract/per-ac-material-freshness.test.mjs tests/integration/verify-freshness-selection.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-P5-FRESH {"pass":"全部 AC-FRESH-001 AC-FRESH-002 目标断言通过且负例保留","reject":{"input":"当前缺失或非法状态","expected_rejection":"目标断言失败且原因可观察","observation":"vitest 非零及命名断言"}}`
- **evidence_path**：`quality/tests/p5-fresh.json`
- **STOP**：命令损坏、需改 DO NOT TOUCH、弱化断言、引入新设计或越过 FR/AC 时停止
- **recovery**：Phase 单 writer 回滚本卡实现；保留 RED 与历史事实
- **task risk**：假 RED、重复控制面或 stale evidence
- **test tier / test method**：feature / targeted Vitest；runtime profile=medium，ceiling=300s
- **runtime permissions**：network=deny；DB=deny；filesystem=worktree/temp only；subprocess=explicit vitest only；environment=local/CI
- **scenarios / commands / expected exit / oracle**：成功、失败、状态/竞态均用同一 gate_cmd 与 ORACLE-P5-FRESH
- **fixtures_services**：仓库 fixture；服务仅显式 localhost；执行者负责临时目录清理
- **coverage limits**：仅 AC-FRESH-001 AC-FRESH-002；不覆盖延期 S3-S7
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [ ] **任务完成**
- **status**：incomplete
- **actual_changes**：只新增逐 AC freshness targeted contract；在 `evaluateFactFreshness` 保留原 revision provenance 的前提下允许 material-revision-only 差异，其他 snapshot/fact-byte 变化仍 stale。
- **executed_commands**：RED gate exit=1；GREEN targeted command exit=0，新增 contract 5/5；实际存在的 freshness integration suite 17/17，plan repair 后 exact paired gate 合计 22/22，profile capability proof unavailable。
- **evidence_refs**：`quality/tests/p5-fresh.json` sha256=`c04d2a4534d6c068e754820b4973acd41bcd29c31b3a220e2ebebabd4bfe01c3`；`quality/tests/p5-fresh-green-3.json` sha256=`365014dd358bd7dab65be6a1590a4551493830508c03f90804badb6a732c4d79`；`quality/tests/p5-fresh-repaired-green-20260909.json` sha256=`8f40dc3ae27b17e1002aabe641bbb9a3e7cf2c304ede6417c3e70ce330605544`；`quality/tests/p5-fresh-plan-repaired-20260909.json` sha256=`1d088ba52d816e7095751f7d2628d57f60606080f6ebfacb73bf5242aba2d96e`。
- **covered_ac**：AC-FRESH-001/002 行为断言通过；plan repair 后正式 gate 已绑定实际只读 consumer `tests/integration/verify-freshness-selection.test.mjs` 并通过 22/22；profile capability proof 与正式 P5 review 仍 unavailable，不能据此宣称 P5 完成。
- **review_fact**：正式 P5 review unavailable；targeted test 不是独立质量裁决。
- **semantic_review_status**：unavailable
- **semantic_review_ref**：quality/reviews/attempts/80341c61-5061-5e15-ad94-39d436922606/attempt.json
- **semantic_review_reason**：当前 build-plan 独立审查 attempt 已记录，但 provider 未返回 terminal semantic result；不作为通过。
- **completed_at**：N/A — plan repair is recorded; official repaired gate and phase review are still pending
- **执行事实**：真实 consumer 仅对 material revision 允许窄容忍；snapshot tree 与事实字节篡改仍返回 stale/unavailable。实际 integration consumer 通过，但未把替代路径 receipt 冒充冻结 gate GREEN。

### Verify
- **Target**：AC-FRESH-001 AC-FRESH-002
- **gate_cmd**：`node tools/cli/run-checks.mjs --runtime-profile=medium --evidence-path=quality/tests/p5-fresh.json -- npx vitest run tests/contract/per-ac-material-freshness.test.mjs tests/integration/verify-freshness-selection.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **evidence_path**：`quality/tests/p5-fresh.json`
- **Oracle**：ORACLE-P5-FRESH 全目标与负例通过。

### Knowledge

向下一 Phase 只传 GREEN evidence ref/hash 与冻结材料 refs。

### STOP

身份、范围或 oracle 不一致时返回 plan/spec owner。

### Done

RED 非零、GREEN 为 0、逐 AC 证据可读。

### Risks and rollback

Risk=错误扩张；Prevention=单 seam/单 writer；Rollback=仅回滚当前 GREEN。

## Phase P6 — 当前 task 本地 aggregate 与缺失边界

### Goal

以当前认证 task 的 targeted receipts、源码与材料身份执行一次本地 aggregate，判真本地合同；host telemetry 缺失显式保持 unavailable。

### Files

- **MODIFY**：`tests/acceptance/workflow-execution-current-task.test.mjs`
- **DO NOT TOUCH**：真实 provider/host task、usage log、fixtures 和 runtime public contract；本地 aggregate 不能伪造 live telemetry。

### Tasks

#### T013 — FINAL：current-snapshot aggregate verification

- **ID**：T013
- **Phase**：Phase P6 — 当前 task 本地 aggregate 与缺失边界
- **goal**：一次聚合全部 active AC、跨 seam 本地事实与 live telemetry 缺失边界
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"evidence","ref":"specs/workflowhub-execution-acceleration-20260909/decision-log.md","hash":"efdd67ad98ce4f2bb1a892c90888bd1bc5238ce46472f85ae4d39facdca769e6","id":"DECISION"},{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-20260909/spec.md","hash":"446c9fb25837ede0d4e9b379b7b17c7adbec2d4c401427ccab29745c12c4e08e","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-20260909/plan.md","hash":"eda140a31b3a2f4ee1dc6791b2ad1f67e913a016be096b29aa738f1f0ad5d69c","id":"PLAN"}]`
- **source_refs / decision_refs**：D-001..D-011 → all FR/AC
- **输入**：T004 T006 T008 T010 T012 GREEN facts；当前 worktree targeted receipts；D-011 local aggregate contract
- **依赖**：T004 T006 T008 T010 T012
- **并行**：否 — aggregate reads all facts
- **FR**：FR-REVIEW-001 FR-REVIEW-002 FR-REVIEW-003 FR-REVIEW-004 FR-COORD-001 FR-COORD-002 FR-COORD-003 FR-TEST-001 FR-FRESH-001
- **AC**：AC-REVIEW-000 AC-REVIEW-001 AC-REVIEW-002 AC-REVIEW-003 AC-REVIEW-004 AC-REVIEW-005 AC-COORD-001 AC-COORD-002 AC-COORD-003 AC-COORD-004 AC-TEST-001 AC-TEST-002 AC-FRESH-001 AC-FRESH-002 AC-DELIVERY-001
- **动作**：只运行一次 targeted local aggregate；逐 active AC 输出实际 assertion；对缺失 host telemetry 保留 unavailable
- **精确文件**：`tests/acceptance/workflow-execution-current-task.test.mjs`
- **boundary**：files: `tests/acceptance/workflow-execution-current-task.test.mjs`; symbols/regions: current-task receipt/material/source aggregate only
- **输出**：逐 AC assertions、原 stdout/stderr、aggregate ref/hash
- **Knowledge**：local aggregate 只证明当前事实合同；不证明真实 task、host usage 或 live threshold
- **verification_role**：N/A — non-behavior aggregate verification
- **paired_task**：N/A — aggregate has no RED/GREEN pair
- **gate_cmd**：`node tests/acceptance/workflow-execution-current-task.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-FINAL-LOCAL {"pass":"全部 active AC 有本地 assertion；host telemetry 缺失显式 unavailable，不冒充 live threshold","delivery":"当前 task 的 receipts、材料和源码均可读取且逐项绑定"}`
- **evidence_path**：stdout JSON + current targeted receipts
- **STOP**：任一 active AC 缺失、receipt 非零/不可读、材料/源码身份不一致，或有人要求把 unavailable 写成 live pass
- **recovery**：回到首个失败 GREEN；若有 runtime_id，先 status/cancel 收敛并记录 p6-rollback evidence；不全量重跑
- **task risk**：聚合遗漏或把 unavailable 当 live pass
- **test tier / test method**：fullstack targeted command；runtime profile=inner, local current-task aggregate, ceiling=120s
- **runtime permissions**：network=none；DB=none；filesystem=worktree read-only；subprocess=none；environment=local
- **scenarios / commands / expected exit / oracle**：全部 active AC 与跨 seam，使用 ORACLE-FINAL-LOCAL
- **fixtures_services**：当前 task receipts + 当前源码/材料；不读取用户真实 task 或 synthetic usage
- **coverage limits**：不证明真实 task、host telemetry、live token ratio、sleep polling threshold；不实现 S3-S7
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [ ] **任务完成**
- **status**：in_progress
- **actual_changes**：将 P6 harness 改为 `tests/acceptance/workflow-execution-current-task.test.mjs`；只聚合当前 task targeted receipts/material/source；对 AC-COORD-001/004 的 host telemetry 缺失输出 unavailable，不使用真实 task、fixture 或合成 usage。
- **executed_commands**：`node tests/acceptance/workflow-execution-current-task.test.mjs` 已通过；官方当前 test receipt 也执行了 10 个受影响测试文件 + 当前 task aggregate，exit=0；profile capability proof 与 live telemetry 仍 unavailable。
- **evidence_refs**：`quality/tests/build-code-current-p6-20260909.json` sha256=`24d9599f356746fadf3a9f3ac3bebaea11c2a20e1bbcac0018904cf9665b8dfc`；`quality/tests/final-current-snapshot-repaired-20260909.json` sha256=`e91ef38a5d7a5108bb0654d39ffad80d75c2e96dde787e9eff6bb381d7078de1`（output_hash=`b06f5a72ff081cd4c0a060ee0493456dabaa12275d595c7560066f502198636b`）；当前 build-code Stage Agent outcome `quality/evidence/stage-outcomes/build-code/b9339ff221e1c733513ee587635d6bbf9bdcd9b4007c5ee1ab2936f0012d0f96.json`。
- **covered_ac**：本地 AC contract 可覆盖；AC-COORD-001/004 的 live telemetry 明确 unavailable；真实 task 结果不属于本次 contract。
- **review_fact**：当前 build-code integration review attempt `quality/reviews/attempts/d903883f-4380-57ff-a960-f2f81460e43a/attempt.json` 已记录，但 provider terminal result unavailable；不作为通过。
- **semantic_review_status**：unavailable
- **semantic_review_ref**：quality/reviews/attempts/80341c61-5061-5e15-ad94-39d436922606/attempt.json
- **semantic_review_reason**：当前 build-plan 独立审查 attempt 已记录，但 provider 未返回 terminal semantic result；不作为通过。
- **completed_at**：N/A — local contract executed；formal build-code predicates and Stage Agent completion remain incomplete
- **执行事实**：D-011 已取消真实 task 作为本次 P6 前置；新的 aggregate 必须只证明当前 task 合同，并保留 live telemetry unavailable。不得以本地 aggregate 冒充真实任务或 live 指标达标。
- **后续失效说明**：D-012 新增 AC-REVIEW-006 后，本卡保留为当时 baseline；当前 FINAL 转由 T016，必须重采新材料/实现 identity。



### Verify
- **Target**：AC-COORD-001 AC-COORD-004 AC-DELIVERY-001
- **gate_cmd**：`node tests/acceptance/workflow-execution-current-task.test.mjs`
- **expected_exit**：0；缺 host telemetry 时输出 unavailable boundary，不把阈值写成通过
- **evidence_path**：stdout JSON + current targeted receipts
- **Oracle**：ORACLE-FINAL-LOCAL。

### Knowledge

当前 task targeted receipts；不作真实任务或统计结论。

### STOP

缺任一 active AC、本地 receipt 非零/不可读、身份不一致，或要求把 unavailable 当 live pass。

### Done

所有 active AC 有本地 assertion；live token share、meaningful events、sleep=0 缺少 host telemetry 时明确 unavailable。

### Risks and rollback

本地 aggregate 误当真实运行；失败保留原始输出，真实 task/host usage 后续认证，不重派昂贵 provider。

## Phase P3-R — 受认证 route repair 单次预算

### Goal

只在 canonical history 证明真实 provider failure 且宿主 route identity 已变化时增加一次同 revision 重试预算；其他 unavailable 仍阻断。

### Files

- **MODIFY**：`runtime/review/review-record-route.mjs`、`runtime/evidence/stage-content-evidence.mjs`、`tests/review/review-record-route.test.mjs`、`tests/acceptance/workflow-execution-current-task.test.mjs`
- **DO NOT TOUCH**：broker provider internals、review result schema、public command、第二 store/gate；request 不新增 repair assertion。

### Tasks

#### T014 — RED：受认证 route repair 预算边界

- **ID**：T014
- **Phase**：Phase P3-R — 受认证 route repair 单次预算
- **goal**：先证明旧预算无法区分真实路由修复与伪重试
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"evidence","ref":"specs/workflowhub-execution-acceleration-20260909/decision-log.md","hash":"efdd67ad98ce4f2bb1a892c90888bd1bc5238ce46472f85ae4d39facdca769e6","id":"DECISION"},{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-20260909/spec.md","hash":"446c9fb25837ede0d4e9b379b7b17c7adbec2d4c401427ccab29745c12c4e08e","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-20260909/plan.md","hash":"eda140a31b3a2f4ee1dc6791b2ad1f67e913a016be096b29aa738f1f0ad5d69c","id":"PLAN"}]`
- **source_refs / decision_refs**：R-026 D-012 → FR-REVIEW-005 / AC-REVIEW-006
- **输入**：冻结 decision/spec/plan、canonical attempt fixture、现有 budget route/validator
- **依赖**：T013
- **并行**：否 — 与 T015 同 seam 单 writer
- **FR**：FR-REVIEW-005
- **AC**：AC-REVIEW-006
- **动作**：只增加合格路径与全部负例断言，不改生产实现
- **精确文件**：`tests/review/review-record-route.test.mjs`
- **boundary**：files: `tests/review/review-record-route.test.mjs`; symbols/regions: review budget route-repair table tests
- **输出**：命名 RED、原始退出码、canonical fixture 身份
- **Knowledge**：request 自报无效；只信 canonical prior attempt + host-derived route identity
- **verification_role**：RED
- **paired_task**：T015
- **gate_cmd**：`npx vitest run tests/review/review-record-route.test.mjs -t "T014 authenticated route-repair review budget" --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-P3-ROUTE-REPAIR {"pass":"仅真实 provider failure + changed host route identity 得到同 revision 一次 route_repair","reject":{"input":"零 provider、非 provider 错误、semantic output、同 route、自报 repair 或第二次 repair","expected_rejection":"dispatch 前拒绝且旧失败事实不变","observation":"命名断言与 provider call count=0"}}`
- **evidence_path**：`quality/tests/p3-route-repair-current.json`（首次无 `-t` 整文件试跑的 timeout 诊断保留在 `quality/tests/p3-route-repair.json`，不计有效 RED）
- **STOP**：RED 不命中目标缺口、需改 DO NOT TOUCH、需放宽失败分类或新增 public flow
- **recovery**：删除本卡新增断言即可；保留 evidence 与 historical attempts
- **task risk**：fixture 不能代表 canonical 结构或出现假 RED
- **test tier / test method**：feature / targeted Vitest；runtime profile=inner，ceiling=60s
- **runtime permissions**：network=none；DB=none；filesystem=worktree/temp only；subprocess=explicit vitest only；environment=local/CI
- **scenarios / commands / expected exit / oracle**：SCN-011 正负矩阵，同一 gate 与 ORACLE-P3-ROUTE-REPAIR
- **fixtures_services**：task-local canonical attempt fixtures；无 provider 实调用
- **coverage limits**：只覆盖 AC-REVIEW-006 budget decision，不证明 provider 可用或 review 质量通过
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [x] **任务完成**
- **status**：completed
- **actual_changes**：新增 5 个 route repair budget 场景；只改测试，生产实现未动。
- **executed_commands**：首次整文件 inner gate exit=124（超时诊断，不计 RED）；收窄命名分组后 exit=1，初始 5 场景仅合格路径失败；独立审查后补 closure/member 负例得到 4 个目标 RED；再补 changed subject 单例得到 1 个目标 RED。
- **evidence_refs**：`quality/tests/p3-route-repair.json` sha256=`d3d8cb20d4a55a04bc4890ef632b24560c892c0002b39001b90fef704e50a918`（timeout diagnostic）；`quality/tests/p3-route-repair-current.json` sha256=`dfa936cb1fa1986af46800bc2ad15710f28657a18ccc8c57170ee30b12022a7f`（initial RED）；`quality/tests/p3-route-repair-findings-red.json` sha256=`0528f7da59e9d1c26ebd1ddd97ab5f97ba53df2c9f9994fae39a07ec6d15b1aa`；`quality/tests/p3-route-repair-subject-red.json` sha256=`a8099d4e2cfa722397d34c5b4bcc82b87c4b27a29486b1d9236634ac2344c586`。
- **covered_ac**：AC-REVIEW-006 RED 正负矩阵；不宣称通过。
- **review_fact**：N/A — RED 测试事实，不是独立 review。
- **semantic_review_status**：unavailable
- **semantic_review_ref**：N/A
- **semantic_review_reason**：本卡只产出 RED，不以作者测试替代独立 review
- **completed_at**：2026-09-09T15:13:17Z

#### T015 — GREEN：既有 budget seam 增 route_repair

- **ID**：T015
- **Phase**：Phase P3-R — 受认证 route repair 单次预算
- **goal**：最小扩展现有 route/budget validator 使 T014 同命令通过
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"evidence","ref":"specs/workflowhub-execution-acceleration-20260909/decision-log.md","hash":"efdd67ad98ce4f2bb1a892c90888bd1bc5238ce46472f85ae4d39facdca769e6","id":"DECISION"},{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-20260909/spec.md","hash":"446c9fb25837ede0d4e9b379b7b17c7adbec2d4c401427ccab29745c12c4e08e","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-20260909/plan.md","hash":"eda140a31b3a2f4ee1dc6791b2ad1f67e913a016be096b29aa738f1f0ad5d69c","id":"PLAN"}]`
- **source_refs / decision_refs**：R-026 D-012 → FR-REVIEW-005 / AC-REVIEW-006
- **输入**：T014 RED、canonical history、host-derived current route identity
- **依赖**：T014
- **并行**：否 — 单 writer
- **FR**：FR-REVIEW-005
- **AC**：AC-REVIEW-006
- **动作**：route 从同 subject/revision canonical history 推导候选；validator 认证失败成员、identity 差异和单次上限
- **精确文件**：`runtime/review/review-record-route.mjs`、`runtime/evidence/stage-content-evidence.mjs`、`tests/review/review-record-route.test.mjs`
- **boundary**：files: listed three; symbols/regions: budget kind validation and route budget context derivation only
- **输出**：GREEN receipt 与可读 budget context
- **Knowledge**：旧 attempt immutable；不增加 request 字段或 provider fallback
- **verification_role**：GREEN
- **paired_task**：T014
- **gate_cmd**：`npx vitest run tests/review/review-record-route.test.mjs -t "T014 authenticated route-repair review budget" --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-P3-ROUTE-REPAIR {"pass":"仅真实 provider failure + changed host route identity 得到同 revision 一次 route_repair","reject":{"input":"零 provider、非 provider 错误、semantic output、同 route、自报 repair 或第二次 repair","expected_rejection":"dispatch 前拒绝且旧失败事实不变","observation":"命名断言与 provider call count=0"}}`
- **evidence_path**：`quality/tests/p3-route-repair-findings-green.json`
- **STOP**：canonical 字段不足以认证、需 schema/public flow/第二 store、或负例无法 fail closed
- **recovery**：回滚两个生产 seam；保留 RED/GREEN 和 historical attempts
- **task risk**：误判 failure 或 route identity 导致重复调用
- **test tier / test method**：feature / targeted Vitest；runtime profile=inner，ceiling=60s
- **runtime permissions**：network=none；DB=none；filesystem=worktree/temp only；subprocess=explicit vitest only；environment=local/CI
- **scenarios / commands / expected exit / oracle**：SCN-011 正负矩阵，同一 gate 与 ORACLE-P3-ROUTE-REPAIR
- **fixtures_services**：task-local canonical attempt fixtures；无 provider 实调用
- **coverage limits**：只证明预算判定；不证明外部 provider 成功
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [x] **任务完成**
- **status**：completed
- **actual_changes**：在既有 budget validator 增内部 `route_repair` kind；canonical history fact 暴露已认证 route/closure/dispatch/terminal/provider 摘要；route 只从最新同 subject/revision、同 packet/closure/snapshot 的 canonical attempt 与宿主当前 route identity 推导候选；validator 同时逐 member 排除协议/材料/状态等非路由失败。同 revision 上限 1；未新增 public command/store/request assertion。
- **executed_commands**：初始命名 GREEN 5/5；独立审查发现 closure binding 与 member error 分类缺口后，新增 5 个场景得到 4 个目标 RED，再修复为 10/10 GREEN；最终邻接回归 `tests/review/review-record-route.test.mjs` + `tests/contract/freeze-classification-budget-usage-protocol.test.mjs` 共 86/86 passed，exit=0。另一次复用 RED receipt 的试跑虽测试通过，但 immutable evidence writer 拒绝覆盖并 exit=1，未计 GREEN。
- **evidence_refs**：初始 `quality/tests/p3-route-repair-green.json` sha256=`03d3a7ccab2a095d0593290e096462258e39562943091252616240cb49227a20`；finding RED `quality/tests/p3-route-repair-findings-red.json` sha256=`0528f7da59e9d1c26ebd1ddd97ab5f97ba53df2c9f9994fae39a07ec6d15b1aa`；扩展 GREEN `quality/tests/p3-route-repair-findings-green.json` sha256=`31a121651bdbe207ebb1c4c0a9288dda0fa3ec0b628428265288e585a9cf7e28`；subject RED `quality/tests/p3-route-repair-subject-red.json` sha256=`a8099d4e2cfa722397d34c5b4bcc82b87c4b27a29486b1d9236634ac2344c586`；最终邻接 `quality/tests/p3-route-repair-adjacent-final-2.json` sha256=`c07a64420731410fa9d91f387e51acc1ff0bdbe8aaea3832a41e27586d3678ba`（87/87）。
- **covered_ac**：AC-REVIEW-006 目标与邻接 budget/review record 合同通过。
- **review_fact**：待独立 P3-R 审查；测试不替代 review。
- **semantic_review_status**：unavailable
- **semantic_review_ref**：N/A
- **semantic_review_reason**：独立 P3-R 审查尚未回写
- **completed_at**：2026-09-09T15:20:03Z

#### T016 — FINAL：当前 identity 重采与正式审查

- **ID**：T016
- **Phase**：Phase P3-R — 受认证 route repair 单次预算
- **goal**：聚合 16 个 active AC，并按当前材料/快照发起一次正式 integration review
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"evidence","ref":"specs/workflowhub-execution-acceleration-20260909/decision-log.md","hash":"efdd67ad98ce4f2bb1a892c90888bd1bc5238ce46472f85ae4d39facdca769e6","id":"DECISION"},{"artifact_kind":"spec","ref":"specs/workflowhub-execution-acceleration-20260909/spec.md","hash":"446c9fb25837ede0d4e9b379b7b17c7adbec2d4c401427ccab29745c12c4e08e","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-acceleration-20260909/plan.md","hash":"eda140a31b3a2f4ee1dc6791b2ad1f67e913a016be096b29aa738f1f0ad5d69c","id":"PLAN"}]`
- **source_refs / decision_refs**：D-001..D-012 → all FR/AC
- **输入**：T015 GREEN、当前 targeted receipts、当前材料/源码 identity
- **依赖**：T015
- **并行**：否 — current-snapshot aggregate then one formal review
- **FR**：FR-REVIEW-001..005 FR-COORD-001..003 FR-TEST-001 FR-FRESH-001
- **AC**：AC-REVIEW-000..006 AC-COORD-001..004 AC-TEST-001..002 AC-FRESH-001..002 AC-DELIVERY-001
- **动作**：更新 aggregate 对 AC-REVIEW-006 的断言，重采 targeted receipt，执行 local aggregate，再按当前 identity 发起一次正式 integration review
- **精确文件**：`tests/acceptance/workflow-execution-current-task.test.mjs`
- **boundary**：files: acceptance harness and immutable quality outputs; formal review uses existing route only
- **输出**：current receipt/aggregate/review attempt refs 与真实状态
- **Knowledge**：provider unavailable 仍是 unavailable；测试/aggregate 不替代正式 review
- **verification_role**：N/A — non-behavior final aggregation and external review fact capture
- **paired_task**：N/A — final aggregate has no RED/GREEN pair
- **gate_cmd**：`node tests/acceptance/workflow-execution-current-task.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-FINAL-LOCAL {"pass":"16 个 active AC 均有本地 assertion，live telemetry 缺失保持 unavailable","review":"current identity attempt 保留真实 terminal status"}`
- **evidence_path**：current targeted receipt + stdout JSON + canonical review attempt
- **STOP**：aggregate 缺 AC/identity 不一致、receipt 非零，或要求将 provider unavailable 写成通过
- **recovery**：回首个失败 GREEN；不重派第二次同 identity，不覆盖旧 attempt
- **task risk**：把 local green 当 formal acceptance 或超预算重派
- **test tier / test method**：fullstack targeted aggregate；runtime profile=inner，ceiling=120s
- **runtime permissions**：network=review route only；DB=none；filesystem=worktree/task quality；subprocess=existing stage/review commands only；environment=local
- **scenarios / commands / expected exit / oracle**：SCN-010/011，ORACLE-FINAL-LOCAL + canonical review status
- **fixtures_services**：当前 task receipts/material/source；正式 review 使用配置的真实 provider route
- **coverage limits**：live telemetry 仍 unavailable；正式 provider 结果可能 unavailable；不覆盖 S3-S7
- **acceptance_role**：acceptance
- **ui_scope**：non_ui
- **acceptance_data**：`[{"source":"current authenticated task","sample":"current worktree receipts and canonical review route","scenario":"16-AC local aggregate plus one current-identity integration review","tier":"command","execution":{"command":"node","args":["tests/acceptance/workflow-execution-current-task.test.mjs"],"timeout_ms":120000}}]`
- **e2e_scope**：not_required
- **e2e rationale**：non_ui command acceptance；外部 review 的真实 unavailable 只作质量边界，不伪造 provider 通过

##### 执行状态填写区（唯一完成权威）
- [x] **任务完成**
- **status**：completed
- **actual_changes**：aggregate 已扩展为 16 个 active AC 并消费最终 route-repair GREEN receipt；当前材料合同修复后重采同一 snapshot 的 targeted test 与 implementation receipts，并发起一次正式 integration review。阶段后独立架构审查发现的 5 个交付问题已在同 task 修复：正式 review CLI 现在负责 bounded managed terminal 生命周期并使用认证 implementation context；host brief 增加 current revision/tree 与 worker/ref 绑定；capability proof 改为认证真实字节；route-repair 预算只看当前 revision 的最新 attempt；managed provider 嵌套元数据严格校验并脱敏。
- **executed_commands**：官方 build-code `verify --action=execute` 运行 10 个受影响测试文件与当前 aggregate，exit=0；10 files / 205 tests passed，aggregate 16/16 active AC，AC-COORD-001/004 live telemetry 仍 unavailable。阶段后修复的受影响检查分别为 managed lifecycle 20/20、host bridge 17/17、capability proof 12/12、review route 61/61，均 exit=0；`node --check` 与 `git diff --check` exit=0。没有再发起 provider review。
- **evidence_refs**：`quality/tests/build-code-current-route-repair-20260909.json` sha256=`eb037b6caff89e4ec122c49f0faa509256515d0aa375ae0dbaf40fca15381a61`；`quality/evidence/implementation/dc8853389fa94f6fb9498a3fa9a3f27caaf8c5fb54699d5aa74a1fd5d5691fbe.json` sha256=`dc8853389fa94f6fb9498a3fa9a3f27caaf8c5fb54699d5aa74a1fd5d5691fbe`；snapshot_tree=`d4b67b4b14f90893521b091fa1e5e960ac15ed83`。
- **covered_ac**：本地 16 AC aggregate 已通过；不等于正式 provider review/Stage acceptance。
- **review_fact**：P3-R 独立代码审查发现的 3 个 Major 已修复，最终复核 findings=[]。后续单次 verify-code 架构审查的 1 个 blocking、4 个 major 均已修复并通过受影响测试；按固定四动作边界不再复审。既有 integration attempt 仍保留为 unavailable，不能代表修复后的当前源码。
- **semantic_review_status**：unavailable
- **semantic_review_ref**：`quality/reviews/attempts/1f8f790c-3076-5b6a-a773-61c9f52db74c/attempt.json` sha256=`0e29c9e92cfc2acd9a862201ea102b92fed1595ec63ab60b5a66e099e29d2e0f`
- **semantic_review_reason**：`REVIEW_STATUS_UNAVAILABLE`；既有 public route 未消费认证 implementation context，canonical attempt 没有可用 terminal semantic result。该 route 缺陷已修复，但按用户要求和单次审查边界不再派发 provider；不把 unavailable 写成通过。
- **completed_at**：2026-09-09T15:48:18Z

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

## 4. Final current-snapshot aggregate strategy
- **tier / method**：fullstack targeted command + current task local aggregate
- **scenarios**：全部 16 AC、跨 seam、本地 failure-boundary preservation、受认证 route repair 单次预算
- **command**: `node tests/acceptance/workflow-execution-current-task.test.mjs`
- **expected exit**：0
- **oracle**：ORACLE-FINAL-LOCAL；本地合同可判真，live telemetry 缺失保留 unavailable
- **fixtures_services**：当前 task receipts/source/materials；不读取用户真实 task
- **evidence_path**：stdout JSON + current targeted receipts
- **coverage limits**：不证明真实 task/live thresholds；不覆盖 S3-S7
- **STOP**：缺 active AC、receipt 或身份不一致时不宣称 local contract 完成
- **execution_contract**：当前快照一次；失败保留原输出，回首个失败 task。

## Dependency Graph

- **order**：T003→T004→T005→T006→T007→T008→T009→T010→T011→T012→T013→T014→T015→T016；生产写串行。

```text
T003→T004→T005→T006→T007→T008→T009→T010→T011→T012→T013→T014→T015→T016
```

## Final Boundary Check
- [ ] 每 Phase 八段完整、Files 与 plan 字节一致。
- [ ] 每卡一个完成区，文件属于 Phase。
- [ ] RED/GREEN 同命令、同 oracle、同 FR/AC。
- [ ] FINAL 唯一且最后，真实 task 缺失不伪造通过。
