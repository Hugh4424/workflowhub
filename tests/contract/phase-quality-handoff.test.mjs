import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const { captureReviewSource } = await import("../../skills/wh-review/scripts/review-source.mjs");
const { verifyFinalSubject } = await import("../../skills/wh-review/scripts/review-runner.mjs");

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const tempRoots = [];
const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

function repoFixture() {
  const root = mkdtempSync(join(tmpdir(), "workflowhub-phase-subject-"));
  tempRoots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, ["init", "-q"]);
  git(repo, ["config", "user.name", "WorkflowHub Tests"]);
  git(repo, ["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "phase.mjs"), "base\n");
  writeFileSync(join(repo, "other.mjs"), "base\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "base"]);
  return { root, repo, baseCommit: git(repo, ["rev-parse", "HEAD"]) };
}

afterEach(() => {
  while (tempRoots.length) rmSync(tempRoots.pop(), { recursive: true, force: true });
});

describe("Phase quality and handoff contract", () => {
  it("keeps blueprint design in build-plan before stateless routing", () => {
    const deps = read("workflows/build-plan/skill-deps.yaml");
    const steps = JSON.parse(read("workflows/build-plan/steps.json"));
    const blueprint = deps.indexOf("testing-system-blueprint");
    const route = deps.indexOf("test-routing-advisor");
    expect(blueprint).toBeGreaterThanOrEqual(0);
    expect(route).toBeGreaterThan(blueprint);
    const slugs = steps.steps.map((step) => step.step_slug);
    expect(slugs.indexOf("testing-system-blueprint")).toBeGreaterThan(-1);
    expect(slugs.indexOf("test-routing-advisor")).toBeGreaterThan(slugs.indexOf("testing-system-blueprint"));
    expect(slugs).not.toContain("grill-with-docs");
    expect(read("workflows/build-plan/SKILL.md")).toMatch(/Do not run Talk, Clarify, or Grill/);
    expect(read("workflows/build-plan/SKILL.md")).toMatch(/Do not implement code or execute RED\/GREEN/);
  });

  it("keeps blueprint advisory and concrete testing single-choice in build-code", () => {
    const blueprint = read("skills/testing-system-blueprint/SKILL.md");
    const buildCode = read("workflows/build-code/SKILL.md");
    expect(blueprint).toMatch(/build-plan/);
    expect(blueprint).toMatch(/不.*gate|不是测试通过门/);
    expect(blueprint).toMatch(/不.*ledger|不.*receipt/);
    expect(buildCode).toMatch(/Use exactly one applicable concrete testing skill directly/);
    expect(buildCode).toMatch(/once for every behavior Phase/);
    expect(read("workflows/build-code/skill-deps.yaml")).toMatch(/every_behavior_phase_actual_scope/);
    expect(buildCode).toMatch(/backend-testing.*frontend-testing.*fullstack-slice-testing/s);
    expect(buildCode).toMatch(/A current Phase review is required as a recorded quality fact/);
    expect(buildCode).toMatch(/not a progression gate/);
    expect(buildCode).toMatch(/phase may be committed only when the\s+user has separately authorized/);
    expect(buildCode).toMatch(/the\s+phase\s+commit[\s\S]*never\s+required\s+to start, continue, test, repair, or hand off/i);
    expect(buildCode).not.toMatch(/phase_handoff_review:\s*pass_required/);
  });

  it("keeps Phase review scope host-derived instead of task-card supplied", () => {
    const runner = read("skills/wh-review/scripts/review-runner.mjs");
    const source = read("skills/wh-review/scripts/review-source.mjs");
    expect(runner).not.toMatch(/phaseExecutionPaths|execution_file_paths/);
    expect(source).not.toMatch(/phasePaths|execution_file_paths/);
    expect(runner).toMatch(/phase review results are quality facts, not verify-final results/);
    expect(runner).not.toMatch(/phase-gate/);
  });

  it("preserves the four-material and task-card boundary", () => {
    const tasks = read("skills/spec-tasks/SKILL.md");
    const template = read("skills/spec-tasks/templates/tasks-template.md");
    expect(tasks).toMatch(/current v3[\s\S]*design contract fields/);
    expect(tasks).toMatch(/Do not add workflow summaries,[\s\S]*second\s+completion ledger/);
    expect(template).toMatch(/paired_task/);
    expect(template).toMatch(/gate_cmd/);
    expect(template).toMatch(/oracle/);
    expect(tasks).toMatch(/status value is\s+descriptive/);
    expect(tasks).not.toMatch(/TaskKernel|WorkflowHub Stage Progress/i);
  });

  it("derives committed Phase files from the commit parent and candidate tree", () => {
    const { root, repo, baseCommit } = repoFixture();
    writeFileSync(join(repo, "phase.mjs"), "phase changed\n");
    git(repo, ["add", "phase.mjs"]);
    git(repo, ["commit", "-qm", "phase"]);
    const source = captureReviewSource({ sourceRoot: repo, targetRepoRoot: repo, baselineCommit: baseCommit, reviewDataRoot: root, phaseId: "phase-a", includeDiff: true });
    try {
      const head = git(repo, ["rev-parse", "HEAD"]);
      expect(source.changedFiles.map(({ path }) => path)).toEqual(["phase.mjs"]);
      expect(source.phaseCommit).toMatchObject({
        committed: true,
        commit_oid: head,
        parent_commit: git(repo, ["rev-parse", "HEAD^"]),
        commit_tree: git(repo, ["rev-parse", "HEAD^{tree}"]),
        candidate_tree: source.snapshotTree,
        tree_matches_candidate: true,
      });
      expect(readFileSync(source.diffPath, "utf8")).not.toContain("other.mjs");
    } finally {
      source.dispose();
    }
  });

  it("records a dirty Phase without inventing a commit", () => {
    const { root, repo, baseCommit } = repoFixture();
    writeFileSync(join(repo, "phase.mjs"), "dirty phase\n");
    const source = captureReviewSource({ sourceRoot: repo, targetRepoRoot: repo, baselineCommit: baseCommit, reviewDataRoot: root, phaseId: "phase-a", includeDiff: true });
    try {
      const head = git(repo, ["rev-parse", "HEAD"]);
      expect(source.changedFiles.map(({ path }) => path)).toEqual(["phase.mjs"]);
      expect(source.phaseCommit).toMatchObject({
        committed: false,
        commit_oid: null,
        parent_commit: head,
        commit_tree: git(repo, ["rev-parse", "HEAD^{tree}"]),
        candidate_tree: source.snapshotTree,
        tree_matches_candidate: false,
      });
    } finally {
      source.dispose();
    }
  });

  it("invalidates a Phase review when its committed tree differs from the candidate tree", () => {
    const { root, repo, baseCommit } = repoFixture();
    writeFileSync(join(repo, "phase.mjs"), "phase committed\n");
    git(repo, ["add", "phase.mjs"]);
    git(repo, ["commit", "-qm", "phase"]);
    writeFileSync(join(repo, "phase.mjs"), "phase changed after commit\n");
    const current = captureReviewSource({ sourceRoot: repo, targetRepoRoot: repo, baselineCommit: baseCommit, reviewDataRoot: root, phaseId: "phase-a", includeDiff: false });
    try {
      const result = {
        stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "phase-a",
        base_tree: current.baseTree, candidate_tree: current.snapshotTree, snapshot_tree: current.snapshotTree,
        source: {
          target_commit: current.targetCommit, base_commit: current.baseCommit, base_tree: current.baseTree,
          captured_head: current.capturedHead, phase_commit: { ...current.phaseCommit, tree_matches_candidate: true },
        },
      };
      expect(() => verifyFinalSubject({ result, current })).toThrow(/WORKTREE_CHANGED_AFTER_REVIEW/);
    } finally {
      current.dispose();
    }
  });
});
