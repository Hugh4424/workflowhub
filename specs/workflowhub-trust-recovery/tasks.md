# WorkflowHub 可信度恢复任务清单

- **Template version**: `plan-task.v3`

## Phase P1 — Bundle/catalog skill closure

### Goal

让现有 bundle generator、catalog、resolver 和 closure checker 对同一当前 skill closure 产出一致清单/哈希；保留缺失和漂移的可诊断失败。

### Files

- **MODIFY**：`skills/wh-review/skill-bundle.json`
- **MODIFY**：`skills/mini-task/skill-bundle.json`
- **MODIFY**：`skills/catalog.yaml`
- **MODIFY**：`runtime/evidence/check-skill-closure.mjs`
- **MODIFY**：`runtime/distribution/skill-bundle-release.mjs`
- **MODIFY**：`runtime/adapters/local-skill-resolver.mjs`
- **MODIFY**：`core/__tests__/check-skill-closure.test.mjs`
- **MODIFY**：`tests/integration/distribution-closure.test.mjs`

### Tasks

- `T001 RED`：先锁定当前 bundle/catalog/release drift、跳过 closure 和 empty manifest/dependency closure/package/resolver result 的真实失败断言。
- `T002 GREEN`：复用现有生成/校验链，闭合正常 bundle 与 resolver，并保留漂移和空闭包负例。

### Verify

- 同一 gate：`npx vitest run core/__tests__/check-skill-closure.test.mjs tests/integration/distribution-closure.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`。
- RED 预期非 0，GREEN 预期 0；oracle 为 `ORACLE-WH-CLOSURE`；empty manifest/dependency closure/package/resolver result 需具体失败；最终闭包命令另在 T007 执行。

### Knowledge

交给 P2：bundle 文件清单、catalog/local hash 关系、发布是否强制校验、resolver/五 stage consumer 的真实入口及未闭合事实。

### STOP

需要新 catalog、第二 bundle generator、永久 hash updater、第五 stage，或 RED 只是 setup/环境故障时停止并回 owning material。

### Done

任务只报告 closure contract 的真实 RED/GREEN；不报告整个 WorkflowHub、PaperBuilder 或 release 已完成。

### Risks and rollback

- **Risk**：只改 manifest hash，未证明 generator/release/checker 使用同一字节。
- **Prevention**：同一 gate 覆盖 bundle bytes、catalog hash、resolver 和发布禁止路径。
- **Rollback / recovery**：只回滚 P1 文件，保留 mismatch 事实，不新增 registry 或 replacement。

### T001 — RED：锁定 bundle/catalog drift

- **ID**：T001
- **Phase**：Phase P1 — Bundle/catalog skill closure
- **goal**：用现有合同测试锁定 bundle 文件哈希、catalog/local hash、stage skill invocation 和发布闭包漂移。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-trust-recovery/spec.md","hash":"82558e58b65614a37e7721cc59fdd2ded5d51594b419797571d6a8b9dbfa6e98","id":"SPEC-WH-TRUST"},{"artifact_kind":"plan","ref":"specs/workflowhub-trust-recovery/plan.md","hash":"b55cafbc77bc0abc2f15dfde75d2c1defd3f246367367d87b2dbb58b83fb8ca1","id":"PLAN-WH-TRUST"}]`
- **输入**：当前 `wh-review`/`mini-task` bundle、catalog、closure checker、发布 fixture、五 stage skill invocation 事实。
- **依赖**：无（P1 first RED）。
- **并行**：否 — RED 必须先产生目标失败。
- **FR**：`FR-WH-003`。
- **AC**：`AC-WH-003`。
- **动作**：只扩充既有 contract/integration assertions，覆盖正常 closure、hash mismatch、静态依赖漂移、发布包含禁止内容、调用方跳过 closure、empty manifest、empty dependency closure、空发布包和 resolver 空结果的负例；不先改生产实现。
- **精确文件**：`core/__tests__/check-skill-closure.test.mjs`、`tests/integration/distribution-closure.test.mjs`、`skills/wh-review/skill-bundle.json`、`skills/mini-task/skill-bundle.json`
- **boundary**：files: `core/__tests__/check-skill-closure.test.mjs`、`tests/integration/distribution-closure.test.mjs`、`skills/wh-review/skill-bundle.json`、`skills/mini-task/skill-bundle.json`; symbols/regions: existing hash/closure/empty-closure/release assertions only。
- **输出**：`quality/tests/trust-recovery-bundle-catalog-red.json`，记录目标失败、退出码、snapshot/material 限制。
- **Knowledge**：当前 `npm run check:skill-closure` 已观察到 7 个 mismatch；不把它们自动当作 repair 已完成。
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`npx vitest run core/__tests__/check-skill-closure.test.mjs tests/integration/distribution-closure.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-WH-CLOSURE` — drift、skip-closure 和空 manifest/dependency/package/resolver 目标 assertion 非 0，失败必须指向 bundle/catalog/release/consumer 语义，不接受 setup failure。
- **evidence_path**：`quality/tests/trust-recovery-bundle-catalog-red.json`
- **STOP**：测试无法区分目标 drift 与环境故障，或需要第二 catalog/generator/release path 时返回 plan。
- **recovery**：保留 RED 输出；由 bundle owner 修正最小现有入口，不手改 hash 后跳过测试。
- **task risk**：只断言 manifest 文件存在，未断言实际字节、local hash 和发布闭包。

