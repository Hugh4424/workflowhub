---
name: verify-code
description: Independently verify the current implementation, then present a verification conclusion for user confirmation.
version: 3.0.0
---

# Verify Code

## Purpose

Verify the current implementation independently. This stage does not repair
code, rewrite task materials, or turn historical records into permission to
proceed.

## What allows work to start

Read the current `decision-log.md`, `spec.md`, `plan.md`, and `tasks.md` in the
same task. All four must exist and be readable. If one is missing or unreadable,
name it and stop this verification attempt.

Historical results, reviews, run history, branch history, and runner history
are read-only audit context. They never block a new verification attempt and
never prove the current implementation correct.

## Independent verification

1. Read the four current materials and identify the planned work, acceptance
   criteria, open risks, and the completion rows in `tasks.md`.
2. Inspect the current implementation and diff. Independently compare it with
   the current materials. Do not trust an earlier builder summary.
3. Run the current complete test command for this delivery. Record the actual
   command, result, and output. A failure, missing command, or stale result is
   a failed or unknown fact, never a pass. Focused tests belong to build-code;
   final verify-code runs the complete suite once.
4. Check every applicable acceptance criterion against observed evidence.
   State `pass`, `fail`, or `unknown` for each one; do not infer coverage from
   an aggregate green test run.
5. Run one independent `wh-review` semantic/code review over the frozen current packet:
   four materials, current diff, test results, AC evidence, and open risks.
   Record the returned verdict and findings exactly. If the provider is
   unavailable, record `unavailable`; do not invent a pass or substitute an
   unrequested provider.
6. Produce a short verification summary: current snapshot, tests, per-AC
   result, review result, unresolved risks, and a clear overall conclusion.

Review is a quality fact, not a license to start or continue repairs. An
authenticated actionable major/blocking finding must be repaired, or the user
must explicitly accept that specific risk before the conclusion can claim the
work is accepted. Ordinary findings, invalid output, timeout, and unavailable
review remain visible facts; they do not create a repair gate or a new task.
If either review is unavailable, show its canonical review attempt and exact
terminal reason. It remains a visible incomplete quality fact, never a pass and
never a reason to replay build-code, invent a fallback record, or block normal
repair. Historical provider output may be cited only as audit context.

## Verdict and handoff

- **Pass candidate**: the current implementation matches the four materials,
  the current complete test suite is green, every applicable AC is `pass`, and the independent
  review has no unresolved actionable major/blocking finding.
- **Fail or unknown**: record the exact fail/unknown evidence and return to
  `build-code` in this same task. The builder fixes the current code/materials,
  reruns only affected tests, and then verify-code runs again from the current
  state.

Do not create another task or any historical-evidence progression mechanism.
Historical evidence remains audit-only. A failure never authorizes close
operations.

## Confirmation and close

Present the summary to the user for the normal verify-code confirmation. The
user confirmation accepts only this verification conclusion; it does not
authorize commit, push, merge, archive, worktree cleanup, branch deletion, or
any other irreversible action. Obtain separate explicit authorization before
each requested close operation.

## Keep it simple

Use the smallest direct check that answers a real acceptance question. Do not
add schemas, gates, retry loops, provider rounds, or automation merely to make
the process machine-checkable. Before adding a mechanism, answer:

1. What real threat does this defend against?
2. Does any existing mechanism already cover it?
3. Can it be bypassed?
4. What is the long-term maintenance cost?

If the mechanism is not justified by a real observed problem, do not add it.
