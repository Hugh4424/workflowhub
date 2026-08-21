# 任务清单：WorkflowHub 标准五阶段执行与安全收口

- **Input**：`decision-log.md`、`spec.md`、`plan.md`
- **Template version**：`plan-task.v3`

> 每张卡的“唯一完成权威”仅指该卡内部 `status`/复选框/执行摘要不得双写；它不是 runtime stage completion 权威，也不是工作许可证。runtime 完成仍只由认证 facts 与 `completion-predicates.mjs` 派生；tasks 材料变更后，旧质量事实按 current identity 正常 stale，再对最终材料生成当前证据。

## Phase P1 — 统一 session、多轮交互和阶段 outcome

### Goal

用现有 transcript/session 事实证明全需求 Grill、多轮交互、当前确认与真实 `not_applicable`。

### Files

- **NEW**：N/A — 复用现有 session/interaction tests
- **MODIFY**：`runtime/evidence/fact-collector.mjs`、`runtime/evidence/codex-transcript-adapter.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`skills/grill-with-docs/SKILL.md`、`skills/grill-with-docs/skill-bundle.json`、`tests/m15-codex-session-hook.test.mjs`、`tests/contract/stage-interaction-batching.test.mjs`、`tests/contract/stage-order-and-host-interaction.test.mjs`
- **DO NOT TOUCH**：`tools/host/workflowhub-codex-session-state.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`、`runtime/adapters/local-skill-resolver.mjs`

### Tasks

#### T001 — RED：锁住全需求 Grill、多轮和真实状态缺口

- **ID**：T001
- **Phase**：Phase P1 — 统一 session、多轮交互和阶段 outcome
- **goal**：让当前实现因专项 Grill、重复多轮或拒绝 `not_applicable` 命中目标断言。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"0d80e9b52f4b9bb95216b5bbddd121fb75072cfd0a27f217e5385c31ee8f3570","id":"FR-GRL-001"},{"artifact_kind":"plan","ref":"plan.md","hash":"fe4bd99fca3dab5eb6ce2a989f4ce357e1b6cda8b64aaab18b4dc3618f2acabc","id":"DEC-001"}]`
- **source_refs / decision_refs**：R-001,R-002,R-003,R-004,R-012,R-013,D-003,D-009 → FR-REQ-001,FR-INT-001,FR-GRL-001 / AC-001,AC-002,AC-004
- **输入**：当前 transcript projection、interaction lifecycle、Grill skill/workflow 和 adapter。
- **依赖**：none
- **并行**：否 — first RED for this behavior
- **FR**：FR-REQ-001,FR-INT-001,FR-GRL-001,FR-STG-003
- **AC**：AC-001,AC-002,AC-004
- **动作**：只扩展现有测试：从注册消息五类生成候选轴，删除整个消息类/整个轴，测试高/中轴遗漏或无 D/FR/AC 绑定；再测全需求 Grill 缺类、合法三轮与第二 lifecycle、`not_applicable`。正式 handler 留给 P2，不重复写文件。
- **精确文件**：`tests/m15-codex-session-hook.test.mjs`、`tests/contract/stage-interaction-batching.test.mjs`、`tests/contract/stage-order-and-host-interaction.test.mjs`
- **boundary**：files: 上述三个测试；symbols/regions: interaction/session/outcome describe blocks only。
- **输出**：ORACLE-SESSION 的目标 RED 输出。
- **Knowledge**：host 已支持多 event；bridge 原样转发；adapter 是唯一 rounds 聚合 owner。
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`npx vitest run tests/m15-codex-session-hook.test.mjs tests/contract/stage-interaction-batching.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-SESSION` — 新断言必须因当前专项 Grill/重复 lifecycle/状态错配失败，环境与 fixture 先通过。
- **evidence_path**：`quality/tests/T001-session-red.json`
- **STOP**：命令损坏、fixture 失败、需要改 host/bridge 或第五份材料时停止。
- **recovery**：build-code 只修测试 fixture 或返回 plan，不弱化目标断言。
- **task risk**：RED 被旧无关失败污染。
- **test tier / test method**：fullstack contract — 同时跨 skill、host facts 与 runtime adapter。
- **scenarios / commands / expected exit / oracle**：完整 Grill/漏大类、三轮/第二 lifecycle、current/错绑确认、Clarify/skill/stage/close 四类适用域；同 gate；exit 1；ORACLE-SESSION。
- **fixtures_services**：现有临时 session/task fixtures；测试负责清理。
- **coverage limits**：不验证仓库外 renderer 焦点和外部 provider。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：扩展三份 P1 聚焦测试，锁住 transcript/session 身份、全需求覆盖、合法多轮和非法重复 lifecycle 的 RED 目标。
- **executed_commands**：`npx vitest run tests/m15-codex-session-hook.test.mjs tests/contract/stage-interaction-batching.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`（预期 exit 1，实际 exit 1）。
- **evidence_refs**：`[{"ref":"quality/tests/T001-session-red.json","sha256":"7318fde29551f75c63adb397d66b2a816cc2fc1500d4b31e3bebdd9c1a8e942e"}]`
- **covered_ac**：`AC-001`, `AC-002`, `AC-004`
- **review_fact**：与 T002 配对；P1 正式审查由当前 Phase review attempt 记录，审查未进入 provider，原因是当前未提交 Phase packet 超过 330 KiB，保留为 `unavailable`，不改写成通过。
- **completed_at**：`2026-08-20T16:02:07+08:00`
- **执行事实**：目标 RED 命中 4 个缺口，环境与既有 fixture 通过。

#### T002 — GREEN：复用 transcript 并统一 rounds、Grill 和状态

- **ID**：T002
- **Phase**：Phase P1 — 统一 session、多轮交互和阶段 outcome
- **goal**：让 T001 同一 oracle 通过，同时保留所有非法交互负例。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"d19e1fe0f71777690a96571d729bd2af56b8821bf133addcfc5d53ef10fe2c00","id":"FR-GRL-001"},{"artifact_kind":"plan","ref":"plan.md","hash":"fcf194a5bae9641c0c1a920555eaeda8f7054f6dc8bf7fb5853d8f714bb40634","id":"DEC-001"}]`
- **source_refs / decision_refs**：R-001,R-002,R-003,R-004,R-012,R-013,D-003,D-009 → FR-REQ-001,FR-INT-001,FR-GRL-001 / AC-001,AC-002,AC-004
- **输入**：T001 目标 RED 与现有 transcript/session interfaces。
- **依赖**：T001
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-REQ-001,FR-INT-001,FR-GRL-001,FR-STG-003
- **AC**：AC-001,AC-002,AC-004
- **动作**：先做 Grill 只读 S3 检查；`fact-collector.mjs` 只认证注册消息 identity/order/hash/覆盖；Grill/make-decision/spec-analyze skill 在独立技能上下文把认证消息分五类并派生候选轴，runtime 只验证输出逐条绑定 message/R/D/FR/AC 和整类遗漏；adapter 把逐轮 lifecycle 聚合进现有 content-addressed interaction receipt，保留 ref/hash/task/snapshot；不新增自然语言引擎、模型通道或持久投影。
- **精确文件**：`runtime/evidence/fact-collector.mjs`、`runtime/evidence/codex-transcript-adapter.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`skills/grill-with-docs/SKILL.md`、`skills/grill-with-docs/skill-bundle.json`、T001 tests
- **boundary**：files: P1 MODIFY；symbols/regions: transcript projection identity, recorder aggregation, Grill exit contract only。
- **输出**：合法路径 completed，非法路径 fail-loud，无新持久对象；主 Agent 手工读取 Grill 输出并在 T002 evidence 中记录 AC-004 的全需求类别核对结论，不能由合同测试自动冒充 manual evidence。
- **Knowledge**：T001 的真实 failure；host/bridge 禁止修改。
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`npx vitest run tests/m15-codex-session-hook.test.mjs tests/contract/stage-interaction-batching.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-SESSION` — 合法多轮/完整 Grill/current 确认/not_applicable 通过，非法负例全部拒绝。
- **evidence_path**：`quality/tests/T002-session-green.json`
- **STOP**：需要新 transcript 实体、修改 host/bridge 或弱化 identity 时停止。
- **recovery**：回退 P1 实现字节，保留 T001/T002 输出。
- **task risk**：聚合边界过宽接受第二 lifecycle。
- **test tier / test method**：fullstack contract — 与 T001 相同。
- **scenarios / commands / expected exit / oracle**：与 T001 相同场景/命令；exit 0；ORACLE-SESSION。
- **fixtures_services**：与 T001 相同；无外部服务。
- **coverage limits**：只验证 WorkflowHub 拥有的卡片语义，不验证真实 UI 焦点。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：认证 registered requirement messages 并仅返回 metadata；由 Codex adapter 统一入口；新增有序 interaction-round validator；adapter 接受带真实 reason 的 `not_applicable` skill outcome；复用当前生命周期/覆盖合同；Grill 先做五类全需求覆盖再做专项退出检查；四份当前材料归位到 `specs/workflowhub-standard-stage-flow-hardening-20260820/`，内容未改。
- **executed_commands**：`npx vitest run tests/m15-codex-session-hook.test.mjs tests/contract/stage-interaction-batching.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`（exit 0，32/32）；canonical capture 同命令写入 `quality/tests/build-code-p1-focused.json`。
- **evidence_refs**：`[{"ref":"quality/tests/T002-session-green.json","sha256":"dc133cc8eecdddc4dedbbb15cc946726128345bd3e32206969a5a9892ad4d7dc"},{"ref":"quality/tests/build-code-p1-focused.json","sha256":"c19374771d230134c6b58bec1364f6859c4d7d51ba864e9e9985d9944f8c6901"},{"ref":"quality/evidence/build-code-phase-P1-card.json","sha256":"94eb2b2b7406853a9231125bf8e49824a4660033f2fabff3273cea791bc5a29f"},{"ref":"quality/reviews/attempts/d10a9020-3d1f-4d9a-8295-bdcc80e05adf/attempt.json","sha256":"37960bf72d3116cdce2b871f3bf4489935ac63d0591f4ad97d52ce32342c97ec"}]`
- **covered_ac**：`AC-001`（requirement identity/coverage）, `AC-002`（real ordered lifecycle）, `AC-004`（full-requirement Grill）
- **review_fact**：P1 phase review attempt `d10a9020-3d1f-4d9a-8295-bdcc80e05adf`，`unavailable/MATERIAL_TOO_LARGE`；未收到 provider findings，未伪造 clean。
- **completed_at**：`2026-08-20T16:06:03+08:00`
- **执行事实**：GREEN 32/32；当前 scope 仍未覆盖 P2 analyzer/completion 消费、P3 review disposition、P4 close、P5 dogfood。

