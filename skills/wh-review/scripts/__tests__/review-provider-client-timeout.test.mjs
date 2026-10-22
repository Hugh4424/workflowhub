import { expect, test } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { ReviewProviderClient } from "../review-provider-client.mjs";

const materials = {
  bundleRoot: "/tmp/bundle",
  attachmentRoot: "/tmp/attachments",
  materialId: "material-id",
  sourcePrefix: ".wh-review-packets",
  deliveryManifest: [],
};

test("managed broker CLI has no implicit local deadline", () => {
  const client = new ReviewProviderClient({ command: [process.execPath], config: "fixture-config" });
  expect(client.timeoutMs).toBeNull();
});

test("broker timeout environment does not create a default deadline", () => {
  const url = new URL("../review-provider-client.mjs", import.meta.url).href;
  const result = execFileSync(process.execPath, ["--input-type=module", "-e", `const {ReviewProviderClient} = await import(${JSON.stringify(url)}); process.stdout.write(JSON.stringify(new ReviewProviderClient({invoke:async()=>{}}).timeoutMs));`], {
    env: { ...process.env, WH_REVIEW_BROKER_TIMEOUT_MS: "25" }, encoding: "utf8",
  });
  expect(JSON.parse(result)).toBeNull();
});

test("client bounds a hanging broker and returns a typed timeout", async () => {
  const client = new ReviewProviderClient({
    command: [process.execPath, "-e", "setTimeout(() => {}, 1000)"],
    config: "fixture-config",
    timeoutMs: 25,
  });
  await expect(client.runGroup({
    hostProvider: "codex/terra",
    providers: ["codex/luna"],
    materials,
    prompt: "review",
    minimumHeterologous: 1,
  })).rejects.toMatchObject({ code: "PROCESS_TIMEOUT" });
});

