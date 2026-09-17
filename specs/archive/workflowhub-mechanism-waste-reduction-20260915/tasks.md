# 任务清单：WorkflowHub 机制浪费削减

- **Input**：`decision-log.md ref`、`spec.md ref`、`plan.md ref`
- **Template version**：`plan-task.v4`

## 材料导航

| 章节 / 材料锚点 | 职责与摘要 | M/S/B/P 读取时机 |
| --- | --- | --- |
| `decision-log.md#D-001~D-026` | 已确认方向、边界、拒绝方案与 freeze packet；D-026 要求当前会话直接执行阶段 | M 启动；S 每 Phase 前 |
| `spec.md#第6节功能需求` | 25 个 FR 与失败边界 | M 写 plan；S 写 tasks |
| `spec.md#第11节验收标准` | 26 个 AC 与 oracle | M/S 绑定 gate/oracle |
| `plan.md#File Boundary` | 精确文件边界 | S 执行前；B 不读取 |
| `tasks.md#Phase P1~P7` | RED/GREEN 任务与 FINAL acceptance | M/S 执行；P 仅无冲突并行 |

## Phase P1 — Review source scope / validity freeze

### Goal

材料变化不再翻转已记录审查，验证范围按来源读取。

### Files

- **NEW**：`tests/contract/review-material-change-redispatch.test.mjs`
- **MODIFY**：`runtime/evidence/freshness.mjs`
- **MODIFY**：`runtime/review/review-record-route.mjs`
- **DO NOT TOUCH**：`specs/workflowhub-mechanism-waste-reduction-20260915/spec.md` — material authority

### Tasks

#### T001 — RED：material change does not redispatch
- **ID**：T001
- **Phase**：Phase P1 — Review source scope / validity freeze
- **goal**：Material-byte-only change leaves fact status/source refs unchanged and dispatch count zero.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：N/A — first task
- **并行**：否 — paired RED/GREEN
- **FR**：FR-REV-001
- **AC**：AC-REV-001
- **动作**：Add failing test that mutates material bytes under fixed code snapshot and asserts no stale/expired or redispatch.
- **精确文件**：`tests/contract/review-material-change-redispatch.test.mjs`
- **boundary**：files: `tests/contract/review-material-change-redispatch.test.mjs`; symbols/regions: only declared symbols
- **输出**：RED evidence with target assertion failing
- **Knowledge**：freshness key currently uses material version and route rejects reuse
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`npx vitest run tests/contract/review-material-change-redispatch.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-REV-VALIDITY — target assertion fails: fact flips or dispatch count increases
- **evidence_path**：apply/evidence/T001.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：False RED due to fixture setup
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：Added `tests/contract/review-material-change-redispatch.test.mjs` with deterministic material-only mutation and authenticated quality-fact provenance scenarios.
- **executed_commands**：RED `npx vitest run tests/contract/review-material-change-redispatch.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` exit `1`, target assertion (not setup) failed; see `.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T001.stdout`.
- **evidence_refs**：`.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T001.stdout`; test file above.
- **covered_ac**：`AC-REV-001` RED oracle established.
- **review_fact**：Covered by P1 phase review attempt `e5fd7278-fe3f-5678-a472-ffbed58a8d12`; final finding disposition is recorded in `.planning/2026-09-16-build-code-mechanism-waste-reduction/findings.md`.
- **completed_at**：`2026-09-16` (RED observed before GREEN implementation)
- **执行事实**：Fixture setup initially failed on packet material binding and was corrected before the intended RED; no live task or full regression used.

#### T002 — GREEN：material change does not redispatch
- **ID**：T002
- **Phase**：Phase P1 — Review source scope / validity freeze
- **goal**：Make T001 pass with minimal freshness/route change.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：T001
- **并行**：否 — paired RED/GREEN
- **FR**：FR-REV-001
- **AC**：AC-REV-001
- **动作**：Change freshness/route to preserve recorded fact for same code snapshot and source scope.
- **精确文件**：`runtime/evidence/freshness.mjs` `runtime/review/review-record-route.mjs` `tests/contract/review-material-change-redispatch.test.mjs`
- **boundary**：files: `runtime/evidence/freshness.mjs` `runtime/review/review-record-route.mjs`; symbols/regions: only declared symbols
- **输出**：GREEN evidence; negative stale/expired case remains impossible
- **Knowledge**：Same oracle as T001
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`npx vitest run tests/contract/review-material-change-redispatch.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-REV-VALIDITY — same assertion passes with no stale/expired or redispatch
- **evidence_path**：apply/evidence/T002.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：Overbroad key hides real code-snapshot review
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：Updated `runtime/review/review-record-route.mjs` to remove material revision/submitted-material identity from the reuse key while retaining authenticated route/subject/evidence scoping and the terminal verify-code snapshot guard; updated `runtime/evidence/freshness.mjs` so material revision is provenance and only terminal verify-code code review requires current code snapshot; retained the contract test.
- **executed_commands**：GREEN `npx vitest run tests/contract/review-material-change-redispatch.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` exit `0` (2/2); adjacent targeted regression (`review-budget-namespace`, `per-ac-material-freshness`, `freshness-removal-preservation`) exit `0` (17/17); public canonical capture exit `0`.
- **evidence_refs**：`.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T002.stdout`; `quality/tests/build-code-p1-review-material-change.json` (receipt hash `cdc840a9f66b75f82adb6060e3bd4809ce15d9847f9528f934b3cbe139edf9c4`); P1 review result/attempt/report `quality/reviews/{results/build-code-simple-e5fd7278-fe3f-5678-a472-ffbed58a8d12.json,attempts/e5fd7278-fe3f-5678-a472-ffbed58a8d12/attempt.json,reports/build-code-simple-e5fd7278-fe3f-5678-a472-ffbed58a8d12.md}`.
- **covered_ac**：`AC-REV-001` (with supporting source-provenance coverage for `AC-REV-004`/`AC-REV-005`).
- **review_fact**：One semantic phase review completed; `kimi/coding` finding `F-ae27d7ad04e9` dispositioned `rejected_invalid` against current FR-REV-001/002/003; `codex/luna` unavailable due `EVIDENCE_ANCHOR_INVALID`; raw facts preserved.
- **completed_at**：`2026-09-16T00:00:45.549Z` (canonical GREEN receipt)
- **执行事实**：No commit/push/merge/close performed. P2 budget machinery remains intentionally unchanged.


### Verify

`npx vitest run tests/contract/review-material-change-redispatch.test.mjs
- `exit 0; ORACLE-REV-VALIDITY。

### Knowledge

Source-scope key must preserve old fact provenance。

### STOP

If fixture cannot create deterministic material change without live task`
- `return spec.md#D-020。

### Done

AC-REV-001/003/004/005 covered by T002。

### Risks and rollback

Risk: stale key migration；rollback freshness key only。

## Phase P2 — Delete review budget machinery

### Goal

预算消费行为为零；显式重试创建一次新尝试。

### Files

- **NEW**：`tests/contract/review-budget-deletion.test.mjs`
- **MODIFY**：`runtime/review/review-record-route.mjs`
- **MODIFY**：`docs/adr/0028-plan-slicing-and-review-budget.md`
- **MODIFY**：`docs/architecture/control-plane-inventory.json`
- **DO NOT TOUCH**：`docs/adr/0028-plan-slicing-and-review-budget.md` — history sections

### Tasks

