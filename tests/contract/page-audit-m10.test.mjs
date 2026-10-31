import {describe,it,expect} from 'vitest';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,existsSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=process.cwd(),quotes=resolve('skills/frontend-testing/scripts/check-report-quotes.mjs'),binding=resolve('skills/frontend-testing/scripts/check-version-binding.mjs');
const sha=b=>createHash('sha256').update(b).digest('hex');
function sandbox(fn){const dir=mkdtempSync(join(tmpdir(),'p7-m10-'));try{return fn(dir);}finally{rmSync(dir,{recursive:true,force:true});}}
function run(target,args,cwd){const r=spawnSync(process.execPath,[target,...args],{cwd,encoding:'utf8',timeout:10000});return {...r,payload:r.stdout?.trim()?JSON.parse(r.stdout):null};}
function verdict(result,status){expect(result.status,result.stderr).toBe(status);expect(result.signal).toBeNull();expect(result.stdout.trim().split('\n')).toHaveLength(1);expect(result.payload.ok).toBe(status===0);return result.payload;}
function quoteRun(dir,source,quote,extra=[]){writeFileSync(join(dir,'source.txt'),source);return run(quotes,['--source','source.txt','--quote',quote,...extra],dir);}
describe('ORACLE-P7-M10 quotes',()=>{
  it('quotes: language quotation marks retain preceding denial while JSON metadata stays outside the window',()=>sandbox(dir=>{verdict(quoteRun(dir,'该原件不能证明“页面通过”。','页面通过'),2);verdict(quoteRun(dir,'该原件不能证明"页面通过"。','页面通过'),2);verdict(quoteRun(dir,JSON.stringify({version:'fixture-only',reason:'交互未测。'}),'交互未测。'),0);}));
  it('quotes: dropping untested from a real source sentence is blocked',()=>sandbox(dir=>{const p=verdict(quoteRun(dir,'页面交互未测，键盘操作尚未执行。','键盘操作通过。'),2);expect(p.reasons.some(r=>r.term_class==='未执行')).toBe(true);expect(p.verdict).toBe('阻断');}));
  it('quotes: faithful wording is allowed and matched violations are empty',()=>sandbox(dir=>{const p=verdict(quoteRun(dir,'键盘操作未测，不能证明真实页面通过。','键盘操作未测，不能证明真实页面通过。'),0);expect(p.verdict).toBe('允许');expect(p.matched).toEqual([]);}));
  for(const [source,quote,term] of [['并非业务通过，结果仍失败。','业务通过。','否定'],['结果仅限静态结构。','结果静态结构。','限定'],['运行unknown，不能证明业务通过。','运行通过。','未执行'],['此件不能证明页面已修复。','页面已修复。','不能证明'],['导航结果待补证。','导航结果通过。','待补证']])it('quotes: missing '+term+' cannot be erased',()=>sandbox(dir=>{const p=verdict(quoteRun(dir,source,quote),2);expect(p.reasons.some(r=>r.term_class===term)).toBe(true);}));
  it('quotes: source hash binds actual UTF8 bytes rather than JSON reserialization',()=>sandbox(dir=>{const source='{\n  "untested_reason": "交互未测，不证明业务通过。"\n}\n';const p=verdict(quoteRun(dir,source,'交互未测，不证明业务通过。',['--expect-source-sha256',sha(Buffer.from(source))]),0);expect(p.source).toEqual({ref:'source.txt',sha256:sha(Buffer.from(source)),bytes:Buffer.byteLength(source)});verdict(quoteRun(dir,source,'交互未测，不证明业务通过。',['--expect-source-sha256','0'.repeat(64)]),2);}));
  it('quotes: override needs all five fields and binds exact source and quote',()=>sandbox(dir=>{const source='键盘操作未测。',quote='键盘操作通过。';const record={ref:'source.txt',quote,reason:'审查者明确解释本次覆盖边界',signer:'reviewer-1',expires_if:'原件字节或引用句变化'};const file=join(dir,'override.json');writeFileSync(file,JSON.stringify(record));verdict(quoteRun(dir,source,quote,['--override',file]),0);for(const key of ['ref','quote','reason','signer','expires_if']){writeFileSync(file,JSON.stringify({...record,[key]:''}));verdict(quoteRun(dir,source,quote,['--override',file]),2);}writeFileSync(file,JSON.stringify({...record,ref:'other.txt'}));verdict(quoteRun(dir,source,quote,['--override',file]),2);writeFileSync(file,JSON.stringify({...record,quote:'另一条引用'}));verdict(quoteRun(dir,source,quote,['--override',file]),2);}));
  it('quotes: ambiguous windows need explicit lines, not an arbitrary first match',()=>sandbox(dir=>{const source='键盘操作通过。\n键盘操作未测。';verdict(quoteRun(dir,source,'键盘操作'),2);const p=verdict(quoteRun(dir,source,'键盘操作未测。',['--lines','2:2']),0);expect(p.windows[0]).toMatchObject({start_line:2,end_line:2,method:'lines'});}));
  it('quotes: unrelated input cannot be blessed with an override',()=>sandbox(dir=>{writeFileSync(join(dir,'o.json'),JSON.stringify({ref:'source.txt',quote:'XYZ',reason:'理由',signer:'r',expires_if:'变化'}));verdict(quoteRun(dir,'键盘尚未执行。','XYZ',['--override','o.json']),2);}));
  it('quotes: batch reads explicit quotes without changing source report bytes',()=>sandbox(dir=>{const source='键盘操作未测。\n布局证据待补证。';writeFileSync(join(dir,'source.txt'),source);writeFileSync(join(dir,'quotes.json'),JSON.stringify([{quote:'键盘操作未测。',lines:'1:1'},{quote:'布局证据通过。',lines:'2:2'}]));const p=verdict(run(quotes,['--source','source.txt','--quotes','quotes.json','--out','result.json'],dir),2);expect(p.reasons.some(r=>r.quote_index===1&&r.term_class==='待补证')).toBe(true);expect(readFileSync(join(dir,'source.txt'),'utf8')).toBe(source);expect(JSON.parse(readFileSync(join(dir,'result.json'),'utf8'))).toEqual(p);}));
  it('quotes: IO/usage errors are exit1 and an existing output is not overwritten',()=>sandbox(dir=>{verdict(run(quotes,['--source','absent','--quote','x'],dir),1);verdict(run(quotes,['--quote','x'],dir),1);writeFileSync(join(dir,'result.json'),'original');verdict(quoteRun(dir,'键盘操作未测。','键盘操作未测。',['--out','result.json']),1);expect(readFileSync(join(dir,'result.json'),'utf8')).toBe('original');}));
});
function material(ref,bytes,material_id='m1'){return {material_id,ref,sha256:sha(Buffer.from(bytes)),bytes:Buffer.byteLength(bytes),role:'evidence'};}
function bindRun(dir,current,{previous,criteria='冻结判据\n',expected,extra=[]}={}){writeFileSync(join(dir,'materials.json'),JSON.stringify(current));writeFileSync(join(dir,'criteria.md'),criteria);const args=['--materials','materials.json','--criteria','criteria.md',...extra];if(previous!==undefined){writeFileSync(join(dir,'previous.json'),JSON.stringify(previous));args.push('--previous','previous.json');}if(expected!==undefined)args.push('--expect-criteria-sha256',expected);return run(binding,args,dir);}
describe('ORACLE-P7-M10 binding',()=>{
  it('binding: empty current materials never claim verified identity',()=>sandbox(dir=>{for(const options of [{},{previous:[]}]){const p=verdict(bindRun(dir,[],options),2);expect(p.materials).toEqual([]);expect(p.reasons.some(r=>r.code==='E_MATERIAL_IDENTITY_INVALID'&&r.path==='materials')).toBe(true);}}));
  it('binding: an empty previous list is valid for initial additions, not a malformed identity',()=>sandbox(dir=>{writeFileSync(join(dir,'raw.txt'),'alpha');const row=material('raw.txt','alpha');verdict(bindRun(dir,[row]),0);const p=verdict(bindRun(dir,[row],{previous:[]}),2);expect(p.added).toEqual([row]);expect(p.removed).toEqual([]);expect(p.bytes_changed).toEqual([]);expect(p.reasons.map(r=>r.code)).toEqual(['E_MATERIAL_DELTA']);}));
  it('binding: empty current retains real all-removed delta without reading historical paths',()=>sandbox(dir=>{const prior=[material('historical-absent.txt','alpha')];const p=verdict(bindRun(dir,[],{previous:prior}),2);expect(p.removed).toEqual(prior);expect(p.added).toEqual([]);expect(p.bytes_changed).toEqual([]);expect(p.reasons.map(r=>r.code)).toContain('E_MATERIAL_DELTA');expect(p.reasons.some(r=>r.code==='E_MATERIAL_IDENTITY_INVALID'&&r.path==='materials')).toBe(true);}));
  it('binding: duplicate content retains multiplicity instead of collapsing byte identities',()=>sandbox(dir=>{for(const ref of ['a.txt','b.txt','c.txt'])writeFileSync(join(dir,ref),'alpha');const a=material('a.txt','alpha','m1'),b=material('b.txt','alpha','m2'),c=material('c.txt','alpha','m3');for(const [previous,current,status,added,removed] of [[[a,b],[b,c],0,0,0],[[a,b],[b],2,0,1],[[a],[b,c],2,1,0]])for(const rows of [current,[...current].reverse()]){const p=verdict(bindRun(dir,rows,{previous}),status);expect(p.added).toHaveLength(added);expect(p.removed).toHaveLength(removed);expect(p.bytes_changed).toEqual([]);}}));
  it('binding: byte identities survive swapped colliding material ids in either input order',()=>sandbox(dir=>{writeFileSync(join(dir,'alpha.txt'),'alpha');writeFileSync(join(dir,'bravo.txt'),'bravo');const previous=[material('alpha.txt','alpha','m1'),material('bravo.txt','bravo','m2')],current=[material('bravo.txt','bravo','m1'),material('alpha.txt','alpha','m2')];for(const rows of [current,[...current].reverse()]){const p=verdict(bindRun(dir,rows,{previous}),0);expect(p.bytes_changed).toEqual([]);expect(p.added).toEqual([]);expect(p.removed).toEqual([]);expect(p.renamed).toEqual([]);}}));
  it('binding: an earlier changed id cannot consume another surviving byte identity',()=>sandbox(dir=>{writeFileSync(join(dir,'gamma.txt'),'gamma');writeFileSync(join(dir,'alpha.txt'),'alpha');const previous=[material('old-alpha.txt','alpha','m1'),material('old-bravo.txt','bravo','m2')],changed=material('gamma.txt','gamma','m1'),kept=material('alpha.txt','alpha','m2');for(const rows of [[changed,kept],[kept,changed]]){const p=verdict(bindRun(dir,rows,{previous}),2);expect(p.bytes_changed).toEqual([]);expect(p.added).toEqual([changed]);expect(p.removed).toEqual([previous[1]]);expect(p.renamed).toEqual([{material_id:'m2',from:'old-alpha.txt',to:'alpha.txt',sha256:kept.sha256,bytes:5}]);}}));
  it('binding: explicit five-field material is verified against original bytes',()=>sandbox(dir=>{writeFileSync(join(dir,'raw.txt'),'alpha');const p=verdict(bindRun(dir,[material('raw.txt','alpha')]),0);expect(p.materials).toEqual([material('raw.txt','alpha')]);expect(p.criteria_sha256).toBe(sha(Buffer.from('冻结判据\n')));expect(p.added).toEqual([]);expect(p.removed).toEqual([]);expect(p.bytes_changed).toEqual([]);}));
  for(const kind of ['extra','missing','unknown-sha','unknown-bytes','duplicate-id'])it('binding: rejects '+kind+' rather than inventing identity',()=>sandbox(dir=>{writeFileSync(join(dir,'raw.txt'),'alpha');const row=material('raw.txt','alpha'),rows=[row];if(kind==='extra')row.authorized=true;if(kind==='missing')delete row.role;if(kind==='unknown-sha')row.sha256='unknown';if(kind==='unknown-bytes')row.bytes=null;if(kind==='duplicate-id')rows.push({...row});const p=verdict(bindRun(dir,rows),2);expect(p.reasons.some(r=>r.code=== (['extra','missing'].includes(kind)?'E_MATERIAL_FIELD_OUT_OF_WHITELIST':'E_MATERIAL_IDENTITY_INVALID'))).toBe(true);}));
  it('binding: declared digest and bytes are checked against the real file',()=>sandbox(dir=>{writeFileSync(join(dir,'raw.txt'),'alpha');for(const bad of [{sha256:'0'.repeat(64)},{bytes:99}]){const p=verdict(bindRun(dir,[{...material('raw.txt','alpha'),...bad}]),2);expect(p.reasons.some(r=>r.code==='E_MATERIAL_BYTES_MISMATCH')).toBe(true);}}));
  it('binding: rename preserves identity even if the old location is absent',()=>sandbox(dir=>{writeFileSync(join(dir,'new.txt'),'alpha');const p=verdict(bindRun(dir,[material('new.txt','alpha')],{previous:[material('old.txt','alpha')]}),0);expect(p.renamed).toHaveLength(1);expect(p.renamed[0]).toMatchObject({from:'old.txt',to:'new.txt'});expect(p.bytes_changed).toEqual([]);expect(p.added).toEqual([]);expect(p.removed).toEqual([]);}));
  it('binding: changed bytes with the same length are a delta with both original values',()=>sandbox(dir=>{writeFileSync(join(dir,'raw.txt'),'bravo');const old=material('raw.txt','alpha'),current=material('raw.txt','bravo');const p=verdict(bindRun(dir,[current],{previous:[old]}),2);expect(p.bytes_changed).toHaveLength(1);expect(p.bytes_changed[0]).toMatchObject({previous:old,current,previous_sha256_prefix:old.sha256.slice(0,12),current_sha256_prefix:current.sha256.slice(0,12)});}));
  it('binding: added and removed entries remain separate facts',()=>sandbox(dir=>{writeFileSync(join(dir,'new.txt'),'bravo');const p=verdict(bindRun(dir,[material('new.txt','bravo','m2')],{previous:[material('old.txt','alpha')]}),2);expect(p.added).toEqual([material('new.txt','bravo','m2')]);expect(p.removed).toEqual([material('old.txt','alpha')]);expect(p.bytes_changed).toEqual([]);}));
  it('binding: equal byte identities pair across a changed logical id without becoming added',()=>sandbox(dir=>{writeFileSync(join(dir,'new.txt'),'alpha');const p=verdict(bindRun(dir,[material('new.txt','alpha','new-id')],{previous:[material('old.txt','alpha','old-id')]}),0);expect(p.added).toEqual([]);expect(p.removed).toEqual([]);expect(p.renamed).toHaveLength(1);}));
  it('binding: criteria tampering is blocked and absent expected hash is compute-only',()=>sandbox(dir=>{writeFileSync(join(dir,'raw.txt'),'alpha');const rows=[material('raw.txt','alpha')],expected=sha(Buffer.from('冻结判据\n'));verdict(bindRun(dir,rows,{expected}),0);const p=verdict(bindRun(dir,rows,{criteria:'冻结判据!\n',expected}),2);expect(p.reasons.some(r=>r.code==='E_CRITERIA_HASH_MISMATCH')).toBe(true);verdict(bindRun(dir,rows,{criteria:'冻结判据!\n'}),0);}));
  it('binding: missing original/invalid JSON is tool failure and immutable output is protected',()=>sandbox(dir=>{verdict(bindRun(dir,[material('absent.txt','alpha')]),1);writeFileSync(join(dir,'bad.json'),'not-json');verdict(run(binding,['--materials','bad.json','--criteria','criteria.md'],dir),1);writeFileSync(join(dir,'raw.txt'),'alpha');const rows=[material('raw.txt','alpha')];const p=verdict(bindRun(dir,rows,{extra:['--report','binding.json']}),0);expect(JSON.parse(readFileSync(join(dir,'binding.json'),'utf8'))).toEqual(p);verdict(bindRun(dir,rows,{extra:['--report','binding.json']}),1);expect(JSON.parse(readFileSync(join(dir,'binding.json'),'utf8'))).toEqual(p);}));
});
const quoteFixture=resolve('tests/fixtures/page-audit/m10/quote-cases.json'),materialFixture=resolve('tests/fixtures/page-audit/m10/materials-cases.json');
describe('ORACLE-P7-M10 calibration',()=>{
  it('calibration: original package resolver and two-script portable closure retain positive and negative behavior',async()=>{const {resolveSkillPackage,validateSkillBundle}=await import('../../runtime/adapters/local-skill-resolver.mjs');const pkg=resolveSkillPackage({packageRoot:root,manifestPath:'workflows/build-code/skill-deps.yaml',dependency:{name:'frontend-testing',path:'skills/frontend-testing/SKILL.md'}});expect(pkg.diagnostic.status).toBe('available');sandbox(dir=>{const base=join(dir,'skills/frontend-testing');mkdirSync(join(base,'scripts'),{recursive:true});const names=['check-report-quotes.mjs','check-version-binding.mjs'];for(const name of names){const actual=pkg.resolved_bundle_paths.find(p=>p.endsWith('/scripts/'+name));expect(actual).toBeDefined();writeFileSync(join(base,'scripts',name),readFileSync(actual));}writeFileSync(join(base,'SKILL.md'),'# Synthetic P7 closure test\n');writeFileSync(join(base,'skill-bundle.json'),JSON.stringify({schema_version:1,skill:'frontend-testing',files:['SKILL.md',...names.map(n=>'scripts/'+n)]}));expect(validateSkillBundle(dir,'skills/frontend-testing/skill-bundle.json','skills/frontend-testing/SKILL.md').files).toHaveLength(3);writeFileSync(join(dir,'source.txt'),'键盘操作未测。');const q=join(base,'scripts',names[0]),b=join(base,'scripts',names[1]);verdict(run(q,['--source','source.txt','--quote','键盘操作未测。'],dir),0);verdict(run(q,['--source','source.txt','--quote','键盘操作通过。'],dir),2);writeFileSync(join(dir,'materials.json'),JSON.stringify([material('source.txt','键盘操作未测。')]));writeFileSync(join(dir,'criteria.md'),'冻结判据\n');verdict(run(b,['--materials','materials.json','--criteria','criteria.md'],dir),0);verdict(run(b,['--materials','materials.json','--criteria','criteria.md','--expect-criteria-sha256','0'.repeat(64)],dir),2);rmSync(b);expect(()=>validateSkillBundle(dir,'skills/frontend-testing/skill-bundle.json','skills/frontend-testing/SKILL.md')).toThrow(/ENOENT/);});});
  it('calibration: exactly three independent decisions and five token classes replay twice',()=>sandbox(dir=>{const cases=existsSync(quoteFixture)?JSON.parse(readFileSync(quoteFixture,'utf8')):{calibration:[]};expect(cases.calibration).toHaveLength(3);expect(cases.token_classes).toEqual(['否定','限定','未执行','不能证明','待补证']);for(const c of cases.calibration){for(let round=0;round<2;round++){const p=verdict(quoteRun(dir,c.source,c.quote),c.exit);expect(p.verdict).toBe(c.verdict);if(c.term_class)expect(p.reasons.some(r=>r.term_class===c.term_class)).toBe(true);}}}));
  it('calibration: legal override passes, empty signer blocks, material fixture covers five cases',()=>sandbox(dir=>{const q=JSON.parse(readFileSync(quoteFixture,'utf8')),m=JSON.parse(readFileSync(materialFixture,'utf8'));expect(m.cases.map(c=>c.id)).toEqual(['legal','renamed','bytes_changed','added_removed','extra_field']);for(const o of q.overrides){writeFileSync(join(dir,'override.json'),JSON.stringify(o.record));verdict(quoteRun(dir,o.source,o.quote,['--override','override.json']),o.exit);}for(const c of m.cases){for(const [ref,bytes]of Object.entries(c.originals))writeFileSync(join(dir,ref),bytes);const rows=c.materials.map(r=>({...material(r.ref,c.originals[r.ref],r.material_id),...r}));const previous=c.previous?.map(r=>material(r.ref,r.content,r.material_id));verdict(bindRun(dir,rows,{previous}),c.exit);}}));
  it('calibration: the real P5 input keeps unknown/untested; quote verdict does not rewrite it',()=>sandbox(dir=>{const original=readFileSync(resolve('tests/fixtures/page-audit/runner/judgments.json')),input=JSON.parse(original);writeFileSync(join(dir,'p5-source.json'),original);const quote=input.criteria[0].untested_reason,lines='3:3';const p=verdict(run(quotes,['--source','p5-source.json','--quote',quote,'--lines',lines,'--expect-source-sha256',sha(original)],dir),0);expect(p.source.bytes).toBe(original.length);const bad=verdict(run(quotes,['--source','p5-source.json','--quote','具体页面任务及可观察终态已执行，真实业务通过。','--lines',lines],dir),2);expect(bad.reasons.some(r=>r.term_class==='未执行'||r.term_class==='不能证明')).toBe(true);expect(input.criteria.some(c=>c.cited_norms.some(n=>n.version==='unknown'))).toBe(true);expect(readFileSync(join(dir,'p5-source.json')).equals(original)).toBe(true);}));
  it('calibration: actual P5 merge output is checked as original bytes with unchanged evidence refs',async()=>{const {mergeJudgments}=await import('../../skills/frontend-testing/scripts/run-page-audit.mjs');sandbox(dir=>{const evidence={ref:'quality/evidence/perf.json',sha256:'a'.repeat(64)},rows=mergeJudgments([{id:'interaction',dimension:'交互状态',state:'通过',evidence:[]}],{perf:{items:[{perf:{interaction:{status:'unknown'}}}],failures:[]}},{perf:evidence});const report={object:{object_version:'fixture-only'},criteria:rows,coverage_limits:['交互未测'],summary:{overall:'incomplete'}},source=JSON.stringify(report)+'\n';const p=verdict(quoteRun(dir,source,rows[0].untested_reason,['--expect-source-sha256',sha(Buffer.from(source))]),0);expect(rows[0].state).toBe('未测');expect(rows[0].evidence).toEqual([evidence]);expect(p.source.sha256).toBe(sha(Buffer.from(source)));verdict(quoteRun(dir,source,'交互提供任务动作或实际耗时，观测通过。'),2);expect(readFileSync(join(dir,'source.txt'),'utf8')).toBe(source);});});
});

