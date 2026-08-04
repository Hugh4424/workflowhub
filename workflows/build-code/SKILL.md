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

Accepted records, receipts, old reviews, prior runs, and old
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
5. Before any handoff, the main agent must inspect every review finding and
   record a plain disposition: `fixed`, `rejected_invalid`, `accepted_risk`,
   or `needs_human`. For a valid finding, repair the current Task and rerun its
   affected checks; for an invalid finding, record the evidence; for a serious
   unresolved finding, obtain the exact risk acceptance while preserving the
   original review verdict. Do not silently skip this analysis or start the
   next Task with findings still unexplained.
6. Update only the Task completion area with the facts actually produced,
   including the finding analysis, disposition, repair evidence, or explicit
   unresolved risk.
7. Start the next Task from current tasks.md only after that disposition summary
   is recorded. Do not replay prior Phases or
   rebuild historical evidence.

An authenticated actionable major or blocking review finding remains a visible
quality fact. It may affect the later formal acceptance conclusion, but it does
not become a quality gate on same-task repair or ordinary progression. The
finding itself does not stop the same task or the next Task once its disposition
summary is recorded. Keep its canonical `wh-review` attempt as the quality fact,
and require the disposition
summary before handoff so the finding cannot disappear between stages. Do not
create a fallback record, bridge, or substitute completion state from old
provider output, tests, or AC evidence.

## Quality and publication

Use focused, risk-scoped tests during normal work. `build-code` does not require
the complete regression command and must not run `npm test` merely to satisfy
its stage predicate. The complete regression command belongs to the final
`verify-code` boundary; run it there only when the current candidate has no
fresh passing full-suite receipt.

Stage progression is owned by the current four materials, with `plan.md` and
`tasks.md` as the implementation progress record. A missing, stale, failed, or
unavailable test, review, audit, or AC fact is recorded as a visible quality
warning and never blocks moving to the next stage or continuing the same task.
The resulting stage publication is explicitly progression-only when quality is
incomplete; it is never an accepted record. Formal acceptance remains a
separate conclusion and may not be inferred from stage progression. Do not
create a successor, rebind, continuation, recovery bridge, synthetic
checkpoint, or replacement task.

Formal build-code completion also requires the same current snapshot, current
test evidence, and final integration review. Stale, missing, or mismatched
evidence means publish no completion; material makes old quality facts stale but
never becomes a work permit check.

## Runtime boundary

Use the seven-behavior runtime facade: doctor, status, run, review, verify,
confirm, and authorize. Use the authenticated Workspace supplied by the stage
context. Cwd, branch name, runner checkout, and host conversation identity are
not task authority.

Current test and AC receipts retain their command, output, and observed-tree
hashes for quality diagnostics. A dirty candidate is normal during
development; it is not rejected merely for differing from HEAD. Runner path,
contract-file, and bundle validation remain strict. A receipt mismatch changes
the quality warning, not the stage-progress status.

Caller-owned temporary inputs stay in an OS temporary directory. Product edits
belong only in the authenticated Workspace. Task records, receipts, and review
evidence are owned by TaskKernel.

## Current-material revision

A material change stays in the same task. Record a current material revision
with content hashes and a short reason. Earlier materials and accepted records
remain readable audit history. The changed material may make old quality facts
stale, but it never becomes a work permit or stage-progress check.

## Reporting

After a Phase, report only: delivered behavior, focused tests, review result,
unresolved risk, and next Task. At the end, report the current implementation,
final regression, integration review, and whether verify-code can start.

Do not expose raw task paths, hashes, receipts, runner internals, or duplicate
completion views to the user.
