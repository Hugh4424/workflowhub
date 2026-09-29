// Revised frozen target: real P10 runner seam, not the legacy test-only accept().
// The archived original test and its RED remain immutable historical evidence.
import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runTargetedCases } from "../../workflows/build-code/targeted-runner.mjs";

const roots = [];
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p10-runner-")));
  roots.push(root);
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.name", "Runner fixture");
  git(root, "config", "user.email", "runner@example.test");
  mkdirSync(join(root, "tests"));
  writeFileSync(join(root, "tests", "effect.test.mjs"), [
    'import { test } from "node:test";',
    'import { readFileSync, writeFileSync } from "node:fs";',
    'import { strict as assert } from "node:assert";',
    'test("business effect changes", () => { writeFileSync("child-ran.marker", "executed\\n"); assert.equal(readFileSync("effect.txt", "utf8"), "new\\n"); });',
    "",
  ].join("\n"));
  writeFileSync(join(root, "effect.txt"), "new\n");
  git(root, "add", "."); git(root, "commit", "-qm", "runner target and observable effect");
  return root;
}

const selected = { status: "selected", cases: [{ id: "CASE-EFFECT", execution: {
  target: "tests/effect.test.mjs", expected_test_identity: "business effect changes", runner: "node:test",
} }] };
const run = (workspaceRoot, selection = selected) => runTargetedCases({ selection, workspaceRoot,
  runner: { executable: process.execPath, fixedArgs: ["--test", "--test-reporter=tap"] },
});

describe("ORACLE-P10-TARGETED-RUNNER-IDENTITY: safe actual execution", () => {
  it("executes one selected real Node test and reports its exact runner identity and raw result", async () => {
    const root = fixture();
    const result = await run(root);
    expect(result.status, "an unavailable stub is not an actual test execution").toBe("completed");
    expect(result.observations).toEqual(expect.arrayContaining([
      expect.objectContaining({ case_id: "CASE-EFFECT", full_id: "business effect changes", status: "passed" }),
    ]));
    expect(result.execution?.raw_output).toContain("TAP version 13");
    expect(existsSync(join(root, "child-ran.marker")), "P10 runner must actually launch the child").toBe(true);
  });

  it("does not turn duplicate case IDs into two proved executions", async () => {
    const result = await run(fixture(), { status: "selected", cases: [selected.cases[0], selected.cases[0]] });
    expect(result.status).not.toBe("completed");
  });

  it("cannot treat an absent target as a successful run", async () => {
    const result = await run(fixture(), { status: "selected", cases: [{ id: "CASE-MISSING", execution: {
      target: "tests/missing.test.mjs", expected_test_identity: "business effect changes", runner: "node:test",
    } }] });
    expect(result.status).not.toBe("completed");
  });

  it.each(["../outside.test.mjs", "tests/effect.test.mjs; touch pwned", "tests/$(touch pwned).test.mjs"])(
    "does not execute a target that escapes or interpolates shell syntax: %s", async (target) => {
      const root = fixture();
      const result = await run(root, { status: "selected", cases: [{ id: "CASE-ATTACK", execution: {
        target, expected_test_identity: "business effect changes", runner: "node:test",
      } }] });
      expect(result.status).not.toBe("completed");
      expect(existsSync(join(root, "pwned")), "dynamic target must not interpolate a shell side effect").toBe(false);
    },
  );

  it("does not count a wrong reporter identity as the selected test", async () => {
    const result = await run(fixture(), { status: "selected", cases: [{ id: "CASE-WRONG", execution: {
      target: "tests/effect.test.mjs", expected_test_identity: "different effect", runner: "node:test",
    } }] });
    expect(result.status).not.toBe("completed");
  });

  it("reports the actually failed observable-effect test as noncompleted", async () => {
    const root = fixture();
    writeFileSync(join(root, "effect.txt"), "charged\n");
    const result = await run(root);
    expect(result.status).not.toBe("completed");
  });
});
