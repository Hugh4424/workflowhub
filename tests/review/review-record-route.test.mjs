import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import {
  recordSimpleReviewRequest as recordRuntimeRequest,
  recordSimpleReviewResult,
  recordTaskBoundE2eReviewResult,
  recordTaskBoundE2eReviewUnavailable,
} from "../../runtime/review/review-record-route.mjs";
import { validateSchema } from "../../runtime/review/schema-validator.mjs";
import { authenticateStageReviewResult } from "../../runtime/evidence/freshness.mjs";
import { authenticateCurrentOcrReviewFact } from "../../runtime/stage/stage-runner.mjs";
import { resolveReviewRouteIdentity } from "../../runtime/review/review-route-identity.mjs";
import { aggregateCanonicalProviderResults } from "../../runtime/review/canonical-review-result.mjs";
import { validateStageSpecAnalyzeProfile } from "../../runtime/stage/stage-content-contracts.mjs";
import { createSimpleReviewPacket, runSimpleReview } from "../../skills/wh-review/scripts/simple-review-runner.mjs";

// Only the fixture dependency is simulated; production defaults still resolve host configuration.
const fixtureRouteIdentity = () => ({ route_identity: "a".repeat(64) });
const recordRequest = (options) => recordRuntimeRequest({
  resolveRouteIdentity: fixtureRouteIdentity,
  materialIdForRequest: (input) => createSimpleReviewPacket(input).material_id,
  ...options,
});
const recordSimpleReviewRequest = recordRequest;

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function makeTask() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "review-record-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub review record test"]);
  git(["config", "user.email", "review-record@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "review record fixture\n", "utf8");
  git(["add", "."]);
  git(["commit", "-qm", "fixture"]);
  const taskId = randomUUID();
  const task = createTask({
    storageRoot: root,
    taskPath: join(root, "Projects", "workflowhub", "tasks", taskId),
    manifest: {
      schema_version: "1.0.0",
      project_name: "workflowhub",
      task_id: taskId,
      created_at: "2026-08-21T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });
  const candidateWorkspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidateWorkspace.worktreeRoot, task);
  const kernel = createTaskKernel(task, { candidateWorkspace, artifacts });
  return { task, kernel, artifacts, candidateWorkspace };
}

function baseResult() {
  return {
    status: "available",
    stage: "build-code",
    review_track: null,
    review_kind: null,
    material_id: "8192849eab3a861772ed1e409e72ff43eae462b16bc6437193483fc905d8260d",
    runtime_id: "runtime-123",
    outcome: "completed",
    provider_results: [
      {
        provider: "codex/luna",
        status: "completed",
        identity: { provider: "codex/luna", adapter: "codex", source_id: "codex/luna", config_id: "cfg", model: "gpt-5.6-luna" },
        error: null,
        timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 },
        usage: null,
        evidence_anchor_valid: [true],
      },
    ],
    findings: [
      {
        severity: "major",
        path: "materials/06-implementation_summary.md",
        line: 1,
        issue: "implementation material is thin",
        recommendation: "add real code",
        root_cause: "smoke test",
        evidence_kind: "direct",
        evidence: "only summary text",
        provider: "codex/luna",
      },
    ],
  };
}

function contentHash(text) {
  return createHash("sha256").update(text).digest("hex");
}

const findingFor = (provider, issue, line) => ({
  ...baseResult().findings[0],
  provider,
  path: "materials/06-implementation_summary.md",
  line,
  issue,
  root_cause: issue,
});

describe("P2 prewritten review union and anchor oracles", () => {
  it("ORACLE-P2-UNION: records every successful member and labels single versus corroborated findings", () => {
    const { task, kernel } = makeTask();
    const first = baseResult().provider_results[0];
    const second = {
      ...first,
      provider: "opencode/pax3.8",
      identity: { provider: "opencode/pax3.8", adapter: "opencode", source_id: "opencode/pax3.8", config_id: "cfg-pax", model: "pax/qwen3.8" },
      evidence_anchor_valid: [true, true],
    };
    const failed = {
      provider: "kimi/coding", status: "failed", error: { code: "PROCESS_DEAD", message: "transport failed" },
      timing: { started_at_ms: 3, completed_at_ms: 4, duration_ms: 1 }, usage: null, evidence_anchor_valid: [],
    };
    const raw = {
      ...baseResult(), status: "available-with-failures", outcome: "partial", minimum_heterologous: 1,
      provider_results: [{ ...first, evidence_anchor_valid: [true, true] }, second, failed],
      findings: [
        findingFor("codex/luna", "shared state update skips the consumer", 10),
        findingFor("opencode/pax3.8", "shared state update skips the consumer", 10),
        findingFor("codex/luna", "only the first reviewer found stale writes", 20),
        findingFor("opencode/pax3.8", "only the second reviewer found a lost retry", 30),
      ],
    };
    const refs = recordSimpleReviewResult({ task, kernel, result: raw });
    expect(refs.result_ref).toEqual(expect.any(String));
    const saved = JSON.parse(task.readRecord(refs.result_ref));
    expect(saved.findings).toHaveLength(3);
    const byLine = new Map(saved.findings.map((finding) => [finding.line, finding]));
    expect(byLine.get(10)).toMatchObject({ providers: ["codex/luna", "opencode/pax3.8"], source_strength: "corroborated" });
    expect(byLine.get(20)).toMatchObject({ providers: ["codex/luna"], source_strength: "single_source" });
    expect(byLine.get(30)).toMatchObject({ providers: ["opencode/pax3.8"], source_strength: "single_source" });
    expect(JSON.parse(task.readRecord(refs.attempt_ref)).provider_attempts).toHaveLength(3);
  });

  it("ORACLE-P2-SAME-MEMBER-UNION: keeps unique findings across results from one member without counting retries twice", () => {
    const identity = { provider: "codex/luna", adapter: "codex", source_id: "codex/luna", config_id: "cfg", model: "gpt-5.6-luna" };
    const firstFinding = findingFor("codex/luna", "first valid finding from this member", 51);
    const secondFinding = findingFor("codex/luna", "second valid finding from this member", 52);
    const result = aggregateCanonicalProviderResults([
      { provider: "codex/luna", identity, review: { findings: [firstFinding] }, evidenceAnchors: [true] },
      { provider: "codex/luna", identity, review: { findings: [firstFinding, secondFinding] }, evidenceAnchors: [true, true] },
    ], 1, { requireIdentity: true, requireSourceId: true });

    expect(result.status).toBe("available");
    expect(result.valid).toHaveLength(1);
    expect(result.findings.map(({ issue }) => issue).sort()).toEqual([
      "first valid finding from this member",
      "second valid finding from this member",
    ]);
    expect(result.findings.every(({ source_strength, finding_count }) => source_strength === "single_source" && finding_count === 1)).toBe(true);
  });

  it("ORACLE-P2-CLAIM-IDENTITY: does not corroborate opposite claims or findings without matching source lines", () => {
    const { task, kernel } = makeTask();
    const raw = {
      ...baseResult(),
      provider_results: [
        { ...baseResult().provider_results[0], evidence_anchor_valid: [true, true] },
        {
          ...baseResult().provider_results[0],
          provider: "opencode/pax3.8",
          identity: { provider: "opencode/pax3.8", adapter: "opencode", source_id: "opencode/pax3.8", config_id: "cfg-pax", model: "pax/qwen3.8" },
          evidence_anchor_valid: [true, true],
        },
      ],
      findings: [
        findingFor("codex/luna", "shared state does not validate token", 40),
        findingFor("opencode/pax3.8", "shared state validates token", 40),
        findingFor("codex/luna", "request identity is checked before dispatch", undefined),
        findingFor("opencode/pax3.8", "request identity is checked before dispatch", 41),
      ],
    };
    const refs = recordSimpleReviewResult({ task, kernel, result: raw });
    const saved = JSON.parse(task.readRecord(refs.result_ref));
    expect(saved.findings).toHaveLength(4);
    expect(saved.findings.map((finding) => finding.source_strength)).toEqual([
      "single_source", "single_source", "single_source", "single_source",
    ]);
  });

  it("ORACLE-P2-ANCHOR: keeps a provider-declared invalid anchor invalid in task-bound E2E output", () => {
    const { task, kernel } = makeTask();
    const snapshot = kernel.currentVNextSnapshot();
    const materialRevision = kernel.currentVNextMaterialRevision();
    const result = {
      ...baseResult(), stage: "verify-code",
      provider_results: [{ ...baseResult().provider_results[0], evidence_anchor_valid: [false] }],
      findings: [findingFor("codex/luna", "nonexistent file line cannot prove the finding", 999)],
    };
    const binding = {
      snapshot_tree: snapshot.tree, material_revision: materialRevision,
      frozen_material: { ref: `quality/evidence/review-materials/${"a".repeat(64)}.json`, sha256: "a".repeat(64), provider_input_sha256: result.material_id },
      reviewed_execution: { ref: `quality/evidence/stage-quality/build-code/acceptance_execution-${"b".repeat(64)}.json`, sha256: "b".repeat(64), actor: { source_id: "workflowhub-session" } },
      reviewer_actor: { source_id: "codex/luna", run_id: "fixture-run" },
    };
    const refs = recordTaskBoundE2eReviewResult({ task, result, binding });
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    const output = JSON.parse(task.readRecord(attempt.provider_attempts[0].output_ref));
    expect(output.evidence_anchor_valid).toEqual([false]);
    const saved = JSON.parse(task.readRecord(refs.result_ref));
    expect(saved.findings[0].provider_findings[0].evidence_anchor_valid).toBe(false);
  });
});

describe("review record route", () => {
  it("RED: keeps a spec-analyze skip in both facts and the error ledger", () => {
    const result = validateStageSpecAnalyzeProfile({
      stage: "make-decision",
      packet: {
        materials: { original_requirement: "requirement", decision_log: "plain decision text without headings" },
        original_requirements: [{ id: "R-1" }],
        coverage: [{ requirement_id: "R-1", status: "covered" }],
      },
    });
    expect(result.facts.spec_analyze).toMatchObject({ status: "skipped" });
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.stringMatching(/spec-analyze skipped.*no Markdown headings/i),
    ]));
  });

  it("writes provider process and parse outcomes through the canonical attempt readback", () => {
    const { task, kernel } = makeTask();
    const result = {
      ...baseResult(),
      status: "available-with-failures",
      outcome: "unavailable",
      provider_results: [{
        ...baseResult().provider_results[0],
        status: "failed",
        error: { code: "PROCESS_TIMEOUT", message: "provider timed out" },
        execution: { process_outcome: "timeout", parse_outcome: "empty_output" },
      }],
      findings: [],
    };

    const refs = recordSimpleReviewResult({ task, kernel, result });
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));

    validateSchema("attempt", attempt);
    expect(attempt.provider_attempts[0]).toMatchObject({
      status: "failed",
      process_outcome: "timeout",
      parse_outcome: "empty_output",
      error: { code: "PROCESS_TIMEOUT" },
    });
  });

  it("preserves explicit null producer outcomes without replacing the error fallback", () => {
    const { task, kernel } = makeTask();
    const result = {
      ...baseResult(),
      status: "available-with-failures",
      provider_results: [{
        ...baseResult().provider_results[0],
        status: "failed",
        error: { code: "PROCESS_DEAD", message: "provider exited" },
        execution: { process_outcome: null, parse_outcome: null },
      }],
      findings: [],
    };

    const refs = recordSimpleReviewResult({ task, kernel, result });
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));

    expect(attempt.provider_attempts[0]).toMatchObject({
      process_outcome: null,
      parse_outcome: null,
      error: { code: "PROCESS_DEAD" },
    });
  });

  it("keeps terminal OCR health on the canonical attempt without adding health to broker results", () => {
    const { task, kernel } = makeTask();
    const health = {
      provider: "codex/luna", status: "completed", liveness: false,
      last_liveness_at_ms: 10, last_output_at_ms: 11,
      progress_events: 2, stdout_bytes: 128, stderr_bytes: 0,
    };
    const result = baseResult();
    result.provider_results[0].execution = { health };
    const refs = recordSimpleReviewResult({ task, kernel, result });
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    validateSchema("attempt", attempt);
    expect(attempt.provider_attempts[0].execution.health).toEqual(health);

    const broker = baseResult();
    broker.material_id = "f".repeat(64);
    const brokerRefs = recordSimpleReviewResult({ task, kernel, result: broker });
    const brokerAttempt = JSON.parse(task.readRecord(brokerRefs.attempt_ref));
    expect(brokerAttempt.provider_attempts[0].execution).not.toHaveProperty("health");
  });

  it("keeps failed OCR health and the original provider error on an unavailable attempt", () => {
    const { task, kernel } = makeTask();
    const result = baseResult();
    result.status = "unavailable";
    result.outcome = "unavailable";
    result.findings = [];
    Object.assign(result.provider_results[0], {
      status: "failed",
      error: { code: "OCR_PROVIDER_EXIT_NONZERO", message: "stderr from provider" },
      evidence_anchor_valid: [],
      execution: { health: {
        // The child exited successfully, but its review output failed parsing.
        provider: "codex/luna", status: "completed", liveness: false,
        last_liveness_at_ms: null, last_output_at_ms: null,
        progress_events: 0, stdout_bytes: 0, stderr_bytes: 17,
      } },
    });
    const refs = recordSimpleReviewResult({ task, kernel, result });
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    validateSchema("attempt", attempt);
    expect(attempt.terminal_status).toBe("unavailable");
    expect(attempt.provider_attempts[0].error).toEqual(result.provider_results[0].error);
    expect(attempt.provider_attempts[0].execution.health).toEqual(result.provider_results[0].execution.health);
  });

  it("keeps valid terminal health and raw error after post-dispatch fallback", async () => {
    const { task, kernel } = makeTask();
    const request = { stage: "build-code", materials: { implementation: "health fallback bytes" } };
    const result = baseResult();
    result.stage = "build-plan"; // Force the existing post-dispatch unavailable projection.
    result.provider_results[0] = {
      ...result.provider_results[0], status: "failed",
      error: { code: "OCR_PROVIDER_EXIT_NONZERO", message: "original provider failure" },
      execution: { health: {
        provider: "codex/luna", status: "failed", liveness: false,
        last_liveness_at_ms: 20, last_output_at_ms: null,
        progress_events: 1, stdout_bytes: 0, stderr_bytes: 42,
      } },
    };
    const refs = await recordSimpleReviewRequest({ task, kernel, request, runRound: async () => result });
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    validateSchema("attempt", attempt);
    expect(attempt.terminal_status).toBe("unavailable");
    expect(attempt.provider_attempts[0].error).toEqual(result.provider_results[0].error);
    expect(attempt.provider_attempts[0].execution.health).toEqual(result.provider_results[0].execution.health);
  });

  it("rejects unvalidated health fields and a health snapshot bound to another provider", () => {
    const { task, kernel } = makeTask();
    const result = baseResult();
    result.provider_results[0].execution = { health: {
      provider: "codex/luna", status: "completed", liveness: false,
      last_liveness_at_ms: null, last_output_at_ms: null,
      progress_events: 0, stdout_bytes: 0, stderr_bytes: 0,
    } };
    const refs = recordSimpleReviewResult({ task, kernel, result });
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    attempt.provider_attempts[0].execution.health.stderr_tail = "private output";
    expect(() => validateSchema("attempt", attempt)).toThrow(/SCHEMA_VALIDATION_FAILED/);
    delete attempt.provider_attempts[0].execution.health.stderr_tail;
    attempt.provider_attempts[0].execution.health.stdout_bytes = -1;
    expect(() => validateSchema("attempt", attempt)).toThrow(/SCHEMA_VALIDATION_FAILED/);
    attempt.provider_attempts[0].execution.health.stdout_bytes = 0;
    delete attempt.provider_attempts[0].execution.health.last_output_at_ms;
    expect(() => validateSchema("attempt", attempt)).toThrow(/SCHEMA_VALIDATION_FAILED/);
    attempt.provider_attempts[0].execution.health.last_output_at_ms = null;
    attempt.provider_attempts[0].execution.health.liveness = true;
    expect(() => validateSchema("attempt", attempt)).toThrow(/SCHEMA_VALIDATION_FAILED/);
    result.provider_results[0].execution.health.provider = "opencode/pax3.8";
    expect(() => recordSimpleReviewResult({ task, kernel, result })).toThrow(/health does not match/);
  });

  it("persists an available simple review result", async () => {
    const { task, kernel } = makeTask();
    const result = baseResult();
    const identity = { snapshot: kernel.currentVNextSnapshot(), materialRevision: kernel.currentVNextMaterialRevision() };
    const refs = recordSimpleReviewResult({ task, result, kernel });
    expect(refs.result_ref).toMatch(/^quality\/reviews\/results\//);
    expect(refs.attempt_ref).toMatch(/^quality\/reviews\/attempts\//);

    const attemptRaw = task.readRecord(refs.attempt_ref);
    const attempt = JSON.parse(attemptRaw);
    validateSchema("attempt", attempt);
    expect(attempt.terminal_status).toBe("semantic");

    const resultRecord = JSON.parse(task.readRecord(refs.result_ref));
    validateSchema("result", resultRecord);
    expect(resultRecord.findings).toHaveLength(1);
    expect(resultRecord.findings[0].id).toMatch(/^F-[a-f0-9]{12}$/);
    expect(resultRecord.attempt_ref).toBe(refs.attempt_ref);
    expect(attempt.snapshot_tree).toBe(identity.snapshot.tree);
    expect(attempt.material_id).toBe(result.material_id);
    expect(attempt.material_revision).toBe(identity.materialRevision);
    expect(resultRecord.snapshot_tree).toBe(identity.snapshot.tree);
    expect(resultRecord.material_id).toBe(result.material_id);
    expect(resultRecord.material_revision).toBe(identity.materialRevision);
    expect(resultRecord.source).toEqual({
      target_commit: identity.snapshot.head,
      base_commit: identity.snapshot.commit,
      base_tree: identity.snapshot.tree,
      captured_head: identity.snapshot.head,
    });
    expect(resultRecord.snapshot_tree).not.toBe(result.material_id);

    const providerOutput = JSON.parse(task.readRecord(attempt.provider_attempts[0].output_ref));
    expect(providerOutput.schema_version).toBe("wh-review-provider-output.v1");
    expect(providerOutput.content_hash).toBe(contentHash(providerOutput.content));
  });

  it("derives phase review scope from phase_id when the producer omits the scope", () => {
    const { task, kernel } = makeTask();
    const result = { ...baseResult(), outcome: "completed", subject_kind: "phase", phase_id: "P1" };
    delete result.review_scope;

    const refs = recordSimpleReviewResult({ task, kernel, result });
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    const canonical = JSON.parse(task.readRecord(refs.result_ref));

    expect(attempt).toMatchObject({ subject_kind: "phase", phase_id: "P1", review_scope: "phase" });
    expect(canonical).toMatchObject({ subject_kind: "phase", phase_id: "P1", review_scope: "phase" });
  });

  it("does not publish a partial review group as a covered canonical result", () => {
    const { task, kernel } = makeTask();
    const result = {
      ...baseResult(),
      status: "available-with-failures",
      outcome: "partial",
      provider_results: [
        ...baseResult().provider_results,
        {
          provider: "opencode/pax3.8",
          status: "failed",
          identity: { provider: "opencode/pax3.8", adapter: "opencode", source_id: "opencode/pax3.8", config_id: "cfg-pax", model: "pax/qwen3.8" },
          error: { code: "PROCESS_DEAD", message: "partial provider failure" },
          evidence_anchor_valid: [],
          timing: { started_at_ms: 3, completed_at_ms: 4, duration_ms: 1 },
          usage: null,
        },
      ],
    };

    const refs = recordSimpleReviewResult({ task, kernel, result });
    expect(refs.result_ref).toBeNull();
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    expect(attempt.terminal_status).toBe("unavailable");
    expect(task.readRecord(refs.report_ref)).toContain('"coverage": "incomplete"');
  });

  it("ORACLE-AC002-PARTIAL-QUORUM: records one successful finding without satisfying a two-source quorum", async () => {
    const { task, kernel } = makeTask();
    const result = {
      ...baseResult(), status: "unavailable", outcome: "failed", minimum_heterologous: 2,
      error: { code: "OCR_INDEPENDENCE_INCOMPLETE", message: "only one independent reviewer completed" },
      provider_results: [baseResult().provider_results[0], {
        provider: "kimi/coding", status: "failed",
        identity: { provider: "kimi/coding", adapter: "kimi", source_id: "kimi/coding", config_id: "cfg-kimi", model: "kimi" },
        error: { code: "AUTHENTICATION_FAILED", message: "provider unavailable" },
        evidence_anchor_valid: [], timing: { started_at_ms: 3, completed_at_ms: 4, duration_ms: 1 }, usage: null,
      }],
    };
    const options = {
      task, kernel, request: { stage: "build-code", materials: { implementation: "partial quorum fixture" } },
      materialIdForRequest: () => result.material_id,
      runRound: async () => result,
    };
    const recorded = await recordSimpleReviewRequest(options);
    expect(recorded.result_ref).toEqual(expect.any(String));
    expect(recorded.status).toBe("recorded");
    const attempt = JSON.parse(task.readRecord(recorded.attempt_ref));
    const canonical = JSON.parse(task.readRecord(recorded.result_ref));
    validateSchema("attempt", attempt);
    validateSchema("result", canonical);
    expect(attempt).toMatchObject({ terminal_status: "unavailable", error: { code: "OCR_INDEPENDENCE_INCOMPLETE" },
      review_policy: { minimum_heterologous: 2 }, coverage: { group_outcome: "partial", valid_provider_count: 1, minimum_required: 2 },
      provider_attempts: [{ status: "completed" }, { status: "failed", error: { code: "AUTHENTICATION_FAILED" } }] });
    const providerOutput = JSON.parse(task.readRecord(attempt.provider_attempts[0].output_ref));
    expect(JSON.parse(providerOutput.content).findings).toHaveLength(1);
    expect(canonical.findings).toEqual([expect.objectContaining({ providers: ["codex/luna"], source_strength: "single_source" })]);
    const report = task.readRecord(recorded.report_ref);
    expect(report).toContain('"semantic_status": "partial"');
    expect(report).toContain('"coverage": "incomplete"');
    expect(() => authenticateStageReviewResult(canonical, { taskId: task.identity.taskId, read: task.readRecord })).toThrow();
    const reused = await recordSimpleReviewRequest(options);
    expect(reused).toMatchObject({ reused: true, result_ref: recorded.result_ref });
  });

  it("ORACLE-AC002-PARTIAL-NO-CLEAN: zero findings from one source do not complete quality", () => {
    const { task, kernel } = makeTask();
    const result = {
      ...baseResult(), status: "unavailable", outcome: "failed", minimum_heterologous: 2,
      error: { code: "OCR_INDEPENDENCE_INCOMPLETE", message: "one reviewer did not complete" },
      findings: [],
      provider_results: [{ ...baseResult().provider_results[0], evidence_anchor_valid: [] }, {
        provider: "kimi/coding", status: "failed", error: { code: "AUTHENTICATION_FAILED", message: "provider unavailable" },
        timing: { started_at_ms: 3, completed_at_ms: 4, duration_ms: 1 }, usage: null, evidence_anchor_valid: [],
      }],
    };
    const refs = recordSimpleReviewResult({ task, kernel, result });
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    const canonical = JSON.parse(task.readRecord(refs.result_ref));
    expect(canonical.findings).toEqual([]);
    expect(attempt).toMatchObject({ terminal_status: "unavailable", coverage: { group_outcome: "partial" } });
    expect(task.readRecord(refs.report_ref)).toContain('"coverage": "incomplete"');
    expect(() => authenticateStageReviewResult(canonical, { taskId: task.identity.taskId, read: task.readRecord })).toThrow();
    expect(authenticateCurrentOcrReviewFact(task, {
      task_id: task.identity.taskId, stage: "build-code", subject: "integration_review", kind: "review", status: "recorded",
      snapshot_tree: attempt.snapshot_tree, material_revision: attempt.material_revision,
      evidence: [{ ref: refs.result_ref, sha256: contentHash(task.readRecord(refs.result_ref)), evidence_type: "review_result" }],
    }, { snapshotTree: attempt.snapshot_tree, materialRevision: attempt.material_revision })).toBe(false);
  });

  it("rejects a semantic result whose findings field is missing instead of treating it as clean", () => {
    const { task, kernel } = makeTask();
    const result = baseResult();
    result.findings = null;
    result.provider_results[0].evidence_anchor_valid = [];

    expect(() => recordSimpleReviewResult({ task, kernel, result })).toThrow(/review findings must be an array/);
  });

  it("does not publish a semantic result while any provider is still running", () => {
    const { task, kernel } = makeTask();
    const result = {
      ...baseResult(),
      status: "available-with-failures",
      outcome: "partial",
      provider_results: [
        ...baseResult().provider_results,
        {
          provider: "opencode/pax3.8",
          status: "running",
          error: null,
          timing: { started_at_ms: 3, completed_at_ms: null, duration_ms: null },
          usage: null,
        },
      ],
    };

    const refs = recordSimpleReviewResult({ task, kernel, result });
    expect(refs.result_ref).toBeNull();

    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    expect(attempt.terminal_status).toBe("unavailable");
    expect(attempt.provider_attempts).toEqual(expect.arrayContaining([
      expect.objectContaining({ provider: "opencode/pax3.8", status: "running" }),
    ]));
    // A live provider has no provider error merely because the aggregate wait ended.
    validateSchema("attempt", attempt);
    const report = task.readRecord(refs.report_ref);
    expect(report).toContain('"coverage": "incomplete"');
  });

  it("persists provider discard facts without counting them as findings", () => {
    const { task, kernel } = makeTask();
    const result = baseResult();
    const discarded = { fact_kind: "unknown_severity_finding_dropped", finding_excerpt: "{}", reason: "unknown_severity" };
    const materialDiscarded = {
      fact_kind: "material_unknown_key_dropped",
      dropped_key: "typo_context",
      finding_excerpt: JSON.stringify({ dropped_key: "typo_context" }),
      reason: "not_in_stage_material_allowlist",
    };
    result.discarded_facts = [materialDiscarded];
    result.provider_results[0].discarded_facts = [discarded];
    const refs = recordSimpleReviewResult({ task, result, kernel });
    const resultRecord = JSON.parse(task.readRecord(refs.result_ref));
    validateSchema("result", resultRecord);
    expect(resultRecord.findings).toHaveLength(1);
    expect(resultRecord.discarded_facts).toEqual([materialDiscarded]);
    expect(resultRecord.provider_results[0].output.discarded_facts).toEqual([discarded]);
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    expect(attempt.discarded_facts).toEqual([materialDiscarded]);
    const providerOutput = JSON.parse(task.readRecord(attempt.provider_attempts[0].output_ref));
    expect(JSON.parse(providerOutput.content).discarded_facts).toEqual([discarded]);
  });

  it("persists an unavailable simple review result", async () => {
    const { task, kernel } = makeTask();
    const request = { stage: "build-code", materials: { implementation: "" } };
    const result = {
      status: "unavailable",
      stage: "build-code",
      review_track: null,
      review_kind: null,
      material_id: createSimpleReviewPacket(request).material_id,
      runtime_id: "runtime-456",
      outcome: "partial",
      provider_results: [],
      findings: [],
      error: { code: "ROUTE_UNAVAILABLE", message: "no route" },
    };
    const identity = { snapshot: kernel.currentVNextSnapshot(), materialRevision: kernel.currentVNextMaterialRevision() };
    const refs = recordSimpleReviewResult({ task, result, kernel });
    expect(refs.attempt_ref).toMatch(/^quality\/reviews\/attempts\//);
    expect(refs.result_ref).toBeNull();

    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    validateSchema("attempt", attempt);
    expect(attempt.terminal_status).toBe("unavailable");
    expect(attempt.error.code).toBe("ROUTE_UNAVAILABLE");
    expect(attempt.snapshot_tree).toBe(identity.snapshot.tree);
    expect(attempt.material_id).toBe(result.material_id);
    expect(attempt.material_revision).toBe(identity.materialRevision);
    expect(attempt.source).toEqual({
      target_commit: identity.snapshot.head,
      base_commit: identity.snapshot.commit,
      base_tree: identity.snapshot.tree,
      captured_head: identity.snapshot.head,
    });
  });

  it("persists an unavailable dispatched round with a trusted selection but no bindable members", () => {
    const { task, kernel } = makeTask();
    const request = { stage: "verify-code", materials: { implementation: "selection-only failure" } };
    const result = {
      status: "unavailable", stage: "verify-code", review_track: null, review_kind: null,
      material_id: createSimpleReviewPacket(request).material_id, runtime_id: "runtime-selection-only",
      outcome: "unavailable", provider_selection: {
        providers: ["codex/luna"], provider_identities: { "codex/luna": { source_id: "codex/luna", config_id: "trusted-codex" } },
      }, provider_results: [], findings: [], error: { code: "PROVIDER_RESULT_INVALID", message: "no bindable provider member" },
    };
    const refs = recordSimpleReviewResult({ task, kernel, result });
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    expect(refs.result_ref).toBeNull();
    expect(attempt.terminal_status).toBe("unavailable");
    expect(attempt.provider_attempts).toEqual([]);
    expect(attempt.dispatch_state).toBe("dispatched");
  });

  it("persists only the schema-supported error pair when public diagnostics include a cause", () => {
    const { task, kernel } = makeTask();
    const result = {
      status: "unavailable",
      stage: "verify-code",
      review_track: null,
      review_kind: null,
      material_id: "8192849eab3a861772ed1e409e72ff43eae462b16bc6437193483fc905d8260d",
      runtime_id: null,
      outcome: "unavailable",
      provider_results: [],
      findings: [],
      error: { code: "REVIEW_EXECUTION_TIMEOUT", message: "broker timed out", cause_code: "PROCESS_TIMEOUT" },
    };
    const refs = recordSimpleReviewResult({ task, result, kernel });
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    validateSchema("attempt", attempt);
    expect(attempt.error).toEqual({ code: "REVIEW_EXECUTION_TIMEOUT", message: "broker timed out" });
  });

  it("persists the actual producer shape when route loading is unavailable", async () => {
    const { task, kernel } = makeTask();
    const result = await runSimpleReview({
      stage: "verify-code",
      host_provider: "codex/luna",
      materials: { implementation: "implementation bytes" },
    }, {
      loadConfig: () => { throw new Error("route config is unavailable"); },
    });
    const refs = recordSimpleReviewResult({ task, result, kernel });
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    expect(attempt.terminal_status).toBe("unavailable");
    expect(attempt.error.code).toBe("ROUTE_UNAVAILABLE");
    expect(attempt.material_id).toBe(result.material_id);
  });

  it("keeps failed provider facts out of semantic results when a sibling provider succeeds", () => {
    const { task, kernel } = makeTask();
    const result = baseResult();
    result.provider_results = [
      ...result.provider_results,
      {
        provider: "opencode/pax3.8",
        status: "failed",
        identity: { provider: "opencode/pax3.8", adapter: "opencode", source_id: "opencode/pax3.8", config_id: "cfg-pax", model: "pax/qwen3.8" },
        error: { code: "PROVIDER_NO_TERMINAL_RESULT", message: "provider session ended without a terminal result" },
        timing: { started_at_ms: 3, completed_at_ms: 4, duration_ms: 1 },
        usage: null,
      },
    ];
    const refs = recordSimpleReviewResult({ task, result, kernel });
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    const semantic = JSON.parse(task.readRecord(refs.result_ref));
    const failed = attempt.provider_attempts.find((item) => item.provider === "opencode/pax3.8");
    expect(failed).toMatchObject({ status: "failed", output_ref: null, error: { code: "PROVIDER_NO_TERMINAL_RESULT" } });
    expect(semantic.provider_results.map((item) => item.provider)).toEqual(["codex/luna"]);
    expect(semantic.findings).toHaveLength(1);
  });

  it("keeps the DSH adapter identity aligned with the canonical provider alias", () => {
    const { task, kernel } = makeTask();
    const result = baseResult();
    result.stage = "verify-code";
    result.provider_results = [{
      provider: "dsh-code-review",
      status: "completed",
      identity: { provider: "dsh-code-review", adapter: "dsh", source_id: "codex-session-dsh-review", config_id: "dsh-config", model: null },
            error: null,
            timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 },
            usage: null,
            evidence_anchor_valid: [],
    }];
    result.findings = [];
    const refs = recordSimpleReviewResult({ task, result, kernel });
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    expect(attempt.provider_attempts[0].identity).toMatchObject({ provider: "dsh-code-review", adapter: "dsh" });
    expect(attempt.provider_attempts[0].execution.adapter).toBe("dsh");
  });

  it("fails loudly on invalid input", async () => {
    const { task, kernel } = makeTask();
    expect(() => recordSimpleReviewResult({ task, result: {} })).toThrow();
    expect(() => recordSimpleReviewResult({ task, result: { status: "available", stage: "build-code" } })).toThrow();
    expect(() => recordSimpleReviewResult({ task, result: baseResult() })).toThrow(/TaskKernel|snapshot|material revision/i);
    const spoofed = baseResult();
    spoofed.snapshot_tree = "f".repeat(40);
    expect(() => recordSimpleReviewResult({ task, result: spoofed, kernel })).toThrow(/identity fields must come from the authenticated current context/i);
    const duplicate = baseResult();
    duplicate.provider_results = [...duplicate.provider_results, { ...duplicate.provider_results[0] }];
    expect(() => recordSimpleReviewResult({ task, result: duplicate, kernel })).toThrow(/provider is duplicated/i);
  });
});

