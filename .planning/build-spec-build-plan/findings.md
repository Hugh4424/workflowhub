# Findings & Decisions

## Current facts

- worktree: `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-mechanism-waste-reduction-20260915`
- branch: `task/workflowhub/workflowhub-mechanism-waste-reduction-20260915`
- current material: only `decision-log.md`; `spec.md`/`plan.md`/`tasks.md` do not yet exist.
- build-spec status: ready; missing quality predicates `zero_major_ambiguities`, `clarify`; research currently unavailable because no build-spec research record exists.
- build-plan status: blocked by missing `spec.md`; expected and not bypassed.
- build-spec has 15 ordered steps; build-plan has 13 ordered steps; reflection is required to execute but non-blocking.
- task is non-UI, so build-spec steps 7–9 and build-plan component-quality path require explicit N/A + reason rather than silent omission.
- public runtime is `node tools/cli/stage-runtime.mjs` with seven behaviors and documented actions.

## Constraints

- Four current materials only: decision-log/spec/plan/tasks.
- Review and analyzer facts are advisory/report-only but must be truthful; unavailable is not pass.
- build-plan requires a real user reply after final material/analyzer before formal acceptance.
- No implementation or RED/GREEN execution in build-plan; only executable design.
- No commit/merge/push without explicit authorization.

## Build-spec ambiguity audit

- Material ambiguity confirmed: D-009 delegates the late-result append-window duration to build-spec but freezes no duration. This changes observable behavior and must go through spec-clarify rather than agent invention.
- Decision-log has a stale internal contradiction: `## 最终确认` says pending/unconfirmed while the current task store contains a canonical accepted confirmation and the prior stage status was completed. Ask the user to reaffirm the exact current direction while clarifying the window, then bind the real reply; do not call the spec accepted beforehand.
- Cross-repo wording is reconcilable without reopening direction: D-006/T-009 is authoritative—external implementation belongs to the overall effort, while its formal closure, commit/push authorization, and acceptance remain outside this WorkflowHub task. D-007's handoff wording applies to those external closure/acceptance facts, not to removal of D-007..D-010 from the selected direction.
- AC naming is a repository-contract inconsistency, not a product choice. Use canonical domain-qualified AC IDs accepted by the Markdown validators; preserve the conflict as an implementation/governance finding rather than asking the user to choose schema syntax.

## Untrusted/external content

None. All facts in this file come from local repository material and runtime output.
