import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { openTask, createTaskKernel } from '../../../../../../runtime/task/task-handle.mjs';
import { openCurrentTaskWorkspace } from '../../../../../../runtime/task/workspace.mjs';
import { capturePreExecutionTaskChangeScope } from '../../../../../../workflows/build-code/change-scope.mjs';
import { readCurrentTestAssetRegistry } from '../../../../../../workflows/build-code/test-asset-inventory.mjs';
import { selectAffectedCases } from '../../../../../../workflows/build-code/case-selection.mjs';

const directory = fileURLToPath(new URL('.', import.meta.url));
const taskId = 'workflowhub-thin-core-card-04-20260919';
const taskPath = `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/${taskId}`;
const sha256 = (raw) => createHash('sha256').update(raw).digest('hex');
const save = (name, value) => writeFileSync(join(directory, name), `${JSON.stringify(value, null, 2)}\n`);
const category = (path) => {
  if (path.startsWith('specs/archive/workflowhub-thin-core-card-05-')) return 'CARD05 archived material';
  if (path.includes('workflowhub-thin-core-card-05-')) return 'CARD05 other material';
  if (path.startsWith(`specs/${taskId}/`)) return 'CARD04 current material';
  const first = path.split('/')[0];
  return ['runtime', 'tests', 'skills', 'workflows', 'docs', 'tools', 'config', 'core', 'scripts'].includes(first)
    ? first : 'other';
};

try {
  const task = openTask(taskPath, 'workflowhub', taskId);
  const workspace = openCurrentTaskWorkspace(task);
  const kernel = createTaskKernel(task, { workspace });
  const root = workspace.worktreeRoot;
  const materialBefore = kernel.currentVNextMaterialRevision();
  const scopeBefore = capturePreExecutionTaskChangeScope({ task, workspace });
  const registry = readCurrentTestAssetRegistry({ task, workspace });
  const boundRegistry = { ...registry, task_id: task.identity.taskId,
    snapshot_tree: scopeBefore.snapshot_tree, source_digest: scopeBefore.source_digest };
  const catalogRaw = readFileSync(join(root, 'docs/quality/business-case-catalog.json'));
  const catalog = JSON.parse(catalogRaw);
  const catalogSha = sha256(catalogRaw);
  const sourceBindings = (catalog.cases ?? []).map((entry) => {
    const rulePath = entry.rule?.path ?? `specs/${taskId}/phases/${entry.phase_ids?.[0]}.md`;
    const sourceActual = `sha256:${sha256(readFileSync(join(root, entry.source.path)))}`;
    const ruleActual = `sha256:${sha256(readFileSync(join(root, rulePath)))}`;
    return { case_id: entry.id, source_path: entry.source.path, source_revision_claimed: entry.source.revision,
      source_revision_actual: sourceActual, rule_path: rulePath, rule_revision_claimed: entry.rule.revision,
      rule_revision_actual: ruleActual, matches: entry.source.revision === sourceActual && entry.rule.revision === ruleActual };
  });
  const selection = selectAffectedCases({ changeScope: scopeBefore, catalog, registry: boundRegistry });
  const materialAfter = kernel.currentVNextMaterialRevision();
  const scopeAfter = capturePreExecutionTaskChangeScope({ task, workspace });
  const catalogAfterSha = sha256(readFileSync(join(root, 'docs/quality/business-case-catalog.json')));
  const registryAfter = readCurrentTestAssetRegistry({ task, workspace });
  const stable = materialBefore === materialAfter && catalogSha === catalogAfterSha
    && registry.registry_sha256 === registryAfter.registry_sha256
    && JSON.stringify(scopeBefore) === JSON.stringify(scopeAfter);
  const active = catalog.cases.filter((entry) => entry.status !== 'retired');
  const mappedPaths = scopeBefore.changed_paths.filter((path) => active.some((entry) => entry.change_triggers.includes(path)));
  const unmappedPaths = scopeBefore.changed_paths.filter((path) => !active.some((entry) => entry.change_triggers.includes(path)));
  const groups = {};
  for (const path of scopeBefore.changed_paths) {
    const name = category(path);
    const group = groups[name] ??= { changed: 0, mapped: 0, unmapped: 0 };
    group.changed += 1;
    group[ mappedPaths.includes(path) ? 'mapped' : 'unmapped' ] += 1;
  }
  const summary = { task_id: taskId, workspace_root: root, material_revision: materialBefore,
    snapshot_head: scopeBefore.snapshot_head, snapshot_tree: scopeBefore.snapshot_tree,
    catalog_ref: 'docs/quality/business-case-catalog.json', catalog_sha256: catalogSha,
    catalog_revision: catalog.revision, registry_sha256: registry.registry_sha256,
    scope_status: scopeBefore.status, scope_reason: scopeBefore.reason ?? null,
    changed_paths_count: scopeBefore.changed_paths.length, mapped_paths_count: mappedPaths.length,
    unmapped_paths_count: unmappedPaths.length, categories: groups,
    selected_case_ids: selection.cases.map((entry) => entry.id), selection_status: selection.status,
    selection_reason: selection.reason ?? null, selection_provenance: selection.provenance ?? null,
    test_execution_status: selection.test_execution_status ?? null,
    source_binding_all_match: sourceBindings.every((entry) => entry.matches),
    identity_stable_before_after: stable };
  save('raw.json', { summary, scope_before: scopeBefore, scope_after: scopeAfter,
    registry: boundRegistry, catalog, catalog_sha256: catalogSha, source_bindings: sourceBindings,
    selection, mapped_paths: mappedPaths, unmapped_paths: unmappedPaths });
  save('summary.json', summary);
  if (!stable) process.exitCode = 2;
  else if (scopeBefore.status !== 'recorded') process.exitCode = 3;
  console.log(JSON.stringify(summary));
} catch (error) {
  save('error.json', { name: error.name, message: error.message, stack: error.stack });
  console.error(error.stack);
  process.exitCode = 1;
}
