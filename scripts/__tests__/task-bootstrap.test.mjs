import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { bootstrapTask } from "../../tools/cli/task-bootstrap.mjs";
import { initializeTaskStore, withStoreLock } from "../../runtime/task/task-store.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("task bootstrap target repository boundary", () => {
  function fixture() {
    const home = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-task-bootstrap-")));
    roots.push(home);
    const storage = join(home, "storage"), repo = join(home, "repo");
    mkdirSync(storage); mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["-c", "user.name=WorkflowHub Tests", "-c", "user.email=tests@workflowhub.local", "commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
    return { home, storage, repo, env: { HOME: home, WORKFLOWHUB_TASK_DIR: storage } };
  }

  it("rejects a nested target before creating immutable task.json", async () => {
    const f = fixture(), nested = join(f.repo, "nested"); mkdirSync(nested);
    await expect(bootstrapTask({ project: "Demo", task: "nested-target", "target-repo": nested }, { env:f.env,home:f.home })).rejects.toThrow();
    expect(existsSync(join(f.storage,"Projects/Demo/tasks/nested-target/task.json"))).toBe(false);
    await expect(bootstrapTask({ project: "Demo", task: "nested-target", "target-repo": f.repo }, { env:f.env,home:f.home })).resolves.toMatchObject({project:"Demo",task:"nested-target"});
  });

  it("rejects a non-Git target before creating immutable task.json", async () => {
    const f = fixture(), plain = join(f.home, "plain"); mkdirSync(plain);
    await expect(bootstrapTask({ project: "Demo", task: "plain-target", "target-repo": plain }, { env:f.env,home:f.home })).rejects.toThrow();
    expect(existsSync(join(f.storage,"Projects/Demo/tasks/plain-target/task.json"))).toBe(false);
    await expect(bootstrapTask({ project: "Demo", task: "plain-target", "target-repo": f.repo }, { env:f.env,home:f.home })).resolves.toMatchObject({project:"Demo",task:"plain-target"});
  });

  it("binds an explicitly supplied existing trusted worktree without deriving a second one", async () => {
    const f = fixture();
    writeFileSync(join(f.repo, "baseline.txt"), "baseline\n");
    execFileSync("git", ["add", "."], { cwd: f.repo });
    execFileSync("git", ["-c", "user.name=WorkflowHub Tests", "-c", "user.email=tests@workflowhub.local", "commit", "-qm", "baseline"], { cwd: f.repo });
    const worktree = join(f.home, "trusted-task-worktree");
    execFileSync("git", ["worktree", "add", "-b", "codex/demo-existing-worktree", worktree, "HEAD"], { cwd: f.repo });

    const result = await bootstrapTask({
      project: "Demo",
      task: "demo-existing-worktree",
      "target-repo": f.repo,
      "workspace-root": worktree,
    }, { env:f.env,home:f.home });

    const manifest = JSON.parse(readFileSync(join(result.task_path, "task.json"), "utf8"));
    expect(manifest).toMatchObject({
      target_repo_root: realpathSync(f.repo),
      workspace_mode: "existing",
      workspace_root: realpathSync(worktree),
    });
  });

  function existing(f,id,cohort="post") {
    const worktree=join(f.home,"worktree-"+id);
    execFileSync("git",["worktree","add","-q","-b","codex/"+id,worktree,"HEAD"],{cwd:f.repo});
    const taskPath=join(f.storage,"Projects/workflowhub/tasks",id);mkdirSync(taskPath,{recursive:true});
    const manifest={schema_version:"1.0.0",execution_mode:"per_invocation",record_model:"vnext-single-write",project_name:"workflowhub",task_id:id,created_at:"2026-10-03T00:00:00.000Z",target_repo_root:f.repo,workspace_mode:"existing",workspace_root:worktree,activation_cohort:cohort,issue_ids:[],inputs:{}};
    const before=JSON.stringify(manifest,null,3)+"\n";writeFileSync(join(taskPath,"task.json"),before);
    return {taskPath,before,values:{"task-path":taskPath,project:"workflowhub",task:id}};
  }
  it("awaits existing post initialization without rewriting its manifest or historical rows", async () => {
    const f=fixture(),x=existing(f,"p6-existing-post");
    const old=' {"task_id":"p6-existing-post","stage":"make-decision","retired_passive":{"a":1}}\n';writeFileSync(join(x.taskPath,"facts.jsonl"),old);
    let release,entered;const gate=new Promise(r=>release=r),ready=new Promise(r=>entered=r);
    const held=withStoreLock(x.taskPath,async()=>{entered();await gate;});await ready;
    let settled=false;const pending=Promise.resolve().then(()=>bootstrapTask(x.values,{env:f.env,home:f.home})).finally(()=>{settled=true;});
    try {await new Promise(r=>setTimeout(r,60));expect(settled).toBe(false);}
    finally {release();await held;await pending.catch(()=>{});await initializeTaskStore(x.taskPath);await new Promise(r=>setTimeout(r,80));}
    await pending;
    expect(readFileSync(join(x.taskPath,"task.json"),"utf8")).toBe(x.before);
    expect(readFileSync(join(x.taskPath,"facts.jsonl"),"utf8")).toBe(old);
    expect(existsSync(join(x.taskPath,"quality/reviews"))).toBe(true);
  });
  it("rejects pre and unknown existing cohorts before initializing any records", async () => {
    const f=fixture();for(const cohort of ["pre","unknown"]){
      const x=existing(f,"p6-readonly-"+cohort,cohort);let error;
      try {await bootstrapTask(x.values,{env:f.env,home:f.home});}catch(e){error=e;}
      await new Promise(r=>setTimeout(r,100));
      expect(error?.message??"").toMatch(/pre\/history.*read-only/);
      expect(readFileSync(join(x.taskPath,"task.json"),"utf8")).toBe(x.before);
      expect(existsSync(join(x.taskPath,"facts.jsonl"))).toBe(false);
      expect(existsSync(join(x.taskPath,"quality"))).toBe(false);
    }
  });

});
