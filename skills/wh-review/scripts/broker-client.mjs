import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";
import { createHash } from "node:crypto";

const providerId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const providerIds = new Set(["claude-code", "kimi", "codex", "opencode"]);
const providerStatuses = new Set(["ready", "disabled", "unavailable"]);
const deliveryModes = new Set(["file_only", "always_embed"]);
const cancellationSources = new Set(["user", "workflow_shutdown", "broker_idle_timeout", "broker_max_duration"]);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
function normalizeCapabilities(value, { requireReadyAttachmentRoot = false } = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value) || value.version !== 4) throw new Error("third-review doctor capability version must be 4");
  if (!value.capabilities || typeof value.capabilities !== "object" || Array.isArray(value.capabilities)
    || !Object.hasOwn(value.capabilities, "attachments") || !Object.hasOwn(value.capabilities, "cancel_source")
    || typeof value.capabilities.attachments !== "boolean" || typeof value.capabilities.cancel_source !== "boolean") throw new Error("third-review doctor capabilities must declare boolean attachments and cancel_source");
  if (!Array.isArray(value.providers)) throw new Error("third-review doctor providers must be an array");
  if (requireReadyAttachmentRoot && value?.attachment_root?.status !== "ready") throw new Error("third-review doctor attachment root is not ready");
  const seen = new Set();
  const providers = value.providers.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item) || typeof item.provider !== "string" || !providerId.test(item.provider) || !providerIds.has(item.provider)) throw new Error("third-review doctor provider id is invalid");
    if (seen.has(item.provider)) throw new Error(`third-review doctor duplicate provider: ${item.provider}`); seen.add(item.provider);
    if (!providerStatuses.has(item.status)) throw new Error(`third-review doctor provider status is invalid: ${item.provider}`);
    const capabilities = item.capabilities;
    if (!capabilities || typeof capabilities !== "object" || Array.isArray(capabilities)
      || !Object.hasOwn(capabilities, "continuation") || !Object.hasOwn(capabilities, "attachment_delivery")
      || typeof capabilities.continuation !== "boolean") throw new Error(`third-review doctor continuation capability is invalid: ${item.provider}`);
    if (!Array.isArray(capabilities.attachment_delivery) || capabilities.attachment_delivery.some((mode) => !deliveryModes.has(mode)) || new Set(capabilities.attachment_delivery).size !== capabilities.attachment_delivery.length) throw new Error(`third-review doctor attachment_delivery capability is invalid: ${item.provider}`);
    return { provider: item.provider, status: item.status, capabilities: { continuation: capabilities.continuation, attachment_delivery: [...capabilities.attachment_delivery].sort() } };
  }).sort((left, right) => left.provider.localeCompare(right.provider));
  return deepFreeze({ version: 4, capabilities: { attachments: value.capabilities.attachments, cancel_source: value.capabilities.cancel_source }, providers });
}

/**
 * Thin v4-only boundary. It deliberately has no wall-clock killer: broker owns
 * provider liveness and duration limits. A workflow shutdown must call cancel.
 */
export class BrokerClient {
  constructor({ command, config, attachmentRoot, spawnImpl = spawn } = {}) {
    if (!command) throw new TypeError("third_review.command is required");
    if (!config) throw new TypeError("third_review.config is required");
    this.command = Array.isArray(command) ? command : [command];
    this.config = config;
    if (attachmentRoot !== undefined && (!isAbsolute(attachmentRoot) || !attachmentRoot)) throw new TypeError("third_review.attachment_root must be an absolute path");
    this.attachmentRoot = attachmentRoot ?? null;
    this.capabilitySnapshot = null;
    this.capabilityDiscovery = null;
    this.spawnImpl = spawnImpl;
  }

  async run({ request, attachments, attachmentDelivery, privateRawDirectory } = {}) {
    const temp = mkdtempSync(join(tmpdir(), "wh-review-v4-broker-"));
    try {
      const requestFile = join(temp, "request.json");
      writeFileSync(requestFile, `${JSON.stringify(request)}\n`, { mode: 0o600 });
      const args = [...this.command.slice(1), "run", `--config=${this.config}`, `--request=${requestFile}`];
      if (attachments) {
        await this.#requireCapability("attachments", "THIRD_REVIEW_ATTACHMENT_UNSUPPORTED");
        if (!this.attachmentRoot || !attachmentDelivery) throw new TypeError("attachments require attachmentRoot and attachmentDelivery");
        if (!deliveryModes.has(attachmentDelivery)) throw new TypeError("attachmentDelivery must be file_only or always_embed");
        const manifestFile = join(temp, "attachments.json");
        writeFileSync(manifestFile, `${JSON.stringify(attachments)}\n`, { mode: 0o600 });
        args.push(`--attachments=${manifestFile}`, `--attachments-root=${this.attachmentRoot}`, `--attachment-delivery=${attachmentDelivery}`);
      }
      const result = await this.#execute(this.command[0], args);
      if (result.code !== 0) return { transport_error: { code: "BROKER_FAILED", message: result.stderr.slice(0, 4096) } };
      let parsed;
      try { parsed = JSON.parse(result.stdout); }
      catch { return { transport_error: { code: "BROKER_OUTPUT_INVALID", message: "3rd-review returned non-JSON" } }; }
      return privateRawDirectory ? this.#materializePrivateRaw(parsed, privateRawDirectory, result) : parsed;
    } finally { rmSync(temp, { recursive: true, force: true }); }
  }

