---
name: wh-review
description: Freeze the current source and stage evidence, ask independent providers to review it, and publish one formal result.
---

# wh-review

`wh-review` captures one source snapshot, builds one complete material bundle, asks independent providers to review only that bundle, and publishes one result. It records quality facts; the human stage boundary makes the quality decision.

Before starting a provider attempt, the runner checks canonical results for the
same task, stage, track, subject identity, snapshot tree, and material ID. An
existing valid semantic result is returned unchanged. A changed draft creates a
new attempt. An unavailable transport attempt is retained as evidence but never
sets a numeric limit on later formal retries of the same draft.

Every review brief names the actual providers, aggregate verdict, and important findings from formal review/runtime facts; it never invents metrics or provider details.
The formal provider/runtime result reports duration and token usage, or says
`not provided` when those facts are unavailable.
Never estimate or rerun an unchanged review.

## Commands

Production callers use only:

```bash
node skills/wh-review/scripts/wh-review-cli.mjs run < input.json
node skills/wh-review/scripts/wh-review-cli.mjs format-correct < input.json
node skills/wh-review/scripts/wh-review-cli.mjs verify-final < input.json
node skills/wh-review/scripts/wh-review-cli.mjs adopt-legacy-root < input.json
node skills/wh-review/scripts/wh-review-cli.mjs doctor
```

`doctor` 只读扫描宿主 `wh_review` 的全部 stage/track 路由；任一 profile、
priority、重复项或模式错误都以非零退出。正常 review 热路径只严格校验当前
请求的 stage×track，其他路由错误输出 warning，不阻断当前请求。

Send the input JSON over stdin. Never place a transient review-input file in
the runner, target repository, CandidateWorkspace, or TaskHandle. If the host
cannot pipe stdin, use `mktemp` under its OS temporary directory and delete the
file in the same foreground command; task storage is only for canonical output.

`adopt-legacy-root` is the approved bootstrap-only bridge for a canonical
semantic initial result that predates the TaskKernel review-flow event stream.
Its input contains only the normal TaskHandle locator, `stage`, and
`result_ref`. TaskKernel derives the workflow identity and accepts exactly one
same-subject root while the stage is still open. It fails loud on ambiguous,
stale, cross-subject, malformed, or already-followed results, never calls a
provider, and forbids caller-supplied `workflow_run_id`.

`format-correct` is available only for one immutable unavailable attempt whose
provider completed with invalid reviewer JSON. It rebuilds and verifies the
same frozen material, sends exactly `FORMAT_CORRECTION_PROMPT` through that
attempt's managed runtime continuation, preserves the original output, and
publishes the corrected semantic result only when the correction itself is
valid reviewer JSON. Its input is the normal review input plus exactly
`format_correction_attempt_ref`; it cannot choose a provider, model, or a
follow-up review chain. A failed or still-invalid correction remains
`unavailable`.

Before the first call, read this file and `runtime/review/stage-materials.json`; do not guess
field names. A normal review input has this exact shape:

```json
{
  "task_path": "/absolute/task-handle/path",
  "project_name": "project",
  "task_id": "task",
  "stage": "build-spec",
  "host_provider": "codex",
  "materials": {
    "raw_requirement": "...",
    "approved_decision": "...",
    "draft_spec": "..."
  }
}
```

`host_provider` is the exact current host ID. Callers must not select providers
or models. `wh-review` resolves the stage policy from `wh_review.v2` in the
trusted WorkflowHub configuration (or falls back to the legacy 3rd-review
route), then sends the complete configured candidate group once to 3rd-review.
`wh_review.profiles` pins each routed profile's model, effort, thinking mode,
and numeric priority (smaller runs earlier). WorkflowHub checks the pin against
the trusted 3rd-review config before dispatch and rejects a returned v2 tuple
that differs as `PROFILE_MISMATCH`; it never overrides adapter commands or
credentials. The trusted 3rd-review config remains the only execution registry
and attachment allowlist; callers never provide a broker config path.
When `profiles` is present, every ID in that route must be pinned and each
`initial`/`closure` list must already be sorted by ascending priority; equal
priorities retain list order. A legacy route without `profiles` keeps the
existing array-order behavior. An omitted `wh_review` stage is not a skipped
review: it falls back to the trusted 3rd-review default tiers.

