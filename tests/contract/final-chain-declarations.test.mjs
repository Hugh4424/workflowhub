import { describe, test, expect } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as chain from '../../runtime/task/final-chain.mjs';

// Independent oracle: N9 spec §7.1, §7.2 and AC-M7-1; production writer read-only.
// Inputs below are controlled facts, never claims of real task/user acceptance.
const COMPLEX = { value: 'complex', declared: true, source: 'level-declaration' };
const SMALL = { value: 'small', declared: true, source: 'level-declaration' };
const PLANNING = { value: 'planning', declared: true, source: 'level-declaration' };
const STATES = ['completed', 'skipped', 'not_applicable', 'incomplete', 'unavailable'];
const NAMES = ['原始需求','decision-log','调研方案','方案','spec','phase','代码实现','测试验证','最终审查','提交 PR'];
const EXPECTED = {
  small: ['required','required','on_demand','required','required','required','required','required','not_applicable','on_demand'],
  normal: ['required','required','required','required','required','required','required','required','required','on_demand'],
  complex: ['required','required','required','required','required','required','required','required','required','on_demand'],
  planning: ['required','required','required','required','not_applicable','not_applicable','not_applicable','not_applicable','not_applicable','on_demand'],
};
// Public constant indexing is ring -> level, matching LEVEL_APPLICABILITY's 10 x 4 contract.
describe('ORACLE-P1-DECLARATION', () => {
  test('fixed ten rings and five existing states', () => {
    expect(chain.RINGS.map(({ring,name}) => [ring,name])).toEqual(NAMES.map((name,i) => [i+1,name]));
    expect([...chain.RING_STATES].sort()).toEqual([...STATES].sort());
    expect(chain.LEVELS).toEqual(['small','normal','complex','planning']);
  });
  test('all forty applicability cells match independent spec table', () => {
    for (const [level, row] of Object.entries(EXPECTED)) for (let i=0;i<10;i++) {
      expect(chain.LEVEL_APPLICABILITY[i+1]?.[level], `${level} ring ${i+1}`).toEqual({applicability:row[i],source:i<4||i===9?'level-declaration':'step-table'});
    }
  });
  test('historical task without level section is undeclared complex', () => {
    expect(chain.resolveLevel({decisionLog:'# Historical task\n'})).toMatchObject({value:'complex',declared:false,source:'fallback-complex',note:'级别未取得'});
  });
  test('recommendation alone never creates a user selection', () => {
    expect(chain.resolveLevel({decisionLog:'## 级别与路线\n推荐级别：normal\n用户选择：未答\n'})).toMatchObject({value:'complex',declared:false,source:'fallback-complex'});
  });
});

