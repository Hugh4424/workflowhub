# Plan

## Phase 1 — Build-plan baseline rebind

1. Add RED tests for the legal recovery path and every rejection boundary, including acceptance without a fresh confirmation.
2. Add a build-plan-only immutable recheckpoint authorization to TaskKernel.
3. Derive the new checkpoint base from committed HEAD plus the accepted spec blob; never use an arbitrary live tree.
4. Bind active accepted spec and prior accepted plan identities, exact artifact hashes, integration HEAD/tree, and derived base tree in provenance.
5. Reuse TaskHandle atomic replacement with expected prior bytes and pre/post validators.
6. Thread authenticated recheckpoint provenance through stage-runner into the existing build-plan checkpoint call, and add the build-plan-only CLI command/flag without removing recovery or phase-trace commands.
7. For a rebind, include the integration baseline identity in the checkpoint ref. An exact retry is idempotent only when ref, parent, tree, artifact bytes, and provenance all match; a different integration gets a different ref; any conflicting existing ref fails without overwrite.
8. Keep the replacement on the existing build-plan confirm then accept path. A provenance-valid replacement cannot become accepted without a new human confirmation bound to its new attempt.
9. Run focused kernel/checkpoint/CLI/recovery tests, inspect the scoped diff, then run independent implementation review.

## Files
- core/task-kernel-implementation.mjs — authorization, provenance, trusted base derivation and replacement flow.
- core/task-handle.mjs — record namespace and CAS accepted replacement.
- core/stage-runner.mjs — pass authenticated provenance to the existing checkpoint call.
- core/git-checkpoint.mjs — integration-identity checkpoint ref and exact retry validation.
- scripts/stage-runtime.mjs — build-plan-only public command and run flag while preserving current commands.
- core/__tests__/task-kernel-publish.test.mjs and focused CLI/checkpoint tests — behavior and rejection evidence.
- workflows/build-plan/SKILL.md — narrow operational contract.

## Delivery
One reviewed commit is merged into current main and pushed. The task worktree and temporary implementation branch are removed. The old preservation commit is deleted only after the merged implementation contains all necessary behavior and evidence.
