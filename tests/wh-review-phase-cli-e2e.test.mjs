import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { bootstrapStage, prepareMakeDecisionWorkspace } from "../core/stage-context.mjs";
import { acceptStageAttempt, runStage } from "../core/stage-runner.mjs";
import { createTask, createTaskKernel } from "../core/task-handle.mjs";
import { createBuildPlanReleasePin } from "../core/release-pin.mjs";
import { createBaselineTaskSnapshot, createTaskSnapshot } from "../core/task-snapshot.mjs";
import { captureGitWorktreeSnapshot } from "../core/git-worktree-snapshot.mjs";
import { writeHumanConfirmation } from "./helpers/human-confirmation.mjs";

const roots = [];
const whReview = new URL("../bin/wh-review", import.meta.url).pathname;
const workflowhub = new URL("../bin/workflowhub", import.meta.url).pathname;
const git = (cwd, args) => String(execFileSync("git", args, { cwd, encoding: "utf8" })).trim();
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function publish(kernel, ref, value) {
  kernel.publishCanonicalRecord(ref, typeof value === "string" ? value : `${JSON.stringify(value)}\n`);
}

async function acceptedFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "phase-review-cli-"))); roots.push(root);
  const repo = join(root, "repo"); mkdirSync(repo);
  git(repo, ["init", "-q"]); git(repo, ["config", "user.name", "Test"]); git(repo, ["config", "user.email", "test@example.test"]);
  writeFileSync(join(repo, "app.txt"), "base\n"); git(repo, ["add", "."]); git(repo, ["commit", "-qm", "base"]);
  const taskId = "phase-review";
  const task = createTask({ storageRoot: root, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: taskId, created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} } });
  const taskPath = task.taskPath;
  const contextFor = (stage) => bootstrapStage(stage, { mode: "sidecar", taskPath, projectName: "Demo", taskId });

  const decisionContext = prepareMakeDecisionWorkspace(contextFor("make-decision"));
  const decision = await runStage("make-decision", decisionContext, async (worker) => ({ facts: { worktree_root: worker.candidateWorkspace.worktreeRoot, baseline_commit: worker.candidateWorkspace.baselineCommit } }));
  acceptStageAttempt("make-decision", decisionContext, { attemptRef: decision.attempt_ref, humanConfirmationRef: writeHumanConfirmation(decisionContext.kernel, "make-decision", decision) });

  const specContext = contextFor("build-spec");
  const spec = await runStage("build-spec", specContext, async (worker) => {
    worker.artifacts.writeAtomic("spec.md", "# Spec\n\n## Acceptance Criteria\n\n- AC-001: public phase review uses trusted material.\n");
    return { facts: { spec_ref: worker.artifacts.reference("spec.md"), checkpoint: worker.createCheckpoint("build-spec") } };
  });
  acceptStageAttempt("build-spec", specContext, { attemptRef: spec.attempt_ref });

  const planContext = contextFor("build-plan");
  const plan = await runStage("build-plan", planContext, async (worker) => {
    worker.artifacts.writeAtomic("plan.md", "# Plan\n\nRun the phase review.\n");
    worker.artifacts.writeAtomic("tasks.md", "# Tasks\n\n- Run the phase review.\n");
    return { facts: { plan_ref: worker.artifacts.reference("plan.md"), tasks_ref: worker.artifacts.reference("tasks.md"), checkpoint: worker.createCheckpoint("build-plan") } };
  });
  acceptStageAttempt("build-plan", planContext, { attemptRef: plan.attempt_ref, humanConfirmationRef: writeHumanConfirmation(planContext.kernel, "build-plan", plan) });

  const context = contextFor("build-code"); const kernel = context.kernel;
  const release = createBuildPlanReleasePin(task); publish(kernel, release.ref, release.value);
  const baseline = createBaselineTaskSnapshot(context.workspace, { task_id: taskId, snapshot_id: "phase-0-base" }); publish(kernel, baseline.ref, baseline.value);
  writeFileSync(join(context.workspace.worktreeRoot, "app.txt"), "implementation\n");
  const implementation = createTaskSnapshot(context.workspace, { task_id: taskId, snapshot_id: "phase-0-implementation" }); publish(kernel, implementation.ref, implementation.value);

  const env = { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root };
  const subjectPayload = `${JSON.stringify({ release: { ref: release.ref, hash: release.hash }, baseline: { ref: baseline.ref, hash: baseline.hash, tree_oid: baseline.value.tree_oid }, implementation: { ref: implementation.ref, hash: implementation.hash, tree_oid: implementation.value.tree_oid }, allowed_files: ["app.txt"], upstream: null })}\n`;
  const subject = spawnSync(process.execPath, [workflowhub, "phase", "subject", "--project=Demo", `--task=${taskId}`, "--phase-id=phase-0", "--input=@-"], { cwd: repo, env, input: subjectPayload, encoding: "utf8" });
  if (subject.status !== 0) throw new Error(subject.stderr);
  const diff = spawnSync(process.execPath, [workflowhub, "phase", "diff", "--project=Demo", `--task=${taskId}`, "--phase-id=phase-0", "--input=@-"], { cwd: repo, env, input: "{}\n", encoding: "utf8" });
  if (diff.status !== 0) throw new Error(diff.stderr);

  const receiptContract = {
    targeted: ["phase-targeted-tests", "npx vitest run tests/phase-target.test.mjs"],
    full: ["phase-full-tests", "npm test"], check: ["phase-check", "npm run check"], "diff-check": ["phase-diff-check", "git diff --check"],
  };
  const implementationCommit = captureGitWorktreeSnapshot(context.workspace.worktreeRoot).commit;
  for (const name of ["targeted", "full", "check", "diff-check"]) {
    const [component, command] = receiptContract[name];
    const outputRef = `evidence/phase-0-${name}.txt`; const output = `${name}: pass\n`; publish(kernel, outputRef, output);
    publish(kernel, `receipts/phase-0-${name}.json`, {
      schema_version: "workflowhub-receipt.v1", task_id: taskId, stage: "build-code",
      producer: { stage: "build-code", component, version: "1.0.0" },
      command, command_hash: sha256(command), exit_code: 0,
      output_ref: outputRef, output_hash: sha256(output), snapshot_head: implementation.value.head_oid,
      snapshot_tree: implementation.value.tree_oid, snapshot_commit: implementationCommit,
      started_at: "2026-07-17T00:00:00.000Z", completed_at: "2026-07-17T00:00:01.000Z",
    });
  }

  const attachmentRoot = join(root, "attachments"); mkdirSync(attachmentRoot);
  const brokerConfig = join(root, "broker.json");
  writeFileSync(brokerConfig, `${JSON.stringify({ version: 4, attachment_roots: [{ root: attachmentRoot, sources: [".wh-review-packets"] }] })}\n`);
  const providerLog = join(root, "provider.log"); const fakeProvider = join(root, "fake-provider.mjs");
  writeFileSync(fakeProvider, `import { appendFileSync, readFileSync } from "node:fs";\nconst value=(name)=>process.argv.find((arg)=>arg.startsWith(name+"="))?.slice(name.length+1);\nconst attachments=JSON.parse(readFileSync(value("--attachments"),"utf8"));\nappendFileSync(process.env.FAKE_PROVIDER_LOG, JSON.stringify({argv:process.argv.slice(2),bundle_id:attachments.bundle_id,destinations:attachments.entries.map((entry)=>entry.destination)})+"\\n");\nconst semantic=JSON.stringify({verdict:"pass",summary:"trusted phase materials reviewed",findings:[]});\nprocess.stdout.write(JSON.stringify({runtime_id:"runtime-1",providers:[{result_protocol:"workflowhub-result.v1",provider:"opencode",status:"completed",material_id:attachments.bundle_id,session_id:"session-1",output:semantic,error:null}]})+"\\n");\n`);
  mkdirSync(join(root, ".workflowhub"), { recursive: true });
  writeFileSync(join(root, ".workflowhub", "config.json"), `${JSON.stringify({ third_review: { command: [process.execPath, fakeProvider], config: brokerConfig, attachment_root: attachmentRoot } })}\n`);
  env.FAKE_PROVIDER_LOG = providerLog;
  return { root, repo, task, taskId, taskPath, context, env, providerLog, attachmentRoot };
}

