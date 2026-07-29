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
locators from the launcher-owned runtime; available runner Git facts are audit
metadata only. Runner branch, dirty state, and old runner migration history
never decide the stage result. Never search for or copy runner files into the
target repository.

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
Create temporary inputs with one shell command (`printf`, redirection, or a
here-document). Never use an editing or patch tool for them: it is not part of
the Stage contract and can leave the host waiting for an unrelated tool callback.

Use this complete public sequence without inventing flags or input shapes:

1. Before each review, publish the exact draft under review:
   `node scripts/stage-runtime.mjs artifact --stage=build-spec
   --project=<project> --task=<task> --name=spec.md
   --input=$TMP_DIR/draft-spec.md`.
2. For the exact current `spec.md`, publish its v2 ambiguity and identity ledger:
   `node scripts/stage-runtime.mjs publish-content-evidence --stage=build-spec
   --project=<project> --task=<task> --kind=ambiguity-ledger.v2
   --input=$TMP_DIR/ambiguity-ledger-v2.json`.
   The returned canonical ref/hash is the only ambiguity-ledger evidence used
   by review and publication. If clarification or review changes even one
   `spec.md` byte, the old ledger is stale: rebuild and republish it for the new
   content before continuing.
3. After review is finished and without changing `spec.md`, create the official
   receipt once:
   `node scripts/stage-runtime.mjs receipt --stage=build-spec
   --project=<project> --task=<task> --component=spec
   --input=$TMP_DIR/spec-receipt.json`.
   The input shape is exactly
   `{"content":"<exact final spec markdown>"}`.
4. Create `$TMP_DIR/run.json` with the final spec receipt and canonical review
   head:
   `{"receipts":{"spec":"receipts/spec.json","review":"<canonical review result-or-unavailable-attempt ref>"}}`.
   Do not add `workflow_run_id`: the trusted runtime derives the authenticated
   review-flow identity from the accepted make-decision lineage, locks that
   flow, and requires the consumed semantic result to be its exact current
   head/root/hash.
   The review must bind the exact current Workspace snapshot. When a normal
   post-review edit is covered by a canonical verified delta resolution, add
   `"review_resolution":"reviews/resolutions/<sha256>.json"` under `receipts`;
   its prior result ref/hash/snapshot and current snapshot must match. A
   structural follow-up instead supplies its current full result as `review`;
   the runtime verifies that result's canonical parent ref/hash. A stale review
   without either binding fails before a stage attempt is published.
5. Publish and automatically accept the stage:
   `node scripts/stage-runtime.mjs run --stage=build-spec
   --project=<project> --task=<task> --input=$TMP_DIR/run.json`.
6. After `run` consumes the final input, let the host reclaim `$TMP_DIR`
   through its normal OS temporary lifecycle. Never treat the temporary path as
   a stage artifact, evidence ref, or handoff item.

If an already accepted build-spec is later proven to have skipped a material
clarification, correct it in the same task through one bound continuation.
Do not edit or delete the accepted record:

1. Call `continue-stage` with an input containing exactly `reason`,
   `previous_attempt_ref`, `previous_accepted_ref`, and
   `previous_review_refs`. The accepted ref must be
   `results/build-spec/accepted.json`; the attempt and reviews must be the
   canonical records being superseded.
2. Before starting another run, call `invalidate-stage-attempt` for that exact
   prior attempt using its raw-byte SHA-256 and the clarification defect as the
   reason.
3. Call `start-run --continuation-ref=<returned continuation ref>`, then resume
   this Skill from ambiguity classification and ask one decision axis at a
   time.
4. The replacement attempt must bind the new run's audit and exact current
   spec. It must carry the exact continuation and invalidation refs/hashes.
   Acceptance durably archives the previous accepted bytes before the canonical
   compare-and-swap. A missing, stale, cross-stage, changed, or tampered
   continuation/invalidation binding fails before replacement.

An accepted build-plan does not block build-spec continuation. The existing
accepted plan remains unchanged; rerun build-plan when the plan must reflect the
replacement specification. Do not replace build-spec after build-code or
verify-code has an accepted record; fail closed once execution has been
accepted.

The prior accepted record remains the readable current fact until the corrected
attempt is accepted. Continuation is recovery from a proven Stage defect, not a
general way to reopen build-spec or add new scope.

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
   controlled writer for `spec.md`. Present one host-visible draft brief covering
   the proposed goal, boundaries, major requirements, acceptance shape, and the
   next check.
