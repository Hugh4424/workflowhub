// build-plan 预写测试（冻结）：断言变更须走 test change request + 独立审查
//
// FR-QUAL-001/002/003: doctor preserves availability facts; code review records
// missing/low-version OCR as unavailable without dispatching a substitute.
// Installed provider failure and original subject provenance remain covered.

import { EventEmitter } from "node:events";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, symlinkSync, unlinkSync, accessSync, constants as fsConstants, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { stageRuntimeCliMain, stageRuntimeMain } from "../../tools/cli/stage-runtime.mjs";


// Independent behavioral oracle; fixture setup adapted from the existing OCR public-entry test.
// Zero-dispatch cases use actual CLI transport configuration, never an injected runner/provider.
const roots = [];

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function git(cwd, args) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key];
  env.GIT_OPTIONAL_LOCKS = "0";
  return execFileSync("git", args, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "code-review-ocr-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub OCR routing test"]);
  git(repo, ["config", "user.email", "ocr-routing@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "ocr routing fixture\n", "utf8");
  git(repo, ["add", "README.md"]);
  git(repo, ["commit", "-qm", "fixture"]);
  const taskId = `code-review-ocr-${Math.random().toString(16).slice(2)}`;
  const worktreeRoot = join(root, "worktree");
  git(repo, ["worktree", "add", "-q", "-b", `task/workflowhub/${taskId}`, worktreeRoot, "main"]);
  const taskDir = join(root, "Projects", "workflowhub", "tasks", taskId);
  mkdirSync(taskDir, { recursive: true });
  writeFileSync(join(taskDir, "task.json"), JSON.stringify({
    schema_version: "1.0.0", record_model: "vnext-single-write", activation_cohort: "post",
    project_name: "workflowhub", task_id: taskId, created_at: "2026-10-03T00:00:00.000Z",
    target_repo_root: worktreeRoot, workspace_mode: "existing", workspace_root: worktreeRoot,
    issue_ids: [], inputs: {},
  }));
  writeFileSync(join(taskDir, "facts.jsonl"), "");
  const materialRoot = join(worktreeRoot, "specs", taskId);
  mkdirSync(join(materialRoot, "phases"), { recursive: true });
  writeFileSync(join(materialRoot, "decision-log.md"), "# Decision log\n\n## 任务身份\n\n- **任务类型**：普通任务\n");
  const gate = "npx --no-install vitest run tests/contract/code-review-ocr.test.mjs --reporter=dot";
  const paths = ["prior-one.md", "prior-two.md", "README.md"];
  const trace = paths.map((_file, i) => `| R-001 | FR-1 | AC-1 | P${i + 1}/T00${i + 1} | ORACLE-OCR-ROUTING |`);
  writeFileSync(join(materialRoot, "spec.md"), [
    "# Owned OCR routing fixture", "- **FR-1**：OCR availability and no executor substitution.",
    "- [ ] **AC-1 — OCR routing**", "  - **需求**：FR-1",
    "  - **验证方法**：actual assertions in this frozen OCR routing test.",
    "  - **通过条件**：actual routing and failure assertions pass.", "  - **失败条件**：wrong route or false availability.",
    "## 实现设计（全局权威）", "### Code Anchors", "The owned source is `README.md`.",
    "### Interfaces and Failure Semantics", "Preserve current code surface and unavailable provider errors.",
    "### Requirement-to-Task Trace", "| source | FR | AC | task | oracle |", "| --- | --- | --- | --- | --- |", ...trace,
    "### Global Verification Strategy", `\`${gate}\``, "",
  ].join("\n"));
  writeFileSync(join(materialRoot, "phases", "index.md"), [
    "# Phase index", "## Execution Index",
    "| phase | authority ref | semantic anchor | write set | dependency | consumer |", "| --- | --- | --- | --- | --- | --- |",
    ...paths.map((file, i) => `| \`P${i + 1}\` | \`phases/P${i + 1}.md\` | \`phase-p${i + 1}\` | \`${file}\` | ${i === 0 ? "none" : `P${i}`} | OCR routing fixture |`), "",
  ].join("\n"));
  for (const [i, file] of paths.entries()) {
    const n = i + 1;
    writeFileSync(join(materialRoot, "phases", `P${n}.md`), [
      `# Phase P${n} — owned fixture`, "- **Global spec**：`spec.md`", `- **Write set**：\`${file}\``,
      `- **Dependency**：${i === 0 ? "none" : `P${i}`}`, "- **Consumer**：OCR routing fixture", "## L0",
      `- **gate_cmd**：\`${gate}\``, "- **expected_exit**：0 only after actual assertions pass",
      "- **oracle**：ORACLE-OCR-ROUTING", "- **evidence_path**：quality/tests/output/owned-fixture.output",
      "- **STOP**：preserve an actual routing failure", "- **Done**：actual assertions only, not production quality", "## L1",
      `### T00${n} — owned routing fixture`, "- **Source / FR / AC**：R-001 / FR-1 / AC-1",
      `- **Files / symbols**：\`${file}\` (symbol: N/A — fixture source text)`, "- **Action**：read the actual routing fixture",
      "- **Inputs**：owned Git and plain task metadata", "- **Outputs / failure**：same code surface or observable unavailable",
      "- **Boundary / DO NOT TOUCH**：no production or user repositories", `- **Dependency**：${i === 0 ? "none" : `T00${i}`}`,
      "- **Test tier / skill**：feature / backend-testing", "- **Scenario / fixture or service**：owned CLI and injected reviewer result",
      `- **RED/GREEN gate_cmd**：\`${gate}\``, "- **expected_exit**：RED nonzero; GREEN 0",
      "- **RED target failure**：ORACLE-OCR-ROUTING wrong routing assertion fails", "- **GREEN oracle**：ORACLE-OCR-ROUTING actual assertions",
      "- **Evidence**：quality/tests/output/owned-fixture.output", "- **STOP / recovery**：no claimed provider call without one",
      "- **Coverage limit**：no external provider quality", "- **Done**：actual targeted assertions only", "## L2",
      "Owned fixture data, not a WorkflowHub execution permit.", "",
    ].join("\n"));
  }
  writeFileSync(join(worktreeRoot, "README.md"), "OCR implementation under review\n");

  // host config：third_review/wh_review 可解析，但 provider 命令指向不存在路径
  // （「config 无可用 provider」）。
  const home = join(root, "home");
  const hostDir = join(home, ".config", "workflowhub");
  mkdirSync(hostDir, { recursive: true });
  const attachmentRoot = join(root, "attachments");
  mkdirSync(attachmentRoot);
  const configPath = join(root, "providers.json");
  writeFileSync(configPath, JSON.stringify({
    tiers: [["codex/luna"]],
    providers: { "codex/luna": { enabled: true, model: "reviewer-model", command: join(root, "missing-ocr-provider") } },
    attachment_roots: [{ root: attachmentRoot, sources: [".wh-review-packets"] }],
  }));
  writeFileSync(join(hostDir, "config.json"), JSON.stringify({
    task_dir: root,
    third_review: { command: [join(root, "missing-wh-review-broker")], config: configPath, attachment_root: attachmentRoot },
    wh_review: { version: 2, stages: { "build-code": { initial: ["codex/luna"], mode: "full_only", minimum_heterologous: 1 } } },
  }));
  return { root, home, taskId, taskDir, worktreeRoot };
}

const ENV_KEYS = [
  "HOME", "WORKFLOWHUB_TASK_DIR", "PATH",
  "CODEX_SESSION_ID", "CODEX_THREAD_ID", "CODEX_ROLLOUT_PATH", "WORKFLOWHUB_CODEX_ROLLOUT_PATH",
];

async function withRuntimeEnvironment(updates, action) {
  const previous = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  for (const key of ENV_KEYS) {
    if (updates[key] === undefined) delete process.env[key];
    else process.env[key] = updates[key];
  }
  try {
    return await action();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

// PATH 中无可用 ocr（本机可能装有真实 ocr，须逐目录剔除）。
function pathWithoutOcr() {
  return (process.env.PATH ?? "").split(":").filter(Boolean).filter((dir) => {
    try {
      accessSync(join(dir, "ocr"), fsConstants.X_OK);
      return false;
    } catch {
      return true;
    }
  }).join(":");
}

function writeOcrStub(dir, version) {
  mkdirSync(dir);
  const stub = join(dir, "ocr");
  writeFileSync(stub, `#!/bin/sh
if [ "$1" = "--version" ]; then
  printf 'open-code-review v${version} (test-stub) darwin/arm64\\n'
  exit 0
fi
exit 1
`, { mode: 0o700 });
  return dir;
}

function reviewRequest() {
  return {
    stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P3", surface: "code",
    host_provider: "codex/luna",
    materials: { approved_spec:"Current OCR availability and unavailable routing.", phase_map:"README.md is the owned code consumer.", test_evidence:"Controlled routing and original provider failure.", acceptance_criteria: "AC-1: the review records the OCR availability fact without substitution." },
  };
}

function unavailableOcrResult(request) {
  return {
    status: "unavailable", stage: request.stage, review_track: null, review_kind: null,
    subject_kind: request.subject_kind, phase_id: request.phase_id ?? null,
    review_scope: request.review_scope ?? null,
    runtime_id: "ocr-unavailable-fixture", outcome: "unavailable",
    findings: [], dispatch_state: "dispatched",
    error: { code: "OCR_ALL_PROVIDERS_FAILED", message: "controlled OCR provider failure" },
    provider_results: [{
      provider: "codex/luna", status: "failed", process_outcome: "exit_nonzero", parse_outcome: null,
      identity: { provider: "codex/luna", adapter: "codex", source_id: "fixture/source", config_id: "fixture/config", model: "fixture-model" },
      error: { code: "PROCESS_FAILED", message: "controlled OCR provider failure" },
      timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 }, usage: null,
      evidence_anchor_valid: [],
    }],
  };
}

function files(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(join(root, e.name)) : [join(root, e.name)]);
}
async function runObserved(observerFactory, { controlled = false, signalProcess } = {}) {
  const state = fixture(), controller = new AbortController();
  const marker = join(state.root, 'provider-spawned');
  const executable = `#!/bin/sh\nprintf spawned >> '${marker}'\nexit 7\n`;
  for (const name of ['missing-ocr-provider', 'missing-wh-review-broker']) writeFileSync(join(state.root, name), executable, {mode:0o700});
  const bin = writeOcrStub(join(state.root, 'bin'), '1.12.9');
  writeFileSync(join(bin, 'ocr'), `#!/bin/sh\nif [ "$1" = "--version" ]; then printf 'open-code-review v1.12.9\\n'; exit 0; fi\nprintf spawned >> '${marker}'\nexit 7\n`, {mode:0o700});
  const input = join(state.root, 'observer-input.json'), request = reviewRequest();
  writeFileSync(input, JSON.stringify({request}));
  let calls = 0;
  const services = { reviewSignal: controller.signal, ...(signalProcess ? {signalProcess} : {}) };
  if (observerFactory) services.onReviewMaterials = observerFactory({state, controller});
  if (controlled) services.runOcrDelegationRound = async () => {calls++; return unavailableOcrResult(request);};
  return withRuntimeEnvironment({HOME:state.home,WORKFLOWHUB_TASK_DIR:state.root,PATH:`${bin}:${pathWithoutOcr()}`}, async () => {
    const saved = await stageRuntimeCliMain(['review','--action=record','--stage=build-code','--project=workflowhub',`--task=${state.taskId}`,`--input=${input}`], {cwd:state.worktreeRoot, services});
    return {state, saved, receipt:JSON.parse(readFileSync(join(state.taskDir,saved.result_ref),'utf8')), calls, marker, remaining: files(join(state.root,'attachments'))};
  });
}
function expectNoDispatchAndCleanup(result) {
  expect(existsSync(result.marker)).toBe(false);
  expect(result.remaining).toEqual([]);
  expect(result.receipt.status).toBe('unavailable');
  expect(result.receipt.provider_results).toEqual([]);
}

describe('N3 P2 material observer', () => {
  it('reads every manifest member and source bytes before an owned abort with real cancellation and cleanup', async () => {
    let observed = 0, retainedRead;
    const result = await runObserved(({state,controller}) => async view => {
      observed++;
      expect(Object.keys(view).sort()).toEqual(['manifest','materialId','readMaterial']);
      expect(view.materialId).toMatch(/^[a-f0-9]{64}$/);
      expect(view.manifest.length).toBeGreaterThan(0);
      expect(new Set(view.manifest.map(e=>e.path)).size).toBe(view.manifest.length);
      let source = false;
      for (const entry of view.manifest) {
        const bytes = await view.readMaterial(entry.path);
        expect(Buffer.isBuffer(bytes)).toBe(true);
        expect(bytes.length).toBe(entry.bytes);
        expect(createHash('sha256').update(bytes).digest('hex')).toBe(entry.sha256);
        if(entry.path === 'source.json') {
          const identity=JSON.parse(bytes.toString('utf8'));
          expect(identity).toBeTypeOf('object');
          expect(identity.captured_head).toBe(git(state.worktreeRoot,['rev-parse','HEAD']));
          expect(identity.baseline_commit).toBe(git(state.worktreeRoot,['rev-parse','main']));
          source=true;
        }
        if (bytes.length) { const first=bytes[0];bytes[0]^=255;expect((await view.readMaterial(entry.path))[0]).toBe(first); }
      }
      expect(source).toBe(true);
      const readmes=view.manifest.filter(e=>e.path==='README.md'||e.path==='repos/wh/README.md');
      expect(readmes).toHaveLength(1);
      expect((await view.readMaterial(readmes[0].path)).toString('utf8')).toBe('OCR implementation under review\n');
      const diffs=view.manifest.filter(e=>e.path==='changes.diff'||/^diff-shards\/[^/]+\.diff$/.test(e.path));
      expect(diffs.length).toBeGreaterThan(0);
      const diff=(await Promise.all(diffs.map(e=>view.readMaterial(e.path)))).map(b=>b.toString('utf8')).join('\n');
      expect(diff).toContain('diff --git a/README.md b/README.md');
      expect(diff).toContain('-ocr routing fixture\n');
      expect(diff).toContain('+OCR implementation under review\n');
      retainedRead = view.readMaterial;
      await Promise.resolve();
      controller.abort('independent-complete-package-preflight');
    });
    expect(observed).toBe(1);
    expectNoDispatchAndCleanup(result);
    expect(result.receipt.error.code).toBe('REVIEW_CANCELLED');
    await expect(async()=>retainedRead('source.json')).rejects.toThrow();
  });

  it('preserves an observer error as unavailable without provider dispatch and disposes the packet', async () => {
    let observed=0;
    const result=await runObserved(()=>async()=>{observed++;throw Object.assign(new Error('independent observer failed'),{code:'N3_OBSERVER_FAILURE'});});
    expect(observed).toBe(1);expectNoDispatchAndCleanup(result);
    expect(result.receipt.error.code).toBe('N3_OBSERVER_FAILURE');
    expect(result.receipt.error.message).toContain('independent observer failed');
  });

  it('rejects nonmember and escaping reads without dispatch', async () => {
    let checked=0;
    const result=await runObserved(({controller})=>async view=>{
      for(const path of ['../outside','/etc/passwd','missing.txt','source.json/../source.json']) {
        await expect(async()=>view.readMaterial(path)).rejects.toThrow();checked++;
      }
      controller.abort('boundary-negative-control');
    });
    expect(checked).toBe(4);expectNoDispatchAndCleanup(result);
    expect(result.receipt.error.code).toBe('REVIEW_CANCELLED');
  });

  it('rejects modified member bytes against the actual manifest hash', async () => {
    let checked=0;
    const result=await runObserved(({state,controller})=>async view=>{
      const entry=view.manifest.find(e=>e.bytes>0);expect(entry).toBeDefined();
      const member=files(join(state.root,'attachments')).find(p=>p.endsWith('/'+entry.path)&&createHash('sha256').update(readFileSync(p)).digest('hex')===entry.sha256);
      expect(member).toBeDefined();
      const bytes=readFileSync(member);bytes[0]^=255;writeFileSync(member,bytes);
      await expect(async()=>view.readMaterial(entry.path)).rejects.toThrow();checked++;
      controller.abort('tamper-negative-control');
    });
    expect(checked).toBe(1);expectNoDispatchAndCleanup(result);
    expect(result.receipt.error.code).toBe('REVIEW_CANCELLED');
  });

  it('rejects a same-byte symlink substituted for an authenticated member', async () => {
    let checked=0;
    const result=await runObserved(({state,controller})=>async view=>{
      const entries=view.manifest.filter(e=>e.path==='review-instructions.md');
      expect(entries).toHaveLength(1);
      const entry=entries[0];
      const candidates=files(join(state.root,'attachments')).filter(p=>p.endsWith('/'+entry.path)&&createHash('sha256').update(readFileSync(p)).digest('hex')===entry.sha256);
      expect(candidates).toHaveLength(1);
      const member=candidates[0], target=join(state.root,'same-byte-member.txt');
      writeFileSync(target,readFileSync(member));
      unlinkSync(member);symlinkSync(target,member);
      expect(createHash('sha256').update(readFileSync(member)).digest('hex')).toBe(entry.sha256);
      await expect(async()=>view.readMaterial(entry.path)).rejects.toMatchObject({code:'TASK_PATH_ALIAS'});checked++;
      controller.abort('same-byte-symlink-negative-control');
    });
    expect(checked).toBe(1);expectNoDispatchAndCleanup(result);
    expect(result.receipt.error.code).toBe('REVIEW_CANCELLED');
  });

  it.each(['host', 'SIGINT'])('settles a pending observer on %s cancellation and revokes its reader', async mode => {
    const signalProcess=new EventEmitter();
    let startedResolve, release, captured, lateFinished=false;
    const started=new Promise(resolve=>{startedResolve=resolve;});
    const pending=runObserved(({controller})=>(view, options={})=>{
      captured={view,signal:options.signal,controller};
      const deferred=new Promise((resolve,reject)=>{release=()=>{
        lateFinished=true;
        if(mode==='host')reject(Object.assign(new Error('late observer rejection'),{code:'N3_LATE_OBSERVER'}));
        else resolve();
      };});
      startedResolve();return deferred;
    },{signalProcess});
    await started;
    if(mode==='host')captured.controller.abort('pending-host-cancel');else signalProcess.emit('SIGINT');
    let outcome, result, timer, receiptBeforeLate;
    try {
      outcome=await Promise.race([
        pending.then(value=>({settled:true,value})),
        new Promise(resolve=>{timer=setTimeout(()=>resolve({settled:false}),500);}),
      ]);
      if(outcome.settled){
        result=outcome.value;
        receiptBeforeLate=readFileSync(join(result.state.taskDir,result.saved.result_ref));
        expect(lateFinished).toBe(false);
        await expect(async()=>captured.view.readMaterial('source.json')).rejects.toThrow();
      }
    } finally {
      clearTimeout(timer);release();result=await pending;
    }
    expect(outcome?.settled,'cancellation must settle before the test releases the pending observer').toBe(true);
    expect(captured.signal).toBeInstanceOf(AbortSignal);expect(captured.signal.aborted).toBe(true);
    expectNoDispatchAndCleanup(result);expect(result.receipt.error.code).toBe('REVIEW_CANCELLED');
    const before=receiptBeforeLate;
    await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>setImmediate(resolve));
    expect(readFileSync(join(result.state.taskDir,result.saved.result_ref))).toEqual(before);
    expect(existsSync(result.marker)).toBe(false);
    expect(signalProcess.listenerCount('SIGINT')).toBe(0);expect(signalProcess.listenerCount('SIGTERM')).toBe(0);
    if(mode==='SIGINT')expect(signalProcess.exitCode).toBe(130);
  });

  it('keeps the existing no-observer controlled route and unavailable result', async () => {
    const result=await runObserved(null,{controlled:true});
    expect(result.calls).toBe(1);expect(result.receipt.error.code).toBe('OCR_ALL_PROVIDERS_FAILED');expect(result.remaining).toEqual([]);
  });

  it('continues the original controlled route after an observer returns without cancellation', async () => {
    let observed=0;
    const result=await runObserved(()=>async view=>{observed++;expect(view.manifest.length).toBeGreaterThan(0);return {status:'available',findings:[]};},{controlled:true});
    expect(observed).toBe(1);expect(result.calls).toBe(1);
    expect(result.receipt.error.code).toBe('OCR_ALL_PROVIDERS_FAILED');expect(result.remaining).toEqual([]);
  });
});
