# 任务清单：WorkflowHub 调研、阶段状态、自动复盘与交接加固

- **Input**：`specs/workflowhub-research-handoff-hardening-20260909/decision-log.md`、`specs/workflowhub-research-handoff-hardening-20260909/spec.md`、`specs/workflowhub-research-handoff-hardening-20260909/plan.md`
- **Template version**：`plan-task.v4`
- **Planning input status**：`recorded` — 用生产入口（键名去掉 `.md` 后缀）构建 `stage-input-packet.v1` 成功，`verifyStageInputPacket.ok=true`；"decision-log 缺 material-navigation"是诊断 harness 键名错误（PFACT-011），UI source 已改为显式结论（PFACT-012）。最终冻结由 stage outcome 按最终材料字节记录；冻结 hash 不写回材料，避免内容寻址自引用。

## 材料导航

| 章节 / 材料锚点 | 职责与摘要 | M/S/B/P 读取时机 |
| --- | --- | --- |
| `decision-log.md#决定` | R/D、非目标、OPEN/DEFER | M/S/B；方向与来源 |
| `spec.md#11-验收标准` | 28 FR、13 AC、失败条件 | S/B/P；任务与 oracle |
| `plan.md#phase-p1--集成纵切` | 唯一 Phase 文件权威、顺序、风险与恢复 | B/P；执行前 |
| `tasks.md#phase-p1--集成纵切` | 17 张当前执行卡与唯一完成区 | B/P；逐卡执行 |

## Phase P1 — 集成纵切

### Goal

八个行为域按真实 producer→reader→status/hook→consumer 全链实现，并用一个 aggregate runner 输出 13 个 AC 的可比较 JSON。

### Files

- **NEW**：`runtime/schemas/research-report.v1.json`、`runtime/evidence/research-report.mjs`、`runtime/stage/stage-handoff.mjs`、`skills/stage-handoff/SKILL.md`、`skills/stage-handoff/skill-bundle.json`、`docs/architecture/control-plane-inventory.json`、`docs/adr/0026-equivalent-stage-outcome-attempts.md`、`tests/contract/research-report.test.mjs`、`tests/contract/execution-outcome.test.mjs`、`tests/contract/control-plane-governance.test.mjs`、`tests/contract/stage-handoff.test.mjs`、`tests/contract/ui-applicability-contract.test.mjs`、`tests/contract/review-budget-namespace.test.mjs`、`tests/contract/performance-budget.test.mjs`、`tests/contract/verify-publication.test.mjs`、`tests/acceptance/workflowhub-research-handoff-hardening.acceptance.mjs`
- **MODIFY**：`runtime/stage/stage-handlers.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/stage/stage-content-contracts.mjs`、`runtime/review/review-record-route.mjs`、`runtime/evidence/stage-content-evidence.mjs`、`runtime/review/schemas/attempt.schema.json`、`runtime/evidence/quality-store.mjs`、`runtime/task/material-workspace.mjs`、`runtime/task/workspace.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-reflect.mjs`、`runtime/schemas/stage-reflection.v2.json`、`runtime/task/task-handle.mjs`、`runtime/task/task-kernel-implementation.mjs`、`runtime/task/task-kernel.mjs`、`runtime/evidence/stage-completion-facts.mjs`、`core/task-close.mjs`、`core/runtime-mode.mjs`、`tools/cli/stage-runtime.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`、`workflows/make-decision/steps.json`、`workflows/make-decision/skill-deps.yaml`、`workflows/build-spec/skill-deps.yaml`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-code/skill-deps.yaml`、`skills/workflowhub-host-protocol/SKILL.md`、`skills/deep-research/SKILL.md`、`skills/deep-research/skill-bundle.json`、`skills/anysearch/SKILL.md`、`skills/anysearch/skill-bundle.json`、`skills/anysearch/scripts/anysearch_cli.js`、`skills/anysearch/scripts/anysearch_cli.py`、`skills/anysearch/scripts/anysearch_cli.sh`、`skills/anysearch/scripts/anysearch_cli.ps1`、`skills/catalog.yaml`、`skills/reuse-registry.md`、`CONTEXT.md`、`docs/architecture/move-map.json`、`tests/contract/status-derivation.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/contract/host-outcome-bridge.test.mjs`、`tests/contract/acceptance-execution-tier.test.mjs`、`tests/integration/quality-store-concurrency.test.mjs`、`tests/contract/stage-reflection-wiring.test.mjs`、`tests/contract/stage-runner-reflection.test.mjs`、`tests/contract/stage-runner-on-stage-end.test.mjs`、`tests/contract/workflow-synchronization-consumer.test.mjs`、`tests/e2e/stage-reflection-real-task.test.mjs`、`tests/stage-interaction-contract.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`、`tests/review/review-record-route.test.mjs`、`tests/final-cutover-guards.red.test.mjs`、`tests/integration/mutation-guards.test.mjs`、`tests/official-component-receipts.test.mjs`、`tests/five-stage-facts-v2.test.mjs`、`core/__tests__/runtime-mode.test.mjs`
- **DO NOT TOUCH**：不增改任何 workflow step/hook 拓扑；不改 `workflows/verify-code/skill-deps.yaml`、仓外 handoff/receive-handoff、历史 task/report bytes、public 七类命令集、现有 quality predicates 或四材料 schema。

### Tasks

#### T001 — RED：research 三态、失败与非阻断披露

- **ID**：T001
- **Phase**：Phase P1 — 集成纵切
- **goal**：先证明现有 test-receipt 借道、失败分类与 status 投影不满足 research 合同
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-research-handoff-hardening-20260909/spec.md","hash":"730abd68651d4aeba23fa89ea5cd5a45c47451685c52e85745668c6674cf80d2","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-research-handoff-hardening-20260909/plan.md","hash":"4d4a2f1ac6c7d44f3b2718f3f0f2166443dd7639b3679072a11413c30d6489a8","id":"PLAN"}]`
- **source_refs / decision_refs**：R-001、R-002、R-014、R-015；D-001、D-002、D-003
- **输入**：当前 accepted spec/plan、前序任务真实输出与已核实 code anchors
- **依赖**：none
- **并行**：否 — 共享 stage runtime/host seam，必须按 producer-before-consumer 串行
- **FR**：FR-RESEARCH-001、FR-RESEARCH-002、FR-RESEARCH-003、FR-RESEARCH-004
- **AC**：AC-RESEARCH-001、AC-RESEARCH-002、AC-RESEARCH-003
- **动作**：新增三态/raw-bytes/current-identity/非谓词/超时重试批准状态断言，不改生产实现
- **精确文件**：`tests/contract/research-report.test.mjs`、`tests/contract/status-derivation.test.mjs`
- **boundary**：files: `tests/contract/research-report.test.mjs`、`tests/contract/status-derivation.test.mjs`; symbols/regions: 仅本卡 goal 所述 producer/reader/test 区域
- **输出**：目标断言导致的 RED 证据
- **Knowledge**：不得放宽质量谓词，不得用 fixture、文件存在或自由文本冒充真实运行
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`npx vitest run tests/contract/research-report.test.mjs tests/contract/status-derivation.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-RESEARCH {"pass":"completed/skipped/unavailable 均被 current reader 认证，status 单源披露且不进入 completion","reject":{"input":"旧 test receipt 或无批准 fallback 被接受","expected_rejection":"target assertion fails with non-zero exit","observation":"RED output names the target contract mismatch rather than setup failure"}}`
- **evidence_path**：`quality/tests/workflowhub-research-handoff-hardening/T001-T002.json`
- **STOP**：命令/fixture 失败而非目标 assertion、文件越界、需新产品决定或弱化负例时停止并返回 owner
- **recovery**：build-code owner 仅回退本卡改动，保留 RED/失败原始事实；方向或规格变化分别回 make-decision/build-spec
- **task risk**：局部绿色掩盖真实 host consumer 或把 unavailable 改写为 completed
- **test tier / test method**：fullstack / fullstack-slice-testing；跨 runtime、host bridge、schema、skills/workflow seam
- **scenarios / commands / expected exit / oracle**：三态、402 未证实归 http_error、TLS/timeout 唯一重试、awaiting/approved/declined、缺 current report；命令同 gate_cmd；RED=1，GREEN=由配对卡定义；ORACLE-RESEARCH
- **fixtures_services**：临时 task store + 当前域确定性 fixtures；每个测试清理自身临时目录，不复用历史 current fact
- **coverage limits**：不以 fixture 冒充真实外部 provider SLA；真实 fallback smoke 留给 T017
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：unavailable
- **semantic_review_ref**：error:REVIEW_RETRY_BUDGET_UNKNOWN
- **semantic_review_reason**：正式 review 在 dispatch 前因 canonical budget attempt identity 无效而 unavailable；未调用 provider，未产出 review result

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：T001 RED contract tests added; T002 canonical research schema/reader/listing/status consumer and official make-decision producer implemented. Attempt validation now binds attempts per question, enforces the 30s/120s budgets, requires approved `web_search` + `web_fetch` provenance, distinguishes stale from corrupt current bytes, and uses the generic canonical writer.
- **executed_commands**：`npx vitest run tests/contract/research-report.test.mjs tests/contract/status-derivation.test.mjs` (RED exit 1, GREEN exit 0); `npx vitest run tests/contract/stage-completion.test.mjs` (exit 0); `npx vitest run tests/contract/workflow-synchronization-consumer.test.mjs` (exit 0).
- **evidence_refs**：`quality/tests/workflowhub-research-handoff-hardening/T001-T002.json`
- **covered_ac**：AC-RESEARCH-001 partial (reader/schema/hash/current identity); AC-RESEARCH-002 partial (non-blocking status disclosure); AC-RESEARCH-003 unavailable (no authorized provider call; runtime SLA smoke not run).
- **review_fact**：`unavailable`, `error:REVIEW_RETRY_BUDGET_UNKNOWN`; no provider called.
- **completed_at**：`2026-09-10T01:16:50+08:00`
- **执行事实**：GREEN gate passed; external provider/fallback SLA remains unverified and is preserved as unavailable.

#### T002 — GREEN：research canonical reader 与受控 fallback