**执行状态填写区**

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：扩充 current closure、空 release、source drift 和空 bundle 的 RED assertions；未改生产实现。
- **executed_commands**：`npx vitest run core/__tests__/check-skill-closure.test.mjs tests/integration/distribution-closure.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；RED exit `1`，17 passed / 4 failed。
- **evidence_refs**：`quality/tests/trust-recovery-bundle-catalog-red.json`。
- **covered_ac**：`AC-WH-003`（RED contract only；GREEN 由 T002 证明）。
- **review_fact**：Phase review pending until T002/P1 handoff。
- **completed_at**：2026-08-23T13:13:22Z
- **执行事实**：Phase Card — goal: lock the existing bundle/catalog/release/resolver drift with a real RED; allowed files: `core/__tests__/check-skill-closure.test.mjs`, `tests/integration/distribution-closure.test.mjs`, `skills/wh-review/skill-bundle.json`, `skills/mini-task/skill-bundle.json`; allowed symbols: existing hash/closure/empty-closure/release assertions only; covered AC: `AC-WH-003`; planned route: `feature` / `backend-testing`; actual route after changed-file review: `fullstack` because the implementation seam spans core/tests/skills/runtime/specs/quality; non-goals: no production fix, no second registry/generator/release path; STOP: distinguish target drift from setup failure before T002.

### T002 — GREEN：闭合现有 bundle/catalog 流程

- **ID**：T002
- **Phase**：Phase P1 — Bundle/catalog skill closure
- **goal**：在 T001 失败事实约束下，修正现有 bundle/catalog generator、checker、resolver 和 invocation contract，使正常 current closure 通过并保留负例。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-trust-recovery/spec.md","hash":"82558e58b65614a37e7721cc59fdd2ded5d51594b419797571d6a8b9dbfa6e98","id":"SPEC-WH-TRUST"},{"artifact_kind":"plan","ref":"specs/workflowhub-trust-recovery/plan.md","hash":"b55cafbc77bc0abc2f15dfde75d2c1defd3f246367367d87b2dbb58b83fb8ca1","id":"PLAN-WH-TRUST"}]`
- **输入**：T001 当前失败断言；现有 generator/checker/resolver/catalog 代码与 bundle manifest。
- **依赖**：T001。
- **并行**：否 — GREEN 必须消费 T001 的目标失败。
- **FR**：`FR-WH-003`。
- **AC**：`AC-WH-003`。
- **动作**：只修改既有 closure owner，使发布、catalog、local resolver 对同一 bundle bytes 复算；空 manifest/dependency closure/package/resolver result 继续具体失败；不新增 registry、hash updater 或 stage。
- **精确文件**：`skills/wh-review/skill-bundle.json`、`skills/mini-task/skill-bundle.json`、`skills/catalog.yaml`、`runtime/evidence/check-skill-closure.mjs`、`runtime/distribution/skill-bundle-release.mjs`、`runtime/adapters/local-skill-resolver.mjs`、`core/__tests__/check-skill-closure.test.mjs`、`tests/integration/distribution-closure.test.mjs`
- **boundary**：files: `skills/wh-review/skill-bundle.json`、`skills/mini-task/skill-bundle.json`、`skills/catalog.yaml`、`runtime/evidence/check-skill-closure.mjs`、`runtime/distribution/skill-bundle-release.mjs`、`runtime/adapters/local-skill-resolver.mjs`、`core/__tests__/check-skill-closure.test.mjs`、`tests/integration/distribution-closure.test.mjs`; symbols/regions: closure generation, hash validation, empty closure, local resolution and existing tests only。
- **输出**：`quality/tests/trust-recovery-bundle-catalog-green.json`，记录同一 gate exit 0、负例仍拒绝和未覆盖限制。
- **Knowledge**：发布包不等同 catalog；local hash 关系必须以真实字节复算，不把 catalog 可见性当发布证明。
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`npx vitest run core/__tests__/check-skill-closure.test.mjs tests/integration/distribution-closure.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-WH-CLOSURE` — 正常 current closure 全部通过，hash/static dependency/forbidden content/empty closure 负例仍能失败。
- **evidence_path**：`quality/tests/trust-recovery-bundle-catalog-green.json`
- **STOP**：GREEN 只能靠忽略 hash、跳过 checker、删负例或新增平行 registry 时停止。
- **recovery**：回滚本 task 变更到 T001 后；保留原 mismatch 和 RED evidence，不创建 replacement task。
- **task risk**：发布器通过但独立 `npm run check:skill-closure` 仍失败，或 catalog 与内嵌 manifest 漂移。

**执行状态填写区**

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：更新 `wh-review`/`mini-task` bundle entry hashes、catalog local hashes；release 在正式发布前强制 source closure，捕获 source hashes 并在复制后拒绝字节漂移；`checkReleaseClosure` 拒绝空 closure、非法/重复 release file path；保留 source drift、empty bundle 和 malformed entry 负例。
- **executed_commands**：T001 RED gate exit `1`（17 passed / 4 failed）；T002 GREEN gate exit `0`（22 passed）；`npm run check:skill-closure` exit `0`；正式 receipt `quality/tests/build-code-T002-final.json` exit `0`、snapshot tree `a252f13aa5d7901c9a5acd6e0c52817275057c4d`；`git diff --check` exit `0`。
- **evidence_refs**：`quality/tests/trust-recovery-bundle-catalog-red.json`；`quality/tests/trust-recovery-bundle-catalog-green.json`；`quality/tests/build-code-T002-final.json`。
- **covered_ac**：`AC-WH-003` — focused GREEN 通过：bundle/catalog hash agreement、source closure、source drift、empty release/bundle、malformed release entry 均有 oracle；未覆盖 P2 writer/bridge 和最终集成 review。
- **review_fact**：`wh-review.v2` broker available；初次有效 phase review `quality/reviews/reports/7dee3e94-79ef-48d0-ad6e-b1dd2ae0fd9b.md` 发现 source-closure fail-open，已修复；修复后的 phase review `quality/reviews/reports/4dd2554f-9d1b-4133-afc1-e72e10182e7f.md` 发现 TOCTOU，已修复；再一轮 `quality/reviews/reports/617eab8d-b761-47c4-9a90-1e024b19e226.md` 发现 malformed release entry，已修复。最后一条 finding 修复后未再调用 provider，当前 review fact 绑定修复前 snapshot；最终 aggregate phase/integration review 必须重新绑定当前 snapshot。
- **finding_dispositions**：`F-17527e2c633d` fixed；`F-af3d72b97380` fixed；`F-873e0de5f2cb` fixed by aligning task/map facts；`F-6510931a71a2` fixed by source hash snapshot/stability check；`F-56102be95ffe` fixed by release file path validation and negative test；无 accepted risk。
- **completed_at**：2026-08-23T13:49:10Z
- **执行事实**：T002 consumes T001 RED. Changed files remain within the planned P1 boundary plus the task execution fact. The actual route was reclassified from planned `feature/backend-testing` to `fullstack` by `test-routing-advisor` because the seam spans core tests, integration tests, skill manifests/catalog, runtime checker/release code, task facts, and quality evidence. Runtime behavior now fails closed on mismatched declared bundle, missing source closure, source bytes changing during release copy, empty release closure, and malformed release entries. Coverage limit: no P2 writer/bridge or later review semantics were changed; provider re-review after the final malformed-entry repair is unavailable by bounded review policy, so current phase quality remains visible as review-before-final-repair rather than provider-clean.

## Phase P2 — Single writer and narrow bridge

### Goal

让 current quality facts 只有 stage-runtime/TaskKernel 正式写入；bridge、wh-review CLI、mini-task 只传递或返回窄 outcome/result；required outcome 的 identity/顺序/时间由官方运行时再认证。

### Files

