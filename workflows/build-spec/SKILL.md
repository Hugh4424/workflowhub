---
name: build-spec
description: Turn the current product decision into a complete, testable feature specification.
version: 4.1.0
---

# Build Spec

## 统一回退协议

五个正式 stage 共用 `runtime/stage/stage-content-contracts.mjs` 的
`validateFallbackProtocol`。实现级问题留在当前 stage 修复；规格歧义回
`build-spec`；方向级问题回 `make-decision` 做增量决策；材料缺口回对应
owner；环境不可用只记录 attempt。错配只让正式完成事实保持 `incomplete`，保留同 task 修复，禁止整阶段重跑；不新增 stage、public command、store 或 gate。

## Responsibility and authority

Turn the current `decision-log.md` into the current `spec.md`. The four
materials have separate responsibilities and are the only current work authority;
old records are not a replacement authority:

- `decision-log.md` owns original requirements, user choices, reasons, risks,
  non-goals, and deferred direction;
- `spec.md` owns product behavior, flows, states, FR, AC, failure boundaries,
  and product-facing contracts;
- `plan.md` and `tasks.md` are downstream engineering outputs and must not fill
  a missing product decision.

This stage owns only `spec.md`. An existing specification is revised in place;
do not create a parallel specification. If a direction-changing decision is
missing, expose the exact gap to `make-decision` and continue unaffected repair.
The specification records clarifications and never invents product direction;
any new product scope must come from an explicit upstream decision in `decision-log.md`.
The current `spec.md` remains the single revision target; never create a
 parallel revision target or infer a replacement from historical records.
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

阶段结束时，当前主会话按 `stage-reflection` 产出 `stage-reflection.v2` judgment JSON。既有 `on_stage_end` 由 `stage-runner#runStageEndReflection` 消费；显式提交仍用公共入口 `run --action=reflect`。`judgments[].evidence_refs` 必须显式引用本次 `build-spec` 的 canonical stage outcome，去重后唯一；writer 重读并认证该原件，派生真实 executor、run、attempt、材料与 snapshot 身份。缺来源或判断时保留 `unavailable`，不借用旧运行身份。

六个结构化区块是 `what_helped`、`what_to_improve`、`blockers`、`intervention_reasons`、`what_to_simplify`、`simplifiable_now`；条目绑定真实 `evidence_refs` 与 `confidence`。已检查未观察到写 `none_observed`，无法判断写 `unknown` 与 `unknown_reason`，不适用写 `not_applicable` 与理由。

消费实际返回的 `ref`、`sha256`：新原件为 `quality/stage-reflection/build-spec/<reflection_key>.json`，`reflection_key` 是语义身份，`sha256` 是原件 bytes hash，两者不能互换。同一运行、来源、材料与判断 A 重试 A 时复用首次原件和时间；新运行或新判断 B 生成新 ref，A 保持不变。失败/缺失仍写其真实状态，不通过删字段、扫描 latest 或读取旧固定 `<stage>.json` 冒充本次完成；旧原件只读保留。

验证由 `validate-stage-reflection.mjs` 完成；它内部调用 `deriveConsumptionEdges`，不是技能单独运行消费边工具。较早 subject 的 `output_refs` 只有与较晚 subject 的 `input_refs` 同值时才形成边；任一 stage outcome 或声明 output 缺失时扫描不完整，`coverage_status` 为 `partial`，消费保持 unknown，不能推出 `zero_consumption_proof`。完整扫描、近 30 天 output 且 consumer 全为零，再加人工 rejected 或同一步骤两次介入，才保留 `remove_candidate`；否则是 `needs_evidence`。验证或发布失败时保留实际错误与 unavailable；同一来源重试仍消费原有公开入口，不生成替代记录。

当 `spec-clarify trigger=true` 时，spec-analyze 输入携带当前 `snapshot_tree`、`material_revision` 和真实 `lifecycle_rounds`。由本次显式 session/Stage Agent outcome 认证 `ask -> wait -> user reply -> resume` 及匹配的 card、reply、hash；当前 Clarify receipt 进入 `receipts.clarify`，由 `stage-handlers#clarifyFacts` 消费。缺答复、身份漂移、partial、withdrawn 或中断保留对应事实，不能从旧 transcript/env 补答复、重绑旧确认或把 trigger=false 当作已完成。

## 当前 producer、审查与验收引用