### Verify

- **Target**：AC-001–005/025 和交互 publication seam
- **gate_cmd**：T001/T002 gate
- **expected_exit**：0 after T002
- **evidence_path**：`quality/tests/T002-session-green.json`
- **Oracle**：ORACLE-SESSION

### Knowledge

adapter 是唯一 rounds owner；Grill 全需求矩阵先于专项；transcript 复用已有投影。

### STOP

- 需要 host/bridge 双写、第五份材料或新 public entry 时返回 plan。

### Done

- P1 正反合同通过，review 绑定当前 P1 snapshot，证据可复核。

### Risks and rollback

- **Risk**：旧单轮兼容或 bundle hash 漂移。
- **Prevention**：旧单轮正例和 portable smoke。
- **Rollback / recovery**：只回退 P1 字节，保留质量事实。

## Phase P2 — 前四阶段 analyzer 与本阶段修复闭环

### Goal

producer、outcome 和 completion 使用同一 analyzer 语义；方向变化只失效受影响下游事实。

### Files

- **NEW**：N/A — 复用现有 analyzer/completion tests
- **MODIFY**：`skills/spec-analyze/SKILL.md`、`skills/spec-analyze/skill-bundle.json`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-acceptance-policy.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/evidence/canonical-evidence-validators.mjs`、`runtime/task/task-kernel-implementation.mjs`、`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/five-stage-spec-analyze-wiring.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`
- **DO NOT TOUCH**：`spec.md` 的已确认产品方向、历史 report

### Tasks

#### T003 — RED：锁住四 profile、finding 闭环和 freshness

- **ID**：T003
- **Phase**：Phase P2 — 前四阶段 analyzer 与本阶段修复闭环
- **goal**：证明深层 validator 未接生产、finding 未闭环或旧材料事实仍被消费。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"0d80e9b52f4b9bb95216b5bbddd121fb75072cfd0a27f217e5385c31ee8f3570","id":"FR-ANL-001"},{"artifact_kind":"plan","ref":"plan.md","hash":"fe4bd99fca3dab5eb6ce2a989f4ce357e1b6cda8b64aaab18b4dc3618f2acabc","id":"DEC-001"}]`
- **source_refs / decision_refs**：R-002,R-003,R-005,R-008,R-009,R-011,R-013,D-003,D-004,D-008,D-010,D-011 → FR-INT-001..004,FR-STG-001..002,FR-ANL-001..005,FR-CHG-001..002,FR-SPC-001 / AC-002,AC-003,AC-005..010,AC-013,AC-021,AC-025
- **输入**：四 profile、现有 deep validator、stage runner/material revision、completion predicates。
- **依赖**：T002
- **并行**：否 — P2 consumes P1 outcome identity
- **FR**：FR-INT-001,FR-INT-002,FR-INT-003,FR-INT-004,FR-STG-001,FR-STG-002,FR-ANL-001,FR-ANL-002,FR-ANL-003,FR-ANL-004,FR-ANL-005,FR-CHG-001,FR-CHG-002,FR-SPC-001
- **AC**：AC-002,AC-003,AC-005,AC-006,AC-007,AC-008,AC-009,AC-010,AC-013,AC-021,AC-025
- **动作**：扩展正式 publication 负例：interaction receipt 错 ref/hash/task/snapshot、handler 未逐轮调用 lifecycle validator、三处确认错绑、章节/引用/AC 缺口；前置依赖未闭合时允许后置 implementation/GREEN/失败 test facts 写入，但 completed/handoff/normal completion 必须零写；逐 AC 完整证据链逐字段 missing/错绑/conflicting；另测方向变化、双 writer 和 stale downstream。
- **精确文件**：`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/five-stage-spec-analyze-wiring.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`
- **boundary**：files: 上述测试；symbols/regions: vNext analyzer/completion/freshness cases only。
- **输出**：ORACLE-ANALYZER 目标 RED。
- **Knowledge**：现有 runner 已认证 identity，但 completion 主要未消费；旧 revision 必须 stale。
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`npx vitest run tests/contract/spec-analyze-completeness.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/stage-completion.test.mjs tests/integration/vnext-official-stage-run.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-ANALYZER` — 缺口负例被当前实现错误接受或无法本阶段闭环，且失败来自目标断言。
- **evidence_path**：`quality/tests/T003-analyzer-red.json`
- **STOP**：需要 blocked/reopen/recovery、第二 analyzer store 或修改历史源时停止。
- **recovery**：修 fixture 或返回 plan，不删负例。
- **task risk**：把 report-only 误解为可忽略 completion fact。
- **test tier / test method**：fullstack — skill/workflow producer、runtime consumer、E2E freshness。
- **scenarios / commands / expected exit / oracle**：完整 spec/plan 负例矩阵；Clarify true/false；方向变化触发 Talk/decision-log/确认并使受影响下游 stale，普通实现细节不重编；双 writer 单 winner/loser 零写；四阶段 finding/freshness；同 gate；exit 1；ORACLE-ANALYZER。
- **fixtures_services**：现有临时 task/worktree；测试清理。
- **coverage limits**：不执行外部 provider，不声称 AC-023。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：扩展正式 analyzer/completion 合同，接入四个 stage-end spec-analyze profile、current identity、finding disposition 和同阶段修复语义；不新增 writer、permit、recovery 或第二材料权威。
- **executed_commands**：`npx vitest run tests/contract/spec-analyze-completeness.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/stage-completion.test.mjs tests/integration/vnext-official-stage-run.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；RED exit 1，见 `quality/tests/T003-analyzer-red.json`。
- **evidence_refs**：`[{"ref":"quality/tests/T003-analyzer-red.json","sha256":"e690bce3743321ed5339363aea272e6b5c805b59f15fd2488e64c3d0a1c3b767"}]`
- **covered_ac**：AC-002, AC-003, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-013, AC-021, AC-025
- **review_fact**：与 T004 配对；P2 focused analyzer gate 已完成。
- **completed_at**：2026-08-20
- **执行事实**：目标 RED 命中四类 analyzer/completion 缺口，失败不是 provider 或环境故障。

#### T004 — GREEN：统一 analyzer producer、outcome 和 completion

- **ID**：T004
- **Phase**：Phase P2 — 前四阶段 analyzer 与本阶段修复闭环
- **goal**：让 T003 同一 oracle 通过，quality incomplete 不阻止同 task 修复。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"d19e1fe0f71777690a96571d729bd2af56b8821bf133addcfc5d53ef10fe2c00","id":"FR-ANL-001"},{"artifact_kind":"plan","ref":"plan.md","hash":"fcf194a5bae9641c0c1a920555eaeda8f7054f6dc8bf7fb5853d8f714bb40634","id":"DEC-001"}]`
- **source_refs / decision_refs**：R-002,R-003,R-005,R-008,R-009,R-011,R-013,D-003,D-004,D-008,D-010,D-011 → FR-INT-001..004,FR-STG-001..002,FR-ANL-001..005,FR-CHG-001..002,FR-SPC-001 / AC-002,AC-003,AC-005..010,AC-013,AC-021,AC-025
- **输入**：T003 RED 和现有 spec_analyze outcome/material identity。
- **依赖**：T003
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-INT-001,FR-INT-002,FR-INT-003,FR-INT-004,FR-STG-001,FR-STG-002,FR-ANL-001,FR-ANL-002,FR-ANL-003,FR-ANL-004,FR-ANL-005,FR-CHG-001,FR-CHG-002,FR-SPC-001
- **AC**：AC-002,AC-003,AC-005,AC-006,AC-007,AC-008,AC-009,AC-010,AC-013,AC-021,AC-025
- **动作**：先做 spec-analyze 只读 S3 检查；同步 skill/workflow。正式 handler 从现有 `receipts.interaction` 读取 aggregate 并逐轮校验；task dependency 只在 completed/handoff/normal completion 聚合时读取，implementation/test/failure facts 始终可记录；逐 AC selector 验证 source→decision→FR/AC→task→file/symbol→gate/oracle→evidence→review→stage-end 完整链。确认不作工作许可证；serious finding 只能 fixed/accepted_risk；不新增 store/FSM/枚举。
- **精确文件**：`skills/spec-analyze/SKILL.md`、`skills/spec-analyze/skill-bundle.json`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-acceptance-policy.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/evidence/canonical-evidence-validators.mjs`、`runtime/task/task-kernel-implementation.mjs`、T003 tests
- **boundary**：files: P2 MODIFY；symbols/regions: interaction receipt consumption, spec-analyze/current evidence chain, task dependency outcome acceptance, completion/material freshness only。
- **输出**：四阶段 current consistent 才完成；finding 可在同 stage 修复；旧事实 stale。
- **Knowledge**：T003 真实 RED；不新增状态机/持久对象。
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`npx vitest run tests/contract/spec-analyze-completeness.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/stage-completion.test.mjs tests/integration/vnext-official-stage-run.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-ANALYZER` — 所有缺口被定位；本阶段修复/完整处置后重跑 current consistent；analyzer unavailable/stale 不完成但可继续工作，review unavailable 只如实显示而不作 provider gate。
- **evidence_path**：`quality/tests/T004-analyzer-green.json`
- **STOP**：需要新 writer、permit、recovery 或弱化 current identity 时停止。
- **recovery**：回退 P2 字节，保留 analyzer/report/test facts。
- **task risk**：producer 与 consumer 语义仍分叉。
- **test tier / test method**：fullstack — 与 T003 相同。
- **scenarios / commands / expected exit / oracle**：与 T003 相同；exit 0；ORACLE-ANALYZER。
- **fixtures_services**：与 T003 相同。
- **coverage limits**：只对 vNext current publication 加完成条件；历史只读。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：统一 analyzer producer、outcome 和 completion；前四 stage 只有 current consistent 才完成，quality incomplete 仍允许同 task 修复；make-decision 在真实确认后再做 stage-end analyzer。
- **executed_commands**：`npx vitest run tests/contract/spec-analyze-completeness.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/stage-completion.test.mjs tests/integration/vnext-official-stage-run.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；fresh GREEN 113/113，exit `0`。
- **evidence_refs**：`[{"ref":"quality/tests/T004-analyzer-green.json","sha256":"7bd79c8d40f2a6189b9e7db0427bb1389f40acf3f98c17480a7275cb79202e58"},{"ref":"quality/tests/T003-analyzer-red.json","sha256":"e690bce3743321ed5339363aea272e6b5c805b59f15fd2488e64c3d0a1c3b767"}]`
- **covered_ac**：AC-002, AC-003, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-013, AC-021, AC-025
- **review_fact**：P2 focused analyzer gate 已完成；阶段内问题通过当前材料和当前 evidence 修复，不创建 blocked/reopen。
- **completed_at**：2026-08-20
- **执行事实**：生产 analyzer/completion 合同通过；T004 evidence 已刷新为当前未提交 worktree 的 fresh test fact，明确不伪造 snapshot_tree 绑定。

