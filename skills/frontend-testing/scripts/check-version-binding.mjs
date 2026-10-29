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
export function bindMaterials(current,{previous,criteriaBytes,expectedCriteriaSha256}={}){
  const reasons=[...validateMaterials(current,'materials'),...(previous===undefined?[]:validateMaterials(previous,'previous'))];
  const result={ok:false,verdict:'阻断',reasons,matched:[],materials:current,criteria_sha256:hashCriteria(criteriaBytes),renamed:[],added:[],removed:[],bytes_changed:[]};
  if(reasons.length)return result;
  if(current.length===0)reasons.push({code:'E_MATERIAL_IDENTITY_INVALID',path:'materials',message:'当前材料为空，无身份可核；空清单不能声明版本绑定已核，前次删除差异仍单列保留'});
  // Only explicitly supplied originals are opened. Previous is an immutable claim,
  // not a request to read old paths or infer archive/commit/license provenance.
  for(const row of current){const bytes=readFileSync(row.ref);if(bytes.length!==row.bytes||sha(bytes)!==row.sha256.toLowerCase())reasons.push({code:'E_MATERIAL_BYTES_MISMATCH',ref:row.ref,message:'材料声明与当前原始字节不符',expected:{sha256:row.sha256,bytes:row.bytes},actual:{sha256:sha(bytes),bytes:bytes.length}});}
  if(previous!==undefined){Object.assign(result,resignDelta(current,previous));if(result.added.length||result.removed.length||result.bytes_changed.length)reasons.push({code:'E_MATERIAL_DELTA',message:'显式前后材料存在新增、删除或字节变化；差异只作本次裁决'});}
  if(expectedCriteriaSha256!==undefined&&result.criteria_sha256!==expectedCriteriaSha256.toLowerCase())reasons.push({code:'E_CRITERIA_HASH_MISMATCH',message:'判据原始字节摘要与调用者提供期望不符'});
  result.ok=!reasons.length;result.verdict=result.ok?'允许':'阻断';return result;
}
export function runCli(argv=process.argv.slice(2),{output=process.stdout}={}){
  try{
    const values={},flags=['--materials','--previous','--report','--criteria','--expect-criteria-sha256'];
    for(let i=0;i<argv.length;i++){const k=argv[i];if(!flags.includes(k)||values[k]!==undefined||!text(argv[i+1])||argv[i+1].startsWith('--'))throw Error('Unknown, duplicate or missing argument');values[k]=argv[++i];}
    if(!text(values['--materials'])||!text(values['--criteria']))throw Error('Required: --materials <five-field-array.json> --criteria <original>');
    if(values['--expect-criteria-sha256']!==undefined&&!/^[a-f0-9]{64}$/i.test(values['--expect-criteria-sha256']))throw Error('Expected criteria sha256 must be a 64-digit digest');
    const current=JSON.parse(readFileSync(values['--materials'],'utf8')),previous=values['--previous']?JSON.parse(readFileSync(values['--previous'],'utf8')):undefined;
    const result=bindMaterials(current,{previous,criteriaBytes:readFileSync(values['--criteria']),expectedCriteriaSha256:values['--expect-criteria-sha256']});
    const bytes=JSON.stringify(result)+'\n';if(values['--report'])writeFileSync(values['--report'],bytes,{flag:'wx'});output.write(bytes);return result.ok?0:2;
  }catch(error){output.write(JSON.stringify({ok:false,verdict:'工具异常',reasons:[{code:'E_BINDING_TOOL_ERROR',message:error.message}],matched:[]})+'\n');return 1;}
}
if(process.argv[1]&&realpathSync(process.argv[1])===fileURLToPath(import.meta.url))process.exitCode=runCli();
