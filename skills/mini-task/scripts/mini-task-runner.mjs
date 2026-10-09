import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { withLock } from "../../../runtime/interface/record-lock.mjs";
import { appendRecord } from "../../../runtime/interface/safe-write.mjs";
import { recordConfirmation } from "../../../runtime/interface/human-confirm.mjs";
import { inspectWorkspace } from "../../../runtime/interface/workspace-check.mjs";
import { prepareDeliveryClosePlan, confirmClosePlan, authorizeClosePlan, executeClosePlan } from "../../../core/task-close.mjs";

const AUTH = fileURLToPath(new URL("../../../runtime/interface/git-authorize.mjs", import.meta.url));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
function fail(code, message) { return Object.assign(new Error(message), { code }); }
function env() { const result = { ...process.env }; for (const key of Object.keys(result)) if (key.startsWith("GIT_")) delete result[key]; result.GIT_OPTIONAL_LOCKS = "0"; return result; }
function git(cwd, argv, optional = false) {
  const result = spawnSync("git", argv, { cwd, env: env(), encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0 && !optional) throw fail("GIT_COMMAND_FAILED", result.stderr.trim());
  return optional ? result : result.stdout.trimEnd();
}
function real(path) { const value = resolve(path); if (realpathSync(value) !== value || lstatSync(value).isSymbolicLink()) throw fail("PATH_ALIAS", `canonical path required: ${path}`); return value; }
function read(path) { real(path); const s = lstatSync(path); if (!s.isFile() || s.nlink !== 1) throw fail("UNSAFE_FILE", `regular single-link file required: ${path}`); return readFileSync(path); }
function context(taskDir) {
  const root = real(taskDir), manifest = JSON.parse(read(join(root, "task.json")));
  if (manifest.activation_cohort !== "post") throw fail("MINI_TASK_READ_ONLY", "mini-task writes require an explicit post task; pre/history and missing or unknown cohorts are read-only");
  if (root.split("/").slice(-4).join("/") !== `Projects/${manifest.project_name}/tasks/${manifest.task_id}`) throw fail("TASK_PATH_MISMATCH", "task.json and directory identities differ");
  const repo = real(manifest.target_repo_root);
  const branch = `task/${manifest.project_name}/${manifest.task_id}`;
  const registrations = git(repo, ["worktree", "list", "--porcelain", "-z"]).split("\0\0").map(block => Object.fromEntries(block.split("\0").filter(Boolean).map(line => [line.slice(0,line.indexOf(" ")),line.slice(line.indexOf(" ")+1)])));
  const common=realpathSync(resolve(repo,git(repo,["rev-parse","--git-common-dir"])));
  const base=registrations.find(r=>r.worktree===dirname(common));
  if(!base)throw fail("GIT_COMMON_ROOT","primary repository is not registered");
  const worktree = manifest.workspace_mode === "existing" ? real(manifest.workspace_root) : resolve(dirname(base.worktree),`${basename(base.worktree)}-${manifest.task_id}`);
  if (!worktree || !registrations.some(r => r.worktree === worktree && (manifest.workspace_mode === "existing" || r.branch === `refs/heads/${branch}`))) throw fail("WORKTREE_NOT_REGISTERED", "task worktree is not registered");
  real(worktree);
  if(realpathSync(resolve(worktree,git(worktree,["rev-parse","--git-common-dir"])))!==common)throw fail("WORKTREE_COMMON_DIR","task worktree belongs to a different repository");
  const directory = join(root, "quality", "evidence", "mini-task");
  let cursor = root;
  for (const part of ["quality", "evidence", "mini-task"]) { cursor = join(cursor, part); if (!existsSync(cursor)) mkdirSync(cursor); real(cursor); }
  return { taskDir: root, manifest, repo, worktree, directory };
}
async function evidence(c, slug, value) { const path = await appendRecord(c.directory, slug, "json", `${JSON.stringify(value, null, 2)}\n`); return { ...value, evidence_ref: path }; }
function state(c) {
  const raw = git(c.worktree, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]), parts = raw.split("\0"), paths = [];
  for (let i=0;i<parts.length;i++) { if (!parts[i]) continue; const status=parts[i].slice(0,2), path=parts[i].slice(3); if (/[RC]/.test(status)) paths.push(parts[++i]); paths.push(path); }
  const ignored=git(c.worktree,["ls-files","--others","--ignored","--exclude-standard","-z"]).split("\0").filter(Boolean);
  if(ignored.some(path=>["quality/","evidence/",".multica/","qa-artifacts/"].some(prefix=>path.startsWith(prefix)||path.startsWith(`specs/${c.manifest.task_id}/${prefix}`))))throw fail("EXECUTION_SIDECAR","ignored task sidecars must be published before progress commit");
  const files = [...new Set(paths)].sort().map(path => {
    if (!path || path.startsWith("/") || path.split("/").includes("..")) throw fail("UNSAFE_PATH", "unsafe progress path");
    if (["quality/", "evidence/", ".multica/", "qa-artifacts/"].some(prefix => path.startsWith(prefix) || path.startsWith(`specs/${c.manifest.task_id}/${prefix}`))) throw fail("EXECUTION_SIDECAR", "publish task sidecars before preserving progress");
    return { path, sha256: existsSync(join(c.worktree,path)) ? hash(read(join(c.worktree,path))) : null };
  });
  return { branch: git(c.worktree,["branch","--show-current"]), head: git(c.worktree,["rev-parse","HEAD"]), status: raw, files, index_patch: git(c.worktree,["diff","--cached","--binary"]) };
}
function matchingAuthorization(c, operation, confirmationRef) {
  const dir=join(c.taskDir,"quality","authorizations");
  if(!existsSync(dir))throw fail("IRREVERSIBLE_AUTHORIZATION_REQUIRED",`no recorded ${operation} authorization`);
  const names=readdirSync(dir).filter(name=>new RegExp(`^\\d{4}-\\d{2}-\\d{2}-\\d{3}-authorize-${operation}\\.json$`).test(name)).sort();
  const last=names.at(-1);
  if(!last)throw fail("IRREVERSIBLE_AUTHORIZATION_REQUIRED",`no recorded ${operation} authorization`);
  const grant=JSON.parse(read(join(dir,last)));
  if(grant.confirmation_ref!==confirmationRef)throw fail("AUTH_SCOPE","authorization belongs to another confirmation");
  return {path:join(dir,last),value:grant};
}
function nativeAuthorization(c, action, operation, value) {
  const dir=join(c.taskDir,"quality","authorizations"); if (!existsSync(dir)) mkdirSync(dir); real(dir);
  try {
    const pointer=JSON.parse(execFileSync(process.execPath,[AUTH,action,"--operation",operation,"--dir",dir,action==="record"?"--confirmation-ref":"--step-id",value],{cwd:c.worktree,encoding:"utf8",stdio:["ignore","pipe","pipe"]}));
    if(typeof pointer.path!=="string"||!pointer.path.startsWith("/")||resolve(pointer.path)!==pointer.path||dirname(pointer.path)!==dir)throw fail("AUTHORIZATION_RECORD_PATH","native pointer is outside this task authorization directory");
    const slug=action==="consume"?"consumed":"authorize";
    if(!new RegExp(`^\\d{4}-\\d{2}-\\d{2}-\\d{3}-${slug}-${operation}\\.json$`).test(basename(pointer.path)))throw fail("AUTHORIZATION_RECORD_PATH","native record filename differs from operation");
    return action==="record"?pointer:{...JSON.parse(read(pointer.path)),path:pointer.path};
  }
  catch(error) { let parsed; try { parsed=JSON.parse(String(error.stderr)); } catch { throw error; } throw fail(parsed.code??"AUTHORIZATION_FAILED",parsed.message??String(error.stderr)); }
}
function planRecord(c, planRef) {
  if (dirname(resolve(planRef))!==c.directory) throw fail("PLAN_REFERENCE", "an explicit task-owned resume plan is required");
  const plan=JSON.parse(read(planRef));
  if (plan.task_id!==c.manifest.task_id || plan.worktree_root!==c.worktree || !/^[a-f0-9]{40,64}$/i.test(plan.target_oid??"") || !Array.isArray(plan.steps)) throw fail("PLAN_IDENTITY", "resume plan identity is invalid");
  if (JSON.stringify(plan.steps)!==JSON.stringify(plan.source.files.length?["commit","merge"]:["merge"])) throw fail("PLAN_ACTIONS", "resume action set differs from actual progress");
  return plan;
}
function confirmation(c, planRef, confirmationRef) {
  if (dirname(resolve(confirmationRef))!==join(c.taskDir,"quality","confirmations")) throw fail("CONFIRMATION_REFERENCE", "native task confirmation required");
  const result=JSON.parse(read(confirmationRef));
  if (result.decision!=="confirmed" || !result.material_refs?.includes(planRef) || !result.reply) throw fail("CONFIRMATION_REJECTED", "confirmed verbatim reply for resume plan required");
  return result;
}
function object(value,label){if(!value||typeof value!=="object"||Array.isArray(value))throw new TypeError(`${label} must be an object`);return value;}
export function evaluateMiniTaskScope(input = {}) {
  const value = object(input, "mini-task scope input");
  const unresolved = [];
  const booleanFact = (name, alias, optional = false) => {
    const keys = [name, alias].filter(key => Object.hasOwn(value, key));
    if (keys.length === 0) { if (!optional) unresolved.push(`${name}: missing assessment`); return false; }
    if (keys.some(key => typeof value[key] !== "boolean")) { unresolved.push(`${name}: non-boolean assessment`); return false; }
    if (keys.length === 2 && value[name] !== value[alias]) { unresolved.push(`${name}: conflicting aliases`); return false; }
    return value[keys[0]];
  };
  const userRequested = booleanFact("user_requested", "userRequested", true);
  const flags = {
    boundary_clear: booleanFact("boundary_clear", "boundaryClear"),
    single_outcome: booleanFact("single_outcome", "singleOutcome"),
    limited_impact: booleanFact("limited_impact", "limitedImpact"),
    major_architecture: booleanFact("major_architecture", "majorArchitecture"),
    migration: booleanFact("migration", "migrationRisk"),
    permission: booleanFact("permission", "permissionRisk"),
    security: booleanFact("security", "securityRisk"),
  };
  // Explicit risk evidence must survive even when its other alias is invalid.
  const expanded = [["major_architecture", "majorArchitecture"], ["migration", "migrationRisk"], ["permission", "permissionRisk"], ["security", "securityRisk"]]
    .filter(([name, alias]) => value[name] === true || value[alias] === true).map(([name]) => name);
  const suitable = flags.boundary_clear && flags.single_outcome && flags.limited_impact && expanded.length === 0;
  if (expanded.length > 0 || unresolved.length > 0) {
    return Object.freeze({
      status: "paused",
      user_requested: userRequested,
      reason: [expanded.length > 0 ? `mini-task scope includes materially expanded risks: ${expanded.join(", ")}; an explicit route choice is required` : "mini-task suitability is not established",
        ...(unresolved.length > 0 ? [`unassessed or invalid evidence: ${unresolved.join("; ")}; false flags for these items are placeholders, not evidence of absent risk`] : [])].join("; "),
      expanded_risks: expanded,
      choices: ["shrink-mini-task", "create-ordinary-five-stage-task"],
      flags,
    });
  }
  if (suitable) return Object.freeze({ status: "suitable", user_requested: userRequested, risks: userRequested ? ["用户显式指定了精简流程，仍需关注范围扩大"] : [], flags });
  if (userRequested) return Object.freeze({ status: "suitable_with_risk", user_requested: true, risks: expanded.length > 0 ? expanded : ["需求边界或影响面需要持续监控"], execution_boundary: "若执行中继续扩大，必须重新评估并暂停让用户选择", flags });
  return Object.freeze({ status: "paused", user_requested: false, reason: "mini-task suitability is not established", expanded_risks: expanded, choices: ["shrink-mini-task", "create-ordinary-five-stage-task"], flags });
}

