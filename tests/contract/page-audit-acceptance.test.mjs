// ORACLE-P8-ACCEPTANCE: fixed reader seams are not real-browser or page-quality verdicts.
import {describe,it,expect} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolveCanonicalTaskPath} from '../../runtime/task/load-config.mjs';
import {openTask} from '../../runtime/task/task-handle.mjs';
import {openCurrentTaskWorkspace} from '../../runtime/task/workspace.mjs';
import {collectErrors} from '../../skills/frontend-testing/scripts/check-page-audit.mjs';
import {validateAcceptanceEvidence} from '../../runtime/evidence/acceptance-evidence-validator.mjs';
import {mergeJudgments,lockEngine} from '../../skills/frontend-testing/scripts/run-page-audit.mjs';
import {runRegisteredScript} from '../../skills/isolated-browser-qa/scripts/browser-qa-session.mjs';

function fixedPage(mode='read') {
  let requests=0,writes=0,calls=0,observed=0,disconnected=0;
  const points=[];
  class N {
    appendChild(){writes++;} insertBefore(){writes++;} replaceChild(){writes++;} removeChild(){writes++;}
    get textContent(){return 'observed text';} set textContent(value){writes++;}
  }
  class E extends N {
    get innerHTML(){return 'text';} set innerHTML(value){writes++;}
    get outerHTML(){return '<p>text</p>';} set outerHTML(value){writes++;}
    setAttribute(){writes++;} getAttribute(){return null;}
    getBoundingClientRect(){return {x:10,y:20,width:100,height:40};}
    get scrollWidth(){
      if(mode==='fetch')win.fetch('/forbidden');
      if(mode==='xhr')new X().open('GET','/forbidden');
      if(mode==='append')this.appendChild({});
      if(mode==='throw')throw Error('CONTROLLED_GETTER_FAILURE');
      return 4383;
    }
    get clientWidth(){return 238;}
    contains(node){return node===this;}
    click(){}
  }
  class X {open(){requests++;}}
  const element=Object.assign(new E(),{id:'target',tagName:'P',className:'sample'});
  const cover={id:'cover',tagName:'DIV',className:'blocking-cover',getAttribute(name){return name==='class'?this.className:null;}};
  const win={innerWidth:640,innerHeight:960,fetch(){requests++;},matchMedia(query){return {media:query,matches:true};}};
  const document={body:element,documentElement:element,activeElement:element,querySelector(){return element;},elementFromPoint(x,y){points.push({x,y});return cover;}};
  const bindings={window:win,document,Node:N,Element:E,XMLHttpRequest:X,MutationObserver:class {observe(){observed++;}disconnect(){disconnected++;}takeRecords(){return mode==='mutation-record'?[{}]:[];}},getComputedStyle:()=>({outlineStyle:'none',getPropertyValue:()=> '100px'})};
  return {
    page:{async evaluate(fn,arg){calls++;const old=new Map();for(const[k,v]of Object.entries(bindings)){old.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});}try{return fn(arg);}finally{for(const[k,v]of old)v?Object.defineProperty(globalThis,k,v):delete globalThis[k];}}},
    stats:()=>({requests,writes,calls,observed,disconnected,points}),
    afterRestore(){win.fetch('/after');new X().open('GET','/after');element.appendChild({});return {requests,writes};},
  };
}
const read=(page,extra={})=>runRegisteredScript(page,'design-source-read-v1',{elements:[{selector:'#target',properties:[],...extra}]});

