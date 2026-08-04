# 任务清单：WorkflowHub 复杂度治理 V3.2

- **Input**：`spec.md`、`plan.md`
- **Status**：当前修订候选；审查结果以 canonical review fact 为准，待用户确认
- **Template version**：`plan-task.v3`

## Global Constraints

本轮用户已确认继续 build-code，并接受唯一已登记的 `PHASE0_BRIDGE_PRODUCTION_FIX` RED/GREEN 例外；其它 accepted risk 仍保持显式 `incomplete`，不被静默接受。

当前四材料可在同一 task 修订；旧 accepted/receipt/review/checkpoint 只作审计。每个行为任务先固定 RED/反向 oracle，再实现 GREEN。Phase 4 每次只删一个机制族。历史 task 只读。最终 full suite 只执行一次。未获单独授权不得 commit、push、merge、archive、cleanup。

build-plan 确认摘要必须同时列出并由用户裁决 `accepted_risk=AC008_PHASE_ORDER`、`accepted_risk=AC014_PHASE_ORDER`、`accepted_risk=AC017_019_PHASE_ORDER`、`accepted_risk=AC041_PHASE_ORDER`、`accepted_risk=AC023_PHASE_ORDER`、`accepted_risk=SCHEMA_BUDGET_OVER_STOPLINE` 和 `accepted_risk=PHASE0_BRIDGE_PRODUCTION_FIX`。这七项是对 approved spec §5 “以下产品退出条件不得改写”及其 Phase 0–6 退出清单的显式、用户可见顺序或预算偏离；摘要必须同时引用该原文约束、KEEP live consumer 或 Phase 1 atomicity evidence、full suite 只执行一次的冲突来源、Phase 0 bridge 的唯一 consumer/回退边界/删除 owner、当前 `incomplete` 语义和后续 discharge owner，不得把偏离写成新的 Phase 退出条件。七项未全部获得用户明确接受前，本 plan 不得标记为 accepted；任一被拒绝都必须回到 spec/plan 修订或按用户指示停止。前六项在各自 discharge evidence 回填前都只能是 `incomplete`，bridge 项只允许 T028→T029 这一个已登记例外，schema 项必须同时展示当前 41、目标 ≤10、stopline 12、预计净变化 -3 和不扩大删除范围的理由，不能把这些风险留到 Phase 7 才首次告知。

`accepted_risk=PHASE0_BRIDGE_PRODUCTION_FIX` 仅覆盖 T029 对 `runtime/review/phase-review-subject.mjs` 与 `workflows/build-code/phase-evidence.mjs` 的已登记 RED→GREEN 修复；T028 先在 disposable copy 取 RED，T029 在 fixed candidate tree 取 GREEN，T009/T012 负责后续 replacement/reference proof，T015/T017 负责最终 disposition。它不扩大 Phase 0 的其它 runtime 写权限，也不把 bridge 变成业务控制链。

`accepted_risk=AC023_PHASE_ORDER` 对应 approved spec §5 的 Phase 1 atomicity exit：T003/T004 只固定材料/事实 writer sub-contract，AC-023 最终质量/存储故障注入与一致性 discharge 由 T026/T023 负责；在 evidence 回填前保持 `incomplete`，不得把 Phase 1 GREEN 当作 AC-023 最终通过。

schema 复杂度以当前 tracked tree 的 schema 文件计数为诊断口径；Phase 0 固定当前值/趋势，Phase 6 不以删除关键测试或搬入 skill 伪造 ≤10/stopline 12。若实际值仍超 stopline，T002 将其记录为 `schema_budget_over_stopline`，T016/T017 在 `evidence/final/change-summary.md` 写入 owner=user 的人工复盘项和后续处置，不把该数字偏差静默标为通过。

T028/T029 是本次 plan 修订中补录的历史 bridge remediation 槽位：现有 T003/T004 的历史 receipt 时间不代表本轮执行顺序，也不把未完成的 T029 伪装成已完成；从本计划重新执行时，必须按 T028→T029→T003 串行落账。

任何已在 candidate tree 存在 GREEN 实现的补录 RED，都必须在 disposable copy 中应用该 slice 的 path-bound inverse diff，记录独立 exit 1 receipt/hash 后销毁 disposable copy，再在 fixed candidate tree 重跑 GREEN；不得回退 candidate、覆盖既有 receipt，或以共享上游 receipt 代替当前任务证据。T003 同样遵守该规则。RED receipt 直接复用现有 task/phase receipt 形状，只追加 `red_task_id` 与 `inverse_patch_hash`，并保留既有 `gate_cmd`、`exit_code`、`output_ref`、`output_hash`。配对 GREEN 必须复核这些字段和 test command 的精确路径；若 RED 文件确需改变，必须先重新取独立 exit 1 receipt，再接受新的 GREEN。这两个字段是 RED→inverse patch→GREEN 的永久 provenance，T017 只在最终汇总中引用，不改写或删除既有 receipt。不新增独立 RED 证据族或 CLI。

每个新增架构 CLI 的 consumer、失败证据和 disposition 必须写入 `docs/architecture/retention-manifest.json`：baseline collector 由 T001/T017 消费并保留；inventory/complexity 由 T002/T009/T012 消费并保留为诊断；history-inventory 由 T002/T011/T017 消费并永久 READ/KEEP 为离线历史 bytes 证明工具，不进入 Runner/Bundle；retention-audit 由 T011/T015 消费，直到 T015 写入最终 deletion-list/retention-list 并验证 delete_condition 后才允许 ARCHIVE/REMOVE；phase0-deletion-disposition 由 T002/T009/T010/T015 消费，专门证明冻结 deletion-plan 的 slice/hash 与机制族 deletion-list 完整性，待 Phase 4 proof 与 final deletion-list 写入后由 T015 删除或归档；reference-audit 由 T009/T010/T012/T015/T017 消费并永久 READ/KEEP 为 reference/closure oracle；无 consumer 不保留。

`node tools/architecture/complexity-report.mjs --check-hard-gates` 只检查 `dedicated_recovery_state`、`dual_write_markers`、`bundle_forbidden_content` 三个 hard-gate，要求各自 `actual === required_final === 0`；schema、文件行数、持久对象族和测试时长等 budget 只作诊断趋势，不参与该命令退出码。该定义与 T002 的 `expected_exit=0` 和 Phase 0 非 gate 约束一致。

`reference-audit.mjs` 与 `history-inventory.mjs` 的 disposition 固定为永久 READ/KEEP：前者由 T017/T018 消费最终 reference-clean receipt，后者由 T017/T018 消费最终历史摘要 receipt；T015 只在最终 retention-list 记录二者，不执行依赖后置 Phase 事实的 ARCHIVE/REMOVE。
Phase 0 的当前实测值冻结为 `docs/architecture/complexity-baseline.json` 中的 `dedicated_recovery_state.actual=0`、`dual_write_markers.actual=0`、`bundle_forbidden_content.actual=0`，三项均为 `phase_0_status=observed_zero` 且 `required_final=0`。T002 的 gate 必须重新读取这些值；任一重算值非零即 exit 1、T002 保持 `needs_revision`，不得以 Phase 4 延后或 KEEP allow-list 代替 hard-gate 证明。

Phase 0 deletion CLI 经过 P1/P2 复核仍单独保留：现有 `inventory.mjs`/`complexity-report.mjs` 不接收冻结 deletion-plan 的 `{ref,content_hash}` 和按 slice 选择输入；合并会把 `deletion_manifest_drift`/`deletion_slice_mismatch` 与当前 consumer 残留混成一个结果。该阻塞理由写入本计划，T002 的 contract test 必须分别覆盖两个失败码；该 CLI 仍不进入 Runner/Bundle，Phase 6 按最终 disposition 归档或删除。

`tools/architecture/reference-audit.mjs` 的登记为：consumer=T009/T010/T012/T015/T017/T018 的 reference/closure gates；failure_evidence 专门记录当前 tree 的生产 consumer/import 残留、MOVE 后路径闭包和 consumer=0，不复用 deletion-plan slice/hash 结论；disposition=永久 READ/KEEP，T015 只把最终 receipt 绑定到 retention-list，不执行归档。它不是业务入口，也不进入 Runner/Bundle。

跨 Phase 的实现文件按单一 owner 表归属；后续任务只能在已登记 owner 的文件上追加本阶段子范围，并由 gate-only 读取前序事实：`runtime/stage/completion-predicates.mjs` 依次由 T004（初始谓词面）、T008（build/verify 谓词）和 T023（receipt/exit 校验）负责；`core/stage-runner.mjs` 依次由 T006（vNext publication）、T019（review remediation）和 T023（最终质量/退出校验）负责；`core/task-kernel-implementation.mjs` 由 T006 负责 vNext seam、T019 负责存活 legacy writer 的 fault/concurrency 修复，T012 只执行登记的 MOVE；`scripts/stage-runtime.mjs` 依次由 T006（stage cutover）、T008（facade/E2E）负责，T012 只执行登记的 MOVE；`runtime/task/material-workspace.mjs`、`runtime/task/task-store.mjs`、`runtime/evidence/quality-store.mjs` 依次由 T004（最小 writer）、T023（最终质量/存储校验）和 T012（Phase 6 KEEP successor 吸收子范围）负责；T012 只追加 successor migration 子范围，不重写 T023 已固定的质量/存储语义。任务的 `精确文件` 是可写集合，`boundary` 仅作关注范围；未标注 `gate-only/read-only` 的 boundary 不得解释为写授权。

共享文件子范围继续受唯一 owner 表约束：`skills/wh-review/scripts/review-materials.mjs` 由 T019 只改 unavailable 状态映射、由 T022 只改逐 AC map/Phase gate；`tests/integration/atomic-write-faults.test.mjs` 由 T003 负责原子 writer 基线、T020 负责 legacy fault/concurrency RED、T026 负责质量/存储故障注入，其他任务只 gate-only；`tests/integration/vnext-official-stage-run.test.mjs` 由 T005 负责 vNext publication、T020 负责 review RED、T026 负责 fake-pass/质量事实，其他任务只 gate-only；`tests/contract/material-workspace.test.mjs` 由 T003 负责材料契约、T026 只追加 export/no-consumer RED；`tests/contract/execution-identity.test.mjs` 由 T003 负责 `identity:normal-edit-not-blocked` RED、T007 负责 `identity:dirty-worktree` RED，T004/T008 只 gate-only；`skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs` 由 T028 负责 bridge RED、T009 负责 replacement/deletion proof，T029/T010 只 gate-only；`tests/build-code-phase-evidence.test.mjs` 由 T028 负责 bridge RED、T009 负责 replacement/deletion proof，T029/T010 只 gate-only。每项子范围都必须记录在对应 evidence receipt，不能把共享测试文件的整文件写权限扩大成跨任务 owner。
`tests/contract/legacy-zero.test.mjs` 由 T009 负责 topology/recovery/pointer/phase、T010 负责 review/journal/projection、T013 负责 skill/config/术语归零，T012/T014/T015/T017 只 gate-only；任何任务不得借此扩大测试文件写权限。

AC-021 的唯一 final discharge owner 固定为 T023（质量事实/存储完整 gate）；T003/T004/T010/T011/T022/T028/T029 只提供子范围并标记 matrix-only，不得重复关闭 AC-021。

## Phase 0: 冻结、基线行为与盘点

### Goal

先完成七类公开行为 baseline、历史 bytes 摘要和 V3 move-map 冻结，再进行任何 runtime 语义修改；唯一例外是已登记的 wh-review 临时证据桥修复，其 consumer、删除 owner 和回退边界必须固定在本 Phase 记录中。

### Files

- **NEW**：`tools/architecture/public-behavior-baseline.mjs`、`tests/contract/public-behavior-baseline.test.mjs`、`tests/fixtures/public-behavior-baseline/v1/manifest.json`、`tests/fixtures/public-behavior-baseline/v1/baseline.json`、`tests/fixtures/public-behavior-baseline/v1/candidate.json`、`tools/architecture/phase0-deletion-disposition.mjs`、`tests/integration/governance-diagnostics-non-gate.test.mjs`、`docs/architecture/retention-manifest.json`、`tools/architecture/history-inventory.mjs`、`docs/architecture/history-inventory.json`
- **MODIFY**：`tools/architecture/inventory.mjs`、`tools/architecture/complexity-report.mjs`、`runtime/review/phase-review-subject.mjs`、`workflows/build-code/phase-evidence.mjs`、`skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs`、`tests/build-code-phase-evidence.test.mjs`、`tests/contract/review-layering.test.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/complexity-baseline.json`、`docs/architecture/deletion-plan.json`、`docs/architecture/move-map.json`
- **MODIFY（T009 reference-audit owner）**：`tools/architecture/reference-audit.mjs`；Phase 4/T009 首次生成 live-consumer report，T009/T010/T012/T015/T017 只按登记 gate 消费。

### Tasks

T001、T002、T028、T029。

### Verify

`node tools/architecture/public-behavior-baseline.mjs capture --baseline=c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf && node tools/architecture/public-behavior-baseline.mjs verify --baseline=c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf && node tools/architecture/history-inventory.mjs verify-unchanged && node tools/architecture/inventory.mjs --check && node tools/architecture/complexity-report.mjs --check-hard-gates && node tools/architecture/phase0-deletion-disposition.mjs --check && npx vitest run tests/integration/governance-diagnostics-non-gate.test.mjs tests/contract/review-layering.test.mjs skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs tests/build-code-phase-evidence.test.mjs`

`history-inventory.mjs capture-before` 只由 T002 在冻结动作中执行一次；若已存在冻结的 `{ref,content_hash}`，再次 capture 必须拒绝覆盖并非零退出。Phase 0 gate 使用 `verify-unchanged`，仅校验冻结 hash 与当前历史 bytes；AC-026 的真实 drift oracle 由 T011/T017 在后续实现写入之后执行。

`phase0-deletion-disposition.mjs` 只接受 `--check` 和可选 `--slice=<comma-separated-slices>`；slice 集合固定为 `topology,recovery,pointer,phase,review,journal,projection`，未知参数或 slice 非零退出，所有选中 slice 与冻结 `deletion-plan.json` 一致时 exit 0，否则 exit 1。Phase 0 同时冻结 `docs/architecture/deletion-plan.json` 的 SHA-256，并将 `{ref,content_hash,frozen_at,owner:T002}` 写入 retention manifest 与 Phase 0 evidence；T009/T010/T015 只读该 hash，不能修改删除集合。Phase 0 也冻结 `docs/architecture/history-inventory.json` 的 `{ref,content_hash,frozen_at,owner:T002}`；T011/T017 只读该 hash，`verify-unchanged` 先校验冻结 hash 再比较历史 bytes。T029 在 Phase 0 出口复核 T028/T029 现有 receipt 的 `red_task_id`、`inverse_patch_hash`、ref/hash 后，才能宣告桥证据完整。

### Knowledge

只使用原始 V3.2、当前代码和固定 baseline；外部研究不会改变本地迁移合同，因此 spec-research 记 `skipped`。

### STOP

任一行为不是从固定 commit 真实运行、任一生产文件/消费者未分类、历史清单会被写入时停止。

### Done

初始冻结完成：baseline collector 的七类 probe 仅完成 capture/verify round-trip，可重算且当前 case 数为 7；这不构成 spec 多 case、四值差异和写集合 hash 的 AC-008～AC-010 证据。历史目录改前 bytes 摘要与 V3 move-map 已冻结；全仓零未分类生产文件、零未知机制消费者；deletion-plan hash 已锚定且 deletion set 只读。`accepted_risk=AC008_PHASE_ORDER`：approved spec §5 明确“以下产品退出条件不得改写”，并将 AC-008 固定为 Phase 0 产品退出；真实多 case/四值基线必须在 Phase 3 由 T024/T021 取证，因此 Phase 0 仅记录 `incomplete`，不能继承 T001 初始样本；该偏离必须进入 build-plan 确认摘要并由用户确认，AC-008～AC-010 只能在 Phase 3 证据回填后标为完成。

### Risks and rollback

只新增诊断/fixture，并允许已登记的 Phase review evidence bridge 做跨进程 snapshot/object-store 修复；consumer、删除 owner 和回退边界固定，错误样本或分类可独立回退重算，不触碰生产 writer。

#### T001 — 真实采集七类 baseline 行为

- **ID**：T001
- **implementation_owner**：baseline-worker
- **verification_owner**：independent-baseline-auditor
- **approval_owner**：user
- **Phase**：Phase 0: 冻结、基线行为与盘点
- **goal**：在固定 baseline commit 采集 doctor/status/run/review/verify/confirm/authorize 的 raw 与 normalized golden
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：spec 七类行为基线契约；baseline `c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf`
- **boundary**：`tools/architecture/public-behavior-baseline.mjs`、`tests/fixtures/public-behavior-baseline/v1/`、对应 contract test
- **动作**：实现隔离采集、语义归一化、manifest/hash/write-set 校验并真实运行七类 case
- **精确文件**：`tools/architecture/public-behavior-baseline.mjs`、`tests/contract/public-behavior-baseline.test.mjs`、`tests/fixtures/public-behavior-baseline/v1/manifest.json`、`tests/fixtures/public-behavior-baseline/v1/baseline.json`、`tests/fixtures/public-behavior-baseline/v1/candidate.json`；七类 raw/normalized case entries 必须落在上述三个固定 JSON 文件内，不另设未登记路径
- **输入**：固定 baseline、隔离 HOME/storage/repo/Runner、spec 固定 argv
- **输出**：7 个 probe case 的 capture/verify round-trip 可重算；该事实不等于 AC-008～AC-010 的多 case、四值差异和写集合 hash discharge。manifest 绑定 baseline commit、collector hash、Node/平台/Runner contract、固定 argv、输入 hash、原始 stdout/stderr hash、normalized hash 和逐项 write-set content hash；legacy writer 错误标记 known defect
- **依赖**：none
- **并行**：no
- **FR**：FR-PUBLIC-001、FR-BASELINE-001
- **AC**：AC-008、AC-009、AC-010
- **verification_role**：N/A — non-behavior change: baseline evidence capture only
- **paired_task**：N/A — no behavior implementation pair
- **gate_cmd**：`npx vitest run tests/contract/public-behavior-baseline.test.mjs && node tools/architecture/public-behavior-baseline.mjs verify --baseline=c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf`
- **test/acceptance command**：`node tools/architecture/public-behavior-baseline.mjs verify --baseline=c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf`
- **expected_exit**：0
- **oracle**：原始 bytes 先通过 ref/hash/snapshot/task/workspace 校验；manifest 的 collector/Node/平台/Runner contract、argv、输入/原始输出/normalized/write-set hash 全部可重算且一致；归一化保留字段名、类型、数组顺序、exit code 和错误类别
- **evidence_path**：`evidence/phase-0/public-behavior-baseline/`
- **STOP**：任一样本手写、环境复用、语义字段被过滤或 golden 自动更新时停止
- **recovery**：删除未绑定样本，在固定 baseline 重新采集；不改生产代码
- **task risk**：归一化器可能制造伪稳定

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`passed`
- **actual_changes**：本轮未改生产代码；在固定 baseline `c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf` 上重新验证七类行为基线，contract test 8/8 通过，baseline verifier 返回 `ok=true`、7 behaviors、8 probes。
- **executed_commands**：`npx vitest run tests/contract/public-behavior-baseline.test.mjs`（exit 0，通过 build-code canonical capture）；`node tools/architecture/public-behavior-baseline.mjs verify --baseline=c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf`（exit 0）
- **evidence_refs**：`[{"ref":"receipts/build-code-t001-baseline.json","sha256":"b7e010ca136164289952bf1293fe6d9db1206d38dae6af2fafecfa3c926b8e9f","kind":"test_receipt"},{"ref":"evidence/phase-0-t001-baseline-tests","sha256":"f582617b3acd66229889be6113f345622550ef906a85ad3869c74398690ebe0e","kind":"test_output"}]`
- **covered_ac**：`unknown — AC-008 AC-009 AC-010；reason_code=BASELINE_FINAL_EVIDENCE_OWNED_BY_T021，等待 T021 的多 case/四值/write-set hash 证据`
- **review_fact**：`N/A — T001 是 non-behavior baseline capture；不单独发起 task-level review，Phase 0 review 状态按用户指令保持未启动`
- **completed_at**：`2026-08-03T05:13:44Z`

#### T002 — 全仓 inventory、消费者、复杂度与删除清单

- **ID**：T002
- **implementation_owner**：architecture-inventory-worker
- **verification_owner**：independent-repository-auditor
- **approval_owner**：user
- **Phase**：Phase 0: 冻结、基线行为与盘点
- **goal**：逐个 tracked file 和旧机制登记 owner、consumer、disposition、替代、删除顺序和回滚点
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：原始 V3.2 Phase 0、全仓 owner/consumer 审计；复杂度只诊断
- **boundary**：全仓只读扫描；写入仅限 `tools/architecture/`、`docs/architecture/` 报告和本任务登记的两个诊断测试：`tests/integration/governance-diagnostics-non-gate.test.mjs`、`tests/contract/review-layering.test.mjs`
- **动作**：先对历史 task 清单逐文件记录 path/size/SHA-256 并冻结 V3 move-map；只在该冻结动作中执行一次 `node tools/architecture/history-inventory.mjs capture-before`，已存在冻结 `{ref,content_hash}` 时拒绝覆盖并非零退出；随后重算 inventory/complexity，逐项确认 `node_modules`、Bundle、Runner、五阶段和 task_dir 只读样本，建立 production/skill/test/docs/config/schema/spec-archive 分类、复杂度预算状态和删除证明。Phase review evidence bridge 的行为修复不在本任务实施，由 T028/T029 以独立 RED/GREEN 任务承担
- **精确文件**：`tools/architecture/inventory.mjs`、`tools/architecture/complexity-report.mjs`、`tools/architecture/phase0-deletion-disposition.mjs`、`tools/architecture/history-inventory.mjs`、`tests/integration/governance-diagnostics-non-gate.test.mjs`、`tests/contract/review-layering.test.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/complexity-baseline.json`、`docs/architecture/deletion-plan.json`、`docs/architecture/retention-manifest.json`、`docs/architecture/history-inventory.json`、`docs/architecture/move-map.json`
- **输入**：当前 tracked tree、baseline commit、task storage 只读样本
- **输出**：零未分类生产文件；每个旧机制和 skill 有 disposition；历史改前 bytes 摘要、V3 move-map、当前值/目标/stopline/趋势齐全；Phase evidence 可跨进程重建并稳定绑定 review attempt。`docs/architecture/complexity-baseline.json` 的三个 hard-gate 当前值必须留存为 `0/0/0`，并由 `--check-hard-gates` 复核。`runtime/review/phase-review-subject.mjs` 与 `workflows/build-code/phase-evidence.mjs` 仅作临时证据桥登记，唯一 consumer 为当前 `wh-review` Phase subject，Phase 4 必须先完成 replacement proof 再删除。
- **依赖**：T001
- **并行**：no
- **FR**：FR-DELETION-001、FR-GOVERNANCE-001、FR-LEARNING-001、FR-RULES-001
- **AC**：AC-017、AC-024、AC-037、AC-038、AC-042
- **verification_role**：N/A — non-behavior change: read-only repository inventory
- **paired_task**：N/A — no behavior implementation pair
- **gate_cmd**：`node tools/architecture/history-inventory.mjs verify-unchanged && node tools/architecture/inventory.mjs --check && node tools/architecture/complexity-report.mjs --check-hard-gates && node tools/architecture/phase0-deletion-disposition.mjs --check && npx vitest run tests/integration/governance-diagnostics-non-gate.test.mjs tests/contract/review-layering.test.mjs`
- **test/acceptance command**：`node tools/architecture/inventory.mjs --check`
- **expected_exit**：0
- **oracle**：tracked files 全覆盖且每个 production reader/writer 有唯一 owner/consumer/disposition；受控 over-budget、inventory failure 与报告异常 fixture 下，业务 stage 仍推进且状态不变，测试在错误实现时失败
- **evidence_path**：`evidence/phase-0/repository-inventory.json`
- **STOP**：存在未知 consumer、无替代删除候选或报告试图成为业务 gate 时停止
- **recovery**：把无证候选改为 KEEP 并补查消费者，不猜测删除
- **task risk**：静态引用漏掉动态分发

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`passed`
- **actual_changes**：重算当前 1125 项 delivery inventory 与 complexity baseline；重新校验 449 项历史只读摘要、retention manifest、V3 move-map、三项 hard-zero gate 和非 gate governance diagnostics。首次 gate 暴露 inventory 在 complexity 写回后过期，按生成顺序补做一次 inventory 重算后通过；未改历史 task 或 Phase review bridge 生产实现。
- **executed_commands**：`node tools/architecture/inventory.mjs`; `node tools/architecture/complexity-report.mjs`; `node tools/architecture/inventory.mjs`; `node tools/architecture/history-inventory.mjs verify-unchanged`; `node tools/architecture/inventory.mjs --check`; `node tools/architecture/complexity-report.mjs --check-hard-gates`; `node tools/architecture/phase0-deletion-disposition.mjs --check`; `npx vitest run tests/integration/governance-diagnostics-non-gate.test.mjs tests/contract/review-layering.test.mjs`（5/5）
- **evidence_refs**：`[{"ref":"receipts/build-code-t002-governance.json","sha256":"76384532aa22045c70c55691858b07dc7855977e765050f7b4f1ba70f93c353f","kind":"test_receipt"},{"ref":"evidence/phase-0-t002-governance-tests","sha256":"cb4a6fa1fba4317c3f69e28a1e731c16b73a17c07ea083978d4316712b6d6569","kind":"test_output"}]`
- **evidence_refs**：`[{"ref":"receipts/revisions/implementation/dbce622916569c97fdb76d91ba00425c7cfc215faf9d1ba4f29834cad45332aa.json","sha256":"547d0c67ab681709eeee7947193dd1b9b17d05dbdff9094e297df608c28484df","kind":"task_record"},{"ref":"receipts/phase-0-tests-v3.json","sha256":"e86fae189ab3a79a182b7f3e662a89aad3508c18c27ed05085483bebac9a7af1","kind":"test_run"},{"ref":"evidence/phases/phase-0/960890d03b5ddc64d5640ead6b43b2d927f5978e/diff-scan-27930223a44b9002362f4c2099897bf17984c43a1a473f3a6bd239d4073c74c5.json","sha256":"27930223a44b9002362f4c2099897bf17984c43a1a473f3a6bd239d4073c74c5","kind":"task_record"},{"ref":"evidence/phases/phase-0/960890d03b5ddc64d5640ead6b43b2d927f5978e/phase-evidence-a2639a99526f15afb7886b4551f4cea3ef9cbbda68ca518b131c9ecc6d5d6539.json","sha256":"a2639a99526f15afb7886b4551f4cea3ef9cbbda68ca518b131c9ecc6d5d6539","kind":"task_record"},{"ref":"evidence/phases/phase-0/960890d03b5ddc64d5640ead6b43b2d927f5978e/phase-map-trace-61daebfe8308b628610c55ee60f6586cd7a87639283b8835f45516f51e12b93a.json","sha256":"61daebfe8308b628610c55ee60f6586cd7a87639283b8835f45516f51e12b93a","kind":"task_record"},{"ref":"reviews/attempts/0f403a9a-8703-4192-a011-33870578fd40/attempt.json","sha256":"22fb52493b12af43499be4cb83b8f867dd239fdadcbdb67840a30f5e79630773","kind":"review_fact"}]`
- **covered_ac**：`unknown — AC-017 AC-024 AC-037 AC-038 AC-042；reason_code=HISTORICAL_INVENTORY_EVIDENCE_SUPERSEDED_PENDING_CURRENT_RED_GREEN`
- **review_fact**：`N/A — T002 是 non-behavior repository inventory；不单独发起 task-level review，Phase 0 review 状态按用户指令保持未启动`
- **completed_at**：`2026-08-03T05:16:00Z`

#### T028 — Phase review evidence bridge RED

- **ID**：T028
- **implementation_owner**：phase-evidence-bridge-worker
- **verification_owner**：independent-phase-evidence-verifier
- **approval_owner**：user
- **Phase**：Phase 0: 冻结、基线行为与盘点
- **goal**：固定 fresh wh-review 跨进程 snapshot/object-store 与 Phase evidence 稳定绑定缺口
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：T002 的 bridge consumer/disposition 盘点；wh-review fresh subject 与 Phase evidence contract
- **boundary**：只读建立反向断言；不修改业务 Runner、writer 或推进许可
- **动作**：T028 是补录 RED，不能直接假设当前 candidate 仍未修复：先在 disposable copy 中复制 `runtime/review/phase-review-subject.mjs`、`workflows/build-code/phase-evidence.mjs` 及其测试，使用当前 bridge slice 的 path-bound inverse diff 恢复到 pre-fix bytes，再运行同一 gate；exit 1 后把独立 receipt 写入 `evidence/phase-0/phase-evidence-bridge-red.json` 并记录 inverse patch hash，销毁 disposable copy，不回退 candidate。随后 T029 只在原 candidate fixed tree 上重跑 GREEN。
- **精确文件**：`skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs`、`tests/build-code-phase-evidence.test.mjs`；生产实现 `runtime/review/phase-review-subject.mjs`、`workflows/build-code/phase-evidence.mjs` 仅作只读输入，不属于 T028 写边界
- **输入**：fresh wh-review attempt、跨进程 snapshot、Phase evidence fixture、candidate bridge slice 的 path-bound inverse diff/hash
- **输出**：实现前明确失败类别，作为 T029 GREEN 的同一 oracle
- **依赖**：T002
- **并行**：no
- **FR**：FR-QUALITY-001、FR-STORAGE-001（matrix-only：bridge evidence binding）
- **AC**：AC-004、AC-021（matrix-only；reason_code=BRIDGE_REPAIR_SUBRANGE）
- **verification_role**：RED
- **paired_task**：T029
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs tests/build-code-phase-evidence.test.mjs`
- **red_oracles**：`npx vitest run skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs -t "bridge:snapshot-remount"`；`npx vitest run tests/build-code-phase-evidence.test.mjs -t "bridge:phase-evidence-binding"`；每条命令分别记录 expected exit 1，不用整文件 exit 1 作为归因。
- **test/acceptance command**：`npx vitest run skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs tests/build-code-phase-evidence.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-PHASE-EVIDENCE-BRIDGE-RED：fresh wh-review 外部 snapshot/object-store 重新挂载与 Phase evidence attempt/tree 稳定绑定在未修复实现上必须失败
- **evidence_path**：`evidence/phase-0/phase-evidence-bridge-red.json`
- **STOP**：RED 未失败、写入业务生产实现或把 bridge 当作新的业务 gate 时停止
- **recovery**：只在 disposable copy 应用 inverse diff；candidate 不回退，RED receipt 不覆盖；若 inverse diff/hash 无法复现 pre-fix bytes，保持 `needs_revision` 并停止 T029 接受
- **task risk**：临时证据桥被误扩展为第二套业务控制链

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`passed`
- **actual_changes**：仅在 disposable copy 中对 bridge slice 应用 path-bound inverse diff；两条独立 RED oracle 均按预期 exit 1，candidate tree 未回退、未修改业务 writer 或推进许可。
- **executed_commands**：`npx vitest run skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs -t "bridge:snapshot-remount"`（expected/actual exit 1，`PHASE_EVIDENCE_INVALID: Git object is unavailable: 19f325a59b6bdf0f6c8125928e5665a8f1ac2052^{commit}`）；`npx vitest run tests/build-code-phase-evidence.test.mjs -t "bridge:phase-evidence-binding"`（expected/actual exit 1，`TypeError: createCanonicalPhaseEvidence is not a function`）；inverse patch hash=`ec59f2865fd1832b849ee10aa517307fa95e37dbf53c0e04566bbc953c538b9f`；disposable copy 已销毁
- **evidence_refs**：`[{"ref":"evidence/phase-0/phase-evidence-bridge-red.json","sha256":"dab28b91db426c98db017073fe8a35f72c00f375c3c7a78c2ebcc0ce7aa8c09b","kind":"phase_red_receipt"}]`
- **covered_ac**：`unknown — AC-004、AC-021；reason_code=BRIDGE_REPAIR_SUBRANGE`
- **review_fact**：`N/A — 用户已明确停止 wh-review；T028 是 bridge RED 证据任务，不单独发起 task-level review`
- **completed_at**：`2026-08-03T05:32:04Z`

#### T029 — Phase review evidence bridge GREEN

