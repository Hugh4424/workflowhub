# 任务清单：审查配置单源、快速失败与结果可追溯

- **Input**：`decision-log.md`、`spec.md`、`plan.md`
- **Template version**：`plan-task.v4`

## 材料导航

| 章节 | 摘要 | 读取时机 |
| --- | --- | --- |
| Phase P0 | 材料合同、来源语义与真实host事件前置修复 | B/P 实施前 |
| Phase P1 | 配置与兼容生产合同 | B/P 实施前 |
| Phase P2 | 预检、记录、sink和E2E的串行卡 | B/P 每卡前 |
| Phase P3 | 迁移、文档、唯一最终验收 | B/P 交付前 |
| Final strategy / Dependency | 受影响聚合与依赖 | S/B/P 核对 |
| OPEN / DEFER | 保留边界、责任及关闭条件 | M/S/B/P 交接 |

T013～T019及T001～T011已完成并保留真实执行事实；T012是唯一仍 pending 的最终行为验证。N/A只表示无新增实现，不表示无副作用。独立测试路线为 fullstack-slice-testing。高风险绑定与非行为role冲突保留 PLAN-RISK-005/006；不把未执行写成完成。本轮 R-008/R-009 已批准增补四材料；用户于 2026-09-07 明确授权按计划执行 build-code，当前仍需完成材料修复、逐样本耗时事实和最终独立审查。

## Phase P0 — 材料合同与执行事实前置修复

### Goal

同一合法材料经全部消费者一致；有证据的无计时host事件和业务引用可记录，真实缺项/错身份仍失败。来源R-008/R-009、D-010～D-014；不改原业务边界。

### Files

- **NEW**：N/A — 仅修改现有文件，不新增生产模块或控制面
- **MODIFY**：`docs/cli-tool-mapping.md`、`docs/operations/claude-e2e-sample.md`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-runner.mjs`、`skills/spec-analyze/SKILL.md`、`skills/spec-analyze/review-bundle.json`、`skills/spec-analyze/skill-bundle.json`、`skills/spec-plan/SKILL.md`、`skills/spec-plan/skill-bundle.json`、`skills/spec-plan/templates/plan-template.md`、`skills/spec-tasks/SKILL.md`、`skills/spec-tasks/skill-bundle.json`、`skills/spec-tasks/templates/tasks-template.md`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/skill-bundle.json`、`tests/contract/build-reflection-page.test.mjs`、`tests/contract/claude-outcome-packet.test.mjs`、`tests/contract/confirmation-authorization.test.mjs`、`tests/contract/derive-consumption-edges.test.mjs`、`tests/contract/filled-plan-task-production.test.mjs`、`tests/contract/five-stage-spec-analyze-wiring.test.mjs`、`tests/contract/host-outcome-bridge.test.mjs`、`tests/contract/material-oracle-context-packet.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`、`tests/contract/plan-acceptance-task-gate.test.mjs`、`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/stage-runner-on-stage-end.test.mjs`、`tests/integration/runner-clean-install.test.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`、`workflows/build-plan/SKILL.md`

- **READ/VERIFY ONLY**：`tests/integration/distribution-closure.test.mjs`；现有分发闭包检查只读运行，不新增/修改断言，不分配RED实现；T019运行并报告，若发现必须修改则回材料owner补实际任务。

### Tasks

- `T013`：RED 统一材料ID、风险、角色与Oracle；Files：`tests/contract/filled-plan-task-production.test.mjs`、`tests/contract/material-oracle-context-packet.test.mjs`、`tests/contract/plan-acceptance-task-gate.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`、`tests/contract/confirmation-authorization.test.mjs`、`tests/integration/runner-clean-install.test.mjs`
- `T014`：GREEN 统一材料ID、风险、角色与Oracle；Files：`tests/contract/filled-plan-task-production.test.mjs`、`tests/contract/material-oracle-context-packet.test.mjs`、`tests/contract/plan-acceptance-task-gate.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`、`tests/contract/confirmation-authorization.test.mjs`、`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`skills/spec-tasks/templates/tasks-template.md`、`skills/spec-plan/templates/plan-template.md`、`skills/spec-tasks/SKILL.md`、`skills/spec-plan/SKILL.md`、`skills/spec-plan/skill-bundle.json`、`skills/spec-tasks/skill-bundle.json`、`tests/integration/runner-clean-install.test.mjs`
- `T015`：RED 事项来源与语义证据；Files：`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/five-stage-spec-analyze-wiring.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`
- `T016`：GREEN 事项来源与语义证据；Files：`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/five-stage-spec-analyze-wiring.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`、`runtime/stage/stage-content-contracts.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/spec-analyze/SKILL.md`、`workflows/build-plan/SKILL.md`、`skills/spec-analyze/skill-bundle.json`、`skills/spec-analyze/review-bundle.json`、`skills/wh-review/skill-bundle.json`
- `T017`：RED 真实host事件与输出引用；Files：`tests/contract/host-outcome-bridge.test.mjs`、`tests/contract/claude-outcome-packet.test.mjs`、`tests/contract/derive-consumption-edges.test.mjs`、`tests/contract/stage-runner-on-stage-end.test.mjs`、`tests/contract/build-reflection-page.test.mjs`、`tests/integration/runner-clean-install.test.mjs`
- `T018`：GREEN 真实host事件与输出引用；Files：`tests/contract/host-outcome-bridge.test.mjs`、`tests/contract/claude-outcome-packet.test.mjs`、`tests/contract/derive-consumption-edges.test.mjs`、`tests/contract/stage-runner-on-stage-end.test.mjs`、`tests/contract/build-reflection-page.test.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`workflows/build-plan/SKILL.md`、`runtime/stage/stage-runner.mjs`、`docs/operations/claude-e2e-sample.md`、`docs/cli-tool-mapping.md`、`tests/integration/runner-clean-install.test.mjs`
- `T019`：N/A — non-behavior P0集成与分发验证；不新增行为、不强造RED；Files：`tests/contract/filled-plan-task-production.test.mjs`、`tests/contract/material-oracle-context-packet.test.mjs`、`tests/contract/plan-acceptance-task-gate.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`、`tests/contract/confirmation-authorization.test.mjs`、`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/five-stage-spec-analyze-wiring.test.mjs`、`tests/contract/host-outcome-bridge.test.mjs`、`tests/contract/claude-outcome-packet.test.mjs`、`tests/contract/derive-consumption-edges.test.mjs`、`tests/contract/stage-runner-on-stage-end.test.mjs`、`tests/contract/build-reflection-page.test.mjs`、`tests/integration/runner-clean-install.test.mjs`

### Verify

MATERIAL_CONTRACT_UNIFIED；本Phase还必须完成MATERIAL_SOURCE_SEMANTICS、HOST_EVENT_REFERENCES与MATERIAL_HOST_INTEGRATION。

`npx vitest run tests/contract/filled-plan-task-production.test.mjs tests/contract/material-oracle-context-packet.test.mjs tests/contract/plan-acceptance-task-gate.test.mjs tests/contract/material-producer-consumer-roundtrip.test.mjs tests/contract/confirmation-authorization.test.mjs tests/integration/runner-clean-install.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`；RED=1/GREEN=0；MATERIAL_CONTRACT_UNIFIED；`quality/evidence/build-code/recheck-20260907/`。
`npx vitest run tests/contract/spec-analyze-completeness.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/material-producer-consumer-roundtrip.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`；RED=1/GREEN=0；MATERIAL_SOURCE_SEMANTICS；`quality/evidence/build-code/material_source_semantics/`。
`npx vitest run tests/contract/host-outcome-bridge.test.mjs tests/contract/claude-outcome-packet.test.mjs tests/contract/derive-consumption-edges.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs tests/contract/build-reflection-page.test.mjs tests/integration/runner-clean-install.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`；RED=1/GREEN=0；HOST_EVENT_REFERENCES；`quality/evidence/build-code/recheck-20260907/`。
`npx vitest run tests/contract/filled-plan-task-production.test.mjs tests/contract/material-oracle-context-packet.test.mjs tests/contract/plan-acceptance-task-gate.test.mjs tests/contract/material-producer-consumer-roundtrip.test.mjs tests/contract/confirmation-authorization.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/host-outcome-bridge.test.mjs tests/contract/claude-outcome-packet.test.mjs tests/contract/derive-consumption-edges.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs tests/contract/build-reflection-page.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`；expected_exit=0；MATERIAL_HOST_INTEGRATION；`quality/evidence/build-code/material_host_integration/`。T019仅是P0验证，T012仍为唯一全任务acceptance。

### Knowledge

三组共享stage-content-contracts、workflow说明、producer-consumer及runner-clean-install测试；T013/T014新增安装后材料consumer回放，T017/T018新增安装后host事件consumer回放，T019仅运行已实现回放；各组，按T013→T014→T015→T016→T017→T018→T019串行；T001依赖T019。不先为每个consumer改写fixture；同一原始字节与明确无效变体进入真实handler/记录writer/消费边和隔离安装。无计时不是无执行，缺事件仍unavailable，成本不补0。

### STOP

本轮停在build-code前，全部卡pending；未来RED若仅环境/setup失败不算目标RED。需要扩大预算/身份等价、修改原报告、新增dispatcher/持久控制面或真实跨宿主hook时停止对应越界修改并回owner，继续不依赖部分。自动hook按DEFER-005延期。

### Done

未来三组真实行为RED/GREEN及T019受影响集成命令有原始退出码、来源/错身份/缺事实负例、实际引用和分发字节证据；正常与异常均保持真实性。当前测试未执行，结构一致不替代独立review或最终用户确认。

### Risks and rollback

RISK-005/006：统一解析时不得混同标识、删除真实finding或相信自报semantic_match；事件引用不能充当执行证明。仅回滚本次代码/模板改动，保留原事件/outcome/失败和历史审查；D-007预算/usage消费与严格身份边界不变，DEFER-005不伪完成。

#### T013 — RED：统一材料ID、风险、角色与Oracle

- **ID**：T013
- **Phase**：Phase P0 — 材料合同与执行事实前置修复
- **goal**：RED：统一材料ID、风险、角色与Oracle
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7681b3cead847c53bbc84a9f72eb9194181d4794168c203c09ac359c3360603d","id":"review-flow-repair-spec"},{"artifact_kind":"plan","ref":"plan.md","hash":"c38f802e14b9a2645e71173306881db4746eebc06d30d7b980ad40e12e826b27","id":"review-flow-repair-plan"}]`
- **source_refs / decision_refs**：R-008/R-009 / D-010/D-011/D-014
- **输入**：当前认证四材料、根因诊断原始证据、现有模板和实际consumer
- **依赖**：none
- **并行**：否 — RED/GREEN及共享文件/消费者依赖串行
- **FR**：FR-CONTRACT-001, FR-CONTRACT-002, FR-CONTRACT-003, FR-CONTRACT-004, FR-CONTRACT-007
- **AC**：AC-CONTRACT-001, AC-CONTRACT-002, AC-CONTRACT-003, AC-CONTRACT-004, AC-CONTRACT-007
- **动作**：只扩展列明现有测试的目标断言并采集RED；不得修改生产代码。 所有断言包括：Same complete template D-xxx risk/non-UI and ordinary non-UI specimens pass all actual consumers after fix without per-consumer rewrites；N/A with reason parses consistently; no-reason N/A still fails；Unknown or cross-task decision reference, absent risk fact, malformed oracle still fail；RED rejects declared negative input; GREEN keeps reciprocal pairing and exact oracle semantics；Applicable UI specimen retains existing UI acceptance obligations；扩展现有runner-clean-install隔离fixture：安装当前分发产物，从安装后的真实模板生成同一完整合法/非法材料，依次调用安装后实际材料validator与official handler，验证D-xxx风险/角色/Oracle一致；不得仅验证source-tree或bundle hash。
- **精确文件**：`tests/contract/filled-plan-task-production.test.mjs`、`tests/contract/material-oracle-context-packet.test.mjs`、`tests/contract/plan-acceptance-task-gate.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`、`tests/contract/confirmation-authorization.test.mjs`、`tests/integration/runner-clean-install.test.mjs`
- **boundary**：files: `tests/contract/filled-plan-task-production.test.mjs`、`tests/contract/material-oracle-context-packet.test.mjs`、`tests/contract/plan-acceptance-task-gate.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`、`tests/contract/confirmation-authorization.test.mjs`、`tests/integration/runner-clean-install.test.mjs`; symbols/regions: 本组现有测试及局部fixture；该共享安装测试归Phase P0，按当前依赖串行修改
- **输出**：真实RED命令输出与逐AC观察，缺失和失败保留
- **Knowledge**：后续阶段消费统一材料合同与真实host事实；未记录事件/未实测语义仍unknown/unavailable，不补造历史
- **verification_role**：RED
- **paired_task**：T014
- **gate_cmd**：`npx vitest run tests/contract/filled-plan-task-production.test.mjs tests/contract/material-oracle-context-packet.test.mjs tests/contract/plan-acceptance-task-gate.test.mjs tests/contract/material-producer-consumer-roundtrip.test.mjs tests/contract/confirmation-authorization.test.mjs tests/integration/runner-clean-install.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`
- **expected_exit**：1
- **oracle**：`MATERIAL_CONTRACT_UNIFIED {"pass":"Same complete template D-xxx risk/non-UI and ordinary non-UI specimens pass all actual consumers after fix without per-consumer rewrites; N/A with reason parses consistently; no-reason N/A still fails; Unknown or cross-task decision reference, absent risk fact, malformed oracle still fail; RED rejects declared negative input; GREEN keeps reciprocal pairing and exact oracle semantics; Applicable UI specimen retains existing UI acceptance obligations; 在隔离干净安装中读取分发后的实际模板生成同一完整材料，由安装后的真实validator与official handler消费，合法与非法结果保持一致；source-tree绿或bundle hash一致不能替代。","reject":{"input":"本组列明的合法/非法、错引用、缺失及跨消费者样本，直接消费真实producer输出","expected_rejection":"合法目标行为在旧实现出现指定断言失败；非法样本修复后仍被明确拒绝，不接受初始化失败为RED","observation":"指定Vitest行为断言、原始输出/引用、错误码和完整消费者路径；不得以中间schema通过替代正式handler消费"}}`
- **evidence_path**：`quality/evidence/build-code/recheck-20260907/`
- **STOP**：真实断言无法复现、需要扩大接口/文件或触碰预算/身份时报告具体缺口；不弱化断言；历史事实只读
- **recovery**：本卡执行者只恢复自己修改；保留原始失败证据，配置恢复先核对当前hash，不覆盖他人更改
- **task risk**：RISK-005/006；合同修复不得放宽风险、身份或语义证据；缺失时保持unknown；只回滚本卡改动
- **test tier / test method**：fullstack / fullstack-slice-testing；独立test-routing-advisor按真实接口/身份/并发风险判类
- **scenarios / commands / expected exit / oracle**：SCN-013/SCN-018；使用本卡gate_cmd/expected_exit/MATERIAL_CONTRACT_UNIFIED；正负例均须覆盖
- **fixtures_services**：隔离临时task/home；真实模板、packet、handler及canonical adapter读取生产输出；provider仅stub，禁止真实派发；清理本次fixture
- **coverage limits**：不证明所有宿主自动事件采集；DEFER-005保留；不证明provider质量；不改usage统计或历史reflection
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/build-plan-simple-085d2780-7242-4b2a-ba72-89f79462e347.json
- **semantic_review_reason**：当前扩展输入一次独立审查3完成2失败，5fixed/1rejected_invalid；修订后未再provider复审，最后本地分析另记，实施和语义验收仍未完成

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：N/A — 仅执行RED门禁；未修改生产代码。
- **executed_commands**：T013 recheck declared gate command（detached HEAD + current test overlay，exit 1；39 tests passed / 5 failed；目标材料合同断言与 clean-install 闭包失败均保留原始输出）
- **evidence_refs**：[`quality/evidence/build-code/recheck-20260907/T013-RED-vitest.log`, `quality/evidence/build-code/recheck-20260907/T013-RED-result.json`, `quality/evidence/build-code/recheck-20260907/T013-T014-GREEN-vitest.log`, `quality/evidence/build-code/recheck-20260907/T013-T014-GREEN-result.json`, `quality/evidence/build-code/material_contract_unified/phase-card.md`, `quality/evidence/build-code/material_contract_unified/test-routing-advisor.json`]
- **covered_ac**：RED reproduced the declared material-contract failures, including clean-install distribution mismatch; no failure was rewritten as success.
- **review_fact**：独立语义复审仍为 `incomplete`；本卡只记录真实RED。
- **completed_at**：2026-09-07T08:17:05Z
- **执行事实**：本次 recheck 先在 detached HEAD 加当前 T013 测试输入运行 RED（39 passed，5 failed），再在当前实现 worktree 运行同一命令 GREEN（44 passed，clean-install 5 passed）。旧 phase-card 仅作历史摘要，当前 raw log/result 已补入索引。

#### T014 — GREEN：统一材料ID、风险、角色与Oracle

