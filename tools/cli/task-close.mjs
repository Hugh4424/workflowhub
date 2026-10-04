#!/usr/bin/env node
import { readFileSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { resolveCanonicalTaskPath } from "../../runtime/task/load-config.mjs";
import { prepareDeliveryClosePlan, confirmClosePlan, authorizeClosePlan, executeClosePlan, inspectDeliveryCloseState, closeDelivery } from "../../core/task-close.mjs";

function args(argv) {
  const [command,...rest]=argv;const values={};
  for(const arg of rest){const i=arg.indexOf("=");if(!arg.startsWith("--")||i<3)throw new TypeError(`invalid argument: ${arg}`);const key=arg.slice(2,i);if(key in values)throw new TypeError(`duplicate --${key}`);values[key]=arg.slice(i+1);}
  return {command,values};
}
function required(values,name){if(!values[name])throw new TypeError(`--${name} is required`);return values[name];}
function metadataGit(cwd,argv){const env={...process.env};for(const key of Object.keys(env))if(key.startsWith("GIT_"))delete env[key];env.GIT_OPTIONAL_LOCKS="0";return execFileSync("git",argv,{cwd,env,encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();}
export async function taskCloseMain(argv=process.argv.slice(2),{cwd=process.cwd(),signal}={}){
  const {command,values}=args(argv);
  if(!["prepare","confirm","execute","manual-close","complete","status","close"].includes(command))throw new TypeError("usage: task-close.mjs prepare|confirm|execute|manual-close|complete|status|close --project=... --task=... [--plan-ref=...]");
  const allowed=new Set(["project","task","task-path","plan-ref","confirmation-ref","task-branch","target-branch","task-commit","remote","spec-source","spec-archive","mode","close-mode","decision","reply-text","step-slug","operations","archive"]);
  if(Object.keys(values).some(key=>!allowed.has(key)))throw new TypeError("unknown close option; old plan-hash/receipt bindings are retired");
  const project=required(values,"project"),task=required(values,"task");
  const path=resolveCanonicalTaskPath({project,task,taskPath:values["task-path"],env:process.env,home:process.env.HOME});
  const taskDir=path.taskPath;const manifest=JSON.parse(readFileSync(resolve(taskDir,"task.json"),"utf8"));
  if(manifest.project_name!==project||manifest.task_id!==task)throw new Error("task.json identity differs from CLI");
  if(command!=="status"){
    const top=realpathSync(metadataGit(cwd,["rev-parse","--show-toplevel"]));
    const permitted=new Set([realpathSync(manifest.target_repo_root),...(manifest.workspace_root?[realpathSync(manifest.workspace_root)]:[])]);
    if(!manifest.workspace_root){const wanted=`refs/heads/task/${project}/${task}`;const rows=metadataGit(manifest.target_repo_root,["worktree","list","--porcelain","-z"]).split("\0\0");for(const row of rows)if(row.split("\0").includes(`branch ${wanted}`)){const worktree=row.split("\0").find(line=>line.startsWith("worktree "));if(worktree)permitted.add(realpathSync(worktree.slice(9)));}}
    if(!permitted.has(top)||realpathSync(resolve(cwd))!==top)throw Object.assign(new Error("close must run from this task's actual worktree or target root"),{code:"CLOSE_CWD_MISMATCH"});
  }
  const delivery={remote:values.remote??"origin",target_branch:values["target-branch"]??"main",...(values["task-branch"]?{task_branch:values["task-branch"]}:{}),...(values["spec-source"]?{spec_source_path:values["spec-source"]}:{}),...(values["spec-archive"]?{spec_archive_path:values["spec-archive"]}:{})};
  const closeMode=values.mode??values["close-mode"];
  if(command==="prepare")return prepareDeliveryClosePlan({taskDir,delivery,closeMode,...(values.archive?{archiveDeclarationRef:values.archive,priorPlanRef:required(values,"plan-ref")}:{})});
  if(command==="close")return closeDelivery({taskDir,delivery,closeMode,replyText:required(values,"reply-text"),signal,...(values.archive?{archiveDeclarationRef:values.archive,priorPlanRef:required(values,"plan-ref")}:{})});
  if(command==="status")return inspectDeliveryCloseState({taskDir,planRef:values["plan-ref"]});
  const planRef=required(values,"plan-ref");
  if(command==="confirm")return confirmClosePlan({taskDir,planRef,outcome:required(values,"decision"),replyText:values["reply-text"]});
  if(command==="complete")return inspectDeliveryCloseState({taskDir,planRef});
  if(command==="manual-close"){
    // An existing confirmed reply records covered operation scope; no quality
    // override or synthesized risk acceptance is created by this route.
    return authorizeClosePlan({taskDir,planRef,confirmationRef:required(values,"confirmation-ref"),...(values.operations?{operations:JSON.parse(values.operations)}:{})});
  }
  return executeClosePlan({taskDir,planRef,confirmationRef:required(values,"confirmation-ref"),signal});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const controller=new AbortController();let cancelledExit=130;const cancel=name=>()=>{if(!controller.signal.aborted){cancelledExit=name==="SIGTERM"?143:130;controller.abort(new Error(`close interrupted by ${name}`));}};
  const int=cancel("SIGINT"),term=cancel("SIGTERM");process.on("SIGINT",int);process.on("SIGTERM",term);
  taskCloseMain(process.argv.slice(2),{signal:controller.signal}).then(result=>{process.stdout.write(`${JSON.stringify(result,null,2)}\n`);process.exitCode=result?.status==="failed"||result?.status==="blocked"?1:result?.status==="cancelled"?cancelledExit:0;}).catch(error=>{process.stderr.write(`${JSON.stringify({code:error.code??null,message:error.message})}\n`);process.exitCode=1;}).finally(()=>{process.removeListener("SIGINT",int);process.removeListener("SIGTERM",term);});
}
