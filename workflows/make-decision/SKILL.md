---
name: make-decision
description: Clarify direction, create the task workspace, and publish the first accepted stage result.
version: 2.0.0
---

# Make Decision

A real review outcome is recorded as returned; `unavailable` never becomes
`pass`.

## Runtime contract

`core/stage-context.mjs` is the external runner implementation. The launcher calls
`bootstrapStage("make-decision", ...)` before Step 1 and supplies one branded
`StageContext`. This stage uses `ctx.task`, `ctx.kernel`, `ctx.identity`, and
`ctx.manifest`. The official runtime additionally prepares one authenticated
`ctx.candidateWorkspace` before product-repository work. ArtifactDir must be
absent because no design artifact has been accepted yet.
Consume only that launcher-supplied StageContext. Never derive task identity or
paths from cwd, a repository, or an issue identifier. The launcher resolves all
`scripts/`, `core/`, and `metrics/` locators; available runner Git facts are
audit metadata only. Runner branch, dirty state, and old runner migration
history never decide the business result. Never search for or copy runner files
into the target repository.

Executable entry: `node scripts/stage-runtime.mjs run --stage=make-decision
--project=<project> --task=<task> --input=<component-receipts.json>`. The official
runtime deterministically creates or validates the task worktree from the
TaskHandle; callers must not supply a worktree path or baseline. Acceptance is
a separate `accept` invocation with `--attempt` and
`--human-confirmation-ref`. First record the decision with
`confirm --attempt=<attempt> --decision=accepted|rejected`, then pass its
returned ref to `accept`; execution never accepts its own result.

The loaded Skill is the authoritative contract. Do not search the target
repository for another Skill file. The target repository's `skills/` directory
is never an entry. `stage-runtime.mjs` has no `--help` command and must never
receive `--runner-root`.

Create an OS temporary directory before producing any caller-owned draft,
receipt payload, run input, or review request:
`TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/workflowhub-make-decision.XXXXXX")"`.
Every such file must stay under `$TMP_DIR`, never in the target base repository
or CandidateWorkspace. Canonical records remain owned by TaskKernel. Only
authorized product files such as `CONTEXT.md` or a qualifying ADR may be written
to the CandidateWorkspace through its controlled capability.
Create those temporary files with one shell command (`printf`, redirection, or a
here-document). Never use an editing or patch tool for them: it is not part of
the Stage contract and can leave the host waiting for an unrelated tool callback.

Use this complete public sequence without inventing flags or input shapes:

1. Before code inspection or `grill-with-docs` writes, run
   `node scripts/stage-runtime.mjs prepare --stage=make-decision
   --project=<project> --task=<task>`. This is the only stage that uses
   `prepare`; it creates or reopens the deterministic CandidateWorkspace.
2. Start the canonical Stage run:
   `node scripts/stage-runtime.mjs start-run --stage=make-decision
   --project=<project> --task=<task> --reason=<reason>`. This creates the run
   identity and completes Step 1.
3. Publish the canonical requirements ledger with
   `publish-requirements-ledger`; the successful publication completes Step 2.
4. Run talk Round 1 and publish its `interaction-completion.v1` record with
   `publish-content-evidence`; the successful publication completes Step 3.
5. Record the performed research or explicit skip with `record-research`. Its
   input contains only `status` (`performed|skipped`), a non-empty `reason`, and
   an existing canonical `evidence` object with `kind`, `uri_or_path`, and
   `content_hash`; the successful record completes Step 4 without a new research
   schema.
6. Run talk Round 2 and publish its `interaction-completion.v1`; this completes
   Step 5.
7. Run the `wh-review` direction track. Its authenticated semantic result or
   unavailable attempt becomes the current review-flow action and completes
   Step 6. A later resolution records disposition without repeating the Step.
8. Run talk Round 3 and publish its `interaction-completion.v1`; this completes
   Step 7.
9. Run the full `grill-with-docs` flow and publish its
   `interaction-completion.v1`; this completes Step 8.
10. Put the decision receipt payload under `$TMP_DIR`. Its exact shape is
   `{"decision_log":"<readable decision log>"}`. Publish it with
   `node scripts/stage-runtime.mjs receipt --stage=make-decision
   --project=<project> --task=<task> --component=decision
   --input=$TMP_DIR/decision-receipt.json`; this completes Step 9.
11. Run the `wh-review` detail track. Its authenticated semantic result or
    unavailable attempt becomes the current review-flow action and completes
    Step 10. A later resolution does not repeat the Step.
12. Publish the interaction aggregate and `decision-coverage-audit.v1`. They are
    required pre-confirmation content facts, not extra manifest Steps.
