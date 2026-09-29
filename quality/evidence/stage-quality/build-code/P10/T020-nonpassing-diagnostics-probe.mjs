import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runTargetedCases } from "../../../../../workflows/build-code/targeted-runner.mjs";

const mode = process.argv[2];
if (mode !== "red" && mode !== "green") throw new Error("expected red or green evidence mode");
const evidenceDir = import.meta.dirname;
const root = mkdtempSync(join(evidenceDir, "T020-diagnostic-fixture-"));
const hash = (value) => createHash("sha256").update(value).digest("hex");
const runner = { executable: process.execPath, fixedArgs: ["--test", "--test-reporter=tap"] };
const cases = [
  { name: "node_pass", kind: "node", body: 'test("item", () => {});', status: "passed", positive: true },
  { name: "vitest_pass", kind: "vitest", body: 'describe("suite", () => it("item", () => expect(1).toBe(1)));', status: "passed", positive: true },
  { name: "node_skip", kind: "node", body: 'test("item", { skip: true }, () => {});', status: "skipped" },
  { name: "node_todo", kind: "node", body: 'test("item", { todo: true }, () => {});', status: "todo" },
  { name: "node_failed", kind: "node", body: 'test("item", () => assert.fail("intentional failure"));', status: "failed" },
  { name: "vitest_skip", kind: "vitest", body: 'describe("suite", () => it.skip("item", () => {}));', status: "skipped" },
  { name: "vitest_todo", kind: "vitest", body: 'describe("suite", () => it.todo("item"));', status: "todo" },
  { name: "vitest_failed", kind: "vitest", body: 'describe("suite", () => it("item", () => expect(1).toBe(2)));', status: "failed" },
  { name: "vitest_mixed", kind: "vitest", body: 'describe("suite", () => { it("item", () => expect(1).toBe(1)); it.skip("other", () => {}); });',
    statuses: ["passed", "skipped"], titles: ["item", "other"] },
  { name: "node_wrong_identity", kind: "node", body: 'test("item", () => {});', invalid: true },
  { name: "node_zero", kind: "node", body: '// no runnable test', invalid: true },
  { name: "vitest_wrong_identity", kind: "vitest", body: 'describe("suite", () => it("item", () => {}));', invalid: true },
  { name: "vitest_zero", kind: "vitest", body: 'describe("suite", () => {});', invalid: true },
];
const results = [];
try {
  mkdirSync(join(root, "tests"));
  for (const item of cases) {
    const target = `tests/${item.name.replaceAll("_", "-")}.test.mjs`;
    const fullId = item.kind === "vitest" ? `${target} > suite > item` : "item";
    const source = item.kind === "vitest"
      ? `import { describe, expect, it } from "vitest";\n${item.body}\n`
      : `import { test } from "node:test";\nimport assert from "node:assert/strict";\n${item.body}\n`;
    writeFileSync(join(root, target), source);
    const execution = item.kind === "vitest"
      ? { target, expected_test_identity: "suite",
        machine_command: `npx vitest run ${target} --reporter=json`,
        registered_test_ids: item.titles?.map((title) => `${target} > suite > ${title}`)
          ?? [item.invalid && item.name.includes("wrong") ? `${target} > suite > other` : fullId] }
      : { target, expected_test_identity: item.invalid && item.name.includes("wrong") ? "other" : fullId,
        runner: "node:test" };
    const result = await runTargetedCases({
      selection: { status: "selected", cases: [{ id: item.name, execution }] },
      workspaceRoot: root, runner,
    });
    const raw = result.execution?.raw_output ?? "";
    writeFileSync(join(evidenceDir, `T020-nonpassing-${mode}-${item.name}.report.txt`), raw);
    results.push({ name: item.name, expected_statuses: item.statuses ?? (item.status ? [item.status] : []),
      positive: item.positive ?? false,
      status: result.status, reason: result.reason ?? null,
      accepted_count: result.observations?.length ?? 0,
      accepted_observations: result.observations ?? [],
      diagnostic_observations: result.diagnostic_observations ?? [],
      exit_code: result.execution?.exit_code ?? null,
      raw_report_sha256: hash(raw), canonical_receipt: result.execution?.canonical_receipt ?? null });
  }
} finally { rmSync(root, { recursive: true, force: true }); }
for (const row of results) console.log(JSON.stringify(row));
const valid = results.every((row) => {
  if (row.positive) return row.status === "completed" && row.accepted_count === 1
    && row.accepted_observations[0]?.status === "passed"
    && row.accepted_observations[0]?.raw_report_sha256 === row.raw_report_sha256
    && row.diagnostic_observations.length === 0;
  if (row.status !== "unavailable" || row.accepted_count !== 0) return false;
  if (row.expected_statuses.length) return row.reason === "test_failed"
    && row.diagnostic_observations.length === row.expected_statuses.length
    && row.expected_statuses.every((status) => row.diagnostic_observations.some((entry) => entry.full_id
      && entry.status === status && entry.raw_report_sha256 === row.raw_report_sha256
      && entry.exit_code === row.exit_code && entry.canonical_receipt === false));
  return row.diagnostic_observations.length === 0;
});
if (!valid) process.exitCode = 1;
