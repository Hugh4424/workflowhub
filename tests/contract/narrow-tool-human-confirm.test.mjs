// build-plan 预写测试（冻结）：断言变更须走 test change request + 独立审查
import { execFileSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { chmodSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { recordConfirmation } from "../../runtime/interface/human-confirm.mjs";

const roots = [];
const ORIGINAL_CWD = process.cwd();

function tempRoot(prefix) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
  roots.push(root);
  return root;
}

const rejection = (promise) => promise.then(() => null, (error) => error);

function walkFiles(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(path, acc);
    else acc.push(path);
  }
  return acc;
}

/** 签名不含目录参数：在临时目录内 chdir 后调用。返回 {dir, created}。 */
async function recordInTempDir(fields) {
  const dir = join(tempRoot("wh-human-confirm-"), "stage-area");
  mkdirSync(dir);
  const git = (args) => execFileSync("git", args, { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub tests"]);
  git(["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(dir, "baseline.txt"), "confirmation fixture\n");
  git(["add", "baseline.txt"]);
  git(["commit", "-qm", "baseline"]);
  const expectedHead = git(["rev-parse", "HEAD"]);
  process.chdir(dir);
  const before = new Set(walkFiles(dir));
  await recordConfirmation(fields);
  const created = walkFiles(dir).filter((path) => !before.has(path));
  const records = created.filter((path) => path.endsWith(".json"));
  expect(records).toHaveLength(1);
  const record = JSON.parse(readFileSync(records[0], "utf8"));
  expect(record.head).toBe(expectedHead);
  return { dir, created };
}

afterEach(() => {
  process.chdir(ORIGINAL_CWD);
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("human-confirm recordConfirmation", () => {
  it("persists a record via safe-write + record-lock semantics", async () => {
    const { created } = await recordInTempDir({
      stage: "build-plan",
      decision: "accepted",
      reply: "yes",
      materialRefs: ["specs/card-06/spec.md"],
    });
    expect(created.length).toBeGreaterThan(0);
  });

  it("stores the verbatim reply and plain-text materialRefs paths", async () => {
    const reply = "YES, proceed — but only with plan B.\nSecond verbatim line kept as-is.";
    const materialRefs = ["specs/workflowhub-thin-core-card-06-20260919/spec.md", "docs/architecture/move-map.json"];
    const { created } = await recordInTempDir({ stage: "build-plan", decision: "accepted", reply, materialRefs });
    const records = created.filter((path) => path.endsWith(".json"));
    expect(records).toHaveLength(1);
    const record = JSON.parse(readFileSync(records[0], "utf8"));
    expect(record.reply).toBe(reply);
    expect(record.material_refs).toEqual(materialRefs);
  });

  it("never binds material_revision or snapshot_tree", async () => {
    const { created } = await recordInTempDir({
      stage: "verify-code",
      decision: "rejected",
      reply: "no, evidence missing",
      materialRefs: ["quality/reviews/r1.md"],
    });
    const text = created.map((path) => readFileSync(path, "utf8")).join("\n");
    expect(text).not.toContain("material_revision");
    expect(text).not.toContain("snapshot_tree");
  });

  it("surfaces write failures instead of swallowing them", async () => {
    // 只读目录（r-x）无法创建任何记录文件/锁目录：落盘必须显式失败，不得静默成功。
    const dir = join(tempRoot("wh-human-confirm-"), "readonly");
    mkdirSync(dir);
    chmodSync(dir, 0o500);
    process.chdir(dir);
    try {
      const error = await rejection(
        recordConfirmation({ stage: "build-plan", decision: "accepted", reply: "x", materialRefs: [] }),
      );
      // 具体报错形态由实现决定；契约只要求不吞错（抛错或非零 exit 语义）。
      expect(error).not.toBeNull();
      expect(walkFiles(dir)).toEqual([]);
    } finally {
      chmodSync(dir, 0o700);
    }
  });
});

describe("P8 human confirmation publish executor", () => {
  function fixture() {
    const cwd=tempRoot("wh-human-budget-");
    const git=(args)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
    git(['init','-q','-b','main']);git(['config','user.name','tests']);git(['config','user.email','tests@example.test']);
    writeFileSync(join(cwd,'one'),'one');git(['add','.']);git(['commit','-qm','one']);
    const dir=join(cwd,'records'),lockDir=join(cwd,'locks');mkdirSync(dir);mkdirSync(lockDir);
    return {cwd,dir,lockDir};
  }
  const fields={stage:'build-code',decision:'continue',reply:'继续',materialRefs:[]};
  it("awaits only atomic publish and uses the supplied business lock directory",async()=>{
    const options=fixture();let request;
    const result=await recordConfirmation(fields,{...options,performWrite:async(r,actual)=>{
      request=r;expect(readdirSync(options.lockDir)).toContain('.human-confirm.lock');expect(readdirSync(options.dir)).toEqual([]);
      await new Promise(resolve=>setTimeout(resolve,5));return actual();
    }});
    expect(request).toMatchObject({kind:'publish',path:result.path,incomingFiles:2});
    expect(request.bytes).toBe(Buffer.byteLength(readFileSync(result.path)));
    expect(readdirSync(options.lockDir)).toEqual([]);
  });
  it("refuses before creating confirmation/temp bytes and releases the business lock",async()=>{
    const options=fixture();
    await expect(recordConfirmation(fields,{...options,performWrite:async()=>{throw Object.assign(new Error('full'),{code:'TASK_DISK_BUDGET_EXCEEDED'});}})).rejects.toMatchObject({code:'TASK_DISK_BUDGET_EXCEEDED'});
    expect(readdirSync(options.dir)).toEqual([]);expect(readdirSync(options.lockDir)).toEqual([]);
  });
});

it("P8 human publication rechecks its storage after awaiting the executor",async()=>{
  const cwd=tempRoot('wh-human-race-');
  const run=(args)=>execFileSync('git',args,{cwd,stdio:['ignore','pipe','pipe']});
  run(['init','-q','-b','main']);run(['config','user.name','tests']);run(['config','user.email','tests@example.test']);
  writeFileSync(join(cwd,'one'),'one');run(['add','.']);run(['commit','-qm','one']);
  const dir=join(cwd,'records'),lockDir=join(cwd,'locks');mkdirSync(dir);mkdirSync(lockDir);
  const {renameSync}=await import('node:fs');
  await expect(recordConfirmation({stage:'build-code',decision:'continue',reply:'yes',materialRefs:[]},{cwd,dir,lockDir,performWrite:async(_r,actual)=>{
    await new Promise(resolve=>setTimeout(resolve,5));renameSync(dir,`${dir}-original`);mkdirSync(dir);return actual();
  }})).rejects.toMatchObject({code:'ANCESTOR_REPLACED'});
  expect(readdirSync(dir)).toEqual([]);expect(readdirSync(`${dir}-original`)).toEqual([]);expect(readdirSync(lockDir)).toEqual([]);
});
