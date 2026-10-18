import { fileURLToPath as migratedFilePath } from "node:url";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import net from "node:net";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";

const supervisor = migratedFilePath(new URL("../lib/adapters/opencode-supervised-cli.mjs", import.meta.url));

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

function fakeOpenCode(runtime) {
  const file = path.join(runtime, "fake-opencode.mjs");
  fs.writeFileSync(file, `#!/usr/bin/env node
import fs from "node:fs";
import http from "node:http";
const args = process.argv.slice(2);
const value = (flag) => args[args.indexOf(flag) + 1];
const calls = process.env.FAKE_OPENCODE_CALLS;
const trace = (row) => { if (process.env.FAKE_BOUND_TRACE) fs.appendFileSync(process.env.FAKE_BOUND_TRACE, JSON.stringify({pid:process.pid,...row})+"\\n"); };
trace({event:args[0],config:process.env.OPENCODE_CONFIG_CONTENT,permission:process.env.OPENCODE_PERMISSION});
if (args[0] === "serve") {
  const port = Number(value("--port"));
  const phase = process.env.FAKE_BOUND_TRACE ? fs.readFileSync(process.env.FAKE_BOUND_TRACE,"utf8").trim().split("\\n").map(JSON.parse).filter(r=>r.event==="serve").length : 1;
  const server = http.createServer((request, response) => {
    response.setHeader("content-type", "application/json");
    trace({event:"request",phase,url:request.url,directory:request.headers["x-opencode-directory"]});
    if(request.url === "/path") {
      if((phase===1&&process.env.FAKE_BOUND_MODE==="cancel-discovery")||(phase===2&&process.env.FAKE_BOUND_MODE==="cancel-final")){trace({event:"cancel",phase});process.kill(process.ppid,"SIGTERM");return;}
      if(process.env.FAKE_BOUND_MODE==="bad-path") return response.end(JSON.stringify({directory:process.env.FAKE_OPENCODE_DIR,worktree:17}));
      if(process.env.FAKE_BOUND_MODE === "missing-path") { response.statusCode=404; return response.end("{}"); }
      return response.end(JSON.stringify({directory:process.env.FAKE_OPENCODE_DIR+(phase===2&&process.env.FAKE_BOUND_MODE==="drift"?"-drift":""),worktree:phase===2&&process.env.FAKE_BOUND_MODE==="worktree-drift"?process.env.FAKE_OPENCODE_DIR:(process.env.FAKE_BOUND_WORKTREE??"/")}));
    }
    if(request.url === "/agent") {
      const config=JSON.parse(process.env.OPENCODE_CONFIG_CONTENT??"{}");
      const permission=Object.entries(config.permission??{}).flatMap(([permission,value])=>typeof value==="string"?[{permission,pattern:"*",action:value}]:Object.entries(value).map(([pattern,action])=>({permission,pattern,action})));
      if(phase===2&&process.env.FAKE_BOUND_MODE==="wide-agent") permission.push({permission:"bash",pattern:"*",action:"allow"});
      return response.end(JSON.stringify([{name:"build",permission}]));
    }
    if(request.url === "/config") {
      const config=JSON.parse(process.env.OPENCODE_CONFIG_CONTENT??"{}");
      if(phase===2&&process.env.FAKE_BOUND_MODE==="wide-config") config.permission.bash="allow";
      return response.end(JSON.stringify(config));
    }
    if (request.url === "/global/health") return response.end(JSON.stringify({ healthy: true }));
    if (request.url === "/session/status") return response.end(JSON.stringify({}));
    if (request.url === "/session") {
      const mode = process.env.FAKE_OPENCODE_SESSION_MODE ?? "fresh";
      const sessionDirectory=process.env.FAKE_BOUND_MODE==="session-fold"?process.env.FAKE_OPENCODE_DIR.replaceAll("%25","%"):process.env.FAKE_OPENCODE_DIR;
      const sessions = mode === "stale"
        ? [{ id: "prompt_session", directory: sessionDirectory, time: { created: Date.now() - 60_000 } }]
        : mode === "ambiguous"
          ? [
              { id: "prompt_session_a", directory: sessionDirectory, time: { created: Date.now() } },
              { id: "prompt_session_b", directory: sessionDirectory, time: { created: Date.now() } },
            ]
          : [{ id: "prompt_session", directory: sessionDirectory, time: { created: Date.now() } }];
      return response.end(JSON.stringify(sessions));
    }
    if (request.url.startsWith("/session/") && request.url.endsWith("/message")) {
      const sessionID = request.url.slice("/session/".length, -"/message".length);
      return response.end(JSON.stringify([
      { info: { id: "message_done", sessionID, role: "assistant", finish: "stop", time: { completed: 1 } }, parts: [
        { id: "part_text", type: "text", text: "PROMPT_FORWARDING_OK" },
        { id: "part_done", type: "step-finish", reason: "stop" },
      ] },
      ]));
    }
    response.statusCode = 404;
    response.end("{}");
  });
  server.listen(port, "127.0.0.1");
  let stopped=false;
  const close=()=>server.close(()=>{trace({event:"closed",phase});process.exit(0);});
  const stop = () => {if(stopped)return;stopped=true;if(phase===1&&process.env.FAKE_BOUND_MODE==="cancel-close"){trace({event:"cancel",phase});process.kill(process.ppid,"SIGINT");setTimeout(close,80);}else close();};
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
} else if (args[0] === "run") {
  let stdin = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => { stdin += chunk; });
  process.stdin.on("end", () => {
    fs.writeFileSync(calls, JSON.stringify({ args: process.argv.slice(2), stdin }));
    if (process.env.FAKE_OPENCODE_NO_SESSION_OUTPUT !== "1") process.stdout.write(JSON.stringify({ type: "step_start", sessionID: "prompt_session" }) + "\\n");
    process.exit(0);
  });
}
`, { mode: 0o700 });
  fs.chmodSync(file, 0o700);
  return file;
}

