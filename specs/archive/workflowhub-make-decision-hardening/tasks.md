# 任务清单：make-decision 收敛闭环强化

- **Input**：`specs/workflowhub-make-decision-hardening/decision-log.md@935c4b60ef18443fcd50b2269a0d1cf4214c0a3d8baf20d12636ff595d3a99c5`、`specs/workflowhub-make-decision-hardening/spec.md@c96c2d469855fa34d63f9dd8212a57f9593417924011862389d5869ee8252ba3`、`specs/workflowhub-make-decision-hardening/plan.md@daaa110747a397562c6487da1f16118ac1aa904ae2ce1b7529282d9cf679d8e6`
- **Template version**：`plan-task.v4`

## 材料导航

| 章节 / 材料锚点 | 职责与摘要 | 读取时机 |
| --- | --- | --- |
| `decision-log.md#D-020`、`#D-029` | 历史决策与 audit context；stale tail 不作为实现 unknown | 接手与历史核对 |
| `spec.md#速读卡（30-秒）`、`#验收标准` | 当前冻结 16 FR、21 AC，与 D-029 后实际用户授权共同控制 build-plan | 每卡开工、STOP 与 FINAL |
| `plan.md#Solution-Design`、`#Test-Strategy` | 唯一文件归属、DAG、测试与回滚 | 每卡执行前 |
| `tasks.md#Phase-P1-宿主需求源窄适配`、`#Phase-P3-outline_closed-与既有验收聚合` | 八张卡与真实执行事实 | 执行时 |

## Phase P1 — 宿主需求源窄适配

### Goal
显式 host-session 来源经既有认证链产出当前消息；任何 zstd 异常整体 unavailable/零消息。

### Files
- **NEW**：`runtime/evidence/host-session-transcript.mjs`、`tests/contract/dsh-requirement-source.test.mjs`
- **MODIFY**：`tools/host/workflowhub-stage-agent-bridge.mjs`、`runtime/evidence/dsh-transcript.mjs`、`tests/dsh-transcript.test.mjs`
- **DO NOT TOUCH**：`runtime/evidence/codex-transcript-adapter.mjs`、`runtime/evidence/fact-collector.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`

### Tasks

#### T001 — RED：宿主来源与严格 zstd 负例

- **ID**：T001
- **Phase**：Phase P1 — 宿主需求源窄适配
- **goal**：当前实现因错误接受注入/replay 或损坏 frame 的部分消息产生目标 assertion failure。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"decision","ref":"specs/workflowhub-make-decision-hardening/decision-log.md","hash":"935c4b60ef18443fcd50b2269a0d1cf4214c0a3d8baf20d12636ff595d3a99c5","id":"D-029"},{"artifact_kind":"spec","ref":"specs/workflowhub-make-decision-hardening/spec.md","hash":"c96c2d469855fa34d63f9dd8212a57f9593417924011862389d5869ee8252ba3","id":"FR-SOURCE-001"},{"artifact_kind":"plan","ref":"specs/workflowhub-make-decision-hardening/plan.md","hash":"daaa110747a397562c6487da1f16118ac1aa904ae2ce1b7529282d9cf679d8e6","id":"plan-task.v4"}]`
- **source_refs / decision_refs**：RQ-05、RQ-12 → D-029 → FR-SOURCE-001 → AC-SOURCE-001/002
- **输入**：later-approved Option B host-neutral contract、现有 strict frame walker 和 bridge fixtures。
- **依赖**：none
- **并行**：是 — 可与 T003 并行，文件不重叠
- **FR**：FR-SOURCE-001
- **AC**：AC-SOURCE-001、AC-SOURCE-002
- **AC role**：supporting RED evidence; primary=T002
- **动作**：只加测试；覆盖 `kind:host-session`、`transcript_path|WORKFLOWHUB_HOST_TRANSCRIPT`、机械 user predicate、identity replay、五类 unavailable，以及 valid concatenated、valid skippable、truncated header/block、reserved block、payload 内 fake magic、checksum mismatch、trailing garbage；所有 invalid 断言 whole-source unavailable 且 zero messages。把 main 已有 `session.coordination` 正/负例作为只读回归，证明 requirement-source RED 不删除、绕过或伪造 worker brief/summary、material/snapshot、usage、lifecycle 校验。
- **精确文件**：`tests/contract/dsh-requirement-source.test.mjs`、`tests/dsh-transcript.test.mjs`
- **boundary**：files: `tests/contract/dsh-requirement-source.test.mjs`, `tests/dsh-transcript.test.mjs`; symbols/regions: source fixtures and strict zstd oracle matrix
- **输出**：目标 assertion 非零；写 immutable pair `red.json` 与 manifest，不改生产实现。
- **Knowledge**：较晚用户批准 supersede 陈旧 DSH-specific engineering wording；opt-in/mechanical/honest limitation 保留，不重开 D-029。
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`npx vitest run tests/dsh-transcript.test.mjs tests/contract/dsh-requirement-source.test.mjs tests/contract/host-outcome-bridge.test.mjs tests/contract/cli-parity.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-SOURCE {"pass":"Valid explicit host-session sources authenticate current-bound user messages in source order, while every invalid zstd/source case is unavailable and emits exactly zero requirement messages.","reject":{"input":"Injected or replayed identity, absent or unreadable explicit source, and malformed zstd cases including truncated header or block, reserved block, payload fake magic, checksum mismatch, and trailing garbage.","expected_rejection":"The named source/filter/identity or whole-source zstd assertion fails against the pre-change implementation; environment, import, or fixture failures do not establish RED.","observation":"The focused command exits nonzero only for the named target assertion, and the immutable RED record captures the failing assertion plus zero-message observation for invalid sources."}}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`unavailable — post-main material revision not reviewed`
- **semantic_review_reason**：旧 review/hash 不绑定本次增量材料；按用户要求未重跑完整 build-plan 流程。
- **evidence_path**：`quality/tests/build-code/pairs/T001-T002/red.json`
- **STOP**：环境/import/fixture 红、需要 caller selector/scan latest/duplicate decoder/store/schema/public command、descriptor 变更，或 coordination 回归失败。
- **recovery**：修复测试夹具后用同命令重取目标 RED；不得改生产代码求红。
- **task risk**：Node zstd 环境失败冒充目标红，或只测首帧。
- **test tier / test method**：feature / backend contract + bridge subprocess；non_ui。
- **scenarios / commands / expected exit / oracle**：上述有效/无效 source 与八类 frame 场景；同 gate_cmd；exit 1；ORACLE-SOURCE。
- **fixtures_services**：mkdtemp JSONL/zstd bytes，由测试清理；无 live host/network。
- **coverage limits**：不证明宿主内字段不可伪造、自然人身份或其他宿主。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [ ] **任务完成**
- **status**：`completed`
- **actual_changes**：T001 added the P1 host-session/source and strict-zstd negative fixtures in the two named test files; no production implementation was changed for RED.
- **executed_commands**：`npx vitest run tests/dsh-transcript.test.mjs tests/contract/dsh-requirement-source.test.mjs tests/contract/host-outcome-bridge.test.mjs tests/contract/cli-parity.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` — RED exit `1` at the named source/decoder assertions before the paired adapter implementation.
- **evidence_refs**：`quality/tests/build-code/pairs/T001-T002/red.json` (pair evidence path reserved by the task material); P1 phase details in `.planning/2026-09-09-build-spec-and-build-plan/build-code-P1-phase-card.md`.
- **covered_ac**：supporting RED evidence for `AC-SOURCE-001`, `AC-SOURCE-002`; coordination regression remained a read-only protection.
- **review_fact**：P1 phase review unavailable: `quality/reviews/attempts/fc659856-4297-5e24-adf1-783bdd28abeb/attempt.json`, `MATERIAL_INCOMPLETE` / blocked before dispatch; review is advisory and not a gate.
- **completed_at**：`2026-09-10T00:50:00+08:00`
- **执行事实**：RED target recorded; paired GREEN T002 is the implementation completion authority.

#### T002 — GREEN：新增薄 host-session adapter

