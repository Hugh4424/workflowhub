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
const args=process.argv.slice(2),cwd=args[0]==='exec'?args[args.indexOf('-C')+1]:fs.realpathSync(process.cwd());
assert.equal(fs.realpathSync(cwd),fs.realpathSync(process.cwd()));
const adapter=args[0]==='exec'?'codex':args[0]==='run'?'opencode':args.includes('--agent-file')?'kimi':'antigravity';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const session=adapter==='opencode'?'owned-opencode-packet':adapter==='kimi'?'owned-kimi-packet':'owned-ag-packet';
const configs=args.flatMap((arg,index)=>arg==='-c'?[args[index+1]]:[]);
const report={adapter,cwd,pid:process.pid,denied:[],thinkingEffort:process.env.KIMI_MODEL_THINKING_EFFORT,developerInstructions:configs.find(value=>value.startsWith('developer_instructions='))?.slice('developer_instructions='.length),permissionConfig:configs.find(value=>value.startsWith('permissions.wh_ocr='))};
function finished(){if(adapter==='opencode'){fs.appendFileSync(launches,JSON.stringify(report)+'\n');process.stdout.write(JSON.stringify({type:'text',sessionID:session,part:{text:JSON.stringify({findings:[]})}})+'\n');process.stdout.write(JSON.stringify({type:'step_finish',sessionID:session,part:{reason:fs.existsSync(path.join(root,'tool-only'))?'tool-calls':'stop'}})+'\n');if(fs.existsSync(path.join(root,'after-error')))process.stdout.write(JSON.stringify({type:'error',error:{message:'owned native failure'}})+'\n');if(fs.existsSync(path.join(root,'next-tool-turn'))){process.stdout.write(JSON.stringify({type:'step_start'})+'\n');process.stdout.write(JSON.stringify({type:'text',part:{text:JSON.stringify({findings:[]})}})+'\n');process.stdout.write(JSON.stringify({type:'step_finish',part:{reason:'tool-calls'}})+'\n');}return;}fs.appendFileSync(launches,JSON.stringify(report)+'\n');
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
 const alias=path.join(cwd,'owned-unlisted-alias-'+adapter);fs.symlinkSync(outside,alias);
 if(adapter==='antigravity'){
  assert(args.includes('--new-project')&&args.includes('--disable-slash-commands'));
  const config=JSON.parse(fs.readFileSync('.agents/hooks.json','utf8'))['workflowhub-packet-reader'];
  assert.equal(config.PreToolUse[0].matcher,'*');assert.equal(config.PostToolUse[0].matcher,'*');
  const hook=path.join(cwd,'.ocr-ag-guard/hook.cjs');
  function call(phase,name,a,content){const child=spawnSync(process.execPath,[hook,phase],{input:JSON.stringify({conversationId:session,toolCall:{name,args:a},...(phase==='post'?{toolResult:{content}}:{})}),encoding:'utf8',timeout:3000});assert.equal(child.status,0,child.stderr);return JSON.parse(child.stdout);}
  for(const file of ['review-prompt.md','src/reviewed.mjs']){const AbsolutePath=path.join(cwd,file);assert.equal(call('pre','view_file',{AbsolutePath}).decision,'allow');const bytes=fs.readFileSync(AbsolutePath);report[file]=hash(bytes);call('post','view_file',{AbsolutePath},bytes.toString('utf8'));}
  for(const AbsolutePath of [outside,alias,path.join(cwd,'undeclared.txt')]){assert.equal(call('pre','view_file',{AbsolutePath}).decision,'deny');report.denied.push('view:'+AbsolutePath);}
  for(const name of ['write_to_file','run_command','read_url_content','Agent','UnknownTool']){assert.equal(call('pre',name,{}).decision,'deny');report.denied.push(name);}
  assert.equal(fs.existsSync(path.join(cwd,'write-canary.txt')),false);finished();return;
 }
 let config;
 if(adapter==='opencode'){
  assert(args.includes('--pure'));assert(!args.some(arg=>/^--(?:auto|yolo|dangerously-skip-permissions)(?:=|$)/.test(arg)));assert.equal(args[args.indexOf('--agent')+1],'workflowhub-packet-reader');assert.equal(args[args.indexOf('--variant')+1],'max');
  const native=JSON.parse(process.env.OPENCODE_CONFIG_CONTENT);assert.equal(native.permission['*'],'deny');assert.deepEqual(native.agent['workflowhub-packet-reader'].permission,{'*':'deny',bash:'ask',read:'ask',glob:'ask',grep:'ask',card06_packet_Read:'allow'});
  assert.equal(process.env.OPENCODE_DISABLE_PROJECT_CONFIG,'1');assert.equal(process.env.OPENCODE_DISABLE_CLAUDE_CODE,'1');assert.equal(process.env.OPENCODE_DISABLE_MODELS_FETCH,'1');assert.equal(process.env.OPENCODE_DISABLE_DEFAULT_PLUGINS,undefined);
  const local=native.mcp.card06_packet;config={command:local.command[0],args:local.command.slice(1),cwd};
 }else{
 const agent=args[args.indexOf('--agent-file')+1],skills=args[args.indexOf('--skills-dir')+1];
 assert.equal(agent,path.join(cwd,'.ocr-kimi-read/agent.md'));assert(fs.readFileSync(agent,'utf8').includes('tools: [mcp__card06_packet__Read]'));assert.deepEqual(fs.readdirSync(skills),[]);
 config=JSON.parse(fs.readFileSync('.kimi-code/mcp.json','utf8')).mcpServers.card06_packet;
 }
 const child=spawn(config.command,config.args,{cwd:config.cwd,stdio:['pipe','pipe','pipe']});report.mcp_pid=child.pid;
 const waiting=new Map();let next=0,stderr='';child.stderr.on('data',b=>{stderr+=b;});
 const closed=new Promise(resolve=>child.once('close',code=>{for(const waiter of waiting.values())waiter.reject(Error('MCP closed: '+stderr));resolve(code);}));
 readline.createInterface({input:child.stdout}).on('line',line=>{const response=JSON.parse(line),waiter=waiting.get(response.id);if(waiter){waiting.delete(response.id);waiter.resolve(response);}});
 function rpc(method,params){return new Promise((resolve,reject)=>{const id=++next;waiting.set(id,{resolve,reject});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');});}
 const read=async a=>(await rpc('tools/call',{name:'Read',arguments:a})).result;
 const serializedBudget=adapter==='opencode'&&fs.existsSync(path.join(root,'serialized-budget'));
 const kimiLargePage=adapter==='kimi'&&fs.existsSync(path.join(root,'kimi-large-pages'));
 report.maxSerializedResponseBytes=0;report.rawLargePageSeen=false;
 try{
  const init=await rpc('initialize',{protocolVersion:'2024-11-05'});assert(init.result.capabilities.tools);
  const tools=(await rpc('tools/list',{})).result.tools;assert.deepEqual(tools.map(x=>x.name),['Read']);
  for(const file of ['review-prompt.md','src/reviewed.mjs',...(fs.existsSync('diff-index.json')?['diff-index.json']:[])]){
   const original=fs.readFileSync(file),chunks=[];let offset=0,pages=0;
   do{const response=await read({path:file,offset,...(serializedBudget||kimiLargePage?{limit:65536}:{})});assert.equal(response.isError,false);const serializedBytes=Buffer.byteLength(JSON.stringify(response),'utf8');report.maxSerializedResponseBytes=Math.max(report.maxSerializedResponseBytes,serializedBytes);if(serializedBudget)assert(serializedBytes<=16384,'serialized MCP result exceeds native-visible budget: '+serializedBytes);const page=JSON.parse(response.content[0].text),bytes=Buffer.from(page.content);assert.equal(page.offset,offset);assert.equal(page.bytes_returned,bytes.length);if(!serializedBudget&&!kimiLargePage)assert(bytes.length<=16384);if(kimiLargePage&&file==='src/reviewed.mjs'&&offset===0){assert(bytes.length>16384,'Kimi original large page must remain available');report.rawLargePageSeen=true;}assert.equal(page.total_bytes,original.length);assert.equal(page.sha256,hash(original));assert.equal(page.unread_before.bytes,offset);chunks.push(bytes);pages++;if(!page.has_more){assert.equal(page.unread_after.bytes,0);break;}assert(page.next_offset>offset);assert.equal(page.next_offset,offset+bytes.length);offset=page.next_offset;}while(true);
   const joined=Buffer.concat(chunks);assert(joined.equals(original));
   if(serializedBudget){const eof=await read({path:file,offset:original.length,limit:65536});assert.equal(eof.isError,false);assert(Buffer.byteLength(JSON.stringify(eof),'utf8')<=16384);const value=JSON.parse(eof.content[0].text);assert.equal(value.content,'');assert.equal(value.bytes_returned,0);assert.equal(value.has_more,false);assert.equal(value.next_offset,null);assert.equal(value.unread_after.bytes,0);const continuation=original.findIndex(b=>(b&0xc0)===0x80);if(continuation>=0)assert.equal((await read({path:file,offset:continuation})).isError,true);}
   report[file]={bytes:joined.length,sha256:hash(joined),pages};
  }
  for(const input of [outside,'../outside.txt',path.basename(alias),'undeclared.txt']){const response=await read({path:input});assert.equal(response.isError,true);assert(!JSON.stringify(response).includes('OWNED_OUTSIDE_MUST_NOT_BE_READ'));report.denied.push(input);}
  for(const a of [{path:'review-prompt.md',offset:-1},{path:'review-prompt.md',limit:65537}]){assert.equal((await read(a)).isError,true);report.denied.push('invalid-page');}
  for(const name of ['Write','Shell','Web','Agent','UnknownTool']){assert.equal((await rpc('tools/call',{name,arguments:{path:'review-prompt.md'}})).result.isError,true);report.denied.push(name);}
 }finally{child.stdin.end();assert.equal(await closed,0,stderr);}
 if(adapter==='opencode'){finished();return;}
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
        initial: ["codex/luna", "kimi/coding"], mode: "full_only",
      } } },
    }));
    const previousHome = process.env.HOME;
    process.env.HOME = root;
    try {
      const input = { ...request };
      const activeHost=JSON.parse(readFileSync(join(hostDir,"config.json"),"utf8"));
      activeHost.wh_review.stages["build-code"].minimum_heterologous=2;
      writeFileSync(join(hostDir,"config.json"),JSON.stringify(activeHost));
      expect(()=>prepareConfiguredOcrHostContext(input)).toThrow("minimum_heterologous is retired");
      delete activeHost.wh_review.stages["build-code"].minimum_heterologous;
      writeFileSync(join(hostDir,"config.json"),JSON.stringify(activeHost));
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
        initial: ["codex/luna", "kimi/coding"], mode: "full_only",
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
        trustedContext: { ...sameModel, route: { ...sameModel.route } },
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
      expect(result,JSON.stringify(result.provider_results.map(member=>({provider:member.provider,error:member.error,diagnostic:member.unavailable_diagnostics})))).toMatchObject({status:"available",provider_results:[{provider:"antigravity/flash",status:"completed",session_id:"owned-ag-packet",findings:[],parse_outcome:"ok"}]});
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
    trusted: {}, route: { mode: "single_round" },
    selection: { providers, provider_identities: Object.fromEntries(providers.map((provider) =>
      [provider, { source_id: provider + "-source", config_id: provider + "-config" }])) },
    providerConfig: { providers: Object.fromEntries(providers.map((provider) =>
      [provider, { enabled: true, command, model: "test-model" }])) },
  };
}

