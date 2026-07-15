import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { EventEmitter } from "node:events";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, expect, it } from "vitest";
import { BrokerClient } from "../skills/wh-review/scripts/broker-client.mjs";
import { ReviewRoundFacade } from "../skills/wh-review/scripts/review-round-facade.mjs";
import { contractPathAndHash } from "../skills/wh-review/scripts/lib/safe-id.mjs";
import { resolveRequiredSkills } from "../skills/wh-review/scripts/required-skill-resolver.mjs";

const thirdRoot = process.env.THIRD_REVIEW_SOURCE_ROOT;
const roots = [];
afterEach(() => roots.splice(0).forEach((root) => { for (let attempt = 0; attempt < 3; attempt += 1) { try { rmSync(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 10 }); break; } catch { /* retry transient runtime cleanup */ } } }));
const sha = (value) => createHash("sha256").update(value).digest("hex");
const git = (root, args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();

it.runIf(Boolean(thirdRoot))("accepts real R1/R2 3rd-review derived bundles with one runtime, session, root set, and predecessor chain", async () => {
  const root = mkdtempSync(join(tmpdir(), "wh-review-derived-integration-")); if (!process.env.KEEP_WH_REVIEW_DERIVED_FIXTURE) roots.push(root);
  const infra = mkdtempSync(join(tmpdir(), "wh-review-derived-infra-")); if (!process.env.KEEP_WH_REVIEW_DERIVED_FIXTURE) roots.push(infra);
  git(root, ["init", "-q"]); git(root, ["config", "user.email", "review@example.test"]); git(root, ["config", "user.name", "Review Test"]);
  writeFileSync(join(root, "a"), "old\n"); git(root, ["add", "a"]); git(root, ["commit", "-qm", "base"]);
  writeFileSync(join(root, "a"), `deleted host path /Users/Hugh/private/review.md\n`);
  const runtimeRoot = join(infra, "runtime"); const config = join(infra, "3rd-review.json");
  const provider = resolve("tests/fixtures/derived-review-provider.mjs"); chmodSync(provider, 0o755);
  writeFileSync(config, JSON.stringify({ version: 4, runtime: { root: runtimeRoot, ttl_hours: 24, max_prompt_bytes: 524288, max_output_bytes: 1048576, max_attachment_bytes: 1048576, liveness_interval_ms: 5, idle_timeout_ms: 0, max_duration_ms: 5000, orphan_timeout_ms: 1000 },
    attachment_roots: [{ root: resolve("."), sources: [".wh-review-packets"] }], tiers: [["opencode"]], providers: { opencode: { enabled: true, command: provider, model: null, effort: null, thinking: null, auth: { type: "native" }, env: [] } } }));
  const brokerClient = new BrokerClient({ command: [process.execPath, join(thirdRoot, "scripts/3rd-review.mjs")], config, attachmentRoot: resolve(".") });
  let frozenRunBinding = null;
  const broker = {
    discoverCapabilities: (...args) => brokerClient.discoverCapabilities(...args),
    status: (...args) => brokerClient.status(...args),
    run: (args) => {
      frozenRunBinding = structuredClone({ request: args.request, attachments: args.attachments, attachmentDelivery: args.attachmentDelivery });
      return brokerClient.run(args);
    },
  };
  const resolver = (input) => ({ ...resolveRequiredSkills(input), deliveryMode: "always_embed" });
  const facade = new ReviewRoundFacade({ taskTrackingRoot: root, sourceRoot: root, broker, requiredSkillResolver: resolver });
  const packet = { version: "review-packet.v1", stage: "build-code", review_track: null, raw_requirement: "review", acceptance_design_excerpt: "AC: works", test_evidence: [{ fact_id: "unit", kind: "command", source: "npm test", captured_at: "2026-07-15T00:00:00Z", sha256: sha("unit passed"), status: "passed", exit_code: 0 }], host_verified_facts: [], contract_hash: contractPathAndHash("build-code").contractHash, skill_bundle_hash: sha("[]") };
  const prepared = await facade.prepare({ task_id: "derived", stage: "build-code", review_flow_id: "flow", host_provider: "codex", packet });
  expect(prepared.initial_prompt).not.toMatch(/(?:packet_hash|manifest_hash|diff_sha256)=/u);
  const result = await facade.run(prepared); const outcome = result.provider_outcomes[0];
  expect(outcome).toMatchObject({ transport_status: "completed", packet_status: "complete", business_valid: true, semantic_verdict: "pass" });
  expect(outcome.delivery).toMatchObject({ material_representation: "sanitized", raw_material_manifest_hash: expect.stringMatching(/^[a-f0-9]{64}$/u), material_manifest_hash: expect.stringMatching(/^[a-f0-9]{64}$/u), redaction: { replacement_count: expect.any(Number), residual_scan: "passed" } });
  expect(outcome.delivery.raw_material_manifest_hash).not.toBe(outcome.delivery.material_manifest_hash);
  expect(readFileSync(outcome.raw_output_ref, "utf8")).not.toContain("/Users/Hugh/private/review.md");
  writeFileSync(join(root, "a"), `second host path /Users/Hugh/private/round-two.md\n`);
  const preparedR2 = await facade.prepare({ task_id: "derived", stage: "build-code", review_flow_id: "flow", host_provider: "codex", packet, continuation: true });
  expect(readdirSync(preparedR2.frozen_snapshot_dir)).not.toContain("schemas");
  expect(JSON.parse(preparedR2.correction_schema)).toEqual(JSON.parse(readFileSync(resolve("skills/wh-review/schemas/reviewer-output.schema.json"), "utf8")));
  expect(JSON.parse(preparedR2.correction_contract_facts).provider_visible_destinations).toEqual(["changes.diff", "continuation-delta.v1.json", "manifest.json", "review-packet.v1.json"]);
  expect(preparedR2.initial_prompt).not.toMatch(/(?:attachment_manifest_sha256|packet_hash|manifest_hash|diff_sha256|attachment_sha256)=/u);
  const resultR2 = await facade.run(preparedR2); const outcomeR2 = resultR2.provider_outcomes[0];
  expect(outcomeR2).toMatchObject({ transport_status: "completed", packet_status: "complete", business_valid: true, semantic_verdict: "pass", session_id: outcome.session_id });
  expect(JSON.parse(readFileSync(resultR2.receipt_draft_ref, "utf8")).runtime_id).toBe(JSON.parse(readFileSync(result.receipt_draft_ref, "utf8")).runtime_id);
  expect(outcomeR2.delivery.redaction.root_set_hash).toBe(outcome.delivery.redaction.root_set_hash);
  expect(outcomeR2.delivery.derived_attestation.continuation).toEqual({ initial_material_manifest_hash: outcome.delivery.material_manifest_hash, sequence: 1, previous_delivery_manifest_hash: null });
  expect(outcomeR2.delivery.raw_material_manifest_hash).not.toBe(outcome.delivery.raw_material_manifest_hash);
  const runtimeId = JSON.parse(readFileSync(resultR2.receipt_draft_ref, "utf8")).runtime_id; const statePath = join(runtimeRoot, runtimeId, "state.json"); const originalState = readFileSync(statePath); const r2RunBinding = structuredClone(frozenRunBinding);
  const correction = await brokerClient.run({ request: { version: 4, host_provider: "codex", prompt: "Return the same review as schema-valid JSON only.", continuation: { runtime_id: runtimeId, reuse_frozen_material: true }, provider_allowlist: ["opencode"], material_manifest_sha256: outcomeR2.delivery.raw_material_manifest_hash }, attachmentDelivery: "always_embed", privateRawDirectory: join(infra, "correction") });
  expect(correction.providers[0]).toMatchObject({ status: "completed", session_id: outcomeR2.session_id, delivery: { derived_attestation: outcomeR2.delivery.derived_attestation } });
  const replay = async (state, label, binding = r2RunBinding) => {
    writeFileSync(statePath, JSON.stringify(state)); const publicProvider = structuredClone(state.providers.opencode);
    const replayClient = new BrokerClient({ command: [process.execPath, "unused.mjs"], config, attachmentRoot: resolve("."), spawnImpl(command, args) {
      const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter(); queueMicrotask(() => { child.stdout.emit("data", JSON.stringify({ version: 4, runtime_id: runtimeId, providers: [publicProvider] })); child.emit("close", 0); }); return child;
    } });
    replayClient.capabilitySnapshot = brokerClient.capabilitySnapshot;
    return replayClient.run({ ...binding, privateRawDirectory: join(infra, `replay-${label}`) });
  };
  const rootTamper = JSON.parse(originalState.toString("utf8")); rootTamper.attachments.redaction_root_set_hash = "0".repeat(64);
  await expect(replay(rootTamper, "root")).rejects.toThrow(/redaction root set/i);
  const traversalTamper = JSON.parse(originalState.toString("utf8")); traversalTamper.providers.opencode.delivery.provider_visible_attachment_manifest[0].destination = "../escape";
  await expect(replay(traversalTamper, "traversal")).rejects.toThrow(/provider-visible manifest is unsafe/i);
  const missingIds = structuredClone(r2RunBinding); delete missingIds.request.attachment_ids;
  await expect(replay(JSON.parse(originalState.toString("utf8")), "missing-ids", missingIds)).rejects.toThrow(/host request attachment binding is incomplete/i);
  const rawWorkspace = join(runtimeRoot, runtimeId, "workspace", readdirSync(join(runtimeRoot, runtimeId, "workspace")).find((name) => name.startsWith("raw-opencode-delta-")));
  const rawPacketPath = join(rawWorkspace, "review-packet.v1.json"); const rawPacket = Buffer.concat([readFileSync(rawPacketPath), Buffer.from("\n")]); chmodSync(rawPacketPath, 0o600); writeFileSync(rawPacketPath, rawPacket);
  const rawManifestPath = join(rawWorkspace, "attachments-manifest.json"); const rawManifest = JSON.parse(readFileSync(rawManifestPath, "utf8")); const rawPacketRecord = rawManifest.files.find((item) => item.target === "review-packet.v1.json"); rawPacketRecord.size = rawPacket.length; rawPacketRecord.sha256 = sha(rawPacket); chmodSync(rawManifestPath, 0o600); writeFileSync(rawManifestPath, JSON.stringify(rawManifest));
  await expect(replay(JSON.parse(originalState.toString("utf8")), "raw-packet")).rejects.toThrow(/raw workspace differs from the frozen host request/i);
  writeFileSync(statePath, originalState);
}, 30_000);
