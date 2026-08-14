# Stage atomic-step inventory (P0 contract)

Status: Current five-stage contract inventory. It freezes the ordered step IDs and
skill-routing boundary; it does **not** claim that a quality fact is a progression
permit or that a provider verdict replaces main-agent finding disposition.

Source of truth for IDs: `workflows/<stage>/steps.json`. `SKILL.md` sections below are legacy-reference mappings. Unknown legacy actions fail closed through `docs/migration-and-fallback.md`.

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
| make-decision | 11 | stage-end-spec-analyze | S8.5 | report-only consistency check before publish |
| make-decision | 12 | approve-decision | S9 | only real user confirmation counts |
| make-decision | 13 | publish-decision | S10 | publish the current artifact snapshot |
| build-spec | 1 | read-decision-log | pre-read | read the controlled current materials |
| build-spec | 2 | conditional-spec-research | research | real question only; else skipped |
| build-spec | 3 | spec-clarify | clarification | unique build-spec clarification owner |
| build-spec | 4 | spec-specify | spec generation | generate spec.md from decision-log |
| build-spec | 5 | simplicity-guard | simplicity lens | delete, narrow, or reuse before lock |
| build-spec | 6 | plan-ceo-review | product lens | record advisory product findings |
| build-spec | 7 | conditional-plan-design-review | UI-only design lens | otherwise record skipped |
| build-spec | 8 | freeze-spec | material freeze | freeze before independent review |
| build-spec | 9 | review-frozen-spec | wh-review | one advisory异源 review |
| build-spec | 10 | main-agent-disposes-findings | disposition | inspect every finding |
| build-spec | 11 | stage-end-spec-analyze | final cross-material trace | report-only consistency check before publish |
| build-spec | 12 | publish-spec-result | handoff | publish spec and facts |
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
| build-code | 1 | read-current-task-documents | pre-read | read all four current materials |
| build-code | 2 | write-red-tests | TDD RED | record real RED or unknown |
| build-code | 3 | implement-change | implementation | stay within task scope |
| build-code | 4 | inspect-and-route-actual-tests | actual diff | reroute when changed scope differs |
| build-code | 5 | invoke-concrete-testing-skill | concrete testing | invoke backend/frontend/fullstack after code |
| build-code | 6 | run-tests | phase test | execute focused command and oracle |
| build-code | 7 | scan-diff | diff scan | repair accidental scope drift |
| build-code | 8 | review-change | phase review | record current review fact; unavailable never blocks repair |
| build-code | 9 | analyze-review-findings | disposition | main agent assesses every finding |
| build-code | 10 | capture-implementation | evidence | bind evidence to current snapshot |
| build-code | 11 | authenticate-current-task-completion | task audit | retain incomplete facts honestly |
| build-code | 12 | run-final-aggregate-and-ac-trace | final tests and AC trace | run final aggregate before integration review |
| build-code | 13 | final-integration-review | integration review | existing phase_id=null review after tests |
| build-code | 14 | stage-end-spec-analyze | final cross-material trace | report-only consistency check before publish |
| build-code | 15 | publish-code-result | handoff | after all Phase and final facts |
| verify-code | 1 | read-current-materials-and-code | pre-read | read all four current materials and implementation |
| verify-code | 2 | architect-acceptance-review | architecture check | reverse-check requirements, Design, and full user flow |
| verify-code | 3 | main-agent-repair-batch-1 | repair | fix only valid delivery findings |
| verify-code | 4 | run-declared-check-before-independent-review | verification | run affected checks before review |
| verify-code | 5 | run-one-independent-architecture-review | wh-review | one异源 architecture review |
| verify-code | 6 | main-agent-repair-batch-2 | final repair | inspect findings and repair once |
| verify-code | 7 | run-final-check-and-handoff | handoff | run final check and preserve unknown |
| verify-code | 8 | publish-verification-attempt | verification facts | retain unknown/failure facts |
| verify-code | 9 | approve-verification | confirmation | record actual user conclusion |
| verify-code | 10 | stage-end-spec-analyze | final cross-material trace | report-only consistency check before publish |
| verify-code | 11 | publish-verification-result | handoff | close remains separate authorization |

## P0 boundary

P1 may wire these IDs into workflow instructions and receipts. P2 may implement summary carrying and validation. P3 may reconcile requirement lineage and verify the evidence matrix. The finding-disposition step is a quality fact and handoff record, not a quality gate or permission object. Any runtime claim requires its own implementation evidence and tests. This inventory never creates a reopen or recovery permit; it only records facts and handoff.
