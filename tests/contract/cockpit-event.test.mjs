// ORACLE-COCKPIT-EVENT: P5/T007. Same independent oracle; controlled open is a process boundary substitute.
import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, realpathSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { createTask } from '../../runtime/task/task-handle.mjs';
import * as renderer from '../../skills/answer-as-page/scripts/render-answer-page.mjs';
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
 writeFileSync(join(material,'phases/index.md'),'| Phase | 文件 |\n| --- | --- |\n| P7 | [P7](P7-真实交付.md) |\n');writeFileSync(join(material,'phases/P7-真实交付.md'),'# Phase P7\n### T007 — 真实交付\n只读页面\n');
 writeFileSync(join(work,'changed.txt'),'real diff');git(work,['add','.']);git(work,['commit','-qm','real change']);
 await task.appendRecord({dir:'quality/tests',slug:'actual-test',ext:'json',bytes:JSON.stringify({argv:['node','test'],exit_code:0})});await task.appendRecord({dir:'quality/reviews',slug:'actual-review',ext:'json',bytes:JSON.stringify({status:'completed',findings:[]})});
 const reportPath=join(root,'report.json');writeFileSync(reportPath,JSON.stringify({task_id:'cockpit',rings:Array.from({length:10},(_,i)=>({ring:i+1,name:['原始需求','decision-log','调研方案','方案','spec','phase','代码实现','测试验证','最终审查','提交 PR'][i],state:i===9?'skipped':'incomplete',basis:[],applicability:'required',evidence_type:[],counted_in_denominator:true,conflict:null}))}));
 return {taskPath:task.taskPath,reportPath,outDir:join(task.taskPath,'quality/evidence/pages'),htmlName:'cockpit.html',material};
}
const data=path=>JSON.parse(/const DATA = (\{[\s\S]*?\n?\});/.exec(readFileSync(path,'utf8'))[1]);
test('ORACLE-COCKPIT-EVENT: six events use one entry; first/change opens, identical skips, errors remain visible',async()=>{
 const f=await fixture();expect(typeof renderer.refreshAnswerPage,'event entry must exist').toBe('function');let opened=0;const open=async path=>{expect(existsSync(path)).toBe(true);opened++;return true;};
 const first=await renderer.refreshAnswerPage({...f,event:'skeleton-confirmed',open});expect(first.opened).toBe(true);expect(first.changed).toBe(true);expect(opened).toBe(1);
 const same=await renderer.refreshAnswerPage({...f,event:'package-converged',open});expect(same.changed).toBe(false);expect(same.opened).toBe(false);expect(same.open_reason).toBe('无实质变化');expect(opened).toBe(1);
 writeFileSync(join(f.material,'decision-log.md'),'# 目标\n- U-003 实质变化\n');const changed=await renderer.refreshAnswerPage({...f,event:'direction-scope-acceptance-changed',open});expect(changed.changed).toBe(true);expect(opened).toBe(2);
 writeFileSync(join(f.material,'decision-log.md'),'# 目标\n- U-004 第二次实变\n');const facts=readFileSync(join(f.taskPath,'facts.jsonl'));const failed=await renderer.refreshAnswerPage({...f,event:'phase-closed',open:()=>{throw Error('controlled open denied');}});expect(failed.opened).toBe(false);expect(failed.open_reason).toContain('未自动打开: controlled open denied');expect(existsSync(failed.htmlPath)).toBe(true);expect(readFileSync(join(f.taskPath,'facts.jsonl'))).toEqual(facts);
 const end=await renderer.refreshAnswerPage({...f,event:'build-code-ended',open});expect(data(end.htmlPath).rings.find(r=>r.ring===10).state).toBe('skipped');
 const report=JSON.parse(readFileSync(f.reportPath));report.rings[9].state='completed';writeFileSync(f.reportPath,JSON.stringify(report));const closed=await renderer.refreshAnswerPage({...f,event:'stage-closed',open});expect(data(closed.htmlPath).rings[9].state).toBe('completed');expect(closed.event).toBe('stage-closed');
 await expect(renderer.refreshAnswerPage({...f,event:'unknown',open})).rejects.toThrow(/支持|supported/);
});
test('ORACLE-COCKPIT-EVENT: missing comparison baseline opens honestly and build-code cannot complete ring10',async()=>{
 const f=await fixture();expect(typeof renderer.refreshAnswerPage).toBe('function');const first=await renderer.refreshAnswerPage({...f,event:'phase-closed',open:async()=>true});rmSync(first.nodesPath);const next=await renderer.refreshAnswerPage({...f,event:'phase-closed',open:async()=>true});expect(next.opened).toBe(true);expect(next.open_reason).toContain('比较基准缺失');const corrupt=JSON.parse(readFileSync(next.nodesPath));corrupt.nodes[0].content_digest='wrong-sidecar-digest';writeFileSync(next.nodesPath,JSON.stringify(corrupt));const inconsistent=await renderer.refreshAnswerPage({...f,event:'phase-closed',open:async()=>true});expect(inconsistent.open_reason).toContain('比较基准缺失');
 const report=JSON.parse(readFileSync(f.reportPath));report.rings[9].state='completed';writeFileSync(f.reportPath,JSON.stringify(report));await expect(renderer.refreshAnswerPage({...f,event:'build-code-ended',open:async()=>true})).rejects.toThrow(/10|skipped/);
});
test('ORACLE-COCKPIT-EVENT: system open uses argument arrays and real process errors',async()=>{
 const modulePath=join(import.meta.dirname,'../../skills/answer-as-page/scripts/open-page.mjs');expect(existsSync(modulePath),'system opener capability must exist').toBe(true);const {systemOpenCommand,openInSystemBrowser}=await import(modulePath);
 expect(systemOpenCommand('darwin','/a b;quoted.html')).toEqual({command:'open',args:['/a b;quoted.html']});expect(systemOpenCommand('win32','C:/a b.html')).toEqual({command:'cmd',args:['/d','/v:off','/s','/c','start "" "%WH_PAGE_TARGET%"']});expect(systemOpenCommand('linux','/a b.html')).toEqual({command:'xdg-open',args:['/a b.html']});
 const f=await fixture();await expect(openInSystemBrowser(f.reportPath,{run:()=>({status:7,stderr:'real process failure'})})).rejects.toThrow(/7|real process failure/);expect(await openInSystemBrowser(f.reportPath,{run:(_command,args,opts)=>{expect(args.at(-1)).toBe(f.reportPath);expect(opts.shell).toBe(false);return {status:0};}})).toBe(true);await expect(openInSystemBrowser(f.outDir)).rejects.toThrow();
});
test('ORACLE-COCKPIT-EVENT: report generation time or immutable reference drift alone does not reopen',async()=>{
 const f=await fixture();expect(typeof renderer.refreshAnswerPage).toBe('function');let count=0;const open=async()=>{count++;return true;};await renderer.refreshAnswerPage({...f,event:'phase-closed',open});const report=JSON.parse(readFileSync(f.reportPath));report.generated_at='2026-10-27T01:00:00Z';const newReport=join(f.taskPath,'report-second.json');writeFileSync(newReport,JSON.stringify(report,null,2));const next=await renderer.refreshAnswerPage({...f,reportPath:newReport,event:'phase-closed',open});expect(next.changed).toBe(false);expect(count).toBe(1);
});
test('ORACLE-COCKPIT-EVENT: Windows legal metacharacter paths travel only in a private environment value',async()=>{
 const {openInSystemBrowser}=await import('../../skills/answer-as-page/scripts/open-page.mjs');
 const directory=realpathSync(mkdtempSync(join(tmpdir(),'cockpit-win-boundary-')));roots.push(directory);
 const target=join(directory,'a&whoami&%PATH%!bang^中文 空格.html');writeFileSync(target,'<!doctype html>');
 const saved=Object.entries(process.env).filter(([key])=>key.toUpperCase()==='WH_PAGE_TARGET');
 process.env.wh_page_target='inherited-lowercase-poison';process.env.WH_PAGE_TARGET='inherited-uppercase-poison';
 try {
  expect(await openInSystemBrowser(target,{platform:'win32',run:(command,args,options)=>{
   expect(command).toBe('cmd');expect(args).toEqual(['/d','/v:off','/s','/c','start "" "%WH_PAGE_TARGET%"']);
   expect(args.some(arg=>arg.includes(target))).toBe(false);expect(options.shell).toBe(false);expect(options.windowsVerbatimArguments).toBe(true);
   expect(options.env.WH_PAGE_TARGET).toBe(target);expect(Object.keys(options.env).filter(key=>key.toUpperCase()==='WH_PAGE_TARGET')).toEqual(['WH_PAGE_TARGET']);return {status:0};
  }})).toBe(true);
  await expect(openInSystemBrowser(target,{platform:'win32',run:()=>({status:9,stderr:'controlled Windows process failure'})})).rejects.toThrow(/exit=9.*controlled Windows process failure/);
 } finally { for(const key of Object.keys(process.env))if(key.toUpperCase()==='WH_PAGE_TARGET')delete process.env[key];for(const [key,value] of saved)process.env[key]=value; }
});

