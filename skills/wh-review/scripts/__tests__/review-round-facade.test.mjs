import { afterEach, describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { ReviewRoundFacade } from "../review-round-facade.mjs";
import { contractPathAndHash } from "../lib/safe-id.mjs";

const roots = [];
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));
function root() {
  const value = mkdtempSync(join(tmpdir(), "wh-review-v4-")); roots.push(value);
  git(value, ["init", "-q"]); git(value, ["config", "user.email", "review@example.test"]); git(value, ["config", "user.name", "Review Test"]);
  writeFileSync(join(value, "a"), "old\nline\n"); git(value, ["add", "a"]); git(value, ["commit", "-qm", "base"]);
  writeFileSync(join(value, "a"), "x"); git(value, ["add", "a"]); git(value, ["commit", "-qm", "head"]);
  return value;
}
function hash(value) { return createHash("sha256").update(value).digest("hex"); }
function canonical(value) { if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`; if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`; return JSON.stringify(value); }
function packet({ root } = {}) {
  const base = git(root, ["rev-parse", "HEAD~1"]), head = git(root, ["rev-parse", "HEAD"]);
  const unified_diff = execFileSync("git", ["diff", "--no-ext-diff", "--binary", "--find-renames", "--full-index", base, head], { cwd: root, encoding: "utf8" });
  const oldBytes = execFileSync("git", ["show", `${base}:a`], { cwd: root }); const bytes = execFileSync("git", ["show", `${head}:a`], { cwd: root });
  const changed_files = [{ path: "a", status: "modified", sha256: hash(bytes), size: bytes.length, old_sha256: hash(oldBytes), old_size: oldBytes.length }];
  const output = {
    version: "review-packet.v1", stage: "build-code", review_track: null,
    diff_sha256: hash(unified_diff), unified_diff, changed_files, raw_requirement: "do the thing",
    acceptance_design_excerpt: "AC: works", test_evidence: [{ name: "unit", status: "passed" }],
    host_verified_facts: [], contract_hash: contractPathAndHash("build-code").contractHash, skill_bundle_hash: hash(canonical([])),
    source_revision: { base, head },
  };
  output.manifest_hash = hash(canonical({ diff_sha256: output.diff_sha256, changed_files: changed_files.map(({ path, old_path, status, sha256, size, old_sha256, old_size }) => ({ path, old_path: old_path ?? null, status, sha256: sha256 ?? null, size: size ?? null, old_sha256: old_sha256 ?? null, old_size: old_size ?? null })), raw_requirement: output.raw_requirement, decision_log_excerpt: null, acceptance_design_excerpt: output.acceptance_design_excerpt, planning_artifacts: [], verification_closure: [], test_evidence: output.test_evidence, host_verified_facts: [], contract_hash: output.contract_hash, skill_bundle_hash: output.skill_bundle_hash, source_revision: output.source_revision }));
  return output;
}
function refreshPacketHashes(value) {
  value.diff_sha256 = hash(value.unified_diff);
  value.manifest_hash = hash(canonical({ diff_sha256: value.diff_sha256, changed_files: value.changed_files.map(({ path, old_path, status, sha256, size, old_sha256, old_size }) => ({ path, old_path: old_path ?? null, status, sha256: sha256 ?? null, size: size ?? null, old_sha256: old_sha256 ?? null, old_size: old_size ?? null })), raw_requirement: value.raw_requirement, decision_log_excerpt: null, acceptance_design_excerpt: value.acceptance_design_excerpt, planning_artifacts: [], verification_closure: [], test_evidence: value.test_evidence, host_verified_facts: value.host_verified_facts, contract_hash: value.contract_hash, skill_bundle_hash: value.skill_bundle_hash, source_revision: value.source_revision }));
  return value;
}
function output(input, verdict = "pass", severity = "blocking") {
  return JSON.stringify({ packet_hash: input.packet_hash, manifest_hash: input.manifest_hash, diff_sha256: input.diff_sha256,
    contract_hash: input.contract_hash, skill_bundle_hash: input.skill_bundle_hash, packet_status: "complete", verdict,
    summary: "review complete", findings: ["pass", "escalate_to_human"].includes(verdict) ? [] : [{ file: "a", line: 1, rule_id: "hard", severity, issue: "bad", evidence: "marker", suggested_fix: "fix" }],
    checklist: [{ id: "hard", passed: verdict === "pass", evidence: "packet" }], skillResults: [],
    ...(verdict === "revise_required" ? { rootCause: "cause", fixApproach: "fix" } : {}) });
}
function fakeBroker(callback) { return capabilityBroker(callback); }
function capabilityBroker(callback, snapshot = { version: 4, capabilities: { attachments: true, cancel_source: true }, providers: [
  { provider: "claude-code", status: "ready", capabilities: { continuation: false, attachment_delivery: ["file_only"] } },
  { provider: "codex", status: "ready", capabilities: { continuation: false, attachment_delivery: ["file_only"] } },
  { provider: "kimi", status: "ready", capabilities: { continuation: false, attachment_delivery: ["file_only"] } },
  { provider: "opencode", status: "ready", capabilities: { continuation: true, attachment_delivery: ["file_only"] } },
] }) { return { async run(input) {
  const response = await callback(input);
  return { ...response, providers: (response.providers ?? []).map((item) => {
    if (item.delivery_used !== undefined || !item.provider) return item;
    const mode = snapshot.providers.find((provider) => provider.provider === item.provider)?.capabilities?.attachment_delivery?.[0];
    return mode ? { ...item, delivery_used: mode } : item;
  }) };
  }, async discoverCapabilities() { return snapshot; } }; }
function git(root, args) { return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim(); }
function trustedPacket(root) {
  git(root, ["init", "-q"]); git(root, ["config", "user.email", "review@example.test"]); git(root, ["config", "user.name", "Review Test"]);
  writeFileSync(join(root, "a"), "old\nline\n"); git(root, ["add", "a"]); git(root, ["commit", "-qm", "base"]);
  const base = git(root, ["rev-parse", "HEAD"]);
  writeFileSync(join(root, "a"), "new\nline\nextra\n"); git(root, ["add", "a"]); git(root, ["commit", "-qm", "head"]);
  const head = git(root, ["rev-parse", "HEAD"]);
  const unified_diff = execFileSync("git", ["diff", "--no-ext-diff", "--binary", "--find-renames", "--full-index", base, head], { cwd: root, encoding: "utf8" });
  const changed_files = [{ path: "a", status: "modified", sha256: hash("new\nline\nextra\n"), size: Buffer.byteLength("new\nline\nextra\n"), old_sha256: hash("old\nline\n"), old_size: Buffer.byteLength("old\nline\n") }];
  const value = {
    version: "review-packet.v1", stage: "build-code", review_track: null, unified_diff, changed_files,
    raw_requirement: "do the thing", acceptance_design_excerpt: "AC: works", test_evidence: [{ name: "unit", status: "passed" }],
    host_verified_facts: [], contract_hash: contractPathAndHash("build-code").contractHash, skill_bundle_hash: hash(canonical([])), source_revision: { base, head },
  };
  return refreshPacketHashes(value);
}
function advancePacket(root, previous) {
  writeFileSync(join(root, "a"), "new\nline\nextra\nfixed\n"); git(root, ["add", "a"]); git(root, ["commit", "-qm", "delta"]);
  const base = previous.source_revision.base, head = git(root, ["rev-parse", "HEAD"]);
  const unified_diff = execFileSync("git", ["diff", "--no-ext-diff", "--binary", "--find-renames", "--full-index", base, head], { cwd: root, encoding: "utf8" });
  const oldBytes = execFileSync("git", ["show", `${base}:a`], { cwd: root }); const bytes = execFileSync("git", ["show", `${head}:a`], { cwd: root });
  return refreshPacketHashes({ ...previous, packet_hash: undefined, manifest_hash: undefined, unified_diff,
    changed_files: [{ path: "a", status: "modified", sha256: hash(bytes), size: bytes.length, old_sha256: hash(oldBytes), old_size: oldBytes.length }],
    source_revision: { base, head }, test_evidence: [{ name: "unit", status: "passed", note: "delta verified" }] });
}

