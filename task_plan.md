# WorkflowHub build-prd implementation

## Goal
Complete the authorized build-code and verify-code work for the portable `build-prd` capability in the authenticated target worktree, preserving the five formal stages and four current materials; stop before `close` and report plainly.

## Phases
- [x] P1 portable discovery/release closure implemented and targeted-tested.
- [x] P2 `spec-prd` content skill implemented and targeted-tested.
- [ ] P3 non-stage `build_prd` review surface and fail-closed identity/persistence guards implemented; same-task audit repairs remain.
- [x] Reconcile four-material execution facts and record T003/T004/T006 evidence/order discrepancies without claiming missing receipts as pass.
- [ ] Resolve remaining P3 identity/material/CLI bypasses with RED/GREEN targeted tests before build-code handoff.
- [ ] Execute standard build-code workflow, targeted tests, phase reviews, stage-end analysis/outcome/reflection as available.
- [ ] Execute standard verify-code workflow, repairs, final review/outcome/reflection as available.
- [ ] Stop before close and report implementation, facts, unavailable evidence, and next plan.

## Current phase
Same-task P3 repair and independent hardening before build-code.

## Next Step
Collect the recorder/finalizer workers and independent boundary audit, then run all affected focused P3 suites; do not start build-code until source edits, identity findings, and provenance are reconciled.


## Decisions Made
- Worktree: `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-build-prd`.
- Branch: `task/workflowhub/workflowhub-build-prd`.
- No commit, push, merge, archive, cleanup, or close without authorization.
- P3 build-prd review is report-only and never canonical formal-stage persistence.
- Preserve `unknown`, `unavailable`, and `incomplete`; missing receipts/providers are not passes.
- Literal first unchecked card is T003; intended post-P1–P3 card is T007; the ledger is stale and must not be silently bypassed.

## Errors Encountered
- Move-map JSON was temporarily malformed during hash refresh; repaired and validated with `JSON.parse`.
- `phase0-deletion-disposition --check` fails on stale retention hash and many pre-existing inventory/unclassified-file discrepancies; not treated as a task-specific clean result.
- External diagnostic commands `target-test-command --version` and `workflowhub-capability wh-review-provider` remain unavailable.

## Evidence
- P3 contract + closure + provenance: 35/35 passed.
- Material/helper focused suite: 85/85 in target worktree; independent helper reports 86/86 direct P3 guards and 50/50 material regressions.
- P3 contract + recorder: 57/57 passed; syntax and git diff checks passed before the latest same-task runner patch.
- Latest independent P3 audit found remaining finalization, canonical recorder, arbitrary-kind, unknown-material, semantic alias, and bare-CLI recovery bypasses; repair is in progress and no completion claim is made.
- `repo-skills-manifest --check`: passed.
- Authenticated build-code status: work_status=ready, continuation_allowed=true, quality_status=in_progress; quality facts missing risk_tests_fresh, acceptance_criteria, stage_end_spec_analyze, finding_dispositions, integration_review, stage_outcome.
- Current status is read-only readiness projection, not task-card completion.
