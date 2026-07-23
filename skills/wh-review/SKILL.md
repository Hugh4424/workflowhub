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

## Commands

Production callers use only:

```bash
node skills/wh-review/scripts/wh-review-cli.mjs run < input.json
node skills/wh-review/scripts/wh-review-cli.mjs verify-final < input.json
```

Send the input JSON over stdin. Never place a transient review-input file in
the runner, target repository, CandidateWorkspace, or TaskHandle. If the host
cannot pipe stdin, use `mktemp` under its OS temporary directory and delete the
file in the same foreground command; task storage is only for canonical output.

Before the first call, read this file and `stage-materials.json`; do not guess
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
Required `materials` keys come directly from `stage-materials.json`:

- make-decision/direction: `raw_requirement`, `objective_facts`;
- make-decision/detail: `raw_requirement`, `approved_direction`,
  `draft_spec_or_acceptance`;
- build-spec: `raw_requirement`, `approved_decision`, `draft_spec`;
- build-plan: `approved_spec`, `acceptance_criteria`, `draft_plan`, `draft_tasks`;
- build-code: `approved_spec`, `acceptance_criteria`, `test_evidence`;
- verify-code: `acceptance_criteria`, `acceptance_evidence`, `open_exceptions`.

`stage-materials.json` is a strict allowlist: each stage exposes only required
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
The ledger is controller/audit data and is never sent in a full-review packet.
`accepted_risk` is recorded and must be shown at the build-plan or verify-code
human boundary; it does not auto-escalate or block. Callers cannot select a
round. V2 host configuration fixes make-decision to `single_round`,
build-spec/build-plan/verify-code to `full_on_structural_rework`, and
build-code to `full_only`; therefore a V2 non-code stage cannot select a cheap
closure review. Build-code never uses this shortcut: every repaired phase runs
a fresh complete phase review, with its existing strict full-review behavior
unchanged.

The runner supplies `review_instructions`; callers must not add it. A
`build-code` phase review also adds `phase_id`. `verify-final` replaces
`materials` and `host_provider` with `result_ref` and reuses the
same task/stage identity.

There is no reset, recover, flow migration, projection repair, or trusted-base rewrite command. Local input validation fails before an attempt exists; fix the JSON from this public contract and call again. A provider or protocol failure creates an immutable unavailable attempt. A later retry uses the same public contract and host-owned provider routing; it must not guess fields, providers, or models.

## Inputs

`run` receives the absolute `task_path` and expected project/task identity from the parent sidecar launcher, plus the stage, optional review track, and frozen materials. A `build-code` phase review also receives only `phase_id`; arbitrary paths, diffs, commit ranges, providers, and models are forbidden. It opens a branded TaskHandle and never reads global storage configuration or derives a task path. The stage matrix is `stage-materials.json`; the reviewer contract is `contracts/<stage>.md`.

For a normal worktree review, the host captures tracked changes, deletions, modes, symlinks, and non-ignored untracked files through a temporary Git index. It captures twice and rejects a changing source. For a `build-code` phase review, the host resolves the current phase's `phase-diff-scan.v1` evidence and regenerates the complete `base_tree..candidate_tree` diff itself. Runtime files are written outside the source repository.

The provider receives only the frozen bundle. It must not read the source repository, host paths, Git, shell, or network. Every provider-visible byte is bound by `material_id`; the captured source is bound by `snapshot_tree`.

Each bundle also contains `packet-plan.json`: every included file has its byte
count, authority level, inclusion reason and map relation; contract-forbidden
material is listed with its exclusion reason. Bytes are telemetry only: there
is no configured packet cap, size rejection, truncation, or phase-splitting
rule. A code review carries the complete phase diff and only map-selected
direct-context excerpts plus deterministic `change-map.json`; raw evidence logs
remain canonical audit records. For build-code, anchors default to unmodified
direct dependencies. A changed-file anchor needs `outside_diff_reason` and may
contain only candidate lines outside every unified-diff hunk; an overlap fails
loud instead of duplicating changed code. The plan lists every payload file and
also its own `packet-plan.json` and sealed `manifest.json` metadata entries.

## Attempts and results

Only two durable record types exist:

- `attempt`: transport、material、provider status 和公开错误。它可能以 `unavailable` 结束；不保存 broker raw output、raw hash 或路径。
- `result`: a valid semantic `pass` or `revise_required` bound to `material_id` and its declared review subject. A phase result records `phase_id`, `base_tree`, and `candidate_tree`; a worktree result records the captured `snapshot_tree`.

Every attempt also publishes `reviews/reports/<attempt-id>.md`. It is rendered
only from canonical public facts: route/profile/model/thinking, duration and
token usage (or unavailability), runtime/session IDs, coverage, every
provider's findings, root causes, correction direction, and unavailable
diagnostics. It always renders `SESSION_PATH_UNAVAILABLE`; broker runtime and
native CLI session paths remain provider-private.

Transport success is not review success. Authentication, cancellation, timeout, malformed output, missing material, and protocol failure never become a semantic verdict. Managed nonzero transport stderr is never retained; it becomes a fixed public `PROTOCOL_INCOMPATIBLE` diagnostic.

CLI success returns a task-relative `result_ref` and `snapshot_tree`. Stage results store only that pair:

```json
{"result_ref":"reviews/results/<result>.json","snapshot_tree":"<git-tree>"}
```

Consumers open the referenced formal result and do not trust a copied verdict. `make-decision` stores separate `direction` and `detail` refs; any `revise_required` wins, both must pass, otherwise the stage is unavailable.

## Host-visible review brief

Return enough trusted facts for the invoking Stage to publish one plain-language
review brief: reviewed subject, actual providers, aggregate verdict, up to three
important findings, and the intended disposition. Include duration and token
usage only when the formal provider/runtime result supplies them. When either is
absent, report `not provided`; never estimate it, inspect broker-private state,
or rerun an unchanged review just to obtain metrics. A reused result for the
same snapshot/material produces no second public brief.

## Provider protocol

3rd-review exposes managed public `workflowhub-run.v1` `start/status` and a terminal `workflowhub-result.v2` group. wh-review uses a deterministic request ID to reconnect the same runtime, polls without a review deadline, and never falls back to blocking `run` or reads broker private state, attachment workspaces, or `/tmp/3rd-review`. A terminal group must expose `raw_output_ref: null`; canonical attempts store only public profile, timing, usage, retry, runtime/session IDs and normalized public errors. Session reuse is an optional optimization, not proof of correctness. A retry always sends the complete current bundle. A format correction or fresh session is transport recovery, not a cap on later formal review attempts; every failed attempt remains immutable evidence. Build-code has no cycle, time, token, output-size, or repeated-finding stop rule: every repaired phase is reviewed again from its complete current frozen material until its formal review is `pass`.

Reviewer output is one JSON object with `verdict`, `summary`, and `findings`. Pure JSON, one unique fenced JSON object, or one terminal JSON object after prose with no fenced block or competing review object is accepted. Host identifiers and hashes are host-owned and are not required in model prose.

## Final gate

`verify-final` accepts only a worktree result. It recaptures the source and requires the current tree to equal `result.snapshot_tree`; a phase result returns `PHASE_RESULT_NOT_FINAL` because a partial review cannot authorize commit or merge. A worktree mismatch returns `WORKTREE_CHANGED_AFTER_REVIEW`; run the final review again. Phase results are consumed only by phase-gate, which compares their `phase_id`, `base_tree`, and `candidate_tree` with the current phase evidence.

Human risk acceptance belongs to the stage execution record. It never edits the review result, and it cannot turn `unavailable` into `pass`.
