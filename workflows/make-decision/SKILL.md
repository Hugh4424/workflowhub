---
name: make-decision
description: Clarify a real product direction through Talk, proportionate research, independent review, and user confirmation.
version: 3.2.0
---

# Make Decision

## Purpose

Turn the original requirement into one readable, user-confirmed direction in
`decision-log.md`. This stage exclusively owns user-facing Talk, necessary
research, Grill, and the decision log. `build-spec` is the only owner of
Clarify; make-decision must not run a second Clarify. Downstream stages consume
the result; they do not replay these activities or infer missing decisions.

## UI applicability (conditional fact, not a new stage)

When a task may touch a page or frontend, make-decision records one
recomputable applicability fact from the same three inputs:

- `raw_requirement` — the user's original page, interaction, or non-UI
  request;
- `project_inventory` — the current routes, frontend technology, and existing
  component/consumer facts;
- `planned_or_changed_frontend_fact` — the accepted plan or the actual
  frontend change that may make the scope UI-relevant.

The three sources are merged by evidence, not by a caller label. A credible UI
signal produces `ui`; credible exclusion from all three sources produces
`non_ui`; missing, conflicting, or upstream-unfrozen evidence produces
`unknown` with `source_reasons`, risk, and a handoff to make-decision. A caller
request to downgrade `ui` to `non_ui` is retained as a request but cannot lower
the trusted conclusion. When the plan or frontend fact changes, re-evaluate the
three inputs and recompute the result; do not reuse the previous conclusion.

This is a conditional fact consumed by the existing five stages. It adds no
new stage, public command, fifth material, independent state machine, or gate.
No new stage or no gate is introduced by this applicability check.

## 同一会话自动记录

本阶段就在当前 WorkflowHub 会话中执行，不启动第二个 Agent。每个 manifest step 和每个声明的 skill 都必须在实际开始前、结束后调用一次私有记录命令；这是工作流内部动作，用户不需要手工提醒。命令失败就保留真实 incomplete/unavailable，不能补填成功。

阶段入口收到明确的 project/task context 时，会自动把当前已登记会话绑定到这个 task；新任务创建或单独启动任务时由内部 `task-bootstrap` 完成同一绑定。绑定后下面的命令自动使用这个 task，不再手填 task id。一个会话只允许绑定一个 task，换 task 必须开新会话。

新项目或新任务首次准备仓库时，可把 [`docs/templates/project-gitignore.md`](../../docs/templates/project-gitignore.md) 作为 `.gitignore` 起点，排除仅用于执行的侧车目录。它只适用于新建场景；不得借此改写存量项目的 `.gitignore`，也不得把设计材料或源代码目录当作侧车排除。

```sh
node tools/host/workflowhub-codex-session-event.mjs start --stage=<本阶段> --subject-kind=step --subject-id=<step_slug>
node tools/host/workflowhub-codex-session-event.mjs finish --stage=<本阶段> --subject-kind=step --subject-id=<step_slug> --status=<completed|failed|skipped|not_applicable> --summary="<真实结果>" --evidence=<真实证据引用>
```

skill 使用同一命令，把 subject-kind 改成 skill，并在结束时带上实际 --version、--trigger=true|false 和 --executed=true|false；未触发的 skill 记录 not_applicable 和原因。阶段末执行 node tools/host/workflowhub-codex-session-event.mjs record-spec-analyze --stage=<本阶段> --input=<当前真实结构结果 JSON>，再执行 public run。token 从本次会话的真实 transcript 读取，无法读到就保持未提供；耗时由开始/结束时间计算。没有当前 task 绑定时命令会直接失败，不会把别的 task 的记录写进来。

## Authority

The current task has four working materials:

1. `decision-log.md`
2. `spec.md`
3. `plan.md`
4. `tasks.md`

