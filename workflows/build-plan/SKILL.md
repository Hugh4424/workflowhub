---
name: build-plan
description: Turn the accepted specification into an implementation plan and task list.
version: 2.0.0
---

# Build Plan

A real review outcome is recorded as returned; `unavailable` never becomes
`pass`.

## Main-flow rule

The current `spec.md`, `plan.md`, and `tasks.md` are live working documents.
Update them in this same task when requirements change. Accepted records,
checkpoints, receipts, reviews, confirmations, rebinds, and continuations are
audit information, not licences to edit or continue. Planning quality still
requires deterministic FR/AC coverage, executable Tasks, one bounded real
review, a plain-language summary, and human confirmation.

## Runtime contract

`core/stage-context.mjs` is the external runner implementation. Consume only the
branded StageContext from
`bootstrapStage("build-plan", ...)`. Read accepted results only with
`ctx.kernel`; read and write design files only with `ctx.artifacts`.
Never derive task identity or paths from cwd, a repository, or an issue
identifier. The launcher resolves all `scripts/`, `core/`, and `metrics/`
locators from the launcher-owned runtime; available runner Git facts are audit
metadata only. Runner branch, dirty state, and old runner migration history
never decide the stage result. Never search for or copy runner files into the
target repository.

Executable entry: `node scripts/stage-runtime.mjs run --stage=build-plan
--project=<project> --task=<task> --input=<component-receipts.json>`. Use the
`confirm --attempt=<attempt> --decision=accepted|rejected` records the human
decision. Pass its returned ref to `accept --human-confirmation-ref`; rejected
confirmations never publish checkpoint refs.

If the working plan changes after integration, edit the current `plan.md` and
`tasks.md` in this task and rerun the affected checks. A baseline-rebind record,
if present, remains historical audit only.

The loaded Skill is the authoritative contract. Do not search the target
repository for another Skill file. The target repository's `skills/` directory
is never an entry.
`stage-runtime.mjs` has no `--help` command. Build-plan must not call `prepare`
and must never pass `--runner-root`.

Create an OS temporary directory first:
`TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/workflowhub-build-plan.XXXXXX")"`.
Every caller-owned draft, receipt payload, run input, or review request must
stay under `$TMP_DIR`, never in the target base repository or CandidateWorkspace.
The `artifact` commands below are the only route that copies reviewed drafts
into the CandidateWorkspace; canonical receipts remain owned by TaskKernel.
Create temporary inputs with one shell command (`printf`, redirection, or a
here-document). Never use an editing or patch tool for them: it is not part of
the Stage contract and can leave the host waiting for an unrelated tool callback.

Use this complete public sequence without inventing flags or input shapes:

1. Before each review, publish both exact drafts under review:
   `node scripts/stage-runtime.mjs artifact --stage=build-plan
   --project=<project> --task=<task> --name=plan.md
   --input=$TMP_DIR/draft-plan.md` and
   `node scripts/stage-runtime.mjs artifact --stage=build-plan
   --project=<project> --task=<task> --name=tasks.md
   --input=$TMP_DIR/draft-tasks.md`.
2. After review is finished and without changing either artifact, create each
   official receipt once:
   `node scripts/stage-runtime.mjs receipt --stage=build-plan
   --project=<project> --task=<task> --component=plan
   --input=$TMP_DIR/plan-receipt.json` and
   `node scripts/stage-runtime.mjs receipt --stage=build-plan
   --project=<project> --task=<task> --component=tasks
   --input=$TMP_DIR/tasks-receipt.json`.
   Each input shape is exactly `{"content":"<exact final markdown>"}`.
3. Create `$TMP_DIR/run.json` with exactly:
   `{"receipts":{"plan":"receipts/plan.json","tasks":"receipts/tasks.json","review":"<canonical review result-or-unavailable-attempt ref>"}}`.
   When an ordinary post-review edit is covered by the canonical same-flow
   resolution, add `"review_resolution":"reviews/resolutions/<sha256>.json"`.
   A structural follow-up instead supplies its current full result as `review`.
   The runtime rejects a stale or cross-flow result/resolution.
4. Publish the attempt:
   `node scripts/stage-runtime.mjs run --stage=build-plan
   --project=<project> --task=<task> --input=$TMP_DIR/run.json`.
