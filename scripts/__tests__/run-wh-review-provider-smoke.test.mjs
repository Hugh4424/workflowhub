import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { assertProviderRound, directPrompt } from "../run-wh-review-provider-smoke.mjs";
import { reviewPacketHash } from "../../skills/wh-review/scripts/review-packet-integrity.mjs";

const script = fileURLToPath(new URL("../run-wh-review-provider-smoke.mjs", import.meta.url));

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

  it("turns a provider terminal-output failure into an explicit smoke failure", () => {
    expect(() => assertProviderRound({
      providerId: "kimi", round: 1, expectedMarker: "R1_DIFF_MARKER",
      response: { runtime_id: "runtime", providers: [{ provider: "kimi", status: "failed", error: { code: "PROVIDER_OUTPUT_INVALID" } }] },
    })).toThrow("SMOKE_KIMI_R1_FAIL: provider status=failed; PROVIDER_OUTPUT_INVALID");
  });

  it("requires raw provider evidence to echo the frozen packet and diff hashes", () => {
    const packetHash = "a".repeat(64); const diffHash = "b".repeat(64);
    expect(() => assertProviderRound({
      providerId: "kimi", round: 1, expectedMarker: "R1_DIFF_MARKER", expectedPacketHash: packetHash, expectedDiffSha256: diffHash,
      response: { providers: [{ provider: "kimi", status: "completed", session_id: "native", raw_stdout_sha256: "c".repeat(64), output: `R1_DIFF_MARKER ${packetHash}` }] },
    })).toThrow("SMOKE_KIMI_R1_FAIL: provider raw output did not attest diff_sha256");
  });

  it("defines packet_hash over canonical packet content without self-reference", () => {
    const packet = { version: "review-packet.v1", manifest_hash: "m".repeat(64), diff_sha256: "d".repeat(64), nested: { b: 2, a: 1 } };
    const hash = reviewPacketHash(packet);
    expect(reviewPacketHash({ ...packet, packet_hash: "0".repeat(64) })).toBe(hash);
    expect(reviewPacketHash({ ...packet, manifest_hash: "e".repeat(64) })).not.toBe(hash);
  });

  it("keeps the R2 smoke prompt limited to the delta marker", () => {
    const hash = (character) => character.repeat(64);
    const previous = { version: "review-packet.v1", stage: "build-code", review_track: null, round_kind: "initial", baseline_packet_hash: null, packet_hash: hash("a"), manifest_hash: hash("b"), diff_sha256: hash("c"), unified_diff: "R1_DIFF_MARKER", changed_files: [], raw_requirement: "x", acceptance_design_excerpt: "R1_DIFF_MARKER", test_evidence: [], host_verified_facts: [], contract_hash: hash("d"), skill_bundle_hash: hash("e"), source_revision: { base: "f".repeat(40), head: "g".repeat(40) } };
    const current = { ...previous, round_kind: "continuation", baseline_packet_hash: previous.packet_hash, packet_hash: hash("h"), manifest_hash: hash("i"), diff_sha256: hash("j"), acceptance_design_excerpt: "R2_DELTA_ONLY_MARKER", source_revision: { base: previous.source_revision.base, head: "k".repeat(40) }, previous_packet: previous, delta_diff: "+R2_DELTA_ONLY_MARKER", delta_changed_files: [] };
    const prompt = directPrompt(current, 2);
    expect(prompt).toContain("R2_DELTA_ONLY_MARKER");
    expect(prompt).not.toContain("R1_DIFF_MARKER");
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
  });
});
