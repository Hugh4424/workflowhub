import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { validatePhaseGate } from "../scripts/phase-gate.mjs";
import { hashCanonical } from "../core/task-snapshot.mjs";

let root, outside;
let tree, baseTree, baselineCommit, implementationCommit;
function git(args) { return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim(); }
function write(path, value) { mkdirSync(join(path, ".."), { recursive: true }); writeFileSync(path, JSON.stringify(value)); }
let subject, scan;
function result(verdict = "pass", snapshot = tree) {
  return { version: "wh-review-result.v1", task_id: "fixture", stage: "build-code", review_track: null,
    source: { target_commit: tree, base_commit: tree, base_tree: tree, captured_head: tree }, snapshot_tree: snapshot,
    subject_kind: "phase", phase_id: "phase-1", base_tree: baseTree, candidate_tree: tree,
    phase_evidence: { subject_ref: "evidence/phases/phase-1/subject.json", subject_hash: hashCanonical(subject), diff_ref: "evidence/phases/phase-1/diff.json", diff_hash: hashCanonical(scan) },
    material_id: "a".repeat(64), attempt_ref: "reviews/attempts/a/attempt.json", provider_results: [{ provider: "kimi" }], verdict, findings: [] };
}
function fixture(verdict = "pass") {
  mkdirSync(join(root, "evidence"), { recursive: true });
  write(join(root, "evidence/RED.json"), { exit_code: 1 });
  write(join(root, "evidence/GREEN.json"), { exit_code: 0 });
  subject = { schema_version: "1.0.0", phase_id: "phase-1", task_id: "fixture", release: { ref: "releases/r.json", hash: "a".repeat(64) }, baseline: { ref: "evidence/snapshots/base.json", hash: "b".repeat(64), tree_oid: baseTree }, implementation: { ref: "evidence/snapshots/implementation.json", hash: "c".repeat(64), tree_oid: tree }, allowed_files: ["source.txt"], upstream: null };
  const patch = execFileSync("git", ["diff", "--binary", "--full-index", "--no-ext-diff", "--no-renames", baseTree, tree], { cwd: root, encoding: "utf8" }).replace(/\r\n/g, "\n");
  scan = { schema_version: "1.0.0", phase_id: "phase-1", task_id: "fixture", subject: { ref: "evidence/phases/phase-1/subject.json", hash: hashCanonical(subject) }, baseline_tree: baseTree, implementation_tree: tree, changed_files: ["source.txt"], allowed: true, patch, patch_hash: createHash("sha256").update(patch).digest("hex") };
  write(join(root, "evidence/phases/phase-1/subject.json"), subject); write(join(root, "evidence/phases/phase-1/diff.json"), scan);
  write(join(root, "reviews/results/build-code.json"), result(verdict));
  return { phase_id: "phase-1", status: "done", needs_human: false,
    tests: { red: { path: "evidence/RED.json" }, green: { path: "evidence/GREEN.json" } },
    diff_scan: { path: "evidence/phases/phase-1/diff.json" }, review: { result_ref: "reviews/results/build-code.json", snapshot_tree: tree } };
}
beforeEach(() => {
  outside = null;
  root = mkdtempSync(join(tmpdir(), "phase-gate-"));
  git(["init", "-q"]); git(["config", "user.name", "Test"]); git(["config", "user.email", "test@example.com"]);
  writeFileSync(join(root, "source.txt"), "base\n"); git(["add", "source.txt"]); git(["commit", "-qm", "base"]);
  baselineCommit = git(["rev-parse", "HEAD"]); baseTree = git(["rev-parse", "HEAD^{tree}"]);
  writeFileSync(join(root, "source.txt"), "candidate\n"); git(["commit", "-qam", "candidate"]);
  implementationCommit = git(["rev-parse", "HEAD"]); tree = git(["rev-parse", "HEAD^{tree}"]);
});
afterEach(() => { rmSync(root, { recursive: true, force: true }); if (outside) rmSync(outside, { force: true }); });