Example host configuration:

```json
{
  "wh_review": {
    "version": 2,
    "profiles": {
      "claude-code/opus": {
        "model": "claude-opus-4-8",
        "effort": "high",
        "thinking": null,
        "priority": 10
      },
      "kimi/coding": {
        "model": "kimi-code/kimi-for-coding",
        "effort": null,
        "thinking": true,
        "priority": 20
      }
    },
    "stages": {
      "build-code": {
        "initial": ["claude-code/opus", "kimi/coding"],
        "mode": "full_only",
        "minimum_heterologous": 1
      }
    }
  }
}
```

3rd-review, not WorkflowHub, is the final adapter-isolation authority: host
and duplicate adapters are returned as public `SAME_SOURCE` records without a
CLI call. WorkflowHub records the eligible unique-adapter quorum from that
attested group. Changing routing belongs to trusted configuration, never to a
Stage prompt or review request.
Required `materials` keys come directly from `runtime/review/stage-materials.json`:

- make-decision/direction: `raw_requirement`, `objective_facts`;
- make-decision/detail: `raw_requirement`, `approved_direction`,
  `draft_spec_or_acceptance`;
- build-spec: `raw_requirement`, `approved_decision`, `draft_spec`;
- build-plan: `approved_spec`, `acceptance_criteria`, `draft_plan`, `draft_tasks`;
- build-code/phase: `approved_spec`, `acceptance_criteria`, `test_evidence`;
- build-code/integration: `approved_spec`, `acceptance_criteria`,
  `test_evidence`, `phase_coverage`, `seam_index`, `ac_trace`;
- verify-code: `acceptance_criteria`, `acceptance_evidence`, `open_exceptions`.

`runtime/review/stage-materials.json` is a strict allowlist: each stage exposes only required
and declared optional material. `review_instructions` and packet metadata are
runner-generated. Only a closure round may additionally carry
`response_ledger` and runner-generated `previous_review`; arbitrary fields,
raw-output references and caller-supplied generated material fail before any
provider call.

For a follow-up after `revise_required`, the caller may supply the canonical
`previous_result_ref` plus a `response_ledger` in `materials`. For
`full_on_structural_rework`, build-spec, build-plan and verify-code treat the
first review as a quality fact, not a pass gate. Verify-code runs its initial
configured review only after its fresh tests and acceptance evidence are
complete; it never replaces the accepted build-code final review used for
verify-stage lineage. A normal repair makes no second provider call; WorkflowHub writes an external
`wh-review-resolution.v1` audit record with `verified` or `unverified`
evidence state. It never claims `fixed` or `pass` when that evidence is absent.
Only when a complete, bound ledger explicitly declares a change to direction,
AC, interface, schema, state, security, concurrency, topology, phase order or
test strategy, it runs at most one
fresh full review through the initial high-strength group. That second finding
set is also a quality fact: it neither loops nor decides stage acceptance.
After that one structural full review, a complete ledger may mark its findings
`fixed` or `accepted_risk`; WorkflowHub records only a zero-provider resolution
action. It does not review again, move the semantic head, change the persisted
verdict, or claim `pass`.
The ledger is controller/audit data and is never sent in a full-review packet.
`accepted_risk` is recorded and must be shown at the build-plan or verify-code
human boundary; it does not auto-escalate or block. Callers cannot select a
round. V2 host configuration fixes make-decision to `single_round`,
build-spec/build-plan/verify-code to `full_on_structural_rework`, and
build-code to `full_only`; therefore a V2 non-code stage cannot select a cheap
closure review. Build-code never uses this shortcut: each repaired snapshot is
a new Phase identity and receives one fresh complete phase review. Its original
quality verdict is preserved; it does not loop on one frozen identity until
`pass`.

