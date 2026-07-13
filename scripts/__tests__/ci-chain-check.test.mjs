import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const script = join(root, "scripts", "ci-chain-check.mjs");
const dirs = [];
afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));
function fixture({ group = false } = {}) {
  const cwd = mkdtempSync(join(tmpdir(), "ci-chain-check-")); dirs.push(cwd);
  const specs = join(cwd, "specs", "demo-task"); mkdirSync(specs, { recursive: true });
  writeFileSync(join(specs, group ? "stage-result-make-decision-decision-flow.json" : "stage-result-make-decision.json"), "{}");
  writeFileSync(join(specs, "stage-result-build-code.json"), JSON.stringify({ facts: { tests: { command: "npm test" } } }));
  writeFileSync(join(specs, "stage-result-verify-code.json"), JSON.stringify({ status: "ok", error_code: null, retryable: false, facts: {}, missing_items: [], user_decision: null, reason: "done" }));
  return cwd;
}
function run(cwd, ...args) { return spawnSync("node", [script, ...args], { cwd, encoding: "utf8" }); }

describe("ci-chain-check", () => {
  it("requires review_flow_id and reads only its group-scoped make-decision result", () => {
    const grouped = fixture({ group: true });
    expect(run(grouped, "--task-id=demo-task").status).toBe(2);
    expect(run(grouped, "--task-id=demo-task", "--review-flow-id=decision-flow").status).toBe(0);
    const legacy = fixture();
    const result = run(legacy, "--task-id=demo-task", "--review-flow-id=decision-flow");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("stage-result-make-decision-decision-flow.json");
  });
});
