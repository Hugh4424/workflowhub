import { describe, expect, it } from "vitest";
import { accept } from "./acceptance-execution-producer.mjs";

const selector = { test_file: "tests/contract/real-business.test.mjs", full_name: "real business rejects unsafe payment" };
function runReport(assertionResults, args = []) {
  const report = { testResults: [{ name: selector.test_file, assertionResults }] };
  const script = `process.stdout.write(${JSON.stringify(JSON.stringify(report))})`;
  return accept({
    acceptance_criterion_ids: ["AC-32"],
    acceptance_criterion_map: [{ acceptance_criterion_id: "AC-32", selectors: [selector] }],
    command: process.execPath, args: ["-e", script, ...args],
  });
}
const outcome = (result) => result.entries[0].assertions[0].actual;

describe("ORACLE-P10-TARGETED-RUNNER-IDENTITY", () => {
  it("accepts one exact full runner identity from a real child process", async () => {
    const result = await runReport([{ fullName: selector.full_name, status: "passed" }], ["$(touch /tmp/workflowhub-p10-must-not-execute)"]);
    expect(outcome(result).status).toBe("passed");
  });

  it("rejects duplicate exact runner identities despite an exit-zero command", async () => {
    const duplicate = { fullName: selector.full_name, status: "passed" };
    const result = await runReport([duplicate, duplicate]);
    expect(outcome(result).status, "a duplicated target does not identify one executed case").toBe("failed");
  });

  it("keeps an absent target unproved even if the runner exits zero", async () => {
    const result = await runReport([{ fullName: "a different case", status: "passed" }]);
    expect(outcome(result).status).toBe("failed");
  });
});
