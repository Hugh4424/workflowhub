# 任务清单：WorkflowHub 详细计划与执行交接简化

- **Input**：`specs/workflowhub-execution-simplification-20260907/decision-log.md@12f100d17e374c88f072977a2ae5e2457c5357dce4dd1bf302974dda8bde60bf`、`specs/workflowhub-execution-simplification-20260907/spec.md@f80eab9a1bf3d7b551976505a024ae0034a001a17d70c3c9d55748167bb6b2a0`、`specs/workflowhub-execution-simplification-20260907/plan.md@e25694ea9437de53a15d5504741b4309ea33b3b6103380de372c7a27971970e9`
- **Template version**：`plan-task.v4`

## Phase P1 — 材料、确认与冻结

### Goal
相同确认幂等、变化确认新建；方向批准不因下游细化失效；真实交互和五类偏差分流可验证。

### Files
- **NEW**：N/A — 本 Phase 不新增生产对象类别。
- **MODIFY**：`tests/contract/four-material-non-gate-contract.test.mjs`, `tests/stage-plan-task-contract.test.mjs`, `tests/stage-interaction-contract.test.mjs`, `tests/contract/ui-applicability-must-ask.test.mjs`, `tests/contract/freeze-classification-budget-usage-protocol.test.mjs`, `runtime/stage/stage-content-contracts.mjs`, `tests/contract/human-confirmation-v3.test.mjs`, `tests/contract/confirmation-authorization.test.mjs`, `tests/boundary-confirm.test.mjs`, `runtime/task/task-kernel-implementation.mjs`, `runtime/task/task-store.mjs`
- **DO NOT TOUCH**：历史原件、UI、真实 provider config/sink、其他 Phase owner 文件。

### Tasks

#### T001 — RED：固定四材料作者、真实答复、五类偏差与 non_ui 来源的失败断言

- **ID**：T001
- **Phase**：Phase P1 — 材料、确认与冻结
- **goal**：固定四材料作者、真实答复、五类偏差与 non_ui 来源的失败断言
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-simplification-20260907/spec.md","hash":"f80eab9a1bf3d7b551976505a024ae0034a001a17d70c3c9d55748167bb6b2a0","id":"SPEC-workflowhub-execution-simplification-20260907"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-simplification-20260907/plan.md","hash":"e25694ea9437de53a15d5504741b4309ea33b3b6103380de372c7a27971970e9","id":"PLAN-workflowhub-execution-simplification-20260907"}]`
- **source_refs / decision_refs**：R3/R4/R6/U1/U2/U9/U11; D1/D2/D7/D9/D14 → FR-AUTHOR-001, FR-INTERACT-001, FR-DEVIATE-001, FR-COMPAT-001; AC-AUTHOR-001, AC-INTERACT-001, AC-DEVIATE-001, AC-COMPAT-001
- **输入**：当前 accepted decision/spec/plan；依赖卡 none 的真实输出
- **依赖**：none
- **并行**：否 — producer-before-consumer；同 Phase 共享文件串行
- **FR**：FR-AUTHOR-001, FR-INTERACT-001, FR-DEVIATE-001, FR-COMPAT-001
- **AC**：AC-AUTHOR-001, AC-INTERACT-001, AC-DEVIATE-001, AC-COMPAT-001
- **动作**：在现有合同测试加入 build-spec 不要求未来 plan/tasks、未答保持未答、五类偏差 owner、UI fact 缺失/冲突失败的断言
- **精确文件**：`tests/contract/four-material-non-gate-contract.test.mjs`, `tests/stage-plan-task-contract.test.mjs`, `tests/stage-interaction-contract.test.mjs`, `tests/contract/ui-applicability-must-ask.test.mjs`, `tests/contract/freeze-classification-budget-usage-protocol.test.mjs`
- **boundary**：files: `tests/contract/four-material-non-gate-contract.test.mjs`, `tests/stage-plan-task-contract.test.mjs`, `tests/stage-interaction-contract.test.mjs`, `tests/contract/ui-applicability-must-ask.test.mjs`, `tests/contract/freeze-classification-budget-usage-protocol.test.mjs`; symbols/regions: plan/task contract、interaction batch、UI applicability/freeze fixtures
- **输出**：固定四材料作者、真实答复、五类偏差与 non_ui 来源的失败断言 的可复核实现/测试事实
- **Knowledge**：原件不可变；缺失/partial/failure/unavailable 不推绿；仅本卡边界内修改
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`npx --no-install vitest run tests/contract/four-material-non-gate-contract.test.mjs tests/stage-plan-task-contract.test.mjs tests/stage-interaction-contract.test.mjs tests/contract/ui-applicability-must-ask.test.mjs tests/contract/freeze-classification-budget-usage-protocol.test.mjs tests/contract/human-confirmation-v3.test.mjs tests/contract/confirmation-authorization.test.mjs tests/boundary-confirm.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-P1-AUTHOR {"pass":"ORACLE-P1-AUTHOR: target assertion fails before the paired GREEN change and the same command exits 1; after the paired change it exits 0 with both positive and negative cases.","reject":{"input":"the target behavior fixture described by this task","expected_rejection":"the declared target contract rejects the invalid or missing behavior","observation":"the failure identifies the target assertion rather than setup or unrelated noise"}}`
- **evidence_path**：`quality/tests/P1-T001-execution-simplification.json`（output: `quality/tests/output/P1-T001-execution-simplification.output`）
- **STOP**：命令损坏/空跑、失败信号无关、需弱化断言、越界文件、新产品/行为/接口或新控制面时停止并回 owner material
- **recovery**：build-code 只回滚本卡实现/fixture，保留材料与不可变原件；按 make-decision/build-spec/build-plan 分流
- **task risk**：错误 RED、隐藏部分失败、或总 exit 替代逐项 oracle
- **test tier / test method**：feature / backend-testing
- **scenarios / commands / expected exit / oracle**：只有 decision/spec；partial/unanswered/withdrawn/answered；ui/non_ui/missing/conflict；五种 deviation；命令如上；RED=1，GREEN=0；oracle=ORACLE-P1-AUTHOR
- **fixtures_services**：临时 Workspace+TaskHandle；无网络/provider/browser；测试负责 rm temp
- **coverage limits**：证明结构与路由，不判断计划文字质量
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`plan.md#Phase P1`
- **semantic_review_reason**：Phase review is deferred to build-code; this card records the required paired oracle and its future review owner.


##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`in_progress`
- **actual_changes**：两个目标测试文件新增 partial 完成拒绝、跨轮重复已答、真实撤回及四材料错误 owner 断言。
- **executed_commands**：本卡 gate_cmd；canonical capture exit=0，子测试 exit=1；7 failed / 124 passed，8 文件。
- **evidence_refs**：`quality/tests/P1-T001-execution-simplification.json` sha `99d0298c99256d8bef22ac962c98c65214f3615cd2e2bd062f4bb268b6931d36`；`quality/tests/output/P1-T001-execution-simplification.output`。
- **covered_ac**：AC-INTERACT-001、AC-DEVIATE-001 目标缺陷已证伪；原有四材料/non_ui 保护用例通过；完整功能结果待 GREEN 和 Phase 独审。
- **review_fact**：P1 Phase review 仍是 unavailable/partial，不能用 build-code review 原件替代本卡独立完成事实。
- **completed_at**：N/A — paired GREEN/Phase review 未完成
- **执行事实**：RED 真实完成；snapshot=`269cd37f93201c4d7e453cd0b47e4c628a3d435f`。首次捕获因运行期间修改工作树而拒写的原错保留 `/tmp/workflowhub-P1-T001-capture.log`；随后冻结重跑取得上述 receipt。任务待 paired GREEN/Phase review，不先勾完成。

#### T002 — GREEN：让 T001 断言通过且不把缺失值降级

- **ID**：T002
- **Phase**：Phase P1 — 材料、确认与冻结
- **goal**：让 T001 断言通过且不把缺失值降级
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-simplification-20260907/spec.md","hash":"f80eab9a1bf3d7b551976505a024ae0034a001a17d70c3c9d55748167bb6b2a0","id":"SPEC-workflowhub-execution-simplification-20260907"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-simplification-20260907/plan.md","hash":"e25694ea9437de53a15d5504741b4309ea33b3b6103380de372c7a27971970e9","id":"PLAN-workflowhub-execution-simplification-20260907"}]`
- **source_refs / decision_refs**：R3/R4/R6/U1/U2/U9/U11; D1/D2/D7/D9/D14 → FR-AUTHOR-001, FR-INTERACT-001, FR-DEVIATE-001, FR-COMPAT-001; AC-AUTHOR-001, AC-INTERACT-001, AC-DEVIATE-001, AC-COMPAT-001
- **输入**：当前 accepted decision/spec/plan；依赖卡 T001 的真实输出
- **依赖**：T001
- **并行**：否 — producer-before-consumer；同 Phase 共享文件串行
- **FR**：FR-AUTHOR-001, FR-INTERACT-001, FR-DEVIATE-001, FR-COMPAT-001
- **AC**：AC-AUTHOR-001, AC-INTERACT-001, AC-DEVIATE-001, AC-COMPAT-001
- **动作**：最小修改材料解析/validator/handler；build-spec 只消费当前材料，真实答复才收敛，偏差回对应 owner
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`, `tests/contract/four-material-non-gate-contract.test.mjs`, `tests/stage-plan-task-contract.test.mjs`, `tests/stage-interaction-contract.test.mjs`, `tests/contract/ui-applicability-must-ask.test.mjs`, `tests/contract/freeze-classification-budget-usage-protocol.test.mjs`
- **boundary**：files: `runtime/stage/stage-content-contracts.mjs`, `tests/contract/four-material-non-gate-contract.test.mjs`, `tests/stage-plan-task-contract.test.mjs`, `tests/stage-interaction-contract.test.mjs`, `tests/contract/ui-applicability-must-ask.test.mjs`, `tests/contract/freeze-classification-budget-usage-protocol.test.mjs`; symbols/regions: stageInputPacketFacts、plan task validator、UI applicability/freeze classification
- **输出**：让 T001 断言通过且不把缺失值降级 的可复核实现/测试事实
- **Knowledge**：原件不可变；缺失/partial/failure/unavailable 不推绿；仅本卡边界内修改
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`npx --no-install vitest run tests/contract/four-material-non-gate-contract.test.mjs tests/stage-plan-task-contract.test.mjs tests/stage-interaction-contract.test.mjs tests/contract/ui-applicability-must-ask.test.mjs tests/contract/freeze-classification-budget-usage-protocol.test.mjs tests/contract/human-confirmation-v3.test.mjs tests/contract/confirmation-authorization.test.mjs tests/boundary-confirm.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-P1-AUTHOR {"pass":"ORACLE-P1-AUTHOR: the same command exits 0 after the paired RED case is fixed and both positive and negative cases remain observable."}`
- **evidence_path**：`quality/tests/P1-T002-execution-simplification.json`（output: `quality/tests/output/P1-T002-execution-simplification.output`）
- **STOP**：命令损坏/空跑、失败信号无关、需弱化断言、越界文件、新产品/行为/接口或新控制面时停止并回 owner material
- **recovery**：build-code 只回滚本卡实现/fixture，保留材料与不可变原件；按 make-decision/build-spec/build-plan 分流
- **task risk**：错误 RED、隐藏部分失败、或总 exit 替代逐项 oracle
- **test tier / test method**：feature / backend-testing
- **scenarios / commands / expected exit / oracle**：与 T001 完全相同；保留负例；命令如上；RED=1，GREEN=0；oracle=ORACLE-P1-AUTHOR
- **fixtures_services**：与 T001 相同
- **coverage limits**：不证明 confirmation 并发，交给 T003/T004
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`plan.md#Phase P1`
- **semantic_review_reason**：Phase review is deferred to build-code; this card records the required paired oracle and its future review owner.


##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`in_progress`
- **actual_changes**：stage-content-contracts 的 lifecycle/sequence/aggregate/Clarify 完成检查及 fallback 四材料 owner 校验已修改。
- **executed_commands**：同本卡 gate_cmd，canonical capture exit=0，8 文件 / 136 tests passed。
- **evidence_refs**：`quality/tests/P1-T002-execution-simplification.json` sha `095176431b9baacce2f7a4111d8fed4e21bfe43de527601e589e3838efd216d9`；对应 output 同名 `.output`。
- **covered_ac**：AC-INTERACT-001、AC-DEVIATE-001 的本卡正反合同通过；partial 回答后收敛、旧 pending 保留、Talk/Grill/Clarify 撤回及错源/错hash/伪answers拒绝；其他范围待后续卡。
- **review_fact**：P1 Phase review 仍是 unavailable/partial；不把本卡 GREEN receipt 当作 Phase 质量通过。
- **completed_at**：N/A — paired Phase review 未完成
- **执行事实**：本卡 GREEN 事实已写入外置 task store；P1 Phase card 仍待独立 review、未声明 Phase 完成。

#### T003 — RED：固定 confirmation 语义幂等、并发与 direction freeze 失败断言

- **ID**：T003
- **Phase**：Phase P1 — 材料、确认与冻结
- **goal**：固定 confirmation 语义幂等、并发与 direction freeze 失败断言
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-simplification-20260907/spec.md","hash":"f80eab9a1bf3d7b551976505a024ae0034a001a17d70c3c9d55748167bb6b2a0","id":"SPEC-workflowhub-execution-simplification-20260907"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-simplification-20260907/plan.md","hash":"e25694ea9437de53a15d5504741b4309ea33b3b6103380de372c7a27971970e9","id":"PLAN-workflowhub-execution-simplification-20260907"}]`
- **source_refs / decision_refs**：U3/U6/U12/U13; D2/D8/D13/D14 → FR-INTERACT-001, FR-LIFECYCLE-001, FR-TRUTH-001, FR-PROTECT-001; AC-INTERACT-001, AC-LIFECYCLE-001, AC-LIFECYCLE-002, AC-PROTECT-003
- **输入**：当前 accepted decision/spec/plan；依赖卡 T002 的真实输出
- **依赖**：T002
- **并行**：否 — producer-before-consumer；同 Phase 共享文件串行
- **FR**：FR-INTERACT-001, FR-LIFECYCLE-001, FR-TRUTH-001, FR-PROTECT-001
- **AC**：AC-INTERACT-001, AC-LIFECYCLE-001, AC-LIFECYCLE-002, AC-PROTECT-003
- **动作**：新增首次/串行/并发重试，subject/scope/step/reply/decision 变化，spec/plan 下游细化场景
- **精确文件**：`tests/contract/human-confirmation-v3.test.mjs`, `tests/contract/confirmation-authorization.test.mjs`, `tests/boundary-confirm.test.mjs`
- **boundary**：files: `tests/contract/human-confirmation-v3.test.mjs`, `tests/contract/confirmation-authorization.test.mjs`, `tests/boundary-confirm.test.mjs`; symbols/regions: publishHumanConfirmation、TaskStore lock、decision approval binding fixtures
- **输出**：固定 confirmation 语义幂等、并发与 direction freeze 失败断言 的可复核实现/测试事实
- **Knowledge**：原件不可变；缺失/partial/failure/unavailable 不推绿；仅本卡边界内修改
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`npx --no-install vitest run tests/contract/four-material-non-gate-contract.test.mjs tests/stage-plan-task-contract.test.mjs tests/stage-interaction-contract.test.mjs tests/contract/ui-applicability-must-ask.test.mjs tests/contract/freeze-classification-budget-usage-protocol.test.mjs tests/contract/human-confirmation-v3.test.mjs tests/contract/confirmation-authorization.test.mjs tests/boundary-confirm.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-P1-CONFIRM {"pass":"ORACLE-P1-CONFIRM: target assertion fails before the paired GREEN change and the same command exits 1; after the paired change it exits 0 with both positive and negative cases.","reject":{"input":"the target behavior fixture described by this task","expected_rejection":"the declared target contract rejects the invalid or missing behavior","observation":"the failure identifies the target assertion rather than setup or unrelated noise"}}`
- **evidence_path**：`quality/tests/P1-T003-execution-simplification.json`（output: `quality/tests/output/P1-T003-execution-simplification.output`）
- **STOP**：命令损坏/空跑、失败信号无关、需弱化断言、越界文件、新产品/行为/接口或新控制面时停止并回 owner material
- **recovery**：build-code 只回滚本卡实现/fixture，保留材料与不可变原件；按 make-decision/build-spec/build-plan 分流
- **task risk**：错误 RED、隐藏部分失败、或总 exit 替代逐项 oracle
- **test tier / test method**：feature / backend-testing
- **scenarios / commands / expected exit / oracle**：A→A；并发 A/A；subject 或语义字段变化；下游 material revision 变化；半写；命令如上；RED=1，GREEN=0；oracle=ORACLE-P1-CONFIRM
- **fixtures_services**：mkdtemp task root；Promise 并发；故障注入；清理 temp
- **coverage limits**：单机 filesystem 原子性，不证明分布式 FS
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`plan.md#Phase P1`
- **semantic_review_reason**：Phase review is deferred to build-code; this card records the required paired oracle and its future review owner.


