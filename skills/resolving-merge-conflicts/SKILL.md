---
name: resolving-merge-conflicts
description: Resolve a planned close merge conflict on the task branch.
version: 1.0.0
---

# Resolving Merge Conflicts

Use this skill only after `task-close execute` reports a planned merge conflict.
It repairs the task branch so the already-authorized close can be retried.

## Procedure

1. Read the close plan and use its frozen target baseline and task branch. Do
   not guess another repository, branch, or commit.
2. In the task worktree, merge the frozen target baseline into the task branch
   with the normal non-squashing Git merge.
3. Resolve the reported files by preserving the intended behavior from both
   sides. Never use `--ours`, `--theirs`, or an equivalent overwrite shortcut.
4. Stage the resolved files and create the merge commit. Leave the task
   worktree clean.
5. Rerun the same `task-close execute` command. `task-close` owns the target
   merge, push, worktree removal, and branch removal.

## Hard boundaries

- Never edit or check out the target/main worktree.
- Never push, delete branches, or run the remaining close operations.
- Never resolve by silently discarding one side.
- If the target baseline changed, stop and ask for a new close plan.
- If conflicts remain, stop; do not create a partial commit.

This is delivery integration, not a new build-code phase. The close retry
reuses the existing authorization and does not rerun build-code or a full test
suite.