- **ID**：T002
- **Phase**：Phase P1 — 集成纵切
- **goal**：用通用 canonical writer 加窄 schema/reader，完成 research 全链并保留非阻断
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-research-handoff-hardening-20260909/spec.md","hash":"730abd68651d4aeba23fa89ea5cd5a45c47451685c52e85745668c6674cf80d2","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-research-handoff-hardening-20260909/plan.md","hash":"4d4a2f1ac6c7d44f3b2718f3f0f2166443dd7639b3679072a11413c30d6489a8","id":"PLAN"}]`
- **source_refs / decision_refs**：R-001、R-002、R-014、R-015；D-001、D-002、D-003
- **输入**：当前 accepted spec/plan、前序任务真实输出与已核实 code anchors
- **依赖**：T001
- **并行**：否 — 共享 stage runtime/host seam，必须按 producer-before-consumer 串行
- **FR**：FR-RESEARCH-001、FR-RESEARCH-002、FR-RESEARCH-003、FR-RESEARCH-004
- **AC**：AC-RESEARCH-001、AC-RESEARCH-002、AC-RESEARCH-003
- **动作**：实现 research schema/reader/listing/status，统一 anysearch attempt 语义并更新 deep-research/workflow consumer
- **精确文件**：`runtime/schemas/research-report.v1.json`、`runtime/evidence/research-report.mjs`、`runtime/task/task-handle.mjs`、`runtime/stage/stage-handlers.mjs`、`tools/cli/stage-runtime.mjs`、`workflows/make-decision/steps.json`、`workflows/make-decision/skill-deps.yaml`、`skills/deep-research/SKILL.md`、`skills/deep-research/skill-bundle.json`、`skills/anysearch/SKILL.md`、`skills/anysearch/skill-bundle.json`、`skills/anysearch/scripts/anysearch_cli.js`、`skills/anysearch/scripts/anysearch_cli.py`、`skills/anysearch/scripts/anysearch_cli.sh`、`skills/anysearch/scripts/anysearch_cli.ps1`、`tests/contract/research-report.test.mjs`、`tests/contract/status-derivation.test.mjs`
- **boundary**：files: `runtime/schemas/research-report.v1.json`、`runtime/evidence/research-report.mjs`、`runtime/task/task-handle.mjs`、`runtime/stage/stage-handlers.mjs`、`tools/cli/stage-runtime.mjs`、`workflows/make-decision/steps.json`、`workflows/make-decision/skill-deps.yaml`、`skills/deep-research/SKILL.md`、`skills/deep-research/skill-bundle.json`、`skills/anysearch/SKILL.md`、`skills/anysearch/skill-bundle.json`、`skills/anysearch/scripts/anysearch_cli.js`、`skills/anysearch/scripts/anysearch_cli.py`、`skills/anysearch/scripts/anysearch_cli.sh`、`skills/anysearch/scripts/anysearch_cli.ps1`、`tests/contract/research-report.test.mjs`、`tests/contract/status-derivation.test.mjs`; symbols/regions: 仅本卡 goal 所述 producer/reader/test 区域
- **输出**：同 oracle GREEN 证据与保留的负例
- **Knowledge**：不得放宽质量谓词，不得用 fixture、文件存在或自由文本冒充真实运行
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`npx vitest run tests/contract/research-report.test.mjs tests/contract/status-derivation.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-RESEARCH {"pass":"completed/skipped/unavailable 均被 current reader 认证，status 单源披露且不进入 completion","reject":{"input":"旧 test receipt 或无批准 fallback 被接受","expected_rejection":"target assertion fails with non-zero exit","observation":"RED output names the target contract mismatch rather than setup failure"}}`
- **evidence_path**：`quality/tests/workflowhub-research-handoff-hardening/T001-T002.json`
- **STOP**：命令/fixture 失败而非目标 assertion、文件越界、需新产品决定或弱化负例时停止并返回 owner
- **recovery**：build-code owner 仅回退本卡改动，保留 RED/失败原始事实；方向或规格变化分别回 make-decision/build-spec
- **task risk**：局部绿色掩盖真实 host consumer 或把 unavailable 改写为 completed
- **test tier / test method**：fullstack / fullstack-slice-testing；跨 runtime、host bridge、schema、skills/workflow seam
- **scenarios / commands / expected exit / oracle**：与 T001 相同并保留 test-receipt/未批准 fallback 负例；命令同 gate_cmd；RED=由配对卡定义，GREEN=0；ORACLE-RESEARCH
- **fixtures_services**：临时 task store + 当前域确定性 fixtures；每个测试清理自身临时目录，不复用历史 current fact
- **coverage limits**：仓内验证结构与记录；外部真实调用缺失时 AC-RESEARCH-003 保持 partial/unavailable
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：unavailable
- **semantic_review_ref**：error:REVIEW_RETRY_BUDGET_UNKNOWN
- **semantic_review_reason**：正式 review 在 dispatch 前因 canonical budget attempt identity 无效而 unavailable；未调用 provider，未产出 review result

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：same implementation slice as T001/T002; `stage-runtime run --action=execute` accepts the report only as `research_report`, publishes it through the generic kernel writer, strips the raw input, and passes only the returned ref to the handler. Research remains outside quality predicates.
- **executed_commands**：`npx vitest run tests/contract/research-report.test.mjs tests/contract/status-derivation.test.mjs` (exit 0, 2 files / 30 tests).
- **evidence_refs**：`quality/tests/workflowhub-research-handoff-hardening/T001-T002.json`
- **covered_ac**：AC-RESEARCH-001 partial; AC-RESEARCH-002 partial; AC-RESEARCH-003 unavailable.
- **review_fact**：`unavailable`, `error:REVIEW_RETRY_BUDGET_UNKNOWN`.
- **completed_at**：`2026-09-10T01:16:50+08:00`
- **执行事实**：current reader rejects legacy test-receipt-shaped records; status exposes unavailable research without adding missing/actionable/completion semantics.

#### T003 — RED：等价 outcome 被误判与 fake missing

- **ID**：T003
- **Phase**：Phase P1 — 集成纵切
- **goal**：复现多等价 completed 被判 conflict/missing、语义矛盾未按 public failed 披露
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-research-handoff-hardening-20260909/spec.md","hash":"730abd68651d4aeba23fa89ea5cd5a45c47451685c52e85745668c6674cf80d2","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-research-handoff-hardening-20260909/plan.md","hash":"4d4a2f1ac6c7d44f3b2718f3f0f2166443dd7639b3679072a11413c30d6489a8","id":"PLAN"}]`
- **source_refs / decision_refs**：R-013、R-018；D-004、D-005；Clarify 1A
- **输入**：当前 accepted spec/plan、前序任务真实输出与已核实 code anchors
- **依赖**：T002
- **并行**：否 — 共享 stage runtime/host seam，必须按 producer-before-consumer 串行
- **FR**：FR-EXECUTION-001、FR-EXECUTION-002、FR-EXECUTION-003、FR-EXECUTION-004
- **AC**：AC-EXECUTION-001、AC-EXECUTION-002
- **动作**：新增 0/1/多等价/多矛盾/同毫秒/同 attempt 异字节断言，不改生产实现
- **精确文件**：`tests/contract/execution-outcome.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/contract/status-derivation.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`
- **boundary**：files: `tests/contract/execution-outcome.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/contract/status-derivation.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`; symbols/regions: 仅本卡 goal 所述 producer/reader/test 区域
- **输出**：目标断言导致的 RED 证据
- **Knowledge**：不得放宽质量谓词，不得用 fixture、文件存在或自由文本冒充真实运行
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`npx vitest run tests/contract/execution-outcome.test.mjs tests/contract/stage-completion.test.mjs tests/contract/status-derivation.test.mjs tests/integration/vnext-official-stage-run.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-EXECUTION {"pass":"等价 cohort completed；真矛盾/ambiguous public failed；execution 永不进入 predicates/missing","reject":{"input":"等价 attempts 产生 stage_outcome missing 或冲突时挑 winner","expected_rejection":"target assertion fails with non-zero exit","observation":"RED output names the target contract mismatch rather than setup failure"}}`
- **evidence_path**：`quality/tests/workflowhub-research-handoff-hardening/T003-T004.json`
- **STOP**：命令/fixture 失败而非目标 assertion、文件越界、需新产品决定或弱化负例时停止并返回 owner
- **recovery**：build-code owner 仅回退本卡改动，保留 RED/失败原始事实；方向或规格变化分别回 make-decision/build-spec
- **task risk**：局部绿色掩盖真实 host consumer 或把 unavailable 改写为 completed
- **test tier / test method**：fullstack / fullstack-slice-testing；跨 runtime、host bridge、schema、skills/workflow seam
- **scenarios / commands / expected exit / oracle**：无 outcome、单 completed、多等价、多语义签名、同毫秒、same-attempt replay；命令同 gate_cmd；RED=1，GREEN=由配对卡定义；ORACLE-EXECUTION
- **fixtures_services**：临时 task store + 当前域确定性 fixtures；每个测试清理自身临时目录，不复用历史 current fact
- **coverage limits**：只覆盖 current authenticated cohort；foreign/stale/failed/incomplete 作为负例
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：unavailable
- **semantic_review_ref**：error:REVIEW_RETRY_BUDGET_UNKNOWN
- **semantic_review_reason**：正式 review 在 dispatch 前因 canonical budget attempt identity 无效而 unavailable；未调用 provider，未产出 review result

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`partial`
- **actual_changes**：T003 execution-outcome contract fixture retained; T004 added semantic execution projection, replay/conflict diagnostics, and independent `execution_outcome` status disclosure.
- **executed_commands**：`npx vitest run tests/contract/execution-outcome.test.mjs tests/contract/research-report.test.mjs tests/contract/status-derivation.test.mjs tests/contract/stage-completion.test.mjs` (exit 0, 4 files / 85 tests); `npx vitest run tests/integration/vnext-official-stage-run.test.mjs ...` 的完整单文件分片（exit 0, 1 file / 94 tests, 569.70s）。
- **evidence_refs**：`quality/tests/workflowhub-research-handoff-hardening/T003-T004.json`
- **covered_ac**：AC-EXECUTION-001/002 的 GREEN 行为与 official-stage consumer 已覆盖；本 RED 卡因接手后没有可追溯的预修复非零结果，保持 partial。
- **review_fact**：`unavailable`, `error:REVIEW_RETRY_BUDGET_UNKNOWN`; no provider called.
- **completed_at**：N/A — no retained RED result
- **执行事实**：声明 gate 的全部文件已在 bounded segments 中通过；不倒造 RED 历史，因此本 RED 卡不报 completed。

#### T004 — GREEN：execution semantic signature 与独立披露

- **ID**：T004
- **Phase**：Phase P1 — 集成纵切
- **goal**：按语义签名聚合同绑定 outcomes，并将 execution 从质量谓词命名空间移出
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-research-handoff-hardening-20260909/spec.md","hash":"730abd68651d4aeba23fa89ea5cd5a45c47451685c52e85745668c6674cf80d2","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-research-handoff-hardening-20260909/plan.md","hash":"4d4a2f1ac6c7d44f3b2718f3f0f2166443dd7639b3679072a11413c30d6489a8","id":"PLAN"}]`
- **source_refs / decision_refs**：R-013、R-018；D-004、D-005；Clarify 1A
- **输入**：当前 accepted spec/plan、前序任务真实输出与已核实 code anchors
- **依赖**：T003
- **并行**：否 — 共享 stage runtime/host seam，必须按 producer-before-consumer 串行
- **FR**：FR-EXECUTION-001、FR-EXECUTION-002、FR-EXECUTION-003、FR-EXECUTION-004
- **AC**：AC-EXECUTION-001、AC-EXECUTION-002
- **动作**：实现 semantic signature/deriveExecutionOutcomes，保留 replay conflict，更新 status grouping 与调用者
- **精确文件**：`runtime/stage/completion-predicates.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`tools/cli/stage-runtime.mjs`、`docs/adr/0026-equivalent-stage-outcome-attempts.md`、`tests/contract/execution-outcome.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/contract/status-derivation.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`
- **boundary**：files: `runtime/stage/completion-predicates.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`tools/cli/stage-runtime.mjs`、`docs/adr/0026-equivalent-stage-outcome-attempts.md`、`tests/contract/execution-outcome.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/contract/status-derivation.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`; symbols/regions: 仅本卡 goal 所述 producer/reader/test 区域
- **输出**：同 oracle GREEN 证据与保留的负例
- **Knowledge**：不得放宽质量谓词，不得用 fixture、文件存在或自由文本冒充真实运行
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`npx vitest run tests/contract/execution-outcome.test.mjs tests/contract/stage-completion.test.mjs tests/contract/status-derivation.test.mjs tests/integration/vnext-official-stage-run.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-EXECUTION {"pass":"等价 cohort completed；真矛盾/ambiguous public failed；execution 永不进入 predicates/missing","reject":{"input":"等价 attempts 产生 stage_outcome missing 或冲突时挑 winner","expected_rejection":"target assertion fails with non-zero exit","observation":"RED output names the target contract mismatch rather than setup failure"}}`
- **evidence_path**：`quality/tests/workflowhub-research-handoff-hardening/T003-T004.json`
- **STOP**：命令/fixture 失败而非目标 assertion、文件越界、需新产品决定或弱化负例时停止并返回 owner
- **recovery**：build-code owner 仅回退本卡改动，保留 RED/失败原始事实；方向或规格变化分别回 make-decision/build-spec
- **task risk**：局部绿色掩盖真实 host consumer 或把 unavailable 改写为 completed
- **test tier / test method**：fullstack / fullstack-slice-testing；跨 runtime、host bridge、schema、skills/workflow seam
- **scenarios / commands / expected exit / oracle**：与 T003 相同且保留 same-attempt 异字节 fail-loud；命令同 gate_cmd；RED=由配对卡定义，GREEN=0；ORACLE-EXECUTION
- **fixtures_services**：临时 task store + 当前域确定性 fixtures；每个测试清理自身临时目录，不复用历史 current fact
- **coverage limits**：不新增 latest selector/attempt_seq；review findings/evidence 文本不参与签名
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：unavailable
- **semantic_review_ref**：error:REVIEW_RETRY_BUDGET_UNKNOWN
- **semantic_review_reason**：正式 review 在 dispatch 前因 canonical budget attempt identity 无效而 unavailable；未调用 provider，未产出 review result

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：See T003/T004 implementation; dead historical projection branch removed after the semantic projection became the sole status consumer.
- **executed_commands**：T003/T004 contract segment exit 0（4 files / 85 tests）；完整 `tests/integration/vnext-official-stage-run.test.mjs` segment exit 0（1 file / 94 tests, 569.70s）。
- **evidence_refs**：`quality/tests/workflowhub-research-handoff-hardening/T003-T004.json`
- **covered_ac**：AC-EXECUTION-001/002 GREEN producer→official consumer→status path covered；产品级 acceptance 仍由 T017 独立判定。
- **review_fact**：`unavailable`, `error:REVIEW_RETRY_BUDGET_UNKNOWN`; no provider called.
- **completed_at**：`2026-09-10T09:27:38+08:00`
- **执行事实**：因 94-test integration 单文件耗时约 9.5 分钟，声明 gate 按文件分片执行；所有 GREEN 成员均 exit 0。

#### T005 — RED：review row 与 integration fact 分裂

