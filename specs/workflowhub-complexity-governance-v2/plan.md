# 实现计划：WorkflowHub 复杂度治理与可靠交付

> 基于已接受并经覆盖修订的 spec；本计划把原始方案的迁移顺序、逐项删除、测试和治理要求变成可执行边界。

- **Input**：`specs/workflowhub-complexity-governance-v2/spec.md`
- **Status**：Draft
- **Template version**：`plan-task.v3`

## 1. 速读卡

- **Goal**：保留五阶段和质量硬门，把 33 个公开命令、多套恢复状态和重复事实投影收敛为七行为 facade、单一材料修订、追加质量事实、派生发布与两个发布单元。
- **Non-goals**：不删五阶段；不降低 TaskHandle、原子写、新鲜测试、逐 AC、独立审查、人工确认或不可逆授权；不重放 KnowledgeDigest/PaperBuilder；不跑十个真实任务。来源：spec 第 10 节。
- **Before**：当前 tree 有 33 个 stage-runtime 命令、分散状态机、源码仓式 Multica closure 和按历史机制增长的测试。
- **After**：普通材料可直接修订；正式结果只由当前 tree 和新鲜质量事实派生；确认删除的机制垂直归零；Bundle/Runner 可独立 clean install；最终结构和测试按稳定职责组织。
- **Main risk**：隐藏 consumer 或唯一负向 oracle 被误删。
- **Next step**：Phase 0 只生成 inventory、复杂度基线和 deletion proof；任何缺证候选 KEEP。

## 2. Technical Context and Constraints

- **Language / runtime**：Node.js v24.14.0；ESM。
- **Primary dependencies**：ajv 8.17.1、js-yaml 4.1.0；Vitest 2.1.9 和 markdownlint-cli2 仅开发验证。
- **Storage / state**：TaskHandle 管理 task namespace、create-only/atomic/CAS；四材料与质量事实分层。
- **Testing**：`./node_modules/.bin/vitest` 做 focused；`npm test` 做 full；`npm run check` 做 Markdown/structure/closure/dispatch，三者不可互相冒充。
- **Target environment**：本地 Runner Release 与 Multica Skill Bundle；空目录 clean install。
- **Project type**：可搬运 Skill + 本地受控 Runner。
- **Performance goals**：spec FR-MET-001 的软预算；硬门为专用恢复=0、双写=0、Bundle 禁止内容=0、未分类文件=0。
- **Scale / scope**：当前 Git tracked 全树；Phase 0 重新统计，不沿用 Downloads 数字作当前事实。
- **Relevant ADR / context**：`CONSTITUTION.md`、`CONTEXT.md`、accepted decision、原始方案 SHA-256 `493c1b3757e9cc2be37e59e5e8f4fc16ade3ae0208ec2692e2d4f4084d1ec767`。
- **Unresolved facts**：每个删除候选最终 disposition、真实旧任务逐项处置结果、迁移 fixture 证明结果和最终 move-map；均有明确 STOP/确认门，不由计划猜测。

### Global Constraints

- 五阶段、三处正常确认、独立审查和不可逆授权边界不变。
- 删除证明缺项即 KEEP；每个删除切片保留独立 diff、证据和可回退边界；未获关闭授权不得自行 commit。
- 先切单写和工作许可，再删机制；先删机制再删对应测试；最后才搬目录。
- required review unavailable 或严重 finding 未处置时不可正式完成。
- 业务任务执行前后必须证明 WorkflowHub 源码树 tracked/untracked 内容哈希不变；测试使用 clean-install 只读 Runner、合成任务和干净临时目录。

## 3. Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"CONSTITUTION.md","hash":"a4c63f0c3865fdc2ea83b1f2aea0a824608f65512a27a21e05a58e2d80e16001","id":"WORKFLOWHUB-CONSTITUTION","version":"2026-07-30","clause_count":21}`

### Framework Principles

- [x] F1 薄核心：七行为 facade，内部证据写入不公开。
- [x] F2 窄契约：质量事实、材料修订、publication 三个深模块。
- [x] F3 四材料推进：历史记录不作编辑许可。
- [x] F4 异源审查：原 verdict 保留，finding 可修复。
- [x] F5 gate 谨慎：只保留质量硬门和删除证明。
- [x] F6 外置记录：正式事实仍在 TaskHandle。
- [x] F7 确认与授权分离：T021/T056 不推断 Git 权限。
- [x] F8 简单优先：不建第二编排平台。
- [x] F9 可证伪：3 E2E、5 mutation、故障注入。
- [x] F10 真实收益：每个新模块回答 consumer、替代、维护和删除条件。

### Quality Principles

- [x] Q1 质量事实不作准入证。
- [x] Q2 推进、结构和完成谓词分离。
- [x] Q3 最终三方审查和人工确认。

### Skill Principles

- [x] S1 复用 TaskHandle、wh-review、现有 revision。
- [x] S2 只做合宪适配。
- [x] S3 同 tree 运行校验。
- [x] S4 静态复杂度报告，不造 runtime metrics。
- [x] S5 重读量交给子代理。
- [x] S6 已吸收下载方案第 3 节记录的历史三方盲审；它是调研来源，不冒充本次最终审查。
- [x] S7 五阶段各一 workflow。
- [x] S8 Bundle 可搬运且不绑本机路径。

**Result**：21/21 addressed；无宪法 blocker。