5. After `run` consumes the final input, let the host reclaim `$TMP_DIR`
   through its normal OS temporary lifecycle. Never treat the temporary path as
   a stage artifact, evidence ref, or handoff item.
6. Record the human decision using the returned attempt ref:
   `node scripts/stage-runtime.mjs confirm --stage=build-plan
   --project=<project> --task=<task> --attempt=<attempt-ref>
   --decision=accepted|rejected`.
7. Only for an accepted decision, pass the returned confirmation ref:
   `node scripts/stage-runtime.mjs accept --stage=build-plan
   --project=<project> --task=<task> --attempt=<attempt-ref>
   --human-confirmation-ref=<confirmation-ref>`.

Temporary files may be authoring inputs, but are never the reviewed artifacts
by themselves. Do not create official receipts before review is finished.

Declared runtime components: `spec-research`, `spec-plan`, `spec-tasks`,
`wh-review`, and the review lenses declared by the manifest.
`simplicity-guard` is provider-visible only inside `wh-review`; it is not a
planning step.

## Named artifacts

- Reads: `spec.md`.
- Writes: `plan.md` and `tasks.md` only.
- In-memory planning material: research notes and extracted data contracts;
  neither is a standalone artifact.
- Stage record: append-only build-plan attempt through TaskKernel.

## Procedure

1. Validate context and read the current `spec.md`. Historical accepted
   build-spec facts remain audit context.
2. Author the live `plan.md` and `tasks.md` directly. A receipt, checkpoint, or
   old accepted result never freezes their content.
3. Give `spec-research` frozen spec content. Keep its result in memory; do not
   create `research.md`. Extracted data contracts remain in memory and are
   incorporated into `plan.md` when relevant; do not create a separate contract
   artifact. Present one host-visible research brief with the conclusions that
   materially shape the plan and what they change.
4. Create the draft plan by giving `spec-plan` frozen spec/research content and
   the `plan.md` writer.
5. Create the draft task list by giving `spec-tasks` frozen spec/plan content
   and the `tasks.md` writer. Present one draft brief covering phases, major
   dependencies, testing/review approach, delivery boundary, and next check.
   Run the deterministic plan/task validator over the exact named-artifact
   bytes. It must report complete Phase rows, task rows, executable
   command/oracle checks, an acyclic dependency graph, and full bidirectional
   FR/AC coverage. Publish those facts through the controlled content writer as
   `plan-task-contract.v2`, bound to exact `spec.md`, `plan.md`, and `tasks.md`
   ReferenceBindings. Each task card must expose its authoritative v2 fields;
   legacy v1 facts remain read-only compatibility input. Any structural error
   stops before review; a provider cannot override it.
6. Run one initial full review over the frozen complete `spec.md`, `plan.md`,
   `tasks.md`, and matching `plan-task-contract.v2` facts. `spec-analyze` and
   `plan-eng-review` are provider-visible lenses loaded only by `wh-review`, not
   separate planning or verdict steps. Components do not locate files
   themselves. Present one review brief for the effective result. It lists
   findings and one disposition for each: `fixed`, `rejected_invalid`,
   `accepted_risk`, or `unverified` when no bound response ledger exists; it is
   review evidence, not a synthetic stage pass.
7. If a finding changes either draft, first republish both exact artifacts and
   regenerate the deterministic contract facts. TaskKernel classifies the
   change inside the same authenticated review flow:

   - an ordinary edit uses a verified delta/resolution and makes zero provider
     calls;
   - a material structural change may append at most one fresh full review;
   - unchanged snapshot/material reuses the existing result with zero provider
     calls.

   A stale contract, uncovered delta, or cross-flow resolution stops before
   provider dispatch. A second structural full request stops before provider
   dispatch. Do not loop reviews
   to manufacture a pass. If the one structural follow-up leaves a material
   actionable finding, report the blocker and its completion condition.
8. After the review sequence finishes, without changing either artifact, create
   one final create-only receipt for `plan.md` and one for `tasks.md`. The normal path must not use a revision receipt
   or create official receipts from drafts. Publish the append-only
   stage attempt with requirement mapping, research status, review facts, and
   missing items. When review is unavailable, pass its canonical attempt ref so
   the runtime records the failure reason and provenance; never describe it as
   a pass or invent a result.
