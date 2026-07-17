import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createTask, createTaskKernel } from "../core/task-handle.mjs";
import { hashCanonical } from "../core/task-snapshot.mjs";
import { capturePhaseReviewSource } from "../skills/wh-review/scripts/review-source.mjs";
import { parsePhaseReviewArgv } from "../skills/wh-review/scripts/wh-review.mjs";

const roots = []; const git = (cwd, args) => String(execFileSync("git", args, { cwd, encoding: "utf8" })).trim();
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });
function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "review-tree-"))); roots.push(root); const repo = join(root, "repo"); mkdirSync(repo);
  git(repo, ["init", "-q"]); git(repo, ["config", "user.email", "t@example.test"]); git(repo, ["config", "user.name", "T"]);
  writeFileSync(join(repo, "a"), "base\n"); git(repo, ["add", "."]); git(repo, ["commit", "-qm", "base"]); const baseTree = git(repo, ["rev-parse", "HEAD^{tree}"]);
  writeFileSync(join(repo, "a"), "next\n"); git(repo, ["add", "."]); const nextTree = git(repo, ["write-tree"]);
  const task = createTask({ storageRoot: root, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "review-tree", created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} } }); const kernel = createTaskKernel(task);
  const snap = (id, tree) => ({ ref: `evidence/snapshots/${id}.json`, hash: "a".repeat(64), tree_oid: tree });
  const releaseValue = { schema_version: "release-pin.v1", task_id: task.identity.taskId, build_plan: { accepted_ref: "results/build-plan/accepted.json", accepted_raw_hash: "a".repeat(64), attempt_ref: "results/build-plan/attempt-0001.json", attempt_raw_hash: "b".repeat(64) }, checkpoint: { ref: "refs/workflowhub/checkpoints/Demo/review-tree/build-plan/plan-x", commit_oid: "c".repeat(40), tree_oid: "d".repeat(40) } }; const release = { ref: "evidence/releases/pin.json", hash: hashCanonical(releaseValue) };
  const subject = { schema_version: "1.0.0", phase_id: "phase-0", task_id: task.identity.taskId, release, baseline: snap("base", baseTree), implementation: snap("next", nextTree), allowed_files: ["a"], upstream: null };
  const patch = String(execFileSync("git", ["diff", "--binary", "--full-index", "--no-ext-diff", "--no-renames", baseTree, nextTree], { cwd: repo, encoding: "utf8" })).replace(/\r\n/g, "\n");
  const scan = { schema_version: "1.0.0", phase_id: "phase-0", task_id: task.identity.taskId, subject: { ref: "evidence/phases/phase-0/subject.json", hash: hashCanonical(subject) }, baseline_tree: baseTree, implementation_tree: nextTree, changed_files: ["a"], allowed: true, patch, patch_hash: createHash("sha256").update(patch).digest("hex") };
  kernel.publishCanonicalRecord(release.ref, `${JSON.stringify(releaseValue)}\n`); kernel.publishCanonicalRecord("evidence/phases/phase-0/subject.json", `${JSON.stringify(subject)}\n`); kernel.publishCanonicalRecord("evidence/phases/phase-0/diff.json", `${JSON.stringify(scan)}\n`);
  return { repo, task, scan };
}
describe("wh-review canonical tree subject", () => {
  it("exposes an explicit phase-only argv contract without JSON or task paths", () => {
    expect(parsePhaseReviewArgv(["--project=Demo", "--task=t", "--phase-id=phase-0"])).toEqual({ project_name: "Demo", task_id: "t", stage: "build-code", phase_id: "phase-0" });
    for (const forbidden of ["--task-path=/tmp/t", "--input=x.json", "--diff=x", "--phaseId=phase-0"]) expect(() => parsePhaseReviewArgv(["--project=Demo", "--task=t", "--phase-id=phase-0", forbidden])).toThrow(/rejects/);
  });
  it("resolves only phase id and binds canonical subject/diff hashes", () => {
    const f = fixture(); const source = capturePhaseReviewSource({ sourceRoot: f.repo, task: f.task, phaseId: "phase-0" });
    expect(source.diff).toContain("next"); expect(source.phaseEvidence.subjectHash).toBe(f.scan.subject.hash); expect(source.phaseEvidence.diffHash).toBe(hashCanonical(f.scan));
  });
  it("rejects a caller-selected phase without canonical evidence", () => {
    const f = fixture();
    expect(() => capturePhaseReviewSource({ sourceRoot: f.repo, task: f.task, phaseId: "other" })).toThrow(/PHASE_EVIDENCE_INVALID/);
  });
});
