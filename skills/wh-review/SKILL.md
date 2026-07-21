---
name: wh-review
description: Freeze the current source and stage evidence, ask independent providers to review it, and publish one formal result.
---

# wh-review

`wh-review` captures one source snapshot, builds one complete material bundle, asks independent providers to review only that bundle, and publishes one result. It records quality facts; the human stage boundary makes the quality decision.

## Commands

Production callers use only:

```bash
node skills/wh-review/scripts/wh-review-cli.mjs run "$TMP_DIR/review.json"
node skills/wh-review/scripts/wh-review-cli.mjs verify-final "$TMP_DIR/verify-final.json"
```

Write the input JSON to the stage's existing OS temporary directory and pass
only that short file path to the CLI. Never inline the JSON in a shell command.
Never place a transient review-input file in the runner, target repository,
CandidateWorkspace, or TaskHandle. Delete the temporary directory through its
normal OS lifecycle; task storage is only for canonical output.

Before the first call, read this file and `stage-materials.json`; do not guess
field names or provider aliases. A normal review input has this exact shape:

```json
{
  "task_path": "/absolute/task-handle/path",
  "project_name": "project",
  "task_id": "task",
  "stage": "build-spec",
  "host_provider": "codex",
  "providers": ["claude-code"],
  "materials": {
    "raw_requirement": "...",
    "approved_decision": "...",
    "draft_spec": "..."
  }
}
```

`host_provider` is the exact current host ID. `providers` contains exact IDs
from the configured 3rd-review provider registry and must not contain the host;
never shorten `claude-code` to `claude` or invent names such as `gemini`.
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
`materials`, `host_provider`, and `providers` with `result_ref` and reuses the
same task/stage identity.

There is no reset, recover, flow migration, projection repair, or trusted-base rewrite command. Local input validation fails before an attempt exists; fix the JSON from this public contract and call once. A provider or protocol failure creates an immutable unavailable attempt; do not retry the same material with guessed fields or provider names.

If the host reports a transport interruption or cancellation, keep the exact
input file and frozen source unchanged and repeat the same short command once.
If the first command produced an immutable unavailable attempt, preserve it;
the one retry is a new attempt over the same complete material. After a second
technical failure, stop with the real diagnostic. Do not change providers,
models, runtime configuration, authentication, or platform code to make a
review pass.

## Inputs

`run` receives the absolute `task_path` and expected project/task identity from the parent sidecar launcher, plus the stage, optional review track, frozen materials, and provider selection. A `build-code` phase review also receives only `phase_id`; arbitrary paths, diffs, and commit ranges are forbidden. It opens a branded TaskHandle and never reads global storage configuration or derives a task path. The stage matrix is `stage-materials.json`; the reviewer contract is `contracts/<stage>.md`.

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

## Provider protocol

3rd-review exposes only the public `workflowhub-result.v1` contract. wh-review never reads broker private state, attachment workspaces, or `/tmp/3rd-review`. Session reuse is an optional optimization, not proof of correctness. A retry always sends the complete current bundle. One same-session format correction is allowed; if the session is unavailable, one fresh complete review is allowed.

Reviewer output is one JSON object with `verdict`, `summary`, and `findings`. Pure JSON or one unique fenced JSON object is accepted. Host identifiers and hashes are host-owned and are not required in model prose.

## Final gate

`verify-final` accepts only a worktree result. It recaptures the source and requires the current tree to equal `result.snapshot_tree`; a phase result returns `PHASE_RESULT_NOT_FINAL` because a partial review cannot authorize commit or merge. A worktree mismatch returns `WORKTREE_CHANGED_AFTER_REVIEW`; run the final review again. Phase results are consumed only by phase-gate, which compares their `phase_id`, `base_tree`, and `candidate_tree` with the current phase evidence.

Human risk acceptance belongs to the stage execution record. It never edits the review result, and it cannot turn `unavailable` into `pass`.
