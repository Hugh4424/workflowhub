---
name: build-code
description: Implement the current plan in the verified task worktree.
version: 2.1.0
---

# Build Code

## Goal

Deliver the current plan with real tests and an independent review. Keep the
workflow smaller than the work it governs.

## Authority

Only these current materials define work and completion:

- decision-log.md
- spec.md
- plan.md
- tasks.md

Tasks.md is the only Task completion authority. The executor records real
changes, commands, evidence, covered ACs, review fact, and completion time in
that Task's completion area. The runtime reads and certifies this area; it
never checks a box or creates another completion state.

Accepted records, checkpoints, receipts, old reviews, prior runs, and old
verification failures are read-only audit facts. They never authorize or block
ordinary implementation, material revision, repair, or the next Task.

## Work loop

1. Authenticate the task and Workspace through the stable runtime facade.
   Read only the current four materials.
2. Take the next incomplete Task from the current tasks.md. Its declared
   files, ACs, and non-goals are the scope.
3. Make the smallest change that meets the Task. Run its focused test command
   and any directly affected regression.
4. Obtain one independent `wh-review` for the completed Phase. Preserve its actual
   result: unavailable is never pass.
5. Update only the Task completion area with the facts actually produced.
6. Start the next Task from current tasks.md. Do not replay prior Phases or
   rebuild historical evidence.

An authenticated actionable major or blocking review finding is repaired before
continuing unless the user explicitly accepts that risk. A missing, failed, or
unavailable review never becomes pass and never blocks repair or the next Task.
Keep its canonical `wh-review` attempt as the quality fact. Do not create a
fallback record, bridge, or substitute completion state from old provider
output, tests, or AC evidence.

## Quality and publication

Use focused tests during normal work. Run the complete regression command only
when the current plan requires it or once before final build publication.

Formal build completion requires, on the same current snapshot:

- every planned Task completed in current tasks.md;
- current implementation evidence;
- passing current test evidence;
- every AC mapped to current Task evidence; and
- one independent semantic integration review attempt.

If review is unavailable, publish the delivered work with that visible open
quality fact and continue to verify-code. It cannot be presented as an
unconditional pass. Missing or mismatched delivery, test, or AC facts remain
incomplete. If any fact is stale, missing, or mismatched, publish no completion.
Do not create a successor, rebind, continuation, recovery bridge,
synthetic checkpoint, or replacement task.

## Runtime boundary

Use the seven-behavior runtime facade: doctor, status, run, review, verify,
confirm, and authorize. Use the authenticated Workspace supplied by the stage
context. Cwd, branch name, runner checkout, and host conversation identity are
not task authority.

Current test and AC receipts bind the current tracked-and-untracked content
tree plus the command and output hashes. A dirty candidate is normal during
development; it is not rejected merely for differing from HEAD. Runner path,
contract-file, and bundle validation remain strict.

Caller-owned temporary inputs stay in an OS temporary directory. Product edits
belong only in the authenticated Workspace. Task records, receipts, and review
evidence are owned by TaskKernel.

## Current-material revision

A material change stays in the same task. Record a current material revision
with content hashes and a short reason. Earlier materials and accepted records
remain readable audit history. The changed material makes old quality facts
stale for formal publication only; it never becomes a work permit check.

## Reporting

After a Phase, report only: delivered behavior, focused tests, review result,
unresolved risk, and next Task. At the end, report the current implementation,
final regression, integration review, and whether verify-code can start.

Do not expose raw task paths, hashes, receipts, runner internals, or duplicate
completion views to the user.
