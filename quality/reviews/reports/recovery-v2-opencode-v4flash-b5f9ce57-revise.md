# WorkflowHub recovery v2 — independent review

- provider: `opencode/v4flash`
- runtime: `b5f9ce57-069c-44ba-8cbb-6a182fece9b0`
- session: `ses_0187e987effeuMcqToJ5BJ5tZ0`
- packet: `/Users/Hugh/.workflowhub/wh-review-packets/.wh-review-packets/recovery-v2-r3.tvLc0Y`
- delivery: `file_only`, byte identity verified
- duration: `5102446ms`
- verdict: `REVISE`
- blocking findings: `1`

## Blocking finding

`make-decision` still required `decision_coverage: acceptance_criterion`, while the official `stage-runtime run` route rejects caller-provided `audit` receipts and the current production tree has no audit-summary writer. Therefore the normal make-decision completion path could never reach `completed`. The e2e test had been weakened to expect `in_progress` and to call the missing audit an expected condition.

Evidence from the sealed review packet:

- `runtime/stage/completion-predicates.mjs:18`
- `runtime/stage/stage-handlers.mjs:1068-1115`
- `tools/cli/stage-runtime.mjs:216`
- `tests/e2e/vnext-five-stage-current.test.mjs:334-398`

Required disposition: remove the audit-only completion requirement and restore a reachable completed-path regression test. Audit facts may remain optional, immutable, and disclosed, but cannot be a completion or work gate.

## Nonblocking findings retained as facts

- The reviewer noted a possible exact-heading dependency for decision-log scope/non-goal/risk predicates; verify the current template and keep any mismatch explicit.
- The provider client now expects the broker's `raw_output_ref` field; the current broker smoke records are compatible, but older broker versions may not be.
- Review-runner corroboration coverage is narrower after deleting retired lifecycle machinery; production logic remains, but a direct regression test could be useful.
- Legacy audit/risk namespace compatibility is intentionally narrow in vNext; fail-loud behavior is retained.

## Provider disposition

The reviewer marked the four-material non-gate boundary, direct portable package execution, one-request review path, deletion closures, local Codex compatibility, and immutable historical reports as passing. This report is immutable audit evidence; it is not itself a workflow gate.
