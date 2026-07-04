# 审查报告 — spec-20260704T065657Z-d9ea71 (round 1)

- verdict: revise_required
- provenance: single-context

## Summary

Spec is close but still has blocking close-flow contradictions and an unsafe partial-close recovery loophole. Revise the close commit boundary, make FR-CLOSE-006 match FR-PUSH-005 exactly, and gate reentry bypass on durable progress markers.

## Findings

- [high] 位置: spec.md:153 | 问题: FR-WORKTREE-COMMIT-004 says the close archive step is `git mv ... + worktree remove` as one independent final commit. `git worktree remove` is not a repository content change and cannot be part of a git commit. This also conflicts with FR-WORKTREE-PUSH-005, where `worktree remove` is step 4 after the archive commit and merge preparation. | 建议: Define the close commit as only `git mv specs/{task-id}/ specs/archive/{task-id}/` plus `git commit -m "workflowhub(close): archive {task-id}"`. Keep `git worktree remove` only in the cleanup command sequence, outside any commit boundary.
- [high] 位置: spec.md:184 | 问题: FR-WORKTREE-CLOSE-006 restates the irreversible close actions in an order that conflicts with the unique linear sequence in FR-WORKTREE-PUSH-005. It lists worktree cleanup before the branch/push sequence, while FR-WORKTREE-PUSH-005 requires archive commit, switch to main checkout, merge, then worktree remove, then push/delete operations. | 建议: Do not duplicate the close command ordering in FR-WORKTREE-CLOSE-006. Replace the separate bullets with a single normative reference to FR-WORKTREE-PUSH-005, or restate the exact same 8-step order verbatim.
- [medium] 位置: spec.md:103 | 问题: The partial-close recovery rule allows skipping active-only validation whenever `worktree_root` is missing but `status` is still `active`. Without requiring trusted `close-progress.json` markers, this can treat a corrupted or manually deleted worktree as a resumable close and bypass the normal fail-loud path. | 建议: Allow the active-only bypass only when close-progress records prove the prior irreversible cleanup step completed. If no valid progress marker exists, fail-loud with a corrupted close state error.

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 见上方 Findings

