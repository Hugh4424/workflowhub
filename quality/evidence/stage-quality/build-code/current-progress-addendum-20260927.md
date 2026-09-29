# CARD-04 build-code current progress addendum (2026-09-27)

This is a dated evidence update, not a stage completion fact, a new gate, or a replacement for the earlier audit. The authenticated worktree is `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919` on `task/workflowhub/workflowhub-thin-core-card-04-20260919`; HEAD is `ef920f1fbd415fe87d50930359059b661e141acd`. Source changes remain in the dirty worktree. The current public `status --action=begin --stage=build-code` reports `quality_status=in_progress`, `phase_progress=null`, and `execution_outcome=unavailable` because no build-code stage row exists in `facts.jsonl`.

## New bounded results since the AC16–34 audit

| Area | Current evidence | Limit |
| --- | --- | --- |
| Historical review reader, P6/T014 | [AC25 real-pair repair](P6/AC25-d1-reader-fix-20260927.md): real d1 pair readback exit 0 with 19 entries; target tests 7/7, adjacent guards 2 passed/124 skipped. Independent review found no actionable issue in the tested change. | No immutable writer epoch in v1; coordinated Task store rewriting cannot be excluded. Private probe is not an official quality receipt. AC-25 overall remains incomplete. |
| Missing post `phases/index.md` preflight | [P3 public CLI follow-up](P3/post-build-plan-cli-contract-followup-20260927.md): targeted 4/4 and adjacent 7/7. | Same-task cross-scope repair; P3/T005 card did not authorize this write. The added CLI tests followed the production fix and lack their own RED. It does not complete P3/T005. |
| P5/T008 interim report | [P5 source recheck](P5/T008-current-source-recheck-20260927.md) and the subsequent private source audit: no same-run authenticated P5/T007 implementation/checkpoint fact exists. `phase_progress` locates a Phase only and cannot prove its completion. | No report emitted. A cursor-triggered report would mislabel a P1-only or unfinished run as P5. Build-plan owner must define the real same-run fact contract and the P1 negative/real P5 positive E2E cases before implementation. |
| P6/T013 census | [Current failure and owner proposal](P6/T013-owner-scope-proposal-20260927.md): the three-file target command has 5 failed/19 passed. One failure drops itemized missing-section diagnostics; four use an archived task's former path. | Both target files are outside the present P6 write boundary. Production/tests were not edited. T013 remains not done. |
| P11 browser applicability | [Real consumer inventory](P11/real-consumer-inventory-20260927.md) plus current source/diff audit finds no authenticated business page–API/DTO–service chain for the frozen settings example. The static reflection monitor is a different consumer. | No evidence yet proves either that a browser journey applies or that it is inapplicable to the expanded scope. Keep `unknown`; no browser pass or N/A claim. |

## Material work still needed

The [material owner packet](material-owner-decision-packet-20260927.md) remains a proposal. Its historical AC-25 RED and P3 missing-index statements describe the prior audit time; the bounded fixes above supersede those *current defect observations*, not their broader incomplete acceptance status. The packet's remaining scope questions stand. Before changing protected P5/P6 files, frozen tests, or the earlier AC17–19 omission, the owning make-decision/build-plan material must state exact write scope, real source and consumers, replacement relation, and deletion condition; current-version review and actual confirmation cannot be borrowed from earlier material.

No commit, push, merge, archive, cleanup, formal build-code completion, or whole-card acceptance is claimed here.
