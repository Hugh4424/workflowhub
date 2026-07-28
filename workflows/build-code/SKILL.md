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
Never derive task identity or paths from cwd, a repository, or an external
tracker identifier. The launcher resolves all `scripts/`, `core/`, and `metrics/`
locators from the launcher-owned runtime; available runner Git facts are audit
metadata only. Runner branch, dirty state, and old runner migration history
never decide the stage result. Never search for or copy runner files into the
target repository.

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
Before build-code is accepted, a same-Phase repair after a failed structural
check must preserve the old receipt and publish the repaired snapshot with
`--revision=true --recover=<latest-implementation-receipt-ref>`.
Capture repaired tests under new receipt/output refs and pass those new refs to
the next review and stage run. A Phase or final integration
`revise_required` verdict remains the original quality fact; it does not by
itself become a stage-pass gate or get rewritten to `pass`. This is append-only
repair of the current open stage; it
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
For one task, only one formal capture may run at a time. A second identical
capture waits for and reuses the same-snapshot receipt when the first has
completed. Never start the complete test command directly beside a formal
capture. Focused Phase commands remain intermediate evidence only.
The final build-code test receipt must capture the complete test command
required by the accepted plan, using that repository's low-memory configuration
when available. For
WorkflowHub itself, `npm test` uses the repository Vitest configuration;
verify-code reuses the final command and must not receive a Phase-only command.

After every Phase has complete structural evidence and an authenticated Phase
review fact, and the final implementation
receipt and fresh complete test receipt exist, run one final independent **integration**
review: `wh-review` without `phase_id`. The runner derives
`review_scope=integration`; callers never supply it, paths, commits, ranges, or
a caller-built diff. Before any independent review call, it reconstructs one unique,
continuous formal semantic-review Phase-trace chain from the accepted build-plan checkpoint
to the final tree, validates final test and AC trace identity, and builds only
the integration packet. Missing/branched/stale traces, zero-Phase work, legacy
unscoped final results, or missing AC/seam facts fail `MATERIAL_INCOMPLETE`;
they never fall back to a full history or cumulative diff. The canonical
implementation receipt, canonical tests receipt, and final integration result
must all bind the same snapshot tree. A mismatch fails before the build-code
attempt is published.
The final integration packet also carries authoritative Phase Card facts for every
changed Phase, including regression scope and explicit compatibility boundaries;
it is not assembled from `spec.md` alone. A missing compatibility declaration
fails closed, while an accepted compatibility boundary is not reopened merely
because an older fixture exercises it.

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

## Composable execution

The contract has two composable parts: **Stage coordination** and **Phase
execution**. A single executor runs Stage coordination, then performs each
Phase execution in order, returning to Stage coordination after every
completed Phase.
Splitting the parts across host workers is optional and must not change their
order, evidence, or authority boundaries.

### Stage coordination

1. Validate StageContext, accepted lineage, Git common directory, and named
   artifact checkpoint hashes. Read design artifacts only through ArtifactDir.
2. Split the accepted plan into ordered Phases. For each Phase, create one
   frozen **Phase Card** containing only authenticated facts copied from
   StageContext and accepted records: project/task/phase identity, goal,
   accepted AC IDs, Workspace root, allowed files, baseline, non-goals,
   applicable RED expectation, exact test commands, necessary regression
   scope, explicit compatibility boundaries, conditional-component trigger
   facts, and upstream findings. A compatibility boundary is valid only when
   it is copied from an accepted record; never invent one to make a failing
   regression green. The Phase Card is authoritative input to both the Phase
   review and the final full-worktree review.
   The card must not copy execution steps, review selection rules, or
   task-storage paths. Never infer any card field from cwd or directory scans.
   When a host exposes the Phase Card on a user-visible surface, it must lead
   with a short plain-language Phase brief: goal, completion standard, allowed
   change area, test result expected, and next owner. Raw Workspace paths,
   baselines, hashes, internal IDs, and exact commands belong only in the
   formal card record and must not appear in the user-visible description.
   Present one Stage progress brief after the Phase breakdown is frozen: each
   Phase's human-readable goal, ordering/dependencies, and the first Phase to run.
   Before an individual task starts, resolve a temporary task projection from
   that task's declared versioned refs only. Each selected item must exactly
   match an accepted `artifact_kind` + `ref` + `hash` + `id` binding; do not
   discover extra files, scan the repository, or copy complete spec/plan/tasks
   text. A missing, stale, duplicate, or overwide binding stops that task with
   its affected ID and recovery condition. The projection is execution input
   only: discard it after the task and never publish it as an accepted fact.
3. Start only the current Phase. When Phase execution returns, run the Phase
   gate against the canonical result, its authenticated semantic review fact,
   and the live Workspace tree. Missing evidence, identity/hash/snapshot/scope/
   material mismatch, or Workspace drift returns to the same Phase; it never
   advances. `pass` and `revise_required` remain review quality facts and do
   not decide this structural gate. Present one
   Phase result brief after the gate decision: implemented behavior, real tests,
   Phase review conclusion, important findings/disposition, residual risk, and
   whether the next Phase may start.