// 推断：原文未逐字规定以下块/键/role名及格式；CLI接缝与0/2/1沿原约定。
function versionRequest(dir){
  writeFileSync(join(dir,'approved.txt'),'alpha');writeFileSync(join(dir,'delivered.txt'),'bravo');
  return {materials:[{...material('approved.txt','alpha','approved-material'),role:'approved'},{...material('delivered.txt','bravo','delivered-material'),role:'delivered'}],version:{approved:{commit:'41eae967',sha256:'8ed3f6ad685b959ead7022518e1af76cd816f8e8ec7ccdda1ed4018e8f2223f8',created_at:'2026-10-29T00:00:00+08:00'},delivered:{commit:'9efb7e57',sha256:'f144a6907dc4284d1f9fe6a7d9b9ff53c02c1d07ba68f24d413d7ff7f757a782',created_at:'2026-10-30T00:00:00+08:00'}}};
}
function versionRejected(result,path,code='E_MATERIAL_IDENTITY_INVALID'){
  const p=verdict(result,2);expect(p.reasons.some(r=>r.code===code&&r.path===path),JSON.stringify(p)).toBe(true);return p;
}
describe('ORACLE-P7-M10 version facts (推断命名，原文要求两侧各齐/不混写)',()=>{
  it('version: assigns each side to its actual material bytes independently of array order (推断role名)',()=>sandbox(dir=>{
    const request=versionRequest(dir);
    for(const materials of [request.materials,[...request.materials].reverse()]){
      const p=verdict(bindRun(dir,{...request,materials}),0);
      expect(p.matched.find(r=>r.role==='approved')).toMatchObject({ref:'approved.txt',sha256:'8ed3f6ad685b959ead7022518e1af76cd816f8e8ec7ccdda1ed4018e8f2223f8'});
      expect(p.matched.find(r=>r.role==='delivered')).toMatchObject({ref:'delivered.txt',sha256:'f144a6907dc4284d1f9fe6a7d9b9ff53c02c1d07ba68f24d413d7ff7f757a782'});
      expect(p.version).toEqual(request.version);
    }
  }));
  it('version: merged one-triple block is rejected, not treated as two named sides',()=>sandbox(dir=>{
    const request=versionRequest(dir);request.version=request.version.approved;
    versionRejected(bindRun(dir,request),'version');
  }));
  it('version: report without either named version is not a complete version claim (推断拒2)',()=>sandbox(dir=>{
    const request=versionRequest(dir);delete request.version;versionRejected(bindRun(dir,request),'version');
  }));
  for(const side of ['approved','delivered']){
    it('version: missing '+side+' side is rejected (推断拒2)',()=>sandbox(dir=>{
      const request=versionRequest(dir);delete request.version[side];versionRejected(bindRun(dir,request),'version.'+side);
    }));
    for(const key of ['commit','sha256','created_at'])it('version: missing '+side+'.'+key+' is rejected (推断键名及拒2)',()=>sandbox(dir=>{
      const request=versionRequest(dir);delete request.version[side][key];versionRejected(bindRun(dir,request),'version.'+side+'.'+key);
    }));
    it('version: '+side+' hash binds actual side bytes rather than mere presence (推断role名)',()=>sandbox(dir=>{
      const request=versionRequest(dir);request.version[side].sha256='0'.repeat(64);
      versionRejected(bindRun(dir,request),'version.'+side+'.sha256','E_MATERIAL_BYTES_MISMATCH');
    }));
  }
  for(const [label,value]of [['blank',''],['not-date','unknown'],['timezone-missing','2026-10-30T00:00:00'],['impossible-date','2026-02-31T00:00:00Z']])it('version: timestamp '+label+' is rejected (推断ISO带时区及坏格式拒2)',()=>sandbox(dir=>{
    const request=versionRequest(dir);request.version.delivered.created_at=value;versionRejected(bindRun(dir,request),'version.delivered.created_at');
  }));
  it('version: swapping the two actual hashes cannot pass by sharing one digest field',()=>sandbox(dir=>{
    const request=versionRequest(dir),a=request.version.approved.sha256;request.version.approved.sha256=request.version.delivered.sha256;request.version.delivered.sha256=a;
    versionRejected(bindRun(dir,request),'version.approved.sha256','E_MATERIAL_BYTES_MISMATCH');
  }));
  it('version: empty current still reports no current identity (existing refusal in new report input)',()=>sandbox(dir=>{
    const request=versionRequest(dir);request.materials=[];const p=verdict(bindRun(dir,request),2);expect(p.reasons.some(r=>r.message.includes('当前材料为空'))).toBe(true);
  }));
  it('version: each side needs exactly one explicit material (推断role名及拒2)',()=>sandbox(dir=>{
    const request=versionRequest(dir);request.materials[1].role='approved';versionRejected(bindRun(dir,request),'version.delivered');
  }));
  it('version: report output is consumed again for real judgment, never trusts a previous ok',()=>sandbox(dir=>{
    const request=versionRequest(dir);verdict(bindRun(dir,request,{extra:['--report','checked-version.json']}),0);
    verdict(run(binding,['--materials','checked-version.json','--criteria','criteria.md'],dir),0);
    writeFileSync(join(dir,'delivered.txt'),'BRAVO');const p=verdict(run(binding,['--materials','checked-version.json','--criteria','criteria.md'],dir),2);
    expect(p.reasons.some(r=>r.code==='E_MATERIAL_BYTES_MISMATCH'&&r.ref==='delivered.txt')).toBe(true);
  }));
  it('version: unclassified additional material stays present and is still byte-checked (推断role名)',()=>sandbox(dir=>{
    const request=versionRequest(dir);writeFileSync(join(dir,'notes.txt'),'notes');request.materials.push({...material('notes.txt','notes','notes'),role:'caller-specific'});
    expect(verdict(bindRun(dir,request),0).materials).toEqual(request.materials);writeFileSync(join(dir,'notes.txt'),'OTHER');expect(verdict(bindRun(dir,request),2).reasons.some(r=>r.ref==='notes.txt')).toBe(true);
  }));
  it('version: old arrays keep identity-only semantics even with a new role label',()=>sandbox(dir=>{
    writeFileSync(join(dir,'raw.txt'),'alpha');const p=verdict(bindRun(dir,[{...material('raw.txt','alpha'),role:'consent'}]),0);expect(p.version).toBeUndefined();expect(p.matched).toEqual([]);
  }));
});

