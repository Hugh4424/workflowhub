# Build-code Phase P2 Card

- Goal: remove review-budget consumption from the production review route; an unchanged request reuses the immutable result and an explicitly requested retry creates exactly one new attempt.
- Allowed files: `runtime/review/review-record-route.mjs`, `tests/contract/review-budget-deletion.test.mjs`, `docs/adr/0028-plan-slicing-and-review-budget.md`, `docs/architecture/control-plane-inventory.json`.
- Covered ACs: `AC-REV-002`; supporting `AC-REV-001` and `AC-REV-004` where deduplication/provenance remain intact.
- Non-goals: no changes to external provider orchestration (P3/P4), writer identity (P5/P6), close/interaction work (P7), no public command/store/schema, no commit or delivery operation.
- Compatibility: keep canonical review attempt/result/report records immutable; retain explicit route identity, subject/evidence binding, provider failure provenance, and the terminal verify-code snapshot guard.
- Test route: `feature` / `backend-testing`; actual changed files are the review route, its contract test, and inventory/ADR declarations. No UI or live service.
- RED oracle: the contract test must fail because a budget consumer is still reachable or because an explicit retry is blocked/does not create exactly one new attempt.
- GREEN oracle: the same targeted test passes, proves no production budget consumer remains, unchanged reuse dispatches zero, and explicit retry dispatches one new attempt with a distinct attempt ref.
- Stop conditions: route behavior cannot distinguish ordinary reuse from explicit retry without a current-material decision; a historical ADR/fixture consumer is mistaken for a production consumer; a new public control plane is required; or retry semantics cannot be bound to the authenticated request.
- Required handoff: actual consumer deletion, RED/GREEN exits, exact test receipt, review fact/disposition, and remaining historical documentation limits recorded in T003/T004.

## Execution result

- Route: feature; backend-testing; non_ui. `test-routing-advisor` selected the backend feature path from the review route, task-store history reader, governance inventory, and contract tests. No live service or browser surface.
- RED: T003 exited 1 at the intended budget-symbol/retry assertions; evidence is `apply/evidence/T003.stdout`.
- GREEN: T004 exited 0 with 3/3 targeted contract tests; the namespace regression is 9/9. Canonical current receipt is `quality/tests/build-code-p2-review-deletion-v4.json` with hash `1ebaf1e21339db0434f13b6ad68cc78fae4eccf0d438a5ed6e800590f6267f85`.
- Implementation: removed the production round evaluator/consumer and replaced its history read with canonical review deduplication; added explicit retry judgment (`basis` + non-empty `reason`), idempotent retry request keys, no-auto-dispatch behavior, and verify-code current-snapshot retry blocking. New records no longer carry the retired host budget context; legacy context is read-only compatibility for old reports.
- Governance: ADR-0028 now documents canonical result reuse and explicit judged retry; inventory replaces `review-budget-namespace` with `review-result-deduplication`. The old namespace contract was updated to test review-history behavior rather than budget behavior.
- Review: initial phase review `0821f20d-f9f9-5b32-a25e-5e871375af02` raised major verify snapshot and freshness-identity findings; the former was fixed by the verify snapshot contract and the latter was rejected as invalid because `runtime/evidence/freshness.mjs:614-632` already binds subject/scope/phase. Focused repair review `04605abe-efe8-5d5e-a3b3-02c2f0326aa4` found missing P1 evidence and retry validation; both were repaired. Latest focused review `a7f2a356-101f-5fa5-a0c8-fb790e6feb2f` had one minor malformed-flag finding, fixed with a negative test; no actionable major/blocking finding remains. All provider facts are semantic; raw attempts/results/reports remain in the task store.
- Limit: old external task records may still contain historical `budget_context` fields; they are read-only provenance and are not produced or consumed by the current budget-free route. P3/P4 external provider contract work remains.
