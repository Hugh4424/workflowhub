import { cp, mkdtemp, mkdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

import { afterEach, describe, expect, it, vi } from "vitest";
import Ajv2020 from "ajv/dist/2020.js";

import {
  createArtifactRecord,
  createHealthFact,
  createRuntimeFact,
  createRuntimeFactV2,
  createTranscriptRecord,
  mergeArtifactRecords,
  mergeHealthFacts,
  mergeRuntimeFacts,
  mergeRuntimeFactsV2,
  mergeSkills,
  mergeTranscriptRecords,
  parseJsonl,
  validateRuntimeFact,
  validateRuntimeFactV2,
  toJsonl,
} from "../core/fact-indexes.mjs";
import { buildArtifactProjection, buildHealthProjection, buildRuntimeFactProjection, buildRuntimeFactV2Projection, collectTaskFacts, createFactCollectorWriteTestHooks, createRuntimeFactReader, createRuntimeFactRegistry, createRuntimeFactV2Reader, createRuntimeFactV2Registry, createTranscriptSourceReader, createTranscriptSourceRegistry } from "../runtime/evidence/fact-collector.mjs";
import { bootstrapStage } from "../core/stage-context.mjs";
import { createTask } from "../core/task-handle.mjs";
import { createTaskKernel } from "../runtime/task/task-kernel.mjs";
import { acceptStageAttempt, runStage } from "../core/stage-runner.mjs";
import { openAcceptedWorkspace, prepareTaskWorkspace } from "../core/workspace.mjs";
import { writeHumanConfirmation } from "./helpers/human-confirmation.mjs";

const cleanup = [];
// This fixture creates real repositories and accepted worktrees. Under a full
// parallel suite it can legitimately exceed the global 15s test default.
vi.setConfig({ testTimeout: 60_000 });
afterEach(async () => Promise.all(cleanup.splice(0).map((path) => rm(path, {
  recursive: true, force: true, maxRetries: 3, retryDelay: 100,
}))));
const exec = promisify(execFile);
const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const INDEX_REFS = [
  "indexes/transcript-index.jsonl", "indexes/artifact-index.jsonl",
  "indexes/flow-health-facts.jsonl", "indexes/skills-inventory.json", "indexes/runtime-facts.jsonl", "indexes/runtime-facts-v2.jsonl",
];

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
    // Deliberately omit record_model: this acceptance fixture reads and writes
    // the legacy attempt family rather than exercising vNext publication.
    schema_version: "1.0.0", project_name: "Fixture", task_id: "m14b-fixture",
    created_at: "2026-07-18T00:00:00.000Z", target_repo_root: repo, issue_ids: [], inputs: {},
  } });
  const candidate = prepareTaskWorkspace(task);
  const decisionArtifactRef = `specs/${task.identity.taskId}/decision-log.md`;
  await mkdir(join(candidate.worktreeRoot, "specs", task.identity.taskId), { recursive: true });
  const decisionRaw = "# Decision\n";
  await writeFile(join(candidate.worktreeRoot, decisionArtifactRef), decisionRaw);
  const kernel = createTaskKernel(task);
  const decisionHash = createHash("sha256").update(decisionRaw).digest("hex");
  const decisionRef = `receipts/decision-log/${decisionHash}.md`;
  kernel.publishCanonicalRecord(decisionRef, decisionRaw);
  const decisionSnapshot = candidate.captureSnapshot();
  const published = kernel.publishAttempt("make-decision", { facts: {
    worktree_root: candidate.worktreeRoot, baseline_commit: candidate.baselineCommit,
    snapshot_tree: decisionSnapshot.tree, decision_ref: decisionRef,
    decision_hash: decisionHash,
  }, missing_items: ["support:audit"] });
  const confirmation = kernel.confirmAttempt("make-decision", published.attempt_ref, "accepted").ref;
  kernel.acceptAttempt("make-decision", published.attempt_ref, confirmation);
  const workspace = openAcceptedWorkspace(task, kernel.readAccepted("make-decision"));
  const contextFor = (stage) => bootstrapStage(stage, {
    mode: "sidecar", projectName: task.identity.projectName, taskId: task.identity.taskId, taskPath: task.taskPath,
  });
  const execute = async (stage, handler) => {
    if (stage === "build-spec") {
      const kernel = createTaskKernel(task);
      if (kernel.activeStageRun(stage, { required: false }) === null) {
        kernel.startStageRun(stage, { reason: "legacy M14b fixture publication" });
      }
    }
    const context = contextFor(stage);
    const attempt = await runStage(stage, context, async (...args) => {
      const result = await handler(...args);
      return { ...result, missing_items: [...new Set([...(result.missing_items ?? []), "support:audit"])] };
    });
    const request = { attemptRef: attempt.attempt_ref };
    if (stage === "build-plan") request.humanConfirmationRef = writeHumanConfirmation(context.kernel, stage, attempt);
    acceptStageAttempt(stage, context, request);
  };
  await execute("build-spec", async (worker) => {
    worker.artifacts.writeAtomic("spec.md", "# Fixture spec\n");
    return { facts: { spec_ref: worker.artifacts.reference("spec.md"), checkpoint: worker.createCheckpoint("build-spec") } };
  });
  await execute("build-plan", async (worker) => {
    worker.artifacts.writeAtomic("plan.md", "# Fixture plan\n");
    worker.artifacts.writeAtomic("tasks.md", "# Fixture tasks\n");
    return { facts: { plan_ref: worker.artifacts.reference("plan.md"), tasks_ref: worker.artifacts.reference("tasks.md"), checkpoint: worker.createCheckpoint("build-plan") } };
  });
  const baseline = workspace.baselineCommit;
  await mkdir(join(workspace.worktreeRoot, "specs", task.identity.taskId), { recursive: true });
  for (const relative of ["config", "skills", "workflows"]) {
    await cp(join(repositoryRoot, relative), join(workspace.worktreeRoot, relative), { recursive: true });
  }
  // The clean task runner must carry the authoritative runtime schema bundle.
  // The fixture carries only the authoritative runtime schema bundle.
  await mkdir(join(workspace.worktreeRoot, "runtime"), { recursive: true });
  await cp(join(repositoryRoot, "runtime", "schemas"), join(workspace.worktreeRoot, "runtime", "schemas"), { recursive: true });
  await cp(join(repositoryRoot, "THIRD_PARTY_NOTICES.md"), join(workspace.worktreeRoot, "THIRD_PARTY_NOTICES.md"));
  const sentinel = async (name, value = "sentinel") => {
    const path = join(task.taskPath, name);
    await writeFile(path, value);
    return path;
  };
  return { root, task, kernel, repo, workspace, baseline, decisionRef, catalog: join(workspace.worktreeRoot, "skills", "catalog.yaml"), clock: () => "2026-07-18T00:00:00.000Z", sentinel };
}