- **ID**：T002
- **Phase**：Phase P1 — 宿主需求源窄适配
- **goal**：以唯一 host-neutral adapter 和既有 strict walker 通过 T001，任何坏源 unavailable/零消息。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"decision","ref":"specs/workflowhub-make-decision-hardening/decision-log.md","hash":"935c4b60ef18443fcd50b2269a0d1cf4214c0a3d8baf20d12636ff595d3a99c5","id":"D-029"},{"artifact_kind":"spec","ref":"specs/workflowhub-make-decision-hardening/spec.md","hash":"c96c2d469855fa34d63f9dd8212a57f9593417924011862389d5869ee8252ba3","id":"FR-SOURCE-001"},{"artifact_kind":"plan","ref":"specs/workflowhub-make-decision-hardening/plan.md","hash":"daaa110747a397562c6487da1f16118ac1aa904ae2ce1b7529282d9cf679d8e6","id":"plan-task.v4"}]`
- **source_refs / decision_refs**：与 T001 相同
- **输入**：T001 target RED；`decompressZstdFrames/readDshTranscriptText`、registered source chain、bridge anchors。
- **依赖**：T001
- **并行**：否 — paired GREEN follows RED
- **FR**：FR-SOURCE-001
- **AC**：AC-SOURCE-001、AC-SOURCE-002
- **AC role**：primary
- **动作**：NEW `runtime/evidence/host-session-transcript.mjs` exports `buildHostRequirementAuthentication({transcriptPath,taskId,runId,stage,sessionId,sourceId,sourceRef}) => RequirementAuthentication|null`；bridge `buildRequirementAuthentication` 调用它；adapter 只解析 descriptor/path、投影事件、构造 registered source，并委托 dsh strict walker 解码，删除 duplicate magic scanner。保留 main 已有 `validateHostCoordinationEvents` / `assertHostCoordinationEvents`、coordination identity/usage/lifecycle 校验及 `recorder.finish({ coordination })` 透传。owner=`runtime/evidence`，consumer=bridge；host-native equivalent 到位后先迁 consumer 再删 adapter。
- **精确文件**：`runtime/evidence/host-session-transcript.mjs`、`tests/contract/dsh-requirement-source.test.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`、`runtime/evidence/dsh-transcript.mjs`、`tests/dsh-transcript.test.mjs`
- **boundary**：files: `runtime/evidence/host-session-transcript.mjs`, `tests/contract/dsh-requirement-source.test.mjs`, `tools/host/workflowhub-stage-agent-bridge.mjs`, `runtime/evidence/dsh-transcript.mjs`, `tests/dsh-transcript.test.mjs`; symbols/regions: exported constructor, bridge call, strict frame walker and tests
- **输出**：同 oracle exit 0；manifest + immutable `green.json`，cmd/oracle/fixture 与 RED 相同。
- **Knowledge**：调用方向 bridge→host adapter→strict DSH reader/registered source；adapter 不反向 import bridge，不复制 decoder。
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`npx vitest run tests/dsh-transcript.test.mjs tests/contract/dsh-requirement-source.test.mjs tests/contract/host-outcome-bridge.test.mjs tests/contract/cli-parity.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-SOURCE {"pass":"Valid explicit host-session sources authenticate current-bound user messages in source order, while every invalid zstd/source case is unavailable and emits exactly zero requirement messages."}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`unavailable — post-main material revision not reviewed`
- **semantic_review_reason**：旧 review/hash 不绑定本次增量材料；按用户要求未重跑完整 build-plan 流程。
- **evidence_path**：`quality/tests/build-code/pairs/T001-T002/green.json`
- **STOP**：caller selector、scan latest、duplicate decoder、fallback、adapter 第二 consumer 未登记、coordination 契约被削弱或 product semantics 改变。
- **recovery**：回滚 P1 exact files，删除 NEW files，来源保持 unavailable；用 P1 command/oracle 核对零消息。
- **task risk**：adapter 变成第二 decoder 或 bridge 选择消息。
- **test tier / test method**：feature / backend contract + bridge subprocess；与 T001 相同。
- **scenarios / commands / expected exit / oracle**：与 T001 完全相同；同命令；exit 0；ORACLE-SOURCE。
- **fixtures_services**：与 T001 相同。
- **coverage limits**：不承诺独立 launcher 防伪或其他 host native format。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [ ] **任务完成**
- **status**：`completed`
- **actual_changes**：Added the thin `runtime/evidence/host-session-transcript.mjs` adapter, updated the bridge to use the existing strict DSH decoder/authentication path while preserving coordination, and added the P1 source contract tests.
- **executed_commands**：`npx vitest run tests/dsh-transcript.test.mjs tests/contract/dsh-requirement-source.test.mjs tests/contract/host-outcome-bridge.test.mjs tests/contract/cli-parity.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` — GREEN exit `0`, 4 files/31 tests passed (the bridge/DSH subset was 2 files/21 tests).
- **evidence_refs**：`quality/tests/build-code/pairs/T001-T002/green.json`; `.planning/2026-09-09-build-spec-and-build-plan/build-code-P1-phase-card.md`.
- **covered_ac**：primary P1 coverage for `AC-SOURCE-001`, `AC-SOURCE-002`, with supporting coordination contract; malformed/unavailable sources remain unavailable with zero messages.
- **review_fact**：P1 phase review unavailable: `quality/reviews/attempts/fc659856-4297-5e24-adf1-783bdd28abeb/attempt.json`, `MATERIAL_INCOMPLETE` / blocked before dispatch; no review result is claimed.
- **completed_at**：`2026-09-10T00:50:00+08:00`
- **执行事实**：T002 GREEN completed against the exact paired oracle; P2 T003/T004 is independent and follows. Same-task strict-decoder/source repair was rechecked on 2026-09-10: the exact P1 command exited `0` with 4 files/44 tests; `node --check` for the three P1 production files and `git diff --check` also exited `0`. The added valid-source, unavailable-source, skippable-length, 8-byte FCS, checksum, and explicit-empty-transcript cases remain within the P1 boundary.

### Verify
P1 command；RED=target nonzero，GREEN=0；ORACLE-SOURCE；pair manifest binds same cmd/oracle/fixture。

### Knowledge
Later host-neutral approval controls direction; adapter is retained until a host-native equivalent replaces its only consumer。

### STOP
Any caller selector, latest scan, duplicate decoder, fallback, control-plane addition, descriptor ambiguity or coordination regression。

### Done
Only actual immutable RED/GREEN facts may change status; review_fact is currently N/A—not executed。

### Risks and rollback
Partial decode and overstated authenticity; P1 independently rolls back to unavailable/zero messages using exact P1 files/command/oracle。

## Phase P2 — OI 作者与三消费者契约

### Goal
Unique OI and current questions-only projection are consumed by direction/detail/existing confirmation without a new authority.

### Files
- **NEW**：N/A — existing contracts are extended in place.
- **MODIFY**：`workflows/make-decision/SKILL.md`、`workflows/make-decision/steps.json`、`skills/decision-log/SKILL.md`、`skills/decision-log/templates/decision-log-template.md`、`runtime/review/stage-materials.json`、`skills/wh-review/contracts/make-decision.md`、`docs/standard-workflow.md`、`tests/decision-log-content-contract.test.mjs`、`tests/step-manifest.test.mjs`、`tests/contract/review-materials-contract.test.mjs`、`tests/contract/spec-stage-artifact-closure.test.mjs`、`tests/stage-review-cost-policy.test.mjs`
- **DO NOT TOUCH**：other stage workflows, Talk/Grill, CONTEXT/ADR.

### Tasks

#### T003 — RED：唯一 OI 与消费者负例

- **ID**：T003
- **Phase**：Phase P2 — OI 作者与三消费者契约
- **goal**：用 static/contract negatives 证明现状未强制唯一 OI、current questions-only 和三消费者职责。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"decision","ref":"specs/workflowhub-make-decision-hardening/decision-log.md","hash":"935c4b60ef18443fcd50b2269a0d1cf4214c0a3d8baf20d12636ff595d3a99c5","id":"D-002-D-028"},{"artifact_kind":"spec","ref":"specs/workflowhub-make-decision-hardening/spec.md","hash":"c96c2d469855fa34d63f9dd8212a57f9593417924011862389d5869ee8252ba3","id":"FR-OUTLINE-001-FR-GOV-001"},{"artifact_kind":"plan","ref":"specs/workflowhub-make-decision-hardening/plan.md","hash":"daaa110747a397562c6487da1f16118ac1aa904ae2ce1b7529282d9cf679d8e6","id":"plan-task.v4"}]`
- **source_refs / decision_refs**：RQ-01～RQ-16 → D-002～D-028 → OI/review/state/flow FR/AC
- **输入**：冻结 spec、现有 workflow/template/material registry；与 P1 文件独立。
- **依赖**：none
- **并行**：是 — 可与 T001/T002 并行，文件不重叠
- **FR**：FR-OUTLINE-001、FR-OUTLINE-002、FR-SNAPSHOT-001、FR-REVIEW-001、FR-STATE-001、FR-CONFIRM-001、FR-REVISION-001、FR-CONFLICT-001、FR-FLOW-001、FR-FLOW-002、FR-GOV-001
- **AC**：AC-OUTLINE-001、AC-OUTLINE-002、AC-SNAPSHOT-001、AC-REVIEW-002、AC-STATE-002
- **AC role**：supporting RED evidence; primary=T004
- **动作**：只强化 tests：research 前逐字枚举 framework nodes `background|problem|goal|solution|acceptance|extension` 与 fixed categories `complete_user_flow|page_scope|data_state|success_failure_boundary|non_goals|deferred`；每个 node/category 必须有 OI coverage 或 `empty:true` + non-placeholder `reason`。覆盖 current questions-only、答案遮蔽、direction required、detail/confirm 独立职责，以及 omission/bare-none/substitution/duplicate/stale/summary/leak 负例；不声称真实 review、confirmation、conflict、flow、Talk 或 governance manual AC。
- **精确文件**：`tests/decision-log-content-contract.test.mjs`、`tests/step-manifest.test.mjs`、`tests/contract/review-materials-contract.test.mjs`、`tests/contract/spec-stage-artifact-closure.test.mjs`、`tests/stage-review-cost-policy.test.mjs`
- **boundary**：files: `tests/decision-log-content-contract.test.mjs`, `tests/step-manifest.test.mjs`, `tests/contract/review-materials-contract.test.mjs`, `tests/contract/spec-stage-artifact-closure.test.mjs`, `tests/stage-review-cost-policy.test.mjs`; symbols/regions: OI structure/order/revision/consumer negatives
- **输出**：目标 assertion nonzero；immutable `red.json` and pair manifest。
- **Knowledge**：detail review is quality fact, not sixth close conjunct；confirmation remains approve-decision。
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`npx vitest run tests/decision-log-content-contract.test.mjs tests/step-manifest.test.mjs tests/contract/review-materials-contract.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/stage-review-cost-policy.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-OI-CONTRACT {"pass":"One current OI authority covers every required framework node and fixed category, exposes a questions-only direction projection, and preserves distinct direction, detail, and existing-confirmation consumer duties with current identity bindings.","reject":{"input":"OI omission, bare none, node/category substitution, duplicate or stale authority, summary-only projection, answer leakage, consumer substitution, or missing/mismatched task/version/OI/group/disposition/ref/hash binding.","expected_rejection":"The pre-change contracts fail only the named OI structure, order, revision, projection, or consumer assertion; unrelated command or fixture failures do not establish RED.","observation":"The focused static/contract command exits nonzero at the named negative assertion and records which required node, category, projection boundary, consumer duty, or current binding was not enforced."}}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`unavailable — post-main material revision not reviewed`
- **semantic_review_reason**：旧 review/hash 不绑定本次增量材料；按用户要求未重跑完整 build-plan 流程。
- **evidence_path**：`quality/tests/build-code/pairs/T003-T004/red.json`
- **STOP**：command/fixture failure, fifth material, second state/projection, extra confirmation or other stage/Talk/Grill edit。
- **recovery**：fix fixture and rerun same command; do not weaken required material。
- **task risk**：keyword-only test repeats false green。
- **test tier / test method**：feature / static and backend contract only。
- **scenarios / commands / expected exit / oracle**：structure/order/stale/leak/substitution negatives；same command；exit 1；ORACLE-OI-CONTRACT。
- **fixtures_services**：in-memory Markdown/JSON fixtures；no service。
- **coverage limits**：does not execute real review, Talk/Grill or user confirmation。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [ ] **任务完成**
- **status**：`completed`
- **actual_changes**：T003 added the paired static/contract RED assertions for the OI authority, six framework nodes, six fixed categories, questions-only projection, consumer separation, and current identity/negative cases. T003 itself changed only the five named contract test files.
- **executed_commands**：`npx vitest run tests/decision-log-content-contract.test.mjs tests/step-manifest.test.mjs tests/contract/review-materials-contract.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/stage-review-cost-policy.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` — RED exit `1` before the paired implementation; the target OI assertions failed (initial stale bundle/namespace assertions were then corrected inside the same paired scope).
- **evidence_refs**：`quality/tests/build-code/pairs/T003-T004/red.json` (pair evidence path reserved by the task material); phase execution details in `.planning/2026-09-09-build-spec-and-build-plan/build-code-P2-phase-card.md`.
- **covered_ac**：supporting RED evidence for `AC-OUTLINE-001`, `AC-OUTLINE-002`, `AC-SNAPSHOT-001`, `AC-REVIEW-002`, `AC-STATE-002`; no semantic/runtime acceptance claimed.
- **review_fact**：P2 phase review unavailable: `quality/reviews/attempts/8b379781-028d-55fb-a923-cbded1139ede/attempt.json`, `PROTOCOL_INCOMPATIBLE` / blocked before dispatch; review is advisory and not a gate.
- **completed_at**：`2026-09-10T01:40:00+08:00`
- **执行事实**：RED target recorded; the paired GREEN task T004 is the implementation completion authority.

