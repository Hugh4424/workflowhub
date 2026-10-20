import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openTask } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { ArtifactDir } from "../../runtime/evidence/artifact-dir.mjs";
import { writeStageRow } from "../../runtime/task/task-store.mjs";
import { prepareTaskBoundBuildCodeReviewBundle, stageRuntimeCliMain } from "../../tools/cli/stage-runtime.mjs";
// ORACLE-LIGHT-IMPL-REVIEW: assertions frozen after first target RED; changes require TCR.
const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function git(cwd, args) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key];
  env.GIT_OPTIONAL_LOCKS = "0";
  return execFileSync("git", args, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

async function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "ocr-route-current-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub OCR fallback test"]);
  git(repo, ["config", "user.email", "ocr-fallback@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "ocr fallback fixture\n", "utf8");
  git(repo, ["add", "README.md"]);
  git(repo, ["commit", "-qm", "fixture"]);
  const taskId = `ocr-route-current-${Math.random().toString(16).slice(2)}`;
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
  const gate = "npx --no-install vitest run tests/contract/ocr-route-current.test.mjs --reporter=dot";
  const paths = ["prior-one.md", "prior-two.md", "README.md"];
  const trace = paths.map((_file, i) => `| R-001 | FR-1 | AC-1 | P${i + 1}/T00${i + 1} | ORACLE-OCR-FALLBACK |`);
  writeFileSync(join(materialRoot, "spec.md"), [
    "# Owned OCR routing fixture", "- **FR-1**：OCR availability and same-surface fallback.",
    "- [ ] **AC-1 — OCR routing**", "  - **需求**：FR-1",
    "  - **验证方法**：actual assertions in this frozen fallback test.",
    "  - **通过条件**：actual routing and failure assertions pass.", "  - **失败条件**：wrong route or false fallback.",
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
      "- **oracle**：ORACLE-OCR-FALLBACK", "- **evidence_path**：quality/tests/output/owned-fixture.output",
      "- **STOP**：preserve an actual routing failure", "- **Done**：actual assertions only, not production quality", "## L1",
      `### T00${n} — owned routing fixture`, "- **Source / FR / AC**：R-001 / FR-1 / AC-1",
      `- **Files / symbols**：\`${file}\` (symbol: N/A — fixture source text)`, "- **Action**：read the actual routing fixture",
      "- **Inputs**：owned Git and plain task metadata", "- **Outputs / failure**：same code surface or observable unavailable",
      "- **Boundary / DO NOT TOUCH**：no production or user repositories", `- **Dependency**：${i === 0 ? "none" : `T00${i}`}`,
      "- **Test tier / skill**：feature / backend-testing", "- **Scenario / fixture or service**：owned CLI and injected reviewer result",
      `- **RED/GREEN gate_cmd**：\`${gate}\``, "- **expected_exit**：RED nonzero; GREEN 0",
      "- **RED target failure**：ORACLE-OCR-FALLBACK wrong routing assertion fails", "- **GREEN oracle**：ORACLE-OCR-FALLBACK actual assertions",
      "- **Evidence**：quality/tests/output/owned-fixture.output", "- **STOP / recovery**：no claimed provider call without one",
      "- **Coverage limit**：no external provider quality", "- **Done**：actual targeted assertions only", "## L2",
      "Owned fixture data, not a WorkflowHub execution permit.", "",
    ].join("\n"));
  }
  writeFileSync(join(worktreeRoot, "README.md"), "fallback implementation under review\n");

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
    providers: { "codex/luna": { enabled: true, model: "reviewer-model", command: process.execPath } },
    attachment_roots: [{ root: attachmentRoot, sources: [".wh-review-packets"] }],
  }));
  writeFileSync(join(hostDir, "config.json"), JSON.stringify({
    task_dir: root,
    third_review: { command: [process.execPath], config: configPath, attachment_root: attachmentRoot },
    wh_review: { version: 2, stages: { "build-code": { initial: ["codex/luna"], mode: "full_only" } } },
  }));
  const task = openTask(taskDir, { projectName: "workflowhub", taskId });
  const workspace = await openCurrentTaskWorkspace(task);
  const bin=join(root,"bin");mkdirSync(bin);
  writeFileSync(join(bin,"ocr"),`#!${process.execPath}
if(process.argv[2]==="--version")console.log("1.12.9");else process.exitCode=9;
`,{mode:0o700});
  return { root, repo, home, taskId, taskDir, worktreeRoot, task, workspace, bin };
}