// 推断：原文未逐字规定version/consent/interface-change这些role名或具体三件套绑定算法。
// 同意本体沿既有人确认字段；版本事实从其引用的已声明材料读取，不给确认加字段。
// 推断：D042 只要求变则失效与对差异取得同意，未规定承载形式；本工具以 reply 内单一 64hex 集合指纹实现该要求。
// 正向fixture在同意时加入集合指纹；旧纯文本positive的0→2另有显式回归，非暗改断言。
function consentCollectionFingerprint(request,dir,refs){
  return sha(Buffer.from(JSON.stringify(refs.slice().sort().map(ref=>{
    const row=request.materials.find(value=>value.ref===ref);if(!row)throw Error('Fixture reference must already be declared');
    const bytes=readFileSync(join(dir,ref));return {ref,role:row.role,sha256:sha(bytes),bytes:bytes.length};
  }))));
}
function interfaceRequest(dir){
  const request=versionRequest(dir);
  verdict(bindRun(dir,request,{extra:['--report','version-original.json']}),0);
  writeFileSync(join(dir,'interface-change.md'),'Synthetic change: button now opens detail instead of closing.\n');
  for(const [ref,role,id]of [['version-original.json','version','version-original'],['interface-change.md','interface-change','interface-change']])request.materials.push({...material(ref,readFileSync(join(dir,ref),'utf8'),id),role});
  const refs=['version-original.json','interface-change.md'],consent={stage:'build-code',decision:'confirmed',reply:'Synthetic calibration consent, not a real user authorization. '+consentCollectionFingerprint(request,dir,refs),material_refs:refs,head:'a'.repeat(40),created_at:'2026-10-30T01:00:00Z'};
  writeFileSync(join(dir,'consent.json'),JSON.stringify(consent));request.materials.push({...material('consent.json',readFileSync(join(dir,'consent.json'),'utf8'),'consent'),role:'consent'});
  return request;
}
function refreshDeclared(request,dir,ref,value){
  writeFileSync(join(dir,ref),value);const row=request.materials.find(r=>r.ref===ref),role=row.role;Object.assign(row,material(ref,value,row.material_id),{role});
}
function consentRejected(result){const p=verdict(result,2);expect(p.reasons.some(r=>r.code==='E_MATERIAL_IDENTITY_INVALID'&&/同意|差异/.test(r.message)),JSON.stringify(p)).toBe(true);return p;}
describe('ORACLE-P7-M10 interface consent (推断role名/绑定方式，原文要求缺同意拒2)',()=>{
  it('consent: recorded change and matching existing-shape confirmation are actually consumed (X′推断输入补指纹；旧纯文本0→2另列)' ,()=>sandbox(dir=>{
    const request=interfaceRequest(dir),p=verdict(bindRun(dir,request),0);
    expect(p.matched.some(r=>r.role==='consent'&&r.ref==='consent.json')).toBe(true);
    expect(p.matched.some(r=>r.role==='version'&&r.ref==='version-original.json')).toBe(true);
  }));
  it('consent: interface change without explicit consent refuses even if an undeclared file exists',()=>sandbox(dir=>{
    const request=interfaceRequest(dir);request.materials=request.materials.filter(r=>r.role!=='consent');consentRejected(bindRun(dir,request));
  }));
  it('consent: an empty change registration is not evidence of registered differences (推断拒2)',()=>sandbox(dir=>{
    const request=interfaceRequest(dir);refreshDeclared(request,dir,'interface-change.md','');consentRejected(bindRun(dir,request));
  }));
  it('consent: outside material_refs are not followed or guessed (推断绑定方式)',()=>sandbox(dir=>{
    const request=interfaceRequest(dir),record=JSON.parse(readFileSync(join(dir,'consent.json'),'utf8'));record.material_refs=['absent-external.json','interface-change.md'];refreshDeclared(request,dir,'consent.json',JSON.stringify(record));consentRejected(bindRun(dir,request));
  }));
  it('consent: a referenced version file must itself be explicitly declared (推断绑定方式)',()=>sandbox(dir=>{
    const request=interfaceRequest(dir);request.materials=request.materials.filter(r=>r.role!=='version');consentRejected(bindRun(dir,request));
  }));
  for(const [label,patch]of [['declined',{decision:'declined'}],['empty-reply',{reply:''}],['missing-change-ref',{material_refs:['version-original.json']}]])it('consent: '+label+' cannot authorize the registered change (推断原确认字段判读)',()=>sandbox(dir=>{
    const request=interfaceRequest(dir),record=JSON.parse(readFileSync(join(dir,'consent.json'),'utf8'));refreshDeclared(request,dir,'consent.json',JSON.stringify({...record,...patch}));consentRejected(bindRun(dir,request));
  }));
  for(const [key,value]of [['commit','abcdef12'],['created_at','2026-10-30T00:01:00+08:00']])it('consent: changed '+key+' invalidates the referenced old version facts (推断绑定具体三件套)',()=>sandbox(dir=>{
    const request=interfaceRequest(dir);request.version.delivered[key]=value;consentRejected(bindRun(dir,request));
  }));
  it('consent: changed bytes with a refreshed current hash still cannot reuse old consent (推断绑定具体三件套)',()=>sandbox(dir=>{
    const request=interfaceRequest(dir);refreshDeclared(request,dir,'delivered.txt','delta');request.version.delivered.sha256=sha(Buffer.from('delta'));consentRejected(bindRun(dir,request));
  }));
  it('consent: malformed referenced version layout cannot be treated as two sides',()=>sandbox(dir=>{
    const request=interfaceRequest(dir),original=JSON.parse(readFileSync(join(dir,'version-original.json'),'utf8'));original.version=original.version.approved;refreshDeclared(request,dir,'version-original.json',JSON.stringify(original));consentRejected(bindRun(dir,request));
  }));
  it('consent: invalid JSON retains the original tool-error exit 1',()=>sandbox(dir=>{
    const request=interfaceRequest(dir);refreshDeclared(request,dir,'consent.json','{');const p=verdict(bindRun(dir,request),1);expect(p.reasons[0].code).toBe('E_BINDING_TOOL_ERROR');
  }));
});

