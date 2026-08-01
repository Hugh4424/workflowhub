import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createTask } from "../core/task-handle.mjs";

const roots = [];

function git(cwd, args) {
  return String(execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })).trim();
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-invocation-identity-")));
  roots.push(root);
  const runnerRoot = join(root, "runner");
  const targetRepoRoot = join(root, "target");
  mkdirSync(runnerRoot);
  mkdirSync(targetRepoRoot);
  git(runnerRoot, ["init", "-q", "-b", "task/Demo/per-invocation"]);
  git(runnerRoot, ["config", "user.name", "WorkflowHub Tests"]);
  git(runnerRoot, ["config", "user.email", "tests@workflowhub.local"]);
  mkdirSync(join(runnerRoot, "workflows", "build-code"), { recursive: true });
  writeFileSync(join(runnerRoot, "AGENTS.md"), "# Runner\n");
  writeFileSync(join(runnerRoot, "CONSTITUTION.md"), "# Constitution\n");
  writeFileSync(join(runnerRoot, "workflows", "build-code", "SKILL.md"), "# build-code\n");
  git(runnerRoot, ["add", "."]);
  git(runnerRoot, ["commit", "-qm", "runner"]);
  git(targetRepoRoot, ["init", "-q"]);
  git(targetRepoRoot, ["config", "user.name", "WorkflowHub Tests"]);
  git(targetRepoRoot, ["config", "user.email", "tests@workflowhub.local"]);
  git(targetRepoRoot, ["commit", "--allow-empty", "-qm", "base"]);
  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      project_name: "Demo",
      task_id: "per-invocation",
      created_at: "2026-07-27T00:00:00.000Z",
      target_repo_root: targetRepoRoot,
      issue_ids: [],
      inputs: {},
      execution_mode: "per_invocation",
    },
  });
  return { task, runnerRoot, runnerOid: git(runnerRoot, ["rev-parse", "HEAD"]) };
}

afterEach(async () => {
  const { rm } = await import("node:fs/promises");
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("per-invocation execution identity", () => {
  it("authenticates the explicitly supplied runner for this invocation without binding task.json", async () => {
    const f = fixture();
    const before = f.task.readRecord("task.json");
    const { authenticateOfficialInvocation } = await import("../runtime/evidence/invocation-identity.mjs");

    const result = authenticateOfficialInvocation(f.task, {
      runnerRoot: f.runnerRoot,
      stage: "build-code",
      runId: "invocation-0001",
    });

    expect(result.identity).toMatchObject({
      schema_version: "workflowhub-invocation-identity.v1",
      task_id: "per-invocation", project_name: "Demo", stage: "build-code", run_id: "invocation-0001",
      source: { git_oid: f.runnerOid, git_branch: "task/Demo/per-invocation" },
    });
    expect(result.ref).toBe("identity/executions/invocation-0001.json");
    expect(f.task.readRecord("task.json")).toBe(before);
    expect(JSON.parse(before)).not.toHaveProperty("runner_root");
    expect(JSON.parse(before)).not.toHaveProperty("runner_oid");
  });

  it("accepts the next clean committed WorkflowHub version without a replacement generation", async () => {
    const f = fixture();
    const { authenticateOfficialInvocation } = await import("../runtime/evidence/invocation-identity.mjs");
    const first = authenticateOfficialInvocation(f.task, {
      runnerRoot: f.runnerRoot, stage: "build-code", runId: "invocation-0001",
    });
    writeFileSync(join(f.runnerRoot, "version.txt"), "next\n");
    git(f.runnerRoot, ["add", "."]);
    git(f.runnerRoot, ["commit", "-qm", "next runner version"]);
    const second = authenticateOfficialInvocation(f.task, {
      runnerRoot: f.runnerRoot, stage: "build-code", runId: "invocation-0002",
    });

    expect(second.identity.source.git_oid).not.toBe(first.identity.source.git_oid);
    expect(f.task.listRecoveryGenerationRefs("runner-replacement")).toEqual([]);
  });
});