describe("review flow task record", () => {
  it("rejects build-prd request identity before an injected runner can persist a formal record", async () => {
    const { task, kernel } = makeTask();
    let dispatched = false;
    await expect(recordSimpleReviewRequest({
      task,
      kernel,
      request: { stage: "build-prd", reviewKind: "build_prd", materials: { prd: "report-only" } },
      runRound: async () => {
        dispatched = true;
        return baseResult();
      },
    })).rejects.toThrow(/BUILD_PRD_REPORT_ONLY_NOT_PERSISTED/);
    expect(dispatched).toBe(false);
  });

  it("rejects conflicting aliases before route resolution or persistence", async () => {
    const { task, kernel } = makeTask();
    let dispatched = false;
    await expect(recordSimpleReviewRequest({
      task,
      kernel,
      request: { stage: "build-code", review_kind: null, reviewKind: "build_prd", materials: { implementation: "conflict" } },
      runRound: async () => {
        dispatched = true;
        return baseResult();
      },
    })).rejects.toThrow(/review_kind\/reviewKind disagree/);
    expect(dispatched).toBe(false);
    expect(() => recordSimpleReviewResult({ task, kernel, result: { ...baseResult(), review_kind: null, reviewKind: "build_prd" } })).toThrow(/review_kind\/reviewKind disagree/);
    expect(() => recordTaskBoundE2eReviewUnavailable({ result: { ...baseResult(), review_kind: null, reviewKind: "build_prd" } })).toThrow(/review_kind\/reviewKind disagree/);
    expect(() => recordTaskBoundE2eReviewResult({ result: { ...baseResult(), review_kind: null, reviewKind: "build_prd" } })).toThrow(/review_kind\/reviewKind disagree/);
  });

  it("records an unavailable attempt when a runner result stage/track/kind identity does not match", async () => {
    const { task, kernel } = makeTask();
    const recorded = await recordSimpleReviewRequest({
      task,
      kernel,
      request: { stage: "build-code", materials: { implementation: "identity-bound" } },
      runRound: async (request) => ({
        ...baseResult(),
        stage: "verify-code",
        material_id: createSimpleReviewPacket(request).material_id,
      }),
    });
    expect(recorded).toMatchObject({ status: "recorded", result_ref: null, dispatch_state: "dispatched" });
    expect(JSON.parse(task.readRecord(recorded.attempt_ref))).toMatchObject({
      terminal_status: "unavailable",
      error: { code: "REVIEW_EXECUTION_FAILED" },
    });
  });

  it.each([
    [{ review_scope: "phase" }, { reviewScope: "integration" }],
    [{ reviewScope: "integration" }, { review_scope: "phase" }],
  ])("records result scope drift as unavailable instead of overwriting the request (%o -> %o)", async (requestIdentity, resultIdentity) => {
    const { task, kernel } = makeTask();
    const requestScope = requestIdentity.review_scope ?? requestIdentity.reviewScope;
    const recorded = await recordSimpleReviewRequest({
      task,
      kernel,
      request: { stage: "build-code", ...requestIdentity,
        ...(requestScope === "phase" ? { subject_kind: "phase", phase_id: "P-scope" } : {}),
        materials: { implementation: "scope-bound" } },
      runRound: async (request) => ({
        ...baseResult(),
        ...resultIdentity,
        material_id: createSimpleReviewPacket(request).material_id,
      }),
    });
    expect(recorded).toMatchObject({ status: "recorded", result_ref: null, dispatch_state: "dispatched" });
    expect(JSON.parse(task.readRecord(recorded.attempt_ref))).toMatchObject({
      terminal_status: "unavailable",
      error: { code: "REVIEW_EXECUTION_FAILED" },
    });
  });

  it("runs one authenticated request, records the result, and reuses the immutable refs without a second dispatch", async () => {
    const { task, kernel } = makeTask();
    let dispatches = 0;
    const request = { stage: "build-code", host_provider: "codex/luna", materials: { implementation: "bytes" } };
    const runRound = async () => { dispatches += 1; return { ...baseResult(), material_id: createSimpleReviewPacket(request).material_id }; };
    const first = await recordSimpleReviewRequest({ task, kernel, request, runRound });
    const second = await recordSimpleReviewRequest({ task, kernel, request, runRound });

    expect(dispatches).toBe(1);
    expect(first).toMatchObject({ status: "recorded", reused: false });
    expect(second).toMatchObject({ status: "recorded", reused: true, attempt_ref: first.attempt_ref, result_ref: first.result_ref });
    expect(JSON.parse(task.readRecord(first.attempt_ref)).provider_attempts[0].execution.usage).toBeNull();
  });

  // Corrected contract: authenticated-evidence.json is provider-visible delivered
  // material, so the recorded material identity counts it exactly as the broker's
  // canonicalWorkflowHubMaterialId does. The earlier expectation that the recorded
  // identity equal the evidence-free base identity could never match a real broker
  // envelope. The base versus supplemental distinction is carried by the separate
  // authenticated_evidence_sha256 (asserted below), not by the material identity.
  it("records authenticated supplemental evidence in the delivered material identity", async () => {
    const { task, kernel } = makeTask();
    const request = {
      stage: "build-code",
      host_provider: "codex/luna",
      materials: { implementation: "bytes" },
      authenticated_evidence: {
        schema_version: "m401-trace.v1",
        input_material: "base-material-id",
        actual_result: "pass",
      },
    };
    const packet = createSimpleReviewPacket(request);
    const runRound = async () => ({
      ...baseResult(),
      material_id: packet.material_id,
      authenticated_evidence: packet.authenticated_evidence,
      authenticated_evidence_sha256: packet.authenticated_evidence_sha256,
    });
    const refs = await recordSimpleReviewRequest({ task, kernel, request, runRound });
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    const result = JSON.parse(task.readRecord(refs.result_ref));
    validateSchema("attempt", attempt);
    validateSchema("result", result);
    expect(attempt.material_id).toBe(packet.material_id);
    expect(attempt.material_id).not.toBe(createSimpleReviewPacket({ stage: request.stage, materials: request.materials }).material_id);
    expect(attempt.authenticated_evidence_sha256).toBe(packet.authenticated_evidence_sha256);
    expect(result.authenticated_evidence_sha256).toBe(packet.authenticated_evidence_sha256);
  });

  // AC-C4-001 / AC-C9-005: the canonical dedup identity is the five-dimension
  // tuple (stage, phase_id, track, review_kind, origin). The caller-declared
  // host_provider is not one of those dimensions: the host-authenticated
  // trusted route identity is the authority for the transport, so an unchanged
  // trusted route must reuse the recorded conducted result with zero dispatch
  // instead of asking the round budget for a second review.
  it("reuses the exact five-dimension identity when only the caller host_provider changes", async () => {
    const { task, kernel } = makeTask();
    let dispatches = 0;
    const runRound = async (input) => {
      dispatches += 1;
      return { ...baseResult(), material_id: createSimpleReviewPacket(input).material_id };
    };
    const trustedRoute = () => ({ route_identity: "a".repeat(64) });
    const firstRequest = {
      stage: "build-code",
      host_provider: "codex/luna",
      materials: { implementation: "same semantic review surface" },
    };
    const first = await recordSimpleReviewRequest({ task, kernel, request: firstRequest, resolveRouteIdentity: trustedRoute, runRound });
    expect(first).toMatchObject({ status: "recorded", reused: false });
    const reused = await recordSimpleReviewRequest({
      task,
      kernel,
      request: { ...firstRequest, host_provider: "grok/grok" },
      resolveRouteIdentity: trustedRoute,
      runRound,
    });
    expect(reused).toMatchObject({ status: "recorded", reused: true, attempt_ref: first.attempt_ref, result_ref: first.result_ref });
    expect(dispatches).toBe(1);
  });

  // AC-C4-001 scenario: two phases of the same stage and track are two
  // canonical reviews, so the second phase must be dispatchable under its own
  // phase allowance while an identical repeat of either phase reuses.
  it("dispatches each phase of one stage and track and reuses an identical phase repeat", async () => {
    const { task, kernel } = makeTask();
    const request = (phase) => ({
      stage: "build-code", host_provider: "codex/luna", subject_kind: "phase", phase_id: phase,
      review_scope: "phase", materials: { implementation: `phase ${phase} bytes` },
    });
    let calls = 0;
    const runRound = async (input) => {
      calls += 1;
      return { ...baseResult(), material_id: createSimpleReviewPacket(input).material_id };
    };
    const first = await recordSimpleReviewRequest({ task, kernel, request: request("P1"), runRound });
    expect(first).toMatchObject({ status: "recorded", reused: false });
    const second = await recordSimpleReviewRequest({ task, kernel, request: request("P2"), runRound });
    expect(second).toMatchObject({ status: "recorded", reused: false });
    expect(calls).toBe(2);
    const repeat = await recordSimpleReviewRequest({ task, kernel, request: request("P2"), runRound });
    expect(repeat).toMatchObject({ status: "recorded", reused: true, attempt_ref: second.attempt_ref, result_ref: second.result_ref });
    expect(calls).toBe(2);
  });

  // D-007 with CONTEXT.md:412: the five-dimensional tuple names which review
  // this is, but changed submitted material is different review input, so the
  // earlier result must not be read back. The identical material still reuses.
  it("redispatches a recorded review when the submitted material bytes change", async () => {
    const { task, kernel } = makeTask();
    let dispatches = 0;
    const runRound = async (input) => {
      dispatches += 1;
      return { ...baseResult(), material_id: createSimpleReviewPacket(input).material_id };
    };
    const trustedRoute = () => ({ route_identity: "a".repeat(64) });
    const firstRequest = { stage: "build-code", host_provider: "codex/luna", materials: { implementation: "original reviewed bytes" } };
    const first = await recordSimpleReviewRequest({ task, kernel, request: firstRequest, resolveRouteIdentity: trustedRoute, runRound });
    expect(first).toMatchObject({ status: "recorded", reused: false, dispatch_state: "dispatched" });

    const changed = await recordSimpleReviewRequest({
      task, kernel,
      request: { ...firstRequest, materials: { implementation: "changed reviewed bytes" } },
      resolveRouteIdentity: trustedRoute,
      runRound,
    });

    expect(changed).toMatchObject({
      status: "recorded",
      reused: false,
      dispatch_state: "dispatched",
    });
    expect(changed.attempt_ref).not.toBe(first.attempt_ref);
    expect(changed.result_ref).not.toBe(first.result_ref);
    expect(dispatches).toBe(2);

    const repeated = await recordSimpleReviewRequest({
      task, kernel,
      request: { ...firstRequest, materials: { implementation: "changed reviewed bytes" } },
      resolveRouteIdentity: trustedRoute,
      runRound,
    });
    expect(dispatches).toBe(2);
    expect(repeated).toMatchObject({
      status: "recorded",
      reused: true,
      dispatch_state: "reused",
      attempt_ref: changed.attempt_ref,
      result_ref: changed.result_ref,
    });
  });

  it("five-dimensional identity and review_result_ref readback", async () => {
    const runPair = async (firstRequest, secondRequest, shouldReuse) => {
      const { task, kernel } = makeTask();
      let dispatches = 0;
      const runRound = async (received) => {
        dispatches += 1;
        const result = {
          ...baseResult(),
          stage: received.stage,
          review_track: received.review_track ?? null,
          review_kind: received.review_kind ?? null,
          subject_kind: received.subject_kind ?? "worktree",
          phase_id: received.phase_id ?? null,
          ...(Object.hasOwn(received, "review_scope") ? { review_scope: received.review_scope } : {}),
          material_id: createSimpleReviewPacket(received).material_id,
        };
        return result;
      };
      const first = await recordSimpleReviewRequest({ task, kernel, request: firstRequest, runRound });
      const second = await recordSimpleReviewRequest({ task, kernel, request: secondRequest, runRound });
      if (shouldReuse) {
        expect(dispatches).toBe(1);
        expect(second).toMatchObject({ reused: true, attempt_ref: first.attempt_ref, result_ref: first.result_ref });
        const reviewResultRef = first.result_ref;
        expect(reviewResultRef).toMatch(/^quality\/reviews\/results\//);
        expect(task.readRecord(reviewResultRef)).toBe(task.readRecord(second.result_ref));
      } else {
        expect(second.reused).not.toBe(true);
        expect(second.attempt_ref).not.toBe(first.attempt_ref);
      }
    };
    const material = { implementation: "five-dimensional review material" };
    await runPair(
      { stage: "build-code", materials: material },
      { stage: "build-code", materials: material },
      true,
    );
    await runPair(
      { stage: "build-spec", materials: material },
      { stage: "build-plan", materials: material },
      false,
    );
    await runPair(
      { stage: "make-decision", review_track: "direction", materials: material },
      { stage: "make-decision", review_track: "detail", materials: material },
      false,
    );
    await runPair(
      { stage: "build-code", subject_kind: "phase", phase_id: "P1", review_scope: "phase", materials: material },
      { stage: "build-code", subject_kind: "phase", phase_id: "P2", review_scope: "phase", materials: material },
      false,
    );
    await runPair(
      { stage: "build-code", review_kind: "mini_task.design", subject_kind: "phase", phase_id: "P1", review_scope: "phase", materials: material },
      { stage: "build-code", review_kind: "mini_task.implementation", subject_kind: "phase", phase_id: "P1", review_scope: "phase", materials: material },
      false,
    );
    await runPair(
      { stage: "build-code", materials: material },
      { stage: "build-code", subject_kind: "worktree", phase_id: null, review_scope: null, materials: material },
      false,
    );
  });

  it("serializes concurrent identical requests under the TaskHandle record lock", async () => {
    const { task, kernel } = makeTask();
    let dispatches = 0;
    const request = { stage: "build-code", host_provider: "codex/luna", materials: { implementation: "concurrent bytes" } };
    const runRound = async () => {
      dispatches += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return { ...baseResult(), material_id: createSimpleReviewPacket(request).material_id };
    };
    const [first, second] = await Promise.all([
      recordSimpleReviewRequest({ task, kernel, request, runRound }),
      recordSimpleReviewRequest({ task, kernel, request, runRound }),
    ]);
    expect(dispatches).toBe(1);
    expect(new Set([first.attempt_ref, second.attempt_ref]).size).toBe(1);
    expect(new Set([first.result_ref, second.result_ref]).size).toBe(1);
  });

  it("records a canonical unavailable attempt when the dispatched round never settles", async () => {
    const { task, kernel } = makeTask();
    const request = { stage: "build-code", host_provider: "codex/luna", materials: { implementation: "hung review bytes" } };
    const refs = await recordSimpleReviewRequest({
      task,
      kernel,
      request,
      reviewRoundTimeoutMs: 0,
      runRound: async () => new Promise(() => {}),
    });

    expect(refs).toMatchObject({ status: "recorded", result_ref: null });
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    expect(attempt.provider_attempts).toEqual([]);
    expect(attempt.error).toMatchObject({ code: "REVIEW_EXECUTION_TIMEOUT" });
    expect(existsSync(task.recordPath("quality/reviews/request-locks/current-request.lock"))).toBe(false);
  });

  it("lets a managed runner own its terminal wait without a recorder deadline", async () => {
    const { task, kernel } = makeTask();
    const request = { stage: "build-code", host_provider: "codex/luna", materials: { implementation: "managed wait bytes" } };
    let dispatchSignal = null;
    const refs = await recordSimpleReviewRequest({
      task,
      kernel,
      request,
      reviewRoundTimeoutMs: null,
      runRound: async (input, { signal } = {}) => {
        dispatchSignal = signal;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return { ...baseResult(), material_id: createSimpleReviewPacket(input).material_id };
      },
    });

    expect(refs).toMatchObject({ status: "recorded", dispatch_state: "dispatched" });
    expect(dispatchSignal).toBeInstanceOf(AbortSignal);
    expect(dispatchSignal.aborted).toBe(false);
  });

  it("aborts local review dispatch before releasing a timed-out record lock", async () => {
    const { task, kernel } = makeTask();
    const request = { stage: "build-code", host_provider: "codex/luna", materials: { implementation: "deadline-bound review bytes" } };
    let dispatchSignal = null;
    let replayDispatches = 0;
    const refs = await recordSimpleReviewRequest({
      task,
      kernel,
      request,
      reviewRoundTimeoutMs: 0,
      runRound: async (_input, { signal } = {}) => {
        dispatchSignal = signal;
        return new Promise(() => {});
      },
    });

    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    expect(dispatchSignal).toBeInstanceOf(AbortSignal);
    expect(dispatchSignal.aborted).toBe(true);
    expect(attempt.error).toMatchObject({ code: "REVIEW_EXECUTION_TIMEOUT" });
    expect(attempt.dispatch_state).toBe("sent_unparsed");
    expect(existsSync(task.recordPath("quality/reviews/request-locks/current-request.lock"))).toBe(false);

    // An injected/non-cooperating runner has not acknowledged cancellation.
    // The persisted sent_unparsed attempt therefore owns this exact material
    // and prevents another dispatch from racing it after the lock is released.
    const replay = await recordSimpleReviewRequest({
      task,
      kernel,
      request,
      runRound: async () => { replayDispatches += 1; throw new Error("must not dispatch while cleanup is unacknowledged"); },
    });
    expect(replay).toMatchObject({ status: "recorded", reused: true, attempt_ref: refs.attempt_ref });
    expect(replayDispatches).toBe(0);
  });

  it("flushes one canonical unavailable attempt when the caller interrupts a live review", async () => {
    const { task, kernel } = makeTask();
    const controller = new AbortController();
    const request = { stage: "build-code", host_provider: "codex/luna", materials: { implementation: "interrupted review bytes" } };
    let receivedSignal = null;
    let dispatches = 0;
    let started;
    const startedRound = new Promise((resolve) => { started = resolve; });
    const pending = recordSimpleReviewRequest({
      task,
      kernel,
      request,
      signal: controller.signal,
      reviewRoundTimeoutMs: 0,
      runRound: async (_input, { signal } = {}) => {
        dispatches += 1;
        receivedSignal = signal;
        started();
        return new Promise(() => {});
      },
    });
    await startedRound;
    controller.abort(Object.assign(new Error("review record interrupted by SIGTERM"), { code: "REVIEW_CANCELLED" }));
    const refs = await pending;

    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    expect(receivedSignal).toBeInstanceOf(AbortSignal);
    expect(receivedSignal.aborted).toBe(true);
    expect(refs).toMatchObject({ status: "recorded", result_ref: null });
    expect(attempt.error).toMatchObject({ code: "REVIEW_CANCELLED" });
    expect(existsSync(task.recordPath("quality/reviews/request-locks/current-request.lock"))).toBe(false);

    const replay = await recordSimpleReviewRequest({
      task,
      kernel,
      request,
      runRound: async () => { dispatches += 1; throw new Error("a cancelled canonical attempt must be reused"); },
    });
    expect(replay).toMatchObject({ status: "recorded", reused: true, attempt_ref: refs.attempt_ref });
    expect(dispatches).toBe(1);
  });

  it("records a canonical unavailable attempt when trusted route resolution never settles", async () => {
    const { task, kernel } = makeTask();
    const request = { stage: "build-code", host_provider: "codex/luna", materials: { implementation: "hung route bytes" } };
    let dispatches = 0;
    const refs = await recordSimpleReviewRequest({
      task,
      kernel,
      request,
      reviewRoundTimeoutMs: 0,
      resolveRouteIdentity: async () => new Promise(() => {}),
      runRound: async () => { dispatches += 1; return baseResult(); },
    });

    expect(dispatches).toBe(0);
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    expect(attempt.error).toMatchObject({ code: "REVIEW_ROUTE_RESOLUTION_TIMEOUT" });
    expect(existsSync(task.recordPath("quality/reviews/request-locks/current-request.lock"))).toBe(false);
  });

  it("records a canonical unavailable attempt when authenticated review material cannot be prepared", async () => {
    const { task, kernel } = makeTask();
    const request = { stage: "build-code", host_provider: "codex/luna", materials: { implementation: "stale receipt bytes" } };
    const refs = await recordSimpleReviewRequest({
      task,
      kernel,
      request,
      materialIdForRequest: () => { throw Object.assign(new Error("test evidence is stale"), { code: "MATERIAL_INCOMPLETE" }); },
      runRound: async () => { throw new Error("material failure must not dispatch"); },
    });

    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    expect(refs).toMatchObject({ status: "recorded", result_ref: null });
    expect(attempt.error).toMatchObject({ code: "MATERIAL_INCOMPLETE" });
    expect(existsSync(task.recordPath("quality/reviews/request-locks/current-request.lock"))).toBe(false);
  });

  it("records a canonical unavailable attempt when reviewed execution preparation fails", async () => {
    const { task, kernel } = makeTask();
    const digest = "a".repeat(64);
    const request = {
      stage: "verify-code",
      host_provider: "codex/luna",
      materials: { implementation: "verify review bytes" },
      reviewed_execution: {
        quality_fact_ref: `quality/facts/${digest}.json`,
        ref: `quality/evidence/stage-quality/build-code/acceptance_execution-${digest}.json`,
        sha256: digest,
      },
    };
    let dispatches = 0;
    const refs = await recordSimpleReviewRequest({
      task,
      kernel,
      request,
      runRound: async () => { dispatches += 1; throw new Error("execution preparation failure must not dispatch"); },
    });

    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    expect(refs).toMatchObject({ status: "recorded", result_ref: null });
    expect(attempt.error).toMatchObject({ code: "REVIEW_EXECUTION_PREPARATION_FAILED" });
    expect(dispatches).toBe(0);
    expect(existsSync(task.recordPath("quality/reviews/request-locks/current-request.lock"))).toBe(false);
  });

  it("does not invoke a runner after the caller has already cancelled its review request", async () => {
    const { task, kernel } = makeTask();
    const controller = new AbortController();
    controller.abort(Object.assign(new Error("review record interrupted by SIGTERM"), { code: "REVIEW_CANCELLED" }));
    const request = { stage: "build-code", host_provider: "codex/luna", materials: { implementation: "already cancelled review bytes" } };
    let dispatches = 0;
    const refs = await recordSimpleReviewRequest({
      task,
      kernel,
      request,
      signal: controller.signal,
      runRound: async () => { dispatches += 1; throw new Error("cancelled request must not dispatch"); },
    });

    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    expect(attempt.error).toMatchObject({ code: "REVIEW_CANCELLED" });
    expect(dispatches).toBe(0);
    expect(existsSync(task.recordPath("quality/reviews/request-locks/current-request.lock"))).toBe(false);
  });

  it("persists a blocked-before-dispatch result with no provider or semantic result", async () => {
    const { task, kernel } = makeTask();
    let dispatches = 0;
    const request = { stage: "build-code", materials: { implementation: "" } };
    const result = {
      status: "unavailable", dispatch_state: "blocked_before_dispatch", stage: "build-code",
      review_track: null, review_kind: null,
      material_id: createSimpleReviewPacket(request).material_id,
      runtime_id: null, outcome: "unavailable", provider_results: [], findings: [],
      error: { code: "MATERIAL_INCOMPLETE", message: "required material is missing" },
    };
    const refs = await recordSimpleReviewRequest({ task, kernel, request, runRound: async () => { dispatches += 1; return result; } });
    const reused = await recordSimpleReviewRequest({ task, kernel, request, runRound: async () => { dispatches += 1; return result; } });
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    expect(dispatches).toBe(1);
    expect(refs.result_ref).toBeNull();
    expect(refs.report_ref).toMatch(/^quality\/reviews\/reports\//);
    expect(reused).toMatchObject({ status: "recorded", reused: true, attempt_ref: refs.attempt_ref, result_ref: null, report_ref: refs.report_ref });
    expect(attempt.provider_attempts).toEqual([]);
    expect(attempt.error).toEqual(result.error);
  });

  it("consumes a provider-preflight quorum shortfall before dispatch", async () => {
    const { task, kernel } = makeTask();
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "review-record-post-filter-quorum-current-")));
    roots.push(attachmentRoot);
    let brokerCalls = 0;
    const request = {
      stage: "build-spec",
      host_provider: "codex",
      materials: { raw_requirement: "requirement", approved_decision: "decision", draft_spec: "spec" },
    };
    const recorded = await recordSimpleReviewRequest({
      task,
      kernel,
      request,
      runRound: async (input) => runSimpleReview(input, {
        loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
        resolveRoute: () => ({ initial: ["blocked/model", "surviving/model"], mode: "single_round", minimum_heterologous: 2 }),
        selectProviders: () => ({
          providers: ["blocked/model", "surviving/model"],
          eligible_profiles: ["surviving/model"],
          provider_models: { "blocked/model": "model-a", "surviving/model": "model-b" },
          provider_identities: {
            "blocked/model": { source_id: "blocked-source", config_id: "blocked-config" },
            "surviving/model": { source_id: "surviving-source", config_id: "surviving-config" },
          },
        }),
        client: { async runGroup() {
          brokerCalls += 1;
          throw new Error("provider dispatch must not run after quorum preflight");
        } },
      }),
    });
    const attempt = JSON.parse(task.readRecord(recorded.attempt_ref));

    expect(recorded).toMatchObject({ status: "recorded", dispatch_state: "blocked_before_dispatch", result_ref: null });
    expect(recorded.error).toMatchObject({ code: "REVIEW_THRESHOLD_INVALID" });
    expect(attempt).toMatchObject({
      terminal_status: "unavailable",
      dispatch_state: "blocked_before_dispatch",
      provider_attempts: [],
    });
    expect(brokerCalls).toBe(0);
    validateSchema("attempt", attempt);
  });

  it("persists all-provider failure as unavailable while retaining provider facts", () => {
    const { task, kernel } = makeTask();
    const result = baseResult();
    result.provider_results = result.provider_results.map((item) => ({
      ...item,
      status: "failed",
      error: { code: "PROVIDER_NO_TERMINAL_RESULT", message: "provider ended without a result" },
      evidence_anchor_valid: [],
    }));
    result.findings = [];
    const refs = recordSimpleReviewResult({ task, result, kernel });
    expect(refs.result_ref).toBeNull();
    expect(refs.report_ref).toMatch(/^quality\/reviews\/reports\//);
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    validateSchema("attempt", attempt);
    expect(attempt.terminal_status).toBe("unavailable");
    expect(attempt.provider_attempts).toHaveLength(1);
    expect(attempt.error.code).toBe("REVIEW_ALL_PROVIDERS_FAILED");
  });

  it("records an unavailable attempt when a runner result material fingerprint is not requested", async () => {
    const { task, kernel } = makeTask();
    const request = { stage: "build-code", materials: { implementation: "requested" } };
    const recorded = await recordSimpleReviewRequest({
      task, kernel, request,
      materialIdForRequest: (value) => createSimpleReviewPacket(value).material_id,
      runRound: async () => ({ ...baseResult(), material_id: createSimpleReviewPacket({ stage: "build-code", materials: { implementation: "other" } }).material_id }),
    });
    expect(recorded).toMatchObject({ status: "recorded", result_ref: null, dispatch_state: "dispatched" });
    expect(JSON.parse(task.readRecord(recorded.attempt_ref))).toMatchObject({ error: { code: "REVIEW_MATERIAL_MISMATCH" } });
  });

  it("records an unavailable attempt for an explicit material fingerprint mismatch", async () => {
    const { task, kernel } = makeTask();
    const request = { stage: "build-code", material_id: "a".repeat(64), materials: { implementation: "requested" } };
    const recorded = await recordSimpleReviewRequest({
      task, kernel, request,
      runRound: async () => ({ ...baseResult(), material_id: "b".repeat(64) }),
    });
    expect(recorded).toMatchObject({ status: "recorded", result_ref: null, dispatch_state: "dispatched" });
    expect(JSON.parse(task.readRecord(recorded.attempt_ref))).toMatchObject({ error: { code: "REVIEW_MATERIAL_MISMATCH" } });
  });
});

