# 任务清单：WorkflowHub 高质量低成本异源审查

- **Input**：`decision-log.md`、`spec.md`、`plan.md`
- **Template version**：`plan-task.v3`
- **Spec hash**：`fcb545b31fdd86cba2e399db157c43e51b0af484e1962eefde2cce25eb549180`
- **Plan hash**：`cf8c360bb0555f6702748b3bb1f888121c068a68d112939797cbcc54b5f06659`

## Phase P1 — 3rd-review v3 与唯一恢复 owner

### Goal

3rd-review 独立产出每个配置 profile 的真实终态、恢复、deadline、usage/timing/error/provenance，并兼容旧 v2 consumer。

### Files

- **NEW**：`3rd-review/lib/workflowhub-result-v3.mjs`、`3rd-review/lib/recovery-policy.mjs`、`3rd-review/docs/workflowhub-result-v3.md`、`3rd-review/test/workflowhub-result-v3.test.mjs`、`3rd-review/test/recovery-policy.test.mjs`
- **MODIFY**：`3rd-review/lib/broker.mjs`、`3rd-review/lib/config.mjs`、`3rd-review/lib/process.mjs`、`3rd-review/lib/provider-failure.mjs`、`3rd-review/SKILL.md`、`3rd-review/docs/adr/0001-v4-cli-contract.md`、`3rd-review/docs/exceptions.md`、`3rd-review/test/broker.test.mjs`、`3rd-review/test/process.test.mjs`、`3rd-review/test/delivery-outcome.test.mjs`、`3rd-review/test/new-runtime-integration.test.mjs`、`3rd-review/test/managed-session-lifecycle.test.mjs`、`user-config/3rd-review/config.json`
- **DO NOT TOUCH**：`3rd-review/lib/attachments.mjs`、`3rd-review/lib/runtime.mjs`、`3rd-review/lib/continuation-materials.mjs`、`3rd-review/lib/provider-ids.mjs`、`3rd-review/scripts/3rd-review.mjs`

### Tasks

#### T001 — RED：v3 终态与有限恢复

- **ID**：T001
- **Phase**：Phase P1 — 3rd-review v3 与唯一恢复 owner
- **goal**：用失败测试固定 v3 成员事实、deadline、三类 retry、部分成功和混合版本行为。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"65d5fef2d8159f768a4a5d1882ba1265d3f3e910fb94bbb95116f2dc83165d12","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"4faf8a1da282a8d950bada49c2466a38c130754ddc9314081892a11437f04b25","id":"PLAN"}]`
- **source_refs / decision_refs**：R-008..012、D-004..006 → FR-EXEC-001..006、FR-OWNER-001 → AC-06、AC-10..13
- **输入**：现有 V4 request/v2 result、provider failure 分类和配置 schema。
- **依赖**：none
- **并行**：否 — 跨仓 producer first
- **FR**：FR-EXEC-001、FR-EXEC-002、FR-EXEC-003、FR-EXEC-004、FR-EXEC-005、FR-EXEC-006、FR-OWNER-001
- **AC**：AC-06、AC-10、AC-11、AC-12、AC-13
- **动作**：只增加/收紧目标测试；不改生产实现。
- **精确文件**：`3rd-review/test/workflowhub-result-v3.test.mjs`、`3rd-review/test/recovery-policy.test.mjs`、`3rd-review/test/broker.test.mjs`、`3rd-review/test/process.test.mjs`、`3rd-review/test/delivery-outcome.test.mjs`、`3rd-review/test/new-runtime-integration.test.mjs`、`3rd-review/test/managed-session-lifecycle.test.mjs`
- **boundary**：files 为上述 tests；symbols/regions 仅新增 v3/recovery/mixed-version cases。
- **输出**：因 v3/recovery 行为缺失而失败的原始测试事实。
- **Knowledge**：旧 v2 语义不可改；adapter 名不是来源身份；usage 缺失为 null。
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`node --test test/workflowhub-result-v3.test.mjs test/recovery-policy.test.mjs test/broker.test.mjs test/process.test.mjs test/delivery-outcome.test.mjs test/new-runtime-integration.test.mjs test/managed-session-lifecycle.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-PROTOCOL — 至少一个目标断言因 v3/recovery 未实现失败，非环境/语法错误。
- **evidence_path**：`quality/tests/T001.json`
- **STOP**：外仓无法隔离、测试入口损坏、必须改 DO NOT TOUCH、或 RED 已意外通过。
- **recovery**：P1 owner 保留原始输出并回 plan/既有 contract 核实。
- **task risk**：把旧 v2 预期误改成新语义。
- **test tier / test method**：feature — 协议 fixture + broker/process seam。
- **scenarios / commands / expected exit / oracle**：多 profile、同 adapter 独立进程、真实 SAME_SOURCE、timeout、partial success、aggregate failure、old/new mix；同 gate；exit 1；ORACLE-PROTOCOL。
- **fixtures_services**：本地 fake provider/process；任务负责清理子进程。
- **coverage limits**：不执行真实 provider；真实 smoke 在 T002 末尾单独记事实。

##### T011 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：3rd-review 外仓新增 v3/recovery 测试；未改生产实现。
- **executed_commands**：`node --test test/workflowhub-result-v3.test.mjs test/recovery-policy.test.mjs test/broker.test.mjs test/process.test.mjs test/delivery-outcome.test.mjs test/new-runtime-integration.test.mjs test/managed-session-lifecycle.test.mjs` → exit 1；81 passed、7 failed，失败来自目标行为缺失。
- **evidence_refs**：`quality/evidence/p1-red-fact.json`
- **covered_ac**：AC-06、AC-10、AC-11、AC-12、AC-13
- **review_fact**：`quality/evidence/p1-phase-review-unavailable.json`；外仓主体不能冒充 WorkflowHub 当前任务，RED 事实不作质量通过。
- **completed_at**：2026-08-13T14:58:36+08:00
- **执行事实**：T001 RED 事实来自任务卡记录，未形成按时间顺序的 canonical receipt；当前 P1 GREEN 测试另有外仓事实，不能倒写成 RED receipt。

#### T002 — GREEN：实现 v3 和唯一恢复策略

- **ID**：T002
- **Phase**：Phase P1 — 3rd-review v3 与唯一恢复 owner
- **goal**：让 T001 同命令通过，旧 v2 consumer 继续工作。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"65d5fef2d8159f768a4a5d1882ba1265d3f3e910fb94bbb95116f2dc83165d12","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"4faf8a1da282a8d950bada49c2466a38c130754ddc9314081892a11437f04b25","id":"PLAN"}]`
- **source_refs / decision_refs**：同 T001
- **输入**：T001 RED、现有 broker/config/process/provider-failure。
- **依赖**：T001
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-EXEC-001、FR-EXEC-002、FR-EXEC-003、FR-EXEC-004、FR-EXEC-005、FR-EXEC-006、FR-OWNER-001
- **AC**：AC-06、AC-10、AC-11、AC-12、AC-13
- **动作**：新增 v3 projection/recovery policy/docs；broker 只按分类做允许的一次恢复；配置加入 source_id 与正数 deadline；不改 v2。
- **精确文件**：`3rd-review/lib/workflowhub-result-v3.mjs`、`3rd-review/lib/recovery-policy.mjs`、`3rd-review/docs/workflowhub-result-v3.md`、`3rd-review/test/workflowhub-result-v3.test.mjs`、`3rd-review/test/recovery-policy.test.mjs`、`3rd-review/lib/broker.mjs`、`3rd-review/lib/config.mjs`、`3rd-review/lib/process.mjs`、`3rd-review/lib/provider-failure.mjs`、`3rd-review/SKILL.md`、`3rd-review/docs/adr/0001-v4-cli-contract.md`、`3rd-review/docs/exceptions.md`、`3rd-review/test/broker.test.mjs`、`3rd-review/test/process.test.mjs`、`3rd-review/test/delivery-outcome.test.mjs`、`3rd-review/test/new-runtime-integration.test.mjs`、`3rd-review/test/managed-session-lifecycle.test.mjs`、`user-config/3rd-review/config.json`
- **boundary**：仅 v3 projection、recovery decision、deadline termination、config validation 和文档对应区。
- **输出**：可供 WorkflowHub 消费的 v3 fixture/协议和真实终态。
- **Knowledge**：恢复计数分别记录 provider internal、fresh execution、same-session repair；成功成员不重跑。
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`node --test test/workflowhub-result-v3.test.mjs test/recovery-policy.test.mjs test/broker.test.mjs test/process.test.mjs test/delivery-outcome.test.mjs test/new-runtime-integration.test.mjs test/managed-session-lifecycle.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-PROTOCOL — 同 T001；所有正负例通过且旧 v2 fixture 不变。
- **evidence_path**：`quality/tests/T002.json`
- **STOP**：需要 provider fallback、第二层重试、修改 protected parser/runtime 或破坏 v2。
- **recovery**：撤销 P1 生产改动，保留 RED/GREEN 原始事实。
- **task risk**：mixed-version 静默降级或 process timeout 泄漏子进程。
- **test tier / test method**：feature — 同 T001。
- **scenarios / commands / expected exit / oracle**：同 T001；exit 0；ORACLE-PROTOCOL。
- **fixtures_services**：同 T001；另做一次受控真实 smoke，失败只记 unavailable。
- **coverage limits**：不证明九面审查质量；由 P2/P5 负责。

##### T012 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：3rd-review 外仓修改 `lib/broker.mjs`、`lib/config.mjs`，新增 `lib/recovery-policy.mjs`、`lib/workflowhub-result-v3.mjs`、`docs/workflowhub-result-v3.md`；T001 测试保留并扩展。
- **executed_commands**：同 T001 gate → exit 0；当前独立重跑 90 passed、0 failed；外仓测试事实单独保存。
- **evidence_refs**：`quality/evidence/p1-current-green-external.json`
- **covered_ac**：AC-06、AC-10、AC-11、AC-12、AC-13
- **review_fact**：`quality/evidence/p1-phase-review-unavailable.json`；尚未做真实 provider smoke，不能宣称真实 provider 通过。
- **completed_at**：2026-08-13T14:58:36+08:00
- **执行事实**：T002 当前 GREEN 测试 90/90 通过；v2 回归与 v3 partial/mixed-version/recovery/deadline 行为已锁定。当前 `versioned_refs` 已重新绑定本轮修订后的 spec/plan hash。

### Verify

- **Target**：AC-06、10..13
- **gate_cmd**：同 T001/T002
- **expected_exit**：0
- **evidence_path**：`quality/tests/T002.json`
- **Oracle**：ORACLE-PROTOCOL

### Knowledge

P2 只消费 v3 公共字段；provider 生命周期不回流 WorkflowHub。

### STOP

- v2 回归、protected file 必须修改、配置没有可信 source/deadline、外仓污染。

### Done

- RED 与 GREEN 同命令；v3 和 v2 兼容事实可读；P1 review findings 已处置。

### Risks and rollback

- **Risk**：协议升级破坏旧 consumer。
- **Prevention**：mixed-version + v2 regression fixture。
- **Rollback / recovery**：只撤 P1 实现，保留测试和失败证据。

## Phase P2 — WorkflowHub 九面合同与 P5 语义绑定

### Goal

WorkflowHub 只提交九面最小语义请求、消费 v3、输出可行动 finding，并消除 T010 写回触发的重复 P5 审查。

### Files

- **NEW**：`skills/wh-review/contracts/workflowhub-result.v3.json`、`skills/wh-review/scripts/review-semantic-projection.mjs`、`skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs`、`skills/wh-review/scripts/__tests__/review-semantic-projection.test.mjs`、`skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs`、`tests/integration/wh-review-v3-broker-contract.test.mjs`
- **MODIFY**：`skills/wh-review/manifest.json`、`skills/wh-review/contracts/provider-protocol.md`、`skills/wh-review/contracts/make-decision.md`、`skills/wh-review/contracts/build-spec.md`、`skills/wh-review/contracts/build-plan.md`、`skills/wh-review/contracts/build-code.md`、`skills/wh-review/contracts/verify-code.md`、`skills/wh-review/contracts/mini-task-design.md`、`skills/wh-review/contracts/mini-task-implementation.md`、`skills/wh-review/scripts/review-provider-client.mjs`、`skills/wh-review/scripts/third-review-host-config.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/wh-review/scripts/review-result.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`runtime/review/stage-materials.json`、`runtime/review/integration-review-subject.mjs`、`runtime/review/schemas/attempt.schema.json`、`runtime/review/schemas/result.schema.json`、`runtime/review/canonical-review-result.mjs`、`runtime/evidence/acceptance-evidence-validator.mjs`、`runtime/stage/stage-handlers.mjs`、`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`skills/wh-review/scripts/__tests__/integration-review-subject.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`skills/wh-review/scripts/__tests__/schema-validator.test.mjs`、`tests/integration/verify-freshness-selection.test.mjs`、`user-config/workflowhub/config.json`
- **DO NOT TOUCH**：`core/task-close.mjs`、`runtime/stage/completion-predicates.mjs`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`

### Tasks

#### T003 — RED：九面质量、v3 consumer 与 semantic hash

- **ID**：T003
- **Phase**：Phase P2 — WorkflowHub 九面合同与 P5 语义绑定
- **goal**：用失败测试固定九面问题顺序/packet/finding、v3 终态和 P5 +0/+1 调用行为。
- **design_state**：ready
- **versioned_refs**：与 T001 相同。
- **source_refs / decision_refs**：R-001、R-002、R-005、R-006、R-008、R-009、R-011、R-012、R-013、R-014、R-015、R-020、R-022、R-023、D-001、D-003、D-004、D-008、D-009、D-011、D-012、D-014 → FR-AUDIT/FOCUS/PACKET/FINDING/EXEC/FRESH/GOV/REPORT/TRACE/SCENARIO → AC-01..16、21..26
- **输入**：冻结 spec、T002 v3 fixture、当前 wh-review scripts/runtime schemas。
- **依赖**：T002
- **并行**：否 — consumer 依赖协议 producer
- **FR**：FR-AUDIT-001、FR-FOCUS-001、FR-FOCUS-002、FR-FOCUS-003、FR-FOCUS-004、FR-FOCUS-005、FR-FOCUS-006、FR-FOCUS-007、FR-FOCUS-008、FR-FOCUS-009、FR-PACKET-001、FR-PACKET-002、FR-PACKET-003、FR-FINDING-001、FR-FINDING-002、FR-FINDING-003、FR-EXEC-001、FR-EXEC-002、FR-EXEC-003、FR-EXEC-004、FR-EXEC-005、FR-EXEC-006、FR-FRESH-001、FR-FRESH-002、FR-FRESH-003、FR-GOV-001、FR-GOV-002、FR-GOV-003、FR-REPORT-001、FR-TRACE-001、FR-SCENARIO-001
- **AC**：AC-01、AC-02、AC-03、AC-04、AC-05、AC-06、AC-07、AC-08、AC-09、AC-10、AC-11、AC-12、AC-13、AC-14、AC-15、AC-16、AC-21、AC-22、AC-23、AC-24、AC-25、AC-26
- **动作**：新增/收紧逐面 prompt/packet/mutation、v3/mixed-version、semantic projection 和调用计数测试；显式覆盖 direction A→B 无状态 reveal（A 禁止当前选择，B 只能在 A 后并消费 A 结果，最终单一 review fact）、四种 disposition、无用户确认的严重 finding 必须 needs_human、route 无真异源 profile 时配置无效且 0 dispatch；不改生产实现。
- **精确文件**：`skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs`、`skills/wh-review/scripts/__tests__/review-semantic-projection.test.mjs`、`skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs`、`tests/integration/wh-review-v3-broker-contract.test.mjs`、`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`skills/wh-review/scripts/__tests__/integration-review-subject.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`skills/wh-review/scripts/__tests__/schema-validator.test.mjs`、`tests/integration/verify-freshness-selection.test.mjs`
- **boundary**：只改测试/fixture 对应 cases。
- **输出**：目标断言失败，不允许由环境错误冒充 RED。
- **Knowledge**：配置决定 reviewer；finding 空不等于 unavailable；semantic allowlist 来自 spec AC-14。
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`node --test skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/review-semantic-projection.test.mjs skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/integration-review-subject.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/schema-validator.test.mjs tests/integration/wh-review-v3-broker-contract.test.mjs tests/integration/verify-freshness-selection.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-WH — 九面至少一个质量/packet/v3/freshness 目标断言失败；包含 direction A-before-B/单 fact、四 disposition 权限和无真异源 route 负例。
- **evidence_path**：`quality/tests/T003.json`
- **STOP**：glob 展开为空、现有测试语法坏、需新增公共命令/状态机或 RED 已全绿。
- **recovery**：记录具体 case，回 plan 核实边界。
- **task risk**：用 prompt 字符串快照代替行为 oracle。
- **test tier / test method**：feature/fullstack — mutation fixtures + broker seam + P5 调用计数。
- **scenarios / commands / expected exit / oracle**：九面严重 mutation/clean control；direction A 禁止选择、B 后发且消费 A、两次小请求聚合一条 review fact；required/forbidden/duplicate/oversize；fixed/rejected_invalid/accepted_risk/needs_human 四态及严重 finding 无授权负例；无真异源 route 0 dispatch；三终态；P5 status write/semantic change；同 gate；exit 1；ORACLE-WH。
- **fixtures_services**：fake broker + deterministic task fixtures；清理临时 task。
- **coverage limits**：不证明真实模型召回；P5 benchmark 负责。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 P2 目标测试，固定 v3 consumer、semantic projection、direction A→B reveal、P5 semantic hash 和单次 broker 调用行为；不含生产实现。
- **executed_commands**：Node RED gate → exit 1，1 passed、5 个目标断言失败；混合 Node/Vitest 旧总命令判定为无效入口，不作为 RED oracle。
- **evidence_refs**：`quality/tests/T003-final.json`
- **covered_ac**：AC-01、AC-02、AC-03、AC-04、AC-05、AC-06、AC-07、AC-08、AC-09、AC-10、AC-11、AC-12、AC-13、AC-14、AC-15、AC-16、AC-21、AC-22、AC-23、AC-24、AC-25、AC-26
- **review_fact**：`quality/reviews/reports/7951d00a-9422-4e65-8519-4ab9ee4eaa1e.md`；当前 provider 返回 `PROTOCOL_INCOMPATIBLE`，phase review 是 unavailable，不是通过。
- **completed_at**：2026-08-13T15:19:00+08:00
- **执行事实**：T003 RED 已完成；失败来自目标行为缺失，不是环境或语法错误。

#### T004 — GREEN：实现九面统一合同与语义投影

- **ID**：T004
- **Phase**：Phase P2 — WorkflowHub 九面合同与 P5 语义绑定
- **goal**：让 T003 同命令通过，删除 WorkflowHub 外层 retry/SAME_SOURCE 猜测。
- **design_state**：ready
- **versioned_refs**：与 T001 相同。
- **source_refs / decision_refs**：同 T003
- **输入**：T003 RED、T002 v3 contract。
- **依赖**：T003
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-AUDIT-001、FR-FOCUS-001、FR-FOCUS-002、FR-FOCUS-003、FR-FOCUS-004、FR-FOCUS-005、FR-FOCUS-006、FR-FOCUS-007、FR-FOCUS-008、FR-FOCUS-009、FR-PACKET-001、FR-PACKET-002、FR-PACKET-003、FR-FINDING-001、FR-FINDING-002、FR-FINDING-003、FR-EXEC-001、FR-EXEC-002、FR-EXEC-003、FR-EXEC-004、FR-EXEC-005、FR-EXEC-006、FR-FRESH-001、FR-FRESH-002、FR-FRESH-003、FR-GOV-001、FR-GOV-002、FR-GOV-003、FR-REPORT-001、FR-TRACE-001、FR-SCENARIO-001
- **AC**：AC-01、AC-02、AC-03、AC-04、AC-05、AC-06、AC-07、AC-08、AC-09、AC-10、AC-11、AC-12、AC-13、AC-14、AC-15、AC-16、AC-21、AC-22、AC-23、AC-24、AC-25、AC-26
- **动作**：实现 surface registry、问题顺序、材料 allowlist/dedupe/oversize、finding validation、v3 client/canonical facts、semantic projection、P5 affected-subject reuse；direction 执行 A→B 两次有序无状态小请求但只写一条逻辑 review fact；真实配置显式加入九个 surface（含两个 mini-task 专用 surface）的全部 route，每条 route 至少一个真异源 profile，否则加载失败且 0 dispatch。
- **精确文件**：`skills/wh-review/contracts/workflowhub-result.v3.json`、`skills/wh-review/scripts/review-semantic-projection.mjs`、`skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs`、`skills/wh-review/scripts/__tests__/review-semantic-projection.test.mjs`、`skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs`、`tests/integration/wh-review-v3-broker-contract.test.mjs`、`skills/wh-review/manifest.json`、`skills/wh-review/contracts/provider-protocol.md`、`skills/wh-review/contracts/make-decision.md`、`skills/wh-review/contracts/build-spec.md`、`skills/wh-review/contracts/build-plan.md`、`skills/wh-review/contracts/build-code.md`、`skills/wh-review/contracts/verify-code.md`、`skills/wh-review/contracts/mini-task-design.md`、`skills/wh-review/contracts/mini-task-implementation.md`、`skills/wh-review/scripts/review-provider-client.mjs`、`skills/wh-review/scripts/third-review-host-config.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/wh-review/scripts/review-result.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`runtime/review/stage-materials.json`、`runtime/review/integration-review-subject.mjs`、`runtime/review/schemas/attempt.schema.json`、`runtime/review/schemas/result.schema.json`、`runtime/review/canonical-review-result.mjs`、`runtime/evidence/acceptance-evidence-validator.mjs`、`runtime/stage/stage-handlers.mjs`、`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`skills/wh-review/scripts/__tests__/integration-review-subject.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`skills/wh-review/scripts/__tests__/schema-validator.test.mjs`、`tests/integration/verify-freshness-selection.test.mjs`、`user-config/workflowhub/config.json`
- **boundary**：只改 wh-review/runtime review owner symbols；不改 completion predicate。
- **输出**：九面规范请求/结果和稳定 semantic hash。
- **Knowledge**：contract/version 参与 hash；结果写回字段必须 forbidden from projection。
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`node --test skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/review-semantic-projection.test.mjs skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/integration-review-subject.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/schema-validator.test.mjs tests/integration/wh-review-v3-broker-contract.test.mjs tests/integration/verify-freshness-selection.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-WH — 同 T003；direction A 包无当前选择、B 在 A 后、最终单 fact；状态写回调用 +0，真实语义修复只对受影响主题 +1。
- **evidence_path**：`quality/tests/T004.json`
- **STOP**：需动态 reviewer、fallback、大 packet、模型摘要 hash、第五材料或第二完成权威。
- **recovery**：按 surface 回退 P2 route/contract，保留 v3 producer。
- **task risk**：allowlist 漏关键 consumer/test，或 contract 复制导致维护分叉。
- **test tier / test method**：同 T003。
- **scenarios / commands / expected exit / oracle**：同 T003；exit 0；ORACLE-WH。
- **fixtures_services**：同 T003。
- **coverage limits**：真实 provider 质量由 T009；本任务证明协议/行为。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：实现九面 surface registry、v3 consumer、semantic projection、direction A→B reveal、canonical disposition/status 校验、单 broker 调用和 mini route 配置兼容；未改 completion predicate 或 public command。
- **executed_commands**：Node gate → exit 0、6 passed；Vitest gate → exit 0、101 passed。
- **evidence_refs**：`quality/tests/T004-final.json`
- **covered_ac**：AC-01、AC-02、AC-03、AC-04、AC-05、AC-06、AC-07、AC-08、AC-09、AC-10、AC-11、AC-12、AC-13、AC-14、AC-15、AC-16、AC-21、AC-22、AC-23、AC-24、AC-25、AC-26
- **review_fact**：`quality/reviews/reports/7951d00a-9422-4e65-8519-4ab9ee4eaa1e.md`；当前 provider 返回 `PROTOCOL_INCOMPATIBLE`，deterministic 行为通过不等于真实 provider 质量通过。
- **completed_at**：2026-08-13T16:00:00+08:00
- **执行事实**：T004 GREEN 已完成；混合 Node/Vitest 的旧总命令被拆成正确测试入口，101 个 Vitest 测试通过。

