# 任务清单：WorkflowHub Multica 恢复 v2

- **Input**：`decision-log.md#2026-08-10 新一轮实施决定`、`spec.md`、`plan.md`
- **Template version**：`plan-task.v3`

## T001 — 冻结当前四材料与边界

- **目标**：消除四材料之间的过期状态冲突，冻结本轮唯一设计输入。
- **依赖**：none
- **精确文件**：`specs/workflowhub-multica-recovery-v2/decision-log.md`、`specs/workflowhub-multica-recovery-v2/spec.md`、`specs/workflowhub-multica-recovery-v2/plan.md`、`specs/workflowhub-multica-recovery-v2/tasks.md`
- **动作**：补 FR-9/FR-10、AC-10/AC-12；写入 Phase 测试、提交、review subject 规则；完成 T001-T011 的 source/FR/AC 双向映射。
- **验证**：role=N/A（材料设计）；gate_cmd=`npx markdownlint-cli2 specs/workflowhub-multica-recovery-v2/decision-log.md specs/workflowhub-multica-recovery-v2/spec.md specs/workflowhub-multica-recovery-v2/plan.md specs/workflowhub-multica-recovery-v2/tasks.md`; expected_exit=`0`; oracle=`ORACLE-MATERIALS`：四材料只有一套当前计划，历史 T6 不被当作当前状态。
- **证据**：evidence_path=`quality/reviews/reports/phase-materials-20260810.md`; record=`材料 lint、mapping、边界审查结果`。
- **Trace**：D-Phase-quality/D-Phase-subject → FR-9/FR-10 → AC-10/AC-11/AC-12
- **STOP**：需要第五份当前材料、不可逆权限或新控制面时停止。
- **状态**：`completed`
- **执行事实**：四材料 markdownlint exit=0；两个独立设计审查的阻断项已修正；Phase A `opencode/v4flash` review runtime `7ef4658c-b7d2-40b5-aa2a-93c86c3d4cd0` 无 blocking，review report 已写入 `quality/reviews/reports/recovery-v2-phase-a-opencode-v4flash-7ef4658c-pass.md`。

## T002 — RED：Phase blueprint 与 route 合同

- **目标**：先证明当前工作流没有把 blueprint 接入 build-plan、没有把 FR-5/AC-6 的阶段归属写清楚，或错误把 blueprint 当作执行 gate。
- **依赖**：T001
- **精确文件**：`tests/contract/phase-quality-handoff.test.mjs`
- **动作**：添加只针对 blueprint 依赖、build-plan 步骤顺序、Talk/Grill 不下沉、route/具体测试边界的失败合同；本 Phase 按行为工作流合同选择 `backend-testing` 作为唯一具体测试技能；不改生产实现。
- **验证**：role=RED; paired_task=T003; gate_cmd=`npx vitest run tests/contract/phase-quality-handoff.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`; expected_exit=`非零`; oracle=`ORACLE-PHASE-ROUTE`：目标断言因当前合同缺失而失败，不得因环境失败。
- **证据**：evidence_path=`quality/tests/T002-phase-route-red.json`; record=`失败断言、exit、输出、concrete_skill=backend-testing`。
- **Trace**：D-Phase-quality → FR-5/FR-9 → AC-6/AC-10/AC-12
- **STOP**：RED 因环境/命令损坏失败，或需要永久 blueprint ledger、receipt、gate、执行器时停止。
- **状态**：`completed`
- **执行事实**：在临时 detached worktree `6efd67593ef1e191a4ab929a75402905bc6b49ce` 上加入本 Phase 测试合同后运行同一命令，真实 RED exit=1，3 个目标断言失败，未发生 setup/命令错误；临时 worktree 已移除。该事实证明旧树缺少 blueprint、advisory 边界和四材料约束，不伪造为主 worktree 历史日志。

## T003 — GREEN：Phase blueprint 与 route 合同