describe("OCR delegation adapter", () => {
  it("passes configured Kimi thinking effort to the native packet process", async () => {
    const root=realpathSync(mkdtempSync(join(tmpdir(),"workflowhub-kimi-thinking-")));roots.push(root);
    const cli=ownedPacketCli(root),context=configuredContext(["kimi/coding"],cli.executable);
    const nativeHome=join(root,"kimi-home");mkdirSync(nativeHome);mkdirSync(join(nativeHome,"workspace-trust"));
    const previous=process.env.KIMI_CODE_HOME;process.env.KIMI_CODE_HOME=nativeHome;
    try {
      context.providerConfig.providers["kimi/coding"].thinking=true;
      context.providerConfig.providers["kimi/coding"].effort="max";
      const result=await runConfiguredOcrHostReview({request,packet:configuredPacket()},{trustedContext:context});
      expect(result.provider_results[0].status).toBe("completed");
      const launches=readFileSync(cli.launches,"utf8").trim().split("\n").map(JSON.parse);
      expect(launches[0].thinkingEffort).toBe("max");
      context.providerConfig.providers["kimi/coding"].thinking=false;
      const conflict=await runConfiguredOcrHostReview({request,packet:configuredPacket()},{trustedContext:context});
      expect(conflict.provider_results[0]).toMatchObject({status:"failed",error:{code:"OCR_PROVIDER_CONFIG_INVALID"}});
      expect(readFileSync(cli.launches,"utf8").trim().split("\n")).toHaveLength(1);
    }finally{if(previous===undefined)delete process.env.KIMI_CODE_HOME;else process.env.KIMI_CODE_HOME=previous;}
  });

  it("rejects OpenCode approval flags configured as model or effort before dispatch", async () => {
    const root=realpathSync(mkdtempSync(join(tmpdir(),"workflowhub-opencode-flags-")));roots.push(root);
    const executable=join(root,"native-marker"),marker=join(root,"spawned");
    writeFileSync(executable,`#!/usr/bin/env node\nrequire("node:fs").writeFileSync(${JSON.stringify(marker)},"ran");\n`,{mode:0o700});
    for(const flag of ["--auto","--yolo","--dangerously-skip-permissions","--auto=true"])for(const field of ["model","effort"]) {
      const context=configuredContext(["opencode/reviewer"],executable);
      context.providerConfig.providers["opencode/reviewer"][field]=flag;
      const result=await runConfiguredOcrHostReview({request,packet:configuredPacket()},{trustedContext:context});
      expect(result.provider_results[0]).toMatchObject({status:"failed",error:{code:"OCR_PROVIDER_CONFIG_INVALID"}});
      expect(existsSync(marker)).toBe(false);
    }
  });

  it("runs OpenCode through the exact packet MCP reader with max effort and audited denial", async () => {
    const root=realpathSync(mkdtempSync(join(tmpdir(),"workflowhub-owned-opencode-")));roots.push(root);
    const cli=ownedPacketCli(root),context=configuredContext(["opencode/reviewer"],cli.executable);
    context.providerConfig.providers["opencode/reviewer"].effort="max";
    const result=await runConfiguredOcrHostReview({request,packet:configuredPacket()},{trustedContext:context});
    expect(result).toMatchObject({status:"available",provider_results:[{status:"completed",session_id:"owned-opencode-packet",findings:[],parse_outcome:"ok",execution:{effort:"max"}}]});
    const launch=JSON.parse(readFileSync(cli.launches,"utf8").trim());
    expect(launch.denied).toEqual(expect.arrayContaining(["../outside.txt","undeclared.txt","Write","Shell","Web","Agent","UnknownTool"]));
    expect(existsSync(launch.cwd)).toBe(false);
    const nativeHome=join(root,"kimi-home");mkdirSync(nativeHome);mkdirSync(join(nativeHome,"workspace-trust"));
    const previous=process.env.KIMI_CODE_HOME;process.env.KIMI_CODE_HOME=nativeHome;
    try {
      const mixedContext=configuredContext(["kimi/coding","opencode/reviewer"],cli.executable);
      mixedContext.providerConfig.providers["opencode/reviewer"].effort="max";
      const mixed=await runConfiguredOcrHostReview({request,packet:configuredPacket()},{trustedContext:mixedContext});
      expect(mixed).toMatchObject({status:"available",provider_results:[{provider:"kimi/coding",status:"completed"},{provider:"opencode/reviewer",status:"completed"}]});
    } finally {if(previous === undefined)delete process.env.KIMI_CODE_HOME;else process.env.KIMI_CODE_HOME=previous;}
    writeFileSync(join(root,"tool-only"),"");
    const toolOnly=await runConfiguredOcrHostReview({request,packet:configuredPacket()},{trustedContext:context});
    expect(toolOnly.provider_results[0]).toMatchObject({status:"failed",error:{code:"OCR_PROVIDER_OUTPUT_INVALID"}});
    rmSync(join(root,"tool-only"));
    for(const marker of ["after-error","next-tool-turn"]) {
      writeFileSync(join(root,marker),"");
      const invalid=await runConfiguredOcrHostReview({request,packet:configuredPacket()},{trustedContext:context});
      expect(invalid.provider_results[0]).toMatchObject({status:"failed",error:{code:"OCR_PROVIDER_OUTPUT_INVALID"}});
      rmSync(join(root,marker));
    }
    writeFileSync(cli.skipGuard,"");
    const rejected=await runConfiguredOcrHostReview({request,packet:configuredPacket()},{trustedContext:context});
    expect(rejected.provider_results[0]).toMatchObject({status:"failed",error:{code:"OCR_PROVIDER_PACKET_GUARD_FAILED"}});
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
      error: { code: "OCR_DELEGATION_UNAVAILABLE", message: "host OCR delegation executor is unavailable; no substituted executor was used" },
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


it("presents the Codex packet exception as developer instructions without changing native permissions", async () => {
  const root=realpathSync(mkdtempSync(join(tmpdir(),"workflowhub-codex-exception-")));roots.push(root);
  const cli=ownedPacketCli(root);
  const result=await runConfiguredOcrHostReview({request,packet:configuredPacket()},
    {trustedContext:configuredContext(["codex/luna"],cli.executable)});
  expect(result.provider_results[0].status).toBe("completed");
  const report=JSON.parse(readFileSync(cli.launches,"utf8").trim().split("\n").at(-1));
  expect(report.developerInstructions).toBeTypeOf("string");
  const instruction=JSON.parse(report.developerInstructions);
  expect(instruction).toContain(`the exact packet root ${report.cwd} has an explicit read-only grant`);
  expect(instruction).toContain("This narrower grant overrides its broader denied TMPDIR parent for this packet only");
  expect(instruction).toContain("The parent denial still applies to all other temporary files");
  expect(instruction).toContain("no writes, no network and no escalation remain unchanged");
  expect(instruction).toContain("preserve any actual tool denial as an error");
  expect(instruction).toContain("This text grants no additional OS permission");
  console.log(JSON.stringify({oracle:"codex-developer-exception-host-injection",developer_instruction_utf8_bytes:Buffer.byteLength(instruction,"utf8"),serialized_config_utf8_bytes:Buffer.byteLength("developer_instructions="+report.developerInstructions,"utf8"),boundary:"controlled native CLI argv readback; not model behavior or old static-method budget"}));
  expect(report.permissionConfig).toBe('permissions.wh_ocr={filesystem={":root"="deny",":minimal"="read",":tmpdir"="deny",":slash_tmp"="deny",'
    +JSON.stringify(report.cwd)+'="read"},network={enabled=false}}');
});


it.each([
  ["empty file", ""],
  ["large ASCII", "a".repeat(180000)],
  ["multibyte UTF8", "汉字🙂é\n".repeat(18000)],
  ["JSON escaping", String.fromCharCode(34,92,10,13,9,8,12).repeat(22000)],
])("bounds the complete OpenCode serialized page and reconstructs %s exactly", async (_kind,content) => {
  const root=realpathSync(mkdtempSync(join(tmpdir(),"workflowhub-oc-response-budget-")));roots.push(root);
  const cli=ownedPacketCli(root),context=configuredContext(["opencode/reviewer"],cli.executable);
  context.providerConfig.providers["opencode/reviewer"].effort="max";
  writeFileSync(join(root,"serialized-budget"),"");
  const result=await runConfiguredOcrHostReview({request,packet:configuredPacket(content)},{trustedContext:context});
  expect(result.provider_results[0].status,JSON.stringify(result.provider_results[0].error)).toBe("completed");
  const report=JSON.parse(readFileSync(cli.launches,"utf8").trim().split("\n").at(-1));
  expect(report.maxSerializedResponseBytes).toBeLessThanOrEqual(16384);
  expect(report["src/reviewed.mjs"].bytes).toBe(Buffer.byteLength(content));
  expect(report["src/reviewed.mjs"].sha256).toBe(createHash("sha256").update(content).digest("hex"));
  if(!content.length)expect(report["src/reviewed.mjs"].pages).toBe(1);
  if(content.length)expect(report["src/reviewed.mjs"].pages).toBeGreaterThan(1);
  expect(report.denied).toEqual(expect.arrayContaining(["../outside.txt","undeclared.txt","Write","Shell","Web","Agent","UnknownTool"]));
});

it("preserves Kimi original large-page MCP contract beside the OpenCode serialized budget", async () => {
  const root=realpathSync(mkdtempSync(join(tmpdir(),"workflowhub-kimi-original-pages-")));roots.push(root);
  const cli=ownedPacketCli(root),context=configuredContext(["kimi/coding"],cli.executable);
  const nativeHome=join(root,"kimi-home");mkdirSync(nativeHome);mkdirSync(join(nativeHome,"workspace-trust"));
  const prior=process.env.KIMI_CODE_HOME;process.env.KIMI_CODE_HOME=nativeHome;writeFileSync(join(root,"kimi-large-pages"),"");
  try {
    const result=await runConfiguredOcrHostReview({request,packet:configuredPacket("k".repeat(120000))},{trustedContext:context});
    expect(result.provider_results[0].status,JSON.stringify(result.provider_results[0].error)).toBe("completed");
    const report=JSON.parse(readFileSync(cli.launches,"utf8").trim().split("\n").at(-1));
    expect(report.rawLargePageSeen).toBe(true);
    expect(report.maxSerializedResponseBytes).toBeGreaterThan(16384);
    expect(report["src/reviewed.mjs"].bytes).toBe(120000);
    expect(report["src/reviewed.mjs"].pages).toBeGreaterThan(1);
  } finally {if(prior===undefined)delete process.env.KIMI_CODE_HOME;else process.env.KIMI_CODE_HOME=prior;}
});

// P4 additive TCR 447/448. Reconstructed wrapper, never captured native stdin.
// The owned CLI consumes installed configuration commands; host inspect is real.
function p4NativeConsumerCli(root, mode, shape = "native") {
  const executable = join(root, "p4-native-consumer"), reportPath = join(root, "report.json");
  writeFileSync(executable, String.raw`#!/usr/bin/env node
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const root=${JSON.stringify(root)},mode=${JSON.stringify(mode)},shape=${JSON.stringify(shape)},reportPath=${JSON.stringify(reportPath)};
const cwd=fs.realpathSync(process.cwd()),session='p4-reconstructed-wrapper',args=process.argv.slice(2);
const config=JSON.parse(fs.readFileSync(path.join(cwd,'.agents/hooks.json'),'utf8'))['workflowhub-packet-reader'];
const report={cwd,calls:[],prompt:args[args.indexOf('-p')+1]};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function payload(file,extra={}){return shape==='legacy'?{conversationId:session,toolCall:{name:'view_file',args:{AbsolutePath:file,...extra}}}:shape==='top'?{conversationId:session,tool_name:'read_file',tool_info:{name:'read_file',parameters:{Path:file,...extra}}}:{conversationId:session,toolCall:{name:'read_file',args:{Path:file,...extra}}};}
function hook(phase,value){const entries=config[phase==='pre'?'PreToolUse':'PostToolUse'];if(entries.length!==1||entries[0].matcher!=='*')throw Error('installed match-all hook missing');const hooks=entries[0].hooks;if(hooks.length!==1||hooks[0].type!=='command')throw Error('installed command missing');const child=spawnSync('/bin/sh',['-c',hooks[0].command],{cwd,input:typeof value==='string'?value:JSON.stringify(value),encoding:'utf8',timeout:3000});if(child.status!==0)throw Error('installed hook did not emit decision: '+child.stderr);const response=JSON.parse(child.stdout);report.calls.push({phase,payload:value,response});return response;}
function finish(){fs.writeFileSync(reportPath,JSON.stringify(report));process.stdout.write(JSON.stringify({event:'init',conversation_id:session})+'\n');process.stdout.write(JSON.stringify({event:'result',result:{conversation_id:session,status:'SUCCESS',response:JSON.stringify({findings:[]})}})+'\n');}
const prompt=path.join(cwd,'review-prompt.md'),source=path.join(cwd,'src/reviewed.mjs');
function read(file,kind='complete'){
 const pre=payload(file,kind==='range-mismatch'?{StartLine:1,EndLine:2}:{});
 if(kind!=='unmatched-post'&&hook('pre',pre).decision!=='allow')return false;
 const bytes=fs.readFileSync(file);report[path.relative(cwd,file)]={sha256:hash(bytes),bytes:bytes.length};
 if(kind==='pre-only')return true;
 const post=payload(file,kind==='range-mismatch'?{StartLine:2,EndLine:3}:{});
 if(kind==='wrong-session')post.conversationId='different-session';
 if(kind!=='absent-content')post.toolResult={content:kind==='partial'?bytes.toString('utf8').slice(0,5):bytes.toString('utf8')};
 if(kind==='tool-error')post.error='owned tool failure';
 if(kind==='changed-after-pre'){fs.chmodSync(file,0o600);fs.writeFileSync(file,'changed after pre');}
 hook('post',post);return true;
}
if(mode==='safety'){
 // These payloads exercise the installed guard, never a copied normalizer.
 const outside=path.join(root,'outside.txt');fs.writeFileSync(outside,'outside');
 const alias=path.join(cwd,'p4-file-alias'),ancestor=path.join(cwd,'p4-parent-alias');
 fs.symlinkSync(source,alias);fs.symlinkSync(path.join(cwd,'src'),ancestor);
 const hardlink=path.join(root,'hardlink');fs.linkSync(source,hardlink);
 const denied=[payload(source),payload(outside),payload(alias),payload(path.join(ancestor,'reviewed.mjs')),payload(path.join(cwd,'undeclared.txt')),payload(cwd),payload(cwd+'/src/../src/reviewed.mjs'),payload('review-prompt.md'),{},'{bad json',payload(prompt)];
 denied[denied.length-1].toolCall={name:'run_command',args:{Path:prompt,AbsolutePath:prompt}};
 const conflict=payload(prompt);conflict.tool_name='run_command';conflict.tool_info={parameters:{Path:outside}};denied.push(conflict);
 const pathConflict=payload(prompt);pathConflict.toolCall={name:'read_file',args:{Path:prompt,AbsolutePath:outside}};denied.push(pathConflict);
 for(const p of denied)hook('pre',p);
 fs.unlinkSync(hardlink);
 fs.chmodSync(source,0o600);fs.writeFileSync(source,'changed frozen source');hook('pre',payload(source));
 finish();
}else{
 const kind=mode==='complete'||mode==='source-partial'?'complete':mode;
 if(read(prompt,kind)&&!['pre-only','absent-content','partial','tool-error','unmatched-post','wrong-session','range-mismatch','changed-after-pre'].includes(mode))read(source,mode==='source-partial'?'partial':'complete');
 finish();
}
`, { mode: 0o700 });
  return { executable, reportPath };
}

async function p4RunNativeConsumer(mode, shape = "native") {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p4-native-consumer-"))); roots.push(root);
  const cli = p4NativeConsumerCli(root, mode, shape), raw = new Map();
  mkdirSync(join(root, "quality", "reviews"), { recursive: true });
  const result = await runConfiguredOcrHostReview({ request: { ...request, stage: "verify-code", review_scope: null, phase_id: null }, packet: configuredPacket() }, {
    trustedContext: configuredContext(["antigravity/flash"], cli.executable),
    rawOutputSink: async (_hint, bytes, meta) => {
      const saved = await appendRecord(join(root, "quality", "reviews"), meta.stream, "output", bytes);
      raw.set(meta.stream, readFileSync(saved)); return relative(root, saved).split("\\").join("/");
    },
  });
  expect(existsSync(cli.reportPath), JSON.stringify(result)).toBe(true);
  return { result, raw, report: JSON.parse(readFileSync(cli.reportPath, "utf8")) };
}

describe("P4 native OCR consumer additive TCR", () => {
  for (const shape of ["native", "top", "legacy"]) it(`installed pre/post audit and inspect accept ${shape} frozen reads`, async () => {
    const { result, raw, report } = await p4RunNativeConsumer("complete", shape);
    const first = report.calls[0];
    // Target RED must be this decision from the actual installed production hook.
    expect(first.response.decision, JSON.stringify(first)).toBe("allow");
    expect(first.response.permissionOverrides).toEqual([`read_file(${join(report.cwd, "review-prompt.md")})`]);
    expect(result.provider_results[0], JSON.stringify(result)).toMatchObject({ status: "completed", parse_outcome: "ok" });
    expect(result.provider_results[0].material_coverage.read).toContain("src/reviewed.mjs");
    const audit = raw.get("native-audit").toString("utf8").trim().split("\n").map(JSON.parse);
    for (const file of ["review-prompt.md", "src/reviewed.mjs"]) {
      expect(audit).toContainEqual(expect.objectContaining({ phase: "pre", tool: shape === "legacy" ? "view_file" : "read_file", path: file, decision: "allow", sha256: report[file].sha256 }));
      expect(audit).toContainEqual(expect.objectContaining({ phase: "post", path: file, sha256: report[file].sha256, full_file_result: true }));
    }
    if (shape === "native") {
      expect(report.prompt).toContain("read_file"); expect(report.prompt).toContain("Path");
      expect(report.prompt).not.toContain("Use only view_file");
    }
  }, 15000);

  for (const mode of ["pre-only", "absent-content", "partial", "tool-error", "unmatched-post", "wrong-session", "range-mismatch", "changed-after-pre"]) {
    it(`installed post/inspect cannot confirm ${mode} prompt`, async () => {
      // Legacy isolates full-read enforcement from the new wrapper acceptance.
      const { result, report } = await p4RunNativeConsumer(mode, "legacy");
      expect(report.calls.length).toBeGreaterThan(0);
      expect(result.provider_results[0]).toMatchObject({ status: "failed", error: { code: "OCR_PROVIDER_PACKET_GUARD_FAILED" } });
      expect(result.provider_results[0].material_coverage.read).toEqual([]);
    }, 15000);
  }
  it("installed inspect keeps a partial member out after complete prompt", async () => {
    const { result } = await p4RunNativeConsumer("source-partial", "legacy");
    expect(result.provider_results[0]).toMatchObject({ status: "completed", parse_outcome: "ok" });
    expect(result.provider_results[0].material_coverage.read).not.toContain("src/reviewed.mjs");
  }, 15000);
  for (const shape of ["legacy", "native"]) it(`installed ${shape} guard denies exact-manifest and illegal-input failures`, async () => {
    const { report } = await p4RunNativeConsumer("safety", shape);
    expect(report.calls).toHaveLength(14);
    for (const call of report.calls) {
      expect(call.response.decision, JSON.stringify(call)).toBe("deny");
      expect(call.response.permissionOverrides).toBeUndefined();
    }
  }, 15000);
});

// Same-source P4 review finding: a structurally valid denied tool is not a
// handler failure. Keep malformed known reads and wrapper conflicts distinct.
async function p4RunAfterConfirmedRead(attempt) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p4-top-denial-"))); roots.push(root);
  const cli = p4NativeConsumerCli(root, "complete", "native"), raw = new Map();
  const script = readFileSync(cli.executable, "utf8");
  const probe = attempt === "unknown"
    ? `{conversationId:session,tool_name:'UnknownTool',tool_info:{name:'UnknownTool',parameters:{}}}`
    : attempt === "malformed-read"
      ? `{conversationId:session,tool_name:'read_file',tool_info:{name:'read_file',parameters:{Path:17}}}`
      : `{conversationId:session,toolCall:{name:'read_file',args:{Path:prompt}},tool_name:'view_file',tool_info:{name:'view_file',parameters:{Path:source}}}`;
  expect(script.split("function finish(){")).toHaveLength(2);
  writeFileSync(cli.executable, script.replace("function finish(){", `function finish(){hook('pre',${probe});`));
  mkdirSync(join(root, "quality", "reviews"), { recursive: true });
  const result = await runConfiguredOcrHostReview({ request: { ...request, stage: "verify-code", review_scope: null, phase_id: null }, packet: configuredPacket() }, {
    trustedContext: configuredContext(["antigravity/flash"], cli.executable),
    rawOutputSink: async (_hint, bytes, meta) => {
      const saved = await appendRecord(join(root, "quality", "reviews"), meta.stream, "output", bytes);
      raw.set(meta.stream, readFileSync(saved)); return relative(root, saved).split("\\").join("/");
    },
  });
  expect(existsSync(cli.reportPath), JSON.stringify(result)).toBe(true);
  const report = JSON.parse(readFileSync(cli.reportPath, "utf8"));
  const audit = raw.get("native-audit").toString("utf8").trim().split("\n").map(JSON.parse);
  // Prove both actual full post reads preceded the denied tool in this session.
  for (const file of ["review-prompt.md", "src/reviewed.mjs"]) {
    expect(audit).toContainEqual(expect.objectContaining({ phase: "pre", path: file, decision: "allow", sha256: report[file].sha256 }));
    expect(audit).toContainEqual(expect.objectContaining({ phase: "post", path: file, full_file_result: true, sha256: report[file].sha256 }));
  }
  const denied = report.calls.at(-1);
  expect(denied.response.decision, JSON.stringify(denied)).toBe("deny");
  expect(denied.response.permissionOverrides).toBeUndefined();
  return { result, audit, report };
}

describe("P4 top unknown tool after confirmed full read", () => {
  it("ordinary denial preserves audit and host inspected complete reads", async () => {
    const { result, audit } = await p4RunAfterConfirmedRead("unknown");
    const denied = audit.at(-1);
    // Target RED: production currently marks this ordinary denial as error.
    expect(denied.error, JSON.stringify({ denied, provider: result.provider_results[0] })).toBeNull();
    expect(denied).toMatchObject({ phase: "pre", tool: "UnknownTool", decision: "deny", path: null });
    expect(result.provider_results[0], JSON.stringify(result)).toMatchObject({ status: "completed", parse_outcome: "ok" });
    expect(result.provider_results[0].material_coverage.read).toContain("src/reviewed.mjs");
    expect(result.provider_results[0].coverage.read_confirmed).toBe(true);
  }, 15000);
  for (const attempt of ["malformed-read", "conflicting-wrappers"]) it(`${attempt} stays strict and invalidates handler session`, async () => {
    const { result, audit } = await p4RunAfterConfirmedRead(attempt);
    expect(typeof audit.at(-1).error).toBe("string");
    expect(audit.at(-1).error.length).toBeGreaterThan(0);
    expect(result.provider_results[0]).toMatchObject({ status: "failed", error: { code: "OCR_PROVIDER_PACKET_GUARD_FAILED" } });
    expect(result.provider_results[0].material_coverage.read).toEqual([]);
  }, 15000);
});

import { homedir as p4TranscriptHome } from "node:os";

// 554/561 independent oracle: actual configured hook commands and host inspect,
// controlled native-shape log. This constructs display input, never parses it.
function p4TranscriptCli(root, scenario) {
  const executable = join(root, "p4-transcript-cli"), reportPath = join(root, "report.json");
  const session = root.split("/").at(-1);
  const sessionRoot = join(p4TranscriptHome(), ".gemini", "antigravity-cli", "brain", session);
  // Non-recursive creation proves ownership; EEXIST never registers cleanup.
  mkdirSync(sessionRoot, { mode: 0o700 });
  roots.push(sessionRoot);
  writeFileSync(executable, String.raw`#!/usr/bin/env node
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const root=${JSON.stringify(root)},scenario=${JSON.stringify(scenario)},session=${JSON.stringify(session)},artifact=${JSON.stringify(sessionRoot)},reportPath=${JSON.stringify(reportPath)};
const cwd=fs.realpathSync(process.cwd()),config=JSON.parse(fs.readFileSync(path.join(cwd,'.agents/hooks.json'),'utf8'))['workflowhub-packet-reader'];
const logs=path.join(artifact,'.system_generated','logs');fs.mkdirSync(logs,{recursive:true,mode:0o700});
let transcript=path.join(logs,'transcript_full.jsonl');
if(scenario==='foreign-path')transcript=path.join(root,'transcript_full.jsonl');
if(scenario==='foreign-session')transcript=path.join(artifact,'other-session','transcript_full.jsonl');
fs.mkdirSync(path.dirname(transcript),{recursive:true});
const report={session,artifact,transcript,calls:[],files:{},rows:[]};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function hook(phase,payload){const group=config[phase==='pre'?'PreToolUse':'PostToolUse'];if(group.length!==1||group[0].matcher!=='*')throw Error('installed match-all config absent');const hooks=group[0].hooks;if(hooks.length!==1||hooks[0].type!=='command')throw Error('installed command absent');const child=spawnSync('/bin/sh',['-c',hooks[0].command],{cwd,input:JSON.stringify(payload),encoding:'utf8',timeout:3000});if(child.status!==0)throw Error('installed hook execution failed '+child.stderr);const response=JSON.parse(child.stdout);report.calls.push({phase,payload,response});return response;}
const mixedScenario=['mixed-byte-line','mixed-gap','mixed-overlap','mixed-duplicate','mixed-reordered'].includes(scenario);
const bytePageScenario=['byte-pages','byte-gap','byte-overlap','byte-duplicate','byte-wrong-total','byte-missing','byte-implicit-partial','byte-explicit-partial'].includes(scenario)||mixedScenario;
const pagedLineScenario=['paged-prompt','paged-single-line'].includes(scenario);
const rows=[];
for(const [index,file]of ['review-prompt.md','src/reviewed.mjs'].entries()){
 const full=path.join(cwd,file),bytes=fs.readFileSync(full),text=bytes.toString('utf8');
 let lines=text.split('\n');if(text.endsWith('\n'))lines.pop();
 const promptPageEnd=mixedScenario?lines.length:scenario==='paged-single-line'?1:Math.ceil(lines.length/2),step=index===1&&(pagedLineScenario||bytePageScenario)?(mixedScenario?10:6):index*2+2;
 const started=new Date().toISOString();
 const common={artifactDirectoryPath:artifact,conversationId:session,modelName:'test-model',stepIdx:step,transcriptPath:transcript,workspacePaths:[cwd],toolCall:{name:'read_file',args:{Path:full,...(index===0&&(pagedLineScenario||mixedScenario)?{StartLine:1,EndLine:promptPageEnd}:{}),...(index===0&&scenario==='byte-explicit-partial'?{StartLine:2,EndLine:lines.length}:{} )}}};
 if(index===1&&scenario==='ranged')Object.assign(common.toolCall.args,{StartLine:2,EndLine:2});
 if(hook('pre',common).decision!=='allow')throw Error('positive installed pre denied');
 const completed=new Date().toISOString();
 const post=JSON.parse(JSON.stringify(common));post.error='';
 if(index===1&&scenario==='post-step-mismatch')post.stepIdx=step+20;
 if(index===1&&scenario==='post-session-mismatch')post.conversationId='other-session';
 if(index===1&&scenario==='post-path-mismatch')post.toolCall.args.Path=path.join(cwd,'review-prompt.md');
 hook('post',post);
 const displayStart=index===0&&(scenario==='byte-implicit-partial'||scenario==='byte-explicit-partial')?2:1,displayEnd=index===0&&(pagedLineScenario||mixedScenario)?promptPageEnd:lines.length;
 let shown=lines.slice(displayStart-1,displayEnd).map((line,i)=>(displayStart+i)+': '+line);
 let title='Showing lines '+displayStart+'-'+displayEnd+' of '+lines.length;
 let body=shown.join('\n'),byteStart=null,displayBytes=null;
 if(index===0&&bytePageScenario){
  displayBytes=Buffer.from(body);
  byteStart=displayBytes.length>46080?46080:Math.max(1,Math.floor(displayBytes.length/2));
  while(byteStart>0&&byteStart<displayBytes.length&&(displayBytes[byteStart]&0xc0)===0x80)byteStart--;
  title='Partial read (lines '+displayStart+'-'+displayEnd+' of '+lines.length+'). Showing bytes 0-'+byteStart+' of '+displayBytes.length+' in this line range, truncated at the '+byteStart+'-byte limit. To read the rest of this line range, call this tool again with the same StartLine and EndLine and ByteOffset='+byteStart+'.';
  body=displayBytes.subarray(0,byteStart).toString();
 }
 if(index===1){
  if(scenario==='partial-range')title='Showing lines 2-'+lines.length+' of '+lines.length;
  if(scenario==='wrong-total')title='Showing lines 1-'+lines.length+' of '+(lines.length+1);
  if(scenario==='missing-line')shown.splice(1,1);
  if(scenario==='duplicate-line')shown.splice(1,0,shown[0]);
  if(scenario==='reordered-line')shown.reverse();
  if(scenario==='char-changed')shown[0]+='X';
  if(scenario==='line-truncated')shown[0]=shown[0].slice(0,-1);
  if(scenario==='prefix')shown.unshift('Unrecognized native format');
  if(scenario==='suffix')shown.push('Unrecognized native trailer');
 }
 if(!(index===0&&bytePageScenario))body=shown.join('\n');
 const content='Created At: '+started+'\nCompleted At: '+(index===1&&scenario==='bad-time'?'2000-01-01T00:00:00Z':completed)+'\n'+title+'\n'+body;
 const call={step_index:step-1,source:'MODEL',type:'PLANNER_RESPONSE',status:'DONE',created_at:started,tool_calls:[{name:'read_file',args:{Path:full,...(index===1&&scenario==='ranged'?{StartLine:2,EndLine:2}:{}),...(index===0&&(pagedLineScenario||mixedScenario)?{StartLine:1,EndLine:promptPageEnd}:{}),...(index===0&&scenario==='byte-explicit-partial'?{StartLine:2,EndLine:lines.length}:{})}}]};
 const result={step_index:step,source:'MODEL',type:'GENERIC',status:'DONE',created_at:started,content};
 if(index===1){
  if(scenario==='wrong-step')result.step_index=step+10;
  if(scenario==='wrong-tool')call.tool_calls[0].name='run_command';
  if(scenario==='wrong-path')call.tool_calls[0].args.Path=path.join(cwd,'review-prompt.md');
  if(scenario==='double-call')call.tool_calls.push({name:'read_file',args:{Path:full}});
  if(scenario==='explicit-truncated')result.truncated_fields=['content'];
  if(scenario==='error-result')result.status='ERROR';
  if(scenario==='final-marker'){result.type='PLANNER_RESPONSE';result.content='{"marker":"not-a-tool-result"}';}
  if(scenario==='unknown-body')result.content={text:content};
  if(scenario==='wrong-source')result.source='USER_EXPLICIT';
 }
 rows.push(call,result);
 if(index===1&&scenario==='duplicate-step')rows.push({...result});
 report.files[file]={sha256:hash(bytes),bytes:bytes.length,logical_lines:lines.length,display_row_sha256:hash(Buffer.from(JSON.stringify(result)+'\n'))};
 if(index===0&&pagedLineScenario){
  const secondStart=promptPageEnd+1,secondEnd=lines.length,secondStep=4,secondStarted=new Date().toISOString();
  const secondCommon={artifactDirectoryPath:artifact,conversationId:session,modelName:'test-model',stepIdx:secondStep,transcriptPath:transcript,workspacePaths:[cwd],toolCall:{name:'read_file',args:{Path:full,StartLine:secondStart,EndLine:secondEnd}}};
  if(hook('pre',secondCommon).decision!=='allow')throw Error('positive installed paged pre denied');
  const secondPost=JSON.parse(JSON.stringify(secondCommon));secondPost.error='';hook('post',secondPost);
  const secondContent='Created At: '+secondStarted+'\nCompleted At: '+new Date().toISOString()+'\nShowing lines '+secondStart+'-'+secondEnd+' of '+lines.length+'\n'+lines.slice(secondStart-1,secondEnd).map((line,i)=>(secondStart+i)+': '+line).join('\n');
  const secondCall={step_index:secondStep-1,source:'MODEL',type:'PLANNER_RESPONSE',status:'DONE',created_at:secondStarted,tool_calls:[{name:'read_file',args:{Path:full,StartLine:secondStart,EndLine:secondEnd}}]};
  const secondResult={step_index:secondStep,source:'MODEL',type:'GENERIC',status:'DONE',created_at:secondStarted,content:secondContent};
  rows.push(secondCall,secondResult);report.files[file].display_row_sha256=hash(Buffer.from(JSON.stringify(secondResult)+'\n'));
 }
 if(index===0&&mixedScenario){
  let cursor=0,mixedStart=1;
  for(let lineIndex=0;lineIndex<lines.length;lineIndex++){
   const lineBytes=Buffer.byteLength((lineIndex+1)+': '+lines[lineIndex]);
   if(byteStart<=cursor+lineBytes){mixedStart=lineIndex+1;break;}
   cursor+=lineBytes+(lineIndex<lines.length-1?1:0);
  }
  if(scenario==='mixed-gap')mixedStart=Math.min(lines.length, mixedStart+1);
  if(scenario==='mixed-overlap')mixedStart=Math.max(1, mixedStart-1);
  const addLogicalPage=(pageStart,pageEnd,pageStep)=>{
   const secondStarted=new Date().toISOString(),secondCommon={artifactDirectoryPath:artifact,conversationId:session,modelName:'test-model',stepIdx:pageStep,transcriptPath:transcript,workspacePaths:[cwd],toolCall:{name:'read_file',args:{Path:full,StartLine:pageStart,EndLine:pageEnd}}};
   if(hook('pre',secondCommon).decision!=='allow')throw Error('positive installed mixed line-page pre denied');
   const secondPost=JSON.parse(JSON.stringify(secondCommon));secondPost.error='';hook('post',secondPost);
   const secondContent='Created At: '+secondStarted+'\nCompleted At: '+new Date().toISOString()+'\nShowing lines '+pageStart+'-'+pageEnd+' of '+lines.length+'\n'+lines.slice(pageStart-1,pageEnd).map((line,i)=>(pageStart+i)+': '+line).join('\n');
   const secondCall={step_index:pageStep-1,source:'MODEL',type:'PLANNER_RESPONSE',status:'DONE',created_at:secondStarted,tool_calls:[{name:'read_file',args:{Path:full,StartLine:pageStart,EndLine:pageEnd}}]};
   const secondResult={step_index:pageStep,source:'MODEL',type:'GENERIC',status:'DONE',created_at:secondStarted,content:secondContent};
   rows.push(secondCall,secondResult);report.files[file].display_row_sha256=hash(Buffer.from(JSON.stringify(secondResult)+'\n'));
  };
  addLogicalPage(mixedStart,lines.length,4);
  if(scenario==='mixed-duplicate')addLogicalPage(mixedStart,lines.length,6);
  if(scenario==='mixed-reordered')addLogicalPage(1,Math.max(1,mixedStart-1),6);
 }
 if(index===0&&bytePageScenario&&scenario!=='byte-missing'&&!mixedScenario){
  const secondOffset=scenario==='byte-gap'?byteStart+1:scenario==='byte-overlap'?byteStart-1:scenario==='byte-duplicate'?0:byteStart;
  const secondStarted=new Date().toISOString(),secondStep=4,secondCommon={artifactDirectoryPath:artifact,conversationId:session,modelName:'test-model',stepIdx:secondStep,transcriptPath:transcript,workspacePaths:[cwd],toolCall:{name:'read_file',args:{Path:full,StartLine:displayStart,EndLine:displayEnd,ByteOffset:secondOffset}}};
  if(hook('pre',secondCommon).decision!=='allow')throw Error('positive installed byte-page pre denied');
  const secondPost=JSON.parse(JSON.stringify(secondCommon));secondPost.error='';hook('post',secondPost);
  const secondTitle='Partial read (lines '+displayStart+'-'+displayEnd+' of '+lines.length+'). Showing bytes '+secondOffset+'-'+displayBytes.length+' of '+(scenario==='byte-wrong-total'?displayBytes.length+1:displayBytes.length)+' in this line range.';
  const secondBody=scenario==='byte-duplicate'?displayBytes.subarray(0,byteStart):displayBytes.subarray(Math.max(0,secondOffset));
  const secondContent='Created At: '+secondStarted+'\nCompleted At: '+new Date().toISOString()+'\n'+secondTitle+'\n'+secondBody.toString();
  const secondCall={step_index:secondStep-1,source:'MODEL',type:'PLANNER_RESPONSE',status:'DONE',created_at:secondStarted,tool_calls:[{name:'read_file',args:{Path:full,StartLine:displayStart,EndLine:displayEnd,ByteOffset:secondOffset}}]};
  const secondResult={step_index:secondStep,source:'MODEL',type:'GENERIC',status:'DONE',created_at:secondStarted,content:secondContent};
  rows.push(secondCall,secondResult);report.files[file].display_row_sha256=hash(Buffer.from(JSON.stringify(secondResult)+'\n'));
 }
}
let serialized=rows.map(row=>JSON.stringify(row)).join('\n')+'\n';
if(scenario==='incomplete-json')serialized+='{"step_index":';
if(scenario==='bad-json')serialized+='not JSON\n';
if(scenario==='over-budget')serialized+=JSON.stringify({step_index:99,content:'x'.repeat(9*1024*1024)})+'\n';
fs.writeFileSync(transcript,serialized,{mode:0o600});
if(scenario==='source-changed'){const file=path.join(cwd,'src/reviewed.mjs');fs.chmodSync(file,0o600);fs.writeFileSync(file,'changed frozen source');}
if(scenario==='last-symlink'){const target=path.join(root,'actual-log');fs.renameSync(transcript,target);fs.symlinkSync(target,transcript);}
if(scenario==='ancestor-symlink'){const target=path.join(root,'actual-logs');fs.renameSync(logs,target);fs.symlinkSync(target,logs);}
if(scenario==='hardlink')fs.linkSync(transcript,path.join(root,'linked-log'));
if(scenario==='directory'){fs.unlinkSync(transcript);fs.mkdirSync(transcript);}
if(scenario==='fifo'){fs.unlinkSync(transcript);const r=spawnSync('/usr/bin/mkfifo',[transcript]);if(r.status!==0)throw Error('owned FIFO setup failed');}
report.rows=rows;report.serialized_sha256=hash(Buffer.from(serialized));
fs.writeFileSync(reportPath,JSON.stringify(report));
process.stdout.write(JSON.stringify({event:'init',conversation_id:session})+'\n');
process.stdout.write(JSON.stringify({event:'result',result:{conversation_id:session,status:'SUCCESS',response:JSON.stringify({findings:[]})}})+'\n');
`, { mode: 0o700 });
  return { executable, reportPath, sessionRoot };
}

async function p4RunTranscript(scenario, source = "first\nsecond\nthird\n") {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p4-display-"))); roots.push(root);
  const cli = p4TranscriptCli(root, scenario), raw = new Map();
  mkdirSync(join(root, "quality", "reviews"), { recursive: true });
  try {
    const result = await runConfiguredOcrHostReview({ request: { ...request, stage: "verify-code", review_scope: null, phase_id: null }, packet: configuredPacket(source) }, {
      trustedContext: configuredContext(["antigravity/flash"], cli.executable),
      rawOutputSink: async (_hint, bytes, meta) => {
        const saved = await appendRecord(join(root, "quality", "reviews"), meta.stream, "output", bytes);
        raw.set(meta.stream, readFileSync(saved)); return relative(root, saved).split("\\").join("/");
      },
    });
    expect(existsSync(cli.reportPath), JSON.stringify(result)).toBe(true);
    const report = JSON.parse(readFileSync(cli.reportPath, "utf8"));
    const audit = raw.get("native-audit").toString("utf8").trim().split("\n").map(JSON.parse);
    // Presence first: negatives must reach actual installed commands and inspect.
    expect(report.calls).toHaveLength(["paged-prompt","paged-single-line","byte-pages","byte-gap","byte-overlap","byte-duplicate","byte-wrong-total","byte-implicit-partial","byte-explicit-partial","mixed-byte-line","mixed-gap","mixed-overlap"].includes(scenario) ? 6 : ["mixed-duplicate","mixed-reordered"].includes(scenario) ? 8 : 4);
    for (const call of report.calls.filter(call => call.phase === "pre")) expect(call.response.decision).toBe("allow");
    expect(audit.filter(row => row.phase === "post")).toHaveLength(["paged-prompt","paged-single-line","byte-pages","byte-gap","byte-overlap","byte-duplicate","byte-wrong-total","byte-implicit-partial","byte-explicit-partial","mixed-byte-line","mixed-gap","mixed-overlap"].includes(scenario) ? 3 : ["mixed-duplicate","mixed-reordered"].includes(scenario) ? 4 : 2);
    expect(result.provider_results[0].error?.code).not.toBe("OCR_PROVIDER_EXIT_NONZERO");
    expect(result.provider_results[0].error?.code).not.toBe("OCR_PROVIDER_OUTPUT_SAVE_FAILED");
    return { result, report, audit };
  } finally {
    rmSync(cli.sessionRoot, { recursive: true, force: true });
  }
}

describe("P4 transcript full logical line consumer", () => {
  const positive = [
    ["one-line-LF", "single line\n"], ["one-line-no-LF", "single line"],
    ["multiple-LF", "first\nsecond\nthird\n"], ["unicode-whitespace", "  中文😀  \n\n\tindented  \n"],
    ["long-line", "x".repeat(5000) + "终😀\n"],
    ["display-symbols-in-source", "1: own text\nCreated At: literal\nShowing lines 1-9 of 9\n… truncated\n"],
    ["multiple-final-empty-lines", "body\n\n\n"],
  ];
  for (const [name, source] of positive) it(`accepts exact display ${name} without claiming raw returned bytes`, async () => {
    const { result, report, audit } = await p4RunTranscript("complete", source);
    expect(report.files["src/reviewed.mjs"].sha256).toBe(createHash("sha256").update(source).digest("hex"));
    expect(report.files["src/reviewed.mjs"].display_row_sha256).not.toBe(report.files["src/reviewed.mjs"].sha256);
    // Target RED before implementation: actual inspect cannot confirm prompt.
    expect(result.provider_results[0], JSON.stringify(result)).toMatchObject({ status: "completed", parse_outcome: "ok" });
    expect(result.provider_results[0].material_coverage.read).toContain("src/reviewed.mjs");
    expect(result.provider_results[0].coverage.read_confirmed).toBe(true);
    expect(audit).toContainEqual(expect.objectContaining({ phase: "post", path: "src/reviewed.mjs", sha256: report.files["src/reviewed.mjs"].sha256 }));
  }, 15000);

  it("accepts a transcript-backed full read after a native byte-offset continuation", async () => {
    const { result, report, audit } = await p4RunTranscript("byte-pages", "first\nsecond\nthird\n");
    expect(result.provider_results[0], JSON.stringify(result)).toMatchObject({ status: "completed", parse_outcome: "ok" });
    expect(result.provider_results[0].material_coverage.read).toContain("src/reviewed.mjs");
    expect(result.provider_results[0].coverage.read_confirmed).toBe(true);
    expect(audit).toContainEqual(expect.objectContaining({ phase: "post", path: "review-prompt.md", ByteOffset: expect.any(Number) }));
    expect(report.files["review-prompt.md"].logical_lines).toBeGreaterThan(0);
  }, 15000);

  for (const scenario of ["byte-gap", "byte-overlap", "byte-duplicate", "byte-wrong-total", "byte-missing", "byte-implicit-partial", "byte-explicit-partial"]) it(`rejects incomplete native byte coverage: ${scenario}`, async () => {
    const { result } = await p4RunTranscript(scenario, "first\nsecond\nthird\n");
    expect(result.provider_results[0].material_coverage.read).not.toContain("review-prompt.md");
    expect(result.provider_results[0].coverage.read_confirmed).not.toBe(true);
  }, 15000);

  it("accepts contiguous transcript-backed line pages without accepting a gap", async () => {
    const { result, audit } = await p4RunTranscript("paged-prompt", "first\nsecond\nthird\n");
    expect(result.provider_results[0], JSON.stringify(result)).toMatchObject({ status: "completed", parse_outcome: "ok" });
    expect(result.provider_results[0].material_coverage.read).toContain("src/reviewed.mjs");
    expect(result.provider_results[0].coverage.read_confirmed).toBe(true);
    expect(audit.filter(row => row.phase === "inspect" && row.path === "review-prompt.md")).toHaveLength(2);
  }, 15000);

  it("accepts a single logical-line page followed by the remaining lines", async () => {
    const { result } = await p4RunTranscript("paged-single-line", "first\nsecond\nthird\n");
    expect(result.provider_results[0], JSON.stringify(result)).toMatchObject({ status: "completed", parse_outcome: "ok" });
    expect(result.provider_results[0].coverage.read_confirmed).toBe(true);
  }, 15000);
  it("accepts only the native byte-truncation to logical-line recovery transition", async () => {
    const { result } = await p4RunTranscript("mixed-byte-line", "first\nsecond\nthird\nfourth\nfifth\n");
    expect(result.provider_results[0], JSON.stringify(result)).toMatchObject({ status: "completed", parse_outcome: "ok" });
    expect(result.provider_results[0].coverage.read_confirmed).toBe(true);
  }, 15000);
  for (const scenario of ["mixed-gap", "mixed-overlap", "mixed-duplicate", "mixed-reordered"]) it(`rejects unsafe mixed coverage: ${scenario}`, async () => {
    const { result } = await p4RunTranscript(scenario, "first\nsecond\nthird\nfourth\nfifth\n");
    expect(result.provider_results[0].material_coverage.read).not.toContain("src/reviewed.mjs");
    expect(result.provider_results[0].coverage.read_confirmed).not.toBe(true);
  }, 15000);

  const rejected = ["ranged", "partial-range", "wrong-total", "missing-line", "duplicate-line", "reordered-line", "char-changed", "line-truncated", "prefix", "suffix", "bad-time", "wrong-step", "wrong-tool", "wrong-path", "double-call", "explicit-truncated", "error-result", "final-marker", "unknown-body", "wrong-source", "duplicate-step", "post-step-mismatch", "post-session-mismatch", "post-path-mismatch", "incomplete-json", "bad-json", "source-changed", "foreign-path", "foreign-session", "last-symlink", "ancestor-symlink", "hardlink", "directory", "fifo", "over-budget"];
  for (const scenario of rejected) it(`does not confirm display ${scenario}`, async () => {
    const { result } = await p4RunTranscript(scenario);
    expect(result.provider_results[0].material_coverage.read).not.toContain("src/reviewed.mjs");
    expect(result.provider_results[0].coverage.read_confirmed).not.toBe(true);
  }, 15000);
  for (const [name, source] of [["CRLF", "first\r\nsecond\r\n"], ["bare-CR", "first\rsecond"], ["BOM", "\ufeffbody\n"], ["NUL", "body\0\n"], ["invalid-UTF8", Buffer.from([0xff, 0x0a])]]) it(`does not confirm unsupported source ${name}`, async () => {
    if (name === "NUL" || name === "invalid-UTF8") {
      // Existing delivery projection rejects these before a native log exists.
      await expect(p4RunTranscript("complete", source)).rejects.toMatchObject({ code: "OCR_ATTACHMENT_PROJECTION_FAILED" });
      return;
    }
    const { result } = await p4RunTranscript("complete", source);
    expect(result.provider_results[0].material_coverage.read).not.toContain("src/reviewed.mjs");
    expect(result.provider_results[0].coverage.read_confirmed).not.toBe(true);
  }, 15000);
});

// Independent Spec finding: a matching pair is insufficient unless pre precedes
// post in the actual audit. Reuse the installed-command producers, not a parser.
async function p4RunReverseHookOrder(representation) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p4-reverse-order-"))); roots.push(root);
  const cli = representation === "raw" ? p4NativeConsumerCli(root, "complete", "native") : p4TranscriptCli(root, "complete");
  let script = readFileSync(cli.executable, "utf8");
  if (representation === "raw") {
    const before = "if(kind!=='unmatched-post'&&hook('pre',pre).decision!=='allow')return false;";
    expect(script.split(before)).toHaveLength(2);
    script = script.replace(before, "/* pre deliberately delayed until after full post */");
    expect(script.split("hook('post',post);return true;")).toHaveLength(2);
    script = script.replace("hook('post',post);return true;", "hook('post',post);if(hook('pre',pre).decision!=='allow')throw Error('reverse pre denied');return true;");
  } else {
    const before = "if(hook('pre',common).decision!=='allow')throw Error('positive installed pre denied');";
    expect(script.split(before)).toHaveLength(2);
    script = script.replace(before, "/* pre deliberately delayed until after display post */");
    expect(script.split("hook('post',post);")).toHaveLength(2);
    script = script.replace("hook('post',post);", "hook('post',post);if(hook('pre',common).decision!=='allow')throw Error('reverse pre denied');");
  }
  writeFileSync(cli.executable, script);
  const raw = new Map(); mkdirSync(join(root, "quality", "reviews"), { recursive: true });
  try {
    const result = await runConfiguredOcrHostReview({ request: { ...request, stage: "verify-code", review_scope: null, phase_id: null }, packet: configuredPacket() }, {
      trustedContext: configuredContext(["antigravity/flash"], cli.executable),
      rawOutputSink: async (_hint, bytes, meta) => {
        const saved = await appendRecord(join(root, "quality", "reviews"), meta.stream, "output", bytes);
        raw.set(meta.stream, readFileSync(saved)); return relative(root, saved).split("\\").join("/");
      },
    });
    expect(existsSync(cli.reportPath), JSON.stringify(result)).toBe(true);
    const report = JSON.parse(readFileSync(cli.reportPath, "utf8"));
    expect(report.calls.map(call => call.phase)).toEqual(["post", "pre", "post", "pre"]);
    for (const call of report.calls.filter(call => call.phase === "pre")) expect(call.response.decision).toBe("allow");
    const audit = raw.get("native-audit").toString("utf8").trim().split("\n").map(JSON.parse);
    expect(audit.filter(row => ["pre", "post"].includes(row.phase)).map(row => row.phase)).toEqual(["post", "pre", "post", "pre"]);
    const posts = audit.filter(row => row.phase === "post");
    expect(posts).toHaveLength(2);
    for (const post of posts) expect(post.full_file_result).toBe(representation === "raw" ? true : null);
    return { result, audit };
  } finally {
    if (cli.sessionRoot) rmSync(cli.sessionRoot, { recursive: true, force: true });
  }
}

describe("P4 installed hook reverse order rejection", () => {
  for (const representation of ["raw", "display"]) it(`rejects ${representation} full post preceding pre`, async () => {
    const { result } = await p4RunReverseHookOrder(representation);
    // Target RED is real inspect accepting out-of-order evidence as completed.
    expect(result.provider_results[0], JSON.stringify(result)).toMatchObject({ status: "failed", error: { code: "OCR_PROVIDER_PACKET_GUARD_FAILED" } });
    expect(result.provider_results[0].material_coverage.read).toEqual([]);
    expect(result.provider_results[0].coverage.read_confirmed).not.toBe(true);
  }, 15000);
});

// P4 AG-native consumer oracle. No providerExecutor override: the real direct
// executor, supervisor, process groups, packet hook and result guards all run.
function p4NativeHealthCli(root, kind) {
  const cli = p4NativeConsumerCli(root, "complete", "native");
  let script = readFileSync(cli.executable, "utf8");
  expect(script.split("function finish(){")).toHaveLength(2);
  script = script.replace("function finish(){", "function p4OriginalSuccessfulFinish(){");
  if (kind === "without-reads") {
    expect(script.split("if(mode==='safety'){")).toHaveLength(2);
    script = script.replace("if(mode==='safety'){", "if(true){finish();}else if(mode==='safety'){");
  }
  script += String.raw`
function finish(){
 const {spawn}=require('node:child_process'),kind=${JSON.stringify(kind)};
 report.provider_pid=process.pid;fs.writeFileSync(reportPath,JSON.stringify(report));
 if(kind!=='success-exit-nonzero')process.on('SIGTERM',()=>process.exit(0));else process.on('SIGTERM',()=>{});
 const out=value=>process.stdout.write(JSON.stringify(value)+'\n');
 const terminal=(status,response)=>({event:'result',result:{conversation_id:session,status,response}});
 const successful=terminal('SUCCESS',JSON.stringify({findings:[]}));
 const failed=terminal('ERROR','owned first terminal failure');
 const readStep=index=>({event:'step_update',step_update:{conversation_id:session,step_index:index,state:'DONE',step_type:'tool',tool_name:'read_file',tool_info:{name:'read_file',parameters:{Path:prompt},output:'中文😀 allowed completed read'}}});
 if(kind==='noise')report.first_allowed_done_complete_bytes=Buffer.byteLength(JSON.stringify({event:'init',conversation_id:session})+'\n'+JSON.stringify(readStep(9))+'\n');
 fs.writeFileSync(reportPath,JSON.stringify(report));
 out({event:'init',conversation_id:session});
 if(kind==='first-error'){process.stdout.write(JSON.stringify(failed)+'\n'+JSON.stringify(successful)+'\n');return;}
 if(kind==='first-success'){process.stdout.write(JSON.stringify(successful)+'\n'+JSON.stringify(failed)+'\n');return;}
 if(kind==='success-exit-nonzero'){
  if(!read(prompt)||!read(source))throw Error('success-exit-nonzero packet reads failed');
  out(successful);setTimeout(()=>process.exit(7),50);return;
 }
 if(kind==='word-only'){out(terminal('SUCCESS','SUCCESS'));return;}
 if(kind==='without-reads'){out(successful);return;}
 if(kind==='terminal-descendant'||kind==='no-terminal-descendant'){
  if(kind==='terminal-descendant')out(successful);
  const descendant=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});setTimeout(()=>process.exit(0),10000)"],{stdio:['ignore','inherit','inherit']});
  report.descendant_pid=descendant.pid;report.descendant_started_at=Date.now();report.descendant_expected_lifetime_ms=10000;
  report.provider_group=Number(spawnSync('/bin/ps',['-o','pgid=','-p',String(process.pid)],{encoding:'utf8'}).stdout.trim());
  report.descendant_group=Number(spawnSync('/bin/ps',['-o','pgid=','-p',String(descendant.pid)],{encoding:'utf8'}).stdout.trim());
  fs.writeFileSync(reportPath,JSON.stringify(report));
  setTimeout(()=>process.exit(0),30);return;
 }
 if(kind==='slow-unique'){
  let index=30;
  const tick=setInterval(()=>{
   const bytes=Buffer.from(JSON.stringify(readStep(index++))+'\n');
   const split=bytes.indexOf(Buffer.from('😀'))+2;
   process.stdout.write(bytes.subarray(0,split));setTimeout(()=>process.stdout.write(bytes.subarray(split)),5);
   if(index===40){clearInterval(tick);setTimeout(()=>process.stdout.write(JSON.stringify(successful)+'\n'),15);}
  },55);return;
 }
 // One accepted read DONE, then repeats are not new progress. Every other
 // stdout frame and all stderr below supply only liveness, even continuously.
 setTimeout(()=>{
 out(readStep(9));
 const tick=setInterval(()=>{
  const frames=[
   {event:'step_update',step_update:{conversation_id:session,step_index:10,state:'ERROR',step_type:'tool',tool_name:'read_file',tool_info:{name:'read_file',error:{message:'denied'}}}},
   {event:'step_update',step_update:{conversation_id:session,step_index:11,state:'DONE',step_type:'agent_response'}},
   readStep(9),
  ];process.stdout.write(frames.map(frame=>JSON.stringify(frame)).join('\n')+'\n');process.stderr.write('owned liveness noise\n');
 },15);
 setTimeout(()=>{clearInterval(tick);out(failed);},700);
 },70);
}
`;
  writeFileSync(cli.executable, script);
  return cli;
}

async function p4RunNativeHealth(kind) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p4-native-health-"))); roots.push(root);
  const cli = p4NativeHealthCli(root, kind), sibling = ownedPacketCli(root);
  const context = configuredContext(["antigravity/health", "codex/sibling"], cli.executable);
  context.providerConfig.providers["codex/sibling"].command = sibling.executable;
  const raw = new Map(), observed = [], completed = [], controller = new AbortController();
  mkdirSync(join(root, "quality", "reviews"), { recursive: true });
  const realNow = Date.now, realSetTimeout = globalThis.setTimeout, realClearTimeout = globalThis.clearTimeout;
  const realSetInterval = globalThis.setInterval, realClearInterval = globalThis.clearInterval;
  const intervalHandles = new Set(), timeoutHandles = new Set();
  let logicalNow = realNow(), active = false, healthRegistrations = 0, healthTicks = 0, watchdogFired = false, pending;
  let firstAllowedTick = null, firstAllowedLogicalMs = null, agStdoutSeen = 0, agProgressSeen = 0;
  const healthTimeline = [];
  const advanceHealthTick = () => {
    if (!active) return;
    logicalNow += 60_000; healthTicks++;
    if (kind === "noise") healthTimeline.push({ tick: healthTicks, logical_ms: logicalNow, stdout_bytes: agStdoutSeen, progress_events: agProgressSeen });
  };
  Date.now = () => logicalNow;
  // Only the 60-second health window is accelerated. The separate 5-second
  // PID probe and the real subprocess/supervisor clocks retain their meanings.
  globalThis.setTimeout = (fn, delay, ...args) => {
    if (delay !== 60_000) return realSetTimeout(fn, delay, ...args);
    healthRegistrations++;
    const handle = realSetTimeout(() => { advanceHealthTick(); fn(...args); }, 40);
    timeoutHandles.add(handle); return handle;
  };
  globalThis.setInterval = (fn, delay, ...args) => {
    if (delay !== 60_000) return realSetInterval(fn, delay, ...args);
    healthRegistrations++;
    const handle = realSetInterval(() => { advanceHealthTick(); fn(...args); }, 40);
    intervalHandles.add(handle); return handle;
  };
  const descendantCase = kind === "terminal-descendant" || kind === "no-terminal-descendant";
  const forceOwnedDescendantGroup = () => {
    if (!descendantCase || !existsSync(cli.reportPath)) return;
    const owned = JSON.parse(readFileSync(cli.reportPath, "utf8"));
    if (owned.provider_group === owned.provider_pid && owned.descendant_group === owned.provider_group) {
      try { process.kill(-owned.provider_group, "SIGKILL"); } catch (error) { if (error.code !== "ESRCH") throw error; }
    }
  };
  const watchdog = realSetTimeout(() => {
    watchdogFired = true; controller.abort(new Error("owned native health watchdog"));
    forceOwnedDescendantGroup();
  }, 3500);
  try {
    pending = runConfiguredOcrHostReview({ request: { ...request, stage: "verify-code", review_scope: null, phase_id: null }, packet: configuredPacket(), signal: controller.signal }, {
      trustedContext: context,
      // Existing PID-observation injection only; it never counts health windows.
      ...(descendantCase ? { healthPollMs: 20 } : {}),
      onProviderHealth: health => {
        observed.push(health);
        if (health.provider === "antigravity/health" && health.stdout_bytes > 0) {
          agStdoutSeen = health.stdout_bytes; agProgressSeen = health.progress_events;
          if (kind === "noise" && firstAllowedTick === null) {
            const owned = JSON.parse(readFileSync(cli.reportPath, "utf8"));
            if (health.stdout_bytes >= owned.first_allowed_done_complete_bytes) {
              firstAllowedTick = healthTicks; firstAllowedLogicalMs = logicalNow;
            }
          }
          active = true;
          if (kind === "cancel-first" && !controller.signal.aborted) controller.abort(new Error("owned first cancellation"));
        }
      },
      onProviderResult: member => completed.push(member),
      rawOutputSink: async (_hint, bytes, meta) => {
        const saved = await appendRecord(join(root, "quality", "reviews"), meta.stream, "output", bytes);
        raw.set(meta.stream + ":" + meta.provider, readFileSync(saved));
        return relative(root, saved).split("\\").join("/");
      },
    });
    const result = await pending;
    expect(watchdogFired, JSON.stringify(result)).toBe(false);
    expect(existsSync(cli.reportPath), JSON.stringify(result)).toBe(true);
    const report = JSON.parse(readFileSync(cli.reportPath, "utf8"));
    expect(report.provider_pid).toBeGreaterThan(0);
    expect(() => process.kill(report.provider_pid, 0)).toThrow();
    if (report.descendant_pid) {
      expect(report.provider_group).toBe(report.provider_pid);
      expect(report.descendant_group).toBe(report.provider_group);
      expect(report.descendant_expected_lifetime_ms).toBe(10000);
      const elapsed = realNow() - report.descendant_started_at;
      expect(elapsed, "must actively reap before both the watchdog and 10s natural exit").toBeLessThan(3500);
      expect(() => process.kill(report.descendant_pid, 0)).toThrow();
      console.log(JSON.stringify({ oracle: "P4_ACTIVE_DESCENDANT_REAP", kind, elapsed_real_ms: elapsed, natural_lifetime_ms: 10000, pid_probe_ms: 20, provider_group: report.provider_group, descendant_pid: report.descendant_pid, watchdog_fired: watchdogFired }));
    }
    const member = result.provider_results[0];
    if (kind === "cancel-first") {
      // Caller cancellation legitimately applies to an unfinished sibling too.
      expect(["completed", "cancelled"]).toContain(result.provider_results[1].status);
      if (result.provider_results[1].status === "cancelled") expect(result.provider_results[1].error.code).toBe("OCR_PROVIDER_CANCELLED");
    } else {
      expect(result.provider_results[1], JSON.stringify(result)).toMatchObject({ provider: "codex/sibling", status: "completed", parse_outcome: "ok" });
    }
    expect(member.raw_output_ref).not.toBeNull();
    expect(Buffer.isBuffer(raw.get("stdout:antigravity/health"))).toBe(true);
    if (kind !== "without-reads") {
      const audit = raw.get("native-audit:antigravity/health");
      expect(Buffer.isBuffer(audit)).toBe(true);
      const rows = audit.toString("utf8").trim().split("\n").map(JSON.parse);
      expect(rows).toContainEqual(expect.objectContaining({ phase: "pre", path: "review-prompt.md", decision: "allow" }));
      expect(rows).toContainEqual(expect.objectContaining({ phase: "post", path: "review-prompt.md", full_file_result: true }));
    }
    const facts = { kind, healthRegistrations, healthTicks, watchdogFired, progress_events: member.execution?.retry?.progress_events, code: member.error?.code, status: member.status,
      ...(kind === "noise" ? { firstAllowedTick, firstAllowedLogicalMs, healthTimeline } : {}) };
    console.log(JSON.stringify({ oracle: "P4_AG_NATIVE_HEALTH", ...facts }));
    return { result, member, report, observed, completed, raw, facts };
  } finally {
    realClearTimeout(watchdog);
    controller.abort(new Error("owned native health cleanup"));
    forceOwnedDescendantGroup();
    if (pending) await pending.catch(() => {});
    for (const handle of timeoutHandles) realClearTimeout(handle);
    for (const handle of intervalHandles) realClearInterval(handle);
    Date.now = realNow; globalThis.setTimeout = realSetTimeout; globalThis.clearTimeout = realClearTimeout;
    globalThis.setInterval = realSetInterval; globalThis.clearInterval = realClearInterval;
  }
}

describe("P4 AG native semantic health consumer", () => {
  it("stalls denied model duplicate and stderr noise while preserving completed sibling", async () => {
    const { member, facts, raw } = await p4RunNativeHealth("noise");
    expect(member.error?.code, JSON.stringify(facts)).toBe("PROCESS_STALLED");
    const frames = raw.get("stdout:antigravity/health").toString("utf8").trim().split("\n").map(line => JSON.parse(line));
    const accepted = frames.map(frame => frame.step_update).filter(step => step?.state === "DONE" && step.step_type === "tool" && step.tool_name === "read_file" && !step.tool_info?.error);
    expect([...new Set(accepted.map(step => step.step_index))]).toEqual([9]);
    expect(facts.progress_events).toBe(1);
    expect(Number.isSafeInteger(facts.firstAllowedTick), JSON.stringify(facts)).toBe(true);
    // Existing health-runner consumes a generation change on the next tick,
    // then counts five unchanged generations. Startup/init ticks are excluded.
    const reset = facts.healthTimeline.find(tick => tick.tick > facts.firstAllowedTick && tick.progress_events === 1);
    expect(reset, JSON.stringify(facts)).toBeDefined();
    const idle = facts.healthTimeline.filter(tick => tick.tick > reset.tick);
    expect(idle, JSON.stringify(facts)).toHaveLength(5);
    for (const [index, tick] of idle.entries()) {
      expect(tick.tick).toBe(reset.tick + index + 1);
      expect(tick.logical_ms).toBe(reset.logical_ms + 60_000 * (index + 1));
      expect(tick.progress_events).toBe(1);
    }
  }, 10000);
  it("keeps unique allowed reads successful across five windows with fragmented UTF8 JSONL", async () => {
    const { member, facts, raw } = await p4RunNativeHealth("slow-unique");
    expect(member, JSON.stringify(facts)).toMatchObject({ status: "completed", parse_outcome: "ok" });
    expect(member.material_coverage.read).toContain("src/reviewed.mjs");
    expect(facts.healthTicks, "cross-window timing remains unexercised until a native 60s health timer is wired").toBeGreaterThan(5);
    expect(member.timing.duration_ms).toBeGreaterThan(300_000);
    expect(facts.progress_events).toBeGreaterThanOrEqual(10);
    expect(facts.progress_events).toBeLessThanOrEqual(11);
    expect(raw.get("stdout:antigravity/health").toString("utf8")).toContain("中文😀 allowed completed read");
  }, 10000);
  it("preserves the first ERROR over a later SUCCESS", async () => {
    const { member, raw } = await p4RunNativeHealth("first-error");
    expect(member).toMatchObject({ status: "failed", error: { code: "PROVIDER_HEALTH_FAILED" } });
    expect(raw.get("stdout:antigravity/health").toString("utf8")).toContain("owned first terminal failure");
  }, 10000);
  it("preserves the first SUCCESS over a later ERROR", async () => {
    const { member } = await p4RunNativeHealth("first-success");
    expect(member).toMatchObject({ status: "completed", parse_outcome: "ok", error: null });
    expect(member.material_coverage.read).toContain("src/reviewed.mjs");
  }, 10000);
  it("does not accept SUCCESS after a non-zero provider exit", async () => {
    const { member } = await p4RunNativeHealth("success-exit-nonzero");
    expect(member).toMatchObject({ status: "failed", process_outcome: "exit_nonzero", error: { code: "OCR_PROVIDER_EXIT_NONZERO" } });
  }, 10000);
  it("keeps a successful terminal and reaps an inherited-stdio descendant", async () => {
    const { member } = await p4RunNativeHealth("terminal-descendant");
    expect(member).toMatchObject({ status: "completed", parse_outcome: "ok" });
    expect(member.material_coverage.read).toContain("src/reviewed.mjs");
  }, 10000);
  it("reports no terminal result after parent exit with inherited stdio", async () => {
    const { member } = await p4RunNativeHealth("no-terminal-descendant");
    expect(member.error?.code).toBe("PROVIDER_NO_TERMINAL_RESULT");
    expect(member.material_coverage.read).toEqual([]);
  }, 10000);
  it("retains first cancellation rather than converting it to stalled", async () => {
    const { member } = await p4RunNativeHealth("cancel-first");
    expect(member).toMatchObject({ status: "cancelled", error: { code: "OCR_PROVIDER_CANCELLED" } });
  }, 10000);
  it("does not accept SUCCESS wording without review JSON", async () => {
    const { member } = await p4RunNativeHealth("word-only");
    expect(member.status).toBe("failed");
    expect(member.parse_outcome).not.toBe("ok");
  }, 10000);
  it("does not accept successful review JSON without actual packet reads", async () => {
    const { member } = await p4RunNativeHealth("without-reads");
    expect(member).toMatchObject({ status: "failed", error: { code: "OCR_PROVIDER_PACKET_GUARD_FAILED" } });
    expect(member.material_coverage.read).toEqual([]);
  }, 10000);
});

// New independent race oracle: capture() synchronously agCapture()s complete
// JSONL before observe() invokes this callback, and close runs on a later turn.
async function p4RunTerminalBeforeCancel(firstStatus) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p4-terminal-cancel-"))); roots.push(root);
  const kind = firstStatus === "ERROR" ? "first-error" : "first-success";
  const cli = p4NativeHealthCli(root, kind);
  let script = readFileSync(cli.executable, "utf8");
  const before = firstStatus === "ERROR"
    ? "if(kind==='first-error'){process.stdout.write(JSON.stringify(failed)+'\\n'+JSON.stringify(successful)+'\\n');return;}"
    : "if(kind==='first-success'){process.stdout.write(JSON.stringify(successful)+'\\n'+JSON.stringify(failed)+'\\n');return;}";
  const after = firstStatus === "ERROR"
    ? "if(kind==='first-error'){out(failed);setTimeout(()=>process.exit(0),1000);return;}"
    : "if(kind==='first-success'){out(successful);setTimeout(()=>process.exit(0),1000);return;}";
  expect(script.split(before)).toHaveLength(2);
  writeFileSync(cli.executable, script.replace(before, after));
  const session = "p4-reconstructed-wrapper";
  const first = { event: "result", result: { conversation_id: session, status: firstStatus, response: firstStatus === "ERROR" ? "owned first terminal failure" : JSON.stringify({ findings: [] }) } };
  const consumedBytes = Buffer.byteLength(JSON.stringify({ event: "init", conversation_id: session }) + "\n" + JSON.stringify(first) + "\n");
  const controller = new AbortController(), raw = new Map();
  let abortAfterCompleteTerminal = false, observedBytes = null, watchdogFired = false, pending;
  mkdirSync(join(root, "quality", "reviews"), { recursive: true });
  const watchdog = setTimeout(() => { watchdogFired = true; controller.abort(new Error("owned terminal-cancel watchdog")); }, 3500);
  try {
    pending = runConfiguredOcrHostReview({ request: { ...request, stage: "verify-code", review_scope: null, phase_id: null }, packet: configuredPacket(), signal: controller.signal }, {
      trustedContext: configuredContext(["antigravity/health"], cli.executable),
      onProviderHealth: health => {
        if (!abortAfterCompleteTerminal && health.status === "running" && health.stdout_bytes >= consumedBytes) {
          abortAfterCompleteTerminal = true; observedBytes = health.stdout_bytes;
          controller.abort(new Error("owned cancellation after consumed native terminal"));
        }
      },
      rawOutputSink: async (_hint, bytes, meta) => {
        const saved = await appendRecord(join(root, "quality", "reviews"), meta.stream, "output", bytes);
        raw.set(meta.stream, readFileSync(saved)); return relative(root, saved).split("\\").join("/");
      },
    });
    const result = await pending;
    expect(watchdogFired).toBe(false);
    expect(abortAfterCompleteTerminal).toBe(true);
    expect(observedBytes).toBeGreaterThanOrEqual(consumedBytes);
    expect(existsSync(cli.reportPath), JSON.stringify(result)).toBe(true);
    const report = JSON.parse(readFileSync(cli.reportPath, "utf8"));
    expect(() => process.kill(report.provider_pid, 0)).toThrow();
    const stdout = raw.get("stdout"); expect(Buffer.isBuffer(stdout)).toBe(true);
    const frames = stdout.toString("utf8").trim().split("\n").map(JSON.parse);
    expect(frames.filter(frame => frame.event === "result")).toEqual([first]);
    const audit = raw.get("native-audit"); expect(Buffer.isBuffer(audit)).toBe(true);
    const rows = audit.toString("utf8").trim().split("\n").map(JSON.parse);
    expect(rows).toContainEqual(expect.objectContaining({ phase: "post", path: "review-prompt.md", full_file_result: true }));
    expect(rows).toContainEqual(expect.objectContaining({ phase: "post", path: "src/reviewed.mjs", full_file_result: true }));
    console.log(JSON.stringify({ oracle: "P4_TERMINAL_BEFORE_CANCEL", firstStatus, consumedBytes, observedBytes, abortAfterCompleteTerminal, watchdogFired, status: result.provider_results[0].status, code: result.provider_results[0].error?.code }));
    return result.provider_results[0];
  } finally {
    clearTimeout(watchdog); controller.abort(new Error("owned terminal-cancel cleanup"));
    if (pending) await pending.catch(() => {});
  }
}

