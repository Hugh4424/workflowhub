import { describe, expect, it } from "vitest";
import { accept } from "./acceptance-execution-producer.mjs";

const file = "tests/contract/business-effect.test.mjs";
const fullName = "payment cancellation preserves balance";
const selector = { test_file: file, full_name: fullName };
async function execute(assertionResults) {
  const report = JSON.stringify({ testResults: [{ name: file, assertionResults }] });
  return accept({
    acceptance_criterion_ids: ["AC-33"],
    acceptance_criterion_map: [{ acceptance_criterion_id: "AC-33", selectors: [selector] }],
    command: process.execPath,
    args: ["-e", `process.stdout.write(${JSON.stringify(report)})`],
  });
}
const actual = (result) => result.entries[0].assertions[0].actual;

describe("ORACLE-P10-CASE-RECONCILIATION", () => {
  it.each(["pending", "skipped", "todo", "failed"])("never claims %s business case passed", async (status) => {
    const result = await execute([{ fullName, status }]);
    expect(actual(result).status).toBe("failed");
  });

  it("does not claim a passed business case from a duplicate runner row", async () => {
    const result = await execute([{ fullName, status: "passed" }, { fullName, status: "passed" }]);
    expect(actual(result).status, "duplicate case identity is ambiguous even when both rows pass").toBe("failed");
  });

  it("does not turn a passing runner name into an independently observed business oracle", async () => {
    const result = await execute([{ fullName, status: "passed" }]);
    expect(actual(result).status, "a runner label alone cannot certify a balance or business side effect").not.toBe("passed");
  });
});
