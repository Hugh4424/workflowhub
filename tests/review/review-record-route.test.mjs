import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { recordSimpleReviewRequest as recordRequest, recordSimpleReviewResult } from "../../runtime/review/review-record-route.mjs";
import { validateSchema } from "../../runtime/review/schema-validator.mjs";
import { createSimpleReviewPacket, runSimpleReview } from "../../skills/wh-review/scripts/simple-review-runner.mjs";

// Only the fixture dependency is simulated; production defaults still resolve host configuration.
const fixtureRouteIdentity = () => ({ route_identity: "a".repeat(64) });
const recordSimpleReviewRequest = (options) => recordRequest({ resolveRouteIdentity: fixtureRouteIdentity, ...options });

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
    outcome: "partial",
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

describe("review record route", () => {
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

  it("binds authenticated supplemental evidence separately from the base material identity", async () => {
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
    expect(attempt.material_id).toBe(createSimpleReviewPacket({ stage: request.stage, materials: request.materials }).material_id);
    expect(attempt.authenticated_evidence_sha256).toBe(packet.authenticated_evidence_sha256);
    expect(result.authenticated_evidence_sha256).toBe(packet.authenticated_evidence_sha256);
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

  it("rejects a runner result whose material fingerprint is not the requested material", async () => {
    const { task, kernel } = makeTask();
    const request = { stage: "build-code", materials: { implementation: "requested" } };
    await expect(recordSimpleReviewRequest({
      task, kernel, request,
      materialIdForRequest: (value) => createSimpleReviewPacket(value).material_id,
      runRound: async () => ({ ...baseResult(), material_id: createSimpleReviewPacket({ stage: "build-code", materials: { implementation: "other" } }).material_id }),
    })).rejects.toMatchObject({ code: "REVIEW_MATERIAL_MISMATCH" });
  });

  it("binds an explicitly supplied material fingerprint without trusting the runner", async () => {
    const { task, kernel } = makeTask();
    const request = { stage: "build-code", material_id: "a".repeat(64), materials: { implementation: "requested" } };
    await expect(recordSimpleReviewRequest({
      task, kernel, request,
      runRound: async () => ({ ...baseResult(), material_id: "b".repeat(64) }),
    })).rejects.toMatchObject({ code: "REVIEW_MATERIAL_MISMATCH" });
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

describe("T005 paired canonical role consumption", () => {
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
    raw.provider_results.push({ provider: "opencode/pax3.8", status: "failed", identity: { provider: "opencode/pax3.8", adapter: "opencode", source_id: "opencode/pax3.8", config_id: "pax", model: "pax" }, error: { code: "PROCESS_DEAD", message: "partial failure" }, evidence_anchor_valid: [], usage: null });
    const recorded = recordSimpleReviewResult({ task, kernel, result: raw });
    expect(JSON.parse(task.readRecord(recorded.result_ref)).findings).toHaveLength(1);
    expect(JSON.parse(task.readRecord(recorded.attempt_ref)).provider_attempts[1].error.code).toBe("PROCESS_DEAD");
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

  it("does not retry a failed prior review with changed material when trusted transport budget is unknown", async () => {
    const { task, kernel } = makeTask();
    const request = { stage: "build-code", host_provider: "codex/luna", materials: { implementation: "original" } };
    let calls = 0;
    const runRound = async (input) => {
      calls += 1;
      return { ...baseResult(), status: "unavailable", provider_results: [], findings: [], error: { code: "PROCESS_DEAD", message: "transport ended" }, material_id: createSimpleReviewPacket(input).material_id };
    };
    await recordSimpleReviewRequest({ task, kernel, request, runRound });
    const next = await recordSimpleReviewRequest({ task, kernel, request: { ...request, materials: { implementation: "changed" } }, runRound });
    expect(calls, "T005: changed material does not prove remaining transport retry budget").toBe(1);
    expect(JSON.stringify(next)).toMatch(/unavailable|unknown|budget/i);
  });

  it("binds request phase metadata through the canonical attempt and result", async () => {
    const { task, kernel } = makeTask();
    const request = { stage: "build-code", host_provider: "codex/luna", subject_kind: "phase", phase_id: "P2", review_scope: "phase", materials: { implementation: "phase bytes" } };
    const recorded = await recordSimpleReviewRequest({ task, kernel, request, runRound: async () => ({ ...baseResult(), material_id: createSimpleReviewPacket(request).material_id }) });
    for (const ref of [recorded.attempt_ref, recorded.result_ref]) {
      expect(JSON.parse(task.readRecord(ref))).toMatchObject({ subject_kind: "phase", phase_id: "P2", review_scope: "phase" });
    }
    expect(task.readRecord(recorded.report_ref)).toContain("P2");
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


describe("T006 trusted review-round budget from actual task history", () => {
  function runnerCounter({ failFirst = true } = {}) {
    let calls = 0;
    return {
      get calls() { return calls; },
      runRound: async (request) => {
        calls += 1;
        const result = { ...baseResult(), material_id: createSimpleReviewPacket(request).material_id };
        if (failFirst && calls === 1) Object.assign(result, { status: "unavailable", provider_results: [], findings: [], error: { code: "PROCESS_DEAD", message: "real fixture attempt failed" } });
        return result;
      },
    };
  }
  async function deniedOrRecorded(input) {
    try { return await recordSimpleReviewRequest(input); }
    catch (error) { return { error: { code: error.code, message: error.message } }; }
  }
  function request() {
    return { stage: "build-code", host_provider: "codex/luna", materials: { implementation: "budget fixture" } };
  }

  it("allows one focused review after a real material repair and exhausts it within the same revision", async () => {
    const { task, kernel, artifacts, candidateWorkspace } = makeTask();
    const input = request();
    const runner = runnerCounter();
    const first = await recordSimpleReviewRequest({ task, kernel, request: input, runRound: runner.runRound });
    expect(runner.calls).toBe(1);
    const revisionBefore = kernel.currentVNextMaterialRevision();
    artifacts.writeAtomic("spec.md", "# Real current specification repair\n");
    expect(kernel.currentVNextMaterialRevision()).not.toBe(revisionBefore);
    const second = await recordSimpleReviewRequest({ task, kernel, request: input, runRound: runner.runRound });
    expect(runner.calls, "T006: authenticated material repair permits one existing focused review round").toBe(2);
    expect(second.result_ref).not.toBeNull();
    expect(task.readRecord(second.report_ref)).toMatch(/budget_context/);
    expect(task.readRecord(second.report_ref)).toMatch(/focused/);
    const repairedRevision = kernel.currentVNextMaterialRevision();
    writeFileSync(join(candidateWorkspace.worktreeRoot, "budget-code.mjs"), "export const repaired = true;\n");
    expect(kernel.currentVNextMaterialRevision()).toBe(repairedRevision);
    const denied = await deniedOrRecorded({ task, kernel, request: input, runRound: runner.runRound });
    expect(runner.calls, "T006: a second code change does not reset the focused round allowance").toBe(2);
    expect(JSON.stringify(denied)).toMatch(/budget|exhausted|unavailable/i);
    expect(task.readRecord(first.report_ref)).toMatch(/budget_context/);
  });

  it("cannot turn request-only edits or self-reported budget into a real repair", async () => {
    const { task, kernel } = makeTask();
    const runner = runnerCounter();
    const input = request();
    await recordSimpleReviewRequest({ task, kernel, request: input, runRound: runner.runRound });
    const revision = kernel.currentVNextMaterialRevision();
    const denied = await deniedOrRecorded({ task, kernel, request: { ...input, materials: { implementation: "caller changed these bytes only" }, changed: true, budget: { remaining: 99 } }, runRound: runner.runRound });
    expect(kernel.currentVNextMaterialRevision()).toBe(revision);
    expect(runner.calls).toBe(1);
    expect(JSON.stringify(denied)).toMatch(/budget|repair|unavailable|host.owned/i);
  });

  it.each(["missing", "corrupt"])("keeps budget unknown when necessary prior report is %s", async (fault) => {
    const { task, kernel, artifacts } = makeTask();
    const runner = runnerCounter();
    const input = request();
    const first = await recordSimpleReviewRequest({ task, kernel, request: input, runRound: runner.runRound });
    if (fault === "missing") rmSync(task.recordPath(first.report_ref));
    else writeFileSync(task.recordPath(first.report_ref), "corrupt budget provenance");
    artifacts.writeAtomic("spec.md", "# Real repair with unavailable budget history\n");
    const denied = await deniedOrRecorded({ task, kernel, request: input, runRound: runner.runRound });
    expect(runner.calls).toBe(1);
    expect(JSON.stringify(denied)).toMatch(/budget|unknown|incomplete|unavailable/i);
  });

  it("does not reset a phase allowance on code-only edits but permits one review for a new actual material revision", async () => {
    const { task, kernel, artifacts, candidateWorkspace } = makeTask();
    const input = { ...request(), subject_kind: "phase", phase_id: "P2", review_scope: "phase" };
    const runner = runnerCounter();
    await recordSimpleReviewRequest({ task, kernel, request: input, runRound: runner.runRound });
    const revision = kernel.currentVNextMaterialRevision();
    writeFileSync(join(candidateWorkspace.worktreeRoot, "phase-code.mjs"), "export const changed = true;\n");
    expect(kernel.currentVNextMaterialRevision()).toBe(revision);
    await deniedOrRecorded({ task, kernel, request: input, runRound: runner.runRound });
    expect(runner.calls).toBe(1);
    artifacts.writeAtomic("spec.md", "# Material revision with a verified phase repair\n");
    const next = await recordSimpleReviewRequest({ task, kernel, request: input, runRound: runner.runRound });
    expect(runner.calls, "T006: phase budget is scoped to the actual material revision").toBe(2);
    expect(next.result_ref).not.toBeNull();
    expect(task.readRecord(next.report_ref)).toMatch(/budget_context/);
  });
});

describe("T014 authenticated route-repair review budget", () => {
  const route = (value) => () => ({ route_identity: value.repeat(64) });
  const request = () => ({ stage: "build-code", host_provider: "codex/luna", materials: { implementation: "route repair fixture" } });
  const providerFailure = (input) => {
    const result = { ...baseResult(), material_id: createSimpleReviewPacket(input).material_id };
    result.status = "unavailable";
    result.outcome = "unavailable";
    result.findings = [];
    result.provider_results = result.provider_results.map((member) => ({
      ...member,
      status: "failed",
      error: { code: "PROCESS_DEAD", message: "selected provider route failed" },
      evidence_anchor_valid: [],
    }));
    result.error = { code: "REVIEW_ALL_PROVIDERS_FAILED", message: "all selected providers failed" };
    return result;
  };

  it("permits exactly one same-revision retry after a canonical provider failure and changed host route identity", async () => {
    const { task, kernel } = makeTask();
    const input = request();
    let calls = 0;
    const runRound = async (received) => {
      calls += 1;
      return calls === 1
        ? providerFailure(received)
        : { ...baseResult(), material_id: createSimpleReviewPacket(received).material_id };
    };

    const first = await recordRequest({ task, kernel, request: input, runRound, resolveRouteIdentity: route("a") });
    expect(JSON.parse(task.readRecord(first.attempt_ref)).provider_attempts).toMatchObject([{ status: "failed" }]);

    const repaired = await recordRequest({ task, kernel, request: input, runRound, resolveRouteIdentity: route("b") });
    expect(calls).toBe(2);
    expect(repaired.review_budget).toMatchObject({ ok: true, route: "route_repair_review", counts: { route_repair: 0 } });
    expect(task.readRecord(repaired.report_ref)).toContain('"kind": "route_repair"');

    const denied = await recordRequest({ task, kernel, request: input, runRound, resolveRouteIdentity: route("c") });
    expect(calls).toBe(2);
    expect(denied).toMatchObject({ status: "unavailable", dispatch_state: "blocked_before_dispatch",
      error: { code: "REVIEW_RETRY_BUDGET_EXHAUSTED" }, review_budget: { counts: { route_repair: 1 } } });
  });

  it.each(["successful", "failed"])("ignores a %s old-revision attempt when repairing the latest current-revision provider failure", async (oldOutcome) => {
    const { task, kernel, artifacts } = makeTask();
    const oldInput = { ...request(), materials: { implementation: `old revision ${oldOutcome}` } };
    const currentInput = request();
    let calls = 0;
    const runRound = async (received) => {
      calls += 1;
      if (received.materials.implementation === oldInput.materials.implementation) {
        return oldOutcome === "failed"
          ? providerFailure(received)
          : { ...baseResult(), material_id: createSimpleReviewPacket(received).material_id };
      }
      return calls === 2
        ? providerFailure(received)
        : { ...baseResult(), material_id: createSimpleReviewPacket(received).material_id };
    };

    await recordRequest({ task, kernel, request: oldInput, runRound, resolveRouteIdentity: route("c") });
    artifacts.writeAtomic("spec.md", `# Current revision after old ${oldOutcome} review\n`);
    const currentFailure = await recordRequest({ task, kernel, request: currentInput, runRound, resolveRouteIdentity: route("a") });
    expect(task.readRecord(currentFailure.report_ref)).toContain('"kind": "focused"');

    const repaired = await recordRequest({ task, kernel, request: currentInput, runRound, resolveRouteIdentity: route("b") });
    expect(calls).toBe(3);
    expect(repaired.review_budget).toMatchObject({ ok: true, route: "route_repair_review", counts: { route_repair: 0 } });
    expect(task.readRecord(repaired.report_ref)).toContain('"kind": "route_repair"');
  });

  it.each([
    ["zero provider attempts", (result) => ({ ...result, provider_results: [], error: { code: "REVIEW_STATUS_UNAVAILABLE", message: "status unavailable" } })],
    ["protocol failure", (result) => ({ ...result, error: { code: "PROTOCOL_INCOMPATIBLE", message: "protocol mismatch" } })],
    ["semantic output", (result) => ({ ...result, status: "available-with-failures", outcome: "partial", findings: baseResult().findings,
      provider_results: baseResult().provider_results, error: { code: "REVIEW_QUORUM_INCOMPLETE", message: "partial result" } })],
  ])("does not grant route-repair budget for %s", async (_name, mutate) => {
    const { task, kernel } = makeTask();
    const input = request();
    let calls = 0;
    const runRound = async (received) => {
      calls += 1;
      const failed = providerFailure(received);
      return calls === 1 ? mutate(failed) : { ...baseResult(), material_id: createSimpleReviewPacket(received).material_id };
    };
    await recordRequest({ task, kernel, request: input, runRound, resolveRouteIdentity: route("a") });
    const denied = await recordRequest({ task, kernel, request: { ...input, route_repaired: true }, runRound, resolveRouteIdentity: route("b") });
    expect(calls).toBe(1);
    expect(denied).toMatchObject({ status: "unavailable", dispatch_state: "blocked_before_dispatch",
      error: { code: "REVIEW_RETRY_BUDGET_EXHAUSTED" } });
  });

  it("does not grant route-repair budget when the host route identity did not change", async () => {
    const { task, kernel } = makeTask();
    const input = request();
    let calls = 0;
    const runRound = async (received) => { calls += 1; return providerFailure(received); };
    await recordRequest({ task, kernel, request: input, runRound, resolveRouteIdentity: route("a") });
    const reused = await recordRequest({ task, kernel, request: { ...input, route_repaired: true }, runRound, resolveRouteIdentity: route("a") });
    expect(calls).toBe(1);
    expect(reused.reused).toBe(true);
    expect(reused.review_budget.ok).toBe(false);
  });

  it.each(["materials", "snapshot"])("does not treat a route change plus changed %s as route repair", async (changed) => {
    const { task, kernel, candidateWorkspace } = makeTask();
    const input = request();
    let calls = 0;
    const runRound = async (received) => { calls += 1; return providerFailure(received); };
    await recordRequest({ task, kernel, request: input, runRound, resolveRouteIdentity: route("a") });
    if (changed === "snapshot") writeFileSync(join(candidateWorkspace.worktreeRoot, "route-repair-code.mjs"), "export const changed = true;\n");
    const nextRequest = changed === "materials" ? { ...input, materials: { implementation: "different review packet" } } : input;
    const denied = await recordRequest({ task, kernel, request: nextRequest, runRound, resolveRouteIdentity: route("b") });
    expect(calls).toBe(1);
    expect(denied).toMatchObject({ status: "unavailable", dispatch_state: "blocked_before_dispatch",
      error: { code: "REVIEW_RETRY_BUDGET_EXHAUSTED" } });
    expect(denied.review_budget.route).not.toBe("route_repair_review");
  });

  it("starts a separate initial budget for a changed review subject instead of route repair", async () => {
    const { task, kernel } = makeTask();
    const input = { ...request(), subject: { component: "runtime/review" } };
    let calls = 0;
    const runRound = async (received) => { calls += 1; return providerFailure(received); };
    await recordRequest({ task, kernel, request: input, runRound, resolveRouteIdentity: route("a") });
    const denied = await recordRequest({ task, kernel,
      request: { ...input, subject: { component: "runtime/evidence" } }, runRound, resolveRouteIdentity: route("b") });
    expect(calls).toBe(2);
    expect(denied).toMatchObject({ status: "recorded", dispatch_state: "dispatched" });
    expect(denied.review_budget.route).not.toBe("route_repair_review");
  });

  it("rejects a generic aggregate failure whose provider member has an excluded protocol error", async () => {
    const { task, kernel } = makeTask();
    const input = request();
    let calls = 0;
    const runRound = async (received) => {
      calls += 1;
      const failed = providerFailure(received);
      failed.provider_results[0].error = { code: "PROTOCOL_INCOMPATIBLE", message: "member protocol mismatch" };
      return failed;
    };
    await recordRequest({ task, kernel, request: input, runRound, resolveRouteIdentity: route("a") });
    const denied = await recordRequest({ task, kernel, request: input, runRound, resolveRouteIdentity: route("b") });
    expect(calls).toBe(1);
    expect(denied.review_budget).toMatchObject({ ok: false, reason: "route_repair_provider_failure_ineligible" });
  });

  it("rejects route repair when either failed member of a paired review has an excluded error", async () => {
    const { task, kernel } = makeTask();
    const input = { stage: "make-decision", review_track: "detail", host_provider: "codex/luna", materials: { decision: "paired route repair" } };
    let calls = 0;
    const runRound = async (received) => {
      calls += 1;
      const raw = pairedResult({ redAvailable: false, blueAvailable: false });
      raw.material_id = createSimpleReviewPacket(received).material_id;
      for (const role of ["red", "blue"]) raw.role_results[role].material_id = raw.material_id;
      raw.role_results.blue.provider_results[0].error = { code: "REVIEW_MATERIAL_MISMATCH", message: "blue member material mismatch" };
      raw.role_results.blue.error = { code: "REVIEW_ALL_PROVIDERS_FAILED", message: "generic paired failure" };
      return raw;
    };
    await recordRequest({ task, kernel, request: input, runRound, resolveRouteIdentity: route("a") });
    const denied = await recordRequest({ task, kernel, request: input, runRound, resolveRouteIdentity: route("b") });
    expect(calls).toBe(1);
    expect(denied.review_budget).toMatchObject({ ok: false, reason: "route_repair_provider_failure_ineligible" });
  });

  it("keeps a canonical attempt without authenticated route identity ineligible", async () => {
    const { task, kernel } = makeTask();
    const input = request();
    const failed = providerFailure(input);
    recordSimpleReviewResult({ task, kernel, result: failed });
    let calls = 0;
    const denied = await recordRequest({ task, kernel, request: input,
      runRound: async () => { calls += 1; return baseResult(); }, resolveRouteIdentity: route("b") });
    expect(calls).toBe(0);
    expect(denied).toMatchObject({ status: "unavailable", dispatch_state: "blocked_before_dispatch",
      error: { code: "REVIEW_RETRY_BUDGET_EXHAUSTED" } });
  });
});

describe("T006 paired budget counts", () => {
  it("counts the two role attempts as one initial round when refusing an unproven retry", async () => {
    const { task, kernel } = makeTask();
    const request = { stage: "make-decision", review_track: "detail", host_provider: "codex/luna", materials: { decision: "pair budget source" } };
    let calls = 0;
    const runRound = async (input) => {
      calls += 1;
      const raw = pairedResult({ redAvailable: false, blueAvailable: false });
      raw.material_id = createSimpleReviewPacket(input).material_id;
      for (const role of ["red", "blue"]) raw.role_results[role].material_id = raw.material_id;
      return raw;
    };
    await recordSimpleReviewRequest({ task, kernel, request, runRound });
    const denied = await recordSimpleReviewRequest({ task, kernel, request: { ...request, materials: { decision: "request-only pair change" } }, runRound });
    expect(calls).toBe(1);
    expect(denied.review_budget.counts.initial).toBe(1);
  });
});

describe("T006 reviewed reuse and historical budget integrity", () => {
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
  it("allows the first actual dispatch after host route preflight repair", async () => {
    const { task, kernel } = makeTask();
    const runner = countedRunner();
    const request = input();
    const first = await recordSimpleReviewRequest({ task, kernel, request, runRound: runner.runRound,
      resolveRouteIdentity: () => { throw new Error("host route not configured"); } });
    expect(runner.calls).toBe(0);
    expect(JSON.parse(task.readRecord(first.attempt_ref)).dispatch_state).toBe("blocked_before_dispatch");
    const next = await recordSimpleReviewRequest({ task, kernel, request, runRound: runner.runRound });
    expect(runner.calls).toBe(1);
    expect(next.result_ref).toBeTruthy();
    expect(task.readRecord(first.report_ref)).toContain("host route not configured");
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
  it.each([false, true])("validates old writer unavailable reports before phase review (tamper=%s)", async (tamper) => {
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
    task.writeRecordAtomic(old.report_ref, tamper ? report.replace("original provider timeout", "forged timeout") : report);
    rmSync(task.recordPath(prior.attempt_ref).replace(/\/attempt\.json$/, ""), { recursive: true });
    rmSync(task.recordPath(prior.report_ref));
    const runner = countedRunner();
    const result = await recordSimpleReviewRequest({ task, kernel, request: { ...input(), subject_kind: "phase", phase_id: "P2", review_scope: "phase" }, runRound: runner.runRound });
    expect(runner.calls).toBe(tamper ? 0 : 1);
    if (tamper) expect(result.error.code).toBe("REVIEW_RETRY_BUDGET_UNKNOWN");
    else expect(result.result_ref).toBeTruthy();
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
      expect(attempt.provider_attempts[1].identity).toBeNull();
      expect(attempt.provider_attempts[1].error.code).toBe("PROVIDER_HEALTH_FAILED");
      expect(refs.role_results[role].result_ref).toBeNull();
    }
  });
});
