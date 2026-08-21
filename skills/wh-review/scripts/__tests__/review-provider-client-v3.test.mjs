import { expect, test } from "vitest";
import { ReviewProviderClient } from "../review-provider-client.mjs";

const member = (provider, adapter = provider.split("/", 1)[0], status = "completed") => ({
  attempts: [{
    attempt_id: `${provider}-attempt-1`, completed_at_ms: 20, duration_ms: 10,
    error: status === "completed" ? null : { code: "PROCESS_DEAD", message: "dead" },
    kind: "initial", provider_retry_count: 0, session_id: null, started_at_ms: 10, status,
  }],
  continuable: false,
  deadline_ms: null,
  error: status === "completed" ? null : { code: "PROCESS_DEAD", message: "dead" },
  identity: { adapter, config_id: `${provider}-config`, model: null, provider, source_id: `${provider}-source` },
  material: { contract_hash: "contract-hash", contract_id: "contract-id", material_id: "material-id", semantic_hash: "semantic-hash" },
  output: status === "completed" ? "{\"findings\":[]}" : null,
  provenance: { raw_output_sha256: null, raw_stderr_sha256: null, runtime_id: "runtime-v3" },
  recovery: { fresh_execution_retry_count: 0, provider_internal_retry_count: 0, same_session_repair_count: 0 },
  result_protocol: "workflowhub-result.v3",
  session_id: null,
  status,
  timing: { completed_at_ms: 20, duration_ms: 10, started_at_ms: 10 },
  usage: null,
});

function group(providers = ["opencode/v4flash", "codex/luna"]) {
  return {
    host_provider: "codex/terra",
    material_id: "material-id",
    outcome: "completed",
    providers: providers.map((provider) => member(provider)),
    round: 1,
    runtime_id: "runtime-v3",
    selected_tier: null,
    version: "workflowhub-result.v3",
  };
}

function materials() {
  return { bundleRoot: "/tmp/bundle", attachmentRoot: "/tmp/attachments", materialId: "material-id", sourcePrefix: ".wh-review-packets", deliveryManifest: [] };
}

test("client marks every attachment for codex always_embed delivery", async () => {
  const calls = [];
  const client = new ReviewProviderClient({ invoke: async (value) => {
    calls.push(value);
    return { exitCode: 0, stdout: `${JSON.stringify(group(["codex/luna"]))}\n`, stderr: "" };
  } });
  await client.runGroup({
    hostProvider: "codex/terra",
    providers: ["codex/luna"],
    materials: { ...materials(), deliveryManifest: [{ path: "subject.md", bytes: 12, sha256: "a".repeat(64) }] },
    attachmentDelivery: "always_embed",
    prompt: "review",
  });
  expect(calls[0].attachmentDelivery).toBe("always_embed");
  expect(calls[0].attachments.entries[0].embed).toBe(true);
});

test("client defaults to negotiated delivery so each provider gets its supported mode", async () => {
  const calls = [];
  const client = new ReviewProviderClient({ invoke: async (value) => {
    calls.push(value);
    return { exitCode: 0, stdout: `${JSON.stringify(group(["codex/luna"]))}\n`, stderr: "" };
  } });
  await client.runGroup({ hostProvider: "codex/terra", providers: ["codex/luna"], materials: materials(), prompt: "review" });
  expect(calls[0].attachmentDelivery).toBe("negotiated");
  expect(calls[0].attachments.entries.every((entry) => entry.embed === false)).toBe(true);
});

test("client negotiates attachment delivery for mixed provider groups", async () => {
  const calls = [];
  const client = new ReviewProviderClient({ invoke: async (value) => {
    calls.push(value);
    return { exitCode: 0, stdout: `${JSON.stringify(group(["kimi/coding", "antigravity/flash", "codex/luna"]))}\n`, stderr: "" };
  } });
  await client.runGroup({
    hostProvider: "codex/terra",
    providers: ["kimi/coding", "antigravity/flash", "codex/luna"],
    materials: { ...materials(), deliveryManifest: [{ path: "subject.md", bytes: 12, sha256: "a".repeat(64) }] },
    prompt: "review",
  });
  expect(calls[0].attachmentDelivery).toBe("negotiated");
  expect(calls[0].attachments.entries[0].embed).toBe(false);
});

