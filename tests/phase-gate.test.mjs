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
    commit_intent: "file_changes",
    commit_records: [],
    ...overrides,
  };

  const phaseResultPath = join(repo, "phase-result.json");
  writeJson(phaseResultPath, phaseResult);
  sh("git add .", repo);
  sh('git commit -m "phase implementation"', repo);
  const phaseCommit = sh("git rev-parse HEAD", repo).trim();
  phaseResult.commit_records = [{ phase_id: "phase-1", commit_sha: phaseCommit }];
  if (overrides.commit_records !== undefined) {
    phaseResult.commit_records = overrides.commit_records;
  }
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

  it("passes a completed phase with RED/GREEN, diff scan, independent review, commit record, and clean worktree", () => {
    const phaseResult = fixture();
    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok, result.errors.join("; ")).toBe(true);
    expect(result.checked).toEqual([
      "phase-status",
      "red-green-evidence",
      "diff-scan",
      "heterogeneous-review",
      "commit-or-no-change",
      "worktree-clean",
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

  it("fails a file-changing phase that has no commit record", () => {
    const phaseResult = fixture({
      commit_intent: "file_changes",
      commit_records: [],
    });
    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/commit/);
  });

  it("fails a fake commit record that does not exist in the worktree", () => {
    const phaseResult = fixture({
      commit_intent: "file_changes",
      commit_records: [{ phase_id: "phase-1", commit_sha: "a".repeat(40) }],
    });
    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/current-phase real 40-hex .*commit record/);
  });

  it("fails a real commit record from a different phase", () => {
    const phaseResult = fixture();
    const realCommit = sh("git rev-parse HEAD", repo).trim();
    phaseResult.commit_records = [{ phase_id: "phase-0", commit_sha: realCommit }];
    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/current-phase real 40-hex .*commit record/);
  });

  it("fails when phase_id is missing", () => {
    const phaseResult = fixture();
    delete phaseResult.phase_id;
    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/phase_id/);
  });

  it("fails when the consumed commit record has no phase_id", () => {
    const phaseResult = fixture();
    const implementationCommit = sh("git rev-parse HEAD", repo).trim();
    phaseResult.commit_records = [{ commit_sha: implementationCommit }];
    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/current-phase real 40-hex .*commit record/);
  });

  it("fails top-level commit_sha without a valid current phase id", () => {
    const phaseResult = fixture();
    phaseResult.commit_sha = sh("git rev-parse HEAD", repo).trim();
    delete phaseResult.commit_records;
    delete phaseResult.commit_phase_id;
    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/current-phase real 40-hex .*commit record/);
  });

  it("fails when the recorded implementation commit only contains tracking artifacts", () => {
    const phaseResult = fixture({}, { skipImplementation: true });
    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/current-phase real 40-hex .*commit record/);
  });

  it("fails when a later tracking commit moves HEAD past the implementation commit", () => {
    const phaseResult = fixture();
    const implementationCommit = sh("git rev-parse HEAD", repo).trim();
    writeJson(join(repo, "phase-result.json"), phaseResult);
    sh("git add phase-result.json", repo);
    sh('git commit -m "tracking commit"', repo);
    phaseResult.commit_records = [{ phase_id: "phase-1", commit_sha: implementationCommit }];

    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/current-phase real 40-hex .*commit record/);
  });

  it("fails when the tracking commit records a different phase", () => {
    const phaseResult = fixture();
    writeJson(join(repo, "phase-result.json"), { ...phaseResult, phase_id: "phase-2" });
    sh("git add phase-result.json", repo);
    sh('git commit -m "different phase tracking commit"', repo);

    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/current-phase real 40-hex .*commit record/);
  });

  it("fails when a file-changing phase records the tracking-only HEAD as the implementation commit", () => {
    const phaseResult = fixture();
    writeJson(join(repo, "phase-result.json"), phaseResult);
    sh("git add phase-result.json", repo);
    sh('git commit -m "tracking commit"', repo);
    const trackingHead = sh("git rev-parse HEAD", repo).trim();
    phaseResult.commit_records = [{ phase_id: "phase-1", commit_sha: trackingHead }];

    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/current-phase real 40-hex .*commit record/);
  });

  it("fails when the worktree is dirty at phase completion", () => {
    const phaseResult = fixture();
    writeFileSync(join(repo, "untracked.txt"), "dirty\n", "utf8");
    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/worktree must be clean/);
  });
});
