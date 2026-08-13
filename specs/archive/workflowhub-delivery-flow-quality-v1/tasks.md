# 任务清单：WorkflowHub 交付流程保真与精简交付

- **Input**：`decision-log.md@810aa2df`、`spec.md@33682f4d`、`plan.md@65fbcd4c`
- **Template version**：`plan-task.v3`

## Phase P1 — 交互与五阶段一致性核心

### Goal

批量交互和五个窄 consistency profile 具有可证伪合同，问题返回当前 stage 修复并生成六项摘要。

### Files

- **NEW**：`tests/contract/stage-interaction-batching.test.mjs`、`tests/contract/five-stage-spec-analyze-wiring.test.mjs`
- **MODIFY**：`skills/talk-with-zhipeng/SKILL.md`、`skills/grill-with-docs/SKILL.md`、`skills/spec-clarify/SKILL.md`、`skills/spec-analyze/SKILL.md`、`skills/spec-analyze/packet-lens.md`、`runtime/stage/stage-content-contracts.mjs`、`tests/contract/spec-analyze-completeness.test.mjs`
- **DO NOT TOUCH**：五份 workflow manifests（P4）、review packet builder（P2）。

### Tasks

#### T001 — RED：批量交互与五 profile 缺口

- **ID**：T001
- **Phase**：Phase P1 — 交互与五阶段一致性核心
- **goal**：用目标断言证明单题串行、build-plan-only analyzer、编号假覆盖和缺摘要当前不符合规格。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"33682f4d055f10f9ca97a4621b2ae36ba7f3031056917856c9a355ba607c4ec9","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"65fbcd4cd7d995528573871820bb1125112d6f26f54f807fd9689ef3c4334d65","id":"PLAN"}]`
- **source_refs / decision_refs**：R-007～016、R-021～026、R-058～060、R-068、R-090～091、R-097 / D-001～003 → FR-PREP-001、FR-INTERACT-001、FR-TRACE-001、FR-STAGE-001、FR-REPAIR-001、FR-STATUS-001
- **输入**：当前 interaction skills、spec-analyze lens、stage content contracts。
- **依赖**：none；P1 不消费已交付的 wh-review 基线，进入 P2 前才需授权同步。
- **并行**：否 — 第一组行为 RED。
- **FR**：FR-PREP-001、FR-INTERACT-001、FR-TRACE-001、FR-STAGE-001、FR-REPAIR-001、FR-STATUS-001、FR-COST-001
- **AC**：AC-001、AC-002、AC-003、AC-004、AC-005、AC-006、AC-007、AC-011、AC-017、AC-018、AC-019
- **动作**：只新增/扩展测试，断言一批独立问题、单题单轴、2～3 选项、五 profile 累积输入、material_incomplete、语义/证据覆盖、当前 stage 修复和六项摘要；不改生产实现。
- **精确文件**：`tests/contract/stage-interaction-batching.test.mjs`、`tests/contract/five-stage-spec-analyze-wiring.test.mjs`、`tests/contract/spec-analyze-completeness.test.mjs`
- **boundary**：files 仅上述测试；symbols/regions 为新增 P1 fixtures/assertions。
- **输出**：因目标断言失败的 RED 输出。
- **Knowledge**：analysis report-only；缺输入不能扫历史或猜答案。
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`npx vitest run tests/contract/stage-interaction-batching.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/spec-analyze-completeness.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-STAGE-CONTRACT` — 至少一个目标行为断言失败，非 setup/import failure。
- **evidence_path**：`quality/tests/P1-stage-contract.txt`
- **STOP**：命令无法加载现有模块、失败来自环境、或测试要求第五材料时停止。
- **recovery**：build-code Agent 修复 fixture/setup；产品歧义返回 owning material。
- **task risk**：RED 误测文案而非真实输入/输出。
- **test tier / test method**：fullstack / portable skill contract + stage content unit seam。
- **scenarios / commands / expected exit / oracle**：批量/部分回复/错回复；五 profile/缺输入/语义漂移/证据 stale；同 gate，exit 1，ORACLE-STAGE-CONTRACT。
- **fixtures_services**：内存材料与 frozen packet fixture；无外部服务。
- **coverage limits**：不验证 workflow manifest/runtime 接线，留给 P4。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：只新增/扩展 P1 合同测试，先验证批量交互、五个 stage profile、material_incomplete、语义/证据覆盖和六项摘要的目标缺口。
- **executed_commands**：RED gate exit 1；2 个文件 8 个目标断言失败，失败来自缺少目标行为，不是 setup/import failure。
- **evidence_refs**：`quality/evidence/build-code/P1-final-phase-card-v7.json` sha256 `a7dcfdb81a933768a961fac68c603cac7d7f0f022ddea2796783efcd74ca0398`；RED 输出保留在本阶段执行事实中。
- **covered_ac**：AC-001、AC-002、AC-003、AC-004、AC-005、AC-006、AC-007、AC-011、AC-017、AC-018、AC-019。
- **review_fact**：与 T002 配对，在 P1 GREEN 后执行一次 Phase review。
- **completed_at**：2026-08-12
- **执行事实**：RED 已证明目标行为缺口真实存在；随后进入同一 P1 的 GREEN 与审查修复。

#### T002 — GREEN：实现批量交互与 stage-aware consistency

- **ID**：T002
- **Phase**：Phase P1 — 交互与五阶段一致性核心
- **goal**：让 T001 全部通过并保留缺输入、错回复、假语义覆盖负例。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"33682f4d055f10f9ca97a4621b2ae36ba7f3031056917856c9a355ba607c4ec9","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"65fbcd4cd7d995528573871820bb1125112d6f26f54f807fd9689ef3c4334d65","id":"PLAN"}]`
- **source_refs / decision_refs**：与 T001 相同，并含 R-012～014、R-024～027、R-057 / D-001～004。
- **输入**：T001 RED、当前 skills 和 validator。
- **依赖**：T001
- **并行**：否 — RED/GREEN 串行。
- **FR**：FR-PREP-001、FR-INTERACT-001、FR-TRACE-001、FR-STAGE-001、FR-REPAIR-001、FR-STATUS-001、FR-COST-001
- **AC**：AC-001、AC-002、AC-003、AC-004、AC-005、AC-006、AC-007、AC-011、AC-017、AC-018、AC-019
- **动作**：修改三个交互 skill 和 spec-analyze/validator，定义五个窄输入 profile、finding 字段、当前 stage 修复回路、增量引用与六项摘要。
- **精确文件**：`tests/contract/stage-interaction-batching.test.mjs`、`tests/contract/five-stage-spec-analyze-wiring.test.mjs`、`skills/talk-with-zhipeng/SKILL.md`、`skills/grill-with-docs/SKILL.md`、`skills/spec-clarify/SKILL.md`、`skills/spec-analyze/SKILL.md`、`skills/spec-analyze/packet-lens.md`、`runtime/stage/stage-content-contracts.mjs`、`tests/contract/spec-analyze-completeness.test.mjs`
- **boundary**：files=Phase P1；symbols/regions 仅 interaction card contract、stage profile、coverage/handoff report。
- **输出**：五 profile 与交互合同 GREEN。
- **Knowledge**：不得调用 provider、执行测试或变 completion gate。
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`npx vitest run tests/contract/stage-interaction-batching.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/spec-analyze-completeness.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-STAGE-CONTRACT` — 五 profile/交互正负例全部通过。
- **evidence_path**：`quality/tests/P1-stage-contract.txt`
- **STOP**：需要扫描历史、创建第五材料或决定专业质量时停止。
- **recovery**：只回退 P1 skill/validator 变更，保留测试与现有 build-plan lens。
- **task risk**：公共 analyzer 变万能技能或摘要无真实 facts。
- **test tier / test method**：fullstack / contract + packet lens unit。
- **scenarios / commands / expected exit / oracle**：与 T001 相同，exit 0，ORACLE-STAGE-CONTRACT。
- **fixtures_services**：同 T001。
- **coverage limits**：不证明 handler 实际执行，P4 负责。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增批量交互与五阶段 profile 合同测试；为交互 lifecycle 增加独立问题批次、选项/后果/风险、部分回答与重排绑定；扩展 `runtime/stage/stage-content-contracts.mjs` 的共享批次校验和 stage-aware spec-analyze；补充持久 Talk/Clarify rich batch 证据校验；同步技能 bundle/catalog hash。
- **executed_commands**：最终聚焦命令为 `node runtime/evidence/check-skill-closure.mjs && node --check runtime/stage/stage-content-contracts.mjs && node --check runtime/evidence/stage-content-evidence.mjs && node /Users/Hugh/Hugh/Project/workflowhub/node_modules/vitest/vitest.mjs run tests/contract/spec-analyze-completeness.test.mjs tests/contract/four-material-non-gate-contract.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/stage-interaction-batching.test.mjs tests/stage-interaction-contract.test.mjs tests/interaction-quality-contract.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs tests/contract/stage-routing-and-concrete-testing.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`，exit 0；9 个文件、98 个测试；skill closure exit 0；stage routing advisor `fullstack/pass`；P1 最终 Phase review available，2 个异源 provider 有效结果，5 条 finding 全为 `nonblocking_minor`，actionable major/blocking 为 0。
- **evidence_refs**：`quality/evidence/build-code/P1-final-phase-card-v7.json` sha256 `a7dcfdb81a933768a961fac68c603cac7d7f0f022ddea2796783efcd74ca0398`；`quality/tests/P1-stage-contract-current-v7.json` sha256 `0140d6a1273852216080a79777cb5c32160a63b1332343cd806f6d6ce4d186ec`；`quality/reviews/results/build-code-default-22e95f693aa897c907bcac90337af23836687034-8b5ff649-8002-43bc-b5a7-07317cf5ff6c.json` sha256 `77ecd20bddf7ac68e64950e1c4b4f9bece34a9ca0926e6a580c456909765cca0`；report sha256 `e5d393f0e8f7599e460fbca2b163424387c3f751fdb0ec55714667cf00f9ad86`。
- **covered_ac**：AC-001、AC-002、AC-003、AC-004、AC-005、AC-006、AC-007、AC-011、AC-017、AC-018、AC-019。
- **review_fact**：当前 P1 wh-review available；2/1 valid reviewer；最后一次结果保留 5 条 minor 建议（语义软否定、schema 深度、artifact 完整/更新措辞、缺版本 legacy 边界、Grill 复合条件可读性），均为 `nonblocking_minor`；actionable major/blocking 为 0。此前发现的跨接缝 `clarify` 命名、伪语义漏检、原型键崩溃、未知/重复 coverage、终止 Clarify 和版本不一致问题均已在 P1 修复并复验；没有手动固定超时终止 provider。
- **completed_at**：2026-08-12
- **执行事实**：P1 GREEN 后多轮独立复审发现真实缺口，均在本阶段修复后复审：`changed/expanded` 状态静默通过、持久 rich batch 依赖内容嗅探、Grill ID 优先级不一致、Clarify 命名断裂、伪语义/否定/删除/近似词误判、原型键崩溃、覆盖编号重复/未知、终止 Clarify、版本边界。最终 focused suite 98 tests / 9 files 全部通过；未新增第五材料、runtime gate、provider lifecycle 或 workflow manifest。