- **ID**：T005
- **Phase**：Phase P1 — 集成纵切
- **goal**：证明 recorded/unavailable/missing 在 skill row 与 integration fact 可出现相反结论
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-research-handoff-hardening-20260909/spec.md","hash":"730abd68651d4aeba23fa89ea5cd5a45c47451685c52e85745668c6674cf80d2","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-research-handoff-hardening-20260909/plan.md","hash":"4d4a2f1ac6c7d44f3b2718f3f0f2166443dd7639b3679072a11413c30d6489a8","id":"PLAN"}]`
- **source_refs / decision_refs**：R-017、R-018、R-022；D-006、D-011
- **输入**：当前 accepted spec/plan、前序任务真实输出与已核实 code anchors
- **依赖**：T004
- **并行**：否 — 共享 stage runtime/host seam，必须按 producer-before-consumer 串行
- **FR**：FR-REVIEW-001、FR-REVIEW-002、FR-REVIEW-003
- **AC**：AC-REVIEW-001、AC-REVIEW-002
- **动作**：在真实 official-stage/record-route fixture 中增加三态与 ref/hash/provenance 一致断言；**合并后复核**：main 已把投影侧按 `status !== "unavailable"` 收口，本卡 RED 只针对仍缺失的预算 namespace 隔离与两投影对 unavailable/missing 的一致处置
- **精确文件**：`tests/contract/review-budget-namespace.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`、`tests/review/review-record-route.test.mjs`
- **boundary**：files: `tests/contract/review-budget-namespace.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`、`tests/review/review-record-route.test.mjs`; symbols/regions: 仅本卡 goal 所述 producer/reader/test 区域
- **输出**：目标断言导致的 RED 证据
- **Knowledge**：不得放宽质量谓词，不得用 fixture、文件存在或自由文本冒充真实运行
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`npx vitest run tests/contract/review-budget-namespace.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/review/review-record-route.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-REVIEW {"pass":"recorded 才满足谓词；两投影 ref/hash 同源、完成/未完成结论不得相反；unavailable/missing 保持非完成；预算历史按 namespace 归域后无关损坏恰好 dispatch 一次、当前损坏零 dispatch 报 REVIEW_RECORD_INCOMPLETE、不可归域零 dispatch 保持 REVIEW_RETRY_BUDGET_UNKNOWN","reject":{"input":"reader 从另一投影反推成功、capability proof 进入谓词，或无关历史导致零 dispatch","expected_rejection":"target assertion fails with non-zero exit","observation":"RED output names the target contract mismatch rather than setup failure"}}`
- **evidence_path**：`quality/tests/workflowhub-research-handoff-hardening/T005-T006.json`
- **STOP**：命令/fixture 失败而非目标 assertion、文件越界、需新产品决定或弱化负例时停止并返回 owner
- **recovery**：build-code owner 仅回退本卡改动，保留 RED/失败原始事实；方向或规格变化分别回 make-decision/build-spec
- **task risk**：局部绿色掩盖真实 host consumer 或把 unavailable 改写为 completed
- **test tier / test method**：fullstack / fullstack-slice-testing；跨 runtime、host bridge、schema、skills/workflow seam
- **scenarios / commands / expected exit / oracle**：recorded、provider unavailable、receipt missing、lifecycle missing、身份漂移、无关/当前/不可归域三类坏预算历史；命令同 gate_cmd；RED=1，GREEN=由配对卡定义；ORACLE-REVIEW
- **fixtures_services**：临时 task store + 当前域确定性 fixtures；每个测试清理自身临时目录，不复用历史 current fact
- **coverage limits**：不改变 wh-review provider policy；仅修 lifecycle producer/投影一致性
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：unavailable
- **semantic_review_ref**：error:REVIEW_RETRY_BUDGET_UNKNOWN
- **semantic_review_reason**：正式 review 在 dispatch 前因 canonical budget attempt identity 无效而 unavailable；未调用 provider，未产出 review result

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`partial`
- **actual_changes**：T005 namespace contract added; T006 `readCanonicalBudgetHistory` now ignores provably foreign stage/track/kind/subject-kind/scope damage, keeps exact-current damage as `REVIEW_RECORD_INCOMPLETE`, keeps old/phase-mismatched/unclassifiable damage budget-unknown, and budgets only the same review subject without weakening route-repair rules.
- **executed_commands**：`npx vitest run tests/contract/review-budget-namespace.test.mjs tests/review/review-record-route.test.mjs` (exit 0, 2 files / 68 tests); 完整 `tests/integration/vnext-official-stage-run.test.mjs` segment exit 0（1 file / 94 tests, 569.70s）。
- **evidence_refs**：`quality/tests/workflowhub-research-handoff-hardening/T005-T006.json`
- **covered_ac**：AC-REVIEW-001/002 的 GREEN 行为与 official-stage consumer 已覆盖；本 RED 卡因接手后没有可追溯的预修复非零结果，保持 partial。
- **review_fact**：`unavailable`, `error:REVIEW_RETRY_BUDGET_UNKNOWN`; no provider called.
- **completed_at**：N/A — no retained RED result
- **执行事实**：声明 gate 的全部文件已在 bounded segments 中通过；不倒造 RED 历史，因此本 RED 卡不报 completed。

#### T006 — GREEN：review lifecycle producer 单源

- **ID**：T006
- **Phase**：Phase P1 — 集成纵切
- **goal**：让 bridge 真实 lifecycle 同时驱动 wh-review row 与 integration fact
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-research-handoff-hardening-20260909/spec.md","hash":"730abd68651d4aeba23fa89ea5cd5a45c47451685c52e85745668c6674cf80d2","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-research-handoff-hardening-20260909/plan.md","hash":"4d4a2f1ac6c7d44f3b2718f3f0f2166443dd7639b3679072a11413c30d6489a8","id":"PLAN"}]`
- **source_refs / decision_refs**：R-017、R-018、R-022；D-006、D-011
- **输入**：当前 accepted spec/plan、前序任务真实输出与已核实 code anchors
- **依赖**：T005
- **并行**：否 — 共享 stage runtime/host seam，必须按 producer-before-consumer 串行
- **FR**：FR-REVIEW-001、FR-REVIEW-002、FR-REVIEW-003
- **AC**：AC-REVIEW-001、AC-REVIEW-002
- **动作**：扩展 bridge session event 与 outcome adapter；recorded 共用 canonical ref/hash，缺失保持原语义；实现 `readCanonicalBudgetHistory` 的 namespace 归域三分支（无关→恰好 dispatch 一次；当前损坏→零 dispatch + `REVIEW_RECORD_INCOMPLETE`；不可归域→零 dispatch + `REVIEW_RETRY_BUDGET_UNKNOWN`），并保留 main 已合并的 `route_repair` kind 语义
- **精确文件**：`runtime/review/review-record-route.mjs`、`runtime/evidence/stage-content-evidence.mjs`、`runtime/review/schemas/attempt.schema.json`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`runtime/stage/stage-handlers.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`、`tests/contract/review-budget-namespace.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`、`tests/review/review-record-route.test.mjs`
- **boundary**：files: `runtime/review/review-record-route.mjs`、`runtime/evidence/stage-content-evidence.mjs`、`runtime/review/schemas/attempt.schema.json`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`runtime/stage/stage-handlers.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`、`tests/contract/review-budget-namespace.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`、`tests/review/review-record-route.test.mjs`; symbols/regions: 仅本卡 goal 所述 producer/reader/test 区域
- **输出**：同 oracle GREEN 证据与保留的负例
- **Knowledge**：不得放宽质量谓词，不得用 fixture、文件存在或自由文本冒充真实运行
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`npx vitest run tests/contract/review-budget-namespace.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/review/review-record-route.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-REVIEW {"pass":"recorded 才满足谓词；两投影 ref/hash 同源、完成/未完成结论不得相反；unavailable/missing 保持非完成；预算历史按 namespace 归域后无关损坏恰好 dispatch 一次、当前损坏零 dispatch 报 REVIEW_RECORD_INCOMPLETE、不可归域零 dispatch 保持 REVIEW_RETRY_BUDGET_UNKNOWN","reject":{"input":"reader 从另一投影反推成功、capability proof 进入谓词，或无关历史导致零 dispatch","expected_rejection":"target assertion fails with non-zero exit","observation":"RED output names the target contract mismatch rather than setup failure"}}`
- **evidence_path**：`quality/tests/workflowhub-research-handoff-hardening/T005-T006.json`
- **STOP**：命令/fixture 失败而非目标 assertion、文件越界、需新产品决定或弱化负例时停止并返回 owner
- **recovery**：build-code owner 仅回退本卡改动，保留 RED/失败原始事实；方向或规格变化分别回 make-decision/build-spec
- **task risk**：局部绿色掩盖真实 host consumer 或把 unavailable 改写为 completed
- **test tier / test method**：fullstack / fullstack-slice-testing；跨 runtime、host bridge、schema、skills/workflow seam
- **scenarios / commands / expected exit / oracle**：与 T005 相同并保留 session_lifecycle_event_unavailable 负例与预算三分支；命令同 gate_cmd；RED=由配对卡定义，GREEN=0；ORACLE-REVIEW
- **fixtures_services**：临时 task store + 当前域确定性 fixtures；每个测试清理自身临时目录，不复用历史 current fact
- **coverage limits**：不把 unavailable 当 completed，不新增 capability-proof predicate
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：unavailable
- **semantic_review_ref**：error:REVIEW_RETRY_BUDGET_UNKNOWN
- **semantic_review_reason**：正式 review 在 dispatch 前因 canonical budget attempt identity 无效而 unavailable；未调用 provider，未产出 review result

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：See T005 namespace implementation; budget history now binds the request subject through the authenticated closure subject hash, so a different subject cannot consume or masquerade as the current subject's round; no provider policy or capability predicate was changed.
- **executed_commands**：T005/T006 contract + review-route segments exit 0（69 tests total）；完整 `tests/integration/vnext-official-stage-run.test.mjs` segment exit 0（1 file / 94 tests, 569.70s）。
- **evidence_refs**：`quality/tests/workflowhub-research-handoff-hardening/T005-T006.json`
- **covered_ac**：AC-REVIEW-001/002 GREEN lifecycle producer、namespace 三分支与 official consumer 已覆盖；产品级 acceptance 仍由 T017 独立判定。
- **review_fact**：`unavailable`, `error:REVIEW_RETRY_BUDGET_UNKNOWN`; no provider called.
- **completed_at**：`2026-09-10T11:27:38+08:00`
- **执行事实**：声明 gate 按文件分片完成，全部 GREEN 成员 exit 0；unavailable/missing 未改写为 recorded。

#### T007 — RED：控制面死门、静默守卫与登记漂移

