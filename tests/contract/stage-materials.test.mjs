// ORACLE-STAGE-MATERIALS — P10. Current material migration, not runtime acceptance.
import { describe,it,expect } from 'vitest';
import { readFileSync,existsSync,mkdtempSync,realpathSync,writeFileSync,rmSync } from 'node:fs';
import { resolve,join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildReviewMaterials } from '../../skills/wh-review/scripts/review-materials.mjs';
import yaml from 'js-yaml';
const root=resolve(import.meta.dirname,'../..'),read=p=>readFileSync(resolve(root,p),'utf8');
describe('ORACLE-STAGE-MATERIALS',()=>{
 it('current catalogue and review skill plans use the terminal identity without a retired stage',()=>{
  const plan=JSON.parse(read('skills/wh-review/stage-skill-plan.json'));
  expect(plan.stages).not.toHaveProperty('verify-code');expect(plan.stages['build-code/terminal'].required_skills).toContain('review');
  const catalogue=yaml.load(read('skills/catalog.yaml'));
  function check(v){if(!v||typeof v!=='object')return;for(const[k,value]of Object.entries(v)){if(k==='used_by_stages')expect(value).not.toContain('verify-code');else check(value);}}check(catalogue);
 });
 it('terminal report owns closure and current governance describes three stages',()=>{
  for(const p of ['AGENTS.md','docs/standard-workflow.md','README.md'])expect(read(p)).not.toMatch(/五阶段|五个阶段/);
  expect(existsSync(resolve(root,'docs/adr/0055-complex-task-three-stage-merge.md'))).toBe(true);
  const method=read('workflows/build-code/SKILL.md');expect(method).toContain('final-report');expect(method).toContain('不再产出 stage-handoff');
 });
});

it('first real phase and terminal packets consume only new skill-plan identities with readable required lenses',()=>{
 const dir=realpathSync(mkdtempSync(join(tmpdir(),'p10-material-reader-'))),diffPath=join(dir,'delivery.diff');writeFileSync(diffPath,'diff --git a/answer.mjs b/answer.mjs\n--- a/answer.mjs\n+++ b/answer.mjs\n@@ -1 +1 @@\n-old\n+new\n');
 try{for(const reviewScope of ['phase','terminal']){
  const packet=buildReviewMaterials({attachmentRoot:dir,stage:'build-code',reviewScope,phaseId:reviewScope==='phase'?'P10':null,materials:{changed_files:['answer.mjs'],acceptance_criteria:'AC-ONE: real named consumer',implementation_assessment:'Current controlled implementation',test_context:'Owned contract test; no provider run',open_risks:'Real provider quality not tested'},source:{diffPath,baseCommit:'a'.repeat(40),capturedHead:'b'.repeat(40)}});
  try{const manifest=JSON.parse(readFileSync(join(packet.bundleRoot,'manifest.json'),'utf8'));expect(manifest.review_scope).toBe(reviewScope);for(const skill of ['simplicity-guard','review']){const path=`skills/${skill}/SKILL.md`;expect(manifest.files.some(f=>f.path===path)).toBe(true);expect(readFileSync(join(packet.bundleRoot,path),'utf8').length).toBeGreaterThan(0);}expect(readFileSync(join(packet.bundleRoot,'contracts/build-code.md'),'utf8')).toContain('review_scope=terminal');}finally{packet.dispose();}
 }}finally{rmSync(dir,{recursive:true,force:true});}
});
