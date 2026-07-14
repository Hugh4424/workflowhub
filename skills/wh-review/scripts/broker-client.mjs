import { spawn } from "node:child_process";
import { closeSync, constants, fstatSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";
import { createHash } from "node:crypto";

const providerId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const providerIds = new Set(["claude-code", "kimi", "codex", "opencode"]);
const providerStatuses = new Set(["ready", "disabled", "unavailable"]);
const deliveryModes = new Set(["file_only", "always_embed"]);
const cancellationSources = new Set(["user", "workflow_shutdown", "broker_idle_timeout", "broker_max_duration"]);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
function packetHash(packet) { const { packet_hash: ignored, ...value } = packet; return sha256(canonical(value)); }
function innerManifestHash(manifest) { const { inner_manifest_hash: ignored, ...value } = manifest; return sha256(canonical(value)); }
function deliveryManifestHash(bundleId, files, deliveryMode) {
  return sha256(canonical({ version: 1, bundle_id: bundleId, delivery_mode: deliveryMode, files: files.filter((item) => item.destination !== "manifest.json").map(({ destination: target, sha256: digest, size }) => ({ target, sha256: digest, size, embed: deliveryMode === "always_embed" })) }));
}
function materialManifestHash(bundleId, files, deliveryMode) {
  return sha256(canonical({ version: 1, bundle_id: bundleId, files: files.filter((item) => !["review-packet.v1.json", "manifest.json"].includes(item.destination)).map(({ destination: target, sha256: digest, size }) => ({ target, sha256: digest, size, embed: deliveryMode === "always_embed" })) }));
}
function safeDestination(value) { return typeof value === "string" && value.length > 0 && !isAbsolute(value) && !value.includes("\\") && value.split("/").every((part) => part && part !== "." && part !== ".."); }
function preparedRedactionRoots(items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error("redaction roots are unavailable");
  const roots = items.map((item) => {
    if (!item || typeof item !== "object" || !/^[a-z][a-z0-9_-]{0,63}$/u.test(item.root_id ?? "") || typeof item.value !== "string" || !item.value
      || !Number.isSafeInteger(item.order) || item.order < 0 || item.token !== `[PRIVATE_ROOT_${item.root_id.toUpperCase().replace(/-/gu, "_")}]`) throw new Error("redaction root is invalid");
    return { root_id: item.root_id, token: item.token, value: item.value, order: item.order };
  });
  roots.sort((a, b) => b.value.length - a.value.length || a.order - b.order || a.value.localeCompare(b.value));
  return roots;
}
function redactionRootSetHash(roots) { return sha256(JSON.stringify(roots.map(({ root_id, value, order }) => ({ root_id, value, order })))); }
function rootBoundary(value, end) { return end === value.length || value[end] === "/" || value[end] === "\\"; }
function nextRootMatch(value, start, roots) {
  let best = null;
  for (const root of roots) {
    let index = value.indexOf(root.value, start);
    while (index >= 0 && !rootBoundary(value, index + root.value.length)) index = value.indexOf(root.value, index + 1);
    if (index >= 0 && (!best || index < best.index || (index === best.index && root.value.length > best.root.value.length))) best = { index, root };
  }
  return best;
}
function replaceRegisteredRoots(value, roots, counts) {
  let cursor = 0; let output = ""; let match;
  while ((match = nextRootMatch(value, cursor, roots))) { output += value.slice(cursor, match.index) + match.root.token; cursor = match.index + match.root.value.length; counts.set(match.root.root_id, (counts.get(match.root.root_id) ?? 0) + 1); }
  return output + value.slice(cursor);
}
function replaceRegisteredValue(value, roots, counts) {
  if (typeof value === "string") return replaceRegisteredRoots(value, roots, counts);
  if (Array.isArray(value)) return value.map((item) => replaceRegisteredValue(item, roots, counts));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [replaceRegisteredRoots(key, roots, counts), replaceRegisteredValue(item, roots, counts)]));
  return value;
}
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
      const rawRequestBinding = attachments ? {
        bundle_id: attachments.bundle_id,
        delivery_mode: attachmentDelivery,
        continuation: request?.continuation ?? null,
        material_manifest_sha256: request?.material_manifest_sha256,
        attachment_ids: structuredClone(request?.attachment_ids),
        records: structuredClone(attachments.entries),
      } : null;
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
      return privateRawDirectory ? this.#materializePrivateRaw(parsed, privateRawDirectory, rawRequestBinding) : parsed;
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

  #materializePrivateRaw(result, privateRawDirectory, rawRequestBinding) {
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
    const materialAttestation = (provider, stateProvider, publicProvider) => {
      const delivery = stateProvider?.delivery;
      if (!delivery || canonical(delivery) !== canonical(publicProvider?.delivery)) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${provider} delivery differs from private broker state`);
      const visible = delivery.provider_visible_attachment_manifest;
      const redaction = delivery.redaction;
      if (!Array.isArray(visible) || !/^[a-f0-9]{64}$/i.test(delivery.raw_material_manifest_hash ?? "") || !/^[a-f0-9]{64}$/i.test(delivery.material_manifest_hash ?? "")
        || !["raw", "sanitized"].includes(delivery.material_representation) || !redaction || redaction.raw_material_manifest_hash !== delivery.raw_material_manifest_hash
        || redaction.derived_material_manifest_hash !== delivery.material_manifest_hash || !/^[a-f0-9]{64}$/i.test(redaction.root_set_hash ?? "")
        || typeof redaction.rule_version !== "string" || !Number.isSafeInteger(redaction.replacement_count) || redaction.replacement_count < 0
        || redaction.residual_scan !== "passed" || !Array.isArray(redaction.roots)) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${provider} delivery attestation is incomplete`);
      if (!Array.isArray(visible) || visible.length === 0 || visible.some((item) => !safeDestination(item?.destination) || !/^[a-f0-9]{64}$/i.test(item?.sha256 ?? "") || !Number.isSafeInteger(item?.size) || item.size < 0)
        || new Set(visible.map((item) => item.destination)).size !== visible.length) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${provider} provider-visible manifest is unsafe`);
      const hostRecords = rawRequestBinding?.records;
      const hostIds = rawRequestBinding?.attachment_ids;
      if (!rawRequestBinding || typeof rawRequestBinding.bundle_id !== "string" || !rawRequestBinding.bundle_id || rawRequestBinding.delivery_mode !== delivery.delivery_mode
        || !Array.isArray(hostRecords) || hostRecords.length === 0 || !Array.isArray(hostIds) || hostIds.length !== hostRecords.length
        || hostRecords.some((item) => !safeDestination(item?.source) || !safeDestination(item?.destination) || !/^[a-f0-9]{64}$/i.test(item?.sha256 ?? "") || !Number.isSafeInteger(item?.size) || item.size < 0 || typeof item?.embed !== "boolean")
        || canonical(hostIds) !== canonical(hostRecords.map(({ destination, sha256: digest }) => ({ destination, sha256: digest })))) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${provider} host request attachment binding is incomplete`);
      const frozenRecords = hostRecords.map(({ destination, sha256: digest, size, embed }) => ({ destination, sha256: digest.toLowerCase(), size, embed }));
      const frozenRawHash = materialManifestHash(rawRequestBinding.bundle_id, frozenRecords, rawRequestBinding.delivery_mode);
      const frozenDeliveryHash = deliveryManifestHash(rawRequestBinding.bundle_id, frozenRecords, rawRequestBinding.delivery_mode);
      if (rawRequestBinding.material_manifest_sha256 !== frozenRawHash) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${provider} host request material hash is incomplete`);
      const workspace = join(runtime, "workspace");
      const workspaceRoot = realpathSync(workspace);
      const readOnce = (candidate, destination) => {
        const candidateRoot = realpathSync(candidate);
        if (candidateRoot === workspaceRoot || relative(workspaceRoot, candidateRoot).startsWith("..") || isAbsolute(relative(workspaceRoot, candidateRoot))) throw new Error("workspace candidate escapes runtime workspace");
        const target = resolve(candidateRoot, ...destination.split("/"));
        if (relative(candidateRoot, target).startsWith("..") || target === candidateRoot || lstatSync(target).isSymbolicLink() || realpathSync(target) !== target) throw new Error("unsafe workspace attachment");
        let descriptor; try {
          descriptor = openSync(target, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0)); const before = fstatSync(descriptor);
          if (!before.isFile() || before.nlink !== 1) throw new Error("workspace attachment is not a private regular file");
          const bytes = readFileSync(descriptor); const after = fstatSync(descriptor);
          if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs || bytes.length !== after.size) throw new Error("workspace attachment changed while reading");
          return bytes;
        } finally { if (descriptor !== undefined) closeSync(descriptor); }
      };
      const snapshotWorkspace = (candidate, declared, deliveryMode, internalBytes = null) => {
        try {
          const candidateRoot = realpathSync(candidate);
          if (candidateRoot === workspaceRoot || relative(workspaceRoot, candidateRoot).startsWith("..") || isAbsolute(relative(workspaceRoot, candidateRoot))) return null;
          const files = new Map();
          for (const item of declared) { const bytes = readOnce(candidateRoot, item.destination); if (bytes.length !== item.size || sha256(bytes) !== item.sha256.toLowerCase()) return null; files.set(item.destination, bytes); }
          const internal = JSON.parse((internalBytes ?? readOnce(candidateRoot, "attachments-manifest.json")).toString("utf8"));
          const computed = declared.map(({ destination: target, sha256: digest, size }) => ({ target, sha256: digest.toLowerCase(), size, embed: deliveryMode === "always_embed" }));
          if (internal?.version !== 1 || typeof internal.bundle_id !== "string" || !internal.bundle_id || canonical(internal.files) !== canonical(computed)
            || internal.manifest_hash !== materialManifestHash(internal.bundle_id, declared, deliveryMode)) return null;
          return { candidate, bundle_id: internal.bundle_id, files, internal, records: declared.map(({ destination, size }) => ({ destination, size, sha256: sha256(files.get(destination)) })) };
        } catch { return null; }
      };
      const candidates = readdirSync(workspace, { withFileTypes: true }).filter((entry) => entry.isDirectory() && (entry.name === provider || entry.name.startsWith(`${provider}-delta-`))).map((entry) => join(workspace, entry.name));
      const matched = candidates.map((candidate) => snapshotWorkspace(candidate, visible, delivery.delivery_mode)).filter(Boolean);
      if (matched.length !== 1) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${provider} derived workspace is missing or ambiguous`);
      const derivedSnapshot = matched[0]; const current = (state.continuation_materials ?? []).find((item) => item.provider_material_manifest_hash === delivery.material_manifest_hash && item.provider_sessions?.[provider] === stateProvider.session_id);
      const expectedBundleId = current?.bundle_id ?? state.attachments?.bundle_id;
      if (!expectedBundleId || derivedSnapshot.bundle_id !== expectedBundleId) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${provider} delivery bundle id is not bound to private broker state`);
      const rawCandidate = join(workspace, `raw-${derivedSnapshot.candidate.split("/").at(-1)}`); const rawInternalBytes = readOnce(rawCandidate, "attachments-manifest.json");
      const rawInternal = JSON.parse(rawInternalBytes.toString("utf8"));
      if (rawInternal?.version !== 1 || rawInternal.bundle_id !== expectedBundleId || !Array.isArray(rawInternal.files)) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${provider} raw workspace manifest is invalid`);
      const rawDeclared = rawInternal.files.map(({ target: destination, sha256: digest, size, embed }) => ({ destination, sha256: digest, size, embed }));
      if (rawDeclared.some((item) => item.embed !== (delivery.delivery_mode === "always_embed"))) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${provider} raw workspace delivery mode is invalid`);
      const rawSnapshot = snapshotWorkspace(rawCandidate, rawDeclared, delivery.delivery_mode, rawInternalBytes);
      if (!rawSnapshot || rawSnapshot.bundle_id !== expectedBundleId) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${provider} raw workspace is incomplete`);
      if (rawSnapshot.bundle_id !== rawRequestBinding.bundle_id || canonical(rawSnapshot.records) !== canonical(frozenRecords.map(({ destination, size, sha256: digest }) => ({ destination, size, sha256: digest })))) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${provider} raw workspace differs from the frozen host request`);
      const expectedRawHash = current?.manifest_hash ?? state.attachments?.manifest_hash;
      if (expectedRawHash !== delivery.raw_material_manifest_hash || rawInternal.manifest_hash !== expectedRawHash) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${provider} raw material hash is not bound to private broker state`);
      if (current) {
        if (rawRequestBinding.continuation?.sequence !== current.sequence || current.bundle_id !== rawRequestBinding.bundle_id || current.manifest_hash !== frozenRawHash || current.delivery_manifest_hash !== frozenDeliveryHash) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${provider} continuation raw delivery differs from the frozen host request`);
      } else if (rawRequestBinding.continuation !== null || state.attachments?.bundle_id !== rawRequestBinding.bundle_id || state.attachments?.requested_delivery !== rawRequestBinding.delivery_mode
        || state.attachments?.manifest_hash !== frozenRawHash || canonical(state.attachments?.files) !== canonical(frozenRecords.map(({ destination: target, sha256: digest, size, embed }) => ({ target, sha256: digest, size, embed })))) {
        throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${provider} initial raw delivery differs from the frozen host request`);
      }
      const roots = preparedRedactionRoots(state.attachments?.redaction_roots); const rootSetHash = redactionRootSetHash(roots);
      if (state.attachments?.redaction_root_set_hash !== rootSetHash || redaction.root_set_hash !== rootSetHash || redaction.rule_version !== state.attachments?.provider_material?.redaction?.rule_version) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${provider} redaction root set or rule is invalid`);
      const counts = new Map(); const expectedBytes = new Map();
      for (const [destination, bytes] of rawSnapshot.files) {
        if (["review-packet.v1.json", "manifest.json"].includes(destination)) continue;
        expectedBytes.set(destination, Buffer.from(replaceRegisteredRoots(bytes.toString("utf8"), roots, counts)));
      }
      let rawPacket; let rawManifest; let packet; let manifest;
      try {
        rawPacket = JSON.parse(rawSnapshot.files.get("review-packet.v1.json").toString("utf8")); rawManifest = JSON.parse(rawSnapshot.files.get("manifest.json").toString("utf8"));
        packet = JSON.parse(derivedSnapshot.files.get("review-packet.v1.json").toString("utf8")); manifest = JSON.parse(derivedSnapshot.files.get("manifest.json").toString("utf8"));
      } catch (error) { throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${provider} review triad is unreadable: ${error.message}`); }
      const expectedPacket = replaceRegisteredValue(rawPacket, roots, counts); const expectedManifest = replaceRegisteredValue(rawManifest, roots, counts);
      const stripPacket = (value) => { const output = structuredClone(value); for (const field of ["packet_hash", "manifest_hash", "diff_sha256"]) delete output[field]; return output; };
      const stripManifest = (value) => { const output = structuredClone(value); for (const field of ["packet_hash", "manifest_hash", "diff_sha256", "attachments", "delivery_manifest_hash", "inner_manifest_hash", "continuation"]) delete output[field]; return output; };
      if (canonical(stripPacket(expectedPacket)) !== canonical(stripPacket(packet)) || canonical(stripManifest(expectedManifest)) !== canonical(stripManifest(manifest))) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${provider} derived JSON payload is not the deterministic redaction of raw material`);
      for (const [destination, expected] of expectedBytes) if (!derivedSnapshot.files.get(destination)?.equals(expected)) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${provider} ${destination} is not the deterministic redaction of raw material`);
      for (const [destination, bytes] of derivedSnapshot.files) if (nextRootMatch(bytes.toString("utf8"), 0, roots)) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${provider} ${destination} retains a registered host root`);
      const rootReceipt = new Map(redaction.roots.map((item) => [item?.root_id, item])); const rootIds = [...new Set(roots.map((item) => item.root_id))];
      if (rootReceipt.size !== rootIds.length || rootIds.some((rootId) => { const item = rootReceipt.get(rootId); const root = roots.find((candidate) => candidate.root_id === rootId); return !item || item.token !== root.token || item.count !== (counts.get(rootId) ?? 0); })) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${provider} redaction root receipt is invalid`);
      const replacementCount = [...counts.values()].reduce((sum, count) => sum + count, 0); const bytesDiffer = [...rawSnapshot.files].some(([destination, bytes]) => !derivedSnapshot.files.get(destination)?.equals(bytes));
      if (redaction.replacement_count !== replacementCount || redaction.residual_scan !== "passed"
        || (delivery.material_representation === "raw" && (bytesDiffer || replacementCount !== 0))
        || (delivery.material_representation === "sanitized" && !bytesDiffer)) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${provider} material representation receipt is invalid`);
      const diff = derivedSnapshot.files.get("changes.diff");
      if (packet.packet_hash !== packetHash(packet) || packet.diff_sha256 !== sha256(diff) || packet.manifest_hash !== delivery.material_manifest_hash
        || manifest.packet_hash !== packet.packet_hash || manifest.diff_sha256 !== packet.diff_sha256 || manifest.manifest_hash !== packet.manifest_hash
        || manifest.inner_manifest_hash !== innerManifestHash(manifest) || canonical(manifest.attachments) !== canonical(visible.filter((item) => item.destination !== "manifest.json"))
        || manifest.delivery_manifest_hash !== deliveryManifestHash(expectedBundleId, visible, delivery.delivery_mode)
        || delivery.material_total_bytes !== [...derivedSnapshot.files.values()].reduce((total, bytes) => total + bytes.length, 0)
        || delivery.material_manifest_hash !== materialManifestHash(expectedBundleId, visible, delivery.delivery_mode)) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${provider} derived triad binding is invalid`);
      return { packet_hash: packet.packet_hash, manifest_hash: packet.manifest_hash, diff_sha256: packet.diff_sha256, delivery_manifest_hash: manifest.delivery_manifest_hash, continuation: manifest.continuation ?? null };
    };
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
    const providers = result.providers.map((item) => {
      if (!item || typeof item !== "object" || !providerId.test(item.provider ?? "") || !providerIds.has(item.provider)) return item;
      const privateState = state.providers[item.provider];
      const expectsRaw = item.status === "completed" || item.raw_stdout_sha256 !== undefined || item.raw_stderr_sha256 !== undefined;
      if (!privateState || typeof privateState !== "object") {
        if (expectsRaw) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${item.provider} has no private broker state`);
        return item;
      }
      const raw_stdout_ref = copyStream(item.provider, "stdout", privateState, item);
      const raw_stderr_ref = copyStream(item.provider, "stderr", privateState, item);
      if (expectsRaw && (!raw_stdout_ref || !raw_stderr_ref)) throw new Error(`BROKER_RAW_AUDIT_UNAVAILABLE: ${item.provider} lacks raw stream evidence`);
      const derived_attestation = item.status === "completed" && item.delivery ? materialAttestation(item.provider, privateState, item) : null;
      return { ...item, ...(derived_attestation ? { delivery: { ...privateState.delivery, derived_attestation } } : {}), ...(raw_stdout_ref ? { raw_stdout_ref } : {}), ...(raw_stderr_ref ? { raw_stderr_ref } : {}) };
    });
    return { ...result, providers };
  }
}