### Verify

- **Target**：AC-01..16、21..26
- **gate_cmd**：同 T003/T004
- **expected_exit**：0
- **evidence_path**：`quality/tests/T004.json`
- **Oracle**：ORACLE-WH

### Knowledge

P3 必须调用同一 `surface → request → v3 → canonical` 链。

### STOP

- 需要新 stage/public command/完成权威、动态配置或不确定 hash。

### Done

- 九面 deterministic tests GREEN；P5 重复复核回归被锁定；真实质量仍待 T009。

### Risks and rollback

- **Risk**：九面合同重复维护。
- **Prevention**：共享 runner/schema，只把问题顺序和 material policy 数据化。
- **Rollback / recovery**：单面 route 独立回退，不恢复通用大 prompt fallback。

## Phase P3 — mini-task 两次专用审查

### Goal

mini-task 设计/实施各一次专用审查，替代普通审查；结果只能由 canonical facts 派生。

### Files

- **NEW**：N/A — 复用 P2 合同。
- **MODIFY**：`skills/mini-task/scripts/mini-task-runner.mjs`、`tests/integration/mini-task-delivery.test.mjs`、`tests/integration/mini-task-a-resume.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`、`tests/e2e/vnext-five-stage-current.test.mjs`
- **DO NOT TOUCH**：`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`runtime/stage/completion-predicates.mjs`

### Tasks

#### T005 — RED：mini-task 不自报通过、不双审

- **ID**：T005
- **Phase**：Phase P3 — mini-task 两次专用审查
- **goal**：固定两条专用 route、缺配置、调用方伪 pass、重复 evidence/test/review 和越界场景。
- **design_state**：ready
- **versioned_refs**：与 T001 相同。
- **source_refs / decision_refs**：R-021、D-006、D-007 → FR-MINI-001..004 → AC-17..18
- **输入**：T004 surface API 和当前 mini-task runner。
- **依赖**：T004
- **并行**：否
- **FR**：FR-MINI-001、FR-MINI-002、FR-MINI-003、FR-MINI-004
- **AC**：AC-17、AC-18
- **动作**：只新增/收紧 mini-task integration/e2e 断言。
- **精确文件**：`tests/integration/mini-task-delivery.test.mjs`、`tests/integration/mini-task-a-resume.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`、`tests/e2e/vnext-five-stage-current.test.mjs`
- **boundary**：只改 mini-task design/implementation review cases。
- **输出**：缺失行为导致的 RED。
- **Knowledge**：缺 route 必须 0 provider call +1 unavailable；recorded 不是 completed。
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`npx vitest run tests/integration/mini-task-delivery.test.mjs tests/integration/mini-task-a-resume.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/e2e/vnext-five-stage-current.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-MINI — 自报 pass/双审/重复采集/缺用户结果至少一项失败。
- **evidence_path**：`quality/tests/T005.json`
- **STOP**：需要改 P2 协议或新增 stage。
- **recovery**：回 P2 或 decision，不在 mini runner 打补丁规避合同。
- **task risk**：测试只数调用，不检查用户结果/AC 绑定。
- **test tier / test method**：fullstack — 官方 runner + fake provider + task facts。
- **scenarios / commands / expected exit / oracle**：design/implementation success、missing route、caller pass、duplicate test/review、boundary mutation；同 gate；exit 1。
- **fixtures_services**：临时 task/worktree fixture，测试负责清理。
- **coverage limits**：不跑真实 provider。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 mini-task design/implementation 入口断言，固定不能自报 pass、不能双审、缺 route 失败保真和一次采集边界；不含 runner 实现。
- **executed_commands**：`npx vitest run tests/integration/mini-task-delivery.test.mjs -t 'capture-review-record'` → exit 1，目标断言失败：`runMiniTaskDesignReview` 不存在；不是环境或语法错误。
- **evidence_refs**：`quality/evidence/p3-red-fact.json`
- **covered_ac**：AC-17、AC-18
- **review_fact**：`quality/reviews/reports/2279a590-92fe-4410-8e15-92398c91a821.md`；当前 provider 返回 `PROTOCOL_INCOMPATIBLE`，RED 不作质量通过。
- **completed_at**：2026-08-13T15:39:00+08:00
- **执行事实**：T005 RED 已完成；Vitest 文件不再用 `node --test` 运行。

#### T006 — GREEN：接入 mini-task 专用 surface

- **ID**：T006
- **Phase**：Phase P3 — mini-task 两次专用审查
- **goal**：让 T005 同命令通过，证据一次采集，状态从 canonical result 派生。
- **design_state**：ready
- **versioned_refs**：与 T001 相同。
- **source_refs / decision_refs**：同 T005
- **输入**：T005 RED、T004 API。
- **依赖**：T005
- **并行**：否
- **FR**：FR-MINI-001、FR-MINI-002、FR-MINI-003、FR-MINI-004
- **AC**：AC-17、AC-18
- **动作**：runner 分成一次 capture → wh-review → record；两条专用 surface 替代同范围普通 review；拒绝 caller status。
- **精确文件**：`skills/mini-task/scripts/mini-task-runner.mjs`、`tests/integration/mini-task-delivery.test.mjs`、`tests/integration/mini-task-a-resume.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`、`tests/e2e/vnext-five-stage-current.test.mjs`
- **boundary**：mini-task review/evidence orchestration symbols。
- **输出**：recorded/unavailable/incomplete 真实事实。
- **Knowledge**：适用 AC、用户结果、test oracle、边界必须进入 implementation subject。
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`npx vitest run tests/integration/mini-task-delivery.test.mjs tests/integration/mini-task-a-resume.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/e2e/vnext-five-stage-current.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-MINI — design/implementation 各一次、普通 review +0、缺 route fail loud、自报 pass 被拒绝。
- **evidence_path**：`quality/tests/T006.json`
- **STOP**：只能通过默认 passed、重复跑 test/review 或改 completion predicate 才能 GREEN。
- **recovery**：撤销 runner 接线，保留 P2 合同和失败事实。
- **task risk**：resume 路径重复采集或重复 dispatch。
- **test tier / test method**：同 T005。
- **scenarios / commands / expected exit / oracle**：同 T005；exit 0。
- **fixtures_services**：同 T005。
- **coverage limits**：真实质量由 T009。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：mini-task runner 接入 design/implementation 专用 wh-review；一次 capture → review → record；canonical result 派生状态；配置支持现有嵌套 mini route，不新增第六 stage。
- **executed_commands**：四组 Vitest gate → exit 0，49 passed（delivery 16、A-resume 5、official stage 10、five-stage E2E 18）；`node --check` 和 `git diff --check` → exit 0。
- **evidence_refs**：`quality/tests/T006-final.json`
- **covered_ac**：AC-17、AC-18
- **review_fact**：`quality/reviews/reports/2279a590-92fe-4410-8e15-92398c91a821.md`；当前 provider 返回 `PROTOCOL_INCOMPATIBLE`，fake runner 通过不等于真实 provider 召回通过。
- **completed_at**：2026-08-13T16:04:00+08:00
- **执行事实**：T006 GREEN 已完成；未修改 completion predicate 或 public stage。

### Verify

- **Target**：AC-17..18
- **gate_cmd**：同 T005/T006
- **expected_exit**：0
- **evidence_path**：`quality/tests/T006.json`
- **Oracle**：ORACLE-MINI

### Knowledge

九面正式 surface 已齐；P4/P5 从配置读取两个 mini routes 的 reviewer。

### STOP

- 需要新增 stage、默认 pass 或重复 review/test。

### Done

- 专用审查与失败语义测试 GREEN；没有把 review 变推进许可证。

### Risks and rollback

- **Risk**：resume 双执行。
- **Prevention**：同 semantic subject 的一次性 capture/dispatch fixture。
- **Rollback / recovery**：仅回滚 mini runner 接线。

## Phase P4 — ModelTest 九面盲测基准

### Goal

ModelTest 提供固定九面 mutation/control、严格 matcher、真实 CLI runner 和逐面比较报告，不影响旧 US 链。

### Files

- **NEW**：`ModelTest/evaluation-assets/subjects/wh-review-adversarial/v1/surface-index.json`、`ModelTest/evaluation-assets/subjects/wh-review-adversarial/v1/release-manifest.json`、`ModelTest/evaluation-assets/mutations/wh-review-adversarial/v1/mutation-catalog.json`、`ModelTest/evaluation-assets/oracle/wh-review-adversarial/v1/target-oracles.json`、`ModelTest/evaluation-assets/contracts/wh-review-benchmark-v1.mjs`、`ModelTest/evaluation-assets/bundles/wh-review-adversarial-v1.0.0.json`、`ModelTest/evaluation-assets/registry/v4.json`、`ModelTest/evaluation-assets/scorecards/wh-review-benchmark-v1.0.0.json`、`ModelTest/evaluation-assets/schemas/wh-review-benchmark-case.schema.json`、`ModelTest/evaluation-assets/schemas/wh-review-benchmark-run.schema.json`、`ModelTest/evaluation-assets/schemas/wh-review-benchmark-attempt.schema.json`、`ModelTest/evaluation-assets/schemas/wh-review-benchmark-projection.schema.json`、`ModelTest/evaluation-assets/schemas/wh-review-benchmark-comparison.schema.json`、`ModelTest/evaluation-assets/schemas/wh-review-benchmark-report.schema.json`、`ModelTest/evaluation-assets/scoring/wh-review-benchmark-matcher.mjs`、`ModelTest/evaluation-assets/scoring/wh-review-benchmark-score.mjs`、`ModelTest/evaluation-assets/scripts/validate-wh-review-benchmark.mjs`、`ModelTest/evaluation-assets/scripts/plan-wh-review-benchmark.mjs`、`ModelTest/evaluation-assets/scripts/run-wh-review-benchmark.mjs`、`ModelTest/evaluation-assets/scripts/compare-wh-review-benchmark.mjs`、`ModelTest/evaluation-assets/scripts/report-wh-review-benchmark.mjs`、`ModelTest/evaluation-assets/scripts/replay-wh-review-history.mjs`、`ModelTest/evaluation-assets/baselines/wh-review-adversarial-v1-history-ledger.json`、`ModelTest/evaluation-assets/tests/wh-review-benchmark-assets.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-benchmark-matcher.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-benchmark-score.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-benchmark-runner.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-benchmark-comparison.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-benchmark-report.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-benchmark-compatibility.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-history-replay.test.mjs`
- **MODIFY**：`ModelTest/evaluation-assets/README.md`
- **DO NOT TOUCH**：`ModelTest/docs/prd.md`、既有 `ModelTest/evaluation-assets/subjects/us-*`、`ModelTest/monitoring`

### Tasks

#### T007 — RED：九面 benchmark 合同与失败保留

- **ID**：T007
- **Phase**：Phase P4 — ModelTest 九面盲测基准
- **goal**：固定资产/schema/matcher/score/plan/run/compare/report/compatibility 预期。
- **design_state**：ready
- **versioned_refs**：与 T001 相同。
- **source_refs / decision_refs**：R-003、R-004、D-010、D-012 → FR-EVAL-001..004 → AC-19..20
- **输入**：冻结 spec、ModelTest 现有 bundle/scorecard/runner 模式、T002 v3 fixture。
- **依赖**：T002
- **并行**：否 — T007/T008 是同一行为的 RED/GREEN；P4 整体可与 P2/P3 并行
- **FR**：FR-EVAL-001、FR-EVAL-002、FR-EVAL-003、FR-EVAL-004
- **AC**：AC-19、AC-20
- **动作**：新增 benchmark tests 和最小 fixture；另加三个历史 review 目录的只读账本重算、原文件 hash 前后不变和 unavailable 保真 RED；只写预期不写实现。
- **精确文件**：`ModelTest/evaluation-assets/tests/wh-review-benchmark-assets.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-benchmark-matcher.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-benchmark-score.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-benchmark-runner.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-benchmark-comparison.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-benchmark-report.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-benchmark-compatibility.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-history-replay.test.mjs`
- **boundary**：仅新 benchmark tests/fixtures。
- **输出**：因 benchmark 实现不存在而 RED。
- **Knowledge**：计划量公式是 `60 × sum(9 surface reviewer counts)`；不能硬编码 reviewer 总数。
- **verification_role**：RED
- **paired_task**：T008
- **gate_cmd**：`node --test evaluation-assets/tests/wh-review-benchmark-assets.test.mjs evaluation-assets/tests/wh-review-benchmark-matcher.test.mjs evaluation-assets/tests/wh-review-benchmark-score.test.mjs evaluation-assets/tests/wh-review-benchmark-runner.test.mjs evaluation-assets/tests/wh-review-benchmark-comparison.test.mjs evaluation-assets/tests/wh-review-benchmark-report.test.mjs evaluation-assets/tests/wh-review-benchmark-compatibility.test.mjs evaluation-assets/tests/wh-review-history-replay.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-EVAL — 严格 matcher、失败分母、盲名交错或配置公式至少一项目标断言失败。
- **evidence_path**：`quality/tests/T007.json`
- **STOP**：外仓不可隔离、需改旧 US 链、或测试只靠模型文本模糊评分。
- **recovery**：保留 RED，回 plan 收窄新 benchmark。
- **task risk**：样本泄漏 baseline/candidate 名称或 matcher 接受无关 finding。
- **test tier / test method**：feature — deterministic asset/schema/runner fixture。
- **scenarios / commands / expected exit / oracle**：9 surfaces×mutation/control、failed/unavailable/null usage、order blind、old registry compatibility；同 gate；exit 1。
- **fixtures_services**：fake WorkflowHub CLI；无网络；临时输出清理。
- **coverage limits**：不执行真实矩阵。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`incomplete`
- **actual_changes**：benchmark tests、fixture 和 history replay RED 断言已在候选 ModelTest 工作树中形成；没有把当前候选实现伪装成 RED。
- **executed_commands**：在清洁基线临时工作树 `/tmp/wh-review-benchmark-red` 回放同一 gate → exit 1，23 tests：1 passed、22 failed；失败均归因于目标 benchmark 实现缺失。
- **evidence_refs**：`quality/evidence/wh-review-p4-baseline-red.json`
- **covered_ac**：AC-19、AC-20（只证明清洁基线缺少目标行为）
- **review_fact**：P4 Phase review 尚未完成；RED 事实不是质量通过。
- **completed_at**：2026-08-13T17:18:37+08:00
- **执行事实**：这是实现完成后的回溯清洁基线 RED，不是按时间顺序捕获的 canonical T007 receipt；该限制已单独记录，不能把它写成标准 TDD RED。

#### T008 — GREEN：实现 benchmark assets、runner 和 score

