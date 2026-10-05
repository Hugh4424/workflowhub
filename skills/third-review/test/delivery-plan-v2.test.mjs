import { fileURLToPath as migratedFilePath } from "node:url";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";
import { canonicalDeliveryManifestHash, canonicalInnerManifestHash, canonicalMaterialManifestHash, canonicalPacketHash, planDelivery, validateAttachments, validateContinuationTriad, validateFileOnlyTriad } from "../lib/attachments.mjs";
import { Broker } from "../lib/broker.mjs";
import { loadConfig, validateConfig } from "../lib/config.mjs";
import { terminateProcessTree } from "../lib/runtime.mjs";
import opencode from "../lib/adapters/opencode.mjs";

const sha = (value) => createHash("sha256").update(value).digest("hex");
const temp = () => fs.mkdtempSync(path.join(os.tmpdir(), "3rd-review-delivery-plan-v2-"));
const opencodeCli = migratedFilePath(new URL("../test/fake-opencode-run-cli.mjs", import.meta.url));
const codexAppServer = migratedFilePath(new URL("../test/fake-codex-app-server.mjs", import.meta.url));
const silent = migratedFilePath(new URL("../test/silent-cli.mjs", import.meta.url));
// A health probe is advisory. These continuation tests model an actual
// provider death, which is the only source of PROCESS_DEAD.
const deadHealth = { onStart: (pid) => setTimeout(() => { terminateProcessTree(pid, "SIGTERM"); }, 20) };

function source(label = "", delivery = "file_only", bundleId = "v2") {
  const root = temp();
  const diff = `DIFF_HEAD\n${"x".repeat(24 * 1024)}\nDIFF_MIDDLE\n${"y".repeat(24 * 1024)}\nDIFF_TAIL\n${label}`;
  const embed = delivery === "always_embed"; const packet = { version: "review-packet.v1", manifest_hash: canonicalMaterialManifestHash(bundleId, [{ target: "changes.diff", sha256: sha(diff), size: Buffer.byteLength(diff), embed }]), diff_sha256: sha(diff) }; packet.packet_hash = canonicalPacketHash(packet);
  const files = [["review-packet.v1.json", `${JSON.stringify(packet)}\n`], ["changes.diff", diff]];
  for (const [name, value] of files) {
    const file = path.join(root, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, value);
  }
  const attachments = files.map(([destination, value]) => ({ destination, sha256: sha(value), size: Buffer.byteLength(value) }));
  const outerFiles = [...attachments.map(({ destination: target, sha256, size }) => ({ target, sha256, size, embed })), { target: "manifest.json", sha256: "0".repeat(64), size: 0, embed }];
  const manifest = { version: "review-attachment-manifest.v1", delivery_mode: delivery, packet_hash: packet.packet_hash, manifest_hash: packet.manifest_hash, diff_sha256: packet.diff_sha256, attachments, delivery_manifest_hash: canonicalDeliveryManifestHash(bundleId, outerFiles, delivery) }; manifest.inner_manifest_hash = canonicalInnerManifestHash(manifest);
  fs.writeFileSync(path.join(root, "manifest.json"), `${JSON.stringify(manifest)}\n`);
  const all = [...files, ["manifest.json", `${JSON.stringify(manifest)}\n`]];
  return {
    root,
    packet,
    attachmentManifest: { version: 1, bundle_id: bundleId, entries: all.map(([source, value]) => ({ source, destination: source, size: Buffer.byteLength(value), sha256: sha(value), embed })) },
  };
}

function config(runtime, root, provider, maxPromptBytes = 1024 * 1024) {
  return validateConfig({ version: 4, runtime: { root: runtime, ttl_hours: 24, max_prompt_bytes: maxPromptBytes, max_output_bytes: 100_000, max_attachment_bytes: 2 * 1024 * 1024, liveness_interval_ms: 5, orphan_timeout_ms: 100 }, attachment_roots: [{ root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] }], tiers: [[provider]], providers: { [provider]: { enabled: true, command: provider === "codex" ? codexAppServer : opencodeCli, model: null, effort: null, thinking: null, auth: { type: "native" }, env: [] } } });
}

function continuationDelta(initialMaterialHash, sequence = 1, previous_delivery_manifest_hash = null, label = "", delivery = "file_only", bundleId = "v2") {
  const delta = source(label, delivery, bundleId); const innerPath = path.join(delta.root, "manifest.json"); const inner = JSON.parse(fs.readFileSync(innerPath, "utf8")); inner.continuation = { initial_material_manifest_hash: initialMaterialHash, sequence, previous_delivery_manifest_hash }; inner.inner_manifest_hash = canonicalInnerManifestHash(inner); fs.writeFileSync(innerPath, `${JSON.stringify(inner)}\n`); const entry = delta.attachmentManifest.entries.find((item) => item.destination === "manifest.json"); const bytes = fs.readFileSync(innerPath); entry.size = bytes.length; entry.sha256 = sha(bytes); return delta;
}

test("legacy file_only sandbox configuration is rejected", () => {
  assert.throws(() => validateConfig({ version: 4, runtime: {}, file_only_sandbox: { required: true }, tiers: [["opencode"]], providers: { opencode: { command: opencodeCli, auth: { type: "native" } } } }), { code: "CONFIG_INVALID" });
});

test("loaded broker config is frozen so caller mutation cannot alter a capability fingerprint", () => {
  const input = source(); const raw = config(temp(), input.root, "opencode"); const file = path.join(temp(), "caller-config.json"); fs.writeFileSync(file, JSON.stringify(raw), { mode: 0o600 }); const loaded = loadConfig(file);
  assert.ok(Object.isFrozen(loaded)); assert.ok(Object.isFrozen(loaded.runtime)); assert.throws(() => { loaded.runtime.root = "/attacker"; }, TypeError);
});

test("file_only starts OpenCode in a frozen provider-private workspace", async () => {
  const input = source(); const runtime = temp();
  const result = await new Broker(config(runtime, input.root, "opencode")).run({ version: 4, host_provider: "codex", prompt: "SHORT_REVIEW_INSTRUCTION", continuation: null, attachments: { root: input.root, delivery: "file_only", manifest: input.attachmentManifest } });
  assert.equal(result.providers[0].status, "completed");
  assert.equal(result.providers[0].delivery_used, "file_only");
  assert.equal(typeof result.providers[0].session_id, "string");
});

test("file_only reaches Codex through its provider workspace", async () => {
  const input = source(); const result = await new Broker(config(temp(), input.root, "codex")).run({ version: 4, host_provider: "kimi", prompt: "review", continuation: null, attachments: { root: input.root, delivery: "file_only", manifest: input.attachmentManifest } });
  assert.equal(result.providers[0].status, "completed");
  assert.equal(result.providers[0].delivery_used, "file_only");
  assert.equal(result.providers[0].delivery?.byte_identity, "verified");
});

test("file_only records exact delivery before provider execution", async () => {
  const input = source(); const result = await new Broker(config(temp(), input.root, "opencode")).run({ version: 4, host_provider: "codex", prompt: "review", continuation: null, attachments: { root: input.root, delivery: "file_only", manifest: input.attachmentManifest } });
  assert.equal(result.providers[0].status, "completed");
  assert.equal(result.providers[0].delivery_used, "file_only");
  assert.equal(result.providers[0].delivery.byte_identity, "verified");
  assert.equal(result.providers[0].delivery.sealed_manifest_hash, result.providers[0].delivery.provider_visible_manifest_hash);
});

