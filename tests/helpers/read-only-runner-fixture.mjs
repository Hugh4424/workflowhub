import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { buildRunnerRelease, installRunnerRelease } from "../../runtime/distribution/runner-release.mjs";
import { buildSkillBundleRelease } from "../../runtime/distribution/skill-bundle-release.mjs";
import { createTask } from "../../core/task-handle.mjs";
import { captureGitWorktreeSnapshot } from "../../runtime/task/git-worktree-snapshot.mjs";
import { hashAuditSummary } from "../../runtime/evidence/audit-summary-carrier.mjs";
import { writeHumanConfirmation } from "./human-confirmation.mjs";

const SOURCE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const STAGES = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");

/** Hash the source file list and bytes, excluding generated VCS metadata. */
export function sourceContentListHash(root = SOURCE_ROOT) {
  const names = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { cwd: root }).toString("utf8").split("\0").filter(Boolean);
  const entries = names.map((name) => `${name}\0${hash(fs.readFileSync(path.join(root, name)))}\n`).join("");
  return hash(entries);
}

function runGit(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function parseCli(result, command) {
  if (result.error || result.status !== 0) {
    throw new Error(`${command} failed (${result.status}): ${result.stderr || result.error?.message || "unknown error"}`);
  }
  return JSON.parse(result.stdout || "null");
}

/**
 * Build an installed runner copy and keep all task writes outside the Hub
 * checkout. The copy is read-only after installation; only its task storage
 * and target repository are writable.
 */
export async function createReadOnlyRunnerFixture({ taskId = `e2e-${Date.now()}` } = {}) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-e2e-")));
  const runnerRoot = path.join(root, "runner");
  const bundleRoot = path.join(root, "skill-bundle");
  const providerRoot = path.join(root, "provider-bundle");
  const targetRepo = path.join(root, "target");
  const home = path.join(root, "home");
  const storage = path.join(root, "storage");
  for (const directory of [home, storage, targetRepo]) fs.mkdirSync(directory, { recursive: true });
  runGit(targetRepo, ["init", "-q", "-b", "main"]);
  runGit(targetRepo, ["config", "user.name", "WorkflowHub E2E"]);
  runGit(targetRepo, ["config", "user.email", "workflowhub-e2e@example.invalid"]);
  runGit(targetRepo, ["commit", "--allow-empty", "-qm", "e2e baseline"]);

  await buildRunnerRelease({ packageRoot: SOURCE_ROOT, outputDir: runnerRoot });
  await buildSkillBundleRelease({ packageRoot: SOURCE_ROOT, outputDir: bundleRoot });
  // Provider recovery uses a minimal, immutable Skill Bundle projection. It
  // avoids unrelated review assets while still exercising the released
  // runner's resolver, invocation fact and idempotent-write path.
  fs.mkdirSync(path.join(providerRoot, "workflows", "build-code"), { recursive: true });
  fs.mkdirSync(path.join(providerRoot, "skills"), { recursive: true });
  fs.cpSync(path.join(SOURCE_ROOT, "skills", "test-routing-advisor"), path.join(providerRoot, "skills", "test-routing-advisor"), { recursive: true });
  fs.writeFileSync(path.join(providerRoot, "workflows", "build-code", "skill-deps.yaml"), [
    "stage: build-code",
    "skills:",
    "  - { name: test-routing-advisor, path: skills/test-routing-advisor/SKILL.md, execution: independent, invocation: conditional, trigger: l2_test_routing, bundle: skills/test-routing-advisor/skill-bundle.json }",
    "",
  ].join("\n"));
  installRunnerRelease({
    releaseRoot: runnerRoot,
    skillBundleRoot: bundleRoot,
    run: (command, args, options) => spawnSync(command, command === "npm" ? [...args, "--offline"] : args, options),
  });

  const env = { ...process.env, HOME: home, WORKFLOWHUB_TASK_DIR: storage, NODE_PATH: "" };
  const runtimePath = path.join(runnerRoot, "scripts/stage-runtime.mjs");
  const taskPath = path.join(storage, "Projects", "E2E", "tasks", taskId);
  createTask({ storageRoot: storage, taskPath, manifest: {
    schema_version: "1.0.0", project_name: "E2E", task_id: taskId,
    created_at: new Date().toISOString(), target_repo_root: targetRepo, issue_ids: [], inputs: {},
  } });

  // A released runner must never write back into the source checkout.
  const makeReadOnly = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.name === "node_modules") continue;
      if (entry.isDirectory()) {
        makeReadOnly(full);
        fs.chmodSync(full, 0o555);
      } else if (entry.isFile()) fs.chmodSync(full, 0o444);
    }
  };
  makeReadOnly(runnerRoot);
  makeReadOnly(bundleRoot);
  makeReadOnly(providerRoot);
  const cli = (argv) => parseCli(spawnSync(process.execPath, [runtimePath, ...argv], {
    cwd: targetRepo,
    env,
    encoding: "utf8",
  }), argv.join(" "));
  const modules = {};
  const load = async (relative) => {
    if (!modules[relative]) modules[relative] = import(pathToFileURL(path.join(runnerRoot, relative)).href);
    return modules[relative];
  };
  const contextFor = async (stage) => {
    const [{ bootstrapStage, prepareMakeDecisionWorkspace }, runner] = await Promise.all([
      load("core/stage-context.mjs"),
      load("core/stage-runner.mjs"),
    ]);
    let context = bootstrapStage(stage, {
      mode: "sidecar", taskPath, projectName: "E2E", taskId, runnerRoot,
    });
    if (stage === "make-decision" && !context.candidateWorkspace) context = prepareMakeDecisionWorkspace(context);
    return { context, runner };
  };
  const sourceHashBefore = sourceContentListHash();
  const finish = () => {
    const sourceHashAfter = sourceContentListHash();
    if (sourceHashAfter !== sourceHashBefore) throw new Error(`WorkflowHub source changed during E2E: ${sourceHashBefore} -> ${sourceHashAfter}`);
    return sourceHashAfter;
  };
  const dispose = () => {
    // Stage execution creates a target-repository worktree. Remove that
    // registration before deleting the read-only fixture tree.
    try {
      const records = runGit(targetRepo, ["worktree", "list", "--porcelain"]);
      const worktrees = records.split(/\n(?=worktree )/).map((record) => record.match(/^worktree (.+)$/m)?.[1]).filter(Boolean);
      for (const worktree of worktrees) {
        if (path.resolve(worktree) === path.resolve(targetRepo)) continue;
        try { execFileSync("git", ["-C", targetRepo, "worktree", "remove", "--force", worktree], { stdio: "ignore" }); }
        catch { /* best-effort cleanup; the explicit root removal below is still safe */ }
      }
    } catch { /* fixture setup may have failed before target git existed */ }
    const makeWritable = (directory) => {
      if (!fs.existsSync(directory)) return;
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const full = path.join(directory, entry.name);
        try { fs.chmodSync(full, entry.isDirectory() ? 0o755 : 0o644); } catch { /* best effort */ }
        if (entry.isDirectory()) makeWritable(full);
      }
      try { fs.chmodSync(directory, 0o755); } catch { /* best effort */ }
    };
    makeWritable(root);
    fs.rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  };

  return Object.freeze({
    root, runnerRoot, bundleRoot, providerRoot, targetRepo, home, storage, taskPath, taskId, env, cli, load, contextFor,
    sourceHashBefore, finish, dispose,
    sourceTree: () => runGit(runnerRoot, ["rev-parse", "HEAD^{tree}"]),
    worktreeRoot: () => {
      const status = cli(["doctor", "--action=workspace", "--stage=make-decision", "--project=E2E", `--task=${taskId}`]);
      return status.worktree_root;
    },
  });
}