  async cancel({ runtime_id, provider, source = "workflow_shutdown" }) {
    if (!runtime_id || !provider) throw new TypeError("runtime_id and provider are required");
    if (!cancellationSources.has(source)) throw new TypeError("cancel source must be user, workflow_shutdown, broker_idle_timeout, or broker_max_duration");
    await this.#requireCapability("cancel_source", "THIRD_REVIEW_CANCEL_SOURCE_UNSUPPORTED");
    const result = await this.#execute(this.command[0], [...this.command.slice(1), "cancel", `--config=${this.config}`, `--runtime-id=${runtime_id}`, `--provider=${provider}`, `--source=${source}`]);
    if (result.code !== 0) throw new Error(`3rd-review cancel failed: ${result.stderr.slice(0, 4096)}`);
    return JSON.parse(result.stdout);
  }

  async status({ runtime_id }) {
    if (!runtime_id) throw new TypeError("runtime_id is required");
    const result = await this.#execute(this.command[0], [...this.command.slice(1), "status", `--config=${this.config}`, `--runtime-id=${runtime_id}`]);
    if (result.code !== 0) throw new Error(`3rd-review status failed: ${result.stderr.slice(0, 4096)}`);
    return JSON.parse(result.stdout);
  }

  async discoverCapabilities() {
    if (this.capabilitySnapshot) return this.capabilitySnapshot;
    if (!this.capabilityDiscovery) this.capabilityDiscovery = (async () => {
      const args = [...this.command.slice(1), "doctor", `--config=${this.config}`];
      if (this.attachmentRoot) args.push(`--attachments-root=${this.attachmentRoot}`);
      const result = await this.#execute(this.command[0], args);
      if (result.code !== 0) throw new Error(`third-review doctor failed: ${result.stderr.slice(0, 4096)}`);
      let parsed; try { parsed = JSON.parse(result.stdout); } catch { throw new Error("third-review doctor returned non-JSON"); }
      this.capabilitySnapshot = normalizeCapabilities(parsed, { requireReadyAttachmentRoot: this.attachmentRoot !== null }); return this.capabilitySnapshot;
    })();
    try { return await this.capabilityDiscovery; }
    catch (error) { this.capabilityDiscovery = null; throw error; }
  }

