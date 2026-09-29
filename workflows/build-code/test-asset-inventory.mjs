import { createHash } from "node:crypto";
import { readFileSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, resolve, sep } from "node:path";

import { captureExecutionSnapshot } from "../../runtime/task/git-worktree-snapshot.mjs";

import { taskWorkspaceMatches } from "./change-scope.mjs";

const SHA256 = /^[a-f0-9]{64}$/;
const NODE_TAP_COMMAND = /^node --test --test-reporter=tap ([A-Za-z0-9._/-]+\.test\.mjs)$/;
const VITEST_JSON_COMMAND = /^npx vitest run ([A-Za-z0-9._/-]+\.test\.mjs) --reporter=json$/;
const REGISTRY_REF = "docs/quality/test-asset-registry.json";
const TEST_TARGET = /^tests\/(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.test\.mjs$/;

const hash = (raw) => createHash("sha256").update(raw).digest("hex");

function literalTarget(command, pattern) {
  const match = pattern.exec(command ?? "");
  if (!match) return null;
  const target = match[1];
  if (target.startsWith("/") || target.split("/").includes("..") || target.split("/").includes(".")) return null;
  return target;
}

function canonicalReceipt(task, receipt) {
  if (!receipt || typeof receipt !== "object" || typeof receipt.receipt_ref !== "string"
      || !SHA256.test(receipt.receipt_hash ?? "")) throw new Error("test inventory requires a canonical test receipt");
  const raw = task.readRecord(receipt.receipt_ref);
  if (hash(raw) !== receipt.receipt_hash) throw new Error("test inventory receipt hash mismatch");
  const stored = JSON.parse(raw);
  if (stored.schema_version !== "workflowhub-receipt.v1" || stored.stage !== "build-code"
      || stored.producer?.component !== "build-code-test-capture"
      || stored.task_id !== task.identity.taskId
      || !SHA256.test(stored.output_hash ?? "")
      || !SHA256.test(stored.source_digest ?? "")
      || stored.snapshot_tree !== receipt.snapshot_tree
      || stored.source_digest !== receipt.source_digest
      || stored.output_ref !== receipt.output_ref
      || stored.output_hash !== receipt.output_hash
      || stored.command !== receipt.command
      || stored.exit_code !== receipt.exit_code) {
    throw new Error("test inventory receipt does not match the task and returned capture");
  }
  const output = task.readRecord(stored.output_ref);
  if (hash(output) !== stored.output_hash) throw new Error("test inventory output hash mismatch");
  return { stored, output };
}

function currentSnapshot(task, workspace, stored) {
  const observed = captureExecutionSnapshot(workspace.worktreeRoot, task.identity.taskId,
    task.manifest.activation_cohort ?? "pre");
  if (stored.snapshot_head !== observed.head || stored.snapshot_tree !== observed.tree
      || stored.snapshot_commit !== observed.commit || stored.source_digest !== observed.source_digest) {
    throw new Error("test inventory receipt is stale against the current source snapshot");
  }
}

function parseVitestJson(output, file, workspaceRoot, exitCode) {
  let report;
  try { report = JSON.parse(output.trim()); }
  catch { throw new Error("Vitest JSON reporter output is not one complete JSON document"); }
  const root = realpathSync(workspaceRoot);
  const expected = resolve(root, file);
  const actualFile = report?.testResults?.[0]?.name;
  if (!expected.startsWith(`${root}${sep}`) || !isAbsolute(actualFile ?? "")
      || resolve(actualFile) !== expected || realpathSync(expected) !== realpathSync(actualFile)
      || report.testResults.length !== 1) {
    throw new Error("Vitest JSON reporter file does not match the literal worktree target");
  }
  const fileResult = report.testResults[0];
  const assertions = fileResult.assertionResults;
  if (!Array.isArray(assertions) || assertions.length === 0 || report.numTotalTests !== assertions.length) {
    throw new Error("Vitest JSON runnable inventory is empty or inconsistent");
  }
  const tests = [];
  const ids = new Set();
  for (const assertion of assertions) {
    if (!Array.isArray(assertion?.ancestorTitles)
        || assertion.ancestorTitles.some((name) => typeof name !== "string" || name.trim() === "")
        || typeof assertion.title !== "string" || assertion.title.trim() === ""
        || assertion.fullName !== [...assertion.ancestorTitles, assertion.title].join(" ")
        || !["passed", "failed", "skipped", "todo", "pending"].includes(assertion.status)) {
      throw new Error("Vitest JSON assertion identity or status is invalid");
    }
    const full_id = [file, ...assertion.ancestorTitles, assertion.title].join(" > ");
    if (ids.has(full_id)) throw new Error(`duplicate Vitest runnable ID: ${full_id}`);
    ids.add(full_id);
    tests.push({ full_id, status: assertion.status });
  }
  const count = (status) => tests.filter((entry) => entry.status === status).length;
  if (report.numPassedTests !== count("passed") || report.numFailedTests !== count("failed")
      || report.numPendingTests !== count("pending") + count("skipped")
      || report.numTodoTests !== count("todo")
      || report.success !== (count("failed") === 0)
      || (fileResult.status !== "passed" && fileResult.status !== "failed")
      || (fileResult.status === "failed") !== (count("failed") > 0)
      || (exitCode === 0) !== report.success) {
    throw new Error("Vitest JSON reporter totals, file status, success, or exit code disagree");
  }
  return tests;
}

function parseNodeTap(output, file) {
  const lines = output.split(/\r?\n/);
  if (lines.find((line) => line.trim() !== "") !== "TAP version 13") throw new Error("Node TAP version 13 header missing");
  const frames = [];
  const tests = [];
  const ids = new Set();
  let testCount = null;
  let topPlan = null;
  let topResults = 0;
  const totals = {};
  for (const line of lines) {
    const marker = /^( *)# Subtest: (.+)$/.exec(line);
    if (marker) {
      const indent = marker[1].length;
      if (indent % 4 !== 0 || (frames.length ? indent !== frames.at(-1).indent + 4 : indent !== 0)) {
        throw new Error("Node TAP subtest nesting is malformed");
      }
      frames.push({ indent, name: marker[2], children: 0 });
      continue;
    }
    const result = /^( *)(not ok|ok) \d+ - (.+)$/.exec(line);
    if (result) {
      const indent = result[1].length;
      if (indent % 4 !== 0) throw new Error("Node TAP result indentation is malformed");
      const nameAndDirective = /^(.*?)(?: # (SKIP|TODO)(?: .*)?)?$/.exec(result[3]);
      const name = nameAndDirective[1];
      const directive = nameAndDirective[2];
      if (!name) throw new Error("Node TAP test name is empty");
      const frame = frames.at(-1);
      if (!frame || frame.indent !== indent || frame.name !== name) {
        throw new Error(`Node TAP result lacks a matching subtest: ${name}`);
      }
      if (indent === 0) topResults += 1;
      frames.pop();
      if (frame.children > 0) {
        if (frames.length) frames.at(-1).children += frame.children;
        continue; // Suite summary, not another runnable test.
      }
      const full_id = [file, ...frames.map((parent) => parent.name), name].join(" > ");
      if (ids.has(full_id)) throw new Error(`duplicate Node TAP runnable ID: ${full_id}`);
      ids.add(full_id);
      const status = directive === "SKIP" ? "skipped" : directive === "TODO" ? "todo"
        : result[2] === "ok" ? "passed" : "failed";
      tests.push({ full_id, status });
      if (frames.length) frames.at(-1).children += 1;
      continue;
    }
    const plan = /^1\.\.(\d+)$/.exec(line);
    if (plan) topPlan = Number(plan[1]);
    const count = /^# tests (\d+)$/.exec(line);
    if (count) testCount = Number(count[1]);
    const total = /^# (pass|fail|skipped|todo) (\d+)$/.exec(line);
    if (total) totals[total[1]] = Number(total[2]);
  }
  if (frames.length || tests.length === 0 || testCount !== tests.length
      || topPlan !== topResults || Object.keys(totals).length !== 4
      || totals.pass !== tests.filter((entry) => entry.status === "passed").length
      || totals.fail !== tests.filter((entry) => entry.status === "failed").length
      || totals.skipped !== tests.filter((entry) => entry.status === "skipped").length
      || totals.todo !== tests.filter((entry) => entry.status === "todo").length) {
    throw new Error("Node TAP runnable inventory is missing, truncated, or inconsistent");
  }
  return tests;
}

/** Read a canonical Node TAP capture into a return-only runnable-test inventory. */
export function collectTestInventory({ task, workspace, receipt, registeredTestIds } = {}) {
  if (!taskWorkspaceMatches({ task, workspace })) throw new Error("test inventory task/workspace mismatch");
  if (!Array.isArray(registeredTestIds) || registeredTestIds.some((id) => typeof id !== "string" || id.trim() === "")
      || new Set(registeredTestIds).size !== registeredTestIds.length) {
    throw new TypeError("registeredTestIds must be an array of unique nonempty runnable IDs");
  }
  const { stored, output } = canonicalReceipt(task, receipt);
  currentSnapshot(task, workspace, stored);
  const nodeTarget = literalTarget(stored.command, NODE_TAP_COMMAND);
  const vitestTarget = literalTarget(stored.command, VITEST_JSON_COMMAND);
  if (nodeTarget === null && vitestTarget === null) {
    return Object.freeze({ status: "unavailable", reason: "unsupported test runner or nonliteral Node TAP target",
      task_id: stored.task_id, snapshot_tree: stored.snapshot_tree, source_digest: stored.source_digest,
      output_ref: stored.output_ref });
  }
  const runner = nodeTarget === null ? "vitest" : "node:test";
  const tests = nodeTarget === null
    ? parseVitestJson(output, vitestTarget, workspace.worktreeRoot, stored.exit_code)
    : parseNodeTap(output, nodeTarget);
  const registered = new Set(registeredTestIds);
  const discovered = new Set(tests.map((entry) => entry.full_id));
  return Object.freeze({
    schema_version: "workflowhub-test-asset-inventory.v1", status: "recorded", task_id: stored.task_id,
    snapshot_tree: stored.snapshot_tree, source_digest: stored.source_digest,
    receipt_ref: receipt.receipt_ref, output_ref: stored.output_ref, output_hash: stored.output_hash,
    runner, runner_version: "unknown", command: stored.command, exit_code: stored.exit_code,
    tests, registered_test_ids: [...registeredTestIds],
    unmatched: tests.filter((entry) => !registered.has(entry.full_id)).map((entry) => entry.full_id),
    missing: registeredTestIds.filter((id) => !discovered.has(id)),
    skipped: tests.filter((entry) => entry.status === "skipped").map((entry) => entry.full_id),
  });
}

/** Read the independent finite test registration from the authenticated task worktree. */
export function readCurrentTestAssetRegistry({ task, workspace } = {}) {
  if (!taskWorkspaceMatches({ task, workspace })) throw new Error("test registry task/workspace mismatch");
  const root = realpathSync(workspace.worktreeRoot);
  const registryPath = resolve(root, REGISTRY_REF);
  if (realpathSync(registryPath) !== registryPath || !statSync(registryPath).isFile()) {
    throw new Error("test registry path is not a regular worktree file");
  }
  const raw = readFileSync(registryPath);
  let value;
  try { value = JSON.parse(raw.toString("utf8")); }
  catch { throw new Error("test registry JSON is invalid"); }
  if (value?.schema !== "workflowhub-test-asset-registry.v1"
      || typeof value.revision !== "string" || value.revision.trim() === ""
      || typeof value.owner !== "string" || value.owner.trim() === ""
      || value.outside_scope !== "unknown"
      || typeof value.retirement_policy !== "string" || value.retirement_policy.trim() === ""
      || !Array.isArray(value.targets) || value.targets.length === 0) {
    throw new Error("test registry identity or finite scope is invalid");
  }
  const paths = new Set(), allIds = new Set();
  for (const entry of value.targets) {
    const path = entry?.path;
    if (typeof path !== "string" || !TEST_TARGET.test(path)
        || path.split("/").some((part) => part === "." || part === "..") || paths.has(path)) {
      throw new Error("test registry target path is unsafe or duplicated");
    }
    paths.add(path);
    if (!SHA256.test(entry.sha256 ?? "") || !["active", "retired"].includes(entry.status)
        || typeof entry.owner !== "string" || entry.owner.trim() === ""
        || !["node:test", "vitest"].includes(entry.runner)
        || entry.command !== (entry.runner === "node:test"
          ? `node --test --test-reporter=tap ${path}`
          : `npx vitest run ${path} --reporter=json`)
        || !Array.isArray(entry.registered_test_ids) || entry.registered_test_ids.length === 0) {
      throw new Error(`test registry target identity is invalid: ${path}`);
    }
    for (const id of entry.registered_test_ids) {
      if (typeof id !== "string" || !id.startsWith(`${path} > `)
          || id.slice(path.length + 3).trim() === "" || allIds.has(id)) {
        throw new Error(`duplicate registered test identity or invalid leaf: ${id}`);
      }
      allIds.add(id);
    }
    const file = resolve(root, path);
    if (realpathSync(file) !== file || !statSync(file).isFile()) {
      throw new Error(`test registry target is not a regular worktree file: ${path}`);
    }
    if (hash(readFileSync(file)) !== entry.sha256) throw new Error(`test registry source hash drift: ${path}`);
  }
  return Object.freeze({ status: "recorded", revision: value.revision,
    registry_ref: REGISTRY_REF, registry_sha256: hash(raw), outside_scope: "unknown",
    targets: Object.freeze(value.targets.map((entry) => Object.freeze({ ...entry,
      registered_test_ids: Object.freeze([...entry.registered_test_ids]) }))) });
}

/** Compare one canonical reporter output with the independently owned registry. */
export function collectRegisteredTestInventory({ task, workspace, receipt } = {}) {
  const registry = readCurrentTestAssetRegistry({ task, workspace });
  const target = registry.targets.find((entry) => entry.status === "active" && entry.command === receipt?.command);
  if (!target) throw new Error("unregistered test command");
  const observed = collectTestInventory({ task, workspace, receipt,
    registeredTestIds: target.registered_test_ids });
  if (hash(readFileSync(resolve(workspace.worktreeRoot, REGISTRY_REF))) !== registry.registry_sha256) {
    throw new Error("test registry changed during reporter comparison");
  }
  const nonpassing = observed.tests.filter((entry) => entry.status !== "passed");
  const reason = observed.missing.length || observed.unmatched.length ? "registry_reporter_leaf_mismatch"
    : observed.skipped.length ? "skipped_test_leaf"
      : nonpassing.length || observed.exit_code !== 0 ? "nonpassing_test_leaf" : null;
  return Object.freeze({ ...observed, status: reason === null ? "recorded" : "inconsistent",
    ...(reason === null ? {} : { reason }), registry_ref: registry.registry_ref,
    registry_revision: registry.revision, registry_sha256: registry.registry_sha256,
    target: target.path });
}
