import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { EventEmitter } from "node:events";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, expect, it } from "vitest";
import { BrokerClient } from "../skills/wh-review/scripts/broker-client.mjs";
import { ReviewRoundFacade } from "../skills/wh-review/scripts/review-round-facade.mjs";
import { contractPathAndHash } from "../skills/wh-review/scripts/lib/safe-id.mjs";
import { resolveRequiredSkills } from "../skills/wh-review/scripts/required-skill-resolver.mjs";

const thirdRoot = process.env.THIRD_REVIEW_SOURCE_ROOT;
const roots = [];
afterEach(() => roots.splice(0).forEach((root) => { try { rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 20 }); } catch { /* provider cleanup may finish concurrently */ } }));
const sha = (value) => createHash("sha256").update(value).digest("hex");
const git = (root, args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();

it("production builder and v5 broker preserve packet, diff, and manifest bytes through provider read", async () => {
  if (!thirdRoot) throw new Error("THIRD_REVIEW_SOURCE_ROOT is required for the cross-repository E2E");
  const root = mkdtempSync(join(tmpdir(), "wh-review-exact-e2e-")); roots.push(root);
  const infra = mkdtempSync(join(tmpdir(), "wh-review-exact-infra-")); roots.push(infra);
  git(root, ["init", "-q"]); git(root, ["config", "user.email", "review@example.test"]); git(root, ["config", "user.name", "Review Test"]);
  writeFileSync(join(root, "a"), "old\n"); git(root, ["add", "a"]); git(root, ["commit", "-qm", "base"]);
  writeFileSync(join(root, "a"), `MARKER_HEAD\n${"x".repeat(64 * 1024)}\nMARKER_MIDDLE\n${"y".repeat(64 * 1024)}\nMARKER_TAIL\n`);
  const runtimeRoot = join(infra, "runtime"); const config = join(infra, "3rd-review.json");
  const provider = resolve("tests/fixtures/derived-review-provider.mjs"); chmodSync(provider, 0o755);
  writeFileSync(config, JSON.stringify({ version: 4, runtime: { root: runtimeRoot, ttl_hours: 24, max_prompt_bytes: 524288, max_output_bytes: 1048576, max_attachment_bytes: 1048576, liveness_interval_ms: 5, max_wall_clock_ms: 5000, orphan_timeout_ms: 1000 }, attachment_roots: [{ root: resolve("."), sources: [".wh-review-packets"] }], tiers: [["opencode"]], providers: { opencode: { enabled: true, command: provider, model: null, effort: null, thinking: null, auth: { type: "native" }, env: [] } } }));
  const client = new BrokerClient({ command: [process.execPath, join(thirdRoot, "scripts/3rd-review.mjs")], config, attachmentRoot: resolve(".") });
  let binding; let producerBytes; const broker = { discoverCapabilities: (...args) => client.discoverCapabilities(...args), status: (...args) => client.status(...args), run: (args) => { binding = structuredClone(args); producerBytes = new Map(args.attachments.entries.map((item) => [item.destination, readFileSync(join(resolve("."), item.source))])); return client.run(args); } };
  const facade = new ReviewRoundFacade({ taskTrackingRoot: root, sourceRoot: root, broker, requiredSkillResolver: (input) => ({ ...resolveRequiredSkills(input), deliveryMode: "file_only" }) });
  const packet = { version: "review-packet.v1", stage: "build-code", review_track: null, raw_requirement: "review", acceptance_design_excerpt: "AC: works", test_evidence: [{ name: "unit", status: "passed" }], host_verified_facts: [], contract_hash: contractPathAndHash("build-code").contractHash, skill_bundle_hash: sha("[]") };
  const prepared = await facade.prepare({ task_id: "exact", stage: "build-code", review_flow_id: "flow", host_provider: "codex", packet });
  const result = await facade.run(prepared); const outcome = result.provider_outcomes[0];
  expect(outcome).toMatchObject({ transport_status: "completed", packet_status: "complete", business_valid: true, semantic_verdict: "pass", delivery: { byte_identity: "verified" } });
  expect(outcome.delivery.sealed_manifest_hash).toBe(outcome.delivery.provider_visible_manifest_hash);
  const state = JSON.parse(readFileSync(join(runtimeRoot, JSON.parse(readFileSync(result.receipt_draft_ref)).runtime_id, "state.json"))); const workspace = join(runtimeRoot, state.runtime_id, "workspace", "opencode");
  for (const name of ["review-packet.v1.json", "changes.diff", "manifest.json"]) {
    expect(producerBytes.get(name)).toEqual(readFileSync(join(workspace, name)));
  }
  const hashes = ["review-packet.v1.json", "changes.diff", "manifest.json"].map((name) => sha(readFileSync(join(workspace, name))));
  expect(outcome.summary).toBe(`PROVIDER_READ:${hashes.join(":")}:true:true:true`);
  const statePath = join(runtimeRoot, state.runtime_id, "state.json"); const originalState = readFileSync(statePath);
  const makeReplay = (publicProvider) => new BrokerClient({ command: [process.execPath, "unused.mjs"], config, attachmentRoot: resolve("."), spawnImpl() {
    const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
    queueMicrotask(() => { child.stdout.emit("data", JSON.stringify({ version: 4, runtime_id: state.runtime_id, providers: [publicProvider] })); child.emit("close", 0); }); return child;
  } });
  const sizeTamper = structuredClone(state); sizeTamper.providers.opencode.delivery.material_total_bytes += 1; writeFileSync(statePath, JSON.stringify(sizeTamper));
  const sizePublic = structuredClone(sizeTamper.providers.opencode); delete sizePublic.raw_stdout_ref; delete sizePublic.raw_stderr_ref;
  const sizeReplay = makeReplay(sizePublic); sizeReplay.capabilitySnapshot = client.capabilitySnapshot;
  await expect(sizeReplay.run({ ...binding, privateRawDirectory: join(infra, "size-audit") })).rejects.toThrow(/exact-copy receipt is incomplete/i);
  writeFileSync(statePath, originalState);
  const changed = join(workspace, "changes.diff"); chmodSync(changed, 0o600); writeFileSync(changed, Buffer.concat([readFileSync(changed), Buffer.from("tampered")]));
  const publicProvider = structuredClone(state.providers.opencode); delete publicProvider.raw_stdout_ref; delete publicProvider.raw_stderr_ref;
  const replay = makeReplay(publicProvider); replay.capabilitySnapshot = client.capabilitySnapshot;
  await expect(replay.run({ ...binding, privateRawDirectory: join(infra, "tamper-audit") })).rejects.toThrow(/exact-copy workspace is missing or ambiguous/i);
}, 30_000);
