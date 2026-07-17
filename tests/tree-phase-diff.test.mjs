import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createTask, createTaskKernel } from "../core/task-handle.mjs";
import { openAcceptedWorkspace } from "../core/workspace.mjs";
import { createBaselineTaskSnapshot, createTaskSnapshot, canonicalJson, hashCanonical } from "../core/task-snapshot.mjs";
import { createPhaseSubject } from "../core/phase-subject.mjs";
import { scanPhaseTreeDiff } from "../core/tree-diff-scanner.mjs";
import { publishPhaseDiff, publishPhaseResult, publishPhaseSubject } from "../core/phase-evidence-publisher.mjs";
import { assertPhaseEligible } from "../core/phase-lineage.mjs";

const roots = []; const git = (cwd, args) => String(execFileSync("git", args, { cwd, encoding: "utf8" })).trim();
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });
function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "phase-tree-"))); roots.push(root); const repo = join(root, "repo"); mkdirSync(repo);
  git(repo, ["init", "-q"]); git(repo, ["config", "user.email", "t@example.test"]); git(repo, ["config", "user.name", "T"]);
  writeFileSync(join(repo, "a.txt"), "base\n"); git(repo, ["add", "."]); git(repo, ["commit", "-qm", "base"]); const head = git(repo, ["rev-parse", "HEAD"]);
  const taskId = "tree-task"; const worktree = `${repo}-${taskId}`; git(repo, ["worktree", "add", "-qb", `task/Demo/${taskId}`, worktree, head]);
  const task = createTask({ storageRoot: root, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: taskId, created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} } });
  const workspace = openAcceptedWorkspace(task, { facts: { worktree_root: worktree, baseline_commit: head } }); const kernel = createTaskKernel(task, { workspace });
  return { task, workspace, kernel, worktree };
}
describe("tree-only phase evidence", () => {
  it("creates deterministic tree diff and create-only evidence without commits", () => {
    const { task, workspace, kernel, worktree } = fixture(); const refsBefore = git(worktree, ["for-each-ref", "--format=%(refname) %(objectname)"]);
    expect(() => createBaselineTaskSnapshot(workspace, { task_id: task.identity.taskId, snapshot_id: "baseline" }, "caller-tree")).toThrow(/accepts only/);
    const baseline = createBaselineTaskSnapshot(workspace, { task_id: task.identity.taskId, snapshot_id: "baseline" }); kernel.publishCanonicalRecord(baseline.ref, `${JSON.stringify(baseline.value, null, 2)}\n`);
    expect(() => kernel.publishCanonicalRecord(baseline.ref, `${JSON.stringify(baseline.value, null, 2)}\n`)).toThrow(/exist|create-only/i);
    writeFileSync(join(worktree, "a.txt"), "changed\n"); const implementation = createTaskSnapshot(workspace, { task_id: task.identity.taskId, snapshot_id: "implementation" }); kernel.publishCanonicalRecord(implementation.ref, `${JSON.stringify(implementation.value, null, 2)}\n`);
    const descriptor = ({ ref, hash, value }) => ({ ref, hash, tree_oid: value.tree_oid });
    const releaseValue = { schema_version: "release-pin.v1", task_id: task.identity.taskId, build_plan: { accepted_ref: "results/build-plan/accepted.json", accepted_raw_hash: "a".repeat(64), attempt_ref: "results/build-plan/attempt-0001.json", attempt_raw_hash: "b".repeat(64) }, checkpoint: { ref: "refs/workflowhub/checkpoints/Demo/tree-task/build-plan/plan-x", commit_oid: "c".repeat(40), tree_oid: "d".repeat(40) } }; const release = { ref: "evidence/releases/pin.json", hash: hashCanonical(releaseValue) }; kernel.publishCanonicalRecord(release.ref, `${JSON.stringify(releaseValue)}\n`);
    const subject = createPhaseSubject(workspace, task, { phase_id: "phase-0", release, baseline: descriptor(baseline), implementation: descriptor(implementation), allowed_files: ["a.txt"], upstream: null });
    expect(publishPhaseSubject(kernel, subject.value).created).toBe(true); expect(publishPhaseSubject(kernel, subject.value).created).toBe(false);
    const scan = scanPhaseTreeDiff(workspace, subject); expect(scan.value.changed_files).toEqual(["a.txt"]); expect(scan.value.patch).toContain("changed"); expect(scan.value.allowed).toBe(true);
    expect(publishPhaseDiff(kernel, scan.value).created).toBe(true); expect(canonicalJson(scan.value)).toBe(canonicalJson(scanPhaseTreeDiff(workspace, subject).value));
    const phaseEvidence = { subject_ref: subject.ref, subject_hash: subject.hash, diff_ref: scan.ref, diff_hash: scan.hash }; const semantic = { verdict: "pass", summary: "fixture review passed", findings: [] };
    const providerContent = JSON.stringify(semantic); const providerOutputRef = "reviews/attempts/phase0/providers/opencode.output.json";
    const providerOutput = { schema_version: "wh-review-provider-output.v1", task_id: task.identity.taskId, stage: "build-code", attempt_id: "phase0", provider: "opencode", content: providerContent, content_hash: createHash("sha256").update(providerContent).digest("hex") }; kernel.publishCanonicalRecord(providerOutputRef, `${JSON.stringify(providerOutput)}\n`);
    const reviewAttemptRef = "reviews/attempts/phase0/attempt.json"; const reviewAttempt = { version: "wh-review-attempt.v1", attempt_id: "phase0", task_id: task.identity.taskId, stage: "build-code", review_track: null, subject_kind: "phase", phase_id: "phase-0", base_tree: subject.value.baseline.tree_oid, candidate_tree: subject.value.implementation.tree_oid, phase_evidence: phaseEvidence, source: { baseline_tree: subject.value.baseline.tree_oid, implementation_tree: subject.value.implementation.tree_oid }, snapshot_tree: subject.value.implementation.tree_oid, material_id: "e".repeat(64), provider_attempts: [{ provider: "opencode", status: "completed", session_id: "s", runtime_id: "r", output_ref: providerOutputRef, error: null }], terminal_status: "semantic", error: null }; kernel.publishCanonicalRecord(reviewAttemptRef, `${JSON.stringify(reviewAttempt)}\n`);
    const review = { version: "wh-review-result.v1", task_id: task.identity.taskId, stage: "build-code", review_track: null, subject_kind: "phase", phase_id: "phase-0", base_tree: subject.value.baseline.tree_oid, candidate_tree: subject.value.implementation.tree_oid,
      phase_evidence: phaseEvidence, source: { baseline_tree: subject.value.baseline.tree_oid, implementation_tree: subject.value.implementation.tree_oid }, snapshot_tree: subject.value.implementation.tree_oid, material_id: "e".repeat(64), attempt_ref: reviewAttemptRef, provider_results: [{ provider: "opencode", output: semantic }], verdict: "pass", findings: [] };
    const reviewRaw = `${JSON.stringify(review)}\n`; kernel.publishCanonicalRecord("reviews/results/phase-0.json", reviewRaw);
    const result = { schema_version: "1.0.0", phase_id: "phase-0", task_id: task.identity.taskId,
      subject: { ref: subject.ref, hash: subject.hash }, diff: { ref: scan.ref, hash: scan.hash },
      review: { ref: "reviews/results/phase-0.json", hash: createHash("sha256").update(reviewRaw).digest("hex"), verdict: "pass" }, tests: [],
      eligibility: { next_phase: "p0-a", structurally_complete: true } };
    const publishedResult = publishPhaseResult(kernel, result); expect(assertPhaseEligible(kernel, "p0-a")).toBe(true);
    const p0a = createPhaseSubject(workspace, task, { phase_id: "p0-a", release: subject.value.release,
      baseline: subject.value.implementation, implementation: subject.value.implementation, allowed_files: [],
      upstream: { subject_ref: subject.ref, subject_hash: subject.hash, result_ref: publishedResult.ref, result_hash: publishedResult.hash, implementation: subject.value.implementation } });
    expect(publishPhaseSubject(kernel, p0a.value).created).toBe(true);
    expect(() => publishPhaseSubject(kernel, { ...p0a.value, phase_id: "p0-b" })).toThrow(/skip|fork|missing|ENOENT/i);
    expect(git(worktree, ["for-each-ref", "--format=%(refname) %(objectname)"])).toBe(refsBefore);
    expect(() => publishPhaseSubject(kernel, { ...subject.value, allowed_files: [] })).toThrow(/immutable.*conflict/i);
  });
});
