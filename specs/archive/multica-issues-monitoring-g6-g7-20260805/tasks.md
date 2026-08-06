# 任务清单：处理组 6、7、8 残留闭环与 WorkflowHub 执行质量

> 基于 `spec.md` 和 `plan.md`。build-plan 已把开发、注意事项和测试预判写到任务卡；build-code 按顺序执行，检查真实 changed files，必要时重新路由测试，不重新选产品方案。

- **Input**：
  - `specs/multica-issues-monitoring-g6-g7-20260805/spec.md`
  - `specs/multica-issues-monitoring-g6-g7-20260805/plan.md`
- **Status**：P1—P5 Phase handoff 已达到当前任务要求的 review pass；verify-code 有限架构师流程已完成，最终全量测试已通过；正式结论 incomplete 只表示逐 AC 专属语义证据仍未重做
- **Template version**：`plan-task.v3`
- **Spec SHA-256**：`21563eaef286bb1ebe07a7610f004a1a63e1c118ddb44f653caaee96ef311d3b`
- **Plan SHA-256**：`4e08fbe4a4043a2571c669f95039904b6685dfe14e54ec91599a277a69a07d16`

## 1. 执行摘要

- **Goal**：按 P1→P2→P3→P4→P5 顺序闭环当前材料、技能事实、review 语义和组 6/7/8 残留。
- **Main boundary**：只改本清单列出的精确文件；不改宪法、历史归档正文或公共入口集合。
- **Main risk**：普通 build-code 模型不能猜测缺失的测试设计；任何缺字段都必须停止并写 `MATERIAL_INCOMPLETE`。
- **First executable task**：T001。

## WorkflowHub Stage Progress

| Stage | Status | Task / phase IDs | Execution / evidence | Handoff / next |
| --- | --- | --- | --- | --- |
| build-code | completed | T001—T014 | P1—P4 有 pass；P5 current-v14 focused test exit 0，最近一次 P5 review 为 pass；旧 unavailable/timeout 事实保留 | Phase handoff 完成；最终完整测试与 verify-code 检查当前整体快照 |
| verify-code | incomplete | AC-G6—AC-WH-11 | focused 158 tests exit 0；唯一独立 review 已完成；最终 npm test safe 148/1290、exclusive 2/31 全部通过；逐 AC 专属证据保持 unknown | 向用户汇报证据边界和 unknown；close 不执行 |

`user_handoff`：计划和任务卡已经把“开发什么、注意什么、测试什么、用什么技能测试”写清；用户已授权连续推进，不再逐 stage 请求确认；不可逆操作仍未授权。每个 Phase 必须保留 review fact 和 finding disposition；review verdict 不是无限复审或继续工作的许可证。`risks_deferred` 见每个 Phase STOP 和第 6 节。

## 2. Global Constraints

- 当前材料只认 `specs/multica-issues-monitoring-g6-g7-20260805/`；根目录同名文件不是输入。
- 任务卡中的预判 tier、expected concrete skill、命令、预期退出码、oracle、fixture、evidence path 和 coverage limit 已由 build-plan 设计；build-code 只有在真实范围变化时才保留重路由事实，并按实际范围调用 concrete skill。
- 行为任务必须先 RED 后 GREEN；同一对使用相同 `gate_cmd` 和 oracle ID。
- `display_cmd` 只便于人读；pass/fail 只看实际 exit、oracle、snapshot 和 evidence。
- review、provider、inventory、history 和 test receipt 是事实，不是全局继续修复的许可证。
- 本任务 build-code 每个 Phase 交接前必须有 `wh-review=pass` fact 和主 agent finding disposition；unavailable/invalid evidence/未处置 serious finding 只能保持该 Phase `incomplete`。修复后只允许基于新快照做有限复审，不为取得 reviewer `pass` 无限复审。
- `frontend-testing` 不适用：本任务没有页面或浏览器路线。
- 任何实际改动超出 `精确文件`、出现新产品选择、或需要不可逆操作，立即 STOP 并回到主 agent。

### Test strategy contract（build-plan designs; build-code only executes）

- `test_strategy_owner`：`build-plan/high-intelligence-model`
- P1/P2/P3/P5：`feature` + 预判 `backend-testing`；P4/最终完整测试：`fullstack` + 预判 `fullstack-slice-testing`。
- `test-routing-advisor` 在 build-plan 先定层级和 expected skill；build-plan 不调用 blueprint 或 concrete testing skill。build-code 检查真实 changed files，必要时重判，再调用 concrete testing skill。
- P1—P4 是已完成的历史执行事实；当前 future execution 顺序以 D-015/P5 为准。历史卡片中出现的旧 build-plan blueprint/concrete testing 文本不能作为现行合同。
- 每张卡的 `test tier / test method`、`scenarios`、`gate_cmd`、`expected_exit`、`oracle`、`fixtures_services`、`evidence_path`、`coverage limits`、`STOP` 是最小可执行合同；缺一个就 `MATERIAL_INCOMPLETE`。旧任务卡也可用合并字段 `scenarios / commands / expected exit / oracle`，但新卡统一使用分开字段。
- `fixtures_services` 写在卡内；`browser_route=N/A`，不得临场启动浏览器。
- 所有 evidence 必须绑定 task、stage、snapshot tree 和实际命令；失败事实不可改写。

## Phase P1：受控当前材料与 Grill/技能事实边界

### Goal

make-decision 把 decision-log 写入受控 `specs/<task>/`；后续阶段读取同一 ArtifactDir；不产生第二份材料真相。

### Files

- **NEW**：`tests/contract/make-decision-artifact-path.test.mjs`
- **MODIFY**：`runtime/stage/stage-context.mjs`、`runtime/stage/stage-handlers.mjs`、`tools/cli/stage-runtime.mjs`、`workflows/make-decision/SKILL.md`、`docs/adr/0009-stage-content-authority.md`、`tests/contract/material-workspace.test.mjs`
- **REUSED BASELINE TEST**：`tests/contract/stage-decision-contract.test.mjs` 只作为回归输入运行，不宣称本 Phase 修改了它。
- **DO NOT TOUCH**：`CONSTITUTION.md`、`constitution-checklist.md`、`specs/archive/**`

### T001 — RED：受控 decision-log 路径合同

- **ID**：T001
- **Phase**：P1
- **goal**：用真实 fixture 证明 make-decision 不能把根目录 decision-log 当当前材料，且 ArtifactDir 路径/任务身份/hash 需要一致。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/multica-issues-monitoring-g6-g7-20260805/spec.md","hash":"9c2875d5f28afa77b23a4d4865efb246703b91b0c00e0eb7b9e91883e2ac011b","id":"multica-issues-monitoring-g6-g7-20260805-spec"},{"artifact_kind":"plan","ref":"specs/multica-issues-monitoring-g6-g7-20260805/plan.md","hash":"4a1d828f30dec5fd1c88513295fffbc366722fa66d2d104e2e4d713a0220e74f","id":"multica-issues-monitoring-g6-g7-20260805-plan"}]`
- **source_refs / decision_refs**：`R-007 → D-006 → FR-WH-003 → AC-WH-03`
- **输入**：`ArtifactDir.open`、`prepareMakeDecisionWorkspace`、`DESIGN_ARTIFACTS` 当前行为和 material-workspace fixture。
- **依赖**：N/A — first task
- **并行**：否 — P1 是所有后续阶段的 producer。
- **FR**：FR-WH-003
- **AC**：AC-WH-03
- **动作**：新增失败断言和路径/hash fixture；不先修实现。
- **精确文件**：`tests/contract/make-decision-artifact-path.test.mjs`
- **execution_file_paths**：`["tests/contract/make-decision-artifact-path.test.mjs"]`
- **boundary**：只允许新增该测试文件和本卡 fixture；不改 runtime。
- **输出**：RED 测试，错误路径或双写必须被识别。
- **Knowledge**：`ArtifactDir.reference/read/writeAtomic`；未核实的函数签名不得猜。
- **verification_role**：RED
- **paired_task**：T002
- **test_strategy_owner**：`build-plan/high-intelligence-model`
- **test tier / test method**：`feature` / `backend-testing`；跨 stage context 与 artifact contract，无 UI。
- **scenarios**：受控路径成功；根目录文件不消费；quality evidence 与当前材料 hash 不一致失败；task identity 漂移失败。
- **gate_cmd**：`npx vitest run tests/contract/make-decision-artifact-path.test.mjs`
- **expected_exit**：非零整数
- **oracle**：`ORACLE-P1-ARTIFACT-001`；RED 必须因目标合同未实现而失败，不得因命令/fixture 损坏失败。
- **fixtures_services**：Vitest temporary worktree/TaskKernel fixture；不使用外部 provider；测试后清理临时目录。
- **browser_route**：N/A — 无 UI
- **evidence_path**：`quality/tests/p1/t001-red.json`、`quality/tests/output/p1/t001-red/`
- **coverage limits**：不证明正式 publication 完成，不验证其他阶段 artifact。
- **STOP**：失败原因不是目标缺口、需要根目录 fallback、或需要新控制面时停止。
- **recovery**：保留 RED 输出，回 build-plan 修正 anchor/fixture；不弱化断言。
- **task risk**：旧 fixture 可能把根目录当事实；必须显式区分历史 fixture 和当前 contract。

#### 执行状态填写区

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增受控材料路径 RED fixture；该 fixture 后由 T002 实现通过。
- **executed_commands**：`[{"command":"npx vitest run tests/contract/make-decision-artifact-path.test.mjs","exit_code":"unknown","status":"red_receipt_unavailable_in_current_task_records"}]`；当前可核验 GREEN 命令见 T002/P1 receipt。
- **evidence_refs**：`[{"ref":"quality/tests/build-code-p1-finalbookkeeping.json","sha256":"fdea7f6632251f89a8da029c3c7476475cfca0ea2587cc5739b28c72fff3d2b9","kind":"test"}]`
- **covered_ac**：AC-WH-03
- **review_fact**：RED 原始 receipt 在当前 TaskHandle 中不可找到，保留为 `unknown`；P1 最终 phase review `semantic/verdict=pass`：`quality/reviews/results/build-code-default-78ae109b57f061092886b9862ff76e7023e3fb8d-b34c80e3-6ac3-49df-a67f-d9565b7ebda5.json`，sha256 `7694810230f2005cb68a8ecc9e44a87cdc576e7f8ce25cd5385436ba8f07e8cf`。
- **completed_at**：2026-08-05T17:04:00.613Z

### T002 — GREEN：写入受控 ArtifactDir

- **ID**：T002
- **Phase**：P1
- **goal**：让 T001 的路径、身份和 hash 断言通过，并同步 make-decision skill 与 ADR 边界。
- **design_state**：ready
- **versioned_refs**：同 T001
- **source_refs / decision_refs**：`R-005、R-006、R-007 → D-004、D-005、D-006 → FR-WH-001—003 → AC-WH-01—03`
- **输入**：T001 RED；`ArtifactDir`、make-decision context/handler、stage-runtime artifact command。
- **依赖**：T001
- **并行**：否 — RED/GREEN 串行。
- **FR**：FR-WH-001、FR-WH-002、FR-WH-003
- **AC**：AC-WH-01、AC-WH-02、AC-WH-03
- **动作**：给 make-decision 注入 ArtifactDir；允许受控 `decision-log.md`；校验 current artifact 与 quality decision evidence；更新 skill/ADR/已有 contract tests。
- **精确文件**：`runtime/stage/stage-context.mjs`、`runtime/stage/stage-handlers.mjs`、`tools/cli/stage-runtime.mjs`、`workflows/make-decision/SKILL.md`、`docs/adr/0009-stage-content-authority.md`、`tests/contract/material-workspace.test.mjs`
- **execution_file_paths**：`["runtime/stage/stage-context.mjs","runtime/stage/stage-handlers.mjs","tools/cli/stage-runtime.mjs","workflows/make-decision/SKILL.md","docs/adr/0009-stage-content-authority.md","tests/contract/material-workspace.test.mjs"]`
- **reused_test_paths**：`["tests/contract/stage-decision-contract.test.mjs"]`
- **boundary**：只改 make-decision context/artifact allowlist/handler consistency 和对应测试；不改 task identity 或质量记录 schema。
- **输出**：`decision-log.md` 在 `specs/<task>/`，根目录文件不被消费；Grill 沟通规则写进 skill。
- **Knowledge**：T001 fixture；`canonical-receipt-writer` 仍是不可变质量 evidence owner。
- **verification_role**：GREEN
- **paired_task**：T001
- **test_strategy_owner**：`build-plan/high-intelligence-model`
- **test tier / test method**：`feature` / `backend-testing`
- **scenarios**：受控写入；根目录拒绝；质量 evidence hash 匹配；Grill 未得用户回复不能标确认。
- **gate_cmd**：`npx vitest run tests/contract/make-decision-artifact-path.test.mjs tests/contract/material-workspace.test.mjs tests/contract/stage-decision-contract.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-P1-ARTIFACT-001`；ArtifactDir readback、hash equality 和错误路径 fail-loud。
- **fixtures_services**：同 T001；清理临时 worktree，不清理历史 archive。
- **browser_route**：N/A
- **evidence_path**：`quality/tests/p1/t002-green.json`、`quality/tests/output/p1/t002-green/`
- **coverage limits**：不证明 build-spec/build-plan invocation 已完成；那由 P2/P3 验证。
- **STOP**：需要复制第二份 decision-log、修改宪法、或 root fallback 才能通过时停止。
- **recovery**：恢复当前实现 diff，不删质量 evidence；回主 agent 处理架构冲突。
- **task risk**：旧 ADR 与新 ArtifactDir 边界冲突，必须保留变更理由和 hash。

#### P1 build-code 执行记录

