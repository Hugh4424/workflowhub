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
import { initializeTaskStore, readTaskFacts } from "../../runtime/task/task-store.mjs";
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
  it("writes one current sixteen-key stage row only after a successful in-place publication retry", async () => {
    const fixture = state();
    const seam = publicationSeam(fixture);
    const handler = vi.fn(async () => ({ facts: { source: "valid-handler-result" }, evidence_refs: [] }));

    await runStage("build-code", fixture.context, handler, {}, { publishStage: seam.publishStage });

    const facts = readTaskFacts(fixture.task.taskPath);
    expect(facts).toHaveLength(1);
    const row = facts[0];
    const materialDigest = materialRevisionFromValues(seam.attempts[0].materials.values).replace(/^revision-/, "");
    // The frozen sixteen-key field table, with the empty-with-reason encoding.
    expect(Object.keys(row).sort()).toEqual([
      "close_action", "created_at", "evidence", "finding_dispositions", "handoff", "layer_states",
      "material_digest", "record_kind", "review_origin", "review_result_ref", "serious_issue_disposition",
      "snapshot_tree", "source", "spec_analyze", "stage", "task_id",
    ]);
    expect(row).toMatchObject({
      record_kind: "stage",
      task_id: fixture.task.identity.taskId,
      stage: "build-code",
      source: `protocol_error:${TRACE_CLASS}`,
      created_at: expect.any(String),
      review_origin: "not_run",
    });
    expect(row.material_digest).toEqual({ value: materialDigest });
    expect(row.evidence.value[0]).toMatchObject({ command: `protocol-error:${TRACE_CLASS}`, exit_code: 0, failure_signature: TRACE_STATUS });
    expect(row.close_action.value).toBeNull();
    expect(typeof row.close_action.reason).toBe("string");
    expect(Number.isFinite(Date.parse(row.created_at))).toBe(true);
    expect(seam.publishStage).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenCalledOnce();

    // A repaired trace replaces its own stage row instead of appending one.
    // Compare the durable bytes against an explicitly constructed expected
    // row: parsing the same facts.jsonl line that produced `row` would be a
    // self-comparison and could never fail.
    const rawLines = readFileSync(join(fixture.task.taskPath, "facts.jsonl"), "utf8").trimEnd().split("\n");
    expect(rawLines).toHaveLength(1);
    expect(JSON.parse(rawLines[0])).toEqual({
      record_kind: "stage",
      task_id: fixture.task.identity.taskId,
      stage: "build-code",
      source: `protocol_error:${TRACE_CLASS}`,
      created_at: expect.any(String),
      material_digest: { value: materialDigest },
      snapshot_tree: { value: seam.attempts[0].snapshot.tree, reason: "snapshot tree recovered from the authenticated snapshot" },
      review_origin: "not_run",
      review_result_ref: { value: null, reason: "a protocol-error trace reports no review result" },
      finding_dispositions: [],
      spec_analyze: { value: null, reason: "a protocol-error trace runs no spec analysis" },
      evidence: {
        value: [{
          command: `protocol-error:${TRACE_CLASS}`,
          exit_code: 0,
          failure_signature: TRACE_STATUS,
        }],
      },
      layer_states: {
        implementation_completion: "completed",
        stage_quality: "incomplete",
        delivery: "unavailable",
        task_closure: "unavailable",
      },
      serious_issue_disposition: { value: null, reason: "a protocol-error trace is a repair record, not a serious-issue disposition" },
      close_action: { value: null, reason: "stage rows never carry a close action" },
      handoff: { value: null, reason: "a protocol-error trace hands nothing over" },
    });
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