test("file_only rejects a triad whose inner manifest omits a delivered file", async () => {
  const input = source(); const invalid = JSON.parse(fs.readFileSync(path.join(input.root, "manifest.json"), "utf8"));
  invalid.attachments.pop(); fs.writeFileSync(path.join(input.root, "manifest.json"), `${JSON.stringify(invalid)}\n`);
  const manifestEntry = input.attachmentManifest.entries.find((item) => item.destination === "manifest.json"); const bytes = fs.readFileSync(path.join(input.root, "manifest.json")); manifestEntry.size = bytes.length; manifestEntry.sha256 = sha(bytes);
  await assert.rejects(() => new Broker(config(temp(), input.root, "kimi")).run({ version: 4, host_provider: "codex", prompt: "review", continuation: null, attachments: { root: input.root, delivery: "file_only", manifest: input.attachmentManifest } }), { code: "MATERIAL_INCOMPLETE" });
});

test("file_only rejects a paired packet and inner-manifest forgery even when the diff is unchanged", async () => {
  const input = source(); const packetPath = path.join(input.root, "review-packet.v1.json"); const packet = JSON.parse(fs.readFileSync(packetPath, "utf8")); packet.acceptance_design_excerpt = "FORGED_PACKET_CONTEXT"; fs.writeFileSync(packetPath, `${JSON.stringify(packet)}\n`);
  const packetEntry = input.attachmentManifest.entries.find((item) => item.destination === "review-packet.v1.json"); const bytes = fs.readFileSync(packetPath); packetEntry.size = bytes.length; packetEntry.sha256 = sha(bytes); const innerPath = path.join(input.root, "manifest.json"); const inner = JSON.parse(fs.readFileSync(innerPath, "utf8")); const innerPacket = inner.attachments.find((item) => item.destination === "review-packet.v1.json"); innerPacket.size = bytes.length; innerPacket.sha256 = sha(bytes); const outerFiles = input.attachmentManifest.entries.map(({ destination: target, sha256, size, embed }) => ({ target, sha256, size, embed })); inner.delivery_manifest_hash = canonicalDeliveryManifestHash(input.attachmentManifest.bundle_id, outerFiles, "file_only"); inner.inner_manifest_hash = canonicalInnerManifestHash(inner); fs.writeFileSync(innerPath, `${JSON.stringify(inner)}\n`); const innerEntry = input.attachmentManifest.entries.find((item) => item.destination === "manifest.json"); const innerBytes = fs.readFileSync(innerPath); innerEntry.size = innerBytes.length; innerEntry.sha256 = sha(innerBytes);
  await assert.rejects(() => new Broker(config(temp(), input.root, "opencode")).run({ version: 4, host_provider: "codex", prompt: "review", continuation: null, attachments: { root: input.root, delivery: "file_only", manifest: input.attachmentManifest } }), { code: "MATERIAL_INCOMPLETE" });
});

test("file_only outer canonical binds delivery mode and embed semantics", () => {
  const input = source(); input.attachmentManifest.entries.find((item) => item.destination === "changes.diff").embed = true;
  const checked = validateAttachments({ root: input.root, delivery: "file_only", manifest: input.attachmentManifest }, 2 * 1024 * 1024, [{ root: input.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] }]);
  assert.throws(() => validateFileOnlyTriad(checked), { code: "MATERIAL_INCOMPLETE" });
});

test("always_embed requires the same complete hash-bound triad", () => {
  const input = source("", "always_embed"); const roots = [{ root: input.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] }]; const worker = { capabilities: { attachment_delivery: ["always_embed"] } };
  const incomplete = { ...input.attachmentManifest, entries: input.attachmentManifest.entries.filter((entry) => entry.destination !== "manifest.json") }; const checkedIncomplete = validateAttachments({ root: input.root, delivery: "always_embed", manifest: incomplete }, 2 * 1024 * 1024, roots); assert.throws(() => planDelivery(worker, checkedIncomplete, "review", 1024 * 1024), { code: "MATERIAL_INCOMPLETE" });
  const forged = JSON.parse(fs.readFileSync(path.join(input.root, "review-packet.v1.json"), "utf8")); forged.packet_hash = "0".repeat(64); fs.writeFileSync(path.join(input.root, "review-packet.v1.json"), `${JSON.stringify(forged)}\n`); const entry = input.attachmentManifest.entries.find((item) => item.destination === "review-packet.v1.json"); const bytes = fs.readFileSync(path.join(input.root, "review-packet.v1.json")); entry.size = bytes.length; entry.sha256 = sha(bytes); const checkedForged = validateAttachments({ root: input.root, delivery: "always_embed", manifest: input.attachmentManifest }, 2 * 1024 * 1024, roots); assert.throws(() => planDelivery(worker, checkedForged, "review", 1024 * 1024), { code: "MATERIAL_INCOMPLETE" });
  const mismatched = source(); const mismatchRoots = [{ root: mismatched.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] }]; const checkedMismatch = validateAttachments({ root: mismatched.root, delivery: "always_embed", manifest: mismatched.attachmentManifest }, 2 * 1024 * 1024, mismatchRoots); assert.throws(() => planDelivery(worker, checkedMismatch, "review", 1024 * 1024), { code: "MATERIAL_INCOMPLETE" });
  const nonEmbedded = source("", "always_embed"); nonEmbedded.attachmentManifest.entries.find((entry) => entry.destination === "changes.diff").embed = false; const checkedNonEmbedded = validateAttachments({ root: nonEmbedded.root, delivery: "always_embed", manifest: nonEmbedded.attachmentManifest }, 2 * 1024 * 1024, [{ root: nonEmbedded.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] }]); assert.throws(() => planDelivery(worker, checkedNonEmbedded, "review", 1024 * 1024), { code: "MATERIAL_INCOMPLETE" });
});

test("continuation delta triad binds the initial material hash and ordered predecessor", () => {
  const initial = source(); const roots = [{ root: initial.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] }]; const initialChecked = validateAttachments({ root: initial.root, delivery: "file_only", manifest: initial.attachmentManifest }, 2 * 1024 * 1024, roots);
  assert.throws(() => validateContinuationTriad(initialChecked, { attachments: { manifest_hash: initialChecked.manifest_hash }, continuation_materials: [] }), { code: "MATERIAL_INCOMPLETE" });
  const delta = source(); const innerPath = path.join(delta.root, "manifest.json"); const inner = JSON.parse(fs.readFileSync(innerPath, "utf8")); inner.continuation = { initial_material_manifest_hash: initialChecked.manifest_hash, sequence: 1, previous_delivery_manifest_hash: null }; inner.inner_manifest_hash = canonicalInnerManifestHash(inner); fs.writeFileSync(innerPath, `${JSON.stringify(inner)}\n`); const entry = delta.attachmentManifest.entries.find((item) => item.destination === "manifest.json"); const bytes = fs.readFileSync(innerPath); entry.size = bytes.length; entry.sha256 = sha(bytes);
  const checked = validateAttachments({ root: delta.root, delivery: "file_only", manifest: delta.attachmentManifest }, 2 * 1024 * 1024, [{ root: delta.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] }]);
  assert.doesNotThrow(() => validateContinuationTriad(checked, { attachments: { manifest_hash: initialChecked.manifest_hash }, continuation_materials: [] }));
  assert.throws(() => validateContinuationTriad(checked, { attachments: { manifest_hash: "0".repeat(64) }, continuation_materials: [] }), { code: "MATERIAL_INCOMPLETE" });
  assert.throws(() => validateContinuationTriad(checked, { attachments: { manifest_hash: initialChecked.manifest_hash }, continuation_materials: [{ delivery_manifest_hash: "f".repeat(64) }] }), { code: "MATERIAL_INCOMPLETE" });
});

