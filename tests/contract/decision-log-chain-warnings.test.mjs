import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { checkDecisionLogChain } from "../../tools/cli/check-decision-log-chain.mjs";

const ROOT = [
  "### D-001",
  "module: review",
  "requirement_ids: [R-001]",
  "derived_from: []",
  "artifacts: [spec.md#FR-001]",
  "### D-002",
  "module: delivery",
  "requirement_ids: [R-002]",
  "derived_from: [D-001]",
  "artifacts: [plan.md#T001]",
].join("\n");

function run(markdown) {
  return checkDecisionLogChain({ markdown, source_ref: "fixture/decision-log.md" });
}

describe("decision-log chain warnings are observable but non-blocking", () => {
  it("warns when a chain field is missing and returns exit code 0", () => {
    const result = run(ROOT.replace("module: review\n", ""));
    expect(result.exit_code).toBe(0);
    expect(result.failures).toEqual([]);
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "missing_chain_field", field: "module", decision_id: "D-001" }),
    ]));
  });

  it("warns on an illegal chain-field value without entering failures", () => {
    const result = run(ROOT.replace("requirement_ids: [R-001]", "requirement_ids: [bad-id]"));
    expect(result.exit_code).toBe(0);
    expect(result.failures).toEqual([]);
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "invalid_chain_field", field: "requirement_ids", decision_id: "D-001" }),
    ]));
  });

  it("warns when derived_from points to a decision that does not exist", () => {
    const result = run(ROOT.replace("derived_from: [D-001]", "derived_from: [D-999]"));
    expect(result.exit_code).toBe(0);
    expect(result.failures).toEqual([]);
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "missing_decision_reference", field: "derived_from", decision_id: "D-002" }),
    ]));
  });

  it("ignores fenced decision examples", () => {
    const result = run("```text\n### D-999\nmodule: example\n```\n" + ROOT);
    expect(result.warnings.some(({ decision_id }) => decision_id === "D-999")).toBe(false);
  });

  it("keeps the run-checks registration advisory even if the checker reports failure", () => {
    const result = spawnSync(process.execPath, [join(process.cwd(), "tools/cli/run-checks.mjs")], {
      encoding: "utf8",
      env: { ...process.env, RUN_CHECKS_FORCE_FAIL_CHECKER: "check-decision-log-chain" },
    });
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(result.stdout + result.stderr).toContain("advisory failed");
    expect(result.stdout + result.stderr).toContain("ALL CHECKS PASSED");
  });
});
