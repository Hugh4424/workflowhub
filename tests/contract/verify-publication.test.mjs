import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { initializeTaskStore, readTaskIndex } from "../../runtime/task/task-store.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { publishVerifySummary } from "../../runtime/evidence/quality-store.mjs";

function taskRoot(project = "workflowhub", recordModel = "vnext-single-write") {
  const storage = realpathSync(mkdtempSync(join(tmpdir(), "verify-publication-")));
  const repo = realpathSync(mkdtempSync(join(tmpdir(), "verify-publication-repo-")));
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Verify publication tests"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "verify-publication@workflowhub.local"], { cwd: repo });
  writeFileSync(join(repo, "README.md"), "verify publication fixture\n");
  execFileSync("git", ["add", "."], { cwd: repo });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: repo });
  const task = createTask({ storageRoot: storage, manifest: {
    schema_version: "1.0.0", project_name: project, task_id: "verify-publication", created_at: new Date().toISOString(),
    target_repo_root: repo, issue_ids: [], inputs: {}, record_model: recordModel,
  } });
  initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
  return { task, storage, repo };
}

describe("verify summary canonical writer boundary", () => {
  it("rejects a second writer at the canonical WorkflowHub task root", () => {
    const { task, storage, repo } = taskRoot();
    try {
      expect(() => publishVerifySummary(task.taskPath, { status: "incomplete" }))
        .toThrow(/stage-runtime\/TaskKernel canonical writer/);
    } finally { rmSync(storage, { recursive: true, force: true }); rmSync(repo, { recursive: true, force: true }); }
  });

  it("allows the compatibility writer outside the canonical WorkflowHub root", () => {
    const { task, storage, repo } = taskRoot("fixture-project", "vnext-single-write");
    try {
      const result = publishVerifySummary(task.taskPath, { status: "incomplete", missing: ["review"] });
      expect(result.ref).toBe("quality/verify.json");
      expect(result.value.task_id).toBe(task.identity.taskId);
    } finally { rmSync(storage, { recursive: true, force: true }); rmSync(repo, { recursive: true, force: true }); }
  });

  it("publishes the canonical current verify summary through the TaskKernel only", () => {
    const { task, storage, repo } = taskRoot();
    try {
      const workspace = prepareTaskWorkspace(task);
      const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
      artifacts.writeAtomic("decision-log.md", "# Decision\n");
      artifacts.writeAtomic("spec.md", "# Spec\n\n## Acceptance Criteria\n\n- [ ] **AC-1**: current verification is published. ← FR-1\n");
      artifacts.writeAtomic("plan.md", "# Plan\n");
      artifacts.writeAtomic("tasks.md", "# Tasks\n");
      const kernel = createTaskKernel(task, { candidateWorkspace: workspace, artifacts, now: () => "2026-09-10T01:00:00.000Z" });
      const leafRaw = "acceptance leaf\n";
      const nestedRaw = "nested proof\n";
      const leaf = kernel.publishCanonicalRecord(`quality/evidence/${createHash("sha256").update(leafRaw).digest("hex")}.json`, leafRaw);
      const nested = kernel.publishCanonicalRecord(`quality/evidence/${createHash("sha256").update(nestedRaw).digest("hex")}.json`, nestedRaw);
      const sourceDigest = kernel.currentVNextSnapshot({ fresh: true }).source_digest;
      const criteria = [{
        acceptance_criterion_id: "AC-1", result: "pass", source_digest: sourceDigest,
        acceptance_leaf: { ref: leaf.ref, sha256: leaf.sha256 }, nested_evidence: [{ ref: nested.ref, sha256: nested.sha256 }],
        scenario: "publish current result", oracle: "canonical readback matches", actual_outcome: "readback matched",
        evidence_type: "structured_observation", coverage_limits: ["external provider unavailable"], exceptions: ["none"],
        implementation_anchor: { id: "impl-ac-1", path: "runtime/task/task-kernel-implementation.mjs", start_line: 1, end_line: 1, role: "implementation" },
        verification_anchor: { id: "test-ac-1", path: "tests/contract/verify-publication.test.mjs", start_line: 1, end_line: 1, role: "verification" },
      }];
      const published = kernel.publishVerifySummary({ status: "passed", criteria });
      expect(published).toMatchObject({ ref: "quality/verify.json", status: "published", value: {
        task_id: task.identity.taskId, stage: "verify-code", status: "passed", source_digest: sourceDigest,
      } });
      expect(JSON.parse(task.readRecord(published.ref))).toEqual(published.value);
      expect(readTaskIndex(task.taskPath).quality.verify.sha256).toBe(published.sha256);
      expect(kernel.publishVerifySummary({ status: "passed", criteria }).status).toBe("idempotent");
      expect(() => task.writeRecordAtomic("quality/verify.json", "{}\n")).toThrow(/kernel-owned/);
      expect(() => kernel.publishVerifySummary({ status: "incomplete", criteria })).toThrow(/status does not match/);
    } finally { rmSync(storage, { recursive: true, force: true }); rmSync(repo, { recursive: true, force: true }); }
  });
});
