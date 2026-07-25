---
name: verify-code
description: Independently verify the accepted implementation and perform confirmed close operations.
version: 2.0.0
---

# Verify Code

## Runtime contract

`core/stage-context.mjs` is the external runner implementation. Consume only
`bootstrapStage("verify-code", ...)`. Task records use the branded TaskHandle
and TaskKernel. Product artifacts use ArtifactDir. Test and Git commands run
only in `ctx.workspace.worktreeRoot` supplied by the accepted decision.
Never derive task identity or paths from cwd, a repository, or an issue
identifier. The launcher resolves all `scripts/`, `core/`, and `metrics/`
locators from its authenticated `runner_root`; never search for or copy those
runner files into the target repository.

Executable entry: `node scripts/stage-runtime.mjs run --stage=verify-code
--project=<project> --task=<task>
--input=<component-receipts.json>`. Use the
`confirm --attempt=<attempt> --decision=accepted|rejected` records the human
decision. Pass its returned ref to `accept --human-confirmation-ref`.

The loaded Skill is the authoritative contract. Do not search the target
repository for another Skill file. The target repository's `skills/` directory
is never an entry. `stage-runtime.mjs` has no `--help` command. Verify-code must
not call `prepare` and must never pass `--runner-root`.

Create an OS temporary directory first:
`TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/workflowhub-verify-code.XXXXXX")"`.
Every caller-owned test-capture payload, acceptance payload, aggregate input,
run input, or review request must stay under `$TMP_DIR`, never in the target
base repository or accepted Workspace. Verification keeps product code
read-only; canonical receipts and evidence remain owned by TaskKernel.

Create the evidence aggregate with `node scripts/stage-runtime.mjs receipt
--stage=verify-code --project=<project> --task=<task>
--component=evidence
--input=$TMP_DIR/evidence-refs.json`; every referenced hash is verified first.
That input has exactly:
`{"refs":[{"ref":"<leaf ref returned by the runtime>","sha256":"<leaf hash returned by the runtime>"}]}`.

Verify-code has two distinct review facts. The active accepted build-code final
same-snapshot `worktree + integration` **pass** review remains the acceptance
lineage. Pass that exact build-code review ref in the verify run input; the
runtime authenticates its `review_scope=integration`, provider evidence, and
current snapshot. A Phase result, legacy unscoped worktree result, or verify-code
quality review never replaces, upgrades, or becomes this `receipts.review` fact.

After fresh tests and every acceptance-evidence leaf are complete, normal
verify-code must run configured `wh-review` with `stage: "verify-code"`. It
reviews only the frozen verification packet and publishes its own canonical
result or unavailable attempt. Its `pass`, `revise_required`, and `unavailable`
outcome is a non-gate quality fact for the human verify boundary. It cannot
accept the stage, invalidate the authenticated build-code review, or substitute
for fresh acceptance evidence. Fresh verification evidence remains structured
canonical roots:

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
display text. The canonical evidence writer recursively verifies both roots and
their referenced closure before publication. Report test totals from the
canonical test output. If parameterized or unchanged tests make a static
`test()` source count differ, explain the difference instead of treating that
source count as executed evidence.

Declared runtime components: required post-evidence `wh-review`; conditional
`test-strategy`; and conditional `isolated-browser-qa`.

## Inputs and outputs

- Reads: accepted build-code result and the named design artifacts it cites.
- Writes: evidence, append-only verify-code attempt, and confirmed
  close operation records through controlled task capabilities.
- Product code is read-only during verification. A required fix returns to a
  new build-code attempt.

When an acceptance criterion fails, publish the verify-code attempt and retain
the exact `acceptance-evidence.v1` reference whose `result` is `fail`; do not
accept that failed verification attempt. The only repair handoff is:
`node scripts/stage-runtime.mjs reopen --stage=build-code --project=<project>
--task=<task> --verify-attempt=<failed-verify-attempt-ref>
--failure-evidence=<failed-acceptance-evidence-ref>`. Pass the immutable reopen
ref returned by that command to the upstream Code Builder; it uses that ref on
the replacement build-code `run`. The command binds this attempt and evidence
hash to the old build-code acceptance, then permits one append-only replacement
attempt. A failed verdict never authorizes close operations.