### Verify

- **Target**：P1 FR/AC。
- **gate_cmd**：与 T001/T002 相同。
- **expected_exit**：RED=1；GREEN=0。
- **evidence_path**：`quality/tests/P1-stage-contract.txt`
- **Oracle**：ORACLE-STAGE-CONTRACT。

### Knowledge

P2/P4 只接窄结果和 evidence refs。

### STOP

- 万能 analyzer、历史补猜、第五材料、新产品选择。

### Done

- RED/GREEN、finding/摘要、coverage limits 和 Phase review 事实齐全。

### Risks and rollback

- **Risk**：analysis 膨胀。
- **Prevention**：只 lineage/一致性/handoff。
- **Rollback / recovery**：回退 P1 extension，保留原 build-plan lens。

## Phase P2 — wh-review 恢复与 mini-task 审查合同

### Goal

三次 fresh attempts 和 SAME_SOURCE fallback 真实可回放；mini-task 两类 trusted route/packet 不成为第六 stage。

### Files

- **NEW**：`skills/wh-review/contracts/mini-task-design.md`、`skills/wh-review/contracts/mini-task-implementation.md`
- **MODIFY**：`skills/wh-review/SKILL.md`、`skills/wh-review/scripts/third-review-host-config.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`runtime/review/stage-materials.json`、`skills/wh-review/stage-skill-plan.json`、`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`tests/contract/review-materials-contract.test.mjs`、`/Users/Hugh/.config/workflowhub/config.json`
- **DO NOT TOUCH**：`review-provider-client.mjs`、3rd-review 私有 runtime、`REVIEW_STAGES` 五阶段集合。

### Tasks

#### T003 — RED：review 恢复和 mini packet

- **ID**：T003
- **Phase**：Phase P2 — wh-review 恢复与 mini-task 审查合同
- **goal**：证明当前单 request、无 fallback 请求和无 mini-task routes 不满足规格。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"33682f4d055f10f9ca97a4621b2ae36ba7f3031056917856c9a355ba607c4ec9","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"65fbcd4cd7d995528573871820bb1125112d6f26f54f807fd9689ef3c4334d65","id":"PLAN"}]`
- **source_refs / decision_refs**：R-005、017、036～039、074、076～077、080、085～088、092 / D-011、D-013～015 → FR-REVIEW-001、FR-MINI-004
- **输入**：已授权合入后的 d84d430 baseline、现有 review profiles/config。
- **依赖**：T002；另需 baseline merge authorization。
- **并行**：否 — P2 RED。
- **FR**：FR-REVIEW-001、FR-MINI-004、FR-COST-001
- **AC**：AC-014、AC-015、AC-024、AC-018、AC-019
- **动作**：仅写测试，覆盖三次 attempts、计数分类、material/snapshot 漂移、findings 不重试、SAME_SOURCE incomplete、design/implementation packet 字段。
- **精确文件**：`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`tests/contract/review-materials-contract.test.mjs`
- **boundary**：仅 P2 tests 的 fixtures/assertions。
- **输出**：目标断言 RED。
- **Knowledge**：`runReview` 是单 immutable attempt；d84d430 不得重做。
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs tests/contract/review-materials-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-REVIEW-RECOVERY` — 目标恢复/packet 断言失败，非 broker setup failure。
- **evidence_path**：`quality/tests/P2-review-recovery.txt`
- **STOP**：baseline 未同步、失败来自 d84d430 缺失或测试需要私有 provider 状态时停止。
- **recovery**：先完成授权 baseline merge；fixture 使用 public result。
- **task risk**：把 focused review 与 unavailable recovery 混为一类。
- **test tier / test method**：fullstack / CLI-runner-config-packet integration。
- **scenarios / commands / expected exit / oracle**：第 1/2/3 次成功/失败、材料拒绝、findings、漂移、同源、两类 packet；同 gate/1/ORACLE-REVIEW-RECOVERY。
- **fixtures_services**：fake public broker results；真实 provider 不需要。
- **coverage limits**：不验证 3rd-review 私有 session 健康。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：仅新增 P2 RED 合同测试，复现三次 fresh attempt、材料/快照漂移、SAME_SOURCE 不完整和 mini-task design/implementation packet 的目标缺口；未修改 P2 生产实现。
- **executed_commands**：`npx vitest run tests/integration/mini-task-delivery.test.mjs tests/integration/mini-task-a-resume.test.mjs tests/integration/vnext-delivery-close.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`，exit 0，19 tests；`node runtime/evidence/check-skill-closure.mjs`，exit 0，`skill closure: ok`；`git diff --check`，exit 0。
- **evidence_refs**：`quality/evidence/build-code/P2-phase-card.json`；P2 RED 输出按 phase 执行事实保留，未把 RED 失败写成 GREEN。
- **covered_ac**：AC-014、AC-015、AC-018、AC-019、AC-024；真实 provider/private lifecycle 不由 RED 合同测试证明。
- **review_fact**：与 T004 配对；最终 P2 phase review 事实记录在 T004，未把 RED 任务误写成独立质量结论。
- **completed_at**：2026-08-13
- **执行事实**：P2 RED 只证明目标缺口可复现；随后由 T004 在同一 P2 完成实现、测试和独立审查。

#### T004 — GREEN：实现 public attempt recovery 与 mini review kind