test("real Broker R2 accepts a validated file_only delta without a sandbox wrapper", async () => {
  const initial = source("", "always_embed"); const delta = continuationDelta("0".repeat(64)); const runtime = temp(); const value = config(runtime, initial.root, "opencode"); value.attachment_roots.push({ root: delta.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] }); const broker = new Broker(value); const first = await broker.run({ version: 4, host_provider: "codex", prompt: "initial", continuation: null, attachments: { root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest } }); assert.equal(first.providers[0].status, "completed");
  const initialChecked = validateAttachments({ root: initial.root, delivery: "file_only", manifest: initial.attachmentManifest }, 2 * 1024 * 1024, [{ root: initial.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] }]); const statePath = path.join(runtime, first.runtime_id, "state.json"); const state = JSON.parse(fs.readFileSync(statePath, "utf8")); state.attachments = { ...state.attachments, requested_delivery: "file_only", bundle_id: initialChecked.bundle_id, manifest_hash: initialChecked.manifest_hash, files: initialChecked.files }; fs.writeFileSync(statePath, `${JSON.stringify(state)}\n`);
  const rebound = continuationDelta(initialChecked.manifest_hash); value.attachment_roots.push({ root: rebound.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] }); const result = await broker.run({ version: 4, host_provider: "codex", prompt: "R2_SHORT_INSTRUCTION", continuation: { runtime_id: first.runtime_id }, attachments: { root: rebound.root, delivery: "file_only", manifest: rebound.attachmentManifest } });
  assert.equal(result.providers[0].status, "completed");
  const after = JSON.parse(fs.readFileSync(statePath, "utf8")); assert.equal(after.continuation_materials.length, 1);
});

test("OpenCode R2 keeps its R1 execution cwd while atomically refreshing bundle to the delta", async () => {
  const initial = source("R1_ONLY", "file_only", "stable-r1"); const runtime = temp(); const value = config(runtime, initial.root, "opencode"); const initialChecked = validateAttachments({ root: initial.root, delivery: "file_only", manifest: initial.attachmentManifest }, 2 * 1024 * 1024, value.attachment_roots); const delta = continuationDelta(initialChecked.manifest_hash, 1, null, "R2_CURRENT", "file_only", "stable-r2"); value.attachment_roots.push({ root: delta.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] }); const broker = new Broker(value);
  const first = await broker.run({ version: 4, host_provider: "codex", prompt: "R1", continuation: null, attachments: { root: initial.root, delivery: "file_only", manifest: initial.attachmentManifest } }); const firstOutput = JSON.parse(first.providers[0].output);
  const second = await broker.run({ version: 4, host_provider: "codex", prompt: "R2", continuation: { runtime_id: first.runtime_id }, attachments: { root: delta.root, delivery: "file_only", manifest: delta.attachmentManifest } }); const secondOutput = JSON.parse(second.providers[0].output);
  assert.equal(second.providers[0].status, "completed"); assert.equal(secondOutput.cwd_sha256, firstOutput.cwd_sha256); assert.equal(firstOutput.cwd_sha256, sha(fs.realpathSync(path.join(runtime, first.runtime_id, "work", "opencode", "bundle")))); assert.equal(firstOutput.has_triage_files, true); assert.equal(secondOutput.has_triage_files, true); assert.match(fs.readFileSync(path.join(runtime, first.runtime_id, "work", "opencode", "bundle", "changes.diff"), "utf8"), /R2_CURRENT/);
  assert.match(fs.readFileSync(path.join(runtime, first.runtime_id, "workspace", "opencode", "changes.diff"), "utf8"), /R1_ONLY/); assert.match(fs.readFileSync(path.join(runtime, first.runtime_id, "workspace", "opencode-delta-2", "changes.diff"), "utf8"), /R2_CURRENT/);
});

test("always_embed R2 reuses its native session and records an ordered hash-bound delta", async () => {
  const initial = source("", "always_embed", "r1-bundle"); const runtime = temp(); const value = config(runtime, initial.root, "opencode");
  const initialChecked = validateAttachments({ root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest }, 2 * 1024 * 1024, value.attachment_roots);
  const delta = continuationDelta(initialChecked.manifest_hash, 1, null, "R2_DELTA", "always_embed", "r2-bundle"); value.attachment_roots.push({ root: delta.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] });
  const deltaDeliveryHash = JSON.parse(fs.readFileSync(path.join(delta.root, "manifest.json"), "utf8")).delivery_manifest_hash;
  const delta2 = continuationDelta(initialChecked.manifest_hash, 2, deltaDeliveryHash, "R3_DELTA", "always_embed", "r3-bundle"); value.attachment_roots.push({ root: delta2.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] });
  const broker = new Broker(value);
  const first = await broker.run({ version: 4, host_provider: "codex", prompt: "initial", continuation: null, attachments: { root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest } });
  assert.equal(first.providers[0].status, "completed");
  const second = await broker.run({ version: 4, host_provider: "codex", prompt: "R2_SHORT_INSTRUCTION", continuation: { runtime_id: first.runtime_id }, attachments: { root: delta.root, delivery: "always_embed", manifest: delta.attachmentManifest } });
  assert.equal(second.providers[0].status, "completed"); assert.equal(second.providers[0].session_id, first.providers[0].session_id);
  assert.equal(second.providers[0].delivery_used, "always_embed");
  const third = await broker.run({ version: 4, host_provider: "codex", prompt: "R3_SHORT_INSTRUCTION", continuation: { runtime_id: first.runtime_id }, attachments: { root: delta2.root, delivery: "always_embed", manifest: delta2.attachmentManifest } });
  assert.equal(third.providers[0].status, "completed"); assert.equal(third.providers[0].session_id, first.providers[0].session_id);
  const state = JSON.parse(fs.readFileSync(path.join(runtime, first.runtime_id, "state.json"), "utf8"));
  assert.equal(state.continuation_materials.length, 2);
  assert.equal(state.attachments.bundle_id, "r1-bundle");
  assert.deepEqual(state.continuation_materials.map(({ sequence, bundle_id, manifest_hash, delivery_manifest_hash, initial_material_manifest_hash, provider_sessions }) => ({ sequence, bundle_id, manifest_hash, delivery_manifest_hash, initial_material_manifest_hash, provider_sessions })), [
    { sequence: 1, bundle_id: "r2-bundle", manifest_hash: validateAttachments({ root: delta.root, delivery: "always_embed", manifest: delta.attachmentManifest }, 2 * 1024 * 1024, value.attachment_roots).manifest_hash, delivery_manifest_hash: deltaDeliveryHash, initial_material_manifest_hash: initialChecked.manifest_hash, provider_sessions: { opencode: first.providers[0].session_id } },
    { sequence: 2, bundle_id: "r3-bundle", manifest_hash: validateAttachments({ root: delta2.root, delivery: "always_embed", manifest: delta2.attachmentManifest }, 2 * 1024 * 1024, value.attachment_roots).manifest_hash, delivery_manifest_hash: JSON.parse(fs.readFileSync(path.join(delta2.root, "manifest.json"), "utf8")).delivery_manifest_hash, initial_material_manifest_hash: initialChecked.manifest_hash, provider_sessions: { opencode: first.providers[0].session_id } },
  ]);
  assert.equal(JSON.parse(fs.readFileSync(path.join(runtime, first.runtime_id, "workspace", "opencode-delta-2", "attachments-manifest.json"), "utf8")).bundle_id, "r2-bundle");
  assert.equal(state.providers.opencode.delivery.sealed_manifest_hash, state.continuation_materials[1].manifest_hash);
  assert.equal(state.providers.opencode.delivery.provider_visible_manifest_hash, state.continuation_materials[1].manifest_hash);
});

