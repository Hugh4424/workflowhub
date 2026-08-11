# 任务清单：WorkflowHub 顺序执行与 wh-review 真实建议

- **Input**：`specs/wh-review-execution-flow-improvement/decision-log.md`、`specs/wh-review-execution-flow-improvement/spec.md`、`specs/wh-review-execution-flow-improvement/plan.md`
- **Template version**：`plan-task.v3`
- **Spec SHA-256**：`5d3828e7d53eca7ffab19128576e00cf453f31cd5594f1a034f97e70e2039ba9`
- **Plan SHA-256**：`a0ab7a0fcea2a33cda9b842ffd6ecacf120075a6cc50b7bab60f352a7e6ee117`

## Phase P1 — 启动、dirty 诊断与唯一 workspace owner

### Goal

dirty target 可以启动 task；candidate 只来自 target HEAD；只有 make-decision 入口创建/复用 worktree；wh-review 不旁路创建。

### Files

- **NEW**：N/A — 不新增文件。
- **MODIFY**：`runtime/task/workspace.mjs`、`runtime/stage/stage-handlers.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`core/__tests__/workspace-manager.test.mjs`、`tests/official-make-decision-cli.test.mjs`、`tests/contract/material-workspace.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- **DO NOT TOUCH**：`tools/cli/task-bootstrap.mjs`、`tools/cli/stage-runtime.mjs`；登记和正式入口职责已经正确。

### Tasks

#### T001 — RED：dirty target 与 workspace owner 合同

- **ID**：T001
- **Phase**：Phase P1 — 启动、dirty 诊断与唯一 workspace owner
- **goal**：用真实失败断言暴露 dirty target 被阻止、dirty 被带入 candidate、wh-review 旁路创建 workspace 或 cleanup 同意路径缺失的问题。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/wh-review-execution-flow-improvement/spec.md","hash":"5d3828e7d53eca7ffab19128576e00cf453f31cd5594f1a034f97e70e2039ba9","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/wh-review-execution-flow-improvement/plan.md","hash":"a0ab7a0fcea2a33cda9b842ffd6ecacf120075a6cc50b7bab60f352a7e6ee117","id":"PLAN"}]`
- **source_refs / decision_refs**：`R-001,R-002,R-003,R-004,R-005,R-013,R-014 / D-001,D-002,D-003,D-004,D-009,DEFER-001,OPEN-001,OPEN-004`
- **输入**：当前 decision-log/spec/plan；现有 `prepareTaskWorkspace`、`CandidateWorkspace`、stage-runtime preparation 和 wh-review CLI 测试。
- **依赖**：none
- **并行**：否 — 共享同一个 workspace 行为边界，必须先形成 RED。
- **FR**：`FR-START-001 FR-START-002 FR-CLEANUP-001`
- **AC**：`AC-001 AC-002 AC-014`
- **动作**：增加 tracked/staged/untracked/ignored dirty fixture；断言 target HEAD/index/files 不变，candidate 从 HEAD 建立；断言 wh-review 没有既有 candidate 时失败而不创建；覆盖重复或并发 preparation 不创建第二个 workspace；覆盖未同意 cleanup 只显示建议，以及明确同意具体路径后现有 authorize cleanup 的正向失败断言。
- **精确文件**：`core/__tests__/workspace-manager.test.mjs`、`tests/official-make-decision-cli.test.mjs`、`tests/contract/material-workspace.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- **boundary**：files: `core/__tests__/workspace-manager.test.mjs`, `tests/official-make-decision-cli.test.mjs`, `tests/contract/material-workspace.test.mjs`, `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`; symbols/regions: only dirty candidate, preparation owner, and review-open assertions.
- **输出**：可复现的 RED stdout/stderr，证明旧行为确实违反 AC-001/002/014。
- **Knowledge**：测试必须只读检查 target；不 stash、不 commit、不 delete；失败不能由 provider findings 解释。
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`npm exec -- vitest run core/__tests__/workspace-manager.test.mjs tests/official-make-decision-cli.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs tests/contract/material-workspace.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-START-DIRTY` — 目标断言失败且失败原因是 dirty 不应阻止/导入或 review 不应旁路创建，不是 fixture/环境错误。
- **evidence_path**：`quality/tests/T001-start-dirty-red.json`
- **STOP**：若 RED 先因环境、路径、服务或 fixture 失败，停止并修复测试边界，不改弱断言。
- **recovery**：由 P1 owner 修正最小 fixture/cleanup；不触碰用户 main 的 dirty 内容。
- **task risk**：把 target dirty 和 candidate dirty 混为一谈，或用“测试通过”掩盖未验证 target 不变。
- **test tier / test method**：feature / `backend-testing`；这是本地 Git/worktree 纯合同，不需 provider。
- **scenarios / commands / expected exit / oracle**：dirty tracked、staged、untracked、有限 ignored；同一 task 的重复调用和并发调用；同一 gate_cmd；RED exit 1；`ORACLE-START-DIRTY`。
- **fixtures_services**：临时 Git fixture 和 deterministic sibling worktree；测试结束由现有 workspace cleanup 机制清理，绝不跟随 symlink。
- **coverage limits**：覆盖 P1 dirty/owner/cleanup consent 边界；不触碰当前用户 main，不把 fixture 同意当作用户真实同意，也不覆盖 3rd-review adapter 内部。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — RED task is reviewed with its paired GREEN Phase result
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started

#### T002 — GREEN：只读 dirty 诊断与唯一创建入口

- **ID**：T002
- **Phase**：Phase P1 — 启动、dirty 诊断与唯一 workspace owner
- **goal**：让 T001 的目标断言通过，保留 target dirty 不变、candidate HEAD 身份、重复/并发调用不产生第二个 workspace、cleanup 未授权负例和明确同意后的既有 authorize 正向路径。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/wh-review-execution-flow-improvement/spec.md","hash":"5d3828e7d53eca7ffab19128576e00cf453f31cd5594f1a034f97e70e2039ba9","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/wh-review-execution-flow-improvement/plan.md","hash":"a0ab7a0fcea2a33cda9b842ffd6ecacf120075a6cc50b7bab60f352a7e6ee117","id":"PLAN"}]`
- **source_refs / decision_refs**：`R-001,R-002,R-003,R-004,R-005,R-013,R-014 / D-001,D-002,D-003,D-004,D-009,DEFER-001,OPEN-001,OPEN-004`
- **输入**：T001 的失败断言；现有 `workspaceForCreation`、make-decision stage handler 和 `resolveTrustedReviewSubject`。
- **依赖**：T001
- **并行**：否 — RED/GREEN 必须串行。
- **FR**：`FR-START-001 FR-START-002 FR-CLEANUP-001`
- **AC**：`AC-001 AC-002 AC-014`
- **动作**：移除 dirty target 的阻止条件；在既有 CandidateWorkspace/make-decision facts 记录 ref、HEAD、dirty、有限分类摘要和建议；重复或并发 preparation 复用同一 workspace 或显式失败，不创建第二个 workspace；wh-review 只 open 已有 candidate；未同意或范围不明时不清理，明确同意后只调用现有 authorize cleanup 并记录动作结果。
- **精确文件**：`runtime/task/workspace.mjs`、`runtime/stage/stage-handlers.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`
- **boundary**：files: `runtime/task/workspace.mjs`, `runtime/stage/stage-handlers.mjs`, `skills/wh-review/scripts/wh-review-cli.mjs`; symbols/regions: `workspaceForCreation`, candidate creation/facts, `resolveTrustedReviewSubject`。
- **输出**：GREEN 运行结果和 dirty diagnostics 事实；target main 未被 stash/commit/delete/覆盖。
- **Knowledge**：P1 不改变 task-bootstrap 或 stage-runtime 的正式 owner；无法读取状态时必须 fail-loud 或记录 unknown，不猜用户意图。
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`npm exec -- vitest run core/__tests__/workspace-manager.test.mjs tests/official-make-decision-cli.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs tests/contract/material-workspace.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-START-DIRTY` — T001 同一断言全部通过；dirty 只读记录，candidate 从启动时 HEAD 建立，重复/并发 preparation 不创建第二 workspace，review 不创建第二 workspace；cleanup 只在明确同意后进入现有授权。
- **evidence_path**：`quality/tests/T002-start-dirty-green.json`
- **STOP**：若实现需要 stash/commit/delete、改变 target HEAD/index、引入新持久对象或放宽 workspace 身份校验，停止回 decision/spec。
- **recovery**：回滚 P1 当前实现 bytes，保留用户 target dirty；重新跑 T001/T002。
- **task risk**：只修了测试而没有修创建入口，或让 review CLI 重新拥有 prepare 权限。
- **test tier / test method**：feature / `backend-testing`；同 T001，验证 Git/worktree 身份和负例。
- **scenarios / commands / expected exit / oracle**：同 T001 场景，包含重复/并发 preparation；同一 gate_cmd；GREEN exit 0；`ORACLE-START-DIRTY`。
- **fixtures_services**：同 T001；复用现有 deterministic worktree 和 cleanup authorization。
- **coverage limits**：同 T001；不把自动或 fixture cleanup 写成用户已同意，不覆盖 provider 语义。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：只读 dirty 诊断、唯一 make-decision workspace 创建入口，以及 wh-review 复用既有 workspace。
- **executed_commands**：`npm exec -- vitest run core/__tests__/workspace-manager.test.mjs tests/official-make-decision-cli.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs tests/contract/material-workspace.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；exit 0。
- **evidence_refs**：`quality/tests/T002-start-dirty-green.json`；receipt_hash=`45514b61dedf6a1b5d0eee4ab7d9d14cb556500160454c8cb3d69680af2cc6b6`。
- **covered_ac**：`AC-001 AC-002 AC-014`。
- **review_fact**：P1 异源 review attempt `quality/reviews/attempts/c4e8d371-2f77-4d61-aa24-83c23e67c853/attempt.json` 无最终文本，保留为 unavailable；未把它写成 pass 或空 findings。
- **completed_at**：2026-08-11T08:37:27.917Z
- **执行事实**：GREEN 回执通过；dirty main 只记录、不带入、不自动清理，wh-review 不再创建第二个 workspace。

### Verify

`ORACLE-START-DIRTY`；先执行 T001 RED，再执行 T002 GREEN；最终事实必须能回看 target ref/HEAD、dirty 摘要、candidate baseline 和旁路 review 拒绝原因。

### Knowledge

P2 接收一个已认证的 CandidateWorkspace 和只读 dirty fact；任何 cleanup 仍需用户明确同意和现有 authorize boundary。

### STOP

出现自动清理、dirty 导入、第二个 preparation owner 或新状态对象时回 `decision-log.md`/`spec.md`。

### Done

P1 只交接 workspace/dirty 事实和 GREEN 证据；不把它解释成业务方向确认或审查通过。

### Risks and rollback

Risk：dirty 摘要不完整而被误读为用户意图。Rollback：只撤回 P1 当前代码/测试，保留 main 内容和既有历史 facts。

## Phase P2 — make-decision 顺序、交互与连续 decision-log

### Goal

当前 decision-log step 表的 13 个现有 step 严格按顺序；Talk/Grill 的真实生命周期可验证；Clarify 不再由 make-decision 执行；每个 step 完成都更新同一 decision-log。

### Files

- **NEW**：N/A — 不新增文件。
- **MODIFY**：`workflows/make-decision/SKILL.md`、`workflows/make-decision/steps.json`、`workflows/make-decision/skill-deps.yaml`、`skills/talk-with-zhipeng/SKILL.md`、`skills/grill-with-docs/SKILL.md`、`runtime/stage/stage-content-contracts.mjs`、`tests/stage-interaction-contract.test.mjs`、`tests/interaction-quality-contract.test.mjs`、`tests/stage-decision-contract.test.mjs`、`tests/decision-log-content-contract.test.mjs`、`tests/workflow-v2-contract.test.mjs`
- **DO NOT TOUCH**：`skills/spec-clarify/SKILL.md`；它由 P3 作为 build-spec 唯一 Clarify owner 复用。

### Tasks

#### T003 — RED：顺序、真实问答和 decision-log step update 合同

- **ID**：T003
- **Phase**：Phase P2 — make-decision 顺序、交互与连续 decision-log
- **goal**：暴露 make-decision 乱序、Clarify 重复归属、Grill 被当 review、Talk 缺少大白话后果/风险、假 aggregate、实际 writer 缺失和一次性 decision-log 汇总问题。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/wh-review-execution-flow-improvement/spec.md","hash":"5d3828e7d53eca7ffab19128576e00cf453f31cd5594f1a034f97e70e2039ba9","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/wh-review-execution-flow-improvement/plan.md","hash":"a0ab7a0fcea2a33cda9b842ffd6ecacf120075a6cc50b7bab60f352a7e6ee117","id":"PLAN"}]`
- **source_refs / decision_refs**：`R-002,R-003,R-006,R-007,R-008,R-012,R-020,G-002 / D-002,D-005,D-006,D-007,D-011,D-012,D-013,D-016,DEFER-002,DEFER-008,OPEN-005`
- **输入**：当前 make-decision 13-step manifest、Talk/Grill/interaction contracts 和 decision-log 连续更新要求。
- **依赖**：T002
- **并行**：否 — 依赖 P1 的真实 workspace seam。
- **FR**：`FR-INTERACT-001 FR-INTERACT-002 FR-INTERACT-003 FR-INTERACT-004 FR-INTERACT-005 FR-DECISION-001`
- **AC**：`AC-003 AC-004 AC-005 AC-017 AC-018 AC-019`
- **动作**：增加 step order、Talk one-at-a-time 且每个选项包含 plain-language consequence/risk、Grill independent-frontier batch/partial reply/re-rank、错 card/hash 和 write-failure fixtures；断言 Grill 不产生 review fact，Clarify 不由 make-decision 执行，现有 stage writer/handler 对每个 step 写同一 decision-log。
- **精确文件**：`tests/stage-interaction-contract.test.mjs`、`tests/interaction-quality-contract.test.mjs`、`tests/stage-decision-contract.test.mjs`、`tests/decision-log-content-contract.test.mjs`、`tests/workflow-v2-contract.test.mjs`
- **boundary**：files: `tests/stage-interaction-contract.test.mjs`, `tests/interaction-quality-contract.test.mjs`, `tests/stage-decision-contract.test.mjs`, `tests/decision-log-content-contract.test.mjs`, `tests/workflow-v2-contract.test.mjs`; symbols/regions: only stage order, interaction lifecycle, owner, and decision-log update assertions.
- **输出**：可复现 RED，失败必须来自目标合同而非 provider 或宿主噪声。
- **Knowledge**：只使用现有 interaction completion record/host seam；不把 aggregate 字段存在当作真实 reply。
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`npm exec -- vitest run tests/stage-interaction-contract.test.mjs tests/interaction-quality-contract.test.mjs tests/stage-decision-contract.test.mjs tests/decision-log-content-contract.test.mjs tests/workflow-v2-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-INTERACTION-ORDER` — 至少一个目标断言非零，且错误指出乱序、重复 Clarify、假生命周期、Grill review 身份或漏 step update。
- **evidence_path**：`quality/tests/T003-interaction-red.json`
- **STOP**：若只能通过新增 ledger/state machine/public command 才能造出 RED，停止回宪法边界。
- **recovery**：修正测试 fixture 或恢复当前合同，不改写已有真实用户 reply。
- **task risk**：把历史 T-003 缺口伪造成当前成功，或把 Grill 的 batch 误写成 Talk batch。
- **test tier / test method**：feature / `backend-testing`；契约验证不执行 provider。
- **scenarios / commands / expected exit / oracle**：严格顺序、Talk 选项后果/风险、错 card/hash、空 reply、部分 Grill reply、13 step no-new-requirement update、writer failure；同 gate_cmd；RED exit 1；`ORACLE-INTERACTION-ORDER`。
- **fixtures_services**：内存 host seam 和 deterministic markdown facts；不创建独立持久记录。
- **coverage limits**：覆盖 P2 owner/order/lifecycle/plain-language/log writer；不覆盖 build-spec 的 spec-clarify 实现细节。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — RED task is reviewed with its paired GREEN Phase result
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started

