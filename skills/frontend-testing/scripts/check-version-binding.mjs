import {readFileSync,writeFileSync,realpathSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const fields=['material_id','ref','sha256','bytes','role'];
const text=v=>typeof v==='string'&&v.trim().length>0;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const same=(a,b)=>a.sha256.toLowerCase()===b.sha256.toLowerCase()&&a.bytes===b.bytes;
function validateMaterials(rows,label){
  const reasons=[],ids=new Set();
  if(!Array.isArray(rows))return [{code:'E_MATERIAL_IDENTITY_INVALID',path:label,message:'Explicit materials must be an array'}];
  rows.forEach((r,i)=>{
    const path=label+'['+i+']';
    if(!r||typeof r!=='object'||Array.isArray(r)||Object.keys(r).length!==fields.length||fields.some(k=>!Object.hasOwn(r,k))){reasons.push({code:'E_MATERIAL_FIELD_OUT_OF_WHITELIST',path,message:'材料身份恰含 material_id/ref/sha256/bytes/role 五字段'});return;}
    if(!text(r.material_id)||ids.has(r.material_id)||!text(r.ref)||!text(r.role)||typeof r.sha256!=='string'||!/^[a-f0-9]{64}$/i.test(r.sha256)||!Number.isSafeInteger(r.bytes)||r.bytes<0)reasons.push({code:'E_MATERIAL_IDENTITY_INVALID',path,message:'身份字段必须可核且材料号唯一；unknown 不补值'});
    ids.add(r.material_id);
  });
  return reasons;
}
// 推断：原文未逐字规定version/approved/delivered/created_at及role名、
// commit格式与ISO带时区格式；缺侧/字段/坏格式拒2沿原身份错误类。
const sides=['approved','delivered'],versionKeys=['commit','sha256','created_at'];
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const invalid=(path,message)=>({code:'E_MATERIAL_IDENTITY_INVALID',path,message});
function timestamp(value){
  if(typeof value!=='string')return false;
  const m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|([+-])(\d{2}):(\d{2}))$/.exec(value),time=Date.parse(value);
  if(!m||!Number.isFinite(time)||m[7]!=='Z'&&(+m[9]>23||+m[10]>59))return false;
  const offset=m[7]==='Z'?0:(m[8]==='+'?1:-1)*(+m[9]*60 + +m[10]),local=new Date(time+offset*60000);
  return [local.getUTCFullYear(),local.getUTCMonth()+1,local.getUTCDate(),local.getUTCHours(),local.getUTCMinutes(),local.getUTCSeconds()].every((v,i)=>v===+m[i+1]);
}
function versionErrors(version){
  if(!object(version)||Object.keys(version).some(k=>!sides.includes(k)))return [invalid('version','批准版与交付版必须分写，不接收合成一个三件套')];
  const errors=[];
  for(const side of sides){
    const value=version[side],path='version.'+side;
    if(!object(value)){errors.push(invalid(path,'缺少本侧版本三件套'));continue;}
    if(Object.keys(value).some(k=>!versionKeys.includes(k)))errors.push(invalid(path,'版本三件套只含commit、sha256、created_at'));
    if(typeof value.commit!=='string'||!/^[a-f0-9]{7,40}$/i.test(value.commit))errors.push(invalid(path+'.commit','本侧commit缺失或格式错误（推断：7至40位十六进制）'));
    if(typeof value.sha256!=='string'||!/^[a-f0-9]{64}$/i.test(value.sha256))errors.push(invalid(path+'.sha256','本侧sha256缺失或不是64位摘要'));
    if(!timestamp(value.created_at))errors.push(invalid(path+'.created_at','本侧时点缺失或格式错误（推断：有效ISO日期并带时区）'));
  }
  return errors;
}
function bindVersion(version,current,actuals,result){
  for(const side of sides){
    const rows=current.filter(r=>r.role===side),path='version.'+side;
    if(rows.length!==1){result.reasons.push(invalid(path,'需恰一条显式role='+side+'材料（推断role名）；不按数组位置猜版本'));continue;}
    const row=rows[0],actual=actuals.get(row);
    if(version[side].sha256.toLowerCase()!==actual.sha256)result.reasons.push({code:'E_MATERIAL_BYTES_MISMATCH',path:path+'.sha256',ref:row.ref,message:'本侧版本摘要与对应原件实算字节不符',expected:{sha256:version[side].sha256},actual});
    else result.matched.push({material_id:row.material_id,ref:row.ref,role:side,sha256:actual.sha256,bytes:actual.bytes});
  }
}
// 推断：原文未逐字规定role=version/consent/interface-change、confirmed值及
// 同意绑定具体三件套的算法。复用human-confirm的decision/reply/material_refs；
// 只检查声明与字节/引用关系，不认证签名、历史或授予任务/Git权限。
function sameVersion(a,b){
  return !versionErrors(a).length&&sides.every(side=>a[side].commit.toLowerCase()===b[side].commit.toLowerCase()&&a[side].sha256.toLowerCase()===b[side].sha256.toLowerCase()&&Date.parse(a[side].created_at)===Date.parse(b[side].created_at));
}
// 推断：D042 只要求变则失效与对差异取得同意，未规定承载形式；本工具以 reply 内单一 64hex 集合指纹实现该要求。
// 推断X′固定属性顺序ref、role、sha256、bytes；ref按JS字符串排序，role属于同意内容，摘要/字节取实算。
function consentFingerprint(refs,current,actuals){
  return sha(Buffer.from(JSON.stringify(refs.slice().sort().flatMap(ref=>
    current.filter(row=>row.ref===ref).map(row=>{
      const actual=actuals.get(row);return {ref,role:row.role,sha256:actual.sha256,bytes:actual.bytes};
    }).sort((a,b)=>a.role<b.role?-1:a.role>b.role?1:a.sha256<b.sha256?-1:a.sha256>b.sha256?1:a.bytes-b.bytes)
  ))));
}
function bindConsent(version,current,actuals,originals,result){
  const receipts=current.filter(row=>row.role==='consent').map(row=>({row,claim:JSON.parse(originals.get(row).toString('utf8'))}));
  // B：引用完整性先于无差异返回；只查已声明current，不跟随ref打开文件。
  for(const {claim}of receipts){
    if(!object(claim)||!Array.isArray(claim.material_refs)||!claim.material_refs.every(ref=>text(ref)&&current.some(row=>row.ref===ref))){result.reasons.push(invalid('materials','同意引用的原件未显式声明或引用列表无效；请声明被同意的差异及版本原件，不要沿用悬空引用'));return;}
  }
  // 存在consent即先核内容，不能靠重分类差异role跳过；无consent且无change仍保旧通路。
  for(const {claim}of receipts){
    const hexes=typeof claim.reply==='string'?(claim.reply.match(/(?<![a-f0-9])[a-f0-9]{64}(?![a-f0-9])/ig)??[]):[];
    if(hexes.length!==1){result.reasons.push(invalid('materials','同意回复需含恰好一个完整64位十六进制内容指纹，覆盖本次批准的全部引用材料集合；即使无界面变更，已声明consent也须核实集合并取得带指纹的真实回复'));return;}
    if(hexes[0].toLowerCase()!==consentFingerprint(claim.material_refs,current,actuals)){result.reasons.push(invalid('materials','同意回复的集合指纹与当前引用原件内容不符；差异或版本原件已变，请核实全部引用材料并重新取得对应集合指纹的同意'));return;}
  }
  for(const {claim}of receipts){
    if(claim.decision!=='confirmed'){result.reasons.push(invalid('materials','已声明consent的decision必须为confirmed；拒绝、缺失或其它决策不能作为同意，即使无界面变更也须提供真实确认'));return;}
    // 只检查本consent显式引用的版本件；普通文档确认不强加version source。
    for(const source of current.filter(row=>row.role==='version'&&claim.material_refs.includes(row.ref))){
      if(!sameVersion(JSON.parse(originals.get(source).toString('utf8'))?.version,version)){result.reasons.push(invalid('version','同意引用的版本原件与当前两侧三件套不匹配；请核实批准/交付版本并重新取得对应版本集合的同意'));return;}
    }
  }
  // 行为变更由caller声明；无consent且无变化不证明真实UI状态。
  const changes=current.filter(row=>row.role==='interface-change');if(!changes.length)return;
  if(changes.some(row=>!text(originals.get(row).toString('utf8')))){result.reasons.push(invalid('materials','界面行为差异登记为空，不能以空原件代同意范围'));return;}
  const sources=current.filter(row=>row.role==='version'&&sameVersion(JSON.parse(originals.get(row).toString('utf8'))?.version,version));
  if(!sources.length){result.reasons.push(invalid('version','同意所引用的版本原件未显式声明或与当前两侧三件套不匹配'));return;}
  for(const {row:receipt,claim}of receipts){
    if(!text(claim.reply)||!changes.every(row=>claim.material_refs.includes(row.ref)))continue;
    const source=sources.find(row=>claim.material_refs.includes(row.ref));if(!source)continue;
    for(const row of [source,receipt])result.matched.push({material_id:row.material_id,ref:row.ref,role:row.role,...actuals.get(row)});
    return;
  }
  result.reasons.push(invalid('materials','界面行为变更缺少与本次显式版本原件及差异登记匹配的同意'));
}
export function hashCriteria(bytes){return sha(bytes);}
export function resignDelta(current,previous){
  const available=new Set(previous.map((_,i)=>i)),renamed=[],added=[],bytes_changed=[],unmatched=[];
  // Byte identity is primary across the entire list. Do not let an earlier
  // changed label consume a later row's surviving byte identity.
  for(const row of current){
    let index=[...available].find(i=>same(row,previous[i])&&previous[i].material_id===row.material_id);
    if(index===undefined)index=[...available].find(i=>same(row,previous[i]));
    if(index===undefined){unmatched.push(row);continue;}
    available.delete(index);const old=previous[index];
    if(old.ref!==row.ref)renamed.push({material_id:row.material_id,from:old.ref,to:row.ref,sha256:row.sha256,bytes:row.bytes});
  }
  for(const row of unmatched){
    const index=[...available].find(i=>previous[i].material_id===row.material_id);
    if(index===undefined){added.push(row);continue;}
    available.delete(index);const old=previous[index];
    bytes_changed.push({material_id:row.material_id,previous:old,current:row,previous_sha256_prefix:old.sha256.slice(0,12),current_sha256_prefix:row.sha256.slice(0,12)});
  }
  return {renamed,added,removed:[...available].map(i=>previous[i]),bytes_changed};
}
export function bindMaterials(input,{previous,criteriaBytes,expectedCriteriaSha256}={}){
  const report=object(input),current=report?input.materials:input;
  const reasons=[...validateMaterials(current,'materials'),...(previous===undefined?[]:validateMaterials(previous,'previous'))];
  const result={ok:false,verdict:'阻断',reasons,matched:[],materials:current,criteria_sha256:hashCriteria(criteriaBytes),renamed:[],added:[],removed:[],bytes_changed:[],...(report?{version:input.version??null}:{})};
  if(reasons.length)return result;
  if(current.length===0)reasons.push({code:'E_MATERIAL_IDENTITY_INVALID',path:'materials',message:'当前材料为空，无身份可核；空清单不能声明版本绑定已核，前次删除差异仍单列保留'});
  const versionProblems=report?versionErrors(input.version):[];reasons.push(...versionProblems);
  // Only explicitly supplied originals are opened. Previous is an immutable claim,
  // not a request to read old paths or infer archive/commit/license provenance.
  const actuals=new Map(),originals=new Map();
  for(const row of current){const bytes=readFileSync(row.ref),actual={sha256:sha(bytes),bytes:bytes.length};actuals.set(row,actual);originals.set(row,bytes);if(actual.bytes!==row.bytes||actual.sha256!==row.sha256.toLowerCase())reasons.push({code:'E_MATERIAL_BYTES_MISMATCH',ref:row.ref,message:'材料声明与当前原始字节不符',expected:{sha256:row.sha256,bytes:row.bytes},actual});}
  if(report&&!versionProblems.length)bindVersion(input.version,current,actuals,result);
  if(report&&!reasons.length)bindConsent(input.version,current,actuals,originals,result);
  if(previous!==undefined){Object.assign(result,resignDelta(current,previous));if(result.added.length||result.removed.length||result.bytes_changed.length)reasons.push({code:'E_MATERIAL_DELTA',message:'显式前后材料存在新增、删除或字节变化；差异只作本次裁决'});}
  if(expectedCriteriaSha256!==undefined&&result.criteria_sha256!==expectedCriteriaSha256.toLowerCase())reasons.push({code:'E_CRITERIA_HASH_MISMATCH',message:'判据原始字节摘要与调用者提供期望不符'});
  result.ok=!reasons.length;result.verdict=result.ok?'允许':'阻断';return result;
}
export function runCli(argv=process.argv.slice(2),{output=process.stdout}={}){
  try{
    const values={},flags=['--materials','--previous','--report','--criteria','--expect-criteria-sha256'];
    for(let i=0;i<argv.length;i++){const k=argv[i];if(!flags.includes(k)||values[k]!==undefined||!text(argv[i+1])||argv[i+1].startsWith('--'))throw Error('Unknown, duplicate or missing argument');values[k]=argv[++i];}
    if(!text(values['--materials'])||!text(values['--criteria']))throw Error('Required: --materials <five-field-array-or-binding-report.json> --criteria <original>');
    if(values['--expect-criteria-sha256']!==undefined&&!/^[a-f0-9]{64}$/i.test(values['--expect-criteria-sha256']))throw Error('Expected criteria sha256 must be a 64-digit digest');
    const current=JSON.parse(readFileSync(values['--materials'],'utf8')),previous=values['--previous']?JSON.parse(readFileSync(values['--previous'],'utf8')):undefined;
    const result=bindMaterials(current,{previous,criteriaBytes:readFileSync(values['--criteria']),expectedCriteriaSha256:values['--expect-criteria-sha256']});
    const bytes=JSON.stringify(result)+'\n';if(values['--report'])writeFileSync(values['--report'],bytes,{flag:'wx'});output.write(bytes);return result.ok?0:2;
  }catch(error){output.write(JSON.stringify({ok:false,verdict:'工具异常',reasons:[{code:'E_BINDING_TOOL_ERROR',message:error.message}],matched:[]})+'\n');return 1;}
}
if(process.argv[1]&&realpathSync(process.argv[1])===fileURLToPath(import.meta.url))process.exitCode=runCli();