- **ID**：T007
- **Phase**：Phase P1 — 集成纵切
- **goal**：用逐对象 inventory 与反向引用复现零 consumer、6→2 参数丢失，并验证 plan 已冻结的 21 行 skip disposition 和重复 gap 派生
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-research-handoff-hardening-20260909/spec.md","hash":"730abd68651d4aeba23fa89ea5cd5a45c47451685c52e85745668c6674cf80d2","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-research-handoff-hardening-20260909/plan.md","hash":"4d4a2f1ac6c7d44f3b2718f3f0f2166443dd7639b3679072a11413c30d6489a8","id":"PLAN"}]`
- **source_refs / decision_refs**：R-016、R-018、R-024；D-007、D-013；OPEN-006、OPEN-010、OPEN-016
- **输入**：当前 accepted spec/plan、前序任务真实输出与已核实 code anchors
- **依赖**：T006
- **并行**：否 — 共享 stage runtime/host seam，必须按 producer-before-consumer 串行
- **FR**：FR-GOVERNANCE-001、FR-GOVERNANCE-002、FR-GOVERNANCE-003、FR-GOVERNANCE-004、FR-GOVERNANCE-005、FR-GOVERNANCE-006、FR-GOVERNANCE-007
- **AC**：AC-GOVERNANCE-001、AC-GOVERNANCE-002
- **动作**：新增 inventory schema/content、stale finding、死符号、skip disposition（15 retire_with_replacement、6 defer、0 restore）、alias identity、verify 唯一写入者/第二写入者负例与同根因归并的失败断言；**合并后复核**：`tests/final-cutover-guards.red.test.mjs` 的 21 行仍在原行，L1193 的 `it.each` 增加了一个 `REVIEW_STATUS_UNAVAILABLE` 用例，gate 命令已包含该文件
- **精确文件**：`docs/architecture/control-plane-inventory.json`、`tests/contract/control-plane-governance.test.mjs`、`tests/contract/verify-publication.test.mjs`、`tests/integration/quality-store-concurrency.test.mjs`、`tests/final-cutover-guards.red.test.mjs`
- **boundary**：files: `docs/architecture/control-plane-inventory.json`、`tests/contract/control-plane-governance.test.mjs`、`tests/contract/verify-publication.test.mjs`、`tests/integration/quality-store-concurrency.test.mjs`、`tests/final-cutover-guards.red.test.mjs`; symbols/regions: 仅本卡 goal 所述 producer/reader/test 区域
- **输出**：目标断言导致的 RED 证据
- **Knowledge**：不得放宽质量谓词，不得用 fixture、文件存在或自由文本冒充真实运行
- **verification_role**：RED
- **paired_task**：T008
- **gate_cmd**：`npx vitest run tests/contract/control-plane-governance.test.mjs tests/contract/verify-publication.test.mjs tests/integration/quality-store-concurrency.test.mjs tests/final-cutover-guards.red.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/e2e/vnext-five-stage-current.test.mjs tests/stage-risk-acceptance.test.mjs tests/review/review-record-route.test.mjs tests/contract/verify-code-binding-derivation.test.mjs tests/integration/verify-freshness-selection.test.mjs tests/official-component-receipts.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-GOVERNANCE {"pass":"每对象具 producer/consumer/owner/effect/disposition/replacement/delete condition/evidence，21 skip 全有分类；verify 摘要经唯一 writer 发布且第二写入者被拒；同一根因默认只显示一次","reject":{"input":"批量 unskip/删除无 consumer 证据、stale identity 被静默跳过、出现可写 canonical task root 的第二写入者或为消除空数组新增写入","expected_rejection":"target assertion fails with non-zero exit","observation":"RED output names the target contract mismatch rather than setup failure"}}`
- **evidence_path**：`quality/tests/workflowhub-research-handoff-hardening/T007-T008.json`
- **STOP**：命令/fixture 失败而非目标 assertion、文件越界、需新产品决定或弱化负例时停止并返回 owner
- **recovery**：build-code owner 仅回退本卡改动，保留 RED/失败原始事实；方向或规格变化分别回 make-decision/build-spec
- **task risk**：局部绿色掩盖真实 host consumer 或把 unavailable 改写为 completed
- **test tier / test method**：fullstack / fullstack-slice-testing；跨 runtime、host bridge、schema、skills/workflow seam
- **scenarios / commands / expected exit / oracle**：零 caller、真实 caller、stale/current finding、restore/retire_with_replacement/defer、gap alias、verify 摘要唯一写入者、第二写入者负例、同根因多投影；命令同 gate_cmd；RED=1，GREEN=由配对卡定义；ORACLE-GOVERNANCE
- **fixtures_services**：临时 task store + 当前域确定性 fixtures；每个测试清理自身临时目录，不复用历史 current fact
- **coverage limits**：无可靠 consumer/replacement 的 skip 只能 defer；不把 unknown 当零 consumer
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：unavailable
- **semantic_review_ref**：error:REVIEW_RETRY_BUDGET_UNKNOWN
- **semantic_review_reason**：正式 review 在 dispatch 前因 canonical budget attempt identity 无效而 unavailable；未调用 provider，未产出 review result

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：T007 的控制面 inventory、负向合同和 verify publication 合同已加入。用户于 `2026-09-10` 明确授权同任务 scope correction 后，`runtime/evidence/canonical-receipt-writer.mjs` 的 `reusableTestCapture` 改为显式接收已认证 `safeWorkspace`，消除 receipt reuse 路径读取未定义自由变量的问题。
- **executed_commands**：原 11-file aggregate 收到 `SIGTERM`（exit 143，511s，无汇总）；随后 bounded segments 覆盖全部声明成员。scope correction RED：`npx vitest run tests/official-component-receipts.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --reporter=dot`（exit 1，49 pass/3 fail，均为 `ReferenceError: workspace is not defined`）；GREEN：同命令 exit 0，52/52 pass；相邻 freshness seam `npx vitest run tests/integration/verify-freshness-selection.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --reporter=dot`（exit 0，17/17 pass）。
- **evidence_refs**：`quality/tests/workflowhub-research-handoff-hardening/T007-T008.json`（canonical external task-store record read back; current status partial）。
- **covered_ac**：AC-GOVERNANCE-001/002 的 producer、consumer、负向 writer、inventory、receipt reuse/rerun 与 freshness 路径通过。
- **review_fact**：独立只读子代理对 scope correction 返回 `no findings`；正式 `wh-review` 仍为 `unavailable: REVIEW_RETRY_BUDGET_UNKNOWN`，未调用 provider。
- **completed_at**：`2026-09-10`
- **执行事实**：原边界外缺陷经用户明确授权纳入同任务修复；实际改动仅增加 `workspace` 参数并传入构造时已认证的 `safeWorkspace`，没有新增 writer、store、public command 或路径权限。

#### T008 — GREEN：控制面逐项处置与负向存在性

- **ID**：T008
- **Phase**：Phase P1 — 集成纵切
- **goal**：修复 finding identity，删除已证实死门/僵尸；replacement gates 通过后逐行移除 15 个 retired skip，保留并注释 6 个 defer，再同步 move-map/catalog
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-research-handoff-hardening-20260909/spec.md","hash":"730abd68651d4aeba23fa89ea5cd5a45c47451685c52e85745668c6674cf80d2","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-research-handoff-hardening-20260909/plan.md","hash":"4d4a2f1ac6c7d44f3b2718f3f0f2166443dd7639b3679072a11413c30d6489a8","id":"PLAN"}]`
- **source_refs / decision_refs**：R-016、R-018、R-024；D-007、D-013；OPEN-006、OPEN-010、OPEN-016
- **输入**：当前 accepted spec/plan、前序任务真实输出与已核实 code anchors
- **依赖**：T007
- **并行**：否 — 共享 stage runtime/host seam，必须按 producer-before-consumer 串行
- **FR**：FR-GOVERNANCE-001、FR-GOVERNANCE-002、FR-GOVERNANCE-003、FR-GOVERNANCE-004、FR-GOVERNANCE-005、FR-GOVERNANCE-006、FR-GOVERNANCE-007
- **AC**：AC-GOVERNANCE-001、AC-GOVERNANCE-002
- **动作**：按 inventory 落 retain/repair/delete/defer；逐行执行 plan 的 21 项 disposition；补齐 `quality/verify.json` 的唯一发布者与 canonical guard；在既有 gap 记录上按根因归并；所有新增文件登记真实 consumer/owner/退出条件
- **精确文件**：`docs/architecture/control-plane-inventory.json`、`docs/architecture/move-map.json`、`runtime/evidence/quality-store.mjs`、`tools/cli/stage-runtime.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/task/task-kernel-implementation.mjs`、`runtime/task/task-kernel.mjs`、`runtime/evidence/stage-completion-facts.mjs`、`core/task-close.mjs`、`core/runtime-mode.mjs`、`skills/catalog.yaml`、`skills/reuse-registry.md`、`CONTEXT.md`、`tests/contract/control-plane-governance.test.mjs`、`tests/contract/verify-publication.test.mjs`、`tests/integration/quality-store-concurrency.test.mjs`、`tests/final-cutover-guards.red.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/integration/mutation-guards.test.mjs`、`tests/official-component-receipts.test.mjs`、`tests/five-stage-facts-v2.test.mjs`、`core/__tests__/runtime-mode.test.mjs`
- **boundary**：files: `docs/architecture/control-plane-inventory.json`、`docs/architecture/move-map.json`、`runtime/evidence/quality-store.mjs`、`tools/cli/stage-runtime.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/task/task-kernel-implementation.mjs`、`runtime/task/task-kernel.mjs`、`runtime/evidence/stage-completion-facts.mjs`、`core/task-close.mjs`、`core/runtime-mode.mjs`、`skills/catalog.yaml`、`skills/reuse-registry.md`、`CONTEXT.md`、`tests/contract/control-plane-governance.test.mjs`、`tests/contract/verify-publication.test.mjs`、`tests/integration/quality-store-concurrency.test.mjs`、`tests/final-cutover-guards.red.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/integration/mutation-guards.test.mjs`、`tests/official-component-receipts.test.mjs`、`tests/five-stage-facts-v2.test.mjs`、`core/__tests__/runtime-mode.test.mjs`; symbols/regions: 仅本卡 goal 所述 producer/reader/test 区域
- **输出**：同 oracle GREEN 证据与保留的负例
- **Knowledge**：不得放宽质量谓词，不得用 fixture、文件存在或自由文本冒充真实运行
- **verification_role**：GREEN
- **paired_task**：T007
- **gate_cmd**：`npx vitest run tests/contract/control-plane-governance.test.mjs tests/contract/verify-publication.test.mjs tests/integration/quality-store-concurrency.test.mjs tests/final-cutover-guards.red.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/e2e/vnext-five-stage-current.test.mjs tests/stage-risk-acceptance.test.mjs tests/review/review-record-route.test.mjs tests/contract/verify-code-binding-derivation.test.mjs tests/integration/verify-freshness-selection.test.mjs tests/official-component-receipts.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-GOVERNANCE {"pass":"每对象具 producer/consumer/owner/effect/disposition/replacement/delete condition/evidence，21 skip 全有分类；verify 摘要经唯一 writer 发布且第二写入者被拒；同一根因默认只显示一次","reject":{"input":"批量 unskip/删除无 consumer 证据、stale identity 被静默跳过、出现可写 canonical task root 的第二写入者或为消除空数组新增写入","expected_rejection":"target assertion fails with non-zero exit","observation":"RED output names the target contract mismatch rather than setup failure"}}`
- **evidence_path**：`quality/tests/workflowhub-research-handoff-hardening/T007-T008.json`
- **STOP**：命令/fixture 失败而非目标 assertion、文件越界、需新产品决定或弱化负例时停止并返回 owner
- **recovery**：build-code owner 仅回退本卡改动，保留 RED/失败原始事实；方向或规格变化分别回 make-decision/build-spec
- **task risk**：局部绿色掩盖真实 host consumer 或把 unavailable 改写为 completed
- **test tier / test method**：fullstack / fullstack-slice-testing；跨 runtime、host bridge、schema、skills/workflow seam
- **scenarios / commands / expected exit / oracle**：与 T007 相同并对 retain/delete/defer 各保留至少一个正反例，另加 verify 发布回读与第二写入者拒绝；命令同 gate_cmd；RED=由配对卡定义，GREEN=0；ORACLE-GOVERNANCE
- **fixtures_services**：临时 task store + 当前域确定性 fixtures；每个测试清理自身临时目录，不复用历史 current fact
- **coverage limits**：只删除 replacement gate 已通过的 15 个 retired skip；行 765/790/837/1227/1348/1594 保持 defer；历史 task/schema 不批量清理
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：unavailable
- **semantic_review_ref**：error:REVIEW_RETRY_BUDGET_UNKNOWN
- **semantic_review_reason**：正式 review 在 dispatch 前因 canonical budget attempt identity 无效而 unavailable；未调用 provider，未产出 review result

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：T008 的唯一 verify publisher/canonical guard、根因归并与控制面登记已实现；inventory 登记唯一 current-view 机制 `stage-handoff`。经用户授权，receipt reuse defect 已用显式 authenticated Workspace 参数修复。
- **executed_commands**：与 T007 共用全部 bounded segment、scope correction RED/GREEN 和 freshness 结果；最终 `tests/official-component-receipts.test.mjs` 52/52 pass，`tests/integration/verify-freshness-selection.test.mjs` 17/17 pass。
- **evidence_refs**：`quality/tests/workflowhub-research-handoff-hardening/T007-T008.json`（canonical external task-store record read back; current status partial）。
- **covered_ac**：AC-GOVERNANCE-001/002 的 producer/consumer/negative writer/inventory 及 receipt reuse/rerun 路径均有绿色证据。
- **review_fact**：独立只读子代理对新增修复返回 `no findings`；正式 `wh-review` 仍为 `unavailable: REVIEW_RETRY_BUDGET_UNKNOWN`，未调用 provider。
- **completed_at**：`2026-09-10`
- **执行事实**：实现边界保持在既有控制面；新增 scope 只有 `runtime/evidence/canonical-receipt-writer.mjs` 两处参数连线，没有第二 task root、public command 或事实 writer。

#### T009 — RED：五 stage outcome 后置 reflection sibling 未消费

