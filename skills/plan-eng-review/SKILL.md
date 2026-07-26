---
name: plan-eng-review
description: Report-only engineering-plan lens for sequencing, boundaries, failure modes, and verification.
kind: sub-skill
---

# plan-eng-review

Source: adapted from the project engineering review baseline. Mode: `lens-only`.
It has no runner and no verdict; it also has no provider route. `wh-review`
loads this lens and remains the only review authority.

## Required material

Review the complete accepted specification, complete draft plan, complete draft
tasks, and the deterministic `plan-task-contract.v1` facts for the same frozen
snapshot. Missing or mismatched material is a material-contract failure; do not
infer structure from a summary or accept a provider pass as a replacement.

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
