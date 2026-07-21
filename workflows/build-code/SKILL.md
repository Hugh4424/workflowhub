---
name: build-code
description: Implement the accepted plan in the verified task worktree.
version: 2.0.0
---

# Build Code

## Runtime contract

`core/stage-context.mjs` is the external runner implementation. Consume only the
branded StageContext from
`bootstrapStage("build-code", ...)`. All commands run with explicit
`ctx.workspace.worktreeRoot`. This execution cwd is not an identity source.
Task records use `ctx.task`/`ctx.kernel`; design files use `ctx.artifacts`.
Repository-owned subprocesses use `core/workspace-runner.mjs`, which accepts
only a branded Workspace plus argv and fixes cwd to the verified worktree.
Never derive task identity or paths from cwd, a repository, or an issue
identifier. The launcher resolves all `scripts/`, `core/`, and `metrics/`
locators from its authenticated `runner_root`; never search for or copy those
runner files into the target repository.

Executable entry: `node scripts/stage-runtime.mjs run --stage=build-code
--project=<project> --task=<task> --input=<component-receipts.json>`. Build-code
is an automatic stage: the trusted runtime publishes and accepts its attempt
without a human confirmation command.

The loaded Skill is the authoritative contract. Do not search the target
repository for another Skill file. The target repository's `skills/` directory
is never an entry. `stage-runtime.mjs` has no `--help` command. Build-code must
not call `prepare`, `confirm`, or a separate `accept`, and must never pass
`--runner-root`.

Create an OS temporary directory first:
`TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/workflowhub-build-code.XXXXXX")"`.
Every caller-owned receipt payload, test-capture input, run input, or review
request must stay under `$TMP_DIR`, never in the target base repository or
accepted Workspace. Product code changes belong only in the authenticated
Workspace; canonical receipts and evidence remain owned by TaskKernel.

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
   If a canonical component receipt already exists from the accepted build,
   this controlled re-run uses the existing `receipt --revision=true
   --recover=<previous-receipt-ref>` path.

The new attempt carries the prior accepted record and verify failure hashes.
The runtime preserves the former canonical bytes as `accepted-attempt-<n>.json`
and atomically updates canonical `accepted.json` to the revised attempt.
Consumers always read only `accepted.json`; archives and reopen records are
lineage evidence, never input side channels. Reusing an authorization, a source
from a different task, a non-failure, or a non-build-code stage fails loudly.

Create implementation provenance with
`node scripts/stage-runtime.mjs receipt --stage=build-code
--project=<project> --task=<task> --component=implementation
--input=$TMP_DIR/implementation.json`; HEAD/tree/diff evidence is derived by the writer.
Before build-code is accepted, a same-Phase repair after a failed pre-review
check or review finding must preserve the old receipt and publish the repaired
snapshot with `--revision=true --recover=<latest-implementation-receipt-ref>`.
Capture repaired tests under new receipt/output refs and pass those new refs to
the next review and stage run. If a Phase or final full-worktree review returns
`revise_required`, repair the same original Phase that owns the finding,
publish a revision receipt, capture fresh tests under new refs, and repeat the
affected Phase review before the final full-worktree review. This is
append-only repair of the current open stage; it
does not require or create a verify-code reopen authorization. After build-code
is accepted, only the controlled verification-failure path above may create
another build-code attempt.
For a normal completed build, use the smallest valid payload:
`{"phase_completion":true}`. A structured value is allowed only as
`{"phase_completion":{"status":"<non-empty>","evidence_ref":"<task-relative-ref>"}}`.
Keep Phase lists and the AC table in the existing test evidence and human brief;
do not put them inside `phase_completion`. The receipt command validates this
shape before publishing any create-only receipt or diff evidence.

Create the canonical build test receipt only through:
`node scripts/stage-runtime.mjs capture-tests --stage=build-code
--project=<project> --task=<task> --input=$TMP_DIR/test-capture.json`.
The input contains only `command`, `receipt_ref`, and optional `output_ref`, for
example `{"command":"npm test","receipt_ref":"receipts/build-tests.json","output_ref":"evidence/build-tests.output"}`.
Use fresh task-relative refs for a controlled rework attempt. Do not pass
`component=tests`, call internal receipt writers, or guess another component
name; `capture-tests` is the single public producer for build-code test facts.

After every Phase has passed its Phase review, and the final implementation
receipt and fresh test receipt exist, run one final independent code review
using those fresh tests: one full-worktree `wh-review` without `phase_id`. This
final review is separate from the required per-Phase reviews. The review host
freezes the authenticated Workspace itself; do not supply paths, commits,
ranges, or a caller-built diff.
The canonical implementation receipt, canonical tests receipt, and final review
must all bind the same snapshot tree. A mismatch fails before the build-code
attempt is published.

