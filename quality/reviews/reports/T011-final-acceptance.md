# WorkflowHub Multica recovery v2 — T011 final acceptance

## Scope

- Worktree: `/Users/Hugh/Hugh/Project/workflowhub-worktrees/workflowhub-multica-recovery-v2`
- Branch: `codex/workflowhub-multica-recovery-v2`
- Final implementation commit: `dde024a7e1808e522e5095fb64f2c602a84cd99e`
- Final fixture follow-up commit: `c4d6f1008fadfd14c8a962aad9c922a02fcd0d81`
- Final tree after fixture follow-up: `6dd1f224523fc22e5e0596111bde0b7a92faa0fb`
- Semantic public-behavior baseline: `c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf`

## Implementation and phase handoff

The repair was implemented as four bounded code phases:

- Phase A: `95bc663`, `669e362`; phase review and handoff recorded.
- Phase B: `bcb22b1`, `05b20b2`, `2d01747`; final provider review `PASS` on `2d017473a5257db65cb5d8593c8b81fb034f970d`, with host-derived commit/tree subject binding.
- Phase C: `0623cac`; final provider review `PASS`, no blocking.
- Phase D: `06ff0af`; final provider review `PASS`, no blocking.

Each code phase used its own RED/GREEN facts and applicable testing route. Phase review remains a task-local quality and handoff fact; it is not a public runtime gate, second ledger, receipt, snapshot, lock, or permission to continue.

The implementation restores the four current materials as the task truth: `decision-log.md`, `spec.md`, `plan.md`, and `tasks.md`. Quality, review, test, evidence, history, provider, receipt, and audit facts remain truthful facts; missing or unavailable facts do not freeze same-task repair and are not rewritten as PASS. `test-routing-advisor`, `testing-system-blueprint`, concrete testing skills, and independent review remain design/execution/quality evidence, not a second workflow.

## Independent final reviews

1. Full implementation commit `dde024a7e1808e522e5095fb64f2c602a84cd99e`:
   - provider: `opencode/v4flash`
   - runtime: `8bc61193-747c-4e04-b114-7112941fe27c`
   - provider session: `ses_01695a942ffeIihVJzAJNDVEFg`
   - verdict: `PASS`
   - blocking findings: none
   - packet manifest: `fcc33f0e13e0c9e4db7156d2c3df0d1357daf611e43929a270573e486ce07c18`
   - diff: `1202231` bytes; provider-visible file identity verified
   - non-blocking fixture mismatch was corrected in `c4d6f10`.

2. Fixture follow-up `c4d6f1008fadfd14c8a962aad9c922a02fcd0d81`:
   - provider: `opencode/v4flash`
   - runtime: `dcf45653-912c-491b-a536-c4b1f419e192`
   - provider session: `ses_016825332ffeh799T4Z1bfXZh0`
   - verdict: `PASS`
   - blocking findings: none
   - report: `quality/reviews/reports/recovery-v2-opencode-v4flash-c4d6f10-pass.md`

The provider's second non-blocking note about four unchanged review files was checked against both Git trees: the blobs are identical in `06ff0af` and `dde024a`; only the generated inventory rows had stale diagnostic hashes. It is not an unreviewed code change.

## Test and architecture facts

- `npm test`: exit `0`; safe `146` files, `1252 passed`, `1 skipped`; exclusive `2` files, `31 passed`.
- `npm run check`: exit `0`; markdownlint, constitution structure/checklist, anti-host, extensibility, contract, metrics, stage-quality, task paths, skill closure, and five-stage package smoke all passed.
- Phase 0 deletion disposition: exit `0`; repository inventory: exit `0`, `1193` delivery files with exactly one disposition each.
- Complexity hard-zero check: exit `0`; dedicated recovery hard-zero gates remain explicit and diagnostic budgets remain non-gating.
- Reference audit: exit `0`, unexpected violations `0`; retention audit: exit `0`, historical `461/461` unchanged; history inventory: exit `0`, `461/461` unchanged.
- `node tools/architecture/public-behavior-baseline.mjs verify`: exit `0`.
- `node tools/architecture/public-behavior-baseline.mjs compare --baseline=c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf --candidate=worktree`: exit `0`; all seven public behaviors were approved internal changes, with authorize classified as an approved bug fix.
- `npm run probe:public-behavior`: exit `0`; `10` tests passed.
- `git diff --check`: exit `0` before final evidence commit.

The public-behavior candidate fixture was regenerated from the final tree after the provider finding. It now records the current `direction_review` and `detail_review` predicates and no longer freezes retired projection names.

## Constitution and isolation acceptance

- Four-material current truth is preserved; no fifth current material was introduced.
- Review/test/evidence/history are facts, not work-readiness or delivery gates.
- No new Runner, TaskHandle, receipt replacement, snapshot lineage, bridge, review lock, successor/recovery/rebind, second executor, or public command was introduced.
- Phase review was retained as the requested quality/handoff step without entering build-plan as Grill or becoming a workflow gate.
- Historical reports and retained facts remain read-only; no historical bytes were overwritten.
- Main and Multica were not modified. The only worktree changes are on the independent recovery branch; the pre-existing main untracked capture directory was preserved.
- No provider/model/daemon configuration was changed. No push, merge, or Multica synchronization was performed.

## Acceptance boundary

T011 is complete for this recovery task. The result is accepted as a local, independently reviewed WorkflowHub repair branch. Git delivery actions (merge/push), cleanup of old worktrees, and applying the branch to Multica remain separate actions and were not performed.