本阶段只细化当前决策与规格；未来 `plan.md`、`tasks.md` 的完备性不成为写规格的前置。AC 保留场景、数据来源、可判真 oracle 和失败条件。实际 command/service 验收由 build-code 的现有执行器产生原件，verify-code 消费同次独立 review 与真实用户确认；规格审查与 AC 文本都不替代执行证据。

真实 Stage Agent 经现有 bridge 显式提交 project/task/stage/attempt/run 身份及 `session` 或 `unavailable`，正式 `run` 消费实际返回的 `quality/evidence/stage-outcomes/build-spec/<sha256>.json`。保留 producer/hash 与失败事实，不推断旧会话身份。

通过既有 `review --action=record` 的 `request` 路径审查当前规格，保留实际 `attempt_ref`、可空的 `result_ref`、`report_ref`，并把 canonical result 或 unavailable attempt 的实际 ref 放入 `receipts.review`，由 `stage-handlers#safeReviewFacts` 认证。保留每个角色的语义、provider、transport、错误与 provenance；不得把记录成功、空 findings、partial 或 unavailable 当作规格通过，也不为 clean 标签重复整轮审查。usage/timing 只回读已认证 attempt 的 `provider_attempts[].execution`，缺失保留 unavailable，实际零值仍为零。

方向批准从当前依赖的 canonical confirmation、quality fact 与真实 approve-decision outcome 认证；当前 `spec.md` 的细化不改变已批准 decision 内容范围，真正方向变化仍回 make-decision。风险接受与本阶段自己的确认继续使用严格材料/身份绑定。

## Portable dependencies

Read inline packages declared in `skill-deps.yaml` directly in the same
WorkflowHub session context. Packages declared `execution: independent` run in their own
independent context and return only findings; do not inline them or route them
through a dispatcher. `spec-research` is the conditional independent research
owner for this stage; `spec-clarify` is the only specification-clarification
owner. They return facts to this same stage and do not create extra artifacts,
dispatchers, or work prerequisites. `spec-specify`, `simplicity-guard`, and
`plan-ceo-review` are inline lenses; conditional design review follows its
declared execution.

Quality dependencies and the review dependency declared in `skill-deps.yaml`
may be unavailable.
Preserve the real unavailable/error/transport fact and keep drafting or
repairing this same task. Never turn unavailable into empty findings or a
completion claim, and never make it a reason to stop safe writing.

Review is a quality fact, not a progression gate or permission to continue
working. Missing or unavailable quality evidence lowers the completion claim;
it does not block same-task drafting or repair. An unavailable review is never
`pass`.

### Stage-input packet and context facts

Before `spec-specify` executes, the host assembles and freezes a
`stage-input-packet.v1` from the current materials. The packet is the only
input surface for the inline skill and dispatched contexts: bind `task_id`,
stage, `material_revision`, `snapshot_tree`, source SHA-256 values,
derived-file producer/consumer, and `packet_freeze_hash`. The main session
keeps only packet reference, hash, binding, and a summary no longer than 500
characters. Navigation is a regenerable material section, not a fifth
material. Packet failure is reported as unavailable with owner/next action;
it is not converted to an empty input or a quality pass. Record provider usage
when returned, otherwise `usage_status=unavailable`; record the three character
proxies (`full_reread_count`, `subagent_input_bytes`,
`review_material_bytes`) without token-budget or cost claims. No decrease is
claimed without evidence.

## Conditional UI design path

When the latest `## UI applicability` JSON in `decision-log.md` is `ui`, consume
the declared dependencies in this order: `ui-project-init`,
`design-source-readiness`, `frontend-prototype-render`, then
`plan-design-review`. The init result establishes the new/legacy project
boundary; readiness derives the **Screen Read Map**; the renderer uses real
component/fixture inputs to produce a task-scoped preview, screenshot and
command output. Component and fixture hashes must match bytes read from the
current Workspace. Its authenticated stage proof must bind `exit_code: 0`,
source hashes, viewport, material revision and the current Workspace snapshot. The
user must confirm the displayed result before the existing review records the
UI Contract. The confirmation must be an authenticated current-task
`quality/confirmations/<sha256>.json` bound to the displayed preview, current
material revision and current snapshot. No step may silently skip readiness,
rendering, or user confirmation, or treat a caller label as UI proof.

If the logged applicability is `non_ui`, record the reason and keep the existing
non-UI path. If it is `unknown`, missing, or conflicts with caller facts,
preserve the conflict and hand it back to make-decision; do not invent product
scope in build-spec. A missing `Design.md`, real component input, preview,
fixture, or version can produce `unknown`/`not_bindable`, `unavailable`, or
`N/A + reason`; this is a quality fact and rework risk within the existing stage.
Keep the current public commands and four materials.