13. Put the run input under `$TMP_DIR` with exactly:
   `{"receipts":{"decision":"receipts/decision.json","direction_review":"<canonical direction result-or-unavailable-attempt ref>","detail_review":"<canonical detail result-or-unavailable-attempt ref>"}}`.
   When the latest authenticated action for a track is a verified resolution,
   add only that track's dedicated field:
   `direction_review_resolution` for direction and
   `detail_review_resolution` for detail. Each value must be the canonical
   resolution ref that is the latest action in that same track's review flow.
   Never use the untracked `review_resolution` field for make-decision and
   never use one track's resolution for the other track.
14. Publish the attempt with
   `node scripts/stage-runtime.mjs run --stage=make-decision
   --project=<project> --task=<task> --input=$TMP_DIR/run.json`.
   `run` derives and binds the canonical pre-confirmation audit through Steps
   1–10. It rejects a stale decision receipt, stale review-flow head, missing
   interaction aggregate, or missing/misbound decision coverage audit.
15. Present the only final decision card and wait for the real human response.
    After the last caller-owned input is consumed, let the host reclaim
    `$TMP_DIR` through its normal OS temporary lifecycle. Never treat the
    temporary path as a stage artifact, evidence ref, or handoff item.
16. Record the single final human decision using the returned attempt ref:
   `node scripts/stage-runtime.mjs confirm --stage=make-decision
   --project=<project> --task=<task> --attempt=<attempt-ref>
   --decision=accepted|rejected`.
   An accepted confirmation records Step 11. A rejected confirmation never
   authorizes acceptance.
17. Only for an accepted decision, pass the returned confirmation ref:
   `node scripts/stage-runtime.mjs accept --stage=make-decision
   --project=<project> --task=<task> --attempt=<attempt-ref>
   --human-confirmation-ref=<confirmation-ref>`.
   `accept` revalidates the CandidateWorkspace, records Step 12, publishes the
   full Steps 1–12 canonical audit, and creates `accepted.json` last.

make-decision journal entry/exit records are runtime-owned. Public
`record-step-entry` and `record-step-exit` calls are forbidden.

Missing review refs stop the official run. Missing decision-log content stops
receipt creation. Invoking-host instructions own the
conversational wait-and-resume behavior; WorkflowHub does not authenticate host
message authors.

The stage and every component must not discover identity from the shell, Git,
an issue number, a branch, or directory scanning. Components receive frozen
material, controlled TaskHandle callbacks, or the authenticated
CandidateWorkspace capability explicitly named below. Missing context is a
fail-loud entry error.

Declared runtime components: three ordered invocations of `talk-with-zhipeng`,
one full `grill-with-docs` invocation, `decision-log`, `wh-review`, conditional
`anysearch`, conditional `debate`, and the review lenses declared by the
manifest. `intake-decision-review` is a blind direction lens owned and invoked
only through `wh-review`; it is not a second review runner.

## Inputs and outputs

- Input: original requirement and `ctx.manifest`.
- Reads accepted stages: none.
- Writes: append-only make-decision attempt through TaskKernel.
- Accepted facts: `worktree_root`, `baseline_commit`, `snapshot_tree`, decision,
  scope, and risks.
- Product artifacts: `grill-with-docs` may update `CONTEXT.md` and qualifying
  ADRs in the CandidateWorkspace; their exact post-grill tree is bound above.

## Procedure

1. Validate the StageContext and immutable task identity. Create or validate one
   authenticated CandidateWorkspace for `ctx.manifest.target_repo_root`; callers
   never provide its path or baseline.
2. Run `talk-with-zhipeng` round 1 on the original requirement and known facts.
   Its purpose is to identify the real problem, success criteria, and whether
   external research is materially needed. Start internally by enumerating known
   facts and every candidate question currently justified by the requirement,
   ordered by whether its answer could change direction. The queue may contain zero, one,
   or several items; never manufacture questions or enforce a fixed minimum or
   maximum. Ask only the highest-ranked open
   question as a host-visible ask, persist the host-supplied ask ref/hash, then
   stop the current invocation and wait. Resume only with the real reply bound
   to the same card, Round, and question number; persist its host-visible
   ref/hash, then reorder the remaining queue before
   asking again. Never write or infer the user's answer on their behalf. End the
   round only when no direction-changing question remains, and present the
   round's resolved decisions, remaining risks, question count, and end reason
   on the host-visible conversation surface. Keep the full queue and reorder
   history in the component result, not in public prose.