4. Always build an `ambiguity-ledger.v2` over the current `spec.md`; an empty
   or skipped ledger is invalid. A spec generated from the current template
   must publish `content_profile: "spec-content.v3"` and pass the deterministic
   generated-Markdown cleanliness and Spec-Purity check before publication.
   The typed payload must include scenario cards, FR `scenario_refs`, AC
   `failure_condition`, and OPEN cards. Every PFACT carries only the field for
   its selected status; an unknown PFACT binds a RISK or OPEN card. An unknown
   content profile fails loud.

   Legacy `ambiguity-ledger.v2` without `content_profile` remains read-only
   compatible: it may be consumed without the new fields, but must never be
   rewritten or published as if it were new current-template content.

   Classify every relevant statement as exactly
   one of `locked upstream decision`, `upstream explicitly unresolved`, or
   `new ambiguity`. One ledger item represents one decision axis. If two
   behaviors can vary independently, create two items even when they affect the
   same field or feature.

   The v2 ledger is the deterministic identity summary for the exact spec bytes:
   it binds the spec ref/hash, SCN/PFACT/FR/AC/OPEN IDs and their relations,
   fact status, and every risk's affected IDs, trigger, consequence,
   mitigation-or-STOP, handling Stage, and verification. It never copies
   product prose into a second artifact. `verified` PFACT requires formal
   evidence; `inferred`, `unknown`, and `not_applicable` require their
   corresponding limit, owner, or reason. Code paths, symbols, code anchors,
   and engineering options are forbidden in the v2 payload.

   Every ambiguity item records all six possible impact dimensions separately: scope,
   acceptance, interfaces, data, security, and operations. It also records
   whether it is material, its source facts, affected requirements, status,
   conclusion, and factual reason. A material item may close only as a real
   user decision bound to its clarification interaction, a spec-local fact
   uniquely derived from a locked upstream decision, or an unresolved blocker.
   A non-material item may be skipped only when its record explains with
   checkable facts why none of the six dimensions can change. When there are no
   material ambiguities, retain the classified items and this factual
   no-material reason; never replace the ledger with “nothing important found”.

   Compute `spec_content_hash` from the exact UTF-8 bytes of the current
   `spec.md`. `unresolved_material_count` must equal the number of material
   items whose status is `unresolved blocker`. The content-evidence writer
   injects task, Stage, run, producer and Workspace snapshot bindings; the
   component must not supply identity, root, task path, cwd or repository
   discovery fields.

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
   requires its own ask → wait → resume cycle. After every real answer,
   reclassify every remaining axis and rebuild the ledger against the updated
   exact draft. When no material unresolved or new ambiguity exists, record
   `spec-clarify: trigger=false — no material ambiguity` together with the
   ledger's factual six-dimension reason and continue.
5. Before constitution checking or review, enforce the ambiguity gate. Any
   material `unresolved blocker`, a merged independent axis, a missing
   six-dimension assessment, a mismatched `spec_content_hash`, or an incorrect
   `unresolved_material_count` stops the Stage. Do not create the spec receipt,
   start review, publish a successful attempt, or show a completion card.
   Publish the current canonical `ambiguity-ledger.v2` ref/hash only after the
   exact draft passes this gate.
6. Apply the constitutional checklist. Record findings; do not silently rewrite
   scope.
7. Run one initial full review using a frozen packet built from the exact
   `spec.md`, its matching ambiguity-ledger.v2 ref/hash, decision facts, and
   relevant evidence. Present one review brief for its effective result using
   the review-card contract below. The brief lists findings and one disposition
   for each: `fixed`, `rejected_invalid`, `accepted_risk`, or `unverified` when
   no bound response ledger exists. This is review evidence, never a synthetic
   stage pass.
8. If clarification or review causes `spec.md` to change, first republish the
   artifact, rebuild the ledger, rerun the ambiguity gate, and publish new
   content evidence. TaskKernel then classifies the change inside the same
   authenticated review flow:

   - an ordinary change uses a canonical verified delta/resolution bound to the
     prior result, prior spec/ledger hashes, current spec/ledger hashes, and
     current snapshot; provider calls remain zero;
   - a material structural change may append at most one fresh full review,
     whose canonical parent is the prior result;
   - unchanged snapshot/material reuses its existing result and must not call a
     provider again.

   A stale ledger, a resolution from another flow, a delta that does not cover
   the actual change, or a second structural follow-up review stops the Stage.
   Do not loop reviews to manufacture a pass. If the single permitted
   structural follow-up still leaves an actionable material finding, report the
   blocker and its completion condition instead of publishing.
