// MT6-024 SURVIVOR: explicit ordinary root behavior follows current tool①;
// the orphan resolve-path adapter is retired, with no replacement alias.
import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inspectWorkspace } from "../../runtime/interface/workspace-check.mjs";
const roots=[];afterEach(()=>{while(roots.length)rmSync(roots.pop(),{recursive:true,force:true});});
const inspector=new URL("../../runtime/interface/workspace-check.mjs",import.meta.url).href;
function fixture(){const root=realpathSync(mkdtempSync(join(tmpdir(),"workflowhub-explicit-root-")));roots.push(root);const repo=join(root,"repo");mkdirSync(repo);const git=args=>{const env={...process.env};for(const key of Object.keys(env))if(key.startsWith("GIT_"))delete env[key];return execFileSync("git",args,{cwd:repo,env,encoding:"utf8",stdio:["ignore","pipe","pipe"]});};git(["init","-q","-b","main"]);git(["config","user.name","Owned explicit root"]);git(["config","user.email","owned@test.invalid"]);writeFileSync(join(repo,"README.md"),"owned physical root\n");git(["add","README.md"]);git(["commit","-qm","owned baseline"]);return{root,repo,head:String(git(["rev-parse","HEAD"])).trim()};}
const input=f=>({target:f.repo,baseline:"HEAD"});
function child(f,{cwd=f.root,root,includeRoot=false,env={}}={}){const params={...input(f),...(includeRoot?{root}: {})};const code=`import{inspectWorkspace}from ${JSON.stringify(inspector)};try{const result=await inspectWorkspace(${JSON.stringify(params)});process.stdout.write(JSON.stringify({ok:true,registered:result.registered,branch:result.branch,head:result.head}));}catch(error){process.stdout.write(JSON.stringify({ok:false,code:error.code,message:error.message}));}`;return JSON.parse(execFileSync(process.execPath,["--input-type=module","-e",code],{cwd,env:{...process.env,...env},encoding:"utf8",stdio:["ignore","pipe","pipe"]}));}
describe("current tool① explicit physical root",()=>{
 it("reads real registered/branch/HEAD facts for the explicitly supplied absolute owned repository",async()=>{const f=fixture(),r=await inspectWorkspace({...input(f),root:f.repo});expect(r.registered).toBe(true);expect(r.branch).toBe("main");expect(r.head).toBe(f.head);});
 it("accepts an existing explicit registered Git root without guessing another directory",async()=>{const f=fixture(),r=await inspectWorkspace({...input(f),root:f.repo,expectBranch:"main"});expect(r.registered).toBe(true);expect(r.head).toBe(f.head);expect(r.branch).toBe("main");});
 it("requires an explicit root even when other physical arguments are present",async()=>{const f=fixture();await expect(inspectWorkspace(input(f))).rejects.toMatchObject({code:"INVALID_ARGUMENT",message:"root is required"});});
 it("rejects explicit undefined root",async()=>{const f=fixture();await expect(inspectWorkspace({...input(f),root:undefined})).rejects.toMatchObject({code:"INVALID_ARGUMENT",message:"root is required"});});
 it("rejects explicit null root",async()=>{const f=fixture();await expect(inspectWorkspace({...input(f),root:null})).rejects.toMatchObject({code:"INVALID_ARGUMENT",message:"root is required"});});
 it("rejects empty root rather than falling back to cwd",async()=>{const f=fixture();await expect(inspectWorkspace({...input(f),root:""})).rejects.toMatchObject({code:"INVALID_ARGUMENT",message:"root is required"});});
 it("surfaces the missing explicit root diagnostic before inspecting cwd",()=>{const f=fixture(),r=child(f,{cwd:f.repo});expect(r).toEqual({ok:false,code:"INVALID_ARGUMENT",message:"root is required"});});
 it("does not infer root from a REPO_ROOT variable",()=>{const f=fixture(),r=child(f,{env:{REPO_ROOT:f.repo}});expect(r).toEqual({ok:false,code:"INVALID_ARGUMENT",message:"root is required"});});
 it("does not return a different REPO_ROOT sentinel when root is absent",()=>{const f=fixture(),sentinel=join(f.root,"non-repository-sentinel"),r=child(f,{env:{REPO_ROOT:sentinel}});expect(r.ok).toBe(false);expect(r.code).toBe("INVALID_ARGUMENT");expect(r.message).toBe("root is required");});
 it("uses the explicit owned root instead of REPO_ROOT",()=>{const f=fixture(),r=child(f,{includeRoot:true,root:f.repo,env:{REPO_ROOT:join(f.root,"foreign-sentinel")}});expect(r).toEqual({ok:true,registered:true,branch:"main",head:f.head});});
 it("does not crawl to a Git ancestor from an actual deep child cwd when root is missing",()=>{const f=fixture(),deep=join(f.repo,"deep","nested");mkdirSync(deep,{recursive:true});const r=child(f,{cwd:deep});expect(r).toEqual({ok:false,code:"INVALID_ARGUMENT",message:"root is required"});});
 it("resolves a caller-supplied relative owned root without substituting a crawled ancestor",()=>{const f=fixture(),r=child(f,{cwd:f.root,includeRoot:true,root:"repo"});expect(r).toEqual({ok:true,registered:true,branch:"main",head:f.head});});
});
