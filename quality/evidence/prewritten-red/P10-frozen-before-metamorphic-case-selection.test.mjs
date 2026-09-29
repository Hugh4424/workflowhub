// Revised frozen target under decision-log.md P10/T020 test-only permission.
// The original test bytes and its four-failure combined RED are retained under
// quality/evidence/prewritten-red/. This test targets P10's own public seam,
// not prepareTaskWorkspace().baselineCommit (which P10 cannot change).
import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bootstrapTask } from "../../tools/cli/task-bootstrap.mjs";
import { openTask } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { runCapture } from "../../workflows/build-code/capture.mjs";
import { selectAffectedCases } from "../../workflows/build-code/case-selection.mjs";

const roots = [];
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

function taskFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p10-selection-")));
  roots.push(root);
  const repo = join(root, "repo"), storage = join(root, "storage"), home = join(root, "home");
  mkdirSync(repo); mkdirSync(storage); mkdirSync(home);
  git(repo, "init", "-q", "-b", "main");
  git(repo, "config", "user.name", "Selection fixture");
  git(repo, "config", "user.email", "selection@example.test");
  writeFileSync(join(repo, "product.mjs"), "export const effect = 'old';\n");
  git(repo, "add", "product.mjs"); git(repo, "commit", "-qm", "before task starts");
  const bootstrapped = bootstrapTask({ project: "Selection", task: "p10-selection", "target-repo": repo }, {
    env: { HOME: home, WORKFLOWHUB_TASK_DIR: storage }, home, cwd: repo,
  });
  const task = openTask(bootstrapped.task_path, "Selection", "p10-selection");
  const identity = JSON.parse(task.readRecord(bootstrapped.bootstrap_identity_ref));
  expect(identity.transaction.status).toBe("closed");
  const worktree = bootstrapped.workspace.worktree_root;
  writeFileSync(join(worktree, "product.mjs"), "export const effect = 'new';\n");
  git(worktree, "add", "product.mjs"); git(worktree, "commit", "-qm", "task implementation");
  return { task, worktree, identity };
}

const cases = [{ id: "CASE-PRODUCT", change_triggers: ["product.mjs"], related_case_ids: ["CASE-REGRESSION"], execution: { target: "tests/product.test.mjs", expected_test_identity: "product changes effect" } },
  { id: "CASE-REGRESSION", change_triggers: ["old-regression.mjs"], related_case_ids: ["CASE-PRODUCT"], execution: { target: "tests/regression.test.mjs", expected_test_identity: "old effect remains" } }];
const inventory = { tests: [
  { test_file: "tests/product.test.mjs", full_id: "product changes effect", status: "registered" },
  { test_file: "tests/regression.test.mjs", full_id: "old effect remains", status: "registered" },
] };

function select(changeScope, currentCases = cases, currentInventory = inventory) {
  return selectAffectedCases({ changeScope, catalog: { revision: "fixture-v1", cases: currentCases }, inventory: currentInventory });
}

describe("ORACLE-P10-B2-CASE-TRUTH: P10-owned change-to-case selection", () => {
  it("selects changed product and its old regression after a committed-clean task restart", async () => {
    const { task, worktree, identity } = taskFixture();
    // The canonical snapshot is real, but the fixed command is deliberately NOT
    // a P10 launcher. It must never be counted as execution of selected cases.
    const receipt = await runCapture("node --version", "quality/tests/p10-selection-snapshot.json", {
      task, workspace: openCurrentTaskWorkspace(task),
    });
    const start = identity.creation_result.workspace.baseline_commit;
    expect(start).not.toBe(git(worktree, "rev-parse", "HEAD"));
    const observedPaths = git(worktree, "diff", "--name-only", start, "HEAD").split("\n");
    expect(observedPaths).toEqual(["product.mjs"]);
    // This consumes independently observed Git paths as a P9-style input; P10
    // cannot authenticate that input itself until P9 publishes its real seam.
    const result = select({ status: "recorded", task_id: task.identity.taskId, start_commit: start,
      changed_paths: observedPaths, snapshot_tree: receipt.snapshot_tree, source_digest: receipt.source_digest });
    expect(result.status, "P10 must select from the authenticated start, not reopened HEAD").toBe("selected");
    expect(result.cases.map((entry) => entry.id).sort()).toEqual(["CASE-PRODUCT", "CASE-REGRESSION"]);
  });

  it("rejects an unknown task start instead of certifying an empty affected set", () => {
    const result = select({ status: "unknown_change_scope", changed_paths: [] });
    expect(result.status).not.toBe("selected");
  });

  it("never certifies an unmapped changed product path as an empty successful selection", () => {
    const result = select({ status: "recorded", changed_paths: ["unmapped-product.mjs"] });
    expect(result.status).not.toBe("selected");
  });

  it("does not certify a catalog relationship missing from independent inventory", () => {
    const result = select({ status: "recorded", changed_paths: ["product.mjs"] }, cases,
      { tests: [inventory.tests[0]] });
    expect(result.status).not.toBe("selected");
  });

  it("does not use a supplied HEAD-as-start or mismatched snapshot as task provenance", () => {
    const result = select({ status: "recorded", start_commit: "a".repeat(40),
      head_commit: "a".repeat(40), snapshot_tree: "b".repeat(40), source_digest: "c".repeat(64),
      changed_paths: ["product.mjs"] });
    expect(result.status).not.toBe("selected");
  });
});