The runner supplies `review_instructions`; callers must not add it. A
`build-code` phase review also adds `phase_id`. `verify-final` replaces
`materials` and `host_provider` with `result_ref` and reuses the
same task/stage identity.

There is no reset, recover, flow migration, projection repair, or trusted-base rewrite command. Local input validation fails before an attempt exists; fix the JSON from this public contract and call again. A provider or protocol failure creates an immutable unavailable attempt. A later retry uses the same public contract and host-owned provider routing; it must not guess fields, providers, or models.

## Inputs

`run` receives the absolute `task_path` and expected project/task identity from the parent sidecar launcher, plus the stage, optional review track, and frozen materials. A `build-code` phase review also receives only `phase_id`; arbitrary paths, diffs, commit ranges, providers, models, or `review_scope` are forbidden. It opens a branded TaskHandle and never reads global storage configuration or derives a task path. The runtime-owned stage matrix is `runtime/review/stage-materials.json`; the reviewer contract is `contracts/<stage>.md`.

`build-code` has two non-interchangeable subjects. With `phase_id`, the runner
derives `review_scope=phase`, resolves the current `phase-diff-scan.v1`, and
regenerates the complete frozen `base_tree..candidate_tree` diff. Without
`phase_id`, it derives `review_scope=integration` for the final worktree
review. Integration first reconstructs one unique continuous, formally
reviewed Phase-trace chain from the accepted build-plan checkpoint to the final
tree;
it validates the current test identity and AC trace before it can call a
provider. A missing, branched, stale, or legacy-only trace is
`MATERIAL_INCOMPLETE`, not a reason to send a cumulative diff. A legacy final
result without `review_scope=integration` cannot authorize final verification;
it may be rerun only when the same-snapshot canonical coverage, trace, AC, and
test facts are complete. Runtime files are written outside the source
repository.

The provider receives only the frozen bundle. It must not read the source repository, host paths, Git, shell, or network. Every provider-visible byte is bound by `material_id`; the captured source is bound by `snapshot_tree`.

Each bundle also contains `packet-plan.json`: a compact material-category plan
with selected context and exclusion reasons. `manifest.json` is the only
complete provider-visible file byte/hash list. A Phase diff up to 320 KiB keeps
the existing complete `changes.diff` delivery. A larger diff is stored in the
runner's hash-addressed canonical archive and delivered through
`diff-index.json` plus selected shards. The index binds the full
ref/hash/bytes/lines, every change/hunk ID and shard hash. Missing or tampered
selected shards and incomplete change-ID coverage fail before dispatch.
Code/contract shards are included; test, fixture and evidence shards may be
summarized with anchors. `packet-plan.delivery_mode` and the manifest report
the actual delivery. Selected-context packets are capped at 330 KiB and fail
before dispatch when the compact, self-contained packet exceeds that limit.
The full approved spec and authority maps remain hash-addressed canonical audit
material; providers receive Phase-relevant requirement excerpts and compact
ID/anchor/test-reference maps. For Phase material, anchors default to unmodified direct dependencies.
Selected-context delivery keeps context excerpts in canonical audit storage
and does not send separate context files. The diff index keeps only compact
`anchor_id -> shard_id,line` references. The provider change map is compact;
its full form remains canonical audit material.
A changed-file anchor needs `outside_diff_reason` and may contain only candidate
lines outside every unified-diff hunk; an overlap fails loud instead of
duplicating changed code. An integration packet carries no `changes.diff`,
historical Phase diff, cumulative diff, raw log, complete project, or duplicate
`integration_map`: it carries its coverage chain, seam index, AC trace, fresh
test summary, and only their selected final-snapshot excerpts.

## Attempts and results

Only two durable record types exist:

- `attempt`: transport, material, provider status, and public diagnostics. It may end `unavailable`; it contains neither raw output nor broker-private paths.
- `result`: a valid semantic `pass` or `revise_required` bound to `material_id` and its declared review subject. A phase result records `phase_id`, `base_tree`, and `candidate_tree`; a worktree result records the captured `snapshot_tree`.