/** Reattach CLI/module capabilities inside a child Node process. */
export function createExistingReadOnlyRunnerFixture({ root, runnerRoot, bundleRoot, providerRoot, targetRepo, home, storage, taskPath, taskId, sourceHashBefore }) {
  const env = { ...process.env, HOME: home, WORKFLOWHUB_TASK_DIR: storage, NODE_PATH: "" };
  const runtimePath = path.join(runnerRoot, "scripts/stage-runtime.mjs");
  const cli = (argv) => parseCli(spawnSync(process.execPath, [runtimePath, ...argv], { cwd: targetRepo, env, encoding: "utf8" }), argv.join(" "));
  const modules = {};
  const load = async (relative) => {
    if (!modules[relative]) modules[relative] = import(pathToFileURL(path.join(runnerRoot, relative)).href);
    return modules[relative];
  };
  const contextFor = async (stage) => {
    const [{ bootstrapStage, prepareMakeDecisionWorkspace }, runner] = await Promise.all([load("core/stage-context.mjs"), load("core/stage-runner.mjs")]);
    let context = bootstrapStage(stage, { mode: "sidecar", taskPath, projectName: "E2E", taskId, runnerRoot });
    if (stage === "make-decision" && !context.candidateWorkspace) context = prepareMakeDecisionWorkspace(context);
    return { context, runner };
  };
  return Object.freeze({ root, runnerRoot, bundleRoot, providerRoot, targetRepo, home, storage, taskPath, taskId, env, cli, load, contextFor, sourceHashBefore, finish: () => sourceContentListHash() });
}