- **ID**：T004
- **Phase**：Phase P2 — wh-review 恢复与 mini-task 审查合同
- **goal**：让 T003 通过，保留所有原始 unavailable/SAME_SOURCE/provenance 和 advice-only 边界。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"33682f4d055f10f9ca97a4621b2ae36ba7f3031056917856c9a355ba607c4ec9","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"65fbcd4cd7d995528573871820bb1125112d6f26f54f807fd9689ef3c4334d65","id":"PLAN"}]`
- **source_refs / decision_refs**：R-005、R-017、R-036～039、R-074、R-077、R-085～086、R-092 / D-011。
- **输入**：T003 RED、d84d430 packet/result baseline。
- **依赖**：T003
- **并行**：否 — RED/GREEN 串行。
- **FR**：FR-REVIEW-001、FR-MINI-004、FR-COST-001
- **AC**：AC-014、AC-015、AC-024、AC-018、AC-019
- **动作**：外层组合最多三次 public requests；增加 trusted mini review kind、packet 和 host fallback-required fact；更新 host config 两项。fallback-required 分别由五阶段 workflow 和 mini-task runner 消费：必须新建独立上下文，用同一冻结 material/snapshot 审查，并把 SAME_SOURCE、source、finding、coverage、evidence ref 写回当前 review fact；失败保持 unavailable，绝不冒充异源。
- **精确文件**：`skills/wh-review/contracts/mini-task-design.md`、`skills/wh-review/contracts/mini-task-implementation.md`、`skills/wh-review/SKILL.md`、`skills/wh-review/scripts/third-review-host-config.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`runtime/review/stage-materials.json`、`skills/wh-review/stage-skill-plan.json`、`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`tests/contract/review-materials-contract.test.mjs`、`/Users/Hugh/.config/workflowhub/config.json`
- **boundary**：恢复编排只新增 `wh-review-cli.mjs:runReviewRecovery`，逐次调用现有 `runReviewRound`；不得改 `review-runner.mjs:runReview`、provider client、result schema 或私有 lifecycle。
- **输出**：恢复与 packet GREEN。
- **Knowledge**：SAME_SOURCE 只建议，质量保持 incomplete；单数 ref consumer 保留。
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs tests/contract/review-materials-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-REVIEW-RECOVERY` — 所有正负例通过且 packet/provenance 可回放。
- **evidence_path**：`quality/tests/P2-review-recovery.txt`
- **STOP**：需要 polling/timeout/session continuation、新 stage 或覆盖旧 attempt 时停止。
- **recovery**：回退 orchestration/route 扩展，保留 d84d430 和不可变 attempts。
- **task risk**：snapshot 漂移仍累计；fallback 冒充异源。
- **test tier / test method**：fullstack / CLI-runner-config-packet integration。
- **scenarios / commands / expected exit / oracle**：与 T003 相同，exit 0。
- **fixtures_services**：同 T003；host config 修改前后 hash 读回。
- **coverage limits**：真实 provider 可用性在后续 review fact 验证。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：实现三次 fresh public attempt 组合、terminal unavailable 分类、同快照/材料漂移保护、SAME_SOURCE fallback-required 事实、mini_task.design/implementation trusted route 与专用 packet；生产 CLI `run` 已接入 recovery；交互技能/目录变更提供完整审查 diff，测试变更以摘要交付以保持审查包可用；修复语义覆盖误判并补回归断言；完成 wh-review skill bundle/catalog 哈希闭环。
- **executed_commands**：`npx vitest run tests/contract/stage-interaction-batching.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/four-material-non-gate-contract.test.mjs tests/interaction-quality-contract.test.mjs tests/stage-interaction-contract.test.mjs skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs tests/contract/review-materials-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`，exit 0；94 项测试；`checkSkillClosure(process.cwd())` 返回 `ok:true, errors:[]`；P2 最终异源复审 available，2/1 valid reviewer，actionable major/blocking 为 0。
- **evidence_refs**：`quality/tests/P2-review-recovery-final-v9.json` sha256 `8e834c145d1bcc88b3ab99d1a3f60c5281a87ecd8d956f72db7b9544c1da900e`；output sha256 `9f52a57379b9068b12967f66baddc9f160e77f00aa79a264c55e9a34e1e4c508`；`quality/reviews/results/build-code-default-48fef82be639b0de7498b10da9a8e2c0669d8438-962f8bc1-065b-4422-a37f-9120e64e0d67.json` sha256 `3b577b2ef1653b81797f3e34fa359e6197206663e2148a4fd1a91d31a2089a60`；report sha256 `08645b826d0dadcbc39249705b136d28d4ef49079ec4f9c94c4f569135297553`；snapshot tree `48fef82be639b0de7498b10da9a8e2c0669d8438`；config sha256 `5137919361cf1927cf8fb705f8282011a1775c4eb716a747b7896ced7b37bd9a`。
- **covered_ac**：AC-014、AC-015、AC-018、AC-019、AC-024。
- **review_fact**：最终 P2 wh-review available；`parallel_external`，2 个异源 reviewer 有效；codex/luna 记录为 SAME_SOURCE，不计异源质量；2 个 provider 提出的 major 均为 invalid_anchor，未形成 actionable major/blocking；剩余 8 条 minor 均为 `nonblocking_minor`，已保留原始事实。
- **completed_at**：2026-08-13
- **执行事实**：P2 修复均在当前 phase 内完成并复验；没有修改 `review-runner.mjs`、provider client 或 3rd-review 私有 lifecycle；没有新增 public runtime、stage、第五材料或持久 recovery state；未执行 commit/push/merge/cleanup。

### Verify

- **Target**：review recovery 和 mini profiles。
- **gate_cmd**：与 T003/T004 相同。
- **expected_exit**：1→0。
- **evidence_path**：`quality/tests/P2-review-recovery.txt`
- **Oracle**：ORACLE-REVIEW-RECOVERY。

### Knowledge

P3 使用两个 review kind；P4 使用 fallback-required fact。

### STOP

- 私有 lifecycle、snapshot 漂移、旧事实覆盖、同源假绿。

### Done

- recovery/profile/config/tests/review fact 齐全。

### Risks and rollback

- **Risk**：三 attempts 变隐藏 retry。
- **Prevention**：新 public request、新 UUID、同 snapshot。
- **Rollback / recovery**：退回单 attempt，不删历史 facts。

## Phase P3 — mini-task 独立交付与 A 恢复

### Goal

mini-task 从四材料到真实 Git close 完整交付；A 正常 merge、复验并从原 stage 重跑。

### Files

- **NEW**：`skills/mini-task/SKILL.md`、`skills/mini-task/scripts/mini-task-runner.mjs`、`tests/integration/mini-task-delivery.test.mjs`、`tests/integration/mini-task-a-resume.test.mjs`
- **MODIFY**：`core/task-close.mjs`、`tests/integration/vnext-delivery-close.test.mjs`
- **DO NOT TOUCH**：`runtime/task/workspace.mjs`、task index/database writers、旧 scope_revision/archive runtime。

### Tasks

#### T005 — RED：mini-task E2E 与 A 恢复

- **ID**：T005
- **Phase**：Phase P3 — mini-task 独立交付与 A 恢复
- **goal**：证明当前没有独立精简功能交付和 A 正常恢复链。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"33682f4d055f10f9ca97a4621b2ae36ba7f3031056917856c9a355ba607c4ec9","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"65fbcd4cd7d995528573871820bb1125112d6f26f54f807fd9689ef3c4334d65","id":"PLAN"}]`
- **source_refs / decision_refs**：R-048、R-072～084、R-087～089、R-093、R-095 / D-009～016 → FR-MINI-001～004、FR-LIFECYCLE-001、FR-RESULT-001
- **输入**：P2 review kinds、现有 bootstrap/workspace/artifact/task-close。
- **依赖**：T004
- **并行**：否 — P3 RED。
- **FR**：FR-MINI-001、FR-MINI-002、FR-MINI-003、FR-MINI-004、FR-LIFECYCLE-001、FR-RESULT-001
- **AC**：AC-020、AC-021、AC-022、AC-023、AC-024、AC-025、AC-016
- **动作**：只写 integration tests，覆盖四材料字段、两次 review、测试/真实结果、范围扩大、授权、close、取消、A merge conflict/成功/原 stage 重跑。
- **精确文件**：`tests/integration/mini-task-delivery.test.mjs`、`tests/integration/mini-task-a-resume.test.mjs`、`tests/integration/vnext-delivery-close.test.mjs`
- **boundary**：仅 P3 tests/fixtures。
- **输出**：缺 mini-task runner/readiness/merge 的 RED。
- **Knowledge**：mini-task 非 stage；计划内未授权保持 pending/incomplete。
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`npx vitest run tests/integration/mini-task-delivery.test.mjs tests/integration/mini-task-a-resume.test.mjs tests/integration/vnext-delivery-close.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-MINI-TASK` — 目标 E2E 断言失败而非 Git 环境 setup 失败。
- **evidence_path**：`quality/tests/P3-mini-task.txt`
- **STOP**：fixture 会接触真实用户仓库/branch、需要编辑 workspace.mjs 或自动授权时停止。
- **recovery**：只用临时 repo/worktree；冲突测试 abort/cleanup。
- **task risk**：测试只验证文件存在，没有真实 commit/merge/结果。
- **test tier / test method**：fullstack / temp-repo E2E + close integration。
- **scenarios / commands / expected exit / oracle**：直接使用、A 阻塞、用户指定复杂、范围扩大、取消、同源、测试失败、Git conflict；同 gate/1/ORACLE-MINI-TASK。
- **fixtures_services**：临时 Git repo、fake review facts、TaskHandle；测试负责清理。
- **coverage limits**：不推送真实 remote、不修改真实 host config。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增并运行 mini-task 交付、取消、范围扩大、质量事实缺失、A 进度提交、冻结目标 OID 合并与冲突 abort 的临时 Git 集成场景；实现前先保留了真实 RED，未修改用户真实仓库。
- **executed_commands**：T005 RED gate exit 1，失败为目标行为断言而非 setup/import failure；T006 GREEN gate exit 0，3 个文件、19 个测试；随后 P3 current-snapshot gate exit 0，13 个文件、172 个测试；`git diff --check` exit 0。
- **evidence_refs**：`quality/tests/P3-current-snapshot-v3.json` sha256 `239261a1d6d532c097e7d6315858d687b1314a5a29ac14d092c76b25d986433a`；`quality/evidence/build-code/P3-phase-card.json` 为 P3 canonical phase card。
- **covered_ac**：AC-020、AC-021、AC-022、AC-023、AC-024、AC-025、AC-016；真实外部 remote push、真实用户 workspace 和 3rd-review 私有 lifecycle 仍按 phase limits 保持未验证。
- **review_fact**：当前 snapshot 的 wh-review available；1/1 valid reviewer，actionable serious findings 为 0；`opencode/v4flash` 为 `OUTPUT_INVALID`、`codex/luna` 为 `SAME_SOURCE` 均保留；唯一 minor finding 已按批准 P3 计划和既有 `full_tests_fresh` consumer 判定为 `rejected_invalid`，未转移到后续 stage。
- **completed_at**：2026-08-13
- **执行事实**：P3 已在本阶段完成修复、测试和独立审查；未执行提交、推送、合并或清理，避免超出用户当前授权。

#### T006 — GREEN：实现 mini-task 薄 runner 和唯一 close