describe('ORACLE-P8-ACCEPTANCE registered facts',()=>{
  it('reads literal fixed scroll, hit, reduced-motion and active-element facts',async()=>{
    const f=fixedPage();
    const [row]=await read(f.page,{facts:['scroll','hit-test','reduced-motion','active-element']});
    expect(row.facts).toEqual({
      scroll:{scrollWidth:4383,clientWidth:238},
      hit_test:{point:{x:60,y:40},target:{id:'cover',tag:'DIV',class_name:'blocking-cover'},inside_selected:false},
      reduced_motion:{media:'(prefers-reduced-motion: reduce)',matches:true},
      active_element:{id:'target',tag:'P',outlineStyle:'none',selected:true},
    });
    expect(f.stats()).toMatchObject({requests:0,writes:0,calls:1,observed:1,disconnected:1,points:[{x:60,y:40}]});
  });
  it('accepts only a bounded numeric hit point as data',async()=>{
    const f=fixedPage();const [row]=await read(f.page,{facts:['hit-test'],point:{x:4,y:5}});
    expect(row.facts.hit_test.point).toEqual({x:4,y:5});expect(f.stats().points).toEqual([{x:4,y:5}]);
  });
  it('preserves legacy read shape and prepare output',async()=>{
    const f=fixedPage();const [row]=await read(f.page);
    expect(Object.keys(row)).toEqual(['selector','viewport_observed','structure','rendered','declared']);
    expect(row.rendered.styles).toEqual({});expect(row.viewport_observed).toEqual({width:640,height:960});
    expect(await runRegisteredScript(f.page,'design-source-prepare-v1',{actions:[{type:'click',selector:'#target'}]})).toEqual([]);
  });
  it('rejects unknown ID before any page access even with supported facts',async()=>{
    let calls=0;await expect(runRegisteredScript({evaluate(){calls++;}},'unknown',{elements:[{selector:'#target',properties:[],facts:['scroll']}]})).rejects.toMatchObject({code:'UNREGISTERED_SCRIPT'});expect(calls).toBe(0);
  });
  for(const [name,extra]of [
    ['unknown-fact',{facts:['cookie']}],['code-fact',{facts:[()=>42]}],['duplicate-fact',{facts:['scroll','scroll']}],
    ['unused-point',{facts:['scroll'],point:{x:1,y:1}}],['nan-point',{facts:['hit-test'],point:{x:NaN,y:1}}],
    ['infinite-point',{facts:['hit-test'],point:{x:Infinity,y:1}}],['negative-point',{facts:['hit-test'],point:{x:-1,y:1}}],
    ['huge-point',{facts:['hit-test'],point:{x:1000001,y:1}}],['extra-point-code',{facts:['hit-test'],point:{x:1,y:1,expression:'document.cookie'}}],
    ['extra-expression',{facts:['scroll'],expression:'document.cookie'}],
  ])it('rejects '+name+' before page access',async()=>{
    let calls=0;await expect(read({evaluate(){calls++;}},extra)).rejects.toMatchObject({code:'INVALID_COLLECTION_ARGUMENTS'});expect(calls).toBe(0);
  });
  for(const mode of ['fetch','xhr','append','throw','mutation-record'])it('retains fixed-facts guard and restores after '+mode,async()=>{
    const f=fixedPage(mode);await expect(read(f.page,{facts:['scroll']})).rejects.toThrow(mode==='fetch'||mode==='xhr'?'READ_ONLY_NETWORK':mode==='append'?'READ_ONLY_DOM_WRITE':mode==='throw'?'CONTROLLED_GETTER_FAILURE':'READ_ONLY_MUTATION_DETECTED');
    expect(f.stats()).toMatchObject({requests:0,writes:0,disconnected:1});expect(f.afterRestore()).toEqual({requests:2,writes:1});
  });
});