##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`in_progress`
- **actual_changes**：新增语义确认、并发锁、orphan 与 scope RED，覆盖真实文件系统及历史损坏边界。
- **executed_commands**：本卡 gate_cmd 经 public verify --action=execute；capture exit=0，child exit=1；5 个目标失败、145 通过。
- **evidence_refs**：`quality/tests/P1-T003-execution-simplification.json` sha `636a4209db2ae62052cb93d52a99d5dc6fae2790a53cb2b20ede25c29e63f98e`；对应 output 同名 `.output`。
- **covered_ac**：confirmation 语义幂等、并发、orphan 和 decision scope 的目标 RED 已固定；GREEN 与 Phase review 仍未完成。
- **review_fact**：P1 Phase review unavailable/partial，保留原始 provider 失败事实。
- **completed_at**：N/A — paired GREEN/Phase review 未完成
- **执行事实**：capture exit=0、child exit=1；5 个目标失败、145 通过。未以 RED 事实推导完成。

#### T004 — GREEN：锁内按语义 identity 复用首次 confirmation，并只绑定 decision subject bytes/scope

- **ID**：T004
- **Phase**：Phase P1 — 材料、确认与冻结
- **goal**：锁内按语义 identity 复用首次 confirmation，并只绑定 decision subject bytes/scope
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-simplification-20260907/spec.md","hash":"f80eab9a1bf3d7b551976505a024ae0034a001a17d70c3c9d55748167bb6b2a0","id":"SPEC-workflowhub-execution-simplification-20260907"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-simplification-20260907/plan.md","hash":"e25694ea9437de53a15d5504741b4309ea33b3b6103380de372c7a27971970e9","id":"PLAN-workflowhub-execution-simplification-20260907"}]`
- **source_refs / decision_refs**：U3/U6/U12/U13; D2/D8/D13/D14 → FR-INTERACT-001, FR-LIFECYCLE-001, FR-TRUTH-001, FR-PROTECT-001; AC-INTERACT-001, AC-LIFECYCLE-001, AC-LIFECYCLE-002, AC-PROTECT-003
- **输入**：当前 accepted decision/spec/plan；依赖卡 T003 的真实输出
- **依赖**：T003
- **并行**：否 — producer-before-consumer；同 Phase 共享文件串行
- **FR**：FR-INTERACT-001, FR-LIFECYCLE-001, FR-TRUTH-001, FR-PROTECT-001
- **AC**：AC-INTERACT-001, AC-LIFECYCLE-001, AC-LIFECYCLE-002, AC-PROTECT-003
- **动作**：identity 排除 confirmed_at；withStoreLock 内 validate/compare/create-only；删除方向批准对下游 material revision 的反向依赖
- **精确文件**：`runtime/task/task-kernel-implementation.mjs`, `runtime/task/task-store.mjs`, `runtime/stage/stage-content-contracts.mjs`, `tests/contract/human-confirmation-v3.test.mjs`, `tests/contract/confirmation-authorization.test.mjs`, `tests/boundary-confirm.test.mjs`
- **boundary**：files: `runtime/task/task-kernel-implementation.mjs`, `runtime/task/task-store.mjs`, `runtime/stage/stage-content-contracts.mjs`, `tests/contract/human-confirmation-v3.test.mjs`, `tests/contract/confirmation-authorization.test.mjs`, `tests/boundary-confirm.test.mjs`; symbols/regions: publishHumanConfirmation、atomicWrite、withStoreLock、decisionSection approval validation
- **输出**：锁内按语义 identity 复用首次 confirmation，并只绑定 decision subject bytes/scope 的可复核实现/测试事实
- **Knowledge**：原件不可变；缺失/partial/failure/unavailable 不推绿；仅本卡边界内修改
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`npx --no-install vitest run tests/contract/four-material-non-gate-contract.test.mjs tests/stage-plan-task-contract.test.mjs tests/stage-interaction-contract.test.mjs tests/contract/ui-applicability-must-ask.test.mjs tests/contract/freeze-classification-budget-usage-protocol.test.mjs tests/contract/human-confirmation-v3.test.mjs tests/contract/confirmation-authorization.test.mjs tests/boundary-confirm.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-P1-CONFIRM {"pass":"ORACLE-P1-CONFIRM: the same command exits 0 after the paired RED case is fixed and both positive and negative cases remain observable."}`
- **evidence_path**：`quality/tests/P1-T004-execution-simplification.json`（output: `quality/tests/output/P1-T004-execution-simplification.output`）
- **STOP**：命令损坏/空跑、失败信号无关、需弱化断言、越界文件、新产品/行为/接口或新控制面时停止并回 owner material
- **recovery**：build-code 只回滚本卡实现/fixture，保留材料与不可变原件；按 make-decision/build-spec/build-plan 分流
- **task risk**：错误 RED、隐藏部分失败、或总 exit 替代逐项 oracle
- **test tier / test method**：feature / backend-testing
- **scenarios / commands / expected exit / oracle**：与 T003 相同；确认三种授权类型不互替；命令如上；RED=1，GREEN=0；oracle=ORACLE-P1-CONFIRM
- **fixtures_services**：与 T003 相同
- **coverage limits**：旧 v1/v2/v3 只读；不做历史重写
- **phase_review**：`{"stage":"build-code","review_scope":"phase","subject_kind":"phase","phase_id":"P1","packet_requires":["approved_spec","acceptance_criteria","test_evidence","changed_files","snapshot_tree"],"command":"node skills/wh-review/scripts/wh-review-cli.mjs run quality/reviews/requests/P1-phase-review.json","result_ref_pattern":"quality/reviews/results/<content-hash>.json","finding_owner":"current build-code main agent","unavailable_semantics":"preserve unavailable; local repair may continue; phase quality cannot be claimed"}`
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`plan.md#Phase P1`
- **semantic_review_reason**：Phase review is deferred to build-code; this card records the required paired oracle and its future review owner.


##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`in_progress`
- **actual_changes**：锁内语义复用原确认与 fact；恢复 orphan；绑定 decision scope；隔离历史诊断。
- **executed_commands**：本卡 gate_cmd 经 public verify --action=execute；8 文件 155/155 通过；修复无关历史损坏后以 158/158 验证。
- **evidence_refs**：当前 `quality/tests/P1-T004-review-fixes.json` sha `5e1553a7b6ca7d7b07595e4358969435324c2023744c0f02cb7a9e42e4232b8d`；历史 `quality/tests/P1-T004-history-fix.json` sha `e00245a36c44a37ecb78af4eb6725576e93fe1405f6658467d94706b0e8a2f5b`；原 T004 receipt sha `8a6c199a17c9e24a0a36b99327999a81d02134e3d96a25ed8eccc6ea076d964c`。
- **covered_ac**：confirmation 三类授权不互替、错误 evidence/hash/ref 拒绝及历史损坏隔离已覆盖；Phase review 仍未形成可用完成事实。
- **review_fact**：P1 review 曾返回 unavailable/partial；原件和处置保留，不能称 Phase quality passed。
- **completed_at**：N/A — Phase review 未完成
- **执行事实**：GREEN 与 history-fix 原件均不可变保留；本卡实现/测试事实完成，但 paired Phase review 未完成。

#### T005 — RED：固定 paired review 四分支、raw partial、错材料、全失败与零重复 dispatch

- **ID**：T005
- **Phase**：Phase P2 — 成对审查与 canonical 记录
- **goal**：固定 paired review 四分支、raw partial、错材料、全失败与零重复 dispatch
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-simplification-20260907/spec.md","hash":"f80eab9a1bf3d7b551976505a024ae0034a001a17d70c3c9d55748167bb6b2a0","id":"SPEC-workflowhub-execution-simplification-20260907"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-simplification-20260907/plan.md","hash":"e25694ea9437de53a15d5504741b4309ea33b3b6103380de372c7a27971970e9","id":"PLAN-workflowhub-execution-simplification-20260907"}]`
- **source_refs / decision_refs**：R1/R2/R5/U4/U10/U12/U13; D3/D4/D8/D10/D11/D14 → FR-TRUTH-001, FR-REVIEW-001, FR-RETRY-001; AC-TRUTH-001, AC-REVIEW-001, AC-REVIEW-002, AC-RETRY-001
- **输入**：当前 accepted decision/spec/plan；依赖卡 T004 的真实输出
- **依赖**：T004
- **并行**：否 — producer-before-consumer；同 Phase 共享文件串行
- **FR**：FR-TRUTH-001, FR-REVIEW-001, FR-RETRY-001
- **AC**：AC-TRUTH-001, AC-REVIEW-001, AC-REVIEW-002, AC-RETRY-001
- **动作**：为 role_results 四分支加入失败断言，检查成员失败/意见/覆盖/处置/write status 不互相覆盖
- **精确文件**：`tests/review/review-record-route.test.mjs`, `tests/integration/wh-review-v3-broker-contract.test.mjs`, `tests/review/review-policy-compatibility.test.mjs`, `skills/wh-review/scripts/third-review-host-config.mjs`, `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`
- **boundary**：files: `tests/review/review-record-route.test.mjs`, `tests/integration/wh-review-v3-broker-contract.test.mjs`, `tests/review/review-policy-compatibility.test.mjs`, `skills/wh-review/scripts/third-review-host-config.mjs`, `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`; symbols/regions: combinePairedResults、recordSimpleReviewResult、canonical role aggregation、selectTrustedReviewProviderSelection缺省source规范化
- **输出**：固定 paired review 四分支、raw partial、错材料、全失败与零重复 dispatch 的可复核实现/测试事实
- **Knowledge**：原件不可变；缺失/partial/failure/unavailable 不推绿；仅本卡边界内修改
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`npx --no-install vitest run tests/review/review-record-route.test.mjs tests/integration/wh-review-v3-broker-contract.test.mjs tests/review/review-policy-compatibility.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **supplementary_cmd**：`npx --no-install vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；P3预检暴露的P2来源规范化窄修，同命令RED→GREEN，不重派P2review。
- **expected_exit**：1
- **oracle**：`ORACLE-P2 {"pass":"ORACLE-P2: target assertion fails before the paired GREEN change and the same command exits 1; after the paired change it exits 0 with both positive and negative cases.","reject":{"input":"the target behavior fixture described by this task","expected_rejection":"the declared target contract rejects the invalid or missing behavior","observation":"the failure identifies the target assertion rather than setup or unrelated noise"}}`
- **evidence_path**：`quality/tests/P2-T005-execution-simplification.json`（output: `quality/tests/output/P2-T005-execution-simplification.output`）
- **STOP**：命令损坏/空跑、失败信号无关、需弱化断言、越界文件、新产品/行为/接口或新控制面时停止并回 owner material
- **recovery**：build-code 只回滚本卡实现/fixture，保留材料与不可变原件；按 make-decision/build-spec/build-plan 分流
- **task risk**：错误 RED、隐藏部分失败、或总 exit 替代逐项 oracle
- **test tier / test method**：fullstack / fullstack-slice-testing
- **scenarios / commands / expected exit / oracle**：双侧达标partial；单侧达标；双侧有语义覆盖不足；wrong material；all fail；record failure；budget 0/unknown；命令如上；RED=1，GREEN=0；oracle=ORACLE-P2
- **fixtures_services**：完全隔离 fake broker/provider outputs；dispatch spy；无 live provider
- **coverage limits**：证明本地协议，不证明 provider 可用率/费用
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`plan.md#Phase P2`
- **semantic_review_reason**：Phase review is deferred to build-code; this card records the required paired oracle and its future review owner.


##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`in_progress`
- **actual_changes**：固定 paired review 四分支、raw partial、错材料、全失败与零重复 dispatch 的 RED 断言；补出 source normalization 缺口。
- **executed_commands**：正式 RED capture exit=0 / child exit=1；3 files 13 failed / 17 passed；source-normalization 补充 RED 为 6 failed / 29 passed。
- **evidence_refs**：`quality/tests/P2-T005-execution-simplification.json` sha `936b447c5d667768b1369313e8f85575e97537bc6bd5221f44ddc375a03304df`；补充 `quality/tests/P2-T005-source-normalization-red.json` sha `b633b40fbc229fa5f928cb65906dbecb1c1e4f73b80507ccddefed49aca09a40`。
- **covered_ac**：role/source/material 错配、partial/all-failed 与 source selection 的目标失败已固定；GREEN 与 P2 Phase review 仍未完成。
- **review_fact**：P2 provider review unavailable；原始 broker/member 失败事实保留，不能用测试 receipt 代替 review。
- **completed_at**：N/A — paired GREEN/Phase review 未完成
- **执行事实**：source normalization RED 与原 RED 均是 canonical receipt；旧 review 原件不重派、不改写。

#### T006 — GREEN：role 级认证并写 canonical refs，pair summary 引用两侧且保留 single path

