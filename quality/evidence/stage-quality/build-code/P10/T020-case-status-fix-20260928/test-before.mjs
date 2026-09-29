// Frozen P10 test-only target. Previous bytes and RED are archived as P10-frozen-before-metamorphic-*.
// This public P10 seam consumes independently observed paths, not a P9-certified change scope.
import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bootstrapTask } from "../../tools/cli/task-bootstrap.mjs";
import { openTask } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { runCapture } from "../../workflows/build-code/capture.mjs";
import { capturePreExecutionTaskChangeScope } from "../../workflows/build-code/change-scope.mjs";
import { selectAffectedCases } from "../../workflows/build-code/case-selection.mjs";
import { readCurrentTestAssetRegistry } from "../../workflows/build-code/test-asset-inventory.mjs";

const roots = [];
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

function taskFixture(variant, unrelated) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p10-selection-")));
  roots.push(root);
  const repo = join(root, "repo"), storage = join(root, "storage"), home = join(root, "home");
  mkdirSync(repo); mkdirSync(storage); mkdirSync(home);
  git(repo, "init", "-q", "-b", "main");
  git(repo, "config", "user.name", "Selection fixture");
  git(repo, "config", "user.email", "selection@example.test");
  writeFileSync(join(repo, variant.path), "export const effect = 'old';\n");
  if (unrelated) writeFileSync(join(repo, unrelated.path), "export const effect = 'unrelated';\n");
  git(repo, "add", "."); git(repo, "commit", "-qm", "before task starts");
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
function inputs(...variants) {
  const cases = variants.flatMap((v) => [
    { id: v.caseId, change_triggers: [v.path], related_case_ids: [v.regressionId], execution: { target: v.testPath, expected_test_identity: v.fullId } },
    { id: v.regressionId, change_triggers: [`old-${v.tag}.mjs`], related_case_ids: [v.caseId], execution: { target: v.regressionPath, expected_test_identity: v.regressionFullId } },
  ]);
  const inventory = { tests: variants.flatMap((v) => [
    { test_file: v.testPath, full_id: v.fullId, status: "registered" },
    { test_file: v.regressionPath, full_id: v.regressionFullId, status: "registered" },
  ]) };
  return { cases, inventory };
}
function select(changeScope, v, override = {}) {
  const variants = override.variants ?? [v];
  const { cases, inventory } = inputs(...variants);
  return selectAffectedCases({ changeScope, catalog: { revision: `fixture-${variants.map(({ tag }) => tag).join("-")}`, cases: override.cases ?? cases }, inventory: override.inventory ?? inventory });
}
function rejectsFor(result, reason) {
  expect(result.status).not.toBe("selected");
  expect(result.reason, "a blanket not_implemented/unavailable response cannot pass a cause-specific negative").toBe(reason);
  expect(result.cases ?? []).toEqual([]);
}
function recordedScope({ task, worktree, identity }, receipt, changedPath) {
  const start = identity.creation_result.workspace.baseline_commit;
  const head = git(worktree, "rev-parse", "HEAD");
  expect(start).not.toBe(head);
  const changedPaths = git(worktree, "diff", "--name-only", start, head).split("\n");
  expect(changedPaths).toEqual([changedPath]);
  // Both controls use precisely this same public input shape. These are
  // fixture-observed values, not authority the P10 seam can independently verify.
  return { status: "recorded", task_id: task.identity.taskId, start_commit: start,
    head_commit: head, changed_paths: changedPaths, snapshot_tree: receipt.snapshot_tree,
    source_digest: receipt.source_digest };
}

