import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { validatePhaseGate } from "../tools/cli/phase-gate.mjs";

let root, outside;
let tree, baseTree, baselineCommit, implementationCommit;
function git(args) { return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim(); }
function write(path, value) { mkdirSync(join(path, ".."), { recursive: true }); writeFileSync(path, JSON.stringify(value)); }
function result(verdict = "pass", snapshot = tree) {
  return { version: "wh-review-result.v1", task_id: "fixture", stage: "build-code", review_track: null,
    source: { target_commit: tree, base_commit: tree, base_tree: tree, captured_head: tree }, snapshot_tree: snapshot,
    subject_kind: "phase", phase_id: "phase-1", base_tree: baseTree, candidate_tree: tree,
    material_id: "a".repeat(64), attempt_ref: "reviews/attempts/a/attempt.json", provider_results: [{ provider: "kimi" }], verdict, findings: [] };
}
function fixture(verdict = "pass") {
  mkdirSync(join(root, "evidence"), { recursive: true });
  write(join(root, "evidence/RED.json"), { exit_code: 1 });
  write(join(root, "evidence/GREEN.json"), { exit_code: 0 });
  write(join(root, "evidence/diff.json"), { schema_version: "phase-diff-scan.v1", phase_id: "phase-1",
    baseline_commit: baselineCommit, implementation_commit: implementationCommit,
    snapshot_tree: tree, safe: true, violations: [], c2_violations: [], allowlist_violations: [] });
  write(join(root, "reviews/results/build-code.json"), result(verdict));
  return { phase_id: "phase-1", status: "done", needs_human: false,
    tests: { red: { path: "evidence/RED.json" }, green: { path: "evidence/GREEN.json" } },
    diff_scan: { path: "evidence/diff.json" }, review: { result_ref: "reviews/results/build-code.json", snapshot_tree: tree } };
}
function unavailableFixture() {
  const item = fixture();
  const ref = "reviews/attempts/build-code-unavailable/attempt.json";
  write(join(root, ref), {
    version: "wh-review-attempt.v1", attempt_id: "build-code-unavailable", task_id: "fixture",
    stage: "build-code", review_track: null,
    source: { target_commit: tree, base_commit: baselineCommit, base_tree: baseTree, captured_head: tree },
    snapshot_tree: tree, subject_kind: "phase", phase_id: "phase-1", review_scope: "phase",
    base_tree: baseTree, candidate_tree: tree, material_id: "a".repeat(64),
    provider_attempts: [{ provider: "fixture/provider", status: "failed", output_ref: null }],
    terminal_status: "unavailable", error: { code: "PROVIDER_UNAVAILABLE", message: "down" },
  });
  item.review = { action_ref: ref, snapshot_tree: tree, status: "unavailable", verdict: null, risk_acceptances: [] };
  return item;
}
beforeEach(() => {
  outside = null;
  root = mkdtempSync(join(tmpdir(), "phase-gate-"));
  git(["init", "-q"]); git(["config", "user.name", "Test"]); git(["config", "user.email", "test@example.com"]);
  writeFileSync(join(root, ".gitignore"), "evidence/\nreviews/\n");
  writeFileSync(join(root, "source.txt"), "base\n"); git(["add", ".gitignore", "source.txt"]); git(["commit", "-qm", "base"]);
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
  it("records revise_required as a quality fact without failing the structural phase gate", () => {
    const checked = validatePhaseGate(fixture("revise_required"), root, { reviewDataRoot: root });
    expect(checked.ok, checked.errors.join("; ")).toBe(true);
    expect(checked.warnings.join(" ")).toMatch(/revise_required.*quality fact/i);
  });
  it("rejects a forged risk ref for an actionable serious revise_required finding", () => {
    const item = fixture("revise_required");
    const reviewPath = join(root, item.review.result_ref);
    write(reviewPath, {
      ...result("revise_required"),
      adjudication: {
        version: "wh-review-adjudication.v1",
        clusters: [{
          id: "F-aaaaaaaaaaaa", severity: "major", path: "source.txt", issue: "serious bug",
          root_cause: "broken logic", recommendation: "repair", providers: ["fixture/provider"],
          adapter_count: 1, finding_count: 1, disposition: "actionable", evidence_status: "direct",
          provider_findings: [],
        }],
      },
    });
    item.review.risk_acceptances = [{
      ref: `evidence/risk-acceptances/${"a".repeat(64)}.json`,
      sha256: "a".repeat(64),
    }];
    const checked = validatePhaseGate(item, root, { reviewDataRoot: root });
    expect(checked.ok).toBe(false);
    expect(checked.errors.join(" ")).toMatch(/risk acceptance/i);
  });
  it("records an unavailable provider attempt as a non-pass quality fact without structural failure", () => {
    const checked = validatePhaseGate(unavailableFixture(), root, { reviewDataRoot: root });
    expect(checked.ok, checked.errors.join("; ")).toBe(true);
    expect(checked.warnings.join(" ")).toMatch(/unavailable.*not rewritten to pass/i);
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
  it("rejects Workspace drift after the passing Phase review", () => {
    const item = fixture();
    writeFileSync(join(root, "drift.txt"), "drift\n");
    expect(validatePhaseGate(item, root, { reviewDataRoot: root }).errors.join(" ")).toMatch(/Workspace tree changed/i);
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
    write(join(root, "evidence/diff.json"), { schema_version: "phase-diff-scan.v1", phase_id: "phase-1",
      baseline_commit: baselineCommit, implementation_commit: implementationCommit, snapshot_tree: tree,
      safe: false, violations: ["scope"], c2_violations: [], allowlist_violations: ["x"] });
    expect(validatePhaseGate(outsideScope, root, { reviewDataRoot: root }).ok).toBe(false);
  });
});