test("client abort kills its local broker process group and returns a typed cancellation", async () => {
  const root = mkdtempSync(join(tmpdir(), "review-client-abort-"));
  const marker = join(root, "broker.pid");
  const controller = new AbortController();
  let childPid = null;
  try {
    const client = new ReviewProviderClient({
      command: [process.execPath, "-e", `require("node:fs").writeFileSync(${JSON.stringify(marker)}, String(process.pid)); setInterval(() => {}, 1000);`, marker],
      config: "fixture-config",
      timeoutMs: 1_000,
    });
    const pending = client.runGroup({
      hostProvider: "codex/terra",
      providers: ["codex/luna"],
      materials,
      prompt: "review",
      minimumHeterologous: 1,
      signal: controller.signal,
    });
    const deadline = Date.now() + 2_000;
    while (Date.now() < deadline) {
      try {
        childPid = Number(readFileSync(marker, "utf8"));
        if (Number.isInteger(childPid) && childPid > 0) break;
      } catch { /* child has not published its local pid marker yet */ }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(childPid).toEqual(expect.any(Number));
    controller.abort(Object.assign(new Error("test cancellation"), { code: "REVIEW_CANCELLED" }));
    await expect(pending).rejects.toMatchObject({ code: "PROCESS_CANCELLED" });
    expect(() => process.kill(childPid, 0)).toThrow(/ESRCH/);
  } finally {
    controller.abort();
    if (Number.isInteger(childPid) && childPid > 0) {
      try { process.kill(childPid, "SIGKILL"); } catch { /* expected after abort */ }
    }
    rmSync(root, { recursive: true, force: true });
  }
});

const member = (provider, adapter = provider.split("/", 1)[0], status = "completed") => ({
  attempts: [{
    attempt_id: `${provider}-attempt-1`, completed_at_ms: 20, duration_ms: 10,
    error: status === "completed" ? null : { code: "PROCESS_DEAD", message: "dead" },
    kind: "initial", provider_retry_count: 0, session_id: null, started_at_ms: 10, status,
  }],
  continuable: false,
  deadline_ms: null,
  error: status === "completed" ? null : { code: "PROCESS_DEAD", message: "dead" },
  identity: { adapter, config_id: `${provider}-config`, model: null, provider, source_id: `${provider}-source` },
  material: { contract_hash: "contract-hash", contract_id: "contract-id", material_id: "material-id", semantic_hash: "semantic-hash" },
  output: status === "completed" ? "{\"findings\":[]}" : null,
  provenance: { raw_output_sha256: null, raw_stderr_sha256: null, runtime_id: "runtime-v3" },
  recovery: { fresh_execution_retry_count: 0, provider_internal_retry_count: 0, same_session_repair_count: 0 },
  result_protocol: "workflowhub-result.v3",
  session_id: null,
  status,
  timing: { completed_at_ms: 20, duration_ms: 10, started_at_ms: 10 },
  usage: null,
});

function group(providers = ["opencode/v4flash", "codex/luna"]) {
  return {
    // The broker echoes the fixed WorkflowHub host identity it was sent.
    host_provider: "dsh",
    material_id: "material-id",
    outcome: "completed",
    providers: providers.map((provider) => member(provider)),
    round: 1,
    runtime_id: "runtime-v3",
    selected_tier: null,
    version: "workflowhub-result.v3",
  };
}


const timeoutRun = (wire, strictProtocol = false) => new ReviewProviderClient({ invoke: async () => wire }).runGroup({
  hostProvider: "codex/terra", providers: ["codex/luna", "kimi/coding"], materials, prompt: "review", strictProtocol,
  minimumHeterologous: 1,
});
const partial = () => ({ ...group(["codex/luna", "kimi/coding"]), outcome: "partial", providers: [member("codex/luna"), member("kimi/coding", "kimi", "cancelled")] });

test("timeout preserves a strictly valid same-call partial terminal and cancelled sibling", async () => {
  const result = await timeoutRun({ timedOut: true, exitCode: 143, signal: null, stdout: JSON.stringify(partial()), stderr: "" });
  expect(result.outcome).toBe("partial");
  expect(result.transport_timeout).toMatchObject({ code: "PROCESS_TIMEOUT", exit_code: 143 });
  expect(result.providers.map(({ status }) => status)).toEqual(["completed", "cancelled"]);
  expect(result.providers[0].output).toBe('{"findings":[]}');
  expect(result.providers[1].error.code).toBe("PROCESS_DEAD");
});

test.each(["fragment", "stderr", "bad-exit", "wrong-material", "wrong-provider", "running"])('timeout rejects %s instead of inventing semantic output', async (kind) => {
  const value = partial();
  if (kind === "wrong-material") value.material_id = "other";
  if (kind === "wrong-provider") value.providers[0].identity.provider = "unknown/profile";
  if (kind === "running") value.providers[0].status = "running";
  const wire = { timedOut: true, exitCode: kind === "bad-exit" ? 9 : 143, stdout: kind === "fragment" ? '{"version":' : kind === "stderr" ? "" : JSON.stringify(value), stderr: kind === "stderr" ? JSON.stringify(value) : "" };
  await expect(timeoutRun(wire)).rejects.toMatchObject({ code: ["wrong-material", "wrong-provider", "running"].includes(kind) ? "PROTOCOL_INCOMPATIBLE" : "PROCESS_TIMEOUT" });
});

// T037: lifecycle assertions exercise real filesystem effects and owned processes.
const tempHelperUrl = new URL("../../../../runtime/interface/temp-dir.mjs", import.meta.url).href;
const clientUrl = new URL("../review-provider-client.mjs", import.meta.url).href;
const tempMarker = ".workflowhub-temp.json";
function tempChild(source, { env = {} } = {}) {
  return execFileSync(process.execPath, ["--input-type=module", "-e", source], {
    encoding: "utf8", env: { ...process.env, ...env }, timeout: 10_000,
  });
}

test("T037 real CLI success, nonzero and cancellation dispose their marked request directories", () => {
  for (const mode of ["success", "nonzero", "cancel", "timeout"]) {
    const root = mkdtempSync(join(tmpdir(), "t037-cli-"));
    try {
      const broker = `const fs=require('node:fs'),path=require('node:path');const arg=process.argv.find(a=>a.startsWith('--request='));const dir=path.dirname(arg.slice(10));fs.writeFileSync(${JSON.stringify(join(root, "observed.json"))},JSON.stringify({dir,marked:fs.existsSync(path.join(dir,${JSON.stringify(tempMarker)}))}));${mode === "success" ? `console.log(${JSON.stringify(JSON.stringify(group()))})` : mode === "nonzero" ? `console.log(${JSON.stringify(JSON.stringify(group()))});process.exitCode=7` : "setInterval(()=>{},1000)"}`;
      const output = tempChild(`
        import fs from 'node:fs';import path from 'node:path';
        const {ReviewProviderClient}=await import(${JSON.stringify(clientUrl)});
        const controller=new AbortController();
        const client=new ReviewProviderClient({command:[process.execPath,'-e',${JSON.stringify(broker)}],config:'owned',timeoutMs:${mode === "timeout" ? 100 : 2000}});
        let cancel;
        if(${JSON.stringify(mode)}==='cancel') cancel=setInterval(()=>{if(fs.existsSync(${JSON.stringify(join(root, "observed.json"))}))controller.abort();},10);
        let outcome,message;try{await client.runGroup({hostProvider:'codex/terra',providers:['opencode/v4flash','codex/luna'],materials:${JSON.stringify(materials)},prompt:'review',minimumHeterologous:1,signal:controller.signal});outcome='completed';}catch(e){outcome=e.code;message=e.message;}finally{clearInterval(cancel);}
        const observed=JSON.parse(fs.readFileSync(${JSON.stringify(join(root, "observed.json"))},'utf8'));
        console.log(JSON.stringify({...observed,outcome,message,remaining:fs.existsSync(observed.dir)}));
      `, { env: { TMPDIR: root, TMP: root, TEMP: root } });
      const result = JSON.parse(output);
      expect(result.marked).toBe(true);
      expect(result.remaining).toBe(false);
      if(mode === "nonzero")expect(result.message).toContain("exit=7");
      expect(result.outcome).toBe(mode === "success" ? "completed" : mode === "nonzero" ? "BROKER_EXIT_NONZERO" : mode === "timeout" ? "PROCESS_TIMEOUT" : "PROCESS_CANCELLED");
    } finally { rmSync(root, { recursive: true, force: true }); }
  }
});

test("T037 helper creates disposable directories and refuses untracked prefix matches", async () => {
  const helper = await import(tempHelperUrl).catch((error) => ({ importError: error.code }));
  expect(helper.createTrackedTempDir).toEqual(expect.any(Function));
  const root = (await import("node:fs")).realpathSync(mkdtempSync(join(tmpdir(), "t037-owned-")));
  try {
    const dir = helper.createTrackedTempDir("wh-review-public-", { root });
    const marker = JSON.parse(readFileSync(join(dir.path, tempMarker), "utf8"));
    expect(marker).toMatchObject({ pid: process.pid, prefix: "wh-review-public-" });
    dir.dispose();dir.dispose();
    expect((await import("node:fs")).existsSync(dir.path)).toBe(false);
    const unknown = mkdtempSync(join(root, "wh-review-public-"));
    helper.cleanupStaleTempDirs({ root, prefixes: ["wh-review-public-"], olderThanMs: 0, pidAlive: () => false });
    expect((await import("node:fs")).existsSync(unknown)).toBe(true);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("T037 stale cleanup needs an old marker, a dead pid and real directory/marker paths", async () => {
  const helper = await import(tempHelperUrl).catch((error) => ({ importError: error.code }));
  expect(helper.createTrackedTempDir).toEqual(expect.any(Function));
  const fs = await import("node:fs");
  const root = fs.realpathSync(mkdtempSync(join(tmpdir(), "t037-stale-")));
  try {
    // SIGKILL deliberately leaves the marker; the next call is the cleanup boundary.
    const leave = (prefix = "wh-review-public-") => {
      const source = `const fs=require('node:fs');import(${JSON.stringify(tempHelperUrl)}).then(h=>{const d=h.createTrackedTempDir(${JSON.stringify(prefix)},{root:${JSON.stringify(root)}});fs.writeFileSync(${JSON.stringify(join(root,"path.json"))},JSON.stringify({path:d.path}));process.kill(process.pid,'SIGKILL');});`;
      try { execFileSync(process.execPath,["-e",source],{stdio:"pipe",timeout:5000}); } catch (error) { expect(error.signal).toBe("SIGKILL"); }
      return JSON.parse(readFileSync(join(root,"path.json"),"utf8")).path;
    };
    const dead = leave(), alive = leave(), unknown = leave(), young = leave(), foreign = leave("PaperBuilder-");
    const setOld = (dir) => { const file=join(dir,tempMarker),m=JSON.parse(readFileSync(file,"utf8"));m.created_at="2000-01-01T00:00:00.000Z";fs.writeFileSync(file,JSON.stringify(m),{mode:0o600});return m.pid; };
    setOld(dead);const alivePid=setOld(alive),unknownPid=setOld(unknown);setOld(foreign);
    const markerAlias=leave();setOld(markerAlias);fs.renameSync(join(markerAlias,tempMarker),join(root,"detached-marker"));fs.symlinkSync(join(root,"detached-marker"),join(markerAlias,tempMarker));
    const entryAlias=join(root,"wh-review-public-alias");fs.symlinkSync(foreign,entryAlias);
    helper.cleanupStaleTempDirs({root,prefixes:["wh-review-public-"],olderThanMs:60_000,pidAlive(pid){if(pid===alivePid)return true;if(pid===unknownPid)throw Object.assign(new Error("permission"),{code:"EPERM"});return false;}});
    expect(fs.existsSync(dead)).toBe(false);
    for(const dir of [alive,unknown,young,foreign,markerAlias,entryAlias])expect(fs.existsSync(dir)).toBe(true);
    const rootAlias=join(root,"root-alias");fs.symlinkSync(root,rootAlias);
    expect(()=>helper.cleanupStaleTempDirs({root:rootAlias,prefixes:["wh-review-public-"],olderThanMs:0,pidAlive:()=>false})).toThrow();
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("T037 marker publication failure removes the newly allocated directory", () => {
  const root=mkdtempSync(join(tmpdir(),"t037-marker-fail-"));
  try {
    const output=tempChild(`
      import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';
      const real=fs.writeFileSync;fs.writeFileSync=(file,...args)=>{if(String(file).endsWith(${JSON.stringify(tempMarker)}))throw Object.assign(new Error('owned marker failure'),{code:'ENOSPC'});return real(file,...args);};syncBuiltinESMExports();
      const h=await import(${JSON.stringify(tempHelperUrl)});let code;try{h.createTrackedTempDir('wh-review-public-',{root:fs.realpathSync(${JSON.stringify(root)})});}catch(e){code=e.code;}console.log(JSON.stringify({code,entries:fs.readdirSync(${JSON.stringify(root)})}));
    `);
    expect(JSON.parse(output)).toEqual({code:"ENOSPC",entries:[]});
  } finally {rmSync(root,{recursive:true,force:true});}
});

test("T037 process exit and termination signals clean tracked directories and preserve exit semantics", async () => {
  const {spawnSync}=await import("node:child_process");
  const fs=await import("node:fs");
  for(const mode of ["exit","SIGINT","SIGTERM"]){
    const root=fs.realpathSync(mkdtempSync(join(tmpdir(),"t037-exit-")));
    try{
      const child=spawnSync(process.execPath,["--input-type=module","-e",`const h=await import(${JSON.stringify(tempHelperUrl)});const d=h.createTrackedTempDir('wh-review-public-',{root:${JSON.stringify(root)}});${mode==="exit"?"process.exitCode=7;":`process.kill(process.pid,${JSON.stringify(mode)});setInterval(()=>{},1000);`}`],{encoding:"utf8",timeout:5000});
      expect(fs.readdirSync(root)).toEqual([]);
      expect(child.error).toBeUndefined();
      expect(child.status).toBe(mode==="exit"?7:null);
      expect(child.signal).toBe(mode==="exit"?null:mode);
    }finally{rmSync(root,{recursive:true,force:true});}
  }
});

test("T037 cleanup I/O failure is visible without replacing the primary CLI error", async () => {
  const {spawnSync}=await import("node:child_process");const fs=await import("node:fs");
  const root=fs.realpathSync(mkdtempSync(join(tmpdir(),"t037-clean-fail-")));
  try{
    const child=spawnSync(process.execPath,["--input-type=module","-e",`
      import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';
      const real=fs.rmSync;fs.rmSync=(p,...args)=>{if(String(p).includes('wh-review-public-'))throw Object.assign(new Error('owned disposal failure'),{code:'EACCES'});return real(p,...args);};syncBuiltinESMExports();
      const {ReviewProviderClient}=await import(${JSON.stringify(clientUrl)});const client=new ReviewProviderClient({command:[process.execPath,'-e',${JSON.stringify(`require('node:fs').writeFileSync(${JSON.stringify(join(root, 'broker-effect'))},String(process.pid));console.log(${JSON.stringify(JSON.stringify(group()))});process.exitCode=7`)}],config:'owned'});
      try{await client.runGroup({hostProvider:'codex/terra',providers:['opencode/v4flash','codex/luna'],materials:${JSON.stringify(materials)},prompt:'review',minimumHeterologous:1});}catch(e){console.log(JSON.stringify({code:e.code,message:e.message}));process.exitCode=9;}
    `],{encoding:"utf8",env:{...process.env,TMPDIR:root,TMP:root,TEMP:root},timeout:5000});
    expect(child.status).toBe(9);
    expect(JSON.parse(child.stdout).code).toBe("BROKER_EXIT_NONZERO");
    expect(JSON.parse(child.stdout).message).toContain("exit=7");
    expect(Number(readFileSync(join(root,"broker-effect"),"utf8"))).toBeGreaterThan(0);
    expect(child.stderr).toContain("TEMP_CLEANUP_FAILED: EACCES");
    expect(fs.readdirSync(root).filter(n=>n.startsWith("wh-review-public-"))).toHaveLength(1);
  }finally{rmSync(root,{recursive:true,force:true});}
});

test("T037 the next real client invocation reaps only eligible stale producer directories", async () => {
  const fs=await import("node:fs"),{spawnSync}=await import("node:child_process");
  const root=fs.realpathSync(mkdtempSync(join(tmpdir(),"t037-next-call-")));
  try{
    const abandoned=spawnSync(process.execPath,["--input-type=module","-e",`
      import fs from 'node:fs';import path from 'node:path';const h=await import(${JSON.stringify(tempHelperUrl)});
      const old=h.createTrackedTempDir('wh-review-public-',{root:${JSON.stringify(root)}}),young=h.createTrackedTempDir('wh-review-public-',{root:${JSON.stringify(root)}});
      const file=path.join(old.path,${JSON.stringify(tempMarker)}),marker=JSON.parse(fs.readFileSync(file,'utf8'));marker.created_at='2000-01-01T00:00:00.000Z';fs.writeFileSync(file,JSON.stringify(marker));
      fs.writeFileSync(${JSON.stringify(join(root,"abandoned.json"))},JSON.stringify({old:old.path,young:young.path}));process.kill(process.pid,'SIGKILL');
    `],{encoding:"utf8",timeout:5000});
    expect(abandoned.signal).toBe("SIGKILL");
    const dirs=JSON.parse(readFileSync(join(root,"abandoned.json"),"utf8"));
    const unknown=mkdtempSync(join(root,"wh-review-public-"));
    expect(fs.existsSync(dirs.old)).toBe(true);
    const broker=`console.log(${JSON.stringify(JSON.stringify(group()))})`;
    const output=tempChild(`const {ReviewProviderClient}=await import(${JSON.stringify(clientUrl)});const client=new ReviewProviderClient({command:[process.execPath,'-e',${JSON.stringify(broker)}],config:'owned'});const result=await client.runGroup({hostProvider:'codex/terra',providers:['opencode/v4flash','codex/luna'],materials:${JSON.stringify(materials)},prompt:'review',minimumHeterologous:1});console.log(result.outcome);`,{env:{TMPDIR:root,TMP:root,TEMP:root}});
    expect(output.trim()).toBe("completed");
    expect(fs.existsSync(dirs.old)).toBe(false);
    expect(fs.existsSync(dirs.young)).toBe(true);
    expect(fs.existsSync(unknown)).toBe(true);
  }finally{rmSync(root,{recursive:true,force:true});}
});