function pairedResult({ redAvailable = true, blueAvailable = true, minimum = 1 } = {}) {
  const pairId = "T005-pair";
  const role = (name, available) => {
    const value = baseResult();
    Object.assign(value, { stage: "make-decision", review_track: "detail", role: name, pair_id: pairId, minimum_heterologous: minimum });
    value.provider_selection = { providers: ["codex/luna"], provider_identities: { "codex/luna": { ...value.provider_results[0].identity } } };
    value.findings[0].issue = `${name} original finding`;
    if (!available) {
      value.status = "unavailable";
      value.findings = [];
      Object.assign(value.provider_results[0], { status: "failed", error: { code: "PROCESS_DEAD", message: `${name} provider failed` }, evidence_anchor_valid: [] });
      value.error = value.provider_results[0].error;
    }
    return value;
  };
  const red = role("red", redAvailable), blue = role("blue", blueAvailable);
  return {
    status: redAvailable && blueAvailable ? "available" : redAvailable || blueAvailable ? "available-with-failures" : "unavailable",
    stage: "make-decision", review_track: "detail", review_kind: null, pair_id: pairId,
    material_id: red.material_id, runtime_id: null, outcome: "partial",
    provider_results: [...red.provider_results, ...blue.provider_results],
    findings: [...red.findings, ...blue.findings], role_results: { red, blue },
  };
}

