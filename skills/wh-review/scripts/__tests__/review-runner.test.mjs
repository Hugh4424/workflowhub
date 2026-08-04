import { afterEach } from "vitest";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FORMAT_CORRECTION_PROMPT, parseReviewerOutput } from "../review-output.mjs";
import { aggregateProviderResults, classifyAttempt, classificationSummary } from "../review-result.mjs";
import { ReviewProviderClient } from "../review-provider-client.mjs";
import { runReview, runReviewFixture, verifyFinal, verifyFinalSubject } from "../review-runner.mjs";
import { createTask, createTaskKernel, openTask } from "../../../../runtime/task/task-handle.mjs";
import { openAcceptedWorkspace, prepareTaskWorkspace } from "../../../../runtime/task/workspace.mjs";
import { execFileSync } from "node:child_process";

const materialId = "a".repeat(64);
const source = { targetCommit: "1".repeat(40), baseCommit: "2".repeat(40), baseTree: "3".repeat(40), capturedHead: "4".repeat(40), snapshotTree: "5".repeat(40) };
const pass = JSON.stringify({ verdict: "pass", summary: "ok", findings: [] });
const revise = JSON.stringify({ verdict: "revise_required", summary: "fix", findings: [{ severity: "major", path: "a.js", line: 1, issue: "bug", root_cause: "missing guard", recommendation: "fix it", evidence_kind: "direct", evidence: "a.js line 1 calls the unsafe branch" }] });
const temporary = [];

describe("review result classification", () => {
  it("keeps attempt failures separate from finding quality facts", () => {
    const attempt = { provider_attempts: [
      { provider: "kimi", status: "completed", error: null, execution: { timing: { duration_ms: 10 } } },
      { provider: "opencode", status: "failed", error: { code: "OUTPUT_INVALID" }, execution: { timing: { duration_ms: 20 } } },
      { provider: "grok", status: "failed", error: { code: "NEW_BROKER_CODE" }, execution: { timing: { duration_ms: 30 } } },
    ] };
    expect(classifyAttempt(attempt.provider_attempts[0])).toBe("completed");
    expect(classifyAttempt(attempt.provider_attempts[1])).toBe("OUTPUT_INVALID");
    expect(classifyAttempt(attempt.provider_attempts[2])).toBe("UNKNOWN");
    expect(classificationSummary(attempt, { adjudication: { clusters: [{ disposition: "invalid_evidence" }] } })).toMatchObject({
      attempt: { completed: 1, OUTPUT_INVALID: 1, UNKNOWN: 1 }, failed_duration_ms: 50, quality_denominator: 1,
      finding: { invalid_anchor: 1 },
    });
  });

  it("reports public protocol failures explicitly", () => {
    const attempt = { provider_attempts: [
      { provider: "cursor/grok", status: "failed", error: { code: "PUBLIC_RESULT_INVALID" }, execution: { timing: { duration_ms: 7 } } },
      { provider: "kimi/k3", status: "failed", error: { code: "PROTOCOL_INCOMPATIBLE" }, execution: { timing: { duration_ms: 8 } } },
      { provider: "opencode/v4flash", status: "failed", error: { code: "MATERIAL_INCOMPLETE" }, execution: { timing: { duration_ms: 9 } } },
    ] };

    expect(classifyAttempt(attempt.provider_attempts[0])).toBe("PUBLIC_RESULT_INVALID");
    expect(classificationSummary(attempt)).toMatchObject({
      attempt: { PUBLIC_RESULT_INVALID: 1, PROTOCOL_INCOMPATIBLE: 1, MATERIAL_INCOMPLETE: 1, UNKNOWN: 0 },
      failed_duration_ms: 24,
      quality_denominator: 0,
    });
  });
});
function publicProvider(provider, { status = "completed", material = materialId, sessionId = "s", output = pass, error = null } = {}) {
  return {
    result_protocol: "workflowhub-result.v2", provider, adapter: provider.split("/", 1)[0], model: null, effort: null, thinking: null,
    status, material_id: material, runtime_id: "run", session_id: sessionId, session_file_path: null, continuable: sessionId !== null,
    timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 }, usage: null, retry: { count: 0, progress_events: 0 },
    raw_output_ref: null,
    unavailable_diagnostics: status === "completed" ? null : error, output, error,
  };
}

function managedInvoke(group, calls = []) {
  let requestId = null;
  return async (value) => {
    calls.push(value);
    if (value.command === "start") requestId = value.requestId;
    const base = { version: "workflowhub-run.v1", request_id: requestId, runtime_id: "run", material_id: materialId };
    if (value.command === "start") return { exitCode: 0, stdout: JSON.stringify({ ...base, state: "starting" }), stderr: "" };
    if (value.command === "status") return { exitCode: 0, stdout: JSON.stringify({ ...base, state: "terminal", group }), stderr: "" };
    throw new Error(`unexpected broker command ${value.command}`);
  };
}

function publicGroup(providers, outcome = "completed") {
  return { version: 4, outcome, runtime_id: "run", round: 0, host_provider: "codex", selected_tier: 0, providers };
}
function fixture(prefix = "simple-review-") {
  const root = realpathSync(mkdtempSync(join(tmpdir(), prefix))); temporary.push(root);
  const attachmentRoot = join(root, "attachments"); mkdirSync(attachmentRoot);
  const task = createTask({ storageRoot: root, taskPath: join(root, "Projects", "Demo", "tasks", "task"), manifest: {
    schema_version: "1.0.0", project_name: "Demo", task_id: "task", created_at: "2026-07-16T00:00:00.000Z",
    target_repo_root: join(root, "repo"), issue_ids: [], inputs: {},
  } });
  return { root, attachmentRoot, task };
}
function dualV2Policy() {
  return {
    source: "wh_review.v2", mode: "full_only", minimum_heterologous: 1,
    requested_profiles: ["pi/k3", "cursor/grok"],
    requested_profile_specs: [
      { provider: "pi/k3", model: "kimi-k3", effort: null, thinking: true, priority: 10 },
      { provider: "cursor/grok", model: "grok", effort: null, thinking: null, priority: 20 },
    ],
    eligible_profiles: ["pi/k3", "cursor/grok"], same_source_exclusions: [],
    effective_profiles: [
      { provider: "pi/k3", adapter: "pi", model: "kimi-k3", effort: null, thinking: true },
      { provider: "cursor/grok", adapter: "cursor", model: "grok", effort: null, thinking: null },
    ],
    round: "initial",
  };
}
afterEach(() => { while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true }); });

describe("review output", () => {
  it("accepts pure JSON or one fenced JSON object only", () => {
    expect(parseReviewerOutput(pass).verdict).toBe("pass");
    expect(parseReviewerOutput(`note\n\`\`\`json\n${revise}\n\`\`\``).verdict).toBe("revise_required");
    expect(() => parseReviewerOutput(`\`\`\`json\n${pass}\n\`\`\`\n\`\`\`json\n${pass}\n\`\`\``)).toThrow(/OUTPUT_INVALID/);
    expect(() => parseReviewerOutput("not json")).toThrow(/OUTPUT_INVALID/);
    expect(parseReviewerOutput(JSON.stringify({ verdict: "revise_required", summary: "file issue", findings: [{ severity: "major", path: "a.js", line: null, issue: "bug", root_cause: "missing guard", recommendation: "fix", evidence_kind: "direct", evidence: "a.js has no guard" }] })).findings[0]).not.toHaveProperty("line");
    expect(() => parseReviewerOutput(JSON.stringify({ verdict: "revise_required", summary: "unsupported", findings: [{ severity: "major", path: "a.js", issue: "bug", recommendation: "fix" }] }), { requireEvidence: true })).toThrow(/evidence_kind/);
  });
});

