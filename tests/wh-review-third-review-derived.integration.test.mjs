import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, expect, it } from "vitest";
import { BrokerClient } from "../skills/wh-review/scripts/broker-client.mjs";
import { ReviewRoundFacade } from "../skills/wh-review/scripts/review-round-facade.mjs";
import { contractPathAndHash } from "../skills/wh-review/scripts/lib/safe-id.mjs";
import { resolveRequiredSkills } from "../skills/wh-review/scripts/required-skill-resolver.mjs";

const thirdRoot = process.env.THIRD_REVIEW_SOURCE_ROOT;
const roots = [];
const sha = (value) => createHash("sha256").update(value).digest("hex");
const git = (root, args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const triad = ["review-packet.v1.json", "changes.diff", "manifest.json"];
const clone = (value) => structuredClone(value);

afterEach(() => {
  for (const root of roots.splice(0)) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try { rmSync(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 10 }); break; }
      catch { /* retry transient runtime cleanup */ }
    }
  }
});

function fixtureConfig(infra, provider) {
  return {
    version: 4,
    runtime: {
      root: join(infra, "runtime"), ttl_hours: 24, max_prompt_bytes: 524288,
      max_output_bytes: 1048576, max_attachment_bytes: 2097152,
      liveness_interval_ms: 5, max_wall_clock_ms: 5000,
      orphan_timeout_ms: 1000,
    },
    attachment_roots: [{ root: resolve("."), sources: [".wh-review-packets"] }],
    tiers: [["opencode"]],
    providers: {
      opencode: { enabled: true, command: provider, model: null, effort: null, thinking: null, auth: { type: "native" }, env: [] },
    },
  };
}

function providerReadSummary(output) {
  const envelope = JSON.parse(output); const summary = JSON.parse(envelope.text).summary;
  const [prefix, packetHash, diffHash, manifestHash, head, middle, tail] = summary.split(":");
  expect(prefix).toBe("PROVIDER_READ");
  expect([head, middle, tail]).toEqual(["true", "true", "true"]);
  return { packetHash, diffHash, manifestHash };
}

function visibleHashes(delivery) {
  return Object.fromEntries(delivery.provider_visible_attachment_manifest.map((item) => [item.destination, item.sha256]));
}

