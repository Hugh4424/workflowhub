# Stage atomic-step inventory (P0 contract)

Status: Five-stage step inventory for the agreed route. The normal code-review sequence is one OCR
review per build-code Phase, final aggregate tests and per-AC results, then one
OCR review of the final verify-code worktree. Quality facts remain distinct from
work permission and main-agent finding disposition.

Source of truth for executable IDs: `workflows/<stage>/steps.json`. `SKILL.md` sections below are
legacy-reference mappings. Unknown legacy actions fail closed through `docs/migration-and-fallback.md`.

| Stage | Canonical ID | Manifest step | Legacy section mapping | Conditional behavior to preserve |
|---|---:|---|---|---|
| make-decision | 1 | load-context | S0 | missing task/worktree: fail-loud |
| make-decision | 2 | triage-scope | S0.5 | scope mode is recorded, never guessed |
| make-decision | 3 | talk-round-1 | S2 | ask only direction-changing questions |
| make-decision | 4 | research-inputs | S1/S3 | no real question: record skipped |
| make-decision | 5 | talk-round-2 | S4 | preserve user choices and risks |
| make-decision | 6 | direction-advice | S5 | wh-review owns the provider |
| make-decision | 7 | talk-round-3 | S7 | clarify only unresolved direction items |
| make-decision | 8 | grill-with-docs | S7 | main agent communicates with user |
| make-decision | 9 | write-decision-draft | S7 | write the current decision log |
| make-decision | 10 | detail-advice | S7 | retain advisory findings |
| make-decision | 11 | approve-decision | S9 | only real user confirmation counts |
| make-decision | 12 | stage-end-spec-analyze | S9.5 | final consistency check after confirmation and aggregate |
| make-decision | 13 | publish-decision | S10 | publish the current artifact snapshot |
| make-decision | 14 | stage-reflection | on-stage-end | write judgment-layer reflection; failure is recorded and non-blocking |
| build-spec | 1 | read-decision-log | pre-read | read the controlled current materials |
| build-spec | 2 | conditional-spec-research | research | real question only; else skipped |
| build-spec | 3 | spec-clarify | clarification | unique build-spec clarification owner |
| build-spec | 4 | spec-specify | spec generation | generate spec.md from decision-log |
| build-spec | 5 | simplicity-guard | simplicity lens | delete, narrow, or reuse before lock |
| build-spec | 6 | plan-ceo-review | product lens | record advisory product findings |
| build-spec | 7 | ui-project-init | UI-only design input | otherwise record not applicable |
| build-spec | 8 | design-source-readiness | UI-only design input | existing page/data/spec sources or explicit unavailable |
| build-spec | 9 | conditional-plan-design-review | UI-only design lens | otherwise record skipped |
| build-spec | 10 | freeze-spec | material freeze | freeze before independent review |
| build-spec | 11 | review-frozen-spec | wh-review | one advisory异源 review |
| build-spec | 12 | main-agent-disposes-findings | disposition | inspect every finding |
| build-spec | 13 | stage-end-spec-analyze | final cross-material trace | report-only consistency check before publish |
| build-spec | 14 | publish-spec-result | handoff | publish spec and facts |
| build-spec | 15 | stage-reflection | on-stage-end | write judgment-layer reflection; failure is recorded and non-blocking |
| build-plan | 1 | read-current-materials | pre-read | read decision-log and spec |
| build-plan | 2 | conditional-spec-research | research | real question only; else skipped |
| build-plan | 3 | testing-system-blueprint | test design | outline behavior, state, error, seam, and delivery cases |
| build-plan | 4 | spec-plan | plan generation | produce plan draft |
| build-plan | 5 | simplicity-guard | simplicity lens | delete, narrow, or reuse |
| build-plan | 6 | plan-eng-review | engineering lens | inspect boundaries and failure paths |
| build-plan | 7 | test-routing-advisor | test routing | preselect tier and concrete skill |
| build-plan | 8 | spec-tasks | task generation | record commands, oracle, evidence |
| build-plan | 9 | review-plan | wh-review | one advisory异源 review |
| build-plan | 10 | main-agent-disposes-findings | disposition | inspect every finding |
| build-plan | 11 | final-spec-analyze | final cross-material trace | report-only check before publish |
| build-plan | 12 | publish-plan-result | handoff | publish plan/tasks and facts |
| build-plan | 13 | stage-reflection | on-stage-end | write judgment-layer reflection; failure is recorded and non-blocking |
| build-code | 1 | read-current-task-documents | pre-read | read the current cohort materials |
| build-code | 2 | write-red-tests | TDD RED | record real RED or unknown |
| build-code | 3 | implement-change | implementation | stay within task scope |
| build-code | 4 | inspect-and-route-actual-tests | actual diff | reroute when changed scope differs |
| build-code | 5 | invoke-concrete-testing-skill | concrete testing | invoke backend/frontend/fullstack after code |
| build-code | 6 | run-tests | phase test | execute focused command and oracle |
| build-code | 7 | scan-diff | diff scan | repair accidental scope drift |
| build-code | 8 | review-change | Phase OCR review | dispatch once for this Phase; record findings or unavailable |
| build-code | 9 | analyze-review-findings | disposition | main agent assesses every finding |
| build-code | 10 | capture-implementation | evidence | bind evidence to current snapshot |
| build-code | 11 | authenticate-current-task-completion | task audit | retain incomplete facts honestly |
| build-code | 12 | run-final-aggregate-and-ac-trace | final tests and AC trace | run aggregate once after all Phase reviews; record each AC result |
| build-code | 13 | stage-end-spec-analyze | final cross-material trace | report-only consistency check before publish |
| build-code | 14 | publish-code-result | handoff | after all Phase and final facts |
| build-code | 15 | stage-reflection | on-stage-end | write judgment-layer reflection; failure is recorded and non-blocking |
| verify-code | 1 | read-current-materials-and-code | pre-read | read current cohort materials, final implementation and full AC |
| verify-code | 2 | ocr-code-review | final OCR review | dispatch once for the current worktree; record findings or unavailable |
| verify-code | 3 | publish-code-review-fact | review facts | consume that review's canonical result or unavailable attempt |
| verify-code | 4 | main-agent-repair-batch-1 | repair | fix valid delivery findings in the same task |
| verify-code | 5 | inspect-real-entry-and-tests | verification | inspect real entry, consumers, tests and failure paths |
| verify-code | 6 | targeted-recheck | focused test | check only repaired or affected behavior |
| verify-code | 7 | record-finding-dispositions | disposition | retain each finding and its actual disposition |
| verify-code | 8 | run-final-code-check-and-handoff | handoff | check current risks and preserve unknowns |
| verify-code | 9 | handoff-code-review | handoff | explain findings, repairs and remaining risks |
| verify-code | 10 | finalize-code-review | review readback | consume the same review and its disposition |
| verify-code | 11 | publish-verification-result | handoff | close remains separate authorization |
| verify-code | 12 | stage-reflection | on-stage-end | write judgment-layer reflection; failure is recorded and non-blocking |

Existing integration attempts and results remain read-only facts.

## P0 boundary

P1 may wire these IDs into workflow instructions and receipts. P2 may implement summary carrying and validation. P3 may reconcile requirement lineage and verify the evidence matrix. The finding-disposition step is a quality fact and handoff record, not a quality gate or permission object. Any runtime claim requires its own implementation evidence and tests. This inventory never creates a reopen or recovery permit; it only records facts and handoff.
