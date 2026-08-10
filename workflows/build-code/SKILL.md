---
name: build-code
description: Implement the current plan in the verified task worktree.
version: 2.2.0
---

# Build Code

## Goal

Implement the current task with the smallest correct change, real tests,
per-AC evidence, independent review, and explicit finding disposition.

## Authority and entry

Only these current materials define the work:

- `decision-log.md`
- `spec.md`
- `plan.md`
- `tasks.md`

When all four are present and readable, continue the same task. Read them
directly and take the next incomplete Task from `tasks.md`. Old reviews,
execution records, provider state, audit history, and other auxiliary objects
are facts, not work permits. Missing, stale, failed, or unavailable auxiliary
facts never require a new task and never freeze implementation or same-task
repair.

`make-decision` exclusively owns Talk, Clarify, necessary research, Grill, and
`decision-log.md`. Build-code does not replay them or ask the user to reconstruct
the decision process. If implementation exposes a direction-changing gap, keep
the same task and return that decision to `make-decision`. Corrections that stay
inside the confirmed direction may update `spec.md`, `plan.md`, and `tasks.md`.

## Portable dependencies

Use the dependency packages declared in `skill-deps.yaml` directly: open each
selected dependency's declared `SKILL.md` and follow it in the current agent
context. Do not route dependency use through a dispatcher, invocation protocol,
or auxiliary progress gate.

- Use `test-routing-advisor` once for every behavior Phase against the actual
  changed-file boundary. If the actual boundary matches the planned route,
  record the same route; if it differs, record the reroute and reason. The
  advisor is stateless and never executes tests or grants permission.
- Use exactly one applicable concrete testing skill directly:
  `backend-testing`, `frontend-testing`, or `fullstack-slice-testing`.
- Use the declared independent findings capability once. Follow the portable
  dependency and its declared adapter contract; do not add a second review
  path or require a particular provider CLI in this skill.

If a dependency is unavailable, preserve that fact and use any safe repository
test commands already specified in `tasks.md`. The missing dependency limits the
quality or completion claim; it does not prohibit code or material repair.

## Work loop

1. Read all four materials and select the next incomplete Task. Write a small
   Phase Card in that Task's working area: goal, exact allowed files and symbols,
   covered ACs, non-goals, compatibility boundary, predesigned test route, stop
   conditions, and expected stage-end summary. Completion: the change boundary
   and its ACs are explicit before editing.
2. Apply the Task's predesigned route. When behavior can be tested, write the
   focused behavior test and capture real RED before implementation. Make the
   smallest production change, then inspect the actual changed files. A pure
   documentation or material Task may mark testing not applicable with a plain
   reason. Completion: every changed file belongs to the Phase Card or is
   explained as a same-task scope correction.
3. Compare the actual changed files with the predesigned route. Use
   `test-routing-advisor` directly for this Phase even when the route is
   unchanged; record the old route, selected route, and whether a reroute was
   needed. Then use the selected concrete testing skill directly against the
   actual range. Completion: the selected route contains a focused command,
   oracle, expected evidence, and known coverage limits.
4. Run the focused GREEN oracle. Scan the complete diff against every affected
   FR and AC, including behavior, state/data, error/cancel/recovery, shared
   interfaces, concurrency/atomicity, and real browser behavior when relevant.
   Record actual commands, outcomes, and limits. Completion: every affected AC
   has `pass`, `fail`, `unknown`, `deferred`, or `not_applicable` with a short
   reason and evidence where available.
5. Use the declared independent findings-review capability directly for one
   review of the completed Phase. Preserve the actual findings,
   transport status, and provenance;
   `unavailable` remains an unavailable fact. Do not re-review an unchanged change
   merely to chase an empty findings list. Completion: the review or its real
   unavailability is recorded with provenance; an unavailable attempt keeps the
   stage quality claim incomplete.
6. Inspect every finding and record `fixed`, `rejected_invalid`,
   `accepted_risk`, or `needs_human`. Repair valid findings in this same task and
   rerun affected checks. Reject invalid findings with evidence. Keep serious
   unresolved risk visible and obtain the user's exact acceptance before calling
   the affected work complete. Completion: no finding is unexplained.
7. End the Phase with a plain-language handoff: delivered behavior, actual test
   layer and result, AC limits, review fact, finding disposition, unresolved
   risk, deferred work, and the next Task. In that Task card, update the one
   `status` field in the unique completion area and append only facts actually produced to `执行事实`. A Task is
   `completed` only when those facts cover its actual changes, commands/exits,
   affected AC results, evidence, review outcome, and handoff. Then continue
   with the next `pending` or `in_progress` Task; do not replay earlier Phases
   or reconstruct historical process indexes.

Every completed Phase executes its recorded route, checks the real changed-file
range, uses the applicable concrete testing skill, and records test, AC, review,
finding-disposition, and plain-language stage facts.

After the phase facts are recorded, a phase may be committed only when the
user has separately authorized the irreversible operation via
`authorize --op=commit`. The phase
commit is a Git delivery fact and a useful review anchor; it is never required
to start, continue, test, repair, or hand off the same task. Without that
authorization, review the current working-tree change and leave it uncommitted.
A current Phase review is required as a recorded quality fact. Its findings and transport status are not a progression gate: an unavailable or adverse fact stays visible, limits the completion claim, and still allows same-task repair and the next safe work item.
A provider verdict, where one exists, is also a recorded quality fact and never a Phase pass gate.

`unavailable` is never `pass` and never a work blocker.

## Final aggregate

After all implementation Tasks, use the dedicated final Task/Phase card from
`tasks.md`. Recheck its route against the full actual change, run the recorded
final aggregate strategy once, and record its command, oracle, result, limits,
and per-AC impact. The final full test is a build-code handoff fact; verify-code
independently replays the risky paths and complete user flow.

Build-code does not run the aggregate regression command after each Task.
Focused tests belong to each Phase; the recorded final command belongs to the
final aggregate.

## Completion and fail-loud writes

Rule: publish no completion unless the requested behavior is implemented, relevant
real tests ran, every applicable AC has a result, a current independent review
result is recorded, every finding has a disposition, and the stage-end
plain-language summary exists. Keep adverse, unavailable, failed, and unknown
review facts visible; an unavailable attempt remains quality-incomplete and does
not block same-task repair.

A fact write with a wrong task, workspace, runtime, hash, schema, or declared
write boundary fails loudly for that write. Preserve the error and never invent
success. That failure does not freeze code edits, material correction, tests, or
finding repair in the same task; it only prevents the affected fact or completion
claim until repaired.

## Reporting

After each Phase, report only delivered behavior, actual focused test results,
AC limits, review findings/transport facts, finding disposition, unresolved risk,
and next Task.
At the end, explain in plain language what changed, which evidence is current,
what remains unknown, and what `verify-code` will check. Verify-code reads this
summary and the four materials; it does not repeat Talk, Grill, or require a
process index.

Do not expose internal execution machinery or duplicate completion views to the
user. Commit, push, merge, archive, and cleanup require separate authorization.