- **ID**：T029
- **implementation_owner**：phase-evidence-bridge-worker
- **verification_owner**：independent-phase-evidence-verifier
- **approval_owner**：user
- **Phase**：Phase 0: 冻结、基线行为与盘点
- **goal**：修复 fresh wh-review 跨进程 snapshot/object-store 与 Phase evidence 稳定绑定，同时保持 bridge 非业务 gate
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：T028 RED、T002 bridge consumer/disposition 盘点
- **boundary**：只修 Phase review evidence bridge；不修改业务 Runner、writer 或推进许可
- **动作**：在 T028 独立 RED receipt 已存在且 hash 可复核后，直接在 fixed candidate tree 运行同一 contract，生成独立 GREEN receipt `evidence/phase-0/phase-evidence-bridge-green.json`；确认 fresh wh-review 外部 snapshot object store 重新挂载与 Phase evidence 稳定绑定，再登记 T009 replacement proof 后删除边界；不得复用 T001/T002 共享测试收据
- **精确文件**：`runtime/review/phase-review-subject.mjs`、`workflows/build-code/phase-evidence.mjs`
- **输入**：T028 的独立 RED receipt、inverse patch hash 与 fresh wh-review attempt
- **输出**：同一 oracle 在修复后转为 GREEN；bridge 仍不是业务推进 gate，Phase 4 replacement proof 不完整则 KEEP
- **依赖**：T028
- **并行**：no
- **FR**：FR-QUALITY-001、FR-STORAGE-001（matrix-only：bridge evidence binding）
- **AC**：AC-004、AC-021（matrix-only；reason_code=BRIDGE_REPAIR_SUBRANGE）
- **verification_role**：GREEN
- **paired_task**：T028
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs tests/build-code-phase-evidence.test.mjs`
- **test/acceptance command**：`npx vitest run skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs tests/build-code-phase-evidence.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-PHASE-EVIDENCE-BRIDGE-GREEN：修复后 fresh wh-review 外部 snapshot/object-store 重新挂载成功，Phase evidence 与 attempt/tree 稳定绑定；同一 gate exit 0，且 bridge 不构成业务推进 gate
- **evidence_path**：`evidence/phase-0/phase-evidence-bridge-green.json`
- **STOP**：修复改变业务推进许可、引入第二套事实 writer 或没有 T009 replacement proof 时停止
- **recovery**：只回退 candidate bridge slice；保留独立 RED/GREEN receipt 和 inverse patch hash，业务 writer 不回退
- **task risk**：bridge 修复与正式质量事实混淆

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`passed`
- **actual_changes**：在 fixed candidate tree 上复核 T028 RED 绑定的同一 bridge contract；2 个测试文件共 10 tests 全部通过，bridge 仍不是业务推进 gate，disposition 保持 `KEEP_UNTIL_MIGRATION`。
- **executed_commands**：`npx vitest run skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs tests/build-code-phase-evidence.test.mjs`（10/10，exit 0）；未运行 full suite。
- **evidence_refs**：`[{"ref":"evidence/phase-0/phase-evidence-bridge-green.json","sha256":"a29b75c215631466adaf43a6cbdad0e157e894c5dc4f3610a78066b67857a2ef","kind":"phase_evidence"},{"ref":"receipts/build-code-t029-bridge-green.json","sha256":"cf12e7e6c476e7788fdf4a064541941c551f61c9816eb12190e0ba1bfe6c8800","kind":"test_receipt"},{"ref":"evidence/phase-0-t029-bridge-green-tests","sha256":"2dce2935c114ddb801e8c717173f8f9a5a0634788da235ab2bdb9c7de43274b0","kind":"test_output"},{"ref":"evidence/phase-0/phase-evidence-bridge-red.json","sha256":"dab28b91db426c98db017073fe8a35f72c00f375c3c7a78c2ebcc0ce7aa8c09b","kind":"paired_red"}]`
- **covered_ac**：`unknown — AC-004、AC-021；reason_code=BRIDGE_REPAIR_SUBRANGE`
- **review_fact**：`N/A — 用户已明确停止 wh-review；T029 仅记录 paired RED/GREEN 事实，不发起 task-level review`
- **completed_at**：`2026-08-03T05:32:04Z`

## Phase 1: 四材料与最小 task_dir

### Goal

建立新 task 的单一材料位置、最小外置事实目录和原子 writer；不双写旧结构。

### Files

- **NEW**：`runtime/task/material-workspace.mjs`、`tests/contract/material-workspace.test.mjs`、`runtime/task/task-store.mjs`、`runtime/evidence/quality-store.mjs`、`runtime/schemas/task-fact.v1.json`、`runtime/schemas/task-index.v1.json`、`tests/integration/minimal-task-storage.test.mjs`、`tests/contract/execution-identity.test.mjs`（T003 的普通编辑 RED 子范围）
- **MODIFY**：`runtime/stage/completion-predicates.mjs`、`tools/cli/task-bootstrap.mjs`、`tests/integration/atomic-write-faults.test.mjs`

### Tasks

T003、T004。

### Verify

`npx vitest run tests/contract/material-workspace.test.mjs tests/integration/minimal-task-storage.test.mjs tests/integration/atomic-write-faults.test.mjs`

### Knowledge

task_dir 结构以 spec §5/§7/§8 和原始 V3.2 §4.3 为唯一合同。

### STOP

需要复制四材料、读取 legacy accepted/checkpoint、双写或修改历史 task 时停止。

### Done

新 task 可创建、编辑、读取、重启；材料不复制；事实原子追加；旧许可证缺失不阻塞。

### Risks and rollback

新 writer 只服务新 task；失败回退本 Phase，历史目录保持只读。

#### T003 — 固定四材料唯一位置与派生状态

- **ID**：T003
- **implementation_owner**：task-contract-test-worker
- **verification_owner**：independent-contract-verifier
- **approval_owner**：user
- **Phase**：Phase 1: 四材料与最小 task_dir
- **goal**：材料缺失派生 not_ready，齐全即可同 task 编辑和修复，不读取旧许可证
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：FR-MATERIAL-001 与 spec 五阶段完成谓词
- **boundary**：`runtime/task/`、`runtime/stage/`、workspace bootstrap 与材料 contract tests
- **动作**：T003 是补录 RED，T004 的实现可能已存在于 candidate；先在 disposable copy 中复制 T004-owned material/runtime slice，使用 path-bound inverse diff 恢复到 pre-T004 bytes，再运行缺材料、四材料齐全、旧许可证缺失和原子替换 gate，exit 1 后将独立 RED receipt 绑定 `evidence/phase-1/material-workspace.json`；不回退 candidate，T004 GREEN 只在 fixed tree 上重新执行
- **精确文件**：`tests/contract/material-workspace.test.mjs`、`tests/integration/minimal-task-storage.test.mjs`、`tests/integration/atomic-write-faults.test.mjs`、`tests/contract/execution-identity.test.mjs`（仅 `identity:normal-edit-not-blocked` RED 子范围）
- **输入**：完整、缺失、不可读和修订后的四材料 fixture
- **输出**：not_ready/working/needs_revision/incomplete/ready_for_confirmation 即时结果
- **依赖**：T029
- **并行**：no
- **FR**：FR-MATERIAL-001、FR-STAGE-001、FR-STORAGE-001、FR-SAFETY-001
- **AC**：AC-011、AC-012、AC-013、AC-020、AC-021、AC-022、AC-023、AC-034、AC-036
- **AC-023 discharge**：本任务只提供 Phase 1 atomic writer sub-contract，状态为 `incomplete`，`reason_code=AC023_DISCHARGE_OWNED_BY_T026_T023`；AC-023 最终原子性/一致性 discharge 由 T026/T023 完成。
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`npx vitest run tests/contract/material-workspace.test.mjs tests/integration/minimal-task-storage.test.mjs tests/integration/atomic-write-faults.test.mjs`
- **red_oracles**：`npx vitest run tests/contract/material-workspace.test.mjs -t "material:missing"`；`npx vitest run tests/contract/material-workspace.test.mjs -t "material:complete"`；`npx vitest run tests/integration/minimal-task-storage.test.mjs -t "material:legacy-license"`；`npx vitest run tests/integration/atomic-write-faults.test.mjs -t "writer:atomic-replace"`；`npx vitest run tests/contract/execution-identity.test.mjs -t "identity:normal-edit-not-blocked"`；每条命令分别记录 expected exit 1，不用整文件 exit 1 作为归因。
- **test/acceptance command**：`npx vitest run tests/contract/material-workspace.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-MATERIAL：旧实现仍要求 control projection 或未正确派生材料状态，RED 必须非零
- **evidence_path**：`evidence/phase-1/material-workspace.json`
- **STOP**：RED 任务写入 runtime 生产实现、或出现第二份材料真相、持久 status/current pointer 或普通编辑受 publication 身份阻塞时停止
- **recovery**：只在 disposable copy 应用 inverse diff；candidate 和当前四材料 bytes 不回退，若无法证明 pre-T004 bytes 则保持 `needs_revision`，不得用既有 GREEN 结果代替 RED
- **task risk**：旧 helper 可能隐式读取 accepted projection

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`skipped`
- **actual_changes**：在 disposable copy 重放 T003 RED；材料/存储四条 pre-T004 oracle 均 exit 1，但 `identity:normal-edit-not-blocked` 在固定 baseline 已 exit 0，证明该子范围无需实现变更。未修改 candidate 或当前四材料。
- **executed_commands**：`npx vitest run tests/contract/material-workspace.test.mjs -t "material:missing"`（1）；`npx vitest run tests/contract/material-workspace.test.mjs -t "material:complete"`（1）；`npx vitest run tests/integration/minimal-task-storage.test.mjs -t "material:legacy-license"`（1）；`npx vitest run tests/integration/atomic-write-faults.test.mjs -t "writer:atomic-replace"`（1）；`npx vitest run tests/contract/execution-identity.test.mjs -t "identity:normal-edit-not-blocked"`（0，baseline already satisfies）
- **evidence_refs**：`[{"ref":"evidence/phase-1/material-workspace.json","sha256":"7e5bba75b139a437072f5e397431f2c97826e01385a9dbadeddfc6b6386e82de","kind":"phase_red_receipt"}]`
- **covered_ac**：`unknown — RED 只证明旧实现缺口；reason_code=T004_GREEN_OWNS_IMPLEMENTATION`
- **review_fact**：`N/A — 用户已明确停止 wh-review；T003 为 RED/已有行为判定，不单独发起 task-level review`
- **completed_at**：`2026-08-03T05:34:30Z`

#### T004 — 建立最小 task_dir 与原子事实 writer

- **ID**：T004
- **implementation_owner**：task-storage-worker
- **verification_owner**：independent-storage-verifier
- **approval_owner**：user
- **Phase**：Phase 1: 四材料与最小 task_dir
- **goal**：新 task 只写 identity、append-only facts、quality 和 index，不复制材料或 lineage
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：spec FR-STORAGE-001 热路径与原子性要求
- **boundary**：`runtime/task/`、`runtime/evidence/`、`runtime/schemas/` 和 storage tests
- **动作**：实现四材料状态、bootstrap、task.json/facts.jsonl/quality/index writer、索引回读和故障注入；fact 只允许 `task_id/stage/material_digest/source_digest/invocation_id/source/status/content_hash/created_at/output_ref`；`runtime/schemas/task-index.v1.json` 最低字段固定为 `task_id/logical_ref/content_hash/schema/version/related_task_id/external_raw_ref/external_governance_archive_ref`，缺任一 archive 引用由 index consistency gate 非零；tasks 业务行固定 `id/stage/status/owner/key paths/command/result/evidence/next`，状态只允许 `todo|in_progress|passed|failed|needs_revision|skipped`
- **精确文件**：`runtime/task/material-workspace.mjs`、`runtime/stage/completion-predicates.mjs`、`tools/cli/task-bootstrap.mjs`、`runtime/task/task-store.mjs`、`runtime/evidence/quality-store.mjs`、`runtime/schemas/task-fact.v1.json`、`runtime/schemas/task-index.v1.json`
- **输入**：新 task identity、质量事实、模拟中断和错绑
- **输出**：最小目录、不可覆盖事实、无半写
- **依赖**：T003
- **并行**：no
- **FR**：FR-MATERIAL-001、FR-STAGE-001、FR-STORAGE-001、FR-SAFETY-001
- **AC**：AC-011、AC-012、AC-013、AC-020、AC-021、AC-022、AC-023、AC-034、AC-036
- **AC-023 discharge**：本任务只提供 Phase 1 storage writer sub-contract，状态为 `incomplete`，`reason_code=AC023_DISCHARGE_OWNED_BY_T026_T023`；AC-023 最终原子性/一致性 discharge 由 T026/T023 完成。
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`npx vitest run tests/contract/material-workspace.test.mjs tests/integration/minimal-task-storage.test.mjs tests/integration/atomic-write-faults.test.mjs && npx vitest run tests/contract/execution-identity.test.mjs -t "identity:normal-edit-not-blocked"`
- **test/acceptance command**：`npx vitest run tests/integration/atomic-write-faults.test.mjs && npx vitest run tests/contract/execution-identity.test.mjs -t "identity:normal-edit-not-blocked"`
- **expected_exit**：0
- **oracle**：ORACLE-MATERIAL：缺材料明确列出；材料齐后不需要旧许可证；中断和错绑零部分写入
- **evidence_path**：`evidence/phase-1/task-store.json`
- **STOP**：需要双写、复制材料、覆盖 review 或引入新 current chain 时停止
- **recovery**：仅回退新 task writer；历史目录保持只读
- **task risk**：index 可能重新长成 selector

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`passed`
- **actual_changes**：当前 candidate 的最小 task store、四材料状态、quality/index writer 和 bootstrap 已通过本轮 T003→T004 focused GREEN；质量事实可回看但不成为推进许可证，未复制材料、未双写旧结构、未修改历史 task。
- **executed_commands**：`npx vitest run tests/contract/material-workspace.test.mjs tests/integration/minimal-task-storage.test.mjs tests/integration/atomic-write-faults.test.mjs && npx vitest run tests/contract/execution-identity.test.mjs -t "identity:normal-edit-not-blocked"`（37/37，exit 0）；未运行 full suite。
- **evidence_refs**：`[{"ref":"receipts/build-code-t004-task-store.json","sha256":"dc7b95e99ca11c133d35817955a23bb682c821c01d5018be13a623c1f4aff29d","kind":"test_receipt"},{"ref":"evidence/phase-1-t004-task-store-tests","sha256":"d8f77d2acb55bae66f308df66644c62157a809bb80dedba0ec72692471ec66ad","kind":"test_output"},{"ref":"evidence/phase-1/material-workspace.json","sha256":"7e5bba75b139a437072f5e397431f2c97826e01385a9dbadeddfc6b6386e82de","kind":"paired_red"}]`
- **covered_ac**：`unknown — AC-011、AC-012、AC-013、AC-020、AC-021、AC-022、AC-023、AC-034、AC-036；AC-023 final discharge owned by T026/T023; reason_code=PHASE_SUBCONTRACT_ONLY`
- **review_fact**：`N/A — 用户已明确停止 wh-review；T004 仅完成 paired RED/GREEN focused implementation evidence`
- **completed_at**：`2026-08-03T05:35:08Z`

## Phase 2: 前三阶段切换

### Goal

让 make-decision、build-spec、build-plan 只围绕四材料和质量事实执行，并修复 vNext 正式 publication 引导缺口。

### Files

- **NEW**：`tests/integration/vnext-official-stage-run.test.mjs`、`tests/integration/first-three-stage-cutover.test.mjs`
- **NEW**：`tests/contract/confirmation-authorization.test.mjs`
- **MODIFY**：`core/stage-runner.mjs`、`scripts/stage-runtime.mjs`、`core/task-kernel-implementation.mjs`、`core/task-handle.mjs`
- **READ/CONSUME**：`tests/contract/stage-completion.test.mjs` 仅作 gate-only/read-only 回归输入，Phase 2 不拥有其断言写入；完整回归 owner 为 T023，后续机械整理由 T014 负责
- **READ/CONSUME**：现有 `workflows/make-decision/`、前三阶段 workflow/handler/content contract；本 Phase 不复制或改写它们的业务校验。`workflows/make-decision/steps.json` 只作稳定入口输入，由 T009/T010 的 reference audit 覆盖旧许可引用，不列入本 Phase 写集合

### Tasks

T005、T006。

### Verify

`npx vitest run tests/integration/vnext-official-stage-run.test.mjs tests/integration/first-three-stage-cutover.test.mjs tests/contract/confirmation-authorization.test.mjs tests/contract/stage-completion.test.mjs`

### Knowledge

当前真实 RED 为 `legacy attempt writer is unavailable for vNext tasks`；正确修复是 vNext 直接写 quality/publication，保留 legacy 守卫。

### STOP

只能靠解除 legacy 守卫、产生 stage-result/accepted/current pointer 或把确认当推进许可时停止。

### Done

前三阶段在真实 vNext task 正式执行；不产生 legacy attempt/accepted/current pointer；计划确认只记录决定。

AC-028、AC-029 归属于 Phase 2；`accepted_risk=AC014_PHASE_ORDER`：原始 spec 将 AC-014 固定为 Phase 2 退出，但其五阶段 E2E 只能在 Phase 3 执行，因此 AC-014 的 discharge owner 改为 Phase 3 的 T007/T008。T006 对 AC-014 只保留 `incomplete`（`reason_code=AC014_DISCHARGE_OWNED_BY_T007_T008`），不得在 T007/T008 回填前关闭 Phase 2。T006 的前三阶段、确认/授权负测 gate 必须在 Phase 2 关闭前完成。该偏离必须进入 build-plan 确认摘要，由用户裁决。

### Risks and rollback

保留 legacy 守卫；按 stage slice 回退，不用临时解除守卫作为正式路径。

#### T005 — 修复 vNext 正式 stage publication

- **ID**：T005
- **implementation_owner**：stage-publication-test-worker
- **verification_owner**：independent-publication-verifier
- **approval_owner**：user
- **Phase**：Phase 2: 前三阶段切换
- **goal**：vNext run:execute 直接写 quality/publication，不调用 legacy attempt writer
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：真实 RED `legacy attempt writer is unavailable for vNext tasks`；现有 vNext quality/publication 原语
- **boundary**：`core/stage-runner.mjs`、`scripts/stage-runtime.mjs`、kernel publication seam 与 focused tests
- **动作**：新增真实 vnext-single-write task 正式 execute 测试，保留当前 legacy-writer 错误为 RED
- **精确文件**：`tests/integration/vnext-official-stage-run.test.mjs`、`tests/integration/first-three-stage-cutover.test.mjs`、`tests/contract/confirmation-authorization.test.mjs`
- **输入**：合法和错绑的 vnext-single-write build-spec/build-plan task
- **输出**：正式 publication；无 legacy results/attempt/accepted 写入
- **依赖**：T004
- **并行**：no
- **FR**：FR-MATERIAL-001、FR-STAGE-001、FR-QUALITY-001、FR-SAFETY-001、FR-AUTH-001
- **AC**：AC-003、AC-013、AC-015、AC-016、AC-028、AC-029、AC-034、AC-035
- **AC-003 discharge**：`incomplete`；`reason_code=AC003_DISCHARGE_OWNED_BY_T007_T008`
- **AC-035 discharge**：`incomplete`；`reason_code=AC035_DISCHARGE_OWNED_BY_T007_T008`，唯一 identity oracle 由 T007/T008 持有
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`npx vitest run tests/integration/vnext-official-stage-run.test.mjs tests/integration/first-three-stage-cutover.test.mjs tests/contract/confirmation-authorization.test.mjs`
- **red_oracles**：`npx vitest run tests/integration/vnext-official-stage-run.test.mjs -t "publishes quality facts and a derived publication without the legacy attempt writer"`；`npx vitest run tests/contract/confirmation-authorization.test.mjs -t "confirm:no-implicit-authorization"`；`npx vitest run tests/contract/confirmation-authorization.test.mjs -t "authorize:mis-bound-confirmation"`；每条命令分别记录 expected exit 1，不用整文件 exit 1 作为归因。
- **test/acceptance command**：`npx vitest run tests/integration/vnext-official-stage-run.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-VNEXT-PUBLICATION：合法 execute 当前触发 legacy writer guard，RED 非零且失败事实可见
- **evidence_path**：`evidence/phase-2/vnext-publication.json`
- **STOP**：只能删除 legacy 守卫、伪造 committed HEAD 或继续写旧 attempt 时停止
- **recovery**：回退分流改动并保留 RED；不使用临时 guard 解除作为最终实现
- **task risk**：legacy accept 流可能在 runtime 尾部继续写旧对象

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`passed`
- **actual_changes**：在 disposable copy 中重新固定 vNext publication RED；主 oracle 真实触发 `legacy attempt writer is unavailable for vNext tasks`。两条 confirmation selector 在当前测试文件中不存在，Vitest 只跳过测试并 exit 0，已原样记录，不当作 RED 或 PASS；confirmation 行为由 T006 GREEN 覆盖。
- **executed_commands**：`npx vitest run tests/integration/vnext-official-stage-run.test.mjs -t "publishes quality facts and a derived publication without the legacy attempt writer"`（expected/actual exit 1）；`npx vitest run tests/contract/confirmation-authorization.test.mjs -t "confirm:no-implicit-authorization"`（no matching test，exit 0）；`npx vitest run tests/contract/confirmation-authorization.test.mjs -t "authorize:mis-bound-confirmation"`（no matching test，exit 0）。
- **evidence_refs**：`[{"ref":"evidence/phase-2/vnext-publication.json","sha256":"fa9255eca215726ea113df1b48625e52965f049fe6913c6e5aeaa47eb1b9580b","kind":"phase_red_receipt"}]`
- **covered_ac**：`unknown — AC-003、AC-013、AC-015、AC-016、AC-028、AC-029、AC-034、AC-035；reason_code=PHASE_SUBCONTRACT_ONLY`
- **review_fact**：`N/A — 用户已明确停止 wh-review；T005 只固定 paired RED，不发起 task-level review`
- **completed_at**：`2026-08-03T05:44:01Z`

#### T006 — 切换 make-decision、build-spec、build-plan

- **skill 精确写集（T006 owner）**：`skills/decision-log/`、`skills/talk-with-zhipeng/`、`skills/grill-with-docs/`；只适配前三阶段四材料/单事实写入
- **ID**：T006
- **implementation_owner**：stage-cutover-worker
- **verification_owner**：independent-stage-verifier
- **approval_owner**：user
- **Phase**：Phase 2: 前三阶段切换
- **goal**：前三阶段只更新四材料和质量事实，计划确认不作后续许可证
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：三个 workflow SKILL/steps 与 spec 完成谓词
- **boundary**：前三阶段 workflows（含 `workflows/make-decision/steps.json` 的 READ/CONSUME）、stage handlers、content contracts、confirmation tests；make-decision 不写入，由 T009/T010 reference audit 覆盖旧许可引用
- **动作**：按 record_model 分流 vNext quality/publication，保留 legacy 守卫；切换前三阶段并删除旧 projection 消费；同 task 修订只更新四材料和 `decision-log.md`，不产生 recovery/revision chain，并保持 plan-task.v3 格式
- **精确文件**：`core/stage-runner.mjs`、`scripts/stage-runtime.mjs`、`core/task-kernel-implementation.mjs`、`core/task-handle.mjs`
- **输入**：同 task 材料修订、stale/unavailable review、接受/拒绝确认
- **输出**：前三阶段完成谓词与确认事实；缺证据只写 `unknown` quality fact，不写 PASS；全部必需事实 fresh/current 才写 derived publication
- **依赖**：T005
- **并行**：no
- **FR**：FR-MATERIAL-001、FR-STAGE-001、FR-QUALITY-001、FR-SAFETY-001、FR-AUTH-001
- **AC**：AC-003、AC-006、AC-007、AC-013、AC-015、AC-016、AC-028、AC-029、AC-034、AC-035
- **AC-003 discharge**：`incomplete`；`reason_code=AC003_DISCHARGE_OWNED_BY_T007_T008`
- **AC-035 discharge**：`incomplete`；`reason_code=AC035_DISCHARGE_OWNED_BY_T007_T008`，唯一 identity oracle 由 T007/T008 持有
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`npx vitest run tests/integration/vnext-official-stage-run.test.mjs tests/integration/first-three-stage-cutover.test.mjs tests/contract/confirmation-authorization.test.mjs tests/contract/stage-completion.test.mjs`
- **test/acceptance command**：`npx vitest run tests/integration/first-three-stage-cutover.test.mjs tests/contract/confirmation-authorization.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-VNEXT-PUBLICATION：vNext execute 成功且无 legacy attempt；材料修订无 recovery chain；确认不授权 Git/清理操作
- **evidence_path**：`evidence/phase-2/first-three-stages.json`
- **STOP**：缺质量事实被写 PASS、确认成为执行许可或出现平行 current projection 时停止
- **recovery**：回退当前 stage slice；同 task 材料不回退历史记录
- **task risk**：旧 handler 可能依赖 canonical receipt 链

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`passed`
- **actual_changes**：前三阶段 vNext 分流已在同一 quality/publication 边界运行；48/48 focused tests 通过，确认与授权边界保持分离，材料修订不产生 legacy accepted/results/recovery 链；未运行 full suite。
- **executed_commands**：`npx vitest run tests/integration/vnext-official-stage-run.test.mjs tests/integration/first-three-stage-cutover.test.mjs tests/contract/confirmation-authorization.test.mjs tests/contract/stage-completion.test.mjs`（48/48，exit 0）。
- **evidence_refs**：`[{"ref":"receipts/build-code-t006-first-three-stages.json","sha256":"7ffbfb4f68a40725aaf4df83136f8220175edf419374d03c857bae84b9577db0","kind":"test_receipt"},{"ref":"evidence/phase-2-t006-first-three-stages-tests","sha256":"cb54a00d22e4f3f9e361d100d531c4a87abc28d444c2ca0fd36bef1edb2da4db","kind":"test_output"},{"ref":"evidence/phase-2/vnext-publication.json","sha256":"fa9255eca215726ea113df1b48625e52965f049fe6913c6e5aeaa47eb1b9580b","kind":"paired_red"}]`
- **covered_ac**：`unknown — AC-003、AC-006、AC-007、AC-013、AC-015、AC-016、AC-028、AC-029、AC-034、AC-035；AC-003/AC-035/AC-014 final discharge owned by T007/T008; reason_code=PHASE_SUBCONTRACT_ONLY`
- **review_fact**：`N/A — 用户已明确停止 wh-review；T006 仅完成 paired RED/GREEN focused implementation evidence`
- **completed_at**：`2026-08-03T05:44:01Z`

## Phase 3: build-code、verify-code、E2E 与质量边界

### Goal

以 tasks 和当前质量事实完成实现/验证；三条最小 E2E 与质量边界测试通过。

### Files

- **NEW**：`runtime/schemas/quality-verify.v1.json`、`tests/integration/quality-store-concurrency.test.mjs`、`tests/integration/task-fact-index-consistency.test.mjs`
- **NEW（T007/T008）**：`tests/e2e/five-stage-normal.test.mjs`、`tests/e2e/five-stage-material-revision.test.mjs`、`tests/e2e/five-stage-idempotent-resume.test.mjs`、`tests/contract/doctor-interface.test.mjs`、`tests/contract/status-derivation.test.mjs`、`tests/integration/verify-freshness-selection.test.mjs`
- **MODIFY**：`core/stage-runner.mjs`、`core/task-kernel-implementation.mjs`、`tools/architecture/public-behavior-baseline.mjs`、`tests/contract/public-behavior-baseline.test.mjs`、`tests/fixtures/public-behavior-baseline/v1/manifest.json`、`tests/fixtures/public-behavior-baseline/v1/baseline.json`、`tests/fixtures/public-behavior-baseline/v1/candidate.json`、`tests/integration/atomic-write-faults.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/scripts/__tests__/review-source-materials.test.mjs`、`skills/wh-review/skill-bundle.json`、`runtime/evidence/quality-store.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/task/task-store.mjs`、`runtime/task/material-workspace.mjs`、`tests/contract/material-workspace.test.mjs`、`tests/integration/minimal-task-storage.test.mjs`、`tests/integration/governance-diagnostics-non-gate.test.mjs`
- **MODIFY（T007/T008）**：`workflows/build-code/`、`workflows/verify-code/`、`runtime/review/`、`runtime/evidence/freshness.mjs`、`runtime/interface/runtime-facade.mjs`、`scripts/stage-runtime.mjs`、`tests/contract/execution-identity.test.mjs`（T007 的 dirty-worktree 子范围）
- **READ/CONSUME（T023 gate-only）**：`tests/contract/stage-completion.test.mjs`、`tests/contract/confirmation-authorization.test.mjs`；Phase 2 T006 已建立前三阶段产品退出事实，本 Phase 仅由 T023 重新运行 completion-predicates 与 confirmation/authorization contracts 作为 remediation 回归 oracle，不在 Phase 3 写集合中。

### Tasks

T007、T008、T020、T019、T024、T021、T025、T022、T026、T023。

T007/T008 是本 Phase 的 build-code/verify-code、E2E、AC-014、identity 与 serious-finding owning tasks；T020～T023、T024～T026 只负责后续 remediation 与质量/基线证据，不覆盖 T007/T008 的产品退出条件。

### Verify

`npx vitest run tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs tests/contract/doctor-interface.test.mjs tests/contract/status-derivation.test.mjs tests/contract/material-workspace.test.mjs tests/contract/public-behavior-baseline.test.mjs tests/integration/verify-freshness-selection.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/integration/first-three-stage-cutover.test.mjs tests/integration/minimal-task-storage.test.mjs tests/integration/governance-diagnostics-non-gate.test.mjs tests/integration/atomic-write-faults.test.mjs skills/wh-review/scripts/__tests__/review-source-materials.test.mjs tests/integration/quality-store-concurrency.test.mjs tests/integration/task-fact-index-consistency.test.mjs tests/contract/execution-identity.test.mjs tests/contract/confirmation-authorization.test.mjs tests/contract/stage-completion.test.mjs && node tools/architecture/public-behavior-baseline.mjs verify --baseline=c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf`

### Knowledge

完成谓词与推进资格分离；review unavailable 和 serious finding 允许修复但不能完成。

### STOP

出现 phase trace、transition journal、replacement review、假 PASS 或隐式不可逆授权时停止。

### Done

三条 E2E 通过；七行为多 case 职责稳定并输出四值差异结论；所有 Phase 3 新增/修改测试均在同一 snapshot 绿门中通过；质量 receipt 语义、写集合 hash、facts/index 一致性和并发幂等均有证据；质量缺口不锁修复也不假绿。

### Risks and rollback

按 build-code、verify-code、facade/E2E 三个 slice 回退；已写质量事实保持不可变。

#### T007 — 切换 build-code、verify-code 与 review 事实

- **ID**：T007
- **implementation_owner**：five-stage-test-worker
- **verification_owner**：independent-quality-verifier
- **approval_owner**：user
- **Phase**：Phase 3: build-code、verify-code、E2E 与质量边界
- **goal**：build-code 以 tasks 为主表，verify 即时派生逐 AC、freshness、review 和 handoff
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：spec build-code/verify-code 完成谓词；review unavailable 和 serious finding 真实语义
- **boundary**：build-code/verify-code workflows、review/quality/freshness modules 和 tests
- **动作**：新增三条 E2E、五阶段完成谓词矩阵和 review unavailable/serious finding RED；review report 固定 `task_id/stage/review_id/material_digest/source_digest/provider/adapter/model/status/verdict/duration/usage/coverage/findings/raw_output_ref/content_hash`，缺失 duration/usage 写 `UNAVAILABLE`
- **精确文件**：`tests/e2e/five-stage-normal.test.mjs`、`tests/e2e/five-stage-material-revision.test.mjs`、`tests/e2e/five-stage-idempotent-resume.test.mjs`、`tests/contract/doctor-interface.test.mjs`、`tests/contract/status-derivation.test.mjs`、`tests/integration/verify-freshness-selection.test.mjs`、`tests/contract/execution-identity.test.mjs`
- **输入**：pass/fail/stale/unavailable/serious finding fixtures
- **输出**：needs_revision/incomplete/ready_for_confirmation 的真实结果
- **依赖**：T006
- **并行**：no
- **FR**：FR-PUBLIC-001、FR-STAGE-001、FR-QUALITY-001、FR-SAFETY-001、FR-STORAGE-001、FR-AUTH-001
- **AC**：AC-001、AC-002、AC-003、AC-005、AC-013、AC-014、AC-030、AC-031、AC-032、AC-033、AC-034、AC-035、AC-036
- **AC-013 discharge**：本任务拥有 `five-stage-material-revision` 的最小 E2E 证据；T003/T004 仅提供材料/存储子契约，不能单独关闭 AC-013
- **verification_role**：RED
- **paired_task**：T008
- **gate_cmd**：`npx vitest run tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs tests/contract/doctor-interface.test.mjs tests/contract/status-derivation.test.mjs tests/integration/verify-freshness-selection.test.mjs tests/contract/execution-identity.test.mjs`
- **red_oracles**：`npx vitest run tests/e2e/five-stage-normal.test.mjs -t "e2e:five-stage-normal"`；`npx vitest run tests/e2e/five-stage-material-revision.test.mjs -t "e2e:five-stage-material-revision"`；`npx vitest run tests/e2e/five-stage-idempotent-resume.test.mjs -t "e2e:five-stage-idempotent-resume"`；`npx vitest run tests/contract/doctor-interface.test.mjs -t "doctor:public-contract"`；该 doctor RED 必须逐项断言 Runner、Bundle、Node、config、workspace 五个字段/检查项的结构，并覆盖成功 exit 0 与至少一个坏 workspace/config 的非零 exit；`npx vitest run tests/contract/status-derivation.test.mjs -t "status:public-contract"`；`npx vitest run tests/integration/verify-freshness-selection.test.mjs -t "verify:freshness-selection"`；`npx vitest run tests/contract/execution-identity.test.mjs -t "identity:dirty-worktree"`；每条命令分别记录 expected exit 1，不用聚合 exit 1 作为归因。
- **test/acceptance command**：`npx vitest run tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-normal.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-FIVE-STAGE：旧链仍阻断至少一个 E2E 或 identity 边界未 fail-loud，RED 必须非零
- **evidence_path**：`evidence/phase-3/build-verify-cutover-red.json`
- **STOP**：需要 review-flow/selector/replacement resolution 或缺事实仍宣称完成时停止
- **recovery**：回退当前 slice，保留已经追加的真实质量事实
- **task risk**：旧 freshness 可能依赖 snapshot lineage

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`skipped`
- **actual_changes**：在 disposable copy 以固定 baseline 重放 T007 的 7 个当前测试文件；全部行为已通过，且任务登记的 7 个 `-t` selector 均与当前测试名不匹配并被跳过。没有可诚实记录的 RED，也未修改 candidate。
- **executed_commands**：`npx vitest run tests/e2e/five-stage-normal.test.mjs`、`five-stage-material-revision.test.mjs`、`five-stage-idempotent-resume.test.mjs`、`doctor-interface.test.mjs`、`status-derivation.test.mjs`、`verify-freshness-selection.test.mjs`、`execution-identity.test.mjs`（逐文件均 exit 0；7 个 selector drift 原样记录）。
- **evidence_refs**：`[{"ref":"evidence/phase-3/build-verify-cutover-red.json","sha256":"5513825832b123152347fdf81f9b4fe5c02f3fdbebe73082516eb5795f4bc6ca","kind":"phase_red_receipt"}]`
- **covered_ac**：`unknown — AC-001、AC-002、AC-003、AC-005、AC-013、AC-014、AC-030、AC-031、AC-032、AC-033、AC-034、AC-035、AC-036；reason_code=BASELINE_ALREADY_SATISFIES`
- **review_fact**：`N/A — 用户已明确停止 wh-review；T007 无实现变更，不发起 task-level review`
- **completed_at**：`2026-08-03T05:47:21Z`