- **MODIFY**：`runtime/task/task-handle.mjs`
- **MODIFY**：`runtime/task/task-kernel-implementation.mjs`
- **MODIFY**：`runtime/evidence/quality-store.mjs`
- **MODIFY**：`runtime/evidence/canonical-receipt-writer.mjs`
- **MODIFY**：`runtime/stage/stage-runner.mjs`
- **MODIFY**：`runtime/stage/stage-agent-outcome-adapter.mjs`
- **MODIFY**：`tools/host/workflowhub-stage-agent-bridge.mjs`
- **MODIFY**：`tools/host/workflowhub-stage-outcome-stop-hook.mjs`
- **MODIFY**：`tools/cli/check-task-record-paths.mjs`
- **MODIFY**：`skills/wh-review/scripts/wh-review-cli.mjs`
- **MODIFY**：`skills/mini-task/scripts/mini-task-runner.mjs`
- **MODIFY**：`tests/integration/quality-store-concurrency.test.mjs`
- **MODIFY**：`tests/integration/journal-replacement.test.mjs`
- **MODIFY**：`tests/integration/vnext-official-stage-run.test.mjs`
- **MODIFY**：`tests/contract/stage-completion.test.mjs`

### Tasks

- `T003 RED`：锁定 direct writer、过宽 bridge、required row 降级和 current quality delta 的失败事实。
- `T004 GREEN`：收紧既有 writer/bridge/adapter/runner，使官方路径可写、非官方路径不写。

### Verify

- 同一 gate：`npx vitest run tests/integration/quality-store-concurrency.test.mjs tests/integration/journal-replacement.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/contract/stage-completion.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`。
- RED 预期非 0，GREEN 预期 0；oracle 为 `ORACLE-WH-WRITER` 与 `ORACLE-WH-BRIDGE`；证据位于 `quality/tests/trust-recovery-writer-boundary-{red,green}.json` 与 `quality/tests/trust-recovery-bridge-{red,green}.json`。

### Knowledge

交给 P3：writer allowlist、direct writer 的 read-only/fixture disposition、narrow outcome schema、required order/time/snapshot 事实，以及同会话 task-path 绑定结果。

### STOP

任一非 stage-runtime 路径仍能写 current quality，或 bridge 接受 `execution`/`receipts`/quality fields、自行发布 completion，立即停止；不加第二 writer/状态机。

### Done

只能报告 current writer/bridge contract 事实；不报告 verify-code clean、product release 或 PaperBuilder 验收完成。

### Risks and rollback

- **Risk**：迁移 direct writer 遗漏 consumer，或为兼容保留双写。
- **Prevention**：反向引用清单、current quality delta 断言、official route positive proof。
- **Rollback / recovery**：回滚 P2 文件，保留 writer boundary RED；不复制旧 writer。

### T003 — RED：锁定 writer 与 bridge 绕过

- **ID**：T003
- **Phase**：Phase P2 — Single writer and narrow bridge
- **goal**：让 direct quality writer、bridge 过宽字段、非法 required outcome 和错误 snapshot/time/order 真实失败。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-trust-recovery/spec.md","hash":"82558e58b65614a37e7721cc59fdd2ded5d51594b419797571d6a8b9dbfa6e98","id":"SPEC-WH-TRUST"},{"artifact_kind":"plan","ref":"specs/workflowhub-trust-recovery/plan.md","hash":"b55cafbc77bc0abc2f15dfde75d2c1defd3f246367367d87b2dbb58b83fb8ca1","id":"PLAN-WH-TRUST"}]`
- **输入**：现有 TaskKernel/canonical writer、quality-store、wh-review/mini-task runner、bridge/adapter/runner 和现有 integration fixtures。
- **依赖**：T002。
- **并行**：否 — P2 first RED。
- **FR**：`FR-WH-002`、`FR-WH-005`、`FR-WH-006`、`FR-WH-007`。
- **AC**：`AC-WH-002`、`AC-WH-005`、`AC-WH-006`、`AC-WH-007`。
- **动作**：扩充现有 writer/concurrency/journal/official-stage/stage-completion tests；注入 direct writer、过宽 outcome、乱序/重复/重叠/回拨时间、缺包、required downgrade、同 key 冲突重放和部分写入恢复；复现 PFACT-WH011 的 taskPath/launcher-derived taskPath 错绑，并分别尝试 clean/current、dirty、旧 snapshot/hash、材料 revision 变化发布；不先修生产实现。
- **精确文件**：`tests/integration/quality-store-concurrency.test.mjs`、`tests/integration/journal-replacement.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`、`tests/contract/stage-completion.test.mjs`、`runtime/evidence/quality-store.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/mini-task/scripts/mini-task-runner.mjs`
- **boundary**：files: `tests/integration/quality-store-concurrency.test.mjs`、`tests/integration/journal-replacement.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`、`tests/contract/stage-completion.test.mjs`、`runtime/evidence/quality-store.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/mini-task/scripts/mini-task-runner.mjs`; symbols/regions: current quality writes, writer-consumer reverse audit, outcome acceptance, clean/dirty/snapshot/material binding and required completion assertions only。
- **输出**：`quality/tests/trust-recovery-writer-boundary-red.json`、`quality/tests/trust-recovery-writer-consumers-red.json`、`quality/tests/trust-recovery-bridge-red.json`。
- **Knowledge**：静态审查已发现 stage-runtime 外的 direct writer 风险和 bridge 过宽输入风险；具体 consumer 仍以 RED 结果为准。
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`npx vitest run tests/integration/quality-store-concurrency.test.mjs tests/integration/journal-replacement.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/contract/stage-completion.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-WH-WRITER`、`ORACLE-WH-BRIDGE` — direct writer/过宽或非法 outcome/required downgrade/冲突重放/dirty 或漂移 snapshot 的目标断言非 0，不接受 setup failure；同 key 重放、部分写入和 writer consumer reverse audit 也必须可观察。
- **evidence_path**：`quality/tests/trust-recovery-writer-boundary-red.json`、`quality/tests/trust-recovery-writer-consumers-red.json`
- **STOP**：无法隔离 current quality delta、snapshot drift 或 bridge malformed input，或测试要求新状态机时返回 plan。
- **recovery**：保留目标 RED；由 stage-runtime/bridge owner 修正窄边界，不把失败转换为 unavailable。
- **task risk**：只检查返回值，不检查 quality namespace 是否实际变化、writer provenance 和历史 bytes。

