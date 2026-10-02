/** Native integration coverage for the retained checker aggregation. */
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, test, expect } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const runChecks = resolve(repoRoot, "tools/cli/run-checks.mjs");

function run(args = [], forceFailChecker) {
  const env = { ...process.env };
  delete env.RUN_CHECKS_FORCE_FAIL_CHECKER;
  if (forceFailChecker) env.RUN_CHECKS_FORCE_FAIL_CHECKER = forceFailChecker;
  const result = spawnSync(process.execPath, [runChecks, ...args], {
    cwd: repoRoot, encoding: "utf8", env, timeout: 30_000,
  });
  return { status: result.status, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

describe("retained native checker aggregation", () => {
  let normal;
  let failed;
  let advisory;
  beforeAll(() => {
    normal = run();
    failed = run([], "check-anti-host");
    advisory = run([], "check-decision-log-chain");
  });

  test("executes retained checkers and succeeds without retired checker registrations", () => {
    expect(normal.status, normal.output).toBe(0);
    for (const name of ["check-anti-host", "check-stage-quality", "check-decision-log-chain"]) {
      expect(normal.output).toContain(`[run-checks] running ${name}`);
    }
    expect(normal.output).not.toMatch(/\[run-checks\] running check-(?:contract|extensibility|metrics-schema|task-record-paths)\b/);
    expect(normal.output).toContain("ALL CHECKS PASSED");
  });

  test("propagates a blocking checker failure as exit 1 and names the actual failure", () => {
    expect(failed.status, failed.output).toBe(1);
    expect(failed.output).toContain("FAILED: check-anti-host (exit 1)");
    expect(failed.output).toContain("1 checker(s) failed — aggregated exit 1");
    expect(failed.output).not.toContain("ALL CHECKS PASSED");
  });

  test("reports an advisory failure while retaining exit 0", () => {
    expect(advisory.status, advisory.output).toBe(0);
    expect(advisory.output).toContain("check-decision-log-chain advisory failed (exit 1); not added to failures");
    expect(advisory.output).toContain("ALL CHECKS PASSED");
    expect(advisory.output).not.toContain("FAILED: check-decision-log-chain");
  });
});

describe("retired run-checks modes", () => {
  test.each(["--self-test", "--runtime-profile=phase"])("rejects %s rather than silently running an aggregate", (arg) => {
    const result = run([arg]);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain("unsupported arguments");
    expect(result.output).not.toContain("ALL CHECKS PASSED");
  });
});
