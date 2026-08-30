---
name: wh-review
description: Send current-stage materials to configured heterologous reviewers and return their real findings.
version: 4.0.0
---

# wh-review

## Purpose

`wh-review` does one thing: review the bytes submitted in the current call with the current stage's review prompt.

It does not open or validate a Workspace, TaskHandle, Git repository, branch, snapshot, material revision, current four-material set, stage status, receipt, or completion fact. Those belong to the calling stage when actually needed.

## Input

```json
{
  "stage": "make-decision",
  "review_track": "detail",
  "host_provider": "codex",
  "materials": {
    "raw_requirement": "...",
    "approved_direction": "...",
    "draft_spec_or_acceptance": "..."
  }
}
```

Required fields:

- `stage`: current review stage.
- `host_provider`: current host provider, used only to select a heterologous reviewer.
- `materials`: the complete material bytes for this review.

`review_track` is required only for `make-decision`; `review_kind` is used only for mini-task reviews.

Do not send `task_path`, `project_name`, `task_id`, Workspace, Git, snapshot, revision, provider allowlist, or result-storage fields. Extra task/workspace fields from an older caller are ignored and never become review gates.

## Behavior

1. Select the configured heterologous reviewer route for the supplied stage/track.
2. Generate the stage-focused review instructions.
3. Freeze exactly the submitted `materials` into one temporary bundle and hash those bytes.
4. Make one broker group request.
5. Return the real provider identities, transport outcome, findings, and material hash.
6. Delete the temporary bundle.

The provider may read only the submitted bundle. It may not access the repository, Workspace, TaskHandle, Git, shell, network, or host paths.

## Output

Available:

```json
{
  "status": "available",
  "stage": "make-decision",
  "review_track": "detail",
  "material_id": "...",
  "runtime_id": "...",
  "provider_results": [],
  "findings": []
}
```

Unavailable:

```json
{
  "status": "unavailable",
  "error": {
    "code": "...",
    "message": "..."
  }
}
```

`available` only means at least one heterologous reviewer returned valid findings JSON. Empty findings are advice, not completion or approval. `unavailable` is not empty findings and must not be rewritten as pass.

## Responsibility boundary

- `wh-review` does not write WorkflowHub task state or quality facts.
- The calling stage records the returned review result and disposes each finding in its own material.
- A review failure never blocks Talk, drafting, repair, or user confirmation.
- Retry only when the previous call returned no semantic advice and the concrete transport/material problem changed.

## Command

```bash
node skills/wh-review/scripts/wh-review-cli.mjs run <<'JSON'
{"stage":"make-decision","review_track":"detail","host_provider":"codex","materials":{"decision":"..."}}
JSON
```
