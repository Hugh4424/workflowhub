import {lstatSync,realpathSync,readdirSync,readFileSync} from 'node:fs';
import {isAbsolute,join,relative,resolve,sep} from 'node:path';
import {withLock} from '../interface/record-lock.mjs';

const MiB=1024*1024;
export const DEFAULT_TASK_DISK_LIMITS=Object.freeze({
 evidence:Object.freeze({softBytes:384*MiB,hardBytes:512*MiB,hardFiles:20000}),
 reviews:Object.freeze({softBytes:192*MiB,hardBytes:256*MiB,hardFiles:5000}),
 tests:Object.freeze({softBytes:128*MiB,hardBytes:256*MiB,hardFiles:10000}),
});
const fail=(code,message,details={})=>Object.assign(new Error(`${code}: ${message}`),{code,...details});
function realRoot(taskRoot){
 if(typeof taskRoot!=='string'||!isAbsolute(taskRoot))throw fail('DISK_PATH_INVALID','absolute task root required');
 const root=resolve(taskRoot),stat=lstatSync(root);
 if(stat.isSymbolicLink()||!stat.isDirectory()||realpathSync(root)!==root)throw fail('DISK_PATH_ALIAS','task root must be a real directory');
 return root;
}
function checkAncestors(root,path){
 const rel=relative(root,path);if(rel==='..'||rel.startsWith('..'+sep)||isAbsolute(rel))throw fail('DISK_PATH_OUTSIDE','write leaves task root');
 let cursor=root;
 for(const part of rel.split(sep).filter(Boolean)){cursor=join(cursor,part);let stat;try{stat=lstatSync(cursor);}catch(e){if(e.code==='ENOENT')break;throw e;}if(stat.isSymbolicLink())throw fail('DISK_PATH_ALIAS','task storage contains a symbolic link');}
}
function usage(root,group,base){
 const path=base??join(root,'quality',group),scanRoot=path,seen=new Set(),top=[];checkAncestors(root,path);
 function walk(path){let s;try{s=lstatSync(path);}catch(e){if(e.code==='ENOENT')return {bytes:0,files:0};throw e;}
  if(s.isSymbolicLink())throw fail('DISK_PATH_ALIAS','usage never follows symbolic links');
  if(s.isFile()){const key=`${s.dev}:${s.ino}`,bytes=seen.has(key)?0:s.size;seen.add(key);return {bytes,files:1};}
  if(!s.isDirectory())throw fail('DISK_PATH_INVALID','usage requires regular files/directories');
  const value={bytes:0,files:0};for(const n of readdirSync(path)){const v=walk(join(path,n));value.bytes+=v.bytes;value.files+=v.files;if(path===scanRoot)top.push({path:relative(root,join(path,n)).split(sep).join('/'),...v});}return value;
 }
 return {...walk(path),top:top.sort((a,b)=>b.bytes-a.bytes)};
}
export function readTaskDiskUsage(taskRoot){const root=realRoot(taskRoot),groups={};for(const group of Object.keys(DEFAULT_TASK_DISK_LIMITS))groups[group]=usage(root,group);return {task_root:root,groups,bytes:Object.values(groups).reduce((n,v)=>n+v.bytes,0),files:Object.values(groups).reduce((n,v)=>n+v.files,0)};}
function groupName(subdir){const parts=String(subdir).split('/');if(parts[0]!=='quality'||!Object.hasOwn(DEFAULT_TASK_DISK_LIMITS,parts[1]))throw fail('DISK_PATH_OUTSIDE','budget destination must be a task quality group');return parts[1];}
function number(value,label){if(!Number.isSafeInteger(value)||value<0)throw fail('DISK_BUDGET_INVALID',`${label} must be a nonnegative safe integer`);return value;}
export function assertTaskDiskBudget({taskRoot,subdir,incomingBytes,incomingFiles=1,limits}={}){
 const root=realRoot(taskRoot),group=groupName(subdir),limit={...DEFAULT_TASK_DISK_LIMITS[group],...(limits?.[group]??{})};
 for(const k of ['softBytes','hardBytes','hardFiles'])number(limit[k],k);if(limit.softBytes>limit.hardBytes)throw fail('DISK_BUDGET_INVALID','soft exceeds hard');
 number(incomingBytes,'incomingBytes');number(incomingFiles,'incomingFiles');const current=usage(root,group);
 const details={subdir:`quality/${group}`,current_bytes:current.bytes,incoming_bytes:incomingBytes,hard_bytes:limit.hardBytes,current_files:current.files,incoming_files:incomingFiles,hard_files:limit.hardFiles};
 if(current.bytes+incomingBytes>limit.hardBytes||current.files+incomingFiles>limit.hardFiles)throw fail('DISK_BUDGET_EXCEEDED','new write exceeds task budget',details);
 if(current.bytes+incomingBytes>=limit.softBytes)process.stderr.write(`DISK_BUDGET_SOFT ${JSON.stringify(details)}\n`);
 return details;
}
/** Leaf scope: only the finite actual filesystem write runs under this lock. */
export function createTaskDiskWriteExecutor({taskRoot,limits}={}){
 const root=realRoot(taskRoot);
 return async function performWrite({path,bytes,incomingFiles=1,resolveExisting},writeActual){
  if(typeof path!=='string'||!isAbsolute(path)||typeof writeActual!=='function')throw fail('DISK_PATH_INVALID','actual absolute write target/function required');
  const target=resolve(path);checkAncestors(root,target);const rel=relative(root,target).split(sep).join('/'),group=groupName(rel);
  if(resolveExisting!==undefined&&typeof resolveExisting!=='function')throw fail('DISK_PATH_INVALID','resolveExisting must be a finite synchronous function');
  return withLock(root,`disk-budget-${group}`,async()=>{checkAncestors(root,target);if(resolveExisting){const existing=resolveExisting();if(existing!==undefined){if(!existing||typeof existing!=='object'||typeof existing.then==='function'||existing.idempotent!==true||existing.path!==target)throw fail('DISK_PATH_INVALID','resolveExisting must return a matching idempotent result or undefined');return existing;}}assertTaskDiskBudget({taskRoot:root,subdir:`quality/${group}`,incomingBytes:bytes,incomingFiles,limits});return writeActual();});
 };
}
export function auditTaskDiskUsage(taskRoot){
 const summary=readTaskDiskUsage(taskRoot),root=summary.task_root;let cohort=null;try{checkAncestors(root,join(root,'task.json'));cohort=JSON.parse(readFileSync(join(root,'task.json'),'utf8')).activation_cohort??null;}catch(e){if(e.code!=='ENOENT')throw e;}
 const attribution=[];
 function add(path,classification,writer){checkAncestors(root,path);let stat;try{stat=lstatSync(path);}catch(e){if(e.code==='ENOENT')return;throw e;}if(stat.isSymbolicLink())throw fail('DISK_PATH_ALIAS','audit never follows symbolic links');const measured=stat.isDirectory()?usage(root,null,path):{bytes:stat.size,files:1};attribution.push({path:relative(root,path).split(sep).join('/'),classification,writer,mtime:stat.mtime.toISOString(),bytes:measured.bytes,files:measured.files});}
 add(join(root,'facts.jsonl'),cohort==='post'?'active':['pre','history'].includes(cohort)?'historical':'unknown',cohort==='post'?'task-store':'unverified historical task writer');
 add(join(root,'index.json'),cohort==='post'?'active':['pre','history'].includes(cohort)?'historical':'unknown',cohort==='post'?'task metadata index':'unverified historical task writer');
 for(const group of Object.keys(summary.groups)){
  add(join(root,'quality',group),group==='reviews'||group==='tests'?'active':'unknown',group==='reviews'?'review-record-route':group==='tests'?'task command capture':'multiple evidence writers');
  for(const item of summary.groups[group].top){const historical=item.path==='quality/evidence/review-materials';add(join(root,item.path),historical?'historical':'unknown',historical?'retired review-materials writer':'unproven child writer; group responsibility is not attribution');}
 }
 add(join(root,'review-materials'),'unknown','unproven writer at this location');return {...summary,cohort,attribution};
}
