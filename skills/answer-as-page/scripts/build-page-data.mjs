#!/usr/bin/env node
import { readFileSync, readdirSync, lstatSync, existsSync, realpathSync } from 'node:fs';
import { join, resolve, relative, isAbsolute, basename, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { openTask } from '../../../runtime/task/task-handle.mjs';
import { openCurrentTaskWorkspace } from '../../../runtime/task/workspace.mjs';
import { readTaskFacts } from '../../../runtime/task/task-store.mjs';

export const KIND_SOURCES = Object.freeze({req:'decision-log.md / raw-requirements',spec:'spec.md',dec:'decision-log.md',goal:'decision-log.md',wp:'decision-log.md',ires:'quality/evidence/research',eres:'quality/evidence/research / spec.md',phase:'phases/index.md',task:'phases/P*.md / facts.jsonl',file:'git diff baseline_commit..HEAD',test:'quality/tests',review:'quality/reviews',acc:'spec.md / Appendix A',risk:'spec.md / decision-log.md',pr:'report / ring 10'});
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const short = text => text.replace(/^[#*\s-]+/u,'').replace(/\*\*/g,'').trim().slice(0,140);
const qualityRefs = text => [...new Set(((text??'').match(/quality\/evidence\/[^\s`"'<>|；:：，。)\]]+/g)??[]).map(ref=>ref.split('#')[0].replace(/[.;]+$/u,'')))];

function externalPointers(text, supplementOnly=false) {
 const pointers=[];let active=!supplementOnly,sectionDepth=0,fenced=false;
 for(const line of (text??'').split('\n')) {
  if(/^\s*```/.test(line)){fenced=!fenced;continue;}
  if(fenced)continue;
  const heading=/^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
  if(heading){if(supplementOnly){if(heading[2]==='补充材料'){active=true;sectionDepth=heading[1].length;}else if(active&&heading[1].length<=sectionDepth)active=false;}continue;}
  if(!active)continue;
  for(const match of line.matchAll(/https?:\/\/[^\s<>()`"'\]]+/g)) {
   const pointer=match[0].replace(/[.,;，。；]+$/u,'');
   try { const url=new URL(pointer);if(['http:','https:'].includes(url.protocol)&&url.hostname)pointers.push(pointer); } catch { /* A malformed claimed pointer is not external evidence. */ }
  }
 }
 return [...new Set(pointers)];
}

// A narrow receipt classification, not a test executor or a claim of complete coverage.
function isTestReceipt(record, declaredGates) {
 const argv=record?.argv;
 if(!Array.isArray(argv)||!argv.length||argv.some(arg=>typeof arg!=='string')||!Object.hasOwn(record,'exit_code'))return false;
 const executable=basename(argv[0]).replace(/\.exe$/i,'').toLowerCase(),args=argv.slice(1);
 if(declaredGates.has(argv.join(' '))||declaredGates.has([executable,...args].join(' ')))return true;
 if(['vitest','pytest','jest','mocha'].includes(executable))return true;
 if(['npx','pnpm','yarn','bunx'].includes(executable)) {
  const command=args.filter(arg=>!['exec','dlx','--yes','-y'].includes(arg))[0];
  if(['vitest','pytest','jest','mocha'].includes(command))return true;
 }
 if(['npm','pnpm','yarn','bun'].includes(executable)) {
  const script=args[0]==='run'?args[1]:args[0];
  if(typeof script==='string'&&/^test(?::|$)/.test(script))return true;
 }
 if(['python','python3'].includes(executable)&&args[0]==='-m'&&args[1]==='pytest')return true;
 if(['node','nodejs'].includes(executable)) {
  for(const arg of args) {
   if(['-e','--eval','-p','--print','--'].includes(arg))return false;
   if(arg==='--test'||arg.startsWith('--test='))return true;
   if(!arg.startsWith('-'))return /\.test\.[cm]?[jt]sx?$/.test(arg);
  }
 }
 if(['sh','bash','zsh','cmd'].includes(executable)) {
  const index=args.findIndex(arg=>['-c','-lc','/c'].includes(arg));
  return index>=0&&declaredGates.has(args[index+1]);
 }
 return false;
}

/** Read-only task projection. Missing evidence is a node with an explicit gap, never a completion. */
export async function buildPageData({ taskPath, reportPath } = {}) {
 if (!taskPath || !isAbsolute(taskPath) || !reportPath) throw Error('absolute taskPath and reportPath are required for derivation');
 const manifest=JSON.parse(readFileSync(join(taskPath,'task.json'),'utf8'));
 const task=openTask(resolve(taskPath),{projectName:manifest.project_name,taskId:manifest.task_id});
 const workspace=await openCurrentTaskWorkspace(task), root=workspace.worktreeRoot, material=join(root,'specs',manifest.task_id);
 const fingerprints={};
 function read(path,optional=false){try{const rel=relative(task.taskPath,path),inTask=rel!==''&&rel!=='..'&&!rel.startsWith(`..${sep}`)&&!isAbsolute(rel);let bytes;if(inTask)bytes=task.readRecordBytes(rel.split(sep).join('/'));else{const stat=lstatSync(path);if(!stat.isFile()||stat.isSymbolicLink()||realpathSync(path)!==resolve(path))throw Error(`source alias or non-regular file: ${path}`);bytes=readFileSync(path);}fingerprints[path]=hash(bytes);return bytes.toString('utf8');}catch(error){if(optional&&error.code==='ENOENT')return null;throw error;}}
 const report=JSON.parse(read(resolve(reportPath)));
 // Immutable report references and generation timestamps are provenance, not a new result.
 delete fingerprints[resolve(reportPath)];
 fingerprints.report_rings_sha256=hash(JSON.stringify(report.rings));
 if(report.task_id!==manifest.task_id)throw Error('report task identity differs from task manifest');
 if(!Array.isArray(report.rings)||!report.rings.length||report.rings.length>10||new Set(report.rings.map(r=>r.ring)).size!==report.rings.length||report.rings.some(r=>!Number.isInteger(r.ring)||r.ring<1||r.ring>10))throw Error('report rings[] must contain unique numbered rings 1–10');
 read(join(task.taskPath,'task.json'));
 const decisionPath=join(material,'decision-log.md'),specPath=join(material,'spec.md'),indexPath=join(material,'phases/index.md');
 const decision=read(decisionPath,true),spec=read(specPath,true),index=read(indexPath,true),facts=read(join(task.taskPath,'facts.jsonl'),true);
 // JSONL corruption is a real input error; the cursor is displayed, never changed here.
 const rows=facts===null?[]:readTaskFacts(task.taskPath);
 const factsPath=join(task.taskPath,'facts.jsonl'),factsHash=fingerprints[factsPath]??'missing';
 delete fingerprints[factsPath];
 const cursor=rows.find(row=>row.stage==='build-code')?.phase_progress;
 // These are the only fact fields consumed by the task-node display below.
 fingerprints.facts_cursor_sha256=hash(JSON.stringify({phase_id:cursor?.phase_id??null,task_id:cursor?.task_id??null}));
 const objects=[],phaseTasks={};
 const source=(path,loc)=>({name:relative(root,path)||path,path,loc});
 const metadata=join(task.taskPath,'task.json');
 function node(kind,title,path,loc,{missing=false,id,phase,summary}={}){
  const object={id:id??`${kind}-${objects.filter(o=>o.kind===kind).length+1}`,kind,title:short(title),short:short(title),label:short(title),summary:summary??short(title),src:[source(path??metadata,loc??KIND_SOURCES[kind])],status:{text:missing?'缺':kind==='pr'?'尚未产生；到 stage-close 后补':'有来源；结论见原件',tone:'unk'}};
  if(phase)object.phase=phase;objects.push(object);return object;
 }
 function section(kind,text,path,pattern){const match=text?.split('\n').find(line=>pattern.test(line));return node(kind,match??`缺：${KIND_SOURCES[kind]}`,text===null?metadata:path,match?short(match):`缺 ${KIND_SOURCES[kind]}`,{missing:!match});}
 const taskIndexPath=join(task.taskPath,'index.json'),taskIndex=read(taskIndexPath,true),routingOrigins=[];
 // Existing index bytes are navigation/provenance, not a second progress source.
 delete fingerprints[taskIndexPath];
 if(taskIndex!==null)routingOrigins.push(taskIndexPath);
 const initialRefs=qualityRefs([decision,taskIndex,JSON.stringify(manifest.inputs)].filter(Boolean).join('\n'));
 const rawRefs=new Set(initialRefs.filter(ref=>ref.startsWith('quality/evidence/raw-requirements/')));
 for(const ref of initialRefs.filter(ref=>/(?:^|\/)[^/]*index[^/]*\.(?:md|json)$/i.test(ref))) {
  const path=task.recordPath(ref),text=read(path,true);delete fingerprints[path];
  if(text!==null){routingOrigins.push(path);for(const raw of qualityRefs(text).filter(value=>value.startsWith('quality/evidence/raw-requirements/')))rawRefs.add(raw);}
 }
 const rawSources=[],rawGaps=[];
 for(const ref of rawRefs){const path=task.recordPath(ref),text=read(path,true);if(text===null||!text.trim()){rawGaps.push(`缺：${ref}`);continue;}rawSources.push({path,text});}
 const decisionRequirement=decision?.split('\n').find(line=>/U-\d+|原始需求|用户要求/.test(line));
 if(rawSources.length){const title=rawSources[0].text.split('\n').find(line=>line.trim()&&!/^\s*#/.test(line))??rawSources[0].text;const req=node('req',title,rawSources[0].path,'原始逐字需求');req.src=rawSources.map(entry=>source(entry.path,'原始逐字需求原件'));if(decision!==null)req.src.push(source(decisionPath,'当前需求与原始来源指针'));req.src.push(...routingOrigins.map(path=>source(path,'既有需求索引指针')));if(rawGaps.length)req.summary+=`；${rawGaps.join('；')}`;}
 else {const gap=rawGaps.length?rawGaps.join('；'):'缺：当前材料或既有索引指向的 quality/evidence/raw-requirements/ 原件';const req=node('req',decisionRequirement??'缺：原始需求原件',decisionRequirement?decisionPath:metadata,'原始需求来源缺口',{missing:true,summary:`${gap}${decisionRequirement?'；保留 decision-log 需求来源，原件未齐备':''}`});req.src.push(...routingOrigins.map(path=>source(path,'既有需求索引；原始原件未取得')));}
 section('dec',decision,decisionPath,/U-\d+|ADR-|决定|决策/);section('goal',decision,decisionPath,/目标|收敛/);section('wp',decision,decisionPath,/WP\d+|工作包/);
 section('spec',spec,specPath,/FR-|功能需求|实现设计/);section('acc',spec,specPath,/AC-[A-Za-z0-9-]+/);section('risk',spec??decision,spec===null?decisionPath:specPath,/风险|未决|OI-\d+/);
 function files(directory,{recursive=false}={}){
  let stat;try{stat=lstatSync(directory);}catch(error){if(error.code==='ENOENT')return [];throw error;}
  if(stat.isSymbolicLink()||!stat.isDirectory())throw Error(`source directory alias or non-directory rejected: ${directory}`);
  const actual=realpathSync(directory),rel=relative(task.taskPath,actual);
  if(actual!==resolve(directory)||rel==='..'||rel.startsWith(`..${sep}`)||isAbsolute(rel))throw Error(`source directory outside task scope or alias: ${directory}`);
  return readdirSync(directory,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(entry=>{const path=join(directory,entry.name);if(entry.isSymbolicLink())throw Error(`source alias rejected: ${path}`);return entry.isFile()?[path]:recursive&&entry.isDirectory()?files(path,{recursive}):[];});
 }
 const research=files(join(task.taskPath,'quality/evidence/research'),{recursive:true}).map(path=>({path,text:read(path)}));
 const internal=research.filter(entry=>!/external|外部/i.test(entry.path));
 if(internal.length){const object=node('ires',`内部调研：${internal.length} 份原件`,internal[0].path,'原始研究');object.src=internal.map(entry=>source(entry.path,'原件'));}
 else node('ires',`缺：${KIND_SOURCES.ires}`,metadata,`缺 ${KIND_SOURCES.ires}`,{missing:true});
 const external=research.flatMap(entry=>externalPointers(entry.text).map(url=>({path:entry.path,url})));
 if(!external.length)external.push(...externalPointers(spec,true).map(url=>({path:specPath,url})));
 if(external.length){const object=node('eres',`外部来源指针：${external[0].url}`,external[0].path,'外部来源指针',{summary:`${external.length} 个外部来源指针；本次未抓取、下载或验证外部原文。`});object.src=external.map(entry=>source(entry.path,`外部来源指针（未抓取）：${entry.url}`));}
 else node('eres','缺：可定位的外部来源指针',spec===null?metadata:specPath,'补充材料与研究原件未取得可定位的外部来源指针',{missing:true});
 const phasePaths=[...new Set([...index?.matchAll(/(?:\]\(|`)([^\s`|()]*P\d+[^\s`|()]*\.md)(?:\)|`)/g)??[]].map(m=>m[1]))];
 const declaredGates=new Set();
 for(const ref of phasePaths){const phaseRoot=join(material,'phases'),path=resolve(phaseRoot,ref.replace(/^phases\//,'')),rel=relative(phaseRoot,path);if(rel===''||rel==='..'||rel.startsWith(`..${sep}`)||isAbsolute(rel))throw Error('phase index path escapes phases');const text=read(path,true);if(text===null)continue;for(const match of text.matchAll(/\*\*(?:gate_cmd|RED\/GREEN 门禁命令)\*\*[:：]\s*`([^`]+)`/gu))declaredGates.add(match[1]);const p=node('phase',text.split('\n').find(l=>/^# /.test(l))??ref,path,'Phase 契约',{id:`phase-${objects.filter(o=>o.kind==='phase').length+1}`});phaseTasks[p.id]=[];for(const m of text.matchAll(/^###\s+(T\d+[^\n]*)/gm)){const t=node('task',m[1],path,m[1],{phase:p.id,summary:'阶段执行事实见 facts.jsonl；游标不证明完成'});const cursor=rows.find(r=>r.stage==='build-code')?.phase_progress;if(cursor?.task_id===/^T\d+/.exec(m[1])?.[0])t.status.text='当前游标；不证明完成';else t.status.text='任务完成结论未取得；见原件';phaseTasks[p.id].push(t.id);if(facts!==null)t.src.push(source(join(task.taskPath,'facts.jsonl'),'当前阶段事实'));}}
 if(!objects.some(o=>o.kind==='phase')){const p=node('phase','缺：Phase 卡',index===null?metadata:indexPath,'缺可读 Phase 卡',{missing:true});phaseTasks[p.id]=[];}
 if(!objects.some(o=>o.kind==='task'))node('task','缺：Task 卡',metadata,'缺 Task 卡',{missing:true});
 if(!manifest.baseline_commit||manifest.baseline_commit.startsWith('-'))throw Error('manifest baseline_commit is required for real diff');
 const env={...process.env,GIT_OPTIONAL_LOCKS:'0'};for(const key of Object.keys(env))if(key.startsWith('GIT_')&&key!=='GIT_OPTIONAL_LOCKS')delete env[key];
 const diff=execFileSync('git',['diff','--name-only','-z',`${manifest.baseline_commit}..HEAD`],{cwd:root,env,maxBuffer:16*1024*1024});fingerprints['git diff baseline..HEAD']=hash(diff);
 const changed=diff.toString('utf8').split('\0').filter(Boolean);for(const path of changed)node('file',path,existsSync(join(root,path))?join(root,path):metadata,`git diff --name-only -z ${manifest.baseline_commit}..HEAD；路径 ${path}${existsSync(join(root,path))?'':' 已删除，来源为真实 diff'}`);if(!changed.length)node('file','缺真实改动',metadata,'git diff baseline..HEAD 为空',{missing:true});
 const excludedCommandRefs=[];
 for(const [kind,dir] of [['test','quality/tests'],['review','quality/reviews']]) {
  const directory=join(task.taskPath,dir),candidates=files(directory).filter(path=>path.endsWith('.json')),entries=[];
  for(const path of candidates) {
   const record=JSON.parse(read(path));
   if(kind==='test'&&!isTestReceipt(record,declaredGates)){delete fingerprints[path];excludedCommandRefs.push(path);continue;}
   entries.push(path);
  }
  const coverage='仅计可识别测试运行器或当前材料 Phase 字面 gate；普通命令和未分类验证不计数，不据此声明完整测试或通过。';
  const o=entries.length
   ? node(kind,`${kind==='test'?'可识别测试执行':'审查'}：${entries.length} 份原件`,entries[0],'结果以原件为准',{summary:kind==='test'?coverage:undefined})
   : node(kind,kind==='test'?'缺：可识别测试结果':`缺：${dir}`,metadata,`缺 ${dir} 的可识别原件`,{missing:true,summary:kind==='test'?coverage:undefined});
  if(entries.length)o.src=entries.map(path=>source(path,'原始记录'));
  if(kind==='test'&&existsSync(directory))o.src.push(source(directory,'普通/未分类命令原件目录；未计入上述测试数，范围未完整判定'));
 }
 const ring10=report.rings.find(r=>r.ring===10);const pr=node('pr',ring10?`提交 PR：${ring10.state??'未取得'}`:'缺：报告第 10 环',resolve(reportPath),'rings[ring=10]',{missing:!ring10,summary:ring10?JSON.stringify(ring10):'缺第 10 环'});if(ring10)pr.status.text=ring10.state==='skipped'?'尚未产生；到 stage-close 后补':`报告：${ring10.state??'未取得'}`;
 const pageData={task:manifest.task_id,taskIdentity:`${manifest.project_name}/${manifest.task_id}`,stageLabel:'当前任务事实',sourceDir:material,stages:[{name:'当前任务',hint:'状态以材料和任务事实为准',state:'now'}],hasPhase:objects.some(o=>o.kind==='phase'),objects,edges:[],sideEdges:[],phaseTasks,progress:{reqIds:objects.filter(o=>o.kind==='req').map(o=>o.id),unlinkedTaskIds:objects.filter(o=>o.kind==='task'&&!o.phase).map(o=>o.id)},changedChips:[],initialChanged:[]};
 return {pageData,report,decisionLogPath:decisionPath,decisionMissing:decision===null,workspaceRoot:root,taskIdentity:task.identity,sourceFingerprint:fingerprints,factsProvenance:{ref:factsPath,sha256:factsHash},excludedCommandRefs,gaps:objects.filter(o=>o.status.text==='缺').map(o=>({kind:o.kind,reason:o.title})),factsRows:rows.length};
}
export async function main(argv=process.argv.slice(2)){if(argv.length!==4||argv[0]!=='--task-path'||argv[2]!=='--report')throw Error('usage: --task-path <absolute root> --report <report>');return buildPageData({taskPath:argv[1],reportPath:argv[3]});}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e.message);process.exitCode=1;});