describe("phase-gate formal review result", () => {
  it("accepts a referenced passing result", () => {
    const checked = validatePhaseGate(fixture(), root, { reviewDataRoot: root });
    expect(checked.ok, checked.errors.join("; ")).toBe(true);
    expect(checked.checked).toEqual(["phase-status", "red-green-evidence", "diff-scan", "heterogeneous-review"]);
  });
  it("records revise_required without blocking the phase", () => {
    const checked = validatePhaseGate(fixture("revise_required"), root, { reviewDataRoot: root });
    expect(checked.ok).toBe(true);
    expect(checked.warnings.join(" ")).toMatch(/revise_required/);
  });
  it("rejects a copied verdict and a mismatched snapshot", () => {
    expect(validatePhaseGate({ ...fixture(), review: { verdict: "pass" } }, root, { reviewDataRoot: root }).ok).toBe(false);
    const item = fixture(); item.review.snapshot_tree = "c".repeat(40);
    expect(validatePhaseGate(item, root, { reviewDataRoot: root }).errors.join(" ")).toMatch(/does not match/);
  });
  it("rejects a passing review for another phase", () => {
    const item = fixture();
    const reviewPath = join(root, item.review.result_ref);
    write(reviewPath, { ...result(), phase_id: "phase-2" });
    expect(validatePhaseGate(item, root, { reviewDataRoot: root }).errors.join(" ")).toMatch(/phase.*mismatch/i);
  });
  it("rejects a passing review for another phase tree pair", () => {
    const item = fixture();
    const reviewPath = join(root, item.review.result_ref);
    write(reviewPath, { ...result(), base_tree: "c".repeat(40) });
    expect(validatePhaseGate(item, root, { reviewDataRoot: root }).errors.join(" ")).toMatch(/tree.*mismatch/i);

    write(reviewPath, { ...result(), candidate_tree: "d".repeat(40) });
    expect(validatePhaseGate(item, root, { reviewDataRoot: root }).errors.join(" ")).toMatch(/tree.*mismatch/i);
  });
  it("rejects a legacy whole-workspace result for a phase", () => {
    const item = fixture();
    const legacy = result();
    delete legacy.subject_kind; delete legacy.phase_id; delete legacy.base_tree; delete legacy.candidate_tree;
    write(join(root, item.review.result_ref), legacy);
    expect(validatePhaseGate(item, root, { reviewDataRoot: root }).errors.join(" ")).toMatch(/phase.*identity/i);
  });
  it("records missing quality evidence without blocking", () => {
    const item = fixture(); item.tests.red.path = "evidence/missing.json";
    const checked = validatePhaseGate(item, root, { reviewDataRoot: root });
    expect(checked.ok).toBe(true);
    expect(checked.warnings.join(" ")).toMatch(/RED artifact not found/);
  });
  it("rejects an absolute phase diff evidence ref", () => {
    const item = fixture(); item.diff_scan.path = join(root, "evidence/diff.json");
    expect(validatePhaseGate(item, root, { reviewDataRoot: root }).errors.join(" ")).toMatch(/diff scan.*task-relative/i);
  });
  it("rejects a phase diff evidence ref escaping the task root", () => {
    const item = fixture(); item.diff_scan.path = "../diff.json";
    expect(validatePhaseGate(item, root, { reviewDataRoot: root }).errors.join(" ")).toMatch(/diff scan.*task-relative/i);
  });
  it("rejects a phase diff evidence symlink escaping the task root", () => {
    const item = fixture(); outside = `${root}-outside.json`;
    writeFileSync(outside, JSON.stringify({})); symlinkSync(outside, join(root, "evidence/linked.json"));
    item.diff_scan.path = "evidence/linked.json";
    expect(validatePhaseGate(item, root, { reviewDataRoot: root }).errors.join(" ")).toMatch(/diff scan.*inside the task root/i);
  });
  it("blocks when independent review capability is unavailable", () => {
    const checked = validatePhaseGate(fixture(), root);
    expect(checked.ok).toBe(false);
    expect(checked.errors.join(" ")).toMatch(/review data root missing/);
  });
  it("still blocks on an unfinished phase or an out-of-scope diff", () => {
    const unfinished = fixture(); unfinished.status = "blocked"; unfinished.needs_human = true;
    expect(validatePhaseGate(unfinished, root, { reviewDataRoot: root }).ok).toBe(false);
    const outsideScope = fixture();
    write(join(root, "evidence/phases/phase-1/diff.json"), { ...scan, allowed: false });
    expect(validatePhaseGate(outsideScope, root, { reviewDataRoot: root }).ok).toBe(false);
  });
});