// 推断：D042 只要求变则失效与对差异取得同意，未规定承载形式；本工具以 reply 内单一 64hex 集合指纹实现该要求。
describe('ORACLE-P7-M10 A′/B consent fingerprint（推断：D042 只要求变则失效与对差异取得同意，未规定承载形式；本工具以 reply 内单一 64hex 集合指纹实现该要求）',()=>{
  const claimAt=dir=>JSON.parse(readFileSync(join(dir,'consent.json'),'utf8'));
  function replaceClaim(request,dir,claim){refreshDeclared(request,dir,'consent.json',JSON.stringify(claim));}
  for(const [name,reply]of [['old m10:134 / independent173 matching positive without hex','Synthetic calibration consent, not a real user authorization.'],['wrong hex','Approved '+ 'f'.repeat(64)],['multiple identical hex occurrences','Approved '+ 'a'.repeat(64)+' '+ 'a'.repeat(64)],['hex inside a longer hex token','Approved '+ 'a'.repeat(65)]])it('A′: '+name+' rejects2 with an actionable fingerprint reason（推断）',()=>sandbox(dir=>{
    const request=interfaceRequest(dir);replaceClaim(request,dir,{...claimAt(dir),reply});const p=consentRejected(bindRun(dir,request));expect(p.reasons.some(r=>/指纹/.test(r.message))).toBe(true);
  }));
  it('A′: same diff ref replaced and declaration refreshed cannot reuse original consent（推断）',()=>sandbox(dir=>{
    const request=interfaceRequest(dir),receipt=readFileSync(join(dir,'consent.json'));refreshDeclared(request,dir,'interface-change.md','Synthetic entirely new action.\n');consentRejected(bindRun(dir,request));expect(readFileSync(join(dir,'consent.json')).equals(receipt)).toBe(true);
  }));
  it('A′: replacing version original and refreshing both triples cannot reuse consent（推断）',()=>sandbox(dir=>{
    const request=interfaceRequest(dir),original=JSON.parse(readFileSync(join(dir,'version-original.json'),'utf8'));request.version.delivered.commit='abcde123';original.version.delivered.commit='abcde123';refreshDeclared(request,dir,'version-original.json',JSON.stringify(original));consentRejected(bindRun(dir,request));
  }));
  it('A′: canonical collection fingerprint permits reversed refs and current row order（推断）',()=>sandbox(dir=>{
    const request=interfaceRequest(dir),claim=claimAt(dir),change=request.materials.find(r=>r.ref==='interface-change.md'),version=request.materials.find(r=>r.ref==='version-original.json');
    const canonical='[{"ref":"interface-change.md","role":"interface-change","sha256":"'+change.sha256+'","bytes":'+change.bytes+'},{"ref":"version-original.json","role":"version","sha256":"'+version.sha256+'","bytes":'+version.bytes+'}]';
    claim.reply='Synthetic approved collection '+sha(Buffer.from(canonical));claim.material_refs.reverse();replaceClaim(request,dir,claim);request.materials.reverse();verdict(bindRun(dir,request),0);
  }));
  it('A′: several changes are covered by one collection fingerprint（推断）',()=>sandbox(dir=>{
    const request=interfaceRequest(dir),claim=claimAt(dir);writeFileSync(join(dir,'other-interface.md'),'Synthetic second change.\n');request.materials.push({...material('other-interface.md','Synthetic second change.\n','other-change'),role:'interface-change'});claim.material_refs.push('other-interface.md');claim.reply='Synthetic approved collection '+consentCollectionFingerprint(request,dir,claim.material_refs);replaceClaim(request,dir,claim);verdict(bindRun(dir,request),0);
  }));
  it('B: removing the change row while original consent still references it rejects2',()=>sandbox(dir=>{
    const request=interfaceRequest(dir);request.materials=request.materials.filter(r=>r.role!=='interface-change');consentRejected(bindRun(dir,request));
  }));
  it('B: dangling consent remains invalid even without a registered change',()=>sandbox(dir=>{
    const request=interfaceRequest(dir);request.materials=request.materials.filter(r=>r.role!=='interface-change');replaceClaim(request,dir,{...claimAt(dir),material_refs:['version-original.json','undeclared-change.md']});consentRejected(bindRun(dir,request));
  }));
  it('B: valid two-side report without change or consent remains allowed',()=>sandbox(dir=>{verdict(bindRun(dir,versionRequest(dir)),0);}));
  it('B: old no-change plain receipt now rejects2 (explicit 0→2)',()=>sandbox(dir=>{
    const request=interfaceRequest(dir);request.materials=request.materials.filter(r=>r.role!=='interface-change');replaceClaim(request,dir,{...claimAt(dir),material_refs:['version-original.json'],reply:'Synthetic no interface change confirmation.'});consentRejected(bindRun(dir,request));
  }));
});

