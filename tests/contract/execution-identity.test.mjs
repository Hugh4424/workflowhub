import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { join } from "node:path";

import { authenticateOfficialInvocation } from "../../runtime/evidence/invocation-identity.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";

describe("execution identity", () => {
  it("identity:normal-edit-not-blocked allows ordinary dirty runner bytes", () => {
    const root = mkdtempSync(join(process.cwd(), ".tmp-workflowhub-identity."));
    try {
      const target = join(root, "target");
      const runner = join(root, "runner");
      const storage = join(root, "storage");
      mkdirSync(target); mkdirSync(runner); mkdirSync(storage);
      execFileSync("git", ["init", "-q", "-b", "main"], { cwd: target });
      execFileSync("git", ["init", "-q", "-b", "task/workflowhub/identity"], { cwd: runner });
      writeFileSync(join(runner, "AGENTS.md"), "# runner\n");
      writeFileSync(join(runner, "CONSTITUTION.md"), "# constitution\n");
      mkdirSync(join(runner, "workflows", "build-code"), { recursive: true });
      writeFileSync(join(runner, "workflows", "build-code", "SKILL.md"), "# build-code\n");
      execFileSync("git", ["add", "."], { cwd: runner });
      execFileSync("git", ["-c", "user.name=Tests", "-c", "user.email=tests@example.com", "commit", "-qm", "baseline"], { cwd: runner });
      const task = createTask({ storageRoot: storage, manifest: {
        schema_version: "1.0.0", execution_mode: "per_invocation", project_name: "workflowhub",
        task_id: "identity", created_at: new Date().toISOString(), target_repo_root: target,
        issue_ids: [], inputs: {},
      } });
      writeFileSync(join(runner, "ordinary-edit.md"), "same task repair\n");
      const invocation = authenticateOfficialInvocation(task, { runnerRoot: runner, stage: "build-code", runId: "normal-edit" });
      expect(invocation.identity.source_clean).toBe(false);
      expect(invocation.identity.task_id).toBe("identity");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
