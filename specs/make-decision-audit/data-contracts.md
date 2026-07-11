# Data Contracts: WorkflowHub 五阶段重构与步骤级审计

本文件提取 `spec.md` 中跨 stage、记录写入者、审计 core、平台 adapter 与结果消费者的边界合同。字段类型为计划阶段建议的逻辑类型；最终 schema 可细化，但不得削弱验证语义。

## 1. Canonical Stage Topology

- **Owner side**：WorkflowHub workflow registry / stage definitions
- **Consumer side**：五个 stage executor、manifest loader、迁移工具、audit aggregator
- **Required fields/types**：`stages: Stage[]`；`Stage.id: integer`；`Stage.slug: enum(make-decision, build-spec, build-plan, build-code, verify-code)`；`Stage.primary_action: non-empty string`；`legacy_mapping: {legacy_action_id: string, stage_slug: StageSlug}[]`
- **Validation**：恰好 5 个 stage；ID 连续、唯一、无空洞；slug 集合精确匹配 canonical 集合；每个 legacy action 恰好映射一次；每 stage 仅一个主要动作。
- **Version / compatibility**：新 topology 为 canonical v1；旧编号只通过显式 `legacy_mapping` 迁移，不得运行时猜测或保留双重权威。

## 2. Canonical Step Manifest (`steps.json`)

- **Owner side**：各 stage 定义维护者
- **Consumer side**：stage executor、manifest validator、audit aggregator、fixtures
- **Required fields/types**：`schema_version: string`；`stage_slug: StageSlug`；`steps: StepContract[]`；`StepContract.step_id: non-empty stable string`；`order: positive integer`；`entry_conditions: Condition[]`；`completion_evidence: EvidenceRequirement[]`；`observable_result: non-empty string`；`depends_on: step_id[]`
- **Validation**：step ID 唯一稳定；`order` 连续、唯一且完整；依赖引用存在且无环；声明顺序满足依赖；入口条件、完成证据、可观察结果不得缺失；manifest 不得依据 journal 动态扩张。
- **Version / compatibility**：五个 stage 各一份 canonical manifest；schema 版本显式；legacy 隐式步骤必须先完成旧→新映射，未知步骤按 fail-closed 处理。

## 3. Step Entry Receipt

- **Owner side**：stage executor / receipt writer
- **Consumer side**：journal、audit aggregator、validator
- **Required fields/types**：`workflow_run_id: non-empty string`；`stage_slug: StageSlug`；`step_id: manifest step ID`；`attempt_id: non-empty string|integer`；`event_type: "step_entry"`；`timestamp: RFC3339 string`；`entry_evidence: object`
- **Validation**：stage/step 必须存在于本次 canonical manifest；attempt 身份完整；同一 attempt 的 entry 不得重复；entry 必须先于 terminal exit；写入失败采用 fail-closed，不得继续把 step 记为完成。
- **Version / compatibility**：沿用现有 `writeEntryReceipt(taskId, payload)` 边界；legacy 缺关键字段返回可定位的 legacy/unknown，不静默补值。

## 4. Step Exit Receipt

- **Owner side**：stage executor / receipt writer
- **Consumer side**：journal、audit aggregator、validator、chain topology
- **Required fields/types**：`workflow_run_id: non-empty string`；`stage_slug: StageSlug`；`step_id: manifest step ID`；`attempt_id: non-empty string|integer`；`event_type: "step_exit"`；`timestamp: RFC3339 string`；`terminal_status: enum(success, failure, skipped, needs_human)`；`completion_evidence: object|reference`
- **Validation**：必须与同一 run/stage/step/attempt 的 entry 配对；每 attempt 最多一个 terminal exit；不得跨 attempt 拼接；evidence 满足 manifest；缺失、重复、未知或乱序均不能 pass。exit 写入基础设施失败保持可观察 warn-only，但 aggregator 必须因缺证据 fail-closed。
- **Version / compatibility**：沿用现有 `writeExitReceipt(taskId, payload)`；允许明确的 skip/human 事实，但不得把它们解释为成功。

## 5. Execution Journal Event Stream

- **Owner side**：journal appender / stage executors
- **Consumer side**：audit aggregator、receipt verifier、诊断工具
- **Required fields/types**：append-only `JournalEvent[]`；每项含 `workflow_run_id`、`stage_slug`、`step_id`、`attempt_id`、`event_type`、`timestamp`、`payload`；字段类型与 entry/exit receipt 一致。
- **Validation**：事件只能描述 observed facts；保持原始顺序；不得重写 expected topology；分页、批量读取或顺序变化不能漏计；未知、重复与乱序事件必须保留给 aggregator 裁决。
- **Version / compatibility**：既有 journal 可继续作为事实源；缺 canonical identity 的遗留事件标为 legacy/unknown，禁止零填或推断 pass。