- **status**：`completed`；实现、GREEN 测试和当前 P1 phase review 已有事实；T001 RED 原始 receipt 在当前 TaskHandle 中不可找到，标记 `unknown`，不补造非零结果。
- **GREEN**：`npx vitest run tests/contract/make-decision-artifact-path.test.mjs tests/contract/material-workspace.test.mjs tests/contract/stage-decision-contract.test.mjs` exit `0`；receipt `quality/tests/build-code-p1-finalbookkeeping.json`，snapshot tree `1ab941e1e293c034aee291eab68029de5c368975`，sha256 `fdea7f6632251f89a8da029c3c7476475cfca0ea2587cc5739b28c72fff3d2b9`。
- **review_fact**：P1 当前 phase review `semantic/verdict=pass`，结果 `quality/reviews/results/build-code-default-78ae109b57f061092886b9862ff76e7023e3fb8d-b34c80e3-6ac3-49df-a67f-d9565b7ebda5.json`，snapshot tree `78ae109b57f061092886b9862ff76e7023e3fb8d`；初始 revise findings 和最终空 finding 结果均保留。
- **finding_disposition**：P1 初始 review 的 AC/材料 hash/manifest 绑定问题已在后续当前材料修正中处理；T001 RED receipt 缺失为 `accepted_risk`，交接给 verify-code 重新核对，不冒充历史 RED 已有。
- **handoff**：P1 的实现/GREEN/review gate 可回放；RED 事实缺失保持 unknown，后续阶段不得引用它作为已证明的 RED。

### Verify

- **Target**：FR-WH-001—003 / AC-WH-01—03
- **gate_cmd**：`npx vitest run tests/contract/make-decision-artifact-path.test.mjs tests/contract/material-workspace.test.mjs tests/contract/stage-decision-contract.test.mjs`
- **expected_exit**：0
- **evidence_path**：`quality/tests/p1/phase.json`
- **Oracle**：`ORACLE-P1-ARTIFACT-001`
- **Phase review**：`wh-review` 对 P1 当前快照必须真实执行；主 agent 记录每个 finding 的 disposition 和证据。非 `pass` 结果保持质量事实，不为追求 pass 无限重审；缺证据或 serious finding 未处置时 completion 保持 incomplete。

### STOP / Done / Risks

- STOP：路径、身份、hash 不一致；需要新 ledger；或用户选择被 runtime 自动生成。
- Done：受控材料可读、根目录不消费、Grill 规则和 invocation 事实边界清楚。
- Risk/recovery：只回滚 P1 实现，不删除四份材料或原始 evidence。

## Phase P2：阶段技能调用和 review advisory 语义

### Goal

required stage skills 按顺序真实 dispatch 并留下事实；review lens 由 wh-review 单一 owner 调用；非 build-code review 不循环追求 pass，build-code 保留 review fact 和 finding disposition；普通快照变化不自动触发全量复审。

### Files

- **NEW**：`tests/contract/stage-skill-invocation-contract.test.mjs`、`tests/contract/review-controller-retry-policy.test.mjs`
- **MODIFY**：`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-skill-runtime.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/schemas/stage-skill-deps.schema.json`、`runtime/evidence/stage-completion-facts.mjs`、`runtime/evidence/check-skill-closure.mjs`、`runtime/review/review-controller.mjs`、`skills/wh-review/stage-skill-plan.json`、`skills/wh-review/manifest.json`、`skills/reuse-registry.md`、`skills/wh-review/scripts/wh-review-cli.mjs`、`workflows/build-spec/SKILL.md`、`workflows/build-spec/skill-deps.yaml`、`workflows/build-spec/steps.json`、`workflows/build-plan/SKILL.md`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-plan/steps.json`、`workflows/build-code/SKILL.md`、`workflows/build-code/skill-deps.yaml`、`workflows/verify-code/SKILL.md`、`workflows/verify-code/skill-deps.yaml`、`tools/cli/stage-runtime.mjs`、`tools/cli/smoke-local-skill-dispatch.mjs`、`tests/stage-review-cost-policy.test.mjs`、`tests/stage-completion-facts.test.mjs`、`tests/contract/build-code-apply-contract.test.mjs`、`tests/contract/review-materials-contract.test.mjs`、`tests/stage-plan-task-contract.test.mjs`、`core/__tests__/stage-skill-runtime.test.mjs`、`core/__tests__/check-skill-closure.test.mjs`
- **DO NOT TOUCH**：`CONSTITUTION.md`、`runtime/task/task-handle.mjs`

### T003 — RED：技能事实和 review 语义缺口

- **ID**：T003
- **Phase**：P2
- **goal**：证明缺 required invocation、delegated lens 被当成独立组件、重复同 snapshot review、或非 build-code finding 会被误当成推进 pass。
- **design_state**：ready
- **versioned_refs**：同 T001，plan ref 同本文件头。
- **source_refs / decision_refs**：`R-006、R-009 → D-005、D-008、D-009 → FR-WH-002、FR-WH-005 → AC-WH-02、AC-WH-05`
- **输入**：stage skill manifests、`stage-skill-plan.json`、completion facts 和 review cost fixtures。
- **依赖**：T002
- **并行**：否 — 依赖 current material identity。
- **FR**：FR-WH-002、FR-WH-005
- **AC**：AC-WH-02、AC-WH-05
- **动作**：新增 invocation/completion/review cost 失败断言；不修 runtime。
- **精确文件**：`tests/contract/stage-skill-invocation-contract.test.mjs`、`tests/contract/review-controller-retry-policy.test.mjs`、`tests/stage-review-cost-policy.test.mjs`
- **execution_file_paths**：`["tests/contract/stage-skill-invocation-contract.test.mjs","tests/contract/review-controller-retry-policy.test.mjs","tests/stage-review-cost-policy.test.mjs"]`
- **boundary**：只新增目标 fixture/assertion；不改变旧 review 记录。
- **输出**：RED 能区分 missing、not_invoked、unavailable 与 advisory finding。
- **Knowledge**：`stage-completion-facts` 的 required/conditional 语义；`wh-review` 是唯一 provider owner。
- **verification_role**：RED；**paired_task**：T004
- **test_strategy_owner**：`build-plan/high-intelligence-model`
- **test tier / test method**：`feature` / `backend-testing`
- **scenarios**：required skill 缺 fact；conditional skill 有明确 not-invoked reason；delegated lens 不能被 public stage dispatch；同 snapshot 二次全量 review；build-code final non-pass。
- **gate_cmd**：`npx vitest run tests/contract/stage-skill-invocation-contract.test.mjs tests/contract/review-controller-retry-policy.test.mjs tests/stage-review-cost-policy.test.mjs`
- **expected_exit**：非零整数
- **oracle**：`ORACLE-P2-SKILL-REVIEW-001`；失败必须来自语义缺口。
- **fixtures_services**：TaskKernel/review fixture；不调用真实 provider。
- **browser_route**：N/A
- **evidence_path**：`quality/tests/p2/t003-red.json`、`quality/tests/output/p2/t003-red/`
- **coverage limits**：不证明具体 spec skill 内容；由 P3/正式 invocation facts覆盖。
- **STOP**：若只能靠新增 completion ledger、删除原始 verdict 或强制所有 stage pass 才能通过，停止。
- **recovery**：保留 RED 事实，回 D-008/D-009 评审。
- **task risk**：可能误把 review lens 的 delegated invocation 当未调用，需使用真实 invocation key。

### T004 — GREEN：固化技能顺序和 review 语义

- **ID**：T004
- **Phase**：P2
- **goal**：让 T003 通过，且把具体调用顺序写进 stage skill/manifest，build-code 不含设计型 concrete testing skill。
- **design_state**：ready
- **versioned_refs**：同 T003。
- **source_refs / decision_refs**：`R-006、R-009 → D-005、D-008、D-009 → FR-WH-002、FR-WH-005 → AC-WH-02、AC-WH-05`
- **输入**：T003 RED；现有 `skill-deps.yaml` 和 `stage-skill-plan.json`。
- **依赖**：T003
- **并行**：否 — 需先确定 RED 失败归因。
- **FR**：FR-WH-002、FR-WH-005
- **AC**：AC-WH-02、AC-WH-05
- **动作**：按 D-009 更新 build-spec/build-plan/build-code/verify-code 的调用合同和 wh-review lens order；required 缺事实保持 incomplete；非 code advisory；build-code 缺 review fact、AC/测试证据或 serious finding disposition 不能宣称完成。
- **精确文件**：`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-skill-runtime.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/schemas/stage-skill-deps.schema.json`、`runtime/evidence/stage-completion-facts.mjs`、`runtime/evidence/check-skill-closure.mjs`、`runtime/review/review-controller.mjs`、`skills/wh-review/stage-skill-plan.json`、`skills/wh-review/manifest.json`、`skills/reuse-registry.md`、`skills/wh-review/scripts/wh-review-cli.mjs`、`workflows/build-spec/SKILL.md`、`workflows/build-spec/skill-deps.yaml`、`workflows/build-spec/steps.json`、`workflows/build-plan/SKILL.md`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-plan/steps.json`、`workflows/build-code/SKILL.md`、`workflows/build-code/skill-deps.yaml`、`workflows/verify-code/SKILL.md`、`workflows/verify-code/skill-deps.yaml`、`tools/cli/stage-runtime.mjs`、`tools/cli/smoke-local-skill-dispatch.mjs`、`tests/stage-review-cost-policy.test.mjs`、`tests/stage-completion-facts.test.mjs`、`tests/contract/build-code-apply-contract.test.mjs`、`tests/contract/review-materials-contract.test.mjs`、`tests/stage-plan-task-contract.test.mjs`、`core/__tests__/stage-skill-runtime.test.mjs`、`core/__tests__/check-skill-closure.test.mjs`
- **execution_file_paths**：`["runtime/stage/stage-runner.mjs","runtime/stage/stage-skill-runtime.mjs","runtime/stage/completion-predicates.mjs","runtime/schemas/stage-skill-deps.schema.json","runtime/evidence/stage-completion-facts.mjs","runtime/evidence/check-skill-closure.mjs","runtime/review/review-controller.mjs","skills/wh-review/stage-skill-plan.json","skills/wh-review/manifest.json","skills/reuse-registry.md","skills/wh-review/scripts/wh-review-cli.mjs","workflows/build-spec/SKILL.md","workflows/build-spec/skill-deps.yaml","workflows/build-spec/steps.json","workflows/build-plan/SKILL.md","workflows/build-plan/skill-deps.yaml","workflows/build-plan/steps.json","workflows/build-code/SKILL.md","workflows/build-code/skill-deps.yaml","workflows/verify-code/SKILL.md","workflows/verify-code/skill-deps.yaml","tools/cli/stage-runtime.mjs","tools/cli/smoke-local-skill-dispatch.mjs","tests/stage-review-cost-policy.test.mjs","tests/stage-completion-facts.test.mjs","tests/contract/build-code-apply-contract.test.mjs","tests/contract/review-materials-contract.test.mjs","tests/stage-plan-task-contract.test.mjs","core/__tests__/stage-skill-runtime.test.mjs","core/__tests__/check-skill-closure.test.mjs"]`
- **boundary**：只改声明、dispatch facts、review completion predicate 和测试；不加新公共命令，不新增 review owner。
- **输出**：历史 D-009 顺序，已被 D-015/P5 supersede；当前顺序见 P5 T013/T014 和 `plan.md` §13。build-plan 不调用 `testing-system-blueprint` 或具体 testing skill。
- **Knowledge**：每个 skill bundle 必须由 preflight 校验；host response 只一行 JSON。
- **verification_role**：GREEN；**paired_task**：T003
- **test_strategy_owner**：`build-plan/high-intelligence-model`
- **test tier / test method**：`feature` / `backend-testing`
- **scenarios**：所有 required stage skill executed；conditional not-invoked 有 reason；delegated lens closure 完整且只调用一次；未调用推导 incomplete；同 snapshot 不重复全量；build-code manifest 不含 concrete testing skill；non-code advisory 可继续；build-code final non-pass 不完成。
- **gate_cmd**：`npx vitest run tests/contract/stage-skill-invocation-contract.test.mjs tests/contract/review-controller-retry-policy.test.mjs tests/stage-review-cost-policy.test.mjs tests/contract/build-code-apply-contract.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-P2-SKILL-REVIEW-001`；invocation facts、review policy 和 manifest 断言全部满足。
- **fixtures_services**：同 T003；不请求真实 provider。
- **browser_route**：N/A
- **evidence_path**：`quality/tests/p2/t004-green.json`、`quality/tests/output/p2/t004-green/`
- **coverage limits**：不证明每个 skill 内容质量，只证明调用和语义闭环。
- **STOP**：需要同一 snapshot 重审、provider unavailable 被改成 pass、或 skill 缺失被隐藏时停止。
- **recovery**：保留 provider 原始事实，回滚当前语义改动，不删除历史 review。
- **task risk**：manifest 与 wh-review lens 重复声明时必须单一 owner、一次 invocation，不能双写。

### Verify

- **Target**：FR-WH-002、FR-WH-005 / AC-WH-02、AC-WH-05
- **gate_cmd**：`npx vitest run tests/contract/stage-skill-invocation-contract.test.mjs tests/contract/review-controller-retry-policy.test.mjs tests/stage-review-cost-policy.test.mjs tests/contract/build-code-apply-contract.test.mjs`
- **expected_exit**：0
- **evidence_path**：`quality/tests/p2/phase.json`
- **Oracle**：`ORACLE-P2-SKILL-REVIEW-001`
- **Phase review**：`wh-review` 对 P2 当前快照必须真实执行；主 agent 记录每个 finding 的 disposition 和证据。非 `pass` 结果保持质量事实，不为追求 pass 无限重审。

### STOP / Done / Risks

- STOP：required invocation 没事实、advisory 被隐式当 gate、或出现第二套 ledger。
- Done：调用顺序和产物在 skill/manifest/测试中可回放。
- Risk/recovery：只恢复当前 stage semantics；保留原始 invocation/review records。

#### P2 build-code 执行记录