test("reuse_frozen_material corrects format in the original provider session without publishing a delta", async () => {
  const initial = source("", "always_embed", "format-r1"); const runtime = temp(); const value = config(runtime, initial.root, "opencode"); const broker = new Broker(value);
  const first = await broker.run({ version: 4, host_provider: "codex", prompt: "initial", continuation: null, attachments: { root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest }, provider_allowlist: ["opencode"] });
  assert.equal(first.providers[0].status, "completed");
  const corrected = await broker.run({ version: 4, host_provider: "codex", prompt: "return only corrected JSON", continuation: { runtime_id: first.runtime_id, reuse_frozen_material: true }, provider_allowlist: ["opencode"] });
  assert.equal(corrected.providers[0].status, "completed"); assert.equal(corrected.providers[0].session_id, first.providers[0].session_id);
  const providerOutput = JSON.parse(corrected.providers[0].output); assert.equal(providerOutput.resumed_session_id, first.providers[0].session_id);
  const state = JSON.parse(fs.readFileSync(path.join(runtime, first.runtime_id, "state.json"), "utf8"));
  assert.deepEqual(state.continuation_materials ?? [], []); assert.equal(state.round, 2);
  assert.equal(fs.readdirSync(path.join(runtime, first.runtime_id, "raw", "opencode")).filter((name) => name.endsWith(".stdout")).length, 2);
  assert.equal(corrected.providers[0].delivery.provider_visible_manifest_hash, state.attachments.manifest_hash);
});

test("reuse_frozen_material after R2 reuses that provider session's latest frozen delta", async () => {
  const initial = source("", "always_embed", "format-r1"); const runtime = temp(); const value = config(runtime, initial.root, "opencode");
  const initialChecked = validateAttachments({ root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest }, 2 * 1024 * 1024, value.attachment_roots);
  const delta = continuationDelta(initialChecked.manifest_hash, 1, null, "R2_DELTA", "always_embed", "format-r2"); value.attachment_roots.push({ root: delta.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] }); const broker = new Broker(value);
  const first = await broker.run({ version: 4, host_provider: "codex", prompt: "R1", continuation: null, attachments: { root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest }, provider_allowlist: ["opencode"] });
  const second = await broker.run({ version: 4, host_provider: "codex", prompt: "R2", continuation: { runtime_id: first.runtime_id }, attachments: { root: delta.root, delivery: "always_embed", manifest: delta.attachmentManifest }, provider_allowlist: ["opencode"] });
  const corrected = await broker.run({ version: 4, host_provider: "codex", prompt: "correct R2 JSON", continuation: { runtime_id: first.runtime_id, reuse_frozen_material: true }, provider_allowlist: ["opencode"] });
  assert.equal(corrected.providers[0].status, "completed", JSON.stringify(corrected.providers)); assert.equal(corrected.providers[0].session_id, second.providers[0].session_id);
  const state = JSON.parse(fs.readFileSync(path.join(runtime, first.runtime_id, "state.json"), "utf8")); assert.equal(state.continuation_materials.length, 1); assert.equal(state.continuation_materials[0].bundle_id, "format-r2");
  assert.equal(corrected.providers[0].delivery.provider_visible_manifest_hash, state.continuation_materials[0].manifest_hash);
  assert.equal(fs.readdirSync(path.join(runtime, first.runtime_id, "raw", "opencode")).filter((name) => name.endsWith(".stdout")).length, 3);
});

test("reuse_frozen_material rejects an old material delivery or another session's delta", async () => {
  const make = async () => { const initial = source("", "always_embed", "format-gate-r1"); const runtime = temp(); const value = config(runtime, initial.root, "opencode"); const checked = validateAttachments({ root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest }, 2 * 1024 * 1024, value.attachment_roots); const delta = continuationDelta(checked.manifest_hash, 1, null, "R2", "always_embed", "format-gate-r2"); value.attachment_roots.push({ root: delta.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] }); const broker = new Broker(value); const first = await broker.run({ version: 4, host_provider: "codex", prompt: "R1", continuation: null, attachments: { root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest }, provider_allowlist: ["opencode"] }); await broker.run({ version: 4, host_provider: "codex", prompt: "R2", continuation: { runtime_id: first.runtime_id }, attachments: { root: delta.root, delivery: "always_embed", manifest: delta.attachmentManifest }, provider_allowlist: ["opencode"] }); return { broker, runtime, id: first.runtime_id }; };
  for (const mutate of [
    (state) => { state.providers.opencode.delivery.provider_visible_manifest_hash = state.attachments.manifest_hash; },
    (state) => { state.continuation_materials[0].provider_sessions.opencode = "other-session"; },
  ]) {
    const { broker, runtime, id } = await make(); const statePath = path.join(runtime, id, "state.json"); const state = JSON.parse(fs.readFileSync(statePath, "utf8")); mutate(state); fs.writeFileSync(statePath, `${JSON.stringify(state)}\n`);
    const result = await broker.run({ version: 4, host_provider: "codex", prompt: "correct", continuation: { runtime_id: id, reuse_frozen_material: true }, provider_allowlist: ["opencode"] }); assert.equal(result.providers[0].error.code, "MATERIAL_INCOMPLETE");
  }
});

test("reuse_frozen_material is explicit, single-provider, attachment-free, and fail-closed", async () => {
  const initial = source("", "always_embed", "format-gates"); const runtime = temp(); const value = config(runtime, initial.root, "opencode"); const broker = new Broker(value);
  const first = await broker.run({ version: 4, host_provider: "codex", prompt: "initial", continuation: null, attachments: { root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest }, provider_allowlist: ["opencode"] });
  const base = { version: 4, host_provider: "codex", prompt: "correct", continuation: { runtime_id: first.runtime_id, reuse_frozen_material: true } };
  await assert.rejects(() => broker.run(base), { code: "REQUEST_INVALID" });
  await assert.rejects(() => broker.run({ ...base, provider_allowlist: ["opencode"], attachments: { root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest } }), { code: "REQUEST_INVALID" });
  const frozenDiff = path.join(runtime, first.runtime_id, "workspace", "opencode", "changes.diff"); fs.chmodSync(frozenDiff, 0o600); fs.appendFileSync(frozenDiff, "forged");
  const forged = await broker.run({ ...base, provider_allowlist: ["opencode"] }); assert.equal(forged.providers[0].error.code, "ATTACHMENT_IMMUTABLE");
  const emptyRuntime = temp(); const emptyBroker = new Broker(config(emptyRuntime, initial.root, "opencode")); const empty = await emptyBroker.run({ version: 4, host_provider: "codex", prompt: "no material", continuation: null, provider_allowlist: ["opencode"] });
  await assert.rejects(() => emptyBroker.run({ version: 4, host_provider: "codex", prompt: "correct", continuation: { runtime_id: empty.runtime_id, reuse_frozen_material: true }, provider_allowlist: ["opencode"] }), { code: "MATERIAL_INCOMPLETE" });
});

