# Reuse registry

机器真相是 [`skills/catalog.yaml`](../skills/catalog.yaml)；本文记录同一套复用状态词表和 typed I/O 消费者合同，不覆盖 catalog 的固定版本与来源字段。

## 状态词表与 M17 审计

复用状态只使用：`native`、`adopted`、`adapted`、`absorbed`、`rejected`、`watch`。2026-09-05 扫描当前 `skills/` 路径未发现 `_spike` 目录或文件；该结论不推断仓外历史目录状态。

2026-09-05 M17 X 处置：X2 委派不引入；X3 保持独立 3rd-review broker，通过 `wh-review` 薄入口声明 `>=1.2.0` 运行依赖，当前 host adapter 探针因 broker 未暴露 semver 报告 `unknown`；X4 `debate` 状态为 `adopted`，仅作可选诊断，不进入核心 Bundle。

## 8-consumer typed I/O registry

此 registry 是本次 canonical audit cutover 的 8 个消费者清单。`Decision` 只裁定复用边界；它不授权第二个 verdict authority。`steps.json` 只声明 expected topology，journal/receipt 只记录 observed facts，只有 audit aggregator 产出 canonical verdict。

### make-decision

- **Typed inputs:** `CanonicalSourceInput`, `StepManifest`, `StepEntryReceipt`
- **Typed outputs:** `StepExitReceipt`, `JournalEvent`, `DecisionLog`
- **Failure:** When source is incomplete, emit `SOURCE_INCOMPLETE`; do not write a successful exit.
- **Skip:** When scope is lite, record `skipped` exit evidence and its reason; it is not success.
- **Retry:** On retry, use a new `attempt_id`; never pair receipts across attempts.
- **Human:** When direction is unresolved, emit `needs_human` and wait for explicit approval.
- **Decision:** local — stage conversation and approval sequencing remain local.
- **Rationale:** Human direction changes the stage's semantic boundary.
- **Evidence:** `workflows/make-decision/steps.json` and same-attempt journal receipts.
- **Semantic contract:** Canonical source becomes a reviewed decision with explicit human approval.
- **Mechanism:** make-decision-stage-protocol

### build-spec

- **Typed inputs:** `DecisionLog`, `StepManifest`, `AuditSummary`
- **Typed outputs:** `SpecArtifact`, `StepExitReceipt`, `JournalEvent`
- **Failure:** If decision lineage is absent, return failure and preserve the missing reference.
- **Skip:** When no spec subsection applies, emit `skipped` with the declared condition.
- **Retry:** On evidence failure, retry in a new `attempt_id` after fixing the input.
- **Human:** When requirements conflict, emit `needs_human` rather than selecting a winner.
- **Decision:** local — specification drafting and conflict resolution are stage-specific.
- **Rationale:** A specification has its own artifact and review semantics.
- **Evidence:** `workflows/build-spec/steps.json` and `SpecArtifact` evidence references.
- **Semantic contract:** Approved decision is transformed into a traceable specification.
- **Mechanism:** build-spec-stage-protocol

### build-plan

- **Typed inputs:** `SpecArtifact`, `StepManifest`, `AuditSummary`
- **Typed outputs:** `PlanArtifact`, `StepExitReceipt`, `JournalEvent`
- **Failure:** If a required spec reference is missing, fail closed; no plan pass is emitted.
- **Skip:** When a conditional planning branch does not apply, record `skipped` and why.
- **Retry:** After plan review failure, retry under a new `attempt_id` with updated evidence.
- **Human:** When implementation scope changes, emit `needs_human` for approval.
- **Decision:** local — planning order and approval gates are local to this stage.
- **Rationale:** Dependency sequencing cannot be shared without changing plan semantics.
- **Evidence:** `workflows/build-plan/steps.json` and plan review receipt references.
- **Semantic contract:** Specification becomes an approved executable plan.
- **Mechanism:** build-plan-stage-protocol

### build-code

- **Typed inputs:** `PlanArtifact`, `StepManifest`, `AuditSummary`
- **Typed outputs:** `ImplementationCommit`, `TestEvidence`, `StepExitReceipt`
- **Failure:** When RED/GREEN or review evidence is missing, return failure; do not publish a pass.
- **Skip:** When a phase has no file change, record `skipped` or no-change evidence with reason.
- **Retry:** On review revision, retry the affected phase with a new `attempt_id` and fresh evidence.
- **Human:** When a requested change exceeds allowed paths, emit `needs_human` before editing.
- **Decision:** local — implementation, commits, and RED/GREEN are phase-specific.
- **Rationale:** Build evidence has code and repository side effects unavailable to other consumers.
- **Evidence:** `workflows/build-code/steps.json`, test evidence, and phase commit records.
- **Semantic contract:** Approved plan is implemented and evidenced within scope.
- **Mechanism:** build-code-stage-protocol