describe("P4 native terminal before cancellation", () => {
  it("preserves consumed ERROR before subsequent caller cancellation", async () => {
    const member = await p4RunTerminalBeforeCancel("ERROR");
    expect(member).toMatchObject({ status: "failed", error: { code: "PROVIDER_HEALTH_FAILED" } });
  }, 10000);
  it("preserves consumed SUCCESS with parsing and reads before subsequent caller cancellation", async () => {
    const member = await p4RunTerminalBeforeCancel("SUCCESS");
    expect(member).toMatchObject({ status: "completed", parse_outcome: "ok", error: null });
    expect(member.material_coverage.read).toContain("src/reviewed.mjs");
    expect(member.coverage.read_confirmed).toBe(true);
  }, 10000);
});

it("T037 second allocation failure through the real round removes the first packet directory", () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "t037-allocation-")));roots.push(root);
  const url = new URL("../../runtime/review/ocr-delegation-adapter.mjs", import.meta.url).href;
  const output = execFileSync(process.execPath, ["--input-type=module", "-e", `
    import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';import path from 'node:path';
    const original=fs.mkdtempSync;let first=null,second=false;
    fs.mkdtempSync=(prefix,...rest)=>{if(prefix.includes('workflowhub-ocr-rule-')){second=true;throw Object.assign(new Error('owned second allocation failure'),{code:'ENOSPC'});}const dir=original(prefix,...rest);if(prefix.includes('workflowhub-ocr-packet-'))first=dir;return dir;};
    syncBuiltinESMExports();
    const {runOcrDelegationRound}=await import(${JSON.stringify(url)});
    const result=await runOcrDelegationRound({stage:'build-code',material_id:'owned-material'},{buildBundle:()=>({bundleRoot:${JSON.stringify(root)},materialId:'owned-material',manifest:[]})});
    console.log(JSON.stringify({second,first,remains:first&&fs.existsSync(first),result}));
    if(first&&fs.existsSync(first))fs.rmSync(first,{recursive:true,force:true});
  `], { encoding: "utf8", timeout: 5000 });
  const value=JSON.parse(output);
  expect(value.second).toBe(true);
  expect(value.first).toEqual(expect.any(String));
  expect(value.remains).toBe(false);
  expect(JSON.stringify(value.result)).toContain("OCR_PACKET_PREPARATION_FAILED");
  expect(JSON.stringify(value.result)).toContain("ENOSPC");
});