四份材料都落在认证 worktree 的 specs/<task-id>/ 下；外置任务追踪目录只保存
`task.json`、`facts.jsonl`、`quality/`、`index.json` 等执行文件，不是材料替代物，且不新增 gate。
`m15-retirement` 会话负责的材料迁移不在本技能范围内；仓外
`~/Knowledge/Projects/workflowhub/tasks/Projects/` 清理也不在本任务范围内。

`make-decision` owns `decision-log.md`. Read the original requirement and any
current materials that already exist. Old accepted records, reviews, execution
records, worktrees, and history are audit facts only; they neither authorize nor
block Talk, drafting, revision, or same-task repair.

Keep three conclusions separate:

- Work may continue while the current requirement and materials can be read.
- A fact write with a wrong task, workspace, runtime, hash, schema, or declared
  write boundary fails loudly for that write.
- Stage completion additionally requires the real decision work and quality
  facts listed below.

A failed fact write never freezes the conversation or material repair. Preserve
the error, fix the binding or content, and continue in the same task.

## Portable dependencies

Use the dependency packages declared in `skill-deps.yaml` directly. Open each
dependency's declared `SKILL.md` and follow it in the current agent context. Do
not route them through a dispatcher, invocation protocol, or auxiliary progress
gate.

- `talk-with-zhipeng`: user-facing Talk only; Clarify belongs to build-spec.
- `grill-with-docs`: challenge the chosen direction against current facts.
- `decision-log`: write the decision record.
- `wh-review`: obtain independent review evidence.

Only the main agent may execute user-facing Talk or Grill. Research
may use an independent agent or search provider, but the main agent presents the
decision and questions to the user.

## Procedure

1. Replay the original requirement. Separate confirmed facts, assumptions,
   direction-changing ambiguity, non-goals, and deferred work. Completion:
   every part of the original requirement is represented or explicitly marked
   unresolved. Record the requirement-to-decision coverage matrix so that every
   original requirement has a visible disposition; the matrix must cover the five
   dimensions: business goal, flow/surface, data/state, success/failure/
   acceptance, and constraints/non-goals/deferrals. End with a plain-language
   card containing the core requirement, core goal, and selected direction.
   Before claiming completion, add these two sections to the same
   `decision-log.md`:

   - `## UI applicability` contains one fenced JSON fact with
     `result` and the three named sources. Recompute it with the existing
     three-input rule. If it is `unknown` or conflicted, record the real user
     question, wait for the reply, update the source fact it resolves, and
     recompute; a caller label or unanswered question never becomes `non_ui`.
   - `## 收敛检查` contains one four-row table: target, scope, solution, and
     acceptance. Every row records the actual user answer or `无新需求` plus a
     concrete fact/material reference. The solution row also records the
     tradeoff, rejected option, and open-item disposition. The acceptance row
     names its scenario, data source, pass condition, and fail condition.
     Older decision logs without this section remain readable; new records use
     this structure before a completion claim.
   - When the user declares the current task high-risk and user-visible, or the
     three inputs establish that classification, write the owning `### D<n>`
     section with exactly one Markdown source line in this form (the JSON is
     inline code, not bare text):
     ```md
     - **high_risk_fact**：`{"classification":"high_risk_user_visible","basis":"user_declaration"}`
     ```
     The only alternative `basis` is `three_inputs`.
     This is the sole decision-log fact a later acceptance card may reference;
     do not substitute policy IDs, task prose, or provider identity.
2. Execute the manifest in order. Every step completion first
   uses the existing make-decision writer to append one update to the same
   `decision-log.md` ref/hash. The update records the step outcome, the actual
   user reply or `no_new_requirement`, and the current/deferred/non-goal/open
   disposition. A write failure stays incomplete with its error; it is never
   replaced by a final aggregate claim or a second log.
