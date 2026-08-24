# WorkflowHub 可信度恢复实施计划

- **Template version**: `plan-task.v3`

## Quick Read

- **Goal**：在不扩大控制面的前提下恢复 skill closure、唯一正式 writer、窄 bridge、正式 wh-review 和旧 evidence 只读边界。
- **Current behavior**：当前 closure checker 报 7 个 bundle hash mismatch；静态审查发现 bridge/wh-review/mini-task 与现有 quality writer 的写入边界需要实证收紧；同会话自动消费有 task-path 绑定失败。
- **Target behavior**：同一生成/校验闭包可复核；只有 stage-runtime/TaskKernel 写 current quality；bridge 只传 outcome；dsh 只诊断；current completion 只消费当前 provenance；必做项缺失不能 completed。
- **Observable recovery claim**：只有 P1 closure、P2 writer/bridge、P3 provenance/legacy 三类信号都由当前 clean snapshot 的 RED/GREEN oracle 证明，才允许在后续 verify/release 语境讨论“可信度已恢复”；本计划本身和四份材料完成不构成该 claim。
- **Non-goals**：不改旧目录、不迁移 PaperBuilder WIP、不新增 stage/state machine/第二 writer/replacement chain，不实施或提交任何代码。来源：`R-002`、`R-008`、`R-009`、`R-010`。
- **Main risk**：收紧 direct writer 或 bridge 时遗漏真实 consumer，造成假绿或破坏现有正式入口。
- **Next action**：用户确认本计划后，才进入 build-code；当前只完成四份材料、review 和计划事实。

## Technical Context

### Global Constraints

- 当前正式事实必须绑定 `workflowhub-trust-recovery`、当前 task worktree、clean committed locatable snapshot、材料 revision 和本次 runtime invocation。
- `stage-runtime`/TaskKernel 是 canonical quality facts 唯一正式 writer；bridge、review CLI、mini-task 不直接写 current quality namespace。
- 只复用现有 bundle/catalog、stage-runtime、bridge、wh-review、completion/freshness 和测试入口；任何必须增加 authority 的发现都返回 make-decision。
- `dsh-code-review` 只产诊断；正式 `verify-code.code_review` 只消费带 broker provenance、当前 snapshot/material/track 绑定的 `wh-review` canonical result。
- 必做 step/skill 只能 `completed`；`not_applicable` 只适用于声明为 conditional 且有 `trigger=false`、`executed=false`、reason 的项；unavailable/unknown/incomplete 原样保留。
- 旧 `receipts/`、`reviews/`、旧 `evidence/` 以及历史 task facts 只读展示；不导入、不 rebind、不双写、不进入 vNext predicate。
- 不把 review、receipt、accepted、history、doctor、registration、green local test 当工作准入或完成证明；review finding 必须修复或绑定具体 risk acceptance。
- 当前 authoring turn 只允许把四份材料写入正式 task worktree 的 `specs/workflowhub-trust-recovery/` 与 runtime 已声明的 task quality 记录；不写生产实现，不 commit/push/merge/close/cleanup。
- 允许读取 trusted clone、正式 task worktree 和用户列出的历史输入；具体路径由 TaskHandle/Workspace 身份绑定。禁止读取/修改旧损坏 WorkflowHub 目录，禁止把其 WIP/Git 对象纳入事实。

### Modules, Interfaces, and Data Contracts

- **Closure**：现有 bundle generator → catalog/resolver → closure checker → distribution tests；输出是当前文件清单、依赖闭包和哈希事实。
- **Stage write**：当前四材料 + current snapshot → stage-runtime handler → TaskKernel → `quality/evidence/**` / quality facts；没有第二写入路径。
- **Bridge**：当前 host session → narrow outcome ref/sha/status/provenance → stage-runtime 再认证；bridge 不提供 completion 或 quality status。乱序/重复是确定 `failed`，重叠/回拨是 `failed/BRIDGE_TIME_INVALID`，缺包是 `unavailable`，错 stage/snapshot/material 是 `failed/BRIDGE_IDENTITY_MISMATCH`；bridge 前后 current quality delta 必须为 0。
- **Review**：broker attempt → provider outputs → canonical wh-review result → stage consumer；dsh 输出不进入该链。
- **Legacy read**：历史记录 → status/history 展示为 historical/stale/unavailable；不会被 current completion reader 当作输入。

