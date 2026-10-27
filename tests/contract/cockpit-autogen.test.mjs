// ORACLE-COCKPIT-GEN: P5/T006. Independent oracle: p5-independent-oracle-tcr original.
import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, realpathSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import { createTask, openTask } from '../../runtime/task/task-handle.mjs';
import { renderAnswerPage } from '../../skills/answer-as-page/scripts/render-answer-page.mjs';
const roots=[];
afterEach(()=>{for(const root of roots.splice(0))rmSync(root,{recursive:true,force:true});});
async function fixture(){
 const root=realpathSync(mkdtempSync(join(tmpdir(),'cockpit-gen-')));roots.push(root);
 const repo=join(root,'repo'),work=join(root,'work');mkdirSync(repo);
 const git=(cwd,args)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 git(repo,['init','-q','-b','main']);git(repo,['config','user.name','Cockpit Test']);git(repo,['config','user.email','test@example.invalid']);writeFileSync(join(repo,'base.txt'),'baseline');git(repo,['add','.']);git(repo,['commit','-qm','baseline']);const base=git(repo,['rev-parse','HEAD']);git(repo,['worktree','add','-qb','test-cockpit',work]);
 mkdirSync(join(root,'store'));
 const task=await createTask({storageRoot:join(root,'store'),manifest:{schema_version:'1.0.0',project_name:'Demo',task_id:'cockpit',created_at:'2026-10-27T00:00:00Z',target_repo_root:repo,workspace_mode:'existing',workspace_root:work,baseline_commit:base,activation_cohort:'post',execution_mode:'per_invocation',record_model:'vnext-single-write',issue_ids:[],inputs:{}}});
 writeFileSync(join(task.taskPath,'facts.jsonl'),'');
 const material=join(work,'specs/cockpit');mkdirSync(join(material,'phases'),{recursive:true});
 writeFileSync(join(material,'decision-log.md'),'# 当前决策\n## 目标\n让失败可见\n- U-001 用户要求保留真实失败\n## WP1\n只读页面\n');
 writeFileSync(join(material,'spec.md'),'# 真实驾驶舱\n## 功能需求\nFR-ONE 只读生成\n## Appendix A\n- [ ] **AC-ONE**：缺数据标缺\n## 风险\n风险：缺少原件\n');
 writeFileSync(join(material,'phases/index.md'),'| Phase | 文件 |\n| --- | --- |\n| P7 | [P7](P7-真实交付.md) |\n');writeFileSync(join(material,'phases/P7-真实交付.md'),'# Phase P7\n- **gate_cmd**：`node custom-oracle.mjs`\n### T007 — 真实交付\n只读页面\n');
 writeFileSync(join(work,'changed.txt'),'real diff');git(work,['add','.']);git(work,['commit','-qm','real change']);
 await task.appendRecord({dir:'quality/tests',slug:'actual-test',ext:'json',bytes:JSON.stringify({argv:['node','--test','example.test.mjs'],exit_code:0})});await task.appendRecord({dir:'quality/reviews',slug:'actual-review',ext:'json',bytes:JSON.stringify({status:'completed',findings:[]})});
 const reportPath=join(root,'report.json');writeFileSync(reportPath,JSON.stringify({task_id:'cockpit',rings:Array.from({length:10},(_,i)=>({ring:i+1,name:['原始需求','decision-log','调研方案','方案','spec','phase','代码实现','测试验证','最终审查','提交 PR'][i],state:i===9?'skipped':'incomplete',basis:[],applicability:'required',evidence_type:[],counted_in_denominator:true,conflict:null}))}));
 return {taskPath:task.taskPath,reportPath,outDir:join(root,'pages'),htmlName:'cockpit.html',material};
}
const data=path=>JSON.parse(/const DATA = (\{[\s\S]*?\n?\});/.exec(readFileSync(path,'utf8'))[1]);
// Executes the actual emitted template consumers; this is not DOM/click or CSS coverage.
function templateView(path, expression) {
 const script=/<script>([\s\S]*?)<\/script>/.exec(readFileSync(path,'utf8'))[1];
 return runInNewContext(script+'\nconst ui={sources:new Set(),srcRows:new Set(),plan:false,fileFold:false};let sel="progress";const hist=[];const CHANGED=new Set(),RELATED=new Set();\n'+expression);
}
test('ORACLE-COCKPIT-GEN: navigation consumers expose every real object without inventing edges',async()=>{
 const f=await fixture(),r=await renderAnswerPage(f),d=data(r.htmlPath);
 const sidebar=templateView(r.htmlPath,'sidebarHtml()');
 const ids=[...sidebar.matchAll(/data-go="([^"]+)"/g)].map(m=>m[1]).filter(id=>id!=='progress');
 expect([...new Set(ids)].sort()).toEqual(d.objects.map(o=>o.id).sort());
 expect(new Set(d.objects.filter(o=>ids.includes(o.id)).map(o=>o.kind))).toEqual(new Set(['req','spec','dec','goal','wp','ires','eres','phase','task','file','test','review','acc','risk','pr']));
 expect(d.edges).toEqual([]);expect(d.sideEdges).toEqual([]);
});
test('ORACLE-COCKPIT-GEN: expanded source consumer displays actual source classification and paths',async()=>{
 const f=await fixture(),r=await renderAnswerPage(f),d=data(r.htmlPath);
 for(const o of d.objects){
  const panel=templateView(r.htmlPath,`ui.sources.add(encodeURIComponent(${JSON.stringify(o.id)}));OBJ[${JSON.stringify(o.id)}].src.forEach((s,i)=>ui.srcRows.add(encodeURIComponent(${JSON.stringify(o.id)})+'-'+i));sourcesHtml(OBJ[${JSON.stringify(o.id)}])`);
  expect(panel).not.toContain('undefined');
  for(const s of o.src){
   const expected=s.path.endsWith('task.json')?'任务元数据':s.path.endsWith('facts.jsonl')?'任务事实':s.path.includes('/quality/tests')?'测试记录':s.path.includes('/quality/reviews')?'审查记录':s.path.includes('/quality/evidence/research')?'调研原件':s.path===f.reportPath?'十环报告':'任务材料';
   expect(s.kind).toBe(expected);expect(panel).toContain(expected);expect(panel).toContain(s.path);expect(panel).toContain(s.loc);expect(panel).toContain(s.name);
  }
 }
 const req=d.objects.find(o=>o.kind==='req');expect(req.status.text).toBe('缺');expect(req.src[0].path).toBe(join(f.material,'decision-log.md'));expect(req.summary).toContain('原件');
});
test('ORACLE-COCKPIT-GEN: reachable hero consumers preserve real summaries without undefined fields',async()=>{
 const f=await fixture(),r=await renderAnswerPage(f),d=data(r.htmlPath);
 for(const o of d.objects){const hero=templateView(r.htmlPath,`heroHtml(OBJ[${JSON.stringify(o.id)}])`);expect(hero).not.toContain('undefined');expect(hero).toContain(o.title);}
 expect(templateView(r.htmlPath,'heroHtml(OBJ[DATA.objects.find(o=>o.kind==="dec").id])')).toContain('决定理由未取得');
 expect(templateView(r.htmlPath,'heroHtml(OBJ[DATA.objects.find(o=>o.kind==="eres").id])')).toContain('调研结论未取得');
 expect(templateView(r.htmlPath,'heroHtml({...OBJ[DATA.objects.find(o=>o.kind==="dec").id],detail:"独立具名决定",why:"独立具名理由"})')).toContain('独立具名理由');
 expect(templateView(r.htmlPath,'heroHtml({...OBJ[DATA.objects.find(o=>o.kind==="ires").id],finding:"已有具名研究结论",origin:"已有具名研究范围"})')).toContain('已有具名研究结论');
});
test('ORACLE-COCKPIT-GEN: complete selected detail consumer has no undefined source or chain fields',async()=>{
 const f=await fixture(),r=await renderAnswerPage(f),d=data(r.htmlPath);
 for(const o of d.objects){const main=templateView(r.htmlPath,`sel=${JSON.stringify(o.id)};mainHtml()`);expect(main).not.toContain('undefined');expect(main).toContain(o.title);}
});
test('ORACLE-COCKPIT-GEN: task root alone derives 15 sourced kinds, ten exact rings and real diff',async()=>{
 const f=await fixture();f.outDir=join(f.taskPath,'quality/evidence/cockpit');const facts=readFileSync(join(f.taskPath,'facts.jsonl'));const r=await renderAnswerPage(f),d=data(r.htmlPath);
 expect(new Set(d.objects.map(o=>o.kind)).size).toBe(15);expect(d.rings).toEqual(JSON.parse(readFileSync(f.reportPath)).rings);
 expect(d.objects.every(o=>o.src.length>0)).toBe(true);expect(d.objects.filter(o=>o.kind==='file').some(o=>o.title.includes('changed.txt'))).toBe(true);
 expect(d.objects.find(o=>o.kind==='review').status.text).not.toContain('缺');expect(d.objects.find(o=>o.kind==='test').status.text).not.toContain('缺');
 expect(readFileSync(join(f.taskPath,'facts.jsonl'))).toEqual(facts);expect(readFileSync(r.htmlPath,'utf8')).not.toContain('导出失败要自动重试三次');
 const side=JSON.parse(readFileSync(r.nodesPath));expect(Object.keys(side).sort()).toEqual(['generated_at','nodes','schema','source_fingerprint']);expect(side.nodes.every(n=>Object.keys(n).sort().join(',')==='content_digest,stable_id')).toBe(true);expect(side.nodes.some(n=>n.stable_id==='kind:review')).toBe(true);
});
test('ORACLE-COCKPIT-GEN: missing originals stay missing; material change changes derivation and keeps old pair',async()=>{
 const f=await fixture();rmSync(join(f.taskPath,'quality/reviews'),{recursive:true});rmSync(join(f.taskPath,'quality/tests'),{recursive:true});const r=await renderAnswerPage(f);const oldHtml=readFileSync(r.htmlPath),oldNodes=readFileSync(r.nodesPath),d=data(r.htmlPath);
 expect(d.objects.find(o=>o.kind==='review').status.text).toContain('缺');expect(d.objects.find(o=>o.kind==='test').status.text).toContain('缺');
 writeFileSync(join(f.material,'decision-log.md'),'# 当前决策\n## 目标\n修改后的真实目标\n- U-002 新要求\n');const next=await renderAnswerPage(f);expect(readFileSync(next.htmlPath)).not.toEqual(oldHtml);expect(readFileSync(next.nodesPath)).not.toEqual(oldNodes);
 expect(next.history).toHaveLength(2);expect(readFileSync(next.history[0])).toEqual(oldNodes);expect(readFileSync(next.history[1])).toEqual(oldHtml);
});
test('ORACLE-COCKPIT-GEN: wrong report identity fails before publishing',async()=>{
 const f=await fixture();const report=JSON.parse(readFileSync(f.reportPath));report.task_id='another-task';writeFileSync(f.reportPath,JSON.stringify(report));await expect(renderAnswerPage(f)).rejects.toThrow(/identity|身份|task/i);expect(existsSync(join(f.outDir,f.htmlName))).toBe(false);
});
test('ORACLE-COCKPIT-GEN: missing decision source renders truthful gaps',async()=>{
 const f=await fixture();rmSync(join(f.material,'decision-log.md'));const result=await renderAnswerPage(f),d=data(result.htmlPath);for(const kind of ['req','dec','goal','wp'])expect(d.objects.find(o=>o.kind===kind).status.text).toBe('缺');expect(readFileSync(result.htmlPath,'utf8')).toContain('decision-log 缺失');
});

