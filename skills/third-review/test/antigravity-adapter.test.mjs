import { fileURLToPath as migratedFilePath } from "node:url";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";
import antigravity from "../lib/adapters/antigravity.mjs";
import { execute } from "../lib/process.mjs";
import { nodeFixtureCommand } from "./node-fixture-command.mjs";

const fake = nodeFixtureCommand(migratedFilePath(new URL("../test/fake-antigravity-cli.mjs", import.meta.url)));
const temp = () => fs.mkdtempSync(path.join(os.tmpdir(), "3rd-review-agy-test-"));
const provider = (overrides = {}) => ({ id: "antigravity", command: fake, model: "Gemini 3.5 Flash (Low)", effort: null, thinking: null, allow_host_state: true, auth: { type: "native", env: [] }, env: [], ...overrides });

test("Antigravity uses the supported noninteractive plan-mode contract", async () => {
  const packet = n3AgPacket();
  try {
    const execution = antigravity.start(provider({ command: "/Users/Hugh/.local/bin/agy" }), packet.cwd, "review");
    assert.deepEqual(antigravity.capabilities, { continuation: false, attachment_delivery: ["file_only"] });
    assert.equal(execution.input, null);
    assert.equal(execution.argv[execution.argv.indexOf("--model") + 1], "Gemini 3.5 Flash (Low)");
    assert.ok(execution.argv.includes("--new-project"));
    assert.ok(execution.argv.includes("--sandbox"));
    assert.equal(execution.argv.includes("--dangerously-skip-permissions"), false);
    assert.equal(execution.argv[execution.argv.indexOf("-p") + 1], "review");
    assert.equal(execution.argv[execution.argv.indexOf("--output-format") + 1], "stream-json");
    assert.equal(execution.streamProgress, true);
    const result = await execute({ ...execution, command: fake }, { maxOutputBytes: 100_000, healthCheckIntervalMs: 10_000 });
    assert.equal(result.ok, true);
    assert.deepEqual(antigravity.parse(result.stdout), { ok: true, text: "AGY_FINAL:review", session_id: null, usage: null });
  } finally { packet.clean(); }
});

test("Antigravity rejects unsupported generic effort but preserves large prompts", () => {
  const packet = n3AgPacket();
  try {
    assert.throws(() => antigravity.start(provider({ allow_host_state: false }), temp(), "review"), { code: "PROVIDER_HOST_STATE_UNACKNOWLEDGED" });
    assert.throws(() => antigravity.start(provider({ effort: "high" }), temp(), "review"), { code: "PROVIDER_OPTION_UNSUPPORTED" });
    assert.equal(antigravity.start(provider({ command: "/Users/Hugh/.local/bin/agy" }), packet.cwd, "x".repeat(64 * 1024 + 1)).argv.at(-1).length, 64 * 1024 + 1);
  } finally { packet.clean(); }
});

test("Antigravity accepts successful stream-json results and never resumes", () => {
  assert.equal(antigravity.parse("\n").parse_outcome, "empty_output");
  const step = JSON.stringify({ event: "step_update", step_update: { conversation_id: "not-a-native-session", step_index: 7, state: "ACTIVE" } });
  assert.deepEqual(antigravity.observeLine("stdout", step), { liveness: true, progress: true, cursor: "7:ACTIVE", progress_key: "7:ACTIVE", event: "step_update" });
  assert.deepEqual(antigravity.observeLine("stdout", "final"), { liveness: true, progress: false, event: "text" });
  assert.equal(antigravity.observeLine("stdout", JSON.stringify({ event: "init" })).progress, false);
  assert.equal(antigravity.observeLine("stdout", JSON.stringify({ event: "step_update", step_update: {} })).progress, false);
  assert.deepEqual(antigravity.observeLine("stderr", "warning"), { liveness: true, progress: false, event: "stderr" });
  assert.equal(antigravity.observeLine("stdout", "  ").progress, false);
  const result = (status, response) => JSON.stringify({ event: "result", result: { status, response } });
  assert.deepEqual(antigravity.observeLine("stdout", result("SUCCESS", "done")).terminal, { state: "completed", wait_for_close: true });
  assert.equal(antigravity.observeLine("stdout", result("ERROR", "")).terminal.error.code, "PROVIDER_HEALTH_FAILED");
  assert.deepEqual(antigravity.parse([step, result("SUCCESS", "first"), result("SUCCESS", "last")].join("\n")), { ok: true, text: "last", session_id: null, usage: null });
  for (const text of [step, "plain text", result("SUCCESS", " "), result("SUCCESS", 42), [result("SUCCESS", "first"), result("ERROR", "")].join("\n")]) assert.equal(antigravity.parse(text).error.code, "PROVIDER_OUTPUT_INVALID");
  assert.equal(antigravity.parse("", "print timeout").error.code, "PROCESS_TIMEOUT");
  assert.throws(() => antigravity.resume(provider(), temp(), "session", "continue"), { code: "PROVIDER_OPTION_UNSUPPORTED" });
});