9. Present the plan summary and record the decision with `confirm`. It must
   summarize both the accepted specification (what, non-goals, acceptance) and
   the implementation plan (phases, dependencies, tests, reviews, risks, and
   expected impact). Only an accepted confirmation may be passed to `accept`,
   which creates the build-plan checkpoint and accepts the attempt. Use the
   confirmation-question contract below; do not append generic completed-work,
   next-step, or user-action sections to that question card. If an external
   review audit records accepted risk, show its affected area and rationale in
   this summary; it is visible context for the human confirmation, not an
   automatic acceptance gate.

Changing a specification, plan, or task list updates the current files in this
same task. Rerun affected deterministic checks and the bounded review on the
new snapshot, then present the updated plain-language summary and confirmation.

## Host interaction and completion handoff

Procedure actions named `ask`, `wait`, or `present` must be projected onto a
host-visible conversation surface. The invoking host owns delivery and resume;
WorkflowHub neither identifies a host user nor derives a conversation address.
Every public message uses the user's language, short Markdown headings, bullets,
and plain language a high-school student can understand. Use one card type only:

- A confirmation question card contains only current status, decision, affected
  scope, and 2–3 mutually exclusive options. Mark one recommendation with its
  reason and give each option's consequence and risk. Do not add completed-work,
  next-step, or generic user-action sections.
- A milestone card contains only current progress, 1–3 important conclusions,
  next step, and whether user action is required. Publish it for research,
  draft-plan formation, and final plan; do not stream tool activity.
- A review card contains the reviewed subject, actual providers, verdict, up to
  three important findings, intended disposition, and next step. Report actual
  duration and token usage only when supplied by formal review/runtime facts;
  otherwise state `not provided`. Do not estimate or rerun review for metrics.

Raw paths, hashes, receipt or attempt refs, runner details, shell commands, and
internal identifiers stay in formal records; public messages name only the
human-readable artifact and result. An unchanged milestone or reused review
result is not published again.
Ask and wait for the user only at the existing plan decision or when an answer
can change accepted scope. When user action is required, present the problem,
one recommended option with its reason, mutually exclusive choices, and each
choice's consequence and risk. Otherwise state `user action: none`.

Before the Stage completes, report Stage-owned component facts using
`skill-deps.yaml` as the declared baseline: every `always` component is
`executed`; every `conditional` component is either `executed` or
`trigger=false — <reason>`. Cross-check the list with formal artifacts and
canonical `wh-review` refs. Reviewer-owned lenses appear only through those
review refs and are never invoked a second time by the Stage.

The official Stage handler is the only completion-facts producer. Publish both
completion views only through `core/stage-completion-facts.mjs`: the public
surface receives its user renderer and the downstream surface receives its
system renderer. Never rebuild, enrich, or recalculate either view in the Skill.
The shared result, risks, next owner, user action, and artifact labels must stay
identical; only the system view carries formal refs, hashes, review details,
dependencies, recovery conditions, and the downstream lookup rule.

Publish the concise rendered completion handoff. Do not copy artifacts or raw logs. The
invoking host must deliver the same concise facts to its downstream handoff
surface and parent progress surface. If downstream reports invalid upstream
input, the host must return the finding and completion condition to the upstream owner
through those host-owned
surfaces; do not poll or invent a host-specific recovery mechanism.

## Metrics capability

Use `metrics/collector.mjs` through a launcher-issued capability.
The trusted launcher creates `metricsLauncherConfig` with
`createMetricsLauncherConfig(loadedConfig)`. The stage receives that capability
and calls `configForCollector(metricsLauncherConfig, { task: ctx.task, workspace: ctx.workspace })`;
it must not pass raw config or choose a metrics path.
Call `recordSkeleton` at entry and `updateOwnResult` at exit; collection remains
warn-only.

```json
{"stage":"build-plan","skill_or_stage":"build-plan"}
```

## Serious review exception

After the formal review, pause only for an authenticated `actionable`
`major|blocking` finding. Ask about one finding at a time using a plain-language
card containing the problem, evidence, consequences, affected scope, and the
mutually exclusive choices “repair first” (recommended) and “accept risk and
continue”. Wait for the real host reply and use only `accept-review-risk`.
Minor, invalid-anchor/evidence, unavailable, timeout, and adapter failures do
not open this path. The risk choice keeps the original verdict and does not
replace build-plan's normal confirmation or any structural gate.
