---
name: wh-review
description: Freeze the current source and stage evidence, ask independent providers to review it, and publish one formal result.
---

# wh-review

`wh-review` is a small quality gate: capture one source snapshot, build one complete material bundle, ask independent providers to review only that bundle, and publish one result.

## Commands

Production callers use only:

```bash
node skills/wh-review/scripts/wh-review-cli.mjs run < input.json
node skills/wh-review/scripts/wh-review-cli.mjs verify-final < input.json
```

There is no reset, recover, flow migration, projection repair, or trusted-base rewrite command. A failed invocation creates only an immutable attempt. Fix the reported problem and run again.

## Inputs

`run` receives `task_id`, `stage`, optional `review_track`, source worktree information, the required stage material paths, and provider selection. The stage matrix is `stage-materials.json`; the reviewer contract is `contracts/<stage>.md`.

The host captures tracked changes, deletions, modes, symlinks, and non-ignored untracked files through a temporary Git index. It captures twice and rejects a changing source. Runtime files are written outside the source repository.

The provider receives only the frozen bundle. It must not read the source repository, host paths, Git, shell, or network. Every provider-visible byte is bound by `material_id`; the captured source is bound by `snapshot_tree`.

## Attempts and results

Only two durable record types exist:

- `attempt`: transport, material, provider status, raw output references, and errors. It may end `unavailable`.
- `result`: a valid semantic `pass` or `revise_required` bound to `material_id` and `snapshot_tree`.

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

`verify-final` takes a formal `result_ref`, recaptures the source with the same temporary-index algorithm, and requires the current tree to equal `result.snapshot_tree`. A mismatch returns `WORKTREE_CHANGED_AFTER_REVIEW`; run review again. Only a passing result plus successful `verify-final` may authorize commit or merge.

Human risk acceptance belongs to the stage execution record. It never edits the review result, and it cannot turn `unavailable` into `pass`.