4. Start the next Phase only after the current Phase gate passes. The accepted
   plan remains the ordering authority; the mutable `phase-result.json` is only
   the current pointer because there is no machine-readable Phase index.
5. After every planned Phase completes, verify each Phase ID has matching
   canonical snapshot/material evidence, a formal semantic result, and a minimal
   phase-map trace. Reconstruct one unique continuous coverage chain from the
   accepted build-plan checkpoint to the final tree; missing/ambiguous/legacy
   facts are `MATERIAL_INCOMPLETE`. A trace that only authenticates paths and
   evidence must emit an audited `unknown` seam, not invent a semantic
   producer/consumer relation. After the fresh test receipt is captured, run
   exactly one final full-worktree `wh-review`; its scope is `worktree + integration`
   and it uses no historical or cumulative diff.
   After the fresh test receipt, run the final independent integration review.
   The final scope is `worktree + integration` `wh-review` without historical or cumulative diff.
   Never repeat a Phase or final review when its snapshot/material identity is
   unchanged.
6. Create the final implementation and fresh test receipts, publish the
   build-code attempt with `run`, and let the trusted runtime accept it
   automatically. Include a complete `acceptance_coverage` table with exactly
   one `covered`, `missing`, or `unknown` row per accepted AC, with canonical
   evidence refs for covered rows. A Phase result is gate evidence and cannot
   replace the final same-snapshot `worktree + integration` result; absent,
   partial, or snapshot-mismatched coverage cannot be accepted or handed off.
   A Phase result is gate evidence and cannot replace the final `worktree + integration` result.
7. If verify-code later publishes an authenticated failure, use only the
   controlled `reopen` flow above. Preserve the prior accepted attempt and
   rerun only the current, last affected completed Phase before repeating the final
   integration review. Pass the immutable `reopen_ref` in every
   `publish-phase-evidence` input for that repair. The runtime authenticates it
   against the active accepted build and records only the ref in the new Phase
   evidence. While that reopen remains bound to the active accepted build, each
   changed identity may be reviewed once; accepting the revised build makes the
   reopen stale and unusable. This does not create a Phase registry or Phase
   history.

### Phase execution

1. Read the frozen Phase Card as facts. Do not split or start another Phase,
   change accepted scope, commit, merge, push, accept the Stage, or close the
   task.
2. When applicable, produce RED, make the minimal GREEN change, run focused
   tests, run the necessary regression, and inspect the scoped diff. Use
   conditional `test-routing-advisor`, `diagnosing-bugs`, or `review-response`
   only when its declared trigger is present.
3. Publish implementation receipts through `receipt` and real test evidence
   through `capture-tests`; return the exact command and raw output. Before
   review, use `| AC | status | refs | reason |`, giving every accepted AC
   exactly one row marked `covered`, `missing`, or `unknown`. `covered` requires
   authenticated canonical refs; an omitted AC is never covered.
4. Create a temporary JSON input containing only `phase_id`,
   `implementation_receipt_ref`, `green_test_receipt_ref`, optional
   `red_evidence_ref`, optional `previous_phase_review_ref`, and
   `allowed_files`. Only the controlled post-accept repair above also includes
   its authenticated `reopen_ref`. Run:
   `node scripts/stage-runtime.mjs publish-phase-evidence --stage=build-code
   --project=<project> --task=<task> --input=<phase-evidence.json>`.
   The runtime derives the baseline and Workspace identity. Do not supply a
   path, commit, range, review implementation detail, or output destination.
   `phase_id` and `allowed_files` are declared Phase facts, not a new approval
   registry; the independent review checks them against the accepted plan.
   If the final full-worktree review finds a problem before build-code is
   accepted, include its formal `revise_required` result as
   `repair_review_result_ref`. The runtime binds that result to the current
   completed Phase and allows that append-only repair without a verify-code reopen.
   This reference is invalid after build-code acceptance and cannot be mixed
   with the post-verify `reopen_ref`.
   Complete `AGENTS.md` blocks explicitly marked as auto-managed runtime
   context are reported as `runtime_controlled_changes`, not as Phase output.
   The host may add, remove, or replace their task-local contents. Do not add
   them to the Phase Card, revert them, or treat them as business changes. Any
   edit outside complete marked blocks, malformed marker, mode change, symlink,
   or any other path still fails the allowlist normally.
5. Run one independent `wh-review` for the current `phase_id`. Then call
   `publish-phase-evidence` again with the same facts plus
   `review_result_ref`; this finalizes the current pointer without invoking a
   review itself.
   `simplicity-guard` is visible only inside `wh-review`; Stage coordination
   and Phase execution never invoke it directly.
   Present one Phase review brief for the effective result before returning or
   repairing findings.