- **ID**：T014
- **Phase**：Phase P0 — 材料合同与执行事实前置修复
- **goal**：GREEN：统一材料ID、风险、角色与Oracle
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7681b3cead847c53bbc84a9f72eb9194181d4794168c203c09ac359c3360603d","id":"review-flow-repair-spec"},{"artifact_kind":"plan","ref":"plan.md","hash":"c38f802e14b9a2645e71173306881db4746eebc06d30d7b980ad40e12e826b27","id":"review-flow-repair-plan"}]`
- **source_refs / decision_refs**：R-008/R-009 / D-010/D-011/D-014
- **输入**：当前认证四材料、根因诊断原始证据、现有模板和实际consumer；T013真实RED证据
- **依赖**：T013
- **并行**：否 — RED/GREEN及共享文件/消费者依赖串行
- **FR**：FR-CONTRACT-001, FR-CONTRACT-002, FR-CONTRACT-003, FR-CONTRACT-004, FR-CONTRACT-007
- **AC**：AC-CONTRACT-001, AC-CONTRACT-002, AC-CONTRACT-003, AC-CONTRACT-004, AC-CONTRACT-007
- **动作**：Replace duplicate decision-ID and role parsing in-place with shared in-memory facts; current templates emit one JSON oracle contract. Remove D6/D7 identity hardcoding; consume explicit policy/risk facts while retaining original IDs.；按RED同一命令验证。 所有断言包括：Same complete template D-xxx risk/non-UI and ordinary non-UI specimens pass all actual consumers after fix without per-consumer rewrites；N/A with reason parses consistently; no-reason N/A still fails；Unknown or cross-task decision reference, absent risk fact, malformed oracle still fail；RED rejects declared negative input; GREEN keeps reciprocal pairing and exact oracle semantics；Applicable UI specimen retains existing UI acceptance obligations；扩展现有runner-clean-install隔离fixture：安装当前分发产物，从安装后的真实模板生成同一完整合法/非法材料，依次调用安装后实际材料validator与official handler，验证D-xxx风险/角色/Oracle一致；不得仅验证source-tree或bundle hash。
- **精确文件**：`tests/contract/filled-plan-task-production.test.mjs`、`tests/contract/material-oracle-context-packet.test.mjs`、`tests/contract/plan-acceptance-task-gate.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`、`tests/contract/confirmation-authorization.test.mjs`、`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`skills/spec-tasks/templates/tasks-template.md`、`skills/spec-plan/templates/plan-template.md`、`skills/spec-tasks/SKILL.md`、`skills/spec-plan/SKILL.md`、`skills/spec-plan/skill-bundle.json`、`skills/spec-tasks/skill-bundle.json`、`tests/integration/runner-clean-install.test.mjs`
- **boundary**：files: `tests/contract/filled-plan-task-production.test.mjs`、`tests/contract/material-oracle-context-packet.test.mjs`、`tests/contract/plan-acceptance-task-gate.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`、`tests/contract/confirmation-authorization.test.mjs`、`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`skills/spec-tasks/templates/tasks-template.md`、`skills/spec-plan/templates/plan-template.md`、`skills/spec-tasks/SKILL.md`、`skills/spec-plan/SKILL.md`、`skills/spec-plan/skill-bundle.json`、`skills/spec-tasks/skill-bundle.json`、`tests/integration/runner-clean-install.test.mjs`; symbols/regions: 相关合同及真实producer/consumer接线；不改预算/usage/身份或新增公共入口；该共享安装测试归Phase P0，按当前依赖串行修改
- **输出**：真实GREEN命令输出与逐AC观察，缺失和失败保留
- **Knowledge**：后续阶段消费统一材料合同与真实host事实；未记录事件/未实测语义仍unknown/unavailable，不补造历史
- **verification_role**：GREEN
- **paired_task**：T013
- **gate_cmd**：`npx vitest run tests/contract/filled-plan-task-production.test.mjs tests/contract/material-oracle-context-packet.test.mjs tests/contract/plan-acceptance-task-gate.test.mjs tests/contract/material-producer-consumer-roundtrip.test.mjs tests/contract/confirmation-authorization.test.mjs tests/integration/runner-clean-install.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`
- **expected_exit**：0
- **oracle**：`MATERIAL_CONTRACT_UNIFIED {"pass":"Same complete template D-xxx risk/non-UI and ordinary non-UI specimens pass all actual consumers after fix without per-consumer rewrites; N/A with reason parses consistently; no-reason N/A still fails; Unknown or cross-task decision reference, absent risk fact, malformed oracle still fail; RED rejects declared negative input; GREEN keeps reciprocal pairing and exact oracle semantics; Applicable UI specimen retains existing UI acceptance obligations; 在隔离干净安装中读取分发后的实际模板生成同一完整材料，由安装后的真实validator与official handler消费，合法与非法结果保持一致；source-tree绿或bundle hash一致不能替代。","reject":{"input":"本组列明的合法/非法、错引用、缺失及跨消费者样本，直接消费真实producer输出","expected_rejection":"合法目标行为在旧实现出现指定断言失败；非法样本修复后仍被明确拒绝，不接受初始化失败为RED","observation":"指定Vitest行为断言、原始输出/引用、错误码和完整消费者路径；不得以中间schema通过替代正式handler消费"}}`
- **evidence_path**：`quality/evidence/build-code/recheck-20260907/`
- **STOP**：真实断言无法复现、需要扩大接口/文件或触碰预算/身份时报告具体缺口；不弱化断言；历史事实只读
- **recovery**：本卡执行者只恢复自己修改；保留原始失败证据，配置恢复先核对当前hash，不覆盖他人更改
- **task risk**：RISK-005/006；合同修复不得放宽风险、身份或语义证据；缺失时保持unknown；只回滚本卡改动
- **test tier / test method**：fullstack / fullstack-slice-testing；独立test-routing-advisor按真实接口/身份/并发风险判类
- **scenarios / commands / expected exit / oracle**：SCN-013/SCN-018；使用本卡gate_cmd/expected_exit/MATERIAL_CONTRACT_UNIFIED；正负例均须覆盖
- **fixtures_services**：隔离临时task/home；真实模板、packet、handler及canonical adapter读取生产输出；provider仅stub，禁止真实派发；清理本次fixture
- **coverage limits**：不证明所有宿主自动事件采集；DEFER-005保留；不证明provider质量；不改usage统计或历史reflection
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/build-plan-simple-085d2780-7242-4b2a-ba72-89f79462e347.json
- **semantic_review_reason**：当前扩展输入一次独立审查3完成2失败，5fixed/1rejected_invalid；修订后未再provider复审，最后本地分析另记，实施和语义验收仍未完成

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：统一材料合同解析、semantic status、决策引用/分发hash及输出引用校验；清洁安装基线暴露的 spec-specify bundle/catalog stale hash 仅做 hash-only closure synchronization。
- **executed_commands**：T014 recheck focused contract + clean-install gate（exit 0；6 files，44 tests passed；clean-install 5 passed，约42.5s）
- **evidence_refs**：[`quality/evidence/build-code/recheck-20260907/T013-RED-vitest.log`, `quality/evidence/build-code/recheck-20260907/T013-RED-result.json`, `quality/evidence/build-code/recheck-20260907/T013-T014-GREEN-vitest.log`, `quality/evidence/build-code/recheck-20260907/T013-T014-GREEN-result.json`, `quality/evidence/build-code/material_contract_unified/phase-card.md`, `quality/evidence/build-code/material_contract_unified/test-routing-advisor.json`]
- **covered_ac**：AC-CONTRACT-001/002/003/004/007；合法/非法材料、风险/角色/Oracle、分发后真实consumer及clean-install closure通过。
- **review_fact**：独立语义复审仍为 `incomplete`；本地定向GREEN不等同于最终验收。
- **completed_at**：2026-09-07T08:19:46Z
- **执行事实**：T013 RED 先于本次 GREEN；当前 bundle hash 已同步后，T014 同一命令通过，旧摘要证据保留。

#### T015 — RED：事项来源与语义证据

- **ID**：T015
- **Phase**：Phase P0 — 材料合同与执行事实前置修复
- **goal**：RED：事项来源与语义证据
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7681b3cead847c53bbc84a9f72eb9194181d4794168c203c09ac359c3360603d","id":"review-flow-repair-spec"},{"artifact_kind":"plan","ref":"plan.md","hash":"c38f802e14b9a2645e71173306881db4746eebc06d30d7b980ad40e12e826b27","id":"review-flow-repair-plan"}]`
- **source_refs / decision_refs**：R-008/R-009 / D-010/D-012/D-014
- **输入**：当前认证四材料、根因诊断原始证据、现有模板和实际consumer
- **依赖**：T014
- **并行**：否 — RED/GREEN及共享文件/消费者依赖串行
- **FR**：FR-CONTRACT-005, FR-CONTRACT-006, FR-CONTRACT-007
- **AC**：AC-CONTRACT-005, AC-CONTRACT-006, AC-CONTRACT-007
- **动作**：只扩展列明现有测试的目标断言并采集RED；不得修改生产代码。 所有断言包括：Spec-introduced engineering OPEN propagates downstream without requiring invented make-decision history；External task OPEN retains external owner and does not become local closure obligation；Local missing owner/trigger/handoff/close still reported；Known paraphrase is not rejected by substring rule; contradictory claim is never green based on substring；Unverified semantic evidence stays unknown/unavailable rather than pass；Changed material hash invalidates prior binding
- **精确文件**：`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/five-stage-spec-analyze-wiring.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`
- **boundary**：files: `tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/five-stage-spec-analyze-wiring.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`; symbols/regions: 本组现有测试及局部fixture
- **输出**：真实RED命令输出与逐AC观察，缺失和失败保留
- **Knowledge**：后续阶段消费统一材料合同与真实host事实；未记录事件/未实测语义仍unknown/unavailable，不补造历史
- **verification_role**：RED
- **paired_task**：T016
- **gate_cmd**：`npx vitest run tests/contract/spec-analyze-completeness.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/material-producer-consumer-roundtrip.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`
- **expected_exit**：1
- **oracle**：`MATERIAL_SOURCE_SEMANTICS {"pass":"Spec-introduced engineering OPEN propagates downstream without requiring invented make-decision history; External task OPEN retains external owner and does not become local closure obligation; Local missing owner/trigger/handoff/close still reported; Known paraphrase is not rejected by substring rule; contradictory claim is never green based on substring; Unverified semantic evidence stays unknown/unavailable rather than pass; Changed material hash invalidates prior binding","reject":{"input":"本组列明的合法/非法、错引用、缺失及跨消费者样本，直接消费真实producer输出","expected_rejection":"合法目标行为在旧实现出现指定断言失败；非法样本修复后仍被明确拒绝，不接受初始化失败为RED","observation":"指定Vitest行为断言、原始输出/引用、错误码和完整消费者路径；不得以中间schema通过替代正式handler消费"}}`
- **evidence_path**：`quality/evidence/build-code/material_source_semantics/`
- **STOP**：真实断言无法复现、需要扩大接口/文件或触碰预算/身份时报告具体缺口；不弱化断言；历史事实只读
- **recovery**：本卡执行者只恢复自己修改；保留原始失败证据，配置恢复先核对当前hash，不覆盖他人更改
- **task risk**：RISK-005/006；合同修复不得放宽风险、身份或语义证据；缺失时保持unknown；只回滚本卡改动
- **test tier / test method**：fullstack / fullstack-slice-testing；独立test-routing-advisor按真实接口/身份/并发风险判类
- **scenarios / commands / expected exit / oracle**：SCN-014/SCN-015/SCN-018；使用本卡gate_cmd/expected_exit/MATERIAL_SOURCE_SEMANTICS；正负例均须覆盖
- **fixtures_services**：隔离临时task/home；真实模板、packet、handler及canonical adapter读取生产输出；provider仅stub，禁止真实派发；清理本次fixture
- **coverage limits**：不证明所有宿主自动事件采集；DEFER-005保留；不证明provider质量；不改usage统计或历史reflection
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/build-plan-simple-085d2780-7242-4b2a-ba72-89f79462e347.json
- **semantic_review_reason**：当前扩展输入一次独立审查3完成2失败，5fixed/1rejected_invalid；修订后未再provider复审，最后本地分析另记，实施和语义验收仍未完成

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：N/A — 仅执行RED门禁；未修改生产代码。
- **executed_commands**：`npx vitest run tests/contract/spec-analyze-completeness.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/material-producer-consumer-roundtrip.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`（exit 1；58 passed, 2 failed）
- **evidence_refs**：[`quality/evidence/build-code/material_source_semantics/T015-RED-vitest.log`, `quality/evidence/build-code/material_source_semantics/T015-RED-result.json`]
- **covered_ac**：RED reproduced the semantic-status fixture gap in the two positive verification-note cases; the expected failure was preserved for T016.
- **review_fact**：独立语义复审仍为 `incomplete`；本卡只记录真实RED，不把失败改写为通过。
- **completed_at**：2026-09-07T08:21:42Z
- **执行事实**：T015 RED 已执行；两项正向行为断言因缺少 `semantic_status=completed` 失败，其他 58 项通过。

#### T016 — GREEN：事项来源与语义证据

- **ID**：T016
- **Phase**：Phase P0 — 材料合同与执行事实前置修复
- **goal**：GREEN：事项来源与语义证据
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7681b3cead847c53bbc84a9f72eb9194181d4794168c203c09ac359c3360603d","id":"review-flow-repair-spec"},{"artifact_kind":"plan","ref":"plan.md","hash":"c38f802e14b9a2645e71173306881db4746eebc06d30d7b980ad40e12e826b27","id":"review-flow-repair-plan"}]`
- **source_refs / decision_refs**：R-008/R-009 / D-010/D-012/D-014
- **输入**：当前认证四材料、根因诊断原始证据、现有模板和实际consumer；T015真实RED证据
- **依赖**：T015
- **并行**：否 — RED/GREEN及共享文件/消费者依赖串行
- **FR**：FR-CONTRACT-005, FR-CONTRACT-006, FR-CONTRACT-007
- **AC**：AC-CONTRACT-005, AC-CONTRACT-006, AC-CONTRACT-007
- **动作**：Use stage introduction/source ownership for local OPEN/DEFER obligations; external references do not become locally owned. Remove substring containment as semantic verdict; retain sourced review rationale and evidence authentication, never trust caller semantic_match alone.；按RED同一命令验证。 所有断言包括：Spec-introduced engineering OPEN propagates downstream without requiring invented make-decision history；External task OPEN retains external owner and does not become local closure obligation；Local missing owner/trigger/handoff/close still reported；Known paraphrase is not rejected by substring rule; contradictory claim is never green based on substring；Unverified semantic evidence stays unknown/unavailable rather than pass；Changed material hash invalidates prior binding
- **精确文件**：`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/five-stage-spec-analyze-wiring.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`、`runtime/stage/stage-content-contracts.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/spec-analyze/SKILL.md`、`workflows/build-plan/SKILL.md`、`skills/spec-analyze/skill-bundle.json`、`skills/spec-analyze/review-bundle.json`、`skills/wh-review/skill-bundle.json`
- **boundary**：files: `tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/five-stage-spec-analyze-wiring.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`、`runtime/stage/stage-content-contracts.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/spec-analyze/SKILL.md`、`workflows/build-plan/SKILL.md`、`skills/spec-analyze/skill-bundle.json`、`skills/spec-analyze/review-bundle.json`、`skills/wh-review/skill-bundle.json`; symbols/regions: 相关合同及真实producer/consumer接线；不改预算/usage/身份或新增公共入口
- **输出**：真实GREEN命令输出与逐AC观察，缺失和失败保留
- **Knowledge**：后续阶段消费统一材料合同与真实host事实；未记录事件/未实测语义仍unknown/unavailable，不补造历史
- **verification_role**：GREEN
- **paired_task**：T015
- **gate_cmd**：`npx vitest run tests/contract/spec-analyze-completeness.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/material-producer-consumer-roundtrip.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`
- **expected_exit**：0
- **oracle**：`MATERIAL_SOURCE_SEMANTICS {"pass":"Spec-introduced engineering OPEN propagates downstream without requiring invented make-decision history; External task OPEN retains external owner and does not become local closure obligation; Local missing owner/trigger/handoff/close still reported; Known paraphrase is not rejected by substring rule; contradictory claim is never green based on substring; Unverified semantic evidence stays unknown/unavailable rather than pass; Changed material hash invalidates prior binding","reject":{"input":"本组列明的合法/非法、错引用、缺失及跨消费者样本，直接消费真实producer输出","expected_rejection":"合法目标行为在旧实现出现指定断言失败；非法样本修复后仍被明确拒绝，不接受初始化失败为RED","observation":"指定Vitest行为断言、原始输出/引用、错误码和完整消费者路径；不得以中间schema通过替代正式handler消费"}}`
- **evidence_path**：`quality/evidence/build-code/material_source_semantics/`
- **STOP**：真实断言无法复现、需要扩大接口/文件或触碰预算/身份时报告具体缺口；不弱化断言；历史事实只读
- **recovery**：本卡执行者只恢复自己修改；保留原始失败证据，配置恢复先核对当前hash，不覆盖他人更改
- **task risk**：RISK-005/006；合同修复不得放宽风险、身份或语义证据；缺失时保持unknown；只回滚本卡改动
- **test tier / test method**：fullstack / fullstack-slice-testing；独立test-routing-advisor按真实接口/身份/并发风险判类
- **scenarios / commands / expected exit / oracle**：SCN-014/SCN-015/SCN-018；使用本卡gate_cmd/expected_exit/MATERIAL_SOURCE_SEMANTICS；正负例均须覆盖
- **fixtures_services**：隔离临时task/home；真实模板、packet、handler及canonical adapter读取生产输出；provider仅stub，禁止真实派发；清理本次fixture
- **coverage limits**：不证明所有宿主自动事件采集；DEFER-005保留；不证明provider质量；不改usage统计或历史reflection
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/build-plan-simple-085d2780-7242-4b2a-ba72-89f79462e347.json
- **semantic_review_reason**：当前扩展输入一次独立审查3完成2失败，5fixed/1rejected_invalid；修订后未再provider复审，最后本地分析另记，实施和语义验收仍未完成

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：补齐正向语义测试fixture的 `semantic_status=completed`；保留并验证 stage-introduced/external OPEN ownership、反矛盾语义匹配、caller `semantic_match` 不作为裁决、材料绑定校验；补强 `make-decision` OPEN 必须仍绑定 decision-log。
- **executed_commands**：同一 T016 gate 首次 exit 0（60 passed）；来源归属修正后 correction gate exit 0（61 passed）。
- **evidence_refs**：[`quality/evidence/build-code/material_source_semantics/T016-GREEN-vitest.log`, `quality/evidence/build-code/material_source_semantics/T016-GREEN-result.json`, `quality/evidence/build-code/material_source_semantics/T016-GREEN-correction-vitest.log`, `quality/evidence/build-code/material_source_semantics/T016-GREEN-correction-result.json`, `quality/evidence/build-code/material_source_semantics/phase-card.md`]
- **covered_ac**：AC-CONTRACT-005/006/007；61 tests passed，覆盖 stage-introduced OPEN 下游传播、external owner 保留、make-decision 来源绑定、local handoff 缺项、已知改写、矛盾/未验证语义保持非通过、材料变更绑定失效。
- **review_fact**：独立语义复审仍为 `incomplete`；本地定向GREEN不等同于最终验收。
- **completed_at**：2026-09-07T08:22:48Z
- **执行事实**：T016 GREEN 已执行并通过；下一依赖卡为 T017。

#### T017 — RED：真实host事件与输出引用

