import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";
import { fileURLToPath } from "node:url";
import claude from "../lib/adapters/claude-code.mjs";
import codex from "../lib/adapters/codex.mjs";
import { execute } from "../lib/process.mjs";
import { nodeFixtureCommand } from "./node-fixture-command.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const fakeAppServer = nodeFixtureCommand(path.join(here, "fake-codex-app-server.mjs"));
const hangingClaude = nodeFixtureCommand(path.join(here, "hanging-claude-stream.mjs"));
const lateClose = nodeFixtureCommand(path.join(here, "terminal-then-close.mjs"));
const terminalBeforeClose = nodeFixtureCommand(path.join(here, "terminal-before-close.mjs"));
const emptyThenResume = nodeFixtureCommand(path.join(here, "claude-empty-then-resume.mjs"));
const temp = () => fs.mkdtempSync(path.join(os.tmpdir(), "3rd-review-adapter-health-"));
const provider = (command) => ({ id: "provider", command, model: null, effort: null, auth: { type: "native", env: [] }, env: [] });

test("Claude uses official stream-json events and harvests result without waiting for CLI exit", async () => {
  const plan = claude.start(provider(hangingClaude), temp(), "review");
  assert.ok(plan.clientArgv.includes("stream-json"));
  assert.ok(plan.clientArgv.includes("--include-partial-messages"));
  assert.ok(plan.clientArgv.includes("--verbose"));
  assert.ok(plan.clientArgv.includes("--bare"));
  assert.equal(plan.clientArgv[plan.clientArgv.indexOf("--tools") + 1], "Read");
  assert.equal(plan.clientArgv[plan.clientArgv.indexOf("--allowedTools") + 1], "Read(bundle/**)");
  assert.deepEqual(claude.capabilities.attachment_delivery, ["file_only", "always_embed"]);
  assert.equal(Object.hasOwn(JSON.parse(Buffer.from(plan.argv[1], "base64url").toString("utf8")), "env"), false);
  const result = await execute(plan, { maxOutputBytes: 100_000, healthCheckIntervalMs: 10_000 });
  assert.equal(result.ok, true);
  assert.equal(result.health_harvested, true);
  assert.match(result.stdout, /CLAUDE_FINAL/);
  const parsed = claude.parse(result.stdout);
  assert.deepEqual({ ok: parsed.ok, text: parsed.text, session_id: parsed.session_id }, { ok: true, text: "CLAUDE_FINAL", session_id: "claude-session" });
});

test("Claude rejects a changed session identity during supervised continuation", async () => {
  process.env.CLAUDE_TEST_MISMATCH = "1";
  try {
    const plan = claude.start({ ...provider(emptyThenResume), env: ["CLAUDE_TEST_MISMATCH"] }, temp(), "review");
    const result = await execute(plan, { maxOutputBytes: 100_000, healthCheckIntervalMs: 10_000 });
    assert.equal(result.ok, false); assert.match(result.stderr, /changed session identity/);
  } finally { delete process.env.CLAUDE_TEST_MISMATCH; }
});

test("Claude continues an empty successful turn in the same native session", async () => {
  const plan = claude.start(provider(emptyThenResume), temp(), "review");
  const result = await execute(plan, { maxOutputBytes: 100_000, healthCheckIntervalMs: 10_000 });
  assert.equal(result.ok, true);
  const parsed = claude.parse(result.stdout);
  assert.deepEqual({ text: parsed.text, session_id: parsed.session_id }, { text: "CLAUDE_RESUMED_FINAL", session_id: "claude-empty-session" });
});

test("Claude result errors are terminal but remain semantic provider failures", () => {
  const line = JSON.stringify({ type: "result", subtype: "error_during_execution", is_error: true, result: "bad", session_id: "s" });
  assert.equal(claude.observeLine("stdout", line).terminal.state, "failed");
  assert.equal(claude.parse(`${line}\n`).ok, false);
});

test("Codex uses stable stdio app-server thread and turn protocol", async () => {
  const cwd = temp();
  const plan = codex.start(provider(fakeAppServer), cwd, "review");
  assert.equal(plan.command, process.execPath);
  const request = JSON.parse(plan.input);
  assert.deepEqual({ command: request.command, cwd: request.cwd, prompt: request.prompt, session: request.session }, { command: fakeAppServer, cwd, prompt: "review", session: null });
  const result = await execute(plan, { maxOutputBytes: 100_000, healthCheckIntervalMs: 10_000 });
  assert.equal(result.ok, true);
  assert.match(result.stdout, /CODEX_FINAL/);
  const parsed = codex.parse(result.stdout);
  assert.deepEqual({ ok: parsed.ok, text: parsed.text, session_id: parsed.session_id }, { ok: true, text: "CODEX_FINAL", session_id: "codex-thread" });
});

