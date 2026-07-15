---
name: make-decision
description: Clarify direction, create the task workspace, and publish the first accepted stage result.
version: 2.0.0
---

# Make Decision

## Runtime contract

Follow `docs/contracts/task-context.md`; runtime implementation is
`core/stage-context.mjs`. The launcher calls
`bootstrapStage("make-decision", ...)` before Step 1 and supplies one branded
`StageContext`. This stage uses only `ctx.task`, `ctx.kernel`, `ctx.identity`, and
`ctx.manifest`. Workspace and ArtifactDir must be absent.

Executable entry: `node scripts/stage-runtime.mjs run --stage=make-decision
--project=<project> --task=<task> --worktree-root=<absolute-worktree>
--baseline-commit=<oid> --input=<component-receipts.json>`. Acceptance is
a separate `accept` invocation with `--attempt` and
`--human-confirmation-ref`. First record the decision with
`confirm --attempt=<attempt> --decision=accepted|rejected`, then pass its
returned ref to `accept`; execution never accepts its own result.

Create the decision input first with `stage-runtime.mjs receipt --stage=make-decision --project=<project> --task=<task> --component=decision --input=<content-payload.json>` and pass only the returned ref.

The stage and every component must not discover identity from the shell, Git,
an issue number, a branch, or directory scanning. Components receive frozen
material or controlled TaskHandle callbacks. Missing context is a fail-loud
entry error.

Declared runtime components: `talk-with-zhipeng`, `grill-with-docs`,
`decision-log`, `intake-decision-review`, `wh-review`, conditional `anysearch`,
conditional `debate`, and the review lenses declared by the manifest.

## Inputs and outputs

- Input: original requirement and `ctx.manifest`.
- Reads accepted stages: none.
- Writes: append-only make-decision attempt through TaskKernel.
- Accepted facts: `worktree_root`, `baseline_commit`, decision, scope, risks.
- Product artifacts: none.

## Procedure

1. Validate the StageContext and immutable task identity.
2. Use `talk-with-zhipeng` and `grill-with-docs` on supplied material only.
3. Record the structured decision through the TaskHandle; do not invent a
   filesystem destination in the component.
4. If research is explicitly approved, invoke `anysearch` with a frozen packet.
5. Create or validate one Git worktree for `ctx.manifest.target_repo_root`.
   Record its absolute root and baseline commit in the attempt facts.
6. Run independent direction review through `wh-review`; its sidecar receives
   the absolute task path and expected identity from the parent.
7. Present decision, scope, risks, review facts, worktree, and baseline to the
   user. Record the explicit decision with `confirm`; only an accepted
   confirmation ref may be passed to `accept`.

Quality facts are recorded, not converted into automatic quality gates.
Contradictory identity, missing physical workspace facts, or an invalid context
are entry-integrity failures and stop before stage work.

## Metrics capability

Use `metrics/collector.mjs` through a launcher-issued capability.
The trusted launcher creates `metricsLauncherConfig` with
`createMetricsLauncherConfig(loadedConfig)`. The stage receives that capability
and calls `configForCollector(metricsLauncherConfig, { task: ctx.task })`; it must
not pass raw config or choose a metrics path.
Call `recordSkeleton` at entry and `updateOwnResult` at exit; write failures only
surface warnings.

```json
{"stage":"make-decision","skill_or_stage":"make-decision"}
```