- **ID**：T017
- **Phase**：Phase P0 — 材料合同与执行事实前置修复
- **goal**：RED：真实host事件与输出引用
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7681b3cead847c53bbc84a9f72eb9194181d4794168c203c09ac359c3360603d","id":"review-flow-repair-spec"},{"artifact_kind":"plan","ref":"plan.md","hash":"c38f802e14b9a2645e71173306881db4746eebc06d30d7b980ad40e12e826b27","id":"review-flow-repair-plan"}]`
- **source_refs / decision_refs**：R-008/R-009 / D-010/D-013/D-014
- **输入**：当前认证四材料、根因诊断原始证据、现有模板和实际consumer
- **依赖**：T016
- **并行**：否 — RED/GREEN及共享文件/消费者依赖串行
- **FR**：FR-LIFECYCLE-001, FR-LIFECYCLE-002, FR-LIFECYCLE-003, FR-LIFECYCLE-004, FR-CONTRACT-007
- **AC**：AC-LIFECYCLE-001, AC-LIFECYCLE-002, AC-LIFECYCLE-003, AC-LIFECYCLE-004, AC-CONTRACT-007
- **动作**：只扩展列明现有测试的目标断言并采集RED，不修改生产代码。必须逐项验证：无时间、有成对时间及混合事件保持真实状态，cost保持unavailable；单边/反向/畸形时间拒绝，完整计时校验已知关系，混合仅校验可知关系，无时间按显式提交顺序且不推测并发；重复subject与跨task/stage拒绝且不发布成功。合法业务output不在evidence中仍经bridge→recorder→canonical outcome→后续input形成真实消费边；坏类型、越界、跨任务引用拒绝，旧缺省引用可读且保持partial。按分发后的完整step/skill示例生成显式不同host的payload进入真实bridge，记录正常/失败/取消结果与理由，不把fixture称为自动hook。阶段成功/失败后复盘完成/失败由现有正式reader读取；旧outcome字节/hash不变，状态分别呈现、只调度一次，复盘失败不反向改变阶段事实或阻断同task修复。
- **精确文件**：`tests/contract/host-outcome-bridge.test.mjs`、`tests/contract/claude-outcome-packet.test.mjs`、`tests/contract/derive-consumption-edges.test.mjs`、`tests/contract/stage-runner-on-stage-end.test.mjs`、`tests/contract/build-reflection-page.test.mjs`、`tests/integration/runner-clean-install.test.mjs`
- **boundary**：files: `tests/contract/host-outcome-bridge.test.mjs`、`tests/contract/claude-outcome-packet.test.mjs`、`tests/contract/derive-consumption-edges.test.mjs`、`tests/contract/stage-runner-on-stage-end.test.mjs`、`tests/contract/build-reflection-page.test.mjs`、`tests/integration/runner-clean-install.test.mjs`; symbols/regions: 本组现有测试及局部fixture；该共享安装测试归Phase P0，按当前依赖串行修改
- **输出**：真实RED命令输出与逐AC观察，缺失和失败保留
- **Knowledge**：后续阶段消费统一材料合同与真实host事实；未记录事件/未实测语义仍unknown/unavailable，不补造历史
- **verification_role**：RED
- **paired_task**：T018
- **gate_cmd**：`npx vitest run tests/contract/host-outcome-bridge.test.mjs tests/contract/claude-outcome-packet.test.mjs tests/contract/derive-consumption-edges.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs tests/contract/build-reflection-page.test.mjs tests/integration/runner-clean-install.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`
- **expected_exit**：1
- **oracle**：`HOST_EVENT_REFERENCES {"pass":"无时间、有成对时间及混合事件保持真实状态，cost保持unavailable；单边/反向/畸形时间拒绝，完整计时校验已知关系，混合仅校验可知关系，无时间按显式提交顺序且不推测并发；重复subject与跨task/stage拒绝且不发布成功。合法业务output不在evidence中仍经bridge→recorder→canonical outcome→后续input形成真实消费边；坏类型、越界、跨任务引用拒绝，旧缺省引用可读且保持partial。按分发后的完整step/skill示例生成显式不同host的payload进入真实bridge，记录正常/失败/取消结果与理由，不把fixture称为自动hook。阶段成功/失败后复盘完成/失败由现有正式reader读取；旧outcome字节/hash不变，状态分别呈现、只调度一次，复盘失败不反向改变阶段事实或阻断同task修复。","reject":{"input":"单边/反向/畸形时间、重复subject、跨task/stage、坏类型/越界/跨任务output_refs、缺事件、缺输出与旧缺省记录；合法无时钟事件和合法独立业务输出使用同一实际bridge消费链","expected_rejection":"旧实现对合法无计时事件或业务输出保留出现目标行为断言失败；修复后非法身份/时间/引用明确拒绝且无成功事实，缺事件/输出保持unavailable/partial；不接受初始化失败为RED","observation":"真实bridge发布的canonical outcome、现有deriveConsumptionEdges与正式reflection reader结果；记录原始错误/引用并比对旧outcome字节/hash；协议fixture不证明宿主自动集成"}}`
- **evidence_path**：`quality/evidence/build-code/recheck-20260907/`
- **STOP**：真实断言无法复现、需要扩大接口/文件或触碰预算/身份时报告具体缺口；不弱化断言；历史事实只读
- **recovery**：本卡执行者只恢复自己修改；保留原始失败证据，配置恢复先核对当前hash，不覆盖他人更改
- **task risk**：RISK-005/006；合同修复不得放宽风险、身份或语义证据；缺失时保持unknown；只回滚本卡改动
- **test tier / test method**：fullstack / fullstack-slice-testing；独立test-routing-advisor按真实接口/身份/并发风险判类
- **scenarios / commands / expected exit / oracle**：SCN-016/SCN-017/SCN-018/SCN-019；使用本卡gate_cmd/expected_exit/HOST_EVENT_REFERENCES；正负例均须覆盖
- **fixtures_services**：隔离task/home；以真实完整材料和生产bridge、recorder、canonical adapter、消费边、reflection reader贯通；正常/失败/取消是宿主显式提交的真实结果fixture，不新增执行器或自动finally hook。现有干净安装fixture读取分发后完整事件示例生成payload并调用安装产物；provider只stub，清理本次fixture。
- **coverage limits**：不证明所有宿主自动事件采集；DEFER-005保留；不证明provider质量；不改usage统计或历史reflection
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/build-plan-simple-085d2780-7242-4b2a-ba72-89f79462e347.json
- **semantic_review_reason**：当前扩展输入一次独立审查3完成2失败，5fixed/1rejected_invalid；修订后未再provider复审，最后本地分析另记，实施和语义验收仍未完成

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：N/A — RED 阶段不修改生产代码；在 detached HEAD 临时 worktree 叠加当前 T017 测试输入，生产 worktree 保持不变。
- **executed_commands**：T017 recheck gate 在 detached HEAD + 当前测试输入中 exit 1（45 passed / 22 skipped / 9 failed）；当前实现同一 gate GREEN exit 0（54 passed）。
- **evidence_refs**：[`quality/evidence/build-code/recheck-20260907/T017-RED-result.json`, `quality/evidence/build-code/recheck-20260907/T017-RED-vitest.log`]
- **covered_ac**：基线明确暴露无计时事件、output refs、混合计时和缺失结果错误路径；重复身份/消费边及 reflection 相关已有断言保持通过。首次绿跑不作为RED证据。
- **review_fact**：独立语义复审仍为 `incomplete`；临时基线复现仅补足执行顺序证据，不代表最终验收。
- **completed_at**：2026-09-07T12:08:00Z
- **执行事实**：本次 recheck 在 detached HEAD 加当前 T017 测试输入的临时 worktree 中先运行 RED（45 passed / 22 skipped / 9 failed；失败包含无计时事件、输出引用和旧 bundle 闭包断言），随后在当前实现 worktree 运行同一命令 GREEN（exit 0）。旧 host_event_references RED 证据保留为历史。

#### T018 — GREEN：真实host事件与输出引用

- **ID**：T018
- **Phase**：Phase P0 — 材料合同与执行事实前置修复
- **goal**：GREEN：真实host事件与输出引用
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7681b3cead847c53bbc84a9f72eb9194181d4794168c203c09ac359c3360603d","id":"review-flow-repair-spec"},{"artifact_kind":"plan","ref":"plan.md","hash":"c38f802e14b9a2645e71173306881db4746eebc06d30d7b980ad40e12e826b27","id":"review-flow-repair-plan"}]`
- **source_refs / decision_refs**：R-008/R-009 / D-010/D-013/D-014
- **输入**：当前认证四材料、根因诊断原始证据、现有模板和实际consumer；T017真实RED证据
- **依赖**：T017
- **并行**：否 — RED/GREEN及共享文件/消费者依赖串行
- **FR**：FR-LIFECYCLE-001, FR-LIFECYCLE-002, FR-LIFECYCLE-003, FR-LIFECYCLE-004, FR-CONTRACT-007
- **AC**：AC-LIFECYCLE-001, AC-LIFECYCLE-002, AC-LIFECYCLE-003, AC-LIFECYCLE-004, AC-CONTRACT-007
- **动作**：在现有bridge将时间改为可选成对字段，保留已知时间关系校验、未知时间显式提交顺序；移除无效now/clock传递，cost仍unavailable。recorder与canonical adapter两层保留并验证合法input_refs/output_refs，reader维持旧缺省partial语义。更新现有host说明与build-plan记录说明：主会话在实际调用发生时保留subject、输入输出、结果/理由，缺证据不补造；给完整step/skill示例并由分发后的说明构造payload进入真实consumer。复用原reflection时序与读取路径，仅在本卡针对性用例复现缺陷时局部修复，不新增汇总器。按T017相同命令验证：无时间、有成对时间及混合事件保持真实状态，cost保持unavailable；单边/反向/畸形时间拒绝，完整计时校验已知关系，混合仅校验可知关系，无时间按显式提交顺序且不推测并发；重复subject与跨task/stage拒绝且不发布成功。合法业务output不在evidence中仍经bridge→recorder→canonical outcome→后续input形成真实消费边；坏类型、越界、跨任务引用拒绝，旧缺省引用可读且保持partial。按分发后的完整step/skill示例生成显式不同host的payload进入真实bridge，记录正常/失败/取消结果与理由，不把fixture称为自动hook。阶段成功/失败后复盘完成/失败由现有正式reader读取；旧outcome字节/hash不变，状态分别呈现、只调度一次，复盘失败不反向改变阶段事实或阻断同task修复。
- **精确文件**：`tests/contract/host-outcome-bridge.test.mjs`、`tests/contract/claude-outcome-packet.test.mjs`、`tests/contract/derive-consumption-edges.test.mjs`、`tests/contract/stage-runner-on-stage-end.test.mjs`、`tests/contract/build-reflection-page.test.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`workflows/build-plan/SKILL.md`、`runtime/stage/stage-runner.mjs`、`docs/operations/claude-e2e-sample.md`、`docs/cli-tool-mapping.md`、`tests/integration/runner-clean-install.test.mjs`
- **boundary**：files: `tests/contract/host-outcome-bridge.test.mjs`、`tests/contract/claude-outcome-packet.test.mjs`、`tests/contract/derive-consumption-edges.test.mjs`、`tests/contract/stage-runner-on-stage-end.test.mjs`、`tests/contract/build-reflection-page.test.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`workflows/build-plan/SKILL.md`、`runtime/stage/stage-runner.mjs`、`docs/operations/claude-e2e-sample.md`、`docs/cli-tool-mapping.md`、`tests/integration/runner-clean-install.test.mjs`; symbols/regions: 相关合同及真实producer/consumer接线；不改预算/usage/身份或新增公共入口；该共享安装测试归Phase P0，按当前依赖串行修改
- **输出**：真实GREEN命令输出与逐AC观察，缺失和失败保留
- **Knowledge**：后续阶段消费统一材料合同与真实host事实；未记录事件/未实测语义仍unknown/unavailable，不补造历史
- **verification_role**：GREEN
- **paired_task**：T017
- **gate_cmd**：`npx vitest run tests/contract/host-outcome-bridge.test.mjs tests/contract/claude-outcome-packet.test.mjs tests/contract/derive-consumption-edges.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs tests/contract/build-reflection-page.test.mjs tests/integration/runner-clean-install.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`
- **expected_exit**：0
- **oracle**：`HOST_EVENT_REFERENCES {"pass":"无时间、有成对时间及混合事件保持真实状态，cost保持unavailable；单边/反向/畸形时间拒绝，完整计时校验已知关系，混合仅校验可知关系，无时间按显式提交顺序且不推测并发；重复subject与跨task/stage拒绝且不发布成功。合法业务output不在evidence中仍经bridge→recorder→canonical outcome→后续input形成真实消费边；坏类型、越界、跨任务引用拒绝，旧缺省引用可读且保持partial。按分发后的完整step/skill示例生成显式不同host的payload进入真实bridge，记录正常/失败/取消结果与理由，不把fixture称为自动hook。阶段成功/失败后复盘完成/失败由现有正式reader读取；旧outcome字节/hash不变，状态分别呈现、只调度一次，复盘失败不反向改变阶段事实或阻断同task修复。","reject":{"input":"单边/反向/畸形时间、重复subject、跨task/stage、坏类型/越界/跨任务output_refs、缺事件、缺输出与旧缺省记录；合法无时钟事件和合法独立业务输出使用同一实际bridge消费链","expected_rejection":"旧实现对合法无计时事件或业务输出保留出现目标行为断言失败；修复后非法身份/时间/引用明确拒绝且无成功事实，缺事件/输出保持unavailable/partial；不接受初始化失败为RED","observation":"真实bridge发布的canonical outcome、现有deriveConsumptionEdges与正式reflection reader结果；记录原始错误/引用并比对旧outcome字节/hash；协议fixture不证明宿主自动集成"}}`
- **evidence_path**：`quality/evidence/build-code/recheck-20260907/`
- **STOP**：真实断言无法复现、需要扩大接口/文件或触碰预算/身份时报告具体缺口；不弱化断言；历史事实只读
- **recovery**：本卡执行者只恢复自己修改；保留原始失败证据，配置恢复先核对当前hash，不覆盖他人更改
- **task risk**：RISK-005/006；合同修复不得放宽风险、身份或语义证据；缺失时保持unknown；只回滚本卡改动
- **test tier / test method**：fullstack / fullstack-slice-testing；独立test-routing-advisor按真实接口/身份/并发风险判类
- **scenarios / commands / expected exit / oracle**：SCN-016/SCN-017/SCN-018/SCN-019；使用本卡gate_cmd/expected_exit/HOST_EVENT_REFERENCES；正负例均须覆盖
- **fixtures_services**：隔离task/home；以真实完整材料和生产bridge、recorder、canonical adapter、消费边、reflection reader贯通；正常/失败/取消是宿主显式提交的真实结果fixture，不新增执行器或自动finally hook。现有干净安装fixture读取分发后完整事件示例生成payload并调用安装产物；provider只stub，清理本次fixture。
- **coverage limits**：不证明所有宿主自动事件采集；DEFER-005保留；不证明provider质量；不改usage统计或历史reflection
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/build-plan-simple-085d2780-7242-4b2a-ba72-89f79462e347.json
- **semantic_review_reason**：当前扩展输入一次独立审查3完成2失败，5fixed/1rejected_invalid；修订后未再provider复审，最后本地分析另记，实施和语义验收仍未完成

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：bridge 支持无计时成对事件并保持显式提交顺序；保留已知计时关系校验；recorder/canonical adapter/runner 贯通合法 output refs 并拒绝越界或非支持命名空间；缺事件、缺输出和 reflection 失败仍保持真实 unavailable/partial 语义。
- **executed_commands**：`npx vitest run tests/contract/host-outcome-bridge.test.mjs tests/contract/claude-outcome-packet.test.mjs tests/contract/derive-consumption-edges.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs tests/contract/build-reflection-page.test.mjs tests/integration/runner-clean-install.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`（exit 0；54 passed）
- **evidence_refs**：[`quality/evidence/build-code/recheck-20260907/T017-T018-GREEN-vitest.log`, `quality/evidence/build-code/recheck-20260907/T017-T018-GREEN-result.json`]
- **covered_ac**：AC-LIFECYCLE-001/002/003/004、AC-CONTRACT-007；host bridge、canonical outcome、消费边、reflection reader及clean-install分发路径均通过；54 tests passed。
- **review_fact**：独立语义复审仍为 `incomplete`；本地定向GREEN不等同于最终验收，DEFER-005 自动host hook仍延期。
- **completed_at**：2026-09-07T12:11:00Z
- **执行事实**：T017 RED 先于本次 GREEN；当前实现同一六文件门禁 exit 0，旧 GREEN 证据保留为历史，当前引用指向本次真实配对。

#### T019 — VERIFY：前置修复整合与分发一致性

- **ID**：T019
- **Phase**：Phase P0 — 材料合同与执行事实前置修复
- **goal**：VERIFY：前置修复整合与分发一致性
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7681b3cead847c53bbc84a9f72eb9194181d4794168c203c09ac359c3360603d","id":"review-flow-repair-spec"},{"artifact_kind":"plan","ref":"plan.md","hash":"c38f802e14b9a2645e71173306881db4746eebc06d30d7b980ad40e12e826b27","id":"review-flow-repair-plan"}]`
- **source_refs / decision_refs**：R-008/R-009 / D-010～D-014
- **输入**：T013～T018真实结果及更新模板/bundle与现有干净安装consumer；只读运行既有tests/integration/distribution-closure.test.mjs（见Phase READ/VERIFY ONLY，不纳入修改boundary）
- **依赖**：T018
- **并行**：否 — RED/GREEN及共享文件/消费者依赖串行
- **FR**：FR-CONTRACT-001, FR-CONTRACT-002, FR-CONTRACT-003, FR-CONTRACT-004, FR-CONTRACT-005, FR-CONTRACT-006, FR-CONTRACT-007, FR-LIFECYCLE-001, FR-LIFECYCLE-002, FR-LIFECYCLE-003, FR-LIFECYCLE-004
- **AC**：AC-CONTRACT-001, AC-CONTRACT-002, AC-CONTRACT-003, AC-CONTRACT-004, AC-CONTRACT-005, AC-CONTRACT-006, AC-CONTRACT-007, AC-LIFECYCLE-001, AC-LIFECYCLE-002, AC-LIFECYCLE-003, AC-LIFECYCLE-004
- **动作**：运行列明P0聚合；同一完整材料依次进入所有实际validator与official handler，覆盖合法/非法风险与UI/non-UI、角色/Oracle、来源/语义、host事件与引用；检查bundle哈希和干净安装实际行为。发现失败回所属卡修复；本卡不新增实现或声称最终验收。
- **精确文件**：`tests/contract/filled-plan-task-production.test.mjs`、`tests/contract/material-oracle-context-packet.test.mjs`、`tests/contract/plan-acceptance-task-gate.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`、`tests/contract/confirmation-authorization.test.mjs`、`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/five-stage-spec-analyze-wiring.test.mjs`、`tests/contract/host-outcome-bridge.test.mjs`、`tests/contract/claude-outcome-packet.test.mjs`、`tests/contract/derive-consumption-edges.test.mjs`、`tests/contract/stage-runner-on-stage-end.test.mjs`、`tests/contract/build-reflection-page.test.mjs`、`tests/integration/runner-clean-install.test.mjs`
- **boundary**：files: `tests/contract/filled-plan-task-production.test.mjs`、`tests/contract/material-oracle-context-packet.test.mjs`、`tests/contract/plan-acceptance-task-gate.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`、`tests/contract/confirmation-authorization.test.mjs`、`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/five-stage-spec-analyze-wiring.test.mjs`、`tests/contract/host-outcome-bridge.test.mjs`、`tests/contract/claude-outcome-packet.test.mjs`、`tests/contract/derive-consumption-edges.test.mjs`、`tests/contract/stage-runner-on-stage-end.test.mjs`、`tests/contract/build-reflection-page.test.mjs`、`tests/integration/runner-clean-install.test.mjs`; symbols/regions: 只执行既有受影响整合验证，不新增生产文件
- **输出**：限定聚合输出、每个consumer和11项新增AC证据及剩余缺口
- **Knowledge**：P1消费P0完成事实；T012再次在最终快照合并全部28AC，P0绿不能替代最终验收
- **verification_role**：N/A — non-behavior change: 验证已实现修复，不新增行为
- **paired_task**：N/A — 整合验证不新增RED/GREEN配对
- **gate_cmd**：`npx vitest run tests/contract/filled-plan-task-production.test.mjs tests/contract/material-oracle-context-packet.test.mjs tests/contract/plan-acceptance-task-gate.test.mjs tests/contract/material-producer-consumer-roundtrip.test.mjs tests/contract/confirmation-authorization.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/host-outcome-bridge.test.mjs tests/contract/claude-outcome-packet.test.mjs tests/contract/derive-consumption-edges.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs tests/contract/build-reflection-page.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`
- **expected_exit**：0
- **oracle**：`MATERIAL_HOST_INTEGRATION {"pass": "P0列明14个测试文件通过，真实所有消费者与bundle安装一致；正负例和缺失事实正确；不把绿色当T012验收"}`
- **evidence_path**：`quality/evidence/build-code/material_host_integration/`
- **STOP**：缺失/失败回具体实现卡；禁止删消费者、弱化高风险要求或造历史事实换取通过
- **recovery**：本卡执行者只恢复自己修改；保留原始失败证据，配置恢复先核对当前hash，不覆盖他人更改
- **task risk**：RISK-005/006；整合只证明指定消费者；不得把新模板静态可读等同全部handler兼容
- **test tier / test method**：fullstack / fullstack-slice-testing；独立test-routing-advisor按真实接口/身份/并发风险判类
- **scenarios / commands / expected exit / oracle**：SCN-013～019；本卡限定命令，expected_exit=0，MATERIAL_HOST_INTEGRATION
- **fixtures_services**：隔离task/home/干净安装目录；真实材料producer与consumer；仅stub外部provider；清理本次fixture
- **coverage limits**：不是最终acceptance；不进行真实provider调用，不覆盖所有host；未观察到事件和cost不伪造
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/build-plan-simple-085d2780-7242-4b2a-ba72-89f79462e347.json
- **semantic_review_reason**：当前扩展输入一次独立审查3完成2失败，5fixed/1rejected_invalid；修订后未再provider复审，最后本地分析另记，实施和语义验收仍未完成

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：N/A — 仅运行既有P0聚合和分发验证；未新增实现或修改只读 distribution-closure 测试。
- **executed_commands**：首次聚合 exit 0（14 files，158 passed）；P0来源修正后 correction 聚合受外部 config 瞬态非法JSON影响 exit 1（157 passed，2 failed）；host 单测恢复后 final 聚合 exit 0（14 files，159 passed，约95.91s）。
- **evidence_refs**：[`quality/evidence/build-code/material_host_integration/T019-VERIFY-vitest.log`, `quality/evidence/build-code/material_host_integration/T019-VERIFY-result.json`, `quality/evidence/build-code/material_host_integration/T019-VERIFY-correction-vitest.log`, `quality/evidence/build-code/material_host_integration/T019-VERIFY-correction-result.json`, `quality/evidence/build-code/material_host_integration/T019-VERIFY-final-vitest.log`, `quality/evidence/build-code/material_host_integration/T019-VERIFY-final-result.json`, `quality/evidence/build-code/material_host_integration/phase-card.md`, `quality/evidence/build-code/material_host_integration/test-routing-advisor.json`]
- **covered_ac**：AC-CONTRACT-001～007、AC-LIFECYCLE-001～004；最终指定14个consumer、distribution closure与clean-install closure通过，159 tests passed。中间失败原始日志保留，未计入通过。
- **review_fact**：独立语义复审仍为 `incomplete`；P0聚合绿不等于T012最终验收，也不证明DEFER-005自动host hook。
- **completed_at**：2026-09-07T08:37:08Z
- **执行事实**：T019 P0整合与分发验证已通过；下一依赖卡为T001。

