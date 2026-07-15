# wh-review E2E harness

Fake-broker matrix:

```bash
node scripts/run-wh-review-audit-e2e.mjs --output=/absolute/evidence-directory
```

This runs all five stages, including both `make-decision` tracks, and writes
`audit-e2e-evidence.json`. It does not call a real provider.

Real-provider smoke requires an explicit JSON input. The harness has no repository,
provider, config, or output defaults and never edits the source repository.

```bash
node scripts/run-wh-review-provider-smoke.mjs --input=/absolute/smoke-input.json
```

Required input fields:

```json
{
  "source_root": "/absolute/task-worktree",
  "target_repo_root": "/absolute/target-repo",
  "review_data_root": "/absolute/task-record-root",
  "attachment_root": "/absolute/configured-attachment-root",
  "config": "/absolute/3rd-review-config.json",
  "command": ["node", "/absolute/3rd-review/scripts/3rd-review.mjs"],
  "providers": ["opencode"],
  "task_id": "smoke-task",
  "stage": "build-code",
  "review_track": null,
  "host_provider": "codex",
  "previous_runtime_ids": {},
  "materials": {
    "approved_spec": "...",
    "acceptance_criteria": "...",
    "test_evidence": "..."
  },
  "evidence_path": "/absolute/evidence/provider-smoke.json"
}
```

`attachment_root` must match the root allowed by the supplied 3rd-review config.
The harness writes immutable attempts/results below `review_data_root` and provider
bundles below `attachment_root/.wh-review-packets/`.