test("client negotiates workflowhub-result.v3 and preserves one member per configured profile", async () => {
  const calls = [];
  const client = new ReviewProviderClient({ invoke: async (value) => {
    calls.push(value);
    return { exitCode: 0, stdout: `${JSON.stringify(group())}\n`, stderr: "" };
  } });
  const result = await client.runGroup({ hostProvider: "codex/terra", providers: ["opencode/v4flash", "codex/luna"], materials: materials(), prompt: "review" });
  expect(calls).toHaveLength(1);
  expect(calls[0].request.required_result_protocol).toBe("workflowhub-result.v3");
  expect(calls[0].attachmentDelivery).toBe("negotiated");
  expect(result.providers.map((item) => item.provider)).toEqual(["opencode/v4flash", "codex/luna"]);
  expect(result.providers[0].result_protocol).toBe("workflowhub-result.v3");
  expect(result.providers[0].identity.config_id).toBe("opencode/v4flash-config");
  expect(result.providers[0].recovery.same_session_repair_count).toBe(0);
  expect(result.providers[0].execution.deadline_ms).toBeNull();
  expect(result.providers[0].execution.recovery).toEqual(result.providers[0].recovery);
});

test("client rejects a positive provider deadline in a public v3 result", async () => {
  const value = group(["opencode/v4flash"]);
  value.providers[0].deadline_ms = 5_000;
  const client = new ReviewProviderClient({ invoke: async () => ({ exitCode: 0, stdout: `${JSON.stringify(value)}\n`, stderr: "" }) });
  await expect(client.runGroup({ hostProvider: "codex/terra", providers: ["opencode/v4flash"], materials: materials(), prompt: "review" }))
    .rejects.toMatchObject({ code: "PROTOCOL_INCOMPATIBLE" });
});

test("client rejects a direction flow that exposes the choice before the reveal boundary", async () => {
  const calls = [];
  const client = new ReviewProviderClient({ invoke: async (value) => {
    calls.push(value);
    return { exitCode: 0, stdout: `${JSON.stringify(group(["opencode/v4flash"]))}\n`, stderr: "" };
  } });
  await expect(client.runGroup({
    hostProvider: "codex/terra",
    providers: ["opencode/v4flash"],
    materials: materials(),
    prompt: "review",
    reviewMode: "single_round",
    reviewFlow: {
      version: "direction-review.v1",
      public_request_count: 1,
      steps: [
        { id: "reconstruct", visible: ["current_selection"], hidden_until: "reveal" },
        { id: "reveal", after: ["reconstruct"], visible: ["current_selection", "alternatives", "selection_rationale", "key_assumptions", "independent_reconstruction"] },
        { id: "challenge", after: ["reveal"], visible: ["revealed_choice", "independent_reconstruction"], output: "findings" },
      ],
      output: { one_provider_result: true, one_logical_fact: true },
    },
  })).rejects.toMatchObject({ code: "PROTOCOL_INCOMPATIBLE" });
  expect(calls).toHaveLength(0);
});

test("client rejects direction flow without the single_round mode", async () => {
  const reviewFlow = {
    version: "direction-review.v1",
    public_request_count: 1,
    steps: [
      { id: "reconstruct", visible: ["raw_requirement", "objective_facts"], hidden_until: "reveal" },
      { id: "reveal", after: ["reconstruct"], visible: ["current_selection", "alternatives", "selection_rationale", "key_assumptions", "independent_reconstruction"] },
      { id: "challenge", after: ["reveal"], visible: ["revealed_choice", "independent_reconstruction"], output: "findings" },
    ],
    output: { one_provider_result: true, one_logical_fact: true },
  };
  const client = new ReviewProviderClient({ invoke: async () => ({ exitCode: 0, stdout: `${JSON.stringify(group(["opencode/v4flash"]))}\n`, stderr: "" }) });
  await expect(client.runGroup({ hostProvider: "codex/terra", providers: ["opencode/v4flash"], materials: materials(), prompt: "review", reviewFlow }))
    .rejects.toMatchObject({ code: "PROTOCOL_INCOMPATIBLE" });
});