// Task evidence is external. Resolve it through the existing authenticated Task API;
// no personal absolute path, alternate registry, source writes or evidence writes here.
const TASK_ID='workflowhub-ui-frontend-c07-real-page-verification-20261028';
const BUILD='quality/evidence/build-code/', AB=BUILD+'P8-real-environment/ab-native/', FN=BUILD+'P8-real-environment/failure-native/';
const EIGHT=['业务任务','IA 导航','交互状态','内容数据','视觉规范','响应式布局','无障碍','真实代码交接'];
const NINE=['layout','typography','colors','spacing','shadows','borders','radius','icons','states'];
const TEN=['default','loading','empty','error','cancel','boundary','permission','duplicate','partial','unknown'];
const SEVEN=Array.from({length:7},(_,i)=>'AC-C07-'+(i+1));
const RESULTS=['pass','fail','inconclusive','deferred','missing','inconsistent','incomplete','unavailable'];
let taskCache;
function taskEvidence(){
  if(!taskCache){const r=resolveCanonicalTaskPath({project:'workflowhub',task:TASK_ID});taskCache={root:r.taskPath,task:openTask(r.taskPath,{projectName:'workflowhub',taskId:TASK_ID})};}
  return taskCache;
}
function refOf(value){const {root}=taskEvidence();return value.startsWith(root+'/')?value.slice(root.length+1):value;}
const bytes=ref=>taskEvidence().task.readRecordBytes(refOf(ref));
const json=ref=>JSON.parse(bytes(ref).toString('utf8'));
const sha=value=>createHash('sha256').update(value).digest('hex');
const nonempty=value=>typeof value==='string'&&value.trim().length>0;
function original(reference){
  if(!reference||!nonempty(reference.ref)||!/^[a-f0-9]{64}$/.test(reference.sha256??''))return false;
  try{return sha(bytes(reference.ref))===reference.sha256;}catch{return false;}
}
const fields=['workspace','service','route','object_version','engine_session','state','viewport','engine'];
function objectDiff(declared,observed){return fields.flatMap(field=>{
  const normalize=value=>field==='viewport'&&typeof value==='string'?value.split('@')[0]:value;
  return normalize(declared?.[field])===normalize(observed?.[field])&&observed?.[field]!==undefined?[]:[{field,declared:declared?.[field]??'未取得',observed:observed?.[field]??'未取得'}];
});}
function readinessProblems(doc){
  const out=[];if(!doc||!RESULTS.includes(doc.status))out.push('status');
  if(!Array.isArray(doc?.gaps))out.push('gaps');
  if(doc?.status==='pass'&&doc.gaps?.length)out.push('pass-with-gap');
  for(const reference of doc?.references??[])if(!original(reference))out.push('original:'+reference.ref);
  return out;
}
function replay(report){
  const errors=collectErrors(report).map(e=>e.code),matrix=json(AB+'2026-10-29-234-matrix-cases.json');
  const criteria=report.criteria??[];
  for(const dimension of EIGHT)if(!criteria.some(c=>c.dimension===dimension))errors.push('E_DIMENSION_MISSING');
  for(const subitem of NINE){const c=criteria.find(c=>c.dimension==='视觉规范'&&c.subitem===subitem);if(!c||!c.raw||!Object.keys(c.raw).length)errors.push('E_VISUAL_RAW_MISSING');
    else {
      const elements=c.raw.elements,hasValues=Array.isArray(elements)&&elements.some(e=>e.values&&Object.keys(e.values).length);
      const valid=subitem==='layout'?Array.isArray(elements)&&elements.some(e=>Number.isFinite(e.width)&&Number.isFinite(e.height)&&Array.isArray(e.border)):
        subitem==='typography'?hasValues&&elements.some(e=>nonempty(e.values['font-size'])&&nonempty(e.values['font-family'])):
        subitem==='colors'?hasValues&&elements.some(e=>nonempty(e.values.color)&&nonempty(e.values['background-color'])):
        ['spacing','shadows','borders','radius'].includes(subitem)?hasValues:
        subitem==='icons'?c.state==='未测'&&nonempty(c.untested_reason)&&Number.isFinite(c.raw.rendered_viewport?.width)&&Number.isFinite(c.raw.rendered_viewport?.height):
        subitem==='states'?TEN.includes(c.raw.state)&&Array.isArray(elements):false;
      if(!valid)errors.push('E_VISUAL_RAW_TYPE');
      const row=matrix.find(m=>refOf(m.raw.ref)===refOf(c.evidence?.[0]?.ref??''));
      if(row){const observed=json(row.raw.ref);
        for(const item of elements??[]){const actual=observed.observations?.find(e=>e.selector===item.selector);if(!actual){errors.push('E_RAW_NOT_ORIGINAL');continue;}
          const values=Object.fromEntries(actual.style?.computedStyle?.map(v=>[v.name,v.value])??[]);
          for(const[key,value]of Object.entries(item.values??item.computed??{}))if(values[key]!==value)errors.push('E_RAW_NOT_ORIGINAL');
          if(item.border&&JSON.stringify(item.border)!==JSON.stringify(actual.box?.model?.border))errors.push('E_RAW_NOT_ORIGINAL');
          if(item.width!==undefined&&item.width!==actual.box?.model?.width)errors.push('E_RAW_NOT_ORIGINAL');
          if(item.height!==undefined&&item.height!==actual.box?.model?.height)errors.push('E_RAW_NOT_ORIGINAL');
          if(item.attributes&&JSON.stringify(item.attributes)!==JSON.stringify(actual.node?.node?.attributes??[]))errors.push('E_RAW_NOT_ORIGINAL');
        }
        if(c.raw.state!==undefined&&c.raw.state!==row.object.state)errors.push('E_RAW_NOT_ORIGINAL');
        if(c.raw.rendered_viewport){const png=bytes(row.screenshot.ref),pic=c.raw.rendered_viewport;if(pic.width!==png.readUInt32BE(16)||pic.height!==png.readUInt32BE(20)||pic.sha256!==sha(png))errors.push('E_RAW_NOT_ORIGINAL');}
      }
    }
  }
  for(const c of criteria){
    for(const e of c.evidence??[]){
      if(!original(e))errors.push('E_BYTES_MISMATCH');
      const row=matrix.find(m=>refOf(m.raw.ref)===refOf(e.ref)||m.screenshot&&refOf(m.screenshot.ref)===refOf(e.ref));
      if(row){if(objectDiff(c.raw_scope,row.object).length)errors.push('E_OBJECT_MISMATCH');}
      else if(c.raw_perf_original&&refOf(c.raw_perf_original.ref)===refOf(e.ref)){
        if(objectDiff(c.raw_perf_object,json(e.ref).object).length)errors.push('E_OBJECT_MISMATCH');
      }else errors.push('E_OBJECT_UNVERIFIED');
    }
    if(c.raw_perf_original){
      if(!original(c.raw_perf_original))errors.push('E_BYTES_MISMATCH');
      else {const doc=json(c.raw_perf_original.ref);
        if(doc.failures?.some(f=>f.class==='TOOL_ERROR'))errors.push('E_TOOL_ERROR');
        if(JSON.stringify(c.raw?.perf)!==JSON.stringify(doc.items?.[0]?.perf))errors.push('E_RAW_NOT_ORIGINAL');
      }
    }
  }
  for(const page of ['a-simulation','a-workbench','b-index'])for(const width of[1440,1024,640])for(const state of TEN){
    const cell=report.coverage_matrix?.find(c=>c.page===page&&c.width===width&&c.state===state);
    if(!cell||!cell.raw&&!nonempty(cell.untested_reason))errors.push('E_COVERAGE_GAP');
  }
  return [...new Set(errors)];
}
function reportBindingProblems(report,observed,collectorReferences){
  const errors=[],known=new Set(collectorReferences.map(e=>refOf(e.ref)));
  if(objectDiff(report.object,observed).length)errors.push('E_OBJECT_MISMATCH');
  const normRef=refOf(collectorReferences[0].ref).replace(/[^/]+$/,'norm-facts.json');
  for(const criterion of report.criteria??[]){let pageObservations=0;
    for(const reference of criterion.evidence??[]){
      if(!original(reference)){errors.push('E_BYTES_MISMATCH');continue;}
      const ref=refOf(reference.ref),document=known.has(ref)||ref===normRef?json(ref):null;
      if(known.has(ref)){
        if(objectDiff(document.object,observed).length)errors.push('E_OBJECT_MISMATCH');
        if(document.failures?.some(f=>f.class==='TOOL_ERROR'))errors.push('E_TOOL_ERROR');
        if(document.failures?.some(f=>f.class==='UNREACHABLE'))errors.push('E_UNREACHABLE');
        if(document.items?.length)pageObservations++;
      }else if(ref===normRef&&Array.isArray(document.cited_norms)&&Array.isArray(document.unresolved_refs)){
        // Existing producer-owned norm provenance is secondary material, never a page observation.
      }else errors.push('E_OBJECT_UNVERIFIED');
    }
    if(criterion.state==='通过'&&(!pageObservations||criterion.norms_missing?.length))errors.push('E_UNSUPPORTED_PASS');
  }
  return [...new Set(errors)];
}
function verdictRows(document){
  const errors=[],rows=document?.per_ac;
  if(!Array.isArray(rows)||JSON.stringify(rows.map(r=>r.ac))!==JSON.stringify(SEVEN))errors.push('E_SEVEN_ROWS');
  for(const row of rows??[]){
    if(!RESULTS.includes(row.result))errors.push('E_RESULT');
    if(!original(row.evidence))errors.push('E_VERDICT_EVIDENCE');
    else if(row.result==='pass'){
      // Bytes prove the cited material, not its role. Only an existing AC-level
      // result can support pass; readiness.status and raw observations cannot.
      let claim,children;
      try{
        const source=json(row.evidence.ref);
        if(source?.schema_version==='acceptance-evidence.v1'){
          const accepted=validateAcceptanceEvidence(source);
          claim={ac:accepted.acceptance_criterion_id,result:accepted.result};children=accepted.refs;
        }else if(Array.isArray(source?.per_ac)){
          claim=source.per_ac.find(item=>item?.ac===row.ac);children=claim?.evidence?[claim.evidence]:[];
        }
      }catch{/* Non-JSON or invalid result material has no AC conclusion role. */}
      if(claim?.ac!==row.ac||claim?.result!=='pass')errors.push('E_VERDICT_EVIDENCE_ROLE');
      else if(!children?.length||children.some(reference=>!original(reference)))errors.push('E_VERDICT_CHILD_BYTES');
    }
    if(row.result!=='pass'&&![row.reason,row.condition,row.owner].every(nonempty))errors.push('E_NONPASS_REASON');
  }
  if(/防假绿成立|已通过|已闭环|用户已确认/.test(JSON.stringify(document)))errors.push('E_PROHIBITED_WORDING');
  for(const key of['evaluation_and_limits','deviations','insufficient_testing','unresolved_events','residual_risks','signoff_object'])if(!nonempty(document?.conclusions?.[key]))errors.push('E_CONCLUSION');
  if(!(document?.retest?.F2P>0&&document?.retest?.P2P>0&&['FULL','PARTIAL','NO'].includes(document.retest.coverage)&&nonempty(document.retest.denominator)))errors.push('E_RETEST');
  if(!Array.isArray(document?.writebacks)||document.writebacks.length!==5||!document.writebacks.every(nonempty))errors.push('E_WRITEBACKS');
  if(document?.writebacks?.some(path=>path==='spec.md'||path.endsWith('/spec.md')||path==='facts.jsonl'))errors.push('E_FORBIDDEN_WRITEBACK');
  return errors;
}