- **status**：`completed`
- **actual_changes**：stage-owned dispatch 顺序和 invocation facts；owner/dispatch 声明；delegated wh-review lens 单一 owner；非 code review retry 语义；build-code review fact/disposition；build-code 不声明 concrete testing skill。
- **RED**：review/config contract 的精确 gate 曾以 exit `1` 暴露缺口，来源为代理执行记录；未把 RED 当作代码失败以外的质量通过。
- **GREEN**：精确 P2 gate `npx vitest run tests/contract/stage-skill-invocation-contract.test.mjs tests/contract/review-controller-retry-policy.test.mjs tests/stage-review-cost-policy.test.mjs tests/contract/build-code-apply-contract.test.mjs`，exit `0`，24 tests；补充 runtime/closure/completion 回归共 65 tests，exit `0`。
- **evidence_refs**：`quality/tests/build-code-p2-final3.json`，receipt hash `1425b982055088d00a770639b216a5f258bf687daa3d8ac76c5d2031ad2390cc`；当前快照 tree `581dc9b74f862d288c79b197fc3e441b4ebcaf38`；oracle `ORACLE-P2-SKILL-REVIEW-001`。
- **finding_disposition**：F-4 schema/closure 不一致合理，已收窄 schema 为必填 `owner=stage`、`dispatch=stage`，并让 runtime 严格拒绝缺字段；F-553/F-f6 impact/acceptance packet 的样板锚点是审查输入问题，已改为逐文件具体锚点后重审；F-6bb 的 `runStage` 观察属于低层测试/发布 helper 边界，已在注释中明确只有 `runOfficialStage` 是权威技能 dispatch 边界。仓库既有 `wh-review` bundle hash 漂移仍是 `unknown` 风险，不改写为 P2 通过。
- **review_fact**：`quality/reviews/results/build-code-default-581dc9b74f862d288c79b197fc3e441b4ebcaf38-ebabc093-0400-4ed2-90f0-8f84b8e5cad0.json`；当前快照独立 `wh-review` 返回 `semantic/verdict=pass`，无未处置 finding；provider 原始可用性仍按 result 保留，不把 unavailable 改写成成功。
- **handoff**：P2 的 review fact 和 finding disposition 已记录；P3 仍须按本文件先 RED、再 GREEN、再当前快照 `wh-review`，不能把 P2 的 review 事实复用为 P3 的事实。

## Phase P3：跨材料一致性与可执行测试合同

### Goal

spec-analyze 检查原始需求→decision-log→spec→plan→tasks→AC/test 的完整链；plan/tasks 每个 Phase、每张 task 和最终全量测试都有普通模型可执行的策略。

### Files

- **NEW**：`tests/contract/spec-analyze-completeness.test.mjs`
- **MODIFY**：`runtime/review/stage-materials.json`、`skills/wh-review/scripts/review-materials.mjs`、`skills/spec-analyze/SKILL.md`、`runtime/stage/stage-content-contracts.mjs`、`tests/contract/spec-stage-artifact-closure.test.mjs`
- **DO NOT TOUCH**：`CONSTITUTION.md`、`specs/archive/**`、`runtime/review/schemas/attempt.schema.json`

### T005 — RED：跨材料遗漏和测试策略缺口

- **ID**：T005
- **Phase**：P3
- **goal**：用坏 fixture 证明缺原始 R、FR/AC、source_refs、task、tier、skill、command、oracle、evidence 会被发现。
- **design_state**：ready
- **versioned_refs**：同 T001。
- **source_refs / decision_refs**：`R-005—R-009 → D-005—D-011 → FR-WH-004、FR-WH-006、FR-WH-007 → AC-WH-04、AC-WH-06、AC-WH-07`
- **输入**：当前四份材料结构、stage materials packet、plan/task contract。
- **依赖**：T004
- **并行**：否 — 必须读取已固定的 invocation/review boundary。
- **FR**：FR-WH-004、FR-WH-006、FR-WH-007
- **AC**：AC-WH-04、AC-WH-06、AC-WH-07
- **动作**：新增缺失/矛盾 fixture 和 RED 断言；不修改分析实现。
- **精确文件**：`tests/contract/spec-analyze-completeness.test.mjs`
- **execution_file_paths**：`["tests/contract/spec-analyze-completeness.test.mjs"]`
- **boundary**：只新增 fixture/assertion；不补产品需求。
- **输出**：RED 能列出 source gap、orphan task、uncovered AC、missing test strategy。
- **Knowledge**：decision-log 的 R/D 索引；不直接把下载目录变成运行时输入。
- **verification_role**：RED；**paired_task**：T006
- **test_strategy_owner**：`build-plan/high-intelligence-model`
- **test tier / test method**：`feature` / `backend-testing`
- **scenarios**：删一条原始 R；删一个 FR/AC；无 source ref；孤儿 task；缺测试 tier/skill/oracle/evidence；scope drift。
- **gate_cmd**：`npx vitest run tests/contract/spec-analyze-completeness.test.mjs`
- **expected_exit**：非零整数
- **oracle**：`ORACLE-P3-COVERAGE-001`；输出必须指向具体 source/FR/AC/task，而不是泛化“材料不完整”。
- **fixtures_services**：内存材料 fixture；无 provider、无浏览器；清理临时数据。
- **browser_route**：N/A
- **evidence_path**：`quality/tests/p3/t005-red.json`、`quality/tests/output/p3/t005-red/`
- **coverage limits**：只检查结构和覆盖，不判断 finding 是否应采纳。
- **STOP**：分析需要新增产品选择、第二份 raw requirement ledger 或自动替用户接受 finding 时停止。
- **recovery**：保留坏 fixture 和 RED 输出，回主 agent 评审分析边界。
- **task risk**：不要把 report finding 误当推进许可证。

### T006 — GREEN：完整 source coverage 和 test_strategy 合同

- **ID**：T006
- **Phase**：P3
- **goal**：让 T005 通过，并让 build-plan 产物足够被普通 build-code 直接执行。
- **design_state**：ready
- **versioned_refs**：同 T005。
- **source_refs / decision_refs**：`R-005—R-009 → D-005—D-011 → FR-WH-004、FR-WH-006、FR-WH-007 → AC-WH-04、AC-WH-06、AC-WH-07`
- **输入**：T005 RED；`stage-materials.json`、`review-materials.mjs`、`spec-analyze/SKILL.md`、plan/task content contracts。
- **依赖**：T005
- **并行**：否 — producer packet 先于 consumer analyzer。
- **FR**：FR-WH-004、FR-WH-006、FR-WH-007
- **AC**：AC-WH-04、AC-WH-06、AC-WH-07
- **动作**：把 decision-log 原始需求索引加入 build-plan packet；扩展 spec-analyze 的输入/输出和 test_strategy contract；明确 finding 处置字段但不创建 ledger。
- **精确文件**：`runtime/review/stage-materials.json`、`skills/wh-review/scripts/review-materials.mjs`、`skills/spec-analyze/SKILL.md`、`runtime/stage/stage-content-contracts.mjs`、`tests/contract/spec-stage-artifact-closure.test.mjs`
- **execution_file_paths**：`["runtime/review/stage-materials.json","skills/wh-review/scripts/review-materials.mjs","skills/spec-analyze/SKILL.md","runtime/stage/stage-content-contracts.mjs","tests/contract/spec-stage-artifact-closure.test.mjs"]`
- **boundary**：只改输入投影、分析规则、plan/task contract 和测试；不改 spec 的产品内容。
- **输出**：每个 Phase/task/final aggregate 有 tier、skill、scenario、command、expected exit、oracle、fixtures、evidence、coverage limit、STOP。
- **Knowledge**：`spec-analyze` report-only；主 agent 逐条判断 finding 合理性和处置。
- **verification_role**：GREEN；**paired_task**：T005
- **test_strategy_owner**：`build-plan/high-intelligence-model`
- **test tier / test method**：`feature` / `backend-testing`
- **scenarios**：完整材料通过；缺 source/AC/task/test strategy 失败；finding 记录为建议而非 pass；build-code 缺策略为 MATERIAL_INCOMPLETE。
- **gate_cmd**：`npx vitest run tests/contract/spec-analyze-completeness.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-P3-COVERAGE-001`；覆盖矩阵双向闭合、分析报告可追溯、策略字段完整。
- **fixtures_services**：内存材料 fixture + 当前 stage-material packet；不运行测试主体。
- **browser_route**：N/A
- **evidence_path**：`quality/tests/p3/t006-green.json`、`quality/tests/output/p3/t006-green/`
- **coverage limits**：不执行真实测试，不保证代码已实现；只保证设计合同完整。
- **STOP**：缺少原始需求、出现无来源 plan、或必须猜测真实 anchor 时停止。
- **recovery**：回 build-plan 修正材料/anchor；不在 build-code 临时补设计。
- **task risk**：packet 是 derived input，不得成为第五份当前材料。

### Verify

- **Target**：FR-WH-004、FR-WH-006、FR-WH-007 / AC-WH-04、AC-WH-06、AC-WH-07
- **gate_cmd**：`npx vitest run tests/contract/spec-analyze-completeness.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs`
- **expected_exit**：0
- **evidence_path**：`quality/tests/p3/phase.json`
- **Oracle**：`ORACLE-P3-COVERAGE-001`
- **Phase review**：`wh-review` 对 P3 当前快照必须真实执行；主 agent 记录每个 finding 的 disposition 和证据。非 `pass` 结果保持质量事实，不为追求 pass 无限重审。

### STOP / Done / Risks

- STOP：发现新的产品决定、无来源 scope 或无法确定真实接口。
- Done：普通模型可以只读 tasks 执行，不必重新选择测试或验收。
- Risk/recovery：derived packet 失败时只恢复投影，不产生第五份材料。

#### P3 build-code 执行记录

- **status**：`completed`
- **actual_changes**：新增 `spec-analyze` 完整性坏 fixture；build-plan packet 加入必需的 decision-log `raw_requirement_index` 投影；检查 decision-log/spec/plan/tasks/FR/AC/source refs/task/test strategy 的一致性；每个 finding 保留 `pending_main_agent_review`；删除重复的 `decision_log_index` 别名。
- **RED**：`npx vitest run tests/contract/spec-analyze-completeness.test.mjs`，exit `1`，证明缺少跨材料完整性实现。
- **GREEN**：精确 P3 gate `npx vitest run tests/contract/spec-analyze-completeness.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs`，当前 exit `0`，7 tests；`node --check` 和 `git diff --check` 通过。
- **evidence_refs**：`quality/tests/build-code-p3-finalhandoff.json`，receipt hash `3c6b32aa93ac65369e917ee1d2a73aa49ab77f43638e447b3d9752e88dab7ed5`；测试快照 tree `77d11bb64a05d703b36a06547cce427aa0f0d158`；oracle `ORACLE-P3-COVERAGE-001`。
- **finding_disposition**：F-d204317e8e16 合理：验收映射把 P1/P2 全部 change_id 和通用模板当作 P3 覆盖，已收窄为 6 个 P3 文件并使用实际 P3 实现路径；F-77b7f11c1e0b 合理：`raw_requirement_index` 与 `decision_log_index` 重复，已删除后加契约断言；attempt `4ee5989a...` 的 `MATERIAL_FORBIDDEN` 是审查 packet 锚点越过 candidate hunk 的输入错误，已改用不重叠锚点；首轮 `revise_required`、provider unavailable 和原始 finding 全部保留为审查事实，不改写为无事发生。
- **review_fact**：`quality/reviews/results/build-code-default-77d11bb64a05d703b36a06547cce427aa0f0d158-5a0586ac-f585-4803-8435-b30d904ba7f4.json`；当前最新快照独立 `wh-review` 返回 `semantic/verdict=pass`，主 agent 已逐条处置 finding；provider 原始可用性仍按 result 保留。
- **handoff**：P3 允许交接到 P4；P4 仍须独立执行其组 6/7/8 测试和当前快照 review，不能复用 P3 通过事实。

## Phase P4：组 6、7、8 残留闭环

### Goal

组 6 的 baseline/phase evidence/failure attribution/test lease、组 7 的 lineage/taxonomy/metrics、组 8 的 inventory/retention 登记全部可验证，历史边界不变。

### Files

- **NEW**：`tests/contract/review-lineage-taxonomy-metrics.test.mjs`
- **MODIFY**：`runtime/evidence/canonical-receipt-writer.mjs`、`runtime/stage/stage-content-contracts.mjs`、`runtime/review/schemas/attempt.schema.json`、`runtime/review/schemas/result.schema.json`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/review-result.mjs`、`skills/wh-review/scripts/review-provider-client.mjs`、`tools/architecture/history-inventory.mjs`、`tools/architecture/retention-audit.mjs`、`docs/architecture/history-inventory.json`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/retention-manifest.json`、`tests/official-component-receipts.test.mjs`、`tests/integration/history-read-only.test.mjs`、`tests/integration/governance-diagnostics-non-gate.test.mjs`
- **DO NOT TOUCH**：`CONSTITUTION.md`、`specs/archive/**`、`docs/architecture/legacy-**`、`runtime/task/task-handle.mjs`（除非 RED 证明需要）

### T007 — RED：组 6 lease、baseline 和阶段证据

- **ID**：T007
- **Phase**：P4
- **goal**：让并发、命令失败、lease 超时、快照漂移、baseline 混淆、顺序错误和证据缺失真实失败。
- **design_state**：ready
- **versioned_refs**：同 T001。
- **source_refs / decision_refs**：`R-001、R-002、R-004 → D-001、D-002 → FR-G6-001—004 → AC-G6`
- **输入**：`captureTests`、stage content contract、official receipt fixtures。
- **依赖**：T006
- **并行**：否 — 先完成 P3 contract。
- **FR**：FR-G6-001—004
- **AC**：AC-G6
- **动作**：在已有 receipt/stage fixtures 中加入目标失败断言；不修 runtime。
- **精确文件**：`tests/official-component-receipts.test.mjs`
- **execution_file_paths**：`["tests/official-component-receipts.test.mjs"]`
- **boundary**：只新增 G6 fixture/assertion；不改 task lock implementation。
- **输出**：RED 覆盖 lease 超时/释放、两类 baseline、phase evidence、failure attribution、snapshot drift。
- **Knowledge**：`canonical-receipt-writer:captureTests` 当前使用 test capture lock；锁等待必须是有限可观察事实。
- **verification_role**：RED；**paired_task**：T008
- **test_strategy_owner**：`build-plan/high-intelligence-model`
- **test tier / test method**：`fullstack` / `fullstack-slice-testing`；跨 receipt、TaskKernel、stage completion 和 concurrency seam。
- **scenarios**：成功 capture；命令非零；并发等待超时；owner 崩溃；快照漂移；integration baseline 与 implementation baseline 混用；phase 顺序/证据缺失。
- **gate_cmd**：`npx vitest run tests/official-component-receipts.test.mjs`
- **expected_exit**：非零整数
- **oracle**：`ORACLE-P4-RESIDUAL-001`；每个失败归因具体到 lease/baseline/evidence/phase/snapshot。
- **fixtures_services**：TaskKernel temporary task、controlled child command/lock fixture；不启动 provider；清理 lock 和 temp task。
- **browser_route**：N/A
- **evidence_path**：`quality/tests/p4/t007-red.json`、`quality/tests/output/p4/t007-red/`
- **coverage limits**：不覆盖 G7/G8；不证明真实外部并发环境。
- **STOP**：RED 不能稳定复现、需要无限等待或需要恢复旧 gate/control plane 时停止。
- **recovery**：保存输出和 lock 状态，清理只限本 task temporary fixture；不删除历史 records。
- **task risk**：测试 lease 不能永久等待，避免运行卡死。

