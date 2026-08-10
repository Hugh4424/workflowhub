import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const protocol = "workflowhub-result.v2";
const providerFields = ["adapter", "continuable", "effort", "error", "material_id", "model", "output", "provider", "raw_output_ref", "result_protocol", "retry", "runtime_id", "session_file_path", "session_id", "status", "thinking", "timing", "unavailable_diagnostics", "usage"];
const groupFields = ["host_provider", "outcome", "providers", "round", "runtime_id", "selected_tier", "version"];

function failure(code, message) { const error = new Error(`${code}: ${message}`); error.code = code; return error; }

// Reject filesystem roots, not ordinary review terms such as `map/AC`.
const absolutePathPattern = /(?:^|[^A-Za-z0-9._~/%-])(?:\/(?:Users|home|private|tmp|var|etc|opt|mnt|Volumes|root|usr|bin|sbin|dev|proc|sys|Library)(?:\/|$)|[A-Za-z]:[\\/])/;
const fileUriPathPattern = /\bfile:\/\/\/(?:[A-Za-z0-9._~%-]|%[A-Fa-f0-9]{2})/i;

function containsPrivatePath(value) {
  if (typeof value === "string") return absolutePathPattern.test(value) || fileUriPathPattern.test(value);
  if (!value || typeof value !== "object") return false;
  return Array.isArray(value) ? value.some(containsPrivatePath) : Object.values(value).some(containsPrivatePath);
}

function execute(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] }); let stdout = "", stderr = ""; let settled = false;
    child.stdout.on("data", (bytes) => { stdout += bytes; }); child.stderr.on("data", (bytes) => { stderr += bytes; });
    child.once("error", (error) => { if (settled) return; settled = true; reject(error); });
    child.once("close", (exitCode) => { if (settled) return; settled = true; resolve({ exitCode, stdout, stderr }); });
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

function exactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join("\u0000") !== [...expected].sort().join("\u0000")) {
    throw failure("PROTOCOL_INCOMPATIBLE", `${label} has unsupported fields`);
  }
}

function unavailableDiagnostic(value) {
  if (value === null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value) || typeof value.code !== "string" || value.code.length === 0 ||
      (value.message !== null && typeof value.message !== "string")) {
    throw failure("PROTOCOL_INCOMPATIBLE", "unavailable_diagnostics must contain a code and nullable message");
  }
  exactKeys(value, ["code", "message"], "unavailable_diagnostics");
  return Object.freeze({ code: value.code, message: value.message });
}

function attemptError(value) {
  const diagnostic = unavailableDiagnostic(value);
  if (diagnostic === null) return null;
  return Object.freeze({
    code: diagnostic.code,
    message: typeof diagnostic.message === "string" && diagnostic.message.length > 0
      ? diagnostic.message
      : "3rd-review provider did not provide an error message",
  });
}

function validatePublicGroup(value, { hostProvider }) {
  exactKeys(value, groupFields, "3rd-review public group");
  if (value.version !== 4 || typeof value.runtime_id !== "string" || value.runtime_id.length === 0 || value.host_provider !== hostProvider ||
      !["completed", "unavailable", "cancelled", "stalled", "unverifiable", "invalid_output"].includes(value.outcome) ||
      !Number.isSafeInteger(value.round) || value.round < 0 ||
      !(value.selected_tier === null || (Number.isSafeInteger(value.selected_tier) && value.selected_tier >= 0)) ||
      !Array.isArray(value.providers) || value.providers.length === 0) {
    throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review public group is invalid");
  }
  return value;
}

