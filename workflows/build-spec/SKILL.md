---
name: build-spec
description: Produce and review the feature specification in the task worktree.
version: 2.0.0
---

# Build Spec

## Runtime contract

Follow `docs/contracts/task-context.md`; runtime implementation is
`core/stage-context.mjs`. Consume only
`bootstrapStage("build-spec", ...)` output. Required capabilities:
`ctx.task`, `ctx.kernel`, `ctx.workspace`, and `ctx.artifacts`.

Executable entry: `node scripts/stage-runtime.mjs run --stage=build-spec
--project=<project> --task=<task> --input=<component-receipts.json>`. Build-spec
is an automatic stage: the trusted runtime publishes the attempt, materializes
its checkpoint, and accepts it without a human confirmation command.

The loaded Skill is the authoritative contract. Do not search the target
repository for another Skill file. Its repository source is the current file
declared under the `workflows/` root by `config/workflowhub.yaml`; the target
repository's `skills/` directory is never an entry.
`stage-runtime.mjs` has no `--help` command. Build-spec must not call `prepare`,
`confirm`, or a separate `accept`, and must never pass `--runner-root`.

Create an OS temporary directory first:
`TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/workflowhub-build-spec.XXXXXX")"`.
Every caller-owned draft, receipt payload, run input, or review request must
stay under `$TMP_DIR`, never in the target base repository or CandidateWorkspace.
The `artifact` command below is the only route that copies the reviewed draft
into the CandidateWorkspace; canonical receipts remain owned by TaskKernel.

Use this complete public sequence without inventing flags or input shapes:

1. Before each review, publish the exact draft under review:
   `node scripts/stage-runtime.mjs artifact --stage=build-spec
   --project=<project> --task=<task> --name=spec.md
   --input=$TMP_DIR/draft-spec.md`.
2. After review is finished and without changing `spec.md`, create the official
   receipt once:
   `node scripts/stage-runtime.mjs receipt --stage=build-spec
   --project=<project> --task=<task> --component=spec
   --input=$TMP_DIR/spec-receipt.json`.
   The input shape is exactly
   `{"content":"<exact final spec markdown>"}`.
3. Create `$TMP_DIR/run.json` with exactly:
   `{"receipts":{"spec":"receipts/spec.json","review":"<canonical review result-or-unavailable-attempt ref>"}}`.
4. Publish and automatically accept the stage:
   `node scripts/stage-runtime.mjs run --stage=build-spec
   --project=<project> --task=<task> --input=$TMP_DIR/run.json`.
5. After `run` consumes the final input, let the host reclaim `$TMP_DIR`
   through its normal OS temporary lifecycle. Never treat the temporary path as
   a stage artifact, evidence ref, or handoff item.

A temporary file may be authoring input, but it is never the reviewed artifact
by itself. Do not create the official spec receipt before review is finished.

The accepted make-decision result is read only through `ctx.kernel`. Design
files are accessed only through ArtifactDir. Components receive the content of
named artifacts or controlled read/write callbacks; they never receive a root,
task identifier, or authority to derive paths.

Declared runtime components: `spec-specify`, `spec-clarify`, `wh-review`, and
the conditional review lenses declared by the manifest. `simplicity-guard` is
provider-visible only inside `wh-review`; it is not a spec generation step.

## Named artifacts

- Reads: accepted make-decision facts.
- Writes: `ctx.artifacts.writeAtomic("spec.md", text)`.
- Optional evidence: named files explicitly supplied by the parent.
- Stage record: append-only build-spec attempt through TaskKernel.

## Procedure

1. Validate StageContext before invoking a component.
2. Read accepted decision/scope from `ctx.kernel.readAccepted("make-decision")`.
3. Create the draft by invoking `spec-specify` with decision material and a
   controlled writer for `spec.md`.
4. Invoke `spec-clarify` with the current `spec.md` content and the same named
   writer when clarification is needed.
5. Apply the constitutional checklist. Record findings; do not silently rewrite
   scope.
6. Run the initial review using a frozen packet built from `spec.md`, decision
   facts, and relevant evidence.
7. If that review has actionable findings, revise the draft once and run at most one revision review.
   There is no third review in this stage.
8. After the review sequence finishes, without changing `spec.md`, create one final create-only receipt
   from its exact content. The normal path must not use a revision receipt
   or create an official receipt from a draft. Publish the append-only stage
   attempt with the review facts and missing items. When review is unavailable,
   pass its canonical attempt ref so the runtime records the failure reason and
   provenance; never describe it as a pass or invent a result.
9. Present the progress brief from `docs/human-brief-template.md`. The trusted
   runtime immediately runs `accept --attempt=<attempt>` without a confirmation,
   creates the checkpoint, and accepts the attempt.
   Checkpoint failure is an integrity error; quality facts never become a gate.

No component may use shell location, repository discovery, or ad-hoc product
paths. A missing named artifact fails with its ArtifactDir error.

## Metrics capability

Use `metrics/collector.mjs` through a launcher-issued capability.
The trusted launcher creates `metricsLauncherConfig` with
`createMetricsLauncherConfig(loadedConfig)`. The stage receives that capability
and calls `configForCollector(metricsLauncherConfig, { task: ctx.task, workspace: ctx.workspace })`;
it must not pass raw config or choose a metrics path.
Call `recordSkeleton` at entry and `updateOwnResult` at exit; collection remains
warn-only.

```json
{"stage":"build-spec","skill_or_stage":"build-spec"}
```
