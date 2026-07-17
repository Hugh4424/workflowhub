import { execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadPhaseCapability } from "./helpers/side-effect-snapshot.mjs";

const schemaId = "https://workflowhub.dev/schemas/task-snapshot.v1.schema.json";

function git(root, ...args) {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" });
}

async function withGitFixture(run) {
  const root = await mkdtemp(path.join(tmpdir(), "workflowhub-snapshot-red-"));
  try {
    git(root, "init", "--quiet");
    await writeFile(path.join(root, "tracked.txt"), "baseline\n");
    git(root, "add", "tracked.txt");
    git(root, "-c", "user.name=WorkflowHub Test", "-c", "user.email=test@workflowhub.local", "commit", "--quiet", "-m", "baseline");
    await writeFile(path.join(root, "tracked.txt"), "changed\n");
    return await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function refs(root) {
  return execFileSync("git", ["-C", root, "for-each-ref", "--format=%(refname)%00%(objectname)%00%(objecttype)%00"]);
}

describe("AC-007/010 canonical task snapshot", () => {
  it("captures a schema-valid tree/blob/diff snapshot without moving real refs", () => withGitFixture(async (workspaceRoot) => {
    const before = refs(workspaceRoot);
    const capture = await loadPhaseCapability("../core/task-snapshot.mjs", "captureTaskSnapshotV1");
    const result = await capture({ schemaId, taskId: "task-a", workspaceRoot });
    expect(result).toMatchObject({ schema_id: schemaId, schema_version: "1.0.0", task_id: "task-a", baseline_commit: expect.stringMatching(/^[a-f0-9]{40}$/), tree_oid: expect.stringMatching(/^[a-f0-9]{40}$/), diff_hash: expect.stringMatching(/^[a-f0-9]{64}$/), blob_refs: expect.any(Array), worktree_status: expect.any(Array) });
    expect(result).not.toHaveProperty("checkpoint_commit");
    expect(refs(workspaceRoot)).toEqual(before);
  }));

  it("leaves real refs and HEAD unchanged when capture crashes after write-tree", () => withGitFixture(async (workspaceRoot) => {
    const before = { refs: refs(workspaceRoot), head: git(workspaceRoot, "rev-parse", "HEAD") };
    const capture = await loadPhaseCapability("../core/task-snapshot.mjs", "captureTaskSnapshotV1");
    await expect(capture({ schemaId, taskId: "task-a", workspaceRoot, injectCrash: "after-write-tree" })).rejects.toThrow(/crash/i);
    expect({ refs: refs(workspaceRoot), head: git(workspaceRoot, "rev-parse", "HEAD") }).toEqual(before);
  }));

  it("treats a real legacy checkpoint ref as read-only and never as new authority", () => withGitFixture(async (workspaceRoot) => {
    const before = refs(workspaceRoot);
    const readLegacy = await loadPhaseCapability("../core/task-snapshot.mjs", "readLegacyCheckpoint");
    expect(readLegacy({ workspaceRoot, commit: git(workspaceRoot, "rev-parse", "HEAD").trim() })).toMatchObject({ read_only: true, authorizes_operation: false });
    expect(refs(workspaceRoot)).toEqual(before);
  }));
});