## 4. Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| Project rules | AGENTS.md, CLAUDE.md | change | T053 | 写稳定 ownership，去重复 |
| Workflow contracts | workflows/*/SKILL.md | change | T006, T018 | 只消费 facade/current facts |
| Review contracts | skills/wh-review | change | DEL-02 slices, T055 | 保留独立审查，删除 lineage 状态 |
| Schemas and events | runtime/schemas | change | T006, T010, T016 | 收敛到稳定事实族 |
| Runtime configuration | package.json, runtime | change | T008, T052 | 双发布与机械搬迁 |
| Knowledge and docs | CONTEXT, README, ADR | change | T053 | 同步最终真实结构 |
| Automation gates | tests, architecture tools | change | T001, T049, T054 | focused/full/clean-install |

## 5. Technical Decisions

### DEC-001 — 复用现有 material revision，不造 v2 状态机

- **Problem**：现有 revision 与多个 current selector 并存。
- **Options**：扩展现有 revision / 新建统一状态机 / 保留多 selector。
- **Selected**：extend `task-material-revision.v1`，质量事实另用稳定 envelope。
- **Reason**：已有 CAS/幂等实现和真实 consumer。
- **Consequence / risk**：需一次原子 writer cutover。
- **Fallback**：切换 diff 整体 revert。
- **F10 real threat**：N/A — 不是 new。
- **F10 existing cover**：现有 TaskHandle 与 revision tests。
- **F10 bypassable**：writer cutover 和双写审计共同保护。
- **F10 maintenance cost**：减少专用恢复状态。
- **F10 disposition**：simplify。

### DEC-002 — 七行为 facade + 两个发布单元

- **Problem**：33 个公共命令泄露内部修复状态，Multica closure 夹带源码仓内容。
- **Options**：七行为 facade / 保持命令 / 无 Runtime。
- **Selected**：new facade，reuse TaskHandle/wh-review；Bundle 与 Runner 两单元。
- **Reason**：减少公共认知面，同时保留正式写和审查。
- **Consequence / risk**：wrapper 可能长期双轨；Phase 5 必须删除旧入口。
- **Fallback**：Phase 1 可单独删除 facade。
- **F10 real threat**：真实任务因内部命令和 checkpoint 组合阻塞。
- **F10 existing cover**：旧 CLI 可提供底层行为。
- **F10 bypassable**：Skill closure 和 public export audit。
- **F10 maintenance cost**：七个稳定行为、两个小 manifest。
- **F10 disposition**：keep。

### DEC-003 — 删除和搬迁分离

- **Problem**：目录整齐可能掩盖仍在的机制。
- **Options**：先搬 / 先删 / 大重写。
- **Selected**：Phase 5 垂直删除，Phase 8 机械移动。
- **Reason**：每个行为变化独立可证、可回滚。
- **Consequence / risk**：计划较长，但不会把质量和路径变化混在一起。
- **Fallback**：任一切片 KEEP，不阻止其他已证明切片。
- **F10 real threat**：N/A — 无新机制。
- **F10 existing cover**：inventory/proof/move-map。
- **F10 bypassable**：用户逐项确认。
- **F10 maintenance cost**：一次性迁移成本。
- **F10 disposition**：remove。

## 6. Solution Design

### Overview

普通 stage 读取当前 decision/spec/plan/tasks 并通过七行为 facade 调用 Runner。Material revision 记录四材料和 requirements ledger/coverage 的一次当前身份；quality facts 追加测试、AC、review、confirmation、authorization；publication 在当前 tree 上确定性选择新鲜事实。真实旧任务先做只读 inventory，再由用户逐项确认导入、归档或拒绝；临时 importer 只为迁移证明存在，证明后立即删除，绝不双写或保留兼容期。

Phase 0 先生成每文件 inventory 和 proof。Phase 1–4 建立并切换新模型。Phase 5 只有用户逐项确认后才按 12 个独立切片删除。Phase 3 迁移证明后即时删除脚手架，Phase 6 全局复核归零，Phase 7 精简测试，Phase 8 才机械搬目录，Phase 9 做 clean install、三方审查和最终用户确认。

### Module responsibilities

#### Material revision

- **Responsibility**：四材料与 requirements/coverage 的单一当前 revision。
- **Consumes**：TaskHandle identity、当前材料 bytes/hash。
- **Produces**：parent-bound immutable revision。
- **Must not decide**：测试、review 或正式完成。

#### Quality facts

- **Responsibility**：追加测试、AC、review、confirmation、authorization。
- **Consumes**：当前材料/tree 身份。
- **Produces**：不可变事实及 freshness 结果。
- **Must not decide**：材料能否继续编辑。

#### Publication

- **Responsibility**：按五阶段完成谓词原子发布当前结果。
- **Consumes**：当前 revision/tree 与新鲜质量事实。
- **Produces**：complete/incomplete/fail-loud 结果。
- **Must not decide**：不可逆 Git 操作权限。

#### Distribution

- **Responsibility**：Skill Bundle 和 Runner Release。
- **Consumes**：五 workflow、skill deps、runner contract。
- **Produces**：洁净 Bundle、可安装 Runner。
- **Must not decide**：业务 task 状态。

### Conditional contracts

- **UI**：N/A — CLI/Skill 编排项目，无图形界面。
- **Externally maintained code**：3rd-review provider 只通过 wh-review seam；不 vendoring provider 实现。

## 7. Data Model and Lifecycle

- MaterialRevision：parent_ref/hash、四材料 ref/hash、requirements ledger/coverage、changed_files、source；create-only + CAS。
- QualityFact：kind、subject task/stage/tree/material、result、source tool/provider；create-only。
- Publication：stage、current identity、satisfied、missing、status；可重建，写入原子。
- DeletionProof：consumer、quality_semantic、replacement、before_after_oracle、fault_injection、Multica、legacy、rollback、user_decision；普通计划/evidence，不建 lifecycle。
- LegacyImport：source schema/hash、task identity、四材料、requirements、原始 facts；相同输入同 identity。
- 状态转换：draft/edit → material revision；quality action → fact；verify → publication；Git authorization 独立。
- 无效转换：旧事实授予当前完成、双写、缺 Runner 正式写、未确认删除。

## 8. API Contract

- CLI stable behaviors：doctor/status/run/review/verify/confirm/authorize。
- Bundle fields：runner_contract_major positive integer；runner_contract_min_minor nonnegative integer。
- Runner fields：runner_contract_major positive integer；runner_contract_minor nonnegative integer。
- Compatibility：major equal && runner minor >= bundle min；其他 fail-loud，仅允许非正式草拟。
- Legacy import：只接受 spec FR-LEG-001 最小格式；未知/冲突/损坏/双写要求均拒绝。

## 9. File Boundary

> 本节是各 Phase.Files 的派生并集。

### NEW

- `tools/architecture/inventory.mjs`
- `tools/architecture/complexity-report.mjs`
- `tools/architecture/deletion-proof.mjs`
- `docs/architecture/repository-inventory.tsv`
- `docs/architecture/complexity-baseline.json`
- `docs/architecture/deletion-plan.json`
- `tests/contract/repository-inventory.test.mjs`
- `tests/contract/deletion-proof.test.mjs`
- `core/runtime-facade.mjs`
- `core/runner-contract.mjs`
- `core/skill-bundle-release.mjs`
- `core/runner-release.mjs`
- `schemas/runner-release.schema.json`
- `tests/contract/runtime-facade.test.mjs`
- `tests/contract/runner-contract.test.mjs`
- `tests/integration/distribution-closure.test.mjs`
- `tests/integration/runner-clean-install.test.mjs`
- `core/material-revision.mjs`
- `core/quality-fact.mjs`
- `core/freshness.mjs`
- `core/completion-predicates.mjs`
- `core/publication.mjs`
- `schemas/quality-fact.v1.json`
- `schemas/publication.v1.json`
- `tests/contract/stage-completion.test.mjs`
- `tests/integration/material-revision.test.mjs`
- `tests/integration/derived-publication.test.mjs`
- `tests/integration/atomic-write-faults.test.mjs`
- `docs/architecture/legacy-task-inventory.json`
- `docs/architecture/legacy-import-proof.json`
- `tools/architecture/verify-migration-proof.mjs`
- `tests/e2e/five-stage-normal.test.mjs`
- `tests/e2e/five-stage-material-revision.test.mjs`
- `tests/e2e/five-stage-idempotent-resume.test.mjs`
- `tests/helpers/read-only-runner-fixture.mjs`
- `tests/integration/progression-without-permits.test.mjs`
- `tools/architecture/reference-audit.mjs`
- `tests/integration/deletion-slices-summary.test.mjs`
- `tests/integration/deletion-grill-replacement.test.mjs`
- `tests/integration/deletion-phase-trace.test.mjs`
- `tests/integration/deletion-invalidation.test.mjs`
- `tests/integration/deletion-continuation.test.mjs`
- `tests/integration/deletion-rebind.test.mjs`
- `tests/integration/deletion-reopen.test.mjs`
- `tests/integration/deletion-stage-recovery.test.mjs`
- `tests/integration/deletion-recovery-workspace.test.mjs`
- `tests/integration/deletion-duplicate-projection.test.mjs`
- `tests/integration/deletion-transition-journal.test.mjs`
- `tests/integration/deletion-shadow-checkpoint.test.mjs`
- `tests/integration/deletion-obsolete-tools.test.mjs`
- `tests/contract/legacy-zero.test.mjs`
- `tools/architecture/test-disposition.mjs`
- `docs/architecture/test-disposition.tsv`
- `tests/contract/test-disposition.test.mjs`
- `tests/fixtures/mutations/identity-tree-hash.json`
- `tests/fixtures/mutations/missing-completion.json`
- `tests/fixtures/mutations/review-major.json`
- `tests/fixtures/mutations/confirmation-authorization.json`
- `tests/fixtures/mutations/bundle-pollution.json`
- `tests/integration/mutation-guards.test.mjs`
- `runtime/evidence/.gitkeep`
- `tests/integration/core-artifact-dir.test.mjs`
- `tests/integration/core-canonical-review-result.test.mjs`
- `tests/integration/core-capability-doctor.test.mjs`
- `tests/integration/core-check-anti-host.test.mjs`
- `tests/integration/core-check-contract.test.mjs`
- `tests/integration/core-check-extensibility.test.mjs`
- `tests/integration/core-check-skill-closure.test.mjs`
- `tests/integration/core-invocation-identity.test.mjs`
- `tests/integration/core-kernel.test.mjs`
- `tests/integration/core-local-skill-resolver.test.mjs`
- `tests/integration/core-protected-paths.test.mjs`
- `tests/integration/core-receipt-writer.test.mjs`
- `tests/integration/core-resolve-path.test.mjs`
- `tests/integration/core-run-checks.test.mjs`
- `tests/integration/core-skill-static-deps.test.mjs`
- `tests/integration/core-stage-acceptance-policy.test.mjs`
- `tests/integration/core-stage-context.test.mjs`
- `tests/integration/core-stage-skill-runtime.test.mjs`
- `tests/integration/core-storage-root.test.mjs`
- `tests/integration/core-task-handle.test.mjs`
- `tests/integration/core-task-identity.test.mjs`
- `tests/integration/core-task-kernel-security.test.mjs`
- `tests/integration/core-task-runner-root-migration.test.mjs`
- `tests/integration/core-task-target-repo-migration.test.mjs`
- `tests/integration/core-validate-contract.test.mjs`
- `tests/integration/core-workspace-runner.test.mjs`
- `runtime/evidence/audit-summary-carrier.mjs`
- `runtime/evidence/boundary-confirm.mjs`
- `runtime/review/canonical-review-result.mjs`
- `runtime/evidence/canonical-source.mjs`
- `runtime/evidence/canonical-utils.mjs`
- `runtime/evidence/capability-doctor.mjs`
- `runtime/evidence/check-skill-closure.mjs`
- `runtime/evidence/fact-collector.mjs`
- `runtime/task/git-worktree-snapshot.mjs`
- `runtime/evidence/invocation-identity.mjs`
- `runtime/evidence/kernel.mjs`
- `runtime/adapters/local-skill-resolver.mjs`
- `runtime/evidence/protected-paths.mjs`
- `runtime/evidence/receipt-writer.mjs`
- `runtime/evidence/requirement-ledger.mjs`
- `runtime/adapters/resolve-path.mjs`
- `runtime/review/review-flow-authority.mjs`
- `runtime/review/review-result-consumer.mjs`
- `runtime/evidence/runner-identity.mjs`
- `runtime/schemas/ambiguity-ledger.v1.json`
- `runtime/schemas/ambiguity-ledger.v2.json`
- `runtime/schemas/bootstrap-review.v1.json`
- `runtime/schemas/browser-qa-evidence.v1.json`
- `runtime/schemas/decision-correction-appendix.v1.json`
- `runtime/schemas/decision-coverage-audit.v1.json`
- `runtime/schemas/decision-entry.v1.json`
- `runtime/schemas/decision-log-contract.v1.json`
- `runtime/schemas/decision-omission-acceptance.v1.json`
- `runtime/schemas/plan-task-contract.v1.json`
- `runtime/schemas/plan-task-contract.v2.json`
- `runtime/schemas/risk-acceptance.v1.json`
- `runtime/schemas/runner-replacement-bootstrap-provider-config.v1.json`
- `runtime/schemas/runner-replacement-bootstrap-sealed-bundle.v1.json`
- `runtime/schemas/runner-replacement-bootstrap-test-receipt.v1.json`
- `runtime/schemas/runner-replacement-path-coverage-map.v1.json`
- `runtime/schemas/stage-completion-facts.v1.json`
- `runtime/schemas/stage-content-evidence.v1.json`
- `runtime/schemas/stage-skill-invocation.v1.json`
- `runtime/schemas/task-material-revision.v1.json`
- `runtime/evidence/skill-static-deps.mjs`
- `runtime/stage/stage-acceptance-policy.mjs`
- `runtime/stage/stage-content-contracts.mjs`
- `runtime/review/stage-review-disposition.mjs`
- `runtime/stage/stage-skill-runtime.mjs`
- `runtime/stage/step-manifest.mjs`
- `runtime/evidence/storage-root.mjs`
- `runtime/task/task-identity.mjs`
- `runtime/task/task-kernel.mjs`
- `runtime/evidence/text-utils.mjs`
- `runtime/evidence/validate-contract.mjs`
- `runtime/task/workspace-runner.mjs`
- `runtime/evidence/write-boundary-preflight.mjs`
- `runtime/schemas/audit-summary.schema.json`
- `runtime/schemas/human-confirmation.v1.schema.json`
- `runtime/schemas/requirement-ledger.schema.json`
- `runtime/schemas/requirements-coverage.schema.json`
- `runtime/schemas/review-bundle.schema.json`
- `runtime/schemas/skill-bundle.schema.json`
- `runtime/schemas/skill-catalog.schema.json`
- `runtime/schemas/skills-inventory.schema.json`
- `runtime/schemas/source-manifest.schema.json`
- `runtime/schemas/stage-skill-deps.schema.json`
- `runtime/schemas/steps.schema.json`
- `runtime/schemas/task-accepted.v2.schema.json`
- `runtime/schemas/task-attempt.v2.schema.json`
- `tests/integration/scripts-canonical-archive-skill-dispatch.test.mjs`
- `tests/integration/scripts-ci-chain-check.test.mjs`
- `tests/integration/scripts-migrate-task-v2.test.mjs`
- `tests/integration/scripts-run-wh-review-audit-e2e.test.mjs`
- `tests/integration/scripts-run-wh-review-provider-smoke.test.mjs`
- `tests/integration/scripts-runner-replacement-bridge.test.mjs`
- `tests/integration/scripts-runner-unbinding-migration.test.mjs`
- `tests/integration/scripts-smoke-local-skill-dispatch.test.mjs`
- `tests/integration/scripts-stage-runtime-acceptance-publication.test.mjs`
- `tests/integration/scripts-stage-runtime-five-stage-e2e.test.mjs`
- `tests/integration/scripts-task-bootstrap.test.mjs`
- `tools/cli/audit-aggregate.mjs`
- `tools/cli/check-anti-host.mjs`
- `tools/cli/check-contract.mjs`
- `tools/cli/check-extensibility.mjs`
- `tools/cli/check-metrics-schema.mjs`
- `tools/cli/check-stage-quality.mjs`
- `tools/cli/check-task-record-paths.mjs`
- `tools/cli/ci-chain-check.mjs`
- `tools/cli/collect-task-facts.mjs`
- `tools/cli/migrate-task-v2.mjs`
- `tools/cli/noop.mjs`
- `tools/cli/phase-gate.mjs`
- `tools/cli/requirements-ledger.mjs`
- `tools/cli/run-checks.mjs`
- `tools/cli/run-wh-review-audit-e2e.mjs`
- `tools/cli/run-wh-review-provider-smoke.mjs`
- `tools/cli/scan-core-files.mjs`
- `tools/cli/smoke-local-skill-dispatch.mjs`
- `tools/cli/source-manifest.mjs`
- `tools/cli/task-bootstrap.mjs`
- `tools/cli/task-migrate-runner-root.mjs`
- `tools/cli/task-migrate-target-repo.mjs`
- `tools/cli/validate-field-mapping.mjs`
- `tools/cli/verify-structure.mjs`
- `runtime/interface/runtime-facade.mjs`
- `runtime/interface/runner-contract.mjs`
- `runtime/distribution/skill-bundle-release.mjs`
- `runtime/distribution/runner-release.mjs`
- `runtime/task/material-revision.mjs`
- `runtime/evidence/quality-fact.mjs`
- `runtime/evidence/freshness.mjs`
- `runtime/stage/completion-predicates.mjs`
- `runtime/stage/publication.mjs`
- `runtime/schemas/runner-release.schema.json`
- `runtime/schemas/quality-fact.v1.json`
- `runtime/schemas/publication.v1.json`
- `docs/architecture/move-map.json`
- `runtime/schemas/repository-structure.v1.json`
- `tests/contract/repository-governance.test.mjs`
- `docs/architecture/final-complexity-report.json`
- `docs/architecture/final-coverage-audit.md`
- `tests/e2e/release-acceptance.test.mjs`
- `tests/integration/final-review-facts.test.mjs`
- `tests/contract/final-coverage.test.mjs`
- `tools/architecture/clean-install.mjs`
- `tools/architecture/verify-final-coverage.mjs`

### MODIFY

- `package.json`
- `.gitignore`
- `schemas/skill-bundle.schema.json`
- `scripts/stage-runtime.mjs`
- `core/check-skill-closure.mjs`
- `workflows/make-decision/SKILL.md`
- `workflows/build-spec/SKILL.md`
- `workflows/build-plan/SKILL.md`
- `workflows/build-code/SKILL.md`
- `workflows/verify-code/SKILL.md`
- `workflows/make-decision/skill-deps.yaml`
- `workflows/build-spec/skill-deps.yaml`
- `workflows/build-plan/skill-deps.yaml`
- `workflows/build-code/skill-deps.yaml`
- `workflows/verify-code/skill-deps.yaml`
- `core/task-kernel-implementation.mjs`
- `core/stage-content-contracts.mjs`
- `core/stage-skill-invocation.mjs`
- `core/stage-completion-facts.mjs`
- `core/canonical-receipt-writer.mjs`
- `core/receipt-schema.mjs`
- `core/task-handle.mjs`
- `core/task-kernel.mjs`
- `core/material-revision.mjs`
- `core/skill-bundle-release.mjs`
- `core/runner-release.mjs`
- `scripts/task-bootstrap.mjs`
- `docs/architecture/repository-inventory.tsv`
- `docs/architecture/deletion-plan.json`
- `core/legacy-reader.mjs`
- `tools/migrations/import-legacy-task.mjs`
- `schemas/legacy-import.v1.json`
- `tests/integration/legacy-import-proof.test.mjs`
- `tests/fixtures/legacy-supported.json`
- `tests/fixtures/legacy-missing-identity.json`
- `tests/fixtures/legacy-hash-conflict.json`
- `tests/fixtures/legacy-current-conflict.json`
- `tests/fixtures/legacy-unknown-source.json`
- `core/stage-context.mjs`
- `core/stage-handlers.mjs`
- `core/stage-acceptance-policy.mjs`
- `core/git-checkpoint.mjs`
- `core/task-close.mjs`
- `scripts/task-close.mjs`
- `docs/architecture/complexity-baseline.json`
- `tools/architecture/deletion-proof.mjs`
- `tools/architecture/inventory.mjs`
- `tools/architecture/complexity-report.mjs`
- `CONTEXT.md`
- `README.md`
- `core/stage-content-evidence.mjs`
- `core/schemas/interaction-completion.v1.json`
- `tests/stage-content-evidence.test.mjs`
- `scripts/task-recovery.mjs`
- `workflows/build-code/phase-evidence.mjs`
- `skills/wh-review/contracts/build-code.md`
- `skills/wh-review/scripts/integration-review-subject.mjs`
- `skills/wh-review/scripts/phase-review-subject.mjs`
- `skills/wh-review/scripts/review-controller.mjs`
- `tests/build-code-phase-evidence.test.mjs`
- `core/audit-aggregator.mjs`
- `scripts/validate-stage-replay.mjs`
- `core/__tests__/task-kernel-publish.test.mjs`
- `scripts/__tests__/stage-runtime-recover-run.test.mjs`
- `core/task-recovery.mjs`
- `core/workspace.mjs`
- `tests/stage-content-continuation.test.mjs`
- `core/stage-runner.mjs`
- `core/__tests__/task-recovery.test.mjs`
- `core/artifact-dir.mjs`
- `tests/stage-orchestrator-v2.test.mjs`
- `core/build-spec-receipt-recovery.mjs`
- `core/schemas/workflowhub-recovery-credential.v1.json`
- `core/schemas/workflowhub-recovery-generation.v1.json`
- `scripts/__tests__/stage-runtime-spec-recovery.test.mjs`
- `scripts/__tests__/task-recovery.test.mjs`
- `core/runtime-mode.mjs`
- `scripts/runtime-cutover.mjs`
- `core/__tests__/workspace-manager.test.mjs`
- `core/__tests__/runtime-mode.test.mjs`
- `tests/five-stage-facts-v2.test.mjs`
- `tests/m14b-fact-collection.test.mjs`
- `core/journal-appender.mjs`
- `core/journal-schema.mjs`
- `core/chain-topology.mjs`
- `core/fact-indexes.mjs`
- `tests/five-stage-audit-e2e.test.mjs`
- `tests/audit-aggregator.test.mjs`
- `tests/audit-p2.test.mjs`
- `tests/final-cutover-guards.red.test.mjs`
- `tests/task-close-delivery.test.mjs`
- `core/dispatch-component.mjs`
- `core/resolve-component.mjs`
- `core/task-index.mjs`
- `core/load-config.mjs`
- `core/parse-framework-config.mjs`
- `workflows/_spike/design-variant.mjs`
- `workflows/_spike/design.mjs`
- `workflows/_spike/intake.mjs`
- `core/__tests__/task-index.test.mjs`
- `core/__tests__/load-config.test.mjs`
- `core/__tests__/parse-framework-config.test.mjs`
- `tests/spike-intake-design.test.mjs`
- `vitest.config.mjs`
- `tests/helpers/runner-fixture.mjs`
- `core/completion-predicates.mjs`
- `core/__tests__/artifact-dir.test.mjs`
- `core/__tests__/canonical-review-result.test.mjs`
- `core/__tests__/capability-doctor.test.mjs`
- `core/__tests__/check-anti-host.test.mjs`
- `core/__tests__/check-contract.test.mjs`
- `core/__tests__/check-extensibility.test.mjs`
- `core/__tests__/check-skill-closure.test.mjs`
- `core/__tests__/invocation-identity.test.mjs`
- `core/__tests__/kernel.test.mjs`
- `core/__tests__/local-skill-resolver.test.mjs`
- `core/__tests__/protected-paths.test.mjs`
- `core/__tests__/receipt-writer.test.mjs`
- `core/__tests__/resolve-path.test.mjs`
- `core/__tests__/run-checks.test.mjs`
- `core/__tests__/skill-static-deps.test.mjs`
- `core/__tests__/stage-acceptance-policy.test.mjs`
- `core/__tests__/stage-context.test.mjs`
- `core/__tests__/stage-skill-runtime.test.mjs`
- `core/__tests__/storage-root.test.mjs`
- `core/__tests__/task-handle.test.mjs`
- `core/__tests__/task-identity.test.mjs`
- `core/__tests__/task-kernel-security.test.mjs`
- `core/__tests__/task-runner-root-migration.test.mjs`
- `core/__tests__/task-target-repo-migration.test.mjs`
- `core/__tests__/validate-contract.test.mjs`
- `core/__tests__/workspace-runner.test.mjs`
- `scripts/__tests__/canonical-archive-skill-dispatch.test.mjs`
- `scripts/__tests__/ci-chain-check.test.mjs`
- `scripts/__tests__/migrate-task-v2.test.mjs`
- `scripts/__tests__/run-wh-review-audit-e2e.test.mjs`
- `scripts/__tests__/run-wh-review-provider-smoke.test.mjs`
- `scripts/__tests__/runner-replacement-bridge.test.mjs`
- `scripts/__tests__/runner-unbinding-migration.test.mjs`
- `scripts/__tests__/smoke-local-skill-dispatch.test.mjs`
- `scripts/__tests__/stage-runtime-acceptance-publication.test.mjs`
- `scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`
- `scripts/__tests__/task-bootstrap.test.mjs`
- `skills/debate/__tests__/skill-contract.test.mjs`
- `skills/diagnosing-bugs/__tests__/skill-contract.test.mjs`
- `skills/isolated-browser-qa/__tests__/skill-contract.test.mjs`
- `skills/review-response/__tests__/skill-contract.test.mjs`
- `skills/test-routing-advisor/__tests__/skill-contract.test.mjs`
- `skills/wh-review/__tests__/human-brief-behavioral.test.mjs`
- `skills/wh-review/scripts/__tests__/ac-evidence-summary.test.mjs`
- `skills/wh-review/scripts/__tests__/integration-review-subject.test.mjs`
- `skills/wh-review/scripts/__tests__/review-controller.test.mjs`
- `skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- `skills/wh-review/scripts/__tests__/review-source-materials.test.mjs`
- `skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs`
- `skills/wh-review/scripts/__tests__/schema-validator.test.mjs`
- `skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`
- `skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs`
- `skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs`
- `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`
- `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- `tests/baseline.test.mjs`
- `tests/boundary-confirm.test.mjs`
- `tests/build-code-capture.test.mjs`
- `tests/build-code-diff-only.test.mjs`
- `tests/build-code-preflight.red.test.mjs`
- `tests/build-code-target.test.mjs`
- `tests/canonical-source.test.mjs`
- `tests/contract-freeze.test.mjs`
- `tests/design-stage-skill-order.red.test.mjs`
- `tests/execution-record.test.mjs`
- `tests/facts-subschema.test.mjs`
- `tests/fixtures/derived-review-provider.mjs`
- `tests/fixtures/interaction-quality/r9-spec-clarify.json`
- `tests/fixtures/step-audit/duplicate.json`
- `tests/fixtures/step-audit/missing.json`
- `tests/fixtures/step-audit/normal.json`
- `tests/fixtures/step-audit/out-of-order.json`
- `tests/fixtures/step-audit/stale.json`
- `tests/fixtures/step-audit/tampered-hash.json`
- `tests/fixtures/step-audit/unexpected.json`
- `tests/fixtures/step-audit/unknown.json`
- `tests/fixtures/template-content-quality/retention-map.json`
- `tests/helpers/formal-review.mjs`
- `tests/helpers/human-confirmation.mjs`
- `tests/host-independence.test.mjs`
- `tests/interaction-quality-contract.test.mjs`
- `tests/knowledge-card.test.mjs`
- `tests/m12-reuse-registry.test.mjs`
- `tests/m12-subskill-exclusion.test.mjs`
- `tests/m12-templates.test.mjs`
- `tests/m14a-audit-contract-layer.test.mjs`
- `tests/metrics-smoke.test.mjs`
- `tests/metrics-taskhandle-v2.test.mjs`
- `tests/moat-skills-phase1.test.mjs`
- `tests/moat-skills-phase2.test.mjs`
- `tests/official-component-receipts.test.mjs`
- `tests/official-make-decision-cli.test.mjs`
- `tests/p0-foundation-contracts.test.mjs`
- `tests/per-invocation-doc-contract.test.mjs`
- `tests/per-invocation-execution-identity.test.mjs`
- `tests/phase-adjudication-correction-scope.test.mjs`
- `tests/phase-gate.test.mjs`
- `tests/requirement-lineage.test.mjs`
- `tests/reuse-registry.test.mjs`
- `tests/skill-provenance-strict.test.mjs`
- `tests/smoke.test.mjs`
- `tests/spec-content-profile.test.mjs`
- `tests/spec-specify-template.test.mjs`
- `tests/stage-completion-facts.test.mjs`
- `tests/stage-content-host-independence.test.mjs`
- `tests/stage-content-publication.test.mjs`
- `tests/stage-decision-contract.test.mjs`
- `tests/stage-interaction-contract.test.mjs`
- `tests/stage-plan-task-contract-v3.test.mjs`
- `tests/stage-plan-task-contract.test.mjs`
- `tests/stage-quality.test.mjs`
- `tests/stage-review-cost-policy.test.mjs`
- `tests/stage-risk-acceptance.test.mjs`
- `tests/step-manifest.test.mjs`
- `tests/task-accepted-schema.test.mjs`
- `tests/task-record-paths-check.test.mjs`
- `tests/template-content-quality-retention.test.mjs`
- `tests/terminal-runtime-blockers.test.mjs`
- `tests/verify-code-capture.test.mjs`
- `tests/verify-code-design-alignment.test.mjs`
- `tests/verify-code-facts.test.mjs`
- `tests/verify-code-freshness.test.mjs`
- `tests/vitest-resource-policy.test.mjs`
- `tests/workflow-v2-contract.test.mjs`
- `workflows/verify-code/phase-1-contract.test.mjs`
- `core/.gitkeep`
- `core/audit-summary-carrier.mjs`
- `core/boundary-confirm.mjs`
- `core/canonical-review-result.mjs`
- `core/canonical-source.mjs`
- `core/canonical-utils.mjs`
- `core/capability-doctor.mjs`
- `core/fact-collector.mjs`
- `core/git-worktree-snapshot.mjs`
- `core/invocation-identity.mjs`
- `core/kernel.mjs`
- `core/local-skill-resolver.mjs`
- `core/protected-paths.mjs`
- `core/receipt-writer.mjs`
- `core/requirement-ledger.mjs`
- `core/resolve-path.mjs`
- `core/review-flow-authority.mjs`
- `core/review-result-consumer.mjs`
- `core/runner-identity.mjs`
- `core/schemas/ambiguity-ledger.v1.json`
- `core/schemas/ambiguity-ledger.v2.json`
- `core/schemas/bootstrap-review.v1.json`
- `core/schemas/browser-qa-evidence.v1.json`
- `core/schemas/decision-correction-appendix.v1.json`
- `core/schemas/decision-coverage-audit.v1.json`
- `core/schemas/decision-entry.v1.json`
- `core/schemas/decision-log-contract.v1.json`
- `core/schemas/decision-omission-acceptance.v1.json`
- `core/schemas/plan-task-contract.v1.json`
- `core/schemas/plan-task-contract.v2.json`
- `core/schemas/risk-acceptance.v1.json`
- `core/schemas/runner-replacement-bootstrap-provider-config.v1.json`
- `core/schemas/runner-replacement-bootstrap-sealed-bundle.v1.json`
- `core/schemas/runner-replacement-bootstrap-test-receipt.v1.json`
- `core/schemas/runner-replacement-path-coverage-map.v1.json`
- `core/schemas/stage-completion-facts.v1.json`
- `core/schemas/stage-content-evidence.v1.json`
- `core/schemas/stage-skill-invocation.v1.json`
- `core/schemas/task-material-revision.v1.json`
- `core/skill-static-deps.mjs`
- `core/stage-review-disposition.mjs`
- `core/stage-skill-runtime.mjs`
- `core/step-manifest.mjs`
- `core/storage-root.mjs`
- `core/task-identity.mjs`
- `core/text-utils.mjs`
- `core/validate-contract.mjs`
- `core/workspace-runner.mjs`
- `core/write-boundary-preflight.mjs`
- `schemas/audit-summary.schema.json`
- `schemas/human-confirmation.v1.schema.json`
- `schemas/requirement-ledger.schema.json`
- `schemas/requirements-coverage.schema.json`
- `schemas/review-bundle.schema.json`
- `schemas/skill-catalog.schema.json`
- `schemas/skills-inventory.schema.json`
- `schemas/source-manifest.schema.json`
- `schemas/stage-skill-deps.schema.json`
- `schemas/steps.schema.json`
- `schemas/task-accepted.v2.schema.json`
- `schemas/task-attempt.v2.schema.json`
- `scripts/audit-aggregate.mjs`
- `scripts/check-anti-host.mjs`
- `scripts/check-contract.mjs`
- `scripts/check-extensibility.mjs`
- `scripts/check-metrics-schema.mjs`
- `scripts/check-stage-quality.mjs`
- `scripts/check-task-record-paths.mjs`
- `scripts/ci-chain-check.mjs`
- `scripts/collect-task-facts.mjs`
- `scripts/migrate-task-v2.mjs`
- `scripts/noop.mjs`
- `scripts/phase-gate.mjs`
- `scripts/requirements-ledger.mjs`
- `scripts/run-checks.mjs`
- `scripts/run-wh-review-audit-e2e.mjs`
- `scripts/run-wh-review-provider-smoke.mjs`
- `scripts/scan-core-files.mjs`
- `scripts/smoke-local-skill-dispatch.mjs`
- `scripts/source-manifest.mjs`
- `scripts/task-migrate-runner-root.mjs`
- `scripts/task-migrate-target-repo.mjs`
- `scripts/validate-field-mapping.mjs`
- `scripts/verify-structure.mjs`
- `core/runtime-facade.mjs`
- `core/runner-contract.mjs`
- `core/quality-fact.mjs`
- `core/freshness.mjs`
- `core/publication.mjs`
- `schemas/runner-release.schema.json`
- `schemas/quality-fact.v1.json`
- `schemas/publication.v1.json`
- `AGENTS.md`
- `CLAUDE.md`
- `CONSTITUTION.md`
- `constitution-checklist.md`
- `skills/catalog.yaml`
- `runtime/distribution/skill-bundle-release.mjs`
- `runtime/distribution/runner-release.mjs`

### DO NOT TOUCH

- `scripts/stage-runtime.mjs`
- `core/task-kernel-implementation.mjs`
- `CONSTITUTION.md`
- `core/task-handle.mjs`
- `core/task-recovery.mjs`
- `scripts/task-recovery.mjs`
- `docs/architecture/legacy-import-proof.json`
- `core/runtime-facade.mjs`
- `core/publication.mjs`
- `tests/e2e/five-stage-normal.test.mjs`
- `tests/e2e/five-stage-material-revision.test.mjs`
- `tests/e2e/five-stage-idempotent-resume.test.mjs`
- `tests/integration/atomic-write-faults.test.mjs`
- `tests/contract/legacy-zero.test.mjs`
- `specs/workflowhub-complexity-governance-v2/decision-log.md`
- `specs/workflowhub-complexity-governance-v2/spec.md`

## 10. Data Flow and Integration

`current materials → material revision → quality facts → deterministic verify → publication → independent Git authorization`

- **Existing modules / packages / services**：TaskHandle、canonical writer、wh-review、ajv/js-yaml。
- **Integration points**：Workflow Skill 调 facade；facade 调 Runner；publication 读 TaskHandle facts；Bundle 声明 Runner contract。
- **Compatibility boundaries**：五阶段名/顺序/确认点、TaskHandle 安全、review verdict、新鲜测试和 AC 语义不变。
- **Fail-loud behavior**：身份/hash/tree/schema/Runner/proof 任一缺失或错配立即停止，不 fallback 到旧状态机。

## 11. Code Anchors and Reuse

### Versioned identity and context projection

- **Spec binding**：`{"artifact_kind":"spec","ref":"specs/workflowhub-complexity-governance-v2/spec.md","hash":"ec5f84e6f9bc25d8c27a0147c8a2cecf957be161c524ba3541796e2ac53ab205","id":"SPEC-WORKFLOWHUB-COMPLEXITY-V2"}`
- **read_now**：stage-runtime public command router；TaskHandle atomic/CAS；material revision；completion facts；review consumer；package/test scripts。
- **must_read_before_task**：每个 deletion slice 的 inventory rows、proof card、before/after oracle；Phase 8 move-map。
- **Context mode**：Full — 全仓结构治理与删除需要 consumer/reverse-reference 证据。

### Verified anchors

| Anchor | Path and symbol | Current responsibility | Intended use | Forbidden change |
| --- | --- | --- | --- | --- |
| A-001 | scripts/stage-runtime.mjs:command router | 33 public commands | extend then shrink | 不在 Phase 1 直接删底层 |
| A-002 | core/task-kernel-implementation.mjs:publishMaterialRevision | material revision CAS | reuse/extend | 不建第二 revision |
| A-003 | core/task-handle.mjs:atomic writers | nofollow/create-only/CAS | reuse | 不降安全 |
| A-004 | core/stage-completion-facts.mjs:buildStageCompletion | completion derivation | simplify | 不让 fact 作工作许可 |
| A-005 | core/review-result-consumer.mjs | review fact consumer | reuse | 不改写 verdict |
| A-006 | core/check-skill-closure.mjs | source closure | extend for release closure | 不冒充 clean install |
| A-007 | `scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs` | current CLI E2E | extract real seam | 不复用 node_modules symlink 作 clean install |

### Reuse → Extend → New

| Capability | Decision | Existing candidates | Reason |
| --- | --- | --- | --- |
| Task identity/atomic write | reuse | TaskHandle | 已有真实安全语义 |
| Material revision | extend | task-material-revision.v1 | 唯一通用 revision |
| Review | reuse/simplify | wh-review consumer | 保留独立质量，删 flow 状态 |
| Public Runtime | new facade | stage-runtime router | 隐藏内部命令 |
| Bundle/Runner packaging | extend | skill closure/package manifest | 需要真实发布物 clean install |
| Deletion proof | new static validator | inventory/reverse refs | 无状态、可删除、无 lifecycle |

### Existing interface signatures

| Signature ID | Object | Verified current signature/schema | Source anchor |
| --- | --- | --- | --- |
| SIG-001 | stage-runtime CLI | command + --stage/--project/--task + command-specific refs | A-001 |
| SIG-002 | task-material-revision.v1 | parent/current refs, material hashes, CAS input | A-002 |
| SIG-003 | review consumer | consumeReviewResult(task, ref, expected) | A-005 |
| SIG-004 | package scripts | npm test; npm run check; check:skill-closure | package.json |

## 12. Rollback and Recovery

- **Global recovery rule**：保留 accepted 产物和历史事实，只恢复当前 Phase 的独立 diff；不新增 recovery 状态。
- **Irreversible boundaries**：每项删除前 T021 用户确认；最终 T056 用户确认；提交、推送、close、worktree 删除仍单独授权。
- **Recovery owner**：build-code owner 按 owning Task 的独立 revert boundary 恢复；需要新架构选择则返回 build-plan。

### Engineering Risk Handoff

- **PLAN-RISK-001**：隐藏 consumer 误删
  - **Affected IDs**：FR-DEL-001、FR-DEL-002、AC-06、AC-07
  - **Trigger**：proof 无运行入口/Bundle/legacy 证据
  - **Consequence**：五阶段或 Multica 失败
  - **Mitigation or STOP**：KEEP；不得扩大删除
  - **Handling Stage**：build-code
  - **Verification**：同一 before/after oracle、reverse refs、3 E2E
- **PLAN-RISK-002**：派生完成过宽
  - **Affected IDs**：FR-PUB-001、FR-PUB-002、AC-03、AC-04
  - **Trigger**：缺/错事实仍 complete
  - **Consequence**：假绿
  - **Mitigation or STOP**：五 mutation 与故障注入任一不红即 STOP
  - **Handling Stage**：build-code
  - **Verification**：T011/T012/T050/T051
- **PLAN-RISK-003**：legacy 残留
  - **Affected IDs**：FR-LEG-001、AC-08
  - **Trigger**：当前任务最终快照仍留 importer 或 legacy 入口
  - **Consequence**：长期双边界
  - **Mitigation or STOP**：迁移证明完成后立即删除；任一证明失败 STOP，不交付脚手架
  - **Handling Stage**：verify-code
  - **Verification**：T015/T016/T047/T048

## 13. Test Strategy

- **Target**：五阶段、材料修订、三类 writer 的完整原子故障矩阵、review/confirmation、Bundle/Runner、12 删除切片、真实旧任务处置、全部 tracked tests。
- **gate_cmd**：各 Task 使用最小 Vitest/Node gate；每个删除 GREEN 还运行 focused、3 条 E2E、full、check、inventory 和 reference audit；Phase 9 在 clean install 中运行 Runner/Bundle、3 条 E2E、5 个 mutation、npm test、npm run check 和 AC-01..AC-15 可执行 coverage validator。
- **expected_exit**：行为 RED=1；paired GREEN=0；非行为 gate=0。
- **evidence_path**：task-relative `evidence/phase-N/...`。
- **display_cmd**：complexity report 可读输出，不决定质量。
- **Oracle ID and result**：ORACLE-* 稳定身份；3 条 E2E 覆盖正常执行、材料中途变化/严重 finding 修复、写入中断/review unavailable 后同输入幂等恢复；5 mutation、三类 writer × temp/fsync/rename/CAS/current 故障、clean install、每 slice 同一负测。

## 14. Implementation Order

严格 producer-before-consumer：inventory/proof → facade/distribution → fact model/publication → writer cutover/legacy → progression E2E → user-confirmed deletion slices → legacy zero audit → test simplification → mechanical move/governance → final review/confirmation。

## Phase 0：冻结基线与逐文件清单

### Goal

在当前 tree 上生成可复算 inventory、复杂度基线和删除证明合同；不删除生产能力。

### Files

- **NEW**：`tools/architecture/inventory.mjs`、`tools/architecture/complexity-report.mjs`、`tools/architecture/deletion-proof.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/complexity-baseline.json`、`docs/architecture/deletion-plan.json`、`tests/contract/repository-inventory.test.mjs`、`tests/contract/deletion-proof.test.mjs`
- **MODIFY**：`package.json`、`.gitignore`
- **DO NOT TOUCH**：`scripts/stage-runtime.mjs`、`core/task-kernel-implementation.mjs`、`CONSTITUTION.md`

### Tasks

- T001 — 生成当前 tree 的 inventory 与复杂度基线
- T002 — 先证明缺字段 deletion proof 会失败
- T003 — 实现 deletion proof 校验与 12 类候选清单
- T004 — 证明 node_modules 只是可重建本地缓存

### Verify

- node tools/architecture/inventory.mjs --check && node tools/architecture/complexity-report.mjs --check-hard-gates

### Knowledge

- 基线数字必须由当前 tree 重算；Downloads 文件只作需求来源。

### STOP

- 任一 tracked file 未分类、删除候选无 consumer/proof 或统计口径不可重算。

### Done

- 全部 tracked file 恰好一个 disposition；12 类候选有 proof 状态；node_modules 未跟踪且可重建。

### Risks and rollback

- **Risk**：错误分类导致后续误删。
- **Prevention**：同一 oracle、精确边界、独立 review 和 STOP。
- **Rollback / recovery**：本 Phase 只有文档/工具，可整体回退。

## Phase 1：窄 Runtime facade 与双发布单元

### Goal

新增七行为 facade 和 Bundle/Runner 合同，底层仍复用旧实现。

### Files

- **NEW**：`core/runtime-facade.mjs`、`core/runner-contract.mjs`、`core/skill-bundle-release.mjs`、`core/runner-release.mjs`、`schemas/runner-release.schema.json`、`tests/contract/runtime-facade.test.mjs`、`tests/contract/runner-contract.test.mjs`、`tests/integration/distribution-closure.test.mjs`、`tests/integration/runner-clean-install.test.mjs`
- **MODIFY**：`schemas/skill-bundle.schema.json`、`scripts/stage-runtime.mjs`、`core/check-skill-closure.mjs`、`package.json`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`workflows/make-decision/skill-deps.yaml`、`workflows/build-spec/skill-deps.yaml`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-code/skill-deps.yaml`、`workflows/verify-code/skill-deps.yaml`
- **DO NOT TOUCH**：`core/task-kernel-implementation.mjs`、`core/task-handle.mjs`

### Tasks

- T005 — 先冻结七行为 facade 和版本错配失败合同
- T006 — 实现七行为 facade 和 Runner 兼容函数
- T007 — 先证明 Bundle/Runner 夹带内容和隐式依赖会失败
- T008 — 实现洁净 Skill Bundle 与 Local Runner Release

### Verify

- ./node_modules/.bin/vitest run tests/contract/runtime-facade.test.mjs tests/contract/runner-contract.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs

### Knowledge

- 七个行为固定为 doctor/status/run/review/verify/confirm/authorize；仅两个发布单元。

### STOP

- facade 需要第八行为但无真实 consumer；clean install 依赖源码仓 node_modules。

### Done

- facade 与两个 release 合同通过，旧实现仍可回退。

### Risks and rollback

- **Risk**：兼容 wrapper 可能长期保留。
- **Prevention**：同一 oracle、精确边界、独立 review 和 STOP。
- **Rollback / recovery**：删除 facade 即恢复旧入口；不改底层 writer。

## Phase 2：单一材料修订与派生发布

### Goal

以现有 task-material-revision 为基座，统一质量事实、freshness、完成谓词和原子 publication；尚不切 writer。

### Files

- **NEW**：`core/material-revision.mjs`、`core/quality-fact.mjs`、`core/freshness.mjs`、`core/completion-predicates.mjs`、`core/publication.mjs`、`core/canonical-evidence-validators.mjs`、`schemas/quality-fact.v1.json`、`schemas/publication.v1.json`、`tests/contract/stage-completion.test.mjs`、`tests/integration/material-revision.test.mjs`、`tests/integration/derived-publication.test.mjs`、`tests/integration/atomic-write-faults.test.mjs`
- **MODIFY**：`core/task-kernel-implementation.mjs`、`core/stage-content-contracts.mjs`、`core/stage-skill-invocation.mjs`、`core/stage-completion-facts.mjs`、`core/canonical-receipt-writer.mjs`、`core/receipt-schema.mjs`、`core/task-handle.mjs`、`core/schemas/task-material-revision.v1.json`、`tests/stage-content-continuation.test.mjs`
- **DO NOT TOUCH**：`scripts/stage-runtime.mjs`、`core/task-recovery.mjs`

### Tasks

- T009 — 先冻结材料修订、质量事实和五阶段完成谓词
- T010 — 实现单一修订、质量事实和派生完成
- T011 — 先注入全部正式 writer 的五类故障
- T012 — 实现全部正式 writer 的原子、并发唯一胜者和幂等

### Verify

- ./node_modules/.bin/vitest run tests/contract/stage-completion.test.mjs tests/integration/material-revision.test.mjs tests/integration/derived-publication.test.mjs tests/integration/atomic-write-faults.test.mjs

### Knowledge

- 保留 TaskHandle nofollow/create-only/CAS；质量事实不作工作许可。

### STOP

- 任一正式写入边界的原子性或旧事实只读投影无法证明；新增第六持久对象族。

### Done

- 材料修订、质量事实和 publication 的纯模型及完整故障矩阵通过，旧 writer 仍是唯一生产 writer。

### Risks and rollback

- **Risk**：派生发布过宽或某类 writer 未穿过真实故障 seam。
- **Prevention**：同一 oracle、精确边界、独立 review 和 STOP。
- **Rollback / recovery**：所有新模块未切生产入口，可整体回退。

## Phase 3：新任务单写与迁移脚手架即时退出

### Goal

新任务只写 vNext；临时 importer 仅对冻结 fixture 和只读真实旧任务 inventory 生成证据，随后在本 Phase 立即删除，禁止双写和长期兼容。

### Files

- **NEW**：`docs/architecture/legacy-task-inventory.json`、`docs/architecture/legacy-import-proof.json`、`tools/architecture/verify-migration-proof.mjs`
- **MODIFY**：`core/task-kernel.mjs`、`core/task-kernel-implementation.mjs`、`core/task-handle.mjs`、`core/material-revision.mjs`、`core/skill-bundle-release.mjs`、`core/runner-release.mjs`、`scripts/task-bootstrap.mjs`、`scripts/stage-runtime.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`docs/architecture/complexity-baseline.json`、`core/legacy-reader.mjs`、`tools/migrations/import-legacy-task.mjs`、`schemas/legacy-import.v1.json`、`tools/architecture/inventory.mjs`、`tests/integration/legacy-import-proof.test.mjs`、`tests/fixtures/legacy-supported.json`、`tests/fixtures/legacy-missing-identity.json`、`tests/fixtures/legacy-hash-conflict.json`、`tests/fixtures/legacy-current-conflict.json`、`tests/fixtures/legacy-unknown-source.json`、`core/__tests__/runtime-mode.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`core/__tests__/task-target-repo-migration.test.mjs`、`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`、`scripts/__tests__/stage-runtime-recover-run.test.mjs`、`scripts/__tests__/stage-runtime-spec-recovery.test.mjs`、`scripts/__tests__/task-recovery.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`tests/build-code-phase-evidence.test.mjs`、`tests/build-code-preflight.red.test.mjs`、`tests/final-cutover-guards.red.test.mjs`、`tests/host-independence.test.mjs`、`tests/m14b-fact-collection.test.mjs`、`tests/moat-skills-phase1.test.mjs`、`tests/official-make-decision-cli.test.mjs`、`tests/stage-orchestrator-v2.test.mjs`、`tests/stage-risk-acceptance.test.mjs`、`tests/workflow-v2-contract.test.mjs`、`scripts/check-task-record-paths.mjs`、`skills/wh-review/skill-bundle.json`、`specs/workflowhub-complexity-governance-v2/plan.md`、`specs/workflowhub-complexity-governance-v2/tasks.md`
- **DO NOT TOUCH**：`core/task-recovery.mjs`、`scripts/task-recovery.mjs`

### Tasks

- T013 — 先证明新任务单写和旧 writer 不可达
- T014 — 原子切换新任务 writer
- T015 — 审计真实旧任务并用冻结 fixture 证明一次性迁移完整性
- T016 — 完成真实旧任务处置证明并立即删除全部 legacy 脚手架

### Verify

- node tools/architecture/verify-migration-proof.mjs --phase-gate --require-real-task-inventory --require-current-tree && node tools/architecture/inventory.mjs --check --require-zero=legacy-runtime

### Knowledge

- 冻结 fixture 必须证明内容不丢、幂等和坏输入拒绝；真实旧任务只读 inventory 必须逐项处置；正式证据落盘后同 Phase 删除 legacy reader/importer/schema/fixture/public entry。仅证明用 verifier 标记为 task-only，并在最终验收前删除。

### STOP

- 任何路径要求旧新双写、导入改变原始事实、真实旧任务仍未处置、迁移证明缺失或最终仍有 legacy 入口。

### Done

- 新任务 writer 单写；真实旧任务已逐项证明处置；迁移证据不可变；源码、CLI、schema、fixture、Bundle、Runner 中 legacy 入口=0。

### Risks and rollback

- **Risk**：切换时新旧 writer 同时可达、旧事实丢失或临时 importer 被误交付。
- **Prevention**：同一 oracle、精确边界、独立 review 和 STOP。
- **Rollback / recovery**：恢复 writer cutover 独立 diff；不得并行启用；失败时保留旧数据但不交付脚手架。

## Phase 4：切断历史推进许可证

### Goal

五阶段普通工作不再读取 checkpoint/reopen/rebind/recovery 等许可；verify/close 只按当前事实。

### Files

- **NEW**：`tests/e2e/five-stage-normal.test.mjs`、`tests/e2e/five-stage-material-revision.test.mjs`、`tests/e2e/five-stage-idempotent-resume.test.mjs`、`tests/helpers/read-only-runner-fixture.mjs`、`tests/integration/progression-without-permits.test.mjs`
- **MODIFY**：`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`core/stage-context.mjs`、`core/stage-handlers.mjs`、`core/stage-acceptance-policy.mjs`、`core/git-checkpoint.mjs`、`core/task-close.mjs`、`scripts/stage-runtime.mjs`、`scripts/task-close.mjs`
- **DO NOT TOUCH**：`core/task-handle.mjs`、`docs/architecture/legacy-import-proof.json`

### Tasks

- T017 — 先证明普通工作仍被历史许可阻塞
- T018 — 切断 checkpoint/reopen/rebind/recovery 工作许可读取
- T019 — 先固定三条完整五阶段恢复 E2E 与源码不可变合同
- T020 — 完成三条合成五阶段恢复 E2E

### Verify

- ./node_modules/.bin/vitest run tests/integration/progression-without-permits.test.mjs tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs

### Knowledge

- 旧 evidence 仅使 verify incomplete，不阻止材料编辑和普通执行；三个 E2E 都从 clean-install 的只读 Runner 运行，前后 WorkflowHub 源码 tree 完全不变。

### STOP

- 任何 stage 仍需专用许可；close 可消费 stale 事实；业务任务需要写 WorkflowHub 源码才能恢复。

### Done

- 3 条 E2E 覆盖正常、材料+质量修复和中断+provider恢复，且 WorkflowHub 源码前后完全不变。

### Risks and rollback

- **Risk**：切断过早导致正式质量门丢失。
- **Prevention**：同一 oracle、精确边界、独立 review 和 STOP。
- **Rollback / recovery**：恢复本 Phase 独立 diff；不恢复双写。

## Phase 5：用户确认后的垂直删除

### Goal

先展示并确认逐项清单；随后 12 个切片各自 RED/GREEN，每项都有独立 diff、证据和恢复边界。

### Files

- **NEW**：`tools/architecture/reference-audit.mjs`、`tests/integration/deletion-slices-summary.test.mjs`、`tests/integration/deletion-grill-replacement.test.mjs`、`tests/integration/deletion-phase-trace.test.mjs`、`tests/integration/deletion-invalidation.test.mjs`、`tests/integration/deletion-continuation.test.mjs`、`tests/integration/deletion-rebind.test.mjs`、`tests/integration/deletion-reopen.test.mjs`、`tests/integration/deletion-stage-recovery.test.mjs`、`tests/integration/deletion-recovery-workspace.test.mjs`、`tests/integration/deletion-duplicate-projection.test.mjs`、`tests/integration/deletion-transition-journal.test.mjs`、`tests/integration/deletion-shadow-checkpoint.test.mjs`、`tests/integration/deletion-obsolete-tools.test.mjs`
- **MODIFY**：`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`docs/architecture/complexity-baseline.json`、`tools/architecture/deletion-proof.mjs`、`tools/architecture/inventory.mjs`、`tools/architecture/complexity-report.mjs`、`CONTEXT.md`、`README.md`、`core/stage-content-evidence.mjs`、`core/task-kernel-implementation.mjs`、`core/schemas/interaction-completion.v1.json`、`workflows/make-decision/SKILL.md`、`tests/stage-content-evidence.test.mjs`、`scripts/stage-runtime.mjs`、`scripts/task-recovery.mjs`、`core/task-handle.mjs`、`workflows/build-code/phase-evidence.mjs`、`workflows/build-code/SKILL.md`、`skills/wh-review/contracts/build-code.md`、`skills/wh-review/scripts/integration-review-subject.mjs`、`skills/wh-review/scripts/phase-review-subject.mjs`、`skills/wh-review/scripts/review-controller.mjs`、`tests/build-code-phase-evidence.test.mjs`、`core/audit-aggregator.mjs`、`scripts/validate-stage-replay.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`scripts/__tests__/stage-runtime-recover-run.test.mjs`、`core/stage-context.mjs`、`core/task-recovery.mjs`、`core/workspace.mjs`、`workflows/build-plan/SKILL.md`、`workflows/build-spec/SKILL.md`、`tests/stage-content-continuation.test.mjs`、`core/git-checkpoint.mjs`、`core/stage-runner.mjs`、`workflows/verify-code/SKILL.md`、`core/__tests__/task-recovery.test.mjs`、`core/artifact-dir.mjs`、`core/canonical-receipt-writer.mjs`、`core/stage-handlers.mjs`、`tests/stage-orchestrator-v2.test.mjs`、`core/build-spec-receipt-recovery.mjs`、`core/schemas/workflowhub-recovery-credential.v1.json`、`core/schemas/workflowhub-recovery-generation.v1.json`、`scripts/__tests__/stage-runtime-spec-recovery.test.mjs`、`scripts/__tests__/task-recovery.test.mjs`、`core/runtime-mode.mjs`、`scripts/runtime-cutover.mjs`、`core/__tests__/workspace-manager.test.mjs`、`core/__tests__/runtime-mode.test.mjs`、`core/stage-skill-invocation.mjs`、`core/stage-completion-facts.mjs`、`core/receipt-schema.mjs`、`tests/five-stage-facts-v2.test.mjs`、`tests/m14b-fact-collection.test.mjs`、`core/journal-appender.mjs`、`core/journal-schema.mjs`、`core/chain-topology.mjs`、`core/fact-indexes.mjs`、`tests/five-stage-audit-e2e.test.mjs`、`tests/audit-aggregator.test.mjs`、`tests/audit-p2.test.mjs`、`core/task-close.mjs`、`scripts/task-close.mjs`、`tests/final-cutover-guards.red.test.mjs`、`tests/task-close-delivery.test.mjs`、`core/dispatch-component.mjs`、`core/resolve-component.mjs`、`core/task-index.mjs`、`core/load-config.mjs`、`core/parse-framework-config.mjs`、`workflows/_spike/design-variant.mjs`、`workflows/_spike/design.mjs`、`workflows/_spike/intake.mjs`、`core/__tests__/task-index.test.mjs`、`core/__tests__/load-config.test.mjs`、`core/__tests__/parse-framework-config.test.mjs`、`tests/spike-intake-design.test.mjs`
- **DO NOT TOUCH**：`CONSTITUTION.md`、`core/runtime-facade.mjs`、`core/publication.mjs`

### Tasks

- T021 — 冻结逐项删除清单并取得用户确认
- T022 — 先证明 DEL-01 Grill replacement 旧入口仍可达
- T023 — 垂直删除 DEL-01 Grill replacement
- T024 — 先证明 DEL-02 Phase trace lineage 旧入口仍可达
- T025 — 垂直删除 DEL-02 Phase trace lineage
- T026 — 先证明 DEL-03 专用 invalidation 旧入口仍可达
- T027 — 垂直删除 DEL-03 专用 invalidation
- T028 — 先证明 DEL-04 continuation 旧入口仍可达
- T029 — 垂直删除 DEL-04 continuation
- T030 — 先证明 DEL-05 rebind 旧入口仍可达
- T031 — 垂直删除 DEL-05 rebind
- T032 — 先证明 DEL-06 reopen 旧入口仍可达
- T033 — 垂直删除 DEL-06 reopen
- T034 — 先证明 DEL-07 stage recovery 与 recover-spec 旧入口仍可达
- T035 — 垂直删除 DEL-07 stage recovery 与 recover-spec
- T036 — 先证明 DEL-08 recovery/reset workspace CAS 旧入口仍可达
- T037 — 垂直删除 DEL-08 recovery/reset workspace CAS
- T038 — 先证明 DEL-09 重复 invocation/completion projection 旧入口仍可达
- T039 — 垂直删除 DEL-09 重复 invocation/completion projection
- T040 — 先证明 DEL-10 stage-transition journal 旧入口仍可达
- T041 — 垂直删除 DEL-10 stage-transition journal
- T042 — 先证明 DEL-11 shadow current/head/checkpoint 旧入口仍可达
- T043 — 垂直删除 DEL-11 shadow current/head/checkpoint
- T044 — 先证明 DEL-12 旧 dispatch/config/index/spike 旧入口仍可达
- T045 — 垂直删除 DEL-12 旧 dispatch/config/index/spike
- T046 — 复算全部删除归零项和跨切片回归

### Verify

- ./node_modules/.bin/vitest run tests/integration/deletion-slices-summary.test.mjs tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/inventory.mjs --check

### Knowledge

- 每个 DEL-01..12 必须有完整 proof 和用户确认；未确认或缺证即 KEEP；删除不等于提交，Git 操作仍需关闭阶段独立授权。

### STOP

- 任何切片 proof 不完整、用户未确认、旧入口仍成功、focused/3 E2E/full/check 退化或需要跨切片大爆炸。

### Done

- 12 个切片逐项完成或明确 KEEP；每个 DELETE 的旧引用为 0、质量矩阵全绿、归零清单可复算。

### Risks and rollback

- **Risk**：隐藏消费者导致误删。
- **Prevention**：同一 oracle、精确边界、独立 review 和 STOP。
- **Rollback / recovery**：每个 GREEN 保持独立 diff/evidence/revert boundary；禁止补偿状态机或擅自 commit。

## Phase 6：全局 legacy 归零复核

### Goal

12 个删除切片后再次证明最终源码、CLI、schema、tests、Bundle、Runner 和 inventory 中不存在迁移脚手架、旧 writer 或双写。

### Files

- **NEW**：`tests/contract/legacy-zero.test.mjs`
- **MODIFY**：`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`core/skill-bundle-release.mjs`、`core/runner-release.mjs`、`package.json`
- **DO NOT TOUCH**：`docs/architecture/legacy-import-proof.json`、`core/task-handle.mjs`

### Tasks

- T047 — 建立全仓 legacy-zero 合同
- T048 — 修复任何 legacy 残留并固化零值 guard

### Verify

- ./node_modules/.bin/vitest run tests/contract/legacy-zero.test.mjs && node tools/architecture/inventory.mjs --check

### Knowledge

- Phase 3 的迁移证据只读保留；真实旧数据和 Git 历史不改写。

### STOP

- 任何 legacy 入口、fixture、schema、公开命令、发布引用或双写残留。

### Done

- 迁移证据可核验，legacy reader/importer/writer/schema/fixture/Bundle/Runner 引用全部为 0。

### Risks and rollback

- **Risk**：删除切片重新引入旧术语或隐式 reader。
- **Prevention**：同一 oracle、精确边界、独立 review 和 STOP。
- **Rollback / recovery**：本 Phase 只加最终零值 guard；失败回到引入残留的 owning slice。

## Phase 7：按外部质量谓词精简测试

### Goal

机制删除完成后，对最终 inventory 的全部测试逐文件作 keep/merge/move/delete 处置，再按 contract/integration/e2e/fixtures 组织，保留 3 E2E 和 5 破坏样本。

### Files

- **NEW**：`tools/architecture/test-disposition.mjs`、`docs/architecture/test-disposition.tsv`、`tests/contract/test-disposition.test.mjs`、`tests/fixtures/mutations/identity-tree-hash.json`、`tests/fixtures/mutations/missing-completion.json`、`tests/fixtures/mutations/review-major.json`、`tests/fixtures/mutations/confirmation-authorization.json`、`tests/fixtures/mutations/bundle-pollution.json`、`tests/integration/mutation-guards.test.mjs`
- **MODIFY**：`package.json`、`vitest.config.mjs`、`tests/helpers/runner-fixture.mjs`、`tools/architecture/complexity-report.mjs`、`docs/architecture/repository-inventory.tsv`、`core/completion-predicates.mjs`、`core/skill-bundle-release.mjs`、`core/__tests__/artifact-dir.test.mjs`、`core/__tests__/canonical-review-result.test.mjs`、`core/__tests__/capability-doctor.test.mjs`、`core/__tests__/check-anti-host.test.mjs`、`core/__tests__/check-contract.test.mjs`、`core/__tests__/check-extensibility.test.mjs`、`core/__tests__/check-skill-closure.test.mjs`、`core/__tests__/invocation-identity.test.mjs`、`core/__tests__/kernel.test.mjs`、`core/__tests__/load-config.test.mjs`、`core/__tests__/local-skill-resolver.test.mjs`、`core/__tests__/parse-framework-config.test.mjs`、`core/__tests__/protected-paths.test.mjs`、`core/__tests__/receipt-writer.test.mjs`、`core/__tests__/resolve-path.test.mjs`、`core/__tests__/run-checks.test.mjs`、`core/__tests__/runtime-mode.test.mjs`、`core/__tests__/skill-static-deps.test.mjs`、`core/__tests__/stage-acceptance-policy.test.mjs`、`core/__tests__/stage-context.test.mjs`、`core/__tests__/stage-skill-runtime.test.mjs`、`core/__tests__/storage-root.test.mjs`、`core/__tests__/task-handle.test.mjs`、`core/__tests__/task-identity.test.mjs`、`core/__tests__/task-index.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`core/__tests__/task-kernel-security.test.mjs`、`core/__tests__/task-recovery.test.mjs`、`core/__tests__/task-runner-root-migration.test.mjs`、`core/__tests__/task-target-repo-migration.test.mjs`、`core/__tests__/validate-contract.test.mjs`、`core/__tests__/workspace-manager.test.mjs`、`core/__tests__/workspace-runner.test.mjs`、`scripts/__tests__/canonical-archive-skill-dispatch.test.mjs`、`scripts/__tests__/ci-chain-check.test.mjs`、`scripts/__tests__/migrate-task-v2.test.mjs`、`scripts/__tests__/run-wh-review-audit-e2e.test.mjs`、`scripts/__tests__/run-wh-review-provider-smoke.test.mjs`、`scripts/__tests__/runner-replacement-bridge.test.mjs`、`scripts/__tests__/runner-unbinding-migration.test.mjs`、`scripts/__tests__/smoke-local-skill-dispatch.test.mjs`、`scripts/__tests__/stage-runtime-acceptance-publication.test.mjs`、`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`、`scripts/__tests__/stage-runtime-recover-run.test.mjs`、`scripts/__tests__/stage-runtime-spec-recovery.test.mjs`、`scripts/__tests__/task-bootstrap.test.mjs`、`scripts/__tests__/task-recovery.test.mjs`、`skills/debate/__tests__/skill-contract.test.mjs`、`skills/diagnosing-bugs/__tests__/skill-contract.test.mjs`、`skills/isolated-browser-qa/__tests__/skill-contract.test.mjs`、`skills/review-response/__tests__/skill-contract.test.mjs`、`skills/test-routing-advisor/__tests__/skill-contract.test.mjs`、`skills/wh-review/__tests__/human-brief-behavioral.test.mjs`、`skills/wh-review/scripts/__tests__/ac-evidence-summary.test.mjs`、`skills/wh-review/scripts/__tests__/integration-review-subject.test.mjs`、`skills/wh-review/scripts/__tests__/review-controller.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/review-source-materials.test.mjs`、`skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs`、`skills/wh-review/scripts/__tests__/schema-validator.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs`、`skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs`、`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`tests/audit-aggregator.test.mjs`、`tests/audit-p2.test.mjs`、`tests/baseline.test.mjs`、`tests/boundary-confirm.test.mjs`、`tests/build-code-capture.test.mjs`、`tests/build-code-diff-only.test.mjs`、`tests/build-code-phase-evidence.test.mjs`、`tests/build-code-preflight.red.test.mjs`、`tests/build-code-target.test.mjs`、`tests/canonical-source.test.mjs`、`tests/contract-freeze.test.mjs`、`tests/design-stage-skill-order.red.test.mjs`、`tests/execution-record.test.mjs`、`tests/facts-subschema.test.mjs`、`tests/final-cutover-guards.red.test.mjs`、`tests/five-stage-audit-e2e.test.mjs`、`tests/five-stage-facts-v2.test.mjs`、`tests/fixtures/derived-review-provider.mjs`、`tests/fixtures/interaction-quality/r9-spec-clarify.json`、`tests/fixtures/step-audit/duplicate.json`、`tests/fixtures/step-audit/missing.json`、`tests/fixtures/step-audit/normal.json`、`tests/fixtures/step-audit/out-of-order.json`、`tests/fixtures/step-audit/stale.json`、`tests/fixtures/step-audit/tampered-hash.json`、`tests/fixtures/step-audit/unexpected.json`、`tests/fixtures/step-audit/unknown.json`、`tests/fixtures/template-content-quality/retention-map.json`、`tests/helpers/formal-review.mjs`、`tests/helpers/human-confirmation.mjs`、`tests/host-independence.test.mjs`、`tests/interaction-quality-contract.test.mjs`、`tests/knowledge-card.test.mjs`、`tests/m12-reuse-registry.test.mjs`、`tests/m12-subskill-exclusion.test.mjs`、`tests/m12-templates.test.mjs`、`tests/m14a-audit-contract-layer.test.mjs`、`tests/m14b-fact-collection.test.mjs`、`tests/metrics-smoke.test.mjs`、`tests/metrics-taskhandle-v2.test.mjs`、`tests/moat-skills-phase1.test.mjs`、`tests/moat-skills-phase2.test.mjs`、`tests/official-component-receipts.test.mjs`、`tests/official-make-decision-cli.test.mjs`、`tests/p0-foundation-contracts.test.mjs`、`tests/per-invocation-doc-contract.test.mjs`、`tests/per-invocation-execution-identity.test.mjs`、`tests/phase-adjudication-correction-scope.test.mjs`、`tests/phase-gate.test.mjs`、`tests/requirement-lineage.test.mjs`、`tests/reuse-registry.test.mjs`、`tests/skill-provenance-strict.test.mjs`、`tests/smoke.test.mjs`、`tests/spec-content-profile.test.mjs`、`tests/spec-specify-template.test.mjs`、`tests/spike-intake-design.test.mjs`、`tests/stage-completion-facts.test.mjs`、`tests/stage-content-continuation.test.mjs`、`tests/stage-content-evidence.test.mjs`、`tests/stage-content-host-independence.test.mjs`、`tests/stage-content-publication.test.mjs`、`tests/stage-decision-contract.test.mjs`、`tests/stage-interaction-contract.test.mjs`、`tests/stage-orchestrator-v2.test.mjs`、`tests/stage-plan-task-contract-v3.test.mjs`、`tests/stage-plan-task-contract.test.mjs`、`tests/stage-quality.test.mjs`、`tests/stage-review-cost-policy.test.mjs`、`tests/stage-risk-acceptance.test.mjs`、`tests/step-manifest.test.mjs`、`tests/task-accepted-schema.test.mjs`、`tests/task-close-delivery.test.mjs`、`tests/task-record-paths-check.test.mjs`、`tests/template-content-quality-retention.test.mjs`、`tests/terminal-runtime-blockers.test.mjs`、`tests/verify-code-capture.test.mjs`、`tests/verify-code-design-alignment.test.mjs`、`tests/verify-code-facts.test.mjs`、`tests/verify-code-freshness.test.mjs`、`tests/vitest-resource-policy.test.mjs`、`tests/workflow-v2-contract.test.mjs`、`workflows/verify-code/phase-1-contract.test.mjs`
- **DO NOT TOUCH**：`tests/e2e/five-stage-normal.test.mjs`、`tests/e2e/five-stage-material-revision.test.mjs`、`tests/e2e/five-stage-idempotent-resume.test.mjs`、`tests/integration/atomic-write-faults.test.mjs`、`tests/contract/legacy-zero.test.mjs`

### Tasks

- T049 — 逐文件处置全部测试并按外部质量谓词重组
- T050 — 先证明五个破坏样本至少一个未被抓住
- T051 — 完成五个破坏样本的反脆弱验证

### Verify

- node tools/architecture/test-disposition.mjs --check --require-all-inventory-tests && ./node_modules/.bin/vitest run tests/contract tests/integration tests/e2e && npm test && npm run check && node tools/architecture/complexity-report.mjs --check-hard-gates

### Knowledge

- 先删机制再删专属测试；每个最终 test row 恰好一个 disposition；不得合并巨型文件伪造下降。

### STOP

- 任何测试未分类、唯一负向 oracle 无替代、delete 无被删机制或替代 oracle、变异不红，或 full tests 超时且根因未知。

### Done

- 全部测试有可追溯处置；3 E2E、5 mutation、focused/full/check 均可执行；复杂度只报告软预算。

### Risks and rollback

- **Risk**：误删唯一负向 oracle或把迁移测试永久保留。
- **Prevention**：同一 oracle、精确边界、独立 review 和 STOP。
- **Rollback / recovery**：每组测试移动保持独立 diff/evidence/revert boundary；失败恢复该组。

## Phase 8：最后机械搬目录与治理同步

### Goal

行为、兼容和测试稳定后，按冻结 move-map 机械移动剩余模块并写入长期结构规则。

### Files

- **NEW**：`runtime/evidence/.gitkeep`、`tests/integration/core-artifact-dir.test.mjs`、`tests/integration/core-canonical-review-result.test.mjs`、`tests/integration/core-capability-doctor.test.mjs`、`tests/integration/core-check-anti-host.test.mjs`、`tests/integration/core-check-contract.test.mjs`、`tests/integration/core-check-extensibility.test.mjs`、`tests/integration/core-check-skill-closure.test.mjs`、`tests/integration/core-invocation-identity.test.mjs`、`tests/integration/core-kernel.test.mjs`、`tests/integration/core-local-skill-resolver.test.mjs`、`tests/integration/core-protected-paths.test.mjs`、`tests/integration/core-receipt-writer.test.mjs`、`tests/integration/core-resolve-path.test.mjs`、`tests/integration/core-run-checks.test.mjs`、`tests/integration/core-skill-static-deps.test.mjs`、`tests/integration/core-stage-acceptance-policy.test.mjs`、`tests/integration/core-stage-context.test.mjs`、`tests/integration/core-stage-skill-runtime.test.mjs`、`tests/integration/core-storage-root.test.mjs`、`tests/integration/core-task-handle.test.mjs`、`tests/integration/core-task-identity.test.mjs`、`tests/integration/core-task-kernel-security.test.mjs`、`tests/integration/core-task-runner-root-migration.test.mjs`、`tests/integration/core-task-target-repo-migration.test.mjs`、`tests/integration/core-validate-contract.test.mjs`、`tests/integration/core-workspace-runner.test.mjs`、`runtime/evidence/audit-summary-carrier.mjs`、`runtime/evidence/boundary-confirm.mjs`、`runtime/review/canonical-review-result.mjs`、`runtime/evidence/canonical-source.mjs`、`runtime/evidence/canonical-utils.mjs`、`runtime/evidence/capability-doctor.mjs`、`runtime/evidence/check-skill-closure.mjs`、`runtime/evidence/fact-collector.mjs`、`runtime/task/git-worktree-snapshot.mjs`、`runtime/evidence/invocation-identity.mjs`、`runtime/evidence/kernel.mjs`、`runtime/adapters/local-skill-resolver.mjs`、`runtime/evidence/protected-paths.mjs`、`runtime/evidence/receipt-writer.mjs`、`runtime/evidence/requirement-ledger.mjs`、`runtime/adapters/resolve-path.mjs`、`runtime/review/review-flow-authority.mjs`、`runtime/review/review-result-consumer.mjs`、`runtime/evidence/runner-identity.mjs`、`runtime/schemas/ambiguity-ledger.v1.json`、`runtime/schemas/ambiguity-ledger.v2.json`、`runtime/schemas/bootstrap-review.v1.json`、`runtime/schemas/browser-qa-evidence.v1.json`、`runtime/schemas/decision-correction-appendix.v1.json`、`runtime/schemas/decision-coverage-audit.v1.json`、`runtime/schemas/decision-entry.v1.json`、`runtime/schemas/decision-log-contract.v1.json`、`runtime/schemas/decision-omission-acceptance.v1.json`、`runtime/schemas/plan-task-contract.v1.json`、`runtime/schemas/plan-task-contract.v2.json`、`runtime/schemas/risk-acceptance.v1.json`、`runtime/schemas/runner-replacement-bootstrap-provider-config.v1.json`、`runtime/schemas/runner-replacement-bootstrap-sealed-bundle.v1.json`、`runtime/schemas/runner-replacement-bootstrap-test-receipt.v1.json`、`runtime/schemas/runner-replacement-path-coverage-map.v1.json`、`runtime/schemas/stage-completion-facts.v1.json`、`runtime/schemas/stage-content-evidence.v1.json`、`runtime/schemas/stage-skill-invocation.v1.json`、`runtime/schemas/task-material-revision.v1.json`、`runtime/evidence/skill-static-deps.mjs`、`runtime/stage/stage-acceptance-policy.mjs`、`runtime/stage/stage-content-contracts.mjs`、`runtime/review/stage-review-disposition.mjs`、`runtime/stage/stage-skill-runtime.mjs`、`runtime/stage/step-manifest.mjs`、`runtime/evidence/storage-root.mjs`、`runtime/task/task-identity.mjs`、`runtime/task/task-kernel.mjs`、`runtime/evidence/text-utils.mjs`、`runtime/evidence/validate-contract.mjs`、`runtime/task/workspace-runner.mjs`、`runtime/evidence/write-boundary-preflight.mjs`、`runtime/schemas/audit-summary.schema.json`、`runtime/schemas/human-confirmation.v1.schema.json`、`runtime/schemas/requirement-ledger.schema.json`、`runtime/schemas/requirements-coverage.schema.json`、`runtime/schemas/review-bundle.schema.json`、`runtime/schemas/skill-bundle.schema.json`、`runtime/schemas/skill-catalog.schema.json`、`runtime/schemas/skills-inventory.schema.json`、`runtime/schemas/source-manifest.schema.json`、`runtime/schemas/stage-skill-deps.schema.json`、`runtime/schemas/steps.schema.json`、`runtime/schemas/task-accepted.v2.schema.json`、`runtime/schemas/task-attempt.v2.schema.json`、`tests/integration/scripts-canonical-archive-skill-dispatch.test.mjs`、`tests/integration/scripts-ci-chain-check.test.mjs`、`tests/integration/scripts-migrate-task-v2.test.mjs`、`tests/integration/scripts-run-wh-review-audit-e2e.test.mjs`、`tests/integration/scripts-run-wh-review-provider-smoke.test.mjs`、`tests/integration/scripts-runner-replacement-bridge.test.mjs`、`tests/integration/scripts-runner-unbinding-migration.test.mjs`、`tests/integration/scripts-smoke-local-skill-dispatch.test.mjs`、`tests/integration/scripts-stage-runtime-acceptance-publication.test.mjs`、`tests/integration/scripts-stage-runtime-five-stage-e2e.test.mjs`、`tests/integration/scripts-task-bootstrap.test.mjs`、`tools/cli/audit-aggregate.mjs`、`tools/cli/check-anti-host.mjs`、`tools/cli/check-contract.mjs`、`tools/cli/check-extensibility.mjs`、`tools/cli/check-metrics-schema.mjs`、`tools/cli/check-stage-quality.mjs`、`tools/cli/check-task-record-paths.mjs`、`tools/cli/ci-chain-check.mjs`、`tools/cli/collect-task-facts.mjs`、`tools/cli/migrate-task-v2.mjs`、`tools/cli/noop.mjs`、`tools/cli/phase-gate.mjs`、`tools/cli/requirements-ledger.mjs`、`tools/cli/run-checks.mjs`、`tools/cli/run-wh-review-audit-e2e.mjs`、`tools/cli/run-wh-review-provider-smoke.mjs`、`tools/cli/scan-core-files.mjs`、`tools/cli/smoke-local-skill-dispatch.mjs`、`tools/cli/source-manifest.mjs`、`tools/cli/task-bootstrap.mjs`、`tools/cli/task-migrate-runner-root.mjs`、`tools/cli/task-migrate-target-repo.mjs`、`tools/cli/validate-field-mapping.mjs`、`tools/cli/verify-structure.mjs`、`runtime/interface/runtime-facade.mjs`、`runtime/interface/runner-contract.mjs`、`runtime/distribution/skill-bundle-release.mjs`、`runtime/distribution/runner-release.mjs`、`runtime/task/material-revision.mjs`、`runtime/evidence/quality-fact.mjs`、`runtime/evidence/freshness.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/stage/publication.mjs`、`runtime/schemas/runner-release.schema.json`、`runtime/schemas/quality-fact.v1.json`、`runtime/schemas/publication.v1.json`、`docs/architecture/move-map.json`、`runtime/schemas/repository-structure.v1.json`、`tests/contract/repository-governance.test.mjs`
- **MODIFY**：`core/.gitkeep`、`core/__tests__/artifact-dir.test.mjs`、`core/__tests__/canonical-review-result.test.mjs`、`core/__tests__/capability-doctor.test.mjs`、`core/__tests__/check-anti-host.test.mjs`、`core/__tests__/check-contract.test.mjs`、`core/__tests__/check-extensibility.test.mjs`、`core/__tests__/check-skill-closure.test.mjs`、`core/__tests__/invocation-identity.test.mjs`、`core/__tests__/kernel.test.mjs`、`core/__tests__/local-skill-resolver.test.mjs`、`core/__tests__/protected-paths.test.mjs`、`core/__tests__/receipt-writer.test.mjs`、`core/__tests__/resolve-path.test.mjs`、`core/__tests__/run-checks.test.mjs`、`core/__tests__/skill-static-deps.test.mjs`、`core/__tests__/stage-acceptance-policy.test.mjs`、`core/__tests__/stage-context.test.mjs`、`core/__tests__/stage-skill-runtime.test.mjs`、`core/__tests__/storage-root.test.mjs`、`core/__tests__/task-handle.test.mjs`、`core/__tests__/task-identity.test.mjs`、`core/__tests__/task-kernel-security.test.mjs`、`core/__tests__/task-runner-root-migration.test.mjs`、`core/__tests__/task-target-repo-migration.test.mjs`、`core/__tests__/validate-contract.test.mjs`、`core/__tests__/workspace-runner.test.mjs`、`core/audit-summary-carrier.mjs`、`core/boundary-confirm.mjs`、`core/canonical-review-result.mjs`、`core/canonical-source.mjs`、`core/canonical-utils.mjs`、`core/capability-doctor.mjs`、`core/check-skill-closure.mjs`、`core/fact-collector.mjs`、`core/git-worktree-snapshot.mjs`、`core/invocation-identity.mjs`、`core/kernel.mjs`、`core/local-skill-resolver.mjs`、`core/protected-paths.mjs`、`core/receipt-writer.mjs`、`core/requirement-ledger.mjs`、`core/resolve-path.mjs`、`core/review-flow-authority.mjs`、`core/review-result-consumer.mjs`、`core/runner-identity.mjs`、`core/schemas/ambiguity-ledger.v1.json`、`core/schemas/ambiguity-ledger.v2.json`、`core/schemas/bootstrap-review.v1.json`、`core/schemas/browser-qa-evidence.v1.json`、`core/schemas/decision-correction-appendix.v1.json`、`core/schemas/decision-coverage-audit.v1.json`、`core/schemas/decision-entry.v1.json`、`core/schemas/decision-log-contract.v1.json`、`core/schemas/decision-omission-acceptance.v1.json`、`core/schemas/plan-task-contract.v1.json`、`core/schemas/plan-task-contract.v2.json`、`core/schemas/risk-acceptance.v1.json`、`core/schemas/runner-replacement-bootstrap-provider-config.v1.json`、`core/schemas/runner-replacement-bootstrap-sealed-bundle.v1.json`、`core/schemas/runner-replacement-bootstrap-test-receipt.v1.json`、`core/schemas/runner-replacement-path-coverage-map.v1.json`、`core/schemas/stage-completion-facts.v1.json`、`core/schemas/stage-content-evidence.v1.json`、`core/schemas/stage-skill-invocation.v1.json`、`core/schemas/task-material-revision.v1.json`、`core/skill-static-deps.mjs`、`core/stage-acceptance-policy.mjs`、`core/stage-content-contracts.mjs`、`core/stage-review-disposition.mjs`、`core/stage-skill-runtime.mjs`、`core/step-manifest.mjs`、`core/storage-root.mjs`、`core/task-identity.mjs`、`core/task-kernel.mjs`、`core/text-utils.mjs`、`core/validate-contract.mjs`、`core/workspace-runner.mjs`、`core/write-boundary-preflight.mjs`、`schemas/audit-summary.schema.json`、`schemas/human-confirmation.v1.schema.json`、`schemas/requirement-ledger.schema.json`、`schemas/requirements-coverage.schema.json`、`schemas/review-bundle.schema.json`、`schemas/skill-bundle.schema.json`、`schemas/skill-catalog.schema.json`、`schemas/skills-inventory.schema.json`、`schemas/source-manifest.schema.json`、`schemas/stage-skill-deps.schema.json`、`schemas/steps.schema.json`、`schemas/task-accepted.v2.schema.json`、`schemas/task-attempt.v2.schema.json`、`scripts/__tests__/canonical-archive-skill-dispatch.test.mjs`、`scripts/__tests__/ci-chain-check.test.mjs`、`scripts/__tests__/migrate-task-v2.test.mjs`、`scripts/__tests__/run-wh-review-audit-e2e.test.mjs`、`scripts/__tests__/run-wh-review-provider-smoke.test.mjs`、`scripts/__tests__/runner-replacement-bridge.test.mjs`、`scripts/__tests__/runner-unbinding-migration.test.mjs`、`scripts/__tests__/smoke-local-skill-dispatch.test.mjs`、`scripts/__tests__/stage-runtime-acceptance-publication.test.mjs`、`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`、`scripts/__tests__/task-bootstrap.test.mjs`、`scripts/audit-aggregate.mjs`、`scripts/check-anti-host.mjs`、`scripts/check-contract.mjs`、`scripts/check-extensibility.mjs`、`scripts/check-metrics-schema.mjs`、`scripts/check-stage-quality.mjs`、`scripts/check-task-record-paths.mjs`、`scripts/ci-chain-check.mjs`、`scripts/collect-task-facts.mjs`、`scripts/migrate-task-v2.mjs`、`scripts/noop.mjs`、`scripts/phase-gate.mjs`、`scripts/requirements-ledger.mjs`、`scripts/run-checks.mjs`、`scripts/run-wh-review-audit-e2e.mjs`、`scripts/run-wh-review-provider-smoke.mjs`、`scripts/scan-core-files.mjs`、`scripts/smoke-local-skill-dispatch.mjs`、`scripts/source-manifest.mjs`、`scripts/task-bootstrap.mjs`、`scripts/task-migrate-runner-root.mjs`、`scripts/task-migrate-target-repo.mjs`、`scripts/validate-field-mapping.mjs`、`scripts/verify-structure.mjs`、`core/runtime-facade.mjs`、`core/runner-contract.mjs`、`core/skill-bundle-release.mjs`、`core/runner-release.mjs`、`core/material-revision.mjs`、`core/quality-fact.mjs`、`core/freshness.mjs`、`core/completion-predicates.mjs`、`core/publication.mjs`、`schemas/runner-release.schema.json`、`schemas/quality-fact.v1.json`、`schemas/publication.v1.json`、`AGENTS.md`、`CLAUDE.md`、`CONSTITUTION.md`、`CONTEXT.md`、`README.md`、`constitution-checklist.md`、`package.json`、`vitest.config.mjs`、`skills/catalog.yaml`、`docs/architecture/repository-inventory.tsv`
- **DO NOT TOUCH**：`specs/workflowhub-complexity-governance-v2/decision-log.md`、`specs/workflowhub-complexity-governance-v2/spec.md`

### Tasks

- T052 — 生成冻结 move-map 并机械移动剩余 core/scripts/schemas
- T053 — 同步 AGENTS、CLAUDE、CONTEXT、ADR 与结构门

### Verify

- node tools/cli/verify-structure.mjs && ./node_modules/.bin/vitest run tests/contract/repository-governance.test.mjs && npm test

### Knowledge

- move-map 在本 Phase 开始前绑定准确 source/destination；只做机械 import/path 更新。

### STOP

- move-map 与最终 inventory 不同、需要行为修改或存在未完成 legacy/delete slice。

### Done

- runtime/tests/tools/docs 结构稳定；AGENTS 记录职责和依赖；CLAUDE 仅引用。

### Risks and rollback

- **Risk**：机械移动掩盖行为变化。
- **Prevention**：同一 oracle、精确边界、独立 review 和 STOP。
- **Rollback / recovery**：按 move-map 分组 revert；禁止修补行为。

## Phase 9：最终验证、三方架构审查与用户确认

### Goal

在最终 tree 上执行 clean install、完整质量矩阵、正式三方 architecture review，并展示实际删除和 diff 供用户确认。

### Files

- **NEW**：`docs/architecture/final-complexity-report.json`、`docs/architecture/final-coverage-audit.md`、`tests/e2e/release-acceptance.test.mjs`、`tests/integration/final-review-facts.test.mjs`、`tests/contract/final-coverage.test.mjs`、`tools/architecture/clean-install.mjs`、`tools/architecture/verify-final-coverage.mjs`
- **MODIFY**：`docs/architecture/repository-inventory.tsv`、`docs/architecture/deletion-plan.json`、`docs/architecture/legacy-task-inventory.json`、`docs/architecture/legacy-import-proof.json`、`docs/architecture/test-disposition.tsv`、`runtime/distribution/skill-bundle-release.mjs`、`runtime/distribution/runner-release.mjs`、`tools/architecture/inventory.mjs`、`tools/architecture/reference-audit.mjs`、`tools/architecture/complexity-report.mjs`、`tools/architecture/deletion-proof.mjs`、`tools/architecture/test-disposition.mjs`、`tools/architecture/verify-migration-proof.mjs`
- **DO NOT TOUCH**：`CONSTITUTION.md`、`specs/workflowhub-complexity-governance-v2/decision-log.md`、`specs/workflowhub-complexity-governance-v2/spec.md`

### Tasks

- T054 — 执行 clean install、完整测试、3 E2E、5 mutation 和直接 AC 覆盖审计
- T055 — 通过正式 wh-review 执行三方独立 architecture review 并处置有效 finding
- T056 — 向用户展示最终删除清单、保留项、diff 和复杂度变化并确认

### Verify

- node tools/architecture/clean-install.mjs --verify-runner --verify-skill-bundle --verify-multica-layout --verify-current-tree && npm test && npm run check && ./node_modules/.bin/vitest run tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs tests/integration/mutation-guards.test.mjs tests/e2e/release-acceptance.test.mjs tests/integration/final-review-facts.test.mjs tests/contract/final-coverage.test.mjs && node tools/architecture/verify-final-coverage.mjs --spec=specs/workflowhub-complexity-governance-v2/spec.md --require-ac=AC-01..AC-15 --bind-current-tree && node tools/architecture/complexity-report.mjs --check-hard-gates

### Knowledge

- 审查 providers 固定 kimi/k3、claude-code/opus、cursor/grok；通过正式 wh-review seam，不新增一次性 reviewer launcher；用户确认不等于 Git 授权。

### STOP

- 任一 AC 无直接证据、Skill Bundle 或 Runner clean install 失败、严重 finding 未处置、最终 inventory 非 0、用户未确认实际删除/diff。

### Done

- AC-01..15 直接证据齐全，Bundle/Runner 在 Multica-like 空目录完成正式 Stage，三方审查完成，用户确认实际删除结果。

### Risks and rollback

- **Risk**：最终快照漂移、审查材料错绑或一次性验收工具变成永久产品。
- **Prevention**：同一 oracle、精确边界、独立 review 和 STOP。
- **Rollback / recovery**：任何失败回到 owning Phase；不修改 WorkflowHub 以绕过 WorkflowHub。

## 15. Dependencies and Parallelism

- Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8 → Phase 9。
- Phase 5 的 12 个切片在共享核心文件和用户确认上冲突，默认串行；只有 inventory 证明文件所有权完全独立时才可并行。
- Phase 8 必须等待行为、legacy 和测试稳定；目录移动不能提前。
- T021 与 T056 是两个不同人工门：计划删除确认与实际删除/diff 确认。

## 16. Requirement and Verification Traceability

| FR | Task IDs | AC IDs | Phase | Gate / evidence |
| --- | --- | --- | --- | --- |
| FR-FLOW-001 | T017、T018、T019、T020、T054 | AC-01、AC-09 | Phase 4：切断历史推进许可证、Phase 9：最终验证、三方架构审查与用户确认 | owning Task gate / evidence |
| FR-RUN-001 | T005、T006、T018、T046、T053、T054 | AC-01、AC-07、AC-14 | Phase 1：窄 Runtime facade 与双发布单元、Phase 4：切断历史推进许可证、Phase 5：用户确认后的垂直删除、Phase 8：最后机械搬目录与治理同步、Phase 9：最终验证、三方架构审查与用户确认 | owning Task gate / evidence |
| FR-MAT-001 | T009、T010、T013、T014、T017、T018 | AC-02、AC-04 | Phase 2：单一材料修订与派生发布、Phase 3：新任务单写与迁移脚手架即时退出、Phase 4：切断历史推进许可证 | owning Task gate / evidence |
| FR-MAT-002 | T009、T010、T011、T012 | AC-02、AC-03 | Phase 2：单一材料修订与派生发布 | owning Task gate / evidence |
| FR-PUB-001 | T009、T010、T017、T018、T051、T054 | AC-01、AC-04、AC-05 | Phase 2：单一材料修订与派生发布、Phase 4：切断历史推进许可证、Phase 7：按外部质量谓词精简测试、Phase 9：最终验证、三方架构审查与用户确认 | owning Task gate / evidence |
| FR-PUB-002 | T011、T012、T014、T020 | AC-03、AC-04 | Phase 2：单一材料修订与派生发布、Phase 3：新任务单写与迁移脚手架即时退出、Phase 4：切断历史推进许可证 | owning Task gate / evidence |
| FR-REV-001 | T009、T010、T051、T055 | AC-05 | Phase 2：单一材料修订与派生发布、Phase 7：按外部质量谓词精简测试、Phase 9：最终验证、三方架构审查与用户确认 | owning Task gate / evidence |
| FR-DEL-001 | T002、T003、T021、T022、T023、T024、T025、T026、T027、T028、T029、T030、T031、T032、T033、T034、T035、T036、T037、T038、T039、T040、T041、T042、T043、T044、T045、T056 | AC-06、AC-07 | Phase 0：冻结基线与逐文件清单、Phase 5：用户确认后的垂直删除、Phase 9：最终验证、三方架构审查与用户确认 | owning Task gate / evidence |
| FR-DEL-002 | T003、T023、T025、T027、T029、T031、T033、T035、T037、T039、T041、T043、T045、T046、T056 | AC-06、AC-07 | Phase 0：冻结基线与逐文件清单、Phase 5：用户确认后的垂直删除、Phase 9：最终验证、三方架构审查与用户确认 | owning Task gate / evidence |
| FR-LEG-001 | T013、T014、T015、T016、T047、T048 | AC-08 | Phase 3：新任务单写与迁移脚手架即时退出、Phase 6：全局 legacy 归零复核 | owning Task gate / evidence |
| FR-DIST-001 | T004、T007、T008、T053、T054 | AC-10 | Phase 0：冻结基线与逐文件清单、Phase 1：窄 Runtime facade 与双发布单元、Phase 8：最后机械搬目录与治理同步、Phase 9：最终验证、三方架构审查与用户确认 | owning Task gate / evidence |
| FR-DIST-002 | T005、T006、T007、T008、T054 | AC-10、AC-11 | Phase 1：窄 Runtime facade 与双发布单元、Phase 9：最终验证、三方架构审查与用户确认 | owning Task gate / evidence |
| FR-TEST-001 | T019、T020、T022、T023、T024、T025、T026、T027、T028、T029、T030、T031、T032、T033、T034、T035、T036、T037、T038、T039、T040、T041、T042、T043、T044、T045、T049、T050、T051、T054、T055 | AC-12、AC-14 | Phase 4：切断历史推进许可证、Phase 5：用户确认后的垂直删除、Phase 7：按外部质量谓词精简测试、Phase 9：最终验证、三方架构审查与用户确认 | owning Task gate / evidence |
| FR-INV-001 | T001、T021、T046、T048、T052、T054、T056 | AC-13 | Phase 0：冻结基线与逐文件清单、Phase 5：用户确认后的垂直删除、Phase 6：全局 legacy 归零复核、Phase 8：最后机械搬目录与治理同步、Phase 9：最终验证、三方架构审查与用户确认 | owning Task gate / evidence |
| FR-GOV-001 | T049、T052、T053、T056 | AC-13、AC-15 | Phase 7：按外部质量谓词精简测试、Phase 8：最后机械搬目录与治理同步、Phase 9：最终验证、三方架构审查与用户确认 | owning Task gate / evidence |
| FR-MET-001 | T001、T046、T049、T054 | AC-14 | Phase 0：冻结基线与逐文件清单、Phase 5：用户确认后的垂直删除、Phase 7：按外部质量谓词精简测试、Phase 9：最终验证、三方架构审查与用户确认 | owning Task gate / evidence |

## 17. 原始口述需求与下载方案覆盖审计

- **来源文件**：`/Users/Hugh/Downloads/workflowhub-complexity-governance-plan-v2-2026-07-30.md`
- **SHA-256**：`493c1b3757e9cc2be37e59e5e8f4fc16ade3ae0208ec2692e2d4f4084d1ec767`
- **口径**：每项必须同时落入 spec、Phase、Task 和可执行 gate；缺任一层即未覆盖。

| 原始需求 | Spec | Phase | Task | Gate / evidence |
| --- | --- | --- | --- | --- |
| 根因：历史许可阻塞业务 | FR-FLOW-001、FR-MAT-001 | Phase 2–4 | T009–T020 | 3 E2E + progression oracle |
| 五阶段和质量硬门保留 | FR-FLOW-001、FR-PUB-001、FR-REV-001 | Phase 2、4、9 | T009–T020、T054–T055 | completion/mutation/final review |
| 四材料单一修订 | FR-MAT-001、FR-MAT-002 | Phase 2–3 | T009–T014 | revision + atomic faults |
| 质量事实与派生发布 | FR-PUB-001、FR-PUB-002 | Phase 2 | T009–T012 | freshness + publication |
| 七个公开 Runtime 行为 | FR-RUN-001 | Phase 1、4 | T005–T006、T018 | facade contract |
| 12 类删除与逐项证明 | FR-DEL-001、FR-DEL-002 | Phase 0、5 | T002–T003、T021–T046 | proof + same before/after oracle |
| 删除前用户逐项确认 | FR-DEL-001 | Phase 5 | T021 | blocked-by-design user gate |
| 旧任务迁移证明后即时归零 | FR-LEG-001 | Phase 3、6 | T013–T016、T047–T048 | fixture proof + legacy-zero |
| node_modules 仅本地缓存 | FR-DIST-001 | Phase 0、1、9 | T004、T007–T008、T054 | untracked + clean install |
| Skill Bundle / Runner 分离 | FR-DIST-001、FR-DIST-002 | Phase 1、9 | T005–T008、T054 | closure + version mismatch |
| 3 条 E2E 与 5 个破坏样本 | FR-TEST-001 | Phase 4、7、9 | T019–T020、T050–T051、T054 | real CLI + mutation |
| 全量 tracked-file 逐文件分类 | FR-INV-001 | Phase 0、5、8、9 | T001、T021、T046、T052、T054 | inventory exact-one |
| 目录最后机械迁移 | FR-GOV-001 | Phase 8 | T052–T053 | move-map + behavior equivalence |
| AGENTS / CLAUDE 依赖治理 | FR-GOV-001 | Phase 8 | T053 | repository governance |
| 复杂度目标与硬归零门 | FR-MET-001 | Phase 0、5、7、9 | T001、T046、T049、T054 | complexity report |
| 最终三 provider 架构审查 | FR-REV-001、FR-TEST-001 | Phase 9 | T055 | kimi/k3 + opus + grok |
| 最终实际 diff 用户确认 | FR-DEL-001、FR-GOV-001 | Phase 9 | T056 | blocked-by-design user gate |
| 不重放事故、不跑 10 任务 | FR-TEST-001 | 全局 | T020、T050–T055 | synthetic only |
| 业务任务期间不得修改 Hub | FR-GOV-001 | Phase 4、9 | T019–T020、T054 | clean-install 只读 Runner + 源码树前后哈希一致 |

**审计结论**：原始口述需求和下载方案全部进入可执行链路。下载方案第 3 节是历史盲审来源；后续口述明确覆盖其中“30 天/一个 release 兼容期”建议：旧任务不设兼容期，真实任务逐项处置并确认后，同任务立即删除全部 legacy reader/importer/schema/fixture；无法安全处置则 STOP。