test("explicit continuation retries a confirmed-dead provider in its original session", async () => {
  const initial = source("", "always_embed", "timeout-r1"); const runtime = temp(); const value = config(runtime, initial.root, "opencode");
  const initialChecked = validateAttachments({ root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest }, 2 * 1024 * 1024, value.attachment_roots);
  const delta = continuationDelta(initialChecked.manifest_hash, 1, null, "TIMEOUT_RETRY", "always_embed", "timeout-r2"); value.attachment_roots.push({ root: delta.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] });
  const broker = new Broker(value); const first = await broker.run({ version: 4, host_provider: "codex", prompt: "R1", continuation: null, attachments: { root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest } });
  const statePath = path.join(runtime, first.runtime_id, "state.json"); const session = JSON.parse(fs.readFileSync(statePath, "utf8")).providers.opencode.session_id; const request = { version: 4, host_provider: "codex", prompt: "retry", continuation: { runtime_id: first.runtime_id }, attachments: { root: delta.root, delivery: "always_embed", manifest: delta.attachmentManifest } };
  value.providers.opencode.command = silent; const terminated = await new Broker(value, deadHealth).run(request); assert.equal(terminated.providers[0].error.code, "PROCESS_DEAD");
  value.providers.opencode.command = opencodeCli; const retried = await broker.run(request);
  assert.equal(retried.providers[0].status, "completed", JSON.stringify(retried.providers)); assert.equal(retried.providers[0].session_id, session);
  const providerOutput = JSON.parse(retried.providers[0].output); assert.equal(providerOutput.resumed_session_id, session);
  const after = JSON.parse(fs.readFileSync(statePath, "utf8")); assert.equal(after.continuation_materials.length, 1); assert.equal(after.continuation_materials[0].bundle_id, "timeout-r2");
});

test("a pre-fix PROCESS_TIMEOUT state is not migrated", async () => {
  const initial = source("", "always_embed", "legacy-r1"); const runtime = temp(); const value = config(runtime, initial.root, "opencode");
  const initialChecked = validateAttachments({ root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest }, 2 * 1024 * 1024, value.attachment_roots);
  const delta = continuationDelta(initialChecked.manifest_hash, 1, null, "LEGACY_TIMEOUT_RETRY", "always_embed", "legacy-r2"); value.attachment_roots.push({ root: delta.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] });
  const first = await new Broker(value).run({ version: 4, host_provider: "codex", prompt: "R1", continuation: null, attachments: { root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest } });
  const statePath = path.join(runtime, first.runtime_id, "state.json"); const request = { version: 4, host_provider: "codex", prompt: "legacy retry", continuation: { runtime_id: first.runtime_id }, attachments: { root: delta.root, delivery: "always_embed", manifest: delta.attachmentManifest } };
  value.providers.opencode.command = silent;
  const terminated = await new Broker(value, deadHealth).run(request); assert.equal(terminated.providers[0].error.code, "PROCESS_DEAD");
  const legacy = JSON.parse(fs.readFileSync(statePath, "utf8")); const session = legacy.providers.opencode.session_id; delete legacy.providers.opencode.timeout_retry; legacy.providers.opencode.error = { code: "PROCESS_TIMEOUT", message: "provider exceeded the legacy hard duration" }; fs.writeFileSync(statePath, `${JSON.stringify(legacy)}\n`);
  value.providers.opencode.command = opencodeCli;
  const retried = await new Broker(value).run(request);
  assert.equal(retried.providers[0].error.code, "NO_CONTINUABLE_SESSION", JSON.stringify(retried.providers));
  const after = JSON.parse(fs.readFileSync(statePath, "utf8")); assert.deepEqual(after.continuation_materials ?? [], []); assert.equal(Object.hasOwn(after.providers.opencode, "timeout_retry"), false);
});

test("unpublished timeout state fails closed when retry identity or semantics changed", async () => {
  const initial = source("", "always_embed", "legacy-gate-r1"); const runtime = temp(); const value = config(runtime, initial.root, "opencode");
  const initialChecked = validateAttachments({ root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest }, 2 * 1024 * 1024, value.attachment_roots);
  const delta = continuationDelta(initialChecked.manifest_hash, 1, null, "ORIGINAL", "always_embed", "legacy-gate-r2"); const different = continuationDelta(initialChecked.manifest_hash, 1, null, "DIFFERENT", "always_embed", "legacy-gate-other"); value.attachment_roots.push(...[delta, different].map((item) => ({ root: item.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] })));
  const first = await new Broker(value).run({ version: 4, host_provider: "codex", prompt: "R1", continuation: null, attachments: { root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest } }); const statePath = path.join(runtime, first.runtime_id, "state.json");
  const request = { version: 4, host_provider: "codex", prompt: "legacy retry", continuation: { runtime_id: first.runtime_id }, attachments: { root: delta.root, delivery: "always_embed", manifest: delta.attachmentManifest } };
  value.providers.opencode.command = silent; await new Broker(value, deadHealth).run(request);
  const timed = JSON.parse(fs.readFileSync(statePath, "utf8")); const binding = timed.providers.opencode.timeout_retry.material; delete timed.providers.opencode.timeout_retry; timed.providers.opencode.error = { code: "PROCESS_TIMEOUT", message: "legacy timeout" }; const baseline = structuredClone(timed);
  value.providers.opencode.command = opencodeCli;
  const cases = [
    [(state) => { delete state.providers.opencode.delivery.sealed_manifest_hash; delete state.providers.opencode.delivery.provider_visible_manifest_hash; }, request],
    [(state) => { state.providers.opencode.delivery.material_total_bytes += 1; }, request],
    [(state) => { state.providers.opencode.cancellation_source = "user"; }, request],
    [(state) => { state.providers.opencode.output = "semantic verdict"; }, request],
    [(state) => { state.providers.opencode.semantic_verdict = "pass"; }, request],
    [(state) => { state.providers.opencode.session_id = null; }, request],
    [(state) => { state.providers.opencode.error.source = "outer_timeout"; }, request],
    [(state) => {}, { ...request, attachments: { root: different.root, delivery: "always_embed", manifest: different.attachmentManifest } }],
  ];
  for (const [mutate, candidateRequest] of cases) {
    const state = structuredClone(baseline); mutate(state); fs.writeFileSync(statePath, `${JSON.stringify(state)}\n`);
    const result = await new Broker(value).run(candidateRequest); assert.notEqual(result.providers[0].status, "completed"); assert.deepEqual(JSON.parse(fs.readFileSync(statePath, "utf8")).continuation_materials ?? [], []);
  }
  const published = structuredClone(baseline); published.continuation_materials = [{ ...binding, provider_sessions: { opencode: baseline.providers.opencode.session_id } }]; fs.writeFileSync(statePath, `${JSON.stringify(published)}\n`);
  await assert.rejects(() => new Broker(value).run(request), { code: "MATERIAL_INCOMPLETE" });
});

