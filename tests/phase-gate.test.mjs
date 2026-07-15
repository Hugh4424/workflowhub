import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { validatePhaseGate } from "../scripts/phase-gate.mjs";

let root;
const tree = "b".repeat(40);
function write(path, value) { mkdirSync(join(path, ".."), { recursive: true }); writeFileSync(path, JSON.stringify(value)); }
function result(verdict = "pass", snapshot = tree) {
  return { version: "wh-review-result.v1", task_id: "fixture", stage: "build-code", review_track: null,
    source: { target_commit: tree, base_commit: tree, base_tree: tree, captured_head: tree }, snapshot_tree: snapshot,
    material_id: "a".repeat(64), attempt_ref: "reviews/attempts/a/attempt.json", provider_results: [{ provider: "kimi" }], verdict, findings: [] };
}
function fixture(verdict = "pass") {
  mkdirSync(join(root, "evidence"), { recursive: true });
  write(join(root, "evidence/RED.json"), { exit_code: 1 });
  write(join(root, "evidence/GREEN.json"), { exit_code: 0 });
  write(join(root, "evidence/diff.json"), { safe: true, violations: [], c2_violations: [], allowlist_violations: [] });
  write(join(root, "reviews/results/build-code.json"), result(verdict));
  return { phase_id: "phase-1", status: "done", needs_human: false,
    tests: { red: { path: "evidence/RED.json" }, green: { path: "evidence/GREEN.json" } },
    diff_scan: { path: "evidence/diff.json" }, review: { result_ref: "reviews/results/build-code.json", snapshot_tree: tree } };
}
beforeEach(() => { root = mkdtempSync(join(tmpdir(), "phase-gate-")); });
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("phase-gate formal review result", () => {
  it("accepts a referenced passing result", () => {
    const checked = validatePhaseGate(fixture(), root, { reviewDataRoot: root });
    expect(checked.ok, checked.errors.join("; ")).toBe(true);
    expect(checked.checked).toEqual(["phase-status", "red-green-evidence", "diff-scan", "heterogeneous-review"]);
  });
  it("rejects revise_required", () => {
    const checked = validatePhaseGate(fixture("revise_required"), root, { reviewDataRoot: root });
    expect(checked.ok).toBe(false);
    expect(checked.errors.join(" ")).toMatch(/must be pass/);
  });
  it("rejects a copied verdict and a mismatched snapshot", () => {
    expect(validatePhaseGate({ ...fixture(), review: { verdict: "pass" } }, root, { reviewDataRoot: root }).ok).toBe(false);
    const item = fixture(); item.review.snapshot_tree = "c".repeat(40);
    expect(validatePhaseGate(item, root, { reviewDataRoot: root }).errors.join(" ")).toMatch(/does not match/);
  });
  it("rejects missing material evidence", () => {
    const item = fixture(); item.tests.red.path = "evidence/missing.json";
    expect(validatePhaseGate(item, root, { reviewDataRoot: root }).ok).toBe(false);
  });
  it("requires an explicit review data root", () => {
    expect(validatePhaseGate(fixture(), root).errors.join(" ")).toMatch(/review data root missing/);
  });
});