async function owned(state, action) {
  const saved = Object.fromEntries(['HOME','PATH','WORKFLOWHUB_TASK_DIR'].map(key=>[key,process.env[key]]));
  process.env.HOME=state.home; process.env.PATH=`${state.bin}:${saved.PATH ?? '/usr/bin:/bin'}`; process.env.WORKFLOWHUB_TASK_DIR=state.root;
  try { return await action(); } finally { for(const [key,value] of Object.entries(saved)) if(value===undefined) delete process.env[key]; else process.env[key]=value; }
}
function light(state) {
  const root=join(state.worktreeRoot,'specs',state.taskId);
  writeFileSync(join(root,'spec.md'),'# Ordinary light implementation\n\nWrite set: README.md\nAC-1: implementation visible in README and outside.md\nOracle: both actual changed files reviewed\nCommand: node --test tests/feature.mjs\n');
  writeFileSync(join(root,'phases','index.md'),'## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n| `P1` | `phases/P1.md` |\n');
  writeFileSync(join(root,'phases','P1.md'),'# P1\nWrite set: README.md\nAC-1; oracle: actual output; command: node --test tests/feature.mjs\n');
  rmSync(join(root,'phases','P2.md')); rmSync(join(root,'phases','P3.md'));
  writeFileSync(join(state.worktreeRoot,'outside.md'),'outside Phase write set but inside whole implementation\n');
}
const materials={approved_spec:'# Light spec\nAC-1: both changes visible',acceptance_criteria:'AC-1: review the entire actual implementation',test_evidence:'node --test tests/feature.mjs; exit_code=0; owned controlled evidence'};
function request(extra={}) { return {stage:'build-code',review_scope:'phase',subject_kind:'phase',host_provider:'codex/luna',materials:{...materials},...extra}; }
function reviewResult(req,id) { return {status:'available',stage:req.stage,review_scope:req.review_scope??null,review_kind:null,material_id:id,runtime_id:'light-review-stub',outcome:'completed',findings:[],provider_results:[{provider:'codex/luna',status:'completed',identity:{provider:'codex/luna',adapter:'codex',source_id:'fixture/source',config_id:'fixture/config',model:'fixture-model'},error:null,timing:{started_at_ms:1,completed_at_ms:2,duration_ms:1},usage:null,evidence_anchor_valid:[]}]}; }
async function record(state,req,services={}) {
  const path=join(state.root,'request.json');writeFileSync(path,JSON.stringify({request:req}));
  return owned(state,()=>stageRuntimeCliMain(['review','--action=record','--stage=build-code','--project=workflowhub',`--task=${state.taskId}`,`--task-path=${state.taskDir}`,`--input=${path}`],{cwd:state.worktreeRoot,services}));
}
async function status(state,stage='make-decision') {
  return owned(state,()=>stageRuntimeCliMain(['status','--action=begin',`--stage=${stage}`,'--project=workflowhub',`--task=${state.taskId}`,`--task-path=${state.taskDir}`],{cwd:state.worktreeRoot}));
}
async function context(state) { return {task:state.task,manifest:state.task.manifest,workspace:await openCurrentTaskWorkspace(state.task),artifacts:ArtifactDir.open(state.worktreeRoot,state.task)}; }
function bundleText(bundle) { return bundle.manifest.filter(e=>e.path==='changes.diff'||/^diff-shards\/.+\.diff$/.test(e.path)).map(e=>readFileSync(join(bundle.bundleRoot,e.path),'utf8')).join('\n'); }

