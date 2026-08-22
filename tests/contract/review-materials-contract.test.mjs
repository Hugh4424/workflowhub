import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
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
  validateVerifyAcceptanceSummary,
  validateDiffIndexBundle,
  phaseDiffDeliveryForPath,
  buildReviewMaterials,
  reviewInstructionsFor,
} from "../../skills/wh-review/scripts/review-materials.mjs";
import { captureReviewSource } from "../../skills/wh-review/scripts/review-source.mjs";

const roots = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const sourceForPlanFixture = {
  targetCommit: "1".repeat(40),
  baseCommit: "2".repeat(40),
  baseTree: "3".repeat(40),
  capturedHead: "4".repeat(40),
  snapshotTree: "5".repeat(40),
  changedFiles: [],
};

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
  writeFileSync(join(candidate.worktreeRoot, "package.json"), `${JSON.stringify({ scripts: { test: "true" } })}\n`);
  return { root, task, workspace: openCurrentTaskWorkspace(task) };
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("current review material and capture contracts", () => {
  it("reports all missing verify-code materials in one preflight", () => {
    const { root, task } = taskFixture();
    expect(() => buildReviewMaterials({
      reviewDataRoot: root,
      attachmentRoot: root,
      source: sourceForPlanFixture,
      task,
      taskId: "review-materials-contract",
      stage: "verify-code",
      materials: {},
    })).toThrow("MATERIAL_INCOMPLETE: missing or empty changed_files, implementation_assessment, test_context, open_risks, review_instructions");
  });

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
        { id: "AC-1", change_ids: ["C-1"], implementation: "implementation for AC-1", verification: "test for AC-1", implementation_anchor_ids: ["impl-1"], verification_anchor_ids: ["test-1"] },
        { id: "AC-2", change_ids: ["C-2"], implementation: "implementation for AC-2", verification: "test for AC-2", implementation_anchor_ids: ["impl-2"], verification_anchor_ids: ["test-2"] },
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
    expect(() => validateAuthorityMap("evidence_map", map)).toThrow(/(?:share|overlap) one proving anchor/i);
  });

  it("rejects an empty verify acceptance summary before provider dispatch", () => {
    expect(() => validateVerifyAcceptanceSummary(JSON.stringify({ criteria: [] })))
      .toThrow(/empty criteria list/);
    expect(() => validateVerifyAcceptanceSummary("当前验收材料已准备"))
      .toThrow(/must name current ACs/);
    expect(validateVerifyAcceptanceSummary(JSON.stringify({ criteria: [
      { acceptance_criterion_id: "AC-01", status: "incomplete", actual_outcome: "证据不足" },
    ] }))).toBe(true);
  });

  it("rejects a verify summary copied from an older AC set", () => {
    const oldIds = Array.from({ length: 26 }, (_, index) => `AC-${String(index + 1).padStart(2, "0")}`);
    const currentIds = Array.from({ length: 32 }, (_, index) => `AC-${String(index + 1).padStart(2, "0")}`);
    expect(() => validateVerifyAcceptanceSummary(oldIds.join("\n"), { expectedCriterionIds: currentIds }))
      .toThrow(/does not match current spec AC set/);
    expect(validateVerifyAcceptanceSummary(currentIds.join("\n"), { expectedCriterionIds: currentIds })).toBe(true);
  });

  it("does not treat AC range prose as a canonical criterion id", () => {
    expect(() => validateVerifyAcceptanceSummary(JSON.stringify({ criteria: [
      { id: "AC-01..32", status: "incomplete" },
    ] }))).toThrow(/must identify ACs/);
    expect(() => validateVerifyAcceptanceSummary("AC-01..32", {
      expectedCriterionIds: ["AC-01", "AC-02"],
    })).toThrow(/must name current ACs/);
  });

  it("accepts the same typed AC identifiers used by integration review", () => {
    expect(validateVerifyAcceptanceSummary(JSON.stringify({ criteria: [
      { acceptance_criterion_id: "AC-E2E-001", status: "incomplete", actual_outcome: "证据不足" },
    ] }))).toBe(true);
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
      changes: [{ change_id: "C-1", path: "src.mjs", new_line_ranges: [{ start_line: 1, end_line: 1 }], shards: [{ delivery: "included", shard_id: "shard-1", bytes: Buffer.byteLength(shard), sha256: sha256(shard) }] }],
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
    expect(phaseDiffDeliveryForPath("core/__tests__/stage-skill-runtime.test.mjs")).toBe("included");
    expect(phaseDiffDeliveryForPath("tests/contract/example.test.mjs")).toBe("included");
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

  it("keeps the build-plan projection for spec-analyze without sending a second copy to the provider", () => {
    const { root, task } = taskFixture();
    const bundle = buildReviewMaterials({
      reviewDataRoot: root,
      attachmentRoot: root,
      source: { ...sourceForPlanFixture },
      task,
      taskId: "review-materials-contract",
      stage: "build-plan",
      materials: {
        raw_requirement: "原始需求",
        approved_spec: "已批准 spec",
        acceptance_criteria: "AC-1",
        draft_plan: "先实现再验证",
        draft_tasks: "T-1",
        review_instructions: reviewInstructionsFor("build-plan"),
      },
    });
    expect(existsSync(join(bundle.bundleRoot, "requirements/planning_artifacts.json"))).toBe(true);
    expect(bundle.files).not.toContain("requirements/planning_artifacts.json");
    expect(JSON.parse(readFileSync(join(bundle.bundleRoot, "packet-plan.json"), "utf8")).excluded)
      .toEqual(expect.arrayContaining([expect.objectContaining({ category: "generated:planning_artifacts" })]));
  });

  it("rejects an oversized non-build-code packet before dispatch instead of silently truncating it", () => {
    const { root, task } = taskFixture();
    const oversized = "关键行为\n" + "x".repeat(400 * 1024);
    expect(() => buildReviewMaterials({
      reviewDataRoot: root,
      attachmentRoot: root,
      source: sourceForPlanFixture,
      task,
      taskId: task.identity.taskId,
      stage: "build-spec",
      materials: {
        raw_requirement: oversized,
        approved_decision: "采用当前方向。\n",
        draft_spec: "# Spec\nAC-01\n",
        review_instructions: reviewInstructionsFor("build-spec"),
      },
    })).toThrow(/MATERIAL_TOO_LARGE.*330 KiB/);
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
      expect(readFileSync(join(design.bundleRoot, "requirements/raw_requirement.md"), "utf8"))
        .toContain("交付一个边界清楚的小功能。");
      expect(readFileSync(join(design.bundleRoot, "requirements/decision_log.md"), "utf8"))
        .not.toContain("交付一个边界清楚的小功能。");
      expect(readFileSync(join(design.bundleRoot, "requirements/decision_log.md"), "utf8"))
        .toContain("## 决定");
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
      const traceProjection = JSON.parse(readFileSync(join(implementation.bundleRoot, "requirements/ac_trace.json"), "utf8"));
      expect(traceProjection.entries[0].test).toEqual([{ receipt_ref: receiptRef, receipt_hash: receiptHash }]);
      expect(traceProjection.entries[0].evidence).toEqual([{ ref: evidenceRef, sha256: evidenceHash }]);
      expect(readFileSync(join(implementation.bundleRoot, "contracts/mini-task-implementation.md"), "utf8"))
        .toMatch(/变更文件.*anchor.*例外/s);
    } finally {
      source.dispose();
    }
  });

  it("keeps a near-limit mini-task design packet provider-visible without dropping frozen materials", () => {
    const { root, task } = taskFixture();
    const fill = (size, prefix) => `${prefix}${"x".repeat(Math.max(0, size - Buffer.byteLength(prefix)))}`;
    const rawRequirement = fill(1552, "原始需求：");
    const decisionLog = `## 原始需求\n\n${rawRequirement}\n\n## 决定\n\n${fill(17800, "决定：")}\n`;
    const spec = fill(154435, "# Spec\n\n");
    const plan = fill(85123, "# Plan\n\n");
    const tasks = fill(68489, "# Tasks\n\n");
    const bundle = buildReviewMaterials({
      reviewDataRoot: root,
      attachmentRoot: root,
      source: sourceForPlanFixture,
      task,
      taskId: task.identity.taskId,
      stage: "build-code",
      reviewKind: "mini_task.design",
      materials: {
        raw_requirement: rawRequirement,
        decision_log: decisionLog,
        spec,
        plan,
        tasks,
        review_instructions: reviewInstructionsFor("build-code", null, false, null, "mini_task.design"),
      },
    });
    expect(bundle.packetPlan.delivery_bytes).toBeLessThanOrEqual(330 * 1024);
    expect(readFileSync(join(bundle.bundleRoot, "requirements/spec.md"), "utf8")).toBe(spec);
    expect(readFileSync(join(bundle.bundleRoot, "requirements/plan.md"), "utf8")).toBe(plan);
    expect(readFileSync(join(bundle.bundleRoot, "requirements/tasks.md"), "utf8")).toBe(tasks);
    const providerProtocol = readFileSync(join(bundle.bundleRoot, "contracts/provider-protocol.md"), "utf8");
    expect(providerProtocol).toContain('"findings": []');
    expect(providerProtocol).toContain("只读取本次 bundle 内的文件");
    expect(Buffer.byteLength(providerProtocol)).toBeLessThan(4 * 1024);
  });

  it("fails a mini-task packet when the decision log cannot yield the bounded original requirement", () => {
    const { root, task, workspace } = taskFixture();
    const source = captureReviewSource({ workspace, reviewDataRoot: root, includeDiff: false });
    try {
      expect(() => buildReviewMaterials({
        reviewDataRoot: root,
        attachmentRoot: root,
        source,
        task,
        taskId: "review-materials-contract",
        stage: "build-code",
        reviewKind: "mini_task.design",
        materials: {
          raw_requirement: "交付一个小功能。",
          decision_log: "# Decision Log\n\n## 决定\n\n采用 mini-task。\n",
          spec: "# Spec\n",
          plan: "# Plan\n",
          tasks: "# Tasks\n",
          review_instructions: reviewInstructionsFor("build-code", null, false, null, "mini_task.design"),
        },
      })).toThrow(/MATERIAL_INCOMPLETE.*original requirement/i);
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
      })).toThrow(/canonical test receipt provenance is invalid/);
    } finally {
      source.dispose();
    }
  });

  it("accepts a phase test receipt across execution-status-only tasks writeback", async () => {
    const { root, task, workspace } = taskFixture();
    const taskId = task.identity.taskId;
    const tasksRoot = join(workspace.worktreeRoot, "specs", taskId);
    mkdirSync(tasksRoot, { recursive: true });
    const taskCard = "# Tasks\n\n### 设计\n- P4 phase remains unchanged.\n\n### 执行状态填写区\n- status: pending\n";
    const tasksPath = join(tasksRoot, "tasks.md");
    writeFileSync(tasksPath, taskCard);
    writeFileSync(join(workspace.worktreeRoot, "phase.mjs"), "phase changed\n");
    const before = captureReviewSource({ workspace, reviewDataRoot: root, taskId, phaseId: "P4", includeDiff: true });
    const receiptRef = "quality/tests/phase-writeback.json";
    const receipt = await runBuildCapture("true", receiptRef, {
      task,
      workspace,
      outputRef: "quality/tests/output/phase-writeback.output",
    });
    writeFileSync(tasksPath, taskCard.replace("status: pending", "status: completed"));
    const after = captureReviewSource({ workspace, reviewDataRoot: root, taskId, phaseId: "P4", includeDiff: true });
    try {
      expect(after.snapshotTree).not.toBe(before.snapshotTree);
      expect(() => buildReviewMaterials({
        reviewDataRoot: root,
        attachmentRoot: root,
        source: after,
        task,
        taskId,
        stage: "build-code",
        phaseId: "P4",
        materials: {
          approved_spec: "AC-1：阶段测试必须绑定当前 snapshot。",
          acceptance_criteria: "AC-1：阶段测试必须绑定当前 snapshot。",
          test_evidence: { receipt_ref: receiptRef, receipt_hash: receipt.receipt_hash },
          review_instructions: reviewInstructionsFor("build-code", null, false, "phase"),
        },
      })).not.toThrow();
    } finally {
      before.dispose();
      after.dispose();
    }
  });

  it("rejects a phase test receipt without canonical provenance", () => {
    const { root, task, workspace } = taskFixture();
    writeFileSync(join(workspace.worktreeRoot, "phase.mjs"), "phase changed\n");
    const source = captureReviewSource({ workspace, reviewDataRoot: root, phaseId: "P4", includeDiff: true });
    try {
      const receipt = `${JSON.stringify({ command: "true", exit_code: 0, snapshot_tree: source.snapshotTree })}\n`;
      const receiptRef = "quality/tests/phase-forged.json";
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
      })).toThrow(/canonical test receipt provenance is invalid/);
    } finally {
      source.dispose();
    }
  });

  it("accepts an integration packet when only the execution-status block changed", async () => {
    const { root, task, workspace } = taskFixture();
    const taskId = task.identity.taskId;
    const tasksPath = join(workspace.worktreeRoot, "specs", taskId, "tasks.md");
    mkdirSync(join(workspace.worktreeRoot, "specs", taskId), { recursive: true });
    const taskCard = "# Tasks\n\n### T001 — implementation\n- **状态**：`completed`\n- **covered_ac**：AC-01\n- **evidence_refs**：`quality/tests/integration-current.json`\n- **执行事实**：实现已完成。\n";
    writeFileSync(tasksPath, taskCard);
    const receiptRef = "quality/tests/integration-current.json";
    await runBuildCapture("npm test", receiptRef, {
      task,
      workspace,
      outputRef: "quality/tests/output/integration-current.output",
    });
    const receipt = task.readRecord(receiptRef);
    writeFileSync(tasksPath, `${taskCard}\n### 执行状态填写区\n- 记录：只写回执行事实。\n`);
    const source = captureReviewSource({ workspace, reviewDataRoot: root, taskId, includeDiff: false });
    try {
      expect(() => buildReviewMaterials({
        reviewDataRoot: root,
        attachmentRoot: root,
        source,
        task,
        taskId,
        stage: "build-code",
        reviewScope: "integration",
        materials: {
          approved_spec: "# Spec\n\nAC-01：实现结果正确。\n",
          acceptance_criteria: "# Acceptance\n\nAC-01：实现结果正确。\n",
          test_evidence: { receipt_ref: receiptRef, receipt_hash: sha256(receipt) },
          ac_trace: {
            schema_version: "ac-change-test-trace.v1",
            snapshot_tree: source.snapshotTree,
            acceptance_ids: ["AC-01"],
            entries: [{
              acceptance_criterion_id: "AC-01",
              change: [{ task_id: "T001", summary: "实现已完成" }],
              test: [{ receipt_ref: receiptRef, receipt_hash: sha256(receipt) }],
              evidence: [{ ref: receiptRef, sha256: sha256(receipt) }],
              anchors: [{ id: "implementation", path: "README.md", start_line: 1, end_line: 1, role: "implementation", reason: "当前实现" }],
            }],
          },
          review_instructions: reviewInstructionsFor("build-code", null, false, "integration"),
        },
      })).not.toThrow();
    } finally {
      source.dispose();
    }
  });

  it("rejects a current build-code integration receipt whose command is not npm test", async () => {
    const { root, task, workspace } = taskFixture();
    const taskId = task.identity.taskId;
    const receiptRef = "quality/tests/integration-custom-command.json";
    await runBuildCapture("printf integration", receiptRef, {
      task,
      workspace,
      outputRef: "quality/tests/output/integration-custom-command.output",
    });
    const receipt = task.readRecord(receiptRef);
    const source = captureReviewSource({ workspace, reviewDataRoot: root, taskId, includeDiff: false });
    try {
      expect(() => buildReviewMaterials({
        reviewDataRoot: root,
        attachmentRoot: root,
        source,
        task,
        taskId,
        stage: "build-code",
        reviewScope: "integration",
        materials: {
          approved_spec: "# Spec\n\nAC-01：实现结果正确。\n",
          acceptance_criteria: "# Acceptance\n\nAC-01：实现结果正确。\n",
          test_evidence: { receipt_ref: receiptRef, receipt_hash: sha256(receipt) },
          ac_trace: {
            schema_version: "ac-change-test-trace.v1",
            snapshot_tree: source.snapshotTree,
            acceptance_ids: ["AC-01"],
            entries: [{
              acceptance_criterion_id: "AC-01",
              change: [{ task_id: "T001", summary: "实现已完成" }],
              test: [{ receipt_ref: receiptRef, receipt_hash: sha256(receipt) }],
              evidence: [{ ref: receiptRef, sha256: sha256(receipt) }],
              anchors: [{ id: "implementation-custom-command", path: "README.md", start_line: 1, end_line: 1, role: "implementation", reason: "当前实现" }],
            }],
          },
          review_instructions: reviewInstructionsFor("build-code", null, false, "integration"),
        },
      })).toThrow(/canonical test receipt provenance is invalid/);
    } finally {
      source.dispose();
    }
  });

  it("still builds a semantic integration packet when the test receipt is unavailable", () => {
    const { root, task, workspace } = taskFixture();
    const taskId = task.identity.taskId;
    const source = captureReviewSource({ workspace, reviewDataRoot: root, taskId, includeDiff: false });
    try {
      const bundle = buildReviewMaterials({
        reviewDataRoot: root,
        attachmentRoot: root,
        source,
        task,
        taskId,
        stage: "build-code",
        reviewScope: "integration",
        materials: {
          approved_spec: "# Spec\n\nAC-01：用户得到正确结果。\n",
          acceptance_criteria: "# Acceptance\n\nAC-01：用户得到正确结果。\n",
          ac_trace: {
            schema_version: "ac-change-test-trace.v1",
            snapshot_tree: source.snapshotTree,
            acceptance_ids: ["AC-01"],
            entries: [{
              acceptance_criterion_id: "AC-01",
              coverage_status: "unknown",
              coverage_reason: "当前测试回执不可用",
              change: [{ task_id: null, summary: "当前实现" }],
              test: [],
              evidence: [],
              evidence_status: "unavailable",
              evidence_reason: "当前实现回执不可用",
              anchors: [{ id: "integration-implementation", path: "README.md", start_line: 1, end_line: 1, role: "implementation", reason: "当前实现上下文" }],
            }],
            implementation_anchors: [{ id: "integration-implementation", path: "README.md", start_line: 1, end_line: 1, role: "implementation", reason: "当前实现上下文" }],
          },
          review_instructions: reviewInstructionsFor("build-code", null, false, "integration"),
        },
      });
      expect(bundle.files).not.toContain("requirements/test_evidence.json");
      expect(bundle.files).toContain("evidence/test-summary.json");
      expect(JSON.parse(readFileSync(join(bundle.bundleRoot, "evidence/test-summary.json"), "utf8"))).toMatchObject({ status: "unavailable" });
      expect(JSON.parse(readFileSync(join(bundle.bundleRoot, "packet-plan.json"), "utf8")).included.required).toContain("evidence/test-summary.json");
    } finally {
      source.dispose();
    }
  });

  it("treats an explicit missing integration test receipt as unavailable", () => {
    const { root, task, workspace } = taskFixture();
    const taskId = task.identity.taskId;
    const source = captureReviewSource({ workspace, reviewDataRoot: root, taskId, includeDiff: false });
    try {
      const bundle = buildReviewMaterials({
        reviewDataRoot: root,
        attachmentRoot: root,
        source,
        task,
        taskId,
        stage: "build-code",
        reviewScope: "integration",
        materials: {
          approved_spec: "# Spec\n\nAC-01：用户得到正确结果。\n",
          acceptance_criteria: "# Acceptance\n\nAC-01：用户得到正确结果。\n",
          test_evidence: { status: "missing", reason: "当前会话没有提供测试回执" },
          ac_trace: {
            schema_version: "ac-change-test-trace.v1",
            snapshot_tree: source.snapshotTree,
            acceptance_ids: ["AC-01"],
            entries: [{
              acceptance_criterion_id: "AC-01",
              coverage_status: "unknown",
              coverage_reason: "当前测试回执缺失",
              change: [{ task_id: null, summary: "当前实现" }],
              test: [],
              evidence: [],
              evidence_status: "unavailable",
              evidence_reason: "当前测试回执缺失",
              anchors: [{ id: "missing-test-implementation", path: "README.md", start_line: 1, end_line: 1, role: "implementation", reason: "当前实现上下文" }],
            }],
            implementation_anchors: [{ id: "missing-test-implementation", path: "README.md", start_line: 1, end_line: 1, role: "implementation", reason: "当前实现上下文" }],
          },
          review_instructions: reviewInstructionsFor("build-code", null, false, "integration"),
        },
      });
      expect(JSON.parse(readFileSync(join(bundle.bundleRoot, "evidence/test-summary.json"), "utf8"))).toMatchObject({
        status: "unavailable",
        reason: "当前会话没有提供测试回执",
      });
    } finally {
      source.dispose();
    }
  });

  it("keeps the integration AC trace host-only", async () => {
    const { root, task, workspace } = taskFixture();
    writeFileSync(join(workspace.worktreeRoot, "integration.mjs"), "export const result = 'ok';\n");
    const receiptRef = "quality/tests/integration-host-only.json";
    await runBuildCapture("npm test", receiptRef, {
      task,
      workspace,
      outputRef: "quality/tests/output/integration-host-only.output",
    });
    const receipt = task.readRecord(receiptRef);
    const source = captureReviewSource({ workspace, reviewDataRoot: root, taskId: task.identity.taskId, includeDiff: false });
    try {
      const bundle = buildReviewMaterials({
        reviewDataRoot: root,
        attachmentRoot: root,
        source,
        task,
        taskId: task.identity.taskId,
        stage: "build-code",
        reviewScope: "integration",
        materials: {
          approved_spec: "## 目标\n\n用户可以得到正确结果。\n",
          acceptance_criteria: "## 验收\n\nAC-01：用户得到正确结果。\n",
          test_evidence: { receipt_ref: receiptRef, receipt_hash: sha256(receipt) },
          ac_trace: {
            schema_version: "ac-change-test-trace.v1",
            snapshot_tree: source.snapshotTree,
            acceptance_ids: ["AC-01"],
            entries: [{
              acceptance_criterion_id: "AC-01",
              coverage_status: "unknown",
              coverage_reason: "host-side evidence is incomplete",
              change: [{ task_id: "T001", summary: "实现用户结果" }],
              test: [],
              evidence: [{ ref: receiptRef, sha256: sha256(receipt) }],
              anchors: [{ id: "integration-result", path: "integration.mjs", start_line: 1, end_line: 1, role: "implementation", reason: "当前实现" }],
            }],
            implementation_anchors: [{ id: "integration-code", path: "integration.mjs", start_line: 1, end_line: 1, role: "implementation", reason: "当前实现" }],
          },
          review_instructions: reviewInstructionsFor("build-code", null, false, "integration"),
        },
      });
      expect(bundle.files).not.toContain("requirements/ac_trace.json");
      expect(bundle.files).not.toContain("requirements/test_evidence.json");
      expect(bundle.files).not.toContain("canonical-evidence.json");
      expect(bundle.files).toContain("requirements/implementation_context.json");
      expect(bundle.files.some((file) => file.startsWith("context/"))).toBe(true);
      const packetPlan = JSON.parse(readFileSync(join(bundle.bundleRoot, "packet-plan.json"), "utf8"));
      expect(packetPlan.included.required).toContain("evidence/test-summary.json");
      expect(readFileSync(join(bundle.bundleRoot, "evidence/test-summary.json"), "utf8")).not.toMatch(/receipt_ref|snapshot_tree|sha256/i);
      expect(packetPlan.excluded).toEqual(expect.arrayContaining([
        expect.objectContaining({ category: "material:ac_trace", reason: expect.stringMatching(/host-only/i) }),
      ]));
    } finally {
      source.dispose();
    }
  });

  it("bounds integration provider context to delivery-critical excerpts", () => {
    const { root, task, workspace } = taskFixture();
    const paths = Array.from({ length: 10 }, (_value, index) => `runtime/provider-context-${index}.mjs`);
    mkdirSync(join(workspace.worktreeRoot, "runtime"), { recursive: true });
    for (const path of paths) {
      const target = join(workspace.worktreeRoot, path);
      writeFileSync(target, "export const value = " + JSON.stringify(path) + ";\n");
    }
    const source = captureReviewSource({ workspace, reviewDataRoot: root, taskId: task.identity.taskId, includeDiff: false });
    try {
      const implementationAnchors = paths.map((path, index) => ({
        id: `provider-context-${index}`,
        path,
        start_line: 1,
        end_line: 1,
        role: "implementation",
        reason: "delivery behavior context",
      }));
      const bundle = buildReviewMaterials({
        reviewDataRoot: root,
        attachmentRoot: root,
        source,
        task,
        taskId: task.identity.taskId,
        stage: "build-code",
        reviewScope: "integration",
        materials: {
          approved_spec: "## 目标\n\n用户得到正确结果。\n",
          acceptance_criteria: "## 验收\n\nAC-01：用户得到正确结果。\n",
          ac_trace: {
            schema_version: "ac-change-test-trace.v1",
            snapshot_tree: source.snapshotTree,
            acceptance_ids: ["AC-01"],
            entries: [{
              acceptance_criterion_id: "AC-01",
              coverage_status: "unknown",
              coverage_reason: "当前没有逐 AC 可用事实",
              change: [{ task_id: null, summary: "当前实现" }],
              test: [],
              evidence: [],
              evidence_status: "unavailable",
              evidence_reason: "当前实现回执不可用",
              anchors: [{ id: "provider-context-0", path: paths[0], start_line: 1, end_line: 1, role: "implementation", reason: "当前实现" }],
            }],
            implementation_anchors: implementationAnchors,
          },
          review_instructions: reviewInstructionsFor("build-code", null, false, "integration"),
        },
      });
      const contextFiles = bundle.files.filter((path) => path.startsWith("context/"));
      expect(contextFiles).toHaveLength(9);
      expect(JSON.parse(readFileSync(join(bundle.bundleRoot, "packet-plan.json"), "utf8")).excluded)
        .toEqual(expect.arrayContaining([
          expect.objectContaining({ category: "provider_context_overflow" }),
        ]));
    } finally {
      source.dispose();
    }
  });

  it("does not duplicate acceptance sections inside the integration approved spec", async () => {
    const { root, task, workspace } = taskFixture();
    const receiptRef = "quality/tests/integration-spec-compaction.json";
    await runBuildCapture("npm test", receiptRef, { task, workspace, outputRef: "quality/tests/output/integration-spec-compaction.output" });
    const receipt = task.readRecord(receiptRef);
    const source = captureReviewSource({ workspace, reviewDataRoot: root, taskId: task.identity.taskId, includeDiff: false });
    try {
      const bundle = buildReviewMaterials({
        reviewDataRoot: root,
        attachmentRoot: root,
        source,
        task,
        taskId: task.identity.taskId,
        stage: "build-code",
        reviewScope: "integration",
        materials: {
          approved_spec: "## 目标\n\n实现稳定结果。\n\n## 验收\n\nAC-01：结果正确。\n",
          acceptance_criteria: "## 验收\n\nAC-01：结果正确。\n",
          test_evidence: { receipt_ref: receiptRef, receipt_hash: sha256(receipt) },
          ac_trace: {
            schema_version: "ac-change-test-trace.v1",
            snapshot_tree: source.snapshotTree,
            acceptance_ids: ["AC-01"],
            entries: [{
              acceptance_criterion_id: "AC-01",
              coverage_status: "unknown",
              coverage_reason: "provider-facing integration review does not consume host AC ledger",
              change: [{ task_id: null, summary: "当前实现" }],
              test: [],
              evidence: [{ ref: receiptRef, sha256: sha256(receipt) }],
              anchors: [{ id: "implementation", path: "README.md", start_line: 1, end_line: 1, role: "implementation", reason: "当前实现" }],
            }],
            implementation_anchors: [{ id: "implementation", path: "README.md", start_line: 1, end_line: 1, role: "implementation", reason: "当前实现" }],
          },
          review_instructions: reviewInstructionsFor("build-code", null, false, "integration"),
        },
      });
      const approved = JSON.parse(readFileSync(join(bundle.bundleRoot, "requirements/approved_spec.json"), "utf8"));
      const acceptance = JSON.parse(readFileSync(join(bundle.bundleRoot, "requirements/acceptance_criteria.json"), "utf8"));
      expect(approved.excerpts.join("\n")).toContain("目标");
      expect(approved.excerpts.join("\n")).not.toContain("验收");
      expect(approved.excerpts.join("\n")).not.toContain("AC-01");
      expect(acceptance.excerpts.join("\n")).toContain("AC-01");
    } finally {
      source.dispose();
    }
  });
});