### T008 — GREEN：组 6 事实和 lease 边界

- **ID**：T008
- **Phase**：P4
- **goal**：让 T007 通过，明确两类 baseline、阶段证据原子性、失败归因和有限 lease。
- **design_state**：ready
- **versioned_refs**：同 T007。
- **source_refs / decision_refs**：`R-001、R-002、R-004 → D-001、D-002 → FR-G6-001—004 → AC-G6`
- **输入**：T007 RED；receipt writer、stage completion/content contract、official receipt tests。
- **依赖**：T007
- **并行**：否 — RED/GREEN 串行。
- **FR**：FR-G6-001—004
- **AC**：AC-G6
- **动作**：实现有限等待/超时/释放事实；区分 integration baseline 与 implementation baseline；将 phase order/evidence/failure attribution 绑定当前 snapshot，并补 GREEN tests。
- **精确文件**：`runtime/evidence/canonical-receipt-writer.mjs`、`runtime/stage/stage-content-contracts.mjs`、`tests/official-component-receipts.test.mjs`
- **execution_file_paths**：`["runtime/evidence/canonical-receipt-writer.mjs","runtime/stage/stage-content-contracts.mjs","tests/official-component-receipts.test.mjs"]`
- **boundary**：只改 G6 symbols/regions；不新增 public command、不改变历史 task schema。
- **输出**：命令失败不假绿；lease 超时可退出并保留 owner/timeout；phase evidence 缺失为 incomplete。
- **Knowledge**：T007 RED；`task-handle` 默认 lock contract 只有在 RED 证明不足时才可提案修改。
- **verification_role**：GREEN；**paired_task**：T007
- **test_strategy_owner**：`build-plan/high-intelligence-model`
- **test tier / test method**：`fullstack` / `fullstack-slice-testing`
- **scenarios**：同 T007，GREEN 要证明成功/失败/并发/漂移都能区分。
- **gate_cmd**：`npx vitest run tests/official-component-receipts.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-P4-RESIDUAL-001`；receipt/output/snapshot 和失败归因可回放。
- **fixtures_services**：同 T007；测试后确认 lock 已释放。
- **browser_route**：N/A
- **evidence_path**：`quality/tests/p4/t008-green.json`、`quality/tests/output/p4/t008-green/`
- **coverage limits**：不证明 provider review lineage；由 T009/T010覆盖。
- **STOP**：需要吞掉命令非零、无限等锁、或修改 archive 时停止。
- **recovery**：回滚 G6 当前代码和测试；保留失败 receipt。
- **task risk**：超时参数必须有真实单位和可读错误，不能用 `MAX_SAFE_INTEGER` 伪装有限等待。

### T009 — RED：组 7 lineage、taxonomy、全量 metrics

- **ID**：T009
- **Phase**：P4
- **goal**：证明新 attempt/result 缺 request/prompt/round/prior/correction、失败分类映射不稳定或只看最后一次 attempt 时失败。
- **design_state**：ready
- **versioned_refs**：同 T001。
- **source_refs / decision_refs**：`R-001、R-002、R-004 → D-001、D-002 → FR-G7-001—003 → AC-G7`
- **输入**：review attempt/result schemas、review runner/provider/result helpers。
- **依赖**：T008
- **并行**：否 — 先固定 G6 receipt/snapshot 事实。
- **FR**：FR-G7-001—003
- **AC**：AC-G7
- **动作**：新增坏 attempt/result、retry/correction 和 metrics fixture；不修 schema/runner。
- **精确文件**：`tests/contract/review-lineage-taxonomy-metrics.test.mjs`
- **execution_file_paths**：`["tests/contract/review-lineage-taxonomy-metrics.test.mjs"]`
- **boundary**：只新增 G7 fixture/assertion；保留原始失败码。
- **输出**：RED 明确指出 lineage、taxonomy 或 all-attempt aggregation 缺口。
- **Knowledge**：review runner 已有 request/round/prior 组成部分；要从真实代码读取，不猜字段。
- **verification_role**：RED；**paired_task**：T010
- **test_strategy_owner**：`build-plan/high-intelligence-model`
- **test tier / test method**：`fullstack` / `fullstack-slice-testing`；跨 schema、runner、provider protocol 和 metrics。
- **scenarios**：初次请求；重试；correction；provider unavailable；invalid evidence；semantic result；全部 attempts 聚合。
- **gate_cmd**：`npx vitest run tests/contract/review-lineage-taxonomy-metrics.test.mjs`
- **expected_exit**：非零整数
- **oracle**：`ORACLE-P4-RESIDUAL-001`；具体失败字段/attempt ref/taxonomy/metric 被指出。
- **fixtures_services**：内存 review records/provider output fixture；不访问真实 provider；清理 temporary task。
- **browser_route**：N/A
- **evidence_path**：`quality/tests/p4/t009-red.json`、`quality/tests/output/p4/t009-red/`
- **coverage limits**：不证明真实 provider availability；不可用仍是事实。
- **STOP**：需要覆盖历史 attempt、删除原始失败或新增 successor/recovery 控制面时停止。
- **recovery**：保留 RED records；回 build-plan 修正 schema/consumer 边界。
- **task risk**：兼容旧记录不能变成新记录缺 lineage 的借口。

### T010 — GREEN：组 7 review 追踪和指标

- **ID**：T010
- **Phase**：P4
- **goal**：让 T009 通过，新增显式 lineage、稳定失败分类映射和 all-attempt metrics，并兼容历史记录读取。
- **design_state**：ready
- **versioned_refs**：同 T009。
- **source_refs / decision_refs**：`R-001、R-002、R-004 → D-001、D-002 → FR-G7-001—003 → AC-G7`
- **输入**：T009 RED；attempt/result schemas、review runner/provider/result helpers。
- **依赖**：T009
- **并行**：否 — schema producer 先于 runner consumer，runner 先于 metrics。
- **FR**：FR-G7-001—003
- **AC**：AC-G7
- **动作**：加入 `lineage` 对象；保存 request_id/prompt_hash/round/prior refs/correction ref/dispatch sequence；统一 failure taxonomy 原码+映射；按全部 attempt/retry/correction 聚合指标。
- **精确文件**：`runtime/review/schemas/attempt.schema.json`、`runtime/review/schemas/result.schema.json`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/review-result.mjs`、`skills/wh-review/scripts/review-provider-client.mjs`、`tests/contract/review-lineage-taxonomy-metrics.test.mjs`
- **execution_file_paths**：`["runtime/review/schemas/attempt.schema.json","runtime/review/schemas/result.schema.json","skills/wh-review/scripts/review-runner.mjs","skills/wh-review/scripts/review-result.mjs","skills/wh-review/scripts/review-provider-client.mjs","tests/contract/review-lineage-taxonomy-metrics.test.mjs"]`
- **boundary**：只改 G7 schema/consumer/metrics；旧 records 缺 lineage 时只读兼容，不回写覆盖。
- **输出**：一次 review 可从 request/prompt/round/prior/result 回放；失败分类不随重试改写；指标包含全量 attempts。
- **Knowledge**：review runner 现有 `effectiveReviewRound`、`requestId`、`previousRuntimeIds` 等真实锚点；执行前必须复核。
- **verification_role**：GREEN；**paired_task**：T009
- **test_strategy_owner**：`build-plan/high-intelligence-model`
- **test tier / test method**：`fullstack` / `fullstack-slice-testing`
- **scenarios**：同 T009；同时验证旧记录读取、新记录严格校验、attempt/result identity 一致。
- **gate_cmd**：`npx vitest run tests/contract/review-lineage-taxonomy-metrics.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-P4-RESIDUAL-001`；lineage refs、taxonomy mapping、all-attempt metric 和兼容读取全部满足。
- **fixtures_services**：同 T009；不启动真实 provider。
- **browser_route**：N/A
- **evidence_path**：`quality/tests/p4/t010-green.json`、`quality/tests/output/p4/t010-green/`
- **coverage limits**：不把 semantic verdict 变成阶段 pass；不证明 provider 可用。
- **STOP**：schema 破坏旧 records、原始 failure 被覆盖、或 metrics 只取 latest 时停止。
- **recovery**：回滚新 lineage consumer/schema，保留原始 attempt/result records。
- **task risk**：lineage 字段必须由真实 request/prompt 来源生成，不能用空字符串占位。

### T011 — RED：组 8 登记与历史只读校验

- **ID**：T011
- **Phase**：P4
- **goal**：证明新增/删除/变化文件能被 inventory/retention 识别，且归档正文变化会失败。
- **design_state**：ready
- **versioned_refs**：同 T001。
- **source_refs / decision_refs**：`R-001、R-003、R-004 → D-001、D-003 → FR-G8-001—002 → AC-G8`
- **输入**：history-inventory、retention-audit、现有 history-read-only/governance fixtures。
- **依赖**：T010
- **并行**：否 — 登记必须在运行时改动稳定后执行。
- **FR**：FR-G8-001—002
- **AC**：AC-G8
- **动作**：加入 inventory mismatch、retention mismatch、archive mutation 失败 fixture；不修工具/登记。
- **精确文件**：`tests/integration/history-read-only.test.mjs`、`tests/integration/governance-diagnostics-non-gate.test.mjs`
- **execution_file_paths**：`["tests/integration/history-read-only.test.mjs","tests/integration/governance-diagnostics-non-gate.test.mjs"]`
- **boundary**：只新增 G8 fixture/assertion；归档内容保持原样。
- **输出**：RED 明确报新增/删除/变化和 archive hash 变化。
- **Knowledge**：`captureBefore`/`verifyUnchanged`/`retention-audit` 已存在；inventory 是登记事实，不是 runtime input。
- **verification_role**：RED；**paired_task**：T012
- **test_strategy_owner**：`build-plan/high-intelligence-model`
- **test tier / test method**：`fullstack` / `fullstack-slice-testing`；跨 filesystem、architecture tools 和 read-only boundary。
- **scenarios**：真实新增；删除登记；内容 hash 改变；runtime 尝试读历史 inventory；retention manifest mismatch。
- **gate_cmd**：`npx vitest run tests/integration/history-read-only.test.mjs tests/integration/governance-diagnostics-non-gate.test.mjs`
- **expected_exit**：非零整数
- **oracle**：`ORACLE-P4-RESIDUAL-001`；具体 path/hash/retention 差异被报告。
- **fixtures_services**：temporary fixture root；不改真实 archive；测试后清理。
- **browser_route**：N/A
- **evidence_path**：`quality/tests/p4/t011-red.json`、`quality/tests/output/p4/t011-red/`
- **coverage limits**：不证明全仓 inventory 当前已更新；由 T012 和 final aggregate验证。
- **STOP**：只能通过改 archive 正文、允许 runtime history read 或删除历史证据才能通过时停止。
- **recovery**：丢弃临时 fixture 改动，保留 RED 输出；不碰真实 archive。
- **task risk**：登记文件更新必须与实际文件 hash 同步。

### T012 — GREEN：组 8 inventory/retention 登记

- **ID**：T012
- **Phase**：P4
- **goal**：让 T011 通过，更新真实登记，证明 archive 内容 hash unchanged，且 runtime 不消费历史 inventory。
- **design_state**：ready
- **versioned_refs**：同 T011。
- **source_refs / decision_refs**：`R-001、R-003、R-004 → D-001、D-003 → FR-G8-001—002 → AC-G8`
- **输入**：T011 RED；architecture tools 和真实当前文件列表。
- **依赖**：T011
- **并行**：否 — G8 是 P4 最后 producer。
- **FR**：FR-G8-001—002
- **AC**：AC-G8
- **动作**：更新 `history-inventory.json`、`repository-inventory.tsv`、`retention-manifest.json` 及工具必要校验；不改 archive/legacy 内容。
- **精确文件**：`tools/architecture/history-inventory.mjs`、`tools/architecture/retention-audit.mjs`、`docs/architecture/history-inventory.json`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/retention-manifest.json`、`tests/integration/history-read-only.test.mjs`、`tests/integration/governance-diagnostics-non-gate.test.mjs`
- **execution_file_paths**：`["tools/architecture/history-inventory.mjs","tools/architecture/retention-audit.mjs","docs/architecture/history-inventory.json","docs/architecture/repository-inventory.tsv","docs/architecture/retention-manifest.json","tests/integration/history-read-only.test.mjs","tests/integration/governance-diagnostics-non-gate.test.mjs"]`
- **boundary**：只改登记和校验逻辑；明确 archive/legacy 是 DO NOT TOUCH。
- **输出**：inventory 反映实际新增/删除/变化；retention/unchanged 检查可读；runtime history boundary 保持关闭。
- **Knowledge**：T011 RED；真实仓库文件列表、history inventory baseline 和 retention manifest 必须在当前 snapshot 读取。
- **verification_role**：GREEN；**paired_task**：T011
- **test_strategy_owner**：`build-plan/high-intelligence-model`
- **test tier / test method**：`fullstack` / `fullstack-slice-testing`
- **scenarios**：登记成功；archive hash unchanged；新增/删除/变化被准确列出；runtime 读取历史失败或保持禁止。
- **gate_cmd**：`npx vitest run tests/integration/history-read-only.test.mjs tests/integration/governance-diagnostics-non-gate.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-P4-RESIDUAL-001`；path/hash/retention 和 read-only assertions 全部通过。
- **fixtures_services**：同 T011；真实登记改动必须绑定当前 worktree snapshot。
- **browser_route**：N/A
- **evidence_path**：`quality/tests/p4/t012-green.json`、`quality/tests/output/p4/t012-green/`
- **coverage limits**：不把登记通过解释为历史产品功能完成；不授权 archive/cleanup。
- **STOP**：任何 archive hash 变化、runtime history read、或登记与实际文件不一致时停止。
- **recovery**：恢复登记文件到当前任务改动前的可验证状态；不执行 destructive cleanup。
- **task risk**：生成登记前确认所有 P4 代码已经在同一 snapshot，不使用另一个 worktree。