After review, create `$TMP_DIR/run.json` with exactly:
`{"receipts":{"implementation":"<final implementation receipt ref>","tests":"<final fresh test receipt ref>","review":"<canonical review result-or-unavailable-attempt ref>"}}`.
For the normal path, the default final refs are `receipts/implementation.json` and `receipts/build-tests.json`.
For a pre-accept revision, use the latest implementation revision receipt ref and newest fresh test receipt ref produced for that repaired snapshot; never fall back to the initial refs.
Publish and automatically accept the stage with
`node scripts/stage-runtime.mjs run --stage=build-code
--project=<project> --task=<task> --input=$TMP_DIR/run.json`.
After `run` consumes the final input, let the host reclaim `$TMP_DIR` through
its normal OS temporary lifecycle. Never treat the temporary path as a stage
artifact, evidence ref, or handoff item.

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
4. Give the Coder one complete **Coder Phase card** for each Phase, in this
   order: goal, accepted AC IDs, authenticated Workspace root, allowed files
   allowlist, non-goals, exact test commands, and upstream findings.
   Do not create or bind a Coder or Phase Skill. Invoke the Coder with this
   frozen card and no task-storage information.
   When applicable, the Coder must produce RED, then minimal GREEN, then run
   focused tests and necessary regression, and return a scoped diff. Code
   Builder performs a read-only Workspace diff check against the Phase card's
   allowed files before publishing the Phase evidence.
   Coder must return the exact test command and raw output. Code Builder writes
   the canonical evidence refs.
   The card's Workspace root must be copied from the accepted make-decision
   record. Never substitute the target repository root, current checkout, or
   current shell directory. The Coder must return its completion evidence to
   the Code Builder before the Phase is marked complete; a missing handoff is
   recoverable in the same Phase and is not a product decision.
   Coder must not commit; Coder must not review; Coder must not accept.
   Coder must not merge; Coder must not push; Coder must not close.
5. Run the target project's real test command in the Workspace through the
   public `capture-tests` entry above. It records command, exit code, freshness,
   and output reference without turning the observation into an automatic
   quality decision.
6. For each Coder handoff, compare the Workspace's changed paths with that
   original Phase card's allowed files. If the diff crosses the card boundary,
   return it to the same Phase for correction. Then run `createPhaseDiffScan`
   from `diff-scanner.mjs` with the trusted Workspace root, Phase ID, previous
   Phase baseline commit, immutable implementation snapshot, and the Phase
   card's allowed files. Save the `phase-diff-scan.v1` JSON as task-relative
   evidence and point the current `phase-result.json.diff_scan.path` at it.
7. Before review, use the fixed table `| AC | status | refs | reason |`. Give
   each accepted AC exactly one row with status `covered`, `missing`, or
   `unknown`. `covered` requires authenticated canonical refs. `missing` or
   `unknown` may use `无` for refs but must include a reason.
   Any omitted AC is `missing` or `unknown`, never `covered`. Put the same table in
   existing test evidence and the human brief; do not add a receipt producer or
   schema for it. Derive the review baseline only from the authenticated Workspace;
   never infer it from a comment or cwd. Actual Agent adherence is
   verified by the Phase 7 Canary, not inferred from this text contract alone.
8. Run independent Phase review with only the current `phase_id` as its scope
   selector. `wh-review` resolves the frozen commit pair from the current diff
   scan and regenerates the complete Phase diff. Do not pass paths, commits,
   ranges, or a caller-built diff. A Phase must pass before the next Phase may
   start. On `revise_required`, repair the same Phase, publish append-only
   implementation and test evidence, regenerate that Phase's diff evidence,
   and review it again. Do not create a replacement Phase or overwrite
   evidence. If the independent review capability is unavailable,
   publish the diagnostic and stop as blocked; do not turn missing capability
   into a human confirmation prompt.
   `simplicity-guard` is provider-visible only inside `wh-review`; the build-code
   generator and implementation workers never invoke it. Its lens may reject
   concrete scope creep or speculative code in the current diff, but it may not
   reopen accepted product scope.
9. After all Phase reviews pass, run the final full-worktree review described
   above. Only this `subject_kind=worktree` result may be passed as the final
   build-code review receipt; a Phase result is local Phase-gate evidence only.
10. Publish a build-code attempt containing baseline/head commits, changed
   files, fresh test command, test facts, review facts, and missing items.
11. Present a plain-language automatic-progress brief with exactly four items:
    current status; next step and owner; whether the user must act; and, only
    when action is required, the problem, a recommended option, and every
    option's consequence and risk. Its concise handoff points downstream to the
    formal artifacts and evidence refs; it does not copy their full text or logs.
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