## Phase P1 — 配置单源与兼容生产契约

### Goal

provider 只由 3rd-review 定义；路由顺序保留；新旧记录读合同兼容；迁移变换可恢复且不派发。

### Files

- **NEW**：`tests/review/review-policy-compatibility.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/third-review-host-config.mjs`、`runtime/review/schemas/attempt.schema.json`、`docs/architecture/move-map.json`、`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`tests/helpers/formal-review.mjs`

### Tasks

- `T001`：RED 单源配置与历史兼容；Files：`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`tests/review/review-policy-compatibility.test.mjs`
- `T002`：GREEN 单源配置与历史兼容；Files：`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`tests/review/review-policy-compatibility.test.mjs`、`skills/wh-review/scripts/third-review-host-config.mjs`、`runtime/review/schemas/attempt.schema.json`、`docs/architecture/move-map.json`、`tests/helpers/formal-review.mjs`

### Verify

REVIEW_CONFIG_COMPAT；本 Phase 必须完成下列配置与兼容验证。

`npx vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs tests/review/review-policy-compatibility.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`；RED=1/GREEN=0；REVIEW_CONFIG_COMPAT；`quality/evidence/build-code/review_config_compat/`。

### Knowledge

T001依赖P0的T019完成。P2消费无priority新policy；旧policy hash不重算、不重写，legacy tiers仍按原规则选择。

### STOP

命令不可执行、RED仅setup失败、需要改decision/spec/身份/预算或精确文件越界时，停止对应修改并回所属owner；继续不依赖该修改的工作。

### Done

所属卡有实际命令/退出码、逐AC证据、真实审查事实及剩余限制；本阶段仅pending设计，不声明已做到。

### Risks and rollback

RISK-002/FR-CONFIG-003：迁移若观察到配置漂移，拒绝覆盖；仅恢复本次代码或经 hash 核对的备份，不改历史。

#### T001 — RED：单源配置与历史兼容

- **ID**：T001
- **Phase**：Phase P1 — 配置单源与兼容生产契约
- **goal**：RED：单源配置与历史兼容
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7681b3cead847c53bbc84a9f72eb9194181d4794168c203c09ac359c3360603d","id":"review-flow-repair-spec"},{"artifact_kind":"plan","ref":"plan.md","hash":"c38f802e14b9a2645e71173306881db4746eebc06d30d7b980ad40e12e826b27","id":"review-flow-repair-plan"}]`
- **source_refs / decision_refs**：R-001, R-002, R-004, R-007 / D-001, D-004, D-005, D-008
- **输入**：当前packet投影的spec/plan与原始配置/历史记录fixture
- **依赖**：T019
- **并行**：否 — RED/GREEN及共享文件/消费者依赖串行
- **FR**：FR-CONFIG-001, FR-CONFIG-002, FR-CONFIG-003, FR-COMPAT-001, FR-COMPAT-002, FR-SAFETY-001
- **AC**：AC-CONFIG-001, AC-CONFIG-002, AC-CONFIG-003, AC-COMPAT-001, AC-COMPAT-002, AC-SAFETY-001
- **动作**：在精确测试文件新增/更新 单源配置与历史兼容 目标断言（命令含 -t 时describe按该名称），先运行并保留真实断言失败；不改生产代码。；仅新增/扩展测试以验证拟实现restoreWhReviewConfig显式hash守卫：真实迁移后restore回原字节；调用前与替换前漂移均CONFIG_RESTORE_CONFLICT且目标字节不变；坏hash/缺失备份拒绝；失败不返回restored:true；仅扩本组现有测试。
- **精确文件**：`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`tests/review/review-policy-compatibility.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`tests/review/review-policy-compatibility.test.mjs`; symbols/regions: 仅本卡命名测试describe/fixture，不改生产实现
- **输出**：预定断言RED输出，不接受setup失败
- **Knowledge**：P2 消费无 priority 的新 policy；旧 policy hash 不重算、不重写，legacy tiers 仍按原规则选择。
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs tests/review/review-policy-compatibility.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`
- **expected_exit**：1
- **oracle**：`REVIEW_CONFIG_COMPAT {"pass":"单源 provider 定义可加载且显式路由按列表顺序；旧 priority/无 dispatch_state 样本可读且 hash 不变，新 policy hash 有变化而同新 policy 可匹配；legacy 选择、最低异源和迁移备份/漂移保护不退化。；在既有loader实现/验证restoreWhReviewConfig显式hash守卫：真实迁移后restore回原字节；调用前与替换前漂移均CONFIG_RESTORE_CONFLICT且目标字节不变；坏hash/缺失备份拒绝；失败不返回restored:true；仅扩本组现有测试。","reject":{"input":"无 profiles 的合法配置、含 profiles/priority 的旧配置、旧记录与改变顺序的新 route、迁移期间配置漂移。；恢复前/替换前漂移及坏hash/缺失备份","expected_rejection":"旧实现拒绝合法单源配置或仍要求 priority 的目标断言失败；旧格式必须明确拒绝并给迁移动作；漂移不得覆盖。；restore冲突明确CONFIG_RESTORE_CONFLICT且目标保持","observation":"Vitest 指定行为断言失败；不接受 import/fixture/权限初始化失败作为 RED。"}}`
- **evidence_path**：`quality/evidence/build-code/review_config_compat/`
- **STOP**：命令不可执行、RED只是环境失败、需弱化断言/改方向/身份/预算或越界时，停止对应修改并回owner；T012消费P0真实修复证据并保留任何未解决缺口
- **recovery**：本卡执行者只恢复自己修改；保留原始失败证据，配置恢复先核对当前hash，不覆盖他人更改
- **task risk**：RISK-002/FR-CONFIG-003：迁移若观察到配置漂移，拒绝覆盖；仅恢复本次代码或经 hash 核对的备份，不改历史。
- **test tier / test method**：fullstack / fullstack-slice-testing；独立test-routing-advisor按真实接口/身份/并发风险判类
- **scenarios / commands / expected exit / oracle**：SCN-001/002/008/010；唯一源变更、顺序/legacy、旧记录读、新写策略、迁移无派发与漂移拒绝。；使用本卡gate_cmd/expected_exit/REVIEW_CONFIG_COMPAT；不得把局部输出当整体成功
- **fixtures_services**：隔离临时home/config/task与真实文件系统，冻结新旧记录；broker stub仅控制provider，不mock掉host/保存consumer；执行者清理自己创建的临时夹具，保留证据
- **coverage limits**：不调用真实 provider；schema 可读不等于实际 writer/consumer 已正确，新写与消费由 P2 证明。
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/build-plan-simple-085d2780-7242-4b2a-ba72-89f79462e347.json
- **semantic_review_reason**：当前扩展输入一次独立审查3完成2失败，5fixed/1rejected_invalid；修订后未再provider复审，最后本地分析另记，实施和语义验收仍未完成

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增单源/兼容测试fixture及迁移守卫负例；未修改生产实现。
- **executed_commands**：`npx vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs tests/review/review-policy-compatibility.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`（exit 1；31 passed，1 failed）
- **evidence_refs**：[`quality/evidence/build-code/review_config_compat/T001-RED-vitest.log`, `quality/evidence/build-code/review_config_compat/T001-RED-result.json`, `quality/evidence/build-code/review_config_compat/phase-card.md`]
- **covered_ac**：RED exposed retired `wh_review.profiles` acceptance while single-source order and hash-guard fixtures passed; no setup failure was used as RED.
- **review_fact**：独立语义复审仍为 `incomplete`；本卡只记录真实RED。
- **completed_at**：2026-09-07T08:48:29Z
- **执行事实**：T001 RED 已执行；旧 profiles 仍被 loader 接受路径间接阻塞，进入 T002 修复。

#### T002 — GREEN：单源配置与历史兼容

- **ID**：T002
- **Phase**：Phase P1 — 配置单源与兼容生产契约
- **goal**：GREEN：单源配置与历史兼容
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7681b3cead847c53bbc84a9f72eb9194181d4794168c203c09ac359c3360603d","id":"review-flow-repair-spec"},{"artifact_kind":"plan","ref":"plan.md","hash":"c38f802e14b9a2645e71173306881db4746eebc06d30d7b980ad40e12e826b27","id":"review-flow-repair-plan"}]`
- **source_refs / decision_refs**：R-001, R-002, R-004, R-007 / D-001, D-004, D-005, D-008
- **输入**：当前packet投影的spec/plan与T001真实输出；不得猜上游结果
- **依赖**：T001
- **并行**：否 — RED/GREEN及共享文件/消费者依赖串行
- **FR**：FR-CONFIG-001, FR-CONFIG-002, FR-CONFIG-003, FR-COMPAT-001, FR-COMPAT-002, FR-SAFETY-001
- **AC**：AC-CONFIG-001, AC-CONFIG-002, AC-CONFIG-003, AC-COMPAT-001, AC-COMPAT-002, AC-SAFETY-001
- **动作**：删除重复 profiles 声明/一致性校验和显式 priority 排序；保留 legacy tiers 去重算法；schema 宽读，新写约束留给 P2 writer；在 loader 内提供最小纯迁移变换并测试备份/替换前 hash 冲突；登记新增测试及本期持久对象职责。；随后运行与RED同一命令。；在既有loader实现/验证restoreWhReviewConfig显式hash守卫：真实迁移后restore回原字节；调用前与替换前漂移均CONFIG_RESTORE_CONFLICT且目标字节不变；坏hash/缺失备份拒绝；失败不返回restored:true；仅扩本组现有测试。
- **精确文件**：`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`tests/review/review-policy-compatibility.test.mjs`、`skills/wh-review/scripts/third-review-host-config.mjs`、`runtime/review/schemas/attempt.schema.json`、`docs/architecture/move-map.json`、`tests/helpers/formal-review.mjs`
- **boundary**：files: `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`tests/review/review-policy-compatibility.test.mjs`、`skills/wh-review/scripts/third-review-host-config.mjs`、`runtime/review/schemas/attempt.schema.json`、`docs/architecture/move-map.json`、`tests/helpers/formal-review.mjs`; symbols/regions: 仅plan规定的相关接口/配置/文档区域，不改排除域
- **输出**：真实命令输出、AC观察、原始引用与未覆盖项
- **Knowledge**：P2 消费无 priority 的新 policy；旧 policy hash 不重算、不重写，legacy tiers 仍按原规则选择。
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs tests/review/review-policy-compatibility.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`
- **expected_exit**：0
- **oracle**：`REVIEW_CONFIG_COMPAT {"pass":"单源 provider 定义可加载且显式路由按列表顺序；旧 priority/无 dispatch_state 样本可读且 hash 不变，新 policy hash 有变化而同新 policy 可匹配；legacy 选择、最低异源和迁移备份/漂移保护不退化。；在既有loader实现/验证restoreWhReviewConfig显式hash守卫：真实迁移后restore回原字节；调用前与替换前漂移均CONFIG_RESTORE_CONFLICT且目标字节不变；坏hash/缺失备份拒绝；失败不返回restored:true；仅扩本组现有测试。","reject":{"input":"无 profiles 的合法配置、含 profiles/priority 的旧配置、旧记录与改变顺序的新 route、迁移期间配置漂移。；恢复前/替换前漂移及坏hash/缺失备份","expected_rejection":"旧实现拒绝合法单源配置或仍要求 priority 的目标断言失败；旧格式必须明确拒绝并给迁移动作；漂移不得覆盖。；restore冲突明确CONFIG_RESTORE_CONFLICT且目标保持","observation":"Vitest 指定行为断言失败；不接受 import/fixture/权限初始化失败作为 RED。"}}`
- **evidence_path**：`quality/evidence/build-code/review_config_compat/`
- **STOP**：命令不可执行、RED只是环境失败、需弱化断言/改方向/身份/预算或越界时，停止对应修改并回owner；T012消费P0真实修复证据并保留任何未解决缺口
- **recovery**：本卡执行者只恢复自己修改；保留原始失败证据，配置恢复先核对当前hash，不覆盖他人更改
- **task risk**：RISK-002/FR-CONFIG-003：迁移若观察到配置漂移，拒绝覆盖；仅恢复本次代码或经 hash 核对的备份，不改历史。
- **test tier / test method**：fullstack / fullstack-slice-testing；独立test-routing-advisor按真实接口/身份/并发风险判类
- **scenarios / commands / expected exit / oracle**：SCN-001/002/008/010；唯一源变更、顺序/legacy、旧记录读、新写策略、迁移无派发与漂移拒绝。；使用本卡gate_cmd/expected_exit/REVIEW_CONFIG_COMPAT；不得把局部输出当整体成功
- **fixtures_services**：隔离临时home/config/task与真实文件系统，冻结新旧记录；broker stub仅控制provider，不mock掉host/保存consumer；执行者清理自己创建的临时夹具，保留证据
- **coverage limits**：不调用真实 provider；schema 可读不等于实际 writer/consumer 已正确，新写与消费由 P2 证明。
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/build-plan-simple-085d2780-7242-4b2a-ba72-89f79462e347.json
- **semantic_review_reason**：当前扩展输入一次独立审查3完成2失败，5fixed/1rejected_invalid；修订后未再provider复审，最后本地分析另记，实施和语义验收仍未完成

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：loader 拒绝 `wh_review.profiles/priority` 并给迁移动作；有效 provider definitions 直接从 3rd-review broker 生效；显式 route 保持列表顺序；现有 route 测试迁移到单源契约。
- **executed_commands**：`npx vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs tests/review/review-policy-compatibility.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`（exit 0；32 passed）
- **evidence_refs**：[`quality/evidence/build-code/review_config_compat/T002-GREEN-vitest.log`, `quality/evidence/build-code/review_config_compat/T002-GREEN-result.json`, `quality/evidence/build-code/review_config_compat/phase-card.md`, `quality/evidence/build-code/review_config_compat/test-routing-advisor.json`]
- **covered_ac**：AC-CONFIG-001/002/003、AC-COMPAT-001/002、AC-SAFETY-001；旧格式显式拒绝、broker 单源 provider 定义、route 顺序、legacy fallback 及迁移 hash guard 通过。
- **review_fact**：独立语义复审仍为 `incomplete`；本地定向GREEN不等同最终验收。
- **completed_at**：2026-09-07T08:50:54Z
- **执行事实**：T002 GREEN 已执行并通过；下一依赖卡为 T003。

## Phase P2 — 静态预检与单一记录闭环

### Goal

任务调用和裸跑各由一个 owner 保存；静态拦截、成功、失败、复用、E2E 首项和保存故障均返回真实引用或明确缺口。

### Files

- **NEW**：N/A — 复用现有文件
- **MODIFY**：`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`runtime/review/review-record-route.mjs`、`skills/wh-review/scripts/review-result.mjs`、`tools/cli/stage-runtime.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`tests/review/review-record-route.test.mjs`、`skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs`、`tests/e2e/stage-reflection-real-task.test.mjs`、`tests/contract/runtime-facade.test.mjs`、`tests/contract/review-layering.test.mjs`、`tests/integration/mini-task-delivery.test.mjs`、`tests/contract/workflow-evolution-final-aggregate.test.mjs`、`tests/final-cutover-guards.red.test.mjs`

### Tasks

- `T003`：RED 锁前静态预检；Files：`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- `T004`：GREEN 锁前静态预检；Files：`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`
- `T005`：RED 任务调用与不可变记录闭环；Files：`tests/review/review-record-route.test.mjs`、`tests/e2e/stage-reflection-real-task.test.mjs`、`skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs`、`tests/contract/runtime-facade.test.mjs`
- `T006`：GREEN 任务调用与不可变记录闭环；Files：`tests/review/review-record-route.test.mjs`、`tests/e2e/stage-reflection-real-task.test.mjs`、`skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs`、`tests/contract/runtime-facade.test.mjs`、`runtime/review/review-record-route.mjs`、`skills/wh-review/scripts/review-result.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`tools/cli/stage-runtime.mjs`
- `T007`：RED 裸跑诊断与保存故障；Files：`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`tests/review/review-record-route.test.mjs`
- `T008`：GREEN 裸跑诊断与保存故障；Files：`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`tests/review/review-record-route.test.mjs`、`runtime/review/review-record-route.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`
- `T009`：RED E2E 首项与相邻保护；Files：`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`tests/contract/review-layering.test.mjs`、`tests/integration/mini-task-delivery.test.mjs`、`tests/contract/workflow-evolution-final-aggregate.test.mjs`、`tests/final-cutover-guards.red.test.mjs`
- `T010`：GREEN E2E 首项与相邻保护；Files：`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`tests/contract/review-layering.test.mjs`、`tests/integration/mini-task-delivery.test.mjs`、`tests/contract/workflow-evolution-final-aggregate.test.mjs`、`tests/final-cutover-guards.red.test.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/wh-review/scripts/review-runner.mjs`

### Verify

REVIEW_STATIC_PREFLIGHT；本 Phase 还必须完成 REVIEW_TASK_RECORD、REVIEW_BARE_SINK、REVIEW_E2E_FIRST，不能只验证第一组。

`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs -t "review flow static preflight" --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`；RED=1/GREEN=0；REVIEW_STATIC_PREFLIGHT；`quality/evidence/build-code/review_static_preflight/`。
`npx vitest run tests/review/review-record-route.test.mjs tests/e2e/stage-reflection-real-task.test.mjs skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs tests/contract/runtime-facade.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`；RED=1/GREEN=0；REVIEW_TASK_RECORD；`quality/evidence/build-code/review_task_record/`。
`npx vitest run skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs tests/review/review-record-route.test.mjs -t "review flow sink" --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`；RED=1/GREEN=0；REVIEW_BARE_SINK；`quality/evidence/build-code/review_bare_sink/`。
`npx vitest run skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs tests/contract/review-layering.test.mjs tests/integration/mini-task-delivery.test.mjs tests/contract/workflow-evolution-final-aggregate.test.mjs tests/final-cutover-guards.red.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`；RED=1/GREEN=0；REVIEW_E2E_FIRST；`quality/evidence/build-code/recheck-20260907/`。

### Knowledge

P3 只运行已实现路径；同任务修复不等于允许自动重审；usage 消费缺口和身份不匹配保持可见。

### STOP

命令不可执行、RED仅setup失败、需要改decision/spec/身份/预算或精确文件越界时，停止对应修改并回所属owner；继续不依赖该修改的工作。

### Done

所属卡有实际命令/退出码、逐AC证据、真实审查事实及剩余限制；本阶段仅pending设计，不声明已做到。

### Risks and rollback

RISK-001/003/004：绑定漂移、部分保存和超时保持失败；保留开始/终态报告，不覆盖原证据；回到具体 RED/GREEN 修复。

#### T003 — RED：锁前静态预检

- **ID**：T003
- **Phase**：Phase P2 — 静态预检与单一记录闭环
- **goal**：RED：锁前静态预检
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7681b3cead847c53bbc84a9f72eb9194181d4794168c203c09ac359c3360603d","id":"review-flow-repair-spec"},{"artifact_kind":"plan","ref":"plan.md","hash":"c38f802e14b9a2645e71173306881db4746eebc06d30d7b980ad40e12e826b27","id":"review-flow-repair-plan"}]`
- **source_refs / decision_refs**：R-002, R-003, R-007 / D-002, D-008
- **输入**：当前packet投影的spec/plan与T002真实输出；不得猜上游结果
- **依赖**：T002
- **并行**：否 — RED/GREEN及共享文件/消费者依赖串行
- **FR**：FR-PREFLIGHT-001, FR-PREFLIGHT-002, FR-PREFLIGHT-003, FR-SAFETY-001
- **AC**：AC-PREFLIGHT-001, AC-PREFLIGHT-002, AC-PREFLIGHT-003, AC-SAFETY-001
- **动作**：在精确测试文件新增/更新 锁前静态预检 目标断言（命令含 -t 时describe按该名称），先运行并保留真实断言失败；不改生产代码。
- **精确文件**：`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`; symbols/regions: 仅本卡命名测试describe/fixture，不改生产实现
- **输出**：预定断言RED输出，不接受setup失败
- **Knowledge**：P3 只运行已实现路径；同任务修复不等于允许自动重审；usage 消费缺口和身份不匹配保持可见。
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs -t "review flow static preflight" --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`
- **expected_exit**：1
- **oracle**：`REVIEW_STATIC_PREFLIGHT {"pass":"静态非法输入在 buildBundle/锁/broker 前被识别；required 减 generated；白名单三码及四字段脱敏；unknown 单独存在不拦截。入口计算本地预检耗时，完整含保存的 1000ms 指标由 T006/T008 证明。","reject":{"input":"配置不存在/坏形状、空路由、缺失/禁用首项、同源、附件越界、必需材料空值，以及仅 broker probe unknown。","expected_rejection":"每个非法样本命中原定静态错误；合法 unknown 继续；旧 runner 漏检/误拦截目标断言为 RED。","observation":"buildBundle、锁和 runGroup spy 均为 0；合法 unknown 的 broker stub 被调用；四字段无秘密。"}}`
- **evidence_path**：`quality/evidence/build-code/review_static_preflight/`
- **STOP**：命令不可执行、RED只是环境失败、需弱化断言/改方向/身份/预算或越界时，停止对应修改并回owner；T012消费P0真实修复证据并保留任何未解决缺口
- **recovery**：本卡执行者只恢复自己修改；保留原始失败证据，配置恢复先核对当前hash，不覆盖他人更改
- **task risk**：RISK-001/003/004：绑定漂移、部分保存和超时保持失败；保留开始/终态报告，不覆盖原证据；回到具体 RED/GREEN 修复。
- **test tier / test method**：fullstack / fullstack-slice-testing；独立test-routing-advisor按真实接口/身份/并发风险判类
- **scenarios / commands / expected exit / oracle**：SCN-003/004/005；generated review_instructions 不要求 caller 提供；mini_task/phase/integration 沿既有 reviewRuleFor。；使用本卡gate_cmd/expected_exit/REVIEW_STATIC_PREFLIGHT；不得把局部输出当整体成功
- **fixtures_services**：隔离临时home/config/task与真实文件系统，冻结新旧记录；broker stub仅控制provider，不mock掉host/保存consumer；执行者清理自己创建的临时夹具，保留证据
- **coverage limits**：本命令证明静态边界，不单独声称含真实写盘的 1 秒验收；P2 后续真实适配器集成覆盖该 seam。
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/build-plan-simple-085d2780-7242-4b2a-ba72-89f79462e347.json
- **semantic_review_reason**：当前扩展输入一次独立审查3完成2失败，5fixed/1rejected_invalid；修订后未再provider复审，最后本地分析另记，实施和语义验收仍未完成

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：在 `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` 新增 `review flow static preflight` 命名测试，覆盖缺失必需材料、空路由、同源选择、敏感诊断字段和 broker health unknown。
- **executed_commands**：`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs -t "review flow static preflight" --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`（可逆基线 RED，exit 1；3 failed / 1 passed / 29 skipped）。
- **evidence_refs**：[`quality/evidence/build-code/review_static_preflight/T003-RED-vitest.log`, `quality/evidence/build-code/review_static_preflight/T003-RED-result.json`]
- **covered_ac**：AC-PREFLIGHT-001/002/003、AC-SAFETY-001 的目标断言已形成真实 RED；GREEN 由 T004 消费。
- **review_fact**：本卡为 RED 测试卡；失败来自旧 runner 漏检/误派发，非 setup 失败。
- **completed_at**：2026-09-07T09:03:00Z
- **执行事实**：已保存旧实现基线的真实断言失败；未改生产实现。

#### T004 — GREEN：锁前静态预检

- **ID**：T004
- **Phase**：Phase P2 — 静态预检与单一记录闭环
- **goal**：GREEN：锁前静态预检
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7681b3cead847c53bbc84a9f72eb9194181d4794168c203c09ac359c3360603d","id":"review-flow-repair-spec"},{"artifact_kind":"plan","ref":"plan.md","hash":"c38f802e14b9a2645e71173306881db4746eebc06d30d7b980ad40e12e826b27","id":"review-flow-repair-plan"}]`
- **source_refs / decision_refs**：R-002, R-003, R-007 / D-002, D-008
- **输入**：当前packet投影的spec/plan与T003真实输出；不得猜上游结果
- **依赖**：T003
- **并行**：否 — RED/GREEN及共享文件/消费者依赖串行
- **FR**：FR-PREFLIGHT-001, FR-PREFLIGHT-002, FR-PREFLIGHT-003, FR-SAFETY-001
- **AC**：AC-PREFLIGHT-001, AC-PREFLIGHT-002, AC-PREFLIGHT-003, AC-SAFETY-001
- **动作**：在 simple runner 入口增加纯静态预检，复用 reviewRuleFor 与配置选择 helper，保持 broker/cleanup 生命周期；CLI 仅转接诊断；不把落盘写入 simple runner。；随后运行与RED同一命令。
- **精确文件**：`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`
- **boundary**：files: `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`; symbols/regions: 仅plan规定的相关接口/配置/文档区域，不改排除域
- **输出**：真实命令输出、AC观察、原始引用与未覆盖项
- **Knowledge**：P3 只运行已实现路径；同任务修复不等于允许自动重审；usage 消费缺口和身份不匹配保持可见。
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs -t "review flow static preflight" --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`
- **expected_exit**：0
- **oracle**：`REVIEW_STATIC_PREFLIGHT {"pass":"静态非法输入在 buildBundle/锁/broker 前被识别；required 减 generated；白名单三码及四字段脱敏；unknown 单独存在不拦截。入口计算本地预检耗时，完整含保存的 1000ms 指标由 T006/T008 证明。","reject":{"input":"配置不存在/坏形状、空路由、缺失/禁用首项、同源、附件越界、必需材料空值，以及仅 broker probe unknown。","expected_rejection":"每个非法样本命中原定静态错误；合法 unknown 继续；旧 runner 漏检/误拦截目标断言为 RED。","observation":"buildBundle、锁和 runGroup spy 均为 0；合法 unknown 的 broker stub 被调用；四字段无秘密。"}}`
- **evidence_path**：`quality/evidence/build-code/review_static_preflight/`
- **STOP**：命令不可执行、RED只是环境失败、需弱化断言/改方向/身份/预算或越界时，停止对应修改并回owner；T012消费P0真实修复证据并保留任何未解决缺口
- **recovery**：本卡执行者只恢复自己修改；保留原始失败证据，配置恢复先核对当前hash，不覆盖他人更改
- **task risk**：RISK-001/003/004：绑定漂移、部分保存和超时保持失败；保留开始/终态报告，不覆盖原证据；回到具体 RED/GREEN 修复。
- **test tier / test method**：fullstack / fullstack-slice-testing；独立test-routing-advisor按真实接口/身份/并发风险判类
- **scenarios / commands / expected exit / oracle**：SCN-003/004/005；generated review_instructions 不要求 caller 提供；mini_task/phase/integration 沿既有 reviewRuleFor。；使用本卡gate_cmd/expected_exit/REVIEW_STATIC_PREFLIGHT；不得把局部输出当整体成功
- **fixtures_services**：隔离临时home/config/task与真实文件系统，冻结新旧记录；broker stub仅控制provider，不mock掉host/保存consumer；执行者清理自己创建的临时夹具，保留证据
- **coverage limits**：本命令证明静态边界，不单独声称含真实写盘的 1 秒验收；P2 后续真实适配器集成覆盖该 seam。
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/build-plan-simple-085d2780-7242-4b2a-ba72-89f79462e347.json
- **semantic_review_reason**：当前扩展输入一次独立审查3完成2失败，5fixed/1rejected_invalid；修订后未再provider复审，最后本地分析另记，实施和语义验收仍未完成

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`simple-review-runner.mjs` 增加静态 preflight：复用 `reviewRuleFor` 的 required-minus-generated，拦截空路由、无效选择、同源/路由异常和材料缺失/禁用；返回 `blocked_before_dispatch` 与四字段脱敏诊断；静态失败不创建 bundle、不调用 broker。`wh-review-cli.mjs` 已有透传链路，无需额外改动。
- **executed_commands**：`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs -t "review flow static preflight" --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`（exit 0，4 passed / 29 skipped）；同文件全量定向检查 33 passed。
- **evidence_refs**：[`quality/evidence/build-code/review_static_preflight/T003-RED-vitest.log`, `quality/evidence/build-code/review_static_preflight/T004-GREEN-vitest.log`, `quality/evidence/build-code/review_static_preflight/T004-GREEN-result.json`]
- **covered_ac**：AC-PREFLIGHT-001/002/003、AC-SAFETY-001：pass（命名 gate）；持久化含 I/O 的 1 秒事实留给 T005～T008。
- **review_fact**：当前实现验证事实为本地 Vitest；独立 provider 复审尚未执行，继续保留 `semantic_review_status=incomplete`。
- **completed_at**：2026-09-07T09:04:00Z
- **执行事实**：普通 material-only standalone 兼容调用仍保留窄例外；integration review 请求现在即使只含未知 material key 也强制进入 stage contract preflight 并在 provider 前返回 MATERIAL_INCOMPLETE，避免最终验收入口 fail-open。


#### T005 — RED：任务调用与不可变记录闭环

- **ID**：T005
- **Phase**：Phase P2 — 静态预检与单一记录闭环
- **goal**：RED：任务调用与不可变记录闭环
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7681b3cead847c53bbc84a9f72eb9194181d4794168c203c09ac359c3360603d","id":"review-flow-repair-spec"},{"artifact_kind":"plan","ref":"plan.md","hash":"c38f802e14b9a2645e71173306881db4746eebc06d30d7b980ad40e12e826b27","id":"review-flow-repair-plan"}]`
- **source_refs / decision_refs**：R-003, R-004, R-005, R-007 / D-002, D-003, D-004, D-005, D-007, D-008
- **输入**：当前packet投影的spec/plan与T004真实输出；不得猜上游结果
- **依赖**：T004
- **并行**：否 — RED/GREEN及共享文件/消费者依赖串行
- **FR**：FR-PREFLIGHT-002, FR-PREFLIGHT-003, FR-RECORD-001, FR-RECORD-002, FR-RECORD-003, FR-RECORD-005, FR-COMPAT-001, FR-COMPAT-002, FR-SAFETY-001, FR-SAFETY-002
- **AC**：AC-PREFLIGHT-002, AC-PREFLIGHT-003, AC-RECORD-001, AC-RECORD-002, AC-RECORD-003, AC-RECORD-005, AC-COMPAT-001, AC-COMPAT-002, AC-SAFETY-001, AC-SAFETY-002
- **动作**：在精确测试文件新增/更新 任务调用与不可变记录闭环 目标断言（命令含 -t 时describe按该名称），先运行并保留真实断言失败；不改生产代码。；同步验证plan真实操作合同：stub注入点观测broker/runRound计数，真实refs回读，复用为0次新派发；provider_attempts长度不充当broker计数，过程总耗时不替代静态含保存1000ms断言。
- **精确文件**：`tests/review/review-record-route.test.mjs`、`tests/e2e/stage-reflection-real-task.test.mjs`、`skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs`、`tests/contract/runtime-facade.test.mjs`
- **boundary**：files: `tests/review/review-record-route.test.mjs`、`tests/e2e/stage-reflection-real-task.test.mjs`、`skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs`、`tests/contract/runtime-facade.test.mjs`; symbols/regions: 仅本卡命名测试describe/fixture，不改生产实现
- **输出**：预定断言RED输出，不接受setup失败
- **Knowledge**：P3 只运行已实现路径；同任务修复不等于允许自动重审；usage 消费缺口和身份不匹配保持可见。
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`npx vitest run tests/review/review-record-route.test.mjs tests/e2e/stage-reflection-real-task.test.mjs skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs tests/contract/runtime-facade.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`
- **expected_exit**：1
- **oracle**：`REVIEW_TASK_RECORD {"pass":"真实 host request 路径先捕获身份，单次派发后保存并回读引用；拦截无 provider/result；重复并发仅一组记录；成功/partial/失败/取消/漂移与部分写入真实；新写无 priority，usage 原样；旧 result 输入不触发派发。每个静态失败样本从适配器第一项检查到返回引用≤1000ms。真实writer字节直接供validateReviewAttemptObservation、canonicalReviewFindings/validateReportableFindingDispositions、deriveSeriousReviewPause、buildStageInputPacket/verifyStageInputPacket及officialStageHandler消费；保留当前usage incomplete，不重建fixture记录替换来源。 派发计数取实际runRound注入点；复用无新派发，缺独立实跑计数来源保持unknown；provider数量不是broker次数。","reject":{"input":"success/partial/all-failed、重复/并发同请求、改变 task/stage/subject/material/reason、写盘故障与 dispatch 中材料漂移。；同时提供request+result；request/result均缺失；result-only旧路径。","expected_rejection":"缺记录、重复 attempt、覆写旧字节、错绑新树、保存失败仍 recorded、含 priority 的新记录或丢 usage 的目标断言失败。；both/neither必须拒绝且派发为0，result-only不得调用provider。","observation":"经 stageRuntimeCliMain 的真实 review --action=record 路径，stub provider 调用数、返回引用回读、attempt 数量、前后 hash、单调时钟及真实 consumer 结果。"}}`
- **evidence_path**：`quality/evidence/build-code/review_task_record/`
- **STOP**：命令不可执行、RED只是环境失败、需弱化断言/改方向/身份/预算或越界时，停止对应修改并回owner；T012消费P0真实修复证据并保留任何未解决缺口
- **recovery**：本卡执行者只恢复自己修改；保留原始失败证据，配置恢复先核对当前hash，不覆盖他人更改
- **task risk**：RISK-001/003/004：绑定漂移、部分保存和超时保持失败；保留开始/终态报告，不覆盖原证据；回到具体 RED/GREEN 修复。
- **test tier / test method**：fullstack / fullstack-slice-testing；独立test-routing-advisor按真实接口/身份/并发风险判类
- **scenarios / commands / expected exit / oracle**：SCN-003/005/006/008/009/010；原始 execution.usage round-trip；tasks execution-only 窄例外 vs spec/plan/code 变化；开始报告+可捕获取消；unknown 不作零。；producer consumer compatibility：actual refs/hash→四类合并后consumer；错误引用/缺provider output拒绝；真实packet单字节变更hash拒绝；both/neither输入拒绝且零派发。；使用本卡gate_cmd/expected_exit/REVIEW_TASK_RECORD；不得把局部输出当整体成功
- **fixtures_services**：隔离临时home/config/task与真实文件系统，冻结新旧记录；broker stub仅控制provider，不mock掉host/保存consumer；执行者清理自己创建的临时夹具，保留证据
- **coverage limits**：provider 用可控 stub 验证 host 到真实文件 seam；SIGKILL/存储完全不可用不保证完整终态；真实 provider 及本机耗时在 P3；不修上游 usage 统计。
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/build-plan-simple-085d2780-7242-4b2a-ba72-89f79462e347.json
- **semantic_review_reason**：当前扩展输入一次独立审查3完成2失败，5fixed/1rejected_invalid；修订后未再provider复审，最后本地分析另记，实施和语义验收仍未完成

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增任务 request/result 闭环测试，覆盖认证快照、不可变 attempt/result/report、并发去重、blocked-before-dispatch、全 provider 失败保留 provider facts、材料指纹漂移拒绝；RED 保留在既有 T005 证据。
- **executed_commands**：T005 RED 既有证据；T005/T006 GREEN correction gate（exit 0，4 files，26 tests passed，约73s）。
- **evidence_refs**：[`quality/evidence/build-code/review_task_record/T005-RED-vitest.log`, `quality/evidence/build-code/review_task_record/T005-RED-result.json`, `quality/evidence/build-code/review_task_record/T005-T006-GREEN-correction-vitest.log`, `quality/evidence/build-code/review_task_record/T005-T006-GREEN-correction-result.json`]
- **covered_ac**：AC-PREFLIGHT-002/003、AC-RECORD-001/002/003/005、AC-SAFETY-001/002：定向行为通过；真实 provider 与宿主耗时仍按 coverage limits 保留。
- **review_fact**：本地实现与定向 consumer gate 通过；独立 provider 语义复审仍为 `incomplete`。
- **completed_at**：2026-09-07T09:51:00Z
- **执行事实**：记录 writer 使用 create-only；报告引用和 dispatch_state 已落盘；当前 route material 回绑依赖宿主注入的 materialIdForRequest，缺失该注入时保留请求键但不伪称材料已认证。