#### P4 build-code 执行记录

- **status**：`completed`
- **actual_changes**：组 6 增加有限 test-capture lease、超时 owner 事实、两类 baseline、phase evidence 和 failure attribution；组 7 增加 attempt/result lineage、failure taxonomy 和全量 attempt/retry/correction metrics；组 8 更新 inventory/retention 登记与只读诊断，未改 archive/legacy 内容。
- **RED**：T007 `npx vitest run tests/official-component-receipts.test.mjs` exit `1`、3 failures；T009 `npx vitest run tests/contract/review-lineage-taxonomy-metrics.test.mjs` exit `1`、3 failures；T011 `npx vitest run tests/integration/history-read-only.test.mjs tests/integration/governance-diagnostics-non-gate.test.mjs` exit `1`、1/8 failures。失败分别暴露 lease/baseline/evidence、lineage/taxonomy/metrics、inventory/retention/read-only 缺口；原始输出保留在对应 P4 RED 事实中。
- **GREEN**：T008 同官方 receipt gate exit `0`、30 tests；T010 lineage gate exit `0`、3 tests；T012 history/read-only gate exit `0`、8 tests。主 agent 复跑三组 GREEN 和 syntax/diff 检查均通过。
- **evidence_refs**：GREEN 分项 receipts：`quality/tests/build-code-p4-t008-green.json`（hash `92b2b56836560745925b8728b772582f4caed6446834b3e08f060067d31c2453`）、`quality/tests/build-code-p4-t010-green.json`（hash `762131d52210059012284180499e0f13195e26cec94c81effdb56cfd90e5f354`）、`quality/tests/build-code-p4-t012-green.json`（hash `eba19881b34e12db6e4006d6b7b646e8d90a065bf86540f812ca2c91b2c1f0dd`）；当前完整 gate receipt `quality/tests/build-code-p4-p4-gate-after-fixes.json`（hash `ffdf4e375de938ba5f00e0609ee443810230a75ccdbe488164c0757c36a16741`，snapshot tree `2bc311d9c050f667b1f0f732a027317616c9897b`）；oracle `ORACLE-P4-RESIDUAL-001`。
- **finding_disposition**：F-5b4b0cac2bee 合理：receipt 与候选快照不一致，已在当前快照重新 capture 并改用 `final-gate-current2`；F-888ee824c4f1 合理：全部 impact 复用同一泛化锚点没有审查意义，已改为 P4 逐文件影响映射，P1/P2/P3 明确标记前序阶段不重复裁决；F-e38614208649 合理：已修正 `stage-skill-plan.json` 缩进；首轮 `MATERIAL_FORBIDDEN`、旧 receipt mismatch、provider unavailable 和原始 findings 全部保留为审查事实。主 agent 已检查改动边界，未发现触碰 Constitution、archive、legacy 或 task-handle。M16/M17a/M17b retention audit 仍是 unknown learning，不改写为通过。
- **review_fact**：`quality/reviews/results/build-code-default-2bc311d9c050f667b1f0f732a027317616c9897b-abd31f74-7f39-4b4e-9048-90794807b5e3.json`；当前快照独立 `wh-review` 返回 `semantic/verdict=pass`，无未处置 finding；provider 原始可用性仍按 result 保留。
- **handoff**：P1—P4 历史 review 事实保留；P5 当前快照 review fact 和 finding disposition 处理后，下一步执行最终完整测试，再进入 verify-code。最终完整测试不能替代 P1—P5 的逐 Phase review。

## Phase P5：D-015 阶段顺序与真实测试路由 scope revision

### Goal

把最新确认的技能调用顺序、build-plan 设计边界、build-code 实际测试路由和 verify-code 反向回放写成可执行合同；不覆盖 P1—P4 的历史事实。

### Files

