import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createSimpleReviewPacket, runSimpleReview } from "../../skills/wh-review/scripts/simple-review-runner.mjs";
import { ReviewProviderClient } from "../../skills/wh-review/scripts/review-provider-client.mjs";
import { recordSimpleReviewRequest } from "../../runtime/review/review-record-route.mjs";

const sha = (value) => createHash("sha256").update(value).digest("hex");
const evidence = { ref: "quality/reviews/material.json", sha256: sha("evidence") };
const materials = { implementation: "managed review" };
const packet = createSimpleReviewPacket({ stage: "verify-code", materials, authenticated_evidence: evidence });
const materialId = packet.material_id;
const evidenceHash = packet.authenticated_evidence_sha256;
const roots = [];
const retryingCleanupRoots = new Set();
const cleanupReadyRoots = new Set();
const retryableCleanupErrors = new Set(["ENOTEMPTY", "EBUSY"]);
function makeTemporaryDirectoriesRemovable(root) {
  const stat = lstatSync(root);
  if (!stat.isDirectory()) return;
  const mode = stat.mode & 0o777;
  if ((mode & 0o200) === 0) chmodSync(root, mode | 0o200);
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const child = join(root, entry.name);
    if (lstatSync(child).isDirectory()) makeTemporaryDirectoriesRemovable(child);
  }
}
async function removeTemporaryRootAfterRuntimeCleanup(root) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      rmSync(root, { recursive: true, force: true });
      return;
    } catch (error) {
      if (!retryableCleanupErrors.has(error?.code) || attempt >= 7) throw error;
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 50));
    }
  }
}
afterEach(async () => {
  vi.useRealTimers();
  while (roots.length) {
    const root = roots.pop();
    if (retryingCleanupRoots.delete(root)) {
      if (!cleanupReadyRoots.delete(root)) throw new Error(`refusing to remove managed-test root before terminal/client cleanup: ${root}`);
      makeTemporaryDirectoriesRemovable(root);
      await removeTemporaryRootAfterRuntimeCleanup(root);
    } else rmSync(root, { recursive: true, force: true });
  }
});

