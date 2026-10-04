import { constants, closeSync, fstatSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync, readdirSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { withLock } from "../interface/record-lock.mjs";
import { createFileOnce, writeFileAtomic } from "../interface/safe-write.mjs";

const STAGES = new Set(["make-decision", "build-plan", "build-code", "verify-code"]);
export const TASK_RECORD_KINDS = Object.freeze(["stage", "close_action"]);
export const STAGE_ROW_KEYS = Object.freeze([
  "record_kind", "task_id", "stage", "source", "created_at", "review_origin", "review_result_ref",
  "finding_dispositions", "spec_analyze", "evidence", "serious_issue_disposition", "close_action", "handoff",
]);
export const REVIEW_ORIGINS = Object.freeze(["conducted", "unavailable", "not_run", "same_source_degraded", "dispatched_uncollected"]);
export const CLOSE_ACTIONS = Object.freeze(["delivery_committed", "archive", "merge", "push", "worktree_cleanup"]);

function plain(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function text(value) { return typeof value === "string" && value.trim() !== ""; }
function readFile(path) {
  const absolute=resolve(path);let cursor="/";
  for(const part of absolute.split("/").filter(Boolean)){cursor=join(cursor,part);const st=lstatSync(cursor);if(st.isSymbolicLink()||realpathSync(cursor)!==cursor)throw new Error("task store path alias");}
  const named=lstatSync(absolute);if(!named.isFile()||named.nlink!==1)throw new Error("task store file must be single-link regular file");
  const fd=openSync(absolute,constants.O_RDONLY|constants.O_NOFOLLOW);
  try {const opened=fstatSync(fd);if(opened.dev!==named.dev||opened.ino!==named.ino)throw new Error("task store file changed while opening");const raw=readFileSync(fd,"utf8");const after=lstatSync(absolute);if(after.isSymbolicLink()||after.dev!==opened.dev||after.ino!==opened.ino||after.nlink!==1)throw new Error("task store file replaced while reading");return raw;}finally{closeSync(fd);}
}
function assertRoot(taskRoot, taskId) {
  if(typeof taskRoot!=="string"||!isAbsolute(taskRoot))throw new TypeError("task root must be absolute");
  const root=resolve(taskRoot),manifest=JSON.parse(readFile(join(root,"task.json")));
  if(!plain(manifest)||!text(manifest.task_id)||!text(manifest.project_name))throw new Error("task manifest identity is required");
  if(taskId!==undefined&&manifest.task_id!==taskId)throw new Error("task identity mismatch");
  return {root,taskId:manifest.task_id,projectName:manifest.project_name};
}
function factLines(raw, identity) {
  if(raw==="")return [];
  const lines=raw.split("\n");if(lines.at(-1)==="")lines.pop();
  return lines.map((line,index)=>{
    let value;try{value=JSON.parse(line);}catch{throw new Error(`facts.jsonl line ${index+1} is invalid JSON`);}
    if(!plain(value)||value.task_id!==identity.taskId||value.project_name!==undefined&&value.project_name!==identity.projectName)throw new Error(`facts.jsonl line ${index+1} has invalid task identity`);
    // Existing JSON is passive source data. Retired completion/hash fields are
    // not evaluated or rewritten when the current cursor is read or replaced.
    return {line,value};
  });
}
export function readTaskFacts(taskRoot) {
  const identity=assertRoot(taskRoot);
  return factLines(readFile(join(identity.root,"facts.jsonl")),identity).map(({value})=>value);
}
export async function withStoreLock(root, operation) { return withLock(root,"workflowhub-task-store",operation); }
export async function initializeTaskStore(taskRoot,{taskId}={}) {
  const identity=assertRoot(taskRoot,taskId);
  return withStoreLock(identity.root,async()=>{
    for(const path of ["quality","quality/reviews","quality/tests"]){const target=join(identity.root,path);try{const st=lstatSync(target);if(st.isSymbolicLink()||!st.isDirectory())throw new Error("task quality storage must be a real directory");}catch(error){if(error.code!=="ENOENT")throw error;mkdirSync(target,{mode:0o700});}}
    try{readFile(join(identity.root,"facts.jsonl"));}catch(error){if(error.code!=="ENOENT")throw error;await createFileOnce(identity.root,"facts.jsonl","");}
    return Object.freeze({task_id:identity.taskId,root:identity.root,record_ref:"facts.jsonl"});
  });
}
function condition(value,label) {
  if(!plain(value)||!Object.hasOwn(value,"value")||Object.keys(value).some(key=>!["value","reason"].includes(key)))throw new TypeError(`${label} must carry only value and reason`);
  if(value.value===null&&!text(value.reason))throw new TypeError(`${label} requires a reason when empty`);
  if(typeof value.value==="string"&&!text(value.value))throw new TypeError(`${label} value must not be empty text`);
  return value;
}
function validateCursor(value) {
  if(!plain(value)||Object.keys(value).sort().join("\0")!==["phase_id","task_id","phases_head","recorded_at"].sort().join("\0")||!/^P[1-9][0-9]*$/.test(value.phase_id??"")||!/^T[0-9]{3,}$/.test(value.task_id??"")||!/^[a-f0-9]{40,64}$/.test(value.phases_head??"")||!Number.isFinite(Date.parse(value.recorded_at)))throw new TypeError("phase_progress is invalid");
}
function currentRow(input,identity,now) {
  if(!plain(input)||Object.keys(input).some(key=>![...STAGE_ROW_KEYS,"phase_progress"].includes(key)))throw new TypeError("task row contains unsupported fields");
  if(input.task_id!==undefined&&input.task_id!==identity.taskId)throw new Error("task identity mismatch");
  const empty=reason=>({value:null,reason});
  const row={record_kind:input.record_kind??"stage",task_id:identity.taskId,stage:input.stage,source:input.source,created_at:input.created_at??now,
    review_origin:input.review_origin??"not_run",review_result_ref:input.review_result_ref??empty("no review result recorded"),finding_dispositions:input.finding_dispositions??[],
    spec_analyze:input.spec_analyze??empty("spec analysis not run"),evidence:input.evidence??empty("no executed command evidence"),
    serious_issue_disposition:input.serious_issue_disposition??empty("no serious issue disposition"),close_action:input.close_action??empty("this row carries no close action"),handoff:input.handoff??empty("no handoff recorded")};
  if(!TASK_RECORD_KINDS.includes(row.record_kind)||!text(row.source)||!Number.isFinite(Date.parse(row.created_at)))throw new TypeError("task row identity or time is invalid");
  if(row.record_kind==="stage"){if(!STAGES.has(row.stage))throw new TypeError("task row stage is invalid");condition(row.close_action,"close_action");if(row.close_action.value!==null)throw new TypeError("stage rows cannot carry close actions");}
  else if(row.stage!=="close"||!plain(row.close_action)||!CLOSE_ACTIONS.includes(row.close_action.action)||!text(row.close_action.result))throw new TypeError("close action row is invalid");
  if(!REVIEW_ORIGINS.includes(row.review_origin))throw new TypeError("review origin is invalid");
  if(row.review_origin==="conducted"){const ref=plain(row.review_result_ref)?row.review_result_ref.value:row.review_result_ref;if(!text(ref))throw new TypeError("conducted review requires named reference");}
  else{condition(row.review_result_ref,"review_result_ref");if(row.review_result_ref.value!==null)throw new TypeError("unconducted review must carry empty reference");}
  if(!Array.isArray(row.finding_dispositions))throw new TypeError("finding_dispositions must be an array of passive facts");
  for(const key of ["spec_analyze","evidence","serious_issue_disposition","handoff"])condition(row[key],key);
  if(row.evidence.value!==null){if(!Array.isArray(row.evidence.value)||!row.evidence.value.length||row.evidence.value.some(entry=>!plain(entry)||!text(entry.command)||!Number.isInteger(entry.exit_code)||!text(entry.failure_signature)))throw new TypeError("evidence must carry actual command, exit_code, failure_signature");}
  if(Object.hasOwn(input,"phase_progress")){if(row.record_kind!=="stage"||row.stage!=="build-code")throw new TypeError("phase_progress is only a build-code cursor");validateCursor(input.phase_progress);row.phase_progress=input.phase_progress;}
  return row;
}
export async function writeStageRow(taskRoot,input,options={}) {
  const identity=assertRoot(taskRoot,input?.task_id);
  return withStoreLock(identity.root,async()=>{
    const prior=factLines(readFile(join(identity.root,"facts.jsonl")),identity);
    const same=value=>value.record_kind===(input?.record_kind??"stage")&&(input?.record_kind==="close_action"?value.close_action?.action===input.close_action?.action:value.stage===input?.stage);
    const index=prior.findIndex(({value})=>same(value));
    const oldCursor=index>=0?prior[index].value.phase_progress:null;
    const nextInput=!Object.hasOwn(input??{},"phase_progress")&&oldCursor?.phases_head&&input?.stage==="build-code"?{...input,phase_progress:oldCursor}:input;
    const row=currentRow(nextInput,identity,options.now??new Date().toISOString());
    const line=JSON.stringify(row);const lines=prior.map(entry=>entry.line);
    if(index<0)lines.push(line);else lines[index]=line;
    await writeFileAtomic(identity.root,"facts.jsonl",lines.join("\n")+"\n");
    return Object.freeze({action:index<0?"inserted":"replaced",ref:`facts.jsonl#${index<0?lines.length:index+1}`,value:Object.freeze(row)});
  });
}
/** Existing confirmation reader is retained only until the old producer is
 * removed; no current writer or hash authentication is added here. */
export function listCanonicalConfirmationRefs(taskRoot,taskId) {
  const identity=assertRoot(taskRoot,taskId),dir=join(identity.root,"quality","confirmations");
  let names;try{for(const target of [join(identity.root,"quality"),dir]){const st=lstatSync(target);if(st.isSymbolicLink()||!st.isDirectory())throw new Error("confirmation storage must be real");}names=readdirSync(dir);}catch(error){if(error.code==="ENOENT")return [];throw error;}
  return names.filter(name=>/^[A-Za-z0-9][A-Za-z0-9._-]*\.json$/.test(name)).sort().map(name=>{const ref=`quality/confirmations/${name}`;readFile(join(identity.root,ref));return ref;});
}
/** Passive finding facts for the existing human handoff reader; no completion
 * validator, verdict counters or new persisted object are created. */
export function readCurrentStageFindingDispositionSummary(taskRoot,{taskId,stage}={}) {
  assertRoot(taskRoot,taskId);const row=readTaskFacts(taskRoot).find(value=>value.record_kind==="stage"&&value.stage===stage);
  return row?{items:row.finding_dispositions??[]}:null;
}
