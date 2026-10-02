/** Native integration coverage for the retained checker aggregation. */
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
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
    for (const name of ["check-anti-host", "check-metrics-schema", "check-stage-quality", "check-decision-log-chain"]) {
      expect(normal.output).toContain(`[run-checks] running ${name}`);
    }
    expect(normal.output).not.toMatch(/\[run-checks\] running check-(?:contract|extensibility|task-record-paths)\b/);
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

// Copy only the exact files consumed by the local metrics smoke. The normal
// aggregate tests above still execute the real anti-host/stage/advisory CLI.
function withMetricsFixture(change = () => {}) {
  const root = realpathSync(mkdtempSync(resolve(tmpdir(), "workflowhub-retained-metrics-")));
  try {
    const files = [
      "tools/cli/run-checks.mjs", "runtime/evidence/validate-contract.mjs",
      "metrics/record-schema.mjs", "metrics/execution-record.mjs", "metrics/knowledge-card.mjs",
      "contracts/execution-record.contract.json", "contracts/knowledge-card.contract.json",
    ];
    for (const file of files) {
      const destination = resolve(root, file);
      mkdirSync(dirname(destination), { recursive: true });
      copyFileSync(resolve(repoRoot, file), destination);
    }
    for (const name of ["check-anti-host", "check-stage-quality", "check-decision-log-chain"]) {
      writeFileSync(resolve(root, `tools/cli/${name}.mjs`), "process.exit(0);\n");
    }
    change(root);
    const env = { ...process.env };
    delete env.RUN_CHECKS_FORCE_FAIL_CHECKER;
    const result = spawnSync(process.execPath, [resolve(root, "tools/cli/run-checks.mjs")], {
      cwd: root, encoding: "utf8", env, timeout: 30_000,
    });
    return { status: result.status, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe("retained metrics smoke without retired CLI dependencies", () => {
  test("executes the original validators and contracts without a metrics checker CLI file", () => {
    const result = withMetricsFixture();
    expect(result.status, result.output).toBe(0);
    expect(result.output).toContain("[check-metrics-schema] PASS — retained validator and contract samples checked");
  });

  test("propagates a real contract type mismatch with the checker name", () => {
    const result = withMetricsFixture((root) => {
      const file = resolve(root, "contracts/execution-record.contract.json");
      const contract = JSON.parse(readFileSync(file, "utf8"));
      contract.required_fields.find(({ name }) => name === "execution_id").type = "number";
      writeFileSync(file, JSON.stringify(contract));
    });
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain("execution record contract: field execution_id: expected type number, got string");
    expect(result.output).toContain("FAILED: check-metrics-schema (exit 1)");
    expect(result.output).not.toContain("ALL CHECKS PASSED");
  });

  test("reports malformed contract bytes as an error rather than success", () => {
    const result = withMetricsFixture((root) => {
      writeFileSync(resolve(root, "contracts/knowledge-card.contract.json"), "{invalid JSON");
    });
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain("[check-metrics-schema] ERROR:");
    expect(result.output).toContain("FAILED: check-metrics-schema (exit 2)");
    expect(result.output).not.toContain("ALL CHECKS PASSED");
  });

  test("does not pass when a validator becomes blind to the existing invalid sample", () => {
    const result = withMetricsFixture((root) => {
      writeFileSync(resolve(root, "metrics/knowledge-card.mjs"), "export function validateKnowledgeCard() { return { valid: true, errors: [] }; }\n");
    });
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain("knowledge card: invalid sample was wrongly accepted");
    expect(result.output).toContain("FAILED: check-metrics-schema (exit 1)");
  });
});