#### T006 — GREEN：任务调用与不可变记录闭环

- **ID**：T006
- **Phase**：Phase P2 — 静态预检与单一记录闭环
- **goal**：GREEN：任务调用与不可变记录闭环
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7681b3cead847c53bbc84a9f72eb9194181d4794168c203c09ac359c3360603d","id":"review-flow-repair-spec"},{"artifact_kind":"plan","ref":"plan.md","hash":"c38f802e14b9a2645e71173306881db4746eebc06d30d7b980ad40e12e826b27","id":"review-flow-repair-plan"}]`
- **source_refs / decision_refs**：R-003, R-004, R-005, R-007 / D-002, D-003, D-004, D-005, D-007, D-008
- **输入**：当前packet投影的spec/plan与T005真实输出；不得猜上游结果
- **依赖**：T005
- **并行**：否 — RED/GREEN及共享文件/消费者依赖串行
- **FR**：FR-PREFLIGHT-002, FR-PREFLIGHT-003, FR-RECORD-001, FR-RECORD-002, FR-RECORD-003, FR-RECORD-005, FR-COMPAT-001, FR-COMPAT-002, FR-SAFETY-001, FR-SAFETY-002
- **AC**：AC-PREFLIGHT-002, AC-PREFLIGHT-003, AC-RECORD-001, AC-RECORD-002, AC-RECORD-003, AC-RECORD-005, AC-COMPAT-001, AC-COMPAT-002, AC-SAFETY-001, AC-SAFETY-002
- **动作**：扩展现有 review --action=record 的 request/result 互斥输入；request 注入真实 TaskHandle/Kernel 到 runReviewRecovery；record-route 承担私有生命周期与 create-only 记录；前后核验身份；复用既有锁去重，禁止新克隆式复用；renderer 去 priority 并解释 legacy_unclassified；保留 stage/budget 逻辑。；在review-record-route.test.mjs增加producer consumer compatibility真实写读及officialStageHandler最小合法fixture，worker.readReceipt只读生产writer原字节并现场算hash，禁止替换/重造attempt或output。；随后运行与RED同一命令。；同步验证plan真实操作合同：stub注入点观测broker/runRound计数，真实refs回读，复用为0次新派发；provider_attempts长度不充当broker计数，过程总耗时不替代静态含保存1000ms断言。
- **精确文件**：`tests/review/review-record-route.test.mjs`、`tests/e2e/stage-reflection-real-task.test.mjs`、`skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs`、`tests/contract/runtime-facade.test.mjs`、`runtime/review/review-record-route.mjs`、`skills/wh-review/scripts/review-result.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`tools/cli/stage-runtime.mjs`
- **boundary**：files: `tests/review/review-record-route.test.mjs`、`tests/e2e/stage-reflection-real-task.test.mjs`、`skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs`、`tests/contract/runtime-facade.test.mjs`、`runtime/review/review-record-route.mjs`、`skills/wh-review/scripts/review-result.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`tools/cli/stage-runtime.mjs`; symbols/regions: 仅plan规定的相关接口/配置/文档区域，不改排除域
- **输出**：真实命令输出、AC观察、原始引用与未覆盖项
- **Knowledge**：P3 只运行已实现路径；同任务修复不等于允许自动重审；usage 消费缺口和身份不匹配保持可见。
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`npx vitest run tests/review/review-record-route.test.mjs tests/e2e/stage-reflection-real-task.test.mjs skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs tests/contract/runtime-facade.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`
- **expected_exit**：0
- **oracle**：`REVIEW_TASK_RECORD {"pass":"真实 host request 路径先捕获身份，单次派发后保存并回读引用；拦截无 provider/result；重复并发仅一组记录；成功/partial/失败/取消/漂移与部分写入真实；新写无 priority，usage 原样；旧 result 输入不触发派发。每个静态失败样本从适配器第一项检查到返回引用≤1000ms。真实writer字节直接供validateReviewAttemptObservation、canonicalReviewFindings/validateReportableFindingDispositions、deriveSeriousReviewPause、buildStageInputPacket/verifyStageInputPacket及officialStageHandler消费；保留当前usage incomplete，不重建fixture记录替换来源。 派发计数取实际runRound注入点；复用无新派发，缺独立实跑计数来源保持unknown；provider数量不是broker次数。","reject":{"input":"success/partial/all-failed、重复/并发同请求、改变 task/stage/subject/material/reason、写盘故障与 dispatch 中材料漂移。；同时提供request+result；request/result均缺失；result-only旧路径。","expected_rejection":"缺记录、重复 attempt、覆写旧字节、错绑新树、保存失败仍 recorded、含 priority 的新记录或丢 usage 的目标断言失败。；both/neither必须拒绝且派发为0，result-only不得调用provider。","observation":"经 stageRuntimeCliMain 的真实 review --action=record 路径，stub provider 调用数、返回引用回读、attempt 数量、前后 hash、单调时钟及真实 consumer 结果。"}}`
- **evidence_path**：`quality/evidence/build-code/review_task_record/`
- **STOP**：命令不可执行、RED只是环境失败、需弱化断言/改方向/身份/预算或越界时，停止对应修改并回owner；T012消费P0真实修复证据并保留任何未解决缺口
- **recovery**：本卡执行者只恢复自己修改；保留原始失败证据，配置恢复先核对当前hash，不覆盖他人更改
- **task risk**：RISK-001/003/004：绑定漂移、部分保存和超时保持失败；保留开始/终态报告，不覆盖原证据；回到具体 RED/GREEN 修复。
- **test tier / test method**：fullstack / fullstack-slice-testing；独立test-routing-advisor按真实接口/身份/并发风险判类
- **scenarios / commands / expected exit / oracle**：SCN-003/005/006/008/009/010；原始 execution.usage round-trip；tasks execution-only 窄例外 vs spec/plan/code 变化；开始报告+可捕获取消；unknown 不作零。；producer consumer compatibility：actual refs/hash→四类合并后consumer；错误引用/缺provider output拒绝；真实packet单字节变更hash拒绝；both/neither输入拒绝且零派发。；使用本卡gate_cmd/expected_exit/REVIEW_TASK_RECORD；不得把局部输出当整体成功
- **fixtures_services**：隔离临时home/config/task与真实文件系统，冻结新旧记录；broker stub仅控制provider，不mock掉host/保存consumer；执行者清理自己创建的临时夹具，保留证据
- **coverage limits**：provider 用可控 stub 验证 host 到真实文件 seam；SIGKILL/存储完全不可用不保证完整终态；真实 provider 及本机耗时在 P3；不修上游 usage 统计。
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/build-plan-simple-085d2780-7242-4b2a-ba72-89f79462e347.json
- **semantic_review_reason**：当前扩展输入一次独立审查3完成2失败，5fixed/1rejected_invalid；修订后未再provider复审，最后本地分析另记，实施和语义验收仍未完成

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：实现 `recordSimpleReviewRequest` 认证请求路径、锁内查找与 create-only 记录，增加 report_ref、可选 dispatch_state、全失败 unavailable 终态和 sink/runner 分层；stage-runtime 注入真实 runner 与材料指纹函数。
- **executed_commands**：与 T005 相同 correction gate（exit 0，4 files，26 tests passed，约73s）。
- **evidence_refs**：[`quality/evidence/build-code/review_task_record/T005-T006-GREEN-correction-vitest.log`, `quality/evidence/build-code/review_task_record/T005-T006-GREEN-correction-result.json`]
- **covered_ac**：AC-PREFLIGHT-002/003、AC-RECORD-001/002/003/005、AC-COMPAT-001/002、AC-SAFETY-001/002：定向行为通过；写盘完全不可用与真实 provider 仍未宣称覆盖。
- **review_fact**：定向测试通过；独立 provider 语义复审仍为 `incomplete`。
- **completed_at**：2026-09-07T09:51:00Z
- **执行事实**：runtime/review 不再反向 import wh-review skill；默认 runner 由 tools/cli 注入，保持 layering contract。