test("client preserves numeric nested usage telemetry", async () => {
  const value = group(["opencode/v4flash"]);
  value.providers[0].usage = {
    input: 10,
    output: 4,
    total: 14,
    cache: { read: 8, write: 1 },
    cost: { input: 0.0000014, output: 0.00058156, total: 0.0005908448 },
  };
  const client = new ReviewProviderClient({ invoke: async () => ({ exitCode: 0, stdout: `${JSON.stringify(value)}\n`, stderr: "" }) });
  const result = await client.runGroup({ hostProvider: "codex/terra", providers: ["opencode/v4flash"], materials: materials(), prompt: "review" });
  expect(result.providers[0].usage).toEqual(value.providers[0].usage);
});

test("client rejects decimal token usage while accepting provider cost decimals", async () => {
  const value = group(["opencode/v4flash"]);
  value.providers[0].usage = { total: 14.5 };
  const client = new ReviewProviderClient({ invoke: async () => ({ exitCode: 0, stdout: `${JSON.stringify(value)}\n`, stderr: "" }) });
  await expect(client.runGroup({ hostProvider: "codex/terra", providers: ["opencode/v4flash"], materials: materials(), prompt: "review" }))
    .rejects.toMatchObject({ code: "PROTOCOL_INCOMPATIBLE" });
});

test("client preserves non-negative decimal cost telemetry only at usage.cost", async () => {
  const value = group(["opencode/v4flash"]);
  value.providers[0].usage = { input: 10, output: 4, cost: 0.125 };
  const client = new ReviewProviderClient({ invoke: async () => ({ exitCode: 0, stdout: `${JSON.stringify(value)}\n`, stderr: "" }) });
  const result = await client.runGroup({ hostProvider: "codex/terra", providers: ["opencode/v4flash"], materials: materials(), prompt: "review" });
  expect(result.providers[0].usage).toEqual(value.providers[0].usage);
});

test("client rejects malformed usage telemetry instead of accepting it as cost evidence", async () => {
  for (const usage of [{ total: -1 }, { total: "14" }, { total: 14, cache: {} }, []]) {
    const value = group(["opencode/v4flash"]);
    value.providers[0].usage = usage;
    const client = new ReviewProviderClient({ invoke: async () => ({ exitCode: 0, stdout: `${JSON.stringify(value)}\n`, stderr: "" }) });
    await expect(client.runGroup({ hostProvider: "codex/terra", providers: ["opencode/v4flash"], materials: materials(), prompt: "review" }))
      .rejects.toMatchObject({ code: "PROTOCOL_INCOMPATIBLE" });
  }
});

test("client preserves the v3 group terminal facts beside provider members", async () => {
  const partial = group(["opencode/v4flash"]);
  partial.outcome = "partial";
  partial.round = 2;
  partial.selected_tier = 1;
  const client = new ReviewProviderClient({ invoke: async () => ({ exitCode: 3, stdout: `${JSON.stringify(partial)}\n`, stderr: "" }) });
  const result = await client.runGroup({ hostProvider: "codex/terra", providers: ["opencode/v4flash"], materials: materials(), prompt: "review" });
  expect(result).toMatchObject({ runtimeId: "runtime-v3", outcome: "partial", round: 2, selectedTier: 1 });
});

test("client rejects a mixed-version group instead of silently converting it", async () => {
  const bad = group(["opencode/v4flash"]);
  bad.providers[0].result_protocol = "workflowhub-result.v2";
  const client = new ReviewProviderClient({ invoke: async () => ({ exitCode: 0, stdout: `${JSON.stringify(bad)}\n`, stderr: "" }) });
  await expect(client.runGroup({ hostProvider: "codex/terra", providers: ["opencode/v4flash"], materials: materials(), prompt: "review" }))
    .rejects.toMatchObject({ code: "PROTOCOL_INCOMPATIBLE" });
});