#### T004 — GREEN：扩展既有 OI/review contracts

- **ID**：T004
- **Phase**：Phase P2 — OI 作者与三消费者契约
- **goal**：最小修改 existing workflow/template/review registry 通过 T003，保持 review advisory。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"decision","ref":"specs/workflowhub-make-decision-hardening/decision-log.md","hash":"935c4b60ef18443fcd50b2269a0d1cf4214c0a3d8baf20d12636ff595d3a99c5","id":"D-002-D-028"},{"artifact_kind":"spec","ref":"specs/workflowhub-make-decision-hardening/spec.md","hash":"c96c2d469855fa34d63f9dd8212a57f9593417924011862389d5869ee8252ba3","id":"FR-OUTLINE-001-FR-GOV-001"},{"artifact_kind":"plan","ref":"specs/workflowhub-make-decision-hardening/plan.md","hash":"daaa110747a397562c6487da1f16118ac1aa904ae2ce1b7529282d9cf679d8e6","id":"plan-task.v4"}]`
- **source_refs / decision_refs**：与 T003 相同
- **输入**：T003 target RED 与冻结 OI/state/review/flow contract。
- **依赖**：T003
- **并行**：否 — paired GREEN follows RED
- **FR**：FR-OUTLINE-001、FR-OUTLINE-002、FR-SNAPSHOT-001、FR-REVIEW-001、FR-STATE-001、FR-CONFIRM-001、FR-REVISION-001、FR-CONFLICT-001、FR-FLOW-001、FR-FLOW-002、FR-GOV-001
- **AC**：AC-OUTLINE-001、AC-OUTLINE-002、AC-SNAPSHOT-001、AC-REVIEW-002、AC-STATE-002
- **AC role**：primary
- **动作**：extend existing workflow/steps/skill/template/material registry/review contract/docs and paired tests；one current OI authority with exact framework nodes `background|problem|goal|solution|acceptance|extension` and fixed categories `complete_user_flow|page_scope|data_state|success_failure_boundary|non_goals|deferred`；every node/category has OI coverage or `empty:true` plus justified non-placeholder `reason`。T004 owns authoring and visible grouping fields exactly: `task_id`, `outline_version`, `oi_id`, `visible_group_id|batch_id`, `selected_disposition`, `impact_dimensions`, `requires_user_decision`, `interaction_ref`, `interaction_hash`; required questions-only direction projection, per-OI responsibilities, and grouped plain-language options remain inside existing approve-decision with no extra normal confirmation. Runtime validity of these values belongs to T005/T006。修改 `docs/standard-workflow.md` 时保留 main 新增的 review preflight 语义：它只产生事实，不作 gate 或推进许可证。
- **精确文件**：`workflows/make-decision/SKILL.md`、`workflows/make-decision/steps.json`、`skills/decision-log/SKILL.md`、`skills/decision-log/templates/decision-log-template.md`、`runtime/review/stage-materials.json`、`skills/wh-review/contracts/make-decision.md`、`docs/standard-workflow.md`、`tests/decision-log-content-contract.test.mjs`、`tests/step-manifest.test.mjs`、`tests/contract/review-materials-contract.test.mjs`、`tests/contract/spec-stage-artifact-closure.test.mjs`、`tests/stage-review-cost-policy.test.mjs`
- **boundary**：files: `workflows/make-decision/SKILL.md`, `workflows/make-decision/steps.json`, `skills/decision-log/SKILL.md`, `skills/decision-log/templates/decision-log-template.md`, `runtime/review/stage-materials.json`, `skills/wh-review/contracts/make-decision.md`, `docs/standard-workflow.md`, `tests/decision-log-content-contract.test.mjs`, `tests/step-manifest.test.mjs`, `tests/contract/review-materials-contract.test.mjs`, `tests/contract/spec-stage-artifact-closure.test.mjs`, `tests/stage-review-cost-policy.test.mjs`; symbols/regions: make-decision OI lifecycle and three consumers
- **输出**：same oracle exit 0；immutable green record with identical command/oracle/fixture identity。
- **Knowledge**：projection is nonpersistent; OI revision invalidates prior consumer result without lineage control plane。
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`npx vitest run tests/decision-log-content-contract.test.mjs tests/step-manifest.test.mjs tests/contract/review-materials-contract.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/stage-review-cost-policy.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-OI-CONTRACT {"pass":"One current OI authority covers every required framework node and fixed category, exposes a questions-only direction projection, and preserves distinct direction, detail, and existing-confirmation consumer duties with current identity bindings."}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`unavailable — post-main material revision not reviewed`
- **semantic_review_reason**：旧 review/hash 不绑定本次增量材料；按用户要求未重跑完整 build-plan 流程。
- **evidence_path**：`quality/tests/build-code/pairs/T003-T004/green.json`
- **STOP**：new stage/store/schema/confirmation/projection、review-as-permit，或覆盖 main 的 review-preflight fact-only 边界。
- **recovery**：after P3 rollback, revert exact P2 files and run P2 command/oracle; preserve evidence。
- **task risk**：registry says required but real reviewer ignores OI。
- **test tier / test method**：feature / static and backend contract only；same as T003。
- **scenarios / commands / expected exit / oracle**：same T003 matrix；same command；exit 0；ORACLE-OI-CONTRACT。
- **fixtures_services**：same as T003。
- **coverage limits**：real review/manual facts remain unavailable until explicitly supplied to T007。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [ ] **任务完成**
- **status**：`completed`
- **actual_changes**：Extended the existing make-decision workflow/steps, decision-log skill/template, review material registry/contract, standard workflow wording, and the five paired contract tests; synchronized the decision-log and wh-review bundle/catalog hashes required by closure validation. No fifth material, new stage, store, public command, confirmation point, or review gate was added.
- **executed_commands**：`npx vitest run tests/decision-log-content-contract.test.mjs tests/step-manifest.test.mjs tests/contract/review-materials-contract.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/stage-review-cost-policy.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` — GREEN exit `0`, 5 files/74 tests passed, ~34.8s.
- **evidence_refs**：`quality/tests/build-code/pairs/T003-T004/green.json` (pair evidence path reserved by the task material); `.planning/2026-09-09-build-spec-and-build-plan/build-code-P2-phase-card.md`.
- **covered_ac**：primary static/contract coverage for `AC-OUTLINE-001`, `AC-OUTLINE-002`, `AC-SNAPSHOT-001`, `AC-REVIEW-002`, `AC-STATE-002`; runtime identity, per-OI proof, real provider, confirmation interaction, conflict, and close aggregation remain outside this task.
- **review_fact**：P2 phase review unavailable: `quality/reviews/attempts/8b379781-028d-55fb-a923-cbded1139ede/attempt.json`, `PROTOCOL_INCOMPATIBLE` / blocked before dispatch; P1 review fact also unavailable at `quality/reviews/attempts/fc659856-4297-5e24-adf1-783bdd28abeb/attempt.json` (`MATERIAL_INCOMPLETE`). These facts do not gate implementation.
- **completed_at**：`2026-09-10T01:40:00+08:00`
- **执行事实**：T004 GREEN completed against the exact paired oracle; follow-on T005/T006 owns runtime validation and completion aggregation.

