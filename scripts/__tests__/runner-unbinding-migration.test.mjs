import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createTask, migrateTaskRunnerRoot, openTask } from "../../core/task-handle.mjs";

const roots = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-runner-unbinding-")));
  roots.push(root);
  const runnerRoot = join(root, "runner");
  mkdirSync(runnerRoot);
  execFileSync("git", ["init", "-q", "-b", "task/Demo/runner-unbinding"], { cwd: runnerRoot });
  execFileSync("git", ["config", "user.name", "WorkflowHub Tests"], { cwd: runnerRoot });
  execFileSync("git", ["config", "user.email", "tests@workflowhub.local"], { cwd: runnerRoot });
  mkdirSync(join(runnerRoot, "workflows", "build-code"), { recursive: true });
  writeFileSync(join(runnerRoot, "AGENTS.md"), "# Runner\n");
  writeFileSync(join(runnerRoot, "workflows", "build-code", "SKILL.md"), "# build-code\n");
  execFileSync("git", ["add", "."], { cwd: runnerRoot });
  execFileSync("git", ["commit", "-qm", "runner"], { cwd: runnerRoot });
  const initial = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      project_name: "Demo",
      task_id: "runner-unbinding",
      created_at: "2026-07-27T00:00:00.000Z",
      target_repo_root: join(root, "target"),
      issue_ids: [],
      inputs: {},
    },
  });
  const migrated = migrateTaskRunnerRoot({
    taskPath: initial.taskPath,
    projectName: "Demo",
    taskId: "runner-unbinding",
    runnerRoot,
    stage: "build-code",
  });
  return { root, task: migrated.task };
}

afterEach(async () => {
  const { rm } = await import("node:fs/promises");
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("runner binding removal migration", () => {
  it("uses task.json bytes as a CAS condition, removes only the live binding, and preserves lineage", async () => {
    const f = fixture();
    const before = f.task.readRecord("task.json");
    const { migrateTaskToPerInvocation } = await import("../../runtime/evidence/invocation-identity.mjs");

    const result = migrateTaskToPerInvocation({
      taskPath: f.task.taskPath,
      projectName: "Demo",
      taskId: "runner-unbinding",
      expectedManifestHash: sha256(before),
    });

    const reopened = openTask(f.task.taskPath, "Demo", "runner-unbinding");
    expect(reopened.manifest).not.toHaveProperty("runner_root");
    expect(reopened.manifest).not.toHaveProperty("runner_oid");
    expect(reopened.manifest).not.toHaveProperty("runner_replacement");
    expect(reopened.manifest.execution_mode).toBe("per_invocation");
    expect(reopened.manifest.runner_root_migration).toEqual(JSON.parse(before).runner_root_migration);
    expect(result).toMatchObject({
      schema_version: "workflowhub-runner-unbinding-migration.v1",
      task_id: "runner-unbinding",
      previous_manifest_hash: sha256(before),
      status: "migrated",
    });
    expect(result.migration_ref).toMatch(/^identity\/migrations\/per-invocation\/[a-f0-9]{64}\.json$/);
    expect(reopened.readRecord(result.migration_ref)).toContain('"workflowhub-runner-unbinding-migration.v1"');
  });

  it("is replay-safe and rejects a stale CAS without changing task.json", async () => {
    const f = fixture();
    const before = f.task.readRecord("task.json");
    const { migrateTaskToPerInvocation } = await import("../../runtime/evidence/invocation-identity.mjs");
    const first = migrateTaskToPerInvocation({
      taskPath: f.task.taskPath,
      projectName: "Demo",
      taskId: "runner-unbinding",
      expectedManifestHash: sha256(before),
    });
    const after = openTask(f.task.taskPath, "Demo", "runner-unbinding").readRecord("task.json");

    const replay = migrateTaskToPerInvocation({
      taskPath: f.task.taskPath,
      projectName: "Demo",
      taskId: "runner-unbinding",
      expectedManifestHash: sha256(before),
    });
    expect(replay).toEqual(first);
    expect(openTask(f.task.taskPath, "Demo", "runner-unbinding").readRecord("task.json")).toBe(after);

    expect(() => migrateTaskToPerInvocation({
      taskPath: f.task.taskPath,
      projectName: "Demo",
      taskId: "runner-unbinding",
      expectedManifestHash: "0".repeat(64),
    })).toThrow(/concurrent|manifest|CAS/i);
    expect(openTask(f.task.taskPath, "Demo", "runner-unbinding").readRecord("task.json")).toBe(after);
  });
});
