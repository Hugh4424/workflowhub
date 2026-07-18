---
name: build-code
description: Implement the accepted plan in the verified task worktree.
version: 2.0.0
---

# Build Code

## Runtime contract

Follow `docs/contracts/task-context.md`; runtime implementation is
`core/stage-context.mjs`. Consume only the branded StageContext from
`bootstrapStage("build-code", ...)`. All commands run with explicit
`ctx.workspace.worktreeRoot`. This execution cwd is not an identity source.
Task records use `ctx.task`/`ctx.kernel`; design files use `ctx.artifacts`.
Repository-owned subprocesses use `core/workspace-runner.mjs`, which accepts
only a branded Workspace plus argv and fixes cwd to the verified worktree.

Executable entry: `node scripts/stage-runtime.mjs run --stage=build-code
--project=<project> --task=<task> --input=<component-receipts.json>`. Build-code
is an automatic stage: the trusted runtime publishes and accepts its attempt
without a human confirmation command.

## Controlled revision after verification failure

An accepted build-code stage is closed unless the trusted runtime issued a
reopen authorization from an authenticated failed verify-code attempt. Do not
edit, replace, or delete `accepted.json`, prior attempts, or failure evidence.

1. Keep the failed verify attempt unaccepted. Its `facts.evidence_refs` must
   include an `acceptance-evidence.v1` record with `result: "fail"`.
2. Create the authorization:
   `node scripts/stage-runtime.mjs reopen --stage=build-code --project=<project> --task=<task> --verify-attempt=<attempt-0001.json> --failure-evidence=<evidence/ac-005.json>`.
3. Re-run only the original task's build-code with the returned immutable ref:
   `node scripts/stage-runtime.mjs run --stage=build-code --project=<project> --task=<task> --input=<component-receipts.json> --reopen=<results/build-code/revisions/reopen-0001.json>`.

The new attempt carries the prior accepted record and verify failure hashes.
Its acceptance is stored as `accepted-attempt-0002.json`; the former
`accepted.json` remains immutable. Reusing an authorization, a source from a
different task, a non-failure, or a non-build-code stage fails loudly.

Create implementation provenance with `stage-runtime.mjs receipt --stage=build-code --project=<project> --task=<task> --component=implementation --input=<phase-payload.json>`; HEAD/tree/diff evidence is derived by the writer.

Declared runtime components: `wh-review`, conditional `test-routing-advisor`,
conditional `diagnosing-bugs`, and conditional `review-response`.

## Inputs and outputs

- Reads: accepted make-decision and build-plan results; `spec.md`, `plan.md`,
  and `tasks.md` through ArtifactDir.
- Writes: code only inside the verified Workspace; append-only build-code
  attempt and evidence through TaskHandle/TaskKernel.
- Does not modify accepted design artifacts.

## Procedure

1. Validate context, accepted lineage, Git common directory, baseline, and
   named artifact checkpoint hashes.
2. Read design artifacts through ArtifactDir. Never search for substitutes.
3. Split work into implementation phases. Show each phase scope as a progress
   update and continue automatically. Escalate only when the requested work
   would change the accepted plan or allowed scope.
4. Invoke coding workers with frozen phase material and the explicit workspace
   root. Workers do not receive task storage information.
5. Run the target project's real test command in the Workspace. Record command,
   exit code, freshness, and output reference without turning the observation
   into an automatic quality decision.
6. Run `createPhaseDiffScan` from `diff-scanner.mjs` with the trusted Workspace
   root, phase ID, phase baseline commit, immutable implementation snapshot, and
   the plan's allowed files. Its CLI accepts repeated
   `--allowed-file=<repo-relative-path>` flags or one absolute
   `--allowed-files-json=<json-array-file>` and prints JSON to stdout. Save the
   `phase-diff-scan.v1` JSON as task-relative evidence and point the current
   `phase-result.json.diff_scan.path` at it.
7. Run independent code review with only the current `phase_id` as its scope
   selector. `wh-review` resolves the frozen commit pair from the current diff
   scan and regenerates the complete phase diff. Do not pass paths, commits,
   ranges, or a caller-built diff. Address actionable revisions in a new phase
   attempt; do not overwrite evidence. If the independent review capability is
   unavailable, publish the diagnostic and stop as blocked; do not turn missing
   capability into a human confirmation prompt.
   `simplicity-guard` is provider-visible only inside `wh-review`; the build-code
   generator and implementation workers never invoke it. Its lens may reject
   concrete scope creep or speculative code in the current diff, but it may not
   reopen accepted product scope.
8. Publish a build-code attempt containing baseline/head commits, changed
   files, fresh test command, test facts, review facts, and missing items.
9. Present the automatic-progress brief from `docs/human-brief-template.md`.
   The trusted runtime immediately runs `accept --attempt=<attempt>` without a
   confirmation and advances to verify-code.

No task identifier, issue identifier, branch name, or shell location may select
the project or task. Missing accepted inputs stop before implementation.
WorkspaceRunner sets the authenticated starting cwd for repository-owned test
and diff commands; it is not a sandbox and does not prevent an invoked command
from changing directory. It cannot constrain a host coding worker's own shell; that external boundary
receives the explicit workspace root and its output is accepted only through
workspace-bound diff, test, and review evidence.

## Metrics capability

Use `metrics/collector.mjs` through a launcher-issued capability.
The trusted launcher creates `metricsLauncherConfig` with
`createMetricsLauncherConfig(loadedConfig)`. The stage receives that capability
and calls `configForCollector(metricsLauncherConfig, { task: ctx.task, workspace: ctx.workspace })`;
it must not pass raw config or choose a metrics path.
Call `recordSkeleton` at entry and `updateOwnResult` at exit; collection remains
warn-only.

```json
{"stage":"build-code","skill_or_stage":"build-code"}
```
