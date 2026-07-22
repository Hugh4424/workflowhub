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
or models. `wh-review` selects every enabled heterologous provider from the
first usable tier in the host-owned 3rd-review config. Changing routing belongs
to that config, never to a Stage prompt or review request.
Required `materials` keys come directly from `stage-materials.json`:

- make-decision/direction: `raw_requirement`, `objective_facts`;
- make-decision/detail: `raw_requirement`, `approved_direction`,
  `draft_spec_or_acceptance`;
- build-spec: `raw_requirement`, `approved_decision`, `draft_spec`;
- build-plan: `approved_spec`, `acceptance_criteria`, `draft_plan`;
- build-code: `approved_spec`, `acceptance_criteria`, `test_evidence`;
- verify-code: `acceptance_criteria`, `acceptance_evidence`, `open_exceptions`.

The runner supplies `review_instructions`; callers must not add it. A
`build-code` phase review also adds `phase_id`. `verify-final` replaces
`materials` and `host_provider` with `result_ref` and reuses the
same task/stage identity.

There is no reset, recover, flow migration, projection repair, or trusted-base rewrite command. Local input validation fails before an attempt exists; fix the JSON from this public contract and call again. A provider or protocol failure creates an immutable unavailable attempt. A later retry uses the same public contract and host-owned provider routing; it must not guess fields, providers, or models.

## Inputs

`run` receives the absolute `task_path` and expected project/task identity from the parent sidecar launcher, plus the stage, optional review track, and frozen materials. A `build-code` phase review also receives only `phase_id`; arbitrary paths, diffs, commit ranges, providers, and models are forbidden. It opens a branded TaskHandle and never reads global storage configuration or derives a task path. The stage matrix is `stage-materials.json`; the reviewer contract is `contracts/<stage>.md`.

For a normal worktree review, the host captures tracked changes, deletions, modes, symlinks, and non-ignored untracked files through a temporary Git index. It captures twice and rejects a changing source. For a `build-code` phase review, the host resolves the current phase's `phase-diff-scan.v1` evidence and regenerates the complete `base_tree..candidate_tree` diff itself. Runtime files are written outside the source repository.

The provider receives only the frozen bundle. It must not read the source repository, host paths, Git, shell, or network. Every provider-visible byte is bound by `material_id`; the captured source is bound by `snapshot_tree`.

## Attempts and results

Only two durable record types exist:

- `attempt`: transport, material, provider status, raw output references, and errors. It may end `unavailable`.
- `result`: a valid semantic `pass` or `revise_required` bound to `material_id` and its declared review subject. A phase result records `phase_id`, `base_tree`, and `candidate_tree`; a worktree result records the captured `snapshot_tree`.

Transport success is not review success. Authentication, cancellation, timeout, malformed output, missing material, and protocol failure never become a semantic verdict. Raw provider output is retained in the attempt.

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

3rd-review exposes only the public `workflowhub-result.v1` contract. wh-review never reads broker private state, attachment workspaces, or `/tmp/3rd-review`. Session reuse is an optional optimization, not proof of correctness. A retry always sends the complete current bundle. A format correction or fresh session is transport recovery, not a cap on later formal review attempts; every failed attempt remains immutable evidence.

Reviewer output is one JSON object with `verdict`, `summary`, and `findings`. Pure JSON or one unique fenced JSON object is accepted. Host identifiers and hashes are host-owned and are not required in model prose.

## Final gate

`verify-final` accepts only a worktree result. It recaptures the source and requires the current tree to equal `result.snapshot_tree`; a phase result returns `PHASE_RESULT_NOT_FINAL` because a partial review cannot authorize commit or merge. A worktree mismatch returns `WORKTREE_CHANGED_AFTER_REVIEW`; run the final review again. Phase results are consumed only by phase-gate, which compares their `phase_id`, `base_tree`, and `candidate_tree` with the current phase evidence.

Human risk acceptance belongs to the stage execution record. It never edits the review result, and it cannot turn `unavailable` into `pass`.