function phasePairedResult() {
  const raw = pairedResult();
  Object.assign(raw, { stage: "build-code", review_track: null, subject_kind: "phase", phase_id: "P-shared", review_scope: "phase" });
  for (const member of Object.values(raw.role_results)) {
    Object.assign(member, { stage: "build-code", review_track: null, subject_kind: "phase", phase_id: "P-shared", review_scope: "phase" });
  }
  return raw;
}

describe("T005 paired canonical role consumption", () => {
  it.each([
    ["review_kind", "reviewKind", null, "build_prd"],
    ["review_track", "reviewTrack", "detail", "direction"],
  ])("fails closed when a nested paired member has conflicting %s aliases", (snake, camel, snakeValue, camelValue) => {
    const { task, kernel } = makeTask();
    const raw = pairedResult();
    Object.assign(raw.role_results.red, { [snake]: snakeValue, [camel]: camelValue });
    expect(() => recordSimpleReviewResult({ task, kernel, result: raw }))
      .toThrow(`review identity aliases ${snake}/${camel} disagree`);
  });

  it.each([
    ["subject_kind", "phase", "worktree"],
    ["phase_id", "P-outer", "P-member"],
  ])("rejects paired member %s drift instead of letting outer identity overwrite it", (field, outerValue, memberValue) => {
    const { task, kernel } = makeTask();
    const raw = pairedResult();
    raw[field] = outerValue;
    raw.role_results.red[field] = memberValue;
    expect(() => recordSimpleReviewResult({ task, kernel, result: raw }))
      .toThrow(`paired review red ${field} identity mismatch`);
  });

  it("retains the strict paired member review_track requirement when the member omits it", () => {
    const { task, kernel } = makeTask();
    const raw = pairedResult();
    delete raw.role_results.red.review_track;
    expect(() => recordSimpleReviewResult({ task, kernel, result: raw }))
      .toThrow("make-decision requires direction or detail review_track");
  });

  it("fails closed when a paired member carries conflicting review scope aliases", () => {
    const { task, kernel } = makeTask();
    const raw = pairedResult();
    Object.assign(raw.role_results.red, { review_scope: "phase", reviewScope: "integration" });
    expect(() => recordSimpleReviewResult({ task, kernel, result: raw }))
      .toThrow("review identity aliases review_scope/reviewScope disagree");
  });

  it("rejects paired member scope drift instead of letting the outer scope overwrite it", () => {
    const { task, kernel } = makeTask();
    const raw = pairedResult();
    Object.assign(raw, { stage: "build-code", review_track: null, review_scope: "phase" });
    for (const member of Object.values(raw.role_results)) {
      Object.assign(member, { stage: "build-code", review_track: null, review_scope: "integration" });
    }
    expect(() => recordSimpleReviewResult({ task, kernel, result: raw }))
      .toThrow("paired review red material/stage identity mismatch");
  });

  it("rejects a paired member review scope that is illegal for its stage", () => {
    const { task, kernel } = makeTask();
    const raw = pairedResult();
    raw.role_results.red.review_scope = "phase";
    expect(() => recordSimpleReviewResult({ task, kernel, result: raw }))
      .toThrow("make-decision does not use review_scope");
  });

  it("fills an outer missing review_scope from the two matching phase members", () => {
    const { task, kernel } = makeTask();
    const raw = phasePairedResult();
    delete raw.review_scope;
    const recorded = recordSimpleReviewResult({ task, kernel, result: raw });
    for (const role of ["red", "blue"]) {
      const attempt = JSON.parse(task.readRecord(recorded.role_results[role].attempt_ref));
      expect(attempt).toMatchObject({ stage: "build-code", subject_kind: "phase", phase_id: "P-shared", review_scope: "phase" });
      validateSchema("attempt", attempt);
    }
  });

  it("infers and persists phase review_scope when every paired identity omits it", () => {
    const { task, kernel } = makeTask();
    const raw = phasePairedResult();
    delete raw.review_scope;
    for (const member of Object.values(raw.role_results)) delete member.review_scope;
    const recorded = recordSimpleReviewResult({ task, kernel, result: raw });
    for (const role of ["red", "blue"]) {
      const refs = recorded.role_results[role];
      const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
      const result = JSON.parse(task.readRecord(refs.result_ref));
      expect(attempt).toMatchObject({ subject_kind: "phase", phase_id: "P-shared", review_scope: "phase" });
      expect(result).toMatchObject({ subject_kind: "phase", phase_id: "P-shared", review_scope: "phase" });
      validateSchema("attempt", attempt);
      validateSchema("result", result);
    }
  });

  it("keeps the integration default for a build-code worktree when every paired identity omits scope", () => {
    const { task, kernel } = makeTask();
    const raw = pairedResult();
    Object.assign(raw, { stage: "build-code", review_track: null, subject_kind: "worktree", phase_id: null });
    for (const member of Object.values(raw.role_results)) {
      Object.assign(member, { stage: "build-code", review_track: null, subject_kind: "worktree", phase_id: null });
    }
    const recorded = recordSimpleReviewResult({ task, kernel, result: raw });
    for (const role of ["red", "blue"]) {
      const attempt = JSON.parse(task.readRecord(recorded.role_results[role].attempt_ref));
      expect(attempt).toMatchObject({ subject_kind: "worktree", phase_id: null, review_scope: "integration" });
      validateSchema("attempt", attempt);
    }
  });

  it("rejects an explicitly null paired review_scope for a phase result", () => {
    const { task, kernel } = makeTask();
    const raw = phasePairedResult();
    Object.assign(raw, { review_scope: null });
    for (const member of Object.values(raw.role_results)) Object.assign(member, { review_scope: null });
    expect(() => recordSimpleReviewResult({ task, kernel, result: raw })).toThrow(/review_scope does not match phase_id|review identity tuple is invalid/);
  });

  it("still rejects an explicitly invalid integration scope for a phase tuple", () => {
    const { task, kernel } = makeTask();
    const raw = phasePairedResult();
    Object.assign(raw, { review_scope: "integration" });
    for (const member of Object.values(raw.role_results)) Object.assign(member, { review_scope: "integration" });
    expect(() => recordSimpleReviewResult({ task, kernel, result: raw }))
      .toThrow(/review identity tuple is invalid|phase subject requires/);
  });

  it("fills an outer missing subject_kind and phase_id from the two matching phase members", () => {
    const { task, kernel } = makeTask();
    const raw = phasePairedResult();
    delete raw.subject_kind;
    delete raw.phase_id;
    const recorded = recordSimpleReviewResult({ task, kernel, result: raw });
    for (const role of ["red", "blue"]) {
      const result = JSON.parse(task.readRecord(recorded.role_results[role].result_ref));
      expect(result).toMatchObject({ stage: "build-code", subject_kind: "phase", phase_id: "P-shared", review_scope: "phase" });
      validateSchema("result", result);
    }
  });

  it.each([
    ["subject_kind", "phase", "worktree"],
    ["phase_id", "P-red", "P-blue"],
    ["review_scope", "phase", "integration"],
  ])("rejects inconsistent red/blue %s before prepare", (field, redValue, blueValue) => {
    const { task, kernel } = makeTask();
    const raw = phasePairedResult();
    delete raw[field];
    raw.role_results.red[field] = redValue;
    raw.role_results.blue[field] = blueValue;
    expect(() => recordSimpleReviewResult({ task, kernel, result: raw })).toThrow(/paired review .*identity mismatch|review identity tuple is invalid/);
  });

  it.each([
    { review_scope: "phase", subject_kind: "worktree", phase_id: null },
    { review_scope: "integration", subject_kind: "phase", phase_id: "P-invalid" },
  ])("rejects schema-invalid shared phase/integration tuple (%o)", (tuple) => {
    const { task, kernel } = makeTask();
    const raw = phasePairedResult();
    Object.assign(raw, tuple);
    for (const member of Object.values(raw.role_results)) Object.assign(member, tuple);
    expect(() => recordSimpleReviewResult({ task, kernel, result: raw })).toThrow(/review identity tuple is invalid|phase subject requires/);
  });

  it.each([[true, true], [true, false], [false, false]])("records independently authenticated roles red=%s blue=%s without flattening", (redAvailable, blueAvailable) => {
    const { task, kernel } = makeTask();
    const raw = pairedResult({ redAvailable, blueAvailable });
    const original = JSON.stringify(raw);
    const recorded = recordSimpleReviewResult({ task, kernel, result: raw });
    expect(recorded).toMatchObject({ status: "recorded", pair_id: raw.pair_id, semantic_status: redAvailable || blueAvailable ? "available" : "unavailable" });
    expect(recorded.role_results.red.attempt_ref).not.toBe(recorded.role_results.blue.attempt_ref);
    for (const [role, available] of [["red", redAvailable], ["blue", blueAvailable]]) {
      const refs = recorded.role_results[role];
      expect(refs.coverage).toBe(available ? "satisfied" : "incomplete");
      const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
      validateSchema("attempt", attempt);
      expect(attempt.provider_attempts).toHaveLength(1);
      if (available) {
        const semantic = JSON.parse(task.readRecord(refs.result_ref));
        validateSchema("result", semantic);
        expect(JSON.stringify(semantic.findings)).toContain(`${role} original finding`);
      } else {
        expect(refs.result_ref).toBeNull();
        expect(attempt.provider_attempts[0].error.code).toBe("PROCESS_DEAD");
      }
      expect(task.readRecord(recorded.report_ref)).toContain(refs.attempt_ref);
    }
    if (!redAvailable || !blueAvailable) expect(recorded.partial).toBe(true);
    expect(JSON.stringify(raw)).toBe(original);
  });

  it("retains valid member outputs when neither role meets its own quorum", () => {
    const { task, kernel } = makeTask();
    const raw = pairedResult({ minimum: 2 });
    const recorded = recordSimpleReviewResult({ task, kernel, result: raw });
    for (const role of ["red", "blue"]) {
      const refs = recorded.role_results[role];
      expect(refs).toMatchObject({ result_ref: null, semantic_status: "available", coverage: "incomplete" });
      const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
      expect(attempt.review_policy.minimum_heterologous).toBe(2);
      expect(attempt.provider_attempts[0].status).toBe("completed");
      const output = JSON.parse(task.readRecord(attempt.provider_attempts[0].output_ref));
      expect(output.content).toContain(`${role} original finding`);
    }
    expect(recorded.partial).toBe(true);
  });

  it.each(["material", "role", "source"])("rejects the mismatched %s within one role", (field) => {
    const { task, kernel } = makeTask();
    const raw = pairedResult();
    if (field === "material") raw.role_results.blue.material_id = "f".repeat(64);
    if (field === "role") raw.role_results.blue.role = "red";
    if (field === "source") raw.role_results.blue.provider_results[0].identity.source_id = "foreign/provider";
    expect(() => recordSimpleReviewResult({ task, kernel, result: raw })).toThrow(/material|role|source|identity/i);
  });

  it("accepts raw partial single review without discarding its failed member", () => {
    const { task, kernel } = makeTask();
    const raw = baseResult();
    raw.status = "available-with-failures";
    raw.outcome = "partial";
    raw.provider_results.push({ provider: "opencode/pax3.8", status: "failed", identity: { provider: "opencode/pax3.8", adapter: "opencode", source_id: "opencode/pax3.8", config_id: "pax", model: "pax" }, error: { code: "PROCESS_DEAD", message: "partial failure" }, evidence_anchor_valid: [], usage: null });
    const recorded = recordSimpleReviewResult({ task, kernel, result: raw });
    expect(recorded.result_ref).toBeNull();
    expect(task.readRecord(recorded.report_ref)).toContain('"coverage": "incomplete"');
    expect(JSON.parse(task.readRecord(recorded.attempt_ref)).provider_attempts[1].error.code).toBe("PROCESS_DEAD");
  });

  it("keeps semantic output when a failed provider has no identity", () => {
    const { task, kernel } = makeTask();
    const result = {
      ...baseResult(),
      status: "available-with-failures",
      outcome: "partial",
      provider_results: [
        ...baseResult().provider_results,
        {
          provider: "opencode/pax3.8",
          status: "failed",
          error: { code: "PROVIDER_NO_TERMINAL_RESULT", message: "provider session ended without a terminal result" },
          timing: { started_at_ms: 3, completed_at_ms: 4, duration_ms: 1 },
          usage: null,
        },
      ],
    };
    const recorded = recordSimpleReviewResult({ task, kernel, result });
    expect(recorded.result_ref).toBeNull();

    const attempt = JSON.parse(task.readRecord(recorded.attempt_ref));
    validateSchema("attempt", attempt);
    expect(attempt.terminal_status).toBe("unavailable");
    expect(attempt.provider_attempts).toHaveLength(2);
    expect(attempt.provider_attempts[1]).toMatchObject({
      provider: "opencode/pax3.8",
      status: "failed",
      error: { code: "PROVIDER_NO_TERMINAL_RESULT" },
    });
    expect(attempt.provider_attempts[1]).not.toHaveProperty("identity");

    const report = task.readRecord(recorded.report_ref);
    expect(report).toContain("# WorkflowHub review record");
    expect(report).toContain("PROVIDER_NO_TERMINAL_RESULT");
  });
});

