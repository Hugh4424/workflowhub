import { afterEach, describe, expect, it } from "vitest";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { hostname, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createTask, openTask } from "../../runtime/task/task-handle.mjs";

const temporaryDirs = [];
const modulePath = resolve(dirname(fileURLToPath(import.meta.url)), "../../runtime/task/task-handle.mjs");

function manifest(overrides = {}) {
  return {
    schema_version: "1.0.0",
    activation_cohort: "post",
    execution_mode: "per_invocation",
    record_model: "vnext-single-write",
    task_id: "paperbuilder-phase-foundation",
    project_name: "PaperBuilder",
    created_at: "2026-07-16T00:00:00.000Z",
    target_repo_root: "/absolute/PaperBuilder",
    issue_ids: [],
    inputs: {},

    ...overrides,
  };
}

function fixture() {
  const storageRoot = realpathSync(
    mkdtempSync(join(tmpdir(), "workflowhub-task-handle-")),
  );
  temporaryDirs.push(storageRoot);
  const taskPath = join(
    storageRoot,
    "Projects",
    "PaperBuilder",
    "tasks",
    "paperbuilder-phase-foundation",
  );
  return { storageRoot, taskPath };
}

afterEach(() => {
  while (temporaryDirs.length > 0) {
    rmSync(temporaryDirs.pop(), { recursive: true, force: true });
  }
});


function isolated(source, args = []) {
  return execFileSync(process.execPath, ["--input-type=module", "-e", source, "p8-owned-module-probe", ...args], {encoding:"utf8",stdio:["ignore","pipe","pipe"]});
}
const faultProbe = String.raw`
  import assert from 'node:assert/strict';
  import fs from 'node:fs';
  import {syncBuiltinESMExports} from 'node:module';
  import {join} from 'node:path';
  const [modulePath,taskPath,mode,outside] = process.argv.slice(2);
  const {openTask}=await import(modulePath);
  const task=openTask(taskPath,'PaperBuilder','paperbuilder-phase-foundation');
  const directory=join(taskPath,'records'), target=join(directory,'result.json');
  fs.mkdirSync(directory,{recursive:true});
  if(!mode.startsWith('swap')) await task.writeRecordAtomic('records/result.json','{"value":"old"}\n');
  const original={openSync:fs.openSync,writeFileSync:fs.writeFileSync,fsyncSync:fs.fsyncSync,renameSync:fs.renameSync};
  const opened=new Map();let injected=false;
  const temporary=path=>typeof path==='string'&&path.startsWith(directory+'/.result.json.')&&path.endsWith('.tmp');
  const inject=()=>{injected=true;throw new Error(mode==='file'?'file fsync failure':mode==='directory'?'directory fsync failure':'rename preparation failure');};
  fs.openSync=(path,...rest)=>{
    if(mode==='swap-precheck'&&!injected&&temporary(path)) {injected=true;fs.rmSync(directory,{recursive:true});fs.symlinkSync(outside,directory,'dir');}
    const fd=original.openSync(path,...rest);opened.set(fd,String(path));return fd;
  };
  fs.writeFileSync=(fd,...rest)=>{
    const result=original.writeFileSync(fd,...rest);
    if(mode==='swap-open'&&!injected&&temporary(opened.get(fd))) {injected=true;fs.renameSync(directory,directory+'-parked');fs.symlinkSync(outside,directory,'dir');}
    return result;
  };
  fs.fsyncSync=fd=>{const path=opened.get(fd);if(!injected&&((mode==='file'&&temporary(path))||(mode==='directory'&&path===directory&&fs.fstatSync(fd).isDirectory())))inject();return original.fsyncSync(fd);};
  fs.renameSync=(from,to)=>{if(mode==='rename'&&!injected&&to===target)inject();return original.renameSync(from,to);};
  syncBuiltinESMExports();
  let error;
  try {await task.writeRecordAtomic('records/result.json','{"value":"new"}\n');} catch(e){error=e;}
  finally {Object.assign(fs,original);syncBuiltinESMExports();}
  assert.equal(injected,true,'the actual owned syscall injection must have fired');
  assert.ok(error,'real write must reject the injected failure');
  if(mode.startsWith('swap')) {assert.equal(error.code,'ANCESTOR_REPLACED');assert.equal(fs.existsSync(join(outside,'result.json')),false);}
  else {
    assert.match(error.message,mode==='file'?/file fsync failure/:mode==='directory'?/directory fsync failure/:/rename preparation failure/);
    const expected=mode==='directory'?'new':'old';
    assert.equal(task.readRecord('records/result.json'),'{'+'"value":"'+expected+'"}\n');
    assert.deepEqual(JSON.parse(task.readRecord('records/result.json')),{value:expected});
    assert.deepEqual(fs.readdirSync(directory).filter(n=>n.startsWith('.result.json.')&&n.endsWith('.tmp')),[]);
    await task.writeRecordAtomic('records/result.json','{"value":"recovered"}\n');
    assert.deepEqual(JSON.parse(task.readRecord('records/result.json')),{value:'recovered'});
  }
  process.stdout.write('injected/rejected/oracle-preserved\n');
`;