describe('ORACLE-P8-ACCEPTANCE entry',()=>{
  it('reads both actual readiness originals, not planned filenames',()=>{
    for(const name of['P8-data-readiness.json','P8-environment-readiness.json'])expect(existsSync(taskEvidence().task.recordPath(BUILD+name)),name).toBe(true);
    const data=json(BUILD+'P8-data-readiness.json'),env=json(BUILD+'P8-environment-readiness.json');
    expect(readinessProblems(data)).toEqual([]);expect(readinessProblems(env)).toEqual([]);
    expect(data.samples).toHaveLength(6);expect(data.phase_inputs.map(p=>p.phase_id)).toEqual(['P1','P2','P3','P4','P5','P6','P7','P9','P10','P11']);
    for(const row of data.samples)expect(sha(readFileSync(row.path)),row.path).toBe(row.observed_sha256);
    expect(env.engine).toBe('agent-browser');expect(env.auth_mode).toBe('none');
  });
  it('rejects missing readiness and an asserted pass with explicit gaps',()=>{
    expect(readinessProblems(undefined)).not.toEqual([]);
    const bad=structuredClone(json(BUILD+'P8-environment-readiness.json'));bad.status='pass';bad.gaps=['actual missing observation'];expect(readinessProblems(bad)).toContain('pass-with-gap');
  });
});