describe('ORACLE-P1-PREDICATE', () => {
  test('file or directory existence alone cannot complete a ring', () => {
    expect(chain.evaluateRing({rings:{1:{exists:true,path:'/controlled/requirements.md'}}},1,COMPLEX)).toMatchObject({ring:1,state:'incomplete',counted_in_denominator:true});
  });
  test('planning implementation and small independent review are not applicable', () => {
    expect(chain.evaluateRing({},7,PLANNING)).toMatchObject({state:'not_applicable',counted_in_denominator:false});
    expect(chain.evaluateRing({},9,SMALL)).toMatchObject({state:'not_applicable',counted_in_denominator:false});
  });
  test('on-demand research distinguishes absent unknown from unknown input', () => {
    expect(chain.evaluateRing({directionChangingUnknown:false},3,SMALL)).toMatchObject({state:'not_applicable'});
    expect(chain.evaluateRing({},3,SMALL)).toMatchObject({state:'unavailable'});
  });
  test('write-set missing and write-set conflict remain different failures', () => {
    expect(chain.evaluateRing({},6,COMPLEX)).toMatchObject({state:'unavailable'});
    expect(chain.evaluateRing({specWriteSet:['a.mjs'],phaseWriteSet:['b.mjs']},6,COMPLEX)).toMatchObject({state:'incomplete'});
  });
  test('completion and evidence coverage use independent denominators', () => {
    const results = [
      {state:'completed',evidence_type:'command_exit'}, {state:'completed',evidence_type:'file_sha256'},
      {state:'incomplete',evidence_type:null}, {state:'unavailable',evidence_type:null},
      {state:'skipped',evidence_type:null}, {state:'not_applicable',evidence_type:null},
      {state:'not_applicable',evidence_type:null}, {state:'not_applicable',evidence_type:null},
      {state:'not_applicable',evidence_type:null}, {state:'not_applicable',evidence_type:null},
    ].map((r,i)=>({ring:i+1,...r}));
    expect(chain.summarize(results)).toEqual({completion:{applicable:5,completed:2,rate:0.4},metrics:{skip_rate:0.5,attestation_coverage:0.2}});
  });
  test('zero applicable denominator and illegal states do not invent success', () => {
    expect(()=>chain.summarize([])).toThrow();
    expect(()=>chain.summarize(Array.from({length:10},(_,i)=>({ring:i+1,state:'not_applicable',evidence_type:null})))).toThrow();
    expect(()=>chain.summarize([{ring:1,state:'green',evidence_type:null}])).toThrow();
  });
  test('workflow source and slug retain two distinct rows; directory is no execution', () => {
    const steps = [
      {source:'workflows/build-code/steps.json',step_slug:'test',stage:'build-code',route:'complex',owner_ref:'skills/backend-testing/SKILL.md#行为测试与证伪',applicability:'required'},
      {source:'workflows/verify-code/steps.json',step_slug:'test',stage:'verify-code',route:'complex',owner_ref:'workflows/verify-code/SKILL.md#测试充分性与检查可信度',applicability:'required'},
    ];
    const rows = chain.evaluateWorkflowSteps({steps,evidence:[],level:COMPLEX,stageScope:{declared:['build-code','verify-code'],actual:['build-code']}});
    expect(rows).toHaveLength(2);
    expect(rows.map(r=>[r.source,r.step_slug])).toEqual([
      ['workflows/build-code/steps.json','test'],['workflows/verify-code/steps.json','test'],
    ]);
    for (const row of rows) { expect(row.state).toBe('unavailable'); expect(row.owner_ref).toBeTruthy(); }
  });
  test('unknown stage collection cannot invent workflow metrics', () => {
    expect(chain.summarizeWorkflow([],null)).toBeNull();
  });
});

// Input transport shapes below are explicit seams shared with P2's future runner.
const verifiedSource = {ref:'quality/evidence/choice.md',readable:true,safe:true,verified:true};
const seven = Object.fromEntries(['scope','change_kind','independent_units','risk','credentials','dependencies','acceptance'].map(k=>[k,{value:false,source:verifiedSource}]));
const declared = (value,extra={}) => ({decisionLog:`## 级别与路线\n用户选择：${value}\n原 ref：quality/evidence/choice.md\n`,levelDeclaration:{selected:value,confirmed:true,source:verifiedSource,entrySource:verifiedSource,facts:seven},...extra});
const cmd = {evidence_type:'command_exit',command:'node controlled-check.mjs',exit_code:0,ref:'quality/tests/control.json',readable:true,verified:true};
const sha = {evidence_type:'file_sha256',ref:'requirements.md',sha256:'a'.repeat(64),readable:true,verified:true,nonempty:true};
const b = (ring,extra={}) => ({rings:{[ring]:extra}});
const row = (source,slug,extra={})=>({source,step_slug:slug,stage:'make-decision',route:'normal',owner_ref:'workflows/make-decision/flows/normal/SKILL.md#方法',applicability:'required',...extra});

