#!/usr/bin/env node

import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  canonicalDeliveryManifestHash,
  canonicalInnerManifestHash,
  canonicalMaterialManifestHash,
  canonicalPacketHash,
} from "../lib/attachments.mjs";
import { Broker } from "../lib/broker.mjs";
import { validateConfig } from "../lib/config.mjs";
import cursor from "../lib/adapters/cursor.mjs";
import { execute } from "../lib/process.mjs";

const command = process.env.CURSOR_REAL_COMMAND ?? "/Users/Hugh/.local/bin/cursor-agent";
const model = process.env.CURSOR_REAL_MODEL ?? "cursor-grok-4.5-high";
const temp = () => fs.mkdtempSync(path.join(os.tmpdir(), "3rd-review-cursor-real-"));
const sha = (value) => createHash("sha256").update(value).digest("hex");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function material(delivery, marker) {
  const root = temp(); const embed = delivery === "always_embed"; const bundle_id = `cursor-real-${delivery}-${sha(marker).slice(0, 12)}`;
  const diff = `${marker}\n`;
  const materialManifestHash = canonicalMaterialManifestHash(bundle_id, [{ target: "changes.diff", sha256: sha(diff), size: Buffer.byteLength(diff), embed }]);
  const packet = { version: "review-packet.v1", manifest_hash: materialManifestHash, diff_sha256: sha(diff) };
  packet.packet_hash = canonicalPacketHash(packet);
  const files = [["review-packet.v1.json", `${JSON.stringify(packet)}\n`], ["changes.diff", diff]];
  for (const [name, contents] of files) fs.writeFileSync(path.join(root, name), contents);
  const attachments = files.map(([destination, contents]) => ({ destination, sha256: sha(contents), size: Buffer.byteLength(contents) }));
  const outer = [...attachments.map(({ destination: target, sha256, size }) => ({ target, sha256, size, embed })), { target: "manifest.json", sha256: "0".repeat(64), size: 0, embed }];
  const manifest = {
    version: "review-attachment-manifest.v1", delivery_mode: delivery,
    packet_hash: packet.packet_hash, manifest_hash: packet.manifest_hash,
    diff_sha256: packet.diff_sha256, attachments,
    delivery_manifest_hash: canonicalDeliveryManifestHash(bundle_id, outer, delivery),
  };
  manifest.inner_manifest_hash = canonicalInnerManifestHash(manifest);
  const manifestText = `${JSON.stringify(manifest)}\n`; fs.writeFileSync(path.join(root, "manifest.json"), manifestText);
  const all = [...files, ["manifest.json", manifestText]];
  return {
    root, marker,
    attachment: {
      root, delivery,
      manifest: {
        version: 1, bundle_id,
        entries: all.map(([source, contents]) => ({
          source, destination: source, size: Buffer.byteLength(contents), sha256: sha(contents), embed,
        })),
      },
    },
  };
}

function config(runtime, inputs) {
  return validateConfig({
    version: 4,
    runtime: {
      root: runtime, ttl_hours: 24, max_output_bytes: 300_000,
      max_attachment_bytes: 300_000, liveness_interval_ms: 1000, orphan_timeout_ms: 30_000,
    },
    attachment_roots: inputs.map((input) => ({
      root: input.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"],
    })),
    tiers: [["cursor/grok"]],
    providers: {
      "cursor/grok": {
        enabled: true, allow_host_state: true, command, model,
        effort: null, thinking: null, auth: { type: "native" }, env: [],
      },
    },
  });
}

const inputs = [
  material("file_only", "REAL_CURSOR_BROKER_FILE_ONLY"),
  material("always_embed", "REAL_CURSOR_BROKER_ALWAYS_EMBED"),
];
const runtime = temp(); const broker = new Broker(config(runtime, inputs)); const results = []; let fileOnlyGroup;
for (const input of inputs) {
  const group = await broker.run({
    version: 4, host_provider: "codex", provider_allowlist: ["cursor/grok"],
    prompt: `Review the supplied material and include exact marker ${input.marker} in the final answer.`,
    continuation: null, attachments: input.attachment,
  });
  const provider = group.providers[0];
  if (input.attachment.delivery === "file_only") fileOnlyGroup = group;
  results.push({
    delivery: input.attachment.delivery, outcome: group.outcome, status: provider.status,
    marker: provider.output?.includes(input.marker) === true, session: Boolean(provider.session_id),
    usage: provider.usage, retry_count: provider.retry_count,
  });
}

const continued = await broker.run({
  version: 4, host_provider: "codex", provider_allowlist: ["cursor/grok"],
  prompt: "Include exact marker REAL_CURSOR_BROKER_CONTINUATION in the final answer.",
  continuation: { runtime_id: fileOnlyGroup.runtime_id, reuse_frozen_material: true },
});
results.push({
  continuation: true, outcome: continued.outcome, status: continued.providers[0].status,
  marker: continued.providers[0].output?.includes("REAL_CURSOR_BROKER_CONTINUATION") === true,
  same_session: continued.providers[0].session_id === fileOnlyGroup.providers[0].session_id,
});

const isolatedRoot = temp(); const isolatedWorkspace = path.join(isolatedRoot, "workspace");
fs.mkdirSync(isolatedWorkspace);
// Keep this probe bundled so the prompt-only no-tools constraint does not
// make the model comply without attempting the native read. The adapter must
// observe and deny the actual /etc/hosts call.
fs.mkdirSync(path.join(isolatedWorkspace, "bundle"));
const nativeProvider = {
  id: "cursor/grok", command, model, effort: null, thinking: null,
  allow_host_state: true, auth: { type: "native", env: [] }, env: [],
};
const deniedPlan = cursor.start(nativeProvider, isolatedWorkspace, "Use the native Read tool to read /etc/hosts. Do not use MCP.", isolatedRoot);
const denied = await execute(deniedPlan, { maxOutputBytes: 100_000, healthCheckIntervalMs: 60_000, livenessIntervalMs: 1000 });
results.push({
  native_read_denied: denied.ok === false && denied.error?.code === "PROVIDER_PERMISSION_DENIED",
  leaked_hosts: denied.stdout?.includes("localhost") || denied.stdout?.includes("broadcasthost"),
});

const managedInput = inputs[0];
const managed = broker.startManaged({
  version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v2",
  provider_allowlist: ["cursor/grok"],
  prompt: "Review the supplied material and return a valid WorkflowHub review result.",
  continuation: null, attachments: managedInput.attachment,
}, `cursor-real-managed-${Date.now()}`);
let status;
for (let attempt = 0; attempt < 180; attempt += 1) {
  status = broker.managedStatus(managed.runtime_id);
  if (status.state === "terminal") break;
  await delay(1000);
}
results.push({
  managed: true, state: status?.state,
  outcome: status?.group?.outcome,
  status: status?.group?.providers?.[0]?.status,
  protocol: status?.group?.providers?.[0]?.result_protocol,
  private_path_free: status?.state === "terminal" && !JSON.stringify(status).includes(runtime),
});

console.log(JSON.stringify(results));
const failed = results.some((item) =>
  (Object.hasOwn(item, "status") && item.status !== "completed")
  || item.marker === false
  || item.same_session === false
  || item.native_read_denied === false
  || item.leaked_hosts === true
  || (item.managed && (item.state !== "terminal" || item.outcome !== "completed" || item.protocol !== "workflowhub-result.v2" || item.private_path_free !== true)));
if (failed) process.exit(1);