describe('P7 consent-wide role-gate repair（推断X′，有consent必核内容）',()=>{
  it('role-gate: changed bytes plus evidence relabel cannot reuse unchanged consent',()=>sandbox(dir=>{
    const request=interfaceRequest(dir),before=readFileSync(join(dir,'consent.json'));refreshDeclared(request,dir,'interface-change.md','Synthetic replaced change.\n');request.materials.find(r=>r.ref==='interface-change.md').role='evidence';consentRejected(bindRun(dir,request));expect(readFileSync(join(dir,'consent.json')).equals(before)).toBe(true);
  }));
  it('role-gate: normal change role with refreshed changed bytes rejects2',()=>sandbox(dir=>{const request=interfaceRequest(dir);refreshDeclared(request,dir,'interface-change.md','Synthetic replaced change.\n');consentRejected(bindRun(dir,request));}));
  it('role-gate: normal change with correct collection fingerprint allows0',()=>sandbox(dir=>{verdict(bindRun(dir,interfaceRequest(dir)),0);}));
  it('role-gate: no consent and no change allows0',()=>sandbox(dir=>{verdict(bindRun(dir,versionRequest(dir)),0);}));
  it('role-gate: no change with valid consent fingerprint allows0',()=>sandbox(dir=>{
    const request=interfaceRequest(dir);request.materials=request.materials.filter(r=>r.role!=='interface-change');const claim=JSON.parse(readFileSync(join(dir,'consent.json'),'utf8'));claim.material_refs=['version-original.json'];claim.reply='Synthetic no-change collection '+consentCollectionFingerprint(request,dir,claim.material_refs);refreshDeclared(request,dir,'consent.json',JSON.stringify(claim));verdict(bindRun(dir,request),0);
  }));
  it('role-gate: dangling consent without a change rejects2',()=>sandbox(dir=>{const request=interfaceRequest(dir);request.materials=request.materials.filter(r=>r.role!=='interface-change');consentRejected(bindRun(dir,request));}));
});

