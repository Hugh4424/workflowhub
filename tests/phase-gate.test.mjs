import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { validatePhaseGate } from "../scripts/phase-gate.mjs";

let root;
let repo;

function sh(cmd, cwd = repo) {
  return execSync(cmd, { cwd, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
}

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2), "utf8");
}

function initRepo() {
  repo = join(root, "repo");
  mkdirSync(repo, { recursive: true });
  sh("git init", repo);
  sh('git config user.email "phase-gate@example.invalid"', repo);
  sh('git config user.name "Phase Gate Test"', repo);
  writeFileSync(join(repo, "README.md"), "# fixture\n", "utf8");
  sh("git add README.md", repo);
  sh('git commit -m "init"', repo);
}

function fixture(overrides = {}, artifactOverrides = {}) {
  const evidenceDir = join(repo, "evidence");
  mkdirSync(evidenceDir, { recursive: true });

  if (!artifactOverrides.skipImplementation) {
    mkdirSync(join(repo, "src"), { recursive: true });
    writeFileSync(join(repo, "src", "implementation.txt"), "phase work\n", "utf8");
  }
  const redPath = join(evidenceDir, "RED.json");
  const greenPath = join(evidenceDir, "GREEN.json");
  const diffPath = join(evidenceDir, "diff.json");

  writeJson(redPath, { exit_code: artifactOverrides.redExitCode ?? 1 });
  writeJson(greenPath, { exit_code: 0 });
  writeJson(diffPath, { safe: true, violations: [], c2_violations: [], allowlist_violations: [] });
  const coreBytes = Buffer.from(`${JSON.stringify({ semantic_verdict: "pass", needs_human: false }, null, 2)}\n`);
  const coreHash = createHash("sha256").update(coreBytes).digest("hex");
  const corePath = join(repo, "reviews", "core-receipts", `${coreHash}.json`);
  mkdirSync(join(corePath, ".."), { recursive: true });
  writeFileSync(corePath, coreBytes);
  const phaseResult = {
    task_id: "fixture",
    phase_id: "phase-1",
    status: "done",
    needs_human: false,
    tests: {
      red: { path: redPath, exit_code: 1 },
      green: { path: greenPath, exit_code: 0 },
    },
    diff_scan: { path: diffPath, violations: [] },
    review: { core_receipt_hash: coreHash, semantic_verdict: "pass", needs_human: false },
    ...overrides,
  };

  const phaseResultPath = join(repo, "phase-result.json");
  writeJson(phaseResultPath, phaseResult);
  if (artifactOverrides.leaveDirty) return phaseResult;
  sh("git add .", repo);
  sh('git commit -m "phase implementation"', repo);
  return phaseResult;
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "phase-gate-test-"));
  initRepo();
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("phase-gate", () => {
  it("binds the review tuple to the hash-addressed public core receipt", () => {
    const phaseResult = fixture();
    const core = join(repo, "reviews", "core-receipts", `${phaseResult.review.core_receipt_hash}.json`);
    mkdirSync(join(core, ".."), { recursive: true });
    writeJson(core, { semantic_verdict: "revise_required", needs_human: false });
    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/core receipt.*hash|core receipt.*semantic/i);
  });

  it("consumes the published review decision tuple without opening raw review artifacts", () => {
    const phaseResult = fixture();
    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok, result.errors.join("; ")).toBe(true);
  });

  it("blocks an otherwise valid old pass while a public projection guard remains", () => {
    const phaseResult = fixture();
    writeJson(join(repo, "reviews", "projection-pending-build-code-flow.json"), {
      version: 1, status: "pending", task_id: "fixture", stage: "build-code", review_track: null, review_flow_id: "flow", needs_human: true,
    });
    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/PROJECTION_PENDING/);
  });

  it("accepts dirty tracked and untracked implementation with a published passing core", () => {
    const phaseResult = fixture({}, { leaveDirty: true });
    writeFileSync(join(repo, "src", "implementation.txt"), "phase work updated\n", "utf8");
    writeFileSync(join(repo, "untracked.txt"), "unreviewed commit boundary is not required\n", "utf8");
    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok, result.errors.join("; ")).toBe(true);
    expect(result.checked).toEqual([
      "phase-status",
      "red-green-evidence",
      "diff-scan",
      "projection-recovery",
      "heterogeneous-review",
    ]);
  });

  it("passes a completed phase with RED/GREEN, diff scan, and independent review", () => {
    const phaseResult = fixture();
    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok, result.errors.join("; ")).toBe(true);
    expect(result.checked).toEqual([
      "phase-status",
      "red-green-evidence",
      "diff-scan",
      "projection-recovery",
      "heterogeneous-review",
    ]);
  });

  it("passes when RED evidence has a non-one failing exit code", () => {
    const phaseResult = fixture({}, { redExitCode: 7 });
    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok, result.errors.join("; ")).toBe(true);
  });

  it("fails an empty inline diff scan object", () => {
    const phaseResult = fixture({ diff_scan: {} });
    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/diff scan safe must be true/);
    expect(result.errors.join("\n")).toMatch(/violations must be an array/);
  });

  it("fails partial diff scan shapes", () => {
    const phaseResult = fixture({ diff_scan: { safe: true, violations: [] } });
    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/c2_violations must be an array/);
    expect(result.errors.join("\n")).toMatch(/allowlist_violations must be an array/);
  });

  it("rejects non-passing, human-gated, and raw-artifact review data", () => {
    for (const review of [
      { core_receipt_hash: "a".repeat(64), semantic_verdict: "revise_required", needs_human: false },
      { core_receipt_hash: "a".repeat(64), semantic_verdict: "pass", needs_human: true },
      { artifact_path: "reviews/private/raw.json", verdict: "pass" },
    ]) {
      const result = validatePhaseGate(fixture({ review }), repo);
      expect(result.ok).toBe(false);
      expect(result.errors.join("\n")).toMatch(/published pass|core_receipt_hash/);
    }
  });

  it("fails when phase_id is missing", () => {
    const phaseResult = fixture();
    delete phaseResult.phase_id;
    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/phase_id/);
  });

});