**执行状态填写区**

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：只扩充 T003 RED 测试与本任务事实；未改 P2 生产实现。新增 direct current writer、build-code actionable finding、bridge 重叠时间和 public taskPath preflight 失败断言；journal fixture 改为非 WorkflowHub project name，避免把历史 fixture 当 current writer 证据。
- **executed_commands**：T003 focused RED exit `1`（quality-store/journal/stage-completion: 51 passed, 2 failed）；overlap-only RED exit `1`；正式 T003 gate exit `1`（76 passed, 4 failed, 80 tests）。
- **evidence_refs**：`quality/tests/trust-recovery-writer-boundary-red.json`；`quality/tests/trust-recovery-writer-consumers-red.json`；`quality/tests/trust-recovery-bridge-red.json`。
- **covered_ac**：`AC-WH-002`、`AC-WH-005`、`AC-WH-006`、`AC-WH-007` 的 RED 部分；direct writer、actionable finding、overlap time 已有真实失败，其他 bridge/replay/snapshot/material/order 仍待 T004。
- **review_fact**：P2 independent audit confirms stage-runtime/TaskKernel writer boundary and bridge narrow-contract gaps; no provider review for RED-only change. Public same-session test remains `PFACT-WH011` launcher-derived taskPath preflight failure.
- **completed_at**：`2026-08-23T14:15:30Z`
- **执行事实**：Phase Card — goal: lock direct writer, broad bridge, required-row downgrade, and current-quality delta failures; allowed test files plus task evidence only; covered AC: `AC-WH-002/005/006/007`; planned route: `feature/backend-testing`; actual route after changed-file review: `fullstack` because the seam spans integration/runtime contract tests and task/quality evidence; non-goals: no production fix, no second writer/state machine, no provider review claim; STOP: preserve unavailable/preflight and return to plan if current-quality delta or snapshot/material drift cannot be isolated.

### T004 — GREEN：收紧单一 writer 与窄 bridge

- **ID**：T004
- **Phase**：Phase P2 — Single writer and narrow bridge
- **goal**：让官方 stage-runtime/TaskKernel 路径在当前 snapshot 上写入，bridge/wh-review/mini-task 只传窄 outcome/result，非法 required outcome 保持真实未完成。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-trust-recovery/spec.md","hash":"82558e58b65614a37e7721cc59fdd2ded5d51594b419797571d6a8b9dbfa6e98","id":"SPEC-WH-TRUST"},{"artifact_kind":"plan","ref":"specs/workflowhub-trust-recovery/plan.md","hash":"b55cafbc77bc0abc2f15dfde75d2c1defd3f246367367d87b2dbb58b83fb8ca1","id":"PLAN-WH-TRUST"}]`
- **输入**：T003 目标失败断言；现有 writer/bridge/adapter/runner owner 和 task record path checker。
- **依赖**：T003。
- **并行**：否 — GREEN 必须消费 T003 的失败。
- **FR**：`FR-WH-002`、`FR-WH-005`、`FR-WH-006`、`FR-WH-007`。
- **AC**：`AC-WH-002`、`AC-WH-005`、`AC-WH-006`、`AC-WH-007`。
- **动作**：current namespace 的 direct writer、review CLI、mini-task 和 bridge 写入一律明确拒绝且 current quality delta 为 0；历史读取和隔离 fixture 走非 current 路径；bridge 输出严格收窄为 outcome ref/sha/status/provenance；让官方 runner 重新认证 subjects、order、time、snapshot/material；按 spec 固定非法 reason；以窄 outcome canonical bytes 计算稳定 idempotency key，同 key 同字节重放零 delta、冲突重放 `failed/BRIDGE_REPLAY_CONFLICT`，部分写入只允许同 key 原子恢复或保留 incomplete/unknown；只有 clean/current 组合可写 current fact，dirty、旧 snapshot/hash、材料 revision 变化和 taskPath 错绑均保留 diagnostic/failed/incomplete。
- **精确文件**：`runtime/task/task-handle.mjs`、`runtime/task/task-kernel-implementation.mjs`、`runtime/evidence/quality-store.mjs`、`runtime/evidence/canonical-receipt-writer.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`、`tools/host/workflowhub-stage-outcome-stop-hook.mjs`、`tools/cli/check-task-record-paths.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/mini-task/scripts/mini-task-runner.mjs`、`tests/integration/quality-store-concurrency.test.mjs`、`tests/integration/journal-replacement.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`、`tests/contract/stage-completion.test.mjs`
- **boundary**：files: `runtime/task/task-handle.mjs`、`runtime/task/task-kernel-implementation.mjs`、`runtime/evidence/quality-store.mjs`、`runtime/evidence/canonical-receipt-writer.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`、`tools/host/workflowhub-stage-outcome-stop-hook.mjs`、`tools/cli/check-task-record-paths.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/mini-task/scripts/mini-task-runner.mjs`、`tests/integration/quality-store-concurrency.test.mjs`、`tests/integration/journal-replacement.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`、`tests/contract/stage-completion.test.mjs`; symbols/regions: existing current quality writer, bridge adapter, official runner and path audit only。
- **输出**：`quality/tests/trust-recovery-writer-boundary-green.json`、`quality/tests/trust-recovery-writer-consumers-green.json`、`quality/tests/trust-recovery-bridge-green.json`。
- **Knowledge**：stage-runtime 是唯一 formal writer；bridge 只传 `schema_version/task_id/stage/attempt_id/outcome_ref/outcome_sha256/outcome_status/producer`；非法 lifecycle 按 spec 表返回确定状态；idempotency key、replay conflict、部分写入恢复、current quality delta、required row status 和 current snapshot/material 绑定是 oracle，不是工作 gate。
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`npx vitest run tests/integration/quality-store-concurrency.test.mjs tests/integration/journal-replacement.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/contract/stage-completion.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-WH-WRITER`、`ORACLE-WH-BRIDGE` — 官方路径可写；非官方路径不改变 current quality；非法/缺包/乱序/错绑 outcome 不得 completed；同 key 重放不产生第二 fact，冲突重放失败，部分写入失败不被掩盖。
- **evidence_path**：`quality/tests/trust-recovery-writer-boundary-green.json`、`quality/tests/trust-recovery-writer-consumers-green.json`
- **STOP**：GREEN 只能靠双写、删除负例、接受过宽 bridge 或新建 state machine 时停止。
- **recovery**：回滚 P2 本 phase 变更；保留 T003 RED 和任何 unavailable/incomplete 事实。
- **task risk**：官方路径能写但 stage outcome 丢失窄 provenance、同会话 task-path 错误被静默回退，或 retry/partial write 生成重复 fact。

**执行状态填写区**

