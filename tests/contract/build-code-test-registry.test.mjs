import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { bootstrapTask } from "../../tools/cli/task-bootstrap.mjs";
import { openTask } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { runCapture } from "../../workflows/build-code/capture.mjs";
import * as inventorySource from "../../workflows/build-code/test-asset-inventory.mjs";

const roots = [];
const hash = (value) => createHash("sha256").update(value).digest("hex");
const git = (cwd, ...args) => execFileSync("git", args, {
  cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
}).trim();
const target = "tests/registered.test.mjs";
const command = `node --test --test-reporter=tap ${target}`;
const firstId = `${target} > registered leaf`;
const secondId = `${target} > second leaf`;

function registryFor(source, ids = [firstId, secondId]) {
  return {
    schema: "workflowhub-test-asset-registry.v1", revision: "fixture-1",
    owner: "fixture test asset owner", outside_scope: "unknown",
    retirement_policy: "Retire only with a reviewed replacement and prior identities preserved.",
    targets: [{ path: target, sha256: hash(source), runner: "node:test", command,
      owner: "fixture test asset owner", status: "active", registered_test_ids: ids }],
  };
}

function fixture({ names = ["registered leaf", "second leaf"], ids, skipSecond = false } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p9-test-registry-")));
  roots.push(root);
  const repo = join(root, "repo"), storage = join(root, "storage"), home = join(root, "home");
  mkdirSync(repo); mkdirSync(storage); mkdirSync(home);
  git(repo, "init", "-q", "-b", "main");
  git(repo, "config", "user.name", "Registry fixture");
  git(repo, "config", "user.email", "registry@example.test");
  mkdirSync(join(repo, "tests")); mkdirSync(join(repo, "docs", "quality"), { recursive: true });
  const source = ['import { test } from "node:test";', ...names.map((name, index) =>
    `test(${JSON.stringify(name)}, ${index === 1 && skipSecond ? "{ skip: true }, " : ""}() => {});`)].join("\n");
  writeFileSync(join(repo, target), `${source}\n`);
  writeFileSync(join(repo, "docs/quality/test-asset-registry.json"),
    `${JSON.stringify(registryFor(`${source}\n`, ids), null, 2)}\n`);
  git(repo, "add", "."); git(repo, "commit", "-qm", "before task starts");
  const bootstrapped = bootstrapTask({ project: "Registry", task: "p9-registry", "target-repo": repo }, {
    env: { HOME: home, WORKFLOWHUB_TASK_DIR: storage }, home, cwd: repo,
  });
  const task = openTask(bootstrapped.task_path, "Registry", "p9-registry");
  return { root, repo, task, worktree: bootstrapped.workspace.worktree_root,
    workspace: openCurrentTaskWorkspace(task) };
}

function readRegistry(state) {
  expect(inventorySource.readCurrentTestAssetRegistry,
    "ORACLE-P9-REGISTRY: independent Task-bound registry reader must exist").toBeTypeOf("function");
  return inventorySource.readCurrentTestAssetRegistry({ task: state.task, workspace: state.workspace });
}

