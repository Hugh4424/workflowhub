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
  return { task, workspace: openCurrentTaskWorkspace(task) };
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
    expect(phaseDiffDeliveryForPath("core/__tests__/stage-skill-runtime.test.mjs")).toBe("included");
    expect(phaseDiffDeliveryForPath("skills/catalog.yaml")).toBe("summary");
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
});