After that replacement build is accepted, run verify-code again from its new
accepted snapshot, tests, and review. If a canonical component receipt already
exists from the prior accepted verification, only this controlled fresh-verify
path may use `receipt --revision=true --recover=<previous-receipt-ref>`.
Normal verify-code remains create-only for tests and acceptance evidence. It
reuses only the active accepted build-code final review for the identical tree.

If verify-code is already accepted but current Workspace evidence exposes a
lineage failure, do not edit or bypass its accepted record. First write the new
canonical `acceptance-evidence.v1` failure, then use
`node scripts/stage-runtime.mjs publish-verify-failure --stage=verify-code
--project=<project> --task=<task>
--failure-evidence=<evidence/ref.json>`.
The kernel binds the existing accepted verify result, the active build-code
acceptance, the evidence hash, and the current Workspace snapshot into one new,
unaccepted verify attempt. It rejects duplicate publication, changed bindings,
non-failure evidence, and Workspace drift during publication. Use that returned
attempt only for the controlled build-code reopen; never accept it.

After the repair produces a revised accepted build-code result, publish the
fresh passing verification through
`node scripts/stage-runtime.mjs publish-verify-passing --stage=verify-code
--project=<project> --task=<task>
--input=<component-receipts.json>`. The input
uses the same official tests, review, and evidence receipt shape as `run`. The
kernel requires a new active accepted build, fresh passing tests and acceptance
evidence, plus that build's accepted final integration review. The active build's accepted tests and
review snapshots must match those fresh materials and the live Workspace; a
build accepted at snapshot A cannot validate later Workspace B evidence. The
kernel then binds their hashes plus the old
accepted verify result and current Workspace HEAD/tree into one new unaccepted
verify attempt. Record a new human decision with `confirm` for that exact
attempt, then pass its returned ref to the ordinary `accept` command. This is
the only closed-stage acceptance exception: acceptance rechecks the old
canonical verify result, active accepted build, confirmation, lineage, fresh
tests/review/acceptance evidence, and current Workspace snapshot. It archives
the prior canonical bytes collision-safely and atomically replaces
`results/verify-code/accepted.json`. Any mismatch leaves the prior canonical
and stage state unchanged; accepting the same passing attempt again is
idempotent. Other attempts against a closed stage remain rejected.

## Procedure

1. Validate StageContext and read the accepted build-code result through
   `ctx.kernel.readAccepted("build-code")`.
2. Read only the accepted build-code facts and `evidence_refs` from its
   authenticated accepted attempt. Resolve formal artifacts, dependencies, and
   unresolved risks from those existing records; the human brief is display,
   not a handoff API. For every accepted AC, consume its `covered`, `missing`,
   or `unknown` row from the referenced evidence. If build-code has no per-AC
   coverage table, every affected AC remains `unknown`; verification cannot
   claim full coverage or pass. Never infer coverage from a green aggregate
   test run.
3. Take the fresh test command only from accepted build-code facts. Missing
   command is a fail-loud lineage error; never reuse an older command. Capture
   it through the only public path:
   `node scripts/stage-runtime.mjs capture-tests --stage=verify-code
   --project=<project> --task=<task>
   --input=$TMP_DIR/test-capture.json`.
   The exact input shape is
   `{"command":"<accepted build test command>","receipt_ref":"receipts/verify-tests.json","output_ref":"evidence/verify-tests.output"}`.
4. For every accepted AC, publish one leaf through
   `node scripts/stage-runtime.mjs publish-acceptance-evidence
   --stage=verify-code --project=<project> --task=<task>
   --input=$TMP_DIR/acceptance-evidence.json`. The exact input shape is
   `{"acceptance_criterion_id":"<AC-ID>","result":"pass|fail","refs":[{"ref":"<canonical evidence ref>","sha256":"<writer-returned hash>"}]}`.
   The runtime verifies every nested current-task ref and hash, chooses the
   deterministic leaf path, and rejects duplicate publication. The caller may
   not choose an output path. Aggregate only the returned leaf refs and hashes
   with the existing `receipt --component=evidence` command.