## 6. Immutable Requirement Ledger

- **Owner side**：requirements/decision pipeline；Multica adapter 或 offline fixture 提供来源
- **Consumer side**：generic coverage core、audit aggregator、文档/验收消费者
- **Required fields/types**：`schema_version: string`；`requirements: Requirement[]`；`Requirement.requirement_id: immutable non-empty string`；`status: enum(accepted, withdrawn, rejected, unknown)`；`source_ref: EvidenceRef`；`decision_ref: EvidenceRef`；`artifact_refs: EvidenceRef[]`；`acceptance_criteria_refs: EvidenceRef[]`；`content_hash: string`；`upstream_hashes: string[]`；`stale: boolean`
- **Validation**：requirement ID 唯一且不可变；accepted 项必须具备 source→decision→artifact→acceptance 完整 lineage；withdrawn 不进入 coverage 分母；R1–R9 coverage 为 9/9，R10 仅保留 withdrawn 历史；hash 可验证，上游变化必须传播 stale。
- **Version / compatibility**：canonical ledger v1；遗留 caller 缺必填字段返回 legacy/unknown 与迁移指引，不静默生成空 ledger。

## 7. Canonical Source Input

- **Owner side**：Multica source adapter、offline fixture adapter
- **Consumer side**：generic core / ledger builder
- **Required fields/types**：`source_type: enum(multica, offline_fixture)`；`source_id: non-empty string`；`source_version|revision: string`；`requirements: CanonicalSourceRequirement[]`；`content_hash: string`；`completeness: enum(complete, incomplete, unknown)`；`evidence_refs: EvidenceRef[]`
- **Validation**：两种来源规范化为同一 canonical shape；adapter 获取不完整时返回 `SOURCE_INCOMPLETE` 或 unknown，不提交空 ledger；core 不得依赖平台专有字段。
- **Version / compatibility**：adapter 可随平台演化，canonical input 版本保持显式；offline fixture 与 Multica input 在等价内容下必须产生等价 summary/verdict。

## 8. Evidence Reference

- **Owner side**：manifest、ledger、receipt/journal 与 artifact producer
- **Consumer side**：aggregator、validator、stage-result、facts assembly、审查工具
- **Required fields/types**：`kind: non-empty enum|string`；`uri_or_path: non-empty string`；`content_hash: string`；可选 `anchor: string`、`generated_at: RFC3339 string`
- **Validation**：引用可解析；hash 与目标内容一致；anchor 存在；断裂、tampered hash 或 stale 引用不能支持 pass。
- **Version / compatibility**：允许新增 evidence kind，但消费者遇到未知必需 kind 时标为 unknown，不忽略。

## 9. Canonical Audit Summary

- **Owner side**：audit aggregator（唯一 verdict authority）
- **Consumer side**：stage-result、validator、facts assembly、人工审查与报告工具
- **Required fields/types**：`schema_version: string`；`workflow_run_id: string`；`expected_steps: StepRef[]`；`observed_steps: ObservedStep[]`；`requirement_coverage: {covered: integer, total: integer, withdrawn: integer, missing_ids: string[]}`；`facts: {missing: Finding[], unexpected: Finding[], duplicate: Finding[], out_of_order: Finding[], unknown: Finding[], stale: Finding[], tampered_hash: Finding[]}`；`verdict: enum(pass, fail, unknown, needs_human)`；`evidence_refs: EvidenceRef[]`；`summary_hash: string`
- **Validation**：计数可由 manifest、ledger、journal 与 receipts 重算；每个 expected step 与同 attempt matching entry/terminal exit 对账；required field、证据或引用缺失不得发布 pass；R10 不计分母；只有 aggregator 可生成 verdict。
- **Version / compatibility**：schema version 显式；新增 finding 类型须保持 fail-closed；legacy/unknown 不得映射为 pass。

## 10. Stage Result Audit Reference

- **Owner side**：各 stage result producer
- **Consumer side**：下一 stage、validator、facts assembly、WorkflowHub orchestration
- **Required fields/types**：既有 stage-result 字段保持；新增/要求 `audit_summary_ref: EvidenceRef|string`、`audit_verdict: canonical verdict`、`audit_summary_hash: string`（具体命名可由实现计划冻结，但语义不可拆分）。
- **Validation**：引用必须命中 aggregator 产出的 summary；verdict/hash 必须与 summary 一致；stage-result 不得独立重算或覆盖 verdict；引用缺失/不一致时不得视为成功审计。
- **Version / compatibility**：保留所有既有 stage-result caller 所需字段；通过版本化新增审计引用；迁移期 legacy result 明确标记 unknown。

