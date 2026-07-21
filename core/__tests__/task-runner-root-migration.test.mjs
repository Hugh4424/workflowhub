import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { bootstrapStage } from "../stage-context.mjs";
import { createTask, migrateTaskRunnerRoot, openTask } from "../task-handle.mjs";
import { createTaskKernel } from "../task-kernel.mjs";
import { prepareTaskWorkspace } from "../workspace.mjs";
import { writeHumanConfirmation } from "../../tests/helpers/human-confirmation.mjs";

const roots = [];
const sha256 = (raw) => createHash("sha256").update(raw).digest("hex");

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-runner-migration-")));
  roots.push(root);
  const target = join(root, "target"), runner = join(root, "runner");
  mkdirSync(target); mkdirSync(runner);
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: target });
  execFileSync("git", ["init", "-q", "-b", "task/workflowhub/m14b-fact-collection-g2"], { cwd: runner });
  writeFileSync(join(runner, "AGENTS.md"), "# Runner\n");
  for (const stage of ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]) {
    mkdirSync(join(runner, "workflows", stage), { recursive: true });
    writeFileSync(join(runner, "workflows", stage, "SKILL.md"), `# ${stage}\n`);
  }
  execFileSync("git", ["add", "."], { cwd: runner });
  execFileSync("git", ["-c", "user.name=WorkflowHub Tests", "-c", "user.email=tests@workflowhub.local", "commit", "-qm", "runner"], { cwd: runner });
  const task = createTask({ storageRoot: root, manifest: {
    schema_version: "1.0.0", project_name: "workflowhub", task_id: "m14b-fact-collection-g2",
    created_at: "2026-07-19T00:00:00.000Z", target_repo_root: target, issue_ids: ["ZHI-102"], inputs: {},
  } });
  return { root, target, runner: realpathSync(runner), task };
}