3. When research is needed and authorized, invoke `anysearch` with a frozen,
   non-sensitive packet. Otherwise record the skip reason and continue. Present
   one host-visible research brief: what was checked, the 1–3 facts that can
   affect the decision, their effect on the current direction, and what happens
   next. Do not copy source dumps or internal evidence identifiers.
4. Run `talk-with-zhipeng` round 2 on the requirement plus research. Its queue
   covers direction, scope, non-goals, material trade-offs, and risks. Apply the
   same internal queue, short question-card, wait, reorder, and explicit-end rules from
   round 1. Produce the direction baseline only after no direction-changing
   item remains. Present the resolved direction, scope/non-goals, key trade-offs,
   remaining risks, question count, and end reason on the host-visible surface.
   This is a non-blocking conversation checkpoint, not a confirmation gate.
5. Run independent direction review through the `wh-review` direction track. It
   is the only provider owner and gives
   providers only the frozen blind packet: raw requirement, objective facts,
   hard constraints, and explicit non-goals. It invokes
   `intake-decision-review` as a pure lens. Candidate decisions, recommendations,
   decision logs, specs, plans, code, and diffs are forbidden from this track.
   A semantic `revise_required` result is an expected input, not an infrastructure
   failure: read its findings and continue with the next applicable convergence
   step. Only a terminal unavailable or failed result is a review-service
   problem. Do not rerun unrelated CLI diagnostics, repeat an unchanged review,
   or ask the user to choose how to repair a valid review result. Present one
   review brief for the effective result using the review-card contract below.
   Direction stays blind and never merges with detail. Both track briefs show
   findings with `fixed`, `rejected_invalid`, `accepted_risk`, or `unverified`
   when no bound response ledger exists; a verdict is review evidence, not a
   replacement for the final decision confirmation.
6. Run `talk-with-zhipeng` round 3 with the blind findings. Its queue covers
   contradictions, load-bearing assumptions, unresolved findings, and residual
   risks. Apply the same internal queue, short question-card, wait, reorder, and
   explicit-end rules. Ask only about an item that can still change direction;
   record evidence-resolved or non-blocking findings without asking. Present
   one compact round summary with important finding dispositions, remaining
   risks, question count, and end reason on the host-visible surface.
7. Invoke the complete `grill-with-docs` skill in the authenticated
   CandidateWorkspace. Do not substitute a lite or read-only variant. The
   `grill-with-docs` completion reports changed context files or no file changes.
   It may
   inspect code and update `CONTEXT.md` or an ADR through controlled
   CandidateWorkspace capabilities. Failure to obtain a load-bearing input is a
   real blocker; ordinary review disagreement is recorded. Its completion
   summary records `CONTEXT.md: changed|no change` with reason and file ref;
   `ADR: created|not needed` with separate judgments for reversibility,
   surprise without context, and genuine trade-off; terminology or ADR
   conflicts and their disposition; and conclusions for four exit checks:
   external interfaces verified against their authority, one authoritative
   field/path name, explicit failure semantics, and frozen scope/non-goals.
   Present those conclusions on the host-visible surface, including whether
   `CONTEXT.md` changed and whether an ADR was created or not needed, with the
   plain-language reason.
   A direction-changing grill question follows the same
   `ask → wait/pause → real reply → re-rank` boundary. Code/document facts may
   close a mechanical item without a question only when the grill records the
   factual reason.
8. Use `decision-log` to produce the structured decision draft. For every
   load-bearing decision, record the decision; source as an exact supplied user
   answer, original requirement, research/code fact, grill result, or review
   finding; facts and constraints; choice and rationale; affected scope;
   consequences and risks; rejected alternatives with reasons; unresolved
   items; and any superseded decision. Do not replace a source with phrases such
   as "confirmed in discussion". Include the grill documentation outcome, then
   run the `wh-review` detail track over the candidate direction and draft.
   `wh-review` remains the only component that invokes review providers.
   Present one review brief for the effective detail result without combining it
   with the direction-track result.
9. Bind the CandidateWorkspace's exact post-grill `snapshot_tree`, absolute root,
   and baseline commit into the attempt. Acceptance must recapture the tree and
   fail loud if it changed after the attempt was published.
10. Present the business decision, scope, risks, readable decision-log, and the
    plain-language conclusions of both review tracks. Give 2–3 mutually exclusive
    choices, mark one recommendation, and state each choice's consequence, risk,
    and affected scope. This is the only make-decision confirmation. Keep
    worktree, baseline, snapshot, hashes, and formal refs in the internal record,
    not in the decision card. Summarize each load-bearing decision's source,
    reason, affected scope, consequence, and risk; include explicit non-goals
    and unresolved items without copying the full decision-log. Wait for the user's explicit response, then record
    accepted or rejected with `confirm` and pass only an accepted confirmation
    record to `accept`.