- **ID**：T008
- **Phase**：Phase P4 — ModelTest 九面盲测基准
- **goal**：让 T007 同命令通过，旧 ModelTest 评测链不变。
- **design_state**：ready
- **versioned_refs**：与 T001 相同。
- **source_refs / decision_refs**：同 T007
- **输入**：T007 RED、T002 v3 contract。
- **依赖**：T007
- **并行**：否 — RED/GREEN 必须串行；P4 整体与 P2/P3 写集隔离
- **FR**：FR-EVAL-001、FR-EVAL-002、FR-EVAL-003、FR-EVAL-004
- **AC**：AC-19、AC-20
- **动作**：实现版本化资产/schema/contract/matcher/score/validator/plan/runner/compare/report；runner 一 case 一 CLI transaction，保留所有失败；matcher 对同一 target 多个候选只输出 blind-review queue，extra finding 不自动算命中；`unlabeled_control` 不得被当作 `gold_clean`，没有独立验收的 gold control 时只报告召回、控制样本 finding rate、执行和成本，delivery-quality 保持 inconclusive；实现只读 history replay，以版本化 ledger 对照三个真实目录的 attempt/provider/terminal/token/时长并验证原文件 hash 不变。
- **精确文件**：`ModelTest/evaluation-assets/subjects/wh-review-adversarial/v1/surface-index.json`、`ModelTest/evaluation-assets/subjects/wh-review-adversarial/v1/release-manifest.json`、`ModelTest/evaluation-assets/mutations/wh-review-adversarial/v1/mutation-catalog.json`、`ModelTest/evaluation-assets/oracle/wh-review-adversarial/v1/target-oracles.json`、`ModelTest/evaluation-assets/contracts/wh-review-benchmark-v1.mjs`、`ModelTest/evaluation-assets/bundles/wh-review-adversarial-v1.0.0.json`、`ModelTest/evaluation-assets/registry/v4.json`、`ModelTest/evaluation-assets/scorecards/wh-review-benchmark-v1.0.0.json`、`ModelTest/evaluation-assets/schemas/wh-review-benchmark-case.schema.json`、`ModelTest/evaluation-assets/schemas/wh-review-benchmark-run.schema.json`、`ModelTest/evaluation-assets/schemas/wh-review-benchmark-attempt.schema.json`、`ModelTest/evaluation-assets/schemas/wh-review-benchmark-projection.schema.json`、`ModelTest/evaluation-assets/schemas/wh-review-benchmark-comparison.schema.json`、`ModelTest/evaluation-assets/schemas/wh-review-benchmark-report.schema.json`、`ModelTest/evaluation-assets/scoring/wh-review-benchmark-matcher.mjs`、`ModelTest/evaluation-assets/scoring/wh-review-benchmark-score.mjs`、`ModelTest/evaluation-assets/scripts/validate-wh-review-benchmark.mjs`、`ModelTest/evaluation-assets/scripts/plan-wh-review-benchmark.mjs`、`ModelTest/evaluation-assets/scripts/run-wh-review-benchmark.mjs`、`ModelTest/evaluation-assets/scripts/compare-wh-review-benchmark.mjs`、`ModelTest/evaluation-assets/scripts/report-wh-review-benchmark.mjs`、`ModelTest/evaluation-assets/scripts/replay-wh-review-history.mjs`、`ModelTest/evaluation-assets/baselines/wh-review-adversarial-v1-history-ledger.json`、`ModelTest/evaluation-assets/tests/wh-review-benchmark-assets.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-benchmark-matcher.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-benchmark-score.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-benchmark-runner.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-benchmark-comparison.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-benchmark-report.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-benchmark-compatibility.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-history-replay.test.mjs`、`ModelTest/evaluation-assets/README.md`
- **boundary**：只在新 wh-review benchmark namespace 和 README 索引。
- **输出**：可生成 plan、raw attempts、逐面 comparison/report 的离线工具。
- **Knowledge**：逐面用中位数和严格 target oracle；不可计算不能 pass。
- **verification_role**：GREEN
- **paired_task**：T007
- **gate_cmd**：`node --test evaluation-assets/tests/wh-review-benchmark-assets.test.mjs evaluation-assets/tests/wh-review-benchmark-matcher.test.mjs evaluation-assets/tests/wh-review-benchmark-score.test.mjs evaluation-assets/tests/wh-review-benchmark-runner.test.mjs evaluation-assets/tests/wh-review-benchmark-comparison.test.mjs evaluation-assets/tests/wh-review-benchmark-report.test.mjs evaluation-assets/tests/wh-review-benchmark-compatibility.test.mjs evaluation-assets/tests/wh-review-history-replay.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-EVAL — 同 T007；多候选进入盲人工复核且未复核保持 pending；旧 registry/tests 不退化。
- **evidence_path**：`quality/tests/T008.json`
- **STOP**：需要侵入旧 US 链、让 ModelTest 进入 runtime、删除 failed leg 或用平均值抵消退步。
- **recovery**：删除/回滚新 benchmark namespace，不动旧链。
- **task risk**：过拟合 mutation，或 runner 重跑成功 leg。
- **test tier / test method**：同 T007。
- **scenarios / commands / expected exit / oracle**：同 T007；exit 0。
- **fixtures_services**：同 T007。
- **coverage limits**：真实 provider 由 T009。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：完成版本化九面 benchmark 资产、schema、matcher、score、plan/run/compare/report、history replay，以及把每条 leg 的私有 reviewer/cohort/source 路由传给受信 adapter；public subject 仍不暴露 baseline/candidate/reviewer 身份。
- **executed_commands**：在 ModelTest 候选工作树运行完整 P4 deterministic gate → exit 0，23/23 passed；测试路由为 fullstack，具体采用 fullstack-slice-testing；真实 provider 质量仍留给 T010。
- **evidence_refs**：`quality/evidence/p4-current-green-external.json`、`quality/tests/T008-current.json`、`quality/tests/T008.json`、`quality/evidence/wh-review-p4-baseline-red.json`
- **covered_ac**：AC-19、AC-20（deterministic benchmark contract；不宣称 A/B 质量提升）
- **review_fact**：`quality/evidence/wh-review-p4-phase-review-unavailable.json`；P4 Phase review 如实 unavailable，WorkflowHub 的 wh-review 不能冒充已审查独立 ModelTest owning worktree。
- **completed_at**：2026-08-13T17:17:00+08:00
- **执行事实**：T008 GREEN 已完成；当前快照重新捕获为 `8e57e95ddbdadff458028ca37d87728e6893f584`，先前错误的混合 Node/Vitest 总命令不计入结果。T010 任务卡中的旧 `--started-policy` 和未传 `--cli` 命令待 P5 执行前改成实际 runner 接口。

### Verify

- **Target**：AC-19..20 deterministic contract
- **gate_cmd**：同 T007/T008
- **expected_exit**：0
- **evidence_path**：`quality/tests/T008.json`
- **Oracle**：ORACLE-EVAL

### Knowledge

T009 只用版本固定的 plan/run/compare/report 命令，不手工拼报告。

### STOP

- 旧评测回归、严格 matcher 不稳定、真实 CLI 无法作为 runner consumer。

### Done

- 新 benchmark deterministic suite GREEN；未把工具可用写成 candidate 更好。

### Risks and rollback

- **Risk**：新评分成为第二生产权威。
- **Prevention**：只在 ModelTest 离线 namespace；无 WorkflowHub 写回。
- **Rollback / recovery**：整体移除新 namespace，旧链不变。

## Phase P5 — 三仓聚合与真实前后对比

### Goal

固定版本后只运行一次当前计划的 baseline/candidate 矩阵，逐面报告质量、失败、token 和时长，并完成一次 aggregate。

### Files

- **NEW**：`quality/tests/T009-plan.json`、`quality/tests/T010-final.json`、`quality/evidence/wh-review-benchmark-plan.json`、`quality/evidence/wh-review-benchmark-comparison.json`、`quality/evidence/wh-review-history-replay.json`
- **MODIFY**：N/A — 聚合只读生产文件并写任务证据。
- **DO NOT TOUCH**：`skills/wh-review`、`runtime/review`、`3rd-review/lib`、`ModelTest/evaluation-assets`、历史 review/attempt

### Tasks

#### T009 — FINAL：三仓安全预检与不可变运行清单

- **ID**：T009
- **Phase**：Phase P5 — 三仓聚合与真实前后对比
- **goal**：运行三仓 deterministic tests 并生成绑定 A/B 版本、配置、样本、reviewer 和输出目录的不可变 manifest；provider 调用数为 0。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"0d1d3a2b3d6abf128c77f04e7fefa13b4506a697cda6eafb3d7b468439710b21","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"8e29199759042748e4768aca4953c8905b10012a70494f5ceb9b7bf6e1e81957","id":"PLAN"}]`；执行时追加三仓 HEAD/source-manifest、两份真实 config bytes hash、bundle/scorecard/evaluator hash。
- **source_refs / decision_refs**：R-001、R-002、R-003、R-004、R-007、R-009、R-010、R-011、R-012、R-015、R-019、R-020、R-021、R-022、R-023、D-001、D-004、D-009、D-010、D-011、D-012、D-014、D-016 → FR-AUDIT/FOCUS/EVAL/EXEC/FRESH/GOV/MINI/TRACE → AC-01..26
- **输入**：T002/T004/T006/T008 完成事实；三个隔离 worktree；真实 `/Users/Hugh/.config/...` 配置。
- **依赖**：T002、T004、T006、T008
- **并行**：否 — preflight 读取全部前序事实
- **FR**：FR-AUDIT-001、FR-EVAL-001、FR-EVAL-002、FR-EVAL-003、FR-EVAL-004、FR-EXEC-001、FR-EXEC-002、FR-EXEC-003、FR-EXEC-004、FR-EXEC-005、FR-EXEC-006、FR-FINDING-001、FR-FINDING-002、FR-FINDING-003、FR-FOCUS-001、FR-FOCUS-002、FR-FOCUS-003、FR-FOCUS-004、FR-FOCUS-005、FR-FOCUS-006、FR-FOCUS-007、FR-FOCUS-008、FR-FOCUS-009、FR-FRESH-001、FR-FRESH-002、FR-FRESH-003、FR-GOV-001、FR-GOV-002、FR-GOV-003、FR-MINI-001、FR-MINI-002、FR-MINI-003、FR-MINI-004、FR-OWNER-001、FR-PACKET-001、FR-PACKET-002、FR-PACKET-003、FR-REPORT-001、FR-SCENARIO-001、FR-TRACE-001
- **AC**：AC-01、AC-02、AC-03、AC-04、AC-05、AC-06、AC-07、AC-08、AC-09、AC-10、AC-11、AC-12、AC-13、AC-14、AC-15、AC-16、AC-17、AC-18、AC-19、AC-20、AC-21、AC-22、AC-23、AC-24、AC-25、AC-26
- **动作**：在三个 owning repo cwd 执行各自 deterministic suites；先对 WorkflowHub flow quality、ModelTest US-06、KnowledgeDigest Task 2-C 三个只读 `quality/reviews/` 运行 history replay，与版本化 ledger 比对 attempt/provider/terminal/token/时长并确认原文件 hash 不变、未知仍 unavailable；运行生产对象 inventory 与反向 consumer 检查，验证每个新增对象有唯一 owner/consumer/替代/保留条件且无孤儿、双写、永久桥、第二评分权威；随后执行 `plan-wh-review-benchmark.mjs --no-dispatch`，冻结 baseline/candidate source manifest、3rd-review、bundle、scorecard、两份 config bytes、route/profile/leg/output root。
- **精确文件**：`quality/tests/T009-plan.json`、`quality/evidence/wh-review-benchmark-plan.json`、`quality/evidence/wh-review-history-replay.json`
- **boundary**：只写 plan/preflight 事实；不得连接 provider。
- **输出**：不可变 run manifest 和 0 provider call 证明。
- **Knowledge**：`3rd-review/...`、`ModelTest/...` 是 repo 归属；命令在 `$WH_REVIEW_THIRD_REVIEW_WORKTREE`、`$WH_REVIEW_WORKFLOWHUB_WORKTREE`、`$WH_REVIEW_MODELTEST_WORKTREE` 对应 cwd 执行。
- **verification_role**：N/A — non-behavior change: plan-only preflight
- **paired_task**：N/A — plan-only aggregate has no RED/GREEN pair
- **gate_cmd**：`bash -lc 'test -n "$WH_REVIEW_THIRD_REVIEW_WORKTREE" && test -n "$WH_REVIEW_WORKFLOWHUB_WORKTREE" && test -n "$WH_REVIEW_MODELTEST_WORKTREE" && test -n "$WH_REVIEW_WORKFLOWHUB_BASELINE_ROOT" && test -n "$WH_REVIEW_THIRD_REVIEW_BASELINE_ROOT" && test -n "$WH_REVIEW_MODELTEST_BASELINE_ROOT" && test -n "$WH_REVIEW_TASK_PATH" && (cd "$WH_REVIEW_THIRD_REVIEW_WORKTREE" && node --test test/workflowhub-result-v3.test.mjs test/recovery-policy.test.mjs test/broker.test.mjs test/process.test.mjs test/delivery-outcome.test.mjs test/new-runtime-integration.test.mjs test/managed-session-lifecycle.test.mjs) && (cd "$WH_REVIEW_WORKFLOWHUB_WORKTREE" && node --test skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/review-semantic-projection.test.mjs skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs tests/integration/wh-review-v3-broker-contract.test.mjs) && (cd "$WH_REVIEW_WORKFLOWHUB_WORKTREE" && npx vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/integration-review-subject.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/schema-validator.test.mjs tests/integration/verify-freshness-selection.test.mjs tests/integration/mini-task-delivery.test.mjs tests/integration/mini-task-a-resume.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/e2e/vnext-five-stage-current.test.mjs) && (cd "$WH_REVIEW_MODELTEST_WORKTREE" && node --test evaluation-assets/tests/wh-review-benchmark-assets.test.mjs evaluation-assets/tests/wh-review-benchmark-matcher.test.mjs evaluation-assets/tests/wh-review-benchmark-score.test.mjs evaluation-assets/tests/wh-review-benchmark-runner.test.mjs evaluation-assets/tests/wh-review-benchmark-comparison.test.mjs evaluation-assets/tests/wh-review-benchmark-report.test.mjs evaluation-assets/tests/wh-review-benchmark-compatibility.test.mjs evaluation-assets/tests/wh-review-history-replay.test.mjs && node evaluation-assets/scripts/replay-wh-review-history.mjs --baseline evaluation-assets/baselines/wh-review-adversarial-v1-history-ledger.json --workflowhub-reviews /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-delivery-flow-quality-v1/quality/reviews --modeltest-reviews /Users/Hugh/Hugh/Knowledge/Projects/ModelTest/tasks/US-06/quality/reviews --knowledge-digest-reviews /Users/Hugh/Hugh/Knowledge/Projects/KnowledgeDigest/tasks/task2c-knowledge-publication-trust-reader-quality/quality/reviews --output "$WH_REVIEW_TASK_PATH/quality/evidence/wh-review-history-replay.json" && node evaluation-assets/scripts/plan-wh-review-benchmark.mjs --baseline-workflowhub-root "$WH_REVIEW_WORKFLOWHUB_BASELINE_ROOT" --candidate-workflowhub-root "$WH_REVIEW_WORKFLOWHUB_WORKTREE" --baseline-third-review-root "$WH_REVIEW_THIRD_REVIEW_BASELINE_ROOT" --candidate-third-review-root "$WH_REVIEW_THIRD_REVIEW_WORKTREE" --baseline-modeltest-root "$WH_REVIEW_MODELTEST_BASELINE_ROOT" --candidate-modeltest-root "$WH_REVIEW_MODELTEST_WORKTREE" --baseline-workflowhub-config /Users/Hugh/.config/workflowhub/config.json --candidate-workflowhub-config /Users/Hugh/.config/workflowhub/config.json --baseline-third-review-config /Users/Hugh/.config/3rd-review/config.json --candidate-third-review-config /Users/Hugh/.config/3rd-review/config.json --output-root "$WH_REVIEW_TASK_PATH/quality/evidence/wh-review-benchmark-runs" --output "$WH_REVIEW_TASK_PATH/quality/evidence/wh-review-benchmark-plan.json")'`
- **expected_exit**：0
- **oracle**：ORACLE-PLAN — 三仓完整确定性测试全绿；三个历史目录重算与 ledger 一致、抽样 JSON 可回读、前后 hash 不变、未知保持 unavailable；新增对象 inventory/反向 consumer 无孤儿、双写或第二权威；manifest 字段/hash/leg 公式完整；实际 provider 调用计数为 0。
- **evidence_path**：`quality/tests/T009-plan.json`
- **STOP**：worktree/HEAD/source hash/config/route/deadline/bundle/scorecard/output 缺失，公式不符，baseline 与 candidate 相同，协议不兼容或检测到 provider dispatch。
- **recovery**：只修 preflight 输入或回对应前序 task；不得进入 T010。
- **task risk**：错误 cwd、旧配置或同版本 A/B。
- **test tier / test method**：fullstack deterministic + plan-only。
- **scenarios / commands / expected exit / oracle**：路径/版本/config 正反例、reviewer 公式、0 dispatch；同 gate；exit 0；ORACLE-PLAN。
- **fixtures_services**：无真实 provider；只读真实 config 并冻结 bytes/hash。
- **coverage limits**：不证明真实模型质量，只证明运行可执行且绑定正确。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：完成三仓确定性预检和当前配置绑定的 plan-only 清单；未发生 provider dispatch。
- **executed_commands**：当前配置/版本 preflight 已执行并 exit 0；WorkflowHub/3rd-review/ModelTest deterministic suites、history replay、对象边界检查和 `plan-wh-review-benchmark.mjs` 均通过；当前清单为 `quality/evidence/wh-review-benchmark-plan-current.json`，1140 legs，配置 hash `39ad818130d7b78db6ffa132153c442e57a6ebf286c7ba0060ff91047a8549f6`。
- **evidence_refs**：`quality/tests/T009-plan-current.json`、`quality/evidence/wh-review-benchmark-plan-current.json`、`quality/evidence/wh-review-benchmark-plan-adapter-bounded-v9.json`、`quality/evidence/wh-review-history-replay.json`
- **covered_ac**：AC-01..26 的版本、配置、路由、历史事实和 0-dispatch 绑定；不证明真实 provider 质量。
- **review_fact**：P5 final aggregate review pending；T009 是 plan-only 事实，不代替一次真实聚合。
- **completed_at**：2026-08-13T17:22:00+08:00
- **执行事实**：早期 T009 shell 语法错误和旧 plan 输出冲突均保留为失败事实；旧清单为 1140 legs，随后按当前配置生成独立 v9 清单为 1260 legs，不能混用两份结果；当前 preflight 已用正确拆分的 Node/Vitest 路由和 current output root 通过。

#### T010 — FINAL：一次真实 A/B 与只读聚合

- **ID**：T010
- **Phase**：Phase P5 — 三仓聚合与真实前后对比
- **goal**：只消费 T009 manifest 执行一次真实矩阵，逐面比较质量、失败、token 和时长。
- **design_state**：ready
- **versioned_refs**：与 T009 相同，并绑定 `quality/evidence/wh-review-benchmark-plan.json` hash。
- **source_refs / decision_refs**：R-001、R-002、R-003、R-004、R-007、R-009、R-010、R-011、R-012、R-015、R-019、R-020、R-021、R-022、R-023、D-001、D-004、D-009、D-010、D-011、D-012、D-014 → FR-AUDIT/FOCUS/EVAL/EXEC/FRESH/GOV/MINI/TRACE → AC-01..26
- **输入**：T009 完成的不可变 manifest；用户原始需求已明确授权修改前后真实评测。
- **依赖**：T009
- **并行**：否 — one-shot external aggregate
- **FR**：FR-AUDIT-001、FR-EVAL-001、FR-EVAL-002、FR-EVAL-003、FR-EVAL-004、FR-EXEC-001、FR-EXEC-002、FR-EXEC-003、FR-EXEC-004、FR-EXEC-005、FR-EXEC-006、FR-FINDING-001、FR-FINDING-002、FR-FINDING-003、FR-FOCUS-001、FR-FOCUS-002、FR-FOCUS-003、FR-FOCUS-004、FR-FOCUS-005、FR-FOCUS-006、FR-FOCUS-007、FR-FOCUS-008、FR-FOCUS-009、FR-FRESH-001、FR-FRESH-002、FR-FRESH-003、FR-GOV-001、FR-GOV-002、FR-GOV-003、FR-MINI-001、FR-MINI-002、FR-MINI-003、FR-MINI-004、FR-OWNER-001、FR-PACKET-001、FR-PACKET-002、FR-PACKET-003、FR-REPORT-001、FR-SCENARIO-001、FR-TRACE-001
- **AC**：AC-01、AC-02、AC-03、AC-04、AC-05、AC-06、AC-07、AC-08、AC-09、AC-10、AC-11、AC-12、AC-13、AC-14、AC-15、AC-16、AC-17、AC-18、AC-19、AC-20、AC-21、AC-22、AC-23、AC-24、AC-25、AC-26
- **动作**：在 ModelTest worktree 运行 manifest；每个 leg dispatch 前原子写 started；completed 跳过；started 无 terminal 记 ambiguous/unavailable 且不自动重跑；多候选命中输出盲人工复核包，未复核保持 pending、不计 target hit；随后 compare/report/constitution/source coverage。
- **精确文件**：`quality/tests/T010-final.json`、`quality/evidence/wh-review-benchmark-comparison.json`
- **boundary**：只写真实 run/comparison/final facts；不改 manifest 和生产实现。
- **输出**：逐面 A/B comparison、原始 attempts 和大白话最终报告。
- **Knowledge**：命令可安全恢复 not_started leg，但永不自动重跑 started/ambiguous/completed leg。
- **verification_role**：N/A — non-behavior change: one-shot external aggregate
- **paired_task**：N/A — final aggregate has no RED/GREEN pair
- **gate_cmd**：`bash -lc 'test -n "$WH_REVIEW_MODELTEST_WORKTREE" && test -n "$WH_REVIEW_TASK_PATH" && (cd "$WH_REVIEW_MODELTEST_WORKTREE" && node evaluation-assets/scripts/run-wh-review-benchmark.mjs --manifest "$WH_REVIEW_TASK_PATH/quality/evidence/wh-review-benchmark-plan-current.json" --cli "$WH_REVIEW_MODELTEST_WORKTREE/evaluation-assets/scripts/run-wh-review-benchmark-leg.mjs" --cwd "$WH_REVIEW_MODELTEST_WORKTREE" && node evaluation-assets/scripts/compare-wh-review-benchmark.mjs --manifest "$WH_REVIEW_TASK_PATH/quality/evidence/wh-review-benchmark-plan-current.json" --attempts "$WH_REVIEW_TASK_PATH/quality/evidence/wh-review-benchmark-runs-current" --output "$WH_REVIEW_TASK_PATH/quality/evidence/wh-review-benchmark-comparison-current.json" && node evaluation-assets/scripts/report-wh-review-benchmark.mjs --comparison "$WH_REVIEW_TASK_PATH/quality/evidence/wh-review-benchmark-comparison-current.json" --output "$WH_REVIEW_TASK_PATH/quality/evidence/wh-review-benchmark-report-current.json")'`
- **expected_exit**：0
- **oracle**：ORACLE-FINAL — 计划 leg 全有 completed/failed/timed_out/cancelled/ambiguous 事实；无重复 dispatch；26 AC 和逐面 AC-20 的质量/稳定性/成本/证据完整性事实可回读或明确 `inconclusive/unavailable`；固定分数不作为继续或交付闸门。
- **evidence_path**：`quality/tests/T010-final.json`
- **STOP**：manifest hash 不符、出现计划外 leg/provider、runner 要重跑 started/ambiguous/completed、协议不兼容或需改生产实现。
- **recovery**：保留全部原始事实；只继续 not_started leg；回具体前序 task 修复，不修改本 run。
- **task risk**：真实调用昂贵、长时、provider 抖动导致 unavailable。
- **test tier / test method**：real external paired benchmark + read-only aggregate。
- **scenarios / commands / expected exit / oracle**：正常/空/错误/取消/timeout/ambiguous/部分成功；同 gate；exit 0 只表示执行完整，质量由 ORACLE-FINAL 判定。
- **fixtures_services**：真实 3rd-review providers；runner 管 session；raw attempts 不删除。
- **coverage limits**：只证明固定 manifest；不外推未来 provider/model/config。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **execution_status**：`completed`
- **quality_status**：`inconclusive`
- **actual_changes**：三仓 deterministic final aggregate 已通过；ModelTest 全量回归已恢复为 285 passed、0 failed、3 skipped；当前 verify-code 双 reviewer 已对快照 `35087f37d6b0fe1932216917010aa25027ed63ec` 形成 available 结果，但 T010 九面 A/B 仍不可比较，不能写成通过。
- **executed_commands**：三仓 deterministic final aggregate → exit 0；ModelTest 全量 `node --test evaluation-assets/tests/*.test.mjs` → 285 passed、0 failed、3 skipped；WorkflowHub close freshness matrix → 21 passed、0 failed；当前 verify attempt `41fd78a8-6e24-4273-b97b-8aaeca6f0d3d` → 双 provider available、8 条 findings；close 预检查 → 因四项正式事实缺失而拒绝。
- **evidence_refs**：`quality/tests/verify-code-current-35087f37d6b0fe1932216917010aa25027ed63ec.json`、`quality/evidence/verify-code-current-summary-35087f37d6b0fe1932216917010aa25027ed63ec.json`、`quality/reviews/results/verify-code-default-35087f37d6b0fe1932216917010aa25027ed63ec-41fd78a8-6e24-4273-b97b-8aaeca6f0d3d.json`、`quality/evidence/verify-code/finding-dispositions-current.json`、`quality/evidence/verify-code/exceptions-current.json`
- **当前正式缺口**：`finding_dispositions`、`acceptance_criteria`、`exceptions`、`human_confirmation` 不能因为测试通过或 provider available 自动补齐；T010 质量仍 `inconclusive`，原先 16 个 source mapping 已按 spec 权威映射修正，需在新材料快照上复核，不能继续引用旧审查结论。
- **covered_ac**：AC-01..26 的 deterministic/协议和真实矩阵终态部分有当前事实；九个 surface 的有效配对数仍未达到比较门槛，真实 provider 质量、逐面 A/B、token 和成本结论仍 `unavailable/incomplete`，不输出 candidate 优于 baseline 的结论。
- **review_fact**：T010 真实矩阵已完整结束；504 条 attempt 失败或超时，失败码含 `ATTACHMENT_DELIVERY_UNSUPPORTED`、`TIMEOUT`、`OUTPUT_INVALID`、`CLI_EXIT`、`PROCESS_DEAD`，均保留原始事实；final integration review 仍待 build-code 当前快照执行。
- **completed_at**：2026-08-14T00:00:00+08:00
- **执行事实**：v10 manifest 计划 1260 条、实际 1260 条、全部 terminal；comparison/report 的 publication status 都是 `inconclusive`，report 明确 `no_composite_score=true`、`no_global_rank=true`，token cost `unavailable`，duration delta `not_computable`。这表示“执行完整”，不表示“质量验证通过”。

### Verify

- **Target**：AC-01..26 和三仓 seam
- **gate_cmd**：先执行 T009 plan-only gate；只在 ORACLE-PLAN 满足后执行 T010 one-shot gate
- **expected_exit**：0
- **evidence_path**：`quality/tests/T010-final.json`
- **Oracle**：ORACLE-FINAL

### Knowledge

最终报告必须分开：有效 findings、provider 失败、token/时长、逐面质量/稳定性/成本事实、仍需处理的风险；不能用固定总分代替这些事实。

### STOP

- 缺 hash/route/deadline/预算、公式不符、baseline 不可重放、协议不兼容、需新设计。

### Done

- 一次 current-snapshot aggregate；完整 A/B legs 或明确 unavailable；逐面结果不被平均数掩盖。

### Risks and rollback

- **Risk**：高成本运行或中途 provider 失败。
- **Prevention**：plan-only、固定 deadline、dispatch 前原子 started、ambiguous 不自动重跑。
- **Rollback / recovery**：外部调用不可撤销；保留事实，只继续 manifest 中 `not_started` leg。

## Phase P6 — 正式验收事实与交付关闭一致性

### Goal

让 verify-code 和 task-close 共享同一组六项正式事实；所有 canonical finding 都有 disposition，serious actionable finding 只额外影响完成和风险接受；材料只写回时可以复用测试/review，不因完整快照变化重复消耗 provider。

### Files

- **NEW**：`tests/integration/review-test-close-freshness-matrix.test.mjs`
- **NEW**：`quality/tests/T013-close-final.json`、`quality/evidence/p6-close-freshness.json`
- **MODIFY**：`runtime/stage/completion-predicates.mjs`、`runtime/stage/stage-handlers.mjs`、`core/task-close.mjs`、`skills/mini-task/scripts/mini-task-runner.mjs`、`skills/wh-review/contracts/build-spec.md`、`skills/wh-review/contracts/build-plan.md`、`skills/wh-review/contracts/verify-code.md`、`skills/wh-review/contracts/mini-task-implementation.md`、`tests/integration/vnext-delivery-close.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/official-component-receipts.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`、`tests/final-cutover-guards.red.test.mjs`、`tests/integration/mini-task-delivery.test.mjs`
- **DO NOT TOUCH**：`CONSTITUTION.md`、public runtime 命令、四份材料之外的第二完成记录、3rd-review provider 生命周期

### Tasks

- T011/T012/T013：finding、六项 verify 事实、材料只写复用、代码变化失效和授权分离。

### Verify

T011/T012/T013 运行 P6 目标矩阵；ORACLE-P6-FINAL 检查 finding 处置、六项 verify 事实、材料只写复用、代码变化失效和授权分离。

