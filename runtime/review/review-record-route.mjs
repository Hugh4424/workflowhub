import { constants, closeSync, fstatSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync, readdirSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { withLock } from "../interface/record-lock.mjs";
import { appendRecord } from "../interface/safe-write.mjs";
import { reviewIdentityFromInput } from "./review-policy.mjs";
import { parseReviewerOutput } from "./review-output.mjs";
import { deriveVerifyCodeConclusion } from "./canonical-review-result.mjs";
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
  let identity;
  try { identity=reviewIdentityFromInput(request); }
  catch(error) {
    // Existing record/CLI error consumer renders this diagnostic before dispatch.
    throw Object.assign(error,{code:"REVIEW_IDENTITY_INVALID",preflight_protocol:true,diagnostic:{
      field:"stage/review_track/review_kind/review_scope",expected:"one valid existing review lifecycle tuple",
      actual:JSON.stringify({stage:request.stage,review_track:request.review_track??request.reviewTrack??null,review_kind:request.review_kind??request.reviewKind??null,review_scope:request.review_scope??request.reviewScope??null}),
      next_action:"use the current stage's declared review track, kind and scope"}});
  }
  if(request.surface!==undefined && request.surface!==null && !["document","code"].includes(request.surface))throw coded("REVIEW_SURFACE_INVALID","surface must describe document or code material");
  const phase=request.phase_id ?? request.phaseId ?? null;
  const scope=identity.stage==="build-code" && identity.reviewKind===null ? identity.reviewScope ?? "phase" : identity.reviewScope;
  if(scope==="phase" && identity.reviewKind===null && (!/^P[1-9][0-9]*$/.test(phase ?? "") || request.subject_kind!==undefined && request.subject_kind!=="phase")) throw coded("REVIEW_SUBJECT_INVALID","phase review requires a concrete phase_id and subject_kind=phase");
  return {stage:identity.stage,review_track:identity.reviewTrack,review_kind:identity.reviewKind,review_scope:scope,
    subject_kind:scope==="phase" ? "phase" : request.subject_kind ?? "document",phase_id:phase,surface:request.surface ?? null};
}
function reportedUsage(value) {
  return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0 ? value : null;
}
function materialBytes(materials) {
  const values = Object.values(materials ?? {});
  if (values.length === 0) return null;
  return values.reduce((total, value) => {
    if (Buffer.isBuffer(value) || value instanceof Uint8Array) return total + value.byteLength;
    return total + Buffer.byteLength(typeof value === "string" ? value : JSON.stringify(value), "utf8");
  }, 0);
}
function priorMaterialReview(dir, materialId) {
  if (materialId === null) return { hit: false, record_ref: null };
  for (const name of readdirSync(dir).filter(name => name.endsWith(".json")).sort().reverse()) {
    try {
      const previous = JSON.parse(readFileSync(checkedPath(join(dir, name)), "utf8"));
      if (previous.request?.material_id === materialId) return { hit: true, record_ref: `quality/reviews/${name}` };
    } catch { /* Foreign or damaged history stays passive, never a dispatch gate. */ }
  }
  return { hit: false, record_ref: null };
}
function providerCoverage(member, materialKeys) {
  const coverage = member.material_coverage;
  const valid = coverage && coverage.provider === member.provider
    && ["read", "unread", "undetermined"].every(key => Array.isArray(coverage[key])
      && coverage[key].every(value => typeof value === "string" && value.length > 0));
  const fact = valid ? { provider: member.provider, read: [...coverage.read], unread: [...coverage.unread], undetermined: [...coverage.undetermined] }
    : { provider: member.provider, read: [], unread: [], undetermined: [...materialKeys] };
  if (member.status !== "completed" || (member.parse_outcome ?? member.execution?.parse_outcome) !== "ok") {
    fact.undetermined = [...new Set([...fact.undetermined, ...fact.read])];
    fact.read = [];
  }
  return fact;
}
async function providerFact(member,dir,slug,root,discardedFacts) {
  if(!member || typeof member.provider!=="string" || !member.provider) throw coded("PROVIDER_RESULT_INVALID","provider name is missing");
  const fact={...member};
  // Raw output is one immutable local original, never copied into the result.
  for(const key of ["output","raw_output"]) if(typeof fact[key]==="string") {
    if (Buffer.byteLength(fact[key], "utf8") === 0) {
      discardedFacts.push({ fact_kind: "provider_output_not_persisted", dropped_key: `${member.provider}:${key}`, reason: "zero_bytes" });
      delete fact[key];
      continue;
    }
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
  // The supplied subject is ordinary request provenance, not an identity or
  // completion predicate. Capture its JSON value once so transport mutation
  // cannot erase or relabel the scope the caller actually submitted.
  const subjectJson=Object.hasOwn(request,"subject") ? JSON.stringify(request.subject) : undefined;
  const submittedSubject=subjectJson===undefined ? {} : {subject:JSON.parse(subjectJson)};
  const {root,manifest}=readTask(taskDir);
  if(manifest.activation_cohort!=="post") throw coded("REVIEW_TASK_READ_ONLY","review writes require an explicit post task; pre/history and unknown cohorts are read-only");
  const tuple=subject(request);const dir=join(root,"quality","reviews");
  checkedPath(root,{directory:true});
  const quality=join(root,"quality");try{checkedPath(quality,{directory:true});}catch(error){if(error.code!=="ENOENT")throw error;mkdirSync(quality);checkedPath(quality,{directory:true});}
  try{checkedPath(dir,{directory:true});}catch(error){if(error.code!=="ENOENT")throw error;checkedPath(quality,{directory:true});mkdirSync(dir);checkedPath(dir,{directory:true});}
  const lockName=["review",tuple.stage,tuple.review_scope ?? tuple.review_track ?? tuple.review_kind ?? "document",tuple.phase_id].filter(Boolean).join("-").toLowerCase().replaceAll(".","-");
  return withLock(dir,lockName,async()=>{
    if(signal?.aborted) throw coded("REVIEW_CANCELLED","review cancelled before dispatch");
    const started=new Date().toISOString(); let result;
    let rawCount=0;
    const discardedFacts=[];
    const onProviderOutput=async ({provider,role=null,output})=>{
      if(typeof output!=="string" && !Buffer.isBuffer(output) && !(output instanceof Uint8Array) || typeof provider!=="string")throw coded("PROVIDER_OUTPUT_INVALID","provider raw output must be named text or original bytes");
      if ((typeof output === "string" ? Buffer.byteLength(output, "utf8") : output.byteLength) === 0) {
        discardedFacts.push({ fact_kind: "provider_output_not_persisted", dropped_key: `provider-output:${provider}`, reason: "zero_bytes" });
        return null;
      }
      const path=await appendRecord(dir,`${tuple.stage}-${tuple.review_scope ?? "document"}-provider-${++rawCount}`,"output",output);
      return relative(root,path).split("\\").join("/");
    };
    try { result=await runRound({...request,...tuple,...structuredClone(submittedSubject)},{...(signal ? {signal} : {}),onProviderOutput,taskId:manifest.task_id}); }
    catch(error) { result={status:"unavailable",outcome:"unavailable",dispatch_state:error.dispatch_state ?? "unknown",provider_results:Array.isArray(error.provider_results)?error.provider_results:[],findings:Array.isArray(error.findings)?error.findings:[],error:{code:error.code ?? "REVIEW_ERROR",message:redactProviderHostPaths(String(error.message ?? error))}}; }
    if(!result || typeof result!=="object" || !["available","available-with-failures","unavailable","incomplete"].includes(result.status)) throw coded("REVIEW_RESULT_INVALID","runner returned no observable result status");
    for(const key of ["stage","review_scope","review_track","review_kind","subject_kind","phase_id","surface"]) if(result[key]!==undefined && result[key]!==tuple[key]) throw coded("REVIEW_SUBJECT_MISMATCH",`runner result differs in ${key}`);
    if (Array.isArray(result.findings) && Array.isArray(result.provider_results)) result={...result,findings:result.findings.filter(finding=>!result.provider_results.some(member=>member.provider===finding.provider && member.identity_authenticated===false))};
    let findings=[];
    const partialFindings=["unavailable","incomplete"].includes(result.status) && Array.isArray(result.findings) && result.findings.length>0;
    if(["available","available-with-failures"].includes(result.status) || partialFindings) {
      if(!Array.isArray(result.provider_results) || result.provider_results.length===0) throw coded("PROVIDER_RESULT_INVALID","semantic result has no provider provenance");
      if(partialFindings && result.findings.some(finding=>typeof finding?.provider!=="string" || !result.provider_results.some(member=>member?.provider===finding.provider))) throw coded("PROVIDER_RESULT_INVALID","partial finding is not bound to an observed provider");
      const parsed=parseReviewerOutput(JSON.stringify({findings:result.findings}),{requireEvidence:true});
      // Normalization keeps finding order. Consume each submitted finding once
      // so identical findings from different providers retain their own source.
      const originals=result.findings.filter(original=>parseReviewerOutput(JSON.stringify({findings:[original]}),{requireEvidence:true}).findings.length>0);
      findings=parsed.findings.map(normalized=>{const index=originals.findIndex(f=>f.path===normalized.path&&f.issue===normalized.issue&&(f.line ?? null)===(normalized.line ?? null));if(index<0) throw coded("REVIEW_RESULT_INVALID","normalized finding has no submitted source");const [original]=originals.splice(index,1);return {...original,...normalized};});
      result={...result,discarded_facts:[...(result.discarded_facts ?? []),...(parsed.discarded_facts ?? [])]};
    }
    const providers=[];
    for(const [index,member] of (result.provider_results ?? []).entries()) providers.push(await providerFact(member,dir,`${tuple.stage}-${tuple.review_scope ?? "document"}-provider-${index+1}`,root,discardedFacts));
    const slug=`${tuple.stage}-${tuple.review_scope ?? tuple.review_track ?? "document"}${tuple.phase_id ? "-"+tuple.phase_id.toLowerCase() : ""}`;
    const {material_id,authenticated_evidence,authenticated_evidence_sha256,snapshot_tree,candidate_tree,base_tree,request_key,request_hash,closure_manifest,material_revision,source,...ordinary}=result;
    const completed=new Date().toISOString();
    const materialId=typeof material_id === "string" ? material_id : null;
    const materialKeys=Object.keys(request.materials ?? {});
    const providerFacts=providers.map(member=>{
      const usage=reportedUsage(member.usage ?? member.execution?.usage ?? null);
      return { provider:member.provider, status:member.status,
        opinion_returned:member.status === "completed" && (member.parse_outcome ?? member.execution?.parse_outcome) === "ok",
        findings_count:findings.filter(finding=>finding.provider === member.provider).length,
        duration_ms:member.timing?.duration_ms ?? member.execution?.timing?.duration_ms ?? null,
        usage, usage_status:usage === null ? "not_reported" : "reported" };
    });
    const record={version:"wh-review-result.v1",...ordinary,task_id:manifest.task_id,...tuple,started_at:started,completed_at:completed,
      request:{...tuple,...submittedSubject,material_keys:materialKeys,material_id:materialId,...Object.fromEntries(["only_providers","dispatch_reason","supplements"].filter(key=>Object.hasOwn(request,key)).map(key=>[key,structuredClone(request[key])]))},provider_results:providers,findings,
      review_facts:{providers:providerFacts,material_bytes:materialBytes(request.materials),wall_clock_ms:Date.parse(completed)-Date.parse(started),
        usage_coverage:{reported:providerFacts.filter(member=>member.usage_status === "reported").length,total:providers.length},
        already_reviewed:priorMaterialReview(dir,materialId)},
      material_coverage:providers.map(member=>providerCoverage(member,materialKeys)),
      ...((result.discarded_facts?.length || discardedFacts.length) ? {discarded_facts:[...(result.discarded_facts ?? []),...discardedFacts]} : {}),
      ...(signal?.aborted ? {status:"unavailable",error:{code:"REVIEW_CANCELLED",message:"review cancelled; settled provider facts retained"}} : {}),authoritative:false};
    if(tuple.stage==="verify-code") {
      const {conclusion,coverage}=deriveVerifyCodeConclusion({status:record.status,provider_results:providers,findings});
      Object.assign(record,{conclusion,coverage});
    }
    const path=await appendRecord(dir,slug,"json",JSON.stringify(record,null,2)+"\n");
    const ref=relative(root,path).split("\\").join("/");return {status:record.status,result_ref:ref,path,stage:tuple.stage,review_scope:tuple.review_scope,subject_kind:tuple.subject_kind,phase_id:tuple.phase_id,authoritative:false};
  },{waitMs:lockWaitMs});
}
