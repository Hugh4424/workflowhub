import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask } from "../core/task-handle.mjs";

const temporary = [];

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-stage-runner-")));
  temporary.push(root);
  const repo = join(root, "repo");
  const worktree = join(root, "repo-chain-task");
  mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "t@example.com"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
  execFileSync("git", ["commit", "--allow-empty", "-qm", "base"], { cwd: repo });
  const oid = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim();
  execFileSync("git", ["worktree", "add", "-q", "-b", "task/Demo/chain-task", worktree, oid], { cwd: repo });
  const taskPath = join(root, "Projects", "Demo", "tasks", "chain-task");
  const task = createTask({
    storageRoot: root,
    taskPath,
    manifest: {
      schema_version: "1.0.0",
      project_name: "Demo",
      task_id: "chain-task",
      created_at: new Date().toISOString(),
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
    },
  });
  return { task, taskPath, worktree, oid };
}

async function runDecision(context, handler) {
  const { runStage } = await import("../core/stage-runner.mjs");
  return runStage("make-decision", context, async (worker, upstream) => {
    const result = await handler(worker, upstream);
    const decision = "# Current decision\n";
    const hash = (await import("node:crypto")).createHash("sha256").update(decision).digest("hex");
    worker.candidateWorkspace ?? worker.workspace;
    const root = worker.candidateWorkspace?.worktreeRoot ?? result.facts.worktree_root;
    mkdirSync(join(root, "specs", worker.identity.taskId), { recursive: true });
    writeFileSync(join(root, "specs", worker.identity.taskId, "decision-log.md"), decision);
    context.kernel.publishCanonicalRecord(`receipts/decision-log/${hash}.md`, decision);
    return {
      ...result,
      facts: {
        ...result.facts,
        decision_ref: `receipts/decision-log/${hash}.md`,
        decision_hash: hash,
      },
      missing_items: ["support:audit"],
    };
  });
}

afterEach(() => {
  while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true });
});

describe("stage-runner current-material boundary", () => {
  it("fails closed when the task manifest changes between bootstrap and publish", async () => {
    const { task, taskPath, worktree, oid } = fixture();
    const { bootstrapStage } = await import("../core/stage-context.mjs");
    const context = bootstrapStage("make-decision", { mode: "sidecar", taskPath, projectName: "Demo", taskId: "chain-task" });
    writeFileSync(join(task.taskPath, "task.json"), JSON.stringify({ ...task.manifest, project_name: "Forged" }));

    await expect(runDecision(context, async () => ({ facts: { worktree_root: worktree, baseline_commit: oid } })))
      .rejects.toThrow(/manifest|identity|changed|tamper/i);
    expect(() => task.readRecord("results/make-decision/attempt-0001.json")).toThrow();
  });

  it("gives business handlers no TaskKernel or acceptance capability", async () => {
    const { taskPath, worktree, oid } = fixture();
    const { bootstrapStage } = await import("../core/stage-context.mjs");
    const context = bootstrapStage("make-decision", { mode: "sidecar", taskPath, projectName: "Demo", taskId: "chain-task" });

    await runDecision(context, async (worker) => {
      expect(worker).not.toHaveProperty("task");
      expect(worker).not.toHaveProperty("kernel");
      expect(worker).not.toHaveProperty("accept");
      return { facts: { worktree_root: worktree, baseline_commit: oid } };
    });
  });

  it("does not synthesize an upstream permit for a normal stage", async () => {
    const { taskPath, worktree, oid } = fixture();
    const { bootstrapStage } = await import("../core/stage-context.mjs");
    const context = bootstrapStage("make-decision", { mode: "sidecar", taskPath, projectName: "Demo", taskId: "chain-task" });

    await runDecision(context, async (_worker, upstream) => {
      expect(upstream).toBeNull();
      return { facts: { worktree_root: worktree, baseline_commit: oid } };
    });
  });

  it("rejects handler output outside the canonical result schema", async () => {
    const { taskPath, worktree, oid } = fixture();
    const { bootstrapStage } = await import("../core/stage-context.mjs");
    const context = bootstrapStage("make-decision", { mode: "sidecar", taskPath, projectName: "Demo", taskId: "chain-task" });

    await expect(runDecision(context, async () => ({
      schema_version: "forged.v0",
      facts: { worktree_root: worktree, baseline_commit: oid },
    }))).rejects.toThrow(/schema_version|stage-result|runtime schema/i);
  });
});
