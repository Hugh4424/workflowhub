---
name: build-spec
description: Produce and review the feature specification in the task worktree.
version: 2.0.0
---

# Build Spec

## Runtime contract

`core/stage-context.mjs` is the external runner implementation. Consume only
`bootstrapStage("build-spec", ...)` output. Required capabilities:
`ctx.task`, `ctx.kernel`, `ctx.workspace`, and `ctx.artifacts`.
Never derive task identity or paths from cwd, a repository, or an issue
identifier. The launcher resolves all `scripts/`, `core/`, and `metrics/`
locators from its authenticated `runner_root`; never search for or copy those
runner files into the target repository.

Executable entry: `node scripts/stage-runtime.mjs run --stage=build-spec
--project=<project> --task=<task> --input=<component-receipts.json>`. Build-spec
is an automatic stage: the trusted runtime publishes the attempt, materializes
its checkpoint, and accepts it without a human confirmation command.

The loaded Skill is the authoritative contract. Do not search the target
repository for another Skill file. The target repository's `skills/` directory
is never an entry.
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

Declared runtime components: `spec-specify`, conditional `spec-clarify`, `wh-review`, and
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
   Before drafting or asking a clarification, classify supplied decision
   material into: locked upstream decisions, explicitly unresolved upstream
   items, and newly discovered ambiguities. Preserve every locked decision's
   wording, order, meaning, options, and recommendation; do not rename or ask it
   again.
3. Create the draft by invoking `spec-specify` with the classified decision material and a
   controlled writer for `spec.md`.
4. Always perform a material ambiguity scan over the current `spec.md`.
   `spec-clarify` is conditional with trigger `clarification`: invoke it with
   the current content and the same named writer only when an ambiguity can
   change scope, acceptance, interfaces, data, security, or operations. Clarify
   only an explicitly unresolved item or a newly discovered ambiguity; filter
   every candidate against locked decisions first. Ask one decision axis at a
   time in dependency order. Two behaviors that can vary independently remain
   two axes even when they concern the same field; never offer paired options
   that decide both at once. When upstream already supplied options and a
   recommendation, preserve them exactly rather than substituting new choices.
   If every candidate conflicts with a locked decision, present no false choice:
   return the contradiction and its completion condition to the upstream owner.
   Otherwise map the single-axis question to the host-visible conversation,
   end the current invocation, and wait for the answer. Do not publish another
   clarification card, update the draft, or start review before a new invocation
   receives the real reply bound to the current card. Each remaining axis
   requires its own ask → wait → resume cycle. When no material unresolved or new
   ambiguity exists, record
   `spec-clarify: trigger=false — no material ambiguity` and continue.
5. Apply the constitutional checklist. Record findings; do not silently rewrite
   scope.
6. Run the initial review using a frozen packet built from `spec.md`, decision
   facts, and relevant evidence.
7. If that review has actionable findings, revise the draft directly. The first
   review is a quality fact, not a pass gate. A response ledger is optional
   external audit evidence; absent evidence is `unknown/unverified`, never a
   claimed repair. Only a complete, bound ledger that explicitly declares a
   change to direction, AC, interface, schema, state, security, concurrency,
   topology, phase order or test strategy runs at most one revision review: a
   fresh full review through the initial high-strength group. Its
   findings also guide revision only: do not use a low-cost closure review, loop,
   or block stage acceptance on a reviewer verdict.
8. Before the create-only receipt, reconcile the exact final `spec.md` bytes
   against every review finding and the planned completion card. For findings
   about an internal contradiction, unresolved cross-reference, missing
   acceptance criterion, or mismatch between claimed and written coverage,
   compare the written artifact directly; enumerate the actual FR and AC
   identifiers, and verify that every stated range and downstream coverage claim
   resolves to them. If this artifact-level reconciliation finds a mismatch,
   stop before acceptance; never publish a completion card that claims more than
   the artifact contains. Record any remaining or unverified review response
   honestly in the stage attempt; it is not a provider pass gate.
9. After that reconciliation finishes, without changing `spec.md`, create one final create-only receipt
   from its exact content. The normal path must not use a revision receipt
   or create an official receipt from a draft. Publish the append-only stage
   attempt with the review facts and missing items. When review is unavailable,
   pass its canonical attempt ref so the runtime records the failure reason and
   provenance; never describe it as a pass or invent a result.
10. Present a plain-language progress brief with exactly these four items:
   current status; next step and owner; whether the user must act; and, only
   when action is required, the problem, a recommended option, and every
   option's consequence and risk. The trusted runtime immediately runs
   `accept --attempt=<attempt>` without a confirmation, creates the checkpoint,
   and accepts the attempt.
   Checkpoint failure is an integrity error; quality facts never become a gate.

No component may use shell location, repository discovery, or ad-hoc product
paths. A missing named artifact fails with its ArtifactDir error.

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
An `ask` is a suspension point: after one visible question, the Stage returns
control and may resume only with the corresponding real answer. It must never
batch multiple questions into one host turn.
Ask and wait for the user only when the answer can change accepted scope or an
existing authorization boundary. When user action is required, present the
problem, one recommended option with its reason, mutually exclusive choices,
and each choice's consequence and risk. Otherwise state `user action: none`.

Before the Stage completes, publish a completion card for every Stage-owned
component. `skill-deps.yaml` is the only authoritative component list: every `always` component is
`executed`; every `conditional` component is either `executed` or
`trigger=false — <reason>`. Formal artifacts and canonical `wh-review` refs must
cross-check consistently against that list. 正式产物、审查引用与该清单必须交叉核对并保持一致。
Reviewer-owned lenses appear only through those
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
{"stage":"build-spec","skill_or_stage":"build-spec"}
```
