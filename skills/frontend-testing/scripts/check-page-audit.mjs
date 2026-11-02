#!/usr/bin/env node
// Structural acceptance only. See ../references/page-audit.md for the judgment owner.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const states=new Set(['通过','失败','未测','不适用']);
const overallStates=new Set([...states,'pass','fail','incomplete','inconclusive','deferred','missing','inconsistent','unavailable']);
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const text=value=>typeof value==='string'&&value.trim().length>0;
const passed=value=>value==='通过'||value==='pass';

export function collectErrors(report){
  const errors=[];
  const add=(code,path,message)=>errors.push({code,path,message});
  const shape=(path,message)=>add('E_REPORT_SHAPE',path,message);
  function scan(value,path){
    if(Array.isArray(value)){value.forEach((item,index)=>scan(item,`${path}[${index}]`));return;}
    if(!plain(value))return;
    for(const [key,item] of Object.entries(value)){
      const at=`${path}.${key}`;
      const normalized=key.replace(/[_\s-]/g,'').toLowerCase();
      if(/score|percent|percentage|总分|百分比|(?:pass|fail|success|completion)rate|通过率|失败率|成功率|完成率/.test(normalized)){
        add('E_TOTAL_SCORE',at,'总分、评分或百分比字段不能替代逐项四态');
      }
      if(/^(unknown|untested|未测|未知)(count|total|aggregate|数|总计)$/.test(normalized)&&typeof item==='number'){
        add('E_UNKNOWN_AGGREGATED',at,'未测或未知必须逐项保留，不能聚合成数字');
      }
      scan(item,at);
    }
  }
  scan(report,'$');
  if(!plain(report)){shape('$','报告必须是对象');return errors;}
  if(!plain(report.object)||Object.keys(report.object).length===0)shape('$.object','object 必须是非空身份对象；此处不核完整身份或真实性');
  if(!Array.isArray(report.criteria)||report.criteria.length===0)shape('$.criteria','criteria 必须是非空数组');
  if(!Array.isArray(report.coverage_limits))shape('$.coverage_limits','coverage_limits 必须是数组');
  else report.coverage_limits.forEach((limit,index)=>{if(!text(limit))shape(`$.coverage_limits[${index}]`,'未覆盖项必须是非空文字');});
  if(!plain(report.summary))shape('$.summary','summary 必须是含 overall 的对象');
  else if(!overallStates.has(report.summary.overall)){
    shape('$.summary.overall','overall 必须保留真实结果词，不能是数字或未知占位');
    if(typeof report.summary.overall==='number')add('E_UNKNOWN_AGGREGATED','$.summary.overall','不能将逐项结果聚合成数字');
  }
  const criteria=Array.isArray(report.criteria)?report.criteria:[];
  criteria.forEach((item,index)=>{
    const at=`$.criteria[${index}]`;
    if(!plain(item)){shape(at,'检查项必须是对象');return;}
    for(const field of ['id','dimension'])if(!text(item[field]))shape(`${at}.${field}`,`${field} 必须是非空文字`);
    if(!states.has(item.state))add('E_STATE_OUT_OF_ENUM',`${at}.state`,'state 只允许通过、失败、未测、不适用');
    if(item.state==='未测'&&!text(item.untested_reason))add('E_MISSING_UNTESTED_REASON',`${at}.untested_reason`,'未测必须写具体理由');
    if(item.state==='不适用'&&!text(item.untested_reason))add('E_MISSING_APPLICABILITY_BASIS',`${at}.untested_reason`,'不适用必须写理由与依据');
    if(item.evidence===undefined&&item.state!=='不适用')shape(`${at}.evidence`,'检查项必须提供 evidence 数组；未取得证据时保空数组及真实原因');
    if(item.evidence!==undefined&&!Array.isArray(item.evidence))shape(`${at}.evidence`,'evidence 必须是引用数组');
    const evidence=Array.isArray(item.evidence)?item.evidence:[];
    evidence.forEach((entry,entryIndex)=>{
      const path=`${at}.evidence[${entryIndex}]`;
      if(!plain(entry)||!text(entry.ref))shape(path,'证据项必须含非空 ref');
      // Ref-only is the frozen local shape minimum, not formal evidence completeness.
      if(plain(entry)&&entry.sha256!==undefined&&(typeof entry.sha256!=='string'||!/^[a-f0-9]{64}$/i.test(entry.sha256)))shape(`${path}.sha256`,'提供的 sha256 必须是64位十六进制字符串；此处不读取或重算文件');
    });
    if(item.state==='通过'&&(evidence.length===0||evidence.some(entry=>!plain(entry)||!text(entry.ref)))){
      add('E_MISSING_EVIDENCE',`${at}.evidence`,'通过项必须有非空且格式合法的证据引用');
    }
  });
  if(passed(report.summary?.overall)){
    if(Array.isArray(report.coverage_limits)&&report.coverage_limits.length>0)add('E_LIMITED_PASS','$.summary.overall','存在未覆盖范围，整体不能写通过');
    if(criteria.length===0||criteria.some(item=>!plain(item)||!['通过','不适用'].includes(item.state))){
      add('E_UNKNOWN_AGGREGATED','$.summary.overall','有失败、未测或非法项，不能聚合成通过');
    }
  }
  return errors;
}

export function emitVerdict(errors,output=process.stdout){
  const verdict={ok:errors.length===0,errors};
  output.write(`${JSON.stringify(verdict)}\n`);
  return verdict.ok?0:2;
}

export function runCli(argv=process.argv.slice(2),output=process.stdout){
  const executionError=(code,path,message)=>{
    emitVerdict([{code,path,message}],output);
    return 1;
  };
  if(argv.length!==2||argv[0]!=='--input'||!text(argv[1])||argv[1].startsWith('--')){
    return executionError('E_USAGE','$','用法：node check-page-audit.mjs --input <report.json>');
  }
  let bytes;
  try{bytes=readFileSync(argv[1],'utf8');}
  catch(error){return executionError('E_INPUT_READ',argv[1],`无法读取输入：${error.code??error.message}`);}
  let report;
  try{report=JSON.parse(bytes);}
  catch{return executionError('E_INPUT_JSON',argv[1],'输入不是合法 JSON');}
  return emitVerdict(collectErrors(report),output);
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  process.exitCode=runCli();
}
