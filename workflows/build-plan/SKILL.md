---
name: build-plan
description: Turn the current decision and specification into an executable implementation plan and task list.
version: 4.1.0
---

# Build Plan

## Responsibility and authority

Turn the current `decision-log.md` and `spec.md` into the current `plan.md`
and `tasks.md`. This stage owns only `plan.md` and `tasks.md`. It does
not change product direction, rewrite the specification, or execute code.
The four materials are the only current work truth. Old reviews, provider
state, execution history, and audit facts may explain quality, but they do not
replace the current decision/spec or freeze same-task planning and repair. A
direction-changing gap is returned to `make-decision`; unaffected planning
continues without guessing.

## 同一会话自动记录

本阶段就在当前 WorkflowHub 会话中执行，不启动第二个 Agent。每个 manifest step 和每个声明的 skill 都必须在实际开始前、结束后调用一次私有记录命令；这是工作流内部动作，用户不需要手工提醒。命令失败就保留真实 incomplete/unavailable，不能补填成功。

阶段入口收到明确的 project/task context 时，会自动把当前已登记会话绑定到这个 task；新任务创建或单独启动任务时由内部 `task-bootstrap` 完成同一绑定。绑定后下面的命令自动使用这个 task，不再手填 task id。一个会话只允许绑定一个 task，换 task 必须开新会话。

```sh
node tools/host/workflowhub-codex-session-event.mjs start --stage=<本阶段> --subject-kind=step --subject-id=<step_slug>
node tools/host/workflowhub-codex-session-event.mjs finish --stage=<本阶段> --subject-kind=step --subject-id=<step_slug> --status=<completed|failed|skipped|not_applicable> --summary="<真实结果>" --evidence=<真实证据引用>
```

skill 使用同一命令，把 subject-kind 改成 skill，并在结束时带上实际 --version、--trigger=true|false 和 --executed=true|false；未触发的 skill 记录 not_applicable 和原因。阶段末执行 node tools/host/workflowhub-codex-session-event.mjs record-spec-analyze --stage=<本阶段> --input=<当前真实结构结果 JSON>，再执行 public run。token 从本次会话的真实 transcript 读取，无法读到就保持未提供；耗时由开始/结束时间计算。没有当前 task 绑定时命令会直接失败，不会把别的 task 的记录写进来。

## Portable dependencies

Read inline packages in `skill-deps.yaml` directly in this WorkflowHub session context.
Packages declared `execution: independent` run in their own independent
context and return only their findings; do not inline them or route them
through a dispatcher. This includes research when needed and
`test-routing-advisor`. `spec-plan`, `simplicity-guard`, `plan-eng-review`,
`testing-system-blueprint`, `spec-tasks`, and `spec-analyze` remain inline.
The review dependency declared in `skill-deps.yaml` is the stage's review adapter;
its broker request must produce findings in an independent reviewer context. It is not
an inline self-review lens and does not share the current session's judgment.
`simplicity-guard` and the plan-review lenses inspect the same plan material and
return advisory findings; they do not create extra calls, state, or permission
checks.

`testing-system-blueprint` designs risks, scenarios, oracle, evidence path, and
coverage limits. `test-routing-advisor` chooses the applicable concrete test
skill. The concrete `backend-testing`, `frontend-testing`, and
`fullstack-slice-testing` skills execute later in `build-code`; build-plan does
not execute tests or claim test results.

An unavailable dependency or reviewer is recorded as an honest quality fact.
It does not block writing or same-task repair and is never rewritten as a clean
result.

Review is a quality fact, not a progression gate or permission to continue
working. Missing or unavailable quality evidence lowers the completion claim;
an unavailable review is never `pass` and does not block continued research,
planning, or repair in this same task.

## Boundaries: no direction replay

Do not run Talk, Clarify, or Grill here. Do not run `talk-with-zhipeng` as a
substitute. Those activities belong to `make-decision`; build-plan consumes
their current conclusions in
`decision-log.md`. Do not invent a product choice from code, history, or a
review suggestion. If confirmation is needed, do not invent the user's actual
reply; return the direction-changing question upstream. Present the completed
plan in plain language and obtain the user's actual reply before claiming that
build-plan itself is accepted. This confirmation does not turn confirmation
into a machine work permit. Missing review facts do not block continued work:
continue research, planning, or repair in this same task.
Do not implement code or execute RED/GREEN; plan the test scenarios, commands,
expected outcomes, and evidence for `build-code` to execute later.

Do not create a double-solution exercise, a build-plan Grill, a second decision
log, a parallel review output, or a process summary. `simplicity-guard` and
`plan-eng-review` are ordinary advisory lenses in the declared review contract,
not new workflow stages and not gates.

## Work sequence

1. Read the current decision, spec, existing plan, and existing tasks. Extract
   requirements, FR/AC, constraints, non-goals, risks, deferred items, and
   open questions.