async function runSupervisor(specification, environment, input) {
  if(!environment.OPENCODE_CONFIG_CONTENT) {
    // Existing prompt/session fixtures use the same complete guarded input
    // shape as the adapter, while retaining their original result assertions.
    const owner=specification.workspace,bundle=path.join(owner,"bundle"),inside=path.join(bundle,"inside.txt");fs.mkdirSync(bundle,{recursive:true});fs.writeFileSync(inside,"EXISTING_PROMPT_PACKET");const bytes=fs.readFileSync(inside);
    fs.writeFileSync(path.join(bundle,"attachments-manifest.json"),JSON.stringify({files:[{target:"inside.txt",size:bytes.length,sha256:createHash("sha256").update(bytes).digest("hex")}]}));
    const permission={"*":"deny",read:{"*":"deny",[inside]:"allow"}};environment={FAKE_OPENCODE_DIR:owner,...environment,OPENCODE_CONFIG_CONTENT:JSON.stringify({permission,agent:{build:{permission}}}),OPENCODE_PERMISSION:JSON.stringify(permission)};
  }
  const encoded = Buffer.from(JSON.stringify(specification), "utf8").toString("base64url");
  const child = spawn(process.execPath, [supervisor, encoded], {
    cwd: process.cwd(),
    env: { ...process.env, ...environment },
    stdio: ["pipe", "pipe", "pipe"],
  });
  let stdout = ""; let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  child.stdin.end(input);
  const code = await new Promise((resolve) => child.once("close", resolve));
  return { code, stdout, stderr };
}

test("OpenCode supervisor forwards the complete prompt through stdin", async () => {
  const runtime = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "opencode-prompt-forwarding-")));
  try {
    const calls = path.join(runtime, "calls.json"); const command = fakeOpenCode(runtime); const port = await freePort();
    const result = await runSupervisor({ command, url: `http://127.0.0.1:${port}`, port, clientArgv: ["run", "--attach", `http://127.0.0.1:${port}`], workspace: runtime }, { FAKE_OPENCODE_CALLS: calls }, "PROMPT_FORWARDING_SENTINEL");
    assert.equal(result.code, 0, result.stderr); assert.match(result.stdout, /PROMPT_FORWARDING_OK/);
    const call = JSON.parse(fs.readFileSync(calls, "utf8")); assert.equal(call.args.includes("PROMPT_FORWARDING_SENTINEL"), false); assert.equal(call.stdin, "PROMPT_FORWARDING_SENTINEL");
  } finally { fs.rmSync(runtime, { recursive: true, force: true }); }
});

