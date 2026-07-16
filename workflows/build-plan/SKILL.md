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

Create `plan` and `tasks` through `stage-runtime.mjs receipt` with fixed `--component=plan|tasks`; pass those refs plus the canonical `wh-review` result ref as `plan`, `tasks`, and `review`. Missing review evidence stops the official run.

Declared runtime components: `spec-research`, `simplicity-guard`, `spec-plan`,
`spec-tasks`, `spec-analyze`, `wh-review`, and the review lenses declared by the
manifest.

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
4. Give `spec-plan` frozen spec/research content and the `plan.md` writer.
5. Give `spec-tasks` frozen spec/plan content and the `tasks.md` writer.
6. Run `spec-analyze`, simplicity review, and independent engineering review
   over frozen content. Components do not locate files themselves.
7. Publish an attempt with artifact hashes, requirement mapping, research
   status, review facts, and missing items.
8. Present the plan summary and record the decision with `confirm`. Only an
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