describe('ORACLE-P1-DECLARATION complete source cases',()=>{
  test.each(['small','normal','complex','planning'])('real confirmed controlled %s choice resolves',value=>{
    expect(chain.resolveLevel(declared(value))).toMatchObject({value,declared:true,source:'level-declaration'});
  });
  test.each(['source','entrySource','facts'])('missing %s cannot become a declaration',key=>{
    const input=declared('normal');delete input.levelDeclaration[key];
    expect(chain.resolveLevel(input)).toMatchObject({value:'complex',declared:false,source:'fallback-complex'});
  });
  test.each([{readable:false},{safe:false},{verified:false}])('unreadable or unsafe source falls back: %j',invalid=>{
    const input=declared('normal');input.levelDeclaration.source={...verifiedSource,...invalid};
    expect(chain.resolveLevel(input)).toMatchObject({value:'complex',declared:false,source:'fallback-complex'});
  });
  test('new recommendation does not overwrite old confirmed choice',()=>{
    const input=declared('small');input.decisionLog+='推荐级别：normal\n用户新答复：未答\n';
    input.levelDeclaration.recommendation='normal';
    expect(chain.resolveLevel(input)).toMatchObject({value:'small',declared:true});
  });
  test('new confirmed choice replaces old; conflicting choice and new risk fall back',()=>{
    const changed=declared('normal');changed.levelDeclaration.history=[{selected:'small',confirmed:true,source:verifiedSource}];
    expect(chain.resolveLevel(changed)).toMatchObject({value:'normal',declared:true});
    for(const extra of [{conflict:true},{invalidatedByRisk:true}]){
      const input=declared('normal');Object.assign(input.levelDeclaration,extra);
      expect(chain.resolveLevel(input)).toMatchObject({value:'complex',declared:false});
    }
  });
  test('empty, unknown and task nature are not route selections',()=>{
    for(const text of ['## 级别与路线\n','## 级别与路线\n用户选择：星际\n','## 级别与路线\n任务性质：普通任务\n']){
      expect(chain.resolveLevel({decisionLog:text})).toMatchObject({value:'complex',declared:false});
    }
  });
});

describe('ORACLE-P1-PREDICATE complete evidence cases',()=>{
  test('command evidence and original hash are useful but existence fields are not',()=>{
    expect(chain.evaluateRing(b(1,{...sha}),1,COMPLEX)).toMatchObject({state:'completed',evidence_type:'file_sha256'});
    expect(chain.evaluateRing(b(8,{...cmd}),8,COMPLEX)).toMatchObject({state:'completed',evidence_type:'command_exit'});
    expect(chain.evaluateRing(b(1,{path:'x',sha256:'a'.repeat(64),exists:true}),1,COMPLEX).state).not.toBe('completed');
  });
  test.each([2,5])('ring %s exit zero cannot hide zero scan or missing sections',ring=>{
    const positive={...cmd,nonempty:true,scan_count:3,decision_count:1,required_sections_present:true,contract_ok:true};
    expect(chain.evaluateRing(b(ring,positive),ring,COMPLEX).state).toBe('completed');
    for(const invalid of [{nonempty:false},{scan_count:0},{required_sections_present:false},...(ring===2?[{decision_count:0}]:[{contract_ok:false}])]){
      expect(chain.evaluateRing(b(ring,{...positive,...invalid}),ring,COMPLEX).state).not.toBe('completed');
    }
  });
  test.each(['source','fr_ac','phase_task','oracle'])('tracking row missing %s is incomplete',key=>{
    const tracking={source:'R1',fr_ac:['FR1','AC1'],phase_task:'P1/T1',oracle:'ORACLE-1'};
    expect(chain.evaluateRing(b(4,{...cmd,rows:[tracking]}),4,COMPLEX).state).toBe('completed');
    const invalid={...tracking};delete invalid[key];
    expect(chain.evaluateRing(b(4,{...cmd,rows:[invalid]}),4,COMPLEX).state).toBe('incomplete');
  });
  test('delivery decision and real timing yield four different outcomes',()=>{
    const choices=[
      [{declared:false},'not_applicable'],
      [{declared:true,reached:false,timing_verified:true},'skipped'],
      [{declared:true,reached:true,timing_verified:true},'incomplete'],
      [{declared:true},'unavailable'],
      [{declared:true,reached:true,timing_verified:true,pr:{number:11,url:'https://example.test/pr/11',head:'abc',base:'main',...cmd}},'completed'],
    ];
    for(const [delivery,state]of choices)expect(chain.evaluateRing({delivery},10,COMPLEX).state).toBe(state);
    expect(chain.evaluateRing({},10,COMPLEX).state).toBe('unavailable');
  });
  test('normal review needs same task whole implementation and real provider original',()=>{
    const review={...cmd,task_id:'controlled',stage:'build-code',review_scope:'phase',subject_kind:'phase',review_kind:null,phase_id:null,surface:'code',current_scope:true,independent:true,provider:{provider:'controlled-provider',status:'completed',parse_outcome:'ok',raw_ref:'quality/reviews/raw.json',readable:true},material_coverage:{provider:'controlled-provider',read:[],unread:[],undetermined:['real provider semantic coverage']}};
    const input={task_id:'controlled',rings:{9:review}};
    const normal={value:'normal',declared:true,source:'level-declaration'};
    expect(chain.evaluateRing(input,9,normal).state).toBe('completed');
    for(const invalid of [{task_id:'other'},{phase_id:'P1'},{surface:'document'},{independent:false},{provider:{status:'failed',parse_outcome:'error'}}]){
      expect(chain.evaluateRing({...input,rings:{9:{...review,...invalid}}},9,normal).state).not.toBe('completed');
    }
  });
  test('conflict and undeclared fallback are preserved in observable basis',()=>{
    const conflict=chain.evaluateRing(b(1,{...sha,conflict:'mismatched original'}),1,COMPLEX);
    expect(conflict.state).toBe('incomplete');expect(conflict.conflict).toBeTruthy();
    const fallback=chain.evaluateRing(b(1,sha),1,{value:'complex',declared:false,source:'fallback-complex',note:'级别未取得'});
    expect(JSON.stringify(fallback.basis)).toContain('级别未取得');expect(JSON.stringify(fallback.basis)).toContain('fallback-complex');
  });
  test('duplicate basis binds first original without upgrading strength',()=>{
    const result=chain.evaluateRing(b(1,{...sha,basis:[sha,{...sha,duplicate_of:'requirements.md'}]}),1,COMPLEX);
    const duplicate=result.basis.find(x=>x.duplicate_of);
    expect(duplicate).toBeTruthy();expect(duplicate.duplicate_of).toBe('requirements.md');
    expect(duplicate.evidence_level).toBe('file_sha256');
  });
  test('unknown ring and unknown evidence type expose invalid input',()=>{
    expect(()=>chain.evaluateRing({},11,COMPLEX)).toThrow();
    expect(()=>chain.evaluateRing(b(1,{evidence_type:'directory_exists'}),1,COMPLEX)).toThrow();
  });
});

