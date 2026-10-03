#!/usr/bin/env node
/** Create/open ordinary task metadata using workspace checks and atomic writes. */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { constants, closeSync, fstatSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { resolveCanonicalTaskPath } from "../../runtime/task/load-config.mjs";
import { resolveStorageRootDetails } from "../../runtime/evidence/storage-root.mjs";
import { initializeTaskStore } from "../../runtime/task/task-store.mjs";
import { inspectWorkspace } from "../../runtime/interface/workspace-check.mjs";
import { createFileOnce } from "../../runtime/interface/safe-write.mjs";

const sha256 = value => createHash("sha256").update(value).digest("hex");
const plain = value => value && typeof value === "object" && !Array.isArray(value);
function git(cwd, argv) {
  const env = {...process.env}; for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key];
  return String(execFileSync("git", argv, {cwd,env,encoding:"utf8",stdio:["ignore","pipe","pipe"]})).trim();
}
function directory(path, {create=false}={}) {
  if (typeof path!=="string" || !isAbsolute(path)) throw new TypeError("directory must be absolute");
  let current="/";
  for (const part of resolve(path).split("/").filter(Boolean)) {
    current=join(current,part); let stat;
    try {stat=lstatSync(current);} catch(error) {
      if (error.code!=="ENOENT" || !create) throw error;
      mkdirSync(current,{mode:0o700});stat=lstatSync(current);
    }
    const systemAlias=process.platform==="darwin" && ((current==="/tmp" && realpathSync(current)==="/private/tmp") || (current==="/var" && realpathSync(current)==="/private/var"));
    if ((!systemAlias && stat.isSymbolicLink()) || (!stat.isDirectory() && !systemAlias)) throw new Error("task storage/workspace directory alias or non-directory");
    const real=realpathSync(current),after=lstatSync(current);
    if(after.dev!==stat.dev || after.ino!==stat.ino) throw new Error("directory replaced during bootstrap");
    current=real;
  }
  return current;
}
function readManifest(root) {
  directory(root);const file=join(root,"task.json"),named=lstatSync(file);
  if(!named.isFile() || named.isSymbolicLink() || named.nlink!==1) throw new Error("task manifest must be a single-link regular file");
  const fd=openSync(file,constants.O_RDONLY|constants.O_NOFOLLOW);
  try { const opened=fstatSync(fd);if(opened.dev!==named.dev || opened.ino!==named.ino)throw new Error("task manifest changed while opening");
    const value=JSON.parse(readFileSync(fd,"utf8")),after=lstatSync(file);
    if(after.dev!==opened.dev || after.ino!==opened.ino || after.isSymbolicLink() || after.nlink!==1) throw new Error("task manifest replaced while reading");
    return value;
  } finally {closeSync(fd);}
}
function linkedTarget(target) {
  const dotGit = lstatSync(join(target, ".git"));
  if (dotGit.isSymbolicLink() || (!dotGit.isFile() && !dotGit.isDirectory()) || (dotGit.isFile() && dotGit.nlink !== 1)) {
    throw new Error("target Git metadata must be a real directory or single-link file");
  }
  return dotGit.isFile();
}
async function workspace(target, root, branch) {
  const checked=await inspectWorkspace({root:target,target:root,baseline:"HEAD",...(branch?{expectBranch:branch}:{})});
  const dotGit=lstatSync(join(root,".git"));
  if(!dotGit.isFile() || dotGit.isSymbolicLink() || dotGit.nlink!==1) throw new Error("task requires a registered linked parallel worktree");
  if(realpathSync(resolve(root,git(root,["rev-parse","--git-common-dir"])))!==realpathSync(resolve(target,git(target,["rev-parse","--git-common-dir"])))) throw new Error("task workspace differs from target Git repository");
  return checked;
}
function requirementInputs(file) {
  const inputs=file?JSON.parse(readFileSync(file,"utf8")):{};
  const safeRef=ref=>typeof ref==="string" && ref.startsWith("quality/evidence/") && ref.slice(17).split("/").every(s=>/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(s));
  const validRecord=r=>plain(r) && Object.keys(r).every(k=>["ref","sha256","content"].includes(k)) && safeRef(r.ref) && r.ref.startsWith("quality/evidence/raw-requirements/") && /^[a-f0-9]{64}$/.test(r.sha256??"") && typeof r.content==="string" && sha256(r.content)===r.sha256;
  const validRaw=r=>plain(r) && Object.keys(r).every(k=>["ref","sha256","records"].includes(k)) && safeRef(r.ref) && /^[a-f0-9]{64}$/.test(r.sha256??"") && (r.records===undefined || Array.isArray(r.records) && r.records.length>0 && r.records.every(validRecord) && new Set(r.records.map(x=>x.ref)).size===r.records.length && r.records.some(x=>x.ref===r.ref && x.sha256===r.sha256));
  if(!plain(inputs) || Object.entries(inputs).some(([k,v])=>!["decision","spec","build_plan","raw_requirement"].includes(k) || (k==="raw_requirement"?!validRaw(v):typeof v!=="string" || !isAbsolute(v)))) throw new TypeError("invalid bootstrap material inputs or raw requirement source bytes");
  return inputs;
}
export async function bootstrapTask(values,{env=process.env,home}={}) {
  const existing=Object.hasOwn(values,"task-path");
  const allowed=new Set(existing?["task-path","project","task"]:["project","task","target-repo","workspace-root","inputs","issues"]);
  for(const key of Object.keys(values)) if(!allowed.has(key))throw new TypeError(`unsupported bootstrap argument --${key}`);
  for(const key of existing?["task-path","project","task"]:["project","task","target-repo"]) if(typeof values[key]!=="string" || !values[key].trim())throw new TypeError(`--${key} is required`);
  const resolution=resolveCanonicalTaskPath({project:values.project,task:values.task,...(existing?{taskPath:values["task-path"]}:{}),env,home});
  if(existing) {
    const root=directory(resolution.taskPath),manifest=readManifest(root);
    if(!plain(manifest) || manifest.project_name!==resolution.project || manifest.task_id!==resolution.task)throw new Error("task manifest identity mismatch");
    if(manifest.activation_cohort!=="post")throw new Error("pre/history task is read-only; bootstrap cannot initialize or rewrite its records");
    const target=directory(manifest.target_repo_root);
    const existingWorkspace=manifest.workspace_mode==="existing" || (manifest.workspace_mode===undefined && linkedTarget(target));
    const worktree=manifest.workspace_mode==="existing"?directory(manifest.workspace_root):existingWorkspace?target:resolve(dirname(target),`${basename(target)}-${resolution.task}`);
    await workspace(target,worktree,existingWorkspace?null:`task/${resolution.project}/${resolution.task}`);
    await initializeTaskStore(root,{taskId:resolution.task});
    return Object.freeze({task_path:root,project:resolution.project,task:resolution.task,task_path_source:resolution.source});
  }
  const target=directory(resolve(values["target-repo"]));
  // This rejects nested and non-Git targets before task metadata or worktree writes.
  await inspectWorkspace({root:target,target,baseline:"HEAD"});
  const inputs=requirementInputs(values.inputs);
  const supplied=values["workspace-root"]!==undefined;
  // A user-supplied linked target already is the trusted existing parallel
  // worktree. Preserve the original physical resolver meaning, without
  // creating a sibling or normalizing the user's merge target/branch.
  const existingWorkspace=supplied || linkedTarget(target);
  const worktree=supplied?directory(resolve(values["workspace-root"])):existingWorkspace?target:resolve(dirname(target),`${basename(target)}-${resolution.task}`);
  const branch=`task/${resolution.project}/${resolution.task}`;
  let physical;
  if(existingWorkspace) physical=await workspace(target,worktree,null);
  else {
    let exists;try{lstatSync(worktree);exists=true;}catch(error){if(error.code!=="ENOENT")throw error;exists=false;}
    let branchExists;try{git(target,["show-ref","--verify","--quiet",`refs/heads/${branch}`]);branchExists=true;}catch(error){if(error.status!==1)throw error;branchExists=false;}
    if(exists!==branchExists)throw new Error("deterministic task worktree path/branch conflict");
    if(!exists)git(target,["worktree","add","-b",branch,worktree,"HEAD"]);
    physical=await workspace(target,directory(worktree),branch);
  }
  const storage=resolveStorageRootDetails({env,home});
  const taskPath=directory(resolution.taskPath,{create:true});
  const manifest={schema_version:"1.0.0",execution_mode:"per_invocation",record_model:"vnext-single-write",project_name:resolution.project,task_id:resolution.task,created_at:new Date().toISOString(),target_repo_root:target,activation_cohort:"post",write_resolution_source:storage.selected_source,baseline_commit:physical.head,...(existingWorkspace?{workspace_mode:"existing",workspace_root:worktree}:{}),issue_ids:values.issues?values.issues.split(",").filter(Boolean):[],inputs:inputs.raw_requirement?{...inputs,raw_requirement:{ref:inputs.raw_requirement.ref,sha256:inputs.raw_requirement.sha256}}:inputs};
  await createFileOnce(taskPath,"task.json",JSON.stringify(manifest,null,2)+"\n");
  await initializeTaskStore(taskPath,{taskId:resolution.task});
  for(const record of inputs.raw_requirement?.records??[]) {
    directory(dirname(join(taskPath,record.ref)),{create:true});
    await createFileOnce(taskPath,record.ref,record.content);
  }
  return Object.freeze({task_path:taskPath,project:resolution.project,task:resolution.task,task_path_source:resolution.source,storage_root:resolution.storage_root,workspace:Object.freeze({worktree_root:worktree,branch:physical.branch,baseline_commit:physical.head})});
}
function args(argv) {const values={};for(const item of argv){const at=item.indexOf("=");if(!item.startsWith("--")||at<3||Object.hasOwn(values,item.slice(2,at)))throw new TypeError(`invalid/duplicate argument: ${item}`);values[item.slice(2,at)]=item.slice(at+1);}return values;}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  bootstrapTask(args(process.argv.slice(2))).then(value=>process.stdout.write(JSON.stringify(value,null,2)+"\n")).catch(error=>{process.stderr.write(`${error?.stack??error}\n`);process.exitCode=1;});
}