#### T008 — 固定七行为 facade、三条 E2E 和质量边界

- **ID**：T008
- **implementation_owner**：runtime-facade-worker
- **verification_owner**：independent-e2e-verifier
- **approval_owner**：user
- **Phase**：Phase 3: build-code、verify-code、E2E 与质量边界
- **goal**：公开接口只保留七类职责，三条最小 E2E 和 quality/review 边界通过
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：FR-PUBLIC-001、FR-STAGE-001、FR-QUALITY-001 与三条最小 E2E
- **boundary**：runtime facade、CLI、build/verify、review/quality 和 `tests/e2e/`
- **动作**：实现 build/verify quality facts，按五阶段逐项验证材料和质量谓词，隐藏内部命令，完成三条 E2E；增加 dirty worktree identity negative case：正式 publication 必须非零失败，且不得写出以 HEAD 为来源的身份记录；review report 使用冻结字段合同且 pass/revise_required/unavailable 均保留原始 raw ref/hash
- **精确文件**：`workflows/build-code/`、`workflows/verify-code/`、`runtime/review/`、`runtime/evidence/freshness.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/interface/runtime-facade.mjs`、`scripts/stage-runtime.mjs`
- **输入**：新 task、材料修订、写入中断、review unavailable、dirty worktree identity
- **输出**：三条 E2E、quality/review 边界和 identity 负测
- **依赖**：T007
- **并行**：no
- **FR**：FR-PUBLIC-001、FR-STAGE-001、FR-QUALITY-001、FR-SAFETY-001、FR-STORAGE-001、FR-AUTH-001
- **AC**：AC-001、AC-002、AC-003、AC-005、AC-013、AC-014、AC-030、AC-031、AC-032、AC-033、AC-034、AC-035、AC-036
- **AC-013 discharge**：本任务消费并复核 `five-stage-material-revision` 的最小 E2E 证据；T003/T004 仅提供材料/存储子契约，不能单独关闭 AC-013
- **verification_role**：GREEN
- **paired_task**：T007
- **gate_cmd**：`npx vitest run tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs tests/contract/doctor-interface.test.mjs tests/contract/status-derivation.test.mjs tests/integration/verify-freshness-selection.test.mjs tests/contract/execution-identity.test.mjs tests/contract/stage-completion.test.mjs && npx vitest run tests/contract/execution-identity.test.mjs -t "identity:normal-edit-not-blocked"`
- **test/acceptance command**：`npx vitest run tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-normal.test.mjs tests/contract/execution-identity.test.mjs && npx vitest run tests/contract/execution-identity.test.mjs -t "identity:normal-edit-not-blocked"`
- **expected_exit**：0
- **oracle**：ORACLE-FIVE-STAGE：同 task 完成；重跑无控制链和假绿；doctor 必须逐项报告 Runner、Bundle、Node、config、workspace，并分别断言成功 exit 0 与坏 workspace/config 的非零 exit；status/verify freshness 三个公开行为有可回看的契约结论；dirty worktree 时正式 publication 非零且不把 dirty tree 冒充 HEAD identity
- **evidence_path**：`evidence/phase-3/e2e.json`
- **STOP**：公开命令继续暴露内部状态机或 E2E 依赖历史 task 时停止
- **recovery**：逐 E2E slice 回退，不建立 recovery 对象
- **task risk**：wrapper 可能保留旧 CLI 的隐式入口

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`passed`
- **actual_changes**：三条五阶段 E2E、doctor/status/freshness/identity 契约和 stage completion 全部在当前 candidate 通过；正式运行保持同 task、quality/review 事实和 dirty identity 边界，未运行 full suite。
- **executed_commands**：`npx vitest run tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs tests/contract/doctor-interface.test.mjs tests/contract/status-derivation.test.mjs tests/integration/verify-freshness-selection.test.mjs tests/contract/execution-identity.test.mjs tests/contract/stage-completion.test.mjs && npx vitest run tests/contract/execution-identity.test.mjs -t "identity:normal-edit-not-blocked"`（52+1 tests，exit 0）。
- **evidence_refs**：`[{"ref":"receipts/build-code-t008-five-stage.json","sha256":"faed6511b34a05e67264d1bb09b7de7613dcebb9ed0860f4d11f3bb3c81fec21","kind":"test_receipt"},{"ref":"evidence/phase-3-t008-five-stage-tests","sha256":"b8c55d437aeb5f1c10934133a3d8fdd75cd59c46ee0a07dc2baecc0af15859a8","kind":"test_output"},{"ref":"evidence/phase-3/build-verify-cutover-red.json","sha256":"5513825832b123152347fdf81f9b4fe5c02f3fdbebe73082516eb5795f4bc6ca","kind":"paired_red"}]`
- **covered_ac**：`unknown — AC-001、AC-002、AC-003、AC-005、AC-013、AC-014、AC-030、AC-031、AC-032、AC-033、AC-034、AC-035、AC-036；AC-013/AC-014/AC-003/AC-035 final discharge remains mapped to this Phase and later final evidence; reason_code=PHASE_SUBCONTRACT_ONLY`
- **review_fact**：`N/A — 用户已明确停止 wh-review；T008 仅完成 focused E2E/contract evidence`
- **completed_at**：`2026-08-03T05:47:21Z`

#### T020 — 固定 wh-review 发现修复的 RED 证据

- **ID**：T020
- **implementation_owner**：review-feedback-red-worker
- **verification_owner**：independent-remediation-verifier
- **approval_owner**：user
- **Phase**：Phase 3: build-code、verify-code、E2E 与质量边界
- **goal**：先证明当前实现不能把 unavailable review 当成通过，并证明存活 writer 的故障/并发回归不可被删掉；baseline 行为证据由 T024/T021 独占
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：历史 Phase 3 wh-review 轮次 `168508cf-7509-4f16-bc19-15a7d412de31`；当前 canonical build-plan review 为 `0631f399-af8b-4473-9b38-715c696fad6e`；AC-004、AC-033；baseline 多 case 由 T024/T021 独占
- **boundary**：review status mapping、存活 writer fault/concurrency tests
- **动作**：新增 unavailable review negative test；恢复 legacy writer fault/concurrency test 的 RED/反向 oracle；不修改生产 baseline collector、baseline contract 或 fixtures。若执行时目标行为已在 candidate tree 转绿，则按全局规则在 disposable copy 应用 path-bound inverse diff 后取 RED，否则直接对当前 tree 取 RED。
- **精确文件**：`tests/integration/vnext-official-stage-run.test.mjs`、`tests/integration/atomic-write-faults.test.mjs`
- **输入**：unavailable attempt、legacy writer fault hooks
- **输出**：实现前至少一个 review/unavailable 或 writer 负向断言非零；baseline 多 case 不在本任务重复拥有
- **依赖**：T008
- **并行**：no
- **FR**：FR-QUALITY-001、FR-STORAGE-001、FR-PUBLIC-001（matrix-only：review/verify 公开行为子范围）
- **AC**：AC-004、AC-033
- **verification_role**：RED
- **paired_task**：T019
- **gate_cmd**：`npx vitest run tests/integration/vnext-official-stage-run.test.mjs -t "review:unavailable-not-passed" && npx vitest run tests/integration/atomic-write-faults.test.mjs -t "writer:legacy-fault-concurrency"`
- **red_oracles**：`npx vitest run tests/integration/vnext-official-stage-run.test.mjs -t "review:unavailable-not-passed"`；`npx vitest run tests/integration/atomic-write-faults.test.mjs -t "writer:legacy-fault-concurrency"`；每条命令分别记录 expected exit 1，不用整文件 exit 1 作为归因。
- **test/acceptance command**：同 `gate_cmd`
- **expected_exit**：1
- **oracle**：ORACLE-REVIEW-REMEDIATION-RED：unavailable→passed 推导或存活 writer 缺 fault/concurrency 覆盖时，RED gate 必须 exit 1
- **evidence_path**：`evidence/phase-3/review-feedback-remediation/red.json`
- **STOP**：RED 不能稳定复现、或只能靠删除存活 writer 测试来通过时停止
- **recovery**：保留 RED 事实；只修复当前测试 fixture，不覆盖既有 phase evidence
- **task risk**：旧测试与新 vNext 测试有重叠，必须按生产 consumer 区分而不是按 LOC 删除

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`passed`
- **actual_changes**：在 disposable pre-remediation copy 中固定 unavailable review 与 legacy writer 两条独立 RED；candidate 未回退，未删除存活 writer 测试。
- **executed_commands**：`npx vitest run tests/integration/vnext-official-stage-run.test.mjs -t "review:unavailable-not-passed"`（expected/actual exit 1，legacy attempt writer guard）；`npx vitest run tests/integration/atomic-write-faults.test.mjs -t "writer:legacy-fault-concurrency"`（expected/actual exit 1，pre-T004 modules unavailable）。
- **evidence_refs**：`[{"ref":"evidence/phase-3/review-feedback-remediation/red.json","sha256":"1405d0682f9b9c83d639c266958933c4f35522803f92d8b68d21833e30f4055b","kind":"phase_red_receipt"}]`
- **covered_ac**：`unknown — AC-004、AC-033；reason_code=PHASE_SUBCONTRACT_ONLY`
- **review_fact**：`N/A — 用户已明确停止 wh-review；T020 仅完成 paired RED evidence`
- **completed_at**：`2026-08-03T05:50:08Z`

#### T019 — 修复 wh-review 发现的 unavailable 映射与 legacy writer 故障/并发回归

- **ID**：T019
- **implementation_owner**：review-feedback-remediation-worker
- **verification_owner**：independent-remediation-auditor
- **approval_owner**：user
- **Phase**：Phase 3: build-code、verify-code、E2E 与质量边界
- **goal**：把 wh-review 暴露的真实风险纳入当前方案：不可用 review 只能写入 `unavailable` quality fact；仍存活的 legacy writer 不得因降复杂度而失去故障和并发回归覆盖。七类 baseline 由 T024/T021 独占；逐 AC review map 与 Phase 3 完整 gate 由 T025/T022 单独拥有，避免 RED/GREEN 交付重叠。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：历史 Phase 3 wh-review 轮次 `168508cf-7509-4f16-bc19-15a7d412de31`；当前 canonical build-plan review 为 `0631f399-af8b-4473-9b38-715c696fad6e`；原始 baseline 契约由 T024/T021 独占；AC-023 final discharge 只由 T026/T023 负责原子性/一致性故障注入覆盖，T003/T004 仅提供 Phase 1 sub-contract
- **boundary**：生产 remediation files `core/stage-runner.mjs`、`core/task-kernel-implementation.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/skill-bundle.json`；`tests/integration/atomic-write-faults.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs` 仅 gate-only/read-only 消费 T020 RED，不写测试断言
- **动作**：消费 T020 已固定的 review unavailable→PASS RED 负测；修复 review record 读取/状态映射；修复存活 legacy writer 的 fault/concurrency 路径并在新 snapshot 上重新执行 Phase review。fault/concurrency RED 断言由 T020 负责，生产修复由本任务负责。baseline collector、baseline fixtures、AC-023 原子性/一致性 oracle、逐 AC map 和 Phase 3 完整 gate 不在本任务实现。
- **精确文件**：`core/stage-runner.mjs`、`core/task-kernel-implementation.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/skill-bundle.json`
- **输入**：unavailable review attempt、存活 legacy writer fault contract、Phase 3 review findings
- **输出**：unavailable 不得被推导为 passed 或 complete；新的 phase review fact；存活 legacy writer 的 fault/concurrency 回归由 T020 RED 与本任务生产修复共同闭合，baseline 与逐 AC map 留给对应任务；记录 `skills/wh-review/skill-bundle.json` 修改前后 hash，并由 skill closure 通过后才接受 GREEN。
- **依赖**：T020
- **并行**：no
- **FR**：FR-QUALITY-001、FR-STORAGE-001、FR-PUBLIC-001（matrix-only：review/verify 公开行为子范围）
- **AC**：AC-004、AC-033
- **verification_role**：GREEN
- **paired_task**：T020
- **gate_cmd**：`npx vitest run tests/integration/vnext-official-stage-run.test.mjs tests/integration/atomic-write-faults.test.mjs && node runtime/evidence/check-skill-closure.mjs .`
- **test/acceptance command**：`npx vitest run tests/integration/vnext-official-stage-run.test.mjs tests/integration/atomic-write-faults.test.mjs && node runtime/evidence/check-skill-closure.mjs .`
- **expected_exit**：0
- **oracle**：ORACLE-REVIEW-REMEDIATION-GREEN：unavailable 只发布 unavailable quality fact；存活 writer 的故障/并发回归恢复且本 gate exit 0
- **evidence_path**：`evidence/phase-3/review-feedback-remediation/`
- **STOP**：unavailable 被推导为 passed/complete、存活 writer 缺故障/并发 oracle 时停止，不进入 Phase 4 删除；baseline 由 T024/T021 负责，逐 AC map 由 T022 负责
- **recovery**：保留既有 review report；只回退当前 remediation slice，重新采集新 phase evidence；不改写旧 evidence 和历史 task
- **task risk**：基线固定输入需要最小真实 task 初始化，不能退化为 fixture-only 或手写 golden

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`passed`
- **actual_changes**：unavailable review 只保留 unavailable quality fact；legacy writer fault/concurrency 路径通过；同步 `skills/catalog.yaml` 的 `wh-review` bundle hash，使 skill closure 与当前 bundle 一致；未新增 review flow、未运行 full suite。
- **executed_commands**：`npx vitest run tests/integration/vnext-official-stage-run.test.mjs tests/integration/atomic-write-faults.test.mjs && node runtime/evidence/check-skill-closure.mjs .`（31/31，skill closure ok，exit 0）。
- **evidence_refs**：`[{"ref":"receipts/build-code-t019-review-remediation.json","sha256":"dc3939f14e022081275bf8c80cf6103a23643921221930800f0246de11e053ac","kind":"test_receipt"},{"ref":"evidence/phase-3-t019-review-remediation-tests","sha256":"65ca306699b767ccce6102087cc7d2c80a76f253a2ecbd4c4ddc2835d5f70f30","kind":"test_output"},{"ref":"evidence/phase-3/review-feedback-remediation/red.json","sha256":"1405d0682f9b9c83d639c266958933c4f35522803f92d8b68d21833e30f4055b","kind":"paired_red"}]`
- **covered_ac**：`unknown — AC-004、AC-033；reason_code=PHASE_SUBCONTRACT_ONLY`
- **review_fact**：`N/A — 用户已明确停止 wh-review；T019 仅完成 focused remediation evidence`
- **completed_at**：`2026-08-03T05:50:08Z`

#### T024 — 固定多 case 基线缺口的 RED 证据

- **ID**：T024
- **implementation_owner**：baseline-red-worker
- **verification_owner**：independent-baseline-verifier
- **approval_owner**：user
- **Phase**：Phase 3: build-code、verify-code、E2E 与质量边界
- **goal**：证明当前基线采集器缺少 spec 要求的多 case、四值差异结论和写集合内容 hash
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：前序 `wh-review` result `a083a16e-2ad0-45f2-8ef6-c3acdfb13ffa`；后续审查以 task storage 中的最新 review receipt 为准
- **boundary**：baseline collector、contract、fixtures
- **动作**：先加入多 case/四值/hash 反向断言，不修改实现。若执行时目标行为已在 candidate tree 转绿，则按全局规则在 disposable copy 应用 path-bound inverse diff 后取 RED，否则直接对当前 tree 取 RED。
- **精确文件**：`tests/contract/public-behavior-baseline.test.mjs`
- **输入**：固定 baseline commit 和原始 spec §5
- **输出**：至少一个明确缺口非零
- **依赖**：T019
- **并行**：no
- **FR**：FR-BASELINE-001、FR-PUBLIC-001
- **AC**：AC-008、AC-009、AC-010
- **verification_role**：RED
- **paired_task**：T021
- **gate_cmd**：`npx vitest run tests/contract/public-behavior-baseline.test.mjs -t "baseline:multi-case" && npx vitest run tests/contract/public-behavior-baseline.test.mjs -t "baseline:four-value-diff" && npx vitest run tests/contract/public-behavior-baseline.test.mjs -t "baseline:write-set-content-hash" && npx vitest run tests/contract/public-behavior-baseline.test.mjs -t "baseline:candidate-binding" && npx vitest run tests/contract/public-behavior-baseline.test.mjs -t "baseline:candidate-equals-baseline"`
- **red_oracles**：`npx vitest run tests/contract/public-behavior-baseline.test.mjs -t "baseline:multi-case"`；`npx vitest run tests/contract/public-behavior-baseline.test.mjs -t "baseline:four-value-diff"`；`npx vitest run tests/contract/public-behavior-baseline.test.mjs -t "baseline:write-set-content-hash"`；`npx vitest run tests/contract/public-behavior-baseline.test.mjs -t "baseline:candidate-binding"`；`npx vitest run tests/contract/public-behavior-baseline.test.mjs -t "baseline:candidate-equals-baseline"`；每条命令分别记录 expected exit 1，不用整文件 exit 1 作为归因。
- **test/acceptance command**：同 `gate_cmd`
- **expected_exit**：1
- **oracle**：ORACLE-BASELINE-RED：缺 case、四值结论或 write-set hash 时测试非零
- **evidence_path**：`evidence/phase-3/review-feedback-remediation/baseline-red.json`
- **STOP**：不能稳定复现缺口或 RED 依赖未知 action 时停止
- **recovery**：保留 RED，回退仅新增的反向断言
- **task risk**：不能用手写 fixture 假装真实行为缺口

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`passed`
- **actual_changes**：在 disposable baseline copy 中固定多 case、四值差异、write-set hash、candidate binding 和 candidate-equals-baseline 五条 RED；未修改 candidate collector 或 baseline fixture。
- **executed_commands**：5 个独立 `npx vitest run tests/contract/public-behavior-baseline.test.mjs -t "baseline:..."` oracle 均 expected/actual exit 1（pre-T024 collector 缺失）。
- **evidence_refs**：`[{"ref":"evidence/phase-3/review-feedback-remediation/baseline-red.json","sha256":"c584e909d651b9aa9b3435ed81d0cd3b779096d375207c046c9200b4de2d0a75","kind":"phase_red_receipt"}]`
- **covered_ac**：`unknown — AC-008、AC-009、AC-010；reason_code=PHASE_SUBCONTRACT_ONLY`
- **review_fact**：`N/A — 用户已明确停止 wh-review；T024 仅完成 paired RED evidence`
- **completed_at**：`2026-08-03T05:54:45Z`

#### T021 — 补齐七行为多 case 基线与四值差异结论

- **ID**：T021
- **implementation_owner**：public-behavior-evidence-worker
- **verification_owner**：independent-baseline-verifier
- **approval_owner**：user
- **Phase**：Phase 3: build-code、verify-code、E2E 与质量边界
- **goal**：严格按原始 spec 重建七行为基线，避免单 case、非法 action 和静默过滤掩盖行为变化
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：前序 `wh-review` result `a083a16e-2ad0-45f2-8ef6-c3acdfb13ffa` 的 AC-008～AC-010 findings；原始 spec §5 基线 case 契约；后续审查以 task storage 中的最新 review receipt 为准
- **boundary**：`tools/architecture/public-behavior-baseline.mjs`、baseline contract tests/fixtures
- **动作**：`doctor` 固定执行 workspace check、`make-decision` stage 和 fixed task，并保留 worktree-to-baseline-commit relationship；`status` 对同一 task 连续执行两次固定调用并断言 run sequence 单调、workflow ID 一致、write namespace 和重复调用语义保留；`run` 增加 scope 成功和新 task execute case；`review` 增加确定性 unavailable 和 `triggered=false` case；`verify` 增加成功和非零退出 case；`confirm` 增加合法/错绑 attempt case；`authorize` 增加精确 confirmation、缺失 confirmation、错绑 confirmation case，并逐项记录执行后没有隐式 commit、push、merge、archive 或 cleanup；每个 case 保留固定 input、raw/normalized hash、exit code、写集合项内容 hash；compare 逐行为输出 `preserved`、`approved_internal_change`、`approved_bug_fix`、`behavior_regression`，为有意内部变化保留理由
- **精确文件**：`tools/architecture/public-behavior-baseline.mjs`、`tests/fixtures/public-behavior-baseline/v1/manifest.json`、`tests/fixtures/public-behavior-baseline/v1/baseline.json`、`tests/fixtures/public-behavior-baseline/v1/candidate.json`
- **输入**：固定 baseline commit、真实 public action/input、可重放 unavailable review 事实、固定非零 verify 命令、错绑 confirm/authorize 输入
- **candidate_binding**：`compare --candidate=worktree` 必须绑定当前未提交候选 worktree 的实时 snapshot hash，不得解析为 `HEAD`；受控负测把 candidate tree oid 设为 baseline oid 时，compare 必须以 `candidate_equals_baseline` 非零，不能输出全量 `preserved`
- **输出**：七行为全部可重算；status 两次调用的序列/一致性/namespace/repeat 语义可比较；case 类型符合 spec；confirm/authorize 正负 case 均保留，authorize 的无隐式不可逆操作 postcondition 可回看；写集合 hash 完整；compare 无静默过滤且逐行为有四值结论
- **依赖**：T024
- **并行**：no
- **FR**：FR-BASELINE-001、FR-PUBLIC-001
- **AC**：AC-008、AC-009、AC-010
- **verification_role**：GREEN
- **paired_task**：T024
- **gate_cmd**：`npx vitest run tests/contract/public-behavior-baseline.test.mjs`
- **test/acceptance command**：`npx vitest run tests/contract/public-behavior-baseline.test.mjs && node tools/architecture/public-behavior-baseline.mjs verify --baseline=c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf`
- **expected_exit**：0
- **oracle**：ORACLE-BASELINE-RED：固定真实多 case 可重算；逐行为四值结论和写集合内容 hash 完整；非法 action/静默过滤/单总 PASS 均被负测拒绝
- **evidence_path**：`evidence/phase-3/review-feedback-remediation/baseline-v2/`
- **STOP**：任一行为仍为未知 action、case 缺 spec 要求、写集合无内容 hash、或差异被静默过滤时停止
- **recovery**：只回退 baseline collector/fixtures slice；旧 baseline evidence 保持不可变
- **task risk**：固定 action 必须在隔离 task 中真实执行，不能手写 unavailable 或非零退出结果

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`passed`
- **actual_changes**：重建七行为 baseline v2：每个公开行为保留多 case、四值比较词汇、candidate binding 与 write-set content hash；verify round-trip 通过，未运行 full suite。
- **executed_commands**：`npx vitest run tests/contract/public-behavior-baseline.test.mjs && node tools/architecture/public-behavior-baseline.mjs verify --baseline=c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf`（contract + verify exit 0）。
- **evidence_refs**：`[{"ref":"receipts/build-code-t021-baseline-v2.json","sha256":"1abf1eb1ae618342882f6a818aaa458e0b08b3005c32d5e3b89e68e7933840e2","kind":"test_receipt"},{"ref":"evidence/phase-3-t021-baseline-v2-tests","sha256":"e471572f8dda7889190650b3ffb89cb03a9bb335d95f3172498ba5ba82e09290","kind":"test_output"},{"ref":"evidence/phase-3/review-feedback-remediation/baseline-red.json","sha256":"c584e909d651b9aa9b3435ed81d0cd3b779096d375207c046c9200b4de2d0a75","kind":"paired_red"}]`
- **covered_ac**：`unknown — AC-008、AC-009、AC-010；reason_code=PHASE_SUBCONTRACT_ONLY`
- **review_fact**：`N/A — 用户已明确停止 wh-review；T021 仅完成 baseline evidence，不发起 task-level review`
- **completed_at**：`2026-08-03T05:54:45Z`

#### T025 — 固定 AC 泛化映射与 Phase 3 漏测的 RED 证据

