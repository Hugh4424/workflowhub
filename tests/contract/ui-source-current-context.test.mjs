import {describe,it,expect} from 'vitest';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {egoContext} from '../../skills/design-source-extraction/scripts/collect-design-source.mjs';
const ROOT=process.cwd();
const judgmentScript=join(ROOT,'skills/design-source-extraction/scripts/check-judgment.mjs');
const sample=readFileSync(join(ROOT,'tests/fixtures/design-port-sample/judgment/direct/judgment.md'),'utf8');
function judgment(source){const dir=mkdtempSync(join(tmpdir(),'current-design-root-'));try{const data=JSON.parse(/```json\n([\s\S]*?)```/.exec(sample)[1]);data.design_source=source;const file=join(dir,'judgment.md');writeFileSync(file,'# current source\n```json\n'+JSON.stringify(data)+'\n```');return spawnSync(process.execPath,[judgmentScript,'--input',file],{cwd:ROOT,encoding:'utf8'});}finally{rmSync(dir,{recursive:true,force:true});}}
describe('current project design-source layout, unchanged role and relative-path boundaries',()=>{
 for(const ref of ['specs/design/UI','specs/design/UI/src/components/RuntimeSettingsModal.tsx','specs/design/prototypes/current/page.html'])it('accepts the declared real design layout '+ref,()=>{const result=judgment({role:'real_design_source',ref,availability:'present'});expect(result.status,result.stderr).toBe(0);expect(JSON.parse(result.stdout)).toMatchObject({judgment_valid:true,allowed_for_construction:true});});
 for(const source of [
  {role:'current_prototype',ref:'specs/design/UI'},
  {role:'implementation_fixture',ref:'specs/design/UI'},
  {role:'real_design_source',ref:'/private/tmp/UI'},
  {role:'real_design_source',ref:'../../specs/design/UI'},
  {role:'real_design_source',ref:'specs/design/UI/../../../outside'},
  {role:'real_design_source',ref:'specs/design/UI-copy'},
  {role:'real_design_source',ref:'tests/fixtures/design-port-sample/prototype'},
 ])it('rejects alias/outside/false-role '+source.role+' '+source.ref,()=>{const result=judgment({...source,availability:'present'});expect(result.status).toBe(1);expect(result.stderr).toContain('ROLE_CONFLICT');expect(JSON.parse(result.stdout).allowed_for_construction).toBe(false);});
 it('still refuses unavailable source at the current layout',()=>{const result=judgment({role:'real_design_source',ref:'specs/design/UI',availability:'missing'});expect(result.status).toBe(1);expect(result.stderr).toContain('DESIGN_SOURCE_UNAVAILABLE');});
});
const ownName='workflowhub-qa-fixture-11111111-1111-4111-8111-111111111111';
const env={BROWSER_QA_ENGINE:'ego-lite',BROWSER_QA_EGO_TASKSPACE_NAME:ownName,BROWSER_QA_EGO_PAGE_LABEL:'p1',BROWSER_QA_EGO_HELPER_PATH:'/controlled/ego-browser'};
describe('collector consumes only the current gateway-owned named context',()=>{
 it('accepts a named context without requiring a caller-supplied numeric space id',async()=>{const context=await egoContext({}, {taskPath:'/private/tmp'},env);expect(typeof context.read).toBe('function');});
 for(const extra of [{BROWSER_QA_EGO_TASKSPACE_NAME:''},{BROWSER_QA_EGO_SPACE_ID:'71'},{BROWSER_QA_EGO_KEEP_OPEN:'1'}])it('rejects missing or retired ownership input '+JSON.stringify(extra),async()=>{await expect(egoContext({}, {taskPath:'/private/tmp'},{...env,...extra})).rejects.toThrow('OWNED_EGO_CONTEXT_REQUIRED');});
 it('retains the source-capability boundary inside a valid named context',async()=>{await expect(egoContext({}, {taskPath:'/private/tmp'},{...env,BROWSER_QA_TICKET_SOURCE_WS:'controlled-source'})).rejects.toThrow('SOURCE_CAPABILITY_IN_SCENARIO');});
});