- **ID**：T006
- **Phase**：Phase P2 — 成对审查与 canonical 记录
- **goal**：role 级认证并写 canonical refs，pair summary 引用两侧且保留 single path
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-simplification-20260907/spec.md","hash":"f80eab9a1bf3d7b551976505a024ae0034a001a17d70c3c9d55748167bb6b2a0","id":"SPEC-workflowhub-execution-simplification-20260907"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-simplification-20260907/plan.md","hash":"e25694ea9437de53a15d5504741b4309ea33b3b6103380de372c7a27971970e9","id":"PLAN-workflowhub-execution-simplification-20260907"}]`
- **source_refs / decision_refs**：R1/R2/R5/U4/U10/U12/U13; D3/D4/D8/D10/D11/D14 → FR-TRUTH-001, FR-REVIEW-001, FR-RETRY-001; AC-TRUTH-001, AC-REVIEW-001, AC-REVIEW-002, AC-RETRY-001
- **输入**：当前 accepted decision/spec/plan；依赖卡 T005 的真实输出
- **依赖**：T005
- **并行**：否 — producer-before-consumer；同 Phase 共享文件串行
- **FR**：FR-TRUTH-001, FR-REVIEW-001, FR-RETRY-001
- **AC**：AC-TRUTH-001, AC-REVIEW-001, AC-REVIEW-002, AC-RETRY-001
- **动作**：在 writer 唯一边界识别 role_results；每 role 用自身 policy/material/source；raw available-with-failures→semantic available + partial；普通 verify 输出可写 existing e2e_binding 且不 dispatch；`recordSimpleReviewRequest` 用 `findReusableReview`/`requestLockHash` 比较 prior attempt 的 semantic presence、`material_id` 与 `resolveTrustedReviewRoute` 的 trusted route identity；仅材料或可信路由变化且 既有 validateReviewBudget review-round 事实明确有余量时允许一次补审，budget 缺失/unknown/exhausted 时 fail-closed 记录 unavailable，不新增 retry ledger
- **精确文件**：`skills/wh-review/scripts/simple-review-runner.mjs`, `skills/wh-review/scripts/wh-review-cli.mjs`, `runtime/review/review-record-route.mjs`, `runtime/review/canonical-review-result.mjs`, `tests/review/review-record-route.test.mjs`, `tests/integration/wh-review-v3-broker-contract.test.mjs`, `tests/review/review-policy-compatibility.test.mjs`, `skills/wh-review/scripts/review-provider-client.mjs`, `skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs`, `skills/wh-review/scripts/third-review-host-config.mjs`, `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/simple-review-runner.mjs`, `skills/wh-review/scripts/wh-review-cli.mjs`, `runtime/review/review-record-route.mjs`, `runtime/review/canonical-review-result.mjs`, `tests/review/review-record-route.test.mjs`, `tests/integration/wh-review-v3-broker-contract.test.mjs`, `tests/review/review-policy-compatibility.test.mjs`, `skills/wh-review/scripts/review-provider-client.mjs`, `skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs`, `skills/wh-review/scripts/third-review-host-config.mjs`, `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`; symbols/regions: combinePairedResults、recordSimpleReviewRequest、findReusableReview、requestLockHash、resolveTrustedReviewRoute、recordSimpleReviewResult、canonicalizeReviewResult、task-bound E2E record path、selectTrustedReviewProviderSelection缺省source规范化
- **输出**：role 级认证并写 canonical refs，pair summary 引用两侧且保留 single path 的可复核实现/测试事实
- **Knowledge**：原件不可变；缺失/partial/failure/unavailable 不推绿；仅本卡边界内修改
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`npx --no-install vitest run tests/review/review-record-route.test.mjs tests/integration/wh-review-v3-broker-contract.test.mjs tests/review/review-policy-compatibility.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **supplementary_cmd**：`npx --no-install vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；P3预检暴露的P2来源规范化窄修，同命令RED→GREEN，不重派P2review。
- **expected_exit**：0
- **oracle**：`ORACLE-P2 {"pass":"ORACLE-P2: the same command exits 0 after the paired RED case is fixed and both positive and negative cases remain observable."}`
- **evidence_path**：`quality/tests/P2-T006-execution-simplification.json`（output: `quality/tests/output/P2-T006-execution-simplification.output`）
- **STOP**：命令损坏/空跑、失败信号无关、需弱化断言、越界文件、新产品/行为/接口或新控制面时停止并回 owner material
- **recovery**：build-code 只回滚本卡实现/fixture，保留材料与不可变原件；按 make-decision/build-spec/build-plan 分流
- **task risk**：错误 RED、隐藏部分失败、或总 exit 替代逐项 oracle
- **test tier / test method**：fullstack / fullstack-slice-testing
- **scenarios / commands / expected exit / oracle**：与 T005 相同；同 provider 名跨 role 仅在各自 policy 认证后合法；同 material+route+semantic prior dispatch=0；material/route changed + known budget may dispatch once；unknown budget dispatch=0；命令如上；RED=1，GREEN=0；oracle=ORACLE-P2
- **fixtures_services**：与 T005 相同
- **coverage limits**：不新增 pair store/第三审查；旧原件不改
- **phase_review**：`{"stage":"build-code","review_scope":"phase","subject_kind":"phase","phase_id":"P2","packet_requires":["approved_spec","acceptance_criteria","test_evidence","changed_files","snapshot_tree"],"command":"node skills/wh-review/scripts/wh-review-cli.mjs run quality/reviews/requests/P2-phase-review.json","result_ref_pattern":"quality/reviews/results/<content-hash>.json","finding_owner":"current build-code main agent","unavailable_semantics":"preserve unavailable; local repair may continue; phase quality cannot be claimed"}`
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`plan.md#Phase P2`
- **semantic_review_reason**：Phase review is deferred to build-code; this card records the required paired oracle and its future review owner.


##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`in_progress`
- **actual_changes**：pair 逐侧认证、原始输出保留、稳定原件重用、真实 round 预算与同次 timeout 终态保真；失败成员身份降级记录路径已修复，completed 身份和 quorum 仍严格。
- **executed_commands**：实现与修复 gate 以 canonical receipt 执行；P2-T006 identity-failure-fix 五文件 95 passed；source-normalization GREEN 35/35；review-fixes 路径 90/95 passed 事实均保留。
- **evidence_refs**：`quality/tests/P2-T006-identity-failure-fix.json` sha `ef11e6d0eda445ccf31bcd59a21a27b8504eebcfa194a73dbfa5e71ab6030fb4`；`quality/tests/P2-T006-source-normalization-green.json` sha `fb7a0a920fa144ae159baa3df57eafa95bbd3b6f3a4ae164e4b5732de0305d96`；`quality/tests/P2-T006-review-fixes.json` sha `0e5e89b9da9967c45643035e9574b329932a8d7e33ca4f9e73e8be0e1e789975`。
- **covered_ac**：role/source/material 认证、known/unknown budget、失败成员保真和 no-retry 边界已验证；P2 Phase quality 仍 unavailable。
- **review_fact**：真实 P2 review unavailable；Codex/Kimi cancelled、Grok identity-degraded/404，record 失败成员 source mismatch 原件保留，result_ref 不重绑修复后 snapshot。
- **completed_at**：N/A — P2 Phase review 未完成
- **执行事实**：旧 P2 RED/GREEN/record-failure 原件全部保留；本卡实现/定向测试完成，但不能由本卡事实推导 Phase 完成。

#### T007 — RED：固定 review/step/outcome 经 producer→bridge→runtime→fact→status 的正反例

- **ID**：T007
- **Phase**：Phase P3 — 真实 outcome、验收、复盘与状态链
- **goal**：固定 review/step/outcome 经 producer→bridge→runtime→fact→status 的正反例
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-simplification-20260907/spec.md","hash":"f80eab9a1bf3d7b551976505a024ae0034a001a17d70c3c9d55748167bb6b2a0","id":"SPEC-workflowhub-execution-simplification-20260907"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-simplification-20260907/plan.md","hash":"e25694ea9437de53a15d5504741b4309ea33b3b6103380de372c7a27971970e9","id":"PLAN-workflowhub-execution-simplification-20260907"}]`
- **source_refs / decision_refs**：U12/U13; D3/D8/D10/D11/D14 → FR-OUTCOME-001, FR-TRUTH-001, FR-STATUS-001, FR-PROTECT-001; AC-OUTCOME-001, AC-TRUTH-001, AC-STATUS-001, AC-PROTECT-001, AC-PROTECT-002
- **输入**：当前 accepted decision/spec/plan；依赖卡 T006 的真实输出
- **依赖**：T006
- **并行**：否 — producer-before-consumer；同 Phase 共享文件串行
- **FR**：FR-OUTCOME-001, FR-TRUTH-001, FR-STATUS-001, FR-PROTECT-001
- **AC**：AC-OUTCOME-001, AC-TRUTH-001, AC-STATUS-001, AC-PROTECT-001, AC-PROTECT-002
- **动作**：加入真实 resolved outcome、漏修、错 task/source/hash/material/ref/attempt/agent_run、record failure 断言
- **工程合同**：真实 bridge 正例必须使用 attempt=A、agent_run=B、session=C 三种不同身份，另测无 session 但真实 producer 完整；反例缺 agent_run/错 attempt/空 session/外来 source/hash。freeze 从已认证 fact scope 和显式 confirmation/step 构造，测试无批准 blob、下游细化、decision 真变更和错确认引用。质量 incomplete 不得抹去真实执行身份；缺真实 producer 仍拒绝。
- **精确文件**：`tests/contract/host-outcome-bridge.test.mjs`, `tests/integration/vnext-official-stage-run.test.mjs`, `tests/contract/stage-completion.test.mjs`, `tests/contract/status-derivation.test.mjs`
- **boundary**：files: `tests/contract/host-outcome-bridge.test.mjs`, `tests/integration/vnext-official-stage-run.test.mjs`, `tests/contract/stage-completion.test.mjs`, `tests/contract/status-derivation.test.mjs`; symbols/regions: publishStageAgentOutcome、authenticateStageOutcome、publishVNextStage、completion predicates
- **输出**：固定 review/step/outcome 经 producer→bridge→runtime→fact→status 的正反例 的可复核实现/测试事实
- **Knowledge**：原件不可变；缺失/partial/failure/unavailable 不推绿；仅本卡边界内修改
- **verification_role**：RED
- **paired_task**：T008
- **gate_cmd**：`npx --no-install vitest run tests/contract/host-outcome-bridge.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/contract/stage-completion.test.mjs tests/contract/status-derivation.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-P3A {"pass":"ORACLE-P3A: target assertion fails before the paired GREEN change and the same command exits 1; after the paired change it exits 0 with both positive and negative cases.","reject":{"input":"the target behavior fixture described by this task","expected_rejection":"the declared target contract rejects the invalid or missing behavior","observation":"the failure identifies the target assertion rather than setup or unrelated noise"}}`
- **evidence_path**：`quality/tests/P3-T007-execution-simplification.json`（output: `quality/tests/output/P3-T007-execution-simplification.output`）
- **STOP**：命令损坏/空跑、失败信号无关、需弱化断言、越界文件、新产品/行为/接口或新控制面时停止并回 owner material
- **recovery**：build-code 只回滚本卡实现/fixture，保留材料与不可变原件；按 make-decision/build-spec/build-plan 分流
- **task risk**：错误 RED、隐藏部分失败、或总 exit 替代逐项 oracle
- **test tier / test method**：fullstack / fullstack-slice-testing
- **scenarios / commands / expected exit / oracle**：完整修复；漏修；foreign/unknown source；stale/dirty bytes；partial/unavailable；bridge session/unavailable；命令如上；RED=1，GREEN=0；oracle=ORACLE-P3A
- **fixtures_services**：隔离 git worktree+task root；fixture provider；actual bridge/runtime local process
- **coverage limits**：当前 Codex host/repo runtime；不追认历史/all hosts
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`plan.md#Phase P3`
- **semantic_review_reason**：Phase review is deferred to build-code; this card records the required paired oracle and its future review owner.


##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`in_progress`
- **actual_changes**：固定 review/step/outcome 经 producer→bridge→runtime→fact→status 的正反例，含 incomplete actor、source family、freeze 三来源和篡改拒绝。
- **executed_commands**：本卡四文件正式 RED capture exit=0 / child exit=1；14 failed / 151 passed，572.45s。
- **evidence_refs**：`quality/tests/P3-T007-execution-simplification.json` sha `a5226cc1715a54bd940f91e32a7e1b213f7c049ea9458ab895009b4e492d493f`；对应 output 同名 `.output`。
- **covered_ac**：全部新增目标断言均失败，旧测试无失败；producer→bridge→runtime→fact→status 的 RED 入口已锁定。
- **review_fact**：P3 Phase review 待 T012 后统一处理；本 RED 不代表代码质量通过。
- **completed_at**：N/A — paired GREEN/Phase review 未完成
- **执行事实**：capture/child/lease 已结束；未修改历史 outcome 或旧 review。

#### T008 — GREEN：共享认证语义并让 resolved outcome 进入 current fact/status，错误字段级拒绝

- **ID**：T008
- **Phase**：Phase P3 — 真实 outcome、验收、复盘与状态链
- **goal**：共享认证语义并让 resolved outcome 进入 current fact/status，错误字段级拒绝
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-simplification-20260907/spec.md","hash":"f80eab9a1bf3d7b551976505a024ae0034a001a17d70c3c9d55748167bb6b2a0","id":"SPEC-workflowhub-execution-simplification-20260907"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-simplification-20260907/plan.md","hash":"e25694ea9437de53a15d5504741b4309ea33b3b6103380de372c7a27971970e9","id":"PLAN-workflowhub-execution-simplification-20260907"}]`
- **source_refs / decision_refs**：U12/U13; D3/D8/D10/D11/D14 → FR-OUTCOME-001, FR-TRUTH-001, FR-STATUS-001, FR-PROTECT-001; AC-OUTCOME-001, AC-TRUTH-001, AC-STATUS-001, AC-PROTECT-001, AC-PROTECT-002
- **输入**：当前 accepted decision/spec/plan；依赖卡 T007 的真实输出
- **依赖**：T007
- **并行**：否 — producer-before-consumer；同 Phase 共享文件串行
- **FR**：FR-OUTCOME-001, FR-TRUTH-001, FR-STATUS-001, FR-PROTECT-001
- **AC**：AC-OUTCOME-001, AC-TRUTH-001, AC-STATUS-001, AC-PROTECT-001, AC-PROTECT-002
- **动作**：adapter/runner 共享 source/task/material/content identity；真实 dispatch fact 决定 record；status 各域只读自身事实
- **工程合同**：补私有 `{outcomeRef,outcomeHash}` 明确认证指定执行，旧 incomplete 不毒化本次修复，多候选无ref明确歧义不选latest；按 plan 的 P3 工程合同实现独立必填 agentRunId 与可选 session.session_id；真实 producer/内容/attempt 分别认证，禁止 agent_run_id===attempt_id 假设。freeze 批准 scope 来自已认证 fact，当前 bytes 独立算，不依赖批准 Git blob；不覆盖旧件，不产生自引用。
- **精确文件**：`tools/host/workflowhub-stage-agent-bridge.mjs`, `runtime/stage/stage-agent-outcome-adapter.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/stage/stage-handlers.mjs`, `runtime/stage/completion-predicates.mjs`, `tests/helpers/stage-outcome.mjs`, `tests/contract/host-outcome-bridge.test.mjs`, `tests/integration/vnext-official-stage-run.test.mjs`, `tests/contract/stage-completion.test.mjs`, `tests/contract/status-derivation.test.mjs`
- **boundary**：files: `tools/host/workflowhub-stage-agent-bridge.mjs`, `runtime/stage/stage-agent-outcome-adapter.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/stage/stage-handlers.mjs`, `runtime/stage/completion-predicates.mjs`, `tests/helpers/stage-outcome.mjs`, `tests/contract/host-outcome-bridge.test.mjs`, `tests/integration/vnext-official-stage-run.test.mjs`, `tests/contract/stage-completion.test.mjs`, `tests/contract/status-derivation.test.mjs`; symbols/regions: bridge session/agentRunId、freeze authenticated fact scope、publish/authenticate/current build-code outcome、publishVNextStage、completion/product release
- **输出**：共享认证语义并让 resolved outcome 进入 current fact/status，错误字段级拒绝 的可复核实现/测试事实
- **Knowledge**：原件不可变；缺失/partial/failure/unavailable 不推绿；仅本卡边界内修改
- **verification_role**：GREEN
- **paired_task**：T007
- **gate_cmd**：`npx --no-install vitest run tests/contract/host-outcome-bridge.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/contract/stage-completion.test.mjs tests/contract/status-derivation.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **supplementary_cmd**：`npx --no-install vitest run tests/contract/verify-code-binding-derivation.test.mjs tests/contract/acceptance-execution-tier.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；共享 helper 直接消费者，expected_exit=0，receipt `quality/tests/P3-T008-helper-consumers.json`
- **expected_exit**：0
- **oracle**：`ORACLE-P3A {"pass":"ORACLE-P3A: the same command exits 0 after the paired RED case is fixed and both positive and negative cases remain observable."}`
- **evidence_path**：`quality/tests/P3-T008-execution-simplification.json`（output: `quality/tests/output/P3-T008-execution-simplification.output`）
- **STOP**：命令损坏/空跑、失败信号无关、需弱化断言、越界文件、新产品/行为/接口或新控制面时停止并回 owner material
- **recovery**：build-code 只回滚本卡实现/fixture，保留材料与不可变原件；按 make-decision/build-spec/build-plan 分流
- **task risk**：错误 RED、隐藏部分失败、或总 exit 替代逐项 oracle
- **test tier / test method**：fullstack / fullstack-slice-testing
- **scenarios / commands / expected exit / oracle**：与 T007 相同；receipt/empty findings/report 不替代完成；命令如上；RED=1，GREEN=0；oracle=ORACLE-P3A
- **fixtures_services**：与 T007 相同
- **coverage limits**：不引入第二事实系统/current selector
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`plan.md#Phase P3`
- **semantic_review_reason**：Phase review is deferred to build-code; this card records the required paired oracle and its future review owner.