test("client rejects a legacy group instead of silently converting it for the v3 consumer", async () => {
  const legacy = {
    version: 4, outcome: "completed", runtime_id: "runtime-legacy", round: 0,
    host_provider: "codex/terra", selected_tier: 0,
    providers: [{
      adapter: "opencode", continuable: false, effort: null, error: null,
      material_id: "material-id", model: null, output: "{\"findings\":[]}", provider: "opencode/v4flash",
      raw_output_ref: null, result_protocol: "workflowhub-result.v2", retry: { count: 0, progress_events: 0 },
      runtime_id: "runtime-legacy", session_file_path: null, session_id: null, status: "completed", thinking: null,
      timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 }, unavailable_diagnostics: null, usage: null,
    }],
  };
  const client = new ReviewProviderClient({ invoke: async () => ({ exitCode: 0, stdout: `${JSON.stringify(legacy)}\n`, stderr: "" }) });
  await expect(client.runGroup({ hostProvider: "codex/terra", providers: ["opencode/v4flash"], materials: materials(), prompt: "review" }))
    .rejects.toMatchObject({ code: "PROTOCOL_INCOMPATIBLE" });
});

test("client rejects a blank broker source identity", async () => {
  for (const sourceId of ["", "   "]) {
    const bad = group(["opencode/v4flash"]);
    bad.providers[0].identity.source_id = sourceId;
    const client = new ReviewProviderClient({ invoke: async () => ({ exitCode: 0, stdout: `${JSON.stringify(bad)}\n`, stderr: "" }) });
    await expect(client.runGroup({ hostProvider: "codex/terra", providers: ["opencode/v4flash"], materials: materials(), prompt: "review" }))
      .rejects.toMatchObject({ code: "PROTOCOL_INCOMPATIBLE" });
  }
});

test("client rejects impossible v3 timing before accepting provider output", async () => {
  const bad = group(["opencode/v4flash"]);
  bad.providers[0].timing.completed_at_ms = 9;
  const client = new ReviewProviderClient({ invoke: async () => ({ exitCode: 0, stdout: `${JSON.stringify(bad)}\n`, stderr: "" }) });
  await expect(client.runGroup({ hostProvider: "codex/terra", providers: ["opencode/v4flash"], materials: materials(), prompt: "review" }))
    .rejects.toMatchObject({ code: "PROTOCOL_INCOMPATIBLE" });
});

test("client preserves a broker public error instead of flattening it into protocol mismatch", async () => {
  const client = new ReviewProviderClient({ invoke: async () => ({
    exitCode: 2,
    stdout: "",
    stderr: JSON.stringify({ error: { code: "REQUEST_INVALID", message: "provider_allowlist is invalid" } }),
  }) });
  await expect(client.runGroup({ hostProvider: "codex/terra", providers: ["opencode/v4flash"], materials: materials(), prompt: "review" }))
    .rejects.toThrow("REQUEST_INVALID: provider_allowlist is invalid");
});

test("client reports a non-json broker exit with hashes, without exposing stream contents", async () => {
  const client = new ReviewProviderClient({ invoke: async () => ({ exitCode: 2, stdout: "not-json", stderr: "broker failed" }) });
  await expect(client.runGroup({ hostProvider: "codex/terra", providers: ["opencode/v4flash"], materials: materials(), prompt: "review" }))
    .rejects.toMatchObject({ code: "PROTOCOL_INCOMPATIBLE" });
  await expect(client.runGroup({ hostProvider: "codex/terra", providers: ["opencode/v4flash"], materials: materials(), prompt: "review" }))
    .rejects.toThrow(/stdout_sha256=[a-f0-9]{64}; stderr_sha256=[a-f0-9]{64}/);
});

test("client does not accept a JSON-looking group on stderr as the public result", async () => {
  const client = new ReviewProviderClient({ invoke: async () => ({
    exitCode: 0, stdout: "", stderr: `${JSON.stringify(group(["opencode/v4flash"]))}\n`,
  }) });
  await expect(client.runGroup({ hostProvider: "codex/terra", providers: ["opencode/v4flash"], materials: materials(), prompt: "review" }))
    .rejects.toMatchObject({ code: "PROTOCOL_INCOMPATIBLE" });
});

test("client classifies a spawn failure separately from a malformed public result", async () => {
  const client = new ReviewProviderClient({ invoke: async () => ({ exitCode: null, stdout: "", stderr: "", spawnError: { code: "ENOENT" } }) });
  await expect(client.runGroup({ hostProvider: "codex/terra", providers: ["opencode/v4flash"], materials: materials(), prompt: "review" }))
    .rejects.toMatchObject({ code: "BROKER_SPAWN_FAILED" });
});

