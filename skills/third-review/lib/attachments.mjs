import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fail } from "./errors.mjs";
import { adapterForProviderId, providerRuntimeKey } from "./provider-ids.mjs";

const digest = (value) => createHash("sha256").update(value).digest("hex");
const storageKey = (provider) => providerRuntimeKey(provider) ?? provider;
const providerAdapter = (provider) => adapterForProviderId(provider) ?? provider;
export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
export function canonicalPacketHash(packet) { const { packet_hash: ignored, ...value } = packet; return digest(canonicalJson(value)); }
export function canonicalInnerManifestHash(manifest) { const { inner_manifest_hash: ignored, ...value } = manifest; return digest(canonicalJson(value)); }
export function canonicalDeliveryManifestHash(bundleId, files, deliveryMode) { return digest(canonicalJson({ version: 1, bundle_id: bundleId, delivery_mode: deliveryMode, files: files.filter((item) => item.target !== "manifest.json").map(({ target, sha256, size, embed }) => ({ target, sha256, size, embed })) })); }
export function canonicalWorkflowHubMaterialId(files) {
  // canonical-evidence.json is an authenticated transport/audit wrapper. Its
  // preflight binding refers to the semantic identity, so including it here
  // would make the broker disagree with WorkflowHub's frozen material id.
  const entries = files.filter((item) => !["manifest.json", "canonical-evidence.json"].includes(item.target))
    .map(({ target: path, size: bytes, sha256 }) => ({ path, bytes, sha256: sha256.toLowerCase() }))
    .sort((left, right) => Buffer.compare(Buffer.from(left.path, "utf8"), Buffer.from(right.path, "utf8")));
  return digest(JSON.stringify(entries));
}
function safe(value, label) {
  if (typeof value !== "string" || !value || value.includes("\\") || value.startsWith("~") || path.posix.isAbsolute(value) || value.split("/").some((part) => !part || part === "." || part === "..")) fail("ATTACHMENT_INVALID", `${label} must be a relative POSIX path`);
  return value;
}
function parseManifest(value) {
  if (!value || typeof value !== "object" || value.version !== 1 || typeof value.bundle_id !== "string" || !value.bundle_id || !Array.isArray(value.entries) || value.entries.length === 0) fail("ATTACHMENT_INVALID", "attachments manifest needs version, bundle_id, and entries");
  const destinations = new Set();
  return { bundle_id: value.bundle_id, entries: value.entries.map((entry) => {
    if (!entry || typeof entry !== "object") fail("ATTACHMENT_INVALID", "attachment entry must be an object");
    const source = safe(entry.source, "attachment source"); const target = safe(entry.destination, "attachment destination");
    if (destinations.has(target)) fail("ATTACHMENT_INVALID", `duplicate attachment destination: ${target}`); destinations.add(target);
    if (!Number.isSafeInteger(entry.size) || entry.size < 0 || typeof entry.sha256 !== "string" || !/^[a-f0-9]{64}$/i.test(entry.sha256) || typeof entry.embed !== "boolean") fail("ATTACHMENT_INVALID", `attachment ${target} needs size, sha256, and embed`);
    return { source, target, size: entry.size, sha256: entry.sha256.toLowerCase(), embed: entry.embed };
  }) };
}
function allowedRoot(input, roots) {
  if (typeof input !== "string" || !path.isAbsolute(input)) fail("ATTACHMENT_ROOT_FORBIDDEN", "attachments root must be an allowlisted absolute directory");
  let canonical;
  try { const stat = fs.lstatSync(input); if (!stat.isDirectory() || stat.isSymbolicLink()) fail("ATTACHMENT_ROOT_FORBIDDEN", "attachments root must be a real directory"); canonical = fs.realpathSync(input); }
  catch (error) { if (error?.code === "ATTACHMENT_ROOT_FORBIDDEN") throw error; fail("ATTACHMENT_ROOT_FORBIDDEN", "attachments root is unavailable"); }
  const policy = roots.find((item) => { try { return fs.realpathSync(item.root) === canonical; } catch { return false; } });
  if (!policy) fail("ATTACHMENT_ROOT_FORBIDDEN", "attachments root is not allowlisted");
  return { canonical, policy };
}
export function validateAttachmentRoot(input, roots) { return allowedRoot(input, roots); }
function allowedSource(source, policy) { if (!policy.sources.some((prefix) => source === prefix || source.startsWith(`${prefix}/`))) fail("ATTACHMENT_SOURCE_FORBIDDEN", `attachment source is not allowed: ${source}`); }
function contents(root, entry) {
  const parts = entry.source.split("/"); let file = root;
  try {
    for (let index = 0; index < parts.length; index += 1) { file = path.join(file, parts[index]); const stat = fs.lstatSync(file); if (stat.isSymbolicLink() || (index < parts.length - 1 && !stat.isDirectory())) fail("ATTACHMENT_INVALID", `unsafe attachment source: ${entry.source}`); }
    const fd = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
    try { const stat = fs.fstatSync(fd); if (!stat.isFile() || stat.nlink !== 1) fail("ATTACHMENT_INVALID", `attachment source must be a single-link regular file: ${entry.source}`); if (stat.size !== entry.size) fail("ATTACHMENT_HASH_MISMATCH", `attachment size differs: ${entry.target}`); const value = fs.readFileSync(fd); if (digest(value) !== entry.sha256) fail("ATTACHMENT_HASH_MISMATCH", `attachment hash differs: ${entry.target}`); return value; } finally { fs.closeSync(fd); }
  } catch (error) { if (error?.code?.startsWith("ATTACHMENT_")) throw error; fail("ATTACHMENT_INVALID", `attachment source is unreadable: ${entry.source}`); }
}
const records = (entries) => entries.map(({ target, sha256, size, embed }) => ({ target, sha256, size, embed }));
export const canonicalMaterialManifestHash = (bundle_id, files) => digest(canonicalJson({ version: 1, bundle_id, files: files.filter((item) => !["review-packet.v1.json", "manifest.json"].includes(item.target)).map(({ target, sha256, size, embed }) => ({ target, sha256, size, embed })) }));
function renderEmbedded(items) { return items.map((entry) => `<attachment destination="${entry.target}" sha256="${entry.sha256}">\n${entry.contents}\n</attachment>`).join("\n"); }
export function renderProviderPrompt(worker, prompt) {
  const instruction = typeof worker?.modelInstruction === "string" ? worker.modelInstruction.trim() : "";
  return instruction ? `${instruction}\n\n${prompt}` : prompt;
}
function json(bytes, label) { try { return JSON.parse(bytes.toString("utf8")); } catch { fail("MATERIAL_INCOMPLETE", `${label} must be valid JSON`); } }
function digestField(value, field, label) { if (typeof value?.[field] !== "string" || !/^[a-f0-9]{64}$/i.test(value[field])) fail("MATERIAL_INCOMPLETE", `${label} has no valid ${field}`); return value[field].toLowerCase(); }
function sameFiles(expected, actual) {
  if (!Array.isArray(actual) || actual.length !== expected.length) return false;
  const normalized = actual.map((item) => item && typeof item === "object" ? { destination: item.destination, sha256: item.sha256?.toLowerCase(), size: item.size } : null);
  return JSON.stringify(normalized) === JSON.stringify(expected);
}
function validateDeliveryFlags(checked) {
  const expectedEmbed = checked.requested_delivery === "always_embed";
  if (checked.files.some((item) => item.embed !== expectedEmbed)) fail("MATERIAL_INCOMPLETE", `${checked.requested_delivery} attachments must all set embed:${expectedEmbed}`);
}
export function validateFileOnlyTriad(checked) {
  validateDeliveryFlags(checked);
  const byTarget = new Map(checked.content_entries.map((entry) => [entry.target, entry]));
  for (const target of ["review-packet.v1.json", "changes.diff", "manifest.json"]) if (!byTarget.has(target)) fail("MATERIAL_INCOMPLETE", `file_only bundle is missing ${target}`);
  const packet = json(byTarget.get("review-packet.v1.json").contents, "review-packet.v1.json"); const inner = json(byTarget.get("manifest.json").contents, "manifest.json");
  if (packet.version !== "review-packet.v1") fail("MATERIAL_INCOMPLETE", "review-packet.v1.json has an unsupported version");
  const packetHash = digestField(packet, "packet_hash", "review-packet.v1.json"); const manifestHash = digestField(packet, "manifest_hash", "review-packet.v1.json"); const diffHash = digestField(packet, "diff_sha256", "review-packet.v1.json");
  if (packetHash !== canonicalPacketHash(packet)) fail("MATERIAL_INCOMPLETE", "review-packet.v1.json packet_hash is not canonical");
  if (inner.version !== "review-attachment-manifest.v1") fail("MATERIAL_INCOMPLETE", "manifest.json has an unsupported version");
  if (inner.delivery_mode !== checked.requested_delivery) fail("MATERIAL_INCOMPLETE", "manifest.json delivery_mode does not match the outer delivery request");
  if (manifestHash !== checked.manifest_hash || manifestHash !== digestField(inner, "manifest_hash", "manifest.json")) fail("MATERIAL_INCOMPLETE", "packet and manifest do not bind the outer material manifest");
  if (packetHash !== digestField(inner, "packet_hash", "manifest.json") || manifestHash !== digestField(inner, "manifest_hash", "manifest.json") || diffHash !== digestField(inner, "diff_sha256", "manifest.json")) fail("MATERIAL_INCOMPLETE", "packet and manifest hashes disagree");
  if (digestField(inner, "inner_manifest_hash", "manifest.json") !== canonicalInnerManifestHash(inner)) fail("MATERIAL_INCOMPLETE", "manifest.json inner_manifest_hash is not canonical");
  if (digestField(inner, "delivery_manifest_hash", "manifest.json") !== canonicalDeliveryManifestHash(checked.bundle_id, checked.files, checked.requested_delivery)) fail("MATERIAL_INCOMPLETE", "manifest.json delivery_manifest_hash does not bind the outer delivery manifest");
  if (digest(byTarget.get("changes.diff").contents) !== diffHash) fail("MATERIAL_INCOMPLETE", "changes.diff hash does not match packet");
  const expected = checked.files.filter((item) => item.target !== "manifest.json").map(({ target, sha256, size }) => ({ destination: target, sha256, size }));
  if (!sameFiles(expected, inner.attachments)) fail("MATERIAL_INCOMPLETE", "manifest attachment coverage does not match delivered bundle");
  return { packet_hash: packetHash, manifest_hash: manifestHash, diff_sha256: diffHash };
}
export function validateContinuationTriad(checked, initial) {
  validateFileOnlyTriad(checked);
  const initialMaterialHash = initial?.attachments?.manifest_hash;
  if (typeof initialMaterialHash !== "string" || !/^[a-f0-9]{64}$/i.test(initialMaterialHash)) fail("MATERIAL_INCOMPLETE", "continuation has no trusted initial material hash");
  const inner = json(checked.content_entries.find((entry) => entry.target === "manifest.json")?.contents, "manifest.json"); const binding = inner.continuation;
  if (!binding || typeof binding !== "object" || binding.initial_material_manifest_hash !== initialMaterialHash || !Number.isSafeInteger(binding.sequence) || binding.sequence < 1) fail("MATERIAL_INCOMPLETE", "continuation manifest does not bind the initial material");
  const previous = Array.isArray(initial.continuation_materials) ? initial.continuation_materials : [];
  if (binding.sequence !== previous.length + 1) fail("MATERIAL_INCOMPLETE", "continuation delta sequence is out of order");
  const expectedPrevious = previous.length ? previous.at(-1).delivery_manifest_hash : null;
  if (binding.previous_delivery_manifest_hash !== expectedPrevious) fail("MATERIAL_INCOMPLETE", "continuation manifest predecessor does not match");
  return { sequence: binding.sequence, delivery_manifest_hash: digestField(inner, "delivery_manifest_hash", "manifest.json") };
}
export function validateAttachments(input, _maxBytes, roots) {
  if (!input || typeof input !== "object" || !["file_only", "always_embed", "negotiated"].includes(input.delivery)) fail("ATTACHMENT_DELIVERY_UNSUPPORTED", "attachment delivery must be file_only, always_embed, or negotiated");
  const { canonical, policy } = allowedRoot(input.root, roots); const parsed = parseManifest(input.manifest); let total = 0; const values = [];
  for (const entry of parsed.entries) { allowedSource(entry.source, policy); total += entry.size; values.push({ ...entry, contents: contents(canonical, entry) }); }
  const files = records(parsed.entries);
  return { root: canonical, requested_delivery: input.delivery, bundle_id: parsed.bundle_id, entries: parsed.entries, files, manifest_hash: canonicalMaterialManifestHash(parsed.bundle_id, files), material_id: canonicalWorkflowHubMaterialId(files), total_bytes: total, content_entries: values };
}
export function planDelivery(worker, checked, prompt, _maxPromptBytes, { requireTriad = true } = {}) {
  const requested = checked.requested_delivery;
  if (requested === "negotiated") {
    if (checked.files.some((item) => item.embed)) fail("MATERIAL_INCOMPLETE", "negotiated attachments must use embed:false as the shared material identity");
  } else if (requireTriad) validateFileOnlyTriad(checked);
  else validateDeliveryFlags(checked);
  const supported = worker.capabilities?.attachment_delivery ?? [];
  const delivery = requested === "negotiated"
    ? supported.includes("file_only") ? "file_only" : supported.includes("always_embed") ? "always_embed" : null
    : requested;
  if (!delivery || !supported.includes(delivery)) fail("ATTACHMENT_DELIVERY_UNSUPPORTED", `provider cannot accept requested attachment delivery ${requested}`);
  const resolved = {
    ...checked,
    requested_delivery: delivery,
    entries: checked.entries.map((entry) => ({ ...entry, embed: delivery === "always_embed" })),
    files: checked.files.map((entry) => ({ ...entry, embed: delivery === "always_embed" })),
  };
  if (delivery === "file_only") validateDeliveryFlags(resolved);
  const provider_visible_attachment_manifest = checked.files.map(({ target: destination, sha256, size }) => ({ destination, sha256, size }));
  const basePrompt = renderProviderPrompt(worker, prompt);
  if (delivery === "file_only") {
    return { delivery_mode: "file_only", provider_prompt: basePrompt, material_manifest_hash: checked.manifest_hash, material_total_bytes: checked.total_bytes, provider_visible_attachment_manifest };
  }
  const embedded = renderEmbedded(checked.content_entries.map((entry) => ({ ...entry, contents: entry.contents.toString("utf8") })));
  const provider_prompt = `${basePrompt}\n\n<attachments mode="always_embed">\n${embedded}\n</attachments>`;
  const bytes = Buffer.byteLength(provider_prompt, "utf8");
  return { delivery_mode: "always_embed", provider_prompt, material_manifest_hash: checked.manifest_hash, material_total_bytes: checked.total_bytes, rendered_prompt_bytes: bytes, provider_visible_attachment_manifest };
}
function writeManifest(directory, stored) { fs.writeFileSync(path.join(directory, "attachments-manifest.json"), `${JSON.stringify({ version: 1, bundle_id: stored.bundle_id, manifest_hash: stored.manifest_hash, files: stored.files })}\n`, { mode: 0o400, flag: "wx" }); }
function lockTree(directory) { for (const item of fs.readdirSync(directory, { withFileTypes: true })) { const target = path.join(directory, item.name); if (item.isDirectory()) { lockTree(target); fs.chmodSync(target, 0o500); } else fs.chmodSync(target, 0o400); } fs.chmodSync(directory, 0o500); }
function unlockTree(directory) { try { for (const item of fs.readdirSync(directory, { withFileTypes: true })) if (item.isDirectory()) unlockTree(path.join(directory, item.name)); fs.chmodSync(directory, 0o700); } catch { /* probe cleanup is best effort */ } }
function verifyTree(directory, stored) {
  const manifest = path.join(directory, "attachments-manifest.json");
  const root = fs.lstatSync(directory); if (!root.isDirectory() || root.isSymbolicLink()) fail("ATTACHMENT_IMMUTABLE", "frozen attachment root changed");
  const saved = JSON.parse(fs.readFileSync(manifest, "utf8")); if (saved.bundle_id !== stored.bundle_id || saved.manifest_hash !== stored.manifest_hash || JSON.stringify(saved.files) !== JSON.stringify(stored.files)) fail("ATTACHMENT_IMMUTABLE", "frozen attachment manifest changed");
  for (const item of stored.files) { const file = path.join(directory, ...item.target.split("/")); const stat = fs.lstatSync(file); const value = fs.readFileSync(file); if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.size !== item.size || digest(value) !== item.sha256) fail("ATTACHMENT_IMMUTABLE", `frozen attachment changed: ${item.target}`); }
  return {};
}
export function prepareCheckedAttachments(checked, runtime, provider) {
  const key = storageKey(provider); const workspace = path.join(runtime, "workspace"); const cwd = path.join(workspace, key); fs.mkdirSync(workspace, { recursive: true, mode: 0o700 }); if (fs.existsSync(cwd)) fail("ATTACHMENT_IMMUTABLE", "provider workspace already exists");
  const staging = path.join(workspace, `.${key}-${randomUUID()}`); fs.mkdirSync(staging, { recursive: true, mode: 0o700 });
  try { for (const entry of checked.content_entries) { const target = path.join(staging, ...entry.target.split("/")); fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 }); fs.writeFileSync(target, entry.contents, { mode: 0o400, flag: "wx" }); } if (providerAdapter(provider) === "kimi") { const skills = path.join(staging, "skills"); if (fs.existsSync(skills) && !fs.lstatSync(skills).isDirectory()) fail("ATTACHMENT_INVALID", "Kimi skills destination must be a directory"); fs.mkdirSync(skills, { recursive: true, mode: 0o700 }); } writeManifest(staging, checked); lockTree(staging); fs.renameSync(staging, cwd); } catch (error) { fs.rmSync(staging, { recursive: true, force: true }); throw error; }
  return { cwd, ...checked };
}
export function prepareAttachments(input, runtime, provider, maxBytes, roots) { return prepareCheckedAttachments(validateAttachments(input, maxBytes, roots), runtime, provider); }
// A managed review must survive the process that supplied its source packet.
// Freeze one broker-private, source-shaped copy before the detached manager is
// started.  Later provider-specific copies still use prepareCheckedAttachments
// and retain their existing immutable-workspace guarantees.
export function freezeManagedAttachments(checked, runtime, operationId) {
  const base = path.join(runtime, "managed", "materials"); const directory = path.join(base, operationId);
  if (fs.existsSync(directory)) fail("ATTACHMENT_IMMUTABLE", "managed attachment material already exists");
  const staging = path.join(base, `.${operationId}-${randomUUID()}`); fs.mkdirSync(staging, { recursive: true, mode: 0o700 });
  try {
    for (const entry of checked.content_entries) {
      const target = path.join(staging, ...entry.target.split("/")); fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
      fs.writeFileSync(target, entry.contents, { mode: 0o400, flag: "wx" });
    }
    const manifest = {
      version: 1,
      bundle_id: checked.bundle_id,
      entries: checked.entries.map((entry) => ({ source: entry.target, destination: entry.target, size: entry.size, sha256: entry.sha256, embed: entry.embed })),
    };
    fs.writeFileSync(path.join(staging, "managed-request.json"), `${JSON.stringify(manifest)}\n`, { mode: 0o400, flag: "wx" });
    lockTree(staging); fs.renameSync(staging, directory);
    return { root: directory, delivery: checked.requested_delivery, manifest };
  } catch (error) { unlockTree(staging); fs.rmSync(staging, { recursive: true, force: true }); throw error; }
}
export function discardManagedAttachments(runtime, operationId) {
  const directory = path.join(runtime, "managed", "materials", operationId);
  if (!fs.existsSync(directory)) return;
  unlockTree(directory); fs.rmSync(directory, { recursive: true, force: true });
}
export function verifyFrozenAttachments(runtime, provider, stored) {
  if (!stored) fail("ATTACHMENT_IMMUTABLE", "runtime has no frozen attachments"); const cwd = path.join(runtime, "workspace", storageKey(provider));
  try { return { cwd, ...verifyTree(cwd, stored) }; }
  catch (error) { if (error?.code === "ATTACHMENT_IMMUTABLE") throw error; fail("ATTACHMENT_IMMUTABLE", "frozen attachment workspace is unavailable"); }
}
export function prepareWritableAttachmentView(runtime, provider, stored) {
  const key = storageKey(provider); const frozen = verifyFrozenAttachments(runtime, provider, stored); const cwd = path.join(runtime, "work", key); const bundle = path.join(cwd, "bundle"); fs.mkdirSync(cwd, { recursive: true, mode: 0o700 }); fs.chmodSync(cwd, 0o700);
  if (fs.existsSync(bundle)) { try { verifyTree(bundle, stored); return { cwd, bundle }; } catch (error) { if (error?.code === "ATTACHMENT_IMMUTABLE") throw error; fail("ATTACHMENT_IMMUTABLE", "provider bundle view is unavailable"); } }
  const staging = path.join(cwd, `.bundle-${randomUUID()}`); fs.mkdirSync(staging, { mode: 0o700 });
  try { for (const item of stored.files) { const source = path.join(frozen.cwd, ...item.target.split("/")); const target = path.join(staging, ...item.target.split("/")); fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 }); fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL); fs.chmodSync(target, 0o400); } if (providerAdapter(provider) === "kimi") fs.mkdirSync(path.join(staging, "skills"), { recursive: true, mode: 0o700 }); writeManifest(staging, stored); lockTree(staging); fs.renameSync(staging, bundle); }
  catch (error) { fs.rmSync(staging, { recursive: true, force: true }); throw error; }
  return { cwd, bundle };
}
export function verifyWritableAttachmentView(runtime, provider, stored) {
  const cwd = path.join(runtime, "work", storageKey(provider)); const bundle = path.join(cwd, "bundle");
  try { if (!fs.statSync(cwd).isDirectory()) fail("ATTACHMENT_IMMUTABLE", "provider writable workspace is unavailable"); verifyTree(bundle, stored); return { cwd, bundle }; }
  catch (error) { if (error?.code === "ATTACHMENT_IMMUTABLE") throw error; fail("ATTACHMENT_IMMUTABLE", "provider bundle view is unavailable"); }
}
export function refreshWritableAttachmentView(runtime, provider, sourceProvider, stored) {
  const frozen = verifyFrozenAttachments(runtime, sourceProvider, stored); const cwd = path.join(runtime, "work", storageKey(provider)); const bundle = path.join(cwd, "bundle"); fs.mkdirSync(cwd, { recursive: true, mode: 0o700 }); fs.chmodSync(cwd, 0o700);
  if (fs.existsSync(bundle)) { try { verifyTree(bundle, stored); return { cwd, bundle }; } catch { /* replace only from the verified frozen source */ } }
  const staging = path.join(cwd, `.bundle-next-${randomUUID()}`); const backup = path.join(cwd, `.bundle-old-${randomUUID()}`); fs.mkdirSync(staging, { mode: 0o700 }); let movedOld = false;
  try {
    for (const item of stored.files) { const source = path.join(frozen.cwd, ...item.target.split("/")); const target = path.join(staging, ...item.target.split("/")); fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 }); fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL); fs.chmodSync(target, 0o400); }
    writeManifest(staging, stored); lockTree(staging); verifyTree(staging, stored);
    if (fs.existsSync(bundle)) { fs.renameSync(bundle, backup); movedOld = true; }
    fs.renameSync(staging, bundle); verifyTree(bundle, stored);
    if (movedOld) { unlockTree(backup); fs.rmSync(backup, { recursive: true, force: true }); }
    return { cwd, bundle };
  } catch (error) {
    if (!fs.existsSync(bundle) && movedOld && fs.existsSync(backup)) fs.renameSync(backup, bundle);
    if (fs.existsSync(staging)) { unlockTree(staging); fs.rmSync(staging, { recursive: true, force: true }); }
    throw error;
  }
}
// Doctor must prove the filesystem half of attachment delivery without
// consulting a provider.  Use the production copy/lock/verify paths with a
// harmless, broker-owned file so an empty packet root is not mutated merely
// by a readiness check.
export function probeAttachmentWorkspace(runtime, provider, maxBytes) {
  let root = null;
  try {
    root = fs.mkdtempSync(path.join(runtime, "attachment-probe-"));
    const source = path.join(root, "source"); const payload = "x";
    fs.mkdirSync(source, { mode: 0o700 }); fs.writeFileSync(path.join(source, "probe.txt"), payload, { mode: 0o600, flag: "wx" });
    const manifest = { version: 1, bundle_id: `doctor-${randomUUID()}`, entries: [{ source: "probe.txt", destination: "probe.txt", size: Buffer.byteLength(payload), sha256: digest(payload), embed: true }] };
    const input = { root: source, delivery: "file_only", manifest };
    const allowlist = [{ root: source, sources: ["probe.txt"] }];
    const frozen = prepareAttachments(input, root, provider, maxBytes, allowlist);
    const stored = { bundle_id: frozen.bundle_id, manifest_hash: frozen.manifest_hash, files: frozen.files };
    verifyFrozenAttachments(root, provider, stored);
    const writable = prepareWritableAttachmentView(root, provider, stored);
    if (!fs.statSync(writable.cwd).isDirectory() || !fs.statSync(writable.bundle).isDirectory()) fail("ATTACHMENT_PROBE_FAILED", "private attachment workspace is unavailable");
    verifyTree(writable.bundle, stored);
  } catch (error) {
    if (error?.code === "ATTACHMENT_PROBE_FAILED") throw error;
    fail("ATTACHMENT_PROBE_FAILED", "attachment workspace probe failed");
  } finally { if (root) { unlockTree(root); fs.rmSync(root, { recursive: true, force: true, maxRetries: 2 }); } }
}
