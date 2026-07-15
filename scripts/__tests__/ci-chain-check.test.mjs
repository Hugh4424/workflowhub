import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const script = join(root, "scripts/ci-chain-check.mjs");
const dirs = []; const tree = "b".repeat(40);
afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));
function review(stage, track, verdict = "pass") { return { version: "wh-review-result.v1", task_id: "demo-task", stage, review_track: track,
  source: { target_commit: tree, base_commit: tree, base_tree: tree, captured_head: tree }, snapshot_tree: tree, material_id: "a".repeat(64),
  attempt_ref: "reviews/attempts/a/attempt.json", provider_results: [{ provider: "kimi" }], verdict, findings: [] }; }
function fixture(detailVerdict = "pass") {
  const cwd = mkdtempSync(join(tmpdir(), "ci-chain-")); dirs.push(cwd); const tracking = join(cwd, "tasks"); const task = join(tracking, "demo-task");
  mkdirSync(join(task, "reviews/results"), { recursive: true });
  writeFileSync(join(task, "reviews/results/direction.json"), JSON.stringify(review("make-decision", "direction")));
  writeFileSync(join(task, "reviews/results/detail.json"), JSON.stringify(review("make-decision", "detail", detailVerdict)));
  writeFileSync(join(task, "reviews/results/build-code.json"), JSON.stringify(review("build-code", null)));
  const fact = (name) => ({ result_ref: `reviews/results/${name}.json`, snapshot_tree: tree });
  writeFileSync(join(task, "stage-result-make-decision.json"), JSON.stringify({ facts: { reviews: { direction: fact("direction"), detail: fact("detail") } } }));
  writeFileSync(join(task, "stage-result-build-code.json"), JSON.stringify({ facts: { tests: { command: "npm test" }, review: fact("build-code") } }));
  writeFileSync(join(task, "stage-result-verify-code.json"), JSON.stringify({ status: "success", error_code: "", retryable: false, facts: {}, missing_items: [], user_decision: false, reason: "done" }));
  return { cwd, tracking };
}
function run(item) { return spawnSync("node", [script, "--task-id=demo-task", `--task-tracking-root=${item.tracking}`], { cwd: item.cwd, encoding: "utf8" }); }
describe("ci-chain-check", () => {
  it("accepts canonical stage result and formal refs without flow id", () => { expect(run(fixture()).status).toBe(0); });
  it("fails when either decision track requires revision", () => { const out = run(fixture("revise_required")); expect(out.status).toBe(1); expect(out.stderr).toMatch(/aggregate is not pass/); });
});