#### T007 — RED：裸跑诊断与保存故障

- **ID**：T007
- **Phase**：Phase P2 — 静态预检与单一记录闭环
- **goal**：RED：裸跑诊断与保存故障
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7681b3cead847c53bbc84a9f72eb9194181d4794168c203c09ac359c3360603d","id":"review-flow-repair-spec"},{"artifact_kind":"plan","ref":"plan.md","hash":"c38f802e14b9a2645e71173306881db4746eebc06d30d7b980ad40e12e826b27","id":"review-flow-repair-plan"}]`
- **source_refs / decision_refs**：R-003, R-004, R-007 / D-002, D-003, D-008
- **输入**：当前packet投影的spec/plan与T006真实输出；不得猜上游结果
- **依赖**：T006
- **并行**：否 — RED/GREEN及共享文件/消费者依赖串行
- **FR**：FR-PREFLIGHT-002, FR-PREFLIGHT-003, FR-RECORD-004, FR-RECORD-005, FR-SAFETY-001
- **AC**：AC-PREFLIGHT-002, AC-PREFLIGHT-003, AC-RECORD-004, AC-RECORD-005, AC-SAFETY-001
- **动作**：在精确测试文件新增/更新 裸跑诊断与保存故障 目标断言（命令含 -t 时describe按该名称），先运行并保留真实断言失败；不改生产代码。；同步验证plan真实操作合同：stub注入点观测broker/runRound计数，真实refs回读，复用为0次新派发；provider_attempts长度不充当broker计数，过程总耗时不替代静态含保存1000ms断言。
- **精确文件**：`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`tests/review/review-record-route.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`tests/review/review-record-route.test.mjs`; symbols/regions: 仅本卡命名测试describe/fixture，不改生产实现
- **输出**：预定断言RED输出，不接受setup失败
- **Knowledge**：P3 只运行已实现路径；同任务修复不等于允许自动重审；usage 消费缺口和身份不匹配保持可见。
- **verification_role**：RED
- **paired_task**：T008
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs tests/review/review-record-route.test.mjs -t "review flow sink" --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`
- **expected_exit**：1
- **oracle**：`REVIEW_BARE_SINK {"pass":"裸跑仅写非权威 sink，成功/失败/拦截可回读；相同归一化键并发只一组；时间/随机标识/临时路径不改变拦截键；不能被 canonical 接受；写故障明确且不 fallback task；含实际保存的每个静态失败样本≤1000ms。 派发计数取实际runRound注入点；复用无新派发，缺独立实跑计数来源保持unknown；provider数量不是broker次数。","reject":{"input":"无 TaskHandle 的成功/失败/静态拦截、易变字段差异、并发重复、不可写目录/异字节冲突，并尝试把 sink 当 canonical 证据。","expected_rejection":"旧裸跑不落盘、重复无限增长、task 越权、sink 冒充正式证据或保存失败假成功的行为断言失败。","observation":"隔离 home 下真实文件、返回 authoritative=false、task 目录前后不变、hash/数量、canonical consumer 拒绝及计时。"}}`
- **evidence_path**：`quality/evidence/build-code/review_bare_sink/`
- **STOP**：命令不可执行、RED只是环境失败、需弱化断言/改方向/身份/预算或越界时，停止对应修改并回owner；T012消费P0真实修复证据并保留任何未解决缺口
- **recovery**：本卡执行者只恢复自己修改；保留原始失败证据，配置恢复先核对当前hash，不覆盖他人更改
- **task risk**：RISK-001/003/004：绑定漂移、部分保存和超时保持失败；保留开始/终态报告，不覆盖原证据；回到具体 RED/GREEN 修复。
- **test tier / test method**：fullstack / fullstack-slice-testing；独立test-routing-advisor按真实接口/身份/并发风险判类
- **scenarios / commands / expected exit / oracle**：SCN-003/007/009；结构性参数改变不误去重；脱敏；无自动 TTL/删除；开始事实和终态分文件不可变。；使用本卡gate_cmd/expected_exit/REVIEW_BARE_SINK；不得把局部输出当整体成功
- **fixtures_services**：隔离临时home/config/task与真实文件系统，冻结新旧记录；broker stub仅控制provider，不mock掉host/保存consumer；执行者清理自己创建的临时夹具，保留证据
- **coverage limits**：隔离 home 验证，不碰实际用户 sink；不验证任意网络盘/断电一致性；默认保留与手工清理由文档约束。
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/build-plan-simple-085d2780-7242-4b2a-ba72-89f79462e347.json
- **semantic_review_reason**：当前扩展输入一次独立审查3完成2失败，5fixed/1rejected_invalid；修订后未再provider复审，最后本地分析另记，实施和语义验收仍未完成

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增裸跑 sink 并发/幂等测试；保留可逆基线 RED，验证旧 CLI 未写 sink。
- **executed_commands**：T007 RED 基线 exit 1；T007/T008 named GREEN gate exit 0（1 passed，27 skipped）。
- **evidence_refs**：[`quality/evidence/build-code/review_bare_sink/T007-RED-vitest.log`, `quality/evidence/build-code/review_bare_sink/T007-RED-result.json`, `quality/evidence/build-code/review_bare_sink/T007-T008-GREEN-vitest.log`, `quality/evidence/build-code/review_bare_sink/T007-T008-GREEN-result.json`]
- **covered_ac**：AC-RECORD-004、AC-RECORD-005：sink 非权威、并发同键只一份、任务目录不写入；异步断电与任意网络盘仍未覆盖。
- **review_fact**：本地 sink 行为通过；独立 provider 语义复审仍为 `incomplete`。
- **completed_at**：2026-09-07T09:52:00Z
- **执行事实**：sink 使用结构化请求键、create-only 文件和真实保存失败抛错；原始 provider/宿主秘密不写入公开 sink。

#### T008 — GREEN：裸跑诊断与保存故障

- **ID**：T008
- **Phase**：Phase P2 — 静态预检与单一记录闭环
- **goal**：GREEN：裸跑诊断与保存故障
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7681b3cead847c53bbc84a9f72eb9194181d4794168c203c09ac359c3360603d","id":"review-flow-repair-spec"},{"artifact_kind":"plan","ref":"plan.md","hash":"c38f802e14b9a2645e71173306881db4746eebc06d30d7b980ad40e12e826b27","id":"review-flow-repair-plan"}]`
- **source_refs / decision_refs**：R-003, R-004, R-007 / D-002, D-003, D-008
- **输入**：当前packet投影的spec/plan与T007真实输出；不得猜上游结果
- **依赖**：T007
- **并行**：否 — RED/GREEN及共享文件/消费者依赖串行
- **FR**：FR-PREFLIGHT-002, FR-PREFLIGHT-003, FR-RECORD-004, FR-RECORD-005, FR-SAFETY-001
- **AC**：AC-PREFLIGHT-002, AC-PREFLIGHT-003, AC-RECORD-004, AC-RECORD-005, AC-SAFETY-001
- **动作**：runReviewRecovery 无 recordContext 时选择同模块私有 sink 适配器；固定用户 home 下路径，结构参数白名单归一化；同字节幂等/异字节失败；只使用一个 owner，明确已写/缺失引用，保存异常不被 recovery catch 改写成成功。；随后运行与RED同一命令。；同步验证plan真实操作合同：stub注入点观测broker/runRound计数，真实refs回读，复用为0次新派发；provider_attempts长度不充当broker计数，过程总耗时不替代静态含保存1000ms断言。
- **精确文件**：`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`tests/review/review-record-route.test.mjs`、`runtime/review/review-record-route.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`
- **boundary**：files: `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`tests/review/review-record-route.test.mjs`、`runtime/review/review-record-route.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`; symbols/regions: 仅plan规定的相关接口/配置/文档区域，不改排除域
- **输出**：真实命令输出、AC观察、原始引用与未覆盖项
- **Knowledge**：P3 只运行已实现路径；同任务修复不等于允许自动重审；usage 消费缺口和身份不匹配保持可见。
- **verification_role**：GREEN
- **paired_task**：T007
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs tests/review/review-record-route.test.mjs -t "review flow sink" --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`
- **expected_exit**：0
- **oracle**：`REVIEW_BARE_SINK {"pass":"裸跑仅写非权威 sink，成功/失败/拦截可回读；相同归一化键并发只一组；时间/随机标识/临时路径不改变拦截键；不能被 canonical 接受；写故障明确且不 fallback task；含实际保存的每个静态失败样本≤1000ms。 派发计数取实际runRound注入点；复用无新派发，缺独立实跑计数来源保持unknown；provider数量不是broker次数。","reject":{"input":"无 TaskHandle 的成功/失败/静态拦截、易变字段差异、并发重复、不可写目录/异字节冲突，并尝试把 sink 当 canonical 证据。","expected_rejection":"旧裸跑不落盘、重复无限增长、task 越权、sink 冒充正式证据或保存失败假成功的行为断言失败。","observation":"隔离 home 下真实文件、返回 authoritative=false、task 目录前后不变、hash/数量、canonical consumer 拒绝及计时。"}}`
- **evidence_path**：`quality/evidence/build-code/review_bare_sink/`
- **STOP**：命令不可执行、RED只是环境失败、需弱化断言/改方向/身份/预算或越界时，停止对应修改并回owner；T012消费P0真实修复证据并保留任何未解决缺口
- **recovery**：本卡执行者只恢复自己修改；保留原始失败证据，配置恢复先核对当前hash，不覆盖他人更改
- **task risk**：RISK-001/003/004：绑定漂移、部分保存和超时保持失败；保留开始/终态报告，不覆盖原证据；回到具体 RED/GREEN 修复。
- **test tier / test method**：fullstack / fullstack-slice-testing；独立test-routing-advisor按真实接口/身份/并发风险判类
- **scenarios / commands / expected exit / oracle**：SCN-003/007/009；结构性参数改变不误去重；脱敏；无自动 TTL/删除；开始事实和终态分文件不可变。；使用本卡gate_cmd/expected_exit/REVIEW_BARE_SINK；不得把局部输出当整体成功
- **fixtures_services**：隔离临时home/config/task与真实文件系统，冻结新旧记录；broker stub仅控制provider，不mock掉host/保存consumer；执行者清理自己创建的临时夹具，保留证据
- **coverage limits**：隔离 home 验证，不碰实际用户 sink；不验证任意网络盘/断电一致性；默认保留与手工清理由文档约束。
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/build-plan-simple-085d2780-7242-4b2a-ba72-89f79462e347.json
- **semantic_review_reason**：当前扩展输入一次独立审查3完成2失败，5fixed/1rejected_invalid；修订后未再provider复审，最后本地分析另记，实施和语义验收仍未完成

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`runReviewRecovery` 无 recordContext 时走非权威 sink；有 authenticated recordContext 时走 canonical request route，不把 sink 当 task 质量事实。
- **executed_commands**：`npx vitest run skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs -t "review flow sink" --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`（exit 0，1 passed / 27 skipped）。
- **evidence_refs**：[`quality/evidence/build-code/review_bare_sink/T007-T008-GREEN-vitest.log`, `quality/evidence/build-code/review_bare_sink/T007-T008-GREEN-result.json`]
- **covered_ac**：AC-RECORD-004/005、AC-SAFETY-001：pass；真实 provider 失败/取消和完全不可写存储保持 coverage limit。
- **review_fact**：定向行为通过；独立 provider 语义复审仍为 `incomplete`。
- **completed_at**：2026-09-07T09:52:00Z
- **执行事实**：同 normalized key 的并发裸跑只触发一次 runner；返回 `authoritative=false` 和 sink_ref；sink 不进入 TaskHandle canonical enumeration。

#### T009 — RED：E2E 首项与相邻保护

- **ID**：T009
- **Phase**：Phase P2 — 静态预检与单一记录闭环
- **goal**：RED：E2E 首项与相邻保护
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7681b3cead847c53bbc84a9f72eb9194181d4794168c203c09ac359c3360603d","id":"review-flow-repair-spec"},{"artifact_kind":"plan","ref":"plan.md","hash":"c38f802e14b9a2645e71173306881db4746eebc06d30d7b980ad40e12e826b27","id":"review-flow-repair-plan"}]`
- **source_refs / decision_refs**：R-001, R-002, R-004, R-005, R-007 / D-001, D-003, D-005, D-006, D-007, D-008
- **输入**：当前packet投影的spec/plan与T008真实输出；不得猜上游结果
- **依赖**：T008
- **并行**：否 — RED/GREEN及共享文件/消费者依赖串行
- **FR**：FR-E2E-001, FR-CONFIG-002, FR-COMPAT-002, FR-RECORD-002, FR-RECORD-003, FR-SAFETY-001, FR-SAFETY-002
- **AC**：AC-E2E-001, AC-CONFIG-002, AC-COMPAT-002, AC-RECORD-002, AC-RECORD-003, AC-SAFETY-001, AC-SAFETY-002
- **动作**：在精确测试文件新增/更新 E2E 首项与相邻保护 目标断言（命令含 -t 时describe按该名称），先运行并保留真实断言失败；不改生产代码。
- **精确文件**：`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`tests/contract/review-layering.test.mjs`、`tests/integration/mini-task-delivery.test.mjs`、`tests/contract/workflow-evolution-final-aggregate.test.mjs`、`tests/final-cutover-guards.red.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`tests/contract/review-layering.test.mjs`、`tests/integration/mini-task-delivery.test.mjs`、`tests/contract/workflow-evolution-final-aggregate.test.mjs`、`tests/final-cutover-guards.red.test.mjs`; symbols/regions: 仅本卡命名测试describe/fixture，不改生产实现
- **输出**：预定断言RED输出，不接受setup失败
- **Knowledge**：P3 只运行已实现路径；同任务修复不等于允许自动重审；usage 消费缺口和身份不匹配保持可见。
- **verification_role**：RED
- **paired_task**：T010
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs tests/contract/review-layering.test.mjs tests/integration/mini-task-delivery.test.mjs tests/contract/workflow-evolution-final-aggregate.test.mjs tests/final-cutover-guards.red.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`
- **expected_exit**：1
- **oracle**：`REVIEW_E2E_FIRST {"pass":"E2E 多项稳定取 initial[0]；空/同源/禁用/缺失首项保存拦截且不换后项；frozen policy 从 effectiveProfiles 来；合法引用不新派发；旧policy不复用；相邻 fixture、public行为、异源与 usage 保持。","reject":{"input":"零/单/多 initial、首项非法但后项合法、合法缓存与旧policy缓存、缺 usage/partial/空findings。","expected_rejection":"仍强制 length=1、偷偷选后项、空列表派发、旧policy命中或复用克隆 attempt 的目标断言失败。","observation":"实际首项、provider stub调用次数、拦截与复用引用回读、旧文件 hash，以及受影响邻接消费者输出。"}}`
- **evidence_path**：`quality/evidence/build-code/recheck-20260907/`
- **STOP**：命令不可执行、RED只是环境失败、需弱化断言/改方向/身份/预算或越界时，停止对应修改并回owner；T012消费P0真实修复证据并保留任何未解决缺口
- **recovery**：本卡执行者只恢复自己修改；保留原始失败证据，配置恢复先核对当前hash，不覆盖他人更改
- **task risk**：RISK-001/003/004：绑定漂移、部分保存和超时保持失败；保留开始/终态报告，不覆盖原证据；回到具体 RED/GREEN 修复。
- **test tier / test method**：fullstack / fullstack-slice-testing；独立test-routing-advisor按真实接口/身份/并发风险判类
- **scenarios / commands / expected exit / oracle**：SCN-002/003/005/008/010/011；记录先于质量 intent；不修改 D-007 预算/计数或 quality fact 身份。；使用本卡gate_cmd/expected_exit/REVIEW_E2E_FIRST；不得把局部输出当整体成功
- **fixtures_services**：隔离临时home/config/task与真实文件系统，冻结新旧记录；broker stub仅控制provider，不mock掉host/保存consumer；执行者清理自己创建的临时夹具，保留证据
- **coverage limits**：此处 E2E 是仓库审查业务的服务流程，非浏览器；无全量回归，不证明外部 reviewer 语义质量或全局只审一次。
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/build-plan-simple-085d2780-7242-4b2a-ba72-89f79462e347.json
- **semantic_review_reason**：当前扩展输入一次独立审查3完成2失败，5fixed/1rejected_invalid；修订后未再provider复审，最后本地分析另记，实施和语义验收仍未完成

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：在基线 HEAD 生产实现上叠加当前 T009 测试输入，真实捕获相邻 review recovery 生命周期断言失败；未修改基线生产代码。
- **executed_commands**：T009 RED 共享六文件门禁（exit 1，161 passed / 22 skipped / 1 failed）；失败不是 setup，`review-runner` recovery call count 为 0、预期 1。
- **evidence_refs**：[`quality/evidence/build-code/recheck-20260907/T009-RED-vitest.log`, `quality/evidence/build-code/recheck-20260907/T009-RED-result.json`, `quality/evidence/build-code/recheck-20260907/T009-T010-GREEN-vitest.log`, `quality/evidence/build-code/recheck-20260907/T009-T010-GREEN-result.json`]
- **covered_ac**：RED/GREEN 配对事实已保留；最终逐 AC 验收仍由 T012 负责。
- **review_fact**：基线真实断言失败，修复后共享 GREEN 门禁通过；独立 provider 语义复审仍为 `incomplete`。
- **completed_at**：2026-09-07T12:00:00Z
- **执行事实**：本次 recheck 在 detached HEAD 加当前 T009 测试输入的临时 worktree 中先运行 RED（160 passed / 22 skipped / 2 failed，失败为 recovery 去重与生产入口计数断言），随后在当前实现 worktree 运行同一命令 GREEN（exit 0）。旧 review_e2e_first 证据保留为历史，当前引用指向本次真实配对。

#### T010 — GREEN：E2E 首项与相邻保护

- **ID**：T010
- **Phase**：Phase P2 — 静态预检与单一记录闭环
- **goal**：GREEN：E2E 首项与相邻保护
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7681b3cead847c53bbc84a9f72eb9194181d4794168c203c09ac359c3360603d","id":"review-flow-repair-spec"},{"artifact_kind":"plan","ref":"plan.md","hash":"c38f802e14b9a2645e71173306881db4746eebc06d30d7b980ad40e12e826b27","id":"review-flow-repair-plan"}]`
- **source_refs / decision_refs**：R-001, R-002, R-004, R-005, R-007 / D-001, D-003, D-005, D-006, D-007, D-008
- **输入**：当前packet投影的spec/plan与T009真实输出；不得猜上游结果
- **依赖**：T009
- **并行**：否 — RED/GREEN及共享文件/消费者依赖串行
- **FR**：FR-E2E-001, FR-CONFIG-002, FR-COMPAT-002, FR-RECORD-002, FR-RECORD-003, FR-SAFETY-001, FR-SAFETY-002
- **AC**：AC-E2E-001, AC-CONFIG-002, AC-COMPAT-002, AC-RECORD-002, AC-RECORD-003, AC-SAFETY-001, AC-SAFETY-002
- **动作**：修改 E2E 首项约束及 frozenTaskBoundPolicy 单源定义；沿已有 E2E引用式复用与 preflight，禁止任何静默跳项；更新已核实的受影响 fixtures 为新 policy 形状，旧样本保留用于宽读；只运行列明邻接回归。；随后运行与RED同一命令。
- **精确文件**：`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`tests/contract/review-layering.test.mjs`、`tests/integration/mini-task-delivery.test.mjs`、`tests/contract/workflow-evolution-final-aggregate.test.mjs`、`tests/final-cutover-guards.red.test.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/wh-review/scripts/review-runner.mjs`
- **boundary**：files: `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`tests/contract/review-layering.test.mjs`、`tests/integration/mini-task-delivery.test.mjs`、`tests/contract/workflow-evolution-final-aggregate.test.mjs`、`tests/final-cutover-guards.red.test.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/wh-review/scripts/review-runner.mjs`; symbols/regions: 仅plan规定的相关接口/配置/文档区域，不改排除域
- **输出**：真实命令输出、AC观察、原始引用与未覆盖项
- **Knowledge**：P3 只运行已实现路径；同任务修复不等于允许自动重审；usage 消费缺口和身份不匹配保持可见。
- **verification_role**：GREEN
- **paired_task**：T009
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs tests/contract/review-layering.test.mjs tests/integration/mini-task-delivery.test.mjs tests/contract/workflow-evolution-final-aggregate.test.mjs tests/final-cutover-guards.red.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`
- **expected_exit**：0
- **oracle**：`REVIEW_E2E_FIRST {"pass":"E2E 多项稳定取 initial[0]；空/同源/禁用/缺失首项保存拦截且不换后项；frozen policy 从 effectiveProfiles 来；合法引用不新派发；旧policy不复用；相邻 fixture、public行为、异源与 usage 保持。","reject":{"input":"零/单/多 initial、首项非法但后项合法、合法缓存与旧policy缓存、缺 usage/partial/空findings。","expected_rejection":"仍强制 length=1、偷偷选后项、空列表派发、旧policy命中或复用克隆 attempt 的目标断言失败。","observation":"实际首项、provider stub调用次数、拦截与复用引用回读、旧文件 hash，以及受影响邻接消费者输出。"}}`
- **evidence_path**：`quality/evidence/build-code/recheck-20260907/`
- **STOP**：命令不可执行、RED只是环境失败、需弱化断言/改方向/身份/预算或越界时，停止对应修改并回owner；T012消费P0真实修复证据并保留任何未解决缺口
- **recovery**：本卡执行者只恢复自己修改；保留原始失败证据，配置恢复先核对当前hash，不覆盖他人更改
- **task risk**：RISK-001/003/004：绑定漂移、部分保存和超时保持失败；保留开始/终态报告，不覆盖原证据；回到具体 RED/GREEN 修复。
- **test tier / test method**：fullstack / fullstack-slice-testing；独立test-routing-advisor按真实接口/身份/并发风险判类
- **scenarios / commands / expected exit / oracle**：SCN-002/003/005/008/010/011；记录先于质量 intent；不修改 D-007 预算/计数或 quality fact 身份。；使用本卡gate_cmd/expected_exit/REVIEW_E2E_FIRST；不得把局部输出当整体成功
- **fixtures_services**：隔离临时home/config/task与真实文件系统，冻结新旧记录；broker stub仅控制provider，不mock掉host/保存consumer；执行者清理自己创建的临时夹具，保留证据
- **coverage limits**：此处 E2E 是仓库审查业务的服务流程，非浏览器；无全量回归，不证明外部 reviewer 语义质量或全局只审一次。
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/build-plan-simple-085d2780-7242-4b2a-ba72-89f79462e347.json
- **semantic_review_reason**：当前扩展输入一次独立审查3完成2失败，5fixed/1rejected_invalid；修订后未再provider复审，最后本地分析另记，实施和语义验收仍未完成

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：完成 E2E 首项与相邻保护实现；修正裸 sink 复用记录以保留 `error_code`，避免非权威缓存回读丢失失败分类；保持单次异源派发、首项约束和相邻生命周期保护。
- **executed_commands**：T009/T010 同一六文件门禁（隔离 `WORKFLOWHUB_REVIEW_SINK_ROOT`，exit 0，6 files，162 passed / 22 skipped，约159s）。
- **evidence_refs**：[`quality/evidence/build-code/recheck-20260907/T009-T010-GREEN-vitest.log`, `quality/evidence/build-code/recheck-20260907/T009-T010-GREEN-result.json`]
- **covered_ac**：AC-E2E-001、AC-CONFIG-002、AC-COMPAT-002、AC-RECORD-002/003、AC-SAFETY-001/002：定向门禁通过；真实 provider 语义与最终逐AC验收仍未完成。
- **review_fact**：本地 E2E/邻接保护通过；独立 provider 语义复审仍为 `incomplete`。
- **completed_at**：2026-09-07T12:06:00Z
- **执行事实**：T009 RED 先于本次 GREEN；当前实现同一六文件门禁 exit 0。首项/空列表/同源/禁用/缺失首项及复用边界均通过；旧证据保留为历史。

## Phase P3 — 操作说明、配置迁移与真实验收

### Goal

操作文档与真实行为一致；本机迁移有可读备份与冲突检查；当前实现用真实调用和逐 AC 事实交接。

### Files

- **NEW**：N/A — 复用现有文件
- **MODIFY**：`skills/wh-review/SKILL.md`、`skills/wh-review/contracts/provider-protocol.md`

### Tasks

- `T011`：操作说明与本机迁移；Files：`skills/wh-review/SKILL.md`、`skills/wh-review/contracts/provider-protocol.md`
- `T012`：唯一最终聚合和28项AC真实验收；Files：`skills/wh-review/SKILL.md`、`skills/wh-review/contracts/provider-protocol.md`

### Verify

REVIEW_MIGRATION_OPERATION；本 Phase 还必须完成 REVIEW_FINAL_ACCEPTANCE；实际操作与最终验收证据分别保留。

`node --input-type=module -e 'import {readFileSync} from "node:fs"; import assert from "node:assert/strict"; import {createHash} from "node:crypto"; import {isDeepStrictEqual} from "node:util"; const e=JSON.parse(readFileSync("/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-review-flow-repair-20260906/quality/evidence/build-code/migration/operation.json","utf8")); assert.equal(e.config_path,"/Users/Hugh/.config/workflowhub/config.json"); const b=readFileSync(e.backup_path),a=readFileSync(e.config_path),r=readFileSync(e.rollback_probe_path); const h=x=>createHash("sha256").update(x).digest("hex"); assert.equal(h(b),e.before_sha256); assert.equal(h(a),e.after_sha256); assert.equal(h(r),h(b)); const expected=JSON.parse(b),actual=JSON.parse(a); delete expected.wh_review.profiles; delete expected.wh_review.priority; assert.ok(isDeepStrictEqual(actual,expected),"migration changed unrelated settings"); assert.equal(e.restore_success.return_value.restored,true); assert.equal(e.restore_success.after_sha256,h(b)); assert.equal(h(readFileSync(e.restore_success.target)),h(b)); assert.equal(e.restore_conflict.error_code,"CONFIG_RESTORE_CONFLICT"); assert.equal(e.restore_conflict.after_sha256,e.restore_conflict.drift_sha256); assert.equal(h(readFileSync(e.restore_conflict.target)),e.restore_conflict.drift_sha256); console.log(JSON.stringify({backup_sha256:h(b),after_sha256:h(a),rollback_sha256:h(r),unchanged_unrelated:true}));'` / 0 / REVIEW_MIGRATION_OPERATION；`npx vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs tests/review/review-policy-compatibility.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs tests/review/review-record-route.test.mjs skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs tests/e2e/stage-reflection-real-task.test.mjs tests/contract/runtime-facade.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs tests/contract/review-layering.test.mjs tests/integration/mini-task-delivery.test.mjs tests/contract/workflow-evolution-final-aggregate.test.mjs tests/final-cutover-guards.red.test.mjs tests/contract/filled-plan-task-production.test.mjs tests/contract/material-oracle-context-packet.test.mjs tests/contract/plan-acceptance-task-gate.test.mjs tests/contract/material-producer-consumer-roundtrip.test.mjs tests/contract/confirmation-authorization.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/host-outcome-bridge.test.mjs tests/contract/claude-outcome-packet.test.mjs tests/contract/derive-consumption-edges.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs tests/contract/build-reflection-page.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism` / 0 / REVIEW_FINAL_ACCEPTANCE；`quality/evidence/build-code/final/`。逐AC真实调用/配置事实不能由聚合退出码代替。

### Knowledge

外部 provider 失败、未执行场景和 parser 绑定缺口不写成通过；build-plan 不执行本 Phase。

### STOP

命令不可执行、RED仅setup失败、需要改decision/spec/身份/预算或精确文件越界时，停止对应修改并回所属owner；继续不依赖该修改的工作。

### Done

所属卡有实际命令/退出码、逐AC证据、真实审查事实及剩余限制；本阶段仅pending设计，不声明已做到。

### Risks and rollback

RISK-002/003/004：本机配置冲突即不覆盖，实测慢于 1000ms 原样记失败；物理交付另行授权。

#### T011 — 操作说明与本机配置迁移

- **ID**：T011
- **Phase**：Phase P3 — 操作说明、配置迁移与真实验收
- **goal**：操作说明与本机配置迁移
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7681b3cead847c53bbc84a9f72eb9194181d4794168c203c09ac359c3360603d","id":"review-flow-repair-spec"},{"artifact_kind":"plan","ref":"plan.md","hash":"c38f802e14b9a2645e71173306881db4746eebc06d30d7b980ad40e12e826b27","id":"review-flow-repair-plan"}]`
- **source_refs / decision_refs**：R-001, R-002, R-004, R-007 / D-001, D-003, D-008
- **输入**：当前packet投影的spec/plan与T010真实输出；不得猜上游结果
- **依赖**：T010
- **并行**：否 — RED/GREEN及共享文件/消费者依赖串行
- **FR**：FR-CONFIG-003, FR-RECORD-004, FR-SAFETY-001
- **AC**：AC-CONFIG-003, AC-RECORD-004, AC-SAFETY-001
- **动作**：更新SKILL/provider-protocol的配置、request/result、sink与失败语义；在停止其它配置写入的操作窗口，读取当前hash，以显式configPath/backupPath/expectedHash调用migrateWhReviewConfig，保留wx备份和脱敏差异；隔离副本恢复演练；将当次真实config_path/backup_path/before_sha256/after_sha256/rollback_probe_path写入quality/evidence/build-code/migration/operation.json，运行本卡只读Node校验独立回读实际字节与仅删除字段等价；再补充doctor。漂移拒写保留T002原始测试证据，不为演练反复改真实配置。；严格执行plan“受保护恢复与真实验收操作合同”第1/2节：先写一次性migration/operation.mjs并用node执行，再doctor。隔离success/drift副本必须调用真实restore；禁止copy备份冒充恢复。
- **精确文件**：`skills/wh-review/SKILL.md`、`skills/wh-review/contracts/provider-protocol.md`
- **boundary**：files: `skills/wh-review/SKILL.md`、`skills/wh-review/contracts/provider-protocol.md`; symbols/regions: 只操作/验证已实现行为与本Phase文档，不修改前序生产文件
- **输出**：真实命令输出、AC观察、原始引用与未覆盖项
- **Knowledge**：外部 provider 失败、未执行场景和 parser 绑定缺口不写成通过；build-plan 不执行本 Phase。
- **verification_role**：N/A — non-behavior change: 执行已由T002验证的迁移及同步文档，不引入新产品行为
- **paired_task**：N/A — 操作卡无RED/GREEN配对
- **gate_cmd**：`node --input-type=module -e 'import {readFileSync} from "node:fs"; import assert from "node:assert/strict"; import {createHash} from "node:crypto"; import {isDeepStrictEqual} from "node:util"; const e=JSON.parse(readFileSync("/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-review-flow-repair-20260906/quality/evidence/build-code/migration/operation.json","utf8")); assert.equal(e.config_path,"/Users/Hugh/.config/workflowhub/config.json"); const b=readFileSync(e.backup_path),a=readFileSync(e.config_path),r=readFileSync(e.rollback_probe_path); const h=x=>createHash("sha256").update(x).digest("hex"); assert.equal(h(b),e.before_sha256); assert.equal(h(a),e.after_sha256); assert.equal(h(r),h(b)); const expected=JSON.parse(b),actual=JSON.parse(a); delete expected.wh_review.profiles; delete expected.wh_review.priority; assert.ok(isDeepStrictEqual(actual,expected),"migration changed unrelated settings"); assert.equal(e.restore_success.return_value.restored,true); assert.equal(e.restore_success.after_sha256,h(b)); assert.equal(h(readFileSync(e.restore_success.target)),h(b)); assert.equal(e.restore_conflict.error_code,"CONFIG_RESTORE_CONFLICT"); assert.equal(e.restore_conflict.after_sha256,e.restore_conflict.drift_sha256); assert.equal(h(readFileSync(e.restore_conflict.target)),e.restore_conflict.drift_sha256); console.log(JSON.stringify({backup_sha256:h(b),after_sha256:h(a),rollback_sha256:h(r),unchanged_unrelated:true}));'`
- **expected_exit**：0
- **oracle**：`REVIEW_MIGRATION_OPERATION {"pass": "真实备份可读，迁移只移除重复声明，路由/其它配置不变，doctor加载新格式；恢复只在当前仍为本次结果时执行；文档解释sink、错误与host request。doctor退出0不能替代这些事实。 实际guarded restore成功和漂移CONFIG_RESTORE_CONFLICT都由操作输出及独立字节回读证明；复制备份不能替代调用。"}`
- **evidence_path**：`quality/evidence/build-code/migration/`
- **STOP**：命令不可执行、RED只是环境失败、需弱化断言/改方向/身份/预算或越界时，停止对应修改并回owner；T012消费P0真实修复证据并保留任何未解决缺口
- **recovery**：本卡执行者只恢复自己修改；保留原始失败证据，配置恢复先核对当前hash，不覆盖他人更改
- **task risk**：RISK-002/003/004：本机配置冲突即不覆盖，实测慢于 1000ms 原样记失败；物理交付另行授权。
- **test tier / test method**：fullstack / fullstack-slice-testing；独立test-routing-advisor按真实接口/身份/并发风险判类
- **scenarios / commands / expected exit / oracle**：先执行 `node /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-review-flow-repair-20260906/quality/evidence/build-code/migration/operation.mjs`（实际迁移/隔离恢复成功与漂移拒写断言，0），再 `node skills/wh-review/scripts/wh-review-cli.mjs doctor`（补充加载检查，0）；最后本卡gate_cmd独立回读（0）；SCN-001/002/007/009/010，REVIEW_MIGRATION_OPERATION。script/API/operation.json确切字段见plan第1/2节，均待实施。
- **fixtures_services**：隔离临时home/config/task与真实文件系统，冻结新旧记录；broker stub仅控制provider，不mock掉host/保存consumer；执行者清理自己创建的临时夹具，保留证据
- **coverage limits**：本机其它写入未停止或发生漂移即不覆盖；不改3rd-review配置；普通fs比较/rename窗口保留PLAN-RISK-002；本阶段不执行。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：按文档合同执行真实本机迁移；使用新的 `wx` 备份路径，删除 WorkflowHub 侧重复 `wh_review.profiles`/`priority`，保留路由与其它配置字节；完成隔离成功恢复和漂移拒写演练，并保留原始证据。
- **executed_commands**：`node quality/evidence/build-code/migration/operation.mjs`（exit 0）；`node skills/wh-review/scripts/wh-review-cli.mjs doctor`（exit 0，status ok）；T011 独立字节回读 gate（exit 0，`unchanged_unrelated=true`）。
- **evidence_refs**：[`quality/evidence/build-code/migration/operation.mjs`, `quality/evidence/build-code/migration/operation.json`, `quality/evidence/build-code/migration/restore-success.json`, `quality/evidence/build-code/migration/restore-drift.json`]
- **covered_ac**：AC-CONFIG-003、AC-RECORD-004、AC-SAFETY-001：真实备份/迁移/受保护恢复/漂移冲突与 doctor 均通过；最终逐 AC 验收仍未完成。
- **review_fact**：迁移操作事实通过；独立 provider 语义复审与最终验收仍为 `incomplete`。
- **completed_at**：2026-09-07T10:07:00Z
- **执行事实**：当前 `/Users/Hugh/.config/workflowhub/config.json` 已为迁移后的无重复声明形状；备份路径为 `config.json.bak-review-flow-repair-20260907-rerun2`，未覆盖旧备份。