describe('ORACLE-P1-PREDICATE workflow completeness',()=>{
  test.each(['small','normal','complex','planning'])('%s explicit current route selects only that route',route=>{
    const steps=['small','normal','complex','planning'].map(r=>row(`workflows/make-decision/flows/${r}/steps.json`,'read',{route:r}));
    const output=chain.evaluateWorkflowSteps({steps,evidence:[],level:{value:route,declared:true},stageScope:null});
    expect(output.map(x=>[x.source,x.step_slug])).toEqual([[`workflows/make-decision/flows/${route}/steps.json`,'read']]);
  });
  test('missing owner and directory only never imply human completion',()=>{
    const step=row('workflows/build-code/steps.json','implement',{stage:'build-code',route:'complex',owner_ref:null});
    const output=chain.evaluateWorkflowSteps({steps:[step],evidence:[{source:step.source,step_slug:step.step_slug,exists:true,directory:'quality/evidence'}],level:COMPLEX,stageScope:null});
    expect(output).toHaveLength(1);expect(output[0].state).toBe('unavailable');expect(output[0].limits.length).toBeGreaterThan(0);
  });
  test('legal skip has explicit rule; failed checker beats missing human',()=>{
    const skip=row('workflows/build-code/steps.json','ui',{stage:'build-code',route:'complex',trigger:false,executed:false,rule_ref:'P1#无浏览器面'});
    const failed=row('workflows/build-code/steps.json','check',{stage:'build-code',route:'complex'});
    const output=chain.evaluateWorkflowSteps({steps:[skip,failed],evidence:[{source:failed.source,step_slug:'check',program:{...cmd,exit_code:1}}],level:COMPLEX,stageScope:null});
    expect(output.map(x=>x.state)).toEqual(['not_applicable','incomplete']);
  });
  test('no human original is unavailable even with successful checker',()=>{
    const step=row('workflows/make-decision/flows/normal/steps.json','review');
    const output=chain.evaluateWorkflowSteps({steps:[step],evidence:[{source:step.source,step_slug:'review',program:cmd}],level:{value:'normal'},stageScope:null});
    expect(output).toHaveLength(1);expect(output[0].state).toBe('unavailable');
  });
  test('workflow coverage and stage skipping use different independent denominators',()=>{
    const results=[
      {source:'a',step_slug:'x',state:'completed',applicability:'required',basis:[cmd]},
      {source:'b',step_slug:'y',state:'unavailable',applicability:'required',basis:[]},
      {source:'c',step_slug:'z',state:'not_applicable',applicability:'not_applicable',basis:[]},
    ];
    const metrics=chain.summarizeWorkflow(results,{declared:['make-decision','build-plan','build-code','verify-code'],actual:['make-decision','build-plan','build-code'],skipped:[{stage:'verify-code',rule_ref:'controlled-rule',confirmed:true}],verified:true});
    expect(metrics).toMatchObject({step_attestation_coverage:0.5,stage_skip_rate:0.25});
    expect(chain.summarizeWorkflow([], {declared:[],actual:[],verified:true})).toBeNull();
  });
});

