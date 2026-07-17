---
name: verify-code
description: Independently verify the accepted implementation and perform confirmed close operations.
version: 2.0.0
---

# Verify Code

## Runtime contract

Follow `docs/contracts/task-context.md`; runtime implementation is
`core/stage-context.mjs`. Consume only
`bootstrapStage("verify-code", ...)`. Task records use the branded TaskHandle
and TaskKernel. Product artifacts use ArtifactDir. Test and Git commands run
only in `ctx.workspace.worktreeRoot` supplied by the accepted decision.

Executable entry: `node scripts/stage-runtime.mjs run --stage=verify-code
--project=<project> --task=<task> --input=<component-receipts.json>`. Use the
`confirm --attempt=<attempt> --decision=accepted|rejected` records the human
decision. Pass its returned ref to `accept --human-confirmation-ref`.

Create the evidence aggregate with `stage-runtime.mjs receipt --stage=verify-code --project=<project> --task=<task> --component=evidence --input=<refs-payload.json>`; every referenced hash is verified first.

Declared runtime components: `test-strategy`, `wh-review`, conditional
`isolated-browser-qa`, and the review lenses declared by the manifest.

## Inputs and outputs

- Reads: accepted build-code result and the named design artifacts it cites.
- Writes: evidence, reviews, append-only verify-code attempt, and confirmed
  close operation records through controlled task capabilities.
- Product code is read-only during verification. A required fix returns to a
  new build-code attempt.

## Procedure

1. Validate StageContext and read the accepted build-code result through
   `ctx.kernel.readAccepted("build-code")`.
2. Take the fresh test command only from accepted build-code facts. Missing
   command is a fail-loud lineage error; never reuse an older command.
3. Run tests in the explicit Workspace and record command, exit code, output,
   commit, and timestamp.
4. For UI scope, invoke `isolated-browser-qa` with the explicit workspace and
   frozen acceptance material. It must report tool, login-state reuse, and
   cleanup completion.
5. Run independent verification review from frozen diff/test packets.
6. Publish an append-only verify-code attempt with all facts and unresolved
   items. Present the gate brief from `docs/human-brief-template.md`; record the
   verification-stage decision with `confirm`, and pass only its accepted ref to
   `accept`. This confirmation accepts verification facts only.
7. After verify-code is accepted, run `scripts/task-close.mjs prepare` with the
   explicit task path and identity, task branch, target branch, remote, task
   snapshot commit from the accepted verification facts, accepted spec path,
   and archive path. `prepare` accepts the still-uncommitted worktree only when
   its freshly captured tree exactly matches that snapshot commit and the
   snapshot parent is the current task-branch tip. The frozen plan contains exactly
   six actions: commit delivery, archive and commit the spec, merge the task
   branch from the main checkout, push the target branch, remove the task
   worktree, and remove the merged local task branch. Show the full hashed close plan
   for one separate close authorization bound to the plan hash.
   Never reuse the verify-code confirmation ref.
8. Record that one decision with `scripts/task-close.mjs confirm`. Only a
   `confirmed` result authorizes all six plan-bound actions; rejection or timeout
   performs none of them. Do not ask again before each command.
9. The Code Verifier performs the Git writes, stopping at the first failure and
   resuming from current Git facts. Immediately before the first write, rerun
   `prepare` and require the same plan hash. Publish the already verified commit
   without changing worktree bytes by atomically updating the task branch from
   the plan-bound parent to `task_commit`, then run `git reset --mixed
   <task_commit>` in the task worktree and require a clean status. Next, `git mv`
   the spec to the planned archive path and commit it; merge the task branch into
   the target branch from the main checkout; push the target branch; remove the
   task worktree; then delete the merged local task branch. Immediately before
   completion, run `git fetch <remote> <target-branch>` in the main checkout.
10. Run `scripts/task-close.mjs complete` with the plan hash and close
    confirmation ref. WorkflowHub performs no Git writes and does not fetch; it
    reads the live remote with `git ls-remote` and verifies the task commit and
    archive commit are in the local target branch, local and remote target OIDs
    match, the archive path exists while the source path does not, and both the
    worktree and local task branch are absent. Any false fact fails loudly and
    leaves recovery state intact. Use `status` to show completed and missing
    physical actions; only a `task-close-completed.v1` result permits reporting
    close complete. Never infer a task path during recovery.

Quality failures remain visible facts. Identity, lineage, hash, and capability
failures stop before verification because continuing would inspect another task.

## Metrics capability

Use `metrics/collector.mjs` through a launcher-issued capability.
The trusted launcher creates `metricsLauncherConfig` with
`createMetricsLauncherConfig(loadedConfig)`. The stage receives that capability
and calls `configForCollector(metricsLauncherConfig, { task: ctx.task, workspace: ctx.workspace })`;
it must not pass raw config or choose a metrics path.
Call `recordSkeleton` at entry and `updateOwnResult` at exit; collection remains
warn-only.

```json
{"stage":"verify-code","skill_or_stage":"verify-code"}
```
