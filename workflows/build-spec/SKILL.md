---
name: build-spec
description: Turn the current product decision into a complete, testable feature specification.
version: 4.1.0
---

# Build Spec

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

## 同一会话自动记录

本阶段就在当前 WorkflowHub 会话中执行，不启动第二个 Agent。每个 manifest step 和每个声明的 skill 都必须在实际开始前、结束后调用一次私有记录命令；这是工作流内部动作，用户不需要手工提醒。命令失败就保留真实 incomplete/unavailable，不能补填成功。

阶段入口收到明确的 project/task context 时，会自动把当前已登记会话绑定到这个 task；新任务创建或单独启动任务时由内部 `task-bootstrap` 完成同一绑定。绑定后下面的命令自动使用这个 task，不再手填 task id。一个会话只允许绑定一个 task，换 task 必须开新会话。

```sh
node tools/host/workflowhub-codex-session-event.mjs start --stage=<本阶段> --subject-kind=step --subject-id=<step_slug>
node tools/host/workflowhub-codex-session-event.mjs finish --stage=<本阶段> --subject-kind=step --subject-id=<step_slug> --status=<completed|failed|skipped|not_applicable> --summary="<真实结果>" --evidence=<真实证据引用>
```

skill 使用同一命令，把 subject-kind 改成 skill，并在结束时带上实际 --version、--trigger=true|false 和 --executed=true|false；未触发的 skill 记录 not_applicable 和原因。阶段末执行 node tools/host/workflowhub-codex-session-event.mjs record-spec-analyze --stage=<本阶段> --input=<当前真实结构结果 JSON>，再执行 public run。token 从本次会话的真实 transcript 读取，无法读到就保持未提供；耗时由开始/结束时间计算。没有当前 task 绑定时命令会直接失败，不会把别的 task 的记录写进来。

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

## Conditional UI design path

When the make-decision applicability fact is `ui`, consume the declared
dependencies in this order: `ui-project-init` first, then
`design-source-readiness`, then the existing `plan-design-review`. The init
result establishes the new/legacy project boundary; the readiness result is a
derived **Screen Read Map**; the existing review consumes that map before this
stage records the UI Contract. No step may silently skip the readiness result
or treat a caller label as UI proof.

If the applicability fact is `non_ui`, record the reason and keep the existing
non-UI path. If it is `unknown`, or the upstream page/flow/state facts conflict,
preserve the conflict and hand it back to make-decision; do not invent product
scope in build-spec. A missing `Design.md`, preview, fixture, or version can
produce `unknown`/`not_bindable`, `unavailable`, or `N/A + reason`; this is a
quality fact and rework risk, not a gate or no gate. There is no new stage, public command,
fifth material, or no-design gate.
No new stage or no gate is introduced by this conditional path.

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

When preview is unavailable or not accepted, record the corresponding fact and
visible action labels (`重新读取`, `生成设计提示词`, `取消`, `未返回`, or
`重新读取并确认`). A returned design is usable only when its Design.md
revision matches the expected revision. `human_acknowledged` and
`human_not_approved` retain risk but may continue to build-plan; they are not
silently rewritten as design success.

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
