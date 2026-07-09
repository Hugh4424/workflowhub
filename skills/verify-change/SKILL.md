---
name: verify-change
description: Report-only diff closure check. Use --light to verify checkbox completion, stage verdict closure, and current-stage review index state before merge.
---

# verify-change

## Scope

`verify-change` is a report-only review helper. It does not edit files, commit,
merge, delete branches, update worktrees, or approve irreversible actions.

`verify-code` checks whether an implementation satisfies a task spec.
`verify-change --light` checks whether the current change has enough closure
evidence to continue to a merge gate.

## `--light` Inputs

Run from the task worktree. Resolve task execution records through
`core/task-record-paths.mjs`; do not read repo-local `tasks/{task-id}/` unless
that resolver returns it as the task tracking root.

Required inputs:

- `stage-result-{stage}.json`
- `test/final-test-report.md`
- `reports/report-index.md`
- `reviews/reviews.jsonl`
- `workflow-issues.jsonl`
- the relevant spec/task checklist files for the current task

## `--light` Checks

1. Checkbox completion
   - Scan current-task checklist/task files that are part of the reviewed
     change.
   - Literal unfinished checklist markers (`- [ ]`) in active task checklists
     are open work.
   - Explanatory prose that describes the marker format is not a checklist
     item.

2. Verdict closure
   - Read the latest stage-result for the stage under review.
   - `facts.verdict`, `facts.review_status`, and top-level `status` must be
     internally consistent.
   - `failed` or `needs_human=true` means the change is not closed for merge.

3. Review index state
   - Read `reports/report-index.md`.
   - List current-stage rows whose `fix_status` is `open` or `in_progress`.
   - `accepted` and `closed_inband` count as closed for this light check.
   - Current-stage open rows must be reported, but they do not block by
     themselves when the reviewer contract says they are user-known.

4. Evidence presence
   - Confirm final test report, raw fresh-capture evidence, reviews.jsonl, and
     workflow-issues.jsonl exist and are non-empty.
   - Do not treat historical evidence as fresh. If the final report says the
     fresh command failed, report that as not closed.

## Output

Return a concise report with:

- `status`: `pass`, `revise_required`, or `escalate_to_human`
- `checked_files`: paths read
- `open_items`: remaining unfinished items
- `verdict_summary`: whether the stage-result is closed
- `index_summary`: current-stage open rows, if any
- `evidence_summary`: evidence files found/missing

Use `revise_required` when required closure evidence exists but shows unfinished
work. Use `escalate_to_human` only when required inputs are unreadable or the
state is contradictory enough that the reviewer cannot make a report-only
decision.
