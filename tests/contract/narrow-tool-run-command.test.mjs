// build-plan 预写测试（冻结）：断言变更须走 test change request + 独立审查
import { afterEach, describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { captureCommand } from "../../runtime/interface/run-command.mjs";

const roots = [];

function tempRoot(prefix) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
  roots.push(root);
  return root;
}

const node = (script) => [process.execPath, "-e", script];
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("run-command captureCommand", () => {
  it("returns the real exit code 0 and 3 unchanged", async () => {
    const root = tempRoot("wh-run-command-");
    const recordDir = join(root, "records");
    mkdirSync(recordDir);
    const ok = await captureCommand({ cwd: root, recordDir, slug: "ok", argv: node("process.exit(0)"), timeoutMs: 10000 });
    expect(ok.exit).toBe(0);
    const fail = await captureCommand({ cwd: root, recordDir, slug: "fail", argv: node("process.exit(3)"), timeoutMs: 10000 });
    expect(fail.exit).toBe(3);
    const receiptFiles = readdirSync(recordDir).filter((name) => name.endsWith(".json"));
    expect(receiptFiles).toHaveLength(2);
    const receipts = receiptFiles.map((name) => JSON.parse(readFileSync(join(recordDir, name), "utf8")));
    expect(receipts.map((receipt) => receipt.exit_code).sort()).toEqual([0, 3]);
  });

  it("persists both streams into one output file and a JSON receipt under recordDir", async () => {
    const root = tempRoot("wh-run-command-");
    const recordDir = join(root, "records");
    mkdirSync(recordDir);
    const before = new Set(readdirSync(recordDir));
    const result = await captureCommand({
      cwd: root,
      recordDir,
      slug: "echo",
      argv: node("process.stdout.write('out-line\\n'); process.stderr.write('err-line\\n')"),
      timeoutMs: 10000,
    });
    expect(result.exit).toBe(0);
    const created = readdirSync(recordDir).filter((name) => !before.has(name));
    expect(created.length).toBe(2);
    const outputs = created.filter((name) => name.endsWith(".output"));
    const receipts = created.filter((name) => name.endsWith(".json"));
    expect(outputs).toHaveLength(1);
    expect(receipts).toHaveLength(1);
    expect(outputs[0]).toMatch(/^\d{4}-\d{2}-\d{2}-\d{3}-echo\.output$/);
    const outputPath = join(recordDir, outputs[0]);
    const output = readFileSync(outputPath, "utf8");
    // Cross-stream order is unspecified; preserve each original byte sequence exactly once.
    expect(output.match(/out-line\n/g)).toHaveLength(1);
    expect(output.match(/err-line\n/g)).toHaveLength(1);
    expect(output.length).toBe("out-line\nerr-line\n".length);
    const receipt = JSON.parse(readFileSync(join(recordDir, receipts[0]), "utf8"));
    expect(receipt.exit_code).toBe(0);
    expect(receipt.cwd).toBe(root);
    expect(receipt.argv).toEqual(node("process.stdout.write('out-line\\n'); process.stderr.write('err-line\\n')"));
    expect(receipt.timed_out).toBe(false);
    expect(receipt.truncated).toBe(false);
    expect(receipt.output_ref).toBeTypeOf("string");
    const referenced = receipt.output_ref.startsWith("/") ? receipt.output_ref : join(recordDir, receipt.output_ref);
    expect(realpathSync(referenced)).toBe(realpathSync(outputPath));
  });

  it("supports shell mode", async () => {
    const root = tempRoot("wh-run-command-");
    const recordDir = join(root, "records");
    mkdirSync(recordDir);
    const result = await captureCommand({ cwd: root, recordDir, slug: "shell", shell: "printf via-shell", timeoutMs: 10000 });
    expect(result.exit).toBe(0);
  });

  it("kills the whole process group on timeout, returns exit 124, and leaves no orphaned survivor", async () => {
    const root = tempRoot("wh-run-command-");
    const recordDir = join(root, "records");
    mkdirSync(recordDir);
    const marker = join(root, "survivor-marker");
    // shell 先挂一个后台孤儿（2s 后写标记），再 exec sleep 30。
    // 只杀领头进程时孤儿会存活并留下标记；杀整个进程组则两者俱灭。
    const orphan = `setTimeout(() => require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'alive'), 2000)`;
    const started = Date.now();
    const result = await captureCommand({
      cwd: root,
      recordDir,
      slug: "timeout",
      shell: `${JSON.stringify(process.execPath)} -e ${JSON.stringify(orphan)} & exec sleep 30`,
      timeoutMs: 300,
    });
    expect(result.exit).toBe(124);
    expect(Date.now() - started).toBeLessThan(10000);
    await delay(2500);
    expect(existsSync(marker)).toBe(false);
  });

  it("truncates a single stream beyond 8 MiB and marks the truncation", async () => {
    const root = tempRoot("wh-run-command-");
    const recordDir = join(root, "records");
    mkdirSync(recordDir);
    const before = new Set(readdirSync(recordDir));
    const result = await captureCommand({
      cwd: root,
      recordDir,
      slug: "flood",
      argv: node("process.stdout.write('x'.repeat(9 * 1024 * 1024))"),
      timeoutMs: 30000,
    });
    expect(result.exit).toBe(0);
    expect(result.stdoutTruncated).toBe(true);
    const created = readdirSync(recordDir).filter((name) => !before.has(name));
    const stdoutFile = created
      .map((name) => join(recordDir, name))
      .find((path) => statSync(path).size > 1024 * 1024);
    expect(stdoutFile).toBeDefined();
    // 8 MiB 上限 + 截断标记的少量余量；9 MiB 原样落盘必然超限。
    expect(statSync(stdoutFile).size).toBeLessThanOrEqual(8 * 1024 * 1024 + 1024);
    expect(readFileSync(stdoutFile, "utf8")).toContain("TRUNCATED");
  });
});

