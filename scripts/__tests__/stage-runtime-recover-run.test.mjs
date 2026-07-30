import { afterAll, afterEach, describe, expect, it } from "vitest";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask } from "../../core/task-handle.mjs";
import { createTaskKernel } from "../../core/task-kernel.mjs";
import { createCanonicalSource, createSourceManifest } from "../../core/canonical-source.mjs";
import { prepareTaskWorkspace, recoverTaskWorkspace } from "../../core/workspace.mjs";

const roots = [];
const packageRoot = realpathSync(new URL("../..", import.meta.url).pathname);
const runnerRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-recover-runner.")));
for (const entry of [
  "AGENTS.md", "CONSTITUTION.md", "constitution-checklist.md", "package.json",
  "contracts", "core", "scripts", "schemas", "skills", "workflows",
]) {
  cpSync(join(packageRoot, entry), join(runnerRoot, entry), { recursive: true });
}
symlinkSync(join(packageRoot, "node_modules"), join(runnerRoot, "node_modules"), "dir");
execFileSync("git", ["init", "-q", "-b", "main"], { cwd: runnerRoot });
execFileSync("git", ["config", "user.name", "Test"], { cwd: runnerRoot });
execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: runnerRoot });
execFileSync("git", ["add", "."], { cwd: runnerRoot });
execFileSync("git", ["commit", "-qm", "clean recovery runner"], { cwd: runnerRoot });
const runtime = join(runnerRoot, "scripts", "stage-runtime.mjs");

function git(cwd, args) {
  return String(execFileSync("git", args, { cwd, encoding: "utf8" })).trim();
}

function fixture(taskId = "recover-task", { oldRun = true } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-recover-run.")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  writeFileSync(join(repo, "README.md"), "base\n");
  execFileSync("git", ["add", "."], { cwd: repo });
  execFileSync("git", ["commit", "-qm", "base"], { cwd: repo });
  const task = createTask({ storageRoot: root, manifest: {
    schema_version: "1.0.0", project_name: "Demo", task_id: taskId,
    created_at: "2026-07-30T00:00:00.000Z", target_repo_root: repo,
    issue_ids: [], inputs: {},
  } });
  const candidate = prepareTaskWorkspace(task);
  const worktreeRoot = candidate.worktreeRoot;
  const old = oldRun
    ? createTaskKernel(task, { candidateWorkspace: candidate }).startStageRun("make-decision", { reason: "interrupted run" })
    : null;
  return {
    root, repo, task, candidate, worktreeRoot, old,
    env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root },
  };
}

function recover(f, extra = []) {
  return spawnSync(process.execPath, [
    runtime, "recover-run", "--stage=make-decision", "--project=Demo",
    `--task=${f.task.identity.taskId}`, "--reason=transparent recovery", ...extra,
  ], { cwd: f.repo, env: f.env, encoding: "utf8" });
}

function recordSnapshot(task) {
  const records = [];
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile()) {
        records.push([
          path.slice(task.taskPath.length + 1),
          createHash("sha256").update(readFileSync(path)).digest("hex"),
        ]);
      }
    }
  }
  visit(task.taskPath);
  return records.sort(([left], [right]) => left.localeCompare(right));
}

function recoverWithStage(f, stage, extra = []) {
  return spawnSync(process.execPath, [
    runtime, "recover-run", `--stage=${stage}`, "--project=Demo",
    `--task=${f.task.identity.taskId}`, "--reason=transparent recovery", ...extra,
  ], { cwd: f.repo, env: f.env, encoding: "utf8" });
}

function requirementsLedgerInput() {
  const canonicalSource = createCanonicalSource({
    source_type: "offline_fixture",
    source_id: "recovery-continuation",
    revision: "r1",
    requirements: ["R1"],
  });
  const sourceManifest = createSourceManifest({
    canonical_source: canonicalSource,
    atoms: [{
      requirement_id: "R1",
      text: "Recovery continuation must keep the recovered workspace.",
      owner: "workflowhub",
      authority: "test",
      derived_from: [],
      supersedes: [],
      status: "accepted",
      stale: false,
    }],
  }).manifest;
  return {
    source_manifest: sourceManifest,
    mappings: {
      R1: {
        decision_ref: { kind: "decision", uri_or_path: "decision://R1", content_hash: "b".repeat(64) },
        artifact_refs: [{ kind: "artifact", uri_or_path: "artifact://R1", content_hash: "c".repeat(64) }],
        acceptance_criteria_refs: [{ kind: "ac", uri_or_path: "ac://R1", content_hash: "d".repeat(64) }],
      },
    },
  };
}

