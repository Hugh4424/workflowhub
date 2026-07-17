import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { bootstrapStage, prepareMakeDecisionWorkspace } from "../core/stage-context.mjs";
import { acceptStageAttempt, runStage } from "../core/stage-runner.mjs";
import { createTask } from "../core/task-handle.mjs";
import { createTaskKernel } from "../core/task-kernel.mjs";
import { testConfirmationVerification, writeHumanConfirmation } from "./helpers/human-confirmation.mjs";

const temporary = [];
const refBytes = (root) => execFileSync("git", ["for-each-ref", "--format=%(refname)%00%(objectname)%00%(objecttype)%00"], { cwd: root });

afterEach(() => { while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true }); });

describe("T013 stage Git ref invariance", () => {
  it("keeps exact for-each-ref bytes unchanged across make-decision run and acceptance", async () => {
    const storageRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-stage-refs-")));
    temporary.push(storageRoot);
    const repo = join(storageRoot, "repo");
    mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
    const taskPath = join(storageRoot, "Projects", "Demo", "tasks", "ref-task");
    createTask({ storageRoot, taskPath, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "ref-task", created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} } });
    const prepared = prepareMakeDecisionWorkspace(bootstrapStage("make-decision", { mode: "sidecar", taskPath, projectName: "Demo", taskId: "ref-task" }));
    const context = Object.freeze({ ...prepared, kernel: createTaskKernel(prepared.task, { candidateWorkspace: prepared.candidateWorkspace, confirmationVerification: testConfirmationVerification }) });
    const before = refBytes(repo);
    const attempt = await runStage("make-decision", context, async (worker) => {
      const snapshot = worker.candidateWorkspace.captureSnapshot();
      return { facts: { worktree_root: worker.candidateWorkspace.worktreeRoot, baseline_commit: worker.candidateWorkspace.baselineCommit, snapshot_tree: snapshot.tree } };
    });
    acceptStageAttempt("make-decision", context, { attemptRef: attempt.attempt_ref, humanConfirmationRef: writeHumanConfirmation(context.kernel, "make-decision", attempt) });
    expect(refBytes(repo)).toEqual(before);
  });
});