- [ ] **任务完成**
- **status**：`in_progress`
- **actual_changes**：`quality-store` 的 WorkflowHub current direct writer fail-closed 且 index delta=0；adapter/bridge 只接受窄 session outcome，校验顺序、时间、snapshot/material、同 key 重放和冲突重放；stage-runtime/TaskKernel 是唯一正式 writer，review intent 在 handler/evidence 成功后才进入官方写入；wh-review 只返回 broker-provenance intent；mini-task 只消费 delivery-local intent，绝不映射 formal `code_review`/`human_confirmation`；current close 与测试 receipt 要求 exact snapshot，clean merge commit 可认证；skill release closure 逐条要求合法 sha256 并校验 shared file hash。
- **executed_commands**：正式 T004 r9 stage-runtime gate exit `0`（139 tests）；随后 task-card execution fact 写回；最终 r10 gate 复跑同一 suite 并包含 closure contract，预期并要求 exit `0`；此前 `npm run check:skill-closure` exit `0`；`node --check`（stage-runner/task-close/check-skill-closure）exit `0`；`git diff --check` exit `0`；vNext delivery-close exit `0`（26 tests）。
- **evidence_refs**：`quality/tests/build-code-T004-green-r10.json`；`quality/tests/build-code-T004-green-r9.json`；`quality/tests/build-code-T004-green-r8.json`；`quality/reviews/results/build-code-default-1f5bd177789c907ec6a5f51374b0daedd35ceed9-3d79be24-e497-44b5-a60d-53bc02206cc3.json`；`quality/reviews/reports/3d79be24-e497-44b5-a60d-53bc02206cc3.md`；`quality/reviews/reports/fb4f2136-2d15-47f1-a613-921dea530b63.md`；`quality/reviews/reports/4a00594d-0d3d-4129-95d2-855b3ab7e0ba.md`。
- **covered_ac**：`AC-WH-002`、`AC-WH-005`、`AC-WH-006`、`AC-WH-007` 的 executable GREEN 部分；direct writer、narrow bridge、invalid required outcome、time overlap、subject order、same-key replay、handler failure residual fact、mini/formal review 分层、exact snapshot、闭包 hash 和 actionable finding 均有绑定断言。
- **review_fact**：修复 `PUBLIC_RESULT_INVALID` 路径误判后，当前 broker-provenance `wh-review` 已可用：snapshot `9cca97548ab027e68017337b4ef41391369a4399`、material `83a4d6ecd7f9be7aa1a384f095a603460d43b70991636689dfb245f1c4de1064`，attempt `quality/reviews/attempts/21293d41-7aaa-48bd-b238-cf06b20f2434/attempt.json`，result `quality/reviews/results/build-code-default-9cca97548ab027e68017337b4ef41391369a4399-21293d41-7aaa-48bd-b238-cf06b20f2434.json`，report `quality/reviews/reports/21293d41-7aaa-48bd-b238-cf06b20f2434.md`；`pi/coding` 与 `codex/luna` 均 completed，`PUBLIC_RESULT_INVALID=0`。当前 review 保留 2 个 actionable major（`F-d00f8fb79d7b`、`F-e533183c4869`）和 2 个 nonblocking minor；`F-084c2a31c2d8` 为单 provider inferred、needs_corroboration，`F-30d4bb12188b` 为 invalid_evidence/not adopted。worktree 仍 dirty，且 actionable major 尚未 fixed/accepted_risk，因此 T004 继续保持 `in_progress`，不宣称 formal completion。
- **completed_at**：N/A — current worktree review is available but T004 remains incomplete because the worktree is dirty and actionable major findings remain unresolved；不以该 review 宣称 formal completion。
- **执行事实**：Phase Card — goal: close writer/bridge boundaries with one TaskKernel-backed formal publication owner; allowed P2 owner files plus planned contract tests/evidence; non-goals: no second writer, compatibility chain, new state machine, product release, or PaperBuilder work; current limit: implementation and current broker review are available, but actionable major findings remain and the worktree is dirty, so quality status remains incomplete; STOP: do not mark T004 complete or start dependent P3 RED until every actionable major is fixed or explicitly risk-accepted and a clean current snapshot is re-reviewed.

## Phase P3 — Review provenance and legacy completion

### Goal

让正式 code review 只消费 broker-provenance wh-review；让 requiredness、serious finding、freshness 和 legacy reader 在 current predicates 中保持真实语义。

### Files

- **MODIFY**：`runtime/stage/stage-handlers.mjs`
- **MODIFY**：`runtime/stage/completion-predicates.mjs`
- **MODIFY**：`runtime/evidence/freshness.mjs`
- **MODIFY**：`runtime/review/canonical-review-result.mjs`
- **MODIFY**：`tests/contract/review-layering.test.mjs`
- **MODIFY**：`tests/contract/legacy-zero.test.mjs`
- **MODIFY**：`tests/integration/history-read-only.test.mjs`
- **MODIFY**：`tests/stage-completion-facts.test.mjs`
- **MODIFY**：`tests/contract/stage-skill-invocation-contract.test.mjs`

### Tasks

- `T005 RED`：锁定 dsh/旧 review/缺 policy/empty findings/unavailable/serious finding 误满足 formal code_review/current completion 的失败事实，并锁定静态阶段声明替代真实 Talk/Grill/wh-review/确认 evidence 的负例。
- `T006 GREEN`：在既有 handler、freshness、canonical result、legacy readers 和 stage package contract owner 上强制 provenance、current binding、finding disposition、真实 handoff evidence 和 historical-only 语义。

### Verify

- 同一 gate：`npx vitest run tests/contract/review-layering.test.mjs tests/contract/legacy-zero.test.mjs tests/integration/history-read-only.test.mjs tests/stage-completion-facts.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`。
- RED 预期非 0，GREEN 预期 0；oracle 为 `ORACLE-WH-PROVENANCE`、`ORACLE-WH-LEGACY`、`ORACLE-WH-FINDING` 和 `ORACLE-WH-STAGE-HANDOFF`；证据位于 `quality/tests/trust-recovery-review-legacy-{red,green}.json` 与 `quality/tests/trust-recovery-stage-handoff-{red,green}.json`。

### Knowledge

交给 T007：formal review policy/source/model/config binding、legacy read-only 结果、serious finding disposition、仍未知的 provider/host/browser 限制。

### STOP

dsh 可生成 formal code_review、旧 policy 可刷新为 current、unavailable/serious finding 可完成 stage，或需要新 review flow时返回 plan/decision。

### Done

只能报告 review/legacy completion contract 事实；不报告真实 provider、PaperBuilder 页面或全站交付通过。

### Risks and rollback

- **Risk**：freshness 与 handler 语义不一致，或 history reader 误成为 completion reader。
- **Prevention**：同一 current provenance fixture 覆盖两条路径；legacy-zero 保留历史 bytes 不变负例。
- **Rollback / recovery**：回滚 P3 9 个文件，保留 review unavailable/legacy facts；不迁移旧记录。

### T005 — RED：锁定 review provenance 与 legacy 绕过