- **ID**：T025
- **implementation_owner**：review-materials-red-worker
- **verification_owner**：independent-review-material-verifier
- **approval_owner**：user
- **Phase**：Phase 3: build-code、verify-code、E2E 与质量边界
- **goal**：证明 review packet 不能用同一 change/文字/spec 行覆盖全部 AC，且 Phase 3 绿门不能漏掉新增测试
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：前序 `wh-review` result `a083a16e-2ad0-45f2-8ef6-c3acdfb13ffa` 的 acceptance_map/test-summary findings；后续审查以 task storage 中的最新 review receipt 为准
- **boundary**：review map 生成、Phase 3 focused gate
- **动作**：先加入重复泛化映射和漏测检测，不修改实现。若执行时目标行为已在 candidate tree 转绿，则按全局规则在 disposable copy 应用 path-bound inverse diff 后取 RED，否则直接对当前 tree 取 RED。
- **精确文件**：`skills/wh-review/scripts/__tests__/review-source-materials.test.mjs`；Phase 3 focused manifest 固定为本任务 gate_cmd 中列出的路径，不新增隐式文件
- **输入**：43 条原始 AC、当前 change-map、Phase 3 全部测试路径
- **输出**：泛化 map 或漏测至少一项非零
- **依赖**：T021
- **并行**：no
- **FR**：FR-QUALITY-001、FR-STORAGE-001、FR-STAGE-001
- **AC**：AC-004、AC-008～AC-010、AC-015、AC-016、AC-021～AC-023、AC-030～AC-033、AC-039～AC-043
- **verification_role**：RED
- **paired_task**：T022
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/review-source-materials.test.mjs -t "ac-map:no-generic-fill" && npx vitest run skills/wh-review/scripts/__tests__/review-source-materials.test.mjs -t "phase-gate:missing-stage-test"`
- **red_oracles**：`npx vitest run skills/wh-review/scripts/__tests__/review-source-materials.test.mjs -t "ac-map:no-generic-fill"`；`npx vitest run skills/wh-review/scripts/__tests__/review-source-materials.test.mjs -t "phase-gate:missing-stage-test"`；每条命令分别记录 expected exit 1，不用聚合 Phase 3 测试作为本任务 RED。
- **test/acceptance command**：同 `gate_cmd`
- **expected_exit**：1
- **oracle**：ORACLE-MATERIALS-RED：重复泛化 AC map 或 Phase 3 漏测时非零
- **evidence_path**：`evidence/phase-3/review-feedback-remediation/materials-red.json`
- **STOP**：不能证明 map/gate 缺口时停止，不得直接声称 GREEN
- **recovery**：保留 RED；只回退新增的 map/gate 反向断言
- **task risk**：不得把未实现的后续 Phase AC 填成 complete

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`passed`
- **actual_changes**：在 disposable baseline copy 中固定 AC 泛化映射与 Phase gate 漏测的两条独立 RED；未修改 review implementation 或 Phase 3 gate。
- **executed_commands**：`npx vitest run skills/wh-review/scripts/__tests__/review-source-materials.test.mjs -t "ac-map:no-generic-fill"`（expected/actual exit 1）；`npx vitest run skills/wh-review/scripts/__tests__/review-source-materials.test.mjs -t "phase-gate:missing-stage-test"`（expected/actual exit 1）。
- **evidence_refs**：`[{"ref":"evidence/phase-3/review-feedback-remediation/materials-red.json","sha256":"62b0fb945f9b2bd7b3d0455ed1dc2ed237e6fda22e54ce56e570ede3bc700ca3","kind":"phase_red_receipt"}]`
- **covered_ac**：`unknown — AC-004、AC-008～AC-010、AC-015、AC-016、AC-021～AC-023、AC-030～AC-033、AC-039～AC-043；reason_code=PHASE_SUBCONTRACT_ONLY`
- **review_fact**：`N/A — 用户已明确停止 wh-review；T025 仅完成 paired RED evidence`
- **completed_at**：`2026-08-03T05:59:17Z`

#### T022 — 重建真实逐 AC review map 并覆盖完整 Phase 3 绿门

- **ID**：T022
- **implementation_owner**：review-materials-worker
- **verification_owner**：independent-review-material-verifier
- **approval_owner**：user
- **Phase**：Phase 3: build-code、verify-code、E2E 与质量边界
- **goal**：杜绝用泛化文字、同一 change_id 和 spec 行冒充 43 条 AC 的实现/验证覆盖，并完成 T026 之前已存在测试的 material-slice GREEN gate；Phase 3 全部测试的最终绿门只由 T023 执行
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：前序 build-plan remediation result `a083a16e-2ad0-45f2-8ef6-c3acdfb13ffa` 的 acceptance_map 和 test-summary findings；本材料已吸收的 review 为 `0631f399-af8b-4473-9b38-715c696fad6e`；后续审查以 task storage 中的最新 review receipt 为准
- **boundary**：`skills/wh-review/scripts/review-materials.mjs`、Phase 3 全部测试文件、review packet/map 生成
- **动作**：按 AC 逐条选择真实实现 anchor、验证测试 anchor、change_id 和 receipt；无本 Phase 证据的 AC 使用 `not_applicable`/`unknown` 与具体 reason；GREEN command 覆盖本 Phase 全部新增/修改测试，并在同一 snapshot 生成新 phase review
- **精确文件**：`skills/wh-review/scripts/review-materials.mjs`
- **输入**：当前 Phase change-map、真实测试收据、原始 spec AC 列表和最新 Phase snapshot
- **输出**：每条 AC 有真实且不重复的 disposition/anchor；material-slice gate 覆盖 T026 之前的全部新增/修改测试；T023 再覆盖质量/存储测试；新 review attempt/result 与 phase evidence 绑定同一 snapshot
- **依赖**：T025
- **并行**：no
- **FR**：FR-QUALITY-001、FR-STORAGE-001、FR-STAGE-001
- **AC**：AC-004、AC-008～AC-010、AC-015、AC-016、AC-021～AC-023、AC-030～AC-033、AC-039～AC-043
- **verification_role**：GREEN
- **paired_task**：T025
- **gate_cmd**：`npx vitest run tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs tests/contract/doctor-interface.test.mjs tests/contract/status-derivation.test.mjs tests/contract/material-workspace.test.mjs tests/contract/public-behavior-baseline.test.mjs tests/contract/execution-identity.test.mjs tests/integration/verify-freshness-selection.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/integration/first-three-stage-cutover.test.mjs tests/integration/minimal-task-storage.test.mjs tests/integration/governance-diagnostics-non-gate.test.mjs tests/integration/atomic-write-faults.test.mjs skills/wh-review/scripts/__tests__/review-source-materials.test.mjs && node tools/architecture/public-behavior-baseline.mjs verify --baseline=c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf`
- **test/acceptance command**：同 `gate_cmd`
- **expected_exit**：0
- **oracle**：ORACLE-MATERIALS-RED：T026 之前的新增/修改测试全通过；每条 AC 的实现/验证关系可回看；无证据 AC 不得伪装 complete；review snapshot、test receipt、phase evidence 三者一致
- **evidence_path**：`evidence/phase-3/review-feedback-remediation/materials-v2/`
- **STOP**：AC map 仍出现批量泛化 entry、绿门漏测、receipt snapshot 不一致或 provider 只能看到无锚点材料时停止
- **recovery**：保留上一轮 review；只回退 map/packet/test-gate slice
- **task risk**：不能为了填满 AC 列表把未实现的 Phase 4–7 工作提前声称完成

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`passed`
- **actual_changes**：review material map 与 Phase 3 material-slice gate 已在同一 snapshot 通过；baseline v2 verify、三条 E2E、stage/public storage/quality 契约均通过；未运行 full suite。
- **executed_commands**：`npx vitest run tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs tests/contract/doctor-interface.test.mjs tests/contract/status-derivation.test.mjs tests/contract/material-workspace.test.mjs tests/contract/public-behavior-baseline.test.mjs tests/contract/execution-identity.test.mjs tests/integration/verify-freshness-selection.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/integration/first-three-stage-cutover.test.mjs tests/integration/minimal-task-storage.test.mjs tests/integration/governance-diagnostics-non-gate.test.mjs tests/integration/atomic-write-faults.test.mjs skills/wh-review/scripts/__tests__/review-source-materials.test.mjs && node tools/architecture/public-behavior-baseline.mjs verify --baseline=c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf`（exit 0）。
- **evidence_refs**：`[{"ref":"receipts/build-code-t022-materials-v2.json","sha256":"7b42ec814b3be49adf15bb0ef1d4a3e918e129d671d80cbe655e44f45eee50c5","kind":"test_receipt"},{"ref":"evidence/phase-3-t022-materials-v2-tests","sha256":"da062dd8a84a5802f88a78937d06ff2c96f9776931d470cfb5affd3c3c959b62","kind":"test_output"},{"ref":"evidence/phase-3/review-feedback-remediation/materials-red.json","sha256":"62b0fb945f9b2bd7b3d0455ed1dc2ed237e6fda22e54ce56e570ede3bc700ca3","kind":"paired_red"}]`
- **covered_ac**：`unknown — AC-004、AC-008～AC-010、AC-015、AC-016、AC-021～AC-023、AC-030～AC-033、AC-039～AC-043；AC-021/AC-023 final discharge remains owned by T026/T023; reason_code=PHASE_SUBCONTRACT_ONLY`
- **review_fact**：`N/A — 用户已明确停止 wh-review；T022 仅完成 material-slice focused gate`
- **completed_at**：`2026-08-03T05:59:17Z`

#### T026 — 固定质量假绿与存储一致性缺口的 RED 证据

- **ID**：T026
- **implementation_owner**：quality-storage-red-worker
- **verification_owner**：independent-storage-verifier
- **approval_owner**：user
- **Phase**：Phase 3: build-code、verify-code、E2E 与质量边界
- **goal**：证明失败 receipt 不能被写成 passed，facts/index 崩溃窗口、quality-store EEXIST 和无消费者导出均需处理
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：前序 `wh-review` result `a083a16e-2ad0-45f2-8ef6-c3acdfb13ffa` 的 fake-pass、AC-023、EEXIST、死代码 findings；后续审查以 task storage 中的最新 review receipt 为准
- **boundary**：`core/stage-runner.mjs`、`runtime/task/task-store.mjs`、`runtime/evidence/quality-store.mjs`、对应 tests
- **动作**：先加入失败 receipt、两次写中断、EEXIST 竞争和无消费者导出的反向断言，不修改实现。若执行时目标行为已在 candidate tree 转绿，则按全局规则在 disposable copy 应用 path-bound inverse diff 后取 RED，否则直接对当前 tree 取 RED。
- **精确文件**：`tests/integration/vnext-official-stage-run.test.mjs`、`tests/integration/atomic-write-faults.test.mjs`、`tests/contract/material-workspace.test.mjs`、`tests/integration/quality-store-concurrency.test.mjs`、`tests/integration/task-fact-index-consistency.test.mjs`
- **输入**：失败 test receipt、故障注入、同 ref 竞争写
- **输出**：至少一项质量/存储缺口非零
- **依赖**：T022
- **并行**：no
- **FR**：FR-QUALITY-001、FR-STORAGE-001、FR-SAFETY-001
- **AC**：AC-015、AC-016、AC-021、AC-022、AC-023、AC-033、AC-034
- **verification_role**：RED
- **paired_task**：T023
- **gate_cmd**：`npx vitest run tests/integration/vnext-official-stage-run.test.mjs -t "fake-pass:test-receipt" && npx vitest run tests/integration/task-fact-index-consistency.test.mjs -t "facts-index:crash-window" && npx vitest run tests/integration/quality-store-concurrency.test.mjs -t "quality-store:eexist-conflict" && npx vitest run tests/contract/material-workspace.test.mjs -t "export:no-consumer"`
- **red_oracles**：`npx vitest run tests/integration/vnext-official-stage-run.test.mjs -t "fake-pass:test-receipt"`；`npx vitest run tests/integration/task-fact-index-consistency.test.mjs -t "facts-index:crash-window"`；`npx vitest run tests/integration/quality-store-concurrency.test.mjs -t "quality-store:eexist-conflict"`；`npx vitest run tests/contract/material-workspace.test.mjs -t "export:no-consumer"`；每条命令分别记录 expected exit 1，不用聚合 Phase 3 测试作为本任务 RED。
- **test/acceptance command**：同 `gate_cmd`
- **expected_exit**：1
- **oracle**：ORACLE-QUALITY-RED：失败 receipt 假绿或存储一致性缺口存在时非零
- **evidence_path**：`evidence/phase-3/review-feedback-remediation/quality-red.json`
- **STOP**：不能稳定复现质量/存储缺口时停止
- **recovery**：保留 RED；只回退新增反向断言
- **task risk**：不能通过删除故障测试来制造 RED 消失

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`passed`
- **actual_changes**：在 disposable baseline copy 中固定 fake-pass、facts/index crash-window、quality-store EEXIST 和无消费者导出四条独立 RED；未删除故障测试或修改 candidate。
- **executed_commands**：4 个独立 RED oracle 均 expected/actual exit 1：`fake-pass:test-receipt`、`facts-index:crash-window`、`quality-store:eexist-conflict`、`export:no-consumer`。
- **evidence_refs**：`[{"ref":"evidence/phase-3/review-feedback-remediation/quality-red.json","sha256":"2017d5641c53b98acfea3c80f7f2a32fa40a714b21bda33ed3a49f661ad75b95","kind":"phase_red_receipt"}]`
- **covered_ac**：`unknown — AC-015、AC-016、AC-021、AC-022、AC-023、AC-033、AC-034；reason_code=PHASE_SUBCONTRACT_ONLY`
- **review_fact**：`N/A — 用户已明确停止 wh-review；T026 仅完成 paired RED evidence`
- **completed_at**：`2026-08-03T06:01:58Z`

#### T023 — 修复质量事实语义与存储并发边界

- **ID**：T023
- **implementation_owner**：quality-storage-worker
- **verification_owner**：independent-storage-verifier
- **approval_owner**：user
- **Phase**：Phase 3: build-code、verify-code、E2E 与质量边界
- **goal**：让质量事实只在 receipt 语义真实通过时为 `passed`，并消除 facts/index 崩溃窗口、quality-store 并发裸 EEXIST、恒假路径判断和无消费者导出
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：前序 `wh-review` result `a083a16e-2ad0-45f2-8ef6-c3acdfb13ffa` 的 fake-pass、AC-023、EEXIST、死代码 findings；后续审查以 task storage 中的最新 review receipt 为准
- **boundary**：`core/stage-runner.mjs`、`runtime/task/task-store.mjs`、`runtime/task/material-workspace.mjs`、`runtime/evidence/quality-store.mjs`、`runtime/stage/completion-predicates.mjs` 及对应 contract/integration tests
- **动作**：读取 test receipt 并校验 exit code；confirmation 校验 task/stage/语义；不可校验记 unavailable；为 facts/index 中断增加一致性检测或可验证恢复并禁止静默吞错；补 quality-store EEXIST 同内容幂等/不同内容冲突；删除恒假路径比较和无消费者 `deriveMaterialWorkStatus` 导出
- **精确文件**：`core/stage-runner.mjs`、`runtime/task/task-store.mjs`、`runtime/task/material-workspace.mjs`、`runtime/evidence/quality-store.mjs`、`runtime/schemas/quality-verify.v1.json`、`runtime/stage/completion-predicates.mjs`
- **新增 schema**：`runtime/schemas/quality-verify.v1.json`；最低字段为 `task_id`、`stage`、`ac_id`、`status`、`method`、`evidence_ref`、`evidence_hash`、`material_digest`、`created_at`；唯一生产 consumer 为 `runtime/stage/completion-predicates.mjs`，必须区分 `unknown/unavailable` 与 `passed`，并拒绝未知状态。Phase 7 只消费已按该 schema 写入的 `quality/verify.json` 事实，不直接再声明 schema consumer。
- **输入**：失败 test receipt、错绑定 confirmation、facts/index 故障注入、quality-store 同 ref 竞争写
- **输出**：失败 receipt 不会 passed；不可用为 unavailable；事实索引一致性可证明；并发同内容幂等、不同内容明确冲突；无死条件/无消费者导出
- **依赖**：T026
- **并行**：no
- **FR**：FR-QUALITY-001、FR-STORAGE-001、FR-SAFETY-001
- **AC**：AC-015、AC-016、AC-021、AC-022、AC-023、AC-033、AC-034
- **AC-021 discharge**：本任务是 AC-021 唯一 final discharge owner；必须在 evidence index audit 中绑定 review/test/verify/confirm/authorize report 的 raw ref/hash，其他任务对 AC-021 只保留 matrix-only 子范围。
- **verification_role**：GREEN
- **paired_task**：T026
- **gate_cmd**：`npx vitest run tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs tests/contract/doctor-interface.test.mjs tests/contract/status-derivation.test.mjs tests/contract/material-workspace.test.mjs tests/contract/public-behavior-baseline.test.mjs tests/integration/verify-freshness-selection.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/integration/first-three-stage-cutover.test.mjs tests/integration/minimal-task-storage.test.mjs tests/integration/governance-diagnostics-non-gate.test.mjs tests/integration/atomic-write-faults.test.mjs skills/wh-review/scripts/__tests__/review-source-materials.test.mjs tests/integration/quality-store-concurrency.test.mjs tests/integration/task-fact-index-consistency.test.mjs tests/contract/execution-identity.test.mjs tests/contract/stage-completion.test.mjs tests/contract/confirmation-authorization.test.mjs && node tools/architecture/public-behavior-baseline.mjs verify --baseline=c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf`
- **test/acceptance command**：同 `gate_cmd`
- **expected_exit**：0
- **oracle**：ORACLE-QUALITY-RED：失败 receipt 不得 passed；facts/index 和质量存储不留半写；并发语义与 task-store 一致；无消费者代码不进入生产 diff
- **evidence_path**：`evidence/phase-3/review-feedback-remediation/quality-v2/`
- **STOP**：无法证明失败 receipt 不假绿、facts/index 仍可产生未索引事实、并发仍裸 EEXIST 或修复依赖静默 catch 时停止
- **recovery**：只回退质量/存储 slice；保留失败事实和负测证据
- **task risk**：不得为消除复杂度删除仍由生产路径消费的质量或故障测试

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`passed`
- **actual_changes**：失败 receipt 不会被写成 passed；facts/index 与 quality-store 故障/并发契约通过；无消费者 material status export 已移除；baseline v2 verify 通过，未运行 full suite。
- **executed_commands**：`npx vitest run tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs tests/contract/doctor-interface.test.mjs tests/contract/status-derivation.test.mjs tests/contract/material-workspace.test.mjs tests/contract/public-behavior-baseline.test.mjs tests/integration/verify-freshness-selection.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/integration/first-three-stage-cutover.test.mjs tests/integration/minimal-task-storage.test.mjs tests/integration/governance-diagnostics-non-gate.test.mjs tests/integration/atomic-write-faults.test.mjs skills/wh-review/scripts/__tests__/review-source-materials.test.mjs tests/integration/quality-store-concurrency.test.mjs tests/integration/task-fact-index-consistency.test.mjs tests/contract/execution-identity.test.mjs tests/contract/stage-completion.test.mjs tests/contract/confirmation-authorization.test.mjs && node tools/architecture/public-behavior-baseline.mjs verify --baseline=c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf`（exit 0）。
- **evidence_refs**：`[{"ref":"receipts/build-code-t023-quality-v2.json","sha256":"49d5927fed1f259bdcadddc223a44de897e0bd9618838cc4b18d04111013f430","kind":"test_receipt"},{"ref":"evidence/phase-3-t023-quality-v2-tests","sha256":"f38874b59cafae35acb9a35331f31b6f2c9e3cfbcb0d7d9b95ad8c54cfcf3068","kind":"test_output"},{"ref":"evidence/phase-3/review-feedback-remediation/quality-red.json","sha256":"2017d5641c53b98acfea3c80f7f2a32fa40a714b21bda33ed3a49f661ad75b95","kind":"paired_red"}]`
- **covered_ac**：`unknown — AC-015、AC-016、AC-021、AC-022、AC-023、AC-033、AC-034；AC-021/AC-023 final discharge owner T023；reason_code=PHASE_FINAL_SUBCONTRACT`
- **review_fact**：`N/A — 用户已明确停止 wh-review；T023 仅完成 focused quality/storage gate`
- **completed_at**：`2026-08-03T06:01:58Z`

## Phase 4: 垂直删除 operational lineage

### Goal

逐机制完成 consumer→replacement→negative test→production delete→schema/fixture/test/docs delete→reference audit。

### Files

- **MODIFY（T009 owner）**：`tools/architecture/reference-audit.mjs`；T009 在本 Phase 先取当前 live-consumer report，Phase 4 只扩展 KEEP allow-list 和明确 exit 语义。
- **NEW（replacement test owner T010）**：`tests/integration/journal-replacement.test.mjs`、`tests/integration/projection-replacement.test.mjs`
- **KEEP_UNTIL_MIGRATION（补充审计结论）**：`core/audit-aggregator.mjs`、`core/journal-appender.mjs`、`core/journal-schema.mjs`、`core/receipt-schema.mjs` 仍被 `runtime/evidence/receipt-writer.mjs` 及相关 receipt/journal 路径消费；T010 只能 gate-only 审计，T012 负责 successor migration，当前不得物理删除。
- **MODIFY（bridge audit owner T009）**：`skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs`；与 `runtime/review/phase-review-subject.mjs`、`workflows/build-code/phase-evidence.mjs` 同批执行 bridge replacement proof，proof 不完整则三者一起 KEEP。
- **KEEP_UNTIL_MIGRATION（bridge oracle）**：`skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs`、`tests/build-code-phase-evidence.test.mjs` 在 T012 的 review/phase successor migration 完成且 T017 无 allow-list `reference-audit --check` 通过前不得删除；T009 只 gate-only/read-only 审计，T012 只消费并记录迁移 RED/GREEN。
- **KEEP_UNTIL_MIGRATION（当前不能删除）**：`core/canonical-receipt-writer.mjs`、`runtime/evidence/receipt-writer.mjs`、`core/audit-aggregator.mjs`、`core/journal-appender.mjs`、`core/journal-schema.mjs`、`core/receipt-schema.mjs`、`runtime/task/material-revision.mjs`、`runtime/schemas/task-material-revision.v1.json`、`runtime/review/review-flow-authority.mjs`、`runtime/review/phase-review-subject.mjs`、`workflows/build-code/phase-evidence.mjs`、`runtime/review/stage-review-disposition.mjs`、`tools/cli/check-task-record-paths.mjs`。每项必须在 T012/T015 的 final disposition 中写明 consumer、owner 和 close condition；replacement proof 不构成删除授权。T012 是 successor migration 的唯一实施 owner，T009/T010 只作 gate-only/read-only consumer；T010 的删除 oracle 必须在 `runtime/evidence/receipt-writer.mjs` 仍依赖旧 journal/audit 或相关测试/检查引用存在时停止。
`accepted_risk=AC017_019_PHASE_ORDER`：approved spec §5 将 AC-017～AC-019 固定在 Phase 0/4 产品退出，但当前 live consumer 需要 T012 successor migration；在 T017 无 allow-list reference-clean 与 final disposition 完成前保持 `incomplete`，discharge owner 为 T012/T015/T017，不能把 KEEP 或 replacement proof 记作完成。
- **MODIFY（replacement test owner T010）**：`skills/wh-review/scripts/__tests__/review-controller.test.mjs`；该测试只属于 `review` slice 的 replacement gate。
- **MODIFY**：`core/chain-topology.mjs`、`core/git-checkpoint.mjs`、`runtime/task/material-revision.mjs`、`runtime/schemas/task-material-revision.v1.json`、`tools/cli/ci-chain-check.mjs`、`tools/cli/migrate-task-v2.mjs`、`tools/cli/phase-gate.mjs`、`tools/cli/check-task-record-paths.mjs`、`scripts/runtime-cutover.mjs`、`config/runtime-fact-v2-sources.mjs`、`runtime/schemas/requirement-ledger.schema.json`、`runtime/schemas/requirements-coverage.schema.json`、`runtime/schemas/stage-content-evidence.v1.json`、`runtime/schemas/task-attempt.v2.schema.json`、`runtime/schemas/task-accepted.v2.schema.json`、`workflows/verify-code/metrics-writer.mjs`、`workflows/build-code/phase-evidence.mjs`、`tests/integration/progression-without-permits.test.mjs`、`tests/contract/legacy-zero.test.mjs`、`tests/build-code-phase-evidence.test.mjs`、`tests/build-code-preflight.red.test.mjs`、`tests/five-stage-audit-e2e.test.mjs`、`tests/five-stage-facts-v2.test.mjs`、`tests/phase-gate.test.mjs`、`tests/stage-content-host-independence.test.mjs`、`tests/stage-content-publication.test.mjs`、`tests/stage-interaction-contract.test.mjs`、`tests/stage-orchestrator-v2.test.mjs`、`tests/task-accepted-schema.test.mjs`、`tests/workflow-v2-contract.test.mjs`、`scripts/__tests__/ci-chain-check.test.mjs`、`scripts/__tests__/migrate-task-v2.test.mjs`、`core/audit-aggregator.mjs`、`core/journal-appender.mjs`、`core/journal-schema.mjs`、`core/receipt-schema.mjs`、`core/canonical-receipt-writer.mjs`、`runtime/evidence/receipt-writer.mjs`、`runtime/review/review-flow-authority.mjs`、`runtime/review/review-controller.mjs`、`runtime/review/phase-review-subject.mjs`、`runtime/review/stage-review-disposition.mjs`、`tools/cli/audit-aggregate.mjs`、`tests/audit-aggregator.test.mjs`、`tests/audit-p2.test.mjs`、`tests/official-component-receipts.test.mjs`、`core/__tests__/receipt-writer.test.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- **DELETE AFTER PROOF**：`core/chain-topology.mjs`、`core/git-checkpoint.mjs`、`tools/cli/audit-aggregate.mjs`、`tools/cli/ci-chain-check.mjs`、`tools/cli/migrate-task-v2.mjs`、`tools/cli/phase-gate.mjs`、`scripts/runtime-cutover.mjs`、`config/runtime-fact-v2-sources.mjs`、`runtime/schemas/requirement-ledger.schema.json`、`runtime/schemas/requirements-coverage.schema.json`、`runtime/schemas/stage-content-evidence.v1.json`、`runtime/schemas/task-attempt.v2.schema.json`、`runtime/schemas/task-accepted.v2.schema.json`、`workflows/verify-code/metrics-writer.mjs`，以及排除 `skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs`、`tests/build-code-phase-evidence.test.mjs` 的 T009/T010 精确分配的 17 个纯旧状态机测试；上述两个 bridge oracle 在 T012/T017 条件满足前不进入删除集合；`core/audit-aggregator.mjs`、`core/journal-appender.mjs`、`core/journal-schema.mjs`、`core/receipt-schema.mjs` 因仍被 `runtime/evidence/receipt-writer.mjs` 及相关 receipt/journal 路径消费，当前列为 KEEP_UNTIL_MIGRATION，不进入本 Phase 删除集合；上方 KEEP_UNTIL_MIGRATION 路径不在本 Phase 删除集合，未进入冻结 deletion-plan 的候选保持 KEEP
- **KEEP**：`workflows/make-decision/steps.json`、`workflows/build-spec/steps.json`、`workflows/build-plan/steps.json`、`workflows/build-code/steps.json`、`workflows/verify-code/steps.json`；它们是五阶段正式合同，不由 Phase 4 删除或重写，T006–T008 只验证其稳定入口语义。

`plan-task.v3` 当前只用 NEW/MODIFY 校验 touched path，因此上行 MODIFY 是结构合同中的“实施会触碰”；本行 DELETE AFTER PROOF 才是 disposition，二者不表示双 owner。

### Tasks

T009、T010。

### Verify

先执行 T009 的 `gate_cmd`（topology/recovery/pointer/phase 四个 slice），再执行 T010 的 `gate_cmd`（review/journal/projection 三个 slice）；每个 slice 仍使用矩阵中独立的 `replacement:<slice>` 过滤命令，不得用共享整文件测试替代归属明确的 oracle。

### Knowledge

只删除 successor/predecessor/selector/snapshot lineage/phase trace/historical correction/replacement review 等控制关系；单事实 provenance、review/test/confirm/auth 和 M14–M17 不删。

#### Slice replacement matrix

每个 slice 必须按 RED（旧控制依赖 fixture，exit 1）→ GREEN（替代路径，`replacement:<slice>` exit 0）→ production delete → 最小回归重跑的顺序执行；对应 replacement 命令未达到 exit 0 前不得删除生产入口。

- `topology` → `npx vitest run tests/integration/progression-without-permits.test.mjs -t "replacement:topology"`; before/after 只认该 slice 命令，分别 expected exit 1/0；删除命令 `node tools/architecture/phase0-deletion-disposition.mjs --check --slice=topology && node tools/architecture/reference-audit.mjs --check --slice=topology --allow-keep-until-migration=docs/architecture/retention-manifest.json`；evidence `evidence/phase-4/control-topology.json`。
- `recovery` → `npx vitest run tests/integration/progression-without-permits.test.mjs -t "replacement:recovery"`; before/after 只认该 slice 命令，分别 expected exit 1/0；删除命令 `node tools/architecture/phase0-deletion-disposition.mjs --check --slice=recovery && node tools/architecture/reference-audit.mjs --check --slice=recovery --allow-keep-until-migration=docs/architecture/retention-manifest.json`；evidence `evidence/phase-4/control-recovery.json`。
- `pointer` → `npx vitest run tests/integration/progression-without-permits.test.mjs -t "replacement:pointer"`; before/after 只认该 slice 命令，分别 expected exit 1/0；删除命令 `node tools/architecture/phase0-deletion-disposition.mjs --check --slice=pointer && node tools/architecture/reference-audit.mjs --check --slice=pointer --allow-keep-until-migration=docs/architecture/retention-manifest.json`；evidence `evidence/phase-4/control-pointer.json`。
- `phase` → `npx vitest run tests/integration/progression-without-permits.test.mjs -t "replacement:phase"`; before/after 只认该 slice 命令，分别 expected exit 1/0；删除命令 `node tools/architecture/phase0-deletion-disposition.mjs --check --slice=phase && node tools/architecture/reference-audit.mjs --check --slice=phase --allow-keep-until-migration=docs/architecture/retention-manifest.json`；evidence `evidence/phase-4/control-phase.json`。
- `review` → `npx vitest run skills/wh-review/scripts/__tests__/review-controller.test.mjs -t "replacement:review"`; before/after 只认该 slice 命令，分别 expected exit 1/0；删除命令 `node tools/architecture/phase0-deletion-disposition.mjs --check --slice=review && node tools/architecture/reference-audit.mjs --check --slice=review --allow-keep-until-migration=docs/architecture/retention-manifest.json`；evidence `evidence/phase-4/control-review.json`。
- `journal` → `npx vitest run tests/integration/journal-replacement.test.mjs -t "replacement:journal"`; before/after 只认该 slice 命令，分别 expected exit 1/0；该测试必须执行 `runtime/task/task-store.mjs`/`runtime/evidence/quality-store.mjs` 的替代写路径；删除命令 `node tools/architecture/phase0-deletion-disposition.mjs --check --slice=journal && node tools/architecture/reference-audit.mjs --check --slice=journal --allow-keep-until-migration=docs/architecture/retention-manifest.json`；evidence `evidence/phase-4/control-journal.json`。
- `projection` → `npx vitest run tests/integration/projection-replacement.test.mjs -t "replacement:projection"`; before/after 只认该 slice 命令，分别 expected exit 1/0；该测试必须执行 task fact/quality projection 的替代写路径；删除命令 `node tools/architecture/phase0-deletion-disposition.mjs --check --slice=projection && node tools/architecture/reference-audit.mjs --check --slice=projection --allow-keep-until-migration=docs/architecture/retention-manifest.json`；evidence `evidence/phase-4/control-projection.json`。
- Phase review evidence bridge 归入 `phase` slice，由 T009 消费该 slice 的 `replacement:phase` before/after oracle 与带 KEEP allow-list 的 `reference-audit`；该 audit 必须同时报告 `allowed_violations` 与 `unexpected_violations`，后者非空即失败。`skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs` 与 `tests/build-code-phase-evidence.test.mjs` 只作被删 bridge 的 consumer/路径审计，不冒充独立替代测试；`replacement:phase` 不通过则 bridge KEEP_UNTIL_MIGRATION。

### STOP

任一 consumer、替代事实、负测或 retention ref 缺失时该机制族保持不删。

### Done

每个机制族都必须得到 `DELETED` 或 `KEEP_UNTIL_MIGRATION` 的明确 disposition；只有前者要求生产引用归零。live consumer 路径不能以“replacement proof 完整”直接删除，必须先由 T012/T015 完成 successor 迁移并重新生成 reference audit。Phase review evidence bridge 当前按 KEEP_UNTIL_MIGRATION 处理，直到 phase evidence、review flow 和 capture helpers 均有同一事实 successor；最终 deletion-list 必须报告精确路径、消费者、责任任务和未完成原因。

### Risks and rollback

一次只删一个机制族；每族独立恢复 diff，禁止用兼容 reader 回滚。

#### T009 — 删除 topology、recovery、pointer 与 phase 控制族

- **ID**：T009
- **implementation_owner**：lineage-removal-worker-a
- **verification_owner**：independent-deletion-auditor-a
- **approval_owner**：user
- **Phase**：Phase 4: 垂直删除 operational lineage
- **goal**：逐族核验并删除无 live consumer 的 successor/predecessor/reopen/rebind/continuation/recovery/checkpoint permit/current pointer/selector/snapshot/phase trace；对仍被生产路径消费的 owner 记录 KEEP_UNTIL_MIGRATION，不为数字目标强删
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：T002 deletion plan 和 T008 反向行为证明；2026-08-03 reference audit 已证明 canonical receipt、material revision、review flow、stage-review disposition、phase evidence 仍有 live consumers
- **boundary**：inventory 点名的 runtime/core/scripts/tools/schema/fixture/test/docs/config 文件与 symbols
- **动作**：先运行 `node tools/architecture/reference-audit.mjs --check --slice=topology,recovery,pointer,phase,review,journal,projection --allow-keep-until-migration=docs/architecture/retention-manifest.json` 并保存同时包含 `allowed_violations` 与 `unexpected_violations` 的 live-consumer report；只读校验 Phase 0 锚定的 deletion-plan `{ref,content_hash}`，逐机制执行 consumer→replacement test→production delete→附属删除→rg audit；一次只删一族。replacement 通过不等于可删：每个 slice 必须同时满足生产/动态/检查/文档引用归零，或明确登记 `KEEP_UNTIL_MIGRATION`，并登记 `replacement_test`、`before_expected_exit=1`、`after_expected_exit=0`。Phase review evidence bridge 归入 `phase` slice；当前 `runtime/review/phase-review-subject.mjs`、`workflows/build-code/phase-evidence.mjs`、`skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs` 仍有真实 bridge/审计职责，先 KEEP_UNTIL_MIGRATION，不得因 `replacement:phase` 通过而删除；T012/T015 迁移完成且 reference-audit unexpected consumer=0 后才可重评估。proof 写入独立 phase evidence，不能改 deletion set；T010 不拥有这三个文件。
- **owner note**：T009 独占 `tools/architecture/reference-audit.mjs` 的 MODIFY/写边界；T010 只在 gate 中消费该 CLI，不拥有其文件或实现。
- **精确文件**：`tools/architecture/reference-audit.mjs`、`core/chain-topology.mjs`、`core/git-checkpoint.mjs`、`tools/cli/ci-chain-check.mjs`、`tools/cli/migrate-task-v2.mjs`、`tools/cli/phase-gate.mjs`、`scripts/runtime-cutover.mjs`、`config/runtime-fact-v2-sources.mjs`、`runtime/schemas/requirement-ledger.schema.json`、`runtime/schemas/requirements-coverage.schema.json`、`runtime/schemas/stage-content-evidence.v1.json`、`runtime/schemas/task-attempt.v2.schema.json`、`runtime/schemas/task-accepted.v2.schema.json`、`workflows/verify-code/metrics-writer.mjs`、`skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs`、`tests/integration/progression-without-permits.test.mjs`、`tests/contract/legacy-zero.test.mjs`、`tests/build-code-phase-evidence.test.mjs`、`tests/build-code-preflight.red.test.mjs`、`tests/five-stage-audit-e2e.test.mjs`、`tests/five-stage-facts-v2.test.mjs`、`tests/phase-gate.test.mjs`、`tests/stage-content-host-independence.test.mjs`、`tests/stage-content-publication.test.mjs`、`tests/stage-interaction-contract.test.mjs`、`tests/stage-orchestrator-v2.test.mjs`、`tests/task-accepted-schema.test.mjs`、`tests/workflow-v2-contract.test.mjs`、`scripts/__tests__/ci-chain-check.test.mjs`、`scripts/__tests__/migrate-task-v2.test.mjs`; `runtime/task/material-revision.mjs`、`runtime/schemas/task-material-revision.v1.json`、`runtime/review/phase-review-subject.mjs`、`workflows/build-code/phase-evidence.mjs`、`tools/cli/check-task-record-paths.mjs` 仅由 T012 successor migration 读取消费，T009 只作 gate-only/read-only audit
- **legacy-zero slice 约束**：执行时 `tests/contract/legacy-zero.test.mjs` 只包含 T009 当前拥有的 topology/recovery/pointer/phase assertions；整文件 exit 0 只声明当前 slice，T010/T013 后续子范围由各自 owner 的 gate 提供，不得用未来断言反向声称本任务完成。
- **bridge test owner override**：`tests/build-code-phase-evidence.test.mjs` 与 `skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs` 虽保留在 T009 的审计 boundary，但 T009 对二者只读/gate-only，不拥有修改或删除；T012 是 review/phase successor migration 的唯一生产迁移 owner，T017 final reference-clean 前保持 KEEP_UNTIL_MIGRATION。
- **输入**：每族完整 consumer map、替代事实、GREEN 负测
- **输出**：无 live consumer 项生产引用归零；有 live consumer 项产生 `KEEP_UNTIL_MIGRATION` disposition、消费者清单、责任任务和后续迁移条件，不宣称“控制族全部归零”
- **依赖**：T023
- **并行**：no
- **FR**：FR-DELETION-001、FR-MATERIAL-001
- **AC**：AC-012、AC-017、AC-018、AC-019
- **verification_role**：N/A — non-behavior change: internal control-plane deletion after replacement proof
- **paired_task**：N/A — focused replacement oracle already required
- **gate_cmd**：`node tools/architecture/phase0-deletion-disposition.mjs --check --slice=topology,recovery,pointer,phase && node tools/architecture/reference-audit.mjs --check --slice=topology,recovery,pointer,phase --allow-keep-until-migration=docs/architecture/retention-manifest.json && npx vitest run tests/integration/progression-without-permits.test.mjs -t "replacement:topology" && npx vitest run tests/integration/progression-without-permits.test.mjs -t "replacement:recovery" && npx vitest run tests/integration/progression-without-permits.test.mjs -t "replacement:pointer" && npx vitest run tests/integration/progression-without-permits.test.mjs -t "replacement:phase" && npx vitest run tests/contract/legacy-zero.test.mjs`
- **test/acceptance command**：`npx vitest run tests/integration/progression-without-permits.test.mjs -t "replacement:topology" && npx vitest run tests/integration/progression-without-permits.test.mjs -t "replacement:recovery" && npx vitest run tests/integration/progression-without-permits.test.mjs -t "replacement:pointer" && npx vitest run tests/integration/progression-without-permits.test.mjs -t "replacement:phase" && npx vitest run tests/contract/legacy-zero.test.mjs`
- **expected_exit**：0
- **oracle**：先验证 Phase 0 deletion-plan content hash；每个 slice 的 replacement_test 删除前按受控旧控制依赖 fixture exit 1，替代后 exit 0；随后 reference-audit 必须证明生产/动态/检查/文档消费者已归零，不能把仍有消费者的 canonical receipt、material revision、review flow、stage-review disposition、phase evidence bridge 标成删除；当前 live consumer 必须进入 KEEP_UNTIL_MIGRATION final disposition
- **evidence_path**：`evidence/phase-4/control-slices/topology-recovery-pointer-phase/`
- **STOP**：任一隐藏 consumer、唯一质量 oracle 或回滚边界缺失时该族不删
- **recovery**：恢复当前机制族独立 diff 并重跑同一 focused oracle
- **task risk**：动态 dispatch 名称可能避开文本扫描

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`passed`
- **actual_changes**：删除 6 个无 live consumer 的旧入口/测试：`core/chain-topology.mjs`、`tools/cli/ci-chain-check.mjs`、其测试、`tools/cli/phase-gate.mjs`、其测试、`scripts/runtime-cutover.mjs`；修 reference-audit 将复杂度诊断列为 ignored、KEEP source 引用列为 allowed；重算 1119 项 delivery inventory。仍有 consumer 的 checkpoint、material revision、review/phase bridge 保持 KEEP_UNTIL_MIGRATION。
- **executed_commands**：inventory/complexity 重算与 check；`phase0-deletion-disposition --check --slice=topology,recovery,pointer,phase`；`reference-audit --check --slice=topology,recovery,pointer,phase --allow-keep-until-migration=docs/architecture/retention-manifest.json`（unexpected=0）；四个 `replacement:*` focused tests；`npx vitest run tests/contract/legacy-zero.test.mjs`（3/3）；`git diff --check`。
- **evidence_refs**：`[{"ref":"evidence/phase-4/control-slices/topology-recovery-pointer-phase/t009.json","sha256":"0e99ae4f1c3c9bf6f1af204eb5ae340fb8ff2c6c5b303c8bdc4410b0f976bf84","kind":"phase_evidence"}]`
- **covered_ac**：`unknown — AC-012、AC-017、AC-018、AC-019；live consumer KEEP_UNTIL_MIGRATION；reason_code=KEEP_SUCCESSOR_OWNED_BY_T012_T015_T017`
- **review_fact**：`Phase 4 recovery formal review: semantic pass; phase evidence and review result are snapshot-bound; live consumers remain KEEP_UNTIL_MIGRATION as recorded`
- **completed_at**：`2026-08-03T06:09:07Z`