6. Preserve `revise_required` and its findings as quality facts. Minor,
   invalid-anchor/evidence, and unavailable outcomes are recorded without
   becoming a stage-pass gate; unavailable never becomes `pass` and never
   creates a risk override. Only an authenticated `actionable`
   `major|blocking` finding uses the existing serious-review risk-pause flow.
7. Return once the current identity has authenticated review evidence and all
   structural Phase-gate material is complete. Return the Phase ID, canonical
   evidence refs, test command/output refs, review result ref, changed paths,
   and unresolved facts; do not copy full artifacts or logs.

Publishing Phase evidence does not authorize a controlled revision after an
accepted build. That authority is validated later by the existing final
`run --reopen=<immutable-ref>` path.

## Append-only historical Phase lineage

When final integration reports that an existing formally reviewed Phase branch is
untraced, bind only an already-published canonical trace through:
`node scripts/stage-runtime.mjs publish-phase-trace-lineage --stage=build-code
--project=<project> --task=<task> --input=$TMP_DIR/phase-trace-lineage.json`.
The input contains exactly
`{"trace_ref":"evidence/phases/<phase>/<tree>/phase-map-trace-<sha256>.json","trace_hash":"<sha256>"}`.
Publish one binding per invocation. The runtime independently verifies the
task/project, stage/Phase, tree and pinned commit, canonical evidence and
receipt hashes, review result/attempt/material, and unchanged semantic verdict
before writing one create-only `identity/phase-trace-lineage` generation
record. Missing, tampered, misbound, non-semantic, or duplicate traces fail
closed. This command
never changes old records, the current Phase pointer, Phase path selection, or
trusted review routing, and it never invokes an independent review.

After the Stage is accepted, present one plain-language final implementation
brief: delivered behavior, Phase outcomes, real tests, final review conclusion,
remaining risks, verify-code dependency, next owner, and whether user action is
required. Point to formal artifacts and evidence without copying their full
contents.

## Host interaction and completion handoff

Procedure actions named `ask`, `wait`, or `present` must be projected onto a
host-visible conversation surface. The invoking host owns delivery and resume;
WorkflowHub neither identifies a host user nor derives a conversation address.
Every public message uses the user's language, short Markdown headings, bullets,
and plain language a high-school student can understand. Use one card type only:

- A milestone card contains only current progress, 1–3 important conclusions,
  next step, and whether user action is required. Publish once for Phase
  breakdown, each Phase result, final implementation summary, and Stage
  acceptance; do not stream tool activity or duplicate a worker's full report.
- A review card contains the reviewed subject or Phase, actual reviewer sources,
  verdict, up to three important findings, intended disposition, and next step.
  Report actual duration and token usage only when supplied by formal
  review/runtime facts; otherwise state `not provided`. Do not estimate or rerun
  review for metrics. A finding repair reports only what changed and the new
  effective result, not the whole history.
- A decision question card contains only current status, question, affected
  scope, and 2–3 mutually exclusive options with one recommendation/reason and
  each option's consequence/risk. Do not add generic boilerplate sections.

Raw paths, hashes, receipt or attempt refs, runner details, shell commands, and
internal identifiers stay in formal records; public messages name only the
human-readable artifact and result. An unchanged milestone or reused review
result is not published again.
Ask and wait for the user only when an answer can change accepted scope or an
existing authorization boundary. When user action is required, present the
problem, one recommended option with its reason, mutually exclusive choices,
and each choice's consequence and risk. Otherwise state `user action: none`.
An inaccessible Workspace, missing host resource mapping, checkout mismatch,
or task identity problem is a host configuration failure, not a product
decision. After safe local diagnosis, return its completion condition to the
host coordinator; do not ask the user unless resolving it truly requires new
credentials, permissions, or an irreversible external action. If a resumed
invocation finds no state change and no action to take, publish no public
message.

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
handoff must be rebuilt from the latest completed Phase results and final
integration evidence. Later facts supersede earlier provisional skips,
risks, and findings; never reuse a stale Phase summary as the final result. The
invoking host must deliver the same concise facts to its downstream handoff
surface and parent progress surface. If downstream reports invalid upstream
input, the host must return the finding and completion condition to the upstream owner
through those host-owned
surfaces; do not poll or invent a host-specific recovery mechanism.

No task identifier, external tracker identifier, branch name, or shell location may select
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

## Serious review exception

Neither a Phase review nor the final integration review is a `pass` gate.
Their original verdicts remain quality facts. An authenticated `actionable`
`major|blocking` finding uses the existing serious-review pause. Show one
plain-language card at a time with the problem, evidence, consequences,
affected scope, and mutually exclusive “repair first” (recommended) and
“accept risk and continue” choices. Wait for the real host reply and use only
`accept-review-risk`. Minor, invalid-anchor/evidence, unavailable, timeout, and
adapter failures never open this override; unavailable remains unavailable and
never produces a risk acceptance. With no serious finding
build-code remains automatic; accepted risk keeps the original verdict and
cannot excuse missing tests, Phase evidence, or integration structure.
