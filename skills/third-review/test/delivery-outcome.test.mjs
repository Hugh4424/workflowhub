import { fileURLToPath as migratedFilePath } from "node:url";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";
import { canonicalDeliveryManifestHash, canonicalInnerManifestHash, canonicalMaterialManifestHash, canonicalPacketHash } from "../lib/attachments.mjs";
import { Broker } from "../lib/broker.mjs";
import { validateConfig } from "../lib/config.mjs";

const fake = migratedFilePath(new URL("../test/fake-cli.mjs", import.meta.url));
const temp = () => fs.mkdtempSync(path.join(os.tmpdir(), "3rd-review-delivery-outcome-"));
const sha = (value) => createHash("sha256").update(value).digest("hex");

function source(delivery = "file_only", diffValue = null) {
  const root = temp();
  const diff = diffValue ?? "DIFF_HEAD\nDIFF_TAIL\n";
  const embed = delivery === "always_embed"; const review = { version: "review-packet.v1", manifest_hash: canonicalMaterialManifestHash("delivery-outcome", [{ target: "skills/review/SKILL.md", sha256: sha("lens"), size: 4, embed }, { target: "changes.diff", sha256: sha(diff), size: Buffer.byteLength(diff), embed }]), diff_sha256: sha(diff) }; review.packet_hash = canonicalPacketHash(review);
  const packet = `${JSON.stringify(review)}\n`;
  fs.mkdirSync(path.join(root, "skills/review"), { recursive: true });
  fs.writeFileSync(path.join(root, "skills/review/SKILL.md"), "lens");
  fs.writeFileSync(path.join(root, "review-packet.v1.json"), packet);
  fs.writeFileSync(path.join(root, "changes.diff"), diff);
  const files = [["skills/review/SKILL.md", "lens"], ["review-packet.v1.json", packet], ["changes.diff", diff]];
  const attachments = files.map(([destination, contents]) => ({ destination, sha256: sha(contents), size: Buffer.byteLength(contents) })); const outer = [...attachments.map(({ destination: target, sha256, size }) => ({ target, sha256, size, embed })), { target: "manifest.json", sha256: "0".repeat(64), size: 0, embed }]; const manifest = { version: "review-attachment-manifest.v1", delivery_mode: delivery, packet_hash: review.packet_hash, manifest_hash: review.manifest_hash, diff_sha256: review.diff_sha256, attachments, delivery_manifest_hash: canonicalDeliveryManifestHash("delivery-outcome", outer, delivery) }; manifest.inner_manifest_hash = canonicalInnerManifestHash(manifest); fs.writeFileSync(path.join(root, "manifest.json"), `${JSON.stringify(manifest)}\n`);
  return root;
}

test("broker copies sealed bytes unchanged and records one verified hash", async () => {
  const absolute = "/Users/Hugh/private/deleted.mjs";
  const attachmentRoot = source("always_embed", `diff --git a/a b/a\n--- a/a\n+++ b/a\n@@ -1 +1 @@\n-${absolute}\n+clean\n`);
  const runtimeRoot = temp();
  const inputAttachments = attachments(attachmentRoot, "always_embed");
  const rawHash = canonicalMaterialManifestHash("delivery-outcome", inputAttachments.manifest.entries.map(({ destination: target, sha256, size, embed }) => ({ target, sha256, size, embed })));
  const result = await new Broker(config(runtimeRoot, [["opencode"]], attachmentRoot)).run({ version: 4, host_provider: "codex", prompt: "review", continuation: null, attachments: inputAttachments });
  const provider = result.providers[0];
  assert.equal(provider.status, "completed");
  assert.equal(provider.delivery.sealed_manifest_hash, rawHash);
  assert.equal(provider.delivery.provider_visible_manifest_hash, rawHash);
  assert.equal(provider.delivery.byte_identity, "verified");
  assert.equal(Object.hasOwn(provider.delivery, "raw_material_manifest_hash"), false);
  assert.equal(Object.hasOwn(provider.delivery, "redaction"), false);
  const privateState = JSON.parse(fs.readFileSync(path.join(runtimeRoot, result.runtime_id, "state.json"), "utf8"));
  assert.deepEqual(privateState.providers.opencode.delivery, provider.delivery);
  const frozen = path.join(runtimeRoot, result.runtime_id, "workspace", "opencode");
  assert.deepEqual(fs.readFileSync(path.join(frozen, "changes.diff")), fs.readFileSync(path.join(attachmentRoot, "changes.diff")));
  assert.deepEqual(fs.readFileSync(path.join(frozen, "review-packet.v1.json")), fs.readFileSync(path.join(attachmentRoot, "review-packet.v1.json")));
});

