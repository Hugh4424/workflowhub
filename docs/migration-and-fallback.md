# 迁移与回滚流程

## Canonical cutover contract

`workflows/{stage}/steps.json` 是唯一 expected-step authority。journal 与 entry/exit receipt 只写 observed facts；不得补写 manifest，也不得把 skip 当 success。`core/audit-aggregator.mjs` 是唯一 canonical verdict authority；stage-result、validator、facts assembly 只携带或验证其 `audit_summary_ref`、`audit_verdict`、`audit_summary_hash`。

新 stage-result producer 使用 `core/audit-summary-carrier.mjs` 写 v1 tuple：`audit_contract_version`、`audit_summary_ref`、`audit_summary_hash`、`audit_verdict`。引用必须 task-relative；consumer 只能核对已发布 summary 的 hash/verdict，diff/test 仍是物理事实，不得成为第二个质量 verdict。旧 receipt 缺 tuple 时保留 legacy + migration hint/unknown，绝不推断 `pass`。

旧 caller 先把来源规范化为 `CanonicalSourceInput`，再调用 generic core。offline caller 使用 fixture adapter；Multica caller 使用 `normalizeMulticaSource`。两者对等内容必须得到相同 ledger、summary、verdict；平台字段不得进入 generic core。

## 四分支判定（D8/D11）

| 输入 | 判定 | 动作 |
| --- | :---: | --- |
| bad_count < 2 | switch | 继续用 workflowhub |
| bad_count ≥ 2 且根因≠workflowhub | hold | 暂停自举 task，排查 task 自身问题 |
| bad_count ≥ 2 且根因=workflowhub | rollback | 执行回滚步骤 |
| 任一核心指标倒退>2×基线 | manual_review | 降为需人工复核（D12） |

## 回滚步骤

1. 切回 agenthub harness 运行新 task
2. 停止 workflowhub 自举 task
3. 通知相关 task owner
4. 记录回滚原因到 workflow-issues.jsonl

## fallback 触发条件

- 对照报告 bad_count ≥ 2
- reviewer 判定根因是 workflowhub（非 task 自身问题）
- 由人看报告判定，不自动触发（D11）

## 现跑 task 定义（D8）

- agenthub harness 中 state=active 且 currentStatus≠completed 的 task
- 范围明确，判定可执行

## Canonical step topology v1

`workflows/{stage}/steps.json` is the only expected-step authority. `SKILL.md` retains detailed operational guidance, but its older section labels are not runtime identifiers. Executors must emit and validate the canonical `step_id`; unknown labels return `UNKNOWN_STEP` and do not become a success fact.

| Legacy identifier | Canonical identifier | Status | Migration action |
| --- | --- | --- | --- |
| make-decision S0–S1 | `load-context`, `triage-scope`, `research-inputs` | mapped | Use the matching canonical action. |
| make-decision S2–S8 | `clarify-direction`, `review-decision` | mapped | Record conversation and review evidence at the declared step. |
| make-decision S9–S10 | `approve-decision`, `write-decision-log` | mapped | Preserve explicit human approval before writing. |
| build-spec legacy sections | `read-decision-log` through `publish-spec-result` | mapped | Use manifest order 1–6. |
| build-plan legacy sections | `read-spec` through `publish-plan-result` | mapped | Use manifest order 1–7; approval remains explicit. |
| build-code legacy sections | `read-plan` through `publish-code-result` | mapped | Use manifest order 1–8 and retain RED/GREEN evidence. |
| verify-code legacy sections | `read-build-result` through `publish-verification-result` | mapped | Use manifest order 1–6. |
| R10 | none | withdrawn | Retain history only; exclude from coverage denominator. |
| Any unmapped action or missing field | none | unknown | Return `UNKNOWN_STEP` or `LEGACY_FIELDS_MISSING`; request migration instead of inferring success. |

Source adapters return `SOURCE_INCOMPLETE` for missing or incomplete authoritative requirements and `SOURCE_UNKNOWN` for an explicitly unknown source. Callers must preserve these states; generic core consumes only canonical source fields.

## Caller migration and fallback

| Old caller behavior | New canonical behavior | Cutover / fallback |
| --- | --- | --- |
| Read `SKILL.md` labels as runtime steps | Resolve canonical `step_id` from the stage `steps.json` manifest | An unmapped label returns `UNKNOWN_STEP`; request migration, do not infer success. |
| Treat journal as expected plan | Read expected steps from manifest and observed facts from journal/receipts | Preserve duplicate/out-of-order/unknown facts for aggregator findings. |
| Locally decide a stage pass | Reference the aggregator `AuditSummary` and its hash | Missing/mismatched reference is failure or `unknown`, never a local pass. |
| Send Multica-native source to core | Normalize to `CanonicalSourceInput` | Offline fixture and Multica source remain equivalent at the core boundary. |
| Omit legacy identity or source completeness | Supply canonical field or return explicit error | Use `LEGACY_FIELDS_MISSING`, `SOURCE_INCOMPLETE`, or `SOURCE_UNKNOWN`; include migration hint. |

## Completion signals

Migration is complete when all five manifests expose canonical IDs, every old identifier is `mapped`, `withdrawn`, or explicitly `unknown`, and all stage-result/validator/facts callers carry one matching aggregator summary reference and hash. `R10` remains `withdrawn`, with no executable target and no coverage denominator contribution.

## Performance facts and safe fallback

Performance is not implied by a migration pass. If no measured command, source, or captured duration exists, record `performance=unknown` and `reason=measurement unavailable`; do not zero-fill, estimate, or claim regression/improvement. For any audit ambiguity, retain observed evidence, emit `needs_human` or `unknown` as applicable, and return to the last verified canonical summary rather than inventing a fallback verdict.
