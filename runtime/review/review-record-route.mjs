import { constants, closeSync, fstatSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync, readdirSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { withLock } from "../interface/record-lock.mjs";
import { appendRecord } from "../interface/safe-write.mjs";
import { reviewIdentityFromInput } from "./review-policy.mjs";
import { parseReviewerOutput } from "./review-output.mjs";
import { redactProviderHostPaths } from "./provider-material-projection.mjs";
import { runSimpleReview } from "../../skills/wh-review/scripts/simple-review-runner.mjs";

function coded(code,message) { return Object.assign(new Error(`${code}: ${message}`),{code}); }
function checkedPath(path,{directory=false}={}) {
  const absolute=resolve(path); let cursor="/";
  for(const part of absolute.split("/").filter(Boolean)) { cursor=join(cursor,part); const stat=lstatSync(cursor); if(stat.isSymbolicLink() || realpathSync(cursor)!==cursor) throw coded("REVIEW_PATH_ALIAS","review storage path contains an alias"); }
  const stat=lstatSync(absolute);
  if(directory ? !stat.isDirectory() : !stat.isFile() || stat.nlink!==1) throw coded("REVIEW_PATH_INVALID",directory ? "review storage must be a real directory" : "review input must be a single-link regular file");
  return absolute;
}
function readTask(taskDir) {
  const root=checkedPath(taskDir,{directory:true});const path=checkedPath(join(root,"task.json"));
  const named=lstatSync(path); const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);
  try { const opened=fstatSync(fd); if(opened.dev!==named.dev || opened.ino!==named.ino) throw coded("REVIEW_PATH_CHANGED","task manifest replaced");
    const manifest=JSON.parse(readFileSync(fd,"utf8")); if(typeof manifest.task_id!=="string" || !manifest.task_id) throw coded("TASK_ID_INVALID","task manifest has no task_id");return {root,manifest};
  } finally {closeSync(fd);}
}
function subject(request) {
  const identity=reviewIdentityFromInput(request);
  if(request.surface!==undefined && request.surface!==null && !["document","code"].includes(request.surface))throw coded("REVIEW_SURFACE_INVALID","surface must describe document or code material");
  const phase=request.phase_id ?? request.phaseId ?? null;
  const scope=identity.stage==="build-code" && identity.reviewKind===null ? identity.reviewScope ?? "phase" : identity.reviewScope;
  if(scope==="phase" && identity.reviewKind===null && (!/^P[1-9][0-9]*$/.test(phase ?? "") || request.subject_kind!==undefined && request.subject_kind!=="phase")) throw coded("REVIEW_SUBJECT_INVALID","phase review requires a concrete phase_id and subject_kind=phase");
  return {stage:identity.stage,review_track:identity.reviewTrack,review_kind:identity.reviewKind,review_scope:scope,
    subject_kind:scope==="phase" ? "phase" : request.subject_kind ?? "document",phase_id:phase,surface:request.surface ?? null};
}
async function providerFact(member,dir,slug,root) {
  if(!member || typeof member.provider!=="string" || !member.provider) throw coded("PROVIDER_RESULT_INVALID","provider name is missing");
  const fact={...member};
  // Raw output is one immutable local original, never copied into the result.
  for(const key of ["output","raw_output"]) if(typeof fact[key]==="string") {
    const path=await appendRecord(dir,slug+"-"+key.replaceAll("_","-"),"output",fact[key]);
    if(key==="raw_output") {
      const ref=relative(root,path).split("\\").join("/");
      if(fact.raw_output_ref && typeof fact.raw_output_ref==="object") {
        if(fact.evidence_refs!==undefined && !Array.isArray(fact.evidence_refs))throw coded("PROVIDER_RESULT_INVALID","provider evidence refs must be an array");
        fact.evidence_refs=[...(fact.evidence_refs ?? []),ref];
      } else fact.raw_output_ref=ref;
    } else fact.output_ref=path;
    delete fact[key];
  }
  return fact;
}
export async function recordSimpleReviewRequest({taskDir,request,runRound=runSimpleReview,signal=null,lockWaitMs=2000}={}) {
  if(typeof runRound!=="function" || !request || typeof request!=="object" || Array.isArray(request)) throw new TypeError("review request and runner are required");
  if(signal!==null && (typeof signal.aborted!=="boolean" || typeof signal.addEventListener!=="function")) throw new TypeError("review signal must be an AbortSignal");
  const {root,manifest}=readTask(taskDir);const tuple=subject(request);const dir=join(root,"quality","reviews");
  checkedPath(root,{directory:true});
  const quality=join(root,"quality");try{checkedPath(quality,{directory:true});}catch(error){if(error.code!=="ENOENT")throw error;mkdirSync(quality);checkedPath(quality,{directory:true});}
  try{checkedPath(dir,{directory:true});}catch(error){if(error.code!=="ENOENT")throw error;checkedPath(quality,{directory:true});mkdirSync(dir);checkedPath(dir,{directory:true});}
  const lockName=["review",tuple.stage,tuple.review_scope ?? tuple.review_track ?? tuple.review_kind ?? "document",tuple.phase_id].filter(Boolean).join("-").toLowerCase().replaceAll(".","-");
  return withLock(dir,lockName,async()=>{
    if(signal?.aborted) throw coded("REVIEW_CANCELLED","review cancelled before dispatch");
    const started=new Date().toISOString(); let result;
    let rawCount=0;
    const onProviderOutput=async ({provider,role=null,output})=>{if(typeof output!=="string" && !Buffer.isBuffer(output) && !(output instanceof Uint8Array) || typeof provider!=="string")throw coded("PROVIDER_OUTPUT_INVALID","provider raw output must be named text or original bytes");const path=await appendRecord(dir,`${tuple.stage}-${tuple.review_scope ?? "document"}-provider-${++rawCount}`,"output",output);return relative(root,path).split("\\").join("/");};
    try { result=await runRound({...request,...tuple},{...(signal ? {signal} : {}),onProviderOutput}); }
    catch(error) { result={status:"unavailable",outcome:"unavailable",dispatch_state:error.dispatch_state ?? "unknown",provider_results:[],findings:[],error:{code:error.code ?? "REVIEW_ERROR",message:redactProviderHostPaths(String(error.message ?? error))}}; }
    if(!result || typeof result!=="object" || !["available","available-with-failures","unavailable","incomplete"].includes(result.status)) throw coded("REVIEW_RESULT_INVALID","runner returned no observable result status");
    for(const key of ["stage","review_scope","review_track","review_kind","subject_kind","phase_id","surface"]) if(result[key]!==undefined && result[key]!==tuple[key]) throw coded("REVIEW_SUBJECT_MISMATCH",`runner result differs in ${key}`);
    let findings=[];
    if(["available","available-with-failures"].includes(result.status)) {
      if(!Array.isArray(result.provider_results) || result.provider_results.length===0) throw coded("PROVIDER_RESULT_INVALID","semantic result has no provider provenance");
      const parsed=parseReviewerOutput(JSON.stringify({findings:result.findings}),{requireEvidence:true});
      findings=parsed.findings.map(normalized=>{const original=result.findings.find(f=>f.path===normalized.path&&f.issue===normalized.issue&&(f.line ?? null)===(normalized.line ?? null));return {...original,...normalized};});
      result={...result,discarded_facts:[...(result.discarded_facts ?? []),...(parsed.discarded_facts ?? [])]};
    }
    const providers=[];
    for(const [index,member] of (result.provider_results ?? []).entries()) providers.push(await providerFact(member,dir,`${tuple.stage}-${tuple.review_scope ?? "document"}-provider-${index+1}`,root));
    const slug=`${tuple.stage}-${tuple.review_scope ?? tuple.review_track ?? "document"}${tuple.phase_id ? "-"+tuple.phase_id.toLowerCase() : ""}`;
    const {material_id,authenticated_evidence,authenticated_evidence_sha256,snapshot_tree,candidate_tree,base_tree,request_key,request_hash,closure_manifest,material_revision,source,...ordinary}=result;
    const record={version:"wh-review-result.v1",...ordinary,task_id:manifest.task_id,...tuple,started_at:started,completed_at:new Date().toISOString(),
      request:{...tuple,material_keys:Object.keys(request.materials ?? {})},provider_results:providers,findings,
      ...(signal?.aborted ? {status:"unavailable",error:{code:"REVIEW_CANCELLED",message:"review cancelled; settled provider facts retained"}} : {}),authoritative:false};
    const path=await appendRecord(dir,slug,"json",JSON.stringify(record,null,2)+"\n");
    const ref=relative(root,path).split("\\").join("/");return {status:record.status,result_ref:ref,path,stage:tuple.stage,review_scope:tuple.review_scope,subject_kind:tuple.subject_kind,phase_id:tuple.phase_id,authoritative:false};
  },{waitMs:lockWaitMs});
}