function collectionContext(fixture) {
  return bootstrapStage("build-code", {
    mode: "sidecar", projectName: fixture.task.identity.projectName, taskId: fixture.task.identity.taskId, taskPath: fixture.task.taskPath,
  });
}

function registry(entries = []) {
  return createTranscriptSourceRegistry(entries.map((entry) => ({
    source_id: entry.source_id, source_ref: entry.source_ref ?? "registered/transcript.jsonl",
    source_format: entry.source_format ?? "jsonl", source_version: entry.source_version ?? "v1",
    required: entry.required ?? true, reader: createTranscriptSourceReader(entry.read),
  })));
}

function runtimeRegistry(entries = []) {
  return createRuntimeFactRegistry(entries.map((entry) => ({
    fact_type: entry.fact_type,
    source_class: entry.source_class,
    registration_id: entry.registration_id ?? `${entry.fact_type}-source`,
    source_format: entry.source_format ?? "json",
    source_version: entry.source_version ?? "v1",
    reader: createRuntimeFactReader(entry.read),
  })));
}

function runtimeV2Registry(entries = []) {
  return createRuntimeFactV2Registry(entries.map((entry) => ({
    fact_type: entry.fact_type,
    source_class: entry.source_class,
    registration_id: entry.registration_id ?? `${entry.fact_type}-source`,
    source_format: entry.source_format ?? "json",
    source_version: entry.source_version ?? "v1",
    reader: createRuntimeFactV2Reader(entry.read),
  })));
}

function records(task, ref) {
  return task.readRecord(ref).trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
}

function file(task, ref) {
  return task.readRecord(ref);
}

function errorWithCode(code) {
  return Object.assign(new Error(code), { code });
}