### Verify

- **Target**：AC-006–010/013/021
- **gate_cmd**：T003/T004 gate
- **expected_exit**：0 after T004
- **evidence_path**：`quality/tests/T004-analyzer-green.json`
- **Oracle**：ORACLE-ANALYZER

### Knowledge

analyzer 是完成条件而非工作许可证；terminal disposition 留在现有 outcome。

### STOP

- 需要新状态机、第二材料权威或 close 补跑质量时返回 plan。

### Done

- 四 profile、finding 修复、freshness 和 completion 正反合同通过。

### Risks and rollback

- **Risk**：旧 workflow 文案和 runtime 合同分叉。
- **Prevention**：skill bundle smoke 与 producer/consumer 同命令测试。
- **Rollback / recovery**：只回退 P2，report 保持 immutable。

## Phase P3 — review 绑定与四视角状态

### Goal

review 三入口 identity 一致，finding 处置可验证，所有 consumer 只读同一状态派生。

### Files

- **NEW**：N/A — 复用现有 review/status tests
- **MODIFY**：`skills/wh-review/skill-bundle.json`、`runtime/review/stage-review-disposition.mjs`、`tools/cli/stage-runtime.mjs`、`tools/host/workflowhub-stage-agent-protocol.mjs`、`runtime/evidence/monitoring-projector.mjs`、`tests/contract/stage-skill-invocation-contract.test.mjs`、`tests/contract/review-materials-contract.test.mjs`、`tests/stage-risk-acceptance.test.mjs`、`tests/contract/status-derivation.test.mjs`
- **DO NOT TOUCH**：`runtime/adapters/local-skill-resolver.mjs`、`runtime/evidence/monitoring-diagnostics.mjs`、原始 provider reports

### Tasks

#### T005 — RED：锁住 review identity、处置和四视角混读

