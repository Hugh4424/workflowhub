import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const providerId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const providerIds = new Set(["claude-code", "kimi", "codex", "opencode"]);
const providerStatuses = new Set(["ready", "disabled", "unavailable"]);
const deliveryModes = new Set(["file_only", "always_embed"]);
function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
function normalizeCapabilities(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || value.version !== 4) throw new Error("third-review doctor capability version must be 4");
  if (!value.capabilities || typeof value.capabilities !== "object" || Array.isArray(value.capabilities)
    || Object.keys(value.capabilities).sort().join(",") !== "attachments,cancel_source"
    || typeof value.capabilities.attachments !== "boolean" || typeof value.capabilities.cancel_source !== "boolean") throw new Error("third-review doctor capabilities must declare only boolean attachments and cancel_source");
  if (!Array.isArray(value.providers)) throw new Error("third-review doctor providers must be an array");
  const seen = new Set();
  const providers = value.providers.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item) || typeof item.provider !== "string" || !providerId.test(item.provider) || !providerIds.has(item.provider)) throw new Error("third-review doctor provider id is invalid");
    if (seen.has(item.provider)) throw new Error(`third-review doctor duplicate provider: ${item.provider}`); seen.add(item.provider);
    if (!providerStatuses.has(item.status)) throw new Error(`third-review doctor provider status is invalid: ${item.provider}`);
    const capabilities = item.capabilities;
    if (!capabilities || typeof capabilities !== "object" || Array.isArray(capabilities) || Object.keys(capabilities).sort().join(",") !== "attachment_delivery,continuation" || typeof capabilities.continuation !== "boolean") throw new Error(`third-review doctor continuation capability is invalid: ${item.provider}`);
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
    this.attachmentRoot = attachmentRoot;
    this.capabilitySnapshot = null;
    this.capabilityDiscovery = null;
    this.spawnImpl = spawnImpl;
  }

  async run({ request, attachments, attachmentDelivery } = {}) {
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
      try { return JSON.parse(result.stdout); }
      catch { return { transport_error: { code: "BROKER_OUTPUT_INVALID", message: "3rd-review returned non-JSON" } }; }
    } finally { rmSync(temp, { recursive: true, force: true }); }
  }

  async cancel({ runtime_id, provider, source = "workflow_shutdown" }) {
    if (!runtime_id || !provider) throw new TypeError("runtime_id and provider are required");
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
      const result = await this.#execute(this.command[0], [...this.command.slice(1), "doctor", `--config=${this.config}`]);
      if (result.code !== 0) throw new Error(`third-review doctor failed: ${result.stderr.slice(0, 4096)}`);
      let parsed; try { parsed = JSON.parse(result.stdout); } catch { throw new Error("third-review doctor returned non-JSON"); }
      this.capabilitySnapshot = normalizeCapabilities(parsed); return this.capabilitySnapshot;
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
}