function attachments(root, delivery, embed = delivery === "always_embed") {
  return {
    root,
    delivery,
    manifest: {
      version: 1,
      bundle_id: "delivery-outcome",
      entries: ["skills/review/SKILL.md", "review-packet.v1.json", "changes.diff", "manifest.json"].map((source) => { const contents = fs.readFileSync(path.join(root, source)); return { source, destination: source, size: contents.length, sha256: sha(contents), embed }; }),
    },
  };
}

function config(root, tiers, attachmentRoot) {
  const ids = [...new Set(tiers.flat())];
  return validateConfig({
    version: 4,
    runtime: {
      root,
      ttl_hours: 24,
      max_prompt_bytes: 10_000,
      max_output_bytes: 100_000,
      max_attachment_bytes: 10_000,
      liveness_interval_ms: 5,
      orphan_timeout_ms: 100,
    },
    attachment_roots: [{ root: attachmentRoot, sources: ["skills", "review-packet.v1.json", "changes.diff", "manifest.json"] }],
    tiers,
    providers: Object.fromEntries(ids.map((id) => [id, {
      enabled: true,
      command: fake,
      model: null,
      effort: null,
      thinking: null,
      auth: { type: "native" },
      env: [],
    }])),
  });
}

for (const [policy, provider, expected] of [
  ["always_embed", "opencode", "always_embed"],
]) {
  test(`${policy} policy reports ${provider} delivery_used=${expected}`, async () => {
    const attachmentRoot = source(policy);
    const runtimeRoot = temp();
    const result = await new Broker(config(runtimeRoot, [[provider]], attachmentRoot)).run({
      version: 4,
      host_provider: "codex",
      prompt: "review",
      continuation: null,
      attachments: attachments(attachmentRoot, policy),
    });

    assert.equal(result.providers[0].status, "completed");
    assert.equal(result.providers[0].delivery_used, expected);
    const privateState = JSON.parse(fs.readFileSync(path.join(runtimeRoot, result.runtime_id, "state.json"), "utf8"));
    assert.equal(privateState.providers[provider].delivery_used, expected);
    const delivery = privateState.providers[provider].delivery; assert.equal(delivery.material_total_bytes, attachments(attachmentRoot, policy).manifest.entries.reduce((sum, entry) => sum + entry.size, 0)); assert.equal(Object.hasOwn(delivery, "total_bytes"), false); if (policy === "always_embed") assert.ok(delivery.rendered_prompt_bytes > delivery.material_total_bytes);
  });
}

test("file_only OpenCode uses its frozen provider-private workspace", async () => {
  const attachmentRoot = source();
  const runtimeRoot = temp();
  const result = await new Broker(config(runtimeRoot, [["opencode"]], attachmentRoot)).run({
    version: 4,
    host_provider: "codex",
    prompt: "review",
    continuation: null,
    provider_allowlist: ["opencode"],
    attachments: attachments(attachmentRoot, "file_only"),
  });

  assert.deepEqual(result.providers.map((item) => item.provider), ["opencode"]);
  assert.equal(result.providers[0].status, "completed");
  assert.equal(result.providers[0].delivery_used, "file_only");
  assert.equal(fs.existsSync(path.join(runtimeRoot, result.runtime_id, "embed", "opencode")), false);
  const state = JSON.parse(fs.readFileSync(path.join(runtimeRoot, result.runtime_id, "state.json"), "utf8"));
  assert.equal(state.providers.opencode.delivery.delivery_mode, "file_only");
  assert.equal(Object.hasOwn(state.providers.opencode.delivery, "rendered_prompt_bytes"), false);
  assert.equal(Object.hasOwn(state.providers.opencode.delivery, "total_bytes"), false);
});

