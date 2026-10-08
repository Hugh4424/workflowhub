import { createHash } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";

import { prepareConfiguredOcrHostContext, runConfiguredOcrHostReview, runOcrDelegationRound } from "../../runtime/review/ocr-delegation-adapter.mjs";
import { authenticatedEvidenceDigest } from "../../runtime/review/review-packet-identity.mjs";
import { appendRecord } from "../../runtime/interface/safe-write.mjs";

const roots = [];

// Skip only an absent executable. Low versions and installed-tool failures
// remain observable failures in the existing real CLI-dependent assertions.
function realOcrCommandMissing() {
  try {
    execFileSync("ocr", ["--version"], {
      env: { ...process.env, OCR_NO_UPDATE: "1" },
      timeout: 10_000, maxBuffer: 65_536, stdio: ["ignore", "pipe", "pipe"],
    });
    return false;
  } catch (error) { return error.code === "ENOENT"; }
}
const realOcrMissing = realOcrCommandMissing();

const compliantReviewPrompt = [
  "Review the supplied implementation and report evidence-backed findings.",
  "Do not invoke Agent, subagent, child-agent, or other agent tools.",
  "Do not wait for or poll agents, sessions, or processes; do not invoke wait/poll tools.",
].join("\n");

function directProviderOutput(provider, findings) {
  const review = JSON.stringify({ findings });
  return provider.startsWith("codex/")
    ? [
      JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: review } }),
      JSON.stringify({ type: "turn.completed" }),
    ].join("\n")
    : JSON.stringify({ role: "assistant", content: [{ type: "text", text: review }] });
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

// Owned CLI executes the real generated hook/MCP guard. Installed native capability
// is evidenced separately; this test does not run models or claim OS isolation.
function ownedPacketCli(root) {
  const executable = join(root, "owned-packet-cli"), launches = join(root, "launches.jsonl");
  const outside = join(root, "outside.txt"), skipGuard = join(root, "skip-guard"), hold = join(root, "hold"), failCodex = join(root, "fail-codex");
  writeFileSync(outside, "OWNED_OUTSIDE_MUST_NOT_BE_READ\n");
  writeFileSync(executable, String.raw`#!/usr/bin/env node
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {spawn,spawnSync}=require('node:child_process'),readline=require('node:readline');
const root=${JSON.stringify(root)},outside=${JSON.stringify(outside)},launches=${JSON.stringify(launches)};
const args=process.argv.slice(2),cwd=fs.realpathSync(process.cwd());
const adapter=args[0]==='exec'?'codex':args.includes('--agent-file')?'kimi':'antigravity';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const session=adapter==='kimi'?'owned-kimi-packet':'owned-ag-packet';
const report={adapter,cwd,pid:process.pid,denied:[]};
function finished(){fs.appendFileSync(launches,JSON.stringify(report)+'\n');
 if(adapter==='kimi')process.stdout.write(JSON.stringify({role:'meta',type:'session.resume_hint',session_id:session})+'\n');
 if(fs.existsSync(path.join(root,'hold'))){process.on('SIGTERM',()=>{});setInterval(()=>{},1000);return;}
 if(adapter==='kimi')process.stdout.write(JSON.stringify({role:'assistant',content:JSON.stringify({findings:[]})})+'\n');
 else{process.stdout.write(JSON.stringify({event:'init',conversation_id:session})+'\n');process.stdout.write(JSON.stringify({event:'result',result:{conversation_id:session,status:'SUCCESS',response:JSON.stringify({findings:[]}),usage:{input_tokens:3}}})+'\n');}}
async function main(){
 if(adapter==='codex'){
  assert(args.includes('--ignore-user-config')&&args.includes('--ignore-rules')&&args.includes('--strict-config'));
  assert(args.includes('shell_environment_policy.inherit="none"'));
  assert(args.some(x=>x.startsWith('permissions.wh_ocr=')&&x.includes('\":root\"=\"deny\"')&&x.includes(JSON.stringify(cwd)+'=\"read\"')));
  assert.equal(process.env.CODEX_APP_TOOLS_PIPE_PATH,undefined);
  fs.appendFileSync(launches,JSON.stringify(report)+'\n');
  if(fs.existsSync(path.join(root,'fail-codex'))){process.stderr.write('owned Codex failure\n');process.exitCode=7;return;}
  process.stdout.write(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:JSON.stringify({findings:[]})}})+'\n');process.stdout.write(JSON.stringify({type:'turn.completed',usage:{input_tokens:3}})+'\n');return;
 }
 if(fs.existsSync(path.join(root,'skip-guard'))){finished();return;}
 const alias=path.join(cwd,'owned-unlisted-alias');fs.symlinkSync(outside,alias);
 if(adapter==='antigravity'){
  assert(args.includes('--new-project')&&args.includes('--disable-slash-commands'));
  const config=JSON.parse(fs.readFileSync('.agents/hooks.json','utf8'))['workflowhub-packet-reader'];
  assert.equal(config.PreToolUse[0].matcher,'*');assert.equal(config.PostToolUse[0].matcher,'*');
  const hook=path.join(cwd,'.ocr-ag-guard/hook.cjs');
  function call(phase,name,a){const child=spawnSync(process.execPath,[hook,phase],{input:JSON.stringify({conversationId:session,toolCall:{name,args:a}}),encoding:'utf8',timeout:3000});assert.equal(child.status,0,child.stderr);return JSON.parse(child.stdout);}
  for(const file of ['review-prompt.md','src/reviewed.mjs']){const AbsolutePath=path.join(cwd,file);assert.equal(call('pre','view_file',{AbsolutePath}).decision,'allow');const bytes=fs.readFileSync(AbsolutePath);report[file]=hash(bytes);call('post','view_file',{AbsolutePath});}
  for(const AbsolutePath of [outside,alias,path.join(cwd,'undeclared.txt')]){assert.equal(call('pre','view_file',{AbsolutePath}).decision,'deny');report.denied.push('view:'+AbsolutePath);}
  for(const name of ['write_to_file','run_command','read_url_content','Agent','UnknownTool']){assert.equal(call('pre',name,{}).decision,'deny');report.denied.push(name);}
  assert.equal(fs.existsSync(path.join(cwd,'write-canary.txt')),false);finished();return;
 }
 const agent=args[args.indexOf('--agent-file')+1],skills=args[args.indexOf('--skills-dir')+1];
 assert.equal(agent,path.join(cwd,'.ocr-kimi-read/agent.md'));assert(fs.readFileSync(agent,'utf8').includes('tools: [mcp__card06_packet__Read]'));assert.deepEqual(fs.readdirSync(skills),[]);
 const config=JSON.parse(fs.readFileSync('.kimi-code/mcp.json','utf8')).mcpServers.card06_packet;
 const child=spawn(config.command,config.args,{cwd:config.cwd,stdio:['pipe','pipe','pipe']});report.mcp_pid=child.pid;
 const waiting=new Map();let next=0,stderr='';child.stderr.on('data',b=>{stderr+=b;});
 const closed=new Promise(resolve=>child.once('close',code=>{for(const waiter of waiting.values())waiter.reject(Error('MCP closed: '+stderr));resolve(code);}));
 readline.createInterface({input:child.stdout}).on('line',line=>{const response=JSON.parse(line),waiter=waiting.get(response.id);if(waiter){waiting.delete(response.id);waiter.resolve(response);}});
 function rpc(method,params){return new Promise((resolve,reject)=>{const id=++next;waiting.set(id,{resolve,reject});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');});}
 const read=async a=>(await rpc('tools/call',{name:'Read',arguments:a})).result;
 try{
  const init=await rpc('initialize',{protocolVersion:'2024-11-05'});assert(init.result.capabilities.tools);
  const tools=(await rpc('tools/list',{})).result.tools;assert.deepEqual(tools.map(x=>x.name),['Read']);
  for(const file of ['review-prompt.md','src/reviewed.mjs',...(fs.existsSync('diff-index.json')?['diff-index.json']:[])]){
   const original=fs.readFileSync(file),chunks=[];let offset=0,pages=0;
   do{const response=await read({path:file,offset});assert.equal(response.isError,false);const page=JSON.parse(response.content[0].text),bytes=Buffer.from(page.content);assert.equal(page.offset,offset);assert.equal(page.bytes_returned,bytes.length);assert(bytes.length<=16384);assert.equal(page.total_bytes,original.length);assert.equal(page.sha256,hash(original));assert.equal(page.unread_before.bytes,offset);chunks.push(bytes);pages++;if(!page.has_more){assert.equal(page.unread_after.bytes,0);break;}assert(page.next_offset>offset);assert.equal(page.next_offset,offset+bytes.length);offset=page.next_offset;}while(true);
   const joined=Buffer.concat(chunks);assert(joined.equals(original));report[file]={bytes:joined.length,sha256:hash(joined),pages};
  }
  for(const input of [outside,'../outside.txt','owned-unlisted-alias','undeclared.txt']){const response=await read({path:input});assert.equal(response.isError,true);assert(!JSON.stringify(response).includes('OWNED_OUTSIDE_MUST_NOT_BE_READ'));report.denied.push(input);}
  for(const a of [{path:'review-prompt.md',offset:-1},{path:'review-prompt.md',limit:65537}]){assert.equal((await read(a)).isError,true);report.denied.push('invalid-page');}
  for(const name of ['Write','Shell','Web','Agent','UnknownTool']){assert.equal((await rpc('tools/call',{name,arguments:{path:'review-prompt.md'}})).result.isError,true);report.denied.push(name);}
 }finally{child.stdin.end();assert.equal(await closed,0,stderr);}
 const trustDir=path.join(process.env.KIMI_CODE_HOME,'workspace-trust');
 const owned=fs.readdirSync(trustDir).filter(name=>{try{return JSON.parse(fs.readFileSync(path.join(trustDir,name),'utf8')).root===cwd;}catch{return false;}});assert.equal(owned.length,1);report.trustPath=path.join(trustDir,owned[0]);assert.equal(fs.statSync(report.trustPath).nlink,1);
 finished();
}
main().catch(error=>{process.stderr.write(String(error.stack||error));process.exitCode=9;});
`, { mode: 0o700 });
  return { executable, launches, skipGuard, hold, failCodex, outside };
}


