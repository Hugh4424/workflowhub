// Current semantic tuple and physically narrowed packet; the retired T0
// snapshot/attempt/pair/retry authentication machine is not a stage predicate.
import { execFileSync } from "node:child_process";
import { mkdirSync,mkdtempSync,readFileSync,realpathSync,rmSync,writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname,join,resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach,describe,expect,it } from "vitest";
import { ArtifactDir } from "../../runtime/evidence/artifact-dir.mjs";
import { openTask } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { compactReviewDiff } from "../../runtime/review/review-input-bounds.mjs";
import { recordSimpleReviewRequest } from "../../runtime/review/review-record-route.mjs";
import { createSimpleReviewPacket } from "../../skills/wh-review/scripts/simple-review-runner.mjs";
import { reviewInstructionsFor } from "../../skills/wh-review/scripts/review-materials.mjs";
import { prepareTaskBoundBuildCodeReviewBundle } from "../../tools/cli/stage-runtime.mjs";
const roots=[];afterEach(()=>{while(roots.length)rmSync(roots.pop(),{recursive:true,force:true});});
const repoRoot=resolve(dirname(fileURLToPath(import.meta.url)),"../..");const readRepo=p=>readFileSync(join(repoRoot,p),"utf8");
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
    providers: { "codex/luna": { enabled: true, model: "reviewer-model", command: join(root, "missing-ocr-provider") } },
    attachment_roots: [{ root: attachmentRoot, sources: [".wh-review-packets"] }],
  }));
  writeFileSync(join(hostDir, "config.json"), JSON.stringify({
    task_dir: root,
    third_review: { command: [join(root, "missing-wh-review-broker")], config: configPath, attachment_root: attachmentRoot },
    wh_review: { version: 2, stages: { "build-code": { initial: ["codex/luna"], mode: "full_only", minimum_heterologous: 1 } } },
  }));
  const task = openTask(taskDir, { projectName: "workflowhub", taskId });
  const workspace = await openCurrentTaskWorkspace(task);
  const bin=join(root,"bin");mkdirSync(bin);
  writeFileSync(join(bin,"ocr"),`#!${process.execPath}
if(process.argv[2]==="--version")console.log("1.12.9");else process.exitCode=9;
`,{mode:0o700});
  return { root, repo, home, taskId, taskDir, worktreeRoot, task, workspace, bin };
}

