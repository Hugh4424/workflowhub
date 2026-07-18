import { mkdtemp, mkdir, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { afterEach, describe, expect, it } from "vitest";

import {
  createArtifactRecord,
  createHealthFact,
  createTranscriptRecord,
  mergeArtifactRecords,
  mergeHealthFacts,
  mergeSkills,
  mergeTranscriptRecords,
  parseJsonl,
  toJsonl,
} from "../core/fact-indexes.mjs";
import { createTask } from "../core/task-handle.mjs";
import { createTaskKernel } from "../core/task-kernel.mjs";
import { openAcceptedWorkspace, prepareTaskWorkspace } from "../core/workspace.mjs";

const cleanup = [];
afterEach(async () => Promise.all(cleanup.splice(0).map((path) => rm(path, { recursive: true, force: true }))));
const exec = promisify(execFile);

async function createM14bFixture() {
  const root = await realpath(await mkdtemp(join(tmpdir(), "workflowhub-m14b-")));
  cleanup.push(root);
  const repo = join(root, "repo");
  await mkdir(repo, { recursive: true });
  await exec("git", ["init", "--quiet", repo]);
  await writeFile(join(repo, "README.md"), "fixture\n");
  await exec("git", ["-C", repo, "add", "README.md"]);
  await exec("git", ["-C", repo, "-c", "user.name=fixture", "-c", "user.email=fixture@example.test", "commit", "--quiet", "-m", "fixture"]);
  const taskPath = join(root, "Projects", "Fixture", "tasks", "m14b-fixture");
  const task = createTask({ storageRoot: root, taskPath, manifest: {
    schema_version: "1.0.0", project_name: "Fixture", task_id: "m14b-fixture",
    created_at: "2026-07-18T00:00:00.000Z", target_repo_root: repo, issue_ids: [], inputs: {},
  } });
  const candidate = prepareTaskWorkspace(task);
  const kernel = createTaskKernel(task);
  const published = kernel.publishAttempt("make-decision", { facts: { worktree_root: candidate.worktreeRoot, baseline_commit: candidate.baselineCommit } });
  const confirmation = kernel.confirmAttempt("make-decision", published.attempt_ref, "accepted").ref;
  kernel.acceptAttempt("make-decision", published.attempt_ref, confirmation);
  const workspace = openAcceptedWorkspace(task, kernel.readAccepted("make-decision"));
  const baseline = workspace.baselineCommit;
  await mkdir(join(workspace.worktreeRoot, "specs", task.identity.taskId), { recursive: true });
  await mkdir(join(workspace.worktreeRoot, "skills"), { recursive: true });
  await writeFile(join(workspace.worktreeRoot, "skills", "catalog.yaml"), "skills: []\n");
  await writeFile(join(workspace.worktreeRoot, "bundle.json"), "{}\n");
  const sentinel = async (name, value = "sentinel") => {
    const path = join(task.taskPath, name);
    await writeFile(path, value);
    return path;
  };
  return { root, task, repo, workspace, baseline, catalog: join(workspace.worktreeRoot, "skills", "catalog.yaml"), bundle: join(workspace.worktreeRoot, "bundle.json"), clock: () => "2026-07-18T00:00:00.000Z", sentinel };
}

function skill(overrides = {}) {
  return {
    name: "build-code", path: "workflows/build-code", version: "1", stage: "build-code", owner: "repo",
    source: "repo", portable: true, metrics_expected: true, subagent_friendly: true, ...overrides,
  };
}

function reversedBytes(merge, candidates) {
  const forward = merge(candidates);
  const reverse = merge([...candidates].reverse());
  expect(forward).toMatchObject({ ok: true });
  expect(reverse).toMatchObject({ ok: true });
  expect(toJsonl(forward.records)).toBe(toJsonl(reverse.records));
  return forward.records;
}

describe("M14b fact collection pure contracts", () => {
  it("merges idempotent transcript candidates deterministically", () => {
    const base = { record_kind: "transcript", id: "turn-1", run_id: "run-1", status: "present", payload: { text: "hello" } };
    const records = reversedBytes(mergeTranscriptRecords, [
      createTranscriptRecord({ ...base, source_ref: "source-z" }),
      createTranscriptRecord({ ...base, source_ref: "source-a" }),
    ]);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ source_ref: "source-a", status: "present" });
  });

  it("keeps a transcript conflict visible instead of choosing first or last", () => {
    const records = reversedBytes(mergeTranscriptRecords, [
      createTranscriptRecord({ record_kind: "transcript", id: "same", status: "present", source_ref: "z", payload: { value: 1 } }),
      createTranscriptRecord({ record_kind: "transcript", id: "same", status: "present", source_ref: "a", payload: { value: 2 } }),
    ]);
    expect(records[0]).toMatchObject({ status: "unknown", reason: "duplicate_id_conflict", content_hash: null, error: { code: "DUPLICATE_ID_CONFLICT" } });
    expect(records[0].variant_hashes).toHaveLength(2);
    expect(records[0].variant_source_refs).toEqual(["a", "z"]);
  });

  it("applies the fixed artifact conflict record and preserves required", () => {
    const records = reversedBytes(mergeArtifactRecords, [
      createArtifactRecord({ record_kind: "artifact", id: "same", ref: "z-ref", source_ref: "z-source", required: false, status: "present", content_hash: "a".repeat(64), run_id: "one", stage: "build" }),
      createArtifactRecord({ record_kind: "artifact", id: "same", ref: "a-ref", source_ref: "a-source", required: true, status: "present", content_hash: "b".repeat(64), run_id: "two", stage: "review" }),
    ]);
    expect(records[0]).toMatchObject({
      status: "unknown", content_hash: null, reason: "duplicate_id_conflict", required: true,
      ref: "a-ref", source_ref: "a-source", run_id: null, stage: null, error: { code: "DUPLICATE_ID_CONFLICT" },
    });
  });

  it("turns malformed lines into visible facts while retaining legal lines", () => {
    const legal = createTranscriptRecord({ record_kind: "transcript", id: "ok", status: "present", source_ref: "registered-source", payload: { ok: true } });
    const later = createTranscriptRecord({ record_kind: "transcript", id: "also-ok", status: "present", source_ref: "registered-source", payload: { ok: false } });
    const transcript = parseJsonl(`${JSON.stringify(legal)}\nnot json\n${JSON.stringify(later)}\n`, { source_ref: "registered-source" });
    expect(transcript).toHaveLength(3);
    expect(transcript[0]).toEqual(legal);
    expect(transcript[2]).toEqual(later);
    expect(transcript[1]).toMatchObject({ record_kind: "parse_error", id: "bad-line:registered-source:2", status: "unknown", reason: "malformed_line", error: { code: "MALFORMED_LINE" } });

    const artifact = parseJsonl('bad', { index: "artifact" });
    expect(artifact[0]).toMatchObject({ record_kind: "artifact", id: "bad-line:artifact-index:1", ref: "indexes/artifact-index.jsonl", source_ref: "indexes/artifact-index.jsonl", required: false, content_hash: null, reason: "unsupported_format", error: { code: "MALFORMED_LINE" } });

    const health = parseJsonl('bad', { index: "health" });
    expect(health[0]).toMatchObject({ fact_id: "bad-line:flow-health:1", domain: "artifact_missing", status: "unknown", reason: "malformed_line" });
  });

  it("rejects unsupported schema versions per file", () => {
    expect(mergeTranscriptRecords([createTranscriptRecord({ id: "old", schema_version: "v2" })])).toMatchObject({ ok: false, code: "UNSUPPORTED_FORMAT" });
    expect(mergeArtifactRecords([createArtifactRecord({ id: "old", ref: "ref", schema_version: "v2" })])).toMatchObject({ ok: false, code: "UNSUPPORTED_FORMAT" });
    expect(mergeHealthFacts([createHealthFact({ fact_id: "old", schema_version: "v2" })])).toMatchObject({ ok: false, code: "UNSUPPORTED_FORMAT" });
  });

  it("sorts health facts and exposes conflicts", () => {
    const records = reversedBytes(mergeHealthFacts, [
      createHealthFact({ fact_id: "z", domain: "review", status: "present", observed_value: true }),
      createHealthFact({ fact_id: "a", domain: "verify", status: "present", observed_value: true }),
    ]);
    expect(records.map((record) => record.fact_id)).toEqual(["a", "z"]);
    const conflict = mergeHealthFacts([
      createHealthFact({ fact_id: "same", domain: "review", status: "present", observed_value: true }),
      createHealthFact({ fact_id: "same", domain: "review", status: "missing", observed_value: null, reason: "not_found" }),
    ]);
    expect(conflict.records[0]).toMatchObject({ status: "unknown", reason: "duplicate_id_conflict", error: { code: "DUPLICATE_ID_CONFLICT" } });
  });

  it("keeps skills inventory closed, ordered, conflict-safe, and clock-driven", () => {
    const options = { schema_version: "v1", generated_at: "2026-07-18T00:00:00.000Z" };
    const result = mergeSkills([skill({ name: "verify", path: "workflows/verify" }), skill()], options);
    expect(result).toMatchObject({ ok: true, saved: true });
    expect(result.inventory).toEqual({ ...options, skills: [skill(), skill({ name: "verify", path: "workflows/verify" })] });
    expect(mergeSkills([skill(), skill({ owner: "other" })], options)).toMatchObject({ ok: false, saved: false, code: "DUPLICATE_ID_CONFLICT" });
    expect(mergeSkills([skill({ run_id: "forbidden" })], options)).toMatchObject({ ok: false, saved: false, code: "INVALID_RECORD" });
    expect(mergeSkills([skill()], { ...options, generated_at: "not-a-date" })).toMatchObject({ ok: false, saved: false, code: "INVALID_RECORD" });
  });

  it("provides a disposable task, git repo, accepted workspace, catalog, bundle, clock, and sentinel for later phases", async () => {
    const fixture = await createM14bFixture();
    expect(fixture).toMatchObject({ baseline: expect.stringMatching(/^[0-9a-f]{40}$/), clock: expect.any(Function) });
    expect(fixture.clock()).toBe("2026-07-18T00:00:00.000Z");
    await fixture.sentinel("before-indexes");
  });
});