## 11. Validator Result

- **Owner side**：stage-result validator / receipt verifier
- **Consumer side**：orchestrator、人工诊断、后续 stage
- **Required fields/types**：`ok: boolean`；`errors: string[]`；`audit_summary_ref: EvidenceRef|string`；`verified_summary_hash: string|null`；`canonical_verdict: AuditVerdict`
- **Validation**：只验证 summary 结构、hash、引用与 stage-result 一致性；不得自行用 observed facts 重算质量 verdict；任一一致性错误使 `ok=false`。
- **Version / compatibility**：现有 `{ok, errors}` 合同保留；新增字段向后兼容，legacy 缺审计引用时明确 unknown/error。

## 12. Facts Assembly Output

- **Owner side**：facts assembly
- **Consumer side**：stage-result/reporting/metrics 与人工界面
- **Required fields/types**：物理事实集合；至少包含 `audit_summary_ref`、`canonical_verdict`、`evidence_refs` 与现有事实字段。
- **Validation**：仅装配，不裁决；引用的 verdict/hash 必须与 aggregator summary 相同；缺事实保留 null/unknown 与原因，不得零填或派生第二 verdict。
- **Version / compatibility**：保留现有 facts 字段；新审计字段版本化追加；旧消费者可忽略新增字段，但不得把缺失当 pass。

## 13. Consumer / Evidence Matrix

- **Owner side**：scope-triage / architecture documentation
- **Consumer side**：计划、复用 registry、审查与迁移执行者
- **Required fields/types**：`consumers: ConsumerDecision[]`；每项含 `consumer_id`、`evidence_inputs`、`typed_io`、`failure_semantics`、`skip_semantics`、`human_semantics`、`reuse_decision: enum(reuse, local, extract)`、`rationale`。
- **Validation**：8/8 已裁定消费者（5 stages + stage-result + validator + facts assembly）均有记录；复用决定由消费者数量、重复度与语义证据支持；语义不同不得伪复用。
- **Version / compatibility**：作为文档/registry 合同演进；新增消费者必须显式登记，不能自动扩大本次验收分母。

## 14. Migration Mapping and Error Contract

- **Owner side**：migration layer / caller documentation
- **Consumer side**：legacy callers、operators、五阶段 executor
- **Required fields/types**：`legacy_identifier: string`；`canonical_identifier: string|null`；`migration_status: enum(mapped, withdrawn, unsupported, unknown)`；`error_code: enum(LEGACY_FIELDS_MISSING, SOURCE_INCOMPLETE, UNKNOWN_STEP, HASH_MISMATCH, STALE_EVIDENCE, ...)`；`message: non-empty string`；`migration_hint: non-empty string`。
- **Validation**：每个旧 action/field 至多一个 canonical target；unsupported/unknown 不得降级为 success；错误可定位且包含迁移指引；skip、retry、human gate 语义明确。
- **Version / compatibility**：迁移完成前保留显式 legacy boundary；不得长期维护两套 verdict authority；R10 映射为 withdrawn、无实现目标。

## 15. Audit Fixture Contract

- **Owner side**：test/fixture authors
- **Consumer side**：unit、integration、legacy、adversarial test suites
- **Required fields/types**：`fixture_id: string`；`source_input: CanonicalSourceInput`；`manifest_refs: EvidenceRef[]`；`journal_events: JournalEvent[]`；`receipts: Receipt[]`；`expected_verdict: AuditVerdict`；`expected_findings: FindingExpectation[]`。
- **Validation**：四层验证 `{unit, integration, legacy, adversarial}` 全覆盖；失效集合 `{missing, duplicate, out-of-order, unknown, tampered-hash, stale}` 各至少一个可证伪 fixture；正常五阶段全链逐项对账；大量 receipt/retry 与分页/批量场景不得漏计。
- **Version / compatibility**：fixture schema 与 canonical contracts 同版本或声明迁移版本；legacy fixture 必须保留未知/缺字段事实，不能自动升级成成功数据。

## 全局兼容与所有权约束

- expected topology 只归 manifest；observed facts 只归 journal/receipt；canonical verdict 只归 aggregator。
- generic core 只消费 canonical input；Multica adapter 只负责平台 source 获取与规范化，平台依赖不得泄漏到 core。
- 新字段与 schema 均显式版本化；未知必需字段、缺失证据、重复、乱序、stale、hash 不一致与 source incomplete 一律 fail-closed 或 unknown，不得静默默认、零填或假绿。
- 文档必须覆盖 legacy/unknown、skip、retry、human gate、错误码和迁移完成信号。
