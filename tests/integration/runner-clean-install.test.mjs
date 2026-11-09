import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, test } from "vitest";
import { buildRunnerRelease, installRunnerRelease, validateRunnerRelease } from "../../runtime/distribution/runner-release.mjs";
import { buildSkillBundleRelease, validateSkillBundleRelease } from "../../runtime/distribution/skill-bundle-release.mjs";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const temps=[];
afterEach(()=>temps.splice(0).forEach(root=>fs.rmSync(root,{recursive:true,force:true})));
async function fixture(){
 const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),"wh-installed-current-")));temps.push(root);
 const releaseRoot=path.join(root,"runner"),skillBundleRoot=path.join(root,"bundle");
 const runner=await buildRunnerRelease({packageRoot:ROOT,outputDir:releaseRoot});
 const bundle=await buildSkillBundleRelease({packageRoot:ROOT,outputDir:skillBundleRoot});
 const env={PATH:process.env.PATH,LANG:"C.UTF-8",HOME:path.join(root,"home"),GIT_CONFIG_NOSYSTEM:"1"};fs.mkdirSync(env.HOME);
 return{root,releaseRoot,skillBundleRoot,runner,bundle,env};
}
function install(f){const calls=[];const result=installRunnerRelease({...f,run(command,args,options){calls.push({command,args,options});return{status:0,stdout:"",stderr:""};}});return{calls,result};}
describe("current Runner and Skill Bundle joint installation",()=>{
 test("N11 local payload keeps the existing public release enumeration and clean installation",async()=>{
  const f=await fixture();
  const git=spawnSync("git",["show","HEAD:runtime/distribution/skill-bundle-release.mjs"],{cwd:ROOT,encoding:"utf8"});
  expect(git.status,git.stderr).toBe(0);
  let prior=git.stdout.slice(0,git.stdout.lastIndexOf("\nif (process.argv[1]"));
  prior=prior.replace(/from "(\.\.[^"]+)"/g,(_,ref)=>`from ${JSON.stringify(new URL(ref,new URL("../../runtime/distribution/skill-bundle-release.mjs",import.meta.url)).href)}`);
  const {createRequire}=await import("node:module");const require=createRequire(import.meta.url);
  prior=prior.replace('from "js-yaml"',`from ${JSON.stringify(new URL(`file://${require.resolve("js-yaml")}`).href)}`);
  const old=await import(`data:text/javascript;base64,${Buffer.from(prior).toString("base64")}`);
  const previousRoot=path.join(f.root,"prior-default");
  const previous=await old.buildSkillBundleRelease({packageRoot:ROOT,outputDir:previousRoot});
  const mappedSource="skills/anysearch/gitignore-template",mappedDestination="skills/anysearch/.gitignore";
  const anysearchManifest="skills/anysearch/skill-bundle.json";
  const expectedPaths=previous.files.map(row=>row.path===mappedSource?mappedDestination:row.path).sort();
  expect(f.bundle.files.map(row=>row.path).sort()).toEqual(expectedPaths);
  expect(f.bundle.files.some(row=>row.path===mappedSource)).toBe(false);
  for(const row of previous.files){
   if(row.path===anysearchManifest)continue;
   const currentPath=row.path===mappedSource?mappedDestination:row.path;
   expect(fs.readFileSync(path.join(f.skillBundleRoot,currentPath)).equals(fs.readFileSync(path.join(previousRoot,row.path))),currentPath).toBe(true);
  }
  const previousAnysearch=JSON.parse(fs.readFileSync(path.join(previousRoot,anysearchManifest),'utf8'));
  const expectedAnysearch={...previousAnysearch,files:previousAnysearch.files.map(entry=>{
   if(!entry||typeof entry!=='object'||!Object.hasOwn(entry,'destination'))return entry;
   const{destination,...normalized}=entry;normalized.path=destination;return normalized;
  })};
  expect(fs.readFileSync(path.join(f.skillBundleRoot,anysearchManifest))).toEqual(Buffer.from(`${JSON.stringify(expectedAnysearch,null,2)}\n`));
  expect(fs.readFileSync(path.join(f.skillBundleRoot,mappedDestination)).equals(fs.readFileSync(path.join(ROOT,mappedSource)))).toBe(true);
  const {resolvePortableStageFiles}=await import("../../runtime/distribution/skill-bundle-release.mjs");
  for(const stage of ["make-decision","build-plan","build-code"]){
   const local=resolvePortableStageFiles({packageRoot:ROOT,stage});
   expect(local.files).toContain(`workflows/${stage}/SKILL.md`);
   expect(local.files).toContain("skills/spec-specify/templates/spec-template.md");
   expect(local.files.some(ref=>/(?:^|\/)(?:node_modules|tests|specs|history)(?:\/|$)/.test(ref))).toBe(false);
  }
  expect(f.bundle.files.some(row=>row.path==="workflows/make-decision/scripts/entry-evaluation.mjs")).toBe(false);
  expect(validateSkillBundleRelease({releaseRoot:f.skillBundleRoot}).skill).toBe("workflowhub");
  const installed=install(f);expect(installed.result.status).toBe(0);
  expect(installed.calls.map(row=>row.command)).toEqual(["npm","git","git","git"]);
 },60000);
 test("copies the real declared closure and imports the installed provider client without external tools",async()=>{
  const f=await fixture();const{calls,result}=install(f);
  expect(result.status).toBe(0);expect(calls.map(c=>c.command)).toEqual(["npm","git","git","git"]);
  expect(calls[0].args).toEqual(["ci","--ignore-scripts","--omit=dev"]);
  expect(calls.every(c=>c.options.cwd===f.releaseRoot&&c.options.env===f.env)).toBe(true);
  expect(f.runner.files.some(e=>e.path.startsWith("node_modules/"))).toBe(false);
  expect(f.runner.files.some(e=>e.path==="package-lock.json")).toBe(true);
  expect(f.runner.files.some(e=>e.path==="runtime/review/schemas/result.schema.json")).toBe(true);
  expect(f.runner.files.some(e=>e.path==="runtime/review/schemas/attempt.schema.json")).toBe(false);
  for(const e of f.bundle.files)expect(fs.readFileSync(path.join(f.releaseRoot,e.path)).equals(fs.readFileSync(path.join(f.skillBundleRoot,e.path)))).toBe(true);
  expect(fs.readFileSync(path.join(f.releaseRoot,".gitignore"),"utf8")).toBe("node_modules/\n");
  const client="skills/wh-review/scripts/review-provider-client.mjs";
  const child=spawnSync(process.execPath,["--input-type=module","-e",`await import(${JSON.stringify(path.join(f.releaseRoot,client))});console.log('installed-import-ok')`],{cwd:f.releaseRoot,env:f.env,encoding:"utf8"});
  expect(child.status,child.stderr).toBe(0);expect(child.stdout.trim()).toBe("installed-import-ok");
  expect(validateRunnerRelease({releaseRoot:f.releaseRoot,skillBundleManifest:f.bundle})).toMatchObject({release:"workflowhub-runner"});
  // npm/Git are recorded private seams here; this is actual publication/file merge/import, not network installation.
 },60000);
 test("installed normal caller writes a draft and reads checker, review and handoff dependencies",async()=>{
  const f=await fixture();
  // Exercise the real existing installer, with cached production dependencies only.
  const env={...process.env,npm_config_offline:"true",npm_config_audit:"false",npm_config_fund:"false"};
  expect(installRunnerRelease({...f,env}).status).toBe(0);
  expect(fs.readFileSync(path.join(f.releaseRoot,"skill-bundle.json"),"utf8")).toBe(fs.readFileSync(path.join(f.skillBundleRoot,"skill-bundle.json"),"utf8"));
  const cwd=path.join(f.root,"consumer");
  const git=spawnSync("git",["worktree","add","-q","-b","normal-consumer",cwd],{cwd:f.releaseRoot,env,encoding:"utf8"});
  expect(git.status,git.stderr).toBe(0);
  const installed=relative=>path.join(f.releaseRoot,relative);
  const {createTask}=await import(installed("runtime/task/task-handle.mjs"));
  const baseline=spawnSync("git",["rev-parse","HEAD"],{cwd,encoding:"utf8"}).stdout.trim();
  const storageRoot=path.join(cwd,".task-storage");fs.mkdirSync(storageRoot);
  const task=await createTask({storageRoot,manifest:{schema_version:"1.0.0",project_name:"fixture",task_id:"normal-caller",created_at:new Date().toISOString(),target_repo_root:f.releaseRoot,activation_cohort:"post",write_resolution_source:"existing",baseline_commit:baseline,workspace_mode:"existing",workspace_root:cwd,issue_ids:[],inputs:{},execution_mode:"per_invocation",record_model:"vnext-single-write"}});
  const input=path.join(cwd,"draft-input.md"),text="# Installed normal draft\n";fs.writeFileSync(input,text);
  const run=(file,args=[])=>spawnSync(process.execPath,[installed(file),...args],{cwd,env:{...env,WORKFLOWHUB_TASK_DIR:storageRoot},encoding:"utf8"});
  const draft=run("tools/cli/stage-runtime.mjs",["run","--action=draft","--stage=build-plan","--project=fixture","--task=normal-caller","--name=spec.md",`--input=${input}`]);
  expect(draft.status,draft.stderr||draft.stdout).toBe(0);
  expect(fs.readFileSync(path.join(cwd,"specs/normal-caller/spec.md"),"utf8")).toBe(text);
  const review=run("skills/wh-review/scripts/wh-review-cli.mjs",["doctor"]);
  expect(review.status,review.stderr||review.stdout).toBe(0);
  const {appendRecord}=await import(installed("runtime/interface/safe-write.mjs"));
  const record=await appendRecord(task.taskPath,"installed-handoff","md","handoff probe\n");
  expect(fs.readFileSync(record,"utf8")).toBe("handoff probe\n");
  const checker=run("tools/cli/check-stage-steps.mjs",["--json","--stage=build-plan",`--task-path=${task.taskPath}`]);
  // An incomplete draft must stay incomplete, while its installed definition is available.
  const report=JSON.parse(checker.stdout);
  expect(report.stages.find(row=>row.stage==="build-plan").definition).toBe("available");
  expect(report.stages.find(row=>row.stage==="build-plan").steps.some(row=>row.state!=="completed")).toBe(true);
  const checkerPath=installed("tools/cli/check-stage-steps.mjs");fs.rmSync(checkerPath);
  expect(run("tools/cli/check-stage-steps.mjs").status).not.toBe(0);
  expect(()=>validateRunnerRelease({releaseRoot:f.releaseRoot,skillBundleManifest:f.bundle})).toThrow();
  fs.copyFileSync(path.join(ROOT,"tools/cli/check-stage-steps.mjs"),checkerPath);
  fs.rmSync(installed("workflows/build-plan/steps.json"));
  const missing=run("tools/cli/check-stage-steps.mjs",["--json","--stage=build-plan",`--task-path=${task.taskPath}`]);
  // This existing checker is report-only: definition availability, not exit 0, is the result.
  expect(missing.status).toBe(0);
  expect(JSON.parse(missing.stdout).stages.find(row=>row.stage==="build-plan").definition).toBe("unavailable");
  expect(()=>validateRunnerRelease({releaseRoot:f.releaseRoot,skillBundleManifest:f.bundle})).toThrow();
  fs.rmSync(path.join(f.skillBundleRoot,"skills/ui-copy-discipline/SKILL.md"));
  expect(()=>validateSkillBundleRelease({releaseRoot:f.skillBundleRoot})).toThrow();
 },60000);
 test("installed build-code caller executes scoped aggregate and acceptance checks",async()=>{
  const f=await fixture(),env={...process.env,npm_config_offline:"true",npm_config_audit:"false",npm_config_fund:"false"};
  expect(installRunnerRelease({...f,env}).status).toBe(0);
  const cwd=path.join(f.root,"engineering"),storageRoot=path.join(f.root,"storage");fs.mkdirSync(storageRoot);
  const git=spawnSync("git",["worktree","add","-q","-b","engineering-consumer",cwd],{cwd:f.releaseRoot,env,encoding:"utf8"});expect(git.status,git.stderr).toBe(0);
  const installed=relative=>path.join(f.releaseRoot,relative),run=(file,args=[])=>spawnSync(process.execPath,[installed(file),...args],{cwd,env,encoding:"utf8"});
  const {createTask}=await import(installed("runtime/task/task-handle.mjs"));
  const head=spawnSync("git",["rev-parse","HEAD"],{cwd,encoding:"utf8"}).stdout.trim();
  const task=await createTask({storageRoot,manifest:{schema_version:"1.0.0",project_name:"fixture",task_id:"installed-engineering",created_at:new Date().toISOString(),target_repo_root:f.releaseRoot,activation_cohort:"post",write_resolution_source:"existing",baseline_commit:head,workspace_mode:"existing",workspace_root:cwd,issue_ids:[],inputs:{},execution_mode:"per_invocation",record_model:"vnext-single-write"}});
  // Always use the task-scoped branch, never runAggregate's repository checks.
  const aggregate=run("tools/cli/run-checks.mjs",["--task-path",task.taskPath]);
  expect(aggregate.status,aggregate.stderr).toBe(0);
  const report=JSON.parse(aggregate.stdout);expect(report.rings).toHaveLength(10);
  expect(report.missing_steps.length).toBeGreaterThan(0);expect(report.steps_unattested.length).toBeGreaterThan(0);
  const spec=path.join(cwd,"acceptance-fixture.md"),context=path.join(cwd,"acceptance-context.json");
  fs.writeFileSync(spec,'# Fixture\n\n### 验收对象\n\n```json\n'+JSON.stringify({workspace:cwd,service:"fixture only",route:"/fixture",state:"ready",viewport:"1440x900"})+'\n```\n');
  fs.writeFileSync(path.join(cwd,"source.txt"),"owned source\n");
  fs.writeFileSync(context,JSON.stringify({sources:{design_source:"./source.txt"}}));
  const args=["--spec",spec,"--context",context,"--root",cwd,"--check-sources"];
  const accepted=run("tools/cli/check-acceptance-object.mjs",args);expect(accepted.status,accepted.stderr).toBe(0);expect(JSON.parse(accepted.stdout).ok).toBe(true);
  fs.unlinkSync(path.join(cwd,"source.txt"));const missing=run("tools/cli/check-acceptance-object.mjs",args);expect(missing.status).toBe(1);expect(JSON.parse(missing.stdout).missing_source_files).toEqual([{key:"design_source",path:"./source.txt"}]);
  expect(run("tools/cli/check-acceptance-object.mjs",["--invalid"]).status).toBe(2);
  const vocabularyPath="runtime/evidence/acceptance-evidence-validator.mjs",vocabulary=await import(installed(vocabularyPath));
  expect(fs.readFileSync(installed(vocabularyPath)).equals(fs.readFileSync(path.join(ROOT,vocabularyPath)))).toBe(true);
  expect(()=>vocabulary.validateAcceptanceEvidence(null)).toThrow();
  expect(fs.readFileSync(installed("docs/standard-workflow.md"),"utf8")).toBe(fs.readFileSync(path.join(ROOT,"docs/standard-workflow.md"),"utf8"));
  for(const relative of ["tools/cli/run-checks.mjs","tools/cli/check-acceptance-object.mjs","runtime/evidence/acceptance-evidence-validator.mjs","docs/standard-workflow.md","metrics/record-schema.mjs"]){
   const target=installed(relative),bytes=fs.readFileSync(target);fs.unlinkSync(target);
   expect(()=>validateRunnerRelease({releaseRoot:f.releaseRoot,skillBundleManifest:f.bundle})).toThrow();
   if(relative==="metrics/record-schema.mjs"){
    const broken=run("tools/cli/run-checks.mjs",["--task-path",task.taskPath]);expect(broken.status).not.toBe(0);expect(broken.stderr).toContain("record-schema.mjs");expect(broken.stderr).toContain("ERR_MODULE_NOT_FOUND");
   }
   fs.writeFileSync(target,bytes);
  }
 },60000);
 test.each(["same-byte-symlink","dangling-symlink","directory"])("rejects unsafe installed Bundle manifest %s before commands",async defect=>{
  const f=await fixture(),target=path.join(f.releaseRoot,"skill-bundle.json"),source=path.join(f.skillBundleRoot,"skill-bundle.json");
  if(defect==="directory")fs.mkdirSync(target);
  else fs.symlinkSync(defect==="same-byte-symlink"?source:path.join(f.root,"missing.json"),target);
  const calls=[];
  expect(()=>installRunnerRelease({...f,run(...args){calls.push(args);return{status:0,stdout:"",stderr:""};}})).toThrow(/installed Skill Bundle manifest is missing or unsafe/);
  expect(calls).toEqual([]);
  expect(()=>validateSkillBundleRelease({releaseRoot:f.skillBundleRoot})).not.toThrow();
 },60000);
 test("rejects an installed Bundle manifest replaced during dependency installation",async()=>{
  const f=await fixture(),target=path.join(f.releaseRoot,"skill-bundle.json"),commands=[];
  expect(()=>installRunnerRelease({...f,run(command){commands.push(command);fs.unlinkSync(target);fs.symlinkSync(path.join(f.skillBundleRoot,"skill-bundle.json"),target);return{status:0,stdout:"",stderr:""};}})).toThrow(/installed Skill Bundle manifest is missing or unsafe/);
  expect(commands).toEqual(["npm"]);
  expect(fs.existsSync(path.join(f.releaseRoot,".gitignore"))).toBe(false);
 },60000);
 test.each(["../outside.json","/absolute.json","flows\\outside.json"])("rejects unsafe flow data locator %s without output escape",async locator=>{
  const f=await fixture(),definition=path.join(f.releaseRoot,"workflows/make-decision/steps.json");
  const data=JSON.parse(fs.readFileSync(definition,"utf8"));data.flows={bad:{steps:locator}};fs.writeFileSync(definition,JSON.stringify(data));
  const source=path.join(f.releaseRoot,locator);fs.mkdirSync(path.dirname(source),{recursive:true});fs.writeFileSync(source,"owned path boundary sentinel\n");
  const outputDir=path.join(f.root,"nested/output"),outside=path.join(f.root,"nested/outside.json");
  let error;try{await buildRunnerRelease({packageRoot:f.releaseRoot,outputDir});}catch(cause){error=cause;}
  expect(fs.existsSync(outside)).toBe(false);
  expect(error?.message).toMatch(/runner flow data path is invalid/);
  expect(fs.readFileSync(source,"utf8")).toBe("owned path boundary sentinel\n");
 },60000);
 test.each(["runner-manifest","bundle-manifest","missing-runner-file","missing-bundle-file","shared-bytes","major"])("rejects %s before invoking installation commands",async defect=>{
  const f=await fixture();const locator="skills/spec-plan/templates/phase-template.md";
  if(defect==="runner-manifest")fs.rmSync(path.join(f.releaseRoot,"runner-release.json"));
  if(defect==="bundle-manifest")fs.rmSync(path.join(f.skillBundleRoot,"skill-bundle.json"));
  if(defect==="missing-runner-file")fs.rmSync(path.join(f.releaseRoot,"runtime/interface/runtime-facade.mjs"));
  if(defect==="missing-bundle-file")fs.rmSync(path.join(f.skillBundleRoot,locator));
  if(defect==="shared-bytes")fs.appendFileSync(path.join(f.skillBundleRoot,"skills/wh-review/scripts/review-provider-client.mjs"),"\n// divergent installed bytes\n");
  if(defect==="major"){const p=path.join(f.skillBundleRoot,"skill-bundle.json");const m=JSON.parse(fs.readFileSync(p));m.runner_contract_major=2;fs.writeFileSync(p,JSON.stringify(m));}
  const calls=[];
  expect(()=>installRunnerRelease({...f,run(...args){calls.push(args);return{status:0,stdout:"",stderr:""};}})).toThrow(/manifest is missing|missing or unsafe|schema is invalid|shared file|major mismatch/);
  expect(calls).toEqual([]);expect(fs.existsSync(path.join(f.releaseRoot,".gitignore"))).toBe(false);
 },60000);
 test("rejects malformed file names and ordinary incompatible release versions",async()=>{
  const f=await fixture();expect(()=>validateRunnerRelease({releaseRoot:f.releaseRoot,skillBundleManifest:{runner_contract_major:2,runner_contract_min_minor:0}})).toThrow(/major mismatch/);
  const p=path.join(f.releaseRoot,"runner-release.json");const m=JSON.parse(fs.readFileSync(p));m.files.push({path:"../outside"});fs.writeFileSync(p,JSON.stringify(m));
  expect(()=>validateRunnerRelease({releaseRoot:f.releaseRoot,skillBundleManifest:f.bundle})).toThrow(/file manifest is invalid/);
  expect(validateSkillBundleRelease({releaseRoot:f.skillBundleRoot})).toMatchObject({skill:"workflowhub"});
 },60000);
});