describe('P7 decision-gate before no-change return',()=>{
  function noChangeReceipt(dir,decision){const request=interfaceRequest(dir);request.materials=request.materials.filter(r=>r.role!=='interface-change');const claim=JSON.parse(readFileSync(join(dir,'consent.json'),'utf8'));claim.material_refs=['version-original.json'];claim.reply='Synthetic no-change approval '+consentCollectionFingerprint(request,dir,claim.material_refs);if(decision===undefined)delete claim.decision;else claim.decision=decision;refreshDeclared(request,dir,'consent.json',JSON.stringify(claim));return request;}
  for(const decision of ['declined','rejected',undefined])it('decision-gate: '+String(decision)+' with no change and correct fingerprint rejects2',()=>sandbox(dir=>{const p=consentRejected(bindRun(dir,noChangeReceipt(dir,decision)));expect(p.reasons.some(r=>/decision|confirmed|决策/.test(r.message))).toBe(true);}));
  it('decision-gate: confirmed with no change and correct fingerprint allows0',()=>sandbox(dir=>{verdict(bindRun(dir,noChangeReceipt(dir,'confirmed')),0);}));
});

describe('P7 source-gate before no-change return',()=>{
  function noChangeSource(dir){const request=interfaceRequest(dir);request.materials=request.materials.filter(r=>r.role!=='interface-change');const source=JSON.parse(readFileSync(join(dir,'version-original.json'),'utf8'));source.version.delivered.commit='22222222';request.version.delivered.commit='22222222';refreshDeclared(request,dir,'version-original.json',JSON.stringify(source));const claim=JSON.parse(readFileSync(join(dir,'consent.json'),'utf8'));claim.material_refs=['version-original.json'];claim.reply='Synthetic version approval '+consentCollectionFingerprint(request,dir,claim.material_refs);refreshDeclared(request,dir,'consent.json',JSON.stringify(claim));return request;}
  it('source-gate: consented version unchanged with confirmed correct fingerprint allows0',()=>sandbox(dir=>{verdict(bindRun(dir,noChangeSource(dir)),0);}));
  it('source-gate: current delivered commit drifts 22222222 to 33333333 with unchanged consent rejects2',()=>sandbox(dir=>{const request=noChangeSource(dir),receipt=readFileSync(join(dir,'consent.json'));request.version.delivered.commit='33333333';consentRejected(bindRun(dir,request));expect(readFileSync(join(dir,'consent.json')).equals(receipt)).toBe(true);}));
  it('source-gate: no consent keeps old semantics despite unrelated version material',()=>sandbox(dir=>{const request=noChangeSource(dir);request.materials=request.materials.filter(r=>r.role!=='consent');request.version.delivered.commit='33333333';verdict(bindRun(dir,request),0);}));
  it('source-gate: ordinary document consent does not require a version source',()=>sandbox(dir=>{const request=versionRequest(dir);writeFileSync(join(dir,'document.md'),'Synthetic ordinary document.');request.materials.push({...material('document.md','Synthetic ordinary document.','document'),role:'evidence'});const refs=['document.md'],claim={decision:'confirmed',reply:'Synthetic document approval '+consentCollectionFingerprint(request,dir,refs),material_refs:refs};writeFileSync(join(dir,'consent.json'),JSON.stringify(claim));request.materials.push({...material('consent.json',JSON.stringify(claim),'consent'),role:'consent'});verdict(bindRun(dir,request),0);}));
});

