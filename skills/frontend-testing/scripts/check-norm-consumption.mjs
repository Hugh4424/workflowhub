import {readFile,writeFile,realpath} from 'node:fs/promises';
import {resolve,relative,isAbsolute,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const defaultRef='skills/frontend-testing/references/page-audit.md#规范来源';
const text=v=>typeof v==='string'&&v.trim().length>0;
const known=v=>text(v)&&!['unknown','missing','unavailable','当前可读版','本次实际读取版本'].includes(v.trim())&&!/^sha256:/i.test(v);
const invalid=message=>Object.assign(new Error(message),{code:'E_NORM_INPUT'});
function splitRef(ref){
  if(!text(ref))throw invalid('Reference must be a nonempty path#section');
  const at=ref.indexOf('#'),path=ref.slice(0,at),section=ref.slice(at+1);
  if(at<=0||!section||isAbsolute(path)||path.includes('\\')||path.split('/').includes('..'))throw invalid('Reference must stay within the repository and name a section: '+ref);
  return {path,section};
}
export function collectNormRefs(input){
  if(!input||typeof input!=='object'||!Array.isArray(input.criteria)||!Array.isArray(input.norm_candidates))throw invalid('Expected criteria[] and explicit norm_candidates[]');
  const citations=[],ids=new Set();
  for(const c of input.criteria){
    if(!c||!text(c.id)||ids.has(c.id))throw invalid('Criterion ids must be nonempty and unique');ids.add(c.id);
    if(c.cited_norms!==undefined&&!Array.isArray(c.cited_norms))throw invalid('cited_norms must be an array');
    if(!c.cited_norms?.length){citations.push({id:c.id,ref:defaultRef,missing_citations:true});continue;}
    for(const item of c.cited_norms){if(!item||typeof item!=='object')throw invalid('Each citation must be an object');splitRef(item.ref);citations.push({id:c.id,ref:item.ref,...Object.fromEntries(['version','owner','consumer'].filter(k=>Object.hasOwn(item,k)).map(k=>[k,item[k]]))});}
  }
  for(const ref of input.norm_candidates)splitRef(ref);
  return citations;
}
function metadata(source){
  const result={};
  if(source.startsWith('---\n')||source.startsWith('---\r\n')){
    const match=source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if(match)for(const line of match[1].split(/\r?\n/)){const m=line.match(/^(version|owner|consumer):\s*(.*?)\s*$/);if(m){let value=m[2];if(value.startsWith('"')){try{value=JSON.parse(value);}catch{throw invalid('Invalid metadata scalar');}}else if(value.startsWith("'")&&value.endsWith("'"))value=value.slice(1,-1).replace(/''/g,"'");result[m[1]]=value;}}
  }
  const lines=source.split(/\r?\n/),heading=lines.findIndex(line=>/^#\s/.test(line));
  if(heading>=0){const first=lines.slice(heading+1).findIndex(line=>/^#{1,6}\s/.test(line));const header=lines.slice(heading+1,first<0?undefined:heading+1+first).join('\n');for(const [key,names]of [['version','版本|version'],['owner','owner|负责人'],['consumer','consumer|使用者']]){const m=header.match(new RegExp('(?:^|[\\n。；;])\\s*(?:'+names+')\\s*[:：]\\s*([^\\n。；;]+)','i'));if(m&&result[key]===undefined)result[key]=m[1].trim();}}
  return result;
}
function anchors(source){
  const result=new Set(),counts=new Map();let fence;
  for(const line of source.split(/\r?\n/)){
    const f=line.match(/^\s{0,3}(`{3,}|~{3,})/);if(f){if(!fence)fence=f[1][0];else if(fence===f[1][0])fence=undefined;continue;}if(fence)continue;
    for(const m of line.matchAll(/\bid=["']([^"']+)["']/g))result.add(m[1]);
    const h=line.match(/^\s{0,3}#{1,6}\s+(.+?)(?:\s+#+\s*)?$/);if(h){const base=h[1].trim().toLowerCase().replace(/[^\p{L}\p{N}_\s-]/gu,'').replace(/\s/g,'-'),count=counts.get(base)??0;counts.set(base,count+1);result.add(base+(count?'-'+count:''));}
  }
  return result;
}
export async function resolveRef(citation,{cwd=process.cwd()}={}){
  if(citation.missing_citations)return {...citation,reason:'missing_metadata',missing:['cited_norms'],detail:'缺少实际读取清单；由本项执行者提供来源与恢复条件'};
  const {path,section}=splitRef(citation.ref),root=await realpath(cwd),target=resolve(root,path);
  let actual,source;
  try{actual=await realpath(target);const part=relative(root,actual);if(part.startsWith('..'+sep)||part==='..'||isAbsolute(part))throw invalid('Reference symlink escapes repository');source=await readFile(actual,'utf8');}
  catch(error){if(error.code==='ENOENT')return {...citation,reason:'missing_source',detail:'文件不存在'};throw error;}
  if(!anchors(source).has(section))return {...citation,reason:'missing_source',detail:'节不存在'};
  const original=metadata(source),missing=[];
  for(const key of ['version','owner','consumer']){if(!known(citation[key]))missing.push('citation.'+key);if(!known(original[key]))missing.push('original.'+key);}
  if(missing.length)return {...citation,reason:'missing_metadata',missing,detail:'缺少可核的版本/负责人/使用者'};
  if(citation.version!==original.version)return {...citation,reason:'stale_version',original_version:original.version,detail:'引用版本与原件不同'};
  if(citation.owner!==original.owner)return {...citation,reason:'missing_metadata',missing:['owner_match'],detail:'引用负责人不符，须回原规范owner核对'};
  return null;
}
export async function checkNormConsumption(input,options={}){
  const cited_norms=collectNormRefs(input),unresolved_refs=[];
  for(const citation of cited_norms){const problem=await resolveRef(citation,options);if(problem)unresolved_refs.push(problem);}
  const used=new Set(cited_norms.filter(c=>!c.missing_citations).map(c=>c.ref));
  return {cited_norms,unresolved_refs,never_cited_norms:[...new Set(input.norm_candidates)].filter(ref=>!used.has(ref)).map(ref=>({ref}))};
}
export function applyNormFacts(criteria,facts){
  return criteria.map(original=>{
    const missing=facts.unresolved_refs.filter(f=>f.id===original.id);if(!missing.length)return original;
    const reasons=missing.map(f=>f.reason==='missing_source'?'缺规范：'+f.ref:f.reason==='stale_version'?'规范过期：'+f.version+'≠'+f.original_version:'规范缺版本：'+(f.missing??[]).join(', '));
    return {...original,state:'未测',untested_reason:[...(original.untested_reason?[original.untested_reason]:[]),...reasons,'由该检查项执行者提供缺失规范或元数据，回原owner核对后重跑'].join('；'),norms_missing:[...new Set([...(original.norms_missing??[]),...missing.map(f=>f.ref)])]};
  });
}
export async function runCli(argv=process.argv.slice(2),{cwd=process.cwd(),output=process.stdout,stderr=process.stderr}={}){
  try{
    if(argv.length!==4||argv[0]!=='--input'||argv[2]!=='--out'||!text(argv[1])||!text(argv[3])||argv[1].startsWith('--')||argv[3].startsWith('--'))throw invalid('Usage: check-norm-consumption.mjs --input <judgments.json> --out <facts.json>');
    const input=JSON.parse(await readFile(resolve(cwd,argv[1]),'utf8')),facts=await checkNormConsumption(input,{cwd}),bytes=JSON.stringify(facts)+'\n';
    await writeFile(resolve(cwd,argv[3]),bytes);output.write(bytes);return 0;
  }catch(error){stderr.write(JSON.stringify({ok:false,errors:[{code:error.code??'E_NORM_TOOL_ERROR',path:argv[1]??'$',message:error.message}]})+'\n');return 1;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))process.exitCode=await runCli();
