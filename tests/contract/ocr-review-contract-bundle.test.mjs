// build-plan 预写测试（冻结）：断言变更须走 test change request + 独立审查
//
// T020 / ADR-021 目标契约（现行实现下必 RED）：
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

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createCanonicalReceiptWriter } from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace, prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { prepareTaskBoundBuildCodeReviewBundle } from "../../tools/cli/stage-runtime.mjs";

const repoRoot = realpathSync(join(import.meta.dirname, "..", ".."));
const whReviewContractBytes = (name) => readFileSync(join(repoRoot, "skills", "wh-review", "contracts", name));
const lensSkillBytes = (name) => readFileSync(join(repoRoot, "skills", name, "SKILL.md"));

const roots = [];

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "ocr-review-contract-bundle-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub OCR contract test"]);
  git(["config", "user.email", "ocr-contract@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "ocr contract fixture\n", "utf8");
  git(["add", "README.md"]);
  git(["commit", "-qm", "fixture"]);
  const taskId = `ocr-review-contract-${Math.random().toString(16).slice(2)}`;
  const task = createTask({
    storageRoot: root,
    taskPath: join(root, "Projects", "workflowhub", "tasks", taskId),
    manifest: {
      schema_version: "1.0.0", execution_mode: "per_invocation", record_model: "vnext-single-write",
      project_name: "workflowhub", task_id: taskId, created_at: "2026-09-25T00:00:00.000Z",
      target_repo_root: repo, issue_ids: [], inputs: {},
    },
  });
  const workspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  artifacts.writeAtomic("decision-log.md", "# Decision log\n\n## 任务身份\n\n- **任务类型**：普通任务\n");
  for (const name of ["spec.md", "plan.md", "tasks.md"]) artifacts.writeAtomic(name, `# ${name}\n`);
  return { root, task, workspace };
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
}

describe("OCR code review packet carries the reviewer contract bodies (T020)", () => {
  it("ships contracts, provider protocol, review focus, and lens bodies in the build-code phase packet", () => {
    const state = fixture();
    writeFileSync(join(state.workspace.worktreeRoot, "README.md"), "phase implementation under review\n");
    const attachmentRoot = join(state.root, "review-data");
    mkdirSync(attachmentRoot);
    const receipt = createCanonicalReceiptWriter({
      task: state.task, workspace: openCurrentTaskWorkspace(state.task),
      stage: "build-code", component: "build-code-test-capture",
    }).captureTests({
      command: 'test "$(cat README.md)" = "phase implementation under review"',
      receiptRef: "quality/tests/build-code-current.json",
      outputRef: "quality/tests/output/build-code-current.output",
    });
    const request = {
      stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P3",
      host_provider: "codex/luna",
      materials: {
        approved_spec: "The phase implements the accepted decision against the current spec.",
        acceptance_criteria: "AC-1: the phase diff keeps the complete criterion text.",
        test_evidence: { receipt_ref: receipt.receipt_ref, receipt_hash: receipt.receipt_hash },
      },
    };
    const bundle = prepareTaskBoundBuildCodeReviewBundle(
      { task: state.task, workspace: openCurrentTaskWorkspace(state.task) },
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

  it("ships contracts, provider protocol, review focus, and lens bodies in the verify-code final packet", () => {
    const state = fixture();
    writeFileSync(join(state.workspace.worktreeRoot, "README.md"), "final implementation under review\n");
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
      { task: state.task, workspace: openCurrentTaskWorkspace(state.task) },
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

  it("fails packet assembly when the provider protocol contract is missing", () => {
    const state = fixture();
    const attachmentRoot = join(state.root, "review-data");
    mkdirSync(attachmentRoot, { recursive: true });
    const request = {
      stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P3",
      host_provider: "codex/luna",
      materials: { acceptance_criteria: "AC-1: keep the complete criterion text." },
    };
    expect(() => prepareTaskBoundBuildCodeReviewBundle(
      { task: state.task, workspace: state.workspace },
      request,
      {
        loadConfig: () => ({ attachmentRoot }),
        captureSource: () => ({ dispose() {} }),
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