##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`in_progress`
- **actual_changes**：修改 bridge、stage-agent-outcome-adapter、stage-runner、stage-handlers 与测试 helper；加入显式 agent/run、proof producer/attempt 绑定、incomplete actor 和 freeze 三 ref 认证；补 lifecycle stale/double-candidate 拒绝。
- **executed_commands**：原四文件 900000ms capture 曾 timeout；随后 actor-binding GREEN 166 passed/1 fixture failure、最终四文件 GREEN 167/167，以及 helper 32/32；lifecycle RED/GREEN 证据另存。
- **evidence_refs**：`quality/tests/P3-T008-final-green.json` sha `dd4557b63bf9224e3611a0e94c2af406f48b0b40851cf0aaf1e48b663f632476`；`quality/tests/P3-T008-helper-consumers.json` sha `99eb6405e6a17f34281c0f514d287bebbff662b6a5ef05c9a6dc3c1f2b9a4dbc`；`quality/tests/P3-T008-actor-binding-green.json` sha `090ddf551c088e6149efa542d18e8e19b7aec37959bf869bd86978d373f6f46d`；`quality/tests/P3-T008-actor-lifecycle-red.json` sha `7d736aa8913561ce5fe10a1036748550ccf2bcb98819993bb032104f791c2b22`。
- **covered_ac**：P3A producer/bridge/fact/status 正反链、显式 actor 和 lifecycle stale/ref 认证已验证；host/provider 可用率与 Phase review未完成。
- **review_fact**：P3 Phase review 待 T012 后；测试 GREEN 不替代独立审查。
- **completed_at**：N/A — P3 Phase review 未完成
- **执行事实**：原 timeout、fixture failure、lifecycle RED 及最终 GREEN 均保留；不删除、不覆盖旧原件。

#### T009 — RED：固定 command/service execution、actor、同次 verify binding、confirmation 与 nested freshness 失败断言

- **ID**：T009
- **Phase**：Phase P3 — 真实 outcome、验收、复盘与状态链
- **goal**：固定 command/service execution、actor、同次 verify binding、confirmation 与 nested freshness 失败断言
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-simplification-20260907/spec.md","hash":"f80eab9a1bf3d7b551976505a024ae0034a001a17d70c3c9d55748167bb6b2a0","id":"SPEC-workflowhub-execution-simplification-20260907"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-simplification-20260907/plan.md","hash":"e25694ea9437de53a15d5504741b4309ea33b3b6103380de372c7a27971970e9","id":"PLAN-workflowhub-execution-simplification-20260907"}]`
- **source_refs / decision_refs**：U5/U7/U12/U13; D5/D8/D10/D12/D14 → FR-ACCEPT-001, FR-OUTCOME-001, FR-PROTECT-001, FR-STATUS-001; AC-ACCEPT-001, AC-ACCEPT-002, AC-OUTCOME-001, AC-PROTECT-001, AC-PROTECT-002, AC-STATUS-001
- **输入**：当前 accepted decision/spec/plan；依赖卡 T008 的真实输出
- **依赖**：T008
- **并行**：否 — producer-before-consumer；同 Phase 共享文件串行
- **FR**：FR-ACCEPT-001, FR-OUTCOME-001, FR-PROTECT-001, FR-STATUS-001
- **AC**：AC-ACCEPT-001, AC-ACCEPT-002, AC-OUTCOME-001, AC-PROTECT-001, AC-PROTECT-002, AC-STATUS-001
- **动作**：新增 command/service 成功、业务失败、空返回、取消、actor/ref/hash/revision 错、同源 reviewer、旧 review、confirmation missing、dispatch count、bug-fix check 捕获原缺陷、非行为变更无需伪 RED、一次 reverse-order sensitivity 断言
- **工程合同**：主动取消使用runOfficialStage第5私有options.signal，ready后AbortController.abort，与timeout分开；原stdout/stderr两严格.bin附件按plan真实bytes/hash读回，覆盖空/非UTF8/缺件/篡改，cleanup.completed须真实child/group/port清理。普通request显式 reviewed_execution={ref,sha256,quality_fact_ref}，host认证fact→wrapper→aggregate后派发；verify invocation沿receipts.review+confirmation，后置现有decision确认绑定ordinary result；confirmation typedfact按现有publisher参数确定ref读取，缺失保持incomplete，不scan latest。固定显式 acceptance_data.execution 的 argv command 与子进程托管 service module/export；source 仅描述。child entries/AC/assertions{id,expected,actual} 由 runtime 比较 JSON 值推导结果，覆盖自报 pass、空/错/重复/遗漏 AC、非零、业务失败、取消与真实清理。聚合沿现有 execution_items 引用每 AC 原件；普通 verify 一次 dispatch/一次 attempt，confirmation 后置 typed fact；incomplete 质量不阻断真实 actor，缺 producer 仍失败。
- **精确文件**：`tests/contract/acceptance-execution-tier.test.mjs`, `tests/contract/verify-code-binding-derivation.test.mjs`, `tests/verify-requirement-replay-contract.test.mjs`, `tests/e2e/vnext-five-stage-current.test.mjs`
- **boundary**：files: `tests/contract/acceptance-execution-tier.test.mjs`, `tests/contract/verify-code-binding-derivation.test.mjs`, `tests/verify-requirement-replay-contract.test.mjs`, `tests/e2e/vnext-five-stage-current.test.mjs`; symbols/regions: privateAcceptanceScenario、acceptanceExecutionFacts/e2eAcceptanceFacts、readCurrentE2eAcceptanceEvidence、nested freshness
- **输出**：固定 command/service execution、actor、同次 verify binding、confirmation 与 nested freshness 失败断言 的可复核实现/测试事实
- **Knowledge**：原件不可变；缺失/partial/failure/unavailable 不推绿；仅本卡边界内修改
- **verification_role**：RED
- **paired_task**：T010
- **gate_cmd**：`npx --no-install vitest run tests/contract/acceptance-execution-tier.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **supplementary_cmd**：`npx --no-install vitest run tests/contract/verify-code-binding-derivation.test.mjs tests/verify-requirement-replay-contract.test.mjs tests/e2e/vnext-five-stage-current.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **capture_partition**：原合并四文件命令的RED/timeout原件只读保留；后续按plan两片完整capture、每片900000ms且同source/tree，原文件/断言范围不变。原合并命令不追认为GREEN。
- **expected_exit**：1
- **oracle**：`ORACLE-P3B {"pass":"ORACLE-P3B: target assertion fails before the paired GREEN change and the same command exits 1; after the paired change it exits 0 with both positive and negative cases.","reject":{"input":"the target behavior fixture described by this task","expected_rejection":"the declared target contract rejects the invalid or missing behavior","observation":"the failure identifies the target assertion rather than setup or unrelated noise"}}`
- **evidence_path**：`quality/tests/P3-T009-execution-simplification.json`（output: `quality/tests/output/P3-T009-execution-simplification.output`）
- **STOP**：命令损坏/空跑、失败信号无关、需弱化断言、越界文件、新产品/行为/接口或新控制面时停止并回 owner material
- **recovery**：build-code 只回滚本卡实现/fixture，保留材料与不可变原件；按 make-decision/build-spec/build-plan 分流
- **task risk**：错误 RED、隐藏部分失败、或总 exit 替代逐项 oracle
- **test tier / test method**：fullstack / fullstack-slice-testing
- **scenarios / commands / expected exit / oracle**：command+service 正例；failure/empty/cancel；unknown AC；stale binding；异源 reviewer；零额外 review dispatch；bug fixture 在修复前准确失败且修复后通过；非行为卡记录理由而非伪 RED；每个高风险 seam 仅一次逆序运行且结果敏感；命令如上；RED=1，GREEN=0；oracle=ORACLE-P3B
- **fixtures_services**：实际子进程 command adapter + 子进程托管真实 service module/export（取消后确认清理）；临时 task root；无 live provider/browser
- **coverage limits**：不覆盖 browser/远程服务；总 exit 不推 20 AC；逆序检查只运行一次并单独留 evidence
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`plan.md#Phase P3`
- **semantic_review_reason**：Phase review is deferred to build-code; this card records the required paired oracle and its future review owner.


##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`in_progress`
- **actual_changes**：固定 command/service execution、actor、同次 verify binding、confirmation 与 nested freshness 的 RED 断言。
- **executed_commands**：本卡原四文件 gate canonical capture exit=0 / child exit=1；4 files：27 failed / 56 passed / 1 skipped（84 total）。
- **evidence_refs**：`quality/tests/P3-T009-execution-simplification.json` sha `c1bef5f4c6e83a92f098bfeb2062c2d4d2915e460c847e0045c3db3634753067`；对应 output 同名 `.output`。
- **covered_ac**：command/service、逐 AC、ordinary review 同次 binding 和 freshness 的目标 RED 已固定；GREEN/Phase review 未完成。
- **review_fact**：P3 Phase review 待 T012 后统一处理。
- **completed_at**：N/A — paired GREEN/Phase review 未完成
- **执行事实**：保留 1 个历史 skipped fixture；T010 生产实现未从 RED 结果推断完成。

#### T010 — GREEN：执行 command/service 并写逐 AC subject，复用普通 verify review 形成当前 E2E binding

- **ID**：T010
- **Phase**：Phase P3 — 真实 outcome、验收、复盘与状态链
- **goal**：执行 command/service 并写逐 AC subject，复用普通 verify review 形成当前 E2E binding
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-simplification-20260907/spec.md","hash":"f80eab9a1bf3d7b551976505a024ae0034a001a17d70c3c9d55748167bb6b2a0","id":"SPEC-workflowhub-execution-simplification-20260907"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-simplification-20260907/plan.md","hash":"e25694ea9437de53a15d5504741b4309ea33b3b6103380de372c7a27971970e9","id":"PLAN-workflowhub-execution-simplification-20260907"}]`
- **source_refs / decision_refs**：U5/U7/U12/U13; D5/D8/D10/D12/D14 → FR-ACCEPT-001, FR-OUTCOME-001, FR-PROTECT-001, FR-STATUS-001; AC-ACCEPT-001, AC-ACCEPT-002, AC-OUTCOME-001, AC-PROTECT-001, AC-PROTECT-002, AC-STATUS-001
- **输入**：当前 accepted decision/spec/plan；依赖卡 T009 的真实输出
- **依赖**：T009
- **并行**：否 — producer-before-consumer；同 Phase 共享文件串行
- **FR**：FR-ACCEPT-001, FR-OUTCOME-001, FR-PROTECT-001, FR-STATUS-001
- **AC**：AC-ACCEPT-001, AC-ACCEPT-002, AC-OUTCOME-001, AC-PROTECT-001, AC-PROTECT-002, AC-STATUS-001
- **动作**：按 tier 执行；actor 仅来自 authenticated build-code outcome；保存 assertions/result/ref/hash/revision/tree；verify 输出直接走 existing writer；freshness 深验 execution/review/confirmation
- **工程合同**：runOfficialStage第5私有options.signal闭包传执行器；execution真实exit_code/signal/timed_out/cancelled、cleanup.status与stdout/stderr_ref/hash按plan枚举。严格acceptance-stdout/stderr-<sha>.bin附件保留空/非UTF8bytes，writer/hash/create-only及实际freshness readRecordBytes；仅新增登记既有kernel rawwriter/CLI rawread区域，不动P1确认逻辑。普通request显式 reviewed_execution={ref,sha256,quality_fact_ref}，host认证fact→wrapper→aggregate后派发；verify invocation沿receipts.review+confirmation，后置现有decision确认绑定ordinary result；confirmation typedfact按现有publisher参数确定ref读取，缺失保持incomplete，不scan latest。reviewed_execution 唯一新写引用为 stage-quality/build-code/acceptance_execution-<rawsha>.json；attempt.schema 精确扩展，acceptance wrapper refs[0] 指同聚合；冻结JSON hash与provider bundle material_id分层验证、同次packet互证不再dispatch。按 plan 的 P3 工程合同严格实现 execution 声明、子进程取消、runtime 断言裁决与各层既有枚举；失败原件保留。逐 AC stage-quality 原件加入 assertions/execution/actor/outcome binding，现有 acceptance_execution 聚合沿 execution_items 引用，不新建 e2e_execution store/subject。普通 verify 同次 create-only writer 写既有 e2e_binding，单 reviewed_execution 指向聚合原件，confirmation 后置；不重复 attempt/dispatch，不补绑旧 review。
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`, `runtime/task/workspace-runner.mjs`, `runtime/task/task-kernel-implementation.mjs`, `tools/cli/stage-runtime.mjs`, `runtime/review/review-record-route.mjs`, `runtime/review/schemas/attempt.schema.json`, `runtime/stage/stage-runner.mjs`, `runtime/stage/stage-handlers.mjs`, `runtime/evidence/freshness.mjs`, `runtime/evidence/canonical-evidence-validators.mjs`, `tests/contract/acceptance-execution-tier.test.mjs`, `tests/contract/verify-code-binding-derivation.test.mjs`, `tests/verify-requirement-replay-contract.test.mjs`, `tests/e2e/vnext-five-stage-current.test.mjs`, `skills/wh-review/scripts/simple-review-runner.mjs`
- **boundary**：files: `runtime/stage/stage-content-contracts.mjs`, `runtime/task/workspace-runner.mjs`, `runtime/task/task-kernel-implementation.mjs`, `tools/cli/stage-runtime.mjs`, `runtime/review/review-record-route.mjs`, `runtime/review/schemas/attempt.schema.json`, `runtime/stage/stage-runner.mjs`, `runtime/stage/stage-handlers.mjs`, `runtime/evidence/freshness.mjs`, `runtime/evidence/canonical-evidence-validators.mjs`, `tests/contract/acceptance-execution-tier.test.mjs`, `tests/contract/verify-code-binding-derivation.test.mjs`, `tests/verify-requirement-replay-contract.test.mjs`, `tests/e2e/vnext-five-stage-current.test.mjs`, `skills/wh-review/scripts/simple-review-runner.mjs`; symbols/regions: acceptance_data.execution projection、workspace argv/service adapter、ordinary verify binding preparation、privateAcceptanceScenario、readCurrentE2eAcceptanceEvidence、acceptance/e2e facts、tier-specific freshness、resolveSimpleReviewRouteIdentity只读selection返回
- **输出**：执行 command/service 并写逐 AC subject，复用普通 verify review 形成当前 E2E binding 的可复核实现/测试事实
- **Knowledge**：原件不可变；缺失/partial/failure/unavailable 不推绿；仅本卡边界内修改
- **verification_role**：GREEN
- **paired_task**：T009
- **gate_cmd**：`npx --no-install vitest run tests/contract/acceptance-execution-tier.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **supplementary_cmd**：`npx --no-install vitest run tests/contract/verify-code-binding-derivation.test.mjs tests/verify-requirement-replay-contract.test.mjs tests/e2e/vnext-five-stage-current.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **capture_partition**：原合并四文件命令的RED/timeout原件只读保留；后续按plan两片完整capture、每片900000ms且同source/tree，原文件/断言范围不变。原合并命令不追认为GREEN。
- **expected_exit**：0
- **oracle**：`ORACLE-P3B {"pass":"ORACLE-P3B: the same command exits 0 after the paired RED case is fixed and both positive and negative cases remain observable."}`
- **evidence_path**：`quality/tests/P3-T010-execution-simplification.json`（output: `quality/tests/output/P3-T010-execution-simplification.output`）
- **STOP**：命令损坏/空跑、失败信号无关、需弱化断言、越界文件、新产品/行为/接口或新控制面时停止并回 owner material
- **recovery**：build-code 只回滚本卡实现/fixture，保留材料与不可变原件；按 make-decision/build-spec/build-plan 分流
- **task risk**：错误 RED、隐藏部分失败、或总 exit 替代逐项 oracle
- **test tier / test method**：fullstack / fullstack-slice-testing
- **scenarios / commands / expected exit / oracle**：与 T009 相同；execute 不批量覆盖 unknown；旧 canonical review 不补绑；命令如上；RED=1，GREEN=0；oracle=ORACLE-P3B
- **fixtures_services**：与 T009 相同
- **coverage limits**：本任务 non_ui；browser 明确 N/A
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`plan.md#Phase P3`
- **semantic_review_reason**：Phase review is deferred to build-code; this card records the required paired oracle and its future review owner.