3. The Talk flow uses steps 3, 4, 5, and 7: Talk round 1, proportionate
   research input, Talk round 2, then Talk round 3 after direction advice.
   Research is an input to Talk, not a review.
   Research runs only when its answer could materially change direction;
   otherwise record why it was skipped. Do not invent user answers.
   Ask only questions whose answers could change direction. Talk must cover both
   architecture direction and product journey or user outcome. Talk presents a batch of independent
   questions, with each question containing one decision axis, 2-3 meaningful choices,
   and plain-language consequences and risks. Talk groups independent decision axes in one batch;
   each question still contains only one decision axis, while dependent questions move to a later
   batch after the real reply. Use the real
   `ask -> wait/pause -> user reply -> resume -> re-rank` seam; never invent a
   reply. Do not run Clarify here; `build-spec` owns the only Clarify flow.

   Host execution binds that seam separately for every Talk round:
   - Talk round 1 uses `ask -> wait -> user reply -> resume -> re-rank` for the
     initial independent direction questions.
   - Talk round 2 uses the same real lifecycle for the remaining independent
     scope, non-goal, and risk questions after research.
   - Talk round 3 uses the same real lifecycle for only the remaining
     direction-advice questions.
   Each round must publish its own `ask`, pause at `wait`, accept only the
   matching real user `reply`, and then `resume` and re-rank before the next
   owning step. A previous round's decision-log text, aggregate, or default
   choice is never a reply for another round.
4. Only after Talk round 2 has resumed and converged, run the direction advice
   review (step 6). It is independent advice, not a `pass` gate. Preserve the
   actual provider, transport status, findings, and provenance; unavailable,
   failure, timeout, and `MATERIAL_INCOMPLETE` remain facts. Dispose each
   finding; this track records one semantic advice result and does not start a
   second provider request after finding repair or material edits. An unavailable review is never `pass` and never becomes an empty findings claim; it may be retried only after its missing route/material is repaired.
5. After direction advice, resume Talk round 3 (step 7) so the user can address
   blind-review findings, contradictions, key assumptions, and remaining risks.
   Only after that, run `grill-with-docs` (step 8). Grill is
   interactive thinking, never review. It may present one batch only when the
   questions are independent frontier questions; dependent questions are split
   and re-ranked. It uses the real `ask -> wait/pause -> user reply -> resume`
   seam and may preserve a partial reply. It must not call wh-review or create
   a review fact. Fold only its minimal `grill_summary.decision_updates` and
   necessary CONTEXT/ADR outcome into `decision-log.md`.
6. Write the decision draft after Grill (step 9), then run the detail advice
   review (step 10). This is also advice-only, not a `pass` gate. The detail
   review must happen after Grill and the draft, never before. Preserve real
   transport and finding facts. This track records one semantic advice result
   for the current make-decision execution; a later same-task execution reviews
   its current input once and preserves the older result as history only.
7. Present the final plain-language decision card at the approval/publish steps: direction,
   scope, non-goals, success criteria, risks, advice facts, unresolved items,
   and deferred work. Ask for the user's actual confirmation and preserve it.
   A rejection leads to a bounded revision of the same task; it does not create
   a successor task.

The old interaction aggregate still has a compatibility `clarify` slot because
its existing runtime validator is owned by the later build-spec handoff. In
this stage that slot is not a make-decision Clarify execution or confirmation;
P3 must move its active ownership to build-spec without adding a new object.

After the user confirms the final current decision, the current WorkflowHub session directly
assembles exactly one immutable interaction aggregate with these fields. This
aggregate is an existing quality fact consumed by the declared make-decision
detail-review/quality-fact contract; its owner is make-decision. The consumer,
owner, test, and retirement condition are recorded in the existing
`decision-log` catalog entry. It is not one of the four materials, not a status
machine, and not a permission to start or continue work. If it is missing or unavailable, the
formal completion claim stays incomplete while the same task can continue to
repair the decision and its facts.