### Verify
P2 command；RED=target nonzero，GREEN=0；ORACLE-OI-CONTRACT；immutable pair manifest。

### Knowledge
P3 consumes this exact current OI/material contract; review unavailable is fact, not work permit。

### STOP
Fifth material, second state/projection, extra confirmation, review gate, other stage or Talk/Grill edits。

### Done
Only actual pair evidence may update tasks; all review/manual facts currently N/A—not executed。

### Risks and rollback
Keyword false green and consumer substitution; rollback only after P3, using exact P2 files/command/oracle。

## Phase P3 — `outline_closed` 与既有验收聚合

### Files
- **NEW**：`tests/contract/acceptance-execution-producer.mjs`、`tests/contract/acceptance-execution-producer.test.mjs`、`quality/tests/build-code/T007/acceptance-request-repaired-current.json`
- **MODIFY**：`docs/architecture/move-map.json`（登记 producer 的 owner、sole consumer 和 delete condition）；现有 P3 runtime/completion/status 文件与其定向 contract/integration tests（见 T005/T006）；不新增 public command、store 或 runtime control plane。
- **DO NOT TOUCH**：`tests/acceptance/**`、其他 stage 的 predicate、public status schema。

### Goal
Derive one five-conjunct completion subject and aggregate all 21 AC once through the existing acceptance execution route.

