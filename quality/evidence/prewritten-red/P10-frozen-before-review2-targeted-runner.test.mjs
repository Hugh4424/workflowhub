// Frozen P10 test-only target. Previous bytes and RED archived as P10-frozen-before-metamorphic-*.
import { afterEach, describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runTargetedCases } from "../../workflows/build-code/targeted-runner.mjs";

const roots = [];
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
function fixture(label) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p10-runner-")));
  roots.push(root);
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.name", "Runner fixture");
  git(root, "config", "user.email", "runner@example.test");
  mkdirSync(join(root, "tests"));
  const token = `${label}-${randomUUID()}`;
  const v = { root, caseId: `CASE-${token}`, target: `tests/effect-${token}.test.mjs`,
    fullId: `business effect changes ${token}`, marker: `child-ran-${token}.marker` };
  writeFileSync(join(root, v.target), [
    'import { test } from "node:test";',
    'import { readFileSync, writeFileSync } from "node:fs";',
    'import { strict as assert } from "node:assert";',
    `test(${JSON.stringify(v.fullId)}, () => { writeFileSync(${JSON.stringify(v.marker)}, "executed\\n"); assert.equal(readFileSync("effect.txt", "utf8"), "new\\n"); });`,
    "",
  ].join("\n"));
  writeFileSync(join(root, "effect.txt"), "new\n");
  git(root, "add", "."); git(root, "commit", "-qm", "runner target and observable effect");
  return v;
}
const selection = (v, overrides = {}) => ({ status: "selected", cases: [{ id: overrides.id ?? v.caseId,
  execution: { target: overrides.target ?? v.target, expected_test_identity: overrides.fullId ?? v.fullId, runner: "node:test" },
}] });
const run = (v, selected = selection(v)) => runTargetedCases({ selection: selected, workspaceRoot: v.root,
  runner: { executable: process.execPath, fixedArgs: ["--test", "--test-reporter=tap"] },
});
function rejectsFor(result, reason) {
  expect(result.status).not.toBe("completed");
  expect(result.reason, "blanket unavailable/not_implemented cannot satisfy a specific rejection").toBe(reason);
  expect((result.observations ?? []).some(({ status }) => status === "passed")).toBe(false);
}

describe("ORACLE-P10-TARGETED-RUNNER-IDENTITY: safe actual execution", () => {
  it.each(["alpha", "beta"])("executes dynamic %s child with real TAP, identity and side effect", async (label) => {
    const v = fixture(label);
    const result = await run(v);
    expect(result.status, "an unavailable stub is not execution").toBe("completed");
    expect(result.observations).toEqual(expect.arrayContaining([
      expect.objectContaining({ case_id: v.caseId, full_id: v.fullId, status: "passed" }),
    ]));
    expect(result.execution?.raw_output).toContain("TAP version 13");
    expect(result.execution?.raw_output).toContain(`# Subtest: ${v.fullId}`);
    expect(result.execution?.raw_output).toContain(`# pass 1`);
    expect(result.execution?.raw_output).toContain(`# fail 0`);
    expect(result.execution?.exit_code).toBe(0);
    expect(readFileSync(join(v.root, v.marker), "utf8")).toBe("executed\n");
    // Distinct from trusting the runner result: independently execute this target
    // in a fresh child and corroborate its TAP identity, exit and observable file.
    rmSync(join(v.root, v.marker));
    const child = spawnSync(process.execPath, ["--test", "--test-reporter=tap", v.target],
      { cwd: v.root, encoding: "utf8", shell: false });
    if (child.error) throw child.error;
    expect(child.status).toBe(0);
    expect(child.stdout).toContain(`ok 1 - ${v.fullId}`);
    expect(child.stdout).toContain("# pass 1");
    expect(child.stdout).toContain("# fail 0");
    expect(readFileSync(join(v.root, v.marker), "utf8")).toBe("executed\n");
  });
  it("identifies duplicate selected case IDs", async () => {
    const v = fixture("duplicate"), selected = selection(v);
    rejectsFor(await run(v, { ...selected, cases: [selected.cases[0], selected.cases[0]] }), "duplicate_case_id");
  });
  it("identifies a missing target", async () => {
    const v = fixture("missing");
    rejectsFor(await run(v, selection(v, { target: "tests/missing.test.mjs" })), "missing_target");
  });
  it.each(["../outside.test.mjs", "tests/effect.test.mjs; touch pwned", "tests/$(touch pwned).test.mjs"])(
    "identifies an unsafe target and does not interpolate: %s", async (target) => {
      const v = fixture("unsafe");
      const result = await run(v, selection(v, { target }));
      expect(existsSync(join(v.root, "pwned"))).toBe(false);
      expect(existsSync(join(v.root, v.marker))).toBe(false);
      rejectsFor(result, "unsafe_target");
    },
  );
  it("identifies wrong reporter identity even when the child runs", async () => {
    const v = fixture("wrong");
    rejectsFor(await run(v, selection(v, { fullId: `other-${randomUUID()}` })), "reporter_identity_mismatch");
  });
  it("identifies an actually failed observable-effect test", async () => {
    const v = fixture("failed");
    writeFileSync(join(v.root, "effect.txt"), "charged\n");
    rejectsFor(await run(v), "test_failed");
  });
});