describe("ReviewRoundFacade", () => {
  it("rejects caller capabilities and derives candidates from doctor after acquiring the task lock", async () => {
    const tracking = root(); const lock = join(tracking, "doctor-owned", "reviews", "private", "flows", "doctor-owned.lock");
    const broker = capabilityBroker(async (request) => ({ providers: [
      { provider: "opencode", status: "completed", session_id: "s", output: output(request.packet) },
      { provider: "/private/secret", status: "completed", session_id: "disabled", output: output(request.packet) },
    ] }), {
      version: 4, capabilities: { attachments: true, cancel_source: true }, providers: [
        { provider: "codex", status: "ready", capabilities: { continuation: true, attachment_delivery: ["file_only"] } },
        { provider: "opencode", status: "ready", capabilities: { continuation: true, attachment_delivery: ["file_only"] } },
        { provider: "kimi", status: "disabled", capabilities: { continuation: true, attachment_delivery: ["file_only"] } },
      ],
    });
    const originalDiscover = broker.discoverCapabilities; broker.discoverCapabilities = async () => { expect(existsSync(lock)).toBe(true); return originalDiscover(); };
    const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker }); const value = packet({ root: tracking });
    expect(() => facade.prepare({ task_id: "doctor-owned", stage: "build-code", review_flow_id: "rejected", host_provider: "codex", packet: value, changed_file_root: tracking, provider_capabilities: {} })).toThrow(/provider_capabilities.*caller/i);
    expect(() => facade.prepare({ task_id: "doctor-owned", stage: "build-code", review_flow_id: "delivery-rejected", host_provider: "codex", packet: value, changed_file_root: tracking, attachment_delivery: "always_embed" })).toThrow(/stage-skill-plan/i);
    const result = await facade.run(await facade.prepare({ task_id: "doctor-owned", stage: "build-code", review_flow_id: "flow", host_provider: "codex", packet: value, changed_file_root: tracking }));
    expect(result.intent.candidate_providers).toEqual(["opencode"]); expect(result.intent.continuable_providers).toEqual(["opencode"]);
    const unknown = result.provider_outcomes.find((item) => item.diagnostic === "UNKNOWN_PROVIDER");
    expect(unknown).toMatchObject({ provider: null, business_valid: false });
    expect(JSON.stringify(result)).not.toContain("/private/secret");
  });
  it("builds and verifies source evidence from immutable host git revisions instead of caller snapshots", async () => {
    const tracking = root(); const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async () => ({ providers: [] })) });
    const trusted = trustedPacket(tracking);
    const prepared = await facade.prepare({ task_id: "git", stage: "build-code", review_flow_id: "flow", packet: trusted, repository_root: tracking }); rmSync(prepared.lock, { recursive: true, force: true });
    expect(() => facade.prepare({ task_id: "tampered", stage: "build-code", review_flow_id: "flow", packet: trustedPacket(root()), repository_root: tracking, source_snapshot: { base_files: {} } })).toThrow(/source_snapshot is not accepted/);
  });

  it("makes a finding-free escalation a provider-sourced human publication gate", async () => {
    const tracking = root(); const trusted = trustedPacket(tracking);
    const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async (request) => ({ providers: [{ provider: "opencode", status: "completed", session_id: "s", output: output(request.packet, "escalate_to_human") }] })) });
    const result = await facade.run(facade.prepare({ task_id: "human", stage: "build-code", review_flow_id: "flow", packet: trusted, repository_root: tracking }));
    expect(result.human_gates).toEqual([{ provider: "opencode", verdict: "escalate_to_human", summary: "review complete" }]);
    expect(() => facade.publish(result, { items: [] })).toThrow(/human gate/);
  });

  it("derives human gates during publication and recovery when a receipt omits them", async () => {
    const tracking = root(); const trusted = trustedPacket(tracking);
    const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async (request) => ({ providers: [{ provider: "opencode", status: "completed", session_id: "s", output: output(request.packet, "escalate_to_human") }] })) });
    const result = await facade.run(facade.prepare({ task_id: "recover", stage: "build-code", review_flow_id: "first", packet: trusted, repository_root: tracking }));
    expect(() => facade.publish({ ...result, human_gates: [] }, { items: [] })).toThrow(/human gate provenance/);
    const receipt = JSON.parse(readFileSync(result.receipt_draft_ref, "utf8")); delete receipt.human_gates; receipt.dispositions = []; writeFileSync(result.receipt_draft_ref, JSON.stringify(receipt));
    await expect(facade.prepare({ task_id: "recover", stage: "build-code", review_flow_id: "second", packet: trusted, repository_root: tracking })).rejects.toThrow(/human gate/);
    expect(JSON.parse(readFileSync(join(tracking, "recover", "reviews", "stage-result-build-code.json"), "utf8"))).toMatchObject({ verdict: "escalate_to_human", semantic_verdict: "escalate_to_human", needs_human: true, blocked_by_human_gate: true });
  });

  it("revokes an old fully-projected pass when recovery finds a provider-sourced human gate", async () => {
    const tracking = root(); const trusted = trustedPacket(tracking);
    const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async (request) => ({ providers: [{ provider: "opencode", status: "completed", session_id: "s", output: output(request.packet, "escalate_to_human") }] })) });
    const result = await facade.run(facade.prepare({ task_id: "full-flags", stage: "build-code", review_flow_id: "first", packet: trusted, repository_root: tracking }));
    const receipt = JSON.parse(readFileSync(result.receipt_draft_ref, "utf8")); delete receipt.human_gates; receipt.dispositions = []; writeFileSync(result.receipt_draft_ref, JSON.stringify(receipt));
    const roundDir = join(tracking, "full-flags", "reviews", "private", "round-build-code-first-1");
    writeFileSync(join(roundDir, "projection-manifest.json"), JSON.stringify({ version: 1, done_flags: { core_receipt: true, report: true, report_index: true, stage_result: true } }));
    writeFileSync(join(tracking, "full-flags", "reviews", "build-code-first.md"), "# 审查报告\n\n结论：通过\n");
    writeFileSync(join(tracking, "full-flags", "reviews", "report-index.json"), JSON.stringify({ stage: "build-code", core_receipt_hash: "old", report: "build-code-first.md" }));
    const stageResult = join(tracking, "full-flags", "reviews", "stage-result-build-code.json"); writeFileSync(stageResult, JSON.stringify({ stage: "build-code", verdict: "pass" }));
    await expect(facade.prepare({ task_id: "full-flags", stage: "build-code", review_flow_id: "second", packet: trusted, repository_root: tracking })).rejects.toThrow(/human gate/);
    expect(JSON.parse(readFileSync(stageResult, "utf8"))).toMatchObject({ verdict: "escalate_to_human", blocked_by_human_gate: true });
    expect(readFileSync(join(tracking, "full-flags", "reviews", "build-code-first.md"), "utf8")).toContain("人工确认");
    expect(JSON.parse(readFileSync(join(tracking, "full-flags", "reviews", "report-index.json"), "utf8"))).toMatchObject({ blocked_by_human_gate: true });
  });

  it("supersedes an approved old human gate so a reset flow can prepare", async () => {
    const tracking = root(); const trusted = trustedPacket(tracking);
    const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async (request) => ({ providers: [{ provider: "opencode", status: "completed", session_id: "s", output: output(request.packet, "escalate_to_human") }] })) });
    const result = await facade.run(facade.prepare({ task_id: "reset-gate", stage: "build-code", review_flow_id: "old-flow", packet: trusted, repository_root: tracking }));
    const reset = facade.reset({ task_id: "reset-gate", stage: "build-code", review_flow_id: "old-flow", new_review_flow_id: "approved-reset", reason: "human accepted risk", human_approval_ref: "human-approval-42" });
    expect(reset).toMatchObject({ review_flow_id: "approved-reset", parent_review_flow_id: "old-flow", human_approval_ref: "human-approval-42" });
    const marker = join(dirname(result.receipt_draft_ref), "resolved-by-reset.json");
    expect(JSON.parse(readFileSync(marker, "utf8"))).toMatchObject({ status: "superseded", old_review_flow_id: "old-flow", new_review_flow_id: "approved-reset", human_approval_ref: "human-approval-42" });
    const prepared = await facade.prepare({ task_id: "reset-gate", stage: "build-code", review_flow_id: "approved-reset", packet: trusted, repository_root: tracking });
    rmSync(prepared.lock, { recursive: true, force: true });
  });

  it("blocks orphan or forged reset markers that do not bind an approved new flow", async () => {
    const tracking = root(); const trusted = trustedPacket(tracking);
    const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async (request) => ({ providers: [{ provider: "opencode", status: "completed", session_id: "s", output: output(request.packet, "escalate_to_human") }] })) });
    const result = await facade.run(facade.prepare({ task_id: "orphan-marker", stage: "build-code", review_flow_id: "old-flow", packet: trusted, repository_root: tracking }));
    const receiptBytes = readFileSync(result.receipt_draft_ref); const receipt = JSON.parse(receiptBytes);
    writeFileSync(join(dirname(result.receipt_draft_ref), "resolved-by-reset.json"), JSON.stringify({ version: 1, status: "superseded", task_id: "orphan-marker", stage: "build-code", old_review_flow_id: "old-flow", new_review_flow_id: "forged-flow", human_approval_ref: "forged-approval", reason: "forged", receipt_sha256: hash(receiptBytes), human_gates: receipt.human_gates, new_flow_ref: "flows/build-code-forged-flow.json", new_flow_sha256: "0".repeat(64) }));
    await expect(facade.prepare({ task_id: "orphan-marker", stage: "build-code", review_flow_id: "next", packet: trusted, repository_root: tracking })).rejects.toThrow(/human gate/);
  });

  it("recovers an approval-only reset after writing its successor flow initially fails", async () => {
    const tracking = root(); const trusted = trustedPacket(tracking);
    const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async (request) => ({ providers: [{ provider: "opencode", status: "completed", session_id: "s", output: output(request.packet, "escalate_to_human") }] })) });
    const result = await facade.run(facade.prepare({ task_id: "flow-write-fails", stage: "build-code", review_flow_id: "old-flow", packet: trusted, repository_root: tracking }));
    const blockedFlowPath = join(tracking, "flow-write-fails", "reviews", "private", "flows", "build-code-broken-flow.json"); mkdirSync(blockedFlowPath, { recursive: true });
    expect(() => facade.reset({ task_id: "flow-write-fails", stage: "build-code", review_flow_id: "old-flow", new_review_flow_id: "broken-flow", reason: "approved but disk failure", human_approval_ref: "human-approval-99" })).toThrow();
    expect(existsSync(join(dirname(result.receipt_draft_ref), "resolved-by-reset.json"))).toBe(false);
    const approvalPath = join(tracking, "flow-write-fails", "reviews", "private", "flows", "build-code-broken-flow.reset-approval.json");
    expect(existsSync(approvalPath)).toBe(true);
    await expect(facade.prepare({ task_id: "flow-write-fails", stage: "build-code", review_flow_id: "next", packet: trusted, repository_root: tracking })).rejects.toThrow(/human gate/);
    rmSync(blockedFlowPath, { recursive: true, force: true });
    expect(facade.reset({ task_id: "flow-write-fails", stage: "build-code", review_flow_id: "old-flow", new_review_flow_id: "broken-flow", reason: "approved but disk failure", human_approval_ref: "human-approval-99" })).toMatchObject({ review_flow_id: "broken-flow" });
    const prepared = await facade.prepare({ task_id: "flow-write-fails", stage: "build-code", review_flow_id: "broken-flow", packet: trusted, repository_root: tracking });
    rmSync(prepared.lock, { recursive: true, force: true });
  });

  it("keeps an approved reset marker valid after the successor runs, publishes, and continues", async () => {
    const tracking = root(); const trusted = trustedPacket(tracking); let calls = 0;
    const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async (request) => {
      calls += 1; return { runtime_id: "77777777-7777-4777-8777-777777777777", providers: [{ provider: "opencode", status: "completed", session_id: `s-${calls}`, output: output(request.packet ?? trusted, calls === 1 ? "escalate_to_human" : "pass") }] };
    }) });
    await facade.run(facade.prepare({ task_id: "reset-survives-run", stage: "build-code", review_flow_id: "old-flow", packet: trusted, repository_root: tracking }));
    facade.reset({ task_id: "reset-survives-run", stage: "build-code", review_flow_id: "old-flow", new_review_flow_id: "approved-flow", reason: "human approved", human_approval_ref: "approval-77" });
    const first = await facade.run(facade.prepare({ task_id: "reset-survives-run", stage: "build-code", review_flow_id: "approved-flow", packet: trusted, repository_root: tracking }));
    facade.publish(first, { items: [] });
    const flowPath = join(tracking, "reset-survives-run", "reviews", "private", "flows", "build-code-approved-flow.json");
    expect(JSON.parse(readFileSync(flowPath, "utf8"))).toMatchObject({ parent_review_flow_id: "old-flow", human_approval_ref: "approval-77" });
    const continuation = await facade.prepare({ task_id: "reset-survives-run", stage: "build-code", review_flow_id: "approved-flow", packet: trusted, repository_root: tracking, continuation: true });
    await facade.run(continuation);
  });
  it("builds one complete packet, accepts only completed/complete/business-valid output, and stores secrets privately", async () => {
    const tracking = root();
    let dispatched;
    const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async (request) => { dispatched = request; return ({
      runtime_id: "11111111-1111-4111-8111-111111111111", providers: [
        { provider: "opencode", status: "completed", session_id: "open-session", raw_output_ref: "/private/open.raw", output: output(request.packet) },
        { provider: "kimi", status: "failed", error: { code: "AUTH_ENV_MISSING" } },
      ],
    }); }) });
    const prepared = await facade.prepare({ task_id: "t", stage: "build-code", review_flow_id: "flow", host_provider: "codex", packet: packet({ root: tracking }), changed_file_root: tracking });
    expect(prepared.packet.packet_hash).toMatch(/^[a-f0-9]{64}$/);
    const result = await facade.run(prepared);
    expect(result.provider_outcomes.filter((item) => ["opencode", "kimi"].includes(item.provider))).toMatchObject([{ provider: "opencode", transport_status: "completed", packet_status: "complete", semantic_verdict: "pass" }, { provider: "kimi", transport_status: "authentication_failed", packet_status: "material_incomplete", semantic_verdict: null }]);
    expect(result).not.toHaveProperty("semantic_verdict");
    expect(result).not.toHaveProperty("core_receipt_hash");
    expect(result.merged_findings).toEqual([]);
    expect(result.continuation_eligible).toBe(true);
    expect(dispatched.attachments.entries.map((entry) => entry.destination)).toContain("review-packet.v1.json");
    expect(dispatched.attachments.entries.map((entry) => entry.destination)).toContain("contracts/build-code.md");
    const privateText = readFileSync(result.receipt_draft_ref, "utf8");
    expect(privateText).toContain("open-session");
    expect(privateText).toContain("11111111-1111-4111-8111-111111111111");
    const publication = facade.publish(result, { items: [] });
    expect(publication).toMatchObject({ semantic_verdict: "pass", core_receipt_hash: expect.stringMatching(/^[a-f0-9]{64}$/), needs_human: false });
    expect(JSON.parse(readFileSync(publication.core_receipt_ref, "utf8"))).toMatchObject({ semantic_verdict: "pass", needs_human: false });
    expect(JSON.parse(readFileSync(publication.stage_result_ref, "utf8"))).toMatchObject({ core_receipt_hash: publication.core_receipt_hash, verdict: "pass", needs_human: false });
    expect(readFileSync(publication.core_receipt_ref, "utf8")).not.toContain("open-session");
    expect(readFileSync(publication.core_receipt_ref, "utf8")).not.toContain("11111111-1111-4111-8111-111111111111");
  });

  it("serializes publication with the task lock", async () => {
    const tracking = root(); const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async (request) => ({ providers: [{ provider: "opencode", status: "completed", session_id: "s", output: output(request.packet) }] })) });
    const result = await facade.run(facade.prepare({ task_id: "publish-lock", stage: "build-code", review_flow_id: "first", packet: packet({ root: tracking }), changed_file_root: tracking }));
    const held = await facade.prepare({ task_id: "publish-lock", stage: "build-code", review_flow_id: "held", packet: packet({ root: tracking }), changed_file_root: tracking });
    expect(() => facade.publish(result, { items: [] }, { lockAlreadyHeld: true })).toThrow(/review-already-running/);
    rmSync(held.lock, { recursive: true, force: true });
    expect(() => facade.publish(result, { items: [] })).not.toThrow();
  });

  it("uses the initial runtime only on continuation and refuses automatic fresh starts", async () => {
    const tracking = root(); const seen = [];
    const value = packet({ root: tracking });
    const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async (request) => { seen.push(request); return { runtime_id: "22222222-2222-4222-8222-222222222222", providers: [{ provider: "opencode", status: "completed", session_id: "s", output: output(request.packet ?? value) }] }; }) });
    const prepared = await facade.prepare({ task_id: "t", stage: "build-code", review_flow_id: "flow", host_provider: "codex", packet: value, changed_file_root: tracking });
    prepared.resolution.deliveryMode = "always_embed";
    const first = await facade.run(prepared);
    const second = await facade.run(facade.prepare({ task_id: "t", stage: "build-code", review_flow_id: "flow", host_provider: "codex", packet: value, changed_file_root: tracking, continuation: true }));
    expect(first.intent.initial_runtime_id).toBeNull();
    expect(second.intent.initial_runtime_id).toBe("22222222-2222-4222-8222-222222222222");
    expect(seen[1].request.continuation).toEqual({ runtime_id: "22222222-2222-4222-8222-222222222222" });
    expect(seen[0].attachments).toBeTruthy();
    expect(seen[0].attachmentDelivery).toBe("file_only");
    expect(seen[1].attachments).toBeUndefined();
  });

  it("sends a full initial packet with a real multiline changes.diff attachment", async () => {
    const tracking = root(); let dispatched; let dispatchedDiff;
    const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, skillsRoot: tracking, broker: fakeBroker(async (request) => { dispatched = request; const entry = request.attachments.entries.find((item) => item.destination === "changes.diff"); dispatchedDiff = readFileSync(join(tracking, entry.source), "utf8"); return { runtime_id: "12121212-1212-4212-8212-121212121212", providers: [{ provider: "opencode", status: "completed", session_id: "s", output: output(request.packet) }] }; }) });
    const firstPacket = packet({ root: tracking });
    const prepared = await facade.prepare({ task_id: "initial-diff", stage: "build-code", review_flow_id: "flow", host_provider: "codex", packet: firstPacket, changed_file_root: tracking });
    expect(prepared.intent).toMatchObject({ round_kind: "initial", baseline_packet_hash: expect.stringMatching(/^[a-f0-9]{64}$/) });
    expect(prepared.packet).toMatchObject({ round_kind: "initial", baseline_packet_hash: null });
    const result = await facade.run(prepared);
    const diffEntry = dispatched.attachments.entries.find((entry) => entry.destination === "changes.diff");
    expect(diffEntry).toMatchObject({ sha256: prepared.packet.diff_sha256, size: Buffer.byteLength(prepared.packet.unified_diff) });
    expect(dispatchedDiff).toBe(prepared.packet.unified_diff);
    expect(dispatched.request.prompt).toContain("Must Read: changes.diff");
    expect(dispatched.request.prompt).toContain(`changes_diff_sha256=${prepared.packet.diff_sha256}`);
    const manifest = JSON.parse(readFileSync(join(dirname(result.receipt_draft_ref), "manifest.json"), "utf8"));
    expect(manifest.attachments).toContainEqual({ destination: "changes.diff", sha256: prepared.packet.diff_sha256, size: Buffer.byteLength(prepared.packet.unified_diff) });
  });

  it("derives a strict continuation delta from the previous private receipt and current verified packet", async () => {
    const tracking = root(); const calls = []; let currentPacket;
    const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async (request) => {
      calls.push(request); return { runtime_id: "34343434-3434-4434-8434-343434343434", providers: [{ provider: "opencode", status: "completed", session_id: "private-session", output: output(request.packet ?? currentPacket, calls.length === 1 ? "revise_required" : "pass") }] };
    }) });
    const initial = trustedPacket(tracking); currentPacket = initial;
    const first = await facade.run(facade.prepare({ task_id: "real-delta", stage: "build-code", review_flow_id: "flow", host_provider: "codex", packet: initial, repository_root: tracking }));
    const findingId = first.merged_findings[0].finding_id;
    currentPacket = advancePacket(tracking, initial);
    const secondPrepared = await facade.prepare({ task_id: "real-delta", stage: "build-code", review_flow_id: "flow", host_provider: "codex", packet: currentPacket, repository_root: tracking, continuation: true,
      closure_evidence: [{ finding_id: findingId, evidence: "fixed in the new commit and unit test passed" }], cross_stage_carryovers: [{ carryover_id: "verify-later", status: "open", evidence: "requires staging" }] });
    expect(secondPrepared.packet.source_revision.head).not.toBe(first.intent.baseline_packet_hash);
    const second = await facade.run(secondPrepared);
    expect(second.intent).toMatchObject({ round_kind: "continuation", baseline_packet_hash: first.intent.baseline_packet_hash });
    expect(Object.keys(calls[1]).sort()).toEqual(["request"]);
    expect(calls[1].request).toMatchObject({ continuation: { runtime_id: "34343434-3434-4434-8434-343434343434" } });
    expect(calls[1].request).not.toHaveProperty("attachments");
    expect(calls[1].request.prompt).not.toContain(initial.unified_diff);
    expect(calls[1].request.prompt).toContain("fixed\n");
    const headings = ["PreviousFindings", "ClosureEvidence", "DeltaManifest", "AffectedMaterials", "CurrentMaterialManifest", "CrossStageCarryovers", "RequiredSkillLensHashes", "OutputRequirements"];
    expect(headings.map((heading) => calls[1].request.prompt.indexOf(heading))).toEqual([...headings.map((heading) => calls[1].request.prompt.indexOf(heading))].sort((a, b) => a - b));
    expect(second).toMatchObject({ round_kind: "continuation", baseline_packet_hash: first.intent.baseline_packet_hash, previous_findings: [{ finding_id: findingId }] });
  });

  it("rejects caller-authored delta provenance and requires exact closure bindings", async () => {
    const tracking = root(); let currentPacket;
    const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async (request) => ({ runtime_id: "56565656-5656-4656-8656-565656565656", providers: [{ provider: "opencode", status: "completed", session_id: "s", output: output(request.packet ?? currentPacket, "revise_required") }] })) });
    const initial = trustedPacket(tracking); currentPacket = initial;
    const first = await facade.run(facade.prepare({ task_id: "strict-delta", stage: "build-code", review_flow_id: "flow", packet: initial, repository_root: tracking }));
    currentPacket = advancePacket(tracking, initial); const findingId = first.merged_findings[0].finding_id;
    const base = { task_id: "strict-delta", stage: "build-code", review_flow_id: "flow", packet: currentPacket, repository_root: tracking, continuation: true };
    await expect(facade.prepare({ ...base, previous_findings: [] })).rejects.toThrow(/previous_findings.*caller/i);
    await expect(facade.prepare({ ...base, delta_manifest: {} })).rejects.toThrow(/delta_manifest.*caller/i);
    await expect(facade.prepare({ ...base, affected_materials: [] })).rejects.toThrow(/affected_materials.*caller/i);
    await expect(facade.prepare({ ...base, current_material_manifest: {} })).rejects.toThrow(/current_material_manifest.*caller/i);
    await expect(facade.prepare({ ...base, closure_evidence: [] })).rejects.toThrow(/closure_evidence.*missing/i);
    await expect(facade.prepare({ ...base, closure_evidence: [{ finding_id: findingId, evidence: "x" }, { finding_id: findingId, evidence: "y" }] })).rejects.toThrow(/closure_evidence.*duplicate/i);
    await expect(facade.prepare({ ...base, closure_evidence: [{ finding_id: "unknown", evidence: "x" }] })).rejects.toThrow(/closure_evidence.*unknown/i);
    await expect(facade.prepare({ ...base, closure_evidence: [{ finding_id: findingId, evidence: "x" }], cross_stage_carryovers: [{ finding_id: findingId, status: "open" }] })).rejects.toThrow(/cross_stage_carryovers.*finding/i);
  });

  it("projects provider findings through a secret-free allowlist before private persistence and continuation", async () => {
    const tracking = root(); const calls = []; let currentPacket;
    const secret = "/private/workspace/session-raw-secret";
    const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async (request) => {
      calls.push(request); const raw = JSON.parse(output(request.packet ?? currentPacket, calls.length === 1 ? "revise_required" : "pass"));
      if (calls.length === 1) Object.assign(raw.findings[0], { session_id: "session-secret", runtime_id: "runtime-secret", raw_output_ref: secret, workspace: secret, absolute_path: secret });
      return { runtime_id: "67676767-6767-4676-8676-676767676767", providers: [{ provider: "opencode", status: "completed", session_id: "transport-session", output: JSON.stringify(raw) }] };
    }) });
    const initial = trustedPacket(tracking); currentPacket = initial;
    const first = await facade.run(facade.prepare({ task_id: "finding-allowlist", stage: "build-code", review_flow_id: "flow", packet: initial, repository_root: tracking }));
    const findingId = first.merged_findings[0].finding_id; const receipt = JSON.parse(readFileSync(first.receipt_draft_ref, "utf8"));
    expect(receipt.merged_findings[0]).toEqual(expect.objectContaining({ file: "a", finding_id: findingId }));
    expect(JSON.stringify(receipt.merged_findings)).not.toMatch(/session-secret|runtime-secret|session_id|runtime_id|raw_output_ref|workspace|absolute_path/);
    currentPacket = advancePacket(tracking, initial);
    await facade.run(facade.prepare({ task_id: "finding-allowlist", stage: "build-code", review_flow_id: "flow", packet: currentPacket, repository_root: tracking, continuation: true, closure_evidence: [{ finding_id: findingId, evidence: "fixed" }] }));
    expect(calls[1].request.prompt).not.toMatch(/session-secret|runtime-secret|session_id|runtime_id|raw_output_ref|workspace|absolute_path/);
  });

  it("rejects provider findings whose file is absolute or escapes the repository", async () => {
    const tracking = root();
    const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async (request) => {
      const raw = JSON.parse(output(request.packet, "revise_required")); raw.findings[0].file = "/private/workspace/a";
      return { providers: [{ provider: "opencode", status: "completed", session_id: "s", output: JSON.stringify(raw) }] };
    }) });
    const result = await facade.run(facade.prepare({ task_id: "absolute-finding", stage: "build-code", review_flow_id: "flow", packet: packet({ root: tracking }), repository_root: tracking }));
    expect(result.provider_outcomes[0]).toMatchObject({ business_valid: false, semantic_verdict: null, diagnostic: expect.stringMatching(/finding file.*repo-relative/i) });
    expect(result.merged_findings).toEqual([]);
  });

  it("recovers a publish receipt-to-flow binding after the receipt-write kill point", async () => {
    const tracking = root(); const trusted = trustedPacket(tracking);
    const broker = fakeBroker(async (request) => ({ runtime_id: "78787878-7878-4787-8787-787878787878", providers: [{ provider: "opencode", status: "completed", session_id: "s", output: output(request.packet ?? trusted) }] }));
    const crashing = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker, faultInjector(point) { if (point === "after-publish-receipt-write") throw new Error("simulated publish crash"); } });
    const first = await crashing.run(crashing.prepare({ task_id: "publish-recovery", stage: "build-code", review_flow_id: "flow", packet: trusted, repository_root: tracking }));
    expect(() => crashing.publish(first, { items: [] })).toThrow(/simulated publish crash/);
    const flowPath = join(tracking, "publish-recovery", "reviews", "private", "flows", "build-code-flow.json");
    const staleFlow = JSON.parse(readFileSync(flowPath, "utf8"));
    expect(staleFlow.previous_receipt_sha256).not.toBe(hash(readFileSync(first.receipt_draft_ref)));
    const recovered = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker });
    const prepared = await recovered.prepare({ task_id: "publish-recovery", stage: "build-code", review_flow_id: "flow", packet: trusted, repository_root: tracking, continuation: true });
    const healedFlow = JSON.parse(readFileSync(flowPath, "utf8"));
    expect(healedFlow.previous_receipt_sha256).toBe(hash(readFileSync(first.receipt_draft_ref)));
    expect(healedFlow).not.toHaveProperty("pending_receipt_update");
    rmSync(prepared.lock, { recursive: true, force: true });
  });

  it("enforces a host-owned UTF-8 continuation prompt byte limit before broker dispatch", async () => {
    const tracking = root(); let calls = 0; let currentPacket;
    const broker = fakeBroker(async (request) => { calls += 1; return { runtime_id: "89898989-8989-4898-8989-898989898989", providers: [{ provider: "opencode", status: "completed", session_id: "s", output: output(request.packet ?? currentPacket) }] }; });
    const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker, continuationPromptMaxBytes: 128 });
    const initial = trustedPacket(tracking); currentPacket = initial;
    await facade.run(facade.prepare({ task_id: "prompt-budget", stage: "build-code", review_flow_id: "flow", packet: initial, repository_root: tracking }));
    currentPacket = advancePacket(tracking, initial); currentPacket.test_evidence = [{ name: "utf8", status: "passed", note: "界".repeat(200) }]; refreshPacketHashes(currentPacket);
    await expect(facade.prepare({ task_id: "prompt-budget", stage: "build-code", review_flow_id: "flow", packet: currentPacket, repository_root: tracking, continuation: true, continuation_prompt_max_bytes: 9999999 })).rejects.toThrow(/caller.*continuation.*limit|continuation.*caller/i);
    await expect(facade.prepare({ task_id: "prompt-budget", stage: "build-code", review_flow_id: "flow", packet: currentPacket, repository_root: tracking, continuation: true })).rejects.toThrow(/CONTINUATION_PROMPT_TOO_LARGE.*128/);
    expect(calls).toBe(1);
  });

  it.each([
    [undefined, "DELIVERY_USED_MISSING"],
    ["auto", "DELIVERY_USED_INVALID"],
    ["file_only", "DELIVERY_USED_CAPABILITY_MISMATCH"],
  ])("makes a completed provider business-invalid when delivery_used=%s", async (delivery_used, diagnostic) => {
    const tracking = root();
    const snapshot = { version: 4, capabilities: { attachments: true, cancel_source: true }, providers: [{ provider: "opencode", status: "ready", capabilities: { continuation: true, attachment_delivery: ["always_embed"] } }] };
    const broker = { async discoverCapabilities() { return snapshot; }, async run(request) { return { runtime_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", providers: [{ provider: "opencode", status: "completed", session_id: "s", ...(delivery_used === undefined ? {} : { delivery_used }), output: output(request.packet, "revise_required") }] }; } };
    const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker });
    const result = await facade.run(facade.prepare({ task_id: `delivery-${diagnostic.toLowerCase()}`, stage: "build-code", review_flow_id: "flow", host_provider: "codex", packet: packet({ root: tracking }), changed_file_root: tracking }));
    expect(result.provider_outcomes).toMatchObject([{ provider: "opencode", business_valid: false, semantic_verdict: null, diagnostic }]);
    expect(result.merged_findings).toEqual([]);
    expect(result.continuation_eligible).toBe(false);
  });

  it("stores actual delivery only in private state and rejects a changed continuation echo", async () => {
    const tracking = root(); let call = 0; let continuationPacket;
    const snapshot = { version: 4, capabilities: { attachments: true, cancel_source: true }, providers: [{ provider: "opencode", status: "ready", capabilities: { continuation: true, attachment_delivery: ["file_only", "always_embed"] } }] };
    const broker = { async discoverCapabilities() { return snapshot; }, async run(request) { call += 1; return { runtime_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", providers: [{ provider: "opencode", status: "completed", session_id: "s", delivery_used: call === 1 ? "always_embed" : "file_only", output: output(request.packet ?? continuationPacket, call === 1 ? "pass" : "revise_required") }] }; } };
    const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker }); const input = { task_id: "delivery-freeze", stage: "build-code", review_flow_id: "flow", host_provider: "codex", packet: packet({ root: tracking }), changed_file_root: tracking };
    const first = await facade.run(facade.prepare(input)); const publication = facade.publish(first, { items: [] });
    const privateReceipt = JSON.parse(readFileSync(first.receipt_draft_ref, "utf8"));
    expect(privateReceipt.initial_delivery_by_provider).toEqual({ opencode: "always_embed" });
    expect(privateReceipt.provider_outcomes[0].delivery_used).toBe("always_embed");
    expect(readFileSync(publication.core_receipt_ref, "utf8")).not.toMatch(/delivery_used|always_embed/);
    continuationPacket = input.packet; const second = await facade.run(facade.prepare({ ...input, continuation: true }));
    expect(second.provider_outcomes).toMatchObject([{ provider: "opencode", business_valid: false, semantic_verdict: null, diagnostic: "DELIVERY_USED_CONTINUATION_MISMATCH" }]);
    expect(second.merged_findings).toEqual([]);
    expect(second.continuation_eligible).toBe(false);
    expect(second.blocked_by_human_confirmation).toBe(true);
    expect(() => facade.publish(second, { items: [] })).toThrow(/human confirmation/);
  });

  it("reports every missing candidate and returns NO_CAPABLE_PROVIDER without broker semantics", async () => {
    const tracking = root(); const value = packet({ root: tracking }); let calls = 0;
    const ready = { version: 4, capabilities: { attachments: true, cancel_source: true }, providers: [
      { provider: "kimi", status: "ready", capabilities: { continuation: true, attachment_delivery: ["file_only"] } },
      { provider: "opencode", status: "ready", capabilities: { continuation: true, attachment_delivery: ["always_embed"] } },
    ] };
    const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: { async discoverCapabilities() { return ready; }, async run() { calls += 1; return { providers: [] }; } } });
    const missing = await facade.run(facade.prepare({ task_id: "missing-candidates", stage: "build-code", review_flow_id: "flow", host_provider: "codex", packet: value, changed_file_root: tracking }));
    expect(missing.provider_outcomes).toMatchObject([
      { provider: "kimi", business_valid: false, semantic_verdict: null, diagnostic: "PROVIDER_OUTCOME_MISSING" },
      { provider: "opencode", business_valid: false, semantic_verdict: null, diagnostic: "PROVIDER_OUTCOME_MISSING" },
    ]);
    const unavailable = { ...ready, providers: ready.providers.map((provider) => ({ ...provider, status: "unavailable" })) };
    const none = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: { async discoverCapabilities() { return unavailable; }, async run() { calls += 1; throw new Error("must not run"); } } });
    const result = await none.run(none.prepare({ task_id: "no-capable", stage: "build-code", review_flow_id: "flow", host_provider: "codex", packet: value, changed_file_root: tracking }));
    expect(result.provider_outcomes).toEqual([{ provider: null, transport_status: "failed", packet_status: "material_incomplete", semantic_verdict: null, business_valid: false, diagnostic: "NO_CAPABLE_PROVIDER" }]);
    expect(result.merged_findings).toEqual([]);
    expect(calls).toBe(1);
  });

  it("blocks continuation when the broker doctor snapshot changes", async () => {
    const tracking = root(); let snapshot = { version: 4, capabilities: { attachments: true, cancel_source: true }, providers: [{ provider: "opencode", status: "ready", capabilities: { continuation: true, attachment_delivery: ["file_only"] } }] };
    const broker = { async discoverCapabilities() { return snapshot; }, async run(request) { return { runtime_id: "99999999-9999-4999-8999-999999999999", providers: [{ provider: "opencode", status: "completed", session_id: "s", output: output(request.packet) }] }; } };
    const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker }); const input = { task_id: "cap-change", stage: "build-code", review_flow_id: "flow", packet: packet({ root: tracking }), changed_file_root: tracking };
    await facade.run(facade.prepare(input)); snapshot = { ...snapshot, providers: [{ ...snapshot.providers[0], status: "unavailable" }] };
    await expect(facade.prepare({ ...input, continuation: true })).rejects.toThrow(/blocked_by_human_confirmation.*snapshot changed/);
  });

  it("rejects a stage or track mutation after the packet is sealed", async () => {
    const tracking = root(); const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async () => ({ providers: [] })) });
    const prepared = await facade.prepare({ task_id: "t", stage: "build-code", review_flow_id: "flow", packet: packet({ root: tracking }), changed_file_root: tracking });
    prepared.packet.stage = "verify-code";
    await expect(facade.run(prepared)).rejects.toThrow(/sealed review packet was modified/);
  });

  it("reads attachments only from the private prepare snapshot", async () => {
    const tracking = root(); const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async () => ({ providers: [] })) });
    const contract = contractPathAndHash("build-code").contractPath; const original = readFileSync(contract, "utf8");
    const prepared = await facade.prepare({ task_id: "t", stage: "build-code", review_flow_id: "flow", packet: packet({ root: tracking }), changed_file_root: tracking });
    try {
      writeFileSync(contract, `${original}\n<!-- toctou-test -->\n`);
      const result = await facade.run(prepared);
      expect(result.provider_outcomes.every((item) => item.diagnostic === "PROVIDER_OUTCOME_MISSING")).toBe(true);
    }
    finally { writeFileSync(contract, original); }
  });

  it("does not aggregate cancelled, incomplete, or malformed results and requires a cancel source", async () => {
    const tracking = root();
    const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async (request) => ({ runtime_id: "33333333-3333-4333-8333-333333333333", providers: [
      { provider: "opencode", status: "cancelled", error: { code: "CANCELLED", source: "workflow_shutdown" } },
      { provider: "kimi", status: "completed", output: "not-json" },
      { provider: "codex", status: "completed", session_id: "s", output: output(request.packet, "revise_required") },
    ] })) });
    const result = await facade.run(facade.prepare({ task_id: "t", stage: "build-code", review_flow_id: "flow", host_provider: "claude-code", packet: packet({ root: tracking }), changed_file_root: tracking }));
    expect(result.provider_outcomes.map((item) => item.semantic_verdict)).toEqual([null, null, "revise_required"]);
    expect(result.merged_findings).toHaveLength(1);
    expect(result.hard_gates).toHaveLength(1);
    expect(() => facade.publish(result, { items: [{ finding_id: result.merged_findings[0].finding_id, action: "accept", evidence: "no" }] })).toThrow(/hard invariant/);
    const publication = facade.publish(result, { items: [{ finding_id: result.merged_findings[0].finding_id, action: "reject", evidence: "fix before merge" }] });
    expect(publication).toMatchObject({ semantic_verdict: "revise_required", core_receipt_hash: expect.stringMatching(/^[a-f0-9]{64}$/), needs_human: true });
    expect(JSON.parse(readFileSync(publication.core_receipt_ref, "utf8"))).toMatchObject({ semantic_verdict: "revise_required", needs_human: true });
    expect(JSON.parse(readFileSync(publication.stage_result_ref, "utf8"))).toMatchObject({ core_receipt_hash: publication.core_receipt_hash, verdict: "revise_required", needs_human: true });
  });

  it.each(["packet_hash", "manifest_hash", "diff_sha256", "contract_hash", "skill_bundle_hash"])("rejects a completed provider response whose %s attestation is tampered", async (field) => {
    const tracking = root();
    const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async (request) => {
      const tampered = JSON.parse(output(request.packet)); tampered[field] = "0".repeat(64);
      return { providers: [{ provider: "opencode", status: "completed", session_id: "s", output: JSON.stringify(tampered) }] };
    }) });
    const result = await facade.run(facade.prepare({ task_id: "tampered-output", stage: "build-code", review_flow_id: "flow", packet: packet({ root: tracking }), changed_file_root: tracking }));
    expect(result.provider_outcomes.find((item) => item.provider === "opencode")).toMatchObject({ provider: "opencode", transport_status: "completed", packet_status: "hash_mismatch", business_valid: false, semantic_verdict: null });
    expect(result.merged_findings).toEqual([]);
  });

  it("seals real diff, manifest, and changed-file bytes before broker dispatch", async () => {
    const tracking = root(); const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async () => ({ providers: [] })) });
    const badDiff = packet({ root: tracking }); badDiff.diff_sha256 = hash("not the diff");
    await expect(facade.prepare({ task_id: "t", stage: "build-code", review_flow_id: "flow", packet: badDiff, changed_file_root: tracking })).rejects.toThrow(/MATERIAL_INCOMPLETE.*diff_sha256/);
    const badFile = packet({ root: tracking }); badFile.changed_files[0].size = 2; refreshPacketHashes(badFile);
    await expect(facade.prepare({ task_id: "t", stage: "build-code", review_flow_id: "flow2", packet: badFile, changed_file_root: tracking })).rejects.toThrow(/MATERIAL_INCOMPLETE.*source evidence/);
    const fakeDiff = packet({ root: tracking }); fakeDiff.unified_diff = "diff --git a/other b/other\n"; refreshPacketHashes(fakeDiff);
    await expect(facade.prepare({ task_id: "t", stage: "build-code", review_flow_id: "flow3", packet: fakeDiff, changed_file_root: tracking })).rejects.toThrow(/MATERIAL_INCOMPLETE.*source evidence/);
  });

  it("accepts a JSON packet that spells non-renamed old_path as null", async () => {
    const tracking = root(); const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async () => ({ providers: [] })) });
    const value = packet({ root: tracking }); value.changed_files[0].old_path = null; refreshPacketHashes(value);
    const prepared = await facade.prepare({ task_id: "null-old-path", stage: "build-code", review_flow_id: "flow", packet: value, changed_file_root: tracking });
    rmSync(prepared.lock, { recursive: true, force: true });
  });

  it("rejects caller-provided snapshots instead of treating them as source evidence", () => {
    const tracking = root(); const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async () => ({ providers: [] })) });
    expect(() => facade.prepare({ task_id: "snapshot", stage: "build-code", review_flow_id: "flow", packet: packet({ root: tracking }), changed_file_root: tracking, source_snapshot: { base_files: {} } })).toThrow(/source_snapshot is not accepted/);
  });

  it("requires every declared continuable provider and serializes all flows for one task", async () => {
    const tracking = root(); const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: capabilityBroker(async (request) => ({ runtime_id: "44444444-4444-4444-8444-444444444444", providers: [{ provider: "opencode", status: "completed", session_id: "s", output: output(request.packet) }] }), { version: 4, capabilities: { attachments: true, cancel_source: true }, providers: [
      { provider: "opencode", status: "ready", capabilities: { continuation: true, attachment_delivery: ["file_only"] } },
      { provider: "kimi", status: "ready", capabilities: { continuation: true, attachment_delivery: ["file_only"] } },
    ] }) });
    const first = await facade.run(facade.prepare({ task_id: "t", stage: "build-code", review_flow_id: "flow", packet: packet({ root: tracking }), changed_file_root: tracking }));
    expect(first.continuation_eligible).toBe(false);
    await expect(facade.prepare({ task_id: "t", stage: "build-code", review_flow_id: "flow", packet: packet({ root: tracking }), changed_file_root: tracking, continuation: true })).rejects.toThrow(/blocked_by_human_confirmation/);
    const held = await facade.prepare({ task_id: "u", stage: "build-code", review_flow_id: "one", packet: packet({ root: tracking }), changed_file_root: tracking });
    expect(() => facade.prepare({ task_id: "u", stage: "build-code", review_flow_id: "two", packet: packet({ root: tracking }), changed_file_root: tracking })).toThrow(/review-already-running/);
    rmSync(held.lock, { recursive: true, force: true });
  });

  it("merges equivalent findings without dropping provider evidence or weakening severity", async () => {
    const tracking = root(); const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async (request) => ({ runtime_id: "55555555-5555-4555-8555-555555555555", providers: [
      { provider: "opencode", status: "completed", session_id: "o", output: output(request.packet, "revise_required", "minor") },
      { provider: "kimi", status: "completed", session_id: "k", output: output(request.packet, "revise_required", "blocking") },
    ] })) });
    const result = await facade.run(facade.prepare({ task_id: "t", stage: "build-code", review_flow_id: "flow", packet: packet({ root: tracking }), changed_file_root: tracking }));
    expect(result.merged_findings).toHaveLength(1); expect(result.merged_findings[0]).toMatchObject({ severity: "blocking", providers: ["kimi", "opencode"] }); expect(result.merged_findings[0].evidence_by_provider).toHaveLength(2);
  });

  it("records lock ownership, reclaims a proven-stale owner, and releases lock after prepare recovery errors", async () => {
    const tracking = root(); const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async () => ({ providers: [] })) });
    const input = { task_id: "t", stage: "build-code", review_flow_id: "flow", packet: packet({ root: tracking }), changed_file_root: tracking };
    const lock = join(tracking, "t", "reviews", "private", "flows", "t.lock");
    mkdirSync(join(tracking, "t", "reviews", "private", "flows", "t.lock"), { recursive: true }); writeFileSync(join(tracking, "t", "reviews", "private", "flows", "t.lock", "owner.json"), JSON.stringify({ pid: 999999, created_at_ms: 1, idempotency_key: "crashed" }), { flag: "w" });
    const prepared = await facade.prepare(input); const owner = JSON.parse(readFileSync(join(lock, "owner.json"), "utf8"));
    expect(owner).toMatchObject({ pid: process.pid, idempotency_key: expect.stringMatching(/^[a-f0-9]{64}$/) });
    const contender = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async () => ({ providers: [] })) });
    expect(() => contender.prepare({ ...input, review_flow_id: "contender", packet: packet({ root: tracking }) })).toThrow(/review-already-running/);
    rmSync(prepared.lock, { recursive: true, force: true });
    const broken = join(tracking, "broken", "reviews", "private", "round-crash");
    mkdirSync(broken, { recursive: true }); writeFileSync(join(broken, "projection-manifest.json"), "not-json", { flag: "w" }); writeFileSync(join(broken, "round-receipt.json"), "{}", { flag: "w" });
    const brokenInput = { ...input, task_id: "broken", review_flow_id: "next", packet: packet({ root: tracking }) };
    await expect(facade.prepare(brokenInput)).rejects.toThrow(/Unexpected token/);
    expect(() => readFileSync(join(tracking, "broken", "reviews", "private", "flows", "broken.lock", "owner.json"))).toThrow();
  });

  it("reclaims a lock whose PID is live but too new to own its recorded age", async () => {
    const tracking = root(); const facade = new ReviewRoundFacade({ taskTrackingRoot: tracking, broker: fakeBroker(async () => ({ providers: [] })) });
    const input = { task_id: "pid-reused", stage: "build-code", review_flow_id: "flow", packet: packet({ root: tracking }), changed_file_root: tracking };
    const lock = join(tracking, "pid-reused", "reviews", "private", "flows", "pid-reused.lock");
    mkdirSync(lock, { recursive: true }); writeFileSync(join(lock, "owner.json"), JSON.stringify({ pid: process.pid, process_start_identity: "a-reused-pid-cannot-own-this-lock", created_at_ms: 1, idempotency_key: "reused" }));
    const prepared = await facade.prepare(input);
    rmSync(prepared.lock, { recursive: true, force: true });
  });
});