describe('ORACLE-P8-ACCEPTANCE AC-C07-1 / AC-C07-2 / AC-C07-6 replay',()=>{
  it('AC-C07-1 replays eight dimensions, nine measured subitems, real coverage and originals',()=>{
    expect(replay(json(BUILD+'P8-raw-replay-report.json'))).toEqual([]);
  });
  for(const mutation of ['missing-reason','tool-error-as-untested','total-score','missing-visual','unknown-to-zero','cross-object-ref'])it('AC-C07-1 rejects '+mutation,()=>{
    const report=structuredClone(json(BUILD+'P8-raw-replay-report.json'));
    if(mutation==='missing-reason')delete report.criteria[0].untested_reason;
    if(mutation==='tool-error-as-untested'){const ref=FN+'native-discovery-tool-error.json';report.criteria[0].raw_perf_original={ref,sha256:sha(bytes(ref))};}
    if(mutation==='total-score')report.total_score=100;
    if(mutation==='missing-visual')report.criteria=report.criteria.filter(c=>c.subitem!=='radius');
    if(mutation==='unknown-to-zero')report.criteria.find(c=>c.raw_perf_original).raw.perf.interaction.status=0;
    if(mutation==='cross-object-ref'){const other=json(AB+'2026-10-29-234-matrix-cases.json').find(c=>c.object.state==='error');report.criteria[0].evidence=[other.raw];}
    const expected={'missing-reason':'E_MISSING_UNTESTED_REASON','tool-error-as-untested':'E_TOOL_ERROR','total-score':'E_TOTAL_SCORE','missing-visual':'E_VISUAL_RAW_MISSING','unknown-to-zero':'E_RAW_NOT_ORIGINAL','cross-object-ref':'E_OBJECT_MISMATCH'};
    expect(replay(report),mutation).toContain(expected[mutation]);
  });
  it('AC-C07-1 refuses a valid-byte original with unverified object scope and a changed typography value',()=>{
    const report=structuredClone(json(BUILD+'P8-raw-replay-report.json')),ref=FN+'synthetic-page.html';
    report.criteria[0].evidence=[{ref,sha256:sha(bytes(ref))}];expect(replay(report)).toContain('E_OBJECT_UNVERIFIED');
    const changed=structuredClone(json(BUILD+'P8-raw-replay-report.json'));changed.criteria.find(c=>c.subitem==='typography').raw.elements[0].values['font-size']='999px';expect(replay(changed)).toContain('E_RAW_NOT_ORIGINAL');
  });
  it('AC-C07-1 rejects forged raw layout height',()=>{
    const report=structuredClone(json(BUILD+'P8-raw-replay-report.json'));
    report.criteria.find(c=>c.subitem==='layout').raw.elements[0].height=99999;
    expect(replay(report)).toContain('E_RAW_NOT_ORIGINAL');
  });
  it('AC-C07-1 consumes all132 applicable originals, eighteen stress and all permission/role pairs',()=>{
    const rows=json(AB+'2026-10-29-234-matrix-cases.json');expect(rows).toHaveLength(132);
    for(const row of rows){expect(original(row.raw),row.id).toBe(true);expect(fields.every(f=>nonempty(row.object[f])),row.id).toBe(true);if(row.screenshot)expect(original(row.screenshot),row.id).toBe(true);else expect(nonempty(row.screenshot_not_covered_why),row.id).toBe(true);}
    const stress=rows.filter(r=>r.stress===1);expect(stress).toHaveLength(18);expect(stress.every(r=>new URL(r.object.route,r.object.service).searchParams.get('stress')==='1')).toBe(true);
    const permission=rows.filter(r=>new URL(r.object.route,r.object.service).searchParams.has('permission'));expect(permission).toHaveLength(24);
    for(const width of[1440,1024,640])for(const value of['allow','close_only','deny','missing'])for(const role of['leader','follower'])expect(permission.some(r=>{const u=new URL(r.object.route,r.object.service);return r.object.viewport.startsWith(width+'x')&&u.searchParams.get('permission')===value&&u.searchParams.get('role')===role;}),[width,value,role].join('/')).toBe(true);
  });
  it('AC-C07-1 reads all nine recovery actions and actual post-reset default root URLs',()=>{
    const references=json(AB+'2026-10-29-549-raw-coverage.json').refs.filter(r=>r.ref.endsWith('-recovery-action.json'));expect(references).toHaveLength(9);
    for(const reference of references){expect(original(reference)).toBe(true);const value=json(reference.ref);expect(original(value.before.raw)).toBe(true);expect(original(value.after.raw)).toBe(true);expect(value.clickResult.hit.backendNodeId).toBeGreaterThan(0);expect(new URL(value.frame.frameTree.frame.url).searchParams.get('state')).toBe('default');}
  });
  it('AC-C07-2 compares the real control and all three wrong declarations against the same independent source truth',async()=>{
    const {task}=taskEvidence(),workspace=await openCurrentTaskWorkspace(task),scope=json(FN+'browser-objectscope.json'),source=bytes(FN+'synthetic-page.html').toString('utf8');
    const state=source.match(/data-state="([^"]+)"/)[1],control=json(FN+'native-console-control.json');
    const execution=json(FN+'executions.json').commands.find(c=>c.argv?.includes('--run')&&c.argv.includes(scope.url));
    expect(execution.cwd).toBe(workspace.worktreeRoot);expect(scope.ready).toContain('state='+state);
    expect(control.items.some(i=>i.stackTrace?.callFrames?.some(f=>f.url===scope.url))).toBe(true);
    const url=new URL(scope.url),observed={workspace:workspace.worktreeRoot,service:url.origin,route:url.pathname+url.search+url.hash,state,object_version:'sha256:'+sha(bytes(FN+'synthetic-page.html')),engine_session:scope.engine_session,viewport:control.object.viewport,engine:control.engine};
    const expected=[['native-console-control.json',[]],['native-wrong-workspace.json',['workspace']],['native-wrong-source.json',['object_version']],['native-wrong-state.json',['state']]];
    for(const[name,differences]of expected){const doc=json(FN+name),mismatches=objectDiff(doc.object,observed);console.log(JSON.stringify({event:'P8_actual_object_consumption',source_ref:FN+name,declared:doc.object,observed,mismatches,basis:'Authenticated worktree + actual owned server response literal SHA + native body/console URL; GET bytes were not separately archived for this synthetic original.'}));expect(mismatches.map(m=>m.field)).toEqual(differences);}
  });
  it('AC-C07-2 consumes actual formal producer references and rejects wrong bytes, unknown material and wrong collector scope',async()=>{
    const workspace=await openCurrentTaskWorkspace(taskEvidence().task),epochRef=AB+'2026-10-29-571-perf-fix-source-epoch.json',epoch=json(epochRef),rows=json(AB+'2026-10-29-590-perf-fix-final-handoff.json').rows;
    expect(epoch.cwd).toBe(workspace.worktreeRoot);for(const file of epoch.files)expect(sha(readFileSync(file.path))).toBe(file.sha256);
    for(const row of rows){
      const report=json(AB+'perf-fixed-'+row.id+'-'+row.viewport.split('x')[0]+'-report.json'),url=new URL(row.full_url),observed={workspace:workspace.worktreeRoot,service:url.origin,route:url.pathname+url.search+url.hash,object_version:epoch.head+';six-sha256@'+epochRef,engine_session:row.engine_session,state:url.searchParams.get('state'),viewport:row.viewport,engine:'agent-browser'};
      expect(original(row.ledger)).toBe(true);expect(new Set(row.three_complete_document_samples.map(s=>s.loader_id)).size).toBe(3);expect(row.three_complete_document_samples.every(s=>s.full_url===row.full_url&&s.root)).toBe(true);
      expect(reportBindingProblems(report,observed,row.collectors)).toEqual([]);
      const wrongBytes=structuredClone(report);wrongBytes.criteria[0].evidence[0].sha256='0'.repeat(64);expect(reportBindingProblems(wrongBytes,observed,row.collectors)).toContain('E_BYTES_MISMATCH');
      const unknown=structuredClone(report),ref=FN+'synthetic-page.html';unknown.criteria[0].evidence=[{ref,sha256:sha(bytes(ref))}];expect(reportBindingProblems(unknown,observed,row.collectors)).toContain('E_OBJECT_UNVERIFIED');
      const wrongScope=structuredClone(observed);wrongScope.state='error';expect(reportBindingProblems(report,wrongScope,row.collectors)).toContain('E_OBJECT_MISMATCH');
    }
  });
  it('AC-C07-2 reuses the same objectDiff for independently observed HTTP/disk/native state control and three declaration negatives',async()=>{
    const workspace=await openCurrentTaskWorkspace(taskEvidence().task),before=json(FN+'2026-10-29-010-b-native-object-truth-before.json');
    const expected=[['011-b-http-scope-control',[]],['012-b-http-scope-wrongworkspace',['workspace']],['013-b-http-scope-wrongsource',['object_version']],['014-b-http-scope-wrongstate',['state']]];
    for(const[name,differences]of expected){const record=json(FN+'2026-10-29-'+name+'.json'),truth=record.observed_before,after=record.observed_after;
      expect(truth.actual_cwd).toBe(workspace.worktreeRoot);expect(truth.workspace).toBe(workspace.worktreeRoot);expect(truth.frame_url).toBe(before.frame_url);
      for(const source of[truth.source,after.source]){expect(source.files).toHaveLength(3);for(const file of source.files){expect(file.path.startsWith(workspace.worktreeRoot+'/specs/'+TASK_ID+'/samples/B/')).toBe(true);expect(file.status).toBe(200);expect(file.http_bytes).toBe(file.bytes);expect(file.http_sha256).toBe(sha(readFileSync(file.path)));expect(file.disk_sha256).toBe(file.http_sha256);}
        expect(source.object_version).toBe('sha256:'+sha(JSON.stringify(source.files.map(({path,bytes,disk_sha256})=>({path,bytes,sha256:disk_sha256})))));
      }
      const state=truth.scenario.ax.nodes.find(n=>n.role?.value==='combobox').value.value,afterState=after.scenario.ax.nodes.find(n=>n.role?.value==='combobox').value.value;expect(state).toBe('default');expect(afterState).toBe(state);expect(after.frame_url).toBe(truth.frame_url);
      const url=new URL(truth.frame_url),observed={workspace:workspace.worktreeRoot,service:url.origin,route:url.pathname+url.search+url.hash,object_version:truth.source.object_version,engine_session:truth.session,state,viewport:truth.viewport,engine:'agent-browser'},mismatches=objectDiff(record.original_document.object,observed);
      console.log(JSON.stringify({event:'P8_actual_HTTP_object_consumption',source_ref:FN+'2026-10-29-'+name+'.json',declared:record.original_document.object,observed,mismatches,basis:'Authenticated worktree/current disk bytes + independently archived actual HTTP hashes/bytes + native AX state and frame URL, all before/after stable.'}));expect(mismatches.map(m=>m.field)).toEqual(differences);
    }
  });
  it('AC-C07-5 / 6 keeps trusted real task completion separate from unknown CLI clocks and real backend claims',()=>{
    const output=json(FN+'2026-10-29-017-b-normal-api-output.json'),actions=json(FN+'2026-10-29-016-b-normal-native-actions.json'),perf=output.observations.perf.items[0].perf;
    expect(output.code).toBe(0);expect(output.report.summary.overall).toBe('incomplete');expect(output.report.criteria.every(c=>c.state==='未测')).toBe(true);
    expect(perf.interaction.status).toBe('measured');expect(perf.interaction.measures).toHaveLength(1);expect(perf.interaction.measures[0].name).toBe('c07:act');expect(Number.isFinite(perf.interaction.measures[0].duration)).toBe(true);expect(perf.interaction.measures[0].duration).toBeGreaterThanOrEqual(0);
    for(const value of Object.values(perf.nav)){expect(value.runs).toHaveLength(3);expect(value.runs.every(Number.isFinite)).toBe(true);expect(Number.isFinite(value.median)).toBe(true);}
    expect(actions.terminal.lamp.outerHTML).toContain('读回确认已清仓');
    const body=actions.terminal.table.outerHTML.match(/<tbody>([\s\S]*?)<\/tbody>/)[1],rows=[...body.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(row=>[...row[1].matchAll(/<td>([\s\S]*?)<\/td>/g)].map(cell=>cell[1]));
    expect(rows.map(r=>r[0])).toEqual(['4821','7204','9043']);for(const row of rows){expect(row[2]).toBe('0 手');expect(row[3]).toBe('已清仓');expect(row[4]).toContain('MOCK-PROOF-');expect(row[4]).toContain(row[0]);}
    expect(json(AB+'2026-10-29-590-perf-fix-final-handoff.json').rows.every(r=>r.interaction_raw.status==='unknown')).toBe(true);
  });
  it('AC-C07-7 consumes the actual asset/component/page trace without claiming external design parity',()=>{
    const trace=json(BUILD+'P8-raw-replay-report.json').trace_layers;
    expect(trace.assets.length).toBeGreaterThan(0);for(const asset of trace.assets)expect(sha(readFileSync(asset.path))).toBe(asset.sha256);
    const http=json(FN+'2026-10-29-010-b-native-object-truth-before.json').source.files.find(f=>f.path.endsWith('/B/styles.css'));expect(http.status).toBe(200);expect(http.byte_equal).toBe(true);expect(trace.assets.some(a=>a.sha256===http.http_sha256&&sha(readFileSync(a.path))===http.http_sha256)).toBe(true);
    expect(trace.components).toHaveLength(1);const component=trace.components[0];expect(sha(readFileSync(component.path))).toBe(component.sha256);
    expect(json(component.source_fix).files.some(f=>f.path===component.path&&f.sha256===component.sha256)).toBe(true);
    expect(trace.pages).toHaveLength(3);for(const page of trace.pages){expect(original(page.raw)).toBe(true);expect(fields.every(key=>nonempty(page.object[key]))).toBe(true);}expect(trace.pages.some(p=>p.object.route.includes('#workbench'))).toBe(true);
  });
  it('AC-C07-2 retains four native failure classes and marks simulated fallback as a seam only',async()=>{
    const files=['collector-not-started.json','native-discovery-tool-error.json','native-wrong-route.json','native-browser-disconnect.json'];
    const seen=new Set(files.flatMap(name=>json(FN+name).failures.map(f=>f.class)));
    for(const name of['NOT_STARTED','TOOL_ERROR','IDENTITY_MISMATCH','UNREACHABLE'])expect(seen.has(name),name).toBe(true);
    const selection=await lockEngine({},{},{probe:async()=>({available:false,reason:'ENOENT'})});
    const fallback=Object.fromEntries(['from','to','reason','probe'].map(key=>[key,selection.fallbacks[0][key]]));expect(Object.keys(fallback)).toEqual(['from','to','reason','probe']);expect(fallback.from).toBe('ego-lite');expect(fallback.to).toBe('agent-browser');
  });
  it('AC-C07-6 keeps six actual injected invalid scalars unknown and preserves the legitimate zero control',()=>{
    const commands=json(FN+'executions.json').commands.filter(c=>c.argv?.includes('--perf'));
    expect(commands).toHaveLength(7);
    for(const command of commands){const output=bytes(command.output_ref).toString('utf8').split('\n').find(line=>line.startsWith('{"input"'));const value=JSON.parse(output);
      if(value.input===0){expect(value.perf.nav.ttfb.median).toBe(0);expect(value.perf.interaction.status).toBe('measured');}
      else{expect(value.perf.nav.ttfb.median).toBe('unknown');expect(value.perf.interaction.status).toBe('unknown');expect(value.report.summary.overall).toBe('incomplete');expect(value.report.criteria[0].state).toBe('未测');}
    }
  });
  it('AC-C07-6 retains real disconnect, object mismatch and non-adoption without promoting them to repaired',()=>{
    const disconnected=json(FN+'native-browser-disconnect.json');expect(disconnected.failures.some(f=>f.class==='UNREACHABLE')).toBe(true);
    const result=mergeJudgments([{id:'actual-perf',dimension:'performance',state:'通过',evidence:[]}],{perf:disconnected},{perf:{ref:FN+'native-browser-disconnect.json',sha256:sha(bytes(FN+'native-browser-disconnect.json'))}});expect(result[0].state).toBe('未测');
    const control=json(FN+'not-adopted-control.json');expect(control.disposition).toBe('未采用');expect(control.repair).toBe('未修');
  });
});