function concurrentRecoveries(f) {
  const barrier = join(f.root, "release-recoveries");
  const wrapper = join(f.root, "barrier-recovery.mjs");
  writeFileSync(wrapper, `
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
const [barrier, runtime, cwd, ...args] = process.argv.slice(2);
while (!existsSync(barrier)) await new Promise((resolve) => setTimeout(resolve, 5));
const result = spawnSync(process.execPath, [runtime, ...args], {
  cwd, env: process.env, encoding: "utf8"
});
process.stdout.write(result.stdout || "");
process.stderr.write(result.stderr || "");
process.exit(result.status ?? 1);
`);
  const args = [
    wrapper, barrier, runtime, f.repo, "recover-run", "--stage=make-decision",
    "--project=Demo", `--task=${f.task.identity.taskId}`, "--reason=transparent recovery",
  ];
  const children = [spawn(process.execPath, args, { cwd: f.repo, env: f.env }),
    spawn(process.execPath, args, { cwd: f.repo, env: f.env })];
  const completed = children.map((child) => new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  }));
  expect(existsSync(barrier)).toBe(false);
  writeFileSync(barrier, "go\n");
  return Promise.all(completed);
}

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });
afterAll(() => rmSync(runnerRoot, { recursive: true, force: true }));

describe("official make-decision recover-run", () => {
  it("recovers only the exact clean registered task branch and binds baseline to its full current HEAD", () => {
    const f = fixture();
    writeFileSync(join(f.worktreeRoot, "task.txt"), "task work\n");
    execFileSync("git", ["add", "."], { cwd: f.worktreeRoot });
    execFileSync("git", ["commit", "-qm", "task-only work"], { cwd: f.worktreeRoot });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "main advanced"], { cwd: f.repo });
    execFileSync("git", ["merge", "-q", "--no-edit", "main"], { cwd: f.worktreeRoot });
    const expectedHead = git(f.worktreeRoot, ["rev-parse", "HEAD"]);

    expect(() => prepareTaskWorkspace(f.task)).toThrow(/not an ancestor|fallback|baseline rebinding/i);
    const result = recover(f);
    expect(result.status, result.stderr).toBe(0);
    const recovered = JSON.parse(result.stdout);
    expect(recovered).toMatchObject({
      status: "waiting_for_host_response",
      baseline_commit: expectedHead,
      previous_run_ref: f.old.ref,
      previous_run_hash: f.old.hash,
    });
    expect(recovered.worktree_root).toBe(realpathSync(f.worktreeRoot));
  });

  it("rejects caller-selected recovery identity and recovery without an old run", () => {
    const f = fixture("caller-fields");
    for (const extra of [
      [`--worktree-root=${f.worktreeRoot}`],
      ["--branch=task/Demo/caller-fields"],
      [`--baseline-commit=${git(f.worktreeRoot, ["rev-parse", "HEAD"])}`],
    ]) {
      const result = recover(f, extra);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/forbidden|caller|unknown|no longer supported/i);
    }
    const noRun = fixture("no-old-run", { oldRun: false });
    const result = recover(noRun);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/previous|old|existing|recover/i);
  });

  it("recovers from the latest historical run even when its valid invalidation makes activeStageRun empty", () => {
    const f = fixture("invalidated-historical-source");
    const kernel = createTaskKernel(f.task, { candidateWorkspace: f.candidate });
    const invalidation = kernel.invalidateStageRun("make-decision", {
      run_ref: f.old.ref,
      run_hash: f.old.hash,
      reason: "host interrupted the prior run",
    });
    expect(kernel.activeStageRun("make-decision", { required: false })).toBeNull();
    const oldRunBytes = f.task.readRecord(f.old.ref);
    const invalidationBytes = f.task.readRecord(invalidation.ref);

    const result = recover(f);

    expect(result.status, result.stderr).toBe(0);
    const recovered = JSON.parse(result.stdout);
    expect(recovered).toMatchObject({
      previous_run_ref: f.old.ref,
      previous_run_hash: f.old.hash,
    });
    expect(JSON.parse(f.task.readRecord(recovered.ref))).toMatchObject({
      previous_run_ref: f.old.ref,
      previous_run_hash: f.old.hash,
      recovery_source_ref: f.old.ref,
      recovery_source_hash: f.old.hash,
    });
    expect(f.task.readRecord(f.old.ref)).toBe(oldRunBytes);
    expect(f.task.readRecord(invalidation.ref)).toBe(invalidationBytes);
  });

  it("keeps using the recovered workspace for later commands in the same active recovery run", () => {
    const f = fixture("recovery-continuation-workspace");
    writeFileSync(join(f.worktreeRoot, "task-work.txt"), "task work\n");
    execFileSync("git", ["add", "."], { cwd: f.worktreeRoot });
    execFileSync("git", ["commit", "-qm", "task-only recovery head"], { cwd: f.worktreeRoot });
    const recovered = recover(f);
    expect(recovered.status, recovered.stderr).toBe(0);
    const input = join(f.root, "requirements-ledger.json");
    writeFileSync(input, `${JSON.stringify(requirementsLedgerInput())}\n`);
    const before = recordSnapshot(f.task);

    const continued = spawnSync(process.execPath, [
      runtime, "publish-requirements-ledger", "--stage=make-decision", "--project=Demo",
      `--task=${f.task.identity.taskId}`, `--input=${input}`,
    ], { cwd: f.repo, env: f.env, encoding: "utf8" });

    if (continued.status !== 0) expect(recordSnapshot(f.task)).toEqual(before);
    expect(continued.status, continued.stderr).toBe(0);
    const publication = JSON.parse(continued.stdout);
    expect(publication).toMatchObject({
      ledger_ref: "requirements/ledger.json",
      workflow_run_id: JSON.parse(recovered.stdout).run.workflow_run_id,
      current: true,
    });
    expect(JSON.parse(f.task.readRecord(publication.ledger_ref))).toMatchObject({
      schema_version: "v1",
    });
  });

  it("adds no run or journal records when a recovered workspace becomes dirty before runtime use", () => {
    const f = fixture("dirty-after-recovery");
    const recovered = recoverTaskWorkspace(f.task);
    writeFileSync(join(f.worktreeRoot, "late-dirty.txt"), "late user bytes\n");
    expect(() => recovered.assertValid()).toThrow(/clean|dirty|status/i);
    const before = recordSnapshot(f.task);

    const result = recover(f);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/clean|dirty|status/i);
    expect(recordSnapshot(f.task)).toEqual(before);
  });

  it.each([
    ["build-spec", []],
    ["make-decision", ["--unknown-caller-field=forbidden"]],
  ])("rejects recover-run stage %s and unknown caller fields before any task record write", (stage, extra) => {
    const f = fixture(`preflight-${stage}-${extra.length}`);
    const before = recordSnapshot(f.task);

    const result = recoverWithStage(f, stage, extra);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/make-decision|unknown|caller|forbidden|recover-run/i);
    expect(recordSnapshot(f.task)).toEqual(before);
  });

  it("allows only one sequential recovery to consume the same old run", () => {
    const f = fixture("single-use-sequential");
    const first = recover(f);
    const afterFirst = recordSnapshot(f.task);
    const second = recover(f);

    expect(first.status, first.stderr).toBe(0);
    expect(second.status).not.toBe(0);
    expect(second.stderr).toMatch(/already|consumed|current|previous|recovery/i);
    expect(recordSnapshot(f.task)).toEqual(afterFirst);
  });

  it("allows only one concurrent recovery to consume the same old run", async () => {
    const f = fixture("single-use-concurrent");
    const before = recordSnapshot(f.task);
    const results = await concurrentRecoveries(f);
    const statuses = results.map(({ status }) => status).sort();

    expect(statuses).toEqual([0, 1]);
    const after = recordSnapshot(f.task);
    const newRunRefs = after.filter(([ref]) =>
      /^runs\/make-decision\/run-\d{4}\.json$/.test(ref)
      && !before.some(([oldRef]) => oldRef === ref));
    expect(newRunRefs).toHaveLength(1);
  });
});