describe('P7 role-bound-fingerprint type-gate（推断X′含role）',()=>{
  function base(dir){const request=interfaceRequest(dir);request.materials=request.materials.filter(r=>r.role!=='interface-change');const claim=JSON.parse(readFileSync(join(dir,'consent.json'),'utf8'));claim.material_refs=['version-original.json'];claim.reply='Synthetic version consent '+consentCollectionFingerprint(request,dir,claim.material_refs);refreshDeclared(request,dir,'consent.json',JSON.stringify(claim));return request;}
  function fingerprintBody(request,dir,withRole){const ref='version-original.json',row=request.materials.find(r=>r.ref===ref),bytes=readFileSync(join(dir,ref));return withRole?[{ref,role:row.role,sha256:sha(bytes),bytes:bytes.length}]:[{ref,sha256:sha(bytes),bytes:bytes.length}];}
  it('type-gate: reclassifying referenced version to evidence plus current commit drift rejects2',()=>sandbox(dir=>{const request=base(dir),receipt=readFileSync(join(dir,'consent.json'));request.materials.find(r=>r.ref==='version-original.json').role='evidence';request.version.delivered.commit='33333333';consentRejected(bindRun(dir,request));expect(readFileSync(join(dir,'consent.json')).equals(receipt)).toBe(true);}));
  it('type-gate: old three-field collection fingerprint explicitly becomes rejected2',()=>sandbox(dir=>{const request=base(dir),claim=JSON.parse(readFileSync(join(dir,'consent.json'),'utf8'));claim.reply='Synthetic legacy fingerprint '+sha(Buffer.from(JSON.stringify(fingerprintBody(request,dir,false))));refreshDeclared(request,dir,'consent.json',JSON.stringify(claim));consentRejected(bindRun(dir,request));}));
  it('type-gate: correct ref-role-sha256-bytes fingerprint allows0',()=>sandbox(dir=>{const request=base(dir),claim=JSON.parse(readFileSync(join(dir,'consent.json'),'utf8'));claim.reply='Synthetic role-bound fingerprint '+sha(Buffer.from(JSON.stringify(fingerprintBody(request,dir,true))));refreshDeclared(request,dir,'consent.json',JSON.stringify(claim));verdict(bindRun(dir,request),0);}));
});

