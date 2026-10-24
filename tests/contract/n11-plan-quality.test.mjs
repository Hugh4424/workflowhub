import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { validatePostPhaseContract } from '../../runtime/stage/stage-content-contracts.mjs';
const readRepoText = path => readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const phasePath='phases/P1-行为结果.md';
function authorExampleMaterials() {
 const text=readRepoText('skills/spec-plan/templates/phase-template.md'), blocks={};
 for(const name of ['spec','index','phase-behavior','phase-document']) {
  const marker='<!-- card05-author-example:'+name+' -->';
  const tail=text.slice(text.indexOf(marker)+marker.length);
  const match=tail.match(/^\s*(`{3,}|~{3,})markdown\s*\n([\s\S]*?)\n\1[ \t]*(?:\n|$)/);
  if(!match) throw new Error('Missing author example '+name);
  blocks[name]=match[2].replace(/\{\{(TASK_ID|TASK_ROOT|WORKTREE_ROOT)\}\}/g,(_,key)=>({TASK_ID:'n11-fixture',TASK_ROOT:'/owned/task',WORKTREE_ROOT:'/owned/worktree'})[key]);
 }
 return {spec:blocks.spec,index:blocks.index,phases:{[phasePath]:blocks['phase-behavior'],'phases/P2-文档核对.md':blocks['phase-document']}};
}
function mutatePhaseField(materials, field) {
 materials.phases[phasePath]=materials.phases[phasePath].split('\n').filter(line=>!line.startsWith('- **'+field+'**')).join('\n');return materials;
}
function criteriaChecks(text) {
 const step=n=>text.match(new RegExp('^'+n+'\\. ([^\\n]+)','m'))?.[1]??'';
 return [step(7).includes('动作＋命令＋期望'),step(7).includes('目标行为失败'),step(7).includes('本来就通过'),step(8).includes('用户真实答复'),step(8).includes('ref 与原文'),step(8).includes('方案作者不得单方放宽'),step(8).includes('都不算用户答复'),step(9).includes('三件套'),step(9).includes('红测归因'),step(10).includes('用户真实答复原件'),step(12).includes('判据改动无答复原件')];
}
describe('ORACLE-N11-CRITERIA-LOCK',()=>{
 it('real method requires executable triplet and real user original at all five steps',()=>{expect(criteriaChecks(readRepoText('workflows/build-plan/SKILL.md'))).toEqual(Array(11).fill(true));});
 it('same assertions reject a relaxed copy without user reply evidence',()=>{
  const text=readRepoText('workflows/build-plan/SKILL.md');
  expect(criteriaChecks(text)).toEqual(Array(11).fill(true));
  expect(criteriaChecks(text.replaceAll('用户真实答复','审查同意')).every(Boolean)).toBe(false);
 });
 for(const field of ['RED/GREEN gate_cmd','expected_exit']) it('rejects missing '+field,()=>{
  const good=authorExampleMaterials();expect(validatePostPhaseContract(good).errors).toEqual([]);
  expect(validatePostPhaseContract(mutatePhaseField(good,field)).errors.some(e=>e.includes('missing concrete '+field))).toBe(true);
 });
});
const scopeFact=paths=>({status:'recorded',changed_paths:paths});
function phaseFixture(paths=['src/owned.mjs']) {return {...authorExampleMaterials(),phase_id:'P1',changeScope:scopeFact(paths)};}
const reconcile=input=>validatePostPhaseContract(input).facts?.write_set_reconciliation;
const cli=(input,args=['--report'])=>spawnSync(process.execPath,[fileURLToPath(new URL('../../tools/cli/check-stage-quality.mjs',import.meta.url)),...args],{input:typeof input==='string'?input:JSON.stringify(input),encoding:'utf8'});
describe('ORACLE-N11-WRITESET-DIFF',()=>{
 it('points out every out-of-scope path',()=>{expect(reconcile(phaseFixture(['src/owned.mjs','outside.mjs']))).toMatchObject({status:'recorded',out_of_scope:['outside.mjs'],listed_not_changed:[],matched:['src/owned.mjs']});});
 it('points out listed but unchanged paths',()=>{expect(reconcile(phaseFixture([]))).toMatchObject({status:'recorded',out_of_scope:[],listed_not_changed:['src/owned.mjs'],matched:[]});});
 it('does not compare only equal counts',()=>{expect(reconcile(phaseFixture(['different.mjs']))).toMatchObject({out_of_scope:['different.mjs'],listed_not_changed:['src/owned.mjs'],matched:[]});});
 it('matching paths are the intersection and only differences are empty',()=>{expect(reconcile(phaseFixture())).toMatchObject({status:'recorded',out_of_scope:[],listed_not_changed:[],matched:['src/owned.mjs']});});
 for(const patch of [{changeScope:undefined},{changeScope:{}},{changeScope:{status:'unknown_change_scope'}},{phase_id:undefined},{phase_id:'P404'}]) it('missing scope or phase stays unavailable '+JSON.stringify(patch),()=>{expect(reconcile({...phaseFixture(),...patch})).toMatchObject({status:'unavailable',out_of_scope:[],listed_not_changed:[],matched:[]});});
 it('preserves existing validator fields and errors',()=>{
  const original=validatePostPhaseContract(authorExampleMaterials()),withScope=validatePostPhaseContract(phaseFixture(['outside.mjs']));
  expect(withScope.ok).toBe(original.ok);expect(withScope.errors).toEqual(original.errors);
  const {write_set_reconciliation,...oldFacts}=withScope.facts;const {write_set_reconciliation:unused,...baseline}=original.facts;expect(oldFacts).toEqual(baseline);
 });
 it('separates approved external write surfaces from this repository',()=>{
  const input=phaseFixture(); input.phases[phasePath]=input.phases[phasePath].replaceAll('src/owned.mjs','/modeltest/src/owned.mjs');input.index=input.index.replaceAll('src/owned.mjs','/modeltest/src/owned.mjs');
  input.reviewReadScope={repositories:[{id:'modeltest',sourceRoot:'/modeltest',paths:['src/owned.mjs']}],evidenceFiles:[]};
  const result=reconcile(input);expect(result).toMatchObject({status:'recorded',out_of_scope:['src/owned.mjs'],listed_not_changed:[],matched:[],external_write_surfaces:['/modeltest/src/owned.mjs']});
 });
 it('explicit CLI consumes stdin and prints the unique validator fact',()=>{const input=phaseFixture(['outside.mjs']),result=cli(input);expect(result.status,result.stderr).toBe(0);expect(JSON.parse(result.stdout)).toEqual(reconcile(input));});
 it('CLI missing scope is unavailable without quality gate',()=>{const result=cli({...phaseFixture(),changeScope:undefined});expect(result.status,result.stderr).toBe(0);expect(JSON.parse(result.stdout).status).toBe('unavailable');});
 it('invalid JSON and incomplete materials expose errors',()=>{for(const input of ['{broken',{}]){const result=cli(input);expect(result.status).not.toBe(0);expect(result.stderr).toMatch(/report/i);expect(result.stdout).toBe('');}});
 it('retains default scan and self-test modes',()=>{for(const args of [[],['--self-test']]){const result=cli('',args);expect(result.status,result.stderr).toBe(0);expect(result.stdout).toMatch(/PASS/);}});
});