## Code Anchors

- Closure 生成/校验：`runtime/distribution/skill-bundle-release.mjs`、`runtime/evidence/check-skill-closure.mjs`、`runtime/adapters/local-skill-resolver.mjs`、`skills/catalog.yaml`。
- Bundle manifests：`skills/wh-review/skill-bundle.json`、`skills/mini-task/skill-bundle.json`。
- Canonical writer：`runtime/task/task-handle.mjs`、`runtime/task/task-kernel-implementation.mjs`、`runtime/evidence/canonical-receipt-writer.mjs`。
- Direct writer 风险：`runtime/evidence/quality-store.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/mini-task/scripts/mini-task-runner.mjs`。
- Bridge/outcome：`tools/host/workflowhub-stage-agent-bridge.mjs`、`tools/host/workflowhub-stage-outcome-stop-hook.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`runtime/stage/stage-runner.mjs`。
- Review/completion：`runtime/stage/stage-handlers.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/evidence/freshness.mjs`、`runtime/review/canonical-review-result.mjs`。
- Existing tests：`core/__tests__/check-skill-closure.test.mjs`、`tests/integration/distribution-closure.test.mjs`、`tests/contract/stage-skill-invocation-contract.test.mjs`、`tests/integration/quality-store-concurrency.test.mjs`、`tests/integration/journal-replacement.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/contract/review-layering.test.mjs`、`tests/contract/legacy-zero.test.mjs`、`tests/integration/history-read-only.test.mjs`、`tests/stage-completion-facts.test.mjs`。

## Solution Design

### Overview

按三个行为域串行恢复：

1. 先让现有 bundle/catalog 生成与校验对同一闭包负责。
2. 再封闭 current quality 的 writer 和 bridge 边界。
3. 最后封闭 review provenance、required completion 和旧 evidence reader。

每个行为域先写一组会因目标缺口失败的 RED 合同，再在同一命令和同一 oracle 下做 GREEN。实现只修改现有 owner；不新增 public command、stage、材料或状态机。

### Data flow and failure semantics

- clean/current snapshot：允许 official runtime 认证并由 TaskKernel 写入；
- dirty/错绑/材料漂移：保留本地诊断或 fail-loud，不能写 current completion；
- provider unavailable/transport failure：canonical review 记录 unavailable，verify 不得升级 clean；
- required missing/incomplete：stage outcome 不得 completed；
- old evidence：可展示为 historical/stale，不参与 current predicate；
- serious finding：原始 verdict 保留，完成前必须有同一 finding/review/snapshot/material 绑定的 fixed 证据，或有真实用户确认、owner、风险范围和时间的 accepted risk。
- retry/replay：同一 idempotency key 同字节重放返回同一 fact 且 delta 为 0；冲突重放失败；部分写入恢复失败保留 incomplete/unknown。

### Compatibility behavior

兼容只保留读取、展示和明确的测试 fixture 能力。任何调用方若继续依赖 direct current write、旧 namespace 迁移、dsh formal code-review 或 bridge 传质量状态，先在 RED 中暴露，再回到现有 owner 修正；不新建永久 replacement 链。

## File Boundary

### NEW

- **NEW**（runtime evidence only）：`quality/tests/trust-recovery-final-current-snapshot.json`
- 仅由现有测试/runtime 生成当前 task evidence；不新增生产文件、公共入口、stage、状态机或第二事实存储。

### MODIFY

- `skills/wh-review/skill-bundle.json`
- `skills/mini-task/skill-bundle.json`
- `skills/catalog.yaml`
- `runtime/evidence/check-skill-closure.mjs`
- `runtime/distribution/skill-bundle-release.mjs`
- `runtime/adapters/local-skill-resolver.mjs`
- `core/__tests__/check-skill-closure.test.mjs`
- `tests/integration/distribution-closure.test.mjs`
- `tests/contract/stage-skill-invocation-contract.test.mjs`
- `runtime/task/task-handle.mjs`
- `runtime/task/task-kernel-implementation.mjs`
- `runtime/evidence/quality-store.mjs`
- `runtime/evidence/canonical-receipt-writer.mjs`
- `runtime/stage/stage-runner.mjs`
- `runtime/stage/stage-agent-outcome-adapter.mjs`
- `tools/host/workflowhub-stage-agent-bridge.mjs`
- `tools/host/workflowhub-stage-outcome-stop-hook.mjs`
- `tools/cli/check-task-record-paths.mjs`
- `skills/wh-review/scripts/wh-review-cli.mjs`
- `skills/mini-task/scripts/mini-task-runner.mjs`
- `tests/integration/quality-store-concurrency.test.mjs`
- `tests/integration/journal-replacement.test.mjs`
- `tests/integration/vnext-official-stage-run.test.mjs`
- `tests/contract/stage-completion.test.mjs`
- `runtime/stage/stage-handlers.mjs`
- `runtime/stage/completion-predicates.mjs`
- `runtime/evidence/freshness.mjs`
- `runtime/review/canonical-review-result.mjs`
- `tests/contract/review-layering.test.mjs`
- `tests/contract/legacy-zero.test.mjs`
- `tests/integration/history-read-only.test.mjs`
- `tests/stage-completion-facts.test.mjs`

### DO NOT TOUCH

- 旧损坏 WorkflowHub 目录：用户明确禁止访问/修改；其中 WIP 与损坏 Git 对象不属于当前事实。
- PaperBuilder 历史输入目录：仅读历史材料，不写回、不把旧 task receipt 当当前证据。
- `specs/archive/ui-frontend-delivery-contract/`：仅读归档契约，不复用旧越界 runtime/session/freshness/code-review 改动。
- PaperBuilder 生产代码、策略 DSL、Core、存储、回测四层：当前恢复没有产品实现授权。
- `CONSTITUTION.md`、stage 数量、公共七类 runtime behavior：本任务只做设计对照与实现计划，不修改宪法或公共面。

## Technical Decisions

### DEC-001 — 复用现有 closure owner

- **Selected**：reuse 现有 bundle generator、catalog、resolver、closure checker；extend 现有 contract tests 证明同一闭包。
- **Why**：当前问题是 hash/closure 漂移，不是缺少第二发布系统。
- **F10 real threat**：发布物与 catalog/hash 不一致会让消费者拿到不可复核技能。
- **F10 existing cover**：现有 generator、catalog、resolver、checker 和 distribution tests 已覆盖主要路径。
- **F10 bypassable**：只手工更新 manifest、跳过 checker、或让 release 不跑校验。
- **F10 maintenance cost**：只维护已有 owner 和少量负例；不添加新 registry/runner。
- **Removal condition**：若现有 checker 已覆盖全部发布调用方，删除多余重复断言而不保留第二校验器。

### DEC-002 — 单一 current writer

- **Selected**：extend `stage-runtime`/TaskKernel 的认证边界，restrict direct quality-store、review CLI 和 mini-task current write。
- **Why**：当前已有 canonical writer，双写会破坏 immutable lineage。
- **Normative contract**：current namespace 的非 stage-runtime 写入一律明确拒绝且 current quality delta 为 0；历史读取和隔离 fixture 走非 current 路径，不保留“拒绝或继续双写”的实现分支。
- **Consumer/owner**：status、completion、close、release 只消费 TaskKernel canonical facts；stage-runtime 是写 owner。
- **Finding binding**：fixed/accepted_risk 不能跨 finding、review、snapshot/material 或 review-track 借用；accepted_risk 必须来自真实用户确认并带 owner、时间和风险范围。
- **Removal condition**：direct writer 的所有真实 consumer 迁移或明确为只读/fixture后，删除无消费者生产入口。

### DEC-003 — bridge 窄 outcome

- **Selected**：extend 现有 bridge/adapter 的 narrow outcome contract；stage-runtime 再认证并发布正式事实。
- **Why**：bridge 不应复制 stage completion 逻辑或拥有 quality namespace。
- **Consumer/owner**：bridge 只服务当前 session handoff；stage-runtime 消费 outcome。
- **Replay contract**：稳定 idempotency key 由窄 outcome canonical bytes 计算；同 key 同字节重放零 delta，冲突 key `failed/BRIDGE_REPLAY_CONFLICT`，部分写入不允许生成第二 fact。
- **Removal condition**：任何旧的过宽 execution/quality 字段传递分支无 consumer 后删除，不保留永久兼容链。

### DEC-004 — wh-review provenance 分层

- **Selected**：extend existing review handler/freshness checks to require broker-provenance `wh-review`; retain dsh as diagnostic.
- **Why**：Q3 要求独立来源；本地 dsh 不能满足异源质量结论。
- **Consumer/owner**：verify-code code_review consumer 只认 canonical wh-review result；wh-review broker/adapter 是 provenance owner。
- **Removal condition**：若任何旧 formal dsh mapping 无 consumer，删除映射，不创建替代 provider flow。

## Test Strategy

### Common RED/GREEN contract

- 每个行为 task 的 RED 和 GREEN 使用完全相同的 `gate_cmd` 与 oracle ID；RED 只允许目标断言失败，不接受 setup/环境故障冒充 RED。
- GREEN 必须保持 named negative cases：dirty/old/unknown/unavailable/serious finding/乱序输入仍不能变成 pass。
- 证据路径只放当前 task 的 `quality/tests/` 或现有 canonical namespace；测试执行属于 build-code，不在本计划阶段宣称已执行。
- browser、PaperBuilder route、性能和视觉证据：N/A — 本任务恢复 WorkflowHub runtime，不拥有目标产品页面 consumer。

### Oracle catalogue

- `ORACLE-WH-CLOSURE`：发布与 resolver 的文件清单、依赖闭包、catalog/local hash 均由同一当前字节复算。
- `ORACLE-WH-WRITER`：bridge/wh-review/mini-task 不改变 current quality facts；只有 stage-runtime/TaskKernel 在认证 snapshot 后写入；同 key 同字节重放不产生第二 fact，部分写入不会被盲目重复发布。
- `ORACLE-WH-BRIDGE`：只允许窄 outcome；乱序/重复为确定 failed，时间非法为 `failed/BRIDGE_TIME_INVALID`，缺包为 unavailable，identity 错绑为 `failed/BRIDGE_IDENTITY_MISMATCH`，冲突重放为 `failed/BRIDGE_REPLAY_CONFLICT`；所有非法分支 current quality delta 为 0。
- `ORACLE-WH-PROVENANCE`：formal code_review 只接受当前 broker-provenance wh-review；dsh、legacy、unavailable、empty findings 不满足 clean；未处置 major/blocking 为 `needs_human`/missing，fixed 或当前 finding-bound accepted risk 才能进入后续 predicate。
- `ORACLE-WH-FINDING`：fixed/accepted_risk 必须绑定 finding_id、review_id、snapshot/material/review-track；fixed 有当前修复证据，accepted_risk 有真实用户确认、owner、时间和范围，否则保持 needs_human/missing。
- `ORACLE-WH-STAGE-HANDOFF`：manifest/材料静态合同与当前 Talk/Grill/wh-review/确认 evidence 都齐全且同 task/snapshot/material；缺真实 lifecycle 终态不得以声明补绿。
- `ORACLE-WH-LEGACY`：加入旧 evidence 不改变 current completion；旧 bytes 不变；current fact 不含旧 ref。
- `ORACLE-WH-PLAN`：每个 AC 有场景、oracle、失败条件、任务、命令、证据路径、限制和回滚；每个行为有 RED→GREEN。

## Rollback and Recovery

- 每个 phase 只回滚本 phase 的修改文件；保留原始方向、研究、review findings 和失败证据，不删除历史记录。
- bundle phase rollback：恢复现有 manifest/catalog/generator/checker 的本 phase bytes；若 closure 仍无法同字节复算，STOP，不引入 hash updater。
- writer/bridge rollback：恢复现有 stage-runtime/TaskKernel/bridge 边界；若 direct writer 仍可写 current namespace、同 key 重放产生第二 fact 或部分写入无法安全恢复，STOP，不用双写过渡。
- review/legacy rollback：恢复 formal wh-review、freshness、completion reader 的现有 owner；若 dsh/old evidence 仍影响 code_review/current completion，STOP，不迁移旧记录。

### Engineering Risk Handoff

- **Affected IDs**：`AC-WH-001`、`AC-WH-003`、`AC-WH-005`、`AC-WH-006`、`AC-WH-004`、`AC-WH-007`、`AC-WH-008`。
- **Trigger**：RED 失败不是目标行为、consumer 超出 boundary、writer provenance 无法认证、provider/host 结果不完整，或需要新增 authority。
- **Consequence**：当前阶段保持 incomplete；不得以局部 green、空 finding、旧 evidence 或 compatibility 分支宣称恢复。
- **Mitigation or STOP**：先回 owning task/材料修正；若需要新 stage/writer/state machine/rebind，停止并返回 make-decision。
- **Handling Stage**：build-code 实施与 verify-code 正式消费/审查。
- **Verification**：同一 RED/GREEN gate、最终 closure 命令、旧 evidence read-only 命令和 broker wh-review 结果；每条 AC 逐项绑定当前 snapshot/material。

## Implementation Order

1. P1 `T001 RED → T002 GREEN`：bundle/catalog closure。
2. P2 `T003 RED → T004 GREEN`：唯一 writer 与 narrow bridge。
3. P3 `T005 RED → T006 GREEN`：wh-review provenance、requiredness、legacy reader 与 serious finding。
4. `T007 FINAL`：当前快照聚合检查；只在用户确认计划后进入 build-code。

## Dependencies and Parallelism

- P1 必须先于 P2：stage-runtime 的写入事实依赖可复用且可定位的 skill closure。
- P2 必须先于 P3：review/legacy completion 不能在 writer/bridge identity 未闭合时判定。
- 每个 RED 先于同 phase GREEN；GREEN 依赖 RED 的真实目标失败证据。
- Phase 间不并行；同 phase RED/GREEN 也不并行，因为 GREEN 必须消费同一失败 oracle 且修改边界相同。

## Requirement and Verification Traceability

- R-001/R-002/R-003 → FR-WH-001/002 → AC-WH-001/002 → T007（计划/顺序）及 T003/T004（snapshot/runtime）。
- R-004/R-008 → FR-WH-004/008 → AC-WH-004/008 → T005/T006。
- R-005 → FR-WH-003 → AC-WH-003 → T001/T002。
- R-006 → FR-WH-005/006 → AC-WH-005/006 → T003/T004。
- R-007 → FR-WH-007 → AC-WH-007 → T005/T006。
- R-009 → FR-WH-009 → AC-WH-009 → T007。
- R-010 → FR-WH-010 → AC-WH-010 → T007 的后续交接，不进入当前代码边界。

## Governance Synchronization Matrix

- `CONSTITUTION.md`：只读绑定 `CONSTITUTION.md`、version 1.5.0、21 clauses；不改条款/版本/checklist。
- `skills/catalog.yaml`：继续作为仓内 provenance；发布包不伪装成 catalog 本身，hash 关系由 closure oracle 证明。
- `stage-runtime`：唯一正式 writer；bridge 和 provider 只能传递 narrow outcome/result。
- `quality/*`：current facts 由 TaskKernel/canonical writer；旧 namespace 只读展示；测试 fixture 与生产 writer 不能混同。
- `wh-review`：broker provenance、material/snapshot/review-track 必须完整；dsh 不进入 formal code_review。
- `PaperBuilder`：当前只记录后续交接；不得把其 WIP、T04 或历史 receipt 同步成当前 WorkflowHub 事实。

## Constitution Check

- **Constitution binding**: `{"artifact_kind":"constitution","ref":"CONSTITUTION.md","hash":"d17c85373e30c4733a77b19dc260373268fca6dd29b8ac3574c8a35b4da6ebd5","id":"workflowhub-design-constitution","version":"1.5.0","clause_count":21}`
- **F1**：核心只调度/编排/汇总；闭包与审查逻辑留在现有技能/owner。
- **F2**：只传材料、identity、narrow outcome/result；禁止读写内部状态。
- **F3**：四材料允许继续修复；正式写入校验 task/worktree/hash/order/structure。
- **F4**：保留异源 review/finding/unavailable；serious finding 修复或风险承担，不作修复准入 gate。
- **F5**：只为已观察 closure/writer/bridge/review 风险增加最小 contract，不新增通用 gate。
- **F6**：正式写入统一到 stage-runtime/TaskKernel；每次调用认证当前干净快照，不永久绑定 runner。
- **F7**：保留 make-decision/build-plan/verify-code 确认；commit/push/merge/archive/cleanup 独立授权。
- **F8**：优先复用现有 owner；不建 replacement/recovery/rebind 链解决普通升级。
- **F9**：dirty、旧、过期、缺失、不可用、冲突结果 fail-loud 或如实保留。
- **F10**：每个修改点说明真实威胁、已有覆盖、绕过方式和维护成本；不为机器化扩张控制面。
- **Q1**：质量缺失不阻止同 task 修复；完成时缺测试/AC/review/交接不得宣称完成。
- **Q2**：推进、正式 publication、完成判据分离；不把四材料/自动 accepted/aggregate 当完整证明。
- **Q3**：formal code_review 由 broker-provenance wh-review 产生；launcher/clean/registration 只证明结构事实。
- **S1**：复用现有 bundle/catalog、review、runtime 技能，不重造闭包或审查系统。
- **S2**：现有技能若与唯一 writer/unknown 语义冲突，只做合宪窄修正。
- **S3**：上游/来源/许可证与更新时间保留在现有 catalog/reuse 记录；本任务不引入 latest/main。
- **S4**：自定义/现有技能的执行指标继续进入统一执行记录，不另建 metrics truth。
- **S5**：阶段 outcome 和 review packet 保持可由独立 host/子代理读取，主上下文只保留摘要。
- **S6**：使用现有仓内 contract、独立结构审查和历史实践作为依据，不闭门新增方案。
- **S7**：按既有 stage/workflow/skill 边界修改，不把恢复逻辑揉成新大模块。
- **S8**：禁止宿主私有路径/永久 runner 绑定；ref 必须是 opaque/task-relative，结果可搬运。

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

- `T001 RED`：锁定当前 hash drift、发布物/本地 resolver 不一致、跳过 closure 和 empty manifest/dependency closure/package/resolver result 的负例。
- `T002 GREEN`：复用现有生成/校验链，使同一 gate 对正常 closure 为 0，并保留漂移和空闭包负例。

### Verify

- `npx vitest run core/__tests__/check-skill-closure.test.mjs tests/integration/distribution-closure.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；RED 非 0，GREEN 为 0；oracle `ORACLE-WH-CLOSURE`；证据：`quality/tests/trust-recovery-bundle-catalog-{red,green}.json`；empty manifest/dependency closure/package/resolver result 必须有具体非零失败。
- 交接前另跑 `npm run check:skill-closure`；这不是权限 gate，只是当前 closure 的最终可观察命令。

### Knowledge

P1 交给 P2：当前 bundle 文件清单、catalog/local hash 关系、发布是否强制校验、resolver/五 stage consumer 的真实入口，以及任何仍保留的 unknown/unavailable。

### STOP

- 需要新 catalog、第二 bundle generator、永久 hash updater、第五 stage 或无法区分 fixture 与 production bundle 时返回 decision-log/plan。
- RED 由 setup/依赖故障造成而不是目标 drift 时停止，不进入 GREEN。

### Done

只能报告 closure contract 的 RED/GREEN 设计与实现事实；不能报告整个 WorkflowHub、PaperBuilder 或 release 已通过。

### Risks and rollback

- **Risk**：只改 manifest hash，未证明生成器/发布器/校验器同一字节。
- **Prevention**：同一 oracle 覆盖 bundle bytes、catalog hash、resolver 和发布禁止路径。
- **Rollback / recovery**：只回滚 P1 9 个文件；保留 RED evidence 和原始 mismatch，不增加替代 registry。

## Phase P2 — Single writer and narrow bridge

### Goal

让 current quality facts 只有 stage-runtime/TaskKernel 正式写入；bridge、wh-review CLI、mini-task 只传递或返回窄 outcome/result；required outcome 的 identity/顺序/时间和稳定 idempotency key 由官方运行时再认证。

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

- `T003 RED`：锁定 direct writer 改变 current quality、bridge 传过宽字段、required rows 非 completed 仍汇总完成、同 key 冲突重放和部分写入恢复，以及 clean/dirty/旧 snapshot/材料漂移错绑的负例。
- `T004 GREEN`：收紧既有 writer/bridge/adapter/runner，让官方路径可写、非官方路径不写，非法 outcome 保持真实未完成状态；同 key 重放零 delta，冲突重放失败，部分写入不产生第二 fact。

### Verify

- `npx vitest run tests/integration/quality-store-concurrency.test.mjs tests/integration/journal-replacement.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/contract/stage-completion.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；RED 非 0，GREEN 为 0；oracle `ORACLE-WH-WRITER` 与 `ORACLE-WH-BRIDGE`；证据：`quality/tests/trust-recovery-writer-boundary-{red,green}.json`、`quality/tests/trust-recovery-writer-consumers-{red,green}.json`、`quality/tests/trust-recovery-bridge-{red,green}.json`。
- 观察断言：bridge/wh-review/mini-task 前后 current quality delta 为 0；官方 stage-runtime 写入才产生预期 canonical fact；重复/乱序/错绑 outcome、dirty/旧 snapshot/材料漂移和 taskPath 错绑不能 completed；同 key 同字节重放返回同一引用，冲突重放和部分写入恢复都不产生第二 fact；writer consumer reverse audit 无未登记 production current writer。

### Knowledge

P2 交给 P3：唯一 writer allowlist、direct writer 的 read-only/fixture disposition、bridge narrow schema、required step/skill 依赖顺序、时间/snapshot 负例，以及当前同会话 task-path 失败是否已由目标修复或保留为 incomplete。

### STOP

- 任一非 stage-runtime 路径仍能写 current quality；bridge 仍接受 `execution`/`receipts`/quality fields 或自行发布 completion；required item 可通过 `not_applicable` 代替 wh-review时，立即停止。
- 需要新增 state machine、public behavior、第二 store、永久 compatibility/replacement 链时返回 make-decision。

### Done

只能报告 current writer/bridge contract 的当前测试事实；不能报告 verify-code clean、product release 或 PaperBuilder 验收完成。

### Risks and rollback

- **Risk**：迁移 direct writer 漏掉真实 consumer，或为兼容保留双写。
- **Prevention**：先做反向引用清单；只允许现有 owner，负例检查 current quality delta。
- **Rollback / recovery**：回滚 P2 15 个文件到本 phase 起点；保留 writer boundary RED，不复制旧 writer。

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

- `T005 RED`：锁定 dsh/旧 review/缺 policy/empty findings/unavailable/serious finding 误满足 formal code_review 或 current completion 的负例，并锁定静态阶段声明替代真实 Talk/Grill/wh-review/确认 evidence 的负例。
- `T006 GREEN`：在 handler、freshness、canonical result、legacy readers 和既有 stage package contract owner 上强制 provenance、current binding、finding disposition、真实 handoff evidence 和 historical-only 语义。

### Verify

- `npx vitest run tests/contract/review-layering.test.mjs tests/contract/legacy-zero.test.mjs tests/integration/history-read-only.test.mjs tests/stage-completion-facts.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；RED 非 0，GREEN 为 0；oracle `ORACLE-WH-PROVENANCE`、`ORACLE-WH-LEGACY`、`ORACLE-WH-FINDING` 和 `ORACLE-WH-STAGE-HANDOFF`；证据：`quality/tests/trust-recovery-review-legacy-{red,green}.json`、`quality/tests/trust-recovery-stage-handoff-{red,green}.json`。
- 观察断言：只有 `wh_review.v2` broker provenance 且当前 snapshot/material/track 绑定的 result 能进入 formal code_review；旧 ref、dsh、自审、unavailable、未处置 serious finding 保持 missing/incomplete。

### Knowledge

交给 T007：每条 AC 的实现/验证 consumer、current review policy/source/model/config binding、legacy read-only 结果、serious finding disposition 方式、仍未验证的 provider/host/browser 限制。

### STOP

- dsh 可生成 formal code_review、旧 policy 可被刷新为 current、unavailable/serious finding 可完成 stage，或需要新 review flow时返回 plan/decision。

### Done

只能报告 review/legacy completion contract 事实；不能报告真实 provider 当前可用、PaperBuilder 页面质量或全站交付通过。

### Risks and rollback

- **Risk**：freshness 与 handler 两条路径语义不一致，或旧展示 reader 误成为 completion reader。
- **Prevention**：同一 current provenance fixture 同时覆盖两条路径；历史 bytes 不变；legacy-zero 负例保留。
- **Rollback / recovery**：回滚 P3 9 个文件；保留 review unavailable/legacy facts，不迁移旧记录。

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

- `npm run check:skill-closure && npx vitest run core/__tests__/check-skill-closure.test.mjs tests/integration/distribution-closure.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs tests/integration/quality-store-concurrency.test.mjs tests/integration/journal-replacement.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/contract/stage-completion.test.mjs tests/contract/review-layering.test.mjs tests/contract/legacy-zero.test.mjs tests/integration/history-read-only.test.mjs tests/stage-completion-facts.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；预期 0；oracle `ORACLE-WH-PLAN`、`ORACLE-WH-STAGE-HANDOFF` 和 `ORACLE-WH-FINDING`；证据 `quality/tests/trust-recovery-final-current-snapshot.json`。

### Knowledge

build-code 只读取四份当前材料和 T001–T006 真实事实；未知 provider/host/browser/PaperBuilder 事实必须显式交接，不能猜测。

### STOP

AC 缺失、phase boundary 漂移、RED/GREEN 命令不一致、需要新 authority、或最终命令失败原因无法归因时停止并返回对应 owning material。

### Done

只完成计划级聚合设计和用户确认请求；未实施、未提交、未推送、未合并、未关闭。

### Risks and rollback

- **Risk**：把计划/结构检查当成实现完成或把历史 evidence 当 current。
- **Prevention**：T007 明确 N/A — non-behavior aggregate；最终 oracle 只报告当前快照和设计覆盖。
- **Rollback / recovery**：撤回 P4 测试聚合设计，不影响 P1–P3 原始材料和历史 facts。

## Final current-snapshot aggregate strategy

- **tier / method**：feature/fullstack contract；只读运行现有 closure、writer、bridge、review、legacy contract tests，不启动 PaperBuilder 服务或浏览器。
- **scenarios**：10 个 AC 的正常、失败、状态、跨模块 seam；包含当前 7 个 hash mismatch 的修复后复算、writer delta、bridge malformed outcome、dsh/wh-review provenance、旧 evidence 不影响 completion。
- **command**：`npm run check:skill-closure && npx vitest run core/__tests__/check-skill-closure.test.mjs tests/integration/distribution-closure.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs tests/integration/quality-store-concurrency.test.mjs tests/integration/journal-replacement.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/contract/stage-completion.test.mjs tests/contract/review-layering.test.mjs tests/contract/legacy-zero.test.mjs tests/integration/history-read-only.test.mjs tests/stage-completion-facts.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected exit**：0。
- **oracle**：`ORACLE-WH-PLAN` — closure、writer、bridge、provenance、legacy 和 required completion 的 current snapshot 结果均可观察，且命令失败时保留具体失败而不是回退为空成功。
- **fixtures_services**：现有 contract fixtures、current task store fixture、明确的 fake broker/unavailable provider fixture；无 PaperBuilder 服务、无浏览器、无真实 token；清理责任由现有测试 fixture。
- **evidence_path**：`quality/tests/trust-recovery-final-current-snapshot.json`。
- **coverage limits**：不证明真实第三方 provider 可用、不证明浏览器/视觉/a11y/performance、不证明 PaperBuilder 业务正确、不证明历史 evidence 可以被迁移。
- **STOP**：任一阶段 RED 归因于 setup/环境，命令仍非 0，AC 缺失，current writer 越界，或需要新 authority。
- **execution_contract**：用户确认计划后，在干净、已提交、可定位 current snapshot 运行一次；失败保留原输出并回对应 task，不全量重跑掩盖局部失败。

## Dependency Graph

```text
T001 (P1 RED) → T002 (P1 GREEN) → T003 (P2 RED) → T004 (P2 GREEN) → T005 (P3 RED) → T006 (P3 GREEN) → T007 (FINAL)
```

- P1→P2：闭包先稳定，runtime 只能依赖可定位的技能包。
- P2→P3：正式 writer/bridge 先稳定，review/completion 才能解释 provenance。
- T007 只读取当前结果并生成交接，不产生新 authority。

## Final Boundary Check

- 每个 phase 都有 Goal、Files、Tasks、Verify、Knowledge、STOP、Done、Risks and rollback。
- 所有 MODIFY 文件均属于一个 phase，且会由至少一个任务持有；没有 NEW 生产文件。
- 每个行为变化都有同命令、同 oracle 的 RED/GREEN reciprocal pair；T007 明确 N/A — non-behavior aggregate。
- 每个 FR/AC 有双向 source→decision→FR→AC→task→command/oracle/evidence 路径。
- old repo、PaperBuilder production、archive bytes、constitution/public surface 均不在 MODIFY 边界。
- 用户确认前不执行 build-code，不 commit/push/merge/close。