test("OpenCode supervisor discovers a session when attached CLI emits no session event", async () => {
  const runtime = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "opencode-session-discovery-")));
  try {
    const calls = path.join(runtime, "calls.json"); const command = fakeOpenCode(runtime); const port = await freePort(); const url = `http://127.0.0.1:${port}`;
    const result = await runSupervisor({ command, url, port, clientArgv: ["run", "--attach", url, "--dir", runtime], workspace: runtime }, { FAKE_OPENCODE_CALLS: calls, FAKE_OPENCODE_DIR: runtime, FAKE_OPENCODE_NO_SESSION_OUTPUT: "1" }, "SESSION_DISCOVERY_SENTINEL");
    assert.equal(result.code, 0, result.stderr); assert.match(result.stdout, /PROMPT_FORWARDING_OK/);
    const call = JSON.parse(fs.readFileSync(calls, "utf8")); assert.equal(call.stdin, "SESSION_DISCOVERY_SENTINEL");
  } finally { fs.rmSync(runtime, { recursive: true, force: true }); }
});

test("OpenCode supervisor rejects a stale session discovered after client exit", async () => {
  const runtime = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "opencode-stale-session-")));
  try {
    const calls = path.join(runtime, "calls.json"); const command = fakeOpenCode(runtime); const port = await freePort(); const url = `http://127.0.0.1:${port}`;
    const result = await runSupervisor({ command, url, port, clientArgv: ["run", "--attach", url, "--dir", runtime], workspace: runtime }, {
      FAKE_OPENCODE_CALLS: calls,
      FAKE_OPENCODE_DIR: runtime,
      FAKE_OPENCODE_NO_SESSION_OUTPUT: "1",
      FAKE_OPENCODE_SESSION_MODE: "stale",
    }, "STALE_SESSION_SENTINEL");
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SESSION_UNKNOWN/);
  } finally { fs.rmSync(runtime, { recursive: true, force: true }); }
});

test("OpenCode supervisor rejects ambiguous fresh session discovery", async () => {
  const runtime = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "opencode-ambiguous-session-")));
  try {
    const calls = path.join(runtime, "calls.json"); const command = fakeOpenCode(runtime); const port = await freePort(); const url = `http://127.0.0.1:${port}`;
    const result = await runSupervisor({ command, url, port, clientArgv: ["run", "--attach", url, "--dir", runtime], workspace: runtime }, {
      FAKE_OPENCODE_CALLS: calls,
      FAKE_OPENCODE_DIR: runtime,
      FAKE_OPENCODE_NO_SESSION_OUTPUT: "1",
      FAKE_OPENCODE_SESSION_MODE: "ambiguous",
    }, "AMBIGUOUS_SESSION_SENTINEL");
    assert.equal(result.code, 1);
    assert.match(result.stderr, /SESSION_UNKNOWN/);
  } finally { fs.rmSync(runtime, { recursive: true, force: true }); }
});