describe('P7 duplicate-ref rows remain explicit',()=>{
  function one(dir){const request=interfaceRequest(dir);request.materials=request.materials.filter(r=>r.role!=='interface-change');const claim=JSON.parse(readFileSync(join(dir,'consent.json'),'utf8'));claim.material_refs=['version-original.json'];claim.reply='Synthetic one-row approval '+consentCollectionFingerprint(request,dir,claim.material_refs);refreshDeclared(request,dir,'consent.json',JSON.stringify(claim));return request;}
  function addAlias(request){const row=request.materials.find(r=>r.ref==='version-original.json');request.materials.push({...row,material_id:'same-ref-change-row',role:'interface-change'});}
  it('duplicate-ref: adding a second role with unchanged consent rejects2',()=>sandbox(dir=>{const request=one(dir),before=readFileSync(join(dir,'consent.json'));addAlias(request);consentRejected(bindRun(dir,request));expect(readFileSync(join(dir,'consent.json')).equals(before)).toBe(true);}));
  it('duplicate-ref: legitimate all-row consent retains capacity and deterministic order',()=>sandbox(dir=>{const request=one(dir);addAlias(request);const bytes=readFileSync(join(dir,'version-original.json')),ref='version-original.json',rows=['interface-change','version'].map(role=>({ref,role,sha256:sha(bytes),bytes:bytes.length})),claim=JSON.parse(readFileSync(join(dir,'consent.json'),'utf8'));claim.reply='Synthetic complete two-row approval '+sha(Buffer.from(JSON.stringify(rows)));refreshDeclared(request,dir,'consent.json',JSON.stringify(claim));verdict(bindRun(dir,request),0);request.materials.reverse();verdict(bindRun(dir,request),0);}));
  it('duplicate-ref: ordinary single-row approval stays0',()=>sandbox(dir=>{verdict(bindRun(dir,one(dir)),0);}));
  it('duplicate-ref: different-ref multi-material approval stays0',()=>sandbox(dir=>{verdict(bindRun(dir,interfaceRequest(dir)),0);}));
});

describe('P7 final-scope critical preservation',()=>{
  for(const mode of ['evidence','case-variant'])it('final-critical: whole declaration '+mode+' remains a non-UI-proof boundary',()=>sandbox(dir=>{const request=interfaceRequest(dir);refreshDeclared(request,dir,'interface-change.md','Synthetic replaced difference.');for(const row of request.materials)if(['interface-change','consent'].includes(row.role))row.role=mode==='evidence'?'evidence':row.role.toUpperCase();verdict(bindRun(dir,request),0);}));
  it('final-critical: new ref with newly bound consent remains self-consistent0',()=>sandbox(dir=>{const request=interfaceRequest(dir);writeFileSync(join(dir,'new-change.md'),'Synthetic new difference.');request.materials=request.materials.filter(r=>r.role!=='interface-change');request.materials.push({...material('new-change.md','Synthetic new difference.','new-change'),role:'interface-change'});const claim=JSON.parse(readFileSync(join(dir,'consent.json'),'utf8'));claim.material_refs=['new-change.md','version-original.json'];claim.reply='Synthetic new scope '+consentCollectionFingerprint(request,dir,claim.material_refs);refreshDeclared(request,dir,'consent.json',JSON.stringify(claim));verdict(bindRun(dir,request),0);}));
  it('final-critical: two valid consents allow0 but duplicate hex in second rejects2',()=>sandbox(dir=>{const request=interfaceRequest(dir),claim=JSON.parse(readFileSync(join(dir,'consent.json'),'utf8')),body=JSON.stringify(claim);writeFileSync(join(dir,'second-consent.json'),body);request.materials.push({...material('second-consent.json',body,'second-consent'),role:'consent'});verdict(bindRun(dir,request),0);claim.reply+=' '+claim.reply.match(/[a-f0-9]{64}/)[0];refreshDeclared(request,dir,'second-consent.json',JSON.stringify(claim));consentRejected(bindRun(dir,request));}));
  it('final-critical: empty refs authorize no change',()=>sandbox(dir=>{const request=interfaceRequest(dir),change=request.materials.find(r=>r.role==='interface-change');request.materials=request.materials.filter(r=>r!==change);const claim=JSON.parse(readFileSync(join(dir,'consent.json'),'utf8'));claim.material_refs=[];claim.reply='Synthetic empty confirmation '+sha(Buffer.from('[]'));refreshDeclared(request,dir,'consent.json',JSON.stringify(claim));verdict(bindRun(dir,request),0);request.materials.push(change);consentRejected(bindRun(dir,request));}));
});