### Files
- **NEW**：`quality/tests/build-code/T007/acceptance-request-repaired-current.json`（receipts-only public-run request；malformed predecessor remains immutable）
- **MODIFY**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/completion-predicates.mjs`、`tools/cli/stage-runtime.mjs`、`tests/contract/decision-convergence-depth.test.mjs`、`tests/contract/requirement-convergence-regression.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/e2e/vnext-five-stage-current.test.mjs`、`tests/integration/vnext-delivery-close.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`
- **READ-ONLY REGRESSION**：`tests/contract/test-runtime-profile.test.mjs`
- **DO NOT TOUCH**：other stage predicates, public status schema, `tests/acceptance/**`.

### Tasks

#### T005 — RED：五项 subtraction 与 stale proof

- **ID**：T005
- **Phase**：Phase P3 — `outline_closed` 与既有验收聚合
- **goal**：完整 baseline 逐一删除五项，证明当前 runtime 会错误关闭或不能给出具体 gaps。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"decision","ref":"specs/workflowhub-make-decision-hardening/decision-log.md","hash":"935c4b60ef18443fcd50b2269a0d1cf4214c0a3d8baf20d12636ff595d3a99c5","id":"D-020"},{"artifact_kind":"spec","ref":"specs/workflowhub-make-decision-hardening/spec.md","hash":"c96c2d469855fa34d63f9dd8212a57f9593417924011862389d5869ee8252ba3","id":"FR-CLOSE-001+FR-REVISION-001"},{"artifact_kind":"plan","ref":"specs/workflowhub-make-decision-hardening/plan.md","hash":"daaa110747a397562c6487da1f16118ac1aa904ae2ce1b7529282d9cf679d8e6","id":"plan-task.v4"}]`
- **source_refs / decision_refs**：D-006/D-007/D-010/D-014/D-020/D-021/D-024/D-028 → close/proof/repair/accept FR/AC
- **输入**：T004 OI/material authoring contract + current parser/handler/predicate fixtures；P1 source is not a close-path prerequisite。
- **依赖**：T004
- **并行**：否 — P3 close path consumes only P2 output
- **FR**：FR-PROOF-001、FR-CLOSE-001、FR-REVISION-001、FR-REPAIR-001
- **AC**：AC-STATE-001、AC-PROOF-001、AC-CLOSE-001、AC-CLOSE-002、AC-REVISION-001、AC-REPAIR-001
- **AC role**：supporting RED evidence; primary=T006
- **动作**：only tests：保留 five-conjunct baseline/subtraction、stale/exact-binding 与 replacement fixtures；新增 current outcome retry 回归：多个 immutable current completed sibling 中，唯一 authenticated quality-fact 链绑定 ref 被选中；不同 current facts 绑定不同 ref 返回 `conflict`；`deriveStageCompletion` 保留 `conflict`，不得改写为 `missing`。同时为 T006 canonical producer 写目标负例：malformed/non-UTF8 report、missing/duplicate/unknown AC、nonzero/timeout/cancelled child 与 same-input retry 必须非通过。禁止 mtime/hash/latest/env/caller 选择。`test-runtime-profile` 只读回归锁住 main 的 permissions/capability proof/test-routing/acceptance-currentness 语义。
- **精确文件**：`tests/contract/decision-convergence-depth.test.mjs`、`tests/contract/requirement-convergence-regression.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/contract/acceptance-execution-producer.test.mjs`、`tests/e2e/vnext-five-stage-current.test.mjs`、`tests/integration/vnext-delivery-close.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`
- **boundary**：files: the named P3 contract/e2e/integration tests; symbols/regions: five-field baseline/subtraction/stale/replacement census fixtures and producer report/failure fixtures; no runtime implementation changes for RED
- **输出**：target assertion nonzero；immutable RED and manifest。
- **Knowledge**：exactly five conjuncts；only one authoritative subject during migration；same oracle must prove replacement equivalence。
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`npx vitest run tests/contract/decision-convergence-depth.test.mjs tests/contract/requirement-convergence-regression.test.mjs tests/contract/stage-completion.test.mjs tests/contract/test-runtime-profile.test.mjs tests/contract/acceptance-execution-producer.test.mjs tests/e2e/vnext-five-stage-current.test.mjs tests/integration/vnext-delivery-close.test.mjs tests/integration/vnext-official-stage-run.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-P3-HARDENING {"pass":"The sole outline_closed subject keeps its five-part contract; a unique authenticated current quality-fact chain selects its exact completed outcome despite immutable retry siblings; divergent bindings remain conflict and conflict is never reported as missing; producer failure fixtures remain non-passing.","reject":{"input":"Delete one outline conjunct, use stale or mismatched interaction proof, provide retry siblings with one fact-bound ref, provide divergent current fact bindings, or feed malformed/duplicate/nonzero producer output.","expected_rejection":"Pre-change code fails a named outline/outcome-projection/producer assertion instead of selecting the bound ref, preserving true conflict and rejecting invalid output.","observation":"The focused command exits nonzero at the named target assertion; setup/runtime-profile failures do not establish RED."}}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`unavailable — post-main material revision not reviewed`
- **semantic_review_reason**：旧 review/hash 不绑定本次增量材料；按用户要求未重跑完整 build-plan 流程。
- **evidence_path**：`quality/tests/build-code/pairs/T005-T006/red.json`
- **STOP**：environment/git fixture failure, sixth conjunct, new gate/schema, caller/latest/env selector, runtime-profile/test-routing/acceptance-currentness regression, missing concrete gap or other stage change。
- **recovery**：repair fixture and rerun same command; do not touch production for RED。
- **task risk**：heavy fixture failure hides target assertion。
- **test tier / test method**：feature / backend contract + serialized integration/git fixtures。
- **scenarios / commands / expected exit / oracle**：baseline, five deletions, terminal fields, stale proof, replacement equivalence, repair；same command；exit 1；ORACLE-OUTLINE-CLOSED。
- **fixtures_services**：mkdtemp task/worktree/store；fixed interaction/review records；serialized cleanup。
- **coverage limits**：does not judge semantic depth, human identity or independent review quality。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [ ] **任务完成**
- **status**：`in_progress`
- **actual_changes**：Added the P3 subtraction/stale-binding/conflict fixtures in the six named test files; no production implementation was changed for the RED task.
- **executed_commands**：The exact T005/T006 seven-file command was attempted with the declared command and a 900s outer timeout; it terminated with exit `124` before a complete aggregate, with no target assertion failure or environment error reported. Before timeout, `tests/integration/vnext-official-stage-run.test.mjs` completed `94 passed / 0 failed` in `744491ms`. A same-scope six-file split (omitting only that official-stage file) also terminated at the 900s timeout with no target assertion failure or environment error; `tests/e2e/vnext-five-stage-current.test.mjs` completed `23 passed / 1 skipped / 0 failed` in `447272ms`, while the other five files had no terminal file-level result. No independent pre-change RED record was captured before implementation.
- **evidence_refs**：No immutable `quality/tests/build-code/pairs/T005-T006/red.json` was produced; the missing RED record remains disclosed.
- **covered_ac**：Supporting RED evidence for `AC-STATE-001`, `AC-PROOF-001`, `AC-CLOSE-001`, `AC-CLOSE-002`, `AC-REVISION-001`, and `AC-REPAIR-001` is incomplete; named subtraction/stale/conflict assertions are covered by the later focused GREEN checks.
- **review_fact**：P3 phase review is unavailable; no current authenticated independent review result was produced.
- **completed_at**：N/A — exact RED evidence was not captured.
- **执行事实**：P3 RED remains incomplete: the planned exact command did not yield a bounded target-only nonzero result before the paired implementation, so this task is not claimed complete. A separate detached `HEAD 7b95e96d` baseline probe reused the current P3 fixtures and ran the contract files individually: `decision-convergence-depth.test.mjs` failed 3 target outline assertions (`analyzeDecisionOutline is not a function`), `stage-completion.test.mjs` failed 3 target fact-bound/conflict assertions (`deriveFactBoundStageOutcomeRefs is not a function`, plus expected `conflict` but received `unavailable`), while `test-runtime-profile.test.mjs` passed 12 tests. This is supporting pre-change target evidence only; it is not substituted for the required exact seven-file immutable RED pair. The earlier bounded aggregate attempts are recorded as timeout facts, not as RED. A later current-worktree GREEN run is recorded under T006 below; it does not retroactively create the missing RED pair.

#### T006 — GREEN：唯一 `outline_closed`

- **ID**：T006
- **Phase**：Phase P3 — `outline_closed` 与既有验收聚合
- **goal**：parser→handler→predicate 仅在当前 D-020 五项齐全时 passed；status projector 正确解析唯一 fact-bound outcome，并保留真实 conflict 诊断。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"decision","ref":"specs/workflowhub-make-decision-hardening/decision-log.md","hash":"935c4b60ef18443fcd50b2269a0d1cf4214c0a3d8baf20d12636ff595d3a99c5","id":"D-020"},{"artifact_kind":"spec","ref":"specs/workflowhub-make-decision-hardening/spec.md","hash":"c96c2d469855fa34d63f9dd8212a57f9593417924011862389d5869ee8252ba3","id":"FR-CLOSE-001+FR-REVISION-001"},{"artifact_kind":"plan","ref":"specs/workflowhub-make-decision-hardening/plan.md","hash":"daaa110747a397562c6487da1f16118ac1aa904ae2ce1b7529282d9cf679d8e6","id":"plan-task.v4"}]`
- **source_refs / decision_refs**：与 T005 相同
- **输入**：T005 target RED, T004 output, current interaction aggregate/authenticated bindings；T002 is not a P3 close dependency。
- **依赖**：T005
- **并行**：否 — paired GREEN follows RED
- **FR**：FR-PROOF-001、FR-CLOSE-001、FR-REVISION-001、FR-REPAIR-001、FR-FLOW-001、FR-GOV-001
- **AC**：AC-STATE-001、AC-PROOF-001、AC-CLOSE-001、AC-CLOSE-002、AC-REVISION-001、AC-REPAIR-001、AC-FLOW-001、AC-GOV-001
- **AC role**：primary
- **动作**：保留 five-conjunct parser→handler→predicate 契约。`stage-runtime` 从 authenticated current quality-fact observations 沿 acceptance → stage-quality evidence 取得唯一 bound outcome ref，再交给现有 full authenticator；unbound retry sibling 保留但不竞争，divergent current bindings 显式 `conflict`，completion/status 保留 `conflict`。禁止 caller/latest/env/mtime/hash-order 选择。仅修改 make-decision convergence、current outcome projection/diagnostic 区域；保留 main 的 runtime-profile、test-routing 与 acceptance-currentness 契约。另新增一个 test-owned canonical acceptance report producer：复用既有 private service executor，单次以 no-shell 方式执行固定 package-local Vitest argv，解析 machine report，按当前 21-AC mapping 生成 exact `{entries}`；不读 task store、不选 latest、不写事实、不提供 public command。
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/review/integration-review-subject.mjs`、`tools/cli/stage-runtime.mjs`、`docs/architecture/move-map.json`、`tests/contract/decision-convergence-depth.test.mjs`、`tests/contract/integration-review-subject.test.mjs`、`tests/contract/requirement-convergence-regression.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/e2e/vnext-five-stage-current.test.mjs`、`tests/integration/vnext-delivery-close.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`、`tests/contract/acceptance-execution-producer.mjs`、`tests/contract/acceptance-execution-producer.test.mjs`（`tests/contract/test-runtime-profile.test.mjs` 只读回归）
- **boundary**：files: P3 exact files；symbols/regions: OI parse/gaps, formal acceptance-section ID extraction, completion subject, authenticated fact-bound outcome resolution, conflict diagnostic, service-tier report adapter；不得改 main runtime-profile/test-routing/acceptance-currentness 非相关区域，不得新增 public acceptance route
- **输出**：same oracle exit 0；immutable GREEN; five omissions and producer malformed/nonzero/timeout/cancelled negatives remain negative; only one authority。
- **Knowledge**：owner=make-decision runtime for completion and T006 test producer owner for canonical report conversion；consumer=existing completion/status plus existing `executePrivateAcceptance` service tier/T008；equivalent analyzer or package producer replacement deletes only the retained narrow adapter after consumer migration, without dual write。
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`npx vitest run tests/contract/decision-convergence-depth.test.mjs tests/contract/requirement-convergence-regression.test.mjs tests/contract/stage-completion.test.mjs tests/contract/test-runtime-profile.test.mjs tests/contract/acceptance-execution-producer.test.mjs tests/e2e/vnext-five-stage-current.test.mjs tests/integration/vnext-delivery-close.test.mjs tests/integration/vnext-official-stage-run.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-P3-HARDENING {"pass":"The sole outline_closed subject keeps its five-part contract; one authenticated current fact binding selects the exact completed outcome despite retry siblings; divergent bindings remain explicit conflict; the existing service-tier producer emits exactly one assertion-bearing canonical entry for each declared AC and preserves malformed/nonzero/timeout/cancelled failures."}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`unavailable — post-main material revision not reviewed`
- **semantic_review_reason**：旧 review/hash 不绑定本次增量材料；按用户要求未重跑完整 build-plan 流程。
- **evidence_path**：`quality/tests/build-code/pairs/T005-T006/green.json`
- **STOP**：semantic judgment, second completion subject, dual write, public acceptance runner/command, caller/latest/env selector, hidden gap, sixth conjunct, main contract regression or blocking same-task repair。
- **recovery**：revert exact P3 files first, rerun P3 command/oracle, preserve pair evidence and actual gaps。
- **task risk**：fallback parser reintroduces keyword false green, producer report mapping creates a second AC authority, or child cleanup/report parsing drifts from the existing service contract。
- **test tier / test method**：feature / backend contract + serialized integration；same as T005。
- **scenarios / commands / expected exit / oracle**：same T005 matrix plus canonical producer success, malformed/non-UTF8 report, missing/duplicate/unknown AC, nonzero, timeout and cancellation fixtures；same command；exit 0；ORACLE-OUTLINE-CLOSED + producer contract。
- **fixtures_services**：same as T005 plus isolated package-local Vitest report fixtures and child cleanup markers。
- **coverage limits**：independent review/manual/human facts are not synthesized; producer only converts declared test report facts and cannot prove external/manual identity。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [ ] **任务完成**
- **status**：`in_progress`
- **actual_changes**：Implemented the five-conjunct `outline_closed` completion subject and fact-bound current-outcome/conflict projection in the named P3 runtime files, with the P3 contract/e2e/integration tests updated. Scope correction: the existing `runtime/review/schemas/result.schema.json` now accepts the governed `semantic_fields` projection required by the make-decision direction result; verify-code outcome projection also binds through the existing `code_review` quality fact's nested review ref/hash, without adding a new fact or fallback selector. The integration-review subject now derives ACs from the formal acceptance section, so upstream alias text such as `AC-08` cannot create a false extra current criterion; its regression test is `tests/contract/integration-review-subject.test.mjs`. Follow-on T006 implementation added the test-owned `tests/contract/acceptance-execution-producer.mjs` and focused contract test, plus move-map registrations. The producer uses the existing private service boundary, `execFile` with `shell:false`, one declared child invocation for valid mappings, exact canonical `{entries}` rows, and non-passing rows for missing/invalid mappings and child/report failures; it does not read task state or select latest records.
- **executed_commands**：The exact seven-file T005/T006 command was rerun without the prior 900s outer cutoff: `npx vitest run tests/contract/decision-convergence-depth.test.mjs tests/contract/requirement-convergence-regression.test.mjs tests/contract/stage-completion.test.mjs tests/contract/test-runtime-profile.test.mjs tests/e2e/vnext-five-stage-current.test.mjs tests/integration/vnext-delivery-close.test.mjs tests/integration/vnext-official-stage-run.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` — exit `0`, 7 files, 237 passed, 1 skipped, duration `1717.39s`. The official-stage file passed 94/94 in 743014ms; the current five-stage E2E passed 24/24 with 1 skipped in 459885ms; delivery-close passed 29/29 in 442689ms; the remaining contract files passed 114/114. The current integration-subject regression command `npx vitest run tests/contract/integration-review-subject.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` exited `0` with 8/8 passed. The new focused producer command `npx vitest run tests/contract/acceptance-execution-producer.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` exited `0` with 12/12 passed. `node --check` for both producer files, an actual package-local Vitest JSON reporter smoke through `accept`, and `git diff --check` all exited `0`. No unbounded/full regression was run after the producer change.
- **evidence_refs**：The exact GREEN run is captured in the current execution record, but no immutable `quality/tests/build-code/pairs/T005-T006/green.json` was written; the pair remains incomplete because T005 has no valid immutable RED record. The new producer test output was observed locally but no canonical pair sidecar was fabricated.
- **covered_ac**：Focused GREEN checks cover `AC-STATE-001`, `AC-PROOF-001`, `AC-CLOSE-001`, `AC-CLOSE-002`, `AC-REVISION-001`, `AC-REPAIR-001`, `AC-FLOW-001`, and `AC-GOV-001`; the exact aggregate oracle remains incomplete because the bounded command was interrupted.
- **review_fact**：P3 phase review remains unavailable; the earlier current-material attempt has no terminal provider result, and the only permitted retry after the task-fact revision was blocked before dispatch with `REVIEW_RETRY_BUDGET_EXHAUSTED` / `budget_exceeded` (`phase` count 1). The current outer runtime still reports `integration_review` and authenticated build-code stage outcome as missing; no current authenticated independent review result was produced.
- **completed_at**：N/A — exact GREEN now completes, but the immutable T005 RED pair, authenticated current stage-outcome/review chain, and a valid AC-to-Vitest mapping in the current T008 input are still missing.
- **执行事实**：Implementation and exact aggregate GREEN evidence are present. The seven-file oracle completed with 237 passed and 1 skipped after 1717.39s; no target assertion or environment failure occurred. A schema-consumer regression was repaired by extending the existing result schema (not creating a new schema), and the verify-code status path now accepts only a current code-review fact whose nested review ref/hash exactly matches the candidate outcome; mismatches remain unbound. The focused T006 producer contract is green (12/12) and the real package-local Vitest JSON shape was consumed successfully for one mapped assertion. A broad existing acceptance-tier file run was started but stopped at exit `130` after exceeding the bounded interactive window; its single affected service-launcher case was rerun separately and passed (`1 passed, 54 skipped`, exit `0`). The build-plan repair now supplies an explicit 21-entry `acceptance_criterion_map`; entries requiring provider/manual facts remain explicitly `status: unavailable`, while code-backed entries use exact test-file/full-name selectors. T006 remains `in_progress` because the required immutable T005 RED/GREEN pair, authenticated current stage-outcome/review chain, and fresh T008 aggregate are not complete.

#### T007 — EVIDENCE：构造当前证据请求

- **ID**：T007
- **Phase**：Phase P3 — `outline_closed` 与既有验收聚合
- **goal**：在 FINAL 前产生可执行 DAG 证据路径；只索引真实事实，缺失 manual evidence 保持 unavailable/incomplete。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"decision","ref":"specs/workflowhub-make-decision-hardening/decision-log.md","hash":"935c4b60ef18443fcd50b2269a0d1cf4214c0a3d8baf20d12636ff595d3a99c5","id":"D-001-D-029"},{"artifact_kind":"spec","ref":"specs/workflowhub-make-decision-hardening/spec.md","hash":"c96c2d469855fa34d63f9dd8212a57f9593417924011862389d5869ee8252ba3","id":"FR-EVIDENCE"},{"artifact_kind":"plan","ref":"specs/workflowhub-make-decision-hardening/plan.md","hash":"daaa110747a397562c6487da1f16118ac1aa904ae2ce1b7529282d9cf679d8e6","id":"plan-task.v4"}]`
- **source_refs / decision_refs**：AC-REVIEW-001、AC-CONFIRM-001、AC-CONFLICT-001、AC-FLOW-001、AC-FLOW-002、AC-TALK-001、AC-ACCEPT-001、AC-GOV-001
- **输入**：T002/T004/T006 GREEN refs、fixed direction/detail fixtures、fixed historical sample、existing dispatch/workflow/governance surfaces、existing make-decision Talk/interaction aggregate，以及 current runtime-profile/test-routing facts。
- **依赖**：T002、T004、T006
- **并行**：否 — bounded evidence production precedes FINAL
- **FR**：FR-REVIEW-001、FR-CONFIRM-001、FR-CONFLICT-001、FR-ACCEPT-001、FR-FLOW-001、FR-FLOW-002、FR-GOV-001
- **AC**：AC-REVIEW-001、AC-CONFIRM-001、AC-CONFLICT-001、AC-ACCEPT-001、AC-FLOW-001、AC-FLOW-002、AC-TALK-001、AC-GOV-001
- **AC role**：primary
- **动作**：create only the request: record current independent direction/detail review、historical scoring、dispatch/workflow/governance census、real existing interaction refs，以及 current runtime-profile/test-routing 的 `permissions`、`capability_proof`、`behavior_fingerprint`。Capability proof `unavailable` 必须原样保留，不能满足 AC 或转 pass。Actual conflict/grouped-confirmation/Talk/Grill samples 仍由 main session 提供真实事实；不伪造未来用户回复。
- **精确文件**：`quality/tests/build-code/T007/acceptance-request-repaired-current.json`
- **boundary**：execution-evidence request only; no production/test/control-plane ownership。
- **输出**：content-addressable receipts-only public-run request bytes listing the authenticated current refs; the earlier malformed request remains immutable history。
- **Knowledge**：evidence production records facts; it does not implement behavior or fabricate manual interaction。
- **verification_role**：N/A — non-behavior change: evidence request production
- **paired_task**：N/A — evidence production is non-behavior
- **gate_cmd**：`node --input-type=module -e "import fs from 'node:fs';const p='quality/tests/build-code/T007/acceptance-request-repaired-current.json';const x=JSON.parse(fs.readFileSync(p,'utf8'));const allowed=['attempt_id','receipts'];if(!x||typeof x!=='object'||Object.keys(x).some(k=>!allowed.includes(k))||typeof x.attempt_id!=='string'||!x.receipts||typeof x.receipts!=='object'||Object.keys(x.receipts).some(k=>!['implementation','tests','review','stage_outcomes'].includes(k)))process.exit(1)"`
- **expected_exit**：0
- **oracle**：`ORACLE-EVIDENCE {"pass":"The request cites real refs and hashes for reviews, scoring, censuses, interactions and current runtime-profile/test-routing facts; every absent manual or capability fact remains explicitly unavailable/incomplete and no pass or confirmation is invented."}`
- **evidence_path**：`quality/tests/build-code/T007/acceptance-request-repaired-current.json`
- **STOP**：invented user confirmation, unavailable capability proof converted to pass, new runner/control plane, env/latest scan, or implementation/test edits。
- **recovery**：repair evidence inputs and rewrite request bytes; preserve prior immutable attempts downstream。
- **task risk**：static evidence impersonates actual manual interaction。
- **test tier / test method**：feature / evidence construction; non_ui。
- **scenarios / commands / expected exit / oracle**：fixed reviews, independent history, census, real-or-unavailable interactions；same gate_cmd；exit 0；ORACLE-EVIDENCE。
- **fixtures_services**：fixed repo fixtures and existing interaction aggregate only；no browser/network。
- **coverage limits**：cannot create future user confirmation or prove natural identity。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：Created the task-relative `quality/tests/build-code/T007/acceptance-request.json` with the declared command acceptance scenario, available evidence refs plus hashes, and explicit unavailable/manual gaps. Final request SHA-256: `596dfde059e6798d319584a980ebea872cf6f8f0d691bf4a819b4d5917b5a495`.
- **executed_commands**：The T007 JSON parse gate exited `0`; it found one `acceptance_data` scenario and the request remained valid JSON after the evidence-list correction.
- **evidence_refs**：`quality/tests/build-code/T007/acceptance-request.json` (request bytes; hash above).
- **covered_ac**：Primary evidence-request production for `AC-REVIEW-001`, `AC-CONFIRM-001`, `AC-CONFLICT-001`, `AC-ACCEPT-001`, `AC-FLOW-001`, `AC-FLOW-002`, `AC-TALK-001`, and `AC-GOV-001`; no manual fact was promoted to pass.
- **review_fact**：N/A — evidence-request construction is non-behavior work; independent review remains unavailable.
- **completed_at**：`2026-09-10T03:49:13+08:00`
- **执行事实**：T007 original request construction completed and remains immutable history. A same-task material repair then produced `acceptance-request-repaired.json` (SHA-256 `9b9fb881301e03254b3b7dc05fecb8ba5a08ac7fbec391a556d540399f138c47`) with only the public `run` input fields (`attempt_id` and authenticated `receipts`); it deliberately remains a request record, not an acceptance result or confirmation. The launcher must resolve this explicit quality ref through the authenticated task store when no worktree copy exists.

#### T008 — FINAL：既有 acceptance execution 聚合

- **ID**：T008
- **Phase**：Phase P3 — `outline_closed` 与既有验收聚合
- **goal**：通过 existing build-code acceptance execution/aggregate route 聚合全部 21 AC；缺失不转 pass，同输入不重复执行。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"decision","ref":"specs/workflowhub-make-decision-hardening/decision-log.md","hash":"935c4b60ef18443fcd50b2269a0d1cf4214c0a3d8baf20d12636ff595d3a99c5","id":"D-001-D-029"},{"artifact_kind":"spec","ref":"specs/workflowhub-make-decision-hardening/spec.md","hash":"c96c2d469855fa34d63f9dd8212a57f9593417924011862389d5869ee8252ba3","id":"FR-ALL"},{"artifact_kind":"plan","ref":"specs/workflowhub-make-decision-hardening/plan.md","hash":"daaa110747a397562c6487da1f16118ac1aa904ae2ce1b7529282d9cf679d8e6","id":"plan-task.v4"}]`
- **source_refs / decision_refs**：all 16 FR / all 21 AC
- **输入**：T002/T006 GREEN refs and T007 request/hash; T006 implementation/tests are read-only verification inputs。
- **依赖**：T002、T006、T007
- **并行**：否 — final aggregate consumes all producers
- **FR**：FR-OUTLINE-001、FR-OUTLINE-002、FR-SNAPSHOT-001、FR-REVIEW-001、FR-STATE-001、FR-CONFIRM-001、FR-PROOF-001、FR-CLOSE-001、FR-REVISION-001、FR-CONFLICT-001、FR-REPAIR-001、FR-ACCEPT-001、FR-SOURCE-001、FR-FLOW-001、FR-FLOW-002、FR-GOV-001
- **AC**：AC-OUTLINE-001、AC-OUTLINE-002、AC-SNAPSHOT-001、AC-REVIEW-001、AC-REVIEW-002、AC-STATE-001、AC-STATE-002、AC-CONFIRM-001、AC-PROOF-001、AC-CLOSE-001、AC-CLOSE-002、AC-REVISION-001、AC-CONFLICT-001、AC-REPAIR-001、AC-ACCEPT-001、AC-SOURCE-001、AC-SOURCE-002、AC-FLOW-001、AC-FLOW-002、AC-TALK-001、AC-GOV-001
- **AC role**：supporting aggregate only; single primaries remain the matrix producers
- **动作**：verification-only；use exact existing outer gate with T007 request and the existing private service-tier `acceptance_data.execution` calling T006's `tests/contract/acceptance-execution-producer.mjs:accept` with the fixed selector-targeted Vitest argv and AC mapping。Compare exact 21-ID set and preserve actual statuses；同时校验 runtime-profile/test-routing identity、permissions、capability proof、behavior fingerprint。Unavailable capability proof 保持 unavailable。Permit retry only after repair changes request bytes/hash；preserve every immutable failed attempt/raw stream。
- **精确文件**：`quality/tests/build-code/T007/acceptance-request-repaired-current.json`（read-only input; no implementation ownership or modification）
- **boundary**：no file ownership, public runner, production control plane, or test implementation; T008 only consumes the T006 producer and does not modify its module/input。
- **输出**：content-addressed `acceptance_execution` ref/hash, immutable attempts/raw streams, 21 actual AC statuses and remaining risks in execution facts only。
- **Knowledge**：T008 aggregates primary facts without becoming another primary producer。
- **verification_role**：N/A — non-behavior change: aggregate verification
- **paired_task**：N/A — non-behavior aggregate has no pair
- **gate_cmd**：`node tools/cli/stage-runtime.mjs run --action=execute --stage=build-code --project=workflowhub --task=workflowhub-make-decision-hardening --input=quality/tests/build-code/T007/acceptance-request-repaired-current.json`
- **expected_exit**：0
- **oracle**：`ORACLE-FINAL {"pass":"The existing acceptance route returns exactly 21 unique current AC entries with matching assertions, current runtime-profile/test-routing facts and evidence; missing, duplicate, unknown, unavailable capability proof, assertion mismatch, or redundant same-input retry fails without rewriting actual statuses."}`
- **evidence_path**：`quality/tests/build-code/T007/acceptance-request-repaired-current.json`
- **STOP**：new public runner/command, latest/env scan, repeated same-hash aggregate, malformed request/evidence, missing/duplicate AC, unavailable capability proof converted to pass, or boundary expansion。
- **recovery**：retain immutable failure/raw streams; repair owning task; T007 emits changed request bytes/hash before one new T008 attempt; rollback P3→P2→P1。
- **task risk**：aggregate self-report, stale evidence, or retry overwrites failure history。
- **test tier / test method**：feature / service-tier acceptance through existing backend aggregate route and the T006-owned canonical report producer；non_ui/not_required。
- **scenarios / commands / expected exit / oracle**：fixed outer argv; service producer runs the inner selector-targeted Vitest argv once with 120000ms outer timeout; signal/nonzero/timeout/cancel/malformed report/missing/duplicate/unknown AC/assertion mismatch/same-input retry => nonzero while preserving actual entries；ORACLE-FINAL。
- **fixtures_services**：T007 task-relative request, immutable pair manifests, T006 producer report fixtures and existing runtime raw-evidence cleanup；no live browser/network。
- **coverage limits**：no browser/fullstack/UI/other host; unavailable manual evidence stays incomplete。
- **acceptance_role**：acceptance
- **ui_scope**：non_ui
- **e2e_scope**：not_required
- **acceptance_data**：`[{"source":"specs/workflowhub-make-decision-hardening/spec.md#11-验收标准 and plan AC-level verification matrix","sample":"quality/tests/build-code/T007/acceptance-request-repaired-current.json produced by T007 with immutable pair manifests, runtime-profile/test-routing facts and real-or-unavailable evidence refs","scenario":"existing outer build-code acceptance route calls one test-owned service producer once; the producer invokes the fixed package-local Vitest selector-targeted union without a shell, parses its machine report, emits exactly 21 canonical AC entries from the declared AC mapping, and mechanically preserves unavailable capability proof/manual facts as non-passing; another attempt requires changed request hash","tier":"service","execution":{"module_ref":"tests/contract/acceptance-execution-producer.mjs","export_name":"accept","input":{"command":"node","args":["node_modules/vitest/vitest.mjs","run","tests/contract/review-materials-contract.test.mjs","tests/contract/decision-convergence-depth.test.mjs","tests/contract/requirement-convergence-regression.test.mjs","tests/contract/stage-completion.test.mjs","tests/e2e/vnext-five-stage-current.test.mjs","tests/contract/dsh-requirement-source.test.mjs","tests/dsh-transcript.test.mjs","tests/stage-review-cost-policy.test.mjs","--testNamePattern","RED: binds direction to current questions-only OI and detail to terminal OI duties|only accepts a structured four-dimension record with answers, evidence references, and executable acceptance|rejects unlisted answer-bearing fields in the questions-only direction snapshot|rejects one shared proving anchor across multiple AC evidence entries|keeps outline_closed missing when any close conjunct is absent|marks requirement coverage missing when a disposition is invalid or a required dimension is absent|requires the current OI authority, questions-only direction snapshot, terminal fields, no open items, and core interaction proof|does not accept a core OI's self-reported interaction ref without the current aggregate|does not accept an aggregate that omits or relabels the core OI group/disposition|does not consume stale facts|persists a resolved repair from the authenticated stage outcome without a clean re-review|keeps only real user messages and computes contiguous order and content hashes|rejects truncated checksums and checksum mismatches|keeps planning advisories stage-owned and wh-review as the provider review","--poolOptions.forks.singleFork","--no-fileParallelism","--reporter=json"],"acceptance_criterion_ids":["AC-OUTLINE-001","AC-OUTLINE-002","AC-SNAPSHOT-001","AC-REVIEW-001","AC-REVIEW-002","AC-STATE-001","AC-STATE-002","AC-CONFIRM-001","AC-PROOF-001","AC-CLOSE-001","AC-CLOSE-002","AC-REVISION-001","AC-CONFLICT-001","AC-REPAIR-001","AC-ACCEPT-001","AC-SOURCE-001","AC-SOURCE-002","AC-FLOW-001","AC-FLOW-002","AC-TALK-001","AC-GOV-001"],"acceptance_criterion_map":[{"acceptance_criterion_id":"AC-OUTLINE-001","selectors":[{"test_file":"tests/contract/review-materials-contract.test.mjs","full_name":"RED: binds direction to current questions-only OI and detail to terminal OI duties"}]},{"acceptance_criterion_id":"AC-OUTLINE-002","selectors":[{"test_file":"tests/contract/decision-convergence-depth.test.mjs","full_name":"only accepts a structured four-dimension record with answers, evidence references, and executable acceptance"}]},{"acceptance_criterion_id":"AC-SNAPSHOT-001","selectors":[{"test_file":"tests/contract/decision-convergence-depth.test.mjs","full_name":"rejects unlisted answer-bearing fields in the questions-only direction snapshot"}]},{"acceptance_criterion_id":"AC-REVIEW-001","status":"unavailable","reason":"current independent review remains unavailable; no provider pass is claimed"},{"acceptance_criterion_id":"AC-REVIEW-002","selectors":[{"test_file":"tests/contract/review-materials-contract.test.mjs","full_name":"rejects one shared proving anchor across multiple AC evidence entries"}]},{"acceptance_criterion_id":"AC-STATE-001","selectors":[{"test_file":"tests/contract/decision-convergence-depth.test.mjs","full_name":"keeps outline_closed missing when any close conjunct is absent"}]},{"acceptance_criterion_id":"AC-STATE-002","selectors":[{"test_file":"tests/contract/requirement-convergence-regression.test.mjs","full_name":"marks requirement coverage missing when a disposition is invalid or a required dimension is absent"}]},{"acceptance_criterion_id":"AC-CONFIRM-001","status":"unavailable","reason":"manual grouped-confirmation sample is unavailable"},{"acceptance_criterion_id":"AC-PROOF-001","selectors":[{"test_file":"tests/contract/decision-convergence-depth.test.mjs","full_name":"requires the current OI authority, questions-only direction snapshot, terminal fields, no open items, and core interaction proof"}]},{"acceptance_criterion_id":"AC-CLOSE-001","selectors":[{"test_file":"tests/contract/decision-convergence-depth.test.mjs","full_name":"does not accept a core OI's self-reported interaction ref without the current aggregate"}]},{"acceptance_criterion_id":"AC-CLOSE-002","selectors":[{"test_file":"tests/contract/decision-convergence-depth.test.mjs","full_name":"does not accept an aggregate that omits or relabels the core OI group/disposition"}]},{"acceptance_criterion_id":"AC-REVISION-001","selectors":[{"test_file":"tests/contract/stage-completion.test.mjs","title":"does not consume stale facts"}]},{"acceptance_criterion_id":"AC-CONFLICT-001","status":"unavailable","reason":"manual bounded conflict sample is unavailable"},{"acceptance_criterion_id":"AC-REPAIR-001","selectors":[{"test_file":"tests/e2e/vnext-five-stage-current.test.mjs","full_name":"persists a resolved repair from the authenticated stage outcome without a clean re-review"}]},{"acceptance_criterion_id":"AC-ACCEPT-001","status":"unavailable","reason":"fixed historical sample independently scored is unavailable"},{"acceptance_criterion_id":"AC-SOURCE-001","selectors":[{"test_file":"tests/contract/dsh-requirement-source.test.mjs","full_name":"keeps only real user messages and computes contiguous order and content hashes"}]},{"acceptance_criterion_id":"AC-SOURCE-002","selectors":[{"test_file":"tests/dsh-transcript.test.mjs","full_name":"rejects truncated checksums and checksum mismatches"}]},{"acceptance_criterion_id":"AC-FLOW-001","status":"unavailable","reason":"required workflow/manual samples are unavailable"},{"acceptance_criterion_id":"AC-FLOW-002","status":"unavailable","reason":"explicit dispatch evidence census is unavailable"},{"acceptance_criterion_id":"AC-TALK-001","status":"unavailable","reason":"manual Talk/Grill interaction sample is unavailable"},{"acceptance_criterion_id":"AC-GOV-001","selectors":[{"test_file":"tests/stage-review-cost-policy.test.mjs","full_name":"keeps planning advisories stage-owned and wh-review as the provider review"}]}]},"timeout_ms":120000}}]`

##### 执行状态填写区（唯一完成权威）
- [ ] **任务完成**
- **status**：`in_progress`
- **actual_changes**：No production/test source changed; verification was attempted through the existing outer route.
- **executed_commands**：The exact T008 outer command with `quality/tests/build-code/T007/acceptance-request.json` exited `1` because the current `stage-runtime run` input contract rejects the request's required top-level `acceptance_data` and `evidence` fields (`run input has unknown fields`). A separate valid `{}` exploratory run exited `0` but returned `status=in_progress`, `quality_status=incomplete`, `stage_outcome_status=unavailable`, and `acceptance_execution=missing`; it did not prove acceptance.
- **evidence_refs**：Current missing aggregate `quality/evidence/acceptance/build-code/acceptance_execution-d55a0759148e94e543b0be674bbdeb93e277e8cb4d358cf248fa7dee33ae45fa.json`; corresponding quality fact `quality/facts/197208a6edafa9cb16d62c3d03f1a18e16339cec80624c1777768648c2175779.json`; stage reflection availability `quality/evidence/stage-reflection-availability/5a7f7918ad6b2907615636baa4516f4b732a7c72d599aa5b7a43cc2c5d0e1535.json`.
- **covered_ac**：The 21-criterion aggregate remains `missing`; the runtime preserved the individual current AC facts as `missing` and did not synthesize a pass.
- **review_fact**：Current integration review and authenticated build-code stage outcome are missing; no review pass is claimed.
- **completed_at**：N/A — acceptance execution was not authenticated.
- **执行事实**：T008 is not complete. The original outer attempt exited with `run input has unknown fields: acceptance_data, evidence`; that malformed request is preserved. The repaired request now contains only `attempt_id` and authenticated `receipts`, and the launcher has an explicit task-store fallback for the canonical `quality/...` input ref. The current material now includes an explicit mapping for all 21 ACs; code-backed selectors are exact Vitest file/full-name pairs and provider/manual gaps remain `unavailable`. The downstream command now uses one selector-targeted Vitest union containing only the 14 mapped code-backed assertions, with the seven unavailable/manual rows preserved as non-passing; it still requires UTF-8 JSON with exactly one assertion-bearing entry for each AC, and the one permitted fresh outer attempt must preserve unavailable/manual rows as non-passing rather than claim acceptance.


### Verify
P3 paired command uses ORACLE-P3-HARDENING，并回归 main runtime-profile/test-routing/acceptance-currentness；T007 produces ORACLE-EVIDENCE request facts；T008 outer gate uses the existing stage-runtime acceptance route and preserves unavailable capability proof。

### Knowledge
Tests cannot impersonate review/manual facts; missing stays unavailable/incomplete while actual per-AC states remain preserved。`decision-log.md:921-962` stale tail prose is an audit-history inconsistency owned by the completed make-decision outcome/current frozen spec, not an implementation unknown; build-plan neither repairs nor rewrites it。

### STOP
New runner, caller selector, latest/env scan, 21 repeated aggregate commands, sixth conjunct, malformed/duplicate/missing AC, unavailable capability proof 转 pass，或破坏 main 新契约。

### Done
Pending until actual targeted GREEN, current explicit evidence and existing acceptance aggregate exist; review_fact is N/A—not executed。

### Risks and rollback
Aggregate self-report and consumer drift; revert exact P3 files first and rerun exact P3 command/oracle, preserving actual evidence before P2 rollback。

## 4. Final current-snapshot aggregate strategy

- **tier / method**：feature / existing service-tier acceptance execution through the T006-owned canonical report producer; non_ui, e2e_scope=not_required。
- **scenarios**：exact 21 AC set, one selector-targeted test union once, explicit current review/manual refs, current runtime-profile/test-routing facts, unavailable capability proof, failure/cancel/timeout/malformed/duplicate/missing cases。
- **command**: `node tools/cli/stage-runtime.mjs run --action=execute --stage=build-code --project=workflowhub --task=workflowhub-make-decision-hardening --input=quality/tests/build-code/T007/acceptance-request-repaired-current.json`; the declared scenario calls `tests/contract/acceptance-execution-producer.mjs:accept` through the existing private service executor with the selector-targeted Vitest union.
- **expected exit**：0 only for complete matching actual facts
- **oracle**：ORACLE-FINAL; exact set equality, comparable expected/actual, current runtime-profile/test-routing binding, unavailable proof remains unavailable, no self-reported pass trust。
- **fixtures_services**：task-relative request, immutable pair manifests and the T006 producer's package-local Vitest report fixtures; existing runtime owns service subprocess cleanup/raw evidence。
- **evidence_path**：`quality/tests/build-code/T007/acceptance-request-repaired-current.json`; returned content-addressed execution ref/hash is recorded later only in T008 execution facts。
- **coverage limits**：no UI/browser/fullstack/other host; manual unavailable remains incomplete。
- **STOP**：new public runner/command, inferred latest/env input, repeated same-hash command, missing/duplicate AC or stale evidence。
- **execution_contract**：outer gate keeps the existing acceptance-route argv; inner acceptance_data uses the existing service tier to call one fixed T006 producer with one selector-targeted Vitest argv and 120000ms timeout, never stage-runtime recursion; signal/nonzero/timeout/cancel/malformed report makes aggregate nonzero while preserving each immutable attempt, actual AC status and raw streams。Retry is accepted only after repair changes request content/hash; same-input retry is rejected。

## AC-level verification matrix

| AC | Primary method/oracle | Producer | Missing semantics |
| --- | --- | --- | --- |
| AC-OUTLINE-001 | P2 contract / ORACLE-OI-CONTRACT | T004 | incomplete |
| AC-OUTLINE-002 | P2 contract / ORACLE-OI-CONTRACT | T004 | incomplete |
| AC-SNAPSHOT-001 | P2 contract / ORACLE-OI-CONTRACT | T004 | incomplete |
| AC-REVIEW-001 | current independent fixture review / ORACLE-EVIDENCE | T007 | unavailable/incomplete |
| AC-REVIEW-002 | substitution matrix / ORACLE-OI-CONTRACT | T004 | incomplete |
| AC-STATE-001 | P3 subtraction / ORACLE-OUTLINE-CLOSED | T006 | missing |
| AC-STATE-002 | P2 enum / ORACLE-OI-CONTRACT | T004 | incomplete |
| AC-CONFIRM-001 | actual grouped-confirmation sample, main-session owner / ORACLE-EVIDENCE | T007 | unavailable/incomplete |
| AC-PROOF-001 | P3 proof matrix / ORACLE-OUTLINE-CLOSED | T006 | missing |
| AC-CLOSE-001 | P3 baseline / ORACLE-OUTLINE-CLOSED | T006 | missing |
| AC-CLOSE-002 | P3 omissions / ORACLE-OUTLINE-CLOSED | T006 | missing |
| AC-REVISION-001 | stale fixture / ORACLE-OUTLINE-CLOSED | T006 | missing |
| AC-CONFLICT-001 | actual bounded conflict sample, main-session owner / ORACLE-EVIDENCE | T007 | unavailable/incomplete |
| AC-REPAIR-001 | serialized repair / ORACLE-OUTLINE-CLOSED | T006 | incomplete |
| AC-ACCEPT-001 | fixed historical sample independently scored / ORACLE-EVIDENCE | T007 | unavailable/incomplete |
| AC-SOURCE-001 | bridge subprocess / ORACLE-SOURCE | T002 | unavailable/zero messages |
| AC-SOURCE-002 | zstd matrix / ORACLE-SOURCE | T002 | unavailable/zero messages |
| AC-FLOW-001 | workflow census plus actual required samples / ORACLE-EVIDENCE | T007 | unavailable/incomplete |
| AC-FLOW-002 | dispatch evidence census / ORACLE-EVIDENCE | T007 | unavailable/incomplete |
| AC-TALK-001 | actual existing interaction-aggregate sample, main-session owner / ORACLE-EVIDENCE | T007 | unavailable/incomplete |
| AC-GOV-001 | dispatch/workflow/governance exact-file census / ORACLE-EVIDENCE | T007 | incomplete |

These rows are the single-primary mapping: T001/T003/T005 are supporting RED producers and T008 is supporting aggregate for all 21, never an additional primary. FINAL compares this exact set with spec and aggregate output; each ID must occur exactly once。

## Dependency Graph

- **order**：T001→T002；T003→T004 parallel to P1；T005(T004)→T006；T007(T002,T004,T006)；T008(T002,T006,T007)。

```text
T001 → T002 ───────────────────────┐
                                   ├→ T007 → T008
T003 → T004 → T005 → T006 ─────────┘   ↑
              └────────────────────────┘
```

- **Ownership proof**：P1 owns only host-source files, P2 only OI/review files, T005/T006 own P3 completion/targeted-integration files plus the T006 test-owned canonical report producer, T007 owns only `quality/tests/build-code/T007/acceptance-request-repaired-current.json`, and T008 owns no file；Phase Files are byte-for-byte identical to plan and each task exact-file list is a subset；no public acceptance runner or production control plane exists。
- **Deletion proof**：host adapter remains until host-native equivalent migrates bridge then deletes it；all existing convergence predicates/producers and the shared analyzer remain。Only `outline_closed` may later be removed when a reviewed equivalent passes current consumer census, five-field equivalence and the same oracle, with atomic switch and no dual authority。

## Final Boundary Check

- [ ] Eight tasks, three phases, no unknown dependency or cross-phase file ownership.
- [ ] Every behavior pair has same command/oracle/fixture identity and immutable red/green under one pair manifest.
- [ ] T007 produces one explicit task-relative request; T008 uses the existing acceptance route, aggregates 21 AC exactly once, and rejects redundant same-input retry.
- [ ] All pending completion areas say review_fact N/A—not executed; no execution/review/publication is implied.