for (const mode of ["normal", "normal-git", "session-fold", "missing-path", "bad-path", "drift", "worktree-drift", "wide-agent", "wide-config", "cancel-discovery", "cancel-close", "cancel-final"]) test(`OpenCode supervisor bound ${mode}: final owner and policy are verified before the sole client`, async () => {
  const runtime = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "opencode-bound-")));
  try {
    if(mode==="normal-git")assert.equal(spawnSync("git",["init","--quiet",runtime]).status,0);
    const owner=path.join(runtime,"owner literal%25 %2F space 中文");fs.mkdirSync(owner);fs.mkdirSync(path.join(owner,"bundle"));fs.writeFileSync(path.join(owner,"bundle","inside.txt"),"BOUND_PACKET_SENTINEL");
    const bytes=fs.readFileSync(path.join(owner,"bundle","inside.txt"));fs.writeFileSync(path.join(owner,"bundle","attachments-manifest.json"),JSON.stringify({files:[{target:"inside.txt",size:bytes.length,sha256:createHash("sha256").update(bytes).digest("hex")}]}));
    if(mode==="session-fold")fs.mkdirSync(owner.replaceAll("%25","%"));
    const trace=path.join(runtime,"trace.jsonl"),calls=path.join(runtime,"calls.json"),command=fakeOpenCode(runtime),port=await freePort(),url=`http://127.0.0.1:${port}`;
    const permission={"*":"deny",read:{"*":"deny",[path.join(owner,"bundle","inside.txt")]:"allow"}};
    const config=JSON.stringify({permission,agent:{build:{permission}}});
    const result=await runSupervisor({command,url,port,workspace:owner,clientArgv:["run","--attach",url,"--dir",owner]}, {FAKE_BOUND_TRACE:trace,FAKE_BOUND_MODE:mode,FAKE_BOUND_WORKTREE:mode==="normal-git"?runtime:"/",FAKE_OPENCODE_CALLS:calls,FAKE_OPENCODE_DIR:owner,FAKE_OPENCODE_NO_SESSION_OUTPUT:"1",OPENCODE_CONFIG_CONTENT:config,OPENCODE_PERMISSION:JSON.stringify(permission)},"BOUND_COMPLETE_STDIN\n第二行");
    const rows=fs.readFileSync(trace,"utf8").trim().split("\n").map(JSON.parse);
    if(mode==="session-fold"){assert.equal(result.code,1);assert.match(result.stderr,/SESSION_UNKNOWN/);assert.equal(rows.filter(r=>r.event==="run").length,1);}
    else if(!mode.startsWith("normal")) {assert.notEqual(result.code,0,"unsafe final server must fail before client");assert.equal(rows.filter(r=>r.event==="run").length,0);
      if(mode.startsWith("cancel-")){assert.equal(rows.filter(r=>r.event==="cancel").length,1,"actual structural event must trigger cancellation");assert.equal(rows.filter(r=>r.event==="serve").length,mode==="cancel-final"?2:1,"no later server may start after cancellation");}
    }
    else {
      assert.equal(result.code,0,result.stderr);
      const starts=rows.filter(r=>r.event==="serve");assert.equal(starts.length,2,"discovery must close and restart exactly once");
      assert.deepEqual(JSON.parse(starts[0].config).permission,{"*":"deny",read:{"*":"deny"}},"discovery has no file grant");
      const closedIndex=rows.findIndex(r=>r.event==="closed"&&r.phase===1),secondServeIndex=rows.findIndex(r=>r.event==="serve"&&r.pid===starts[1].pid);assert.ok(closedIndex>=0,"discovery must report its actual close before the final serve starts");assert.ok(closedIndex<secondServeIndex);
      const final=JSON.parse(starts[1].config).permission;assert.deepEqual(final.read,{"*":"deny",[path.relative(mode==="normal-git"?runtime:"/",path.join(owner,"bundle","inside.txt"))]:"allow"});
      assert.deepEqual(JSON.parse(starts[1].permission),final);
      assert.equal(rows.filter(r=>r.event==="run").length,1);
      const call=JSON.parse(fs.readFileSync(calls,"utf8"));assert.equal(call.args[call.args.indexOf("--dir")+1],owner);assert.equal(call.stdin,"BOUND_COMPLETE_STDIN\n第二行");
      for(const endpoint of ["/path","/agent","/config"]) {const index=rows.findIndex(r=>r.event==="request"&&r.phase===2&&r.url===endpoint);assert.ok(index>=0&&index<rows.findIndex(r=>r.event==="run"),endpoint+" must be read from final server before client");assert.equal(decodeURIComponent(rows[index].directory),owner,"native routing header round-trips the literal canonical owner");}
    }
    for(const row of rows.filter(r=>r.event==="serve"||r.event==="run")) assert.throws(()=>process.kill(row.pid,0),{code:"ESRCH"},"all owned children exit");
    const probe=net.createServer();await new Promise((resolve,reject)=>{probe.once("error",reject);probe.listen(port,"127.0.0.1",resolve);});await new Promise(resolve=>probe.close(resolve));
  } finally {fs.rmSync(runtime,{recursive:true,force:true});}
});
