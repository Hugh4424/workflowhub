---
name: build-plan
description: Turn the current decision and specification into an executable implementation plan and task list.
version: 4.1.0
---

# Build Plan

## 统一回退协议

五个正式 stage 共用 `runtime/stage/stage-content-contracts.mjs` 的
`validateFallbackProtocol`。实现级问题留在当前 stage 修复；规格歧义走
`spec-clarify` 并回到 `build-spec`；方向级问题回 `make-decision` 做增量
决策；材料缺口回对应 owner；环境不可用只记录 attempt。错配只让正式完成事实保持 `incomplete`，保留同 task 修复，禁止整阶段重跑；不新增 stage、public command、store 或 gate。

## Responsibility and authority

Turn the current `decision-log.md` and `spec.md` into the current `plan.md`
and `tasks.md`. This stage owns only `plan.md` and `tasks.md`. It does
not change product direction, rewrite the specification, or execute code.
The four materials are the only current work truth. Old reviews, provider
state, execution history, and audit facts may explain quality, but they do not
replace the current decision/spec or freeze same-task planning and repair. A
direction-changing gap is returned to `make-decision`; unaffected planning
continues without guessing.
四份当前材料统一落在认证 worktree 的 specs/<task-id>/ 下；外置任务追踪目录只保存
`task.json`、`facts.jsonl`、`quality/`、`index.json` 等执行文件，不替代材料，也不新增 gate。
`m15-retirement` 材料迁移与仓外 `Knowledge/Projects/workflowhub/tasks/Projects/`
清理不属于本技能范围。

## 阶段末遗漏披露

阶段结束的大白话总结必须逐项列出本阶段所有未完成、失败、跳过、不适用、`unknown`、`unavailable` 或 `incomplete` 的 step 和 skill，并写真实原因与证据引用；没有遗漏就明确写“无遗漏”。执行事实通过正式 `run` 输入提交，不依赖宿主会话绑定、隐式选 task 或等待时限。

阶段末逐项披露协议：主会话先读取本 stage 的 `workflows/<stage>/steps.json`
manifest，再按声明顺序对齐 `stage_outcome.step_outcomes`、
`stage_outcome.skill_outcomes`。没有 outcome 也必须逐条列出全部声明项，并明确写
“无 outcome”及真实原因。每一项分别读回并报告执行状态、产物存在性和完成判据是否齐备；
产物存在不能替代完成判据。至少区分“未启动”“跳过”“产物缺失”“完成判据缺失”、
`unknown` 与 `unavailable`。`executor_absent` 只能记为不可用，不能记为正常跳过；
不得用一条阶段结论均摊到所有 step/skill。

## 阶段末复盘（必须执行）

阶段结束时，当前主会话先按 `stage-reflection` 技能产出 `stage-reflection.v2` judgment JSON，再调用实际的公共入口 `run --action=reflect`。`judgments[].evidence_refs` 必须显式引用唯一的当前 `quality/evidence/stage-outcomes/build-plan/<sha256>.json`；`identity` 的 task、真实 worktree/branch、attempt、material_revision 与 snapshot_tree 必须匹配该认证原件。executor/run 从真实 outcome 派生。JSON 要用六个结构化区块回答什么帮了忙、什么要改进、什么阻塞、为什么需要人工介入、什么应简化、什么现在就能简化：`what_helped`、`what_to_improve`、`blockers`、`intervention_reasons`、`what_to_simplify`、`simplifiable_now`。每块条目必须带真实 `evidence_refs` 与 `confidence`；已检查无发现为 `none_observed`，输入不足为 `unknown` 并写 `unknown_reason`，不适用为 `not_applicable` 并写理由，不能静默省略。

返回后把实际 `quality/stage-reflection/build-plan/<semantic-key>.json` 的 ref 与原件 bytes 的 sha256 交给既有 lesson/report consumer。semantic key 不等于原件 hash：同判断 A 复用首件 bytes/ref/time，判断或真实执行身份变化 B 写新件并保留 A；旧 fixed ref 只读。缺 executor/judgment 保持 `unavailable`。复盘失败保留原 stage error 和实际 `reflection_error`；既有 stage 事实继续有效。

`validate-stage-reflection.mjs` 在验证内部调用 `deriveConsumptionEdges`，技能不另行派生消费边。实际边只由较早 subject 的 `output_refs` 与较晚 subject 的 `input_refs` 同引用形成；stage outcome 或 output 不全时 `coverage_status=partial`、消费为 unknown，不能当零消费。只有完整扫描、近 30 天登记 output 的 `zero_consumption_proof`，以及人工 rejected 或同一步骤至少两次介入，`remove_candidate` 才保留，否则变为 `needs_evidence`。如果 route 尚未实现，记录真实 unavailable/dependency，不发明私有命令。

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

### Stage-input packet and context facts

Before `spec-plan` and `spec-tasks` execute, the host assembles one frozen
`stage-input-packet.v1` bound to the current `task_id`, stage,
`material_revision`, `snapshot_tree`, source digests, derived-file authority,
and exact `packet_freeze_hash`. The inline skills and dispatched contexts read
only this packet; the main session retains the packet reference, hash, binding,
and a summary no longer than 500 characters. `plan.md` and `tasks.md` emit a
regenerable `## 材料导航` section; it is not a fifth authority. Packet,
dispatch, or summary failure stays unavailable/degraded with owner and next
action. Provider usage is recorded when present or marked unavailable, and the
three character proxies (`full_reread_count`, `subagent_input_bytes`,
`review_material_bytes`) are observations only; do not claim token savings or a
decrease without evidence.