- **ID**：T005
- **Phase**：Phase P3 — review 绑定与四视角状态
- **goal**：让 bundle hash、旧 review、弱处置或 consumer 自算状态命中目标断言。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"0d80e9b52f4b9bb95216b5bbddd121fb75072cfd0a27f217e5385c31ee8f3570","id":"FR-REV-001"},{"artifact_kind":"plan","ref":"plan.md","hash":"fe4bd99fca3dab5eb6ce2a989f4ce357e1b6cda8b64aaab18b4dc3618f2acabc","id":"DEC-001"}]`
- **source_refs / decision_refs**：R-005,R-010,R-013,D-005,D-006 → FR-REV-001,FR-REV-002,FR-STA-001..003,FR-UIX-001,FR-UIX-003 / AC-011,AC-012,AC-014,AC-020,AC-024,AC-025
- **输入**：当前 review bundle/disposition、completion/status consumers。
- **依赖**：T004
- **并行**：否 — status consumes current completion semantics
- **FR**：FR-REV-001,FR-REV-002,FR-STA-001,FR-STA-002,FR-STA-003,FR-UIX-001,FR-UIX-003
- **AC**：AC-011,AC-012,AC-014,AC-020,AC-024,AC-025
- **动作**：扩展五阶段 review 语义与统一派生/core-consumer 矩阵；在现有 `completion-predicates.mjs` 增加唯一只读 `deriveProductRelease()`，消费五阶段 current completion、逐 AC product result、verify-code 当前确认并返回显式 release status/input refs/reasons，不写新 fact/schema/store；加入 bundle 冲突、stale review、现有四种 disposition和可执行恢复动作。P3 不提前宣称尚未由 P4 修改的 close consumer；完整十入口矩阵留给 P5 在现有 public baseline 中参数化自动验证。
- **精确文件**：`tests/contract/stage-skill-invocation-contract.test.mjs`、`tests/contract/review-materials-contract.test.mjs`、`tests/stage-risk-acceptance.test.mjs`、`tests/contract/status-derivation.test.mjs`
- **boundary**：files: 四个现有 tests；symbols/regions: bundle/disposition/status cases。
- **输出**：ORACLE-STATUS 目标 RED。
- **Knowledge**：resolver 已 fail-loud；monitor diagnostics 不是状态权威。
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`npx vitest run tests/contract/stage-skill-invocation-contract.test.mjs tests/contract/review-materials-contract.test.mjs tests/stage-risk-acceptance.test.mjs tests/contract/status-derivation.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-STATUS` — 目标断言证明旧 bundle/处置/状态消费错误，而非 provider 或环境失败。
- **evidence_path**：`quality/tests/T005-status-red.json`
- **STOP**：需要改 resolver、原始 report、猜 usage 或新增 status store 时停止。
- **recovery**：修测试输入或返回 plan，不用空 findings。
- **task risk**：把 monitor 呈现误当权威。
- **test tier / test method**：fullstack contract — portable skill、runtime review、多个 consumer。
- **scenarios / commands / expected exit / oracle**：五阶段业务语义六类重点；三入口 identity；现有四种处置；P3 core-consumer 的主结论/current/reason/unchanged/next/exit；同 gate；exit 1；ORACLE-STATUS。
- **fixtures_services**：确定性 review records；不调用外部 provider。
- **coverage limits**：不证明 provider 延迟/费用，不覆盖 AC-023。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：P3 RED 在修复前观察到旧 bundle hash、verify-code 边界断言和缺失 product-release 派生；没有改 resolver、provider 或原始 report。
- **executed_commands**：见 `quality/tests/T005-status-red.json`；目标 exit 1，未伪造 output hash。
- **evidence_refs**：`[{"ref":"quality/tests/T005-status-red.json","sha256":"ffa272a057794128f95da38d5667644db9f63b3319dce94743748b770b86fc84"}]`
- **covered_ac**：AC-011, AC-012, AC-014, AC-020, AC-024, AC-025
- **review_fact**：与 T006 配对；一次 P3 focused review/status gate 已完成，未重复 provider review。
- **completed_at**：2026-08-20
- **执行事实**：目标 RED 已记录；失败来自可修复的 bundle/状态合同缺口，不是外部 provider 或环境故障。

#### T006 — GREEN：修 bundle/处置并统一纯状态派生

- **ID**：T006
- **Phase**：Phase P3 — review 绑定与四视角状态
- **goal**：让 T005 同一 oracle 通过，consumer 不再自行重算状态。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"d19e1fe0f71777690a96571d729bd2af56b8821bf133addcfc5d53ef10fe2c00","id":"FR-REV-001"},{"artifact_kind":"plan","ref":"plan.md","hash":"fcf194a5bae9641c0c1a920555eaeda8f7054f6dc8bf7fb5853d8f714bb40634","id":"DEC-001"}]`
- **source_refs / decision_refs**：R-005,R-010,R-013,D-005,D-006 → FR-REV-001,FR-REV-002,FR-STA-001..003,FR-UIX-001,FR-UIX-003 / AC-011,AC-012,AC-014,AC-020,AC-024,AC-025
- **输入**：T005 RED、current review/material/snapshot facts、completion projection。
- **依赖**：T005
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-REV-001,FR-REV-002,FR-STA-001,FR-STA-002,FR-STA-003,FR-UIX-001,FR-UIX-003
- **AC**：AC-011,AC-012,AC-014,AC-020,AC-024,AC-025
- **动作**：先对 wh-review 的现有 source path/version/update note 做一次只读 S3 检查；只修 bundle hash，复用现有四种 disposition并补 identity/evidence/confirmation；CLI/host/monitor 只读消费 P2 的纯派生，不在 P3 重算 completion。
- **精确文件**：`skills/wh-review/skill-bundle.json`、`runtime/review/stage-review-disposition.mjs`、`tools/cli/stage-runtime.mjs`、`tools/host/workflowhub-stage-agent-protocol.mjs`、`runtime/evidence/monitoring-projector.mjs`、T005 tests
- **boundary**：files: P3 MODIFY；symbols/regions: bundle hash, disposition validation, pure derived views, presentation mapping。
- **输出**：三入口一致；旧 review stale；职责相关视角和下一步一致。
- **Knowledge**：T005 真实 RED；status 是即时派生，不持久化新权威。
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`npx vitest run tests/contract/stage-skill-invocation-contract.test.mjs tests/contract/review-materials-contract.test.mjs tests/stage-risk-acceptance.test.mjs tests/contract/status-derivation.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-STATUS` — bundle 冲突 dispatch 前失败；处置绑定 current；各 consumer 读取同一派生并保留 unavailable。
- **evidence_path**：`quality/tests/T006-status-green.json`
- **STOP**：需要 resolver/provider 改动、第二 projector store 或未知 disposition 时停止。
- **recovery**：bundle hash 与 runtime 可分别回退；原始 report 不动。
- **task risk**：输出兼容或处置枚举回归。
- **test tier / test method**：fullstack contract — 与 T005 相同。
- **scenarios / commands / expected exit / oracle**：与 T005 相同；exit 0；ORACLE-STATUS。
- **fixtures_services**：与 T005 相同。
- **coverage limits**：consumer 只显示职责相关视角，不要求七入口全部输出四项。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：修正 wh-review bundle 当前文件 hash；保留既有四类 finding disposition；新增 `deriveProductRelease()` 纯派生，显式返回 `released/not_released`、输入绑定和原因；补齐完整适用 AC 集合、current freshness、双输入冲突和 human-confirmation.v2 身份校验；同一 predicate 冲突、错误 producer_stage、verify-code 开放 finding 均保持 incomplete；verify-code 文案如实记录 unavailable，不扩展旧的材料反向检查。
- **executed_commands**：见 `quality/tests/T006-status-green.json`；49/49 tests，exit 0。
- **evidence_refs**：`[{"ref":"quality/tests/T006-status-green.json","sha256":"8d152c98705fdf4182062c6324a71507b1712fb106a087ea61714d2a3e79ed19"},{"ref":"quality/tests/T005-status-red.json","sha256":"ffa272a057794128f95da38d5667644db9f63b3319dce94743748b770b86fc84"}]`
- **covered_ac**：AC-011, AC-012, AC-014, AC-020, AC-024, AC-025
- **review_fact**：P3 focused review/status gate 已完成；未新增第二状态 store 或 provider 路径。
- **completed_at**：2026-08-20
- **执行事实**：current review/status 合同通过；缺少输入、stale、unavailable、未确认和未绑定 hash 均保持 `not_released`，不阻止同 task 修复。

### Verify

- **Target**：AC-011/012/014/020/024；AC-022 完整十入口矩阵由 P5 T010/T011 自动验证
- **gate_cmd**：T005/T006 gate
- **expected_exit**：0 after T006
- **evidence_path**：`quality/tests/T006-status-green.json`
- **Oracle**：ORACLE-STATUS

### Knowledge

completion predicate 是唯一状态派生 owner；monitor/CLI/host 只呈现。

### STOP

- 需要第二状态权威、provider 改写或空 findings 时返回 plan。

### Done

- review identity/disposition 和全部当前 consumer 状态矩阵通过；AC-023 诚实 deferred。

### Risks and rollback

- **Risk**：consumer 输出兼容。
- **Prevention**：逐 consumer 参数化测试。
- **Rollback / recovery**：先回退呈现，再回退纯派生；保留 review facts。

## Phase P4 — normal/risk close 和安全幂等重试

### Goal

close 在零写动作 preflight 后执行逐项授权，部分失败只重试安全未完成动作。

### Files

- **NEW**：N/A — 复用现有 delivery close tests
- **MODIFY**：`core/task-close.mjs`、`tools/cli/task-close.mjs`、`runtime/task/workspace.mjs`、`tests/integration/vnext-delivery-close.test.mjs`、`tests/integration/manual-delivery-close.test.mjs`、`tests/integration/review-test-close-freshness-matrix.test.mjs`（生产文件仅在 RED 证明缺失时改）
- **DO NOT TOUCH**：真实 main/remote、历史 close reports

### Tasks

#### T007 — RED：锁住 close 零写、风险分层和幂等重试