// A real temporary text read exercises the same public parser input without giving it fs access.
describe('ORACLE-P1-DECLARATION temporary original',()=>{
  test('controlled file bytes resolve through the same text seam and cleanup',()=>{
    const dir=mkdtempSync(join(tmpdir(),'n9-p1-level-'));
    try { const input=declared('normal'); const file=join(dir,'decision-log.md');writeFileSync(file,input.decisionLog);
      input.decisionLog=readFileSync(file,'utf8');expect(chain.resolveLevel(input)).toMatchObject({value:'normal',declared:true});
    } finally { rmSync(dir,{recursive:true,force:true}); }
  });
});

describe('ORACLE-P1-PREDICATE workflow real readback seam',()=>{
  test('identified human original can complete; conflicting source cannot',()=>{
    const step=row('workflows/make-decision/flows/normal/steps.json','review');
    const human={ref:'quality/evidence/reader.md',readable:true,verified:true,source:step.source,step_slug:'review',reader:'independent-reader',inputs:'controlled two alternatives',observation:'original criteria satisfied',criteria_ref:step.owner_ref,conclusion:'completed',limits:['controlled sample']};
    const evaluate=h=>chain.evaluateWorkflowSteps({steps:[step],evidence:[{source:step.source,step_slug:'review',program:cmd,human:h}],level:{value:'normal'},stageScope:null});
    expect(evaluate(human)[0]).toMatchObject({state:'completed'});
    expect(evaluate({...human,source:'wrong/source.json'})[0].state).not.toBe('completed');
  });
});


// Additive TCR 124, independently read back in 125; spec §7.3 and AC-M1-2.
describe('ORACLE-P1-PREDICATE explanatory basis evidence boundary', () => {
  const fallback = {value:'complex',declared:false,source:'fallback-complex',note:'级别未取得'};
  const allRings = bundle => Array.from({length:10},(_,i)=>chain.evaluateRing(bundle,i+1,fallback));
  test('completely missing originals keep explanations without evidence or coverage', () => {
    const results=allRings({});
    for(const result of results){
      expect(result.state).not.toBe('completed');
      expect(result.evidence_type).toBeNull();
      expect(result.basis.length).toBeGreaterThan(0);
      expect(JSON.stringify(result.basis)).toContain('级别未取得');
      expect(JSON.stringify(result.basis)).toContain('fallback-complex');
      for(const explanation of result.basis){expect(explanation.evidence_level).toBeNull();expect(explanation.duplicate_of).toBeUndefined();}
    }
    expect(chain.summarize(results).metrics.attestation_coverage).toBe(0);
    const step=row('workflows/build-code/steps.json','implement',{stage:'build-code',route:'complex'});
    const steps=chain.evaluateWorkflowSteps({steps:[step],evidence:[],level:fallback,stageScope:null});
    expect(steps).toHaveLength(1);expect(steps[0].state).toBe('unavailable');
    expect(chain.summarizeWorkflow(steps,{declared:['build-code'],actual:['build-code'],skipped:[],verified:true}).step_attestation_coverage).toBe(0);
  });
  test('one real original counts once and fallback explanations cannot inflate coverage', () => {
    const results=allRings(b(1,sha));
    expect(results[0]).toMatchObject({state:'completed',evidence_type:'file_sha256'});
    expect(results[0].basis.some(entry=>entry.evidence_level==='file_sha256')).toBe(true);
    expect(JSON.stringify(results[0].basis)).toContain('级别未取得');
    expect(chain.summarize(results).metrics.attestation_coverage).toBe(0.1);
    const duplicated=results.map(result=>({...result,basis:[...result.basis,{evidence_level:null,notes:['级别未取得','fallback-complex']},{evidence_level:null,notes:['级别未取得','fallback-complex']}]}));
    expect(chain.summarize(duplicated).metrics.attestation_coverage).toBe(0.1);
    const removed=allRings({});
    expect(removed[0].state).not.toBe('completed');
    expect(chain.summarize(removed).metrics.attestation_coverage).toBe(0);
  });
});