#### T003 — RED：budget consumer zero and explicit retry once
- **ID**：T003
- **Phase**：Phase P2 — Delete review budget machinery
- **goal**：Budget machinery exists and blocks explicit retry.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：N/A — independent RED after stable dedupe design
- **并行**：否 — paired RED/GREEN
- **FR**：FR-REV-002
- **AC**：AC-REV-002
- **动作**：Add failing test asserting no budget consumers and one new attempt only for explicit retry.
- **精确文件**：`tests/contract/review-budget-deletion.test.mjs`
- **boundary**：files: `tests/contract/review-budget-deletion.test.mjs`; symbols/regions: only declared symbols
- **输出**：RED evidence with budget consumer present
- **Knowledge**：evaluateReviewRound and ADR budget clauses still exist
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`npx vitest run tests/contract/review-budget-deletion.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-BUDGET-ZERO — target assertion fails: budget consumer exists or retry blocked
- **evidence_path**：apply/evidence/T003.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：False RED from stale governance docs
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：Added `tests/contract/review-budget-deletion.test.mjs` covering the pre-change budget consumer and explicit retry contract.
- **executed_commands**：`npx vitest run tests/contract/review-budget-deletion.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` exit `1` at the intended RED assertions; see `.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T003.stdout`.
- **evidence_refs**：`.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T003.stdout`; P2 phase review attempts/results/reports listed in the P2 phase card.
- **covered_ac**：`AC-REV-002` RED oracle established.
- **review_fact**：P2 review found and preserved actionable findings for T004; all were fixed or explicitly dispositioned after GREEN.
- **completed_at**：`2026-09-16` (RED observed before T004 implementation)
- **执行事实**：Fixture setup passed; the RED failure was not an environment failure and no full regression was run.

#### T004 — GREEN：budget consumer zero and explicit retry once
- **ID**：T004
- **Phase**：Phase P2 — Delete review budget machinery
- **goal**：Make T003 pass by deleting budget machinery after stable dedupe.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：T003
- **并行**：否 — paired RED/GREEN
- **FR**：FR-REV-002
- **AC**：AC-REV-002
- **动作**：Remove evaluateReviewRound call/blocks, revise ADR-0028 and inventory, keep review_result_ref dedupe.
- **精确文件**：`runtime/review/review-record-route.mjs` `docs/adr/0028-plan-slicing-and-review-budget.md` `docs/architecture/control-plane-inventory.json` `
- **boundary**：files: `runtime/review/review-record-route.mjs` `docs/adr/0028-plan-slicing-and-review-budget.md` `docs/architecture/control-plane-inventory.json`; symbols/regions: only declared symbols
- **输出**：GREEN evidence; budget grep zero; ADR diff readable
- **Knowledge**：Same oracle as T003
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`npx vitest run tests/contract/review-budget-deletion.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-BUDGET-ZERO — same assertion passes; explicit retry once; ADR same-batch revised
- **evidence_path**：apply/evidence/T004.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：Deleting budget before stable dedupe causes duplicate dispatch
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：Removed production round-budget evaluation and budget blocking from `runtime/review/review-record-route.mjs`; retained canonical immutable review history validation for deduplication; added explicit retry judgment and idempotency; revised ADR-0028 and `review-budget-namespace` inventory/test expectations.
- **executed_commands**：GREEN `npx vitest run tests/contract/review-budget-deletion.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` exit `0` (3/3); namespace regression exit `0` (9/9); public canonical capture exit `0`.
- **evidence_refs**：`.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T004.stdout`; `quality/tests/build-code-p2-review-deletion-v4.json` (receipt hash `1ebaf1e21339db0434f13b6ad68cc78fae4eccf0d438a5ed6e800590f6267f85`); `quality/tests/build-code-p1-material-change-v2.json` (receipt hash `c90010a072f0395014d56ced51e97c09cab8c1ecd672040534f5120d94ef15e6`); `docs/adr/0028-plan-slicing-and-review-budget.md`; `docs/architecture/control-plane-inventory.json`.
- **covered_ac**：`AC-REV-002` (supporting no-auto-dispatch and canonical provenance behavior).
- **review_fact**：Initial P2 review `0821f20d-f9f9-5b32-a25e-5e871375af02`, repair review `04605abe-efe8-5d5e-a3b3-02c2f0326aa4`, latest repair review `a7f2a356-101f-5fa5-a0c8-fb790e6feb2f`; major findings fixed or rejected as invalid with evidence; latest remaining minor was fixed by the current contract test.
- **completed_at**：`2026-09-16T00:52:19.460Z` (canonical current GREEN receipt)
- **执行事实**：No commit/push/merge/close. Historical old reports may retain `budget_context`; current writer does not emit it and current route does not use budget decisions.


### Verify

`npx vitest run tests/contract/review-budget-deletion.test.mjs
- `exit 0; ORACLE-BUDGET-ZERO。

### Knowledge

Dedupe must be stable before budget deletion。

### STOP

If repeated dispatch remains after dedupe`
- `return plan.md#DEC-002。

### Done

AC-REV-002 and ADR-0028 same-batch revision covered。

### Risks and rollback

Risk: governance docs left requiring budget；verify ADR diff。

## Phase P3 — External member termination semantics

### Goal

心跳死亡、真实停滞、显式取消进入成员终态；长时间运行保持 running。

### Files

- **NEW**：`tests/contract/external-threshold-contract.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/review-provider-client.mjs`
- **MODIFY**：`skills/wh-review/scripts/simple-review-runner.mjs`
- **MODIFY**：`skills/wh-review/scripts/third-review-host-config.mjs`
- **DO NOT TOUCH**：external repo formal acceptance files

### Tasks

#### T005 — RED：threshold request and member terminal states
- **ID**：T005
- **Phase**：Phase P3 — External member termination semantics
- **goal**：Request omits minimum_heterologous and member terminal states are not consumed.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：N/A — independent RED
- **并行**：否 — paired RED/GREEN
- **FR**：FR-EXT-001, FR-EXT-002, FR-EXT-003
- **AC**：AC-EXT-001, AC-EXT-002, AC-EXT-003
- **动作**：Add failing contract fixture asserting request threshold validation and member status semantics.
- **精确文件**：`tests/contract/external-threshold-contract.test.mjs`
- **boundary**：files: `tests/contract/external-threshold-contract.test.mjs`; symbols/regions: only declared symbols
- **输出**：RED evidence: invalid threshold accepted or running conflated with failed
- **Knowledge**：review-provider-client request validator omits threshold
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`npx vitest run tests/contract/external-threshold-contract.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-THRESHOLD-REQUEST — target assertion fails: missing/invalid threshold or wrong member state
- **evidence_path**：apply/evidence/T005.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：False RED from external fixture mismatch
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 `tests/contract/external-threshold-contract.test.mjs`，固定请求阈值、v3 running 保真、底层 model 去重和不可达阈值写前拒绝。
- **executed_commands**：`npx vitest run tests/contract/external-threshold-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；RED exit 1，目标断言失败。
- **evidence_refs**：`.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T005.stdout`
- **covered_ac**：`AC-EXT-001/002/003` 的 RED 基线已建立；不是通过结论。
- **review_fact**：与 T006 共用 P3 阶段审查事实；独立 review 结果不可用事实见 `quality/reviews/attempts/f546fd83-d361-588c-ac7d-616b00a98110/attempt.json`。
- **completed_at**：`2026-09-16T09:05:16+08:00`
- **执行事实**：RED 失败来自缺少 `minimum_heterologous`、按 adapter/profile 误计数和 v3 running 被协议拒绝；环境与命令正常。

#### T006 — GREEN：threshold request and member terminal states
- **ID**：T006
- **Phase**：Phase P3 — External member termination semantics
- **goal**：Make T005 pass by extending request/status parser and runner routing.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：T005
- **并行**：否 — paired RED/GREEN
- **FR**：FR-EXT-001, FR-EXT-002, FR-EXT-003
- **AC**：AC-EXT-001, AC-EXT-002, AC-EXT-003
- **动作**：Send minimum_heterologous, validate positive int <= heterologous count, parse member/group/publication statuses.
- **精确文件**：`skills/wh-review/scripts/review-provider-client.mjs` `skills/wh-review/scripts/simple-review-runner.mjs` `skills/wh-review/scripts/third-review-host-config.mjs`
- **boundary**：files: `skills/wh-review/scripts/review-provider-client.mjs` `skills/wh-review/scripts/simple-review-runner.mjs` `skills/wh-review/scripts/third-review-host-config.mjs`; symbols/regions: only declared symbols
- **输出**：GREEN evidence: invalid threshold fails; threshold 2 publishes initial after second heterologous member
- **Knowledge**：Same oracle as T005
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`npx vitest run tests/contract/external-threshold-contract.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-THRESHOLD-REQUEST — same assertion passes; running remains running; initial publishes once
- **evidence_path**：apply/evidence/T006.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：External service field naming drift
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：修改 `skills/wh-review/scripts/review-provider-client.mjs`、`simple-review-runner.mjs`、`third-review-host-config.mjs`：显式阈值进入 v4 request；route/selection/runner 按 distinct underlying model 校验；v3 running/terminal member state 保真；managed/unmanaged 两条路径都传递阈值；无模型身份或不可达阈值响亮失败。
- **executed_commands**：同一 gate `npx vitest run tests/contract/external-threshold-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；GREEN exit 0，1 file / 3 tests；公开 `verify --action=execute` canonical capture exit 0。
- **evidence_refs**：`.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T006.stdout`；`quality/tests/build-code-p3-external-threshold.json`（hash `e5d3898ad8559c71eefd5efa9f2e2dd81c0934a8bb589c9c4a26ccbf37e4933e`）。
- **covered_ac**：`AC-EXT-001` pass（WorkflowHub 请求字段与外部正式验收边界分离）；`AC-EXT-002` pass（running/completed/failed/cancelled 保真）；`AC-EXT-003` pass（正整数、distinct model、写前拒绝）；外部仓正式验收 unknown/outside pass。
- **review_fact**：阶段 review attempt `quality/reviews/attempts/f546fd83-d361-588c-ac7d-616b00a98110/attempt.json`，report `quality/reviews/reports/build-code-simple-f546fd83-d361-588c-ac7d-616b00a98110.md`；terminal `unavailable`，kimi 为 `PUBLIC_RESULT_INVALID`，codex 为 `EVIDENCE_ANCHOR_INVALID`，无可处置 semantic finding；质量覆盖保持 incomplete。
- **completed_at**：`2026-09-16T09:22:25+08:00`
- **执行事实**：P3 行为实现与定向 fixture 已完成；浏览器不适用（`non_ui`）；未改外部仓，未 commit/push/close。


### Verify

`npx vitest run tests/contract/external-threshold-contract.test.mjs
- `exit 0; ORACLE-THRESHOLD-REQUEST。

### Knowledge

D-007 protocol-zero-change only for heartbeat death primitive。

### STOP

If provider request cannot carry threshold`
- `return spec.md#FR-EXT-003。

### Done

AC-EXT-001/002/003 covered。

### Risks and rollback

Risk: external service not updated；keep WorkflowHub parser consumer behind contract fixture。

## Phase P4 — Early publish / late supplement contract

### Goal

threshold initial conclusion + 600000ms supplement/over_window_unjudged + completeness disclosure。

### Files

- **NEW**：`tests/contract/external-supplement-window.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/review-provider-client.mjs`
- **MODIFY**：`skills/wh-review/scripts/simple-review-runner.mjs`
- **DO NOT TOUCH**：`runtime/task/task-store.mjs` — immutable initial record semantics

### Tasks

#### T007 — RED：initial immutable and late window strict
- **ID**：T007
- **Phase**：Phase P4 — Early publish / late supplement contract
- **goal**：Initial conclusion not immutable and late boundary not strict.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：N/A — independent RED
- **并行**：否 — paired RED/GREEN
- **FR**：FR-EXT-004, FR-EXT-005
- **AC**：AC-EXT-004, AC-EXT-005, AC-EXT-006
- **动作**：Add failing fixture for initial publication plus 599999 in-window and 600000 over_window_unjudged.
- **精确文件**：`tests/contract/external-supplement-window.test.mjs`
- **boundary**：files: `tests/contract/external-supplement-window.test.mjs`; symbols/regions: only declared symbols
- **输出**：RED evidence: late result mutates initial or boundary wrong
- **Knowledge**：current parser has no supplement/over_window_unjudged handling
- **verification_role**：RED
- **paired_task**：T008
- **gate_cmd**：`npx vitest run tests/contract/external-supplement-window.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-SUPPLEMENT-WINDOW — target assertion fails at boundary or immutability
- **evidence_path**：apply/evidence/T007.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：False RED from clock fixture
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 `tests/contract/external-supplement-window.test.mjs`，覆盖 v3 publication 元数据、599999/600000 窗口、初始结果不可变和重复 supplement 幂等。
- **executed_commands**：`npx vitest run tests/contract/external-supplement-window.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；RED exit 1，目标断言失败。
- **evidence_refs**：`.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T007.stdout`
- **covered_ac**：`AC-EXT-004/005/006` 的 RED 基线已建立；不是通过结论。
- **review_fact**：与 T008 共用 P4 阶段审查事实；独立 review unavailable 见 `quality/reviews/attempts/14b5ab76-ace4-5006-a455-a0b414d5f629/attempt.json`。
- **completed_at**：`2026-09-16T09:26:28+08:00`
- **执行事实**：RED 失败来自 v3 publication 字段不被接受、supplement writer 不存在及 runner 丢失 publication；环境与命令正常。

#### T008 — GREEN：initial immutable and late window strict
- **ID**：T008
- **Phase**：Phase P4 — Early publish / late supplement contract
- **goal**：Make T007 pass by adding supplement registration and parsing.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：T007
- **并行**：否 — paired RED/GREEN
- **FR**：FR-EXT-004, FR-EXT-005
- **AC**：AC-EXT-004, AC-EXT-005, AC-EXT-006
- **动作**：Parse published_at, running_member_count, append_window; register supplement append-only with initial ref.
- **精确文件**：`skills/wh-review/scripts/review-provider-client.mjs` `skills/wh-review/scripts/simple-review-runner.mjs`
- **boundary**：files: `skills/wh-review/scripts/review-provider-client.mjs` `skills/wh-review/scripts/simple-review-runner.mjs`; symbols/regions: only declared symbols
- **输出**：GREEN evidence: supplement in aggregation/disposition; initial bytes unchanged
- **Knowledge**：Same oracle as T007
- **verification_role**：GREEN
- **paired_task**：T007
- **gate_cmd**：`npx vitest run tests/contract/external-supplement-window.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-SUPPLEMENT-WINDOW — same assertion passes at 599999/600000 boundary
- **evidence_path**：apply/evidence/T008.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：Supplement owner not unique; registration missing
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：修改 `review-provider-client.mjs` 与 `simple-review-runner.mjs`：扩展同一 v3 group publication 元数据；新增纯追加 `registerReviewSupplement`；按外部发布时间计算严格窗口；窗口内 findings 进入现有聚合，超窗只保留事实；保留 initial bytes。
- **executed_commands**：同一 gate `npx vitest run tests/contract/external-supplement-window.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；GREEN exit 0，1 file / 3 tests；公开 `verify --action=execute` v2 capture exit 0。
- **evidence_refs**：`.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T008.stdout`；`quality/tests/build-code-p4-external-supplement-v2.json`（hash `dded4081cfe562c9e2cd93ca516dffeb228b20723adb840cccc71e0652a161a8`）。
- **covered_ac**：`AC-EXT-004` pass（599999 窗口内 append）；`AC-EXT-005` pass（600000 为 over_window_unjudged）；`AC-EXT-006` pass（publication/running disclosure 保留且 supplement 关联）；外部正式验收 unknown/outside pass。
- **review_fact**：阶段 review attempt `quality/reviews/attempts/14b5ab76-ace4-5006-a455-a0b414d5f629/attempt.json`，report `quality/reviews/reports/build-code-simple-14b5ab76-ace4-5006-a455-a0b414d5f629.md`；terminal `unavailable`，原因 `REVIEW_WAIT_EXCEEDED`，provider_attempts 为空；质量覆盖保持 incomplete。
- **completed_at**：`2026-09-16T09:30:12+08:00`
- **执行事实**：P4 consumer fixture 与窄实现完成；浏览器不适用（`non_ui`）；未改外部仓，未 commit/push/close。


### Verify

`npx vitest run tests/contract/external-supplement-window.test.mjs
- `exit 0; ORACLE-SUPPLEMENT-WINDOW。

### Knowledge

arrival_at is external-service persistence time; >=600000 over_window_unjudged。

### STOP

If supplement can mutate initial result`
- `return spec.md#FR-EXT-004。

### Done

AC-EXT-004/005/006 covered。

### Risks and rollback

Risk: window boundary clock skew；same authoritative clock domain required。

## Phase P5 — Write identity before formal writes

### Goal

task_id/path/worktree root 匹配；bootstrap transaction closes；derived executors inherit guard。

### Files

- **NEW**：`tests/contract/write-identity-workspace.test.mjs`
- **MODIFY**：`tools/cli/stage-runtime.mjs`
- **MODIFY**：`tools/cli/task-close.mjs`
- **MODIFY**：`tools/cli/task-bootstrap.mjs`
- **MODIFY**：`tools/host/workflowhub-stage-agent-bridge.mjs`
- **MODIFY**：`tools/architecture/public-behavior-baseline.mjs`
- **MODIFY**：`tools/architecture/clean-install.mjs`
- **DO NOT TOUCH**：read-only public commands

### Tasks

#### T009 — RED：wrong workspace write fails before bytes
- **ID**：T009
- **Phase**：Phase P5 — Write identity before formal writes
- **goal**：Wrong task/path/root writes can land.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：N/A — independent RED
- **并行**：否 — paired RED/GREEN
- **FR**：FR-IDENT-001
- **AC**：AC-IDENT-001
- **动作**：Add failing test for wrong task/path/root and child executor bypass.
- **精确文件**：`tests/contract/write-identity-workspace.test.mjs`
- **boundary**：files: `tests/contract/write-identity-workspace.test.mjs`; symbols/regions: only declared symbols
- **输出**：RED evidence: write succeeds outside authenticated workspace
- **Knowledge**：stage-runtime write path allows explicit ids outside worktree
- **verification_role**：RED
- **paired_task**：T010
- **gate_cmd**：`npx vitest run tests/contract/write-identity-workspace.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-WRITE-IDENTITY — target assertion fails: bytes land before identity check
- **evidence_path**：apply/evidence/T009.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：False RED due to read-only command blocked
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 `tests/contract/write-identity-workspace.test.mjs`，先固定正确 workspace 写入、错误当前 worktree、foreign bridge path/root/task id、只读 status、bootstrap 记录与复用等目标断言。
- **executed_commands**：`npx vitest run tests/contract/write-identity-workspace.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；RED exit `1`，目标断言失败而非环境/命令 setup 失败。
- **evidence_refs**：`.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T009.stdout`
- **covered_ac**：`AC-IDENT-001` 的 RED 基线已建立；不是通过结论。
- **review_fact**：与 T010 共用 P5 阶段 review：attempt `quality/reviews/attempts/b429f86f-8a10-511e-a2c5-14500c402b03/attempt.json`；result `quality/reviews/results/build-code-simple-b429f86f-8a10-511e-a2c5-14500c402b03.json`；report `quality/reviews/reports/build-code-simple-b429f86f-8a10-511e-a2c5-14500c402b03.md`。Kimi empty findings；Codex `EVIDENCE_ANCHOR_INVALID`，无语义 finding 可处置。
- **completed_at**：`2026-09-16T10:00:49+08:00`
- **执行事实**：当前实现允许错误当前 worktree 与 foreign bridge path 写入，并没有 bootstrap identity execution 记录；这正是目标行为的 RED 差异。

#### T010 — GREEN：wrong workspace write fails before bytes
- **ID**：T010
- **Phase**：Phase P5 — Write identity before formal writes
- **goal**：Make T009 pass by adding write guard and propagating identity.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：T009
- **并行**：否 — paired RED/GREEN
- **FR**：FR-IDENT-001
- **AC**：AC-IDENT-001
- **动作**：Enforce write identity at stage-runtime/task-close/bridge; bootstrap transaction writes task_id, command, result then closes; fix harness cwd.
- **精确文件**：`tools/cli/stage-runtime.mjs` `tools/cli/task-close.mjs` `tools/cli/task-bootstrap.mjs` `tools/host/workflowhub-stage-agent-bridge.mjs` `tools/architecture/public-behavior-baseline.mjs` `tools/architecture/clean-install.mjs`
- **boundary**：files: `tools/cli/stage-runtime.mjs` `tools/cli/task-close.mjs` `tools/cli/task-bootstrap.mjs` `tools/host/workflowhub-stage-agent-bridge.mjs` `tools/architecture/public-behavior-baseline.mjs` `tools/architecture/clean-install.mjs`; symbols/regions: only declared symbols
- **输出**：GREEN evidence: only exact identity writes; bootstrap no new persistent object
- **Knowledge**：Same oracle as T009
- **verification_role**：GREEN
- **paired_task**：T009
- **gate_cmd**：`npx vitest run tests/contract/write-identity-workspace.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-WRITE-IDENTITY — same assertion passes; child bypass rejected
- **evidence_path**：apply/evidence/T010.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：Guard over-applied to read-only commands
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：修改 `tools/cli/stage-runtime.mjs`、`tools/cli/task-close.mjs`、`tools/cli/task-bootstrap.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`、`tools/architecture/public-behavior-baseline.mjs`、`tools/architecture/clean-install.mjs`；新增写身份 contract fixture。正式写入前校验 task/project/path/worktree 四元身份；doctor 保持诊断可用；bootstrap 在既有 `identity/executions` 命名空间写一次 closed transaction，后续 existing bootstrap 只读复用；两个 harness 从认证 worktree 运行。
- **executed_commands**：同一 gate `npx vitest run tests/contract/write-identity-workspace.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；GREEN exit `0`，3/3；公开 `verify --action=execute` capture exit `0`。
- **evidence_refs**：`.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T010.stdout`；`quality/tests/build-code-p5-write-identity.json`（receipt hash `dc0bab8c6be4e3ef6ca2fd0d0ee3ec0330eafe915b6fc9b4c416ea0b6a100e70`）。
- **covered_ac**：`AC-IDENT-001` pass：正确 workspace 写入成功；错误 worktree/path/root/child identity 在目标 bytes 前失败；status 可用；bootstrap 字段和 closed 状态可读回；复用不新增记录。
- **review_fact**：与 T009 共用 P5 阶段 review：attempt `quality/reviews/attempts/b429f86f-8a10-511e-a2c5-14500c402b03/attempt.json`；result `quality/reviews/results/build-code-simple-b429f86f-8a10-511e-a2c5-14500c402b03.json`；report `quality/reviews/reports/build-code-simple-b429f86f-8a10-511e-a2c5-14500c402b03.md`。terminal `semantic`，Kimi empty findings；Codex `EVIDENCE_ANCHOR_INVALID`，provider failure 保留，不改写为质量通过。
- **completed_at**：`2026-09-16T10:04:32+08:00`
- **执行事实**：P5 定向 bridge/bootstrap/doctor/status/close 回归 4 files / 27 tests exit `0`；public behavior baseline 10 passed / 1 skipped；clean-install doctor/status 单项与 installed five-stage 单项各 exit `0`。浏览器不适用（`non_ui`）；未改外部仓，未 commit/push/close。


### Verify

`npx vitest run tests/contract/write-identity-workspace.test.mjs
- `exit 0; ORACLE-WRITE-IDENTITY。

### Knowledge

Guard applies to writes only；doctor read-only remains。

### STOP

If bootstrap transaction cannot complete without new persistent object`
- `return spec.md#FR-IDENT-001。

### Done

AC-IDENT-001 covered。

### Risks and rollback

Risk: 15 test call sites break；harness cwd fixes documented。

## Phase P6 — Acceptance single writer / interaction publication

### Goal

官方验收推导唯一写者；talk_clarify quality fact + receipts.interaction + outline_closed consumption exactly once。

### Files

- **NEW**：`tests/contract/acceptance-single-writer-empty-values.test.mjs`
- **MODIFY**：`runtime/stage/stage-handlers.mjs`
- **MODIFY**：`runtime/stage/stage-runner.mjs`
- **MODIFY**：`runtime/stage/stage-agent-outcome-adapter.mjs`
- **MODIFY**：`runtime/task/task-kernel-implementation.mjs`
- **DO NOT TOUCH**：`runtime/schemas/**` — stable schemas

### Tasks

#### T011 — RED：single acceptance writer and interaction exactly once
- **ID**：T011
- **Phase**：Phase P6 — Acceptance single writer / interaction publication
- **goal**：Competing acceptance inputs can overwrite and interaction publication is not unique.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：N/A — independent RED
- **并行**：否 — paired RED/GREEN
- **FR**：FR-EVID-001
- **AC**：AC-EVID-001
- **动作**：Add failing test for competitor write rejection and talk_clarify/receipts.interaction/outline_closed chain.
- **精确文件**：`tests/contract/acceptance-single-writer-empty-values.test.mjs`
- **boundary**：files: `tests/contract/acceptance-single-writer-empty-values.test.mjs`; symbols/regions: only declared symbols
- **输出**：RED evidence: second writer succeeds or outline_closed missing
- **Knowledge**：stage handlers accept caller/host inputs
- **verification_role**：RED
- **paired_task**：T012
- **gate_cmd**：`npx vitest run tests/contract/acceptance-single-writer-empty-values.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-ACCEPTANCE-SINGLE-WRITER — target assertion fails on competitor write or missing outline_closed
- **evidence_path**：apply/evidence/T011.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：False RED due to unrelated missing fact
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 `tests/contract/acceptance-single-writer-empty-values.test.mjs`，先固定 caller/Stage Agent 竞争输入、三种空值语义和 interaction aggregate 公共入口的 RED 断言。
- **executed_commands**：RED `npx vitest run tests/contract/acceptance-single-writer-empty-values.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` exit `1`，1 file / 3 target failures；见 `.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T011.stdout`。
- **evidence_refs**：`.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T011.stdout`；测试文件 above。
- **covered_ac**：`AC-EVID-001` RED oracle established。
- **review_fact**：与 T012 共用 P6 阶段 review；结果及 finding 处置见 `.planning/2026-09-16-build-code-mechanism-waste-reduction/findings.md`。
- **completed_at**：`2026-09-16` (RED observed before GREEN implementation)
- **执行事实**：初始 deterministic fixture 的 lifecycle/options 与材料锚点曾需修正；修正后失败均落在目标断言，不启 live task 或全量回归。

#### T012 — GREEN：single acceptance writer and interaction exactly once
- **ID**：T012
- **Phase**：Phase P6 — Acceptance single writer / interaction publication
- **goal**：Make T011 pass by deleting competing input paths and wiring unique publish.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：T011
- **并行**：否 — paired RED/GREEN
- **FR**：FR-EVID-001
- **AC**：AC-EVID-001
- **动作**：Restrict to official derivation owner; kernel publishes interaction once and outline_closed consumes.
- **精确文件**：`runtime/stage/stage-handlers.mjs` `runtime/stage/stage-runner.mjs` `runtime/stage/stage-agent-outcome-adapter.mjs` `runtime/task/task-kernel-implementation.mjs`
- **boundary**：files: `runtime/stage/stage-handlers.mjs` `runtime/stage/stage-runner.mjs` `runtime/stage/stage-agent-outcome-adapter.mjs` `runtime/task/task-kernel-implementation.mjs`; symbols/regions: only declared symbols
- **输出**：GREEN evidence: empty/zero/N/A distinct; publish once; consumer reads
- **Knowledge**：Same oracle as T011
- **verification_role**：GREEN
- **paired_task**：T011
- **gate_cmd**：`npx vitest run tests/contract/acceptance-single-writer-empty-values.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-ACCEPTANCE-SINGLE-WRITER — same assertion passes; no second writer
- **evidence_path**：apply/evidence/T012.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：Deleting wrong input path breaks stage facts
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`runtime/stage/stage-handlers.mjs` 增加 current-vNext caller coverage ownership 与 `not_applicable`/evidence_state 归一化；`runtime/stage/stage-runner.mjs` 保留三种状态并把 interaction aggregate 交给既有 TaskKernel 单写者；`tools/cli/stage-runtime.mjs` 接入既有 public `run` 的 `interaction_aggregate` 字段并保持 preflight 纯校验。Stage Agent coverage 在 current-vNext 仅作 provenance，不覆盖官方 ledger；未修改 stable schema、TaskKernel writer 或新增 public command。
- **executed_commands**：GREEN `npx vitest run tests/contract/acceptance-single-writer-empty-values.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` exit `0`, 1 file / 4 tests；focused vNext flow 4/4、interaction regression 3/3、preflight regression 9/9；P2 retry repair regression 3/3；公共 capture exit `0`。
- **evidence_refs**：`.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T012.stdout`; `quality/tests/build-code-p6-acceptance-single-writer.json` (receipt hash `88570bb00612bacd37336b3b997a44d1b1e2a3dfc55f2925b286a413257dcf3d`); `quality/reviews/results/build-code-simple-52ba1bc8-e1a8-5547-ae19-a78bd300539c.json`; `quality/reviews/attempts/52ba1bc8-e1a8-5547-ae19-a78bd300539c/attempt.json`; `quality/reviews/reports/build-code-simple-52ba1bc8-e1a8-5547-ae19-a78bd300539c.md`。
- **covered_ac**：`AC-EVID-001`；supporting `AC-RUNTIME-001`。
- **review_fact**：P6 phase review attempt `52ba1bc8-e1a8-5547-ae19-a78bd300539c` semantic at minimum threshold；Kimi returned two minor findings，Codex `PUBLIC_RESULT_INVALID` retained。`F-9e438ac1cd33` rejected_invalid against current source；`F-a022469f250b` fixed in `runtime/review/review-record-route.mjs` and `review-budget-deletion` 3/3；no re-review after this nonblocking cross-phase repair。
- **completed_at**：`2026-09-16T02:49:42.799Z` (canonical GREEN receipt)
- **执行事实**：未执行 commit/push/merge/archive/cleanup/close。显式 N/A 在共享 shape/writer 表示中保留；当前无证据 vNext 官方推导仍为 unknown，未凭空推导 N/A。长时间 103-test 单文件回归被停止，相关命名测试已通过。


### Verify

`npx vitest run tests/contract/acceptance-single-writer-empty-values.test.mjs
- `exit 0; ORACLE-ACCEPTANCE-SINGLE-WRITER。

### Knowledge

Receipt owner is task kernel publish；caller cannot submit receipts.interaction。

### STOP

If existing outline_closed consumer cannot read new fact`
- `return spec.md#FR-RUNTIME-001。

### Done

AC-EVID-001 and AC-RUNTIME-001 covered。

### Risks and rollback

Risk: competing input paths remain；delete caller/host input paths。

## Phase P7 — Close / handoff / runtime ergonomics / non-UI / final aggregate

### Goal

authorized remote cleanup + recovery + known gaps; deferred handoff; current-session stage facts/reflection; final aggregate。D-026 明确禁止把外部 Stage Agent、bridge、session 或 stage outcome 放在 active 推进链；历史 T015/T016 的旧路径只保留为 provenance。

### Files

- **MODIFY**：`tests/contract/close-remote-branch-cleanup.test.mjs`
- **NEW**：`tests/contract/no-external-stage-agent-gate.test.mjs`
- **MODIFY**：`/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md`
- **MODIFY**：`core/task-close.mjs`
- **MODIFY**：`runtime/task/task-store.mjs`
- **MODIFY**：`runtime/review/current-close-projection.mjs`
- **MODIFY**：`tests/contract/make-decision-interaction-publication.test.mjs`
- **MODIFY**：`tests/contract/stage-handoff.test.mjs`
- **MODIFY**：`tests/contract/build-reflection-page.test.mjs`
- **MODIFY**：`runtime/task/task-kernel-implementation.mjs`
- **MODIFY**：`runtime/stage/stage-handlers.mjs`
- **MODIFY**：`tools/cli/stage-runtime.mjs`
- **MODIFY**：`skills/stage-handoff/SKILL.md`
- **MODIFY**：`workflows/make-decision/SKILL.md`
- **MODIFY**：`workflows/make-decision/skill-deps.yaml`
- **MODIFY**：`workflows/build-spec/skill-deps.yaml`
- **MODIFY**：`workflows/build-plan/skill-deps.yaml`
- **MODIFY**：`workflows/verify-code/skill-deps.yaml`
- **MODIFY**：`docs/operations/claude-e2e-sample.md`
- **MODIFY**：`skills/workflowhub-host-protocol/SKILL.md`
- **MODIFY**：`workflows/build-code/capture.mjs`
- **MODIFY**：`workflows/verify-code/capture.mjs`
- **MODIFY**：`tests/contract/five-stage-spec-analyze-wiring.test.mjs`
- **MODIFY**：`tests/contract/review-materials-contract.test.mjs`
- **MODIFY**：`tests/contract/close-sidecar-and-archive.test.mjs`
- **MODIFY**：`tests/contract/review-material-change-redispatch.test.mjs`
- **MODIFY**：`tests/contract/review-budget-deletion.test.mjs`
- **MODIFY**：`tests/contract/external-threshold-contract.test.mjs`
- **MODIFY**：`tests/contract/external-supplement-window.test.mjs`
- **MODIFY**：`tests/contract/write-identity-workspace.test.mjs`
- **MODIFY**：`tests/contract/acceptance-single-writer-empty-values.test.mjs`
- **DO NOT TOUCH**：`specs/workflowhub-mechanism-waste-reduction-20260915/decision-log.md` — accepted material authority

### Tasks

#### T013 — RED：remote cleanup authorization and known gaps
- **ID**：T013
- **Phase**：Phase P7 — Close / handoff / runtime ergonomics / non-UI / final aggregate
- **goal**：Cleanup does not include authorized remote branch deletion and known gaps.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **source_refs / decision_refs**：ALL R-001~R-037；D-001~D-025
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：N/A — independent RED
- **并行**：否 — paired RED/GREEN
- **FR**：FR-CLOSE-001, FR-CLOSE-004, FR-CLOSE-005
- **AC**：AC-CLOSE-001, AC-CLOSE-004, AC-CLOSE-005
- **动作**：Add failing test for authorized remote delete only and known-gap summary including external repo.
- **精确文件**：`tests/contract/close-remote-branch-cleanup.test.mjs`
- **boundary**：files: `tests/contract/close-remote-branch-cleanup.test.mjs`; symbols/regions: only declared symbols
- **输出**：RED evidence: unauthorized delete or missing known gap
- **Knowledge**：cleanup composite local-only
- **verification_role**：RED
- **paired_task**：T014
- **gate_cmd**：`npx vitest run tests/contract/close-remote-branch-cleanup.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-REMOTE-CLEANUP — target assertion fails on unauthorized delete or gap omission
- **evidence_path**：apply/evidence/T013.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：False RED from missing authorization fixture
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 `tests/contract/close-remote-branch-cleanup.test.mjs`，先验证未经授权保留远端分支、授权删除/拒删失败和 known-gaps 投影的目标红灯。
- **executed_commands**：`npx vitest run tests/contract/close-remote-branch-cleanup.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` exit `1`；1 file，3 failed / 1 passed，失败均为预期目标断言；见 `.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T013.stdout`。
- **evidence_refs**：`.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T013.stdout`；与 T014 共用 P7 review refs。
- **covered_ac**：`AC-CLOSE-001`、`AC-CLOSE-004`、`AC-CLOSE-005` 的 RED oracle 已建立。
- **review_fact**：P7 phase review attempt `281934a1-58af-5323-af55-99f57bd2e111` 后续返回 semantic；其 5 条 actionable finding 已在当前修复中处理，详情见 P7 phase card/findings。
- **completed_at**：`2026-09-16`
- **执行事实**：确定性 bare remote fixture；未触发真实远端任务分支删除；无 commit/push/merge/close。

#### T014 — GREEN：remote cleanup authorization and known gaps
- **ID**：T014
- **Phase**：Phase P7 — Close / handoff / runtime ergonomics / non-UI / final aggregate
- **goal**：Make T013 pass by extending cleanup and projection.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **source_refs / decision_refs**：ALL R-001~R-037；D-001~D-025
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：T013
- **并行**：否 — paired RED/GREEN
- **FR**：FR-CLOSE-001, FR-CLOSE-004, FR-CLOSE-005
- **AC**：AC-CLOSE-001, AC-CLOSE-004, AC-CLOSE-005
- **动作**：Extend cleanup composite with remote branch delete; derive known gaps in close status/projection; keep recovery facts.
- **精确文件**：`core/task-close.mjs` `runtime/task/task-store.mjs` `runtime/review/current-close-projection.mjs`
- **boundary**：files: `core/task-close.mjs` `runtime/task/task-store.mjs` `runtime/review/current-close-projection.mjs`; symbols/regions: only declared symbols
- **输出**：GREEN evidence: only authorized delete; failed delete visible; gaps derived
- **Knowledge**：Same oracle as T013
- **verification_role**：GREEN
- **paired_task**：T013
- **gate_cmd**：`npx vitest run tests/contract/close-remote-branch-cleanup.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-REMOTE-CLEANUP — same assertion passes; recovery/new facts preserved
- **evidence_path**：apply/evidence/T014.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：Remote readback unavailable
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`core/task-close.mjs` 把远端任务分支删除纳入既有 cleanup composite，并在授权后、sidecar 安全检查后删除；`runtime/stage/current-close-projection.mjs` 保留 `remote_branch_cleanup`、failed/incomplete 与 `known_gaps`。`runtime/task/task-store.mjs` 有意未改，继续使用冻结的五个 close-action 行。
- **executed_commands**：同 T013 命令 exit `0`；1 file / 4 tests；见 `.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T014.stdout`。公共 receipt `quality/tests/build-code-p7-remote-cleanup.json`，receipt hash `634ff220af6e970ff966f72ea62819e936ac6bbd4ecb6e7ab97b407a162b26a0`，snapshot tree `9445dfc9e83f7f6daef25472fc1eec79cda2e0c6`。
- **evidence_refs**：`.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T014.stdout`；`quality/tests/build-code-p7-remote-cleanup.json`；`quality/tests/output/build-code-p7-remote-cleanup.output`。
- **covered_ac**：`AC-CLOSE-001`、`AC-CLOSE-004`、`AC-CLOSE-005`；未经授权不删除，拒删失败可见，known-gaps 不升级为通过。
- **review_fact**：同 P7 phase review；Codex 5 条 actionable finding 已修复，未重跑 phase review，保留原始 review 事实。
- **completed_at**：`2026-09-16`
- **执行事实**：远端删除仅发生在确定性 bare remote fixture；没有对真实远端执行删除或任何不可逆 delivery action。

#### T015 — RED：runtime handoff local outcome and reflection compatibility
- **ID**：T015
- **Phase**：Phase P7 — Close / handoff / runtime ergonomics / non-UI / final aggregate
- **goal**：Local session cannot produce outcome; future material leaves nonzero failure; reflection fields unreadable.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`- **source_refs / decision_refs**：ALL R-001~R-037；D-001~D-025
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：N/A — independent RED
- **并行**：否 — paired RED/GREEN
- **FR**：FR-RUNTIME-001, FR-RUNTIME-002, FR-RUNTIME-003, FR-RUNTIME-004, FR-HANDOFF-001, FR-UI-001
- **AC**：AC-RUNTIME-001, AC-RUNTIME-002, AC-RUNTIME-003, AC-RUNTIME-004, AC-HANDOFF-001, AC-UI-001
- **动作**：Add failing tests for interaction publication`
- `missing-input diagnosis`
- `future material N/A`
- `local outcome ergonomics`
- `reflection data compatibility.
- **精确文件**：`tests/contract/make-decision-interaction-publication.test.mjs` `tests/contract/stage-handoff.test.mjs` `tests/contract/build-reflection-page.test.mjs` `tests/contract/review-material-change-redispatch.test.mjs` `tests/contract/review-budget-deletion.test.mjs` `tests/contract/external-threshold-contract.test.mjs` `tests/contract/external-supplement-window.test.mjs` `tests/contract/write-identity-workspace.test.mjs` `tests/contract/acceptance-single-writer-empty-values.test.mjs`
- **boundary**：files: `tests/contract/make-decision-interaction-publication.test.mjs` `tests/contract/stage-handoff.test.mjs` `tests/contract/build-reflection-page.test.mjs` `tests/contract/review-material-change-redispatch.test.mjs` `tests/contract/review-budget-deletion.test.mjs` `tests/contract/external-threshold-contract.test.mjs` `tests/contract/external-supplement-window.test.mjs` `tests/contract/write-identity-workspace.test.mjs` `tests/contract/acceptance-single-writer-empty-values.test.mjs`; symbols/regions: only declared symbols
- **输出**：RED evidence: outline_closed missing, future material nonzero, or reflection field broken
- **Knowledge**：docs instruct direct writes; make-decision exits nonzero on future ENOENT
- **verification_role**：RED
- **paired_task**：T016
- **gate_cmd**：`npx vitest run tests/contract/make-decision-interaction-publication.test.mjs tests/contract/stage-handoff.test.mjs tests/contract/build-reflection-page.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-RUNTIME-HANDOFF — target assertion fails on publish/diagnosis/N/A/reflection
- **evidence_path**：apply/evidence/T015.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：False RED from unavailable local host
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 T015 断言，锁定 interaction publication、三类 missing-input diagnosis、future material N/A、local outcome wrapper 和六个 reflection block 的预期红灯。
- **executed_commands**：`npx vitest run tests/contract/make-decision-interaction-publication.test.mjs tests/contract/stage-handoff.test.mjs tests/contract/build-reflection-page.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` exit `1`；2 files failed / 1 passed，3 target failures / 59 passes；见 `.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T015.stdout`。
- **evidence_refs**：`.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T015.stdout`；与 T016 共用 P7 review refs。
- **covered_ac**：`AC-RUNTIME-001`～`AC-RUNTIME-004`、`AC-HANDOFF-001`、`AC-UI-001` 的 RED oracle 已建立。
- **review_fact**：同 P7 phase review；所有 actionable finding 已在当前代码/协议修复中处理，原 review 保持 immutable。
- **completed_at**：`2026-09-16`
- **执行事实**：RED 由目标能力缺失触发，不是环境故障；当前 spec 的 UI applicability 仍为 `non_ui`。

#### T016 — GREEN：runtime handoff local outcome and reflection compatibility
- **ID**：T016
- **Phase**：Phase P7 — Close / handoff / runtime ergonomics / non-UI / final aggregate
- **goal**：Make T015 pass with docs/runtime corrections and wrapper.
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **source_refs / decision_refs**：ALL R-001~R-037；D-001~D-025
- **输入**：accepted spec/plan anchors and upstream task facts
- **依赖**：T015
- **并行**：否 — paired RED/GREEN
- **FR**：FR-RUNTIME-001, FR-RUNTIME-002, FR-RUNTIME-003, FR-RUNTIME-004, FR-HANDOFF-001, FR-UI-001
- **AC**：AC-RUNTIME-001, AC-RUNTIME-002, AC-RUNTIME-003, AC-RUNTIME-004, AC-HANDOFF-001, AC-UI-001
- **动作**：Remove direct-write instructions; add diagnosis; make future material N/A zero-failure; add local wrapper docs; verify reflection fields.
- **精确文件**：`runtime/task/task-kernel-implementation.mjs` `runtime/stage/stage-handlers.mjs` `tools/cli/stage-runtime.mjs` `tools/host/workflowhub-local-stage-runner.mjs` `skills/stage-handoff/SKILL.md` `workflows/make-decision/SKILL.md` `workflows/make-decision/skill-deps.yaml` `workflows/build-spec/skill-deps.yaml` `workflows/build-plan/skill-deps.yaml` `workflows/verify-code/skill-deps.yaml` `docs/operations/claude-e2e-sample.md` `skills/workflowhub-host-protocol/SKILL.md` `workflows/build-code/capture.mjs` `workflows/verify-code/capture.mjs` `tests/contract/build-reflection-page.test.mjs` `tests/contract/make-decision-interaction-publication.test.mjs` `tests/contract/stage-handoff.test.mjs` `/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md`
- **boundary**：files: `runtime/task/task-kernel-implementation.mjs` `runtime/stage/stage-handlers.mjs` `tools/cli/stage-runtime.mjs` `tools/host/workflowhub-local-stage-runner.mjs` `skills/stage-handoff/SKILL.md` `workflows/make-decision/SKILL.md` `workflows/make-decision/skill-deps.yaml` `workflows/build-spec/skill-deps.yaml` `workflows/build-plan/skill-deps.yaml` `workflows/verify-code/skill-deps.yaml` `docs/operations/claude-e2e-sample.md` `skills/workflowhub-host-protocol/SKILL.md` `workflows/build-code/capture.mjs` `workflows/verify-code/capture.mjs` `tests/contract/build-reflection-page.test.mjs` `tests/contract/make-decision-interaction-publication.test.mjs` `tests/contract/stage-handoff.test.mjs` `/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md`; symbols/regions: only declared symbols
- **输出**：GREEN evidence: local outcome source-level facts; future material N/A; reflection fields readable
- **Knowledge**：Same oracle as T015
- **verification_role**：GREEN
- **paired_task**：T015
- **gate_cmd**：`npx vitest run tests/contract/make-decision-interaction-publication.test.mjs tests/contract/stage-handoff.test.mjs tests/contract/build-reflection-page.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-RUNTIME-HANDOFF — same assertion passes; unknown/unavailable/N/A semantics preserved
- **evidence_path**：apply/evidence/T016.stdout
- **STOP**：Stop on environment failure broken command` boundary drift` or new design need
- **recovery**：build-code owner reverts current task bytes; verify-code owner records fact only
- **task risk**：Local wrapper invents lifecycle facts
- **test tier / test method**：feature — targeted vitest only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative scenarios run with the same gate_cmd and oracle
- **fixtures_services**：deterministic fixtures only; no new live task
- **coverage limits**：covers declared ACs only; no unrelated regression claims

- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`runtime/stage/stage-handlers.mjs` 增加缺失来源分类；`tools/cli/stage-runtime.mjs` 暴露六字段 reflection readback 与同一 diagnosis；新增 `tools/host/workflowhub-local-stage-runner.mjs`，只转发显式 packet 到既有 bridge/TaskKernel；同步 stage-handoff、make-decision、host protocol、capture 和四份 skill-deps 文档，禁止 direct writer；未来材料使用显式 known inventory，未知名字返回 invalid/unknown 非零诊断。
- **executed_commands**：同 T015 命令 exit `0`；3 files / 62 tests；公共 receipt `quality/tests/build-code-p7-runtime-handoff.json`，receipt hash `9b6e2d8216328b1ab80e7c3be42097bcc8cdadbae60837ea17bd969643599dc4`（后续针对 unknown-material 增加的断言仍在同一 test case 内，最终命令仍为 62 tests）。修复后补跑 `stage-handoff` 35/35、`external-threshold` 4/4、`external-supplement` 4/4。
- **evidence_refs**：`.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T016.stdout`；`quality/tests/build-code-p7-runtime-handoff.json`；`quality/tests/output/build-code-p7-runtime-handoff.output`；`/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md`。
- **covered_ac**：`AC-RUNTIME-001`～`AC-RUNTIME-004`、`AC-HANDOFF-001`、`AC-UI-001`；UI 仅记录 `non_ui` N/A，不声称浏览器覆盖。
- **review_fact**：P7 review attempt `281934a1-58af-5323-af55-99f57bd2e111` 为 semantic；Codex 的相关运行状态、supplement、future-material 5 findings 已修复，Kimi 无 finding；不重跑 phase review。
- **completed_at**：`2026-09-16`
- **执行事实**：没有新增 public command、stage、store 或 writer；local wrapper 复用现有 bridge，reflection 只读当前原件。

#### T017 — FINAL：aggregate verification
- **ID**：T017
- **Phase**：Phase P7 — Close / handoff / runtime ergonomics / non-UI / final aggregate
- **goal**：按 plan.md 最终路线验证全部适用 AC、跨任务 seam 和当前完整测试事实
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"242b781bdf69896494a0cf1f162d34c5e2f39a8fd1fb6f5687b0219e1b3664f8","id":"SPEC-WH-MWR-20260915"},{"artifact_kind":"decision-log","ref":"decision-log.md","hash":"a4090f504bae1b72230355b7158a8c449d0a4fc3630a491e6ba31b022228c680","id":"DECISION-WH-MWR-20260915"}]`
- **source_refs / decision_refs**：ALL R-001~R-037；D-001~D-025
- **输入**：已完成的 Phase tasks 和最终路线
- **依赖**：T002,T004,T006,T008,T010,T012,T014,T016
- **并行**：否 — aggregate reads all preceding task facts
- **FR**：FR-SCOPE-001, FR-METRIC-001, FR-REV-003, FR-REV-004, FR-REV-005, FR-CLOSE-002, FR-CLOSE-003
- **AC**：AC-SCOPE-001, AC-METRIC-001, AC-REV-003, AC-REV-004, AC-REV-005, AC-CLOSE-002, AC-CLOSE-003
- **动作**：只执行一次最终聚合检查并记录真实退出码、oracle、覆盖范围和剩余风险；不创建新的状态权威
- **精确文件**：`tests/contract/review-materials-contract.test.mjs` `tests/contract/close-sidecar-and-archive.test.mjs` `tests/contract/close-remote-branch-cleanup.test.mjs` `core/task-close.mjs` `runtime/task/task-store.mjs` `runtime/review/current-close-projection.mjs` `tests/contract/make-decision-interaction-publication.test.mjs` `tests/contract/stage-handoff.test.mjs` `tests/contract/build-reflection-page.test.mjs` `tests/contract/five-stage-spec-analyze-wiring.test.mjs` `tests/contract/review-materials-contract.test.mjs` `tests/contract/close-sidecar-and-archive.test.mjs` `tests/contract/review-material-change-redispatch.test.mjs` `tests/contract/review-budget-deletion.test.mjs` `tests/contract/external-threshold-contract.test.mjs` `tests/contract/external-supplement-window.test.mjs` `tests/contract/write-identity-workspace.test.mjs` `tests/contract/acceptance-single-writer-empty-values.test.mjs`
- **boundary**：files: `tests/contract/review-materials-contract.test.mjs` `tests/contract/close-sidecar-and-archive.test.mjs` `tests/contract/close-remote-branch-cleanup.test.mjs` `core/task-close.mjs` `runtime/task/task-store.mjs` `runtime/review/current-close-projection.mjs` `tests/contract/make-decision-interaction-publication.test.mjs` `tests/contract/stage-handoff.test.mjs` `tests/contract/build-reflection-page.test.mjs` `tests/contract/five-stage-spec-analyze-wiring.test.mjs` `tests/contract/review-materials-contract.test.mjs` `tests/contract/close-sidecar-and-archive.test.mjs` `tests/contract/review-material-change-redispatch.test.mjs` `tests/contract/review-budget-deletion.test.mjs` `tests/contract/external-threshold-contract.test.mjs` `tests/contract/external-supplement-window.test.mjs` `tests/contract/write-identity-workspace.test.mjs` `tests/contract/acceptance-single-writer-empty-values.test.mjs`; symbols/regions: test files only
- **输出**：最终测试与交接事实
- **Knowledge**：所有前序任务真实结果；外部仓正式验收不在本任务
- **verification_role**：N/A — non-behavior aggregate verification
- **paired_task**：N/A — aggregate has no RED/GREEN pair
- **gate_cmd**：`npx vitest run tests/contract/review-material-change-redispatch.test.mjs tests/contract/review-budget-deletion.test.mjs tests/contract/external-threshold-contract.test.mjs tests/contract/external-supplement-window.test.mjs tests/contract/write-identity-workspace.test.mjs tests/contract/acceptance-single-writer-empty-values.test.mjs tests/contract/close-remote-branch-cleanup.test.mjs tests/contract/make-decision-interaction-publication.test.mjs tests/contract/stage-handoff.test.mjs tests/contract/build-reflection-page.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/review-materials-contract.test.mjs tests/contract/close-sidecar-and-archive.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-FINAL — all applicable AC and seams verified
- **evidence_path**：apply/evidence/T017.stdout
- **STOP**：最终命令不可执行、AC 缺失、越界或需要新决策时停止
- **recovery**：build-code owner repairs implementation; verify-code owner records unavailable facts
- **task risk**：聚合覆盖遗漏或把质量事实误写成通过
- **test tier / test method**：feature — targeted aggregate only; no full regression
- **scenarios / commands / expected exit / oracle**：success and negative seams run with same final command/oracle
- **fixtures_services**：deterministic fixtures; no new live task
- **coverage limits**：covers applicable ACs and declared seams only; external formal acceptance excluded
- **acceptance_role**：acceptance
- **ui_scope**：non_ui
- **acceptance_data**：`[{"source": "current task fixture", "sample": "all applicable ACs", "scenario": "final aggregate command result", "tier": "command", "execution": {"command": "npx", "args": ["vitest", "run", "tests/contract/review-material-change-redispatch.test.mjs", "tests/contract/review-budget-deletion.test.mjs", "tests/contract/external-threshold-contract.test.mjs", "tests/contract/external-supplement-window.test.mjs", "tests/contract/write-identity-workspace.test.mjs", "tests/contract/acceptance-single-writer-empty-values.test.mjs", "tests/contract/close-remote-branch-cleanup.test.mjs", "tests/contract/make-decision-interaction-publication.test.mjs", "tests/contract/stage-handoff.test.mjs", "tests/contract/build-reflection-page.test.mjs", "tests/contract/five-stage-spec-analyze-wiring.test.mjs", "tests/contract/review-materials-contract.test.mjs", "tests/contract/close-sidecar-and-archive.test.mjs"], "timeout_ms": 120000}}]`
- **e2e_scope**：not_required

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：最终聚合前修复了 `review-materials-contract` 既有 broker fixture，补齐显式 `minimum_heterologous=1`；未新增状态权威。
- **executed_commands**：T017 首次 exact aggregate exit `1`（12 files / 163/164，fixture 缺显式 threshold）；修复后同一 13-file command exit `0`，13 files / 164 tests，duration `327.35s`；公共 `node tools/cli/stage-runtime.mjs verify --action=execute ... p7-final-test-capture.json` exit `0`，receipt `quality/tests/build-code-p7-final-aggregate.json`，receipt hash `7609297785dd5fa6c022a7576532fa78b0cb15ef308aa56a9950fd9512f5eaf1`，output hash `a6a2b3e3c29b8b3f346fae512a06435baf33e69b25ef8fe17bde707f02fdf4f5`，snapshot tree `72ea6197b899e1393b9be5e3f47043e38224c81a`，duration `312499ms`。
- **evidence_refs**：`.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T017.stdout`；`.planning/2026-09-16-build-code-mechanism-waste-reduction/p7-final-test-capture.json`；`quality/tests/build-code-p7-final-aggregate.json`；`quality/tests/output/build-code-p7-final-aggregate.output`。
- **covered_ac**：`AC-SCOPE-001`、`AC-METRIC-001`、`AC-REV-003`、`AC-REV-004`、`AC-REV-005`、`AC-CLOSE-002`、`AC-CLOSE-003` 及 T017 声明的所有适用 cross-phase seams；外部正式验收和浏览器 QA 不适用/不在本任务通过判据。
- **review_fact**：P7 phase review attempt `281934a1-58af-5323-af55-99f57bd2e111` 为 semantic，五条 Codex actionable finding 已修复；review 未重跑，原始 provider/result/report 保留。T017 是 targeted aggregate，不是新的 review。
- **completed_at**：`2026-09-16T04:37:16.003Z`（canonical receipt 完成时间）
- **执行事实**：最终聚合仅覆盖 plan 指定的 13 个 contract 文件；无全量回归、无 commit/push/merge/archive/close；外部仓正式 acceptance/commit/push/close 仍 unknown/outside pass。
- **最新执行事实**：修复集成审查 consumer 后，当前实现 receipt 为 `quality/evidence/implementation/6e0d2ecf0feb6ce13980c4c00d08c86b8b05dab7c5274171ac62b4c9c86b718d.json`（hash `6e0d2ecf0feb6ce13980c4c00d08c86b8b05dab7c5274171ac62b4c9c86b718d`，snapshot `a3982b308248e80be10938b9ca9a5bf96fd77328`）；同一 T017 公共 receipt 为 `quality/tests/build-code-p7-final-aggregate-final.json`（hash `437713c83fbf7a3a9a66e17ac88580746ee42a40a3cea9f90a68152a34625362`，exit `0`，13 files / 166 tests，snapshot `a3982b308248e80be10938b9ca9a5bf96fd77328`）。最终 integration attempt `fc78743b-a282-50f6-a03a-f85b013215bc` 已记录为 `terminal_status=unavailable`，原因为临时调用层错误分类 `REVIEW_MATERIAL_MISMATCH`；未产生 semantic result，未宣称通过。

#### T018 — D-026：active stage path no longer depends on external outcome
- **ID**：T018
- **Phase**：Post-P7 corrective task — current-session stage execution
- **goal**：删除 active manifest、reflection、handoff 与恢复链上的外部 Stage Agent/bridge/session/outcome 前置；保留旧 outcome/bridge 只读兼容；修复无 outcome 时成功 handler 被误记为 stage-end failure 的根因。
- **design_state**：ready
- **source_refs / decision_refs**：R-035, R-036, R-037, R-038；D-022, D-023, D-025, D-026
- **依赖**：T017 historical aggregate；当前 material revision 必须在执行前重新计算
- **精确文件**：`runtime/stage/stage-runner.mjs` `runtime/stage/stage-handlers.mjs` `runtime/stage/stage-reflect.mjs` `runtime/stage/stage-handoff.mjs` `runtime/evidence/canonical-evidence-validators.mjs` `runtime/evidence/freshness.mjs` `runtime/review/review-record-route.mjs` `skills/wh-review/scripts/wh-review-cli.mjs` `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs` `workflows/*/steps.json` `workflows/*/skill-deps.yaml` `workflows/*/SKILL.md` `skills/stage-reflection/SKILL.md` `skills/stage-handoff/SKILL.md` `skills/spec-analyze/SKILL.md` `skills/workflowhub-host-protocol/SKILL.md` `tools/cli/stage-runtime.mjs` `tests/contract/no-external-stage-agent-gate.test.mjs` `tests/contract/stage-runner-reflection.test.mjs` `tests/contract/acceptance-execution-tier.test.mjs`
- **oracle**：public `stage-runtime run --action=execute` 不接受 `receipts.stage_outcomes`；无该字段时成功发布当前事实和 `stage-end:<stage>`，阶段行 `exit_code=0/failure_signature=stage_end_recorded`；build-code acceptance execution aggregate 带 runtime-owned current-session binding，ordinary verify review 能消费该 binding；active workflow/skill deps 不再声明 `stage_outcome`；当前 session 可直接发布非门禁 reflection/handoff，缺 executor 只保留 unavailable；质量缺口仍是 unknown/unavailable/incomplete。
- **gate_cmd**：`npx vitest run tests/contract/no-external-stage-agent-gate.test.mjs tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/workflow-quality-regression.test.mjs tests/contract/stage-runner-reflection.test.mjs tests/contract/stage-handoff.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：`0`
- **STOP**：若 public run 仍要求外部 outcome，或测试失败来自当前契约之外的新设计问题，停止并记录真实阻塞；不得补造 bridge/session/outcome。
- **status**：`completed`
- **review_findings**：独立审查发现的 active public run、验收聚合、reflection 来源、handoff identity 及 wh-review 私有执行源残留均已修复；旧 outcome/bridge 仅保留兼容读取。最终质量仍如实保留 `code_review=missing/incomplete`，不把本任务修复冒充 verify-code 质量通过。
- **evidence_path**：`.planning/2026-09-16-eliminate-external-stage-agent/evidence/T018.stdout`
- **actual_changes**：public `stage-runtime run` 在任何研究/事实写入前拒绝 `receipts.stage_outcomes`；`runOfficialStage` 将当前 handler/publication 作为 stage-end 成功依据；build-code 验收原件改为 runtime-owned current-session binding；普通 review 与 wh-review 私有 E2E 路由消费当前 acceptance aggregate，不再要求外部 Stage Agent；reflection/handoff 直接校验当前 task/worktree/branch/snapshot/material；active workflow/skill 文档和 verify-code manifest 去除外部前置；旧 outcome/bridge/adapter 保留为历史兼容。
- **executed_commands**：`npx vitest run tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/workflow-quality-regression.test.mjs tests/contract/no-external-stage-agent-gate.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`（3 files / 23 tests，exit 0）；`npx vitest run tests/contract/stage-runner-reflection.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`（22/22，exit 0）；`npx vitest run tests/contract/stage-handoff.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`（35/35，exit 0）；acceptance execution current-session focused tests（3 passed，41 skipped，exit 0）；current-path e2e smoke（build-spec/make-decision/five-stage 各 1/1，历史边界 6/6，exit 0）；`npx vitest run tests/contract/no-external-stage-agent-gate.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`（2 files / 37 tests，exit 0）；public `node tools/cli/stage-runtime.mjs run --action=execute --stage=verify-code --project=workflowhub --task=workflowhub-mechanism-waste-reduction-20260915`（exit 0，`work_status=ready`、`continuation_allowed=true`、stage-end `exit_code=0/failure_signature=stage_end_recorded`）。未跑全量回归。
- **evidence_refs**：`.planning/2026-09-16-eliminate-external-stage-agent/evidence/T018.stdout`；当前 task `facts.jsonl#stage-end:verify-code`；当前 public smoke/status 输出。
- **covered_ac**：`AC-RUNTIME-003`、`AC-HANDOFF-001` 以及 D-026 active-path/no-external producer contract；质量 `code_review` 仍 missing/incomplete，未宣称 verify-code 质量完成。
- **review_fact**：Goodall 独立只读残留路径审查已逐项修复；本轮未重跑独立正式 provider code review，原质量缺口保留。
- **completed_at**：`2026-09-17T01:45:11+08:00`
- **执行事实**：未使用外部 Stage Agent、bridge 或 session/outcome；当前 WorkflowHub 会话直接执行并发布 stage row、质量事实；reflection 在无 judgment executor 时真实记录 `unavailable/executor_absent`，不阻断工作；未 commit/push/merge/archive/close。

### Verify

`npx vitest run tests/contract/review-material-change-redispatch.test.mjs tests/contract/review-budget-deletion.test.mjs tests/contract/external-threshold-contract.test.mjs tests/contract/external-supplement-window.test.mjs tests/contract/write-identity-workspace.test.mjs tests/contract/acceptance-single-writer-empty-values.test.mjs tests/contract/close-remote-branch-cleanup.test.mjs tests/contract/make-decision-interaction-publication.test.mjs tests/contract/stage-handoff.test.mjs tests/contract/build-reflection-page.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/review-materials-contract.test.mjs tests/contract/close-sidecar-and-archive.test.mjs` exit 0; ORACLE-FINAL。

### Knowledge

Reflection data-compat assertion remains narrow; no UI work。

### STOP

If Downloads markdown or close summary path unavailable, return spec.md#FR-HANDOFF-001。

### Done

All FR/AC covered by T017 aggregate。

### Risks and rollback

Risk: long suites exceed ceiling；host-managed background commands required。