describe("configured OCR direct host execution", () => {
  it("dispatches configured reviewers without requiring a host identity", async () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-ocr-shared-source-"));
    roots.push(root);
    const hostDir = join(root, ".config", "workflowhub");
    const attachmentRoot = join(root, "attachments");
    const configPath = join(root, "providers.json");
    mkdirSync(hostDir, { recursive: true });
    mkdirSync(attachmentRoot);
    writeFileSync(configPath, JSON.stringify({
      tiers: [["codex/luna", "kimi/coding"]],
      providers: {
        "codex/host": { enabled: true, model: "host-model", source_id: "shared-source" },
        "codex/luna": { enabled: true, model: "reviewer-model", source_id: "shared-source" },
        "kimi/coding": { enabled: true, model: "independent-model", source_id: "independent-source" },
      },
      attachment_roots: [{ root: attachmentRoot, sources: [".wh-review-packets"] }],
    }));
    writeFileSync(join(hostDir, "config.json"), JSON.stringify({
      third_review: { command: ["/unused/3rd-review"], config: configPath, attachment_root: attachmentRoot },
      wh_review: { version: 2, stages: { "build-code": {
        initial: ["codex/luna", "kimi/coding"], mode: "full_only", minimum_heterologous: 2,
      } } },
    }));
    const previousHome = process.env.HOME;
    process.env.HOME = root;
    try {
      const input = { ...request };
      const context = prepareConfiguredOcrHostContext(input);
      expect(context.selection.eligibleProfiles).toEqual(["codex/luna", "kimi/coding"]);
      const dispatched = [];
      const result = await runConfiguredOcrHostReview({ request: input, packet: configuredPacket() }, {
        trustedContext: context,
        providerExecutor: async ({ provider }) => {
          dispatched.push(provider);
          return { status: "completed", output: directProviderOutput(provider, []) };
        },
      });
      expect(dispatched).toEqual(["codex/luna", "kimi/coding"]);
      expect(result).toMatchObject({ status: "available", outcome: "completed",
        provider_results: [{ status: "completed" }, { status: "completed" }] });
    } finally {
      if (previousHome === undefined) delete process.env.HOME;
      else process.env.HOME = previousHome;
    }
  });

  it("selects every configured route without an independence boundary", async () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-ocr-trusted-route-"));
    roots.push(root);
    const hostDir = join(root, ".config", "workflowhub");
    const attachmentRoot = join(root, "attachments");
    const configPath = join(root, "providers.json");
    mkdirSync(hostDir, { recursive: true });
    mkdirSync(attachmentRoot);
    const profiles = {
      "codex/luna": { enabled: true, model: "luna" },
      "kimi/coding": { enabled: true, model: "kimi" },
    };
    writeFileSync(configPath, JSON.stringify({
      tiers: [["codex/luna", "kimi/coding"]], providers: profiles,
      attachment_roots: [{ root: attachmentRoot, sources: [".wh-review-packets"] }],
    }));
    writeFileSync(join(hostDir, "config.json"), JSON.stringify({
      third_review: { command: ["/unused/3rd-review"], config: configPath, attachment_root: attachmentRoot },
      wh_review: { version: 2, stages: { "build-code": {
        initial: ["codex/luna", "kimi/coding"], mode: "full_only", minimum_heterologous: 2,
      } } },
    }));
    const previousHome = process.env.HOME;
    process.env.HOME = root;
    try {
      const input = { ...request };
      const context = prepareConfiguredOcrHostContext(input);
      expect(context.selection.providers).toEqual(["codex/luna", "kimi/coding"]);
      expect(context.selection.eligibleProfiles).toEqual(["codex/luna", "kimi/coding"]);
      expect(context.selection.provider_identities["codex/luna"].config_id).toMatch(/^[a-f0-9]{64}$/);
      expect(context.route_identity).toMatch(/^[a-f0-9]{64}$/);
      profiles["kimi/coding"].model = "luna";
      writeFileSync(configPath, JSON.stringify({
        tiers: [["codex/luna", "kimi/coding"]], providers: profiles,
        attachment_roots: [{ root: attachmentRoot, sources: [".wh-review-packets"] }],
      }));
      const sameModel = prepareConfiguredOcrHostContext(input);
      expect(sameModel.selection.providers).toEqual(["codex/luna", "kimi/coding"]);
      expect(sameModel.selection.eligibleProfiles).toEqual(["codex/luna", "kimi/coding"]);
      expect(sameModel.selection.provider_identities["codex/luna"].source_id).toBe("codex/luna");
      expect(sameModel.selection.provider_identities["kimi/coding"].source_id).toBe("kimi/coding");
      let calls = 0;
      const completedProvider = async ({ provider }) => {
        calls++;
        return { status: "completed", output: provider === "codex/luna"
          ? JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: JSON.stringify({ findings: [] }) } }) + "\n"
            + JSON.stringify({ type: "turn.completed", usage: { input_tokens: 1 } }) + "\n"
          : JSON.stringify({ role: "assistant", content: [{ type: "text", text: JSON.stringify({ findings: [] }) }] }) };
      };
      const sameModelResult = await runConfiguredOcrHostReview({ request: input, packet: configuredPacket() }, {
        trustedContext: sameModel, providerExecutor: completedProvider,
      });
      expect(calls).toBe(2);
      expect(sameModelResult).toMatchObject({
        status: "available", outcome: "completed",
        provider_results: [
          { status: "completed" },
          { status: "completed" },
        ],
      });
      calls = 0;
      const sameModelMinimumOne = await runConfiguredOcrHostReview({ request: input, packet: configuredPacket() }, {
        trustedContext: { ...sameModel, route: { ...sameModel.route, minimum_heterologous: 1 } },
        providerExecutor: completedProvider,
      });
      expect(calls).toBe(2);
      expect(sameModelMinimumOne).toMatchObject({
        status: "available", outcome: "completed",
        provider_results: [
          { status: "completed" },
          { status: "completed" },
        ],
      });

      profiles["codex/host"] = { enabled: true, model: "host" };
      delete profiles["kimi/coding"];
      writeFileSync(configPath, JSON.stringify({ tiers: [["codex/luna", "kimi/coding"]], providers: profiles,
        attachment_roots: [{ root: attachmentRoot, sources: [".wh-review-packets"] }] }));
      const missing = prepareConfiguredOcrHostContext(input);
      expect(missing.selection.provider_models["kimi/coding"]).toBeNull();
      expect(missing.selection.provider_identities["kimi/coding"].config_id).toMatch(/^[a-f0-9]{64}$/);
      calls = 0;
      const missingResult = await runConfiguredOcrHostReview({ request: input, packet: configuredPacket() }, {
        trustedContext: missing,
        providerExecutor: async () => { calls++; return { status: "failed", error: { code: "CONTROLLED_FAILURE" } }; },
      });
      expect(calls).toBe(1);
      expect(missingResult.provider_results[1]).toMatchObject({
        status: "failed", identity: { model: null },
        error: { code: "OCR_PROVIDER_CONFIG_INVALID", message: "selected provider is not configured" },
      });

      profiles["kimi/coding"] = { enabled: false, model: "kimi" };
      writeFileSync(configPath, JSON.stringify({ tiers: [["codex/luna", "kimi/coding"]], providers: profiles,
        attachment_roots: [{ root: attachmentRoot, sources: [".wh-review-packets"] }] }));
      const disabled = prepareConfiguredOcrHostContext(input);
      calls = 0;
      const disabledResult = await runConfiguredOcrHostReview({ request: input, packet: configuredPacket() }, {
        trustedContext: disabled,
        providerExecutor: async () => { calls++; return { status: "failed", error: { code: "CONTROLLED_FAILURE" } }; },
      });
      expect(calls).toBe(1);
      expect(disabledResult.provider_results[1]).toMatchObject({
        status: "failed", identity: { model: "kimi" },
        error: { code: "OCR_PROVIDER_CONFIG_INVALID", message: "selected provider is disabled" },
      });

      profiles["codex/luna"].enabled = false;
      writeFileSync(configPath, JSON.stringify({ tiers: [["codex/luna", "kimi/coding"]], providers: profiles,
        attachment_roots: [{ root: attachmentRoot, sources: [".wh-review-packets"] }] }));
      const none = prepareConfiguredOcrHostContext(input);
      calls = 0;
      const noneResult = await runConfiguredOcrHostReview({ request: input, packet: configuredPacket() }, {
        trustedContext: none,
        providerExecutor: async () => { calls++; throw new Error("should not run"); },
      });
      expect(calls).toBe(0);
      expect(noneResult).toMatchObject({
        status: "unavailable", outcome: "failed", error: { code: "OCR_ALL_PROVIDERS_FAILED" },
        provider_results: [{ status: "failed" }, { status: "failed" }],
      });
    } finally {
      if (previousHome === undefined) delete process.env.HOME;
      else process.env.HOME = previousHome;
    }
  });

  it("starts a provider CLI directly with a path prompt for a packet larger than 1 MB, then cleans up", async () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-ocr-cli-"));
    roots.push(root);
    const executable = join(root, "fake-codex");
    writeFileSync(executable, `#!/usr/bin/env node
const fs = require("node:fs");
const args = process.argv.slice(2);
const prompt = fs.readFileSync("review-prompt.md", "utf8");
const entry = args.at(-1);
const configs = args.flatMap((arg,index)=>arg==="-c"?[args[index+1]]:[]);
const disabled = args.flatMap((arg,index)=>arg==="--disable"?[args[index+1]]:[]);
const permission = 'permissions.wh_ocr={filesystem={":root"="deny",":minimal"="read",":tmpdir"="deny",":slash_tmp"="deny",'
  + JSON.stringify(process.cwd()) + '="read"},network={enabled=false}}';
if (!configs.includes('default_permissions="wh_ocr"') || !configs.includes(permission)
    || !configs.includes('approval_policy="never"') || !configs.includes('web_search="disabled"')
    || !configs.includes('shell_environment_policy.inherit="none"')
    || !["apps","plugins","multi_agent","view_image","skill_search","skill_mcp_dependency_install","memories",
      "browser_use","computer_use","image_generation","tool_suggest","goals"].every(feature=>disabled.includes(feature))
    || !args.includes("--enable") || args[args.indexOf("--enable")+1]!=="skip_host_skill_discovery") process.exit(7);
if (args[0] !== "exec" || !args.includes("--json")
    || !args.includes("--ignore-user-config") || !args.includes("--ignore-rules") || !args.includes("--strict-config")
    || !args.includes("--skip-git-repo-check") || !args.includes("--ephemeral")
    || args[args.indexOf("-C")+1] !== process.cwd()
    || !entry.includes("Read review-prompt.md in this directory")
    || process.env.CODEX_APP_TOOLS_PIPE_PATH !== undefined
    || !prompt.includes("Codex CLI with verified native packet filesystem, tool and environment boundaries only:")
    || !prompt.includes("cat or sed -n")
    || !prompt.includes("All other providers must use a read tool only.")) process.exit(8);
if (args.join(" ").includes("export const") || prompt.includes("export const")
    || fs.statSync("src/reviewed.mjs").size <= 1024 * 1024) process.exit(9);
process.stdout.write(JSON.stringify({type:"item.completed",item:{type:"agent_message",text:JSON.stringify({findings:[]})}})+"\\n");
process.stdout.write(JSON.stringify({type:"turn.completed",usage:{input_tokens:3}})+"\\n");
`, { mode: 0o700 });
    const packet = configuredPacket("x".repeat(1024 * 1024 + 1));
    const priorHostDirs = new Set(readdirSync(tmpdir()).filter((name) =>
      name.startsWith("workflowhub-ocr-host-") && !name.startsWith("workflowhub-ocr-host-test-")));
    const priorPipe = process.env.CODEX_APP_TOOLS_PIPE_PATH;
    process.env.CODEX_APP_TOOLS_PIPE_PATH = join(root, "owned-unused-app-pipe-sentinel");
    let result;
    try {
      result = await runConfiguredOcrHostReview({ request, packet }, {
        trustedContext: configuredContext(["codex/luna"], executable),
      });
    } finally {
      if (priorPipe === undefined) delete process.env.CODEX_APP_TOOLS_PIPE_PATH;
      else process.env.CODEX_APP_TOOLS_PIPE_PATH = priorPipe;
    }
    expect(result).toMatchObject({
      status: "available", outcome: "completed", dispatch_state: "dispatched",
      provider_results: [{ status: "completed", findings: [], coverage: { read_confirmed: null } }],
    });
    expect(result.provider_results[0].coverage.selected_files).toEqual(["src/reviewed.mjs"]);
    expect(result.provider_results[0].usage).toEqual({ input_tokens: 3 });
    expect(readdirSync(tmpdir()).filter((name) => name.startsWith("workflowhub-ocr-host-")
      && !name.startsWith("workflowhub-ocr-host-test-")
      && !priorHostDirs.has(name))).toEqual([]);
  });

  it("normalizes reported usage while keeping unknown reads and unreported usage genuinely null", async () => {
    const result = await runConfiguredOcrHostReview({ request, packet: configuredPacket() }, {
      trustedContext: configuredContext(["codex/luna", "kimi/coding"], "/unused/provider"),
      providerExecutor: async ({ provider }) => ({ status: "completed", output: directProviderOutput(provider, []),
        ...(provider === "codex/luna" ? { usage: { input: 5, output: 2, totalTokens: 7, cacheRead: 1, cacheWrite: 2, reasoning: 3, cost: 0.1 } } : {}) }),
    });
    const [reported, absent] = result.provider_results;
    const usage = { input_tokens: 5, output_tokens: 2, total_tokens: 7, cache_read_tokens: 1, cache_write_tokens: 2, reasoning_tokens: 3, cost: 0.1 };
    expect(reported.usage).toEqual(usage);
    expect(reported.execution).toMatchObject({ usage, usage_status: "reported" });
    expect(reported.usage_status).toBe("reported");
    expect(absent).toMatchObject({ usage: null, usage_status: "not_reported", execution: { usage: null, usage_status: "not_reported" } });
    for (const member of result.provider_results) {
      expect(member.coverage).toEqual({ selected_files: ["src/reviewed.mjs"], read_confirmed: null });
      expect(member.material_coverage).toEqual({ provider: member.provider, read: [], unread: [], undetermined: ["src/reviewed.mjs"] });
    }
  });

  it.each([null, {}, [], "unreported"])("keeps absent or invalid usage %j null without zero substitution", async (usage) => {
    const result = await runConfiguredOcrHostReview({ request, packet: configuredPacket() }, {
      trustedContext: configuredContext(["codex/luna"], "/unused/provider"),
      providerExecutor: async () => ({ status: "completed", output: directProviderOutput("codex/luna", []), usage }),
    });
    expect(result.provider_results[0]).toMatchObject({ usage: null, usage_status: "not_reported", execution: { usage: null, usage_status: "not_reported" } });
  });

  it("skips only empty original streams before the sink without turning a completed provider into a save failure", async () => {
    const output = directProviderOutput("codex/luna", []), sizes = [];
    const result = await runConfiguredOcrHostReview({ request, packet: configuredPacket() }, {
      trustedContext: configuredContext(["codex/luna"], "/unused/provider"),
      providerExecutor: async () => ({ status: "completed", output, raw_output: { stdout: Buffer.from(output), stderr: Buffer.alloc(0), exit_code: 0 } }),
      rawOutputSink: async (_hint, bytes) => { sizes.push(bytes.length); return bytes.length ? "quality/reviews/2026-10-08-001-owned.output" : null; },
    });
    expect(sizes).toEqual([Buffer.byteLength(output)]);
    expect(result.provider_results[0]).toMatchObject({ status: "completed", parse_outcome: "ok", raw_output_ref: "quality/reviews/2026-10-08-001-owned.output" });
    expect(result.provider_results[0].evidence_refs).toEqual(["quality/reviews/2026-10-08-001-owned.output"]);
  });

  it("retains the successful provider and the failed provider separately", async () => {
    const packet = configuredPacket();
    const result = await runConfiguredOcrHostReview({ request, packet }, {
      trustedContext: configuredContext(["kimi/coding", "codex/luna"], "/unused/provider"),
      providerExecutor: async ({ provider }) => provider === "kimi/coding"
        ? { status: "completed", output: JSON.stringify({
          role: "assistant", content: [{ type: "text", text: JSON.stringify({ findings: [] }) }],
        }), usage: { input_tokens: 7 } }
        : { status: "failed", error: { code: "AUTHENTICATION_FAILED", message: "account unavailable" } },
    });
    expect(result.status).toBe("available-with-failures");
    expect(result.provider_results.map(({ status }) => status)).toEqual(["completed", "failed"]);
    expect(result.provider_results[0].usage).toEqual({ input_tokens: 7 });
    expect(result.provider_results[1].error.code).toBe("AUTHENTICATION_FAILED");
    expect(result.findings).toEqual([]);
  });

  it("returns unavailable when all configured providers fail", async () => {
    const result = await runConfiguredOcrHostReview({ request, packet: configuredPacket() }, {
      trustedContext: configuredContext(["codex/luna"], "/unused/provider"),
      providerExecutor: async () => ({ status: "failed", error: { code: "OCR_PROVIDER_SPAWN_FAILED", message: "ENOENT" } }),
    });
    expect(result).toMatchObject({
      status: "unavailable", outcome: "failed", error: { code: "OCR_ALL_PROVIDERS_FAILED" },
      provider_results: [{ status: "failed", error: { code: "OCR_PROVIDER_SPAWN_FAILED" } }],
    });
  });

  it("preserves a direct provider spawn failure from the supervisor", async () => {
    const result = await runConfiguredOcrHostReview({ request, packet: configuredPacket() }, {
      trustedContext: configuredContext(["codex/luna"], "/unused/provider"),
    });
    expect(result).toMatchObject({
      status: "unavailable", provider_results: [{ status: "failed", error: { code: "OCR_PROVIDER_SPAWN_FAILED" } }],
    });
  });

  it("uses the generated Kimi MCP packet reader for exact paged reads and rejects default-denied tools while preserving a Codex sibling", async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-owned-kimi-"))); roots.push(root);
    const nativeHome = join(root, "kimi-home"); mkdirSync(nativeHome); mkdirSync(join(nativeHome, "workspace-trust"));
    const sentinel = join(nativeHome, "workspace-trust", "owned-preexisting"); writeFileSync(sentinel, "original trust bytes\n");
    const cli = ownedPacketCli(root), previous = process.env.KIMI_CODE_HOME; process.env.KIMI_CODE_HOME = nativeHome;
    mkdirSync(join(root,"quality","reviews"),{recursive:true});
    const raw = new Map(), sink = async (_hint, bytes, metadata) => { const saved=await appendRecord(join(root,"quality","reviews"),metadata.provider.replaceAll("/","-")+"-"+metadata.stream,"output",bytes);raw.set(metadata.provider + ":" + metadata.stream,readFileSync(saved));return relative(root,saved).split("\\").join("/"); };
    try {
      const packet = configuredPacket(), large = Buffer.from(JSON.stringify({ fixture: "CJK三\n".repeat(80000) }));
      writeFileSync(join(packet.root, "diff-index.json"), large); packet.preview.reviewable_files.push({path:"diff-index.json"});
      packet.manifest.push({path:"diff-index.json",bytes:large.length,sha256:createHash("sha256").update(large).digest("hex")});
      const alone = await runConfiguredOcrHostReview({request,packet},{trustedContext:configuredContext(["kimi/coding"],cli.executable),rawOutputSink:sink});
      expect(alone).toMatchObject({status:"available",provider_results:[{provider:"kimi/coding",status:"completed",session_id:"owned-kimi-packet",findings:[],parse_outcome:"ok"}]});
      const report = JSON.parse(readFileSync(cli.launches,"utf8").trim());
      expect(report["diff-index.json"]).toMatchObject({bytes:large.length,sha256:createHash("sha256").update(large).digest("hex")});
      expect(report["diff-index.json"].pages).toBeGreaterThan(1); expect(report.denied).toHaveLength(11);
      expect(raw.get("kimi/coding:stdout").toString()).toContain('"session_id":"owned-kimi-packet"');
      expect(existsSync(report.cwd)).toBe(false); expect(existsSync(report.trustPath)).toBe(false);
      expect(() => process.kill(report.pid,0)).toThrow(); expect(() => process.kill(report.mcp_pid,0)).toThrow();
      expect(readFileSync(sentinel,"utf8")).toBe("original trust bytes\n");
      const mixed = await runConfiguredOcrHostReview({request,packet:configuredPacket()},{trustedContext:configuredContext(["kimi/coding","codex/luna"],cli.executable)});
      expect(mixed.status,JSON.stringify(mixed.provider_results.map(x=>({provider:x.provider,error:x.error})))).toBe("available"); expect(mixed.provider_results.map(x=>x.status)).toEqual(["completed","completed"]);
      expect(mixed.provider_results[1].usage).toEqual({input_tokens:3});
      writeFileSync(cli.skipGuard,"skip");
      const rejected = await runConfiguredOcrHostReview({request,packet:configuredPacket()},{trustedContext:configuredContext(["kimi/coding"],cli.executable)});
      expect(rejected).toMatchObject({status:"unavailable",provider_results:[{status:"failed",error:{code:"OCR_PROVIDER_PACKET_GUARD_FAILED"}}]});
      expect(readdirSync(join(nativeHome,"workspace-trust"))).toEqual(["owned-preexisting"]);
    } finally {if(previous===undefined)delete process.env.KIMI_CODE_HOME;else process.env.KIMI_CODE_HOME=previous;}
  },15000);


  it("dispatches every configured provider even when sources overlap", async () => {
    let calls = 0;
    const trustedContext = configuredContext(["kimi/coding", "codex/luna"], "/unused/provider");
    const result = await runConfiguredOcrHostReview({ request, packet: configuredPacket() }, {
      trustedContext,
      providerExecutor: async ({ provider }) => {
        calls += 1;
        return { status: "completed", output: directProviderOutput(provider, []) };
      },
    });
    expect(calls).toBe(2);
    expect(result.status).toBe("available");
    expect(result.provider_results.map(({ status }) => status)).toEqual(["completed", "completed"]);
  });

  it("fails before dispatch when the trusted provider configuration changes", async () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-ocr-config-"));
    roots.push(root);
    const configPath = join(root, "providers.json");
    writeFileSync(configPath, "{}");
    const trustedContext = configuredContext(["codex/luna"], "/unused/provider");
    trustedContext.trusted.config = configPath;
    trustedContext.provider_config_sha256 = "0".repeat(64);
    let calls = 0;
    await expect(runConfiguredOcrHostReview({ request, packet: configuredPacket() }, {
      trustedContext,
      providerExecutor: async () => { calls += 1; return { status: "completed", output: "" }; },
    })).rejects.toMatchObject({ code: "OCR_PROVIDER_CONFIG_DRIFT", dispatch_state: "blocked_before_dispatch" });
    expect(calls).toBe(0);
  });

  it("uses the generated Antigravity hook for positive packet reads and default-denied tools without weakening Codex sibling outcomes", async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-owned-ag-"))); roots.push(root);
    const cli = ownedPacketCli(root), input = {...request,stage:"verify-code",review_scope:null,phase_id:null};
    mkdirSync(join(root,"quality","reviews"),{recursive:true});
    for(const acknowledged of [undefined,false,true]){
      const context = configuredContext(["antigravity/flash"],cli.executable);context.providerConfig.providers["antigravity/flash"].allow_host_state=acknowledged;
      const raw = new Map();
      const result = await runConfiguredOcrHostReview({request:input,packet:configuredPacket()},{trustedContext:context,rawOutputSink:async(_hint,bytes,meta)=>{const saved=await appendRecord(join(root,"quality","reviews"),meta.stream,"output",bytes);raw.set(meta.stream,readFileSync(saved));return relative(root,saved).split("\\").join("/");}});
      expect(result).toMatchObject({status:"available",provider_results:[{provider:"antigravity/flash",status:"completed",session_id:"owned-ag-packet",findings:[],parse_outcome:"ok"}]});
      const report = JSON.parse(readFileSync(cli.launches,"utf8").trim().split("\n").at(-1));
      expect(report.denied).toHaveLength(8); expect(raw.get("stdout").toString()).toContain('"conversation_id":"owned-ag-packet"');
      expect(existsSync(report.cwd)).toBe(false);expect(()=>process.kill(report.pid,0)).toThrow();
    }
    const before = readFileSync(cli.launches,"utf8");let unknownHealth=0;
    const unknown = await runConfiguredOcrHostReview({request:input,packet:configuredPacket()},{trustedContext:configuredContext(["unknown/reviewer"],cli.executable),onProviderHealth:()=>{unknownHealth++;}});
    expect(unknown).toMatchObject({status:"unavailable",provider_results:[{status:"failed",error:{code:"OCR_PROVIDER_UNSUPPORTED"}}]});
    expect(readFileSync(cli.launches,"utf8")).toBe(before);expect(unknownHealth).toBe(0);
    const mixed = await runConfiguredOcrHostReview({request:input,packet:configuredPacket()},{trustedContext:configuredContext(["antigravity/flash","codex/luna"],cli.executable)});
    expect(mixed.status,JSON.stringify(mixed.provider_results.map(x=>({provider:x.provider,error:x.error})))).toBe("available");expect(mixed.provider_results[1]).toMatchObject({status:"completed",usage:{input_tokens:3}});
    writeFileSync(cli.failCodex,"owned failure\n");
    const failed = await runConfiguredOcrHostReview({request:input,packet:configuredPacket()},{trustedContext:configuredContext(["antigravity/flash","codex/luna"],cli.executable)});
    expect(failed).toMatchObject({status:"available-with-failures",provider_results:[{status:"completed"},{status:"failed",error:{code:"OCR_PROVIDER_EXIT_NONZERO"}}]});
    writeFileSync(cli.skipGuard,"skip");
    const rejected = await runConfiguredOcrHostReview({request:input,packet:configuredPacket()},{trustedContext:configuredContext(["antigravity/flash"],cli.executable)});
    expect(rejected).toMatchObject({status:"unavailable",provider_results:[{status:"failed",error:{code:"OCR_PROVIDER_PACKET_GUARD_FAILED"}}]});
  },15000);

  it.skipIf(process.platform === "win32")("reaps a Kimi owned native process, packet and only its external trust entry after owner loss", async () => {
    const root=realpathSync(mkdtempSync(join(tmpdir(),"workflowhub-owned-kimi-loss-")));roots.push(root);
    const nativeHome=join(root,"kimi-home");mkdirSync(nativeHome);mkdirSync(join(nativeHome,"workspace-trust"));
    const sentinel=join(nativeHome,"workspace-trust","owned-preexisting");writeFileSync(sentinel,"original trust bytes\n");
    const cli=ownedPacketCli(root);writeFileSync(cli.hold,"hold");
    const driver=`import{runConfiguredOcrHostReview}from ${JSON.stringify(new URL("../../runtime/review/ocr-delegation-adapter.mjs",import.meta.url).href)};await runConfiguredOcrHostReview({request:${JSON.stringify(request)},packet:${JSON.stringify(configuredPacket())}},{trustedContext:${JSON.stringify(configuredContext(["kimi/coding"],cli.executable))}});`;
    const owner=spawn(process.execPath,["--input-type=module","-e",driver],{env:{...process.env,KIMI_CODE_HOME:nativeHome},stdio:["ignore","ignore","pipe"]});let errors="",report=null;owner.stderr.on("data",b=>{errors+=b;});
    const ownerClosed=new Promise(resolve=>owner.once("close",resolve));
    const alive=pid=>{try{process.kill(pid,0);return true;}catch(error){if(error.code==="ESRCH")return false;throw error;}};
    try{
      for(let n=0;n<200&&!existsSync(cli.launches);n++)await new Promise(resolve=>setTimeout(resolve,25));
      expect(existsSync(cli.launches),errors).toBe(true);report=JSON.parse(readFileSync(cli.launches,"utf8").trim());
      expect(alive(report.pid)).toBe(true);expect(existsSync(report.cwd)).toBe(true);expect(existsSync(report.trustPath)).toBe(true);
      expect(relative(report.cwd,report.trustPath)).toMatch(/^\.\./);
      owner.kill("SIGKILL");await ownerClosed;
      for(let n=0;n<240&&(alive(report.pid)||existsSync(report.cwd)||existsSync(report.trustPath));n++)await new Promise(resolve=>setTimeout(resolve,25));
      expect(alive(report.pid)).toBe(false);expect(existsSync(report.cwd)).toBe(false);expect(existsSync(report.trustPath)).toBe(false);
      expect(readFileSync(sentinel,"utf8")).toBe("original trust bytes\n");
    }finally{if(owner.exitCode===null&&owner.signalCode===null){owner.kill("SIGKILL");await ownerClosed;}if(report&&alive(report.pid))process.kill(report.pid,"SIGKILL");}
  },15000);

  it("reports live child liveness during silence and the last real output after progress", async () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-ocr-health-"));
    roots.push(root);
    const executable = join(root, "fake-codex");
    writeFileSync(executable, `#!/usr/bin/env node
setTimeout(() => {
  process.stdout.write(JSON.stringify({type:"item.completed",item:{type:"agent_message",text:JSON.stringify({findings:[]})}})+"\\n");
  process.stdout.write(JSON.stringify({type:"turn.completed"})+"\\n");
}, 250);
`, { mode: 0o700 });
    const observed = [];
    let finished = false;
    const pending = runConfiguredOcrHostReview({ request, packet: configuredPacket() }, {
      trustedContext: configuredContext(["codex/luna"], executable),
      healthPollMs: 15,
      onProviderHealth: (health) => observed.push(health),
    }).then((result) => { finished = true; return result; });
    for (let attempt = 0; attempt < 100 && observed.filter((item) =>
      item.status === "running" && item.liveness === true && item.last_output_at_ms === null).length < 2; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(finished).toBe(false);
    expect(observed.filter((item) => item.status === "running"
      && item.liveness === true && item.last_output_at_ms === null).length).toBeGreaterThanOrEqual(2);
    const result = await pending;
    const member = result.provider_results[0];
    expect(result.status).toBe("available");
    expect(member.execution.retry.progress_events).toBeGreaterThan(0);
    expect(member.execution.health).toMatchObject({
      status: "completed", liveness: false, progress_events: member.execution.retry.progress_events,
    });
    expect(Number.isSafeInteger(member.execution.health.last_liveness_at_ms)).toBe(true);
    expect(Number.isSafeInteger(member.execution.health.last_output_at_ms)).toBe(true);
    expect(observed.some((item) => item.status === "running"
      && item.last_output_at_ms !== null && item.progress_events > 0)).toBe(true);
  });

  it("keeps a silent direct provider live until explicit cancellation and cleans up", async () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-ocr-no-deadline-"));
    roots.push(root);
    const executable = join(root, "fake-codex");
    writeFileSync(executable, `#!/usr/bin/env node
process.on("SIGTERM", () => {});
setInterval(() => {}, 1000);
`, { mode: 0o700 });
    const priorHostDirs = new Set(readdirSync(tmpdir()).filter((name) =>
      name.startsWith("workflowhub-ocr-host-") && !name.startsWith("workflowhub-ocr-host-test-")));
    const controller = new AbortController();
    const pending = runConfiguredOcrHostReview({ request, packet: configuredPacket(), signal: controller.signal }, {
      trustedContext: configuredContext(["codex/luna"], executable),
    });
    await new Promise((resolve) => setTimeout(resolve, 150));
    controller.abort(new Error("operator cancelled"));
    const result = await pending;
    expect(result).toMatchObject({
      status: "unavailable",
      outcome: "cancelled",
      provider_results: [{ status: "cancelled", error: { code: "OCR_PROVIDER_CANCELLED" } }],
    });
    expect(result.provider_results[0].execution.health.status).toBe("cancelled");
    expect(readdirSync(tmpdir()).filter((name) => name.startsWith("workflowhub-ocr-host-")
      && !name.startsWith("workflowhub-ocr-host-test-")
      && !priorHostDirs.has(name))).toEqual([]);
  });

  it("treats 16 MiB as a provider-output capture limit, after file input dispatch", async () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-ocr-output-"));
    roots.push(root);
    const executable = join(root, "fake-codex");
    writeFileSync(executable, `#!/usr/bin/env node
require("node:fs").statSync("src/reviewed.mjs");
process.stdout.write("x".repeat(17 * 1024 * 1024));
`, { mode: 0o700 });
    const result = await runConfiguredOcrHostReview({ request, packet: configuredPacket("x".repeat(1024 * 1024 + 1)) }, {
      trustedContext: configuredContext(["codex/luna"], executable),
    });
    expect(result).toMatchObject({
      status: "unavailable", provider_results: [{ status: "failed", error: { code: "OCR_PROVIDER_OUTPUT_LIMIT" } }],
    });
    expect(result.provider_results[0].execution.retry.progress_events).toBeGreaterThan(0);
    expect(result.provider_results[0].execution.health.stdout_bytes).toBeGreaterThan(16 * 1024 * 1024);
  });

  it("terminates a live direct provider only after explicit cancellation", async () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-ocr-cancel-"));
    roots.push(root);
    const executable = join(root, "fake-codex");
    const startedMarker = join(root, "started");
    writeFileSync(executable, `#!/usr/bin/env node
require("node:fs").writeFileSync(${JSON.stringify(startedMarker)}, "started");
setInterval(() => {}, 1000);
`, { mode: 0o700 });
    const controller = new AbortController();
    const priorHostDirs = new Set(readdirSync(tmpdir()).filter((name) =>
      name.startsWith("workflowhub-ocr-host-") && !name.startsWith("workflowhub-ocr-host-test-")));
    const pending = runConfiguredOcrHostReview({
      request, packet: configuredPacket(), signal: controller.signal,
    }, { trustedContext: configuredContext(["codex/luna"], executable) });
    for (let attempt = 0; attempt < 100 && !existsSync(startedMarker); attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(existsSync(startedMarker)).toBe(true);
    controller.abort();
    const result = await pending;
    expect(result).toMatchObject({
      status: "unavailable", outcome: "cancelled",
      provider_results: [{ status: "cancelled", error: { code: "OCR_PROVIDER_CANCELLED" } }],
    });
    expect(readdirSync(tmpdir()).filter((name) => name.startsWith("workflowhub-ocr-host-")
      && !name.startsWith("workflowhub-ocr-host-test-")
      && !priorHostDirs.has(name))).toEqual([]);
  });

  it.skipIf(process.platform === "win32")("terminates the provider process group after an uncatchable owner loss", async () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-ocr-owner-loss-"));
    roots.push(root);
    const executable = join(root, "fake-codex");
    const providerPidFile = join(root, "provider.pid");
    const descendantPidFile = join(root, "descendant.pid");
    writeFileSync(executable, `#!/usr/bin/env node
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const descendant = spawn(process.execPath, ["-e", "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)"], { stdio: "ignore" });
fs.writeFileSync(${JSON.stringify(providerPidFile)}, String(process.pid));
fs.writeFileSync(${JSON.stringify(descendantPidFile)}, String(descendant.pid));
process.on("SIGTERM", () => {});
setInterval(() => {}, 1000);
`, { mode: 0o700 });
    const packet = configuredPacket();
    const priorHostDirs = new Set(readdirSync(tmpdir()).filter((name) =>
      name.startsWith("workflowhub-ocr-host-") && !name.startsWith("workflowhub-ocr-host-test-")));
    const driver = `
import { runConfiguredOcrHostReview } from ${JSON.stringify(new URL("../../runtime/review/ocr-delegation-adapter.mjs", import.meta.url).href)};
await runConfiguredOcrHostReview({ request: ${JSON.stringify(request)}, packet: ${JSON.stringify(packet)} }, {
  trustedContext: ${JSON.stringify(configuredContext(["codex/luna"], executable))},
});
`;
    const owner = spawn(process.execPath, ["--input-type=module", "-e", driver], { stdio: "ignore" });
    let providerPid;
    let descendantPid;
    let bundleRoot;
    try {
      for (let attempt = 0; attempt < 200 && !existsSync(descendantPidFile); attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      expect(existsSync(providerPidFile)).toBe(true);
      expect(existsSync(descendantPidFile)).toBe(true);
      providerPid = Number(readFileSync(providerPidFile, "utf8"));
      descendantPid = Number(readFileSync(descendantPidFile, "utf8"));
      expect(Number.isSafeInteger(providerPid) && providerPid > 0).toBe(true);
      expect(Number.isSafeInteger(descendantPid) && descendantPid > 0).toBe(true);
      process.kill(providerPid, 0);
      process.kill(descendantPid, 0);
      const created = readdirSync(tmpdir()).filter((name) =>
        name.startsWith("workflowhub-ocr-host-") && !name.startsWith("workflowhub-ocr-host-test-")
        && !priorHostDirs.has(name));
      expect(created).toHaveLength(1);
      bundleRoot = join(tmpdir(), created[0]);
      expect(existsSync(bundleRoot)).toBe(true);
      owner.kill("SIGKILL");
      for (let attempt = 0; attempt < 200; attempt += 1) {
        const alive = [providerPid, descendantPid].filter((pid) => {
          try { process.kill(pid, 0); return true; }
          catch (error) {
            if (error.code === "ESRCH") return false;
            throw error;
          }
        });
        if (alive.length === 0) { providerPid = null; descendantPid = null; break; }
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      expect(providerPid).toBeNull();
      expect(descendantPid).toBeNull();
      for (let attempt = 0; attempt < 200 && existsSync(bundleRoot); attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      expect(existsSync(bundleRoot)).toBe(false);
    } finally {
      if (owner.exitCode === null) owner.kill("SIGKILL");
      for (const pid of [providerPid, descendantPid]) {
        if (pid) {
          try { process.kill(pid, "SIGKILL"); } catch { /* already gone */ }
        }
      }
      if (bundleRoot) rmSync(bundleRoot, { recursive: true, force: true });
    }
  });

  it.skipIf(process.platform === "win32")("keeps the shared packet while one provider is still live, then cleans it after owner loss", async () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-ocr-owner-loss-pair-"));
    roots.push(root);
    const executable = join(root, "fake-codex");
    const fastPidFile = join(root, "fast.pid");
    const slowPidFile = join(root, "slow.pid");
    const slowTermFile = join(root, "slow.term");
    writeFileSync(executable, `#!/usr/bin/env node
const fs = require("node:fs");
const args = process.argv.slice(2);
const model = args[args.indexOf("--model") + 1];
if (model === "fast") {
  fs.writeFileSync(${JSON.stringify(fastPidFile)}, String(process.pid));
  process.stdout.write(JSON.stringify({type:"item.completed",item:{type:"agent_message",text:JSON.stringify({findings:[]})}})+"\\n");
  process.stdout.write(JSON.stringify({type:"turn.completed"})+"\\n");
} else {
  process.on("SIGTERM", () => fs.writeFileSync(${JSON.stringify(slowTermFile)}, "term"));
  fs.writeFileSync(${JSON.stringify(slowPidFile)}, String(process.pid));
  setInterval(() => {}, 1000);
}
`, { mode: 0o700 });
    const trustedContext = configuredContext(["codex/fast", "codex/slow"], executable);
    trustedContext.providerConfig.providers["codex/fast"].model = "fast";
    trustedContext.providerConfig.providers["codex/slow"].model = "slow";
    const packet = configuredPacket();
    const priorHostDirs = new Set(readdirSync(tmpdir()).filter((name) =>
      name.startsWith("workflowhub-ocr-host-") && !name.startsWith("workflowhub-ocr-host-test-")));
    const driver = `
import { runConfiguredOcrHostReview } from ${JSON.stringify(new URL("../../runtime/review/ocr-delegation-adapter.mjs", import.meta.url).href)};
await runConfiguredOcrHostReview({ request: ${JSON.stringify(request)}, packet: ${JSON.stringify(packet)} }, {
  trustedContext: ${JSON.stringify(trustedContext)},
});
`;
    const owner = spawn(process.execPath, ["--input-type=module", "-e", driver], { stdio: "ignore" });
    let bundleRoot;
    let slowPid;
    try {
      for (let attempt = 0; attempt < 200 && (!existsSync(fastPidFile) || !existsSync(slowPidFile)); attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      expect(existsSync(fastPidFile)).toBe(true);
      expect(existsSync(slowPidFile)).toBe(true);
      const fastPid = Number(readFileSync(fastPidFile, "utf8"));
      slowPid = Number(readFileSync(slowPidFile, "utf8"));
      for (let attempt = 0; attempt < 200; attempt += 1) {
        try { process.kill(fastPid, 0); }
        catch (error) { if (error.code === "ESRCH") break; throw error; }
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      expect(() => process.kill(fastPid, 0)).toThrow();
      process.kill(slowPid, 0);
      const created = readdirSync(tmpdir()).filter((name) =>
        name.startsWith("workflowhub-ocr-host-") && !name.startsWith("workflowhub-ocr-host-test-")
        && !priorHostDirs.has(name));
      expect(created).toHaveLength(1);
      bundleRoot = join(tmpdir(), created[0]);
      expect(existsSync(bundleRoot)).toBe(true);
      owner.kill("SIGKILL");
      for (let attempt = 0; attempt < 200 && !existsSync(slowTermFile); attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      expect(existsSync(slowTermFile)).toBe(true);
      process.kill(slowPid, 0);
      expect(existsSync(bundleRoot)).toBe(true);
      for (let attempt = 0; attempt < 200 && existsSync(bundleRoot); attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      expect(existsSync(bundleRoot)).toBe(false);
      expect(() => process.kill(slowPid, 0)).toThrow();
      slowPid = null;
    } finally {
      if (owner.exitCode === null) owner.kill("SIGKILL");
      if (slowPid) {
        try { process.kill(slowPid, "SIGKILL"); } catch { /* already gone */ }
      }
      if (bundleRoot) rmSync(bundleRoot, { recursive: true, force: true });
    }
  });
});

function bundle(reviewPrompt = compliantReviewPrompt) {
  const root = mkdtempSync(join(tmpdir(), "workflowhub-ocr-adapter-bundle-"));
  roots.push(root);
  mkdirSync(join(root, "src"));
  writeFileSync(join(root, "src", "reviewed.mjs"), "export const reviewed = true;\n");
  writeFileSync(join(root, "changes.diff"), "diff --git a/src/reviewed.mjs b/src/reviewed.mjs\n");
  writeFileSync(join(root, "review-instructions.md"), `${reviewPrompt}\n`);
  return {
    bundleRoot: root,
    materialId: "a".repeat(64),
    manifest: [
      { path: "src/reviewed.mjs" },
      { path: "changes.diff" },
      { path: "review-instructions.md" },
    ],
  };
}

const request = Object.freeze({
  stage: "build-code",
  review_scope: "phase",
  subject_kind: "phase",
  phase_id: "P3",
  candidate_experiment: true,
});

function configuredPacket(content = "export const reviewed = true;\n") {
  const root = mkdtempSync(join(tmpdir(), "workflowhub-ocr-host-test-"));
  roots.push(root);
  mkdirSync(join(root, "src"));
  const path = "src/reviewed.mjs";
  writeFileSync(join(root, path), content);
  const bytes = Buffer.from(content);
  return {
    root, material_id: "a".repeat(64),
    preview: { reviewable_files: [{ path }] },
    rules: { rules: [{ path, rule: "Inspect correctness." }] },
    manifest: [{ path, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") }],
  };
}

function configuredContext(providers, command) {
  return {
    trusted: {}, route: { mode: "single_round", minimum_heterologous: 1 },
    selection: { providers, provider_identities: Object.fromEntries(providers.map((provider) =>
      [provider, { source_id: provider + "-source", config_id: provider + "-config" }])) },
    providerConfig: { providers: Object.fromEntries(providers.map((provider) =>
      [provider, { enabled: true, command, model: "test-model" }])) },
  };
}

describe("OCR delegation adapter", () => {
  it("fails closed before spawning an OpenCode provider without enforceable read-only tools", async () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-ocr-opencode-"));
    roots.push(root);
    const marker = join(root, "spawned");
    const executable = join(root, "fake-opencode");
    writeFileSync(executable, `#!/usr/bin/env node\nrequire("node:fs").writeFileSync(${JSON.stringify(marker)}, "ran");\n`, { mode: 0o700 });
    const result = await runConfiguredOcrHostReview({ request, packet: configuredPacket() }, {
      trustedContext: configuredContext(["opencode/reviewer"], executable),
    });
    expect(existsSync(marker)).toBe(false);
    expect(result).toMatchObject({ status: "unavailable", provider_results: [
      { status: "failed", error: { code: "OCR_PROVIDER_UNSUPPORTED" } },
    ] });
    let controlledCalls = 0;
    const controlled = await runConfiguredOcrHostReview({ request, packet: configuredPacket() }, {
      trustedContext: configuredContext(["opencode/reviewer"], executable),
      providerExecutor: async () => { controlledCalls += 1; return { status: "completed", output: "{}" }; },
    });
    expect(controlledCalls).toBe(0);
    expect(controlled.provider_results[0].error.code).toBe("OCR_PROVIDER_UNSUPPORTED");
  });

  it.skipIf(realOcrMissing).each([
    ["Agent/subagent", "Do not wait for or poll agents, sessions, or processes; do not invoke wait/poll tools."],
    ["wait/poll", "Do not invoke Agent, subagent, child-agent, or other agent tools."],
  ])("does not dispatch when the prompt omits the %s prohibition", async (_constraint, retainedConstraint) => {
    let calls = 0;
    const result = await runOcrDelegationRound(request, {
      buildBundle: () => bundle(retainedConstraint),
      executor: async () => { calls += 1; return { status: "available", outcome: "completed", findings: [] }; },
    });

    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "blocked_before_dispatch",
      error: { code: "OCR_PROMPT_CONSTRAINTS_MISSING" },
    });
    expect(calls).toBe(0);
  });

  it.skipIf(realOcrMissing)("also validates an explicitly supplied prompt before dispatch", async () => {
    let calls = 0;
    const result = await runOcrDelegationRound({ ...request, prompt: "Review the packet and return findings." }, {
      buildBundle: bundle,
      executor: async () => { calls += 1; return { status: "available", outcome: "completed", findings: [] }; },
    });

    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "blocked_before_dispatch",
      error: { code: "OCR_PROMPT_CONSTRAINTS_MISSING" },
    });
    expect(calls).toBe(0);
  });

  it("returns MATERIAL_INCOMPLETE as unavailable without dispatching", async () => {
    let calls = 0;
    const result = await runOcrDelegationRound(request, {
      buildBundle: () => { throw new Error("MATERIAL_INCOMPLETE: verify-code acceptance_criteria is empty"); },
      executor: async () => { calls += 1; return { status: "available", outcome: "completed", findings: [] }; },
    });

    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "blocked_before_dispatch",
      error: { code: "MATERIAL_INCOMPLETE" },
    });
    expect(calls).toBe(0);
  });

  it.skipIf(realOcrMissing)("runs deterministic packet preparation and stays unavailable without a host executor", async () => {
    const result = await runOcrDelegationRound(request, { buildBundle: bundle });

    expect(result).toMatchObject({
      status: "unavailable",
      outcome: "unavailable",
      material_id: "a".repeat(64),
      dispatch_state: "blocked_before_dispatch",
      error: { code: "OCR_DELEGATION_UNAVAILABLE" },
      provider_results: [],
      findings: [],
    });
    expect(result.ocr.preview.reviewable_files.length).toBeGreaterThan(0);
    expect(result.ocr.version).toMatch(/^open-code-review v\d+\.\d+\.\d+/);
    expect(result.ocr.preview.reviewable_files.map(({ path }) => path)).not.toContain("rule.json");
    expect(result.ocr.rules).toBeTruthy();
  });

  it.skipIf(realOcrMissing)("gives an independent executor only the materialized packet and removes it after use", async () => {
    let packetRoot;
    const result = await runOcrDelegationRound(request, {
      buildBundle: bundle,
      executor: async ({ packet }) => {
        packetRoot = packet.root;
        expect(existsSync(join(packet.root, "src", "reviewed.mjs"))).toBe(true);
        expect(existsSync(join(packet.root, "rule.json"))).toBe(false);
        expect(readFileSync(join(packet.root, "diff", "changes.md"), "utf8")).toContain("```diff");
        return { status: "available", outcome: "completed", findings: [], provider_results: [] };
      },
    });

    expect(result).toMatchObject({ status: "available", outcome: "completed", material_id: "a".repeat(64) });
    expect(result.ocr.version).toMatch(/^open-code-review v\d+\.\d+\.\d+/);
    expect(result.ocr.preview.repository).toBe("<host-path-redacted>");
    expect(JSON.stringify(result.ocr)).not.toContain("/private/var");
    expect(existsSync(packetRoot)).toBe(false);
  });

  it.skipIf(realOcrMissing)("binds verify-code semantic OCR output to redacted request evidence instead of forged executor fields", async () => {
    const authenticatedEvidence = { reviewed_execution: { ref: "quality/evidence/current.json" }, source_path: "/Users/Hugh/private/reviewed.mjs" };
    const result = await runOcrDelegationRound({ stage: "verify-code", authenticated_evidence: authenticatedEvidence }, {
      buildBundle: bundle,
      executor: async () => ({
        status: "available", outcome: "completed", findings: [], provider_results: [],
        authenticated_evidence: { source_path: "forged" }, authenticated_evidence_sha256: "0".repeat(64),
      }),
    });

    expect(result).toMatchObject({ status: "available", outcome: "completed" });
    expect(result.authenticated_evidence).toEqual({
      reviewed_execution: { ref: "quality/evidence/current.json" }, source_path: "<host-path-redacted>",
    });
    expect(result.authenticated_evidence_sha256).toBe(authenticatedEvidenceDigest(authenticatedEvidence));
    expect(JSON.stringify(result)).not.toContain("/Users/Hugh/private/reviewed.mjs");
  });

  it.skipIf(realOcrMissing)("keeps the original unavailable OCR error with the same redacted evidence digest", async () => {
    const authenticatedEvidence = { reviewed_execution: { ref: "quality/evidence/current.json" }, source_path: "/Users/Hugh/private/reviewed.mjs" };
    const result = await runOcrDelegationRound({ stage: "verify-code", authenticated_evidence: authenticatedEvidence }, {
      buildBundle: bundle,
    });

    expect(result).toMatchObject({
      status: "unavailable", dispatch_state: "blocked_before_dispatch",
      error: { code: "OCR_DELEGATION_UNAVAILABLE", message: "host OCR delegation executor is unavailable; no legacy review fallback was used" },
      provider_results: [], findings: [],
    });
    expect(result.authenticated_evidence).toEqual({
      reviewed_execution: { ref: "quality/evidence/current.json" }, source_path: "<host-path-redacted>",
    });
    expect(result.authenticated_evidence_sha256).toBe(authenticatedEvidenceDigest(authenticatedEvidence));
    expect(JSON.stringify(result)).not.toContain("/Users/Hugh/private/reviewed.mjs");
  });

  it("rejects manifest paths outside the bundle before reading or writing outside the packet", async () => {
    const sourceBundle = bundle();
    const outsideRoot = mkdtempSync(join(tmpdir(), "workflowhub-ocr-adapter-outside-"));
    roots.push(outsideRoot);
    const outsideDiff = join(outsideRoot, "payload.diff");
    const outsideMarkdown = join(outsideRoot, "payload.md");
    writeFileSync(outsideDiff, "external diff bytes\n");
    writeFileSync(outsideMarkdown, "preserve outside file\n");
    let executorCalled = false;

    const result = await runOcrDelegationRound(request, {
      buildBundle: () => ({
        ...sourceBundle,
        manifest: [{ path: relative(sourceBundle.bundleRoot, outsideDiff).split("\\").join("/") }],
      }),
      executor: async () => { executorCalled = true; return { status: "available", outcome: "completed", findings: [], provider_results: [] }; },
    });

    expect(result).toMatchObject({ status: "unavailable", error: { code: "OCR_PACKET_PREPARATION_FAILED" } });
    expect(executorCalled).toBe(false);
    expect(readFileSync(outsideMarkdown, "utf8")).toBe("preserve outside file\n");
  });

  it.skipIf(realOcrMissing)("redacts host paths from executor errors and OCR diagnostics", async () => {
    const result = await runOcrDelegationRound(request, {
      buildBundle: bundle,
      executor: async () => { throw new Error("failed reading /Users/Hugh/private/source.mjs and /tmp/ocr-secret"); },
    });

    const serialized = JSON.stringify(result);
    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "sent_unparsed",
      error: { code: "OCR_EXECUTOR_FAILED" },
      executor_error: "failed reading <host-path-redacted> and <host-path-redacted>",
    });
    expect(serialized).not.toContain("/Users/Hugh");
    expect(serialized).not.toContain("/tmp/ocr-secret");
    expect(serialized).not.toContain("/private/var/folders");
  });

  it.skipIf(realOcrMissing)("requests executor termination and bounds cleanup when the request is cancelled", async () => {
    const controller = new AbortController();
    let packetRoot;
    let terminationRequests = 0;
    let finishExecution;
    const execution = new Promise((resolve) => { finishExecution = resolve; });
    const pending = runOcrDelegationRound(request, {
      buildBundle: bundle,
      signal: controller.signal,
      cancellationGraceMs: 25,
      executor: ({ packet, registerCancellation }) => {
        packetRoot = packet.root;
        registerCancellation(() => {
          terminationRequests += 1;
          finishExecution(null);
        });
        return execution;
      },
    });

    controller.abort(new Error("review interrupted"));
    const result = await pending;

    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "unknown",
      error: { code: "OCR_EXECUTOR_CANCELLED" },
      cancellation: { termination_requested: true, termination_confirmed: true },
    });
    expect(terminationRequests).toBe(1);
    expect(existsSync(packetRoot)).toBe(false);
  });

  it.skipIf(realOcrMissing)("records when executor termination cannot be confirmed within the grace period", async () => {
    const controller = new AbortController();
    let packetRoot;
    const pending = runOcrDelegationRound(request, {
      buildBundle: bundle,
      signal: controller.signal,
      cancellationGraceMs: 10,
      executor: ({ packet, registerCancellation }) => {
        packetRoot = packet.root;
        registerCancellation(() => undefined);
        return new Promise(() => {});
      },
    });

    controller.abort();
    const result = await pending;

    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "unknown",
      error: { code: "OCR_EXECUTOR_CANCEL_UNCONFIRMED" },
      cancellation: { termination_requested: true, termination_confirmed: false, packet_cleanup: "deferred_until_executor_exit" },
    });
    expect(existsSync(packetRoot)).toBe(true);
    roots.push(packetRoot);
  });

  it.skipIf(realOcrMissing).each(["dispatched", "blocked_before_dispatch"])("retains the executor's explicit %s state after cancellation", async (dispatchState) => {
    const controller = new AbortController();
    let finishExecution;
    const execution = new Promise((resolve) => { finishExecution = resolve; });
    const observed = {
      status: "unavailable", outcome: "failed", dispatch_state: dispatchState,
      error: { code: "CONTROLLED_SOURCE_FAILED", message: "controlled executor observation" },
      provider_results: [{ provider: "controlled/source", status: "failed", error: { code: "CONTROLLED_SOURCE_FAILED" } }],
      findings: [],
    };
    const pending = runOcrDelegationRound(request, {
      buildBundle: bundle, signal: controller.signal, cancellationGraceMs: 100,
      executor: ({ registerCancellation }) => {
        registerCancellation(() => { finishExecution(observed); });
        return execution;
      },
    });
    controller.abort();
    const result = await pending;
    expect(result).toMatchObject({
      status: "unavailable", dispatch_state: dispatchState,
      provider_results: observed.provider_results,
      error: observed.error,
      cancellation: { termination_requested: true, termination_confirmed: true },
    });
  });

  it.skipIf(realOcrMissing)("cleans the packet if an unconfirmed executor later exits", async () => {
    const controller = new AbortController();
    let packetRoot;
    let finishExecution;
    const execution = new Promise((resolve) => { finishExecution = resolve; });
    const pending = runOcrDelegationRound(request, {
      buildBundle: bundle,
      signal: controller.signal,
      cancellationGraceMs: 10,
      executor: ({ packet, registerCancellation }) => {
        packetRoot = packet.root;
        registerCancellation(async () => ({ confirmed: false }));
        return execution;
      },
    });

    controller.abort(new Error("operator cancellation was not confirmed"));
    const result = await pending;
    expect(result).toMatchObject({ error: { code: "OCR_EXECUTOR_CANCEL_UNCONFIRMED" } });
    expect(existsSync(packetRoot)).toBe(true);

    finishExecution(null);
    await new Promise((resolve) => setImmediate(resolve));
    expect(existsSync(packetRoot)).toBe(false);
  });

  it.skipIf(realOcrMissing)("does not start an executor when already cancelled", async () => {
    const controller = new AbortController();
    controller.abort();
    let calls = 0;
    const result = await runOcrDelegationRound(request, {
      buildBundle: bundle,
      signal: controller.signal,
      executor: async () => { calls += 1; return null; },
    });

    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "blocked_before_dispatch",
      error: { code: "OCR_EXECUTOR_CANCELLED" },
    });
    expect(calls).toBe(0);
  });
});


