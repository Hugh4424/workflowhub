import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const protocol = "workflowhub-result.v2";

function failure(code, message) { const error = new Error(`${code}: ${message}`); error.code = code; return error; }

function execute(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] }); let stdout = "", stderr = "";
    child.stdout.on("data", (bytes) => { stdout += bytes; }); child.stderr.on("data", (bytes) => { stderr += bytes; });
    child.once("error", reject); child.once("close", (exitCode) => resolve({ exitCode, stdout, stderr }));
  });
}

function nullableString(value, label) {
  if (value !== null && typeof value !== "string") throw failure("PROTOCOL_INCOMPATIBLE", label + " must be a string or null");
  return value;
}

function nullableInteger(value, label) {
  if (value !== null && (!Number.isSafeInteger(value) || value < 0)) throw failure("PROTOCOL_INCOMPATIBLE", label + " must be a non-negative integer or null");
  return value;
}

function unavailableDiagnostic(value) {
  if (value === null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value) || typeof value.code !== "string" ||
      (value.message !== null && typeof value.message !== "string")) {
    throw failure("PROTOCOL_INCOMPATIBLE", "unavailable_diagnostics must contain a code and nullable message");
  }
  return Object.freeze({ code: value.code, message: value.message });
}

function validatePublicProvider(value, providers, materialId, runtimeId) {
  if (!value || typeof value !== "object" || value.result_protocol !== protocol || !providers.has(value.provider)) throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review returned an incompatible provider result");
  const provider = value.provider;
  if (!["completed", "failed", "cancelled"].includes(value.status)) throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review returned an invalid provider status");
  if (value.material_id !== materialId) throw failure("MATERIAL_INCOMPLETE", "3rd-review result is bound to different material");
  if (value.runtime_id !== runtimeId) throw failure("PROTOCOL_INCOMPATIBLE", "provider runtime_id must match the public run runtime_id");
  if (typeof value.adapter !== "string" || value.adapter.length === 0) throw failure("PROTOCOL_INCOMPATIBLE", "adapter must be a non-empty string");
  nullableString(value.model, "model"); nullableString(value.effort, "effort");
  if (value.thinking !== null && typeof value.thinking !== "boolean") throw failure("PROTOCOL_INCOMPATIBLE", "thinking must be a boolean or null");
  if (value.session_file_path !== null) throw failure("PROTOCOL_INCOMPATIBLE", "session_file_path must be null");
  if (typeof value.continuable !== "boolean") throw failure("PROTOCOL_INCOMPATIBLE", "continuable must be a boolean");
  if (!value.timing || typeof value.timing !== "object" || Array.isArray(value.timing)) throw failure("PROTOCOL_INCOMPATIBLE", "timing must be an object");
  const timing = {
    started_at_ms: nullableInteger(value.timing.started_at_ms, "timing.started_at_ms"),
    completed_at_ms: nullableInteger(value.timing.completed_at_ms, "timing.completed_at_ms"),
    duration_ms: nullableInteger(value.timing.duration_ms, "timing.duration_ms"),
  };
  if (value.usage !== null && (typeof value.usage !== "object" || Array.isArray(value.usage))) throw failure("PROTOCOL_INCOMPATIBLE", "usage must be an object or null");
  if (!value.retry || typeof value.retry !== "object" || Array.isArray(value.retry)) throw failure("PROTOCOL_INCOMPATIBLE", "retry must be an object");
  const retry = { count: nullableInteger(value.retry.count, "retry.count"), progress_events: nullableInteger(value.retry.progress_events, "retry.progress_events") };
  if (retry.count === null || retry.progress_events === null) throw failure("PROTOCOL_INCOMPATIBLE", "retry fields must be non-null non-negative integers");
  if (value.raw_output_ref !== null) {
    if (!value.raw_output_ref || typeof value.raw_output_ref !== "object" || Array.isArray(value.raw_output_ref) ||
        value.raw_output_ref.version !== "broker-output-ref.v1" || value.raw_output_ref.runtime_id !== runtimeId ||
        value.raw_output_ref.provider !== provider || !/^[a-f0-9]{64}$/.test(value.raw_output_ref.stdout_sha256 ?? "") ||
        !/^[a-f0-9]{64}$/.test(value.raw_output_ref.stderr_sha256 ?? "")) {
      throw failure("PROTOCOL_INCOMPATIBLE", "raw_output_ref must be a safe broker output reference");
    }
  }
  const sessionId = nullableString(value.session_id, "session_id");
  if (value.output !== null && typeof value.output !== "string") throw failure("PROTOCOL_INCOMPATIBLE", "output must be a string or null");
  if (value.error !== null && (typeof value.error?.code !== "string" || typeof value.error?.message !== "string")) throw failure("PROTOCOL_INCOMPATIBLE", "error must contain code and message");
  const unavailableDiagnostics = unavailableDiagnostic(value.unavailable_diagnostics);
  return Object.freeze({
    provider, status: value.status, session_id: sessionId, output: value.output, error: value.error,
    unavailable_diagnostics: unavailableDiagnostics,
    execution: Object.freeze({
      adapter: value.adapter, model: value.model, effort: value.effort, thinking: value.thinking,
      timing: Object.freeze(timing), usage: value.usage, retry: Object.freeze(retry),
      runtime_id: runtimeId, session_file_path: null, raw_output_ref: value.raw_output_ref,
    }),
  });
}

