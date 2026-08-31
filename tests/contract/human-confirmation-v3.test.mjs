import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { initializeTaskStore } from "../../runtime/task/task-store.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { validateHumanConfirmation } from "../../runtime/evidence/canonical-evidence-validators.mjs";
import { writeCanonicalStageMaterials } from "../helpers/stage-outcome.mjs";

const roots = [];
const hash = (value) => createHash("sha256").update(value).digest("hex");

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-confirmation-v3-")));
  roots.push(root);
  const repo = join(root, "repo");
  const storage = join(root, "storage");
  mkdirSync(repo);
  mkdirSync(storage);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub contract"]);
  git(repo, ["config", "user.email", "contract@workflowhub.invalid"]);
  writeFileSync(join(repo, "README.md"), "baseline\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "baseline"]);
  const task = createTask({
    storageRoot: storage,
    manifest: {
      schema_version: "1.0.0",
      project_name: "Demo",
      task_id: "task-confirm-v3",
      created_at: "2026-08-30T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });
  initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
  const candidate = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidate.worktreeRoot, task);
  writeCanonicalStageMaterials(artifacts);
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate, now: () => "2026-08-30T00:00:01.000Z" });
  return { task, kernel };
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("human confirmation v3", () => {
  it("writer writes reply_text and step_slug in the single confirmation record and keeps authorize compatible", () => {
    const { task, kernel } = fixture();
    const confirmation = kernel.publishHumanConfirmation("build-code", {
      decision: "accepted",
      subject_ref: "quality/stage-reflection/build-code.json",
      reply_text: "我确认继续执行这个阶段。",
      step_slug: "confirm-stage-reflection",
    });

    expect(confirmation.value).toMatchObject({
      schema_version: "human-confirmation.v3",
      task_id: task.identity.taskId,
      stage: "build-code",
      decision: "accepted",
      subject_ref: "quality/stage-reflection/build-code.json",
      reply_text: "我确认继续执行这个阶段。",
      step_slug: "confirm-stage-reflection",
    });
    expect(() => validateHumanConfirmation(confirmation.value, {
      taskId: task.identity.taskId,
      stage: "build-code",
      requireAccepted: true,
      requireSubjectRef: true,
    })).not.toThrow();

    const authorization = kernel.publishIrreversibleAuthorization({ operation: "commit", subject_ref: confirmation.ref });
    expect(authorization.value).toMatchObject({
      schema_version: "irreversible-authorization.v1",
      subject_ref: confirmation.ref,
      subject_hash: hash(`${JSON.stringify(confirmation.value, null, 2)}\n`),
    });
  });

  it("continues to validate v1, v2, and v3 fixtures without rewriting old records", () => {
    const taskId = "task-confirm-v3";
    const v1 = {
      schema_version: "human-confirmation.v1",
      task_id: taskId,
      stage: "build-plan",
      decision: "accepted",
      confirmed_at: "2026-08-30T00:00:00.000Z",
      attempt_ref: "quality/reviews/attempts/fixture/attempt.json",
    };
    const v2 = {
      schema_version: "human-confirmation.v2",
      task_id: taskId,
      stage: "build-plan",
      decision: "accepted",
      subject_ref: "quality/reviews/attempts/fixture/attempt.json",
      material_revision: `revision-${"a".repeat(64)}`,
      snapshot_tree: "b".repeat(40),
      confirmed_at: "2026-08-30T00:00:00.000Z",
    };
    const v3 = {
      ...v2,
      schema_version: "human-confirmation.v3",
      reply_text: "确认继续当前阶段。",
      step_slug: "publish-plan-result",
    };
    const before = new Map([
      ["v1", JSON.stringify(v1)],
      ["v2", JSON.stringify(v2)],
      ["v3", JSON.stringify(v3)],
    ]);
    const beforeHashes = new Map([...before].map(([name, value]) => [name, hash(value)]));

    expect(() => validateHumanConfirmation(v1, {
      taskId,
      stage: "build-plan",
      subject: v1.attempt_ref,
      requireAccepted: true,
    })).not.toThrow();
    expect(() => validateHumanConfirmation(v2, {
      taskId,
      stage: "build-plan",
      subject: v2.subject_ref,
      requireAccepted: true,
      requireSubjectRef: true,
    })).not.toThrow();
    expect(() => validateHumanConfirmation(v3, {
      taskId,
      stage: "build-plan",
      subject: v3.subject_ref,
      requireAccepted: true,
      requireSubjectRef: true,
    })).not.toThrow();
    expect(v1).not.toHaveProperty("reply_text");
    expect(v2).not.toHaveProperty("step_slug");
    expect(v3.reply_text).toBeTruthy();
    expect(v3.step_slug).toBeTruthy();
    expect(new Map([
      ["v1", JSON.stringify(v1)],
      ["v2", JSON.stringify(v2)],
      ["v3", JSON.stringify(v3)],
    ])).toEqual(before);
    expect(new Map([...before].map(([name, value]) => [name, hash(value)]))).toEqual(beforeHashes);
  });
});
