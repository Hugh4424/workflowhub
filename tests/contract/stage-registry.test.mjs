// ORACLE-STAGE-REGISTRY: P6/T008. Frozen after recorded target RED; assertion changes require reviewed TCR.
import { expect, test } from 'vitest';
import { existsSync, readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const registryPath = join(root, 'runtime/stage/stage-registry.mjs');
// Independent pre-migration contract values, never derived from the registry under test.
const formal = ['make-decision', 'build-plan', 'build-code'];
const workflow = ['make-decision', 'build-plan', 'build-code', 'build-prd'];
const readers = [
 'runtime/stage/stage-context.mjs', 'runtime/task/task-store.mjs',
 'runtime/review/review-policy.mjs', 'runtime/task/final-chain.mjs',
 'runtime/task/final-chain-runner.mjs', 'runtime/evidence/workflow-evolution.mjs',
 'runtime/distribution/skill-bundle-release.mjs', 'runtime/review/stage-review-disposition.mjs',
 'tools/cli/stage-runtime.mjs', 'tools/cli/check-skill-consistency.mjs',
 'tools/cli/check-stage-steps.mjs', 'tools/cli/measure-main-agent-cost.mjs',
 'tools/cli/n11-pairwise-judge.mjs', 'tools/cli/smoke-local-skill-dispatch.mjs',
 'core/task-close.mjs', 'skills/wh-review/scripts/third-review-host-config.mjs',
];
const source = path => readFileSync(join(root, path), 'utf8');
// Scoped list scanner: individual semantic branches are deliberately not stage-list definitions.
function assertNoStageCopies(text, label) {
 const executable = text.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
 for (const array of executable.matchAll(/\[[^\[\]]*\]/gs)) {
  const names = [...array[0].matchAll(/["'](make-decision|build-plan|build-code|verify-code|build-prd)["']/g)];
  expect(names.length, `${label}: local current stage-list copy`).toBeLessThan(2);
 }
 expect(executable, `${label}: retired stage literal outside registry`).not.toMatch(/["']build-spec["']/);
}
async function registry() {
 expect(existsSync(registryPath), 'ORACLE-STAGE-REGISTRY: stage registry must exist before import').toBe(true);
 return import(registryPath);
}
test('ORACLE-STAGE-REGISTRY: one registry preserves six exports plus one passive retired identity and all 16 readers import it', async () => {
 const values = await registry();
 expect(Object.keys(values).sort()).toEqual(['STAGE','FORMAL_DEVELOPMENT_STAGES','WORKFLOW_STAGES','FORMAL_DEVELOPMENT_STAGE_SET','WORKFLOW_STAGE_SET','RETIRED_STAGE_BUILD_SPEC','RETIRED_STAGE_VERIFY_CODE'].sort());
 expect(source('runtime/stage/stage-registry.mjs')).not.toMatch(/\b(?:import|export)\s[^;]*\bfrom\s|\bimport\s*\(/);
 for (const reader of readers) {
  expect(source(reader), `${reader}: registry import`).toMatch(/import\s*\{[^}]+\}\s*from\s*["'][^"']*stage-registry\.mjs["']/);
  assertNoStageCopies(source(reader), reader);
 }
});
test('formal three, workflow four and retired identity preserve current write and historical-read boundaries', async () => {
 const values = await registry();
 expect(values.STAGE).toEqual({MAKE_DECISION:'make-decision',BUILD_PLAN:'build-plan',BUILD_CODE:'build-code',BUILD_PRD:'build-prd'});
 expect(values.FORMAL_DEVELOPMENT_STAGES).toEqual(formal);
 expect(values.WORKFLOW_STAGES).toEqual(workflow);
 expect([...values.FORMAL_DEVELOPMENT_STAGE_SET]).toEqual(formal);
 expect([...values.WORKFLOW_STAGE_SET]).toEqual(workflow);
 expect(values.FORMAL_DEVELOPMENT_STAGE_SET.has('build-prd')).toBe(false);
 expect(values.WORKFLOW_STAGE_SET.has('build-prd')).toBe(true);
 expect(values.RETIRED_STAGE_BUILD_SPEC).toBe('build-spec');
 expect(values.RETIRED_STAGE_VERIFY_CODE).toBe('verify-code');
 expect(values.FORMAL_DEVELOPMENT_STAGE_SET.has(values.RETIRED_STAGE_VERIFY_CODE)).toBe(false);
 expect(values.WORKFLOW_STAGE_SET.has(values.RETIRED_STAGE_VERIFY_CODE)).toBe(false);
 expect(values.WORKFLOW_STAGE_SET.has('build-spec')).toBe(false);
 for (const name of [...workflow, 'build-spec']) {
  expect([...source('runtime/stage/stage-registry.mjs').matchAll(new RegExp(`["']${name}["']`, 'g'))]).toHaveLength(1);
 }
});
test('scoped scanner rejects a temporary duplicate and an unauthorized retired literal', () => {
 const dir = mkdtempSync(join(tmpdir(), 'p6-stage-copy-'));
 try {
  const file = join(dir, 'copy.mjs');writeFileSync(file, "const stages = ['make-decision', 'build-code'];\n");
  expect(() => assertNoStageCopies(readFileSync(file,'utf8'),file)).toThrow(/local current stage-list copy/);
  expect(() => assertNoStageCopies("const retired = 'build-spec';",'retired')).toThrow(/retired stage literal/);
  expect(() => assertNoStageCopies("if (stage === 'build-code') return true;",'branch')).not.toThrow();
 } finally { rmSync(dir,{recursive:true,force:true}); }
});
test('five public behavior comparisons preserve accept/reject results', async () => {
 await registry();
 const {assertReviewIdentity} = await import('../../runtime/review/review-policy.mjs');
 expect(() => assertReviewIdentity({stage:'verify-code'})).toThrow(/unknown review stage/);
 expect(assertReviewIdentity({stage:'build-code',review_scope:'phase'})).toEqual({stage:'build-code',reviewTrack:null,reviewScope:'phase',reviewKind:null});
 expect(() => assertReviewIdentity({stage:'not-a-stage'})).toThrow(/unknown review stage/);
 const {deriveSeriousReviewPause} = await import('../../runtime/review/stage-review-disposition.mjs');
 expect(deriveSeriousReviewPause({taskId:'p6',stage:'build-prd',reviewAttempt:{}})).toEqual({status:'unavailable',task_id:'p6',stage:'build-prd',findings:[]});
 expect(() => deriveSeriousReviewPause({taskId:'p6',stage:'not-a-stage',reviewAttempt:{}})).toThrow(/unsupported stage/);
 const {STAGES} = await import('../../tools/cli/n11-pairwise-judge.mjs');
 expect(STAGES).toEqual(formal);
 const {resolvePortableStageFiles} = await import('../../runtime/distribution/skill-bundle-release.mjs');
 const packageRoot = mkdtempSync(join(tmpdir(),'p6-portable-root-'));
 try { expect(() => resolvePortableStageFiles({packageRoot,stage:'build-prd'})).toThrow(/unsupported portable stage/); }
 finally { rmSync(packageRoot,{recursive:true,force:true}); }
 const {bootstrapStage} = await import('../../runtime/stage/stage-context.mjs');
 await expect(bootstrapStage('not-a-stage')).rejects.toThrow(/unsupported stage: not-a-stage/);
});