##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`in_progress`
- **actual_changes**：接通 command/service 严格投影、认证 argv/service 子进程执行、真实 incomplete actor、逐 AC JSON/原 bytes/aggregate、普通 review 派发前认证与同次 binding、后置 typed confirmation freshness。
- **executed_commands**：分片正式 GREEN：acceptance 55/55 passed；consumers 32 passed / 1 historical skipped；原四文件合计 87 passed / 1 skipped。历史合并 capture timeout 原件保留。
- **evidence_refs**：`quality/tests/P3-T010-acceptance-green.json` sha `14172730b0441b9c11ae1cd2bb5d1e86e3bd305cf5c830c5061f89800b0b45a6`；`quality/tests/P3-T010-consumers-green.json` sha `d918f889cbb19987f8530922a06cf2cb3fe6231b0f1013cb0dfac463362f2c9d`；原 `quality/tests/P3-T010-execution-simplification.json` 保留。
- **covered_ac**：ORACLE-P3B command/service、per-AC、same-verify binding、nested freshness 正反例已执行；historical skip 保持 skipped，不推为 pass。
- **review_fact**：P3 Phase review 待 T012 后；测试 evidence 不替代 ordinary independent review。
- **completed_at**：N/A — P3 Phase review 未完成
- **执行事实**：A/B 分片使用同一 frozen source/tree；旧 combined timeout 不覆盖；未额外 dispatch 第二次普通 review。

#### T011 — RED：固定 reflection A→A/A→B、旧 ref 回读、缺 executor/judgment、usage attempt 层级与并发失败断言

- **ID**：T011
- **Phase**：Phase P3 — 真实 outcome、验收、复盘与状态链
- **goal**：固定 reflection A→A/A→B、旧 ref 回读、缺 executor/judgment、usage attempt 层级与并发失败断言
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-simplification-20260907/spec.md","hash":"f80eab9a1bf3d7b551976505a024ae0034a001a17d70c3c9d55748167bb6b2a0","id":"SPEC-workflowhub-execution-simplification-20260907"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-simplification-20260907/plan.md","hash":"e25694ea9437de53a15d5504741b4309ea33b3b6103380de372c7a27971970e9","id":"PLAN-workflowhub-execution-simplification-20260907"}]`
- **source_refs / decision_refs**：U6/U12/U13; D6/D8/D13/D14 → FR-REFLECT-001, FR-LIFECYCLE-001, FR-PROTECT-001, FR-STATUS-001; AC-REFLECT-001, AC-LIFECYCLE-002, AC-USAGE-001, AC-STATUS-001, AC-PROTECT-004
- **输入**：当前 accepted decision/spec/plan；依赖卡 T010 的真实输出
- **依赖**：T010
- **并行**：否 — producer-before-consumer；同 Phase 共享文件串行
- **FR**：FR-REFLECT-001, FR-LIFECYCLE-001, FR-PROTECT-001, FR-STATUS-001
- **AC**：AC-REFLECT-001, AC-LIFECYCLE-002, AC-USAGE-001, AC-STATUS-001, AC-PROTECT-004
- **动作**：新增 A 首次/A 重试/B 新 ref、lesson 不重复、report 回读、write/merge failure、usage present/absent/failed/reused 断言
- **精确文件**：`tests/contract/stage-reflect.test.mjs`, `tests/contract/stage-runner-reflection.test.mjs`, `tests/contract/stage-runner-on-stage-end.test.mjs`, `tests/e2e/stage-reflect-real-chain.test.mjs`, `tests/integration/quality-store-concurrency.test.mjs`
- **boundary**：files: `tests/contract/stage-reflect.test.mjs`, `tests/contract/stage-runner-reflection.test.mjs`, `tests/contract/stage-runner-on-stage-end.test.mjs`, `tests/e2e/stage-reflect-real-chain.test.mjs`, `tests/integration/quality-store-concurrency.test.mjs`; symbols/regions: publishStageReflection、runner explicit ref、validators/report/lesson consumers、validateReviewAttemptObservation
- **输出**：固定 reflection A→A/A→B、旧 ref 回读、缺 executor/judgment、usage attempt 层级与并发失败断言 的可复核实现/测试事实
- **Knowledge**：原件不可变；缺失/partial/failure/unavailable 不推绿；仅本卡边界内修改
- **verification_role**：RED
- **paired_task**：T012
- **gate_cmd**：`npx --no-install vitest run tests/contract/stage-reflect.test.mjs tests/contract/stage-runner-reflection.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs tests/e2e/stage-reflect-real-chain.test.mjs tests/integration/quality-store-concurrency.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-P3C {"pass":"ORACLE-P3C: target assertion fails before the paired GREEN change and the same command exits 1; after the paired change it exits 0 with both positive and negative cases.","reject":{"input":"the target behavior fixture described by this task","expected_rejection":"the declared target contract rejects the invalid or missing behavior","observation":"the failure identifies the target assertion rather than setup or unrelated noise"}}`
- **evidence_path**：`quality/tests/P3-T011-execution-simplification.json`（output: `quality/tests/output/P3-T011-execution-simplification.output`）
- **STOP**：命令损坏/空跑、失败信号无关、需弱化断言、越界文件、新产品/行为/接口或新控制面时停止并回 owner material
- **recovery**：build-code 只回滚本卡实现/fixture，保留材料与不可变原件；按 make-decision/build-spec/build-plan 分流
- **task risk**：错误 RED、隐藏部分失败、或总 exit 替代逐项 oracle
- **test tier / test method**：fullstack / fullstack-slice-testing
- **scenarios / commands / expected exit / oracle**：A/A/B；旧 fixed ref；executor missing；half-write/lesson failure；usage null/present/timed/untimed/reused；命令如上；RED=1，GREEN=0；oracle=ORACLE-P3C
- **fixtures_services**：mkdtemp task root；Promise 并发；deterministic fault injection；fake attempt refs
- **coverage limits**：单机 FS；不回填历史 usage/精确费用
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`plan.md#Phase P3`
- **semantic_review_reason**：Phase review is deferred to build-code; this card records the required paired oracle and its future review owner.


##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`in_progress`
- **actual_changes**：固定 reflection A→A/A→B、旧 ref 回读、缺 executor/judgment、usage attempt 层级与并发失败断言；修正 fixture 后保持真实 fixed-ref 和错 attempt 失败路径。
- **executed_commands**：首轮正式 RED 25 failed/27 passed；fixture-corrected RED 25 target failed/27 passed，52 total，131.75s。
- **evidence_refs**：`quality/tests/P3-T011-fixture-corrected-red.json` sha `823b5da7ac844da231c72a173bab00672ff7ffafcefba5bfa37770bc2b836fa4`；原 `quality/tests/P3-T011-execution-simplification.json` sha `88805aad8dbe01e45c136d5517292c363454555b79d16e0c2ad272ce5a8c73d4`。
- **covered_ac**：A/A reuse、A/B new ref、old fixed read-only、missing executor/judgment、usage wrong-attempt 与 concurrency RED 已固定；GREEN/Phase review 未完成。
- **review_fact**：P3 Phase review 待 T012 后统一处理。
- **completed_at**：N/A — paired GREEN/Phase review 未完成
- **执行事实**：fixture noise 与级联失败原件均保留；不以 RED 的失败数推导功能完成。

#### T012 — GREEN：reflection 新写内容 ref且显式传递，旧 fixed ref 只读；usage 经认证 attempt_ref 回读

- **ID**：T012
- **Phase**：Phase P3 — 真实 outcome、验收、复盘与状态链
- **goal**：reflection 新写内容 ref且显式传递，旧 fixed ref 只读；usage 经认证 attempt_ref 回读
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-simplification-20260907/spec.md","hash":"f80eab9a1bf3d7b551976505a024ae0034a001a17d70c3c9d55748167bb6b2a0","id":"SPEC-workflowhub-execution-simplification-20260907"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-simplification-20260907/plan.md","hash":"e25694ea9437de53a15d5504741b4309ea33b3b6103380de372c7a27971970e9","id":"PLAN-workflowhub-execution-simplification-20260907"}]`
- **source_refs / decision_refs**：U6/U12/U13; D6/D8/D13/D14 → FR-REFLECT-001, FR-LIFECYCLE-001, FR-PROTECT-001, FR-STATUS-001; AC-REFLECT-001, AC-LIFECYCLE-002, AC-USAGE-001, AC-STATUS-001, AC-PROTECT-004
- **输入**：当前 accepted decision/spec/plan；依赖卡 T011 的真实输出
- **依赖**：T011
- **并行**：否 — producer-before-consumer；同 Phase 共享文件串行
- **FR**：FR-REFLECT-001, FR-LIFECYCLE-001, FR-PROTECT-001, FR-STATUS-001
- **AC**：AC-REFLECT-001, AC-LIFECYCLE-002, AC-USAGE-001, AC-STATUS-001, AC-PROTECT-004
- **动作**：新 ref quality/stage-reflection/<stage>/<semantic-key>.json（key 与 raw bytes sha 分层，按 plan 工程澄清）；runner/fact/report/lesson 沿显式 ref；A→A 复用、A→B 新建；缺真实 executor/run/判断 unavailable；result consumer validate attempt_ref 后读 attempt.provider_attempts[].execution.usage/timing
- **精确文件**：`runtime/stage/stage-reflect.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/stage/stage-handlers.mjs`, `runtime/evidence/canonical-evidence-validators.mjs`, `runtime/evidence/stage-content-evidence.mjs`, `tools/cli/append-lesson-observation.mjs`, `tools/cli/validate-stage-reflection.mjs`, `tools/cli/build-reflection-page.mjs`, `tests/contract/stage-reflect.test.mjs`, `tests/contract/stage-runner-reflection.test.mjs`, `tests/contract/stage-runner-on-stage-end.test.mjs`, `tests/e2e/stage-reflect-real-chain.test.mjs`, `tests/integration/quality-store-concurrency.test.mjs`, `tests/contract/freeze-classification-budget-usage-protocol.test.mjs`
- **boundary**：files: `runtime/stage/stage-reflect.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/stage/stage-handlers.mjs`, `runtime/evidence/canonical-evidence-validators.mjs`, `runtime/evidence/stage-content-evidence.mjs`, `tools/cli/append-lesson-observation.mjs`, `tools/cli/validate-stage-reflection.mjs`, `tools/cli/build-reflection-page.mjs`, `tests/contract/stage-reflect.test.mjs`, `tests/contract/stage-runner-reflection.test.mjs`, `tests/contract/stage-runner-on-stage-end.test.mjs`, `tests/e2e/stage-reflect-real-chain.test.mjs`, `tests/integration/quality-store-concurrency.test.mjs`, `tests/contract/freeze-classification-budget-usage-protocol.test.mjs`; symbols/regions: reflection writer/ref regex/readers、lesson/report input、usage attempt traversal、missing-usage直接消费者fixture
- **输出**：reflection 新写内容 ref且显式传递，旧 fixed ref 只读；usage 经认证 attempt_ref 回读 的可复核实现/测试事实
- **Knowledge**：原件不可变；缺失/partial/failure/unavailable 不推绿；仅本卡边界内修改
- **verification_role**：GREEN
- **paired_task**：T011
- **gate_cmd**：`npx --no-install vitest run tests/contract/stage-reflect.test.mjs tests/contract/stage-runner-reflection.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs tests/e2e/stage-reflect-real-chain.test.mjs tests/integration/quality-store-concurrency.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **supplementary_cmd**：`npx --no-install vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；直接观察函数consumer fixture同步，其他P1/P2断言保留。
- **expected_exit**：0
- **oracle**：`ORACLE-P3C {"pass":"ORACLE-P3C: the same command exits 0 after the paired RED case is fixed and both positive and negative cases remain observable."}`
- **evidence_path**：`quality/tests/P3-T012-execution-simplification.json`（output: `quality/tests/output/P3-T012-execution-simplification.output`）
- **STOP**：命令损坏/空跑、失败信号无关、需弱化断言、越界文件、新产品/行为/接口或新控制面时停止并回 owner material
- **recovery**：build-code 只回滚本卡实现/fixture，保留材料与不可变原件；按 make-decision/build-spec/build-plan 分流
- **task risk**：错误 RED、隐藏部分失败、或总 exit 替代逐项 oracle
- **test tier / test method**：fullstack / fullstack-slice-testing
- **scenarios / commands / expected exit / oracle**：与 T011 相同；missing 不继承旧 A/不补0；命令如上；RED=1，GREEN=0；oracle=ORACLE-P3C
- **fixtures_services**：与 T011 相同
- **coverage limits**：不扫描目录选 latest、不双写 fixed ref
- **phase_review**：`{"stage":"build-code","review_scope":"phase","subject_kind":"phase","phase_id":"P3","packet_requires":["approved_spec","acceptance_criteria","test_evidence","changed_files","snapshot_tree"],"command":"node skills/wh-review/scripts/wh-review-cli.mjs run quality/reviews/requests/P3-phase-review.json","result_ref_pattern":"quality/reviews/results/<content-hash>.json","finding_owner":"current build-code main agent","unavailable_semantics":"preserve unavailable; local repair may continue; phase quality cannot be claimed"}`
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`plan.md#Phase P3`
- **semantic_review_reason**：Phase review is deferred to build-code; this card records the required paired oracle and its future review owner.


##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`in_progress`
- **actual_changes**：reflection v2 新写按唯一显式 canonical outcome ref 认证；semantic key 同意图复用原 bytes/ref/time，变化意图新建；旧 fixed ref 只读；runner/handler/report/lesson 传递实际 ref/hash；usage 只读 canonical attempt.provider_attempts[].execution.usage/timing，缺失不补零。
- **executed_commands**：正式五文件命令 53/53 passed，196.56s；usage supplementary 28/28 passed，535ms；均 canonical capture。
- **evidence_refs**：`quality/tests/P3-T012-diagnostic-fixed-green.json` sha `10b38afa81b89d33c8cbadeb16295aa3c701b525f47571d673b000f2437a2378`；`quality/tests/P3-T012-usage-supplement-green.json` sha `d42825e772a68eec16c78ce6eb7813bd04316c31d1cb5a8870bd7252829eaa8b`；两次 output 同名 `.output`。
- **covered_ac**：ORACLE-P3C reflection/lifecycle/usage 正反链及直接 usage consumer 已执行；不替代 P3 Phase 独立审查或最终 all-AC 验收。
- **review_fact**：P3 Phase review 必须经既有 wh-review 路径记录；当前仍是 pending/unavailable，不能称质量通过。
- **completed_at**：N/A — implementation/test complete，Phase review 未完成
- **执行事实**：此前 timeout、intervention fixed failure 与最终 GREEN 原件全部保留；所有 capture/wrapper/npm/Vitest 进程已退出。