### Canonical interaction publication

After each talk Round and the grill completes, pass only its content payload to
the TaskKernel-controlled Stage content writer as
`interaction-completion.v1`. Components never supply task/stage/run/producer,
canonical ref/hash, snapshot/tree, root, task path, cwd, or repository
discovery. The writer minimizes the payload, rejects caller identity fields,
injects authenticated bindings, and returns the canonical ref/hash.

Each Round payload contains its complete candidate queue, item impact/status,
question number, and:

`current_total = questions_already_asked + open_direction_changing_questions`

Any total change records the real reply that caused it and the factual reason
for each added or removed question. Every question records card hash and format
checks, then host-visible ask ref/hash, the bound real reply ref/hash, and the
following re-rank in order. Agent-generated answers, defaults, stale replies,
or a decision-log self-report are invalid. A full card, secret, token,
password, credential, cookie, or authorization value is never placed in
long-lived evidence.

After all three separately published talk records and the grill record exist,
publish one aggregate `interaction-completion.v1` payload containing only their
canonical refs/hashes, order, each Round's queue result/end conclusion, the
grill exit facts, and the final decision ref/hash plus CandidateWorkspace tree.
Missing, duplicate, out-of-order, cross-Round, or cross-run refs fail before the
make-decision attempt can be published. A host-visible ref proves delivery to a
host-visible surface only; it is not proof of the speaker's identity or that a
human read the message.

Quality facts are recorded, not converted into automatic quality gates.
Contradictory identity, missing physical workspace facts, or an invalid context
are entry-integrity failures and stop before stage work.

Rounds 1, 2, and 3 are three distinct invocations. They may each contain several
one-question turns until their own material ambiguity is resolved; they must not
be collapsed into one invocation or expanded into three confirmation gates.
Each visible question addresses one decision axis. When axes depend on one
another, resolve them in dependency order rather than combining them into one
card. A simple task may end a round without a user wait only when its visible
queue shows why every candidate is already answered or not applicable.
There is no fixed minimum or maximum number of questions or replies. Every
remaining high- or medium-impact item must be asked, one at a time, and each
real reply must trigger a fresh ranking before the round can end.

## Host interaction and completion handoff

Procedure actions named `ask`, `wait`, or `present` must be projected onto a
host-visible conversation surface. The invoking host owns delivery and resume;
WorkflowHub neither identifies a host user nor derives a conversation address.
Every public message uses the user's language, short Markdown headings, bullets,
and plain language a high-school student can understand. Use one card type only:

- A question card contains only current status, question, affected scope, and
  2–3 mutually exclusive options. Current status names the active component,
  round, and question number/current queue size; a dynamic queue says that the
  total may change after re-ranking. Mark one recommendation with its reason and
  give each option's consequence and risk. Do not add completed-work, next-step,
  or generic user-action sections to a question card.
- A milestone card contains only current progress, 1–3 important conclusions,
  next step, and whether user action is required. Publish one after each talk
  round, research, grill, and other Stage-owned milestone that changes the
  decision picture; do not stream tool activity.
- A review card contains the reviewed subject, actual providers, verdict, up to
  three important findings, intended disposition, and next step. Report actual
  duration and token usage only when supplied by formal review/runtime facts;
  otherwise state `not provided` instead of estimating or rerunning review.

Raw paths, hashes, receipt or attempt refs, runner details, shell commands, and
internal identifiers stay in formal records; public messages name only the
human-readable artifact and result. An unchanged milestone or reused review
result is not published again.
Ask and wait for the user only when the answer can change direction or an
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
and calls `configForCollector(metricsLauncherConfig, { task: ctx.task })`; it must
not pass raw config or choose a metrics path.
Call `recordSkeleton` at entry and `updateOwnResult` at exit; write failures only
surface warnings.

```json
{"stage":"make-decision","skill_or_stage":"make-decision"}
```

## Serious review exception

After each formal review, pause only for an authenticated finding whose
disposition is `actionable` and severity is `major` or `blocking`. Present one
finding at a time in plain language: the concrete problem, verifiable evidence,
likely consequences, affected scope, and two mutually exclusive choices.
Recommend “repair first”; “accept risk and continue” is the only override
choice. Wait for the real host reply, then use the official
`accept-review-risk` command with the exact card/reply bindings. Minor,
invalid-anchor/evidence, unavailable, timeout, or adapter failures never open
this override. A risk acceptance does not change the review verdict, excuse a
structural/audit failure, or replace make-decision's normal final confirmation.
