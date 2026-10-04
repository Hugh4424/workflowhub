import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, realpathSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { runSimpleReview } from "../../skills/wh-review/scripts/simple-review-runner.mjs";
import { BROKER_HOST_PROVIDER, ReviewProviderClient } from "../../skills/wh-review/scripts/review-provider-client.mjs";
import { recordSimpleReviewRequest } from "../../runtime/review/review-record-route.mjs";

const sha = (value) => createHash("sha256").update(value).digest("hex");
const evidence = { ref: "quality/reviews/material.json", sha256: sha("evidence") };
const materials = { implementation: "managed review" };
// Controlled ordinary broker-wire identifier, not a packet/snapshot certificate.
const materialId = "owned-managed-material";
const roots = [];
afterEach(() => { vi.useRealTimers(); while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function reviewResult(request, overrides = {}) {
  return {
    status: "unavailable",
    stage: request.stage,
    provider_results: [],
    findings: [],
    dispatch_state: "blocked_before_dispatch",
    ...overrides,
  };
}

async function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "managed-review-"))); roots.push(root);
  const repo = join(root, "repo"); mkdirSync(repo);
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key];
  const git = (args) => execFileSync("git", args, { cwd: repo, env, encoding: "utf8" }).trim();
  git(["init", "-q", "-b", "main"]); git(["config", "user.name", "Managed review test"]); git(["config", "user.email", "managed-review@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "managed review fixture\n"); git(["add", "."]); git(["commit", "-qm", "fixture"]);
  const task = await createTask({ storageRoot: root, manifest: {
    schema_version: "1.0.0", project_name: "ManagedReview", task_id: randomUUID(),
    created_at: "2026-09-09T00:00:00Z", target_repo_root: repo, issue_ids: [], inputs: {},
    activation_cohort: "post", execution_mode: "per_invocation", record_model: "vnext-single-write",
  } });
  return { task, repo };
}

function request() {
  return { stage: "verify-code", host_provider: "codex", materials, authenticated_evidence: evidence };
}

const managedProvider = "review/provider";
const managedRuntime = "runtime-managed";
const managedRequestId = "request-managed-001";
const managedMaterials = {
  bundleRoot: "/tmp/managed-review-bundle",
  attachmentRoot: "/tmp/managed-review-attachments",
  sourcePrefix: "bundle",
  materialId,
  deliveryManifest: [{ path: "materials/implementation.md", bytes: 16, sha256: "a".repeat(64) }],
};

// card-03: host_provider is no longer a caller input. The client always sends
// BROKER_HOST_PROVIDER and validates the broker echo against it, so no test
// context carries a caller host any more.
function managedContext(overrides = {}) {
  return {
    providers: [managedProvider],
    materials: managedMaterials,
    prompt: "review the submitted material",
    reviewMode: "single_round",
    minimumHeterologous: 1,
    requestId: managedRequestId,
    ...overrides,
  };
}

function managedMember(overrides = {}) {
  return {
    adapter: "review",
    continuable: true,
    effort: "medium",
    error: null,
    material_id: materialId,
    model: "review-model",
    output: JSON.stringify({ findings: [] }),
    provider: managedProvider,
    raw_output_ref: null,
    result_protocol: "workflowhub-result.v2",
    retry: { count: 0, progress_events: 0 },
    runtime_id: managedRuntime,
    session_file_path: null,
    session_id: "session-managed",
    status: "completed",
    thinking: false,
    timing: { started_at_ms: 10, completed_at_ms: 20, duration_ms: 10 },
    unavailable_diagnostics: null,
    usage: null,
    ...overrides,
  };
}

function managedGroup(outcome = "completed", member = managedMember()) {
  return {
    host_provider: BROKER_HOST_PROVIDER,
    outcome,
    providers: [member],
    round: 1,
    runtime_id: managedRuntime,
    selected_tier: null,
    version: 4,
  };
}

function managedWire(state, { requestId = managedRequestId, runtimeId = managedRuntime, outcome = "completed", member = managedMember() } = {}) {
  const value = {
    version: "workflowhub-run.v1",
    request_id: requestId,
    runtime_id: runtimeId,
    state,
    material_id: materialId,
  };
  if (state === "terminal") value.group = managedGroup(outcome, member);
  return { exitCode: 0, stdout: `${JSON.stringify(value)}\n`, stderr: "" };
}

function managedHealthEnvelope({ requestId = managedRequestId, runtimeId = managedRuntime, envelopeMaterialId = materialId } = {}) {
  return {
    version: "workflowhub-run.v1",
    request_id: requestId,
    runtime_id: runtimeId,
    state: "running",
    material_id: envelopeMaterialId,
    providers: {
      [managedProvider]: {
        provider: managedProvider,
        tier: 0,
        status: "failed",
        started_at_ms: 10,
        completed_at_ms: 20,
        process_alive_at_ms: 20,
        last_progress_at_ms: 1_234,
        duration_ms: 10,
        retry_count: 0,
        progress_events: 1,
        error: { code: "PROVIDER_PRINT_TIMEOUT" },
      },
    },
    ignored_fact: "not part of the managed envelope contract",
  };
}

// workflowhub-result.v3 managed group/member shape, copied from the broker's
// authoritative projection (3rd-review lib/workflowhub-result-v3.mjs).
function managedV3Member(overrides = {}) {
  return {
    attempts: [{
      attempt_id: "managed-v3-attempt-1", completed_at_ms: 20, duration_ms: 10, error: null,
      kind: "initial", provider_retry_count: 0, session_id: null, started_at_ms: 10, status: "completed",
    }],
    continuable: false,
    deadline_ms: null,
    error: null,
    identity: { adapter: "review", config_id: "review-config", model: "review-model", provider: managedProvider, source_id: "review/source" },
    material: { contract_hash: "unavailable", contract_id: "unavailable", material_id: materialId, semantic_hash: "unavailable" },
    output: JSON.stringify({ findings: [] }),
    provenance: { raw_output_sha256: null, raw_stderr_sha256: null, runtime_id: managedRuntime },
    recovery: { fresh_execution_retry_count: 0, provider_internal_retry_count: 0, same_session_repair_count: 0 },
    result_protocol: "workflowhub-result.v3",
    session_id: "session-managed",
    status: "completed",
    timing: { completed_at_ms: 20, duration_ms: 10, started_at_ms: 10 },
    usage: null,
    ...overrides,
  };
}

function managedV3Group({ outcome = "completed", members = [managedV3Member()], overrides = {} } = {}) {
  return {
    host_provider: BROKER_HOST_PROVIDER,
    material_id: materialId,
    outcome,
    providers: members,
    round: 1,
    runtime_id: managedRuntime,
    selected_tier: null,
    version: "workflowhub-result.v3",
    ...overrides,
  };
}

function managedV3Wire(group) {
  return {
    exitCode: 0,
    stdout: `${JSON.stringify({
      version: "workflowhub-run.v1", request_id: managedRequestId, runtime_id: managedRuntime,
      state: "terminal", material_id: materialId, group,
    })}\n`,
    stderr: "",
  };
}

function completedProviderResult() {
  return {
    provider: managedProvider,
    status: "completed",
    identity: {
      provider: managedProvider,
      adapter: "review",
      source_id: "review/source",
      config_id: "review-config",
      model: "review-model",
    },
    session_id: "session-managed",
    runtime_id: managedRuntime,
    output: JSON.stringify({ findings: [] }),
    error: null,
    timing: { started_at_ms: 10, completed_at_ms: 20, duration_ms: 10 },
    usage: null,
    evidence_anchor_valid: [],
  };
}

describe("managed review lifecycle boundary", () => {
  it("rejects an invalid current phase subject before dispatch or result publication", async () => {
    const { task } = await fixture();
    const runRound = vi.fn(async (value) => reviewResult(value));
    await expect(recordSimpleReviewRequest({ taskDir: task.taskPath, request: { ...request(), stage: "build-code", phase_id: "invalid" }, runRound })).rejects.toMatchObject({ code: "REVIEW_SUBJECT_INVALID" });
    expect(runRound).not.toHaveBeenCalled();
    expect(existsSync(join(task.taskPath, "quality"))).toBe(false);
  });

  it("keeps submitted completed members and raw bytes when ordinary repository bytes change", async () => {
    const { task, repo } = await fixture();
    const refs = await recordSimpleReviewRequest({
      taskDir: task.taskPath, request: request(),
      runRound: async (value) => {
        writeFileSync(join(repo, "spec.md"), "changed ordinary specification\n");
        return reviewResult(value, { status: "available", outcome: "completed", dispatch_state: "dispatched", runtime_id: managedRuntime, provider_results: [completedProviderResult()] });
      },
    });
    expect(refs).toMatchObject({ status: "available", authoritative: false });
    const record = JSON.parse(task.readRecord(refs.result_ref));
    expect(record).toMatchObject({ status: "available", outcome: "completed", runtime_id: managedRuntime, dispatch_state: "dispatched", authoritative: false });
    expect(record.provider_results).toHaveLength(1);
    expect(record.provider_results[0]).toMatchObject({ provider: managedProvider, status: "completed", identity: { source_id: "review/source", config_id: "review-config" } });
    expect(readFileSync(record.provider_results[0].output_ref, "utf8")).toBe(JSON.stringify({ findings: [] }));
    expect(record.error).toBeUndefined();
    expect(record).not.toHaveProperty("snapshot_tree");
  });

  it("appends each interrupted attempt as an immutable unavailable ordinary result", async () => {
    const { task } = await fixture();
    const runRound = vi.fn(async (value) => reviewResult(value, { status: "unavailable", runtime_id: managedRuntime, outcome: "unavailable", dispatch_state: "dispatched", error: { code: "REVIEW_STATUS_UNAVAILABLE", message: "status unavailable" } }));
    const first = await recordSimpleReviewRequest({ taskDir: task.taskPath, request: request(), runRound });
    const firstBytes = task.readRecord(first.result_ref);
    const second = await recordSimpleReviewRequest({ taskDir: task.taskPath, request: request(), runRound });
    expect(runRound).toHaveBeenCalledTimes(2);
    expect(first).toMatchObject({ status: "unavailable", authoritative: false });
    expect(second).toMatchObject({ status: "unavailable", authoritative: false });
    expect(second.result_ref).not.toBe(first.result_ref);
    expect(task.readRecord(first.result_ref)).toBe(firstBytes);
    for (const result of [first, second]) expect(JSON.parse(task.readRecord(result.result_ref))).toMatchObject({ status: "unavailable", runtime_id: managedRuntime, dispatch_state: "dispatched", error: { code: "REVIEW_STATUS_UNAVAILABLE" } });
  });

  it.each([
    ["start failure", "REVIEW_BROKER_START_FAILED"],
    ["status unavailable", "REVIEW_STATUS_UNAVAILABLE"],
    ["expired runtime", "REVIEW_RUNTIME_EXPIRED"],
    ["missing runtime", "REVIEW_RUNTIME_MISSING"],
  ])("preserves typed managed lifecycle error: %s", async (_label, code) => {
    const { task } = await fixture();
    const dispatch = code === "REVIEW_BROKER_START_FAILED" ? "blocked_before_dispatch" : "dispatched";
    const runtime = code === "REVIEW_BROKER_START_FAILED" ? null : managedRuntime;
    const result = await recordSimpleReviewRequest({ taskDir: task.taskPath, request: request(), runRound: async (value) => reviewResult(value, { dispatch_state: dispatch, runtime_id: runtime, error: { code, message: code } }) });
    expect(result).toMatchObject({ status: "unavailable", authoritative: false });
    expect(JSON.parse(task.readRecord(result.result_ref))).toMatchObject({ status: "unavailable", dispatch_state: dispatch, runtime_id: runtime, error: { code, message: code }, provider_results: [], findings: [] });
  });

  it("does not turn a closure-external ordinary write into a review failure", async () => {
    const { task, repo } = await fixture();
    const result = await recordSimpleReviewRequest({ taskDir: task.taskPath, request: request(), runRound: async (value) => { writeFileSync(join(repo, "external-note.log"), "outside closure"); return reviewResult(value); } });
    expect(result).toMatchObject({ status: "unavailable", authoritative: false });
    const record = JSON.parse(task.readRecord(result.result_ref));
    expect(record.dispatch_state).toBe("blocked_before_dispatch");
    expect(record.error).toBeUndefined();
    expect(readFileSync(join(repo, "external-note.log"), "utf8")).toBe("outside closure");
  });

  it("RED: cancels the managed runtime on source drift and only on that fact", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "managed-review-source-drift-cancel-")));
    roots.push(attachmentRoot);
    const calls = [];
    const client = {
      async startManaged(value) {
        calls.push("start");
        return { version: "workflowhub-run.v1", request_id: value.requestId, runtime_id: managedRuntime,
          state: "running", material_id: value.materials.materialId };
      },
      async statusManaged() {
        calls.push("status");
        throw Object.assign(new Error("source/material revision drifted"), { code: "REVIEW_SOURCE_DRIFT" });
      },
      async cancelManaged(value) { calls.push({ command: "cancel", runtimeId: value.runtimeId }); return { cancelled: true }; },
    };
    const result = await runSimpleReview({
      stage: "verify-code", host_provider: "codex", materials: { implementation: "managed source drift bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: [managedProvider], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: [managedProvider], provider_identities: {
        [managedProvider]: { source_id: "review/source", config_id: "review-config" },
      }, provider_models: { [managedProvider]: "review-model" } }),
      client,
      managedStatusPollMs: 0,
    });
    expect(result).toMatchObject({ status: "unavailable", error: { code: "REVIEW_SOURCE_DRIFT" } });
    expect(calls).toEqual(["start", "status", { command: "cancel", runtimeId: managedRuntime }]);
  });

  it("retains a failed source-drift cancellation in the public error", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "managed-review-source-drift-cancel-failed-")));
    roots.push(attachmentRoot);
    const client = {
      async startManaged(value) {
        return { version: "workflowhub-run.v1", request_id: value.requestId, runtime_id: managedRuntime,
          state: "running", material_id: value.materials.materialId };
      },
      async statusManaged() {
        throw Object.assign(new Error("source/material revision drifted"), { code: "REVIEW_SOURCE_DRIFT" });
      },
      async cancelManaged() {
        throw Object.assign(new Error("broker still owns runtime"), { code: "CANCEL_FAILED" });
      },
    };
    const result = await runSimpleReview({
      stage: "verify-code", host_provider: "codex", materials: { implementation: "managed source drift bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: [managedProvider], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: [managedProvider], provider_identities: {
        [managedProvider]: { source_id: "review/source", config_id: "review-config" },
      }, provider_models: { [managedProvider]: "review-model" } }),
      client,
      managedStatusPollMs: 0,
    });
    expect(result).toMatchObject({
      status: "unavailable",
      error: {
        code: "REVIEW_SOURCE_DRIFT",
        cause_code: "CANCEL_FAILED",
        message: expect.stringContaining("CANCEL_FAILED"),
      },
    });
  });

  it("starts one managed runtime and consumes an explicit terminal event without polling", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "managed-review-runner-")));
    roots.push(attachmentRoot);
    const calls = [];
    const client = {
      async startManaged(value) {
        calls.push({ command: "start", ...value });
        return {
          version: "workflowhub-run.v1",
          request_id: value.requestId,
          runtime_id: managedRuntime,
          state: "running",
          material_id: value.materials.materialId,
        };
      },
      async statusManaged(value) {
        calls.push({ command: "status", ...value });
        return {
          version: "workflowhub-run.v1",
          request_id: value.requestId,
          runtime_id: managedRuntime,
          state: "terminal",
          material_id: value.materials.materialId,
          group: managedGroup("completed"),
        };
      },
    };
    const result = await runSimpleReview({
      stage: "verify-code",
      host_provider: "codex",
      materials: { implementation: "managed runner bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: [managedProvider], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({
        providers: [managedProvider],
        provider_identities: { [managedProvider]: { source_id: "review/source", config_id: "review-config" } },
        provider_models: { [managedProvider]: "review-model" },
      }),
      client,
      onManagedTerminal: ({ client: managedClient, lifecycle, ...value }) => managedClient.statusManaged({
        ...value,
        runtimeId: lifecycle.runtime_id,
      }),
    });

    expect(result).toMatchObject({
      status: "available",
      runtime_id: managedRuntime,
      outcome: "completed",
      provider_results: [expect.objectContaining({ provider: managedProvider, status: "completed" })],
    });
    expect(calls.map(({ command }) => command)).toEqual(["start", "status"]);
    expect(calls[0].requestId).toBe(calls[1].requestId);
    expect(calls[0].requestId).toMatch(/^wh-review-[A-Za-z0-9-]+$/);
    expect(calls[1].runtimeId).toBe(managedRuntime);
  });

  it("uses the production managed terminal consumer when no callback is injected", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "managed-review-production-consumer-")));
    roots.push(attachmentRoot);
    const calls = [];
    const client = {
      async startManaged(value) {
        calls.push({ command: "start", ...value });
        return { version: "workflowhub-run.v1", request_id: value.requestId, runtime_id: managedRuntime,
          state: "running", material_id: value.materials.materialId };
      },
      async statusManaged(value) {
        calls.push({ command: "status", ...value });
        return { version: "workflowhub-run.v1", request_id: value.requestId, runtime_id: managedRuntime,
          state: "terminal", material_id: value.materials.materialId, group: managedGroup("completed") };
      },
      async cancelManaged(value) { calls.push({ command: "cancel", ...value }); throw new Error("must not cancel a completed review"); },
    };
    const result = await runSimpleReview({
      stage: "verify-code", host_provider: "codex", materials: { implementation: "managed runner bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: [managedProvider], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: [managedProvider], provider_identities: {
        [managedProvider]: { source_id: "review/source", config_id: "review-config" },
      }, provider_models: { [managedProvider]: "review-model" } }),
      client,
      managedStatusPollMs: 0,
    });

    expect(result).toMatchObject({ status: "available", runtime_id: managedRuntime, outcome: "completed" });
    expect(calls.map(({ command }) => command)).toEqual(["start", "status"]);
  });

  it("exposes non-terminal member health facts while ignoring unrelated envelope keys", async () => {
    const client = new ReviewProviderClient({
      invoke: async () => ({ exitCode: 0, stdout: `${JSON.stringify(managedHealthEnvelope())}\n`, stderr: "" }),
    });

    const status = await client.statusManaged(managedContext());
    expect(status).toMatchObject({
      version: "workflowhub-run.v1",
      request_id: managedRequestId,
      runtime_id: managedRuntime,
      state: "running",
      material_id: materialId,
      providers: {
        [managedProvider]: {
          status: "failed",
          error: { code: "PROVIDER_PRINT_TIMEOUT" },
          last_progress_at_ms: 1_234,
        },
      },
    });
    expect(status.ignored_fact).toBeUndefined();
  });

  it("tolerates pending, additive, or missing managed health providers while validating present members", async () => {
    const extra = managedHealthEnvelope();
    extra.providers["review/unknown"] = {
      status: "running", error: null, last_progress_at_ms: 2_000,
    };
    const extraClient = new ReviewProviderClient({
      invoke: async () => ({ exitCode: 0, stdout: `${JSON.stringify(extra)}\n`, stderr: "" }),
    });
    const withExtra = await extraClient.statusManaged(managedContext());
    expect(withExtra.providers).toEqual({
      [managedProvider]: expect.objectContaining({ status: "failed" }),
    });

    const missing = managedHealthEnvelope();
    delete missing.providers[managedProvider];
    const missingClient = new ReviewProviderClient({
      invoke: async () => ({ exitCode: 0, stdout: `${JSON.stringify(missing)}\n`, stderr: "" }),
    });
    await expect(missingClient.statusManaged(managedContext())).resolves.toMatchObject({ providers: {} });

    const pending = managedHealthEnvelope();
    pending.providers[managedProvider] = { status: "pending", last_progress_at_ms: null };
    const pendingClient = new ReviewProviderClient({
      invoke: async () => ({ exitCode: 0, stdout: `${JSON.stringify(pending)}\n`, stderr: "" }),
    });
    await expect(pendingClient.statusManaged(managedContext())).resolves.toMatchObject({
      providers: { [managedProvider]: { status: "pending", error: null, last_progress_at_ms: null } },
    });
  });

  it("keeps polling after failed non-terminal health until the broker reports terminal", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "managed-review-production-member-health-")));
    roots.push(attachmentRoot);
    const calls = [];
    const requestIds = [];
    let polls = 0;
    const client = {
      async startManaged(value) {
        calls.push("start");
        requestIds.push(value.requestId);
        return { version: "workflowhub-run.v1", request_id: value.requestId, runtime_id: managedRuntime,
          state: "running", material_id: value.materials.materialId };
      },
      async statusManaged(value) {
        calls.push("status");
        requestIds.push(value.requestId);
        polls += 1;
        if (polls === 1) {
          return managedHealthEnvelope({ requestId: value.requestId, runtimeId: managedRuntime, envelopeMaterialId: value.materials.materialId });
        }
        return {
          ...JSON.parse(managedWire("terminal", { requestId: value.requestId, outcome: "completed" }).stdout),
          material_id: value.materials.materialId,
        };
      },
      async cancelManaged() { calls.push("cancel"); throw new Error("member health facts must not cancel the managed runtime"); },
    };
    const result = await runSimpleReview({
      stage: "verify-code", host_provider: "codex", materials: { implementation: "managed member health bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: [managedProvider], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: [managedProvider], provider_identities: {
        [managedProvider]: { source_id: "review/source", config_id: "review-config" },
      }, provider_models: { [managedProvider]: "review-model" } }),
      client,
      managedStatusPollMs: 0,
    });

    expect(result).toMatchObject({ status: "available", outcome: "completed" });
    expect(calls).toEqual(["start", "status", "status"]);
    expect(new Set(requestIds).size).toBe(1);
  });

  it("keeps polling a live managed session by default without cancelling it", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "managed-review-production-live-session-")));
    roots.push(attachmentRoot);
    const calls = [];
    let polls = 0;
    const client = {
      async startManaged(value) {
        calls.push("start");
        return { version: "workflowhub-run.v1", request_id: value.requestId, runtime_id: managedRuntime,
          state: "running", material_id: value.materials.materialId };
      },
      async statusManaged(value) {
        calls.push("status");
        polls += 1;
        if (polls === 1) return { version: "workflowhub-run.v1", request_id: value.requestId,
          runtime_id: managedRuntime, state: "running", material_id: value.materials.materialId };
        return { version: "workflowhub-run.v1", request_id: value.requestId, runtime_id: managedRuntime,
          state: "terminal", material_id: value.materials.materialId, group: managedGroup("completed") };
      },
      async cancelManaged(value) { calls.push({ command: "cancel", ...value }); throw new Error("live sessions must not be cancelled by the default poller"); },
    };
    const result = await runSimpleReview({
      stage: "verify-code", host_provider: "codex", materials: { implementation: "managed runner bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: [managedProvider], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: [managedProvider], provider_identities: {
        [managedProvider]: { source_id: "review/source", config_id: "review-config" },
      }, provider_models: { [managedProvider]: "review-model" } }),
      client,
      managedStatusPollMs: 0,
    });

    expect(result).toMatchObject({ status: "available", runtime_id: managedRuntime, outcome: "completed" });
    expect(calls).toEqual(["start", "status", "status"]);
  });

  it("does not cancel a managed runtime when a status poll is temporarily unavailable", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "managed-review-production-status-error-")));
    roots.push(attachmentRoot);
    const calls = [];
    const client = {
      async startManaged(value) {
        calls.push("start");
        return { version: "workflowhub-run.v1", request_id: value.requestId, runtime_id: managedRuntime,
          state: "running", material_id: value.materials.materialId };
      },
      async statusManaged() { calls.push("status"); throw Object.assign(new Error("status unavailable"), { code: "REVIEW_STATUS_UNAVAILABLE" }); },
      async cancelManaged() { calls.push("cancel"); throw new Error("status errors must not cancel live sessions"); },
    };
    const result = await runSimpleReview({
      stage: "verify-code", host_provider: "codex", materials: { implementation: "managed runner bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: [managedProvider], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: [managedProvider], provider_identities: {
        [managedProvider]: { source_id: "review/source", config_id: "review-config" },
      }, provider_models: { [managedProvider]: "review-model" } }),
      client,
      managedStatusPollMs: 0,
    });

    expect(result).toMatchObject({ status: "unavailable", runtime_id: managedRuntime,
      error: { code: "REVIEW_STATUS_UNAVAILABLE" } });
    expect(calls).toEqual(["start", "status"]);
  });

  it("cancels the managed broker and reads back its terminal state after AbortSignal", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "managed-review-production-abort-")));
    roots.push(attachmentRoot);
    const controller = new AbortController();
    const calls = [];
    let statusCalls = 0;
    let cancellationRequested = false;
    const running = (value) => ({ version: "workflowhub-run.v1", request_id: value.requestId,
      runtime_id: managedRuntime, state: "running", material_id: value.materials.materialId });
    const client = {
      async startManaged(value) { calls.push("start"); return running(value); },
      async statusManaged(value) {
        calls.push("status");
        statusCalls += 1;
        if (statusCalls === 2) controller.abort(new Error("operator cancelled"));
        if (cancellationRequested) return {
          version: "workflowhub-run.v1",
          request_id: value.requestId,
          runtime_id: managedRuntime,
          state: "terminal",
          material_id: value.materials.materialId,
          group: {
            runtime_id: managedRuntime,
            material_id: value.materials.materialId,
            outcome: "cancelled",
            providers: [{
              provider: managedProvider,
              status: "cancelled",
              error: { code: "CANCELLED", message: "operator cancelled" },
              output: null,
              timing: null,
              usage: null,
            }],
          },
        };
        return running(value);
      },
      async cancelManaged(value) {
        calls.push("cancel");
        expect(value).toMatchObject({ runtimeId: managedRuntime });
        cancellationRequested = true;
        return { cancelled: true };
      },
    };
    const result = await runSimpleReview({
      stage: "verify-code", host_provider: "codex", materials: { implementation: "managed explicit cancellation bytes" },
    }, {
      signal: controller.signal,
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: [managedProvider], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: [managedProvider], provider_identities: {
        [managedProvider]: { source_id: "review/source", config_id: "review-config" },
      }, provider_models: { [managedProvider]: "review-model" } }),
      client,
      managedStatusPollMs: 0,
    });

    expect(result).toMatchObject({ status: "unavailable", runtime_id: managedRuntime,
      error: { code: "REVIEW_CANCELLED", message: "operator cancelled" } });
    expect(result).toMatchObject({ outcome: "cancelled",
      provider_results: [{ provider: managedProvider, status: "cancelled", error: { code: "CANCELLED" } }] });
    expect(calls).toEqual(["start", "status", "status", "cancel", "status"]);
  });

  it("keeps polling after a 10-minute fake-time jump until the broker reports terminal", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "managed-review-production-final-recheck-")));
    roots.push(attachmentRoot);
    const calls = [];
    let polls = 0;
    const client = {
      async startManaged(value) {
        calls.push("start");
        return { version: "workflowhub-run.v1", request_id: value.requestId, runtime_id: managedRuntime,
          state: "running", material_id: value.materials.materialId };
      },
      async statusManaged(value) {
        calls.push("status");
        polls += 1;
        if (polls === 1) {
          vi.setSystemTime(600_001);
          return { version: "workflowhub-run.v1", request_id: value.requestId, runtime_id: managedRuntime,
            state: "running", material_id: value.materials.materialId };
        }
        return { version: "workflowhub-run.v1", request_id: value.requestId, runtime_id: managedRuntime,
          state: "terminal", material_id: value.materials.materialId, group: managedGroup("completed") };
      },
      async cancelManaged() { calls.push("cancel"); throw new Error("the final wait recheck must not cancel the broker"); },
    };
    const result = await runSimpleReview({
      stage: "verify-code", host_provider: "codex", materials: { implementation: "managed final recheck bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: [managedProvider], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: [managedProvider], provider_identities: {
        [managedProvider]: { source_id: "review/source", config_id: "review-config" },
      }, provider_models: { [managedProvider]: "review-model" } }),
      client,
      managedStatusPollMs: 0,
    });

    expect(result).toMatchObject({ status: "available", outcome: "completed" });
    expect(calls).toEqual(["start", "status", "status"]);
    expect(calls).not.toContain("cancel");
  });

  it("uses the managed V2 start/status/cancel public seam with exact envelopes", async () => {
    const calls = [];
    const wires = [
      managedWire("starting"),
      managedWire("running"),
      managedWire("terminal"),
    ];
    const client = new ReviewProviderClient({
      invoke: async (value) => { calls.push(value); return wires.shift(); },
    });
    const context = managedContext();
    const started = await client.startManaged(context);
    const running = await client.statusManaged({ ...context, runtimeId: started.runtime_id });
    const terminal = await client.statusManaged({ ...context, runtimeId: running.runtime_id });

    expect(started).toEqual({
      version: "workflowhub-run.v1",
      request_id: managedRequestId,
      runtime_id: managedRuntime,
      state: "starting",
      material_id: materialId,
    });
    expect(running).toEqual({
      version: "workflowhub-run.v1",
      request_id: managedRequestId,
      runtime_id: managedRuntime,
      state: "running",
      material_id: materialId,
    });
    expect(terminal).toMatchObject({
      version: "workflowhub-run.v1",
      request_id: managedRequestId,
      runtime_id: managedRuntime,
      state: "terminal",
      material_id: materialId,
      group: { outcome: "completed", providers: [{ status: "completed", output: expect.any(String) }] },
    });
    expect(calls.map((value) => value.command)).toEqual(["start", "status", "status"]);
    expect(calls[0]).toMatchObject({
      requestId: managedRequestId,
      request: {
        version: 4,
        // Option 1 (2026-09-11), both halves: 3rd-review accepts v3 for managed
        // sessions and this caller moved to v3 + negotiated delivery so an
        // embedded-only provider (codex) is no longer excluded before dispatch.
        required_result_protocol: "workflowhub-result.v3",
        // card-03: the caller no longer chooses the host; the client pins the
        // broker host constant and this is the only accepted echo.
        host_provider: BROKER_HOST_PROVIDER,
        provider_allowlist: [managedProvider],
        deadline_ms: null,
      },
      attachments: { version: 1, bundle_id: materialId },
    });
    expect(calls[1]).toMatchObject({ command: "status", runtimeId: managedRuntime });
  });

  it("observes pending health and terminal identity through owned child broker wire transport", async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-owned-managed-health-"))); roots.push(root);
    const attachmentRoot = join(root, "packets"); mkdirSync(attachmentRoot);
    const configPath = join(root, "owned-config.json"), cli = join(root, "owned-broker.mjs"), statePath = join(root, "state.json"), releasePath = join(root, "release"), tracePath = join(root, "trace.jsonl");
    writeFileSync(configPath, JSON.stringify({ statePath, releasePath, tracePath }));
    writeFileSync(cli, String.raw`import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
const command=process.argv[2];const args=Object.fromEntries(process.argv.slice(3).map(x=>{const i=x.indexOf("=");return [x.slice(2,i),x.slice(i+1)];}));
const config=JSON.parse(readFileSync(args.config,"utf8"));
let state;
if(command==="start") {
 const request=JSON.parse(readFileSync(args.request,"utf8"));const attachments=JSON.parse(readFileSync(args.attachments,"utf8"));
 if(request.required_result_protocol!=="workflowhub-result.v3"||request.provider_allowlist[0]!==${JSON.stringify(managedProvider)}||!attachments.entries.length) throw new Error("owned submitted request/attachment protocol invalid");
 state={request_id:args["request-id"],runtime_id:${JSON.stringify(managedRuntime)},material_id:attachments.bundle_id};writeFileSync(config.statePath,JSON.stringify(state));
} else {state=JSON.parse(readFileSync(config.statePath,"utf8"));if(args["runtime-id"]!==state.runtime_id) throw new Error("owned runtime identity mismatch");}
appendFileSync(config.tracePath,JSON.stringify({command,...state})+"\n");
const terminal=command==="cancel"||command==="status"&&existsSync(config.releasePath);
const envelope={version:"workflowhub-run.v1",...state,state:terminal?"terminal":"running"};
if(terminal) {const member={"attempts":[{"attempt_id":"owned-attempt","completed_at_ms":20,"duration_ms":10,"error":null,"kind":"initial","provider_retry_count":0,"session_id":null,"started_at_ms":10,"status":"completed"}],"continuable":false,"deadline_ms":null,"error":null,"identity":{"adapter":"review","config_id":"review-config","model":"review-model","provider":"review/provider","source_id":"review/source"},"material":{"contract_hash":"unavailable","contract_id":"unavailable","material_id":"replaced","semantic_hash":"unavailable"},"output":"{\"findings\":[]}","provenance":{"raw_output_sha256":null,"raw_stderr_sha256":null,"runtime_id":"runtime-managed"},"recovery":{"fresh_execution_retry_count":0,"provider_internal_retry_count":0,"same_session_repair_count":0},"result_protocol":"workflowhub-result.v3","session_id":"session-managed","status":"completed","timing":{"completed_at_ms":20,"duration_ms":10,"started_at_ms":10},"usage":null};member.material.material_id=state.material_id;envelope.group={host_provider:${JSON.stringify('dsh')},material_id:state.material_id,outcome:"completed",providers:[member],round:1,runtime_id:state.runtime_id,selected_tier:null,version:"workflowhub-result.v3"};}
else envelope.providers={${JSON.stringify(managedProvider)}:{provider:${JSON.stringify(managedProvider)},tier:0,status:"running",started_at_ms:10,completed_at_ms:null,process_alive_at_ms:20,last_progress_at_ms:20,duration_ms:10,retry_count:0,progress_events:1,error:null}};
console.log(JSON.stringify(envelope));
`);
    const transport = new ReviewProviderClient({ command: [process.execPath, cli], config: configPath, timeoutMs: 2_000 });
    // Use the existing private injected transport seam to exercise the broker
    // wire consumer with a bounded owned process, never the native model route.
    const client = new ReviewProviderClient({ invoke: transport.invoke });
    const statusObservations = [];
    const actualStatus = client.statusManaged.bind(client);
    client.statusManaged = async (value) => { const wire = await actualStatus(value); statusObservations.push({ input: value, wire }); return wire; };
    const controller = new AbortController();
    let settled = false;
    const promise = runSimpleReview({ stage: "verify-code", materials: { implementation: "owned managed lifecycle bytes" } }, {
      loadConfig: () => ({ whReview: {}, config: configPath, attachmentRoot, command: [process.execPath, cli] }),
      resolveRoute: () => ({ initial: [managedProvider], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: [managedProvider], provider_identities: { [managedProvider]: { source_id: "review/source", config_id: "review-config" } }, provider_models: { [managedProvider]: "review-model" } }),
      client, signal: controller.signal, managedStatusPollMs: 10,
    }).finally(() => { settled = true; });
    try {
      await vi.waitFor(() => { expect(settled).toBe(false); expect(statusObservations.some(({ wire }) => wire.state === "running" && wire.providers?.[managedProvider]?.last_progress_at_ms > 0)).toBe(true); }, { timeout: 3_000, interval: 20 });
      writeFileSync(releasePath, "owned release\n");
      const result = await promise;
      expect(result).toMatchObject({ status: "available", outcome: "completed", runtime_id: managedRuntime, provider_results: [{ provider: managedProvider, status: "completed", identity: { source_id: "review/source", config_id: "review-config" } }] });
      const trace = readFileSync(tracePath, "utf8").trim().split("\n").map(line => JSON.parse(line));
      expect(trace.filter(({command}) => command === "start")).toHaveLength(1);
      expect(trace.filter(({command}) => command === "status").length).toBeGreaterThanOrEqual(2);
      expect(trace.some(({command}) => command === "cancel")).toBe(false);
      const start = trace[0]; expect(start.request_id).toMatch(/^wh-review-[A-Za-z0-9-]+$/);
      for (const entry of trace) expect(entry).toMatchObject({ request_id: start.request_id, runtime_id: start.runtime_id, material_id: start.material_id });
      expect(statusObservations.at(-1).wire).toMatchObject({ state: "terminal", runtime_id: start.runtime_id, material_id: start.material_id });
      expect(result.material_id).toBe(start.material_id);
      expect(result.provider_results[0].error).toBeNull();
    } finally { controller.abort(new Error("owned lifecycle cleanup")); await promise; }
  });

  it("classifies plain-text managed stderr instead of leaking SyntaxError", async () => {
    const client = new ReviewProviderClient({
      invoke: async () => ({ stdout: "not-json", stderr: "broker crashed", exitCode: 1, timedOut: false }),
    });

    await expect(client.startManaged(managedContext())).rejects.toMatchObject({
      code: "PROTOCOL_INCOMPATIBLE",
    });
  });

  // The rejected envelope must not erase the evidence that the start request was
  // transmitted. Before this, the caller recorded `blocked_before_dispatch` with an
  // empty provider inventory even though the broker had created a runtime and
  // started providers, which is exactly the false fact that made a safe re-dispatch
  // impossible to judge.
  it("keeps the dispatched runtime and provider facts when the managed envelope is rejected", async () => {
    const client = new ReviewProviderClient({
      invoke: async () => ({ exitCode: 0, stdout: `${JSON.stringify(managedHealthEnvelope({ envelopeMaterialId: "f".repeat(64) }))}\n`, stderr: "" }),
    });

    const error = await client.startManaged(managedContext()).catch((value) => value);
    expect(error).toMatchObject({ code: "PROTOCOL_INCOMPATIBLE" });
    expect(error.managed_observation).toMatchObject({
      dispatch_state: "sent_unparsed",
      request_id: managedRequestId,
      runtime_id: managedRuntime,
      state: "running",
      version: "workflowhub-run.v1",
      providers: [{ provider: managedProvider, status: "failed", error: { code: "PROVIDER_PRINT_TIMEOUT" } }],
    });
    expect(error.managed_observation.wire).toMatchObject({ exit_code: 0, timed_out: false });
  });

  it("does not claim a dispatch when the broker process never started", async () => {
    const client = new ReviewProviderClient({
      invoke: async () => ({ spawnError: new Error("spawn ENOENT"), stdout: "", stderr: "", exitCode: null }),
    });

    const error = await client.startManaged(managedContext()).catch((value) => value);
    expect(error).toMatchObject({ code: "BROKER_SPAWN_FAILED" });
    expect(error.managed_observation).toBeUndefined();
  });

  it("records a submitted sent_unparsed observation with its selected provider inventory", async () => {
    const { task } = await fixture();
    const result = await recordSimpleReviewRequest({ taskDir: task.taskPath, request: request(), runRound: async (value) => reviewResult(value, {
      dispatch_state: "sent_unparsed", runtime_id: managedRuntime,
      provider_results: [{ provider: managedProvider, runtime_id: managedRuntime, status: "running", error: null }],
      error: { code: "PROTOCOL_INCOMPATIBLE", message: "3rd-review managed lifecycle envelope is invalid" },
    }) });
    expect(result).toMatchObject({ status: "unavailable", authoritative: false });
    const record = JSON.parse(task.readRecord(result.result_ref));
    expect(record).toMatchObject({ dispatch_state: "sent_unparsed", runtime_id: managedRuntime, error: { code: "PROTOCOL_INCOMPATIBLE" } });
    expect(record.provider_results).toHaveLength(1);
    expect(record.provider_results[0]).toMatchObject({ provider: managedProvider, runtime_id: managedRuntime, status: "running" });
  });

  it("reuses the same deterministic request and runtime identity after an interrupted start", async () => {
    const calls = [];
    const client = new ReviewProviderClient({
      invoke: async (value) => {
        calls.push(value);
        return calls.length === 1 ? managedWire("starting") : managedWire("running");
      },
    });
    const first = await client.startManaged(managedContext());
    const recovered = await client.startManaged(managedContext());

    expect(recovered).toMatchObject({
      request_id: first.request_id,
      runtime_id: first.runtime_id,
      state: "running",
      material_id: materialId,
    });
    expect(calls).toHaveLength(2);
    expect(calls[0].command).toBe("start");
    expect(calls[1]).toMatchObject({ command: "start", requestId: managedRequestId });
    expect(calls[1].request).toEqual(calls[0].request);
  });

  it.each([
    ["clean", "completed", managedMember()],
    ["cancelled", "cancelled", managedMember({ status: "cancelled", continuable: false, error: { code: "CANCELLED", message: "managed review was cancelled" }, unavailable_diagnostics: { code: "CANCELLED", message: "managed review was cancelled" }, output: null })],
    ["error", "unavailable", managedMember({ status: "failed", continuable: false, error: { code: "SESSION_MANAGER_LOST", message: "managed session manager is unavailable" }, unavailable_diagnostics: { code: "SESSION_MANAGER_LOST", message: "managed session manager is unavailable" }, output: null })],
  ])("preserves managed terminal %s facts", async (_label, outcome, member) => {
    const client = new ReviewProviderClient({ invoke: async () => managedWire("terminal", { outcome, member }) });
    const result = await client.startManaged(managedContext());
    expect(result).toMatchObject({ state: "terminal", group: { outcome, providers: [member] } });
  });

  it("validates every managed member public field before returning it", async () => {
    const valid = managedMember({ usage: { input: 10, output: 4, cost: 0.125 } });
    const accepted = new ReviewProviderClient({ invoke: async () => managedWire("terminal", { member: valid }) });
    await expect(accepted.startManaged(managedContext())).resolves.toMatchObject({
      group: { providers: [{ usage: valid.usage }] },
    });

    const invalidMembers = [
      managedMember({ private_path: "/private/member.json" }),
      managedMember({ session_id: "/private/session" }),
      managedMember({ adapter: "file:///private/adapter" }),
      managedMember({ model: "C:\\private\\model" }),
      managedMember({ effort: "../private-effort" }),
      managedMember({ usage: { "file:///private/usage.json": 1 } }),
      managedMember({ usage: { input: "10" } }),
      managedMember({ timing: { started_at_ms: 10, completed_at_ms: 20, duration_ms: 10, debug: 1 } }),
      managedMember({ timing: { started_at_ms: 10, completed_at_ms: 20, duration_ms: 9 } }),
      managedMember({ retry: { count: 0, progress_events: 0, internal: 1 } }),
    ];
    for (const member of invalidMembers) {
      const client = new ReviewProviderClient({ invoke: async () => managedWire("terminal", { member }) });
      await expect(client.startManaged(managedContext())).rejects.toMatchObject({
        code: expect.stringMatching(/PROTOCOL_INCOMPATIBLE|PUBLIC_RESULT_INVALID/),
      });
    }
  });

  it("rejects a non-broker partial managed group instead of widening workflowhub-result.v2", async () => {
    const client = new ReviewProviderClient({ invoke: async () => managedWire("terminal", { outcome: "partial" }) });
    await expect(client.startManaged(managedContext())).rejects.toMatchObject({ code: "PROTOCOL_INCOMPATIBLE" });
  });

  it("accepts a managed workflowhub-result.v3 terminal group and preserves its binding", async () => {
    const client = new ReviewProviderClient({ invoke: async () => managedV3Wire(managedV3Group()) });
    const result = await client.startManaged(managedContext());
    expect(result).toMatchObject({
      state: "terminal",
      material_id: materialId,
      group: {
        version: "workflowhub-result.v3",
        outcome: "completed",
        material_id: materialId,
        runtime_id: managedRuntime,
        round: 1,
        providers: [{
          provider: managedProvider,
          status: "completed",
          result_protocol: "workflowhub-result.v3",
          identity: { provider: managedProvider, adapter: "review", source_id: "review/source", config_id: "review-config" },
          material: { material_id: materialId },
          provenance: { runtime_id: managedRuntime },
          output: JSON.stringify({ findings: [] }),
        }],
      },
    });
  });

  it("accepts the v3 partial outcome that the v2 managed outcome set does not have", async () => {
    const failed = managedV3Member({
      attempts: [{ attempt_id: "managed-v3-attempt-1", completed_at_ms: 20, duration_ms: 10, error: { code: "PROCESS_DEAD", message: "provider died" }, kind: "initial", provider_retry_count: 0, session_id: null, started_at_ms: 10, status: "failed" }],
      error: { code: "PROCESS_DEAD", message: "provider died" },
      output: null,
      status: "failed",
    });
    const second = "review/second";
    const client = new ReviewProviderClient({ invoke: async () => managedV3Wire(managedV3Group({
      outcome: "partial",
      members: [managedV3Member(), { ...failed, identity: { ...failed.identity, provider: second, config_id: "second-config", source_id: "review/second-source" } }],
    })) });
    const result = await client.startManaged(managedContext({ providers: [managedProvider, second] }));
    expect(result).toMatchObject({ state: "terminal", group: { outcome: "partial", providers: [{ status: "completed" }, { provider: second, status: "failed" }] } });
    // The v2-only outcomes remain invalid for a v3 group.
    for (const outcome of ["stalled", "unverifiable", "invalid_output"]) {
      const invalid = new ReviewProviderClient({ invoke: async () => managedV3Wire(managedV3Group({ outcome })) });
      await expect(invalid.startManaged(managedContext())).rejects.toMatchObject({ code: "PROTOCOL_INCOMPATIBLE" });
    }
  });

  it("rejects malformed managed workflowhub-result.v3 groups", async () => {
    const cases = [
      ["extra group field", managedV3Group({ overrides: { extra_fact: 1 } })],
      ["unsupported group version", { ...managedV3Group(), version: 3 }],
      ["host provider mismatch", managedV3Group({ overrides: { host_provider: "claude/other" } })],
      ["material binding mismatch", managedV3Group({ overrides: { material_id: "other-material" } })],
      ["runtime binding mismatch", managedV3Group({ overrides: { runtime_id: "other-runtime" } })],
      ["v2-only outcome", managedV3Group({ outcome: "stalled" })],
      ["round below one", managedV3Group({ overrides: { round: 0 } })],
      ["invalid selected tier", managedV3Group({ overrides: { selected_tier: -1 } })],
      ["member extra field", managedV3Group({ members: [managedV3Member({ private_path: "/private/member.json" })] })],
      ["member missing field", managedV3Group({ members: [Object.fromEntries(Object.entries(managedV3Member()).filter(([key]) => key !== "recovery"))] })],
      ["member provider outside the selection", managedV3Group({ members: [managedV3Member({ identity: { ...managedV3Member().identity, provider: "review/unselected" } })] })],
      ["member material binding mismatch", managedV3Group({ members: [managedV3Member({ material: { ...managedV3Member().material, material_id: "other-material" } })] })],
      ["member runtime binding mismatch", managedV3Group({ members: [managedV3Member({ provenance: { ...managedV3Member().provenance, runtime_id: "other-runtime" } })] })],
      ["completed member carrying an error", managedV3Group({ members: [managedV3Member({ error: { code: "PROCESS_DEAD", message: "dead" } })] })],
      ["mixed-version member", managedV3Group({ members: [{ ...managedV3Member(), result_protocol: "workflowhub-result.v2" }] })],
      ["member identity carrying a private path", managedV3Group({ members: [managedV3Member({ identity: { ...managedV3Member().identity, source_id: "/private/source" } })] })],
      ["omitted configured provider", managedV3Group()],
    ];
    for (const [label, group] of cases) {
      const providers = label === "omitted configured provider" ? [managedProvider, "review/second"] : [managedProvider];
      const client = new ReviewProviderClient({ invoke: async () => managedV3Wire(group) });
      await expect(client.startManaged(managedContext({ providers })), label).rejects.toMatchObject({
        code: expect.stringMatching(/PROTOCOL_INCOMPATIBLE|PUBLIC_RESULT_INVALID/),
      });
    }
  });

  it("consumes a managed workflowhub-result.v3 group through the runner without degrading provider identity", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "managed-review-v3-runner-")));
    roots.push(attachmentRoot);
    const runtimeV3 = "runtime-managed-v3";
    const calls = [];
    let requestId = null;
    let bundleId = null;
    const wireFor = (state) => ({
      exitCode: 0,
      stdout: `${JSON.stringify({
        version: "workflowhub-run.v1", request_id: requestId, runtime_id: runtimeV3, state, material_id: bundleId,
        ...(state === "terminal" ? {
          group: {
            host_provider: BROKER_HOST_PROVIDER,
            material_id: bundleId,
            outcome: "completed",
            providers: [managedV3Member({
              material: { contract_hash: "unavailable", contract_id: "unavailable", material_id: bundleId, semantic_hash: "unavailable" },
              provenance: { raw_output_sha256: null, raw_stderr_sha256: null, runtime_id: runtimeV3 },
            })],
            round: 1,
            runtime_id: runtimeV3,
            selected_tier: null,
            version: "workflowhub-result.v3",
          },
        } : {}),
      })}\n`,
      stderr: "",
    });
    const client = new ReviewProviderClient({
      invoke: async (value) => {
        calls.push(value.command);
        if (value.command === "start") { requestId = value.requestId; bundleId = value.attachments.bundle_id; return wireFor("running"); }
        return wireFor("terminal");
      },
    });
    const result = await runSimpleReview({
      stage: "verify-code", host_provider: "codex", materials: { implementation: "managed v3 runner bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: [managedProvider], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: [managedProvider], provider_identities: {
        [managedProvider]: { source_id: "review/source", config_id: "review-config" },
      }, provider_models: { [managedProvider]: "review-model" } }),
      client,
      managedStatusPollMs: 0,
    });

    expect(calls).toEqual(["start", "status"]);
    expect(result.status).toBe("available");
    expect(result).toMatchObject({ outcome: "completed", runtime_id: runtimeV3 });
    expect(result.provider_results).toHaveLength(1);
    expect(result.provider_results[0]).toMatchObject({ provider: managedProvider, status: "completed" });
    // The broker's v3 identity (including source_id/config_id) must reach the
    // runner so its trusted-selection binding can verify it; a v2-style
    // selection lookup would have degraded this member instead.
    expect(result.provider_results[0].identity).toMatchObject({
      provider: managedProvider, adapter: "review", source_id: "review/source", config_id: "review-config",
    });
    expect(result.provider_results[0].identity_degraded).toBeUndefined();
    expect(result.provider_results[0].error).toBeNull();
  });

  it("sends oversized verify-code input to the managed provider without a local size block", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "managed-review-oversized-input-")));
    roots.push(attachmentRoot);
    const calls = [];
    let providerInput = null;
    const result = await runSimpleReview({
      stage: "verify-code",
      host_provider: "codex",
      materials: {
        changed_files: ["tests/review/review-managed-lifecycle.test.mjs"],
        implementation_assessment: "x".repeat(200 * 1024),
        test_context: "Owned transport fixture: a Node child reads the complete delivered assessment; the injected client then reports its token limit. No external model or product quality result is claimed.",
        open_risks: "The controlled provider may reject the submitted input with INPUT_TOKEN_LIMIT; preserve that unavailable failure without a local size block.",
      },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: [managedProvider], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: [managedProvider], provider_identities: {
        [managedProvider]: { source_id: "review/source", config_id: "review-config" },
      }, provider_models: { [managedProvider]: "review-model" } }),
      client: {
        async runGroup(value) {
          calls.push("runGroup");
          providerInput = value;
          const submitted = value.materials.deliveryManifest.find(entry => entry.path.includes("implementation_assessment"));
          expect(submitted?.bytes).toBe(200 * 1024);
          const receivedBytes = execFileSync(process.execPath, ["--input-type=module", "-e",
            "import{readFileSync}from'node:fs';process.stdout.write(readFileSync(process.argv[1]));",
            join(value.materials.bundleRoot, submitted.path)], { maxBuffer: 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
          expect(receivedBytes).toEqual(Buffer.from("x".repeat(200 * 1024)));
          throw Object.assign(new Error("input token limit exceeded"), { code: "INPUT_TOKEN_LIMIT" });
        },
      },
    });

    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "unknown",
      provider_results: [],
      findings: [],
      error: { code: "REVIEW_INPUT_TOO_LARGE", cause_code: "INPUT_TOKEN_LIMIT" },
    });
    expect(calls).toEqual(["runGroup"]);
    expect(providerInput.materials.deliveryManifest).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: expect.stringContaining("implementation_assessment"), bytes: 200 * 1024 }),
    ]));
  });
});