test('ORACLE-COCKPIT-GEN: observation receipts and timestamps do not become test facts or business changes',async()=>{
 const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs');const f=await fixture();
 const task=openTask(f.taskPath,{projectName:'Demo',taskId:'cockpit'}),before=await buildPageData(f);const beforeTests=before.pageData.objects.find(o=>o.kind==='test');
 const ordinary=await task.captureCommand({cwd:f.material,slug:'ordinary-progress-observation',argv:[process.execPath,'-e','process.stdout.write("progress observed")'],timeoutMs:10000});expect(ordinary.exit_code).toBe(0);
 const observed=await buildPageData(f);expect(observed.pageData.objects.find(o=>o.kind==='test')).toEqual(beforeTests);expect(observed.sourceFingerprint).toEqual(before.sourceFingerprint);expect(observed.excludedCommandRefs).toContain(ordinary.receipt_ref);expect(observed.pageData.objects.find(o=>o.kind==='test').summary).toContain('未分类');
 const row={record_kind:'stage',task_id:'cockpit',stage:'build-code',source:'pure observation receipt',created_at:'2026-10-27T00:00:00Z',evidence:{value:[{command:'node tools/cli/run-checks.mjs --task-path fixture',exit_code:0,output_ref:ordinary.output_ref}]}};
 await task.writeRecordAtomic('facts.jsonl',JSON.stringify(row)+'\n');const onlyObservation=await buildPageData(f);expect(onlyObservation.sourceFingerprint).toEqual(before.sourceFingerprint);
 row.phase_progress={phase_id:'P7',task_id:'T007',phases_head:'a'.repeat(40),base_head:'a'.repeat(40),recorded_at:'2026-10-27T01:00:00Z'};await task.writeRecordAtomic('facts.jsonl',JSON.stringify(row)+'\n');const progressed=await buildPageData(f);expect(progressed.sourceFingerprint).not.toEqual(onlyObservation.sourceFingerprint);expect(progressed.pageData.objects.find(o=>o.kind==='task').status.text).toContain('当前游标');
 row.source='second observation receipt';row.phase_progress.recorded_at='2026-10-27T02:00:00Z';await task.writeRecordAtomic('facts.jsonl',JSON.stringify(row)+'\n');expect((await buildPageData(f)).sourceFingerprint).toEqual(progressed.sourceFingerprint);
 const testFile=join(f.taskPath,'actual-failure.test.mjs');writeFileSync(testFile,'import test from "node:test";test("actual failure",()=>{throw Error("controlled true test failure");});');const trueTest=await task.captureCommand({cwd:f.material,slug:'real-test-result',argv:[process.execPath,'--test',testFile],timeoutMs:10000});expect(trueTest.exit_code).toBe(1);
 const tested=await buildPageData(f);expect(tested.pageData.objects.find(o=>o.kind==='test').src.some(s=>s.path===trueTest.receipt_ref)).toBe(true);expect(tested.sourceFingerprint).not.toEqual(progressed.sourceFingerprint);const custom=await task.appendRecord({dir:'quality/tests',slug:'custom-gate-result',ext:'json',bytes:JSON.stringify({argv:['node','custom-oracle.mjs'],exit_code:1})});const gated=await buildPageData(f);expect(gated.pageData.objects.find(o=>o.kind==='test').src.some(s=>s.path===custom)).toBe(true);expect(gated.sourceFingerprint).not.toEqual(tested.sourceFingerprint);
});
test.each([
 ['supplement heading only','## 补充材料\n'],
 ['internal supplement pointers only','## 补充材料\n- decision-log：[内部决定](decision-log.md#U-001)\n- [内部结论](../internal.md)\n- `quality/evidence/research/internal.md`\n'],
])('ORACLE-COCKPIT-GEN: %s is missing external evidence',async(_name,supplement)=>{
 const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs');const f=await fixture();const spec=join(f.material,'spec.md');writeFileSync(spec,'# 真实任务\n## 功能需求\nFR-ONE\n'+supplement);const projected=await buildPageData(f),external=projected.pageData.objects.find(o=>o.kind==='eres');expect(external.status.text).toBe('缺');expect(external.src.some(s=>s.path===spec)).toBe(true);
});
test('ORACLE-COCKPIT-GEN: external supplement URL keeps a source pointer without pretending to fetch it',async()=>{
 const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs');const f=await fixture(),spec=join(f.material,'spec.md');writeFileSync(spec,'# 真实任务\n## 功能需求\nFR-ONE\n## 补充材料\n- [内部](decision-log.md)\n- [外部来源](https://authoritative.example/paper#section)\n');const external=(await buildPageData(f)).pageData.objects.find(o=>o.kind==='eres');expect(external.status.text).not.toBe('缺');expect(external.src.some(s=>s.path===spec&&s.loc.includes('https://authoritative.example/paper#section'))).toBe(true);expect(external.title+' '+external.summary).toContain('https://authoritative.example/paper#section');expect(external.summary).toContain('未抓取');
});
test('ORACLE-COCKPIT-GEN: phase index traversal and same-prefix siblings are rejected by the real derivation',async()=>{
 const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs');const f=await fixture();for(const ref of ['../P7-outside.md','../phases-evil/P7-outside.md']){writeFileSync(join(f.material,'phases/index.md'),'| Phase | 文件 |\n| P7 | `'+ref+'` |\n');await expect(buildPageData(f)).rejects.toThrow('phase index path escapes phases');}
});