- **ID**：T007
- **Phase**：Phase P4 — normal/risk close 和安全幂等重试
- **goal**：证明缺五阶段/release、风险交付或中途失败下的真实 close 边界。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"0d80e9b52f4b9bb95216b5bbddd121fb75072cfd0a27f217e5385c31ee8f3570","id":"FR-CLS-001"},{"artifact_kind":"plan","ref":"plan.md","hash":"fe4bd99fca3dab5eb6ce2a989f4ce357e1b6cda8b64aaab18b4dc3618f2acabc","id":"DEC-001"}]`
- **source_refs / decision_refs**：R-005,R-013,D-007 → FR-CLS-001,FR-CLS-002,FR-CLS-003,FR-STA-001..003,FR-INT-004,FR-UIX-003 / AC-015,AC-016,AC-020,AC-024,AC-025
- **输入**：现有 close plan/authorization/action results 和统一状态派生。
- **依赖**：T006
- **并行**：否 — close consumes current status/review/analyzer facts
- **FR**：FR-CLS-001,FR-CLS-002,FR-CLS-003,FR-STA-001,FR-STA-002,FR-STA-003,FR-INT-004,FR-UIX-003
- **AC**：AC-015,AC-016,AC-020,AC-024,AC-025
- **动作**：只扩展现有测试：通过唯一 `prepareDeliveryClosePlan()` 对 task dependency、stage outcome/completion、逐 AC/test、current review、三处确认、material/snapshot、release、Git/授权目标和 generated manifest 逐字段做缺失/错绑零写负例；generated paths 必须来自 completed task actual_changes + current test/evidence refs 与 known-generated 的交集。另测 direct execute 绕过 prepare、task/owner dirty、cleanup allowlist、中断后 operation fact/探针重试和 ref 漂移。
- **精确文件**：`tests/integration/vnext-delivery-close.test.mjs`、`tests/integration/manual-delivery-close.test.mjs`、`tests/integration/review-test-close-freshness-matrix.test.mjs`
- **boundary**：files: 三个 tests；symbols/regions: vNext normal/risk/partial close cases。
- **输出**：ORACLE-CLOSE 目标 RED 或现有行为证明无需生产修改。
- **Knowledge**：现有 close 已有多数 retry/drift 能力；只补 RED 证明缺口。
- **verification_role**：RED
- **paired_task**：T008
- **gate_cmd**：`npx vitest run tests/integration/vnext-delivery-close.test.mjs tests/integration/manual-delivery-close.test.mjs tests/integration/review-test-close-freshness-matrix.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-CLOSE` — 若当前行为已全满足，记录 RED-not-needed 事实并把 T008 限为 no-op/呈现修复；不得制造假失败。
- **evidence_path**：`quality/tests/T007-close-red.json`
- **STOP**：测试触碰真实 repo、要求自动授权或首次补跑 analyzer/review 时停止。
- **recovery**：清理临时 repo；返回受影响 task，不重放已完成动作。
- **task risk**：现有能力已满足导致预期 RED 不成立。
- **test tier / test method**：fullstack integration — 临时 Git repo/bare remote 与真实 close engine。
- **scenarios / commands / expected exit / oracle**：缺质量、normal、risk、commit/archive/merge/push/cleanup failure、drift；同 gate；目标非零或 RED-not-needed；ORACLE-CLOSE。
- **fixtures_services**：临时 task store、Git repo、bare remote；测试负责完整清理。
- **coverage limits**：不证明托管平台权限，不执行真实 push。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：无生产 close 修改；现有 close engine 已覆盖本阶段 RED 目标。
- **executed_commands**：见 `quality/tests/T007-close-red.json`；3 files/32 tests，exit 0，判定 `RED-not-needed`。
- **evidence_refs**：`[{"ref":"quality/tests/T007-close-red.json","sha256":"5c901753b6ce47861cd3d5386fc7d599593ad82e9244afe19692848682e8f41f"}]`
- **covered_ac**：AC-015, AC-016, AC-020, AC-024, AC-025
- **review_fact**：与 T008 配对；一次 close focused gate 已完成，不制造假失败。
- **completed_at**：2026-08-20
- **执行事实**：缺质量、review unavailable/failed、stale/material-only、sidecar dirty、风险 close 和 freshness 负例均按现有合同处理；未触碰真实 main/remote。

#### T008 — GREEN：补 close 被证明缺失的 preflight/呈现并执行真实 manual-close

- **ID**：T008
- **Phase**：Phase P4 — normal/risk close 和安全幂等重试
- **goal**：让 T007 oracle 通过，并把 manual-close 从只写风险记录修正为执行真实物理 risk close；不重写已有 close/retry engine。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"0d80e9b52f4b9bb95216b5bbddd121fb75072cfd0a27f217e5385c31ee8f3570","id":"FR-CLS-003"},{"artifact_kind":"plan","ref":"plan.md","hash":"fe4bd99fca3dab5eb6ce2a989f4ce357e1b6cda8b64aaab18b4dc3618f2acabc","id":"T008"}]`
- **source_refs / decision_refs**：R-005,R-013,R-014,D-007,D-013 → FR-CLS-001,FR-CLS-002,FR-CLS-003,FR-STA-001..003,FR-INT-004,FR-UIX-003 / AC-015,AC-016,AC-020,AC-024,AC-025
- **输入**：T007 RED 或 RED-not-needed 事实和现有 close engine。
- **依赖**：T007
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-CLS-001,FR-CLS-002,FR-CLS-003,FR-STA-001,FR-STA-002,FR-STA-003,FR-INT-004,FR-UIX-003
- **AC**：AC-015,AC-016,AC-020,AC-024,AC-025
- **动作**：只修改 RED 证明缺失的 `prepareDeliveryClosePlan()` preflight/execute/CLI/dirty owner 映射；在 existing prepared plan 冻结完整认证绑定与 generated manifest，复用 operation facts、物理探针和 retry，禁止新增 close FSM/recovery；本次增量让 `manual-close` 只消费已 prepare/confirm/authorize 的 risk plan，执行六项 delivery executor，并在 risk evidence writer 侧验证六项 operation facts 与实际物理状态；若生产已满足则不改对应生产文件。
- **精确文件**：`core/task-close.mjs`、`tools/cli/task-close.mjs`、`runtime/task/workspace.mjs`、T007 tests（各生产文件只在 RED 证明需要时）
- **boundary**：files: P4 MODIFY；symbols/regions: prepare/execute/complete close preflight and presentation only。
- **输出**：normal 不补质量；risk 不漂白；部分失败安全继续。
- **Knowledge**：T007 真实事实决定 core 是否修改。
- **verification_role**：GREEN
- **paired_task**：T007
- **gate_cmd**：`npx vitest run tests/integration/vnext-delivery-close.test.mjs tests/integration/manual-delivery-close.test.mjs tests/integration/review-test-close-freshness-matrix.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-CLOSE` — 缺质量零写；风险只改变 physical；完成动作不重放；漂移重新授权。
- **evidence_path**：`quality/tests/T008-close-green.json`
- **STOP**：需要新 recovery FSM、自动授权或修改已完成物理事实时停止。
- **recovery**：回退被 RED 驱动的窄修改；保留 close failure records。
- **task risk**：无必要重写成熟 close engine。
- **test tier / test method**：fullstack integration — 与 T007 相同。
- **scenarios / commands / expected exit / oracle**：与 T007 相同；exit 0；ORACLE-CLOSE。
- **fixtures_services**：与 T007 相同。
- **coverage limits**：真实远端权限和网络不在范围。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：保留现有 prepare/execute/retry、dirty-owner、snapshot freshness 和逐项 operation facts；把 manual-close 从只写风险记录改为复用同一六项 delivery executor 执行真实 commit/archive/merge/push/worktree cleanup/branch cleanup，并在 writer 侧认证 prepared plan、六项 operation facts 和当前物理状态；本轮收口还修正 porcelain source 状态解析、归档时的 source-only 检查、Git 大输出 fail-loud，以及生成物和 tracked execution sidecar 的 cleanup 分类。
- **executed_commands**：见 `quality/tests/T008-close-green.json` 与 `quality/tests/T008-manual-close-green.json`；原 ORACLE-CLOSE gate 32/32，exit 0；增量 manual-close focused gate 2 files/10 tests，exit 0；本轮 close integration gate 2 files/29 tests、workspace cleanup 4 tests，均 exit 0。
- **evidence_refs**：`[{"ref":"quality/tests/T008-close-green.json","sha256":"aa705baef52dcad5258ded4ee2bc49846a1183a9e91d7a998e4b895bf7c7ca29"},{"ref":"quality/tests/T007-close-red.json","sha256":"5c901753b6ce47861cd3d5386fc7d599593ad82e9244afe19692848682e8f41f"},{"ref":"quality/tests/T008-manual-close-green.json","sha256":"6e90355072121848f27c9e4b332c6a749262ee30e489b6197e8e06ed9188e753"}]`
- **covered_ac**：AC-015, AC-016, AC-020, AC-024, AC-025
- **review_fact**：P4 focused close gate 已完成；增量审查确认 manual-close 不再存在只写风险记录的旁路；无新 FSM、recovery、授权或 public close writer。
- **completed_at**：2026-08-20
- **执行事实**：P4 为 RED-not-needed；没有因为“应该有 RED”而重写已经满足的 close 逻辑。

### Verify

- **Target**：AC-015/016/020/024
- **gate_cmd**：T007/T008 gate
- **expected_exit**：0 after T008
- **evidence_path**：`quality/tests/T008-close-green.json`
- **Oracle**：ORACLE-CLOSE

### Knowledge

close 只消费前置质量，不补质量；现有 retry engine 优先复用。

### STOP

- 需要真实仓库副作用、自动授权或新 recovery FSM 时返回 plan。

### Done

- normal/risk/partial failure/drift 正反场景通过且临时资源清理。

### Risks and rollback

- **Risk**：误重放 Git 副作用。
- **Prevention**：逐动作 fixture 与 before/after ref 断言。
- **Rollback / recovery**：只回退窄 preflight/呈现修改。

## Phase P5 — 历史回归、确定性全链路合同和标准流程文档

### Goal

固定三个真实失败模式，用一个简单任务的确定性合同覆盖五阶段正反边界，并通过真实入口验收可安全的 stage/analyzer/review/status/close preflight；本任务不启动真实 Talk/Clarify 交互，不执行未经授权的不可逆 close 动作。

### Files

- **NEW**：N/A
- **MODIFY**：`tests/e2e/vnext-five-stage-current.test.mjs`、`tests/contract/public-behavior-baseline.test.mjs`、`skills/catalog.yaml`、`docs/standard-workflow.md`、`docs/adr/0014-vnext-current-material-authority-and-stage-local-repair.md`、`CONTEXT.md`
- **DO NOT TOUCH**：T01/F13/KD 历史源目录、M14–M17 reports

### Tasks

#### T009 — RED：把三个历史失败语义写入现有回归