Every attempt also publishes `reviews/reports/<attempt-id>.md`. It is rendered
only from public canonical facts: route/profile/model/effort/thinking, duration
and token usage (or unavailability), runtime/session IDs, coverage, every
provider's findings, root causes, correction direction, and unavailable
diagnostics. It always renders `SESSION_PATH_UNAVAILABLE`; broker runtime and
native CLI session paths remain provider-private and are never invented.

Transport success is not review success. Authentication, cancellation, malformed
output, missing material, and protocol failure never become a semantic verdict.
The broker supervises provider liveness; WorkflowHub polls the same managed
request without a wall-clock review deadline and never reads broker-private
state to decide that a healthy review has stopped.

CLI success returns a task-relative `result_ref` and `snapshot_tree`. Stage results store only that pair:

```json
{"result_ref":"reviews/results/<result>.json","snapshot_tree":"<git-tree>"}
```

Consumers open the referenced formal result and do not trust a copied verdict.
`make-decision` stores separate `direction` and `detail` actions. Semantic
`pass` or `revise_required`, and authenticated `unavailable`, remain provider
quality facts; none is rewritten as a stage pass/fail result. Only an
authenticated actionable `major|blocking` finding opens the separate
repair-or-risk pause.

## Provider protocol

3rd-review exposes only the public managed `workflowhub-run.v1` start/status
and terminal `workflowhub-result.v2` group. wh-review never reads broker private
state, attachment workspaces, or `/tmp/3rd-review`. The canonical attempt stores
only public profile, timing, usage, retry, runtime/session IDs, and normalized
public diagnostics. Session reuse is an optional optimization, not proof of
correctness. A retry always sends the complete current bundle. A format
correction or fresh session is transport recovery, not a cap on later formal
review attempts; every failed attempt remains immutable evidence. Build-code
has no cycle, time, token, output-size, or repeated-finding stop rule. Every
repaired snapshot is a new Phase identity and receives one review from its
complete frozen material; a single frozen identity is never reviewed repeatedly
until its provider verdict becomes `pass`.

### Finding aggregation

Only parse-valid `pass` or `revise_required` outputs from eligible adapters
enter semantic aggregation. If a broker returns multiple successful profiles
for one adapter, only the configured highest-priority profile represents that
adapter; priority is not an intelligence score and never makes a finding true.
The runner clusters equivalent findings by packet path, line, and normalized
issue text, then preserves every provider attribution in the cluster.

- A `blocking` or `major` cluster is actionable only with a valid direct or
  machine anchor, or with matching inferred evidence from at least two distinct
  adapters.
- An invalid direct/machine anchor is `invalid_evidence`; one inferred adapter
  is `needs_corroboration`. Neither changes the semantic verdict.
- `minor` clusters are reported as nonblocking. A `revise_required` verdict
  exists only when at least one actionable cluster exists.

This avoids trusting a provider merely for brand, cost, or transient model
quality while retaining concrete single-reviewer evidence.

Reviewer output is one JSON object with `verdict`, `summary`, and `findings`. Pure JSON or one unique fenced JSON object is accepted. Host identifiers and hashes are host-owned and are not required in model prose.

## Final gate

`verify-final` accepts only a same-snapshot worktree result with
`review_scope=integration`. It recaptures the source and requires the current
tree to equal `result.snapshot_tree`; a Phase result, a legacy worktree result,
or an integration-scope mismatch cannot authorize commit or merge. A worktree
mismatch returns `WORKTREE_CHANGED_AFTER_REVIEW`; run the final integration
review again. Phase results are consumed only by phase-gate, which compares
their `phase_id`, `base_tree`, and `candidate_tree` with the current Phase
evidence. For build-code integration, `pass` and `revise_required` are both
authenticated quality facts; finalization preserves the original verdict and
does not claim that the stage passed.

Human risk acceptance belongs to the stage execution record. It never edits the review result, and it cannot turn `unavailable` into `pass`.