#### T013 — RED：固定五阶段真实 review、acceptance、reflection 与失败传播

- **ID**：T013
- **Phase**：Phase P4 — 五阶段技能与合同同步
- **goal**：用 consumer-level 断言固定五阶段仍执行真实 review、acceptance、reflection 与失败路径
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-simplification-20260907/spec.md","hash":"f80eab9a1bf3d7b551976505a024ae0034a001a17d70c3c9d55748167bb6b2a0","id":"SPEC-workflowhub-execution-simplification-20260907"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-simplification-20260907/plan.md","hash":"e25694ea9437de53a15d5504741b4309ea33b3b6103380de372c7a27971970e9","id":"PLAN-workflowhub-execution-simplification-20260907"}]`
- **source_refs / decision_refs**：R1–R6/U1–U13; D1–D14 → all 13 FR; all 20 AC
- **输入**：当前 accepted decision/spec/plan；依赖卡 T012 的真实输出
- **依赖**：T012
- **并行**：否 — producer-before-consumer；同 Phase 共享文件串行
- **FR**：all 13 FR
- **AC**：all 20 AC
- **动作**：先只加 consumer-level 失败断言：不存在未来材料前置；build-code phase review/verify acceptance/on-stage-end reflection 都必须走真实 producer；删除字段不得让缺失事实变 success
- **精确文件**：`tests/contract/workflow-synchronization-consumer.test.mjs`
- **planned_workflow_files**：`workflows/make-decision/SKILL.md`, `workflows/make-decision/steps.json`, `workflows/make-decision/skill-deps.yaml`, `workflows/build-spec/SKILL.md`, `workflows/build-spec/steps.json`, `workflows/build-spec/skill-deps.yaml`, `workflows/build-plan/SKILL.md`, `workflows/build-plan/steps.json`, `workflows/build-plan/skill-deps.yaml`, `workflows/build-code/SKILL.md`, `workflows/build-code/steps.json`, `workflows/build-code/skill-deps.yaml`, `workflows/verify-code/SKILL.md`, `workflows/verify-code/steps.json`, `workflows/verify-code/skill-deps.yaml`, `skills/spec-plan/templates/plan-template.md`, `skills/spec-tasks/templates/tasks-template.md`
- **boundary**：files: `tests/contract/workflow-synchronization-consumer.test.mjs`; symbols/regions: workflow producer/consumer invocation and failure propagation assertions
- **输出**：同步五阶段技能、steps、deps 和模板到最终真实接口 的可复核实现/测试事实
- **Knowledge**：原件不可变；缺失/partial/failure/unavailable 不推绿；仅本卡边界内修改
- **verification_role**：RED
- **paired_task**：T014
- **gate_cmd**：`npx --no-install vitest run tests/contract/workflow-synchronization-consumer.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-P4 {"pass":"ORACLE-P4: target assertion fails before the paired GREEN change and the same command exits 1; after the paired change it exits 0 with both positive and negative cases.","reject":{"input":"the target behavior fixture described by this task","expected_rejection":"the declared target contract rejects the invalid or missing behavior","observation":"the failure identifies the target assertion rather than setup or unrelated noise"}}`
- **evidence_path**：`quality/tests/P4-T013-execution-simplification.json`（output: `quality/tests/output/P4-T013-execution-simplification.output`）
- **STOP**：命令损坏/空跑、失败信号无关、需弱化断言、越界文件、新产品/行为/接口或新控制面时停止并回 owner material
- **recovery**：build-code 只回滚本卡实现/fixture，保留材料与不可变原件；按 make-decision/build-spec/build-plan 分流
- **task risk**：错误 RED、隐藏部分失败、或总 exit 替代逐项 oracle
- **test tier / test method**：fullstack / consumer contract testing
- **scenarios / commands / expected exit / oracle**：五阶段 closure；不存在未来材料前置；每 Phase review/验收/复盘仍在；无新 public action；命令如上；RED=1，GREEN=0；oracle=ORACLE-P4
- **fixtures_services**：无服务；读取 P3 的最终符号和 fixture；不执行 provider
- **coverage limits**：证明 workflow 对真实 producer/consumer 的调用与失败传播；provider 可用率仍不在范围
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`plan.md#Phase P4`
- **semantic_review_reason**：Phase review is deferred to build-code; this card records the required paired oracle and its future review owner.


##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`in_progress`
- **actual_changes**：新增唯一 T013 consumer-level 测试，覆盖真实 runStage/command-service/verify/reflection fixture；未修改五阶段 workflow materials。
- **executed_commands**：纠正后的 canonical RED capture exit=0 / child exit=1，12 tests：5 条精确 reflection content-ref failure、7 passed，55.61s。
- **evidence_refs**：`quality/tests/P4-T013-fixture-corrected-red.json` sha `a2e720040a572c3dffe558b38d13baeab1981dc0af514fc7fa021a2e9c261b41`；output sha `f88ce726d92f18cacd405ecf17042b8270d3ab19a5b35b0f76e4de744418f6a1`。
- **covered_ac**：ORACLE-P4 RED 固定五阶段 steps 写死 `<stage>.json`、无法消费实际 `stage/<semantic-key>.json`；command/service 与 verify fixture 穿透，未改生产。
- **review_fact**：N/A — RED 随 paired GREEN 的 Phase review。
- **completed_at**：N/A — paired GREEN/P4 review 未完成
- **执行事实**：首轮混合 fixture RED 原件保留；纠正后只剩五个目标 failure，未绕过 handler。

#### T014 — GREEN：同步五阶段技能、steps、deps 和模板到真实 producer/consumer

- **ID**：T014
- **Phase**：Phase P4 — 五阶段技能与合同同步
- **goal**：同步五阶段 skill/steps/deps/templates，使 consumer-level RED 通过且失败事实保持可见
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-simplification-20260907/spec.md","hash":"f80eab9a1bf3d7b551976505a024ae0034a001a17d70c3c9d55748167bb6b2a0","id":"SPEC-workflowhub-execution-simplification-20260907"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-simplification-20260907/plan.md","hash":"e25694ea9437de53a15d5504741b4309ea33b3b6103380de372c7a27971970e9","id":"PLAN-workflowhub-execution-simplification-20260907"}]`
- **source_refs / decision_refs**：R1–R6/U1–U13; D1–D14 → all 13 FR; all 20 AC
- **输入**：当前 accepted decision/spec/plan；依赖卡 T013 的真实输出
- **依赖**：T013
- **并行**：否 — producer-before-consumer；同 Phase 共享文件串行
- **FR**：all 13 FR
- **AC**：all 20 AC
- **动作**：逐文件更新 owner、输入、输出、STOP 与真实 review/acceptance/reflection 调用；删除重复手填 executed/技能名证明；保留用户指定质量步骤；用 T013 原断言验证实际 dispatch/evidence/failure 行为
- **精确文件**：`tests/contract/workflow-synchronization-consumer.test.mjs`, `workflows/make-decision/SKILL.md`, `workflows/make-decision/steps.json`, `workflows/make-decision/skill-deps.yaml`, `workflows/build-spec/SKILL.md`, `workflows/build-spec/steps.json`, `workflows/build-spec/skill-deps.yaml`, `workflows/build-plan/SKILL.md`, `workflows/build-plan/steps.json`, `workflows/build-plan/skill-deps.yaml`, `workflows/build-code/SKILL.md`, `workflows/build-code/steps.json`, `workflows/build-code/skill-deps.yaml`, `workflows/verify-code/SKILL.md`, `workflows/verify-code/steps.json`, `workflows/verify-code/skill-deps.yaml`, `skills/spec-plan/templates/plan-template.md`, `skills/spec-tasks/templates/tasks-template.md`
- **planned_workflow_files**：`workflows/make-decision/SKILL.md`, `workflows/make-decision/steps.json`, `workflows/make-decision/skill-deps.yaml`, `workflows/build-spec/SKILL.md`, `workflows/build-spec/steps.json`, `workflows/build-spec/skill-deps.yaml`, `workflows/build-plan/SKILL.md`, `workflows/build-plan/steps.json`, `workflows/build-plan/skill-deps.yaml`, `workflows/build-code/SKILL.md`, `workflows/build-code/steps.json`, `workflows/build-code/skill-deps.yaml`, `workflows/verify-code/SKILL.md`, `workflows/verify-code/steps.json`, `workflows/verify-code/skill-deps.yaml`, `skills/spec-plan/templates/plan-template.md`, `skills/spec-tasks/templates/tasks-template.md`
- **boundary**：files: `tests/contract/workflow-synchronization-consumer.test.mjs`, `workflows/make-decision/SKILL.md`, `workflows/make-decision/steps.json`, `workflows/make-decision/skill-deps.yaml`, `workflows/build-spec/SKILL.md`, `workflows/build-spec/steps.json`, `workflows/build-spec/skill-deps.yaml`, `workflows/build-plan/SKILL.md`, `workflows/build-plan/steps.json`, `workflows/build-plan/skill-deps.yaml`, `workflows/build-code/SKILL.md`, `workflows/build-code/steps.json`, `workflows/build-code/skill-deps.yaml`, `workflows/verify-code/SKILL.md`, `workflows/verify-code/steps.json`, `workflows/verify-code/skill-deps.yaml`, `skills/spec-plan/templates/plan-template.md`, `skills/spec-tasks/templates/tasks-template.md`; symbols/regions: each workflow real producer/consumer invocation, failure propagation, templates
- **输出**：同步五阶段技能、steps、deps 和模板到最终真实接口 的可复核实现/测试事实
- **Knowledge**：原件不可变；缺失/partial/failure/unavailable 不推绿；仅本卡边界内修改
- **verification_role**：GREEN
- **paired_task**：T013
- **gate_cmd**：`npx --no-install vitest run tests/contract/workflow-synchronization-consumer.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-P4 {"pass":"ORACLE-P4: the same command exits 0 after the paired RED case is fixed and both positive and negative cases remain observable."}`
- **evidence_path**：`quality/tests/P4-T014-execution-simplification.json`（output: `quality/tests/output/P4-T014-execution-simplification.output`）
- **STOP**：命令损坏/空跑、失败信号无关、需弱化断言、越界文件、新产品/行为/接口或新控制面时停止并回 owner material
- **recovery**：build-code 只回滚本卡实现/fixture，保留材料与不可变原件；按 make-decision/build-spec/build-plan 分流
- **task risk**：错误 RED、隐藏部分失败、或总 exit 替代逐项 oracle
- **test tier / test method**：fullstack / consumer contract testing
- **scenarios / commands / expected exit / oracle**：五阶段 closure；不存在未来材料前置；每 Phase review/验收/复盘仍在；无新 public action；命令如上；RED=1，GREEN=0；oracle=ORACLE-P4
- **fixtures_services**：无服务；读取 P3 的最终符号和 fixture；不执行 provider
- **coverage limits**：证明 workflow 对真实 producer/consumer 的调用与失败传播；provider 可用率仍不在范围
- **phase_review**：`{"stage":"build-code","review_scope":"phase","subject_kind":"phase","phase_id":"P4","packet_requires":["approved_spec","acceptance_criteria","test_evidence","changed_files","snapshot_tree"],"command":"node skills/wh-review/scripts/wh-review-cli.mjs run quality/reviews/requests/P4-phase-review.json","result_ref_pattern":"quality/reviews/results/<content-hash>.json","finding_owner":"current build-code main agent","unavailable_semantics":"preserve unavailable; local repair may continue; phase quality cannot be claimed"}`
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`plan.md#Phase P4`
- **semantic_review_reason**：Phase review is deferred to build-code; this card records the required paired oracle and its future review owner.


##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`in_progress`
- **actual_changes**：按不重叠 A/B/C groups 同步五阶段 15 份 SKILL/steps/deps 与两份模板到真实 review/acceptance/reflection/confirmation producer/consumer；不新增技能/控制面。
- **executed_commands**：原 gate 12/12 passed，55.43s；review repair 后同一 gate 12/12 passed，57.66s。
- **evidence_refs**：原 `quality/tests/P4-T014-execution-simplification.json` sha `113f193e43812e9e04cc3b89a11c4346d78de5ae5d618ec48d855466ce01bb91`；repair `quality/tests/P4-T014-review-repairs-green.json` sha `98758d7d16f3b76b1c077afbf2a365aa69a8ef1a9d942de12c32e19b65c3cf94`，output sha `83c740938e43435d1cec4f5de25968030e6f082b37e1b5b5cc0c26c556c22a4c`。
- **covered_ac**：ORACLE-P4 GREEN 验证 workflow runner/reflection content ref、command/service acceptance、verify preconditions 与失败传播；不代表 provider 可用率或全任务验收。
- **review_fact**：初始 P4 partial review 的有效 findings 已修复；focused 复核在 dispatch 前以 `REVIEW_RETRY_BUDGET_EXHAUSTED` 拒绝，P4 quality 保持 partial。
- **completed_at**：N/A — P4 focused review 未完成
- **执行事实**：T013 RED 与首轮 GREEN 原件均保留；三个 writer 仅改互不重叠文件组，capture/wrapper/npm/Vitest 已退出。

#### T015 — RED：固定 release/bundle/catalog/install/tamper/fixture 隔离缺口