2. Research only in proportion to implementation risk. Verify code anchors,
   existing consumers, interfaces, data changes, failure paths, ownership,
   testing conventions, and rollback options. Put durable conclusions in
   `plan.md` or the affected task card.
3. Choose the simplest adequate solution: reuse, then narrow extension, then
   new mechanism only with a real reason. Record complexity and F10 reasoning.
4. Write `plan.md` with a quick-read card, technical context, code anchors,
   module/interface/data contracts, exact NEW/MODIFY/DO NOT TOUCH boundary,
   alternatives, dependencies, phases, rollback, test design, risks, deferred
   work, and the single source → FR → AC → task → oracle map.
5. Write `tasks.md` as an ordered acyclic set of executable cards using the
   current `plan-task.v3` card contract fields (`ID`,
   `Phase`, `goal`, `design_state`, `versioned_refs`, `source_refs / decision_refs`, `输入`, `依赖`, `并行`,
   `FR`, `AC`, `动作`, `精确文件`, `boundary`, `输出`, `Knowledge`,
   `verification_role`, `paired_task`, `gate_cmd`, `expected_exit`, `oracle`,
   `evidence_path`, `STOP`, `recovery`, and `task risk`), followed by one
   completion area containing `status`, actual changes, commands/exits,
   evidence refs, covered ACs, review fact, completion time, and the human
   readable `执行事实`. Every card also requires test tier/method, scenarios,
   fixtures, and coverage limits; these remain in that same card as design
   facts, not a second authority. The `source_refs / decision_refs` and
   test-design fields are required companion facts inside the same card, not
   additional runtime structural fields or a second authority. For every phase in
   `plan.md`, put its required
   `Goal`/`Files`/`Tasks`/`Verify`/`Knowledge`/`STOP`/`Done`/`Risks and rollback`
   block before that phase's cards. Include one final aggregate verification
   card; it is not a new public stage.
6. Cross-check all four materials for omissions, contradictions, orphan tasks,
   boundary widening, missing two-way traceability, and invalid commands.
7. Trace every decision, FR, and AC into the plan/tasks before requesting one
   independent findings review of the current plan/tasks. Preserve
   actual provider/model/transport/provenance and findings. Dispose findings as
   `fixed`, `rejected_invalid`, `accepted_risk`, or `needs_human`; repair valid
   findings in this same task.
8. After findings disposition and the last authored plan/tasks revision, actually
   invoke the existing `spec-analyze` lens once as the strict final
   cross-document check before `publish-plan-result` (the user may call this
   `speckit-analyze`). Its current packet must cover the raw requirement
   source, decision-log-derived facts, spec, plan, tasks, flow/state/boundary/
   non-goal coverage, every `DEFER-*`/`OPEN-*` owner/trigger/handoff/close
   condition, and every task oracle. Record the returned lens result in the
   existing quality-fact path; a prose claim that it ran is not execution
   evidence. The result is report-only: retain findings or
   `incomplete`/`unavailable` honestly, do not create a fifth material, and do
   not turn it into a new quality gate or provider pass.

## Plan and phase contract

Every phase has `Goal`, exact `Files`, `Tasks`, `Verify`, `Knowledge`, `STOP`,
`Done`, and `Risks and rollback`. Tasks are IDs and one-line outcomes in the
plan; detailed commands and execution facts stay in `tasks.md`.

For every behavior change, design a RED/GREEN pair using the same executable
`gate_cmd`, oracle identity, and task-relative evidence path. RED expects a
non-zero assertion failure; GREEN expects `0` and keeps named negative behavior.
`gate_cmd` names a test command only; it never decides whether an agent may
start, continue, or publish work.

Each file appears in one phase boundary and each task file list is a subset of
that phase. Parallel phases/tasks require independent inputs, dependencies, and
file ownership. Missing signatures, invalid commands, scope widening, or a new
product decision is a STOP back to the owning material.

## Quality and handoff

Review, test, research, and evidence are quality facts. `unknown`,
`unavailable`, and `incomplete` remain visible and lower the completion claim;
they do not stop same-task repair. A review cannot grant a pass or block the
next safe work item. Do not claim the plan is ready when a source/FR/AC/task
mapping, command, boundary, or serious finding is unexplained.
The final `spec-analyze` is the last report-only consistency fact before
publish; it does not replace the independent `wh-review` advice or authorize
publication by itself.

End in plain language: what will be built, how phases and files are split, how
testing will prove it, key risks/unknowns, review findings and dispositions, and
what `build-code` should do next without guessing. The handoff is notification,
not a machine work permit and not authorization to commit, push, merge, archive,
or clean up. After the user's actual reply, append that reply to the final
aggregate verification card's existing `执行事实` field in `tasks.md`; this is
one append-only human-alignment fact and changes neither `status` nor any other
completion field. Do not add a handoff field or a second record.
This stage does not create a new task to bypass a missing fact or finding.