- **ID**：T009
- **Phase**：Phase P1 — 集成纵切
- **goal**：复现 bridge outcome 已稳定、宿主已给独立 v2 judgment，但 official run 未在 stage publication 后消费而恒定 executor_absent 的缺口
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-research-handoff-hardening-20260909/spec.md","hash":"730abd68651d4aeba23fa89ea5cd5a45c47451685c52e85745668c6674cf80d2","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-research-handoff-hardening-20260909/plan.md","hash":"4d4a2f1ac6c7d44f3b2718f3f0f2166443dd7639b3679072a11413c30d6489a8","id":"PLAN"}]`
- **source_refs / decision_refs**：R-018；D-008；OPEN-004
- **输入**：当前 accepted spec/plan、前序任务真实输出与已核实 code anchors
- **依赖**：T008
- **并行**：否 — 共享 stage runtime/host seam，必须按 producer-before-consumer 串行
- **FR**：FR-REFLECTION-001、FR-REFLECTION-002
- **AC**：AC-REFLECTION-001
- **动作**：新增 outcome 先定稿、sibling 后生成、五 stage publication 后自动消费，以及 missing/identity mismatch/timeout/throw 的失败断言
- **精确文件**：`tests/contract/stage-reflection-wiring.test.mjs`、`tests/contract/stage-runner-reflection.test.mjs`、`tests/e2e/stage-reflection-real-task.test.mjs`、`tests/stage-interaction-contract.test.mjs`
- **boundary**：files: `tests/contract/stage-reflection-wiring.test.mjs`、`tests/contract/stage-runner-reflection.test.mjs`、`tests/e2e/stage-reflection-real-task.test.mjs`、`tests/stage-interaction-contract.test.mjs`; symbols/regions: 仅本卡 goal 所述 producer/reader/test 区域
- **输出**：目标断言导致的 RED 证据
- **Knowledge**：不得放宽质量谓词，不得用 fixture、文件存在或自由文本冒充真实运行
- **verification_role**：RED
- **paired_task**：T010
- **gate_cmd**：`npx vitest run tests/contract/stage-reflection-wiring.test.mjs tests/contract/stage-runner-reflection.test.mjs tests/e2e/stage-reflection-real-task.test.mjs tests/stage-interaction-contract.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-REFLECTION {"pass":"bridge outcome 先获稳定 ref；五 stage official run 在 publication 后自动消费独立 sibling，生成含 executor/attempt/output hash/current binding 的 ok/degraded reflection；失败不翻转 stage","reject":{"input":"judgment 嵌入 outcome 形成自引用、另调公开 reflect、只有测试注入成功或 runtime 合成 judgment 被当作生产完成","expected_rejection":"target assertion fails with non-zero exit","observation":"RED output names the target contract mismatch rather than setup failure"}}`
- **evidence_path**：`quality/tests/workflowhub-research-handoff-hardening/T009-T010.json`
- **STOP**：命令/fixture 失败而非目标 assertion、文件越界、需新产品决定或弱化负例时停止并返回 owner
- **recovery**：build-code owner 仅回退本卡改动，保留 RED/失败原始事实；方向或规格变化分别回 make-decision/build-spec
- **task risk**：局部绿色掩盖真实 host consumer 或把 unavailable 改写为 completed
- **test tier / test method**：fullstack / fullstack-slice-testing；跨 runtime、host bridge、schema、skills/workflow seam
- **scenarios / commands / expected exit / oracle**：五 stage success、timeout、throw、executor absent、judgment missing、A/A 幂等与 B 新件；命令同 gate_cmd；RED=1，GREEN=由配对卡定义；ORACLE-REFLECTION
- **fixtures_services**：临时 task store + 当前域确定性 fixtures；每个测试清理自身临时目录，不复用历史 current fact
- **coverage limits**：不验证模型内容质量分数；只认证真实来源、结构、时限和非阻断
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：unavailable
- **semantic_review_ref**：error:REVIEW_RETRY_BUDGET_UNKNOWN
- **semantic_review_reason**：正式 review 在 dispatch 前因 canonical budget attempt identity 无效而 unavailable；未调用 provider，未产出 review result

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：T009 RED was reproduced before the sibling-consumption fix; the same bounded gate is now green under T010 with timeout, throw, missing executor, identity mismatch, and non-blocking failure coverage retained.
- **executed_commands**：Declared T009/T010 gate `npx vitest run tests/contract/stage-reflection-wiring.test.mjs tests/contract/stage-runner-reflection.test.mjs tests/e2e/stage-reflection-real-task.test.mjs tests/stage-interaction-contract.test.mjs` (exit 0, 4 files / 56 tests); earlier RED run failed on the target official-task reflection assertion.
- **evidence_refs**：`quality/tests/workflowhub-research-handoff-hardening/T009-T010.json`
- **covered_ac**：`AC-REFLECTION-001`
- **review_fact**：`unavailable: REVIEW_RETRY_BUDGET_UNKNOWN`; no provider call or review result.
- **completed_at**：`2026-09-10`
- **执行事实**：GREEN evidence is current; the earlier RED is retained as the target assertion failure, not treated as a quality pass.

#### T010 — GREEN：official run 消费 outcome 后置 reflection sibling

- **ID**：T010
- **Phase**：Phase P1 — 集成纵切
- **goal**：bridge 先返回稳定 outcome ref/hash；宿主生成独立 judgment 后，由随后 official run 的 stage-end hook 自动消费
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-research-handoff-hardening-20260909/spec.md","hash":"730abd68651d4aeba23fa89ea5cd5a45c47451685c52e85745668c6674cf80d2","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-research-handoff-hardening-20260909/plan.md","hash":"4d4a2f1ac6c7d44f3b2718f3f0f2166443dd7639b3679072a11413c30d6489a8","id":"PLAN"}]`
- **source_refs / decision_refs**：R-018；D-008；OPEN-004
- **输入**：当前 accepted spec/plan、前序任务真实输出与已核实 code anchors
- **依赖**：T009
- **并行**：否 — 共享 stage runtime/host seam，必须按 producer-before-consumer 串行
- **FR**：FR-REFLECTION-001、FR-REFLECTION-002
- **AC**：AC-REFLECTION-001
- **动作**：official run 接收 plain JSON `stage_reflection` sibling 但不交给 handler；stage-reflect 导出窄 sibling validator，schema 明确 current binding/executor attempt/output hash；runner 在 stage publication 后把原始 value 直接交给 reflection transaction；沿用 30s deadline 并验证宿主 attempt 起止时间
- **精确文件**：`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-reflect.mjs`、`runtime/schemas/stage-reflection.v2.json`、`tools/cli/stage-runtime.mjs`、`skills/workflowhub-host-protocol/SKILL.md`、`tests/contract/host-outcome-bridge.test.mjs`、`tests/contract/stage-reflection-wiring.test.mjs`、`tests/contract/stage-runner-reflection.test.mjs`、`tests/e2e/stage-reflection-real-task.test.mjs`、`tests/stage-interaction-contract.test.mjs`
- **boundary**：files: `runtime/stage/stage-runner.mjs`、`runtime/stage/stage-reflect.mjs`、`runtime/schemas/stage-reflection.v2.json`、`tools/cli/stage-runtime.mjs`、`skills/workflowhub-host-protocol/SKILL.md`、`tests/contract/host-outcome-bridge.test.mjs`、`tests/contract/stage-reflection-wiring.test.mjs`、`tests/contract/stage-runner-reflection.test.mjs`、`tests/e2e/stage-reflection-real-task.test.mjs`、`tests/stage-interaction-contract.test.mjs`; symbols/regions: stage-publication 后 direct judgment consumption、sibling validator/current binding/attempt timing、run input allowlist/private sibling extraction、host bridge→official run protocol、仅本卡 goal 所述测试区域
- **输出**：同 oracle GREEN 证据与保留的负例；证明 outcome publication 早于 judgment 生成，stage publication 早于 reflection transaction
- **Knowledge**：不得放宽质量谓词，不得用 fixture、文件存在或自由文本冒充真实运行
- **verification_role**：GREEN
- **paired_task**：T009
- **gate_cmd**：`npx vitest run tests/contract/stage-reflection-wiring.test.mjs tests/contract/stage-runner-reflection.test.mjs tests/e2e/stage-reflection-real-task.test.mjs tests/stage-interaction-contract.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-REFLECTION {"pass":"bridge outcome 先获稳定 ref；五 stage official run 在 publication 后自动消费独立 sibling，生成含 executor/attempt/output hash/current binding 的 ok/degraded reflection；失败不翻转 stage","reject":{"input":"judgment 嵌入 outcome 形成自引用、另调公开 reflect、只有测试注入成功或 runtime 合成 judgment 被当作生产完成","expected_rejection":"target assertion fails with non-zero exit","observation":"RED output names the target contract mismatch rather than setup failure"}}`
- **evidence_path**：`quality/tests/workflowhub-research-handoff-hardening/T009-T010.json`
- **STOP**：命令/fixture 失败而非目标 assertion、文件越界、需新产品决定或弱化负例时停止并返回 owner
- **recovery**：build-code owner 仅回退本卡改动，保留 RED/失败原始事实；方向或规格变化分别回 make-decision/build-spec
- **task risk**：局部绿色掩盖真实 host consumer 或把 unavailable 改写为 completed
- **test tier / test method**：fullstack / fullstack-slice-testing；跨 runtime、host bridge、schema、skills/workflow seam
- **scenarios / commands / expected exit / oracle**：与 T009 相同并验证 source outcome 唯一、semantic key 幂等、raw hash；命令同 gate_cmd；RED=由配对卡定义，GREEN=0；ORACLE-REFLECTION
- **fixtures_services**：临时 task store + 当前域确定性 fixtures；每个测试清理自身临时目录，不复用历史 current fact
- **coverage limits**：宿主若不提供 sibling judgment 则 unavailable；不把 judgment 嵌入 outcome，不新增 public command 或 deterministic judgment generator
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：unavailable
- **semantic_review_ref**：error:REVIEW_RETRY_BUDGET_UNKNOWN
- **semantic_review_reason**：正式 review 在 dispatch 前因 canonical budget attempt identity 无效而 unavailable；未调用 provider，未产出 review result

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：Official run now consumes an independent v2 reflection sibling only after stage publication; the runtime validates outcome ref, executor attempt/timing/output hash, current binding, and keeps the sibling out of the handler input. Executor throw/timeout persists an empty content-addressed failed record with the original error, so legacy fixed bytes cannot block current failure persistence; missing executor remains unavailable.
- **executed_commands**：`npx vitest run tests/contract/stage-reflection-wiring.test.mjs tests/contract/stage-runner-reflection.test.mjs tests/e2e/stage-reflection-real-task.test.mjs tests/stage-interaction-contract.test.mjs` (exit 0, 4 files / 56 tests).
- **evidence_refs**：`quality/tests/workflowhub-research-handoff-hardening/T009-T010.json`
- **covered_ac**：`AC-REFLECTION-001`
- **review_fact**：`unavailable: REVIEW_RETRY_BUDGET_UNKNOWN`; no provider call or review result.
- **completed_at**：`2026-09-10`
- **执行事实**：GREEN; official five-stage path passed, successful records carry v2 executor/current binding, verify-code throw remained failed and non-blocking.

#### T011 — RED：reflection 后 current handoff 缺失

- **ID**：T011
- **Phase**：Phase P1 — 集成纵切
- **goal**：复现四 author stage 无 current handoff/绝对路径，并覆盖覆盖失败与双向隔离
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-research-handoff-hardening-20260909/spec.md","hash":"730abd68651d4aeba23fa89ea5cd5a45c47451685c52e85745668c6674cf80d2","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-research-handoff-hardening-20260909/plan.md","hash":"4d4a2f1ac6c7d44f3b2718f3f0f2166443dd7639b3679072a11413c30d6489a8","id":"PLAN"}]`
- **source_refs / decision_refs**：R-003、R-004、R-005、R-006、R-007、R-019、R-020；D-009；Clarify 2B
- **输入**：当前 accepted spec/plan、前序任务真实输出与已核实 code anchors
- **依赖**：T010
- **并行**：否 — 共享 stage runtime/host seam，必须按 producer-before-consumer 串行
- **FR**：FR-HANDOFF-001、FR-HANDOFF-002、FR-HANDOFF-003、FR-HANDOFF-004
- **AC**：AC-HANDOFF-001
- **动作**：新增 13 区、front matter、原子覆盖、无 archive、严格时序、stale warning 与手工续接断言
- **精确文件**：`tests/contract/stage-handoff.test.mjs`、`tests/contract/stage-runner-on-stage-end.test.mjs`、`tests/contract/workflow-synchronization-consumer.test.mjs`
- **boundary**：files: `tests/contract/stage-handoff.test.mjs`、`tests/contract/stage-runner-on-stage-end.test.mjs`、`tests/contract/workflow-synchronization-consumer.test.mjs`; symbols/regions: 仅本卡 goal 所述 producer/reader/test 区域
- **输出**：目标断言导致的 RED 证据
- **Knowledge**：不得放宽质量谓词，不得用 fixture、文件存在或自由文本冒充真实运行
- **verification_role**：RED
- **paired_task**：T012
- **gate_cmd**：`npx vitest run tests/contract/stage-handoff.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs tests/contract/workflow-synchronization-consumer.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-HANDOFF {"pass":"四 author stage 在 reflection 终态后写唯一 current_only 文件并返回绝对路径，失败双方隔离","reject":{"input":"新增 step/hook、保存历史、旧文件冒充 current、verify-code 生成 handoff","expected_rejection":"target assertion fails with non-zero exit","observation":"RED output names the target contract mismatch rather than setup failure"}}`
- **evidence_path**：`quality/tests/workflowhub-research-handoff-hardening/T011-T012.json`
- **STOP**：命令/fixture 失败而非目标 assertion、文件越界、需新产品决定或弱化负例时停止并返回 owner
- **recovery**：build-code owner 仅回退本卡改动，保留 RED/失败原始事实；方向或规格变化分别回 make-decision/build-spec
- **task risk**：局部绿色掩盖真实 host consumer 或把 unavailable 改写为 completed
- **test tier / test method**：fullstack / fullstack-slice-testing；跨 runtime、host bridge、schema、skills/workflow seam
- **scenarios / commands / expected exit / oracle**：四 stage success、rerun overwrite、reflection unavailable、write/readback failure、manual next-session read；命令同 gate_cmd；RED=1，GREEN=由配对卡定义；ORACLE-HANDOFF
- **fixtures_services**：临时 task store + 当前域确定性 fixtures；每个测试清理自身临时目录，不复用历史 current fact
- **coverage limits**：不覆盖 verify-code、自动发现或仓外旧 skill；它们是明确非目标
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：unavailable
- **semantic_review_ref**：error:REVIEW_RETRY_BUDGET_UNKNOWN
- **semantic_review_reason**：正式 review 在 dispatch 前因 canonical budget attempt identity 无效而 unavailable；未调用 provider，未产出 review result

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：T011 handoff absence/failure scenarios are covered by the paired contract slice; the current gate preserves the original failure boundaries while T012 supplies the implementation.
- **executed_commands**：`npx vitest run tests/contract/stage-handoff.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs tests/contract/workflow-synchronization-consumer.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --reporter=dot` (exit 0, 3 files / 31 tests).
- **evidence_refs**：`quality/tests/workflowhub-research-handoff-hardening/T011-T012.json`
- **covered_ac**：`AC-HANDOFF-001`
- **review_fact**：`unavailable: REVIEW_RETRY_BUDGET_UNKNOWN`; no provider call or review result.
- **completed_at**：`2026-09-10`
- **执行事实**：GREEN paired evidence; failure isolation, fixed current path, absolute path, overwrite, and 13-section readback all passed.