- **ID**：T006
- **Phase**：Phase P3 — mini-task 独立交付与 A 恢复
- **goal**：让 T005 通过，不创建第六 stage、第二 close 或任务关系对象。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"33682f4d055f10f9ca97a4621b2ae36ba7f3031056917856c9a355ba607c4ec9","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"65fbcd4cd7d995528573871820bb1125112d6f26f54f807fd9689ef3c4334d65","id":"PLAN"}]`
- **source_refs / decision_refs**：R-048、R-072～084、R-087～089、R-093、R-095 / D-009～016。
- **输入**：T005 RED、P2 review kinds、现有 authenticated APIs。
- **依赖**：T005
- **并行**：否 — RED/GREEN 串行。
- **FR**：FR-MINI-001、FR-MINI-002、FR-MINI-003、FR-MINI-004、FR-LIFECYCLE-001、FR-RESULT-001
- **AC**：AC-020、AC-021、AC-022、AC-023、AC-024、AC-025、AC-016
- **动作**：新增薄 skill/runner；runner 在 mini-task 当前 snapshot 上执行与 verify-code 相同的收尾检查，把真实 focused tests/AC trace/user result 聚合成 `full_tests_fresh` evidence，把 implementation review 聚合成 `independent_review` evidence，并通过现有 `TaskKernel.publishVNextQualityFact("verify-code", ...)` 发布这两个 task-close 已消费的 subject；不得伪造 stage completion、不得新增 mini proof mode/schema。再计算 commit/merge/push/archive/cleanup 适用性：不在计划内写 skipped+理由，计划内未授权写 pending/incomplete；仅对适用且已绑定 task/branch/HEAD/snapshot 的操作交给现有 executor 并逐项读回。来自 A 时，task-close 先把 mini branch 合入冻结的共享目标分支；runner 再在认证 A workspace 内用绑定 A TaskHandle、A HEAD、目标 OID 的独立 merge 授权执行普通 `git merge <目标 OID>` 并读回。A 的 progress commit 同样必须从认证 dirty snapshot 取得独立授权并读回 OID；漂移或冲突立即 abort/停止。
- **精确文件**：`skills/mini-task/SKILL.md`、`skills/mini-task/scripts/mini-task-runner.mjs`、`tests/integration/mini-task-delivery.test.mjs`、`tests/integration/mini-task-a-resume.test.mjs`、`core/task-close.mjs`、`tests/integration/vnext-delivery-close.test.mjs`
- **boundary**：runner 是 mini verification evidence 与 A 二次 merge 的唯一 producer/consumer；只复用 canonical evidence writer、`publishVNextQualityFact` 和 existing close，不写 verify-code completion、不新增 merge helper、第二 close 或 task index writer。
- **输出**：mini-task/A resume GREEN。
- **Knowledge**：不计划操作 skipped；计划内未授权 pending；范围扩大停下让用户选。
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`npx vitest run tests/integration/mini-task-delivery.test.mjs tests/integration/mini-task-a-resume.test.mjs tests/integration/vnext-delivery-close.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-MINI-TASK` — 真实 temp Git/quality facts 正负例通过。
- **evidence_path**：`quality/tests/P3-mini-task.txt`
- **STOP**：需要新 public runtime、自动转换普通 task、直接 DB/index writer 或覆盖用户 dirty workspace 时停止。
- **recovery**：abort merge，保留 task/materials/commits；回退 runner。
- **task risk**：mini-task 写出不兼容或更弱的 verification fact，被普通 close 误认。
- **test tier / test method**：fullstack / temp-repo E2E + close integration。
- **scenarios / commands / expected exit / oracle**：与 T005 相同，exit 0。
- **fixtures_services**：同 T005。
- **coverage limits**：真实 remote push 在获授权交付时验证，不在测试推送外部。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增薄 `mini-task` skill/runner；复用四材料、P2 两类 review kind、canonical evidence writer、`publishVNextQualityFact` 和既有 task-close；修复 design pre-implementation snapshot 与 final implementation snapshot 的绑定、A 干净工作区不虚构 progress commit、Git 状态 NUL 解析和 review packet 的 mini-task diff 范围；同步并验证 skill closure hash。
- **executed_commands**：T006 GREEN gate exit 0，3 个文件、19 个测试；`node runtime/evidence/check-skill-closure.mjs` exit 0；P3 current-snapshot gate exit 0，13 个文件、172 个测试；`git diff --check` exit 0。
- **evidence_refs**：`quality/tests/P3-current-snapshot-v3.json` sha256 `239261a1d6d532c097e7d6315858d687b1314a5a29ac14d092c76b25d986433a`；`quality/evidence/build-code/P3-phase-card.json` 为 P3 canonical phase card；skill closure 输出为 `skill closure: ok`。
- **covered_ac**：AC-020、AC-021、AC-022、AC-023、AC-024、AC-025、AC-016；未授权的真实 remote push、真实用户 workspace 操作和原 stage 实际重跑不冒充已完成。
- **review_fact**：当前 snapshot 的 wh-review available；1/1 valid reviewer，actionable serious findings 为 0；provider `OUTPUT_INVALID`/`SAME_SOURCE` 事实保留；minor subject finding 已在本阶段按既有 close consumer 语义判定为 `rejected_invalid`，未留下未处置严重问题。
- **completed_at**：2026-08-13
- **执行事实**：P3 GREEN、真实质量事实、独立审查和限制边界均已写入；接下来按依赖进入 P4，不复用 P2/P3 代替 P4 的执行事实。

### Verify

- **Target**：mini-task 和 lifecycle/真实结果。
- **gate_cmd**：与 T005/T006 相同。
- **expected_exit**：1→0。
- **evidence_path**：`quality/tests/P3-mini-task.txt`
- **Oracle**：ORACLE-MINI-TASK。

### Knowledge

P4 接入 mini-task，不复制它。

### STOP

- 范围扩大、新产品决定、未授权 Git、冲突、真实结果缺失。

### Done

- E2E、review/test/AC/Git facts、Phase review 和 cleanup 齐全。

### Risks and rollback

- **Risk**：精简等于绕过质量。
- **Prevention**：四材料+两 review+真实结果+唯一 close。
- **Rollback / recovery**：保留现有对象，停止未来动作。

## Phase P4 — 五阶段 workflow 与可信 outcome 链

### Goal

五阶段声明、Stage Agent 执行、认证 outcomes、facts、status/monitoring 和摘要形成一条真实链。

### Files

- **NEW**：N/A — 复用现有 workflow/runtime 测试。
- **MODIFY**：`workflows/make-decision/SKILL.md`、`workflows/make-decision/steps.json`、`workflows/make-decision/skill-deps.yaml`、`workflows/build-spec/SKILL.md`、`workflows/build-spec/steps.json`、`workflows/build-spec/skill-deps.yaml`、`workflows/build-plan/SKILL.md`、`workflows/build-plan/steps.json`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-code/SKILL.md`、`workflows/build-code/steps.json`、`workflows/build-code/skill-deps.yaml`、`workflows/verify-code/SKILL.md`、`workflows/verify-code/steps.json`、`workflows/verify-code/skill-deps.yaml`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-runner.mjs`、`tools/cli/stage-runtime.mjs`、`runtime/evidence/stage-completion-facts.mjs`、`tests/contract/stage-skill-invocation-contract.test.mjs`、`tests/contract/stage-routing-and-concrete-testing.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/stage-completion-facts.test.mjs`、`tests/m15-monitoring-integration.test.mjs`、`tests/m15-monitoring-diagnostics.test.mjs`、`tests/e2e/vnext-five-stage-current.test.mjs`
- **DO NOT TOUCH**：runtime facade、completion predicates、task-store 和 monitoring projector/page。

### Tasks

#### T007 — RED：声明与 outcome producer 不一致