The UI Contract keeps a required `page_or_region`, its interaction flow,
visible labels, and a state matrix. Every state has a required `name` and
`interaction_flow`, in addition to the state evidence below.
`design_status`, `missing_items` with reasons, `fallback_visual_basis`,
`constraints`, `assumptions`, `rework_risk`, `human_confirmation`, and
`current_material_ref`, plus preview/fixture/viewport/screenshot/design-version
references (`preview_refs`, `fixture_refs`, `viewport_refs`, `screenshot_refs`).
Every state also records responsive behavior and accessibility intent (`responsive`,
`a11y`), and the page-level visible labels are kept as `visible_labels`. Missing
references are explicit `unknown`/`unavailable`/`N/A + reason` facts rather than
empty placeholders. It is handed to build-plan without copying `Design.md`.

### Executable UI design loop

The UI path is backed by pure runtime contract functions in
`runtime/stage/stage-content-contracts.mjs`; the Markdown skills describe how
to call them but are not the implementation:

- `buildUiProjectInitFact` returns the `new`/`legacy` initialization fact. A
  missing Design.md, version, first page, fixture, viewport, or preview is
  returned as an unknown fact with a reason.
- `deriveDesignSourceReadiness` turns caller-read Design.md sections (or its
  headings) into a Screen Read Map and reports `bindable`, `not_bindable`, or
  `unknown` plus freshness and missing fields.
- `buildShortUiDesignPrompt` emits exactly four lines: page/region,
  interaction, states, and visible labels. It does not repeat the technical
  Design.md/UI Contract constraints.
- `validateUiDesignLoopFact` validates the recorded preview, prompt, external
  return/cancel/not-returned/version-mismatch, and human-confirmation facts.
  Every recovery path preserves the current UI Contract and `gate` is rejected;
  no new stage, material, or independent state machine is created.

External design is a single explicit handoff, not a second workflow: the user
must first明确同意 a four-line prompt package; retain the authenticated prompt
and downgrade confirmation, receive a design bound to the current Design.md
revision, show that returned design, then collect a second authenticated final
confirmation whose subject is the returned design. This branch does not need a
local renderer or require `preview_unavailable`, but it shares init/readiness,
source identity, current snapshot, display-before-reply and `human_approved`.
The authenticated `prompt_ref` bytes must exactly equal the displayed four-line
prompt text. Preserve visible action labels (`重新读取`, `生成设计提示词`, `取消`, `未返回`, or
`重新读取并确认`). `human_acknowledged` and `human_not_approved` retain risk but
do not satisfy the UI confirmation.

### Project source boundary

`Design.md` is the project-wide visual and component standard: tokens,
typography, layout, component variants, accessibility defaults, and the
decision rules for reuse versus extension. `Experience.md` is the project-wide
interaction and page-flow standard: routes, user-visible states, transitions,
failure/recovery behavior, examples, and test scenarios. A UI specification
must bind both files by path, content hash, revision, owner, and explicit
section anchor when both exist. Reusing an existing rule does not require a
Design.md rewrite; a new or changed visual rule does. A changed page or
interaction belongs in Experience.md and must not be smuggled into Design.md.
The generated spec carries these identities forward and the strict analyzer
rejects hand-repaired or heading-slug-only bindings.

## Required specification content

Read the decision log and existing spec before researching. Preserve every
confirmed choice and every explicit non-goal. Run the `spec-research`
dependency only when a current interface, data rule, state, compatibility
boundary, security condition, or operational fact is needed to make product
behavior precise. If the existing facts already answer it, record `skipped`
with the reason; if the capability cannot run, record `unavailable` with the
real cause. Durable findings belong in the relevant spec section, not a second
research authority.

The specification must make these items explicit when applicable:

1. quick-read goal, user outcome, scope, urgency, and business impact;
2. non-goals and deferred work, each linked to a current decision/source;
3. user scenarios and journeys, including default, empty, loading, error,
   cancellation, permission, boundary, and race states;
4. state transitions and observable success, failure, recovery, and retry
   behavior;
5. stable IDs for scenarios, product facts, FR, AC, risks, and open questions;
6. functional requirements, each linked to a source, scenario, and AC;
7. acceptance criteria with method, pass oracle, failure condition, evidence
   type, and affected user state;
8. product-boundary interfaces, entities, data lifecycle, and compatibility
   contracts only when they affect what users must observe;
