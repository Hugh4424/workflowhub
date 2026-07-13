import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ReviewRoundFacade } from "../review-round-facade.mjs";
import { contractPathAndHash } from "../lib/safe-id.mjs";

const roots = [];
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));
function root() { const value = mkdtempSync(join(tmpdir(), "wh-review-v4-")); roots.push(value); return value; }
function hash(value) { return createHash("sha256").update(value).digest("hex"); }
function canonical(value) { if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`; if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`; return JSON.stringify(value); }
function packet({ root, marker = "WH_REVIEW_SMOKE_DIFF_MARKER" } = {}) {
  writeFileSync(join(root, "a"), "x"); const unified_diff = `diff --git a/a b/a\n+${marker}\n`; const changed_files = [{ path: "a", sha256: hash("x"), size: 1 }];
  const output = {
    version: "review-packet.v1", stage: "build-code", review_track: null,
    diff_sha256: hash(unified_diff), unified_diff, changed_files, raw_requirement: "do the thing",
    acceptance_design_excerpt: "AC: works", test_evidence: [{ name: "unit", status: "passed" }],
    host_verified_facts: [], contract_hash: contractPathAndHash("build-code").contractHash, skill_bundle_hash: hash(canonical([])),
  };
  output.manifest_hash = hash(canonical({ diff_sha256: output.diff_sha256, changed_files, raw_requirement: output.raw_requirement, decision_log_excerpt: null, acceptance_design_excerpt: output.acceptance_design_excerpt, planning_artifacts: [], verification_closure: [], test_evidence: output.test_evidence, host_verified_facts: [], contract_hash: output.contract_hash, skill_bundle_hash: output.skill_bundle_hash }));
  return output;
}
function output(input, verdict = "pass", severity = "blocking") {
  return JSON.stringify({ packet_hash: input.packet_hash, manifest_hash: input.manifest_hash, diff_sha256: input.diff_sha256,
    contract_hash: input.contract_hash, skill_bundle_hash: input.skill_bundle_hash, packet_status: "complete", verdict,
    summary: "review complete", findings: verdict === "pass" ? [] : [{ file: "a", line: 1, rule_id: "hard", severity, issue: "bad", evidence: "marker", suggested_fix: "fix" }],
    checklist: [{ id: "hard", passed: verdict === "pass", evidence: "packet" }], skillResults: [],
    ...(verdict === "revise_required" ? { rootCause: "cause", fixApproach: "fix" } : {}) });
}
function fakeBroker(callback) { return { run: callback }; }

