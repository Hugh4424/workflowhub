import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assertProviderRound, assertWhAggregate, buildThirdReviewRunArgs, createPersistentAttachmentBundle, createSmokeHostEnvironment, directContinuationBinding, directPrompt, writePassEvidence } from "../run-wh-review-provider-smoke.mjs";
import { loadTrustedThirdReviewConfig } from "../../skills/wh-review/scripts/third-review-host-config.mjs";
import { reviewPacketHash } from "../../skills/wh-review/scripts/review-packet-integrity.mjs";

const script = fileURLToPath(new URL("../run-wh-review-provider-smoke.mjs", import.meta.url));
const sha = (value) => createHash("sha256").update(value).digest("hex");
const canonical = (value) => Array.isArray(value) ? `[${value.map(canonical).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}` : JSON.stringify(value);

describe("run-wh-review-provider-smoke", () => {
  it("reports an explicit SKIP before reading host config unless real-provider opt-in is set", () => {
    const result = spawnSync(process.execPath, [script], {
      env: { PATH: process.env.PATH ?? "", HOME: "/missing-wh-review-smoke-home" },
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      status: "SKIP",
      reason: "WH_REVIEW_PROVIDER_SMOKE=1 is required",
    });
    expect(result.stdout).not.toContain("PASS");
  });

  it("overrides the broker command only for an explicit smoke source root", () => {
    const root = mkdtempSync(join(tmpdir(), "wh-review-smoke-override-")); const source = join(root, "3rd-review"); const output = join(root, "output");
    mkdirSync(join(source, "scripts"), { recursive: true }); writeFileSync(join(source, "scripts", "3rd-review.mjs"), "// fixture\n");
    const trusted = { command: [process.execPath, "/stable/3rd-review.mjs"], config: "/stable/config.json", attachmentRoot: "/stable/attachments" };
    expect(createSmokeHostEnvironment({ thirdReview: trusted, outputRoot: output, sourceRoot: null })).toEqual({ thirdReview: trusted, env: null, hostConfig: null });
    const overridden = createSmokeHostEnvironment({ thirdReview: trusted, outputRoot: output, sourceRoot: source, home: root });
    expect(overridden.thirdReview.command).toEqual([process.execPath, join(source, "scripts", "3rd-review.mjs")]);
    expect(JSON.parse(readFileSync(overridden.hostConfig, "utf8"))).toMatchObject({ third_review: { command: overridden.thirdReview.command, config: trusted.config, attachment_root: trusted.attachmentRoot } });
    expect(overridden.env.HOME).not.toBe(root);
  });

  it("turns a provider terminal-output failure into an explicit smoke failure", () => {
    expect(() => assertProviderRound({
      providerId: "kimi", round: 1, expectedMarker: "R1_DIFF_MARKER",
      response: { runtime_id: "runtime", providers: [{ provider: "kimi", status: "failed", error: { code: "PROVIDER_OUTPUT_INVALID" } }] },
    })).toThrow("SMOKE_KIMI_R1_FAIL: provider status=failed; PROVIDER_OUTPUT_INVALID");
  });

  it("uses the host delivery receipt for packet and diff hashes instead of model echo", () => {
    const packetHash = "a".repeat(64); const diffHash = "b".repeat(64);
    expect(() => assertProviderRound({
      providerId: "kimi", round: 1, expectedMarker: "R1_DIFF_MARKER", expectedPacketHash: packetHash, expectedDiffSha256: diffHash,
      response: { providers: [{ provider: "kimi", status: "completed", session_id: "native", raw_stdout_sha256: "c".repeat(64), output: "R1_DIFF_MARKER", delivery: { derived_attestation: { packet_hash: packetHash, diff_sha256: "d".repeat(64) } } }] },
    })).toThrow("SMOKE_KIMI_R1_FAIL: host delivery receipt did not bind packet/diff hashes");
  });

  it("validates a direct 3rd-review delivery from the local bundle and public attachment receipt", () => {
    const root = mkdtempSync(join(tmpdir(), "wh-review-direct-delivery-"));
    try {
      const diff = "+R1_DIFF_MARKER\n";
      const packet = { version: "review-packet.v1", manifest_hash: "m".repeat(64), diff_sha256: sha(diff), unified_diff: diff };
      packet.packet_hash = reviewPacketHash(packet);
      const packetText = `${JSON.stringify(packet, null, 2)}\n`;
      const materialEntries = [
        { destination: "review-packet.v1.json", source: "review-packet.v1.json", size: Buffer.byteLength(packetText), sha256: sha(packetText) },
        { destination: "changes.diff", source: "changes.diff", size: Buffer.byteLength(diff), sha256: sha(diff) },
      ];
      writeFileSync(join(root, "review-packet.v1.json"), packetText); writeFileSync(join(root, "changes.diff"), diff);
      const visibleManifest = { version: "review-attachment-manifest.v1", packet_hash: packet.packet_hash, diff_sha256: packet.diff_sha256, attachments: materialEntries.map(({ destination, size, sha256 }) => ({ destination, size, sha256 })) };
      visibleManifest.inner_manifest_hash = sha(canonical(visibleManifest));
      const manifestText = `${JSON.stringify(visibleManifest, null, 2)}\n`; writeFileSync(join(root, "manifest.json"), manifestText);
      const entries = [...materialEntries, { destination: "manifest.json", source: "manifest.json", size: Buffer.byteLength(manifestText), sha256: sha(manifestText) }];
      const outcome = assertProviderRound({
        providerId: "opencode", round: 1, expectedMarker: "R1_DIFF_MARKER", expectedPacketHash: packet.packet_hash, expectedDiffSha256: packet.diff_sha256,
        directBundle: { staging: root, manifest: { entries } },
        response: { providers: [{ provider: "opencode", status: "completed", session_id: "native", raw_stdout_sha256: "c".repeat(64), output: "R1_DIFF_MARKER", delivery: { provider_visible_attachment_manifest: entries.map(({ destination, size, sha256 }) => ({ destination, size, sha256 })) } }] },
      });
      expect(outcome.session_id).toBe("native");
      expect(() => assertProviderRound({
        providerId: "opencode", round: 1, expectedMarker: "R1_DIFF_MARKER", expectedPacketHash: packet.packet_hash, expectedDiffSha256: packet.diff_sha256,
        directBundle: { staging: root, manifest: { entries } },
        response: { providers: [{ provider: "opencode", status: "completed", session_id: "native", raw_stdout_sha256: "c".repeat(64), output: "R1_DIFF_MARKER", delivery: { provider_visible_attachment_manifest: [{ ...entries[0], sha256: "f".repeat(64) }, entries[1]] } }] },
      })).toThrow("public attachment receipt does not match local bundle");
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it("binds the first direct delta to initial material without inventing a predecessor", () => {
    expect(directContinuationBinding({ initialMaterialManifestHash: "a".repeat(64) })).toEqual({
      initial_material_manifest_hash: "a".repeat(64), sequence: 1, previous_delivery_manifest_hash: null,
    });
  });

  it("binds later direct deltas to the immediately preceding delta delivery", () => {
    expect(directContinuationBinding({ initialMaterialManifestHash: "a".repeat(64), priorDeltaDeliveryManifestHashes: ["b".repeat(64), "c".repeat(64)] })).toEqual({
      initial_material_manifest_hash: "a".repeat(64), sequence: 3, previous_delivery_manifest_hash: "c".repeat(64),
    });
  });

  it("checks a corrected Kimi round against initial raw visibility and final parsed marker evidence", () => {
    const root = mkdtempSync(join(tmpdir(), "wh-review-smoke-correction-marker-"));
    try {
      const round = join(root, "round"); const attempt1 = join(round, "attempts", "attempt-1"); const attempt2 = join(round, "attempts", "attempt-2");
      mkdirSync(attempt1, { recursive: true }); mkdirSync(attempt2, { recursive: true });
      const initialRaw = join(attempt1, "initial.raw"); const correctionRaw = join(attempt2, "correction.raw"); const parsed = join(attempt2, "parsed.json");
      writeFileSync(initialRaw, "tool result: R2_DELTA_ONLY_MARKER");
      writeFileSync(correctionRaw, '{"text":"R2_"}\n{"text":"DELTA_ONLY_MARKER"}\n');
      writeFileSync(parsed, JSON.stringify({ summary: "Reviewed R2_DELTA_ONLY_MARKER" }));
      writeFileSync(join(attempt1, "attempt-receipt.json"), JSON.stringify({ provider_outcomes: [{ provider: "kimi", raw_output_ref: initialRaw }] }));
      writeFileSync(join(attempt2, "attempt-receipt.json"), JSON.stringify({ provider_outcomes: [] }));
      const packetHash = "a".repeat(64); const diffHash = "b".repeat(64); const rawHash = sha(readFileSync(correctionRaw));
      const outcome = { provider: "kimi", transport_status: "completed", packet_status: "complete", business_valid: true, session_id: "same", raw_stdout_sha256: rawHash, raw_output_ref: correctionRaw, parsed_output_ref: parsed, summary: "Reviewed R2_DELTA_ONLY_MARKER", delivery: { derived_attestation: { packet_hash: packetHash, diff_sha256: diffHash } } };
      expect(assertWhAggregate({ path: join(round, "round-receipt.json"), value: { runtime_id: "runtime", intent: { business_round: 2 }, provider_outcomes: [outcome], merged_findings: [] } }, { packet_hash: packetHash, diff_sha256: diffHash }, "R2_DELTA_ONLY_MARKER")).toBe(outcome);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it("defines packet_hash over canonical packet content without self-reference", () => {
    const packet = { version: "review-packet.v1", manifest_hash: "m".repeat(64), diff_sha256: "d".repeat(64), nested: { b: 2, a: 1 } };
    const hash = reviewPacketHash(packet);
    expect(reviewPacketHash({ ...packet, packet_hash: "0".repeat(64) })).toBe(hash);
    expect(reviewPacketHash({ ...packet, manifest_hash: "e".repeat(64) })).not.toBe(hash);
  });

  it("keeps R2 smoke material in its attachment workspace, not the prompt", () => {
    const hash = (character) => character.repeat(64);
    const previous = { version: "review-packet.v1", stage: "build-code", review_track: null, round_kind: "initial", baseline_packet_hash: null, packet_hash: hash("a"), manifest_hash: hash("b"), diff_sha256: hash("c"), unified_diff: "R1_DIFF_MARKER", changed_files: [], raw_requirement: "x", acceptance_design_excerpt: "R1_DIFF_MARKER", test_evidence: [], host_verified_facts: [], contract_hash: hash("d"), skill_bundle_hash: hash("e"), source_revision: { base: "f".repeat(40), head: "g".repeat(40) } };
    const current = { ...previous, round_kind: "continuation", baseline_packet_hash: previous.packet_hash, packet_hash: hash("h"), manifest_hash: hash("i"), diff_sha256: hash("j"), acceptance_design_excerpt: "R2_DELTA_ONLY_MARKER", source_revision: { base: previous.source_revision.base, head: "k".repeat(40) }, previous_packet: previous, delta_diff: "+R2_DELTA_ONLY_MARKER", delta_changed_files: [] };
    const prompt = directPrompt(current, 2, {
      attachmentIds: ["review-packet.v1.json", "changes.diff", "manifest.json"],
      providerVisibleManifestHash: hash("f"),
    });
    expect(prompt).toContain("attachment_ids=review-packet.v1.json,changes.diff,manifest.json");
    expect(prompt).not.toContain("attachment_manifest_sha256=");
    expect(prompt).not.toContain(hash("f"));
    expect(prompt).not.toContain("R2_DELTA_ONLY_MARKER");
    expect(prompt).not.toContain("R1_DIFF_MARKER");
    expect(prompt).toContain("Read manifest.json first");
    expect(prompt).not.toContain("provider adapter's attachment-root instruction");
    expect(prompt).not.toContain("bundle/manifest.json");
  });

  it("creates trusted task worktree state for the Kimi CLI instead of forwarding a repository path", () => {
    const source = readFileSync(script, "utf8");
    expect(source).toContain('"worktree.json"');
    expect(source).not.toContain("repository_root: source");
  });

  it("captures R1 and R2 from uncommitted worktrees without creating review commits", () => {
    const source = readFileSync(script, "utf8");
    expect(source).toContain("captureWorktreeTree");
    expect(source).toContain("SMOKE_SOURCE_FAIL: R1/R2 capture created a commit");
    expect(source).toContain("SMOKE_KIMI_FAIL: R1/R2 review created a commit");
    expect(source).not.toContain('commit", "-qm", "round 1"');
    expect(source).not.toContain('commit", "-qm", "round 2 delta"');
  });

  it("requires both providers for a passing live acceptance result", () => {
    const source = readFileSync(script, "utf8");
    expect(source).not.toContain("WH_REVIEW_SMOKE_SKIP_KIMI");
    expect(source).toContain("evidence.runtimes = { kimi: kimiEvidence, opencode:");
  });

  it("proves R2 continues from the R1 snapshot without changing either source HEAD", () => {
    const source = readFileSync(script, "utf8");
    expect(source).toContain("kimiR2Packet.source_revision.base_tree === kimiR1Packet.source_revision.snapshot_tree");
    expect(source).toContain("SMOKE_OPENCODE_FAIL: R1/R2 review created a commit");
    expect(source).toContain('provider_allowlist: ["kimi"]');
    expect(source).toContain('dispositions: { items: [] }');
    expect(source).toContain('command: "verify-final"');
    expect(source).toContain("kimiVerify.approved_tree === kimiR2Packet.source_revision.snapshot_tree");
  });

  it("persists the OpenCode bundle under the attachment root allowlisted by trusted config", () => {
    const root = mkdtempSync(join(tmpdir(), "wh-review-smoke-attachments-"));
    try {
      const packetRoot = join(root, "packet-root"); mkdirSync(packetRoot);
      const brokerConfig = join(root, "3rd-review.json"); writeFileSync(brokerConfig, JSON.stringify({ attachment_roots: [{ root: packetRoot, sources: [".wh-review-packets"] }] }));
      const hostConfig = join(root, "workflowhub.json"); writeFileSync(hostConfig, JSON.stringify({ third_review: { command: [process.execPath, "/broker/3rd-review.mjs"], config: brokerConfig, attachment_root: packetRoot } }));
      const trusted = loadTrustedThirdReviewConfig({ hostConfigPath: hostConfig });
      const diff = "diff --git a/a b/a\n";
      const bundle = createPersistentAttachmentBundle(trusted, {
        version: "review-packet.v1", stage: "build-code", review_track: null, round_kind: "initial", baseline_packet_hash: null,
        packet_hash: "0".repeat(64), manifest_hash: "1".repeat(64), diff_sha256: sha(diff), unified_diff: diff, changed_files: [],
        raw_requirement: "smoke", acceptance_design_excerpt: "smoke", test_evidence: [], host_verified_facts: [],
        contract_hash: "2".repeat(64), skill_bundle_hash: "3".repeat(64), source_revision: { base_tree: "4".repeat(40), snapshot_tree: "5".repeat(40), captured_head: "6".repeat(40) },
      }, "bundle");
      const allowedRoot = trusted.attachmentRoot;

      expect(bundle.attachmentRoot).toBe(allowedRoot);
      expect(bundle.staging.startsWith(`${allowedRoot}/`)).toBe(true);
      for (const entry of bundle.manifest.entries) expect(existsSync(join(bundle.attachmentRoot, entry.source))).toBe(true);
      expect(bundle.manifest.entries.every((entry) => entry.embed === false)).toBe(true);
      const visible = JSON.parse(readFileSync(join(bundle.attachmentRoot, bundle.manifest.entries.find((entry) => entry.destination === "manifest.json").source), "utf8"));
      expect(visible.version).toBe("review-attachment-manifest.v1");
      expect(visible.manifest_hash).toBe(bundle.materialManifestHash);
      const protocolRecords = bundle.manifest.entries.map(({ destination: target, sha256, size, embed }) => ({ target, sha256, size, embed }));
      expect(bundle.materialManifestHash).toBe(sha(canonical({ version: 1, bundle_id: "bundle", files: protocolRecords.filter((item) => !["review-packet.v1.json", "manifest.json"].includes(item.target)) })));
      expect(visible.delivery_manifest_hash).toBe(sha(canonical({ version: 1, bundle_id: "bundle", delivery_mode: "file_only", files: protocolRecords.filter((item) => item.target !== "manifest.json") })));
      expect(bundle.packet.manifest_hash).toBe(bundle.materialManifestHash);
      expect(visible.attachments).toEqual(bundle.manifest.entries.filter((entry) => entry.destination !== "manifest.json").map(({ destination, sha256, size }) => ({ destination, sha256, size })));
      expect(buildThirdReviewRunArgs(trusted, { requestPath: "/tmp/request.json", attachments: "/tmp/attachments.json", delivery: "always_embed" }).args).toContain(`--attachments-root=${allowedRoot}`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("writes and reopens complete provider evidence with a persistent attachment bundle", () => {
    const root = mkdtempSync(join(tmpdir(), "wh-review-smoke-evidence-"));
    const file = (relative, content = "evidence") => {
      const path = join(root, relative); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, content);
      return path;
    };
    try {
      const bundle = join(root, ".wh-review-packets", "bundle");
      const attachment = file(".wh-review-packets/bundle/review-packet.v1.json", "frozen packet");
      const manifest = file("opencode-r1-attachments.json", JSON.stringify({ entries: [{ source: ".wh-review-packets/bundle/review-packet.v1.json" }] }));
      const kimiReceipts = [file("kimi-r1-receipt.json"), file("kimi-r2-receipt.json")];
      const kimiRequests = [file("kimi-r1-input.json"), file("kimi-r2-input.json")];
      const kimiExecutions = [file("kimi-r1-cli.json"), file("kimi-r2-cli.json")];
      const opencodeRequests = [file("opencode-r1-request.json"), file("opencode-r2-request.json")];
      const opencodeExecutions = [file("opencode-r1-response.json"), file("opencode-r2-response.json")];
      const evidencePath = join(root, "evidence.json");

      writePassEvidence(evidencePath, { status: "RUNNING", output_root: root }, {
        kimiEvidence: { runtime_id: "kimi-runtime", session_id: "kimi-session", raw_stdout_sha256: ["a".repeat(64), "b".repeat(64)], receipts: kimiReceipts, requests: kimiRequests, executions: kimiExecutions },
        opencodeEvidence: { runtime_id: "opencode-runtime", session_id: "opencode-session", raw_stdout_sha256: ["c".repeat(64), "d".repeat(64)], requests: opencodeRequests, executions: opencodeExecutions, attachments: { root, bundle, manifests: [manifest] } },
      });

      const frozen = JSON.parse(readFileSync(evidencePath, "utf8"));
      expect(frozen).toMatchObject({ status: "PASS", runtimes: { kimi: { runtime_id: "kimi-runtime", session_id: "kimi-session", receipts: kimiReceipts, requests: kimiRequests, executions: kimiExecutions }, opencode: { runtime_id: "opencode-runtime", session_id: "opencode-session", requests: opencodeRequests, executions: opencodeExecutions, attachments: { root, bundle, manifests: [manifest] } } } });
      expect(frozen.runtimes.kimi.raw_stdout_sha256).toEqual(["a".repeat(64), "b".repeat(64)]);
      expect(frozen.runtimes.opencode.raw_stdout_sha256).toEqual(["c".repeat(64), "d".repeat(64)]);
      for (const path of [...frozen.runtimes.kimi.receipts, ...frozen.runtimes.kimi.requests, ...frozen.runtimes.kimi.executions, ...frozen.runtimes.opencode.requests, ...frozen.runtimes.opencode.executions, ...frozen.runtimes.opencode.attachments.manifests]) expect(existsSync(path)).toBe(true);
      const frozenManifest = JSON.parse(readFileSync(frozen.runtimes.opencode.attachments.manifests[0], "utf8"));
      for (const entry of frozenManifest.entries) expect(existsSync(join(frozen.runtimes.opencode.attachments.root, entry.source))).toBe(true);
      expect(existsSync(attachment)).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
