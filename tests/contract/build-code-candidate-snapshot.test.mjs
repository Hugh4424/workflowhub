import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { officialStageHandler } from "../../runtime/stage/stage-handlers.mjs";
import { writeCanonicalStageMaterials } from "../helpers/stage-outcome.mjs";

const roots = [];
const hash = (value) => createHash("sha256").update(value).digest("hex");
const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("build-code candidate snapshot compatibility", () => {
  it("uses candidateWorkspace for a full implementation receipt when Workspace is absent", async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-build-code-candidate-")));
    roots.push(root);
    const repo = join(root, "repo");
    mkdirSync(repo);
    git(repo, ["init", "-q", "-b", "main"]);
    git(repo, ["config", "user.name", "WorkflowHub tests"]);
    git(repo, ["config", "user.email", "tests@workflowhub.local"]);
    execFileSync("node", ["-e", "require('node:fs').writeFileSync('README.md', 'baseline\\n')"], { cwd: repo });
    git(repo, ["add", "."]);
    git(repo, ["commit", "-qm", "baseline"]);

    const task = createTask({
      storageRoot: root,
      manifest: {
        schema_version: "1.0.0",
        project_name: "WorkflowHub",
        task_id: "build-code-candidate",
        created_at: "2026-08-31T00:00:00Z",
        target_repo_root: repo,
        issue_ids: [],
        inputs: {},
        record_model: "vnext-single-write",
      },
    });
    const candidate = prepareTaskWorkspace(task);
    const artifacts = ArtifactDir.open(candidate.worktreeRoot, task);
    writeCanonicalStageMaterials(artifacts);
    execFileSync("node", ["-e", "require('node:fs').writeFileSync('README.md', 'implemented\\n')"], { cwd: candidate.worktreeRoot });
    const snapshot = candidate.captureSnapshot();
    const untracked = git(candidate.worktreeRoot, ["ls-files", "--others", "--exclude-standard"])
      .split("\n").filter(Boolean)
      .map((path) => ({ path, blob_oid: git(candidate.worktreeRoot, ["hash-object", "--", path]) }));
    const changed = [...new Set([
      ...git(candidate.worktreeRoot, ["diff", "--no-renames", "--name-only", candidate.baselineCommit, snapshot.commit]).split("\n").filter(Boolean),
      ...untracked.map(({ path }) => path),
    ])];
    const diffValue = {
      schema_version: "workflowhub-diff-evidence.v1",
      baseline_commit: candidate.baselineCommit,
      snapshot_head: snapshot.head,
      snapshot_tree: snapshot.tree,
      patch: "candidate fixture patch",
      untracked,
    };
    const diffRaw = `${JSON.stringify(diffValue, null, 2)}\n`;
    const diffRef = "quality/evidence/implementation/candidate.diff";
    const implementation = {
      schema_version: "workflowhub-receipt.v1",
      task_id: task.identity.taskId,
      stage: "build-code",
      producer: { stage: "build-code", component: "implementation", version: "fixture" },
      changed,
      snapshot_head: snapshot.head,
      snapshot_tree: snapshot.tree,
      snapshot_commit: snapshot.commit,
      diff_ref: diffRef,
      diff_hash: hash(diffRaw),
    };
    const output = "candidate tests passed\n";
    const test = {
      schema_version: "workflowhub-receipt.v1",
      task_id: task.identity.taskId,
      stage: "build-code",
      producer: { stage: "build-code", component: "tests", version: "fixture" },
      command: "true",
      command_hash: hash("true"),
      exit_code: 0,
      snapshot_head: snapshot.head,
      snapshot_tree: snapshot.tree,
      snapshot_commit: snapshot.commit,
      started_at: "2026-08-31T00:00:00Z",
      completed_at: "2026-08-31T00:00:01Z",
      output_ref: "quality/tests/output/candidate.output",
      output_hash: hash(output),
    };
    const records = new Map([
      ["quality/evidence/implementation.json", implementation],
      ["quality/tests/candidate.json", test],
    ]);
    const worker = {
      stage: "build-code",
      identity: { taskId: task.identity.taskId },
      workflowRunId: "candidate-run",
      manifest: { record_model: "vnext-single-write" },
      currentMaterialRevision: "revision-" + "a".repeat(64),
      candidateWorkspace: candidate,
      readArtifact: (name) => artifacts.read(name),
      artifactRef: (name) => artifacts.reference(name),
      readReceipt: (ref) => {
        const value = records.get(ref);
        if (!value) throw new Error(`missing fixture receipt: ${ref}`);
        const raw = `${JSON.stringify(value, null, 2)}\n`;
        return { value, sha256: hash(raw) };
      },
      readEvidence: (ref) => {
        if (ref !== diffRef) throw new Error(`missing fixture evidence: ${ref}`);
        return { bytes: diffRaw, sha256: hash(diffRaw) };
      },
      recordConsumerInvocation: () => {},
    };
    const result = await officialStageHandler("build-code")(worker, {
      receipts: {
        implementation: "quality/evidence/implementation.json",
        tests: "quality/tests/candidate.json",
      },
    });
    expect(result.facts.tests.exit_code).toBe(0);
    expect(result.facts.changed).toEqual(expect.arrayContaining(changed));
  });
});