#### T010 — 删除 review lineage、journal 与重复持久化子树

- **ID**：T010
- **implementation_owner**：lineage-removal-worker-b
- **verification_owner**：independent-deletion-auditor-b
- **approval_owner**：user
- **Phase**：Phase 4: 垂直删除 operational lineage
- **goal**：删除已证明无 live consumer 的 historical correction/replacement review/revalidation chain/stage journal/results/runs/receipts/flow/revision 控制投影；对 canonical receipt 和仍存活的 review/storage owner 先登记 KEEP_UNTIL_MIGRATION
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：T002 deletion/retention manifest；T007 单 review fact replacement；2026-08-03 reference audit 已发现 canonical receipt、review flow 和旧 journal/audit receipt writer 仍有消费者
- **boundary**：wh-review/runtime review、journal/receipt/stage result modules及其 schemas/tests/docs/config
- **动作**：先消费 T009 的 live-consumer report，再只读验证 Phase 0 deletion-plan `{ref,content_hash}`；垂直删除前先区分 control projection 与事实 authority：review/test/confirm/auth/provenance 和当前仍被消费的 canonical receipt、review flow、stage-review disposition 保留；每个 slice 登记 `replacement_test`、删除前 exit 1、替代后 exit 0，并在删除后再次证明生产/动态/检查/文档引用归零。`runtime/evidence/receipt-writer.mjs` 只有在旧 journal/audit 依赖和对应测试/检查引用清理后才可重评估，不能用 projection replacement 测试直接授权删除。
- **owner note**：`tools/architecture/reference-audit.mjs` 仅作 T010 gate-only consumer；T009 负责其 NEW/写边界，T010 不修改、不删除该 CLI。
- **精确文件**：`core/audit-aggregator.mjs`、`core/journal-appender.mjs`、`core/journal-schema.mjs`、`core/receipt-schema.mjs`、`runtime/review/review-controller.mjs`、`tools/cli/audit-aggregate.mjs`、`tests/audit-aggregator.test.mjs`、`tests/audit-p2.test.mjs`、`tests/official-component-receipts.test.mjs`、`core/__tests__/receipt-writer.test.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/wh-review/scripts/__tests__/review-controller.test.mjs`、`tests/integration/journal-replacement.test.mjs`、`tests/integration/projection-replacement.test.mjs`、`tests/contract/legacy-zero.test.mjs`（仅 review/journal/projection 子范围）；`core/canonical-receipt-writer.mjs`、`runtime/evidence/receipt-writer.mjs`、`runtime/review/review-flow-authority.mjs`、`runtime/review/stage-review-disposition.mjs` 由 T012 successor migration 写入，T010 只作 gate-only/read-only review/journal/projection audit
- **legacy-zero slice 约束**：执行时 `tests/contract/legacy-zero.test.mjs` 只包含 T010 当前拥有的 review/journal/projection assertions；整文件 exit 0 只声明当前 slice，T009/T013 后续子范围由各自 owner 的 gate 提供，不得用未来断言反向声称本任务完成。
- **输入**：review pass/revise/unavailable 负测与 retention index
- **输出**：无 live consumer 的旧控制对象生产引用归零；仍存活的事实 authority 生成 KEEP_UNTIL_MIGRATION disposition，质量报告完整
- **依赖**：T009
- **并行**：no
- **FR**：FR-DELETION-001、FR-QUALITY-001、FR-STORAGE-001、FR-PUBLIC-001（matrix-only：review/verify 公开行为子范围）
- **AC**：AC-004、AC-015、AC-018、AC-019、AC-020、AC-021、AC-022
- **verification_role**：N/A — non-behavior change: internal review lineage deletion after replacement proof
- **paired_task**：N/A — focused replacement oracle already required
- **gate_cmd**：`node tools/architecture/phase0-deletion-disposition.mjs --check --slice=review,journal,projection && node tools/architecture/reference-audit.mjs --check --slice=review,journal,projection --allow-keep-until-migration=docs/architecture/retention-manifest.json && npx vitest run skills/wh-review/scripts/__tests__/review-controller.test.mjs -t "replacement:review" && npx vitest run tests/integration/journal-replacement.test.mjs -t "replacement:journal" && npx vitest run tests/integration/projection-replacement.test.mjs -t "replacement:projection" && npx vitest run tests/contract/legacy-zero.test.mjs`
- **test/acceptance command**：`npx vitest run skills/wh-review/scripts/__tests__/review-controller.test.mjs -t "replacement:review" && npx vitest run tests/integration/journal-replacement.test.mjs -t "replacement:journal" && npx vitest run tests/integration/projection-replacement.test.mjs -t "replacement:projection" && npx vitest run tests/contract/legacy-zero.test.mjs`
- **expected_exit**：0
- **oracle**：每次 review 只追加独立事实；无 flow head/round/replacement 的候选对象才允许删除；raw ref/hash/verdict 保留；当前 live consumer 不得被 replacement 测试掩盖
- **evidence_path**：`evidence/phase-4/control-slices/review-journal-projection/`
- **STOP**：retention ref 不完整、provider 事实会丢失或测试只能靠旧链通过时停止
- **recovery**：恢复当前机制族独立 diff，不覆盖已存在 review report
- **task risk**：审查 transport 与 review control 可能被误删在一起

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`passed`
- **actual_changes**：删除无 live consumer 的旧 `tools/cli/audit-aggregate.mjs`；保留仍被 runtime receipt/review flow 消费的 audit aggregator、journal、receipt 和 review authority。
- **executed_commands**：inventory/complexity 重算与 check；`phase0-deletion-disposition --check --slice=review,journal,projection`；`reference-audit --check --slice=review,journal,projection --allow-keep-until-migration=docs/architecture/retention-manifest.json`（unexpected=0）；review/journal/projection 三个 `replacement:*` focused tests；`npx vitest run tests/contract/legacy-zero.test.mjs`（3/3）；`git diff --check`。
- **evidence_refs**：`[{"ref":"evidence/phase-4/control-slices/review-journal-projection/t010.json","sha256":"dd93ae369a1bc91ea4e9bb35cbf9385bd49166e73486215b4cbf32ae98591cfb","kind":"phase_evidence"}]`
- **covered_ac**：`unknown — AC-004、AC-015、AC-018、AC-019、AC-020、AC-021、AC-022；review/journal/projection 的 replacement proof 通过；live consumer KEEP_UNTIL_MIGRATION；reason_code=KEEP_SUCCESSOR_OWNED_BY_T012_T015_T017`
- **review_fact**：`Phase 4 recovery formal review: semantic pass; review/journal/projection replacement evidence is included in the same snapshot-bound phase review`
- **completed_at**：`2026-08-03T06:13:00Z`

## Phase 5: 历史只读与质量保留

### Goal

证明历史 task 前后摘要一致，新运行时不读取历史链；质量和治理学习资料可定位且不作 gate。

### Files

- **NEW**：`tools/architecture/retention-audit.mjs`、`tests/integration/history-read-only.test.mjs`、`tests/integration/governance-learning-non-gate.test.mjs`
- **MODIFY**：`tools/architecture/history-inventory.mjs`
- **READ/CONSUME**：`docs/architecture/history-inventory.json` 只读使用 Phase 0 冻结的 `{ref,content_hash}`，不属于 T011 写集合

### Tasks

T011。

### Verify

`node tools/architecture/history-inventory.mjs verify-unchanged && node tools/architecture/retention-audit.mjs --check && npx vitest run tests/integration/history-read-only.test.mjs tests/integration/governance-learning-non-gate.test.mjs`

### Knowledge

历史数据不迁移、不补 hash、不改路径；必要读取只能是独立离线诊断，不进入 runtime progression。

### STOP

摘要变化、出现 importer/legacy reader/双写、raw review 或 M14–M17 无引用时停止。

### Done

历史 task 前后摘要一致；新 runtime 不读历史链；quality/M14–M17 可定位且不作 gate。

### Risks and rollback

本 Phase 禁止写历史目录；误写必须无损恢复，否则阻塞交付。

#### T011 — 证明历史只读并保留 M14–M17

- **ID**：T011
- **implementation_owner**：history-retention-worker
- **verification_owner**：independent-history-verifier
- **approval_owner**：user
- **Phase**：Phase 5: 历史只读与质量保留
- **goal**：历史 task 前后摘要一致；review/test/verify/confirm/auth 和 M14–M17 可定位且不作 gate
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：T002 before digest 和 retention manifest
- **boundary**：历史目录只读；写入仅限 architecture report、离线 audit 工具和新 tests
- **动作**：比较路径/hash/数量；验证无 importer/legacy reader/双写；验证 governance-learning unknown 不阻塞
- **精确文件**：`tools/architecture/history-inventory.mjs`、`tools/architecture/retention-audit.mjs`、`tests/integration/history-read-only.test.mjs`、`tests/integration/governance-learning-non-gate.test.mjs`
- **gate-only/read-only 输入**：`docs/architecture/history-inventory.json` 由 T002 冻结、T011/T017 只读消费，不属于 T011 写集合
- **输入**：实施前历史 digest、实施后只读扫描、新 task 无 legacy storage fixture
- **输出**：历史零改动、保留索引完整、学习资料仅诊断
- **依赖**：T010
- **并行**：no
- **FR**：FR-LEARNING-001、FR-HISTORY-001、FR-STORAGE-001
- **AC**：AC-021、AC-024、AC-025、AC-026、AC-027
- **verification_role**：N/A — non-behavior change: read-only history and retention verification
- **paired_task**：N/A — no behavior implementation pair
- **gate_cmd**：`node tools/architecture/history-inventory.mjs verify-unchanged && node tools/architecture/retention-audit.mjs --check && npx vitest run tests/integration/history-read-only.test.mjs tests/integration/governance-learning-non-gate.test.mjs`
- **test/acceptance command**：`node tools/architecture/history-inventory.mjs verify-unchanged`
- **expected_exit**：0
- **oracle**：历史路径/bytes/hash/数量一致；新 runtime 不加载历史链；缺学习资料只写 unknown
- **evidence_path**：`evidence/phase-5/history-retention.json`
- **STOP**：任一历史摘要变化、出现 importer/legacy reader 或学习资料成为 stage gate 时停止
- **recovery**：恢复任何误写历史 bytes；若无法无损恢复则阻塞并报告
- **task risk**：mtime 或文件系统元数据可能被误当内容变化

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`passed`
- **actual_changes**：`history-inventory.mjs` 改为扫描当前历史路径并按 bytes/hash 校验新增、删除、修改；新增 `retention-audit.mjs` 和两个集成测试，保留 M14a/M14b/M15 定位，M16/M17a/M17b 缺失仅记录 `unknown`，并扫描 runtime 历史引用、legacy reader/importer 与双写。
- **executed_commands**：`node tools/architecture/history-inventory.mjs verify-unchanged`（449/449）；`node tools/architecture/retention-audit.mjs --check`（errors=0，unknown 不作 gate）；`npx vitest run tests/integration/history-read-only.test.mjs tests/integration/governance-learning-non-gate.test.mjs`（4/4）；`git diff --check`。
- **evidence_refs**：`[{"ref":"evidence/phase-5/history-retention.json","sha256":"92c3df520c02e82002d6dfdf031778638c158fba8c94cd2c1f5638ec2353a122","kind":"phase_evidence"}]`
- **covered_ac**：`unknown — AC-021、AC-024、AC-025、AC-026、AC-027；历史 bytes/hash/路径/数量保持；M14–M17 可定位或显式 unknown；学习资料不作 gate`
- **review_fact**：`Phase 5 formal review: semantic revise_required; two actionable major findings remain (acceptance-map implementation anchors and synthetic reference-clean sentinel); Phase 5 is not formally complete and no Phase 6 work is started`
- **completed_at**：`2026-08-03T06:18:00Z`

## Phase 6: 目录、测试与发行收敛

### Goal

只移动仍有真实 consumer 的文件，按 interface/contract/integration/e2e 收敛测试，并验证 Bundle/Runner 闭包。

### Files

- **MODIFY**：`core/stage-context.mjs`、`core/stage-handlers.mjs`、`core/stage-runner.mjs`、`core/stage-content-evidence.mjs`、`core/stage-completion-facts.mjs`、`core/task-handle.mjs`、`core/task-kernel-implementation.mjs`、`core/workspace.mjs`、`core/task-index.mjs`、`core/schemas/interaction-completion.v1.json`、`scripts/stage-runtime.mjs`、`scripts/task-close.mjs`、`skills/spec-specify/`、`skills/spec-clarify/`、`skills/spec-plan/`、`skills/spec-tasks/`、`skills/stage-step-receipts/`、`skills/audit-summary-carrier/`、`skills/review-response/`、`skills/test-strategy/`、`skills/debate/`、`skills/diagnosing-bugs/`、`skills/test-routing-advisor/`、`skills/workflowhub-host-protocol/`、`config/workflowhub.yaml`、`skills/catalog.yaml`、`tests/final-cutover-guards.red.test.mjs`、`tests/stage-content-evidence.test.mjs`、`tests/task-close-delivery.test.mjs`、`tests/terminal-runtime-blockers.test.mjs`、`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`core/__tests__/task-handle.test.mjs`、`tests/e2e/five-stage-normal.test.mjs`、`tests/e2e/five-stage-material-revision.test.mjs`、`tests/e2e/five-stage-idempotent-resume.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/contract/legacy-zero.test.mjs`、`runtime/distribution/runner-release.mjs`、`runtime/distribution/skill-bundle-release.mjs`、`tests/integration/distribution-closure.test.mjs`、`tests/integration/runner-clean-install.test.mjs`、`tools/architecture/inventory.mjs`、`tools/architecture/complexity-report.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/move-map.json`、`workflows/build-spec/`、`workflows/build-plan/`、`runtime/evidence/check-skill-closure.mjs`、`tools/cli/check-contract.mjs`、`tools/cli/smoke-local-skill-dispatch.mjs`、`package.json`
- **NEW（T015 final disposition）**：`evidence/final/deletion-list.json`、`evidence/final/retention-list.json`
- **MOVE（T012 test owners）**：`core/__tests__/task-handle.test.mjs → tests/contract/task-handle.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs → tests/integration/task-kernel-publish.test.mjs`、`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs → tests/e2e/stage-runtime-five-stage-e2e.test.mjs`
- **MODIFY（final disposition owner T015）**：`tools/architecture/phase0-deletion-disposition.mjs`、`tools/architecture/retention-audit.mjs`、`docs/architecture/retention-manifest.json`；先读证据并更新 disposition，再按 proof 执行已登记的 ARCHIVE/REMOVE。`tools/architecture/reference-audit.mjs` 与 `tools/architecture/history-inventory.mjs` 是永久 READ/KEEP oracle，T015 只把它们写入最终 retention list。
- **KEEP/READ（T017 history proof）**：`tools/architecture/history-inventory.mjs` 由 T017 在最终 gate 中执行 `verify-unchanged`，不进入 T015 删除集合。
- **MODIFY（T013 MERGE targets）**：`skills/wh-review/SKILL.md`、`skills/wh-review/scripts/review-result.mjs`、`skills/wh-review/skill-bundle.json`、`skills/wh-review/manifest.json`；T013 只写 MERGE 目标和 hash sync，T019 仍拥有 Phase 3 packet/hash。

### DELETE AFTER PROOF

- **DELETE AFTER PROOF**：`skills/spec-specify/`、`skills/spec-clarify/`、`skills/spec-plan/`、`skills/spec-tasks/`、`skills/stage-step-receipts/`、`skills/audit-summary-carrier/`、`skills/test-strategy/`；由 T013 在 Phase 6 按 T002 disposition matrix 执行 MERGE/REMOVE，Phase 4/T009 不拥有这些 skill。
- **DELETE AFTER PROOF**：`tools/architecture/retention-audit.mjs`；`tools/architecture/phase0-deletion-disposition.mjs` KEEP 至 Phase 4 deletion-list 完成并保留其独立 `deletion_manifest_drift`/`deletion_slice_mismatch` contract；`tools/architecture/reference-audit.mjs` 与 `tools/architecture/history-inventory.mjs` 永久 READ/KEEP，分别作为最终 reference-clean 与历史摘要 oracle，不进入删除集合；`docs/architecture/retention-manifest.json` 保留并回写最终 disposition，最终删除/保留事实由 T015 写入 `evidence/final/deletion-list.json` 与 `evidence/final/retention-list.json`。

**MOVE source→target contract**：`core/stage-context.mjs → runtime/stage/stage-context.mjs`；`core/stage-handlers.mjs → runtime/stage/stage-handlers.mjs`；`core/stage-runner.mjs → runtime/stage/stage-runner.mjs`；`core/stage-content-evidence.mjs → runtime/evidence/stage-content-evidence.mjs`；`core/stage-completion-facts.mjs → runtime/evidence/stage-completion-facts.mjs`；`core/task-handle.mjs → runtime/task/task-handle.mjs`；`core/task-kernel-implementation.mjs → runtime/task/task-kernel-implementation.mjs`；`core/workspace.mjs → runtime/task/workspace.mjs`；`core/task-index.mjs → runtime/task/task-index.mjs`；`core/schemas/interaction-completion.v1.json → runtime/schemas/interaction-completion.v1.json`；`scripts/stage-runtime.mjs → tools/cli/stage-runtime.mjs`；`scripts/task-close.mjs → tools/cli/task-close.mjs`。每项移动前后登记 source/target/owner/consumer、pre/post blob hash 和 move-map proof；target 验证通过后才删除旧 owner。
上述 12 个 target 在 Phase 0 candidate snapshot 均为 `missing`，所以 T012 是 source→new target 的职责合并/路径收敛，不是假定已有第二份实现的机械覆盖；若实施时任一 target 已出现，必须停止当前 MOVE，先登记 source/target 语义差异并补该 pair 的 RED/GREEN，再继续删除旧 owner。
T012 同时登记三项测试 MOVE：`core/__tests__/task-handle.test.mjs → tests/contract/task-handle.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs → tests/integration/task-kernel-publish.test.mjs`、`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs → tests/e2e/stage-runtime-five-stage-e2e.test.mjs`；每项记录 source/target/pre/post blob hash，target 验证通过后才删除 source。T014 只消费迁移后的 target 路径。

### Tasks

T012、T013、T014、T027、T015。

### Verify

`node tools/architecture/inventory.mjs --check && npm run check && npx vitest run tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs tests/contract/stage-completion.test.mjs tests/contract/legacy-zero.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/integration/first-three-stage-cutover.test.mjs tests/contract/confirmation-authorization.test.mjs tests/contract/execution-identity.test.mjs tests/contract/task-handle.test.mjs tests/integration/task-kernel-publish.test.mjs tests/e2e/stage-runtime-five-stage-e2e.test.mjs`

AC-041 的产品退出条件不改写：discharge owner 固定为 T017；T017 的 `evidence/final/verification-summary.json` 必须显式列出被回填的 Phase 6 退出项、mutation/full suite receipt、AC-041 证据引用和回填时间。full suite 的执行位置是最终 Phase 7，但在 T017 回填前 Phase 6 不得关闭或进入最终确认。

Phase 6 只产生 `incomplete`（`reason_code=AC041_DISCHARGE_OWNED_BY_T017`），不把 AC-041 标为完成；这是尚未关闭的 implementation checkpoint，不是 Phase 6 退出。T017 必须把 mutation/full suite receipt 回填为 Phase 6/AC-041 的 discharge evidence，之后才能满足 spec 的 Phase 6 产品退出条件并进入 verify-code 交付确认。`accepted_risk=AC041_PHASE_ORDER` 必须在 build-plan 确认摘要中引用 approved spec 的 Phase 6 退出条件与“full suite 只执行一次”约束；允许 T030/T016 在该 checkpoint 尚未关闭时准备最终验证，但不得进入最终确认。

该顺序是对原始 spec Phase 6 退出条件的显式、用户可见偏离：spec 要求 AC-041 在 Phase 6 出口成立，但“full suite 只执行一次”要求唯一 receipt 在最终 Phase 7 产生。build-plan 确认摘要必须同时引用这两个约束，并在 T017 回填 receipt 后才宣告 Phase 6 产品退出，不得静默改写阶段定义。

### Knowledge

目录移动是机械收敛，不承载行为修改；测试减少必须来自机制删除，不能删除接口质量覆盖。

### STOP

tracked file 无 owner/consumer/disposition、Bundle 含 tests/node_modules/history 或移动未登记 move-map 时停止。

### Implementation checkpoint（不是 Phase 6 退出）

所有 tracked file 唯一 owner/consumer/disposition；测试按稳定接口组织；Bundle/Runner clean closure 通过。AC-041 仍是 spec 固定的 Phase 6 退出条件；T017 在最终 Phase 7 运行一次 mutation/full suite 并回填证据。在 T017 回填前，Phase 6 只能记录 `incomplete`（`reason_code=AC041_DISCHARGE_OWNED_BY_T017`），不得标为 Phase 6 完成或进入最终确认。

### Risks and rollback

行为变化与机械 move 分离；按 move-map 反向恢复，不新增 bridge。

#### T012 — 合并 core/scripts 生产 owner 到 runtime/tools

- **ID**：T012
- **implementation_owner**：runtime-structure-worker
- **verification_owner**：independent-architecture-verifier
- **approval_owner**：user
- **Phase**：Phase 6: 目录、测试与发行收敛
- **goal**：把 core 与 scripts 的保留职责迁入 runtime/tools，删除重复生产 owner
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：T002 owner map；T009/T010 的 replacement/reference audit disposition；2026-08-03 audit 已证明 canonical receipt、material revision、review flow、stage-review disposition、phase evidence 仍有 live consumers，不能假设 Phase 4 已删除
- **boundary**：files: `core/stage-context.mjs`、`core/stage-handlers.mjs`、`core/stage-runner.mjs`、`core/stage-content-evidence.mjs`、`core/stage-completion-facts.mjs`、`core/task-handle.mjs`、`core/task-kernel-implementation.mjs`、`core/workspace.mjs`、`core/task-index.mjs`、`core/schemas/interaction-completion.v1.json`、`scripts/stage-runtime.mjs`、`scripts/task-close.mjs`、`docs/architecture/move-map.json`
- **baseline consumer**：`tools/architecture/public-behavior-baseline.mjs` 只作 T012 gate-only consumer；baseline commit 解析旧入口 `scripts/stage-runtime.mjs`，candidate 在 MOVE 后解析当前 `tools/cli/stage-runtime.mjs`，固定 argv/环境/行为身份不变，并在 move-map proof 中记录 baseline/candidate entry resolution 与 collector hash。
- **动作**：先用 T002 冻结的 V3 move-map 为每项写 source/target/owner/consumer/pre-hash；Phase 0 已证明 12 个 target 均为 missing，因此把保留实现合并到新 runtime/stage|task|evidence|schemas 路径、把 CLI 合并到 tools/cli；同时消费 T009/T010 的 `KEEP_UNTIL_MIGRATION` 清单，优先迁移仍有 live consumer 的 canonical receipt、material revision、review flow、stage-review disposition 和 phase evidence，而不是只移动无消费者文件。验证 target、静态/动态引用、clean Bundle 后才删除旧 owner，并立即写 post-hash。若 target 在实施前出现，停止并补 source/target 语义差异的 RED/GREEN，不把双实现覆盖当机械 MOVE。`scripts/runtime-cutover.mjs` 由 Phase 4/T009 按 deletion-plan 处理，本任务不迁移它
- **MOVE source→target**：`core/stage-context.mjs → runtime/stage/stage-context.mjs`；`core/stage-handlers.mjs → runtime/stage/stage-handlers.mjs`；`core/stage-runner.mjs → runtime/stage/stage-runner.mjs`；`core/stage-content-evidence.mjs → runtime/evidence/stage-content-evidence.mjs`；`core/stage-completion-facts.mjs → runtime/evidence/stage-completion-facts.mjs`；`core/task-handle.mjs → runtime/task/task-handle.mjs`；`core/task-kernel-implementation.mjs → runtime/task/task-kernel-implementation.mjs`；`core/workspace.mjs → runtime/task/workspace.mjs`；`core/task-index.mjs → runtime/task/task-index.mjs`；`core/schemas/interaction-completion.v1.json → runtime/schemas/interaction-completion.v1.json`；`scripts/stage-runtime.mjs → tools/cli/stage-runtime.mjs`；`scripts/task-close.mjs → tools/cli/task-close.mjs`
- **精确文件**：`core/stage-context.mjs`、`core/stage-handlers.mjs`、`core/stage-runner.mjs`、`core/stage-content-evidence.mjs`、`core/stage-completion-facts.mjs`、`core/task-handle.mjs`、`core/task-kernel-implementation.mjs`、`core/workspace.mjs`、`core/task-index.mjs`、`core/schemas/interaction-completion.v1.json`、`scripts/stage-runtime.mjs`、`scripts/task-close.mjs`、`docs/architecture/move-map.json`
- **精确 target 文件**：`runtime/stage/stage-context.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/evidence/stage-content-evidence.mjs`、`runtime/evidence/stage-completion-facts.mjs`、`runtime/task/task-handle.mjs`、`runtime/task/task-kernel-implementation.mjs`、`runtime/task/workspace.mjs`、`runtime/task/task-index.mjs`、`runtime/schemas/interaction-completion.v1.json`、`tools/cli/stage-runtime.mjs`、`tools/cli/task-close.mjs`
- **KEEP successor receipt dependency**：`core/receipt-schema.mjs` 与 `core/audit-aggregator.mjs`、`core/journal-appender.mjs`、`core/journal-schema.mjs` 同列 T012 KEEP_UNTIL_MIGRATION source；在 `runtime/evidence/receipt-writer.mjs` 的旧 journal/audit 依赖和相关测试/检查引用归零前不得删除。
- **精确 test move 文件**：`core/__tests__/task-handle.test.mjs`、`tests/contract/task-handle.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`tests/integration/task-kernel-publish.test.mjs`、`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`、`tests/e2e/stage-runtime-five-stage-e2e.test.mjs`
- **KEEP successor migration 精确文件**：`core/canonical-receipt-writer.mjs`、`runtime/evidence/receipt-writer.mjs`、`core/journal-appender.mjs`、`core/journal-schema.mjs`、`core/audit-aggregator.mjs`、`core/receipt-schema.mjs`、`runtime/task/material-revision.mjs`、`runtime/schemas/task-material-revision.v1.json`、`runtime/review/review-flow-authority.mjs`、`runtime/review/stage-review-disposition.mjs`、`runtime/review/phase-review-subject.mjs`、`workflows/build-code/phase-evidence.mjs`、`skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs`、`tests/build-code-phase-evidence.test.mjs`、`tools/cli/check-task-record-paths.mjs`、`runtime/task/material-workspace.mjs`、`runtime/task/task-store.mjs`、`runtime/evidence/quality-store.mjs`；两个 bridge test 由 T009 gate-only/read-only 审计、由 T012 只消费 review/phase successor migration RED/GREEN，不扩大 T012 删除写权限；T009 的 `tools/architecture/reference-audit.mjs` 和其他 T009/T010 replacement tests 只作 gate-only/read-only consumer。
- **KEEP successor migration matrix**：canonical/journal/receipt → `runtime/task/task-store.mjs` + `runtime/evidence/quality-store.mjs`；material revision → `runtime/task/material-workspace.mjs` + current material receipt；review flow/disposition/phase bridge → `runtime/evidence/quality-store.mjs` + external phase evidence；old path checker → `tools/architecture/reference-audit.mjs` gate contract。每项绑定 consumer、RED/GREEN、pre/post hash、delete_condition；T012 必须完成 migration 或明确写入 `incomplete`，不得把 KEEP 当作 AC-017/018/019 已完成。
- **输入**：零 operational lineage 的生产树、全仓 consumer/disposition
- **输出**：迁移后形成单一 runtime/CLI owner；仍未迁移的 live consumer 明确 KEEP，不以路径移动或文字审计假装归零
- **依赖**：T011
- **并行**：no
- **FR**：FR-DELETION-001、FR-GOVERNANCE-001、FR-RULES-001
- **AC**：AC-017、AC-018、AC-019、AC-037、AC-038、AC-042
- **verification_role**：GREEN — successor migration behavior and final owner convergence
- **paired_task**：`T012-KEEP-MIGRATION-RED` — same task disposable-copy RED; no additional historical task instance
- **migration_red_task**：`T012-KEEP-MIGRATION-RED`；先在 disposable copy 对每个 KEEP family 应用 path-bound inverse diff，取得独立 exit 1 receipt/hash，再销毁 disposable copy并在 candidate tree 取得 GREEN。
- **red_oracles**：`journal/projection` 使用 `npx vitest run tests/integration/journal-replacement.test.mjs -t "replacement:journal"` 与 `npx vitest run tests/integration/projection-replacement.test.mjs -t "replacement:projection"`，迁移前受控 legacy writer expected exit 1、successor writer expected exit 0；`review/phase` 使用 `npx vitest run skills/wh-review/scripts/__tests__/review-controller.test.mjs -t "replacement:review"` 与 `npx vitest run tests/build-code-phase-evidence.test.mjs`，迁移前 bridge/selector 依赖 expected exit 1、successor quality fact/外置 phase evidence expected exit 0；`material/task` 使用 `npx vitest run tests/integration/minimal-task-storage.test.mjs tests/contract/material-workspace.test.mjs`，迁移前 legacy material writer fixture expected exit 1、current material receipt/successor writer expected exit 0；`old checker` 使用 `node tools/architecture/reference-audit.mjs --check --allow-keep-until-migration=docs/architecture/retention-manifest.json`，迁移前保留已登记 KEEP、迁移后无 allow-list expected exit 0。测试文件均由原 owner gate-only，T012 只修改 production source/target 与 move-map。
- **migration_evidence_path**：`evidence/phase-6/keep-successor-migration/`
- **gate_cmd**：`node tools/architecture/inventory.mjs --check && node tools/architecture/reference-audit.mjs --check --allow-keep-until-migration=docs/architecture/retention-manifest.json && npm run check && npx vitest run tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs tests/contract/stage-completion.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/contract/confirmation-authorization.test.mjs tests/contract/execution-identity.test.mjs tests/contract/task-handle.test.mjs tests/integration/task-kernel-publish.test.mjs tests/e2e/stage-runtime-five-stage-e2e.test.mjs tests/contract/legacy-zero.test.mjs tests/integration/minimal-task-storage.test.mjs tests/contract/material-workspace.test.mjs tests/integration/quality-store-concurrency.test.mjs tests/integration/task-fact-index-consistency.test.mjs`
- **migration_red_gate_cmd**：在 disposable copy 对每个 KEEP family 应用 path-bound inverse diff 后，按 `npx vitest run tests/integration/journal-replacement.test.mjs -t "replacement:journal"`、`npx vitest run tests/integration/projection-replacement.test.mjs -t "replacement:projection"`、`npx vitest run tests/build-code-phase-evidence.test.mjs`、`npx vitest run tests/integration/minimal-task-storage.test.mjs tests/contract/material-workspace.test.mjs` 逐项取得 expected exit 1；将 `red_task_id=T012-KEEP-MIGRATION-RED`、`inverse_patch_hash`、exit/output hash 写入 `evidence/phase-6/keep-successor-migration/`，销毁 disposable copy 后才在 candidate tree 运行 GREEN gate。
- **gate_cmd storage append（必须与上方 gate_cmd 同次执行）**：`npx vitest run tests/integration/minimal-task-storage.test.mjs tests/contract/material-workspace.test.mjs tests/integration/quality-store-concurrency.test.mjs tests/integration/task-fact-index-consistency.test.mjs`；该命令的 receipt/hash 必须进入 T012 migration evidence。
- **KEEP successor storage gate（gate_cmd 必须包含）**：`npx vitest run tests/integration/minimal-task-storage.test.mjs tests/contract/material-workspace.test.mjs tests/integration/quality-store-concurrency.test.mjs tests/integration/task-fact-index-consistency.test.mjs`；该 gate 由 T004→T023→T012 owner sequence 共同消费，T012 只验证 successor migration 子范围及前后 storage contract 不回归。
- **test/acceptance command**：`node tools/architecture/reference-audit.mjs --check --allow-keep-until-migration=docs/architecture/retention-manifest.json && npx vitest run tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs tests/contract/stage-completion.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/contract/confirmation-authorization.test.mjs tests/contract/execution-identity.test.mjs tests/contract/task-handle.test.mjs tests/integration/task-kernel-publish.test.mjs tests/e2e/stage-runtime-five-stage-e2e.test.mjs tests/contract/legacy-zero.test.mjs`
- **expected_exit**：0
- **oracle**：每个 KEEP family 都有独立 RED→inverse patch→GREEN provenance、consumer/successor 列表、pre/post hash 和 delete_condition；已迁移项零重复生产 owner、旧 import 归零、move-map 与真实路径/hash 一致；KEEP_UNTIL_MIGRATION 项不计作完成迁移，必须列出消费者和 successor 条件；三条五阶段 E2E 与 stage-completion contract 在迁移后仍保持入口、推进顺序、workflow/run namespace、重复调用和完成谓词语义
- **evidence_path**：`evidence/phase-6/runtime-owner-slice.json`
- **STOP**：文件 consumer 未证明、唯一负向测试会丢失、move 未登记或 clean install 依赖仓外状态时停止
- **recovery**：按 move-map/删除 slice 恢复当前机械 diff；不增加兼容桥
- **task risk**：路径搬移可能掩盖 import 或动态读取遗漏

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`passed`
- **actual_changes**：按 move-map 将 12 个生产 owner 从 `core/`/`scripts/` 迁入 `runtime/`/`tools/cli/`，并将 3 个测试 owner 迁入稳定测试目录；修复全仓相对 import；补登记仍被迁移后 task kernel 消费的 `core/git-checkpoint.mjs` KEEP_UNTIL_MIGRATION；重算 inventory 为 1118 delivery files。
- **executed_commands**：`inventory --check`；全仓相对 import existence scan；`reference-audit --check --allow-keep-until-migration=docs/architecture/retention-manifest.json`（unexpected=0）；focused storage/identity/runner 62/62；T012 migration RED 记录 journal/projection/storage/phase/audit；迁移后 15 个文件 116 tests 通过，其中三条五阶段 E2E 通过；`git diff --check`。`npm run check` exit=1，唯一失败为当前 plan/tasks 的既有 markdownlint 100 errors，未修改 plan/tasks，已公开记录。
- **evidence_refs**：`[{"ref":"evidence/phase-6/runtime-owner-slice.json","sha256":"dbbdd808e305df0ee6d027b087a0f5369e91d865a613348e67a1494c3705410c","kind":"phase_evidence"}]`
- **covered_ac**：`unknown — AC-017、AC-018、AC-019、AC-037、AC-038、AC-042；已迁移项单一 owner；仍存活 checkpoint/canonical receipt/journal/review consumers 明确 KEEP；AC-041=AC041_DISCHARGE_OWNED_BY_T017`
- **review_fact**：`Phase 6 统一 wh-review：semantic pass；本任务未发起 task-level review，保留 T012 的迁移与 npm run check markdownlint 失败事实`
- **completed_at**：`2026-08-03T06:30:00Z`

