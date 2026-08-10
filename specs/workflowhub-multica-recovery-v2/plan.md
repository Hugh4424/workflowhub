# 实现计划：WorkflowHub Multica 恢复 v2

- **Input**：`decision-log.md#2026-08-10 新一轮实施决定`、`spec.md#FR-9/FR-10`、`spec.md#AC-10/AC-11/AC-12`
- **Template version**：`plan-task.v3`

## 1. 实现方案

- **目标**：在不改 Multica、不新增 runtime 控制面、不改变四材料边界的前提下，让有代码变更的 Phase 获得可重复的测试设计、真实测试、实现提交和异源 review；同时保证 receipt、snapshot、Runner、TaskHandle、bridge、doctor、comment、质量 PASS 缺失只形成事实，不冻结同 task。
- **之前**：`testing-system-blueprint` 只作为未来设计技能；build-code 只在边界变化时 route；Phase review 的 subject 仍可能受旧 phase map、累计 diff、caller 路径或 mutable task 字段影响；receipt/旧 snapshot/历史任务完成状态仍有路径进入继续或 completion 判断；四份当前材料内部还残留过期的 T6 状态与旧流程描述。
- **之后**：build-plan 设计一次与行为 Phase 对应的 blueprint、风险、oracle 和测试路线并折叠进 tasks；build-code 每个行为 Phase 按真实改动实时 route，选一个具体测试技能执行 RED/GREEN；文档 Phase 明确不伪造测试。经单独授权后提交该 Phase 的实现；wh-review 由 host 从 phase_id 和真实树派生唯一 subject，审查提交树或冻结候选树；finding 只要求同 task 修复和重新冻结，不创建 successor/recovery/rebind/continuation。最终 verify 再做一次整体审查和全量验收。
- **方案**：先修正四材料，再以测试先行的五个实现 Phase 串行推进：A 测试设计与任务卡契约；B Phase subject/提交绑定；C receipt/snapshot/历史 completion non-gate；D 清理剩余 bridge、lock、phase lineage/gate 与生产反向引用；E 重建当前诊断事实并完成最终验收。每个行为代码 Phase 都拆成独立 RED 卡→GREEN 卡，执行最小实现→真实 diff/AC 校验→独立 review→finding 处置；材料/索引卡使用 N/A 测试但仍有真实命令和 oracle。只保留真实审查、测试、review provenance、失败事实和既有安全边界。
- **不做**：不把 Grill 放回 build-plan；不创建 receipt replacement、第二 ledger、review lock、managed request-id、snapshot lineage、successor/recovery/rebind；不删除 Task-local Phase review；不强制所有 Phase 产生 commit；不把 review/test/blueprint/人工确认升级为工作许可证；不改 Multica 源码、provider/model/API Key/daemon、main、origin 或已发布历史 report。

## 2. 边界

### NEW

- `tests/contract/phase-quality-handoff.test.mjs`：Phase blueprint/route/concrete-test/commit-tree/handoff 的最小合同。

### MODIFY