- **ID**：T009
- **Phase**：Phase P5 — 历史回归、确定性全链路合同和标准流程文档
- **goal**：让缺失历史失败断言或错误状态语义在现有回归中命中目标 RED。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"0d80e9b52f4b9bb95216b5bbddd121fb75072cfd0a27f217e5385c31ee8f3570","id":"FR-REG-001"},{"artifact_kind":"plan","ref":"plan.md","hash":"fe4bd99fca3dab5eb6ce2a989f4ce357e1b6cda8b64aaab18b4dc3618f2acabc","id":"DEC-001"}]`
- **source_refs / decision_refs**：R-006,R-007,R-008,R-009,R-010,R-013,D-001,D-002 → FR-REG-001,FR-REG-002,FR-CMP-001 / AC-017,AC-018,AC-019
- **输入**：T01/F13/KD 只读来源 identity/hash 与已实现状态链。
- **依赖**：T008
- **并行**：否 — historical assertions consume final runtime behavior
- **FR**：FR-REG-001,FR-REG-002,FR-CMP-001,FR-UIX-001
- **AC**：AC-017,AC-018,AC-019,AC-022
- **动作**：把三类失败语义做成现有 E2E table/helper；每条固定 `task_root/source_snapshot`、四文件 manifest、最小输入、命令、预期状态/exit、反向断言和 evidence path。统一 hash 算法：在 root 内对 `task.json facts.jsonl index.json quality/verify.json` 执行 `sha256sum`，按整行排序后再次 SHA-256。记录如下：T01 root=`/Users/Hugh/Hugh/Knowledge/Projects/PaperBuilder/tasks/paperbuilder-v2-t01-strategy-snapshot`，current snapshot=`7b040a2fbfa69fdda89fa59dc3aa0c8a58514272a3a2966cd222ba08cbab6d63`，输入 physical completed+quality incomplete+not_released，反向断言 task 不得 completed；F13 root=`/Users/Hugh/Hugh/Knowledge/Projects/PaperBuilder/tasks/f13-dsl-security-three-layers`，current snapshot=`3b0016ba50efa2dd60905cd799735aa9bf49f4723640df7548aeff8e736d3f3d`，输入前置 T004 incomplete 与后置 publication，反向断言后置 canonical write/handoff 为零；KD root=`/Users/Hugh/Hugh/Knowledge/Projects/KnowledgeDigest/tasks/task5-reader-quality-compiler-redesign`，current snapshot=`d97f8d93a92659000296ae3cbee86132718f23bfeb1b93e97b21b3ee917ec8ed`，输入 source empty/review unavailable/not_released，反向断言不得空 findings/pass/completed。旧 snapshot hash 只作历史事实保留；验证 source before/after，不复制历史 task 或新建 harness。
- **精确文件**：`tests/e2e/vnext-five-stage-current.test.mjs`、`tests/contract/public-behavior-baseline.test.mjs`
- **boundary**：files: P5 MODIFY；symbols/regions: existing E2E/public-baseline table/helper and assertions only。
- **输出**：ORACLE-HISTORY 目标 RED 与 source before hash。
- **Knowledge**：三类模式分别是质量/交付混读、前置未闭合后置 publication、unavailable/not_released 混读。
- **verification_role**：RED
- **paired_task**：T010
- **gate_cmd**：`npx vitest run tests/e2e/vnext-five-stage-current.test.mjs tests/contract/public-behavior-baseline.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-HISTORY` — 三类历史语义至少一项在未补断言/当前行为下失败，且历史源未变化。
- **evidence_path**：`quality/tests/T009-history-red.json`
- **STOP**：需要写历史源、复制完整 task、让生产读取历史回归数据或建立永久 dogfood harness 时停止。
- **recovery**：只修 table/helper 或目标断言，不碰历史源。
- **task risk**：历史 table 复制过多细节或变成生产依赖。
- **test tier / test method**：fullstack regression — read-only historical identity + current runtime E2E。
- **scenarios / commands / expected exit / oracle**：T01/F13/KD 三模式、source before/after hash；同 gate；exit 1；ORACLE-HISTORY。
- **fixtures_services**：现有测试 helper、临时 task store；测试清理。
- **coverage limits**：只覆盖三个已知模式，不代表全部历史组合。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：在现有五阶段 E2E 与 public behavior baseline 中加入 T01/F13/KD 三类历史失败语义的只读回归断言；固定四文件 snapshot hash，并验证 source before/after 不变。未复制历史 task，未让生产读取历史数据。
- **executed_commands**：`npx vitest run tests/e2e/vnext-five-stage-current.test.mjs tests/contract/public-behavior-baseline.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；exit `0`，31 passed，1 skipped。
- **evidence_refs**：`[{"ref":"quality/tests/T009-history-red.json","sha256":"86610bc9237389eb0719907fb59f173b154651962c203ce5737c8e9a3f060d2b"}]`
- **evidence_note**：RED-not-needed；当前行为已保留三类失败语义，未伪造失败输出。
- **covered_ac**：AC-017, AC-018, AC-019, AC-022。
- **review_fact**：只读历史源、固定 hash、反向断言和无生产依赖已核对；与 T010 成对消费同一 ORACLE-HISTORY。
- **completed_at**：2026-08-20
- **执行事实**：T01/F13/KD 当前 snapshot hash 均与计划固定值一致，回归前后历史源未变化；质量/交付/unavailable 语义未被改写为 completed/pass。

#### T010 — GREEN：通过历史回归并验证简单任务合同