- **ID**：T005
- **Phase**：Phase P3 — Review provenance and legacy completion
- **goal**：让 dsh clean、缺 policy、legacy policy、provider unavailable、empty findings、旧 result 和未处置 serious finding 不能满足 formal code_review/current completion。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-trust-recovery/spec.md","hash":"82558e58b65614a37e7721cc59fdd2ded5d51594b419797571d6a8b9dbfa6e98","id":"SPEC-WH-TRUST"},{"artifact_kind":"plan","ref":"specs/workflowhub-trust-recovery/plan.md","hash":"b55cafbc77bc0abc2f15dfde75d2c1defd3f246367367d87b2dbb58b83fb8ca1","id":"PLAN-WH-TRUST"}]`
- **输入**：现有 stage handlers、completion predicates、freshness、canonical review result 和 legacy-zero/history fixtures。
- **依赖**：T004。
- **并行**：否 — P3 first RED。
- **FR**：`FR-WH-001`、`FR-WH-004`、`FR-WH-008`、`FR-WH-007`、`FR-WH-009`。
- **AC**：`AC-WH-001`、`AC-WH-004`、`AC-WH-008`、`AC-WH-007`、`AC-WH-009`。
- **动作**：扩充现有 review-layering/legacy/history/stage completion/stage package contract tests，注入 dsh-only、missing/legacy policy、wrong source/model/config、unavailable、empty findings、old ref 和 serious finding；同时注入只写静态 owner/steps 声明但缺 Talk ask/wait/reply、Grill terminal、wh-review attempt/result/provenance 或计划确认 evidence 的 handoff 负例。
- **精确文件**：`tests/contract/review-layering.test.mjs`、`tests/contract/legacy-zero.test.mjs`、`tests/integration/history-read-only.test.mjs`、`tests/stage-completion-facts.test.mjs`、`tests/contract/stage-skill-invocation-contract.test.mjs`
- **boundary**：files: `tests/contract/review-layering.test.mjs`、`tests/contract/legacy-zero.test.mjs`、`tests/integration/history-read-only.test.mjs`、`tests/stage-completion-facts.test.mjs`、`tests/contract/stage-skill-invocation-contract.test.mjs`; symbols/regions: formal code_review, current completion, historical reader, finding disposition and stage-handoff assertions only。
- **输出**：`quality/tests/trust-recovery-review-legacy-red.json`、`quality/tests/trust-recovery-stage-handoff-red.json`。
- **Knowledge**：dsh 不能提供异源 provenance；旧 evidence 只能展示；具体 current policy mismatch 由 RED 断言固定。
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`npx vitest run tests/contract/review-layering.test.mjs tests/contract/legacy-zero.test.mjs tests/integration/history-read-only.test.mjs tests/stage-completion-facts.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-WH-PROVENANCE`、`ORACLE-WH-LEGACY`、`ORACLE-WH-STAGE-HANDOFF` — formal review/current completion/静态声明替代真实 handoff 的目标断言非 0，不接受 provider/setup 故障冒充 RED。
- **evidence_path**：`quality/tests/trust-recovery-review-legacy-red.json`、`quality/tests/trust-recovery-stage-handoff-red.json`
- **STOP**：测试无法绑定 current snapshot/material/policy，或需要新增 review flow/legacy importer时回 plan。
- **recovery**：保留 RED；由既有 handler/freshness/result owner 修正，不删除旧历史字节。
- **task risk**：只按 provider name 判断异源，或只测 reviewer output 不测 completion consumer。

**执行状态填写区**

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 review provenance、dsh/legacy 分层、当前 freshness 和 serious finding 的 RED；stage handoff RED 明确记为 not_applicable，因为现有 official stage contract 已覆盖该失败边界，未伪造失败。
- **executed_commands**：RED gate 首次 exit `1`（35 passed / 2 failed）；identity/freshness RED 复核 exit `1`（37 passed / 1 failed）；证据见 `quality/tests/trust-recovery-review-legacy-red.json`；stage handoff 结构检查 exit `0`，保留 `not_applicable` 证据。
- **evidence_refs**：`quality/tests/trust-recovery-review-legacy-red.json`；`quality/tests/trust-recovery-stage-handoff-red.json`。
- **covered_ac**：`AC-WH-001`、`AC-WH-004`、`AC-WH-007`、`AC-WH-008`、`AC-WH-009` 的 RED 部分。
- **review_fact**：未产生可重新读取的正式 phase review；外部 task root 当前缺失，不能把 review 输出或 dirty snapshot 追认为正式事实。
- **completed_at**：2026-08-24T03:35:14Z
- **执行事实**：T005 RED 已执行并保留真实失败；stage handoff 不强造 RED，保持现有 contract 的绿色事实和本任务边界。

### T006 — GREEN：封闭正式 review 与旧 evidence 语义