describe("ReviewRoundFacade", () => {
  it("builds one complete packet, accepts only completed/complete/business-valid output, and stores secrets privately", async () => {
    const tracking = root();
    let dispatched;
    const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async (request) => { dispatched = request; return ({
      runtime_id: "11111111-1111-4111-8111-111111111111", providers: [
        { provider: "opencode", status: "completed", session_id: "open-session", raw_output_ref: "/private/open.raw", output: output(request.packet) },
        { provider: "kimi", status: "failed", error: { code: "AUTH_ENV_MISSING" } },
      ],
    }); }) });
    const prepared = facade.prepare({ task_id: "t", stage: "build-code", review_flow_id: "flow", host_provider: "codex", packet: packet({ root: tracking }), changed_file_root: tracking, provider_capabilities: { opencode: { continuation: true } } });
    expect(prepared.packet.packet_hash).toMatch(/^[a-f0-9]{64}$/);
    const result = await facade.run(prepared);
    expect(result.provider_outcomes).toMatchObject([{ provider: "opencode", transport_status: "completed", packet_status: "complete", semantic_verdict: "pass" }, { provider: "kimi", transport_status: "authentication_failed", packet_status: "material_incomplete", semantic_verdict: null }]);
    expect(result.merged_findings).toEqual([]);
    expect(result.continuation_eligible).toBe(true);
    expect(dispatched.attachments.entries.map((entry) => entry.destination)).toContain("review-packet.v1.json");
    expect(dispatched.attachments.entries.map((entry) => entry.destination)).toContain("contracts/build-code.md");
    const privateText = readFileSync(result.receipt_draft_ref, "utf8");
    expect(privateText).toContain("open-session");
    expect(privateText).toContain("11111111-1111-4111-8111-111111111111");
    const publication = facade.publish(result, { items: [] });
    expect(readFileSync(publication.core_receipt_ref, "utf8")).not.toContain("open-session");
    expect(readFileSync(publication.core_receipt_ref, "utf8")).not.toContain("11111111-1111-4111-8111-111111111111");
  });

  it("uses the initial runtime only on continuation and refuses automatic fresh starts", async () => {
    const tracking = root(); const seen = [];
    const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async (request) => { seen.push(request); return { runtime_id: "22222222-2222-4222-8222-222222222222", providers: [{ provider: "opencode", status: "completed", session_id: "s", output: output(request.packet) }] }; }) });
    const first = await facade.run(facade.prepare({ task_id: "t", stage: "build-code", review_flow_id: "flow", host_provider: "codex", packet: packet({ root: tracking }), changed_file_root: tracking, provider_capabilities: { opencode: { continuation: true } } }));
    const second = await facade.run(facade.prepare({ task_id: "t", stage: "build-code", review_flow_id: "flow", host_provider: "codex", packet: packet({ root: tracking }), changed_file_root: tracking, provider_capabilities: { opencode: { continuation: true } }, continuation: true }));
    expect(first.intent.initial_runtime_id).toBeNull();
    expect(second.intent.initial_runtime_id).toBe("22222222-2222-4222-8222-222222222222");
    expect(seen[1].request.continuation).toEqual({ runtime_id: "22222222-2222-4222-8222-222222222222" });
  });

  it("rejects a stage or track mutation after the packet is sealed", async () => {
    const tracking = root(); const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async () => ({ providers: [] })) });
    const prepared = facade.prepare({ task_id: "t", stage: "build-code", review_flow_id: "flow", packet: packet({ root: tracking }), changed_file_root: tracking, provider_capabilities: { opencode: { continuation: true } } });
    prepared.packet.stage = "verify-code";
    await expect(facade.run(prepared)).rejects.toThrow(/sealed review packet was modified/);
  });

  it("does not aggregate cancelled, incomplete, or malformed results and requires a cancel source", async () => {
    const tracking = root();
    const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async (request) => ({ runtime_id: "33333333-3333-4333-8333-333333333333", providers: [
      { provider: "opencode", status: "cancelled", error: { code: "CANCELLED", source: "workflow_shutdown" } },
      { provider: "kimi", status: "completed", output: "not-json" },
      { provider: "codex", status: "completed", session_id: "s", output: output(request.packet, "revise_required") },
    ] })) });
    const result = await facade.run(facade.prepare({ task_id: "t", stage: "build-code", review_flow_id: "flow", host_provider: "claude-code", packet: packet({ root: tracking }), changed_file_root: tracking, provider_capabilities: { codex: { continuation: true } } }));
    expect(result.provider_outcomes.map((item) => item.semantic_verdict)).toEqual([null, null, "revise_required"]);
    expect(result.merged_findings).toHaveLength(1);
    expect(result.hard_gates).toHaveLength(1);
    expect(() => facade.publish(result, { items: [{ finding_id: result.merged_findings[0].finding_id, action: "accept", evidence: "no" }] })).toThrow(/hard invariant/);
  });

  it("seals real diff, manifest, and changed-file bytes before broker dispatch", () => {
    const tracking = root(); const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async () => ({ providers: [] })) });
    const badDiff = packet({ root: tracking }); badDiff.diff_sha256 = hash("not the diff");
    expect(() => facade.prepare({ task_id: "t", stage: "build-code", review_flow_id: "flow", packet: badDiff, changed_file_root: tracking, provider_capabilities: { opencode: { continuation: true } } })).toThrow(/MATERIAL_INCOMPLETE.*diff_sha256/);
    const badFile = packet({ root: tracking }); badFile.changed_files[0].size = 2;
    expect(() => facade.prepare({ task_id: "t", stage: "build-code", review_flow_id: "flow2", packet: badFile, changed_file_root: tracking, provider_capabilities: { opencode: { continuation: true } } })).toThrow(/MATERIAL_INCOMPLETE.*changed file/);
  });

  it("requires every declared continuable provider and serializes all flows for one task", async () => {
    const tracking = root(); const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async (request) => ({ runtime_id: "44444444-4444-4444-8444-444444444444", providers: [{ provider: "opencode", status: "completed", session_id: "s", output: output(request.packet) }] })) });
    const first = await facade.run(facade.prepare({ task_id: "t", stage: "build-code", review_flow_id: "flow", packet: packet({ root: tracking }), changed_file_root: tracking, provider_capabilities: { opencode: { continuation: true }, kimi: { continuation: true } } }));
    expect(first.continuation_eligible).toBe(false);
    expect(() => facade.prepare({ task_id: "t", stage: "build-code", review_flow_id: "flow", packet: packet({ root: tracking }), changed_file_root: tracking, provider_capabilities: { opencode: { continuation: true }, kimi: { continuation: true } }, continuation: true })).toThrow(/blocked_by_human_confirmation/);
    const held = facade.prepare({ task_id: "u", stage: "build-code", review_flow_id: "one", packet: packet({ root: tracking }), changed_file_root: tracking, provider_capabilities: { opencode: { continuation: true } } });
    expect(() => facade.prepare({ task_id: "u", stage: "build-code", review_flow_id: "two", packet: packet({ root: tracking }), changed_file_root: tracking, provider_capabilities: { opencode: { continuation: true } } })).toThrow(/review-already-running/);
    rmSync(held.lock, { recursive: true, force: true });
  });

  it("merges equivalent findings without dropping provider evidence or weakening severity", async () => {
    const tracking = root(); const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async (request) => ({ runtime_id: "55555555-5555-4555-8555-555555555555", providers: [
      { provider: "opencode", status: "completed", session_id: "o", output: output(request.packet, "revise_required", "minor") },
      { provider: "kimi", status: "completed", session_id: "k", output: output(request.packet, "revise_required", "blocking") },
    ] })) });
    const result = await facade.run(facade.prepare({ task_id: "t", stage: "build-code", review_flow_id: "flow", packet: packet({ root: tracking }), changed_file_root: tracking, provider_capabilities: { opencode: { continuation: true }, kimi: { continuation: true } } }));
    expect(result.merged_findings).toHaveLength(1); expect(result.merged_findings[0]).toMatchObject({ severity: "blocking", providers: ["kimi", "opencode"] }); expect(result.merged_findings[0].evidence_by_provider).toHaveLength(2);
  });

  it("records lock ownership, reclaims a proven-stale owner, and releases lock after prepare recovery errors", () => {
    const tracking = root(); const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async () => ({ providers: [] })) });
    const input = { task_id: "t", stage: "build-code", review_flow_id: "flow", packet: packet({ root: tracking }), changed_file_root: tracking, provider_capabilities: { opencode: { continuation: true } } };
    const lock = join(tracking, "t", "reviews", "private", "flows", "t.lock");
    mkdirSync(join(tracking, "t", "reviews", "private", "flows", "t.lock"), { recursive: true }); writeFileSync(join(tracking, "t", "reviews", "private", "flows", "t.lock", "owner.json"), JSON.stringify({ pid: 999999, created_at_ms: 1, idempotency_key: "crashed" }), { flag: "w" });
    const prepared = facade.prepare(input); const owner = JSON.parse(readFileSync(join(lock, "owner.json"), "utf8"));
    expect(owner).toMatchObject({ pid: process.pid, idempotency_key: prepared.intent.idempotency_key });
    const contender = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async () => ({ providers: [] })) });
    expect(() => contender.prepare({ ...input, review_flow_id: "contender", packet: packet({ root: tracking }) })).toThrow(/review-already-running/);
    rmSync(prepared.lock, { recursive: true, force: true });
    const broken = join(tracking, "broken", "reviews", "private", "round-crash");
    mkdirSync(broken, { recursive: true }); writeFileSync(join(broken, "projection-manifest.json"), "not-json", { flag: "w" }); writeFileSync(join(broken, "round-receipt.json"), "{}", { flag: "w" });
    const brokenInput = { ...input, task_id: "broken", review_flow_id: "next", packet: packet({ root: tracking }) };
    expect(() => facade.prepare(brokenInput)).toThrow();
    expect(() => readFileSync(join(tracking, "broken", "reviews", "private", "flows", "broken.lock", "owner.json"))).toThrow();
  });
});
