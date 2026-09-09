import { afterEach, describe, expect, it } from "vitest";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

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
    expect(second.reused).toBe(true);
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
      } }),
      client,
      managedStatusPollMs: 0,
    });

    expect(result).toMatchObject({ status: "available", runtime_id: managedRuntime, outcome: "completed" });
    expect(calls.map(({ command }) => command)).toEqual(["start", "status"]);
  });

  it("cancels a managed runtime that exceeds the production terminal wait", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "managed-review-production-timeout-")));
    roots.push(attachmentRoot);
    const calls = [];
    const running = (value) => ({ version: "workflowhub-run.v1", request_id: value.requestId,
      runtime_id: managedRuntime, state: "running", material_id: value.materials.materialId });
    const client = {
      async startManaged(value) { calls.push("start"); return running(value); },
      async statusManaged(value) { calls.push("status"); return running(value); },
      async cancelManaged(value) {
        calls.push("cancel");
        return { ...running(value), state: "terminal", group: managedGroup("cancelled", managedMember({
          status: "cancelled", continuable: false, error: { code: "CANCELLED", message: "bounded wait elapsed" },
          unavailable_diagnostics: { code: "CANCELLED", message: "bounded wait elapsed" }, output: null,
        })) };
      },
    };
    const result = await runSimpleReview({
      stage: "verify-code", host_provider: "codex", materials: { implementation: "managed runner bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: [managedProvider], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: [managedProvider], provider_identities: {
        [managedProvider]: { source_id: "review/source", config_id: "review-config" },
      } }),
      client,
      managedTerminalWaitMs: 0,
      managedStatusPollMs: 0,
    });

    expect(result).toMatchObject({ status: "unavailable", runtime_id: managedRuntime, outcome: "cancelled" });
    expect(calls).toEqual(["start", "status", "cancel"]);
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
        required_result_protocol: "workflowhub-result.v2",
        host_provider: "codex",
        provider_allowlist: [managedProvider],
        deadline_ms: null,
      },
      attachments: { version: 1, bundle_id: materialId },
    });
    expect(calls[1]).toMatchObject({ command: "status", runtimeId: managedRuntime });
  });

  it("classifies plain-text managed stderr instead of leaking SyntaxError", async () => {
    const client = new ReviewProviderClient({
      invoke: async () => ({ stdout: "not-json", stderr: "broker crashed", exitCode: 1, timedOut: false }),
    });

    await expect(client.startManaged(managedContext())).rejects.toMatchObject({
      code: "PROTOCOL_INCOMPATIBLE",
    });
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

  it("blocks oversized verify-code input before any provider dispatch", async () => {
    let calls = 0;
    const result = await runSimpleReview({
      stage: "verify-code",
      host_provider: "codex",
      materials: { "implementation-diff.patch": "x".repeat(200 * 1024) },
    }, {
      client: { async runGroup() { calls += 1; throw new Error("provider must not be called"); } },
    });

    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "blocked_before_dispatch",
      provider_results: [],
      findings: [],
      error: {
        code: "REVIEW_INPUT_TOO_LARGE",
        diagnostic: {
          field: "provider_input",
          actual: "oversized",
          next_action: "shrink the review closure and retry",
        },
      },
    });
    expect(calls).toBe(0);
  });
});