// Additive regression TCR135, independent readback137; original 49 tests unchanged.
describe('ORACLE-P1-PREDICATE reviewed regression boundaries',()=>{
 test('same human original cannot count twice while distinct originals each count',()=>{
  const scope={declared:['build-code','verify-code'],actual:['build-code','verify-code'],skipped:[],verified:true};
  const make=(secondRef)=>[
   {source:'workflows/build-code/steps.json',step_slug:'implement',state:'completed',applicability:'required',basis:[{evidence_level:'record_ref',ref:'quality/evidence/shared-human.md',verified:true,readable:true,reader:'independent-reader',source:'workflows/build-code/steps.json',step_slug:'implement'}]},
   {source:'workflows/verify-code/steps.json',step_slug:'review',state:'completed',applicability:'required',basis:[{evidence_level:'record_ref',ref:secondRef,verified:true,readable:true,reader:'independent-reader',source:'workflows/verify-code/steps.json',step_slug:'review'}]},
  ];
  const duplicate=chain.summarizeWorkflow(make('quality/evidence/shared-human.md'),scope);
  const distinct=chain.summarizeWorkflow(make('quality/evidence/second-human.md'),scope);
  expect(distinct).toMatchObject({step_attestation_denominator:2,step_attestation_numerator:2,step_attestation_coverage:1,stage_skip_rate:0});
  expect(duplicate).toMatchObject({step_attestation_denominator:2,step_attestation_numerator:1,step_attestation_coverage:0.5,stage_skip_rate:0});
 });
 test('verified PR with conflict remains incomplete and removing only conflict completes',()=>{
  const delivery={declared:true,reached:true,timing_verified:true,pr:{number:11,url:'https://example.test/pr/11',head:'abc',base:'main',...cmd}};
  const clean=chain.evaluateRing({delivery},10,COMPLEX);
  expect(clean.state).toBe('completed');expect(clean.conflict).toBeFalsy();
  const conflict='PR head differs from delivered commit';
  const invalid=chain.evaluateRing({delivery,rings:{10:{conflict}}},10,COMPLEX);
  expect(invalid).toMatchObject({state:'incomplete',conflict,counted_in_denominator:true});
 });
});


// TCR156 A/B/D independently accepted159; C requires separate160 review.
describe('ORACLE-P1-PREDICATE producer route and failure boundaries',()=>{
 test.each(['small','normal','complex','planning'])('root and actual flows are mutually exclusive for %s',route=>{
  const root=row('workflows/make-decision/steps.json','load-context',{route:undefined});
  const flows=['small','normal','planning'].map(value=>row('workflows/make-decision/flows/'+value+'/steps.json','load-context',{route:value}));
  const expected=route==='complex'?root:flows.find(step=>step.route===route);
  const chosen=chain.evaluateWorkflowSteps({steps:[root,...flows],evidence:[],level:{value:route,declared:true},stageScope:null});
  const single=chain.evaluateWorkflowSteps({steps:[expected],evidence:[],level:{value:route,declared:true},stageScope:null});
  expect(single.map(r=>[r.source,r.step_slug])).toEqual([[expected.source,'load-context']]);
  expect(chosen.map(r=>[r.source,r.step_slug])).toEqual([[expected.source,'load-context']]);
 });
 test('missing owner preserves verified target failure rather than discarding it',()=>{
  const step=row('workflows/build-code/steps.json','implement',{stage:'build-code',route:'complex',owner_ref:null});
  const evaluate=(exit,owner=null)=>chain.evaluateWorkflowSteps({steps:[{...step,owner_ref:owner}],evidence:exit===null?[]:[{source:step.source,step_slug:step.step_slug,program:{...cmd,exit_code:exit}}],level:COMPLEX,stageScope:null})[0];
  expect(evaluate(0).state).toBe('unavailable');expect(evaluate(null).state).toBe('unavailable');
  expect(evaluate(1,'skills/backend-testing/SKILL.md#行为测试与证伪').state).toBe('incomplete');
  const failed=evaluate(1);expect(failed.state).toBe('incomplete');
  expect(failed.program).toContainEqual(expect.objectContaining({command:cmd.command,exit_code:1,ref:cmd.ref}));
 });
});
describe('ORACLE-P1-DECLARATION latest sourced selection',()=>{
 test('old confirmed selection cannot impersonate newer confirmed selection',()=>{
  const oldSource={...verifiedSource,ref:'quality/evidence/old-small.md'};
  const newSource={...verifiedSource,ref:'quality/evidence/new-normal.md'};
  const input=declared('normal');
  input.decisionLog='## 级别与路线\n用户选择：small\n原 ref：quality/evidence/old-small.md\n用户选择：normal\n原 ref：quality/evidence/new-normal.md\n';
  input.levelDeclaration.source=newSource;input.levelDeclaration.history=[{selected:'small',confirmed:true,source:oldSource},{selected:'normal',confirmed:true,source:newSource}];
  expect(chain.resolveLevel(input)).toMatchObject({value:'normal',declared:true,source:'level-declaration'});
  const stale={...input,levelDeclaration:{...input.levelDeclaration,selected:'small',source:oldSource}};
  expect(chain.resolveLevel(stale)).toMatchObject({value:'complex',declared:false,source:'fallback-complex'});
 });
});