const lockModulePath=resolve(dirname(modulePath),'../interface/record-lock.mjs');
const machineProbe=String.raw`
 import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import {syncBuiltinESMExports}from'node:module';import{join}from'node:path';
 const [modulePath,root,mode]=process.argv.slice(2),physical={en0:[{internal:false,mac:'aa:bb:cc:dd:ee:ff'}]};
 let currentHost='MacBook-Pro.local',interfaces=physical;
 os.hostname=()=>currentHost;os.networkInterfaces=()=>interfaces;syncBuiltinESMExports();
 const {withLock}=await import(modulePath),path=join(root,'.machine.lock');
 const own=async()=>{let owner;await withLock(root,'machine',()=>{owner=JSON.parse(fs.readFileSync(path,'utf8'));});return owner;};
 const initial=await own();assert.match(initial.machine_id??'',/^[a-f0-9]{64}$/,'real lock owners must expose the bound physical-interface digest');
 const attempt=async(host,machine,expected,live=false)=>{
   const owner={pid:live?process.pid:99999999,host,nonce:'owned-dead-owner',started_at:'2000-01-01T00:00:00.000Z',...(machine===undefined?{}:{machine_id:machine})};
   const bytes=JSON.stringify(owner)+'\n';fs.writeFileSync(path,bytes);let entered=false,error;
   try{await withLock(root,'machine',()=>{entered=true;},{waitMs:0});}catch(e){error=e;}
   assert.equal(entered,expected,host+' recovery expectation');
   if(expected)assert.equal(fs.existsSync(path),false);else{assert.equal(error?.code,'LOCK_HELD');assert.equal(error?.exitCode,75);assert.equal(fs.readFileSync(path,'utf8'),bytes);fs.unlinkSync(path);}
 };
 if(mode==='aliases'){
  await attempt('MacBook-Pro',initial.machine_id,true);currentHost='MACBOOK-PRO';await attempt('macbook-pro.local',initial.machine_id,true);currentHost='MacBook-Pro.local';
  for(const host of ['MacBook-Pro.remote','MacBook-Pro.local.local','MacBook.Pro','Other-Mac'])await attempt(host,initial.machine_id,false);
  currentHost='MacBook.Pro.local';await attempt('MacBook.Pro',initial.machine_id,false);
 }else if(mode==='bindings'){
  await attempt('MacBook-Pro',initial.machine_id,true);await attempt('MacBook-Pro','b'.repeat(64),false);await attempt('MacBook-Pro',undefined,false);
  currentHost='MacBook-Pro';await attempt('MacBook-Pro','b'.repeat(64),true);await attempt('MacBook-Pro',undefined,true);await attempt('MacBook-Pro',initial.machine_id,false,true);
 }else if(mode==='digest'){
  interfaces={...physical,utun3:[{internal:false,mac:'01:02:03:04:05:06'}],awdl0:[{internal:false,mac:'02:03:04:05:06:07'}],docker0:[{internal:false,mac:'03:04:05:06:07:08'}],lo0:[{internal:true,mac:'04:05:06:07:08:09'}]};syncBuiltinESMExports();
  assert.equal((await own()).machine_id,initial.machine_id);
  interfaces={en0:[{internal:false,mac:'aa:bb:cc:dd:ee:00'}]};syncBuiltinESMExports();assert.notEqual((await own()).machine_id,initial.machine_id);
 }else{
  const virtual={utun3:[{internal:false,mac:'01:02:03:04:05:06'}],awdl0:[{internal:false,mac:'02:03:04:05:06:07'}],docker0:[{internal:false,mac:'03:04:05:06:07:08'}],lo0:[{internal:true,mac:'04:05:06:07:08:09'}],enp_fake:[{internal:false,mac:'05:06:07:08:09:0a'}],wl_fake:[{internal:false,mac:'06:07:08:09:0a:0b'}]};
  interfaces=mode==='no-physical'?{}:virtual;syncBuiltinESMExports();
  const unbound=await own();assert.ok(unbound.machine_id===undefined||unbound.machine_id===null,'missing physical interfaces must not produce an empty-list digest');
  await attempt('MacBook-Pro',initial.machine_id,false);await attempt('MacBook-Pro',undefined,false);
  currentHost='MacBook-Pro';await attempt('MacBook-Pro',initial.machine_id,true);await attempt('MacBook-Pro',undefined,true);
 }
 process.stdout.write('machine-oracles-preserved\n');
`;