test("Codex continuation sends thread/resume for the same session", () => {
  const plan = codex.resume(provider(fakeAppServer), temp(), "codex-thread", "continue");
  assert.equal(JSON.parse(plan.input).session, "codex-thread");
});

test("Codex app-server request errors remain process failures", async () => {
  const result = await execute(codex.start(provider(fakeAppServer), temp(), "FAIL_PROTOCOL"), { maxOutputBytes: 100_000, healthCheckIntervalMs: 10_000 });
  assert.equal(result.ok, false);
});

test("terminal wait_for_close keeps stdin open until the provider publishes late raw evidence", async () => {
  const result = await execute({ command: lateClose, argv: [], cwd: temp(), input: "go\n", env: process.env, redact: [], keepStdinOpen: true, observeLine: (_stream, line) => line === "TERMINAL" ? { terminal: { state: "completed", wait_for_close: true } } : {} }, { maxOutputBytes: 100_000, healthCheckIntervalMs: 10_000 });
  assert.equal(result.ok, true);
  assert.match(result.stderr, /LATE_SESSION/);
});

test("a semantic terminal result completes without waiting for a wrapper close", async () => {
  const result = await execute({ command: terminalBeforeClose, argv: [], cwd: temp(), input: "go\n", env: process.env, redact: [], keepStdinOpen: true, observeLine: (_stream, line) => line === "TERMINAL" ? { terminal: { state: "completed" } } : {} }, { maxOutputBytes: 100_000, healthCheckIntervalMs: 10_000 });
  assert.equal(result.ok, true);
  assert.match(result.stdout, /TERMINAL/);
  assert.doesNotMatch(result.stdout, /LATE_AFTER_TERMINAL/);
});