- **ID**：T010
- **Phase**：Phase P5 — 历史回归、确定性全链路合同和标准流程文档
- **goal**：让 T009 同一 oracle 通过，并保存一个简单任务确定性全链路合同的 evidence；不把外部 host/provider/物理 close 结果写成当前任务事实。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"0d80e9b52f4b9bb95216b5bbddd121fb75072cfd0a27f217e5385c31ee8f3570","id":"FR-REG-001"},{"artifact_kind":"plan","ref":"plan.md","hash":"fe4bd99fca3dab5eb6ce2a989f4ce357e1b6cda8b64aaab18b4dc3618f2acabc","id":"DEC-001"}]`
- **source_refs / decision_refs**：R-006,R-007,R-008,R-009,R-010,R-013,D-001,D-002,D-012 → FR-REG-001,FR-REG-002,FR-CMP-001 / AC-017,AC-018,AC-019
- **输入**：T009 RED、P1–P4 runtime、现有交互/analyzer/review/release/close 合同夹具和隔离简单任务方案。
- **依赖**：T009
- **并行**：否 — RED/GREEN 和确定性合同串行
- **FR**：FR-REG-001,FR-REG-002,FR-CMP-001,FR-UIX-001
- **AC**：AC-017,AC-018,AC-019,AC-022
- **动作**：保留现有 E2E/公共行为 table/helper，并在现有 `public-behavior-baseline.test.mjs` 验证十入口主结论、四视角、失败原因和下一动作。使用隔离临时 Node repo 的 `greet <name>` + `--caps` 确定性夹具，覆盖正常 `HELLO, HUGH!`、非法 `--caps=maybe` 的 stderr/exit `2`、Clarify 名字空格 trim，以及 build-plan 首轮漏绑非法 flag 后由当前 stage analyzer 找出/修复/重跑；用现有 interaction contract 正反夹具证明 Talk/Clarify 生产路径只接受真实 `ask → wait → user reply → resume`，不得合成回复。运行现有 stage outcome、前四 `spec-analyze`、review、release/close 合同测试，并通过真实 stage/runtime 入口验收可安全的 stage/analyzer/review/status/close preflight 与负例；不启动真实 Talk/Clarify 交互，不执行未经授权的 commit/merge/push/archive/cleanup。
- **精确文件**：`tests/e2e/vnext-five-stage-current.test.mjs`、`tests/contract/public-behavior-baseline.test.mjs`、`skills/catalog.yaml`、`docs/standard-workflow.md`、`docs/adr/0014-vnext-current-material-authority-and-stage-local-repair.md`、`CONTEXT.md`
- **boundary**：files: P5 MODIFY；symbols/regions: existing history table/helper, E2E seam, standard workflow/ADR/CONTEXT sections。
- **输出**：三个历史回归 GREEN；确定性合同覆盖五阶段顺序、三处确认、Clarify 生命周期、阶段内修复、review/analyzer、release/close 正反边界。`quality/tests/T010-history-contract-green.json` 固定记录 `verification_mode=deterministic-contract`、测试命令/exit、当前材料和快照绑定、通过的行为断言、外部 host/provider/物理 close 的 `not_run` coverage limit；不得生成伪造 interaction receipt、provider attempt/result/report、released 或 completed。
- **Knowledge**：T009 failure 和 P1–P4 current interfaces。
- **verification_role**：GREEN
- **paired_task**：T009
- **gate_cmd**：`npx vitest run tests/e2e/vnext-five-stage-current.test.mjs tests/contract/public-behavior-baseline.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-HISTORY` — 三类历史语义正确且源 hash 不变；确定性合同正例完成、负例拒绝、当前 identity 一致、四视角不混读且外部事实未被伪造。真实 provider unavailable、外部 host 未启动和 close 未运行在本任务中是明确 coverage limit，不转成 pass。
- **evidence_path**：`quality/tests/T010-history-contract-green.json`
- **STOP**：需要修改历史源、以 adapter 冒充真实 reviewer、永久 harness、外部会话或自动 close 授权才能通过时停止；不为本任务新增替代通道。
- **recovery**：清理隔离 task/repo；保留失败 evidence；修当前 Phase。
- **task risk**：把一次 dogfood 变成维护框架或伪造 provider 成功。
- **test tier / test method**：fullstack regression + deterministic contract。
- **scenarios / commands / expected exit / oracle**：运行 T009 同一历史回归命令，再运行现有交互/analyzer/status/release/close 合同组和十入口 baseline；通过真实 stage/runtime 入口跑可安全的 stage/analyzer/review/status/close preflight/负例，每条可执行命令按真实 exit 和结果记录，正例通过、负例拒绝、current identity 一致，ORACLE-HISTORY 成立。不运行真实 Talk/Clarify reply；不执行真实 close execute 和不可逆 Git/归档动作。
- **fixtures_services**：现有测试 helper、临时 task store、临时 Git repo/bare remote；测试负责清理；不创建 dogfood task、真实 provider attempt 或永久 harness。
- **coverage limits**：不证明真实 Talk/Clarify 回复链、provider 长期可用性、费用、远端权限或不可逆物理交付；不代替仓库外 host renderer；AC-023 deferred。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：按 D-012 将 T010 从真实 Talk/Clarify dogfood 改为确定性交互合同；保留 T01/F13/KD 历史回归、十入口 baseline，并补做真实 stage/analyzer/review/status/close preflight/负例入口验收。未启动真实 Talk/Clarify；provider 只记录真实尝试结果；未执行未经授权的不可逆 close 动作。
- **executed_commands**：T009 历史回归 exit `0`（31 passed，1 skipped）；P5 focused contract aggregate exit `0`（201 passed，1 skipped）。
- **evidence_refs**：`[{"ref":"quality/tests/T009-history-red.json","sha256":"86610bc9237389eb0719907fb59f173b154651962c203ce5737c8e9a3f060d2b"},{"ref":"quality/tests/T010-history-contract-green.json","sha256":"2427e05f8b79928551f27c0f40795d37cfd761fa2e1b4c5a68ed28e2e2cd0623"}]`
- **covered_ac**：AC-017, AC-018, AC-019。
- **review_fact**：P5 合同/历史回归与可安全生产入口事实已核对；真实 Talk/Clarify 不属于本任务执行条件；provider 若不可用如实保留，生产 Talk/Clarify 仍由真实生命周期合同约束。
- **completed_at**：2026-08-21
- **执行事实**：T010 只证明当前实现的确定性行为合同和错误边界；外部 host/provider/物理 close 是 `not_run` coverage limit，不被推导为 released/completed。

#### T011 — FINAL：current snapshot 确定性聚合验证

- **ID**：T011
- **Phase**：Phase P5 — 历史回归、确定性全链路合同和标准流程文档
- **goal**：一次验证全部非 deferred AC、跨 Phase seam、skill bundle、全量回归和确定性合同事实；不把外部 host/provider/物理 close 缺失写成真实发布成功。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"0d80e9b52f4b9bb95216b5bbddd121fb75072cfd0a27f217e5385c31ee8f3570","id":"FR-STG-001"},{"artifact_kind":"plan","ref":"plan.md","hash":"fe4bd99fca3dab5eb6ce2a989f4ce357e1b6cda8b64aaab18b4dc3618f2acabc","id":"DEC-001"}]`
- **source_refs / decision_refs**：R-001..R-014,D-001..D-013 → 全部 FR / AC-001..AC-022,AC-024,AC-025；AC-023=DEFER-002
- **输入**：T002,T004,T006,T008,T010 的 current facts、确定性合同证据和 current snapshot。
- **依赖**：T010
- **并行**：否 — aggregate reads all preceding task facts
- **FR**：FR-REQ-001,FR-INT-001,FR-INT-002,FR-INT-003,FR-INT-004,FR-GRL-001,FR-STG-001,FR-STG-002,FR-STG-003,FR-ANL-001,FR-ANL-002,FR-ANL-003,FR-ANL-004,FR-ANL-005,FR-REV-001,FR-REV-002,FR-CHG-001,FR-CHG-002,FR-STA-001,FR-STA-002,FR-STA-003,FR-CLS-001,FR-CLS-002,FR-CLS-003,FR-REG-001,FR-REG-002,FR-CMP-001,FR-SPC-001,FR-UIX-001,FR-UIX-002,FR-UIX-003
- **AC**：AC-001,AC-002,AC-003,AC-004,AC-005,AC-006,AC-007,AC-008,AC-009,AC-010,AC-011,AC-012,AC-013,AC-014,AC-015,AC-016,AC-017,AC-018,AC-019,AC-020,AC-021,AC-022,AC-024,AC-025
- **deferred**：FR-UIX-002 / AC-023 = DEFER-002（仓库外 host renderer 的焦点/键盘交接）。
- **动作**：对当前四材料运行现有 plan/task validator；读取前四阶段 current `spec-analyze`/review 与 build-code stage-end analyzer，不到 FINAL 才首次发现缺口；逐项核对 30 个适用 FR、24 个适用 AC、11 个 task current evidence 与 1 个明确 deferred FR/AC。直接读取 T010 确定性证据，机器断言五个精确 stage 的 task/material/snapshot、真实交互生命周期的正反规则、三处 confirmation 的绑定、review/release/close 的缺失语义、`deriveProductRelease` inputs 和逐项 close operations；真实 Talk/Clarify 交互与真实项目 main/remote 不可逆物理 close 不在本任务执行，T008 增量隔离 fixture 的 manual-close 物理事实单独消费，其他可安全生产入口仍须验收。再执行 focused aggregate、skill smoke、`env -u CODEX_THREAD_ID -u CODEX_SESSION_ID npm test`、`npm run check` 和宪法 21 条核对，避免宿主 session 绑定污染测试。复用现有 validator/test，不新增 coverage matrix/store。
- **精确文件**：`docs/standard-workflow.md`、`docs/adr/0014-vnext-current-material-authority-and-stage-local-repair.md`、`CONTEXT.md`、P1–P5 所有现有测试文件（只读聚合，不改这些文件）
- **boundary**：files: Phase MODIFY/NEW 的测试和文档；symbols/regions: final evidence/status area only。
- **输出**：current snapshot 最终测试、审查、确定性合同和交接事实；外部 host/provider/物理 close coverage limit 清楚可读。
- **Knowledge**：所有前序任务真实结果；quality fact 不是许可证。
- **verification_role**：N/A — non-behavior aggregate verification
- **paired_task**：N/A — aggregate has no RED/GREEN pair
- **gate_cmd**：`npx vitest run tests/stage-plan-task-contract.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/e2e/vnext-five-stage-current.test.mjs tests/contract/public-behavior-baseline.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/integration/vnext-delivery-close.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-FINAL` — 当前四材料 validator/spec-analyze、确定性历史/全链路合同、可安全生产入口、skill smoke、全量测试、verify-structure/run-checks/skill-closure/reverse consumer 检查均 exit 0；30 个适用 FR、24 个适用 AC、11 个 task 无孤儿且完成卡 evidence current，FR-UIX-002/AC-023 完整 defer，真实 Talk/Clarify 和真实 main/remote 物理 close 未运行且未被宣称成功，T008 的 manual-close 物理动作只发生在隔离临时 Git fixture。
- **evidence_path**：`quality/tests/T011-final-current-snapshot.json`
- **STOP**：命令不可执行、任一 AC 孤儿/错绑、历史源变化、越界或需要新产品决定时停止。
- **recovery**：回受影响 task 修复并重跑其 gate；最后重新运行一次 FINAL，不用全量绿掩盖局部失败。
- **task risk**：聚合遗漏或把 unavailable/deferred/未运行外部事实写成通过。
- **test tier / test method**：fullstack final — 全量 tests/check + deterministic contract evidence。
- **scenarios / commands / expected exit / oracle**：全部非 deferred AC、skill bundle、architecture/reverse-consumer、十入口矩阵；先读 T010 合同 evidence，再执行 validator、focused tests、skill smoke、`env -u CODEX_THREAD_ID -u CODEX_SESSION_ID npm test`、`npm run check`；所有命令 exit 0，当前绑定一致，外部事实只保留 coverage limit。
- **fixtures_services**：只读历史源 identity/current contract evidence；测试清理临时 repo/remote，不创建外部 dogfood task 或永久 harness。
- **coverage limits**：不证明 provider 长期可用性、托管平台权限、真实 host Talk/Clarify 回复或真实 main/remote 物理交付；AC-023 不被宣称完成。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：在 T011 原有确定性聚合上继续完成审查发现的最小修复：close 读取质量事实本身的 `status`，verify 摘要必须绑定当前材料、来源和逐条 evidence hash，最终 review clean 必须先认证 attempt/provider 终态与聚合；补齐对应回归。T011 不启动真实 Talk/Clarify，不执行未经授权的不可逆 close 动作；T008 增量仅在隔离临时 Git fixture 中执行已授权 manual-close。
- **executed_commands**：材料 validator exit `0`；`tests/contract/status-derivation.test.mjs` exit `0`（10 passed）；`tests/integration/vnext-delivery-close.test.mjs` exit `0`（26 passed）；`tests/e2e/vnext-five-stage-current.test.mjs` exit `0`（21 tests，1 skipped）；`npm run smoke:skill-packages` exit `0`；`env -u CODEX_THREAD_ID -u CODEX_SESSION_ID npm run test:safe` exit `0`（165 files/1787 passed/24 skipped）；`npm run test:exclusive` exit `0`（31 passed）；`npm run check` exit `0`；四个后续 stage `status --action=begin` 和 `wh-review doctor` 均 exit `0`；最终当前快照 `wh-review run` CLI exit `0`，但真实结果为 `unavailable/PUBLIC_RESULT_INVALID`，attempt=`quality/reviews/attempts/53291d63-db46-4878-959a-bb565bb0ce8c/attempt.json`。
- **evidence_refs**：`[{"ref":"quality/tests/T010-history-contract-green.json","sha256":"2427e05f8b79928551f27c0f40795d37cfd761fa2e1b4c5a68ed28e2e2cd0623"},{"ref":"quality/tests/T011-final-current-snapshot.json","sha256":"da5e604bbb1e0df63d1dbd8fb7b6528b998ade9cf072e98ab7e0c5d9e74d1762"}]`
- **covered_ac**：AC-001–AC-022、AC-024、AC-025 的确定性合同和可安全入口验收；AC-023=DEFER-002；AC-018 的真实 Talk/Clarify 交互与不可逆物理交付明确为 coverage limit，不伪造通过。
- **review_fact**：前一轮 fresh `wh-review` 返回 2 个 provider findings、3 个 aggregate clusters，已在同一 task 修复。随后针对最终快照 `ed3670f1441c1d2bc45fccab866d03139df40c22` 真实调用当前 `verify-code` review，broker 返回 `unavailable/PUBLIC_RESULT_INVALID`（公共结果包含 private path，0 个有效 reviewer），没有 provider finding 可处置；该事实保留在 `quality/facts/de7c29e570e7fe75fe3bde01160f21752db0f3f55783e9717b7a01281b8b3939.json` 和上述 attempt/report，不改写为 clean/pass，也不重复发起第三轮调用。不把 Talk/Clarify 缺失当作本任务阻塞。
- **completed_at**：2026-08-21
- **执行事实**：一次带当前 Codex session 环境的测试曾产生 4 个绑定类失败；按标准清除 `CODEX_THREAD_ID/CODEX_SESSION_ID` 后，165 个 test files、1787 个 safe tests、24 个 skipped 和 exclusive 31 个 tests 全部通过。失败事实未改写为通过；未执行真实 Talk/Clarify、真实 main/remote 不可逆 close 或物理交付；T008 的临时 fixture 另有独立 evidence。
- **本轮增量执行事实**：将前四个 authoring stage 的 stage-end 语义检查与质量事实契约统一归给 `spec-analyze`；复用现有 stage publication 写入 `quality/facts/` 和 acceptance evidence，不新增 store、门禁或 producer-to-close 集成测试。补齐 step 前置 completion evidence 校验、canonical review/fact 路径，以及 build-plan 的 `human-confirmation.v2` 消费；T008 增量把 manual-close 改为真实物理 close 并认证 operation facts；收口时只吸收 close/snapshot/cleanup 的窄修复，保留当前任务已有的严格 provider absolute-path/API-route 校验，不吸收 main 上会改变 `not_applicable` 完成语义的 host WIP。
- **本轮验证**：历史基线事实保持只读；T008 的 manual-close 增量 gate 已重新记录。未运行真实 Talk/Clarify、provider 或真实 main/remote 不可逆物理 close。