describe("OCR original provider bytes", () => {
  function rawFixture(providers, body) {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-ocr-raw-")));
    roots.push(root);
    const executable = join(root, "fake-provider");
    writeFileSync(executable, "#!/usr/bin/env node\n" + body, { mode: 0o700 });
    const trustedContext = configuredContext(providers, executable);
    for (const provider of providers) trustedContext.providerConfig.providers[provider].model = provider.split("/")[1];
    const directory = join(root, "quality", "reviews");
    mkdirSync(directory, { recursive: true });
    const saved = new Map(), returnedRefs = new Map();
    const rawOutputSink = async (hint, bytes, metadata) => {
      expect(Buffer.isBuffer(bytes)).toBe(true);
      expect(providers).toContain(metadata.provider);
      expect(["stdout", "stderr"]).toContain(metadata.stream);
      expect(hint).toMatch(/^quality\/reviews\/ocr-build-code-[a-z0-9-]+-(stdout|stderr)\.output$/);
      const slug = `ocr-build-code-${metadata.provider.replace(/[^a-z0-9-]/gi, "-")}-${metadata.stream}`;
      const file = await appendRecord(directory, slug, "output", bytes);
      const ref = relative(root, file).replaceAll("\\", "/");
      expect(ref).toMatch(/^quality\/reviews\/\d{4}-\d{2}-\d{2}-\d{3}-[a-z0-9-]+\.output$/);
      const original = readFileSync(file);
      expect(original.equals(bytes)).toBe(true);
      saved.set(ref, original);
      returnedRefs.set(`${metadata.provider}\0${metadata.stream}`, ref);
      return ref;
    };
    return { root, trustedContext, saved, returnedRefs, rawOutputSink };
  }
  function rawBytes(state, member, stream) {
    const refs = member.evidence_refs;
    expect(Array.isArray(refs)).toBe(true);
    expect(member.raw_output_ref === null || typeof member.raw_output_ref === "string").toBe(true);
    if (member.raw_output_ref !== null) expect(member.raw_output_ref).toBe(refs[0]);
    let ref = state.returnedRefs.get(`${member.provider}\0${stream}`);
    // Identical channels may share one original; read that actual returned ref.
    if (ref === undefined) {
      expect(refs).toHaveLength(1);
      ref = refs[0];
    }
    expect(refs).toContain(ref);
    expect(ref).toMatch(/^quality\/reviews\/\d{4}-\d{2}-\d{2}-\d{3}-[a-z0-9-]+\.output$/);
    const original = readFileSync(join(state.root, ref));
    expect(original.equals(state.saved.get(ref))).toBe(true);
    return original;
  }

  it("binds a persisted OCR raw output digest to the chosen original without inventing hashes for missing refs", async () => {
    const provider = "codex/good";
    const output = directProviderOutput(provider, []);
    const stdout = Buffer.from(output);
    const stderr = Buffer.from([0xff, 0x00, 0x61]);
    const scenarios = [
      { name: "distinct streams", stdout, stderr, streams: ["stdout", "stderr"], chosen: "stdout", originals: 2 },
      { name: "stderr only", stdout: Buffer.alloc(0), stderr, streams: ["stderr"], chosen: "stderr", originals: 1 },
      { name: "identical streams", stdout, stderr: stdout, streams: ["stdout"], chosen: "stdout", originals: 1 },
      { name: "stdout save failure", stdout, stderr, streams: ["stdout", "stderr"], failStdout: true, originals: 1 },
      { name: "null sink refs", stdout, stderr, streams: ["stdout", "stderr"], nullRefs: true, originals: 0 },
      { name: "empty streams", stdout: Buffer.alloc(0), stderr: Buffer.alloc(0), streams: [], originals: 0 },
    ];
    for (const scenario of scenarios) {
      const state = rawFixture([provider], "");
      try {
        const streams = [], observed = [];
        const result = await runConfiguredOcrHostReview({ request, packet: configuredPacket() }, {
          trustedContext: state.trustedContext,
          providerExecutor: async () => ({ status: "completed", output,
            raw_output: { stdout: scenario.stdout, stderr: scenario.stderr, exit_code: 0 } }),
          rawOutputSink: async (hint, bytes, metadata) => {
            streams.push(metadata.stream);
            if (scenario.failStdout && metadata.stream === "stdout") throw new Error("fixture stdout save failed");
            if (scenario.nullRefs) return null;
            return state.rawOutputSink(hint, bytes, metadata);
          },
          onProviderResult: (value) => observed.push(value),
        });
        const member = result.provider_results[0];
        expect(streams, scenario.name).toEqual(scenario.streams);
        expect(state.saved.size, scenario.name).toBe(scenario.originals);
        expect(observed, scenario.name).toHaveLength(1);
        expect(observed[0].pending_providers, scenario.name).toEqual([]);
        expect(observed[0].settled_results, scenario.name).toHaveLength(1);
        expect(member, scenario.name).toMatchObject({ parse_outcome: "ok", process_outcome: "ok", usage: null, usage_status: "not_reported" });
        if (scenario.failStdout || scenario.nullRefs) {
          expect(member, scenario.name).toMatchObject({ status: "failed", error: { code: "OCR_PROVIDER_OUTPUT_SAVE_FAILED" } });
        } else expect(member.status, scenario.name).toBe("completed");
        if (scenario.failStdout) {
          const ref = state.returnedRefs.get(`${provider}\0stderr`);
          expect(member.evidence_refs, scenario.name).toEqual([ref]);
          expect(readFileSync(join(state.root, ref)), scenario.name).toEqual(stderr);
          expect(member.unavailable_diagnostics.message).toContain("stdout: fixture stdout save failed");
        }
        for (const projected of [observed[0].result, observed[0].settled_results[0], member]) {
          expect(projected.raw_output_ref, scenario.name).toBe(member.raw_output_ref);
          if (scenario.chosen) {
            const ref = state.returnedRefs.get(`${provider}\0${scenario.chosen}`);
            expect(projected.raw_output_ref, scenario.name).toBe(ref);
            expect(projected.raw_output_ref, scenario.name).toBe(projected.evidence_refs[0]);
            expect(projected.evidence_refs, scenario.name).toHaveLength(scenario.originals);
            const original = readFileSync(join(state.root, ref));
            expect(original, scenario.name).toEqual(scenario[scenario.chosen]);
            const digest = createHash("sha256").update(original).digest("hex");
            expect(projected.raw_output_sha256, scenario.name).toBe(digest);
            if (scenario.name === "distinct streams") {
              expect(projected.raw_output_sha256).not.toBe(createHash("sha256").update(stderr).digest("hex"));
            }
            if (scenario.chosen === "stderr") {
              expect(projected.raw_output_sha256).not.toBe(createHash("sha256").update(stdout).digest("hex"));
            }
          } else {
            expect(projected.raw_output_ref, scenario.name).toBeNull();
            expect(projected, scenario.name).not.toHaveProperty("raw_output_sha256");
            if (scenario.originals === 0) expect(projected, scenario.name).not.toHaveProperty("evidence_refs");
          }
        }
      } finally {
        // Only this case's existing rawFixture-owned temporary root is removed.
        expect(realpathSync(state.root)).toBe(state.root);
        expect(state.root.startsWith(join(realpathSync(tmpdir()), "workflowhub-ocr-raw-"))).toBe(true);
        rmSync(state.root, { recursive: true, force: true });
      }
    }
  });

  it("saves stdout/stderr before parse failure and keeps the later successful sibling", async () => {
    // Broken final review JSON lives inside a valid Codex event envelope.
    const invalid = JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: '{"findings":' } }) + "\n" + JSON.stringify({ type: "turn.completed" }) + "\n";
    const valid = directProviderOutput("codex/good", []);
    const state = rawFixture(["codex/bad", "codex/good"], `
const model = process.argv[process.argv.indexOf("--model") + 1];
if (model === "bad") {
  process.stdout.write(${JSON.stringify(invalid)});
  process.stderr.write(Buffer.from([0xff, 0x00, 0x61]));
} else setTimeout(() => process.stdout.write(${JSON.stringify(valid)}), 120);
`);
    const terminal = [];
    const result = await runConfiguredOcrHostReview({ request, packet: configuredPacket() }, {
      ...state, onProviderResult: ({ result, pending_providers }) => {
        expect(rawBytes(state, result, "stdout")).toBeDefined();
        terminal.push({ status: result.status, pending_providers });
      },
    });
    expect(result.status).toBe("available-with-failures");
    const [failed, completed] = result.provider_results;
    expect(rawBytes(state, failed, "stdout")).toEqual(Buffer.from(invalid));
    expect(rawBytes(state, failed, "stderr")).toEqual(Buffer.from([0xff, 0x00, 0x61]));
    expect(failed).toMatchObject({ process_outcome: "ok", parse_outcome: "invalid", error: { code: "OUTPUT_INVALID" }, unavailable_diagnostics: { code: "OUTPUT_INVALID" } });
    expect(failed.unavailable_diagnostics.message).toContain("parse_error=");
    expect(failed.unavailable_diagnostics.message).toMatch(/JSON|Unexpected|Expected|position/);
    expect(rawBytes(state, completed, "stdout")).toEqual(Buffer.from(valid));
    expect(completed).toMatchObject({ status: "completed", parse_outcome: "ok" });
    expect(terminal[0]).toEqual({ status: "failed", pending_providers: ["codex/good"] });
  });

  it("keeps non-UTF8 output from a nonzero exit without inventing a parse result", async () => {
    const state = rawFixture(["codex/bad"], 'process.stdout.write(Buffer.from([0xff,0xfe,0x00])); process.stderr.write(Buffer.from([0x80,0x61])); process.exitCode=7;');
    const result = await runConfiguredOcrHostReview({ request, packet: configuredPacket() }, state);
    const member = result.provider_results[0];
    expect(rawBytes(state, member, "stdout")).toEqual(Buffer.from([0xff, 0xfe, 0x00]));
    expect(rawBytes(state, member, "stderr")).toEqual(Buffer.from([0x80, 0x61]));
    expect(member).toMatchObject({ status: "failed", process_outcome: "exit_nonzero", parse_outcome: null });
    expect(member.unavailable_diagnostics.message).toContain("exit_code=7");
  });

  it("keeps captured bytes on explicit cancellation", async () => {
    const state = rawFixture(["codex/cancel"], 'process.stdout.write(Buffer.from([0xff,0x00])); process.stderr.write("cancel stderr"); setInterval(()=>{},1000);');
    const controller = new AbortController();
    const result = await runConfiguredOcrHostReview({ request, packet: configuredPacket(), signal: controller.signal }, {
      ...state, onProviderHealth: (health) => { if (health.stderr_bytes > 0) controller.abort(); },
    });
    const member = result.provider_results[0];
    expect(rawBytes(state, member, "stdout")).toEqual(Buffer.from([0xff, 0x00]));
    expect(rawBytes(state, member, "stderr")).toEqual(Buffer.from("cancel stderr"));
    expect(member).toMatchObject({ status: "cancelled", parse_outcome: null });
    expect(member.unavailable_diagnostics.message).toContain("cancelled=true");
  });

  it("saves the bounded output prefix and labels overflow rather than claiming complete bytes", async () => {
    const state = rawFixture(["codex/overflow"], 'process.stdout.write(Buffer.alloc(17*1024*1024, 0xff));');
    const result = await runConfiguredOcrHostReview({ request, packet: configuredPacket() }, state);
    const member = result.provider_results[0];
    expect(rawBytes(state, member, "stdout").equals(Buffer.alloc(16*1024*1024, 0xff))).toBe(true);
    expect(member).toMatchObject({ status: "failed", error: { code: "OCR_PROVIDER_OUTPUT_LIMIT" }, parse_outcome: null });
    expect(member.unavailable_diagnostics.message).toContain("captured_output_limited=true");
    expect(member.unavailable_diagnostics.message).toContain("stdout_bytes=");
  });

  it("fails the affected provider loudly when saving bytes fails and still retains its sibling", async () => {
    const invalid = "bad provider output";
    const valid = directProviderOutput("codex/good", []);
    const state = rawFixture(["codex/bad", "codex/good"], `const model=process.argv[process.argv.indexOf("--model")+1]; process.stdout.write(model==="bad"?${JSON.stringify(invalid)}:${JSON.stringify(valid)}); if(model==="bad") process.exitCode=7;`);
    const sink = state.rawOutputSink;
    const result = await runConfiguredOcrHostReview({ request, packet: configuredPacket() }, {
      ...state, rawOutputSink: (ref, bytes, metadata) => {
        if (bytes.toString() === invalid) throw new Error("fixture canonical write failed");
        return sink(ref, bytes, metadata);
      },
    });
    expect(result.status).toBe("available-with-failures");
    expect(result.provider_results[0]).toMatchObject({ status: "failed", raw_output_ref: null, error: { code: "OCR_PROVIDER_OUTPUT_SAVE_FAILED" } });
    expect(result.provider_results[0].unavailable_diagnostics.message).toContain("fixture canonical write failed");
    expect(result.provider_results[0].unavailable_diagnostics.message).toContain("process_error=OCR_PROVIDER_EXIT_NONZERO");
    expect(result.provider_results[1].status).toBe("completed");
    expect(rawBytes(state, result.provider_results[1], "stdout")).toEqual(Buffer.from(valid));
  });

  it("retains parse failure after a successful process when saving its original bytes also fails", async () => {
    const invalid = JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: '{"findings":' } }) + "\n" + JSON.stringify({ type: "turn.completed" }) + "\n";
    const valid = directProviderOutput("codex/good", []);
    const badStderr = Buffer.from([0xff, 0x00, 0x61]);
    const state = rawFixture(["codex/bad", "codex/good"], `
const model=process.argv[process.argv.indexOf("--model")+1];
if(model==="bad") {
  process.stdout.write(${JSON.stringify(invalid)});
  process.stderr.write(Buffer.from([0xff,0x00,0x61]));
} else setTimeout(()=>process.stdout.write(${JSON.stringify(valid)}),120);
`);
    const sink = state.rawOutputSink;
    const observed = [];
    const result = await runConfiguredOcrHostReview({ request, packet: configuredPacket() }, {
      ...state,
      rawOutputSink: (ref, bytes, metadata) => {
        if (bytes.equals(Buffer.from(invalid))) throw new Error("fixture canonical write failed");
        return sink(ref, bytes, metadata);
      },
      onProviderResult: ({ result }) => observed.push(result),
    });
    const [bad, good] = result.provider_results;
    expect(result.status).toBe("available-with-failures");
    expect(bad).toMatchObject({ status: "failed", process_outcome: "ok", parse_outcome: "invalid", raw_output_ref: null,
      error: { code: "OCR_PROVIDER_OUTPUT_SAVE_FAILED" }, unavailable_diagnostics: { code: "OCR_PROVIDER_OUTPUT_SAVE_FAILED" } });
    expect(bad.unavailable_diagnostics.message).toContain("raw_output_save_error=stdout: fixture canonical write failed");
    expect(bad.unavailable_diagnostics.message).toContain("parse_error_code=OUTPUT_INVALID");
    expect(bad.unavailable_diagnostics.message).toContain("parse_error=");
    expect(bad.unavailable_diagnostics.message).toMatch(/JSON|Unexpected|Expected|position/);
    expect(bad.unavailable_diagnostics.message).toContain("exit_code=0");
    expect(bad.unavailable_diagnostics.message).toContain("captured_output_limited=false");
    expect(state.returnedRefs.has("codex/bad\0stdout")).toBe(false);
    expect(rawBytes(state, bad, "stderr")).toEqual(badStderr);
    expect(good).toMatchObject({ status: "completed", process_outcome: "ok", parse_outcome: "ok" });
    expect(rawBytes(state, good, "stdout")).toEqual(Buffer.from(valid));
    expect(observed.find((member) => member.provider === "codex/bad").parse_outcome).toBe("invalid");
    expect(observed.find((member) => member.provider === "codex/good").status).toBe("completed");
  });

  it("does not claim persisted output when the original byte sink is absent", async () => {
    const state = rawFixture(["codex/good"], `process.stdout.write(${JSON.stringify(directProviderOutput("codex/good", []))});`);
    const result = await runConfiguredOcrHostReview({ request, packet: configuredPacket() }, { trustedContext: state.trustedContext });
    expect(result.provider_results[0]).toMatchObject({ status: "completed", raw_output_ref: null,
      unavailable_diagnostics: { code: "OCR_PROVIDER_RAW_OUTPUT_UNAVAILABLE" } });
    expect(result.provider_results[0].unavailable_diagnostics.message).toContain("raw output sink is absent; output was not persisted");
    expect(state.saved.size).toBe(0);
  });

  it("keeps supervisor spawn diagnostics outside the original provider stderr", async () => {
    const state = rawFixture(["codex/missing"], "");
    state.trustedContext.providerConfig.providers["codex/missing"].command = join(state.root, "missing-executable");
    const result = await runConfiguredOcrHostReview({ request, packet: configuredPacket() }, state);
    const member = result.provider_results[0];
    expect(member).toMatchObject({ status: "failed", process_outcome: "launch_failure", parse_outcome: null, error: { code: "OCR_PROVIDER_SPAWN_FAILED" } });
    expect(member.raw_output_ref).toBeNull();
    expect(member).not.toHaveProperty("evidence_refs");
    expect(member.unavailable_diagnostics.message).toContain("supervisor_diagnostics=ENOENT: OCR provider spawn failed");
    expect(member.unavailable_diagnostics.message).toContain("stdout_bytes=0 not persisted");
    expect(member.unavailable_diagnostics.message).toContain("stderr_bytes=0 not persisted");
    expect(state.saved.size).toBe(0);
  });

  it("records absent raw bytes as unavailable instead of reconstructing them from text", async () => {
    const result = await runConfiguredOcrHostReview({ request, packet: configuredPacket() }, {
      trustedContext: configuredContext(["codex/good"], "/unused/provider"),
      providerExecutor: async () => ({ status: "completed", output: directProviderOutput("codex/good", []) }),
      rawOutputSink: () => { throw new Error("no original bytes should be fabricated"); },
    });
    expect(result.provider_results[0]).toMatchObject({ status: "completed", raw_output_ref: null, unavailable_diagnostics: { code: "OCR_PROVIDER_RAW_OUTPUT_UNAVAILABLE" } });
    expect(result.provider_results[0].unavailable_diagnostics.message).toContain("original provider bytes unavailable");
  });

  it("keeps an active direct native provider past the former 600000ms boundary and preserves raw bytes and a completed sibling", async () => {
    const fastOutput = directProviderOutput("codex/fast", []), activeOutput = directProviderOutput("codex/active", []);
    const state = rawFixture(["codex/fast", "codex/active"], `
const model = process.argv[process.argv.indexOf("--model") + 1];
if (model === "fast") process.stdout.write(${JSON.stringify(fastOutput)});
else {
  process.stdout.write(Buffer.from([0xff, 0x00, 0x61]));
  process.stderr.write(Buffer.from([0xfe, 0x62]));
  process.on("SIGTERM", () => process.exit(0));
  const activity = setInterval(() => process.stderr.write("active tick\\n"), 20);
  setTimeout(() => { clearInterval(activity); process.stdout.write("\\n" + ${JSON.stringify(activeOutput)}); }, 250);
}
`);
    // Local native executables only; wall-clock observation is controlled.
    const realSetTimeout=globalThis.setTimeout, realClearTimeout=globalThis.clearTimeout, realNow=Date.now;
    const start=realNow(), scheduled=[], observed=[], completed=[];
    let now=start, watchdogFired=false;
    const controller=new AbortController();
    const beforeHostDirs=new Set(readdirSync(tmpdir()).filter(name=>name.startsWith("workflowhub-ocr-host-")&&!name.startsWith("workflowhub-ocr-host-test-")));
    Date.now=()=>now;
    globalThis.setTimeout=(callback,delay,...args)=>{
      if(delay===600_000){scheduled.push(delay);return realSetTimeout(callback,1500,...args);}
      return realSetTimeout(callback,delay,...args);
    };
    const watchdog=realSetTimeout(()=>{watchdogFired=true;controller.abort(new Error("owned native lifetime watchdog"));},3500);
    let pending;
    try{
      pending=runConfiguredOcrHostReview({request,packet:configuredPacket(),signal:controller.signal},{...state,healthPollMs:20,
        onProviderHealth:health=>{observed.push(health);if(health.provider==="codex/active"&&health.stdout_bytes>0)now=start+700_000;},
        onProviderResult:member=>completed.push(member),
      });
      const result=await pending, fast=result.provider_results.find(member=>member.provider==="codex/fast"), active=result.provider_results.find(member=>member.provider==="codex/active");
      expect(watchdogFired).toBe(false);expect(scheduled).toEqual([]);
      expect(result.status).toBe("available");
      expect(active).toMatchObject({status:"completed",process_outcome:"ok",parse_outcome:"ok",error:null});
      expect(active.timing.duration_ms).toBeGreaterThanOrEqual(600_000);
      expect(fast).toMatchObject({status:"completed",process_outcome:"ok",parse_outcome:"ok"});
      expect(rawBytes(state,fast,"stdout").equals(Buffer.from(fastOutput))).toBe(true);
      expect(rawBytes(state,active,"stdout").equals(Buffer.concat([Buffer.from([0xff,0x00,0x61]),Buffer.from("\n"+activeOutput)]))).toBe(true);
      const stderr=rawBytes(state,active,"stderr");expect(stderr.subarray(0,2).equals(Buffer.from([0xfe,0x62]))).toBe(true);
      expect(stderr.subarray(2).toString()).toContain("active tick");
      expect(active.execution.health).toMatchObject({status:"completed",liveness:false});
      expect(observed.filter(health=>health.provider==="codex/active"&&health.status==="running"&&health.liveness===true&&health.progress_events>0).length).toBeGreaterThan(2);
      expect(completed.map(member=>member.provider)).toEqual(expect.arrayContaining(["codex/fast","codex/active"]));
      expect(readdirSync(tmpdir()).filter(name=>name.startsWith("workflowhub-ocr-host-")&&!name.startsWith("workflowhub-ocr-host-test-")&&!beforeHostDirs.has(name))).toEqual([]);
      console.log(JSON.stringify({oracle:"direct-native-lifecycle",observed_elapsed_ms:active.timing.duration_ms,direct_deadline_schedules:scheduled.length,
        active_status:active.status,sibling_status:fast.status,watchdog_fired:watchdogFired,real_model_calls:0}));
    }finally{
      realClearTimeout(watchdog);controller.abort(new Error("owned native lifetime cleanup"));
      if(pending)await pending.catch(()=>{});
      Date.now=realNow;globalThis.setTimeout=realSetTimeout;globalThis.clearTimeout=realClearTimeout;
    }
  });

  describe("direct native lifetime cause races", () => {
    async function raceCase(kind) {
      const output=directProviderOutput("codex/race",[]);
      const script=`process.on("SIGTERM",()=>process.exit(0));process.stdout.write(${JSON.stringify(output)});process.stderr.write("owned race stderr\\n");${kind==="late-close"?"setTimeout(()=>process.exit(0),120);":"setInterval(()=>{},100);"}`;
      const state=rawFixture(["codex/race"],script);
      const realNow=Date.now,realSetTimeout=globalThis.setTimeout,realClearTimeout=globalThis.clearTimeout;
      const start=realNow(),controller=new AbortController(),timers=new Set();
      let now=start,scheduled=0,priorCancel=false,watchdogFired=false;
      Date.now=()=>now;
      globalThis.setTimeout=(fn,delay,...args)=>{
        if(delay===600_000){scheduled++;const handle=realSetTimeout(fn,12000,...args);timers.add(handle);return handle;}
        return realSetTimeout(fn,delay,...args);
      };
      const watchdog=realSetTimeout(()=>{watchdogFired=true;controller.abort(new Error("owned native race watchdog"));},3500);
      let pending;
      try{
        pending=runConfiguredOcrHostReview({request,packet:configuredPacket(),signal:controller.signal},{...state,healthPollMs:20,onProviderHealth:health=>{
          if(health.status!=="running"||health.stdout_bytes<Buffer.byteLength(output))return;
          if(kind==="late-close")now=start+700_000;
          if(kind==="cancel"&&!priorCancel){priorCancel=true;now=start+100;controller.abort(new Error("owned earlier explicit cancellation"));now=start+700_000;}
        }});
        const result=await pending,member=result.provider_results[0];
        return{state,member,result,scheduled,priorCancel,watchdogFired,output};
      }finally{
        realClearTimeout(watchdog);controller.abort(new Error("owned native race cleanup"));
        if(pending)await pending.catch(()=>{});
        for(const timer of timers)realClearTimeout(timer);
        Date.now=realNow;globalThis.setTimeout=realSetTimeout;globalThis.clearTimeout=realClearTimeout;
      }
    }
    it("keeps a real late exit0 terminal successful without a direct host deadline",async()=>{
      const{state,member,scheduled,watchdogFired,output}=await raceCase("late-close");
      expect(watchdogFired).toBe(false);expect(scheduled).toBe(0);
      expect(member).toMatchObject({status:"completed",process_outcome:"ok",parse_outcome:"ok",error:null});
      expect(member.timing.duration_ms).toBeGreaterThanOrEqual(600_000);
      expect(rawBytes(state,member,"stdout").equals(Buffer.from(output))).toBe(true);
      expect(rawBytes(state,member,"stderr").equals(Buffer.from("owned race stderr\n"))).toBe(true);
    });
    it("keeps an earlier explicit cancellation when cleanup crosses the former elapsed boundary",async()=>{
      const{state,member,scheduled,priorCancel,watchdogFired,output}=await raceCase("cancel");
      expect(priorCancel).toBe(true);expect(watchdogFired).toBe(false);expect(scheduled).toBe(0);
      expect(member).toMatchObject({status:"cancelled",error:{code:"OCR_PROVIDER_CANCELLED"}});
      expect(member.timing.duration_ms).toBeGreaterThanOrEqual(600_000);
      expect(rawBytes(state,member,"stdout").equals(Buffer.from(output))).toBe(true);
      expect(member.findings).toEqual([]);
    });
  });

});
