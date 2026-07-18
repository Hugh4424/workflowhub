import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import { bootstrapTask } from "../task-bootstrap.mjs";
import { migrateTaskRunnerIdentity, openTask } from "../../core/task-handle.mjs";

const roots = [];
const stageRuntime = new URL("../stage-runtime.mjs", import.meta.url).pathname;
const workflowhubRoot = realpathSync(fileURLToPath(new URL("../..", import.meta.url)));
const workflowhubOid = execFileSync("git", ["rev-parse", "HEAD"], { cwd: workflowhubRoot, encoding: "utf8" }).trim();
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("task bootstrap target repository boundary", () => {
  function fixture() {
    const home = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-task-bootstrap-")));
    roots.push(home);
    const storage = join(home, "storage"), repo = join(home, "repo");
    mkdirSync(storage); mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
    return { home, storage, repo, env: { HOME: home, WORKFLOWHUB_TASK_DIR: storage } };
  }

  function simulatePinnedRunnerDrift(taskPath) {
    const manifestPath = join(taskPath, "task.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const advancedOid = workflowhubOid === "f".repeat(40) ? "e".repeat(40) : "f".repeat(40);
    writeFileSync(manifestPath, `${JSON.stringify({ ...manifest, runner_oid: advancedOid }, null, 2)}\n`);
  }

  function removePinnedRunner(taskPath) {
    const manifestPath = join(taskPath, "task.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    delete manifest.runner_root;
    delete manifest.runner_oid;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }

  function snapshotDirectory(root, relative = "") {
    const current = join(root, relative);
    return readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
      const path = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) return [`dir:${path}`, ...snapshotDirectory(root, path)];
      const hash = createHash("sha256").update(readFileSync(join(root, path))).digest("hex");
      return [`file:${path}:${hash}`];
    }).sort();
  }

  it("rejects a nested target before creating immutable task.json", () => {
    const f = fixture(), nested = join(f.repo, "nested"); mkdirSync(nested);
    expect(() => bootstrapTask({ project: "Demo", task: "nested-target", "target-repo": nested }, f)).toThrow(/Git toplevel/i);
    expect(() => bootstrapTask({ project: "Demo", task: "nested-target", "target-repo": f.repo }, f)).not.toThrow();
  });

  it("rejects a non-Git target before creating immutable task.json", () => {
    const f = fixture(), plain = join(f.home, "plain"); mkdirSync(plain);
    expect(() => bootstrapTask({ project: "Demo", task: "plain-target", "target-repo": plain }, f)).toThrow(/target repository validation failed/i);
    expect(() => bootstrapTask({ project: "Demo", task: "plain-target", "target-repo": f.repo }, f)).not.toThrow();
  });

  it("records a pinned runner that is separate from the candidate repository", () => {
    const f = fixture();
    const created = bootstrapTask({
      project: "Demo",
      task: "runner-identity",
      "target-repo": f.repo,
    }, f);
    const manifest = JSON.parse(readFileSync(join(created.task_path, "task.json"), "utf8"));

    expect(manifest).toMatchObject({ runner_root: workflowhubRoot, runner_oid: workflowhubOid });
    expect(manifest.runner_root).not.toBe(join(f.home, "repo-runner-identity"));
  });

  it("rejects caller-reported runner identity before creating a task", () => {
    const f = fixture();
    const taskPath = join(f.storage, "Projects", "Demo", "tasks", "reported-runner");

    expect(() => bootstrapTask({
      project: "Demo",
      task: "reported-runner",
      "target-repo": f.repo,
      "runner-root": f.repo,
      "runner-oid": execFileSync("git", ["rev-parse", "HEAD"], { cwd: f.repo, encoding: "utf8" }).trim(),
    }, f)).toThrow(/runner.*(?:caller|forbidden|not supported|derived)/i);
    expect(existsSync(taskPath)).toBe(false);
  });

  it("rejects runner OID drift before writing a task receipt", () => {
    const f = fixture();
    const created = bootstrapTask({
      project: "Demo",
      task: "runner-receipt-drift",
      "target-repo": f.repo,
    }, f);
    simulatePinnedRunnerDrift(created.task_path);
    const before = snapshotDirectory(created.task_path);
    const input = join(f.home, "decision.json");
    writeFileSync(input, `${JSON.stringify({ decision_log: "# Decision\n" })}\n`);

    const result = spawnSync(process.execPath, [stageRuntime,
      "receipt", "--stage=make-decision", "--project=Demo", "--task=runner-receipt-drift",
      "--component=decision", `--input=${input}`,
    ], { cwd: f.repo, env: { ...process.env, ...f.env }, encoding: "utf8" });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/runner.*(?:OID|identity|drift|changed)/i);
    expect(existsSync(join(created.task_path, "receipts", "decision.json"))).toBe(false);
    expect(snapshotDirectory(created.task_path)).toEqual(before);
  });

  it("rejects runner OID drift before preparing the candidate Workspace", () => {
    const f = fixture();
    const created = bootstrapTask({
      project: "Demo",
      task: "runner-workspace-drift",
      "target-repo": f.repo,
    }, f);
    simulatePinnedRunnerDrift(created.task_path);
    const before = snapshotDirectory(created.task_path);
    const refsBefore = execFileSync("git", ["show-ref"], { cwd: f.repo, encoding: "utf8" });
    const statusBefore = execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: f.repo, encoding: "utf8" });
    const input = join(f.home, "run-input.json");
    writeFileSync(input, `${JSON.stringify({ receipts: {} })}\n`);
    const candidate = join(f.home, "repo-runner-workspace-drift");

    const result = spawnSync(process.execPath, [stageRuntime,
      "run", "--stage=make-decision", "--project=Demo", "--task=runner-workspace-drift",
      `--input=${input}`,
    ], { cwd: f.repo, env: { ...process.env, ...f.env }, encoding: "utf8" });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/runner.*(?:OID|identity|drift|changed)/i);
    expect(existsSync(candidate)).toBe(false);
    expect(snapshotDirectory(created.task_path)).toEqual(before);
    expect(execFileSync("git", ["show-ref"], { cwd: f.repo, encoding: "utf8" })).toBe(refsBefore);
    expect(execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: f.repo, encoding: "utf8" })).toBe(statusBefore);
  });

  it("migrates a legacy manifest only through the explicit bootstrap entry", () => {
    const f = fixture();
    const created = bootstrapTask({ project: "Demo", task: "legacy-runner-migration", "target-repo": f.repo }, f);
    removePinnedRunner(created.task_path);

    const migrated = bootstrapTask({ project: "Demo", task: "legacy-runner-migration", "migrate-runner": "true" }, f);
    expect(migrated).toMatchObject({ runner_root: workflowhubRoot, runner_oid: workflowhubOid, idempotent_replay: false });
    expect(openTask(created.task_path, { projectName: "Demo", taskId: "legacy-runner-migration" }).manifest)
      .toMatchObject({ runner_root: workflowhubRoot, runner_oid: workflowhubOid });

    const replay = bootstrapTask({ project: "Demo", task: "legacy-runner-migration", "migrate-runner": "true" }, f);
    expect(replay.idempotent_replay).toBe(true);
  });

  it("migrates a drifted runner only through the explicit bootstrap entry", () => {
    const f = fixture();
    const created = bootstrapTask({ project: "Demo", task: "runner-migration", "target-repo": f.repo }, f);
    simulatePinnedRunnerDrift(created.task_path);

    const migrated = bootstrapTask({ project: "Demo", task: "runner-migration", "migrate-runner": "true" }, f);
    expect(migrated).toMatchObject({ runner_root: workflowhubRoot, runner_oid: workflowhubOid, idempotent_replay: false });
    expect(openTask(created.task_path, { projectName: "Demo", taskId: "runner-migration" }).manifest)
      .toMatchObject({ runner_root: workflowhubRoot, runner_oid: workflowhubOid });

    const replay = bootstrapTask({ project: "Demo", task: "runner-migration", "migrate-runner": "true" }, f);
    expect(replay.idempotent_replay).toBe(true);
  });

  it("allows the target repository to be the runner", () => {
    const f = fixture();
    const created = bootstrapTask({ project: "Demo", task: "target-runner", "target-repo": workflowhubRoot }, f);
    const manifest = openTask(created.task_path, { projectName: "Demo", taskId: "target-runner" }).manifest;
    expect(manifest.target_repo_root).toBe(workflowhubRoot);
    expect(manifest.runner_root).toBe(workflowhubRoot);
  });

  it("rejects caller-selected migration runners", () => {
    const f = fixture();
    const created = bootstrapTask({ project: "Demo", task: "selected-runner", "target-repo": f.repo }, f);

    expect(() => migrateTaskRunnerIdentity({
      taskPath: created.task_path,
      projectName: "Demo",
      taskId: "selected-runner",
      runnerRoot: f.repo,
    }))
      .toThrow(/runnerRoot.*forbidden/i);
    expect(openTask(created.task_path, { projectName: "Demo", taskId: "selected-runner" }).manifest.runner_root)
      .toBe(workflowhubRoot);
  });

  it.each([
    ["missing OID", (manifest) => { delete manifest.runner_oid; }],
    ["relative root", (manifest) => { manifest.runner_root = "relative/runner"; }],
    ["short OID", (manifest) => { manifest.runner_oid = "abc123"; }],
  ])("rejects invalid manifest runner identity: %s", (_label, mutate) => {
    const f = fixture();
    const created = bootstrapTask({ project: "Demo", task: `invalid-runner-${_label.replaceAll(" ", "-").toLowerCase()}`, "target-repo": f.repo }, f);
    const manifestPath = join(created.task_path, "task.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    mutate(manifest);
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    expect(() => openTask(created.task_path, { projectName: "Demo", taskId: manifest.task_id })).toThrow(/runner_root|runner_oid|runner identity/i);
  });
});