### Verify

- **Target**：全部非 deferred FR/AC 和跨 Phase seam
- **gate_cmd**：`npx vitest run tests/stage-plan-task-contract.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/e2e/vnext-five-stage-current.test.mjs tests/contract/public-behavior-baseline.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/integration/vnext-delivery-close.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **evidence_path**：`quality/tests/T011-final-current-snapshot.json`
- **Oracle**：ORACLE-HISTORY, ORACLE-FINAL

### Knowledge

标准流程文档只描述通过的真实行为；AC-023 的宿主 UI 交接仍可见。

### STOP

- 任一 current evidence 缺失、历史源变化或需要新方向时回 owning material/task。

### Done

- 全部非 deferred AC、FINAL tests/check 和确定性合同事实可复核；外部 host/provider/物理 close 未运行且未被漂白；AC-023 未漂白。verify-code 的独立审查入口已尝试，但当前任务目录只有 T010/T011 测试证据、缺少可打开的 `task.json`，因此不把 unavailable 审查伪装成通过，也不把它当成真实 Talk/Clarify 验收要求。

### Risks and rollback

- **Risk**：最终绿掩盖局部失败或遗漏 defer。
- **Prevention**：逐 task evidence + ORACLE-FINAL 双向追溯。
- **Rollback / recovery**：回受影响 task，不删除 failure facts。

## Final current-snapshot aggregate strategy

- **tier / method**：fullstack；focused contract/integration → deterministic full-chain contract → `env -u CODEX_THREAD_ID -u CODEX_SESSION_ID npm test && npm run check`
- **scenarios**：全部非 deferred AC、成功/失败/取消/stale/unavailable/risk/partial close、跨 Phase seam
- **command**：T011 task card 的材料 validator + deterministic contract + focused/full gate 命令
- **expected exit**：0
- **oracle**：ORACLE-FINAL — current identity、非 deferred AC、历史 source hash、确定性合同、bundle/structure 全部可读；外部事实不伪造
- **fixtures_services**：现有历史语义 table/helper；确定性合同使用临时 task store/Git repo，测试后清理
- **evidence_path**：`quality/tests/T011-final-current-snapshot.json`
- **coverage limits**：不证明真实 provider、host Talk/Clarify、真实 main/remote 远端权限或真实项目物理交付；T008 只覆盖隔离临时 Git fixture；DEFER-002 保持未完成
- **STOP**：命令损坏、AC 孤儿、边界漂移或需要新决定
- **execution_contract**：当前快照运行一次；失败保留原始输出，回受影响 task，不用全量重跑掩盖局部失败。

## Verify-code handoff fact

- **状态**：代码和确定性合同已完成；不进入 close。
- **已核对**：`git diff --check`、focused aggregate、隔离宿主环境 full regression、skill smoke、`npm run check` 均通过。
- **独立审查事实**：前一轮 fresh `wh-review` 真实返回 2 个 provider findings、3 个 aggregate clusters；发现的 close 状态误读、verify 摘要未认证、非终态 review 被当 clean 已修复，并由定向/全量回归覆盖。针对修复后的 current snapshot 又真实尝试了一次 `verify-code` review，但 broker 因 `PUBLIC_RESULT_INVALID`（公共结果包含 private path）返回 `unavailable`，没有有效 provider finding；该失败事实已保留，不能以本地回归代替当前代码审查，也不能因 provider 协议失败把代码 review 写成通过。
- **验收边界**：D-012 只取消本任务启动真实 Talk/Clarify 交互的要求；生产 stage/analyzer/review/status/close preflight 仍需通过真实可安全入口验收。provider 真实尝试的 unavailable、物理 close 未授权和 AC-023 deferred 均保持原事实；不新增流程或门禁。

## Dependency Graph

- **order**：T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011

```text
T001 RED → T002 GREEN → T003 RED → T004 GREEN → T005 RED → T006 GREEN → T007 RED → T008 GREEN → T009 RED → T010 GREEN → T011 FINAL
```

## Final Boundary Check

### DEFER-002：真实 host 卡片焦点行为

- **DEFER-002 handoff contract**：Owner=Codex host UI owner；Trigger=host 暴露可测试 card focus/keyboard API；Handoff=Talk/Clarify/confirmation schema 与键盘场景；Close condition=真实 renderer 证据证明初始焦点、键盘顺序和错误焦点恢复。
- **Owner**：Codex host UI owner；WorkflowHub owner 只提供问题顺序、可辨识名称和不得推断选择的合同。
- **Trigger**：host 暴露可测试的 card focus/keyboard API，或 renderer 被纳入本仓库并登记真实 consumer。
- **Handoff**：Talk、Clarify、confirmation 问题卡 schema，连同 Tab/Enter/Escape 顺序和错误焦点场景交给 host UI。
- **Close condition**：真实 renderer 自动化或人工证据证明稳定初始焦点、键盘顺序和错误焦点恢复；在此之前 AC-023 保持 deferred，不计入 product release pass。

- [ ] 每个 Phase 的 Goal、Files、Tasks、Verify、Knowledge、STOP、Done、Risks and rollback 完整。
- [ ] 每个任务只有一张卡和一个完成区；文件是所属 Phase NEW/MODIFY 的子集。
- [ ] 每个行为变化都有同命令、同 oracle 的 RED → GREEN；FINAL 只做一次聚合。
- [ ] 依赖无环，FR/AC 双向追溯闭合；AC-023 完整 deferred，不冒充通过。
- [ ] review、test、evidence 只作为事实记录，不是开始、继续或交付许可证。