describe("T005 request reuse and phase metadata", () => {
  it("does not dispatch again when only the reason changes after semantic output", async () => {
    const { task, kernel } = makeTask();
    const request = { stage: "build-code", host_provider: "codex/luna", materials: { implementation: "same bytes" } };
    let calls = 0;
    const runRound = async () => { calls += 1; return { ...baseResult(), material_id: createSimpleReviewPacket(request).material_id }; };
    const first = await recordSimpleReviewRequest({ task, kernel, request, runRound });
    const next = await recordSimpleReviewRequest({ task, kernel, request: { ...request, reason: "please recheck" }, runRound });
    expect(calls, "T005: reason is not new material or trusted route identity").toBe(1);
    expect(next).toMatchObject({ reused: true, result_ref: first.result_ref });
  });

  it("redispatches a failed prior review when the request material changes", async () => {
    const { task, kernel } = makeTask();
    const request = { stage: "build-code", host_provider: "codex/luna", materials: { implementation: "original" } };
    let calls = 0;
    const runRound = async (input) => {
      calls += 1;
      return { ...baseResult(), status: "unavailable", provider_results: [], findings: [], error: { code: "PROCESS_DEAD", message: "transport ended" }, material_id: createSimpleReviewPacket(input).material_id };
    };
    const first = await recordSimpleReviewRequest({ task, kernel, request, runRound });
    const next = await recordSimpleReviewRequest({ task, kernel, request: { ...request, materials: { implementation: "changed" } }, runRound });
    expect(calls).toBe(2);
    expect(next).toMatchObject({
      status: "recorded",
      reused: false,
      dispatch_state: "dispatched",
      result_ref: null,
    });
    expect(next.attempt_ref).not.toBe(first.attempt_ref);

    // The unchanged material still reuses the immutable transcript.
    const repeated = await recordSimpleReviewRequest({ task, kernel, request: { ...request, materials: { implementation: "changed" } }, runRound });
    expect(calls).toBe(2);
    expect(repeated).toMatchObject({
      status: "recorded",
      reused: true,
      dispatch_state: "reused",
      attempt_ref: next.attempt_ref,
      result_ref: null,
    });
  });

  it("binds request phase metadata through the canonical attempt and result", async () => {
    const { task, kernel } = makeTask();
    const request = { stage: "build-code", host_provider: "codex/luna", subject_kind: "phase", phase_id: "P2", reviewScope: "phase", materials: { implementation: "phase bytes" } };
    const recorded = await recordSimpleReviewRequest({ task, kernel, request, runRound: async () => ({ ...baseResult(), material_id: createSimpleReviewPacket(request).material_id }) });
    for (const ref of [recorded.attempt_ref, recorded.result_ref]) {
      expect(JSON.parse(task.readRecord(ref))).toMatchObject({ subject_kind: "phase", phase_id: "P2", review_scope: "phase" });
    }
    expect(task.readRecord(recorded.report_ref)).toContain("P2");
  });

  it("persists the canonical phase scope when a mini-task omits its default", async () => {
    const { task, kernel } = makeTask();
    const request = {
      stage: "build-code", review_kind: "mini_task.design", subject_kind: "phase", phase_id: "P-mini",
      host_provider: "codex/luna", materials: { implementation: "mini-task bytes" },
    };
    const recorded = await recordSimpleReviewRequest({
      task,
      kernel,
      request,
      runRound: async (input) => ({
        ...baseResult(),
        review_kind: "mini_task.design",
        subject_kind: "phase",
        phase_id: "P-mini",
        material_id: createSimpleReviewPacket(input).material_id,
      }),
    });
    expect(JSON.parse(task.readRecord(recorded.attempt_ref))).toMatchObject({
      review_kind: "mini_task.design", review_scope: "phase", subject_kind: "phase", phase_id: "P-mini",
    });
    expect(JSON.parse(task.readRecord(recorded.result_ref))).toMatchObject({
      review_kind: "mini_task.design", review_scope: "phase", subject_kind: "phase", phase_id: "P-mini",
    });
  });
});