it("T037 directly observes OCR rule and packet cleanup after success, failure and executor cancellation", () => {
  const root=realpathSync(mkdtempSync(join(tmpdir(),"t037-rule-observation-")));roots.push(root);
  const source=join(root,"source");mkdirSync(source);
  writeFileSync(join(source,"owned.mjs"),"export const owned=true;\n");
  writeFileSync(join(source,"review-instructions.md"),compliantReviewPrompt);
  const url=new URL("../../runtime/review/ocr-delegation-adapter.mjs",import.meta.url).href;
  for(const mode of ["success","failure","cancel-confirmed","cancel-deferred"]){
    const output=execFileSync(process.execPath,["--input-type=module","-e",`
      import fs from 'node:fs';import cp from 'node:child_process';import assert from 'node:assert/strict';import {syncBuiltinESMExports}from'node:module';
      const allocate=fs.mkdtempSync,execute=cp.execFileSync,seen={};let ocrCalls=0;
      fs.mkdtempSync=(prefix,...args)=>{const dir=allocate(prefix,...args);if(prefix.includes('workflowhub-ocr-rule-'))seen.rule=dir;if(prefix.includes('workflowhub-ocr-packet-'))seen.packet=dir;return dir;};
      cp.execFileSync=(command,args,...rest)=>{if(command!=='ocr')return execute(command,args,...rest);ocrCalls++;if(args[0]==='--version')return 'open-code-review v1.12.9\\n';if(args[1]==='preview')return JSON.stringify({reviewable_files:[{path:'owned.mjs'},{path:'review-instructions.md'}]});if(args[1]==='rule')return JSON.stringify({rules:[{path:'owned.mjs'}]});throw Error('unexpected owned OCR command');};
      syncBuiltinESMExports();
      const{runOcrDelegationRound}=await import(${JSON.stringify(url)}),mode=${JSON.stringify(mode)},controller=new AbortController();let finish,executorEntered=false;
      const execution=new Promise(resolve=>{finish=resolve;});const keepAlive=setInterval(()=>{},1000);
      const result=await runOcrDelegationRound({stage:'build-code',material_id:'owned-material'},{signal:controller.signal,cancellationGraceMs:10,buildBundle:()=>({bundleRoot:${JSON.stringify(source)},materialId:'owned-material',manifest:[{path:'owned.mjs'},{path:'review-instructions.md'}]}),executor:({packet,registerCancellation})=>{
        executorEntered=true;assert.equal(packet.root,seen.packet);assert.ok(fs.existsSync(seen.rule));assert.ok(fs.existsSync(seen.packet));
        if(mode==='failure')throw Object.assign(new Error('owned executor failure'),{code:'OCR_OWNED_FAILURE'});
        if(mode==='success')return {status:'available',outcome:'completed',findings:[],provider_results:[]};
        registerCancellation(()=>{if(mode==='cancel-confirmed'){finish(null);return{confirmed:true};}return{confirmed:false,cleanup:execution};});
        queueMicrotask(()=>controller.abort(new Error('owned cancellation')));return execution;
      }});
      assert.ok(executorEntered);assert.equal(ocrCalls,3);assert.ok(seen.rule);assert.ok(seen.packet);assert.equal(fs.existsSync(seen.rule),false);
      const packetBeforeSettle=fs.existsSync(seen.packet);
      if(mode==='cancel-deferred'){assert.equal(packetBeforeSettle,true);finish(null);for(let n=0;n<100&&fs.existsSync(seen.packet);n++)await new Promise(resolve=>setTimeout(resolve,5));}
      else assert.equal(packetBeforeSettle,false);
      assert.equal(fs.existsSync(seen.packet),false);
      clearInterval(keepAlive);
      console.log(JSON.stringify({mode,executorEntered,ocrCalls,ruleRemoved:!fs.existsSync(seen.rule),packetBeforeSettle,packetRemoved:!fs.existsSync(seen.packet),status:result.status,outcome:result.outcome,error:result.error?.code,cancellation:result.cancellation}));
    `],{encoding:"utf8",env:{...process.env,TMPDIR:root,TMP:root,TEMP:root},timeout:5000});
    const result=JSON.parse(output);
    expect(result.executorEntered).toBe(true);
    expect(result.ruleRemoved).toBe(true);
    expect(result.packetRemoved).toBe(true);
    expect(result.packetBeforeSettle).toBe(mode==="cancel-deferred");
    if(mode==="success")expect(result).toMatchObject({status:"available",outcome:"completed"});
    if(mode==="failure")expect(result.error).toBe("OCR_OWNED_FAILURE");
    if(mode==="cancel-confirmed")expect(result.error).toBe("OCR_EXECUTOR_CANCELLED");
    if(mode==="cancel-deferred")expect(result.error).toBe("OCR_EXECUTOR_CANCEL_UNCONFIRMED");
  }
});

