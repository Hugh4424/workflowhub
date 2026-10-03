import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, linkSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CURRENT_MATERIAL_FILES, inspectMaterialWorkspace, materialFilesForCohort, replaceMaterialAtomic } from '../../runtime/task/material-workspace.mjs';
import { ArtifactDir } from '../../runtime/evidence/artifact-dir.mjs';
const roots=[];
function workspace(){const root=realpathSync(mkdtempSync(join(tmpdir(),'workflowhub-materials-')));roots.push(root);return root;}
function phaseIndex(...rows){return `# Phase index\n\n## Execution Index\n\n| phase | authority ref | semantic anchor | write set | dependency | consumer |\n| --- | --- | --- | --- | --- | --- |\n${rows.map(([phase,ref])=>`| \`${phase}\` | \`${ref}\` | anchor | files | none | build-code |`).join('\n')}\n`;}
function seed(root){mkdirSync(join(root,'phases'));const files={'decision-log.md':'decision\n','spec.md':'# spec\r\n\r\n- first  \r\n  continued\r\n\r\n    code  \r\n\r\n```js\r\nconst value = 1;  \r\n```\r\n','phases/index.md':phaseIndex(['P1','phases/P1.md'],['P2','phases/P2.md']),'phases/P1.md':'phase one\n','phases/P2.md':'phase two\n'};for(const[file,body]of Object.entries(files))writeFileSync(join(root,file),body);return files;}
afterEach(()=>{while(roots.length)rmSync(roots.pop(),{recursive:true,force:true});});
describe('current ordinary material workspace',()=>{
  it('reads post decision/spec/index names and decision-only stage without a retired progress pointer',()=>{
    expect(CURRENT_MATERIAL_FILES).toEqual(['decision-log.md','spec.md','phases/index.md']);expect(materialFilesForCohort('post',{}, {stage:'make-decision'})).toEqual(['decision-log.md']);
    const root=workspace(),files=seed(root);writeFileSync(join(root,'materials-current.json'),'legacy pointer ignored\n');writeFileSync(join(root,'plan.md'),'old plan ignored');writeFileSync(join(root,'tasks.md'),'old tasks ignored');const result=inspectMaterialWorkspace(root);
    expect(result.status).toBe('working');expect(result.root).toBe(root);expect(result.files).toEqual(files);expect(result.missing).toEqual([]);expect(result.errors).toEqual([]);
  });
  it('reports each missing or whitespace-only file with original readable bytes and no normalization',()=>{
    const root=workspace();mkdirSync(join(root,'phases'));writeFileSync(join(root,'decision-log.md'),'direction\r\n');writeFileSync(join(root,'spec.md'),' \t\r\n');const result=inspectMaterialWorkspace(root);
    expect(result.status).toBe('not_ready');expect(result.missing).toEqual(['spec.md','phases/index.md']);expect(result.files).toEqual({'decision-log.md':'direction\r\n'});expect(result.errors).toEqual([]);
  });
  it('returns every indexed Phase at its actual path and reflects changed bytes while other files stay exact',()=>{
    const root=workspace(),files=seed(root),before=inspectMaterialWorkspace(root);expect(before.files).toEqual(files);expect(materialFilesForCohort('post',before.files)).toEqual(['decision-log.md','spec.md','phases/index.md','phases/P1.md','phases/P2.md']);
    const changed='phase two changed\r\n';writeFileSync(join(root,'phases/P2.md'),changed);const after=inspectMaterialWorkspace(root);expect(after.status).toBe('working');expect(after.files).toEqual({...files,'phases/P2.md':changed});expect(before.files).toEqual(files);
  });
  it.each([
    ['duplicate',phaseIndex(['P1','phases/P1.md'],['P1','phases/P1.md']),['P1.md'],/duplicate Phase/],
    ['gap',phaseIndex(['P1','phases/P1.md'],['P3','phases/P3.md']),['P1.md','P3.md'],/consecutive ordered/],
    ['escape',phaseIndex(['P1','phases/../P1.md']),['P1.md'],/mismatched Phase authority/],
    ['extra',phaseIndex(['P1','phases/P1.md']),['P1.md','P2.md'],/phases\/P2.md:unindexed_phase/],
    ['missing',phaseIndex(['P1','phases/P1.md'],['P2','phases/P2.md']),['P1.md'],null],
  ])('reports %s Phase inventory with the actual source of failure',(_kind,index,names,error)=>{
    const root=workspace();writeFileSync(join(root,'decision-log.md'),'decision\n');writeFileSync(join(root,'spec.md'),'spec\n');mkdirSync(join(root,'phases'));writeFileSync(join(root,'phases/index.md'),index);for(const name of names)writeFileSync(join(root,'phases',name),name+'\n');const result=inspectMaterialWorkspace(root);
    expect(result.status).toBe('not_ready');expect(result.files['phases/index.md']).toBe(index);if(error)expect(result.errors.join('\n')).toMatch(error);else{expect(result.missing).toEqual(['phases/P2.md']);expect(result.errors).toEqual([]);}expect(readFileSync(join(root,'phases/index.md'),'utf8')).toBe(index);
  });
  it('ignores prose Phase mentions outside the authority table but rejects unindexed or indexless map entries',()=>{
    const index=phaseIndex(['P1','phases/P1.md'])+'\nRead `phases/P9.md` only as an example.\n';expect(materialFilesForCohort('post',{'phases/index.md':index})).toEqual(['decision-log.md','spec.md','phases/index.md','phases/P1.md']);
    expect(()=>materialFilesForCohort('post',{'phases/index.md':index,'phases/P1.md':'first','phases/P2.md':'extra'})).toThrow(/unindexed Phase/);expect(()=>materialFilesForCohort('post',{'phases/P1.md':'first'})).toThrow(/without an index/);
  });
  it('awaits protected replacement of one material with exact bytes and preserves every other source',async()=>{
    const root=workspace(),files=seed(root),body='# spec\r\n\r\n```js\r\nconst value = 2;  \r\n```\r\n';expect(await replaceMaterialAtomic(root,'spec.md',body)).toEqual({file:'spec.md',bytes:Buffer.byteLength(body)});expect(inspectMaterialWorkspace(root).files).toEqual({...files,'spec.md':body});expect(readdirSync(root).sort()).toEqual(['decision-log.md','phases','spec.md']);
    expect(await replaceMaterialAtomic(root,'phases/P2.md','updated phase\n')).toEqual({file:'phases/P2.md',bytes:14});expect(readFileSync(join(root,'phases/P2.md'),'utf8')).toBe('updated phase\n');
  });
  it('uses the live ArtifactDir owner with consistent ordinary post metadata for actual material reads and writes',async()=>{
    const root=workspace(),task={identity:{taskId:'root-materials'},manifest:{task_id:'root-materials',activation_cohort:'post'}},artifacts=ArtifactDir.open(root,task);mkdirSync(join(artifacts.root,'phases'),{recursive:true});const files={'decision-log.md':'decision\n','spec.md':'old spec\n','phases/index.md':phaseIndex(['P1','phases/P1.md']),'phases/P1.md':'phase one\n'};
    for(const[file,body]of Object.entries(files))await artifacts.writeAtomic(file,body);await artifacts.writeAtomic('spec.md','new spec\n');expect(artifacts.root).toBe(join(root,'specs','root-materials'));expect(artifacts.reference('spec.md')).toBe('specs/root-materials/spec.md');expect(artifacts.read('spec.md')).toBe('new spec\n');expect(inspectMaterialWorkspace(artifacts.root).files).toEqual({...files,'spec.md':'new spec\n'});
  });
  it('rejects unsafe names, empty text and retired write controls before file effects',async()=>{
    const root=workspace(),files=seed(root);for(const file of['../outside.md','/absolute.md','materials-current.json','plan.md','tasks.md','phases/../P1.md'])await expect(replaceMaterialAtomic(root,file,'bad')).rejects.toThrow(/material file/);
    await expect(replaceMaterialAtomic(root,'spec.md','')).rejects.toThrow(/non-empty text/);await expect(replaceMaterialAtomic(root,'spec.md','bad',{expectedDigest:'retired'})).rejects.toThrow(/options are retired/);expect(inspectMaterialWorkspace(root).files).toEqual(files);expect(existsSync(join(root,'outside.md'))).toBe(false);
  });
  it('reports actual hardlinked material and internal ancestor alias and rejects alias writes without outside mutation',async()=>{
    const root=workspace(),files=seed(root),second=join(root,'second-spec');linkSync(join(root,'spec.md'),second);const hard=inspectMaterialWorkspace(root);expect(hard.status).toBe('not_ready');expect(hard.missing).toContain('spec.md');expect(hard.errors.join('\n')).toMatch(/spec.md:.*single-link/);expect(readFileSync(second,'utf8')).toBe(files['spec.md']);
    const aliased=workspace(),outside=join(aliased,'ordinary-inner');mkdirSync(join(outside,'phases'),{recursive:true});writeFileSync(join(outside,'phases','P1.md'),'owned outside original\n');writeFileSync(join(aliased,'decision-log.md'),'direction\n');writeFileSync(join(aliased,'spec.md'),'spec\n');symlinkSync(join(outside,'phases'),join(aliased,'phases'));const result=inspectMaterialWorkspace(aliased);expect(result.status).toBe('not_ready');expect(result.errors.join('\n')).toMatch(/phases\/index.md:.*real directory/);await expect(replaceMaterialAtomic(aliased,'phases/P1.md','bad')).rejects.toThrow(/symlink|directory/i);expect(readFileSync(join(outside,'phases','P1.md'),'utf8')).toBe('owned outside original\n');
  });
  it('leaves pre/history/unknown originals passive and refuses current cohort reads and ArtifactDir writes before effects',async()=>{
    for(const cohort of['pre','history',undefined,'unknown']){const root=workspace(),task={identity:{taskId:'old-task'},manifest:{task_id:'old-task',activation_cohort:cohort}};if(cohort===undefined)delete task.manifest.activation_cohort;const artifacts=ArtifactDir.open(root,task);await expect(artifacts.writeAtomic('spec.md','bad')).rejects.toThrow(/read.only|pre\/history/i);expect(existsSync(join(root,'specs'))).toBe(false);mkdirSync(artifacts.root,{recursive:true});const bytes='old original\r\n';writeFileSync(join(artifacts.root,'spec.md'),bytes);expect(artifacts.read('spec.md')).toBe(bytes);if(cohort!==undefined)expect(()=>inspectMaterialWorkspace(artifacts.root,{activationCohort:cohort})).toThrow(/historical materials are read-only/);await expect(artifacts.writeAtomic('spec.md','bad')).rejects.toThrow(/read.only|pre\/history/i);expect(readFileSync(join(artifacts.root,'spec.md'),'utf8')).toBe(bytes);expect(readdirSync(artifacts.root)).toEqual(['spec.md']);}
  });
});
