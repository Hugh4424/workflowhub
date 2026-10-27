#!/usr/bin/env node
import { readFileSync, readdirSync, lstatSync, existsSync, realpathSync } from 'node:fs';
import { join, resolve, relative, isAbsolute, basename, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { openTask } from '../../../runtime/task/task-handle.mjs';
import { openCurrentTaskWorkspace } from '../../../runtime/task/workspace.mjs';
import { readTaskFacts } from '../../../runtime/task/task-store.mjs';
import { validatePostPhaseContract } from '../../../runtime/stage/stage-content-contracts.mjs';
import { stageRuntimeCliMain } from '../../../tools/cli/stage-runtime.mjs';

export const KIND_SOURCES = Object.freeze({req:'decision-log.md / raw-requirements',spec:'spec.md',dec:'decision-log.md',goal:'decision-log.md',wp:'decision-log.md',ires:'quality/evidence/research',eres:'quality/evidence/research / spec.md',phase:'phases/index.md',task:'phases/P*.md / facts.jsonl',file:'git diff baseline_commit..HEAD',test:'quality/tests',review:'quality/reviews',acc:'spec.md / Appendix A',risk:'spec.md / decision-log.md',pr:'report / ring 10'});
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const short = text => text.replace(/^[#*\s-]+/u,'').replace(/\*\*/g,'').trim().slice(0,140);
const qualityRefs = text => [...new Set(((text??'').match(/quality\/evidence\/[^\s`"'<>|；:：，。)\]]+/g)??[]).map(ref=>ref.split('#')[0].replace(/[.;]+$/u,'')))];

// Presentation-only readers for the existing documents, not a public material parser.
function sections(text, level) {
 const rows=(text??'').split('\n'),result=[];let active=null,fenced=false;
 rows.forEach((line,index)=>{if(/^\s*```/.test(line)){fenced=!fenced;if(active)active.lines.push(line);return;}if(fenced){if(active)active.lines.push(line);return;}const h=/^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);if(h&&h[1].length<=level)active=null;if(h&&h[1].length===level){active={heading:h[2],line:index+1,lines:[]};result.push(active);}else if(active)active.lines.push(line);});
 return result.map(({lines,...section})=>({...section,body:lines.join('\n')}));
}
function fields(body){const result={};let key;for(const line of (body??'').split('\n')){const m=/^\s*-\s*\*\*([^*]+)\*\*[:：]\s*(.*)$/.exec(line);if(m){key=m[1];result[key]=m[2];}else if(/^#/.test(line)){key=undefined;}else if(key){if(key==='动作'||key==='Action')result[key]+='\n'+line;else if(line.trim())result[key]+=' '+line.trim();}}return result;}
const cells=line=>line.trim().replace(/^\||\|$/g,'').split('|').map(value=>value.trim().replace(/`/g,''));
const ids=(text,pattern)=>[...new Set((text??'').match(pattern)??[])];
// A collection reference is meaningful only when its stated quantity matches the sourced set.
function declaresPackageSet(text,count){
 if(/(?:全部|所有)工作包/.test(text))return true;
 const token=/(\d+|[一二两三四五六七八九十]+)个工作包/.exec(text)?.[1];if(!token)return false;
 const digit=value=>({一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9}[value]);
 const number=/^\d+$/.test(token)?Number(token):token.includes('十')?((digit(token.split('十')[0])??1)*10+(digit(token.split('十')[1])??0)):digit(token);
 return number===count;
}
function bullets(text){
 const lines=(text??'').split(/\n|(?=\d+[）)])/u),numbered=lines.some(line=>/^\s*\d+[）)]/.test(line));
 if(!numbered)return (text??'').trim().split(/\n\s*\n/)[0].split('\n').filter(line=>!/^\s*[|#]/.test(line)).map(line=>line.replace(/^\s*[-*]\s*/,'').trim()).filter(Boolean);
 const steps=[];let continuing=false;
 for(const line of lines){const value=line.trim();if(/^\d+[）)]/.test(value)){steps.push(value);continuing=true;}else if(!value||/^[|#]/.test(value)||/^(?:附件|说明)[：:]/.test(value)){continuing=false;}else if(continuing)steps[steps.length-1]+=' '+value;}
 return steps;
}

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
 const positionRow=rows.find(row=>row.phase_progress||row.handoff||row.close_action),cursor=rows.find(row=>row.stage==='build-code')?.phase_progress;
 // These are the only fact fields consumed by the task-node display below.
 fingerprints.facts_cursor_sha256=hash(JSON.stringify({phase_id:cursor?.phase_id??null,task_id:cursor?.task_id??null,stage:positionRow?.stage??null}));
 const objects=[],phaseTasks={};
 const source=(path,loc)=>({kind:path.endsWith('task.json')?'任务元数据':path.endsWith('facts.jsonl')?'任务事实':path.includes(`${sep}raw-requirements${sep}`)?'原始需求':path.includes(`${sep}quality${sep}tests`)?'测试记录':path.includes(`${sep}quality${sep}reviews`)?'审查记录':path.includes(`${sep}quality${sep}evidence${sep}research`)?'调研原件':path===resolve(reportPath)?'十环报告':'任务材料',name:relative(root,path)||path,path,loc});
 const metadata=join(task.taskPath,'task.json');
 function node(kind,title,path,loc,{missing=false,id,phase,summary}={}){
  const object={id:id??`${kind}-${objects.filter(o=>o.kind===kind).length+1}`,kind,title:title.replace(/^\s*#{1,6}\s+/u,'').trim(),short:short(title),label:short(title),summary:summary??short(title),src:[source(path??metadata,loc??KIND_SOURCES[kind])],status:{text:missing?'缺':kind==='pr'?'尚未产生':kind==='file'?'真实改动':'未判定',tone:'unk'}};
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
 const routingTexts=routingOrigins.map(path=>({path,text:read(path,true)})).filter(entry=>entry.text!==null);
 const requirementIndex=routingTexts.find(entry=>/后建索引编号/.test(entry.text));
 const rawReference=locator=>{
  const refs=qualityRefs(locator).filter(ref=>ref.startsWith('quality/evidence/raw-requirements/'));
  const raw=refs.length===1?rawSources.find(entry=>entry.path===task.recordPath(refs[0])):refs.length===0&&rawSources.length===1?rawSources[0]:undefined;
  const lineNumber=Number(/(?:原件[:：]|#L|:)(\d+)/.exec(locator)?.[1]);
  const quote=raw&&lineNumber?raw.text.split('\n')[lineNumber-1]:undefined;
  return {raw,lineNumber,quote};
 };
 const requirementAliases=new Map();
 if(requirementIndex){
  let table='';for(const [lineIndex,line]of requirementIndex.text.split('\n').entries()){
   if(!/^\s*\|/.test(line)){table='';continue;}const row=cells(line);
   if(row[0]==='后建索引编号'){table='requirements';continue;}if(row[0]==='最初主文编号'){table='aliases';continue;}
   if(!/^R-\d{3}[a-z]*$/.test(row[0]))continue;
   if(table==='aliases'){requirementAliases.set(row[0],ids(row[2].split('；')[0],/R-\d{3}[a-z]*\b/g));continue;}
   if(table!=='requirements')continue;
   const sourceId='后建索引 '+row[0];if(objects.some(o=>o.source_id===sourceId))throw Error('duplicate requirement identity: '+sourceId);
   const {raw,lineNumber,quote}=rawReference(row[2]);
   const req=node('req',row[1],raw?.path??metadata,raw?`line:${lineNumber}`:'原话来源未明确或未取得',{missing:!quote,id:'req-index-'+row[0],summary:row[1]});
   Object.assign(req,{source_id:sourceId,label:sourceId,short:sourceId+' · '+short(row[1]),quote:quote??'',source:raw?'用户原始需求':'原件未取得',declared_wp_ids:ids(row[3],/WP\d+/g),aliases:[...requirementAliases].filter(([,targets])=>targets.includes(row[0])).map(([alias])=>'v1主文 '+alias)});
   req.src=[...(raw?[source(raw.path,`line:${lineNumber}；逐字原话`)]:[source(metadata,'原话来源未明确或未取得')]),source(requirementIndex.path,`line:${lineIndex+1}；${sourceId} 摘要（非逐字）`)];
  }
  // The alias table follows the primary table; resolve only its explicit crosswalk.
  for(const req of objects.filter(o=>o.kind==='req'))req.aliases=[...requirementAliases].filter(([,targets])=>targets.includes(req.source_id.replace('后建索引 ',''))).map(([alias])=>'v1主文 '+alias);
 }
 if(!requirementIndex){
  const requirements=sections(decision,2).find(block=>block.heading==='原始需求');
  for(const [offset,line]of (requirements?.body??'').split('\n').entries()){
   if(!/^\s*\|/.test(line))continue;const row=cells(line);if(!/^R-\d{3}[a-z]*$/.test(row[0])||row.length<4)continue;
   const {raw,lineNumber,quote}=rawReference(row[2]),req=node('req',row[1],raw?.path??decisionPath,raw?`line:${lineNumber}`:'原话来源未明确或未取得',{id:'req-'+row[0],missing:!quote,summary:row[1]});
   Object.assign(req,{source_id:row[0],label:row[0],quote:quote??'',source:quote?'用户原始需求':'原话未取得',declared_wp_ids:ids(row[3],/WP\d+/g)});
   req.src=[source(decisionPath,`line:${requirements.line+offset+1}；${row[0]} 来源与落点`),...(raw?[source(raw.path,`line:${lineNumber}；逐字原话`)]:[])];
  }
 }
 if(!objects.some(o=>o.kind==='req')){
  const raw=rawSources.length===1?rawSources[0]:undefined,title=raw?.text.split('\n').find(line=>line.trim()&&!/^\s*[#>]/.test(line));
  const req=node('req',title??decisionRequirement??'原始需求未取得',raw?.path??(decisionRequirement?decisionPath:metadata),raw?'原始逐字需求':'原始需求来源缺口',{missing:!raw,id:'req-1',summary:raw?title:'缺 quality/evidence/raw-requirements 原件'});
  Object.assign(req,{quote:title??'',source:raw?'用户原始需求':'原件未取得'});req.src.push(...routingOrigins.map(path=>source(path,'既有需求索引指针')));
 }
 const packages=[];
 for(const block of sections(decision,3).filter(block=>/^WP\d+\s+[—–-]\s+/.test(block.heading))){
  const sourceId=/^WP\d+/.exec(block.heading)[0];if(packages.some(o=>o.source_id===sourceId))throw Error('duplicate work package: '+sourceId);
  const f=fields(block.body),wp=node('wp',block.heading.replace(/^WP\d+\s+[—–-]\s+/,''),decisionPath,`line:${block.line}；${sourceId}`,{id:'wp-'+sourceId,summary:f['目标']??''});
  Object.assign(wp,{source_id:sourceId,items:[f['边界'],f['已定做法']].filter(Boolean),goal:f['目标']??'',boundary:f['边界']??'',planSummary:f['已定做法']??'',adopted_refs:qualityRefs(block.body)});packages.push(wp);
  if(f['目标']){const goal=node('goal',f['目标'],decisionPath,`line:${block.line}；${sourceId} 目标`,{id:'goal-'+sourceId});goal.owner=wp.id;}
  if(f['已定做法']){const dec=node('dec',sourceId+' 已定做法',decisionPath,`line:${block.line}；${sourceId} 已定做法`,{id:'dec-'+sourceId});Object.assign(dec,{owner:wp.id,detail:f['已定做法'],why:f['理由']??'',summary:f['已定做法']});}
 }
 // Only explicit selected-decision originals supply named decisions and their affected packages.
 for(const ref of initialRefs.filter(ref=>/requirement-change-log.*\.md$/.test(ref))){
  const path=task.recordPath(ref),text=read(path,true);if(text===null)continue;
  for(const block of sections(text,2).filter(block=>/^U-\d+.*选定/.test(block.heading))){
   const sourceId=/^U-\d+/.exec(block.heading)[0],affected=/^受影响[：:]([^\n]+)/m.exec(block.body)?.[1]??'',owners=packages.filter(wp=>ids(affected,/WP\d+/g).includes(wp.source_id));
   const selected=[...block.body.matchAll(/^>\s*(.+)$/gm)].map(match=>match[1]);if(!selected.length||!owners.length)continue;
   const detail=/^真实处置[：:]([^\n]+)/m.exec(block.body)?.[1]??'';
   const dec=node('dec',block.heading,path,`line:${block.line}；${/问题原文未取得/.test(block.body)?'问题原文未取得；':''}选中项逐字`,{id:'dec-'+sourceId,summary:detail});
   Object.assign(dec,{source_id:sourceId,items:selected,detail,why:'',owners:owners.map(wp=>wp.id)});
  }
 }
 if(!packages.length){const wp=section('wp',decision,decisionPath,/^#{1,3}\s+WP\d+\b/);packages.push(wp);section('goal',decision,decisionPath,/^#{1,3}\s+目标/);section('dec',decision,decisionPath,/U-\d+|ADR-|决定|决策/);}
 if(!objects.some(o=>o.kind==='goal'))node('goal','目标未取得',decision===null?metadata:decisionPath,'缺工作包目标正文',{missing:true});
 if(!objects.some(o=>o.kind==='dec'))node('dec','决定未取得',decision===null?metadata:decisionPath,'缺工作包决定正文',{missing:true});
 for(const block of sections(spec,3)){
  const match=/^(FR-[A-Z0-9-]+)(?:\b|[：:])/.exec(block.heading);if(match){const o=node('spec',block.heading.replace(/^FR-[A-Z0-9-]+\s*[—–:：-]?\s*/,''),specPath,`line:${block.line}；${match[1]}`,{id:'spec-'+match[1],summary:short(block.body)});o.source_id=match[1];}
 }
 // FR definitions in this repository are list items, not table references.
 for(const [i,line]of (spec??'').split('\n').entries()){
  const m=/^\s*-\s*(?:\[.\]\s*)?\*\*(FR-[A-Z0-9-]+)\*\*[:：]\s*(.+)/.exec(line);
  if(m&&!objects.some(o=>o.source_id===m[1])){const o=node('spec',m[2],specPath,`line:${i+1}；${m[1]}`,{id:'spec-'+m[1]});o.source_id=m[1];}
 }
 const appendix=sections(spec,2).filter(block=>/Appendix A|验收标准|验收判据/.test(block.heading));
 for(const block of appendix)for(const [i,line]of block.body.split('\n').entries()){
  const m=/^\s*-\s*\[([ xX])\]\s*\*\*(AC-[A-Z0-9-]+)\*\*[:：]\s*(.+)/.exec(line);if(!m||objects.some(o=>o.source_id===m[2]))continue;
  const acc=node('acc',m[3],specPath,`line:${block.line+i+1}；${m[2]}`,{id:'acc-'+m[2],summary:'判定见原验收记录'});acc.source_id=m[2];acc.status.text=m[1].toLowerCase()==='x'?'材料勾选；待核证据':'未取得判定';
 }
 if(!objects.some(o=>o.kind==='spec'))node('spec','规格未取得',spec===null?metadata:specPath,'缺功能需求权威正文',{missing:true});
 if(!objects.some(o=>o.kind==='acc'))node('acc','验收条目未取得',spec===null?metadata:specPath,'缺Appendix A验收正文',{missing:true});
 const riskSection=sections(spec,2).find(block=>/风险、未决|风险与未决/.test(block.heading));
 const riskLines=(riskSection?.body??'').split('\n');
 for(let i=0;i<riskLines.length;i++){
  const m=/^-\s*\*\*((?:RISK|OPEN)-\d+)\*\*[:：]\s*(.+)/.exec(riskLines[i]);if(!m)continue;
  let end=i+1;while(end<riskLines.length&&!/^-\s*\*\*(?:RISK|OPEN)-/.test(riskLines[end]))end++;
  const f=fields(riskLines.slice(i+1,end).join('\n')),o=node('risk',m[2],specPath,`line:${riskSection.line+i+1}；${m[1]}`,{id:'risk-'+m[1],summary:f['触发条件']??f['影响']??'触发条件未取得'});Object.assign(o,{source_id:m[1],ac_ids:ids(f['受影响 ID'],/AC-[A-Z0-9-]+/g),details:f});
 }
 const issues=sections(decision,2).find(block=>/^未决项$/.test(block.heading));
 for(const line of (issues?.body??'').split('\n')){if(!/^\s*\|\s*OI-\d+/.test(line))continue;const row=cells(line),o=node('risk',row[1],decisionPath,row[0],{id:'risk-'+row[0],summary:row[2]});Object.assign(o,{source_id:row[0],source_state:row[2],related_wp_ids:ids(row.slice(1).join(' '),/WP\d+/g)});o.status.text=/^(?:open|closed|confirmed)(?:（[^）]*）)?/.exec(row[2])?.[0]??'原状态未取得';}
 if(!objects.some(o=>o.kind==='risk'))node('risk','风险原件待查',spec===null?metadata:specPath,'风险与未决节',{missing:!riskSection,summary:riskSection?'风险与未决条目见原件':'风险原件未取得'});
 function files(directory,{recursive=false}={}){
  let stat;try{stat=lstatSync(directory);}catch(error){if(error.code==='ENOENT')return [];throw error;}
  if(stat.isSymbolicLink()||!stat.isDirectory())throw Error(`source directory alias or non-directory rejected: ${directory}`);
  const actual=realpathSync(directory),rel=relative(task.taskPath,actual);
  if(actual!==resolve(directory)||rel==='..'||rel.startsWith(`..${sep}`)||isAbsolute(rel))throw Error(`source directory outside task scope or alias: ${directory}`);
  return readdirSync(directory,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(entry=>{const path=join(directory,entry.name);if(entry.isSymbolicLink())throw Error(`source alias rejected: ${path}`);return entry.isFile()?[path]:recursive&&entry.isDirectory()?files(path,{recursive}):[];});
 }
 const research=files(join(task.taskPath,'quality/evidence/research'),{recursive:true}).map(path=>({path,text:read(path)}));
 const researchTitle=entry=>entry.text.split('\n').find(line=>/^#\s+/.test(line))?.replace(/^#\s+/,'')??basename(entry.path);
 const finding=entry=>sections(entry.text,2).find(block=>/^(?:结论|调研结论|研究结论|关键发现)(?:\s|$)/.test(block.heading))?.body.trim()??'';
 for(const entry of research.filter(entry=>!/external|外部/i.test(entry.path))){const o=node('ires',researchTitle(entry),entry.path,'研究原件',{summary:finding(entry)?short(finding(entry)):'结论未取得'});Object.assign(o,{finding:finding(entry),origin:basename(entry.path),record_ref:entry.path});}
 if(!objects.some(o=>o.kind==='ires'))node('ires','内部调研未取得',metadata,'缺内部研究原件',{missing:true});
 const external=research.map(entry=>({...entry,urls:externalPointers(entry.text)})).filter(entry=>entry.urls.length);
 for(const entry of external){const o=node('eres',researchTitle(entry),entry.path,'外部来源指针',{summary:`${entry.urls.length} 个来源指针；未抓取外部原文`});Object.assign(o,{finding:finding(entry),origin:'本地研究原件；外部原文未抓取',record_ref:entry.path});o.src=entry.urls.map(url=>source(entry.path,`外部来源指针（未抓取）：${url}`));}
 if(!objects.some(o=>o.kind==='eres')){const urls=externalPointers(spec,true);if(urls.length){const o=node('eres','规格补充材料',specPath,'补充材料外部指针',{summary:urls[0]+'；未抓取原文'});o.src=urls.map(url=>source(specPath,`外部来源指针（未抓取）：${url}`));}else node('eres','外部来源未取得',spec===null?metadata:specPath,'缺可定位的外部来源指针',{missing:true});}
 const phasePaths=[...new Set([...index?.matchAll(/(?:\]\(|`)([^\s`|()]*P\d+[^\s`|()]*\.md)(?:\)|`)/g)??[]].map(m=>m[1]))];
 const declaredGates=new Set(),phaseInputs={};
 for(const ref of phasePaths){const phaseRoot=join(material,'phases'),path=resolve(phaseRoot,ref.replace(/^phases\//,'')),rel=relative(phaseRoot,path);if(rel===''||rel==='..'||rel.startsWith(`..${sep}`)||isAbsolute(rel))throw Error('phase index path escapes phases');const text=read(path,true);if(text!==null)phaseInputs['phases/'+rel.split(sep).join('/')]=text;}
 // Candidate bytes are not identities. The existing contract reader selects indexed paths/IDs.
 const phaseDirectory=join(material,'phases');
 if(existsSync(phaseDirectory)){
  const stat=lstatSync(phaseDirectory);if(!stat.isDirectory()||stat.isSymbolicLink()||realpathSync(phaseDirectory)!==phaseDirectory)throw Error('phase source directory alias rejected');
  for(const name of readdirSync(phaseDirectory).filter(name=>/^P\d+[^/\\]*\.md$/.test(name))){const ref='phases/'+name;if(!Object.hasOwn(phaseInputs,ref))phaseInputs[ref]=read(join(phaseDirectory,name));}
 }
 const contract=validatePostPhaseContract({spec:spec??'',index:index??'',phases:phaseInputs});
 const phaseRows=contract.facts?.phase_rows??[],phaseRecords=new Map(),phaseCommits=new Map(),acceptanceClaims=new Map();
 const committed=commit=>{if(!/^[a-f0-9]{40}$/i.test(commit??''))return false;try{execFileSync('git',['merge-base','--is-ancestor',commit,'HEAD'],{cwd:root,stdio:'ignore'});return true;}catch{return false;}};
 for(const row of phaseRows){
  const text=phaseInputs[row.path],path=join(material,row.path);if(!text)continue;
  for(const match of text.matchAll(/\*\*(?:gate_cmd|RED\/GREEN 门禁命令)\*\*[:：]\s*`([^`]+)`/gu))declaredGates.add(match[1]);
  const evidenceRef=/^\s*-\s*\*\*evidence_path\*\*[:：]\s*`([^`]+)`/m.exec(text)?.[1];
  if(evidenceRef?.startsWith('quality/')&&evidenceRef.endsWith('.json')){const evidencePath=task.recordPath(evidenceRef),raw=read(evidencePath,true);delete fingerprints[evidencePath];if(raw!==null){const record=JSON.parse(raw);if((record.phase_id??record.phase)===row.id){phaseRecords.set(row.id,{record,path:evidencePath});for(const claim of Array.isArray(record.acceptance)?record.acceptance:Array.isArray(record.ac_results)?record.ac_results:[]){const ac=claim.ac??claim.id,tier=claim.tier??claim.result;if(ac&&typeof tier==='string'){const list=acceptanceClaims.get(ac)??[];list.push({tier,path:evidencePath});acceptanceClaims.set(ac,list);}}}}}
  const header=text.split('\n').find(line=>/^# /.test(line))??row.id,p=node('phase',header,path,'Phase '+row.id,{id:'phase-'+row.id,summary:'契约原件'});p.source_id=row.id;p.label=row.id;phaseTasks[p.id]=[];
  const l1=sections(text,2).find(block=>/^L1\b/.test(block.heading));
  for(const block of sections(l1?.body??text,3).filter(block=>/^T\d{3,}\s+[—–-]\s+\S/.test(block.heading))){
   const taskId=/^T\d{3,}/.exec(block.heading)[0];if(row.task_ids&&!row.task_ids.includes(taskId))continue;if(objects.some(o=>o.kind==='task'&&o.source_id===taskId))throw Error('duplicate strict Task identity: '+taskId);
   const f=fields(block.body),action=f['动作']??f.Action??'',t=node('task',block.heading.replace(/^T\d{3,}\s+[—–-]\s+/,''),path,'### '+block.heading,{id:'task-'+taskId,phase:p.id,summary:action||'任务正文未取得'});
   Object.assign(t,{source_id:taskId,label:taskId,goal:f['目标']??f.Goal??'',items:bullets(action),plan:ids(f['文件 / 符号']??f['Files / symbols'],/[\p{L}\p{N}_.-]+(?:\/[\p{L}\p{N}_.-]+)*\.[A-Za-z0-9]+/gu),fr_ids:ids(f['来源 / FR / AC']??f['Source / FR / AC'],/FR-[A-Z0-9-]+/g),ac_ids:ids(f['来源 / FR / AC']??f['Source / FR / AC'],/AC-[A-Z0-9-]+/g),gate_commands:[...block.body.matchAll(/\*\*(?:RED\/GREEN 门禁命令|RED\/GREEN gate_cmd)\*\*[:：]\s*`([^`]+)`/g)].map(m=>m[1])});
   t.status.text=cursor?.task_id===taskId&&cursor?.phase_id===row.id?'当前游标':'结果未取得';phaseTasks[p.id].push(t.id);if(facts!==null)t.src.push(source(join(task.taskPath,'facts.jsonl'),'当前游标；不证明完成'));
  }
 }
 if(!objects.some(o=>o.kind==='phase')){const p=node('phase','缺：Phase 卡',index===null?metadata:indexPath,'缺可读 Phase 卡',{missing:true});phaseTasks[p.id]=[];}
 if(!objects.some(o=>o.kind==='task'))node('task','缺：Task 卡',metadata,'缺 Task 卡',{missing:true});
 if(!manifest.baseline_commit||manifest.baseline_commit.startsWith('-'))throw Error('manifest baseline_commit is required for real diff');
 const env={...process.env,GIT_OPTIONAL_LOCKS:'0'};for(const key of Object.keys(env))if(key.startsWith('GIT_')&&key!=='GIT_OPTIONAL_LOCKS')delete env[key];
 const diff=execFileSync('git',['diff','--name-only','-z',`${manifest.baseline_commit}..HEAD`],{cwd:root,env,maxBuffer:16*1024*1024});fingerprints['git diff baseline..HEAD']=hash(diff);
 const changed=diff.toString('utf8').split('\0').filter(Boolean);for(const path of changed)node('file',path,existsSync(join(root,path))?join(root,path):metadata,`git diff --name-only -z ${manifest.baseline_commit}..HEAD；路径 ${path}${existsSync(join(root,path))?'':' 已删除，来源为真实 diff'}`);if(!changed.length)node('file','缺真实改动',metadata,'git diff baseline..HEAD 为空',{missing:true});
 const excludedCommandRefs=[];
 for(const [kind,dir] of [['test','quality/tests'],['review','quality/reviews']]) {
  const directory=join(task.taskPath,dir),candidates=files(directory).filter(path=>path.endsWith('.json'));let count=0;
  for(const path of candidates){
   const record=JSON.parse(read(path));
   if(kind==='test'&&record.exit_code===0&&!record.truncated&&typeof record.cwd==='string'&&resolve(record.cwd)===root&&Array.isArray(record.argv)&&/^(?:.*\/)?git$/.test(record.argv[0])){
    let commit=record.argv.includes('diff-tree')?record.argv.find(arg=>/^[a-f0-9]{40}$/i.test(arg)):undefined;
    if(record.argv[1]==='commit'&&record.output_ref){const ref=isAbsolute(record.output_ref)?relative(task.taskPath,record.output_ref).split(sep).join('/'):record.output_ref,output=task.readRecordBytes(ref).toString('utf8'),abbreviated=/^\[[^\n]* ([a-f0-9]{7,40})\]/m.exec(output)?.[1];if(abbreviated){try{commit=execFileSync('git',['rev-parse','--verify',abbreviated+'^{commit}'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{}}}
    if(committed(commit)){const changed=execFileSync('git',['diff-tree','--no-commit-id','--name-only','-z','-r',commit],{cwd:root}).toString().split('\0'),touched=phaseRows.filter(row=>changed.includes(relative(root,join(material,row.path)).split(sep).join('/')));if(touched.length===1&&!phaseCommits.has(touched[0].id))phaseCommits.set(touched[0].id,{commit,path});}
   }
   if(kind==='test'&&!isTestReceipt(record,declaredGates)){delete fingerprints[path];excludedCommandRefs.push(path);continue;}count++;
   if(kind==='test'){
    const command=record.argv.join(' '),o=node('test',command,path,'原始执行回执',{id:'test-'+hash(path).slice(0,16),summary:`退出 ${record.exit_code}；${record.timed_out?'超时；':''}${record.cancelled?'已取消；':''}原始执行记录；未分类原件另存`});
    o.src.push(source(directory,'普通/未分类命令原件目录；不计作上述测试结果'));
    Object.assign(o,{exit:record.exit_code,explain:`退出 ${record.exit_code}`,command,record_ref:path});o.status={text:'退出 '+record.exit_code,tone:record.exit_code===0?'ok':'fail'};
    if(record.output_ref){const ref=isAbsolute(record.output_ref)?relative(task.taskPath,record.output_ref):record.output_ref;if(ref!==''&&ref!=='..'&&!ref.startsWith(`..${sep}`)&&!isAbsolute(ref)){const outputPath=task.recordPath(ref.split(sep).join('/'));try{task.readRecordBytes(ref.split(sep).join('/'));o.src.push(source(outputPath,'原始命令输出'));}catch(error){if(error.code!=='ENOENT')throw error;o.summary+='；原输出未取得';}}}
   }else{
    const providerRows=Array.isArray(record.provider_results)?record.provider_results:[],summary=providerRows.length?providerRows.map(p=>`${p.provider??p.id??'provider'}：${p.status??'状态未取得'}`).join('；'):`原始记录：${record.status??'状态未取得'}`;
    const o=node('review',`${record.phase_id??''} ${record.review_kind??'审查'} · ${basename(path)}`.trim(),path,'原始审查记录',{id:'review-'+hash(path).slice(0,16),summary});o.record_ref=path;o.status.text=record.status??'状态未取得';if(record.phase_id)o.context_phase='phase-'+record.phase_id;
   }
  }
  if(!count)node(kind,kind==='test'?'测试执行未取得':'审查记录未取得',metadata,`缺 ${dir} 可识别原件`,{missing:true});
 }
 const ring10=report.rings.find(r=>r.ring===10);const pr=node('pr',ring10?`提交 PR：${ring10.state??'未取得'}`:'缺：报告第 10 环',resolve(reportPath),'rings[ring=10]',{missing:!ring10,summary:ring10?'报告原件第10环':'缺第 10 环'});if(ring10)pr.status.text=ring10.state==='skipped'?'尚未产生；到 stage-close 后补':`报告：${ring10.state??'未取得'}`;
 const edges=[],sideEdges=[];
 const edge=(list,a,b)=>{if(a&&b&&a!==b&&!list.some(pair=>pair[0]===a&&pair[1]===b))list.push([a,b]);};
 const criterionIds=text=>{const found=ids(text,/AC-[A-Z]+-\d{3}/g);for(const m of (text??'').matchAll(/(AC-[A-Z]+-)(\d{3})\s*至\s*\1(\d{3})/g)){const first=Number(m[2]),last=Number(m[3]);if(last-first<100&&last>=first)for(let n=first;n<=last;n++)found.push(m[1]+String(n).padStart(3,'0'));}return [...new Set(found)];};
 const wpMappings=sections(spec,3).filter(block=>/^\s*\|\s*WP\d+\b.*AC-[A-Z]+-\d{3}/m.test(block.body));
 for(const req of objects.filter(o=>o.kind==='req'))for(const wpId of req.declared_wp_ids??[]){const wp=packages.find(o=>o.source_id===wpId);if(wp)edge(edges,req.id,wp.id);else{req.status.text=req.status.text==='缺'?'缺':'归属未取得';req.unresolved_refs=[...(req.unresolved_refs??[]),wpId];}}
 for(const line of wpMappings.flatMap(block=>block.body.split('\n'))){if(!/^\s*\|\s*WP\d+\b/.test(line))continue;const row=cells(line),wp=packages.find(o=>o.source_id===/^WP\d+/.exec(row[0])?.[0]);if(!wp)continue;const acs=criterionIds(row[1]);wp.ac_ids=acs;wp.src.push(source(specPath,`${wp.source_id} → ${acs.join('、')} 显式映射`));for(const t of objects.filter(o=>o.kind==='task'&&o.ac_ids?.some(id=>acs.includes(id))))edge(edges,wp.id,t.id);for(const a of objects.filter(o=>o.kind==='acc'&&acs.includes(o.source_id))){a.owners=[...(a.owners??[]),wp.id];}}
 for(const o of objects.filter(o=>['goal','dec'].includes(o.kind)))for(const owner of o.owners??(o.owner?[o.owner]:[]))edge(sideEdges,o.id,owner);
 for(const line of (decision??'').split('\n')){if(!/^\s*\|\s*v1主文 R-\d{3}[a-z]*\b/.test(line))continue;const row=cells(line),alias=/R-\d{3}[a-z]*\b/.exec(row[0])?.[0],reqs=objects.filter(o=>o.kind==='req'&&o.aliases?.includes('v1主文 '+alias));for(const req of reqs){req.src.push(source(decisionPath,`v1主文 ${alias} → ${row.at(-1)} 来源对照`));const landing=row.at(-1),collection=declaresPackageSet(landing,packages.length)?packages.map(wp=>wp.source_id):[];for(const wpId of [...ids(landing,/WP\d+/g),...collection])edge(edges,req.id,packages.find(o=>o.source_id===wpId)?.id);}}
 for(const t of objects.filter(o=>o.kind==='task')){
  for(const o of objects.filter(o=>o.kind==='spec'&&t.fr_ids?.includes(o.source_id)))edge(edges,o.id,t.id);
  for(const o of objects.filter(o=>o.kind==='acc'&&t.ac_ids?.includes(o.source_id)))edge(edges,t.id,o.id);
 }
 for(const wp of packages)for(const research of objects.filter(o=>['ires','eres'].includes(o.kind)&&o.record_ref&&(wp.adopted_refs??[]).includes(relative(task.taskPath,o.record_ref).split(sep).join('/'))))edge(sideEdges,research.id,wp.id);
 for(const t of objects.filter(o=>o.kind==='task'))for(const test of objects.filter(o=>o.kind==='test'&&o.command&&t.gate_commands?.includes(o.command)))edge(edges,t.id,test.id);
 for(const risk of objects.filter(o=>o.kind==='risk'))risk.owners=[...packages.filter(wp=>(risk.related_wp_ids??[]).includes(wp.source_id)||risk.ac_ids?.some(id=>wp.ac_ids?.includes(id))).map(o=>o.id),...objects.filter(o=>o.kind==='task'&&risk.ac_ids?.some(id=>o.ac_ids?.includes(id))).map(o=>o.id)];
 // Existing declared originals supply claims, not a new mandatory Phase manifest protocol.
 const acceptanceFor=acIds=>{const claims=(acIds??[]).flatMap(ac=>acceptanceClaims.get(ac)??[]),covered=(acIds??[]).filter(ac=>acceptanceClaims.has(ac));if(!claims.length)return {text:'验收结论未记录',tone:'unk'};const conflict=(acIds??[]).some(ac=>new Set((acceptanceClaims.get(ac)??[]).map(c=>c.tier)).size>1);if(conflict)return {text:'验收记录不一致',tone:'fail',claims};if(covered.length===(acIds??[]).length&&claims.every(c=>c.tier==='pass'))return {text:'验收通过（原件）',tone:'ok',claims};return {text:'验收待完成（原件：'+[...new Set(claims.map(c=>c.tier))].join('、')+'）',tone:'unk',claims};};
 for(const t of objects.filter(o=>o.kind==='task'&&o.source_id)){
  const phase=objects.find(o=>o.id===t.phase),entry=phaseRecords.get(phase?.source_id),record=entry?.record,commits=(record?.diffs??[]).map(d=>d.reviewed_head??d.commit??d.head).filter(committed),taskClaim=record?.task_ids?.includes(t.source_id)&&commits.length,phaseProof=phaseCommits.get(phase?.source_id),current=cursor?.task_id===t.source_id&&cursor?.phase_id===phase?.source_id;
  const text=taskClaim?'已交付（具名记录）':phaseProof?'已提交（Phase范围）':current?'当前游标（执行位置）':'实施结论未记录',acceptance=acceptanceFor(t.ac_ids);
  t.implementation={text,scope:taskClaim?'Task':phaseProof?'Phase':'position',...(taskClaim?{commit:commits.at(-1)}:phaseProof?{commit:phaseProof.commit}:{})};t.acceptance={text:acceptance.text};t.status={text:text+' · '+acceptance.text,tone:current?'accent':acceptance.tone};
  if(entry)t.src.push(source(entry.path,'已记录的实施/验收结论；不从测试exit推断'));if(phaseProof)t.src.push(source(phaseProof.path,'真实Phase交付提交；不代Task逐项验收'));
 }
 for(const wp of packages){if(wp.status.text==='缺')continue;const a=acceptanceFor(wp.ac_ids);wp.status={text:(wp.planSummary?'方案已定':'工作包已记录')+' · '+a.text,tone:a.tone};for(const path of new Set((a.claims??[]).map(c=>c.path)))wp.src.push(source(path,'显式AC的既有验收结论'));}
 for(const req of objects.filter(o=>o.kind==='req'&&o.status.text!=='缺'))req.status={text:'需求已记录'+(req.unresolved_refs?.length?' · 归属未取得：'+req.unresolved_refs.join('、'):''),tone:'unk'};
 fingerprints.phase_statuses_sha256=hash(JSON.stringify(objects.filter(o=>['req','wp','task'].includes(o.kind)).map(o=>({id:o.id,status:o.status,implementation:o.implementation,acceptance:o.acceptance}))));
 const linked=new Set([...edges,...sideEdges].flat());for(const o of objects)if(!linked.has(o.id)&&!o.owners?.length&&!['req','wp','task','phase'].includes(o.kind))o.scope='task';
 const businessTitle=/^- \*\*功能名\*\*[:：]\s*(.+)$/m.exec(spec??'')?.[1]??/^#\s+(?:功能规格[:：]\s*)?(.+)$/m.exec(spec??'')?.[1]??manifest.task_id;
 const stageNames={'make-decision':'定方向','build-plan':'写计划','build-code':'写代码'},stageId=positionRow?.stage,stageLabel=stageId?(stageNames[stageId]??stageId)+(cursor?' · '+[cursor.phase_id,cursor.task_id].filter(Boolean).join(' / '):''):'当前位置未取得';
 const stages=Object.entries(stageNames).map(([id,name])=>({id,name:id+' · '+name,state:id===stageId?'now':'todo',label:id===stageId?'当前':id==='make-decision'&&decision?'已有决策材料':id==='build-plan'&&spec&&index?'已有计划材料':'阶段结论未记录',hint:id===stageId?[cursor?.phase_id,cursor?.task_id].filter(Boolean).join(' / '):'材料存在不代阶段完成'}));
 // Preserve ordinary P5 projections when no terminal original was supplied.
 // Only the public runtime derives quality; this adapter maps its DTO to view text.
 let stageStatus=null;
 if(rows.some(row=>row.stage==='build-code'&&row.terminal_assessment_ref)){
  const current=await stageRuntimeCliMain(['status','--action=begin','--stage=build-code',`--project=${manifest.project_name}`,`--task=${manifest.task_id}`,`--task-path=${task.taskPath}`],{cwd:root});
  if(current.task_id!==manifest.task_id||current.stage!=='build-code')throw Error('public status task/stage differs from page identity');
  const q=current.quality_status,assessment=current.quality?.terminal_assessment;
  if(!['pass','unknown','incomplete','unavailable'].includes(q))throw Error('public status quality is unavailable or invalid');
  const closed=q==='pass'&&current.quality?.terminal_assessment_ref;
  stageStatus={task_id:current.task_id,stage:current.stage,work_status:current.work_status,quality_status:q,quality:current.quality,label:closed?'最终复验通过':q==='unavailable'?'最终复验不可用':'最终复验有缺口',tone:closed?'ok':'unk',sources:assessment?.evidence_refs??[],gaps:assessment?.gaps??[]};
  const build=stages.find(stage=>stage.id==='build-code');build.state=closed?'done':'now';build.label=stageStatus.label;build.hint=[cursor?.phase_id,cursor?.task_id].filter(Boolean).join(' / ');
  for(const stage of stages)if(stage.id!=='build-code'&&stage.state==='now')stage.state='todo';
  // Explicit AC relations consume the already verified runtime DTO. Stage
  // aggregates never fill an object's missing or foreign AC association.
  const acs=new Map((assessment?.acceptance??[]).map(value=>[value.id,value]));
  function acceptanceView(declared){
   if(!Array.isArray(declared)||declared.length===0)return {text:'未关联验收',tone:'unk',claims:[]};
   const claims=declared.map(id=>acs.get(id));
   if(claims.some(value=>!value))return {text:'关联验收不在当前分母',tone:'unk',claims:claims.filter(Boolean)};
   const passed=claims.filter(value=>value.result==='pass').length;
   return {text:passed===claims.length?'验收已通过':claims.some(value=>value.result==='fail')?'验收未通过':passed?'部分通过 · 仍有缺口':'验收未完成',tone:passed===claims.length?'ok':claims.some(value=>value.result==='fail')?'fail':'unk',claims};
  }
  for(const t of objects.filter(o=>o.kind==='task')){const a=acceptanceView(t.ac_ids);t.acceptance={text:a.text,results:a.claims};t.status={text:t.implementation.text+' · '+a.text,tone:a.tone};}
  for(const wp of packages){const a=acceptanceView(wp.ac_ids);wp.acceptance={text:a.text,results:a.claims};wp.status={text:(wp.planSummary?'方案已定':'工作包已记录')+' · '+a.text,tone:a.tone};}
  for(const req of objects.filter(o=>o.kind==='req')){
   const declared=req.declared_wp_ids??[],owners=declared.map(id=>packages.find(wp=>wp.source_id===id));
   const mapped=declared.length>0&&owners.every(wp=>Array.isArray(wp?.ac_ids)&&wp.ac_ids.length>0)?[...new Set(owners.flatMap(wp=>wp.ac_ids))]:[];
   const a=acceptanceView(mapped);req.acceptance={text:a.text,results:a.claims};req.status={text:(req.source==='原件未取得'||req.status.text==='缺'?'缺：原话来源未取得':'需求已记录')+' · '+a.text,tone:a.tone};
  }
  for(const o of objects.filter(o=>o.kind==='acc')){const claim=acs.get(o.source_id);if(claim)o.status={text:claim.result==='pass'?'验收已通过':claim.result==='fail'?'验收未通过':'验收未完成',tone:claim.result==='pass'?'ok':claim.result==='fail'?'fail':'unk'};}
  for(const o of objects.filter(o=>['req','wp','task'].includes(o.kind)))for(const claim of o.acceptance?.results??[])for(const ref of claim.refs??[])o.src.push(source(join(task.taskPath,ref.ref),'public status 已核AC原件 '+claim.id));
  fingerprints.terminal_status_sha256=hash(JSON.stringify(stageStatus));
 }
 const pageData={task:businessTitle,taskIdentity:`${manifest.project_name}/${manifest.task_id}`,stageLabel:stageStatus?stageStatus.stage+' · '+stageNames[stageStatus.stage]:stageLabel,...(stageStatus?{stageStatus}:{}),sourceDir:material,stages,currentObjectId:objects.find(o=>o.kind==='task'&&o.source_id===cursor?.task_id)?.id??null,initialSelection:objects.find(o=>o.kind==='task'&&o.source_id===cursor?.task_id)?.id??'progress',hasPhase:objects.some(o=>o.kind==='phase'),objects,edges,sideEdges,phaseTasks,progress:{reqIds:objects.filter(o=>o.kind==='req').map(o=>o.id),unlinkedTaskIds:objects.filter(o=>o.kind==='task'&&!o.phase).map(o=>o.id)},changedChips:[],initialChanged:[]};
 return {pageData,report,decisionLogPath:decisionPath,decisionMissing:decision===null,workspaceRoot:root,taskIdentity:task.identity,sourceFingerprint:fingerprints,factsProvenance:{ref:factsPath,sha256:factsHash},excludedCommandRefs,gaps:objects.filter(o=>o.status.text==='缺').map(o=>({kind:o.kind,reason:o.title})),factsRows:rows.length,contractFacts:contract.facts,contractErrors:contract.errors};
}
export async function main(argv=process.argv.slice(2)){if(argv.length!==4||argv[0]!=='--task-path'||argv[2]!=='--report')throw Error('usage: --task-path <absolute root> --report <report>');return buildPageData({taskPath:argv[1],reportPath:argv[3]});}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e.message);process.exitCode=1;});