- **ID**：T007
- **Phase**：Phase P4 — 五阶段 workflow 与可信 outcome 链
- **goal**：证明 profile/step/skill/摘要未真实接线，aggregate success 会掩盖中间缺口。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"33682f4d055f10f9ca97a4621b2ae36ba7f3031056917856c9a355ba607c4ec9","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"65fbcd4cd7d995528573871820bb1125112d6f26f54f807fd9689ef3c4334d65","id":"PLAN"}]`
- **source_refs / decision_refs**：R-004、012～016、022～026、031～035、040、045、049、053～054、067、090～094 / D-001～004 → FR-STAGE-001～002、FR-STEP-001、FR-EXEC-001、FR-STATUS-001、FR-COST-001
- **输入**：P1 profiles、P2 recovery、P3 mini-task、当前 five-stage manifests/runtime。
- **依赖**：T006
- **并行**：否 — P4 RED。
- **FR**：FR-STAGE-001、FR-STAGE-002、FR-STEP-001、FR-EXEC-001、FR-STATUS-001、FR-COST-001、FR-REPAIR-001、FR-RESULT-001、FR-REVIEW-001
- **AC**：AC-005、AC-006、AC-007、AC-008、AC-009、AC-010、AC-012、AC-013、AC-017、AC-018、AC-019、AC-011、AC-016、AC-014、AC-015
- **动作**：扩展现有 tests，冻结唯一 producer 接口：Stage Agent 通过 `TaskKernel.publishCanonicalRecord` 写内容寻址的 `quality/evidence/stage-outcomes/<stage>/<sha256>.json`，含 schema、task_id、stage、snapshot_tree、material/manifest hashes、step/skill outcomes 与 evidence refs；ArtifactDir 只读四材料。official run 只接受 `receipts.stage_outcomes`，handler 认证后才把 outcomes 放入既有 result，`stageMonitoringFacts` 消费。断言 retry 不覆盖、五阶段顺序、profile 位点、无 evidence 自报拒绝、missing/unknown、六项摘要和可得成本。
- **精确文件**：`tests/contract/stage-skill-invocation-contract.test.mjs`、`tests/contract/stage-routing-and-concrete-testing.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/stage-completion-facts.test.mjs`、`tests/m15-monitoring-integration.test.mjs`、`tests/m15-monitoring-diagnostics.test.mjs`、`tests/e2e/vnext-five-stage-current.test.mjs`
- **boundary**：仅 P4 tests 的 fixtures/assertions。
- **输出**：outcome chain RED。
- **Knowledge**：runtime 不逐 skill 执行；只认证 Stage Agent facts。
- **verification_role**：RED
- **paired_task**：T008
- **gate_cmd**：`npx vitest run tests/contract/stage-skill-invocation-contract.test.mjs tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/stage-completion.test.mjs tests/stage-completion-facts.test.mjs tests/m15-monitoring-integration.test.mjs tests/m15-monitoring-diagnostics.test.mjs tests/e2e/vnext-five-stage-current.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-OUTCOME-CHAIN` — 目标 wiring/evidence 断言失败。
- **evidence_path**：`quality/tests/P4-outcome-chain.txt`
- **STOP**：失败来自过期 baseline、测试要求 runtime 编排 skill 或改变 completion gate 时停止。
- **recovery**：修正 fixture/contract，不弱化 evidence assertion。
- **task risk**：只比较 steps.json 文本，未证明 handler→facts consumer。
- **test tier / test method**：fullstack / workflow-runtime-facts-monitoring E2E。
- **scenarios / commands / expected exit / oracle**：五阶段正常/缺步/乱序/stale/skipped/unavailable/skill not applicable/summary drift；同 gate/1/ORACLE-OUTCOME-CHAIN。
- **fixtures_services**：临时 task store、manifest/outcome facts；无外部服务。
- **coverage limits**：不重测 mini-task 内部和 provider lifecycle。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：仅在 P4 允许的测试文件中补充真实 stage-outcome receipt 缺失与 caller-facts 自报的负例断言；未改生产实现。
- **executed_commands**：`npx vitest run tests/contract/stage-skill-invocation-contract.test.mjs tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/stage-completion.test.mjs tests/stage-completion-facts.test.mjs tests/m15-monitoring-integration.test.mjs tests/m15-monitoring-diagnostics.test.mjs tests/e2e/vnext-five-stage-current.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；7 files，144 tests，142 passed，2 failed，exit 1；失败命中每 step 缺少 stage-outcome evidence 绑定、无 stage-outcome receipt 仍能 public run 两个目标缺口。
- **evidence_refs**：当前工作树测试输出；P4 phase card `quality/evidence/build-code/P4-phase-card.json`。
- **covered_ac**：AC-005、AC-006、AC-007、AC-008、AC-009、AC-010、AC-012、AC-013、AC-017、AC-018、AC-019 的 RED 缺口已被断言；GREEN 行为留给 T008。
- **review_fact**：N/A — paired GREEN 后 review
- **completed_at**：2026-08-13
- **执行事实**：旧 gate 原本 7 files/141 tests exit 0，但没有覆盖真实 outcome 认证；补充语义断言后才得到有效 RED。没有把旧绿灯伪记成 RED，也没有提前改 runtime。

#### T008 — GREEN：接通五阶段和可信 outcome bridge

- **ID**：T008
- **Phase**：Phase P4 — 五阶段 workflow 与可信 outcome 链
- **goal**：让 T007 通过，保留缺失/未知/失败原始语义且不新增 gate。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"33682f4d055f10f9ca97a4621b2ae36ba7f3031056917856c9a355ba607c4ec9","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"65fbcd4cd7d995528573871820bb1125112d6f26f54f807fd9689ef3c4334d65","id":"PLAN"}]`
- **source_refs / decision_refs**：与 T007 相同，并含 R-046～047、R-057、R-066。
- **输入**：T007 RED、P1/P2/P3 producers。
- **依赖**：T007
- **并行**：否 — RED/GREEN 串行。
- **FR**：FR-STAGE-001、FR-STAGE-002、FR-STEP-001、FR-EXEC-001、FR-STATUS-001、FR-COST-001、FR-REPAIR-001、FR-RESULT-001、FR-REVIEW-001
- **AC**：AC-005、AC-006、AC-007、AC-008、AC-009、AC-010、AC-012、AC-013、AC-017、AC-018、AC-019、AC-011、AC-016、AC-014、AC-015
- **动作**：更新五 workflow 顺序/deps；Stage Agent 是唯一 outcome producer，handler 通过新增且唯一的 `stage_outcomes` receipt kind 认证同 task/stage/snapshot/material/manifest 记录并透传；CLI/facts/summary 使用真实 refs；接入 review fallback 与 mini-task enabling change。只扩展现有 `RECEIPT_KEYS/NAMESPACE`，禁止第二套 receipt 系统、ledger 或 runtime 编排器。
- **精确文件**：`workflows/make-decision/SKILL.md`、`workflows/make-decision/steps.json`、`workflows/make-decision/skill-deps.yaml`、`workflows/build-spec/SKILL.md`、`workflows/build-spec/steps.json`、`workflows/build-spec/skill-deps.yaml`、`workflows/build-plan/SKILL.md`、`workflows/build-plan/steps.json`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-code/SKILL.md`、`workflows/build-code/steps.json`、`workflows/build-code/skill-deps.yaml`、`workflows/verify-code/SKILL.md`、`workflows/verify-code/steps.json`、`workflows/verify-code/skill-deps.yaml`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-runner.mjs`、`tools/cli/stage-runtime.mjs`、`runtime/evidence/stage-completion-facts.mjs`、`tests/contract/stage-skill-invocation-contract.test.mjs`、`tests/contract/stage-routing-and-concrete-testing.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/stage-completion-facts.test.mjs`、`tests/m15-monitoring-integration.test.mjs`、`tests/m15-monitoring-diagnostics.test.mjs`、`tests/e2e/vnext-five-stage-current.test.mjs`
- **boundary**：不改 public facade/predicates/store/projector；handler 不执行 skill。
- **输出**：五阶段 E2E GREEN。
- **Knowledge**：stage success 不覆盖中间 missing；facts 不作工作许可证。
- **verification_role**：GREEN
- **paired_task**：T007
- **gate_cmd**：`npx vitest run tests/contract/stage-skill-invocation-contract.test.mjs tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/stage-completion.test.mjs tests/stage-completion-facts.test.mjs tests/m15-monitoring-integration.test.mjs tests/m15-monitoring-diagnostics.test.mjs tests/e2e/vnext-five-stage-current.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-OUTCOME-CHAIN` — handler→outcome→facts→monitoring→summary 正负例通过。
- **evidence_path**：`quality/tests/P4-outcome-chain.txt`
- **STOP**：调用方可伪造 completed、需要新 public command 或 analyzer/review 成 gate 时停止。
- **recovery**：回退 bridge/manifests，恢复保守 missing/unknown。
- **task risk**：旧 consumer 对新增字段兼容失败。
- **test tier / test method**：fullstack / workflow-runtime-facts-monitoring E2E。
- **scenarios / commands / expected exit / oracle**：与 T007 相同，exit 0。
- **fixtures_services**：同 T007。
- **coverage limits**：真实 host交互回复由 contract fact 验证，不伪造用户答案。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：完成五个 workflow 的显式 stage-end-spec-analyze 步骤、真实 Stage Agent outcome 认证和既有 facts/monitoring/summary 透传；补齐 stage outcome 缺失、自报完成、乱序/stale/skipped/unavailable/skill not applicable 等负例；恢复 wh-review 在可恢复 provider/protocol 失败时的有限重试和 truthful fallback。未新增 public runtime、第五材料、第二 receipt 或推进 gate。
- **executed_commands**：`npx vitest run tests/contract/stage-skill-invocation-contract.test.mjs tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/stage-completion.test.mjs tests/stage-completion-facts.test.mjs tests/m15-monitoring-integration.test.mjs tests/m15-monitoring-diagnostics.test.mjs tests/e2e/vnext-five-stage-current.test.mjs tests/contract/review-materials-contract.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`（11 files，201 tests，exit 0，真实运行约 107 秒）；`node runtime/evidence/check-skill-closure.mjs`（exit 0）；`git diff --check`（exit 0）。RED 事实：补充语义断言后的 focused route 为 7 files/144 tests，142 passed、2 failed、exit 1，失败准确命中 outcome 认证缺口。
- **evidence_refs**：`quality/tests/P4-current-snapshot-v5.json`（sha256 `48f58fee698dd84a9a19eba1feb2850bdc21fa26122331d41b1169172d9a88d6`）；P4 phase card；当前独立 review attempt `quality/reviews/attempts/7e65fc52-cfcc-42e2-bec6-e4302d0b8a58/attempt.json`（sha256 `a37eabeb0a3ff94edd7d4594df54b84b8e6d3465c15c5ec0fb66ee0785635e39`）、result `quality/reviews/results/build-code-default-fc171789ab87559b0be2fcf4f1b8735521440bb3-7e65fc52-cfcc-42e2-bec6-e4302d0b8a58.json`（sha256 `2c4678748a54b2208a247f26bdc44ca573feff1ed9a22fec3ea43e976854a481`）、report（sha256 `680c57da89b37b0156c5f328edc481521b7ea0e64d2cfe27fc1ee1803e7e1309`）。review packet 通过 P4 phase map 限定本阶段真实文件；没有手动终止健康 provider。
- **covered_ac**：AC-005、AC-006、AC-007、AC-008、AC-009、AC-010、AC-011、AC-012、AC-013、AC-014、AC-015、AC-016、AC-017、AC-018、AC-019；当前测试覆盖行为和负例，历史真实 provider 可用性及跨外部系统运行仍由后续 aggregate/verify 如实判定。
- **review_fact**：`available`；1 个有效异源 reviewer（`opencode/coding`），同源 `opencode/v4flash`/`codex/luna` 排除；findings 为空，serious findings=0，未产生需处置 finding。review material id `62a52e8a0856c1f4113dbdca48ad4dec48d14ac972df23a111517e3e44e83ffc`，snapshot tree `fc171789ab87559b0be2fcf4f1b8735521440bb3`。此前过大的全量 packet 通过本阶段 phase map 修复后重新审查，不把 material preflight failure 改写为质量通过。
- **completed_at**：2026-08-13
- **执行事实**：stage-end-spec-analyze 摘要：当前阶段完成五阶段 outcome 链和统一结尾一致性调用；需求覆盖实现、测试、step/skill outcome、review 和 monitoring 的真实证据，缺失仍保持 missing/unknown/unavailable；与 decision-log/spec/plan/tasks 的四材料边界一致；本阶段修复了静默 step 丢失、caller 自报完成、阶段结尾未调用分析和 wh-review 可恢复失败路径；剩余风险是历史三任务缺少可认证 canonical replay、历史 token 不可得、当前 provider 路由可能只有一个有效异源来源；下一阶段边界是 P5 治理同步、标准规范、历史回放和最终 current-snapshot aggregate。

