import { describe, expect, it, vi } from "vitest";

import { runStage } from "../../runtime/stage/stage-runner.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { initializeTaskStore } from "../../runtime/task/task-store.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach } from "vitest";
import { classifyProtocolError } from "../../runtime/stage/protocol-error-whitelist.mjs";

function transientPublicationError() {
  const error = new Error("protocol publication failed transiently");
  error.code = "PROTOCOL_PUBLICATION_FAILURE";
  return error;
}
const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function context() {
  const root = realpathSync(mkdtempSync(join(realpathSync(tmpdir()), "workflowhub-protocol-resend-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git(["init", "-q"]);
  git(["config", "user.name", "WorkflowHub Tests"]);
  git(["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "fixture\n");
  git(["add", "."]);
  git(["commit", "-qm", "base"]);
  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0", project_name: "WorkflowHub", task_id: "protocol-resend",
      created_at: "2026-09-03T00:00:00Z", target_repo_root: repo, issue_ids: [], inputs: {}, record_model: "vnext-single-write",
    },
  });
  const candidateWorkspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidateWorkspace.worktreeRoot, task);
  initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
  for (const [name, content] of Object.entries({
    "decision-log.md": "# Decision log\n",
    "spec.md": "# Spec\n\n## Acceptance Criteria\n\n- **AC-001**：protocol contract.\n",
    "plan.md": "# Plan\n",
    "tasks.md": "# Tasks\n",
  })) artifacts.writeAtomic(name, content);
  const kernel = createTaskKernel(task, { candidateWorkspace });
  return {
    context: {
      stage: "build-code",
      task,
      kernel,
      identity: { taskId: task.identity.taskId, projectName: "WorkflowHub" },
      workflowRunId: "run-protocol-resend",
      manifest: task.manifest,
      artifacts,
      candidateWorkspace,
    },
  };
}

describe("protocol error in-place resend contract", () => {
  it("exposes a protocol diagnostic without turning an unknown failure into a recoverable result", () => {
    const classified = classifyProtocolError(new Error("build-code acceptance_coverage must match the current spec acceptance criteria"), { stage: "build-code", surface: "stage" });
    expect(classified.classification).toBe("protocol_error");
    expect(classified.diagnostic).toEqual({
      check_id: "acceptance_coverage",
      expected: expect.anything(),
      actual: expect.any(String),
    });
    expect(classifyProtocolError(new Error("quality finding remains actionable"), { stage: "build-code" }).classification).toBe("quality_failure");
  });

  it("RED: retries only publication in the same call after a valid handler result", async () => {
    const state = context();
    const handlerResult = Object.freeze({
      facts: { source: "valid-handler-result" },
      evidence_refs: [],
    });
    const llm = vi.fn(() => "single-llm-result");
    const handler = vi.fn(async (worker) => {
      expect(worker.stage).toBe("build-code");
      expect(worker.workflowRunId).toBe("run-protocol-resend");
      expect(llm()).toBe("single-llm-result");
      return handlerResult;
    });
    const publicationAttempts = [];
    const publishStage = vi.fn(({ publish }) => {
      publicationAttempts.push({ publish });
      if (publicationAttempts.length === 1) throw transientPublicationError();
      return publish();
    });

    // This private transaction seam wraps the real stage publisher. It is not
    // a public callback and receives only the captured publisher capability.
    const run = runStage("build-code", state.context, handler, {}, { publishStage });
    const result = await run;

    expect(result).toMatchObject({
      stage: "build-code",
      status: "in_progress",
      work_status: "ready",
      quality_status: "incomplete",
    });
    expect(result.completion.missing.length).toBeGreaterThan(0);
    expect(handler).toHaveBeenCalledOnce();
    expect(llm).toHaveBeenCalledOnce();
    expect(publishStage).toHaveBeenCalledTimes(2);
    expect(Object.keys(publishStage.mock.calls[0][0])).toEqual(["publish"]);
    expect(Object.keys(publishStage.mock.calls[1][0])).toEqual(["publish"]);
    expect(publicationAttempts[0].publish).toBeTypeOf("function");
    expect(publicationAttempts[1].publish).toBeTypeOf("function");
    expect(state.context.workflowRunId).toBe("run-protocol-resend");
    expect(state.context.stage).toBe("build-code");
    expect(handlerResult).toBe(await handler.mock.results[0].value);
    expect(handlerResult.facts.source).toBe("valid-handler-result");
    expect(publishStage.mock.calls[0][0]).not.toHaveProperty("retry_token");
    expect(publishStage.mock.calls[0][0]).not.toHaveProperty("continuation");
    expect(classifyProtocolError(new Error("quality finding remains actionable"), { stage: "build-code" }).classification)
      .toBe("quality_failure");
    expect(classifyProtocolError(new Error("quality finding remains actionable"), { stage: "build-code" }).diagnostic)
      .toBeUndefined();
  });

  it("rejects an internal publication seam that bypasses the real publisher", async () => {
    const state = context();
    const handler = vi.fn(async () => ({ facts: { marker: "seam-bypass" }, evidence_refs: [] }));
    const publishStage = vi.fn(() => ({ fake: true }));

    await expect(runStage("build-code", state.context, handler, {}, { publishStage }))
      .rejects.toThrow(/must invoke the captured publisher exactly once/);
    expect(handler).toHaveBeenCalledOnce();
    expect(publishStage).toHaveBeenCalledOnce();
  });
});
