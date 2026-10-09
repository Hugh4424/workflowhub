// build-plan 预写测试（冻结）：断言变更须走 test change request + 独立审查
//
// T020 / ADR-021 目标契约（当前普通 task / packet 接口；独立 TCR 记录退休机器夹具）：
// - OCR 审查包（build-code phase 与 verify-code 终末两种）必须携带四类正文：
//   阶段合同（contracts/build-code.md 与 contracts/verify-code.md）、
//   provider 协议（contracts/provider-protocol.md）、审查重点（stageReviewFocus）、
//   stage-skill-plan 声明的 lens 技能正文（skills/<lens>/SKILL.md）。
// - 合同正文从 wh-review 原路径读取（包内字节 == skills/wh-review/contracts/ 原文字节），
//   不复制改名。
// - review-instructions.md 含「按根因合并」语义（根因）与「不可用≠空≠pass」语义。
// - 负例：provider 协议缺失时组装抛错（非静默降级）。

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { buildReviewMaterials, redactProviderHostPaths } from "../../skills/wh-review/scripts/review-materials.mjs";
import { captureReviewSource } from "../../skills/wh-review/scripts/review-source.mjs";
import { runConfiguredOcrHostReview, runOcrDelegationRound } from "../../runtime/review/ocr-delegation-adapter.mjs";
import { recordSimpleReviewRequest } from "../../runtime/review/review-record-route.mjs";
import { ArtifactDir } from "../../runtime/evidence/artifact-dir.mjs";
import { captureCommand } from "../../runtime/interface/run-command.mjs";
import { openTask } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { prepareTaskBoundBuildCodeReviewBundle } from "../../tools/cli/stage-runtime.mjs";

const repoRoot = realpathSync(join(import.meta.dirname, "..", ".."));
const whReviewContractBytes = (name) => readFileSync(join(repoRoot, "skills", "wh-review", "contracts", name));
const lensSkillBytes = (name) => readFileSync(join(repoRoot, "skills", name, "SKILL.md"));

