---
name: build-plan
description: Turn the accepted specification into an implementation plan and task list.
version: 2.0.0
---

# Build Plan

## Runtime contract

`core/stage-context.mjs` is the external runner implementation. Consume only the
branded StageContext from
`bootstrapStage("build-plan", ...)`. Read accepted results only with
`ctx.kernel`; read and write design files only with `ctx.artifacts`.
Never derive task identity or paths from cwd, a repository, or an issue
identifier. The launcher resolves all `scripts/`, `core/`, and `metrics/`
locators from its authenticated `runner_root`; never search for or copy those
runner files into the target repository.

Executable entry: `node scripts/stage-runtime.mjs run --stage=build-plan
--project=<project> --task=<task> --input=<component-receipts.json>`. Use the
`confirm --attempt=<attempt> --decision=accepted|rejected` records the human
decision. Pass its returned ref to `accept --human-confirmation-ref`; rejected
confirmations never publish checkpoint refs.

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

1. Validate context and read the accepted build-spec result.
2. Read `spec.md` through ArtifactDir and verify it matches the accepted
   checkpoint blob consumed by this stage.
3. Give `spec-research` frozen spec content. Keep its result in memory; do not
   create `research.md`. Extracted data contracts remain in memory and are
   incorporated into `plan.md` when relevant; do not create a separate contract
   artifact.
4. Create the draft plan by giving `spec-plan` frozen spec/research content and
   the `plan.md` writer.
5. Create the draft task list by giving `spec-tasks` frozen spec/plan content
   and the `tasks.md` writer.
6. Run the initial review over the frozen draft. `spec-analyze` is a
   provider-visible lens loaded only by `wh-review`, not a separate planning
   step. Components do not locate files themselves.
7. If the current review has actionable findings, revise the affected drafts,
   publish the changed `plan.md` and `tasks.md`, and run formal review again.
   Repeat for every changed draft until the current exact drafts have no
   unresolved actionable finding. There is no numeric review limit. Never repeat
   review for unchanged snapshot/material: `wh-review` reuses the existing
   result for that exact identity.
8. After the review sequence finishes, without changing either artifact, create
   one final create-only receipt for `plan.md` and one for `tasks.md`. The normal path must not use a revision receipt
   or create official receipts from drafts. Publish the append-only
   stage attempt with requirement mapping, research status, review facts, and
   missing items. When review is unavailable, pass its canonical attempt ref so
   the runtime records the failure reason and provenance; never describe it as
   a pass or invent a result.
9. Present the plan summary and record the decision with `confirm`. Only an
   accepted confirmation may be passed to `accept`, which creates the
   build-plan checkpoint and accepts the attempt. The plain-language summary
   has exactly four items: current status; next step and owner; whether the user
   must act; and, when action is required, the problem, a recommended option,
   and every option's consequence and risk.

Changing an already accepted specification requires a new task. Missing or
mismatched accepted provenance fails loud before planning.

## Host interaction and completion handoff

Procedure actions named `ask`, `wait`, or `present` must be projected onto a
host-visible conversation surface. The invoking host owns delivery and resume;
WorkflowHub neither identifies a host user nor derives a conversation address.
Every public message uses the user's language, short Markdown headings, and
bullets. For Chinese, start with `## **当前状态**`, then `## **下一步**`, then
`## **需要你处理吗**`. Keep each section brief and use plain language a
high-school student can understand. Raw paths, hashes, receipt or attempt refs,
runner details, shell commands, and internal identifiers stay in formal records;
the public message names only the human-readable artifact and result.
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

Publish one concise completion handoff containing the stage result, human-readable
artifact names, test and review conclusions, downstream dependencies, unresolved
risks, next owner, and user action. Do not copy artifacts or raw logs. The
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