test('ORACLE-COCKPIT-EVENT: stage-closed rejects a missing or skipped ring10 before replacing the old pair',async()=>{
 const f=await fixture();let opened=0;const open=async()=>{opened++;return true;};const initial=await renderer.refreshAnswerPage({...f,event:'phase-closed',open}),html=readFileSync(initial.htmlPath),nodes=readFileSync(initial.nodesPath),report=JSON.parse(readFileSync(f.reportPath));for(const rings of [report.rings.filter(r=>r.ring!==10),report.rings]){writeFileSync(f.reportPath,JSON.stringify({...report,rings}));await expect(renderer.refreshAnswerPage({...f,event:'stage-closed',open})).rejects.toThrow(/stage-closed.*10|10.*stage-closed/);expect(opened).toBe(1);expect(readFileSync(initial.htmlPath)).toEqual(html);expect(readFileSync(initial.nodesPath)).toEqual(nodes);}report.rings[9].state='incomplete';writeFileSync(f.reportPath,JSON.stringify(report));const result=await renderer.refreshAnswerPage({...f,event:'stage-closed',open});expect(data(result.htmlPath).rings[9].state).toBe('incomplete');
});
test('ORACLE-COCKPIT-EVENT: actual CLI routes --event to the process opener and skips an identical repeat',async()=>{
 const f=await fixture(),bin=join(f.outDir,'fake-bin');mkdirSync(bin,{recursive:true});const log=join(f.outDir,'cli-open.log'),binary=join(bin,process.platform==='darwin'?'open':'xdg-open');writeFileSync(binary,'#!/bin/sh\nprintf "%s\\n" "$1" >> "$COCKPIT_CLI_OPEN_LOG"\nexit 0\n');chmodSync(binary,0o700);const hostPreload=join(bin,'owned-browser-host.cjs');writeFileSync(hostPreload,"Object.defineProperty(process,'platform',{value:'darwin'});");writeFileSync(join(bin,'osascript'),'#!/usr/bin/env node\nconst path=process.env.WH_PAGE_TARGET;if(!path)throw Error("task target missing");require("node:fs").appendFileSync(process.env.COCKPIT_CLI_OPEN_LOG,path+"\\n");console.log(JSON.stringify({opened:true,action:"opened",browser:"controlled process substitute",url:process.env.WH_PAGE_URL}));\n');chmodSync(join(bin,'osascript'),0o700);const entry=join(import.meta.dirname,'../../skills/answer-as-page/scripts/render-answer-page.mjs');const argv=['--require',hostPreload,entry,'--task-path',f.taskPath,'--report',f.reportPath,'--out-dir',f.outDir,'--html',f.htmlName,'--event','phase-closed'];const options={encoding:'utf8',env:{...process.env,PATH:bin+':'+process.env.PATH,COCKPIT_CLI_OPEN_LOG:log}};const first=spawnSync(process.execPath,argv,options);expect(first.status,first.stderr).toBe(0);const result=JSON.parse(first.stdout);expect(result.event).toBe('phase-closed');expect(result.changed).toBe(true);expect(result.opened).toBe(true);expect(existsSync(result.htmlPath)).toBe(true);expect(readFileSync(log,'utf8')).toBe(result.htmlPath+'\n');const repeated=spawnSync(process.execPath,argv,options);expect(repeated.status,repeated.stderr).toBe(0);expect(JSON.parse(repeated.stdout)).toMatchObject({event:'phase-closed',changed:false,opened:false,open_reason:'无实质变化'});expect(readFileSync(log,'utf8')).toBe(result.htmlPath+'\n');const invalid=spawnSync(process.execPath,[...argv.slice(0,-1),'unknown'],options);expect(invalid.status).not.toBe(0);
});
test('ORACLE-COCKPIT-EVENT correction: identified task tab uses verifiable refresh and never blind system-open fallback',async()=>{
 const f=await fixture(),target=join(f.outDir,'portable.html');mkdirSync(f.outDir,{recursive:true});writeFileSync(target,'<!doctype html>');const {openInSystemBrowser}=await import('../../skills/answer-as-page/scripts/open-page.mjs');for(const action of ['opened','refreshed']){const result=await openInSystemBrowser(target,{platform:'darwin',taskIdentity:'Demo/portable',run:(cmd,args,opt)=>{expect(cmd).toBe('osascript');expect(args).toContain('JavaScript');expect(opt.env.WH_PAGE_IDENTITY).toBe('Demo/portable');expect(opt.env.WH_PAGE_TARGET).toBe(target);expect(opt.env.WH_PAGE_URL).toBe('file://'+target+'#workflowhub-task=Demo%2Fportable');return {status:0,stdout:JSON.stringify({opened:true,action,browser:'owned browser',url:opt.env.WH_PAGE_URL})};}});expect(result.action).toBe(action);}await expect(openInSystemBrowser(target,{platform:'darwin',taskIdentity:'Demo/portable',run:()=>({status:0,stdout:''})})).rejects.toThrow(/确认|confirm|capability|结果/);
});
test('ORACLE-COCKPIT-EVENT correction: actual host script reuses identity across filenames and separates another task',async()=>{
 const f=await fixture(),one=join(f.outDir,'one.html'),two=join(f.outDir,'two.html');mkdirSync(f.outDir,{recursive:true});writeFileSync(one,'one');writeFileSync(two,'two');const {openInSystemBrowser}=await import('../../skills/answer-as-page/scripts/open-page.mjs'),{runInNewContext}=await import('node:vm'),{pathToFileURL}=await import('node:url');
 const collection=items=>new Proxy(function(){return items;},{get:(_,key)=>key==='length'?items.length:key==='push'?item=>items.push(item):items[key],apply:()=>items});
 const tab=initial=>{let url=initial;return Object.defineProperty({},'url',{get:()=>()=>url,set:next=>{url=next;}});},window={tabs:collection([])},app={running:()=>true,windows:collection([window]),Tab:({url})=>tab(url)};
 const run=(command,args,options)=>{expect(command).toBe('osascript');const $={NSProcessInfo:{processInfo:{environment:{objectForKey:key=>options.env[key]}}},NSURL:{fileURLWithPath:path=>({path,absoluteString:pathToFileURL(path).href})},NSBundle:{bundleWithURL:()=>({bundleIdentifier:'com.google.Chrome'})},NSWorkspace:{sharedWorkspace:{URLForApplicationToOpenURL:()=>({path:'/owned/Chrome.app'})}}};return {status:0,stdout:runInNewContext(args[3],{$,ObjC:{import(){},unwrap:x=>x},Application:()=>app})};};
 const first=await openInSystemBrowser(one,{platform:'darwin',taskIdentity:'Demo/alpha',taskRoot:f.taskPath,run});expect(first.action).toBe('opened');expect(window.tabs.length).toBe(1);
 const next=await openInSystemBrowser(two,{platform:'darwin',taskIdentity:'Demo/alpha',taskRoot:f.taskPath,run});expect(next.action).toBe('refreshed');expect(window.tabs.length).toBe(1);expect(window.tabs[0].url()).toBe(pathToFileURL(two).href+'#workflowhub-task=Demo%2Falpha');
 const other=await openInSystemBrowser(two,{platform:'darwin',taskIdentity:'Demo/beta',taskRoot:f.taskPath,run});expect(other.action).toBe('opened');expect(window.tabs.length).toBe(2);expect(window.tabs[0].url()).toContain('Demo%2Falpha');expect(window.tabs[1].url()).toContain('Demo%2Fbeta');
});
test('ORACLE-COCKPIT-EVENT correction: owned native guard binds both exact application path and PID',async()=>{
 const f=await fixture(),target=join(f.outDir,'owned.html');mkdirSync(f.outDir,{recursive:true});writeFileSync(target,'owned');const {openInSystemBrowser}=await import('../../skills/answer-as-page/scripts/open-page.mjs'),{runInNewContext}=await import('node:vm');let appCalls=0;
 const invoke=instances=>openInSystemBrowser(target,{platform:'darwin',taskIdentity:'Demo/owned',browserApplication:'/owned/Chrome.app',browserPid:42,run:(cmd,args,options)=>{const $={NSProcessInfo:{processInfo:{environment:{objectForKey:key=>options.env[key]}}},NSURL:{fileURLWithPath:path=>({path})},NSBundle:{bundleWithURL:()=>({bundleIdentifier:'com.google.Chrome'})},NSRunningApplication:{runningApplicationsWithBundleIdentifier:()=>({count:instances.length,objectAtIndex:i=>({bundleURL:{path:instances[i].path},processIdentifier:instances[i].pid})})}};try{return {status:0,stdout:runInNewContext(args[3],{$,ObjC:{import(){},unwrap:x=>x},Application:()=>{appCalls++;throw Error('owned app reached');}})};}catch(e){return {status:1,stderr:e.message};}}});
 await expect(invoke([{path:'/foreign/Chrome.app',pid:42}])).rejects.toThrow(/owned浏览器/);expect(appCalls).toBe(0);
 await expect(invoke([{path:'/owned/Chrome.app',pid:99}])).rejects.toThrow(/owned浏览器/);expect(appCalls).toBe(0);
 await expect(invoke([{path:'/owned/Chrome.app',pid:42},{path:'/owned/Chrome.app',pid:99}])).rejects.toThrow(/owned浏览器/);expect(appCalls).toBe(0);
 await expect(invoke([{path:'/foreign/Chrome.app',pid:99},{path:'/owned/Chrome.app',pid:42}])).rejects.toThrow('owned app reached');expect(appCalls).toBe(1);
});
