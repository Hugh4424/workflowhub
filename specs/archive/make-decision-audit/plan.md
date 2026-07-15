# 实施计划：make-decision-audit

**Task ID**: `make-decision-audit` | **Date**: 2026-07-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/make-decision-audit/spec.md`
**Status**: Draft

## Summary

把 WorkflowHub 固定为五个连续 stage，为各 stage 提供稳定、有序的 canonical step manifest，并把现有 receipt/journal 与 audit aggregator 接成 expected-versus-observed 的步骤审计链。同时建立 immutable requirement lineage、hash/stale 传播和 canonical audit summary，让 stage-result、validator、facts assembly 只引用同一裁决。

minimal-path: **P2 — 改造复用现有 `receipt-writer`、`journal-appender`、`audit-aggregator`、stage-result validator 与 facts assembly；只新增五份 manifest、最小 lineage/core adapter 合同及其 fixtures，不新增依赖、服务或 CI gate。**

## Technical Context

**Language/Version**: Node.js ESM；具体 Node.js 版本 N/A（spec 未指定）
**Primary Dependencies**: Node.js 标准库与仓库既有模块；不新增第三方依赖
**Storage**: Filesystem — stage manifests、task journal/receipts、requirement ledger、audit summary 与 stage-result 引用
**Testing**: 仓库现有 Node.js test runner；具体命令 N/A（spec 未指定，实施时从 `package.json` 使用既有脚本）
**Target Platform**: WorkflowHub CLI/agent workflow runtime；Multica source 经 adapter 输入，offline fixture 可独立运行
**Project Type**: AI workflow orchestration tool
**Performance Goals**: N/A（spec 明确要求基于实际 ledger/receipt 规模建立基线，当前无可用目标值）
**Constraints**: 五阶段连续拓扑；expected/observed 分权；aggregator 单一 verdict authority；generic core 无平台依赖；缺证据 fail-closed；R1–R9 accepted、R10 withdrawn；不新增阻断式质量门
**Scale/Scope**: 修改 5 个 stage SKILL、5 份 stage manifest、既有 audit/receipt/validator/facts 边界，新增最小 lineage/adapter/schema/docs/fixtures；精确行数 N/A（需实现 diff 后统计）

## Constitution Check

### Framework Principles (F)

- [x] **F1 薄核心** — 判据：`core/` 仅保留平台无关的窄合同、纯校验与事实聚合；五阶段编排分别留在 `workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`，外部输入获取和人工裁决留在 `core/multica-source-adapter.mjs` 与 STOP。没有新增服务、状态机或第二裁决引擎，既有 aggregator 的纯函数扩展不承担调度或平台 I/O。
- [x] **F2 窄契约** — 判据：manifest、receipt、ledger、canonical input、audit summary 均以版本化 schema 跨边界，不暴露内部状态。
- [x] **F3 物理事实靠机器校验但不阻断** — 判据：receipt/journal/hash 由机器记录验证；写入和偏差作为事实浮现，质量不由自动 gate 决定。
- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：保留 build-plan 独立审查与人工确认；aggregator 只裁决合同证据完整性，不替代质量判断。
- [x] **F5 gate 谨慎添加出事再补无用则移除** — 判据：只保留 manifest 入口校验、事实采集与既有人工确认三类边界，不新增 CI gate。
- [x] **F6 统一外置执行记录** — 判据：五阶段统一写 task journal/receipt，并引用同一 canonical audit summary。
- [x] **F7 推进与不可逆操作不自动越过人** — 判据：人工确认点继续作为唯一推进硬门；迁移与提交不绕过人工边界。
- [x] **F8 简单优先** — 判据：minimal-path 选 P2，复用现有模块，无新依赖、服务或重复 validator。
- [x] **F9 可证伪不假绿** — 判据：missing、duplicate、out-of-order、unknown、tampered-hash、stale、source incomplete 均有非 pass fixture。
- [x] **F10 自动化按真实收益添加，不为“机器可校验”本身堆基建** — 判据：每项新增机制通过四问；重复裁决、额外服务与新 CI 均裁剪。

### Quality Principles (Q)

- [x] **Q1 记事实而非阻断** — 判据：journal/receipt/metrics 记录物理事实，质量偏差供独立审查和人工判断。
- [x] **Q2 gate 三类划分** — 判据：manifest/schema 属入口校验，receipt 属记录采集，Step 9 属人工确认；职责不混用。
- [x] **Q3 异源审查加人工把关** — 判据：计划含独立 reviewer 与人工批准；stage 自身不自审自判质量。

### Skill Principles (S)

- [x] **S1 能用外部就不造轮子** — 判据：优先复用仓库既有 receipt、journal、aggregator、validator、facts 与 Node.js 标准库。
- [x] **S2 外部技能可针对项目改造合宪** — 判据：不引入外部技能实现；既有 adapted spec skills 继续按 WorkflowHub 合同使用。
- [x] **S3 迭代时保持最新并就地检查** — 判据：T001 在五份 `SKILL.md` 就地登记来源路径 `constitution-checklist.md`、`schemas/steps.schema.json` 与对应 `steps.json`，T020 对来源引用和 manifest 漂移做全仓扫描；本 change 不引入外部技能或第三方依赖，无需虚构外部版本。
- [x] **S4 自定义技能必须有指标系统** — 判据：五阶段继续接入既有 `metrics/collector.mjs`，不另造指标存储。
- [x] **S5 自定义技能方便子代理调用省主上下文** — 判据：稳定 manifest ID、窄 schema 与独立 adapter 允许 executor/sub-agent 按单步调用。
- [x] **S6 自定义技能参考市面方案不闭门造车** — 判据：沿用仓库现有 adapted skills、JSON Schema/append-only journal 等成熟模式，不自创新框架。
- [x] **S7 一阶段一技能一工作流一文件夹** — 判据：五个 stage 各自在 `workflows/<stage>/` 维护 SKILL 与 manifest，不新增第六 stage。
- [x] **S8 自定义技能可独立调用可搬运** — 判据：generic core 接 canonical input/offline fixture，不依赖 Multica；平台逻辑只在 adapter。

**Constitution Check Result**: 21/21 clauses checked and compliant。该结果仅说明计划合宪，不替代人工 approval；T021 仍必须 STOP。

## Project Structure

### Documentation (this feature)

```text
specs/make-decision-audit/
├── spec.md                                      # UNCHANGED — authoritative input
├── research.md                                  # NEW — Phase 0 research
├── data-contracts.md                            # NEW — boundary contracts
├── plan.md                                      # NEW — this plan
└── tasks.md                                     # NEW LATER — spec-tasks output
```

### Source Code (repository root)

```text
workflows/
├── make-decision/
│   ├── SKILL.md                                 # MODIFY — integer, one-action steps + receipt calls
│   └── steps.json                               # NEW — canonical manifest
├── build-spec/
│   ├── SKILL.md                                 # MODIFY
│   └── steps.json                               # NEW
├── build-plan/
│   ├── SKILL.md                                 # MODIFY
│   └── steps.json                               # NEW
├── build-code/
│   ├── SKILL.md                                 # MODIFY
│   └── steps.json                               # NEW
└── verify-code/
    ├── SKILL.md                                 # MODIFY
    ├── steps.json                               # NEW
    └── facts-assembly.mjs                       # MODIFY — consume canonical summary only