- **ID**：T015
- **Phase**：Phase P5 — 分发、安装与隔离
- **goal**：固定 release/bundle/catalog/install/tamper/fixture 隔离缺口
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-simplification-20260907/spec.md","hash":"f80eab9a1bf3d7b551976505a024ae0034a001a17d70c3c9d55748167bb6b2a0","id":"SPEC-workflowhub-execution-simplification-20260907"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-simplification-20260907/plan.md","hash":"e25694ea9437de53a15d5504741b4309ea33b3b6103380de372c7a27971970e9","id":"PLAN-workflowhub-execution-simplification-20260907"}]`
- **source_refs / decision_refs**：D9/D11/D14 → FR-COMPAT-001, FR-PROTECT-001; AC-COMPAT-001, AC-PROTECT-001, AC-PROTECT-002, AC-PROTECT-003, AC-PROTECT-004
- **输入**：当前 accepted decision/spec/plan；依赖卡 T014 的真实输出
- **依赖**：T014
- **并行**：否 — producer-before-consumer；同 Phase 共享文件串行
- **FR**：FR-COMPAT-001, FR-PROTECT-001
- **AC**：AC-COMPAT-001, AC-PROTECT-001, AC-PROTECT-002, AC-PROTECT-003, AC-PROTECT-004
- **动作**：加入新 imports/refs closure、漏件/tamper preflight、blocked/reused、真实配置隔离断言
- **精确文件**：`tests/contract/repo-skills-manifest.test.mjs`, `tests/integration/distribution-closure.test.mjs`, `tests/integration/runner-clean-install.test.mjs`, `scripts/__tests__/smoke-local-skill-dispatch.test.mjs`, `core/__tests__/check-skill-closure.test.mjs`, `tests/integration/mutation-guards.test.mjs`
- **boundary**：files: `tests/contract/repo-skills-manifest.test.mjs`, `tests/integration/distribution-closure.test.mjs`, `tests/integration/runner-clean-install.test.mjs`, `scripts/__tests__/smoke-local-skill-dispatch.test.mjs`, `core/__tests__/check-skill-closure.test.mjs`, `tests/integration/mutation-guards.test.mjs`; symbols/regions: repo skills manifest producer/reader、runner release closure、skill bundle closure、clean install sandbox
- **输出**：固定 release/bundle/catalog/install/tamper/fixture 隔离缺口 的可复核实现/测试事实
- **Knowledge**：原件不可变；缺失/partial/failure/unavailable 不推绿；仅本卡边界内修改
- **verification_role**：RED
- **paired_task**：T016
- **gate_cmd**：`npx --no-install vitest run tests/contract/repo-skills-manifest.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs scripts/__tests__/smoke-local-skill-dispatch.test.mjs core/__tests__/check-skill-closure.test.mjs tests/integration/mutation-guards.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-P5 {"pass":"ORACLE-P5: target assertion fails before the paired GREEN change and the same command exits 1; after the paired change it exits 0 with both positive and negative cases.","reject":{"input":"the target behavior fixture described by this task","expected_rejection":"the declared target contract rejects the invalid or missing behavior","observation":"the failure identifies the target assertion rather than setup or unrelated noise"}}`
- **evidence_path**：`quality/tests/P5-T015-execution-simplification.json`（output: `quality/tests/output/P5-T015-execution-simplification.output`）
- **STOP**：命令损坏/空跑、失败信号无关、需弱化断言、越界文件、新产品/行为/接口或新控制面时停止并回 owner material
- **recovery**：build-code 只回滚本卡实现/fixture，保留材料与不可变原件；按 make-decision/build-spec/build-plan 分流
- **task risk**：错误 RED、隐藏部分失败、或总 exit 替代逐项 oracle
- **test tier / test method**：fullstack / fullstack-slice-testing
- **scenarios / commands / expected exit / oracle**：valid closure；missing/tamper；blocked/reused；same/different stable key；clean install；命令如上；RED=1，GREEN=0；oracle=ORACLE-P5
- **fixtures_services**：mkdtemp HOME/CODEX_HOME/task/config/sink；symlink/tamper/half-write；清理全部 temp
- **coverage limits**：不发布 registry，不做全仓隔离审计
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`plan.md#Phase P5`
- **semantic_review_reason**：Phase review is deferred to build-code; this card records the required paired oracle and its future review owner.


##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`in_progress`
- **actual_changes**：固定 release/bundle/catalog/install/tamper/fixture 隔离缺口；只在本卡登记范围修改，未新增 public command、store、schema 或 control plane。
- **executed_commands**：修正 RED 同一六文件命令 exit=1，59 tests，47 passed/12 target failures。
- **evidence_refs**：`quality/tests/P5-T015-corrected-red.json` sha `d742ca6e31066f850734a9a2e45b8d2f9319ed4b196787fa4df6c0255de195e5`；output sha `69e8f61aff4c83b16b02f82dc99b78788c4ce4827ebbd656e884b9ed9038906e`；旧 noisy RED 也保留。
- **covered_ac**：bundle SHA/closure、manifest drift、installer env 的目标缺口已固定；T016 GREEN 与 P5 review 未完成。
- **review_fact**：N/A — RED 随 paired GREEN 的 Phase review。
- **completed_at**：N/A — paired GREEN/P5 review 未完成
- **执行事实**：修正 RED 只保留目标 failure，无空跑/fixture 噪声；不把 RED 当作质量结论。

#### T016 — GREEN：同步 runner/skill bundle 非静态资源和 catalog，使 clean install 只用声明依赖

- **ID**：T016
- **Phase**：Phase P5 — 分发、安装与隔离
- **goal**：同步 runner/skill bundle 非静态资源和 catalog，使 clean install 只用声明依赖
- **design_state**：ready
- **Phase Card**：本卡只改三组已登记边界：A=`skills/spec-plan/skill-bundle.json`, `skills/spec-tasks/skill-bundle.json`, `skills/wh-review/skill-bundle.json`, `skills/catalog.yaml`, `repo-skills.manifest.json` 的既存 hash/manifest 数据；B=`runtime/distribution/runner-release.mjs` 的 release 闭包与安装前 env/漏件校验；C=`runtime/distribution/skill-bundle-release.mjs` 的发布闭包与漏件校验。目标 AC 为 COMPAT-001、PROTECT-001..004；测试路由为本卡六文件同一 RED/GREEN 命令。非目标是公共命令、真实 provider/config/sink、未登记清理工具、历史原件和新增控制面；若发现需扩边界则停止回 material owner。
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-simplification-20260907/spec.md","hash":"f80eab9a1bf3d7b551976505a024ae0034a001a17d70c3c9d55748167bb6b2a0","id":"SPEC-workflowhub-execution-simplification-20260907"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-simplification-20260907/plan.md","hash":"e25694ea9437de53a15d5504741b4309ea33b3b6103380de372c7a27971970e9","id":"PLAN-workflowhub-execution-simplification-20260907"}]`
- **source_refs / decision_refs**：D9/D11/D14 → FR-COMPAT-001, FR-PROTECT-001; AC-COMPAT-001, AC-PROTECT-001, AC-PROTECT-002, AC-PROTECT-003, AC-PROTECT-004
- **输入**：当前 accepted decision/spec/plan；依赖卡 T015 的真实输出
- **依赖**：T015
- **并行**：否 — producer-before-consumer；同 Phase 共享文件串行
- **FR**：FR-COMPAT-001, FR-PROTECT-001
- **AC**：AC-COMPAT-001, AC-PROTECT-001, AC-PROTECT-002, AC-PROTECT-003, AC-PROTECT-004
- **动作**：按当前源文件 bytes 同步 `skills/spec-plan/skill-bundle.json`、`skills/spec-tasks/skill-bundle.json`、`skills/wh-review/skill-bundle.json` 的既存 entry SHA，并复用 canonical bundleHash 算法同步 `skills/catalog.yaml` 中三个对应 `local_bundle_hash`；保留来源与授权字段，再由 `tools/cli/repo-skills-manifest.mjs` 生成/校验 `repo-skills.manifest.json`。clean-install consumer 必须读取该 manifest；昂贵 install/provider 前验证 hash/漏件；fixture 永不解析用户真实路径
- **精确文件**：`runtime/distribution/runner-release.mjs`, `runtime/distribution/skill-bundle-release.mjs`, `repo-skills.manifest.json`, `tools/cli/repo-skills-manifest.mjs`, `tests/contract/repo-skills-manifest.test.mjs`, `tests/integration/distribution-closure.test.mjs`, `tests/integration/runner-clean-install.test.mjs`, `scripts/__tests__/smoke-local-skill-dispatch.test.mjs`, `core/__tests__/check-skill-closure.test.mjs`, `tests/integration/mutation-guards.test.mjs`, `skills/spec-plan/skill-bundle.json`, `skills/spec-tasks/skill-bundle.json`, `skills/wh-review/skill-bundle.json`, `skills/catalog.yaml`
- **boundary**：files: `runtime/distribution/runner-release.mjs`, `runtime/distribution/skill-bundle-release.mjs`, `repo-skills.manifest.json`, `tools/cli/repo-skills-manifest.mjs`, `tests/contract/repo-skills-manifest.test.mjs`, `tests/integration/distribution-closure.test.mjs`, `tests/integration/runner-clean-install.test.mjs`, `scripts/__tests__/smoke-local-skill-dispatch.test.mjs`, `core/__tests__/check-skill-closure.test.mjs`, `tests/integration/mutation-guards.test.mjs`, `skills/spec-plan/skill-bundle.json`, `skills/spec-tasks/skill-bundle.json`, `skills/wh-review/skill-bundle.json`, `skills/catalog.yaml`; symbols/regions: collectRunnerReleaseFiles、collectSkillBundleFiles、bundle `files[].sha256`、catalog 三技能 `local_bundle_hash`、catalog/fixture preflight
- **输出**：同步 runner/skill bundle 非静态资源和 catalog，使 clean install 只用声明依赖 的可复核实现/测试事实
- **Knowledge**：原件不可变；缺失/partial/failure/unavailable 不推绿；仅本卡边界内修改
- **verification_role**：GREEN
- **paired_task**：T015
- **gate_cmd**：`npx --no-install vitest run tests/contract/repo-skills-manifest.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs scripts/__tests__/smoke-local-skill-dispatch.test.mjs core/__tests__/check-skill-closure.test.mjs tests/integration/mutation-guards.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-P5 {"pass":"ORACLE-P5: the same command exits 0 after the paired RED case is fixed and both positive and negative cases remain observable."}`
- **evidence_path**：`quality/tests/P5-T016-execution-simplification.json`（output: `quality/tests/output/P5-T016-execution-simplification.output`）
- **STOP**：命令损坏/空跑、失败信号无关、需弱化断言、越界文件、新产品/行为/接口或新控制面时停止并回 owner material
- **recovery**：build-code 只回滚本卡实现/fixture，保留材料与不可变原件；按 make-decision/build-spec/build-plan 分流
- **task risk**：错误 RED、隐藏部分失败、或总 exit 替代逐项 oracle
- **test tier / test method**：fullstack / fullstack-slice-testing
- **scenarios / commands / expected exit / oracle**：与 T015 相同；migration 若实际需要必须备份可回读；命令如上；RED=1，GREEN=0；oracle=ORACLE-P5
- **fixtures_services**：与 T015 相同
- **coverage limits**：若实际无 bundle diff，记录 N/A 理由并不假跑无关 gate
- **phase_review**：`{"stage":"build-code","review_scope":"phase","subject_kind":"phase","phase_id":"P5","packet_requires":["approved_spec","acceptance_criteria","test_evidence","changed_files","snapshot_tree"],"command":"node skills/wh-review/scripts/wh-review-cli.mjs run quality/reviews/requests/P5-phase-review.json","result_ref_pattern":"quality/reviews/results/<content-hash>.json","finding_owner":"current build-code main agent","unavailable_semantics":"preserve unavailable; local repair may continue; phase quality cannot be claimed"}`
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`plan.md#Phase P5`
- **semantic_review_reason**：Phase review is deferred to build-code; this card records the required paired oracle and its future review owner.


##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`in_progress`
- **actual_changes**：A 组同步三个 skill bundle entry SHA、三个 catalog local_bundle_hash 和 repo-skills.manifest；B 组让 runner release collector/installer 验证声明闭包并传递隔离 env；C 组让 skill bundle release collector 验证五阶段闭包、schema、lens/static imports 和漏件。
- **executed_commands**：T015 RED exit 1，59 tests 47/12；首次 GREEN exit 1，56/59（3 runner fixture setup failures）；修正 fixture 后同一六文件命令 exit 0，59/59 passed，51.64s。
- **evidence_refs**：RED `quality/tests/P5-T015-corrected-red.json` sha `d742ca6e31066f850734a9a2e45b8d2f9319ed4b196787fa4df6c0255de195e5`；首次失败 GREEN `quality/tests/P5-T016-execution-simplification.json` sha `c0a6a5ca55c7153e6774a21923f4ee449026d570c571bbd2b467b2295b9585bd`；修正 GREEN `quality/tests/P5-T016-corrected-green.json` sha `4b74939db99d1b74742bac12b1f5815131985d94483ac8bbef05b75bc7bf0691`，output sha `ebfbf96081560f5ef7c485933087911847ed9c353d619af81e71468ebde9784b`。
- **covered_ac**：ORACLE-P5 对 AC-COMPAT-001、AC-PROTECT-001/002/003/004 的正反例 59/59 通过；provider/其他 host 不在范围。
- **review_fact**：P5 broker run `4d610a98-289d-4f4c-92b0-ca0c041ec527` 因 `REVIEW_SOURCE_DRIFT` 无 canonical attempt/result；请求与 provider 原件保留，P5 quality incomplete。
- **completed_at**：N/A — phase review unavailable/source drift
- **执行事实**：所有 P5 writer 已停止；最新 GREEN frozen tree=`19983912a51d650bcd2afec3d4675c6fb3b2185d`，未把 review provider 失败改写成 GREEN。

#### T017 — FINAL：当前快照逐 AC aggregate verification

- **ID**：T017
- **Phase**：Phase P6 — 当前快照最终验收
- **goal**：一次定向聚合逐项核对全部当前 AC、跨任务 seam 与真实未完成事实。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-execution-simplification-20260907/spec.md","hash":"f80eab9a1bf3d7b551976505a024ae0034a001a17d70c3c9d55748167bb6b2a0","id":"SPEC-workflowhub-execution-simplification-20260907"},{"artifact_kind":"plan","ref":"specs/workflowhub-execution-simplification-20260907/plan.md","hash":"e25694ea9437de53a15d5504741b4309ea33b3b6103380de372c7a27971970e9","id":"PLAN-workflowhub-execution-simplification-20260907"}]`
- **source_refs / decision_refs**：R1–R6/U1–U13; D1–D14 → all 13 FR / all 20 AC
- **输入**：T001–T016 的真实完成区、review/evidence refs、current snapshot/material refs
- **依赖**：T016
- **并行**：否 — FINAL 读取所有前序事实且只执行一次
- **FR**：FR-AUTHOR-001, FR-INTERACT-001, FR-TRUTH-001, FR-REVIEW-001, FR-ACCEPT-001, FR-OUTCOME-001, FR-REFLECT-001, FR-DEVIATE-001, FR-LIFECYCLE-001, FR-COMPAT-001, FR-PROTECT-001, FR-STATUS-001, FR-RETRY-001
- **AC**：AC-AUTHOR-001, AC-INTERACT-001, AC-TRUTH-001, AC-REVIEW-001, AC-REVIEW-002, AC-ACCEPT-001, AC-ACCEPT-002, AC-OUTCOME-001, AC-REFLECT-001, AC-DEVIATE-001, AC-LIFECYCLE-001, AC-LIFECYCLE-002, AC-COMPAT-001, AC-PROTECT-001, AC-PROTECT-002, AC-PROTECT-003, AC-PROTECT-004, AC-USAGE-001, AC-STATUS-001, AC-RETRY-001
- **动作**：在同一冻结 material/tree/source identity 下串行运行 P6-A、P6-B、P6-C 三个完整定向分片；逐 acceptance_data 场景核对 actual/oracle/evidence；汇总 pass/fail/skipped/unavailable/not_applicable，不创建状态权威。三片是原 31 文件集合的无重叠完整划分；分片失败或超时保留原件，不能由其他分片或历史结果推绿。
- **精确文件**：`specs/workflowhub-execution-simplification-20260907/tasks.md`, `quality/tests/final-execution-simplification-A.json`, `quality/tests/output/final-execution-simplification-A.output`, `quality/tests/final-execution-simplification-A-900.json`, `quality/tests/output/final-execution-simplification-A-900.output`, `quality/tests/final-execution-simplification-B.json`, `quality/tests/output/final-execution-simplification-B.output`, `quality/tests/final-execution-simplification-C.json`, `quality/tests/output/final-execution-simplification-C.output`, `quality/tests/final-execution-simplification.json`, `quality/tests/output/final-execution-simplification.output`
- **boundary**：files: `specs/workflowhub-execution-simplification-20260907/tasks.md`, the six partition receipt/output files, and the final aggregate receipt/output; symbols/regions: tasks.md T017 execution fields and task quality evidence only
- **输出**：最终 test receipt/output、逐 AC 结果、当前独立 verify review 与剩余限制
- **Knowledge**：总 exit 0 只证明命令集合；逐 AC 完成还需 current identity/ref/actor/original evidence
- **verification_role**：N/A — non-behavior aggregate verification
- **paired_task**：N/A — aggregate has no RED/GREEN pair
- **gate_cmd**：串行执行以下三个命令，不能并行、不能改文件、不能改变 snapshot/material/source identity：
  - **P6-A**：`npx --no-install vitest run tests/contract/acceptance-execution-tier.test.mjs core/__tests__/check-skill-closure.test.mjs tests/contract/repo-skills-manifest.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs scripts/__tests__/smoke-local-skill-dispatch.test.mjs tests/integration/mutation-guards.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
  - **P6-B**：`npx --no-install vitest run tests/contract/four-material-non-gate-contract.test.mjs tests/stage-plan-task-contract.test.mjs tests/stage-interaction-contract.test.mjs tests/contract/ui-applicability-must-ask.test.mjs tests/contract/freeze-classification-budget-usage-protocol.test.mjs tests/contract/human-confirmation-v3.test.mjs tests/contract/confirmation-authorization.test.mjs tests/boundary-confirm.test.mjs tests/contract/host-outcome-bridge.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/contract/stage-completion.test.mjs tests/contract/status-derivation.test.mjs tests/contract/workflow-synchronization-consumer.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
  - **P6-C**：`npx --no-install vitest run tests/review/review-record-route.test.mjs tests/integration/wh-review-v3-broker-contract.test.mjs tests/review/review-policy-compatibility.test.mjs tests/contract/verify-code-binding-derivation.test.mjs tests/verify-requirement-replay-contract.test.mjs tests/e2e/vnext-five-stage-current.test.mjs tests/contract/stage-reflect.test.mjs tests/contract/stage-runner-reflection.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs tests/e2e/stage-reflect-real-chain.test.mjs tests/integration/quality-store-concurrency.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-FINAL {"pass":"逐项核对 20 AC 的 current actual/oracle/evidence；跨任务 seam 正反例成立；未覆盖项保持 skipped/unavailable/not_applicable，不伪造通过。"}`