function collectFromRegistry(state, receipt) {
  expect(inventorySource.collectRegisteredTestInventory,
    "ORACLE-P9-REGISTRY: canonical reporter must be checked against the independent registry").toBeTypeOf("function");
  return inventorySource.collectRegisteredTestInventory({ task: state.task,
    workspace: state.workspace, receipt });
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("ORACLE-P9-REGISTRY: source-owned tests versus actual runnable leaves", () => {
  it("registers five real repository targets while preserving the original three inventories", () => {
    const path = resolve("docs/quality/test-asset-registry.json");
    expect(existsSync(path), "the independent test registry is missing").toBe(true);
    const registry = JSON.parse(readFileSync(path, "utf8"));
    // Fixed expectations came from preserved independent runner reports. The
    // renamed A2 leaf is a candidate expectation until its final runner report.
    const expectedIds =
    {
      "tests/contract/decision-log-census.test.mjs": [
        "tests/contract/decision-log-census.test.mjs > decision-log 原始来源普查：分母非零（T009 gate） > 普查状态是 present（材料存在且被识别）",
        "tests/contract/decision-log-census.test.mjs > decision-log 原始来源普查：分母非零（T009 gate） > 普查 errors 为空数组",
        "tests/contract/decision-log-census.test.mjs > decision-log 原始来源普查：分母非零（T009 gate） > 原始来源 entries / source_units 分母非零（>= 8）",
        "tests/contract/decision-log-census.test.mjs > decision-log 原始来源普查：分母非零（T009 gate） > 原始需求索引覆盖 R-001..R-008",
        "tests/contract/decision-log-census.test.mjs > decision-log 原始来源普查：分母非零（T009 gate） > 逐字 U 层至少 3 节，且逐字声明层至少 1 条「用户」V 行",
        "tests/contract/decision-log-census.test.mjs > decision-log 原始来源普查：分母非零（T009 gate） > 负控：删掉「## 逐字声明层（verbatim）」整节后普查必须报错"
      ],
      "tests/contract/acceptance-result-machine-classes.test.mjs": [
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > A. 共享校验器接受 8 值（runtime/evidence/acceptance-evidence-validator.mjs） > accepts acceptance result pass and returns a frozen value",
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > A. 共享校验器接受 8 值（runtime/evidence/acceptance-evidence-validator.mjs） > accepts acceptance result fail and returns a frozen value",
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > A. 共享校验器接受 8 值（runtime/evidence/acceptance-evidence-validator.mjs） > accepts acceptance result inconclusive and returns a frozen value",
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > A. 共享校验器接受 8 值（runtime/evidence/acceptance-evidence-validator.mjs） > accepts acceptance result deferred and returns a frozen value",
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > A. 共享校验器接受 8 值（runtime/evidence/acceptance-evidence-validator.mjs） > accepts acceptance result missing and returns a frozen value",
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > A. 共享校验器接受 8 值（runtime/evidence/acceptance-evidence-validator.mjs） > accepts acceptance result inconsistent and returns a frozen value",
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > A. 共享校验器接受 8 值（runtime/evidence/acceptance-evidence-validator.mjs） > accepts acceptance result incomplete and returns a frozen value",
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > A. 共享校验器接受 8 值（runtime/evidence/acceptance-evidence-validator.mjs） > accepts acceptance result unavailable and returns a frozen value",
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > A. 共享校验器接受 8 值（runtime/evidence/acceptance-evidence-validator.mjs） > rejects an unknown result with a message that names every allowed result",
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > B. quality-store 不得把机器判定类当成 passed（runtime/evidence/quality-store.mjs） > keeps machine class missing incomplete instead of passed",
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > B. quality-store 不得把机器判定类当成 passed（runtime/evidence/quality-store.mjs） > keeps machine class inconsistent incomplete instead of passed",
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > B. quality-store 不得把机器判定类当成 passed（runtime/evidence/quality-store.mjs） > keeps machine class incomplete incomplete instead of passed",
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > B. quality-store 不得把机器判定类当成 passed（runtime/evidence/quality-store.mjs） > keeps machine class unavailable incomplete instead of passed",
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > B. quality-store 不得把机器判定类当成 passed（runtime/evidence/quality-store.mjs） > keeps the terminal result pass as passed",
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > B. quality-store 不得把机器判定类当成 passed（runtime/evidence/quality-store.mjs） > keeps the terminal result fail as failed",
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > C. 非终态不得被当通过（runtime/evidence/freshness.mjs:297-306 经 :713 真实生效） > authenticates a missing quality fact bound to nonterminal result inconclusive",
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > C. 非终态不得被当通过（runtime/evidence/freshness.mjs:297-306 经 :713 真实生效） > authenticates a missing quality fact bound to nonterminal result deferred",
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > C. 非终态不得被当通过（runtime/evidence/freshness.mjs:297-306 经 :713 真实生效） > authenticates a missing quality fact bound to nonterminal result missing",
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > C. 非终态不得被当通过（runtime/evidence/freshness.mjs:297-306 经 :713 真实生效） > authenticates a missing quality fact bound to nonterminal result inconsistent",
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > C. 非终态不得被当通过（runtime/evidence/freshness.mjs:297-306 经 :713 真实生效） > authenticates a missing quality fact bound to nonterminal result incomplete",
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > C. 非终态不得被当通过（runtime/evidence/freshness.mjs:297-306 经 :713 真实生效） > authenticates a missing quality fact bound to nonterminal result unavailable",
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > C. 非终态不得被当通过（runtime/evidence/freshness.mjs:297-306 经 :713 真实生效） > still authenticates a passed fact bound to its own terminal result pass",
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > C. 非终态不得被当通过（runtime/evidence/freshness.mjs:297-306 经 :713 真实生效） > still authenticates a failed fact bound to its own terminal result fail",
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > C. 非终态不得被当通过（runtime/evidence/freshness.mjs:297-306 经 :713 真实生效） > never authenticates a missing quality fact bound to terminal result pass",
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > C. 非终态不得被当通过（runtime/evidence/freshness.mjs:297-306 经 :713 真实生效） > never authenticates a missing quality fact bound to terminal result fail",
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > D. core/task-close.mjs 侧口径：只用共享校验器，不得自建 result 白名单 > imports the shared acceptance evidence validator instead of owning the enum",
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > D. core/task-close.mjs 侧口径：只用共享校验器，不得自建 result 白名单 > carries no local acceptance result whitelist",
        "tests/contract/acceptance-result-machine-classes.test.mjs > acceptance result enum — D-004 machine verdict classes > D. core/task-close.mjs 侧口径：只用共享校验器，不得自建 result 白名单 > compares acceptance.result only against pass and treats every other value as missing"
      ],
      "tests/deferred-acceptance-semantics.test.mjs": [
        "tests/deferred-acceptance-semantics.test.mjs > deferred acceptance semantics > maps subject status passed to pass without a catch-all failure",
        "tests/deferred-acceptance-semantics.test.mjs > deferred acceptance semantics > maps subject status failed to fail without a catch-all failure",
        "tests/deferred-acceptance-semantics.test.mjs > deferred acceptance semantics > maps subject status inconclusive to inconclusive without a catch-all failure",
        "tests/deferred-acceptance-semantics.test.mjs > deferred acceptance semantics > maps subject status deferred to deferred without a catch-all failure",
        "tests/deferred-acceptance-semantics.test.mjs > deferred acceptance semantics > maps subject status missing to deferred without a catch-all failure",
        "tests/deferred-acceptance-semantics.test.mjs > deferred acceptance semantics > rejects an unlisted subject status instead of silently writing fail",
        "tests/deferred-acceptance-semantics.test.mjs > deferred acceptance semantics > keeps verify-code evidence result pass as passed",
        "tests/deferred-acceptance-semantics.test.mjs > deferred acceptance semantics > keeps verify-code evidence result fail as failed",
        "tests/deferred-acceptance-semantics.test.mjs > deferred acceptance semantics > keeps verify-code evidence result inconclusive as inconclusive",
        "tests/deferred-acceptance-semantics.test.mjs > deferred acceptance semantics > keeps verify-code evidence result deferred as deferred",
        "tests/deferred-acceptance-semantics.test.mjs > deferred acceptance semantics > rejects an unlisted evidence result instead of treating it as failed",
        "tests/deferred-acceptance-semantics.test.mjs > deferred acceptance semantics > keeps inconclusive incomplete in quality-store verification",
        "tests/deferred-acceptance-semantics.test.mjs > deferred acceptance semantics > keeps deferred incomplete in quality-store verification",
        "tests/deferred-acceptance-semantics.test.mjs > deferred acceptance semantics > authenticates a missing quality fact bound to inconclusive",
        "tests/deferred-acceptance-semantics.test.mjs > deferred acceptance semantics > authenticates a missing quality fact bound to deferred"
      ],
      "tests/contract/build-code-preexecution-source.test.mjs": [
        "tests/contract/build-code-preexecution-source.test.mjs > ORACLE-P9-PREEXECUTION: current change source before test capture > finds committed product changes in a clean worktree without changing Task store bytes",
        "tests/contract/build-code-preexecution-source.test.mjs > ORACLE-P9-PREEXECUTION: current change source before test capture > reads the authenticated task start and committed, dirty, staged, untracked, rename and delete paths before a receipt",
        "tests/contract/build-code-preexecution-source.test.mjs > ORACLE-P9-PREEXECUTION: current change source before test capture > does not accept another task's workspace",
        "tests/contract/build-code-preexecution-source.test.mjs > ORACLE-P9-PREEXECUTION: current change source before test capture > does not invent a task start when the authenticated bootstrap record is missing",
        "tests/contract/build-code-preexecution-source.test.mjs > ORACLE-P9-PREEXECUTION: current change source before test capture > rejects an existing bootstrap record with a changed hash",
        "tests/contract/build-code-preexecution-source.test.mjs > ORACLE-P9-PREEXECUTION: current change source before test capture > rejects an existing bootstrap record with a changed workspace_binding",
        "tests/contract/build-code-preexecution-source.test.mjs > ORACLE-P9-PREEXECUTION: current change source before test capture > re-reads changed source bytes rather than reusing an earlier candidate snapshot"
      ],
      "tests/contract/build-code-test-registry.test.mjs": [
        "tests/contract/build-code-test-registry.test.mjs > ORACLE-P9-REGISTRY: source-owned tests versus actual runnable leaves > registers five real repository targets while preserving the original three inventories",
        "tests/contract/build-code-test-registry.test.mjs > ORACLE-P9-REGISTRY: source-owned tests versus actual runnable leaves > reads an authenticated private registry and accepts exactly the two passing Node TAP leaves",
        "tests/contract/build-code-test-registry.test.mjs > ORACLE-P9-REGISTRY: source-owned tests versus actual runnable leaves > reports missing leaves instead of certifying the reporter",
        "tests/contract/build-code-test-registry.test.mjs > ORACLE-P9-REGISTRY: source-owned tests versus actual runnable leaves > reports extra leaves instead of certifying the reporter",
        "tests/contract/build-code-test-registry.test.mjs > ORACLE-P9-REGISTRY: source-owned tests versus actual runnable leaves > reports skipped leaves instead of certifying the reporter",
        "tests/contract/build-code-test-registry.test.mjs > ORACLE-P9-REGISTRY: source-owned tests versus actual runnable leaves > rejects duplicate registered identities before testing",
        "tests/contract/build-code-test-registry.test.mjs > ORACLE-P9-REGISTRY: source-owned tests versus actual runnable leaves > rejects a receipt command for a file outside the registered target",
        "tests/contract/build-code-test-registry.test.mjs > ORACLE-P9-REGISTRY: source-owned tests versus actual runnable leaves > rejects source drift even if the old registry still lists a runnable name"
      ]
    };
    const expected = Object.keys(expectedIds);
    expect(registry.schema).toBe("workflowhub-test-asset-registry.v1");
    expect(registry.outside_scope).toBe("unknown");
    expect(registry.targets.map((entry) => entry.path).sort()).toEqual(expected.sort());
    expect(new Set(registry.targets.map((entry) => entry.path)).size).toBe(5);
    expect(registry.targets.map((entry) => entry.registered_test_ids.length).sort((a, b) => a - b)).toEqual([6, 7, 8, 15, 28]);
    for (const entry of registry.targets) {
      expect(entry.sha256).toBe(hash(readFileSync(entry.path)));
      expect(entry.command).toBe(`npx vitest run ${entry.path} --reporter=json`);
      expect(entry.status).toBe("active");
      expect(entry.owner.trim()).not.toBe("");
      expect(new Set(entry.registered_test_ids).size).toBe(entry.registered_test_ids.length);
      expect(entry.registered_test_ids.every((id) => id.startsWith(`${entry.path} > `))).toBe(true);
      expect(entry.registered_test_ids).toEqual(expectedIds[entry.path]);
    }
  });

  it("reads an authenticated private registry and accepts exactly the two passing Node TAP leaves", async () => {
    const state = fixture();
    const registry = readRegistry(state);
    expect(registry).toMatchObject({ status: "recorded", revision: "fixture-1",
      registry_sha256: hash(readFileSync(join(state.worktree, "docs/quality/test-asset-registry.json"))) });
    const receipt = await runCapture(command, "quality/tests/registry-positive.json", {
      task: state.task, workspace: state.workspace,
    });
    const observed = collectFromRegistry(state, receipt);
    expect(observed).toMatchObject({ status: "recorded", registry_revision: "fixture-1",
      receipt_ref: receipt.receipt_ref, snapshot_tree: receipt.snapshot_tree,
      tests: [{ full_id: firstId, status: "passed" }, { full_id: secondId, status: "passed" }],
      missing: [], unmatched: [], skipped: [] });
    expect(JSON.parse(state.task.readRecord(receipt.receipt_ref))).not.toHaveProperty("test_inventory");
  });

  it.each([
    ["missing", [firstId, secondId], ["registered leaf"], false],
    ["extra", [firstId], ["registered leaf", "second leaf"], false],
    ["skipped", [firstId, secondId], ["registered leaf", "second leaf"], true],
  ])("reports %s leaves instead of certifying the reporter", async (kind, ids, names, skipSecond) => {
    const state = fixture({ ids, names, skipSecond });
    const receipt = await runCapture(command, `quality/tests/registry-${kind}.json`, {
      task: state.task, workspace: state.workspace,
    });
    const observed = collectFromRegistry(state, receipt);
    expect(observed.status).toBe("inconsistent");
    expect(observed.reason).toBe(kind === "skipped" ? "skipped_test_leaf" : "registry_reporter_leaf_mismatch");
    if (kind === "missing") expect(observed.missing).toEqual([secondId]);
    if (kind === "extra") expect(observed.unmatched).toEqual([secondId]);
    if (kind === "skipped") expect(observed.skipped).toContain(secondId);
  });

  it("rejects duplicate registered identities before testing", () => {
    const state = fixture({ ids: [firstId, firstId] });
    expect(() => readRegistry(state)).toThrow(/duplicate registered test identity/);
  });

  it("rejects a receipt command for a file outside the registered target", async () => {
    const state = fixture();
    const other = "tests/other.test.mjs";
    writeFileSync(join(state.worktree, other), 'import { test } from "node:test"; test("other", () => {});\n');
    const receipt = await runCapture(`node --test --test-reporter=tap ${other}`,
      "quality/tests/registry-wrong-file.json", { task: state.task, workspace: state.workspace });
    expect(() => collectFromRegistry(state, receipt)).toThrow(/unregistered test command/);
  });

  it("rejects source drift even if the old registry still lists a runnable name", () => {
    const state = fixture();
    writeFileSync(join(state.worktree, target), 'import { test } from "node:test"; test("registered leaf", () => {});\n');
    expect(() => readRegistry(state)).toThrow(/source hash drift/);
  });
});