describe("public provider client", () => {
  it("consumes only a terminal workflowhub-result.v2 managed group", async () => {
    const calls = []; const client = new ReviewProviderClient({ pollIntervalMs: 0, invoke: managedInvoke(publicGroup([publicProvider("opencode", { status: "failed", sessionId: null, output: null, error: { code: "AUTH", message: "no" } })], "unavailable"), calls) });
    const result = await client.run({ hostProvider: "codex", provider: "opencode", materials: { bundleRoot: "/attachments/.wh-review-packets/bundle", attachmentRoot: "/attachments", sourcePrefix: ".wh-review-packets/bundle", materialId, manifest: [] }, prompt: "review", requestId: "request" });
    expect(result.provider.error.code).toBe("AUTH"); expect(result.provider.unavailable_diagnostics).toEqual({ code: "AUTH", message: "no" }); expect(result.provider.execution.adapter).toBe("opencode"); expect(calls.map(({ command }) => command)).toEqual(["start", "status"]); expect(calls[0].request.required_result_protocol).toBe("workflowhub-result.v2");
  });

  it("sends one candidate group and reconnects through managed status", async () => {
    const calls = [];
    const client = new ReviewProviderClient({ pollIntervalMs: 0, invoke: managedInvoke(publicGroup([publicProvider("claude-code/opus"), publicProvider("kimi/k3")]), calls) });
    const result = await client.runGroup({
      hostProvider: "codex", providers: ["claude-code/opus", "kimi/k3"],
      materials: { bundleRoot: "/attachments/.wh-review-packets/bundle", attachmentRoot: "/attachments", sourcePrefix: ".wh-review-packets/bundle", materialId, manifest: [] },
      prompt: "review", requestId: "same-identity",
    });
    expect(calls).toHaveLength(2);
    expect(calls.map(({ command }) => command)).toEqual(["start", "status"]);
    expect(calls[0].requestId).toBe("same-identity");
    expect(calls[0].request.provider_allowlist).toEqual(["claude-code/opus", "kimi/k3"]);
    expect(result.runtimeId).toBe("run");
    expect(result.providers.map(({ provider }) => provider)).toEqual(["claude-code/opus", "kimi/k3"]);
  });

  it("lets the managed broker own the default lifecycle deadline", async () => {
    const calls = [];
    const client = new ReviewProviderClient({
      pollIntervalMs: 0,
      invoke: async (value) => {
        calls.push(value);
        await new Promise((resolve) => setTimeout(resolve, 25));
        const base = { version: "workflowhub-run.v1", request_id: "default-deadline", runtime_id: "run", material_id: materialId };
        if (value.command === "start") return { exitCode: 0, stdout: JSON.stringify({ ...base, state: "starting" }), stderr: "" };
        return { exitCode: 0, stdout: JSON.stringify({ ...base, state: "terminal", group: publicGroup([publicProvider("kimi/k3")]) }), stderr: "" };
      },
    });
    await expect(client.run({
      hostProvider: "codex", provider: "kimi/k3",
      materials: { bundleRoot: "/attachments/.wh-review-packets/bundle", attachmentRoot: "/attachments", sourcePrefix: ".wh-review-packets/bundle", materialId, manifest: [] },
      prompt: "review", requestId: "default-deadline",
    })).resolves.toMatchObject({ provider: { provider: "kimi/k3", status: "completed" } });
    expect(calls).toHaveLength(2);
    expect(calls.every((call) => !Object.hasOwn(call, "timeoutMs"))).toBe(true);
  });

  it("rejects a group that omits a configured candidate", async () => {
    const client = new ReviewProviderClient({ pollIntervalMs: 0, invoke: managedInvoke(publicGroup([publicProvider("kimi/k3")])) });
    await expect(client.runGroup({
      hostProvider: "codex", providers: ["claude-code/opus", "kimi/k3"],
      materials: { bundleRoot: "/attachments/.wh-review-packets/bundle", attachmentRoot: "/attachments", sourcePrefix: ".wh-review-packets/bundle", materialId, manifest: [] },
      prompt: "review", requestId: "request",
    })).rejects.toThrow(/omitted configured provider/i);
  });

  it("rejects a public material mismatch", async () => {
    const client = new ReviewProviderClient({ pollIntervalMs: 0, invoke: managedInvoke(publicGroup([publicProvider("kimi", { material: "b".repeat(64) })])) });
    await expect(client.run({ hostProvider: "codex", provider: "kimi", materials: { bundleRoot: "/attachments/.wh-review-packets/bundle", attachmentRoot: "/attachments", sourcePrefix: ".wh-review-packets/bundle", materialId, manifest: [] }, prompt: "review", requestId: "request" })).rejects.toThrow(/MATERIAL_INCOMPLETE/);
  });

  it("delivers large material as file_only paths without embedding it in the prompt", async () => {
    const calls = []; const client = new ReviewProviderClient({ pollIntervalMs: 0, invoke: managedInvoke(publicGroup([publicProvider("opencode")]), calls) });
    await client.run({ hostProvider: "codex", provider: "opencode", materials: { bundleRoot: "/attachments/.wh-review-packets/large", attachmentRoot: "/attachments", sourcePrefix: ".wh-review-packets/large", materialId, deliveryManifest: [{ path: "changes.diff", bytes: 800000, sha256: "f".repeat(64) }, { path: "manifest.json", bytes: 200, sha256: "e".repeat(64) }] }, prompt: "review bundle", requestId: "request" });
    const call = calls[0];
    expect(call.attachmentDelivery).toBe("file_only"); expect(call.request.prompt).toBe("review bundle");
    expect(call.attachments.entries[0]).toMatchObject({ source: ".wh-review-packets/large/changes.diff", destination: "changes.diff", embed: false, size: 800000 });
    expect(call.attachments.entries).toEqual([
      { source: ".wh-review-packets/large/changes.diff", destination: "changes.diff", embed: false, size: 800000, sha256: "f".repeat(64) },
      { source: ".wh-review-packets/large/manifest.json", destination: "manifest.json", embed: false, size: 200, sha256: "e".repeat(64) }
    ]);
  });

  it("rejects v1 and private session paths from a v2 request", async () => {
    const v1 = { result_protocol: "workflowhub-result.v1", provider: "kimi", status: "completed", material_id: materialId, session_id: "s", output: pass, error: null };
    const client = new ReviewProviderClient({ pollIntervalMs: 0, invoke: managedInvoke(publicGroup([v1])) });
    await expect(client.run({ hostProvider: "codex", provider: "kimi", materials: { bundleRoot: "/attachments/.wh-review-packets/bundle", attachmentRoot: "/attachments", sourcePrefix: ".wh-review-packets/bundle", materialId, manifest: [] }, prompt: "review", requestId: "request" })).rejects.toThrow(/PROTOCOL_INCOMPATIBLE/);
    const privatePath = publicProvider("kimi"); privatePath.session_file_path = "/tmp/3rd-review/private-session.json";
    const privateClient = new ReviewProviderClient({ pollIntervalMs: 0, invoke: managedInvoke(publicGroup([privatePath])) });
    await expect(privateClient.run({ hostProvider: "codex", provider: "kimi", materials: { bundleRoot: "/attachments/.wh-review-packets/bundle", attachmentRoot: "/attachments", sourcePrefix: ".wh-review-packets/bundle", materialId, manifest: [] }, prompt: "review", requestId: "request" })).rejects.toThrow(/PUBLIC_RESULT_INVALID/);
  });

  it("fails closed when managed start is unavailable and never falls back to blocking run", async () => {
    const calls = [];
    const client = new ReviewProviderClient({ invoke: async (value) => {
      calls.push(value);
      return { exitCode: 2, stdout: "", stderr: JSON.stringify({ error: { code: "REQUEST_INVALID", message: "unknown command: start" } }) };
    } });
    await expect(client.run({ hostProvider: "codex", provider: "kimi", materials: { bundleRoot: "/attachments/.wh-review-packets/bundle", attachmentRoot: "/attachments", sourcePrefix: ".wh-review-packets/bundle", materialId, manifest: [] }, prompt: "review", requestId: "request" }))
      .rejects.toThrow(/PROTOCOL_INCOMPATIBLE/);
    expect(calls.map(({ command }) => command)).toEqual(["start"]);
  });

  it("turns a hanging managed broker into a provider timeout", async () => {
    const client = new ReviewProviderClient({
      command: [process.execPath, "-e", "setTimeout(() => {}, 10000)"],
      config: "/tmp/workflowhub-timeout-config.json",
      pollIntervalMs: 0,
      timeoutMs: 1000,
    });
    await expect(client.run({
      hostProvider: "codex", provider: "kimi", materials: { bundleRoot: "/attachments/.wh-review-packets/bundle", attachmentRoot: "/attachments", sourcePrefix: ".wh-review-packets/bundle", materialId, manifest: [] }, prompt: "review", requestId: "timeout-request",
    })).rejects.toThrow(/PROVIDER_TIMEOUT/);
  });
});