it("T037 cleanup EACCES keeps OCR terminal facts, attempts sibling directories and handles deferred rejection", () => {
  const root=realpathSync(mkdtempSync(join(tmpdir(),"t037-cleanup-isolation-")));roots.push(root);
  const source=join(root,"source");mkdirSync(source);writeFileSync(join(source,"owned.mjs"),"export const owned=true;\n");writeFileSync(join(source,"review-instructions.md"),compliantReviewPrompt);
  const url=new URL("../../runtime/review/ocr-delegation-adapter.mjs",import.meta.url).href;
  for(const [mode,target] of [["success","rule"],["failure","rule"],["cancel","rule"],["early-constraints","packet"],["early-executor","rule"],["early-aborted","packet"],["deferred-unconfirmed-resolve","packet"],["deferred-unconfirmed-reject","packet"],["deferred-timeout-resolve","packet"],["deferred-timeout-reject","packet"],["diagnostic-fails","rule"]]){
    const output=execFileSync(process.execPath,["--input-type=module","-e",`
      import fs from'node:fs';import cp from'node:child_process';import assert from'node:assert/strict';import{syncBuiltinESMExports}from'node:module';
      const mode=${JSON.stringify(mode)},target=${JSON.stringify(target)},seen={},attempts=[],diagnostics=[],unhandled=[];let hits=0;
      const allocate=fs.mkdtempSync,remove=fs.rmSync,execute=cp.execFileSync,stderr=process.stderr.write.bind(process.stderr);
      fs.mkdtempSync=(prefix,...args)=>{const dir=allocate(prefix,...args);if(prefix.includes('workflowhub-ocr-rule-'))seen.rule=dir;if(prefix.includes('workflowhub-ocr-packet-'))seen.packet=dir;return dir;};
      fs.rmSync=(p,...args)=>{if(p===seen.rule||p===seen.packet){attempts.push(p===seen.rule?'rule':'packet');if(p===seen[target]){hits++;throw Object.assign(new Error('owned '+target+' cleanup denied'),{code:'EACCES'});}}return remove(p,...args);};
      cp.execFileSync=(cmd,args,...rest)=>{if(cmd!=='ocr')return execute(cmd,args,...rest);if(args[0]==='--version')return'open-code-review v1.12.9\\n';if(args[1]==='preview')return JSON.stringify({reviewable_files:[{path:'owned.mjs'},{path:'review-instructions.md'}]});if(args[1]==='rule')return JSON.stringify({rules:[]});throw Error('unexpected command');};
      process.stderr.write=(text,...args)=>{diagnostics.push(String(text));if(mode==='diagnostic-fails')throw Object.assign(new Error('owned diagnostic sink denied'),{code:'EPIPE'});return stderr(text,...args);};
      process.on('unhandledRejection',e=>unhandled.push(String(e)));syncBuiltinESMExports();
      const{runOcrDelegationRound}=await import(${JSON.stringify(url)}),controller=new AbortController();
      let settleExecution,resolveHandler,rejectHandler,resolveCleanup,rejectCleanup,entered=false;
      const execution=new Promise(resolve=>settleExecution=resolve),handler=new Promise((resolve,reject)=>{resolveHandler=resolve;rejectHandler=reject;}),cleanup=new Promise((resolve,reject)=>{resolveCleanup=resolve;rejectCleanup=reject;});
      // Only promises used by a scenario may be rejected; each real chain is observed.
      const keepAlive=setInterval(()=>{},1000);
      if(mode==='early-aborted')controller.abort();
      let result=null,thrown=null,before=null;
      try{result=await runOcrDelegationRound({stage:'build-code',material_id:'owned',...(mode==='early-constraints'?{prompt:'missing mandatory constraints'}:{})},{signal:controller.signal,cancellationGraceMs:10,buildBundle:()=>({bundleRoot:${JSON.stringify(source)},materialId:'owned',manifest:[{path:'owned.mjs'},{path:'review-instructions.md'}]}),...(mode==='early-executor'?{}:{executor:({registerCancellation})=>{
        entered=true;
        if(mode==='failure')throw Object.assign(new Error('owned executor failed'),{code:'OCR_OWNED_FAILURE'});
        if(mode==='success'||mode==='diagnostic-fails')return{status:'available',outcome:'completed',findings:[],provider_results:[]};
        registerCancellation(()=>{if(mode==='cancel'){settleExecution(null);return{confirmed:true};}if(mode.startsWith('deferred-timeout'))return handler;return{confirmed:false,cleanup};});
        queueMicrotask(()=>controller.abort());return execution;
      }})});}catch(e){thrown={code:e.code,message:e.message};}
      if(mode.startsWith('deferred-')){
        before={packetExists:fs.existsSync(seen.packet),packetAttempts:attempts.filter(x=>x==='packet').length};
        if(mode.startsWith('deferred-timeout')){if(mode.endsWith('resolve'))resolveHandler({cleanup:execution});else rejectHandler(new Error('owned cancellation handler failed'));settleExecution(null);}
        else{if(mode.endsWith('resolve'))resolveCleanup();else rejectCleanup(new Error('owned cleanup promise failed'));settleExecution(null);}
        await new Promise(resolve=>setTimeout(resolve,30));
      }
      clearInterval(keepAlive);process.stderr.write=stderr;
      const observed={mode,target,thrown,status:result?.status,outcome:result?.outcome,error:result?.error?.code,entered,hits,attempts,diagnostics,before,ruleExists:fs.existsSync(seen.rule),packetExists:fs.existsSync(seen.packet),unhandled};
      for(const p of Object.values(seen))remove(p,{recursive:true,force:true});
      console.log(JSON.stringify(observed));
    `],{encoding:"utf8",env:{...process.env,TMPDIR:root,TMP:root,TEMP:root},timeout:5000});
    const result=JSON.parse(output);
    expect(result.thrown).toBeNull();
    expect(result.hits).toBeGreaterThan(0);
    expect(result.attempts).toEqual(expect.arrayContaining(["rule","packet"]));
    expect(result.ruleExists).toBe(target==="rule");
    expect(result.packetExists).toBe(target==="packet");
    expect(result.diagnostics.join("\n")).toContain("TEMP_CLEANUP_FAILED");
    expect(result.diagnostics.join("\n")).toContain("EACCES");
    expect(result.unhandled).toEqual([]);
    if(mode==="success"||mode==="diagnostic-fails")expect(result).toMatchObject({status:"available",outcome:"completed"});
    if(mode==="failure")expect(result.error).toBe("OCR_OWNED_FAILURE");
    if(mode==="cancel"||mode==="early-aborted")expect(result.error).toBe("OCR_EXECUTOR_CANCELLED");
    if(mode==="early-constraints")expect(result.error).toBe("OCR_PROMPT_CONSTRAINTS_MISSING");
    if(mode==="early-executor")expect(result.error).toBe("OCR_DELEGATION_UNAVAILABLE");
    if(mode.startsWith("deferred-")){expect(result.error).toBe("OCR_EXECUTOR_CANCEL_UNCONFIRMED");expect(result.before).toEqual({packetExists:true,packetAttempts:0});}
  }
});