9. Before the create-only receipt, reconcile the exact final `spec.md` bytes
   against every review finding and the planned completion card. For each
   finding, record `fixed`, `rejected_invalid`, or `accepted_risk`; without a
   bound ledger record `unverified` and do not claim it was repaired. Resolve a
   factual internal contradiction, unresolved cross-reference, missing
   acceptance criterion, or mismatch between claimed and written coverage even
   when the provider verdict is `pass`. Enumerate the actual FR
   and AC identifiers and verify that every stated range and downstream coverage
   claim resolves to them. If reconciliation changes the draft, return to Step
   8's same-flow classification; do not start a new review flow. Stop before
   acceptance while the ledger or review resolution is stale, or an actionable
   material finding remains; never publish a completion card that claims more
   than the artifact contains.
10. After that reconciliation finishes, verify once more that the exact final
   spec bytes, `spec_content_hash`, canonical ambiguity-ledger.v2 ref/hash, review
   head or same-flow resolution, and Workspace snapshot all agree. Without
   changing `spec.md`, create one final create-only receipt
   from its exact content. The normal path must not use a revision receipt
   or create an official receipt from a draft. Publish the append-only stage
   attempt with the review facts and missing items. When review is unavailable,
   pass its canonical attempt ref so the runtime records the failure reason and
   provenance; never describe it as a pass or invent a result.
11. Present a plain-language completion brief covering what the specification
   will deliver, explicit non-goals, major functional requirements, acceptance
   criteria, interfaces or operational boundaries, remaining risks, and the
   exact input handed to build-plan. The trusted runtime immediately runs
   `accept --attempt=<attempt>` without a confirmation, creates the checkpoint,
   and accepts the attempt.
   Checkpoint failure is an integrity error; quality facts never become a gate.

No component may use shell location, repository discovery, or ad-hoc product
paths. A missing named artifact fails with its ArtifactDir error.

## Host interaction and completion handoff

Procedure actions named `ask`, `wait`, or `present` must be projected onto a
host-visible conversation surface. The invoking host owns delivery and resume;
WorkflowHub neither identifies a host user nor derives a conversation address.
Every public message uses the user's language, short Markdown headings, bullets,
and plain language a high-school student can understand. Use one card type only:

- A clarification question card contains only current status, question,
  affected scope, and 2–3 mutually exclusive options. Current status names
  `spec-clarify` and the question number/current ambiguity count. Mark one
  recommendation with its reason and give each option's consequence and risk.
  Do not add completed-work, next-step, or generic user-action sections.
- A milestone card contains only current progress, 1–3 important conclusions,
  next step, and whether user action is required. Publish it for the first draft
  and final specification, not for individual tool calls.
- A review card contains the reviewed subject, actual providers, verdict, up to
  three important findings, intended disposition, and next step. Report actual
  duration and token usage only when supplied by formal review/runtime facts;
  otherwise state `not provided`. Do not estimate or rerun review for metrics.

Raw paths, hashes, receipt or attempt refs, runner details, shell commands, and
internal identifiers stay in formal records; public messages name only the
human-readable artifact and result. An unchanged milestone or reused review
result is not published again.
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

The official Stage handler is the only completion-facts producer. Publish both
completion views only through `core/stage-completion-facts.mjs`: the public
surface receives its user renderer and the downstream surface receives its
system renderer. Never rebuild, enrich, or recalculate either view in the Skill.
The shared result, risks, next owner, user action, and artifact labels must stay
identical; only the system view carries formal refs, hashes, review details,
dependencies, recovery conditions, and the downstream lookup rule.

Publish the concise rendered completion handoff. Do not copy artifacts or raw logs. The
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

## Serious review exception

After the formal review, pause only for an authenticated `actionable`
`major|blocking` finding. Show one plain-language card at a time with the
problem, evidence, consequences, affected scope, and mutually exclusive
“repair first” (recommended) and “accept risk and continue” choices. Wait for
the real host reply and use only the official `accept-review-risk` command.
Minor, invalid-anchor/evidence, unavailable, timeout, and adapter failures do
not open a risk override. With no serious finding build-spec remains automatic;
accepted risk never changes the verdict or excuses missing structural evidence.
