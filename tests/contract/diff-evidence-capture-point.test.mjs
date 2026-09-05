import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTaskKernel } from "../../runtime/task/task-kernel.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { officialStageHandler } from "../../runtime/stage/stage-handlers.mjs";
import { captureWorkspaceSnapshot, writeOfficialComponentReceipt } from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { prepareTaskWorkspace, openAcceptedWorkspace } from "../../runtime/task/workspace.mjs";
import { writeCanonicalStageMaterials } from "../helpers/stage-outcome.mjs";

const roots = [];
const hash = (value) => createHash("sha256").update(value).digest("hex");
const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

function fixture(taskId = `diff-capture-${Date.now()}-${Math.random().toString(16).slice(2)}`) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-diff-capture-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub tests"]);
  git(repo, ["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "tracked.txt"), "base\n");
  git(repo, ["add", "tracked.txt"]);
  git(repo, ["commit", "-qm", "baseline"]);
  const baseline = git(repo, ["rev-parse", "HEAD"]);
  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      project_name: "Demo",
      task_id: taskId,
      created_at: "2026-09-04T00:00:00Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });
  const candidate = prepareTaskWorkspace(task);
  const workspace = openAcceptedWorkspace(task, {
    facts: { worktree_root: candidate.worktreeRoot, baseline_commit: baseline },
  });
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  writeCanonicalStageMaterials(artifacts);
  return { root, task, candidate, workspace, artifacts, baseline };
}

function testReceipt(task, implementation, name = "t6-tests") {
  const command = "true";
  const output = "diff capture fixture passed\n";
  return {
    schema_version: "workflowhub-receipt.v1",
    task_id: task.identity.taskId,
    stage: "build-code",
    producer: { stage: "build-code", component: "tests", version: "fixture" },
    command,
    command_hash: hash(command),
    exit_code: 0,
    snapshot_head: implementation.snapshot_head,
    snapshot_tree: implementation.snapshot_tree,
    snapshot_commit: implementation.snapshot_commit,
    started_at: "2026-09-04T00:00:00Z",
    completed_at: "2026-09-04T00:00:01Z",
    output_ref: `quality/tests/output/${name}`,
    output_hash: hash(output),
  };
}

function workerFor({ task, workspace, candidate, artifacts }) {
  return {
    stage: "build-code",
    identity: { taskId: task.identity.taskId },
    workflowRunId: "diff-capture-run",
    manifest: { record_model: "vnext-single-write" },
    currentMaterialRevision: `revision-${"a".repeat(64)}`,
    workspace,
    candidateWorkspace: candidate,
    readArtifact: (name) => artifacts.read(name),
    artifactRef: (name) => artifacts.reference(name),
    snapshotWorkspace: () => captureWorkspaceSnapshot(workspace, task.identity.taskId),
    readReceipt: (ref) => {
      const raw = task.readRecord(ref);
      return { value: JSON.parse(raw), sha256: hash(raw) };
    },
    readEvidence: (ref) => {
      const bytes = task.readRecord(ref);
      return { bytes, sha256: hash(bytes) };
    },
    recordConsumerInvocation: () => {},
  };
}

function publishTestReceipt(task, implementation, name = "t6-tests") {
  const ref = `quality/tests/${name}.json`;
  createTaskKernel(task).publishCanonicalRecord(ref, `${JSON.stringify(testReceipt(task, implementation, name), null, 2)}\n`);
  return ref;
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("build-code diff evidence capture point", () => {
  it("replays the historical untracked mismatch fixture and remains fail-closed", async () => {
    const state = fixture("diff-capture-history");
    writeFileSync(join(state.workspace.worktreeRoot, "new.txt"), "current bytes\n");
    const snapshot = state.workspace && captureWorkspaceSnapshot(state.workspace, state.task.identity.taskId);
    const fixtureValue = JSON.parse(readFileSync(new URL("../fixtures/diff-evidence/historical-untracked-mismatch.json", import.meta.url), "utf8"));
    const diffValue = {
      ...fixtureValue,
      baseline_commit: state.baseline,
      snapshot_head: snapshot.head,
      snapshot_tree: snapshot.tree,
    };
    const diffRaw = `${JSON.stringify(diffValue, null, 2)}\n`;
    const kernel = createTaskKernel(state.task);
    const diffRef = "quality/evidence/implementation/historical-mismatch.diff";
    kernel.publishCanonicalRecord(diffRef, diffRaw);
    const implementation = {
      schema_version: "workflowhub-receipt.v1",
      task_id: state.task.identity.taskId,
      stage: "build-code",
      producer: { stage: "build-code", component: "implementation", version: "fixture" },
      changed: ["new.txt"],
      snapshot_head: snapshot.head,
      snapshot_tree: snapshot.tree,
      snapshot_commit: snapshot.commit,
      diff_ref: diffRef,
      diff_hash: hash(diffRaw),
    };
    kernel.publishCanonicalRecord("quality/evidence/implementation.json", `${JSON.stringify(implementation, null, 2)}\n`);
    const testsRef = publishTestReceipt(state.task, implementation, "history-tests");
    const worker = workerFor(state);
    await expect(officialStageHandler("build-code")(worker, {
      receipts: { implementation: "quality/evidence/implementation.json", tests: testsRef },
    })).rejects.toThrow(/implementation untracked evidence hash mismatch: new\.txt/);
  });

  it("freezes the untracked blob at the normal publication point and accepts an unchanged workspace", async () => {
    const state = fixture("diff-capture-normal");
    writeFileSync(join(state.workspace.worktreeRoot, "new.txt"), "current bytes\n");
    const implementation = writeOfficialComponentReceipt({
      task: state.task,
      workspace: state.workspace,
      stage: "build-code",
      component: "implementation",
      payload: {},
    });
    const diff = JSON.parse(state.task.readRecord(implementation.value.diff_ref));
    expect(diff.untracked).toEqual(expect.arrayContaining([
      { path: "new.txt", blob_oid: git(state.workspace.worktreeRoot, ["hash-object", "--", "new.txt"]) },
    ]));
    const testsRef = publishTestReceipt(state.task, implementation.value, "normal-tests");
    const result = await officialStageHandler("build-code")(workerFor(state), {
      receipts: { implementation: implementation.ref, tests: testsRef },
    });
    expect(result.facts.changed).toContain("new.txt");
  });

  it("keeps verify fail-closed when an untracked file changes after publication", async () => {
    const state = fixture("diff-capture-mutated");
    writeFileSync(join(state.workspace.worktreeRoot, "new.txt"), "before publication\n");
    const implementation = writeOfficialComponentReceipt({
      task: state.task,
      workspace: state.workspace,
      stage: "build-code",
      component: "implementation",
      payload: {},
    });
    const testsRef = publishTestReceipt(state.task, implementation.value, "mutated-tests");
    writeFileSync(join(state.workspace.worktreeRoot, "new.txt"), "after publication\n");
    await expect(officialStageHandler("build-code")(workerFor(state), {
      receipts: { implementation: implementation.ref, tests: testsRef },
    })).rejects.toThrow(/implementation untracked evidence hash mismatch: new\.txt/);
  });

  it("publishes one idempotent diff and implementation pair under the capture lock", () => {
    const state = fixture("diff-capture-idempotent");
    writeFileSync(join(state.workspace.worktreeRoot, "new.txt"), "same bytes\n");
    const first = writeOfficialComponentReceipt({ task: state.task, workspace: state.workspace, stage: "build-code", component: "implementation", payload: {} });
    const second = writeOfficialComponentReceipt({ task: state.task, workspace: state.workspace, stage: "build-code", component: "implementation", payload: {} });
    expect(second).toMatchObject({ ref: first.ref, sha256: first.sha256 });
    expect(state.task.readRecord(first.value.diff_ref)).toBe(state.task.readRecord(second.value.diff_ref));
    expect(existsSync(join(state.task.taskPath, "locks", "implementation-capture.execution.lock"))).toBe(false);
  });

  it("preflights both immutable targets so an interrupted conflict leaves no half diff", () => {
    const state = fixture("diff-capture-rollback");
    writeFileSync(join(state.workspace.worktreeRoot, "new.txt"), "rollback bytes\n");
    const kernel = createTaskKernel(state.task);
    kernel.publishCanonicalRecord("quality/evidence/implementation.json", "occupied implementation\n");
    expect(() => writeOfficialComponentReceipt({
      task: state.task,
      workspace: state.workspace,
      stage: "build-code",
      component: "implementation",
      payload: {},
    })).toThrow(/implementation snapshot receipt already exists with different content/);
    const implementationDir = join(state.task.taskPath, "quality", "evidence", "implementation");
    expect(existsSync(implementationDir) ? execFileSync("find", [implementationDir, "-type", "f", "-name", "*.diff"], { encoding: "utf8" }).trim() : "").toBe("");
  });
});