function migrate(f, extra = {}) {
  return migrateTaskRunnerRoot({
    taskPath: f.task.taskPath, projectName: "workflowhub", taskId: "m14b-fact-collection-g2",
    runnerRoot: f.runner, stage: "verify-code", ...extra,
  });
}

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("existing task runner root migration", () => {
  it("writes exact immutable manifest lineage and replays idempotently", () => {
    const f = fixture(), oldRaw = f.task.readRecord("task.json");
    const result = migrate(f), newRaw = result.task.readRecord("task.json");
    const recordRaw = result.task.readRecord(result.migration_ref), record = JSON.parse(recordRaw);
    expect(result.task.manifest.runner_root).toBe(f.runner);
    expect(record).toMatchObject({
      schema_version: "task-runner-root-migration.v1", project_name: "workflowhub", task_id: "m14b-fact-collection-g2",
      previous_manifest_hash: sha256(oldRaw), new_manifest_hash: sha256(newRaw),
      runner_identity: { runner_root: f.runner, runner_oid: execFileSync("git", ["rev-parse", "HEAD"], { cwd: f.runner, encoding: "utf8" }).trim(), runner_branch: "task/workflowhub/m14b-fact-collection-g2", project: "workflowhub", task: "m14b-fact-collection-g2", stage: "verify-code" },
    });
    const replay = migrate(f);
    expect(replay.idempotent_replay).toBe(true);
    expect(replay.task.readRecord("task.json")).toBe(newRaw);
    expect(replay.task.readRecord(result.migration_ref)).toBe(recordRaw);
    const other = join(f.root, "other-runner"); mkdirSync(other);
    execFileSync("git", ["init", "-q", "-b", "main"], { cwd: other });
    writeFileSync(join(other, "AGENTS.md"), "# Other\n");
    mkdirSync(join(other, "workflows", "verify-code"), { recursive: true });
    writeFileSync(join(other, "workflows", "verify-code", "SKILL.md"), "# verify-code\n");
    expect(() => migrate(f, { runnerRoot: realpathSync(other) })).toThrow(/identity mismatch|already bound|different runner/i);
  });

  it("rejects wrong task, nested runner, and missing runner contracts without changing task.json", () => {
    const f = fixture(), before = f.task.readRecord("task.json");
    expect(() => migrateTaskRunnerRoot({ taskPath: f.task.taskPath, projectName: "workflowhub", taskId: "wrong", runnerRoot: f.runner, stage: "verify-code" })).toThrow(/taskPath|identity/i);
    const wrong = join(f.root, "wrong-runner"); mkdirSync(wrong);
    execFileSync("git", ["init", "-q", "-b", "task/workflowhub/wrong"], { cwd: wrong });
    writeFileSync(join(wrong, "AGENTS.md"), "# Wrong\n");
    mkdirSync(join(wrong, "workflows", "verify-code"), { recursive: true });
    writeFileSync(join(wrong, "workflows", "verify-code", "SKILL.md"), "# verify-code\n");
    expect(() => migrate(f, { runnerRoot: realpathSync(wrong) })).toThrow(/identity mismatch/i);
    const nested = join(f.runner, "nested"); mkdirSync(nested);
    expect(() => migrate(f, { runnerRoot: nested })).toThrow(/Git toplevel/i);
    unlinkSync(join(f.runner, "AGENTS.md"));
    expect(() => migrate(f)).toThrow(/AGENTS/i);
    writeFileSync(join(f.runner, "AGENTS.md"), "# Runner\n");
    unlinkSync(join(f.runner, "workflows", "verify-code", "SKILL.md"));
    expect(() => migrate(f)).toThrow(/SKILL/i);
    rmSync(join(f.runner, "workflows"), { recursive: true });
    const escaped = join(f.root, "escaped-workflows");
    mkdirSync(join(escaped, "verify-code"), { recursive: true });
    writeFileSync(join(escaped, "verify-code", "SKILL.md"), "# escaped\n");
    symlinkSync(escaped, join(f.runner, "workflows"), "dir");
    expect(() => migrate(f)).toThrow(/symlink/i);
    expect(f.task.readRecord("task.json")).toBe(before);
  });

  it("rolls back atomic failures, preserves the immutable ref, and can retry", () => {
    const f = fixture(), before = f.task.readRecord("task.json");
    expect(() => migrate(f, { testHooks: { beforeDirectoryFsync() { throw new Error("simulated atomic failure"); } } })).toThrow(/simulated atomic failure/);
    expect(readFileSync(join(f.task.taskPath, "task.json"), "utf8")).toBe(before);
    const result = migrate(f);
    expect(result.task.manifest.runner_root).toBe(f.runner);
  });

  it("fails closed on final runner drift and immutable ref collision", () => {
    const f = fixture(), before = f.task.readRecord("task.json"), skill = join(f.runner, "workflows", "verify-code", "SKILL.md");
    expect(() => migrate(f, { testHooks: { afterRevalidateBeforeRename() { unlinkSync(skill); } } })).toThrow(/SKILL|ENOENT/i);
    expect(readFileSync(join(f.task.taskPath, "task.json"), "utf8")).toBe(before);
    writeFileSync(skill, "# verify-code\n");
    const refsRoot = join(f.task.taskPath, "identity", "migrations", "runner-root");
    const path = join(refsRoot, readdirSync(refsRoot).at(0));
    const ref = readFileSync(path, "utf8");
    const refName = JSON.parse(ref).previous_manifest_hash;
    expect(refName).toBe(sha256(before));
    writeFileSync(path, "{}\n");
    expect(() => migrate(f)).toThrow(/immutable record|conflicts/i);
    expect(readFileSync(join(f.task.taskPath, "task.json"), "utf8")).toBe(before);
  });

  it("fails closed when manifest lineage integrity is corrupted", () => {
    const f = fixture(), result = migrate(f);
    const path = join(f.task.taskPath, result.migration_ref);
    const record = JSON.parse(readFileSync(path, "utf8"));
    record.new_manifest_hash = "0".repeat(64);
    writeFileSync(path, `${JSON.stringify(record, null, 2)}\n`);
    expect(() => openTask(f.task.taskPath, "workflowhub", "m14b-fact-collection-g2")).toThrow(/new manifest hash mismatch/i);
  });

  it("authenticates the migrated runner during verify bootstrap", () => {
    const f = fixture();
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: f.target });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: f.target });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "base"], { cwd: f.target });
    const candidate = prepareTaskWorkspace(f.task);
    const kernel = createTaskKernel(f.task, { candidateWorkspace: candidate });
    const attempt = kernel.publishAttempt("make-decision", { facts: { worktree_root: candidate.worktreeRoot, baseline_commit: candidate.baselineCommit } });
    kernel.acceptAttempt("make-decision", attempt.attempt_ref, writeHumanConfirmation(kernel, "make-decision", attempt));
    migrate(f);
    expect(() => bootstrapStage("verify-code", { mode: "sidecar", taskPath: f.task.taskPath, projectName: "workflowhub", taskId: "m14b-fact-collection-g2" })).toThrow(/explicit absolute path/i);
    const context = bootstrapStage("verify-code", { mode: "sidecar", taskPath: f.task.taskPath, projectName: "workflowhub", taskId: "m14b-fact-collection-g2", runnerRoot: f.runner });
    expect(context.manifest.runner_root).toBe(f.runner);
    unlinkSync(join(f.runner, "workflows", "verify-code", "SKILL.md"));
    expect(() => bootstrapStage("verify-code", { mode: "sidecar", taskPath: f.task.taskPath, projectName: "workflowhub", taskId: "m14b-fact-collection-g2", runnerRoot: f.runner })).toThrow(/SKILL/i);
  });
});