core/
├── receipt-schema.mjs                           # MODIFY — manifest/run/attempt identity contract
├── receipt-writer.mjs                           # MODIFY — canonical step entry/exit boundary
├── journal-schema.mjs                           # MODIFY — observed event identity contract
├── journal-appender.mjs                         # MODIFY — preserve append-only observed facts
├── chain-topology.mjs                           # MODIFY — reconcile manifest ordering/attempt pairs
├── audit-aggregator.mjs                         # MODIFY — sole canonical verdict + summary
├── step-manifest.mjs                            # NEW — load/validate five manifests
├── requirement-ledger.mjs                       # NEW — immutable lineage, coverage, hash/stale
├── canonical-source.mjs                         # NEW — platform-neutral canonical input validation
└── multica-source-adapter.mjs                   # NEW — normalize Multica source only

scripts/
└── validate-stage-result.mjs                    # MODIFY — verify summary ref/hash, never re-verdict

schemas/
├── steps.schema.json                            # NEW — manifest interchange schema
├── requirement-ledger.schema.json               # NEW — lineage interchange schema
└── audit-summary.schema.json                    # NEW — canonical summary schema

tests/
├── step-manifest.test.mjs                       # NEW — uniqueness/order/dependency/schema
├── receipt-wiring.test.mjs                      # MODIFY — 5/5 stage entry/exit wiring
├── receipt-verification.test.mjs                # MODIFY — same-attempt matching/fail-closed
├── audit-aggregator.test.mjs                    # NEW — sole verdict and findings
├── requirement-lineage.test.mjs                 # NEW — 9/9, withdrawn R10, hash/stale
├── source-adapter.test.mjs                      # NEW — Multica/offline equivalence
├── stage-result-contract.test.mjs               # MODIFY — summary reference contract
└── fixtures/
    └── step-audit/                              # NEW — normal, legacy, adversarial datasets