function reviewResult(request, overrides = {}) {
  return {
    status: "unavailable",
    stage: request.stage,
    material_id: materialId,
    authenticated_evidence: evidence,
    authenticated_evidence_sha256: evidenceHash,
    provider_results: [],
    findings: [],
    dispatch_state: "blocked_before_dispatch",
    ...overrides,
  };
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "managed-review-"))); roots.push(root);
  const repo = join(root, "repo"); mkdirSync(repo);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git(["init", "-q", "-b", "main"]); git(["config", "user.name", "Managed review test"]); git(["config", "user.email", "managed-review@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "managed review fixture\n"); git(["add", "."]); git(["commit", "-qm", "fixture"]);
  const task = createTask({ storageRoot: root, manifest: {
    schema_version: "1.0.0", project_name: "ManagedReview", task_id: randomUUID(),
    created_at: "2026-09-09T00:00:00Z", target_repo_root: repo, issue_ids: [], inputs: {}, record_model: "vnext-single-write",
  } });
  const workspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  const kernel = createTaskKernel(task, { candidateWorkspace: workspace, artifacts });
  return { task, kernel, artifacts, workspace };
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

function managedContext(overrides = {}) {
  return {
    hostProvider: "codex",
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
    host_provider: "codex",
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
    host_provider: "codex",
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
  it("blocks preflight without dispatching a provider and reuses the immutable request result", async () => {
    const { task, kernel } = fixture();
    let calls = 0;
    const runRound = async (value) => { calls += 1; return reviewResult(value); };
    const first = await recordSimpleReviewRequest({ task, kernel, request: request(), runRound, resolveRouteIdentity: () => { throw new Error("route unavailable"); } });
    const second = await recordSimpleReviewRequest({ task, kernel, request: request(), runRound, resolveRouteIdentity: () => { throw new Error("route unavailable"); } });
    expect(calls).toBe(0);
    expect(first).toMatchObject({ status: "recorded", dispatch_state: "blocked_before_dispatch" });
    expect(second.reused).not.toBe(true);
    expect(second).toMatchObject({ status: "recorded", dispatch_state: "blocked_before_dispatch" });
  });

  it("records an unavailable attempt when the authenticated source drifts and retains completed members", async () => {
    const { task, kernel, artifacts } = fixture();
    const refs = await recordSimpleReviewRequest({
      task, kernel, request: request(),
      runRound: async (value) => {
        artifacts.writeAtomic("spec.md", "drifted specification\n");
        return reviewResult(value, {
          status: "available",
          outcome: "completed",
          dispatch_state: "dispatched",
          runtime_id: managedRuntime,
          provider_results: [completedProviderResult()],
        });
      },
      resolveRouteIdentity: () => ({ route_identity: sha("route") }),
    });
    expect(refs).toMatchObject({ status: "recorded", dispatch_state: "dispatched", result_ref: null });
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    expect(attempt).toMatchObject({
      terminal_status: "unavailable",
      error: { code: "REVIEW_SOURCE_DRIFT" },
      dispatch_state: "dispatched",
    });
    expect(attempt.provider_attempts).toHaveLength(1);
    expect(attempt.provider_attempts[0]).toMatchObject({ provider: managedProvider, status: "completed" });
  });

  it("keeps an interrupted managed runtime unavailable and does not republish it", async () => {
    const { task, kernel } = fixture();
    const runRound = async (value) => reviewResult(value, {
      status: "unavailable", runtime_id: "runtime-managed", outcome: "unavailable",
      dispatch_state: "dispatched", error: { code: "REVIEW_STATUS_UNAVAILABLE", message: "status unavailable" },
    });
    const first = await recordSimpleReviewRequest({ task, kernel, request: request(), runRound, resolveRouteIdentity: () => ({ route_identity: sha("route") }) });
    const second = await recordSimpleReviewRequest({ task, kernel, request: request(), runRound, resolveRouteIdentity: () => ({ route_identity: sha("route") }) });
    expect(first).toMatchObject({ status: "recorded", dispatch_state: "dispatched", result_ref: null });
    expect(second).toMatchObject({ status: "recorded", reused: true, result_ref: null });
  });

  it.each([
    ["start failure", "REVIEW_BROKER_START_FAILED"],
    ["status unavailable", "REVIEW_STATUS_UNAVAILABLE"],
    ["expired runtime", "REVIEW_RUNTIME_EXPIRED"],
    ["missing runtime", "REVIEW_RUNTIME_MISSING"],
  ])("preserves typed managed lifecycle error: %s", async (_label, code) => {
    const { task, kernel } = fixture();
    const result = await recordSimpleReviewRequest({
      task, kernel, request: request(),
      runRound: async (value) => reviewResult(value, { dispatch_state: code === "REVIEW_BROKER_START_FAILED" ? "blocked_before_dispatch" : "dispatched", runtime_id: code === "REVIEW_BROKER_START_FAILED" ? null : "runtime-managed", error: { code, message: code } }),
      resolveRouteIdentity: () => ({ route_identity: sha("route") }),
    });
    expect(result.status).toBe("recorded");
    expect(result.result_ref).toBeNull();
  });

  it("does not treat a closure-external write as source drift", async () => {
    const { task, kernel, workspace } = fixture();
    const result = await recordSimpleReviewRequest({
      task, kernel, request: request(),
      runRound: async (value) => { writeFileSync(join(workspace.worktreeRoot, "external-note.log"), "outside closure"); return { ...reviewResult(value), authenticated_evidence_sha256: evidenceHash }; },
      resolveRouteIdentity: () => ({ route_identity: sha("route") }),
    });
    expect(result.status).toBe("recorded");
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
    expect(calls[0].requestId).toMatch(/^wh-review-[a-f0-9]{64}$/);
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
        host_provider: "codex",
        provider_allowlist: [managedProvider],
        deadline_ms: null,
      },
      attachments: { version: 1, bundle_id: materialId },
    });
    expect(calls[1]).toMatchObject({ command: "status", runtimeId: managedRuntime });
  });

  it("real candidate managed health reaches terminal", async () => {
    const candidateRoot = process.env.WH_TEST_THIRD_REVIEW_ROOT;
    if (!candidateRoot) throw new Error("WH_TEST_THIRD_REVIEW_ROOT must name the isolated 3rd-review candidate");
    const cli = join(resolve(candidateRoot), "scripts", "3rd-review.mjs");
    expect(existsSync(cli)).toBe(true);

    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-real-managed-health-")));
    roots.push(root);
    retryingCleanupRoots.add(root);
    const isolatedHome = join(root, "home");
    const workflowhubConfigDir = join(isolatedHome, ".config", "workflowhub");
    const packetRoot = join(root, "packets");
    const runtimeRoot = join(root, "runtime");
    const fakeProvider = join(root, "fake-kimi");
    const startedMarker = join(root, "provider-started");
    const releaseMarker = join(root, "provider-release");
    const hostConfigPath = join(workflowhubConfigDir, "config.json");
    const brokerConfigPath = join(root, "3rd-review.json");
    mkdirSync(workflowhubConfigDir, { recursive: true });
    mkdirSync(packetRoot);
    mkdirSync(runtimeRoot);

    const markerEnv = {
      WH_TEST_MANAGED_PROVIDER_STARTED: startedMarker,
      WH_TEST_MANAGED_PROVIDER_RELEASE: releaseMarker,
    };
    writeFileSync(fakeProvider, `#!/usr/bin/env node
import { existsSync, writeFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

writeFileSync(process.env.WH_TEST_MANAGED_PROVIDER_STARTED, "started\\n");
console.log(JSON.stringify({ role: "meta", type: "system.version", version: "0.40.1" }));
console.log(JSON.stringify({ role: "assistant", content: "fake provider is working" }));
while (!existsSync(process.env.WH_TEST_MANAGED_PROVIDER_RELEASE)) await delay(10);
console.log(JSON.stringify({ role: "assistant", content: JSON.stringify({ findings: [] }) }));
console.error("To resume this session: kimi -r fake-kimi-session");
`);
    chmodSync(fakeProvider, 0o700);

    writeFileSync(brokerConfigPath, JSON.stringify({
      version: 4,
      tiers: [["kimi"]],
      runtime: {
        root: runtimeRoot,
        ttl_hours: 24,
        max_prompt_bytes: 100_000,
        max_output_bytes: 100_000,
        liveness_interval_ms: 25,
        orphan_timeout_ms: 1_000,
      },
      attachment_roots: [{ root: packetRoot, sources: [".wh-review-packets"] }],
      providers: {
        kimi: {
          enabled: true,
          command: fakeProvider,
          model: "fake-kimi-model",
          effort: null,
          thinking: null,
          auth: { type: "env", env: Object.keys(markerEnv) },
          env: [],
        },
      },
    }));
    writeFileSync(hostConfigPath, JSON.stringify({
      third_review: {
        command: [process.execPath, cli],
        config: brokerConfigPath,
        attachment_root: packetRoot,
      },
      wh_review: {
        version: 2,
        stages: {
          "build-code": { initial: ["kimi"], mode: "full_only", minimum_heterologous: 1 },
        },
      },
    }));

    const previousHome = process.env.HOME;
    const previousMarkerEnv = Object.fromEntries(Object.keys(markerEnv).map((key) => [key, process.env[key]]));
    process.env.HOME = isolatedHome;
    Object.assign(process.env, markerEnv);
    const hostAbortController = new AbortController();

    const client = new ReviewProviderClient({ command: [process.execPath, cli], config: brokerConfigPath, timeoutMs: null });
    const actualStartManaged = client.startManaged.bind(client);
    const actualStatusManaged = client.statusManaged.bind(client);
    const actualCancelManaged = client.cancelManaged.bind(client);
    let managedContext = null;
    let startedLifecycle = null;
    let runtimeId = null;
    let observedHealth = null;
    let observedTerminal = null;
    const managedStatusObservations = [];
    let terminalCleanupConfirmed = false;
    client.startManaged = async (value) => {
      managedContext = value;
      try {
        const started = await actualStartManaged(value);
        startedLifecycle = started;
        runtimeId = started.runtime_id;
        return started;
      } catch (error) {
        runtimeId = error?.managed_observation?.runtime_id ?? null;
        throw error;
      }
    };
    client.statusManaged = async (value) => {
      const status = await actualStatusManaged(value);
      managedStatusObservations.push({
        input: {
          requestId: value.requestId,
          runtimeId: value.runtimeId,
          materialId: value.materials.materialId,
        },
        status,
      });
      if (status.state === "running" && status.providers?.kimi) observedHealth = status;
      if (status.state === "terminal") {
        observedTerminal = status;
        terminalCleanupConfirmed = true;
      }
      return status;
    };

    let reviewPromise = null;
    let primaryError = null;
    try {
      reviewPromise = runSimpleReview({
        stage: "build-code",
        host_provider: "codex",
        materials: { implementation: "managed health boundary fixture" },
      }, { client, managedStatusPollMs: 20, signal: hostAbortController.signal });

      await Promise.race([
        vi.waitFor(() => {
          expect(observedHealth).toMatchObject({
            state: "running",
            providers: {
              kimi: { status: "running", last_progress_at_ms: expect.any(Number) },
            },
          });
        }, { timeout: 10_000, interval: 20 }),
        reviewPromise.then(() => { throw new Error("managed review reached terminal before health was observed"); }),
      ]);

      expect(observedHealth.providers.kimi.last_progress_at_ms).toBeGreaterThan(0);
      expect(existsSync(startedMarker)).toBe(true);
      writeFileSync(releaseMarker, "release\\n");

      const result = await reviewPromise;
      // Request/material originate in the start input; the broker returns the runtime identity.
      const expectedManagedIdentity = {
        requestId: managedContext.requestId,
        runtimeId: startedLifecycle.runtime_id,
        materialId: managedContext.materials.materialId,
      };
      expect(startedLifecycle).toMatchObject({
        request_id: expectedManagedIdentity.requestId,
        runtime_id: expectedManagedIdentity.runtimeId,
        material_id: expectedManagedIdentity.materialId,
      });
      expect(managedStatusObservations.map(({ status }) => status.state)).toContain("running");
      const terminalObservation = managedStatusObservations.find(({ status }) => status.state === "terminal");
      expect(terminalObservation).toBeDefined();
      for (const { input, status } of managedStatusObservations) {
        expect(input).toEqual(expectedManagedIdentity);
        expect(status).toMatchObject({
          request_id: expectedManagedIdentity.requestId,
          runtime_id: expectedManagedIdentity.runtimeId,
          material_id: expectedManagedIdentity.materialId,
        });
      }
      expect(terminalObservation.status.group).toMatchObject({ runtime_id: expectedManagedIdentity.runtimeId });
      expect(observedTerminal).toMatchObject({
        state: "terminal",
        group: { outcome: "completed", providers: [{ status: "completed" }] },
      });
      expect(result).toMatchObject({
        status: "available",
        outcome: "completed",
        runtime_id: terminalObservation.status.group.runtime_id,
        material_id: terminalObservation.status.material_id,
        provider_results: [{ provider: "kimi", status: "completed" }],
      });
    } catch (error) {
      primaryError = error;
      throw error;
    } finally {
      try {
        if (runtimeId && managedContext && observedTerminal === null) {
          const context = { ...managedContext, runtimeId };
          try {
            await actualCancelManaged(context);
          } catch {
            // A concurrent terminal transition can make cancellation unnecessary;
            // the status loop below is the authoritative cleanup check.
          }
          const cleanupController = new AbortController();
          const cleanupTimer = setTimeout(() => cleanupController.abort(new Error("test cleanup grace expired")), 10_000);
          const cleanupContext = { ...context, signal: cleanupController.signal };
          try {
            while (!cleanupController.signal.aborted) {
              let terminal;
              try {
                terminal = await actualStatusManaged(cleanupContext);
              } catch (error) {
                if (cleanupController.signal.aborted) break;
                throw error;
              }
              if (terminal.state === "terminal") {
                terminalCleanupConfirmed = true;
                break;
              }
              await new Promise((resolveDelay) => setTimeout(resolveDelay, 25));
            }
          } finally {
            clearTimeout(cleanupTimer);
          }
          if (!terminalCleanupConfirmed) {
            hostAbortController.abort(new Error("managed test cleanup grace expired after explicit broker cancellation"));
            if (reviewPromise) await reviewPromise.catch(() => {});
            throw new Error("broker did not report terminal within the 10-second test cleanup grace after explicit cancellation; preserving the temporary root because the provider may still be active");
          }
        }
        if (reviewPromise) await reviewPromise.catch(() => {});
        if (!runtimeId || terminalCleanupConfirmed) cleanupReadyRoots.add(root);
      } catch (cleanupError) {
        if (!terminalCleanupConfirmed) {
          hostAbortController.abort(new Error("managed test cleanup failed before terminal confirmation"));
          if (reviewPromise) await reviewPromise.catch(() => {});
        }
        if (primaryError) throw new AggregateError([primaryError, cleanupError], "managed health test failed and cleanup did not reach terminal");
        throw cleanupError;
      } finally {
        if (previousHome === undefined) delete process.env.HOME;
        else process.env.HOME = previousHome;
        for (const [key, value] of Object.entries(previousMarkerEnv)) {
          if (value === undefined) delete process.env[key];
          else process.env[key] = value;
        }
      }
    }
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

  // End-to-end recording side of the observation repair: a review whose start
  // request reached the broker but whose reply could not be parsed must be recorded
  // as `sent_unparsed` with the runtime id and the provider inventory, not as
  // `blocked_before_dispatch` with an empty attempt list.
  it("records a transmitted-but-unparsed review as sent_unparsed with its provider inventory", async () => {
    const { task, kernel } = fixture();
    const result = await recordSimpleReviewRequest({
      task, kernel, request: request(),
      runRound: async (value) => reviewResult(value, {
        dispatch_state: "sent_unparsed",
        runtime_id: "runtime-managed",
        provider_results: [{ provider: managedProvider, status: "running", error: null }],
        error: { code: "PROTOCOL_INCOMPATIBLE", message: "3rd-review managed lifecycle envelope is invalid" },
      }),
      resolveRouteIdentity: () => ({ route_identity: sha("route") }),
    });

    expect(result).toMatchObject({ status: "recorded", dispatch_state: "sent_unparsed" });
    const attempt = JSON.parse(task.readRecord(result.attempt_ref));
    expect(attempt.dispatch_state).toBe("sent_unparsed");
    expect(attempt.provider_attempts.map((item) => item.provider)).toEqual([managedProvider]);
    expect(attempt.provider_attempts[0]).toMatchObject({ runtime_id: "runtime-managed" });
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
            host_provider: "codex",
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
      materials: { "implementation-diff.patch": "x".repeat(200 * 1024) },
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
          throw Object.assign(new Error("input token limit exceeded"), { code: "INPUT_TOKEN_LIMIT" });
        },
      },
    });

    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "dispatched",
      provider_results: [],
      findings: [],
      error: { code: "REVIEW_INPUT_TOO_LARGE", cause_code: "INPUT_TOKEN_LIMIT" },
    });
    expect(calls).toEqual(["runGroup"]);
    expect(providerInput.materials.deliveryManifest).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: expect.stringContaining("implementation-diff.patch"), bytes: 200 * 1024 }),
    ]));
  });
});