test("client rejects provider results that expose unlisted absolute Unix paths", async () => {
  for (const path of ["/workspace/subject.md", "/srv/review/subject.md", "/secret/data", "//server/share/review.md", "C:\\private\\review.md"]) {
    const bad = group(["opencode/v4flash"]);
    bad.providers[0].output = JSON.stringify({ findings: [{ severity: "major", path, issue: "leak", recommendation: "remove" }] });
    const client = new ReviewProviderClient({ invoke: async () => ({ exitCode: 0, stdout: `${JSON.stringify(bad)}\n`, stderr: "" }) });
    await expect(client.runGroup({ hostProvider: "codex/terra", providers: ["opencode/v4flash"], materials: materials(), prompt: "review" }))
      .rejects.toMatchObject({ code: "PUBLIC_RESULT_INVALID" });
  }
});

test("client allows slash notation that follows a Unicode word", async () => {
  const value = group(["opencode/v4flash"]);
  value.providers[0].output = JSON.stringify({ findings: [{
    severity: "major", path: "requirements/open_risks.json",
    issue: "代码/AC/oracle/接口变化需要重新绑定事实", recommendation: "补齐当前事实",
  }] });
  const client = new ReviewProviderClient({ invoke: async () => ({ exitCode: 0, stdout: `${JSON.stringify(value)}\n`, stderr: "" }) });
  await expect(client.runGroup({ hostProvider: "codex/terra", providers: ["opencode/v4flash"], materials: materials(), prompt: "review" }))
    .resolves.toMatchObject({ providers: [{ status: "completed" }] });
});

test("client allows provider-relative API routes", async () => {
  const value = group(["opencode/v4flash"]);
  value.providers[0].output = JSON.stringify({ findings: [{
    severity: "major", path: "/api/items/:id", issue: "保持既有 API 语义", recommendation: "保留当前路由契约",
  }] });
  const client = new ReviewProviderClient({ invoke: async () => ({ exitCode: 0, stdout: `${JSON.stringify(value)}\n`, stderr: "" }) });
  await expect(client.runGroup({ hostProvider: "codex/terra", providers: ["opencode/v4flash"], materials: materials(), prompt: "review" }))
    .resolves.toMatchObject({ providers: [{ status: "completed" }] });
});

test("client accepts truthful null deadline and timing for an unavailable provider", async () => {
  const value = group(["opencode/v4flash"]);
  const provider = value.providers[0];
  provider.status = "failed";
  provider.error = { code: "PROCESS_DEAD", message: "provider did not return a terminal result" };
  provider.output = null;
  provider.deadline_ms = null;
  provider.attempts = [];
  provider.timing = { started_at_ms: null, completed_at_ms: null, duration_ms: null };
  value.outcome = "unavailable";
  const client = new ReviewProviderClient({ invoke: async () => ({ exitCode: 3, stdout: `${JSON.stringify(value)}\n`, stderr: "" }) });
  const result = await client.runGroup({ hostProvider: "codex/terra", providers: ["opencode/v4flash"], materials: materials(), prompt: "review" });
  expect(result.providers[0].execution.deadline_ms).toBeNull();
  expect(result.providers[0].timing).toEqual({ started_at_ms: null, completed_at_ms: null, duration_ms: null });
});

test("client rejects inconsistent duration and unsafe public strings", async () => {
  const cases = [
    (value) => { value.providers[0].timing.duration_ms = 11; },
    (value) => { value.providers[0].material.contract_id = ""; },
    (value) => { value.providers[0].error = { code: "", message: "failed" }; value.providers[0].status = "failed"; },
    (value) => { value.providers[0].output = JSON.stringify({ path: "file://host/private/review.json" }); },
  ];
  for (const mutate of cases) {
    const value = group(["opencode/v4flash"]);
    mutate(value);
    const client = new ReviewProviderClient({ invoke: async () => ({ exitCode: 0, stdout: `${JSON.stringify(value)}\n`, stderr: "" }) });
    await expect(client.runGroup({ hostProvider: "codex/terra", providers: ["opencode/v4flash"], materials: materials(), prompt: "review" }))
      .rejects.toMatchObject({ code: expect.stringMatching(/PROTOCOL_INCOMPATIBLE|PUBLIC_RESULT_INVALID/) });
  }
});
