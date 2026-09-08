---
name: make-decision
description: Clarify a real product direction through Talk, proportionate research, independent review, and user confirmation.
version: 3.2.0
---

# Make Decision

## 统一回退协议

五个正式 stage 共用 `runtime/stage/stage-content-contracts.mjs` 的
`validateFallbackProtocol`。实现级问题留在当前 stage 修复；规格歧义回
`build-spec`（`build-plan` 走 spec-clarify）；方向级问题回
`make-decision` 做增量决策；材料缺口回对应 owner；环境不可用只记录
attempt。错配只让正式完成事实保持 `incomplete`，保留同 task 修复，禁止整阶段重跑；不新增 stage、public command、store 或 gate。

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

## 阶段末遗漏披露

阶段结束的大白话总结必须逐项列出本阶段所有未完成、失败、跳过、不适用、`unknown`、`unavailable` 或 `incomplete` 的 step 和 skill，并写真实原因与证据引用；没有遗漏就明确写“无遗漏”。执行事实通过正式 `run` 输入提交，不依赖宿主会话绑定、隐式选 task 或等待时限。

## 阶段末复盘（必须执行）

阶段结束时，当前主会话按 `stage-reflection` 产出 `stage-reflection.v2` judgment JSON。既有 `on_stage_end` 由 `stage-runner#runStageEndReflection` 消费；显式提交仍用公共入口 `run --action=reflect`。`judgments[].evidence_refs` 必须显式引用本次 `make-decision` 的 canonical stage outcome，去重后唯一；writer 重读并认证该原件，派生真实 executor、run、attempt、材料与 snapshot 身份。缺来源或判断时保留 `unavailable`，不借用旧运行身份。

六个结构化区块是 `what_helped`、`what_to_improve`、`blockers`、`intervention_reasons`、`what_to_simplify`、`simplifiable_now`；条目绑定真实 `evidence_refs` 与 `confidence`。已检查未观察到写 `none_observed`，无法判断写 `unknown` 与 `unknown_reason`，不适用写 `not_applicable` 与理由。

消费实际返回的 `ref`、`sha256`：新原件为 `quality/stage-reflection/make-decision/<reflection_key>.json`，`reflection_key` 是语义身份，`sha256` 是原件 bytes hash，两者不能互换。同一运行、来源、材料与判断 A 重试 A 时复用首次原件和时间；新运行或新判断 B 生成新 ref，A 保持不变。失败/缺失仍写其真实状态，不通过删字段、扫描 latest 或读取旧固定 `<stage>.json` 冒充本次完成；旧原件只读保留。

`validate-stage-reflection.mjs` 在验证时内部调用 `deriveConsumptionEdges`，不是由技能另行调用。它只把较早 subject 的 `output_refs` 与较晚 subject 的 `input_refs` 的同一引用配成消费边；扫描不完整时 `coverage_status` 为 `partial`、消费保持 unknown 且 `zero_consumption_proof` 不可用，单个 output 没有后续边也不能直接称为零消费。只有完整扫描、近 30 天登记 output 的零 consumer 证明和人工 rejected/同一步骤两次介入，`remove_candidate` 才能保留，否则降为 `needs_evidence`。验证或发布失败时保留实际错误与 unavailable；同一来源重试仍消费原有公开入口，不生成替代记录。

## Authority

The current task has four working materials:

1. `decision-log.md`
2. `spec.md`
3. `plan.md`
4. `tasks.md`

四份材料都落在认证 worktree 的 specs/<task-id>/ 下；外置任务追踪目录只保存
 `task.json`、`facts.jsonl`、`quality/`、`index.json` 等执行文件，不是材料替代物，且不新增 gate。
 新项目可参考 `docs/templates/project-gitignore.md` 选择执行侧车忽略规则；该模板不修改存量仓库。
`m15-retirement` 会话负责的材料迁移不在本技能范围内；仓外
`Knowledge/Projects/workflowhub/tasks/Projects/` 清理也不在本任务范围内。

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

## 当前 producer 与审查引用

本阶段只消费当前原始需求和已存在的材料，不把未来 `spec.md`、`plan.md` 或 `tasks.md` 当方向确认前置。验收在这里明确用户场景、数据来源、成功 oracle 和失败条件；实际 command/service 执行由后续 build-code 负责，同次独立复核与用户确认由 verify-code 消费，方向审查不替代它们。

真实 Stage Agent 通过现有 bridge 显式提交 project/task/stage/attempt/run 身份与 `session` 或 `unavailable`。正式 `run` 使用 bridge 返回的 `quality/evidence/stage-outcomes/make-decision/<sha256>.json`；保留原件 hash、producer 与失败事实，不从旧 session/env 或 transcript 猜本次执行。

方向、细节审查仍各走原有角色和顺序。既有 `review --action=record` 的 `request` 路径执行并记录一次审查；保留实际返回的 `attempt_ref`、可空的 `result_ref` 和 `report_ref`，再分别通过 `receipts.direction_review`、`receipts.detail_review` 交给 `stage-handlers#safeReviewFacts`。result 可用时引用实际 canonical result，只有 unavailable attempt 时引用该 attempt，不拼造 UUID/hash 路径或空结果。保留每个角色的真实语义、provider、transport、错误与 provenance；`recorded` 只证明记录完成。当前材料或 route 改变后按既有预算处理，不为 clean 标签重派。usage/timing 从已认证 attempt 的 `provider_attempts[].execution` 读取；缺失为 unavailable，真实零值仍为零。