// Independent native-config consumer oracle. Executing the command installed in
// hooks.json proves the hook decision, never that the native CLI obeyed it.
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { prepareAttachments, prepareWritableAttachmentView } from "../lib/attachments.mjs";
function n3AgPacket() {
  const root=fs.realpathSync(temp()); const source=path.join(root,"source"); fs.mkdirSync(source);
  const names=["inside.txt","review-instructions.md"];
  for(const name of names) fs.writeFileSync(path.join(source,name), name==="inside.txt" ? "CURRENT_PACKET_SENTINEL" : "Read current packet");
  const entries=names.map(name=>{const b=fs.readFileSync(path.join(source,name));return {source:name,destination:name,size:b.length,sha256:createHash("sha256").update(b).digest("hex"),embed:false};});
  const runtime=path.join(root,"runtime");fs.mkdirSync(runtime);
  const stored=prepareAttachments({root:source,delivery:"file_only",manifest:{version:1,bundle_id:"n3-ag-guard",entries}},runtime,"antigravity",10000,[{root:source,sources:names}]);
  const view=prepareWritableAttachmentView(runtime,"antigravity",stored);
  const outside=path.join(root,"outside.txt");fs.writeFileSync(outside,"OUTSIDE_SENTINEL");
  const clean=()=>{const unlock=p=>{for(const e of fs.readdirSync(p,{withFileTypes:true})){const f=path.join(p,e.name);if(e.isDirectory())unlock(f);if(!e.isSymbolicLink())fs.chmodSync(f,e.isDirectory()?0o700:0o600);}fs.chmodSync(p,0o700);};unlock(root);fs.rmSync(root,{recursive:true,force:true});};
  return {root,cwd:view.cwd,bundle:view.bundle,inside:path.join(view.bundle,"inside.txt"),outside,clean};
}
function n3AgStart(s, command="/Users/Hugh/.local/bin/agy") { return antigravity.start(provider({command}),s.cwd,"Read only this current packet"); }
function n3AgHook(s) {
  const hooksFile=path.join(s.cwd,".agents","hooks.json");
  assert.ok(fs.existsSync(hooksFile),"native workspace hooks must exist before a provider plan can be launched");
  const config=JSON.parse(fs.readFileSync(hooksFile,"utf8"));const found=[];
  const visit=v=>{if(!v||typeof v!=="object")return;for(const [k,x] of Object.entries(v)){if(k==="PreToolUse"&&Array.isArray(x))found.push(...x);else visit(x);}};visit(config);
  assert.ok(found.some(h=>h.matcher==="*"),"unknown tool names must pass through the native default-deny hook");
  const commands=found.filter(h=>h.matcher==="*").flatMap(h=>h.hooks??[]).filter(h=>h.type==="command"&&typeof h.command==="string");
  assert.equal(commands.length,1,"one native command must own the packet decision");
  return payload=>{const r=spawnSync("/bin/sh",["-c",commands[0].command],{cwd:s.cwd,input:typeof payload==="string"?payload:JSON.stringify(payload),encoding:"utf8",timeout:5000,env:{PATH:process.env.PATH}});assert.equal(r.error,undefined);assert.equal(r.status,0,`hook must emit an explicit decision: ${r.stderr}`);return JSON.parse(r.stdout);};
}
function n3AgDecision(result) { return result.decision ?? result.hookSpecificOutput?.permissionDecision; }