test.each(['quality/tests','quality/reviews','quality/evidence/research'])('ORACLE-COCKPIT-GEN: source traversal root %s cannot alias outside the task',async ref=>{
 const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs');const f=await fixture(),outside=join(f.outDir,'outside-source');mkdirSync(outside,{recursive:true});writeFileSync(join(outside,'outside.json'),JSON.stringify({argv:['node','--test','sentinel.test.mjs'],exit_code:0}));writeFileSync(join(outside,'outside.md'),'External sentinel https://example.invalid/source');const target=join(f.taskPath,ref);rmSync(target,{recursive:true,force:true});mkdirSync(join(target,'..'),{recursive:true});symlinkSync(outside,target,'dir');await expect(buildPageData(f)).rejects.toThrow(/alias|symlink|task scope|outside/i);expect(existsSync(join(f.outDir,f.htmlName))).toBe(false);
});
test('ORACLE-COCKPIT-GEN: an existing requirements index routes the exact raw requirement original',async()=>{
 const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs');const f=await fixture(),task=openTask(f.taskPath,{projectName:'Demo',taskId:'cockpit'}),rawRef='quality/evidence/raw-requirements/user-original.md',indexRef='quality/evidence/decision-log-refs/requirement-index.md';await task.writeRecordAtomic(rawRef,'用户原文独特要求：第七次失败仍须可见。\n');await task.writeRecordAtomic(indexRef,'# 需求索引\n逐字来源：`'+rawRef+'`\n');writeFileSync(join(f.material,'decision-log.md'),'# 当前材料\n需求索引：`'+indexRef+'`\n');const req=(await buildPageData(f)).pageData.objects.find(o=>o.kind==='req');expect(req.status.text).not.toBe('缺');expect(req.title).toContain('第七次失败');expect(req.src.some(s=>s.path===join(f.taskPath,rawRef))).toBe(true);expect(req.src.some(s=>s.path===join(f.taskPath,indexRef))).toBe(true);rmSync(join(f.taskPath,rawRef));const missing=(await buildPageData(f)).pageData.objects.find(o=>o.kind==='req');expect(missing.status.text).toBe('缺');expect(missing.summary).toContain('raw-requirements');expect(missing.src.some(s=>s.path===join(f.taskPath,rawRef))).toBe(false);
});
test('ORACLE-COCKPIT-GEN: decision requirements do not pretend missing raw originals are complete',async()=>{
 const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs');const f=await fixture(),req=(await buildPageData(f)).pageData.objects.find(o=>o.kind==='req');expect(req.status.text).toBe('缺');expect(req.summary).toContain('raw-requirements');expect(req.src.some(s=>s.path===join(f.material,'decision-log.md'))).toBe(true);expect(req.src.some(s=>s.path===join(f.material,'spec.md'))).toBe(false);
});
test('ORACLE-COCKPIT-GEN: a generic research filename does not hide its external source pointer',async()=>{
 const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs');const f=await fixture(),task=openTask(f.taskPath,{projectName:'Demo',taskId:'cockpit'}),ref='quality/evidence/research/notes.md';await task.writeRecordAtomic(ref,'# 研究笔记\n来源：[规范](https://authoritative.example/research#source)\n');const external=(await buildPageData(f)).pageData.objects.find(o=>o.kind==='eres');expect(external.status.text).not.toBe('缺');expect(external.src.some(s=>s.path===join(f.taskPath,ref)&&s.loc.includes('https://authoritative.example/research#source'))).toBe(true);expect(external.summary).toContain('未抓取');
});
test('ORACLE-COCKPIT-GEN: recursive research symlink is rejected without consuming its outside sentinel',async()=>{
 const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs');const f=await fixture(),outside=join(f.outDir,'outside-nested-source'),research=join(f.taskPath,'quality/evidence/research');mkdirSync(outside,{recursive:true});mkdirSync(research,{recursive:true});writeFileSync(join(outside,'notes.md'),'External sentinel https://example.invalid/nested');symlinkSync(outside,join(research,'linked-child'),'dir');await expect(buildPageData(f)).rejects.toThrow(/alias|symlink/i);
});