test("obsolete timeout state remains unpublished when candidate or session changes", async () => {
  const initial = source("", "always_embed", "legacy-race-r1"); const runtime = temp(); const value = config(runtime, initial.root, "opencode");
  const initialChecked = validateAttachments({ root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest }, 2 * 1024 * 1024, value.attachment_roots);
  const delta = continuationDelta(initialChecked.manifest_hash, 1, null, "LEGACY_RACE", "always_embed", "legacy-race-r2"); value.attachment_roots.push({ root: delta.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] });
  const first = await new Broker(value).run({ version: 4, host_provider: "codex", prompt: "R1", continuation: null, attachments: { root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest } }); const statePath = path.join(runtime, first.runtime_id, "state.json");
  const request = { version: 4, host_provider: "codex", prompt: "legacy retry", continuation: { runtime_id: first.runtime_id }, attachments: { root: delta.root, delivery: "always_embed", manifest: delta.attachmentManifest } };
  value.providers.opencode.command = silent; await new Broker(value, deadHealth).run(request);
  const legacy = JSON.parse(fs.readFileSync(statePath, "utf8")); delete legacy.providers.opencode.timeout_retry; legacy.providers.opencode.error = { code: "PROCESS_TIMEOUT", message: "legacy timeout" }; const baseline = structuredClone(legacy); value.providers.opencode.command = opencodeCli;
  const mutations = [
    (item) => { item.cancellation_source = "user"; },
    (item) => { item.output = "semantic verdict"; },
    (item) => { item.error = { code: "PROCESS_DEAD" }; },
    (item) => { item.session_id = "different-session"; },
  ];
  for (const mutate of mutations) {
    fs.writeFileSync(statePath, `${JSON.stringify(baseline)}\n`);
    const broker = new Broker(value, { beforeLegacyMigration: () => { const changed = JSON.parse(fs.readFileSync(statePath, "utf8")); mutate(changed.providers.opencode); fs.writeFileSync(statePath, `${JSON.stringify(changed)}\n`); } });
    const result = await broker.run(request); assert.notEqual(result.providers[0].status, "completed"); const after = JSON.parse(fs.readFileSync(statePath, "utf8")); assert.equal(after.providers.opencode.timeout_retry, undefined); assert.deepEqual(after.continuation_materials ?? [], []); assert.equal(after.continuation_reservation ?? null, null);
  }
});

test("continuation excludes non-timeout, cancelled, sessionless, and semantic failures", async () => {
  const initial = source("", "always_embed", "gate-r1"); const runtime = temp(); const value = config(runtime, initial.root, "opencode");
  const initialChecked = validateAttachments({ root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest }, 2 * 1024 * 1024, value.attachment_roots);
  const delta = continuationDelta(initialChecked.manifest_hash, 1, null, "GATE", "always_embed", "gate-r2"); value.attachment_roots.push({ root: delta.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] });
  const broker = new Broker(value); const first = await broker.run({ version: 4, host_provider: "codex", prompt: "R1", continuation: null, attachments: { root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest } });
  const statePath = path.join(runtime, first.runtime_id, "state.json"); const baseline = JSON.parse(fs.readFileSync(statePath, "utf8")); const session = baseline.providers.opencode.session_id;
  const cases = [
    { status: "failed", session_id: session, error: { code: "AUTH_ENV_MISSING" } },
    { status: "failed", session_id: session, error: { code: "MATERIAL_INCOMPLETE" } },
    { status: "cancelled", session_id: session, cancellation_source: "user", error: { code: "CANCELLED", source: "user" } },
    { status: "failed", session_id: null, error: { code: "PROCESS_TIMEOUT" } },
    { status: "failed", session_id: session, output: "semantic verdict", error: { code: "PROCESS_TIMEOUT" } },
    { status: "failed", session_id: session, cancellation_source: "user", error: { code: "PROCESS_TIMEOUT" } },
    { status: "failed", session_id: session, error: { code: "PROCESS_TIMEOUT", source: "outer_timeout" } },
    { status: "failed", session_id: session, error: { code: "PROCESS_TIMEOUT" } },
    { status: "failed", session_id: session, error: { code: "PROCESS_DEAD" } },
  ];
  for (const item of cases) {
    const next = structuredClone(baseline); next.providers.opencode = { ...next.providers.opencode, ...item }; if (!Object.hasOwn(item, "output")) delete next.providers.opencode.output; fs.writeFileSync(statePath, `${JSON.stringify(next)}\n`);
    const result = await broker.run({ version: 4, host_provider: "codex", prompt: "retry", continuation: { runtime_id: first.runtime_id }, attachments: { root: delta.root, delivery: "always_embed", manifest: delta.attachmentManifest } });
    assert.equal(result.providers[0].error.code, "NO_CONTINUABLE_SESSION", JSON.stringify(item)); assert.deepEqual(JSON.parse(fs.readFileSync(statePath, "utf8")).continuation_materials ?? [], []);
  }
});

test("repeated confirmed process deaths remain unpublished and the same request can later succeed", async () => {
  const initial = source("", "always_embed", "repeat-r1"); const runtime = temp(); const value = config(runtime, initial.root, "opencode");
  const initialChecked = validateAttachments({ root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest }, 2 * 1024 * 1024, value.attachment_roots);
  const delta = continuationDelta(initialChecked.manifest_hash, 1, null, "REPEAT", "always_embed", "repeat-r2"); value.attachment_roots.push({ root: delta.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] });
  const broker = new Broker(value); const first = await broker.run({ version: 4, host_provider: "codex", prompt: "R1", continuation: null, attachments: { root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest } }); const statePath = path.join(runtime, first.runtime_id, "state.json"); const session = JSON.parse(fs.readFileSync(statePath, "utf8")).providers.opencode.session_id;
  value.providers.opencode.command = silent; const deadBroker = new Broker(value, deadHealth);
  const request = { version: 4, host_provider: "codex", prompt: "retry", continuation: { runtime_id: first.runtime_id }, attachments: { root: delta.root, delivery: "always_embed", manifest: delta.attachmentManifest } };
  const timedOut = await deadBroker.run(request); assert.equal(timedOut.providers[0].error.code, "PROCESS_DEAD"); assert.equal(JSON.stringify(timedOut).includes("timeout_retry"), false);
  const timeoutState = JSON.parse(fs.readFileSync(statePath, "utf8")); assert.deepEqual(timeoutState.continuation_materials ?? [], []); assert.equal(timeoutState.providers.opencode.timeout_retry.material.bundle_id, "repeat-r2"); assert.match(timeoutState.providers.opencode.timeout_retry.material.delivery_manifest_hash, /^[a-f0-9]{64}$/u);
  const timedOutAgain = await deadBroker.run(request); assert.equal(timedOutAgain.providers[0].error.code, "PROCESS_DEAD"); assert.deepEqual(JSON.parse(fs.readFileSync(statePath, "utf8")).continuation_materials ?? [], []);
  value.providers.opencode.command = opencodeCli;
  const recovered = await broker.run(request); assert.equal(recovered.providers[0].status, "completed", JSON.stringify(recovered.providers)); assert.equal(recovered.providers[0].session_id, session);
  const after = JSON.parse(fs.readFileSync(statePath, "utf8")); assert.equal(after.continuation_materials.length, 1); assert.equal(after.continuation_materials[0].bundle_id, "repeat-r2"); assert.equal(after.continuation_reservation ?? null, null);
});

