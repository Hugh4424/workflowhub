---
name: build-code
description: Implement the current plan in the verified task worktree.
version: 2.2.0
---

# Build Code

## Goal

Implement the current task with the smallest correct change, real tests,
per-AC evidence, independent review, and explicit finding disposition.

## 同一会话自动记录

本阶段就在当前 WorkflowHub 会话中执行，不启动第二个 Agent。每个 manifest step 和每个声明的 skill 都必须在实际开始前、结束后调用一次私有记录命令；这是工作流内部动作，用户不需要手工提醒。命令失败就保留真实 incomplete/unavailable，不能补填成功。

阶段入口收到明确的 project/task context 时，会自动把当前已登记会话绑定到这个 task；新任务创建或单独启动任务时由内部 `task-bootstrap` 完成同一绑定。绑定后下面的命令自动使用这个 task，不再手填 task id。一个会话只允许绑定一个 task，换 task 必须开新会话。

```sh
node tools/host/workflowhub-codex-session-event.mjs start --stage=<本阶段> --subject-kind=step --subject-id=<step_slug>
node tools/host/workflowhub-codex-session-event.mjs finish --stage=<本阶段> --subject-kind=step --subject-id=<step_slug> --status=<completed|failed|skipped|not_applicable> --summary="<真实结果>" --evidence=<真实证据引用>
```

skill 使用同一命令，把 subject-kind 改成 skill，并在结束时带上实际 --version、--trigger=true|false 和 --executed=true|false；未触发的 skill 记录 not_applicable 和原因。阶段末执行 `node tools/host/workflowhub-codex-session-event.mjs record-spec-analyze --stage=<本阶段> --input=<当前真实结构结果 JSON>`，再执行 public run。token 从本次会话的真实 transcript 读取，无法读到就保持未提供；耗时由开始/结束时间计算。没有当前 task 绑定时命令会直接失败，不会把别的 task 的记录写进来。

When the host automatically binds the current WorkflowHub session to an
explicit `WORKFLOWHUB_STAGE_OUTCOME_PATH`, delivery comes before extended
reporting: read the host stage input once, perform the smallest real
verification needed for the current task, write the complete current-session
execution object to that exact path, verify that it parses, and stop. The user
does not start another agent. Do not spend the bounded host run rereading
runtime adapters, replaying old phases, or repeating a full test suite after a
current result exists. Any step not actually performed must be recorded as
`incomplete` with its real reason; leaving the execution file unwritten is
never an acceptable handoff.

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

`make-decision` exclusively owns Talk, Grill, and `decision-log.md`.
`build-spec` exclusively owns conditional specification research and
`spec-clarify`. Build-code does not replay them or ask the user to reconstruct
the decision process. If implementation exposes a direction-changing gap, keep
the same task and return that decision to `make-decision`. Build-code does not
author or rewrite the four current materials: a correction to `spec.md` belongs
to `build-spec`, while a correction to the authored parts of `plan.md` or
`tasks.md` belongs to `build-plan`. The existing task card's
`执行状态填写区` is the one same-task exception: the executor may update its
`status` and append facts actually produced by the executor. This is task-fact
recording, not a second material authoring path. Record the concrete material
gap and continue safe code, task-fact, or quality-fact repair in the same task;
do not silently change the material owner or invent a new task.

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
- Use the review dependency declared in `skill-deps.yaml` once. Follow the portable
  dependency and its declared adapter contract; do not add a second review
  path or require a particular provider CLI in this skill.

If a dependency is unavailable, preserve that fact and use any safe repository
test commands already specified in `tasks.md`. The missing dependency limits the
quality or completion claim; it does not prohibit code or material repair.

## Conditional UI implementation handoff

When the current phase has `ui_applicability=ui`, consume the existing
`frontend-component-quality` Component Quality Map before editing. For every
entry, check the real consumer, state owner, typed ViewModel, CSS/token owner,
and any `story_or_test_update` against the actual diff. Preserve `unknown`, `unavailable`, and `N/A +
reason` when a planned consumer, design source, browser, fixture, viewport, or
screenshot fact is missing; these facts are not a gate and do not authorize a
new stage or public command.