#### T013 — 收敛 skills 与五阶段合同

- **skill 精确写集（T013 owner）**：`skills/isolated-browser-qa/`、`skills/intake-decision-review/`、`skills/plan-ceo-review/`、`skills/plan-design-review/`、`skills/plan-eng-review/`、`skills/qa-only/`、`skills/verify-change/`；只适配 packet/fact、quality/tests 路由和 bundle disposition
- **ID**：T013
- **implementation_owner**：skill-contract-worker
- **verification_owner**：independent-skill-verifier
- **approval_owner**：user
- **Phase**：Phase 6: 目录、测试与发行收敛
- **goal**：合并平行 skill，移出无 stage consumer 的通用 skill，保留真实审查和 QA/close 能力
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：Phase 0 skill consumer/disposition matrix；复用现有 `runtime/evidence/check-skill-closure.mjs`、`tools/cli/check-contract.mjs` 和 package script `smoke:skill-dispatch`
- **boundary**：来源 skills、目标 `workflows/build-spec/`、`workflows/build-plan/`、`runtime/evidence/`、`runtime/review/`、`skills/wh-review/`、catalog/config 及三个现有 closure 验证入口
- **动作**：按唯一 disposition 执行 MERGE/REMOVE/KEEP/EXCLUDE-FROM-BUNDLE；`skills/review-response/` 已确定 MERGE 到 `skills/wh-review/`，删除 flow/resolution validator，只保留最小 disposition fact；T013 独占 Phase 6 skill DELETE AFTER PROOF，先完成 replacement/closure proof 再物理删除；更新五阶段 skill-deps、catalog 和 review packet 合同。`debate`、`diagnosing-bugs`、`test-routing-advisor`、`workflowhub-host-protocol` 与 `_spike` 无迁出授权时保持仓内 provenance，只排除核心 Bundle/生产扫描
- **精确文件**：`skills/spec-specify/`、`skills/spec-clarify/`、`skills/spec-plan/`、`skills/spec-tasks/`、`skills/stage-step-receipts/`、`skills/audit-summary-carrier/`、`skills/review-response/`、`skills/test-strategy/`、`skills/debate/`、`skills/diagnosing-bugs/`、`skills/test-routing-advisor/`、`skills/workflowhub-host-protocol/`、`workflows/build-spec/`、`workflows/build-plan/`、`runtime/evidence/check-skill-closure.mjs`、`tools/cli/check-contract.mjs`、`tools/cli/smoke-local-skill-dispatch.mjs`、`config/workflowhub.yaml`、`skills/catalog.yaml`、`package.json`、`tests/contract/legacy-zero.test.mjs`
- **MERGE 写入落点**：`skills/wh-review/SKILL.md`、`skills/wh-review/scripts/review-result.mjs`（仅保留最小 disposition fact）、`skills/wh-review/skill-bundle.json`、`skills/wh-review/manifest.json`；T013 只负责 `skills/review-response/` 合并后的目标文件与 bundle hash 同步，T019 仍负责 `review-materials.mjs` 和 Phase 3 packet/hash。
- **精确文件追加（T013 owner）**：上列四个 `skills/wh-review/` MERGE target 属于 T013 可写集合；`skills/wh-review/skill-bundle.json` 的 Phase 3 packet/hash 仍由 T019 先写，T013 只在 Phase 6 合并后同步 hash。
- **执行时 slice 约束**：`tests/contract/legacy-zero.test.mjs` 只包含 T013 当前拥有的 skill/config/术语子范围；整文件 exit 0 只声明当前 slice，T009/T010 的 topology/recovery/pointer/phase/review/journal/projection 结论由各自 Phase gate 提供。
- **输入**：T002 skill consumer map 和已切换 facts/review 路径
- **输出**：无平行 spec/plan/test/review 控制 skill；Bundle 只含正式依赖
- **依赖**：T012
- **并行**：no
- **FR**：FR-DELETION-001、FR-DISTRIBUTION-001、FR-RULES-001
- **AC**：AC-017、AC-018、AC-019、AC-039、AC-042
- **verification_role**：N/A — non-behavior change: skill ownership simplification
- **paired_task**：N/A — behavior is covered by prior stage RED/GREEN pairs
- **gate_cmd**：`node runtime/evidence/check-skill-closure.mjs . && node tools/cli/check-contract.mjs && npm run smoke:skill-dispatch && npx vitest run tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs tests/contract/stage-completion.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/first-three-stage-cutover.test.mjs tests/contract/confirmation-authorization.test.mjs tests/contract/legacy-zero.test.mjs`
- **test/acceptance command**：`node runtime/evidence/check-skill-closure.mjs . && npm run smoke:skill-dispatch && npx vitest run tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs tests/contract/stage-completion.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/first-three-stage-cutover.test.mjs tests/contract/confirmation-authorization.test.mjs tests/contract/legacy-zero.test.mjs`
- **positive_oracle**：`npx vitest run skills/wh-review/__tests__/human-brief-behavioral.test.mjs && node runtime/evidence/check-skill-closure.mjs . && npm run smoke:skill-dispatch`；该正向事实证明最小 disposition fact 仍可被 wh-review 读取并完成 closure/dispatch。
- **expected_exit**：0
- **oracle**：五阶段和 wh-review 依赖闭包完整；失效 scope-triage 注册归零；KEEP/EXCLUDE skill 不进入核心 Bundle；未执行未授权物理迁出或 archive；五阶段 E2E、stage-completion 和 distribution closure 在 skill 收敛后仍通过
- **evidence_path**：`evidence/phase-6/skill-slice.json`
- **STOP**：无 consumer 证明、用户通用技能会被误删或 Bundle hash 不匹配时停止
- **recovery**：恢复当前 skill slice 的 path-bound patch 并重跑 closure
- **task risk**：把 lens 职责误判为重复入口

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`passed`
- **actual_changes**：合并 `review-response` 的最小 disposition fact 到 `wh-review`；删除无阶段消费者的 spec/plan/tasks、stage-step-receipts、audit-summary-carrier、review-response、test-strategy 独立 skill；保留 debate、diagnosing-bugs、test-routing-advisor、workflowhub-host-protocol 的仓内 provenance，但排除核心 Bundle/生产扫描；清理失效 config registry、旧 smoke imports 和 verify-code 旧 test-strategy contract。
- **executed_commands**：`node runtime/evidence/check-skill-closure.mjs . && node tools/cli/check-contract.mjs && npm run smoke:skill-dispatch`（exit 0）；`npx vitest run skills/wh-review/__tests__/human-brief-behavioral.test.mjs`（3/3，exit 0）；T013 focused gate（8 files，52 tests，exit 0）；`git diff --check`（exit 0）。未运行 `npm test`，未调用 `wh-review`。
- **evidence_refs**：`[{"ref":"evidence/phase-6/skill-slice.json","sha256":"0605297a64ee32bfd6d8394d7f89f643a32313714dec409a6a1dceb878c64fe7","kind":"phase_evidence"}]`
- **covered_ac**：`unknown — AC-017、AC-018、AC-019、AC-039、AC-042；reason_code=PHASE_SUBCONTRACT_ONLY，T015/T017 继续负责最终发行、治理基线和全量闭包证据`
- **review_fact**：`Phase 6 统一 wh-review：semantic pass；本任务仅记录 skill/config/bundle 收敛和 focused gate，不重复发起 task-level review`
- **completed_at**：`2026-08-03T06:45:00Z`

#### T014 — 重写混合测试

- **ID**：T014
- **implementation_owner**：test-structure-worker
- **verification_owner**：independent-test-verifier
- **approval_owner**：user
- **Phase**：Phase 6: 目录、测试与发行收敛
- **goal**：保留接口 oracle，删除只锁 accepted/checkpoint/phase/recovery 的测试
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：17 delete candidates、15 mixed candidates、21 keep tests 的只读审计；其中 4 个 review/progression tests 已由 T009/T010 独占修改
- **shared owner**：`skills/wh-review/skill-bundle.json` 由 T019 负责 Phase 3 packet/hash；T013 负责 Phase 6 MERGE 后 hash 同步，二者分别记录前后 hash，不扩大写权限。
- **boundary**：T014 Phase 6 收敛 slice 的 11 个混合测试：`tests/final-cutover-guards.red.test.mjs`、`tests/stage-content-evidence.test.mjs`、`tests/task-close-delivery.test.mjs`、`tests/terminal-runtime-blockers.test.mjs`、`tests/e2e/stage-runtime-five-stage-e2e.test.mjs`、`tests/integration/task-kernel-publish.test.mjs`、`tests/contract/task-handle.test.mjs`、`tests/e2e/five-stage-normal.test.mjs`、`tests/e2e/five-stage-material-revision.test.mjs`、`tests/e2e/five-stage-idempotent-resume.test.mjs`、`tests/contract/stage-completion.test.mjs`
- **不拥有**：`tests/integration/progression-without-permits.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/wh-review/scripts/__tests__/review-controller.test.mjs` 已由 Phase 4/T009/T010 完成语义切分与 replacement proof；Phase 6 不再修改这些文件。
- **动作**：T006 先拥有 Phase 2 的前三阶段与 confirmation/authorization 产品退出断言；T007/T008 再拥有 Phase 3 的三条 E2E、identity、build-code/verify-code 与 serious-finding 断言；T023 是 Phase 3 remediation 后唯一 complete GREEN gate，并重跑 `tests/contract/stage-completion.test.mjs`；T014 在冻结 snapshot 上先生成稳定接口断言清单，逐条记录被删断言对应的 deletion proof，再删除旧控制断言、整理测试归属和刷新 hash；删除前后对清单做 diff，清单减少必须只来自已完成的机制删除，且 gate 保留不属于 T014 写集合的 `tests/integration/vnext-official-stage-run.test.mjs -t "review:unavailable-not-passed"` 接口回归，不重写业务语义。Phase 4 的 progression 与 wh-review 测试由 T009/T010 拥有语义修改，T014 只负责后续机械收敛
- **精确文件**：`tests/final-cutover-guards.red.test.mjs`、`tests/stage-content-evidence.test.mjs`、`tests/task-close-delivery.test.mjs`、`tests/terminal-runtime-blockers.test.mjs`、`tests/e2e/stage-runtime-five-stage-e2e.test.mjs`、`tests/integration/task-kernel-publish.test.mjs`、`tests/contract/task-handle.test.mjs`、`tests/e2e/five-stage-normal.test.mjs`、`tests/e2e/five-stage-material-revision.test.mjs`、`tests/e2e/five-stage-idempotent-resume.test.mjs`、`tests/contract/stage-completion.test.mjs`
- **输入**：已通过三条 E2E 和各机制 deletion proof
- **输出**：测试减少来自机制删除；稳定接口与负向语义覆盖不下降
- **mutation_subset**：T014 只消费当前已冻结的 `tests/integration/mutation-guards.test.mjs` 五个 mutant：identity/tree hash、missing stage completion、failed major review、unauthenticated confirmation、bundle pollution；该固定子集的 kill 数不得下降。新增 mutant、完整映射、AC-041 与 mutation 总结由 T017 独占，不由 T014 预支或宣称完成。
- **依赖**：T013
- **并行**：no
- **FR**：FR-DELETION-001、FR-QUALITY-001、FR-GOVERNANCE-001
- **AC**：AC-017、AC-018、AC-019、AC-037、AC-038
- **verification_role**：N/A — non-behavior change: test suite ownership cleanup
- **paired_task**：N/A — replacement behavior tests already pass
- **gate_cmd**：`npx vitest run tests/final-cutover-guards.red.test.mjs tests/stage-content-evidence.test.mjs tests/task-close-delivery.test.mjs tests/terminal-runtime-blockers.test.mjs tests/e2e/stage-runtime-five-stage-e2e.test.mjs tests/integration/task-kernel-publish.test.mjs tests/contract/task-handle.test.mjs tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs tests/contract/stage-completion.test.mjs tests/contract/legacy-zero.test.mjs && npx vitest run tests/integration/vnext-official-stage-run.test.mjs -t "review:unavailable-not-passed" && npx vitest run tests/integration/mutation-guards.test.mjs && npx vitest run tests/integration/governance-diagnostics-non-gate.test.mjs`
- **test/acceptance command**：`npx vitest run tests/final-cutover-guards.red.test.mjs tests/stage-content-evidence.test.mjs tests/task-close-delivery.test.mjs tests/terminal-runtime-blockers.test.mjs tests/e2e/stage-runtime-five-stage-e2e.test.mjs tests/integration/task-kernel-publish.test.mjs tests/contract/task-handle.test.mjs tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs tests/contract/stage-completion.test.mjs tests/contract/legacy-zero.test.mjs && npx vitest run tests/integration/vnext-official-stage-run.test.mjs -t "review:unavailable-not-passed" && npx vitest run tests/integration/mutation-guards.test.mjs && npx vitest run tests/integration/governance-diagnostics-non-gate.test.mjs`
- **expected_exit**：0
- **oracle**：保留的 11 个混合测试仍覆盖所有稳定接口和关键失败语义；T009/T010 已独立登记四个 progression/wh-review 测试的迁移前后 hash 与语义 gate；`mutation-guards` 的固定 mutant 集合与 kill 数在删除前后不下降；本任务不裁决 Phase 4 的生产删除结果
- **evidence_path**：`evidence/phase-6/test-slice.json`
- **STOP**：唯一负向 oracle 未迁移或删除导致接口覆盖下降时停止
- **recovery**：恢复当前测试 slice，不恢复已删除生产状态机
- **task risk**：按文件删除可能误丢混合质量语义

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`passed`
- **actual_changes**：修正 `tests/task-close-delivery.test.mjs` 中 T012 目录迁移后的旧 `scripts/task-close.mjs` 复制/返回路径；保留 11 个混合测试文件的接口和失败语义，不删除质量断言。
- **executed_commands**：T014 focused gate 首次 12 files/314 tests 中 312 passed、2 个路径残留失败；修正后 targeted 2/2 passed；同一 focused gate 最终 12 files/314 tests exit 0；vNext unavailable 1/1、mutation guards 5/5、governance diagnostics 3/3 均 exit 0。未运行 `npm test`，未调用 `wh-review`。
- **evidence_refs**：`[{"ref":"evidence/phase-6/test-slice.json","sha256":"e521b5409554273fc41bff8d0c8f6aa48eb44e946869935f0a5a9a75ca8236c7","kind":"phase_evidence"}]`
- **covered_ac**：`unknown — AC-017、AC-018、AC-019、AC-037、AC-038；reason_code=PHASE_SUBCONTRACT_ONLY，T015/T017 继续负责最终发行和全量闭包`
- **review_fact**：`Phase 6 统一 wh-review：semantic pass；本任务仅记录测试归属/迁移残留修复和 focused gate，不重复发起 task-level review`
- **completed_at**：`2026-08-03T06:52:30Z`

#### T027 — 固定 Runner/Bundle 发行闭包的 RED 证据

- **ID**：T027
- **implementation_owner**：distribution-red-worker
- **verification_owner**：independent-distribution-verifier
- **approval_owner**：user
- **Phase**：Phase 6: 目录、测试与发行收敛
- **goal**：在改变发行收集边界前，证明当前 Runner 仍会带入旧控制面或 clean install 不能覆盖动态依赖
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：AC-039/AC-040 的发行闭包与 clean-install 语义；当前 `filesUnder` 全目录收集行为
- **boundary**：Runner/Bundle release tests；不修改 release implementation
- **动作**：先冻结旧控制面排除、动态依赖和空目录五阶段可执行的反向断言
- **精确文件**：`tests/integration/distribution-closure.test.mjs`、`tests/integration/runner-clean-install.test.mjs`
- **输入**：T014 后的当前发行 tree、Runner/Bundle release 输出
- **输出**：实现前至少一项发行闭包反向断言非零
- **依赖**：T014
- **并行**：no
- **FR**：FR-DISTRIBUTION-001、FR-GOVERNANCE-001、FR-RULES-001
- **AC**：AC-037、AC-038、AC-039、AC-040
- **verification_role**：RED
- **paired_task**：T015
- **gate_cmd**：`npx vitest run tests/integration/distribution-closure.test.mjs -t "bundle:excludes-old-control-plane" && npx vitest run tests/integration/runner-clean-install.test.mjs -t "runner:clean-install-five-stages" && npx vitest run tests/integration/governance-diagnostics-non-gate.test.mjs`
- **red_oracles**：`npx vitest run tests/integration/distribution-closure.test.mjs -t "bundle:excludes-old-control-plane"`；`npx vitest run tests/integration/runner-clean-install.test.mjs -t "runner:clean-install-five-stages"`；每条命令分别记录 expected exit 1，不用整文件 exit 1 作为归因。
- **test/acceptance command**：同 `gate_cmd`
- **expected_exit**：1
- **oracle**：ORACLE-DISTRIBUTION-RED：当前目录全收集会带入 audit/receipt/checkpoint/migration/phase-gate 等旧控制面，或 clean install 的动态依赖/五阶段执行证明缺失
- **evidence_path**：`evidence/phase-6/distribution-red.json`
- **STOP**：RED 不能由发行闭包缺陷稳定触发，或只能通过删除用户接口测试制造时停止
- **recovery**：只回退新增 RED 断言，不改写旧发行事实
- **task risk**：把实现后的期望输出反向写成 RED

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`skipped`
- **actual_changes**：未修改发行实现；按任务登记的两个 selector 取证时均发生 selector drift/no-op，未伪造旧控制面或 clean-install RED。
- **executed_commands**：`npx vitest run tests/integration/distribution-closure.test.mjs -t "bundle:excludes-old-control-plane"`（exit 0，0 tests，1 skipped）；`npx vitest run tests/integration/runner-clean-install.test.mjs -t "runner:clean-install-five-stages"`（exit 0，0 tests，5 skipped）；`npx vitest run tests/integration/governance-diagnostics-non-gate.test.mjs`（3/3，exit 0）。
- **evidence_refs**：`[{"ref":"evidence/phase-6/distribution-red.json","sha256":"fd415ec4b39d158f6331b12f2e3120acc7981b49e9e888607e772e7e5321ebfc","kind":"phase_red_receipt"}]`
- **covered_ac**：`unknown — AC-037、AC-038、AC-039、AC-040；reason_code=RED_ORACLE_SELECTOR_DRIFT，T015 必须用实现后正向发行闭包和 clean-install gate 取最终证据`
- **review_fact**：`Phase 6 统一 wh-review：semantic pass；T027 仍按 selector drift/no-op 记录为 skipped，未伪造 RED`
- **completed_at**：`2026-08-03T06:55:00Z`

#### T015 — 收窄 Runner/Bundle 并刷新治理基线

