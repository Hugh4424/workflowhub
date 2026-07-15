import { describe, it, beforeEach, afterEach, expect } from "vitest";
import { execSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

import {
  resolveTaskRecordPaths,
  resolveMakeDecisionStageResultPath,
  taskRecordPath,
  validateTaskId,
} from "../task-record-paths.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const cliPath = resolve(here, "../task-record-paths.mjs");

let tmpDir;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "task-record-paths-test-"));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

function makeRepo(name = "workflowhub") {
  const repoRoot = join(tmpDir, name);
  mkdirSync(repoRoot, { recursive: true });
  execSync("git init", { cwd: repoRoot, stdio: "ignore" });
  execSync("git remote add origin https://github.com/Hugh4424/workflowhub.git", {
    cwd: repoRoot,
    stdio: "ignore",
  });
  return repoRoot;
}

function makeHomeWithConfig(repoRoot) {
  const fakeHome = join(tmpDir, "home");
  const configDir = join(fakeHome, ".workflowhub");
  const knowledgeRoot = join(tmpDir, "Knowledge");
  const taskTrackingRoot = join(knowledgeRoot, "Projects", "workflowhub", "tasks");
  mkdirSync(configDir, { recursive: true });
  mkdirSync(taskTrackingRoot, { recursive: true });
  writeFileSync(
    join(configDir, "config.json"),
    JSON.stringify({
      task_dir: knowledgeRoot,
      repo_root_map: {
        "https://github.com/Hugh4424/workflowhub.git": repoRoot,
      },
    })
  );
  return { fakeHome, taskTrackingRoot };
}

describe("task-record-paths", () => {
  it("resolves worktree.json under config project task_dir, not repo-local tasks", () => {
    const repoRoot = makeRepo();
    mkdirSync(join(repoRoot, "tasks", "wh-quality-convergence"), { recursive: true });
    const { fakeHome, taskTrackingRoot } = makeHomeWithConfig(repoRoot);

    const output = execSync(
      `node ${JSON.stringify(cliPath)} wh-quality-convergence worktree.json`,
      {
        cwd: repoRoot,
        env: {
          ...process.env,
          HOME: fakeHome,
          WORKFLOWHUB_TASK_DIR: "",
        },
        encoding: "utf8",
      }
    ).trim();

    expect(output).toBe(join(taskTrackingRoot, "wh-quality-convergence", "worktree.json"));
    expect(output).not.toContain(join(repoRoot, "tasks"));
  });

  it("returns standard task record paths from a supplied task_tracking_root", () => {
    const taskTrackingRoot = join(tmpDir, "tasks");
    mkdirSync(taskTrackingRoot, { recursive: true });

    const paths = resolveTaskRecordPaths("wh-quality-convergence", { taskTrackingRoot });

    expect(paths.task_root).toBe(join(taskTrackingRoot, "wh-quality-convergence"));
    expect(paths.worktree_json).toBe(join(paths.task_root, "worktree.json"));
    expect(paths.stage_result.build_code).toBe(join(paths.task_root, "stage-result-build-code.json"));
    expect(paths.stage_result.verify_code).toBe(join(paths.task_root, "stage-result-verify-code.json"));
  });

  it("uses one canonical make-decision stage result and review record directories", () => {
    const taskTrackingRoot = join(tmpDir, "tasks"); mkdirSync(taskTrackingRoot, { recursive: true });
    expect(resolveMakeDecisionStageResultPath("wh-quality-convergence", { taskTrackingRoot })).toBe(join(taskTrackingRoot, "wh-quality-convergence", "stage-result-make-decision.json"));
    const paths = resolveTaskRecordPaths("wh-quality-convergence", { taskTrackingRoot });
    expect(paths.stage_result.make_decision).toBe(join(paths.task_root, "stage-result-make-decision.json"));
    expect(paths.review_results_dir).toBe(join(paths.task_root, "reviews", "results"));
    const previousTaskDir = process.env.WORKFLOWHUB_TASK_DIR; process.env.WORKFLOWHUB_TASK_DIR = taskTrackingRoot;
    try {
      expect(() => taskRecordPath("wh-quality-convergence", "reviews", "stage-result-make-decision.json")).toThrow(/legacy reviews/);
      expect(taskRecordPath("wh-quality-convergence", "stage-result-make-decision.json")).toBe(join(taskTrackingRoot, "wh-quality-convergence", "stage-result-make-decision.json"));
    }
    finally { if (previousTaskDir === undefined) delete process.env.WORKFLOWHUB_TASK_DIR; else process.env.WORKFLOWHUB_TASK_DIR = previousTaskDir; }
  });

  it("rejects unsafe task ids and path traversal", () => {
    expect(() => validateTaskId("../x")).toThrow(/invalid task_id/);
    const previousTaskDir = process.env.WORKFLOWHUB_TASK_DIR;
    process.env.WORKFLOWHUB_TASK_DIR = tmpDir;
    try {
      expect(() => taskRecordPath("safe-task", "..", "escape")).toThrow(/escapes task record root/);
    } finally {
      if (previousTaskDir === undefined) {
        delete process.env.WORKFLOWHUB_TASK_DIR;
      } else {
        process.env.WORKFLOWHUB_TASK_DIR = previousTaskDir;
      }
    }
  });
});