#### T012 — FINAL：当前快照聚合与真实验收

- **ID**：T012
- **Phase**：Phase P3 — 操作说明、配置迁移与真实验收
- **goal**：FINAL：当前快照聚合与真实验收
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"7681b3cead847c53bbc84a9f72eb9194181d4794168c203c09ac359c3360603d","id":"review-flow-repair-spec"},{"artifact_kind":"plan","ref":"plan.md","hash":"c38f802e14b9a2645e71173306881db4746eebc06d30d7b980ad40e12e826b27","id":"review-flow-repair-plan"}]`
- **source_refs / decision_refs**：R-001～R-009 / D-001～D-014
- **输入**：当前packet投影的spec/plan、T013～T019及T001～T011真实输出与逐AC证据；不得猜上游结果。
- **依赖**：T011
- **并行**：否 — RED/GREEN及共享文件/消费者依赖串行
- **FR**：FR-CONFIG-001, FR-CONFIG-002, FR-CONFIG-003, FR-PREFLIGHT-001, FR-PREFLIGHT-002, FR-PREFLIGHT-003, FR-RECORD-001, FR-RECORD-002, FR-RECORD-003, FR-RECORD-004, FR-RECORD-005, FR-COMPAT-001, FR-COMPAT-002, FR-E2E-001, FR-SAFETY-001, FR-SAFETY-002, FR-DELIVERY-001, FR-CONTRACT-001, FR-CONTRACT-002, FR-CONTRACT-003, FR-CONTRACT-004, FR-CONTRACT-005, FR-CONTRACT-006, FR-CONTRACT-007, FR-LIFECYCLE-001, FR-LIFECYCLE-002, FR-LIFECYCLE-003, FR-LIFECYCLE-004
- **AC**：AC-CONFIG-001, AC-CONFIG-002, AC-CONFIG-003, AC-PREFLIGHT-001, AC-PREFLIGHT-002, AC-PREFLIGHT-003, AC-RECORD-001, AC-RECORD-002, AC-RECORD-003, AC-RECORD-004, AC-RECORD-005, AC-COMPAT-001, AC-COMPAT-002, AC-E2E-001, AC-SAFETY-001, AC-SAFETY-002, AC-DELIVERY-001, AC-CONTRACT-001, AC-CONTRACT-002, AC-CONTRACT-003, AC-CONTRACT-004, AC-CONTRACT-005, AC-CONTRACT-006, AC-CONTRACT-007, AC-LIFECYCLE-001, AC-LIFECYCLE-002, AC-LIFECYCLE-003, AC-LIFECYCLE-004
- **动作**：先核对当前snapshot与所有前序卡证据；运行唯一限定聚合一次；准备当前真实审查request文件置task quality/evidence/build-code/，通过现有review --action=record输入`{request}`调用本任务已实现入口，记录正常或真实失败、静态拦截、复用/重复的实际次数/耗时/引用；仅按既有预算和授权运行，不能为补齐矩阵自动重审。裸run用相同已授权材料验证非权威sink；逐AC保留missing/failed/unknown与报告。 真实操作严格消费plan“受保护恢复与真实验收操作合同”第3节，既有build-code/integration required-minus-generated字段不可省略；一次性operations.mjs prepare只生成输入，observe只执行获授权命令，保存输入材料原字节与单调计时，公开输出按plan脱敏规则保存；无计数来源保持null，额外裸派发无预算则未覆盖，不绕预算。
- **精确文件**：`skills/wh-review/SKILL.md`、`skills/wh-review/contracts/provider-protocol.md`
- **boundary**：files: `skills/wh-review/SKILL.md`、`skills/wh-review/contracts/provider-protocol.md`; symbols/regions: 只操作/验证已实现行为与本Phase文档，不修改前序生产文件
- **输出**：真实命令输出、AC观察、原始引用与未覆盖项
- **Knowledge**：外部 provider 失败、未执行场景和 parser 绑定缺口不写成通过；build-plan 不执行本 Phase。
- **verification_role**：N/A — non-behavior change: 唯一最终验证与交接，不新增实现
- **paired_task**：N/A — 最终聚合无RED/GREEN配对
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs tests/review/review-policy-compatibility.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs tests/review/review-record-route.test.mjs skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs tests/e2e/stage-reflection-real-task.test.mjs tests/contract/runtime-facade.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs tests/contract/review-layering.test.mjs tests/integration/mini-task-delivery.test.mjs tests/contract/workflow-evolution-final-aggregate.test.mjs tests/final-cutover-guards.red.test.mjs tests/contract/filled-plan-task-production.test.mjs tests/contract/material-oracle-context-packet.test.mjs tests/contract/plan-acceptance-task-gate.test.mjs tests/contract/material-producer-consumer-roundtrip.test.mjs tests/contract/confirmation-authorization.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/host-outcome-bridge.test.mjs tests/contract/claude-outcome-packet.test.mjs tests/contract/derive-consumption-edges.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs tests/contract/build-reflection-page.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`
- **expected_exit**：0
- **oracle**：`REVIEW_FINAL_ACCEPTANCE {"pass": "最终快照限定聚合通过；全部28AC的适用必需成功条件和规定负例均有真实证据满足，T013～T019修复经实际consumer验证且原D-003风险绑定正确；真实配置/调用/耗时/引用支撑各成功项。逐AC记录完整只是报告要求，不代表验收通过；任一必需场景failed/missing/unknown/未执行时，本卡验收保持incomplete并保留原因，不用聚合绿或如实记录替代成功。"}`
- **evidence_path**：`quality/evidence/build-code/final/`
- **STOP**：命令不可执行、RED只是环境失败、需弱化断言/改方向/身份/预算或越界时，停止对应修改并回owner；T012消费P0真实修复证据并保留任何未解决缺口
- **recovery**：本卡执行者只恢复自己修改；保留原始失败证据，配置恢复先核对当前hash，不覆盖他人更改
- **task risk**：RISK-002/003/004：本机配置冲突即不覆盖，实测慢于 1000ms 原样记失败；物理交付另行授权。
- **test tier / test method**：fullstack / fullstack-slice-testing；独立test-routing-advisor按真实接口/身份/并发风险判类
- **scenarios / commands / expected exit / oracle**：SCN-001～019；包括当前来源/历史引用、不可写/中断负例；provider真正没有成功时该成功场景标未覆盖，不fabricate。；使用本卡gate_cmd/expected_exit/REVIEW_FINAL_ACCEPTANCE；不得把局部输出当整体成功 操作commands：`node /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-review-flow-repair-20260906/quality/evidence/build-code/final/operations.mjs prepare`（0）；`node /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-review-flow-repair-20260906/quality/evidence/build-code/final/operations.mjs observe`（原exit逐项保留）；observe内现有record和bare CLI确切命令、request/identity/operation字段及回读断言见plan第3节。所需操作失败/未授权/不可观测时验收incomplete。
- **fixtures_services**：隔离临时home/config/task与真实文件系统，冻结新旧记录；broker stub仅控制provider，不mock掉host/保存consumer；执行者清理自己创建的临时夹具，保留证据
- **coverage limits**：仅指定consumer/fixture与授权真实provider；不覆盖所有平台或断电保证；预算/usage/历史不变。P0 T013～T019 已完成并由对应 consumer 门禁验证；DEFER-005 的宿主自动hook仍延期，真实 provider 仍可能 partial。
- **acceptance_role**：acceptance
- **ui_scope**：non_ui
- **acceptance_data**：`[{"source":"本任务真实WorkflowHub配置与3rd-review只读定义","sample":"迁移前备份/迁移后配置/恢复与漂移负例","scenario":"SCN-001/002/010","tier":"service"},{"source":"认证task的review --action=record request生产入口","sample":"静态失败/正常或真实provider失败/合法复用/重复拦截","scenario":"SCN-003/004/005/006/008/011/012","tier":"service"},{"source":"裸跑CLI及隔离故障fixture","sample":"sink成功/失败/拦截/存储或可捕获取消","scenario":"SCN-007/009","tier":"service"},{"source": "当前模板与真实material/host生产消费链及安装产物", "sample": "ID/风险/角色/Oracle正负例、来源语义、事件与output_refs、immutable reflection", "scenario": "SCN-013～019", "tier": "service"}]`
- **e2e_scope**：high_risk_user_visible
- **e2e_decision_refs**：`["D-002","D-003","D-005","D-006","D-007"]`
- **e2e_risk_decision_ref**：D-003
- **e2e_binding_gap**：T013～T019 已落实并通过当前 consumer 门禁；PLAN-RISK-005/006 中的 DEFER-005 宿主自动hook仍是明确延期边界。T012 仍需消费当前材料、逐 AC 证据和真实 provider 结果，不能把设计 ready 或局部 GREEN 当正式 acceptance。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：完成当前材料包 prepare；保留两次已授权完整 provider review 的真实 record/bare 事实；修复 bare sink key 对显式 `material_id` 的绑定、认证上下文重复快照和 integration 未知 material key fail-open，并同步 wh-review bundle/catalog hash。
- **executed_commands**：最新 `operations.mjs prepare` exit 0（完整 ac_trace，60 个 evidence refs，0 missing）；两次完整 provider review 分别保留在 `quality/reviews/results/build-code-simple-cbaf3314-955c-4a9d-a831-85f04573838a.json` 与 `quality/reviews/results/build-code-simple-ee2b4015-a7b7-4bde-a59d-eb9841d2a207.json`，均 record=recorded、bare=available/partial；其后第三次重审在 provider dispatch 前按本轮最多两次规则取消；局部静态 preflight/record、clean-install、skill closure 均通过。
- **evidence_refs**：[`quality/evidence/build-code/final/rerun-20260907/prepare.json`, `quality/evidence/build-code/final/rerun-20260907/identity.json`, `quality/evidence/build-code/final/rerun-20260907/observe.json`, `quality/evidence/build-code/final/rerun-20260907/operation-record.json`, `quality/evidence/build-code/final/rerun-20260907/operation-bare.json`, `quality/evidence/build-code/final/T012-GREEN-vitest.log`, `quality/evidence/build-code/final/T012-GREEN-result.json`, `quality/evidence/build-code/recheck-20260907/static-preflight-timing.json`, `quality/evidence/build-code/recheck-20260907/T009-RED-vitest.log`, `quality/evidence/build-code/recheck-20260907/T009-T010-GREEN-vitest.log`, `quality/evidence/build-code/recheck-20260907/T017-RED-vitest.log`, `quality/evidence/build-code/recheck-20260907/T017-T018-GREEN-vitest.log`, `quality/evidence/build-code/recheck-20260907/T013-RED-vitest.log`, `quality/evidence/build-code/recheck-20260907/T013-T014-GREEN-vitest.log`]
- **covered_ac**：本地聚合测试门禁通过；真实 provider 成功条件未满足，AC 仍保留 `incomplete`。
- **review_fact**：两次完整 provider review 均为 `partial`；`kimi/coding` completed，`grok/grok` `PROVIDER_HEALTH_FAILED`，`codex/luna` `SAME_SOURCE`。第二次结果给出 blocking/major/minor findings；最终本地修复发生在第二次 review 之后，按本轮最多两次规则不再重审，不能写成 acceptance pass。
- **completed_at**：N/A — 未完成
- **执行事实**：T012 已执行但未完成；测试绿不能替代最终验收。本次复核已重建完整 ac_trace，并将 T009/T010、T017/T018 当前引用改为真实 RED→GREEN 配对；operations.mjs 已按全部 task evidence_refs（含 final/）构建 test evidence。静态失败含认证保存的逐样本单调计时已记录，四样本约 714–741ms，均≤1000ms，且均在 provider 前拦截；integration 未知 material key 也已 fail-closed。T012 仍 pending；第二次 review 的材料指纹早于最后一轮本地修复，随后重审在 provider dispatch 前取消以遵守本轮最多两次规则，因此保留 stale-review/partial 事实，不宣称最终 acceptance。


