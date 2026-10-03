import { closeSync, constants, fstatSync, lstatSync, openSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, resolve, sep } from "node:path";
import { inspectWorkspace } from "../../runtime/interface/workspace-check.mjs";

const NODE_TAP_COMMAND = /^node --test --test-reporter=tap ([A-Za-z0-9._/-]+\.test\.mjs)$/;
const VITEST_JSON_COMMAND = /^npx vitest run ([A-Za-z0-9._/-]+\.test\.mjs) --reporter=json$/;
const REGISTRY_REF = "docs/quality/test-asset-registry.json";
const TEST_TARGET = /^tests\/(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.test\.mjs$/;

function literalTarget(command, pattern) {
  const match = pattern.exec(command ?? "");
  if (!match) return null;
  const target = match[1];
  if (target.startsWith("/") || target.split("/").includes("..") || target.split("/").includes(".")) return null;
  return target;
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

/** Interpret original reporter text as facts; no receipt/source-snapshot authentication. */
export function collectTestInventory({ output, command, workspaceRoot, exitCode, registeredTestIds, outputRef = null } = {}) {
  if (typeof output !== "string" || !Number.isSafeInteger(exitCode)) throw new TypeError("original reporter text and actual exitCode are required");
  if (!Array.isArray(registeredTestIds) || registeredTestIds.some(id => typeof id !== "string" || !id.trim())
      || new Set(registeredTestIds).size !== registeredTestIds.length) throw new TypeError("registeredTestIds must be unique nonempty runnable IDs");
  const nodeTarget = literalTarget(command, NODE_TAP_COMMAND), vitestTarget = literalTarget(command, VITEST_JSON_COMMAND);
  if (nodeTarget === null && vitestTarget === null) return Object.freeze({ status: "unavailable", reason: "unsupported_runner_or_nonliteral_target", command, exit_code: exitCode, output_ref: outputRef });
  const tests = nodeTarget === null ? parseVitestJson(output, vitestTarget, workspaceRoot, exitCode) : parseNodeTap(output, nodeTarget);
  const registered = new Set(registeredTestIds), discovered = new Set(tests.map(entry => entry.full_id));
  return Object.freeze({ status: "recorded", canonical_receipt: false, runner: nodeTarget === null ? "vitest" : "node:test",
    runner_version: "unknown", command, exit_code: exitCode, output_ref: outputRef, tests,
    registered_test_ids: [...registeredTestIds], unmatched: tests.filter(entry => !registered.has(entry.full_id)).map(entry => entry.full_id),
    missing: registeredTestIds.filter(id => !discovered.has(id)), skipped: tests.filter(entry => entry.status === "skipped").map(entry => entry.full_id) });
}

function readWorktreeFile(root, ref) {
  const path = resolve(root, ref);
  if (!path.startsWith(`${root}${sep}`) || realpathSync(path) !== path) throw new Error("inventory source path contains an alias or leaves the worktree");
  const before = lstatSync(path);
  if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1) throw new Error("inventory source must be a single-link regular file");
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const opened = fstatSync(fd);
    if (opened.dev !== before.dev || opened.ino !== before.ino || opened.nlink !== 1) throw new Error("inventory source changed before reading");
    const bytes = readFileSync(fd), after = lstatSync(path), final = fstatSync(fd);
    if (after.dev !== opened.dev || after.ino !== opened.ino || after.nlink !== 1 || final.nlink !== 1 || realpathSync(path) !== path) throw new Error("inventory source changed while reading");
    return bytes;
  } finally { closeSync(fd); }
}

/** Read the finite ordinary registration; stored old hashes are passive data, never a permit. */
export async function readCurrentTestAssetRegistry({ workspace } = {}) {
  await inspectWorkspace({ root: workspace?.targetRepoRoot, target: workspace?.worktreeRoot, baseline: workspace?.baselineCommit,
    ...(workspace?.branch ? { expectBranch: workspace.branch } : {}) });
  const root = realpathSync(workspace.worktreeRoot), value = JSON.parse(readWorktreeFile(root, REGISTRY_REF));
  if (value?.schema !== "workflowhub-test-asset-registry.v1" || typeof value.revision !== "string" || !value.revision.trim()
      || !Array.isArray(value.targets) || value.targets.length === 0) throw new Error("ordinary test registry shape is invalid");
  const paths = new Set(), allIds = new Set();
  for (const entry of value.targets) {
    const path = entry?.path;
    if (typeof path !== "string" || !TEST_TARGET.test(path) || path.split("/").some(part => part === "." || part === "..") || paths.has(path)) throw new Error("test registry target path is unsafe or duplicated");
    paths.add(path);
    if (!["active", "retired"].includes(entry.status) || !["node:test", "vitest"].includes(entry.runner)
        || entry.command !== (entry.runner === "node:test" ? `node --test --test-reporter=tap ${path}` : `npx vitest run ${path} --reporter=json`)
        || !Array.isArray(entry.registered_test_ids) || entry.registered_test_ids.length === 0) throw new Error(`test registry target shape is invalid: ${path}`);
    for (const id of entry.registered_test_ids) {
      if (typeof id !== "string" || !id.startsWith(`${path} > `) || !id.slice(path.length + 3).trim() || allIds.has(id)) throw new Error(`duplicate or invalid registered test leaf: ${id}`);
      allIds.add(id);
    }
    readWorktreeFile(root, path);
  }
  return Object.freeze({ status: "recorded", revision: value.revision, registry_ref: REGISTRY_REF,
    outside_scope: "unknown", targets: Object.freeze(value.targets.map(entry => Object.freeze({ ...entry, registered_test_ids: Object.freeze([...entry.registered_test_ids]) }))) });
}

/** Compare one observed original reporter with finite registration; never complete a phase. */
export async function collectRegisteredTestInventory({ workspace, output, command, exitCode, outputRef } = {}) {
  const registry = await readCurrentTestAssetRegistry({ workspace });
  const target = registry.targets.find(entry => entry.status === "active" && entry.command === command);
  if (!target) throw new Error("reporter command is not in the finite active test registry");
  const observed = collectTestInventory({ output, command, workspaceRoot: workspace.worktreeRoot, exitCode, outputRef, registeredTestIds: target.registered_test_ids });
  const reason = observed.missing.length || observed.unmatched.length ? "registry_reporter_leaf_mismatch"
    : observed.skipped.length ? "skipped_test_leaf" : observed.tests.some(entry => entry.status !== "passed") || exitCode !== 0 ? "nonpassing_test_leaf" : null;
  return Object.freeze({ ...observed, status: reason === null ? "recorded" : "inconsistent", ...(reason === null ? {} : { reason }),
    registry_ref: registry.registry_ref, registry_revision: registry.revision, target: target.path });
}