### Knowledge

P6 只消费现有质量事实和 close 事实，不新增第五材料、公共命令或第二完成权威。

### STOP

发现代码变化复用旧事实、普通 finding 丢失、close 只看部分事实、授权混用或 provider 失败被写成通过时停止。

### Done

缺一项正式 verify 事实都不能准备 close；所有 canonical finding 都有处置；材料写回不触发 provider 重跑。

### Risks and rollback

旧 fixture 可能缺正式事实；只补当前测试和消费者接线，保留原始 finding/失败事实，不改历史记录。

#### T011 — RED：finding 与 close 正式事实缺口

- **ID**：T011
- **Phase**：Phase P6 — 正式验收事实与交付关闭一致性
- **goal**：用失败测试锁定所有 canonical finding disposition、serious risk authorization、close 六项事实和材料/代码四象限。
- **design_state**：ready
- **versioned_refs**：执行前绑定当前 `spec.md`、`plan.md` hash。
- **source_refs / decision_refs**：R-016、R-017、R-018、R-024、D-002、D-015 → FR-FINDING-003..004、FR-CLOSE-001..004 → AC-27..32
- **输入**：T010 完成事实、当前 completion predicates、stage handlers、task-close 和 mini-task runner。
- **依赖**：T010
- **并行**：否 — 共享事实合同必须先固定
- **FR**：FR-FINDING-003、FR-FINDING-004、FR-CLOSE-001、FR-CLOSE-002、FR-CLOSE-003、FR-CLOSE-004、FR-GOV-002
- **AC**：AC-27、AC-28、AC-29、AC-30、AC-31、AC-32
- **动作**：新增 close freshness matrix；补普通/严重 finding、缺处置、`accepted_risk` 无用户确认、六项 verify 事实缺失/错误、材料只变复用、代码变化拒绝复用和授权分离负例。
- **精确文件**：`tests/integration/review-test-close-freshness-matrix.test.mjs`、`tests/integration/vnext-delivery-close.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`、`tests/final-cutover-guards.red.test.mjs`、`tests/integration/mini-task-delivery.test.mjs`
- **boundary**：只新增/收紧目标断言，不修改生产实现。
- **输出**：目标行为 RED；环境错误不能冒充 RED。
- **verification_role**：RED
- **paired_task**：T012
- **gate_cmd**：`npx vitest run tests/integration/review-test-close-freshness-matrix.test.mjs tests/integration/vnext-delivery-close.test.mjs tests/contract/stage-completion.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/final-cutover-guards.red.test.mjs tests/integration/mini-task-delivery.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：ORACLE-CLOSE-FINDING — 普通 finding 被漏处置、serious accepted_risk 无授权可通过、close 缺四项事实仍成功等目标断言失败。
- **evidence_path**：`quality/tests/T011-close-finding-red.json`
- **STOP**：只能靠删 finding、放宽 close 或改 provider verdict 才能 RED；需要新增 public runtime 或第五材料。
- **recovery**：回对应 contract/handler owner，不在测试中绕过事实。
- **test tier / test method**：fullstack — stage handler + quality fact + task-close + mini-task integration。
- **scenarios / commands / expected exit / oracle**：同 gate；exit 1；ORACLE-CLOSE-FINDING。
- **fixtures_services**：临时 vNext task/Git fixture；测试负责清理。
- **coverage limits**：不证明真实 provider 质量；只固定 WorkflowHub 事实边界。
- **Knowledge**：共享 finding/close 合同的最小失败样本已冻结。
- **task risk**：测试可能漏掉普通 finding 或把授权错误当通过。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：T011 的 close/finding/freshness 目标断言已形成并由 T012/T013 当前实现回归；普通 finding、严重风险授权、六项正式事实、材料只写复用、代码变化失效和授权分离均有测试覆盖。
- **executed_commands**：T011/T012/T013 目标命令在当前候选快照 exit 0，156/156 passed；当前证据为 `quality/tests/T013-close-final.json`。
- **red_evidence_limit**：原始 RED 没有在本轮形成独立 canonical receipt；因此只把当前行为修复和回归事实记为完成，不把 RED 缺失改写成质量通过。
- **covered_ac**：AC-27、AC-28、AC-29、AC-30、AC-31、AC-32。
- **review_fact**：当前 P6 独立异源 review 仍 `unavailable/incomplete`，不冒充 provider 通过。
- **handoff**：T013 继续验证当前快照；正式 close 仍取决于独立审查、逐 AC、例外、finding 处置和人工确认。

#### T012 — GREEN：共享 finding/完成谓词与 close 消费

- **ID**：T012
- **Phase**：Phase P6 — 正式验收事实与交付关闭一致性
- **goal**：让 T011 同命令通过，不新增第二完成权威。
- **design_state**：ready
- **versioned_refs**：与 T011 相同，执行前更新 hash。
- **source_refs / decision_refs**：同 T011
- **输入**：T011 RED、当前 canonical finding/result/quality fact 合同。
- **依赖**：T011
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-FINDING-003、FR-FINDING-004、FR-CLOSE-001、FR-CLOSE-002、FR-CLOSE-003、FR-CLOSE-004、FR-GOV-002
- **AC**：AC-27、AC-28、AC-29、AC-30、AC-31、AC-32
- **动作**：拆分 all canonical finding 与 serious actionable finding；统一 finding 状态和授权校验；completion predicates 导出共享判断；task-close 逐条校验六项 verify 事实；mini-task 复用同一 finding contract 并要求显式 human confirmation；保留 tested source 与 current delivery 分离和材料只变复用。
- **精确文件**：`runtime/stage/completion-predicates.mjs`、`runtime/stage/stage-handlers.mjs`、`core/task-close.mjs`、`skills/mini-task/scripts/mini-task-runner.mjs`、`skills/wh-review/contracts/build-spec.md`、`skills/wh-review/contracts/build-plan.md`、`skills/wh-review/contracts/verify-code.md`、`skills/wh-review/contracts/mini-task-implementation.md`、T011 测试文件
- **boundary**：只改现有事实消费者、共享 validator 和合同；不新增质量事实类型、状态机、公共命令。
- **输出**：同 T011 gate exit 0；缺事实 fail loud；真实 review `recorded` 不被当作 provider pass。
- **verification_role**：GREEN
- **paired_task**：T011
- **gate_cmd**：`npx vitest run tests/integration/review-test-close-freshness-matrix.test.mjs tests/integration/vnext-delivery-close.test.mjs tests/contract/stage-completion.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/final-cutover-guards.red.test.mjs tests/integration/mini-task-delivery.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：ORACLE-CLOSE-FINDING — 所有 canonical finding 有 disposition，serious risk 无授权不能完成，close 六项事实齐全才可准备。
- **evidence_path**：`quality/tests/T012-close-finding-green.json`
- **STOP**：默认 pass、忽略普通 finding、把 `accepted_risk` 当普通状态、放宽代码变化复用或新增第二完成记录。
- **recovery**：撤回 P6 consumer 接线，保留 RED 和原始 finding 事实。
- **test tier / test method**：同 T011。
- **scenarios / commands / expected exit / oracle**：同 T011；exit 0。
- **fixtures_services**：同 T011。
- **coverage limits**：真实 provider 质量继续由 T010/verify review 事实决定。
- **Knowledge**：只复用现有 canonical finding、quality fact 和 close consumer。
- **task risk**：收紧谓词可能误伤历史只读事实，必须只影响当前 vNext consumer。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：共享 finding 状态、严重风险授权校验、六项 verify fact close 消费、mini-task 复用和材料/代码四象限复用已接入现有消费者；没有新增 public runtime、第五材料或第二完成权威。
- **executed_commands**：T011/T012/T013 目标命令 exit 0，156/156 passed；全量 deterministic 回归另为 1528 passed、1 skipped、exclusive 31 passed。
- **evidence_refs**：`quality/tests/T013-close-final.json`、`quality/evidence/workflowhub-candidate-full-test-20260815.json`。
- **covered_ac**：AC-27、AC-28、AC-29、AC-30、AC-31、AC-32，并回归 AC-09、AC-14、AC-15、AC-17、AC-18、AC-21、AC-22。
- **review_fact**：确定性测试通过不等于 provider pass；当前独立 review、逐 AC、例外和人工确认仍由 T013/正式 verify 保持不完整。
- **handoff**：T013 只做当前快照复核，不重新运行旧 T010 A/B，也不因测试绿灯执行 close。

#### T013 — FINAL：P6 当前快照复核

- **ID**：T013
- **Phase**：Phase P6 — 正式验收事实与交付关闭一致性
- **goal**：验证 P6 不破坏现有五阶段、mini-task、receipt reuse、semantic review reuse 和 close 授权边界。
- **design_state**：ready
- **versioned_refs**：绑定 T012 完成后的当前 spec/plan hash。
- **source_refs / decision_refs**：R-016、R-017、R-018、R-024、D-002、D-015 → AC-27..32，并回归 AC-09、AC-14、AC-15、AC-17、AC-18、AC-21、AC-22。
- **输入**：T012 GREEN、当前三仓 deterministic gate。
- **依赖**：T012
- **并行**：否 — 最终当前快照复核
- **FR**：FR-FINDING-003、FR-FINDING-004、FR-FRESH-001..003、FR-MINI-001..004、FR-CLOSE-001..004、FR-GOV-001..003
- **AC**：AC-09、AC-14、AC-15、AC-17、AC-18、AC-21、AC-22、AC-27、AC-28、AC-29、AC-30、AC-31、AC-32
- **动作**：运行 P6 目标矩阵、现有 wh-review/mini/vNext/close deterministic suites；执行一次当前实现异源 review，失败如实记录，不重复追求空 findings。
- **精确文件**：`quality/tests/T013-close-final.json`、`quality/evidence/p6-close-freshness.json`、`tests/official-component-receipts.test.mjs`
- **boundary**：只写当前验证事实；不修改 manifest、历史 review 或 provider 配置。
- **输出**：逐 AC 结果、六项事实读回、授权分离和四象限复用结果。
- **verification_role**：N/A — non-behavior change: final verification aggregate
- **paired_task**：N/A — non-behavior change: final aggregate has no RED/GREEN pair
- **gate_cmd**：`npx vitest run tests/integration/review-test-close-freshness-matrix.test.mjs tests/integration/vnext-delivery-close.test.mjs tests/contract/stage-completion.test.mjs tests/official-component-receipts.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs tests/integration/mini-task-delivery.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/e2e/vnext-five-stage-current.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：ORACLE-P6-FINAL — 目标矩阵和既有回归全绿；provider unavailable 保留；AC-27..32 不因平均数或历史事实被掩盖。
- **evidence_path**：`quality/tests/T013-close-final.json`
- **STOP**：发现代码变化复用旧事实、普通 finding 丢失、close 只看两项、授权混用或 provider 失败被写成通过。
- **recovery**：回 T012 修复具体 consumer；不重跑 T010 真实 A/B。
- **test tier / test method**：fullstack deterministic + one independent review fact。
- **scenarios / commands / expected exit / oracle**：同 gate；exit 0；ORACLE-P6-FINAL。
- **fixtures_services**：临时 task/Git fixture；真实 provider 只按当前 config；失败原样保留。
- **coverage limits**：不重新证明 T010 九面质量提升；只证明 P6 不破坏已有交付质量边界。
- **Knowledge**：只消费当前三仓 deterministic 事实和当前 review/close 事实。
- **task risk**：当前异源 reviewer 不可用时只能记录 unavailable，不能把 deterministic 绿灯当成审查通过。

### Execution facts for T013 (append-only)

- **deterministic gate**：2026-08-14；按当前 gate 命令执行，8 个测试文件、177 个测试全部通过，exit 0。
- **已覆盖**：六项 verify 事实缺失/状态/hash/当前绑定、普通/严重 finding 处置、无用户授权的 `accepted_risk`、mini-task design/implementation、材料只写回复用、代码变化拒绝复用、close confirmation 与授权分离。
- **独立异源 review**：当前 worktree 没有可直接供官方 sidecar 读取的已认证 TaskHandle/current task store；本地 `workflowhub-capability` doctor 也不存在。因此没有把 deterministic tests 冒充异源 review，当前独立 review 事实仍为 `unavailable/incomplete`，不能宣称正式 verify 已 passed。
- **人工处置**：本轮生产改动没有新增需要用户决定的严重 finding；所有测试发现均已在当前 task 内修复并保留测试事实。
- **发布前自检**：`npm run check` 通过；技能闭包、结构验收、5 阶段技能包冒烟和 `git diff --check` 均通过。新增 v3 broker/direction reveal/semantic projection/fixture audit/layering 测试 6 个文件、11 个测试通过。
- **追加当前全量回归（2026-08-15）**：候选工作树 `npm test` safe suite 为 `161` 个测试文件、`1528 passed / 1 skipped`，exclusive suite `31 passed / 0 failed`；当前 snapshot tree `0f9a05f321efa9cd5ea06e78bf6f50505487657f`。这只是确定性回归事实，不替代真实 provider、逐 AC、例外或人工确认。
- **非本任务基线失败**：修复后单独复跑 7 个旧测试文件、41 个测试，32 通过、9 失败；失败来自 M15 HTML 断言、已归档 workflowhub-delivery-flow-quality-v1 路径、旧 stage skill 清单、move-map/archive 漂移以及旧 59/12 步计数。未把这些失败改写为 P6 通过，也未扩大本任务范围。
- **追加 P6 目标回归（2026-08-15）**：按 T011/T012/T013 目标命令执行，6 个测试文件、156 个测试全部通过，exit 0，耗时约 243.22 秒；当前快照 tree `0f9a05f321efa9cd5ea06e78bf6f50505487657f`。证据为任务存储 `quality/tests/T013-close-final.json`。该事实只证明 finding、close、材料只写复用和 mini-task 边界，不补齐真实 provider、逐 AC、例外或人工确认。
- **追加当前包闭环回归（2026-08-15）**：当前候选重新执行 `npm run check`，markdownlint、结构验收、仓库合同检查、skill closure 和 5 阶段本地 skill package smoke 全部通过，exit 0；当前快照 tree `87e3ff523d9b459ea154000d23c2c3c60c92ded2`。证据为 `quality/evidence/workflowhub-candidate-check-20260815.json`。这仍不替代真实 provider、逐 AC、例外或人工确认。
- **追加 direction 合同歧义回归（2026-08-15）**：修正 `single_round` 与 direction 两次短请求之间的文字歧义；`simple-contracts + review-runner` 为 `55/55 passed`。这只防止错误的机械复审，不证明真实 provider 质量提升。

## 4. Final current-snapshot aggregate strategy

- **tier / method**：fullstack + real external paired benchmark
- **scenarios**：AC-01..32；九面 mutation/control；正常/空/错误/加载/取消/边界/权限/竞态；P5 +0/+1；mini-task 两 route；P6 close/finding 四象限。
- **command**：T009 `gate_cmd` → T010 `gate_cmd` → T013 `gate_cmd`
- **expected exit**：0
- **oracle**：ORACLE-FINAL — deterministic tests 完整、计划和实际 legs 一致、逐面 AC-20、P6 六项事实和 finding 处置完整、失败不删、宪法 21 条可追溯。
- **fixtures_services**：固定 bundle/config/三仓 source manifest；真实 provider；runner 负责 session、原始输出和原子 leg 状态。
- **evidence_path**：`quality/tests/T013-close-final.json`
- **coverage limits**：固定版本结论；不代表未来模型/配置。
- **STOP**：任何前置 hash/route/deadline/预算/协议不满足、P6 正式事实不完整或需要新设计。
- **execution_contract**：T009 可安全重复且 0 provider call；T010 只消费冻结 manifest，失败保留原始输出，只继续 `not_started`，不自动重跑 started/ambiguous/completed。

## Dependency Graph

- **order**：T001 → T002 → T003 → T004 → T005 → T006；T002 → T007 → T008；T006 + T008 → T009 → T010 → T011 → T012 → T013

```text
T001 (RED) → T002 (GREEN) → T003 (RED) → T004 (GREEN) → T005 (RED) → T006 (GREEN) ┐
                    └────────→ T007 (RED) → T008 (GREEN) ──────────────────────────┴→ T009 (PLAN) → T010 (FINAL) → T011 (RED) → T012 (GREEN) → T013 (FINAL)