test("a confirmed-dead retry rejects a different delta", async () => {
  const initial = source("", "always_embed", "different-r1"); const runtime = temp(); const value = config(runtime, initial.root, "opencode");
  const initialChecked = validateAttachments({ root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest }, 2 * 1024 * 1024, value.attachment_roots);
  const original = continuationDelta(initialChecked.manifest_hash, 1, null, "ORIGINAL", "always_embed", "original-r2"); const different = continuationDelta(initialChecked.manifest_hash, 1, null, "DIFFERENT", "always_embed", "different-r2");
  value.attachment_roots.push(...[original, different].map((item) => ({ root: item.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] })));
  const broker = new Broker(value); const first = await broker.run({ version: 4, host_provider: "codex", prompt: "R1", continuation: null, attachments: { root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest } });
  const originalRequest = { version: 4, host_provider: "codex", prompt: "retry", continuation: { runtime_id: first.runtime_id }, attachments: { root: original.root, delivery: "always_embed", manifest: original.attachmentManifest } };
  value.providers.opencode.command = silent; const terminated = await new Broker(value, deadHealth).run(originalRequest); assert.equal(terminated.providers[0].error.code, "PROCESS_DEAD");
  value.providers.opencode.command = opencodeCli; const rejected = await broker.run({ ...originalRequest, attachments: { root: different.root, delivery: "always_embed", manifest: different.attachmentManifest } });
  assert.equal(rejected.providers[0].error.code, "NO_CONTINUABLE_SESSION"); const state = JSON.parse(fs.readFileSync(path.join(runtime, first.runtime_id, "state.json"), "utf8")); assert.deepEqual(state.continuation_materials ?? [], []);
});

test("concurrent confirmed-dead retries publish one continuation reservation", async () => {
  const initial = source("", "always_embed", "concurrent-r1"); const runtime = temp(); const value = config(runtime, initial.root, "opencode");
  const initialChecked = validateAttachments({ root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest }, 2 * 1024 * 1024, value.attachment_roots);
  const delta = continuationDelta(initialChecked.manifest_hash, 1, null, "CONCURRENT", "always_embed", "concurrent-r2"); value.attachment_roots.push({ root: delta.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] });
  const first = await new Broker(value).run({ version: 4, host_provider: "codex", prompt: "R1", continuation: null, attachments: { root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest } });
  const statePath = path.join(runtime, first.runtime_id, "state.json"); value.providers.opencode.command = silent;
  const request = { version: 4, host_provider: "codex", prompt: "retry", continuation: { runtime_id: first.runtime_id }, attachments: { root: delta.root, delivery: "always_embed", manifest: delta.attachmentManifest } };
  const terminated = await new Broker(value, deadHealth).run(request); assert.equal(terminated.providers[0].error.code, "PROCESS_DEAD"); value.providers.opencode.command = opencodeCli;
  const results = await Promise.all([new Broker(value).run(request), new Broker(value).run(request)]); const providers = results.map((item) => item.providers[0]);
  assert.equal(providers.filter((item) => item.status === "completed").length, 1, JSON.stringify(providers)); assert.equal(providers.filter((item) => item.error?.code === "PROVIDER_BUSY").length, 1, JSON.stringify(providers));
  const after = JSON.parse(fs.readFileSync(statePath, "utf8")); assert.equal(after.continuation_materials.length, 1); assert.equal(after.continuation_materials[0].bundle_id, "concurrent-r2"); assert.equal(after.continuation_reservation ?? null, null);
});

test("R2 copies producer-sealed paths unchanged after cwd changes", async () => {
  const original = process.cwd(); const originalPwd = process.env.PWD; const cwdA = temp(); const cwdB = temp();
  try {
    process.chdir(cwdA); process.env.PWD = cwdA;
    const initial = source("", "always_embed"); const runtime = temp(); const value = config(runtime, initial.root, "opencode");
    const initialChecked = validateAttachments({ root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest }, 2 * 1024 * 1024, value.attachment_roots);
    const delta = continuationDelta(initialChecked.manifest_hash, 1, null, `\n${cwdA}/private/a.md`, "always_embed"); value.attachment_roots.push({ root: delta.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] });
    const broker = new Broker(value); const first = await broker.run({ version: 4, host_provider: "codex", prompt: "R1", continuation: null, attachments: { root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest } });
    process.chdir(cwdB); process.env.PWD = cwdB;
    const second = await broker.run({ version: 4, host_provider: "codex", prompt: "R2", continuation: { runtime_id: first.runtime_id }, attachments: { root: delta.root, delivery: "always_embed", manifest: delta.attachmentManifest } });
    assert.equal(second.providers[0].status, "completed");
    const visible = fs.readFileSync(path.join(runtime, first.runtime_id, "workspace", "opencode-delta-2", "changes.diff"), "utf8");
    assert.equal(visible.includes(cwdA), true); assert.equal(visible.includes("[PRIVATE_ROOT_WORKTREE]/private/a.md"), false);
  } finally { process.chdir(original); if (originalPwd === undefined) delete process.env.PWD; else process.env.PWD = originalPwd; }
});

test("old attachment runtime fails closed before continuation", async () => {
  const initial = source("", "always_embed"); const runtime = temp(); const value = config(runtime, initial.root, "opencode");
  const initialChecked = validateAttachments({ root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest }, 2 * 1024 * 1024, value.attachment_roots);
  const delta = continuationDelta(initialChecked.manifest_hash, 1, null, "R2", "always_embed"); value.attachment_roots.push({ root: delta.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] });
  const broker = new Broker(value); const first = await broker.run({ version: 4, host_provider: "codex", prompt: "R1", continuation: null, attachments: { root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest } });
  const statePath = path.join(runtime, first.runtime_id, "state.json"); const state = JSON.parse(fs.readFileSync(statePath, "utf8")); delete state.attachments.protocol_version; fs.writeFileSync(statePath, `${JSON.stringify(state)}\n`);
  await assert.rejects(() => broker.run({ version: 4, host_provider: "codex", prompt: "R2", continuation: { runtime_id: first.runtime_id }, attachments: { root: delta.root, delivery: "always_embed", manifest: delta.attachmentManifest } }), { code: "MATERIAL_PROTOCOL_MISMATCH" });
});

