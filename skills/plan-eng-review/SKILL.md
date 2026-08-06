---
name: plan-eng-review
description: Report-only engineering-plan lens for sequencing, boundaries, failure modes, and verification.
kind: sub-skill
---

# plan-eng-review

Source: adapted from the project engineering review baseline. Mode:
`advisory`, file-only, no stage result and no provider verdict. build-plan calls
it directly after the plan draft and before test routing; wh-review only reads
the resulting fact and remains the sole independent provider review authority.
It remains a lens-only observation source, not a runner or progression gate.

## Required material

Review the accepted specification, the complete draft plan, and any available
early task outline for the same frozen snapshot. At this point `tasks.md` may
not exist yet because this skill intentionally runs before `test-routing-advisor`
and `spec-tasks`; missing tasks are therefore an expected stage-order fact, not
a reason to invent task details. Do not accept a provider pass as a replacement
for missing plan evidence.

## Check

1. Map requirements to discrete tasks and objective verification.
2. Validate module ownership and boundary direction against Code Anchors and the
   declared reuse → extend → new decision.
3. Check every changed interface, function signature, CLI, event, and schema
   against an exact current anchor and an explicit consumer.
4. Trace state transitions and data flow, including invalid transitions,
   concurrency assumptions, and fail-loud behavior.
5. Check task dependency order, file ownership, and whether every parallel
   `[P]` claim has independent inputs and non-overlapping files.
6. Check every behavior change has an implementation-before RED and a
   post-implementation GREEN with an exact executable command, expected exit,
   evidence path, and observable oracle. Reject placeholder or default full
   suite commands.
7. Identify failure modes, rollback/recovery boundaries, irreversible actions,
   and whether rollback preserves accepted artifacts.
8. Check implementation effect: the planned consumer must actually use the new
   contract; schema parsing or file presence alone is not proof.

## Result

Return anchored findings, affected FR/AC/task IDs, engineering consequence, and
the smallest corrective action to `wh-review`. Never emit a separate pass,
revise decision, provider call, or stage result.