- `specs/workflowhub-multica-recovery-v2/decision-log.md`、`specs/workflowhub-multica-recovery-v2/spec.md`、`specs/workflowhub-multica-recovery-v2/plan.md`、`specs/workflowhub-multica-recovery-v2/tasks.md`：当前四材料及执行事实。
- `workflows/build-plan/SKILL.md`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-plan/steps.json`：加入 blueprint 设计边界，移除 Grill/receipt/handoff gate 语义，保持 build-plan 只设计不执行 RED/GREEN。
- `skills/testing-system-blueprint/SKILL.md`：改为 build-plan advisory 设计输入，禁止独立 ledger、gate、receipt 或执行器。
- `workflows/build-code/SKILL.md`、`workflows/build-code/skill-deps.yaml`、`workflows/build-code/steps.json`：每个行为 Phase 实时 route，选择一个具体测试技能，保留同 task repair、phase review 和最终 review。
- `skills/spec-tasks/SKILL.md`、`skills/spec-tasks/templates/tasks-template.md`：任务卡记录 blueprint、route、oracle、证据、commit/review 事实，不增加宿主字段或第二 ledger。
- `runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-content-contracts.mjs`、`runtime/task/task-handle.mjs`、`runtime/task/task-kernel-implementation.mjs`、`tools/cli/stage-runtime.mjs`：仅移除 caller receipt/snapshot/历史 completion 的工作资格依赖，保留事实读取、路径认证、幂等和错误显露。
- `runtime/evidence/canonical-receipt-writer.mjs`：停止把 receipt/snapshot 当执行 shortcut；既有事实仍只读保留，vNext 写入只进既有 `quality/`。
- `skills/wh-review/SKILL.md`、`skills/wh-review/contracts/build-code.md`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/review-source.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`runtime/review/schemas/attempt.schema.json`、`runtime/review/schemas/result.schema.json`、`runtime/review/schemas/stage-materials.schema.json`、`runtime/review/stage-materials.json`：由 phase_id 派生真实 subject，绑定候选树/提交树，去除本地 lock、caller path 和 phase-gate 语义。
- `workflows/build-code/diff-scanner.mjs`、`tests/contract/phase-quality-handoff.test.mjs`、`tests/contract/four-material-non-gate-contract.test.mjs`、`tests/official-component-receipts.test.mjs`：补树绑定、无 commit、变更后 review 失效和 non-gate 事实测试。
- `docs/stage-atomic-step-inventory.md`、`skills/catalog.yaml`、`skills/wh-review/skill-bundle.json`、`skills/testing-system-blueprint/skill-bundle.json`：仅在对应步骤/包内容稳定后由既有 owner 同步；不刷新冻结 architecture reports。

### DO NOT TOUCH

- `/Users/Hugh/Hugh/Project/workflowhub`（main）和 `origin/main`。
- Multica 源码、项目资源、issue 评论、认证状态、provider/model/API Key/daemon 配置。
- `docs/architecture/` 已发布 reports、历史 review/provenance、`b61e261ba385cf29e9496f397403bf315cc06a22` 对照版本。
- `/Users/Hugh/Downloads/multica-issues-monitoring.md` 和既有恢复 incident 记录。

- **接口边界**：不新增 public command；仅收窄内部 stage/task/review 的输入校验，使 caller 不再能指定 review subject 或以 receipt 申请继续。`phase_id` 保留为私有 dispatch hint，host 负责派生事实。
- **兼容边界**：旧 reports/evidence 可读且 immutable；旧 public 行为不因缺质量事实而假 PASS；Multica pre/post 只能读对照，不作为 WorkflowHub runtime 输入。

## 3. 依赖

- `T001` 四材料冻结 → `T002` Phase 测试 RED → `T003` Phase 测试 GREEN：没有唯一当前 spec/plan/tasks 不进入代码实现。
- `T003` → `T004` review subject RED → `T005` review subject GREEN：先确定 blueprint/route/oracle，再固定真实 review subject。
- `T005` → `T006` non-gate RED → `T007` non-gate GREEN：先固定 subject，避免把质量事实误删成审查能力。
- `T007` → `T008` 控制面闭包 RED → `T009` 控制面闭包 GREEN：只有反向引用为零才删除 reader/writer/schema/fixture/manifest/route。
- `T009` → `T010` inventory/bundle/diagnostic：代码稳定后才刷新当前索引和事实，不覆盖历史 report。
- `T010` → `T011` 最终 verify/review/acceptance：最终快照必须与四材料、代码和测试一致。
- **外部依赖**：既有 3rd-review broker 的 `opencode/v4flash` 可用性；不可用时记录 `unavailable`，不新增 fallback 或本地 lock，不阻塞同 task 修复。
- **可并行项**：本轮不并行修改共享生产文件；独立审查可在当前 Phase 测试完成后并行只读。T002/T003、T004/T005、T006/T007、T008/T009 各自成 RED/GREEN 串行对。

## 4. 测试计划

build-plan 只设计 RED/GREEN，不执行命令。每组 RED/GREEN 使用同一 `gate_cmd` 和 oracle identity；真正执行在 build-code 的 Phase 内。

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
| --- | --- | --- | --- | --- |
| AC-6/AC-10/AC-12 route | T002 | RED | `npx vitest run tests/contract/phase-quality-handoff.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / 非零 | `ORACLE-PHASE-ROUTE`; blueprint/route 缺失或 build-plan 执行测试的失败信号；concrete_skill=`backend-testing` |
| AC-6/AC-10/AC-12 route | T003 | GREEN | 同上 / 0 | `ORACLE-PHASE-ROUTE`; blueprint、一个 concrete skill、同一命令、evidence；concrete_skill=`backend-testing` |
| AC-11 subject/tree | T004 | RED | `npx vitest run tests/contract/phase-quality-handoff.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / 非零 | `ORACLE-PHASE-TREE`; caller subject 漂移或 commit/tree 绑定缺失 |
| AC-11 subject/tree | T005 | GREEN | 同上 / 0 | `ORACLE-PHASE-TREE`; commit tree 相等、树变化后旧 review unavailable |
| AC-2/AC-3/AC-4/AC-5/AC-12 non-gate | T006 | RED | `npx vitest run tests/contract/four-material-non-gate-contract.test.mjs tests/official-component-receipts.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / 非零 | `ORACLE-NON-GATE`; 缺质量事实冻结同 task 的失败信号 |
| AC-2/AC-3/AC-4/AC-5/AC-12 non-gate | T007 | GREEN | 同上 / 0 | `ORACLE-NON-GATE`; 同 task 可继续，完成事实不假 PASS |
| AC-1/AC-7/AC-12 closure | T008 | RED | `npx vitest run tests/contract/legacy-zero.test.mjs tests/contract/review-layering.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs tests/contract/repository-inventory.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / 非零 | `ORACLE-CLOSURE`; 残留控制面失败信号 |
| AC-1/AC-7/AC-12 closure | T009 | GREEN | 同上 / 0 | `ORACLE-CLOSURE`; 无 bridge/lock/second executor，provider provenance 保留 |
| AC-8/AC-9 inventory/isolation | T010 | N/A | `npm run check && npm run compare:public-behavior && npm run probe:public-behavior` / 0 | `ORACLE-STRUCTURE`; 27 提交闭包、历史 bytes、Multica pre/post unchanged |
| 全部 AC | T011 | N/A | `npm test` / 0 | `ORACLE-FINAL`; 基础命令之外还需逐 AC、verify、独立 review、宪法和隔离证据 |

## 5. 风险

- **风险**：删掉旧 reader 时仍有真实历史读取者。**预防/停止**：先 `rg` 反向引用；发现 consumer 只保留只读兼容路径并停止该删除。
- **风险**：Phase review 仍被 mutable `tasks.md` 或累计 diff 劫持。**预防/停止**：caller 只给 phase_id；host 派生基线、实际 changed files、candidate tree；不一致返回 unavailable/incomplete。
- **风险**：为了“测试完整”新增 permanent blueprint/receipt/lock。**预防/停止**：blueprint 只折叠入 tasks/facts；不新增公共命令、ledger、writer 或 gate。
- **风险**：提交或 review 后又修改树但继续引用旧结果。**预防/停止**：提交前冻结树；树 hash/commit tree 不等则旧 review 失效，重新 review。
- **风险**：测试工具或 provider 暂时不可用被误判为架构卡死。**预防/停止**：记录 unavailable，继续同 task 内容修复；最终只能诚实标注 incomplete。
- **Affected IDs**：`R0-R4`、`FR-1..FR-10`、`AC-1..AC-12`、`T001-T011`。

## 6. 回滚

- 每个 Phase 只回滚本 Phase 的文件边界；不 reset main、不删除用户未提交文件、不回写历史 reports。
- 回滚后执行对应 Phase 的 RED/GREEN gate、`npm run check` 和 `git diff --check`；若只回滚文档，重新检查四材料 mapping，不创建 recovery task。

## 7. 任务映射

| Source / decision | FR | AC | Task | Depends on | Exact files | Gate / oracle |
| --- | --- | --- | --- | --- | --- | --- |
| D-material-freeze | FR-1..FR-10 | AC-1..AC-12 | T001 | none | `specs/workflowhub-multica-recovery-v2/decision-log.md`, `specs/workflowhub-multica-recovery-v2/spec.md`, `specs/workflowhub-multica-recovery-v2/plan.md`, `specs/workflowhub-multica-recovery-v2/tasks.md` | `ORACLE-MATERIALS` |
| D-Phase-quality | FR-5/FR-9 | AC-6/AC-10/AC-12 | T002/T003 | T001 | `tests/contract/phase-quality-handoff.test.mjs`, `workflows/build-plan/SKILL.md`, `workflows/build-plan/skill-deps.yaml`, `workflows/build-plan/steps.json`, `skills/testing-system-blueprint/SKILL.md`, `workflows/build-code/SKILL.md`, `workflows/build-code/skill-deps.yaml`, `workflows/build-code/steps.json`, `skills/spec-tasks/SKILL.md`, `skills/spec-tasks/templates/tasks-template.md` | `ORACLE-PHASE-ROUTE` |
| D-Phase-subject | FR-10 | AC-11/AC-12 | T004/T005 | T003 | `tests/contract/phase-quality-handoff.test.mjs`, `skills/wh-review/SKILL.md`, `skills/wh-review/contracts/build-code.md`, `skills/wh-review/scripts/review-runner.mjs`, `skills/wh-review/scripts/review-source.mjs`, `skills/wh-review/scripts/review-materials.mjs`, `runtime/review/schemas/attempt.schema.json`, `runtime/review/schemas/result.schema.json`, `runtime/review/schemas/stage-materials.schema.json`, `runtime/review/stage-materials.json`, `workflows/build-code/diff-scanner.mjs` | `ORACLE-PHASE-TREE` |
| D-four-materials | FR-1..FR-4 | AC-2..AC-5/AC-12 | T006/T007 | T005 | `tests/contract/four-material-non-gate-contract.test.mjs`, `tests/official-component-receipts.test.mjs`, `runtime/stage/stage-handlers.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/stage/stage-content-contracts.mjs`, `runtime/task/task-handle.mjs`, `runtime/task/task-kernel-implementation.mjs`, `tools/cli/stage-runtime.mjs`, `runtime/evidence/canonical-receipt-writer.mjs` | `ORACLE-NON-GATE` |
| D-no-control-plane | FR-6..FR-8 | AC-1/AC-7/AC-9/AC-12 | T008/T009 | T007 | `tests/contract/legacy-zero.test.mjs`, `tests/contract/review-layering.test.mjs`, `tests/contract/stage-skill-invocation-contract.test.mjs`, `tests/contract/repository-inventory.test.mjs`, `core/runtime-mode.mjs`, `core/task-close.mjs`, `runtime/review/review-output.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/stage/stage-handlers.mjs`, `runtime/review/schemas/attempt.schema.json`, `runtime/review/schemas/result.schema.json`, `runtime/review/schemas/stage-materials.schema.json`, `skills/wh-review/scripts/review-runner.mjs`, `skills/wh-review/scripts/review-materials.mjs`, `tools/cli/stage-runtime.mjs` | `ORACLE-CLOSURE` |
| D-history-is-immutable | FR-7/FR-8 | AC-8/AC-9 | T010 | T009 | `docs/stage-atomic-step-inventory.md`, `skills/catalog.yaml`, `skills/wh-review/skill-bundle.json`, `skills/testing-system-blueprint/skill-bundle.json`, `tests/contract/repository-inventory.test.mjs` | `ORACLE-STRUCTURE` |
| D-final-acceptance | FR-1..FR-10 | AC-1..AC-12 | T011 | T010 | `quality/reviews/reports/recovery-v2-final-validation-r4-20260810.md`, `specs/workflowhub-multica-recovery-v2/decision-log.md`, `specs/workflowhub-multica-recovery-v2/tasks.md` | `ORACLE-FINAL` |

发布前确认：每个 source、FR、AC、Task 都能正向和反向定位；每个 Task 的依赖存在且无环；每个文件都在边界内；Phase review 与最终 review 是不同 subject；所有质量事实都不成为工作许可证。
