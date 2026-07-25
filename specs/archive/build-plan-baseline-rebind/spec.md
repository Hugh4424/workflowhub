# Build-plan baseline rebind

## Goal
Allow an already accepted build-plan to be rebound after a legitimate upstream code integration without changing accepted design artifacts or restarting the complete workflow.

## Non-goals
- No build-spec recheckpoint.
- No editing or replacing accepted spec.md, plan.md, or tasks.md content.
- No generic migration, release, recovery, or provider framework.
- No Multica-specific code.

## Functional requirements
- FR-01: Add one public build-plan recheckpoint command and one run binding flag.
- FR-02: Recheckpoint is valid only for build-plan and the active task.
- FR-03: Before authorization, current spec.md, plan.md, and tasks.md must match the blobs in active accepted checkpoints byte-for-byte.
- FR-04: Reject unrelated tracked or untracked workspace drift. The new baseline must be derived from the current committed integration HEAD plus the accepted spec blob, not from an arbitrary live workspace snapshot.
- FR-05: The immutable authorization binds current HEAD/tree, derived base tree, active accepted spec ref/hash/checkpoint, and prior accepted plan ref/hash/attempt.
- FR-06: A replacement build-plan attempt and accepted record must carry exactly matching recheckpoint provenance.
- FR-07: Canonical accepted replacement must compare expected prior bytes and revalidate immediately before atomic rename.
- FR-08: A replacement still requires a fresh build-plan human confirmation.
- FR-09: Repeated identical authorization/ref publication is idempotent only when parent, tree, artifacts, and provenance match; conflicts fail without overwriting records.
- FR-10: Existing task recovery, phase-trace, reopen, and verify commands remain unchanged.

## Acceptance criteria
- AC-01: The CLI rebinds a clean accepted build-plan after a committed upstream integration while design artifact bytes are unchanged.
- AC-02: build-spec requests are rejected.
- AC-03: edited spec/plan/tasks and unrelated workspace drift are rejected before publication.
- AC-04: wrong task/stage/hash/ref/tree or mismatched attempt/accepted provenance is rejected.
- AC-05: a concurrent accepted update causes CAS failure and preserves the newer record.
- AC-06: two sequential same-plan rebind attempts do not hit the old Git ref collision or corrupt history.
- AC-07: focused kernel, checkpoint, CLI, task-recovery and phase-trace tests pass.
- AC-08: independent implementation review passes before merge to main.