#### T004 — GREEN：严格顺序与逐 step decision-log 更新

- **ID**：T004
- **Phase**：Phase P2 — make-decision 顺序、交互与连续 decision-log
- **goal**：让 T003 通过，并保留 Talk 一次一题及后果/风险说明、Grill batch 的边界、错回复拒绝、实际 writer 和写失败 incomplete。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/wh-review-execution-flow-improvement/spec.md","hash":"5d3828e7d53eca7ffab19128576e00cf453f31cd5594f1a034f97e70e2039ba9","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/wh-review-execution-flow-improvement/plan.md","hash":"a0ab7a0fcea2a33cda9b842ffd6ecacf120075a6cc50b7bab60f352a7e6ee117","id":"PLAN"}]`
- **source_refs / decision_refs**：`R-002,R-003,R-006,R-007,R-008,R-012,R-020,G-002 / D-002,D-005,D-006,D-007,D-011,D-012,D-013,D-016,DEFER-002,DEFER-008,OPEN-005`
- **输入**：T003 失败事实；现有 make-decision skill/deps/steps、Grill 来源检查和 decision-log writer contract。
- **依赖**：T003
- **并行**：否 — RED/GREEN 必须串行。
- **FR**：`FR-INTERACT-001 FR-INTERACT-002 FR-INTERACT-003 FR-INTERACT-004 FR-INTERACT-005 FR-DECISION-001`
- **AC**：`AC-003 AC-004 AC-005 AC-017 AC-018 AC-019`
- **动作**：移除 make-decision Clarify 责任；明确 13 step completion 时由现有 writer/handler 更新同一 decision-log（含 no-new-requirement、用户真实回答、延期/未决去向）；保留 Talk ask/wait/reply/re-rank 和选项的 plain-language 后果/风险；把 Grill 改成独立 frontier batch、部分回复保留、冲突最小追问；Grill 仍不调用 wh-review。
- **精确文件**：`workflows/make-decision/SKILL.md`、`workflows/make-decision/steps.json`、`workflows/make-decision/skill-deps.yaml`、`skills/talk-with-zhipeng/SKILL.md`、`skills/grill-with-docs/SKILL.md`、`runtime/stage/stage-content-contracts.mjs`
- **boundary**：files: `workflows/make-decision/SKILL.md`, `workflows/make-decision/steps.json`, `workflows/make-decision/skill-deps.yaml`, `skills/talk-with-zhipeng/SKILL.md`, `skills/grill-with-docs/SKILL.md`, `runtime/stage/stage-content-contracts.mjs`; symbols/regions: make-decision procedure/deps/steps, Talk/Grill interaction protocol, decision-log completion validation.
- **输出**：GREEN 合同、真实失败语义和现有 interaction aggregate 的兼容说明。
- **Knowledge**：Clarify 下游唯一 owner 是 build-spec；方向问题仍返回 make-decision，实现事实交给 build-plan；不增加第五份材料。
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`npm exec -- vitest run tests/stage-interaction-contract.test.mjs tests/interaction-quality-contract.test.mjs tests/stage-decision-contract.test.mjs tests/decision-log-content-contract.test.mjs tests/workflow-v2-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-INTERACTION-ORDER` — T003 同一断言全部通过；真实 ask/wait/reply/resume 仍可观察，Grill batch 仅处理独立 frontier，Talk 选项后果/风险可回放，13 个 step 都有同一 decision-log 更新语义和实际 writer 失败边界。
- **evidence_path**：`quality/tests/T004-interaction-green.json`
- **STOP**：若需要伪造用户 reply、把 Grill 批量扩到 Talk、把 review findings 写入 Grill，或新增质量 gate，停止回当前材料。
- **recovery**：回滚 P2 当前 skill/contract/test bytes；保留已有 decision-log 和 review provenance。
- **task risk**：文档写对但 host seam 没有真实 pause/resume，或只校验最终 aggregate。
- **test tier / test method**：feature / `backend-testing`；同 T003，负例保持。
- **scenarios / commands / expected exit / oracle**：同 T003；同 gate_cmd；GREEN exit 0；`ORACLE-INTERACTION-ORDER`。
- **fixtures_services**：同 T003；只使用现有 host seam、quality/evidence 和当前 decision-log。
- **coverage limits**：同 T003；build-spec spec-clarify/research consumer 在 P3 验证，provider lifecycle 在 P4 验证。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：make-decision 顺序、Talk/Grill 交互合同和每 step decision-log 更新边界。
- **executed_commands**：`npm exec -- vitest run tests/stage-interaction-contract.test.mjs tests/interaction-quality-contract.test.mjs tests/stage-decision-contract.test.mjs tests/decision-log-content-contract.test.mjs tests/workflow-v2-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；exit 0。
- **evidence_refs**：`quality/tests/T004-interaction-green.json`；receipt_hash=`2c3699eebd514145debd4e7751acbcb9fc35f49430eab30fb992dbf848d07e9d`。
- **covered_ac**：`AC-003 AC-004 AC-005 AC-017 AC-018 AC-019`。
- **review_fact**：P2 异源 review attempt `quality/reviews/attempts/088dc13c-64e4-4344-8a58-5287096204f6/attempt.json` 无最终文本，保留为 unavailable；Grill 没有被当作 review。
- **completed_at**：2026-08-11T08:37:35.694Z
- **执行事实**：GREEN 回执通过；Talk、Grill、review 的职责边界按当前合同保留。

### Verify

`ORACLE-INTERACTION-ORDER`；T003 必须先 RED，T004 后 GREEN；后续实现不得把 Grill 作为 review 或用一份最终汇总替代逐 step decision-log 更新。

### Knowledge

P3 读取当前 decision-log 和其完整来源分类；build-spec 负责唯一 spec-clarify，方向缺口不能在 P3 猜。

### STOP

新增 public ask/resume、question archive、第二 decision-log、Grill provider review 或新 gate 时回当前材料。

### Done

P2 只交接 order/owner/interaction/log contract；所有 stage review 都只交接 advice，不要求 provider pass。

### Risks and rollback

Risk：最终 aggregate 伪造 lifecycle。Rollback：撤回 P2 合同和测试变更，保留真实用户事实及历史 provenance。

## Phase P3 — build-spec research/Clarify 与 build-code final integration

### Goal

build-spec 在需要时负责条件调研和唯一 spec-clarify；build-code 明确在最终测试与 AC trace 后执行 integration review，继续使用现有实现合同。

### Files

- **NEW**：N/A — 不新增文件。
- **MODIFY**：`workflows/build-spec/SKILL.md`、`workflows/build-spec/steps.json`、`workflows/build-spec/skill-deps.yaml`、`workflows/build-code/SKILL.md`、`workflows/build-code/steps.json`、`skills/catalog.yaml`、`runtime/stage/stage-handlers.mjs`、`tests/contract/stage-routing-and-concrete-testing.test.mjs`、`tests/contract/spec-stage-artifact-closure.test.mjs`、`tests/contract/stage-skill-invocation-contract.test.mjs`、`tests/contract/stage-completion.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`
- **DO NOT TOUCH**：`skills/spec-clarify/SKILL.md`、`runtime/evidence/requirement-ledger.mjs`；分别复用既有 skill、保持历史兼容边界。

### Tasks

#### T005 — RED：build-spec owner 与 build-code integration 顺序

- **ID**：T005
- **Phase**：Phase P3 — build-spec research/Clarify 与 build-code final integration
- **goal**：暴露 build-spec 没有条件 research/spec-clarify owner、旧测试仍把 spec-clarify 排除、research fact 没有实际 runtime consumer、build-code final integration 时点不明确的问题。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/wh-review-execution-flow-improvement/spec.md","hash":"5d3828e7d53eca7ffab19128576e00cf453f31cd5594f1a034f97e70e2039ba9","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/wh-review-execution-flow-improvement/plan.md","hash":"a0ab7a0fcea2a33cda9b842ffd6ecacf120075a6cc50b7bab60f352a7e6ee117","id":"PLAN"}]`
- **source_refs / decision_refs**：`R-007,R-008,R-009,R-011,R-012,R-022 / D-006,D-007,D-008,D-011,D-018,DEFER-003,DEFER-004,OPEN-002`
- **输入**：当前 build-spec/build-code steps/deps/catalog、spec-clarify skill 和 integration review contract。
- **依赖**：T004
- **并行**：否 — 依赖 P2 的唯一 Clarify owner。
- **FR**：`FR-INTERACT-002 FR-SPEC-001 FR-SPEC-002 FR-HANDOFF-001`
- **AC**：`AC-004 AC-011 AC-012 AC-013`
- **动作**：更新路由测试以表达 build-spec conditional research、spec-clarify 恢复、已有 research fact 必须被实际 runtime consumer 消费，以及 build-code final integration 顺序的目标失败断言；对只改 skill/steps、没有 consumer 的假修复保持 RED。
- **精确文件**：`tests/contract/stage-routing-and-concrete-testing.test.mjs`、`tests/contract/spec-stage-artifact-closure.test.mjs`、`tests/contract/stage-skill-invocation-contract.test.mjs`、`tests/contract/stage-completion.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`
- **boundary**：files: `tests/contract/stage-routing-and-concrete-testing.test.mjs`, `tests/contract/spec-stage-artifact-closure.test.mjs`, `tests/contract/stage-skill-invocation-contract.test.mjs`, `tests/contract/stage-completion.test.mjs`, `skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`; symbols/regions: stage deps/steps/catalog, existing runtime research consumer seam, and completion expectations only.
- **输出**：可复现 RED，明确旧 owner/routing 与新需求冲突。
- **Knowledge**：build-spec 不执行 Talk/Grill；spec-clarify 不是新 public command；build-code review 只要求当前可信结果没有重要 findings，不要求 provider pass。
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`npm exec -- vitest run tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs tests/contract/stage-completion.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-STAGE-HANDOFF` — 失败来自明确的 owner/step/integration 时点断言，不是缺 node/provider。
- **evidence_path**：`quality/tests/T005-handoff-red.json`
- **STOP**：若修改需要新增 stage、public command、研究库或新的 completion predicate，停止回 spec/constitution。
- **recovery**：修正 RED fixture/断言；不降低对现有 Clarify 和 integration contract 的覆盖。
- **task risk**：把 build-spec review 的 advice 误写成 pass，或把 build-code final review 提前到 phase review，或把 provider pass 错当 build-code 结束条件。
- **test tier / test method**：feature / `backend-testing`；阶段 routing 和 contract 纯本地验证。
- **scenarios / commands / expected exit / oracle**：spec fact 足够→skipped、缺口→research executed/unavailable、spec ambiguity→spec-clarify 的真实 ask→waiting-for-user→绑定 card/round/hash 的 reply→resume（错 card/hash 和无 reply 拒绝）、final tests+AC trace→integration review；同 gate_cmd；RED exit 1；`ORACLE-STAGE-HANDOFF`。
- **fixtures_services**：YAML/JSON/Markdown fixtures；无长期服务。
- **coverage limits**：覆盖 owner/step/handoff 和实际 research consumer 的存在性；不执行真实 provider 或实际实现。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — RED task is reviewed with its paired GREEN Phase result
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started