describe("P8 native write executor", () => {
  const fixture = () => { const cwd = tempRoot("wh-native-budget-"); const recordDir = join(cwd, "records"); mkdirSync(recordDir); return { cwd, recordDir, slug: "budget" }; };
  it("executes each output mutation inside its awaited callback with byte/path peaks", async () => {
    const calls = [];
    const result = await captureCommand({ ...fixture(), argv: node("process.stdout.write('abc');process.stderr.write('def')"), performWrite: async (request, actual) => { calls.push(request); await delay(5); return actual(); } });
    expect(calls[0]).toMatchObject({ kind: "output", bytes: 0, incomingFiles: 1 });
    expect(calls.filter(c => c.kind === "chunk").reduce((n,c) => n+c.bytes,0)).toBe(6);
    expect(calls.at(-1)).toMatchObject({ kind: "receipt", incomingFiles: 2 });
    expect(calls.at(-1).bytes).toBe(statSync(result.receipt_ref).size);
    expect(readFileSync(result.output_ref,"utf8").length).toBe(6);
  });
  it("rejects output reservation before spawning or creating bytes", async () => {
    const options = fixture();
    await expect(captureCommand({ ...options, argv: node("process.exit(0)"), performWrite: async () => { throw Object.assign(new Error("full"), { code: "TASK_DISK_BUDGET_EXCEEDED" }); } })).rejects.toMatchObject({ code: "TASK_DISK_BUDGET_EXCEEDED" });
    expect(readdirSync(options.recordDir)).toEqual([]);
  });
  it("retains real child failure when receipt publication is refused", async () => {
    const options = fixture();
    let caught;
    try { await captureCommand({ ...options, argv: node("process.stdout.write('abc');process.exit(3)"), performWrite: async (r, actual) => { if(r.kind === "receipt") throw Object.assign(new Error("full"), { code: "TASK_DISK_BUDGET_EXCEEDED" }); return actual(); } }); } catch(error) { caught=error; }
    expect(caught).toMatchObject({ code: "TASK_DISK_BUDGET_EXCEEDED", receipt_saved: false, execution: { exit_code: 3, timed_out: false, cancelled: false } });
    expect(caught.receipt_ref).toBeUndefined();
    expect(readFileSync(caught.output_ref,"utf8")).toBe("abc");
    expect(readdirSync(options.recordDir).some(n=>n.endsWith(".json"))).toBe(false);
  });
  it("reads back a receipt that was published before a later wrapper failure", async () => {
    const options = fixture(); let caught;
    try {
      await captureCommand({ ...options, argv: node("process.stdout.write('abc');process.exit(3)"), performWrite: async (request, actual) => {
        const result = await actual();
        if (request.kind === "receipt") throw Object.assign(new Error("cleanup after publish"), { code: "RECEIPT_CLEANUP_FAILED" });
        return result;
      } });
    } catch (error) { caught = error; }
    expect(caught).toMatchObject({ code: "RECEIPT_CLEANUP_FAILED", receipt_saved: true, receipt_ref: expect.any(String), execution: { exit_code: 3 } });
    expect(JSON.parse(readFileSync(caught.receipt_ref, "utf8"))).toMatchObject({ output_ref: caught.execution.output_ref, exit_code: 3 });
  });
  it("refuses queued chunks after the first failed write and reaps the child", async () => {
    const options = fixture(); let chunks=0;
    await expect(captureCommand({ ...options, timeoutMs: 1000, argv: node("setInterval(()=>process.stdout.write('abc'),1)"), performWrite: async (r, actual) => { if(r.kind === "chunk") { chunks++; throw Object.assign(new Error("full"), { code: "TASK_DISK_BUDGET_EXCEEDED" }); } return actual(); } })).rejects.toMatchObject({ code: "TASK_DISK_BUDGET_EXCEEDED" });
    expect(chunks).toBe(1);
    expect(statSync(join(options.recordDir,readdirSync(options.recordDir).find(n=>n.endsWith(".output")))).size).toBe(0);
  });
});


