---
name: make-decision
description: Clarify direction, create the task workspace, and publish the first accepted stage result.
version: 2.0.0
---

# Make Decision

## Runtime contract

`core/stage-context.mjs` is the external runner implementation. The launcher calls
`bootstrapStage("make-decision", ...)` before Step 1 and supplies one branded
`StageContext`. This stage uses `ctx.task`, `ctx.kernel`, `ctx.identity`, and
`ctx.manifest`. The official runtime additionally prepares one authenticated
`ctx.candidateWorkspace` before product-repository work. ArtifactDir must be
absent because no design artifact has been accepted yet.
Consume only that launcher-supplied StageContext. Never derive task identity or
paths from cwd, a repository, or an issue identifier. The launcher resolves all
`scripts/`, `core/`, and `metrics/` locators from its authenticated `runner_root`;
never search for or copy those runner files into the target repository.

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

Use this complete public sequence without inventing flags or input shapes:

1. Before code inspection or `grill-with-docs` writes, run
   `node scripts/stage-runtime.mjs prepare --stage=make-decision
   --project=<project> --task=<task>`. This is the only stage that uses
   `prepare`; it creates or reopens the deterministic CandidateWorkspace.
2. Put the decision receipt payload under `$TMP_DIR`. Its exact shape is
   `{"decision_log":"<readable decision log>"}`. Publish it with
   `node scripts/stage-runtime.mjs receipt --stage=make-decision
   --project=<project> --task=<task> --component=decision
   --input=$TMP_DIR/decision-receipt.json`.
3. Put the run input under `$TMP_DIR` with exactly:
   `{"receipts":{"decision":"receipts/decision.json","direction_review":"<canonical direction result-or-unavailable-attempt ref>","detail_review":"<canonical detail result-or-unavailable-attempt ref>"}}`.
4. Publish the attempt with
   `node scripts/stage-runtime.mjs run --stage=make-decision
   --project=<project> --task=<task> --input=$TMP_DIR/run.json`.
5. After the last caller-owned input is consumed, let the host reclaim
   `$TMP_DIR` through its normal OS temporary lifecycle. Never treat the
   temporary path as a stage artifact, evidence ref, or handoff item.
6. Record the human decision using the returned attempt ref:
   `node scripts/stage-runtime.mjs confirm --stage=make-decision
   --project=<project> --task=<task> --attempt=<attempt-ref>
   --decision=accepted|rejected`.
7. Only for an accepted decision, pass the returned confirmation ref:
   `node scripts/stage-runtime.mjs accept --stage=make-decision
   --project=<project> --task=<task> --attempt=<attempt-ref>
   --human-confirmation-ref=<confirmation-ref>`.

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
   external research is materially needed. Start by presenting known facts and
   every candidate question currently justified by the requirement, ordered by
   whether its answer could change direction. The queue may contain zero, one,
   or several items; never manufacture questions or enforce a fixed minimum or
   maximum. Ask only the highest-ranked open
   question, wait for the user's answer, then reorder the remaining queue before
   asking again. Never write or infer the user's answer on their behalf. End the
   round only when no direction-changing question remains, and present the
   starting queue, each disposition, reorder result, and end reason on the
   host-visible conversation surface.
3. When research is needed and authorized, invoke `anysearch` with a frozen,
   non-sensitive packet. Otherwise record the skip reason and continue.
4. Run `talk-with-zhipeng` round 2 on the requirement plus research. Its queue
   covers direction, scope, non-goals, material trade-offs, and risks. Apply the
   same visible queue, one-question, wait, reorder, and explicit-end rules from
   round 1. Produce the direction baseline only after no direction-changing
   item remains. Present the queue and each update on the host-visible
   conversation surface. This is a non-blocking conversation checkpoint, not a confirmation gate.
5. Run independent direction review through the `wh-review` direction track. It
   is the only provider owner and gives
   providers only the frozen blind packet: raw requirement, objective facts,
   hard constraints, and explicit non-goals. It invokes
   `intake-decision-review` as a pure lens. Candidate decisions, recommendations,
   decision logs, specs, plans, code, and diffs are forbidden from this track.
6. Run `talk-with-zhipeng` round 3 with the blind findings. Its queue covers
   contradictions, load-bearing assumptions, unresolved findings, and residual
   risks. Apply the same visible queue, one-question, wait, reorder, and
   explicit-end rules. Ask only about an item that can still change direction;
   record evidence-resolved or non-blocking findings without asking. Present
   every finding disposition on the host-visible conversation surface.
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
8. Use `decision-log` to produce the structured decision draft. For every
   load-bearing decision, record the decision; source as an exact supplied user
   answer, original requirement, research/code fact, grill result, or review
   finding; facts and constraints; choice and rationale; affected scope;
   consequences and risks; rejected alternatives with reasons; unresolved
   items; and any superseded decision. Do not replace a source with phrases such
   as "confirmed in discussion". Include the grill documentation outcome, then
   run the `wh-review` detail track over the candidate direction and draft.
   `wh-review` remains the only component that invokes review providers.
9. Bind the CandidateWorkspace's exact post-grill `snapshot_tree`, absolute root,
   and baseline commit into the attempt. Acceptance must recapture the tree and
   fail loud if it changed after the attempt was published.
10. Present the business decision, scope, risks, readable decision-log, and the
    plain-language conclusions of both review tracks. Give 2–3 mutually exclusive
    choices, mark one recommendation, and state each choice's consequence, risk,
    and affected scope. This is the only make-decision confirmation. Keep
    worktree, baseline, snapshot, hashes, and formal refs in the internal record,
    not in the decision card. Wait for the user's explicit response, then record
    accepted or rejected with `confirm` and pass only an accepted confirmation
    record to `accept`.

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
Every public message uses the user's language, short Markdown headings, and
bullets. For Chinese, start with `## **当前状态**`, then `## **下一步**`, then
`## **需要你处理吗**`. Keep each section brief and use plain language a
high-school student can understand. Raw paths, hashes, receipt or attempt refs,
runner details, shell commands, and internal identifiers stay in formal records;
the public message names only the human-readable artifact and result.
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
and calls `configForCollector(metricsLauncherConfig, { task: ctx.task })`; it must
not pass raw config or choose a metrics path.
Call `recordSkeleton` at entry and `updateOwnResult` at exit; write failures only
surface warnings.

```json
{"stage":"make-decision","skill_or_stage":"make-decision"}
```
