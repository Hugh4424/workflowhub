// build-plan 预写测试（冻结）：断言变更须走 test change request + 独立审查
import { execFileSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";

import { consume, record } from "../../runtime/interface/git-authorize.mjs";

const roots = [];
const ORIGINAL_CWD = process.cwd();

const git = (cwd, args) =>
  execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

function tempRoot(prefix) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
  roots.push(root);
  return root;
}

const rejection = (promise) => promise.then(() => null, (error) => error);

/** 递归列出目录下全部文件（排除 .git 内部），用于发现新落盘的授权记录。 */
function walkFiles(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(path, acc);
    else acc.push(path);
  }
  return acc;
}

/** 建临时 git 仓库并 chdir 进去；返回恢复函数。工具签名不含目录参数，记录落盘位置相对 cwd。 */
function useGitRepo() {
  const root = tempRoot("wh-git-authorize-");
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub tests"]);
  git(repo, ["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "baseline\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "baseline"]);
  process.chdir(repo);
  return repo;
}

afterEach(() => {
  process.chdir(ORIGINAL_CWD);
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("git-authorize record/consume (ADR-020, HEAD-only)", () => {
  it("record writes branch and HEAD into a discoverable file", async () => {
    const repo = useGitRepo();
    const head = git(repo, ["rev-parse", "HEAD"]);
    const before = new Set(walkFiles(repo));
    await record({ operation: "commit", confirmationRef: "confirm-1" });
    const created = walkFiles(repo).filter((path) => !before.has(path));
    expect(created.length).toBeGreaterThan(0);
    const text = created.map((path) => readFileSync(path, "utf8")).join("\n");
    expect(text).toContain("commit");
    expect(text).toContain("confirm-1");
    expect(text).toContain("main");
    expect(text).toContain(head);
  });

  it("consume without any recorded authorization fails with IRREVERSIBLE_AUTHORIZATION_REQUIRED", async () => {
    useGitRepo();
    const error = await rejection(consume({ operation: "commit", stepId: "step-1" }));
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe("IRREVERSIBLE_AUTHORIZATION_REQUIRED");
  });

  it("consume succeeds once, retries of the same step are idempotent, and another step is rejected", async () => {
    const repo = useGitRepo();
    const authorization = await record({ operation: "commit", confirmationRef: "confirm-2" });
    const authorizationBytes = readFileSync(authorization);
    const first = await consume({ operation: "commit", stepId: "step-1" });
    expect(first).toMatchObject({ operation: "commit", step_id: "step-1", authorization_ref: authorization, path: expect.any(String) });
    const consumedBytes = readFileSync(first.path);
    expect(JSON.parse(consumedBytes.toString("utf8"))).toMatchObject({ operation: "commit", step_id: "step-1", authorization_ref: authorization });
    const beforeRetry = walkFiles(repo).sort();
    const retry = await consume({ operation: "commit", stepId: "step-1" });
    expect(retry).toEqual(first);
    expect(readFileSync(first.path)).toEqual(consumedBytes);
    expect(readFileSync(authorization)).toEqual(authorizationBytes);
    expect(walkFiles(repo).sort()).toEqual(beforeRetry);
    const error = await rejection(consume({ operation: "commit", stepId: "step-2" }));
    expect(error).toBeInstanceOf(Error);
    expect(typeof error.code).toBe("string");
    expect(error.code.length).toBeGreaterThan(0);
  });

  it("consume fails with AUTHORIZATION_HEAD_MISMATCH after HEAD moves", async () => {
    const repo = useGitRepo();
    await record({ operation: "commit", confirmationRef: "confirm-3" });
    writeFileSync(join(repo, "change.md"), "new head\n");
    git(repo, ["add", "."]);
    git(repo, ["commit", "-qm", "move head"]);
    const error = await rejection(consume({ operation: "commit", stepId: "step-1" }));
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe("AUTHORIZATION_HEAD_MISMATCH");
  });

  it("rejects operations outside commit/push/merge/archive/cleanup", async () => {
    useGitRepo();
    const error = await rejection(record({ operation: "rebase", confirmationRef: "confirm-4" }));
    expect(error).toBeInstanceOf(Error);
    expect(typeof error.code).toBe("string");
    expect(error.code.length).toBeGreaterThan(0);
    await record({ operation: "push", confirmationRef: "confirm-5" });
    const bad = await rejection(consume({ operation: "publish", stepId: "step-1" }));
    expect(bad).toBeInstanceOf(Error);
    expect(typeof bad.code).toBe("string");
    expect(bad.code.length).toBeGreaterThan(0);
  });
});

function useTaskRepo() {
  const repo = useGitRepo();
  const task = join(dirname(repo), "Projects", "owned", "tasks", "current");
  mkdirSync(task, { recursive: true });
  writeFileSync(join(task, "task.json"), JSON.stringify({
    schema_version: "1.0.0", project_name: "owned", task_id: "current",
    target_repo_root: repo, workspace_mode: "existing", workspace_root: repo,
  }));
  return { repo, dir: join(task, "quality", "evidence", "git-authorizations") };
}

describe("explicit build-code commit authorization", () => {
  it("requires a real task manifest and refuses generic storage or another repository", async () => {
    const repo = useGitRepo();
    expect((await rejection(record({ operation: "commit", confirmationRef: "owned-reply", phase: "build-code" })))?.code).toBe("AUTH_SCOPE");
    const { dir } = useTaskRepo();
    const authorizationRef = await record({ operation: "commit", confirmationRef: "owned-reply", phase: "build-code", dir });
    process.chdir(repo);
    expect((await rejection(consume({ operation: "commit", stepId: "foreign", phase: "build-code", authorizationRef, dir })))?.code).toBe("AUTH_SCOPE");
  });

  it("records actual HEAD for each distinct consumption and keeps retry and grant immutable", async () => {
    const { repo, dir } = useTaskRepo();
    const phase = "build-code";
    const authorizationRef = await record({ operation: "commit", confirmationRef: "owned-reply", phase, dir });
    const original = readFileSync(authorizationRef);
    const first = await consume({ operation: "commit", stepId: "first", phase, authorizationRef, dir });
    const before = git(repo, ["rev-parse", "HEAD"]);
    expect(first.head).toBe(before);
    writeFileSync(join(repo, "README.md"), "next\n");
    git(repo, ["add", "README.md"]); git(repo, ["commit", "-qm", "next"]);
    const after = git(repo, ["rev-parse", "HEAD"]);
    const second = await consume({ operation: "commit", stepId: "second", phase, authorizationRef, dir });
    expect(second).toMatchObject({ operation: "commit", phase, branch: "main", head: after, step_id: "second", authorization_ref: authorizationRef });
    expect(second.path).not.toBe(first.path); expect(after).not.toBe(before);
    expect(await consume({ operation: "commit", stepId: "first", phase, authorizationRef, dir })).toEqual(first);
    expect(readFileSync(authorizationRef)).toEqual(original);
  });

  it("rejects a changed branch, wrong stage and omitted stage including retries without writing a consumption", async () => {
    const { repo, dir } = useTaskRepo();
    const authorizationRef = await record({ operation: "commit", confirmationRef: "owned-reply", phase: "build-code", dir });
    await consume({ operation: "commit", stepId: "first", phase: "build-code", authorizationRef, dir });
    const before = readdirSync(dir).sort();
    for (const phase of [undefined, "verify-code"]) {
      const error = await rejection(consume({ operation: "commit", stepId: "first", phase, authorizationRef, dir }));
      expect(error?.code).toBe("AUTH_SCOPE");
    }
    git(repo, ["checkout", "-qb", "other"]);
    expect((await rejection(consume({ operation: "commit", stepId: "next", phase: "build-code", authorizationRef, dir })))?.code).toBe("AUTH_SCOPE");
    expect(readdirSync(dir).sort()).toEqual(before);
  });

  it("does not select a scoped grant for a consumer without scope or silently fall back to a legacy grant", async () => {
    const { dir } = useTaskRepo();
    await record({ operation: "commit", confirmationRef: "legacy", dir });
    await record({ operation: "commit", confirmationRef: "scoped", phase: "build-code", dir });
    expect((await rejection(consume({ operation: "commit", stepId: "unsafe", dir })))?.code).toBe("AUTH_SCOPE");
    expect(readdirSync(dir).filter(name => name.includes("consumed"))).toEqual([]);
  });

  it("does not widen a legacy grant when a consumer explicitly supplies build-code", async () => {
    const { repo, dir } = useTaskRepo();
    const authorizationRef = await record({ operation: "commit", confirmationRef: "legacy", dir });
    const first = await consume({ operation: "commit", stepId: "legacy", phase: "build-code", authorizationRef, dir });
    expect(first).not.toHaveProperty("phase");
    expect((await rejection(consume({ operation: "commit", stepId: "second", phase: "build-code", authorizationRef, dir })))?.code).toBe("AUTHORIZATION_ALREADY_CONSUMED");
    const next = await record({ operation: "commit", confirmationRef: "legacy-next", dir });
    writeFileSync(join(repo, "README.md"), "next\n"); git(repo, ["add", "README.md"]); git(repo, ["commit", "-qm", "next"]);
    expect((await rejection(consume({ operation: "commit", stepId: "third", phase: "build-code", authorizationRef: next, dir })))?.code).toBe("AUTHORIZATION_HEAD_MISMATCH");
  });

  it("passes the explicit stage through the primitive CLI in both directions", () => {
    const { repo, dir } = useTaskRepo();
    const cli = new URL("../../runtime/interface/git-authorize.mjs", import.meta.url);
    const call = (...args) => JSON.parse(execFileSync(process.execPath, [cli.pathname, ...args], { cwd: repo, encoding: "utf8" }));
    const { path } = call("record", "--operation", "commit", "--confirmation-ref", "owned-reply", "--phase", "build-code", "--dir", dir);
    expect(JSON.parse(readFileSync(path)).phase).toBe("build-code");
    const consumed = call("consume", "--operation", "commit", "--step-id", "cli", "--authorization-ref", path, "--phase", "build-code", "--dir", dir);
    expect(JSON.parse(readFileSync(consumed.path))).toMatchObject({ phase: "build-code", head: git(repo, ["rev-parse", "HEAD"]) });
  });
});

function anotherTask(repo, id) {
  const task = join(dirname(repo), "Projects", "owned", "tasks", id);
  mkdirSync(task, { recursive: true });
  writeFileSync(join(task, "task.json"), JSON.stringify({
    schema_version: "1.0.0", project_name: "owned", task_id: id,
    target_repo_root: repo, workspace_mode: "existing", workspace_root: repo,
  }));
  return { task, dir: join(task, "quality", "evidence", "git-authorizations") };
}

describe("scoped grant creation-task binding", () => {
  it("includes the accepted --phase option in primitive CLI usage diagnostics", () => {
    const cli = new URL("../../runtime/interface/git-authorize.mjs", import.meta.url);
    let error;
    try { execFileSync(process.execPath, [cli.pathname, "unknown"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); }
    catch (caught) { error = caught; }
    expect(error?.status).toBe(1);
    expect(JSON.parse(error.stderr)).toMatchObject({ code: "INVALID_ARGUMENT", message: expect.stringContaining("[--phase PHASE]") });
  });

  it("persists authenticated creation-task provenance and preserves same-task cross-HEAD reuse and retry", async () => {
    const { repo, dir } = useTaskRepo();
    const authorizationRef = await record({ operation: "commit", confirmationRef: "owned-reply", phase: "build-code", dir });
    const original = readFileSync(authorizationRef);
    expect(JSON.parse(original)).toMatchObject({ project_name: "owned", task_id: "current", task_ref: join(dirname(dirname(dirname(dir))), "task.json"), target_repo_root: repo });
    const first = await consume({ operation: "commit", stepId: "first", authorizationRef, phase: "build-code", dir });
    writeFileSync(join(repo, "README.md"), "legal next\n"); git(repo, ["add", "README.md"]); git(repo, ["commit", "-qm", "legal next"]);
    const second = await consume({ operation: "commit", stepId: "second", authorizationRef, phase: "build-code", dir });
    expect(second.head).toBe(git(repo, ["rev-parse", "HEAD"])); expect(second.head).not.toBe(first.head);
    expect(await consume({ operation: "commit", stepId: "first", authorizationRef, phase: "build-code", dir })).toEqual(first);
    expect(readFileSync(authorizationRef)).toEqual(original);
  });

  it("rejects an unchanged grant copied into a different task on the same real repository and branch", async () => {
    const { repo, dir } = useTaskRepo();
    const authorizationRef = await record({ operation: "commit", confirmationRef: "owned-reply", phase: "build-code", dir });
    const original = readFileSync(authorizationRef), other = anotherTask(repo, "other");
    mkdirSync(other.dir, { recursive: true }); const copied = join(other.dir, basename(authorizationRef)); writeFileSync(copied, original);
    writeFileSync(join(repo, "README.md"), "next\n"); git(repo, ["add", "README.md"]); git(repo, ["commit", "-qm", "next"]);
    const error = await rejection(consume({ operation: "commit", stepId: "foreign", phase: "build-code", authorizationRef: copied, dir: other.dir }));
    expect(error?.code).toBe("AUTH_SCOPE"); expect(readdirSync(other.dir).filter(name => name.includes("consumed"))).toEqual([]);
    expect(readFileSync(copied)).toEqual(original); expect(readFileSync(authorizationRef)).toEqual(original);
  });

  it.each(["fresh", "retry"])("rejects a renamed task identity on %s consumption", async mode => {
    const { repo, dir } = useTaskRepo();
    const authorizationRef = await record({ operation: "commit", confirmationRef: "owned-reply", phase: "build-code", dir });
    const original = readFileSync(authorizationRef);
    const first = mode === "retry" ? await consume({ operation: "commit", stepId: "first", authorizationRef, phase: "build-code", dir }) : null;
    const task = dirname(dirname(dirname(dir))), renamed = join(dirname(task), "renamed"); renameSync(task, renamed);
    const manifest = JSON.parse(readFileSync(join(renamed, "task.json"))); manifest.task_id = "renamed"; writeFileSync(join(renamed, "task.json"), JSON.stringify(manifest));
    const nextDir = join(renamed, "quality", "evidence", "git-authorizations"), moved = join(nextDir, basename(authorizationRef));
    if (first) { const path = join(nextDir, basename(first.path)), receipt = JSON.parse(readFileSync(path)); receipt.authorization_ref = moved; writeFileSync(path, JSON.stringify(receipt)); }
    const before = readdirSync(nextDir).sort();
    const error = await rejection(consume({ operation: "commit", stepId: "first", phase: "build-code", authorizationRef: moved, dir: nextDir }));
    expect(error?.code).toBe("AUTH_SCOPE"); expect(readdirSync(nextDir).sort()).toEqual(before); expect(readFileSync(moved)).toEqual(original);
  });

  it("rejects historical scoped grants lacking creation-task binding without rewriting them", async () => {
    const { dir } = useTaskRepo();
    const authorizationRef = await record({ operation: "commit", confirmationRef: "owned-reply", phase: "build-code", dir });
    const value = JSON.parse(readFileSync(authorizationRef)); for (const key of ["task_id", "project_name", "task_ref", "target_repo_root"]) delete value[key];
    writeFileSync(authorizationRef, JSON.stringify(value)); const original = readFileSync(authorizationRef);
    expect((await rejection(consume({ operation: "commit", stepId: "old-scope", phase: "build-code", authorizationRef, dir })))?.code).toBe("AUTH_SCOPE");
    expect(readFileSync(authorizationRef)).toEqual(original); expect(readdirSync(dir).filter(name => name.includes("consumed"))).toEqual([]);
  });

  it.each(["legacy-last", "scoped-last"])("requires an exact grant for mixed implicit scoped/legacy selection (%s)", async order => {
    const { repo, dir } = useTaskRepo();
    const fields = { operation: "commit", confirmationRef: "owned-reply", dir };
    let authorizationRef;
    if (order === "legacy-last") { authorizationRef = await record({ ...fields, phase: "build-code" }); await record(fields); }
    else { await record(fields); authorizationRef = await record({ ...fields, phase: "build-code" }); }
    writeFileSync(join(repo, "README.md"), "next\n"); git(repo, ["add", "README.md"]); git(repo, ["commit", "-qm", "next"]);
    expect((await rejection(consume({ operation: "commit", stepId: "ambiguous", phase: "build-code", dir })))?.code).toBe("AUTH_SCOPE");
    expect(readdirSync(dir).filter(name => name.includes("consumed"))).toEqual([]);
    expect((await consume({ operation: "commit", stepId: "exact", phase: "build-code", authorizationRef, dir })).authorization_ref).toBe(authorizationRef);
  });
});

describe("P8 Git authorization publish executor",()=>{
  function fixture(){const cwd=useGitRepo();process.chdir(ORIGINAL_CWD);const dir=join(cwd,'records'),lockDir=join(cwd,'locks');mkdirSync(dir);mkdirSync(lockDir);return{cwd,dir,lockDir};}
  it("selects explicit cwd and routes record/consume final publication through the executor",async()=>{
    const options=fixture();const requests=[];
    const performWrite=async(r,actual)=>{requests.push(r);expect(readdirSync(options.lockDir)).toContain('.git-authorize.lock');await new Promise(resolve=>setTimeout(resolve,5));return actual();};
    const path=await record({...options,operation:'commit',confirmationRef:'yes',performWrite});
    const consumed=await consume({...options,operation:'commit',stepId:'one',performWrite});
    expect(JSON.parse(readFileSync(path,'utf8')).head).toBe(git(options.cwd,['rev-parse','HEAD']));
    expect(requests).toHaveLength(2);
    expect(requests.map(r=>r.path)).toEqual([path,consumed.path]);
    for(const r of requests){expect(r).toMatchObject({kind:'publish',incomingFiles:2});expect(r.bytes).toBe(Buffer.byteLength(readFileSync(r.path)));}
    const retry=await consume({...options,operation:'commit',stepId:'one',performWrite:async()=>{throw new Error('same-step must not write');}});
    expect(retry.path).toBe(consumed.path);expect(readdirSync(options.lockDir)).toEqual([]);
  });
  it("refuses authorization before creating temp/record bytes and releases its lock",async()=>{
    const options=fixture();
    await expect(record({...options,operation:'push',confirmationRef:'yes',performWrite:async()=>{throw Object.assign(new Error('full'),{code:'TASK_DISK_BUDGET_EXCEEDED'});}})).rejects.toMatchObject({code:'TASK_DISK_BUDGET_EXCEEDED'});
    expect(readdirSync(options.dir)).toEqual([]);expect(readdirSync(options.lockDir)).toEqual([]);
  });
});

it("P8 Git explicit cwd selects either repository without changing process cwd",async()=>{
  const first=useGitRepo();const second=useGitRepo();
  writeFileSync(join(second,'second'),'second');git(second,['add','.']);git(second,['commit','-qm','second']);
  process.chdir(first);
  const one=await record({cwd:first,operation:'commit',confirmationRef:'first'});
  const two=await record({cwd:second,operation:'commit',confirmationRef:'second'});
  expect(process.cwd()).toBe(first);
  expect(JSON.parse(readFileSync(one,'utf8')).head).toBe(git(first,['rev-parse','HEAD']));
  expect(JSON.parse(readFileSync(two,'utf8')).head).toBe(git(second,['rev-parse','HEAD']));
  expect(JSON.parse(readFileSync(one,'utf8')).head).not.toBe(JSON.parse(readFileSync(two,'utf8')).head);
});

it("P8 Git publish rechecks storage after the executor wait",async()=>{
  const cwd=useGitRepo();process.chdir(ORIGINAL_CWD);const dir=join(cwd,'records'),lockDir=join(cwd,'locks');mkdirSync(dir);mkdirSync(lockDir);
  await expect(record({cwd,dir,lockDir,operation:'commit',confirmationRef:'yes',performWrite:async(_r,actual)=>{
    await new Promise(resolve=>setTimeout(resolve,5));renameSync(dir,`${dir}-original`);mkdirSync(dir);return actual();
  }})).rejects.toMatchObject({code:'ANCESTOR_REPLACED'});
  expect(readdirSync(dir)).toEqual([]);expect(readdirSync(`${dir}-original`)).toEqual([]);expect(readdirSync(lockDir)).toEqual([]);
});