- **目标**：让 build-plan 先设计 blueprint，再 route；build-code 消费设计并直接选择一个适用具体测试技能；不执行 RED/GREEN，不调用 Grill。
- **依赖**：T002
- **精确文件**：`workflows/build-plan/SKILL.md`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-plan/steps.json`、`skills/testing-system-blueprint/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/build-code/skill-deps.yaml`、`workflows/build-code/steps.json`、`skills/spec-tasks/SKILL.md`、`skills/spec-tasks/templates/tasks-template.md`、`tests/contract/phase-quality-handoff.test.mjs`
- **动作**：实现 T002 合同；把 blueprint 作为 build-plan advisory 输入并折叠到四材料；build-code 保持实时 route、唯一具体测试技能 `backend-testing`（其他行为 Phase 仍按实际边界在 `backend-testing`、`frontend-testing`、`fullstack-slice-testing` 中单选）、文档 Phase N/A 例外；不新增 ledger/receipt/gate。
- **验证**：role=GREEN; paired_task=T002; gate_cmd=`npx vitest run tests/contract/phase-quality-handoff.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`; expected_exit=`0`; oracle=`ORACLE-PHASE-ROUTE`：同一命令通过且保留 negative assertions。
- **证据**：evidence_path=`quality/tests/T003-phase-route-green.json`; record=`实际文件、GREEN exit、concrete_skill=backend-testing、skill dependency、步骤顺序、覆盖限制`。
- **Trace**：D-Phase-quality → FR-5/FR-9 → AC-6/AC-10/AC-12
- **STOP**：route 依赖旧 snapshot/receipt 或需要多选具体测试技能作为 gate 时停止并回到 plan。
- **状态**：`completed`
- **执行事实**：主 worktree GREEN 命令 exit=0，1 file / 3 tests passed；`backend-testing` 作为本 Phase 唯一具体测试技能已按实际 portable workflow-contract 边界记录，review、finding disposition 和 handoff 已写入报告；未新增 ledger/receipt/gate。

## T004 — RED：Phase review subject 绑定

- **目标**：先证明 caller 可通过路径、累计 diff、mutable task 字段或旧 snapshot 改变 Phase review subject，或提交树绑定缺失。
- **依赖**：T003
- **精确文件**：`tests/contract/phase-quality-handoff.test.mjs`
- **动作**：添加失败合同，覆盖 `phase_id`、baseline commit、implementation commit、`commit_oid^{tree}`、candidate tree、parent 和 tree mismatch；不改生产实现。
- **验证**：role=RED; paired_task=T005; gate_cmd=`npx vitest run tests/contract/phase-quality-handoff.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`; expected_exit=`非零`; oracle=`ORACLE-PHASE-TREE`：subject 漂移或绑定缺失必须失败。
- **证据**：evidence_path=`quality/reviews/T004-phase-subject-red.json`; record=`失败断言、绑定字段、exit`。
- **Trace**：D-Phase-subject → FR-10 → AC-11/AC-12
- **STOP**：需要 local review lock、managed request-id、provider Git 访问或自动 commit 时停止。
- **状态**：`completed`
- **执行事实**：在 Phase B 实现前运行同一命令，6 tests 总数中原有 3 项通过、3 项新增 subject-binding 断言失败，exit=1；失败信号分别为 committed changed files 为空、caller `phasePaths` 未被拒绝、commit tree mismatch 未触发失效。无 setup/命令错误，RED 事实未被覆盖。

## T005 — GREEN：Phase review subject 与实现提交事实

- **目标**：review 只审 host 从 `phase_id` 和真实 changed files 派生的候选树；若有独立授权的实现提交，记录 commit OID、直接 parent 和 `commit_oid^{tree}`；树变化后旧 review 失效；无提交如实记录 unavailable。
- **依赖**：T004
- **精确文件**：`skills/wh-review/SKILL.md`、`skills/wh-review/contracts/build-code.md`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/review-source.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`runtime/review/schemas/attempt.schema.json`、`runtime/review/schemas/result.schema.json`、`runtime/review/schemas/stage-materials.schema.json`、`runtime/review/stage-materials.json`、`workflows/build-code/diff-scanner.mjs`、`tests/contract/phase-quality-handoff.test.mjs`
- **动作**：实现 T004 合同；caller 只传 `phase_id`；host 派生 subject；提交只包含 Phase 实现/必要测试且需独立授权；review 记录 frozen tree/commit tree，不提供 provider Git 或本地锁。
- **验证**：role=GREEN; paired_task=T004; gate_cmd=`npx vitest run tests/contract/phase-quality-handoff.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`; expected_exit=`0`; oracle=`ORACLE-PHASE-TREE`：commit tree 相等通过，树变化/无提交保持 unavailable/incomplete。
- **证据**：evidence_path=`quality/reviews/T005-phase-subject-green.json`; record=`phase_id、baseline、changed files、candidate tree、commit_oid、parent、commit tree、review result/unavailable`。
- **Trace**：D-Phase-subject → FR-10 → AC-11/AC-12
- **STOP**：发现 review 仍由 caller 路径/累计 diff/旧 snapshot 选择，或需要新 control plane 时停止。
- **状态**：`in_progress`
- **执行事实**：已实现 host-derived Phase subject：`review-runner` 不再读取 `tasks.md.execution_file_paths`，`review-source` 从 Phase 直接 parent/candidate tree 派生 changed files，并记录 commit/parent/tree；无提交记录 `commit_oid=null`，树不一致由 `verifyFinalSubject` 识别。Phase 合同 GREEN 命令 exit=0，1 file / 7 tests passed；review-runner、schema、integration subject、review-layering 聚焦回归共 36 tests passed。待 Phase B 独立异源 review 后收尾。

## T006 — RED：receipt、snapshot、历史 completion non-gate

- **目标**：先证明缺 receipt/snapshot/review/doctor/comment/history 时仍错误地冻结同 task 或把质量事实当工作许可证。
- **依赖**：T005
- **精确文件**：`tests/contract/four-material-non-gate-contract.test.mjs`、`tests/official-component-receipts.test.mjs`
- **动作**：补失败合同；只增加目标行为断言，不删除能证明 immutable/provenance/错误写入边界的测试。
- **验证**：role=RED; paired_task=T007; gate_cmd=`npx vitest run tests/contract/four-material-non-gate-contract.test.mjs tests/official-component-receipts.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`; expected_exit=`非零`; oracle=`ORACLE-NON-GATE`：目标断言因旧工作资格依赖而失败。
- **证据**：evidence_path=`quality/tests/T006-non-gate-red.json`; record=`失败断言、旧依赖、exit`。
- **Trace**：D-four-materials → FR-2/FR-3/FR-4 → AC-2/AC-3/AC-4/AC-5/AC-12
- **STOP**：出现第五份材料、new writer、successor/recovery/rebind 或把缺质量改写为 PASS 时停止。
- **状态**：`pending`
- **执行事实**：N/A — not started

## T007 — GREEN：receipt、snapshot、历史 completion non-gate

- **目标**：删除 receipt/snapshot/历史 completion 对工作资格和执行 shortcut 的依赖，保留质量事实、路径认证、幂等和 fail-loud 写入；同 task 修复继续。
- **依赖**：T006
- **精确文件**：`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-content-contracts.mjs`、`runtime/task/task-handle.mjs`、`runtime/task/task-kernel-implementation.mjs`、`tools/cli/stage-runtime.mjs`、`runtime/evidence/canonical-receipt-writer.mjs`、`tests/contract/four-material-non-gate-contract.test.mjs`、`tests/official-component-receipts.test.mjs`
- **动作**：实现 T006 合同；停止把 receipt/snapshot 当继续 shortcut，但保留现有事实读取、immutable/provenance 和错误边界；更新测试反映“质量缺失不等于完成”。
- **验证**：role=GREEN; paired_task=T006; gate_cmd=`npx vitest run tests/contract/four-material-non-gate-contract.test.mjs tests/official-component-receipts.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`; expected_exit=`0`; oracle=`ORACLE-NON-GATE`：同 task 可继续，完成事实仍 incomplete/unknown/unavailable。
- **证据**：evidence_path=`quality/tests/T007-non-gate-green.json`; record=`实际文件、测试 exit、continuation、completion predicates、质量事实`。
- **Trace**：D-four-materials → FR-2/FR-3/FR-4 → AC-2/AC-3/AC-4/AC-5/AC-12
- **STOP**：若只能靠新增 writer/bridge/ledger 通过测试，停止并回到设计。
- **状态**：`pending`
- **执行事实**：N/A — not started

## T008 — RED：控制面删除闭包

- **目标**：先证明仍存在没有真实 consumer 的 bridge、native lock、phase gate、lineage、second executor 或 public route。
- **依赖**：T007
- **精确文件**：`tests/contract/legacy-zero.test.mjs`、`tests/contract/review-layering.test.mjs`、`tests/contract/stage-skill-invocation-contract.test.mjs`、`tests/contract/repository-inventory.test.mjs`
- **动作**：用反向引用和当前 manifest/catalog 合同锁定删除范围，不先删除生产文件。
- **验证**：role=RED; paired_task=T009; gate_cmd=`npx vitest run tests/contract/legacy-zero.test.mjs tests/contract/review-layering.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs tests/contract/repository-inventory.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`; expected_exit=`非零`; oracle=`ORACLE-CLOSURE`：残留控制面断言失败。
- **证据**：evidence_path=`quality/reviews/T008-closure-red.json`; record=`反向引用、consumer、残留对象`。
- **Trace**：D-no-control-plane → FR-6/FR-7/FR-8 → AC-1/AC-7/AC-9/AC-12
- **STOP**：发现真实 consumer、需兼容 bridge 或影响历史 report bytes 时停止对应删除。
- **状态**：`pending`
- **执行事实**：N/A — not started

## T009 — GREEN：控制面删除闭包与历史只读

- **目标**：只在 T008 的 consumer 结论支持时删除完整 reader/writer/schema/fixture/manifest/route 闭包，保留历史只读事实和 provider provenance。
- **依赖**：T008
- **精确文件**：`core/runtime-mode.mjs`、`core/task-close.mjs`、`runtime/review/review-output.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/review/schemas/attempt.schema.json`、`runtime/review/schemas/result.schema.json`、`runtime/review/schemas/stage-materials.schema.json`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`tools/cli/stage-runtime.mjs`、`tests/contract/legacy-zero.test.mjs`、`tests/contract/review-layering.test.mjs`、`tests/contract/stage-skill-invocation-contract.test.mjs`、`tests/contract/repository-inventory.test.mjs`
- **动作**：按 T008 反向引用逐项删除或降为只读；不引入兼容 bridge、successor、recovery、rebind、第二执行器或 public route。
- **验证**：role=GREEN; paired_task=T008; gate_cmd=`npx vitest run tests/contract/legacy-zero.test.mjs tests/contract/review-layering.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs tests/contract/repository-inventory.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`; expected_exit=`0`; oracle=`ORACLE-CLOSURE`：无残留控制面，历史只读和 provenance 断言保留。
- **证据**：evidence_path=`quality/reviews/T009-closure-green.json`; record=`删除闭包、reader/writer/schema/fixture/manifest/public route、测试 exit`。
- **Trace**：D-no-control-plane → FR-6/FR-7/FR-8 → AC-1/AC-7/AC-9/AC-12
- **STOP**：任何删除导致历史 facts/report 不可读或需要新控制面补偿时停止。
- **状态**：`pending`
- **执行事实**：N/A — not started

## T010 — 当前索引、bundle 与结构事实

- **目标**：代码稳定后同步当前步骤索引和 bundle/catalog，生成 27 个事故提交的 SHA/consumer/处置/oracle 事实，不覆盖冻结 architecture reports。
- **依赖**：T009
- **精确文件**：`docs/stage-atomic-step-inventory.md`、`skills/catalog.yaml`、`skills/wh-review/skill-bundle.json`、`skills/testing-system-blueprint/skill-bundle.json`、`tests/contract/repository-inventory.test.mjs`
- **动作**：运行既有 architecture diagnostics；只更新既有 owner 维护的当前索引/bundle；确认历史 reports bytes、main、Multica pre/post 不变。
- **验证**：role=N/A（结构/索引事实）；gate_cmd=`npm run check && npm run compare:public-behavior && npm run probe:public-behavior`; expected_exit=`0`; oracle=`ORACLE-STRUCTURE`。
- **证据**：evidence_path=`quality/reviews/reports/T010-structure.md`; record=`命令 exit、inventory、bundle hash、历史 bytes、隔离对照`。
- **Trace**：D-history-is-immutable → FR-7/FR-8 → AC-8/AC-9
- **STOP**：诊断需要新增 runtime writer、public command 或覆盖旧报告时停止。
- **状态**：`pending`
- **执行事实**：N/A — not started

## T011 — 最终测试、异源审查与验收

- **目标**：在同一冻结快照上完成全量测试、verify-code、Phase/最终异源 review、逐 AC 和宪法验收，给出真实完成边界。
- **依赖**：T010
- **精确文件**：`quality/reviews/reports/recovery-v2-final-validation-r4-20260810.md`、`specs/workflowhub-multica-recovery-v2/decision-log.md`、`specs/workflowhub-multica-recovery-v2/tasks.md`
- **动作**：跑受影响测试和 `npm test`；对每个代码 Phase 冻结树并调用 wh-review；最终调用 verify-code/独立 review；逐项记录 AC、21 条宪法、四材料、main/Multica 隔离、provider unavailable 等事实。若需 implementation commit，先取得独立 commit authorization，记录 OID/parent/tree；不自动 push/merge。
- **验证**：role=N/A（最终聚合验收）；gate_cmd=`npm test && npm run check && git diff --check`; expected_exit=`0`; oracle=`ORACLE-FINAL`：命令只是基础信号，必须另有逐 AC、review、verify、宪法和隔离证据；provider unavailable 不冒充 PASS。
- **证据**：evidence_path=`quality/reviews/reports/T011-final-acceptance.md`; record=`测试统计、review 原文/packet hash、AC 逐项、constitution checklist、隔离证据、commit tree`。
- **Trace**：D-final-acceptance → FR-1..FR-10 → AC-1..AC-12
- **STOP**：发现新 control plane、四材料冲突、main/Multica 变化、review subject 漂移或需猜测通过结论时停止收尾。
- **状态**：`pending`
- **执行事实**：N/A — not started
