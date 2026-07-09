import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execSync } from "node:child_process";
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
  const reviewDir = join(repo, "reviews");
  mkdirSync(evidenceDir, { recursive: true });
  mkdirSync(reviewDir, { recursive: true });

  if (!artifactOverrides.skipImplementation) {
    mkdirSync(join(repo, "src"), { recursive: true });
    writeFileSync(join(repo, "src", "implementation.txt"), "phase work\n", "utf8");
  }
  const redPath = join(evidenceDir, "RED.json");
  const greenPath = join(evidenceDir, "GREEN.json");
  const diffPath = join(evidenceDir, "diff.json");
  const reviewPath = join(reviewDir, "review.json");
  const reviewPaths = [reviewPath];

  writeJson(redPath, { exit_code: artifactOverrides.redExitCode ?? 1 });
  writeJson(greenPath, { exit_code: 0 });
  writeJson(diffPath, { safe: true, violations: [], c2_violations: [], allowlist_violations: [] });
  if (typeof artifactOverrides.reviewRaw === "string") {
    writeFileSync(reviewPath, artifactOverrides.reviewRaw, "utf8");
  } else {
    writeJson(reviewPath, {
      verdict: "pass",
      source: "third_party",
      actual_mode: "full",
      trueCrossEngine: true,
      ...(artifactOverrides.review ?? {}),
    });
  }
  for (const [index, extraReview] of (artifactOverrides.extraReviews ?? []).entries()) {
    const extraPath = join(reviewDir, `review-${index + 2}.json`);
    writeJson(extraPath, extraReview);
    reviewPaths.push(extraPath);
  }

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
    review: {
      source: "third_party",
      verdict: "pass",
      artifact_paths: reviewPaths,
    },
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

  it("fails same_source/pass review because it is not independent evidence", () => {
    const phaseResult = fixture({
      review: { source: "same_source", verdict: "pass", artifact_paths: [] },
    });
    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/review.*artifact/i);
  });

  it("fails same_source/pass even when the review mode was full", () => {
    const phaseResult = fixture({
      review: { source: "same_source", verdict: "pass", actual_mode: "full", artifact_paths: [] },
    });
    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/review.*artifact/i);
  });

  it("fails inline third_party/pass when no review artifact exists", () => {
    const phaseResult = fixture({
      review: { source: "third_party", verdict: "pass", artifact_paths: [] },
    });
    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/review.*artifact/i);
  });

  it("fails same_source artifact even when the review mode was full", () => {
    const phaseResult = fixture({}, {
      review: { source: "same_source", actual_mode: "full", trueCrossEngine: false },
    });
    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/same_source|third_party|heterogeneous/);
  });

  it("fails contradictory artifacts instead of combining same_source pass with independent failure", () => {
    const phaseResult = fixture(
      {},
      {
        review: { source: "same_source", verdict: "pass", actual_mode: "full", trueCrossEngine: false },
        extraReviews: [{ source: "third_party", verdict: "revise_required", actual_mode: "full" }],
      }
    );
    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/all readable review artifact verdicts must be "pass"/);
    expect(result.errors.join("\n")).toMatch(/at least one passing review artifact/);
  });

  it("fails Markdown-only review artifacts because phase-gate requires machine-readable JSON", () => {
    const phaseResult = fixture({}, { reviewRaw: "# Review\n\nverdict: pass\n" });
    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/not valid JSON|readable artifact/);
  });

  it("fails when the review artifact is missing", () => {
    const missingPath = join(repo, "reviews", "missing.json");
    const phaseResult = fixture({
      review: { source: "third_party", verdict: "pass", artifact_paths: [missingPath] },
    });
    const result = validatePhaseGate(phaseResult, repo);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/review artifact not found/);
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
