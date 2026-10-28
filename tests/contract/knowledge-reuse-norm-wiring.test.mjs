// Build-plan target oracle; production writers must not edit these assertions.
// Author: c02-plan-verification, independent context (inheritance=none), 2026-10-25.
// Authority: specs/workflowhub-ui-frontend-c02-knowledge-reuse-20261025/
//   phases/P1-有据检索.md T001; phases/P2-五类规范.md T002;
//   phases/P3-真实规范再用.md T003 and spec.md Appendix A.
// Freeze source is those Phase cards plus this file, not a second oracle ledger.
// Physical read-only/hidden access and an independent judge are NOT established.
// Scope: real local resolver/package outputs only. No method semantics, online
// version/license truth, actual norm writes, recovery, or real-task reuse claim.
// Each Phase selects its exact test name; a later Phase's RED does not block P1.
import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { expect, test } from 'vitest';
import yaml from 'js-yaml';
import { resolveStageSkillPackages } from '../../runtime/stage/stage-skill-runtime.mjs';
import { resolvePortableStageFiles } from '../../runtime/distribution/skill-bundle-release.mjs';

const packageRoot = resolve(import.meta.dirname, '../..');
const localPaths = paths => paths.map(path => relative(packageRoot, path));

// Independent literal expectations come from P1's named attachment, P2's exact
// migration/new-template write set and P3's named method/routes, not code output.
test('ORACLE-C02-REUSE-ASSET', () => {
  for (const stage of ['make-decision', 'build-plan']) {
    const result = resolveStageSkillPackages({ packageRoot, stage });
    const payload = result.payloads.get('knowledge-graph');
    expect(payload, `${stage}: existing knowledge method must resolve`).toBeDefined();
    expect(payload.diagnostic.status).toBe('available');
    expect(payload.resolved_skill_path).toBe(resolve(packageRoot, 'skills/knowledge-graph/SKILL.md'));
    expect.soft(
      localPaths(payload.resolved_bundle_paths),
      `ORACLE-C02-REUSE-ASSET: ${stage} resolver must deliver the knowledge-reuse attachment`,
    ).toContain('skills/knowledge-graph/references/knowledge-reuse.md');
  }
});

test('ORACLE-C02-NORM-INIT-RENAME', () => {
  const result = resolveStageSkillPackages({ packageRoot, stage: 'build-plan' });
  const payload = result.payloads.get('project-norm-init');
  expect(
    payload,
    'ORACLE-C02-NORM-INIT-RENAME: build-plan resolver must deliver the renamed initializer',
  ).toBeDefined();
  expect(payload.name).toBe('project-norm-init');
  expect(payload.diagnostic.status).toBe('available');
  expect(payload.resolved_skill_path).toBe(resolve(packageRoot, 'skills/project-norm-init/SKILL.md'));
  expect(result.dependencies.get('project-norm-init')).toMatchObject({
    name: 'project-norm-init',
    path: 'skills/project-norm-init/SKILL.md',
    trigger: 'ui_scope_existing_project_baseline',
  });
  expect(result.dependencies.has('ui-project-init'), 'the current manifest must not retain the old active owner').toBe(false);
  expect(result.payloads.has('ui-project-init')).toBe(false);
  const required = [
    'skills/project-norm-init/SKILL.md',
    'skills/project-norm-init/templates/domain-semantics.md',
    'skills/project-norm-init/templates/visual-design-system.md',
    'skills/project-norm-init/templates/components.md',
    'skills/project-norm-init/templates/layouts.md',
    'skills/project-norm-init/templates/interaction.md',
    'skills/project-norm-init/templates/frontend-engineering.md',
    'skills/project-norm-init/templates/craft.md',
    'skills/project-norm-init/templates/quality.md',
    'skills/project-norm-init/templates/backend-architecture.md',
    'skills/project-norm-init/templates/api-contract.md',
    'skills/project-norm-init/templates/acceptance.md',
  ];
  expect(localPaths(payload.resolved_bundle_paths), 'retain all eight templates and deliver the three new categories').toEqual(expect.arrayContaining(required));
  const portable = resolvePortableStageFiles({ packageRoot, stage: 'build-plan' });
  expect(portable.files, 'the real local portable consumer must receive the same assets').toEqual(expect.arrayContaining(required));
  expect(portable.files.some(path => path.startsWith('skills/ui-project-init/')), 'no old active initializer payload in the current portable closure').toBe(false);
});

test('ORACLE-C02-NORM-SYNC-WIRING', () => {
  const stages = ['build-code', 'verify-code'];
  const resolved = stages.map(stage => resolveStageSkillPackages({ packageRoot, stage }));
  expect(
    resolved.map(result => ({ stage: result.manifest.stage, reachable: result.payloads.has('norm-sync') })),
    'ORACLE-C02-NORM-SYNC-WIRING: both direct stage resolvers must deliver norm-sync',
  ).toEqual([
    { stage: 'build-code', reachable: true },
    { stage: 'verify-code', reachable: true },
  ]);
  const required = ['skills/norm-sync/SKILL.md', 'skills/norm-sync/references/routes.md'];
  for (const result of resolved) {
    const payload = result.payloads.get('norm-sync');
    expect(payload.diagnostic.status).toBe('available');
    expect(payload.resolved_skill_path).toBe(resolve(packageRoot, 'skills/norm-sync/SKILL.md'));
    expect(localPaths(payload.resolved_bundle_paths)).toEqual(expect.arrayContaining(required));
  }
  // The direct stage dependency could otherwise mask a missing indirect owner.
  // Inspect that existing declaration, then consume the real portable closure;
  // neither assertion claims the natural-language call was actually executed.
  const catalog = yaml.load(readFileSync(resolve(packageRoot, 'skills/catalog.yaml'), 'utf8'));
  for (const owner of ['stage-reflection', 'stage-close']) {
    const registrations = catalog.skills.filter(entry => entry.name === owner);
    expect(registrations, `${owner}: one existing declaration owner`).toHaveLength(1);
    expect(registrations[0].dependency_closure, `${owner}: declare the indirect norm-sync dependency`).toContain('skills/norm-sync');
  }
  for (const stage of stages) {
    const portable = resolvePortableStageFiles({ packageRoot, stage });
    expect(portable.files, `${stage}: the actual portable closure delivers method and routes`).toEqual(expect.arrayContaining(required));
  }
});