```

## Final Boundary Check

- [ ] 每个 Phase 的 Goal、Files、Tasks、Verify、Knowledge、STOP、Done、Risks and rollback 完整。
- [ ] 每个任务只有一张卡和一个完成区；精确文件属于所属 Phase。
- [ ] 每个行为变化都有同命令、同 oracle 的 RED → GREEN；T009 只做安全预检，T010 才做一次真实聚合，T011/T012 只做当前事实边界修复。
- [ ] 依赖无环，FR/AC 双向追溯闭合，未知事实未写成通过。
- [ ] review、test、evidence 只作为事实，不是开始、继续或交付许可证。

## 当前会话 T007/T008/T009/T010 纠偏记录（append-only，2026-08-14）

- T007 仍为 `incomplete`：现有 RED 是实现完成后的清洁基线回放，不是按时间顺序捕获的 canonical RED；不能把它改写成标准 TDD 完成。
- T008 的原 `23/23` 只覆盖旧 deterministic gate。修复 benchmark 输入盲测、失败分母、candidate quality gate、provider auth 隔离、JSON 结果读取、timeout 和 compare 输入过滤后，当前定向 gate 为 `13/13` 通过；ModelTest 全量 288 测试为 280 通过、5 失败、3 跳过，5 个失败都来自旧 US-02 live config hash 漂移，不能写成全量通过。
- T009 新生成的 `wh-review-adversarial-v8/v9/v10` manifest 均为 1260 legs、0 provider dispatch 的计划事实；其中 v9/v10 绑定三仓、当前 config、bundle、runner snapshot。旧 1140-leg 和旧 v9/v10 记录不混用。
- T010 旧 `v10` 仍只读保留，质量为 `inconclusive`，不能被新 benchmark 纠偏覆盖。新 runner 只做定向 smoke：baseline `make-decision.direction/mutation-1` 成功（106360ms、8202 tokens、OpenCode 3 findings）；candidate `make-decision.direction/mutation-2` 成功（295163ms、16518 tokens、Codex 3 findings、OpenCode 4 findings）。两条不是同一 case，只有 smoke 证据，不能形成 A/B 结论。
- candidate 第一次 240 秒 smoke 超时已保留 `timed_out` 事实；它没有被重跑覆盖。后续 900 秒 smoke 是新 manifest、新 case、新运行，理由是验证 runner timeout 修复和真实双 provider 收尾。
- 当前 T010 仍未完成：没有全量 current A/B、九面逐面有效配对、可靠成本结论和 current comparison/report；`quality/verify.json` 继续保持 `incomplete`。

## 当前会话 verify-code finding 处置记录（append-only，2026-08-14）

- 当前 verify attempt：`948fb578-5ffc-4641-a4f7-c5ee0a296458`；两个配置 provider 均完成，结果为 semantic review，不是 provider pass。
- finding 处置：US-02 可变宿主 config 导致的 5 个全量测试失败已 `fixed`；新增仓库内冻结 provider config 快照，并用 `node --test evaluation-assets/tests/us02-baseline-integrity.test.mjs` 验证 10/10 通过。
- 仍未处置的真实 findings：旧 verify snapshot、26 项完整 AC 与用户结果、T010 九面有效 A/B、finding disposition、例外处理、人工确认、mini-task 两面正式闭环和三仓稳定冻结。它们保持 `needs_human`/`incomplete`，没有写成通过。

## 当前会话最终 verify-code 复核记录（append-only，2026-08-15）

- 当前 candidate snapshot：`83dd072357582d7e9820865af5ea4b21d5c873ee`；source digest：`4ba88637ce49ee798e88573bc84f9e6565a71720998727dda9b088f0b3058634`。
- 真实测试：WorkflowHub `1518 passed、0 failed、1 skipped`，live public behavior `10 tests、14 CLI cases`；3rd-review `288 passed、0 failed、0 skipped`；ModelTest `285 passed、0 failed、3 skipped`。三个 US-06 real-report skip 仍不算通过。
- 最终异源审查：attempt `1204dea5-5a6d-4721-ab36-7cfd07a8e7c1`；`opencode/v4flash` 和 `codex/luna` 均 completed，`2/1 valid reviewers`，无 timeout、invalid output、provider failure、fresh retry 或 same-session repair；记录 9 条 finding（2 blocking、5 major、2 minor）。
- finding 处置：9 条 finding 已逐条写入 `quality/evidence/verify-code/finding-dispositions-current-83dd072357582d7e9820865af5ea4b21d5c873ee-v1.json`，当前全部 `needs_human`；没有伪造 `fixed`、`rejected_invalid` 或未经用户授权的 `accepted_risk`。
- 当前正式事实：`quality/verify.json` 仍为 `incomplete`；`full_tests_fresh=passed_with_skips`、`independent_review=recorded`、`finding_dispositions=incomplete`、`acceptance_criteria=incomplete`、`exceptions=incomplete`、`human_confirmation=needs_human`。
- 当前剩余缺口：T010 九面 paired A/B 仍 inconclusive；US-06 仍缺外部 US-05 sealed task root；真实 route/member、P5/T010 写回调用数、五阶段/新增对象证据、live probe runtime receipt 和用户确认仍未形成当前可回读事实。AC-16 因缺少三轴 mutation/调用数直接证据保持 unknown。

## 当前会话 T008 评测隔离与评分口径补充（append-only，2026-08-15）

- T008 的当前评测实现补上 `gold-clean-acceptance.json`、v1.2 scorecard/evaluator、每 leg 独立 TaskHandle 和 `reported_with_failures` 事实；旧 v1.0/v1.1 attempt 不覆盖、不重写。
- `clean-control` 只有带独立 acceptance ref 的新计划 leg 才可作为 `gold_clean`；历史 control 没有独立验收时只作 `unlabeled_control` 诊断，不能产生误报率或 delivery-quality。
- 每个 benchmark leg 在对应 `Projects/<project>/tasks/<unique-task-id>` 下写入私有状态，采集 attempt 后清理；共享任务不会被并发 leg 互相改 snapshot 或写 mini-task receipt。
- compare 仍把失败留在执行率分母；有效配对和 gold-clean 足够时，质量/成本可报告但有失败的 surface 标 `reported_with_failures`，assessment 保持 `inconclusive`。被 `--limit`、surface/case/version filter 截断或 run-summary 未完成时，顶层 execution scope 标 `incomplete`。
- ModelTest 当前校验和定向回归为 `28 passed / 0 failed`；新 v1.2 plan-only 为 `252` legs、`0 provider call`。本补充没有调用真实 provider，不改变 T010 未完成事实。
- 本次没有执行 commit、push、merge、分支删除、archive、cleanup 或正式 close；没有单独未完成的 mini-task，T005/T006 mini-task 设计与实施路线仍属于主任务内已完成的实现卡，但正式质量事实仍受主任务整体 incomplete 约束。

## US-06 外部依赖路径纠正与复测（append-only，2026-08-15）

- 复核发现：US-05 sealed task root 并非不存在，真实路径是 `/Users/Hugh/Hugh/Knowledge/Projects/ModelTest/tasks/US-05`；之前使用了错误的 `/Users/Hugh/Hugh/Project/ModelTest/tasks/US-05` 路径。
- 使用真实路径执行 `MODELTEST_US06_US05_TASK_ROOT=/Users/Hugh/Hugh/Knowledge/Projects/ModelTest/tasks/US-05 node --test evaluation-assets/tests/us06-real-report.test.mjs`：3/3 通过、0 skipped；真实 report input、summary、plan 和 7 个 diagnostics 的 hash 均与 sealed manifest 一致。
- 使用同一真实路径执行 ModelTest 全量 `node --test evaluation-assets/tests/*.test.mjs`：288/288 通过、0 失败、0 skipped；当前完整测试状态从 `passed_with_skips` 更新为 `passed`。
- 新证据：`quality/evidence/final-test-summary-current-83dd072357582d7e9820865af5ea4b21d5c873ee-v2.json`、`quality/tests/output/modeltest-full-current-83dd072357582d7e9820865af5ea4b21d5c873ee-v1.output`；F-5982b5e2b9ba 已标记 `fixed`，但 AC-24/AC-26 仍不能仅凭这三个真实报告测试宣称产品验收通过。
- T010 九面 paired A/B、当前 route/member、P5/T010 写回计数、逐 AC 可回读事实、live probe receipt、例外、人工确认和正式 close 仍未完成；本次没有执行 commit、push、merge、archive、cleanup 或正式 close。

## 当前会话外部证据补齐（append-only，2026-08-15）

- `npm run probe:public-behavior` 已在当前 snapshot `83dd072357582d7e9820865af5ea4b21d5c873ee` 重新执行：exit 0，1 个测试文件通过，10/10 测试通过，14 个 CLI case，通过时间约 44.44 秒；receipt 和输出摘要已写入 `quality/evidence/live-public-behavior-current-83dd072357582d7e9820865af5ea4b21d5c873ee-v1.json`。
- F-e4fdba002ae6 的 live probe receipt 缺口已标记 `fixed`；F-5982b5e2b9ba 的 US-06 真实报告缺口也保持 `fixed`。其余 7 条当前 finding 仍为 `needs_human`，没有伪造风险接受。
- 当前 `quality/verify.json` 仍为 `incomplete`：完整测试已为 `passed`，但 T010、逐 AC、真实运行绑定、例外和人工确认仍未完成。

## 当前会话 ModelTest A/B 绑定修正与真实 smoke（append-only，2026-08-15）

- 第一次 current-v2 评测不是 provider 结果：1260/1260 条腿都因 `TASK_BINDING_UNAVAILABLE` 终止，原因是计划没有写入每个版本的 TaskHandle。该失败已保留，不能当成质量失败或质量通过。
- 已恢复真正的 baseline TaskHandle：`/Users/Hugh/Knowledge/Projects/wh-review-benchmark/tasks/wh-review-benchmark-baseline`，绑定现有 baseline worktree；candidate 继续绑定当前任务 TaskHandle。重新生成 current-v3 计划后，1260 条计划腿通过入口预检，provider dispatch 仍为 0（计划阶段不调用 provider）。
- 真实 smoke 已完成同一 `make-decision.direction / mutation-1` 的 baseline/candidate 配对：baseline 2 条、candidate 2 条，4 条均有合法终态和 result/attempt/report 引用。两边 mutation recall 都是 1，但没有 clean control，所以 delivery quality 和误报率不能计算，T010 仍是 `inconclusive`。
- baseline 两条耗时中位数为 80.108 秒、8205 tokens；candidate 两条耗时中位数为 346.481 秒、16591.5 tokens，约多 332.5% 时间、102.21% token。candidate 运行了配置中的两个 provider，并执行 direction 的 blind reconstruction + challenge 两段；这证明真实成本上升，但还不能证明质量分数提高。
- smoke 证据：`quality/evidence/wh-review-benchmark-smoke-current-v3.json`；完整 current-v3 comparison：`quality/evidence/wh-review-benchmark-comparison-current-v3-partial.json`。没有因 smoke 结果修改源代码，也没有把不完整 comparison 写成通过。
- 结论：当前真实测试已证明 WorkflowHub、3rd-review、ModelTest 全量确定性门和一条真实 A/B smoke 能跑通；但九面 paired A/B、每面 clean control、低成本结论、逐 AC、finding 处置、例外和人工确认仍未完成。不能 close。

## 当前会话 ModelTest 真实依赖复测纠正（append-only，2026-08-15）

- 最新命令 `MODELTEST_US06_US05_TASK_ROOT=/Users/Hugh/Hugh/Project/ModelTest/tasks/US-05 node --test evaluation-assets/tests/*.test.mjs` exit `1`，结果为 `285 passed、3 failed、0 skipped`，不是此前记录的 `288/288`。
- 3 个失败均来自 `evaluation-assets/tests/us06-real-report.test.mjs`：真实 US-05 sealed root 和 `quality/evidence/formal-cohort/us05-formal-20260812-v2-run3-reanalysis-v2/report-input.json` 不存在，错误为 `ENOENT`。最新回归摘要见 `quality/tests/output/modeltest-full-current-83dd072357582d7e9820865af5ea4b21d5c873ee-v2.output`。
- 先前 `v1.output` 绑定的 `/Users/Hugh/Hugh/Knowledge/Projects/ModelTest/tasks/US-05` 当前也无法读取，属于历史陈旧证据，不能继续支撑 US-06 通过。
- F-5982b5e2b9ba 的旧 `fixed` 处置已被当前回归推翻，新的 finding disposition v4 将其恢复为 `needs_human`；不得创建 substitute report 或手工补齐。
- 本项是外部证据纠正，不是新增需求，不启动 mini-task。T010、正式验收、例外、人工确认和 close 继续保持 `incomplete`。

## 当前会话 benchmark 中断与 runner 修正（append-only，2026-08-15）

- current-v4 全量运行发现 4 条真实 leg 子进程超过 4 小时未终止，最终保留 `32 completed、1228 started-without-terminal`；中断摘要为 `quality/evidence/wh-review-benchmark-run-current-v4-interrupted.json`。
- v4 中断暴露 runner 记录边界问题：原实现会在 worker 真正派发前为所有排队腿写 `started`，中断后无法区分未执行和已执行。已修正为“实际派发时才写 started”，新增 `--limit 1` 排队不落 started 的测试；定向 runner 测试 `3/3 passed`。
- 新 current-v5 plan/output 已生成并绑定真实 baseline/candidate TaskHandle。direction/mutation-1 冒烟共 8 条完成（baseline 4、candidate 4）；baseline 中位 `8195 tokens/87.5s`，candidate 中位 `16517 tokens/334.8s`，两边 recall=1，但 clean control 缺失，comparison 仍 inconclusive。
- current-v5 九面全量已重新启动。v4 的 started 记录不混入 v5；失败、timeout、provider unavailable 和未派发任务都按各自事实保留。
- 这次是现有评测执行器的修复，不是新增需求，不启动 mini-task；T010 和正式 close 继续保持 incomplete。

## 当前会话 US-05 正确路径复测纠正（append-only，2026-08-15）

- 之前 285/289 的失败来自错误环境变量路径 `/Users/Hugh/Hugh/Project/ModelTest/tasks/US-05`；失败事实保留，但不是 US-05 数据丢失。
- 真实 sealed root 为 `/Users/Hugh/Hugh/Knowledge/Projects/ModelTest/tasks/US-05`，`report-input.json` 存在。
- 使用正确 root 重跑后：ModelTest `289 passed、0 failed、0 skipped`，US-06 real-report `3/3 passed`；最新摘要为 `quality/tests/output/modeltest-full-current-83dd072357582d7e9820865af5ea4b21d5c873ee-v4.output`。
- F-5982b5e2b9ba 已在 finding disposition v5 恢复 `fixed`。当前仍不能 close，因为 T010、逐 AC、真实运行绑定、例外和人工确认未完成。

## 当前会话 bounded benchmark v6 选择（append-only，2026-08-15）

- v4/v5 长寿命全量运行都出现真实 leg 长时间停在 `started`；中断事实保留，不再用一个 1260-leg 单进程继续消耗 provider。
- 新 v6 计划仍覆盖 9 个 stage、6 类 case、baseline/candidate 和配置中的全部 reviewer；只把重复次数设为 2。两 provider surface 每个 case 8 条腿，三 provider surface 每个 case 12 条腿，计划总量 504。
- comparison 仍要求每面至少 4 条有效 paired executions；clean control 和 5 个 mutation case 都保留，失败/不可用继续进分母。`--run-count 2` 只是有界执行参数，不修改生产 wh-review 配置和评测样本内容。
- v6 将按 surface/case 小批次执行，防止一个 provider 卡住时拖死全部 stage；未达到 4 条有效配对的 surface 保持 inconclusive，不得宣称通过。

## 当前会话 benchmark provider 终态修正（append-only，2026-08-15）

- v6 direction 初步 comparison：baseline quality `69.5`、candidate quality `76.5`；candidate recall `0.85→0.95`，但两边 clean false-positive rate 都为 `1`，candidate 未过 80 分质量门槛，token `+101.52%`、时长 `+295.47%`。该结果只作初步事实。
- 进一步读取原始 attempt：多数 `SAME_SOURCE` 是 host=codex 时对 `codex/luna` 的合同排除，不是 provider 挂掉。v7 临时修正曾把它误算失败，已停止。
- runner 现已改为：`SAME_SOURCE` 作为合法终态单独计数；真实 provider failure、坏 JSON、timeout 才使整条 configured provider group 不可用。v8 计划重新生成，旧 v6/v7 不混用。

## 当前会话 v8 direction 真实 A/B 结果（append-only，2026-08-15）

- v8 已完成 make-decision.direction 的 clean control、mutation-1 到 mutation-5，共 48 条 paired attempts；所有 48 条有 terminal 记录，2 条 candidate 因 `PROVIDER_GROUP_PARTIAL` 为 unavailable。
- comparison 文件：`quality/evidence/wh-review-benchmark-comparison-current-v8-direction-partial.json`，整体 `inconclusive`；其余 8 个 stage surface 还没有有效 paired A/B，不得写成全量完成。
- baseline：quality `66`、serious recall `0.80`、clean false-positive `1.00`、execution `1.00`、中位 `8200 tokens / 87235.5 ms`。
- candidate：quality `71.8`、serious recall `0.8947`、clean false-positive `1.00`、execution `0.9167`、中位 `16521.5 tokens / 335328.5 ms`，44/48 有效。
- candidate delta：quality `+5.8`，token `+101.48%`，duration `+284.39%`；未达到 quality `80`，并且低成本门槛失败。结论只能是“召回有改善，但成本和执行可靠性不达标”。
- 正确真实回归：WorkflowHub `1518/0/1`；live public behavior `10/10`、14 CLI cases；3rd-review 独跑 `294/294`；ModelTest 正确 sealed root `/Users/Hugh/Hugh/Knowledge/Projects/ModelTest/tasks/US-05` 为 `289/289`。
- 3rd-review 曾与 WorkflowHub 并行执行时出现 `293/294` 的并发时序失败，独跑后 `294/294`；失败事实保留，后续应把这类测试当作运行稳定性问题继续检查。
- 最新 live receipt：`quality/evidence/live-public-behavior-current-83dd072357582d7e9820865af5ea4b21d5c873ee-v2.json`。
- 当前任务保持 `incomplete`，不 close；T010、其余八面 A/B、7 条人工 finding、逐 AC、例外和人工确认仍未完成。

## 当前会话 mini-task 真实复测事实（append-only，2026-08-15）

- WorkflowHub candidate `review-runner` 已修复三个 mini-task 路由断点：不再把专用 review 当普通 integration；向 `buildMaterials` 传递 `reviewKind`；implementation review 保留完整 diff。聚焦测试 `38/38 passed`。
- v11 `mini_task.design`：candidate `42/48` 有效，质量 `74.86`、严重召回 `0.9444`、clean false-positive `1.00`、中位 `8203 tokens/166959 ms`；baseline `0/48`，旧合同失败。comparison `quality/evidence/wh-review-benchmark-comparison-current-v11-mini-runtime-fix.json`，该面 `inconclusive`。
- v12 `mini_task.implementation`：48/48 仍为旧 benchmark 输入失败，错误包括没有完整 diff 和非结构化 `test_evidence`；结果只读保留，不与 v13 混用。
- ModelTest runner 已为 implementation benchmark 生成 current-snapshot receipt、结构化 `ac_trace` 和唯一测试证据；baseline 临时 worktree 增加 implementation fixture。runner 定向测试 `4/4 passed`。
- v13 implementation 受控 smoke：一条真实 candidate review 返回 3 条 findings；另两条 clean-control candidate leg 在 `180000 ms` 超时。完整批次的 4 条长时间 started leg 已停止并标为 `ambiguous`，没有自动重试。finding 和 timeout 事实均不构成通过。
- 当前 T010 仍 `incomplete/inconclusive`；不能因 mini-task 路由修复或单条 semantic review close。后续必须先处理真实 findings，再重新获取足够的有效 paired A/B，并继续完成逐 AC、例外、人工确认和正式 close 前复核。

## 当前会话停止继续执行事实（append-only，2026-08-15）

- 按用户要求停止尚未结束的 `npm test`；它被中断，exit `130`，不产生当前全量 passed 事实。
- 当前可以保留的最新测试事实是聚焦集成 `80/80`、ModelTest runner `4/4`、mini-task design candidate `42/48` 有效，以及 implementation smoke 中的真实 findings/timeout。
- 本任务可以收口为“调查和当前修复阶段暂停”，不能收口为“交付完成/正式 close”；T010、finding、逐 AC、例外和人工确认仍是不完整事实。

## 当前 T014 审查成本修复（2026-08-15）

- [x] 修正 provider prompt 与 manifest authority 对齐：required、contract、review_lens 和 map-selected context 的读取边界一致。
- [x] build-plan 保留 stage-local `planning_artifacts`，但不重复发送给 provider；packet-plan 留下排除事实。
- [x] 统一大 diff 分流和最终交付上限，并避免 shard 已覆盖的 anchor 再发送一份 context。
- [x] diff section 单次解析；成本事实保留 broker 内部 recovery counters。
- [x] 定向回归 `59/59 passed`。
- [ ] 当前快照一次性执行 `verify-code` 独立审查并绑定正式 task evidence。
- [ ] 补齐当前 finding dispositions、逐 AC、exceptions 和 human confirmation；不把 provider verdict 或旧 snapshot 冒充完成。

## 当前 T015 verify-code 与评测裁决（2026-08-15）

- [x] 记录一次错误宿主标识调用：`workflowhub` 被 broker 拒绝为 `REQUEST_INVALID`，未产生 provider 审查，不纳入质量评价。
- [x] 用正确宿主标识完成当前快照唯一一次有效异源审查：`opencode/v4flash` + `codex/luna`，2/2 终态、0 provider retry、4 条 actionable findings。
- [x] 将当前 review attempt/result/report 绑定到官方 `quality/verify.json`；状态保持 `incomplete`。
- [x] 记录 4 条 finding 的共同结论：当前验收事实未闭合；T010 对照和成本事实缺失；AC 逐条追溯不完整；finding disposition、例外、人工确认缺失。
- [x] 记录评分裁决：不再使用固定 80 分继续门槛；历史 A/B 因 gold-clean control 和 paired 完整性不足只能算 `inconclusive`。
- [x] 记录全部 9 个审查面：direction/detail 有召回变化但成本上升且 control 不干净；build-spec 无提升；build-plan、build-code 两面、verify-code、mini_task implementation 无有效 paired；mini_task design 只有 candidate。
- [x] 记录 v21 direction pilot：4/252 终态、control 未标 gold-clean；candidate 成本明显更高但发现了真实交付风险，不能把 findings 视为误报。
- [ ] 逐条处理当前 4 条 finding，并重新生成当前 AC/例外事实；这不是继续追分，而是完成真实交付闭环。
- [ ] 等待人工确认后再判断 logical close；不执行 commit、merge、push、cleanup 或 formal close。

## 当前 T016 验收事实链修复（2026-08-15）

- [x] 查明旧验收摘要的根因：实际 spec 有 AC-01..AC-32，外部摘要只有 AC-01..AC-26；摘要默认补 `actual_outcome=result`，且没有传实现/测试锚点。
- [x] 在现有 `acceptance-evidence.v1` summary 中保留结构化 `implementation_anchor`、`verification_anchor`，并拒绝绝对主机路径和非法锚点。
- [x] 缺实际结果、实现锚点、测试/断言锚点，或多条 AC 共享锚点/嵌套证据时，provider-facing summary 降为 `unknown/incomplete`；不新增第五材料或质量分数门禁。
- [x] 更新 verify-code 合同和 wh-review bundle/catalog hash。
- [x] 回归：`ac-evidence-summary 8/8`、`review-materials-contract 13/13`、`official-component-receipts 32/32`。
- [ ] 重新生成当前 AC-01..AC-32 的真实证据；旧 AC-01..AC-26 摘要只能只读保留，不能当当前事实。
- [ ] 逐条处理当前 4 条 actionable finding，并补全 finding disposition、例外和人工确认。
- [ ] 重新生成当前 verify 事实并判断 logical close；不执行 commit、merge、push、cleanup 或 formal close。

## 当前 T017 阻断旧 AC 摘要（2026-08-15）

- [x] verify material preflight 从当前 `spec.md` 读取 AC 集合。
- [x] 拒绝 AC-01..AC-26 旧摘要进入 AC-01..AC-32 当前任务。
- [x] 保留不一致为 `MATERIAL_INCOMPLETE`，不改成质量分数门槛，不阻止同 task 修复。
- [x] 回归：材料合同 + review runner `54/54 passed`。
- [ ] 定位 `vnext-five-stage-current` bounded timeout 的具体测试/子进程原因。
- [ ] 生成当前 AC-01..AC-32 的真实实现锚点、测试断言和实际结果事实。
- [ ] 逐条处置当前 4 条 finding，补例外和人工确认，再重新判断 logical close。

## 当前 T018 审查根因修复与成本复测（2026-08-15）

- [x] 修复空验收覆盖、当前 AC 集合、AC anchor 角色和重叠范围误判。
- [x] 修复异源 quorum 的 source identity、同源排除和混合材料重复请求。
- [x] 修复官方 stage 入口 snapshot 重复读取，并保留结束 drift 检查。
- [x] 跑定向审查与验收回归 `105/105`、官方 stage 回归 `74/74`、五阶段 e2e `18/18`。
- [x] 跑 `npm run check`、skill closure、5 阶段 skill smoke 和 `git diff --check`。
- [ ] 在当前真实代码快照上补齐 AC-01..AC-32 的实现锚点、测试断言和实际结果。
- [ ] 逐条处理 4 条 actionable finding，补 exceptions、route/member、P5/T010 写回计数和 human confirmation。
- [ ] 不以 80 分或零 finding 作为继续条件；不机械重跑旧 review，不执行 close、commit、merge、push、cleanup。

## 当前 T019 验收发布与重复校验根因修复（append-only，2026-08-15）

- [x] 修复 `quality/tests/` 嵌套事实被 `verify` 校验器误判的问题。
- [x] 修复 `verify` 叶子结果二次校验不幂等，避免发布器制造无效失败和重试。
- [x] 当前快照绑定：tree `c464b4d2495b8155b102d4b8ebf121fd2becf951`，source digest `541403ddda437cb4284025b9e921bc99bd4a88656a2a8fb28f2287fb390139de`。
- [x] 当前确定性回归：13 文件/247 测试通过；五阶段 e2e 18/18 通过，约 `95.95s`。
- [x] 当前 `quality/verify.json` 已重新发布并绑定 AC-01..AC-32：17 passed、9 failed、6 incomplete；总状态 `incomplete`。
- [x] finding dispositions、exceptions 已绑定当前快照。
- [x] 记录 `verify-final-coverage.mjs` 对旧 coverage artifact 的 tree/hash mismatch 和 AC-16..AC-32 缺失；该事实保持 `incomplete`，不伪造为通过。
- [ ] 当前快照的独立 provider review 尚未重新执行；旧 review 不复用。
- [ ] T010 可信 paired A/B、逐条 finding 完整处置、人工确认仍未完成。
- [ ] 不以 80 分或零 finding 作为继续条件；不执行 close、commit、merge、push、cleanup。

## 当前 T020 评分口径与当前快照审查（2026-08-15）

- [x] 确认生产流程没有固定 80 分继续门槛；历史比较的 80 分是评测报告阈值，不是 stage 完成条件。
- [x] 确认 `247/247` 确定性测试和五阶段 e2e `18/18` 不能替代 provider 质量 A/B；历史九面比较因 gold-clean control 或 paired coverage 缺失保持 `inconclusive`。
- [x] 用当前 execution snapshot `ca6e790b8f6e776623d1db0ea1a19069de7347e8`、source digest `1377d78ea424e4694824d6922bf1702812b7f22f6b2745548dc4f7c17fc98cb7` 做一次正式 verify-code 审查。
- [x] 当前审查由 `opencode/v4flash`、`codex/luna` 完成，`2/2` terminal、零 provider retry、6 条 actionable findings（2 blocking、4 major）；结果、报告、attempt 已绑定 `quality/verify.json`。
- [x] 当前 finding dispositions 和 exceptions 写入 current-v5；总 verify 状态仍 `incomplete`，没有把 provider 成功或空 findings当作完成。
- [x] 记录当前 review 包约 `38 KB`，实际 provider wall time 约 `168 秒`；未追加无新价值的重试。
- [x] 正式 `verify-final` 已真实运行但返回 `WORKTREE_CHANGED_AFTER_REVIEW`：候选 snapshot/base/captured head 相同，target repo HEAD 改变导致 target_commit 不同。该事实证明当前 freshness 绑定会制造重复审查风险，不是质量分数不够。
- [ ] 修正 final freshness：无关 target HEAD 变化不应单独使同一 candidate execution snapshot 失效；需要保持宪法要求的当前 subject/材料/授权绑定，并补回归。
- [ ] 逐条处理当前 6 条 finding，补当前 AC 独立事实、可信 T010 对照和人工确认；不以 80 分或零 finding作为处理门槛。
- [ ] 在 finding、例外和人工确认完成前，保持 `incomplete`；不执行 close、commit、merge、push 或 cleanup。

## 当前 T021 质量对比与快照复用复核（append-only，2026-08-15）

- [x] 明确当前评分口径：`fixed_quality_80_gate=false`；80 分只属于历史评测阈值，不是生产流程的继续条件。
- [x] 当前 v1.2 的 9 个审查面全部 `inconclusive`；没有可发布的 gold-clean control 或完整 paired A/B，不能宣称整体质量提升。
- [x] 历史 nominal 结果只有 direction/detail 的召回上升：direction `0.80→0.895`、detail `0.90→1.00`；但 direction token `+101.48%`、时长 `+284.39%`，detail 时长 `+112.70%`；build-spec 无质量提升；其余面没有有效 paired。
- [x] 最后一次真实 build-code integration review：3/3 provider terminal、0 retry、约 291 秒、已知 token `459,104`，6 条 aggregate findings；AC-19/20 的两条是同一评测证据缺口，不是两个独立代码问题。
- [x] 处理真实代码 finding：快照复用现在只允许 `tasks.md` 执行状态区写回；spec、decision-log、plan 或 tasks 其他语义变化都会让旧测试/review 失效。
- [x] 当前针对该修复的回归 `55/55 passed`；`npm run check`、skill closure、`git diff --check` 通过。
- [x] 明确边界：最后一次 provider review 发生在快照复用修复前，因此它是修复前审查；修复后有确定性回归，但没有新增 provider 重跑。
- [ ] AC-19/20 的真实九面 baseline/candidate、public runtime live probe、逐 AC 独立证据和人工确认仍需补齐；这些是验收事实缺口，不是 80 分问题。
- [ ] 当前仍保持 `incomplete`；不因报告分数、不因 finding 数量，也不因本地测试绿灯 close。

## 当前 T022 评分口径、全量对比与修复后复审（append-only，2026-08-15）

### 先回答“是不是低于 80 分所以一直优化”

- 不是。当前评测事实明确为 `fixed_quality_80_gate=false`；80 分是历史 ModelTest 报告里的比较阈值，不是 WorkflowHub 生产流程的继续条件，也不是 close 条件。
- 当前没有可发布的总分，也没有全局排名：`wh-review-benchmark-report-v1.2-20260815.json` 的状态是 `inconclusive`，9/9 surface 都是不确定，明确禁止 composite score/global rank。
- 一直没有收口的真正原因是：历史 A/B 没有 gold-clean control 或 paired 不完整；当前快照仍有真实 findings、provider timeout、逐 AC 事实不闭合、例外和人工确认缺失。把这些事实误读成“分数低”会掩盖根因。

### 全部 stage 的可比结果

主文件：`quality/evidence/wh-review-benchmark-readable-comparison-v1.2.json`、`quality/evidence/wh-review-benchmark-comparison-v1.2-20260815.json`。

| surface | 修改前 | 修改后 | 成本变化 | 裁决 |
| --- | --- | --- | --- | --- |
| make-decision.direction | 质量66；召回0.80 | 质量71.8；召回0.895 | token +101.48%；时长 +284.39% | 不确定，召回变好但成本恶化 |
| make-decision.detail | 质量73；召回0.90 | 质量79.58；召回1.00 | token +0.02%；时长 +112.70% | 不确定，召回变好但变慢 |
| build-spec | 质量80；召回1.00 | 质量80；召回1.00 | token -0.01%；时长 +164.19% | 没证明质量提升 |
| build-plan | 无有效 paired | 无有效 paired | token -0.02%；时长 +208.14% | 不能比较 |
| build-code.phase | 无有效 paired | 无有效 paired | 无可靠成本对照 | 不能比较 |
| build-code.integration | 无有效 paired | 无有效 paired | 无可靠成本对照 | 不能比较 |
| verify-code | 无有效 paired | 无有效 paired | 无可靠成本对照 | 不能比较 |
| mini_task.design | 无 baseline | candidate 质量74.86；召回0.944 | candidate 时长约166.96s | 不能比较 |
| mini_task.implementation | 无有效 paired | 无有效 paired | 无可靠成本对照 | 不能比较 |

- 所以不能说“所有 stage 都变好了”。目前只有 direction/detail 的严重问题召回上升有迹象；这两个 surface 的 control 仍不干净，不能升级为正式质量结论。
- build-spec 没有质量提升，反而明显变慢。其余 surface 没有足够对照，不能用绿色测试或单次 finding 数量替代 A/B。

### 当前快照上的真实 build-code 对比

- 修复前正式异源审查：`quality/reviews/attempts/41c249b9-17e0-4a97-9c1a-94608aaa5424/attempt.json`。配置 3 个 provider；1 个完成、2 个 `PROCESS_TIMEOUT`，超时各约 360 秒；完成者约 324.6 秒、已知 usage `259567`；无 fresh retry，只有 1 次同会话修复。聚合得到 3 条有效 minor，另有 2 条因锚点无效而没有进入质量结论，但对应代码根因确实已修复。
- 修复后正式异源审查：`quality/reviews/attempts/ab3b5165-7363-4385-95cb-823d7bcfc163/attempt.json`。3 个 provider 中 2 个完成、1 个 `PROCESS_TIMEOUT`；完成耗时约 250.6 秒和 311.9 秒，超时约 360.7 秒；没有 fresh retry，opencode/v4flash 有 1 次同会话修复，usage `260620`。这不是 3/3 完整覆盖，但满足当前最低 1 个异源 reviewer 的可用条件。
- 修复后有效 finding 只有 1 条 minor：`findings=[]` 时 disposition 错误回退到 `adjudication.clusters`，会让非可行动的 `needs_corroboration/invalid_evidence` 被错误要求处置。4 条 major 因 provider 锚点无效，只保留为 `invalid_evidence` 事实，不能冒充已证实缺陷。
- 修复后 provider 仍报告 provider timeout，说明“重试、等待、失败原因”本身还没有完全解决；但本轮没有因为 finding 数量或 80 分继续无价值重跑同一快照。

### 本轮真实修复与测试

- 修复 review recovery 错误信息可能泄露主机路径；复用审查结果时重写 provider output wrapper，保证新的 attempt provenance 真实；统一 typed AC 编号识别；删除无用 close 变量；mini-task 只对执行状态区写回放宽旧 design/implementation/test snapshot，其余语义变化仍会失效。
- 定向测试：review/材料相关 `74/74`，mini-task delivery `18/18`。
- 全量确定性回归：`npm test` 安全集 `162` 文件、`1596` passed、`1` skipped；exclusive 集 `31` passed、`0` failed，命令 exit `0`。
- `npm run check`、skill closure、`git diff --check` 全部通过。
- 当前官方实现 receipt：`quality/evidence/implementation/8aa3c69358a7de2b709a483c61eec3a3d876969b1e1d5a119a96cd90cfe6f39e.json`；当前测试 receipt：`quality/tests/build-code-current-final-20260815-v3.json`；两者绑定同一 snapshot tree `e1667a864423fa152f3615661bbd419f8c47733f`。

### 当前结论

- 评分标准确实需要修正：不能把单一 80 分当作质量门槛，也不能把不同 control、不完整 paired 和 provider 失败混成一个分数。现在已经改为分别看召回、误报、执行成功、token、时长、coverage、findings validity 和证据完整性。
- 但“评分标准改对”不等于“审查质量已经证明提升”。当前只能证明：修复后确定性测试通过，审查链能继续抓到一个真实 minor；完整异源覆盖、跨 stage 质量提升和低成本目标仍未被证明。
- 不启动 mini-task：本轮是同一主任务的审查可靠性和成本修复，没有新增独立产品需求。
- 任务仍保持 `incomplete`。未完成事实：T010 九面可信 paired A/B、逐 AC 当前事实、完整 finding disposition、例外、人工确认、public runtime live probe；不执行 close、commit、merge、push 或 cleanup。

## 当前 T023 最后一轮根因修复与真实回归（append-only，2026-08-15）

- [x] 修复写边界信任调用方自带 invocation identity/raw 的问题：只接受官方内部令牌或从 canonical TaskHandle 重新读取的记录；补充伪造输入回归。
- [x] 修复 provider 聚合静默丢弃 malformed 非空成员的问题：malformed member 变成 `unavailable` 事实；传输层 `review: null` 仍按 provider 不可用处理；补充回归。
- [x] 修复当前 provider quorum 变化后仍复用旧 review 的问题：复用前重新按当前配置检查 eligible profile 和异源数量；配置了几个 provider 就保留几个 provider，不动态减少；补充回归。
- [x] 修复报告把未观测到的 effort/thinking 写成已观测配置的问题：分别记录 `observed` 和 `configured`；补充回归。
- [x] 修复 integration review 为了携带实际 skill 入口而让 runtime 依赖 skill 路径的问题：改为 skill 包装层传入入口锚点；分层检查、入口检查和 bundle hash 全部同步。
- [x] 修复 mini-task 只校验 schema、不认证 provider attempt/result 链的问题；补充伪造结果回归，20/20 mini-task delivery 测试通过。
- [x] 公开行为真实测试：`npm run probe:public-behavior`，10/10 通过，约 44 秒。
- [x] 最终确定性回归：`npm test`，162 个测试文件、1607 个测试通过、1 个跳过；exclusive 31/31 通过；命令 exit 0。
- [x] `npm run check`、skill closure、五阶段 skill smoke、`git diff --check` 全部通过。
- [x] 本轮没有新增独立产品需求，不启动新的 mini-task；以上改动均属于当前 wh-review 质量/成本主任务。
- [ ] 需要在本轮文档写回后的新 snapshot 上做一次最终异源审查；旧 provider 结果不复用。
- [ ] T010 九面可信 paired A/B、逐 AC 当前事实、完整 finding disposition、例外和人工确认仍是正式验收缺口；它们不是“低于 80 分”。
- [ ] 不执行 close、commit、merge、push 或 cleanup，直到用户明确确认收口。

## 当前 T024 全量回归与收口前事实复核（append-only，2026-08-15）

- [x] 按当前 `/Users/Hugh/.config/workflowhub/config.json` 的 stage/mini-task route 保持配置兑现；没有新增独立产品需求，因此不启动新的 mini-task，也没有可清理的独立 mini-task worktree/lock。
- [x] 当前候选分支全量回归：`npm test` 为 162 个测试文件通过、1632 个测试通过、1 个跳过；独占检查 31/31 通过，命令 exit 0。
- [x] 当前结构与发布检查：`npm run check`、skill closure、五阶段 local skill smoke、`git diff --check` 全部通过。
- [x] 本轮确认的真实修复继续保留：严格 canonical test-output/anchor 路径；质量事实 malformed fail-closed；mini-task `not_applicable` 必须有 reason；integration AC 不再把一个全局 GREEN receipt 冒充所有 AC；policy/quorum 变化不复用旧结果；path-only finding 不接受；CLI 输入错误明确失败。
- [x] 这批修复均属于主任务原范围内的 wh-review 质量、稳定性、成本和收口事实修复；没有把“补充需求”偷偷塞进主任务，也没有用 mini-task 代替正式 stage。
- [ ] 外部 task store 当前仍需用同一新快照重新登记 facts/index、测试事实、最终 integration review 和 verify；现有 `quality/verify.json` 仍绑定旧 snapshot，不能当本轮完成证据。
- [ ] T010 九面可信 paired A/B 仍为 `inconclusive`；历史 80 分不作为继续或 close 门槛。当前可发布结论应分开报告质量、召回、误报、执行成功、token、耗时和 coverage。
- [ ] 当前快照仍需最终异源 integration review、逐 AC 当前事实、finding disposition、exceptions 和 human confirmation；在这些事实完成且用户确认前，保持 `incomplete`，不执行 close、commit、merge、push 或 cleanup。

### 执行状态填写区（追加收口事实，2026-08-16）

- **执行事实**：本轮没有新增产品需求，不启动 mini-task；所有改动仍属于 wh-review 质量、稳定性、成本和 close 事实链。
- **代码修复**：审查材料接收非文本 spec/AC 时现在在 provider 前明确返回 `MATERIAL_INCOMPLETE`，不再把对象静默变成 `[object Object]`；`task-close` 的人工确认校验已合并为一条明确的 verify-code v2 规则。
- **当前确定性测试**：官方 `npm test` 为 162 个测试文件通过、1640 个测试通过、1 个跳过；exclusive 检查 31/31 通过，exit 0；close/安全定向回归 35/35 通过。
- **当前实现收据**：`quality/evidence/implementation/0df8eaf29bfbefe65ff850dd7b2bc02919792b9098e35919369ced24d735a994.json`；当前测试收据 `quality/tests/build-code-current-final-20260816-v12.json`；二者绑定 snapshot tree `60358ff21d03462298b5dc040a5ef9134093e188`。
- **3rd-review 通道**：外部 `3rd-review` 的任意绝对 Unix 路径隔离修复后，完整外仓测试 288/288 通过。
- **最后一次有效 build-code 集成审查**：attempt `97147257-b547-4fc6-be29-aa35eb886dcc` 使用当前原始 Markdown 材料，3 个配置 profile 中 1 个完成、1 个 provider 进程失败、1 个超时；没有 WorkflowHub 重试；唯一有效 finding 是 `core/task-close.mjs` 的重复确认规则，已修复并完成定向回归。该审查发生在最终小修复前，不能冒充当前 snapshot 的新 review。
- **审查失败事实**：前一次 `a199b532-1a6d-4d9c-906f-e6855e1adc37` 使用旧 provider 包对象作为输入，provider 正确发现了 `[object Object]`，但该输入错误来自调用方；现在已加 fail-fast 和回归，不能把它算成产品质量通过或失败。
- **未完成事实**：T010 九面可信 paired A/B、逐 AC 当前事实、完整 finding disposition、exceptions、human confirmation 和正式 close 仍未完成；历史 ModelTest 不因本轮修复自动变成“质量提升已证明”。

## 当前 T025 评分误判与最新定向复核（append-only，2026-08-16）

- [x] 明确回答：之前继续处理不是因为“低于 80 分”。`fixed_quality_80_gate=false`；80 分只是历史 ModelTest 的一条评测阈值，不能作为 WorkflowHub 的继续条件、重试条件或 close 条件。
- [x] 历史九面对比仍只有 `inconclusive`：direction/detail 的召回有上升信号，但 control 不干净且成本明显上升；build-spec 没有质量提升；其余面没有足够 paired A/B。不能把这些结果合成一个总分。
- [x] 复核最后一次真实 build-code integration report `8294a052-14b9-4e2e-a371-66198db34ed0`：3 个配置 profile 中 1 个完成、1 个 `PROVIDER_OUTPUT_INVALID`、1 个 `PROCESS_EXIT_NONZERO`，只有 codex/luna 形成语义结果；3 条 finding 因“只有 path、没有 line”被旧锚点校验错误丢弃。provider 合同本来允许没有可靠行号时使用 path-only packet anchor；这不是 provider 发现质量差，而是 WorkflowHub 丢 findings 的根因。
- [x] 修复该锚点误判：有真实 path 和具体 evidence、但没有可靠 line 的 finding 可以进入审查结论；只有裸 path 或越界 line 才拒绝。新增回归，review-runner `53/53` 通过。
- [x] 修复两个真实审查缺口：build-code integration 只接受完整 `npm test` 收据；mini-task implementation 校验 focused test 的 canonical receipt、output hash、AC 状态和 user-result 字段。review-materials 合同 `18/18` 通过；mini-task 受影响路径 `5/5` 通过；skill closure、`npm run check`、`git diff --check` 全部通过。
- [x] 未启动新的 mini-task：这些都是原主任务范围内的 wh-review 质量、稳定性和成本修复，没有新增产品需求。
- [ ] 最新代码修复后的 provider 复审尚未重跑。原因是它必须先重新生成当前 snapshot 的完整 `npm test` 收据，而用户已明确要求不要反复全量测试；不能把旧 report 冒充新 snapshot 结果，也不能把定向测试冒充 provider 质量证明。
- [ ] 当前仍不能 close：T010 可信 paired A/B、当前逐 AC 事实、finding disposition、例外、人工确认和正式 close 授权仍未完成。这个结论与 80 分无关。

### 执行状态填写区（当前 T026 最终异源复核，2026-08-16）

- **执行事实**：T025 记录“provider 复审尚未重跑”后，已按当前配置在同一候选快照完成一次最终 `build-code/integration` 异源复核；本段只记录执行事实，不改变审查主题。
- **当前快照**：review attempt `quality/reviews/attempts/5abcd8c4-81e2-4206-921c-d52b78f92deb/attempt.json`；report `quality/reviews/reports/5abcd8c4-81e2-4206-921c-d52b78f92deb.md`；result `quality/reviews/results/build-code-default-e9afa186d72e394479ab3ae509c0021733888245-5abcd8c4-81e2-4206-921c-d52b78f92deb.json`；review snapshot tree `e9afa186d72e394479ab3ae509c0021733888245`。
- **provider 终态**：配置的 3 个 profile 全部按配置调用，没有 WorkflowHub retry；`opencode/coding` `PROCESS_EXIT_NONZERO`、2615ms；`opencode/v4flash` completed、347648ms、usage total `194381`、同 session repair `1`；`codex/luna` completed、353017ms、usage unavailable；2/3 provider 有语义结果，aggregate `available` 但 group outcome `partial`。
- **当前 finding**：8 条 aggregate findings：5 条有证据的 serious finding、3 条 minor；`invalid_anchor=0`。主要可行动问题是：integration 历史任务卡解析缺口会硬阻断审查；GREEN 绑定仍有非 canonical 记录筛选风险；serious finding 聚合层未再次强制校验 `evidence_kind/evidence`；另有 task-close/mini-task 快照复用边界和 usage/payload 重复等待人工逐条裁决。provider 发现不等于自动修复，也不等于质量分数。
- **与上一轮对比**：上一轮 `8294a052-14b9-4e2e-a371-66198db34ed0` 只有 1 个 provider 形成语义结果，3 条 path-only finding 被错误丢弃；本轮 2 个 provider 形成语义结果，8 条 finding 全部保留，说明 finding 保真度和审查可用性提高，但 provider 稳定性仍未达到 3/3。
- **当前全量测试事实**：只为这次当前快照复核执行过一遍官方 `npm test`；receipt `quality/tests/build-code-current-review-20260816-v18.json`，exit 0，162 个测试文件、1640 个测试通过、1 个跳过，耗时约 284.4 秒；实现 receipt 为 `quality/evidence/implementation/c9c338d4edad5d10509ecfe6f65a360568d9fc30ba83f6ca79134266d40f0c33.json`。此后不因分数或 finding 数量重复全量测试。
- **快照复用说明**：本段位于“执行状态填写区”，只写回审查事实；它不改变代码、spec、plan 或任务语义，因此不应触发新的 provider review 或 `npm test`。这正是本任务要修复的“写回结果导致重复审查”边界。
- **mini-task**：没有新增需求，没有启动新的 mini-task；本任务范围内没有待清理的 mini-task worktree/lock。
- **未完成事实**：T010 可信 paired A/B、逐 AC 当前事实、完整 finding disposition、exceptions、human confirmation 和正式 close 授权仍未完成；不把当前 partial provider review 或确定性测试写成 close。

### 执行状态填写区（当前 T027 根因修复定向回归，2026-08-16）

- **本轮根因修复**：历史任务卡缺失 Trace/evidence 不再硬阻断当前 integration 语义审查；GREEN 只接受 canonical `build-code-test-capture` 的完整 `npm test` receipt；serious finding 必须同时有 `root_cause`、`evidence_kind` 和 `evidence`；provider-facing integration spec 不再重复塞入 acceptance 内容；v3 usage 做结构校验；补齐 wh-review bundle hash。
- **定向测试**：受影响的 7 个测试文件全部通过，`120/120`；只跑了受影响范围，没有重跑官方全量测试。
- **结构检查**：skill bundle 文件哈希扫描通过，`node runtime/evidence/check-skill-closure.mjs .` 返回 `skill closure: ok`；`git diff --check` 通过。
- **当前审查状态**：T026 的 provider review 发生在本轮语义代码修复前，不能冒充修复后的新审查；本轮没有因分数、finding 数量或 execution-only 写回重复 provider review，也没有新增 `npm test`。
- **mini-task**：本轮仍没有新增产品需求，不启动 mini-task，也没有待清理的 mini-task worktree/lock。
- **未完成事实**：T010 九面可信 paired A/B、修复后当前 snapshot 的 provider 质量复审、逐 AC 当前事实、完整 finding disposition、exceptions、human confirmation 和正式 close 授权仍未完成；不把 `120/120` 定向测试或 T026 partial review 写成质量提升已证实或 close。

### 执行状态填写区（当前 T028 配置身份可观测性修复，2026-08-16）

- **根因修复**：v3 公共结果不直接回报 effort/thinking；报告不再把它们写成“已观测”，而是当 provider attempt 带有 broker `config_id` 时写成 `BROKER_CONFIG_ATTESTED (configured=...)`，没有身份时仍写 `UNAVAILABLE`。
- **失败边界**：当 v3 审查配置了 effort/thinking，但结果没有 broker 配置身份，`PROFILE_MISMATCH`，审查保持 `unavailable`；不靠猜测继续聚合，也不在 WorkflowHub 重复实现 broker 的 config hash。
- **定向测试**：`review-provider-client-v3`、`review-runner`、`canonical-review-result` 三个测试文件通过，`83/83`；skill closure 返回 `skill closure: ok`；`git diff --check` 通过。
- **成本边界**：本轮只跑受影响测试，没有重复官方 `npm test`，没有因为 80 分、finding 数量或执行状态写回触发 provider 重审。
- **mini-task**：没有新增产品需求，不启动 mini-task，也没有待清理的 mini-task worktree/lock。
- **当前限制**：这项修复提高了配置事实的可解释性和 fail-closed 稳定性，但没有把历史 ModelTest 的 `inconclusive` 变成质量提升证明；T010 paired A/B、当前逐 AC 事实、finding disposition、exceptions、human confirmation、修复后当前 snapshot provider review 和正式 close 授权仍未完成。

### 执行状态填写区（当前 T029 语义审查与测试回执解耦修复，2026-08-16）

- **根因**：build-code integration 在 provider 调用前把当前测试回执、实现回执和 AC 证据当成硬门槛；回执缺失或过期时，语义审查根本不执行，审查质量问题和证据治理问题被混在一起，容易造成“失败 → 重试/补材料 → 再审查”的时间和 token 浪费。
- **代码修复**：最终实现快照仍由宿主生成；implementation/GREEN 回执改为“有则严格校验、缺则记录 `unavailable` audit gap”。缺测试回执时，材料包写入明确的 `test-summary.status=unavailable`，不伪造 GREEN；AC trace 没有实现回执时允许 `evidence_status=unavailable`，但仍保留 AC、变化说明和最终实现锚点。provider 只看行为需求、实现上下文和测试结果状态，不读取 AC 台账、receipt/hash 或快照治理材料。
- **close 边界**：缺测试、逐 AC、finding 处置、例外、人工确认等事实时，正式状态仍是 `incomplete/unavailable`；这次解耦只允许继续发现真实交付缺陷，不降低完成标准，也不把缺事实变成通过。
- **T010/P5 复用边界**：纯 `tasks.md`“执行状态填写区”写回继续复用旧 semantic review；真正代码、需求、计划、AC 或审查合同变化仍使 semantic hash 变化并需要新的审查。没有因这次文档写回重复 provider 或官方全量测试。
- **定向测试**：集成 subject、材料合同 3 个文件 `39/39`；review-runner、v3 provider、canonical result、simple-contracts 4 个文件 `99/99`；合计 `138/138`；skill closure `ok`；`git diff --check` 通过。没有重跑官方 `npm test`，没有启动新的 mini-task。
- **当前未完成**：本轮没有重新调用 provider，因此不能把这次修复写成当前 snapshot 的异源质量提升证明；T010 九面 paired A/B、逐 AC 当前事实、finding disposition、exceptions、human confirmation、最终当前 snapshot provider review 和正式 close 授权仍保持 `incomplete`。

## T030 评分问题核查与全量审查对比（2026-08-16）

- [x] 核对评测规则：`fixed_quality_80_gate=false`；不再用 80 分作为继续、重试或 close 条件。
- [x] 整理九个审查面 A/B：只有 direction/detail 有召回上升信号；build-spec 没有质量提升；其余面没有有效 paired，整体保持 `inconclusive`。
- [x] 整理实际 build-code 审查报告：区分调用方材料错误、provider 失败、无效锚点和真实 finding；不把失败或空结果算成通过。
- [x] 写回 `decision-log.md`：记录全 stage 数字、build-code 各轮 finding、原始报告路径、成本和证据边界。
- [x] 完成 T030 相关代码修复并回归：未知 producer、删除文件、材料版本、mini-task AC trace 四类边界已收紧。
- [x] 定向验证：mini-task `29/29`、vNext close `22/22`、review/material contracts `26/26`、语法检查和 `git diff --check` 通过。
- [ ] 修复后当前 snapshot 的 provider review 尚未重跑；不把 `11299...` 修复前报告冒充新结果。
- [ ] T010 可信 paired A/B、逐 AC 当前事实、finding disposition、exceptions、human confirmation 和正式 close 授权仍未完成。

## T031 当前快照最终复核与交付前状态（2026-08-16）

- [x] 修正 provider 上下文上限：从 17 个实现/审查链上下文收窄到最多 9 个交付关键片段；host 仍保留完整认证锚点，材料审查不再把 transport、receipt、snapshot 治理细节大包发送给 provider。
- [x] 保留 `runtime/task/git-worktree-snapshot.mjs` 作为 provider 上下文，明确“完全相同或仅执行状态区变化”才允许复用旧 semantic review；需求、代码、计划、AC 或合同变化仍必须重新审查。
- [x] 收紧 `human-confirmation.v2`：正式验收要求 `subject_ref` 非空且和当前 subject 精确绑定；补充缺失、错绑、正确绑定三种回归。
- [x] 定向验证通过：mini-task `29/29`；review-materials `21/21`；confirmation、freshness、vNext close `32/32`；语法检查、`git diff --check` 通过。没有重跑官方全量测试。
- [x] 按当前 config 的 3 个 provider 做最后一次真实 build-code/integration review；没有 WorkflowHub retry。
- [x] 记录最后一次 provider 事实：attempt `9f4592ed-e9e6-4be3-8711-286c933b5710`，3 路均失败（`PROCESS_EXIT_NONZERO`、`PROVIDER_OUTPUT_INVALID`、`PROCESS_TIMEOUT`），0/1 valid reviewer，`GROUP_OUTCOME_UNAVAILABLE`，没有 semantic findings。不能把它写成通过或质量分。
- [x] 记录上一轮部分有效 review：attempt `7a4b7b9a-d991-4c86-94c7-7956a0ba5ce5`；1/3 provider 有效，2 条 finding 中 1 条真实人工确认绑定缺陷已修复，1 条是因上下文不足产生的快照复用误判，已通过补充窄 helper 上下文消除误判来源。
- [ ] 不再为同一 snapshot 继续 provider 重试；当前异源质量仍是 `unavailable`，正式 close 仍缺当前逐 AC、finding disposition、exceptions、人工确认和授权事实。
- [ ] 不执行 close、commit、merge、push、archive 或 cleanup，等待用户看完对比并明确指令。

### 执行状态填写区（当前 T032 语义复用真实回归，2026-08-16）

- **回归命令**：`npx vitest run skills/wh-review/scripts/__tests__/review-semantic-projection.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`。
- **结果**：2 个测试文件、`59/59` 通过；其中真实 snapshot fixture 证明 `tasks.md` 执行状态写回会复用旧结果且不调用 provider，同时代码/行为变化仍会触发新审查。
- **结论**：T010/P5 的重复审查根因已有确定性回归覆盖；本轮没有 provider 重试，也没有重跑官方全量测试。该段只写执行事实，不改变需求、实现或审查语义。
- **未完成事实**：修复后当前 snapshot 没有新的 provider 语义结果；T010 paired A/B、逐 AC 当前事实、finding disposition、exceptions、人工确认和正式 close 授权仍保持 `incomplete`。

### 执行状态填写区（当前 T033 材料版本绑定，2026-08-16）

- **事实**：重新计算当前 `spec.md` 与 `plan.md` 的 SHA-256，并把 `tasks.md` 顶部的 Spec hash、Plan hash 更新为当前文件值；旧值不再作为当前材料身份。
- **范围**：这是同一主任务的材料身份修复，不是新增产品需求；不启动 mini-task。
- **影响**：此前 review/test/verify 事实不因这次更新自动变成当前事实；最终验收必须重新绑定当前快照，不能复用旧快照结论。

### 执行状态填写区（当前 T034 正式快照验收，2026-08-16）

- **当前快照**：`head=a675a53b689c09ec954e7bc8c85f052288c6ab27`，`tree=8fe5fd3a4eb1473c04a920e8d17075fda451588e`。
- **正式命令**：通过公共 `verify --action=execute --stage=verify-code` 捕获 `npm test`；不能把私有 `capture-tests` 当公共流程。
- **canonical 测试收据**：`quality/tests/verify-code-final-close-20260816-v2.json`，`exit_code=0`，输出 `quality/tests/output/verify-code-final-close-20260816-v2.output`；receipt hash `3754f2500a0084efb9a4c35cc1312375c791ed445caa0e73d6cbe85be95ace12`。
- **测试结果**：safe 组 `162` 个测试文件、`1666` 个测试通过、`1` 个跳过；exclusive 组 `2` 个测试文件、`31` 个测试通过；两组均 exit `0`。
- **本轮修复**：阶段人工确认在没有 provider attempt 绑定时不再被 freshness 错判为过期；补齐集成审查 fixture 的 canonical implementation/test receipt；同步 wh-review、mini-task 的 bundle hash 和 catalog hash。
- **历史失败事实**：修复前当前树的 `npm run test:safe` 为 `6` 个文件失败、`16` 个断言失败；失败收据已保留，不能覆盖成通过。修复后正式 `npm test` 已重新执行并通过。
- **范围**：以上都是同一主任务的质量、稳定性和证据链修复，不新增需求，不启动 mini-task；当前 provider 异源复核、逐 AC 事实、finding 处置、例外、人工确认和正式 close 仍需按后续步骤完成。

### 执行状态填写区（当前 T035 verify-code 最终异源审查与收口前复核，2026-08-16）

- **当前快照**：最终 verify-code 审查绑定 `snapshot_tree=e77b481ec3c9ab0c22ca4854eb7f1c551e8898fc`；当前候选 HEAD 仍为 `a675a53b689c09ec954e7bc8c85f052288c6ab27`。本段只写回执行事实，不改变需求、实现或审查语义。
- **异源审查**：按 `/Users/Hugh/.config/workflowhub/config.json` 实际配置调用 `opencode/v4flash` 和 `codex/luna` 两路；2/2 返回有效语义结果，aggregate `available`，没有 WorkflowHub retry、timeout 或 malformed output。`opencode/v4flash` 用时约 159 秒、usage total `30667`；`codex/luna` 用时约 160 秒、usage `unavailable`，保留为 unavailable 事实，不猜测数值。
- **审查记录**：attempt `quality/reviews/attempts/775e427b-5bc2-419b-ae61-87a81259f58c/attempt.json`；result `quality/reviews/results/verify-code-default-e77b481ec3c9ab0c22ca4854eb7f1c551e8898fc-775e427b-5bc2-419b-ae61-87a81259f58c.json`；report `quality/reviews/reports/775e427b-5bc2-419b-ae61-87a81259f58c.md`。
- **审查发现**：共 10 条 provider-level findings，其中两路重复指出 32 条 AC 没有逐条当前验收事实；其余主要缺口是成员级混合 adapter/SAME_SOURCE/部分成功行为、语义新鲜度四象限、当前候选绑定的 ModelTest paired A/B、目标 main 重叠改动的合并安全、finding 处置/例外/人工确认/close 授权。另有一条 minor：`exclusive_tests` 未列具体文件名。
- **事实判断**：这些 finding 都有有效证据锚点；不能把 `npm test` 绿灯、provider 没发现代码问题或历史空 findings 当作逐 AC 通过。当前没有为严重 finding 写 `accepted_risk`，也没有伪造处置、例外或人工确认。
- **定向回归**：以下 5 个文件共 `31/31` 通过：`skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs`、`skills/wh-review/scripts/__tests__/review-semantic-projection.test.mjs`、`tests/integration/review-test-close-freshness-matrix.test.mjs`、`tests/integration/wh-review-v3-broker-contract.test.mjs`、`tests/integration/execution-snapshot-isolation.test.mjs`。这证明相关行为回归通过，但不替代正式 stage facts。
- **全量测试**：当前正式 `verify-code` 测试收据仍是 `quality/tests/verify-code-final-close-20260816-v2.json`，exit 0；safe `162` 个文件、`1666` passed、`1` skipped；exclusive `2` 个文件、`31` passed。具体 exclusive 文件为 `core/__tests__/check-extensibility.test.mjs` 和 `core/__tests__/check-anti-host.test.mjs`。本轮没有再次跑全量测试。
- **ModelTest**：历史九面比较仍是 `inconclusive`；direction/detail 只有召回上升信号，build-spec 没证明质量提升，其余面没有有效 paired。子代理核对确认当前 ModelTest 可用 bundle 只有 7 个 surface、绑定的 v0.2 bundle 仍是 `blocked`，历史 execution 绑定旧 WorkflowHub `7706fa6`，不是当前候选。最近一次 10-leg readback 约 47.4 分钟、`1302492` tokens，5 个 stage 中 4 个 comparison incomplete；因此当前不运行昂贵评测，缺口记录为 `no_current_candidate_binding`、`surface_count_mismatch(7!=9)`、`subject_not_accepted_or_unbound`、`paired_baseline_missing`，不把缺失写成通过。
- **公开状态**：`stage-runtime status --action=begin --stage=verify-code` 仍为 `quality_status=in_progress`，缺少 `full_tests_fresh`、`independent_review`、`finding_dispositions`、`acceptance_criteria`、`exceptions`、`human_confirmation` 六类正式质量事实；现有 `quality/verify.json` 仍是旧快照的 `incomplete`，不能手工覆盖。
- **Git/mini-task**：没有新增产品需求，不启动 mini-task，也没有待清理的 mini-task worktree/lock。候选分支与目标 `/Users/Hugh/Hugh/Project/workflowhub` 的 dirty main 存在 20 个重叠文件；未执行 commit、merge、push、archive 或 cleanup，避免覆盖用户未提交改动。
- **本轮边界**：不再为同一快照重复 provider 审查；后续只有在正式 Stage Agent 产出当前 `stage_outcomes`、逐 AC/处置/例外/人工确认事实齐全并通过公开入口后，才重新检查 close。当前任务保持 `incomplete`。

### 执行状态填写区（当前 T036 verify-code 缺失事实与 false-green 根因修复，2026-08-16）

- **正式入口结果**：按配置指定的 task store `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/wh-review-adversarial-quality-cost-redesign`，通过公共 `stage-runtime run --action=execute --stage=verify-code` 记录当前 Stage Agent 结果；Stage Agent execution object 没有提供，因此如实记录为 `unavailable`，不能当作 verify-code 或 close 通过。
- **当前 stage 状态**：公共入口返回 `status=in_progress`、`quality_status=incomplete`；六类正式事实仍全部缺失：`full_tests_fresh`、`independent_review`、`finding_dispositions`、`acceptance_criteria`、`exceptions`、`human_confirmation`。当前没有执行 close、commit、merge、push、archive 或 cleanup。
- **新发现的根因**：verify-code 的“没有测试/证据输入”分支把 `finding_dispositions` 写成 `not_applicable`，下游会把它误算成已完成，形成 false-green。修复后改为 `missing`；没有处置事实就保持缺失，不能靠“无 finding”或“无需处置”代替。
- **定向回归**：新增 verify-code 缺失 finding disposition 回归；`npx vitest run tests/integration/vnext-official-stage-run.test.mjs --reporter=verbose` 通过，1 个文件、`14/14`，exit 0。该回归证明缺事实不会再被标成 passed。
- **当前 Stage Agent 记录**：最新 outcome `quality/evidence/stage-outcomes/verify-code/b743dc9eb09772aaddf0218f34663dcaa0c0452229211d371c5710332dfcd4a4.json`，11 个步骤和 2 个技能均为 `unavailable`；没有伪造完成步骤、审查结果或成本数据。
- **审查与测试边界**：T035 的 provider review 和全量测试收据发生在本轮代码修复前，现只能作为历史事实，不能冒充当前快照证明；本轮没有再次调用 provider，也没有再次跑官方全量测试，避免同一问题重复消耗时间和 token。
- **路径纠正事实**：第一次桥接误用了未被配置选中的旧路径 `/Users/Hugh/Knowledge`，本轮生成的 16 个错误位置记录已删除；之后只在配置指定的 `/Users/Hugh/Hugh/Knowledge` 重做并保留正确的 unavailable 事实。
- **仍未完成**：真实 Stage Agent 执行、当前逐 AC 验收、完整 finding 处置、例外、人工确认、ModelTest 当前候选 paired A/B 和正式 close 授权仍未完成；不启动 mini-task，不把本轮定向回归写成产品质量已证明。

### 执行状态填写区（当前 T037 外部 Stage Agent 宿主诊断，2026-08-16）

- **诊断动作**：按 WorkflowHub 宿主协议检查了 Multica runtime、daemon 和当前本地 Stage Agent 接入；没有调用 `runtime restart`、`daemon restart`、登录、改配置或创建新任务。
- **当前事实**：`multica runtime list --output json` 无法连接 `http://localhost:18844`；`multica daemon status` 返回 `stopped`。daemon 日志显示当前 token 被服务端拒绝（`401 invalid token`），因此本机没有可用的真实 Stage Agent 执行通道。
- **边界判断**：WorkflowHub runtime 只接收外部 Stage Agent 已完成的 execution object，不会自己启动 Stage Agent；测试 fixture、当前 Codex 子代理和已有 provider review 都不能替代真实 Stage Agent provenance。
- **本轮结果**：没有生成假的 Stage Agent outcome，没有重跑 provider 或官方全量测试；当前状态继续保持 `incomplete`，等待外部宿主恢复后在同一候选快照执行 `verify-code`。

### 执行状态填写区（当前 T038 纠正 Multica 关联判断，2026-08-16）

- **纠正**：T037 只诊断了一个可选外部宿主的本地故障，不能据此说 WorkflowHub 或 `wh-review` 依赖 Multica。此前把 Multica 说成当前任务的必要通道，是判断错误。
- **当前证据**：候选仓库的 host-independence 回归 `2/2` 通过；`/Users/Hugh/.config/workflowhub/config.json` 没有 Multica 绑定；`workflowhub-multica-sync` 是独立技能，`used_by_stages: []`，不会进入 `wh-review` 执行闭包。
- **真实依赖**：`wh-review` 生产路径依赖 `3rd-review` broker；正式 Stage Agent 事实只要求任意符合合同的外部宿主提供真实 execution object，不要求 Multica。
- **处理边界**：本任务的审查质量修复不等待、不修复、不重启 Multica；Multica 诊断只保留为历史外部宿主事实，不作为当前 wh-review 质量或 close 的必要条件。未修改代码，未重跑 provider 或全量测试。

### 执行状态填写区（当前 T039 当前快照全量测试与 verify-code 异源复核，2026-08-16）

- **当前快照**：候选 HEAD `a675a53b689c09ec954e7bc8c85f052288c6ab27`；`snapshot_tree=1c3cf8f13f546a31bf4fb3ed1a9d3e8c8154210d`；`snapshot_commit=bf4349881c3a7101d1b5561f2e5580e3bcdf996e`；`source_digest=b0ab8358eaece7d024255d3d32972d5d09c61dafef58e7f42bfd43cec6f9f7c3`。
- **当前全量测试**：通过公共 `verify --action=execute --stage=verify-code` 捕获 `npm test`；receipt `quality/tests/verify-code-current-20260816-v19.json`，exit `0`，receipt hash `a540cf315c1b5595db4885c4d655bfb861e0030ea77d191a4313358ae1e47270`，output hash `9ced6a0f16a70ed8c5d71a1b9f3a183a63e9bb78ed5ff559b0f92de6227ee03`；safe `162` 个测试文件、`1667` passed、`1` skipped；exclusive `2` 个测试文件、`31` passed。
- **当前异源审查**：按当前 config 的 `verify-code` 两个 profile `opencode/v4flash`、`codex/luna` 各执行一次；attempt `quality/reviews/attempts/e58b4be1-1c42-45ee-9bf5-9031de014c5b/attempt.json`；result `quality/reviews/results/verify-code-default-1c3cf8f13f546a31bf4fb3ed1a9d3e8c8154210d-e58b4be1-1c42-45ee-9bf5-9031de014c5b.json`；report `quality/reviews/reports/e58b4be1-1c42-45ee-9bf5-9031de014c5b.md`；2/2 completed，broker group `completed`，无 WorkflowHub retry、timeout、invalid output 或 provider failure，`snapshot_tree` 与当前测试一致。
- **provider 成本事实**：`opencode/v4flash` 用时 `120418 ms`、usage total `24943`；`codex/luna` 用时 `154106 ms`、usage `unavailable`，保留 null，不猜测；两路 runtime_id 相同但 provider/source_id、adapter 和配置身份不同，未发生 SAME_SOURCE 排除。
- **当前 findings**：aggregate 保留 `7` 条：`1` blocking、`5` major、`1` minor，`invalid_anchor=0`。两路主要重复指出当前逐 AC 事实、finding disposition、exceptions、human confirmation 缺失；另指出 ModelTest 九面 paired A/B 仍为 `inconclusive`，以及候选与 dirty main 的合并安全未裁决。没有新的代码实现 finding；这些 finding 尚未处置，不能写成 passed 或 accepted_risk。
- **当前公开状态**：重新执行 `stage-runtime status --action=begin --stage=verify-code` 仍为 `quality_status=in_progress`，六项 `full_tests_fresh`、`independent_review`、`finding_dispositions`、`acceptance_criteria`、`exceptions`、`human_confirmation` 仍显示 missing。原因是正式 Stage Agent 当前 execution object 不可用，且逐 AC/处置/例外/人工确认不能由测试或 provider 空 findings 代替。
- **本轮边界**：没有代码修复，没有启动 mini-task，没有重试 provider，没有运行 ModelTest，没有执行 close、commit、merge、push、archive 或 cleanup；临时测试输入已删除。现在停在正式 close 之前，等待真实 Stage Agent/逐 AC事实和人工确认，不伪造任何缺口为通过。

### 执行状态填写区（当前 T040 三仓候选固化与九面评测资产核对，2026-08-16）

- **3rd-review 候选**：候选分支 `codex/3rd-review-wh-review-adversarial-quality-cost-redesign` 已提交 `a8d7a82`；受影响测试 `120/120` 通过，语法检查和 `git diff --check` 通过。
- **ModelTest 候选**：候选分支 `codex/workflowhub-wh-review-adversarial-quality-cost-redesign` 已提交 `ad920f9`；新增 wh-review benchmark 测试 `31/31` 通过，九面资产校验通过，包含 9 个 surface、45 个 mutation、独立 gold-clean acceptance 引用。
- **评测计划**：使用当前候选三仓、当前配置生成 `1260` 条 paired plan，`provider_calls=0`；只完成计划和资产校验，没有把 plan-only 当成质量结果，也没有启动昂贵的全量 live A/B。
- **范围判断**：这是原需求中的 ModelTest 评测资产补齐，不是新增产品需求；没有启动 mini-task，也没有生成待清理的 mini-task worktree/lock。
- **当前仍未完成**：候选 WorkflowHub 尚未安全合并 dirty `main`；九面 live paired A/B 仍无结果；当前 verify-code 的真实 Stage Agent execution、逐 AC、finding disposition、exceptions 和人工确认仍未闭合；没有执行最终 close。

### 执行状态填写区（当前 T041 候选合并与针对性回归，2026-08-16）

- **合并事实**：候选分支已把 `main` 当前提交 `ece89717` 合并，唯一冲突 `core/task-close.mjs` 已按新快照规则解析为 `captureExecutionSnapshot(worktree)`；合并提交为 `415344ed`。候选工作树当前 clean。
- **回归事实**：受合并影响的 6 个测试文件共 `107/107` 通过，包含官方 component receipt、official stage run、delivery close、execution snapshot isolation、canonical review result 和 invocation identity；`git diff --check` 通过。
- **目标 main 边界**：`/Users/Hugh/Hugh/Project/workflowhub` 仍有用户未提交的 27 个 tracked 文件和 2 个 untracked 路径；本轮没有覆盖、提交、stash、合并回写或删除这些改动。
- **三仓候选边界**：3rd-review 候选 `a8d7a82`、ModelTest 候选 `ad920f9` 均已提交且候选工作树 clean；目标 main 的未提交改动仍只读保留，未擅自合并覆盖。
- **当前仍未完成**：九面 live paired A/B 仍只有 plan-only、没有质量结果；当前 verify-code 的真实 Stage Agent execution、逐 AC、finding disposition、exceptions 和人工确认仍未闭合；不执行最终 close。

### 执行状态填写区（当前 T042 材料上限、去重与 false-green 修复，2026-08-16）

- **实现修复**：provider 材料改为全局内容 hash 去重；required 材料优先，alias 只写入 `packet-plan.json` 诊断；`review-instructions.md` 固定保留，不参与语义材料去重。
- **超限边界**：所有 review surface 统一检查 330 KiB；超限返回 `MATERIAL_TOO_LARGE`，runner 记录 `unavailable`，provider 调用数为 0，不静默截断。默认 Phase diff 保留实现和测试源码，非语义材料才可摘要。
- **状态修复**：当前 review 不可用时，finding disposition 写 `missing`，不再写 `not_applicable`；新增 build-spec 和 verify-code 回归，防止 false-green。
- **定向验证**：review-runner 58 个、review-materials contract 22 个、official stage run 15 个，共 `95/95` 通过；skill closure、语法检查、`git diff --check` 通过。
- **长耗时事实**：官方 verify 测试捕获尝试约 5 分钟无输出后中止，没有新测试收据。根因诊断为锁内 `spawnSync` 无命令级超时、管道吞输出，`npm test` 还串行执行两组测试；本轮记录事实，未盲目重跑。
- **当前状态**：public status 仍显示六类正式质量事实 missing：`full_tests_fresh`、`independent_review`、`finding_dispositions`、`acceptance_criteria`、`exceptions`、`human_confirmation`。九面 live paired A/B 仍未完成。
- **边界**：本轮没有新增需求，不启动 mini-task；修复尚未提交；不执行 close、push、archive、cleanup，继续停在最终 close 前。

### T043 Phase Card：测试捕获的有界终止（2026-08-16）

- **目标**：修复测试命令在执行锁内无限等待、无进度且无法区分 timeout 的问题；超时必须留下失败事实，不能写成通过。
- **允许文件**：`runtime/task/workspace-runner.mjs`、`runtime/evidence/canonical-receipt-writer.mjs`、`tests/official-component-receipts.test.mjs`、本任务 `tasks.md`/`decision-log.md` 执行事实区。
- **覆盖范围**：FR-EXEC-004..006、FR-GOV-001、AC-08、AC-12、AC-13；重点是 test capture 的 timeout、退出状态、输出和锁释放。
- **非目标**：不改 3rd-review provider 生命周期、不新增 retry、不改 reviewer 数量、不改 public runtime 状态机、不跑全量 `npm test`。
- **测试路线**：原预判为 `feature`；按实际改动重判为 `fullstack`，因为它修改共享进程执行边界和测试锁的并发终止行为。先用短命令制造 RED，再用官方 receipt writer 绿回归，覆盖成功、非零退出和 timeout 三类终态。
- **预期证据**：定向 `tests/official-component-receipts.test.mjs`；exit 0；timeout receipt 明确为失败/超时，且不影响后续锁获取。
- **停止条件**：若需要新增配置中心、改 public schema、改 provider owner 或无法安全终止子进程，则停止并回到 make-decision/plan，不扩大本 Phase。

#### T043 执行事实

- **RED**：新增 timeout 回归在旧实现上失败；实际 `exit_code=0`，没有 timeout 事实。
- **GREEN**：改为 `spawnSync` 有界终止后，官方 receipt 回归 `42/42` 通过；public behavior baseline `10` 通过、`1` 跳过。timeout 后的下一条 `true` 命令成功，证明记录锁已释放。
- **实现结果**：默认测试预算 `600000ms`，最大允许 `900000ms`；timeout 记录 `exit_code=124`、`execution.status=timed_out`、`TEST_CAPTURE_TIMEOUT`，不重试、不写 pass。
- **范围限制**：没有跑全量 `npm test`；没有调用 provider；当前六项正式质量事实、ModelTest 当前 paired A/B 和正式 close 仍未完成。

#### T043 当前快照异源复核与修复事实

- [x] 当前 build-code integration review 使用配置的 3 个 profile：`opencode/coding`、`opencode/v4flash`、`codex/luna`；attempt `quality/reviews/attempts/a1a0f56d-7b20-4369-b3dc-0ca203e08908/attempt.json`，snapshot `4af965016f56681d1286d29f98472501d115c8b0`。
- [x] provider 终态如实保留：`codex/luna` 有 semantic 结果；`opencode/coding` `PROCESS_EXIT_NONZERO`；`opencode/v4flash` `PUBLIC_RESULT_INVALID`；broker group `partial`，没有 WorkflowHub 重试。
- [x] 真实 finding 指出空 review/非终态/缺少结果值时可能误写 `not_applicable`；虽然最终聚合因锚点无效没有采纳为 clean finding，但根因成立，已修复 `findingDispositions`：缺失审查统一写 `missing`，只有有效当前空 findings 才写 `not_applicable`。
- [x] 修复后定向回归：official stage run `15/15`；stage completion 与 contract 合计 `60/60`；T043 receipt `42/42`，public baseline `10` 通过、`1` 跳过；语法检查和 `git diff --check` 通过。
- [x] 修复后的当前 snapshot 已执行一次 focused build-code review；结果为 `GROUP_OUTCOME_UNAVAILABLE`，之后不因同一 finding、分数或记录性写回继续重试。正式 verify-code 的 full test、逐 AC、finding disposition、exceptions、human confirmation 和 close 仍未完成。

#### T043 收口前复核补充（2026-08-16）

- 当前 WorkflowHub 候选定向回归用正确的 Vitest 入口执行，5 个受影响文件共 `143/143` 通过；第一次直接用 `node --test` 触发的是 Vitest 启动方式错误，不计为产品测试失败。
- 3rd-review 候选 `a8d7a82` 定向协议/恢复测试 `118/118` 通过；ModelTest 候选 `ad920f9` 九面资产与评分测试 `31/31` 通过；两者工作树均 clean。
- ModelTest 仍只有评测资产和 plan，当前候选没有合法的九面 paired A/B 质量结果；不把资产测试或 plan-only 当成质量提升。
- task store 中发现的 `test-capture.execution.lock` 属于已死亡进程 `46549` 的陈旧锁，已通过正式 record-lock 机制回收并释放；当前 locks 目录为空。
- 没有新增需求，不启动 mini-task；没有执行 commit、merge、push、archive、cleanup 或最终 close。

#### T043 最终执行事实

- [x] 测试 timeout 使用独立进程组；后台子进程不会在 timeout 返回后继续写入 worktree。
- [x] 输出超过 50 MiB 时记录 `output_limit_exceeded` / `TEST_OUTPUT_OVERFLOW`，不再归类成模糊的普通退出失败。
- [x] 连续原始需求 H2 分段完整保留；回归覆盖索引表和原始需求正文分离的当前格式。
- [x] 定向回归：official receipts `44/44`、wh-review runner `59/59`、review-materials contract `22/22`、official stage run `15/15`、stage completion/contract `60/60`、WorkspaceRunner `3/3`；语法检查和 `git diff --check` 通过。
- [x] 最终当前 build-code review 已按配置提交三个 profile，但结果为 `GROUP_OUTCOME_UNAVAILABLE`：`opencode/coding` `PROCESS_EXIT_NONZERO`，`opencode/v4flash` `PROVIDER_OUTPUT_INVALID`，`codex/luna` `PROCESS_TIMEOUT`；`0/1` 个有效 reviewer，无 semantic findings。
- [ ] 当前 verify-code 的 full test、独立审查、逐 AC、finding 处置、例外和人工确认仍缺失；不把本次 unavailable 写成通过，不再重复本次同 surface 审查。

#### T044 provider 故障根因修复事实

- [x] 3rd-review OpenCode 每个 runtime/profile 使用独立 0700 `XDG_DATA_HOME`；同一 continuation 复用，不同 profile 隔离，避免全局 OpenCode SQLite 锁互相影响。
- [x] `403 usage/quota/billing/credit` 归类为 `RATE_LIMITED`；invalid API key 仍归类为 `AUTHENTICATION_FAILED`，不把所有 403 混为一类。
- [x] 3rd-review 候选相关定向回归 `121/121` 通过；没有重新调用真实 provider，不把本地修复测试写成新的语义质量结果。
- [ ] 当前正式 Stage Agent、full test、独立审查、逐 AC、finding 处置、例外、人工确认和九面 paired A/B 仍缺失；不执行最终 close。

#### T045 收口前边界修复与评测绑定补充（2026-08-16）

- [x] 普通父任务 `verify-code` 不再接受 mini-task focused receipt 代替完整 `npm test`；mini-task focused 测试只在专用 mini-task delivery 路径使用。
- [x] 3rd-review OpenCode native auth 改为 runtime-local copy；terminal permission/timeout/output failure 保留明确分类；定向测试 `123/123` 通过。
- [x] ModelTest 每个版本记录三仓 source identity，每个 case 记录 subject/material hash；completed attempt 绑定失败时保持 unavailable；synthetic result 不进入质量分母；定向 benchmark 测试 `30/30` 通过。
- [x] `run-count=1` 重新生成 `252` 条计划，`provider_calls=0`；baseline/candidate TaskHandle 当前明确为 `unbound`，没有伪造 paired A/B 质量结果。
- [ ] 三个候选工作树尚未提交；当前六项正式 verify-code 事实、九面 live paired A/B、最终 close 授权仍缺失；不执行 close、merge、push、archive 或 cleanup。

#### T046 最终当前快照复核与收口前状态（2026-08-16）

- [x] 普通父任务 `verify-code` 拒绝 mini-task focused receipt；专用 mini-task delivery 保留 focused receipt；缺失/不可用审查的 finding disposition 保持 `missing`，不再 false-green。
- [x] mini-task bundle hash 与 catalog hash 已同步；`npm run check:skill-closure`、`git diff --check` 通过。
- [x] 最后一次公共全量捕获：`quality/tests/verify-code-current-20260816-v22.json`，HEAD `209b14e5aca36a5a06b2d5a4a637cd7ff20d31bf`，tree `16dddc1a1a0f51e4e9b8c74eadb6a3a2b525c3f7`，safe `162` 文件 `1680 passed / 1 skipped`，exclusive `31 passed`，exit `0`。
- [x] 受影响回归已通过：mini-task `9/9`、父任务 focused receipt `1/1`、final-cutover unavailable review `2/2`、stage artifact closure `4/4`；3rd-review 候选 `123/123`，ModelTest 候选 `30/30`。
- [x] 当前 verify-code review 只尝试一轮：第一次材料预检拒绝审计 output_ref，第二次请求 host 标识无效，第三次真实 provider 返回 `PUBLIC_RESULT_INVALID`（公共结果含私有路径）；没有可用 semantic result，不把它写成空 findings，也不继续重试。
- [ ] 当前仍没有绑定最新 tree 的有效独立 review；正式 Stage Agent outcome、逐 AC、finding disposition、exceptions、human confirmation 和公开 `full_tests_fresh` 事实仍缺失。
- [ ] ModelTest 仍只有 `252` 条 plan、`provider_calls=0`，baseline/candidate TaskHandle unbound；三仓候选仍未提交；没有启动 mini-task，没有执行 close、commit、merge、push、archive 或 cleanup。

### 执行状态填写区（追加事实，2026-08-17）

- **本轮范围**：在候选分支修复正式 close 证据的语义认证，以及 `tasks.md` 执行状态写回不应让 verify-code 事实失效的问题；没有改变需求、规格、计划、reviewer 数量、mini-task 路由或 public runtime 状态机。
- **代码改动**：`core/task-close.mjs` 现在严格认证 semantic AC/contract-test 证据，并对历史 `version` 形式的 review result 先做完整 schema 校验；`runtime/evidence/canonical-evidence-validators.mjs` 校验测试 receipt、输出哈希、source digest、snapshot 和 AC 对应关系；`runtime/evidence/freshness.mjs` 与 `tools/cli/stage-runtime.mjs` 只对执行状态区写回复用原质量事实，真实材料或代码变化仍会过期。
- **定向验证**：候选分支语法检查通过；close 语义证据/错误哈希/嵌套 AC 对应测试 `4/4` 通过；freshness 测试 `7/7` 通过；`git diff --check` 通过。
- **全量验证限制**：当前候选快照只执行过一次 `npm test`，180 秒后超时；已有输出中的测试套件没有报告失败，但整条命令没有完成，不能记录为 full test passed，也没有重跑同一全量命令。
- **当前正式事实**：旧 `quality/verify.json` 仍绑定旧快照，当前代码变化后应保持 stale/incomplete；本轮没有重新调用 provider，没有生成新的 Stage Agent outcome，没有伪造逐 AC、finding disposition、exceptions 或 human confirmation。
- **mini-task**：本轮没有新增需求，不启动 mini-task；该修复属于当前任务既定的 verify/close 共同边界。现有 mini-task design/implementation 路由没有新增未清理对象。
- **交接**：候选分支和 main 都有未提交的同类修复；3rd-review、ModelTest 的用户脏改动保持原样。commit、merge、push、archive、cleanup 和正式 close 仍未执行。

#### 本轮根因修复补充（2026-08-17）

- **根因**：`verifyFinalSubject` 原来只给 `build-code integration` 放行执行状态区回写，普通 `verify-code` 仍把同一类回写当成新快照；`task-close` 还使用另一套绝对 tree 相等规则。两套规则叠加，造成“审查完成→写回结果→快照过期→重复审查或 close 卡住”。
- **修复**：普通 `verify-code` 也只在 `tasks.md` 的“执行状态填写区”变化时复用原审查；代码、需求、AC、接口、测试和配置变化仍会让审查过期。close 交付发现同类纯回写时给出无需重跑质量审查的明确计划刷新提示，其他变化仍 fail-closed。
- **回归**：候选 `review-runner` `60/60`、vNext close/freshness `32/32` 通过；其中真实 Git fixture 证明普通 `verify-code` 的执行状态回写不会再次调用 provider。
- **合同边界**：撤掉未登记的 `semantic-ac-evidence.v1` 和 `semantic-contract-test-evidence.v1`，不新增 schema/控制面；继续使用现有 `acceptance-evidence.v1`、`workflowhub-receipt.v1` 和已登记 AC 证据合同。
- **全量测试**：此前 `npm test` 的 `600000ms` 官方预算运行曾 exit 0（safe `162` 个文件、`1697` passed、`1` skipped；exclusive `31` passed），但本轮随后又改了审查/close 合同，因此不能把旧收据写成当前最终快照的 `full_tests_fresh`；本轮没有再次触发 provider 或重试旧审查。
- **mini-task 判断**：没有新增用户需求，不启动 mini-task；这是当前主任务已有的 verify/close 边界修复。现有 mini-task design/implementation 没有新增对象，也没有待清理 worktree/lock。

#### T047 审查轮次策略根因修复（2026-08-17）

- **根因**：合同写的是普通阶段一轮 findings 即停，但 host 配置把 `build-spec`、`build-plan`、`verify-code` 设成 `full_on_structural_rework`，并把非 `build-code` 硬编码成该模式；`mini_task.design` 还用了同一模式，`mini_task.implementation` 用了 `full_only`。这会把普通 finding 误当成继续返工/重审信号。
- **修复**：普通五阶段（`make-decision` 的 direction/detail 仍按既有 single_round 逻辑）统一要求 `single_round`；`mini_task.design` 和 `mini_task.implementation` 也统一要求 `single_round`；只有 `build-code` 保留 `full_only`，由其 phase 严重 finding 收敛规则决定是否再做一次聚焦复审。配置中的 reviewer 列表没有改变，不动态增减 provider。
- **验证**：候选 skill closure `ok`；审查配置与 runner 定向回归 `2 files / 84 passed`；真实配置解析结果为正式阶段 `single_round, single_round, single_round, full_only, single_round`，两个 mini-task route 均为 `single_round`；没有调用真实 provider。
- **范围和停止**：没有再跑全量测试；此前中止的全量命令不写成通过；没有改三个公开监控文件，没有动 Multica，没有启动新 mini-task。

#### T048 当前 Git 对象图审计（2026-08-17）

- [x] 只读检查确认当前 `HEAD`、`HEAD^{tree}` 和 `git ls-tree -r HEAD` 均可读取；当前交付分支的可达对象图没有发现读取失败。
- [x] `git fsck --full` 仍在若干历史/辅助 refs 和 dangling objects 上报告 missing/broken links；这些不是当前 `HEAD` 的可达文件，不能把局部可读写成整个仓库对象库已修复。
- [x] 没有执行删除 refs、repack、prune 或其他破坏性 Git 修复；保留现有例外事实，等待明确的仓库维护授权和可恢复方案。
- [ ] 该环境例外仍不能冒充正式 close 已完成；正式 verify-code 六项事实和人工 close 授权仍未补齐。

#### T049 过期执行锁清理（2026-08-17）

- [x] 检查到当前任务唯一的 `test-capture.execution.lock` 对应 PID 已不存在，确认是中止全量捕获留下的过期锁。
- [x] 已删除这一个过期执行锁；没有删除任何 mini-task 记录、review、receipt、公开监控文件或其他任务对象。

#### T050 当前实现提交与合并事实（2026-08-17）

- [x] 当前 wh-review 轮次修复、记录性写回复用、close 语义认证、定向回归和任务记录已提交到候选分支：`c050c955`。
- [x] 已将同一批实现合并到 `main`：`a1ed7cf5`；没有 push，没有覆盖 main 上与本任务无关的 `docs/research/m16-experience-loop-repair-research.md` 和 `tmp/`。
- [x] 没有新增 mini-task；当前任务没有 mini-task worktree 或锁残留。候选分支保留为已合并后的可回读分支，未删除其他任务的分支或工作树。
- [ ] 这次是实现交付和 close 前准备，不等于正式 close；六项正式 verify-code 事实、全局 Git 对象库例外和人工 close 授权仍按原样保留。

#### T051 mini-task 与 3rd-review 分支清理核查（2026-08-17）

- [x] WorkflowHub 候选分支 `task/workflowhub/wh-review-adversarial-quality-cost-redesign` 工作树干净，已并入 `main`，没有未合并提交。
- [x] 当前任务没有独立 mini-task 分支、mini-task worktree 或任务锁；没有为了分支清理删除其他任务对象。
- [x] 3rd-review 候选 `codex/3rd-review-wh-review-adversarial-quality-cost-redesign` 和 `codex/3rd-review-main-integration` 的工作树都干净，但分别有 3 个和 1 个未并入 3rd-review `main` 的提交。
- [x] 3rd-review `main` 存在用户未提交修改和 worker spool；没有擅自 merge、reset、删除分支或删除工作树，避免覆盖其他任务。
- [x] ModelTest 候选工作树干净，候选分支没有独有提交；ModelTest `main` 仍有用户未提交内容，保持不动。
- [ ] 3rd-review 两个候选分支不能称为“已完全清理”；需要在 3rd-review `main` 的脏改动由 owner 明确处理后，才能安全合并和删除候选工作树。

#### T052 3rd-review 合并演练事实（2026-08-17）

- [x] 只读 `git merge-tree` 证明 `3rd-review main` 与 `codex/3rd-review-main-integration` 的已提交树可无冲突合并。
- [x] `3rd-review main` 与完整候选 `codex/3rd-review-wh-review-adversarial-quality-cost-redesign` 在 `lib/workflowhub-result-v3.mjs`、`test/workflowhub-result-v3.test.mjs` 出现 add/add 冲突；两个候选彼此合并时也有同样冲突。
- [x] 当前 `/Users/Hugh/.config/workflowhub/config.json` 实际指向完整候选 worktree；该 worktree 干净，当前运行不会读到未合并的 integration worktree。
- [ ] 没有在脏的 3rd-review `main` 上 merge、reset、stash 或删除分支；冲突需要 owner 选择保留哪套 v3 producer 语义后再处理。

#### T053 3rd-review 候选分支最终清理核查（2026-08-17）

- [x] 已在干净的 `codex/3rd-review-main-integration` 上合并完整候选 `codex/3rd-review-wh-review-adversarial-quality-cost-redesign`，合并提交 `1457e0c6` 的两个父提交分别是 integration 基线和完整候选；候选提交已进入当前运行树。
- [x] 冲突只涉及 `lib/workflowhub-result-v3.mjs` 与 `test/workflowhub-result-v3.test.mjs`；最终保留更完整的私有路径测试，并保留 Unicode 斜杠边界测试。语法检查和定向回归 `126/126` 通过，`git diff --check` 通过。
- [x] 已把 `/Users/Hugh/.config/workflowhub/config.json` 的 3rd-review command 切换到 `/Users/Hugh/Hugh/Project/3rd-review-main-integration/scripts/3rd-review.mjs`。
- [x] 已删除已被集成替代的旧候选 worktree 和分支 `codex/3rd-review-wh-review-adversarial-quality-cost-redesign`；保留干净的 active integration worktree `codex/3rd-review-main-integration`。
- [x] 当前任务没有独立 mini-task；任务 `locks/` 为空，没有 mini-task worktree、分支或锁残留。
- [ ] 3rd-review `main` 仍有 owner 的未提交修改和 worker spool；没有擅自合并、重置或清理它们。该脏工作树不是本任务新建分支的残留。

### T054 deferred acceptance 语义修复与父任务交接（2026-08-17）

- **根因**：验收证据原来只区分 `pass`/`fail`；`inconclusive`/`deferred` 在 stage runner、freshness、quality store 和 AC summary 之间可能被压成缺失或通过，导致 verify-code 无法真实表达“证据还不能下结论”，也可能形成 false-green。
- **补充需求判断**：这是当前任务已有的 verify/close 边界缺口，不是新增产品需求；按 mini-task 规则建立 `wh-review-deferred-exception-close`，未扩展 reviewer 数量、阶段路由或 public runtime 状态机。
- **mini-task 设计审查**：按 `/Users/Hugh/.config/workflowhub/config.json` 的两个 reviewer 做一轮设计审查；发现并修正了材料范围、回滚、freshness 语义、状态集合和 unavailable 边界问题。原始 review、修正后的设计材料和处置事实均保留。
- **实现**：验收 schema、freshness、quality store、AC summary、stage runner/handler 统一保留 `inconclusive`/`deferred`；两者始终是 `incomplete`，不会变成 `pass`；未知状态直接报错，不再落入 catch-all `missing`。
- **mini-task focused receipt**：`quality/tests/mini-task-deferred-semantics-repair2.json`，4 个定向测试文件、98 tests、exit 0；覆盖 deferred 语义、官方 receipt、vNext close/freshness 和 AC summary。本轮没有重跑父任务全量测试。
- **实现审查**：最终当前快照的独立审查结果 `quality/reviews/results/build-code-default-4ff6b1327ad6dec2a579c14b16ecd5f313fbaada-322869dd-4518-4e95-ae23-a19dc236dfc1.json` 为 available，canonical `findings=[]`。两次材料预检失败（禁止外部 output ref、AC 锚点越界）已分别保留为失败事实；修正后只执行一次有效 provider 请求，没有因同一问题循环重试。provider 原始输出提出“缺少真实 handler/stage-runner E2E”的风险，因未形成 canonical finding 不改写为空白事实，保留为后续风险。
- **交付**：代码与 mini-task 材料提交为 `260267bd`，已 fast-forward 合并到 WorkflowHub `main` 和父任务候选分支；mini-task worktree、分支和锁已清理，任务 store 中的 review、receipt、quality fact 和失败记录保留不删。
- **当前父任务状态**：合并代码后父任务快照已变化，旧 v56/full receipt、旧 review 不能直接复用；正式 verify-code 的 `full_tests_fresh`、独立审查、逐 AC、finding 处置、例外和人工确认仍不能伪造为完成。用户已要求不再全量测试，因此本轮不补跑父任务全量，也不执行 close。
- **保护边界**：没有写入 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub-monitor.html`、`workflowhub-monitor-data.js`、`workflowhub-monitor-facts.jsonl`，没有动 Multica；main 上原有 `docs/research/m16-experience-loop-repair-research.md` 和 `tmp/` 保持不动；3rd-review active integration 保持不动。