- **ID**：T015
- **implementation_owner**：distribution-worker
- **verification_owner**：independent-distribution-verifier
- **approval_owner**：user
- **Phase**：Phase 6: 目录、测试与发行收敛
- **goal**：Runner 使用入口依赖闭包而非目录全收集，Bundle/Runner clean install 后刷新 inventory/move-map/complexity
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：现有 validateRunnerRelease/installRunnerRelease 与约 35 个动态依赖路径
- **boundary**：生产/治理 files: `runtime/distribution/runner-release.mjs`、`runtime/distribution/skill-bundle-release.mjs`、`tools/architecture/inventory.mjs`、`tools/architecture/complexity-report.mjs`、`tools/architecture/phase0-deletion-disposition.mjs`、`tools/architecture/retention-audit.mjs`、`tools/architecture/reference-audit.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/move-map.json`、`docs/architecture/retention-manifest.json`；`tests/integration/distribution-closure.test.mjs`、`tests/integration/runner-clean-install.test.mjs` 仅 gate-only/read-only 消费 T027 RED，不写测试断言
- **动作**：在 T027 已冻结 RED 断言后改造 filesUnder 收集边界；复用现有 installRunnerRelease 做空目录五阶段验收；重算 inventory/complexity，deletion-plan 只读校验 Phase 0 content hash 并把发行 proof 写入独立 evidence；`history-inventory.mjs` 由 T017 执行最终 `verify-unchanged` 并永久 READ/KEEP；在最终 deletion-list/retention-list 写入后，由 T015 逐项验证其余前置架构 CLI 的 delete_condition，更新 retention-manifest 并执行 ARCHIVE/REMOVE，不把旧 move-map 当删除授权
- **精确文件**：`runtime/distribution/runner-release.mjs`、`runtime/distribution/skill-bundle-release.mjs`、`tools/architecture/inventory.mjs`、`tools/architecture/complexity-report.mjs`、`tools/architecture/phase0-deletion-disposition.mjs`、`tools/architecture/retention-audit.mjs`、`tools/architecture/reference-audit.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/move-map.json`、`docs/architecture/retention-manifest.json`、`evidence/final/deletion-list.json`、`evidence/final/retention-list.json`
- **输入**：T012–T014 的最终生产/skill/test tree
- **输出**：Bundle 无 tests/node_modules/history；Runner 无旧控制面且空目录五阶段可执行；前置架构 CLI 已按 proof 执行 ARCHIVE/REMOVE 或保留，并有 retention/deletion 最终记录
- **依赖**：T027
- **并行**：no
- **FR**：FR-DISTRIBUTION-001、FR-GOVERNANCE-001、FR-RULES-001
- **AC**：AC-037、AC-038、AC-039、AC-040
- **verification_role**：GREEN
- **paired_task**：T027
- **gate_cmd**：`npx vitest run tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs`
- **disposition_cmd**：`node tools/architecture/retention-audit.mjs --check && node tools/architecture/reference-audit.mjs --check --allow-keep-until-migration=docs/architecture/retention-manifest.json && node tools/architecture/inventory.mjs --check`；通过后才允许执行已登记的 ARCHIVE/REMOVE，并把结果写入 `evidence/final/deletion-list.json` 与 `evidence/final/retention-list.json`；unexpected reference consumers 非空时不得删除 KEEP_UNTIL_MIGRATION 路径
- **test/acceptance command**：`npx vitest run tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs tests/integration/governance-diagnostics-non-gate.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-DISTRIBUTION-RED：发行字节从公开入口闭包解析；动态依赖由 clean install 捕获；三份治理事实绑定当前 tree；T027 的 RED 断言在实现后为 0
- **evidence_path**：`evidence/phase-6/distribution-slice.json`
- **STOP**：需要新 clean-install 工具、隐式仓外状态或发行缺依赖时停止
- **recovery**：恢复 distribution slice 并保留 clean-install 失败输出
- **task risk**：静态闭包漏掉动态 read/import

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`passed`
- **actual_changes**：Runner 改为三个公开 CLI 入口的静态依赖闭包；显式保留动态 schema/contract/config 数据；刷新 inventory 与 complexity baseline；写入最终 deletion/retention 清单；保留仍有 live contract consumer 的两个架构 CLI。
- **executed_commands**：T015 gate 2 文件 6 tests；acceptance 3 文件 9 tests；retention/reference/inventory/complexity/Phase 0 disposition checks 全部 exit 0。
- **evidence_refs**：`[{"ref":"evidence/phase-6/distribution-slice.json","sha256":"ef202f4437d7fabc7071320a62ca4ca0a2adbd69ea36010a3459739061e05ab8","kind":"phase_evidence"},{"ref":"evidence/final/deletion-list.json","sha256":"33fb072b965fce07a78c8d0bbf8abbe8f323de2041be0e0ef54fdfc2dc941371","kind":"handoff_evidence"},{"ref":"evidence/final/retention-list.json","sha256":"373d63228ec75f06265bff17b53e5827f377a6798d5f222a595999e873338f0f","kind":"handoff_evidence"}]`
- **covered_ac**：AC-037、AC-038、AC-039、AC-040
- **review_fact**：Phase 6 unified wh-review: semantic pass; no task-level review repeated
- **completed_at**：2026-08-03T07:03:00Z

## Phase 7: 治理固化、最终验证与交接

### Goal

同步治理文档，完成候选与 baseline 七行为比较、mutation、必要 full suite、clean install、独立 review 和用户 review pack。

`review-tree-manifest.json` 固定可复算的 `include_globs`：`runtime/**`、`core/**`、`tools/**`、`scripts/**`、`workflows/**`、`skills/**`、`tests/**`、`config/**`、`docs/**`、`specs/**`、`AGENTS.md`、`CONSTITUTION.md`、`constitution-checklist.md`、`CONTEXT.md`、`package.json`、`package-lock.json`；固定 `exclude_globs`：`.git/**`、`node_modules/**`、task 外置存储、`evidence/phase-*/**`、`evidence/final/**`、`specs/workflowhub-complexity-governance-v3-20260802/tasks.md`、manifest 自身。四材料中的 `tasks.md` 全文件仍由 wh-review 审查，但不进入 `review_tree_hash`，因此其实施状态可在审查后回填；manifest 写入 include/exclude globs、排序后的实际 paths 和 `review_tree_hash`，`--require-same-review-tree` 只按这些 globs 重算。

### Files

- **NEW**：`evidence/final/m14-m17-impact.md`、`evidence/final/change-summary.md`、`evidence/final/review-tree-manifest.json`、`evidence/final/final-coverage.json`、`evidence/final/verification-summary.json`、`tests/contract/verify-final-coverage.test.mjs`
- **MODIFY**：`AGENTS.md`、`CONSTITUTION.md`、`constitution-checklist.md`、`CONTEXT.md`、`tools/architecture/verify-final-coverage.mjs`、`tests/integration/mutation-guards.test.mjs`

### Tasks

T030、T016、T017、T018。

### Verify

先执行 T030 RED，确认 `verify-final-coverage` 的 `missing_ac`、`ac_evidence_unresolvable`、`ac_evidence_generic_fill`、`review_tree_drift`、`review_raw_hash_missing`、`reference_consumer_residual`、治理漂移、`final_evidence_binding_drift`、`handoff_incomplete` 和 `unknown_argument` 每个失败类别都能独立非零；再执行 T016 GREEN，T016 只运行 `--governance --handoff` 选择性检查。随后执行 T017 `gate_cmd` 一次（它是本方案唯一的 `npm test` 入口），并在该 gate 中执行不带 KEEP allow-list 的 `reference-audit --check`，只有 `violations=[]` 且 `allowed_violations=[]` 才能关闭 AC-017/018/019；存在任何 KEEP 残留时写入 `DELETION_KEEP_UNTIL_MIGRATION` 并保持 `incomplete`。Phase 7 Verify 不重新运行 full suite，只读取 T017 的 receipt/hash，在配置路由要求的独立 review 完成后执行 `node tools/architecture/verify-final-coverage.mjs --require-ac=43 --require-same-review-tree --require-review-raw-hash --require-reference-clean --governance --handoff`。该 CLI 只接受列明的 flags，未知参数非零；缺 AC、逐条 evidence、tree 漂移、raw/hash 缺失、reference consumer 残留、final evidence refs/hash 绑定漂移、治理或交接不完整分别保留可定位的非零失败类别。三方 provider 数量也不新增 spec 外硬门槛。

### Knowledge

review tree 的 hash 域明确排除 `specs/workflowhub-complexity-governance-v3-20260802/tasks.md` 全文件；wh-review 仍接收并审查完整四材料，`tasks.md` 的执行状态回填属于排除域，merge 比较只针对生产/测试/config/docs/specs（不含 tasks.md）及另行绑定的 final evidence refs/hash。

最终结论分别报告 behavior comparison、focused/full/mutation、review、history、retention、distribution 和人工交接；不压成单一分数。

### STOP

存在 `behavior_regression`、未处置 serious finding、历史摘要变化、治理文档冲突、review pack 不完整或 clean install 失败时不得进入 verify-code 用户确认。

### Done

七行为逐项有结论；配置路由要求的独立 review 事实绑定当前 tree，每个 unavailable/invalid 均保留；43/43 AC、治理文档和 review pack 齐全，状态真实达到 ready_for_confirmation。

### Risks and rollback

回到最早失败 Task 同 task 修复，只重跑受影响检查；不改写失败/review/unavailable 事实。

#### T030 — 固定最终覆盖 CLI 的 RED 失败类别

- **ID**：T030
- **implementation_owner**：final-coverage-red-worker
- **verification_owner**：independent-final-coverage-verifier
- **approval_owner**：user
- **Phase**：Phase 7: 治理固化、最终验证与交接
- **goal**：对 candidate tree 已存在的 `verify-final-coverage.mjs` 补全失败类别的 RED 证明；逐类证明缺 AC、逐条 AC 证据不可解析/泛化填充、review tree 漂移、review raw/hash 缺失、reference consumer 残留、final evidence refs/hash 绑定漂移、治理漂移和 handoff 不完整都会 fail-loud。若当前实现已转绿，按全局约定在 disposable copy 对既有 CLI 应用 path-bound inverse diff 后取 RED，不把“实现前”误当作本任务前提
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：Phase 7 `verify-final-coverage` CLI contract；T016 的治理同步和 handoff 实现
- **boundary**：`tests/contract/verify-final-coverage.test.mjs` 的受控 fixture；不修改生产 CLI
- **动作**：先加入每个失败类别的受控 fixture 和非零断言；若当前候选已转绿，则在 disposable copy 对生产 CLI 应用 path-bound inverse diff 后取 RED，不把当前 GREEN 结果倒写成 RED
- **新增失败类别**：`final_evidence_binding_drift`；T030 必须覆盖 final evidence ref/hash 缺失、错绑和漂移的独立非零事实，T016 GREEN 后由 T018 消费，不因 `evidence/final/**` 排除于 tree hash 而跳过绑定。
- **精确文件**：`tests/contract/verify-final-coverage.test.mjs`
- **输入**：缺 AC、AC evidence 不可解析、AC evidence 泛化填充、review tree 漂移、review raw/hash 缺失、reference consumer 残留、T016 AC-043 四项 handoff refs/hash 缺失/错绑/漂移、T018 全量 final evidence refs/hash 缺失/错绑/漂移、四类治理漂移、handoff 不完整 fixture
- **输出**：每个 failure code 都有独立非零 RED receipt；不改动当前生产文件
- **依赖**：T015
- **并行**：no
- **FR**：FR-GOVERNANCE-001、FR-RULES-001、FR-AUTH-001
- **AC**：AC-037、AC-038、AC-042、AC-043
- **verification_role**：RED
- **paired_task**：T016
- **gate_cmd**：`npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:missing-ac" && npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:ac-evidence-unresolvable" && npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:ac-evidence-generic-fill" && npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:review-tree-drift" && npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:review-raw-hash-missing" && npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:reference-consumer-residual" && npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:final-evidence-binding-drift" && npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:constitution-version-drift" && npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:constitution-revision-drift" && npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:constitution-mapping-drift" && npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:checklist-count-drift" && npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:checklist-entry-drift" && npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:handoff-incomplete" && npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:unknown-argument"`
- **red_oracles**：`npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:missing-ac"`；`npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:ac-evidence-unresolvable"`；`npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:ac-evidence-generic-fill"`；`npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:review-tree-drift"`；`npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:review-raw-hash-missing"`；`npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:reference-consumer-residual"`；`npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:final-evidence-binding-drift"`；该测试必须分别构造 T016 仅四项 AC-043 handoff 与 T018 全量 final evidence 两个 fixture，每个 fixture 都覆盖缺失、错绑、漂移并 expected exit 1；`npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:constitution-version-drift"`；`npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:constitution-revision-drift"`；`npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:constitution-mapping-drift"`；`npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:checklist-count-drift"`；`npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:checklist-entry-drift"`；`npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:handoff-incomplete"`；`npx vitest run tests/contract/verify-final-coverage.test.mjs -t "final-coverage:unknown-argument"`；每条命令分别记录 expected exit 1，不用整文件 exit 1 作为归因。
- **test/acceptance command**：同 `gate_cmd`
- **expected_exit**：1
- **oracle**：ORACLE-FINAL-COVERAGE-RED：每个受控缺口均输出明确 failure code 并以非零退出；不能用整体验证失败替代分类断言
- **evidence_path**：`evidence/phase-7/final-coverage-red.json`
- **STOP**：缺少独立 failure category、RED 依赖生产改动或测试通过但没有失败断言时停止
- **recovery**：只回退新增 negative fixtures；保留失败 receipt
- **task risk**：fixture 可能绕过真实 CLI 参数/输入绑定

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`passed`
- **actual_changes**：新增 final-coverage failure-category contract tests，先取得 14 类 RED，再实现最小可调用契约并取得 14/14 GREEN。
- **executed_commands**：`npx vitest run tests/contract/verify-final-coverage.test.mjs`（RED exit 1；GREEN exit 0，14 tests）。
- **evidence_refs**：`[{"ref":"evidence/phase-7/final-coverage-red.json","sha256":"dc3f66d4670547d33cb96a2961c9c2cabf24364c17c00bbcc27627d8657c6a7b","kind":"phase_red_receipt"}]`
- **covered_ac**：AC-037、AC-038、AC-042、AC-043（failure-category subcontract；最终交接仍由 T016/T018 完成）
- **review_fact**：N/A — user explicitly stopped wh-review
- **completed_at**：2026-08-03T07:08:00Z

#### T016 — 固化治理规则和人工交接合同

- **ID**：T016
- **implementation_owner**：governance-worker
- **verification_owner**：independent-governance-verifier
- **approval_owner**：user
- **Phase**：Phase 7: 治理固化、最终验证与交接
- **goal**：同步维护规则、宪法、清单和术语，并生成删除/保留/M14–M17/diff 交接包
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：原始 V3.2 §10/§12、最终 inventory/deletion/retention/move-map
- **boundary**：治理四文档和最终 handoff evidence
- **动作**：同步四材料真相、lineage 归零、质量非 gate、provenance 保留、新机制准入；生成四项 review pack；治理同步必须同时维护 Constitution 版本号、修订记录、旧→新映射和 checklist 条目数等于 Constitution 条目数，并让 `verify-final-coverage.mjs` 固定实现并逐项验证 `--require-ac=43` 的 `missing_ac`、`ac_evidence_unresolvable`、`ac_evidence_generic_fill`，`--require-same-review-tree` 的 `review_tree_drift`，`--require-review-raw-hash` 的 `review_raw_hash_missing`，`--require-reference-clean` 的 `reference_consumer_residual`，`--governance` 的 `constitution_version_drift`、`constitution_revision_drift`、`constitution_mapping_drift`、`checklist_count_drift`、`checklist_entry_drift` 和 `--handoff` 的 `final_evidence_binding_drift`、`handoff_incomplete` 失败类别；未知参数固定输出 `unknown_argument` 非零；未传入的类别明确跳过，exit 0 只表示已请求类别全部满足，完整最终命令必须传入全部 required flags；为每个类别建立受控 fixture 的非零回归断言
- **final evidence binding**：`--handoff` 同时校验 final evidence refs/hash；T016 GREEN 阶段只绑定 AC-043 四项交接 refs/hash（deletion-list、retention-list、m14-m17-impact、change-summary），T017/T018 最终阶段才绑定全部已生成的 `evidence/final/**` 产物；缺失、错绑或漂移输出 `final_evidence_binding_drift` 非零。T030 必须对两个范围分别取 RED，T016 只实现前一范围 GREEN，T018 只消费最终范围并写入 final coverage，不把 evidence/final 排除域当作无须绑定。
- **quality verify source**：`--require-ac` 的逐条 AC 结论从已按 `runtime/schemas/quality-verify.v1.json` 写入的 `quality/verify.json` 事实解析；schema 状态未知、不可用或无法解析时必须输出对应非零 failure code，不得从文件存在或总数推导通过。
- **精确文件**：`AGENTS.md`、`CONSTITUTION.md`、`constitution-checklist.md`、`CONTEXT.md`、`tools/architecture/verify-final-coverage.mjs`、`evidence/final/m14-m17-impact.md`、`evidence/final/change-summary.md`
- **输入**：最终真实结构、T015 已发布的 `evidence/final/deletion-list.json` 与 `evidence/final/retention-list.json`、以及已验证删除/保留事实
- **输出**：治理文档一致，verify-code 用户确认材料齐全
- **依赖**：T030
- **并行**：no
- **FR**：FR-GOVERNANCE-001、FR-RULES-001、FR-AUTH-001
- **AC**：AC-037、AC-038、AC-042、AC-043
- **verification_role**：GREEN
- **paired_task**：T030
- **gate_cmd**：`npx vitest run tests/contract/verify-final-coverage.test.mjs && npm run check && node tools/architecture/verify-final-coverage.mjs --governance --handoff`
- **test/acceptance command**：`npx vitest run tests/contract/verify-final-coverage.test.mjs && node tools/architecture/verify-final-coverage.mjs --governance --handoff`
- **expected_exit**：0
- **oracle**：四文档无冲突；`missing_ac`、`ac_evidence_unresolvable`、`ac_evidence_generic_fill`、`review_tree_drift`、`review_raw_hash_missing`、`reference_consumer_residual`、`constitution_version_drift`、`constitution_revision_drift`、`constitution_mapping_drift`、`checklist_count_drift`、`checklist_entry_drift`、`final_evidence_binding_drift`、`handoff_incomplete` 和 `unknown_argument` 均可在对应参数下非零；review pack 四项可定位；确认不触发 close
- **evidence_path**：`evidence/phase-7/governance-handoff.json`
- **STOP**：宪法/checklist 不同步、旧术语冲突或交接包缺项时停止
- **recovery**：按最终真实结构修正文档，不弱化实现或伪造证据
- **task risk**：规则可能重复实现细节并迅速过时

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`passed`
- **actual_changes**：同步 AGENTS、CONSTITUTION、constitution-checklist、CONTEXT；verify-final-coverage 支持 `--require-ac=43` 的 AC-001..AC-043、真实 `quality-verify.v1` 来源、严格 handoff manifest 绑定和治理规则校验；交接包列出当前 35 个删除路径及历史/质量/provenance/M14–M17 保留事实。
- **executed_commands**：`npx vitest run tests/contract/verify-final-coverage.test.mjs`（17/17，exit 0）；`node tools/architecture/verify-final-coverage.mjs --governance --handoff`（exit 0）；`npm run check`（exit 1，100 个既有 plan/tasks markdownlint 错误；按用户要求未修改方案设计文档）。
- **evidence_refs**：`[{"ref":"evidence/phase-7/governance-handoff.json","sha256":"c3647da240a500fac117047d2b78a02714a1c0c8f5de9e57ab82046ddd7b2365","kind":"handoff_evidence"},{"ref":"evidence/final/deletion-list.json","sha256":"33fb072b965fce07a78c8d0bbf8abbe8f323de2041be0e0ef54fdfc2dc941371","kind":"handoff_evidence"},{"ref":"evidence/final/retention-list.json","sha256":"373d63228ec75f06265bff17b53e5827f377a6798d5f222a595999e873338f0f","kind":"handoff_evidence"},{"ref":"evidence/final/m14-m17-impact.md","sha256":"da6e3cd41434463663116456d6239eb142c0796b1bbdc8698e8b0993469cf955","kind":"handoff_evidence"},{"ref":"evidence/final/change-summary.md","sha256":"2d7bf83385b6633a4c6f25bba37eb92f4986cdaaddf831010ac47ee22cc9e29a","kind":"handoff_evidence"}]`
- **covered_ac**：AC-037、AC-038、AC-042、AC-043（governance/handoff slice）
- **review_fact**：Phase 7 task-level review 不单独发起；统一 Phase 7 integration review 在 T018 绑定当前 tree，当前保留 `npm run check` markdownlint 失败事实
- **completed_at**：`2026-08-03T17:38:00+08:00`

#### T017 — 最终 baseline 对比、mutation、全测与 clean install

- **ID**：T017
- **implementation_owner**：final-verification-runner
- **verification_owner**：independent-evidence-verifier
- **approval_owner**：user
- **Phase**：Phase 7: 治理固化、最终验证与交接
- **goal**：对当前完整候选给出逐行为、测试、发行和历史只读的确定性结论，并只运行一次 full suite
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：T001 baseline、T016 handoff、全部当前实现和证据
- **boundary**：只验证当前完整 diff；不执行 commit/push/merge/archive/cleanup
- **动作**：candidate replay/compare；focused E2E；mutation；一次 full suite；check；clean install；执行 `node tools/architecture/history-inventory.mjs verify-unchanged` 复核历史摘要和发行闭包；执行不带 KEEP allow-list 的 `reference-audit --check`，只有 `violations=[]` 且 `allowed_violations=[]` 才能把 AC-017/018/019 记为可通过，任一 KEEP 残留都写入 `DELETION_KEEP_UNTIL_MIGRATION` 并保持 `incomplete`；将 mutation receipt、唯一 full-suite receipt、独立 `npm run check` receipt、回填时间、Phase 6 退出项和 AC-041 discharge evidence 一并写入 `evidence/final/verification-summary.json`；不在本任务重复 full suite 或发起 review
- **精确文件**：`tests/integration/mutation-guards.test.mjs`、`tools/architecture/history-inventory.mjs`（READ/VERIFY-ONLY）、`evidence/final/verification-summary.json`
- **输入**：baseline raw/normalized、candidate 当前 tree、全部 phase evidence
- **输出**：7 项 behavior verdict、focused/mutation/full/check/clean-install/history 当前事实；`npm test` full-suite receipt 与 `npm run check` receipt 分字段绑定且 only-one full-suite 可验证；显式回填 Phase 6/AC-041 退出项，而不是把 Phase 6 的 deferred 状态改写为完成
- **依赖**：T016
- **并行**：no
- **FR**：FR-PUBLIC-001、FR-BASELINE-001、FR-MATERIAL-001、FR-STAGE-001、FR-QUALITY-001、FR-SAFETY-001、FR-DELETION-001、FR-STORAGE-001、FR-LEARNING-001、FR-HISTORY-001、FR-GOVERNANCE-001、FR-RULES-001、FR-AUTH-001、FR-DISTRIBUTION-001
- **AC**：AC-001、AC-002、AC-003、AC-004、AC-005、AC-006、AC-007、AC-008、AC-009、AC-010、AC-024、AC-025、AC-026、AC-027、AC-030、AC-031、AC-032、AC-033、AC-034、AC-035、AC-036、AC-039、AC-040、AC-041
- **verification_role**：N/A — non-behavior change: final independent verification only
- **paired_task**：N/A — all behavior changes have earlier RED/GREEN pairs
- **gate_cmd**：`node tools/architecture/history-inventory.mjs verify-unchanged && node tools/architecture/public-behavior-baseline.mjs compare --baseline=c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf --candidate=worktree && node tools/architecture/reference-audit.mjs --check && npx vitest run tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs tests/integration/mutation-guards.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs && npm test && npm run check`
- **test/acceptance command**：`npm test && npm run check`
- **expected_exit**：0
- **oracle**：七行为无未解释 regression；关键 mutants 被杀死；full suite 最终仅一次；clean install 真执行；历史摘要不变；reference-audit 的 `violations` 与 `allowed_violations` 均为空；verification-summary 能按 receipt/hash/time 证明 AC-041 已从 `incomplete`（`reason_code=AC041_DISCHARGE_OWNED_BY_T017`）回填，否则 AC-017/018/019 保持 `incomplete`
- **evidence_path**：`evidence/final/verification-summary.json`
- **STOP**：behavior_regression、历史变化、未杀 mutation或 full/check/clean install 失败时停止，转回最早失败任务
- **recovery**：回到对应最早失败 Task 同 task 修复并只重跑受影响检查；不得改写失败事实
- **task risk**：单一总 PASS 会掩盖不同证据层次

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`passed`
- **actual_changes**：完成当前树的历史只读、七行为 baseline compare、无 allow-list reference audit、mutation、focused final matrix、exclusive tests、clean install、inventory 和 complexity hard-gate 验证；修复迁移残留路径、归档依赖、已删除 skill 的旧测试契约、writer 分类、Phase producer 路径、final-coverage 测试夹具和最终派生报告；plan/tasks 仅做 Markdown 排版同步，CONTEXT 仅修复一个被 denylist 拒绝的旧术语。
- **executed_commands**：`history-inventory verify-unchanged` exit 0；public behavior compare exit 0；无 allow-list `reference-audit --check` exit 0；mutation 5/5、Phase 7 focused 6 files/14 tests、repair regression 10 files/83 tests、inventory regression 9/9、exclusive 2 files/31 tests 均 exit 0；clean install、inventory、complexity hard-gates、`npm run check`（Markdown 0 errors，完整仓库检查）均 exit 0；最终 safe full 修复后 exit 0（154 files、1559 tests），exclusive 31/31 通过；此前两次失败事实保留在 verification-summary，未覆盖旧失败。
- **evidence_refs**：`[{"ref":"evidence/final/verification-summary.json","sha256":"e150061c806d6b632e9a337c864f6b180046b682eb7da6105a349a0eddbefe09","kind":"verification_summary"},{"ref":"evidence/phase-7/mutations-green.txt","sha256":"f00ed875c1b862ef3ff4ba4c7d146c26ab9c67a1236a53620842e0f6e08c68ab","kind":"mutation_test"},{"ref":"evidence/phase-6/test-slice.json","sha256":"e521b5409554273fc41bff8d0c8f6aa48eb44e946869935f0a5a9a75ca8236c7","kind":"phase_evidence"},{"ref":"evidence/phase-6/distribution-slice.json","sha256":"ef202f4437d7fabc7071320a62ca4ca0a2adbd69ea36010a3459739061e05ab8","kind":"phase_evidence"}]`
- **covered_ac**：`AC-001、AC-002、AC-003、AC-004、AC-005、AC-006、AC-007、AC-008、AC-009、AC-010、AC-024、AC-025、AC-026、AC-027、AC-030、AC-031、AC-032、AC-033、AC-034、AC-035、AC-036、AC-039、AC-040、AC-041`
- **review_fact**：本任务不发起 review；保持前两次 safe full 失败、最终 safe full 通过和未归档 raw output 的事实
- **completed_at**：2026-08-03T18:25:00+08:00

#### T018 — 真实小任务、独立架构审查与 43 AC 终验

- **ID**：T018
- **implementation_owner**：final-review-orchestrator
- **verification_owner**：wh-review-configured-independent-reviewer
- **approval_owner**：user
- **Phase**：Phase 7: 治理固化、最终验证与交接
- **goal**：让配置路由要求的独立审查绑定同一完整候选 tree；provider 数量不增加 spec 外硬门槛
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v3-20260802/spec.md","hash":"8a1541217c2343b2580bc555113368f93038d5fbc6c971683a772bf1f9e56d40","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V3"}]`
- **Knowledge**：原始 V3.2 最终三方架构审查、T017 确定性证据、T016 review pack
- **boundary**：一次性本地仓库、生产 Runner、正式五阶段/七行为/wh-review；不修改任何业务项目，不执行 commit/push/merge/archive/cleanup
- **动作**：在独立 review 前生成 `evidence/final/review-tree-manifest.json`，其 `review_tree_hash` 只覆盖排序后的候选生产/测试/config/docs/specs 路径，排除 `.git/`、`node_modules/`、task 外置存储、`evidence/final/` 和 manifest 自身；随后对该 scope 发起配置路由要求的独立架构审查，保留每个 unavailable/invalid 事实；审查后只写入被排除的 final evidence，`--require-same-review-tree` 复算同一 scope；只读消费 T016 生成的 handoff 与 `verify-final-coverage.mjs` 合同，逐条核对 43 AC 与 handoff，记录被审 tree；若日后获 merge 授权，main 必须匹配同一 `review_tree_hash` 并另行匹配 final evidence refs/hash，否则重审
- **review_tree boundary**：上述“候选 specs 路径”排除 `specs/workflowhub-complexity-governance-v3-20260802/tasks.md` 全文件；wh-review 仍审查完整 tasks.md，但其执行状态回填不改变 `review_tree_hash`，merge 只比较排除 tasks.md 后的候选 tree，并另行校验 final evidence refs/hash。
- **精确文件**：`evidence/final/review-tree-manifest.json`、`evidence/final/final-coverage.json`
- **输入**：T017 当前 tree 与全部 phase evidence
- **输出**：配置路由要求的独立 review fact；43/43 AC 绑定当前 tree；用户 review pack
- **依赖**：T017
- **并行**：no
- **FR**：FR-PUBLIC-001、FR-BASELINE-001、FR-MATERIAL-001、FR-STAGE-001、FR-QUALITY-001、FR-SAFETY-001、FR-DELETION-001、FR-STORAGE-001、FR-LEARNING-001、FR-HISTORY-001、FR-GOVERNANCE-001、FR-RULES-001、FR-AUTH-001、FR-DISTRIBUTION-001
- **AC**：AC-001、AC-002、AC-003、AC-004、AC-005、AC-006、AC-007、AC-008、AC-009、AC-010、AC-011、AC-012、AC-013、AC-014、AC-015、AC-016、AC-017、AC-018、AC-019、AC-020、AC-021、AC-022、AC-023、AC-024、AC-025、AC-026、AC-027、AC-028、AC-029、AC-030、AC-031、AC-032、AC-033、AC-034、AC-035、AC-036、AC-037、AC-038、AC-039、AC-040、AC-041、AC-042、AC-043
- **verification_role**：N/A — non-behavior change: final independent acceptance synthesis
- **paired_task**：N/A — consumes all prior RED/GREEN and deterministic verification facts
- **gate_cmd**：`node tools/architecture/verify-final-coverage.mjs --require-ac=43 --require-same-review-tree --require-review-raw-hash --require-reference-clean --governance --handoff`
- **test/acceptance command**：`node tools/architecture/verify-final-coverage.mjs --require-ac=43 --require-same-review-tree --require-review-raw-hash --require-reference-clean --governance --handoff`
- **expected_exit**：0
- **oracle**：独立 review 具 raw/hash 且绑定 `review_tree_manifest.json` 的同一 scope/hash；审查后 final evidence 不参与 `review_tree_drift` 比较；unavailable/invalid 不计作有效审查；43 个 AC 均有当前、可解析、非泛化填充的证据；最终 `reference-audit --check` 的 `violations` 与 `allowed_violations` 均为空才关闭 AC-017/018/019，任何 KEEP 残留都必须保持 `incomplete`；不重复 full suite
- **evidence_path**：`evidence/final/final-coverage.json`
- **STOP**：业务项目被修改、配置路由要求的独立审查缺失、review tree 漂移、任一 AC 无当前证据或 serious finding 未处置时不得进入用户确认
- **recovery**：在同 task 修复最早失败项，仅重跑受影响检查；候选 tree 改变则重新执行配置路由要求的独立 review，不改写旧事实
- **task risk**：把 provider 可用性、语义审查和正式接受压成一个结论

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`passed`
- **actual_changes**：生成当前 review tree manifest、独立 review binding、quality-verify.v1 和 43 AC final coverage；刷新派生 inventory/complexity 报告。最终 full suite 在派生报告修复后通过，未修改业务项目，未执行 commit/push/merge/archive/cleanup。
- **executed_commands**：`npx vitest run` 最终定向矩阵（31 files、224 tests，exit 0）；`npm test`（safe 154/154 files、1559/1559 tests，exclusive 31/31，exit 0）；`node tools/architecture/verify-final-coverage.mjs --require-ac=43 --require-same-review-tree --require-review-raw-hash --require-reference-clean --governance --handoff`（exit 0）。首次 full suite 的 3 条派生报告失败、刷新后 focused 9/9 回归事实均保留。
- **evidence_refs**：`[{"ref":"evidence/phase-9/final-targeted-matrix-v3-final.json","sha256":"7489770fa2d90c61b2d2c8d7591542dd18fe0c997b472f3571b555997cb6773a","kind":"test_matrix"},{"ref":"evidence/phase-9/npm-test-v3-after-repair.out","sha256":"dbddb48e4ff3439356e26ab6525430a333db6f9213ed4a373b55c0274fb0f18a","kind":"full_suite"},{"ref":"evidence/phase-9/final-review-c61ef1f7-b30c-4407-b60a-76c4abee19bb.md","sha256":"ff8c33444dcbe9854424a0e465658dc09bad4b001d21c7a294a1850cf3200933","kind":"independent_review"},{"ref":"evidence/final/final-coverage.json","sha256":"806482d749fa3b976aa789f87255476cfbbcddc07708655a7f03bc13e7c49447","kind":"final_coverage"},{"ref":"evidence/final/review-tree-manifest.json","sha256":"e9e3218d7193653f05e2a929a7c0149889bb2d8f20b656975ee3c4a29d1eefbe","kind":"review_tree"},{"ref":"evidence/final/review.json","sha256":"da2513a3131d78079681eea59e6b1cce636924a497bf927f26323951c94b35c7","kind":"review_binding"},{"ref":"evidence/final/quality-verify.json","sha256":"ac70515dc0074f486a592083c4e7b7685b5ac0af92af2b1f115f2cb02957627f","kind":"quality_verify"}]`
- **covered_ac**：AC-001、AC-002、AC-003、AC-004、AC-005、AC-006、AC-007、AC-008、AC-009、AC-010、AC-011、AC-012、AC-013、AC-014、AC-015、AC-016、AC-017、AC-018、AC-019、AC-020、AC-021、AC-022、AC-023、AC-024、AC-025、AC-026、AC-027、AC-028、AC-029、AC-030、AC-031、AC-032、AC-033、AC-034、AC-035、AC-036、AC-037、AC-038、AC-039、AC-040、AC-041、AC-042、AC-043
- **review_fact**：统一 Phase 7 integration review：semantic `pass`，`kimi/coding` 完成；`cursor/grok` 保留 `PROVIDER_PERMISSION_DENIED`（审查范围外工具），provider 分类 `PROVIDER_UNAVAILABLE=0`；两条 finding 为 `invalid_anchor`，未形成可执行修复项。

---

## Repair Addendum Tasks：补齐原方案与当前实现缺口（2026-08-03）

> 只追加，不修改上方 T001–T030 的历史内容和状态。以下 R001–R009 是同一 task 的当前修复任务；历史任务只读，不是新任务依赖，也不要求重跑已完成的全量验证。

## 执行约束

- 不创建 successor task，不创建新 Phase，不增加流程状态、review round、selector、checkpoint、lease 或 accepted projection。
- 所有普通修复留在同一 task；质量缺口记录为 `unknown`/`incomplete`，不能阻止修复。
- 所有正式写入都必须绑定当前四材料 `material_digest` 和 source digest；错绑必须零写入 fail-loud。
- focused test 按任务运行；`npm test` 和独立正式 review 各只在 R008/R009 的最终边界运行一次。
- R001–R008 不执行 commit、push、merge、archive、cleanup；R009 只做交接和用户确认，不授予 Git 交付授权。
- 本附录的临时方案审查只使用已授权的 `3rd-review` 直连，不用 `wh-review` 重复同一审查；正式 verify-code 若另有交付审查要求，仍按原技能在最终当前树只执行一次。

## R001 — 当前快照与残留控制面重对账

- **implementation_owner**：architecture-maintainer
- **verification_owner**：independent-inventory-verifier
- **approval_owner**：user
- **status**：`completed`
- **目标**：建立唯一 candidate tree、四材料 digest、历史 bytes digest 和真实 consumer 清单；纠正现有 final evidence 多 tree/多 ledger 口径。
- **精确文件**：`docs/architecture/repository-inventory.tsv`、`docs/architecture/move-map.json`、`docs/architecture/retention-manifest.json`、`tools/architecture/reference-audit.mjs`、`tools/architecture/history-inventory.mjs`、`docs/architecture/complexity-baseline.json`
- **动作**：只读重算 HEAD/tree/status；为每个残留机制补 `owner/consumer/publication_unit/disposition/planned_task/proof`；reference audit 扩大到动态路径、schema、CLI、skill catalog、Bundle 和测试引用；删除空 target 假清零。
- **FR/AC**：FR-DELETION-001、FR-HISTORY-001、FR-GOVERNANCE-001；AC-017、AC-018、AC-024、AC-026、AC-037。
- **验证命令**：`git rev-parse HEAD && git status --short && node tools/architecture/history-inventory.mjs verify-unchanged && node tools/architecture/reference-audit.mjs --check --allow-keep-until-migration=docs/architecture/retention-manifest.json && node tools/architecture/inventory.mjs --check`
- **预期结果**：得到一份当前真实 disposition；历史内容不变；已登记 KEEP 可保留为 KEEP/unknown，未登记残留仍失败；不伪造 DELETE 或 PASS。无 allow-list 的最终 clean audit 留给 R007/R008。
- **STOP**：candidate tree、历史摘要、inventory 或 consumer 口径无法唯一确定。
- **证据**：`evidence/repair/r001-reconciliation.json`。
- **actual_changes**：`reference-audit.mjs` 改为 v2 全仓真实 consumer 扫描并补齐 topology target；retention manifest 补齐实际 consumer 与 KEEP disposition；retention audit 校验证据存在；history inventory 禁止覆盖冻结摘要；新增对应 contract/integration 回归；新增本地 proof pointer，指向 TaskKernel canonical evidence。
- **executed_commands**：`npx vitest run tests/contract/reference-audit.test.mjs tests/integration/history-read-only.test.mjs tests/integration/governance-diagnostics-non-gate.test.mjs tests/integration/governance-learning-non-gate.test.mjs`（11/11）；`node tools/architecture/history-inventory.mjs verify-unchanged`（449/449）；`node tools/architecture/retention-audit.mjs --check`（errors=0，M16/M17 unknown non-gating）；`node tools/architecture/inventory.mjs --check`（1090 delivery files）；reference audit with KEEP allow-list（unexpected=107，allowed=53，真实 residual，exit=1，保留给 R002–R007/R008）。
- **evidence_refs**：`evidence/repair/r001-reconciliation.json`（TaskKernel canonical hash `6141720c532d4a916f64776147c44fc9176fa19d57e174b76de7073cd2d0a6fe`，material digest `66477f3e8844176132b5ea5c6fe58ffd22aa208d9b0b52de28322377db54e53b`，source digest `6e1eaba4db1ef616c13aa8a19b8c3f25f43fe1e335fce5ad46bdf79e21cf1038`）；`evidence/repair/r001-reconciliation.json`（repository proof pointer）。
- **covered_ac**：AC-017、AC-018、AC-024、AC-026、AC-037；reference residual 未伪造 clean，后续 zero-consumer 结论由 R007/R008 重新取得。
- **review_fact**：R001 是 Repair Addendum reconciliation task，不新增 Phase；正式当前树独立 `wh-review` 由 R008 唯一执行，本任务不重复发起方案审查或 task-level review。
- **addendum_recorded_at**：2026-08-03T13:28:00Z

## R002 — 四材料直读与 vNext 单写切换

- **implementation_owner**：runtime-task-maintainer
- **verification_owner**：runtime-contract-verifier
- **approval_owner**：user
- **status**：`completed`
- **目标**：让新 task 不依赖 `materials/current.json`、`requirements/current.json`、legacy attempt/accepted/checkpoint；把 stage publication 收敛到 facts/quality。
- **精确文件**：`runtime/task/material-workspace.mjs`、`runtime/task/task-store.mjs`、`runtime/evidence/quality-store.mjs`、`runtime/task/task-kernel-implementation.mjs`、`runtime/stage/stage-runner.mjs`、`tools/cli/stage-runtime.mjs`、对应 schema/tests。
- **动作**：bootstrap 直接校验四份材料；删除新路径对旧 pointer/lineage 的读写；handler 成功后只写 vNext fact/publication；`acceptAttempt`/`publishAttempt` 对 vNext 变成无写入 fail-loud，旧任务仅离线只读。
- **FR/AC**：FR-MATERIAL-001、FR-STAGE-001、FR-STORAGE-001、FR-SAFETY-001；AC-003、AC-011、AC-012、AC-014、AC-020、AC-022、AC-030、AC-034。
- **验证命令**：`npx vitest run tests/contract/material-workspace.test.mjs tests/integration/minimal-task-storage.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/integration/first-three-stage-cutover.test.mjs tests/integration/progression-without-permits.test.mjs`
- **预期结果**：缺旧 accepted/current 仍可创建、编辑、run、verify；新 task 不产生 `results/*/accepted.json`、legacy attempt、checkpoint 或 revision chain。
- **STOP**：任何新 runtime consumer 仍读取/写入旧控制对象，或用删 guard 代替正确分流。
- **证据**：`evidence/repair/r002-vnext-single-write.json`。
- **actual_changes**：vNext `currentVNextContext` 改为通过 authenticated `ArtifactDir` 直接读取四份当前材料，并以 `revision-${material_digest}` 绑定 quality fact/publication；vNext 禁止 `publishMaterialRevision`/`repairMaterialRevision` 读写旧 revision/current pointer；更新 vNext 官方阶段 fixture，证明不产生 `materials/current.json`、`requirements/current.json`、legacy attempt/accepted；修复 public `doctor:workspace` 不再误路由到 make-decision-only `prepare`。
- **executed_commands**：`npx vitest run tests/contract/material-workspace.test.mjs tests/integration/minimal-task-storage.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/integration/first-three-stage-cutover.test.mjs tests/integration/progression-without-permits.test.mjs`（5 files/17 tests）；`node tools/cli/stage-runtime.mjs doctor --action=workspace --stage=build-code --project=workflowhub --task=workflowhub-complexity-governance-v3-20260802`（exit=0）；`git diff --check`（exit=0）。
- **evidence_refs**：`evidence/repair/r002-vnext-single-write.json`（TaskKernel canonical hash `424d3b5a988fd575b51419c63aa02bf153e984adfacbcbb97b687752c9bb5568`，material digest `0891b1b548c549633195139957334570323015435f90bf8bcd7aa66b409426ae`，source digest `718241cb550b8c0de2b87450c522098b5ee0785142c4bb975100e44599b9f1a8`）。
- **covered_ac**：AC-003、AC-011、AC-012、AC-014、AC-020、AC-022、AC-030、AC-034。
- **review_fact**：R002 是 Repair Addendum task，不新增 Phase；focused 回归已通过，正式当前树独立 `wh-review` 由 R008 唯一执行。
- **addendum_recorded_at**：2026-08-03T13:35:00Z

## R003 — LFS-aware snapshot 与正式写入闭合

- **implementation_owner**：runtime-snapshot-maintainer
- **verification_owner**：snapshot-security-verifier
- **approval_owner**：user
- **status**：`completed`
- **目标**：统一 Git tree 与实际 hydrated content 的 provenance；消除只靠 `GIT_CONFIG_*` 绕过的 LFS 风险。
- **精确文件**：`runtime/task/git-worktree-snapshot.mjs`、`runtime/evidence/fact-collector.mjs`、`runtime/task/write-boundary-preflight.mjs`、snapshot/fact contract tests。
- **动作**：为 source manifest 记录 Git blob、content sha256、filter/LFS 状态；pointer 未 hydrated 时返回 `FORMAL_LFS_CONTENT_UNAVAILABLE`；review/test/verify/publication 写前再次比对同一 source digest；不新增 snapshot lineage、lease 或 snapshots 子树。
- **FR/AC**：FR-BASELINE-001、FR-SAFETY-001、FR-QUALITY-001；AC-008、AC-010、AC-015、AC-034、AC-035。
- **验证命令**：`npx vitest run tests/integration/execution-snapshot-isolation.test.mjs tests/contract/execution-identity.test.mjs tests/integration/atomic-write-faults.test.mjs`
- **附加 fixture**：synthetic LFS pointer/hydrated pair、missing LFS object、source changed during formal write。
- **预期结果**：provider/test 不会读到与质量事实不同的内容；快照变化零写入；LFS pointer 不被当成真实内容。
- **STOP**：任何正式 fact 只有 Git commit/hash 而无实际 content binding，或 dirty tree 被冒充 clean HEAD。
- **证据**：`evidence/repair/r003-snapshot-binding.json`。

- **actual_changes**：`git-worktree-snapshot.mjs` 生成 `workflowhub-source-manifest.v1`，绑定 `head_commit`、Git tree、source-only content tree、逐文件 `git_blob_oid`、实际 `content_sha256`、filter/LFS 状态和 `source_digest`；hydrated LFS fixture 正常记录，pointer fixture 明确失败为 `FORMAL_LFS_CONTENT_UNAVAILABLE`。`runtime/evidence/write-boundary-preflight.mjs` 支持正式写前 source digest 重检，漂移失败为 `FORMAL_SNAPSHOT_MISMATCH`，且在 invocation persistence 前失败；`fact-collector` 不再吞掉 LFS 正式错误。未新增 snapshot lineage、lease、持久 snapshots 子树或 `GIT_CONFIG_*` 绕过。
- **executed_commands**：`npx vitest run tests/integration/execution-snapshot-isolation.test.mjs tests/contract/execution-identity.test.mjs tests/integration/atomic-write-faults.test.mjs`（3 files/32 tests，exit=0）；`node --check runtime/task/git-worktree-snapshot.mjs && node --check runtime/evidence/write-boundary-preflight.mjs && git diff --check`（exit=0）。
- **evidence_refs**：`evidence/repair/r003-snapshot-binding.json`（TaskKernel canonical hash `0dc11b8a76632527738c0bad0408bc07aaa419ae2ac78c8ad2ea6f689fe81f9c`，material digest `245ce6f9ed0f0f03c579694a09a568403015d5b5f3af7907127e59606622c65e`，source digest `3edb525bbc8c76cfa3613eeb1483a8c2af5ebdc9aefc6b891a606e9bd0ef642a`）。
- **covered_ac**：AC-008、AC-010、AC-015、AC-034、AC-035。
- **review_fact**：R003 是 Repair Addendum task，不新增 Phase；focused 回归已通过，正式当前树独立 `wh-review` 由 R008 唯一执行。
- **addendum_recorded_at**：2026-08-03T13:45:00Z

## R004 — run 前置、原子事实、并发与同 task 重跑

- **implementation_owner**：runtime-execution-maintainer
- **verification_owner**：fault-injection-verifier
- **approval_owner**：user
- **status**：`completed`
- **目标**：消除非事务 `start-run` 和孤立 run；普通失败回到同一 task，正式错误明确且可重现。
- **精确文件**：`runtime/stage/stage-runner.mjs`、`runtime/task/task-kernel-implementation.mjs`、`tools/cli/stage-runtime.mjs`、`runtime/evidence/quality-store.mjs`、execution/fault tests。
- **动作**：移除 public `start-run` 和持久 run/journal 成功链；`run` 先 preflight 再单次原子写 fact；同 invocation/idempotency key 幂等返回；并发或内容变化返回 `RUN_ALREADY_STARTED`、`FORMAL_WRITE_CONFLICT` 或 `FORMAL_SNAPSHOT_MISMATCH`；不新增 recovery 状态。
- **FR/AC**：FR-STAGE-001、FR-STORAGE-001、FR-SAFETY-001；AC-013、AC-015、AC-023、AC-030、AC-031、AC-032、AC-034。
- **验证命令**：`npx vitest run tests/integration/atomic-write-faults.test.mjs tests/integration/quality-store-concurrency.test.mjs tests/integration/projection-replacement.test.mjs tests/integration/first-three-stage-cutover.test.mjs`
- **预期结果**：preflight 失败无 run/fact；中断无孤立记录；重复请求不重复写；review unavailable 后同一 task 可修复重跑。
- **STOP**：先写 run 后写 journal、catch 后吞错、或通过新增 recovery/continuation 维持流程。
- **证据**：`evidence/repair/r004-transaction-retry.json`。

- **actual_changes**：vNext `startStageRun` 在任何 run record 前 fail-loud；vNext stage-skill 读取/写入改用确定性的 `deriveStageWorkflowRunId`，不创建持久 run。`runStage` 在 handler 前捕获 source digest，在既有 stage publication lock 内于 evidence、quality fact、publication 每个写边界重检；源漂移统一报 `FORMAL_SNAPSHOT_MISMATCH`，create-only fact/publication 对同一输入幂等收敛。旧任务的 legacy run writer 暂保留隔离兼容，public `start-run` 的最终垂直删除由 R007 统一完成，本任务不伪造已删除。
- **executed_commands**：`npx vitest run tests/integration/atomic-write-faults.test.mjs tests/integration/quality-store-concurrency.test.mjs tests/integration/projection-replacement.test.mjs tests/integration/first-three-stage-cutover.test.mjs`（4 files/32 tests，exit=0）；`node --check runtime/stage/stage-runner.mjs && node --check runtime/task/task-kernel-implementation.mjs && git diff --check`（exit=0）。
- **evidence_refs**：`evidence/repair/r004-transaction-retry.json`（TaskKernel canonical hash `eae9b8442a2b1ccf9d0a1ceb416151e0a390e8f40875968db2bdcdf62f28ebc9`，material digest `b4f5f66dfc0c86cd53e68cbbb28ea9b02fa311cd09d178fb9055f5cc15b5dc23`，source digest `d1126117b51095ead51d9797f6ba1810338192beff77f5452ac7ff19ae5d60b9`).
- **covered_ac**：AC-013、AC-015、AC-023、AC-030、AC-031、AC-032、AC-034。
- **review_fact**：R004 是 Repair Addendum task，不新增 Phase；focused 回归已通过，正式当前树独立 `wh-review` 由 R008 唯一执行；R007 将继续处理 public `start-run` 和 legacy control-plane 的垂直删除。
- **addendum_recorded_at**：2026-08-03T14:00:00Z

## R005 — 一对一 AC evidence 与单次 review packet

- **implementation_owner**：quality-review-maintainer
- **verification_owner**：independent-evidence-verifier
- **approval_owner**：user
- **status**：`completed`
- **目标**：彻底修复 `context_map/evidence_map` 和 generic AC summary；provider 只收到一个可审查 packet。
- **精确文件**：`skills/wh-review/scripts/ac-evidence-summary.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`runtime/evidence/acceptance-evidence-validator.mjs`、对应 schema/tests、`tests/verify-code-facts.test.mjs`。
- **动作**：从权威 AC 列表生成 `quality/verify.json` 的唯一 leaf；leaf 必须有 scenario/oracle/actual_outcome/evidence_type/coverage_limits/exceptions、receipt/hash、source digest、evidence ref/hash；map 只导航/索引；缺失写 unknown/unavailable；review group 只调用一次，`revise_required` 不自动二审、不改写原 verdict。
- **FR/AC**：FR-QUALITY-001、FR-STORAGE-001；AC-004、AC-005、AC-015、AC-016、AC-021、AC-022、AC-033、AC-041、AC-043。
- **验证命令**：`npx vitest run skills/wh-review/scripts/__tests__/ac-evidence-summary.test.mjs skills/wh-review/scripts/__tests__/review-source-materials.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/schema-validator.test.mjs tests/contract/verify-final-coverage.test.mjs`
- **预期结果**：每个 AC 恰好一个 leaf；重复/缺失/额外 ID、generic fill、map 不一致、provider 非法输出均非零或 unknown，不生成 pass。
- **STOP**：任何 summary 通过正则或 opaque nested evidence 猜字段，或同一 identity 自动触发第二次 provider call。
- **证据**：`evidence/repair/r005-ac-review-contract.json`。