test("R3 excludes a second provider session that did not complete R2", async () => {
  const initial = source("", "always_embed"); const runtime = temp();
  const value = validateConfig({ version: 4, runtime: { root: runtime, ttl_hours: 24, max_prompt_bytes: 1024 * 1024, max_output_bytes: 100_000, max_attachment_bytes: 2 * 1024 * 1024, liveness_interval_ms: 5, orphan_timeout_ms: 100 }, attachment_roots: [{ root: initial.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] }], tiers: [["opencode", "codex"]], providers: { opencode: { enabled: true, command: opencodeCli, model: null, effort: null, thinking: null, auth: { type: "native" }, env: [] }, codex: { enabled: true, command: codexAppServer, model: null, effort: null, thinking: null, auth: { type: "native" }, env: [] } } });
  const initialChecked = validateAttachments({ root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest }, 2 * 1024 * 1024, value.attachment_roots);
  const r2 = continuationDelta(initialChecked.manifest_hash, 1, null, "R2", "always_embed"); value.attachment_roots.push({ root: r2.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] });
  const r2Checked = validateAttachments({ root: r2.root, delivery: "always_embed", manifest: r2.attachmentManifest }, 2 * 1024 * 1024, value.attachment_roots); const r2Delivery = JSON.parse(fs.readFileSync(path.join(r2.root, "manifest.json"), "utf8")).delivery_manifest_hash;
  const r3 = continuationDelta(initialChecked.manifest_hash, 2, r2Delivery, "R3", "always_embed"); value.attachment_roots.push({ root: r3.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] });
  const broker = new Broker(value); const first = await broker.run({ version: 4, host_provider: "kimi", prompt: "initial", continuation: null, provider_allowlist: ["opencode", "codex"], attachments: { root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest } });
  assert.deepEqual(first.providers.map((item) => item.provider).sort(), ["codex", "opencode"]);
  const statePath = path.join(runtime, first.runtime_id, "state.json"); const state = JSON.parse(fs.readFileSync(statePath, "utf8")); const openSession = state.providers.opencode.session_id;
  state.continuation_materials = [{ sequence: 1, manifest_hash: r2Checked.manifest_hash, delivery_manifest_hash: r2Delivery, initial_material_manifest_hash: initialChecked.manifest_hash, previous_delivery_manifest_hash: null, provider_sessions: { opencode: openSession } }];
  state.providers.opencode.delivery.sealed_manifest_hash = r2Checked.manifest_hash; state.providers.opencode.delivery.provider_visible_manifest_hash = r2Checked.manifest_hash; fs.writeFileSync(statePath, `${JSON.stringify(state)}\n`);
  const third = await broker.run({ version: 4, host_provider: "kimi", prompt: "R3", continuation: { runtime_id: first.runtime_id }, attachments: { root: r3.root, delivery: "always_embed", manifest: r3.attachmentManifest } });
  assert.deepEqual(third.providers.map((item) => item.provider), ["opencode"]);
  assert.equal(third.providers[0].session_id, openSession);
});

test("R2 rejects a delivery-mode mismatch before provider execution", async () => {
  const initial = source("", "always_embed"); const runtime = temp(); const value = config(runtime, initial.root, "opencode");
  const initialChecked = validateAttachments({ root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest }, 2 * 1024 * 1024, value.attachment_roots);
  const delta = continuationDelta(initialChecked.manifest_hash); value.attachment_roots.push({ root: delta.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] });
  const broker = new Broker(value); const first = await broker.run({ version: 4, host_provider: "codex", prompt: "initial", continuation: null, attachments: { root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest } });
  await assert.rejects(() => broker.run({ version: 4, host_provider: "codex", prompt: "R2", continuation: { runtime_id: first.runtime_id }, attachments: { root: delta.root, delivery: "file_only", manifest: delta.attachmentManifest } }), { code: "MATERIAL_INCOMPLETE" });
  const state = JSON.parse(fs.readFileSync(path.join(runtime, first.runtime_id, "state.json"), "utf8")); assert.deepEqual(state.continuation_materials ?? [], []);
});

test("large always_embed R2 remains reviewable", async () => {
  const initial = source("", "always_embed"); const runtime = temp(); const value = config(runtime, initial.root, "opencode", 2 * 1024 * 1024);
  const initialChecked = validateAttachments({ root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest }, 2 * 1024 * 1024, value.attachment_roots);
  const delta = continuationDelta(initialChecked.manifest_hash, 1, null, "R2_LARGE", "always_embed"); value.attachment_roots.push({ root: delta.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] });
  const broker = new Broker(value); const first = await broker.run({ version: 4, host_provider: "codex", prompt: "initial", continuation: null, attachments: { root: initial.root, delivery: "always_embed", manifest: initial.attachmentManifest } });
  const second = await broker.run({ version: 4, host_provider: "codex", prompt: "x".repeat(512 * 1024), continuation: { runtime_id: first.runtime_id }, attachments: { root: delta.root, delivery: "always_embed", manifest: delta.attachmentManifest } });
  assert.notEqual(second.providers[0].error?.code, "MATERIAL_TOO_LARGE");
});

for (const mutate of [
  ["filename", (input) => input.attachmentManifest.entries.splice(input.attachmentManifest.entries.findIndex((item) => item.destination === "changes.diff"), 1)],
  ["outer hash", (input) => { input.attachmentManifest.entries.find((item) => item.destination === "changes.diff").sha256 = "0".repeat(64); }],
  ["packet binding", (input) => { const file = path.join(input.root, "review-packet.v1.json"); const packet = JSON.parse(fs.readFileSync(file, "utf8")); packet.manifest_hash = "f".repeat(64); fs.writeFileSync(file, `${JSON.stringify(packet)}\n`); const entry = input.attachmentManifest.entries.find((item) => item.destination === "review-packet.v1.json"); const value = fs.readFileSync(file); entry.size = value.length; entry.sha256 = sha(value); }],
]) {
  test(`file_only fails closed when triad filename, outer hash, or packet hash binding is wrong: ${mutate[0]}`, async () => {
    const input = source(); mutate[1](input); const broker = new Broker(config(temp(), input.root, "opencode")); const request = { version: 4, host_provider: "codex", prompt: "review", continuation: null, attachments: { root: input.root, delivery: "file_only", manifest: input.attachmentManifest } };
    if (mutate[0] === "outer hash") { await assert.rejects(() => broker.run(request), { code: "ATTACHMENT_HASH_MISMATCH" }); return; }
    await assert.rejects(() => broker.run(request), { code: "MATERIAL_INCOMPLETE" });
  });
}

test("always_embed preserves a complete rendered prompt without a broker size gate", async () => {
  const input = source("", "always_embed"); const runtime = temp(); const result = await new Broker(config(runtime, input.root, "opencode", 511 * 1024)).run({ version: 4, host_provider: "codex", prompt: "p".repeat(520 * 1024), continuation: null, attachments: { root: input.root, delivery: "always_embed", manifest: input.attachmentManifest } });
  assert.notEqual(result.providers[0].error?.code, "MATERIAL_TOO_LARGE");
});

test("always_embed includes adapter model instruction without a size gate", async () => {
  const input = source("", "always_embed"); const roots = [{ root: input.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] }]; const checked = validateAttachments({ root: input.root, delivery: "always_embed", manifest: input.attachmentManifest }, 2 * 1024 * 1024, roots);
  const plain = planDelivery({ capabilities: { attachment_delivery: ["always_embed"] } }, checked, "review", 2 * 1024 * 1024);
  const original = opencode.modelInstruction; opencode.modelInstruction = "i".repeat(512 * 1024);
  try {
    assert.ok(planDelivery(opencode, checked, "review", 2 * 1024 * 1024).provider_prompt.length > plain.provider_prompt.length);
    const runtime = temp(); const result = await new Broker(config(runtime, input.root, "opencode", 2 * 1024 * 1024)).run({ version: 4, host_provider: "codex", prompt: "review", continuation: null, attachments: { root: input.root, delivery: "always_embed", manifest: input.attachmentManifest } });
    assert.notEqual(result.providers[0].error?.code, "MATERIAL_TOO_LARGE");
  } finally { opencode.modelInstruction = original; }
});

test("file_only creates a native continuation session", async () => {
  const input = source(); const runtime = temp(); const broker = new Broker(config(runtime, input.root, "opencode"));
  const first = await broker.run({ version: 4, host_provider: "codex", prompt: "review", continuation: null, attachments: { root: input.root, delivery: "file_only", manifest: input.attachmentManifest } });
  assert.equal(first.providers[0].status, "completed");
  assert.equal(typeof first.providers[0].session_id, "string");
});