test("a file_only provider set runs without embedding fallback", async () => {
  const attachmentRoot = source();
  const broker = new Broker(config(temp(), [["kimi", "opencode"]], attachmentRoot));
  const result = await broker.run({
    version: 4,
    host_provider: "codex",
    provider_allowlist: ["kimi", "opencode"],
    prompt: "review",
    continuation: null,
    attachments: attachments(attachmentRoot, "file_only"),
  });

  assert.deepEqual(result.providers.map((item) => item.provider).sort(), ["kimi", "opencode"]);
  assert.equal(result.providers.find((item) => item.provider === "kimi").status, "completed");
  const openCode = result.providers.find((item) => item.provider === "opencode");
  assert.equal(openCode.status, "completed");
  assert.equal(openCode.delivery_used, "file_only");
});

test("file_only creates native continuable sessions", async () => {
  const attachmentRoot = source();
  const broker = new Broker(config(temp(), [["kimi", "opencode"]], attachmentRoot));
  const first = await broker.run({
    version: 4,
    host_provider: "codex",
    provider_allowlist: ["kimi", "opencode"],
    prompt: "first",
    continuation: null,
    attachments: attachments(attachmentRoot, "file_only"),
  });
  assert.equal(typeof first.providers.find((item) => item.provider === "kimi").session_id, "string");
  assert.equal(typeof first.providers.find((item) => item.provider === "opencode").session_id, "string");
});

test("run may expose delivery outcome while status keeps attachment internals private", async () => {
  const attachmentRoot = source();
  const runtimeRoot = temp();
  const broker = new Broker(config(runtimeRoot, [["kimi"]], attachmentRoot));
  const result = await broker.run({
    version: 4,
    host_provider: "codex",
    prompt: "review",
    continuation: null,
    attachments: attachments(attachmentRoot, "file_only"),
  });

  assert.equal(result.providers[0].delivery_used, "file_only");
  assert.equal(result.providers[0].status, "completed");
  assert.equal(typeof result.providers[0].session_id, "string");
  const privateState = JSON.parse(fs.readFileSync(path.join(runtimeRoot, result.runtime_id, "state.json"), "utf8"));
  assert.equal(privateState.providers.kimi.raw_stdout_sha256, result.providers[0].raw_stdout_sha256);
  assert.equal(privateState.providers.kimi.raw_stderr_sha256, result.providers[0].raw_stderr_sha256);
  const status = JSON.stringify(broker.status(result.runtime_id));
  assert.doesNotMatch(status, /attachments|attachment_delivery|bundle_id|manifest_hash|workspace|raw_stdout_ref|raw_stderr_ref|raw_stdout_sha256|raw_stderr_sha256|session_id|kimi opinion/);
  assert.equal(status.includes(attachmentRoot), false);
  assert.equal(status.includes(runtimeRoot), false);
});

test("doctor keeps broker and provider delivery capabilities", async () => {
  const attachmentRoot = source();
  const result = await new Broker(config(temp(), [["kimi", "opencode"]], attachmentRoot)).doctor();
  assert.deepEqual(result.capabilities, { attachments: true, cancel_source: true });
  assert.deepEqual(result.material_protocol, { version: 5, delivery_attestation: "sealed-exact-copy.v1" });
  assert.deepEqual(result.providers.find((item) => item.provider === "kimi").capabilities, { continuation: true, attachment_delivery: ["file_only"] });
  assert.deepEqual(result.providers.find((item) => item.provider === "opencode").capabilities, { continuation: true, terminal_recovery: true, attachment_delivery: ["file_only", "always_embed"] });
});
