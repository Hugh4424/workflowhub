import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createTask } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace, prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { runCapture as runBuildCapture } from "../../workflows/build-code/capture.mjs";
import { runCapture as runVerifyCapture } from "../../workflows/verify-code/capture.mjs";
import {
  canonicalMaterialManifest,
  redactProviderHostPaths,
  validateAuthorityMap,
  validateBuildCodeAcceptanceMap,
  validateDiffIndexBundle,
  phaseDiffDeliveryForPath,
  buildReviewMaterials,
  reviewInstructionsFor,
} from "../../skills/wh-review/scripts/review-materials.mjs";
import { captureReviewSource } from "../../skills/wh-review/scripts/review-source.mjs";

const roots = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function taskFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-review-materials-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git(["init", "-q"]);
  git(["config", "user.name", "WorkflowHub Tests"]);
  git(["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "base\n");
  git(["add", "."]);
  git(["commit", "-qm", "base"]);
  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0", project_name: "WorkflowHub", task_id: "review-materials-contract",
      created_at: "2026-08-04T00:00:00Z", target_repo_root: repo, issue_ids: [], inputs: {},
      record_model: "vnext-single-write",
    },
  });
  const candidate = prepareTaskWorkspace(task);
  return { root, task, workspace: openCurrentTaskWorkspace(task) };
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("current review material and capture contracts", () => {
  it("redacts local host paths only in the provider-derived view", () => {
    const source = { approved_direction: "See /Users/Hugh/Downloads/report.md and /tmp/private.json", refs: ["repo/spec.md"] };
    expect(redactProviderHostPaths(source)).toEqual({
      approved_direction: "See <host-path-redacted> and <host-path-redacted>",
      refs: ["repo/spec.md"],
    });
    expect(source.approved_direction).toContain("/Users/Hugh/Downloads/report.md");
  });

  it("keeps canonical manifests deterministic and rejects generic AC maps", () => {
    expect(canonicalMaterialManifest([
      { path: "b.json", bytes: 2, sha256: "b" },
      { path: "a.json", bytes: 1, sha256: "a" },
    ])).toBe(JSON.stringify([
      { path: "a.json", bytes: 1, sha256: "a" },
      { path: "b.json", bytes: 2, sha256: "b" },
    ]));
    const valid = {
      acceptance_ids: ["AC-1", "AC-2"],
      entries: [
        { id: "AC-1", change_ids: ["C-1"], implementation: "implementation for AC-1", verification: "test for AC-1" },
        { id: "AC-2", change_ids: ["C-2"], implementation: "implementation for AC-2", verification: "test for AC-2" },
      ],
    };
    expect(() => validateBuildCodeAcceptanceMap(valid)).not.toThrow();
    expect(() => validateBuildCodeAcceptanceMap({
      ...valid,
      entries: valid.entries.map((entry) => ({ ...entry, implementation: "same", verification: "same", change_ids: [] })),
    })).toThrow(/generic mapping is not allowed/);
  });

  it("rejects one shared proving anchor across multiple AC evidence entries", () => {
    const anchor = { id: "shared", path: "runtime/stage/stage-handlers.mjs", start_line: 220, end_line: 235, role: "implementation", reason: "shared fixture anchor" };
    const map = {
      state: "complete",
      summary: "fixture evidence map",
      entries: [
        { id: "AC-002", subject: "first", rationale: "first", disposition: "complete", anchors: [anchor] },
        { id: "AC-009", subject: "second", rationale: "second", disposition: "complete", anchors: [{ ...anchor, id: "shared-again" }] },
      ],
    };
    expect(() => validateAuthorityMap("evidence_map", map)).toThrow(/share one proving anchor/i);
  });

  it("authenticates an included diff shard and rejects tampering", () => {
    const bundleRoot = mkdtempSync(join(tmpdir(), "workflowhub-diff-index-"));
    roots.push(bundleRoot);
    mkdirSync(join(bundleRoot, "diff-shards"));
    const shard = "diff --git a/src.mjs b/src.mjs\n+@@ -1 +1 @@\n+old\n+new\n";
    writeFileSync(join(bundleRoot, "diff-shards", "shard-1.diff"), shard);
    writeFileSync(join(bundleRoot, "diff-index.json"), `${JSON.stringify({
      schema_version: "wh-review-diff-index.v1", delivery_mode: "selected_context",
      coverage: { change_ids_total: 1, change_ids_indexed: 1 },
      changes: [{ change_id: "C-1", path: "src.mjs", shards: [{ delivery: "included", shard_id: "shard-1", bytes: Buffer.byteLength(shard), sha256: sha256(shard) }] }],
    })}\n`);
    expect(() => validateDiffIndexBundle(bundleRoot)).not.toThrow();
    writeFileSync(join(bundleRoot, "diff-shards", "shard-1.diff"), `${shard}tampered`);
    expect(() => validateDiffIndexBundle(bundleRoot)).toThrow(/missing or tampered/);
  });

  it("keeps implementation diffs complete and bounds non-code large-Phase diffs to summaries", () => {
    expect(phaseDiffDeliveryForPath("runtime/stage/stage-runner.mjs")).toBe("included");
    expect(phaseDiffDeliveryForPath("workflows/build-code/steps.json")).toBe("included");
    expect(phaseDiffDeliveryForPath("skills/spec-analyze/SKILL.md")).toBe("included");
    expect(phaseDiffDeliveryForPath("skills/grill-with-docs/SKILL.md")).toBe("included");
    expect(phaseDiffDeliveryForPath("skills/spec-clarify/SKILL.md")).toBe("included");
    expect(phaseDiffDeliveryForPath("skills/talk-with-zhipeng/SKILL.md")).toBe("included");
    expect(phaseDiffDeliveryForPath("skills/mini-task/SKILL.md")).toBe("included");
    expect(phaseDiffDeliveryForPath("skills/grill-with-docs/skill-bundle.json")).toBe("included");
    expect(phaseDiffDeliveryForPath("skills/spec-clarify/skill-bundle.json")).toBe("included");
    expect(phaseDiffDeliveryForPath("skills/catalog.yaml")).toBe("included");
    expect(phaseDiffDeliveryForPath("core/__tests__/stage-skill-runtime.test.mjs")).toBe("summary");
    expect(phaseDiffDeliveryForPath("tests/contract/example.test.mjs")).toBe("summary");
    expect(phaseDiffDeliveryForPath("specs/task/plan.md")).toBe("summary");
  });

  it("uses the current canonical receipt writer through both build and verify capture wrappers", async () => {
    const { task, workspace } = taskFixture();
    const build = await runBuildCapture("true", "quality/tests/build-capture.json", {
      task, workspace, outputRef: "quality/tests/output/build-capture.output",
    });
    const verify = await runVerifyCapture("true", "quality/tests/verify-capture.json", {
      task, workspace, outputRef: "quality/tests/output/verify-capture.output",
    });
    expect(build).toMatchObject({ exit_code: 0, stage: "build-code", source_digest: expect.any(String) });
    expect(verify).toMatchObject({ exit_code: 0, stage: "verify-code", source_digest: expect.any(String) });
  });

  it("defines distinct mini-task design and implementation packet contracts", async () => {
    const { reviewRuleFor, minimumReviewersFor } = await import("../../runtime/review/review-policy.mjs");
    expect(reviewRuleFor("mini_task.design").required).toEqual(expect.arrayContaining(["decision_log", "spec", "plan", "tasks"]));
    expect(reviewRuleFor("mini_task.implementation").required).toEqual(expect.arrayContaining(["test_evidence", "ac_trace", "user_result"]));
    expect(minimumReviewersFor("mini_task.design")).toBe(1);
    expect(minimumReviewersFor("mini_task.implementation")).toBe(1);
  });

  it("constructs both mini-task packets and binds implementation evidence to the current snapshot", () => {
    const { root, task, workspace } = taskFixture();
    writeFileSync(join(workspace.worktreeRoot, "mini-task.mjs"), "export const result = 'ok';\n");
    const source = captureReviewSource({ workspace, reviewDataRoot: root, includeDiff: true });
    try {
      const common = {
        raw_requirement: "交付一个边界清楚的小功能。",
        decision_log: "## 原始需求\n\n交付一个边界清楚的小功能。\n\n## 决定\n\n采用 mini-task。\n",
        spec: "# Spec\n\n用户得到一个明确结果。\n",
        plan: "# Plan\n\n先实现，再测试，再交付。\n",
        tasks: "# Tasks\n\n- T-mini：实现并验证。\n",
      };
      const design = buildReviewMaterials({
        reviewDataRoot: root, attachmentRoot: root, source, task, taskId: "review-materials-contract",
        stage: "build-code", reviewKind: "mini_task.design",
        materials: { ...common, review_instructions: reviewInstructionsFor("build-code", null, false, null, "mini_task.design") },
      });
      expect(design.files).toEqual(expect.arrayContaining([
        "contracts/mini-task-design.md",
        "requirements/decision_log.md",
        "requirements/spec.md",
        "packet-plan.json",
      ]));
      expect(reviewInstructionsFor("build-code", null, false, null, "mini_task.design"))
        .toMatch(/frozen four materials and the design risks/i);
      expect(reviewInstructionsFor("build-code", null, false, null, "mini_task.design"))
        .not.toMatch(/changes\.diff|diff-index\.json|diff-shards/i);
      expect(reviewInstructionsFor("build-code", null, false, null, "mini_task.implementation"))
        .toMatch(/actual repair or subject change[\s\S]*Do not mechanically retry/i);
      expect(design.packetPlan.review_kind).toBe("mini_task.design");

      const receipt = `${JSON.stringify({ command: "npx vitest run mini-task", exit_code: 0, snapshot_tree: source.snapshotTree })}\n`;
      const receiptRef = "quality/tests/mini-task-implementation.json";
      const evidence = `${JSON.stringify({ snapshot_tree: source.snapshotTree, user_visible_result: "ok" })}\n`;
      const evidenceRef = "quality/evidence/mini-task-user-result.json";
      task.createRecordAtomic(receiptRef, receipt);
      task.createRecordAtomic(evidenceRef, evidence);
      const receiptHash = sha256(receipt);
      const evidenceHash = sha256(evidence);
      const implementation = buildReviewMaterials({
        reviewDataRoot: root, attachmentRoot: root, source, task, taskId: "review-materials-contract",
        stage: "build-code", reviewKind: "mini_task.implementation",
        materials: {
          ...common,
          test_evidence: { receipt_ref: receiptRef, receipt_hash: receiptHash, suite_scope: "focused", coverage_classes: ["behavior"] },
          ac_trace: {
            schema_version: "ac-change-test-trace.v1",
            snapshot_tree: source.snapshotTree,
            acceptance_ids: ["AC-MINI-001"],
            entries: [{
              acceptance_criterion_id: "AC-MINI-001",
              change: [{ task_id: "T-mini", summary: "实现明确结果" }],
              test: [{ receipt_ref: receiptRef, receipt_hash: receiptHash }],
              evidence: [{ ref: evidenceRef, sha256: evidenceHash }],
              anchors: [{ id: "mini-result", path: "mini-task.mjs", start_line: 1, end_line: 1, role: "implementation", reason: "实现用户结果" }],
            }],
          },
          user_result: { status: "verified", method: "cli", result: "ok", snapshot_tree: source.snapshotTree },
          coverage_limits: ["仅覆盖 mini-task CLI 结果"],
          skip_reasons: ["无"],
          remaining_risks: ["真实 remote push 不在合同测试范围内"],
          review_instructions: reviewInstructionsFor("build-code", null, false, null, "mini_task.implementation"),
        },
      });
      expect(implementation.files).toEqual(expect.arrayContaining([
        "source.json",
        "changes.diff",
        "contracts/mini-task-implementation.md",
        "evidence/test-summary.json",
        "requirements/ac_trace.json",
        "context/mini-result.txt",
      ]));
      expect(implementation.packetPlan.review_kind).toBe("mini_task.implementation");
      expect(readFileSync(join(implementation.bundleRoot, "contracts/mini-task-implementation.md"), "utf8"))
        .toMatch(/变更文件.*anchor.*例外/s);
    } finally {
      source.dispose();
    }
  });

  it("rejects a mini-task implementation test receipt from an older snapshot", () => {
    const { root, task, workspace } = taskFixture();
    writeFileSync(join(workspace.worktreeRoot, "mini-task.mjs"), "export const result = 'ok';\n");
    const source = captureReviewSource({ workspace, reviewDataRoot: root, includeDiff: true });
    try {
      const receipt = `${JSON.stringify({ command: "npx vitest run mini-task", exit_code: 0, snapshot_tree: "old-snapshot" })}\n`;
      const receiptRef = "quality/tests/mini-task-stale.json";
      task.createRecordAtomic(receiptRef, receipt);
      const common = {
        raw_requirement: "交付一个小功能。", decision_log: "## 原始需求\n\n交付一个小功能。\n",
        spec: "# Spec\n", plan: "# Plan\n", tasks: "# Tasks\n",
        test_evidence: { receipt_ref: receiptRef, receipt_hash: sha256(receipt) },
        ac_trace: { schema_version: "ac-change-test-trace.v1", snapshot_tree: source.snapshotTree, acceptance_ids: ["AC-1"], entries: [{ acceptance_criterion_id: "AC-1", change: [{ task_id: "T-1", summary: "change" }], test: [{ receipt_ref: receiptRef, receipt_hash: sha256(receipt) }], evidence: [{ ref: receiptRef, sha256: sha256(receipt) }], anchors: [{ id: "a", path: "mini-task.mjs", start_line: 1, end_line: 1, role: "implementation", reason: "change" }] }] },
        user_result: { status: "verified", result: "ok" },
        coverage_limits: ["仅覆盖 mini-task CLI 结果"],
        skip_reasons: ["无"],
        remaining_risks: ["真实 remote push 不在合同测试范围内"],
        review_instructions: reviewInstructionsFor("build-code", null, false, null, "mini_task.implementation"),
      };
      expect(() => buildReviewMaterials({ reviewDataRoot: root, attachmentRoot: root, source, task, taskId: "review-materials-contract", stage: "build-code", reviewKind: "mini_task.implementation", materials: common })).toThrow(/current[- ]snapshot/);
    } finally {
      source.dispose();
    }
  });

  it("captures the complete changed file set without caller path filters", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-phase-source-")));
    roots.push(root);
    const repo = join(root, "repo");
    mkdirSync(repo);
    const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
    git(["init", "-q"]); git(["config", "user.name", "WorkflowHub Tests"]); git(["config", "user.email", "tests@workflowhub.local"]);
    writeFileSync(join(repo, "phase.mjs"), "base\n");
    writeFileSync(join(repo, "other.mjs"), "base\n");
    git(["add", "."]); git(["commit", "-qm", "base"]);
    writeFileSync(join(repo, "phase.mjs"), "phase changed\n");
    writeFileSync(join(repo, "other.mjs"), "other changed\n");
    const source = captureReviewSource({
      sourceRoot: repo, targetRepoRoot: repo, reviewDataRoot: root,
      includeDiff: true,
    });
    try {
      expect(source.changedFiles.map(({ path }) => path)).toEqual(["other.mjs", "phase.mjs"]);
      const diff = readFileSync(source.diffPath, "utf8");
      expect(diff).toContain("phase.mjs");
      expect(diff).toContain("other.mjs");
    } finally {
      source.dispose();
    }
  });

  it("rejects a build-code phase test receipt from an older snapshot", () => {
    const { root, task, workspace } = taskFixture();
    writeFileSync(join(workspace.worktreeRoot, "phase.mjs"), "phase changed\n");
    const source = captureReviewSource({ workspace, reviewDataRoot: root, phaseId: "P4", includeDiff: true });
    try {
      const receipt = `${JSON.stringify({ command: "true", exit_code: 0, snapshot_tree: "old-snapshot" })}\n`;
      const receiptRef = "quality/tests/phase-stale.json";
      task.createRecordAtomic(receiptRef, receipt);
      expect(() => buildReviewMaterials({
        reviewDataRoot: root,
        attachmentRoot: root,
        source,
        task,
        taskId: "review-materials-contract",
        stage: "build-code",
        phaseId: "P4",
        materials: {
          approved_spec: "AC-1：阶段测试必须绑定当前 snapshot。",
          acceptance_criteria: "AC-1：阶段测试必须绑定当前 snapshot。",
          test_evidence: { receipt_ref: receiptRef, receipt_hash: sha256(receipt) },
          review_instructions: reviewInstructionsFor("build-code", null, false, "phase"),
        },
      })).toThrow(/current[- ]snapshot/);
    } finally {
      source.dispose();
    }
  });
});