// Independent adapter/supervisor configuration oracle. Controlled children below
// consume the real planned env; they are not proof of native tool enforcement.
import { createHash } from "node:crypto";
import openCodePacketWorker from "../lib/adapters/opencode.mjs";
import { prepareAttachments, prepareWritableAttachmentView } from "../lib/attachments.mjs";
function n3OcPacket() {
  const root=fs.realpathSync(temp());const source=path.join(root,"source");fs.mkdirSync(source);
  fs.writeFileSync(path.join(source,"inside.txt"),"CURRENT_PACKET_SENTINEL");const b=fs.readFileSync(path.join(source,"inside.txt"));const runtime=path.join(root,"runtime");fs.mkdirSync(runtime);
  const stored=prepareAttachments({root:source,delivery:"file_only",manifest:{version:1,bundle_id:"n3-oc-guard",entries:[{source:"inside.txt",destination:"inside.txt",size:b.length,sha256:createHash("sha256").update(b).digest("hex"),embed:false}]}},runtime,"opencode",10000,[{root:source,sources:["inside.txt"]}]);
  const view=prepareWritableAttachmentView(runtime,"opencode",stored);
  const clean=()=>{const unlock=p=>{for(const e of fs.readdirSync(p,{withFileTypes:true})){const f=path.join(p,e.name);if(e.isDirectory())unlock(f);if(!e.isSymbolicLink())fs.chmodSync(f,e.isDirectory()?0o700:0o600);}fs.chmodSync(p,0o700);};unlock(root);fs.rmSync(root,{recursive:true,force:true});};
  return {root,...view,inside:path.join(view.bundle,"inside.txt"),clean};
}
function n3OcPlan(s,command="/Users/Hugh/.opencode/bin/opencode") {return openCodePacketWorker.start({...provider(command),id:"opencode"},s.cwd,"Read the current frozen packet");}
function n3OcPolicy(p) {
  assert.equal(typeof p.env.OPENCODE_CONFIG_CONTENT,"string","native permission config must be delivered before spawn");
  const config=JSON.parse(p.env.OPENCODE_CONFIG_CONTENT);
  assert.ok(config.permission,"installed native permission owner must receive the policy");return config;
}
test("N3 P2 direction lifecycle: OpenCode uses default deny with exact current manifest files and no broad packet wildcard",()=>{
 const s=n3OcPacket();try {
  const p=n3OcPlan(s);const c=n3OcPolicy(p);assert.equal(c.permission["*"],"deny");assert.equal(c.permission.read["*"],"deny");
  assert.deepEqual(Object.entries(c.permission.read).filter(([,v])=>v==="allow").map(([k])=>k),[s.inside]);
  assert.equal(Object.keys(c.permission.read).some(k=>k!=="*"&&/[?*]/.test(k)),false,"future packet files must never inherit a wildcard grant");
  assert.ok(Object.entries(c.permission).every(([k,v])=>k==="read"||v==="deny"),"no tool, shell, web, MCP, task or unknown-tool allow rule");
  assert.equal(p.clientArgv.includes("--auto"),false);assert.equal(p.clientArgv.includes("--pure"),true);
  assert.ok(["1","true"].includes(String(p.env.OPENCODE_DISABLE_EXTERNAL_SKILLS)),"ambient skill discovery must be disabled");
  assert.ok(c.mcp===undefined||Object.values(c.mcp).every(v=>v===false||v?.enabled===false));
 }finally{s.clean();}
});
test("N3 P2 direction lifecycle: OpenCode unknown native permission support and absent packet fail closed before spawn",()=>{
 const s=n3OcPacket();const empty=fs.realpathSync(temp());try {
  assert.throws(()=>n3OcPlan(s,fakeAppServer),{code:"PROVIDER_PACKET_GUARD_UNAVAILABLE"});
  assert.throws(()=>openCodePacketWorker.start({...provider("/Users/Hugh/.opencode/bin/opencode"),id:"opencode"},empty,"review"),{code:"PROVIDER_PACKET_GUARD_UNAVAILABLE"});
 }finally{s.clean();fs.rmSync(empty,{recursive:true,force:true});}
});
test("N3 P2 direction lifecycle: OpenCode supervised server and client consume the same final native permission policy",async()=>{
 const s=n3OcPacket();try {
  const p=n3OcPlan(s);const c=n3OcPolicy(p);assert.equal(c.permission["*"],"deny");
  const trace=path.join(s.root,"policy-trace.jsonl");const fixture=path.join(s.root,"safe-opencode.mjs");
  fs.writeFileSync(fixture,`import fs from 'node:fs';import http from 'node:http';const a=process.argv.slice(2);const side=a.includes('serve')?'server':'client';fs.appendFileSync(${JSON.stringify(trace)},JSON.stringify({side,config:process.env.OPENCODE_CONFIG_CONTENT,permission:process.env.OPENCODE_PERMISSION??null,disableSkills:process.env.OPENCODE_DISABLE_EXTERNAL_SKILLS})+String.fromCharCode(10));if(side==='server'){const port=Number(a[a.indexOf('--port')+1]);http.createServer((q,r)=>{r.setHeader('content-type','application/json');r.end(JSON.stringify(q.url==='/global/health'?{healthy:true}:q.url==='/session/status'?{'n3-safe-session':{type:'idle'}}:[{info:{role:'assistant',sessionID:'n3-safe-session',time:{completed:1},finish:'stop'},parts:[{type:'text',text:'{"findings":[]}'}]}]));}).listen(port,'127.0.0.1');}else{process.stdin.resume();process.stdin.on('end',()=>{console.log(JSON.stringify({type:'session.completed',session_id:'n3-safe-session',text:'{"findings":[]}'}));});}`);
  const safeCommand=path.join(s.root,"safe-command");const quote=v=>"'"+v.replaceAll("'", "'\"'\"'")+"'";fs.writeFileSync(safeCommand,`#!/bin/sh\nexec ${quote(process.execPath)} ${quote(fixture)} "$@"\n`,{mode:0o700});const spec=JSON.parse(Buffer.from(p.argv[0],"base64url").toString("utf8"));spec.command=safeCommand;
  const controlled={...p,argv:[Buffer.from(JSON.stringify(spec)).toString("base64url")]};
  const result=await execute(controlled,{maxOutputBytes:100000,healthCheckIntervalMs:10000});assert.equal(result.ok,true);
  const rows=fs.readFileSync(trace,"utf8").trim().split("\n").map(JSON.parse);assert.deepEqual(rows.map(r=>r.side),["server","client"]);
  for(const row of rows){assert.deepEqual(JSON.parse(row.config),c);if(row.permission!==null)assert.deepEqual(JSON.parse(row.permission),c.permission);assert.equal(row.disableSkills,p.env.OPENCODE_DISABLE_EXTERNAL_SKILLS);}
 }finally{s.clean();}
});