describe('ORACLE-P8-ACCEPTANCE real environment',()=>{
  it('consumes the original controlled repair/retest and normal regressions without expanding FULL beyond nine regions',()=>{
    const result=json(BUILD+'P8-real-environment/controlled/2026-10-29-041-p8-original-source-retest-and-regression-results.json');
    expect(sha(readFileSync(result.object.source))).toBe(result.object.after_sha256);expect(result.object.before_sha256).not.toBe(result.object.after_sha256);
    expect(result.tests).toHaveLength(10);expect(result.tests.every(row=>row.state==='通过'&&Object.values(row.checks).every(value=>value===true))).toBe(true);expect(result.regressions).toHaveLength(2);expect(result.regressions.every(row=>row.state==='通过')).toBe(true);
    for(const reference of result.raws)expect(original(reference)).toBe(true);expect(result.retest).toMatchObject({F2P:10,P2P:2,coverage:'FULL'});expect(result.retest.denominator).toContain('Original nine controlled regions');
  });
  it('keeps seven original execution groups, expected effects and explicit owners for pending independent facts',()=>{
    const groups=json(BUILD+'P8-execution-checklist.json').acceptance.real_environment_groups;
    expect(groups.map(g=>g.id)).toEqual(['controlled-nine','zoom-keyboard','screen-reader','file-protocol','sample-ab','mock-only','two-graders']);
    for(const group of groups){expect(RESULTS).toContain(group.result);expect(nonempty(group.expected)).toBe(true);for(const reference of group.evidence??[])expect(original(reference)).toBe(true);for(const command of group.commands??[])expect(original(command)).toBe(true);if(group.result!=='pass')expect([group.reason,group.owner,group.condition].every(nonempty)).toBe(true);}
    const grading=groups.find(g=>g.id==='two-graders');if(grading.result==='pass')expect(grading.evidence).toHaveLength(2);
  });
});

