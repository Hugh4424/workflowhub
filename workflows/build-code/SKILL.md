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
Every completed Task's `evidence_refs` must be a TaskKernel-authenticated JSON
array of supported canonical records with matching hashes. Console labels and
free-text notes belong in `evidence_note`, never in `evidence_refs`; missing or
unauthenticated references keep the Task `incomplete`.

Accepted records, receipts, old reviews, prior runs, and old
verification failures are read-only audit facts. They never authorize or block
ordinary implementation, material revision, repair, or the next Task.

## Work loop

1. Authenticate the task and Workspace through the stable runtime facade.
   Read only the current four materials.
2. Take the next incomplete Task from the current tasks.md and first write a
   small Phase Card in the Task's working notes: goal, exact allowed files and
   symbols, covered ACs, non-goals, compatibility boundary, test tier, STOP
   conditions, and expected handoff. Plan prose alone is not an implementation
   specification.
3. Apply the Task in this order: read the task card's predesigned
   `test_strategy`, write the behavior test when applicable, capture real RED
   before implementation, make the smallest change, then execute the exact
   commands, scenarios and oracles already recorded in `tasks.md`. Record the
   actual result, evidence, snapshot and coverage limits. A pure
   documentation/material Task records why RED or the recorded test strategy
   is not applicable. The ordinary execution model must not re-route or
   redesign the task's tests.
4. Run the same test oracle for GREEN, then scan the complete diff against the
   Phase Card and every current FR/AC consumer. Check behavior, state/data,
   error/cancel/recovery, shared interfaces, concurrency/atomicity and UI
   browser evidence when relevant. A needed scope change is a same-task
   scope-revision, not a silent allowlist expansion.
5. Obtain one independent `wh-review` for the completed Phase. Preserve its actual
   result: unavailable is never pass. A changed snapshot needs a fresh review
   identity; an unchanged snapshot is never re-reviewed merely to chase pass.
6. Before any handoff, the main agent must inspect every review finding and
   record a plain disposition: `fixed`, `rejected_invalid`, `accepted_risk`,
   or `needs_human`. For a valid finding, repair the current Task and rerun its
   affected checks; for an invalid finding, record the evidence; for a serious
   unresolved finding, obtain the exact risk acceptance while preserving the
   original review verdict. Do not silently skip this analysis or start the
   next Task with findings still unexplained.
7. End the Phase with a plain-language handoff: delivered behavior, selected
   test layer, actual test limits, review fact, unresolved risk, deferred work,
   and next Task. Update only the Task completion area with the facts actually produced,
   including the finding analysis, disposition, repair evidence, or explicit
   unresolved risk.
8. Start the next Task from current tasks.md only after that disposition summary
   is recorded. Do not replay prior Phases or
   rebuild historical evidence.

The Phase Card, RED/GREEN evidence, predesigned test strategy and its execution
report, diff scan, finding disposition, and handoff are quality facts. They do not create a
new runtime state machine. Review `pass`, a clean worktree, a commit, or a
full-suite run is not a build-code progression gate; missing facts remain
visible and cannot be presented as completion.

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

Normal build-code testing is designed in `build-plan`: `simple` for
non-behavior changes, `feature` for one feature domain, and `fullstack` for
cross-boundary/API/data/auth/concurrency changes or uncertain scope.
`tasks.md` contains the per-Task/Phase scenarios, commands, oracle, applicable
test method, evidence path and coverage limits. Every completed Phase executes
that recorded strategy and reports what really happened. The final aggregate
strategy is a dedicated final Task/Phase card authored in `tasks.md`; build-code
executes it directly and does not run a second route/blueprint/executor design
loop. Full regression belongs to verify-code or an explicit plan item and is
not repeated after every Task. UI changes additionally use the repository's
isolated browser QA route when the recorded strategy requires it.

Use a recorded focused test command and risk-scoped tests during normal work.
`build-code` does not require
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

### Lightweight scope revision from build-code

If the user changes an original requirement, user-visible flow/result, FR/AC,
data/state boundary, success/failure boundary, non-goal, or delivery risk while
we are implementing, stop implementation and let the main agent Talk/Clarify/
Grill with the user directly. Do not delegate that conversation to a child
agent. Keep the same task and do not create a successor, reopen, new ledger, or
new public stage.

The main agent then updates all four current materials in one bounded revision:

1. `decision-log.md`: original temporary request, core-goal relation, choice,
   affected IDs, reason, risks, non-goals/deferred handoff;
2. `spec.md`: affected flow, data/state, success/failure, FR/AC and scope;
3. `plan.md`: implementation, dependency, test, review and delivery impact;
4. `tasks.md`: one same-task bounded change with files, checks, IDs and result.

Before returning to implementation, run exactly one wh-review
`scope_revision` packet. Its dedicated contract judges whether the temporary
request is reasonable, aligned with the task, and complete across all four
materials and impacts. It is not a code-pass review and its verdict is not a
gate. Preserve `pass`, `revise_required`, `unavailable`, timeout and protocol
facts; analyze findings once, record disposition, and continue the same task.
If code changed, resume the affected build-code phase review; do not repeat
unaffected phases or the full suite.

## Reporting

After a Phase, report only: delivered behavior, the recorded test strategy and
actual focused results, review result, unresolved risk, and next Task. At the
end, report the current implementation, final aggregate strategy execution,
integration review, and whether verify-code can start.

Before handing off to verify-code, the main agent must give the user a plain-
language summary of what build-code changed, what evidence is current, what is
still unknown, and what verify-code will check. The user must have seen that
summary before the handoff; a child-agent summary or a machine receipt is not a
substitute.

Do not expose raw task paths, hashes, receipts, runner internals, or duplicate
completion views to the user.