describe("aggregation and runner", () => {
  it("records a generic protocol failure without leaking managed stderr", async () => {
    const { attachmentRoot, task } = fixture("simple-review-managed-stderr-");
    const providerClient = new ReviewProviderClient({ invoke: async () => ({
      exitCode: 2, stdout: "", stderr: JSON.stringify({ error: { code: "REQUEST_INVALID", message: "cannot start /private/broker-secret" } }),
    }) });
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }),
    });
    const attempt = task.readRecord(result.attemptRef); const report = task.readRecord(result.reportRef);
    expect(result).toMatchObject({ status: "unavailable", verdict: null });
    expect(attempt).toContain("PROTOCOL_INCOMPATIBLE");
    expect(attempt).toContain("did not return a valid public result");
    expect(`${attempt}\n${report}`).not.toContain("/private/broker-secret");
  });

  it("records a generic protocol failure without leaking a managed spawn path", async () => {
    const { attachmentRoot, task } = fixture("simple-review-managed-spawn-");
    const providerClient = new ReviewProviderClient({
      command: ["/private/wh-review-missing-broker"], config: "/private/wh-review-missing-config.json", pollIntervalMs: 0,
    });
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }),
    });
    const attempt = task.readRecord(result.attemptRef); const report = task.readRecord(result.reportRef);
    expect(result).toMatchObject({ status: "unavailable", verdict: null });
    expect(attempt).toContain("PROTOCOL_INCOMPATIBLE");
    expect(`${attempt}\n${report}`).not.toContain("/private/wh-review-missing-broker");
    expect(`${attempt}\n${report}`).not.toContain("/private/wh-review-missing-config.json");
  });

  it("normalizes a nullable V2 provider error before writing unavailable evidence", async () => {
    const { attachmentRoot, task } = fixture("simple-review-null-error-");
    const providerClient = new ReviewProviderClient({
      pollIntervalMs: 0,
      invoke: managedInvoke(publicGroup([publicProvider("kimi", { status: "failed", sessionId: null, output: null, error: { code: "AUTH", message: null } })], "unavailable")),
    });
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }),
    });
    const attempt = JSON.parse(task.readRecord(result.attemptRef));
    expect(result).toMatchObject({ status: "unavailable", verdict: null });
    expect(attempt.provider_attempts).toEqual([expect.objectContaining({
      status: "failed", error: { code: "AUTH", message: "3rd-review provider did not provide an error message" },
    })]);
  });

  it("adjudicates evidence instead of trusting one provider's raw revise verdict", () => {
    const inferred = { verdict: "revise_required", summary: "concern", findings: [{ severity: "major", path: "changed/a.js", line: 2, issue: "missing error path", root_cause: "no failure branch", recommendation: "handle the error", evidence_kind: "inferred", evidence: "the branch appears to assume success" }] };
    const direct = { verdict: "revise_required", summary: "bug", findings: [{ severity: "major", path: "changed/a.js", line: 2, issue: "missing error path", root_cause: "no failure branch", recommendation: "handle the error", evidence_kind: "direct", evidence: "line 2 dereferences the failed result" }] };
    const single = aggregateProviderResults([{ provider: "kimi/coding", review: inferred }]);
    expect(single).toMatchObject({ status: "semantic", verdict: "pass" });
    expect(single.adjudication.clusters[0]).toMatchObject({ disposition: "needs_corroboration", evidence_status: "single_inference" });
    const corroborated = aggregateProviderResults([{ provider: "kimi/coding", review: inferred }, { provider: "claude-code/opus", review: inferred }]);
    expect(corroborated).toMatchObject({ status: "semantic", verdict: "revise_required" });
    expect(corroborated.adjudication.clusters[0]).toMatchObject({ disposition: "actionable", evidence_status: "corroborated_inference", adapter_count: 2 });
    const anchored = aggregateProviderResults([{ provider: "kimi/coding", review: direct, evidenceAnchors: [true] }]);
    expect(anchored).toMatchObject({ status: "semantic", verdict: "revise_required" });
    const invalidAnchor = aggregateProviderResults([{ provider: "kimi/coding", review: direct, evidenceAnchors: [false] }]);
    expect(invalidAnchor).toMatchObject({ status: "semantic", verdict: "pass" });
    expect(invalidAnchor.adjudication.clusters[0]).toMatchObject({ disposition: "invalid_evidence", evidence_status: "invalid_anchor" });
  });

  it("persists only public v2 execution facts on each canonical provider attempt", async () => {
    const { attachmentRoot, task } = fixture("simple-review-v2-execution-");
    const execution = {
      adapter: "kimi", model: "kimi-code/k3", effort: null, thinking: true,
      timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 }, usage: null,
      retry: { count: 0, progress_events: 1 }, runtime_id: "runtime",
    };
    const providerClient = { runGroup: async () => ({ runtimeId: "runtime", providers: [
      { provider: "codex/terra", status: "failed", session_id: null, output: null, error: { code: "SAME_SOURCE", message: "host provider cannot review itself" }, unavailable_diagnostics: { code: "SAME_SOURCE", message: "host provider cannot review itself" }, execution: null },
      { provider: "kimi", status: "completed", session_id: "session", output: pass, error: null, execution },
    ] }) };
    const reviewPolicy = {
      source: "wh_review.v2", mode: "full_only", minimum_heterologous: 1,
      requested_profiles: ["codex/terra", "kimi"], eligible_profiles: ["kimi"], same_source_exclusions: ["codex/terra"],
      effective_profiles: [{ provider: "kimi", adapter: "kimi", model: "kimi-code/k3", effort: null, thinking: true }],
      round: "full",
    };
    const result = await runReviewFixture({ task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: reviewPolicy.requested_profiles, reviewPolicy, providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) });
    const attempt = JSON.parse(task.readRecord(result.attemptRef));
    expect(attempt.provider_attempts.find(({ provider }) => provider === "kimi").execution).toEqual(execution);
    expect(attempt.provider_attempts.find(({ provider }) => provider === "kimi").execution).not.toHaveProperty("session_file_path");
    expect(attempt.provider_attempts.find(({ provider }) => provider === "kimi").execution).not.toHaveProperty("raw_output_ref");
    expect(attempt.provider_attempts.find(({ provider }) => provider === "codex/terra")).toMatchObject({ status: "failed", error: { code: "SAME_SOURCE" } });
    expect(attempt.review_policy).toEqual(reviewPolicy);
    expect(attempt.policy_snapshot_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(attempt.coverage).toEqual({
      mode: "single_external", selected_profiles: ["kimi"], selected_count: 1,
      valid_provider_count: 1, minimum_required: 1,
    });
    const report = task.readRecord(attempt.report_ref);
    expect(report).toContain("# wh-review report — build-code");
    expect(report).toContain("kimi-code/k3");
    expect(report).toContain("Provider unavailable diagnostics:");
    expect(report).toContain("codex/terra: SAME_SOURCE");
    expect(report).toContain("state=SESSION_PATH_UNAVAILABLE");
    expect(report).not.toContain("/tmp/3rd-review");
    expect(JSON.stringify(attempt)).not.toContain("/tmp/3rd-review");
  });

  it("derives final build-code coverage and seams before assembling an integration packet", async () => {
    const { attachmentRoot, task } = fixture("simple-review-integration-subject-");
    const integration = {
      schema_version: "integration-review-subject.v1", subject_kind: "worktree", review_scope: "integration",
      base_commit: source.baseCommit, base_tree: source.baseTree, snapshot_tree: source.snapshotTree,
      phase_coverage: { schema_version: "phase-review-coverage.v1", checkpoint: { commit: source.baseCommit, tree: source.baseTree }, snapshot_tree: source.snapshotTree, phases: [{ phase_id: "T01" }] },
      seam_index: { schema_version: "cross-phase-seam-index.v1", snapshot_tree: source.snapshotTree, entries: [] },
      ac_trace: { schema_version: "ac-change-test-trace.v1", snapshot_tree: source.snapshotTree, acceptance_ids: ["AC-1"], entries: [{ acceptance_criterion_id: "AC-1", change: [{ phase_id: "T01", path: "change.mjs" }], test: [{ phase_id: "T01", receipt_ref: "receipts/tests.json", receipt_hash: "a".repeat(64) }], evidence: [{ phase_id: "T01", ref: "evidence/phase.json", sha256: "b".repeat(64) }], anchors: [{ id: "ac", path: "change.mjs", start_line: 1, end_line: 1, role: "acceptance", reason: "bound" }] }] },
    };
    let materialInput = null;
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-code", hostProvider: "codex", providers: ["kimi"],
      materials: { phase_coverage: { forged: true }, seam_index: { forged: true }, ac_trace: { forged: true } },
      providerClient: { run: async () => ({ runtimeId: "runtime", provider: { provider: "kimi", status: "completed", session_id: "session", output: pass, error: null, execution: null } }) },
      captureSource: (input) => { expect(input.includeDiff).toBe(false); return source; },
      buildIntegrationSubject: (input) => { expect(input).toMatchObject({ task, finalTree: source.snapshotTree }); return integration; },
      buildMaterials: (input) => { materialInput = input; return { bundleRoot: attachmentRoot, materialId, manifest: [] }; },
    });
    expect(materialInput.reviewScope).toBe("integration");
    expect(materialInput.materials.phase_coverage).toBe(integration.phase_coverage);
    expect(materialInput.materials.seam_index).toBe(integration.seam_index);
    expect(materialInput.materials.ac_trace).toBe(integration.ac_trace);
    const resultRecord = JSON.parse(task.readRecord(result.resultRef));
    expect(resultRecord).toMatchObject({ review_scope: "integration", base_tree: source.baseTree, candidate_tree: source.snapshotTree, source: { base_commit: source.baseCommit, base_tree: source.baseTree } });
  });

  it("records a missing integration trace as one canonical unavailable attempt without provider dispatch", async () => {
    const { attachmentRoot, task } = fixture("simple-review-integration-material-incomplete-");
    const calls = [];
    const reviewPolicy = dualV2Policy();
    // Material compilers conventionally report their public failure code in
    // the message; they are not required to attach a JavaScript error.code.
    const incomplete = new Error("MATERIAL_INCOMPLETE: no continuous PASS Phase coverage chain reaches the final tree");
    const options = {
      task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex",
      providers: reviewPolicy.requested_profiles, reviewPolicy,
      providerClient: { run: async () => { calls.push(true); throw new Error("provider must not be called"); } },
      captureSource: () => source,
      buildIntegrationSubject: () => { throw incomplete; },
      buildMaterials: () => { throw new Error("material assembly must not run after failed integration identity"); },
    };
    const first = await runReviewFixture(options);
    expect(first).toMatchObject({ status: "unavailable", verdict: null, resultRef: null, reviewScope: "integration" });
    expect(calls).toHaveLength(0);
    const attempt = JSON.parse(task.readRecord(first.attemptRef));
    expect(attempt).toMatchObject({
      terminal_status: "unavailable", error: { code: "MATERIAL_INCOMPLETE", message: incomplete.message },
      review_scope: "integration", provider_attempts: [],
    });
    expect(task.readRecord(first.reportRef)).toContain("MATERIAL_INCOMPLETE: no continuous PASS Phase coverage chain");

    const second = await runReviewFixture(options);
    expect(second).toMatchObject({ status: "unavailable", attemptRef: first.attemptRef, reused: true });
    expect(calls).toHaveLength(0);
  });

  it("keeps the undispatched material-preflight exemption narrower than all other v2 evidence", async () => {
    const mutations = [
      (attempt) => { attempt.terminal_status = "semantic"; },
      (attempt) => { attempt.error.code = "PROVIDER_UNAVAILABLE"; },
      (attempt) => { attempt.policy_snapshot_hash = "0".repeat(64); },
      (attempt) => { attempt.provider_attempts = [{
        provider: "pi/k3", status: "failed", session_id: null, runtime_id: "runtime",
        execution: null, unavailable_diagnostics: null, output_ref: null,
        error: { code: "AUTH", message: "no" },
      }]; },
    ];
    for (const [index, mutate] of mutations.entries()) {
      const { root, attachmentRoot, task } = fixture(`simple-review-v2-preflight-boundary-${index}-`);
      const calls = [];
      const reviewPolicy = dualV2Policy();
      const options = {
        task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex",
        providers: reviewPolicy.requested_profiles, reviewPolicy,
        providerClient: { run: async () => { calls.push(true); throw new Error("provider must not be called"); } },
        captureSource: () => source,
        buildIntegrationSubject: () => { throw new Error("MATERIAL_FORBIDDEN: frozen preflight"); },
        buildMaterials: () => { throw new Error("material assembly must not run"); },
      };
      const first = await runReviewFixture(options);
      const attemptPath = join(root, "Projects", "Demo", "tasks", "task", first.attemptRef);
      const attempt = JSON.parse(readFileSync(attemptPath, "utf8"));
      mutate(attempt);
      writeFileSync(attemptPath, `${JSON.stringify(attempt, null, 2)}\n`);
      await expect(runReviewFixture(options)).rejects.toThrow(/REVIEW_EVIDENCE_INVALID/);
      expect(calls).toHaveLength(0);
    }
  });

  it("withholds a generic absolute material-preflight diagnostic from canonical public evidence", async () => {
    const { attachmentRoot, task } = fixture("simple-review-integration-private-diagnostic-");
    const calls = [];
    const syntheticHostPath = String.fromCharCode(47, 119, 111, 114, 107, 115, 112, 97, 99, 101, 47, 104, 111, 115, 116, 45, 111, 110, 108, 121, 47, 116, 114, 97, 99, 101, 46, 106, 115, 111, 110);
    const incomplete = new Error(`MATERIAL_INCOMPLETE: integration trace was read from ${syntheticHostPath}`);
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"],
      providerClient: { run: async () => { calls.push(true); throw new Error("provider must not be called"); } },
      captureSource: () => source,
      buildIntegrationSubject: () => { throw incomplete; },
      buildMaterials: () => { throw new Error("material assembly must not run after failed integration identity"); },
    });
    expect(calls).toHaveLength(0);
    const attempt = JSON.parse(task.readRecord(result.attemptRef));
    expect(attempt.error).toEqual({ code: "MATERIAL_INCOMPLETE", message: "review material preflight failed; private diagnostic withheld" });
    const report = task.readRecord(result.reportRef);
    expect(report).toContain("private diagnostic withheld");
    expect(report).not.toContain(syntheticHostPath);
  });

  it("rejects a completed provider whose execution tuple differs from the pinned profile", async () => {
    const { attachmentRoot, task } = fixture("simple-review-profile-mismatch-");
    const execution = {
      adapter: "kimi", model: "unexpected-model", effort: null, thinking: true,
      timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 }, usage: null,
      retry: { count: 0, progress_events: 0 }, runtime_id: "runtime",
    };
    const reviewPolicy = {
      source: "wh_review.v2", mode: "full_only", minimum_heterologous: 1,
      requested_profiles: ["kimi/coding"],
      requested_profile_specs: [{ provider: "kimi/coding", model: "kimi-for-coding", effort: null, thinking: true, priority: 10 }],
      eligible_profiles: ["kimi/coding"], same_source_exclusions: [],
      effective_profiles: [{ provider: "kimi/coding", adapter: "kimi", model: "kimi-for-coding", effort: null, thinking: true }],
      round: "full",
    };
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi/coding"], reviewPolicy,
      providerClient: { runGroup: async () => ({ runtimeId: "runtime", providers: [{ provider: "kimi/coding", status: "completed", session_id: "session", output: pass, error: null, execution }] }) },
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }),
    });
    expect(result).toMatchObject({ status: "unavailable", verdict: null });
    const attempt = JSON.parse(task.readRecord(result.attemptRef));
    expect(attempt.provider_attempts).toEqual([expect.objectContaining({
      provider: "kimi/coding", status: "failed", execution,
      error: expect.objectContaining({ code: "PROFILE_MISMATCH" }),
    })]);
    const report = task.readRecord(attempt.report_ref);
    expect(report).toContain("requested profile pins");
    expect(report).toContain("PROFILE_MISMATCH");
  });

  it("runs a structural full follow-up with controller ledger only, never provider-visible ledger material", async () => {
    const { attachmentRoot, task } = fixture("structural-full-ledger-");
    const initialPolicy = {
      source: "wh_review.v2", mode: "full_on_structural_rework", minimum_heterologous: 1,
      requested_profiles: ["kimi/coding"], eligible_profiles: ["kimi/coding"], same_source_exclusions: [],
      effective_profiles: [{ provider: "kimi/coding", adapter: "kimi", model: "kimi-for-coding", effort: null, thinking: true }],
      round: "initial",
    };
    const providerClient = { runGroup: async () => ({ runtimeId: "structural-runtime", providers: [
      { provider: "kimi/coding", status: "completed", session_id: "session", output: revise, error: null, execution: null },
    ] }) };
    const first = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-spec", materials: {}, hostProvider: "codex", providers: ["kimi/coding"], reviewPolicy: initialPolicy, providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }),
    });
    const prior = { ...JSON.parse(task.readRecord(first.resultRef)), result_ref: first.resultRef };
    const currentTree = "6".repeat(40);
    const ledger = {
      version: "wh-review-response-ledger.v1", previous_result_ref: first.resultRef,
      previous_snapshot_tree: prior.snapshot_tree, current_snapshot_tree: currentTree,
      responses: [{ finding_id: prior.adjudication.clusters.find(({ disposition }) => disposition === "actionable").id, status: "fixed", rationale: "reworked the schema", changed_dimensions: ["schema"], evidence_refs: ["evidence/fix.json"] }],
    };
    const visibleMaterials = [];
    const full = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-spec", materials: { draft_spec: "reworked" }, controlLedger: ledger,
      hostProvider: "codex", providers: ["kimi/coding"],
      reviewPolicy: { ...initialPolicy, round: "full" }, reviewRound: "full",
      providerClient,
      captureSource: () => ({ ...source, snapshotTree: currentTree }),
      buildMaterials: (input) => { visibleMaterials.push(input.materials); return { bundleRoot: attachmentRoot, materialId: "b".repeat(64), manifest: [] }; },
    });
    expect(full.status).toBe("semantic");
    expect(visibleMaterials).toHaveLength(1);
    expect(visibleMaterials[0]).toMatchObject({ draft_spec: "reworked" });
    expect(visibleMaterials[0]).not.toHaveProperty("response_ledger");
    expect(JSON.parse(task.readRecord(full.resultRef))).not.toHaveProperty("review_chain");
  });

  it("dispatches a production reviewer group once and records each provider result", async () => {
    const { attachmentRoot, task } = fixture("simple-review-group-dispatch-");
    const calls = [];
    const providerClient = { runGroup: async (request) => {
      calls.push(request);
      return {
        runtimeId: "group-runtime",
        providers: [
          { provider: "claude-code/opus", status: "completed", session_id: "claude-session", output: pass, error: null, execution: null },
          { provider: "kimi/k3", status: "failed", session_id: null, output: null, error: { code: "AUTH", message: "not available" }, execution: null },
        ],
      };
    } };
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex",
      providers: ["claude-code/opus", "kimi/k3"], previousRuntimeIds: { "claude-code/opus": "old-group", "kimi/k3": "old-group" }, providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }),
    });
    expect(calls).toEqual([expect.objectContaining({
      hostProvider: "codex", providers: ["claude-code/opus", "kimi/k3"], continuationRuntimeId: "old-group",
    })]);
    expect(result.runtimeIds).toEqual({ "claude-code/opus": "group-runtime", "kimi/k3": "group-runtime" });
    const attempt = JSON.parse(task.readRecord(result.attemptRef));
    expect(attempt.provider_attempts).toEqual(expect.arrayContaining([
      expect.objectContaining({ provider: "claude-code/opus", runtime_id: "group-runtime", status: "completed" }),
      expect.objectContaining({ provider: "kimi/k3", runtime_id: "group-runtime", status: "failed", error: { code: "AUTH", message: "not available" } }),
    ]));
  });

  it("corrects one invalid managed-group output in the same runtime and preserves both outputs", async () => {
    const { attachmentRoot, task } = fixture("simple-review-group-format-correction-"); const calls = [];
    const providerClient = { runGroup: async (request) => {
      calls.push(request);
      const output = calls.length === 1 ? "```json\\n{ invalid }\\n```" : revise;
      return { runtimeId: calls.length === 1 ? "group-runtime" : "correction-runtime", providers: [
        { provider: "kimi", status: "completed", session_id: "session", output, error: null, execution: null },
      ] };
    } };
    const result = await runReviewFixture({ task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) });
    expect(result).toMatchObject({ status: "semantic", verdict: "revise_required" });
    expect(calls).toHaveLength(2);
    expect(calls[1]).toMatchObject({ prompt: FORMAT_CORRECTION_PROMPT, continuationRuntimeId: "group-runtime", providers: ["kimi"] });
    expect(calls[1].prompt).toContain('"path":"bundle-relative path"');
    expect(calls[1].prompt).toContain('"evidence_kind":"direct|inferred|machine"');
    expect(calls[1].prompt).toContain("Do not repeat the review or change its assessment.");
    const attempt = JSON.parse(task.readRecord(result.attemptRef));
    expect(attempt.provider_attempts).toHaveLength(2);
    expect(JSON.parse(task.readRecord(attempt.provider_attempts[0].output_ref)).content).toContain("{ invalid }");
    expect(JSON.parse(task.readRecord(attempt.provider_attempts[1].output_ref)).content).toBe(revise);
  });

  it("fails closed when the one managed-group format correction is still invalid", async () => {
    const { attachmentRoot, task } = fixture("simple-review-group-format-failed-"); const calls = [];
    const providerClient = { runGroup: async (request) => {
      calls.push(request);
      return { runtimeId: calls.length === 1 ? "group-runtime" : "correction-runtime", providers: [
        { provider: "kimi", status: "completed", session_id: "session", output: "not valid JSON", error: null, execution: null },
      ] };
    } };
    const result = await runReviewFixture({ task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) });
    expect(result).toMatchObject({ status: "unavailable", resultRef: null });
    expect(calls).toHaveLength(2);
    const attempt = JSON.parse(task.readRecord(result.attemptRef));
    expect(attempt.provider_attempts).toHaveLength(2);
    expect(attempt.provider_attempts.at(-1)).toMatchObject({ status: "failed", error: { code: "OUTPUT_INVALID" } });
  });

  it("rejects a second group format correction after the one correction was already consumed", async () => {
    const { attachmentRoot, task } = fixture("simple-review-existing-group-format-correction-"); const calls = [];
    const providerClient = { runGroup: async (request) => {
      calls.push(request);
      const output = calls.length < 3 ? "not valid JSON" : revise;
      return { runtimeId: calls.length === 1 ? "frozen-runtime" : `runtime-${calls.length}`, providers: [
        { provider: "kimi", status: "completed", session_id: "session", output, error: null, execution: null },
      ] };
    } };
    const options = { task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) };
    const unavailable = await runReviewFixture(options);
    expect(unavailable).toMatchObject({ status: "unavailable", resultRef: null });
    await expect(runReviewFixture({ ...options, formatCorrectionAttemptRef: unavailable.attemptRef })).rejects.toThrow(/already consumed/);
    expect(calls).toHaveLength(2);
  });

  it("does not pass a v2 route when its configured initial quorum is not met", async () => {
    const { attachmentRoot, task } = fixture("simple-review-v2-quorum-");
    const reviewPolicy = {
      source: "wh_review.v2", mode: "adaptive", minimum_heterologous: 2,
      requested_profiles: ["claude-code/opus", "kimi/k3"], eligible_profiles: ["claude-code/opus", "kimi/k3"], same_source_exclusions: [],
      effective_profiles: [
        { provider: "claude-code/opus", adapter: "claude-code", model: "claude-opus-4-8", effort: "high", thinking: null },
        { provider: "kimi/k3", adapter: "kimi", model: "k3", effort: null, thinking: true },
      ],
      round: "initial",
    };
    const calls = [];
    const providerClient = { run: async ({ provider }) => { calls.push(provider); return { runtimeId: `runtime-${provider}`, provider: provider === "kimi/k3"
      ? { provider, status: "completed", session_id: "session", output: pass, error: null }
      : { provider, status: "failed", session_id: null, output: null, error: { code: "AUTH", message: "unavailable" } } }; } };
    const options = {
      task, attachmentRoot, taskId: "task", stage: "build-spec", materials: {}, hostProvider: "codex", providers: reviewPolicy.eligible_profiles,
      reviewPolicy, providerClient, captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }),
    };
    const result = await runReviewFixture(options);
    expect(result).toMatchObject({ status: "unavailable", verdict: null, resultRef: null });
    const attempt = JSON.parse(task.readRecord(result.attemptRef));
    expect(attempt.coverage).toMatchObject({ valid_provider_count: 1, minimum_required: 2 });
    expect(attempt.error.message).toContain("only 1 valid reviewer result(s); 2 required");
    expect(attempt.provider_attempts.find(({ provider }) => provider === "kimi/k3").output_ref).toContain("p-a2ltaS9rMw.output.json");
    const retried = await runReviewFixture(options);
    expect(retried).toMatchObject({ status: "unavailable", verdict: null, resultRef: null });
    expect(retried.attemptRef).not.toBe(result.attemptRef);
    expect(calls).toEqual(["claude-code/opus", "kimi/k3", "claude-code/opus", "kimi/k3"]);
  });

  it("counts at most one valid profile from each adapter toward a v2 quorum", async () => {
    const onlyKimi = aggregateProviderResults([
      { provider: "kimi/coding", review: JSON.parse(pass) },
      { provider: "kimi/k3", review: JSON.parse(pass) },
    ], 2, { profilePriority: ["kimi/k3", "kimi/coding"] });
    expect(onlyKimi).toMatchObject({ status: "unavailable" });
    expect(onlyKimi.valid.map(({ provider }) => provider)).toEqual(["kimi/k3"]);

    const { attachmentRoot, task } = fixture("simple-review-v2-adapter-quorum-");
    const reviewPolicy = {
      source: "wh_review.v2", mode: "adaptive", minimum_heterologous: 2,
      requested_profiles: ["kimi/k3", "kimi/coding", "claude-code/opus"],
      eligible_profiles: ["kimi/k3", "claude-code/opus"], same_source_exclusions: [],
      effective_profiles: [
        { provider: "kimi/k3", adapter: "kimi", model: "k3", effort: null, thinking: true },
        { provider: "claude-code/opus", adapter: "claude-code", model: "claude-opus-4-8", effort: "high", thinking: null },
      ],
      round: "initial",
    };
    const providerClient = { runGroup: async ({ providers }) => ({
      runtimeId: "adapter-quorum-runtime",
      providers: providers.map((provider) => ({ provider, status: "completed", session_id: `session-${provider}`, output: pass, error: null, execution: null })),
    }) };
    const result = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-spec", materials: {}, hostProvider: "codex",
      providers: reviewPolicy.requested_profiles, reviewPolicy, providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }),
    });
    const attempt = JSON.parse(task.readRecord(result.attemptRef));
    expect(attempt.coverage).toEqual({
      mode: "parallel_external", selected_profiles: ["kimi/k3", "claude-code/opus"], selected_count: 2,
      valid_provider_count: 2, minimum_required: 2,
    });
    const semantic = JSON.parse(task.readRecord(result.resultRef));
    expect(semantic.provider_results.map(({ provider }) => provider)).toEqual(["claude-code/opus", "kimi/k3"]);
  });

  it("reuses an unchanged canonical pass without calling a provider", async () => {
    const { attachmentRoot, task } = fixture("simple-review-reuse-"); const calls = [];
    const providerClient = { run: async () => { calls.push(true); return { runtimeId: "runtime", provider: { provider: "kimi", status: "completed", session_id: "session", output: pass, error: null } }; } };
    const options = { task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) };
    const first = await runReviewFixture(options);
    const claimed = await runReviewFixture({ ...options, reuseUnavailable: true });
    expect(claimed).toMatchObject({ reused: true, attemptRef: first.attemptRef });
    expect(calls).toHaveLength(1);
    const second = await runReviewFixture(options);
    expect(second).toMatchObject({ reused: true, attemptRef: first.attemptRef, resultRef: first.resultRef });
    expect(calls).toHaveLength(1);
  });

  it("ignores run runner and audit metadata for reuse but never reuses a changed policy", async () => {
    const { attachmentRoot, task } = fixture("simple-review-policy-identity-");
    const calls = [];
    const requestIds = [];
    const policy = {
      source: "wh_review.v2",
      mode: "single_round",
      minimum_heterologous: 1,
      requested_profiles: ["kimi/coding"],
      eligible_profiles: ["kimi/coding"],
      same_source_exclusions: [],
      effective_profiles: [{
        provider: "kimi/coding",
        adapter: "kimi",
        model: "kimi-for-coding",
        effort: null,
        thinking: true,
      }],
      round: "initial",
    };
    const providerClient = {
      runGroup: async ({ requestId }) => {
        calls.push(true);
        requestIds.push(requestId);
        return {
          runtimeId: `runtime-${calls.length}`,
          providers: [{
            provider: "kimi/coding",
            status: "completed",
            session_id: `session-${calls.length}`,
            output: pass,
            error: null,
            execution: null,
          }],
        };
      },
    };
    const base = {
      task,
      attachmentRoot,
      taskId: "task",
      stage: "build-spec",
      materials: {},
      hostProvider: "codex",
      providers: ["kimi/coding"],
      reviewPolicy: policy,
      providerClient,
      captureSource: () => source,
      buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }),
    };
    const first = await runReviewFixture(base);
    const metadataOnly = await runReviewFixture({
      ...base,
      workflowRunId: "different-run",
      runnerOid: "f".repeat(40),
      auditSummaryRef: "evidence/audits/different.json",
    });
    expect(metadataOnly).toMatchObject({ reused: true, resultRef: first.resultRef });
    expect(calls).toHaveLength(1);

    const changedPolicy = {
      ...policy,
      effective_profiles: [{
        ...policy.effective_profiles[0],
        model: "kimi-for-coding-v2",
      }],
    };
    const second = await runReviewFixture({ ...base, reviewPolicy: changedPolicy });
    expect(second.resultRef).not.toBe(first.resultRef);
    expect(second).not.toHaveProperty("reused", true);
    expect(calls).toHaveLength(2);
    expect(requestIds[1]).not.toBe(requestIds[0]);
  });

  it("recovers a semantic attempt interrupted before its result and report publication", async () => {
    const { root, attachmentRoot, task } = fixture("simple-review-semantic-attempt-recovery-"); const calls = [];
    const providerClient = { runGroup: async () => { calls.push(true); return { runtimeId: "runtime", providers: [{ provider: "kimi", status: "completed", session_id: "session", output: pass, error: null, execution: null }] }; } };
    const options = { task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) };
    const first = await runReviewFixture(options);
    rmSync(join(root, "Projects", "Demo", "tasks", "task", first.resultRef));
    rmSync(join(root, "Projects", "Demo", "tasks", "task", first.reportRef));
    const recovered = await runReviewFixture(options);
    expect(recovered).toMatchObject({ reused: true, verdict: "pass", attemptRef: first.attemptRef, resultRef: first.resultRef, reportRef: first.reportRef });
    expect(calls).toHaveLength(1);
    expect(JSON.parse(task.readRecord(recovered.resultRef)).verdict).toBe("pass");
    expect(task.readRecord(recovered.reportRef)).toContain("# wh-review report");
  });

  it("persists and reuses a semantic review from a slash-bearing configured provider", async () => {
    const { task, attachmentRoot } = fixture("simple-review-provider-path-"); const provider = "antigravity/flash"; const calls = [];
    const providerClient = { run: async () => { calls.push(true); return { runtimeId: "runtime", provider: { provider, status: "completed", session_id: "session", output: pass, error: null } }; } };
    const options = { task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: [provider], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) };
    const first = await runReviewFixture(options);
    const attempt = JSON.parse(task.readRecord(first.attemptRef));
    const outputRef = attempt.provider_attempts[0].output_ref;
    expect(outputRef).toMatch(/^quality\/reviews\/attempts\/[^/]+\/providers\/p-[A-Za-z0-9_-]+\.output\.json$/);
    expect(JSON.parse(task.readRecord(outputRef)).provider).toBe(provider);
    expect(JSON.parse(task.readRecord(first.resultRef)).provider_results).toEqual([{ provider, output: JSON.parse(pass) }]);
    const reused = await runReviewFixture(options);
    expect(reused).toMatchObject({ reused: true, resultRef: first.resultRef });
    expect(calls).toHaveLength(1);
  });

  it("persists an unavailable attempt from a slash-bearing configured provider", async () => {
    const { task, attachmentRoot } = fixture("simple-review-provider-path-unavailable-"); const provider = "antigravity/flash";
    const providerClient = { run: async () => ({ runtimeId: "runtime", provider: { provider, status: "failed", session_id: null, output: null, error: { code: "AUTH", message: "login required" } } }) };
    const result = await runReviewFixture({ task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: [provider], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) });
    expect(result).toMatchObject({ status: "unavailable", resultRef: null });
    expect(JSON.parse(task.readRecord(result.attemptRef)).provider_attempts).toMatchObject([{ provider, status: "failed", output_ref: null }]);
  });

  it("keeps slash-bearing provider output references distinct across format correction", async () => {
    const { task, attachmentRoot } = fixture("simple-review-provider-path-correction-"); const provider = "antigravity/flash"; let calls = 0;
    const providerClient = { run: async () => {
      calls += 1;
      return { runtimeId: `runtime-${calls}`, provider: { provider, status: "completed", session_id: "session", output: calls === 1 ? "not JSON" : pass, error: null } };
    } };
    const result = await runReviewFixture({ task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: [provider], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) });
    const attempt = JSON.parse(task.readRecord(result.attemptRef));
    expect(attempt.provider_attempts.map(({ output_ref }) => output_ref)).toMatchObject([
      expect.stringMatching(/\/p-[A-Za-z0-9_-]+\.output\.json$/),
      expect.stringMatching(/\/p-[A-Za-z0-9_-]+-2\.output\.json$/)
    ]);
    for (const { output_ref } of attempt.provider_attempts) expect(JSON.parse(task.readRecord(output_ref)).provider).toBe(provider);
  });

  it("serializes concurrent reviews of the same frozen material and reuses the published pass", async () => {
    const { attachmentRoot, task } = fixture("simple-review-concurrent-reuse-"); const calls = [];
    let releaseFirst; let signalStarted;
    const firstStarted = new Promise((resolve) => { signalStarted = resolve; });
    const firstGate = new Promise((resolve) => { releaseFirst = resolve; });
    const dispatches = new Map();
    const providerClient = { runGroup: async ({ requestId }) => {
      calls.push(requestId);
      if (!dispatches.has(requestId)) {
        signalStarted();
        dispatches.set(requestId, firstGate.then(() => ({ runtimeId: "runtime", providers: [{ provider: "kimi", status: "completed", session_id: "session", output: pass, error: null, execution: null }] })));
      }
      return dispatches.get(requestId);
    } };
    const options = { task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) };
    const first = runReviewFixture(options);
    await firstStarted;
    const second = runReviewFixture({
      ...options,
      task: openTask(task.taskPath, task.identity),
      captureSource: () => source,
      buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }),
    });
    await new Promise((resolve) => setImmediate(resolve));
    expect(calls).toHaveLength(1);
    expect(new Set(calls).size).toBe(1);
    expect(dispatches.size).toBe(1);
    releaseFirst();
    const [published, reused] = await Promise.all([first, second]);
    expect(reused).toMatchObject({ reused: true, attemptRef: published.attemptRef, resultRef: published.resultRef });
    expect(dispatches.size).toBe(1);
  });

  it("reuses an unchanged canonical revise result without calling a provider", async () => {
    const { attachmentRoot, task } = fixture("simple-review-reuse-revise-"); const calls = [];
    const providerClient = { run: async () => { calls.push(true); return { runtimeId: "runtime", provider: { provider: "kimi", status: "completed", session_id: "session", output: revise, error: null } }; } };
    const options = { task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) };
    const first = await runReviewFixture(options);
    const second = await runReviewFixture(options);
    expect(second).toMatchObject({ reused: true, verdict: "revise_required", attemptRef: first.attemptRef, resultRef: first.resultRef });
    expect(calls).toHaveLength(1);
  });

  it("claims only an orphan unavailable attempt and never loops through flow-claimed attempts", async () => {
    const { attachmentRoot, task } = fixture("simple-review-reuse-unavailable-"); const calls = [];
    const providerClient = { run: async () => { calls.push(true); return { runtimeId: "runtime", provider: { provider: "kimi", status: "failed", session_id: null, output: null, error: { code: "AUTH", message: "no" } } }; } };
    const options = { task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) };
    const first = await runReviewFixture(options);
    const orphan = await runReviewFixture({
      ...options, reuseUnavailable: true, claimedUnavailableAttemptRefs: [],
    });
    expect(orphan).toMatchObject({
      status: "unavailable", verdict: null, resultRef: null,
      attemptRef: first.attemptRef, reused: true,
    });
    expect(calls).toHaveLength(1);
    const second = await runReviewFixture({
      ...options, reuseUnavailable: true, claimedUnavailableAttemptRefs: [first.attemptRef],
    });
    expect(second.attemptRef).not.toBe(first.attemptRef);
    expect(calls).toHaveLength(2);
    const third = await runReviewFixture({
      ...options, reuseUnavailable: true,
      claimedUnavailableAttemptRefs: [first.attemptRef, second.attemptRef],
    });
    expect(third).toMatchObject({ status: "unavailable", verdict: null, resultRef: null });
    expect(third.attemptRef).not.toBe(first.attemptRef);
    expect(third.attemptRef).not.toBe(second.attemptRef);
    expect(calls).toHaveLength(3);
  });

  it("uses a new managed request identity after an unavailable group attempt", async () => {
    const { attachmentRoot, task } = fixture("simple-review-group-retry-unavailable-"); const requestIds = [];
    const providerClient = { runGroup: async ({ requestId }) => {
      requestIds.push(requestId);
      const unavailable = requestIds.length === 1;
      return { runtimeId: `runtime-${requestIds.length}`, providers: [{
        provider: "kimi", status: unavailable ? "failed" : "completed", session_id: unavailable ? null : "session",
        output: unavailable ? null : pass, error: unavailable ? { code: "CANCELLED", message: "cancelled" } : null, execution: null,
      }] };
    } };
    const options = { task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) };
    const unavailable = await runReviewFixture(options);
    const semantic = await runReviewFixture(options);
    expect(unavailable).toMatchObject({ status: "unavailable", resultRef: null });
    expect(semantic).toMatchObject({ status: "semantic", verdict: "pass" });
    expect(requestIds).toHaveLength(2);
    expect(requestIds[1]).not.toBe(requestIds[0]);
  });

  it("accepts a later semantic result after an unchanged unavailable attempt", async () => {
    const { attachmentRoot, task } = fixture("simple-review-retry-after-unavailable-"); let calls = 0;
    const providerClient = { run: async () => {
      calls += 1;
      return calls === 1
        ? { runtimeId: "runtime-1", provider: { provider: "kimi", status: "failed", session_id: null, output: null, error: { code: "AUTH", message: "not ready" } } }
        : { runtimeId: "runtime-2", provider: { provider: "kimi", status: "completed", session_id: "session", output: pass, error: null } };
    } };
    const options = { task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) };
    const unavailable = await runReviewFixture(options);
    const semantic = await runReviewFixture(options);
    expect(unavailable).toMatchObject({ status: "unavailable", resultRef: null });
    expect(semantic).toMatchObject({ status: "semantic", verdict: "pass" });
    expect(semantic.attemptRef).not.toBe(unavailable.attemptRef);
    expect(calls).toBe(2);
  });

  it("fails loudly without a provider call when an unavailable attempt was changed", async () => {
    const { root, attachmentRoot, task } = fixture("simple-review-unavailable-tamper-"); const calls = [];
    const providerClient = { run: async () => { calls.push(true); return { runtimeId: "runtime", provider: { provider: "kimi", status: "failed", session_id: null, output: null, error: { code: "AUTH", message: "no" } } }; } };
    const options = { task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) };
    const first = await runReviewFixture(options);
    const attemptPath = join(root, "Projects", "Demo", "tasks", "task", first.attemptRef);
    const attempt = JSON.parse(readFileSync(attemptPath, "utf8"));
    attempt.attempt_id = "other-attempt";
    writeFileSync(attemptPath, `${JSON.stringify(attempt, null, 2)}\n`);

    await expect(runReviewFixture(options)).rejects.toThrow(/REVIEW_EVIDENCE_INVALID/);
    expect(calls).toHaveLength(1);
  });

  it("fails loudly without another provider call when unavailable output was changed", async () => {
    const { root, attachmentRoot, task } = fixture("simple-review-unavailable-output-tamper-"); const calls = [];
    const providerClient = { run: async () => { calls.push(true); return { runtimeId: "runtime", provider: { provider: "kimi", status: "completed", session_id: "session", output: "not json", error: null } }; } };
    const options = { task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) };
    const first = await runReviewFixture(options);
    const attempt = JSON.parse(task.readRecord(first.attemptRef));
    const outputPath = join(root, "Projects", "Demo", "tasks", "task", attempt.provider_attempts[0].output_ref);
    const output = JSON.parse(readFileSync(outputPath, "utf8"));
    output.content = "changed";
    writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);

    await expect(runReviewFixture(options)).rejects.toThrow(/REVIEW_EVIDENCE_INVALID/);
    expect(calls).toHaveLength(2);
  });

  it("rejects an unavailable attempt whose provider evidence is actually semantic", async () => {
    const { root, attachmentRoot, task } = fixture("simple-review-unavailable-semantic-"); const calls = [];
    const providerClient = { run: async () => { calls.push(true); return { runtimeId: "runtime", provider: { provider: "kimi", status: "completed", session_id: "session", output: "not json", error: null } }; } };
    const options = { task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) };
    const first = await runReviewFixture(options);
    const attempt = JSON.parse(task.readRecord(first.attemptRef));
    const finalProviderAttempt = attempt.provider_attempts.at(-1);
    const outputPath = join(root, "Projects", "Demo", "tasks", "task", finalProviderAttempt.output_ref);
    const output = JSON.parse(readFileSync(outputPath, "utf8"));
    output.content = pass;
    output.content_hash = createHash("sha256").update(pass).digest("hex");
    writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
    finalProviderAttempt.status = "completed";
    finalProviderAttempt.error = null;
    const attemptPath = join(root, "Projects", "Demo", "tasks", "task", first.attemptRef);
    writeFileSync(attemptPath, `${JSON.stringify(attempt, null, 2)}\n`);

    await expect(runReviewFixture(options)).rejects.toThrow(/REVIEW_EVIDENCE_INVALID/);
    expect(calls).toHaveLength(2);
  });

  it("serializes concurrent revise reviews and invokes the provider exactly once", async () => {
    const { attachmentRoot, task } = fixture("simple-review-concurrent-revise-"); const calls = [];
    let releaseFirst; let signalStarted;
    const firstStarted = new Promise((resolve) => { signalStarted = resolve; });
    const firstGate = new Promise((resolve) => { releaseFirst = resolve; });
    const dispatches = new Map();
    const providerClient = { runGroup: async ({ requestId }) => {
      calls.push(requestId);
      if (!dispatches.has(requestId)) {
        signalStarted();
        dispatches.set(requestId, firstGate.then(() => ({ runtimeId: "runtime", providers: [{ provider: "kimi", status: "completed", session_id: "session", output: revise, error: null, execution: null }] })));
      }
      return dispatches.get(requestId);
    } };
    const options = { task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) };
    const first = runReviewFixture(options);
    await firstStarted;
    const second = runReviewFixture({
      ...options,
      task: openTask(task.taskPath, task.identity),
      captureSource: () => source,
      buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }),
    });
    await new Promise((resolve) => setImmediate(resolve));
    expect(calls).toHaveLength(1);
    expect(new Set(calls).size).toBe(1);
    expect(dispatches.size).toBe(1);
    releaseFirst();
    const [published, reused] = await Promise.all([first, second]);
    expect(reused).toMatchObject({ reused: true, verdict: "revise_required", attemptRef: published.attemptRef, resultRef: published.resultRef });
    expect(dispatches.size).toBe(1);
  });

  it("reuses same-snapshot results but re-reviews a changed build-code integration snapshot", async () => {
    const { attachmentRoot, task } = fixture("simple-review-reuse-change-"); const calls = [];
    const providerClient = { run: async () => { calls.push(true); return { runtimeId: "runtime", provider: { provider: "kimi", status: "completed", session_id: "session", output: pass, error: null } }; } };
    const base = { task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient };
    await runReviewFixture({ ...base, captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) });
    await runReviewFixture({ ...base, captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId: "b".repeat(64), manifest: [] }) });
    await runReviewFixture({ ...base, captureSource: () => ({ ...source, snapshotTree: "6".repeat(40) }), buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) });
    expect(calls, "same-snapshot retries reuse; a changed integration snapshot requires a fresh review").toHaveLength(2);
  });

  it("fails loudly without a provider call when canonical aggregation was changed", async () => {
    const { root, attachmentRoot, task } = fixture("simple-review-reuse-tamper-"); const calls = [];
    const providerClient = { run: async () => { calls.push(true); return { runtimeId: "runtime", provider: { provider: "kimi", status: "completed", session_id: "session", output: pass, error: null } }; } };
    const options = { task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) };
    const first = await runReviewFixture(options);
    const resultPath = join(root, "Projects", "Demo", "tasks", "task", first.resultRef);
    const changed = JSON.parse(readFileSync(resultPath, "utf8"));
    changed.findings = [{ provider: "kimi", severity: "major", path: "fake", issue: "tampered", recommendation: "ignore" }];
    writeFileSync(resultPath, `${JSON.stringify(changed, null, 2)}\n`);
    await expect(runReviewFixture(options)).rejects.toThrow(/REVIEW_EVIDENCE_INVALID/);
    expect(calls).toHaveLength(1);
  });

  it.each([
    ["attempt identity", ({ attempt }) => { attempt.attempt_id = "other-attempt"; }],
    ["duplicate provider", ({ result }) => { result.provider_results.push(structuredClone(result.provider_results[0])); }],
    ["provider output ownership", ({ attempt }) => { attempt.provider_attempts[0].output_ref = "reviews/attempts/other-attempt/providers/kimi.output.json"; }],
  ])("fails loudly without a provider call for invalid %s", async (_label, mutate) => {
    const { root, attachmentRoot, task } = fixture("simple-review-reuse-invalid-"); const calls = [];
    const providerClient = { run: async () => { calls.push(true); return { runtimeId: "runtime", provider: { provider: "kimi", status: "completed", session_id: "session", output: pass, error: null } }; } };
    const options = { task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) };
    const first = await runReviewFixture(options);
    const taskRoot = join(root, "Projects", "Demo", "tasks", "task");
    const resultPath = join(taskRoot, first.resultRef), attemptPath = join(taskRoot, first.attemptRef);
    const result = JSON.parse(readFileSync(resultPath, "utf8")), attempt = JSON.parse(readFileSync(attemptPath, "utf8"));
    mutate({ result, attempt });
    writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`);
    writeFileSync(attemptPath, `${JSON.stringify(attempt, null, 2)}\n`);
    await expect(runReviewFixture(options)).rejects.toThrow(/REVIEW_EVIDENCE_INVALID/);
    expect(calls).toHaveLength(1);
  });

  it("does not reuse a semantic worktree result across snapshot trees", async () => {
    const { attachmentRoot, task } = fixture("simple-review-worktree-snapshot-reuse-");
    const calls = [];
    const providerClient = {
      run: async () => {
        calls.push(true);
        return { runtimeId: "runtime", provider: { provider: "kimi", status: "completed", session_id: "session", output: pass, error: null } };
      },
    };
    const base = {
      task,
      attachmentRoot,
      taskId: "task",
      stage: "build-spec",
      materials: {},
      hostProvider: "codex",
      providers: ["kimi"],
      providerClient,
      buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }),
    };
    const first = await runReviewFixture({
      ...base,
      captureSource: () => ({ ...source, snapshotTree: "7".repeat(40) }),
    });
    const second = await runReviewFixture({
      ...base,
      captureSource: () => ({ ...source, snapshotTree: "8".repeat(40) }),
    });
    expect(calls).toHaveLength(2);
    expect(second.reused).not.toBe(true);
    expect(second.snapshotTree).toBe("8".repeat(40));
    expect(second.resultRef).not.toBe(first.resultRef);
  });

  it("never calls a provider when source capture reports mutation", async () => {
    const { attachmentRoot, task } = fixture("simple-review-source-mutated-"); const calls = [];
    await expect(runReviewFixture({ task, attachmentRoot, taskId: "task", stage: "verify-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient: { run: async (request) => { calls.push(request); } }, captureSource: () => { throw new Error("SOURCE_CHANGED_DURING_CAPTURE"); } })).rejects.toThrow(/SOURCE_CHANGED_DURING_CAPTURE/);
    expect(calls).toHaveLength(0);
  });

  it.each([
    ["empty material", "MATERIAL_INCOMPLETE: review input is empty"],
    ["missing map", "MATERIAL_INCOMPLETE: acceptance map is missing"],
    ["invalid anchor", "MATERIAL_FORBIDDEN: evidence anchor is outside the sealed material"],
  ])("records local %s failure before provider dispatch", async (_label, message) => {
    const { attachmentRoot, task } = fixture("simple-review-local-preflight-");
    const calls = [];
    const outcome = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "verify-code", materials: {},
      hostProvider: "codex", providers: ["kimi"],
      providerClient: { run: async (request) => { calls.push(request); throw new Error("provider must not run"); } },
      captureSource: () => source,
      buildMaterials: () => { throw new Error(message); },
    });
    expect(calls).toHaveLength(0);
    expect(outcome).toMatchObject({ status: "unavailable", resultRef: null, runtimeIds: {} });
    const attempt = JSON.parse(task.readRecord(outcome.attemptRef));
    expect(attempt).toMatchObject({
      provider_attempts: [],
      terminal_status: "unavailable",
      error: { code: message.split(":")[0] },
    });
  });

  it("guards an empty code-stage skill plan before the provider fan-out", () => {
    const materialsSource = readFileSync(join(import.meta.dirname, "..", "review-materials.mjs"), "utf8");
    expect(materialsSource).toMatch(/\["build-code",\s*"verify-code"\][\s\S]*required_skills[\s\S]*length === 0[\s\S]*MATERIAL_INCOMPLETE/);
    const runnerSource = readFileSync(join(import.meta.dirname, "..", "review-runner.mjs"), "utf8");
    expect(runnerSource.indexOf("reviewInstructionsFor(stage")).toBeLessThan(runnerSource.indexOf("rejectProfileMismatches(await reviewGroup"));
  });

  it("authenticates a real provider revise result without turning it into a stage gate", async () => {
    const { attachmentRoot, task } = fixture("simple-review-provider-revise-");
    const result = await runReviewFixture({ task, attachmentRoot, taskId: "task", stage: "verify-code", materials: {}, hostProvider: "codex", providers: ["kimi"],
      providerClient: { run: async () => ({ runtimeId: "runtime", provider: { provider: "kimi", status: "completed", session_id: "session", output: revise, error: null } }) },
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) });
    expect(result).toMatchObject({ status: "semantic", verdict: "revise_required" });
    expect(verifyFinal({ task, resultRef: result.resultRef, attachmentRoot, captureSource: () => source }))
      .toEqual({ status: "finalized", snapshotTree: source.snapshotTree });
  });

  it("requires branded CandidateWorkspace for make-decision direction review", async () => {
    const { root, attachmentRoot, task } = fixture("simple-review-candidate-");
    const repo = join(root, "repo"); mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
    const candidateWorkspace = prepareTaskWorkspace(task);
    const options = { task, attachmentRoot, taskId: "task", stage: "make-decision", reviewTrack: "direction", hostProvider: "codex", providers: ["kimi"],
      providerClient: { runGroup: async ({ providers }) => ({ runtimeId: "r", providers: providers.map((provider) => ({ provider, status: "completed", session_id: "s", output: pass, error: null, execution: null })) }) },
      captureSource: ({ sourceRoot, targetRepoRoot }) => { expect(sourceRoot).toBe(candidateWorkspace.worktreeRoot); expect(targetRepoRoot).toBe(realpathSync(repo)); return source; },
      buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) };
    await expect(runReview({ ...options, sourceRoot: repo })).rejects.toThrow(/naked|CandidateWorkspace|forbid/i);
    await expect(runReview({ ...options, candidateWorkspace })).resolves.toMatchObject({ status: "semantic", verdict: "pass" });
    await expect(runReview({
      ...options, reviewTrack: "detail", candidateWorkspace,
      providerClient: { run: async () => ({ runtimeId: "legacy", provider: { provider: "kimi", status: "completed", session_id: "s", output: pass, error: null } }) },
    })).rejects.toThrow(/runGroup is required/);
    const detail = {
      ...options,
      reviewTrack: "detail",
      providers: ["kimi", "opencode"],
      providerClient: { runGroup: async ({ providers }) => ({ runtimeId: "r-detail", providers: providers.map((provider) => ({ provider, status: "completed", session_id: `s-${provider}`, output: pass, error: null, execution: null })) }) },
    };
    await expect(runReview({ ...detail, sourceRoot: repo })).rejects.toThrow(/naked|CandidateWorkspace|forbid/i);
    await expect(runReview({ ...detail, candidateWorkspace })).resolves.toMatchObject({ status: "semantic", verdict: "pass" });
  });
  it("rejects a forged or wrong-worktree Workspace capability", async () => {
    const { attachmentRoot, task } = fixture("simple-review-wrong-worktree-");
    const providerClient = { run: async () => ({ runtimeId: "r", provider: { provider: "kimi", status: "completed", session_id: "s", output: pass, error: null } }) };
    await expect(runReview({ task, workspace: { worktreeRoot: "/wrong" }, attachmentRoot, taskId: "task", stage: "build-code", hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) })).rejects.toThrow(/Workspace|worktree|capability/i);
  });
  it("uses only an authentic Workspace for full worktree capture", async () => {
    const { root, attachmentRoot, task } = fixture("simple-review-workspace-");
    const repo = join(root, "repo"); mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
    const candidate = prepareTaskWorkspace(task);
    const workspace = openAcceptedWorkspace(task, { facts: { worktree_root: candidate.worktreeRoot, baseline_commit: candidate.baselineCommit } });
    const options = { task, workspace, attachmentRoot, taskId: "task", stage: "verify-code", materials: {}, hostProvider: "codex", providers: ["kimi"],
      providerClient: { runGroup: async ({ providers }) => ({ runtimeId: "r", providers: providers.map((provider) => ({ provider, status: "completed", session_id: "s", output: pass, error: null, execution: null })) }) },
      captureSource: (input) => { expect(input).toMatchObject({ workspace, reviewDataRoot: attachmentRoot }); expect(input.sourceRoot).toBeUndefined(); expect(input.targetRepoRoot).toBeUndefined(); return source; },
      buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) };
    await expect(runReview(options)).resolves.toMatchObject({ status: "semantic", verdict: "pass" });
    await expect(runReview({ ...options, sourceRoot: repo })).rejects.toThrow(/naked|Workspace/i);
  });
  it("re-captures verify-final from the same Workspace baseline and rejects target drift", async () => {
    const { root, attachmentRoot, task } = fixture("simple-review-final-workspace-");
    const repo = join(root, "repo"); mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
    const candidate = prepareTaskWorkspace(task);
    const workspace = openAcceptedWorkspace(task, { facts: { worktree_root: candidate.worktreeRoot, baseline_commit: candidate.baselineCommit } });
    const providerClient = { runGroup: async ({ providers }) => ({ runtimeId: "r", providers: providers.map((provider) => ({ provider, status: "completed", session_id: "s", output: pass, error: null, execution: null })) }) };
    const run = await runReview({ task, workspace, attachmentRoot, taskId: "task", stage: "verify-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) });
    expect(verifyFinal({ resultRef: run.resultRef, task, workspace, attachmentRoot, taskId: "task", stage: "verify-code", reviewTrack: null })).toMatchObject({ status: "finalized" });
    writeFileSync(join(repo, "target-drift.txt"), "drift\n");
    execFileSync("git", ["add", "-A"], { cwd: repo }); execFileSync("git", ["commit", "-qm", "target drift"], { cwd: repo });
    expect(() => verifyFinal({ resultRef: run.resultRef, task, workspace, attachmentRoot })).toThrow(/WORKTREE_CHANGED_AFTER_REVIEW/);
  });
  it("uses revise > unavailable > pass independent of completion order", () => {
    const validPass = { provider: "a", review: JSON.parse(pass) }; const validRevise = { provider: "b", review: JSON.parse(revise) };
    expect(aggregateProviderResults([validPass, validRevise], 2).verdict).toBe("revise_required");
    expect(aggregateProviderResults([validPass], 2).status).toBe("unavailable");
    expect(aggregateProviderResults([validPass], 1).verdict).toBe("pass");
  });

  it("does not let one actionable provider bypass the configured quorum", () => {
    const result = aggregateProviderResults([{ provider: "kimi/k3", review: JSON.parse(revise) }], 2);
    expect(result).toMatchObject({ status: "unavailable", verdict: null, valid: [{ provider: "kimi/k3" }] });
  });

  it("corrects format once in-session, writes one terminal attempt, then one semantic result", async () => {
    const { attachmentRoot, task } = fixture("simple-review-runner-"); const calls = [];
    const providerClient = { run: async (request) => { calls.push(request); return calls.length === 1
      ? { runtimeId: "runtime", provider: { provider: "kimi", status: "completed", session_id: "session", output: "preface without json", error: null } }
      : { runtimeId: "runtime", provider: { provider: "kimi", status: "completed", session_id: "session", output: pass, error: null } }; } };
    const result = await runReviewFixture({ task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) });
    expect(result.status).toBe("semantic"); expect(result.verdict).toBe("pass"); expect(calls).toHaveLength(2); expect(calls[1].continuationRuntimeId).toBe("runtime");
    const attempt = JSON.parse(task.readRecord(result.attemptRef)); expect(attempt.terminal_status).toBe("semantic"); expect(attempt.provider_attempts).toHaveLength(2);
    expect(JSON.parse(task.readRecord(attempt.provider_attempts[0].output_ref)).content).toBe("preface without json");
    expect(JSON.parse(task.readRecord(attempt.provider_attempts[1].output_ref)).content).toBe(pass);
    expect(JSON.parse(task.readRecord(result.resultRef)).verdict).toBe("pass");
  });

  it("tells file-only reviewers to read the sealed bundle path", async () => {
    const { attachmentRoot, task } = fixture("simple-review-bundle-prompt-"); const calls = [];
    const providerClient = { run: async (request) => {
      calls.push(request);
      return { runtimeId: "runtime", provider: { provider: "kimi", status: "completed", session_id: "session", output: pass, error: null } };
    } };
    await runReviewFixture({ task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) });
    expect(calls).toHaveLength(1);
    expect(calls[0].prompt).toBe("Read bundle/review-instructions.md and the complete frozen bundle. Return the requested JSON object only.");
  });

  it("records OUTPUT_INVALID on the final provider attempt after correction fails", async () => {
    const { attachmentRoot, task } = fixture("simple-review-format-failed-");
    const providerClient = { run: async () => ({ runtimeId: "runtime", provider: { provider: "kimi", status: "completed", session_id: "session", output: "not json", error: null } }) };
    const result = await runReviewFixture({ task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) });
    const attempt = JSON.parse(task.readRecord(result.attemptRef));
    expect(attempt.provider_attempts).toHaveLength(2);
    expect(attempt.provider_attempts[1]).toMatchObject({ status: "failed", error: { code: "OUTPUT_INVALID" } });
    expect(attempt.provider_attempts[1].output_ref).not.toBe(null);
    expect(result.resultRef).toBe(null);
  });

  it("fresh-runs once only for an unavailable continuation", async () => {
    const { attachmentRoot, task } = fixture("simple-review-fresh-"); const calls = [];
    const providerClient = { run: async (request) => { calls.push(request); return calls.length === 1
      ? { runtimeId: "old", provider: { provider: "opencode", status: "failed", session_id: null, output: null, error: { code: "NO_CONTINUABLE_SESSION", message: "gone" } } }
      : { runtimeId: "new", provider: { provider: "opencode", status: "completed", session_id: "s", output: pass, error: null } }; } };
    const result = await runReviewFixture({ task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["opencode"], previousRuntimeIds: { opencode: "old" }, providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) });
    expect(result.verdict).toBe("pass"); expect(calls.map((item) => item.continuationRuntimeId)).toEqual(["old", null]);
    expect(result.runtimeIds).toEqual({ opencode: "new" });
  });

  it("routes continuation runtimes per provider and rejects invalid provider lists", async () => {
    const { attachmentRoot, task } = fixture("simple-review-routing-"); const calls = [];
    const providerClient = { run: async (request) => { calls.push(request); return { runtimeId: `new-${request.provider}`, provider: { provider: request.provider, status: "completed", session_id: "s", output: pass, error: null } }; } };
    const base = { task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) };
    const result = await runReviewFixture({ ...base, providers: ["kimi", "opencode"], previousRuntimeIds: { kimi: "old-k", opencode: "old-o" } });
    expect(calls.map(({ provider, continuationRuntimeId }) => [provider, continuationRuntimeId]).sort()).toEqual([["kimi", "old-k"], ["opencode", "old-o"]]);
    expect(result.runtimeIds).toEqual({ kimi: "new-kimi", opencode: "new-opencode" });
    await expect(runReviewFixture({ ...base, providers: ["kimi", "kimi"] })).rejects.toThrow(/unique/);
    await expect(runReviewFixture({ ...base, providers: ["codex"] })).rejects.toThrow(/differ/);
  });

  it("writes no result when valid reviewers are insufficient", async () => {
    const { attachmentRoot, task } = fixture("simple-review-unavailable-"); const providerClient = { run: async () => ({ runtimeId: "r", provider: { provider: "kimi", status: "failed", session_id: null, output: null, error: { code: "AUTH", message: "no" } } }) };
    const result = await runReviewFixture({ task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) });
    expect(result.status).toBe("unavailable"); expect(result.resultRef).toBe(null);
    const attempt = JSON.parse(task.readRecord(result.attemptRef)); expect(attempt.provider_attempts[0].output_ref).toBe(null);
  });

  it("keeps a material delivery mismatch outside semantic results", async () => {
    const { attachmentRoot, task } = fixture("simple-review-material-mismatch-");
    const providerClient = { run: async () => { const error = new Error("different material"); error.code = "MATERIAL_INCOMPLETE"; throw error; } };
    const result = await runReviewFixture({ task, attachmentRoot, taskId: "task", stage: "build-code", materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }) });
    expect(result.status).toBe("unavailable"); expect(result.resultRef).toBe(null);
    expect(JSON.parse(task.readRecord(result.attemptRef)).error.code).toBe("MATERIAL_INCOMPLETE");
  });
});

describe("verify final", () => {
  it("uses the verified integration checkpoint instead of the raw Workspace baseline", () => {
    const result = {
      stage: "build-code", review_scope: "integration", subject_kind: "worktree",
      base_commit: "a".repeat(40), base_tree: "b".repeat(40), candidate_tree: "c".repeat(40), snapshot_tree: "c".repeat(40),
      source: { target_commit: "d".repeat(40), base_commit: "a".repeat(40), base_tree: "b".repeat(40), captured_head: "e".repeat(40) },
    };
    const current = { baseCommit: "f".repeat(40), baseTree: "f".repeat(40), snapshotTree: "c".repeat(40), targetCommit: "d".repeat(40), capturedHead: "e".repeat(40) };
    expect(verifyFinalSubject({ result, current, integrationSubject: { base_commit: "a".repeat(40), base_tree: "b".repeat(40), snapshot_tree: "c".repeat(40) } })).toEqual({ status: "finalized", snapshotTree: "c".repeat(40) });
    expect(() => verifyFinalSubject({ result, current, integrationSubject: { base_commit: "a".repeat(40), base_tree: "9".repeat(40), snapshot_tree: "c".repeat(40) } })).toThrow(/WORKTREE_CHANGED_AFTER_REVIEW/);
  });

  it("rejects a legacy build-code result without integration scope", () => {
    const { attachmentRoot, task } = fixture("simple-review-legacy-final-");
    const resultRef = "quality/reviews/results/legacy-worktree.json";
    const legacy = {
      version: "wh-review-result.v1", task_id: "task", stage: "build-code", review_track: null,
      source: { target_commit: source.targetCommit, base_commit: source.baseCommit, base_tree: source.baseTree, captured_head: source.capturedHead },
      snapshot_tree: source.snapshotTree, material_id: materialId, attempt_ref: "quality/reviews/attempts/legacy/attempt.json",
      provider_results: [{ provider: "kimi", output: JSON.parse(pass) }], verdict: "pass", findings: []
    };
    createTaskKernel(task).publishCanonicalRecord(resultRef, Buffer.from(`${JSON.stringify(legacy)}\n`));
    expect(() => verifyFinal({ resultRef, task, attachmentRoot, captureSource: () => source })).toThrow(/INTEGRATION_RESULT_REQUIRED/);
  });

  it("accepts the same full snapshot and rejects drift", async () => {
    const { attachmentRoot, task } = fixture("simple-review-final-");
    const providerClient={run:async()=>({runtimeId:"runtime",provider:{provider:"kimi",status:"completed",session_id:"session",output:pass,error:null}})};
    const run=await runReviewFixture({task,attachmentRoot,taskId:"task",stage:"build-code",materials:{},hostProvider:"codex",providers:["kimi"],providerClient,captureSource:()=>source,buildMaterials:()=>({bundleRoot:attachmentRoot,materialId,manifest:[]})});
    const resultRef=run.resultRef;
    expect(run.reviewScope).toBe("integration");
    expect(JSON.parse(task.readRecord(run.resultRef)).review_scope).toBe("integration");
    expect(verifyFinal({ resultRef, task, attachmentRoot, taskId: "task", stage: "build-code", reviewTrack: null, captureSource: () => source })).toEqual({ status: "finalized", snapshotTree: source.snapshotTree });
    expect(() => verifyFinal({ resultRef, task, attachmentRoot, captureSource: () => ({ ...source, targetCommit: "9".repeat(40) }) })).toThrow(/WORKTREE_CHANGED_AFTER_REVIEW/);
    expect(() => verifyFinal({ resultRef: "outside.json", task, attachmentRoot, captureSource: () => source })).toThrow(/RESULT_REF_INVALID/);
    const reviseCalls=[]; const reviseClient={run:async()=>{reviseCalls.push(true); return {runtimeId:"runtime",provider:{provider:"kimi",status:"completed",session_id:"session",output:revise,error:null}};}};
    const revised=await runReviewFixture({task,attachmentRoot,taskId:"task",stage:"build-code",materials:{},hostProvider:"codex",providers:["kimi"],providerClient:reviseClient,captureSource:()=>source,buildMaterials:()=>({bundleRoot:attachmentRoot,materialId,manifest:[]})});
    expect(revised).toMatchObject({ reused: true, resultRef });
    expect(reviseCalls).toHaveLength(0);
    expect(verifyFinal({ resultRef:revised.resultRef, task, attachmentRoot, captureSource: () => source })).toEqual({ status: "finalized", snapshotTree: source.snapshotTree });
  });

  it("finalizes a same-snapshot integration revise_required result without rewriting its verdict", async () => {
    const { attachmentRoot, task } = fixture("simple-review-final-revise-");
    const providerClient = {
      run: async () => ({
        runtimeId: "runtime",
        provider: {
          provider: "kimi", status: "completed", session_id: "session",
          output: revise, error: null,
        },
      }),
    };
    const run = await runReviewFixture({
      task, attachmentRoot, taskId: "task", stage: "build-code",
      materials: {}, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source,
      buildMaterials: () => ({ bundleRoot: attachmentRoot, materialId, manifest: [] }),
    });
    expect(run).toMatchObject({ verdict: "revise_required", reviewScope: "integration" });
    expect(verifyFinal({
      resultRef: run.resultRef,
      task,
      attachmentRoot,
      taskId: "task",
      stage: "build-code",
      reviewTrack: null,
      captureSource: () => source,
    })).toEqual({ status: "finalized", snapshotTree: source.snapshotTree });
    expect(JSON.parse(task.readRecord(run.resultRef)).verdict).toBe("revise_required");
  });
});
