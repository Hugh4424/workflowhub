import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
const root = resolve(import.meta.dirname, "../..");
const temporaryRoots = [];
afterEach(() => { while (temporaryRoots.length) rmSync(temporaryRoots.pop(), { recursive: true, force: true }); });
describe("M16 governance registration", () => {
  it("registers each production module and private adapter with a real consumer", () => {
    const moveMap = JSON.parse(readFileSync(resolve(root, "docs/architecture/move-map.json"), "utf8"));
    const production = ["runtime/evidence/workflow-evolution.mjs", "runtime/schemas/workflow-evolution.v1.json", "tools/cli/generate-iteration-brief.mjs", "tools/cli/record-evolution-result.mjs", "tools/cli/check-skill-updates.mjs", "tools/cli/derive-consumption-edges.mjs", "tools/cli/build-reflection-page.mjs", "tools/cli/build-reflection-page-template.html"];
    for (const file of production) {
      const entry = [...moveMap.entries].reverse().find((value) => value.destination === file);
      expect(entry, `missing move-map entry for ${file}`).toBeTruthy();
      const bytes = readFileSync(resolve(root, file));
      expect(entry.bytes, `${file} bytes`).toBe(statSync(resolve(root, file)).size);
      expect(entry.sha256_after, `${file} sha256`).toBe(createHash("sha256").update(bytes).digest("hex"));
      for (const field of ["owner", "consumer", "delete_condition"]) expect(entry[field], `${file} ${field}`).toBeTruthy();
    }
    for (const object of ["evolution-candidates.jsonl", "attempted-edits.jsonl", "negative-results.jsonl", "iteration-brief.md"]) {
      const entries = moveMap.entries.filter((value) => typeof value.destination === "string" && value.destination.endsWith(object));
      expect(entries).toHaveLength(1);
      expect(entries[0].status).toBe("logical-object");
    }
    expect(moveMap.entries.some((entry) => /tests\/(?:contract|e2e|fixtures)\/.+workflow-evolution/.test(entry.destination ?? ""))).toBe(false);
  });

  it("keeps browser and final gates fail-closed and atomic", () => {
    const browser = readFileSync(resolve(root, "tests/fixtures/workflow-evolution/run-browser-qa.sh"), "utf8");
    const redWrapper = readFileSync(resolve(root, "tests/fixtures/workflow-evolution/run-red-green-gate.sh"), "utf8");
    const aggregate = readFileSync(resolve(root, "tests/fixtures/workflow-evolution/run-final-aggregate.sh"), "utf8");
    const review = readFileSync(resolve(root, "tests/fixtures/workflow-evolution/run-final-review-chain.mjs"), "utf8");
    expect(browser).toContain("validate-browser-manifest.mjs");
    expect(browser).toContain('screenshot body "$manifest_dir/m16-monitor-390x844.png"');
    expect(browser).toContain('agent_browser_session_residual_processes=0');
    expect(browser).not.toContain('v.cleanup="complete"');
    expect(browser).not.toMatch(/exit 0\s*$/);
    expect(aggregate).toContain("set -euo pipefail");
    expect(aggregate).toContain("atomic-write-final-aggregate.mjs");
    expect(review).not.toContain('status: "unavailable"');
    const redGate = readFileSync(resolve(root, "tests/fixtures/workflow-evolution/check-red-authenticity.mjs"), "utf8");
    expect(redGate).toContain("EXPECTED_BASELINE_SHA256");
    expect(redGate).toContain('phase === "red" && exitCode !== 1');
    expect(redGate).toContain("material_sha256");
    const baseline = JSON.parse(readFileSync(resolve(root, "tests/fixtures/workflow-evolution/red-baseline.v1.json"), "utf8"));
    expect(baseline.tests).toEqual([{ ref: "tests/contract/public-behavior-baseline.test.mjs", sha256: expect.stringMatching(/^[a-f0-9]{64}$/) }]);
    expect(baseline.tests.some((entry) => entry.ref.includes("quality/"))).toBe(false);
    expect(redWrapper).not.toContain("stage-reflection-e2e-constructed.test.mjs");
    expect(redWrapper).toContain("red-baseline.v1.json");
    expect(redWrapper).toContain('export WORKFLOWHUB_LIVE_PUBLIC_BEHAVIOR=1');
  });
  it("rejects forged exit and hash arguments by reading the canonical suite output", () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), "workflowhub-red-authenticity-")); temporaryRoots.push(temporaryRoot);
    const checker = resolve(root, "tests/fixtures/workflow-evolution/check-red-authenticity.mjs");
    const baseline = readFileSync(resolve(root, "tests/fixtures/workflow-evolution/red-baseline.v1.json"));
    const baselineHash = createHash("sha256").update(baseline).digest("hex");
    const reportPath = join(temporaryRoot, "suite-output.json");
    const report = {
      numFailedTestSuites: 0,
      numFailedTests: 0,
      success: true,
      testResults: [{ name: resolve(root, "tests/contract/build-reflection-page.test.mjs"), status: "passed", assertionResults: [] }],
    };
    writeFileSync(reportPath, JSON.stringify(report));
    const reportHash = createHash("sha256").update(readFileSync(reportPath)).digest("hex");
    const forgedRed = spawnSync(process.execPath, [checker, "monitor", "red", "1", "0", baselineHash, reportHash, reportPath], { cwd: root });
    expect(forgedRed.status).toBe(23);
    const infrastructureAsRed = spawnSync(process.execPath, [checker, "monitor", "red", "2", "0", baselineHash, reportHash, reportPath], { cwd: root });
    expect(infrastructureAsRed.status).toBe(23);
    report.success = false; report.numFailedTestSuites = 1; report.numFailedTests = 1; report.testResults[0].status = "failed";
    writeFileSync(reportPath, JSON.stringify(report));
    const failedHash = createHash("sha256").update(readFileSync(reportPath)).digest("hex");
    const forgedGreen = spawnSync(process.execPath, [checker, "monitor", "green", "0", "0", baselineHash, failedHash, reportPath], { cwd: root });
    expect(forgedGreen.status).toBe(23);
  });
  it("rejects minimal reports that invent one passed assertion per expected file", () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), "workflowhub-red-counts-")); temporaryRoots.push(temporaryRoot);
    const checker = resolve(root, "tests/fixtures/workflow-evolution/check-red-authenticity.mjs");
    const baseline = readFileSync(resolve(root, "tests/fixtures/workflow-evolution/red-baseline.v1.json"));
    const baselineHash = createHash("sha256").update(baseline).digest("hex");
    const names = ["tests/contract/workflow-evolution-governance.test.mjs", "tests/e2e/workflow-evolution-current.test.mjs", "tests/contract/public-behavior-baseline.test.mjs"];
    const report = { numTotalTests: 3, numPassedTests: 3, numFailedTests: 0, numPendingTests: 0, numTodoTests: 0, success: true, testResults: names.map((name) => ({ name: resolve(root, name), status: "passed", assertionResults: [{ fullName: name, status: "passed" }] })) };
    const reportPath = join(temporaryRoot, "suite-output.json"); writeFileSync(reportPath, JSON.stringify(report));
    const reportHash = createHash("sha256").update(readFileSync(reportPath)).digest("hex");
    expect(spawnSync(process.execPath, [checker, "governance", "green", "0", "0", baselineHash, reportHash, reportPath], { cwd: root }).status).toBe(23);
  });
  it("keeps the public runtime surface at seven behaviours", () => {
    const facade = readFileSync(resolve(root, "runtime/interface/runtime-facade.mjs"), "utf8");
    expect(facade).not.toMatch(/RUNTIME_BEHAVIORS[^\n]*evolution|generate-iteration-brief/);
  });
});