### Verify

- **Target**：五阶段标准合同和 outcome chain。
- **gate_cmd**：与 T007/T008 相同。
- **expected_exit**：1→0。
- **evidence_path**：`quality/tests/P4-outcome-chain.txt`
- **Oracle**：ORACLE-OUTCOME-CHAIN。

### Knowledge

P5 只同步真实实现，不用文档补假执行。

### STOP

- 第二编排器、自报假绿、新 gate/public command。

### Done

- 五阶段链、状态/成本、review、逐 AC/真实结果和 Phase review facts 齐全。

### Risks and rollback

- **Risk**：新增 fields 破坏兼容。
- **Prevention**：窄兼容 projection 与负例。
- **Rollback / recovery**：恢复原 outcome，保守显示 missing/unknown。

## Phase P5 — 治理同步、标准规范与最终回放

### Goal

文档、catalog、bundles、move-map、历史故障回放和最终当前快照闭合且无新增控制面。

### Files

- **NEW**：`skills/mini-task/skill-bundle.json`、`docs/standard-workflow.md`、`tests/contract/workflow-quality-regression.test.mjs`、`tests/fixtures/workflow-quality-cost-sample.json`
- **MODIFY**：`skills/talk-with-zhipeng/skill-bundle.json`、`skills/grill-with-docs/skill-bundle.json`、`skills/spec-clarify/skill-bundle.json`、`skills/spec-analyze/skill-bundle.json`、`skills/wh-review/skill-bundle.json`、`skills/catalog.yaml`、`skills/reuse-registry.md`、`CONTEXT.md`、`docs/adr/0013-mini-task-compact-delivery-flow.md`、`docs/architecture/move-map.json`
- **DO NOT TOUCH**：归档 specs、public runtime facade、任何历史 task evidence。

### Tasks

#### T009 — RED：治理、标准文档与历史故障回放

- **ID**：T009
- **Phase**：Phase P5 — 治理同步、标准规范与最终回放
- **goal**：证明三个历史任务七项问题、来源绑定、bundle/move-map 和标准文档当前未闭合。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"33682f4d055f10f9ca97a4621b2ae36ba7f3031056917856c9a355ba607c4ec9","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"65fbcd4cd7d995528573871820bb1125112d6f26f54f807fd9689ef3c4334d65","id":"PLAN"}]`
- **source_refs / decision_refs**：R-018～019、R-028、R-052～056、R-061～064、R-094、R-096～097 / D-001～004 → FR-GOV-001、FR-AUDIT-001、FR-COST-001、FR-STATUS-001
- **输入**：P1～P4 实际实现和三个 thread 的只读审计事实。
- **依赖**：T008
- **并行**：否 — P5 RED。
- **FR**：FR-GOV-001、FR-AUDIT-001、FR-COST-001、FR-STATUS-001、FR-STAGE-002
- **AC**：AC-026、AC-027、AC-018、AC-019、AC-017、AC-008
- **动作**：把 decision-log 已绑定的三个 thread 故障分别转成 P1～P4 真实 consumer 的最小失败场景，不新增历史事实库；测试直接断言交互/profile、review recovery、mini-task、outcome consumer。来源回放读取 live thread ref、observed revision、source-group 和 explicit unavailable hash，不能把缺 hash 判为完整 provenance。成本比较固定 fixture `sample_id=WH-DELIVERY-FLOW-COST-001`，`input_hash` 绑定同一 raw requirement/decision/spec packet，baseline 来源固定为本任务实施前四材料中的 recorded facts，candidate 绑定当前实现 snapshot；schema 逐项保存 interaction/read/provider_wait/test/review/rework/user_wait，token 缺失为 unavailable。oracle 要求减少重复调用/等待且全部 AC、step、review 证据不退化，结果写 `quality/tests/P5-cost-comparison.json`。
- **精确文件**：`tests/contract/workflow-quality-regression.test.mjs`、`tests/fixtures/workflow-quality-cost-sample.json`
- **boundary**：仅 P5 fixture/test。
- **输出**：治理/历史 replay RED。
- **Knowledge**：历史 unknown/unavailable 不改写；编号连续不等于语义覆盖。
- **verification_role**：RED
- **paired_task**：T010
- **gate_cmd**：`npx vitest run tests/contract/workflow-quality-regression.test.mjs tests/requirements-completeness-audit-acceptance.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-GOV-REPLAY` — 目标治理/历史映射断言失败。
- **evidence_path**：`quality/tests/P5-governance.txt`
- **STOP**：需要改写历史 evidence、抓不到 source 或把数量当覆盖时停止。
- **recovery**：补只读 fixture 来源，缺失保持 unavailable。
- **task risk**：测试只对关键词，不校验真实 consumer/替代关系。
- **test tier / test method**：fullstack / architecture contract + historical fixture replay。
- **scenarios / commands / expected exit / oracle**：三 thread 来源绑定、P1～P5、同样例 baseline/candidate、unknown token、标准流程漂移、无 consumer 文件；同 gate/1/ORACLE-GOV-REPLAY。
- **fixtures_services**：复用 P1～P4 最小 fixtures、当前四材料来源绑定和固定 `WH-DELIVERY-FLOW-COST-001`；不复制历史事实库。
- **coverage limits**：不追补不可得的历史 token/交互原文。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 P5 历史回放/治理回归测试和固定成本诊断 fixture；未改写历史 evidence、未新增 runtime 控制面。
- **executed_commands**：`npx vitest run tests/contract/workflow-quality-regression.test.mjs tests/requirements-completeness-audit-acceptance.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；RED 真实 exit 1（33 个需求完整性测试通过；workflow quality regression 因标准文档尚未存在、build-plan 兼容 analyzer 语义尚未被测试接受而失败）。
- **evidence_refs**：`quality/evidence/build-code/P5-phase-card.json`（含本阶段 RED/GREEN 配对事实）；对应 RED 原始输出保留在本任务执行事实，GREEN 结果由 T010 当前 receipt 绑定。
- **covered_ac**：`AC-008`、`AC-017`、`AC-018`、`AC-019`、`AC-026`、`AC-027`（RED 基线；不代表这些 AC 已通过）。
- **review_fact**：N/A — paired GREEN 后 review
- **completed_at**：`2026-08-13`
- **执行事实**：RED 只证明目标缺口可复现；历史 thread 的 canonical content hash、精确 token 分布和完整 step runtime facts 继续保持 `unavailable`/`partial`，未用测试数量或文档存在冒充语义覆盖。

#### T010 — GREEN：同步标准规范、治理和 bundles

- **ID**：T010
- **Phase**：Phase P5 — 治理同步、标准规范与最终回放
- **goal**：让 T009 通过，标准规范与真实 workflow/handler 一致，全部新增文件有 consumer/owner/test/删除条件。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"33682f4d055f10f9ca97a4621b2ae36ba7f3031056917856c9a355ba607c4ec9","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"65fbcd4cd7d995528573871820bb1125112d6f26f54f807fd9689ef3c4334d65","id":"PLAN"}]`
- **source_refs / decision_refs**：R-018～019、R-028、R-052～056、R-061～064、R-094、R-096～097 / D-001～004。
- **输入**：T009 RED、P1～P4 final files。
- **依赖**：T009
- **并行**：否 — RED/GREEN 串行。
- **FR**：FR-GOV-001、FR-AUDIT-001、FR-COST-001、FR-STATUS-001、FR-STAGE-002
- **AC**：AC-026、AC-027、AC-018、AC-019、AC-017、AC-008
- **动作**：写标准流程文档；同步 CONTEXT/ADR/move-map/catalog/reuse registry 和所有 bundles；完成直接消费四材料来源证明的回归场景及固定同样例成本报告，不以“运行次数更少”代替需求、步骤、review 证据无退化。
- **精确文件**：`skills/mini-task/skill-bundle.json`、`docs/standard-workflow.md`、`tests/contract/workflow-quality-regression.test.mjs`、`tests/fixtures/workflow-quality-cost-sample.json`、`skills/talk-with-zhipeng/skill-bundle.json`、`skills/grill-with-docs/skill-bundle.json`、`skills/spec-clarify/skill-bundle.json`、`skills/spec-analyze/skill-bundle.json`、`skills/wh-review/skill-bundle.json`、`skills/catalog.yaml`、`skills/reuse-registry.md`、`CONTEXT.md`、`docs/adr/0013-mini-task-compact-delivery-flow.md`、`docs/architecture/move-map.json`
- **boundary**：只同步 P1～P4 已实现事实；不改生产 runtime/历史 evidence。
- **输出**：治理和 replay GREEN。
- **Knowledge**：bundle/hash 必须由真实文件生成；文档不提供执行许可证。
- **verification_role**：GREEN
- **paired_task**：T009
- **gate_cmd**：`npx vitest run tests/contract/workflow-quality-regression.test.mjs tests/requirements-completeness-audit-acceptance.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-GOV-REPLAY` — 三任务、标准流程、governance/bundle 正负例通过。
- **evidence_path**：`quality/tests/P5-governance.txt`
- **STOP**：文档与 handler 不一致、无 consumer 新文件、需新增 public runtime 时停止。
- **recovery**：回退治理同步，不回退已验证生产行为；修复真实 source。
- **task risk**：bundle stale 或文档掩盖 runtime 缺口。
- **test tier / test method**：fullstack / architecture contract + historical replay。
- **scenarios / commands / expected exit / oracle**：与 T009 相同，exit 0。
- **fixtures_services**：同 T009。
- **coverage limits**：最终全套与逐 AC 留给 T011。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 `docs/standard-workflow.md`、历史语义回放回归测试和成本诊断 fixture；P5 review 发现的第 4 项“交付/review 质量”漏检已在当前 phase 修复，并补充每个 stage 的“专业质量”说明；标准文档说明 build-plan 的 `final-spec-analyze` 是现有兼容命名，不新增第二套控制面；未修改历史 `move-map` 或生产 runtime。
- **executed_commands**：P5 focused GREEN、skill closure、package smoke、`npm run check`、`git diff --check` 均 exit 0；canonical 当前快照 receipt 为 `quality/tests/P5-current-snapshot-v7.json`，绑定 snapshot `bacf10faf35f0b87c8c8b78c9ac645dfcc28d086`。
- **evidence_refs**：`quality/evidence/build-code/P5-phase-card.json` sha256 `41da16a8997120903e83f9147e58fb5547da7b4f07eaf7b6816f9bfdf6ba0b17`；`quality/tests/P5-current-snapshot-v7.json` sha256 `2e7112bb5f3e6e58643397d3310bac2601fdaec104b6d486341bcd20abfcb912`；当前测试输出路径和 hash 保留在 executed_commands；`quality/evidence/P5-final-focused-review-input-v4.json`；review attempt `quality/reviews/attempts/55aa8387-83c5-4be7-a58a-8fcc75b7cae3/attempt.json`；result `quality/reviews/results/build-code-default-bacf10faf35f0b87c8c8b78c9ac645dfcc28d086-55aa8387-83c5-4be7-a58a-8fcc75b7cae3.json`；report `quality/reviews/reports/55aa8387-83c5-4be7-a58a-8fcc75b7cae3.md`。
- **covered_ac**：`AC-008`、`AC-017`、`AC-018`、`AC-019`、`AC-026`、`AC-027`（当前 GREEN，成本比较仍为 `observation_only`）。
- **review_fact**：当前 P5 phase review available；1/1 有效异源 reviewer，`opencode/coding` 无 findings；`opencode/v4flash` 与 `codex/luna` 为 SAME_SOURCE，原始事实保留；actionable serious findings 为 0。此前两次材料预检失败均按 `MATERIAL_INCOMPLETE` 保留，未冒充 provider 审查。
- **completed_at**：`2026-08-13`
- **执行事实**：标准规范覆盖五个 stage 的输入、步骤、产物、完成/失败边界、下游交接和六项大白话摘要；每个 stage 的 analyzer 要求检查实际语义与证据，发现问题在当前 stage 修复；历史缺失事实与 token 不可得性保持真实状态；当前 P5 implementation phase 已完成，下一步为 T011 aggregate 和 final integration review。