普通方向确认绑定 `decision-log.md` 批准内容范围；后续材料细化不使该批准失效，真正方向改变仍需新的真实答复。caller 从 canonical confirmation、quality fact 与真实 approve-decision outcome 认证同一来源；风险接受、close 和其他阶段仍保留各自严格身份绑定。

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
   Research is an input to Talk, not a review. When a question can materially
   change direction, make-decision uses the `skills/deep-research/SKILL.md`
   R0-R5 contract: generate gaps from the requirement framework, retrieve and
   read primary text, deep-read in bounded parallel contexts, triangulate,
   write content-addressed `research-report.v1`, and run independent review.
   R0 gaps come from the requirement-framework skeleton rather than invented
   agent questions. Skipping research requires recording why the answer cannot
   change direction and which current facts support the skip. Research is
   advice/input for Talk; it does not approve a direction or create a gate.
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
     direction-advice questions. Its input must explicitly include the
     red/blue direction-review finding dispute list and any unresolved items
     from the debate decision; do not compress either source into a generic
     summary.
   - A conditional Talk round 4 may run only after the detail-advice review
     when a remaining dispute is direction-level or changes acceptance. If no
     such dispute exists, do not start Talk round 4: the main agent repairs
     implementation-level findings directly and registers the disposition.
     When Talk round 4 runs, it uses the same ask -> wait -> user reply ->
     resume -> re-rank lifecycle and binds the reply to the affected finding.
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
   the explicit red/blue finding dispute list, debate unresolved items,
   contradictions, key assumptions, and remaining risks.
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
Only the current build-spec Clarify outcome proves that activity; this compatibility slot does not.

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

`round_count` is the actual number of completed Talk rounds: it is `3` when
the conditional Talk round 4 is not triggered and `4` when a direction-level
or acceptance-impacting dispute requires it. Serialize the aggregate once,
hash those exact bytes with SHA-256, and write it
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

## Execution model (M/S/B/P)

这是执行方式说明，不是新的 stage、public command、runtime gate 或质量通过条件。
口径唯一来自 decision-log 的“Step×Executor 矩阵”和“上下文守恒规则”。

| step | executor | handoff |
| --- | --- | --- |
| 1 load-context | M+S | S 读原始需求和仓库，回传摘要与覆盖矩阵草案；M 校验定稿 |
| 2 triage-scope | M+S | S 回传范围、不确定性和非目标草案；M 定稿 |
| 3 talk-r1 | M | M 独占问题卡与真实用户回复 |
| 4 research-inputs | S 为主 | M 定 gap；S 检索/深读/落盘，回传 report hash、摘要和复核 finding |
| 5 talk-r2 | M | M 独占研究后的范围、非目标和风险问答 |
| 6 direction-advice | B+S | B 后台执行红/蓝审查；S 只归纳主题和争议，不做质量裁决；全文≤2页落盘，主会话摘要≤500字 |
| 6b debate-direction | S 并行+M | 四角色 S 产裁决书 ref 和歧义清单；M 只登记与呈用户 |
| 7 talk-r3 | M | M 独占方向争议问答 |
| 8 grill-with-docs | M | M 独占 Grill 问答；S 只提供候选问题池 |
| 9 write-decision-draft | S+M | S 产草稿；M 修正链字段、模块、覆盖和宪法边界 |
| 10 detail-advice | B+S | B 后台执行红/蓝审查；S 归纳并保留原始 ref |
| 10b debate-detail | S 并行+M | 四角色 S 产细节裁决书；M 按分级规则登记 |
| 第4轮 talk（detail findings） | M | 仅在方向级或影响验收的争议触发；M 独占问题卡与真实用户回复 |
| 11 approve-decision | B+M | B 组装 interaction aggregate；M 签发用户确认 |
| 12 stage-end-spec-analyze | S+B | S/B 产语义 gap；M 处置，改变决策时重新确认 |
| 13 publish-decision | M | M 发布决策与阶段末披露 |
| 14 stage-reflection | M | M 产 judgment JSON；S 只提供统计事实 |

### Context conservation rules

1. 全量 research-report、审查原始结果、debate 产物和草稿全文都落到 task_dir 的质量证据区或 worktree artifact；主会话只保留 `ref + sha256 + 结构化摘要（≤500 字）`。
2. S 回传必须是结论条目、证据 ref、置信度；研究/草稿/汇总类不超过 500 字，复核类按 `severity|位置|问题|建议` 一行一条，不回传长日志。
3. 并行上限固定为：研究 4、debate 4、红蓝 2；交互步骤与依赖链按顺序执行，不为并行而并行。
4. 问题卡与用户回复只登记在 decision-log T 表；交互由 M 发出，不能由 S/B 代答。
5. 候选由 S 生成、M 选择；方向级或影响验收的争议交用户，实施级争议交独立 debate/复核，M 只登记。
6. M 每步只依赖上一步的决策摘要和材料 ref；S 可按任务需要读取已落盘的完整材料，但不能把旧步骤全文重新塞回 M。

这些规则只约束上下文和执行方式，不改变已有阶段契约、事实状态或推进边界。

## Completion and fact writing

Do not claim this stage complete until Talk is resolved, any conditional Talk
round 4 trigger is evaluated and handled, necessary research ran
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