// TCR160 and164 permit the single producer-shape fixture exception above.
describe('ORACLE-P1-PREDICATE real provider coverage contract',()=>{
 test('complete coverage accepts uncertainty while missing or mismatched coverage stays unavailable',()=>{
  const coverage={provider:'controlled-provider',read:[],unread:[],undetermined:['real provider semantic coverage']};
  const review={...cmd,task_id:'controlled',stage:'build-code',review_scope:'phase',subject_kind:'phase',review_kind:null,phase_id:null,surface:'code',current_scope:true,independent:true,provider:{provider:'controlled-provider',status:'completed',parse_outcome:'ok',raw_ref:'quality/reviews/raw.json',readable:true},material_coverage:coverage};
  const evaluate=material_coverage=>chain.evaluateRing({task_id:'controlled',rings:{9:{...review,material_coverage}}},9,{value:'normal',declared:true,source:'level-declaration'});
  expect(evaluate(coverage).state).toBe('completed');
  const invalid=[{},...['read','unread','undetermined'].map(key=>{const copy={...coverage};delete copy[key];return copy;}),{...coverage,provider:'different-provider'}];
  for(const value of invalid){const result=evaluate(value);expect(result.state).toBe('unavailable');expect(result.basis.length).toBeGreaterThan(0);}
 });
});


// TCR170 independently accepted172; old58 test bytes and oracle identity preserved.
describe('ORACLE-P1-DECLARATION latest choice source binding',()=>{
 test('latest confirmed choice needs its own readable source',()=>{
  const oldSource={...verifiedSource,ref:'quality/evidence/old-small.md'};
  const newSource={...verifiedSource,ref:'quality/evidence/new-normal.md'};
  const missing=declared('normal');
  missing.decisionLog='## 级别与路线\n用户选择：small\n原 ref：quality/evidence/old-small.md\n用户选择：normal\n';
  missing.levelDeclaration.source=oldSource;
  missing.levelDeclaration.history=[{selected:'small',confirmed:true,source:oldSource},{selected:'normal',confirmed:true}];
  const complete={...missing,decisionLog:missing.decisionLog+'原 ref：quality/evidence/new-normal.md\n',levelDeclaration:{...missing.levelDeclaration,source:newSource}};
  expect(chain.resolveLevel(complete)).toMatchObject({value:'normal',declared:true,source:'level-declaration'});
  const unanswered=declared('small');unanswered.decisionLog+='推荐级别：normal\n用户新答复：未答\n';unanswered.levelDeclaration.recommendation='normal';
  expect(chain.resolveLevel(unanswered)).toMatchObject({value:'small',declared:true});
  const invalid=chain.resolveLevel(missing);
  expect(invalid).toMatchObject({value:'complex',declared:false,source:'fallback-complex',note:'级别未取得'});
  expect(invalid.reasons.length).toBeGreaterThan(0);expect(invalid.owner).toBeTruthy();
 });
});