#### T011 — FINAL：current-snapshot aggregate verification

- **ID**：T011
- **Phase**：Phase P5 — 治理同步、标准规范与最终回放
- **goal**：对当前完整 snapshot 只运行一次 aggregate，逐 AC trace 并做 final integration review。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"33682f4d055f10f9ca97a4621b2ae36ba7f3031056917856c9a355ba607c4ec9","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"65fbcd4cd7d995528573871820bb1125112d6f26f54f807fd9689ef3c4334d65","id":"PLAN"}]`
- **source_refs / decision_refs**：R-001～097、D-001～016 → 全部 FR/AC。
- **输入**：T002、T004、T006、T008、T010 的真实 facts 和 current diff。
- **依赖**：T002、T004、T006、T008、T010
- **并行**：否 — aggregate 消费全部前序事实。
- **FR**：FR-PREP-001、FR-INTERACT-001、FR-TRACE-001、FR-STAGE-001、FR-STAGE-002、FR-STEP-001、FR-REPAIR-001、FR-EXEC-001、FR-REVIEW-001、FR-RESULT-001、FR-STATUS-001、FR-COST-001、FR-MINI-001、FR-MINI-002、FR-MINI-003、FR-MINI-004、FR-LIFECYCLE-001、FR-GOV-001、FR-AUDIT-001
- **AC**：AC-001、AC-002、AC-003、AC-004、AC-005、AC-006、AC-007、AC-008、AC-009、AC-010、AC-011、AC-012、AC-013、AC-014、AC-015、AC-016、AC-017、AC-018、AC-019、AC-020、AC-021、AC-022、AC-023、AC-024、AC-025、AC-026、AC-027
- **动作**：在同一 current snapshot 顺序执行 P1～P5 五条 focused Vitest gate，再执行一次 `npm run check`，保存每条退出码/coverage limits；逐 AC trace；生成冻结的 `quality/evidence/T011-final-review-input.json`，运行 `node skills/wh-review/scripts/wh-review-cli.mjs run quality/evidence/T011-final-review-input.json` 并保存 result/report ref，不创建新状态权威。
- **精确文件**：`docs/standard-workflow.md`、`tests/contract/workflow-quality-regression.test.mjs`
- **boundary**：files 为只读 current-snapshot anchors；最终任务不再修改生产文件，finding 回受影响 task。
- **输出**：最终测试、逐 AC、review 和交接事实。
- **Knowledge**：局部绿色不覆盖缺失 phase；unavailable 不改写；无变化不重复全量。
- **verification_role**：N/A — non-behavior change: aggregate verification
- **paired_task**：N/A — aggregate has no RED/GREEN pair
- **gate_cmd**：`npx vitest run tests/contract/stage-interaction-batching.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/spec-analyze-completeness.test.mjs skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs tests/contract/review-materials-contract.test.mjs tests/integration/mini-task-delivery.test.mjs tests/integration/mini-task-a-resume.test.mjs tests/integration/vnext-delivery-close.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/stage-completion.test.mjs tests/stage-completion-facts.test.mjs tests/m15-monitoring-integration.test.mjs tests/m15-monitoring-diagnostics.test.mjs tests/e2e/vnext-five-stage-current.test.mjs tests/contract/workflow-quality-regression.test.mjs tests/requirements-completeness-audit-acceptance.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && npm run check`
- **expected_exit**：0
- **oracle**：`ORACLE-FINAL` — 全部适用 AC、跨 phase seam、skill closure/smoke/structure 和 current snapshot 一致。
- **evidence_path**：`quality/tests/final-aggregate.txt`
- **STOP**：命令不可执行、AC 缺失、snapshot 漂移、serious finding 未处置或需要新决定时停止并返回受影响 task。
- **recovery**：保留原始输出，只修受影响 task/phase；不机械重跑未变化 phase。
- **task risk**：aggregate 绿被误写成产品/审查/Git/close 全完成。
- **test tier / test method**：fullstack / final aggregate + per-AC trace + integration review。
- **scenarios / commands / expected exit / oracle**：全部 AC、成功/失败/取消/恢复、五阶段、review、mini-task、Git、历史 seam；aggregate gate/0/ORACLE-FINAL；final review CLI/0/可信 result/report ref 或 truthful unavailable。
- **fixtures_services**：使用各 phase 已声明 fixtures；最终命令负责既有清理，不访问真实 provider/remote。
- **coverage limits**：真实 provider 可用性、真实外部 push 和不可得历史 token 作为独立事实，不由本命令证明。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：在当前完整 snapshot 上通过官方 canonical receipt writer 执行一次 P1～P5 aggregate Vitest 与 `npm run check`；构建并验证 27 条 AC 的 integration review subject；完成当前 snapshot 的 final integration wh-review。未修改生产文件，未新增状态权威。
- **executed_commands**：`npx vitest run tests/contract/stage-interaction-batching.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/spec-analyze-completeness.test.mjs skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs tests/contract/review-materials-contract.test.mjs tests/integration/mini-task-delivery.test.mjs tests/integration/mini-task-a-resume.test.mjs tests/integration/vnext-delivery-close.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/stage-completion.test.mjs tests/stage-completion-facts.test.mjs tests/m15-monitoring-integration.test.mjs tests/m15-monitoring-diagnostics.test.mjs tests/e2e/vnext-five-stage-current.test.mjs tests/contract/workflow-quality-regression.test.mjs tests/requirements-completeness-audit-acceptance.test.mjs --poolOptions.forks.singleFork --no-fileParallelism && npm run check`；官方 receipt exit 0；19 files、330 tests；`npm run check` exit 0；receipt `quality/tests/T011-final-aggregate.json` snapshot `fc186c866f0dcbfb4529a0d2105907d3c8ef0a8b`，receipt sha256 `29e106ed81c9d32fd561868fddd5a9b92b38e20ca3ef70346cefe38615d2a15b`，output sha256 `c53a170cf97ec3bfadd604127f38251c6e5e7807043eb61e1d85d92ac5b8375f`。
- **evidence_refs**：`quality/tests/T011-final-aggregate.json`；`quality/evidence/implementation.json`；`quality/evidence/T011-final-integration-review-input.json` sha256 `3fb9d2f83ad4c9c45d9c548a194d254db906658c2dcdcbafd558a6880028ace8`；integration review attempt `quality/reviews/attempts/0a21a719-dd36-4782-bbc0-d2b115c2d837/attempt.json`；result `quality/reviews/results/build-code-default-fc186c866f0dcbfb4529a0d2105907d3c8ef0a8b-0a21a719-dd36-4782-bbc0-d2b115c2d837.json`；report `quality/reviews/reports/0a21a719-dd36-4782-bbc0-d2b115c2d837.md`。
- **covered_ac**：`AC-001`～`AC-027` 全部进入当前 integration AC trace；测试与 review 证据绑定同一 snapshot。历史精确 token、真实外部 push 和 provider 永久可用性不由本任务命令证明，继续保持 `unavailable`/独立事实。
- **review_fact**：`available`；当前 integration review 1 个有效异源 reviewer（`opencode/coding`），无 findings，serious findings=0；`opencode/v4flash` 与 `codex/luna` 保留为 `SAME_SOURCE` 排除事实；没有手动终止健康会话。
- **completed_at**：`2026-08-13`
- **执行事实**：当前四份材料、27 条 AC、completed task facts、implementation receipt 和 GREEN aggregate receipt 均绑定同一 snapshot；integration subject formal status 为 `available`、audit gaps 为空。build-code 完成，下一步进入 verify-code；verify 完成前不做 close、commit、merge、push 或 cleanup。