- **ID**：T006
- **Phase**：Phase P3 — Review provenance and legacy completion
- **goal**：在 T005 失败事实约束下，使 formal code_review 只认当前 broker-provenance wh-review，legacy 只读，serious finding 必须 fixed 或 accepted risk。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-trust-recovery/spec.md","hash":"82558e58b65614a37e7721cc59fdd2ded5d51594b419797571d6a8b9dbfa6e98","id":"SPEC-WH-TRUST"},{"artifact_kind":"plan","ref":"specs/workflowhub-trust-recovery/plan.md","hash":"b55cafbc77bc0abc2f15dfde75d2c1defd3f246367367d87b2dbb58b83fb8ca1","id":"PLAN-WH-TRUST"}]`
- **输入**：T005 目标失败断言；现有 handler/freshness/canonical result/legacy reader owner。
- **依赖**：T005。
- **并行**：否 — GREEN 必须消费 T005 的失败。
- **FR**：`FR-WH-001`、`FR-WH-004`、`FR-WH-008`、`FR-WH-007`、`FR-WH-009`。
- **AC**：`AC-WH-001`、`AC-WH-004`、`AC-WH-008`、`AC-WH-007`、`AC-WH-009`。
- **动作**：在既有 owner 同时强制 `wh_review.v2` broker provenance、provider/source/config/model/policy/material/snapshot/track binding；保留 dsh diagnostic；legacy reader 仅展示；completion 读取 requiredness、unavailable/incomplete 和 finding disposition；fixed/accepted_risk 必须绑定 finding_id、review_id、当前 snapshot/material/review-track，accepted_risk 还必须有真实用户确认、owner、时间和风险范围；stage package contract 还必须要求 steps.json 对照与当前 Talk/Grill/wh-review/确认 evidence 同 task/snapshot/material，缺失保持 incomplete/unavailable。
- **精确文件**：`runtime/stage/stage-handlers.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/evidence/freshness.mjs`、`runtime/review/canonical-review-result.mjs`、`tests/contract/review-layering.test.mjs`、`tests/contract/legacy-zero.test.mjs`、`tests/integration/history-read-only.test.mjs`、`tests/stage-completion-facts.test.mjs`、`tests/contract/stage-skill-invocation-contract.test.mjs`
- **boundary**：files: `runtime/stage/stage-handlers.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/evidence/freshness.mjs`、`runtime/review/canonical-review-result.mjs`、`tests/contract/review-layering.test.mjs`、`tests/contract/legacy-zero.test.mjs`、`tests/integration/history-read-only.test.mjs`、`tests/stage-completion-facts.test.mjs`、`tests/contract/stage-skill-invocation-contract.test.mjs`; symbols/regions: formal code_review binding, freshness, completion predicates, legacy read-only, disposition and stage-handoff assertions only。
- **输出**：`quality/tests/trust-recovery-review-legacy-green.json`、`quality/tests/trust-recovery-stage-handoff-green.json`。
- **Knowledge**：formal review 的 current identity 与 dsh diagnostic 必须分开；旧 bytes 保持只读；provider unavailable 仍为 unavailable。
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`npx vitest run tests/contract/review-layering.test.mjs tests/contract/legacy-zero.test.mjs tests/integration/history-read-only.test.mjs tests/stage-completion-facts.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-WH-PROVENANCE`、`ORACLE-WH-LEGACY`、`ORACLE-WH-FINDING` — 当前 broker-provenance wh-review 才能进入 formal code_review；dsh/legacy/unavailable/未处置 serious finding 不能完成；跨 finding/review/snapshot/material 的 fixed 或无真实确认的 accepted_risk 保持 `needs_human/missing`。
- **evidence_path**：`quality/tests/trust-recovery-review-legacy-green.json`、`quality/tests/trust-recovery-stage-handoff-green.json`
- **STOP**：GREEN 只能靠把 unavailable 变空 findings、把 old ref rebind、或把 dsh 映射为 formal code_review 时停止。
- **recovery**：回滚 P3 文件；保留 T005 RED 和当前 provider/legacy unknown facts。
- **task risk**：handler 通过但 freshness 或 status projection 仍接受旧 policy，造成 consumer seam 假绿。

**执行状态填写区**

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：formal canonical review 仅接受 `wh_review.v2`、匹配的 policy hash、broker `source_id/config_id`；`dsh-code-review` 不能满足 formal verify-code；旧 review ref 保持 historical-only；review freshness 必须落在 canonical current namespace；测试 fixture 统一为合法 v2 broker provenance。
- **executed_commands**：GREEN gate exit `0`（5 files / 38 tests）；`npm run check:skill-closure` exit `0`；后续官方 stage integration 复核 exit `0`（32 tests）；`git diff --check` 和 changed `.mjs` `node --check` 均 exit `0`。
- **evidence_refs**：`quality/tests/trust-recovery-review-legacy-green.json`；`quality/tests/trust-recovery-final-current-snapshot.json`。
- **covered_ac**：`AC-WH-001`、`AC-WH-004`、`AC-WH-007`、`AC-WH-008`、`AC-WH-009` 的 executable contract 部分；真实 provider、clean committed phase fact 和产品验收仍未宣称。
- **review_fact**：未产生可重新读取的正式 phase review；外部 task root 当前缺失，不能把 broker output 的 `available` 响应当作可审计的 clean finding-free 结论。
- **completed_at**：2026-08-24T03:35:14Z
- **执行事实**：T006 GREEN 消费 T005 RED；实现保持单 writer、窄 bridge、历史只读和 truthful unavailable/incomplete 语义，没有新增 writer、状态机、stage 或 compatibility 链。

## Phase P4 — Plan aggregate and handoff

### Goal

在不修改生产实现的前提下，按当前四份材料、任务依赖、逐 AC oracle 和前述 phase 设计一次最终聚合检查，并把风险/未知交接给 build-code；P4 不是新的行为 phase。

### Files

- **NEW**（runtime evidence only）：`quality/tests/trust-recovery-final-current-snapshot.json`
- **READ ONLY**：`tests/contract/review-layering.test.mjs`
- **READ ONLY**：`tests/contract/legacy-zero.test.mjs`
- **READ ONLY**：`tests/stage-completion-facts.test.mjs`
- **READ ONLY**：`tests/contract/stage-skill-invocation-contract.test.mjs`

### Tasks

- `T007 FINAL`：只聚合当前 snapshot 的 closure、writer、bridge、provenance、legacy 和 AC 覆盖设计。

### Verify