describe("P8 native interruption and marker writes", () => {
  const fixture = () => { const cwd = tempRoot("wh-native-budget-"); const recordDir = join(cwd, "records"); mkdirSync(recordDir); return { cwd, recordDir, slug: "budget" }; };
  it("refuses marker separately after exactly 8 MiB and keeps actual execution", async () => {
    const options=fixture(); let caught; const requests=[];
    try { await captureCommand({ ...options, argv: node("process.stdout.write('x'.repeat(9*1024*1024))"), performWrite: async (r,actual)=> { requests.push(r); if(r.kind==='marker') throw Object.assign(new Error('marker full'),{code:'TASK_DISK_BUDGET_EXCEEDED'}); return actual(); } }); } catch(e) { caught=e; }
    expect(caught.code).toBe('TASK_DISK_BUDGET_EXCEEDED');
    expect(requests.filter(r=>r.kind==='marker')).toHaveLength(1);
    expect(statSync(caught.output_ref).size).toBe(8*1024*1024);
    const receipt=JSON.parse(readFileSync(caught.receipt_ref,'utf8'));
    expect(receipt.error.code).toBe('TASK_DISK_BUDGET_EXCEEDED');
    expect(receipt.signal).toBe('SIGKILL');
  });
  async function expectReaped(pid) {
    const until=Date.now()+3000;
    let error;
    do { try {process.kill(pid,0);} catch(caught) {error=caught;break;} await delay(10); } while(Date.now()<until);
    expect(error).toMatchObject({code:'ESRCH'});
  }
  it("kills and reaps on cancellation while the output lock is awaited", async () => {
    const options=fixture(); const controller=new AbortController(); let release; let waiting;
    const pidPath=join(options.cwd,'child.pid');
    const entered=new Promise(resolve=>waiting=resolve);
    const blocked=new Promise(resolve=>release=resolve);
    const execution=captureCommand({ ...options, signal:controller.signal, argv:node(`require('node:fs').writeFileSync(${JSON.stringify(pidPath)},String(process.pid));process.stdout.write('abc');setInterval(()=>{},1000)`), performWrite:async(r,actual)=> { if(r.kind==='chunk') { waiting(); await blocked; } return actual(); } }).then(value=>({value}),error=>({error}));
    await entered;controller.abort('SIGTERM');
    try {await expectReaped(Number(readFileSync(pidPath,'utf8')));} finally {release();}
    const {error:caught}=await execution;
    expect(caught).toMatchObject({code:'ABORT_ERR',exitCode:143});
    const receipt=JSON.parse(readFileSync(caught.receipt_ref,'utf8'));
    expect(receipt).toMatchObject({cancelled:true,exit_code:143,signal:'SIGKILL'});
    expect(readFileSync(caught.output_ref,'utf8')).toBe('abc');
  });
  it("reaps on timeout before releasing output waiting and then saves the received abc",async()=>{
    const options=fixture(),pidPath=join(options.cwd,'child.pid');let release,waiting;
    const entered=new Promise(resolve=>waiting=resolve),blocked=new Promise(resolve=>release=resolve);
    const execution=captureCommand({...options,timeoutMs:300,argv:node(`require('node:fs').writeFileSync(${JSON.stringify(pidPath)},String(process.pid));process.stdout.write('abc');setInterval(()=>{},1000)`),performWrite:async(r,actual)=>{if(r.kind==='chunk'){waiting();await blocked;}return actual();}}).then(value=>({value}),error=>({error}));
    await entered;
    try {await expectReaped(Number(readFileSync(pidPath,'utf8')));} finally {release();}
    const {value,error}=await execution;expect(error).toBeUndefined();
    expect(value).toMatchObject({exit_code:124,timed_out:true,cancelled:false,signal:'SIGKILL'});
    expect(JSON.parse(readFileSync(value.receipt_ref,'utf8'))).toMatchObject({exit_code:124,timed_out:true,signal:'SIGKILL'});
    expect(readFileSync(value.output_ref,'utf8')).toBe('abc');
  });
  it.each(['cancel','timeout'])('retains prefix and real %s facts when a received next chunk and receipt exceed the actual task budget',async mode=>{
    const {createTask}=await import('../../runtime/task/task-handle.mjs');
    const {createTaskDiskWriteExecutor}=await import('../../runtime/evidence/disk-budget.mjs');
    const {withLock}=await import('../../runtime/interface/record-lock.mjs');
    const cwd=tempRoot('wh-native-real-budget-');
    const task=await createTask({storageRoot:cwd,manifest:{schema_version:'1.0.0',project_name:'native-budget',task_id:'received-chunk',created_at:'2026-10-21T00:00:00Z',target_repo_root:cwd,activation_cohort:'post',execution_mode:'per_invocation',record_model:'vnext-single-write',issue_ids:[],inputs:{}}});
    const recordDir=task.recordPath('quality/tests');mkdirSync(recordDir,{recursive:true});
    const budget=createTaskDiskWriteExecutor({taskRoot:task.taskPath,limits:{tests:{softBytes:3,hardBytes:3,hardFiles:100}}});
    const controller=new AbortController(),pidPath=join(cwd,'child.pid'),nextPath=join(cwd,'write-next');
    let prefixReady,nextReady,release,lockReady;let chunks=0;
    const prefix=new Promise(resolve=>prefixReady=resolve),next=new Promise(resolve=>nextReady=resolve),blocked=new Promise(resolve=>release=resolve),locked=new Promise(resolve=>lockReady=resolve);
    const execution=captureCommand({cwd,recordDir,slug:'bounded-interruption',...(mode==='timeout'?{timeoutMs:1000}:{signal:controller.signal}),argv:node(`const fs=require('node:fs');fs.writeFileSync(${JSON.stringify(pidPath)},String(process.pid));process.stdout.write('abc');const timer=setInterval(()=>{if(fs.existsSync(${JSON.stringify(nextPath)})){clearInterval(timer);process.stdout.write('def');setInterval(()=>{},1000);}},5);`),performWrite:async(r,actual)=>{
      if(r.kind==='chunk'){chunks++;if(chunks===2)nextReady();}
      const result=await budget(r,actual);if(r.kind==='chunk'&&chunks===1)prefixReady(r.path);return result;
    }}).then(value=>({value}),error=>({error}));
    const outputRef=await prefix;
    const holder=withLock(task.taskPath,'disk-budget-tests',async()=>{lockReady();await blocked;});
    await locked;writeFileSync(nextPath,'next');await next;
    if(mode==='cancel')controller.abort('SIGTERM');
    try {await expectReaped(Number(readFileSync(pidPath,'utf8')));expect(readFileSync(outputRef,'utf8')).toBe('abc');} finally {release();}
    await holder;const {error:caught}=await execution;
    expect(caught).toMatchObject({code:'DISK_BUDGET_EXCEEDED',receipt_saved:false,output_ref:outputRef,execution:{exit_code:mode==='cancel'?143:124,signal:'SIGKILL',cancelled:mode==='cancel',timed_out:mode==='timeout'}});
    expect(caught.receipt_ref).toBeUndefined();expect(readFileSync(outputRef,'utf8')).toBe('abc');
    expect(readdirSync(recordDir)).toEqual([outputRef.split('/').at(-1)]);
    if(mode==='cancel')expect(caught.execution_error).toMatchObject({code:'CAPTURE_FAILED',cause:{code:'DISK_BUDGET_EXCEEDED'},interruption:{code:'ABORT_ERR'}});
    else expect(caught.execution_error).toMatchObject({code:'DISK_BUDGET_EXCEEDED'});
    expect(chunks).toBe(2);
  });
  it("exposes the original spawn error even when its receipt is refused", async()=>{
    const options=fixture(); let caught;
    try {await captureCommand({...options,argv:[join(options.cwd,'missing-command')],performWrite:async(r,actual)=>{if(r.kind==='receipt')throw Object.assign(new Error('full'),{code:'TASK_DISK_BUDGET_EXCEEDED'});return actual();}});}catch(e){caught=e;}
    expect(caught).toMatchObject({receipt_saved:false,execution:{exit_code:null,error:{code:'ENOENT'}},execution_error:{code:'ENOENT'}});
  });
  it.each(["same-byte-new-inode", "symlink-replacement"])("does not report receipt_saved after %s", async replacement => {
    const fs = await import("node:fs");
    const options = fixture(); let caught;
    try {
      await captureCommand({ ...options, argv: node("process.exit(3)"), performWrite: async (request, actual) => {
        const result = await actual();
        if (request.kind === "receipt") {
          const original = readFileSync(request.path), backup = `${request.path}.published`;
          fs.renameSync(request.path, backup);
          if (replacement === "symlink-replacement") fs.symlinkSync(backup, request.path);
          else fs.writeFileSync(request.path, original);
          throw Object.assign(new Error("receipt replaced after publish"), { code: "RECEIPT_REPLACED_AFTER_PUBLISH" });
        }
        return result;
      } });
    } catch (error) { caught = error; }
    expect(caught).toMatchObject({ code: "RECEIPT_REPLACED_AFTER_PUBLISH", receipt_saved: false, execution: { exit_code: 3 } });
    expect(caught.receipt_ref).toBeUndefined();
  });
});