const phaseRequest={stage:"build-code",review_scope:"phase",subject_kind:"phase",phase_id:"P3",surface:"code",materials:{approved_spec:"spec.md",acceptance_criteria:"AC-1: OCR routing"}};
const unavailable=()=>({status:"unavailable",outcome:"unavailable",dispatch_state:"blocked_before_dispatch",provider_results:[],findings:[],error:{code:"OWNED_UNAVAILABLE",message:"no external model"}});
async function context(f){return{task:f.task,manifest:f.task.manifest,workspace:await openCurrentTaskWorkspace(f.task),artifacts:ArtifactDir.open(f.worktreeRoot,f.task)};}
describe("current request tuple and physical review scope",()=>{
 it.each(["design","implementation"])("records the actual registered mini-task %s semantic identity",async mode=>{const f=await fixture(),request={...phaseRequest,review_kind:`mini_task.${mode}`};let calls=0;const saved=await recordSimpleReviewRequest({taskDir:f.taskDir,request,runRound:async input=>{calls++;expect(input.review_kind).toBe(request.review_kind);return unavailable();}});const value=JSON.parse(f.task.readRecord(saved.result_ref));expect(calls).toBe(1);expect(value).toMatchObject({stage:"build-code",review_kind:request.review_kind,phase_id:"P3",review_scope:"phase",authoritative:false});});
 it("physically prepares normal verify-code AC text and implementation diff without a snapshot authority",async()=>{const f=await fixture(),ctx=await context(f),attachmentRoot=join(f.root,"owned-review");mkdirSync(attachmentRoot);const acceptance="AC-1: OCR routing";const request={stage:"verify-code",subject_kind:"worktree",materials:{changed_files:"README.md",implementation_assessment:"Inspect actual README code.",test_context:"This is a controlled packet test.",open_risks:"No external quality claim.",acceptance_criteria:acceptance}};const bundle=prepareTaskBoundBuildCodeReviewBundle(ctx,request,{loadConfig:()=>({attachmentRoot})});try{expect(readFileSync(join(bundle.bundleRoot,"requirements/acceptance_criteria.md"),"utf8")).toBe(acceptance);expect(readFileSync(join(bundle.bundleRoot,"changes.diff"),"utf8")).toContain("fallback implementation under review");expect(bundle.materialId).toBeTruthy();}finally{bundle.dispose();}});
 it("narrows phase physical diff to its write set and retains the submitted bytes after an outside change",async()=>{const f=await fixture(),ctx=await context(f),attachmentRoot=join(f.root,"owned-phase-review");mkdirSync(attachmentRoot);writeFileSync(join(f.worktreeRoot,"outside.md"),"outside owned source\n");const bundle=prepareTaskBoundBuildCodeReviewBundle(ctx,phaseRequest,{loadConfig:()=>({attachmentRoot})});try{const bytes=readFileSync(join(bundle.bundleRoot,"changes.diff"));expect(bytes.toString()).toContain("README.md");expect(bytes.toString()).not.toContain("outside.md");writeFileSync(join(f.worktreeRoot,"outside.md"),"later outside source\n");expect(readFileSync(join(bundle.bundleRoot,"changes.diff"))).toEqual(bytes);}finally{bundle.dispose();}});
 it("rejects unknown formal stage and caller-provided generated review instructions through the actual packet input API",()=>{expect(()=>createSimpleReviewPacket({stage:"no-such-stage",materials:{approved_spec:"owned"}})).toThrow(/unknown review stage/);expect(()=>createSimpleReviewPacket({...phaseRequest,materials:{approved_spec:"owned",review_instructions:"caller authored instructions"}})).toThrow(/MATERIAL_FORBIDDEN/);});
 it("records requests with absent or empty caller host and does not use historical host identity as authority",async()=>{const f=await fixture();let calls=0;for(const request of [phaseRequest,{...phaseRequest,host_provider:""}]){const saved=await recordSimpleReviewRequest({taskDir:f.taskDir,request,runRound:async()=>{calls++;return unavailable();}});expect(saved.status).toBe("unavailable");}expect(calls).toBe(2);for(const p of ["runtime/review/review-record-route.mjs","skills/wh-review/scripts/simple-review-runner.mjs","skills/wh-review/scripts/third-review-host-config.mjs"])expect(readRepo(p)).not.toMatch(/host_provider is required/);});
 it("adds no asynchronous public command or persisted phase/session authority",()=>{const source=readRepo("tools/cli/stage-runtime.mjs");expect(source).not.toMatch(/--async\b/);expect(source).not.toMatch(/["']collect["']/);const current=JSON.parse(readRepo("runtime/review/schemas/result.schema.json"));expect(JSON.stringify(current)).not.toContain("result_invalid");});
});

describe("ordinary current diff scope",()=>{
  it("selects directory-owned changed paths without matching a sibling prefix", () => {
    const section = (path) => `diff --git a/${path} b/${path}\n--- a/${path}\n+++ b/${path}\n@@ -1 +1 @@\n-old\n+new\n`;
    const diff = section("tests/review/owned.test.mjs") + section("tests/review-other/foreign.test.mjs");
    const selected = compactReviewDiff(diff, { writeSet: ["tests/review/"] }).diff;
    expect(selected).toContain("tests/review/owned.test.mjs");
    expect(selected).not.toContain("tests/review-other/foreign.test.mjs");
  });

  it("selects renamed sections using decoded Git-quoted paths on either side", () => {
    const renamed = 'diff --git "a/docs/old name.md" "b/docs/\\346\\226\\260 name.md"\n'
      + 'similarity index 100%\nrename from docs/old name.md\nrename to "docs/\\346\\226\\260 name.md"\n';
    const foreign = 'diff --git a/docs/foreign.md b/docs/foreign.md\n--- a/docs/foreign.md\n+++ b/docs/foreign.md\n';
    expect(compactReviewDiff(renamed + foreign, { writeSet: ["docs/新 name.md"] }).diff).toBe(renamed);
    expect(compactReviewDiff(renamed + foreign, { writeSet: ["docs/old name.md"] }).diff).toBe(renamed);
    expect(compactReviewDiff(renamed + foreign).diff).toBe(renamed + foreign);
  });

  it("narrows the review packet to declared write set ∩ real diff without binding identity", () => {
    const section = (path) => `diff --git a/${path} b/${path}\n--- a/${path}\n+++ b/${path}\n@@ -1 +1 @@\n-old\n+new\n`;
    const diff = [section("runtime/review/in-scope.mjs"), section("docs/out-of-scope.md")].join("");
    const compacted = compactReviewDiff(diff, { writeSet: ["runtime/review/in-scope.mjs", "runtime/review/untouched.mjs"] });
    expect(compacted.diff).toContain("runtime/review/in-scope.mjs");
    expect(compacted.diff).not.toContain("docs/out-of-scope.md");
    expect(compacted.diff).not.toContain("runtime/review/untouched.mjs");
    expect(JSON.stringify(compacted.index)).not.toMatch(/material_id|snapshot_tree|material_revision|task_id/);
  });
});
describe("ORACLE-SKL-003 runner reviewer skills follow stage-skill-plan.json", () => {
  const plan = JSON.parse(readRepo("skills/wh-review/stage-skill-plan.json"));
  for (const stage of ["build-plan", "build-code", "verify-code"]) {
    it(`${stage} instructions name exactly the plan required_skills`, () => {
      const required = plan.stages[stage].required_skills;
      const text = reviewInstructionsFor(stage);
      for (const name of required) expect(text).toContain(`skills/${name}/SKILL.md`);
      expect(text).not.toContain("skills/plan-eng-review/SKILL.md");
    });
  }

  it("keeps the frozen build-plan plan entry unchanged", () => {
    expect(plan.stages["build-plan"].required_skills).toEqual(["review"]);
  });
});


describe("CARD-03 Git diff path prefix boundary", () => {
  for (const [kind, path] of [["bare", "README.md"], ["quoted", "文档.md"]]) {
    it(`rejects real Git no-prefix ${kind} paths while preserving the prefixed control`, () => {
      const repo = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-card03-prefix-")));
      roots.push(repo);
      const git = (args) => {const env={...process.env};for(const key of Object.keys(env))if(key.startsWith("GIT_"))delete env[key];return execFileSync("git", args, {cwd:repo,env,encoding:"utf8",stdio:["ignore","pipe","pipe"]});};
      git(["init", "-q", "-b", "main"]);
      git(["config", "user.name", "WorkflowHub prefix test"]);
      git(["config", "user.email", "prefix@workflowhub.local"]);
      git(["config", "core.quotePath", "true"]);
      writeFileSync(join(repo, path), "before\n", "utf8");
      git(["add", "--", path]);
      git(["commit", "-qm", "prefix baseline"]);
      writeFileSync(join(repo, path), "after\n", "utf8");
      git(["config", "diff.noprefix", "true"]);
      const noPrefix = git(["diff", "--", path]);
      expect(noPrefix).toContain("diff --git ");
      if (kind === "quoted") expect(noPrefix.split("\n", 1)[0]).toMatch(/^diff --git "/);
      else expect(noPrefix.split("\n", 1)[0]).toBe(`diff --git ${path} ${path}`);
      expect(() => compactReviewDiff(noPrefix, { writeSet: [path] })).toThrow(/invalid Git.*(path|header)/);
      const prefixed = git(["-c", "diff.noprefix=false", "diff", "--", path]);
      expect(prefixed).not.toBe(noPrefix);
      expect(compactReviewDiff(prefixed, { writeSet: [path] }).diff).toBe(prefixed);
      expect(compactReviewDiff(prefixed).diff).toBe(prefixed);
    });
  }
});
