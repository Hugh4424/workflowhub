---
name: build-plan
description: Turn the accepted specification into an implementation plan and task list.
version: 2.0.0
---

# Build Plan

## Runtime contract

Follow `docs/contracts/task-context.md`; runtime implementation is
`core/stage-context.mjs`. Consume only the branded StageContext from
`bootstrapStage("build-plan", ...)`. Read accepted results only with
`ctx.kernel`; read and write design files only with `ctx.artifacts`.

Executable entry: `node scripts/stage-runtime.mjs run --stage=build-plan
--project=<project> --task=<task> --input=<component-receipts.json>`. Use the
`confirm --attempt=<attempt> --decision=accepted|rejected` records the human
decision. Pass its returned ref to `accept --human-confirmation-ref`; rejected
confirmations never publish checkpoint refs.

Write and revise draft `plan.md` and `tasks.md` through their named ArtifactDir
writers. The public entries are `stage-runtime.mjs artifact --stage=build-plan
--project=<project> --task=<task> --name=plan.md|tasks.md --input=<draft-file>`.
Run both before each review so the review snapshot contains the exact pair under
review. Temporary files may be authoring inputs, but are never the reviewed
artifacts by themselves. Do not create their official receipts before review is finished. After
review, create each final receipt exactly once through `stage-runtime.mjs
receipt --component=plan|tasks`, then pass them with the canonical `wh-review`
result or unavailable-attempt ref as `plan`, `tasks`, and `review`.

Declared runtime components: `spec-research`, `spec-plan`, `spec-tasks`,
`spec-analyze`, `wh-review`, and the review lenses declared by the manifest.
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
6. Run `spec-analyze`, then run the initial review over the frozen draft.
   Components do not locate files themselves.
7. If that review has actionable findings, revise both drafts as needed and run
   at most one revision review. There is no third review in this stage.
8. After the review sequence finishes, without changing either artifact, create
   one final create-only receipt for `plan.md` and one for `tasks.md`. The normal path must not use a revision receipt
   or create official receipts from drafts. Publish the append-only
   stage attempt with requirement mapping, research status, review facts, and
   missing items. When review is unavailable, pass its canonical attempt ref so
   the runtime records the failure reason and provenance; never describe it as
   a pass or invent a result.
9. Present the plan summary and record the decision with `confirm`. Only an
   accepted confirmation may be passed to `accept`, which creates the
   build-plan checkpoint and accepts the attempt. Use the gate ending from
   `docs/human-brief-template.md`.

Changing an already accepted specification requires a new task. Missing or
mismatched accepted provenance fails loud before planning.

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