#### T012 — GREEN：stage-handoff 技能与同 hook 发布

- **ID**：T012
- **Phase**：Phase P1 — 集成纵切
- **goal**：实现可独立调用的 stage-handoff，并在 reflection 终态后原子发布 current view
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-research-handoff-hardening-20260909/spec.md","hash":"730abd68651d4aeba23fa89ea5cd5a45c47451685c52e85745668c6674cf80d2","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-research-handoff-hardening-20260909/plan.md","hash":"4d4a2f1ac6c7d44f3b2718f3f0f2166443dd7639b3679072a11413c30d6489a8","id":"PLAN"}]`
- **source_refs / decision_refs**：R-003、R-004、R-005、R-006、R-007、R-019、R-020；D-009；Clarify 2B
- **输入**：当前 accepted spec/plan、前序任务真实输出与已核实 code anchors
- **依赖**：T011
- **并行**：否 — 共享 stage runtime/host seam，必须按 producer-before-consumer 串行
- **FR**：FR-HANDOFF-001、FR-HANDOFF-002、FR-HANDOFF-003、FR-HANDOFF-004
- **AC**：AC-HANDOFF-001
- **动作**：新增 renderer/publisher/skill bundle；挂四 author stage dependency；透传状态、绝对路径和 stale warning
- **精确文件**：`runtime/stage/stage-handoff.mjs`、`runtime/stage/stage-runner.mjs`、`skills/stage-handoff/SKILL.md`、`skills/stage-handoff/skill-bundle.json`、`workflows/make-decision/skill-deps.yaml`、`workflows/build-spec/skill-deps.yaml`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-code/skill-deps.yaml`、`skills/catalog.yaml`、`skills/reuse-registry.md`、`CONTEXT.md`、`docs/architecture/move-map.json`、`tests/contract/stage-handoff.test.mjs`、`tests/contract/stage-runner-on-stage-end.test.mjs`、`tests/contract/workflow-synchronization-consumer.test.mjs`
- **boundary**：files: `runtime/stage/stage-handoff.mjs`、`runtime/stage/stage-runner.mjs`、`skills/stage-handoff/SKILL.md`、`skills/stage-handoff/skill-bundle.json`、`workflows/make-decision/skill-deps.yaml`、`workflows/build-spec/skill-deps.yaml`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-code/skill-deps.yaml`、`skills/catalog.yaml`、`skills/reuse-registry.md`、`CONTEXT.md`、`docs/architecture/move-map.json`、`tests/contract/stage-handoff.test.mjs`、`tests/contract/stage-runner-on-stage-end.test.mjs`、`tests/contract/workflow-synchronization-consumer.test.mjs`; symbols/regions: 仅本卡 goal 所述 producer/reader/test 区域
- **输出**：同 oracle GREEN 证据与保留的负例
- **Knowledge**：不得放宽质量谓词，不得用 fixture、文件存在或自由文本冒充真实运行
- **verification_role**：GREEN
- **paired_task**：T011
- **gate_cmd**：`npx vitest run tests/contract/stage-handoff.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs tests/contract/workflow-synchronization-consumer.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-HANDOFF {"pass":"四 author stage 在 reflection 终态后写唯一 current_only 文件并返回绝对路径，失败双方隔离","reject":{"input":"新增 step/hook、保存历史、旧文件冒充 current、verify-code 生成 handoff","expected_rejection":"target assertion fails with non-zero exit","observation":"RED output names the target contract mismatch rather than setup failure"}}`
- **evidence_path**：`quality/tests/workflowhub-research-handoff-hardening/T011-T012.json`
- **STOP**：命令/fixture 失败而非目标 assertion、文件越界、需新产品决定或弱化负例时停止并返回 owner
- **recovery**：build-code owner 仅回退本卡改动，保留 RED/失败原始事实；方向或规格变化分别回 make-decision/build-spec
- **task risk**：局部绿色掩盖真实 host consumer 或把 unavailable 改写为 completed
- **test tier / test method**：fullstack / fullstack-slice-testing；跨 runtime、host bridge、schema、skills/workflow seam
- **scenarios / commands / expected exit / oracle**：与 T011 相同且失败返回 unavailable 不覆盖 reflection/stage result；命令同 gate_cmd；RED=由配对卡定义，GREEN=0；ORACLE-HANDOFF
- **fixtures_services**：临时 task store + 当前域确定性 fixtures；每个测试清理自身临时目录，不复用历史 current fact
- **coverage limits**：不新增 archive/backup/index/第二 hook；source refs 只作带 hash 指针不复制正文
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：unavailable
- **semantic_review_ref**：error:REVIEW_RETRY_BUDGET_UNKNOWN
- **semantic_review_reason**：正式 review 在 dispatch 前因 canonical budget attempt identity 无效而 unavailable；未调用 provider，未产出 review result

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：Added the independent stage-handoff renderer/publisher and skill registration; the single stage-end hook authenticates TaskHandle/current snapshot/canonical outcome/source hashes and persisted four-material bytes, then atomically overwrites and reads back the fixed current handoff for four author stages. Material refs are real artifact refs; handoff failures stay isolated.
- **executed_commands**：`npx vitest run tests/contract/stage-handoff.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs tests/contract/workflow-synchronization-consumer.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --reporter=dot` (exit 0, 3 files / 31 tests).
- **evidence_refs**：`quality/tests/workflowhub-research-handoff-hardening/T011-T012.json`
- **covered_ac**：`AC-HANDOFF-001`
- **review_fact**：`unavailable: REVIEW_RETRY_BUDGET_UNKNOWN`; no provider call or review result.
- **completed_at**：`2026-09-10`
- **执行事实**：GREEN; no verify-code handoff, no archive/backup/index, and reflection/stage completion remain independent from handoff failure.

#### T013 — RED：UI applicability 自由文本与 packet 键名

- **ID**：T013
- **Phase**：Phase P1 — 集成纵切
- **goal**：证明自由文本 source 让 UI 判定与顶层声明冲突，且只有错误键名才让 packet 报 navigation 缺失
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-research-handoff-hardening-20260909/spec.md","hash":"730abd68651d4aeba23fa89ea5cd5a45c47451685c52e85745668c6674cf80d2","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-research-handoff-hardening-20260909/plan.md","hash":"4d4a2f1ac6c7d44f3b2718f3f0f2166443dd7639b3679072a11413c30d6489a8","id":"PLAN"}]`
- **source_refs / decision_refs**：R-021；D-010；PFACT-011、PFACT-012；OPEN-013
- **输入**：当前 accepted spec/plan、前序任务真实输出与已核实 code anchors
- **依赖**：T012
- **并行**：否 — 共享 stage contracts/material-workspace seam，必须串行
- **FR**：FR-MATERIAL-001、FR-MATERIAL-002
- **AC**：AC-MATERIAL-001
- **动作**：新增结构化通过、声明冲突、来源缺失与生产键名 packet 构建断言，不改生产实现；**合并后复核**：reader 侧 `sourceConclusion` 在基线即支持对象 `conclusion`，本卡 RED 只针对自由文本 source 的误判与 writer 侧共享校验缺失
- **精确文件**：`tests/contract/ui-applicability-contract.test.mjs`
- **boundary**：files: `tests/contract/ui-applicability-contract.test.mjs`; symbols/regions: 仅本卡 goal 所述 reader/validator/test 区域
- **输出**：目标断言导致的 RED 证据
- **Knowledge**：不得默认 `non_ui`，不得用手写对象或错误键名替代生产入口
- **verification_role**：RED
- **paired_task**：T014
- **gate_cmd**：`npx vitest run tests/contract/ui-applicability-contract.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-MATERIAL {"pass":"三输入显式结论得 non_ui 且 declared=derived；冲突 fail-loud；缺失保持 unknown；packet 由生产入口构建成功","reject":{"input":"自由文本 source 或错误键名被当作通过","expected_rejection":"target assertion fails with non-zero exit","observation":"RED output names the UI contract mismatch rather than setup failure"}}`
- **evidence_path**：`quality/tests/workflowhub-research-handoff-hardening/T013-T014.json`
- **STOP**：命令/fixture 失败而非目标 assertion、文件越界、需新产品决定或弱化负例时停止并返回 owner
- **recovery**：build-code owner 仅回退本卡改动，保留 RED/失败原始事实；方向或规格变化分别回 make-decision/build-spec
- **task risk**：为通过而默认 `non_ui`，或扩写永久兼容正则
- **test tier / test method**：fullstack / fullstack-slice-testing；跨 stage contracts、material workspace 与决策材料
- **scenarios / commands / expected exit / oracle**：结构化通过、声明冲突、来源缺失、生产键名 packet 构建成功、错误键名失败；命令同 gate_cmd；RED=1，GREEN=由配对卡定义；ORACLE-MATERIAL
- **fixtures_services**：临时 decision-log UI 事实与 packet 构建输入；每个测试清理自身临时目录
- **coverage limits**：不新增第五材料，不覆盖 Web/UI 页面判定
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：unavailable
- **semantic_review_ref**：error:REVIEW_RETRY_BUDGET_UNKNOWN
- **semantic_review_reason**：正式 review 在 dispatch 前因 canonical budget attempt identity 无效而 unavailable；未调用 provider，未产出 review result

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：UI applicability negative/positive contract coverage is present; the paired implementation uses explicit structured conclusions and preserves unknown/conflict states.
- **executed_commands**：`npx vitest run tests/contract/ui-applicability-contract.test.mjs` (exit 0, 1 file / 4 tests).
- **evidence_refs**：`quality/tests/workflowhub-research-handoff-hardening/T013-T014.json`
- **covered_ac**：`AC-MATERIAL-001`
- **review_fact**：`unavailable: REVIEW_RETRY_BUDGET_UNKNOWN`; no provider call or review result.
- **completed_at**：`2026-09-10`
- **执行事实**：GREEN paired evidence; no default `non_ui` and no free-text/incorrect-key fallback was accepted.

#### T014 — GREEN：结构化 UI source 与共享 validator