- **NEW**：`tests/contract/stage-routing-and-concrete-testing.test.mjs`
- **MODIFY**：当前四份材料、`workflows/make-decision/steps.json`、`workflows/build-spec/**`、`workflows/build-plan/**`、`workflows/build-code/**`、`workflows/verify-code/**`、`runtime/review/schemas/attempt.schema.json`、`runtime/review/schemas/result.schema.json`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/stage-skill-plan.json`、`skills/wh-review/manifest.json`、`skills/wh-review/skill-bundle.json`、`skills/wh-review/contracts/build-spec.md`、`skills/wh-review/contracts/build-plan.md`、`skills/reuse-registry.md`、`skills/catalog.yaml`、planning/test skill contracts
- **DO NOT TOUCH**：`CONSTITUTION.md`、`constitution-checklist.md`、`specs/archive/**`、`runtime/task/task-handle.mjs`
- **同步事实文件**：`skills/catalog.yaml`、`skills/wh-review/skill-bundle.json`、`skills/spec-tasks/SKILL.md`、`skills/spec-tasks/templates/tasks-template.md`、`skills/spec-tasks/skill-bundle.json`、`skills/test-routing-advisor/skill-bundle.json`、`skills/testing-system-blueprint/skill-bundle.json`、`skills/backend-testing/skill-bundle.json`、`skills/frontend-testing/skill-bundle.json`、`skills/fullstack-slice-testing/skill-bundle.json`、`tests/contract/stage-skill-invocation-contract.test.mjs`、`tests/contract/build-code-apply-contract.test.mjs`、`tests/contract/spec-stage-artifact-closure.test.mjs`、`tests/stage-review-cost-policy.test.mjs`、`tests/stage-plan-task-contract.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`

### T013 — RED：最新阶段顺序和测试时机合同

- **ID**：T013
- **Phase**：P5
- **goal**：证明旧合同仍会把 planning lens 当 delegated provider、把 blueprint/concrete testing skill 放进 build-plan，或让 build-code 不检查真实范围。
- **design_state**：ready
- **versioned_refs**：同 T001；P5 变更前的 review snapshot/material hash 保留在外置 review 事实中。
- **source_refs / decision_refs**：`R-011 → D-015 → FR-WH-009、FR-WH-010 → AC-WH-09、AC-WH-10`
- **依赖**：T012；**并行**：否
- **FR/AC**：FR-WH-009、FR-WH-010 / AC-WH-09、AC-WH-10
- **动作**：新增顺序、owner、禁止项、真实路由和 verify reverse-check 断言；不先修合同。
- **精确文件**：`tests/contract/stage-routing-and-concrete-testing.test.mjs`
- **execution_file_paths**：`["tests/contract/stage-routing-and-concrete-testing.test.mjs"]`
- **test tier / test method**：`feature` / `backend-testing`
- **scenarios**：build-spec 顺序和 UI 条件；build-plan research skipped、顺序和禁止技能；build-code route/re-route/concrete skill；verify 原始需求/Design/完整流程/unknown。
- **gate_cmd**：`npx vitest run tests/contract/stage-routing-and-concrete-testing.test.mjs`
- **expected_exit**：非零整数
- **oracle**：`ORACLE-P5-STAGE-ROUTING-001`；失败必须指向具体文件/顺序/技能。
- **fixtures_services**：本地 YAML/JSON/Markdown fixture；不调用真实 provider，不启动浏览器。
- **browser_route**：N/A
- **evidence_path**：`quality/tests/p5/t013-red.json`、`quality/tests/output/p5/t013-red/`
- **coverage limits**：不证明真实 provider 可用，只证明合同可回放。
- **STOP**：若只能通过重复 review、新增 ledger 或放宽具体技能时机才能通过，停止并回主 agent。
- **verification_role**：RED；**paired_task**：T014

### T014 — GREEN：落地 D-015 并闭合当前材料

- **ID**：T014
- **Phase**：P5
- **goal**：让 T013 通过，且普通 build-code 能按预判执行、按实际范围重新路由并调用具体 testing skill。
- **design_state**：ready
- **versioned_refs**：同 T001；GREEN receipt 必须绑定 P5 当前 snapshot。
- **source_refs / decision_refs**：`R-011 → D-015 → FR-WH-009、FR-WH-010 → AC-WH-09、AC-WH-10`
- **依赖**：T013；**并行**：否
- **FR/AC**：FR-WH-009、FR-WH-010 / AC-WH-09、AC-WH-10
- **动作**：更新当前四份材料、阶段依赖/步骤、wh-review 独立 owner、planning/testing skill 文档及契约测试；不调用 testing-system-blueprint。
- **精确文件**：同 P5 Files；另含 lineage schema/runtime 和 `review-lineage-taxonomy-metrics.test.mjs`；不改 Constitution、archive、task-handle。
- **execution_file_paths**：`["runtime/stage/stage-content-contracts.mjs","runtime/stage/stage-skill-runtime.mjs","runtime/stage/stage-runner.mjs","workflows/make-decision/steps.json","workflows/build-spec/SKILL.md","workflows/build-spec/skill-deps.yaml","workflows/build-spec/steps.json","workflows/build-plan/SKILL.md","workflows/build-plan/skill-deps.yaml","workflows/build-plan/steps.json","workflows/build-code/SKILL.md","workflows/build-code/skill-deps.yaml","workflows/build-code/steps.json","workflows/verify-code/SKILL.md","workflows/verify-code/steps.json","skills/wh-review/stage-skill-plan.json","skills/wh-review/manifest.json","skills/wh-review/skill-bundle.json","skills/wh-review/contracts/build-spec.md","skills/wh-review/contracts/build-plan.md","skills/reuse-registry.md","skills/catalog.yaml","skills/simplicity-guard/SKILL.md","skills/plan-eng-review/SKILL.md","skills/spec-tasks/SKILL.md","skills/spec-tasks/templates/tasks-template.md","skills/spec-tasks/skill-bundle.json","skills/test-routing-advisor/SKILL.md","skills/test-routing-advisor/skill-bundle.json","skills/backend-testing/SKILL.md","skills/backend-testing/skill-bundle.json","skills/frontend-testing/SKILL.md","skills/frontend-testing/skill-bundle.json","skills/fullstack-slice-testing/SKILL.md","skills/fullstack-slice-testing/skill-bundle.json","skills/testing-system-blueprint/SKILL.md","skills/testing-system-blueprint/skill-bundle.json","tests/contract/stage-routing-and-concrete-testing.test.mjs","tests/contract/stage-skill-invocation-contract.test.mjs","tests/contract/build-code-apply-contract.test.mjs","tests/contract/spec-stage-artifact-closure.test.mjs","tests/stage-review-cost-policy.test.mjs","tests/stage-plan-task-contract.test.mjs","skills/wh-review/scripts/__tests__/simple-contracts.test.mjs","specs/multica-issues-monitoring-g6-g7-20260805/decision-log.md","specs/multica-issues-monitoring-g6-g7-20260805/spec.md","specs/multica-issues-monitoring-g6-g7-20260805/plan.md","specs/multica-issues-monitoring-g6-g7-20260805/tasks.md"]`
- **test tier / test method**：`feature` / `backend-testing`
- **scenarios**：同 T013；另验证每个 expected skill 的 bundle/owner/dispatch 合法，ordered dispatcher 按 steps 顺序产生 invocation facts。
- **gate_cmd**：`npx vitest run tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs tests/contract/review-controller-retry-policy.test.mjs tests/contract/review-lineage-taxonomy-metrics.test.mjs tests/stage-review-cost-policy.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-P5-STAGE-ROUTING-001`；P5 合同、顺序、禁止项和 concrete testing routing 全通过。
- **fixtures_services**：同 T013；测试后清理临时 fixture。
- **browser_route**：N/A
- **evidence_path**：`quality/tests/p5/current-v13.json`、`quality/tests/output/build-code-p5-current-v13`
- **coverage limits**：不把合同测试当成真实第三方 provider 可用；provider unavailable 仍保留原事实。
- **STOP**：阶段 owner 重复、build-plan 偷调具体 testing skill、build-code 缺 concrete skill invocation、或 verify 缺 unknown 分支时停止。
- **verification_role**：GREEN；**paired_task**：T013

#### P5 build-code 执行记录

- **status**：`completed`
- **RED 事实**：T013 的历史 RED receipt 当前不可得，保持 `unknown`；没有补造失败输出。T014 GREEN 已在同一当前快照实际执行。
- **GREEN receipt**：v11/v12 只作为旧事实（v11 为材料变更前的绿色 receipt，v12 review preflight 在 provider 前停止）；当前材料语义收窄后，重新采集 `quality/tests/p5/current-v13.json` 并绑定当前树，不能沿用旧 hash。
- **actual_changes**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-skill-runtime.mjs`、`runtime/stage/stage-runner.mjs`、`tools/cli/stage-runtime.mjs`、`runtime/review/schemas/**`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/skill-bundle.json`、`skills/catalog.yaml`、`workflows/**`、`skills/**`、`tests/contract/**`、当前四份材料；未触碰 Constitution、archive、task-handle。
- **review_fact**：d891/418cb84f/d3e09/a28fad39/v10/v11/v13 只作为历史事实；当前候选 runner 的第一次正式回读记录为 `quality/reviews/attempts/98dd30af-1efb-474c-a86d-b36a39b5fc7e/attempt.json`，明确失败原因为 `MATERIAL_INCOMPLETE: review packet exceeds 330 KiB`，没有 provider verdict 或 finding。主 agent 判断这是 review packet 边界问题，不是业务 finding；已把完整 diff 限定为当前实现直接拥有的 runtime、workflow、wh-review 和明确涉及的 planning/testing skills，其余改动保留 changed-file summary，`review-materials-contract` 6 tests / exit 0，当前生成 packet manifest 为 312805 bytes。随后一次使用旧输入的回读因 `phase_map` change_id 过期，记录为 `quality/reviews/attempts/dbc58176-293f-4fa3-bc29-ac5114c45833/attempt.json`；没有把它当 provider finding，也没有继续重试 provider。
- **handoff**：P5 current-v14 定向测试 exit 0；最近一次 P5 阶段 `wh-review` 为 `pass`，主 agent 已逐条处置原始 findings。此前 packet 超限、provider unavailable 和历史 timeout 均保留为历史事实，不覆盖最近 pass。P5 已按当前任务 `phase_handoff_review: pass_required` 完成交接；最终完整测试和 verify-code 仍须检查当前整体快照。

#### P5 build-code review finding disposition（最近一次审查）

审查结果：`quality/reviews/results/build-code-default-d40ee03968666f441bd15a09032becaf86bb4079-c40579f7-12eb-4c80-aede-e73613525e31.json`，provider 原始输出、adjudication 和最终 `pass` 全部保留。主 agent 逐条判断：

| Finding | 来源与影响 | 主 agent 判断 | 建议修正 / 处置 | 交接对象 |
| --- | --- | --- | --- | --- |
| F-f0f80b937997 | `pi/coding`；测试证据树与审查候选树不一致，无法证明当前代码已测 | 合理 | 重新执行 P5 测试并绑定最终 snapshot | `tasks.md`、build-code |
| F-44ba8721fe3c | `pi/coding`；map 把 83 个 change 无差别挂到两条 AC，审查失去定位意义 | 合理 | 按实际路径和 AC 作用域拆分 map，再复审 | wh-review packet |
| F-23018fe1fb39 | `pi/coding`；approved spec 与 AC 输入被压成同一份内容 | 合理 | AC 输入只保留当前 AC 条目 | wh-review packet |
| F-77cc193fc5ca | `pi/coding`；把 Phase packet 的空 canonical-evidence 当成缺证据 | 不成立；Phase 规则不要求 integration 的 `phase_coverage` | `rejected_invalid`；保留原始 finding | wh-review contract |
| F-66f02127fe73 | `pi/coding`；以无效 diff 锚点和 LOC baseline 推断本 Phase 过度复杂 | 证据锚点无效，LOC 也不是本 Phase 行为验收点 | `rejected_invalid`；保留 simplicity 观察 | simplicity-guard |
| F-e5b20c50f7d8 | `pi/coding`；单一 provider 推断 spec-analyze 校验应移出核心合同 | 未证明不可复用；校验正是本需求明确要求的跨材料检查 | `rejected_invalid`；不因 LOC 推断移动核心合同 | spec-analyze / runtime |
| F-fb42e6ba0645 | `pi/coding`；无生产消费者的 `dispatchDeclaredStageSkills` 与 ordered dispatcher 重复 | 合理 | 已删除重复 helper，保留 ordered dispatcher | `runtime/stage/stage-skill-runtime.mjs`、tests |

第二次 P5 复审结果：`quality/reviews/results/build-code-default-4afe299529e9a4b8dc78fed054b50171626a22a7-f032cf0d-b87e-4ab7-8515-7ebc0d909970.json`。provider 有 2 条原始 finding；最终聚合仍为 `pass`，但主 agent 不直接照收：

| Finding | 来源与影响 | 主 agent 判断 | 建议修正 / 处置 | 交接对象 |
| --- | --- | --- | --- | --- |
| F-f12f8afe2ec1 | `pi/coding`；hash header 正则失效会让 spec-analyze 漏掉材料绑定错误 | 合理，且可复现 | 修正正则转义，新增错误 hash RED/ GREEN 覆盖 | `runtime/stage/stage-content-contracts.mjs`、spec-analyze |
| F-d2383d661787 | `pi/coding`；map entry 共用一个锚点，无法逐条复核影响面 | 合理；本次调用构造确实过度泛化 | 按实际 changed-file 分组选择对应路径/未变更行，重新复审 | wh-review packet |

#### P5 build-code review finding disposition（当前快照最新审查）

审查结果：`quality/reviews/results/build-code-default-46243af81282bd4bf0eb407b9ddc30dd60a9080d-52587ecf-0403-4956-9015-fe954f30b285.json`，`pi/coding` 返回 `pass`；`cursor/grok` 原始 provider 失败事实保留。主 agent 逐条判断：

| Finding | 来源与影响 | 主 agent 判断 | 修正 / 延期 | 交接对象 |
| --- | --- | --- | --- | --- |
| F-20ca90927771 | `pi/coding`；P5 审查包的两个 AC 共用过宽 change_id 分组和通用锚点，削弱逐 AC 追踪 | 合理，但只影响审查材料质量，不改变实现行为 | 当前交付接受风险；后续 review packet 生成改为按实际文件/AC 分组，不能把通用锚点当完整证据 | wh-review packet / 后续审查 |
| F-43382b6e569d | `pi/coding`；`raw_requirement` 与生成的 `raw_requirement_index` 命名关系可能让 build-plan 维护者误解 | 观察到命名差异，但不是运行时矛盾：前者是输入字段，后者是 planning artifact 的投影字段；provider 锚点无效，不能据此判实现缺陷 | `rejected_invalid`；保留命名说明风险，暂不改动当前材料合同 | build-plan review contract |
| F-507b3debd27a | `pi/coding`；P5 gate 未直接调用 build-code 的 concrete-testing 选择分支，无法证明 invocation fact | 合理，属于本阶段真实测试缺口 | 已补 `tests/contract/stage-skill-invocation-contract.test.mjs`：选择 `backend-testing` 并断言 invocation fact；补测后 gate 需重新采集 | P5 build-code / 测试证据 |
| F-faab24e3d257 | `pi/coding`；复杂度报告的既有预算仍超限，继续扩大会增加维护风险 | 合理的维护风险，但不是本次功能验收失败，也不应在本 Phase 偷拆 spec-analyze 扩大范围 | 当前接受风险；延期到下一次规划周期，只允许拆分或复用，不新增控制面 | simplicity-guard / 后续 plan |

#### P5 build-code review finding disposition（e7c7065f 当前快照）

审查结果：quality/reviews/results/build-code-default-e7c7065fadb6f236ad2056dc79a85081afee16e5-c0783cbb-c238-4eb1-a598-174933cf75c0.json，聚合结果为 pass。主 agent 不把聚合结果当自动结论，逐条判断如下：

| Finding | 来源与影响 | 主 agent 判断 | 建议修正 / 处置 | 交接对象 |
| --- | --- | --- | --- | --- |
| F-5f42ee92d6a4 | opencode/v4flash；ordered dispatcher 只在 publication 传入配置时运行，正式 CLI run 没有接线，可能导致必需 invocation fact 缺失 | 合理，属于真实生产调用链缺口 | 已让 stage-runtime run 接受受控 stage_skill_dispatch 结果映射，并将其交给官方 stage runner；新增契约断言。主机仍必须先通过 invoke-stage-skill 产生并绑定 outcome | tools/cli/stage-runtime.mjs、stage routing contract |
| F-d8d8b0eb2006 | opencode/v4flash；纯材料任务例外与 concrete-testing 无条件步骤冲突 | 合理，属于真实合同矛盾 | dispatcher 支持带理由的 testing_not_applicable，并为所有具体测试技能留下 not_invoked 事实；补单元/契约测试 | runtime/stage/stage-skill-runtime.mjs、build-code steps/skill |
| F-c10a4fb23919 | opencode/v4flash；审查包 impact/reuse/phase map 使用不存在的通用锚点，削弱逐 AC 追踪 | 合理，但只影响 review packet 质量，不改变实现行为 | 当前快照接受风险；下一次 review packet 必须按真实文件/AC 分组，取消不存在的 canonical-only 锚点，不能继续复用单桶 map | wh-review packet / final review |
| F-ed213035f853 | opencode/v4flash；T013 历史 RED receipt 缺失，当前只证明 GREEN | 合理；缺失事实必须保持 unknown，不能补造 | 保留 unknown；交给 verify-code 独立复核同一 oracle 的 RED 缺口，不把 P5 GREEN 扩大解释成 RED→GREEN 完整证明 | verify-code |
| F-3eed7f915bee | opencode/v4flash；指出 stage-content-contracts.mjs 过大，并把它与 1000 行 core 预算相连 | 维护风险观察有意义，但预算结论不成立：仓库预算只计算 core/，该文件在 runtime/；本次不为此扩大拆分范围 | accepted_risk；延期给 simplicity-guard，后续只在有真实 consumer/收益时拆分，不新增控制面 | simplicity-guard / 后续 plan |
| F-fae6e0194c39 | pi/coding；以同一错误预算推断为 major，并要求拆分两个校验器 | rejected_invalid；provider 的直接证据没有证明该文件属于 core 行数预算，且不应以无效证据强行改变本阶段边界 | 保留原始 provider finding 和无效证据状态；维护风险已由 F-3eed 的 accepted_risk 接续，不重复扩大范围 | wh-review evidence adjudication |

本次代码修正后的 P5 定向测试已通过：5 个文件、32 个测试、exit 0；新的当前快照测试 receipt 和复审结果须在本节写入后重新采集，旧 e7c7065f 结果不能冒充新快照证据。

#### P5 build-code review finding disposition（d891f457 历史审查）

审查结果：`quality/reviews/results/build-code-default-d891f457bd97b2514288347f2460a1f7ae69f86e-a0acc83b-ddfb-46df-ad52-3a405932c141.json`，当前快照 `d891f457bd97b2514288347f2460a1f7ae69f86e`，聚合结果 `semantic/pass`。第一次同快照尝试因验收锚点缺少真实 `spec.md` 路径而 `unavailable`，原始事实保留；修正材料后才获得有效 provider 结果。主 agent 逐条判断：

| Finding | 来源与影响 | 主 agent 判断 | 修正 / 延期 | 交接对象 |
| --- | --- | --- | --- | --- |
| F-2f8dc77fbe7e / F-a1be71096458 | `pi/coding`、`opencode/v4flash`；本轮 review packet 的 map 将 88 个 change_id 单桶挂到两条 AC，通用锚点降低逐 AC 追踪意义 | 合理，但属于审查包构造质量，不是当前运行时代码行为；主 agent 独立核对后采纳 | 历史 reviewer verdict 原样保留，不把 minor 改写成阻塞；后续 review packet 按真实文件和 AC 分组，改用真实变更文件的非重叠上下文锚点或明确 `outside_diff_reason` | wh-review packet / final integration review |
| F-b7596fdf5a72 | `opencode/v4flash`；tasks 的 spec-analyze 记录把 FR 写成 20 个，和 spec 中实际 19 个不一致，影响事实可复核性 | 合理，属于当前材料事实错误 | 已改为 19 个 FR，并同步核对 AC=13、task=14；保留 provider 原始 finding | tasks.md / spec-analyze |
| F-e128265fe789 | `opencode/v4flash`；attempt/result schema 允许整体省略 lineage，D-015 的回放事实因此可能只靠 writer 路径保证 | 合理，属于真实契约缺口 | 已把 `lineage` 加入 attempt/result 顶层 required，并让 validateAttemptIdentity 无条件校验；新增缺 lineage 的 schema 回归测试 | runtime/review schema、review-lineage contract |
| F-f4091979bca4 | `opencode/v4flash`；tasks 的 P5 Verify 曾写 review 只是 advisory，与 decision-log/plan/workflow/spec 的旧 P5 pass 交接要求矛盾 | provider 锚点被判 invalid，但主 agent 独立复核材料后确认旧语义矛盾真实存在，采纳 | 已由 D-016 把 P1—P5 统一为 review fact + finding disposition；不再把 `pass` 设为交接门槛；原始 finding 和 invalid-anchor 分类均保留 | spec.md、plan.md、tasks.md、verify-code |

以上 finding 已逐条处理；通用 map 质量问题延期但不隐藏，FR 计数和 review 语义已修正。由于 schema 和四份材料发生变化，`d891f457` 的旧测试/review 只作为历史事实，不能直接作为最终 P5 交接证据，必须重新采集当前快照。

#### P5 build-code review finding disposition（418cb84f 最终当前快照）

审查结果：`quality/reviews/results/build-code-default-418cb84f6aa20ed948cfe98ccb0695b559f6a015-9316df93-fa19-470e-bbaf-5384abe9e493.json`，当前快照 `418cb84f6aa20ed948cfe98ccb0695b559f6a015`，聚合结果 `semantic/pass`；`opencode/v4flash` 的 `OUTPUT_INVALID` 原始失败事实保留，`pi/coding` 提供有效语义审查。主 agent 逐条判断：

| Finding | 来源与影响 | 主 agent 判断 | 修正 / 延期 | 交接对象 |
| --- | --- | --- | --- | --- |
| F-4a3c6cf25f0a | `pi/coding`；P5 receipt 只跑五个定向文件，未覆盖所有本任务历史改动测试 | 观察合理，但不是当前合同缺失：P5 已在 plan/tasks 明确为 `feature/backend-testing`，FINAL 才是 `fullstack/fullstack-slice-testing` 和 `npm test`；把所有历史测试塞进 P5 会扩大 Phase 边界 | `accepted_nonblocking_scope`；保留原始 finding，要求 FINAL 按 `ORACLE-FINAL-CURRENT-SNAPSHOT-001` 覆盖完整 suite，不把 P5 定向 receipt 冒充最终完整证据 | FINAL fullstack test / verify-code |

本轮未发现新的 blocking/major 实现问题。P5 的 `current-v9` 及其 review 只作为历史事实；当前材料语义已再次变化，v13 测试与一次当前快照 review 完成后，核对 review fact、测试、AC 和 serious finding disposition，再决定是否进入 FINAL。

#### P5 spec-analyze finding disposition

以下是 build-plan 生成 tasks 后第一次 spec-analyze 的原始 findings；它们先由主 agent 逐条判断，再允许继续推进。修正后的当前重跑结果为 `ok=true`、`errors=[]`、`findings=[]`。

| Finding | 来源 / 影响 | 主 agent 判断与修正 | 交接对象 |
| --- | --- | --- | --- |
| SNA-001：FR-WH-007 coverage gap | `spec-analyze`；FR-WH-007 在计划/任务的压缩写法中可能无法被反向识别 | 合理；把 plan/tasks 的 FR-WH-004、007 拆成显式 FR-WH-004 与 FR-WH-007 行，保留 AC-WH-04 与 AC-WH-07 一一对应 | `plan.md`、`tasks.md`、spec-analyze |
| SNA-002：AC-WH-07 coverage gap | `spec-analyze`；AC-WH-07 同样存在压缩写法解析风险 | 合理；补显式 AC-WH-07 追踪行，并重新跑完整材料分析 | `plan.md`、`tasks.md`、spec-analyze |
| SNA-003—SNA-016：14 个 missing_test_strategy | `spec-analyze`；当前任务已分开写 tier、场景、命令、退出码、oracle 等，校验器却只认一个合并字段 | 不合理；这是分析器字段词汇与当前任务模板不一致。修正分析器同时接受当前分开字段和旧合并字段；不降低任何字段要求 | `runtime/stage/stage-content-contracts.mjs`、spec-analyze |
| SNA-017：plan §11 和 T001 `versioned_refs` 仍使用旧材料 hash | 当前四份材料的 hash 绑定不一致，后续 agent 无法确定 plan/spec 绑定的是哪一版材料 | 合理；只修正 plan §11、T001 `versioned_refs` 和 tasks 的 Plan SHA；未新增需求、未重跑 provider review | `plan.md`、`tasks.md`、spec-analyze |

- **原始事实保留**：以上 findings 不删除、不改写为 provider pass；仅记录主 agent 的 valid/invalid disposition 和实际修正。
- **当前复核命令**：当前四份材料调用 `validateSpecAnalyzeCompleteness`；结果 `ok=true`、11 个原始需求、19 个 FR、13 个 AC、14 个 task、最终 aggregate 存在，且无 finding。

#### P5 build-plan wh-review finding disposition

本次正式 `build-plan` 异源审查结果为 `revise_required`；它是建议事实，不是 build-plan 的 pass 门槛。主 agent 已逐条判断如下：

| Finding | 来源 / 影响 | 主 agent 判断与建议修正 | 交接对象 |
| --- | --- | --- | --- |
| F-2c3998df0424 | `pi/k3`；T013/T014 缺 `versioned_refs`，普通执行模型无法按同一材料身份回放 | 合理，已补 `versioned_refs`，沿用 T001 的当前 spec/plan hash；保留 review 原文 | `tasks.md` T013/T014 |
| F-654e9fa831e7 | `pi/k3`；T001 pending 与 P2—P4 completed 形成 producer/consumer 反转 | 合理，已补 P1 执行记录、GREEN receipt 和 P1 `wh-review=pass`；历史 T001 RED receipt 找不到，明确为 `unknown`，不补造非零结果 | `tasks.md` P1 记录；verify-code 复核 RED 缺口 |
| F-892784edc586 | `pi/k3`；P5 Verify 仍指向 P4 的目标、命令和 oracle | 合理，已改为 FR-WH-009/010、P5 gate、`ORACLE-P5-STAGE-ROUTING-001` 和 `quality/tests/p5/phase.json`；并扩展 spec-analyze 检查 Phase Verify 与 task oracle | `tasks.md` P5 Verify；spec-analyze |
| F-91a77b173c39 | `pi/k3`；T004 旧文案可能诱导 build-code 在 build-plan 调 blueprint/concrete testing | 合理，已加历史 supersede 标记并在全局约束声明 D-015/P5 优先；当前执行仍只按 P5 合同 | `tasks.md` T004；build-code |
| F-a7d84e098206 | `pi/k3`；plan/spec、decision-log、tasks 的 hash 绑定冲突或占位 | 合理，已统一当前 spec/decision-log/plan hash，并扩展 spec-analyze 做 hash 一致性检查；占位符已删除 | `plan.md`、`tasks.md`、spec-analyze |
| F-dff806f7eeaf | `pi/k3`；plan 汇总表和依赖图漏掉 P5/FR-WH-009/010，D-015 无双向追踪 | 合理，已补 P5 顺序、依赖和两条追踪行；spec-analyze 现在会检查 Phase 是否出现在 Implementation Order 和 traceability | `plan.md`、spec-analyze |

- **未提升为正式 finding 的 provider 输出**：其他 provider 在本次 attempt 未形成可计入的 semantic result；其原始 transport/provider 事实仍由 wh-review attempt 保留，不把未聚合输出当成已确认 finding。
- **build-plan invocation facts**：本次 provider 包仍没有真实 stage-owned invocation fact；这是当前 `build-plan` 运行事实缺口，保持 `incomplete`，交给下一次正式 build-plan 执行/发布补齐，不用 plan 文案冒充已调用。

### Verify

- **Target**：FR-WH-009、FR-WH-010 / AC-WH-09、AC-WH-10
- **gate_cmd**：`npx vitest run tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs tests/contract/review-controller-retry-policy.test.mjs tests/stage-review-cost-policy.test.mjs`
- **expected_exit**：0
- **evidence_path**：`quality/tests/p5/phase.json`
- **Oracle**：`ORACLE-P5-STAGE-ROUTING-001`
- **Phase review**：P5 是 build-code Phase，主 agent 已检查本轮所有可见 finding；本次 runner 没有产出 provider finding，已记录 `PROCESS_INTERRUPTED/unavailable`。最终完整测试仍只运行一次，但 P5 review 缺口使当前 verification 保持 incomplete；不为取得 pass 无限重审。

#### verify-code 实际回放（历史记录，D-017）

- **旧验证包 snapshot**：`e693e90b6e0109ba18f85d3750218e20133ff317`；材料交接行同步前 digest：`c3be542d9fb9e51bb1393e9cfe6fba5249a2f4b1843eec2c02034431a47a5b3a`。该包只作历史证据，不能冒充当前快照。
- **当前材料回放 snapshot**：当前工作区 snapshot tree 为 `cbdc17a83209e74ac23fa709c022c79c808c6713`，source digest 为 `ae6f1a8958a14d47d7a2986204c4dda32334b51846aa176726023e305e6e0e89`，四份材料 digest 为 `58d7060869e5178a51ba7f9037d0939351579d7852b22a0a6a6a4b8769d03799`；`spec-analyze` 当前回放 `ok=true`、11 个原始需求、19 个 FR、13 个 AC、14 个 Task、最终 aggregate 存在、0 finding。该结果是当前材料一致性事实，不替代最终测试和独立 review。
- **contract tests**：`npx vitest run workflows/verify-code/phase-1-contract.test.mjs tests/verify-code-facts.test.mjs tests/verify-code-design-alignment.test.mjs tests/verify-code-freshness.test.mjs tests/verify-requirement-replay-contract.test.mjs --reporter=verbose`；4 files / 25 tests / exit 0。
- **reverse replay**：已写入 `quality/verify.json`，覆盖 R-001—R-011、D-001—D-016；没有凭空增加 INC-001—INC-015，因为当前 decision-log 没有这些来源。
- **current full test**：在当前快照执行过一次有界 `gtimeout -k 20 600 npm test -- --reporter=dot`；到 10 分钟上限后 exit 124。过程中观察到架构派生报告过期和 `wh-review` bundle hash 漂移；没有把超时写成 pass，也没有启动第二次全量测试。
- **定点修正后的证据**：已同步 `docs/architecture/repository-inventory.tsv`、complexity reports 和 `skills/wh-review/skill-bundle.json` 的真实 hash；随后只重跑受影响的两个定点合同测试：repository inventory `9/9`、canonical archive skill dispatch `1/1`，均 exit 0。这些定点结果不能替代完整 `npm test` 的超时事实。
- **verify review**：当前候选材料没有可绑定的 verify-code canonical acceptance aggregate；已有 full test 也是 exit `130`，不能拼成 provider 输入。依照“缺证据标 unknown、review unavailable 不伪造 pass”的合同，未为凑一个 verdict 另造 verify packet；`independent_review_resolution=unavailable/incomplete` 作为事实交接，不把 P5 的局部 review 冒充 verify review。
- **结论**：`quality/verify.json.status=incomplete`；AC 和原始来源没有被统一宣称通过，缺口交给用户可见交接，不执行 close。

### STOP / Done / Risks

- STOP：lease 假成功、review lineage 丢失、archive hash 变化、或出现旧 control plane。
- Done：G6/G7/G8 有历史阶段 test/evidence 和当前 reverse replay；但不是全部 current-snapshot evidence，verification 保持 incomplete。
- Risk/recovery：只回滚本 Phase 当前实现/登记；保留原始 provider、test、inventory facts。

## 3. Dependency Graph

```text
T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011 → T012 → T013 → T014 → T015 → T016 → FINAL
```

- 每张 RED 卡必须先于对应 GREEN 卡；禁止跳过 RED。
- P4 内部不能并行执行写同一 schema/runner/inventory 的任务；设计可并行，实际写入按上图串行。
- `FINAL` 不是新代码任务，是 P6 完成后在同一 snapshot 执行的最终测试和逐 AC 简短回放。
- 每个 Phase 的 `wh-review` fact 和 finding disposition 是完成记录的一部分；最终全量测试不替代 P1—P5 的逐 Phase review，也不把 verdict pass 当继续工作的许可证。

## 4. Final current-snapshot aggregate strategy

- **test_strategy_owner**：`build-plan/high-intelligence-model`
- **tier / method**：`fullstack` / `fullstack-slice-testing`
- **设计顺序**：build-plan 只调用 `test-routing-advisor` 预判 `fullstack` + `fullstack-slice-testing`；build-code 检查最终真实 changed files，必要时重新调用 `test-routing-advisor`，再调用 `fullstack-slice-testing` 执行本节。`testing-system-blueprint` 不调用。
- **scenarios**：四份材料路径与 hash；required skills/invocation facts；non-code advisory；build-code final review；G6 lease/baseline/phase evidence；G7 lineage/taxonomy/all attempts；G8 inventory/read-only；失败和 snapshot drift。
- **command**：`gtimeout -k 20 900 npm test -- --reporter=dot`
- **expected exit**：0
- **oracle**：`ORACLE-FINAL-CURRENT-SNAPSHOT-001`；exit 0、canonical receipt、output hash、snapshot tree、逐 AC evidence 和未决风险必须互相绑定；单一 exit 0 不足以证明完成。
- **fixtures_services**：现有 npm scripts、Vitest fixtures、TaskKernel temporary task、history fixture；不启动真实 provider；测试后清理临时目录和 lock。
- **browser_route**：N/A — 无 UI。
- **evidence_path**：`quality/tests/final-full-current-timeout.json`、`quality/tests/output/final-full-current-timeout/`、`quality/verify.json`、逐 AC acceptance evidence。
- **coverage limits**：不证明第三方 provider 可用性；不授权 commit/push/merge/archive/cleanup；unavailable/unknown/incomplete 不改成 pass。
- **execution_contract**：当前快照运行一次；900 秒是根据此前 600 秒到达上限且安全测试仍在运行的实测调整；失败保留原始输出，回受影响 task，不用全量重跑掩盖局部失败。

## 5. Requirement and Verification Traceability

| FR | Task IDs | AC IDs | Phase | Gate / evidence |
| --- | --- | --- | --- | --- |
| FR-G6-001—004 | T007—T008 | AC-G6 | P4 | `ORACLE-P4-RESIDUAL-001` / `quality/tests/p4` |
| FR-G7-001—003 | T009—T010 | AC-G7 | P4 | `ORACLE-P4-RESIDUAL-001` / `quality/tests/p4` |
| FR-G8-001—002 | T011—T012 | AC-G8 | P4 | `ORACLE-P4-RESIDUAL-001` / `quality/tests/p4` |
| FR-WH-001—003 | T001—T002 | AC-WH-01—03 | P1 | `ORACLE-P1-ARTIFACT-001` / `quality/tests/p1` |
| FR-WH-002、005 | T003—T004 | AC-WH-02、05 | P2 | `ORACLE-P2-SKILL-REVIEW-001` / `quality/tests/p2` |
| FR-WH-004 | T005—T006 | AC-WH-04 | P3 | `ORACLE-P3-COVERAGE-001` / `quality/tests/p3` |
| FR-WH-007 | T005—T006 | AC-WH-07 | P3 | `ORACLE-P3-COVERAGE-001` / `quality/tests/p3` |
| FR-WH-006 | T005—T006、FINAL | AC-WH-06 | P3 + FINAL | `ORACLE-P3-COVERAGE-001` + `ORACLE-FINAL-CURRENT-SNAPSHOT-001` |
| FR-WH-008 | T002、T004、T006、T008、T010、T012、T014 | AC-WH-08 | P1—P5 | phase review fact + disposition + handoff evidence |
| FR-WH-009 | T013—T014 | AC-WH-09 | P5 | `ORACLE-P5-STAGE-ROUTING-001` / quality/tests/p5 |
| FR-WH-010 | T013—T014、FINAL、verify-code | AC-WH-10 | P5 + FINAL + verify | routing facts + short reverse check |
| FR-WH-011 | T015—T016、FINAL、verify-code | AC-WH-11 | P6 + FINAL + verify | bounded review cycle + handoff |

`source_refs`：所有卡都回到 decision-log 的 R-001—R-011、D-001—D-019；没有无来源产品范围。`actual_changes`、`executed_commands`、`evidence_refs`、`covered_ac`、`review_fact` 在 build-code/verify-code 实际执行后才能填写。

### P5 当前审查 findings 主 agent 处置

上一轮（历史）当前快照审查 `quality/reviews/results/build-code-default-3bbd5cf6dd4dce9b5542e231f9b4478aa31bcee0-a28fad39-20b8-4f23-b460-96fded3665db.json` 的最终 verdict 是 `pass`，但 `opencode/v4flash` 原始输出包含 3 条重大观察，且两路 provider 共给出 6 条 minor 观察。主 agent 不按聚合 verdict 机械推进，逐条判断如下；本节只保留审计事实。

| Finding | 来源 / 影响 | 主 agent 判断与处置 | 交接对象 |
| --- | --- | --- | --- |
| OPENCODE-MAJOR-TEST-SNAPSHOT | `opencode/v4flash`；v9 receipt 树早于最后一次材料变更，不能证明当时 candidate 已测试 | 合理；历史上重新采集过 v10/v11/v12，当前仍需 v13 绑定 current tree | build-code / v13 test |
| OPENCODE-MAJOR-CURRENT-REVIEW | `opencode/v4flash`；审查包生成时材料仍写“review pending”，没有当前 review fact | 合理；保留旧 attempt/result；当前冻结后只做一次 v13 当前 P5 review | build-code / wh-review |
| OPENCODE-MAJOR-INVOCATION-KEY | `opencode/v4flash`；ordered dispatcher 没把 invocationKey 传给 CLI adapter，Talk 多次调用可能串结果 | 合理；已转发 invocationKey，并新增 keyed outcome 行为测试 | runtime/stage、P5 v10 |
| F-ff95cd7bc600 | `opencode/v4flash`；`SPEC_ANALYZE_STRATEGY_FIELDS` 是死常量 | 合理；已删除死代码 | runtime/stage、P5 v10 |
| F-f1c88295627c | `opencode/v4flash`；dispatchConfig 有重复 null 判断 | 合理；已合并为单一类型判断 | runtime/stage、P5 v10 |
| F-79412d01bf1b | `opencode/v4flash`；acceptance map 的 spec 锚点没有 outside_diff_reason | `rejected_invalid`；`review-materials` 对 acceptance_map 的 spec.md 锚点有明确例外，且该锚点只用于验收原文，不冒充实现 hunk | wh-review contract |
| F-f4928402cf64 | `pi/coding`；dispatcher 不自动从 advisor 结果推导 concrete skill | `accepted_risk`；这是有意的窄边界：stage host 把 advisor 结果转成 authenticated `selectedTestingSkill` control，dispatcher 只执行并记录，不新增隐藏控制面；已写入 build-code SKILL | build-code routing handoff |
| F-e58cb01a34fb | `pi/coding`；旧测试偏静态，真实 dispatcher 路径覆盖不够 | 已修正主要缺口：新增真实 publication keyed-outcome 行为测试，并增加实际 build-code steps 顺序/交接断言；仍不把 contract test 冒充 provider 可用性 | P5 v10 test |
| F-dc186d4d0d61 | `pi/coding`；Phase review 只写在 SKILL prose | 已补 steps.json 的可观察 review-fact/disposition 说明；运行时已有 `reviewEvidenceStatus` + `deriveStageProgress` 的 fail-closed 检查 | build-code handoff |

本轮修正改变了代码和当前材料，因此 a28fad39/v10 的 `pass` 只保留为历史事实；不能拿它替代当前快照 review。`accepted_risk` 仅表示主 agent 已判断并记录，不表示测试或正式验收通过。

### P5 当前快照最新审查 findings 主 agent 处置（v10 → v12，历史）

v10 当前快照结果为 `semantic/pass`，但 `pi/coding` 和 `opencode/v4flash` 的原始 findings 仍需主 agent 独立判断。以下处置先记录方案和风险；v11/v12 只保留历史测试与 preflight 事实，不能作为当前交接证据。

| Finding | 来源与影响 | 主 agent 判断与处置 | 交接对象 |
| --- | --- | --- | --- |
| F-a5ee0a74b953 | `opencode/v4flash`；选中的 concrete testing skill 可能因 conditional 默认值而只记录 `not_invoked` | 合理；dispatcher 现在把 authenticated `selectedTestingSkill` 作为 concrete-testing step 的默认执行信号；删除测试中显式 `triggered:true`，由 v11/v13 测试保留事实 | runtime/stage、P5 v13 test |
| F-97d2a58bcf4c | `opencode/v4flash`；大 Phase 审查包把所有 diff shard 全量交付，违反 320/330 KiB 合同 | 合理；代码/合同路径保留完整 shard，测试、文档、材料和生成报告改为有 change/hunk 身份的 bounded summary，并在 build-code Phase dispatch 前执行 330 KiB 上限 | wh-review packet、P5 v11 review |
| F-2d92b43b22b1 | `opencode/v4flash`；spec 仍写“scope revision 后的草稿”，却被当前流程当作冻结材料消费 | 合理；spec 状态改为“已冻结（scope revision 已完成）” | spec.md、P5 v11 review |
| F-395432983d99 | `opencode/v4flash`；plan 声称旧 attempt/result 可读，但新 schema/runner 对 lineage 无条件校验，旧记录未被真实回放 | 合理；收窄为诚实合同：新记录必须有 lineage，历史旧记录只读且不进入 current-subject replay，缺 lineage 不能作当前证据 | plan.md、review lineage |
| F-a1d072fa4484 / F-1d7362145d85 | 两路 provider；AC-WH-09/10 使用无关或未变更文件锚点，逐 AC 证据很弱 | 合理；v11 review input 改用真实实现/测试文件的非重叠 outside-hunk 锚点，spec 锚点只保留验收原文 | wh-review packet、P5 v11 review |
| F-4b7df2699b9e | `pi/coding`；复杂度报告已有预算超限，且本次改动继续增加维护风险 | 风险判断合理，但不是本阶段行为失败；接受并延期给后续 simplicity-guard，只允许在有真实 consumer 和收益时拆分，不把复杂度事实改成 pass | simplicity-guard / 后续 plan |
| F-1c328ee1923d | `pi/coding`；build-plan 的 `raw_requirement` 与 derived `raw_requirement_index` 命名不同 | `rejected_invalid`；前者是 review 输入，后者是 planning artifact 投影，二者职责不同；当前合同没有矛盾 | build-plan review contract |
| F-a7a7f97707bf | `pi/coding`；captureTests 自动补 implementation baseline，但不自动补 integration baseline | 接受风险；两种 baseline 的区别必须由调用方显式提供，不能用自动补值掩盖缺失；保留 finding，后续只在真实 consumer 出现时改 | test evidence / 后续 plan |

v12 在 provider 前因锚点 preflight 停止；v13 runner 又因无输出被停止，以上记录仍只表示历史主 agent 判断，`accepted_risk` 不表示完成，`rejected_invalid` 仍保留 provider 原始事实。当前 review 已达到本轮一次性尝试边界；不循环追求 verdict。

## Phase P6：verify-code 架构师验收收口

### T015 — RED：固定 verify-code 有限审查顺序

- **ID**：T015
- **Phase**：P6
- **goal**：证明旧 verify-code 会把 requirement replay、重复 evidence、重复 review 或 provider pass 当成循环条件。
- **source_refs / decision_refs**：`R-010、R-011 → D-016、D-017 → FR-WH-005、FR-WH-011 → AC-WH-05、AC-WH-11`
- **依赖**：T014；**并行**：否
- **精确文件**：`workflows/verify-code/SKILL.md`、`workflows/verify-code/steps.json`、`skills/wh-review/contracts/verify-code.md`、`runtime/review/stage-materials.json`、`tests/contract/verify-architect-acceptance.test.mjs`
- **测试层级 / 技能**：`feature` / `backend-testing`
- **场景**：步骤顺序固定；最多一次架构检查、一次异源 review、两批修复；历史 replay 和审计事实不是重试条件；verify provider 材料只保留短摘要。
- **命令**：`npx vitest run tests/contract/verify-architect-acceptance.test.mjs`
- **预期**：RED，指出旧合同缺口。
- **oracle**：`ORACLE-P6-VERIFY-CYCLE-001`；失败指向具体步骤、材料或重复循环规则。
- **STOP**：必须新增 ledger、retry controller 或 close gate 才能表达顺序时停止并回主 agent。

### T016 — GREEN：实现一次有限架构验收合同

- **ID**：T016
- **Phase**：P6
- **goal**：让 T015 通过，保留 AC/测试/独立 review 的必要事实，但删除 verify-code 的重复审计负担。
- **source_refs / decision_refs**：`R-010、R-011 → D-017 → FR-WH-011 → AC-WH-11`
- **依赖**：T015；**并行**：否
- **精确文件**：`workflows/verify-code/SKILL.md`、`workflows/verify-code/steps.json`、`runtime/evidence/canonical-receipt-writer.mjs`、`skills/wh-review/contracts/verify-code.md`、`runtime/review/stage-materials.json`、`skills/wh-review/stage-skill-plan.json`、`skills/wh-review/manifest.json`、`skills/wh-review/SKILL.md`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`tests/contract/verify-architect-acceptance.test.mjs`
- **测试层级 / 技能**：`feature` / `backend-testing`
- **场景**：review cycle receipt 可按顺序验证；缺 cycle/结论如实显示；可选 requirement replay 不触发循环；一次独立 review 后只允许最后一批修复。
- **命令**：`npx vitest run tests/contract/verify-architect-acceptance.test.mjs tests/official-component-receipts.test.mjs tests/contract/review-materials-contract.test.mjs`
- **预期**：0。
- **oracle**：`ORACLE-P6-VERIFY-CYCLE-001`；新合同通过，旧历史事实仍只读保留。
- **STOP**：provider unavailable、final test timeout 或 AC unknown 只能记录 incomplete，不得增加 review 轮次。

#### P6 交接

- `review_cycle` 只在现有 verification receipt 中记录四步摘要，不是新 ledger。
- 主 agent 必须在最终交接中列出每个 finding 的来源、影响、判断和修复/延期对象。
- T016 完成后只做一次当前 verify-code 验收；不重新执行 P1—P5 的历史 review。

#### P6 独立审查事实与主 agent 判断

- 第一批修复后的定向合同测试：5 files / 36 tests / exit 0。
- 只发起一次 `wh-review` 独立审查；provider 等待约 3 分钟无返回后停止，未产生 semantic verdict 或 finding。该事实是 `unavailable`，不是 pass，也不触发重试。
- 主 agent 发现并修正一条本地真实问题：`wh-review` 总说明和自动 instructions 仍含旧的完整 evidence/fresh-tests 语义，会误导后续审查重新收集审计材料。
- 最终判断：新流程的循环上限和最小材料合同已经修正；provider unavailable、历史完整测试 timeout、P5 当前 review 缺口继续作为 incomplete 交接，不伪造正式完成。

#### P6 verify-code 本轮异源审查与最终修复

- **审查事实**：`quality/reviews/results/verify-code-default-8c55eac0efea6c3022dba509fa02dd75a3427f2c-fd9ea19e-dda6-4b8f-a73e-360ed5f16bdf.json`；provider aggregate 为 `pass`，但原始输出提出 1 个 blocking、1 个 major、1 个 minor 观察。
- **主 agent 判断**：blocking（最终完整测试尚未在最后修复后执行）合理；major（逐 AC 摘要为空）合理；minor（架构摘要和风险仍写 pending）是同一缺口的合理提醒。三条都不是新的产品需求，也不需要增加 evidence tree 或审查轮次。
- **最终修复**：补一份短的逐 AC 结构化摘要；每条只写 `pass`、`fail`、`unknown` 或 `deferred`、场景、oracle、实际结果和覆盖限制；没有当前证据的条目明确写 `unknown`。同步把最终测试结果、当前快照、架构结论和未决风险写入当前 verify 事实。
- **不采纳项**：provider aggregate `pass` 不被当作最终验收通过；原始 provider findings、adjudication 和本记录全部保留，不再调用第二次 wh-review。
- **交接**：最终全量测试只执行一次；若超时/失败，整体 verify 结论保持 `incomplete`，但不重跑、不伪造 pass；close 仍停下等待单独授权。

#### P6 最终执行事实

- **architect check**：已完成；第一批修复解决 `review_cycle` 结论矛盾和 P1—P5 handoff 语义冲突。
- **independent review**：只执行一次；结果为 `quality/reviews/results/verify-code-default-8c55eac0efea6c3022dba509fa02dd75a3427f2c-fd9ea19e-dda6-4b8f-a73e-360ed5f16bdf.json`，aggregate `pass`；原始 observations 已逐条判断，未启动第二次 provider review。
- **final repair**：补当前快照的逐 AC 短摘要；AC-WH-09、AC-WH-10、AC-WH-11 有 focused contract 证据，其余 AC 按当前证据保持 `unknown`。
- **focused test**：4 files / 60 tests / exit 0，当前 verify/build-code 合同通过。
- **final full test（第一次收口事实）**：`gtimeout -k 20 600 npm test -- --reporter=dot`；到达上限 exit 124，安全测试已通过，exclusive 测试尚未开始；该上限不足，未将超时改写成 pass。
- **final full test（最终）**：已修复旧合同断言、repository inventory/complexity 生成报告漂移和反向检查语义；`npm test` safe 148 个文件/1290 个测试、exclusive 2 个文件/31 个测试，全部 exit 0。
- **current verify fact**：`quality/verify.json` status=`incomplete`；逐 AC 摘要位于 `quality/evidence/verify-code/acceptance-summary-0b3acdbb2796dd5ce18ae96323262036217b17dfa6c40eecb02c5ce86909caa5.json`；最终测试事实位于 `quality/tests/verify-code-final-full-current.json`，测试绑定树为 `611fdeb70dc2f0b11bb40fd0212bc837a98395db`；之后只改了当前材料，属于 material-only delta。
- **close boundary**：不执行 close、commit、push、merge、archive、cleanup；不再开启 verify 审查循环。

## 6. Build-code STOP and handoff

- 缺 `test_strategy_owner`、tier、concrete skill、command、expected exit、oracle、fixtures、evidence path 或 coverage limit：写 `MATERIAL_INCOMPLETE`，停止，不自行补。
- 实际文件超出 Phase Files：停止，回主 agent 做 scope revision。
- RED 不是目标失败、GREEN 需要删/跳过/弱化测试：停止。
- review finding 不由执行模型自动采纳；主 agent 必须写 disposition、理由和风险。
- build-code 完成只表示任务卡已执行并有事实；verify-code 仍需独立回放，非 build-code review 仍是建议。

## 7. Completion format

每张卡完成时才填写：

```json
{
  "status": "completed",
  "actual_changes": ["absolute/path/to/changed-file"],
  "executed_commands": [{"command":"...","exit_code":0}],
  "evidence_refs": [{"ref":"quality/tests/...","sha256":"<real-sha256>"}],
  "covered_ac": ["AC-..."],
  "review_fact": "<current-phase-review-ref-or-advisory-fact>",
  "completed_at": "<real-time>"
}
```

不得预填成功状态，不得用 `npm test` 单一 receipt 替代逐 AC 证据，不得把 provider unavailable 或 review advisory 改成 pass。