describe("ORACLE-P10-B2-CASE-TRUTH: P10-owned change-to-case selection", () => {
  it.each(["alpha", "beta"])("selects only changed dynamic %s product and linked regression, excluding unrelated dynamic product", async (label) => {
    const changed = variant(`changed-${label}`), unrelated = variant(`unrelated-${label}`);
    // Both A and B are real baseline files, catalog cases and inventory identities.
    // Across variants invert which product changes; a select-all implementation fails.
    const [a, b] = label === "alpha" ? [changed, unrelated] : [unrelated, changed];
    const { task, worktree, identity } = taskFixture(changed, unrelated);
    // Capture the real snapshot; node --version is NOT a P10 launcher or selected-case execution.
    const receipt = await runCapture("node --version", "quality/tests/p10-selection-snapshot.json", {
      task, workspace: openCurrentTaskWorkspace(task),
    });
    const scope = recordedScope({ task, worktree, identity }, receipt, changed.path);
    expect(git(worktree, "ls-files").split("\n").sort()).toEqual([a.path, b.path].sort());
    const result = select(scope, changed, { variants: [a, b] });
    expect(result.status, "P10 must select from task start rather than reopened HEAD").toBe("selected");
    expect(result.cases.map(({ id }) => id).sort()).toEqual([changed.caseId, changed.regressionId].sort());
    expect(result.cases.map(({ execution }) => execution?.target).sort()).toEqual([changed.testPath, changed.regressionPath].sort());
    expect(result.cases.map(({ id }) => id)).not.toContain(unrelated.caseId);
    expect(result.cases.map(({ id }) => id)).not.toContain(unrelated.regressionId);
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
  it.each(["head_as_start", "mismatched_snapshot"])("rejects %s against a real task baseline, Git diff and capture receipt", async (fault) => {
    const v = variant(`provenance-${fault}`), unrelated = variant(`unrelated-${fault}`);
    const { task, worktree, identity } = taskFixture(v, unrelated);
    const receipt = await runCapture("node --version", `quality/tests/p10-provenance-${fault}.json`, {
      task, workspace: openCurrentTaskWorkspace(task),
    });
    const validScope = recordedScope({ task, worktree, identity }, receipt, v.path);
    expect(receipt.task_id).toBe(task.identity.taskId);
    const { inventory } = inputs(v, unrelated);
    const boundInventory = { ...inventory, status: "recorded", task_id: task.identity.taskId,
      snapshot_tree: receipt.snapshot_tree, source_digest: receipt.source_digest };
    const fixture = { variants: [v, unrelated], inventory: boundInventory };
    expect(select(validScope, v, fixture).status).toBe("selected");
    const wrongStart = { ...validScope, start_commit: validScope.head_commit };
    // A valid Git tree from the pre-change baseline is still wrong for this capture.
    const wrongTree = git(worktree, "rev-parse", `${validScope.start_commit}^{tree}`);
    expect(wrongTree).not.toBe(receipt.snapshot_tree);
    const wrongSnapshot = { ...validScope, snapshot_tree: wrongTree };
    rejectsFor(select(fault === "head_as_start" ? wrongStart : wrongSnapshot, v,
      fixture), "invalid_change_provenance");
  });
});

describe("P10 pre-run registered case selection", () => {
  function preRunFixture() {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p10-prerun-")));
    roots.push(root);
    const repo = join(root, "repo"), storage = join(root, "storage"), home = join(root, "home");
    mkdirSync(repo); mkdirSync(storage); mkdirSync(home);
    git(repo, "init", "-q", "-b", "main");
    git(repo, "config", "user.name", "Pre-run fixture");
    git(repo, "config", "user.email", "prerun@example.test");
    writeFileSync(join(repo, "product.mjs"), "export const effect = 'old';\n");
    mkdirSync(join(repo, "tests", "contract"), { recursive: true });
    mkdirSync(join(repo, "docs", "quality"), { recursive: true });
    const target = "tests/contract/product.test.mjs";
    const testRaw = "import { it, expect } from 'vitest'; it('effect holds', () => expect(true).toBe(true));\n";
    writeFileSync(join(repo, target), testRaw);
    const fullId = `${target} > effect holds`;
    const command = `npx vitest run ${target} --reporter=json`;
    writeFileSync(join(repo, "docs/quality/test-asset-registry.json"), JSON.stringify({
      schema: "workflowhub-test-asset-registry.v1", revision: "fixture.1", owner: "independent test owner",
      outside_scope: "unknown", retirement_policy: "Retain old IDs when replacing a target.",
      targets: [{ path: target, sha256: createHash("sha256").update(testRaw).digest("hex"),
        runner: "vitest", command, owner: "independent test owner", status: "active",
        registered_test_ids: [fullId] }],
    }, null, 2));
    git(repo, "add", "."); git(repo, "commit", "-qm", "baseline");
    const id = `prerun-${randomUUID()}`;
    const bootstrapped = bootstrapTask({ project: "Selection", task: id, "target-repo": repo }, {
      env: { HOME: home, WORKFLOWHUB_TASK_DIR: storage }, home, cwd: repo,
    });
    const task = openTask(bootstrapped.task_path, "Selection", id);
    const workspace = openCurrentTaskWorkspace(task);
    writeFileSync(join(workspace.worktreeRoot, "product.mjs"), "export const effect = 'new';\n");
    const changeScope = capturePreExecutionTaskChangeScope({ task, workspace });
    expect(changeScope.status).toBe("recorded");
    expect(changeScope.changed_paths).toEqual(["product.mjs"]);
    const registry = readCurrentTestAssetRegistry({ task, workspace });
    const boundRegistry = { ...registry, task_id: task.identity.taskId,
      snapshot_tree: changeScope.snapshot_tree, source_digest: changeScope.source_digest };
    const catalog = { revision: "fixture.1", cases: [{ id: "CASE-PRODUCT", status: "active",
      change_triggers: ["product.mjs"], related_case_ids: [],
      execution: { target, machine_command: command, expected_test_identity: "effect holds",
        registered_test_ids: [fullId] } }] };
    return { changeScope, registry: boundRegistry, catalog, fullId };
  }

  it("selects an affected candidate from P9's pre-run registry without claiming a test ran", () => {
    const { changeScope, registry, catalog } = preRunFixture();
    const result = selectAffectedCases({ changeScope, catalog, registry });
    expect(result.status).toBe("selected");
    expect(result.cases.map((entry) => entry.id)).toEqual(["CASE-PRODUCT"]);
    expect(result.test_execution_status).toBe("not_run");
    expect(result).not.toHaveProperty("receipt_ref");
    expect(result).not.toHaveProperty("observations");
  });

  it("keeps known cases and each unknown path visible without calling partial coverage selected", () => {
    const { changeScope, registry, catalog } = preRunFixture();
    const changed_paths = ["unknown-a.mjs", "product.mjs", "unknown-b.mjs"];
    const result = selectAffectedCases({ changeScope: { ...changeScope, changed_paths }, catalog, registry });
    expect(result).toMatchObject({ status: "unavailable", reason: "unmapped_changed_path",
      changed_paths, unmapped_changed_paths: ["unknown-a.mjs", "unknown-b.mjs"],
      test_execution_status: "not_run" });
    expect(result.cases.map((entry) => entry.id)).toEqual(["CASE-PRODUCT"]);
  });

  it("keeps an entirely unknown change unavailable with no runnable case", () => {
    const { changeScope, registry, catalog } = preRunFixture();
    const result = selectAffectedCases({ changeScope: { ...changeScope,
      changed_paths: ["unknown-only.mjs"] }, catalog, registry });
    expect(result).toMatchObject({ status: "unavailable", reason: "unmapped_changed_path",
      cases: [] });
  });

  it.each([
    ["missing registry hash", ({ registry }) => ({ registry: { ...registry, registry_sha256: "bad" } })],
    ["wrong registry source", ({ registry }) => ({ registry: { ...registry, registry_ref: "docs/quality/other.json" } })],
    ["stale snapshot", ({ registry }) => ({ registry: { ...registry, snapshot_tree: "0".repeat(40) } })],
    ["wrong task", ({ registry }) => ({ registry: { ...registry, task_id: "other-task" } })],
    ["unregistered leaf", ({ catalog }) => ({ catalog: { ...catalog, cases: [{ ...catalog.cases[0],
      execution: { ...catalog.cases[0].execution, registered_test_ids: ["tests/contract/product.test.mjs > other test"] } }] } })],
    ["duplicate expected leaf", ({ catalog, registry, fullId }) => ({
      registry: { ...registry, targets: [{ ...registry.targets[0],
        registered_test_ids: [fullId, "tests/contract/product.test.mjs > second leaf"] }] },
      catalog: { ...catalog, cases: [{ ...catalog.cases[0],
        execution: { ...catalog.cases[0].execution, registered_test_ids: [fullId, fullId] } }] },
    })],
  ])("rejects %s before any selected-case execution", (_name, alter) => {
    const valid = preRunFixture();
    const result = selectAffectedCases({ ...valid, ...alter(valid) });
    expect(result.status).not.toBe("selected");
    expect(result.cases).toEqual([]);
  });
});