- **ID**：T014
- **Phase**：Phase P1 — 集成纵切
- **goal**：让写入方与 reader 使用同一判定规则，packet readiness 以生产入口为准
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-research-handoff-hardening-20260909/spec.md","hash":"730abd68651d4aeba23fa89ea5cd5a45c47451685c52e85745668c6674cf80d2","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-research-handoff-hardening-20260909/plan.md","hash":"4d4a2f1ac6c7d44f3b2718f3f0f2166443dd7639b3679072a11413c30d6489a8","id":"PLAN"}]`
- **source_refs / decision_refs**：R-021；D-010；PFACT-011、PFACT-012；OPEN-013
- **输入**：当前 accepted spec/plan、前序任务真实输出与已核实 code anchors
- **依赖**：T013
- **并行**：否 — 共享 stage contracts/material-workspace seam，必须串行
- **FR**：FR-MATERIAL-001、FR-MATERIAL-002
- **AC**：AC-MATERIAL-001
- **动作**：三输入改为显式结论；写入方复用 `validateUiApplicability`；packet readiness 走生产构建入口；**合并后复核**：main 未改 `validateUiApplicability`/`sourceConclusion`，本卡仍是唯一实现点
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/task/material-workspace.mjs`、`tests/contract/ui-applicability-contract.test.mjs`
- **boundary**：files: `runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/task/material-workspace.mjs`、`tests/contract/ui-applicability-contract.test.mjs`; symbols/regions: 仅本卡 goal 所述 reader/validator/test 区域
- **输出**：同 oracle GREEN 证据与保留的负例
- **Knowledge**：不得默认 `non_ui`，不得用手写对象或错误键名替代生产入口
- **verification_role**：GREEN
- **paired_task**：T013
- **gate_cmd**：`npx vitest run tests/contract/ui-applicability-contract.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-MATERIAL {"pass":"三输入显式结论得 non_ui 且 declared=derived；冲突 fail-loud；缺失保持 unknown；packet 由生产入口构建成功","reject":{"input":"自由文本 source 或错误键名被当作通过","expected_rejection":"target assertion fails with non-zero exit","observation":"RED output names the UI contract mismatch rather than setup failure"}}`
- **evidence_path**：`quality/tests/workflowhub-research-handoff-hardening/T013-T014.json`
- **STOP**：命令/fixture 失败而非目标 assertion、文件越界、需新产品决定或弱化负例时停止并返回 owner
- **recovery**：build-code owner 仅回退本卡改动，保留 RED/失败原始事实；方向或规格变化分别回 make-decision/build-spec
- **task risk**：只改本次 JSON 而不锁写入侧共享 validator
- **test tier / test method**：fullstack / fullstack-slice-testing；跨 stage contracts、material workspace 与决策材料
- **scenarios / commands / expected exit / oracle**：与 T013 相同并保留冲突与缺失负例；命令同 gate_cmd；RED=由配对卡定义，GREEN=0；ORACLE-MATERIAL
- **fixtures_services**：临时 decision-log UI 事实与 packet 构建输入；每个测试清理自身临时目录
- **coverage limits**：不新增第五材料，不覆盖 Web/UI 页面判定
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：unavailable
- **semantic_review_ref**：error:REVIEW_RETRY_BUDGET_UNKNOWN
- **semantic_review_reason**：正式 review 在 dispatch 前因 canonical budget attempt identity 无效而 unavailable；未调用 provider，未产出 review result

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：Structured UI source conclusions and shared validator/production packet-entry assertions are covered by the current contract test.
- **executed_commands**：`npx vitest run tests/contract/ui-applicability-contract.test.mjs` (exit 0, 1 file / 4 tests).
- **evidence_refs**：`quality/tests/workflowhub-research-handoff-hardening/T013-T014.json`
- **covered_ac**：`AC-MATERIAL-001`
- **review_fact**：`unavailable: REVIEW_RETRY_BUDGET_UNKNOWN`; no provider call or review result.
- **completed_at**：`2026-09-10`
- **执行事实**：GREEN; conflict fails loudly, missing source remains unknown, and production packet construction is exercised.

#### T015 — RED：身份校验重复与 official fixture 放大

- **ID**：T015
- **Phase**：Phase P1 — 集成纵切
- **goal**：证明同一 authenticated operation 内重复身份校验与重复构造 official fixture 造成超预算耗时
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-research-handoff-hardening-20260909/spec.md","hash":"730abd68651d4aeba23fa89ea5cd5a45c47451685c52e85745668c6674cf80d2","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-research-handoff-hardening-20260909/plan.md","hash":"4d4a2f1ac6c7d44f3b2718f3f0f2166443dd7639b3679072a11413c30d6489a8","id":"PLAN"}]`
- **source_refs / decision_refs**：R-023；D-012；PFACT-016；OPEN-015
- **输入**：当前 accepted spec/plan、前序任务真实输出与已核实 code anchors
- **依赖**：T014
- **并行**：否 — 共享 workspace/task-kernel seam，必须串行
- **FR**：FR-PERFORMANCE-001、FR-PERFORMANCE-002
- **AC**：AC-PERFORMANCE-001
- **动作**：新增 wall-time/Git spawn 预算与身份变化负例断言，不改生产实现；先记录改动前基线（wall-time 与 Git spawn 计数）供 T016 比较；**合并后复核**：main 新增 runtime-profile 校验会增加耗时，基线必须在合并后的快照上重新测量
- **输出补充**：RED 证据须同时包含改动前基线（wall-time 与 Git spawn 计数）
- **精确文件**：`tests/contract/performance-budget.test.mjs`、`tests/contract/acceptance-execution-tier.test.mjs`
- **boundary**：files: `tests/contract/performance-budget.test.mjs`、`tests/contract/acceptance-execution-tier.test.mjs`; symbols/regions: 仅本卡 goal 所述校验/fixture/test 区域
- **输出**：目标断言导致的 RED 证据
- **Knowledge**：不得用删除或放宽身份、快照、材料校验换取速度
- **verification_role**：RED
- **paired_task**：T016
- **gate_cmd**：`npx vitest run tests/contract/performance-budget.test.mjs tests/contract/acceptance-execution-tier.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-PERFORMANCE {"pass":"单 operation 内身份校验不重复触发；fixture 只构造一次；wall-time 与 spawn 计数落在登记预算内；身份变化与跨 operation 仍 fail-loud","reject":{"input":"提速后跳过身份/快照/材料校验，或超预算仍宣称通过","expected_rejection":"target assertion fails with non-zero exit","observation":"RED output names the budget or identity-check mismatch rather than setup failure"}}`
- **evidence_path**：`quality/tests/workflowhub-research-handoff-hardening/T015-T016.json`
- **STOP**：命令/fixture 失败而非目标 assertion、文件越界、需新产品决定或弱化负例时停止并返回 owner
- **recovery**：build-code owner 仅回退本卡改动，保留 RED/失败原始事实；方向或规格变化分别回 make-decision/build-spec
- **task risk**：把超时人工终止写成 failed/passed，或用删校验换绿色
- **test tier / test method**：fullstack / fullstack-slice-testing；跨 task workspace、task kernel 与 official fixture
- **scenarios / commands / expected exit / oracle**：重复 authenticated operation、完整 fixture 重复、身份变化负例、跨 operation 负例；命令同 gate_cmd；RED=1，GREEN=由配对卡定义；ORACLE-PERFORMANCE
- **fixtures_services**：临时 task store 与共享 official fixture；每个测试清理自身临时目录
- **coverage limits**：预算数值已由 OPEN-015 定稿（单 fixture ≤ 15 秒、`-t` 回归 ≤ 60 秒、spawn 低于基线）；不覆盖外部 provider SLA
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：unavailable
- **semantic_review_ref**：error:REVIEW_RETRY_BUDGET_UNKNOWN
- **semantic_review_reason**：正式 review 在 dispatch 前因 canonical budget attempt identity 无效而 unavailable；未调用 provider，未产出 review result

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：Performance RED/GREEN contract is covered on the merged snapshot; repeated browser mutation fixtures were observed over budget, then consolidated into one table-driven official fixture without weakening the negative assertions. The identity-change path remains fail-loud.
- **executed_commands**：RED baseline `gtimeout 65s npx vitest run tests/contract/acceptance-execution-tier.test.mjs -t "keeps browser acceptance unavailable" ...` (exit 124, no completed test in 65s); focused GREEN mutation/adapter group (exit 0, 2 tests, 26.50s); final declared two-file gate (exit 0, 2 files / 41 tests, 418.96s).
- **evidence_refs**：`quality/tests/workflowhub-research-handoff-hardening/T015-T016.json`
- **covered_ac**：`AC-PERFORMANCE-001`
- **review_fact**：`unavailable: REVIEW_RETRY_BUDGET_UNKNOWN`; no provider call or review result.
- **completed_at**：`2026-09-10`
- **执行事实**：`performance-budget.test.mjs` passed both single-operation reuse and identity-refresh negatives in 2.90s during the final gate; the companion acceptance tier file is present and covered by the same successful gate.

#### T016 — GREEN：单 operation 身份复用与 fixture 共享

- **ID**：T016
- **Phase**：Phase P1 — 集成纵切
- **goal**：在单次 authenticated operation 内复用已校验身份并共享 official fixture，同时保留边界校验
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-research-handoff-hardening-20260909/spec.md","hash":"730abd68651d4aeba23fa89ea5cd5a45c47451685c52e85745668c6674cf80d2","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-research-handoff-hardening-20260909/plan.md","hash":"4d4a2f1ac6c7d44f3b2718f3f0f2166443dd7639b3679072a11413c30d6489a8","id":"PLAN"}]`
- **source_refs / decision_refs**：R-023；D-012；PFACT-016；OPEN-015
- **输入**：当前 accepted spec/plan、前序任务真实输出与已核实 code anchors
- **依赖**：T015
- **并行**：否 — 共享 workspace/task-kernel seam，必须串行
- **FR**：FR-PERFORMANCE-001、FR-PERFORMANCE-002
- **AC**：AC-PERFORMANCE-001
- **动作**：单 operation 内缓存已校验身份；fixture 共享一次并对纯载荷变体表驱动；保留 mutation/identity-change 负例；**合并后复核**：预算对照 T015 在合并后快照测得的新基线
- **精确文件**：`runtime/task/workspace.mjs`、`runtime/task/task-kernel-implementation.mjs`、`tests/contract/performance-budget.test.mjs`、`tests/contract/acceptance-execution-tier.test.mjs`
- **boundary**：files: `runtime/task/workspace.mjs`、`runtime/task/task-kernel-implementation.mjs`、`tests/contract/performance-budget.test.mjs`、`tests/contract/acceptance-execution-tier.test.mjs`; symbols/regions: 仅本卡 goal 所述校验/fixture/test 区域
- **输出**：同 oracle GREEN 证据与保留的负例
- **Knowledge**：缓存严格限于单 authenticated operation；跨 operation、身份变化与写入边界必须重新校验
- **verification_role**：GREEN
- **paired_task**：T015
- **gate_cmd**：`npx vitest run tests/contract/performance-budget.test.mjs tests/contract/acceptance-execution-tier.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-PERFORMANCE {"pass":"单 operation 内身份校验不重复触发；fixture 只构造一次；wall-time 与 spawn 计数落在登记预算内；身份变化与跨 operation 仍 fail-loud","reject":{"input":"提速后跳过身份/快照/材料校验，或超预算仍宣称通过","expected_rejection":"target assertion fails with non-zero exit","observation":"RED output names the budget or identity-check mismatch rather than setup failure"}}`
- **evidence_path**：`quality/tests/workflowhub-research-handoff-hardening/T015-T016.json`
- **STOP**：命令/fixture 失败而非目标 assertion、文件越界、需新产品决定或弱化负例时停止并返回 owner
- **recovery**：build-code owner 仅回退本卡改动，保留 RED/失败原始事实；方向或规格变化分别回 make-decision/build-spec
- **task risk**：缓存越界导致身份漂移漏检
- **test tier / test method**：fullstack / fullstack-slice-testing；跨 task workspace、task kernel 与 official fixture
- **scenarios / commands / expected exit / oracle**：与 T015 相同并保留身份变化与跨 operation 负例；命令同 gate_cmd；RED=由配对卡定义，GREEN=0；ORACLE-PERFORMANCE
- **fixtures_services**：临时 task store 与共享 official fixture；每个测试清理自身临时目录
- **coverage limits**：预算数值已由 OPEN-015 定稿（单 fixture ≤ 15 秒、`-t` 回归 ≤ 60 秒、spawn 低于基线）；不覆盖外部 provider SLA
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：unavailable
- **semantic_review_ref**：error:REVIEW_RETRY_BUDGET_UNKNOWN
- **semantic_review_reason**：正式 review 在 dispatch 前因 canonical budget attempt identity 无效而 unavailable；未调用 provider，未产出 review result

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：Single-operation context reuse and identity-change negatives remain covered; 17 pure browser payload-binding mutations now share one official fixture, while the no-adapter boundary stays a separate real negative. The reversed dependency-order regression has the plan-authorized 60s test timeout rather than Vitest's unrelated 5s default.
- **executed_commands**：`npx vitest run tests/contract/acceptance-execution-tier.test.mjs -t "runs the reversed dependency order once" ...` (exit 0, 1 test, 11.83s); `npx vitest run tests/contract/performance-budget.test.mjs tests/contract/acceptance-execution-tier.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --reporter=dot` (exit 0, 2 files / 41 tests, 418.96s).
- **evidence_refs**：`quality/tests/workflowhub-research-handoff-hardening/T015-T016.json`
- **covered_ac**：`AC-PERFORMANCE-001`
- **review_fact**：`unavailable: REVIEW_RETRY_BUDGET_UNKNOWN`; no provider call or review result.
- **completed_at**：`2026-09-10`
- **执行事实**：GREEN oracle complete: fixture-table regression is 26.50s (below 60s), reversed-order regression is 11.83s (below 60s), the final declared gate passes, and performance-budget retains the cross-operation/identity-change checks.