function resultFor(result, ref) {
  return result.files.find((entry) => entry.ref === ref);
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
  it("AC-001/006/008 validates all runtime-facts.v1 value shapes and fixed fields", () => {
    const values = {
      cost: { receipt_id: "receipt-1", amount_minor: 12, currency: "USD", unit: "request" },
      conversation: { conversation_id: "conversation-1", message_id: "message-1", role: "user", message_created_at: "2026-07-18T00:00:00.000Z", channel: "chat" },
      session: { session_id: "session-1", adapter_id: "adapter-1", parent_session_id: null, started_at: "2026-07-18T00:00:00.000Z", ended_at: null },
      subagent: { agent_id: "agent-1", adapter_id: "adapter-1", parent_agent_id: "root-1", session_id: "session-1", started_at: "2026-07-18T00:00:00.000Z", ended_at: null },
      step_skip: { skipped: true, step_id: "T001", skip_reason: "already complete", authorizer: "planner", receipt_ref: "receipts/step-skip.json" },
      automation: { dispatch_id: "dispatch-1", orchestrator_id: "orchestrator-1", action: "run", outcome: "accepted", dispatched_at: "2026-07-18T00:00:00.000Z" },
    };
    for (const [factType, value] of Object.entries(values)) {
      const sourceClass = {
        cost: "billing_usage_receipt", conversation: "message_metadata", session: "launcher_adapter_registry",
        subagent: "launcher_adapter_registry", step_skip: "canonical_skipped_receipt", automation: "launcher_orchestrator_dispatch",
      }[factType];
      const objectId = { cost: "receipt-1", conversation: "message-1", session: "session-1", subagent: "agent-1", step_skip: "receipts/step-skip.json", automation: "dispatch-1" }[factType];
      const fact = createRuntimeFact({ fact_type: factType, value, source: { class: sourceClass, registration_id: "registered", object_id: objectId }, observed_at: "2026-07-18T00:00:00.000Z", run_id: "run-1", status: "present" });
      expect(validateRuntimeFact(fact), `${factType}: ${JSON.stringify(validateRuntimeFact(fact).errors)}`).toMatchObject({ ok: true });
      expect(Object.keys(fact)).toEqual(["schema_version", "collector_version", "fact_id", "fact_type", "status", "value", "source", "observed_at", "reason", "error", "scope"]);
    }
  });

  it("AC-007/012 makes runtime dedupe idempotent and exposes conflicting values", () => {
    const base = { fact_type: "cost", source: { class: "billing_usage_receipt", registration_id: "billing", object_id: "receipt" }, observed_at: "2026-07-18T00:00:00.000Z", run_id: "run-1", status: "present" };
    const left = createRuntimeFact({ ...base, value: { receipt_id: "receipt", amount_minor: 1, currency: "USD", unit: "request" } });
    const right = createRuntimeFact({ ...base, value: { receipt_id: "receipt", amount_minor: 2, currency: "USD", unit: "request" } });
    expect(mergeRuntimeFacts([left, left])).toMatchObject({ ok: true, records: [expect.objectContaining({ status: "present" })] });
    expect(mergeRuntimeFacts([left, right])).toMatchObject({ ok: true, records: [expect.objectContaining({ status: "unknown", value: null, reason: "duplicate_id_conflict", error: expect.objectContaining({ code: "RUNTIME_FACT_DUPLICATE_ID_CONFLICT" }) })] });
  });

  it("AC-004/005/006 projects privacy-safe metadata, skip receipt, and unknown reasons", () => {
    const projected = buildRuntimeFactProjection(runtimeRegistry([
      { fact_type: "conversation", source_class: "message_metadata", read: () => ({ conversation_id: "c", message_id: "m", body: "private" }) },
      { fact_type: "step_skip", source_class: "canonical_skipped_receipt", read: () => ({ skipped: true, step_id: "T001", skip_reason: "cached", authorizer: "planner", receipt_ref: "receipts/skip.json" }) },
      { fact_type: "automation", source_class: "launcher_orchestrator_dispatch", source_version: "v2", read: () => ({}) },
    ]), { runId: "run-1", now: () => new Date("2026-07-18T00:00:00.000Z") });
    expect(projected).toEqual(expect.arrayContaining([
      expect.objectContaining({ fact_type: "conversation", status: "unknown", reason: "unsupported_format", value: null }),
      expect.objectContaining({ fact_type: "step_skip", status: "present", value: expect.objectContaining({ skipped: true }) }),
      expect.objectContaining({ fact_type: "automation", status: "unknown", reason: "unsupported_format" }),
    ]));
    expect(JSON.stringify(projected)).not.toContain("private");
  });

  it("T005 keeps the production empty registry honest about unavailable sources", () => {
    const projected = buildRuntimeFactProjection(createRuntimeFactRegistry([]), { runId: "run-production", now: () => new Date("2026-07-18T00:00:00.000Z") });
    expect(projected).toHaveLength(5);
    expect(projected.every((fact) => fact.status === "missing" && fact.reason === "no_registered_source" && fact.value === null)).toBe(true);
    expect(projected.some((fact) => fact.fact_type === "step_skip")).toBe(false);
  });

  it("AC-006 merges idempotent transcript candidates deterministically", () => {
    const base = { record_kind: "transcript", id: "turn-1", run_id: "run-1", status: "present", payload: { text: "hello" } };
    const candidates = [
      createTranscriptRecord({ ...base, source_ref: "source-z" }),
      createTranscriptRecord({ ...base, source_ref: "source-z" }),
      createTranscriptRecord({ ...base, source_ref: "source-a" }),
    ];
    const forward = mergeTranscriptRecords(candidates);
    const reverse = mergeTranscriptRecords([...candidates].reverse());

    expect(forward).toMatchObject({ ok: true });
    expect(reverse).toMatchObject({ ok: true });
    expect(toJsonl(forward.records)).toBe(toJsonl(reverse.records));
    expect(forward.records).toEqual([expect.objectContaining({ source_ref: "source-a", status: "present" })]);
  });

  it("AC-007 keeps a transcript conflict visible instead of choosing first or last", () => {
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

  it("AC-005/015 rejects unsupported schema versions while collector version stays independent", () => {
    expect(mergeTranscriptRecords([createTranscriptRecord({ id: "old", schema_version: "v2" })])).toMatchObject({ ok: false, code: "UNSUPPORTED_FORMAT" });
    expect(mergeArtifactRecords([createArtifactRecord({ id: "old", ref: "ref", schema_version: "v2" })])).toMatchObject({ ok: false, code: "UNSUPPORTED_FORMAT" });
    expect(mergeHealthFacts([createHealthFact({ fact_id: "old", schema_version: "v2" })])).toMatchObject({ ok: false, code: "UNSUPPORTED_FORMAT" });
    const parserFix = createTranscriptRecord({ id: "same-schema", collector_version: "v2" });
    expect(parserFix).toMatchObject({ schema_version: "v1", collector_version: "v2" });
    expect(mergeTranscriptRecords([parserFix])).toMatchObject({ ok: true });
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

  it("projects review, verify, and handoff health with unknown then missing precedence", () => {
    const projections = [
      ["review", { record_kind: "review", stage: "build-code" }],
      ["verify", { record_kind: "stage_result", stage: "verify-code" }],
      ["handoff", { record_kind: "handoff", stage: "build-code" }],
    ];
    const healthStatus = (domain, kind, statuses) => buildHealthProjection(
      { snapshot: { tree: "clean" } }, [],
      statuses.map((status, index) => createArtifactRecord({
        ...kind, id: `${kind.record_kind}-${index}`, ref: `results/${index}.json`, source_ref: `results/${index}.json`, status,
      })),
      { closure: { ok: true } },
    ).find((fact) => fact.domain === domain).status;

    for (const [domain, kind] of projections) {
      expect(healthStatus(domain, kind, [])).toBe("unknown");
      expect(healthStatus(domain, kind, ["present"])).toBe("present");
      expect(healthStatus(domain, kind, ["present", "missing"])).toBe("missing");
      expect(healthStatus(domain, kind, ["present", "missing", "unknown"])).toBe("unknown");
    }
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

  it("REQ-020 reuses formal hashes and leaves unhashed artifact references null", () => {
    const taskId = "hash-projection";
    const attemptRef = "results/make-decision/attempt-0001.json";
    const formalStageHash = "a".repeat(64);
    const formalEvidenceHash = "b".repeat(64);
    const recordsByRef = new Map([
      [attemptRef, JSON.stringify({ task_id: taskId, stage: "make-decision", facts: {
        evidence_refs: [{ ref: "evidence/no-hash.json" }, { ref: "evidence/formal-hash.json", sha256: formalEvidenceHash }],
      } })],
      ["evidence/no-hash.json", "unhashed artifact bytes"],
      ["evidence/formal-hash.json", "different artifact bytes"],
    ]);
    const missing = () => { throw errorWithCode("ENOENT"); };
    const projection = buildArtifactProjection({
      task: {
        identity: { taskId },
        listStageAttemptRefs: (stage) => stage === "make-decision" ? [attemptRef] : [],
        readRecord: (ref) => recordsByRef.has(ref) ? recordsByRef.get(ref) : missing(),
      },
      kernel: {
        readAccepted: (stage) => {
          if (stage === "make-decision") return { accepted: { attempt_ref: "attempt-0001.json", integrity_hash: formalStageHash } };
          return missing();
        },
      },
      artifacts: { read: missing },
    });

    expect(projection).toEqual(expect.arrayContaining([
      expect.objectContaining({ record_kind: "stage_result", id: "make-decision:attempt-0001.json", content_hash: formalStageHash }),
      expect.objectContaining({ record_kind: "evidence", id: "evidence/no-hash.json", content_hash: null }),
      expect.objectContaining({ record_kind: "evidence", id: "evidence/formal-hash.json", content_hash: formalEvidenceHash }),
    ]));
  });
});

describe("M14b runtime-facts.v2 contracts", () => {
  it("AC-V2-001/002/003/017 validates all ten values and full-scope fact IDs", () => {
    const values = {
      cost: { cost_id: "cost-1", receipt_id: "usage-1", amount_minor: 12, currency: "USD", unit: "request", line_item_id: null, period_start: null, period_end: null },
      token: { usage_id: "usage-1", input_tokens: 2, output_tokens: 3, total_tokens: 9, unit: "tokens" },
      duration: { execution_id: "exec-1", duration_ms: 4, started_at: "2026-07-18T00:00:00.000Z", ended_at: "2026-07-18T00:00:01.000Z", measure: "wall_clock" },
      tool_count: { execution_id: "exec-1", total_calls: 3, successful_calls: 1, failed_calls: 1, unknown_calls: 1 },
      attribution: { attribution_id: "attr-1", subject_kind: "session", subject_id: "session-1", attributed_kind: "agent", attributed_id: "agent-1", relation: "launched_by" },
      review: { review_id: "review-1", stage: "build-code", verdict: "pass", finding_count: 0, reviewer_count: 1, evidence_id: "evidence-1" },
      verification: { verification_id: "verify-1", stage: "build-code", result: "pass", passed_count: 10, failed_count: 0, evidence_id: "evidence-2" },
      stage_reconciliation: { reconciliation_id: "reconcile-1", stage: "build-code", expected_topology_id: "topology-1", expected_step_id: "step-1", observed_state: "completed", terminal_fact_id: "terminal-1", skip_receipt_id: null },
      human_intervention: { intervention_id: "intervention-1", kind: "confirmation", actor_id: "member-1", action: "approve", reason: "scope locked", started_at: null, ended_at: null },
      automation_rate: { aggregation_id: "aggregate-1", scope_kind: "run", automated_count: 2, manual_count: 1, denominator: 3, rate_ppm: 666667, period_start: null, period_end: null },
    };
    const classes = {
      cost: "usage_receipt", token: "usage_receipt", duration: "usage_receipt", tool_count: "usage_receipt",
      attribution: "launcher_transcript_metadata", review: "review_record", verification: "verification_receipt",
      stage_reconciliation: "stage_topology_journal", human_intervention: "human_confirmation_record", automation_rate: "orchestrator_dispatch",
    };
    for (const [factType, value] of Object.entries(values)) {
      const fact = createRuntimeFactV2({ fact_type: factType, value, source: { class: classes[factType], registration_id: "registered", object_id: value[{
        cost: "cost_id", token: "usage_id", duration: "execution_id", tool_count: "execution_id", attribution: "attribution_id", review: "review_id", verification: "verification_id", stage_reconciliation: "reconciliation_id", human_intervention: "intervention_id", automation_rate: "aggregation_id",
      }[factType]] }, observed_at: "2026-07-18T00:00:00.000Z", run_id: "run-1", session_id: "session-1", stage: "build-code", status: "present" });
      expect(fact.fact_id).toMatch(/^rf2_[a-f0-9]{64}$/);
      expect(validateRuntimeFactV2(fact), `${factType}: ${JSON.stringify(validateRuntimeFactV2(fact).errors)}`).toMatchObject({ ok: true });
    }
  });

  it("AC-V2-005/006/007/008/009/010/011/016 projects direct sources without inference", () => {
    const classes = {
      cost: "usage_receipt", token: "usage_receipt", duration: "usage_receipt", tool_count: "usage_receipt",
      attribution: "launcher_transcript_metadata", review: "review_record", verification: "verification_receipt",
      stage_reconciliation: "stage_topology_journal", human_intervention: "human_confirmation_record", automation_rate: "orchestrator_dispatch",
    };
    const values = {
      cost: { cost_id: "cost-1", receipt_id: "usage-1", amount_minor: 1, currency: "USD", unit: "request", line_item_id: null, period_start: null, period_end: null },
      token: { usage_id: "usage-1", input_tokens: 1, output_tokens: 2, total_tokens: 8, unit: "tokens" },
      duration: { execution_id: "exec-1", duration_ms: 1, started_at: "2026-07-18T00:00:00.000Z", ended_at: "2026-07-18T00:00:01.000Z", measure: "active" },
      tool_count: { execution_id: "exec-1", total_calls: 2, successful_calls: 1, failed_calls: 0, unknown_calls: 1 },
      attribution: { attribution_id: "attr-1", subject_kind: "session", subject_id: "s", attributed_kind: "agent", attributed_id: "a", relation: "owns" },
      review: { review_id: "review-1", stage: "build-code", verdict: "pass", finding_count: 0, reviewer_count: 1, evidence_id: "e1" },
      verification: { verification_id: "verify-1", stage: "build-code", result: "pass", passed_count: 1, failed_count: 0, evidence_id: "e2" },
      stage_reconciliation: { reconciliation_id: "rec-1", stage: "build-code", expected_topology_id: "top-1", expected_step_id: "step-1", observed_state: "skipped", terminal_fact_id: null, skip_receipt_id: "skip-1" },
      human_intervention: { intervention_id: "human-1", kind: "confirmation", actor_id: "member-1", action: "approve", reason: "review", started_at: null, ended_at: null },
      automation_rate: { aggregation_id: "rate-1", scope_kind: "stage", automated_count: 1, manual_count: 1, denominator: 2, rate_ppm: 500000, period_start: null, period_end: null },
    };
    const projection = buildRuntimeFactV2Projection(runtimeV2Registry(Object.entries(values).map(([fact_type, value]) => ({ fact_type, source_class: classes[fact_type], read: () => value }))), { runId: "run-1", now: () => new Date("2026-07-18T00:00:00.000Z") });
    expect(projection).toHaveLength(10);
    expect(projection.every((fact) => fact.status === "present")).toBe(true);
    expect(projection.find((fact) => fact.fact_type === "token").value.total_tokens).toBe(8);
  });

  it("AC-V2-004/005/012/014 preserves missing, unknown, privacy and conflict states", () => {
    const projection = buildRuntimeFactV2Projection(runtimeV2Registry([
      { fact_type: "attribution", source_class: "launcher_transcript_metadata", read: () => ({ attribution_id: "a", body: "private" }) },
      { fact_type: "review", source_class: "review_record", read: () => { throw Object.assign(new Error("read"), { code: "EIO" }); } },
      { fact_type: "automation_rate", source_class: "orchestrator_dispatch", read: () => [] },
    ]), { runId: "run-1", now: () => new Date("2026-07-18T00:00:00.000Z") });
    expect(projection).toEqual(expect.arrayContaining([
      expect.objectContaining({ fact_type: "attribution", status: "unknown", reason: "unsupported_format", value: null }),
      expect.objectContaining({ fact_type: "review", status: "unknown", reason: "read_error", value: null }),
      expect.objectContaining({ fact_type: "automation_rate", status: "missing", reason: "not_found", value: null }),
      expect.objectContaining({ fact_type: "cost", status: "missing", reason: "no_registered_source", value: null }),
    ]));
    const base = createRuntimeFactV2({ fact_type: "token", value: { usage_id: "u", input_tokens: 1, output_tokens: 0, total_tokens: 1, unit: "tokens" }, source: { class: "usage_receipt", registration_id: "r", object_id: "u" }, observed_at: "2026-07-18T00:00:00.000Z", run_id: "run-1", status: "present" });
    const conflict = createRuntimeFactV2({ ...base, value: { ...base.value, total_tokens: 2 } });
    expect(mergeRuntimeFactsV2([base, conflict]).records[0]).toMatchObject({ status: "unknown", reason: "duplicate_id_conflict", value: null });
  });
});

describe("M14b fact collection acceptance", () => {
  it("AC-V2-001/004 collects both runtime index versions with deterministic no-source facts", async () => {
    const fixture = await createM14bFixture();
    const result = collectTaskFacts(collectionContext(fixture), { transcriptRegistry: registry(), now: () => new Date(fixture.clock()) });

    expect(result).toMatchObject({ status: "success" });
    expect(result.files.map((file) => file.ref)).toEqual([
      "indexes/transcript-index.jsonl", "indexes/artifact-index.jsonl",
      "indexes/flow-health-facts.jsonl", "indexes/skills-inventory.json", "indexes/runtime-facts.jsonl", "indexes/runtime-facts-v2.jsonl",
    ]);
    expect(result.files.every((file) => file.saved)).toBe(true);
    expect(fixture.task.readRecord("indexes/transcript-index.jsonl")).toContain('"id":"transcript-source-registry"');
    expect(fixture.task.readRecord("indexes/transcript-index.jsonl")).toContain('"reason":"no_registered_source"');
    expect(records(fixture.task, "indexes/runtime-facts.jsonl")).toEqual(expect.arrayContaining([
      expect.objectContaining({ fact_type: "cost", status: "missing", reason: "no_registered_source", value: null }),
      expect.objectContaining({ fact_type: "automation", status: "missing", reason: "no_registered_source", value: null }),
    ]));
    expect(records(fixture.task, "indexes/runtime-facts-v2.jsonl")).toHaveLength(10);
    expect(records(fixture.task, "indexes/runtime-facts-v2.jsonl").every((fact) => fact.status === "missing" && fact.reason === "no_registered_source" && fact.value === null)).toBe(true);
    expect(records(fixture.task, "indexes/artifact-index.jsonl")).toEqual(expect.arrayContaining([
      expect.objectContaining({ record_kind: "artifact", id: fixture.decisionRef, status: "present" }),
    ]));
  });

  it("AC-V2-013/015 writes v2 beside v1 without changing v1 facts", async () => {
    const fixture = await createM14bFixture();
    const result = collectTaskFacts(collectionContext(fixture), {
      transcriptRegistry: registry(),
      runtimeV2Registry: runtimeV2Registry([{ fact_type: "cost", source_class: "usage_receipt", read: () => ({ receipt_id: "usage-1", amount_minor: 7, currency: "USD", unit: "request" }) }]),
      runId: "run-v1",
      now: () => new Date(fixture.clock()),
    });
    expect(result.status).toBe("success");
    expect(records(fixture.task, "indexes/runtime-facts.jsonl")).toEqual(expect.arrayContaining([
      expect.objectContaining({ fact_type: "cost", status: "missing", reason: "no_registered_source" }),
    ]));
    expect(records(fixture.task, "indexes/runtime-facts-v2.jsonl")).toEqual(expect.arrayContaining([
      expect.objectContaining({ fact_type: "cost", status: "present", value: expect.objectContaining({ cost_id: "usage-1" }) }),
    ]));
  });

  it("AC-003/004/005 records missing, read failure, malformed JSONL, and unsupported sources without blocking legal records", async () => {
    const fixture = await createM14bFixture();
    const mixed = [
      JSON.stringify({ id: "first", run_id: "run-a", payload: { ordinal: 1 } }),
      "not-json",
      JSON.stringify({ id: "last", run_id: "run-a", payload: { ordinal: 3 } }),
    ].join("\n");
    const result = collectTaskFacts(collectionContext(fixture), {
      transcriptRegistry: registry([
        { source_id: "mixed", read: () => mixed },
        { source_id: "missing", read: () => { throw errorWithCode("ENOENT"); } },
        { source_id: "unreadable", read: () => { throw errorWithCode("EACCES"); } },
        { source_id: "future", source_version: "v2", read: () => "ignored" },
      ]), now: () => new Date(fixture.clock()),
    });
    const transcript = records(fixture.task, "indexes/transcript-index.jsonl");

    expect(result.status).toBe("success");
    expect(transcript).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "first", status: "present", line_number: 1 }),
      expect.objectContaining({ id: "last", status: "present", line_number: 3 }),
      expect.objectContaining({ id: "bad-line:mixed:2", status: "unknown", reason: "malformed_line", error: expect.objectContaining({ code: "MALFORMED_LINE" }) }),
      expect.objectContaining({ id: "missing", status: "missing", reason: "not_found" }),
      expect.objectContaining({ id: "unreadable", status: "unknown", reason: "read_error", error: expect.objectContaining({ code: "READ_ERROR" }) }),
      expect.objectContaining({ id: "future", status: "unknown", reason: "unsupported_format", error: expect.objectContaining({ code: "UNSUPPORTED_FORMAT" }) }),
    ]));
    expect(mixed).toBe([JSON.stringify({ id: "first", run_id: "run-a", payload: { ordinal: 1 } }), "not-json", JSON.stringify({ id: "last", run_id: "run-a", payload: { ordinal: 3 } })].join("\n"));
  });

  it("AC-005 records an unsupported format while a registered JSONL source continues", async () => {
    const fixture = await createM14bFixture();
    let unsupportedReads = 0;
    const result = collectTaskFacts(collectionContext(fixture), {
      transcriptRegistry: registry([
        { source_id: "unsupported-text", source_format: "text", read: () => { unsupportedReads += 1; return "not parsed"; } },
        { source_id: "supported-jsonl", source_format: "jsonl", read: () => JSON.stringify({ id: "legal-jsonl", payload: { retained: true } }) },
      ]), now: () => new Date(fixture.clock()),
    });
    const transcript = records(fixture.task, "indexes/transcript-index.jsonl");

    expect(result.status).toBe("success");
    expect(result.files.every((entry) => entry.saved)).toBe(true);
    expect(unsupportedReads).toBe(0);
    expect(transcript).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "unsupported-text", status: "unknown", reason: "unsupported_format", error: expect.objectContaining({ code: "UNSUPPORTED_FORMAT" }) }),
      expect.objectContaining({ id: "legal-jsonl", record_kind: "transcript", status: "present" }),
    ]));
  });

  it("AC-008 projects only explicit artifact references and records a declared missing target", async () => {
    const present = await createM14bFixture();
    collectTaskFacts(collectionContext(present), { transcriptRegistry: registry(), now: () => new Date(present.clock()) });
    const ref = present.decisionRef;
    expect(records(present.task, "indexes/artifact-index.jsonl")).toEqual(expect.arrayContaining([
      expect.objectContaining({ record_kind: "artifact", id: ref, ref, required: true, status: "present" }),
    ]));

    const absent = await createM14bFixture();
    await rm(join(absent.task.taskPath, absent.decisionRef));
    const result = collectTaskFacts(collectionContext(absent), { transcriptRegistry: registry(), now: () => new Date(absent.clock()) });
    expect(result.status).toBe("success");
    expect(records(absent.task, "indexes/artifact-index.jsonl")).toEqual(expect.arrayContaining([
      expect.objectContaining({ record_kind: "artifact", id: absent.decisionRef, status: "missing", reason: "not_found", required: true }),
    ]));
  }, 30_000);

  it("AC-009/010/014 validates the original M14a schema, all nine health domains, and non-blocking facts", async () => {
    const fixture = await createM14bFixture();
    const first = collectTaskFacts(collectionContext(fixture), {
      transcriptRegistry: registry([{ source_id: "failed-review-context", read: () => { throw errorWithCode("EACCES"); } }]),
      now: () => new Date(fixture.clock()),
    });
    const skills = JSON.parse(file(fixture.task, "indexes/skills-inventory.json"));
    const health = records(fixture.task, "indexes/flow-health-facts.jsonl");
    const schema = JSON.parse(await readFile(join(fixture.workspace.worktreeRoot, "runtime/schemas/skills-inventory.schema.json"), "utf8"));
    const validate = new Ajv2020({ strict: false, formats: { "date-time": true } }).compile(schema);
    const before = file(fixture.task, "indexes/skills-inventory.json");
    const second = collectTaskFacts(collectionContext(fixture), {
      transcriptRegistry: registry([{ source_id: "failed-review-context", read: () => { throw errorWithCode("EACCES"); } }]),
      now: () => new Date(fixture.clock()),
    });

    expect(first.status).toBe("success");
    expect(second.status).toBe("success");
    expect(validate(skills), JSON.stringify(validate.errors)).toBe(true);
    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties.skills.items.additionalProperties).toBe(false);
    expect(JSON.stringify(skills)).not.toContain("run_id");
    expect(JSON.stringify(skills)).not.toContain("entrypoint");
    expect(file(fixture.task, "indexes/skills-inventory.json")).toBe(before);
    expect(health.map((fact) => fact.domain)).toEqual([
      "artifact_missing", "handoff", "review", "skill_missing", "task_dir", "token_waste", "transcript", "verify", "worktree",
    ]);
    expect(health.find((fact) => fact.domain === "token_waste")).toMatchObject({ status: "unknown", observed_value: null });
    expect(health.every((fact) => !("severity" in fact) && !("root_cause" in fact) && !("fix" in fact))).toBe(true);
  });

  it("AC-011 rejects a forged identity before reader invocation or index rewrite", async () => {
    const fixture = await createM14bFixture();
    const context = collectionContext(fixture);
    collectTaskFacts(context, { transcriptRegistry: registry(), now: () => new Date(fixture.clock()) });
    const sentinels = new Map(INDEX_REFS.map((ref) => [ref, file(fixture.task, ref)]));
    let reads = 0;
    const forged = Object.freeze({ ...context, identity: { ...context.identity, taskId: "forged-task" } });

    expect(() => collectTaskFacts(forged, {
      transcriptRegistry: registry([{ source_id: "must-not-read", read: () => { reads += 1; return ""; } }]),
    })).toThrow(/WRONG_WORKTREE/);
    expect(reads).toBe(0);
    for (const [ref, bytes] of sentinels) expect(file(fixture.task, ref)).toBe(bytes);
  });

  it("AC-007/013 makes a skills conflict and a single unsupported target fail without false success", async () => {
    const fixture = await createM14bFixture();
    const initial = collectTaskFacts(collectionContext(fixture), { transcriptRegistry: registry(), now: () => new Date(fixture.clock()) });
    expect(initial.status).toBe("success");
    const skills = JSON.parse(file(fixture.task, "indexes/skills-inventory.json"));
    const conflict = structuredClone(skills.skills[0]);
    conflict.owner = "conflicting-owner";
    fixture.task.writeRecordAtomic("indexes/skills-inventory.json", `${JSON.stringify({ ...skills, skills: [conflict] }, null, 2)}\n`);
    const skillFailure = collectTaskFacts(collectionContext(fixture), { transcriptRegistry: registry(), now: () => new Date(fixture.clock()) });

    expect(skillFailure.status).toBe("failed");
    expect(resultFor(skillFailure, "indexes/skills-inventory.json")).toMatchObject({ saved: false, error: expect.objectContaining({ code: "DUPLICATE_ID_CONFLICT" }) });
    expect(resultFor(skillFailure, "indexes/transcript-index.jsonl")).toMatchObject({ saved: true });

    const unsupported = `${JSON.stringify(createTranscriptRecord({ id: "old", schema_version: "v2" }))}\n`;
    fixture.task.writeRecordAtomic("indexes/transcript-index.jsonl", unsupported);
    const writeFailure = collectTaskFacts(collectionContext(fixture), { transcriptRegistry: registry(), now: () => new Date(fixture.clock()) });
    expect(writeFailure.status).toBe("failed");
    expect(resultFor(writeFailure, "indexes/transcript-index.jsonl")).toMatchObject({ saved: false, error: expect.objectContaining({ code: "UNSUPPORTED_FORMAT" }) });
    expect(file(fixture.task, "indexes/transcript-index.jsonl")).toBe(unsupported);
    expect(resultFor(writeFailure, "indexes/artifact-index.jsonl")).toMatchObject({ saved: true });
  });

  it("AC-012 serializes two collector processes and makes health use the final merged transcript", async () => {
    const fixture = await createM14bFixture();
    const collector = join(repositoryRoot, "runtime/evidence/fact-collector.mjs");
    const contextModule = join(repositoryRoot, "core/stage-context.mjs");
    const script = `
      import { bootstrapStage } from ${JSON.stringify(contextModule)};
      import { collectTaskFacts, createTranscriptSourceReader, createTranscriptSourceRegistry } from ${JSON.stringify(collector)};
      const ctx = bootstrapStage("build-code", { mode: "sidecar", projectName: "Fixture", taskId: "m14b-fixture", taskPath: process.env.M14B_TASK_PATH });
      const id = process.env.M14B_TRANSCRIPT_ID;
      const registry = createTranscriptSourceRegistry([{ source_id: id, source_ref: "registered/transcript.jsonl", source_format: "jsonl", source_version: "v1", required: true, reader: createTranscriptSourceReader(() => JSON.stringify({ id, payload: { id } })) }]);
      const result = collectTaskFacts(ctx, { transcriptRegistry: registry, now: () => new Date("2026-07-18T00:00:00.000Z") });
      process.stdout.write(JSON.stringify(result));
    `;
    const run = (id) => exec(process.execPath, ["--input-type=module", "--eval", script], {
      env: { ...process.env, M14B_TASK_PATH: fixture.task.taskPath, M14B_TRANSCRIPT_ID: id },
    });
    const [left, right] = await Promise.all([run("left"), run("right")]);
    const outcomes = [JSON.parse(left.stdout), JSON.parse(right.stdout)];
    const transcript = records(fixture.task, "indexes/transcript-index.jsonl");
    const health = records(fixture.task, "indexes/flow-health-facts.jsonl");

    expect(outcomes, JSON.stringify(outcomes)).toEqual(expect.arrayContaining([
      expect.objectContaining({ status: "success" }), expect.objectContaining({ status: "success" }),
    ]));
    expect(transcript.filter((record) => record.record_kind === "transcript").map((record) => record.id)).toEqual(["left", "right"]);
    expect(health.find((fact) => fact.domain === "transcript")).toMatchObject({ status: "present", observed_value: 2 });
  });

  it.each([
    ["afterParentPrecheck", "pre-rename"],
    ["beforeFileFsync", "pre-rename"],
    ["afterOpenBeforeRename", "pre-rename"],
    ["beforeDirectoryFsync", "post-rename"],
  ])("AC-013 reports %s failure without false success or a partial transcript", async (hookName, boundary) => {
    const fixture = await createM14bFixture();
    const context = collectionContext(fixture);
    collectTaskFacts(context, { transcriptRegistry: registry(), now: () => new Date(fixture.clock()) });
    const oldBytes = file(fixture.task, "indexes/transcript-index.jsonl");
    let fired = false;
    const hooks = createFactCollectorWriteTestHooks({
      [hookName]() {
        if (!fired) {
          fired = true;
          throw Object.assign(new Error(`${hookName} injected`), { code: "INJECTED_WRITE_FAILURE" });
        }
      },
    });
    const result = collectTaskFacts(context, {
      transcriptRegistry: registry([{ source_id: "new-record", read: () => JSON.stringify({ id: "new-record", payload: { ok: true } }) }]),
      now: () => new Date(fixture.clock()), writeTestHooks: hooks,
    });
    const finalBytes = file(fixture.task, "indexes/transcript-index.jsonl");

    expect(fired).toBe(true);
    expect(result.status).toBe("failed");
    expect(resultFor(result, "indexes/transcript-index.jsonl")).toMatchObject({ saved: false, error: expect.objectContaining({ code: "INJECTED_WRITE_FAILURE" }) });
    expect(resultFor(result, "indexes/artifact-index.jsonl")).toMatchObject({ saved: true });
    expect(() => records(fixture.task, "indexes/transcript-index.jsonl")).not.toThrow();
    if (boundary === "pre-rename") expect(finalBytes).toBe(oldBytes);
    else expect(finalBytes === oldBytes || finalBytes.includes('"id":"new-record"')).toBe(true);
  });
});
