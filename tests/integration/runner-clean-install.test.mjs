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