#### T017 — FINAL：current-snapshot aggregate acceptance

- **ID**：T017
- **Phase**：Phase P1 — 集成纵切
- **goal**：一次执行聚合 8 个行为域与 13 个 AC，输出逐 AC 可比较 assertions 和剩余限制
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-research-handoff-hardening-20260909/spec.md","hash":"730abd68651d4aeba23fa89ea5cd5a45c47451685c52e85745668c6674cf80d2","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-research-handoff-hardening-20260909/plan.md","hash":"4d4a2f1ac6c7d44f3b2718f3f0f2166443dd7639b3679072a11413c30d6489a8","id":"PLAN"}]`
- **source_refs / decision_refs**：R-001～R-024；D-001～D-013；OPEN-004、OPEN-006、OPEN-010、OPEN-015、OPEN-016；DEFER-001、DEFER-002
- **输入**：T002/T004/T006/T008/T010/T012/T014/T016 的真实 GREEN、host smoke、review 与当前四材料
- **依赖**：T016
- **并行**：否 — aggregate 消费全部前序事实
- **FR**：FR-RESEARCH-001、FR-RESEARCH-002、FR-RESEARCH-003、FR-RESEARCH-004、FR-EXECUTION-001、FR-EXECUTION-002、FR-EXECUTION-003、FR-EXECUTION-004、FR-REVIEW-001、FR-REVIEW-002、FR-REVIEW-003、FR-GOVERNANCE-001、FR-GOVERNANCE-002、FR-GOVERNANCE-003、FR-GOVERNANCE-004、FR-GOVERNANCE-005、FR-GOVERNANCE-006、FR-GOVERNANCE-007、FR-REFLECTION-001、FR-REFLECTION-002、FR-HANDOFF-001、FR-HANDOFF-002、FR-HANDOFF-003、FR-HANDOFF-004、FR-MATERIAL-001、FR-MATERIAL-002、FR-PERFORMANCE-001、FR-PERFORMANCE-002
- **AC**：AC-RESEARCH-001、AC-RESEARCH-002、AC-RESEARCH-003、AC-EXECUTION-001、AC-EXECUTION-002、AC-REVIEW-001、AC-REVIEW-002、AC-GOVERNANCE-001、AC-GOVERNANCE-002、AC-REFLECTION-001、AC-HANDOFF-001、AC-MATERIAL-001、AC-PERFORMANCE-001
- **动作**：实现并执行唯一 acceptance runner；每个 AC 恰好输出一条 entry，保留 unavailable/partial/failed，不另建状态权威
- **精确文件**：`tests/acceptance/workflowhub-research-handoff-hardening.acceptance.mjs`
- **boundary**：files: `tests/acceptance/workflowhub-research-handoff-hardening.acceptance.mjs`; symbols/regions: acceptance entries、真实 command/service 调用、原始输出与清理
- **输出**：UTF-8 JSON `{"report_status":"generated","acceptance_verdict":"passed|partial|unavailable|failed","entries":[{"acceptance_criterion_id":"...","verdict":"passed|partial|unavailable|failed","assertions":[{"id":"...","expected":...,"actual":...}]}]}`
- **Knowledge**：schema/fixture 绿色不等于 host/provider 真实完成；上游 UI applicability parser 未修前 e2e_scope 仍不可认证 ready
- **verification_role**：N/A — non-behavior aggregate verification
- **paired_task**：N/A — aggregate has no RED/GREEN pair
- **gate_cmd**：`node tests/acceptance/workflowhub-research-handoff-hardening.acceptance.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-FINAL {"pass":"exit 0 只表示合法聚合报告已生成；13 个 active AC 各出现一次并各有 verdict，所有 expected/actual 可比较；只有十三项全 passed 时 acceptance_verdict=passed，任一 partial/unavailable/failed 时 material/quality 不得写 completed/accepted"}`
- **evidence_path**：`quality/tests/workflowhub-research-handoff-hardening/T017.json`
- **STOP**：任一 AC 缺 entry、命令输出无效 JSON、host smoke/review 被替换为 fixture、边界越界或需要新决定
- **recovery**：回到对应 RED/GREEN 卡修复并只重跑受影响命令；最终 aggregate 只在当前快照重新执行一次
- **task risk**：把聚合 runner 自报 passed 当作 runtime 判定，或因上游 non_ui parser 缺口绕填 UI/high-risk scope
- **test tier / test method**：fullstack / fullstack-slice-testing；命令级 aggregate 消费跨 runtime/host/skill 的真实证据
- **scenarios / commands / expected exit / oracle**：全部成功、每域失败、host unavailable、review partial、handoff stale、跨域 seam；当前 gate_cmd / 0（仅报告生成）/ ORACLE-FINAL；验收结果由 `acceptance_verdict` 独立表达
- **fixtures_services**：八域 fixtures + real host bridge smoke refs；runner 保留 stdout/stderr digest 并清理自己创建的临时 task store
- **coverage limits**：不覆盖 Web/UI、verify-code handoff、仓外旧 handoff、外部 provider SLA；缺真调用时对应 AC 不得 pass
- **acceptance_role**：acceptance
- **ui_scope**：non_ui
- **acceptance_data**：`[{"source":"current authenticated task worktree and canonical quality evidence","sample":"eight domain fixtures plus real host bridge smoke references","scenario":"thirteen-criterion current-snapshot aggregate","tier":"command","execution":{"command":"node","args":["tests/acceptance/workflowhub-research-handoff-hardening.acceptance.mjs"],"timeout_ms":120000}}]`
- **e2e_scope**：not_required
- **semantic_review_status**：unavailable
- **semantic_review_ref**：error:REVIEW_RETRY_BUDGET_UNKNOWN
- **semantic_review_reason**：正式 review 在 dispatch 前因 canonical budget attempt identity 无效而 unavailable；未调用 provider，未产出 review result

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：Added the single current-snapshot aggregate runner with one entry per active AC and comparable assertions. It resolves the configured storage root, authenticates `TaskHandle` and current Workspace, captures the current snapshot/material revision, and reads refs through `TaskHandle.readRecordBytes`; arbitrary inline/path payloads and caller-declared `authenticated/current` flags cannot produce passed. It performs no provider call or state mutation.
- **executed_commands**：`node tests/acceptance/workflowhub-research-handoff-hardening.acceptance.mjs` (exit 0; `report_status=generated`, 13 unique entries, `acceptance_verdict=partial`, `AC-RESEARCH-003=unavailable`).
- **evidence_refs**：`quality/tests/workflowhub-research-handoff-hardening/T017.json`
- **covered_ac**：all 13 active AC IDs listed in T017; verdict remains unavailable/partial where upstream evidence is incomplete.
- **review_fact**：`unavailable: REVIEW_RETRY_BUDGET_UNKNOWN`; no provider call or review result.
- **completed_at**：`2026-09-10`
- **执行事实**：Aggregate is generated from the canonical `/Users/Hugh/Hugh/Knowledge/...` task root after all pair records are present; it does not convert unavailable governance or partial execution/review evidence into passed or accepted. The final raw bytes remain at the canonical T017 evidence ref; pair facts are readable, but they lack their own current snapshot/material binding so local gate evidence remains partial.


### Verify

- **Target**：全部 28 FR、13 AC 与 research→status、outcome→completion、review→row/fact、reflection→handoff seam
- **gate_cmd**：`node tests/acceptance/workflowhub-research-handoff-hardening.acceptance.mjs`
- **expected_exit**：0
- **evidence_path**：`quality/tests/workflowhub-research-handoff-hardening/T017.json`
- **Oracle**：ORACLE-FINAL — 每个 active AC 恰好一个 entry，expected/actual 可比较，缺口不被漂白

### Knowledge

research/reflection/review/handoff 事实不授权推进；handoff 是 current view，其他正式原件 immutable；同 task 修复可继续，但完成声明需要真实 AC/review/host evidence。

### STOP

- 命令或 fixture 失败而非目标 assertion；文件越界；必须新增 stage/public command/gate/selector；真实 host consumer 不存在；或需要改变 1A/2B/D-001～D-013。

### Done

8 对 RED/GREEN 都有同命令同 oracle 的真实结果；FINAL 当前快照只执行一次；逐 AC、独立 review、host smoke、剩余风险和失败原始事实均已记录。

### Risks and rollback

- **Risk**：共享 seam 造成局部绿色、host executor 仍未真调用、handoff stale 或死门误删。
- **Prevention**：严格串行、真实 bridge smoke、负例保留、逐对象反向引用和 T017 聚合。
- **Rollback / recovery**：只回退当前卡改动，保留材料与 immutable evidence；未知 consumer 的删除改为 defer。

## 4. Final current-snapshot aggregate strategy

- **tier / method**：fullstack / fullstack-slice-testing
- **scenarios**：13 AC、八域成功/失败/缺失、跨域 seam、host unavailable、review partial、handoff stale
- **command**: `node tests/acceptance/workflowhub-research-handoff-hardening.acceptance.mjs`
- **expected exit**：0
- **oracle**：ORACLE-FINAL — active AC 各一条可比较 assertions，runtime 自己派生结论
- **fixtures_services**：临时 task store、八域 fixtures、真实 host bridge smoke refs；各自清理
- **evidence_path**：`quality/tests/workflowhub-research-handoff-hardening/T017.json`
- **coverage limits**：不覆盖 Web/UI、verify-code handoff、仓外旧 handoff、provider SLA；缺真调用保持 partial/unavailable
- **STOP**：无效 JSON、AC 缺失、边界越界、fixture 冒充 host、上游材料认证缺口被绕过
- **execution_contract**：当前快照运行一次；失败保留原始输出并回对应卡，不用全量测试掩盖局部失败。

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
| OPEN-015 | 性能预算数值与 Git spawn / wall-time oracle 形式 | 状态=resolved_by_plan（`spec.md` OPEN 表记录的是 build-spec 时状态 `open`，本索引为最新处置；本 plan 定稿：单 fixture wall-time ≤ 15 秒、`-t` 回归 ≤ 60 秒、Git spawn 次数低于 T015 记录基线）；负责人=build-plan 已定稿；触发=plan 已给出数值与测量方式；去向=build-code T015/T016 验证；关闭条件=基线测量 + 四条 oracle（① 单 fixture wall-time ≤ 15 秒；② `-t` 精确回归 ≤ 60 秒；③ 同 operation 内 Git spawn 低于 T015 记录基线；④ 身份变化/跨 operation 负例非零退出）全过 |
| OPEN-016 | `quality/verify.json` 生产 publisher 实现点与 canonical guard 方案 | 状态=open；负责人=build-plan；触发=plan 定方案；去向=build-code T007/T008；关闭条件=第二写入者负例通过 |
| DEFER-001 | verify-code 的 stage-handoff | 状态=deferred；负责人=后续任务；触发=用户要求五阶段全覆盖；去向=未来 handoff 范围决策；关闭条件=新决定与真实验收 |
| DEFER-002 | `muyu-search-mcp` 是否正式退役 | 状态=deferred；负责人=后续调研能力任务；触发=需要第二条仓内检索通道；去向=未来工具路由治理；关闭条件=真实能力审计与用户选择 |
| 合并稿（无 DEFER id） | 后续任务合并稿是仓外只读输入，不属本任务交付 | 状态=not_a_deliverable；负责人=external（用户自行管理）；触发=用户后续决定；去向=不在本任务交付；关闭条件=不适用（只读输入） |

## Dependency Graph

- **order**：T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011 → T012 → T013 → T014 → T015 → T016 → T017

```text
T001(RED) → T002(GREEN) → T003(RED) → T004(GREEN) → T005(RED) → T006(GREEN)
→ T007(RED) → T008(GREEN) → T009(RED) → T010(GREEN)
→ T011(RED) → T012(GREEN) → T013(RED) → T014(GREEN) → T015(RED) → T016(GREEN) → T017(FINAL)
```

## Final Boundary Check

- [x] Phase 的 Goal、Files、Tasks、Verify、Knowledge、STOP、Done、Risks and rollback 完整。
- [x] 每个任务只有一张卡和一个唯一完成区；文件均为 Phase NEW/MODIFY 子集。
- [x] 八个行为变化均有同命令、同 oracle 的 RED→GREEN；FINAL 仅一次聚合。
- [x] 依赖无环，28 FR/13 AC 双向追溯；OPEN-004/006/010/016 有 owner/关闭条件（OPEN-015 已由本 plan 定稿）；DEFER-001/002 不被偷做。
- [x] review、test、evidence 只记录事实，不作开始/继续许可证。