import { createOpenCodeProbe as createN3OpenCodeProbe } from "../lib/adapters/opencode.mjs";
test("N3 P2 direction lifecycle: OpenCode native UnknownError data.message preserves TLS failure classification",async()=>{
  // Actual owned-session export: 242-p2-native-adapter-implementation.json
  // oc_native_attempt.native_session_export; sha256 2d47c63b3b0ca376919065c1aad05479a75ab5abe957f2c6511446d78185db1f.
  // Only the observed assistant envelope needed by the public health consumer
  // is retained. The transport is controlled; no provider or network is used.
  const session="ses_eba23f2e7ffejg5T7tDo975oLt";
  const messages=[{info:{role:"assistant",sessionID:session,time:{created:1792173412043,completed:1792173417726},error:{name:"UnknownError",data:{message:"unknown certificate verification error"}}},parts:[]}];
  const probe=createN3OpenCodeProbe({url:"http://controlled-native-export.invalid",fetchImpl:async(url)=>({ok:true,json:async()=>String(url).endsWith("/session/status") ? {} : messages})});
  const result=await probe({session_id:session});
  assert.equal(result.status,"failed");
  assert.equal(result.terminal,true);
  assert.equal(result.session_id,session);
  assert.equal(result.error.code,"NETWORK_TLS_CERTIFICATE","native error.data.message must retain the actual certificate failure rather than generic process failure");
  assert.equal(result.error.message,"provider TLS certificate validation failed");
  assert.equal(result.raw,null,"failed native session must not manufacture a successful semantic result");
});

import { Broker as N3NormalPacketBroker } from "../lib/broker.mjs";
import { validateConfig as n3NormalPacketConfig } from "../lib/config.mjs";
import { removeRuntimeDirectory as n3RemoveNormalRuntime } from "../lib/runtime.mjs";
test("N3 P2 direction lifecycle: normal file_only public broker caller supplies the real packet root to the native guard",async()=>{
  const s=n3OcPacket();const originalStart=openCodePacketWorker.start;const observed=[];
  try {
    // Retain the actual native adapter/permission resolver. Only execution of
    // the resulting plan becomes a safe controlled child; no model is called.
    openCodePacketWorker.start=(p,cwd,prompt)=>{
      const guarded=originalStart(p,cwd,prompt,null);
      const policy=JSON.parse(guarded.env.OPENCODE_CONFIG_CONTENT).permission;
      observed.push({cwd,policy});
      return {...guarded,command:process.execPath,argv:["-e",'process.stdout.write(JSON.stringify({type:"session.completed",session_id:"n3-normal-guarded-session",text:"CURRENT_NORMAL_PACKET_RESULT"})+String.fromCharCode(10))'],probeSession:undefined,healthServer:undefined};
    };
    const root=path.join(s.root,"source");const bytes=fs.readFileSync(path.join(root,"inside.txt"));const cfg=n3NormalPacketConfig({version:4,runtime:{root:path.join(s.root,"broker-runtime"),ttl_hours:24,max_prompt_bytes:10000,max_output_bytes:100000,liveness_interval_ms:5},tiers:[["opencode"]],attachment_roots:[{root,sources:["inside.txt"]}],providers:{opencode:{enabled:true,command:"/Users/Hugh/.opencode/bin/opencode",model:null,effort:null,thinking:null,auth:{type:"native"},env:[]}}});
    const result=await new N3NormalPacketBroker(cfg).run({version:4,host_provider:"codex",required_result_protocol:"workflowhub-result.v3",provider_allowlist:["opencode"],review_mode:"single_round",prompt:"Review the complete current packet",continuation:null,attachments:{root,delivery:"file_only",manifest:{version:1,bundle_id:"n3-normal-public-caller",entries:[{source:"inside.txt",destination:"inside.txt",size:bytes.length,sha256:createHash("sha256").update(bytes).digest("hex"),embed:false}]}}});
    assert.equal(result.providers[0].status,"completed","a valid ordinary file_only packet must reach its native guarded plan, not fail because the consumer prepends bundle twice");
    assert.equal(result.providers[0].output,"CURRENT_NORMAL_PACKET_RESULT");assert.equal(observed.length,1);
    const grants=Object.entries(observed[0].policy.read).filter(([,v])=>v==="allow").map(([p])=>p);
    assert.equal(grants.length,1);assert.equal(path.basename(grants[0]),"inside.txt");assert.equal(fs.readFileSync(grants[0],"utf8"),"CURRENT_PACKET_SENTINEL");
    assert.equal(observed[0].policy["*"],"deny");assert.equal(observed[0].policy.read["*"],"deny");
  }finally{openCodePacketWorker.start=originalStart;const r=path.join(s.root,"broker-runtime");if(fs.existsSync(r))for(const id of fs.readdirSync(r))if(/^[0-9a-f-]{36}$/i.test(id))n3RemoveNormalRuntime(r,id);s.clean();}
});