const roots = [];

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function git(cwd, args) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key];
  env.GIT_OPTIONAL_LOCKS = "0";
  return execFileSync("git", args, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "ocr-review-contract-current-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub OCR fallback test"]);
  git(repo, ["config", "user.email", "ocr-fallback@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "ocr fallback fixture\n", "utf8");
  git(repo, ["add", "README.md"]);
  git(repo, ["commit", "-qm", "fixture"]);
  const taskId = `ocr-review-contract-current-${Math.random().toString(16).slice(2)}`;
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
  const gate = "npx --no-install vitest run tests/contract/ocr-review-contract-current.test.mjs --reporter=dot";
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
  return { root, home, taskId, taskDir, worktreeRoot, task };
}


async function contextFor(state) {
  return { task: state.task, manifest: state.task.manifest, workspace: await openCurrentTaskWorkspace(state.task), artifacts: ArtifactDir.open(state.worktreeRoot, state.task) };
}

function bundlePaths(bundle) {
  return bundle.manifest.map(({ path }) => path);
}

function expectContractBodies(bundle) {
  const paths = bundlePaths(bundle);
  for (const contract of ["contracts/build-code.md", "contracts/verify-code.md", "contracts/provider-protocol.md"]) {
    expect(paths, contract).toContain(contract);
    expect(readFileSync(join(bundle.bundleRoot, contract)), contract)
      .toEqual(whReviewContractBytes(contract.slice("contracts/".length)));
  }
}

function expectLensBodies(bundle) {
  const paths = bundlePaths(bundle);
  for (const lens of ["skills/simplicity-guard/SKILL.md", "skills/review/SKILL.md"]) {
    expect(paths, lens).toContain(lens);
    expect(readFileSync(join(bundle.bundleRoot, lens)), lens)
      .toEqual(lensSkillBytes(lens.split("/")[1]));
  }
}

function expectInstructionSemantics(instructions) {
  // 「按根因合并」语义。
  expect(instructions).toContain("根因");
  // 「不可用≠空≠pass」语义。
  expect(instructions).toMatch(/不可用\s*≠\s*空\s*≠\s*pass/);
  // Actual generated instructions, not a filesystem sandbox proof.
  expect(instructions).toContain("cat, sed or rg");
  expect(instructions).toContain("verified native packet filesystem, tool and environment boundaries");
  expect(instructions).not.toContain("Git, shell, network");
  expect(instructions).toContain("Do not access parent directories, Git, network or host paths; do not write.");
}

describe("OCR code review packet carries the reviewer contract bodies (T020)", () => {
  it("ships contracts, provider protocol, review focus, and lens bodies in the build-code phase packet", async () => {
    const state = fixture();
    writeFileSync(join(state.worktreeRoot, "README.md"), "phase implementation under review\n");
    const attachmentRoot = join(state.root, "review-data");
    mkdirSync(attachmentRoot);
    mkdirSync(join(state.task.taskPath, "quality", "tests"), { recursive: true });
    const receipt = await captureCommand({
      cwd: state.worktreeRoot, recordDir: join(state.task.taskPath, "quality", "tests"),
      slug: "ocr-contract-current", argv: [process.execPath, "-e", "const fs=require('node:fs');if(fs.readFileSync('README.md','utf8').trim()!=='phase implementation under review')process.exit(7);process.stdout.write('owned current code check\\n');"], timeoutMs: 5000,
    });
    expect(receipt.exit).toBe(0);
    const request = {
      stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P3",
      host_provider: "codex/luna",
      materials: {
        approved_spec: "The phase implements the accepted decision against the current spec.",
        acceptance_criteria: "AC-1: the phase diff keeps the complete criterion text.",
        test_evidence: { receipt_ref: receipt.receipt_ref, output_ref: receipt.output_ref, exit_code: receipt.exit_code },
      },
    };
    const bundle = prepareTaskBoundBuildCodeReviewBundle(
      await contextFor(state),
      request,
      { loadConfig: () => ({ attachmentRoot }) });
    try {
      expectContractBodies(bundle);
      expectLensBodies(bundle);
      const instructions = readFileSync(join(bundle.bundleRoot, "review-instructions.md"), "utf8");
      expectInstructionSemantics(instructions);
      // 审查重点（stageReviewFocus）：build-code phase 焦点与固定问题顺序进入指令。
      expect(instructions).toContain("complete current Phase diff");
      expect(instructions).toContain("spec_conformance");
    } finally {
      bundle.dispose();
    }
  });

  it("limits camelCase reviewScope phase bundles to the current Phase write set and cursor base", async () => {
    const state = fixture();
    const taskBaseline = git(state.worktreeRoot, ["rev-parse", "--verify", "HEAD^{commit}"]);
    writeFileSync(join(state.worktreeRoot, "prior-two.md"), "previous Phase committed source\n");
    git(state.worktreeRoot, ["add", "prior-two.md"]);
    git(state.worktreeRoot, ["commit", "-qm", "previous Phase source"]);
    const phaseBase = git(state.worktreeRoot, ["rev-parse", "--verify", "HEAD^{commit}"]);
    writeFileSync(join(state.worktreeRoot, "README.md"), "current Phase owned source\n");
    writeFileSync(join(state.worktreeRoot, "prior-one.md"), "unrelated source after Phase start\n");
    git(state.worktreeRoot, ["add", "README.md", "prior-one.md"]);
    git(state.worktreeRoot, ["commit", "-qm", "current Phase and unrelated source"]);
    writeFileSync(join(state.taskDir, "facts.jsonl"), JSON.stringify({
      record_kind:"stage", task_id:state.taskId, stage:"build-code", source:"owned Phase scope fixture",
      phase_progress:{phase_id:"P3", task_id:"T003", phases_head:phaseBase, base_head:phaseBase, recorded_at:"2026-10-08T00:00:00Z"},
    }) + "\n");
    const originalContext = await contextFor(state);
    const context = {...originalContext, workspace:{...originalContext.workspace, baselineCommit:taskBaseline}};
    const attachmentRoot = join(state.root, "review-data");
    mkdirSync(attachmentRoot);
    for (const scope of [{review_scope:"phase"}, {reviewScope:"phase"}]) {
      let capturedBase;
      const bundle = prepareTaskBoundBuildCodeReviewBundle(context, {
        stage:"build-code", ...scope, subject_kind:"phase", phase_id:"P3",
        materials:{approved_spec:"Inspect only the current Phase owned README source.", acceptance_criteria:"AC-1: exclude earlier and unrelated Phase sources."},
      }, {
        loadConfig:()=>({attachmentRoot}),
        captureSource:options=>{
          const source = captureReviewSource(options);
          capturedBase = source.baseCommit;
          return source;
        },
      });
      try {
        expect(capturedBase).toBe(phaseBase);
        expect(capturedBase).not.toBe(taskBaseline);
        const diff = readFileSync(join(bundle.bundleRoot, "changes.diff"), "utf8");
        expect(diff).toContain("diff --git a/README.md b/README.md");
        expect(diff).not.toContain("prior-one.md");
        expect(diff).not.toContain("prior-two.md");
        expect(bundlePaths(bundle)).toContain("README.md");
        expect(bundlePaths(bundle)).not.toContain("prior-one.md");
        expect(bundlePaths(bundle)).not.toContain("prior-two.md");
      } finally { bundle.dispose(); }
    }
    expect(readdirSync(attachmentRoot).filter(name=>name.startsWith(".ocr-code-review-") || name.startsWith("review-"))).toEqual([]);
  });

  it("ships contracts, provider protocol, review focus, and lens bodies in the verify-code final packet", async () => {
    const state = fixture();
    writeFileSync(join(state.worktreeRoot, "README.md"), "final implementation under review\n");
    const attachmentRoot = join(state.root, "review-data");
    mkdirSync(attachmentRoot);
    const acceptance = "AC-1: the final worktree keeps the complete criterion and its failure path.";
    const request = {
      stage: "verify-code", subject_kind: "worktree",
      materials: {
        changed_files: "README.md",
        acceptance_criteria: acceptance,
        implementation_assessment: "Inspect the current final implementation.",
        test_context: "The focused final check is pending.",
        open_risks: "none declared",
      },
    };
    const bundle = prepareTaskBoundBuildCodeReviewBundle(
      await contextFor(state),
      request,
      { loadConfig: () => ({ attachmentRoot }) });
    try {
      expectContractBodies(bundle);
      expectLensBodies(bundle);
      const instructions = readFileSync(join(bundle.bundleRoot, "review-instructions.md"), "utf8");
      expectInstructionSemantics(instructions);
      // 审查重点（stageReviewFocus）：verify-code 焦点进入指令。
      expect(instructions).toContain("current code diff, real entry points");
    } finally {
      bundle.dispose();
    }
  });

  it("fails packet assembly when the provider protocol contract is missing", async () => {
    const state = fixture();
    const attachmentRoot = join(state.root, "review-data");
    mkdirSync(attachmentRoot, { recursive: true });
    const request = {
      stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P3",
      host_provider: "codex/luna",
      materials: { acceptance_criteria: "AC-1: keep the complete criterion text." },
    };
    const context = await contextFor(state);
    expect(() => prepareTaskBoundBuildCodeReviewBundle(
      context,
      request,
      {
        loadConfig: () => ({ attachmentRoot }),
        buildMaterials: ({ materials }) => {
          const bundleRoot = join(attachmentRoot, "incomplete-packet");
          mkdirSync(bundleRoot, { recursive: true });
          const entries = [
            ["source.json", "{}"],
            ["changes.diff", "diff --git a/README.md b/README.md\n"],
            ["requirements/acceptance_criteria.md", materials.acceptance_criteria],
            ["review-instructions.md", materials.review_instructions],
            ["contracts/build-code.md", "reviewer contract body"],
            ["contracts/verify-code.md", "reviewer contract body"],
            ["skills/review/SKILL.md", "lens body"],
            ["skills/simplicity-guard/SKILL.md", "lens body"],
          ];
          const manifest = entries.map(([path, contents]) => {
            const filePath = join(bundleRoot, path);
            mkdirSync(dirname(filePath), { recursive: true });
            writeFileSync(filePath, contents);
            return { path, bytes: Buffer.byteLength(contents), sha256: createHash("sha256").update(contents).digest("hex") };
          });
          return { bundleRoot, materialId: "c".repeat(64), manifest };
        },
      })).toThrow(/provider-protocol/);
  });
});


describe("changed reviewer source and packet control paths", () => {
  function request(path) {
    return {stage:"verify-code", subject_kind:"worktree", materials:{
      changed_files:path, acceptance_criteria:"AC-1: preserve the complete changed reviewer source and fixed reviewer body.",
      implementation_assessment:"Review the changed lens source as well as the fixed reviewer protocol.",
      test_context:"Owned packet construction only, no provider dispatch.", open_risks:"none declared",
    }};
  }
  function changedLens(state, name) {
    const path = `skills/${name}/SKILL.md`;
    mkdirSync(dirname(join(state.worktreeRoot, path)), {recursive:true});
    writeFileSync(join(state.worktreeRoot, path), "# Previous owned reviewer source\n");
    git(state.worktreeRoot, ["add", path]);
    git(state.worktreeRoot, ["commit", "-qm", "owned previous lens source"]);
    const baselineCommit = git(state.worktreeRoot, ["rev-parse", "--verify", "HEAD^{commit}"]);
    const bytes = lensSkillBytes(name);
    writeFileSync(join(state.worktreeRoot, path), bytes);
    git(state.worktreeRoot, ["add", path]);
    git(state.worktreeRoot, ["commit", "-qm", "owned current lens source"]);
    return {path, bytes, baselineCommit};
  }
  it.each(["simplicity-guard", "review"])("keeps changed %s source and identical fixed lens as one complete manifest entry", async name => {
    const state = fixture(), {path, bytes, baselineCommit} = changedLens(state, name);
    const attachmentRoot = join(state.root, "review-data");
    mkdirSync(attachmentRoot);
    const originalContext = await contextFor(state);
    const context = {...originalContext, workspace:{...originalContext.workspace, baselineCommit}};
    const bundle = prepareTaskBoundBuildCodeReviewBundle(context, request(path), {loadConfig:()=>({attachmentRoot})});
    try {
      expectContractBodies(bundle);
      expectLensBodies(bundle);
      const entries = bundle.manifest.filter(entry => entry.path === path);
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({bytes:bytes.length, sha256:createHash("sha256").update(bytes).digest("hex")});
      expect(readFileSync(join(bundle.bundleRoot, path))).toEqual(bytes);
      expect(readFileSync(join(state.worktreeRoot, path))).toEqual(bytes);
      expect(readFileSync(join(bundle.bundleRoot, "changes.diff"), "utf8")).toContain(`diff --git a/${path} b/${path}`);
      const instructions = readFileSync(join(bundle.bundleRoot, "review-instructions.md"), "utf8");
      expect(instructions).toContain("its identical manifest entry serves both roles");
      const manifest = JSON.parse(readFileSync(join(bundle.bundleRoot, "manifest.json"), "utf8"));
      expect(manifest.filter(entry => entry.path === path)).toEqual(entries);
    } finally { bundle.dispose(); }
    expect(readdirSync(attachmentRoot).filter(name => name.startsWith(".ocr-code-review-") || name.startsWith("review-"))).toEqual([]);
  });
  it("rejects differing source/control bytes without overwriting the changed source or leaving a packet", async () => {
    const state = fixture(), {path, bytes, baselineCommit} = changedLens(state, "simplicity-guard");
    const attachmentRoot = join(state.root, "review-data");
    mkdirSync(attachmentRoot);
    const originalContext = await contextFor(state);
    const context = {...originalContext, workspace:{...originalContext.workspace, baselineCommit}};
    let controlBytes;
    expect(() => prepareTaskBoundBuildCodeReviewBundle(context, request(path), {
      loadConfig:()=>({attachmentRoot}),
      buildMaterials:input=>{
        const built = buildReviewMaterials(input);
        controlBytes = Buffer.from("# Distinct owned fixed reviewer body\n");
        writeFileSync(join(built.bundleRoot, path), controlBytes);
        built.deliveryManifest = built.deliveryManifest.map(entry => entry.path === path ? {
          path, bytes:controlBytes.length, sha256:createHash("sha256").update(controlBytes).digest("hex"),
        } : entry);
        return built;
      },
    })).toThrow(`OCR source path conflicts with packet control: ${path}`);
    expect(controlBytes.equals(bytes)).toBe(false);
    expect(readFileSync(join(state.worktreeRoot, path))).toEqual(bytes);
    expect(readdirSync(attachmentRoot).filter(name => name.startsWith(".ocr-code-review-") || name.startsWith("review-"))).toEqual([]);
  });
});


describe("complete diff navigation and named per-file shards", () => {
  const hash = bytes => createHash("sha256").update(bytes).digest("hex");
  function expectBytes(actual, expected, label) {
    const received=Buffer.from(actual), wanted=Buffer.from(expected);
    const equal=received.equals(wanted);
    let firstMismatch=null;
    if(!equal){firstMismatch=0;while(firstMismatch<Math.min(received.length,wanted.length)&&received[firstMismatch]===wanted[firstMismatch])firstMismatch++;}
    expect(equal,JSON.stringify({label,actual_bytes:received.length,expected_bytes:wanted.length,
      actual_sha256:hash(received),expected_sha256:hash(wanted),first_mismatch:firstMismatch})).toBe(true);
  }
  const finalRequest = {stage:"verify-code", subject_kind:"worktree", materials:{
    changed_files:"all owned modified, deleted and renamed source paths", acceptance_criteria:"AC-1: retain every full patch byte and its current source anchors.",
    implementation_assessment:"Inspect the owned entry point, consumer and deleted paths through the complete navigation.",
    test_context:"Owned producer and anchor parser effects only; no OCR command or external provider.", open_risks:"none declared",
  }};
  function ownedSource(state, attachmentRoot, baseline, capture) {
    return () => {
      const source = captureReviewSource({sourceRoot:state.worktreeRoot, baselineCommit:baseline, reviewDataRoot:attachmentRoot});
      capture(readFileSync(source.diffPath));
      return source;
    };
  }
  it("reconstructs every large multi-file patch byte while retaining full current source, controls and source-line anchors", async () => {
    const controls="diff --git a/new.mjs b/new.mjs\nnew file mode 100644\n--- /dev/null\n+++ b/new.mjs\n@@ -0,0 +1 @@\n+const api_key = \"SELF_CREATED_FAKE_SECRET_123\";\n"
      + "diff --git a/old.mjs b/old.mjs\ndeleted file mode 100644\n--- a/old.mjs\n+++ /dev/null\n@@ -1 +0,0 @@\n-old\n"
      + "ordinary /dev/null\n+++ /Users/owned/private/file\n";
    const projectedControls=redactProviderHostPaths(controls);
    expect(projectedControls).toContain("--- /dev/null\n"); expect(projectedControls).toContain("+++ /dev/null\n");
    expect(projectedControls).not.toContain("SELF_CREATED_FAKE_SECRET_123"); expect(projectedControls).not.toContain("/Users/owned/private/file");
    expect(projectedControls).toContain("ordinary <host-path-redacted>\n");
    expect(redactProviderHostPaths("+++ /dev/null\nordinary /dev/null\n")).toBe("+++ <host-path-redacted>\nordinary <host-path-redacted>\n");
    const state = fixture(), root = state.worktreeRoot;
    for (const directory of ["src", "legacy", "skills/simplicity-guard"]) mkdirSync(join(root, directory), {recursive:true});
    writeFileSync(join(root, "src/active.mjs"), "export const before = true;\n");
    writeFileSync(join(root, "src/old-name.mjs"), "export const renamed = true;\n");
    writeFileSync(join(root, "src/名字 file.mjs"), "export const unicode = false;\n");
    writeFileSync(join(root, "legacy/deleted.mjs"), "// old deleted implementation\n".repeat(12000));
    writeFileSync(join(root, "legacy/deleted-binary.dat"), Buffer.from([0,255,1,128,2,127]));
    writeFileSync(join(root, "skills/simplicity-guard/SKILL.md"), "# Previous owned lens\n");
    git(root, ["add", "."]); git(root, ["commit", "-qm", "owned full baseline"]);
    const baseline = git(root, ["rev-parse", "HEAD"]);
    const active = Array.from({length:16000}, (_, index) => `export const line${String(index + 1).padStart(5,"0")} = "完整 source ${index + 1}";\n`).join("");
    writeFileSync(join(root, "src/active.mjs"), active);
    fs.renameSync(join(root, "src/old-name.mjs"), join(root, "src/new-name.mjs"));
    writeFileSync(join(root, "src/名字 file.mjs"), "export const unicode = true;\n");
    rmSync(join(root, "legacy/deleted.mjs")); rmSync(join(root, "legacy/deleted-binary.dat"));
    const lens = lensSkillBytes("simplicity-guard"); writeFileSync(join(root, "skills/simplicity-guard/SKILL.md"), lens);
    git(root, ["add", "."]);
    const attachmentRoot = join(state.root, "review-data"); mkdirSync(attachmentRoot);
    let original;
    const bundle = prepareTaskBoundBuildCodeReviewBundle(await contextFor(state), finalRequest, {
      loadConfig:()=>({attachmentRoot}), captureSource:ownedSource(state, attachmentRoot, baseline, bytes => {original=bytes;}),
    });
    try {
      expectContractBodies(bundle); expectLensBodies(bundle);
      const index = JSON.parse(readFileSync(join(bundle.bundleRoot, "diff-index.json"), "utf8"));
      expect(index.schema_version).toBe("wh-review-diff-index.v1");
      expect(index.changes.map(change => change.path)).toEqual([
        "legacy/deleted-binary.dat", "legacy/deleted.mjs", "skills/simplicity-guard/SKILL.md", "src/active.mjs", "src/new-name.mjs", "src/名字 file.mjs",
      ]);
      const sections = [];
      for (const change of index.changes) {
        const parts = [];
        let offset = 0;
        for (const shard of change.shards) {
          expect(shard.delivery).toBe("included"); expect(shard.offset).toBe(offset);
          expect(shard.ref).toBe(`diff-shards/${shard.shard_id}.diff`);
          const part = readFileSync(join(bundle.bundleRoot, shard.ref));
          expect(part.length).toBeLessThanOrEqual(96 * 1024);
          expect(hash(part)).toBe(shard.sha256); expect(part.length).toBe(shard.bytes);
          expectBytes(Buffer.from(part.toString("utf8"), "utf8"),part,"shard UTF-8 round trip");
          expect(bundle.files).toContain(shard.ref);
          expect(bundle.manifest.find(entry => entry.path === shard.ref)).toMatchObject({bytes:part.length,sha256:hash(part)});
          parts.push(part); offset += part.length;
        }
        const section = Buffer.concat(parts); sections.push(section);
        expect(section.length).toBe(change.bytes); expect(hash(section)).toBe(change.sha256);
        expect((section.toString("utf8").match(/\n/g) ?? []).length).toBe(change.line_count);
        expect(change.diff_offset).toBe(Buffer.concat(sections.slice(0,-1)).length);
        expect(change.current_source_listed).toBe(change.status !== "deleted");
        expect(change.current_source_ref).toBe(change.status === "deleted" ? null : change.path);
      }
      const rebuilt = Buffer.concat(sections);
      expectBytes(rebuilt,original,"complete original diff reconstruction");
      expect(rebuilt.toString("utf8")).toContain("+++ /dev/null\n");
      expect(index.full_diff_bytes).toBe(original.length); expect(index.full_diff_sha256).toBe(hash(original));
      expect(index.captured_diff_bytes).toBe(original.length); expect(index.captured_diff_sha256).toBe(hash(original));
      expect(index.changes.find(change => change.path === "legacy/deleted-binary.dat")).toMatchObject({status:"deleted",binary:true,current_source_listed:false});
      expect(index.changes.find(change => change.path === "src/new-name.mjs")).toMatchObject({status:"renamed",old_path:"src/old-name.mjs"});
      expect(fs.existsSync(join(bundle.bundleRoot, "changes.diff"))).toBe(false);
      expect(bundle.manifest.some(entry => entry.path === "changes.diff")).toBe(false);
      expectBytes(readFileSync(join(bundle.bundleRoot,"src/active.mjs")),Buffer.from(active),"complete current active source");
      expectBytes(readFileSync(join(bundle.bundleRoot,"skills/simplicity-guard/SKILL.md")),lens,"current lens/source complete bytes");
      expect(bundle.manifest.filter(entry => entry.path === "skills/simplicity-guard/SKILL.md")).toHaveLength(1);
      expect(readFileSync(join(bundle.bundleRoot, "requirements/acceptance_criteria.md"), "utf8")).toBe(finalRequest.materials.acceptance_criteria);
      expect(readFileSync(join(bundle.bundleRoot, "review-instructions.md"), "utf8")).toContain("complete diff content is in all manifest-declared per-file patch shards");
      // Actual deterministic OCR materialization plus an owned native CLI;
      // this proves transport paths/bytes, not model quality or native FS policy.
      const activeChange = index.changes.find(change => change.path === "src/active.mjs"), shard = activeChange.shards[0];
      const raw = readFileSync(join(bundle.bundleRoot, shard.ref), "utf8");
      const exactLine = active.split("\n")[19];
      const patchLine = raw.split("\n").findIndex(line => line === "+" + exactLine) + 1;
      expect(patchLine).toBeGreaterThan(0);
      const nativeCli=join(state.root,"owned-native-index-cli");
      const finding={severity:"major",path:shard.ref,line:patchLine,issue:"Owned source mapping assertion",recommendation:"Inspect this actual source line",
        root_cause:"owned fixture",evidence_kind:"direct",evidence:`\`${exactLine}\``};
      writeFileSync(nativeCli,String.raw`#!/usr/bin/env node
const fs=require("node:fs"),crypto=require("node:crypto");
const hash=bytes=>crypto.createHash("sha256").update(bytes).digest("hex");
const prompt=fs.readFileSync("review-prompt.md","utf8");
if(prompt.includes("change-map.json"))throw new Error("prompt named an unavailable index");
const index=JSON.parse(fs.readFileSync("diff-index.json","utf8")),full=[];
let reads=0;
for(const change of index.changes)for(const part of change.shards){
  const raw=fs.readFileSync(part.ref);
  if(raw.length!==part.bytes||hash(raw)!==part.sha256)throw new Error("delivered raw shard differs from index");
  if(fs.existsSync(part.ref.replace(/\.diff$/,".md")))throw new Error("unexpected alias copy");
  full.push(raw);reads++;
}
const joined=Buffer.concat(full);
if(joined.length!==index.full_diff_bytes||hash(joined)!==index.full_diff_sha256)throw new Error("delivered full diff differs from source index");
if(reads!==${index.changes.reduce((count,change)=>count+change.shards.length,0)})throw new Error("not every ref was read");
process.stdout.write(JSON.stringify({type:"thread.started",thread_id:"owned-delivered-index-session"})+"\n");
process.stdout.write(JSON.stringify({type:"item.completed",item:{type:"agent_message",text:JSON.stringify({findings:[${JSON.stringify(finding)}]})}})+"\n");
process.stdout.write(JSON.stringify({type:"turn.completed"})+"\n");
`,{mode:0o700});
      let deliveryObserved=false;
      const parsed=await runOcrDelegationRound({...finalRequest,candidate_experiment:true},{buildBundle:()=>bundle,executor:params=>{
        const deliveredIndex=JSON.parse(readFileSync(join(params.packet.root,"diff-index.json"),"utf8"));
        expect(deliveredIndex).toEqual(index);
        const allowlist=new Map(params.packet.manifest.map(entry=>[entry.path,entry]));
        for(const change of deliveredIndex.changes)for(const part of change.shards){
          expect(allowlist.get(part.ref)).toMatchObject({bytes:part.bytes,sha256:part.sha256});
          expect(params.packet.preview.reviewable_files.map(file=>file.path)).toContain(part.ref);
          expectBytes(readFileSync(join(params.packet.root,part.ref)),readFileSync(join(bundle.bundleRoot,part.ref)),"actual delivered shard ref bytes");
        }
        deliveryObserved=true;
        return runConfiguredOcrHostReview(params,{sourceBundle:bundle,trustedContext:{trusted:{},route:{minimum_heterologous:1},selection:{providers:["codex/owned"]},
          providerConfig:{providers:{"codex/owned":{enabled:true,command:nativeCli,model:"owned-native-cli"}}}}});
      }});
      expect(deliveryObserved).toBe(true);
      expect(parsed.status,JSON.stringify(parsed.provider_results?.map(member=>member.error)??parsed.error)).toBe("available");
      expect(parsed.findings[0]).toMatchObject({path:"src/active.mjs",line:20});
      expect(parsed.provider_results[0].evidence_anchor_valid).toEqual([true]);
      expect(parsed.provider_results[0].session_id).toBe("owned-delivered-index-session");
    } finally { bundle.dispose(); }
    expect(readdirSync(attachmentRoot).filter(name => name.startsWith(".ocr-code-review-") || name.startsWith("review-"))).toEqual([]);
  }, 15000);
  it("keeps the existing non-UTF8 current-source rejection and cleans a failed large bundle", async () => {
    const state=fixture(), root=state.worktreeRoot;
    mkdirSync(join(root,"src")); writeFileSync(join(root,"src/binary.dat"),Buffer.from([0,255,128]));
    writeFileSync(join(root,"src/large.mjs"),"export const previous = true;\n");
    git(root,["add","."]); git(root,["commit","-qm","owned binary baseline"]);
    const baseline=git(root,["rev-parse","HEAD"]);
    writeFileSync(join(root,"src/binary.dat"),Buffer.from([0,255,128,1]));
    writeFileSync(join(root,"src/large.mjs"),"export const value = true;\n".repeat(16000));
    const attachmentRoot=join(state.root,"review-data"); mkdirSync(attachmentRoot);
    const context=await contextFor(state);
    expect(()=>prepareTaskBoundBuildCodeReviewBundle(context,finalRequest,{
      loadConfig:()=>({attachmentRoot}),captureSource:ownedSource(state,attachmentRoot,baseline,()=>{}),
    })).toThrow(/MATERIAL_NOT_UTF8/);
    expect(readdirSync(attachmentRoot).filter(name=>name.startsWith(".ocr-code-review-")||name.startsWith("review-"))).toEqual([]);
  });
  it("exposes cleanup failure and lets the same owned bundle retry cleanup", async () => {
    const state=fixture(), attachmentRoot=join(state.root,"review-data"); mkdirSync(attachmentRoot);
    const bundle=prepareTaskBoundBuildCodeReviewBundle(await contextFor(state),finalRequest,{loadConfig:()=>({attachmentRoot})});
    const originalRemove=fs.rmSync; let fired=false;
    try {
      fs.rmSync=(path,options)=>{
        if(path===bundle.bundleRoot&&!fired){fired=true;throw Object.assign(new Error("owned packet cleanup failure"),{code:"OWNED_CLEANUP_FAILURE"});}
        return originalRemove(path,options);
      };
      syncBuiltinESMExports();
      expect(()=>bundle.dispose()).toThrow("owned packet cleanup failure"); expect(fired).toBe(true);
      expect(fs.existsSync(bundle.bundleRoot)).toBe(true);
    } finally {fs.rmSync=originalRemove;syncBuiltinESMExports();}
    bundle.dispose(); expect(fs.existsSync(bundle.bundleRoot)).toBe(false);
    expect(readdirSync(attachmentRoot).filter(name=>name.startsWith(".ocr-code-review-")||name.startsWith("review-"))).toEqual([]);
  });
});


it("retains only a real observed thread ID in a failed native review's canonical record", async () => {
  for(const [id,expected] of [["owned-observed-cancel-session","owned-observed-cancel-session"],["/invalid/owned-id",null],[null,null]]){
    const state=fixture(), root=join(state.root,"observed-session"); mkdirSync(root);
    const executable=join(root,"owned-observer-cli");
    const event=id===null?{type:"item.started",owned_pid:null}:{type:"thread.started",thread_id:id};
    writeFileSync(executable,String.raw`#!/usr/bin/env node
const event=${JSON.stringify(event)}; event.owned_pid=process.pid;
process.stdout.write(JSON.stringify(event)+"\n");
setInterval(()=>{},100);
`,{mode:0o700});
    const packetRoot=join(root,"packet"); mkdirSync(packetRoot);
    const content="export const observed = true;\n"; writeFileSync(join(packetRoot,"owned.mjs"),content);
    const hash=bytes=>createHash("sha256").update(bytes).digest("hex");
    const packet={root:packetRoot,material_id:"a".repeat(64),preview:{reviewable_files:[{path:"owned.mjs"}]},rules:{rules:[]},
      manifest:[{path:"owned.mjs",bytes:Buffer.byteLength(content),sha256:hash(content)}]};
    const controller=new AbortController();let watchdogFired=false;
    const watchdog=setTimeout(()=>{watchdogFired=true;controller.abort(new Error("owned test watchdog"));},3500);
    let recorded;
    try{
      recorded=await recordSimpleReviewRequest({taskDir:state.taskDir,request:{stage:"verify-code",subject_kind:"worktree",surface:"code",materials:{}},signal:controller.signal,
        runRound:(request,options)=>runConfiguredOcrHostReview({request,packet,signal:options.signal},{
          trustedContext:{trusted:{},route:{minimum_heterologous:1},selection:{providers:["codex/owned"]},
            providerConfig:{providers:{"codex/owned":{enabled:true,command:executable,model:"owned-observer"}}}},
          onProviderHealth:health=>{if(health.stdout_bytes>0)controller.abort(new Error("owned explicit cancellation after actual output"));},
          rawOutputSink:(hint,bytes,metadata)=>options.onProviderOutput({provider:metadata.provider,output:bytes}),
        })});
    }finally{clearTimeout(watchdog);}
    expect(watchdogFired).toBe(false);
    const original=JSON.parse(readFileSync(recorded.path,"utf8"));
    expect(original).toMatchObject({status:"unavailable",authoritative:false,findings:[],provider_results:[{
      provider:"codex/owned",status:"cancelled",session_id:expected,error:{code:"OCR_PROVIDER_CANCELLED"},parse_outcome:null,
    }]});
    const raw=readFileSync(join(state.taskDir,original.provider_results[0].raw_output_ref),"utf8");
    const observed=JSON.parse(raw.trim());expect(observed.type).toBe(event.type);
    if(id!==null)expect(observed.thread_id).toBe(id);
    expect(()=>process.kill(observed.owned_pid,0)).toThrow();
  }
},15000);

// Proposed narrow ZIP cases only; existing frozen assertions above are unchanged.
import nativeBinaryAssert from "node:assert/strict";
describe("native opaque ZIP packet contract (proposed, no provider review)",()=>{
  const nativeBinaryTest=it;

const nativeBinaryHash = bytes => createHash("sha256").update(bytes).digest("hex");
function nativeBinaryGit(cwd, args) {
  const env = {...process.env};
  for (const name of Object.keys(env)) if (name.startsWith("GIT_")) delete env[name];
  env.GIT_OPTIONAL_LOCKS = "0";
  return execFileSync("git", args, {cwd, env, encoding:"utf8", stdio:["ignore","pipe","pipe"], maxBuffer:32*1024*1024}).trim();
}
function nativeBinaryZip(size, seed) {
  // Real single-entry ZIP, stored method, correct local/central headers and CRC.
  const payload=Buffer.alloc(size);
  let state=seed;
  for(let i=0;i<size;i++){state^=state<<13;state^=state>>>17;state^=state<<5;payload[i]=state&255;}
  let crc=0xffffffff;
  for(const byte of payload){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
  crc=(crc^0xffffffff)>>>0;
  const name=Buffer.from("payload.bin"),local=Buffer.alloc(30),central=Buffer.alloc(46),end=Buffer.alloc(22);
  local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt32LE(crc,14);
  local.writeUInt32LE(size,18);local.writeUInt32LE(size,22);local.writeUInt16LE(name.length,26);
  central.writeUInt32LE(0x02014b50);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);
  central.writeUInt32LE(crc,16);central.writeUInt32LE(size,20);central.writeUInt32LE(size,24);central.writeUInt16LE(name.length,28);
  end.writeUInt32LE(0x06054b50);end.writeUInt16LE(1,8);end.writeUInt16LE(1,10);
  end.writeUInt32LE(central.length+name.length,12);end.writeUInt32LE(local.length+name.length+size,16);
  return Buffer.concat([local,name,payload,central,name,end]);
}
function nativeBinaryFixture(kind, large=false) {
  const root=fs.realpathSync(fs.mkdtempSync(join(fs.realpathSync(process.env.TMPDIR || "/tmp"),"ocr-native-zip-owned-")));
  const repo=join(root,"repo"),attachments=join(root,"attachments"),taskPath=join(root,"task");
  fs.mkdirSync(repo);fs.mkdirSync(attachments);fs.mkdirSync(taskPath);fs.mkdirSync(join(repo,"src"));
  nativeBinaryGit(repo,["init","-q","-b","main"]);
  nativeBinaryGit(repo,["config","user.name","Owned native ZIP diagnostic"]);
  nativeBinaryGit(repo,["config","user.email","owned-native-zip@workflowhub.local"]);
  const path=kind==="text" ? null : "src/" + (kind.startsWith("zip") ? "artifact.zip" : kind==="bad-mjs" ? "bad.mjs" : "bad.dat");
  fs.writeFileSync(join(repo,"src/current.mjs"),"export const previous = true;\n");
  if(path)fs.writeFileSync(join(repo,path),kind.startsWith("zip")?nativeBinaryZip(32,7):Buffer.from([0,255,128,1]));
  nativeBinaryGit(repo,["add","."]);nativeBinaryGit(repo,["commit","-qm","owned diagnostic baseline"]);
  const baseline=nativeBinaryGit(repo,["rev-parse","HEAD"]);
  const currentText=Array.from({length:large?6000:20},(_,i)=>"export const value"+i+' = "完整 current source '+i+'";\n').join("")+"// COMPLETE_CURRENT_TAIL\n";
  fs.writeFileSync(join(repo,"src/current.mjs"),currentText);
  if(path)fs.writeFileSync(join(repo,path),kind.startsWith("zip")?nativeBinaryZip(large?360*1024:1024,23):Buffer.from([0,255,128,2]));
  if(kind.startsWith("zip")) {
    const validation=execFileSync("/usr/bin/unzip",["-t",join(repo,path)],{encoding:"utf8"});
    nativeBinaryAssert.match(validation,/No errors detected/);
  }
  nativeBinaryGit(repo,["add","."]);nativeBinaryGit(repo,["commit","-qm","owned diagnostic current bytes"]);
  return {root,repo,attachments,taskPath,path,baseline,currentText,large,kind};
}
function nativeBinaryVerifiedPacket(bundle) {
  const unique=new Set();
  for(const entry of bundle.manifest) {
    nativeBinaryAssert.ok(!unique.has(entry.path),"duplicate packet manifest path: "+entry.path);unique.add(entry.path);
    const bytes=fs.readFileSync(join(bundle.bundleRoot,entry.path));
    nativeBinaryAssert.equal(bytes.length,entry.bytes,entry.path+" manifest bytes");
    nativeBinaryAssert.equal(nativeBinaryHash(bytes),entry.sha256,entry.path+" manifest sha256");
  }
  nativeBinaryAssert.deepEqual(JSON.parse(fs.readFileSync(join(bundle.bundleRoot,"manifest.json"),"utf8")),[...bundle.manifest].sort((a,b)=>Buffer.compare(Buffer.from(a.path),Buffer.from(b.path))));
}
function nativeBinaryRebuiltDiff(bundle, original, zipPath, large) {
  if(!large) {
    const full=fs.readFileSync(join(bundle.bundleRoot,"changes.diff"));
    nativeBinaryAssert.deepEqual(full,original,"small complete Git binary diff bytes");
    return {mode:"inline",shards:0,bytes:full.length,sha256:nativeBinaryHash(full)};
  }
  const index=JSON.parse(fs.readFileSync(join(bundle.bundleRoot,"diff-index.json"),"utf8")),parts=[];
  let diffOffset=0;
  for(const change of index.changes) {
    nativeBinaryAssert.equal(change.diff_offset,diffOffset);
    const sectionParts=[];let offset=0;
    for(const shard of change.shards) {
      nativeBinaryAssert.equal(shard.delivery,"included");nativeBinaryAssert.equal(shard.offset,offset);
      const part=fs.readFileSync(join(bundle.bundleRoot,shard.ref));
      nativeBinaryAssert.equal(part.length,shard.bytes);nativeBinaryAssert.equal(nativeBinaryHash(part),shard.sha256);
      nativeBinaryAssert.ok(part.length<=96*1024);
      nativeBinaryAssert.deepEqual(bundle.manifest.find(entry=>entry.path===shard.ref),{path:shard.ref,bytes:part.length,sha256:nativeBinaryHash(part)});
      sectionParts.push(part);offset+=part.length;
    }
    const section=Buffer.concat(sectionParts);
    nativeBinaryAssert.equal(section.length,change.bytes);nativeBinaryAssert.equal(nativeBinaryHash(section),change.sha256);
    parts.push(section);diffOffset+=section.length;
  }
  const full=Buffer.concat(parts);
  nativeBinaryAssert.deepEqual(full,original,"all complete Git binary diff shard bytes");
  nativeBinaryAssert.equal(index.full_diff_bytes,original.length);
  nativeBinaryAssert.equal(index.full_diff_sha256,nativeBinaryHash(original));
  nativeBinaryAssert.equal(index.captured_diff_bytes,original.length);
  nativeBinaryAssert.equal(index.captured_diff_sha256,nativeBinaryHash(original));
  const zip=index.changes.find(change=>change.path===zipPath);
  nativeBinaryAssert.equal(zip.binary,true);nativeBinaryAssert.equal(zip.current_source_listed,false);
  nativeBinaryAssert.equal(zip.current_source_ref,null);nativeBinaryAssert.ok(zip.shards.length>1,"ZIP itself spans shards");
  const text=index.changes.find(change=>change.path==="src/current.mjs");
  nativeBinaryAssert.equal(text.current_source_listed,true);nativeBinaryAssert.equal(text.current_source_ref,"src/current.mjs");
  return {mode:"sharded",shards:index.changes.reduce((count,change)=>count+change.shards.length,0),zip_shards:zip.shards.length,bytes:full.length,sha256:nativeBinaryHash(full)};
}
function nativeBinaryCase(kind, large=false) {
  const state=nativeBinaryFixture(kind,large);
  let bundle,original;
  try {
    const context={workspace:{worktreeRoot:state.repo,baselineCommit:state.baseline},task:{taskPath:state.taskPath,identity:{taskId:"owned-native-binary-diagnostic"}}};
    const request={stage:"verify-code",subject_kind:"worktree",materials:{
      changed_files:state.path?[state.path,"src/current.mjs"]:["src/current.mjs"],
      acceptance_criteria:"AC-1: preserve complete source and all binary patch bytes; expose opaque ZIP metadata; retain strict source and alias rejection.",
      implementation_assessment:"Owned diagnostic fixture only; no task quality conclusion.",
      test_context:"Real ZIP headers/CRC checked by unzip; current UTF8 source and complete original Git diff validated byte-for-byte.",
      open_risks:"ZIP body remains opaque; no archive member or pixel interpretation or provider review.",
    }};
    const assemble=()=>prepareTaskBoundBuildCodeReviewBundle(context,request,{
      loadConfig:()=>({attachmentRoot:state.attachments}),
      captureSource:()=>{
        const source=captureReviewSource({sourceRoot:state.repo,baselineCommit:state.baseline,reviewDataRoot:state.attachments});
        original=fs.readFileSync(source.diffPath);
        if(state.path)nativeBinaryAssert.match(original.toString("utf8"),/GIT binary patch/,"real Git binary patch required");
        if(large)nativeBinaryAssert.ok(original.length>288*1024,"real sharding threshold exceeded");
        if(kind==="zip-symlink"||kind==="zip-hardlink"){
          const full=join(state.repo,state.path),target=join(state.root,"owned-original.zip");
          fs.renameSync(full,target);
          if(kind==="zip-symlink")fs.symlinkSync(target,full);
          else fs.linkSync(target,full);
        }
        process.stdout.write(JSON.stringify({case:kind+(large?"-large":""),original_diff_bytes:original.length,original_diff_sha256:nativeBinaryHash(original),has_git_binary_patch:/^GIT binary patch$/m.test(original.toString("utf8")),provider_dispatched:false})+"\n");
        return source;
      },
    });
    if(kind==="zip-symlink"||kind==="zip-hardlink"||kind.startsWith("bad-")){
      let rejection;
      nativeBinaryAssert.throws(()=>{try{bundle=assemble();}catch(error){rejection={code:error.code||null,message:error.message};throw error;}},kind==="zip-symlink"?/source path alias/:kind==="zip-hardlink"?/single-link regular file/:/MATERIAL_NOT_UTF8/);
      process.stdout.write(JSON.stringify({case:kind,result:"PASS_EXPECTED_REJECTION",rejection,scope:"proposal contract diagnostic only"})+"\n");
      return;
    }
    try {bundle=assemble();} catch(error) {
      process.stdout.write(JSON.stringify({case:kind+(large?"-large":""),result:"RED_NEW_PROPOSED_CONTRACT_UNIMPLEMENTED",code:error.code||null,message:error.message,scope:"not CARD-04 business RED; no provider review"})+"\n");
      throw error;
    }
    nativeBinaryVerifiedPacket(bundle);
    nativeBinaryAssert.deepEqual(fs.readFileSync(join(bundle.bundleRoot,"src/current.mjs")),Buffer.from(state.currentText),"complete current UTF8 source including tail");
    const currentEntry=bundle.manifest.find(entry=>entry.path==="src/current.mjs");
    nativeBinaryAssert.equal(currentEntry.bytes,Buffer.byteLength(state.currentText));
    nativeBinaryAssert.equal(currentEntry.sha256,nativeBinaryHash(state.currentText));
    const diff=nativeBinaryRebuiltDiff(bundle,original,state.path,large);
    if(state.path) {
      const raw=fs.readFileSync(join(state.repo,state.path)),identity=JSON.parse(fs.readFileSync(join(bundle.bundleRoot,"source.json"),"utf8"));
      const opaque=identity.non_text_archives?.find(item=>item.path===state.path);
      nativeBinaryAssert.ok(opaque,"explicit source.json opaque metadata required");
      nativeBinaryAssert.equal(opaque.source_bytes,raw.length);nativeBinaryAssert.equal(opaque.source_sha256,nativeBinaryHash(raw));
      nativeBinaryAssert.equal(opaque.current_source_listed,false);nativeBinaryAssert.equal(opaque.current_source_ref,null);
      nativeBinaryAssert.equal(opaque.full_git_binary_diff_available,true);
      nativeBinaryAssert.match(opaque.limitation,/no archive contents or pixel interpretation was performed/);
      nativeBinaryAssert.ok(!bundle.manifest.some(entry=>entry.path===state.path));
      nativeBinaryAssert.ok(!bundle.files.includes(state.path));
      nativeBinaryAssert.ok(!fs.existsSync(join(bundle.bundleRoot,state.path)),"ZIP not provider-readable as text");
    }
    process.stdout.write(JSON.stringify({case:kind+(large?"-large":""),result:"PASS_ACTUAL_PACKET_BYTES",current_source_bytes:currentEntry.bytes,current_source_sha256:currentEntry.sha256,manifest_files:bundle.manifest.length,diff,archive_semantic_acceptance:false,provider_dispatched:false})+"\n");
  } finally {
    try {
      bundle?.dispose();
      const remaining=fs.readdirSync(state.attachments);
      nativeBinaryAssert.ok(remaining.every(name=>name===".wh-review-packets"),"no assembly artifacts retained");
      if(remaining.includes(".wh-review-packets"))nativeBinaryAssert.deepEqual(fs.readdirSync(join(state.attachments,".wh-review-packets")),[],"empty packet container only");
    } finally {
      fs.rmSync(state.root,{recursive:true,force:true});
      nativeBinaryAssert.equal(fs.existsSync(state.root),false);
      process.stdout.write(JSON.stringify({case:kind+(large?"-large":""),owned_fixture_root:state.root,cleanup:"removed only self-created fixture",fixture_absent:true})+"\n");
    }
  }
}
nativeBinaryTest("preserves small real ZIP as opaque metadata with complete inline Git binary diff",()=>nativeBinaryCase("zip"));
nativeBinaryTest("preserves large real ZIP as opaque metadata with every binary diff shard",()=>nativeBinaryCase("zip",true));
nativeBinaryTest("rejects real ZIP symlink source alias before opaque handling",()=>nativeBinaryCase("zip-symlink"));
nativeBinaryTest("rejects real ZIP hardlink source alias before opaque handling",()=>nativeBinaryCase("zip-hardlink"));
nativeBinaryTest("retains bad UTF8 executable source rejection",()=>nativeBinaryCase("bad-mjs"));
nativeBinaryTest("retains frozen-style bad UTF8 dat source rejection",()=>nativeBinaryCase("bad-dat"));
nativeBinaryTest("verifies complete current text and packet manifest on current implementation",()=>nativeBinaryCase("text"));

function nativeBinaryGuardRejection(mode) {
  const state=nativeBinaryFixture("zip"),archive=fs.readFileSync(join(state.repo,state.path));
  let controlDeclared=false,rejection,deliveredDiff;
  const request={stage:"verify-code",subject_kind:"worktree",materials:{
    changed_files:[state.path,"src/current.mjs"],acceptance_criteria:"AC-1: only explicit Git binary ZIPs without packet-control conflict may be opaque.",
    implementation_assessment:"Owned exception-guard negative case only.",test_context:"Real current ZIP bytes; controlled diff/control projection at existing injection seams.",
    open_risks:"No provider, archive semantics, or business acceptance.",
  }};
  try {
    nativeBinaryAssert.throws(()=>prepareTaskBoundBuildCodeReviewBundle({
      workspace:{worktreeRoot:state.repo,baselineCommit:state.baseline},task:{taskPath:state.taskPath,identity:{taskId:"owned-native-binary-guard"}},
    },request,{
      loadConfig:()=>({attachmentRoot:state.attachments}),
      captureSource:()=>{
        const source=captureReviewSource({sourceRoot:state.repo,baselineCommit:state.baseline,reviewDataRoot:state.attachments});
        const realDiff=fs.readFileSync(source.diffPath,"utf8");
        const section=realDiff.match(/^diff --git a\/src\/artifact\.zip b\/src\/artifact\.zip[\s\S]*?(?=^diff --git |$(?![\s\S]))/m)?.[0];
        nativeBinaryAssert.ok(section);nativeBinaryAssert.match(section,/^GIT binary patch$/m);
        deliveredDiff=mode==="no-binary-tag" ? realDiff.replace(section,"diff --git a/src/artifact.zip b/src/artifact.zip\n--- a/src/artifact.zip\n+++ b/src/artifact.zip\n@@ -1 +1 @@\n-owned text before\n+owned text after\n") : realDiff;
        nativeBinaryAssert.equal(/^GIT binary patch$/m.test(deliveredDiff),mode!=="no-binary-tag");
        fs.writeFileSync(source.diffPath,deliveredDiff);return source;
      },
      buildMaterials:input=>{
        const built=buildReviewMaterials(input);
        if(mode==="control-conflict") {
          const control=Buffer.from("# Owned packet-control text at the changed ZIP path\n");
          nativeBinaryAssert.ok(!built.deliveryManifest.some(entry=>entry.path===state.path));
          fs.mkdirSync(dirname(join(built.bundleRoot,state.path)),{recursive:true});
          fs.writeFileSync(join(built.bundleRoot,state.path),control,{flag:"wx"});
          built.deliveryManifest.push({path:state.path,bytes:control.length,sha256:nativeBinaryHash(control)});
          const declared=built.deliveryManifest.find(entry=>entry.path===state.path);
          nativeBinaryAssert.equal(declared.bytes,control.length);nativeBinaryAssert.equal(declared.sha256,nativeBinaryHash(fs.readFileSync(join(built.bundleRoot,state.path))));
          controlDeclared=true;
        }
        return built;
      },
    }),error=>{rejection={code:error.code||null,message:error.message};return error.code==="MATERIAL_NOT_UTF8";});
    nativeBinaryAssert.equal(controlDeclared,mode==="control-conflict");
    nativeBinaryAssert.deepEqual(fs.readFileSync(join(state.repo,state.path)),archive,"source ZIP bytes preserved on rejection");
    const remaining=fs.readdirSync(state.attachments);
    nativeBinaryAssert.ok(remaining.every(name=>name===".wh-review-packets"),"rejected packet and captured source cleaned");
    if(remaining.includes(".wh-review-packets"))nativeBinaryAssert.deepEqual(fs.readdirSync(join(state.attachments,".wh-review-packets")),[]);
    process.stdout.write(JSON.stringify({case:mode,result:"PASS_EXPECTED_ZIP_GUARD_REJECTION",rejection,has_git_binary_patch:/^GIT binary patch$/m.test(deliveredDiff),packet_control_declared:controlDeclared,source_bytes:archive.length,source_sha256:nativeBinaryHash(archive),source_preserved:true,packet_artifacts_removed:true,provider_dispatched:false})+"\n");
  } finally {
    fs.rmSync(state.root,{recursive:true,force:true});nativeBinaryAssert.equal(fs.existsSync(state.root),false);
    process.stdout.write(JSON.stringify({case:mode,owned_fixture_root:state.root,fixture_absent:true})+"\n");
  }
}
nativeBinaryTest("rejects real ZIP when its supplied diff lacks a GIT binary patch tag",()=>nativeBinaryGuardRejection("no-binary-tag"));
nativeBinaryTest("rejects real ZIP when its source path conflicts with a declared packet control",()=>nativeBinaryGuardRejection("control-conflict"));

});
