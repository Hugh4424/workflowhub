import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { canonicalJson } from "../../runtime/evidence/canonical-source.mjs";
import { runStage } from "../../runtime/stage/stage-runner.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { materialRevisionFromValues } from "../../runtime/task/git-worktree-snapshot.mjs";
import { initializeTaskStore, readTaskFacts, readTaskIndex } from "../../runtime/task/task-store.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";

const roots = [];
const TRACE_CLASS = "stage_publication_transient";
const TRACE_STATUS = "repaired_in_place";

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function transientPublicationError() {
  const error = new Error("protocol publication failed transiently");
  error.code = "PROTOCOL_PUBLICATION_FAILURE";
  return error;
}

function state() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-protocol-trace-")));
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
      schema_version: "1.0.0",
      project_name: "WorkflowHub",
      task_id: "protocol-trace",
      created_at: "2026-09-03T00:00:00Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });
  initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
  const candidateWorkspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidateWorkspace.worktreeRoot, task);
  for (const [name, content] of Object.entries({
    "decision-log.md": "# Decision log\n",
    "spec.md": "# Spec\n\n## Acceptance Criteria\n\n- **AC-001**：protocol contract.\n",
    "plan.md": "# Plan\n",
    "tasks.md": "# Tasks\n",
  })) artifacts.writeAtomic(name, content);
  const kernel = createTaskKernel(task, { candidateWorkspace });
  return {
    task,
    context: {
      stage: "build-code",
      task,
      kernel,
      identity: { taskId: task.identity.taskId, projectName: "WorkflowHub" },
      workflowRunId: "run-protocol-trace",
      manifest: task.manifest,
      artifacts,
      candidateWorkspace,
    },
  };
}

function publicationSeam(fixture) {
  const attempts = [];
  const snapshot = fixture.context.candidateWorkspace.captureSnapshot();
  const values = ["decision-log.md", "spec.md", "plan.md", "tasks.md"].map((name) => [name, fixture.context.artifacts.read(name)]);
  const materials = { values, revision: materialRevisionFromValues(values) };
  const publishStage = vi.fn(({ publish }) => {
    attempts.push({ snapshot, materials });
    if (attempts.length === 1) throw transientPublicationError();
    return publish();
  });
  return { attempts, publishStage };
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("protocol error trace contract", () => {
  it("RED: appends one existing ten-field fact only after a successful in-place publication retry", async () => {
    const fixture = state();
    const seam = publicationSeam(fixture);
    const handler = vi.fn(async () => ({ facts: { source: "valid-handler-result" }, evidence_refs: [] }));

    await runStage("build-code", fixture.context, handler, {}, { publishStage: seam.publishStage });

    const facts = readTaskFacts(fixture.task.taskPath);
    expect(facts).toHaveLength(1);
    const fact = facts[0];
    const materialDigest = materialRevisionFromValues(seam.attempts[0].materials.values).replace(/^revision-/, "");
    const tracePayload = {
      stage: "build-code",
      class_id: TRACE_CLASS,
      occurred_at: fact.created_at,
      status: TRACE_STATUS,
    };
    expect(Object.keys(fact).sort()).toEqual([
      "content_hash", "created_at", "invocation_id", "material_digest", "output_ref",
      "source", "source_digest", "stage", "status", "task_id",
    ]);
    expect(fact).toMatchObject({
      task_id: fixture.task.identity.taskId,
      stage: "build-code",
      material_digest: materialDigest,
      source_digest: seam.attempts[0].snapshot.source_digest,
      invocation_id: fixture.context.workflowRunId,
      source: `protocol_error:${TRACE_CLASS}`,
      status: TRACE_STATUS,
      created_at: expect.any(String),
      output_ref: "facts.jsonl",
    });
    expect(Number.isFinite(Date.parse(fact.created_at))).toBe(true);
    expect(fact.content_hash).toBe(sha256(canonicalJson(tracePayload)));
    expect(seam.publishStage).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenCalledOnce();

    const rawLines = readFileSync(join(fixture.task.taskPath, "facts.jsonl"), "utf8").trimEnd().split("\n");
    const factRef = "facts.jsonl#1";
    const factHash = sha256(`${rawLines[0]}\n`);
    const indexEntry = readTaskIndex(fixture.task.taskPath).facts.find(({ ref }) => ref === factRef);
    expect(indexEntry).toMatchObject({ ref: factRef, sha256: factHash, content_hash: fact.content_hash, external_raw_ref: "facts.jsonl" });
  });

  it("does not append a repaired fact when the one allowed publication retry fails", async () => {
    const fixture = state();
    const publishStage = vi.fn(() => { throw transientPublicationError(); });
    const handler = vi.fn(async () => ({ facts: { source: "valid-handler-result" }, evidence_refs: [] }));

    await expect(runStage("build-code", fixture.context, handler, {}, { publishStage })).rejects.toMatchObject({
      code: "PROTOCOL_PUBLICATION_FAILURE",
    });
    expect(publishStage).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenCalledOnce();
    expect(readTaskFacts(fixture.task.taskPath)).toEqual([]);
  });

  it("reuses the exact publication bytes when a transient seam failure follows publication", async () => {
    const fixture = state();
    let firstRefs = null;
    let firstRecords = null;
    let firstPublished = null;
    const publishStage = vi.fn(async ({ publish }) => {
      const published = await publish();
      const refs = [...fixture.task.listCanonicalQualityFactRefs()].sort();
      const records = Object.fromEntries(refs.map((ref) => [ref, fixture.task.readRecord(ref)]));
      if (firstRefs === null) {
        firstRefs = refs;
        firstRecords = records;
        firstPublished = published;
        throw transientPublicationError();
      }
      expect(refs).toEqual(firstRefs);
      expect(records).toEqual(firstRecords);
      expect(published).toBe(firstPublished);
      return published;
    });
    const handler = vi.fn(async () => ({ facts: { source: "valid-handler-result" }, evidence_refs: [] }));

    await runStage("build-code", fixture.context, handler, {}, { publishStage });

    expect(publishStage).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenCalledOnce();
    expect(readTaskFacts(fixture.task.taskPath)).toHaveLength(1);
  });

  it("surfaces fact append failure without a third publication or handler retry", async () => {
    const fixture = state();
    rmSync(join(fixture.task.taskPath, "facts.jsonl"));
    const seam = publicationSeam(fixture);
    const handler = vi.fn(async () => ({ facts: { source: "valid-handler-result" }, evidence_refs: [] }));

    await expect(runStage("build-code", fixture.context, handler, {}, { publishStage: seam.publishStage }))
      .rejects.toMatchObject({ code: "ENOENT" });
    expect(seam.publishStage).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenCalledOnce();
    expect(existsSync(join(fixture.task.taskPath, "facts.jsonl"))).toBe(false);
  });

  it("keeps legacy outcome and authorization fixture bytes readable and unchanged", () => {
    for (const file of ["legacy-stage-outcome.json", "legacy-authorization-record.json"]) {
      const path = new URL(`../fixtures/protocol-errors/${file}`, import.meta.url);
      const before = readFileSync(path);
      const beforeHash = sha256(before.toString("utf8"));
      expect(JSON.parse(before.toString("utf8"))).toBeTypeOf("object");
      const after = readFileSync(path);
      expect(sha256(after.toString("utf8"))).toBe(beforeHash);
      expect(after.equals(before)).toBe(true);
    }
  });
});
