import { expect, test } from "vitest";
import { ReviewProviderClient } from "../review-provider-client.mjs";

const materials = {
  bundleRoot: "/tmp/bundle",
  attachmentRoot: "/tmp/attachments",
  materialId: "material-id",
  sourcePrefix: ".wh-review-packets",
  deliveryManifest: [],
};

test("default broker wait is owned by the 3rd-review runtime", () => {
  const client = new ReviewProviderClient({ command: [process.execPath], config: "fixture-config" });
  expect(client.timeoutMs).toBeNull();
});

test("client bounds a hanging broker and returns a typed timeout", async () => {
  const client = new ReviewProviderClient({
    command: [process.execPath, "-e", "setTimeout(() => {}, 1000)"],
    config: "fixture-config",
    timeoutMs: 25,
  });
  await expect(client.runGroup({
    hostProvider: "codex/terra",
    providers: ["codex/luna"],
    materials,
    prompt: "review",
  })).rejects.toMatchObject({ code: "PROCESS_TIMEOUT" });
});

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


const timeoutRun = (wire, strictProtocol = false) => new ReviewProviderClient({ invoke: async () => wire }).runGroup({
  hostProvider: "codex/terra", providers: ["codex/luna", "kimi/coding"], materials, prompt: "review", strictProtocol,
});
const partial = () => ({ ...group(["codex/luna", "kimi/coding"]), outcome: "partial", providers: [member("codex/luna"), member("kimi/coding", "kimi", "cancelled")] });

test("timeout preserves a strictly valid same-call partial terminal and cancelled sibling", async () => {
  const result = await timeoutRun({ timedOut: true, exitCode: 143, signal: null, stdout: JSON.stringify(partial()), stderr: "" });
  expect(result.outcome).toBe("partial");
  expect(result.transport_timeout).toMatchObject({ code: "PROCESS_TIMEOUT", exit_code: 143 });
  expect(result.providers.map(({ status }) => status)).toEqual(["completed", "cancelled"]);
  expect(result.providers[0].output).toBe('{"findings":[]}');
  expect(result.providers[1].error.code).toBe("PROCESS_DEAD");
});

test.each(["fragment", "stderr", "bad-exit", "wrong-material", "wrong-provider", "running"])('timeout rejects %s instead of inventing semantic output', async (kind) => {
  const value = partial();
  if (kind === "wrong-material") value.material_id = "other";
  if (kind === "wrong-provider") value.providers[0].identity.provider = "unknown/profile";
  if (kind === "running") value.providers[0].status = "running";
  const wire = { timedOut: true, exitCode: kind === "bad-exit" ? 9 : 143, stdout: kind === "fragment" ? '{"version":' : kind === "stderr" ? "" : JSON.stringify(value), stderr: kind === "stderr" ? JSON.stringify(value) : "" };
  await expect(timeoutRun(wire)).rejects.toMatchObject({ code: ["wrong-material", "wrong-provider", "running"].includes(kind) ? "PROTOCOL_INCOMPATIBLE" : "PROCESS_TIMEOUT" });
});
