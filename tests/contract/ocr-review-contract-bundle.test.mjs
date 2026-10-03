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
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

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
