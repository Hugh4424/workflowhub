import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createTask, createTaskKernel } from "../core/task-handle.mjs";
import { createBuildPlanReleasePin, validateBuildPlanReleasePin } from "../core/release-pin.mjs";

const roots = []; const sha = (value) => createHash("sha256").update(value).digest("hex"); const git = (cwd, args) => String(execFileSync("git", args, { cwd, encoding: "utf8" })).trim();
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });
function fixture(mutate = () => {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "release-pin-"))); roots.push(root); const repo = join(root, "repo"); mkdirSync(repo);
  git(repo, ["init", "-q"]); git(repo, ["config", "user.email", "t@example.test"]); git(repo, ["config", "user.name", "T"]); writeFileSync(join(repo, "base"), "base\n"); git(repo, ["add", "."]); git(repo, ["commit", "-qm", "base"]); const parent = git(repo, ["rev-parse", "HEAD"]);
  const task = createTask({ storageRoot: root, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "pin-task", created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} } });
  const artifactDir = join(repo, "specs/pin-task"); mkdirSync(artifactDir, { recursive: true }); writeFileSync(join(artifactDir, "plan.md"), "plan\n"); writeFileSync(join(artifactDir, "tasks.md"), "tasks\n"); git(repo, ["add", "."]); git(repo, ["commit", "-qm", "checkpoint"]); const commit = git(repo, ["rev-parse", "HEAD"]); const tree = git(repo, ["rev-parse", "HEAD^{tree}"]);
  const artifact = (name) => ({ path: `specs/pin-task/${name}`, blob_oid: git(repo, ["rev-parse", `${commit}:specs/pin-task/${name}`]), content_hash: sha(readFileSync(join(artifactDir, name))) }); const artifacts = [artifact("plan.md"), artifact("tasks.md")];
  const planPayload = { schema_version: "git-checkpoint-plan.v1", stage: "build-plan", parent_commit: parent, artifacts }; const checkpointPlan = { ...planPayload, plan_hash: sha(`${JSON.stringify(planPayload)}\n`) };
  const attempt = { schema_version: "task-attempt.v2", task_id: task.identity.taskId, stage: "build-plan", attempt_id: "build-plan:attempt-0001", created_at: "2026-07-17T00:00:00.000Z", facts: { plan_ref: "specs/pin-task/plan.md", tasks_ref: "specs/pin-task/tasks.md", checkpoint: checkpointPlan }, evidence_refs: [], missing_items: [], upstream_refs: [{ task_id: task.identity.taskId, stage: "build-spec", accepted_ref: "results/build-spec/accepted.json" }], checkpoint: checkpointPlan }; const checkpointRef = `refs/workflowhub/checkpoints/Demo/pin-task/build-plan/plan-${checkpointPlan.plan_hash}`; git(repo, ["update-ref", checkpointRef, commit]);
  const accepted = { schema_version: "task-accepted.v2", task_id: task.identity.taskId, stage: "build-plan", attempt_ref: "attempt-0001.json", integrity_hash: "", acceptance_mode: "human", human_confirmation_ref: "confirmations/build-plan/attempt-0001.json", accepted_at: "2026-07-17T00:01:00.000Z", upstream_refs: structuredClone(attempt.upstream_refs), checkpoint: { ref: checkpointRef, commit_oid: commit, tree_oid: tree, artifacts } };
  mutate({ task, attempt, accepted, repo }); const attemptRaw = `${JSON.stringify(attempt)}\n`; accepted.integrity_hash = sha(attemptRaw); const dir = join(task.taskPath, "results/build-plan"); mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, "attempt-0001.json"), attemptRaw); writeFileSync(join(dir, "accepted.json"), `${JSON.stringify(accepted)}\n`); return task;
}
describe("build-plan release pin", () => {
  it("derives through full TaskKernel accepted/checkpoint verification and publishes create-only", () => {
    const task = fixture(); expect(() => createBuildPlanReleasePin(task, { release_id: "caller" })).toThrow(/accepts only/); const pin = createBuildPlanReleasePin(task); expect(validateBuildPlanReleasePin(pin.value, task.identity.taskId)).toBeTruthy();
    const kernel = createTaskKernel(task); expect(kernel.publishCanonicalRecord(pin.ref, `${JSON.stringify(pin.value)}\n`)).toBeTruthy(); expect(() => kernel.publishCanonicalRecord(pin.ref, `${JSON.stringify(pin.value)}\n`)).toThrow(/exist|create-only/i);
  });
  for (const [name, mutate] of [
    ["wrong task", ({ accepted }) => { accepted.task_id = "other"; }], ["wrong stage", ({ accepted }) => { accepted.stage = "build-spec"; }],
    ["wrong ref", ({ accepted }) => { accepted.checkpoint.ref = "refs/workflowhub/checkpoints/Demo/other/build-plan/plan-" + "a".repeat(64); }],
    ["wrong tree", ({ accepted }) => { accepted.checkpoint.tree_oid = "f".repeat(40); }], ["wrong facts", ({ attempt }) => { delete attempt.facts.plan_ref; }],
    ["wrong upstream", ({ attempt, accepted }) => { attempt.upstream_refs = []; accepted.upstream_refs = []; }],
  ]) it(`rejects ${name}`, () => { expect(() => createBuildPlanReleasePin(fixture(mutate))).toThrow(); });
});