#### T006 — GREEN：恢复 build-spec owner 并写清 final integration

- **ID**：T006
- **Phase**：Phase P3 — build-spec research/Clarify 与 build-code final integration
- **goal**：让 T005 通过，真正让 build-spec 产出的条件 research fact 被现有 runtime consumer 读取，且不改变四材料权威边界或增加质量 gate。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/wh-review-execution-flow-improvement/spec.md","hash":"5d3828e7d53eca7ffab19128576e00cf453f31cd5594f1a034f97e70e2039ba9","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/wh-review-execution-flow-improvement/plan.md","hash":"a0ab7a0fcea2a33cda9b842ffd6ecacf120075a6cc50b7bab60f352a7e6ee117","id":"PLAN"}]`
- **source_refs / decision_refs**：`R-007,R-008,R-009,R-011,R-012,R-022 / D-006,D-007,D-008,D-011,D-018,DEFER-003,DEFER-004,OPEN-002`
- **输入**：T005 失败事实；现有 `spec-research`、`spec-clarify`、quality test-fact、已有 runtime stage consumer、integration review predicate。
- **依赖**：T005
- **并行**：否 — RED/GREEN 必须串行。
- **FR**：`FR-INTERACT-002 FR-SPEC-001 FR-SPEC-002 FR-HANDOFF-001`
- **AC**：`AC-004 AC-011 AC-012 AC-013`
- **动作**：把 `spec-research`/`spec-clarify` 接入 build-spec 的既有 steps/deps/catalog，允许 executed/skipped/unavailable 事实；让现有 runtime stage consumer 读取并保留该 research fact，不把它变成新的 completion gate；在既有 stage-skill-invocation contract 中加入 spec-clarify 的真实 ask→waiting-for-user→绑定 card/round/hash 的 reply→resume 及错回复拒绝；在 build-code steps/SKILL 中明确最终测试和 AC trace 后的 integration review、重要 findings 处置、focused repair 和停止自动循环的既有发布合同，不要求 provider pass。
- **精确文件**：`workflows/build-spec/SKILL.md`、`workflows/build-spec/steps.json`、`workflows/build-spec/skill-deps.yaml`、`workflows/build-code/SKILL.md`、`workflows/build-code/steps.json`、`skills/catalog.yaml`、`runtime/stage/stage-handlers.mjs`
- **boundary**：files: `workflows/build-spec/SKILL.md`, `workflows/build-spec/steps.json`, `workflows/build-spec/skill-deps.yaml`, `workflows/build-code/SKILL.md`, `workflows/build-code/steps.json`, `skills/catalog.yaml`, `runtime/stage/stage-handlers.mjs`; symbols/regions: stage work sequence/dependencies, existing research fact consumer, and final integration wording only.
- **输出**：GREEN routing/owner/handoff contract；research 缺失保持 unavailable，非 build-code review 仍为 advice。
- **Knowledge**：研究结果复用现有 facts/materials；build-code integration 复用 `phase_id=null`，不创建新 gate。
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`npm exec -- vitest run tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs tests/contract/stage-completion.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-STAGE-HANDOFF` — T005 同一断言全部通过；build-spec 独占 Clarify/research owner，build-code final integration 时点和输入清楚，重要 findings 有处置和停止边界，无新 public stage/gate 或 pass gate。
- **evidence_path**：`quality/tests/T006-handoff-green.json`
- **STOP**：若需把 build-plan 当作补需求阶段、将 research 变成强制 gate、或必须新增 gate/状态对象才能表达 build-code 重要 finding 收口，停止回 spec。
- **recovery**：回滚 P3 workflow/catalog/test bytes；保留现有 spec、review facts 和 build-code implementation facts。
- **task risk**：只更新文档而 runtime consumer 仍拒绝或丢弃合法 research fact，或旧测试仍在声明历史 owner。
- **test tier / test method**：feature / `backend-testing`；同 T005，验证路由和负例。
- **scenarios / commands / expected exit / oracle**：同 T005；同 gate_cmd；GREEN exit 0；`ORACLE-STAGE-HANDOFF`。
- **fixtures_services**：同 T005；不需要 provider 运行。
- **coverage limits**：同 T005；实际 provider lifecycle 由后续真实 stage facts 验证，测试还必须证明已有 runtime consumer 没有把 research 误升格为 gate。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：build-spec 唯一 spec-clarify/条件 research owner、research fact consumer 和 build-code final integration 顺序说明。
- **executed_commands**：`npm exec -- vitest run tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs tests/contract/stage-completion.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；exit 0。
- **evidence_refs**：`quality/tests/T006-handoff-green.json`；receipt_hash=`f990c0b317b008404b8c99e900681831f602017737ad39ef4ba92aac77a33a27`。
- **covered_ac**：`AC-004 AC-011 AC-012 AC-013`。
- **review_fact**：P3 当前异源结果 `quality/reviews/results/build-code-default-7a838f66190eda9573b06c0642a795b031971ed8-7921344b-76cb-41af-8428-3021372b6646.json` 有 4 条 `minor/nonblocking`，无 `major`/`blocking`；Kimi 无终态已单独记录 unavailable。
- **completed_at**：2026-08-11T08:37:52.091Z
- **执行事实**：GREEN 回执通过；P3 review 建议已保留，非阻塞小问题已修正两项，未因 minor 建立无限重审。

### Verify

`ORACLE-STAGE-HANDOFF`；必须证明 build-spec 只有一套 Clarify/research owner，build-plan 只接收规格，build-code integration review 紧跟最终测试和 AC trace。

### Knowledge

P4 收到稳定的 stage scope 和 input boundary；review 失败仍是 quality fact，不改变 stage owner。

### STOP

出现第二套研究来源、public Clarify、build-plan 补需求或新质量 gate时回 spec/decision-log。

### Done

P3 只交接阶段 owner、步骤和 integration 输入；不宣称任何 stage review pass，build-code 的重要 finding 收口交 P4 合同。

### Risks and rollback

Risk：条件 research 被误成必跑。Rollback：撤回 P3 routing/doc/test 变更，保留 truthful skipped/unavailable 事实。

## Phase P4 — wh-review 最小 packet、provider 终态与 advice freshness

### Goal

每个阶段只发送最小干净 packet，并附阶段 prompt/skill/contract；真实 provider 失败不伪造成 findings；所有 stage 只产可信异源 advice，不因记录性变化重审，build-code 仍严格绑定当前实现并收口重要 findings。

### Files

- **NEW**：N/A — 不新增文件。
- **MODIFY**：`skills/wh-review/SKILL.md`、`skills/wh-review/contracts/provider-protocol.md`、`skills/wh-review/contracts/make-decision.md`、`skills/wh-review/contracts/build-spec.md`、`skills/wh-review/contracts/build-plan.md`、`skills/wh-review/contracts/build-code.md`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`runtime/evidence/freshness.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs`、`skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs`、`tests/contract/review-materials-contract.test.mjs`、`tests/integration/verify-freshness-selection.test.mjs`、`tests/contract/make-decision-artifact-path.test.mjs`、`tests/final-cutover-guards.red.test.mjs`、`tests/stage-review-cost-policy.test.mjs`
- **DO NOT TOUCH**：`external 3rd-review repository/**`；broker/provider adapter 的真实失败事实只在 WorkflowHub 侧如实消费。

### Tasks

#### T007 — RED：最小 packet、provider terminal 和 advice freshness

- **ID**：T007
- **Phase**：Phase P4 — wh-review 最小 packet、provider 终态与 advice freshness
- **goal**：暴露审查包过大/缺阶段关注点与排除项、路径合同混乱、provider 失败变 findings、慢/卡终态丢失、record-only 变化逼 advice 重审、所有 stage 被错误要求 pass、build-code 重要 finding 收口缺失或自动循环无停止点的问题。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/wh-review-execution-flow-improvement/spec.md","hash":"5d3828e7d53eca7ffab19128576e00cf453f31cd5594f1a034f97e70e2039ba9","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/wh-review-execution-flow-improvement/plan.md","hash":"a0ab7a0fcea2a33cda9b842ffd6ecacf120075a6cc50b7bab60f352a7e6ee117","id":"PLAN"}]`
- **source_refs / decision_refs**：`R-015,R-016,R-017,R-018,R-019,R-022 / D-009,D-014,D-015,D-018,DEFER-005,DEFER-007,OPEN-003,OPEN-005`
- **输入**：P3 的稳定 stage scope、wh-review packet/runner/contracts、历史 215/464 PROCESS_DEAD 与 398 findings=[] facts。
- **依赖**：T006
- **并行**：否 — 依赖阶段 owner 和最小 subject 边界。
- **FR**：`FR-REVIEW-001 FR-REVIEW-002 FR-REVIEW-003 FR-REVIEW-004 FR-REVIEW-005 FR-REVIEW-006 FR-REVIEW-007 FR-REVIEW-008 FR-REVIEW-009`
- **AC**：`AC-006 AC-007 AC-008 AC-009 AC-010 AC-016 AC-020 AC-021 AC-023 AC-024`
- **动作**：增加 packet allowlist/阶段 prompt（关注点、排除项、finding 证据）、logical path/absolute adapter、terminal failure taxonomy、timeout/kill/route/coverage/group outcome、real empty findings、advice freshness、所有 stage advice-only、build-code 当前重要 finding 收口和 focused review/停止边界 fixtures；断言不允许 caller fallback/retry/伪造 findings 或 pass，也不允许用文件存在代替阶段合同。
- **精确文件**：`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs`、`skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs`、`tests/contract/review-materials-contract.test.mjs`、`tests/integration/verify-freshness-selection.test.mjs`、`tests/contract/make-decision-artifact-path.test.mjs`、`tests/final-cutover-guards.red.test.mjs`、`tests/stage-review-cost-policy.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/__tests__/review-runner.test.mjs`, `skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs`, `skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs`, `tests/contract/review-materials-contract.test.mjs`, `tests/integration/verify-freshness-selection.test.mjs`, `tests/contract/make-decision-artifact-path.test.mjs`, `tests/final-cutover-guards.red.test.mjs`, `tests/stage-review-cost-policy.test.mjs`; symbols/regions: packet, provider outcome, freshness, and stage review contract assertions.
- **输出**：可复现 RED，分别指出 business finding 与 transport/unavailable 的错误混淆。
- **Knowledge**：PROCESS_DEAD/SIGTERM/timeout/path error/bad JSON 没有最终公开文本就不是 findings；398 的 findings=[] 是另一次独立成功 attempt。
- **verification_role**：RED
- **paired_task**：T008
- **gate_cmd**：`npm exec -- vitest run skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs tests/contract/review-materials-contract.test.mjs tests/integration/verify-freshness-selection.test.mjs tests/contract/make-decision-artifact-path.test.mjs tests/final-cutover-guards.red.test.mjs tests/stage-review-cost-policy.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-REVIEW-FACTS` — 目标断言非零且失败原因属于 packet/terminal/freshness/implementation binding，不是 provider 业务 finding。
- **evidence_path**：`quality/tests/T007-review-red.json`
- **STOP**：若 RED 只能通过扩大 packet、静默重试、换 provider 或制造 findings 才出现，停止回 wh-review contract。
- **recovery**：修正 fault fixture、provider result fixture 或当前 subject binding；不删除历史 attempt/report。
- **task risk**：将 unavailable、旧 report、provider pass 或测试通过误当当前 review advice/无重要 findings。
- **test tier / test method**：feature / `backend-testing`；fixture 驱动 provider lifecycle，不需要真实长跑 provider。
- **scenarios / commands / expected exit / oracle**：direction/detail/spec/plan advice、phase/integration implementation review、阶段关注点/排除项缺失、PROCESS_DEAD、SIGTERM、timeout、坏 JSON、路径失败、route/coverage 降级、真实 empty findings、record-only material delta、build-code actionable major/blocking finding、focused repair、重复 finding、无变化和无终态；同 gate_cmd；RED exit 1；`ORACLE-REVIEW-FACTS`。
- **fixtures_services**：现有 provider/broker fixtures、临时 bundle；无需 3rd-review 生产修改。
- **coverage limits**：覆盖 WorkflowHub 侧 packet、阶段提示、终态/route/coverage/group outcome、事实和绑定；不声称修复 3rd-review adapter 内部实现。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — RED task is reviewed with its paired GREEN Phase result
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started

#### T008 — GREEN：阶段化最小 review 与真实失败记录

- **ID**：T008
- **Phase**：Phase P4 — wh-review 最小 packet、provider 终态与 advice freshness
- **goal**：让 T007 通过，补齐每个阶段的关注点/排除项/证据要求和慢卡终态事实，同时让所有 stage 只产 advice，让 build-code 按当前重要 finding 收口而不要求 provider pass。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/wh-review-execution-flow-improvement/spec.md","hash":"5d3828e7d53eca7ffab19128576e00cf453f31cd5594f1a034f97e70e2039ba9","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/wh-review-execution-flow-improvement/plan.md","hash":"a0ab7a0fcea2a33cda9b842ffd6ecacf120075a6cc50b7bab60f352a7e6ee117","id":"PLAN"}]`
- **source_refs / decision_refs**：`R-015,R-016,R-017,R-018,R-019,R-022 / D-009,D-014,D-015,D-018,DEFER-005,DEFER-007,OPEN-003,OPEN-005`
- **输入**：T007 失败事实；既有 `buildReviewMaterials`、`reviewGroupOutcome`、provider protocol、freshness selection 和 final binding。
- **依赖**：T007
- **并行**：否 — RED/GREEN 必须串行。
- **FR**：`FR-REVIEW-001 FR-REVIEW-002 FR-REVIEW-003 FR-REVIEW-004 FR-REVIEW-005 FR-REVIEW-006 FR-REVIEW-007 FR-REVIEW-008 FR-REVIEW-009`
- **AC**：`AC-006 AC-007 AC-008 AC-009 AC-010 AC-016 AC-020 AC-021 AC-023 AC-024`
- **动作**：保持阶段 allowlist 与阶段所需的最小 diff/index coverage；把每阶段 prompt/skill/contract 的关注点、排除项、finding 证据和单次 broker 调用固化；把 timeout/kill/PROCESS_DEAD、path/transport、route/coverage/group outcome 和 provider no-final-output 如实记录为对应 unavailable/incomplete/transport 事实；让 advice 保留 reviewed material/snapshot/provenance，不因 record-only 变化失效；build-code 继续严格绑定当前实现，只在当前可信结果没有 actionable major/blocking finding 后结束，实际修复后才做一次 focused review，重复/无变化/无终态就停止自动循环，不要求 provider pass。
- **精确文件**：`skills/wh-review/SKILL.md`、`skills/wh-review/contracts/provider-protocol.md`、`skills/wh-review/contracts/make-decision.md`、`skills/wh-review/contracts/build-spec.md`、`skills/wh-review/contracts/build-plan.md`、`skills/wh-review/contracts/build-code.md`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`runtime/evidence/freshness.mjs`
- **boundary**：files: `skills/wh-review/SKILL.md`, `skills/wh-review/contracts/provider-protocol.md`, `skills/wh-review/contracts/make-decision.md`, `skills/wh-review/contracts/build-spec.md`, `skills/wh-review/contracts/build-plan.md`, `skills/wh-review/contracts/build-code.md`, `skills/wh-review/scripts/review-materials.mjs`, `skills/wh-review/scripts/review-runner.mjs`, `runtime/evidence/freshness.mjs`; symbols/regions: review packet/prompt/outcome and freshness/final binding only.
- **输出**：GREEN review facts、阶段关注点/排除项、真实 failure taxonomy、route/coverage/group outcome、advice provenance、所有 stage advice-only 事实和 build-code 重要 finding 收口/停止事实。
- **Knowledge**：所有 stage 得到可信异源建议即可，不要求 pass/findings=[]；build-code 的严格条件是当前没有 actionable major/blocking finding，不是 provider pass；真实 empty findings、minor advice 和 unavailable 必须分开。
- **verification_role**：GREEN
- **paired_task**：T007
- **gate_cmd**：`npm exec -- vitest run skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs tests/contract/review-materials-contract.test.mjs tests/integration/verify-freshness-selection.test.mjs tests/contract/make-decision-artifact-path.test.mjs tests/final-cutover-guards.red.test.mjs tests/stage-review-cost-policy.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-REVIEW-FACTS` — T007 同一断言全部通过；阶段关注点/排除项/证据、route/provider/coverage/attempt/result/report/group outcome/provenance 可回看，unavailable 不被写成 findings=[]、pass 或无重要 findings，record-only 不触发 advice 重审，build-code 重要 finding 未处置时不能结束且无变化不自动循环。
- **evidence_path**：`quality/tests/T008-review-green.json`
- **STOP**：若实现新增 provider selector/fallback/retry/lifecycle、完整仓库 packet、替代 review store 或新的 gate，停止回 D-009/D-015。
- **recovery**：回滚 P4 current skill/runner/freshness bytes；保留历史 review attempts/results/reports 和真实 errors。
- **task risk**：把 advice freshness 放宽到 build-code，或把 provider transport failure误称 finding，或把 build-code 的重要 finding 收口误写成 provider pass。
- **test tier / test method**：feature / `backend-testing`；同 T007，含实现 review current snapshot negative。
- **scenarios / commands / expected exit / oracle**：同 T007；同 gate_cmd；GREEN exit 0；`ORACLE-REVIEW-FACTS`。
- **fixtures_services**：同 T007；真实 broker 调用只在阶段 review 发生，不由这些契约测试偷偷增加调用次数。
- **coverage limits**：同 T007；3rd-review provider adapter 的绝对路径转换仅以 WorkflowHub 可观察 transport contract 验证，具体 broker lifecycle 仍以真实 provider fact 为准。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：阶段最小 packet、阶段提示/合同、provider 终态分类、advice freshness 和 build-code 重要 finding 停止边界。
- **executed_commands**：`npm exec -- vitest run skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs tests/contract/review-materials-contract.test.mjs tests/integration/verify-freshness-selection.test.mjs tests/contract/make-decision-artifact-path.test.mjs tests/final-cutover-guards.red.test.mjs tests/stage-review-cost-policy.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；exit 0。
- **evidence_refs**：`quality/tests/P4-bounded-prompt-green-v2.json`；receipt_hash=`367d3dac110e883af85fe19738ce898e7fb3002246530aa351d75b31d3553f78`；`quality/tests/T008-review-green.json`；receipt_hash=`22d01663590fc16e59ea191ddc4594f9cd6c1903177d4e8f66a0973c37a5afa5`。
- **covered_ac**：`AC-006 AC-007 AC-008 AC-009 AC-010 AC-016 AC-020 AC-021 AC-023 AC-024`。
- **review_fact**：P4 当前 review attempt `quality/reviews/attempts/ea6e781f-f3c8-47b4-8211-d964307aa347/attempt.json` 为 unavailable；OpenCode 无 terminal，Kimi 被停止，未生成 findings=[]。
- **completed_at**：2026-08-11T08:38:15.364Z
- **执行事实**：GREEN 契约回执通过；provider 失败保持 unavailable，packet 已从完整材料收窄为阶段 allowlist。

### Verify

`ORACLE-REVIEW-FACTS`；provider failure、真实 empty findings、所有 stage advice-only、build-code 重要 finding 收口/停止和 record-only freshness 必须分别可观测。

### Knowledge

P5 只做治理回归，不因 plan/tasks 或 decision-log 记录性变化重新调用已完成 advice review。

### STOP

扩大 packet、伪造 findings、静默切换 provider、无限 retry 或把 advice 当 gate 时回 wh-review contract。

### Done

P4 交接真实 review provenance、failure taxonomy 和停止边界；所有阶段只交付异源建议/真实 unavailable，build-code 只在没有重要 findings 时结束，不要求 provider pass。

### Risks and rollback

Risk：最小 packet 缺语义。Rollback：优先补阶段 prompt/contract/context map，不把完整仓库塞进 bundle。

## Phase P5 — 宪法、四材料和非 gate 回归锁定

### Goal

用已有测试证明本方案不新增维护对象、质量 gate、public 控制面或替代材料，同时不把 review/test/history 变成推进许可证；并在 build-plan 最终 publish 前真实调用一次严格 `spec-analyze`，检查五项当前材料和全部 DEFER/OPEN 去向。

### Files

- **NEW**：N/A — 不新增文件。
- **MODIFY**：`workflows/build-plan/SKILL.md`、`workflows/build-plan/steps.json`、`skills/spec-analyze/SKILL.md`、`skills/wh-review/scripts/review-materials.mjs`、`runtime/stage/stage-content-contracts.mjs`、`tests/contract/four-material-non-gate-contract.test.mjs`、`tests/contract/repository-governance.test.mjs`、`tests/p0-foundation-contracts.test.mjs`、`tests/requirements-completeness-audit-acceptance.test.mjs`、`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/spec-stage-artifact-closure.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/contract/stage-skill-invocation-contract.test.mjs`、`quality/tests/T011-final.json`
- **DO NOT TOUCH**：`CONSTITUTION.md`、`constitution-checklist.md`、`specs/archive/**`；只读绑定和历史证据不改写。

### Tasks

#### T009 — RED：四材料和 no-new-gate 边界

- **ID**：T009
- **Phase**：Phase P5 — 宪法、四材料和非 gate 回归锁定
- **goal**：暴露新增 ledger/gate、旧历史冒充当前、provider unavailable 当 pass、四材料权威被分叉，以及 build-plan 没有在最终 publish 前严格检查 DEFER/OPEN 去向的问题。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/wh-review-execution-flow-improvement/spec.md","hash":"5d3828e7d53eca7ffab19128576e00cf453f31cd5594f1a034f97e70e2039ba9","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/wh-review-execution-flow-improvement/plan.md","hash":"a0ab7a0fcea2a33cda9b842ffd6ecacf120075a6cc50b7bab60f352a7e6ee117","id":"PLAN"}]`
- **source_refs / decision_refs**：`R-001,R-010,R-021 / D-001,D-010,D-017,DEFER-001,DEFER-002,DEFER-003,DEFER-004,DEFER-005,DEFER-006,DEFER-007,DEFER-008,DEFER-009,OPEN-001,OPEN-002,OPEN-003,OPEN-004,OPEN-005,OPEN-006`
- **输入**：宪法、清单、当前四材料边界和现有 governance/non-gate contracts。
- **依赖**：T008
- **并行**：否 — 最终治理测试必须读取前序合同。
- **FR**：`FR-GOV-001 FR-PLAN-001`
- **AC**：`AC-015 AC-022`
- **动作**：增加 no-new-object/no-new-gate、四材料唯一 authority、历史只读、review unavailable 非 pass、同 task repair 的失败 fixture；同时把最终 `spec-analyze` 的反例写成 RED：漏掉 R/D/DEFER/OPEN、流程/边界/非目标或 task oracle，调用早于 findings disposition，或使用历史/不完整输入时必须产生 finding/incomplete。
- **精确文件**：`tests/contract/four-material-non-gate-contract.test.mjs`、`tests/contract/repository-governance.test.mjs`、`tests/p0-foundation-contracts.test.mjs`、`tests/requirements-completeness-audit-acceptance.test.mjs`、`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/spec-stage-artifact-closure.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/contract/stage-skill-invocation-contract.test.mjs`
- **boundary**：files: `tests/contract/four-material-non-gate-contract.test.mjs`, `tests/contract/repository-governance.test.mjs`, `tests/p0-foundation-contracts.test.mjs`, `tests/requirements-completeness-audit-acceptance.test.mjs`, `tests/contract/spec-analyze-completeness.test.mjs`, `tests/contract/spec-stage-artifact-closure.test.mjs`, `tests/contract/stage-completion.test.mjs`, `tests/contract/stage-skill-invocation-contract.test.mjs`; symbols/regions: only RED assertions for four-material authority, no-new-object/gate, historical read-only, unavailable semantics, and final analyzer order/completeness; no production ownership.
- **输出**：可复现 RED，目标是结构边界断言失败而不是实现测试失败。
- **Knowledge**：宪法 21 条和当前四材料已冻结；不修改 CONSTITUTION/checklist。
- **verification_role**：RED
- **paired_task**：T010
- **gate_cmd**：`npm exec -- vitest run tests/contract/four-material-non-gate-contract.test.mjs tests/contract/repository-governance.test.mjs tests/p0-foundation-contracts.test.mjs tests/requirements-completeness-audit-acceptance.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/stage-completion.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-GOV-BOUNDARY` — 失败来自新增对象/gate、错误 pass 语义或最终 spec-analyze 漏项/错序的目标断言。
- **evidence_path**：`quality/tests/T009-governance-red.json`
- **STOP**：若需要修改宪法条款、迁移历史记录或新建质量控制面，停止回 decision/spec。
- **recovery**：修正测试 fixture/断言；不删除历史 evidence。
- **task risk**：把“没有新增 gate”误写成“不需要 review/test/AC 事实”。
- **test tier / test method**：feature / `backend-testing`；本地结构和合同测试。
- **scenarios / commands / expected exit / oracle**：四材料缺失/多 authority、旧 receipt、unavailable review、同 task repair、DEFER/OPEN 缺去向、最终 analyzer 输入缺失、只在中段调用和 findings 未处置就 publish；同 gate_cmd；RED exit 1；`ORACLE-GOV-BOUNDARY`。
- **fixtures_services**：现有 repository fixtures；无外部服务。
- **coverage limits**：覆盖宪法边界和最终 analyzer 的报告语义/顺序；不覆盖完整 provider runtime 或历史 task 内容。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — RED task is reviewed with its paired GREEN Phase result
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started

#### T010 — GREEN：治理和非 gate 回归

- **ID**：T010
- **Phase**：Phase P5 — 宪法、四材料和非 gate 回归锁定
- **goal**：让 T009 通过，确保实现优化不违反 WorkflowHub 宪法，并让最后一次现有 `spec-analyze` 真正发生在 findings disposition 后、publish 前。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/wh-review-execution-flow-improvement/spec.md","hash":"5d3828e7d53eca7ffab19128576e00cf453f31cd5594f1a034f97e70e2039ba9","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/wh-review-execution-flow-improvement/plan.md","hash":"a0ab7a0fcea2a33cda9b842ffd6ecacf120075a6cc50b7bab60f352a7e6ee117","id":"PLAN"}]`
- **source_refs / decision_refs**：`R-001,R-010,R-021 / D-001,D-010,D-017,DEFER-001,DEFER-002,DEFER-003,DEFER-004,DEFER-005,DEFER-006,DEFER-007,DEFER-008,DEFER-009,OPEN-001,OPEN-002,OPEN-003,OPEN-004,OPEN-005,OPEN-006`
- **输入**：T009 失败事实；四材料、quality facts、review/test/history 的既有权限边界。
- **依赖**：T009
- **并行**：否 — RED/GREEN 必须串行。
- **FR**：`FR-GOV-001 FR-PLAN-001`
- **AC**：`AC-015 AC-022`
- **动作**：修正现有治理断言，使 review/test/evidence/history 继续是事实而非推进许可证，且没有新 ledger、对象、public ask/resume、provider lifecycle 或 quality gate；复用现有 `spec-analyze` projection/validator，扩展 R/D/FR/AC、流程/状态/边界/非目标、全部 DEFER/OPEN owner/触发/去向/关闭条件和 task oracle 检查，并把唯一调用移到 review findings 处置和最后一次 plan/tasks 修订之后、publish 前。T010 的 GREEN 可以修改下列生产文件和列出的治理测试断言；不是新增控制面。
- **精确文件**：`workflows/build-plan/SKILL.md`、`workflows/build-plan/steps.json`、`skills/spec-analyze/SKILL.md`、`skills/wh-review/scripts/review-materials.mjs`、`runtime/stage/stage-content-contracts.mjs`、`tests/contract/four-material-non-gate-contract.test.mjs`、`tests/contract/repository-governance.test.mjs`、`tests/p0-foundation-contracts.test.mjs`、`tests/requirements-completeness-audit-acceptance.test.mjs`、`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/spec-stage-artifact-closure.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/contract/stage-skill-invocation-contract.test.mjs`
- **boundary**：files: `workflows/build-plan/SKILL.md`, `workflows/build-plan/steps.json`, `skills/spec-analyze/SKILL.md`, `skills/wh-review/scripts/review-materials.mjs`, `runtime/stage/stage-content-contracts.mjs`, `tests/contract/four-material-non-gate-contract.test.mjs`, `tests/contract/repository-governance.test.mjs`, `tests/p0-foundation-contracts.test.mjs`, `tests/requirements-completeness-audit-acceptance.test.mjs`, `tests/contract/spec-analyze-completeness.test.mjs`, `tests/contract/spec-stage-artifact-closure.test.mjs`, `tests/contract/stage-completion.test.mjs`, `tests/contract/stage-skill-invocation-contract.test.mjs`; symbols/regions: `buildPlanningArtifacts`, `validateSpecAnalyzeCompleteness`, build-plan step order, and no-new-object/gate assertions only.
- **输出**：GREEN 治理回归事实和最终 report-only analyzer fact；不改宪法正文、不生成新质量 gate。
- **Knowledge**：P5 不创建新的运行时对象；现有 quality facts 缺失仍保持 unknown/unavailable/incomplete。
- **verification_role**：GREEN
- **paired_task**：T009
- **gate_cmd**：`npm exec -- vitest run tests/contract/four-material-non-gate-contract.test.mjs tests/contract/repository-governance.test.mjs tests/p0-foundation-contracts.test.mjs tests/requirements-completeness-audit-acceptance.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/stage-completion.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-GOV-BOUNDARY` — T009 同一断言全部通过；四材料仍唯一 authority，质量事实不当 gate，历史不冒充当前，最终 analyzer 在正确位置执行且能报告 DEFER/OPEN 缺项。
- **evidence_path**：`quality/tests/T010-governance-green.json`
- **STOP**：若出现“为了通过测试必须新增 gate/ledger”的结论，停止，不绕过宪法。
- **recovery**：回滚 P5 测试合同变更；保留失败事实和用户可见风险。
- **task risk**：测试全绿但漏掉新增 public control plane。
- **test tier / test method**：feature / `backend-testing`；同 T009，含负例。
- **scenarios / commands / expected exit / oracle**：同 T009；同 gate_cmd；GREEN exit 0；`ORACLE-GOV-BOUNDARY`。
- **fixtures_services**：同 T009；不运行 provider。
- **coverage limits**：同 T009；最终 `npm test` 才覆盖全仓库组合；此任务不把 report-only analyzer 升格成推进 gate。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：最终 spec-analyze 位置/报告语义、四材料唯一 authority、无新对象/质量 gate 和历史只读合同。
- **executed_commands**：`npm exec -- vitest run tests/contract/four-material-non-gate-contract.test.mjs tests/contract/repository-governance.test.mjs tests/p0-foundation-contracts.test.mjs tests/requirements-completeness-audit-acceptance.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/stage-completion.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；exit 0。
- **evidence_refs**：`quality/tests/P5-governance-green-v2.json`；receipt_hash=`dde0f5676f7e07fca720164224deccd2c02efc0e6d42513190c7cd86c587d657`；`quality/tests/T010-governance-green.json`；receipt_hash=`c97427ed788ee0455a0037967b3d1974b806731da602137473d053bd0cb5ce34`。
- **covered_ac**：`AC-015 AC-022`。
- **review_fact**：P5 当前 review attempt `quality/reviews/attempts/9f518670-abac-4964-b927-9e00450b6c70/attempt.json` 为 unavailable；没有把它写成 analyzer 通过或 provider pass。
- **completed_at**：2026-08-11T08:38:23.368Z
- **执行事实**：GREEN 治理回执通过；没有新增 ledger、维护对象、public 控制面或质量 gate。

#### T011 — FINAL：current-snapshot aggregate verification

- **ID**：T011
- **Phase**：Phase P5 — 宪法、四材料和非 gate 回归锁定
- **goal**：按 plan.md 固定的最终路线验证所有适用 FR/AC、跨阶段 seam、最终 `spec-analyze` 事实和当前完整测试事实。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/wh-review-execution-flow-improvement/spec.md","hash":"5d3828e7d53eca7ffab19128576e00cf453f31cd5594f1a034f97e70e2039ba9","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/wh-review-execution-flow-improvement/plan.md","hash":"a0ab7a0fcea2a33cda9b842ffd6ecacf120075a6cc50b7bab60f352a7e6ee117","id":"PLAN"}]`
- **source_refs / decision_refs**：`R-001,R-002,R-003,R-004,R-005,R-006,R-007,R-008,R-009,R-010,R-011,R-012,R-013,R-014,R-015,R-016,R-017,R-018,R-019,R-020,R-021,R-022,G-002 / D-001,D-002,D-003,D-004,D-005,D-006,D-007,D-008,D-009,D-010,D-011,D-012,D-013,D-014,D-015,D-016,D-017,D-018,DEFER-001..DEFER-009,OPEN-001..OPEN-006`
- **输入**：T001–T010 的真实执行事实、当前四材料、最终 AC trace、唯一最终 `spec-analyze` report-only fact。build-code final integration review 和 verify-code handoff 是后续阶段事实，不是 T011 的前置输入；T011 只把这条边界交接出去。
- **依赖**：T010
- **并行**：否 — aggregate 读取全部前序 task facts。
- **FR**：`FR-START-001 FR-START-002 FR-INTERACT-001 FR-INTERACT-002 FR-INTERACT-003 FR-INTERACT-004 FR-INTERACT-005 FR-DECISION-001 FR-REVIEW-001 FR-REVIEW-002 FR-REVIEW-003 FR-REVIEW-004 FR-REVIEW-005 FR-REVIEW-006 FR-REVIEW-007 FR-REVIEW-008 FR-REVIEW-009 FR-SPEC-001 FR-SPEC-002 FR-HANDOFF-001 FR-CLEANUP-001 FR-PLAN-001 FR-GOV-001`
- **AC**：`AC-001 AC-002 AC-003 AC-004 AC-005 AC-006 AC-007 AC-008 AC-009 AC-010 AC-011 AC-012 AC-013 AC-014 AC-015 AC-016 AC-017 AC-018 AC-019 AC-020 AC-021 AC-022 AC-023 AC-024`
- **动作**：先确认 T010 已在 findings disposition 和最后一次 plan/tasks 修订后、publish 前真实执行一次最终 `spec-analyze`，且它只消费当前五项输入并保留 DEFER/OPEN 覆盖事实；随后只执行一次 `npm test`，记录真实 exit、oracle、覆盖范围、未覆盖项和剩余 unavailable；同时确认所有 stage review 都只记录 advice，build-code 的当前 review 以没有 actionable major/blocking finding 收口，不以 provider pass 或 aggregate/analyzer 替代既有 review/confirmation，也不启动无变化的无限重审。
- **精确文件**：`quality/tests/T011-final.json`（只写入既有 quality evidence namespace；当前四材料、前序 facts 和最终 analyzer report 通过现有读取接口只读消费）。
- **boundary**：files: `quality/tests/T011-final.json`; 当前四材料、前序 facts 和最终 analyzer report 只读；T011 不拥有任何 runtime/workflow/skill/test 源文件，不修改生产 bytes。
- **输出**：最终 `spec-analyze` report-only 事实与测试交接事实，包含当前材料/hash、R/D/FR/AC/DEFER/OPEN 覆盖、流程/状态/边界/非目标/task oracle 和真实 review/unavailable 状态。
- **Knowledge**：质量事实只说明发生了什么；所有 stage advice 不要求 provider pass，build-code final integration 必须已有真实当前实现绑定且没有重要 findings；最终 analyzer 不是 provider review、不是 pass predicate、不是推进许可证。
- **verification_role**：N/A — non-behavior aggregate verification
- **paired_task**：N/A — aggregate has no RED/GREEN pair
- **gate_cmd**：`npm test`
- **expected_exit**：0
- **oracle**：`ORACLE-FINAL` — 最终 `spec-analyze` 已在正确位置真实执行且缺项能报告 finding/incomplete；随后全部当前测试通过；缺 provider/host/quality 的事实仍以 unavailable/unknown/incomplete 保留，不改写成 pass。
- **evidence_path**：`quality/tests/T011-final.json`
- **STOP**：命令损坏、当前材料/hash 错绑、AC 缺失、越界、新对象/gate 或需要新产品决定时停止回受影响 task/材料。
- **recovery**：保留原始 stdout/stderr，回受影响 task 做最小修复；不靠全量重跑掩盖局部失败。
- **task risk**：聚合遗漏跨阶段 seam，或把全仓库绿色误报成 provider/业务已通过。
- **test tier / test method**：full / `npm test`；最终完整本地回归，真实 provider review 仍按 stage 合同单独记录。
- **scenarios / commands / expected exit / oracle**：覆盖 dirty、顺序、三类交互、build-spec owner、最小 review、provider failure、advice freshness、所有 stage advice-only、build-code 重要 finding → focused repair → 一次复查、重复/无变化/无终态停止、最终五材料 cross-document analyzer、DEFER/OPEN 去向、治理边界；先核对既有 analyzer 的 report-only 结果，再运行 `npm test`；exit 0；`ORACLE-FINAL`。
- **fixtures_services**：现有本地 Vitest fixtures、已有临时 bundle/worktree cleanup；不启动长期外部服务。
- **coverage limits**：不覆盖 3rd-review 内部 adapter、历史 task 修复、用户未授权 cleanup/commit/push/merge；最终 analyzer 也不替代 provider review 或 build-code integration 的重要 finding 收口；这些保留为明确边界/事实。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`incomplete`
- **actual_changes**：已完成 P1–P5 的实现、定向测试和阶段异源审查；已执行一次当前全量 `npm test`；未把 build-code 的 phase_id=null integration review 失败/无终态伪造成完成。
- **executed_commands**：`npm test`；当前快照 `5d443cbad0aee2c0d8aec24a9668e3b9426cfe40`，exit 0；随后执行现有 `stage-runtime run --action=execute --stage=build-code`，官方质量事实保持 `incomplete`。
- **evidence_refs**：`quality/tests/T011-final-v5.json`（receipt_hash=`b22dd4fb48f56ff1cf8338118848e160ce3c629207b7a5e3e95a32228959868f5`）；`quality/evidence/implementation/a6409b4ccf7b8421409575daf221e7a1c9b9b507ad70f9f375e7ca7aeaffd011.json`；`quality/facts/b5914d062ac32a49a0f314b3ba4987d8c5d32f8ed9b3c2d13bba51f52b07dc03.json`；`quality/facts/275ab5c50a45ef144cffb856880a5fcc0d6b50d05756bcd3875afbf1d3906c7f.json`。
- **covered_ac**：当前 build-code 官方 acceptance coverage 对 `AC-001`–`AC-024` 全部保留为 `unknown`，没有把全量测试绿灯当作逐项 AC 通过。
- **phase_review_facts**：P1 `quality/reviews/results/build-code-default-93eb5f7e78325c44ff81780d8ae8355a2b6173c9-0c69d95f-0f39-49c1-9146-fe55b3ace492.json` 有 2 条 minor advice、无严重 finding；P2 `quality/reviews/results/build-code-default-4bb26fb43aa4f3de4902970a13e9241e9951dfe3-802f5391-5f93-4516-aff2-828cabb18b95.json`、P3 `quality/reviews/results/build-code-default-4bb26fb43aa4f3de4902970a13e9241e9951dfe3-ef1121f4-b87b-41f0-8207-f758b73e21f3.json`、P4 `quality/reviews/results/build-code-default-4bb26fb43aa4f3de4902970a13e9241e9951dfe3-b5cb77c2-51df-4e9a-a7f1-ad653b7fe50c.json`、P5 `quality/reviews/results/build-code-default-5d443cbad0aee2c0d8aec24a9668e3b9426cfe40-85fd51ab-7f63-46c5-a273-65a6c54e9125.json` 均有可信 provider 终态且 findings 为空；这些都是建议事实，不是 provider pass。
- **review_fact**：当前 `phase_id=null` integration provider 运行超过 12 分钟后仍没有最终文本，被停止；没有生成可用 findings，也没有生成可认证的当前 integration result/attempt/report，因此 `integration_review` 保持 `missing/unknown`。这不能写成 findings=[] 或“没有重要 findings”。
- **missing_items**：当前 integration review 的可信终态；逐项 AC 的当前语义证据；spec.md 的 SCN-011 仍有“沿用既有 pass 合同”旧措辞，需要回 build-spec 修正为“不要求 provider pass”；provider 长时间无终态的真实 broker timeout/kill 仍属于 wh-review/3rd-review 的延期交接。
- **completed_at**：未设置；当前只形成 build-code 质量事实和 verify-code 交接，不构成正式验收或 close。
- **执行事实**：`spec-analyze` 的 build-plan report-only 事实仍保留为历史当前材料检查；本次 build-code 不重跑、不把它当 provider review。用户要求进入 verify-code 后，verify-code 必须反向检查原始需求、Design、完整用户流程和每项 AC；缺失证据标 `unknown/incomplete`，不宣称 pass。用户回复（2026-08-11）：`好的，可以继续了`，表示继续执行，不表示 provider pass、build-code 完成或最终验收通过。

### Deferred/open handoff coverage

这是任务追踪索引，不是新的权威材料或质量 gate；decision-log 的延期/未决表仍是来源。每一项都必须在对应任务、非目标或历史保留边界中有去向。

| ID | 任务/阶段 | 结果边界 |
| --- | --- | --- |
| DEFER-001 / OPEN-001 | T001/T002 / P1 | dirty fact 复用现有字段；不导入 dirty、不自动清理 |
| DEFER-002 | T003/T004/T005/T006 / P2-P3 | Talk、spec-clarify、Grill 共用现有 host seam；失败保持 incomplete |
| DEFER-003 | T005/T006 / P3 | build-spec 条件 research 为 executed/skipped/unavailable；由现有 runtime consumer 消费 |
| DEFER-004 | T005/T006 / P3 | build-code final integration 复用 `phase_id=null` 既有合同 |
| DEFER-005 | T003/T004/T007/T008 / P2-P4 | 阶段顺序、prompt 和 review 关注点固定；失败保持事实 |
| OPEN-002 | T005/T006 / P3 | build-spec conditional research fact key/step_id 与现有结构对齐 |
| OPEN-003 | T007/T008 / P4 | 阶段终态、timeout/kill/route/coverage/group outcome 可回看；不 fallback |
| DEFER-006 | T009/T010 / P5 | 历史只读，不改写、不重审、不产实现 task |
| OPEN-006 | T009/T010/T011 / P5 | 历史结果不能冒充当前 snapshot |
| DEFER-007 | T007/T008 / P4 | record-only 不重审；build-code 仍严格绑定当前实现 |
| OPEN-005 | T007/T008/T011 / P4-P5 | confirmation 与 advice provenance 绑定；record-only 不重审 |
| DEFER-008 | T003/T004/T011 / P2-P5 | 同一 decision-log 逐 step 更新并最终回放；不建 ledger |
| DEFER-009 | T009/T010/T011 / P5 | 最终 `spec-analyze` report-only；漏项只能 finding/incomplete |
| OPEN-004 | T001/T002 / P1 | cleanup 只建议；用户明确同意后复用现有 authorize |

### Verify

`npm test`；expected exit 0；`ORACLE-FINAL` 必须同时核对所有适用 AC、跨任务 seam、当前四材料、最终 `spec-analyze` 事实和真实 quality facts。

### Knowledge

最终聚合只消费前序事实，不生成新 writer、状态库或权限；build-code/verify-code 仍按各自既有合同独立完成。

### STOP

任何未绑定的 current material、缺失 AC、provider failure 被改写、需要新对象/gate 或用户未确认的不可逆动作都停止。

### Done

T011 只有在真实 `npm test`、前序 review/AC/交接事实齐全后才能标 completed；否则保留 pending/incomplete，不宣称正式验收。

### Risks and rollback

Risk：全局绿掩盖局部事实缺失。Rollback：回具体 task，保留原始输出和 quality facts，不删除历史 evidence。

## Final current-snapshot aggregate strategy

- **tier / method**：full / `npm test`；build-code 前置执行 focused tests、最终 AC trace 和 final integration review，verify-code 再独立验证。
- **scenarios**：dirty target 启动与 cleanup consent；13-step make-decision 顺序；Talk/spec-clarify/Grill ask-wait-reply-resume；Grill batch partial/conflict；最小 packet 和 provider transport failure；record-only advice freshness；build-spec research owner；build-code final integration；四材料和 no-new-gate 边界。
- **command**：`npm test`
- **expected exit**：0
- **oracle**：`ORACLE-FINAL` — 全部适用 FR/AC 的契约测试、失败边界、当前 four-material binding 和现有 full test suite 均通过；provider unavailable 仍必须以 unavailable 事实存在。
- **fixtures_services**：确定性本地 Vitest fixtures；真实 provider review 只在阶段 review 步骤调用；不启动额外长期服务。
- **evidence_path**：`quality/tests/T011-final.json`
- **coverage limits**：覆盖本任务列出的 runtime/workflow/skill/contract/test 范围；不覆盖 3rd-review 内部 adapter、历史 task 修复、用户未授权 cleanup/commit/push/merge。
- **STOP**：命令损坏、AC 缺失、当前材料/hash 错绑、出现新对象/gate、provider 失败被改写或需要新产品决定时回受影响 task/材料。
- **execution_contract**：当前快照运行一次；失败保留原始输出，回受影响 task，不用全量重跑掩盖局部失败。

## Dependency Graph

- **order**：T001 (RED) → T002 (GREEN) → T003 (RED) → T004 (GREEN) → T005 (RED) → T006 (GREEN) → T007 (RED) → T008 (GREEN) → T009 (RED) → T010 (GREEN) → T011 (FINAL)

```text
T001 (RED) → T002 (GREEN) → T003 (RED) → T004 (GREEN) → T005 (RED) → T006 (GREEN) → T007 (RED) → T008 (GREEN) → T009 (RED) → T010 (GREEN) → T011 (FINAL)
```

## Final Boundary Check

- [x] 每个 Phase 的 Goal、Files、Tasks、Verify、Knowledge、STOP、Done、Risks and rollback 完整。
- [x] 每个任务只有一张卡和一个完成区；文件是所属 Phase NEW/MODIFY 的子集。
- [x] 每个行为变化都有同命令、同 oracle 的 RED → GREEN；FINAL 只做一次聚合。
- [x] 依赖无环，FR/AC 双向追溯闭合，未知事实没有被写成假设或通过。
- [x] review、test、evidence 只作为事实记录，不是开始、继续或交付许可证。
