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

When invoking `wh-review`, pass `materials.acceptance_evidence` as structured
canonical roots, never as prose or Markdown path references:

```json
{
  "summary": "Fresh verification evidence and acceptance results.",
  "test_receipt_ref": "receipts/verify-tests.json",
  "test_receipt_hash": "<sha256 returned by the canonical test writer>",
  "evidence_ref": "evidence/verify-evidence.json",
  "evidence_hash": "<sha256 returned by the canonical evidence writer>"
}
```

Use only writer-returned refs and hashes; do not guess them or copy hashes from
display text. The review bundle recursively freezes and verifies both roots and
their referenced closure before provider delivery. Report test totals from the
canonical test output. If parameterized or unchanged tests make a static
`test()` source count differ, explain the difference instead of treating that
source count as executed evidence.

Declared runtime components: `test-strategy`, `wh-review`, conditional
`isolated-browser-qa`, and the review lenses declared by the manifest.

## Inputs and outputs

- Reads: accepted build-code result and the named design artifacts it cites.
- Writes: evidence, reviews, append-only verify-code attempt, and confirmed
  close operation records through controlled task capabilities.
- Product code is read-only during verification. A required fix returns to a
  new build-code attempt.

When an acceptance criterion fails, publish the verify-code attempt and retain
the exact `acceptance-evidence.v1` reference whose `result` is `fail`; do not
accept that failed verification attempt. The only repair handoff is the
controlled build-code reopen command documented in `workflows/build-code/SKILL.md`.
It binds this attempt and evidence hash to the old build-code acceptance, then
permits one append-only replacement attempt. A failed verdict never authorizes
close operations.

After that replacement build is accepted, run verify-code again from its new
accepted snapshot, tests, and review. If a canonical component receipt already
exists from the prior accepted verification, only this controlled fresh-verify
path may use `receipt --revision=true --recover=<previous-receipt-ref>`.
Normal verify-code remains create-only and never reuses an old test or review
verdict.

If verify-code is already accepted but current Workspace evidence exposes a
lineage failure, do not edit or bypass its accepted record. First write the new
canonical `acceptance-evidence.v1` failure, then use
`node scripts/stage-runtime.mjs publish-verify-failure --stage=verify-code
--project=<project> --task=<task> --failure-evidence=<evidence/ref.json>`.
The kernel binds the existing accepted verify result, the active build-code
acceptance, the evidence hash, and the current Workspace snapshot into one new,
unaccepted verify attempt. It rejects duplicate publication, changed bindings,
non-failure evidence, and Workspace drift during publication. Use that returned
attempt only for the controlled build-code reopen; never accept it.

## Procedure

1. Validate StageContext and read the accepted build-code result through
   `ctx.kernel.readAccepted("build-code")`.
2. Read only the accepted build-code facts and `evidence_refs` from its
   authenticated accepted attempt. Resolve formal artifacts, dependencies, and
   unresolved risks from those existing records; the human brief is display,
   not a handoff API. For every accepted AC, consume its `covered`, `missing`,
   or `unknown` row from the referenced evidence; never silently turn `missing`
   or `unknown` into a pass.
3. Take the fresh test command only from accepted build-code facts. Missing
   command is a fail-loud lineage error; never reuse an older command.
4. Run tests in the explicit Workspace and record command, exit code, output,
   commit, and timestamp.
5. For UI scope, invoke `isolated-browser-qa` with the explicit workspace and
   frozen acceptance material. It must report tool, login-state reuse, and
   cleanup completion.
6. Run independent verification review from frozen diff/test packets.
7. Publish an append-only verify-code attempt with all facts and unresolved
   items. Present the gate brief from `docs/human-brief-template.md`; record the
   verification-stage decision with `confirm`, and pass only its accepted ref to
   `accept`. This confirmation accepts verification facts only.
8. After verify-code is accepted, run `scripts/task-close.mjs prepare` with the
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
   If `prepare` rejects the recorded target because it is not the real checked-out
   target branch, do not edit `task.json`. Use the official
   `node scripts/task-migrate-target-repo.mjs --project=<project> --task=<task>
   --target-repo-root=<main-checkout> --target-branch=<branch>` entrypoint. It
   requires the same Git common directory as the accepted workspace, records
   immutable migration lineage, atomically updates the target identity, and must
   finish before a fresh `prepare` run.
9. Record that one decision with `scripts/task-close.mjs confirm`. Only a
   `confirmed` result authorizes all six plan-bound actions; rejection or timeout
   performs none of them. Do not ask again before each command.
10. Run `scripts/task-close.mjs execute` with the plan hash and close confirmation
   ref. The controlled executor rechecks the target checkout, clean state, and
   frozen local/remote baselines before its first Git write, then performs the
   fixed six actions in order. It uses `--no-ff --no-edit` merge and a non-force
   push, stops at the first failure, and reconciles already completed physical
   actions on retry. Do not issue the six Git operations by hand.
11. Run `scripts/task-close.mjs status` with the same explicit identity and plan
    hash. It reads live local and remote facts and reports completed and missing
    actions. Only `record_status: completed` together with physical
    `status: ready` permits reporting close complete. Never infer a task path
    during recovery.

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