describe("T006 paired persistence and reuse", () => {
  it("reuses the same immutable role records when the exact original raw result is recorded again", () => {
    const { task, kernel } = makeTask();
    const raw = pairedResult();
    const first = recordSimpleReviewResult({ task, kernel, result: raw });
    const before = task.listCanonicalReviewAttemptRefs();
    const replay = recordSimpleReviewResult({ task, kernel, result: raw });
    expect(replay.role_results).toEqual(first.role_results);
    expect(replay.report_ref).toBe(first.report_ref);
    expect(task.listCanonicalReviewAttemptRefs()).toEqual(before);
  });

  it("repairs a real report-directory write failure from the original raw result without duplicate role attempts", () => {
    const { task, kernel } = makeTask();
    const raw = pairedResult();
    const obstacle = join(task.taskPath, "quality/reviews/reports");
    mkdirSync(join(task.taskPath, "quality/reviews"), { recursive: true });
    writeFileSync(obstacle, "T006 real report directory obstacle");
    expect(() => recordSimpleReviewResult({ task, kernel, result: raw })).toThrow(/directory|ENOTDIR|EEXIST/i);
    const written = task.listCanonicalReviewAttemptRefs();
    expect(written.length).toBeGreaterThan(0);
    rmSync(obstacle);
    const repaired = recordSimpleReviewResult({ task, kernel, result: raw });
    const all = task.listCanonicalReviewAttemptRefs();
    expect(all).toHaveLength(2);
    for (const ref of written) expect(all).toContain(ref);
    for (const role of ["red", "blue"]) expect(task.readRecord(repaired.role_results[role].report_ref)).toBeTruthy();
  });

  it("reuses both paired roles and refuses an incomplete pair without another dispatch", async () => {
    const { task, kernel } = makeTask();
    const request = { stage: "make-decision", review_track: "detail", host_provider: "codex/luna", materials: { decision: "paired source" } };
    let dispatches = 0;
    const runRound = async () => {
      dispatches += 1;
      const raw = pairedResult();
      raw.material_id = createSimpleReviewPacket(request).material_id;
      for (const role of ["red", "blue"]) raw.role_results[role].material_id = raw.material_id;
      return raw;
    };
    const first = await recordSimpleReviewRequest({ task, kernel, request, runRound });
    const again = await recordSimpleReviewRequest({ task, kernel, request, runRound });
    expect(again.role_results).toEqual(first.role_results);
    expect(dispatches).toBe(1);
    rmSync(task.recordPath(first.role_results.blue.result_ref));
    await expect(recordSimpleReviewRequest({ task, kernel, request, runRound })).rejects.toMatchObject({ code: "REVIEW_RECORD_INCOMPLETE" });
    expect(dispatches).toBe(1);
  });
});

describe("T006 paired unavailable and output integrity", () => {
  it("retains blocked-before-dispatch roles without inventing provider selection or semantic results", () => {
    const { task, kernel } = makeTask();
    const raw = pairedResult({ redAvailable: false, blueAvailable: false });
    raw.provider_results = [];
    raw.dispatch_state = "blocked_before_dispatch";
    for (const role of ["red", "blue"]) {
      const member = raw.role_results[role];
      member.provider_results = [];
      member.dispatch_state = "blocked_before_dispatch";
      member.error = { code: "ROUTE_UNAVAILABLE", message: `${role} trusted route is missing` };
      delete member.provider_selection;
    }
    const stored = recordSimpleReviewResult({ task, kernel, result: raw });
    expect(stored.semantic_status).toBe("unavailable");
    for (const role of ["red", "blue"]) {
      const refs = stored.role_results[role];
      expect(refs.result_ref).toBeNull();
      const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
      expect(attempt.provider_attempts).toEqual([]);
      expect(attempt.error).toEqual(raw.role_results[role].error);
      expect(attempt).not.toHaveProperty("review_policy");
    }
  });

  it("refuses to reuse a pair after a persisted provider output is changed, without dispatching again", async () => {
    const { task, kernel } = makeTask();
    const request = { stage: "make-decision", review_track: "detail", host_provider: "codex/luna", materials: { decision: "paired tamper source" } };
    let dispatches = 0;
    const runRound = async () => {
      dispatches += 1;
      const raw = pairedResult();
      raw.material_id = createSimpleReviewPacket(request).material_id;
      for (const role of ["red", "blue"]) raw.role_results[role].material_id = raw.material_id;
      return raw;
    };
    const first = await recordSimpleReviewRequest({ task, kernel, request, runRound });
    const attempt = JSON.parse(task.readRecord(first.role_results.blue.attempt_ref));
    const outputRef = attempt.provider_attempts[0].output_ref;
    const output = JSON.parse(task.readRecord(outputRef));
    output.content = JSON.stringify({ findings: [] });
    writeFileSync(task.recordPath(outputRef), JSON.stringify(output));
    await expect(recordSimpleReviewRequest({ task, kernel, request, runRound })).rejects.toMatchObject({ code: "REVIEW_RECORD_INCOMPLETE" });
    expect(dispatches).toBe(1);
  });
});


describe("T006 explicit retry and current snapshot semantics", () => {
  function request(material = "review fixture") {
    return { stage: "build-code", host_provider: "codex/luna", materials: { implementation: material } };
  }

  it("redispatches when the submitted material bytes change without a retry", async () => {
    const { task, kernel } = makeTask();
    let calls = 0;
    const runRound = async (input) => { calls += 1; return { ...baseResult(), material_id: createSimpleReviewPacket(input).material_id }; };
    const first = await recordSimpleReviewRequest({ task, kernel, request: request("A"), runRound });
    const changed = await recordSimpleReviewRequest({ task, kernel, request: request("B"), runRound });
    expect(calls).toBe(2);
    expect(changed).toMatchObject({ status: "recorded", reused: false, dispatch_state: "dispatched" });
    expect(changed.attempt_ref).not.toBe(first.attempt_ref);
    const repeated = await recordSimpleReviewRequest({ task, kernel, request: request("B"), runRound });
    expect(calls).toBe(2);
    expect(repeated).toMatchObject({ status: "recorded", reused: true, dispatch_state: "reused", attempt_ref: changed.attempt_ref, result_ref: changed.result_ref });
  });

  it("admits an explicit material retry and reuses its exact retry head", async () => {
    const { task, kernel } = makeTask();
    let calls = 0;
    const runRound = async (input) => {
      calls += 1;
      return { ...baseResult(), material_id: createSimpleReviewPacket(input).material_id };
    };
    const first = await recordSimpleReviewRequest({ task, kernel, request: request("A"), runRound });
    const retryRequest = { ...request("B"), retry: { requested: true, basis: "material_changed", reason: "review input changed" } };
    const retried = await recordSimpleReviewRequest({ task, kernel, request: retryRequest, runRound });
    const repeated = await recordSimpleReviewRequest({
      task, kernel,
      request: { ...retryRequest, retry: { ...retryRequest.retry, reason: "same retry, different wording" } },
      runRound,
    });
    expect(calls).toBe(2);
    expect(retried).toMatchObject({ status: "recorded", reused: false, dispatch_state: "dispatched", retry: { requested: true, admitted: true } });
    expect(retried.attempt_ref).not.toBe(first.attempt_ref);
    expect(repeated).toMatchObject({ status: "recorded", reused: true, dispatch_state: "reused", attempt_ref: retried.attempt_ref, result_ref: retried.result_ref });
  });

  it("requires an accepted basis instead of trusting caller-only retry fields", async () => {
    const { task, kernel } = makeTask();
    let calls = 0;
    const runRound = async (input) => { calls += 1; return { ...baseResult(), material_id: createSimpleReviewPacket(input).material_id }; };
    await recordSimpleReviewRequest({ task, kernel, request: request("A"), runRound });
    const denied = await recordSimpleReviewRequest({
      task, kernel,
      request: { ...request("B"), retry: { requested: true, reason: "please try again" }, changed: true, budget: { remaining: 99 } },
      runRound,
    });
    expect(calls).toBe(1);
    expect(denied).toMatchObject({ status: "unavailable", dispatch_state: "blocked_before_dispatch", error: { code: "REVIEW_RETRY_NOT_ADMITTED" }, retry: { admitted: false } });
  });

  it("requires an explicit retry after a verify-code snapshot moves", async () => {
    const { task, kernel, candidateWorkspace } = makeTask();
    let calls = 0;
    const runRound = async (input) => {
      calls += 1;
      return { ...baseResult(), stage: "verify-code", findings: [], provider_results: baseResult().provider_results.map((provider) => ({ ...provider, evidence_anchor_valid: [] })), material_id: createSimpleReviewPacket(input).material_id };
    };
    const firstRequest = { stage: "verify-code", host_provider: "codex/luna", materials: { implementation: "before" } };
    const first = await recordSimpleReviewRequest({ task, kernel, request: firstRequest, runRound });
    writeFileSync(join(candidateWorkspace.worktreeRoot, "verify-code-repair.mjs"), "export const repaired = true;\n");
    const blocked = await recordSimpleReviewRequest({ task, kernel, request: firstRequest, runRound });
    expect(calls).toBe(1);
    expect(blocked).toMatchObject({ status: "unavailable", dispatch_state: "blocked_before_dispatch", error: { code: "REVIEW_CURRENT_SNAPSHOT_RETRY_REQUIRED" } });
    const retryRequest = { ...firstRequest, materials: { implementation: "after" }, retry: { requested: true, basis: "material_changed", reason: "current code snapshot changed" } };
    const retried = await recordSimpleReviewRequest({ task, kernel, request: retryRequest, runRound });
    expect(calls).toBe(2);
    expect(retried).toMatchObject({ status: "recorded", reused: false, dispatch_state: "dispatched", retry: { admitted: true } });
    expect(retried.attempt_ref).not.toBe(first.attempt_ref);
    writeFileSync(join(candidateWorkspace.worktreeRoot, "verify-code-repair-2.mjs"), "export const repairedAgain = true;\n");
    const blockedAgain = await recordSimpleReviewRequest({ task, kernel, request: { ...firstRequest, materials: { implementation: "third" } }, runRound });
    expect(calls).toBe(2);
    expect(blockedAgain).toMatchObject({ status: "unavailable", dispatch_state: "blocked_before_dispatch", error: { code: "REVIEW_CURRENT_SNAPSHOT_RETRY_REQUIRED" } });
  });
});