### Verify

- **Target**：全部 FR/AC 与跨 phase seam。
- **gate_cmd**：P5 focused gate；随后 T011 显式 P1～P5 aggregate Vitest + `npm run check` + final review CLI。
- **expected_exit**：focused 1→0；FINAL=0。
- **evidence_path**：`quality/tests/P5-governance.txt`、`quality/tests/final-aggregate.txt`
- **Oracle**：ORACLE-GOV-REPLAY、ORACLE-FINAL。

### Knowledge

build-code 交给 verify-code 的是当前真实测试/review/AC/Git facts，不是单一 completed。

### STOP

- source/FR/AC/task/oracle 孤立、bundle stale、宪法无证据、最终命令损坏或 serious finding 未处置。

### Done

- P5 RED/GREEN、最终 aggregate、逐 AC、final review、成本对比和大白话交接事实齐全。

### Risks and rollback

- **Risk**：最后统一补文档制造假闭合。
- **Prevention**：P5 只消费 P1～P4 真实实现/facts，漂移测试 fail-loud。
- **Rollback / recovery**：回受影响 task，不全链重跑。

## 4. Final current-snapshot aggregate strategy

- **tier / method**：fullstack / 显式 P1～P5 aggregate Vitest + `npm run check` + current-snapshot final integration review。
- **scenarios**：全部 27 AC；成功/失败/取消/恢复；五阶段 step/profile；review 三 attempts/SAME_SOURCE；mini-task/A resume；Git 授权；历史三任务。
- **command**: T011 `gate_cmd`，随后 `node skills/wh-review/scripts/wh-review-cli.mjs run quality/evidence/T011-final-review-input.json`
- **expected exit**：0
- **oracle**：ORACLE-FINAL — 当前代码、标准文档、bundles、结构和全部适用 AC 一致。
- **fixtures_services**：phase fixtures、临时 task store/Git repo/fake broker；各测试负责清理。
- **evidence_path**：`quality/tests/final-aggregate.txt`
- **coverage limits**：不证明真实 provider 永远可用、不执行未授权外部 Git、不估算历史 token。
- **STOP**：命令损坏、AC 缺失、snapshot 漂移、边界越界或需要新产品/架构决定。
- **execution_contract**：当前 snapshot 运行一次；失败保留原始输出，回受影响 task，不用全量重跑掩盖局部失败。

## Dependency Graph

### Deferred / Open execution index

| ID | owner | trigger | handoff / consumer | close condition |
| --- | --- | --- | --- | --- |
| DEFER-001 | T005/T008 | dirty workspace fact changes | existing workspace facts → monitoring | dirty positive/negative oracle passes |
| DEFER-002 | T001/T002/T008 | ask/wait/resume interaction | interaction host contract | batch/resume oracle passes |
| DEFER-003 | T007/T008 | build-spec research applies or skips | build-spec outcome → stage facts | executed/skipped/unavailable is readable |
| DEFER-004 | T007/T008/T011 | final implementation snapshot exists | build-code review and AC trace | current review/trace evidence recorded |
| DEFER-005 | T003/T004 | provider/material terminal result | wh-review result → stage workflow | recovery/path/cleanup oracle passes |
| DEFER-006 | T009/T010 | historical regression suite runs | four-material source binding → real consumers | three task failures replay without rewriting history |
| DEFER-007 | T003/T004 | record-only or subject change occurs | material/snapshot freshness consumer | record-only reuse and subject invalidation pass |
| DEFER-008 | T007/T008 | make-decision step finishes | stage outcome fact → handler/monitoring | each manifest step has authenticated outcome |
| DEFER-009 | T001/T002 | final analyzer runs after review repairs | build-plan quality fact | current five-input analyzer result recorded |
| DEFER-010 | T001～T010 | owning RED task begins | exact task file boundary | plan-task contract and phase oracle pass |
| DEFER-011 | T009/T010/T011 | baseline and candidate are available | same-sample cost facts → final summary | comparison is available or truthful unavailable |
| DEFER-012 | T001/T002 | make-decision requirement preparation | decision-log and stage summary | AC-001 oracle passes |
| DEFER-013 | T001/T002/T008 | any stage invokes consistency profile | stage packet → spec-analyze → facts | five profile schema/wiring pass |
| DEFER-014 | T007/T008 | Stage Agent completes/skips a step | stage outcome record → monitoring | missing/skipped/incomplete/unavailable cases pass |
| DEFER-015 | T007/T008 | build-plan reaches final analyzer step | workflow declaration → Stage Agent fact | actual invocation evidence is authenticated |
| DEFER-016 | T009/T010/T011 | candidate implementation is complete | same-sample cost facts → final summary | AC-019 passes without guessed token |
| DEFER-017 | T005/T006/T011 | close operation is applicable and authorized | existing task-close executor → physical readback | every applicable operation is read back |
| OPEN-001 | T005/T008 | dirty target is observed | existing dirty fact consumer | OPEN-SPEC-02 oracle closes |
| OPEN-002 | T007/T008 | conditional research decision occurs | build-spec workflow consumer | OPEN-SPEC-04 oracle closes |
| OPEN-003 | T003/T004 | public provider attempt terminates | runReviewRecovery only | three fresh requests/fallback contract passes |
| OPEN-004 | T005/T006 | actual dirty cleanup becomes applicable | current task-close authorization flow | N/A now; future operation requires bound authorization |
| OPEN-005 | T001/T002/T004 | confirmation or advice subject changes | material/snapshot freshness consumer | record-only change does not retrigger advice |
| OPEN-006 | T009/T010 | historical Talk evidence is requested | live thread ref + observed revision + four-material source binding | canonical hash remains unavailable; prevention regression passes |
| OPEN-007 | T001/T002/T008 | current-stage repair is needed | existing artifact owner writer | same-stage repair succeeds without transfer state |
| OPEN-008 | build-spec（closed） | historical final semantic audit completed | retained closed evidence | 不复用 ID；T011 final check 不改变其历史状态 |
| OPEN-009 | T005/T006 | user or stage invokes mini-task | mini-task runner | direct and enabling-change entry pass |
| OPEN-010 | T005/T006 | mini-task suitability is evaluated | four-material compact contract | boundary/explicit-user route cases pass |
| OPEN-011 | T005/T006 | mini-task scope expands materially | user choice handoff | pause/keep-small/ordinary-task cases pass |

- **order**：T001 → T002 → baseline authorization → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011

```text
T001 → T002 → baseline → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011
```

## Final Boundary Check

- [x] 每个 Phase 的 Goal、Files、Tasks、Verify、Knowledge、STOP、Done、Risks and rollback 完整。
- [x] 每个任务只有一张卡和一个完成区；文件是所属 Phase NEW/MODIFY 的子集。
- [x] 每个行为变化都有同命令、同 oracle 的 RED → GREEN；FINAL 只做一次聚合。
- [x] 依赖无环，FR/AC 双向追溯闭合，未知事实没有被写成假设或通过。
- [x] review、test、evidence 只作为事实记录，不是开始、继续或交付许可证。