function invoke(fixture, extra = []) {
  return spawnSync(process.execPath, [whReview, "--project=Demo", `--task=${fixture.taskId}`, "--phase-id=phase-0", ...extra], { cwd: fixture.repo, env: fixture.env, encoding: "utf8" });
}

function reviewAttempts(taskPath) {
  const root = join(taskPath, "reviews", "attempts");
  if (!existsSync(root)) return [];
  return readdirSync(root, { recursive: true }).filter((name) => String(name).endsWith(".json"));
}

describe("public phase wh-review CLI E2E", () => {
  it("assembles trusted accepted artifacts, canonical phase evidence, and four test receipts before invoking the provider", async () => {
    const fixture = await acceptedFixture(); const result = invoke(fixture);
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ status: "semantic", verdict: "pass", subject_kind: "phase", phase_id: "phase-0" });
    expect(JSON.parse(fixture.task.readRecord(JSON.parse(result.stdout).result_ref))).toMatchObject({ phase_id: "phase-0", verdict: "pass", provider_results: [{ provider: "opencode" }] });
    expect(existsSync(fixture.providerLog)).toBe(true);
    expect(JSON.parse(String(execFileSync("tail", ["-n", "1", fixture.providerLog]))).destinations).toEqual(expect.arrayContaining([
      expect.stringMatching(/approved_spec/), expect.stringMatching(/approved_plan/), expect.stringMatching(/approved_tasks/), expect.stringMatching(/test_evidence/),
    ]));
  });

  it.each([
    ["missing receipt", (f) => rmSync(join(f.taskPath, "receipts", "phase-0-targeted.json"))],
    ["receipt drift", (f) => writeFileSync(join(f.taskPath, "receipts", "phase-0-targeted.json"), "{}\n")],
    ["spec drift", (f) => writeFileSync(join(f.context.workspace.worktreeRoot, "specs", f.taskId, "spec.md"), "tampered\n")],
    ["checkpoint drift", (f) => {
      const accepted = JSON.parse(f.task.readRecord("results/build-plan/accepted.json"));
      git(f.context.workspace.worktreeRoot, ["update-ref", accepted.checkpoint.ref, f.context.workspace.baselineCommit]);
    }],
  ])("fails %s before provider invocation and attempt publication", async (_label, mutate) => {
    const fixture = await acceptedFixture(); mutate(fixture); const result = invoke(fixture);
    expect(result.status).not.toBe(0);
    expect(existsSync(fixture.providerLog)).toBe(false);
    expect(reviewAttempts(fixture.taskPath)).toEqual([]);
  });

  it("rejects lane component, command, snapshot head, and snapshot commit-tree drift before provider/attempt", async () => {
    const fixture = await acceptedFixture(); const ref = "receipts/phase-0-targeted.json";
    const path = join(fixture.taskPath, ref); const original = JSON.parse(fixture.task.readRecord(ref));
    const mutations = [
      { producer: { ...original.producer, component: "phase-full-tests" } },
      { command: "npm test", command_hash: sha256("npm test") },
      { snapshot_head: "0".repeat(40) },
      { snapshot_commit: fixture.context.workspace.baselineCommit },
    ];
    for (const mutation of mutations) {
      writeFileSync(path, `${JSON.stringify({ ...original, ...mutation })}\n`);
      const result = invoke(fixture); expect(result.status).not.toBe(0);
      expect(existsSync(fixture.providerLog)).toBe(false); expect(reviewAttempts(fixture.taskPath)).toEqual([]);
    }
  });

  it("rejects argv material and storage injection before bootstrap/provider/attempt", async () => {
    const fixture = await acceptedFixture();
    for (const injected of ["--materials=forged", `--task-path=${fixture.taskPath}`, "--spec=/tmp/spec.md", "--checkpoint=deadbeef"]) {
      const result = invoke(fixture, [injected]);
      expect(result.status).not.toBe(0); expect(result.stderr).toMatch(/rejects argument/);
    }
    expect(existsSync(fixture.providerLog)).toBe(false);
    expect(reviewAttempts(fixture.taskPath)).toEqual([]);
  });
});