function parsePublicRun(wire) {
  // `run` exits 3 when the terminal provider group is unavailable. Its stdout
  // is still the authoritative public result and must not be discarded.
  if (wire?.exitCode !== 0 && wire?.exitCode !== 3) {
    throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review public run did not return a valid public result");
  }
  let result;
  try { result = JSON.parse(wire.stdout); }
  catch { throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review public run stdout is not JSON"); }
  if (containsPrivatePath(result)) throw failure("PUBLIC_RESULT_INVALID", "3rd-review public run result contains a private path");
  return result;
}

function rawOutputRef(value, provider, runtimeId) {
  if (value === null) return null;
  exactKeys(value, ["provider", "runtime_id", "stderr_sha256", "stdout_sha256", "version"], "raw_output_ref");
  if (value.version !== "broker-output-ref.v1" || value.provider !== provider || value.runtime_id !== runtimeId ||
      !/^[a-f0-9]{64}$/.test(value.stdout_sha256) || !/^[a-f0-9]{64}$/.test(value.stderr_sha256)) {
    throw failure("PROTOCOL_INCOMPATIBLE", "raw_output_ref is not valid public provenance");
  }
  return Object.freeze({ ...value });
}

function validatePublicProvider(value, providers, materialId, runtimeId) {
  exactKeys(value, providerFields, "3rd-review provider result");
  if (value.result_protocol !== protocol || !providers.has(value.provider)) throw failure("PROTOCOL_INCOMPATIBLE", "3rd-review returned an incompatible provider result");
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
  exactKeys(value.timing, ["started_at_ms", "completed_at_ms", "duration_ms"], "timing");
  const timing = {
    started_at_ms: nullableInteger(value.timing.started_at_ms, "timing.started_at_ms"),
    completed_at_ms: nullableInteger(value.timing.completed_at_ms, "timing.completed_at_ms"),
    duration_ms: nullableInteger(value.timing.duration_ms, "timing.duration_ms"),
  };
  if (value.usage !== null && (typeof value.usage !== "object" || Array.isArray(value.usage))) throw failure("PROTOCOL_INCOMPATIBLE", "usage must be an object or null");
  if (!value.retry || typeof value.retry !== "object" || Array.isArray(value.retry)) throw failure("PROTOCOL_INCOMPATIBLE", "retry must be an object");
  exactKeys(value.retry, ["count", "progress_events"], "retry");
  const retry = { count: nullableInteger(value.retry.count, "retry.count"), progress_events: nullableInteger(value.retry.progress_events, "retry.progress_events") };
  if (retry.count === null || retry.progress_events === null) throw failure("PROTOCOL_INCOMPATIBLE", "retry fields must be non-null non-negative integers");
  const publicRawOutputRef = rawOutputRef(value.raw_output_ref, provider, runtimeId);
  const sessionId = nullableString(value.session_id, "session_id");
  if (value.output !== null && typeof value.output !== "string") throw failure("PROTOCOL_INCOMPATIBLE", "output must be a string or null");
  const error = attemptError(value.error);
  if (value.status === "completed" && error !== null) throw failure("PROTOCOL_INCOMPATIBLE", "completed provider result must not contain an error");
  if (value.status !== "completed" && error === null) throw failure("PROTOCOL_INCOMPATIBLE", "failed provider result must contain an error");
  const unavailableDiagnostics = unavailableDiagnostic(value.unavailable_diagnostics);
  return Object.freeze({
    provider, status: value.status, session_id: sessionId, output: value.output, error,
    unavailable_diagnostics: unavailableDiagnostics,
    raw_output_ref: publicRawOutputRef,
    execution: Object.freeze({
      adapter: value.adapter, model: value.model, effort: value.effort, thinking: value.thinking,
      timing: Object.freeze(timing), usage: value.usage, retry: Object.freeze(retry),
      runtime_id: runtimeId,
    }),
  });
}

export class ReviewProviderClient {
  constructor({ command = null, config = null, invoke = null } = {}) {
    if (!invoke && (!command || !config)) throw new TypeError("command and config are required without an injected invoke function");
    this.command = Array.isArray(command) ? command : command ? [command] : null; this.config = config; this.invoke = invoke ?? ((value) => this.#invokeCli(value));
  }

  async runGroup({ hostProvider, providers, materials, prompt } = {}) {
    if (!(hostProvider && Array.isArray(providers) && providers.length > 0 && materials?.bundleRoot && materials?.materialId && prompt)) throw new TypeError("hostProvider, providers, materials, and prompt are required");
    if (providers.some((provider) => typeof provider !== "string" || provider.length === 0) || new Set(providers).size !== providers.length) throw new TypeError("providers must be a unique non-empty string array");
    const entries = (materials.deliveryManifest ?? materials.manifest ?? []).map(({ path, bytes, sha256 }) => ({ source: `${materials.sourcePrefix}/${path}`, destination: path, size: bytes, sha256, embed: false }));
    // Each caller makes one public broker run. 3rd-review owns the group-level
    // heterologous filter, dispatch, native-session lifecycle, and all public
    // per-provider outcomes. Its public run contract does not promise
    // cross-caller deduplication, so WorkflowHub does not claim it here.
    const request = { version: 4, host_provider: hostProvider, required_result_protocol: protocol, provider_allowlist: [...providers], prompt };
    const attachments = { version: 1, bundle_id: materials.materialId, entries };
    const result = validatePublicGroup(parsePublicRun(await this.invoke({
      command: "run", request, attachments, attachmentsRoot: materials.attachmentRoot, attachmentDelivery: "file_only",
    })), { hostProvider });
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

  async #invokeCli({ command, request = null, attachments = null, attachmentsRoot = null, attachmentDelivery = null }) {
    let temporary = null;
    try {
      temporary = mkdtempSync(join(tmpdir(), "wh-review-public-"));
      let args;
      if (command === "run") {
        const requestPath = join(temporary, "request.json"); const attachmentsPath = join(temporary, "attachments.json");
        writeFileSync(requestPath, `${JSON.stringify(request)}\n`, { mode: 0o600 }); writeFileSync(attachmentsPath, `${JSON.stringify(attachments)}\n`, { mode: 0o600 });
        args = [...this.command.slice(1), "run", `--config=${this.config}`, `--request=${requestPath}`, `--attachments=${attachmentsPath}`, `--attachments-root=${attachmentsRoot}`, `--attachment-delivery=${attachmentDelivery}`];
      } else throw failure("PROTOCOL_INCOMPATIBLE", `unsupported public broker command: ${command}`);
      return await execute(this.command[0], args);
    } catch (error) {
      // Local filesystem, spawn, and configuration failures can include host
      // paths. The caller only receives a public broker-protocol diagnostic.
      throw failure("PROTOCOL_INCOMPATIBLE", `3rd-review public ${command} did not return a valid public result`);
    } finally {
      if (temporary !== null) {
        try { rmSync(temporary, { recursive: true, force: true }); }
        catch { /* cleanup failures are local and never part of review evidence */ }
      }
    }
  }
}
