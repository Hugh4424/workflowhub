// Frozen P10 test-only target. Previous bytes and RED are archived as P10-frozen-before-metamorphic-*.
// This public P10 seam consumes independently observed paths, not a P9-certified change scope.
import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
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

function taskFixture(variant) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p10-selection-")));
  roots.push(root);
  const repo = join(root, "repo"), storage = join(root, "storage"), home = join(root, "home");
  mkdirSync(repo); mkdirSync(storage); mkdirSync(home);
  git(repo, "init", "-q", "-b", "main");
  git(repo, "config", "user.name", "Selection fixture");
  git(repo, "config", "user.email", "selection@example.test");
  writeFileSync(join(repo, variant.path), "export const effect = 'old';\n");
  git(repo, "add", variant.path); git(repo, "commit", "-qm", "before task starts");
  const bootstrapped = bootstrapTask({ project: "Selection", task: `p10-${variant.tag}`, "target-repo": repo }, {
    env: { HOME: home, WORKFLOWHUB_TASK_DIR: storage }, home, cwd: repo,
  });
  const task = openTask(bootstrapped.task_path, "Selection", `p10-${variant.tag}`);
  const identity = JSON.parse(task.readRecord(bootstrapped.bootstrap_identity_ref));
  expect(identity.transaction.status).toBe("closed");
  const worktree = bootstrapped.workspace.worktree_root;
  writeFileSync(join(worktree, variant.path), "export const effect = 'new';\n");
  git(worktree, "add", variant.path); git(worktree, "commit", "-qm", "task implementation");
  return { task, worktree, identity };
}

function variant(label) {
  const tag = `${label}-${randomUUID()}`;
  return { tag, path: `effect-${tag}.mjs`, caseId: `CASE-${tag}`, regressionId: `REGRESSION-${tag}`,
    testPath: `tests/effect-${tag}.test.mjs`, regressionPath: `tests/regression-${tag}.test.mjs`,
    fullId: `changes effect ${tag}`, regressionFullId: `old effect remains ${tag}` };
}
function inputs(v) {
  const cases = [
    { id: v.caseId, change_triggers: [v.path], related_case_ids: [v.regressionId], execution: { target: v.testPath, expected_test_identity: v.fullId } },
    { id: v.regressionId, change_triggers: [`old-${v.tag}.mjs`], related_case_ids: [v.caseId], execution: { target: v.regressionPath, expected_test_identity: v.regressionFullId } },
  ];
  const inventory = { tests: [
    { test_file: v.testPath, full_id: v.fullId, status: "registered" },
    { test_file: v.regressionPath, full_id: v.regressionFullId, status: "registered" },
  ] };
  return { cases, inventory };
}
function select(changeScope, v, override = {}) {
  const { cases, inventory } = inputs(v);
  return selectAffectedCases({ changeScope, catalog: { revision: `fixture-${v.tag}`, cases: override.cases ?? cases }, inventory: override.inventory ?? inventory });
}
function rejectsFor(result, reason) {
  expect(result.status).not.toBe("selected");
  expect(result.reason, "a blanket not_implemented/unavailable response cannot pass a cause-specific negative").toBe(reason);
  expect(result.cases ?? []).toEqual([]);
}

describe("ORACLE-P10-B2-CASE-TRUTH: P10-owned change-to-case selection", () => {
  it.each(["alpha", "beta"])("selects dynamic %s product and linked old regression from committed task start", async (label) => {
    const v = variant(label);
    const { task, worktree, identity } = taskFixture(v);
    // Capture the real snapshot; node --version is NOT a P10 launcher or selected-case execution.
    const receipt = await runCapture("node --version", "quality/tests/p10-selection-snapshot.json", {
      task, workspace: openCurrentTaskWorkspace(task),
    });
    const start = identity.creation_result.workspace.baseline_commit;
    expect(start).not.toBe(git(worktree, "rev-parse", "HEAD"));
    const observedPaths = git(worktree, "diff", "--name-only", start, "HEAD").split("\n");
    expect(observedPaths).toEqual([v.path]);
    const result = select({ status: "recorded", task_id: task.identity.taskId, start_commit: start,
      changed_paths: observedPaths, snapshot_tree: receipt.snapshot_tree, source_digest: receipt.source_digest }, v);
    expect(result.status, "P10 must select from task start rather than reopened HEAD").toBe("selected");
    expect(result.cases.map(({ id }) => id).sort()).toEqual([v.caseId, v.regressionId].sort());
    expect(result.cases.map(({ execution }) => execution?.target).sort()).toEqual([v.testPath, v.regressionPath].sort());
  });

  it("identifies unknown change scope rather than certifying an empty set", () => {
    rejectsFor(select({ status: "unknown_change_scope", changed_paths: [] }, variant("unknown")), "unknown_change_scope");
  });
  it("identifies an unmapped changed product path", () => {
    const v = variant("unmapped");
    rejectsFor(select({ status: "recorded", changed_paths: [`other-${v.tag}.mjs`] }, v), "unmapped_changed_path");
  });
  it("identifies an affected regression missing from independent inventory", () => {
    const v = variant("inventory"), { inventory } = inputs(v);
    rejectsFor(select({ status: "recorded", changed_paths: [v.path] }, v,
      { inventory: { tests: [inventory.tests[0]] } }), "missing_inventory_identity");
  });
  it("identifies a supplied HEAD-as-start and mismatched snapshot", () => {
    const v = variant("provenance");
    rejectsFor(select({ status: "recorded", start_commit: "a".repeat(40),
      head_commit: "a".repeat(40), snapshot_tree: "b".repeat(40), source_digest: "c".repeat(64),
      changed_paths: [v.path] }, v), "invalid_change_provenance");
  });
  it("does not select an unrelated fixed case ID for a different dynamic product", () => {
    const a = variant("foreign-a"), b = variant("foreign-b");
    const result = select({ status: "recorded", changed_paths: [b.path] }, b);
    expect((result.cases ?? []).some(({ id }) => id === a.caseId || id === a.regressionId)).toBe(false);
    expect(result.status).toBe("selected");
    expect(result.cases.map(({ id }) => id).sort()).toEqual([b.caseId, b.regressionId].sort());
  });
});