Build-code is the owner that executes `frontend-testing` for the changed UI
behavior. The implementation order remains static composition, state and
interaction, then DTO-to-typed-ViewModel wiring; the test route must observe
the real consumer and recovery behavior rather than a component snapshot.
Non-UI phases keep the existing backend or fullstack route and record the UI
skill as not applicable.
No new stage or no gate is introduced by this conditional handoff.

For an applicable UI phase, the official `build-code` handler is the only
execution seam for controlled browser QA. It may invoke the existing
`isolated-browser-qa` adapter once for the current attempt, with the current
task, material revision, snapshot, AC, Design.md/Experience.md identities, and
service/API/DTO identities. A retry is a new invocation and keeps the previous
failure. Success requires the adapter's real evidence, cancellation state, and
cleanup result to validate against `browser-qa-evidence.v1`; a fixture-only
return, identity mismatch, browser failure, cancellation, or cleanup failure
is retained as `failed`, `unknown`, `blocked`, or `incomplete` as appropriate.
No public Runner, QA command, or persistent QA control object is created.

For a declared browser acceptance scenario, build-code passes the four-field
`acceptance_scenario` to the private controlled-QA adapter. The adapter must
first persist direct `browser-qa-evidence.v1` bytes, then return the matching
canonical `{ref,sha256}` and payload. Missing or mismatched source, sample,
scenario, tier, task, attempt, material, snapshot, or invocation remains
`unavailable`; a normal QA run remains compatible without this optional field.

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
5. Use the review dependency declared in `skill-deps.yaml` directly for one
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

Before `publish-code-result`, execute the declared `stage-end-spec-analyze`
step. It compares the original requirement and all four current materials with
the actual implementation, tests, AC trace, review facts, and real user-result
evidence. It checks actual semantics and evidence, not only IDs, paths, hashes,
or files. Repair valid gaps in build-code when they belong to implementation or
task facts; keep product/spec/plan ownership with its owning stage. Emit the
shared six-part plain-language summary: current stage work, requirement
coverage, upstream alignment, repairs made here, remaining risks, and the next
stage boundary.

After the phase facts are recorded, a phase may be committed only when the
user has separately authorized the irreversible operation via
`authorize --op=commit`. The phase
commit is a Git delivery fact and a useful review anchor; it is never required
to start, continue, test, repair, or hand off the same task. Without that
authorization, review the current working-tree change and leave it uncommitted.
A current Phase review is required as a recorded quality fact. Its findings and transport status are not a progression gate: an unavailable or adverse fact stays visible, limits the completion claim, and still allows same-task repair and the next safe work item. Every stage review is advice-only; it does not need to pass or return empty findings. A provider verdict, where one exists, is also a recorded quality fact; `provider pass` is never required.
Never require a provider pass.

`unavailable` is never `pass` and never a work blocker.

## Final aggregate

After all implementation Tasks, use the dedicated final Task/Phase card from
`tasks.md`. Recheck its route against the full actual change, run the recorded
final aggregate strategy once, and record its command, oracle, result, limits,
and per-AC impact. After the final tests and AC trace, run the existing
`phase_id=null` integration review against the current implementation. Build-code
is strictly complete only when that current review has no important findings:
no actionable `major|blocking` finding with a valid evidence anchor; minor
advice remains advice. If an important finding is real, repair the same task and run one
focused review only after an actual repair/topic change. A repeated finding,
unchanged snapshot, no terminal provider output, or transport failure stops the
automatic loop and remains visible as incomplete/unavailable. This is a review
fact, not a provider pass gate. Verify-code independently replays the risky
paths and complete user flow.

The final full test is a build-code handoff fact; it is not a provider pass or
a new quality gate.

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