describe("T014 explicit retry and route identity", () => {
  const route = (value) => () => ({ route_identity: value.repeat(64) });
  const request = (material = "route retry fixture") => ({ stage: "build-code", host_provider: "codex/luna", materials: { implementation: material } });
  const providerFailure = (input) => ({
    ...baseResult(),
    status: "unavailable",
    outcome: "unavailable",
    findings: [],
    material_id: createSimpleReviewPacket(input).material_id,
    provider_results: baseResult().provider_results.map((member) => ({
      ...member,
      status: "failed",
      error: { code: "PROCESS_DEAD", message: "selected provider route failed" },
      evidence_anchor_valid: [],
    })),
    error: { code: "REVIEW_ALL_PROVIDERS_FAILED", message: "all selected providers failed" },
  });

  it("requires an explicit provider-changed retry and makes it idempotent", async () => {
    const { task, kernel } = makeTask();
    const input = request();
    let calls = 0;
    const runRound = async (received) => { calls += 1; return calls === 1 ? providerFailure(received) : { ...baseResult(), material_id: createSimpleReviewPacket(received).material_id }; };
    const first = await recordRequest({ task, kernel, request: input, runRound, resolveRouteIdentity: route("a") });
    const unchanged = await recordRequest({ task, kernel, request: input, runRound, resolveRouteIdentity: route("b") });
    expect(calls).toBe(1);
    expect(unchanged).toMatchObject({ status: "recorded", reused: true, dispatch_state: "reused", attempt_ref: first.attempt_ref });
    const retryRequest = { ...input, retry: { requested: true, basis: "provider_changed", reason: "trusted provider route changed" } };
    const retried = await recordRequest({ task, kernel, request: retryRequest, runRound, resolveRouteIdentity: route("b") });
    expect(calls).toBe(2);
    expect(retried).toMatchObject({ status: "recorded", reused: false, dispatch_state: "dispatched", retry: { requested: true, admitted: true } });
    const repeated = await recordRequest({ task, kernel, request: { ...retryRequest, retry: { ...retryRequest.retry, reason: "same route change, different wording" } }, runRound, resolveRouteIdentity: route("b") });
    expect(calls).toBe(2);
    expect(repeated).toMatchObject({ status: "recorded", reused: true, dispatch_state: "reused", attempt_ref: retried.attempt_ref });
  });

  it("does not admit provider_changed retry when the trusted route is unchanged", async () => {
    const { task, kernel } = makeTask();
    const input = request();
    let calls = 0;
    const runRound = async (received) => { calls += 1; return providerFailure(received); };
    const first = await recordRequest({ task, kernel, request: input, runRound, resolveRouteIdentity: route("a") });
    const denied = await recordRequest({ task, kernel, request: { ...input, retry: { requested: true, basis: "provider_changed", reason: "route was not actually changed" } }, runRound, resolveRouteIdentity: route("a") });
    expect(calls).toBe(1);
    expect(denied).toMatchObject({ status: "unavailable", reused: false, dispatch_state: "blocked_before_dispatch", error: { code: "REVIEW_RETRY_NOT_ADMITTED" }, retry: { admitted: false } });
    expect(denied.attempt_ref).toMatch(/^quality\/reviews\/attempts\//);
    expect(JSON.parse(task.readRecord(denied.attempt_ref))).toMatchObject({
      terminal_status: "unavailable",
      dispatch_state: "blocked_before_dispatch",
      error: { code: "REVIEW_RETRY_NOT_ADMITTED" },
      provider_attempts: [],
    });
    expect(first.attempt_ref).toBeTruthy();
  });

  it("uses source_recovered retry to dispatch after a blocked route preflight", async () => {
    const { task, kernel } = makeTask();
    const input = request();
    let calls = 0;
    const runRound = async (received) => { calls += 1; return { ...baseResult(), material_id: createSimpleReviewPacket(received).material_id }; };
    const unavailable = await recordRequest({ task, kernel, request: input, runRound, resolveRouteIdentity: () => { throw new Error("host route unavailable"); } });
    expect(calls).toBe(0);
    const retry = { ...input, retry: { requested: true, basis: "source_recovered", reason: "trusted route became available" } };
    const recovered = await recordRequest({ task, kernel, request: retry, runRound, resolveRouteIdentity: route("a") });
    expect(calls).toBe(1);
    expect(recovered).toMatchObject({ status: "recorded", reused: false, dispatch_state: "dispatched", retry: { admitted: true } });
    expect(unavailable.attempt_ref).not.toBe(recovered.attempt_ref);
  });
});

describe("T006 reviewed reuse and historical review integrity", () => {
  const input = () => ({ stage: "build-code", materials: { implementation: "stable reviewed source" } });
  function countedRunner() {
    let calls = 0;
    return { get calls() { return calls; }, runRound: async (request) => {
      calls += 1;
      return { ...baseResult(), material_id: createSimpleReviewPacket(request).material_id };
    } };
  }
  it.each(["output", "findings"])("refuses single semantic reuse with changed %s evidence", async (fault) => {
    const { task, kernel } = makeTask();
    const runner = countedRunner();
    const request = input();
    const first = await recordSimpleReviewRequest({ task, kernel, request, runRound: runner.runRound });
    if (fault === "output") {
      const attempt = JSON.parse(task.readRecord(first.attempt_ref));
      rmSync(task.recordPath(attempt.provider_attempts[0].output_ref));
    } else {
      const value = JSON.parse(task.readRecord(first.result_ref));
      value.findings = [];
      writeFileSync(task.recordPath(first.result_ref), JSON.stringify(value));
    }
    await expect(recordSimpleReviewRequest({ task, kernel, request, runRound: runner.runRound })).rejects.toMatchObject({ code: "REVIEW_RECORD_INCOMPLETE" });
    expect(runner.calls).toBe(1);
  });
  it("requires an explicit source_recovered retry after host route preflight repair", async () => {
    const { task, kernel } = makeTask();
    const runner = countedRunner();
    const request = input();
    const first = await recordSimpleReviewRequest({ task, kernel, request, runRound: runner.runRound,
      resolveRouteIdentity: () => { throw new Error("host route not configured"); } });
    expect(runner.calls).toBe(0);
    expect(JSON.parse(task.readRecord(first.attempt_ref)).dispatch_state).toBe("blocked_before_dispatch");
    const next = await recordSimpleReviewRequest({ task, kernel, request, runRound: runner.runRound });
    expect(runner.calls).toBe(0);
    expect(next).toMatchObject({ status: "recorded", reused: true, dispatch_state: "reused", attempt_ref: first.attempt_ref });
    const retry = await recordSimpleReviewRequest({ task, kernel,
      request: { ...request, retry: { requested: true, basis: "source_recovered", reason: "host route became available" } },
      runRound: runner.runRound });
    expect(runner.calls).toBe(1);
    expect(retry.result_ref).toBeTruthy();
    expect(retry.retry).toMatchObject({ requested: true, admitted: true, basis: "source_recovered" });
    expect(task.readRecord(first.report_ref)).toContain("host route not configured");
  });

  it("does not reuse a legacy unavailable attempt when the current route identity is missing", async () => {
    const { task, kernel } = makeTask();
    const runner = countedRunner();
    const request = input();
    const first = await recordSimpleReviewRequest({
      task,
      kernel,
      request,
      runRound: runner.runRound,
      resolveRouteIdentity: () => { throw new Error("host route not configured"); },
    });
    const second = await recordSimpleReviewRequest({
      task,
      kernel,
      request,
      runRound: runner.runRound,
      resolveRouteIdentity: () => { throw new Error("host route still unavailable"); },
    });

    expect(first.reused).not.toBe(true);
    expect(second.reused).not.toBe(true);
    expect(runner.calls).toBe(0);
    expect(second).toMatchObject({ status: "recorded", dispatch_state: "blocked_before_dispatch" });
    expect(second.attempt_ref).not.toBe(first.attempt_ref);
  });

  it("reuses a dispatched unavailable transport fact without an implicit retry", async () => {
    const { task, kernel } = makeTask();
    const request = { stage: "build-code", host_provider: "codex/luna", materials: { implementation: "bounded review fixture" } };
    let calls = 0;
    const runRound = async (prepared) => {
      calls += 1;
      if (calls === 1) {
        return {
          status: "unavailable", stage: "build-code", review_track: null, review_kind: null,
          material_id: createSimpleReviewPacket(prepared).material_id, runtime_id: null,
          outcome: "unavailable", provider_results: [], findings: [],
          error: { code: "REVIEW_INPUT_TOO_LARGE", message: "bounded provider material exceeded the transport limit" },
        };
      }
      return { ...baseResult(), material_id: createSimpleReviewPacket(prepared).material_id };
    };
    const first = await recordSimpleReviewRequest({ task, kernel, request, runRound });
    expect(first.dispatch_state).toBe("dispatched");
    const second = await recordSimpleReviewRequest({ task, kernel, request, runRound });
    expect(calls).toBe(1);
    expect(second).toMatchObject({ status: "recorded", reused: true, dispatch_state: "reused", attempt_ref: first.attempt_ref, result_ref: null });
  });

  it("reuses a zero-member REVIEW_WAIT_EXCEEDED fact and admits a materially changed retry", async () => {
    const { task, kernel } = makeTask();
    const request = { stage: "build-code", host_provider: "codex/luna", materials: { implementation: "bounded review fixture" } };
    let calls = 0;
    const runRound = async (prepared) => {
      calls += 1;
      if (calls === 1) {
        return {
          status: "unavailable", stage: "build-code", review_track: null, review_kind: null,
          material_id: createSimpleReviewPacket(prepared).material_id, runtime_id: "managed-review-still-running",
          outcome: "unavailable", provider_results: [], findings: [],
          dispatch_state: "sent_unparsed",
          error: { code: "REVIEW_WAIT_EXCEEDED", message: "managed review wait exceeded the bounded caller wait" },
        };
      }
      return { ...baseResult(), material_id: createSimpleReviewPacket(prepared).material_id };
    };
    const first = await recordSimpleReviewRequest({ task, kernel, request, runRound });
    expect(first.dispatch_state).toBe("sent_unparsed");
    const second = await recordSimpleReviewRequest({ task, kernel, request, runRound });
    expect(second).toMatchObject({ status: "recorded", reused: true, dispatch_state: "reused", attempt_ref: first.attempt_ref, result_ref: null });
    expect(calls).toBe(1);

    const retry = await recordSimpleReviewRequest({
      task,
      kernel,
      request: {
        ...request,
        materials: { implementation: "bounded review fixture after judged retry" },
        retry: { requested: true, basis: "material_changed", reason: "review input was materially changed" },
      },
      runRound,
    });
    expect(calls).toBe(2);
    expect(retry.retry).toMatchObject({ requested: true, admitted: true, basis: "material_changed" });
    expect(retry.result_ref).toBeTruthy();
  });
  it("reuses original semantic refs across task-only revision changes for the same reviewed materials", async () => {
    const { task, kernel, artifacts } = makeTask();
    const runner = countedRunner();
    const request = input();
    const first = await recordSimpleReviewRequest({ task, kernel, request, runRound: runner.runRound });
    const original = task.readRecord(first.attempt_ref);
    const revision = kernel.currentVNextMaterialRevision();
    artifacts.writeAtomic("tasks.md", "# Task bookkeeping after recorded review\n");
    expect(kernel.currentVNextMaterialRevision()).not.toBe(revision);
    const next = await recordSimpleReviewRequest({ task, kernel, request, runRound: runner.runRound });
    expect(runner.calls).toBe(1);
    expect(next).toMatchObject({ reused: true, attempt_ref: first.attempt_ref, result_ref: first.result_ref });
    expect(task.readRecord(first.attempt_ref)).toBe(original);
  });
  it("keeps historical review integrity when an earlier writer predates the result_ref binding", async () => {
    const { task, kernel, artifacts } = makeTask();
    const runner = countedRunner();
    const request = input();
    const first = await recordSimpleReviewRequest({ task, kernel, request, runRound: runner.runRound });
    // An earlier writer published the same authenticated binding without the
    // optional result_ref pointer. History reconstruction must still verify that
    // immutable history instead of failing closed on the added pointer alone.
    for (const ref of [first.attempt_ref, first.result_ref]) {
      const value = JSON.parse(task.readRecord(ref));
      delete value.result_ref;
      task.writeRecordAtomic(ref, JSON.stringify(value));
    }
    artifacts.writeAtomic("tasks.md", "# Task bookkeeping after a recorded review\n");
    const next = await recordSimpleReviewRequest({ task, kernel, request, runRound: runner.runRound });
    expect(next.error?.code).not.toBe("REVIEW_HISTORY_UNAVAILABLE");
    expect(next).toMatchObject({ status: "recorded", reused: true, attempt_ref: first.attempt_ref });
    expect(runner.calls).toBe(1);
  });
  it("ignores malformed historical review bytes from another phase namespace", async () => {
    const { task, kernel } = makeTask();
    const prior = recordSimpleReviewResult({ task, kernel, result: { ...baseResult(), status: "unavailable", provider_results: [], findings: [],
      subject_kind: "phase", phase_id: "P1", review_scope: "phase", error: { code: "PROCESS_TIMEOUT", message: "original provider timeout" } } });
    const old = JSON.parse(task.readRecord(prior.attempt_ref));
    const id = randomUUID();
    old.attempt_id = id;
    old.report_ref = `quality/reviews/reports/build-code-simple-${randomUUID()}.md`;
    const ref = `quality/reviews/attempts/${id}/attempt.json`;
    const report = ["# WorkflowHub review record", "", "status: unavailable", "terminal_status: unavailable",
      `task_id: ${old.task_id}`, `stage: ${old.stage}`, `attempt_id: ${id}`, `snapshot_tree: ${old.snapshot_tree}`,
      `material_id: ${old.material_id}`, "dispatch_state: dispatched", `error: ${JSON.stringify(old.error)}`, ""].join("\n");
    task.writeRecordAtomic(ref, JSON.stringify(old));
    task.writeRecordAtomic(old.report_ref, report.replace("original provider timeout", "forged timeout"));
    rmSync(task.recordPath(prior.attempt_ref).replace(/\/attempt\.json$/, ""), { recursive: true });
    rmSync(task.recordPath(prior.report_ref));
    const runner = countedRunner();
    const result = await recordSimpleReviewRequest({ task, kernel, request: { ...input(), subject_kind: "phase", phase_id: "P2", review_scope: "phase" }, runRound: runner.runRound });
    expect(runner.calls).toBe(1);
    expect(result.result_ref).toBeTruthy();
  });
});

describe("T005 managed source/material drift", () => {
  it("stops polling on material identity drift, records the failed attempt, and detaches without cancelling", async () => {
    const { task, kernel, artifacts } = makeTask();
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "review-record-source-material-drift-")));
    roots.push(attachmentRoot);
    const provider = "other/model";
    const request = { stage: "build-code", host_provider: "codex/luna", materials: { implementation: "source drift during wait" } };
    const calls = [];
    const runRound = (input) => runSimpleReview(input, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: [provider], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({
        providers: [provider],
        provider_identities: { [provider]: { source_id: "trusted-source", config_id: "trusted-config" } },
        provider_models: { [provider]: "trusted-model" },
      }),
      client: {
        async startManaged(value) {
          calls.push("start");
          return { version: "workflowhub-run.v1", request_id: value.requestId, runtime_id: "runtime-source-drift", state: "running", material_id: value.materials.materialId };
        },
        async statusManaged(value) {
          calls.push("status");
          artifacts.writeAtomic("spec.md", "source/material revision drifted while waiting\n");
          return {
            version: "workflowhub-run.v1", request_id: value.requestId, runtime_id: "runtime-source-drift",
            state: "running", material_id: "f".repeat(64),
            providers: { [provider]: { provider, status: "running", session_id: "session-source-drift", last_progress_at_ms: 11, error: null } },
          };
        },
        async cancelManaged() {
          calls.push("cancel");
          throw new Error("source drift must detach the live session instead of cancelling it");
        },
      },
      managedTerminalWaitMs: 0,
      managedStatusPollMs: 0,
    });

    const refs = await recordSimpleReviewRequest({ task, kernel, request, runRound });
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    expect(calls).toEqual(["start", "status"]);
    expect(calls).not.toContain("cancel");
    expect(refs).toMatchObject({ status: "recorded", reused: false, dispatch_state: "dispatched", result_ref: null });
    expect(attempt).toMatchObject({
      terminal_status: "unavailable",
      dispatch_state: "dispatched",
      error: { code: "REVIEW_SOURCE_DRIFT" },
      provider_attempts: [{ session_id: "session-source-drift", runtime_id: "runtime-source-drift" }],
    });
    expect(attempt.error.message).toMatch(/source|material|revision|drift/i);
    expect(task.readRecord(refs.report_ref)).toContain("REVIEW_SOURCE_DRIFT");
  });
});