/** Execute a complete scenario in a plain Node child, outside Vitest's module transformer. */
export function runScenarioInChild(fixture, scenario) {
  const helperUrl = pathToFileURL(fileURLToPath(import.meta.url)).href;
  const payload = JSON.stringify({
    root: fixture.root, runnerRoot: fixture.runnerRoot, bundleRoot: fixture.bundleRoot, providerRoot: fixture.providerRoot,
    targetRepo: fixture.targetRepo, home: fixture.home, storage: fixture.storage,
    taskPath: fixture.taskPath, taskId: fixture.taskId, sourceHashBefore: fixture.sourceHashBefore,
  });
  const script = `import { createExistingReadOnlyRunnerFixture, runScenario } from ${JSON.stringify(helperUrl)};\nconst fixture = createExistingReadOnlyRunnerFixture(${payload});\nconst result = await runScenario(fixture, ${JSON.stringify(scenario)});\nprocess.stdout.write(JSON.stringify(result));\n`;
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
    cwd: SOURCE_ROOT, env: fixture.env, encoding: "utf8", maxBuffer: 10 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) throw new Error(result.stderr || result.error?.message || `scenario ${scenario} exited ${result.status}`);
  return JSON.parse(result.stdout);
}

export async function runScenario(fixture, scenario) {
  let stale = false;
  let providerRecovered = false;
  let providerHistoryPreserved = false;
  const accepted = await runFiveStageChain(fixture, {
    onStage: async ({ stage, context, worktree, runner }) => {
      if (scenario === "material-revision" && stage === "build-plan") {
        fs.writeFileSync(path.join(worktree, "specs", fixture.taskId, "spec.md"), "# revised spec\n");
        fs.writeFileSync(path.join(worktree, "specs", fixture.taskId, "plan.md"), "# revised plan\n");
        const historicalTree = context.kernel.readAccepted("build-plan").accepted.checkpoint.tree_oid;
        const currentTree = captureGitWorktreeSnapshot(worktree).tree;
        const value = { task_id: fixture.taskId, stage: "build-code", material_revision: "revision-a", snapshot_tree: historicalTree, kind: "review", subject: "integration", status: "passed", evidence: [] };
        const raw = JSON.stringify(value);
        const { evaluateFactFreshness } = await import(pathToFileURL(path.join(SOURCE_ROOT, "runtime/evidence/freshness.mjs")).href);
        stale = evaluateFactFreshness({ ...value, ref: "fact.json", sha256: hash(raw) }, { material_revision: "revision-b", snapshot_tree: currentTree }, { read: () => raw }).status === "stale";
      }
      if (scenario === "idempotent-resume" && stage === "build-code") {
        const { dispatchStageSkill } = await fixture.load("runtime/stage/stage-skill-runtime.mjs");
        const unavailable = await dispatchStageSkill({ packageRoot: fixture.providerRoot, stage: "build-code", name: "test-routing-advisor", invocationKey: "resume", independentContextAvailable: false, kernel: context.kernel });
        const replay = await dispatchStageSkill({ packageRoot: fixture.providerRoot, stage: "build-code", name: "test-routing-advisor", invocationKey: "resume", independentContextAvailable: false, kernel: context.kernel });
        const replayWrite = context.kernel.publishStageSkillInvocation(replay);
        if (unavailable.status !== "unavailable" || replayWrite.idempotent !== true) throw new Error("provider unavailable invocation was not idempotent");
        const snapshotTree = captureGitWorktreeSnapshot(worktree).tree;
        const resultRaw = `${JSON.stringify({ schema_version: "stage-content-evidence.v1", snapshot_tree: snapshotTree })}\n`;
        const resultRef = "evidence/e2e-provider-recovered.json";
        context.kernel.publishCanonicalRecord(resultRef, resultRaw);
        const resultHash = hash(resultRaw);
        let interrupted = true;
        const hostInvoke = async () => {
          if (interrupted) { interrupted = false; throw new Error("simulated write interruption"); }
          return { outcome_ref: resultRef, outcome_hash: resultHash, snapshot_tree: snapshotTree };
        };
        try { await dispatchStageSkill({ packageRoot: fixture.providerRoot, stage: "build-code", name: "test-routing-advisor", invocationKey: "provider-recovery", kernel: context.kernel, hostInvoke }); }
        catch (error) { if (!/simulated write interruption/.test(error.message)) throw error; }
        const recovered = await dispatchStageSkill({ packageRoot: fixture.providerRoot, stage: "build-code", name: "test-routing-advisor", invocationKey: "provider-recovery", kernel: context.kernel, hostInvoke });
        providerRecovered = recovered.status === "executed";
        const { stageSkillInvocationRef } = await fixture.load("core/stage-skill-invocation.mjs");
        const baseRef = stageSkillInvocationRef({
          task_id: fixture.taskId,
          workflow_run_id: context.kernel.deriveStageWorkflowRunId(stage),
          stage,
          name: "test-routing-advisor",
          invocation_key: "provider-recovery",
        });
        providerHistoryPreserved = JSON.parse(context.kernel.task.readRecord(baseRef)).status === "unavailable";
        if (!providerRecovered) throw new Error("provider did not recover");
        if (!runner) throw new Error("runner missing");
      }
    },
  });
  return { scenario, accepted_stages: Object.keys(accepted), stale, provider_recovered: providerRecovered, provider_history_preserved: providerHistoryPreserved, source_hash: fixture.finish() };
}