### verify-code

- **Typed inputs:** `ImplementationCommit`, `TestEvidence`, `AuditSummary`
- **Typed outputs:** `VerificationResult`, `StepExitReceipt`, `JournalEvent`
- **Failure:** If validation fails or evidence is tampered, return failure with the finding.
- **Skip:** When a declared non-applicable verification exists, emit `skipped` with its condition.
- **Retry:** After a repair, run verification in a new `attempt_id`; retain prior observed facts.
- **Human:** When evidence is ambiguous, emit `needs_human` instead of inferring a verdict.
- **Decision:** local — verification scope and result publication are stage-specific.
- **Rationale:** Verifier execution is not the same as canonical audit adjudication.
- **Evidence:** `workflows/verify-code/steps.json` and verification result references.
- **Semantic contract:** Implementation evidence is checked against the approved plan.
- **Mechanism:** verify-code-stage-protocol

### stage-result

- **Typed inputs:** `AuditSummary`, `EvidenceRef`, `StageResult`
- **Typed outputs:** `StageResult`, `AuditSummaryRef`
- **Failure:** If summary ref, hash, or verdict disagrees, reject the result as failure.
- **Skip:** When legacy audit fields are absent during cutover, mark audit state `unknown`; do not pass.
- **Retry:** After aggregator publication, rebuild the reference from the unchanged canonical summary.
- **Human:** When aggregator verdict is `needs_human`, preserve it and require human resolution.
- **Decision:** reuse — carry the aggregator's canonical summary unchanged.
- **Rationale:** Multiple result producers share one reference-preservation behavior.
- **Evidence:** `runtime/schemas/audit-summary.schema.json` and stage-result contract tests.
- **Semantic contract:** Reference and preserve, never recompute, the canonical audit verdict.
- **Mechanism:** audit-summary-reference-carrier

### validator

- **Typed inputs:** `StageResult`, `AuditSummary`, `EvidenceRef`
- **Typed outputs:** `ValidatorResult`, `VerifiedSummaryHash`
- **Failure:** If structure, hash, or reference mismatches, set `ok=false` with errors.
- **Skip:** When a legacy result lacks required audit fields, return `unknown` rather than success.
- **Retry:** After the caller repairs the reference, validate the same published summary again.
- **Human:** When canonical verdict is `needs_human`, report it without replacing it.
- **Decision:** reuse — use shared summary reference/hash verification.
- **Rationale:** This consumer needs the same preservation semantics as stage-result, not a new verdict.
- **Evidence:** `runtime/schemas/audit-summary.schema.json` and validator contract tests.
- **Semantic contract:** Reference and preserve, never recompute, the canonical audit verdict.
- **Mechanism:** audit-summary-reference-carrier

### facts-assembly

- **Typed inputs:** `AuditSummary`, `EvidenceRef`, `FactsInput`
- **Typed outputs:** `FactsOutput`, `AuditSummaryRef`
- **Failure:** If required audit evidence is absent, retain `unknown` with reason; do not fabricate facts.
- **Skip:** When an optional fact source is unavailable, preserve a `skipped` fact and source limitation.
- **Retry:** After evidence arrives, reassemble from canonical references without changing the verdict.
- **Human:** When canonical verdict is `needs_human`, expose it to the human interface unchanged.
- **Decision:** reuse — use shared summary reference/hash preservation.
- **Rationale:** Facts assembly shares the carrier semantics and must not become a second adjudicator.
- **Evidence:** `runtime/schemas/audit-summary.schema.json` and facts subschema tests.
- **Semantic contract:** Reference and preserve, never recompute, the canonical audit verdict.
- **Mechanism:** audit-summary-reference-carrier

## P0 discoverable contract skills

These entries are callable contracts for P1–P3, not evidence that their runtime wiring is complete.

| skill | typed purpose | consumer | local file |
|---|---|---|---|
| stage-step-receipts | canonical step outcome and evidence receipt | P1 workflow wiring, P2 summaries, P3 lineage | `skills/stage-step-receipts/SKILL.md` |
| audit-summary-carrier | bounded summary reference/hash/freshness carrier | P2 stage result and validator, P3 lineage | `skills/audit-summary-carrier/SKILL.md` |
| requirement-lineage | requirement → decision → artifact → verification record | P3 audit and verify-code | `skills/requirement-lineage/SKILL.md` |

Audit note: `checkpoint-protocol` and `review-trigger` were historical registry labels without local skill files. The live registry instead names the discoverable local contracts `stage-step-receipts` and `wh-review`; this document does not treat historical archive references as runtime dependencies.