describe("T006 degraded failed provider provenance", () => {
  // Reduced public shape of the observed P2 result; identifiers and timing are
  // synthetic and no provider session or raw private transport output is used.
  function degradedFailure() {
    return { provider: "grok/grok", status: "failed",
      identity: { provider: "grok/grok", adapter: "grok", model: "grok-4.6", source_id: "grok/grok", config_id: "fixture-grok-config" },
      error: { code: "PROVIDER_HEALTH_FAILED", message: "provider result is not bound to the trusted review selection; broker member identity was degraded" },
      identity_degraded: true, timing: { started_at_ms: 10, completed_at_ms: 20, duration_ms: 10 }, usage: null };
  }
  function addDegraded(result) {
    const bad = degradedFailure();
    result.provider_results.push(bad);
    result.provider_selection ??= { providers: [], provider_identities: {} };
    result.provider_selection.providers = result.provider_results.map((item) => item.provider);
    for (const member of result.provider_results) result.provider_selection.provider_identities[member.provider] = { ...member.identity };
    result.provider_selection.provider_identities[bad.provider].source_id = null;
    return result;
  }
  it("records cancelled and degraded failed members with original facts and no semantic result", () => {
    const { task, kernel } = makeTask();
    const raw = baseResult();
    Object.assign(raw, { status: "unavailable", findings: [], error: { code: "REVIEW_CANCELLED", message: "workflow shutdown", cause_code: "CANCELLED" } });
    Object.assign(raw.provider_results[0], { status: "cancelled", error: { code: "CANCELLED", message: "workflow shutdown" }, evidence_anchor_valid: [] });
    addDegraded(raw);
    const refs = recordSimpleReviewResult({ task, kernel, result: raw });
    expect(refs.result_ref).toBeNull();
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    validateSchema("attempt", attempt);
    expect(attempt.provider_attempts.map((item) => item.status)).toEqual(["cancelled", "failed"]);
    expect(attempt.provider_attempts[1].identity).toEqual(raw.provider_results[1].identity);
    expect(attempt.provider_attempts[1].error).toEqual(raw.provider_results[1].error);
    expect(attempt.provider_attempts[1].execution.timing).toEqual(raw.provider_results[1].timing);
    const saved = JSON.parse(task.readRecord(refs.report_ref).match(/## Public result and coverage\n\n```json\n([\s\S]*?)\n```/)[1]);
    expect(saved.public_result).toEqual(raw);
    expect(saved.semantic_status).toBe("unavailable");
  });
  it.each([1, 2])("retains valid completed output without counting degraded failure toward quorum %s", (minimum) => {
    const { task, kernel } = makeTask();
    const raw = addDegraded({ ...baseResult(), status: "available-with-failures", minimum_heterologous: minimum });
    const refs = recordSimpleReviewResult({ task, kernel, result: raw });
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    expect(attempt.review_policy.minimum_heterologous).toBe(minimum);
    expect(attempt.provider_attempts[0].output_ref).toBeTruthy();
    expect(attempt.provider_attempts[1].output_ref).toBeNull();
    expect(task.readRecord(attempt.provider_attempts[0].output_ref)).toContain("implementation material is thin");
    expect(Boolean(refs.result_ref)).toBe(minimum === 1);
    if (refs.result_ref) expect(JSON.parse(task.readRecord(refs.result_ref)).provider_results.map((member) => member.provider)).toEqual(["codex/luna"]);
  });
  it("still rejects a completed member with a mismatched trusted selection", () => {
    const { task, kernel } = makeTask();
    const raw = addDegraded(baseResult());
    raw.provider_results[1] = { ...raw.provider_results[1], status: "completed", error: null, evidence_anchor_valid: [] };
    expect(() => recordSimpleReviewResult({ task, kernel, result: raw })).toThrow(/source identity.*mismatch/i);
  });
  it("records a completed lifecycle member with a broker error as a failed fact", () => {
    const { task, kernel } = makeTask();
    const raw = addDegraded(baseResult());
    raw.provider_results[1] = {
      ...raw.provider_results[1],
      status: "completed",
      identity: null,
      error: { code: "EVIDENCE_ANCHOR_INVALID", message: "finding did not anchor" },
      evidence_anchor_valid: [],
    };
    const refs = recordSimpleReviewResult({ task, kernel, result: raw });
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    validateSchema("attempt", attempt);
    expect(attempt.provider_attempts[1].status).toBe("failed");
    expect(Object.hasOwn(attempt.provider_attempts[1], "identity")).toBe(false);
    expect(attempt.provider_attempts[1].error.code).toBe("EVIDENCE_ANCHOR_INVALID");
  });
  it("retains paired failed roles even when degraded identities are unavailable", () => {
    const { task, kernel } = makeTask();
    const raw = pairedResult({ redAvailable: false, blueAvailable: false });
    for (const role of ["red", "blue"]) {
      addDegraded(raw.role_results[role]);
      raw.role_results[role].provider_results[1].identity = null;
    }
    const refs = recordSimpleReviewResult({ task, kernel, result: raw });
    expect(refs.semantic_status).toBe("unavailable");
    for (const role of ["red", "blue"]) {
      const attempt = JSON.parse(task.readRecord(refs.role_results[role].attempt_ref));
      validateSchema("attempt", attempt);
      expect(Object.hasOwn(attempt.provider_attempts[1], "identity")).toBe(false);
      expect(attempt.provider_attempts[1].error.code).toBe("PROVIDER_HEALTH_FAILED");
      expect(refs.role_results[role].result_ref).toBeNull();
    }
  });
});

describe("trusted review route selection shape", () => {
  const routeInput = { stage: "build-code", review_scope: "phase", host_provider: "codex" };
  const routeDependencies = (selection) => ({
    loadConfig: () => ({ whReview: {}, config: {} }),
    resolveRoute: () => ({ initial: ["other/model"], mode: "single_round" }),
    selectProviders: () => selection,
  });

  it("accepts a selection whose identity map matches the providers exactly", () => {
    const resolved = resolveReviewRouteIdentity(routeInput, routeDependencies({
      providers: ["other/model"],
      provider_identities: { "other/model": { source_id: "trusted-source", config_id: "trusted-config" } },
    }));
    expect(resolved.provider_selection).toEqual({
      providers: ["other/model"],
      provider_identities: { "other/model": { source_id: "trusted-source", config_id: "trusted-config" } },
    });
    expect(resolved.route_identity).toMatch(/^[a-f0-9]{64}$/);
  });

  it("accepts a selection without an identity map", () => {
    const resolved = resolveReviewRouteIdentity(routeInput, routeDependencies({ providers: ["other/model"] }));
    expect(resolved.provider_selection).toEqual({ providers: ["other/model"] });
  });

  it.each([
    ["null identity", { providers: ["other/model"], provider_identities: { "other/model": null } }],
    ["scalar identity", { providers: ["other/model"], provider_identities: { "other/model": "trusted-source" } }],
    ["missing key", { providers: ["other/model", "third/model"], provider_identities: {
      "other/model": { source_id: "trusted-source", config_id: "trusted-config" },
    } }],
    ["extra key", { providers: ["other/model"], provider_identities: {
      "other/model": { source_id: "trusted-source", config_id: "trusted-config" },
      "third/model": { source_id: "trusted-source", config_id: "trusted-config" },
    } }],
    ["missing field", { providers: ["other/model"], provider_identities: { "other/model": { source_id: "trusted-source" } } }],
    ["unknown field", { providers: ["other/model"], provider_identities: { "other/model": {
      source_id: "trusted-source", config_id: "trusted-config", model: "smuggled",
    } } }],
    ["empty source id", { providers: ["other/model"], provider_identities: { "other/model": { source_id: "  ", config_id: "trusted-config" } } }],
    ["empty config id", { providers: ["other/model"], provider_identities: { "other/model": { source_id: "trusted-source", config_id: "" } } }],
  ])("rejects a %s in the trusted selection", (_label, selection) => {
    expect(() => resolveReviewRouteIdentity(routeInput, routeDependencies(selection)))
      .toThrow(/PROVIDER_SELECTION_INVALID/);
  });

  it("derives a different route identity when the trusted selection changes", () => {
    const first = resolveReviewRouteIdentity(routeInput, routeDependencies({
      providers: ["other/model"], provider_identities: { "other/model": { source_id: "source-a", config_id: "config-a" } },
    }));
    const second = resolveReviewRouteIdentity(routeInput, routeDependencies({
      providers: ["other/model"], provider_identities: { "other/model": { source_id: "source-b", config_id: "config-a" } },
    }));
    expect(first.route_identity).not.toBe(second.route_identity);
  });

  it("fails closed with a typed code when the default resolver has no route dependencies", () => {
    expect(() => resolveReviewRouteIdentity(routeInput)).toThrow(/REVIEW_ROUTE_DEPENDENCIES_REQUIRED|route dependencies are required/);
  });
});

describe("runtime route dependency default path", () => {
  it("blocks the default-route request with a typed code and never dispatches", async () => {
    const { task, kernel } = makeTask();
    let rounds = 0;
    const refs = await recordRuntimeRequest({
      task,
      kernel,
      request: { stage: "build-code", host_provider: "codex", materials: { implementation: "default route bytes" } },
      runRound: async () => { rounds += 1; return { ...baseResult(), material_id: "a".repeat(64) }; },
    });

    expect(rounds).toBe(0);
    // The blocked request is still recorded as an immutable quality fact; the
    // typed route-dependency failure is the recorded diagnostic, not a throw.
    expect(refs).toMatchObject({
      status: "recorded",
      dispatch_state: "blocked_before_dispatch",
      result_ref: null,
      error: { code: "REVIEW_ROUTE_DEPENDENCIES_REQUIRED" },
    });
  });

  it("resolves the default route when the trusted dependencies are threaded through", async () => {
    const { task, kernel } = makeTask();
    const request = { stage: "build-code", host_provider: "codex", materials: { implementation: "threaded route bytes" } };
    const materialId = createSimpleReviewPacket(request).material_id;
    let rounds = 0;
    const refs = await recordRuntimeRequest({
      task,
      kernel,
      request,
      routeDependencies: {
        loadConfig: () => ({ whReview: {}, config: {} }),
        resolveRoute: () => ({ initial: ["other/model"], mode: "single_round" }),
        selectProviders: () => ({
          providers: ["other/model"],
          provider_identities: { "other/model": { source_id: "trusted-source", config_id: "trusted-config" } },
        }),
      },
      runRound: async () => {
        rounds += 1;
        return {
          ...baseResult(),
          material_id: materialId,
          provider_results: [{
            provider: "other/model",
            status: "completed",
            identity: { provider: "other/model", adapter: "other", source_id: "trusted-source", config_id: "trusted-config" },
            error: null,
            timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 },
            usage: null,
            evidence_anchor_valid: [],
          }],
          findings: [],
        };
      },
    });

    expect(rounds).toBe(1);
    expect(refs.error?.code).not.toBe("REVIEW_ROUTE_DEPENDENCIES_REQUIRED");
  });
});

describe("authenticated evidence canonicalization", () => {
  it("records path-bearing authenticated evidence through one canonical byte form", async () => {
    const { task, kernel } = makeTask();
    const request = {
      stage: "build-code",
      host_provider: "codex/luna",
      materials: { implementation: "evidence bytes" },
      authenticated_evidence: { ref: "quality/evidence.json", note: "read /Users/Hugh/private/secret.md first" },
    };
    const packet = createSimpleReviewPacket(request);
    const runRound = async () => ({
      ...baseResult(),
      material_id: packet.material_id,
      authenticated_evidence: packet.authenticated_evidence,
      authenticated_evidence_sha256: packet.authenticated_evidence_sha256,
    });

    const refs = await recordSimpleReviewRequest({ task, kernel, request, runRound });
    expect(refs.result_ref).toBeTruthy();

    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    const result = JSON.parse(task.readRecord(refs.result_ref));
    expect(attempt.authenticated_evidence_sha256).toBe(packet.authenticated_evidence_sha256);
    expect(result.authenticated_evidence_sha256).toBe(packet.authenticated_evidence_sha256);
    // The stored public facts carry the redacted projection, never the raw
    // host path that was authenticated.
    expect(task.readRecord(refs.report_ref)).not.toContain("/Users/Hugh/private/secret.md");
  });
});
