import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { authenticateOfficialInvocation, inspectOfficialInvocation, persistOfficialInvocation } from "../../runtime/evidence/invocation-identity.mjs";
import { assertWriteBoundary } from "../../runtime/evidence/write-boundary-preflight.mjs";
import { createTask, openTask } from "../../runtime/task/task-handle.mjs";

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

  it("binds dirty runner bytes while rejecting caller injection and invocation hash mismatches", () => {
    const f = fixture();
    expect(() => authenticateOfficialInvocation(f.task, { runnerRoot: f.runner, stage: "build-code", runId: "run-2", taskPath: f.task.taskPath })).toThrow(/caller-supplied|forbidden/i);
    writeFileSync(join(f.runner, "workflows", "build-code", "SKILL.md"), "# tampered\n");
    writeFileSync(join(f.runner, "untracked-executable.mjs"), "process.exit(0);\n");
    const dirty = authenticateOfficialInvocation(f.task, { runnerRoot: f.runner, stage: "build-code", runId: "run-2" });
    expect(dirty.identity).toMatchObject({ source_clean: false, source: { git_branch: "task/workflowhub/per-call" } });
    expect(dirty.identity.source.git_tree).not.toBe(execFileSync("git", ["rev-parse", "HEAD^{tree}"], { cwd: f.runner, encoding: "utf8" }).trim());
    expect(() => assertWriteBoundary({
      task: f.task, stage: "build-code", operation: "receipt",
      invocation: { ...dirty, hash: "0".repeat(64) },
    })).toThrow(/INVOCATION_RECORD_HASH_MISMATCH/);
    writeFileSync(join(f.runner, "untracked-executable.mjs"), "process.exit(1);\n");
    const changed = authenticateOfficialInvocation(f.task, { runnerRoot: f.runner, stage: "build-code", runId: "run-3" });
    expect(changed.identity.source.git_tree).not.toBe(dirty.identity.source.git_tree);
    expect(() => authenticateOfficialInvocation(f.task, { runnerRoot: f.runner, stage: "build-code", runId: "release", sourceKind: "release_manifest" })).toThrow(/unsupported/i);
    const other = fixture({ taskId: "other-call" });
    expect(authenticateOfficialInvocation(other.task, { runnerRoot: f.runner, stage: "build-code", runId: "cross-task" }).identity)
      .toMatchObject({ task_id: "other-call", source: { git_branch: "task/workflowhub/per-call" } });
  });

  it("does not accept a caller-supplied raw invocation and identity before persistence", () => {
    const f = fixture();
    const official = inspectOfficialInvocation(f.task, { runnerRoot: f.runner, stage: "build-code", runId: "raw-boundary" });
    const forged = {
      ref: official.ref,
      hash: official.hash,
      raw: official.raw,
      identity: { ...official.identity, stage: "make-decision" },
    };
    expect(() => assertWriteBoundary({
      task: f.task, stage: "build-code", operation: "receipt", invocation: forged,
    })).toThrow(/INVOCATION_RECORD_UNAVAILABLE|INVOCATION_IDENTITY_INVALID/i);
  });

  it("does not persist a caller-shaped invocation without the official inspection marker", () => {
    const f = fixture();
    const official = inspectOfficialInvocation(f.task, { runnerRoot: f.runner, stage: "build-code", runId: "persist-boundary" });
    const forged = { ref: official.ref, hash: official.hash, raw: official.raw, identity: official.identity };
    expect(() => persistOfficialInvocation(f.task, forged)).toThrow(/inspected official invocation is invalid/i);
  });

  it("reads legacy pinned tasks without migrating their runner history", () => {
    const f = fixture({ mode: "legacy" });
    const legacyManifest = {
      ...f.task.manifest,
      execution_mode: "legacy_pinned",
      runner_root: "/retired/workflowhub-runner",
      runner_oid: "f".repeat(40),
      runner_root_migration: { ref: "identity/migrations/runner-root/historical.json" },
    };
    writeFileSync(join(f.task.taskPath, "task.json"), `${JSON.stringify(legacyManifest, null, 2)}\n`);
    const pinned = openTask(f.task.taskPath, "workflowhub", "per-call");
    const before = pinned.readRecord("task.json");
    expect(authenticateOfficialInvocation(pinned, { runnerRoot: f.runner, stage: "build-code", runId: "legacy" }).identity)
      .toMatchObject({ task_id: "per-call", source_kind: "git_invocation" });
    expect(openTask(f.task.taskPath, "workflowhub", "per-call").manifest).toMatchObject({
      execution_mode: "legacy_pinned",
      runner_root: "/retired/workflowhub-runner",
    });
    expect(pinned.readRecord("task.json")).toBe(before);
  });

  it("accepts only well-shaped inert legacy runner fields without reading their historical migration", () => {
    const f = fixture({ mode: "legacy" });
    const legacyManifest = {
      ...f.task.manifest,
      execution_mode: "legacy_pinned",
      runner_root: "/retired/workflowhub-runner",
      runner_oid: "a".repeat(40),
      runner_root_migration: { ref: "identity/migrations/runner-root/historical.json" },
    };
    writeFileSync(join(f.task.taskPath, "task.json"), `${JSON.stringify(legacyManifest, null, 2)}\n`);

    const pinned = openTask(f.task.taskPath, "workflowhub", "per-call");
    expect(authenticateOfficialInvocation(pinned, { runnerRoot: f.runner, stage: "build-code", runId: "shape-only" }).identity.source)
      .toMatchObject({ git_branch: "task/workflowhub/per-call" });
    expect(() => openTask(f.task.taskPath, "workflowhub", "per-call")).not.toThrow();
  });

  it.each([
    [{ runner_root: "relative/runner" }, /legacy runner_root, runner_oid, and runner_root_migration/i],
    [{ runner_root: "relative/runner", runner_oid: "a".repeat(40), runner_root_migration: { ref: "identity/migrations/runner-root/historical.json" } }, /legacy runner_root must be an absolute path/i],
    [{ runner_root: "/retired/runner", runner_oid: "short", runner_root_migration: { ref: "identity/migrations/runner-root/historical.json" } }, /legacy runner_oid must be a full Git commit OID/i],
    [{ runner_root: "/retired/runner", runner_oid: "a".repeat(40), runner_root_migration: { ref: "../migration.json" } }, /legacy runner_root_migration must contain one safe migration ref/i],
  ])("rejects malformed inert legacy runner history: %j", (legacy, expected) => {
    const f = fixture({ mode: "legacy" });
    writeFileSync(join(f.task.taskPath, "task.json"), `${JSON.stringify({ ...f.task.manifest, execution_mode: "legacy_pinned", ...legacy }, null, 2)}\n`);
    expect(() => openTask(f.task.taskPath, "workflowhub", "per-call")).toThrow(expected);
  });

  it("rejects legacy runner fields on a per-invocation manifest", () => {
    const f = fixture();
    writeFileSync(join(f.task.taskPath, "task.json"), `${JSON.stringify({
      ...f.task.manifest,
      runner_root: "/retired/runner",
      runner_oid: "a".repeat(40),
      runner_root_migration: { ref: "identity/migrations/runner-root/historical.json" },
    }, null, 2)}\n`);
    expect(() => openTask(f.task.taskPath, "workflowhub", "per-call")).toThrow(/per_invocation.*legacy runner fields/i);
  });
});