import childProcess from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { vi as n3DiagnosticVi } from "vitest";
import { publicError as n3DiagnosticPublicError } from "../lib/errors.mjs";
import { publicV2Error as n3DiagnosticPublicV2Error } from "../lib/broker.mjs";

// Existing consumers serialize code/message only. The diagnostic contract uses
// fixed safe reason tokens and native scalar metadata inside that message;
// raw output/configuration must never become public error data.
const n3DiagnosticSecret="N3_DIAGNOSTIC_APIKEY_COOKIE_SECRET_68421";
const n3DiagnosticHostPath="/Users/N3Diagnostic/private-auth/settings.json";
const n3DiagnosticCases=[
  {name:"debug-exit",reason:"debug-exit",status:23,signal:null,stdout:`full config apiKey=${n3DiagnosticSecret}`,stderr:`Cookie: ${n3DiagnosticSecret} ${n3DiagnosticHostPath}`},
  {name:"debug-signal",reason:"debug-signal",status:null,signal:"SIGTERM",stdout:n3DiagnosticSecret,stderr:n3DiagnosticHostPath},
  {name:"debug-json",reason:"debug-json",status:0,signal:null,stdout:`{invalid ${n3DiagnosticSecret} ${n3DiagnosticHostPath}`,stderr:""},
  {name:"permission-mismatch",reason:"permission-mismatch",status:0,signal:null,stdout:JSON.stringify({name:"build",tools:{read:true,write:true},permission:[{permission:"*",pattern:"*",action:"allow"}],config:{apiKey:n3DiagnosticSecret,cookie:n3DiagnosticSecret,path:n3DiagnosticHostPath}}),stderr:""},
];
for(const scenario of n3DiagnosticCases) test(`N3 P2 native diagnostic: ${scenario.name} survives existing public error consumers without raw secrets`,()=>{
  const s=n3OcPacket();const actualSpawn=childProcess.spawnSync;let calls=0;
  const spy=n3DiagnosticVi.spyOn(childProcess,"spawnSync").mockImplementation((command,args,options)=>{
    if(Array.isArray(args)&&args.join(" ")==="--pure debug agent build") {
      calls++;
      return {pid:12345,status:scenario.status,signal:scenario.signal,stdout:scenario.stdout,stderr:scenario.stderr,output:[null,scenario.stdout,scenario.stderr]};
    }
    return actualSpawn(command,args,options);
  });
  syncBuiltinESMExports();
  try {
    let error;try{n3OcPlan(s);}catch(caught){error=caught;}
    assert.equal(calls,1,"the real native adapter must consume the controlled debug command result");
    assert.ok(error,"an unsafe or unreadable native policy must not yield an executable provider plan");
    const first=n3DiagnosticPublicError(error);const projected=n3DiagnosticPublicV2Error(first);
    for(const item of [first,projected]) {
      assert.deepEqual(Object.keys(item).sort(),["code","message"],"reuse the existing error interface; do not add public audit/raw fields");
      assert.equal(item.code,"PROVIDER_PACKET_GUARD_UNAVAILABLE");
      const serialized=JSON.stringify(item);
      for(const forbidden of [n3DiagnosticSecret,n3DiagnosticHostPath,s.root,"/Users/Hugh/","apiKey","Cookie:","stdout","stderr","--pure","settings.json"])assert.equal(serialized.includes(forbidden),false,`public error leaked ${forbidden}`);
    }
    for(const item of [first,projected]) {
      assert.match(item.message,new RegExp(`\\breason=${scenario.reason}\\b`),"different native failure layers must remain distinguishable to the existing caller");
      assert.match(item.message,new RegExp(`\\bexit=${scenario.status===null?"null":scenario.status}\\b`),"retain the actual exit scalar, never invent zero for a signal");
      assert.match(item.message,new RegExp(`\\bsignal=${scenario.signal??"null"}\\b`),"retain only the actual safe native signal scalar");
    }
  }finally{spy.mockRestore();syncBuiltinESMExports();s.clean();}
});