- **2026-09-07 有限收尾核对**：已核对 28 AC 的现有证据映射、7 条 canonical findings 的后续修复证据和 22 skipped 的原因。限定聚合为 27 文件、412 passed、22 skipped、0 failed；22 skipped 属显式退休的旧 audit 测试。原始 review 保持原快照、原 findings 与 provider partial/unavailable，不改写成新 clean review。详见 `quality/evidence/close-readiness-20260907/evidence-reconciliation.json` 与 `.md`。
- **当前处置边界**：已核对 findings 均找到后续修复证据；没有据此新增独立质量通过裁决。bare diagnostics 中旧 oracle evidence_path 仅部分同步；真实 provider 完整成功和独立 live E2E 成功仍未核实。T012 的正式 acceptance 继续保留 incomplete，不以外部 provider 全成功或第三轮 review 作为物理 close 前提。
- **正式发布结果**：本轮 bridge 如实发布 unavailable outcome，公共 `run --action=execute` exit 0 并记录 quality incomplete。现有 bridge 拒绝旧快照 review，verify-code handler 不消费独立 finding_dispositions，旧 reflection 固定路径不可变；本次不改造规格 NG-004 排除的 verify-code 集成机制。输入与输出保留在 `quality/evidence/close-readiness-20260907/`。
- **交付授权**：用户在看到三步有限收尾计划后回复“好的，按这个计划执行吧”，授权核对、准确发布和提交/合并/归档/推送/清理。物理 close 结果以外置 `operations/close/completed.json` 为准，不从本任务卡推断物理完成。

## 4. Final current-snapshot aggregate strategy

验收标准唯一来源为当前 `spec.md` 第11节的28项AC。审查输入acceptance_criteria仅是该来源的只读视图，不是独立验收材料或第二份权威；重复传输不增加证据，最终T012逐项消费同一来源。

- **tier / method**：fullstack / fullstack-slice-testing
- **scenarios**：SCN-001～019与全部28AC；成功、失败、身份、并发、状态和真实生产consumer；逐项区分fixture与真实运行。

- **command**：`npx vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs tests/review/review-policy-compatibility.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs tests/review/review-record-route.test.mjs skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs tests/e2e/stage-reflection-real-task.test.mjs tests/contract/runtime-facade.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs tests/contract/review-layering.test.mjs tests/integration/mini-task-delivery.test.mjs tests/contract/workflow-evolution-final-aggregate.test.mjs tests/final-cutover-guards.red.test.mjs tests/contract/filled-plan-task-production.test.mjs tests/contract/material-oracle-context-packet.test.mjs tests/contract/plan-acceptance-task-gate.test.mjs tests/contract/material-producer-consumer-roundtrip.test.mjs tests/contract/confirmation-authorization.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/host-outcome-bridge.test.mjs tests/contract/claude-outcome-packet.test.mjs tests/contract/derive-consumption-edges.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs tests/contract/build-reflection-page.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs --pool=forks --poolOptions.forks.singleFork --no-file-parallelism`
- **expected exit**：0
- **oracle**：REVIEW_FINAL_ACCEPTANCE — 限定聚合与逐AC真实事实均满足才可称完成，未覆盖如实标出
- **fixtures_services**：隔离home/task/config、真实文件系统和受控provider stub；P3另记录真实provider；执行者清理本次临时fixture
- **evidence_path**：`quality/evidence/build-code/final/`
- **coverage limits**：不做全量回归；不把fixture绿当真实provider/配置验收；硬杀/外部写入/当前parser缺口保留
- **STOP**：命令损坏、真实AC缺失、越界或需新方向时返回所属卡/owner，不伪造通过
- **execution_contract**：当前快照运行限定聚合一次；失败保留原始输出并修受影响卡，不靠全量重跑掩盖局部失败

## Dependency Graph

T013 → T014 → T015 → T016 → T017 → T018 → T019 → T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011 → T012。

每个GREEN依赖其RED；跨对串行因为配置先于consumer、record先于sink/E2E且文件共享；操作与FINAL消费前序实际结果，无并行写同文件。

## OPEN / DEFER handoff

| ID | Owner | Trigger | Handoff / consumer | Close / retain condition |
| --- | --- | --- | --- | --- |
| OPEN-001 | build-plan主会话；实施归记录owner | 引用消费设计 | T005/T006及既有身份consumer | 工程边界已明确；跨树负例证明只用原execution-record-only例外，不改预算/身份 |
| OPEN-002 | build-plan主会话；运行归本机调用者 | sink生命周期设计 | T007/T008/T011 | 默认保留、用户确认无活跃调用且备份后手动清理，无自动TTL；实现与说明一致 |
| DEFER-001 | 审查能力维护者 | 后续独立需求确认 | 后续provider健康设计 | 本期无健康探测；批准方案及实测后关闭 |
| DEFER-002 | 审查性能维护者 | 真实耗时支持新预算 | 后续性能任务 | 本期静态1秒；新口径批准后关闭 |
| DEFER-003 | close-readiness维护方 | 相邻消费维修授权 | 现有usage观察能力 | 本期保留原始字段/缺口；真实canonical正确消费后关闭 |
| DEFER-004 | 审查性能维护者 | 独立benchmark需求 | 后续性能评估 | 本期无广泛性能结论；代表样本/方法/结果确认后关闭 |
| OPEN-004（外部：close-readiness） | close-readiness维护方 | 用户侧3rd-review provider配置仍需修复或上游交付 | handoff：上游既有用户侧配置修复；本任务仅loader兼容与T011不改3rd-review配置的边界观察，不新增实施任务 | 由上游owner以实际配置与验证证据关闭；本任务不代其宣称完成 |
| DEFER-005 | host集成维护者 | 独立宿主自动化需求获批准 | 后续独立需求；本期T017/T018只修显式bridge与caller接线说明 | 本期不新增executor/自动扫描；以后真实host行为验收后关闭 |

编号来源说明：DEFER-001～004及OPEN-001～002由spec引入，外部OPEN-004仍归close-readiness。T015/T016修复introduced stage及外部ownership判断，不补造早期历史；DEFER-005由本次D-013/spec引入，所有宿主自动hook/跨进程恢复/通用telemetry延期。


## Final Boundary Check

- 每Phase八项字段与精确文件边界齐备；所有卡初始pending，执行事实不伪造。
- RED/GREEN互配、同命令/同oracle/同FR-AC；只有T012使用acceptance。
- 依赖串行无环，28FR/28AC均有执行卡；新旧兼容、保存失败和真实consumer不以schema可读替代。
- 高风险绑定与N/A合同冲突已纳入P0设计，尚未实施；本轮四材料扩展有实际用户授权，review/test事实不作工作许可证。