docs/
├── migration-and-fallback.md                    # MODIFY — old→new mapping/errors/cutover
├── audit-contracts.md                           # NEW — schemas, callers, skip/retry/human semantics
└── reuse-registry.md                            # NEW — 8-consumer evidence matrix
```

**Structure Decision**: 每 stage 的 manifest 与 SKILL 同目录，满足 S7 并降低漂移；generic core 放 `core/`，Multica adapter 是唯一平台边界；schema、tests、docs 分别复用仓库现有目录。若仓库已有等价 schema/registry 文件，实现时应就地扩展并取消对应 NEW 文件，遵守 P2。

## Complexity Tracking

- **F1 偏离** — WHY：上游 spec 明确要求 platform-neutral generic core 统一计算 coverage/audit，且仓库已有 `core/audit-aggregator.mjs`；TRADEOFF：core 不再只承担调度，测试与变更牵连面增加；JUSTIFICATION：P2 就地扩展既有 aggregator，避免第二裁决引擎，是否接受由人工检查点裁定。
- **S3 偏离** — WHY：本轮材料未提供应跟踪的外部技能/方案版本与来源路径；TRADEOFF：无法证明方案为外部最新版本；JUSTIFICATION：先明确记录为不合规，不编造来源，待人工决定是否在实施前补来源审计任务。

复杂度边界：lineage 与 adapter 是 spec 明确要求且既有模块未完整覆盖的最小新增；不引入数据库、服务、事件总线、额外审计引擎、第二 validator 或 CI gate。若实现勘查发现现有文件已覆盖拟新增模块，必须改为就地扩展，并在 tasks/file list 中记录路径替换。

## Implementation Steps

### Phase 1: Setup / Foundation

#### Step 1.1: 冻结五阶段 topology 与旧→新映射

把五份 `SKILL.md` 改为连续整数步骤、一 step 一动作；建立旧 action 到 canonical stage/step 的唯一映射，明确入口条件、完成证据和 observable result。

**Files**: `workflows/make-decision/SKILL.md`, `workflows/build-spec/SKILL.md`, `workflows/build-plan/SKILL.md`, `workflows/build-code/SKILL.md`, `workflows/verify-code/SKILL.md`, `docs/migration-and-fallback.md`
**Maps to**: FR-STRUCTURE-001, FR-COMM-001

#### Step 1.2: 定义并校验 canonical step manifests

为 5/5 stage 添加 `steps.json`；实现无第三方依赖的 loader/validator，拒绝重复 ID、非连续顺序、缺字段、未知依赖与环。

**Files**: `workflows/make-decision/steps.json`, `workflows/build-spec/steps.json`, `workflows/build-plan/steps.json`, `workflows/build-code/steps.json`, `workflows/verify-code/steps.json`, `core/step-manifest.mjs`, `schemas/steps.schema.json`, `tests/step-manifest.test.mjs`
**Maps to**: FR-CONTRACT-001, FR-BEHAV-001

#### Step 1.3: 建立 requirement ledger 与 source normalization

实现 immutable requirement ID、source→decision→artifact→acceptance lineage、coverage、hash/stale DAG；用窄 adapter 把 Multica 与 offline fixture 规范化为同一 canonical input。R10 保留 withdrawn 历史但不进分母。

**Files**: `core/requirement-ledger.mjs`, `core/canonical-source.mjs`, `core/multica-source-adapter.mjs`, `schemas/requirement-ledger.schema.json`, `tests/requirement-lineage.test.mjs`, `tests/source-adapter.test.mjs`
**Maps to**: FR-ALIGN-001, FR-TRACKING-001, FR-CONTRACT-002

### Phase 2: Core Implementation

#### Step 2.1: 接通五阶段 entry/exit receipt 与 journal

在每个 manifest step 的真实进入/退出边界调用现有 receipt writer；统一 run/stage/step/attempt identity。entry 写失败 fail-closed；exit 写失败保留 warn 事实，最终因缺证据 non-pass。journal 只保留 observed facts。

**Files**: `workflows/make-decision/SKILL.md`, `workflows/build-spec/SKILL.md`, `workflows/build-plan/SKILL.md`, `workflows/build-code/SKILL.md`, `workflows/verify-code/SKILL.md`, `core/receipt-schema.mjs`, `core/receipt-writer.mjs`, `core/journal-schema.mjs`, `core/journal-appender.mjs`, `tests/receipt-wiring.test.mjs`, `tests/receipt-verification.test.mjs`
**Maps to**: FR-ARTIFACT-001, FR-BEHAV-001

#### Step 2.2: 让 aggregator 对账 expected 与 observed 并唯一裁决

扩展 aggregator，从 manifest、ledger、journal、receipts 生成结构化 summary；逐项输出 missing/unexpected/duplicate/out-of-order/unknown/stale/tampered-hash，严格匹配 attempt，处理大量 receipt、retry、分页与顺序变化。

**Files**: `core/chain-topology.mjs`, `core/audit-aggregator.mjs`, `schemas/audit-summary.schema.json`, `tests/audit-aggregator.test.mjs`, `tests/fixtures/step-audit/`
**Maps to**: FR-REVIEW-001, FR-BEHAV-001, FR-ACCOUNT-001, FR-BUILD-001

#### Step 2.3: 迁移 stage-result、validator 与 facts assembly 为只读消费者

stage-result 只携带 summary ref/hash/verdict；validator 只验证引用、schema 与 hash 一致；facts assembly 只装配。删除/禁止三者独立重算 verdict 的路径。

**Files**: `scripts/validate-stage-result.mjs`, `workflows/verify-code/facts-assembly.mjs`, `tests/stage-result-contract.test.mjs`, `tests/facts-subschema.test.mjs`
**Maps to**: FR-REVIEW-001, FR-ACCOUNT-001, FR-BEHAV-001

#### Step 2.4: 建立 consumer/evidence matrix 与复用 registry

逐项记录 5 stages、stage-result、validator、facts assembly 共 8/8 消费者的 typed I/O、failure/skip/human semantics 和 reuse/local/extract 结论，拒绝语义不同的伪复用。

**Files**: `docs/reuse-registry.md`, `tests/reuse-registry.test.mjs`, `tests/m12-reuse-registry.test.mjs`
**Maps to**: FR-SCOPETRIAGE-001

### Phase 3: Polish / Verification

#### Step 3.1: 完成四层 fixtures 与对抗验证

覆盖 unit、integration、legacy、adversarial；证明完整五阶段 pass，以及 missing、duplicate、out-of-order、unknown、tampered-hash、stale、source incomplete、跨 attempt 拼接均不假绿。

**Files**: `tests/step-manifest.test.mjs`, `tests/receipt-wiring.test.mjs`, `tests/receipt-verification.test.mjs`, `tests/audit-aggregator.test.mjs`, `tests/requirement-lineage.test.mjs`, `tests/source-adapter.test.mjs`, `tests/stage-result-contract.test.mjs`, `tests/fixtures/step-audit/`
**Maps to**: FR-BUILD-001, FR-BEHAV-001, FR-CONTRACT-002

#### Step 3.2: 完成合同、迁移与 caller 文档

文档化 schemas、所有权、错误码、legacy/unknown、skip/retry/human gate、旧→新映射、迁移完成信号与 offline/Multica 使用方式；caller 无需读源码。

**Files**: `docs/audit-contracts.md`, `docs/migration-and-fallback.md`, `docs/reuse-registry.md`, `docs/adr/0002-requirement-lineage-and-step-audit.md`
**Maps to**: FR-COMM-001, FR-CONTRACT-002, FR-SCOPETRIAGE-001

#### Step 3.3: 运行验收、建立性能基线并核对影响面

使用仓库既有 test script 运行完整相关套件；记录实际 ledger/receipt 规模与审计耗时基线，不编造阈值；检查被改/删/重命名符号在 code/config/tests/docs 的所有引用。

**Files**: `package.json` (read-only), `tests/step-manifest.test.mjs`, `tests/requirement-lineage.test.mjs`, `tests/source-adapter.test.mjs`, `tests/receipt-wiring.test.mjs`, `tests/receipt-verification.test.mjs`, `tests/audit-aggregator.test.mjs`, `tests/stage-result-contract.test.mjs`, `tests/facts-subschema.test.mjs`, `tests/reuse-registry.test.mjs`, `tests/m12-reuse-registry.test.mjs`, `tasks/make-decision-audit/progress.md`, `tasks/make-decision-audit/apply/phase-3.md`, `tasks/make-decision-audit/reviews/build-code-verifier.md`, `tasks/make-decision-audit/reviews/verify-code-verifier.md`
**Maps to**: FR-BUILD-001, FR-ACCOUNT-001, FR-COMM-001

### Scope Boundary Verification

## Existing Interface Signature Anchors

These are the exact current exported interfaces before apply. Tasks that change an existing interface must preserve compatibility or update every listed consumer and contract test.

- **SIG-001** `core/receipt-schema.mjs`: `validateReviewPayload(review)`, `validateEntryPayload(payload)`, `validateExitPayload(payload)`, `validateStepAutoRollbackPayload(payload)`.
- **SIG-002** `core/receipt-writer.mjs`: `buildAuditSummaryFromJournalEvents(events, { stageSlug, workflowRunId } = {})`, `writeEntryReceipt(taskId, payload)`, `writeExitReceipt(taskId, payload)`, `writeStepAutoRollback(taskId, payload)`.
- **SIG-003** `core/journal-schema.mjs`: constants `JOURNAL_SCHEMA_VERSION`, `JOURNAL_EVENT_TYPES`, `JOURNAL_EVENT_TYPE_VALUES`, `STEP_AUTO_ROLLBACK_REQUIRED_FIELDS`, `AUDIT_SUMMARY_FIELDS`.
- **SIG-004** `core/journal-appender.mjs`: `journalPathForTaskDir(taskSpecDir)`, `buildJournalEvent(eventType, payload)`, `appendJournalLine(taskId, eventType, payload)`, `appendReceiptWriteWarn(taskId, writeError, exitPayload)`.
- **SIG-005** `core/chain-topology.mjs`: `firstByStepAndEntry(exitEvents)`, `firstByStepId(exitEvents)`, `discoverChainNodes(entryEvents, firstExitByStepAndEntry, stageSlug)`, `discoverChainStepIds(entryEvents, exitByStepId, stageSlug)`.
- **SIG-006** `core/audit-aggregator.mjs`: `latestByStepId(events)`, `latestByStepAndEntry(exitEvents)`, `buildAuditSummaryFromJournalEvents(events, stageSlug, workflowRunId)`.
- **SIG-007** `scripts/validate-stage-result.mjs`: `validateStageResult(stage, artifact)`, `getRealChangedFiles(worktreeRoot, baseRef = process.env.WORKFLOWHUB_DIFF_BASE ?? "HEAD", options = {})`, `verifyReceipts(stage, stageResultPath, worktreeRoot, options = {})`; CLI remains `node scripts/validate-stage-result.mjs <stage> <stage-result-path> [worktree-root]`.
- **SIG-008** `workflows/verify-code/facts-assembly.mjs`: `readCommand(buildResult)`, `assembleStageResult({ verdict, evidenceRef, anomalyFlags, missingItems, userDecision, reason, errorCode, retryable, workflowRunId })`, `writeStageResult(taskSpecDir, result, auditOptions = {})`, `validateMetricRecord(record)`.

Task anchors: T008 uses SIG-001/SIG-003; T009 uses SIG-002/SIG-004; T011 uses SIG-005/SIG-006; T014 uses SIG-007/SIG-008.

## Governance Synchronization Matrix

| Fixed category | Decision | Reason | Tasks |
|---|---|---|---|
| 项目规则 | 不改 | `CLAUDE.md` and constitution remain authoritative; no new coding standard | — |
| workflow 定义 | 改 | five stage definitions and manifests become continuous and auditable | T001, T003, T010 |
| reviewer contract | 不改 | review policy is consumed, not redesigned | — |
| schema | 改 | step, ledger, receipt/journal identity, and audit summary contracts change | T002, T004, T008, T011 |
| runtime config | 不改 | no environment/config/feature flag is introduced | — |
| knowledge/doc | 改 | migration, audit contract, ADR, and reuse registry must match the new contracts | T016, T018, T020 |
| automation gates/CI/hooks | 不改 | existing `npm test` is reused; no CI gate or hook is added | — |

## Phase Execution Contracts

### Phase 1 — Goal / Files / Tasks / Verify / Knowledge / STOP

- **Goal**: checkable outputs are five exact manifests, two canonical schemas/modules, one adapter, and failing-then-passing contract tests for topology, lineage, and source equivalence.
- **Files**: exactly those enumerated by Steps 1.1–1.3 and T001–T007; no wildcard path is authorized.
- **Tasks**: T006/T007 tests are written first and observed failing before T002–T005 implementation; T001 is docs/workflow definition preparation and is test-first exempt.
- **Verify**: `gate_cmd: npm test -- tests/step-manifest.test.mjs tests/requirement-lineage.test.mjs tests/source-adapter.test.mjs`; `display_cmd: npm test -- tests/step-manifest.test.mjs tests/requirement-lineage.test.mjs tests/source-adapter.test.mjs --reporter=verbose`.
- **Knowledge**: update `tasks/make-decision-audit/progress.md`, `tasks/make-decision-audit/apply/phase-1.md`, and `tasks/make-decision-audit/reviews/build-code-verifier.md` through paths returned by `core/task-record-paths.mjs`.
- **STOP**: if manifests disagree with a stage SKILL, source is incomplete, a dependency cycles, or R10 enters the denominator, record the fact and stop before Phase 2. No automatic scope choice.
- **Boundary/failure handling**: duplicate/gapped IDs, missing fields, unknown/cyclic dependencies, tampered hashes, stale lineage, and incomplete Multica source return explicit non-pass errors; no inferred data, compatibility adapter, or rollback mutation.

### Phase 2 — Goal / Files / Tasks / Verify / Knowledge / STOP

- **Goal**: checkable outputs are same-attempt receipt/journal identity, canonical expected/observed reconciliation, one verdict authority, and three consumers that preserve its verdict/hash.
- **Files**: exactly those enumerated by Steps 2.1–2.4 and T008–T017; the five workflow SKILL paths are individually listed above.
- **Tasks**: write failing cases in T012/T013/T015 before changing SIG-001 through SIG-008; then implement T008–T011/T014 and make the same tests pass. T016/T017 follow the consumer cutover.
- **Verify**: `gate_cmd: npm test -- tests/receipt-wiring.test.mjs tests/receipt-verification.test.mjs tests/audit-aggregator.test.mjs tests/stage-result-contract.test.mjs tests/facts-subschema.test.mjs tests/reuse-registry.test.mjs tests/m12-reuse-registry.test.mjs`; `display_cmd: npm test -- tests/receipt-wiring.test.mjs tests/receipt-verification.test.mjs tests/audit-aggregator.test.mjs tests/stage-result-contract.test.mjs tests/facts-subschema.test.mjs tests/reuse-registry.test.mjs tests/m12-reuse-registry.test.mjs --reporter=verbose`.
- **Knowledge**: update `tasks/make-decision-audit/progress.md`, `tasks/make-decision-audit/apply/phase-2.md`, and `tasks/make-decision-audit/reviews/build-code-verifier.md`.
- **STOP**: after T013, stop unless the normal fixture passes and missing/duplicate/unexpected/out-of-order/cross-attempt/unknown/stale/tampered cases are all non-pass. Human confirmation is required before consumer cutover.
- **Boundary/failure handling**: entry write failure is fail-closed; exit write failure remains a visible warning; duplicate terminal exits and identity mismatch are findings; aggregator error/unknown never becomes pass; consumers may verify references but never recalculate verdict; rollback means reverting the phase commit, not rewriting append-only evidence.

### Phase 3 — Goal / Files / Tasks / Verify / Knowledge / STOP

- **Goal**: checkable outputs are 8/8 registry evidence, three exact migration/contract docs, complete acceptance evidence, measured-or-unknown performance facts, and a reference scan with no orphan caller.
- **Files**: exactly those enumerated by Steps 3.1–3.3 and T016–T021, including explicit test and task evidence paths above.
- **Tasks**: extend adversarial/registry tests before docs or final validation; run tests before recording counts; run exact reference scan before T021.
- **Verify**: `gate_cmd: npm test`; `display_cmd: npm test -- --reporter=verbose`. Reference check: `gate_cmd: git diff --check`; `display_cmd: git diff --stat`.
- **Knowledge**: update `tasks/make-decision-audit/progress.md`, `tasks/make-decision-audit/apply/phase-3.md`, `tasks/make-decision-audit/reviews/build-code-verifier.md`, and `tasks/make-decision-audit/reviews/verify-code-verifier.md`; record unavailable metrics as `unknown`, never zero.
- **STOP**: T021 always pauses for explicit human release validation. Plan review pass is evidence only and cannot authorize apply, merge, release, or irreversible action.
- **Boundary/failure handling**: any failing test, missing consumer, stale doc reference, unmeasured metric mislabeled as numeric, or uncovered AC/FR blocks handoff; rollback is commit-level and preserves review/evidence records.

**Code standard**: apply must follow repository `CLAUDE.md` and existing lint rules only. Any lint error is a hard failure; warnings remain visible and are not silently promoted to pass.

**DO NOT TOUCH / DO NOT ADD**:

- 不恢复 R10 或其 resolver/creator、显式 base、dirty/ahead human gate 扩展。
- 不新增第六 stage，不改变 canonical stage 集合。
- 不新增服务、数据库、事件总线、第三方依赖或 CI 阻断 gate。
- 不让 adapter、stage-result、validator、facts assembly 生成第二个 verdict。
- 不把 Multica 专有依赖放入 generic core。
- 不以 journal 反推 expected topology，不以空 ledger 计算 100% coverage。
- 不修改与五阶段 topology、审计/lineage 合同、消费者迁移、fixtures/docs 无关的产品功能。

## F10 Anti-Over-Engineering Gate

Applied to every new mechanism proposed in this plan before finalizing.

| Mechanism | Q1: What real threat does this defend against? | Q2: Does any existing mechanism already cover it? | Q3: Can it be bypassed? | Q4: What is the long-term maintenance cost? | Keep? |
|---|---|---|---|---|---|
| 五份 canonical `steps.json` + loader | 现有隐式/混合编号会让整步遗漏无法被发现 | receipt/journal 只记录 observed，不能声明 expected；复用现有 stage 目录与 schema 模式 | 若 executor 自报 expected 可绕过；aggregator 强制只读 manifest 后不可静默绕过 | 维护 5 个小 manifest 与 validator tests；与 SKILL 同目录控制漂移 | KEEP |
| immutable requirement ledger + hash/stale | 阶段交接丢需求、上游变化后旧产物继续假绿 | 现有 receipt 仅覆盖步骤事实，不覆盖 requirement lineage | 若消费者自己算 coverage 可绕过；aggregator 只接 canonical ledger 并校验 hash | 一个窄 schema/core 模块与 fixtures；收益覆盖 R1–R9 保真 | KEEP |
| Multica adapter + canonical source input | 平台 source 不完整/平台字段污染 core | 无统一平台/离线输入边界；复用现有 Node.js/core 模式 | adapter 可提交空 ledger 时可绕过；`SOURCE_INCOMPLETE` + core completeness 校验封闭该路径 | 一个薄 adapter，平台变更局限于边界 | KEEP |
| canonical audit summary schema | 三个消费者独立裁决导致冲突 verdict | 现有 aggregator 可 P2 扩展；不新增第二引擎 | 消费者重算可绕过；合同测试禁止并校验 summary hash | 扩展既有 aggregator/schema/tests，维护面低于多权威 | KEEP |
| 五阶段 receipt/journal wiring 与同 attempt 校验 | SKILL 无逐步 entry/exit 调用，跨 attempt 拼接会把缺证据误判完成 | 现有 `receipt-writer`、journal 与 identity schema 可 P2 改造，无需新记录系统 | executor 可漏调用；manifest-vs-observed 对账会把遗漏明确判为 non-pass，不能静默假绿 | 修改五份 SKILL 边界与既有 tests，随步骤变更同步维护 | KEEP |
| stage-result/validator/facts summary-ref/hash 校验 | 三类消费者可能引用不同或篡改后的 verdict，造成结果漂移 | 复用既有 validator、facts assembly 与 aggregator summary，不新增消费者框架 | caller 若绕过 validator 仍可读旧结果；canonical contract 与迁移测试使绕过可观察且不能产生受认可 pass | 两个既有模块与合同测试的小幅维护，低于维护三套裁决 | KEEP |
| 8-consumer evidence matrix / reuse registry | 无证据抽取共享机制会制造伪复用，遗漏 caller 会使迁移不完整 | 既有 reuse-registry tests 可扩展；新增物是文档化 matrix，不造运行时系统 | 文档可过期；8/8 完整性测试和 caller migration review 可发现漂移 | 一份小型文档与现有测试更新，新增 consumer 时增一行 | KEEP |
| 实跑测试后的规模/耗时基线采集 | spec 已标明性能目标未知；拍脑袋阈值会产生假精度 | 复用现有 test runner、task evidence 与 metrics collector，不新增监控系统 | 不执行测试会缺数据；明确记 unknown 且 final validation 检查证据，不能零填假绿 | 每次验收记录一次实际值，维护成本低且不设长期 gate | KEEP |
| 对抗 fixtures | duplicate/out-of-order/hash 篡改可能被正常 happy-path 测试漏掉 | 既有 tests/fixtures 可扩展 | 删除 fixture 可绕过测试，但审查与合同可观察；无需新 CI gate | 静态小数据集，随 schema 版本更新 | KEEP |
| 新独立 audit service / database / event bus | 无已观察到需跨进程扩展的威胁 | filesystem journal、receipt 与 aggregator 已覆盖 | 高且会形成更多旁路 | 高、持续运维与迁移成本 | PRUNE |
| 新 CI 阻断 gate | 无证据表明 CI gate 是当前缺失步骤根因 | 既有 test runner、异源审查、人工 gate 已覆盖 | caller 可绕过，易成为 security theatre | 高，易产生 gate 维护与 deadlock | PRUNE |
| 第二套 validator/verdict engine | 无真实威胁；反而制造裁决漂移 | aggregator 已是唯一 authority | 极易被 caller 选用不同结果 | 双倍 schema/逻辑维护 | PRUNE |

**F10 Gate Result**: 12 mechanisms evaluated，9 kept，3 pruned。覆盖计划中的新 mechanism、validation、schema、dependency/automation 与 gate 候选；minimal-path 无 override。所有 KEEP 项均有已观察失败模式且优先 P2 复用；所有 Q1 无具体威胁或 Q4 为高持续成本的候选均已 PRUNE。Step 7 未删除或实质改动 implementation steps/tasks，只补全既有计划项的 F10 记录，因此无需重跑 Steps 2–4。

## M10 Baseline Comparison

| 指标名 | M12 实值 | M10 baseline | delta |
|---|---|---|---|
| missed_step_rate | unknown（仅 upstream make-decision/build-spec 两段已完成且已落盘，全五段值待 verify-code 完成后才可计算） | 0.05 | unknown |
| test_execution_rate | unknown（build-plan 阶段无测试执行数据，待 build-code/verify-code） | 0.8295 | unknown |
| review_execution_rate | unknown（review 阶段尚未执行） | 1 | unknown |
| rework_rounds | unknown（全流程未完成，无返工数据） | 6.075 | unknown |
| rework_proxy_count | unknown（全流程未完成，无代理返工数据） | 25.25 | unknown |

指标偏差仅记录供人工审查，不构成阻断条件；阈值由人设定。本阶段不引用尚未写入的 build-plan 自身 metrics，也不预读 build-code/verify-code metrics。

## Verification Mapping

| Step | Maps to FRs | Verified by AC |
|---|---|---|
| Step 1.1: 冻结五阶段 topology 与旧→新映射 | FR-STRUCTURE-001, FR-COMM-001 | AC-01；FR-COMM-001 GWT |
| Step 1.2: 定义并校验 canonical step manifests | FR-CONTRACT-001, FR-BEHAV-001 | AC-03, AC-04, AC-08 |
| Step 1.3: 建立 requirement ledger 与 source normalization | FR-ALIGN-001, FR-TRACKING-001, FR-CONTRACT-002 | AC-06, AC-07, AC-08 |
| Step 2.1: 接通 entry/exit receipt 与 journal | FR-ARTIFACT-001, FR-BEHAV-001 | AC-04, AC-08 |
| Step 2.2: aggregator 唯一裁决 | FR-REVIEW-001, FR-BEHAV-001, FR-ACCOUNT-001, FR-BUILD-001 | AC-04, AC-05, AC-08 |
| Step 2.3: 迁移结果消费者 | FR-REVIEW-001, FR-ACCOUNT-001, FR-BEHAV-001 | AC-05, AC-08 |
| Step 2.4: consumer/evidence matrix | FR-SCOPETRIAGE-001 | AC-02 |
| Step 3.1: 四层 fixtures 与对抗验证 | FR-BUILD-001, FR-BEHAV-001, FR-CONTRACT-002 | AC-03, AC-04, AC-05, AC-06, AC-07, AC-08 |
| Step 3.2: 合同、迁移与 caller 文档 | FR-COMM-001, FR-CONTRACT-002, FR-SCOPETRIAGE-001 | AC-01, AC-02, AC-07；FR-COMM-001 GWT |
| Step 3.3: 验收、性能基线与影响面核对 | FR-BUILD-001, FR-ACCOUNT-001, FR-COMM-001 | AC-01–AC-08；FR-COMM-001 GWT |

注：上游 spec 的编号验收标准仅为 AC-01–AC-08；文档可用性按 FR-COMM-001 GWT 验证，不创造新 AC 编号。