  async #requireCapability(name, code) {
    const doctor = await this.discoverCapabilities();
    // Capability declaration is broker-owned evidence. Caller configuration is
    // deliberately ignored: it cannot authorize an argv the selected CLI lacks.
    if (doctor?.capabilities?.[name] !== true) throw new Error(`${code}: selected third_review.command doctor does not declare ${name}`);
  }

  #execute(command, args) {
    return new Promise((resolve, reject) => {
      const child = this.spawnImpl(command, args, { stdio: ["ignore", "pipe", "pipe"] });
      let stdout = "", stderr = "";
      child.stdout?.on("data", (value) => { stdout += value; }); child.stderr?.on("data", (value) => { stderr += value; });
      child.once("error", reject); child.once("close", (code) => resolve({ code, stdout, stderr }));
    });
  }

  #materializePrivateRaw(result, privateRawDirectory, brokerWire) {
    if (!result || typeof result !== "object" || !Array.isArray(result.providers) || typeof result.runtime_id !== "string") {
      throw new Error("BROKER_RAW_AUDIT_UNAVAILABLE: broker result has no runtime provider evidence");
    }
    if (!isAbsolute(privateRawDirectory)) throw new TypeError("privateRawDirectory must be an absolute path");
    let config;
    try { config = JSON.parse(readFileSync(this.config, "utf8")); }
    catch (error) { throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: cannot read broker config: ${error.message}`); }
    if (!isAbsolute(config?.runtime?.root ?? "")) throw new Error("BROKER_RAW_AUDIT_UNAVAILABLE: broker runtime.root must be absolute");
    const runtimeRoot = realpathSync(config.runtime.root);
    const runtime = resolve(runtimeRoot, result.runtime_id);
    if (relative(runtimeRoot, runtime).startsWith("..") || runtime === runtimeRoot) throw new Error("BROKER_RAW_AUDIT_UNAVAILABLE: unsafe broker runtime id");
    let state;
    try { state = JSON.parse(readFileSync(join(runtime, "state.json"), "utf8")); }
    catch (error) { throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: cannot read broker private state: ${error.message}`); }
    if (state?.runtime_id !== result.runtime_id || !state.providers || typeof state.providers !== "object") throw new Error("BROKER_RAW_AUDIT_UNAVAILABLE: broker state does not bind the runtime");
    const destinationRoot = resolve(privateRawDirectory);
    mkdirSync(destinationRoot, { recursive: true, mode: 0o700 });
    // Keep the broker wire response even when a provider omitted its native raw
    // streams. That omission is material-insufficient, never a semantic pass,
    // but the host still needs durable evidence for a later disposition.
    const wire = (stream, value) => {
      const bytes = Buffer.from(value ?? "", "utf8"); const digest = sha256(bytes);
      const target = join(destinationRoot, `broker-wire.${stream}.${digest}.raw`);
      try { writeFileSync(target, bytes, { mode: 0o400, flag: "wx" }); }
      catch (error) {
        if (error?.code !== "EEXIST" || sha256(readFileSync(target)) !== digest) throw error;
      }
      return { ref: target, sha256: digest };
    };
    const broker_raw_stdout = wire("stdout", brokerWire?.stdout);
    const broker_raw_stderr = wire("stderr", brokerWire?.stderr);
    const copyStream = (provider, stream, stateProvider, publicProvider) => {
      const ref = stateProvider[`raw_${stream}_ref`]; const expected = stateProvider[`raw_${stream}_sha256`];
      const announced = publicProvider[`raw_${stream}_sha256`];
      const hasAny = ref !== undefined || expected !== undefined || announced !== undefined;
      if (!hasAny) return null;
      if (typeof ref !== "string" || !ref || isAbsolute(ref) || ref.split(/[\\/]/).some((part) => part === "..")) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${provider} ${stream} ref is unsafe`);
      if (!/^[a-f0-9]{64}$/i.test(expected ?? "") || !/^[a-f0-9]{64}$/i.test(announced ?? "") || expected.toLowerCase() !== announced.toLowerCase()) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${provider} ${stream} hash is missing or mismatched`);
      const source = realpathSync(resolve(runtime, ref));
      if (relative(runtime, source).startsWith("..") || source === runtime) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${provider} ${stream} source escapes runtime`);
      const bytes = readFileSync(source);
      if (sha256(bytes) !== expected.toLowerCase()) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${provider} ${stream} bytes do not match broker hash`);
      const target = join(destinationRoot, `${provider}.${stream}.${expected.toLowerCase()}.raw`);
      try { writeFileSync(target, bytes, { mode: 0o400, flag: "wx" }); }
      catch (error) {
        if (error?.code !== "EEXIST" || sha256(readFileSync(target)) !== expected.toLowerCase()) throw error;
      }
      return target;
    };
    const auditFailure = (item, error) => ({ ...item, raw_audit_error: {
      code: String(error?.message ?? error).startsWith("BROKER_RAW_AUDIT_UNAVAILABLE") ? "BROKER_RAW_AUDIT_UNAVAILABLE" : "BROKER_RAW_AUDIT_FAILED",
    } });
    const providers = result.providers.map((item) => {
      if (!item || typeof item !== "object" || !providerId.test(item.provider ?? "") || !providerIds.has(item.provider)) return item;
      // The broker's terminal CANCELLED is a caller-side cancellation signal,
      // not a model timeout or a review verdict. Older adapters omitted the
      // source; retain the truthful caller boundary rather than misclassifying
      // it as provider failure.
      if (item.status === "cancelled" && item?.error?.code === "CANCELLED" && !item.error.source) item = { ...item, error: { ...item.error, source: "workflow_shutdown" } };
      try {
        const privateState = state.providers[item.provider];
        const expectsRaw = item.status === "completed" || item.raw_stdout_sha256 !== undefined || item.raw_stderr_sha256 !== undefined;
        if (!privateState || typeof privateState !== "object") {
          if (expectsRaw) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${item.provider} has no private broker state`);
          return item;
        }
        const raw_stdout_ref = copyStream(item.provider, "stdout", privateState, item);
        const raw_stderr_ref = copyStream(item.provider, "stderr", privateState, item);
        if (expectsRaw && (!raw_stdout_ref || !raw_stderr_ref)) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${item.provider} lacks raw stream evidence`);
        return { ...item, ...(raw_stdout_ref ? { raw_stdout_ref } : {}), ...(raw_stderr_ref ? { raw_stderr_ref } : {}) };
      } catch (error) { return auditFailure(item, error); }
    });
    return { ...result, broker_raw_stdout_ref: broker_raw_stdout.ref, broker_raw_stdout_sha256: broker_raw_stdout.sha256, broker_raw_stderr_ref: broker_raw_stderr.ref, broker_raw_stderr_sha256: broker_raw_stderr.sha256, providers };
  }
}