5. Invoke `test-strategy` only when the accepted spec or plan explicitly
   requires UI, high-risk, or multi-layer test routing. Ordinary backend work
   uses the accepted ACs, the fresh captured tests, and the per-AC evidence
   directly. For UI scope, invoke `isolated-browser-qa` with the explicit workspace and
   frozen acceptance material. It must report tool, login-state reuse, and
   cleanup completion.
6. Authenticate the active accepted build-code final `worktree + integration`
   review and its `review_scope=integration`.
   This is the existing acceptance lineage and must remain the `review` ref in
   the verify run input. Reject a Phase result, wrong task, changed bytes, or a
   snapshot different from the fresh tests/current Workspace. The new
   verify-code review must never replace this ref.
7. After the fresh test receipt and every acceptance-evidence leaf are complete,
   run configured `wh-review` with `stage: "verify-code"`, the authenticated
   TaskHandle identity, current host provider, and only
   `acceptance_criteria`, structured `acceptance_evidence`, `open_exceptions`,
   `context_map`, and `evidence_map`. The evidence material contains the
   schema-validated `ac-evidence-summary.v1`: exactly one row per accepted AC
   with acceptance leaf, nested evidence, and test receipt ref/SHA-256 plus
   scenario/oracle/outcome/limits/exceptions. Unknown source semantics remain
   explicit `unknown`; raw logs, full canonical evidence trees, full codebases,
   and copied build-code diffs are forbidden. Do not select providers, models,
   or a review round. Record the returned result/attempt and report it as a
   quality fact. Do not put it in `$TMP_DIR/run.json`, acceptance-evidence
   leaves, or `facts.review`.

   If that first review is `revise_required`, normal repair records a bound
   response ledger and does not call a provider again. Only a complete ledger
   that explicitly declares structural changes to direction, ACs, interface,
   schema, state, security, concurrency, topology, phase order, or test
   strategy permits one fresh full re-review. That re-review uses the configured
   initial route, does not receive the ledger, is capped at one, and remains a
   non-gate quality fact. Missing, invalid, or unavailable review evidence is
   recorded honestly and goes to the human verify summary; it never blocks or
   silently passes the stage.
8. After evidence assembly, create `$TMP_DIR/run.json` with exactly:
   `{"receipts":{"tests":"receipts/verify-tests.json","review":"<active accepted build-code final review result-or-unavailable-attempt ref>","evidence":"evidence/verify-evidence.json"}}`.
   Publish the append-only pass or fail attempt with
   `node scripts/stage-runtime.mjs run --stage=verify-code
   --project=<project> --task=<task> --input=$TMP_DIR/run.json`.
   After `run` consumes the final input, let the host reclaim `$TMP_DIR`
   through its normal OS temporary lifecycle. Never treat the temporary path as
   a stage artifact, evidence ref, or handoff item. Present a plain-language gate
   brief with exactly four items: current status; next step and owner; whether
   the user must act; and, when action is required, the problem, a recommended
   option, and every option's consequence and risk. Record the verification-stage
   decision with `confirm`, and pass only its accepted ref to `accept`. This
   confirmation accepts verification facts only.
9. After verify-code is accepted, run `scripts/task-close.mjs prepare` with the
   explicit task path and identity, task branch, target branch, remote, task
   snapshot commit from the current canonical accepted verification facts,
   accepted spec path,
   and archive path. `prepare` accepts the still-uncommitted worktree only when
   its freshly captured tree exactly matches that snapshot commit and the
   snapshot parent is the current task-branch tip. The frozen plan contains exactly
   six actions: commit delivery, archive and commit the spec, merge the task
   branch from the main checkout, push the target branch, remove the task
   worktree, and remove the merged local task branch. Show a plain-language summary
   of the six actions, their affected targets, consequences, and risks for one
   separate close authorization. Keep the plan hash as the internal binding and
   do not display it in the public decision card.
   Never reuse the verify-code confirmation ref.
   For a legacy task without `runner_root`, do not edit `task.json`. First run
   `node scripts/task-migrate-runner-root.mjs --task-path=<task-path>
   --project=<project> --task=<task> --runner-root=<runner-root>
   --stage=verify-code`, then authenticate the existing task read-only with
   `node scripts/task-bootstrap.mjs --task-path=<task-path> --project=<project>
   --task=<task> --runner-root=<runner-root> --stage=verify-code`. The public
   `stage-runtime.mjs` authenticates its own runner root and forbids caller
   injection; do not pass `--runner-root` to it.
   If `prepare` rejects the recorded target because it is not the real checked-out
   target branch, do not edit `task.json`. Use the official
   `node scripts/task-migrate-target-repo.mjs --project=<project> --task=<task>
   --target-repo-root=<main-checkout> --target-branch=<branch>` entrypoint. It
   requires the same Git common directory as the accepted workspace, records
   immutable migration lineage, atomically updates the target identity, and must
   finish before a fresh `prepare` run.