```json
{
  "schema_version": "workflowhub-interaction-aggregate.v1",
  "task_id": "<current task>",
  "stage": "make-decision",
  "snapshot_tree": "<current snapshot tree>",
  "talk": {
    "status": "completed",
    "round_count": 3,
    "architecture_direction_covered": true,
    "user_outcome_covered": true,
    "lifecycle_rounds": [
      {
        "interaction_type": "talk",
        "events": [
          { "event": "ask", "round": 1, "card_ref": "...", "card_hash": "...", "questions": [] },
          { "event": "wait", "round": 1, "card_ref": "...", "card_hash": "..." },
          { "event": "reply", "round": 1, "card_ref": "...", "card_hash": "...", "reply_ref": "...", "reply_hash": "...", "source": "user", "answers": [] },
          { "event": "resume", "round": 1, "card_ref": "...", "card_hash": "...", "reply_ref": "...", "reply_hash": "...", "status": "resumed" }
        ]
      }
    ]
  },
  "clarify": {
    "status": "resolved",
    "open_direction_changing_questions": 0,
    "resolved_by": "user_reply"
  },
  "decision_ref": "<current decision-log ref>",
  "decision_hash": "<current decision-log hash>"
}
```

Serialize the aggregate once, hash those exact bytes with SHA-256, and write it
directly to `quality/evidence/interactions/<sha256>.json`. The path hash must
match the stored bytes. Bind only the current task, `make-decision` stage,
current material context, and user-confirmed decision. `lifecycle_rounds` 只保留
当前会话用于验证 round、card、reply 和顺序的最小结构化事实；正式 handler 会在
接受 aggregate 前逐轮调用现有 lifecycle validator。它仍是 aggregate 内的一部分，
不是独立 per-round writer、历史 ledger 或新的状态机。`snapshot_tree`
field binds the current source tree for evidence integrity only; it is not
snapshot lineage, a selector, or a delivery gate. Do not create a run,
revision, latest pointer,
ledger, controlled-writer protocol, per-round writer, question-card archive, or
Grill history. If the accepted decision changes before completion, assemble a
new aggregate from the new final decision; never mutate an existing hash path.
Retire this fact only when the named current consumers are removed or replaced
by a separately reviewed constitutional change; do not add a replacement state
object.

## Completion and fact writing

Do not claim this stage complete until Talk is resolved, necessary research ran
or has a truthful outcome, Grill ran, `decision-log.md` is current,
independent review findings and transport facts are recorded, every finding has a
disposition, the user explicitly confirmed the decision, and the content-addressed
interaction aggregate binds that accepted decision. The aggregate is a completion
fact, not a permit to continue working.

Missing or unavailable quality facts limit only the completion claim and do not
prevent continued Talk, drafting, decision-log revision, or finding repair in
the same task. Write
current facts only to the task's existing fact and quality stores. If a
structural check rejects a write, report that exact failure; never turn it into
success or create a substitute record.

## Communication and stage end

Use the user's language and plain-language cards. Keep paths, hashes, refs, and
commands in formal records. Before moving to `build-spec`, explain what was
decided, scope and non-goals, remaining risks, deferred work, and what downstream
stages must not guess. Wait for the user's actual reply before handoff; without
that reply keep the stage `in_progress`/`pending` and do not claim completion.

Downstream stages read this summary and the four materials. They must not ask the
user to repeat Talk or Grill, and they need no index of the decision process.

## Stage-end consistency

Ask for the user's final confirmation, assemble the immutable interaction
aggregate, and then run `stage-end-spec-analyze` before `publish-decision`.
Invoke the existing `spec-analyze` skill on the original requirement, the
current `decision-log.md`, the authenticated requirement projection, the
complete Grill and review facts, the aggregate, the final confirmation, and
all evidence actually produced in this stage. Check semantic coverage and real
outcome evidence, not IDs, paths, hashes, or document existence alone. Repair
any finding in make-decision; if a repair changes the decision, ask for
confirmation again and rebuild the aggregate from the new decision. Do not
move the gap to build-spec. End with the shared six-part plain-language
summary: current stage work, requirement coverage, upstream alignment,
repairs made here, remaining risks, and the next stage boundary.