describe('ORACLE-LIGHT-IMPL-REVIEW',()=>{
  it('records one whole-workspace build-code review while retaining only the make-decision stage',async()=>{
    const f=await fixture();light(f);let calls=0,delivered;
    const result=await record(f,request(),{runReviewRound:async()=>{throw new Error('unexpected provider fallback');},runOcrDelegationRound:async(req,{bundle})=>{
      calls++;delivered={diff:bundleText(bundle),source:JSON.parse(readFileSync(join(bundle.bundleRoot,'source.json'),'utf8')),paths:bundle.manifest.map(e=>e.path)};
      return reviewResult(req,bundle.materialId);
    }});
    expect(result.status,JSON.stringify(result)).toBe('available');expect(calls).toBe(1);
    expect(result.result_ref).toMatch(/^quality\/reviews\/.*build-code-phase.*\.json$/);
    const canonical=JSON.parse(f.task.readRecord(result.result_ref));expect(canonical).toMatchObject({task_id:f.taskId,stage:'build-code',review_kind:null,authoritative:false});
    expect(delivered.diff).toContain('outside.md');expect(delivered.diff).toContain('README.md');expect(delivered.diff).toContain('outside Phase write set');
    expect(delivered.paths).toContain('requirements/acceptance_criteria.md');expect(delivered.paths.some(p=>p.includes('approved_spec'))).toBe(true);expect(delivered.paths.some(p=>p.includes('test_evidence'))).toBe(true);
    expect(delivered.source.contract_facts.contract_ok).toBeNull();
    expect(f.task.readRecord('facts.jsonl')).toBe('');
    await writeStageRow(f.taskDir,{stage:'make-decision',source:'controlled-light-fixture',review_origin:'conducted',review_result_ref:result.result_ref});
    const projected=await status(f);expect(projected.quality_status).toBe('incomplete');expect(projected.facts.map(r=>r.stage)).toEqual(['make-decision']);
  });
  it.each(['approved_spec','acceptance_criteria','test_evidence'])('rejects missing %s before provider dispatch',async key=>{
    const f=await fixture();light(f);const req=request();delete req.materials[key];let calls=0;
    const result=await record(f,req,{runOcrDelegationRound:async()=>{calls++;throw new Error('must not dispatch');}});
    expect(result.status).toBe('unavailable');expect(calls).toBe(0);const saved=JSON.parse(f.task.readRecord(result.result_ref));expect(JSON.stringify(saved.error)).toContain(key);expect(f.task.readRecord('facts.jsonl')).toBe('');
  });
  it.each([['make-decision','verify-code',false],['build-plan','build-code',false],['build-code','build-code',true],['make-decision','make-decision',true]])('preserves identity for %s row and %s review',async(rowStage,reviewStage,allowed)=>{
    const f=await fixture();const ref='quality/reviews/owned.json';mkdirSync(join(f.taskDir,'quality','reviews'),{recursive:true});writeFileSync(join(f.taskDir,ref),JSON.stringify({task_id:f.taskId,stage:reviewStage,status:'available'}));
    await writeStageRow(f.taskDir,{stage:rowStage,source:'controlled-identity-fixture',review_origin:'conducted',review_result_ref:ref});
    if(allowed)expect((await status(f,rowStage)).quality_status).toBe('incomplete');else await expect(status(f,rowStage)).rejects.toThrow('review result differs from current row identity');
  });
  it('rejects a different task even for the named cross-surface combination',async()=>{
    const f=await fixture();const ref='quality/reviews/wrong-task.json';mkdirSync(join(f.taskDir,'quality','reviews'),{recursive:true});writeFileSync(join(f.taskDir,ref),JSON.stringify({task_id:'other-task',stage:'build-code',status:'available'}));
    await writeStageRow(f.taskDir,{stage:'make-decision',source:'controlled-identity-fixture',review_origin:'conducted',review_result_ref:ref});await expect(status(f)).rejects.toThrow('review result differs from current row identity');
  });
  it('retains complex Phase selection and contract facts with a phase_id',async()=>{
    const f=await fixture();writeFileSync(join(f.worktreeRoot,'outside.md'),'not in complex Phase\n');
    const packet=await owned(f,async()=>prepareTaskBoundBuildCodeReviewBundle(await context(f),request({phase_id:'P3'})));
    try{const diff=bundleText(packet);expect(diff).toContain('README.md');expect(diff).not.toContain('outside.md');expect(JSON.parse(readFileSync(join(packet.bundleRoot,'source.json'),'utf8')).contract_facts.contract_ok).toBe(true);}finally{packet.dispose();}
  });
  it('does not demand a Phase contract for a trusted exact scope lacking phase_id',async()=>{
    const f=await fixture();light(f);const ctx=await context(f),head=git(f.worktreeRoot,['rev-parse','HEAD']);
    const scope={taskId:f.taskId,primaryRoot:f.worktreeRoot,repositories:[{id:'wh',sourceRoot:f.worktreeRoot,targetRepoRoot:f.worktreeRoot,baseCommit:head,expectedHead:head,expectedBranch:`task/workflowhub/${f.taskId}`,paths:['README.md','outside.md']}],evidenceFiles:[],authorizationSource:{confirmationRef:'controlled-fixture-explicit-scope',materialRefs:[]}};
    const packet=await owned(f,()=>prepareTaskBoundBuildCodeReviewBundle(ctx,request(),{reviewReadScope:scope}));
    try{const diff=bundleText(packet);expect(diff).toContain('outside.md');expect(diff).toContain('README.md');expect(JSON.parse(readFileSync(join(packet.bundleRoot,'source.json'),'utf8')).contract_facts.contract_ok).toBeNull();}finally{packet.dispose();}
  });
  // TCR-P2-LIGHT-QUALITY-TUPLE: protected enhancement reviewed in evidence/063.
  it('rejects a real single-Phase review when attached as whole-implementation quality',async()=>{
    const f=await fixture();writeFileSync(join(f.worktreeRoot,'outside.md'),'outside the P3 implementation review\n');let calls=0;
    const recorded=await record(f,request({phase_id:'P3'}),{runOcrDelegationRound:async(req,{bundle})=>{
      calls++;const diff=bundleText(bundle);expect(diff).toContain('README.md');expect(diff).not.toContain('outside.md');return reviewResult(req,bundle.materialId);
    }});
    expect(recorded.status).toBe('available');expect(calls).toBe(1);
    const actual=JSON.parse(f.task.readRecord(recorded.result_ref));expect(actual).toMatchObject({stage:'build-code',review_scope:'phase',subject_kind:'phase',review_kind:null,phase_id:'P3'});
    await writeStageRow(f.taskDir,{stage:'make-decision',source:'controlled-real-phase-cross-surface',review_origin:'conducted',review_result_ref:recorded.result_ref});
    await expect(status(f)).rejects.toThrow('review result differs from current row identity');
  });
  it.each([
    ['missing scope','review_scope',undefined],['nonphase scope','review_scope','document'],['null scope','review_scope',null],
    ['missing subject','subject_kind',undefined],['nonphase subject','subject_kind','worktree'],['null subject','subject_kind',null],
    ['missing kind','review_kind',undefined],['non-null kind','review_kind','mini_task.implementation'],
    ['single Phase','phase_id','P3'],['missing Phase identity','phase_id',undefined],['empty Phase identity','phase_id',''],
    ['different task with complete tuple','task_id','other-task'],
  ])('rejects %s in a cross-surface result without defaulting identity',async(_label,key,value)=>{
    const f=await fixture(),ref='quality/reviews/incomplete-light-identity.json';mkdirSync(join(f.taskDir,'quality','reviews'),{recursive:true});
    const actual={task_id:f.taskId,stage:'build-code',review_scope:'phase',subject_kind:'phase',review_kind:null,phase_id:null,status:'available'};
    if(value===undefined)delete actual[key];else actual[key]=value;
    writeFileSync(join(f.taskDir,ref),JSON.stringify(actual));
    await writeStageRow(f.taskDir,{stage:'make-decision',source:'controlled-single-field-cross-surface',review_origin:'conducted',review_result_ref:ref});
    await expect(status(f)).rejects.toThrow('review result differs from current row identity');
  });

});