export async function prepareMiniTaskDelivery({ taskDir, delivery }={}) { return prepareDeliveryClosePlan({taskDir,delivery,closeMode:"mini-task"}); }
export async function confirmMiniTaskDelivery(input={}) { return confirmClosePlan(input); }
export async function authorizeMiniTaskDelivery(input={}) { return authorizeClosePlan(input); }
export async function executeMiniTaskDelivery(input={}) { return executeClosePlan(input); }
export async function prepareAResumePlan({taskDir,targetOid,originalStage="unknown"}={}) {
  const c=context(taskDir);
  if (!/^[a-f0-9]{40,64}$/i.test(targetOid??"") || git(c.worktree,["cat-file","-e",`${targetOid}^{commit}`],true).status!==0) throw fail("TARGET_UNAVAILABLE","mini-task target commit is unavailable");
  const source=state(c);
  await inspectWorkspace({root:c.repo,target:c.worktree,baseline:source.head,expectBranch:source.branch});
  const plan={task_id:c.manifest.task_id,worktree_root:c.worktree,target_oid:targetOid,original_stage:originalStage,source,steps:source.files.length?["commit","merge"]:["merge"],created_at:new Date().toISOString()};
  const written=await evidence(c,"mini-resume-plan",plan);
  return {plan,plan_ref:written.evidence_ref,progress_paths:source.files.map(f=>f.path)};
}
export async function confirmAResumePlan({taskDir,planRef,outcome="confirmed",replyText}={}) {
  const c=context(taskDir);planRecord(c,planRef);
  if (outcome!=="confirmed") return evidence(c,"mini-resume-confirmation",{status:"blocked",outcome,plan_ref:planRef,recorded_at:new Date().toISOString()});
  const record=await recordConfirmation({stage:"build-code",decision:"confirmed",reply:replyText,materialRefs:[planRef]},{cwd:c.worktree,dir:join(c.taskDir,"quality","confirmations")});
  return {status:"confirmed",confirmation_ref:record.path,record};
}
export async function authorizeAResumePlan({taskDir,planRef,confirmationRef}={}) {
  const c=context(taskDir),plan=planRecord(c,planRef);confirmation(c,planRef,confirmationRef);
  return plan.steps.map(operation=>nativeAuthorization(c,"record",operation,confirmationRef));
}
export async function resumeTaskA({taskDir,planRef,confirmationRef,signal}={}) {
  const c=context(taskDir),plan=planRecord(c,planRef);confirmation(c,planRef,confirmationRef);
  return withLock(dirname(c.directory),"close.execution",async()=>{
    if(JSON.stringify(state(c))!==JSON.stringify(plan.source))throw fail("SOURCE_BYTES_DRIFT","A progress bytes or HEAD changed after resume planning");
    const grants=Object.fromEntries(plan.steps.map(operation=>[operation,matchingAuthorization(c,operation,confirmationRef)]));
    if(Object.values(grants).some(grant=>grant.value.head!==plan.source.head||grant.value.branch!==plan.source.branch))throw fail("AUTHORIZATION_HEAD_MISMATCH","resume grant is not bound to planned A HEAD and branch");
    let currentHead=plan.source.head;let committed=false;
    const consume=operation=>{
      let grant=grants[operation];
      if(grant.value.head!==currentHead){
        if(operation!=="merge"||!committed)throw fail("AUTHORIZATION_HEAD_MISMATCH","recorded grant does not cover this HEAD");
        const fresh=nativeAuthorization(c,"record",operation,confirmationRef);grant={path:fresh.path,value:JSON.parse(read(fresh.path))};
      }
      const actual=nativeAuthorization(c,"consume",operation,`${planRef}:${operation}`);
      if(actual.authorization_ref!==grant.path||actual.operation!==operation||actual.step_id!==`${planRef}:${operation}`)throw fail("AUTH_SCOPE_CONSUMPTION","native consumer selected a different resume grant");
      const value=JSON.parse(read(actual.authorization_ref));
      if(value.confirmation_ref!==confirmationRef||value.operation!==operation||value.head!==currentHead||value.branch!==plan.source.branch)throw fail("AUTH_SCOPE_CONSUMPTION","consumed resume scope differs from actual operation");
      return actual;
    };
    for(const operation of plan.steps){
      if(signal?.aborted)return evidence(c,"mini-resume-result",{status:"cancelled",plan_ref:planRef,head:currentHead,recorded_at:new Date().toISOString()});
      if(git(c.worktree,["rev-parse","HEAD"])!==currentHead||git(c.worktree,["branch","--show-current"])!==plan.source.branch)throw fail("AUTHORIZATION_HEAD_MISMATCH","A HEAD or branch moved outside this invocation");
      if(operation==="commit"){
        consume("commit");
        git(c.worktree,["add","--",...plan.source.files.map(f=>f.path)]);
        state(c); // Reject a late execution sidecar before the commit.
        git(c.worktree,["commit","-m","mini-task: preserve A progress"]);currentHead=git(c.worktree,["rev-parse","HEAD"]);committed=true;
      }else{
        if(state(c).status!=="")throw fail("SOURCE_DIRTY","A must be clean before merging mini-task target");
        consume("merge");
        try{git(c.worktree,["merge","--no-ff","--no-edit",plan.target_oid]);}
        catch(error){
          if(git(c.worktree,["rev-parse","--verify","MERGE_HEAD"],true).status===0){try{git(c.worktree,["merge","--abort"]);}catch(abortError){throw new AggregateError([error,abortError],"mini merge and abort failed");}}
          return evidence(c,"mini-resume-result",{status:"failed",plan_ref:planRef,error:{code:error.code,message:error.message},head:git(c.worktree,["rev-parse","HEAD"]),recorded_at:new Date().toISOString()});
        }
        currentHead=git(c.worktree,["rev-parse","HEAD"]);
      }
    }
    return evidence(c,"mini-resume-result",{status:"completed",plan_ref:planRef,head:currentHead,next_action:"rerun_original_stage",recorded_at:new Date().toISOString()});
  });
}
async function runReview({taskDir,request,reviewRunner,services={},cwd,signal}={},kind){
  const c=context(taskDir);
  if (reviewRunner === undefined && kind === "mini_task.implementation") {
    const { runMiniTaskCodeReview } = await import("../../../tools/cli/stage-runtime.mjs");
    return runMiniTaskCodeReview({taskDir,request,services,cwd:cwd ?? c.worktree,signal});
  }
  const runner=reviewRunner??(await import("../../wh-review/scripts/wh-review-cli.mjs")).runReviewRecovery;
  if(typeof runner!=="function")throw new TypeError("review runner is unavailable");
  let outcome;
  try{outcome=await runner(request);}catch(error){outcome={status:"unavailable",error:{code:error.code??null,message:error.message}};}
  return evidence(c,"mini-review",{kind,outcome,quality_status:outcome?.status==="unavailable"?"unavailable":"unknown",recorded_at:new Date().toISOString()});
}
export async function runMiniTaskDesignReview(input={}){return runReview(input,"mini_task.design");}
export async function runMiniTaskImplementationReview(input={}){return runReview(input,"mini_task.implementation");}
export function createMiniTaskRunner({taskDir,services={}}={}){
  return Object.freeze({evaluateScope:evaluateMiniTaskScope,runDesignReview:input=>runMiniTaskDesignReview({services,...input,taskDir}),runImplementationReview:input=>runMiniTaskImplementationReview({services,...input,taskDir}),prepareDelivery:input=>prepareMiniTaskDelivery({...input,taskDir}),confirmDelivery:input=>confirmMiniTaskDelivery({...input,taskDir}),authorizeDelivery:input=>authorizeMiniTaskDelivery({...input,taskDir}),executeDelivery:input=>executeMiniTaskDelivery({...input,taskDir}),prepareAResume:input=>prepareAResumePlan({...input,taskDir}),confirmAResume:input=>confirmAResumePlan({...input,taskDir}),authorizeAResume:input=>authorizeAResumePlan({...input,taskDir}),resumeA:input=>resumeTaskA({...input,taskDir})});
}