test("N3 P2 direction lifecycle: AG removes permission bypass and registers a native match-all default-deny hook",()=>{
  const s=n3AgPacket();try {const p=n3AgStart(s);assert.equal(p.argv.includes("--dangerously-skip-permissions"),false);const hook=n3AgHook(s);assert.equal(n3AgDecision(hook({toolCall:{name:"unrecognized_future_tool",args:{}}})),"deny");}finally{s.clean();}
});
test("N3 P2 direction lifecycle: AG native hook command permits exact current regular files and denies writes escape symlinks future and tool network",()=>{
  const s=n3AgPacket();try {
    n3AgStart(s);const hook=n3AgHook(s);const read=p=>hook({toolCall:{name:"view_file",args:{AbsolutePath:p}}});
    assert.equal(n3AgDecision(read(s.inside)),"allow");
    fs.chmodSync(s.bundle,0o700);const future=path.join(s.bundle,"future-selection.txt");fs.writeFileSync(future,"UNREVEALED_CHOICE");const symlink=path.join(s.bundle,"external-link");fs.symlinkSync(s.outside,symlink);
    const sibling=s.bundle+"-sibling";fs.mkdirSync(sibling);fs.writeFileSync(path.join(sibling,"inside.txt"),"SIBLING_SENTINEL");
    const denied=[s.outside,path.dirname(s.bundle),path.join(sibling,"inside.txt"),`${s.bundle}/../bundle/inside.txt`,symlink,future,path.join(s.cwd,".agents","hooks.json")];
    for(const p of denied)assert.equal(n3AgDecision(read(p)),"deny",`must deny non-member ${p}`);
    for(const name of ["write_to_file","replace_file_content","multi_replace_file_content","run_command","list_dir","grep_search","find_by_name","search_web","read_url_content","browser_subagent","mcp_any_tool","grant_permission","unknown_tool"])assert.equal(n3AgDecision(hook({toolCall:{name,args:{AbsolutePath:s.inside,CommandLine:"touch forbidden",Url:"http://127.0.0.1/"}}})),"deny",name);
    for(const payload of ["{",{}, {toolCall:{name:"view_file",args:{}}}]) assert.equal(n3AgDecision(hook(payload)),"deny");
    assert.equal(fs.readFileSync(s.inside,"utf8"),"CURRENT_PACKET_SENTINEL");assert.equal(fs.readFileSync(s.outside,"utf8"),"OUTSIDE_SENTINEL");
    fs.rmSync(s.inside);fs.symlinkSync(s.outside,s.inside);assert.equal(n3AgDecision(read(s.inside)),"deny","a previously authorized path becoming a symlink must fail closed");
  }finally{s.clean();}
});
test("N3 P2 direction lifecycle: AG unknown native hook capability and missing packet cannot produce an executable provider plan",()=>{
  const s=n3AgPacket();const empty=fs.realpathSync(temp());try {assert.throws(()=>n3AgStart(s,fake),{code:"PROVIDER_PACKET_GUARD_UNAVAILABLE"});assert.throws(()=>antigravity.start(provider({command:"/Users/Hugh/.local/bin/agy"}),empty,"review"),{code:"PROVIDER_PACKET_GUARD_UNAVAILABLE"});}finally{s.clean();fs.rmSync(empty,{recursive:true,force:true});}
});

// Correction oracle from review053 and actual native diagnosis297. Startup
// plans and installed hooks are real; these cases never launch a model.
test("N3 P2 native correction: AG reuses its unchanged owned packet policy on a second start",()=>{
  const s=n3AgPacket();try {
    n3AgStart(s);const file=path.join(s.cwd,".agents","hooks.json");
    const before=fs.readFileSync(file);const inode=fs.statSync(file).ino;
    let next;assert.doesNotThrow(()=>{next=n3AgStart(s);},"a fresh execution of the same sealed packet must reuse its own policy rather than fail EEXIST");
    assert.equal(fs.readFileSync(file).equals(before),true,"reuse must not rewrite or broaden the native policy");
    assert.equal(fs.statSync(file).ino,inode,"unchanged policy must retain its original file");
    assert.equal(next.cwd,s.cwd);assert.equal(next.argv.includes("--dangerously-skip-permissions"),false);
    assert.equal(n3AgDecision(n3AgHook(s)({toolCall:{name:"view_file",args:{AbsolutePath:s.outside}}})),"deny");
  }finally{s.clean();}
});
test("N3 P2 native correction: AG refuses ambient and tampered packet hooks without replacing them",()=>{
  for(const ambient of [true,false]) {
    const s=n3AgPacket();try {
      const directory=path.join(s.cwd,".agents"),file=path.join(directory,"hooks.json");
      if(ambient)fs.mkdirSync(directory);else{n3AgStart(s);fs.chmodSync(directory,0o700);fs.chmodSync(file,0o600);}
      const untrusted=JSON.stringify({"ambient-or-tampered":{PreToolUse:[{matcher:"*",hooks:[{type:"command",command:"printf allow"}]}]}});
      fs.writeFileSync(file,untrusted);
      assert.throws(()=>n3AgStart(s),{code:"PROVIDER_PACKET_GUARD_UNAVAILABLE"});
      assert.equal(fs.readFileSync(file,"utf8"),untrusted,"unowned or changed hooks must never be silently replaced");
    }finally{s.clean();}
  }
});
