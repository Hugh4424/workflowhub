import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { authenticateOfficialInvocation } from "../../runtime/evidence/invocation-identity.mjs";
import { createTask, migrateTaskRunnerRoot, migrateTaskToPerInvocation, openTask } from "../task-handle.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function fixture({ mode = "per_invocation", taskId = "per-call" } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-invocation-")));
  roots.push(root);
  const target = join(root, "target");
  const runner = join(root, "runner");
  mkdirSync(target); mkdirSync(runner);
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: target });
  execFileSync("git", ["init", "-q", "-b", `task/workflowhub/${taskId}`], { cwd: runner });
  writeFileSync(join(runner, "AGENTS.md"), "# contracts\n");
  writeFileSync(join(runner, "CONSTITUTION.md"), "# constitution\n");
  mkdirSync(join(runner, "workflows", "build-code"), { recursive: true });
  writeFileSync(join(runner, "workflows", "build-code", "SKILL.md"), "# build-code\n");
  execFileSync("git", ["add", "."], { cwd: runner });
  execFileSync("git", ["-c", "user.name=Tests", "-c", "user.email=tests@example.com", "commit", "-qm", "release"], { cwd: runner });
  const task = createTask({ storageRoot: root, manifest: {
    schema_version: "1.0.0",
    ...(mode === "per_invocation" ? { execution_mode: "per_invocation" } : {}),
    project_name: "workflowhub", task_id: taskId, created_at: "2026-07-27T00:00:00.000Z",
    target_repo_root: target, issue_ids: [], inputs: {},
  } });
  return { root, runner: realpathSync(runner), task };
}

describe("per-invocation runner identity", () => {
  it("keeps new manifests free of persistent runner identity and records computed release facts create-only", () => {
    const f = fixture();
    expect(f.task.manifest).not.toHaveProperty("runner_root");
    const result = authenticateOfficialInvocation(f.task, { runnerRoot: f.runner, stage: "build-code", runId: "run-1" });
    const stored = JSON.parse(f.task.readRecord(result.ref));
    expect(stored).toMatchObject({
      schema_version: "workflowhub-invocation-identity.v1",
      project_name: "workflowhub", task_id: "per-call", run_id: "run-1", stage: "build-code",
      source: { git_branch: "task/workflowhub/per-call" },
      source_kind: "git_invocation",
      capabilities: ["task-handle", "task-kernel", "stage:build-code"],
    });
    expect(stored.release.content_id).toMatch(/^[a-f0-9]{64}$/);
    expect(stored.contracts.stage_skill.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(() => authenticateOfficialInvocation(f.task, { runnerRoot: f.runner, stage: "build-code", runId: "run-1" })).toThrow(/EEXIST|exist/i);
  });

  it("rejects caller identity/path injection and dirty execution without binding the runner branch to business identity", () => {
    const f = fixture();
    expect(() => authenticateOfficialInvocation(f.task, { runnerRoot: f.runner, stage: "build-code", runId: "run-2", taskPath: f.task.taskPath })).toThrow(/caller-supplied|forbidden/i);
    writeFileSync(join(f.runner, "workflows", "build-code", "SKILL.md"), "# tampered\n");
    expect(() => authenticateOfficialInvocation(f.task, { runnerRoot: f.runner, stage: "build-code", runId: "run-2" })).toThrow(/clean/i);
    execFileSync("git", ["checkout", "--", "workflows/build-code/SKILL.md"], { cwd: f.runner });
    writeFileSync(join(f.runner, "untracked-executable.mjs"), "process.exit(0);\n");
    expect(() => authenticateOfficialInvocation(f.task, { runnerRoot: f.runner, stage: "build-code", runId: "run-3" })).toThrow(/clean/i);
    rmSync(join(f.runner, "untracked-executable.mjs"));
    expect(() => authenticateOfficialInvocation(f.task, { runnerRoot: f.runner, stage: "build-code", runId: "release", sourceKind: "release_manifest" })).toThrow(/unsupported/i);
    const other = fixture({ taskId: "other-call" });
    expect(authenticateOfficialInvocation(other.task, { runnerRoot: f.runner, stage: "build-code", runId: "cross-task" }).identity)
      .toMatchObject({ task_id: "other-call", source: { git_branch: "task/workflowhub/per-call" } });
  });

  it("reads legacy pinned tasks, migrates once with CAS lineage, then disables replacement", () => {
    const f = fixture({ mode: "legacy" });
    const pinned = migrateTaskRunnerRoot({
      taskPath: f.task.taskPath, projectName: "workflowhub", taskId: "per-call",
      runnerRoot: f.runner, stage: "build-code",
    });
    const beforeHash = createHash("sha256").update(pinned.task.readRecord("task.json")).digest("hex");
    expect(authenticateOfficialInvocation(pinned.task, { runnerRoot: f.runner, stage: "build-code", runId: "legacy" }).identity)
      .toMatchObject({ task_id: "per-call", source_kind: "git_invocation" });
    const migrated = migrateTaskToPerInvocation({
      taskPath: f.task.taskPath, projectName: "workflowhub", taskId: "per-call",
      expectedManifestHash: beforeHash,
      now: () => "2026-07-27T01:00:00.000Z",
    });
    const reopened = openTask(f.task.taskPath, "workflowhub", "per-call");
    expect(reopened.manifest).toMatchObject({ execution_mode: "per_invocation" });
    expect(reopened.manifest).not.toHaveProperty("runner_root");
    const record = JSON.parse(readFileSync(join(f.task.taskPath, migrated.migration_ref), "utf8"));
    expect(record.legacy_runner.runner_root).toBe(f.runner);
    expect(migrateTaskToPerInvocation({
      taskPath: f.task.taskPath, projectName: "workflowhub", taskId: "per-call",
      expectedManifestHash: beforeHash,
    }).status).toBe("migrated");
  });
});