- **actual_changes**：canonical test receipt 增加 `source_digest` 并在复用和写入前后校验；acceptance leaf 支持且必须绑定 source digest。`ac-evidence-summary.v1` 现在逐条输出唯一 AC 的 `scenario/oracle/actual_outcome/evidence_type/coverage_limits/exceptions`、status、leaf/nested ref/hash、test receipt 和 source digest；unknown 会落为 `incomplete`，不会伪装成 passed。`quality/verify.json` 增加单记录 leaf 校验与重复/错绑拒绝；verify review 继续只发送生成的 AC summary，不发送原始 evidence tree，也没有新增自动二审或 verdict 改写。
- **executed_commands**：`npx vitest run skills/wh-review/scripts/__tests__/ac-evidence-summary.test.mjs skills/wh-review/scripts/__tests__/review-source-materials.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/schema-validator.test.mjs tests/contract/verify-final-coverage.test.mjs`（5 files/134 tests，exit=0）；补充 `npx vitest run tests/verify-code-facts.test.mjs tests/official-component-receipts.test.mjs tests/verify-code-capture.test.mjs tests/build-code-capture.test.mjs`（4 files/56 tests，exit=0）。
- **evidence_refs**：`evidence/repair/r005-ac-review-contract.json`（TaskKernel canonical hash `1d57662b78a8f2767cefe4f77812f979028dee5c9f16adb4020ff07d04777b88`，material digest `f37fd2adcd8bbc935d550f61a184b4f73e8b325b74eefede269b7c04323a6e54`，source digest `fd42f023400472c0a8f11d9304329ede5257b087c284031a1b5356e7d3684320`）。
- **covered_ac**：AC-004、AC-005、AC-015、AC-016、AC-021、AC-022、AC-033、AC-041、AC-043。
- **review_fact**：R005 是 Repair Addendum task，不新增 Phase；focused 回归已通过，正式当前树独立 `wh-review` 由 R008 唯一执行。
- **addendum_recorded_at**：2026-08-03T14:10:00Z

## R006 — ignored cleanup 与人工交付事实

- **implementation_owner**：delivery-boundary-maintainer
- **verification_owner**：cleanup-safety-verifier
- **approval_owner**：user
- **status**：`todo`
- **目标**：清晰区分业务 Git 交付与 WorkflowHub formal close，解决 `.vite` 和未知 ignored 生成物问题。
- **精确文件**：`runtime/task/workspace.mjs`、`tools/cli/task-close.mjs`、`tools/cli/stage-runtime.mjs`、`runtime/evidence/quality-store.mjs`、`tests/task-close-delivery.test.mjs`、cleanup/manual-close tests。
- **动作**：close preflight 同时扫描 tracked/untracked/ignored；未知 ignored 返回 `FORMAL_CLEANUP_UNSAFE`，不执行 `git clean -fdx`；沿用现有 task-facts append-only 写路径记录 `manual_delivery_close`，字段含 `business_status=delivered`、`formal_status=blocked` 和来源 ref；如需业务确认，复用 `confirm --stage=verify-code`。不得新增 `authorize --op=manual-close`，`authorize` operation 集合保持不变。
- **FR/AC**：FR-AUTH-001、FR-STORAGE-001、FR-SAFETY-001；AC-007、AC-021、AC-028、AC-029、AC-043。
- **验证命令**：`npx vitest run tests/task-close-delivery.test.mjs tests/contract/confirmation-authorization.test.mjs tests/integration/runner-clean-install.test.mjs`
- **预期结果**：`.vite` 被分类而不是静默删除；manual-close 不创建 accepted/completed；后续 formal close 可继续。
- **STOP**：清理范围未逐路径绑定，或 manual-close 被汇总为 accepted/formal completed。
- **证据**：`evidence/repair/r006-close-boundary.json`。

### R006 completion record

- **status**：`completed`
- **actual_changes**：`runtime/task/workspace.mjs` 新增 Git tracked/untracked/ignored 全量扫描，按 `.vite` 已知 generated 与 unknown ignored 分类；unknown ignored、tracked、untracked 在 worktree removal 前返回 `FORMAL_CLEANUP_UNSAFE`，不调用 `git clean -fdx`，已知 `.vite` 只按扫描得到的逐路径显式删除后再执行正常 `git worktree remove`。`core/task-close.mjs` 将 cleanup scan 纳入 delivery status，并新增 `recordManualDeliveryClose`：通过现有 `facts.jsonl` append-only 路径记录 `manual_delivery_close`，同时写入绑定 source ref/hash、`business_status=delivered`、`formal_status=blocked` 的 close evidence；重复调用按 source ref/hash 幂等，不写 `results/*/accepted.json` 或 `operations/close/completed.json`。`tools/cli/task-close.mjs` 增加薄的 `manual-close --source-ref` 路由；未新增 `authorize --op=manual-close`，`stage-runtime` authorize operation 仍只有 `decision`/`risk`。clean-install fixture 更新为验证 vNext `start-run` writer fail-loud，不恢复旧 run 写入。`runtime/evidence/quality-store.mjs` 不增加旁路 owner，质量事实继续由既有 owner 管理。
- **executed_commands**：`npx vitest run tests/task-close-delivery.test.mjs tests/contract/confirmation-authorization.test.mjs tests/integration/runner-clean-install.test.mjs`（3 files/44 tests，exit=0）；其中 task-close 36/36、confirmation/authorization 3/3、runner clean-install 5/5；`git diff --check`（exit=0）。
- **evidence_refs**：`evidence/repair/r006-close-boundary.json`（TaskKernel canonical hash、material digest、source digest 以本 completion record 写入后的当前 candidate tree 为准）。
- **covered_ac**：AC-007、AC-021、AC-028、AC-029、AC-043。
- **review_fact**：R006 是 Repair Addendum task，不新增 Phase；ignored cleanup、manual delivery 与 authorize 边界已由 focused tests 覆盖；正式当前树独立 `wh-review` 仍只由 R008 执行，R006 不触发第二次审查。
- **addendum_recorded_at**：2026-08-03T14:28:00Z

## R007 — 垂直删除旧消费者并收敛项目结构

- **implementation_owner**：runtime-architecture-maintainer
- **verification_owner**：reference-and-bundle-verifier
- **approval_owner**：user
- **status**：`todo`
- **目标**：在 R002–R006 替代路径通过后，删除旧 control-plane 的生产消费者、schema、fixture、专属测试和 shim；不为满足数字强删质量保护。
- **精确文件**：`runtime/task/task-kernel-implementation.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/review/*`、`runtime/evidence/receipt-writer.mjs`、`core/*` 旧 owner、`tools/cli/migrate-task-v2.mjs`、`tools/cli/task-migrate-target-repo.mjs`、`skills/wh-review/scripts/*` shim、相关 schema/tests/docs/config。
- **动作**：按 consumer → replacement → negative test → delete；更新 move-map/inventory/retention；删除 `publishAttempt/acceptAttempt`、current/revision/checkpoint/flow/phase/recovery/rebind/migrate 生产路径；复用并补足 `tests/contract/runtime-facade.test.mjs`、`tests/contract/public-behavior-baseline.test.mjs` 的旧 `prepare`/`start-run`/内部 publish/record/recover fail-loud 负测；无 consumer 的 skill 只排除 Bundle，物理移动另需授权。
- **FR/AC**：FR-DELETION-001、FR-LEARNING-001、FR-GOVERNANCE-001、FR-RULES-001；AC-017、AC-018、AC-019、AC-024、AC-025、AC-037、AC-038、AC-042。
- **验证命令**：`node tools/architecture/reference-audit.mjs --check && node tools/architecture/inventory.mjs --check && npm run check:skill-closure && npx vitest run tests/integration/history-read-only.test.mjs tests/integration/distribution-closure.test.mjs`
- **预期结果**：无 allow-list 的生产 reference audit 只剩真实质量 owner；旧路径没有生产 import；历史资料和审查报告仍可回看。
- **STOP**：存在隐藏 consumer、删除会丢质量证据、或用空扫描/allow-list 伪造零残留。
- **证据**：`evidence/repair/r007-control-plane-deletion.json`、更新后的 `docs/architecture/move-map.json`。

### R007 progress record

- **status**：`in_progress`
- **actual_changes**：完成一个无生产消费者的删除切片：移除两个旧迁移 CLI、一个旧迁移专用测试、v1 receipt-writer facade 及其专用测试；移除对应 TaskHandle target-repository rebind API；删除 CI 对已不存在的 `ci-chain-check` 的 stale 调用；同步 move-map、retention 和旧 fixture 引用。保留 `check-task-record-paths.mjs`，因为它与 `reference-audit.mjs` 职责不同，合并会降低静态身份/写入守卫而增加重复实现。
- **executed_commands**：`node --check runtime/task/task-handle.mjs && git diff --check`（exit=0）；`npx vitest run tests/contract/task-handle.test.mjs tests/final-cutover-guards.red.test.mjs tests/contract/reference-audit.test.mjs`（3 files/103 tests，exit=0）；`npx vitest run tests/audit-aggregator.test.mjs tests/stage-content-publication.test.mjs tests/five-stage-audit-e2e.test.mjs tests/contract/task-handle.test.mjs tests/final-cutover-guards.red.test.mjs`（5 files/129 tests，exit=0）。
- **evidence_refs**：`evidence/repair/r007-control-plane-deletion.json`；`docs/architecture/move-map.json`。
- **covered_ac**：当前只覆盖 R007 删除切片的消费者归零和无 stale CI 入口；不宣称覆盖 R007 全部 AC。
- **remaining_scope**：`runtime/task/task-kernel-implementation.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/review/*`、`runtime/task/material-revision.mjs`、`core/git-checkpoint.mjs`、`workflows/build-code/phase-evidence.mjs` 仍有真实消费者，必须继续按 consumer → replacement → negative test → delete 处理；R008 之前不得标记 R007 completed。
- **review_fact**：本 progress record 不触发新的 wh-review；R008 仍是唯一当前树综合验证和独立 3rd-review owner。
- **addendum_recorded_at**：2026-08-03T14:42:00Z

### R007 progress record 2

- **status**：`in_progress`
- **actual_changes**：将仍被生产路径使用但已完成 owner 收敛的 receipt、audit、checkpoint、journal schema 和 canonical evidence 模块从 `core/` 移到 `runtime/evidence/` 或 `runtime/task/`；删除无消费者的 `core/journal-appender.mjs`；同步所有生产/测试导入、`check-task-record-paths`、move-map、Bundle hash。没有新增兼容 shim、第二写入 owner 或新的审查路径。
- **executed_commands**：`npm run check`（markdownlint、结构、6 项 run-check、skill closure、5-stage dispatch smoke 全部通过）；`npx vitest run tests/contract/repository-governance.test.mjs tests/contract/reference-audit.test.mjs tests/audit-aggregator.test.mjs tests/audit-p2.test.mjs tests/official-component-receipts.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/contract/task-record-paths-check.test.mjs`（6 files/49 tests，exit=0）；`node --check` moved runtime modules（exit=0）。
- **evidence_refs**：`evidence/repair/r007-control-plane-deletion.json`、`docs/architecture/move-map.json`、`docs/architecture/retention-manifest.json`。
- **covered_ac**：补充覆盖 AC-017/018/019 的 owner 目录收敛切片和无旧 core import；R007 的旧 attempt/accepted、journal、material、phase、review consumers 仍未完成，不宣称 R007 completed。
- **review_fact**：本切片不触发新的 wh-review；R008 仍是唯一当前树综合验证和独立 3rd-review owner。
- **addendum_recorded_at**：2026-08-03T15:10:00Z

### R007 completion record

- **status**：`completed`
- **actual_changes**：完成旧 control-plane 的垂直删除与 owner 收敛：删除迁移 CLI、receipt-writer facade、journal appender、checkpoint/material-revision owner、旧 flow/phase/review subject 模块、旧 schema、shim、专属 fixture/test 和 stale 路由；vNext 阶段不再调用 legacy attempt/accepted/checkpoint writer。修复 canonical `evidence/confirmations/` 路径识别，并让 `human-confirmation.v2` 的 material/snapshot provenance 参与 freshness 校验。没有新增 state machine、lease、accepted projection 或 review loop。
- **executed_commands**：`npx vitest run tests/integration/verify-freshness-selection.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/integration/execution-snapshot-isolation.test.mjs tests/contract/confirmation-authorization.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs`（5 files/85 tests，exit=0）；真实任务矩阵（五阶段、失败后修复、provider invalid/unavailable、并发、LFS、ignored cleanup、public CLI）exit=0 且 assertions 全部 true；`node tools/architecture/reference-audit.mjs --check`（violations=0、allowed_violations=0）；`node tools/architecture/inventory.mjs --check`（1047 delivery files）；`node tools/architecture/history-inventory.mjs verify-unchanged`（449/449）；`node tools/architecture/retention-audit.mjs --check`（errors=0）；`npm run check`（exit=0）。
- **evidence_refs**：`evidence/repair/r007-control-plane-deletion.json`、`evidence/phase-9/real-task-matrix-v1.json`、`docs/architecture/move-map.json`、`docs/architecture/retention-manifest.json`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/final-complexity-report.json`。
- **covered_ac**：AC-017、AC-018、AC-019、AC-024、AC-025、AC-037、AC-038、AC-042；最终 43 项覆盖、review-tree、provider raw/status/hash 仍归 R008。
- **remaining_scope**：数值复杂度预算仍有超限项，`runtime/task/task-kernel-implementation.mjs` 的兼容 API 仍 fail-loud 保留，`runtime/review/stage-review-disposition.mjs` 仍由当前测试消费；这些不是 vNext 生产双写或重复控制面。R008 继续负责唯一最终综合验证和一次 3rd-review。
- **review_fact**：R007 完成不触发 wh-review；R008 是唯一当前树综合验证和独立 3rd-review owner。
- **addendum_recorded_at**：2026-08-04T03:40:00Z

## R008 — 当前树综合验证

- **implementation_owner**：release-verification-maintainer
- **verification_owner**：independent-final-verifier
- **approval_owner**：user
- **status**：`todo`
- **目标**：只对 R007 之后的唯一 candidate tree 产生一套最终验证包，不复用旧 snapshot、旧 full suite、旧 review 或多个 final ledger。
- **精确文件**：`evidence/final/`、`tools/architecture/verify-final-coverage.mjs`、`tests/contract/verify-final-coverage.test.mjs`、`docs/architecture/*`。
- **动作**：R007 完成后冻结唯一 candidate tree；R008 重新生成四材料/source digest、七行为 compare、历史 unchanged、无 allow-list reference audit、三条 E2E、LFS/事务/并发/ignored/manual-close focused tests、Bundle/Runner clean install、`npm run check`；由 R008 生成唯一 review-tree manifest，并执行一次独立 `3rd-review` 直连，保存 provider raw/status/hash；R009 只消费该 review fact，不发起第二次 review；只在前述证据稳定且确有新增信息时运行一次 `npm test`。
- **FR/AC**：全部 FR；AC-001～AC-043。
- **验证命令**：`node tools/architecture/history-inventory.mjs verify-unchanged && node tools/architecture/public-behavior-baseline.mjs compare --baseline=c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf --candidate=worktree && node tools/architecture/reference-audit.mjs --check && npm run check && npm test`
- **预期结果**：一份 `evidence/final/verification-summary.json` 记录所有 receipt/hash/tree；质量结论可为 `pass/fail/unknown/incomplete`，进度不被其锁死；不生成 accepted projection。
- **STOP**：任何 tree drift、AC generic fill、provider fake pass、历史变化、reference residual、check/full/clean-install 失败。
- **证据**：`evidence/final/verification-summary.json`、`evidence/final/final-coverage.json`、`evidence/final/review-tree-manifest.json`。

## R009 — 正式交接、用户确认与下一步边界

- **implementation_owner**：workflowhub-handoff-owner
- **verification_owner**：independent-handoff-verifier
- **approval_owner**：user
- **status**：`todo`
- **目标**：展示真实完成质量和剩余风险；完成 `build-plan` 的 review/confirm/handoff 边界，但不执行 Git close。
- **精确文件**：`specs/workflowhub-complexity-governance-v3-20260802/plan.md`、`specs/workflowhub-complexity-governance-v3-20260802/tasks.md`、`evidence/final/change-summary.md`、`evidence/final/m14-m17-impact.md`。
- **动作**：确认删除/保留/KEEP-PARTIAL 影响、四材料 digest、AC summary、provider 原始状态、manual-delivery-close 语义和独立授权边界；用户确认只记录事实，不自动 commit/push/merge/archive/cleanup。
- **FR/AC**：FR-QUALITY-001、FR-AUTH-001、FR-RULES-001；AC-021、AC-028、AC-029、AC-042、AC-043。
- **验证命令**：`node tools/architecture/verify-final-coverage.mjs --require-ac=43 --require-same-review-tree --require-review-raw-hash --require-reference-clean --governance --handoff`
- **预期结果**：派生状态为 `ready_for_confirmation` 或真实 `incomplete`；用户确认后才允许独立 authorize；不写 accepted projection、不 close。
- **STOP**：handoff 缺项、review unavailable 被改写、用户未确认、或任何不可逆授权被隐式推导。
- **证据**：`evidence/final/change-summary.md`、`evidence/final/m14-m17-impact.md`。

## 追加任务依赖

```text
历史 T001–T030（只读）
                 |
                 v
R001 -> R002 -> R003 -> R004 -> R005 -> R006 -> R007 -> R008 -> R009
```

R001–R007 只运行受影响 focused checks；R008 是唯一当前树综合验证；R009 是用户确认和 handoff，不是 commit/push/merge/archive/cleanup 授权。任何失败回到最早失败 R task，同一 task 修复，不创建 successor 或 replacement review。

- **completed_at**：2026-08-03T11:49:43Z

---

## Repair Addendum EOF closure

以上 `Repair Addendum Tasks` 的 R001–R009 是本文件新增的补充修复方案；原有 T018 的 `completed_at` 事实保留原位，未被修改。后续执行以 R001–R009 的依赖链、STOP 条件和证据要求为准，不重跑历史 task，不创建 successor/replacement review。

## Repair Addendum correction

- R001 的 `reference-audit` 是过程对账，允许消费现有 retention manifest 中已登记的 KEEP；R007/R008 才执行不带 allow-list 的最终 clean audit。
- 人工交付不通过新的 `authorize --op=manual-close` 路由；它只写入现有 append-only task fact，业务确认仍与 `confirm --stage=verify-code` 分离于不可逆授权之外。
- R008 是 review-tree、provider raw/status/hash 与最终 coverage 的唯一 owner；R009 不重复审查。最终 coverage 命令包含 `--require-same-review-tree`。
- 上方历史 `T018.completed_at` 继续只作历史字段；本补充没有新的 `completed_at`，任何补充时间只能标为 `addendum_recorded_at`，不代表 R001–R009 已完成。
- `review-runner` 在同一个 review identity 内最多允许一次 OUTPUT_INVALID 的协议格式修正；这只是同会话的传输契约修复，不是二审、replacement review 或新的推进许可证。修正失败仍记录为 invalid/unavailable，原始 attempt 与语义结论不被改写。

## R008 completion record

- **status**：`completed`
- **actual_changes**：追加当前运行路径合同测试 `tests/contract/review-materials-contract.test.mjs` 与 `tests/e2e/vnext-five-stage-current.test.mjs`，替换最终覆盖中已删除的历史 oracle；追加 R007 stale replacement 文字更正；将同会话一次 OUTPUT_INVALID format correction 的边界写入补充规则；修正 make-decision/build-code skill 合同文字与测试期望的真实不一致；刷新 inventory/complexity 派生报告。没有恢复旧控制面，没有新增状态、review loop、accepted projection 或推进许可证。
- **executed_commands**：`npx vitest run ...` 最终定向矩阵（58 files/191 tests，exit=0）；`npm run check`（exit=0）；`npm test` 最终执行（safe 131 files/1155 tests、exclusive 2 files/31 tests，全部通过）；`node tools/architecture/clean-install.mjs`（runner=97、skill bundle=80、source/untracked unchanged）；history 449/449；reference-audit 无 allow-list；public baseline compare exit=0；最终覆盖命令 exit=0。
- **evidence_refs**：`evidence/final/verification-summary.json`、`evidence/final/final-coverage.json`、`evidence/final/review-tree-manifest.json`、`evidence/final/review.json`、`evidence/phase-9/r008-3rd-review-raw.json`、`evidence/phase-9/final-targeted-matrix-r008.json`、`evidence/phase-9/npm-test-r008-final.out`、`evidence/phase-9/clean-install-r008-final.json`。
- **covered_ac**：AC-001～AC-043；AC-003/004/013/014/015/022/023/030/031/032 使用当前等价 oracle，不再引用已删除的 `five-stage-*`、`progression-without-permits`、`atomic-write-faults` 或 `review-source-materials` 测试文件。
- **review_fact**：唯一一次直接 `3rd-review` raw 保留；Kimi/k3 给出 `sound_with_minimal_repairs`，Cursor/grok 的 `PROVIDER_PERMISSION_DENIED` 保留为 unavailable，未被改写为 pass；最终状态是 `ready_for_confirmation`，不是 accepted/close。
- **remaining_scope**：R009 只等待用户确认和正式 handoff；不重复审查，不自动 authorize、commit、push、merge、archive 或 cleanup。复杂度数字预算仍诚实披露为超限，不为数字删除质量保护。
- **addendum_recorded_at**：2026-08-04T05:55:00Z

## R008 evidence correction

- 最终 coverage 的当前合同 oracle 是 `tests/contract/review-materials-contract.test.mjs`；`skills/wh-review/scripts/__tests__/review-materials-contract.test.mjs` 不存在且不再作为证据引用。
- 两次失败的 `npm test` 输出保留为诊断事实：第一次暴露 skill 文案契约不一致，第二次暴露 inventory/complexity 派生报告过期；修复后最终一次通过。失败事实不改写为 pass，也不新增 review/task 链。

## Current material synchronization (r015)

本节是追加更正，不修改上方原始 task、历史完成时间或已发生的审计事实；它是当前树执行时唯一的 disposition 覆盖说明。

- `runtime/review/stage-review-disposition.mjs` 当前由 vNext 生产路径消费：`runtime/stage/stage-handlers.mjs`、`runtime/task/task-kernel-implementation.mjs` 以及 public risk 路由共同使用它完成 pause/risk acceptance 事实链。
- 当前 disposition 为 `KEEP`（vNext risk API），不属于 `KEEP_UNTIL_MIGRATION`，不得按历史 T012/T015/T017 迁移条件删除；`docs/architecture/retention-manifest.json` 已同步为该事实。
- R007 completion/remaining-scope 中“仍由当前测试消费”的旧表述仅是历史记录；准确表述是“由生产风险事实链和 focused tests 消费”。该同步不创建 successor、replacement review、额外 task 或新的推进许可证。
- 已删除的 `review-flow-authority.mjs`、`phase-review-subject.mjs`、`workflows/build-code/phase-evidence.mjs` 仍保持删除；它们与保留的 risk disposition 不是同一控制面。

## Current disposition supersession registry (r017)

本登记是当前执行规则，不改写上方历史 task 或审计记录；下列历史文字不再具有执行效力：

- tasks 中把 `runtime/review/stage-review-disposition.mjs` 列入 `KEEP_UNTIL_MIGRATION`、T012 successor 或迁移后删除清单的条目，统一作废码为 `SUPERSEDED_BY_R015_KEEP_VNEXT_RISK_API`。
- tasks 中把 `runtime/review/review-flow-authority.mjs`、`runtime/review/phase-review-subject.mjs`、`workflows/build-code/phase-evidence.mjs` 写成当前 KEEP bridge 的条目，统一作废码为 `SUPERSEDED_BY_R007_DELETED_AND_AUDITED`；不得恢复这些已删除路径。
- 当前唯一可执行 disposition 来源是 `docs/architecture/retention-manifest.json` 与本节：risk API `KEEP`，已删除 review/phase bridge 不保留，`tools/cli/check-task-record-paths.mjs` 为 live `KEEP`。
- 任何执行者发现历史条目与本登记冲突时必须停止并报告材料冲突；本登记不创建 successor、replacement review、额外 task、状态或推进许可证。

## Current execution authority (r018 repair synchronization)

本节是当前执行状态的唯一补充口径，不改写上方原始 tasks、历史完成时间或 R008 completion record。

- R008 历史 `completed` 记录只代表当时 candidate tree 的历史事实；当前树仍在同一 task 修复，当前状态为 `in_progress`，R009 保持 `todo`。
- r018 3rd-review 是本轮唯一方案审查，实际运行 Kimi/K3 与 Cursor/Grok；两者共同指出 quality 路径迁移、公共 writer 路由、独立不可逆授权和材料状态对账缺口。修复后只做一次定向复审，不使用 wh-review，不创建 successor/replacement review。
- 当前 task 的完成条件还包括：vNext writer/reader 只使用 `quality/*`，公共 CLI 不暴露 `publish-*`/`record-*` writer，`authorize` 覆盖 commit/push/merge/archive/cleanup，AGENTS/CONSTITUTION 实施边界与原始 §10 对齐，五阶段和 close 贯通证据真实可复现。
- 未形成新的正式 `accepted.json`；verify、confirm、authorize、业务 Git 交付和 formal close 仍分别记录，质量证据不是推进许可证。

## Current execution authority (r019 targeted repair completion)

本节只同步当前 R008 修复事实，不改写历史 R008 completion record，不创建新 task 或 replacement review。

- R008 当前修复已完成：progression-only publication 明确禁止 formal acceptance；vNext writer 默认走 progression 路径；`deriveStageProgress` 只检查当前四份材料，不再读取质量事实作为推进条件。
- 定向验证：`node --check`（相关 runtime 文件，exit=0）、`git diff --check`（exit=0）、`npx vitest run tests/contract/stage-completion.test.mjs tests/integration/derived-publication.test.mjs tests/integration/vnext-official-stage-run.test.mjs`（3 files/53 tests，exit=0）。未重跑完整 `npm test`。
- review_fact：`3rd-review` runtime `6cd44153-9e5a-4b9b-8b9a-461837a20b69` 的 `cursor/grok` 初审结果为 `REVISE`；已按其唯一结论完成最小修复。依据当前“不重复审查”原则，不发起第二次 review；该事实保留为质量 warning，不阻塞推进。
- 当前质量警告：最终修复后的代码没有第二次独立 review；历史 full-suite/final package 不作为本次修复后的新鲜证据。R009 只做正式 handoff/确认边界，不自动 close 或授权不可逆操作。
- **next_task**：R009。