describe('ORACLE-P8-ACCEPTANCE verdicts',()=>{
  it('reads all seven current draft rows and never mistakes them for a published final report',()=>{
    const checklist=json(BUILD+'P8-execution-checklist.json'),draft=checklist.acceptance;
    expect(verdictRows(draft)).toEqual([]);
    const finalPath=taskEvidence().task.recordPath(BUILD+'P8-acceptance.json');
    if(existsSync(finalPath))expect(verdictRows(json(BUILD+'P8-acceptance.json'))).toEqual([]);
    else {expect(checklist.final_chain_ref).toBeNull();expect(draft.per_ac.some(row=>row.result!=='pass')).toBe(true);}
  });
  it('rejects borrowed readiness as AC pass evidence',()=>{
    const document=structuredClone(json(BUILD+'P8-execution-checklist.json').acceptance),ref=BUILD+'P8-environment-readiness.json';
    const evidence={ref,sha256:sha(bytes(ref))};expect(original(evidence)).toBe(true);
    for(const row of document.per_ac){row.result='pass';row.evidence=evidence;delete row.reason;delete row.condition;delete row.owner;}
    expect(verdictRows(document)).toContain('E_VERDICT_EVIDENCE_ROLE');
  });
  for(const[label,ref,valid]of[
    ['v1 valid',BUILD+'P8-independent-one/2026-10-29-018-synthetic-same-ac-positive.json',true],
    ['v1 bad hash',BUILD+'P8-independent-one/2026-10-29-020-synthetic-child-hash-negative.json',false],
    ['v1 missing',BUILD+'P8-real-environment/consumer-regressions/2026-10-29-004-v1-child-missing.json',false],
    ['per_ac valid',BUILD+'P8-real-environment/consumer-regressions/2026-10-29-001-per-ac-child-valid.json',true],
    ['per_ac bad hash',BUILD+'P8-real-environment/consumer-regressions/2026-10-29-002-per-ac-child-bad-hash.json',false],
    ['per_ac missing',BUILD+'P8-real-environment/consumer-regressions/2026-10-29-003-per-ac-child-missing.json',false],
  ])it('consumes declared child references '+label,()=>{
    // Isolated reader fixtures test byte/role behaviour, never actual AC grading.
    const document=structuredClone(json(BUILD+'P8-execution-checklist.json').acceptance),evidence={ref,sha256:sha(bytes(ref))};
    expect(original(evidence)).toBe(true);document.per_ac[0]={...document.per_ac[0],result:'pass',evidence};
    const errors=verdictRows(document);if(valid)expect(errors).toEqual([]);else expect(errors).toContain('E_VERDICT_CHILD_BYTES');
  });
  for(const kind of['missing-row','pass-without-evidence','forbidden-wording','forbidden-writeback','missing-conclusion','no-retest','missing-writeback'])it('rejects '+kind,()=>{
    const doc=structuredClone(json(BUILD+'P8-execution-checklist.json').acceptance);
    if(kind==='missing-row')doc.per_ac.pop();
    if(kind==='pass-without-evidence'){doc.per_ac[0].result='pass';delete doc.per_ac[0].evidence;}
    if(kind==='forbidden-wording')doc.conclusion='用户已确认';
    if(kind==='forbidden-writeback')doc.writebacks=['spec.md'];
    if(kind==='missing-conclusion')delete doc.conclusions.residual_risks;
    if(kind==='no-retest')doc.retest.F2P=0;
    if(kind==='missing-writeback')doc.writebacks.pop();
    expect(verdictRows(doc)).not.toEqual([]);
  });
});
