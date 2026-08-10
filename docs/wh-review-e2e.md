# wh-review E2E harness

Fake-broker matrix:

```bash
node tools/cli/run-wh-review-audit-e2e.mjs --output=/absolute/evidence-directory
```

This runs all five stages, including both `make-decision` tracks, and writes
`audit-e2e-evidence.json`. It does not call a real provider.

## 三层部署验证清单

这不是新的 smoke 命令。修复登记时复用现有官方登记测试，在三处各执行一次：

```text
tests/official-component-receipts.test.mjs
tests/official-make-decision-cli.test.mjs
```

记录必须包含：

```json
{
  "source_repo": { "cwd": "/absolute/source", "command": "...", "exit_code": 0, "started_at": "...", "finished_at": "...", "runner_commit": "...", "config_path": "...", "NODE_PATH": "..." },
  "active_runners": [
    { "cwd": "/absolute/runner", "command": "...", "exit_code": 0, "started_at": "...", "finished_at": "...", "runner_commit": "...", "config_path": "...", "NODE_PATH": "..." }
  ],
  "fresh_stage_runtime": { "cwd": "/absolute/runtime", "command": "...", "exit_code": 0, "started_at": "...", "finished_at": "...", "runner_commit": "...", "config_path": "...", "NODE_PATH": "..." },
  "conclusion": "部署验证未完成"
}
```

缺少任一层时，必须保留 `部署验证未完成`，不得把 `node --check` 单独当作修复证明。
runner 目录中的配置解析路径和源仓不同，正是这项验证要覆盖的差异。

本组实施的结论口径固定为：三层证据齐全才可写“部署验证完成”；任一层没有真实回读，就只写“部署验证未完成”，不推断线上效果。

Real-provider smoke requires an explicit JSON input. The harness has no repository,
provider, config, or output defaults and never edits the source repository.

```bash
node tools/cli/run-wh-review-provider-smoke.mjs --input=/absolute/smoke-input.json
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