export class ReviewProviderClient {
  constructor({ command = null, config = null, invoke = null } = {}) {
    if (!invoke && (!command || !config)) throw new TypeError("command and config are required without an injected invoke function");
    this.command = Array.isArray(command) ? command : command ? [command] : null; this.config = config; this.invoke = invoke ?? ((value) => this.#invokeCli(value));
  }

  async runGroup({ hostProvider, providers, materials, prompt, continuationRuntimeId = null } = {}) {
    if (!(hostProvider && Array.isArray(providers) && providers.length > 0 && materials?.bundleRoot && materials?.materialId && prompt)) throw new TypeError("hostProvider, providers, materials, and prompt are required");
    if (providers.some((provider) => typeof provider !== "string" || provider.length === 0) || new Set(providers).size !== providers.length) throw new TypeError("providers must be a unique non-empty string array");
    const entries = (materials.deliveryManifest ?? materials.manifest ?? []).map(({ path, bytes, sha256 }) => ({ source: `${materials.sourcePrefix}/${path}`, destination: path, size: bytes, sha256, embed: false }));
    // A stage is one broker reviewer group. 3rd-review owns the group-level
    // heterologous filter, dispatch, native-session lifecycle, and all public
    // per-provider outcomes. WorkflowHub only supplies the configured
    // candidate profiles plus frozen material.
    const request = { version: 4, host_provider: hostProvider, required_result_protocol: protocol, provider_allowlist: [...providers], prompt, continuation: continuationRuntimeId ? { runtime_id: continuationRuntimeId } : null };
    const attachments = { version: 1, bundle_id: materials.materialId, entries };
    const wire = await this.invoke({ request, attachments, attachmentsRoot: materials.attachmentRoot, attachmentDelivery: "file_only" });
    // Exit 3 still carries a complete public group result when one or more
    // candidates are unavailable. Parse it so the stage records that fact.
    if (![0, 3].includes(wire.exitCode)) {
      let parsed; try { parsed = JSON.parse(wire.stderr); } catch { throw failure("PROVIDER_UNAVAILABLE", wire.stderr || `3rd-review exited ${wire.exitCode}`); }
      throw failure(parsed?.error?.code ?? "PROVIDER_UNAVAILABLE", parsed?.error?.message ?? "3rd-review preflight failed");
    }
    let result; try { result = JSON.parse(wire.stdout); } catch { throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review run stdout is not JSON"); }
    if (typeof result?.runtime_id !== "string" || !Array.isArray(result.providers)) throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review group result is incomplete");
    const requested = new Set(providers);
    const received = new Set();
    const publicProviders = result.providers.map((item) => {
      const publicProvider = validatePublicProvider(item, requested, materials.materialId, result.runtime_id);
      if (received.has(publicProvider.provider)) throw failure("PROTOCOL_INCOMPATIBLE", `3rd-review returned duplicate provider ${publicProvider.provider}`);
      received.add(publicProvider.provider);
      return publicProvider;
    });
    if (received.size !== requested.size || providers.some((provider) => !received.has(provider))) {
      throw failure("PROTOCOL_INCOMPATIBLE", `3rd-review omitted configured provider result(s): ${providers.filter((provider) => !received.has(provider)).join(", ") || "unknown"}`);
    }
    return Object.freeze({ runtimeId: result.runtime_id, providers: Object.freeze(publicProviders) });
  }

  // Kept for direct consumers during the transition. The review runner uses
  // runGroup exclusively, so production review dispatch is never fan-out by
  // WorkflowHub.
  async run({ hostProvider, provider, materials, prompt, continuationRuntimeId = null } = {}) {
    const result = await this.runGroup({ hostProvider, providers: [provider], materials, prompt, continuationRuntimeId });
    return { runtimeId: result.runtimeId, provider: result.providers[0] };
  }

  async #invokeCli({ request, attachments, attachmentsRoot, attachmentDelivery }) {
    const temporary = mkdtempSync(join(tmpdir(), "wh-review-public-"));
    try {
      const requestPath = join(temporary, "request.json"); const attachmentsPath = join(temporary, "attachments.json");
      writeFileSync(requestPath, `${JSON.stringify(request)}\n`, { mode: 0o600 }); writeFileSync(attachmentsPath, `${JSON.stringify(attachments)}\n`, { mode: 0o600 });
      const args = [...this.command.slice(1), "run", `--config=${this.config}`, `--request=${requestPath}`, `--attachments=${attachmentsPath}`, `--attachments-root=${attachmentsRoot}`, `--attachment-delivery=${attachmentDelivery}`];
      return await execute(this.command[0], args);
    } finally { rmSync(temporary, { recursive: true, force: true }); }
  }
}