- `npm run check:skill-closure && npx vitest run core/__tests__/check-skill-closure.test.mjs tests/integration/distribution-closure.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs tests/integration/quality-store-concurrency.test.mjs tests/integration/journal-replacement.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/contract/stage-completion.test.mjs tests/contract/review-layering.test.mjs tests/contract/legacy-zero.test.mjs tests/integration/history-read-only.test.mjs tests/stage-completion-facts.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；预期 0；oracle `ORACLE-WH-PLAN`；证据 `quality/tests/trust-recovery-final-current-snapshot.json`。

### Knowledge

build-code 只读取四份当前材料和 T001–T006 真实事实；未知 provider/host/browser/PaperBuilder 事实必须显式交接，不能猜测。

### STOP

AC 缺失、phase boundary 漂移、RED/GREEN 命令不一致、需要新 authority、或最终命令失败原因无法归因时停止并返回对应 owning material。

### Done

只完成计划级聚合设计和用户确认请求；未实施、未提交、未推送、未合并、未关闭。

### Risks and rollback

- **Risk**：把计划/结构检查当成实现完成或把历史 evidence 当 current。
- **Prevention**：T007 明确 N/A — non-behavior aggregate；最终 oracle只报告当前快照和设计覆盖。
- **Rollback / recovery**：撤回 P4 测试聚合设计，不影响 P1–P3 原始材料和历史 facts。

### T007 — FINAL：current-snapshot plan aggregate

- **ID**：T007
- **Phase**：Phase P4 — Plan aggregate and handoff
- **goal**：聚合所有当前 FR/AC、phase seam、命令/oracle、风险/回滚和未知交接；不创建新的 quality writer 或产品状态。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-trust-recovery/spec.md","hash":"82558e58b65614a37e7721cc59fdd2ded5d51594b419797571d6a8b9dbfa6e98","id":"SPEC-WH-TRUST"},{"artifact_kind":"plan","ref":"specs/workflowhub-trust-recovery/plan.md","hash":"b55cafbc77bc0abc2f15dfde75d2c1defd3f246367367d87b2dbb58b83fb8ca1","id":"PLAN-WH-TRUST"}]`
- **输入**：T001–T006 的计划卡、当前四份材料、constitution binding、兼容矩阵、AC oracle 和 STOP/rollback。
- **依赖**：T006。
- **并行**：否 — aggregate 读取所有 preceding task facts。
- **FR**：`FR-WH-001`、`FR-WH-002`、`FR-WH-003`、`FR-WH-004`、`FR-WH-005`、`FR-WH-006`、`FR-WH-007`、`FR-WH-008`、`FR-WH-009`、`FR-WH-010`。
- **AC**：`AC-WH-001`、`AC-WH-002`、`AC-WH-003`、`AC-WH-004`、`AC-WH-005`、`AC-WH-006`、`AC-WH-007`、`AC-WH-008`、`AC-WH-009`、`AC-WH-010`。
- **动作**：只检查 source→FR→AC→task→command/oracle/evidence、phase 文件边界、dependency graph、RED/GREEN 配对、constitution 21 条和 user confirmation handoff；同时执行只读的 `ORACLE-WH-STAGE-HANDOFF`/`ORACLE-WH-FINDING` 聚合检查；不执行实现、不写 P4 source files，仅由既有 runtime 生成声明的 evidence output。
- **精确文件**：runtime evidence output `quality/tests/trust-recovery-final-current-snapshot.json`；source tests are read-only inputs。
- **boundary**：files: write only the existing runtime evidence output `quality/tests/trust-recovery-final-current-snapshot.json`; read-only access to `tests/contract/review-layering.test.mjs`、`tests/contract/legacy-zero.test.mjs`、`tests/stage-completion-facts.test.mjs`、`tests/contract/stage-skill-invocation-contract.test.mjs`; symbols/regions: final current-snapshot aggregate/read-only assertions only; no P4 source writes。
- **输出**：`quality/tests/trust-recovery-final-current-snapshot.json` 和 build-plan 大白话交接；未确认前不能进入 build-code。
- **Knowledge**：四份材料是唯一工作真相；review/test/history 是事实，不是继续工作许可证；commit/push/merge/cleanup 另需授权。
- **verification_role**：N/A — non-behavior aggregate verification
- **paired_task**：N/A — non-behavior aggregate has no RED/GREEN pair
- **gate_cmd**：`npm run check:skill-closure && npx vitest run core/__tests__/check-skill-closure.test.mjs tests/integration/distribution-closure.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs tests/integration/quality-store-concurrency.test.mjs tests/integration/journal-replacement.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/contract/stage-completion.test.mjs tests/contract/review-layering.test.mjs tests/contract/legacy-zero.test.mjs tests/integration/history-read-only.test.mjs tests/stage-completion-facts.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-WH-PLAN`、`ORACLE-WH-STAGE-HANDOFF`、`ORACLE-WH-FINDING` — 当前快照上 closure、writer、bridge、provenance、legacy、真实 handoff evidence 和 finding binding 均可观察；失败保留原始原因。
- **evidence_path**：`quality/tests/trust-recovery-final-current-snapshot.json`
- **STOP**：最终命令不可执行、AC/FR/文件边界缺失、需要新 authority，或用户未确认计划时停止，不实施。
- **recovery**：回对应 owning phase/material；不新建 successor task，不把 aggregate 变成第二事实源。
- **task risk**：把计划级可执行性误写成实际实现/验证完成，或把用户计划确认扩大为不可逆授权。

**执行状态填写区**

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：只生成 current-snapshot aggregate evidence；未新增 P4 production source、writer、状态或 stage。
- **executed_commands**：final aggregate exit `0`（11 files / 151 tests）；`npm run check:skill-closure` exit `0`；`git diff --check` exit `0`；changed `.mjs` `node --check` exit `0`。
- **evidence_refs**：`quality/tests/trust-recovery-final-current-snapshot.json`。
- **covered_ac**：AC-WH-001 至 AC-WH-010 的 contract/plan aggregate coverage；这是 dirty-worktree local aggregate，不是 formal accepted phase fact。
- **review_fact**：T007 是 non-behavior aggregate；正式 build-code/verify-code wh-review 仍需在可定位 clean committed snapshot 上执行，当前不可伪造。
- **completed_at**：2026-08-24T03:35:14Z
- **执行事实**：T007 aggregate 已完成并明确记录 dirty snapshot、unpublished snapshot 和 coverage limits；后续交接到 verify-code，停在 close 之前。

## Final current-snapshot aggregate strategy

- **tier / method**：feature/fullstack contract；只读执行计划中定义的现有 closure/writer/bridge/review/legacy tests。
- **scenarios**：AC-WH-001 至 AC-WH-010 的正常/失败/状态/跨模块 seam；不启动 PaperBuilder 服务或浏览器。
- **command**：`npm run check:skill-closure && npx vitest run core/__tests__/check-skill-closure.test.mjs tests/integration/distribution-closure.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs tests/integration/quality-store-concurrency.test.mjs tests/integration/journal-replacement.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/contract/stage-completion.test.mjs tests/contract/review-layering.test.mjs tests/contract/legacy-zero.test.mjs tests/integration/history-read-only.test.mjs tests/stage-completion-facts.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected exit**：0
- **oracle**：`ORACLE-WH-PLAN`。
- **fixtures_services**：现有 fixtures、fake broker/unavailable provider；无 PaperBuilder service/browser/token；清理由 fixture owner。
- **evidence_path**：`quality/tests/trust-recovery-final-current-snapshot.json`
- **coverage limits**：不证明真实第三方 provider、浏览器视觉/a11y/performance、PaperBuilder 业务或历史 evidence 迁移。
- **STOP**：任一 AC 无 task/oracle/evidence/limit/rollback，或 final command 失败不可归因。
- **execution_contract**：用户确认计划后在 clean committed locatable snapshot 执行一次；失败回具体 task，不用全量重跑掩盖局部事实。

## Dependency Graph

```text
T001 → T002 → T003 → T004 → T005 → T006 → T007
```

- 依赖理由：P1 closure 是 P2 runtime 的输入；P2 writer/bridge 是 P3 completion/review 的输入；T007 只做聚合交接。

## Final Boundary Check

- 每个 phase 的 Goal、Files、Tasks、Verify、Knowledge、STOP、Done、Risks and rollback 完整。
- 每个任务有唯一 ID、精确文件、FR/AC、RED/GREEN/N/A role、同命令 oracle、证据路径、STOP、recovery 和 risk。
- 任务文件均属于所属 phase 的 NEW/MODIFY；没有新增生产文件。
- 所有 FR/AC 有双向追踪；旧 repo、PaperBuilder production、archive、constitution/public surface 未进入 MODIFY。
- 所有任务均 pending；没有把计划设计写成 actual execution。