describe("TaskHandle", () => {
  it("enumerates only sorted regular canonical review results", async () => {
    const { storageRoot, taskPath } = fixture();
    const task = await createTask({ storageRoot, taskPath, manifest: manifest() });
    const resultsRoot = join(taskPath, "quality", "reviews", "results");
    mkdirSync(resultsRoot, { recursive: true });
    writeFileSync(join(resultsRoot, "z.json"), "{}");
    writeFileSync(join(resultsRoot, "a.json"), "{}");
    writeFileSync(join(resultsRoot, "ignored.txt"), "{}");
    expect(task.listCanonicalReviewResultRefs()).toEqual([
      "quality/reviews/results/a.json",
      "quality/reviews/results/z.json",
    ]);
  });

  it("does not enumerate retired review-resolution records", async () => {
    const { storageRoot, taskPath } = fixture();
    const task = await createTask({ storageRoot, taskPath, manifest: manifest() });
    const auditsRoot = join(taskPath, "quality", "reviews", "resolutions");
    mkdirSync(auditsRoot, { recursive: true });
    const a = "a".repeat(64), b = "b".repeat(64);
    writeFileSync(join(auditsRoot, `${b}.json`), "{}");
    writeFileSync(join(auditsRoot, `${a}.json`), "{}");
    writeFileSync(join(auditsRoot, "ignored.txt"), "{}");
    expect(task.listCanonicalReviewResultRefs()).toEqual([]);
  });

  it("does not expose retired review-flow operations from the current TaskHandle", async () => {
    const { storageRoot, taskPath } = fixture();
    const task = await createTask({
      storageRoot,
      taskPath,
      manifest: manifest({ activation_cohort: "post", execution_mode: "per_invocation" }),
    });

    for (const operation of [
      "readReviewFlow",
      "readReviewFlowHistory",
      "deriveReviewFlowIdentity",
      "withReviewFlowLock",
      "recordReviewAttempt",
      "assertReviewFlowReady",
      "advanceReviewFlow",
      "adoptLegacyReviewRoot",
    ]) {
      expect(task[operation]).toBeUndefined();
    }
  });

  it("creates task.json once and opens it only with matching path and identity", async () => {
    const { storageRoot, taskPath } = fixture();
    const manifest = {
      schema_version: "1.0.0",
      activation_cohort: "post",
      execution_mode: "per_invocation",
      record_model: "vnext-single-write",
      task_id: "paperbuilder-phase-foundation",
      project_name: "PaperBuilder",
      created_at: "2026-07-16T00:00:00.000Z",
      target_repo_root: "/absolute/PaperBuilder",
      issue_ids: ["ZHI-138"],
      inputs: {},

    };

    const created = await createTask({ storageRoot, taskPath, manifest });
    expect(created.identity).toEqual({
      projectName: "PaperBuilder",
      taskId: "paperbuilder-phase-foundation",
    });
    const persistedManifest = manifest;
    expect(JSON.parse(readFileSync(join(taskPath, "task.json"), "utf8"))).toEqual(persistedManifest);

    const opened = openTask(
      taskPath,
      "PaperBuilder",
      "paperbuilder-phase-foundation",
    );
    expect(opened.manifest).toEqual(persistedManifest);
    await expect(createTask({ storageRoot, taskPath, manifest })).rejects.toThrow(/already exists|create-only|EEXIST/i);
  });

  it("opens a case-preserving task path after macOS realpath canonicalizes directory case", async ({ skip }) => {
    if (process.platform !== "darwin") skip("macOS realpath case canonicalization is platform-specific");
    const { storageRoot, taskPath } = fixture();
    const postManifest = {
      schema_version: "1.0.0",
      record_model: "vnext-single-write",
      task_id: "paperbuilder-phase-foundation",
      project_name: "PaperBuilder",
      created_at: "2026-07-16T00:00:00.000Z",
      target_repo_root: "/absolute/PaperBuilder",
      activation_cohort: "post",
      execution_mode: "per_invocation",

      issue_ids: [],
      inputs: {},
    };
    const created = await createTask({ storageRoot, taskPath, manifest: postManifest });
    const projectRoot = join(storageRoot, "Projects", "PaperBuilder");
    const caseSwap = `${projectRoot}-case-swap`;
    const lowerProjectRoot = join(storageRoot, "Projects", "paperbuilder");
    renameSync(projectRoot, caseSwap);
    renameSync(caseSwap, lowerProjectRoot);

    if (!existsSync(taskPath)) skip("filesystem requires the renamed directory's exact case");
    const canonicalTaskPath = realpathSync(taskPath);
    const lowerTaskPath = join(lowerProjectRoot, "tasks", "paperbuilder-phase-foundation");
    if (canonicalTaskPath === taskPath || canonicalTaskPath !== realpathSync(lowerTaskPath)) {
      skip("filesystem realpath did not produce the case difference required by this test");
    }

    const opened = openTask(taskPath, "PaperBuilder", "paperbuilder-phase-foundation");
    expect(created.identity).toEqual({
      projectName: "PaperBuilder",
      taskId: "paperbuilder-phase-foundation",
    });
    expect(opened.identity).toEqual(created.identity);
    expect(opened.manifest).toEqual(postManifest);
  });

  it("opens a case-mismatched task path on case-insensitive macOS filesystems", async ({ skip }) => {
    if (process.platform !== "darwin") skip("case-insensitive macOS path aliases are platform-specific");
    const { storageRoot } = fixture();
    const postManifest = {
      schema_version: "1.0.0",
      record_model: "vnext-single-write",
      task_id: "paperbuilder-phase-foundation",
      project_name: "paperbuilder",
      created_at: "2026-07-16T00:00:00.000Z",
      target_repo_root: "/absolute/paperbuilder",
      activation_cohort: "post",
      execution_mode: "per_invocation",

      issue_ids: [],
      inputs: {},
    };
    const taskPath = join(
      storageRoot,
      "Projects",
      "paperbuilder",
      "tasks",
      postManifest.task_id,
    );
    const aliasTaskPath = join(
      storageRoot,
      "Projects",
      "PaperBuilder",
      "tasks",
      postManifest.task_id,
    );
    const created = await createTask({ storageRoot, taskPath, manifest: postManifest });

    if (!existsSync(aliasTaskPath)) skip("filesystem does not resolve the differently-cased path alias");
    const actualProjectName = realpathSync(aliasTaskPath).split("/").at(-3);
    if (actualProjectName === postManifest.project_name) {
      skip("realpath did not retain a project-name case difference from the manifest identity");
    }
    if (actualProjectName?.toLowerCase() !== postManifest.project_name.toLowerCase()) {
      skip("realpath alias does not resolve to the manifest project identity");
    }

    const opened = openTask(aliasTaskPath, postManifest.project_name, postManifest.task_id);
    expect(created.identity).toEqual({
      projectName: "paperbuilder",
      taskId: "paperbuilder-phase-foundation",
    });
    expect(opened.identity).toEqual(created.identity);
    expect(opened.manifest).toEqual(postManifest);
  });

  it.each([
    ["OtherProject", "paperbuilder-phase-foundation"],
    ["PaperBuilder", "other-task"],
  ])("rejects expected identity mismatch (%s, %s)", async (projectName, taskId) => {
    const { storageRoot, taskPath } = fixture();
    await createTask({ storageRoot, taskPath, manifest: {
      schema_version: "1.0.0",
      activation_cohort: "post",
      execution_mode: "per_invocation",
      record_model: "vnext-single-write",
      task_id: "paperbuilder-phase-foundation",
      project_name: "PaperBuilder",
      created_at: "2026-07-16T00:00:00.000Z",
      target_repo_root: "/absolute/PaperBuilder",
      issue_ids: [],
      inputs: {},
    } });

    expect(() => openTask(taskPath, projectName, taskId)).toThrow(
      /identity|mismatch|does not match/i,
    );
  });

  it("rejects a manifest whose identity disagrees with its directory", async () => {
    const { storageRoot, taskPath } = fixture();
    mkdirSync(taskPath, { recursive: true });
    writeFileSync(
      join(taskPath, "task.json"),
      JSON.stringify({
        schema_version: "1.0.0",
      activation_cohort: "post",
      execution_mode: "per_invocation",
      record_model: "vnext-single-write",
        task_id: "wrong-task",
        project_name: "PaperBuilder",
        created_at: "2026-07-16T00:00:00.000Z",
        target_repo_root: "/absolute/PaperBuilder",
        issue_ids: [],
        inputs: {},

      }),
    );

    expect(() =>
      openTask(taskPath, "PaperBuilder", "paperbuilder-phase-foundation"),
    ).toThrow(/identity|mismatch|directory/i);
  });

  it("keeps recordPath inside taskPath and ignores cwd bait", async () => {
    const { storageRoot, taskPath } = fixture();
    const baitCwd = mkdtempSync(join(tmpdir(), "workflowhub-task-bait-"));
    temporaryDirs.push(baitCwd);
    mkdirSync(join(baitCwd, "tasks", "paperbuilder-phase-foundation"), {
      recursive: true,
    });
    mkdirSync(join(baitCwd, "tasks", "paperbuilder-phase-foundation", "records"), {
      recursive: true,
    });
    writeFileSync(
      join(baitCwd, "tasks", "paperbuilder-phase-foundation", "records", "fixture.json"),
      "bait",
    );
    await createTask({ storageRoot, taskPath, manifest: {
      schema_version: "1.0.0",
      activation_cohort: "post",
      execution_mode: "per_invocation",
      record_model: "vnext-single-write",
      task_id: "paperbuilder-phase-foundation",
      project_name: "PaperBuilder",
      created_at: "2026-07-16T00:00:00.000Z",
      target_repo_root: "/absolute/PaperBuilder",
        issue_ids: [],
        inputs: {},

    } });

    const previousCwd = process.cwd();
    process.chdir(baitCwd);
    try {
      const task = openTask(
        taskPath,
        "PaperBuilder",
        "paperbuilder-phase-foundation",
      );
      expect(task.recordPath("records/fixture.json")).toBe(join(taskPath, "records", "fixture.json"));
      expect(() => task.recordPath("..", "escape.json")).toThrow(
        /escape|relative|unsafe segment|inside task storage/i,
      );
      expect(() => task.recordPath("/absolute.json")).toThrow(/absolute|relative|inside task storage/i);
    } finally {
      process.chdir(previousCwd);
    }
  });

  it("rejects create through a symlinked parent and writes nothing outside storageRoot", async () => {
    const { storageRoot, taskPath } = fixture();
    const outside = mkdtempSync(join(tmpdir(), "workflowhub-task-outside-"));
    temporaryDirs.push(outside);
    symlinkSync(outside, join(storageRoot, "Projects"), "dir");

    await expect(
      createTask({ storageRoot, taskPath, manifest: manifest() }),
    ).rejects.toThrow(/symlink|storage|escape|identity mismatch|real directory/i);
    expect(existsSync(join(outside, "PaperBuilder"))).toBe(false);
  });

  it("requires taskPath containment under the declared storageRoot", async () => {
    const { storageRoot } = fixture();
    const outside = mkdtempSync(join(tmpdir(), "workflowhub-other-storage-"));
    temporaryDirs.push(outside);
    const outsideTaskPath = join(
      outside,
      "Projects",
      "PaperBuilder",
      "tasks",
      "paperbuilder-phase-foundation",
    );

    await expect(
      createTask({ storageRoot, taskPath: outsideTaskPath, manifest: manifest() }),
    ).rejects.toThrow(/storage|contain|escape|derived identity/i);
    expect(existsSync(outsideTaskPath)).toBe(false);
  });

  it("rejects a task.json symlink instead of following it", async () => {
    const { storageRoot, taskPath } = fixture();
    const outside = mkdtempSync(join(tmpdir(), "workflowhub-manifest-outside-"));
    temporaryDirs.push(outside);
    mkdirSync(taskPath, { recursive: true });
    const outsideManifest = join(outside, "task.json");
    writeFileSync(outsideManifest, JSON.stringify(manifest()));
    symlinkSync(outsideManifest, join(taskPath, "task.json"));

    expect(() =>
      openTask(taskPath, "PaperBuilder", "paperbuilder-phase-foundation"),
    ).toThrow(/manifest|symlink|regular file/i);
  });

  it("uses controlled record I/O and refuses an ancestor symlink", async () => {
    const { storageRoot, taskPath } = fixture();
    const outside = mkdtempSync(join(tmpdir(), "workflowhub-record-outside-"));
    temporaryDirs.push(outside);
    const task = await createTask({ storageRoot, taskPath, manifest: manifest() });
    symlinkSync(outside, join(taskPath, "records"), "dir");

    await expect(task.writeRecordAtomic("records/result.json", "bad")).rejects.toThrow(
      /symlink|escape|real directory/i,
    );
    expect(() => task.readRecord("records/secret.json")).toThrow(
      /symlink|escape|real directory/i,
    );
    expect(existsSync(join(outside, "result.json"))).toBe(false);
  });

  it("keeps recordPath display-only; writers remain safe if an ancestor changes", async () => {
    const { storageRoot, taskPath } = fixture();
    const outside = mkdtempSync(join(tmpdir(), "workflowhub-record-swap-"));
    temporaryDirs.push(outside);
    const task = await createTask({ storageRoot, taskPath, manifest: manifest() });
    mkdirSync(join(taskPath, "records"));
    const displayed = task.recordPath("records/result.json");
    rmSync(join(taskPath, "records"), { recursive: true });
    symlinkSync(outside, join(taskPath, "records"), "dir");

    expect(displayed).toBe(join(taskPath, "records", "result.json"));
    await expect(task.writeRecordAtomic("records/result.json", "bad")).rejects.toThrow(
      /symlink|escape|real directory/i,
    );
    expect(existsSync(join(outside, "result.json"))).toBe(false);
  });

  it("revalidates record parent fd after the deterministic precheck swap hook", async () => {
    const {storageRoot,taskPath}=fixture();await createTask({storageRoot,taskPath,manifest:manifest()});
    const outside=realpathSync(mkdtempSync(join(tmpdir(),'workflowhub-injected-outside-')));temporaryDirs.push(outside);
    expect(isolated(faultProbe,[modulePath,taskPath,'swap-precheck',outside])).toBe('injected/rejected/oracle-preserved\n');
  });

  it.each(["afterClaim", "afterTemporary", "beforeRename"])(
    "recovers after a creator is killed at %s without a permanent claim",
    async (phase) => {
      const {storageRoot}=fixture(),taskId=`paperbuilder-${phase.toLowerCase()}`;
      const taskPath=join(storageRoot,'Projects','PaperBuilder','tasks',taskId),taskManifest=manifest({task_id:taskId}),trigger=join(storageRoot,`trigger-${phase}`);
      const code=String.raw`
        import fs from 'node:fs';import {syncBuiltinESMExports}from'node:module';import{dirname,basename,join}from'node:path';
        const [modulePath,storageRoot,taskPath,rawManifest,phase,trigger]=process.argv.slice(1),manifest=JSON.parse(rawManifest);
        const original={openSync:fs.openSync,writeFileSync:fs.writeFileSync,renameSync:fs.renameSync};const fds=new Map();
        const wrapperPrefix='workflowhub-task-'+manifest.task_id+'-create-';
        const kill=()=>{original.writeFileSync(trigger,phase);process.kill(process.pid,'SIGKILL');};
        fs.openSync=(path,...args)=>{const fd=original.openSync(path,...args);fds.set(fd,String(path));return fd;};
        fs.writeFileSync=(fd,...args)=>{const value=original.writeFileSync(fd,...args),path=fds.get(fd)??String(fd);
          if(phase==='afterClaim'&&path.endsWith('/.task-create.lock'))kill();
          if(phase==='afterTemporary'&&path.startsWith(join(dirname(taskPath),wrapperPrefix))&&/\/task\/\.task\.json\..+\.tmp$/.test(path))kill();return value;};
        fs.renameSync=(from,to)=>{if(phase==='beforeRename'&&to===taskPath&&basename(from)==='task'&&dirname(from).startsWith(join(dirname(taskPath),wrapperPrefix)))kill();return original.renameSync(from,to);};
        syncBuiltinESMExports();const {createTask}=await import(modulePath);await createTask({storageRoot,taskPath,manifest});
      `;
      const killed=await new Promise((done,reject)=>{const child=spawn(process.execPath,['--input-type=module','-e',code,modulePath,storageRoot,taskPath,JSON.stringify(taskManifest),phase,trigger],{stdio:['ignore','pipe','pipe']});let stderr='';child.stderr.on('data',b=>stderr+=b);child.once('error',reject);child.once('exit',(status,signal)=>done({status,signal,stderr}));});
      expect(killed.signal,killed.stderr).toBe('SIGKILL');expect(readFileSync(trigger,'utf8')).toBe(phase);
      const recovered=await createTask({storageRoot,taskPath,manifest:taskManifest});expect(recovered.identity.taskId).toBe(taskId);
      expect(JSON.parse(readFileSync(join(taskPath,'task.json'),'utf8'))).toEqual(taskManifest);
      expect(readdirSync(dirname(taskPath)).filter(name=>name.startsWith(`workflowhub-task-${taskId}-create-`))).toEqual([]);
      expect(readdirSync(taskPath)).toEqual(['task.json']);
      expect(existsSync(join(taskPath,'.workflowhub-temp.json'))).toBe(false);
    },
  );

  it("never deletes a sibling named by a malicious stale claim temporary", async () => {
    const { storageRoot, taskPath } = fixture();
    const parent = dirname(taskPath);
    mkdirSync(parent, { recursive: true });
    const sibling = join(parent, "do-not-delete");
    mkdirSync(sibling);
    writeFileSync(join(sibling, "proof.txt"), "safe");
    const claim = join(parent, ".paperbuilder-phase-foundation.create.lock");
    writeFileSync(claim, `${JSON.stringify({
      pid: 99999999,
      host: hostname(),
      started_at: "2000-01-01T00:00:00.000Z",
      temporary: "../do-not-delete",
    })}\n`);

    const claimBytes = readFileSync(claim);
    await createTask({ storageRoot, taskPath, manifest: manifest() });
    expect(existsSync(sibling)).toBe(true);
    expect(readFileSync(claim)).toEqual(claimBytes);
    expect(readFileSync(join(sibling, "proof.txt"), "utf8")).toBe("safe");
  });

  it("blocks a record ancestor swap in the open-to-rename window", async () => {
    const {storageRoot,taskPath}=fixture();await createTask({storageRoot,taskPath,manifest:manifest()});
    const outside=realpathSync(mkdtempSync(join(tmpdir(),'workflowhub-injected-outside-')));temporaryDirs.push(outside);
    expect(isolated(faultProbe,[modulePath,taskPath,'swap-open',outside])).toBe('injected/rejected/oracle-preserved\n');
  });

  it("keeps the old record, cleans the temporary, and recovers after a file-fsync failure", async () => {
    const {storageRoot,taskPath}=fixture();await createTask({storageRoot,taskPath,manifest:manifest()});
    const outside='';
    expect(isolated(faultProbe,[modulePath,taskPath,'file',outside])).toBe('injected/rejected/oracle-preserved\n');
  });

  it("leaves a complete record and recovers after a directory-fsync failure", async () => {
    const {storageRoot,taskPath}=fixture();await createTask({storageRoot,taskPath,manifest:manifest()});
    const outside='';
    expect(isolated(faultProbe,[modulePath,taskPath,'directory',outside])).toBe('injected/rejected/oracle-preserved\n');
  });

  it("keeps the old record and recovers after a rename-preparation failure", async () => {
    const {storageRoot,taskPath}=fixture();await createTask({storageRoot,taskPath,manifest:manifest()});
    const outside='';
    expect(isolated(faultProbe,[modulePath,taskPath,'rename',outside])).toBe('injected/rejected/oracle-preserved\n');
  });

  it("invalidates an open TaskHandle when its task root is replaced at the same path", async () => {
    const { storageRoot, taskPath } = fixture();
    const task = await createTask({ storageRoot, taskPath, manifest: manifest() });
    const original = `${taskPath}-original`;
    renameSync(taskPath, original);
    mkdirSync(taskPath);
    writeFileSync(join(taskPath, "task.json"), JSON.stringify(manifest()));
    writeFileSync(join(taskPath, "bait.json"), "replacement");

    expect(() => task.recordPath("new.json")).toThrow(/changed|replaced|stale|identity/i);
    expect(() => task.readRecord("bait.json")).toThrow(/changed|replaced|stale|identity/i);
    await expect(task.writeRecordAtomic("new.json", "bad")).rejects.toThrow(
      /changed|replaced|stale|identity/i,
    );
    expect(existsSync(join(taskPath, "new.json"))).toBe(false);
    expect(readFileSync(join(taskPath, "bait.json"), "utf8")).toBe("replacement");
  });

  it("honors an explicit bounded wait when another process owns a record lock", async () => {
    const { storageRoot, taskPath } = fixture();
    const task = await createTask({ storageRoot, taskPath, manifest: manifest() });
    const lockRef = "cross-process-wait";
    const code = [
      `import { openTask } from ${JSON.stringify(modulePath)};`,
      `const task = openTask(${JSON.stringify(taskPath)}, "PaperBuilder", "paperbuilder-phase-foundation");`,
      `await task.withRecordLock(${JSON.stringify(lockRef)}, async () => {`,
      `  process.stdout.write("locked\\n");`,
      `  await new Promise((resolve) => setTimeout(resolve, 250));`,
      `});`,
    ].join("\n");
    const child = spawn(process.execPath, ["--input-type=module", "-e", code], { stdio: ["ignore", "pipe", "inherit"] });
    const exited = new Promise((resolveResult, reject) => {
      child.once("error", reject);
      child.once("exit", (status) => status === 0 ? resolveResult() : reject(new Error(`lock holder exited ${status}`)));
    });
    await new Promise((resolveStarted, reject) => {
      child.stdout.once("data", resolveStarted);
      child.once("error", reject);
      child.once("exit", (status) => reject(new Error(`lock holder exited before ready: ${status}`)));
    });

    const held = await task.withRecordLock(lockRef, () => {}, { waitMs: 25 }).then(() => null, error => error);
    expect(held).toMatchObject({code:"LOCK_HELD",exitCode:75,holder:{pid:child.pid}});
    let acquired = false;
    await task.withRecordLock(lockRef, () => { acquired = true; }, { waitMs: 1_000 });
    expect(acquired).toBe(true);
    await exited;
    await expect(task.withRecordLock(lockRef, () => {}, { waitMs: -1 })).rejects.toMatchObject({code:"INVALID_WAIT"});
  });

  it("recognizes only the local short-name and .local hostname aliases for dead record-lock recovery",async()=>{
    const {storageRoot}=fixture();
    expect(isolated(machineProbe,[lockModulePath,storageRoot,'aliases'])).toBe('machine-oracles-preserved\n');
  });
  it("requires a bound machine instance before using PID liveness across hostname aliases",async()=>{
    const {storageRoot}=fixture();
    expect(isolated(machineProbe,[lockModulePath,storageRoot,'bindings'])).toBe('machine-oracles-preserved\n');
  });
  it("derives an alias-machine digest from stable physical interfaces only",async()=>{
    const {storageRoot}=fixture();
    expect(isolated(machineProbe,[lockModulePath,storageRoot,'digest'])).toBe('machine-oracles-preserved\n');
  });

  it.each(['no-physical','virtual-only'])("does not reclaim an alias lock without a physical machine binding (%s)",async mode=>{
    const {storageRoot}=fixture();
    expect(isolated(machineProbe,[lockModulePath,storageRoot,mode])).toBe('machine-oracles-preserved\n');
  });

  it("publishes only the original manifest and preserves an unmarked same-prefix directory",async()=>{
    const {storageRoot,taskPath}=fixture(),parent=dirname(taskPath),taskManifest=manifest();
    mkdirSync(parent,{recursive:true});
    const unknown=join(parent,`workflowhub-task-${taskManifest.task_id}-create-owned-unknown`);
    mkdirSync(unknown);writeFileSync(join(unknown,'proof.txt'),'unknown-original');
    const task=await createTask({storageRoot,taskPath,manifest:taskManifest});
    expect(task.identity).toEqual({projectName:taskManifest.project_name,taskId:taskManifest.task_id});
    expect(readdirSync(taskPath)).toEqual(['task.json']);
    expect(JSON.parse(readFileSync(join(taskPath,'task.json'),'utf8'))).toEqual(taskManifest);
    expect(existsSync(join(taskPath,'.workflowhub-temp.json'))).toBe(false);
    expect(readdirSync(unknown)).toEqual(['proof.txt']);
    expect(readFileSync(join(unknown,'proof.txt'),'utf8')).toBe('unknown-original');
  });

  it.each(['unknown-directory','dangling-symlink'])("refuses an existing canonical task target without touching it (%s)",async kind=>{
    const {storageRoot,taskPath}=fixture(),parent=dirname(taskPath);mkdirSync(parent,{recursive:true});
    const missing=join(storageRoot,'never-created');
    if(kind==='unknown-directory'){mkdirSync(taskPath);writeFileSync(join(taskPath,'proof.txt'),'unknown-canonical-original');}
    else symlinkSync(missing,taskPath,'dir');
    await expect(createTask({storageRoot,taskPath,manifest:manifest()})).rejects.toMatchObject({code:'EEXIST'});
    if(kind==='unknown-directory'){expect(readdirSync(taskPath)).toEqual(['proof.txt']);expect(readFileSync(join(taskPath,'proof.txt'),'utf8')).toBe('unknown-canonical-original');}
    else {const {lstatSync,readlinkSync}=await import('node:fs');expect(lstatSync(taskPath).isSymbolicLink()).toBe(true);expect(readlinkSync(taskPath)).toBe(missing);expect(existsSync(missing)).toBe(false);}
    expect(readdirSync(parent).filter(name=>name.startsWith('workflowhub-task-paperbuilder-phase-foundation-create-'))).toEqual([]);
  });

  it("publishes task creation atomically and leaves no orphan on serialization failure", async () => {
    const { storageRoot, taskPath } = fixture();
    const invalid = manifest({ inputs: { cannotSerialize: 1n } });

    await expect(createTask({ storageRoot, taskPath, manifest: invalid })).rejects.toThrow();
    expect(existsSync(taskPath)).toBe(false);
    expect(
      existsSync(join(dirname(taskPath), `.paperbuilder-phase-foundation.tmp`)),
    ).toBe(false);
  });

  it("allows exactly one winner when two processes create the same task", async () => {
    const { storageRoot, taskPath } = fixture();
    const taskManifest = manifest();
    const code = [
      `import { createTask } from ${JSON.stringify(modulePath)};`,
      `const storageRoot = ${JSON.stringify(storageRoot)};`,
      `const taskPath = ${JSON.stringify(taskPath)};`,
      `const manifest = ${JSON.stringify(taskManifest)};`,
      "try { await createTask({ storageRoot, taskPath, manifest }); process.exit(0); }",
      "catch { process.exit(23); }",
    ].join("\n");

    const run = () =>
      new Promise((resolveResult) => {
        const child = spawn(process.execPath, ["--input-type=module", "-e", code], {
          stdio: "ignore",
        });
        child.once("exit", (status) => resolveResult(status));
      });
    const statuses = await Promise.all([run(), run()]);

    expect(statuses.sort((a, b) => a - b)).toEqual([0, 23]);
    expect(JSON.parse(readFileSync(join(taskPath, "task.json"), "utf8"))).toEqual(
      taskManifest,
    );
  });
});