- **evidence_path**：首次 public P6-A timeout 保留于 `quality/tests/final-execution-simplification-A.json` + `quality/tests/output/final-execution-simplification-A.output`；当前 authenticated 900000ms P6-A retry 使用 `quality/tests/final-execution-simplification-A-900.json` + `quality/tests/output/final-execution-simplification-A-900.output`；P6-B/C 分别为 `quality/tests/final-execution-simplification-B.json` + `quality/tests/output/final-execution-simplification-B.output`、`quality/tests/final-execution-simplification-C.json` + `quality/tests/output/final-execution-simplification-C.output`；聚合 summary 为 `quality/tests/final-execution-simplification.json` + `quality/tests/output/final-execution-simplification.output`
- **STOP**：命令损坏/空跑、snapshot/material 变化、任一 AC 无场景或原件、需要扩大产品/接口边界时停止并回受影响卡
- **recovery**：保留失败输出，回最窄受影响 task 修复后仅重跑受影响 gate，再在新 current snapshot 重跑一次 FINAL
- **task risk**：将 exit 0、receipt、empty findings、physical close 或 report 当成全部 AC 通过
- **test tier / test method**：fullstack / fullstack-slice-testing；受影响定向组合，不是全量回归
- **scenarios / commands / expected exit / oracle**：acceptance_data 二十项覆盖普通成功、修复/漏修、身份错误、partial/unavailable、并发生命周期、E2E、隔离/tamper、状态/偏差；命令如上；exit 0；ORACLE-FINAL
- **fixtures_services**：P1–P5 的隔离 fixture；command 子进程、in-process service、fake broker、mkdtemp HOME/task root；统一清理；无 live provider/browser
- **coverage limits**：不证明真实 provider 可用率、其他 host、UI/browser、历史任务、精确费用、全仓性能；这些保持 unavailable/deferred/N/A
- **acceptance_role**：acceptance
- **ui_scope**：non_ui
- **acceptance_data**：`[{"source":"SCN-001/AC-AUTHOR-001","sample":"author_001_fixture","scenario":"four current materials and bounded long-session handoff summary","tier":"command"},{"source":"SCN-002/AC-INTERACT-001","sample":"interact_001_fixture","scenario":"answered, partial, unanswered, withdrawn interaction facts","tier":"command"},{"source":"SCN-003/AC-TRUTH-001","sample":"truth_001_fixture","scenario":"partial, failure and unavailable remain distinct with provenance","tier":"service"},{"source":"SCN-004/AC-REVIEW-001","sample":"review_001_fixture","scenario":"paired roles independently authenticated and recorded","tier":"service"},{"source":"SCN-005/AC-REVIEW-002","sample":"review_002_fixture","scenario":"fixed finding resolves; intentionally missing fix remains finding","tier":"service"},{"source":"SCN-006/AC-OUTCOME-001","sample":"outcome_001_fixture","scenario":"authenticated stage outcome reaches fact and status; bad identity rejects","tier":"service"},{"source":"SCN-007/AC-ACCEPT-001","sample":"accept_001_fixture","scenario":"bug check catches original defect; nonbehavior no fake RED; one reverse-order sensitivity","tier":"service"},{"source":"SCN-008/AC-ACCEPT-002","sample":"accept_002_fixture","scenario":"command/service execution binds same verify review with nested freshness","tier":"service"},{"source":"SCN-009/AC-LIFECYCLE-001","sample":"lifecycle_001_fixture","scenario":"confirmation A/A and semantic change under lock","tier":"command"},{"source":"SCN-010/AC-LIFECYCLE-002","sample":"lifecycle_002_fixture","scenario":"reflection A/A/B immutable refs under concurrency","tier":"command"},{"source":"SCN-011/AC-REFLECT-001","sample":"reflect_001_fixture","scenario":"real executor judgment records; missing executor stays unavailable","tier":"command"},{"source":"SCN-012/AC-RETRY-001","sample":"retry_001_fixture","scenario":"same material/route no dispatch; changed identity plus known budget only","tier":"command"},{"source":"SCN-013/AC-COMPAT-001","sample":"compat_001_fixture","scenario":"old fixed and new explicit refs read; rollback quarantine works","tier":"command"},{"source":"SCN-014/AC-USAGE-001","sample":"usage_001_fixture","scenario":"authenticated attempt usage present/absent/failed/reused without zero fill","tier":"command"},{"source":"SCN-015/AC-PROTECT-001","sample":"protect_001_fixture","scenario":"wrong task/source/material/ref/revision/actor rejects field by field","tier":"service"},{"source":"SCN-016/AC-PROTECT-002","sample":"protect_002_fixture","scenario":"hash and byte binding detects tamper before expensive action","tier":"service"},{"source":"SCN-017/AC-PROTECT-003","sample":"protect_003_fixture","scenario":"mkdtemp HOME/CODEX_HOME install never reads user config","tier":"command"},{"source":"SCN-018/AC-PROTECT-004","sample":"protect_004_fixture","scenario":"half-write and concurrent mutation preserve immutable original","tier":"command"},{"source":"SCN-019/AC-STATUS-001","sample":"status_001_fixture","scenario":"quality, acceptance, release and physical close derive separately","tier":"command"},{"source":"SCN-020/AC-DEVIATE-001","sample":"deviate_001_fixture","scenario":"five deviation types route to correct owner material","tier":"command"}]`
- **e2e_scope**：not_required
- **e2e_scope_note**：仅 browser/visual E2E 因 non_ui 为 N/A；AC-ACCEPT-002 的 command/service E2E binding 必须执行并绑定 current evidence

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`in_progress`
- **actual_changes**：T017 按 public 600000ms 默认、canonical 900000ms 上限和历史耗时预检拆成 P6-A/P6-B/P6-C 三个无重叠分片；首次 public P6-A timeout 与修复前 B/C 失败原件保留。修复 producer 字段诊断、Stage Agent reflection consumer 认证和 verify-code 文案边界后，用新 canonical refs 在同一冻结身份下重采 A/B/C；未修改生产 timeout 上限、公共命令或控制面。Stage Agent unavailable 与旧 failed reflection 仍保留为历史事实。
- **executed_commands**：首次 public P6-A：`node tools/cli/stage-runtime.mjs verify --action=execute --stage=build-code ... /tmp/workflowhub-P6-A.json`，exit 124，`TEST_CAPTURE_TIMEOUT`, timeout 600000ms；旧 receipt/output 不覆盖。修复后使用 `createCanonicalReceiptWriter.captureTests({timeoutMs:900000})` 串行执行新 A/B/C：A exit 0（813.43s，7 files/114 tests）；B exit 0（789.38s，13 files/348 tests）；C exit 0（703.83s，11 files/138 tests，137 passed/1 skipped）。随后运行只读 aggregate checker，exit 0，校验三片 receipt/output hash、exit 和 frozen identity。
- **evidence_refs**：新 A `quality/tests/final-execution-simplification-20260908-A.json` sha `1792b235be7a2df5f4d5ec27f32b3ea6bf7dbc8b887fce62d851e7be136a9c6a`（output `quality/tests/output/final-execution-simplification-20260908-A.output` sha `a45cff438708a0e4784e9fe9d5ee219bd46b1426c767800dded3f1a578d2881d`）；新 B `quality/tests/final-execution-simplification-20260908-B.json` sha `ac4ca1540d33367da32e0a09db49e78be3a74fbd47f0187a02dddd56b003a253`（output `quality/tests/output/final-execution-simplification-20260908-B.output` sha `449e6d846d44fe8508ab5b95c62171908ae2c144d7387384ebabd4212af5c2ea`）；新 C `quality/tests/final-execution-simplification-20260908-C.json` sha `887e64f2ff1436070075cf11c212fc0b9a017100c2b859b660a4b5d151425144`（output `quality/tests/output/final-execution-simplification-20260908-C.output` sha `2ac908c4600354de19ad84601d0883b415d0248f95bfaef6b21c0ad3bb1e44cc`）；新 aggregate `quality/tests/final-execution-simplification-20260908-aggregate.json` sha `c76dad09a939a4d9f518e0813d9a8f7fb8d28907183af7d8c0c114eff18c3e80`（output `quality/tests/output/final-execution-simplification-20260908-aggregate.output` sha `c76dad09a939a4d9f518e0813d9a8f7fb8d28907183af7d8c0c114eff18c3e80`）；latest unavailable Stage Agent outcome `quality/evidence/stage-outcomes/build-code/ff32f27168edcf47c009dcf19a66e4a5f89927886d92413ae0f3a2dc1e39de02.json`; failed reflection `quality/stage-reflection/build-code/cd828b0d7fbc47a63f40b430b92d37ae0326bb5a04ac688364faa7133b77ef90.json` sha `823270d83a346f1758930dcda9b328d64c78a7c3eb7e786a07db7cfb7c071b2e`。
- **covered_ac**：A 114/114、B 348/348、C 137/138（唯一 skip：`tests/e2e/vnext-five-stage-current.test.mjs:545` 的 T01/F13/KD 历史 fixture，保持 skipped）；三片 aggregate `workflowhub-final-aggregate.v1` 为 `passed`，冻结身份 `tree=1ff6696b0bbfd1b035e185f076b9ab138bf60cd1`、`snapshot_commit=523bc99f691f13a997addc4bef70eb9fcb4f3856`、`source_digest=fee7043dbc10c11a277bcfc53875b580770bb0e570b1e254b7ab487a9d4db189`。
- **review_fact**：N/A — build-code aggregate 已通过；verify independent review 尚未执行，不能从测试 receipt 推断 review 结果。
- **completed_at**：N/A — not completed
- **执行事实**：31 个目标文件已只读核对存在且无重复；P6-A=7、P6-B=13、P6-C=11，三片 union 等于原集合。修复后新三片均绑定同一 frozen tree/source，aggregate 为 `passed`；C 的历史 T01/F13/KD fixture 仍为 skipped，不得推为通过。旧 failed aggregate、旧 B/C failures、Stage Agent unavailable outcome 和 failed reflection 均不可变保留；verify-code 尚未开始，质量结论仍不能写成最终完成。

### Verify
- **Target**：all 13 FR / all 20 AC / 13 SCN / producer-consumer seams
- **gate_cmd**：P6-A、P6-B、P6-C 三个串行分片命令（见上方 T017 gate_cmd），共享同一冻结快照；不能再合并为单一超窗命令
- **expected_exit**：0
- **evidence_path**：三份分片 receipt/output、一份 `quality/tests/final-execution-simplification.json` 聚合 summary、latest unavailable Stage Agent outcome 和 `quality/stage-reflection/build-code/cd828b0d7fbc47a63f40b430b92d37ae0326bb5a04ac688364faa7133b77ef90.json` failed reflection
- **Oracle**：ORACLE-FINAL；逐项结果与原件 current，未覆盖不伪 pass。

### Knowledge
最终输出只陈述真实质量、验收、发布、物理 close 和 risk 状态；它们互不替代。

### STOP
任一当前 identity、scenario、actor、ref、hash、revision、review/confirmation binding 缺失或错误即停止完成声明。

### Done
一次当前快照聚合、verify 独审、逐项 AC 与剩余限制均有可追溯引用；无实现/测试/provider事实则不勾完成。

### Risks and rollback
聚合不改生产代码；失败保留原输出，回受影响卡，不用无范围全量回归掩盖。

## 4. Final current-snapshot aggregate strategy

- **tier / method**：fullstack / fullstack-slice-testing；受影响定向组合。
- **scenarios**：acceptance_data 二十项，覆盖 spec 13 SCN、全部 20 AC、成功/失败/空/partial/unavailable/并发/身份错误/状态分域。
- **command**：P6-A、P6-B、P6-C 三个 `npx --no-install vitest run` 分片命令，按 T017 顺序串行执行；每片绑定同一 snapshot/material/source identity，分别生成 A/B/C receipt/output，再生成聚合 summary
- **expected exit**：0
- **oracle**：ORACLE-FINAL；每个 AC 有 current actual/evidence，跨 seam 正反例成立。
- **fixtures_services**：fake broker、command child process、in-process service、mkdtemp HOME/task root；无 live provider/browser。
- **evidence_path**：`quality/tests/final-execution-simplification-A-900.json`, `quality/tests/final-execution-simplification-B.json`, `quality/tests/final-execution-simplification-C.json` 及对应 output；首次 A timeout 原件为 `quality/tests/final-execution-simplification-A.json`；聚合 `quality/tests/final-execution-simplification.json`
- **coverage limits**：other hosts、UI、历史、精确成本和全仓性能不在范围。
- **STOP**：命令坏、AC 缺、身份错、越界或新决策。
- **execution_contract**：当前快照只执行一次，但由 A/B/C 三个完整分片组成；冻结后串行运行，组间不改生产/测试/材料。每片失败保留独立原始输出和 receipt，不能拼历史或不同快照结果；仅三片均完成后写聚合 summary。

## Dependency Graph

- **order**：T001→T002→T003→T004→T005→T006→T007→T008→T009→T010→T011→T012→T013→T014→T015→T016→T017

```text
T001 RED → T002 GREEN → T003 RED → T004 GREEN
  → T005 RED → T006 GREEN
  → T007 RED → T008 GREEN → T009 RED → T010 GREEN → T011 RED → T012 GREEN
  → T013 RED → T014 GREEN → T015 RED → T016 GREEN → T017 FINAL
```

## Final Boundary Check

- [x] 六个 Phase 的 Goal、Files、Tasks、Verify、Knowledge、STOP、Done、Risks 完整。
- [x] 每个任务一张卡和一个 pending 完成区；生产文件按登记区域串行归属；P1 contracts/P2 review writer 的已完区域保留，P3 仅扩展本计划明确的 acceptance projection/verify binding 区域。
- [x] 每个行为变化同命令同 oracle RED→GREEN；P4 采用 consumer-level RED/GREEN；T017 唯一 FINAL/acceptance。
- [x] DAG 无环，13 FR/20 AC/13 SCN 双向闭合；未知事实未写成通过。
- [x] review/test/evidence/history 只记录事实，不作工作许可证。