const crossRepositoryIt = thirdRoot ? it : it.skip;
crossRepositoryIt(
  thirdRoot
    ? "runs real sealed exact-copy R1 correction and R2 through 3rd-review"
    : "NOT EXECUTED: set THIRD_REVIEW_SOURCE_ROOT to run the real wh-review/3rd-review E2E",
  async () => {
    const root = mkdtempSync(join(tmpdir(), "wh-review-sealed-e2e-")); roots.push(root);
    const infra = mkdtempSync(join(tmpdir(), "wh-review-sealed-infra-")); roots.push(infra);
    git(root, ["init", "-q"]); git(root, ["config", "user.email", "review@example.test"]); git(root, ["config", "user.name", "Review Test"]);
    writeFileSync(join(root, "a"), "old\n"); git(root, ["add", "a"]); git(root, ["commit", "-qm", "base"]);
    const markerText = (round) => `MARKER_HEAD ${round}\n${"x".repeat(65536)}\nMARKER_MIDDLE ${round}\n${"y".repeat(65536)}\nMARKER_TAIL ${round}\n`;
    writeFileSync(join(root, "a"), markerText("R1"));

    const provider = resolve("tests/fixtures/derived-review-provider.mjs"); chmodSync(provider, 0o755);
    const configPath = join(infra, "3rd-review.json"); const config = fixtureConfig(infra, provider);
    writeFileSync(configPath, JSON.stringify(config));
    const brokerClient = new BrokerClient({ command: [process.execPath, join(thirdRoot, "scripts/3rd-review.mjs")], config: configPath, attachmentRoot: resolve(".") });
    const bindings = [];
    const broker = {
      discoverCapabilities: (...args) => brokerClient.discoverCapabilities(...args),
      status: (...args) => brokerClient.status(...args),
      run(args) {
        if (args.attachments) {
          const bytes = Object.fromEntries(args.attachments.entries.map((item) => [item.destination, readFileSync(join(resolve("."), item.source))]));
          bindings.push({ request: clone(args.request), attachments: clone(args.attachments), attachmentDelivery: args.attachmentDelivery, bytes });
        }
        return brokerClient.run(args);
      },
    };
    const resolver = (input) => ({ ...resolveRequiredSkills(input), deliveryMode: "file_only" });
    const facade = new ReviewRoundFacade({ taskTrackingRoot: root, sourceRoot: root, broker, requiredSkillResolver: resolver });
    const packet = {
      version: "review-packet.v1", stage: "build-code", review_track: null,
      raw_requirement: "Review the exact sealed packet.", acceptance_design_excerpt: "AC: exact-copy delivery works.",
      test_evidence: [{ fact_id: "unit", kind: "command", source: "npm test", captured_at: "2026-07-15T00:00:00Z", sha256: sha("unit passed"), status: "passed", exit_code: 0 }],
      host_verified_facts: [], contract_hash: contractPathAndHash("build-code").contractHash, skill_bundle_hash: sha("[]"),
    };

    const prepared = await facade.prepare({ task_id: "sealed", stage: "build-code", review_flow_id: "flow", host_provider: "codex", packet });
    const first = await facade.run(prepared); const r1 = first.provider_outcomes[0];
    expect(r1).toMatchObject({ transport_status: "completed", packet_status: "complete", business_valid: true, semantic_verdict: "pass", session_id: "sealed-session" });
    expect(sha(readFileSync(r1.raw_output_ref))).toBe(r1.raw_stdout_sha256);
    expect(r1.delivery).toMatchObject({ delivery_mode: "file_only", byte_identity: "verified", sealed_manifest_hash: prepared.material_manifest_hash, provider_visible_manifest_hash: prepared.material_manifest_hash });
    expect(bindings).toHaveLength(1);
    const r1Attempts = readdirSync(join(prepared.dir, "attempts")).sort();
    expect(r1Attempts).toEqual(["attempt-1", "attempt-2"]);
    const invalidAttempt = JSON.parse(readFileSync(join(prepared.dir, "attempts", "attempt-1", "attempt-receipt.json"), "utf8"));
    const correctedAttempt = JSON.parse(readFileSync(join(prepared.dir, "attempts", "attempt-2", "attempt-receipt.json"), "utf8"));
    expect(invalidAttempt).toMatchObject({ runtime_id: expect.any(String), semantic_verdict: null, provider_outcomes: [{ session_id: "sealed-session", business_valid: false, diagnostic: "OUTPUT_SCHEMA_INVALID", semantic_verdict: null }] });
    expect(correctedAttempt).toMatchObject({ runtime_id: invalidAttempt.runtime_id, semantic_verdict: "pass", provider_outcomes: [{ session_id: "sealed-session", business_valid: true, semantic_verdict: "pass" }] });
    const r1Hashes = providerReadSummary(readFileSync(r1.raw_output_ref, "utf8"));
    const r1Visible = visibleHashes(r1.delivery);
    expect(r1Hashes).toEqual({ packetHash: r1Visible[triad[0]], diffHash: r1Visible[triad[1]], manifestHash: r1Visible[triad[2]] });
    for (const name of triad) expect(bindings[0].bytes[name].equals(readFileSync(join(config.runtime.root, JSON.parse(readFileSync(first.receipt_draft_ref, "utf8")).runtime_id, "workspace", "opencode", name)))).toBe(true);

    const firstReceipt = JSON.parse(readFileSync(first.receipt_draft_ref, "utf8")); const runtimeId = firstReceipt.runtime_id;
    const statePath = join(config.runtime.root, runtimeId, "state.json");
    const firstState = JSON.parse(readFileSync(statePath, "utf8"));
    expect(firstState.providers.opencode).toMatchObject({ session_id: "sealed-session", delivery: r1.delivery });
    for (const name of triad) expect(bindings[0].bytes[name].equals(readFileSync(join(config.runtime.root, runtimeId, "work", "opencode", "bundle", name)))).toBe(true);

    writeFileSync(join(root, "a"), markerText("R2"));
    const preparedR2 = await facade.prepare({ task_id: "sealed", stage: "build-code", review_flow_id: "flow", host_provider: "codex", packet, continuation: true });
    const second = await facade.run(preparedR2); const r2 = second.provider_outcomes[0];
    expect(r2).toMatchObject({ transport_status: "completed", packet_status: "complete", business_valid: true, semantic_verdict: "pass", session_id: "sealed-session" });
    expect(sha(readFileSync(r2.raw_output_ref))).toBe(r2.raw_stdout_sha256);
    expect(JSON.parse(readFileSync(second.receipt_draft_ref, "utf8")).runtime_id).toBe(runtimeId);
    expect(bindings).toHaveLength(2);
    expect(readdirSync(join(preparedR2.dir, "attempts")).sort()).toEqual(["attempt-1"]);
    const r2Hashes = providerReadSummary(readFileSync(r2.raw_output_ref, "utf8")); const r2Visible = visibleHashes(r2.delivery);
    expect(r2Hashes).toEqual({ packetHash: r2Visible[triad[0]], diffHash: r2Visible[triad[1]], manifestHash: r2Visible[triad[2]] });
    const deltaName = readdirSync(join(config.runtime.root, runtimeId, "workspace")).find((name) => name.startsWith("opencode-delta-"));
    expect(deltaName).toBeTruthy();
    for (const name of triad) expect(bindings[1].bytes[name].equals(readFileSync(join(config.runtime.root, runtimeId, "workspace", deltaName, name)))).toBe(true);
    const state = JSON.parse(readFileSync(statePath, "utf8"));
    expect(Object.keys(state.providers)).toEqual(["opencode"]); expect(state.providers.opencode.delivery).toEqual(r2.delivery);

  },
  30_000,
);
