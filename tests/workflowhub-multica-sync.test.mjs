import { execFileSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, realpathSync, rmSync, symlinkSync, copyFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { WORKFLOW_STAGES } from '../runtime/stage/stage-registry.mjs';
import {
  auditExitCode,
  buildActionPlan,
  CURRENT_PROMPT_BLOCK,
  promptIssues,
  verifyMainSnapshot,
} from "../skills/workflowhub-multica-sync/scripts/multica-skill-sync.mjs";

const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

describe("workflowhub-multica-sync", () => {
  it("requires the current host-protocol markers without flagging the replacement block as legacy", () => {
    expect(promptIssues(CURRENT_PROMPT_BLOCK)).toEqual({ legacy: [], missing_current: [] });
  });

  it('uses the registry stages and the terminal method instead of a callable retired stage in prompts',()=>{
    for(const stage of WORKFLOW_STAGES)expect(CURRENT_PROMPT_BLOCK).toContain('`'+stage+'`');
    expect(CURRENT_PROMPT_BLOCK).not.toContain('`verify-code`');
    expect(CURRENT_PROMPT_BLOCK).toContain('三阶段');
    expect(CURRENT_PROMPT_BLOCK).toContain('终末');
    expect(promptIssues(CURRENT_PROMPT_BLOCK.replace('三阶段','五阶段')).missing_current).not.toEqual([]);
  });

  it('plans the four current workflow payloads and refuses a retired stage report without mutating online facts',()=>{
    const stageRepo=realpathSync(mkdtempSync(path.join(tmpdir(),'p11-multica-plan-')));
    const git=argv=>execFileSync('git',argv,{cwd:stageRepo,encoding:'utf8',stdio:['ignore','pipe','pipe']});
    try {git(['init','-q','-b','main']);git(['config','user.name','Owned P11']);git(['config','user.email','owned@example.invalid']);mkdirSync(path.join(stageRepo,'runtime/stage'),{recursive:true});writeFileSync(path.join(stageRepo,'runtime/stage/stage-registry.mjs'),readFileSync(path.join(repo,'runtime/stage/stage-registry.mjs')));git(['add','runtime']);git(['commit','-qm','Owned stage authority']);
    const report={repo:stageRepo,skills:WORKFLOW_STAGES.map(name=>({kind:'stage',name,path:'workflows/'+name+'/SKILL.md',status:'missing_online',files:{}})),agents:[],retired_online_skills:[],retired_bindings:[]};
    expect(buildActionPlan(report)).toEqual(WORKFLOW_STAGES.map(name=>({action:'create_skill',name,path:'workflows/'+name+'/SKILL.md'})));
    const retired={...report,skills:[{kind:'stage',name:'verify-code',status:'missing_online',files:{}}]};
    expect(()=>buildActionPlan(retired)).toThrow(/stage|阶段/i);
    expect(()=>buildActionPlan({...report,skills:[{kind:'skill',name:'verify-code',files:{}}]})).toThrow(/stage|阶段/i);
    expect(()=>buildActionPlan({...report,skills:[],agents:[{name:'Code Verifier',binding:{missing:['verify-code']}}]})).toThrow(/stage|阶段/i);
    expect(()=>buildActionPlan({...report,skills:[{kind:'stage',name:'unknown-stage',files:{}}]})).toThrow(/stage|阶段/i);
    const observed={...report,skills:[],retired_online_skills:['verify-code'],retired_bindings:[{agent_name:'Code Verifier',skill_name:'verify-code'}]};
    const before=JSON.stringify(observed);expect(buildActionPlan(observed)).toEqual([]);expect(JSON.stringify(observed)).toBe(before);
    } finally {rmSync(stageRepo,{recursive:true,force:true});}
  });

  it('reads an owned main snapshot with three formal stages plus planning and no retired directory',()=>{
    const dir=realpathSync(mkdtempSync(path.join(tmpdir(),'p11-multica-main-')));
    const git=argv=>execFileSync('git',argv,{cwd:dir,encoding:'utf8',stdio:['ignore','pipe','pipe']});
    try {
      git(['init','-q','-b','main']);git(['config','user.name','Owned P11']);git(['config','user.email','owned@example.invalid']);
      for(const stage of WORKFLOW_STAGES){const base=path.join(dir,'workflows',stage);mkdirSync(base,{recursive:true});for(const file of ['SKILL.md','steps.json','skill-deps.yaml'])writeFileSync(path.join(base,file),'Owned '+stage+' '+file+'\n');}
      mkdirSync(path.join(dir,'runtime/stage'),{recursive:true});writeFileSync(path.join(dir,'runtime/stage/stage-registry.mjs'),readFileSync(path.join(repo,'runtime/stage/stage-registry.mjs')));
      git(['add','workflows','runtime']);git(['commit','-qm','Owned current workflow snapshot']);const commit=git(['rev-parse','HEAD']).trim();
      expect(verifyMainSnapshot(dir,commit,10000)).toMatchObject({main_commit:commit});
      git(['rm','-q','workflows/build-code/steps.json']);git(['commit','-qm','Owned missing current stage input']);
      expect(()=>verifyMainSnapshot(dir,git(['rev-parse','HEAD']).trim(),10000)).toThrow(/快照/);
    } finally {rmSync(dir,{recursive:true,force:true});}
  });

  it('runs the moved skill without repository-relative runtime and reads only the explicit committed snapshot',()=>{
    const dir=realpathSync(mkdtempSync(path.join(tmpdir(),'p11-multica-portable-'))),target=path.join(dir,'selected-repo'),skill=path.join(dir,'moved-skill');
    mkdirSync(target);mkdirSync(path.join(skill,'scripts'),{recursive:true});mkdirSync(path.join(skill,'node_modules'));
    const git=argv=>execFileSync('git',argv,{cwd:target,encoding:'utf8',stdio:['ignore','pipe','pipe']});
    try {
      const require=createRequire(import.meta.url);symlinkSync(path.dirname(require.resolve('js-yaml/package.json')),path.join(skill,'node_modules/js-yaml'));
      const script=path.join(skill,'scripts/multica-skill-sync.mjs');copyFileSync(path.join(repo,'skills/workflowhub-multica-sync/scripts/multica-skill-sync.mjs'),script);
      git(['init','-q','-b','main']);git(['config','user.name','Owned P11']);git(['config','user.email','owned@example.invalid']);
      mkdirSync(path.join(target,'runtime/stage'),{recursive:true});writeFileSync(path.join(target,'runtime/stage/stage-registry.mjs'),readFileSync(path.join(repo,'runtime/stage/stage-registry.mjs')));
      for(const stage of WORKFLOW_STAGES){const base=path.join(target,'workflows',stage);mkdirSync(base,{recursive:true});for(const file of ['SKILL.md','steps.json','skill-deps.yaml'])writeFileSync(path.join(base,file),'Owned current input\n');}
      git(['add','.']);git(['commit','-qm','Owned snapshot']);const commit=git(['rev-parse','HEAD']).trim();
      const run=(selected=commit)=>JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',`import {verifyMainSnapshot} from ${JSON.stringify(pathToFileURL(script).href)};const result=verifyMainSnapshot(${JSON.stringify(target)},${JSON.stringify(selected)},10000);console.log(JSON.stringify(result));`],{cwd:skill,encoding:'utf8',stdio:['ignore','pipe','pipe']}));
      // Reintroducing the observed repository-relative import must fail in the moved skill.
      const portableSource=readFileSync(script,'utf8');writeFileSync(script,"import '../../../runtime/stage/stage-registry.mjs';\n"+portableSource);expect(()=>run()).toThrow();writeFileSync(script,portableSource);
      // Dirty selected-repo source cannot substitute for the committed authority.
      writeFileSync(path.join(target,'runtime/stage/stage-registry.mjs'),'throw new Error("dirty file must not load");');
      expect(run()).toMatchObject({main_commit:commit});
      git(['rm','-q','-f','runtime/stage/stage-registry.mjs']);git(['commit','-qm','Owned missing authority']);expect(()=>run(git(['rev-parse','HEAD']).trim())).toThrow();
      mkdirSync(path.join(target,'runtime/stage'),{recursive:true});writeFileSync(path.join(target,'runtime/stage/stage-registry.mjs'),"export const WORKFLOW_STAGES=['verify-code'];\n");git(['add','runtime']);git(['commit','-qm','Owned incompatible authority']);expect(()=>run(git(['rev-parse','HEAD']).trim())).toThrow();
    } finally {rmSync(dir,{recursive:true,force:true});}
  });

  it('refuses top-level and declaration expressions without executing selected repository code',()=>{
    const dir=realpathSync(mkdtempSync(path.join(tmpdir(),'p11-multica-data-only-'))),marker=path.join(dir,'executed.marker');
    const git=argv=>execFileSync('git',argv,{cwd:dir,encoding:'utf8',stdio:['ignore','pipe','pipe']});
    try {
      git(['init','-q','-b','main']);git(['config','user.name','Owned P11']);git(['config','user.email','owned@example.invalid']);
      mkdirSync(path.join(dir,'runtime/stage'),{recursive:true});
      for(const stage of WORKFLOW_STAGES){const base=path.join(dir,'workflows',stage);mkdirSync(base,{recursive:true});for(const file of ['SKILL.md','steps.json','skill-deps.yaml'])writeFileSync(path.join(base,file),'Owned current input\n');}
      const source=readFileSync(path.join(repo,'runtime/stage/stage-registry.mjs'),'utf8'),write=`writeFileSync(${JSON.stringify(marker)},'executed');`;
      for(const [label,registry] of [
        ['top-level',"import {writeFileSync} from 'node:fs';"+write+'\n'+source],
        ['declaration-expression',"import {writeFileSync} from 'node:fs';\n"+source.replace("MAKE_DECISION: 'make-decision'",`MAKE_DECISION: (()=>{${write}return 'make-decision';})()`)],
      ]) {
        rmSync(marker,{force:true});writeFileSync(path.join(dir,'runtime/stage/stage-registry.mjs'),registry);git(['add','runtime','workflows']);git(['commit','-qm','Owned '+label]);
        let failure;try{verifyMainSnapshot(dir,git(['rev-parse','HEAD']).trim(),10000);}catch(error){failure=error;}
        console.log(JSON.stringify({scenario:'registry-data-only',label,marker_created:existsSync(marker),failure_code:failure?.code??null}));
        expect(existsSync(marker)).toBe(false);expect(failure).toMatchObject({code:'GIT_MAIN_UNREADABLE'});
      }
    } finally {rmSync(dir,{recursive:true,force:true});}
  });

  it("builds one canonical reconciliation plan", () => {
    const report = {
      skills: [{
        name: "managed",
        path: "skills/managed/SKILL.md",
        status: "needs_update",
        primary_mismatch: true,
        files: { missing: ["skill-bundle.json"], mismatched: [], extra: ["stale.md"], protected_extra: [] },
      }, {
        name: "external",
        status: "external_unmanaged",
        primary_mismatch: true,
        files: { missing: [], mismatched: [], extra: ["keep.md"], protected_extra: [] },
      }],
      retired_bindings: [{ agent_name: "Coder", skill_name: "old-skill" }],
      retired_online_skills: ["old-skill"],
      agents: [{ name: "Coder", prompt: { legacy: [], missing_current: [] }, binding: { missing: ["build-code"] } }],
    };

    expect(buildActionPlan(report).map((item) => item.action)).toEqual([
      "update_skill",
      "upsert_file",
      "delete_unreferenced_extra_file",
      "unbind_retired_skill",
      "delete_retired_skill",
      "bind_skill",
    ]);
  });

  it("does not turn warning-only findings into a failed audit", () => {
    const summary = {
      skill_changes: 0,
      agent_changes: 0,
      unconfirmed: 0,
      sync_blockers: [],
      agent_warnings: 3,
    };
    expect(auditExitCode(summary)).toBe(0);
    expect(auditExitCode({ ...summary, skill_changes: 1 })).toBe(2);
    expect(auditExitCode({ ...summary, sync_blockers: ["main_origin_mismatch"] })).toBe(2);
  });

  it("rejects an unreadable current main snapshot instead of trusting rev-parse alone", () => {
    const mainRef = ["main", "origin/main"].find((ref) => {
      try {
        execFileSync("git", ["rev-parse", "--verify", `${ref}^{commit}`], { cwd: repo, stdio: "ignore" });
        return true;
      } catch {
        return false;
      }
    });
    expect(mainRef).toBeTruthy();
    const mainCommit = execFileSync("git", ["rev-parse", "--verify", `${mainRef}^{commit}`], { cwd: repo, encoding: "utf8" }).trim();
    let registry;try {registry=execFileSync("git",["show",`${mainRef}:runtime/stage/stage-registry.mjs`],{cwd:repo,encoding:"utf8",stdio:["ignore","pipe","pipe"]});}catch {expect(()=>verifyMainSnapshot(repo,mainCommit,10000,mainRef)).toThrow(/快照/);return;}
    const current=JSON.parse(execFileSync(process.execPath,["--input-type=module","-e",`const r=await import("data:text/javascript;base64,"+${JSON.stringify(Buffer.from(registry).toString("base64"))});process.stdout.write(JSON.stringify(r.WORKFLOW_STAGES));`],{encoding:"utf8"}));
    if(current.includes("verify-code")) expect(()=>verifyMainSnapshot(repo,mainCommit,10000,mainRef)).toThrow(/快照/);
    else {const snapshot=verifyMainSnapshot(repo,mainCommit,10000,mainRef);expect(snapshot).toMatchObject({main_commit:mainCommit});expect(snapshot.main_tree).toMatch(/^[0-9a-f]{40}$/);}
  });
});
