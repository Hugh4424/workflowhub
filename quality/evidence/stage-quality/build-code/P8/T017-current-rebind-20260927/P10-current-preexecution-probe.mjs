import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { openTask } from '../../../../../../runtime/task/task-handle.mjs';
import { openCurrentTaskWorkspace } from '../../../../../../runtime/task/workspace.mjs';
import { capturePreExecutionTaskChangeScope } from '../../../../../../workflows/build-code/change-scope.mjs';
import { readCurrentTestAssetRegistry } from '../../../../../../workflows/build-code/test-asset-inventory.mjs';
import { selectAffectedCases } from '../../../../../../workflows/build-code/case-selection.mjs';
const taskId = 'workflowhub-thin-core-card-04-20260919';
const task = openTask('/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/' + taskId, 'workflowhub', taskId);
const workspace = openCurrentTaskWorkspace(task);
const root = workspace.worktreeRoot;
const pre = capturePreExecutionTaskChangeScope({ task, workspace });
const registry = readCurrentTestAssetRegistry({ task, workspace });
const bytes = readFileSync(resolve(root, 'docs/quality/business-case-catalog.json'));
const catalog = JSON.parse(bytes);
const sha = (b) => createHash('sha256').update(b).digest('hex');
const bindings = catalog.cases.map((entry) => {
  const source = readFileSync(resolve(root, entry.source.path));
  const rulePath = entry.rule.path ?? `specs/${taskId}/phases/${entry.phase_ids[0]}.md`;
  const rule = readFileSync(resolve(root, rulePath));
  return { case_id: entry.id,
    source_matches: entry.source.revision === `sha256:${sha(source)}`,
    rule_matches: entry.rule.revision === `sha256:${sha(rule)}`,
    observation_rule_matches: entry.effect_observation.rule_revision === entry.rule.revision };
});
if (bindings.some((row) => !row.source_matches || !row.rule_matches || !row.observation_rule_matches)) throw new Error('current P10 source binding is stale');
const selection = pre.status === 'recorded'
  ? selectAffectedCases({ changeScope: pre, catalog,
    registry: { ...registry, task_id: task.identity.taskId,
      snapshot_tree: pre.snapshot_tree, source_digest: pre.source_digest } })
  : null;
console.log(JSON.stringify({ task_id: task.identity.taskId, worktree: root,
  pre_status: pre.status, pre_reason: pre.reason ?? null,
  changed_path_count: pre.changed_paths?.length ?? 0,
  registry_status: registry.status, registry_revision: registry.revision,
  catalog_revision: catalog.revision, catalog_sha256: sha(bytes), bindings,
  selection_status: selection?.status ?? null, selection_reason: selection?.reason ?? null,
  selected_case_ids: selection?.cases?.map((row) => row.id) ?? [] }, null, 2));