## Boundaries: no direction replay

Do not run Talk, Clarify, or Grill here. Do not run `talk-with-zhipeng` as a
substitute. Those activities belong to `make-decision`; build-plan consumes
their current conclusions in
`decision-log.md`. Do not invent a product choice from code, history, or a
review suggestion. Build-plan's business confirmation is required at handoff:
do not invent the user's actual reply. Present the completed plan in plain
language and obtain the user's actual reply before claiming that build-plan
itself is accepted; the current session must then publish that reply as the
existing `human-confirmation.v3` record under
`quality/confirmations/<sha256>.json`, then pass its ref to the official handler
for validation before claiming that build-plan itself is accepted. This
confirmation does not turn confirmation into a machine work permit. Missing
review facts do not block continued work: continue research, planning, or
repair in this same task.
Do not implement code or execute RED/GREEN; plan the test scenarios, commands,
expected outcomes, and evidence for `build-code` to execute later.

## Conditional UI component-quality plan

For an applicable UI phase, the `frontend-component-quality` dependency is the
single owner of the **Component Quality Map**. Each entry names the action
(`reuse`, `modify`, `extend-state-or-variant`, `add-local`, `extract-shared`,
or `remove-after-no-consumers`), every real consumer, compatibility impact,
state owner, typed ViewModel, and the single CSS/token owner. `extract-shared`
requires at least two real consumers; a removal requires `no_consumer_evidence`
or `evidence_refs` proving that no current consumer remains. A `modify` or
`extend-state-or-variant`, `add-local`, or `extract-shared` entry also names the
non-empty `story_or_test_update` fact to update. A structured
`unknown`/`unavailable` consumer with a reason remains a handoff risk; it is not
silently treated as zero consumers or a deletion proof.

The map is conditional: non-UI phases keep the existing plan and record
`N/A + reason`. Missing consumers, owners, preview, browser, or screenshot
facts stay `unknown`/`unavailable` and become handoff risks. Build-plan designs
the facts and does not execute frontend-testing (the `frontend-testing` skill);
build-code owns execution
and verify-code checks the real consumer. The map records component facts,
unknowns, and rework risks within the existing stage.

The plan consumes the project-level Design.md and Experience.md identities and
any explicitly supplied `consumer-census.v1` bound to its source snapshot.
`buildConsumerCensus` validates supplied scanner facts; it does not scan the
repository or guarantee an upstream census. Missing scanner facts remain
`unknown`/`missing`, with their actual owner and evidence gap recorded; absence
is not zero consumers. Plan entries must say which source
owns each rule: Design.md for visual/component standards, Experience.md for
page/interaction/test behavior. A plan may schedule an update to either source
only when the confirmed change crosses that source's responsibility; reusing a
bound rule is not a documentation task. Consumer coverage, CSS/token owner,
state owner, and unknown reasons are planned as facts, not inferred from a
component name. Build-plan designs these checks only; it does not run browser
QA, create a Runner, or add another project standard file.

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
   current `plan-task.v4` card contract fields (`ID`,
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
   independent findings review of the current plan/tasks through the declared
   `wh-review` adapter. Submit the real request through the existing `review`
   entry, retain its canonical `attempt_ref` and actual `result_ref`, and pass
   that explicit ref as `receipts.review` to the official build-plan handler.
   It authenticates the attempt/result and provider outputs before producing
   `facts.review`; a skill name or hand-written `executed=true` is not proof.
   Preserve actual provider/model/transport/provenance and findings, including
   partial results and unavailable attempts. Usage/timing come from the
   authenticated attempt's `provider_attempts[].execution`, independently
   unavailable when missing; a reused request adds no new provider execution. Dispose findings as
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
continue research, planning, or repair in this same task. A review cannot grant a pass or block the
next safe work item. Do not claim the plan is ready when a source/FR/AC/task
mapping, command, boundary, or serious finding is unexplained.
The final `spec-analyze` is the last report-only consistency fact before
publish; it does not replace the independent `wh-review` advice or authorize
publication by itself.

End in plain language: what will be built, how phases and files are split, how
testing will prove it, key risks/unknowns, review findings and dispositions, and
what `build-code` should do next without guessing. The handoff is notification,
not a machine work permit and not authorization to commit, push, merge, archive,
or clean up. After the user's actual reply, the current session must publish
the existing `human-confirmation.v3` record through `confirm --action=decision` at
`quality/confirmations/<sha256>.json`; the official build-plan handler consumes
that ref and includes `facts.human_confirmation` plus its evidence in the
existing completion. It may also append that reply to the final aggregate
verification card's existing `执行事实` field in `tasks.md` as a labeled,
append-only human-alignment fact; this does not change `status` or completion
and cannot substitute for the confirmation record. Do not add a handoff field
or a second record.
This stage does not create a new task to bypass a missing fact or finding.