10. Record that one decision with `scripts/task-close.mjs confirm`. Only a
   `confirmed` result authorizes all six plan-bound actions; rejection or timeout
   performs none of them. Do not ask again before each command.
11. Run `scripts/task-close.mjs execute` with the plan hash and close confirmation
   ref. The controlled executor rechecks the target checkout, clean state, and
   frozen local/remote baselines before its first Git write, then performs the
   fixed six actions in order. It uses `--no-ff --no-edit` merge and a non-force
   push, stops at the first failure, and reconciles already completed physical
   actions on retry. Do not issue the six Git operations by hand.
12. Run `scripts/task-close.mjs status` with the same explicit identity and plan
    hash. It reads live local and remote facts and reports completed and missing
    actions. Only `record_status: completed` together with physical
    `status: ready` permits reporting close complete. Never infer a task path
    during recovery.

Quality failures remain visible facts. Identity, lineage, hash, and capability
failures stop before verification because continuing would inspect another task.

## Host interaction and completion handoff

Procedure actions named `ask`, `wait`, or `present` must be projected onto a
host-visible conversation surface. The invoking host owns delivery and resume;
WorkflowHub neither identifies a host user nor derives a conversation address.
Every public message uses the user's language, short Markdown headings, and
bullets. For Chinese, start with `## **当前状态**`, then `## **下一步**`, then
`## **需要你处理吗**`. Keep each section brief and use plain language a
high-school student can understand. Raw paths, hashes, receipt or attempt refs,
runner details, shell commands, and internal identifiers stay in formal records;
the public message names only the human-readable artifact and result. The close
card explains the six actions, affected branches or workspaces in human terms,
and their consequences and risks; its plan hash remains an internal binding.
Use one card type only. A milestone card contains current progress, the next
step, and whether user action is required. A review card reports actual
providers, verdict, important findings, disposition, and next step. A question
card contains only the current status, question, affected scope, and options.
Report duration and token usage only when supplied by formal review/runtime facts;
otherwise state `not provided`, and never estimate them.
An unchanged milestone or reused review result is not published again.
Ask and wait for the user only at the existing verification or close decision,
or when an answer can change accepted scope. When user action is required,
present the problem, one recommended option with its reason, mutually exclusive
choices, and each choice's consequence and risk. Otherwise state
`user action: none`.

The final handoff states the overall solution, what was implemented, observed
behavior, fresh tests, and remaining risks in that order.

Before the Stage completes, report Stage-owned component facts using
`skill-deps.yaml` as the declared baseline: every `always` component is
`executed`; every `conditional` component is either `executed` or
`trigger=false — <reason>`. Cross-check the list with formal artifacts and
canonical `wh-review` refs. Reviewer-owned diagnostic lenses appear only
through their review refs and are never invoked a second time by the Stage.

Publish one concise completion handoff containing the stage result, human-readable
artifact names, test and review conclusions, downstream dependencies, unresolved
risks, next owner, and user action. Do not copy artifacts or raw logs. The
invoking host must deliver the same concise facts to its close handoff surface
and parent progress surface. If verification returns invalid upstream input,
the host must return the finding and completion condition to the upstream owner
through those host-owned surfaces;
do not poll or invent a host-specific recovery mechanism.

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
