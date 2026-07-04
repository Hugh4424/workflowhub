# 审查报告 — spec-20260704T065657Z-d9ea71 (round 3)

- verdict: revise_required
- provenance: single-context

## Summary

revise_required: core contract is close, but active-state recovery, make-decision artifact handoff, close ordering, and cross-stage commit ownership still need tightening before implementation.

## Findings

- [high] 位置: spec.md:104 | 问题: The partial-close recovery rule allows status=active with a missing worktree to skip active-only validation based only on the physical state. That weakens the fail-loud contract: a corrupt or accidentally removed active worktree can be treated as a resumable close instead of a hard failure. | 建议: Limit this exception to verify-code close re-entry only, and require a persisted close-progress marker proving the prior irreversible steps completed. If the marker is missing or inconsistent, status=active with a missing worktree must fail-loud.
- [high] 位置: spec.md:130 | 问题: make-decision creates the worktree at the end of the stage, but the spec does not require repo-scoped make-decision artifacts such as specs/{task-id}/ or decision-log outputs to be written into, moved into, and committed from worktree_root before build-code starts. This leaves the original ZHI-65 failure mode open: downstream stages may get a valid worktree.json while the actual preceding artifacts remain outside the task worktree or uncommitted. | 建议: Define that make-decision must create or reuse the task worktree before writing any repo-scoped artifacts, or explicitly migrate all generated repo artifacts into worktree_root before handoff. Add a required make-decision commit such as workflowhub(make-decision): initialize {task-id} before build-code reads the contract.
- [medium] 位置: spec.md:220 | 问题: FR-WORKTREE-CLOSE-006 restates the close operations with a different implied order from FR-WORKTREE-PUSH-005. The canonical sequence says push main, then delete remote branch, then delete local branch, but the close section summarizes it as merge, delete local branch, push main, delete remote branch. That creates an implementation ambiguity in the most sensitive irreversible path. | 建议: Make FR-WORKTREE-CLOSE-006 reference the canonical FR-WORKTREE-PUSH-005 8-step sequence without restating it, or restate the exact same order verbatim.
- [medium] 位置: spec.md:171 | 问题: The commit requirement says every stage or phase commit must use workflowhub(<stage>): prefixes, but the implementation scope is described as build-code while the required prefixes include make-decision, verify-code, and close. The spec does not say which SKILL owns enforcement for non-build-code stages or how acceptance tests should verify those commits. | 建议: Assign enforcement points explicitly: make-decision/SKILL.md owns make-decision commits, build-code/SKILL.md owns build-code phase commits, and verify-code/SKILL.md owns verify-code and close commits. Add acceptance checks that inspect git log for each required prefix after the full flow.

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 见上方 Findings