9. assumptions, risks, unknowns, owners, handling stage, and close condition;
10. explicit exclusions and the next-stage handoff.

List every material ambiguity separately with its possible impact on
scope, acceptance, interface, data, security, or operations. Do not guess an
answer from code, old records, or a plan.
Do not run Talk or Grill in this stage, and do not call
`talk-with-zhipeng` or `grill-with-docs`; those activities belong exclusively to
`make-decision`. The `spec-clarify` dependency is the one allowed Clarify flow:
it asks one material specification batch of independent questions, waits for the real user reply,
resumes with that reply, and writes the answer back to `spec.md`. A missing
reply, wrong card, stale hash, or interrupted resume stays `incomplete`; it is
never inferred or replaced by a second Clarify implementation. A
direction-changing ambiguity is returned to `make-decision` as an upstream
decision gap. Continue all unaffected drafting and repair while recording the
gap plainly.

## Findings 处置对话分工

build-spec 审查产生的争议 findings 处置对话=复用 spec-clarify。它仍然只处理
当前规格中的材料歧义和 finding 决定轴，沿用既有 stage outcome 侧校验、真实
`ask -> wait -> user reply -> resume` 生命周期和交互 receipt；答复回写 finding
时保留 `source=user_reply` 与 `evidence_ref=reply_ref`。不新增对话技能、状态机、
stage 或 gate。

`talk-with-zhipeng` 不进入 build-spec 的技能声明或执行路径；`grill-with-docs`
保持 grill 独占，只在 make-decision 作为方向挑战使用。build-spec 不运行 Talk
或 Grill，也不把二者的历史答复当作 spec-clarify 的用户回复；缺少、过期或中断
的交互 receipt 保持 `incomplete`，不得推断或伪造答复。

## Boundaries

Do not add implementation file lists, code symbols, engineering alternatives,
exact test commands, or task steps to `spec.md`; those belong to `plan.md` and
`tasks.md`. Do not duplicate scenario prose in FRs, assumptions outside the
fact section, or exclusions in several sections. Conditional contracts use one
complete applicable subsection or one factual `N/A — reason` line.

The specification must not create a second authority, status projection, or
process summary. Quality facts may be referenced by path and source, but a
review or test result never changes product scope automatically.

## Work sequence

1. Read `decision-log.md` and current `spec.md`; build a source/decision index.
2. Identify every confirmed requirement, choice, boundary, non-goal, risk,
   deferred item, and upstream gap.
3. Run conditional `spec-research` when the current facts are insufficient;
   otherwise record why it was skipped, and preserve unavailable facts.
4. Run the unique `spec-clarify` flow in one batch of independent material spec ambiguities;
   keep dependent ambiguities out of that batch and resume only from the matching real user reply.
5. Draft or revise `spec.md` with stable IDs, flows, states, FR/AC, oracles,
   failure conditions, risks, and explicit exclusions.
6. Cross-check no decision was dropped, no new product scope was invented, and
   every AC is observable.
7. Use the review dependency declared in `skill-deps.yaml` against the current decision
   and specification. Keep provider/model/transport provenance and findings;
   the review contract returns findings, not a pass/revise permission.
8. Dispose each finding as `fixed`, `rejected_invalid`, `accepted_risk`, or
   `needs_human`. Repair valid findings in this same task and keep unresolved
   risk visible.

9. Run the final declared `stage-end-spec-analyze` step before publishing. It
   compares the original requirement and decision-log against the actual
   `spec.md`, all product flows/states/boundaries/non-goals, and current
   evidence. It checks semantics and evidence, not only IDs or file existence.
   Repair specification gaps in this stage; do not leave them for build-plan.
   Return the shared six-part plain-language summary: current stage work,
   requirement coverage, upstream alignment, repairs made here, remaining
   risks, and the next stage boundary.

## Completion and handoff

Content work is complete when every confirmed decision has a stable product
meaning, every requirement and AC has an oracle and failure condition, flows
and boundaries are explicit, and review facts/finding dispositions are honest.
The build-spec stage is not formally complete while required quality facts are
missing or unavailable; report `incomplete` and keep the same-task repair path
open. Missing or unavailable quality facts lower the completion claim but do
not block continued work: continue drafting or repairing this same task. This
stage does not create a new task to bypass a quality or transport gap.

End with plain language: what behavior `spec.md` defines, what is out of scope,
the important risks and unknowns, review findings/transport facts, and what
`build-plan` should do next without guessing. User confirmation is human
alignment, not a machine work permit; it does not authorize commit, push,
merge, archive, or cleanup.