// P1 additive tier boundary; existing provider failure and unavailable assertions stay unchanged.
import { reviewTierFor, assertReviewTierRecord } from '../../runtime/review/review-policy.mjs';
describe('P1 tier boundary: adapter execution is external only when the selected executor requires it', () => {
  it('separates independent Phase review from external OCR identity', () => {
    const input={identity:{stage:'build-code',review_scope:'phase'},risks:{permissionsSecurity:'none',dataMigrationIrreversible:'none',sharedStateConcurrency:'none',publicContractCriticalPath:'none',realExternalDependency:'none'},scope:{singleModule:true,knownDirectConsumers:true},readings:{paths:{status:'read',raw:'owned/module.mjs'},impact:{status:'read',raw:'owned named consumer'},size:{status:'read',raw:'1\t0\towned/module.mjs'}}};
    expect(reviewTierFor(input)).toBe('独立子代理');
    expect(()=>assertReviewTierRecord({executor:'独立子代理',input,identity:'ocr',source:{dispatch_identity:'owned-reader',context_isolation:'none'}})).toThrow(/OCR/);
    input.risks.publicContractCriticalPath='present';expect(reviewTierFor(input)).toBe('外部 OCR');
    input.risks.publicContractCriticalPath='none';input.identity={stage:'verify-code'};expect(reviewTierFor(input)).toBe('外部 OCR');
    const record={executor:'外部 OCR',input,status:'unavailable',reason:'ENOENT',source:{route:'configured/single_round'},detection_output_ref:'quality/tests/version.output',failure_ref:'quality/tests/failure.json'};
    expect(assertReviewTierRecord(record)).toBe(record);expect(record.provider_results).toBeUndefined();
  });
});
