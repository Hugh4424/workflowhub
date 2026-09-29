import { strict as assert } from "node:assert";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { selectAffectedCases } from "../../../../../workflows/build-code/case-selection.mjs";
import { runTargetedCases } from "../../../../../workflows/build-code/targeted-runner.mjs";

const root = mkdtempSync(join(tmpdir(), "p10-safe-probe-"));
try {
  const target = "tests/sample.test.mjs", full = `${target} > sample effect`;
  mkdirSync(join(root, "tests"));
  writeFileSync(join(root, target), 'import { test } from "node:test"; test("sample effect", () => {});\n');
  const changeScope = { status: "recorded", task_id: "t", start_commit: "a", snapshot_head: "b",
    snapshot_tree: "tree", source_digest: "digest", changed_paths: ["product.mjs"] };
  const catalog = { revision: "r", cases: [{ id: "c", status: "active", change_triggers: ["product.mjs"],
    related_case_ids: [], execution: { target, expected_test_identity: "sample effect" } }] };
  const inventory = { status: "recorded", task_id: "t", snapshot_tree: "tree", source_digest: "digest",
    command: `node --test --test-reporter=tap ${target}`, registered_test_ids: [full],
    tests: [{ full_id: full, status: "passed" }] };
  const selected = selectAffectedCases({ changeScope, catalog, inventory });
  assert.equal(selected.status, "selected");
  assert.equal(selected.provenance, "supplied_unverified");
  assert.equal(selectAffectedCases({ changeScope, catalog,
    inventory: { ...inventory, tests: [inventory.tests[0], inventory.tests[0]] } }).reason,
  "missing_inventory_identity");
  assert.equal(selectAffectedCases({ changeScope, catalog,
    inventory: { ...inventory, snapshot_tree: "wrong" } }).reason,
  "invalid_change_provenance");
  const runner = { executable: process.execPath, fixedArgs: ["--test", "--test-reporter=tap"] };
  const completed = await runTargetedCases({ selection: selected, workspaceRoot: root, runner });
  assert.equal(completed.status, "completed");
  assert.equal(completed.observations[0].full_id, "sample effect");
  const outside = join(root, "outside.test.mjs");
  writeFileSync(outside, 'import { test } from "node:test"; test("outside", () => {});\n');
  symlinkSync(outside, join(root, "tests", "link.test.mjs"));
  const escaped = await runTargetedCases({ selection: { status: "selected", cases: [{ id: "link",
    execution: { target: "tests/link.test.mjs", expected_test_identity: "outside" } }] },
  workspaceRoot: root, runner });
  assert.equal(escaped.reason, "unsafe_target");
  const invalidRunner = await runTargetedCases({ selection: selected, workspaceRoot: root,
    runner: { executable: "/missing/node", fixedArgs: runner.fixedArgs } });
  assert.equal(invalidRunner.reason, "unsafe_target");
  const injected = await runTargetedCases({ selection: { status: "selected", cases: [{ id: "injected",
    execution: { target: "tests/$(touch pwned).test.mjs", expected_test_identity: "sample effect" } }] },
  workspaceRoot: root, runner });
  assert.equal(injected.reason, "unsafe_target");
  assert.equal(readFileSync(join(root, target), "utf8").includes("sample effect"), true);
  console.log(JSON.stringify({ selection: selected.status, provenance: selected.provenance,
    duplicate_inventory: "rejected", stale_inventory: "rejected", execution: completed.status,
    symlink: escaped.reason, missing_executable: invalidRunner.reason, interpolation: injected.reason }));
} finally { rmSync(root, { recursive: true, force: true }); }