/** Execute all five stages through the released runner's StageRunner boundary. */
export async function runFiveStageChain(fixture, { onStage } = {}) {
  const { taskPath, taskId, runnerRoot, targetRepo } = fixture;
  fixture.cli(["doctor", "--action=workspace", "--stage=make-decision", "--project=E2E", `--task=${taskId}`]);
  fixture.cli(["status", "--action=begin", "--stage=make-decision", "--project=E2E", `--task=${taskId}`, "--reason=e2e"]);
  const accepted = {};
  const publishAudit = (context, stage, worktree) => {
    const snapshotTree = captureGitWorktreeSnapshot(worktree).tree;
    const payload = { scenario: "five-stage-e2e", oracle: "source-immutable", actual_outcome: "pass", evidence_type: "fixture" };
    const content = {
      schema_version: "stage-content-evidence.v1",
      kind: `e2e-${stage}`,
      task_id: taskId,
      stage,
      workflow_run_id: context.workflowRunId,
      snapshot_tree: snapshotTree,
      content_hash: hash(JSON.stringify(payload)),
      payload,
    };
    const contentRaw = `${JSON.stringify(content, null, 2)}\n`;
    const contentHash = hash(contentRaw);
    const contentRef = `evidence/stage-content/${contentHash}/e2e-${stage}.json`;
    try { context.kernel.publishCanonicalRecord(contentRef, contentRaw); }
    catch (error) { if (error?.code !== "EEXIST" || context.kernel.task.readRecord(contentRef) !== contentRaw) throw error; }
    const contentEvidenceRefs = [{ kind: content.kind, ref: contentRef, hash: contentHash }];
    const unsigned = {
      schema_version: "stage-audit-summary.v1",
      task_id: taskId,
      stage_slug: stage,
      workflow_run_id: context.workflowRunId,
      snapshot_tree: snapshotTree,
      verdict: "pass",
      content_evidence_refs: contentEvidenceRefs,
    };
    const summaryHash = hashAuditSummary(unsigned);
    const auditRef = `evidence/audits/${stage}/${summaryHash}.json`;
    const auditRaw = `${JSON.stringify({ ...unsigned, summary_hash: summaryHash }, null, 2)}\n`;
    try { context.kernel.publishCanonicalRecord(auditRef, auditRaw); }
    catch (error) { if (error?.code !== "EEXIST" || context.kernel.task.readRecord(auditRef) !== auditRaw) throw error; }
    return {
      audit_contract_version: "v1",
      audit_summary_ref: auditRef,
      audit_summary_hash: summaryHash,
      audit_verdict: "pass",
      content_evidence_refs: contentEvidenceRefs,
    };
  };
  for (const stage of STAGES) {
    if (stage !== "make-decision") {
      fixture.cli(["status", "--action=begin", `--stage=${stage}`, "--project=E2E", `--task=${taskId}`, `--reason=e2e-${stage}`]);
    }
    const { context, runner } = await fixture.contextFor(stage);
    const worktree = context.candidateWorkspace?.worktreeRoot ?? context.workspace?.worktreeRoot ?? targetRepo;
    const baseline = runGit(worktree, ["rev-parse", "HEAD"]);
    const handler = async (worker) => {
      if (stage === "make-decision") {
        const directory = path.join(worktree, "specs", taskId);
        fs.mkdirSync(directory, { recursive: true });
        const decisionRaw = "# E2E decision\n";
        fs.writeFileSync(path.join(directory, "decision-log.md"), decisionRaw);
        const decisionHash = hash(decisionRaw);
        const decisionRef = `receipts/decision-log/${decisionHash}.md`;
        context.kernel.publishCanonicalRecord(decisionRef, decisionRaw);
        return { facts: { worktree_root: worktree, baseline_commit: baseline, snapshot_tree: captureGitWorktreeSnapshot(worktree).tree, decision_ref: decisionRef, decision_hash: decisionHash, ...publishAudit(context, stage, worktree) } };
      }
      if (stage === "build-spec") {
        worker.artifacts.writeAtomic("spec.md", "# E2E spec\n");
        return { facts: { spec_ref: `specs/${taskId}/spec.md`, checkpoint: worker.createCheckpoint(stage), ...publishAudit(context, stage, worktree) } };
      }
      if (stage === "build-plan") {
        worker.artifacts.writeAtomic("plan.md", "# E2E plan\n");
        worker.artifacts.writeAtomic("tasks.md", "# E2E tasks\n");
        return { facts: { plan_ref: `specs/${taskId}/plan.md`, tasks_ref: `specs/${taskId}/tasks.md`, checkpoint: worker.createCheckpoint(stage), ...publishAudit(context, stage, worktree) } };
      }
      const tree = runGit(worktree, ["rev-parse", "HEAD^{tree}"]);
      const testHash = "a".repeat(64);
      const review = { verdict: "pass", result_ref: `reviews/results/${stage}.json`, result_hash: testHash, snapshot_tree: tree };
      if (stage === "build-code") return { facts: {
        changed: [], phase_completion: { status: "completed", evidence_ref: "evidence/phase-e2e.json", evidence_hash: testHash, integration_review: { ref: "reviews/results/build-code.json", sha256: testHash }, formal_record_status: { status: "unavailable", reason: "fixture" } }, tests: { command: "e2e", exit_code: 0, command_hash: testHash,
          snapshot_head: baseline, snapshot_tree: tree, snapshot_commit: baseline,
          started_at: "2026-07-31T00:00:00.000Z", completed_at: "2026-07-31T00:00:01.000Z",
          receipt_ref: "evidence/e2e-tests.json", receipt_hash: testHash, output_ref: "evidence/e2e-output.txt", output_hash: testHash },
        review, acceptance_coverage: { snapshot_tree: tree, accepted_criterion_ids: ["AC-01"], items: [{ acceptance_criterion_id: "AC-01", status: "unknown", evidence_refs: [] }] },
        ...publishAudit(context, stage, worktree),
      } };
      return { facts: {
        tests: { command: "e2e", exit_code: 0, command_hash: testHash, snapshot_head: baseline,
          snapshot_tree: tree, snapshot_commit: baseline, started_at: "2026-07-31T00:00:00.000Z",
          completed_at: "2026-07-31T00:00:01.000Z", receipt_ref: "evidence/e2e-tests.json", receipt_hash: testHash,
          output_ref: "evidence/e2e-output.txt", output_hash: testHash },
        review, evidence_refs: [],
        ...publishAudit(context, stage, worktree),
      } };
    };
    const attempt = await runner.runStage(stage, context, handler);
    const request = { attemptRef: attempt.attempt_ref };
    if (["make-decision", "build-plan", "verify-code"].includes(stage)) request.humanConfirmationRef = writeHumanConfirmation(context.kernel, stage, attempt);
    accepted[stage] = runner.acceptStageAttempt(stage, context, request);
    if (onStage) await onStage({ stage, context, attempt, accepted: accepted[stage], worktree, runner });
  }
  return accepted;
}

export function sourceHashForFixture(fixture) {
  return fixture.finish();
}
