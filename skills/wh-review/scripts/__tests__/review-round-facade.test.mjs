import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ReviewRoundFacade } from "../review-round-facade.mjs";
import { contractPathAndHash } from "../lib/safe-id.mjs";

const roots = [];
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));
function root() { const value = mkdtempSync(join(tmpdir(), "wh-review-v4-")); roots.push(value); return value; }
function hash(value) { return "a".repeat(64); }
function packet({ marker = "WH_REVIEW_SMOKE_DIFF_MARKER" } = {}) {
  return {
    version: "review-packet.v1", stage: "build-code", review_track: null,
    manifest_hash: hash("manifest"), diff_sha256: hash("diff"), unified_diff: `diff --git a/a b/a\n+${marker}\n`,
    changed_files: [{ path: "a", sha256: hash("file"), size: 1 }], raw_requirement: "do the thing",
    acceptance_design_excerpt: "AC: works", test_evidence: [{ name: "unit", status: "passed" }],
    host_verified_facts: [], contract_hash: contractPathAndHash("build-code").contractHash, skill_bundle_hash: hash("skills"),
  };
}
function output(input, verdict = "pass") {
  return JSON.stringify({ packet_hash: input.packet_hash, manifest_hash: input.manifest_hash, diff_sha256: input.diff_sha256,
    contract_hash: input.contract_hash, skill_bundle_hash: input.skill_bundle_hash, packet_status: "complete", verdict,
    summary: "review complete", findings: verdict === "pass" ? [] : [{ file: "a", line: 1, rule_id: "hard", severity: "blocking", issue: "bad", evidence: "marker", suggested_fix: "fix" }],
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
    const prepared = facade.prepare({ task_id: "t", stage: "build-code", review_flow_id: "flow", host_provider: "codex", packet: packet() });
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
    const first = await facade.run(facade.prepare({ task_id: "t", stage: "build-code", review_flow_id: "flow", host_provider: "codex", packet: packet() }));
    const second = await facade.run(facade.prepare({ task_id: "t", stage: "build-code", review_flow_id: "flow", host_provider: "codex", packet: packet(), continuation: true }));
    expect(first.intent.initial_runtime_id).toBeNull();
    expect(second.intent.initial_runtime_id).toBe("22222222-2222-4222-8222-222222222222");
    expect(seen[1].request.continuation).toEqual({ runtime_id: "22222222-2222-4222-8222-222222222222" });
  });

  it("does not aggregate cancelled, incomplete, or malformed results and requires a cancel source", async () => {
    const tracking = root();
    const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async (request) => ({ runtime_id: "33333333-3333-4333-8333-333333333333", providers: [
      { provider: "opencode", status: "cancelled", error: { code: "CANCELLED", source: "workflow_shutdown" } },
      { provider: "kimi", status: "completed", output: "not-json" },
      { provider: "codex", status: "completed", session_id: "s", output: output(request.packet, "revise_required") },
    ] })) });
    const result = await facade.run(facade.prepare({ task_id: "t", stage: "build-code", review_flow_id: "flow", host_provider: "claude-code", packet: packet() }));
    expect(result.provider_outcomes.map((item) => item.semantic_verdict)).toEqual([null, null, "revise_required"]);
    expect(result.merged_findings).toHaveLength(1);
    expect(result.hard_gates).toHaveLength(1);
    expect(() => facade.publish(result, { items: [{ finding_id: result.merged_findings[0].finding_id, action: "accept", evidence: "no" }] })).toThrow(/hard invariant/);
  });
});
